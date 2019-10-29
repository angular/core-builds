import { __read, __spread } from "tslib";
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
    var lView = getLView();
    var tView = lView[TVIEW];
    ngDevMode && assertDefined(tView, "tView should be defined");
    i18nIndexStack[++i18nIndexStackPointer] = index;
    // We need to delay projections until `i18nEnd`
    setDelayProjection(true);
    if (tView.firstTemplatePass && tView.data[index + HEADER_OFFSET] === null) {
        i18nStartFirstPass(lView, tView, index, message, subTemplateIndex);
    }
}
// Count for the number of vars that will be allocated for each i18n block.
// It is global because this is used in multiple functions that include loops and recursive calls.
// This is reset to 0 when `i18nStartFirstPass` is called.
var i18nVarsCount;
/**
 * See `i18nStart` above.
 */
function i18nStartFirstPass(lView, tView, index, message, subTemplateIndex) {
    var startIndex = tView.blueprint.length - HEADER_OFFSET;
    i18nVarsCount = 0;
    var previousOrParentTNode = getPreviousOrParentTNode();
    var parentTNode = getIsParent() ? previousOrParentTNode : previousOrParentTNode && previousOrParentTNode.parent;
    var parentIndex = parentTNode && parentTNode !== lView[T_HOST] ? parentTNode.index - HEADER_OFFSET : index;
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
        allocExpando(lView, i18nVarsCount);
    }
    ngDevMode &&
        attachI18nOpCodesDebug(createOpCodes, updateOpCodes, icuExpressions.length ? icuExpressions : null, lView);
    // NOTE: local var needed to properly assert the type of `TI18n`.
    var tI18n = {
        vars: i18nVarsCount,
        create: createOpCodes,
        update: updateOpCodes,
        icus: icuExpressions.length ? icuExpressions : null,
    };
    tView.data[index + HEADER_OFFSET] = tI18n;
}
function appendI18nNode(tNode, parentTNode, previousTNode, lView) {
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
    if (parentTNode !== lView[T_HOST]) {
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
        applyProjection(lView, tNode);
        return tNode;
    }
    appendChild(getNativeByTNode(tNode, lView), tNode, lView);
    var slotValue = lView[tNode.index];
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
            var _a = __read(placeholders[idx], 3), templateId = _a[0], isCloseTemplateTag = _a[1], placeholder = _a[2];
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
    var lView = getLView();
    var tView = lView[TVIEW];
    ngDevMode && assertDefined(tView, "tView should be defined");
    i18nEndFirstPass(lView, tView);
    // Stop delaying projections
    setDelayProjection(false);
}
/**
 * See `i18nEnd` above.
 */
function i18nEndFirstPass(lView, tView) {
    ngDevMode && assertEqual(getBindingIndex(), tView.bindingStartIndex, 'i18nEnd should be called before any binding');
    var rootIndex = i18nIndexStack[i18nIndexStackPointer--];
    var tI18n = tView.data[rootIndex + HEADER_OFFSET];
    ngDevMode && assertDefined(tI18n, "You should call i18nStart before i18nEnd");
    // Find the last node that was added before `i18nEnd`
    var lastCreatedNode = getPreviousOrParentTNode();
    // Read the instructions to insert/move/remove DOM elements
    var visitedNodes = readCreateOpCodes(rootIndex, tI18n.create, lView);
    // Remove deleted nodes
    var index = rootIndex + 1;
    while (index <= lastCreatedNode.index - HEADER_OFFSET) {
        if (visitedNodes.indexOf(index) === -1) {
            removeNode(index, lView, /* markAsDetached */ true);
        }
        // Check if an element has any local refs and skip them
        var tNode = getTNode(index, lView);
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
 */
function createDynamicNodeAtIndex(lView, index, type, native, name) {
    var previousOrParentTNode = getPreviousOrParentTNode();
    ngDevMode && assertDataInRange(lView, index + HEADER_OFFSET);
    lView[index + HEADER_OFFSET] = native;
    var tNode = getOrCreateTNode(lView[TVIEW], lView[T_HOST], index, type, name, null);
    // We are creating a dynamic node, the previous tNode might not be pointing at this node.
    // We will link ourselves into the tree later with `appendI18nNode`.
    if (previousOrParentTNode && previousOrParentTNode.next === tNode) {
        previousOrParentTNode.next = null;
    }
    return tNode;
}
function readCreateOpCodes(index, createOpCodes, lView) {
    var renderer = lView[RENDERER];
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
                createDynamicNodeAtIndex(lView, textNodeIndex, 3 /* Element */, textRNode, null);
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
                        destinationTNode = lView[T_HOST];
                    }
                    else {
                        destinationTNode = getTNode(destinationNodeIndex, lView);
                    }
                    ngDevMode &&
                        assertDefined(currentTNode, "You need to create or select a node before you can insert it into the DOM");
                    previousTNode = appendI18nNode(currentTNode, destinationTNode, previousTNode, lView);
                    break;
                case 0 /* Select */:
                    var nodeIndex = opCode >>> 3 /* SHIFT_REF */;
                    visitedNodes.push(nodeIndex);
                    previousTNode = currentTNode;
                    currentTNode = getTNode(nodeIndex, lView);
                    if (currentTNode) {
                        setPreviousOrParentTNode(currentTNode, currentTNode.type === 3 /* Element */);
                    }
                    break;
                case 5 /* ElementEnd */:
                    var elementIndex = opCode >>> 3 /* SHIFT_REF */;
                    previousTNode = currentTNode = getTNode(elementIndex, lView);
                    setPreviousOrParentTNode(currentTNode, false);
                    break;
                case 4 /* Attr */:
                    var elementNodeIndex = opCode >>> 3 /* SHIFT_REF */;
                    var attrName = createOpCodes[++i];
                    var attrValue = createOpCodes[++i];
                    // This code is used for ICU expressions only, since we don't support
                    // directives/components in ICUs, we don't need to worry about inputs here
                    elementAttributeInternal(elementNodeIndex, attrName, attrValue, lView);
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
                    currentTNode = createDynamicNodeAtIndex(lView, commentNodeIndex, 5 /* IcuContainer */, commentRNode, null);
                    visitedNodes.push(commentNodeIndex);
                    attachPatchData(commentRNode, lView);
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
                    currentTNode = createDynamicNodeAtIndex(lView, elementNodeIndex, 3 /* Element */, elementRNode, tagNameValue);
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
                                elementPropertyInternal(viewData, nodeIndex, propName, value, sanitizeFn);
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
                                                // Remove DOM element, but do *not* mark TNode as detached, since we are
                                                // just switching ICU cases (while keeping the same TNode), so a DOM element
                                                // representing a new ICU case will be re-created.
                                                removeNode(nodeIndex_1, viewData, /* markAsDetached */ false);
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
                                readCreateOpCodes(-1, tIcu.create[caseIndex], viewData);
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
function removeNode(index, viewData, markAsDetached) {
    var removedPhTNode = getTNode(index, viewData);
    var removedPhRNode = getNativeByIndex(index, viewData);
    if (removedPhRNode) {
        nativeRemoveNode(viewData[RENDERER], removedPhRNode);
    }
    var slotValue = load(viewData, index);
    if (isLContainer(slotValue)) {
        var lContainer = slotValue;
        if (removedPhTNode.type !== 0 /* Container */) {
            nativeRemoveNode(viewData[RENDERER], lContainer[NATIVE]);
        }
    }
    if (markAsDetached) {
        // Define this node as detached to avoid projecting it later
        removedPhTNode.flags |= 128 /* isDetached */;
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
    var lView = getLView();
    var tView = lView[TVIEW];
    ngDevMode && assertDefined(tView, "tView should be defined");
    i18nAttributesFirstPass(lView, tView, index, values);
}
/**
 * See `i18nAttributes` above.
 */
function i18nAttributesFirstPass(lView, tView, index, values) {
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
                    elementAttributeInternal(previousElementIndex, attrName, value, lView);
                    // Check if that attribute is a directive input
                    var tNode = getTNode(previousElementIndex, lView);
                    var dataValue = tNode.inputs && tNode.inputs[attrName];
                    if (dataValue) {
                        setInputsForProperty(lView, dataValue, value);
                        if (ngDevMode) {
                            var element = getNativeByIndex(previousElementIndex, lView);
                            setNgReflectProperties(lView, element, tNode.type, dataValue, value);
                        }
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
        var bindingsStartIndex = getBindingIndex() - shiftsCounter - 1;
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
    i18nVarsCount += Math.max.apply(Math, __spread(vars));
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
            icuCase.vars += Math.max.apply(Math, __spread(tIcus[nestTIcuIndex].vars));
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
/**
 * The locale id that the application is currently using (for translations and ICU expressions).
 * This is the ivy version of `LOCALE_ID` that was defined as an injection token for the view engine
 * but is now defined as a global value.
 */
var LOCALE_ID = DEFAULT_LOCALE_ID;
/**
 * Sets the locale id that will be used for translations and ICU expressions.
 * This is the ivy version of `LOCALE_ID` that was defined as an injection token for the view engine
 * but is now defined as a global value.
 *
 * @param localeId
 */
export function setLocaleId(localeId) {
    assertDefined(localeId, "Expected localeId to be defined");
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaTE4bi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaTE4bi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7OztHQU1HO0FBQ0gsT0FBTyw4QkFBOEIsQ0FBQztBQUV0QyxPQUFPLEVBQUMsaUJBQWlCLEVBQUUsYUFBYSxFQUFDLE1BQU0sc0JBQXNCLENBQUM7QUFDdEUsT0FBTyxFQUFDLFlBQVksRUFBRSxTQUFTLEVBQUUsV0FBVyxFQUFFLGNBQWMsRUFBRSxrQkFBa0IsRUFBQyxNQUFNLGdDQUFnQyxDQUFDO0FBQ3hILE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSw0QkFBNEIsQ0FBQztBQUMzRCxPQUFPLEVBQUMsWUFBWSxFQUFFLGNBQWMsRUFBQyxNQUFNLCtCQUErQixDQUFDO0FBQzNFLE9BQU8sRUFBQyxhQUFhLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUNsRCxPQUFPLEVBQUMsaUJBQWlCLEVBQUUsYUFBYSxFQUFFLFdBQVcsRUFBRSxpQkFBaUIsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBRWhHLE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxZQUFZLENBQUM7QUFDMUMsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBQ3BELE9BQU8sRUFBQyxrQkFBa0IsRUFBQyxNQUFNLG9CQUFvQixDQUFDO0FBQ3RELE9BQU8sRUFBQyxzQkFBc0IsRUFBQyxNQUFNLDRCQUE0QixDQUFDO0FBQ2xFLE9BQU8sRUFBbUIsWUFBWSxFQUFFLHdCQUF3QixFQUFFLHVCQUF1QixFQUFFLGdCQUFnQixFQUFFLG9CQUFvQixFQUFFLHNCQUFzQixFQUFFLG1CQUFtQixFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDN00sT0FBTyxFQUFhLE1BQU0sRUFBQyxNQUFNLHdCQUF3QixDQUFDO0FBQzFELE9BQU8sRUFBQyxjQUFjLEVBQUUs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QztZQUNuQixPQUFPLENBQUMsTUFBTSxDQUFDLElBQUksQ0FDZixhQUFhLHFCQUE4QiwwQkFBbUMsRUFDOUUsa0JBQWtCLHFCQUE4QixpQkFBMEIsQ0FBQyxDQUFDO1NBQ2pGO0tBQ0Y7QUFDSCxDQUFDO0FBRUQ7Ozs7OztHQU1HO0FBQ0gsSUFBTSxtQkFBbUIsR0FBRyxTQUFTLENBQUM7QUFDdEMsU0FBUyxXQUFXLENBQUMsS0FBYTtJQUNoQyxPQUFPLEtBQUssQ0FBQyxPQUFPLENBQUMsbUJBQW1CLEVBQUUsR0FBRyxDQUFDLENBQUM7QUFDakQsQ0FBQztBQUVEOzs7O0dBSUc7QUFDSCxJQUFJLFNBQVMsR0FBRyxpQkFBaUIsQ0FBQztBQUVsQzs7Ozs7O0dBTUc7QUFDSCxNQUFNLFVBQVUsV0FBVyxDQUFDLFFBQWdCO0lBQzFDLGFBQWEsQ0FBQyxRQUFRLEVBQUUsaUNBQWlDLENBQUMsQ0FBQztJQUMzRCxJQUFJLE9BQU8sUUFBUSxLQUFLLFFBQVEsRUFBRTtRQUNoQyxTQUFTLEdBQUcsUUFBUSxDQUFDLFdBQVcsRUFBRSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUM7S0FDdkQ7QUFDSCxDQUFDO0FBRUQ7Ozs7R0FJRztBQUNILE1BQU0sVUFBVSxXQUFXO0lBQ3pCLE9BQU8sU0FBUyxDQUFDO0FBQ25CLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5pbXBvcnQgJy4uL3V0aWwvbmdfaTE4bl9jbG9zdXJlX21vZGUnO1xuXG5pbXBvcnQge0RFRkFVTFRfTE9DQUxFX0lELCBnZXRQbHVyYWxDYXNlfSBmcm9tICcuLi9pMThuL2xvY2FsaXphdGlvbic7XG5pbXBvcnQge1NSQ1NFVF9BVFRSUywgVVJJX0FUVFJTLCBWQUxJRF9BVFRSUywgVkFMSURfRUxFTUVOVFMsIGdldFRlbXBsYXRlQ29udGVudH0gZnJvbSAnLi4vc2FuaXRpemF0aW9uL2h0bWxfc2FuaXRpemVyJztcbmltcG9ydCB7SW5lcnRCb2R5SGVscGVyfSBmcm9tICcuLi9zYW5pdGl6YXRpb24vaW5lcnRfYm9keSc7XG5pbXBvcnQge19zYW5pdGl6ZVVybCwgc2FuaXRpemVTcmNzZXR9IGZyb20gJy4uL3Nhbml0aXphdGlvbi91cmxfc2FuaXRpemVyJztcbmltcG9ydCB7YWRkQWxsVG9BcnJheX0gZnJvbSAnLi4vdXRpbC9hcnJheV91dGlscyc7XG5pbXBvcnQge2Fzc2VydERhdGFJblJhbmdlLCBhc3NlcnREZWZpbmVkLCBhc3NlcnRFcXVhbCwgYXNzZXJ0R3JlYXRlclRoYW59IGZyb20gJy4uL3V0aWwvYXNzZXJ0JztcblxuaW1wb3J0IHtiaW5kaW5nVXBkYXRlZH0gZnJvbSAnLi9iaW5kaW5ncyc7XG5pbXBvcnQge2F0dGFjaFBhdGNoRGF0YX0gZnJvbSAnLi9jb250ZXh0X2Rpc2NvdmVyeSc7XG5pbXBvcnQge3NldERlbGF5UHJvamVjdGlvbn0gZnJvbSAnLi9pbnN0cnVjdGlvbnMvYWxsJztcbmltcG9ydCB7YXR0YWNoSTE4bk9wQ29kZXNEZWJ1Z30gZnJvbSAnLi9pbnN0cnVjdGlvbnMvbHZpZXdfZGVidWcnO1xuaW1wb3J0IHtUc2lja2xlSXNzdWUxMDA5LCBhbGxvY0V4cGFuZG8sIGVsZW1lbnRBdHRyaWJ1dGVJbnRlcm5hbCwgZWxlbWVudFByb3BlcnR5SW50ZXJuYWwsIGdldE9yQ3JlYXRlVE5vZGUsIHNldElucHV0c0ZvclByb3BlcnR5LCBzZXROZ1JlZmxlY3RQcm9wZXJ0aWVzLCB0ZXh0QmluZGluZ0ludGVybmFsfSBmcm9tICcuL2luc3RydWN0aW9ucy9zaGFyZWQnO1xuaW1wb3J0IHtMQ29udGFpbmVyLCBOQVRJVkV9IGZyb20gJy4vaW50ZXJmYWNlcy9jb250YWluZXInO1xuaW1wb3J0IHtDT01NRU5UX01BUktFUiwgRUxFTUVOVF9NQVJLRVIsIEkxOG5NdXRhdGVPcENvZGUsIEkxOG5NdXRhdGVPcENvZGVzLCBJMThuVXBkYXRlT3BDb2RlLCBJMThuVXBkYXRlT3BDb2RlcywgSWN1VHlwZSwgVEkxOG4sIFRJY3V9IGZyb20gJy4vaW50ZXJmYWNlcy9pMThuJztcbmltcG9ydCB7VEVsZW1lbnROb2RlLCBUSWN1Q29udGFpbmVyTm9kZSwgVE5vZGUsIFROb2RlRmxhZ3MsIFROb2RlVHlwZSwgVFByb2plY3Rpb25Ob2RlfSBmcm9tICcuL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge1JDb21tZW50LCBSRWxlbWVudCwgUlRleHR9IGZyb20gJy4vaW50ZXJmYWNlcy9yZW5kZXJlcic7XG5pbXBvcnQge1Nhbml0aXplckZufSBmcm9tICcuL2ludGVyZmFjZXMvc2FuaXRpemF0aW9uJztcbmltcG9ydCB7aXNMQ29udGFpbmVyfSBmcm9tICcuL2ludGVyZmFjZXMvdHlwZV9jaGVja3MnO1xuaW1wb3J0IHtIRUFERVJfT0ZGU0VULCBMVmlldywgUkVOREVSRVIsIFRWSUVXLCBUVmlldywgVF9IT1NUfSBmcm9tICcuL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2FwcGVuZENoaWxkLCBhcHBseVByb2plY3Rpb24sIGNyZWF0ZVRleHROb2RlLCBuYXRpdmVSZW1vdmVOb2RlfSBmcm9tICcuL25vZGVfbWFuaXB1bGF0aW9uJztcbmltcG9ydCB7Z2V0QmluZGluZ0luZGV4LCBnZXRJc1BhcmVudCwgZ2V0TFZpZXcsIGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSwgbmV4dEJpbmRpbmdJbmRleCwgc2V0SXNOb3RQYXJlbnQsIHNldFByZXZpb3VzT3JQYXJlbnRUTm9kZX0gZnJvbSAnLi9zdGF0ZSc7XG5pbXBvcnQge3JlbmRlclN0cmluZ2lmeX0gZnJvbSAnLi91dGlsL21pc2NfdXRpbHMnO1xuaW1wb3J0IHtnZXROYXRpdmVCeUluZGV4LCBnZXROYXRpdmVCeVROb2RlLCBnZXRUTm9kZSwgbG9hZH0gZnJvbSAnLi91dGlsL3ZpZXdfdXRpbHMnO1xuXG5cbmNvbnN0IE1BUktFUiA9IGDvv71gO1xuY29uc3QgSUNVX0JMT0NLX1JFR0VYUCA9IC9eXFxzKijvv71cXGQrOj9cXGQq77+9KVxccyosXFxzKihzZWxlY3R8cGx1cmFsKVxccyosLztcbmNvbnN0IFNVQlRFTVBMQVRFX1JFR0VYUCA9IC/vv71cXC8/XFwqKFxcZCs6XFxkKynvv70vZ2k7XG5jb25zdCBQSF9SRUdFWFAgPSAv77+9KFxcLz9bIyohXVxcZCspOj9cXGQq77+9L2dpO1xuY29uc3QgQklORElOR19SRUdFWFAgPSAv77+9KFxcZCspOj9cXGQq77+9L2dpO1xuY29uc3QgSUNVX1JFR0VYUCA9IC8oe1xccyrvv71cXGQrOj9cXGQq77+9XFxzKixcXHMqXFxTezZ9XFxzKixbXFxzXFxTXSp9KS9naTtcbmNvbnN0IGVudW0gVGFnVHlwZSB7XG4gIEVMRU1FTlQgPSAnIycsXG4gIFRFTVBMQVRFID0gJyonLFxuICBQUk9KRUNUSU9OID0gJyEnLFxufVxuXG4vLyBpMThuUG9zdHByb2Nlc3MgY29uc3RzXG5jb25zdCBST09UX1RFTVBMQVRFX0lEID0gMDtcbmNvbnN0IFBQX01VTFRJX1ZBTFVFX1BMQUNFSE9MREVSU19SRUdFWFAgPSAvXFxbKO+/vS4rP++/vT8pXFxdLztcbmNvbnN0IFBQX1BMQUNFSE9MREVSU19SRUdFWFAgPSAvXFxbKO+/vS4rP++/vT8pXFxdfCjvv71cXC8/XFwqXFxkKzpcXGQr77+9KS9nO1xuY29uc3QgUFBfSUNVX1ZBUlNfUkVHRVhQID0gLyh7XFxzKikoVkFSXyhQTFVSQUx8U0VMRUNUKShfXFxkKyk/KShcXHMqLCkvZztcbmNvbnN0IFBQX0lDVV9QTEFDRUhPTERFUlNfUkVHRVhQID0gL3soW0EtWjAtOV9dKyl9L2c7XG5jb25zdCBQUF9JQ1VTX1JFR0VYUCA9IC/vv71JMThOX0VYUF8oSUNVKF9cXGQrKT8p77+9L2c7XG5jb25zdCBQUF9DTE9TRV9URU1QTEFURV9SRUdFWFAgPSAvXFwvXFwqLztcbmNvbnN0IFBQX1RFTVBMQVRFX0lEX1JFR0VYUCA9IC9cXGQrXFw6KFxcZCspLztcblxuLy8gUGFyc2VkIHBsYWNlaG9sZGVyIHN0cnVjdHVyZSB1c2VkIGluIHBvc3Rwcm9jZXNzaW5nICh3aXRoaW4gYGkxOG5Qb3N0cHJvY2Vzc2AgZnVuY3Rpb24pXG4vLyBDb250YWlucyB0aGUgZm9sbG93aW5nIGZpZWxkczogW3RlbXBsYXRlSWQsIGlzQ2xvc2VUZW1wbGF0ZVRhZywgcGxhY2Vob2xkZXJdXG50eXBlIFBvc3Rwcm9jZXNzUGxhY2Vob2xkZXIgPSBbbnVtYmVyLCBib29sZWFuLCBzdHJpbmddO1xuXG5pbnRlcmZhY2UgSWN1RXhwcmVzc2lvbiB7XG4gIHR5cGU6IEljdVR5cGU7XG4gIG1haW5CaW5kaW5nOiBudW1iZXI7XG4gIGNhc2VzOiBzdHJpbmdbXTtcbiAgdmFsdWVzOiAoc3RyaW5nfEljdUV4cHJlc3Npb24pW11bXTtcbn1cblxuaW50ZXJmYWNlIEljdUNhc2Uge1xuICAvKipcbiAgICogTnVtYmVyIG9mIHNsb3RzIHRvIGFsbG9jYXRlIGluIGV4cGFuZG8gZm9yIHRoaXMgY2FzZS5cbiAgICpcbiAgICogVGhpcyBpcyB0aGUgbWF4IG51bWJlciBvZiBET00gZWxlbWVudHMgd2hpY2ggd2lsbCBiZSBjcmVhdGVkIGJ5IHRoaXMgaTE4biArIElDVSBibG9ja3MuIFdoZW5cbiAgICogdGhlIERPTSBlbGVtZW50cyBhcmUgYmVpbmcgY3JlYXRlZCB0aGV5IGFyZSBzdG9yZWQgaW4gdGhlIEVYUEFORE8sIHNvIHRoYXQgdXBkYXRlIE9wQ29kZXMgY2FuXG4gICAqIHdyaXRlIGludG8gdGhlbS5cbiAgICovXG4gIHZhcnM6IG51bWJlcjtcblxuICAvKipcbiAgICogQW4gb3B0aW9uYWwgYXJyYXkgb2YgY2hpbGQvc3ViIElDVXMuXG4gICAqL1xuICBjaGlsZEljdXM6IG51bWJlcltdO1xuXG4gIC8qKlxuICAgKiBBIHNldCBvZiBPcENvZGVzIHRvIGFwcGx5IGluIG9yZGVyIHRvIGJ1aWxkIHVwIHRoZSBET00gcmVuZGVyIHRyZWUgZm9yIHRoZSBJQ1VcbiAgICovXG4gIGNyZWF0ZTogSTE4bk11dGF0ZU9wQ29kZXM7XG5cbiAgLyoqXG4gICAqIEEgc2V0IG9mIE9wQ29kZXMgdG8gYXBwbHkgaW4gb3JkZXIgdG8gZGVzdHJveSB0aGUgRE9NIHJlbmRlciB0cmVlIGZvciB0aGUgSUNVLlxuICAgKi9cbiAgcmVtb3ZlOiBJMThuTXV0YXRlT3BDb2RlcztcblxuICAvKipcbiAgICogQSBzZXQgb2YgT3BDb2RlcyB0byBhcHBseSBpbiBvcmRlciB0byB1cGRhdGUgdGhlIERPTSByZW5kZXIgdHJlZSBmb3IgdGhlIElDVSBiaW5kaW5ncy5cbiAgICovXG4gIHVwZGF0ZTogSTE4blVwZGF0ZU9wQ29kZXM7XG59XG5cbi8qKlxuICogQnJlYWtzIHBhdHRlcm4gaW50byBzdHJpbmdzIGFuZCB0b3AgbGV2ZWwgey4uLn0gYmxvY2tzLlxuICogQ2FuIGJlIHVzZWQgdG8gYnJlYWsgYSBtZXNzYWdlIGludG8gdGV4dCBhbmQgSUNVIGV4cHJlc3Npb25zLCBvciB0byBicmVhayBhbiBJQ1UgZXhwcmVzc2lvbiBpbnRvXG4gKiBrZXlzIGFuZCBjYXNlcy5cbiAqIE9yaWdpbmFsIGNvZGUgZnJvbSBjbG9zdXJlIGxpYnJhcnksIG1vZGlmaWVkIGZvciBBbmd1bGFyLlxuICpcbiAqIEBwYXJhbSBwYXR0ZXJuIChzdWIpUGF0dGVybiB0byBiZSBicm9rZW4uXG4gKlxuICovXG5mdW5jdGlvbiBleHRyYWN0UGFydHMocGF0dGVybjogc3RyaW5nKTogKHN0cmluZyB8IEljdUV4cHJlc3Npb24pW10ge1xuICBpZiAoIXBhdHRlcm4pIHtcbiAgICByZXR1cm4gW107XG4gIH1cblxuICBsZXQgcHJldlBvcyA9IDA7XG4gIGNvbnN0IGJyYWNlU3RhY2sgPSBbXTtcbiAgY29uc3QgcmVzdWx0czogKHN0cmluZyB8IEljdUV4cHJlc3Npb24pW10gPSBbXTtcbiAgY29uc3QgYnJhY2VzID0gL1t7fV0vZztcbiAgLy8gbGFzdEluZGV4IGRvZXNuJ3QgZ2V0IHNldCB0byAwIHNvIHdlIGhhdmUgdG8uXG4gIGJyYWNlcy5sYXN0SW5kZXggPSAwO1xuXG4gIGxldCBtYXRjaDtcbiAgd2hpbGUgKG1hdGNoID0gYnJhY2VzLmV4ZWMocGF0dGVybikpIHtcbiAgICBjb25zdCBwb3MgPSBtYXRjaC5pbmRleDtcbiAgICBpZiAobWF0Y2hbMF0gPT0gJ30nKSB7XG4gICAgICBicmFjZVN0YWNrLnBvcCgpO1xuXG4gICAgICBpZiAoYnJhY2VTdGFjay5sZW5ndGggPT0gMCkge1xuICAgICAgICAvLyBFbmQgb2YgdGhlIGJsb2NrLlxuICAgICAgICBjb25zdCBibG9jayA9IHBhdHRlcm4uc3Vic3RyaW5nKHByZXZQb3MsIHBvcyk7XG4gICAgICAgIGlmIChJQ1VfQkxPQ0tfUkVHRVhQLnRlc3QoYmxvY2spKSB7XG4gICAgICAgICAgcmVzdWx0cy5wdXNoKHBhcnNlSUNVQmxvY2soYmxvY2spKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXN1bHRzLnB1c2goYmxvY2spO1xuICAgICAgICB9XG5cbiAgICAgICAgcHJldlBvcyA9IHBvcyArIDE7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChicmFjZVN0YWNrLmxlbmd0aCA9PSAwKSB7XG4gICAgICAgIGNvbnN0IHN1YnN0cmluZyA9IHBhdHRlcm4uc3Vic3RyaW5nKHByZXZQb3MsIHBvcyk7XG4gICAgICAgIHJlc3VsdHMucHVzaChzdWJzdHJpbmcpO1xuICAgICAgICBwcmV2UG9zID0gcG9zICsgMTtcbiAgICAgIH1cbiAgICAgIGJyYWNlU3RhY2sucHVzaCgneycpO1xuICAgIH1cbiAgfVxuXG4gIGNvbnN0IHN1YnN0cmluZyA9IHBhdHRlcm4uc3Vic3RyaW5nKHByZXZQb3MpO1xuICByZXN1bHRzLnB1c2goc3Vic3RyaW5nKTtcbiAgcmV0dXJuIHJlc3VsdHM7XG59XG5cbi8qKlxuICogUGFyc2VzIHRleHQgY29udGFpbmluZyBhbiBJQ1UgZXhwcmVzc2lvbiBhbmQgcHJvZHVjZXMgYSBKU09OIG9iamVjdCBmb3IgaXQuXG4gKiBPcmlnaW5hbCBjb2RlIGZyb20gY2xvc3VyZSBsaWJyYXJ5LCBtb2RpZmllZCBmb3IgQW5ndWxhci5cbiAqXG4gKiBAcGFyYW0gcGF0dGVybiBUZXh0IGNvbnRhaW5pbmcgYW4gSUNVIGV4cHJlc3Npb24gdGhhdCBuZWVkcyB0byBiZSBwYXJzZWQuXG4gKlxuICovXG5mdW5jdGlvbiBwYXJzZUlDVUJsb2NrKHBhdHRlcm46IHN0cmluZyk6IEljdUV4cHJlc3Npb24ge1xuICBjb25zdCBjYXNlcyA9IFtdO1xuICBjb25zdCB2YWx1ZXM6IChzdHJpbmcgfCBJY3VFeHByZXNzaW9uKVtdW10gPSBbXTtcbiAgbGV0IGljdVR5cGUgPSBJY3VUeXBlLnBsdXJhbDtcbiAgbGV0IG1haW5CaW5kaW5nID0gMDtcbiAgcGF0dGVybiA9IHBhdHRlcm4ucmVwbGFjZShJQ1VfQkxPQ0tfUkVHRVhQLCBmdW5jdGlvbihzdHI6IHN0cmluZywgYmluZGluZzogc3RyaW5nLCB0eXBlOiBzdHJpbmcpIHtcbiAgICBpZiAodHlwZSA9PT0gJ3NlbGVjdCcpIHtcbiAgICAgIGljdVR5cGUgPSBJY3VUeXBlLnNlbGVjdDtcbiAgICB9IGVsc2Uge1xuICAgICAgaWN1VHlwZSA9IEljdVR5cGUucGx1cmFsO1xuICAgIH1cbiAgICBtYWluQmluZGluZyA9IHBhcnNlSW50KGJpbmRpbmcuc3Vic3RyKDEpLCAxMCk7XG4gICAgcmV0dXJuICcnO1xuICB9KTtcblxuICBjb25zdCBwYXJ0cyA9IGV4dHJhY3RQYXJ0cyhwYXR0ZXJuKSBhcyBzdHJpbmdbXTtcbiAgLy8gTG9va2luZyBmb3IgKGtleSBibG9jaykrIHNlcXVlbmNlLiBPbmUgb2YgdGhlIGtleXMgaGFzIHRvIGJlIFwib3RoZXJcIi5cbiAgZm9yIChsZXQgcG9zID0gMDsgcG9zIDwgcGFydHMubGVuZ3RoOykge1xuICAgIGxldCBrZXkgPSBwYXJ0c1twb3MrK10udHJpbSgpO1xuICAgIGlmIChpY3VUeXBlID09PSBJY3VUeXBlLnBsdXJhbCkge1xuICAgICAgLy8gS2V5IGNhbiBiZSBcIj14XCIsIHdlIGp1c3Qgd2FudCBcInhcIlxuICAgICAga2V5ID0ga2V5LnJlcGxhY2UoL1xccyooPzo9KT8oXFx3KylcXHMqLywgJyQxJyk7XG4gICAgfVxuICAgIGlmIChrZXkubGVuZ3RoKSB7XG4gICAgICBjYXNlcy5wdXNoKGtleSk7XG4gICAgfVxuXG4gICAgY29uc3QgYmxvY2tzID0gZXh0cmFjdFBhcnRzKHBhcnRzW3BvcysrXSkgYXMgc3RyaW5nW107XG4gICAgaWYgKGNhc2VzLmxlbmd0aCA+IHZhbHVlcy5sZW5ndGgpIHtcbiAgICAgIHZhbHVlcy5wdXNoKGJsb2Nrcyk7XG4gICAgfVxuICB9XG5cbiAgYXNzZXJ0R3JlYXRlclRoYW4oY2FzZXMuaW5kZXhPZignb3RoZXInKSwgLTEsICdNaXNzaW5nIGtleSBcIm90aGVyXCIgaW4gSUNVIHN0YXRlbWVudC4nKTtcbiAgLy8gVE9ETyhvY29tYmUpOiBzdXBwb3J0IElDVSBleHByZXNzaW9ucyBpbiBhdHRyaWJ1dGVzLCBzZWUgIzIxNjE1XG4gIHJldHVybiB7dHlwZTogaWN1VHlwZSwgbWFpbkJpbmRpbmc6IG1haW5CaW5kaW5nLCBjYXNlcywgdmFsdWVzfTtcbn1cblxuLyoqXG4gKiBSZW1vdmVzIGV2ZXJ5dGhpbmcgaW5zaWRlIHRoZSBzdWItdGVtcGxhdGVzIG9mIGEgbWVzc2FnZS5cbiAqL1xuZnVuY3Rpb24gcmVtb3ZlSW5uZXJUZW1wbGF0ZVRyYW5zbGF0aW9uKG1lc3NhZ2U6IHN0cmluZyk6IHN0cmluZyB7XG4gIGxldCBtYXRjaDtcbiAgbGV0IHJlcyA9ICcnO1xuICBsZXQgaW5kZXggPSAwO1xuICBsZXQgaW5UZW1wbGF0ZSA9IGZhbHNlO1xuICBsZXQgdGFnTWF0Y2hlZDtcblxuICB3aGlsZSAoKG1hdGNoID0gU1VCVEVNUExBVEVfUkVHRVhQLmV4ZWMobWVzc2FnZSkpICE9PSBudWxsKSB7XG4gICAgaWYgKCFpblRlbXBsYXRlKSB7XG4gICAgICByZXMgKz0gbWVzc2FnZS5zdWJzdHJpbmcoaW5kZXgsIG1hdGNoLmluZGV4ICsgbWF0Y2hbMF0ubGVuZ3RoKTtcbiAgICAgIHRhZ01hdGNoZWQgPSBtYXRjaFsxXTtcbiAgICAgIGluVGVtcGxhdGUgPSB0cnVlO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAobWF0Y2hbMF0gPT09IGAke01BUktFUn0vKiR7dGFnTWF0Y2hlZH0ke01BUktFUn1gKSB7XG4gICAgICAgIGluZGV4ID0gbWF0Y2guaW5kZXg7XG4gICAgICAgIGluVGVtcGxhdGUgPSBmYWxzZTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBuZ0Rldk1vZGUgJiZcbiAgICAgIGFzc2VydEVxdWFsKFxuICAgICAgICAgIGluVGVtcGxhdGUsIGZhbHNlLFxuICAgICAgICAgIGBUYWcgbWlzbWF0Y2g6IHVuYWJsZSB0byBmaW5kIHRoZSBlbmQgb2YgdGhlIHN1Yi10ZW1wbGF0ZSBpbiB0aGUgdHJhbnNsYXRpb24gXCIke21lc3NhZ2V9XCJgKTtcblxuICByZXMgKz0gbWVzc2FnZS5zdWJzdHIoaW5kZXgpO1xuICByZXR1cm4gcmVzO1xufVxuXG4vKipcbiAqIEV4dHJhY3RzIGEgcGFydCBvZiBhIG1lc3NhZ2UgYW5kIHJlbW92ZXMgdGhlIHJlc3QuXG4gKlxuICogVGhpcyBtZXRob2QgaXMgdXNlZCBmb3IgZXh0cmFjdGluZyBhIHBhcnQgb2YgdGhlIG1lc3NhZ2UgYXNzb2NpYXRlZCB3aXRoIGEgdGVtcGxhdGUuIEEgdHJhbnNsYXRlZFxuICogbWVzc2FnZSBjYW4gc3BhbiBtdWx0aXBsZSB0ZW1wbGF0ZXMuXG4gKlxuICogRXhhbXBsZTpcbiAqIGBgYFxuICogPGRpdiBpMThuPlRyYW5zbGF0ZSA8c3BhbiAqbmdJZj5tZTwvc3Bhbj4hPC9kaXY+XG4gKiBgYGBcbiAqXG4gKiBAcGFyYW0gbWVzc2FnZSBUaGUgbWVzc2FnZSB0byBjcm9wXG4gKiBAcGFyYW0gc3ViVGVtcGxhdGVJbmRleCBJbmRleCBvZiB0aGUgc3ViLXRlbXBsYXRlIHRvIGV4dHJhY3QuIElmIHVuZGVmaW5lZCBpdCByZXR1cm5zIHRoZVxuICogZXh0ZXJuYWwgdGVtcGxhdGUgYW5kIHJlbW92ZXMgYWxsIHN1Yi10ZW1wbGF0ZXMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRUcmFuc2xhdGlvbkZvclRlbXBsYXRlKG1lc3NhZ2U6IHN0cmluZywgc3ViVGVtcGxhdGVJbmRleD86IG51bWJlcikge1xuICBpZiAodHlwZW9mIHN1YlRlbXBsYXRlSW5kZXggIT09ICdudW1iZXInKSB7XG4gICAgLy8gV2Ugd2FudCB0aGUgcm9vdCB0ZW1wbGF0ZSBtZXNzYWdlLCBpZ25vcmUgYWxsIHN1Yi10ZW1wbGF0ZXNcbiAgICByZXR1cm4gcmVtb3ZlSW5uZXJUZW1wbGF0ZVRyYW5zbGF0aW9uKG1lc3NhZ2UpO1xuICB9IGVsc2Uge1xuICAgIC8vIFdlIHdhbnQgYSBzcGVjaWZpYyBzdWItdGVtcGxhdGVcbiAgICBjb25zdCBzdGFydCA9XG4gICAgICAgIG1lc3NhZ2UuaW5kZXhPZihgOiR7c3ViVGVtcGxhdGVJbmRleH0ke01BUktFUn1gKSArIDIgKyBzdWJUZW1wbGF0ZUluZGV4LnRvU3RyaW5nKCkubGVuZ3RoO1xuICAgIGNvbnN0IGVuZCA9IG1lc3NhZ2Uuc2VhcmNoKG5ldyBSZWdFeHAoYCR7TUFSS0VSfVxcXFwvXFxcXCpcXFxcZCs6JHtzdWJUZW1wbGF0ZUluZGV4fSR7TUFSS0VSfWApKTtcbiAgICByZXR1cm4gcmVtb3ZlSW5uZXJUZW1wbGF0ZVRyYW5zbGF0aW9uKG1lc3NhZ2Uuc3Vic3RyaW5nKHN0YXJ0LCBlbmQpKTtcbiAgfVxufVxuXG4vKipcbiAqIEdlbmVyYXRlIHRoZSBPcENvZGVzIHRvIHVwZGF0ZSB0aGUgYmluZGluZ3Mgb2YgYSBzdHJpbmcuXG4gKlxuICogQHBhcmFtIHN0ciBUaGUgc3RyaW5nIGNvbnRhaW5pbmcgdGhlIGJpbmRpbmdzLlxuICogQHBhcmFtIGRlc3RpbmF0aW9uTm9kZSBJbmRleCBvZiB0aGUgZGVzdGluYXRpb24gbm9kZSB3aGljaCB3aWxsIHJlY2VpdmUgdGhlIGJpbmRpbmcuXG4gKiBAcGFyYW0gYXR0ck5hbWUgTmFtZSBvZiB0aGUgYXR0cmlidXRlLCBpZiB0aGUgc3RyaW5nIGJlbG9uZ3MgdG8gYW4gYXR0cmlidXRlLlxuICogQHBhcmFtIHNhbml0aXplRm4gU2FuaXRpemF0aW9uIGZ1bmN0aW9uIHVzZWQgdG8gc2FuaXRpemUgdGhlIHN0cmluZyBhZnRlciB1cGRhdGUsIGlmIG5lY2Vzc2FyeS5cbiAqL1xuZnVuY3Rpb24gZ2VuZXJhdGVCaW5kaW5nVXBkYXRlT3BDb2RlcyhcbiAgICBzdHI6IHN0cmluZywgZGVzdGluYXRpb25Ob2RlOiBudW1iZXIsIGF0dHJOYW1lPzogc3RyaW5nLFxuICAgIHNhbml0aXplRm46IFNhbml0aXplckZuIHwgbnVsbCA9IG51bGwpOiBJMThuVXBkYXRlT3BDb2RlcyB7XG4gIGNvbnN0IHVwZGF0ZU9wQ29kZXM6IEkxOG5VcGRhdGVPcENvZGVzID0gW251bGwsIG51bGxdOyAgLy8gQWxsb2Mgc3BhY2UgZm9yIG1hc2sgYW5kIHNpemVcbiAgY29uc3QgdGV4dFBhcnRzID0gc3RyLnNwbGl0KEJJTkRJTkdfUkVHRVhQKTtcbiAgbGV0IG1hc2sgPSAwO1xuXG4gIGZvciAobGV0IGogPSAwOyBqIDwgdGV4dFBhcnRzLmxlbmd0aDsgaisrKSB7XG4gICAgY29uc3QgdGV4dFZhbHVlID0gdGV4dFBhcnRzW2pdO1xuXG4gICAgaWYgKGogJiAxKSB7XG4gICAgICAvLyBPZGQgaW5kZXhlcyBhcmUgYmluZGluZ3NcbiAgICAgIGNvbnN0IGJpbmRpbmdJbmRleCA9IHBhcnNlSW50KHRleHRWYWx1ZSwgMTApO1xuICAgICAgdXBkYXRlT3BDb2Rlcy5wdXNoKC0xIC0gYmluZGluZ0luZGV4KTtcbiAgICAgIG1hc2sgPSBtYXNrIHwgdG9NYXNrQml0KGJpbmRpbmdJbmRleCk7XG4gICAgfSBlbHNlIGlmICh0ZXh0VmFsdWUgIT09ICcnKSB7XG4gICAgICAvLyBFdmVuIGluZGV4ZXMgYXJlIHRleHRcbiAgICAgIHVwZGF0ZU9wQ29kZXMucHVzaCh0ZXh0VmFsdWUpO1xuICAgIH1cbiAgfVxuXG4gIHVwZGF0ZU9wQ29kZXMucHVzaChcbiAgICAgIGRlc3RpbmF0aW9uTm9kZSA8PCBJMThuVXBkYXRlT3BDb2RlLlNISUZUX1JFRiB8XG4gICAgICAoYXR0ck5hbWUgPyBJMThuVXBkYXRlT3BDb2RlLkF0dHIgOiBJMThuVXBkYXRlT3BDb2RlLlRleHQpKTtcbiAgaWYgKGF0dHJOYW1lKSB7XG4gICAgdXBkYXRlT3BDb2Rlcy5wdXNoKGF0dHJOYW1lLCBzYW5pdGl6ZUZuKTtcbiAgfVxuICB1cGRhdGVPcENvZGVzWzBdID0gbWFzaztcbiAgdXBkYXRlT3BDb2Rlc1sxXSA9IHVwZGF0ZU9wQ29kZXMubGVuZ3RoIC0gMjtcbiAgcmV0dXJuIHVwZGF0ZU9wQ29kZXM7XG59XG5cbmZ1bmN0aW9uIGdldEJpbmRpbmdNYXNrKGljdUV4cHJlc3Npb246IEljdUV4cHJlc3Npb24sIG1hc2sgPSAwKTogbnVtYmVyIHtcbiAgbWFzayA9IG1hc2sgfCB0b01hc2tCaXQoaWN1RXhwcmVzc2lvbi5tYWluQmluZGluZyk7XG4gIGxldCBtYXRjaDtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBpY3VFeHByZXNzaW9uLnZhbHVlcy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IHZhbHVlQXJyID0gaWN1RXhwcmVzc2lvbi52YWx1ZXNbaV07XG4gICAgZm9yIChsZXQgaiA9IDA7IGogPCB2YWx1ZUFyci5sZW5ndGg7IGorKykge1xuICAgICAgY29uc3QgdmFsdWUgPSB2YWx1ZUFycltqXTtcbiAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIHdoaWxlIChtYXRjaCA9IEJJTkRJTkdfUkVHRVhQLmV4ZWModmFsdWUpKSB7XG4gICAgICAgICAgbWFzayA9IG1hc2sgfCB0b01hc2tCaXQocGFyc2VJbnQobWF0Y2hbMV0sIDEwKSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG1hc2sgPSBnZXRCaW5kaW5nTWFzayh2YWx1ZSBhcyBJY3VFeHByZXNzaW9uLCBtYXNrKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIG1hc2s7XG59XG5cbmNvbnN0IGkxOG5JbmRleFN0YWNrOiBudW1iZXJbXSA9IFtdO1xubGV0IGkxOG5JbmRleFN0YWNrUG9pbnRlciA9IC0xO1xuXG4vKipcbiAqIENvbnZlcnQgYmluZGluZyBpbmRleCB0byBtYXNrIGJpdC5cbiAqXG4gKiBFYWNoIGluZGV4IHJlcHJlc2VudHMgYSBzaW5nbGUgYml0IG9uIHRoZSBiaXQtbWFzay4gQmVjYXVzZSBiaXQtbWFzayBvbmx5IGhhcyAzMiBiaXRzLCB3ZSBtYWtlXG4gKiB0aGUgMzJuZCBiaXQgc2hhcmUgYWxsIG1hc2tzIGZvciBhbGwgYmluZGluZ3MgaGlnaGVyIHRoYW4gMzIuIFNpbmNlIGl0IGlzIGV4dHJlbWVseSByYXJlIHRvIGhhdmVcbiAqIG1vcmUgdGhhbiAzMiBiaW5kaW5ncyB0aGlzIHdpbGwgYmUgaGl0IHZlcnkgcmFyZWx5LiBUaGUgZG93bnNpZGUgb2YgaGl0dGluZyB0aGlzIGNvcm5lciBjYXNlIGlzXG4gKiB0aGF0IHdlIHdpbGwgZXhlY3V0ZSBiaW5kaW5nIGNvZGUgbW9yZSBvZnRlbiB0aGFuIG5lY2Vzc2FyeS4gKHBlbmFsdHkgb2YgcGVyZm9ybWFuY2UpXG4gKi9cbmZ1bmN0aW9uIHRvTWFza0JpdChiaW5kaW5nSW5kZXg6IG51bWJlcik6IG51bWJlciB7XG4gIHJldHVybiAxIDw8IE1hdGgubWluKGJpbmRpbmdJbmRleCwgMzEpO1xufVxuXG5jb25zdCBwYXJlbnRJbmRleFN0YWNrOiBudW1iZXJbXSA9IFtdO1xuXG4vKipcbiAqIE1hcmtzIGEgYmxvY2sgb2YgdGV4dCBhcyB0cmFuc2xhdGFibGUuXG4gKlxuICogVGhlIGluc3RydWN0aW9ucyBgaTE4blN0YXJ0YCBhbmQgYGkxOG5FbmRgIG1hcmsgdGhlIHRyYW5zbGF0aW9uIGJsb2NrIGluIHRoZSB0ZW1wbGF0ZS5cbiAqIFRoZSB0cmFuc2xhdGlvbiBgbWVzc2FnZWAgaXMgdGhlIHZhbHVlIHdoaWNoIGlzIGxvY2FsZSBzcGVjaWZpYy4gVGhlIHRyYW5zbGF0aW9uIHN0cmluZyBtYXlcbiAqIGNvbnRhaW4gcGxhY2Vob2xkZXJzIHdoaWNoIGFzc29jaWF0ZSBpbm5lciBlbGVtZW50cyBhbmQgc3ViLXRlbXBsYXRlcyB3aXRoaW4gdGhlIHRyYW5zbGF0aW9uLlxuICpcbiAqIFRoZSB0cmFuc2xhdGlvbiBgbWVzc2FnZWAgcGxhY2Vob2xkZXJzIGFyZTpcbiAqIC0gYO+/vXtpbmRleH0oOntibG9ja30p77+9YDogKkJpbmRpbmcgUGxhY2Vob2xkZXIqOiBNYXJrcyBhIGxvY2F0aW9uIHdoZXJlIGFuIGV4cHJlc3Npb24gd2lsbCBiZVxuICogICBpbnRlcnBvbGF0ZWQgaW50by4gVGhlIHBsYWNlaG9sZGVyIGBpbmRleGAgcG9pbnRzIHRvIHRoZSBleHByZXNzaW9uIGJpbmRpbmcgaW5kZXguIEFuIG9wdGlvbmFsXG4gKiAgIGBibG9ja2AgdGhhdCBtYXRjaGVzIHRoZSBzdWItdGVtcGxhdGUgaW4gd2hpY2ggaXQgd2FzIGRlY2xhcmVkLlxuICogLSBg77+9I3tpbmRleH0oOntibG9ja30p77+9YC9g77+9LyN7aW5kZXh9KDp7YmxvY2t9Ke+/vWA6ICpFbGVtZW50IFBsYWNlaG9sZGVyKjogIE1hcmtzIHRoZSBiZWdpbm5pbmdcbiAqICAgYW5kIGVuZCBvZiBET00gZWxlbWVudCB0aGF0IHdlcmUgZW1iZWRkZWQgaW4gdGhlIG9yaWdpbmFsIHRyYW5zbGF0aW9uIGJsb2NrLiBUaGUgcGxhY2Vob2xkZXJcbiAqICAgYGluZGV4YCBwb2ludHMgdG8gdGhlIGVsZW1lbnQgaW5kZXggaW4gdGhlIHRlbXBsYXRlIGluc3RydWN0aW9ucyBzZXQuIEFuIG9wdGlvbmFsIGBibG9ja2AgdGhhdFxuICogICBtYXRjaGVzIHRoZSBzdWItdGVtcGxhdGUgaW4gd2hpY2ggaXQgd2FzIGRlY2xhcmVkLlxuICogLSBg77+9IXtpbmRleH0oOntibG9ja30p77+9YC9g77+9LyF7aW5kZXh9KDp7YmxvY2t9Ke+/vWA6ICpQcm9qZWN0aW9uIFBsYWNlaG9sZGVyKjogIE1hcmtzIHRoZVxuICogICBiZWdpbm5pbmcgYW5kIGVuZCBvZiA8bmctY29udGVudD4gdGhhdCB3YXMgZW1iZWRkZWQgaW4gdGhlIG9yaWdpbmFsIHRyYW5zbGF0aW9uIGJsb2NrLlxuICogICBUaGUgcGxhY2Vob2xkZXIgYGluZGV4YCBwb2ludHMgdG8gdGhlIGVsZW1lbnQgaW5kZXggaW4gdGhlIHRlbXBsYXRlIGluc3RydWN0aW9ucyBzZXQuXG4gKiAgIEFuIG9wdGlvbmFsIGBibG9ja2AgdGhhdCBtYXRjaGVzIHRoZSBzdWItdGVtcGxhdGUgaW4gd2hpY2ggaXQgd2FzIGRlY2xhcmVkLlxuICogLSBg77+9KntpbmRleH06e2Jsb2Nrfe+/vWAvYO+/vS8qe2luZGV4fTp7YmxvY2t977+9YDogKlN1Yi10ZW1wbGF0ZSBQbGFjZWhvbGRlcio6IFN1Yi10ZW1wbGF0ZXMgbXVzdCBiZVxuICogICBzcGxpdCB1cCBhbmQgdHJhbnNsYXRlZCBzZXBhcmF0ZWx5IGluIGVhY2ggYW5ndWxhciB0ZW1wbGF0ZSBmdW5jdGlvbi4gVGhlIGBpbmRleGAgcG9pbnRzIHRvIHRoZVxuICogICBgdGVtcGxhdGVgIGluc3RydWN0aW9uIGluZGV4LiBBIGBibG9ja2AgdGhhdCBtYXRjaGVzIHRoZSBzdWItdGVtcGxhdGUgaW4gd2hpY2ggaXQgd2FzIGRlY2xhcmVkLlxuICpcbiAqIEBwYXJhbSBpbmRleCBBIHVuaXF1ZSBpbmRleCBvZiB0aGUgdHJhbnNsYXRpb24gaW4gdGhlIHN0YXRpYyBibG9jay5cbiAqIEBwYXJhbSBtZXNzYWdlIFRoZSB0cmFuc2xhdGlvbiBtZXNzYWdlLlxuICogQHBhcmFtIHN1YlRlbXBsYXRlSW5kZXggT3B0aW9uYWwgc3ViLXRlbXBsYXRlIGluZGV4IGluIHRoZSBgbWVzc2FnZWAuXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVpMThuU3RhcnQoaW5kZXg6IG51bWJlciwgbWVzc2FnZTogc3RyaW5nLCBzdWJUZW1wbGF0ZUluZGV4PzogbnVtYmVyKTogdm9pZCB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgdFZpZXcgPSBsVmlld1tUVklFV107XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKHRWaWV3LCBgdFZpZXcgc2hvdWxkIGJlIGRlZmluZWRgKTtcbiAgaTE4bkluZGV4U3RhY2tbKytpMThuSW5kZXhTdGFja1BvaW50ZXJdID0gaW5kZXg7XG4gIC8vIFdlIG5lZWQgdG8gZGVsYXkgcHJvamVjdGlvbnMgdW50aWwgYGkxOG5FbmRgXG4gIHNldERlbGF5UHJvamVjdGlvbih0cnVlKTtcbiAgaWYgKHRWaWV3LmZpcnN0VGVtcGxhdGVQYXNzICYmIHRWaWV3LmRhdGFbaW5kZXggKyBIRUFERVJfT0ZGU0VUXSA9PT0gbnVsbCkge1xuICAgIGkxOG5TdGFydEZpcnN0UGFzcyhsVmlldywgdFZpZXcsIGluZGV4LCBtZXNzYWdlLCBzdWJUZW1wbGF0ZUluZGV4KTtcbiAgfVxufVxuXG4vLyBDb3VudCBmb3IgdGhlIG51bWJlciBvZiB2YXJzIHRoYXQgd2lsbCBiZSBhbGxvY2F0ZWQgZm9yIGVhY2ggaTE4biBibG9jay5cbi8vIEl0IGlzIGdsb2JhbCBiZWNhdXNlIHRoaXMgaXMgdXNlZCBpbiBtdWx0aXBsZSBmdW5jdGlvbnMgdGhhdCBpbmNsdWRlIGxvb3BzIGFuZCByZWN1cnNpdmUgY2FsbHMuXG4vLyBUaGlzIGlzIHJlc2V0IHRvIDAgd2hlbiBgaTE4blN0YXJ0Rmlyc3RQYXNzYCBpcyBjYWxsZWQuXG5sZXQgaTE4blZhcnNDb3VudDogbnVtYmVyO1xuXG4vKipcbiAqIFNlZSBgaTE4blN0YXJ0YCBhYm92ZS5cbiAqL1xuZnVuY3Rpb24gaTE4blN0YXJ0Rmlyc3RQYXNzKFxuICAgIGxWaWV3OiBMVmlldywgdFZpZXc6IFRWaWV3LCBpbmRleDogbnVtYmVyLCBtZXNzYWdlOiBzdHJpbmcsIHN1YlRlbXBsYXRlSW5kZXg/OiBudW1iZXIpIHtcbiAgY29uc3Qgc3RhcnRJbmRleCA9IHRWaWV3LmJsdWVwcmludC5sZW5ndGggLSBIRUFERVJfT0ZGU0VUO1xuICBpMThuVmFyc0NvdW50ID0gMDtcbiAgY29uc3QgcHJldmlvdXNPclBhcmVudFROb2RlID0gZ2V0UHJldmlvdXNPclBhcmVudFROb2RlKCk7XG4gIGNvbnN0IHBhcmVudFROb2RlID1cbiAgICAgIGdldElzUGFyZW50KCkgPyBwcmV2aW91c09yUGFyZW50VE5vZGUgOiBwcmV2aW91c09yUGFyZW50VE5vZGUgJiYgcHJldmlvdXNPclBhcmVudFROb2RlLnBhcmVudDtcbiAgbGV0IHBhcmVudEluZGV4ID1cbiAgICAgIHBhcmVudFROb2RlICYmIHBhcmVudFROb2RlICE9PSBsVmlld1tUX0hPU1RdID8gcGFyZW50VE5vZGUuaW5kZXggLSBIRUFERVJfT0ZGU0VUIDogaW5kZXg7XG4gIGxldCBwYXJlbnRJbmRleFBvaW50ZXIgPSAwO1xuICBwYXJlbnRJbmRleFN0YWNrW3BhcmVudEluZGV4UG9pbnRlcl0gPSBwYXJlbnRJbmRleDtcbiAgY29uc3QgY3JlYXRlT3BDb2RlczogSTE4bk11dGF0ZU9wQ29kZXMgPSBbXTtcbiAgLy8gSWYgdGhlIHByZXZpb3VzIG5vZGUgd2Fzbid0IHRoZSBkaXJlY3QgcGFyZW50IHRoZW4gd2UgaGF2ZSBhIHRyYW5zbGF0aW9uIHdpdGhvdXQgdG9wIGxldmVsXG4gIC8vIGVsZW1lbnQgYW5kIHdlIG5lZWQgdG8ga2VlcCBhIHJlZmVyZW5jZSBvZiB0aGUgcHJldmlvdXMgZWxlbWVudCBpZiB0aGVyZSBpcyBvbmVcbiAgaWYgKGluZGV4ID4gMCAmJiBwcmV2aW91c09yUGFyZW50VE5vZGUgIT09IHBhcmVudFROb2RlKSB7XG4gICAgLy8gQ3JlYXRlIGFuIE9wQ29kZSB0byBzZWxlY3QgdGhlIHByZXZpb3VzIFROb2RlXG4gICAgY3JlYXRlT3BDb2Rlcy5wdXNoKFxuICAgICAgICBwcmV2aW91c09yUGFyZW50VE5vZGUuaW5kZXggPDwgSTE4bk11dGF0ZU9wQ29kZS5TSElGVF9SRUYgfCBJMThuTXV0YXRlT3BDb2RlLlNlbGVjdCk7XG4gIH1cbiAgY29uc3QgdXBkYXRlT3BDb2RlczogSTE4blVwZGF0ZU9wQ29kZXMgPSBbXTtcbiAgY29uc3QgaWN1RXhwcmVzc2lvbnM6IFRJY3VbXSA9IFtdO1xuXG4gIGNvbnN0IHRlbXBsYXRlVHJhbnNsYXRpb24gPSBnZXRUcmFuc2xhdGlvbkZvclRlbXBsYXRlKG1lc3NhZ2UsIHN1YlRlbXBsYXRlSW5kZXgpO1xuICBjb25zdCBtc2dQYXJ0cyA9IHJlcGxhY2VOZ3NwKHRlbXBsYXRlVHJhbnNsYXRpb24pLnNwbGl0KFBIX1JFR0VYUCk7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgbXNnUGFydHMubGVuZ3RoOyBpKyspIHtcbiAgICBsZXQgdmFsdWUgPSBtc2dQYXJ0c1tpXTtcbiAgICBpZiAoaSAmIDEpIHtcbiAgICAgIC8vIE9kZCBpbmRleGVzIGFyZSBwbGFjZWhvbGRlcnMgKGVsZW1lbnRzIGFuZCBzdWItdGVtcGxhdGVzKVxuICAgICAgaWYgKHZhbHVlLmNoYXJBdCgwKSA9PT0gJy8nKSB7XG4gICAgICAgIC8vIEl0IGlzIGEgY2xvc2luZyB0YWdcbiAgICAgICAgaWYgKHZhbHVlLmNoYXJBdCgxKSA9PT0gVGFnVHlwZS5FTEVNRU5UKSB7XG4gICAgICAgICAgY29uc3QgcGhJbmRleCA9IHBhcnNlSW50KHZhbHVlLnN1YnN0cigyKSwgMTApO1xuICAgICAgICAgIHBhcmVudEluZGV4ID0gcGFyZW50SW5kZXhTdGFja1stLXBhcmVudEluZGV4UG9pbnRlcl07XG4gICAgICAgICAgY3JlYXRlT3BDb2Rlcy5wdXNoKHBoSW5kZXggPDwgSTE4bk11dGF0ZU9wQ29kZS5TSElGVF9SRUYgfCBJMThuTXV0YXRlT3BDb2RlLkVsZW1lbnRFbmQpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCBwaEluZGV4ID0gcGFyc2VJbnQodmFsdWUuc3Vic3RyKDEpLCAxMCk7XG4gICAgICAgIC8vIFRoZSB2YWx1ZSByZXByZXNlbnRzIGEgcGxhY2Vob2xkZXIgdGhhdCB3ZSBtb3ZlIHRvIHRoZSBkZXNpZ25hdGVkIGluZGV4XG4gICAgICAgIGNyZWF0ZU9wQ29kZXMucHVzaChcbiAgICAgICAgICAgIHBoSW5kZXggPDwgSTE4bk11dGF0ZU9wQ29kZS5TSElGVF9SRUYgfCBJMThuTXV0YXRlT3BDb2RlLlNlbGVjdCxcbiAgICAgICAgICAgIHBhcmVudEluZGV4IDw8IEkxOG5NdXRhdGVPcENvZGUuU0hJRlRfUEFSRU5UIHwgSTE4bk11dGF0ZU9wQ29kZS5BcHBlbmRDaGlsZCk7XG5cbiAgICAgICAgaWYgKHZhbHVlLmNoYXJBdCgwKSA9PT0gVGFnVHlwZS5FTEVNRU5UKSB7XG4gICAgICAgICAgcGFyZW50SW5kZXhTdGFja1srK3BhcmVudEluZGV4UG9pbnRlcl0gPSBwYXJlbnRJbmRleCA9IHBoSW5kZXg7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gRXZlbiBpbmRleGVzIGFyZSB0ZXh0IChpbmNsdWRpbmcgYmluZGluZ3MgJiBJQ1UgZXhwcmVzc2lvbnMpXG4gICAgICBjb25zdCBwYXJ0cyA9IGV4dHJhY3RQYXJ0cyh2YWx1ZSk7XG4gICAgICBmb3IgKGxldCBqID0gMDsgaiA8IHBhcnRzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgIGlmIChqICYgMSkge1xuICAgICAgICAgIC8vIE9kZCBpbmRleGVzIGFyZSBJQ1UgZXhwcmVzc2lvbnNcbiAgICAgICAgICAvLyBDcmVhdGUgdGhlIGNvbW1lbnQgbm9kZSB0aGF0IHdpbGwgYW5jaG9yIHRoZSBJQ1UgZXhwcmVzc2lvblxuICAgICAgICAgIGNvbnN0IGljdU5vZGVJbmRleCA9IHN0YXJ0SW5kZXggKyBpMThuVmFyc0NvdW50Kys7XG4gICAgICAgICAgY3JlYXRlT3BDb2Rlcy5wdXNoKFxuICAgICAgICAgICAgICBDT01NRU5UX01BUktFUiwgbmdEZXZNb2RlID8gYElDVSAke2ljdU5vZGVJbmRleH1gIDogJycsIGljdU5vZGVJbmRleCxcbiAgICAgICAgICAgICAgcGFyZW50SW5kZXggPDwgSTE4bk11dGF0ZU9wQ29kZS5TSElGVF9QQVJFTlQgfCBJMThuTXV0YXRlT3BDb2RlLkFwcGVuZENoaWxkKTtcblxuICAgICAgICAgIC8vIFVwZGF0ZSBjb2RlcyBmb3IgdGhlIElDVSBleHByZXNzaW9uXG4gICAgICAgICAgY29uc3QgaWN1RXhwcmVzc2lvbiA9IHBhcnRzW2pdIGFzIEljdUV4cHJlc3Npb247XG4gICAgICAgICAgY29uc3QgbWFzayA9IGdldEJpbmRpbmdNYXNrKGljdUV4cHJlc3Npb24pO1xuICAgICAgICAgIGljdVN0YXJ0KGljdUV4cHJlc3Npb25zLCBpY3VFeHByZXNzaW9uLCBpY3VOb2RlSW5kZXgsIGljdU5vZGVJbmRleCk7XG4gICAgICAgICAgLy8gU2luY2UgdGhpcyBpcyByZWN1cnNpdmUsIHRoZSBsYXN0IFRJY3UgdGhhdCB3YXMgcHVzaGVkIGlzIHRoZSBvbmUgd2Ugd2FudFxuICAgICAgICAgIGNvbnN0IHRJY3VJbmRleCA9IGljdUV4cHJlc3Npb25zLmxlbmd0aCAtIDE7XG4gICAgICAgICAgdXBkYXRlT3BDb2Rlcy5wdXNoKFxuICAgICAgICAgICAgICB0b01hc2tCaXQoaWN1RXhwcmVzc2lvbi5tYWluQmluZGluZyksICAvLyBtYXNrIG9mIHRoZSBtYWluIGJpbmRpbmdcbiAgICAgICAgICAgICAgMywgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gc2tpcCAzIG9wQ29kZXMgaWYgbm90IGNoYW5nZWRcbiAgICAgICAgICAgICAgLTEgLSBpY3VFeHByZXNzaW9uLm1haW5CaW5kaW5nLFxuICAgICAgICAgICAgICBpY3VOb2RlSW5kZXggPDwgSTE4blVwZGF0ZU9wQ29kZS5TSElGVF9SRUYgfCBJMThuVXBkYXRlT3BDb2RlLkljdVN3aXRjaCwgdEljdUluZGV4LFxuICAgICAgICAgICAgICBtYXNrLCAgLy8gbWFzayBvZiBhbGwgdGhlIGJpbmRpbmdzIG9mIHRoaXMgSUNVIGV4cHJlc3Npb25cbiAgICAgICAgICAgICAgMiwgICAgIC8vIHNraXAgMiBvcENvZGVzIGlmIG5vdCBjaGFuZ2VkXG4gICAgICAgICAgICAgIGljdU5vZGVJbmRleCA8PCBJMThuVXBkYXRlT3BDb2RlLlNISUZUX1JFRiB8IEkxOG5VcGRhdGVPcENvZGUuSWN1VXBkYXRlLCB0SWN1SW5kZXgpO1xuICAgICAgICB9IGVsc2UgaWYgKHBhcnRzW2pdICE9PSAnJykge1xuICAgICAgICAgIGNvbnN0IHRleHQgPSBwYXJ0c1tqXSBhcyBzdHJpbmc7XG4gICAgICAgICAgLy8gRXZlbiBpbmRleGVzIGFyZSB0ZXh0IChpbmNsdWRpbmcgYmluZGluZ3MpXG4gICAgICAgICAgY29uc3QgaGFzQmluZGluZyA9IHRleHQubWF0Y2goQklORElOR19SRUdFWFApO1xuICAgICAgICAgIC8vIENyZWF0ZSB0ZXh0IG5vZGVzXG4gICAgICAgICAgY29uc3QgdGV4dE5vZGVJbmRleCA9IHN0YXJ0SW5kZXggKyBpMThuVmFyc0NvdW50Kys7XG4gICAgICAgICAgY3JlYXRlT3BDb2Rlcy5wdXNoKFxuICAgICAgICAgICAgICAvLyBJZiB0aGVyZSBpcyBhIGJpbmRpbmcsIHRoZSB2YWx1ZSB3aWxsIGJlIHNldCBkdXJpbmcgdXBkYXRlXG4gICAgICAgICAgICAgIGhhc0JpbmRpbmcgPyAnJyA6IHRleHQsIHRleHROb2RlSW5kZXgsXG4gICAgICAgICAgICAgIHBhcmVudEluZGV4IDw8IEkxOG5NdXRhdGVPcENvZGUuU0hJRlRfUEFSRU5UIHwgSTE4bk11dGF0ZU9wQ29kZS5BcHBlbmRDaGlsZCk7XG5cbiAgICAgICAgICBpZiAoaGFzQmluZGluZykge1xuICAgICAgICAgICAgYWRkQWxsVG9BcnJheShnZW5lcmF0ZUJpbmRpbmdVcGRhdGVPcENvZGVzKHRleHQsIHRleHROb2RlSW5kZXgpLCB1cGRhdGVPcENvZGVzKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBpZiAoaTE4blZhcnNDb3VudCA+IDApIHtcbiAgICBhbGxvY0V4cGFuZG8obFZpZXcsIGkxOG5WYXJzQ291bnQpO1xuICB9XG5cbiAgbmdEZXZNb2RlICYmXG4gICAgICBhdHRhY2hJMThuT3BDb2Rlc0RlYnVnKFxuICAgICAgICAgIGNyZWF0ZU9wQ29kZXMsIHVwZGF0ZU9wQ29kZXMsIGljdUV4cHJlc3Npb25zLmxlbmd0aCA/IGljdUV4cHJlc3Npb25zIDogbnVsbCwgbFZpZXcpO1xuXG4gIC8vIE5PVEU6IGxvY2FsIHZhciBuZWVkZWQgdG8gcHJvcGVybHkgYXNzZXJ0IHRoZSB0eXBlIG9mIGBUSTE4bmAuXG4gIGNvbnN0IHRJMThuOiBUSTE4biA9IHtcbiAgICB2YXJzOiBpMThuVmFyc0NvdW50LFxuICAgIGNyZWF0ZTogY3JlYXRlT3BDb2RlcyxcbiAgICB1cGRhdGU6IHVwZGF0ZU9wQ29kZXMsXG4gICAgaWN1czogaWN1RXhwcmVzc2lvbnMubGVuZ3RoID8gaWN1RXhwcmVzc2lvbnMgOiBudWxsLFxuICB9O1xuXG4gIHRWaWV3LmRhdGFbaW5kZXggKyBIRUFERVJfT0ZGU0VUXSA9IHRJMThuO1xufVxuXG5mdW5jdGlvbiBhcHBlbmRJMThuTm9kZShcbiAgICB0Tm9kZTogVE5vZGUsIHBhcmVudFROb2RlOiBUTm9kZSwgcHJldmlvdXNUTm9kZTogVE5vZGUgfCBudWxsLCBsVmlldzogTFZpZXcpOiBUTm9kZSB7XG4gIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJNb3ZlTm9kZSsrO1xuICBjb25zdCBuZXh0Tm9kZSA9IHROb2RlLm5leHQ7XG4gIGlmICghcHJldmlvdXNUTm9kZSkge1xuICAgIHByZXZpb3VzVE5vZGUgPSBwYXJlbnRUTm9kZTtcbiAgfVxuXG4gIC8vIFJlLW9yZ2FuaXplIG5vZGUgdHJlZSB0byBwdXQgdGhpcyBub2RlIGluIHRoZSBjb3JyZWN0IHBvc2l0aW9uLlxuICBpZiAocHJldmlvdXNUTm9kZSA9PT0gcGFyZW50VE5vZGUgJiYgdE5vZGUgIT09IHBhcmVudFROb2RlLmNoaWxkKSB7XG4gICAgdE5vZGUubmV4dCA9IHBhcmVudFROb2RlLmNoaWxkO1xuICAgIHBhcmVudFROb2RlLmNoaWxkID0gdE5vZGU7XG4gIH0gZWxzZSBpZiAocHJldmlvdXNUTm9kZSAhPT0gcGFyZW50VE5vZGUgJiYgdE5vZGUgIT09IHByZXZpb3VzVE5vZGUubmV4dCkge1xuICAgIHROb2RlLm5leHQgPSBwcmV2aW91c1ROb2RlLm5leHQ7XG4gICAgcHJldmlvdXNUTm9kZS5uZXh0ID0gdE5vZGU7XG4gIH0gZWxzZSB7XG4gICAgdE5vZGUubmV4dCA9IG51bGw7XG4gIH1cblxuICBpZiAocGFyZW50VE5vZGUgIT09IGxWaWV3W1RfSE9TVF0pIHtcbiAgICB0Tm9kZS5wYXJlbnQgPSBwYXJlbnRUTm9kZSBhcyBURWxlbWVudE5vZGU7XG4gIH1cblxuICAvLyBJZiB0Tm9kZSB3YXMgbW92ZWQgYXJvdW5kLCB3ZSBtaWdodCBuZWVkIHRvIGZpeCBhIGJyb2tlbiBsaW5rLlxuICBsZXQgY3Vyc29yOiBUTm9kZXxudWxsID0gdE5vZGUubmV4dDtcbiAgd2hpbGUgKGN1cnNvcikge1xuICAgIGlmIChjdXJzb3IubmV4dCA9PT0gdE5vZGUpIHtcbiAgICAgIGN1cnNvci5uZXh0ID0gbmV4dE5vZGU7XG4gICAgfVxuICAgIGN1cnNvciA9IGN1cnNvci5uZXh0O1xuICB9XG5cbiAgLy8gSWYgdGhlIHBsYWNlaG9sZGVyIHRvIGFwcGVuZCBpcyBhIHByb2plY3Rpb24sIHdlIG5lZWQgdG8gbW92ZSB0aGUgcHJvamVjdGVkIG5vZGVzIGluc3RlYWRcbiAgaWYgKHROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5Qcm9qZWN0aW9uKSB7XG4gICAgYXBwbHlQcm9qZWN0aW9uKGxWaWV3LCB0Tm9kZSBhcyBUUHJvamVjdGlvbk5vZGUpO1xuICAgIHJldHVybiB0Tm9kZTtcbiAgfVxuXG4gIGFwcGVuZENoaWxkKGdldE5hdGl2ZUJ5VE5vZGUodE5vZGUsIGxWaWV3KSwgdE5vZGUsIGxWaWV3KTtcblxuICBjb25zdCBzbG90VmFsdWUgPSBsVmlld1t0Tm9kZS5pbmRleF07XG4gIGlmICh0Tm9kZS50eXBlICE9PSBUTm9kZVR5cGUuQ29udGFpbmVyICYmIGlzTENvbnRhaW5lcihzbG90VmFsdWUpKSB7XG4gICAgLy8gTm9kZXMgdGhhdCBpbmplY3QgVmlld0NvbnRhaW5lclJlZiBhbHNvIGhhdmUgYSBjb21tZW50IG5vZGUgdGhhdCBzaG91bGQgYmUgbW92ZWRcbiAgICBhcHBlbmRDaGlsZChzbG90VmFsdWVbTkFUSVZFXSwgdE5vZGUsIGxWaWV3KTtcbiAgfVxuICByZXR1cm4gdE5vZGU7XG59XG5cbi8qKlxuICogSGFuZGxlcyBtZXNzYWdlIHN0cmluZyBwb3N0LXByb2Nlc3NpbmcgZm9yIGludGVybmF0aW9uYWxpemF0aW9uLlxuICpcbiAqIEhhbmRsZXMgbWVzc2FnZSBzdHJpbmcgcG9zdC1wcm9jZXNzaW5nIGJ5IHRyYW5zZm9ybWluZyBpdCBmcm9tIGludGVybWVkaWF0ZVxuICogZm9ybWF0ICh0aGF0IG1pZ2h0IGNvbnRhaW4gc29tZSBtYXJrZXJzIHRoYXQgd2UgbmVlZCB0byByZXBsYWNlKSB0byB0aGUgZmluYWxcbiAqIGZvcm0sIGNvbnN1bWFibGUgYnkgaTE4blN0YXJ0IGluc3RydWN0aW9uLiBQb3N0IHByb2Nlc3Npbmcgc3RlcHMgaW5jbHVkZTpcbiAqXG4gKiAxLiBSZXNvbHZlIGFsbCBtdWx0aS12YWx1ZSBjYXNlcyAobGlrZSBb77+9KjE6Me+/ve+/vSMyOjHvv71877+9IzQ6Me+/vXzvv70177+9XSlcbiAqIDIuIFJlcGxhY2UgYWxsIElDVSB2YXJzIChsaWtlIFwiVkFSX1BMVVJBTFwiKVxuICogMy4gUmVwbGFjZSBhbGwgcGxhY2Vob2xkZXJzIHVzZWQgaW5zaWRlIElDVXMgaW4gYSBmb3JtIG9mIHtQTEFDRUhPTERFUn1cbiAqIDQuIFJlcGxhY2UgYWxsIElDVSByZWZlcmVuY2VzIHdpdGggY29ycmVzcG9uZGluZyB2YWx1ZXMgKGxpa2Ug77+9SUNVX0VYUF9JQ1VfMe+/vSlcbiAqICAgIGluIGNhc2UgbXVsdGlwbGUgSUNVcyBoYXZlIHRoZSBzYW1lIHBsYWNlaG9sZGVyIG5hbWVcbiAqXG4gKiBAcGFyYW0gbWVzc2FnZSBSYXcgdHJhbnNsYXRpb24gc3RyaW5nIGZvciBwb3N0IHByb2Nlc3NpbmdcbiAqIEBwYXJhbSByZXBsYWNlbWVudHMgU2V0IG9mIHJlcGxhY2VtZW50cyB0aGF0IHNob3VsZCBiZSBhcHBsaWVkXG4gKlxuICogQHJldHVybnMgVHJhbnNmb3JtZWQgc3RyaW5nIHRoYXQgY2FuIGJlIGNvbnN1bWVkIGJ5IGkxOG5TdGFydCBpbnN0cnVjdGlvblxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1aTE4blBvc3Rwcm9jZXNzKFxuICAgIG1lc3NhZ2U6IHN0cmluZywgcmVwbGFjZW1lbnRzOiB7W2tleTogc3RyaW5nXTogKHN0cmluZyB8IHN0cmluZ1tdKX0gPSB7fSk6IHN0cmluZyB7XG4gIC8qKlxuICAgKiBTdGVwIDE6IHJlc29sdmUgYWxsIG11bHRpLXZhbHVlIHBsYWNlaG9sZGVycyBsaWtlIFvvv70jNe+/vXzvv70qMTox77+977+9IzI6Me+/vXzvv70jNDox77+9XVxuICAgKlxuICAgKiBOb3RlOiBkdWUgdG8gdGhlIHdheSB3ZSBwcm9jZXNzIG5lc3RlZCB0ZW1wbGF0ZXMgKEJGUyksIG11bHRpLXZhbHVlIHBsYWNlaG9sZGVycyBhcmUgdHlwaWNhbGx5XG4gICAqIGdyb3VwZWQgYnkgdGVtcGxhdGVzLCBmb3IgZXhhbXBsZTogW++/vSM177+9fO+/vSM277+9fO+/vSMxOjHvv71877+9IzM6Mu+/vV0gd2hlcmUg77+9IzXvv70gYW5kIO+/vSM277+9IGJlbG9uZyB0byByb290XG4gICAqIHRlbXBsYXRlLCDvv70jMTox77+9IGJlbG9uZyB0byBuZXN0ZWQgdGVtcGxhdGUgd2l0aCBpbmRleCAxIGFuZCDvv70jMToy77+9IC0gbmVzdGVkIHRlbXBsYXRlIHdpdGggaW5kZXhcbiAgICogMy4gSG93ZXZlciBpbiByZWFsIHRlbXBsYXRlcyB0aGUgb3JkZXIgbWlnaHQgYmUgZGlmZmVyZW50OiBpLmUuIO+/vSMxOjHvv70gYW5kL29yIO+/vSMzOjLvv70gbWF5IGdvIGluXG4gICAqIGZyb250IG9mIO+/vSM277+9LiBUaGUgcG9zdCBwcm9jZXNzaW5nIHN0ZXAgcmVzdG9yZXMgdGhlIHJpZ2h0IG9yZGVyIGJ5IGtlZXBpbmcgdHJhY2sgb2YgdGhlXG4gICAqIHRlbXBsYXRlIGlkIHN0YWNrIGFuZCBsb29rcyBmb3IgcGxhY2Vob2xkZXJzIHRoYXQgYmVsb25nIHRvIHRoZSBjdXJyZW50bHkgYWN0aXZlIHRlbXBsYXRlLlxuICAgKi9cbiAgbGV0IHJlc3VsdDogc3RyaW5nID0gbWVzc2FnZTtcbiAgaWYgKFBQX01VTFRJX1ZBTFVFX1BMQUNFSE9MREVSU19SRUdFWFAudGVzdChtZXNzYWdlKSkge1xuICAgIGNvbnN0IG1hdGNoZXM6IHtba2V5OiBzdHJpbmddOiBQb3N0cHJvY2Vzc1BsYWNlaG9sZGVyW119ID0ge307XG4gICAgY29uc3QgdGVtcGxhdGVJZHNTdGFjazogbnVtYmVyW10gPSBbUk9PVF9URU1QTEFURV9JRF07XG4gICAgcmVzdWx0ID0gcmVzdWx0LnJlcGxhY2UoUFBfUExBQ0VIT0xERVJTX1JFR0VYUCwgKG06IGFueSwgcGhzOiBzdHJpbmcsIHRtcGw6IHN0cmluZyk6IHN0cmluZyA9PiB7XG4gICAgICBjb25zdCBjb250ZW50ID0gcGhzIHx8IHRtcGw7XG4gICAgICBjb25zdCBwbGFjZWhvbGRlcnM6IFBvc3Rwcm9jZXNzUGxhY2Vob2xkZXJbXSA9IG1hdGNoZXNbY29udGVudF0gfHwgW107XG4gICAgICBpZiAoIXBsYWNlaG9sZGVycy5sZW5ndGgpIHtcbiAgICAgICAgY29udGVudC5zcGxpdCgnfCcpLmZvckVhY2goKHBsYWNlaG9sZGVyOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICBjb25zdCBtYXRjaCA9IHBsYWNlaG9sZGVyLm1hdGNoKFBQX1RFTVBMQVRFX0lEX1JFR0VYUCk7XG4gICAgICAgICAgY29uc3QgdGVtcGxhdGVJZCA9IG1hdGNoID8gcGFyc2VJbnQobWF0Y2hbMV0sIDEwKSA6IFJPT1RfVEVNUExBVEVfSUQ7XG4gICAgICAgICAgY29uc3QgaXNDbG9zZVRlbXBsYXRlVGFnID0gUFBfQ0xPU0VfVEVNUExBVEVfUkVHRVhQLnRlc3QocGxhY2Vob2xkZXIpO1xuICAgICAgICAgIHBsYWNlaG9sZGVycy5wdXNoKFt0ZW1wbGF0ZUlkLCBpc0Nsb3NlVGVtcGxhdGVUYWcsIHBsYWNlaG9sZGVyXSk7XG4gICAgICAgIH0pO1xuICAgICAgICBtYXRjaGVzW2NvbnRlbnRdID0gcGxhY2Vob2xkZXJzO1xuICAgICAgfVxuXG4gICAgICBpZiAoIXBsYWNlaG9sZGVycy5sZW5ndGgpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBpMThuIHBvc3Rwcm9jZXNzOiB1bm1hdGNoZWQgcGxhY2Vob2xkZXIgLSAke2NvbnRlbnR9YCk7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGN1cnJlbnRUZW1wbGF0ZUlkID0gdGVtcGxhdGVJZHNTdGFja1t0ZW1wbGF0ZUlkc1N0YWNrLmxlbmd0aCAtIDFdO1xuICAgICAgbGV0IGlkeCA9IDA7XG4gICAgICAvLyBmaW5kIHBsYWNlaG9sZGVyIGluZGV4IHRoYXQgbWF0Y2hlcyBjdXJyZW50IHRlbXBsYXRlIGlkXG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHBsYWNlaG9sZGVycy5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAocGxhY2Vob2xkZXJzW2ldWzBdID09PSBjdXJyZW50VGVtcGxhdGVJZCkge1xuICAgICAgICAgIGlkeCA9IGk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIC8vIHVwZGF0ZSB0ZW1wbGF0ZSBpZCBzdGFjayBiYXNlZCBvbiB0aGUgY3VycmVudCB0YWcgZXh0cmFjdGVkXG4gICAgICBjb25zdCBbdGVtcGxhdGVJZCwgaXNDbG9zZVRlbXBsYXRlVGFnLCBwbGFjZWhvbGRlcl0gPSBwbGFjZWhvbGRlcnNbaWR4XTtcbiAgICAgIGlmIChpc0Nsb3NlVGVtcGxhdGVUYWcpIHtcbiAgICAgICAgdGVtcGxhdGVJZHNTdGFjay5wb3AoKTtcbiAgICAgIH0gZWxzZSBpZiAoY3VycmVudFRlbXBsYXRlSWQgIT09IHRlbXBsYXRlSWQpIHtcbiAgICAgICAgdGVtcGxhdGVJZHNTdGFjay5wdXNoKHRlbXBsYXRlSWQpO1xuICAgICAgfVxuICAgICAgLy8gcmVtb3ZlIHByb2Nlc3NlZCB0YWcgZnJvbSB0aGUgbGlzdFxuICAgICAgcGxhY2Vob2xkZXJzLnNwbGljZShpZHgsIDEpO1xuICAgICAgcmV0dXJuIHBsYWNlaG9sZGVyO1xuICAgIH0pO1xuICB9XG5cbiAgLy8gcmV0dXJuIGN1cnJlbnQgcmVzdWx0IGlmIG5vIHJlcGxhY2VtZW50cyBzcGVjaWZpZWRcbiAgaWYgKCFPYmplY3Qua2V5cyhyZXBsYWNlbWVudHMpLmxlbmd0aCkge1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICAvKipcbiAgICogU3RlcCAyOiByZXBsYWNlIGFsbCBJQ1UgdmFycyAobGlrZSBcIlZBUl9QTFVSQUxcIilcbiAgICovXG4gIHJlc3VsdCA9IHJlc3VsdC5yZXBsYWNlKFBQX0lDVV9WQVJTX1JFR0VYUCwgKG1hdGNoLCBzdGFydCwga2V5LCBfdHlwZSwgX2lkeCwgZW5kKTogc3RyaW5nID0+IHtcbiAgICByZXR1cm4gcmVwbGFjZW1lbnRzLmhhc093blByb3BlcnR5KGtleSkgPyBgJHtzdGFydH0ke3JlcGxhY2VtZW50c1trZXldfSR7ZW5kfWAgOiBtYXRjaDtcbiAgfSk7XG5cbiAgLyoqXG4gICAqIFN0ZXAgMzogcmVwbGFjZSBhbGwgcGxhY2Vob2xkZXJzIHVzZWQgaW5zaWRlIElDVXMgaW4gYSBmb3JtIG9mIHtQTEFDRUhPTERFUn1cbiAgICovXG4gIHJlc3VsdCA9IHJlc3VsdC5yZXBsYWNlKFBQX0lDVV9QTEFDRUhPTERFUlNfUkVHRVhQLCAobWF0Y2gsIGtleSk6IHN0cmluZyA9PiB7XG4gICAgcmV0dXJuIHJlcGxhY2VtZW50cy5oYXNPd25Qcm9wZXJ0eShrZXkpID8gcmVwbGFjZW1lbnRzW2tleV0gYXMgc3RyaW5nIDogbWF0Y2g7XG4gIH0pO1xuXG4gIC8qKlxuICAgKiBTdGVwIDQ6IHJlcGxhY2UgYWxsIElDVSByZWZlcmVuY2VzIHdpdGggY29ycmVzcG9uZGluZyB2YWx1ZXMgKGxpa2Ug77+9SUNVX0VYUF9JQ1VfMe+/vSkgaW4gY2FzZVxuICAgKiBtdWx0aXBsZSBJQ1VzIGhhdmUgdGhlIHNhbWUgcGxhY2Vob2xkZXIgbmFtZVxuICAgKi9cbiAgcmVzdWx0ID0gcmVzdWx0LnJlcGxhY2UoUFBfSUNVU19SRUdFWFAsIChtYXRjaCwga2V5KTogc3RyaW5nID0+IHtcbiAgICBpZiAocmVwbGFjZW1lbnRzLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgIGNvbnN0IGxpc3QgPSByZXBsYWNlbWVudHNba2V5XSBhcyBzdHJpbmdbXTtcbiAgICAgIGlmICghbGlzdC5sZW5ndGgpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBpMThuIHBvc3Rwcm9jZXNzOiB1bm1hdGNoZWQgSUNVIC0gJHttYXRjaH0gd2l0aCBrZXk6ICR7a2V5fWApO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGxpc3Quc2hpZnQoKSAhO1xuICAgIH1cbiAgICByZXR1cm4gbWF0Y2g7XG4gIH0pO1xuXG4gIHJldHVybiByZXN1bHQ7XG59XG5cbi8qKlxuICogVHJhbnNsYXRlcyBhIHRyYW5zbGF0aW9uIGJsb2NrIG1hcmtlZCBieSBgaTE4blN0YXJ0YCBhbmQgYGkxOG5FbmRgLiBJdCBpbnNlcnRzIHRoZSB0ZXh0L0lDVSBub2Rlc1xuICogaW50byB0aGUgcmVuZGVyIHRyZWUsIG1vdmVzIHRoZSBwbGFjZWhvbGRlciBub2RlcyBhbmQgcmVtb3ZlcyB0aGUgZGVsZXRlZCBub2Rlcy5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWkxOG5FbmQoKTogdm9pZCB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgdFZpZXcgPSBsVmlld1tUVklFV107XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKHRWaWV3LCBgdFZpZXcgc2hvdWxkIGJlIGRlZmluZWRgKTtcbiAgaTE4bkVuZEZpcnN0UGFzcyhsVmlldywgdFZpZXcpO1xuICAvLyBTdG9wIGRlbGF5aW5nIHByb2plY3Rpb25zXG4gIHNldERlbGF5UHJvamVjdGlvbihmYWxzZSk7XG59XG5cbi8qKlxuICogU2VlIGBpMThuRW5kYCBhYm92ZS5cbiAqL1xuZnVuY3Rpb24gaTE4bkVuZEZpcnN0UGFzcyhsVmlldzogTFZpZXcsIHRWaWV3OiBUVmlldykge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RXF1YWwoXG4gICAgICAgICAgICAgICAgICAgZ2V0QmluZGluZ0luZGV4KCksIHRWaWV3LmJpbmRpbmdTdGFydEluZGV4LFxuICAgICAgICAgICAgICAgICAgICdpMThuRW5kIHNob3VsZCBiZSBjYWxsZWQgYmVmb3JlIGFueSBiaW5kaW5nJyk7XG5cbiAgY29uc3Qgcm9vdEluZGV4ID0gaTE4bkluZGV4U3RhY2tbaTE4bkluZGV4U3RhY2tQb2ludGVyLS1dO1xuICBjb25zdCB0STE4biA9IHRWaWV3LmRhdGFbcm9vdEluZGV4ICsgSEVBREVSX09GRlNFVF0gYXMgVEkxOG47XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKHRJMThuLCBgWW91IHNob3VsZCBjYWxsIGkxOG5TdGFydCBiZWZvcmUgaTE4bkVuZGApO1xuXG4gIC8vIEZpbmQgdGhlIGxhc3Qgbm9kZSB0aGF0IHdhcyBhZGRlZCBiZWZvcmUgYGkxOG5FbmRgXG4gIGNvbnN0IGxhc3RDcmVhdGVkTm9kZSA9IGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSgpO1xuXG4gIC8vIFJlYWQgdGhlIGluc3RydWN0aW9ucyB0byBpbnNlcnQvbW92ZS9yZW1vdmUgRE9NIGVsZW1lbnRzXG4gIGNvbnN0IHZpc2l0ZWROb2RlcyA9IHJlYWRDcmVhdGVPcENvZGVzKHJvb3RJbmRleCwgdEkxOG4uY3JlYXRlLCBsVmlldyk7XG5cbiAgLy8gUmVtb3ZlIGRlbGV0ZWQgbm9kZXNcbiAgbGV0IGluZGV4ID0gcm9vdEluZGV4ICsgMTtcbiAgd2hpbGUgKGluZGV4IDw9IGxhc3RDcmVhdGVkTm9kZS5pbmRleCAtIEhFQURFUl9PRkZTRVQpIHtcbiAgICBpZiAodmlzaXRlZE5vZGVzLmluZGV4T2YoaW5kZXgpID09PSAtMSkge1xuICAgICAgcmVtb3ZlTm9kZShpbmRleCwgbFZpZXcsIC8qIG1hcmtBc0RldGFjaGVkICovIHRydWUpO1xuICAgIH1cbiAgICAvLyBDaGVjayBpZiBhbiBlbGVtZW50IGhhcyBhbnkgbG9jYWwgcmVmcyBhbmQgc2tpcCB0aGVtXG4gICAgY29uc3QgdE5vZGUgPSBnZXRUTm9kZShpbmRleCwgbFZpZXcpO1xuICAgIGlmICh0Tm9kZSAmJiAodE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkVsZW1lbnQgfHwgdE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkVsZW1lbnRDb250YWluZXIpICYmXG4gICAgICAgIHROb2RlLmxvY2FsTmFtZXMgIT09IG51bGwpIHtcbiAgICAgIC8vIERpdmlkZSBieSAyIHRvIGdldCB0aGUgbnVtYmVyIG9mIGxvY2FsIHJlZnMsXG4gICAgICAvLyBzaW5jZSB0aGV5IGFyZSBzdG9yZWQgYXMgYW4gYXJyYXkgdGhhdCBhbHNvIGluY2x1ZGVzIGRpcmVjdGl2ZSBpbmRleGVzLFxuICAgICAgLy8gaS5lLiBbXCJsb2NhbFJlZlwiLCBkaXJlY3RpdmVJbmRleCwgLi4uXVxuICAgICAgaW5kZXggKz0gdE5vZGUubG9jYWxOYW1lcy5sZW5ndGggPj4gMTtcbiAgICB9XG4gICAgaW5kZXgrKztcbiAgfVxufVxuXG4vKipcbiAqIENyZWF0ZXMgYW5kIHN0b3JlcyB0aGUgZHluYW1pYyBUTm9kZSwgYW5kIHVuaG9va3MgaXQgZnJvbSB0aGUgdHJlZSBmb3Igbm93LlxuICovXG5mdW5jdGlvbiBjcmVhdGVEeW5hbWljTm9kZUF0SW5kZXgoXG4gICAgbFZpZXc6IExWaWV3LCBpbmRleDogbnVtYmVyLCB0eXBlOiBUTm9kZVR5cGUsIG5hdGl2ZTogUkVsZW1lbnQgfCBSVGV4dCB8IG51bGwsXG4gICAgbmFtZTogc3RyaW5nIHwgbnVsbCk6IFRFbGVtZW50Tm9kZXxUSWN1Q29udGFpbmVyTm9kZSB7XG4gIGNvbnN0IHByZXZpb3VzT3JQYXJlbnRUTm9kZSA9IGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSgpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGF0YUluUmFuZ2UobFZpZXcsIGluZGV4ICsgSEVBREVSX09GRlNFVCk7XG4gIGxWaWV3W2luZGV4ICsgSEVBREVSX09GRlNFVF0gPSBuYXRpdmU7XG4gIGNvbnN0IHROb2RlID0gZ2V0T3JDcmVhdGVUTm9kZShsVmlld1tUVklFV10sIGxWaWV3W1RfSE9TVF0sIGluZGV4LCB0eXBlIGFzIGFueSwgbmFtZSwgbnVsbCk7XG5cbiAgLy8gV2UgYXJlIGNyZWF0aW5nIGEgZHluYW1pYyBub2RlLCB0aGUgcHJldmlvdXMgdE5vZGUgbWlnaHQgbm90IGJlIHBvaW50aW5nIGF0IHRoaXMgbm9kZS5cbiAgLy8gV2Ugd2lsbCBsaW5rIG91cnNlbHZlcyBpbnRvIHRoZSB0cmVlIGxhdGVyIHdpdGggYGFwcGVuZEkxOG5Ob2RlYC5cbiAgaWYgKHByZXZpb3VzT3JQYXJlbnRUTm9kZSAmJiBwcmV2aW91c09yUGFyZW50VE5vZGUubmV4dCA9PT0gdE5vZGUpIHtcbiAgICBwcmV2aW91c09yUGFyZW50VE5vZGUubmV4dCA9IG51bGw7XG4gIH1cblxuICByZXR1cm4gdE5vZGU7XG59XG5cbmZ1bmN0aW9uIHJlYWRDcmVhdGVPcENvZGVzKFxuICAgIGluZGV4OiBudW1iZXIsIGNyZWF0ZU9wQ29kZXM6IEkxOG5NdXRhdGVPcENvZGVzLCBsVmlldzogTFZpZXcpOiBudW1iZXJbXSB7XG4gIGNvbnN0IHJlbmRlcmVyID0gbFZpZXdbUkVOREVSRVJdO1xuICBsZXQgY3VycmVudFROb2RlOiBUTm9kZXxudWxsID0gbnVsbDtcbiAgbGV0IHByZXZpb3VzVE5vZGU6IFROb2RlfG51bGwgPSBudWxsO1xuICBjb25zdCB2aXNpdGVkTm9kZXM6IG51bWJlcltdID0gW107XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgY3JlYXRlT3BDb2Rlcy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IG9wQ29kZSA9IGNyZWF0ZU9wQ29kZXNbaV07XG4gICAgaWYgKHR5cGVvZiBvcENvZGUgPT0gJ3N0cmluZycpIHtcbiAgICAgIGNvbnN0IHRleHRSTm9kZSA9IGNyZWF0ZVRleHROb2RlKG9wQ29kZSwgcmVuZGVyZXIpO1xuICAgICAgY29uc3QgdGV4dE5vZGVJbmRleCA9IGNyZWF0ZU9wQ29kZXNbKytpXSBhcyBudW1iZXI7XG4gICAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyQ3JlYXRlVGV4dE5vZGUrKztcbiAgICAgIHByZXZpb3VzVE5vZGUgPSBjdXJyZW50VE5vZGU7XG4gICAgICBjdXJyZW50VE5vZGUgPVxuICAgICAgICAgIGNyZWF0ZUR5bmFtaWNOb2RlQXRJbmRleChsVmlldywgdGV4dE5vZGVJbmRleCwgVE5vZGVUeXBlLkVsZW1lbnQsIHRleHRSTm9kZSwgbnVsbCk7XG4gICAgICB2aXNpdGVkTm9kZXMucHVzaCh0ZXh0Tm9kZUluZGV4KTtcbiAgICAgIHNldElzTm90UGFyZW50KCk7XG4gICAgfSBlbHNlIGlmICh0eXBlb2Ygb3BDb2RlID09ICdudW1iZXInKSB7XG4gICAgICBzd2l0Y2ggKG9wQ29kZSAmIEkxOG5NdXRhdGVPcENvZGUuTUFTS19PUENPREUpIHtcbiAgICAgICAgY2FzZSBJMThuTXV0YXRlT3BDb2RlLkFwcGVuZENoaWxkOlxuICAgICAgICAgIGNvbnN0IGRlc3RpbmF0aW9uTm9kZUluZGV4ID0gb3BDb2RlID4+PiBJMThuTXV0YXRlT3BDb2RlLlNISUZUX1BBUkVOVDtcbiAgICAgICAgICBsZXQgZGVzdGluYXRpb25UTm9kZTogVE5vZGU7XG4gICAgICAgICAgaWYgKGRlc3RpbmF0aW9uTm9kZUluZGV4ID09PSBpbmRleCkge1xuICAgICAgICAgICAgLy8gSWYgdGhlIGRlc3RpbmF0aW9uIG5vZGUgaXMgYGkxOG5TdGFydGAsIHdlIGRvbid0IGhhdmUgYVxuICAgICAgICAgICAgLy8gdG9wLWxldmVsIG5vZGUgYW5kIHdlIHNob3VsZCB1c2UgdGhlIGhvc3Qgbm9kZSBpbnN0ZWFkXG4gICAgICAgICAgICBkZXN0aW5hdGlvblROb2RlID0gbFZpZXdbVF9IT1NUXSAhO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBkZXN0aW5hdGlvblROb2RlID0gZ2V0VE5vZGUoZGVzdGluYXRpb25Ob2RlSW5kZXgsIGxWaWV3KTtcbiAgICAgICAgICB9XG4gICAgICAgICAgbmdEZXZNb2RlICYmXG4gICAgICAgICAgICAgIGFzc2VydERlZmluZWQoXG4gICAgICAgICAgICAgICAgICBjdXJyZW50VE5vZGUgISxcbiAgICAgICAgICAgICAgICAgIGBZb3UgbmVlZCB0byBjcmVhdGUgb3Igc2VsZWN0IGEgbm9kZSBiZWZvcmUgeW91IGNhbiBpbnNlcnQgaXQgaW50byB0aGUgRE9NYCk7XG4gICAgICAgICAgcHJldmlvdXNUTm9kZSA9IGFwcGVuZEkxOG5Ob2RlKGN1cnJlbnRUTm9kZSAhLCBkZXN0aW5hdGlvblROb2RlLCBwcmV2aW91c1ROb2RlLCBsVmlldyk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgSTE4bk11dGF0ZU9wQ29kZS5TZWxlY3Q6XG4gICAgICAgICAgY29uc3Qgbm9kZUluZGV4ID0gb3BDb2RlID4+PiBJMThuTXV0YXRlT3BDb2RlLlNISUZUX1JFRjtcbiAgICAgICAgICB2aXNpdGVkTm9kZXMucHVzaChub2RlSW5kZXgpO1xuICAgICAgICAgIHByZXZpb3VzVE5vZGUgPSBjdXJyZW50VE5vZGU7XG4gICAgICAgICAgY3VycmVudFROb2RlID0gZ2V0VE5vZGUobm9kZUluZGV4LCBsVmlldyk7XG4gICAgICAgICAgaWYgKGN1cnJlbnRUTm9kZSkge1xuICAgICAgICAgICAgc2V0UHJldmlvdXNPclBhcmVudFROb2RlKGN1cnJlbnRUTm9kZSwgY3VycmVudFROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5FbGVtZW50KTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgSTE4bk11dGF0ZU9wQ29kZS5FbGVtZW50RW5kOlxuICAgICAgICAgIGNvbnN0IGVsZW1lbnRJbmRleCA9IG9wQ29kZSA+Pj4gSTE4bk11dGF0ZU9wQ29kZS5TSElGVF9SRUY7XG4gICAgICAgICAgcHJldmlvdXNUTm9kZSA9IGN1cnJlbnRUTm9kZSA9IGdldFROb2RlKGVsZW1lbnRJbmRleCwgbFZpZXcpO1xuICAgICAgICAgIHNldFByZXZpb3VzT3JQYXJlbnRUTm9kZShjdXJyZW50VE5vZGUsIGZhbHNlKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBJMThuTXV0YXRlT3BDb2RlLkF0dHI6XG4gICAgICAgICAgY29uc3QgZWxlbWVudE5vZGVJbmRleCA9IG9wQ29kZSA+Pj4gSTE4bk11dGF0ZU9wQ29kZS5TSElGVF9SRUY7XG4gICAgICAgICAgY29uc3QgYXR0ck5hbWUgPSBjcmVhdGVPcENvZGVzWysraV0gYXMgc3RyaW5nO1xuICAgICAgICAgIGNvbnN0IGF0dHJWYWx1ZSA9IGNyZWF0ZU9wQ29kZXNbKytpXSBhcyBzdHJpbmc7XG4gICAgICAgICAgLy8gVGhpcyBjb2RlIGlzIHVzZWQgZm9yIElDVSBleHByZXNzaW9ucyBvbmx5LCBzaW5jZSB3ZSBkb24ndCBzdXBwb3J0XG4gICAgICAgICAgLy8gZGlyZWN0aXZlcy9jb21wb25lbnRzIGluIElDVXMsIHdlIGRvbid0IG5lZWQgdG8gd29ycnkgYWJvdXQgaW5wdXRzIGhlcmVcbiAgICAgICAgICBlbGVtZW50QXR0cmlidXRlSW50ZXJuYWwoZWxlbWVudE5vZGVJbmRleCwgYXR0ck5hbWUsIGF0dHJWYWx1ZSwgbFZpZXcpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgVW5hYmxlIHRvIGRldGVybWluZSB0aGUgdHlwZSBvZiBtdXRhdGUgb3BlcmF0aW9uIGZvciBcIiR7b3BDb2RlfVwiYCk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHN3aXRjaCAob3BDb2RlKSB7XG4gICAgICAgIGNhc2UgQ09NTUVOVF9NQVJLRVI6XG4gICAgICAgICAgY29uc3QgY29tbWVudFZhbHVlID0gY3JlYXRlT3BDb2Rlc1srK2ldIGFzIHN0cmluZztcbiAgICAgICAgICBjb25zdCBjb21tZW50Tm9kZUluZGV4ID0gY3JlYXRlT3BDb2Rlc1srK2ldIGFzIG51bWJlcjtcbiAgICAgICAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RXF1YWwoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlb2YgY29tbWVudFZhbHVlLCAnc3RyaW5nJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIGBFeHBlY3RlZCBcIiR7Y29tbWVudFZhbHVlfVwiIHRvIGJlIGEgY29tbWVudCBub2RlIHZhbHVlYCk7XG4gICAgICAgICAgY29uc3QgY29tbWVudFJOb2RlID0gcmVuZGVyZXIuY3JlYXRlQ29tbWVudChjb21tZW50VmFsdWUpO1xuICAgICAgICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJDcmVhdGVDb21tZW50Kys7XG4gICAgICAgICAgcHJldmlvdXNUTm9kZSA9IGN1cnJlbnRUTm9kZTtcbiAgICAgICAgICBjdXJyZW50VE5vZGUgPSBjcmVhdGVEeW5hbWljTm9kZUF0SW5kZXgoXG4gICAgICAgICAgICAgIGxWaWV3LCBjb21tZW50Tm9kZUluZGV4LCBUTm9kZVR5cGUuSWN1Q29udGFpbmVyLCBjb21tZW50Uk5vZGUsIG51bGwpO1xuICAgICAgICAgIHZpc2l0ZWROb2Rlcy5wdXNoKGNvbW1lbnROb2RlSW5kZXgpO1xuICAgICAgICAgIGF0dGFjaFBhdGNoRGF0YShjb21tZW50Uk5vZGUsIGxWaWV3KTtcbiAgICAgICAgICAoY3VycmVudFROb2RlIGFzIFRJY3VDb250YWluZXJOb2RlKS5hY3RpdmVDYXNlSW5kZXggPSBudWxsO1xuICAgICAgICAgIC8vIFdlIHdpbGwgYWRkIHRoZSBjYXNlIG5vZGVzIGxhdGVyLCBkdXJpbmcgdGhlIHVwZGF0ZSBwaGFzZVxuICAgICAgICAgIHNldElzTm90UGFyZW50KCk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgRUxFTUVOVF9NQVJLRVI6XG4gICAgICAgICAgY29uc3QgdGFnTmFtZVZhbHVlID0gY3JlYXRlT3BDb2Rlc1srK2ldIGFzIHN0cmluZztcbiAgICAgICAgICBjb25zdCBlbGVtZW50Tm9kZUluZGV4ID0gY3JlYXRlT3BDb2Rlc1srK2ldIGFzIG51bWJlcjtcbiAgICAgICAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RXF1YWwoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlb2YgdGFnTmFtZVZhbHVlLCAnc3RyaW5nJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIGBFeHBlY3RlZCBcIiR7dGFnTmFtZVZhbHVlfVwiIHRvIGJlIGFuIGVsZW1lbnQgbm9kZSB0YWcgbmFtZWApO1xuICAgICAgICAgIGNvbnN0IGVsZW1lbnRSTm9kZSA9IHJlbmRlcmVyLmNyZWF0ZUVsZW1lbnQodGFnTmFtZVZhbHVlKTtcbiAgICAgICAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyQ3JlYXRlRWxlbWVudCsrO1xuICAgICAgICAgIHByZXZpb3VzVE5vZGUgPSBjdXJyZW50VE5vZGU7XG4gICAgICAgICAgY3VycmVudFROb2RlID0gY3JlYXRlRHluYW1pY05vZGVBdEluZGV4KFxuICAgICAgICAgICAgICBsVmlldywgZWxlbWVudE5vZGVJbmRleCwgVE5vZGVUeXBlLkVsZW1lbnQsIGVsZW1lbnRSTm9kZSwgdGFnTmFtZVZhbHVlKTtcbiAgICAgICAgICB2aXNpdGVkTm9kZXMucHVzaChlbGVtZW50Tm9kZUluZGV4KTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFVuYWJsZSB0byBkZXRlcm1pbmUgdGhlIHR5cGUgb2YgbXV0YXRlIG9wZXJhdGlvbiBmb3IgXCIke29wQ29kZX1cImApO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHNldElzTm90UGFyZW50KCk7XG5cbiAgcmV0dXJuIHZpc2l0ZWROb2Rlcztcbn1cblxuZnVuY3Rpb24gcmVhZFVwZGF0ZU9wQ29kZXMoXG4gICAgdXBkYXRlT3BDb2RlczogSTE4blVwZGF0ZU9wQ29kZXMsIGljdXM6IFRJY3VbXSB8IG51bGwsIGJpbmRpbmdzU3RhcnRJbmRleDogbnVtYmVyLFxuICAgIGNoYW5nZU1hc2s6IG51bWJlciwgdmlld0RhdGE6IExWaWV3LCBieXBhc3NDaGVja0JpdCA9IGZhbHNlKSB7XG4gIGxldCBjYXNlQ3JlYXRlZCA9IGZhbHNlO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IHVwZGF0ZU9wQ29kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAvLyBiaXQgY29kZSB0byBjaGVjayBpZiB3ZSBzaG91bGQgYXBwbHkgdGhlIG5leHQgdXBkYXRlXG4gICAgY29uc3QgY2hlY2tCaXQgPSB1cGRhdGVPcENvZGVzW2ldIGFzIG51bWJlcjtcbiAgICAvLyBOdW1iZXIgb2Ygb3BDb2RlcyB0byBza2lwIHVudGlsIG5leHQgc2V0IG9mIHVwZGF0ZSBjb2Rlc1xuICAgIGNvbnN0IHNraXBDb2RlcyA9IHVwZGF0ZU9wQ29kZXNbKytpXSBhcyBudW1iZXI7XG4gICAgaWYgKGJ5cGFzc0NoZWNrQml0IHx8IChjaGVja0JpdCAmIGNoYW5nZU1hc2spKSB7XG4gICAgICAvLyBUaGUgdmFsdWUgaGFzIGJlZW4gdXBkYXRlZCBzaW5jZSBsYXN0IGNoZWNrZWRcbiAgICAgIGxldCB2YWx1ZSA9ICcnO1xuICAgICAgZm9yIChsZXQgaiA9IGkgKyAxOyBqIDw9IChpICsgc2tpcENvZGVzKTsgaisrKSB7XG4gICAgICAgIGNvbnN0IG9wQ29kZSA9IHVwZGF0ZU9wQ29kZXNbal07XG4gICAgICAgIGlmICh0eXBlb2Ygb3BDb2RlID09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgdmFsdWUgKz0gb3BDb2RlO1xuICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBvcENvZGUgPT0gJ251bWJlcicpIHtcbiAgICAgICAgICBpZiAob3BDb2RlIDwgMCkge1xuICAgICAgICAgICAgLy8gSXQncyBhIGJpbmRpbmcgaW5kZXggd2hvc2UgdmFsdWUgaXMgbmVnYXRpdmVcbiAgICAgICAgICAgIHZhbHVlICs9IHJlbmRlclN0cmluZ2lmeSh2aWV3RGF0YVtiaW5kaW5nc1N0YXJ0SW5kZXggLSBvcENvZGVdKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc3Qgbm9kZUluZGV4ID0gb3BDb2RlID4+PiBJMThuVXBkYXRlT3BDb2RlLlNISUZUX1JFRjtcbiAgICAgICAgICAgIGxldCB0SWN1SW5kZXg6IG51bWJlcjtcbiAgICAgICAgICAgIGxldCB0SWN1OiBUSWN1O1xuICAgICAgICAgICAgbGV0IGljdVROb2RlOiBUSWN1Q29udGFpbmVyTm9kZTtcbiAgICAgICAgICAgIHN3aXRjaCAob3BDb2RlICYgSTE4blVwZGF0ZU9wQ29kZS5NQVNLX09QQ09ERSkge1xuICAgICAgICAgICAgICBjYXNlIEkxOG5VcGRhdGVPcENvZGUuQXR0cjpcbiAgICAgICAgICAgICAgICBjb25zdCBwcm9wTmFtZSA9IHVwZGF0ZU9wQ29kZXNbKytqXSBhcyBzdHJpbmc7XG4gICAgICAgICAgICAgICAgY29uc3Qgc2FuaXRpemVGbiA9IHVwZGF0ZU9wQ29kZXNbKytqXSBhcyBTYW5pdGl6ZXJGbiB8IG51bGw7XG4gICAgICAgICAgICAgICAgZWxlbWVudFByb3BlcnR5SW50ZXJuYWwodmlld0RhdGEsIG5vZGVJbmRleCwgcHJvcE5hbWUsIHZhbHVlLCBzYW5pdGl6ZUZuKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgY2FzZSBJMThuVXBkYXRlT3BDb2RlLlRleHQ6XG4gICAgICAgICAgICAgICAgdGV4dEJpbmRpbmdJbnRlcm5hbCh2aWV3RGF0YSwgbm9kZUluZGV4LCB2YWx1ZSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgIGNhc2UgSTE4blVwZGF0ZU9wQ29kZS5JY3VTd2l0Y2g6XG4gICAgICAgICAgICAgICAgdEljdUluZGV4ID0gdXBkYXRlT3BDb2Rlc1srK2pdIGFzIG51bWJlcjtcbiAgICAgICAgICAgICAgICB0SWN1ID0gaWN1cyAhW3RJY3VJbmRleF07XG4gICAgICAgICAgICAgICAgaWN1VE5vZGUgPSBnZXRUTm9kZShub2RlSW5kZXgsIHZpZXdEYXRhKSBhcyBUSWN1Q29udGFpbmVyTm9kZTtcbiAgICAgICAgICAgICAgICAvLyBJZiB0aGVyZSBpcyBhbiBhY3RpdmUgY2FzZSwgZGVsZXRlIHRoZSBvbGQgbm9kZXNcbiAgICAgICAgICAgICAgICBpZiAoaWN1VE5vZGUuYWN0aXZlQ2FzZUluZGV4ICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICBjb25zdCByZW1vdmVDb2RlcyA9IHRJY3UucmVtb3ZlW2ljdVROb2RlLmFjdGl2ZUNhc2VJbmRleF07XG4gICAgICAgICAgICAgICAgICBmb3IgKGxldCBrID0gMDsgayA8IHJlbW92ZUNvZGVzLmxlbmd0aDsgaysrKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlbW92ZU9wQ29kZSA9IHJlbW92ZUNvZGVzW2tdIGFzIG51bWJlcjtcbiAgICAgICAgICAgICAgICAgICAgc3dpdGNoIChyZW1vdmVPcENvZGUgJiBJMThuTXV0YXRlT3BDb2RlLk1BU0tfT1BDT0RFKSB7XG4gICAgICAgICAgICAgICAgICAgICAgY2FzZSBJMThuTXV0YXRlT3BDb2RlLlJlbW92ZTpcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG5vZGVJbmRleCA9IHJlbW92ZU9wQ29kZSA+Pj4gSTE4bk11dGF0ZU9wQ29kZS5TSElGVF9SRUY7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBSZW1vdmUgRE9NIGVsZW1lbnQsIGJ1dCBkbyAqbm90KiBtYXJrIFROb2RlIGFzIGRldGFjaGVkLCBzaW5jZSB3ZSBhcmVcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGp1c3Qgc3dpdGNoaW5nIElDVSBjYXNlcyAod2hpbGUga2VlcGluZyB0aGUgc2FtZSBUTm9kZSksIHNvIGEgRE9NIGVsZW1lbnRcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHJlcHJlc2VudGluZyBhIG5ldyBJQ1UgY2FzZSB3aWxsIGJlIHJlLWNyZWF0ZWQuXG4gICAgICAgICAgICAgICAgICAgICAgICByZW1vdmVOb2RlKG5vZGVJbmRleCwgdmlld0RhdGEsIC8qIG1hcmtBc0RldGFjaGVkICovIGZhbHNlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgIGNhc2UgSTE4bk11dGF0ZU9wQ29kZS5SZW1vdmVOZXN0ZWRJY3U6XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBuZXN0ZWRJY3VOb2RlSW5kZXggPVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlbW92ZUNvZGVzW2sgKyAxXSBhcyBudW1iZXIgPj4+IEkxOG5NdXRhdGVPcENvZGUuU0hJRlRfUkVGO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbmVzdGVkSWN1VE5vZGUgPVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdldFROb2RlKG5lc3RlZEljdU5vZGVJbmRleCwgdmlld0RhdGEpIGFzIFRJY3VDb250YWluZXJOb2RlO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgYWN0aXZlSW5kZXggPSBuZXN0ZWRJY3VUTm9kZS5hY3RpdmVDYXNlSW5kZXg7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoYWN0aXZlSW5kZXggIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbmVzdGVkSWN1VEluZGV4ID0gcmVtb3ZlT3BDb2RlID4+PiBJMThuTXV0YXRlT3BDb2RlLlNISUZUX1JFRjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbmVzdGVkVEljdSA9IGljdXMgIVtuZXN0ZWRJY3VUSW5kZXhdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICBhZGRBbGxUb0FycmF5KG5lc3RlZFRJY3UucmVtb3ZlW2FjdGl2ZUluZGV4XSwgcmVtb3ZlQ29kZXMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBVcGRhdGUgdGhlIGFjdGl2ZSBjYXNlSW5kZXhcbiAgICAgICAgICAgICAgICBjb25zdCBjYXNlSW5kZXggPSBnZXRDYXNlSW5kZXgodEljdSwgdmFsdWUpO1xuICAgICAgICAgICAgICAgIGljdVROb2RlLmFjdGl2ZUNhc2VJbmRleCA9IGNhc2VJbmRleCAhPT0gLTEgPyBjYXNlSW5kZXggOiBudWxsO1xuXG4gICAgICAgICAgICAgICAgLy8gQWRkIHRoZSBub2RlcyBmb3IgdGhlIG5ldyBjYXNlXG4gICAgICAgICAgICAgICAgcmVhZENyZWF0ZU9wQ29kZXMoLTEsIHRJY3UuY3JlYXRlW2Nhc2VJbmRleF0sIHZpZXdEYXRhKTtcbiAgICAgICAgICAgICAgICBjYXNlQ3JlYXRlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgIGNhc2UgSTE4blVwZGF0ZU9wQ29kZS5JY3VVcGRhdGU6XG4gICAgICAgICAgICAgICAgdEljdUluZGV4ID0gdXBkYXRlT3BDb2Rlc1srK2pdIGFzIG51bWJlcjtcbiAgICAgICAgICAgICAgICB0SWN1ID0gaWN1cyAhW3RJY3VJbmRleF07XG4gICAgICAgICAgICAgICAgaWN1VE5vZGUgPSBnZXRUTm9kZShub2RlSW5kZXgsIHZpZXdEYXRhKSBhcyBUSWN1Q29udGFpbmVyTm9kZTtcbiAgICAgICAgICAgICAgICByZWFkVXBkYXRlT3BDb2RlcyhcbiAgICAgICAgICAgICAgICAgICAgdEljdS51cGRhdGVbaWN1VE5vZGUuYWN0aXZlQ2FzZUluZGV4ICFdLCBpY3VzLCBiaW5kaW5nc1N0YXJ0SW5kZXgsIGNoYW5nZU1hc2ssXG4gICAgICAgICAgICAgICAgICAgIHZpZXdEYXRhLCBjYXNlQ3JlYXRlZCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIGkgKz0gc2tpcENvZGVzO1xuICB9XG59XG5cbmZ1bmN0aW9uIHJlbW92ZU5vZGUoaW5kZXg6IG51bWJlciwgdmlld0RhdGE6IExWaWV3LCBtYXJrQXNEZXRhY2hlZDogYm9vbGVhbikge1xuICBjb25zdCByZW1vdmVkUGhUTm9kZSA9IGdldFROb2RlKGluZGV4LCB2aWV3RGF0YSk7XG4gIGNvbnN0IHJlbW92ZWRQaFJOb2RlID0gZ2V0TmF0aXZlQnlJbmRleChpbmRleCwgdmlld0RhdGEpO1xuICBpZiAocmVtb3ZlZFBoUk5vZGUpIHtcbiAgICBuYXRpdmVSZW1vdmVOb2RlKHZpZXdEYXRhW1JFTkRFUkVSXSwgcmVtb3ZlZFBoUk5vZGUpO1xuICB9XG5cbiAgY29uc3Qgc2xvdFZhbHVlID0gbG9hZCh2aWV3RGF0YSwgaW5kZXgpIGFzIFJFbGVtZW50IHwgUkNvbW1lbnQgfCBMQ29udGFpbmVyO1xuICBpZiAoaXNMQ29udGFpbmVyKHNsb3RWYWx1ZSkpIHtcbiAgICBjb25zdCBsQ29udGFpbmVyID0gc2xvdFZhbHVlIGFzIExDb250YWluZXI7XG4gICAgaWYgKHJlbW92ZWRQaFROb2RlLnR5cGUgIT09IFROb2RlVHlwZS5Db250YWluZXIpIHtcbiAgICAgIG5hdGl2ZVJlbW92ZU5vZGUodmlld0RhdGFbUkVOREVSRVJdLCBsQ29udGFpbmVyW05BVElWRV0pO1xuICAgIH1cbiAgfVxuXG4gIGlmIChtYXJrQXNEZXRhY2hlZCkge1xuICAgIC8vIERlZmluZSB0aGlzIG5vZGUgYXMgZGV0YWNoZWQgdG8gYXZvaWQgcHJvamVjdGluZyBpdCBsYXRlclxuICAgIHJlbW92ZWRQaFROb2RlLmZsYWdzIHw9IFROb2RlRmxhZ3MuaXNEZXRhY2hlZDtcbiAgfVxuICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyUmVtb3ZlTm9kZSsrO1xufVxuXG4vKipcbiAqXG4gKiBVc2UgdGhpcyBpbnN0cnVjdGlvbiB0byBjcmVhdGUgYSB0cmFuc2xhdGlvbiBibG9jayB0aGF0IGRvZXNuJ3QgY29udGFpbiBhbnkgcGxhY2Vob2xkZXIuXG4gKiBJdCBjYWxscyBib3RoIHtAbGluayBpMThuU3RhcnR9IGFuZCB7QGxpbmsgaTE4bkVuZH0gaW4gb25lIGluc3RydWN0aW9uLlxuICpcbiAqIFRoZSB0cmFuc2xhdGlvbiBgbWVzc2FnZWAgaXMgdGhlIHZhbHVlIHdoaWNoIGlzIGxvY2FsZSBzcGVjaWZpYy4gVGhlIHRyYW5zbGF0aW9uIHN0cmluZyBtYXlcbiAqIGNvbnRhaW4gcGxhY2Vob2xkZXJzIHdoaWNoIGFzc29jaWF0ZSBpbm5lciBlbGVtZW50cyBhbmQgc3ViLXRlbXBsYXRlcyB3aXRoaW4gdGhlIHRyYW5zbGF0aW9uLlxuICpcbiAqIFRoZSB0cmFuc2xhdGlvbiBgbWVzc2FnZWAgcGxhY2Vob2xkZXJzIGFyZTpcbiAqIC0gYO+/vXtpbmRleH0oOntibG9ja30p77+9YDogKkJpbmRpbmcgUGxhY2Vob2xkZXIqOiBNYXJrcyBhIGxvY2F0aW9uIHdoZXJlIGFuIGV4cHJlc3Npb24gd2lsbCBiZVxuICogICBpbnRlcnBvbGF0ZWQgaW50by4gVGhlIHBsYWNlaG9sZGVyIGBpbmRleGAgcG9pbnRzIHRvIHRoZSBleHByZXNzaW9uIGJpbmRpbmcgaW5kZXguIEFuIG9wdGlvbmFsXG4gKiAgIGBibG9ja2AgdGhhdCBtYXRjaGVzIHRoZSBzdWItdGVtcGxhdGUgaW4gd2hpY2ggaXQgd2FzIGRlY2xhcmVkLlxuICogLSBg77+9I3tpbmRleH0oOntibG9ja30p77+9YC9g77+9LyN7aW5kZXh9KDp7YmxvY2t9Ke+/vWA6ICpFbGVtZW50IFBsYWNlaG9sZGVyKjogIE1hcmtzIHRoZSBiZWdpbm5pbmdcbiAqICAgYW5kIGVuZCBvZiBET00gZWxlbWVudCB0aGF0IHdlcmUgZW1iZWRkZWQgaW4gdGhlIG9yaWdpbmFsIHRyYW5zbGF0aW9uIGJsb2NrLiBUaGUgcGxhY2Vob2xkZXJcbiAqICAgYGluZGV4YCBwb2ludHMgdG8gdGhlIGVsZW1lbnQgaW5kZXggaW4gdGhlIHRlbXBsYXRlIGluc3RydWN0aW9ucyBzZXQuIEFuIG9wdGlvbmFsIGBibG9ja2AgdGhhdFxuICogICBtYXRjaGVzIHRoZSBzdWItdGVtcGxhdGUgaW4gd2hpY2ggaXQgd2FzIGRlY2xhcmVkLlxuICogLSBg77+9KntpbmRleH06e2Jsb2Nrfe+/vWAvYO+/vS8qe2luZGV4fTp7YmxvY2t977+9YDogKlN1Yi10ZW1wbGF0ZSBQbGFjZWhvbGRlcio6IFN1Yi10ZW1wbGF0ZXMgbXVzdCBiZVxuICogICBzcGxpdCB1cCBhbmQgdHJhbnNsYXRlZCBzZXBhcmF0ZWx5IGluIGVhY2ggYW5ndWxhciB0ZW1wbGF0ZSBmdW5jdGlvbi4gVGhlIGBpbmRleGAgcG9pbnRzIHRvIHRoZVxuICogICBgdGVtcGxhdGVgIGluc3RydWN0aW9uIGluZGV4LiBBIGBibG9ja2AgdGhhdCBtYXRjaGVzIHRoZSBzdWItdGVtcGxhdGUgaW4gd2hpY2ggaXQgd2FzIGRlY2xhcmVkLlxuICpcbiAqIEBwYXJhbSBpbmRleCBBIHVuaXF1ZSBpbmRleCBvZiB0aGUgdHJhbnNsYXRpb24gaW4gdGhlIHN0YXRpYyBibG9jay5cbiAqIEBwYXJhbSBtZXNzYWdlIFRoZSB0cmFuc2xhdGlvbiBtZXNzYWdlLlxuICogQHBhcmFtIHN1YlRlbXBsYXRlSW5kZXggT3B0aW9uYWwgc3ViLXRlbXBsYXRlIGluZGV4IGluIHRoZSBgbWVzc2FnZWAuXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVpMThuKGluZGV4OiBudW1iZXIsIG1lc3NhZ2U6IHN0cmluZywgc3ViVGVtcGxhdGVJbmRleD86IG51bWJlcik6IHZvaWQge1xuICDJtcm1aTE4blN0YXJ0KGluZGV4LCBtZXNzYWdlLCBzdWJUZW1wbGF0ZUluZGV4KTtcbiAgybXJtWkxOG5FbmQoKTtcbn1cblxuLyoqXG4gKiBNYXJrcyBhIGxpc3Qgb2YgYXR0cmlidXRlcyBhcyB0cmFuc2xhdGFibGUuXG4gKlxuICogQHBhcmFtIGluZGV4IEEgdW5pcXVlIGluZGV4IGluIHRoZSBzdGF0aWMgYmxvY2tcbiAqIEBwYXJhbSB2YWx1ZXNcbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWkxOG5BdHRyaWJ1dGVzKGluZGV4OiBudW1iZXIsIHZhbHVlczogc3RyaW5nW10pOiB2b2lkIHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQodFZpZXcsIGB0VmlldyBzaG91bGQgYmUgZGVmaW5lZGApO1xuICBpMThuQXR0cmlidXRlc0ZpcnN0UGFzcyhsVmlldywgdFZpZXcsIGluZGV4LCB2YWx1ZXMpO1xufVxuXG4vKipcbiAqIFNlZSBgaTE4bkF0dHJpYnV0ZXNgIGFib3ZlLlxuICovXG5mdW5jdGlvbiBpMThuQXR0cmlidXRlc0ZpcnN0UGFzcyhsVmlldzogTFZpZXcsIHRWaWV3OiBUVmlldywgaW5kZXg6IG51bWJlciwgdmFsdWVzOiBzdHJpbmdbXSkge1xuICBjb25zdCBwcmV2aW91c0VsZW1lbnQgPSBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKTtcbiAgY29uc3QgcHJldmlvdXNFbGVtZW50SW5kZXggPSBwcmV2aW91c0VsZW1lbnQuaW5kZXggLSBIRUFERVJfT0ZGU0VUO1xuICBjb25zdCB1cGRhdGVPcENvZGVzOiBJMThuVXBkYXRlT3BDb2RlcyA9IFtdO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IHZhbHVlcy5sZW5ndGg7IGkgKz0gMikge1xuICAgIGNvbnN0IGF0dHJOYW1lID0gdmFsdWVzW2ldO1xuICAgIGNvbnN0IG1lc3NhZ2UgPSB2YWx1ZXNbaSArIDFdO1xuICAgIGNvbnN0IHBhcnRzID0gbWVzc2FnZS5zcGxpdChJQ1VfUkVHRVhQKTtcbiAgICBmb3IgKGxldCBqID0gMDsgaiA8IHBhcnRzLmxlbmd0aDsgaisrKSB7XG4gICAgICBjb25zdCB2YWx1ZSA9IHBhcnRzW2pdO1xuXG4gICAgICBpZiAoaiAmIDEpIHtcbiAgICAgICAgLy8gT2RkIGluZGV4ZXMgYXJlIElDVSBleHByZXNzaW9uc1xuICAgICAgICAvLyBUT0RPKG9jb21iZSk6IHN1cHBvcnQgSUNVIGV4cHJlc3Npb25zIGluIGF0dHJpYnV0ZXNcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJQ1UgZXhwcmVzc2lvbnMgYXJlIG5vdCB5ZXQgc3VwcG9ydGVkIGluIGF0dHJpYnV0ZXMnKTtcbiAgICAgIH0gZWxzZSBpZiAodmFsdWUgIT09ICcnKSB7XG4gICAgICAgIC8vIEV2ZW4gaW5kZXhlcyBhcmUgdGV4dCAoaW5jbHVkaW5nIGJpbmRpbmdzKVxuICAgICAgICBjb25zdCBoYXNCaW5kaW5nID0gISF2YWx1ZS5tYXRjaChCSU5ESU5HX1JFR0VYUCk7XG4gICAgICAgIGlmIChoYXNCaW5kaW5nKSB7XG4gICAgICAgICAgaWYgKHRWaWV3LmZpcnN0VGVtcGxhdGVQYXNzICYmIHRWaWV3LmRhdGFbaW5kZXggKyBIRUFERVJfT0ZGU0VUXSA9PT0gbnVsbCkge1xuICAgICAgICAgICAgYWRkQWxsVG9BcnJheShcbiAgICAgICAgICAgICAgICBnZW5lcmF0ZUJpbmRpbmdVcGRhdGVPcENvZGVzKHZhbHVlLCBwcmV2aW91c0VsZW1lbnRJbmRleCwgYXR0ck5hbWUpLCB1cGRhdGVPcENvZGVzKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZWxlbWVudEF0dHJpYnV0ZUludGVybmFsKHByZXZpb3VzRWxlbWVudEluZGV4LCBhdHRyTmFtZSwgdmFsdWUsIGxWaWV3KTtcbiAgICAgICAgICAvLyBDaGVjayBpZiB0aGF0IGF0dHJpYnV0ZSBpcyBhIGRpcmVjdGl2ZSBpbnB1dFxuICAgICAgICAgIGNvbnN0IHROb2RlID0gZ2V0VE5vZGUocHJldmlvdXNFbGVtZW50SW5kZXgsIGxWaWV3KTtcbiAgICAgICAgICBjb25zdCBkYXRhVmFsdWUgPSB0Tm9kZS5pbnB1dHMgJiYgdE5vZGUuaW5wdXRzW2F0dHJOYW1lXTtcbiAgICAgICAgICBpZiAoZGF0YVZhbHVlKSB7XG4gICAgICAgICAgICBzZXRJbnB1dHNGb3JQcm9wZXJ0eShsVmlldywgZGF0YVZhbHVlLCB2YWx1ZSk7XG4gICAgICAgICAgICBpZiAobmdEZXZNb2RlKSB7XG4gICAgICAgICAgICAgIGNvbnN0IGVsZW1lbnQgPSBnZXROYXRpdmVCeUluZGV4KHByZXZpb3VzRWxlbWVudEluZGV4LCBsVmlldykgYXMgUkVsZW1lbnQgfCBSQ29tbWVudDtcbiAgICAgICAgICAgICAgc2V0TmdSZWZsZWN0UHJvcGVydGllcyhsVmlldywgZWxlbWVudCwgdE5vZGUudHlwZSwgZGF0YVZhbHVlLCB2YWx1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgaWYgKHRWaWV3LmZpcnN0VGVtcGxhdGVQYXNzICYmIHRWaWV3LmRhdGFbaW5kZXggKyBIRUFERVJfT0ZGU0VUXSA9PT0gbnVsbCkge1xuICAgIHRWaWV3LmRhdGFbaW5kZXggKyBIRUFERVJfT0ZGU0VUXSA9IHVwZGF0ZU9wQ29kZXM7XG4gIH1cbn1cblxubGV0IGNoYW5nZU1hc2sgPSAwYjA7XG5sZXQgc2hpZnRzQ291bnRlciA9IDA7XG5cbi8qKlxuICogU3RvcmVzIHRoZSB2YWx1ZXMgb2YgdGhlIGJpbmRpbmdzIGR1cmluZyBlYWNoIHVwZGF0ZSBjeWNsZSBpbiBvcmRlciB0byBkZXRlcm1pbmUgaWYgd2UgbmVlZCB0b1xuICogdXBkYXRlIHRoZSB0cmFuc2xhdGVkIG5vZGVzLlxuICpcbiAqIEBwYXJhbSB2YWx1ZSBUaGUgYmluZGluZydzIHZhbHVlXG4gKiBAcmV0dXJucyBUaGlzIGZ1bmN0aW9uIHJldHVybnMgaXRzZWxmIHNvIHRoYXQgaXQgbWF5IGJlIGNoYWluZWRcbiAqIChlLmcuIGBpMThuRXhwKGN0eC5uYW1lKShjdHgudGl0bGUpYClcbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWkxOG5FeHA8VD4odmFsdWU6IFQpOiBUc2lja2xlSXNzdWUxMDA5IHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBpZiAoYmluZGluZ1VwZGF0ZWQobFZpZXcsIG5leHRCaW5kaW5nSW5kZXgoKSwgdmFsdWUpKSB7XG4gICAgY2hhbmdlTWFzayA9IGNoYW5nZU1hc2sgfCAoMSA8PCBzaGlmdHNDb3VudGVyKTtcbiAgfVxuICBzaGlmdHNDb3VudGVyKys7XG4gIHJldHVybiDJtcm1aTE4bkV4cDtcbn1cblxuLyoqXG4gKiBVcGRhdGVzIGEgdHJhbnNsYXRpb24gYmxvY2sgb3IgYW4gaTE4biBhdHRyaWJ1dGUgd2hlbiB0aGUgYmluZGluZ3MgaGF2ZSBjaGFuZ2VkLlxuICpcbiAqIEBwYXJhbSBpbmRleCBJbmRleCBvZiBlaXRoZXIge0BsaW5rIGkxOG5TdGFydH0gKHRyYW5zbGF0aW9uIGJsb2NrKSBvciB7QGxpbmsgaTE4bkF0dHJpYnV0ZXN9XG4gKiAoaTE4biBhdHRyaWJ1dGUpIG9uIHdoaWNoIGl0IHNob3VsZCB1cGRhdGUgdGhlIGNvbnRlbnQuXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVpMThuQXBwbHkoaW5kZXg6IG51bWJlcikge1xuICBpZiAoc2hpZnRzQ291bnRlcikge1xuICAgIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZCh0VmlldywgYHRWaWV3IHNob3VsZCBiZSBkZWZpbmVkYCk7XG4gICAgY29uc3QgdEkxOG4gPSB0Vmlldy5kYXRhW2luZGV4ICsgSEVBREVSX09GRlNFVF07XG4gICAgbGV0IHVwZGF0ZU9wQ29kZXM6IEkxOG5VcGRhdGVPcENvZGVzO1xuICAgIGxldCBpY3VzOiBUSWN1W118bnVsbCA9IG51bGw7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkodEkxOG4pKSB7XG4gICAgICB1cGRhdGVPcENvZGVzID0gdEkxOG4gYXMgSTE4blVwZGF0ZU9wQ29kZXM7XG4gICAgfSBlbHNlIHtcbiAgICAgIHVwZGF0ZU9wQ29kZXMgPSAodEkxOG4gYXMgVEkxOG4pLnVwZGF0ZTtcbiAgICAgIGljdXMgPSAodEkxOG4gYXMgVEkxOG4pLmljdXM7XG4gICAgfVxuICAgIGNvbnN0IGJpbmRpbmdzU3RhcnRJbmRleCA9IGdldEJpbmRpbmdJbmRleCgpIC0gc2hpZnRzQ291bnRlciAtIDE7XG4gICAgcmVhZFVwZGF0ZU9wQ29kZXModXBkYXRlT3BDb2RlcywgaWN1cywgYmluZGluZ3NTdGFydEluZGV4LCBjaGFuZ2VNYXNrLCBsVmlldyk7XG5cbiAgICAvLyBSZXNldCBjaGFuZ2VNYXNrICYgbWFza0JpdCB0byBkZWZhdWx0IGZvciB0aGUgbmV4dCB1cGRhdGUgY3ljbGVcbiAgICBjaGFuZ2VNYXNrID0gMGIwO1xuICAgIHNoaWZ0c0NvdW50ZXIgPSAwO1xuICB9XG59XG5cbi8qKlxuICogUmV0dXJucyB0aGUgaW5kZXggb2YgdGhlIGN1cnJlbnQgY2FzZSBvZiBhbiBJQ1UgZXhwcmVzc2lvbiBkZXBlbmRpbmcgb24gdGhlIG1haW4gYmluZGluZyB2YWx1ZVxuICpcbiAqIEBwYXJhbSBpY3VFeHByZXNzaW9uXG4gKiBAcGFyYW0gYmluZGluZ1ZhbHVlIFRoZSB2YWx1ZSBvZiB0aGUgbWFpbiBiaW5kaW5nIHVzZWQgYnkgdGhpcyBJQ1UgZXhwcmVzc2lvblxuICovXG5mdW5jdGlvbiBnZXRDYXNlSW5kZXgoaWN1RXhwcmVzc2lvbjogVEljdSwgYmluZGluZ1ZhbHVlOiBzdHJpbmcpOiBudW1iZXIge1xuICBsZXQgaW5kZXggPSBpY3VFeHByZXNzaW9uLmNhc2VzLmluZGV4T2YoYmluZGluZ1ZhbHVlKTtcbiAgaWYgKGluZGV4ID09PSAtMSkge1xuICAgIHN3aXRjaCAoaWN1RXhwcmVzc2lvbi50eXBlKSB7XG4gICAgICBjYXNlIEljdVR5cGUucGx1cmFsOiB7XG4gICAgICAgIGNvbnN0IHJlc29sdmVkQ2FzZSA9IGdldFBsdXJhbENhc2UoYmluZGluZ1ZhbHVlLCBnZXRMb2NhbGVJZCgpKTtcbiAgICAgICAgaW5kZXggPSBpY3VFeHByZXNzaW9uLmNhc2VzLmluZGV4T2YocmVzb2x2ZWRDYXNlKTtcbiAgICAgICAgaWYgKGluZGV4ID09PSAtMSAmJiByZXNvbHZlZENhc2UgIT09ICdvdGhlcicpIHtcbiAgICAgICAgICBpbmRleCA9IGljdUV4cHJlc3Npb24uY2FzZXMuaW5kZXhPZignb3RoZXInKTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNhc2UgSWN1VHlwZS5zZWxlY3Q6IHtcbiAgICAgICAgaW5kZXggPSBpY3VFeHByZXNzaW9uLmNhc2VzLmluZGV4T2YoJ290aGVyJyk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gaW5kZXg7XG59XG5cbi8qKlxuICogR2VuZXJhdGUgdGhlIE9wQ29kZXMgZm9yIElDVSBleHByZXNzaW9ucy5cbiAqXG4gKiBAcGFyYW0gdEljdXNcbiAqIEBwYXJhbSBpY3VFeHByZXNzaW9uXG4gKiBAcGFyYW0gc3RhcnRJbmRleFxuICogQHBhcmFtIGV4cGFuZG9TdGFydEluZGV4XG4gKi9cbmZ1bmN0aW9uIGljdVN0YXJ0KFxuICAgIHRJY3VzOiBUSWN1W10sIGljdUV4cHJlc3Npb246IEljdUV4cHJlc3Npb24sIHN0YXJ0SW5kZXg6IG51bWJlcixcbiAgICBleHBhbmRvU3RhcnRJbmRleDogbnVtYmVyKTogdm9pZCB7XG4gIGNvbnN0IGNyZWF0ZUNvZGVzID0gW107XG4gIGNvbnN0IHJlbW92ZUNvZGVzID0gW107XG4gIGNvbnN0IHVwZGF0ZUNvZGVzID0gW107XG4gIGNvbnN0IHZhcnMgPSBbXTtcbiAgY29uc3QgY2hpbGRJY3VzOiBudW1iZXJbXVtdID0gW107XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgaWN1RXhwcmVzc2lvbi52YWx1ZXMubGVuZ3RoOyBpKyspIHtcbiAgICAvLyBFYWNoIHZhbHVlIGlzIGFuIGFycmF5IG9mIHN0cmluZ3MgJiBvdGhlciBJQ1UgZXhwcmVzc2lvbnNcbiAgICBjb25zdCB2YWx1ZUFyciA9IGljdUV4cHJlc3Npb24udmFsdWVzW2ldO1xuICAgIGNvbnN0IG5lc3RlZEljdXM6IEljdUV4cHJlc3Npb25bXSA9IFtdO1xuICAgIGZvciAobGV0IGogPSAwOyBqIDwgdmFsdWVBcnIubGVuZ3RoOyBqKyspIHtcbiAgICAgIGNvbnN0IHZhbHVlID0gdmFsdWVBcnJbal07XG4gICAgICBpZiAodHlwZW9mIHZhbHVlICE9PSAnc3RyaW5nJykge1xuICAgICAgICAvLyBJdCBpcyBhbiBuZXN0ZWQgSUNVIGV4cHJlc3Npb25cbiAgICAgICAgY29uc3QgaWN1SW5kZXggPSBuZXN0ZWRJY3VzLnB1c2godmFsdWUgYXMgSWN1RXhwcmVzc2lvbikgLSAxO1xuICAgICAgICAvLyBSZXBsYWNlIG5lc3RlZCBJQ1UgZXhwcmVzc2lvbiBieSBhIGNvbW1lbnQgbm9kZVxuICAgICAgICB2YWx1ZUFycltqXSA9IGA8IS0t77+9JHtpY3VJbmRleH3vv70tLT5gO1xuICAgICAgfVxuICAgIH1cbiAgICBjb25zdCBpY3VDYXNlOiBJY3VDYXNlID1cbiAgICAgICAgcGFyc2VJY3VDYXNlKHZhbHVlQXJyLmpvaW4oJycpLCBzdGFydEluZGV4LCBuZXN0ZWRJY3VzLCB0SWN1cywgZXhwYW5kb1N0YXJ0SW5kZXgpO1xuICAgIGNyZWF0ZUNvZGVzLnB1c2goaWN1Q2FzZS5jcmVhdGUpO1xuICAgIHJlbW92ZUNvZGVzLnB1c2goaWN1Q2FzZS5yZW1vdmUpO1xuICAgIHVwZGF0ZUNvZGVzLnB1c2goaWN1Q2FzZS51cGRhdGUpO1xuICAgIHZhcnMucHVzaChpY3VDYXNlLnZhcnMpO1xuICAgIGNoaWxkSWN1cy5wdXNoKGljdUNhc2UuY2hpbGRJY3VzKTtcbiAgfVxuICBjb25zdCB0SWN1OiBUSWN1ID0ge1xuICAgIHR5cGU6IGljdUV4cHJlc3Npb24udHlwZSxcbiAgICB2YXJzLFxuICAgIGNoaWxkSWN1cyxcbiAgICBjYXNlczogaWN1RXhwcmVzc2lvbi5jYXNlcyxcbiAgICBjcmVhdGU6IGNyZWF0ZUNvZGVzLFxuICAgIHJlbW92ZTogcmVtb3ZlQ29kZXMsXG4gICAgdXBkYXRlOiB1cGRhdGVDb2Rlc1xuICB9O1xuICB0SWN1cy5wdXNoKHRJY3UpO1xuICAvLyBBZGRpbmcgdGhlIG1heGltdW0gcG9zc2libGUgb2YgdmFycyBuZWVkZWQgKGJhc2VkIG9uIHRoZSBjYXNlcyB3aXRoIHRoZSBtb3N0IHZhcnMpXG4gIGkxOG5WYXJzQ291bnQgKz0gTWF0aC5tYXgoLi4udmFycyk7XG59XG5cbi8qKlxuICogVHJhbnNmb3JtcyBhIHN0cmluZyB0ZW1wbGF0ZSBpbnRvIGFuIEhUTUwgdGVtcGxhdGUgYW5kIGEgbGlzdCBvZiBpbnN0cnVjdGlvbnMgdXNlZCB0byB1cGRhdGVcbiAqIGF0dHJpYnV0ZXMgb3Igbm9kZXMgdGhhdCBjb250YWluIGJpbmRpbmdzLlxuICpcbiAqIEBwYXJhbSB1bnNhZmVIdG1sIFRoZSBzdHJpbmcgdG8gcGFyc2VcbiAqIEBwYXJhbSBwYXJlbnRJbmRleFxuICogQHBhcmFtIG5lc3RlZEljdXNcbiAqIEBwYXJhbSB0SWN1c1xuICogQHBhcmFtIGV4cGFuZG9TdGFydEluZGV4XG4gKi9cbmZ1bmN0aW9uIHBhcnNlSWN1Q2FzZShcbiAgICB1bnNhZmVIdG1sOiBzdHJpbmcsIHBhcmVudEluZGV4OiBudW1iZXIsIG5lc3RlZEljdXM6IEljdUV4cHJlc3Npb25bXSwgdEljdXM6IFRJY3VbXSxcbiAgICBleHBhbmRvU3RhcnRJbmRleDogbnVtYmVyKTogSWN1Q2FzZSB7XG4gIGNvbnN0IGluZXJ0Qm9keUhlbHBlciA9IG5ldyBJbmVydEJvZHlIZWxwZXIoZG9jdW1lbnQpO1xuICBjb25zdCBpbmVydEJvZHlFbGVtZW50ID0gaW5lcnRCb2R5SGVscGVyLmdldEluZXJ0Qm9keUVsZW1lbnQodW5zYWZlSHRtbCk7XG4gIGlmICghaW5lcnRCb2R5RWxlbWVudCkge1xuICAgIHRocm93IG5ldyBFcnJvcignVW5hYmxlIHRvIGdlbmVyYXRlIGluZXJ0IGJvZHkgZWxlbWVudCcpO1xuICB9XG4gIGNvbnN0IHdyYXBwZXIgPSBnZXRUZW1wbGF0ZUNvbnRlbnQoaW5lcnRCb2R5RWxlbWVudCAhKSBhcyBFbGVtZW50IHx8IGluZXJ0Qm9keUVsZW1lbnQ7XG4gIGNvbnN0IG9wQ29kZXM6IEljdUNhc2UgPSB7dmFyczogMCwgY2hpbGRJY3VzOiBbXSwgY3JlYXRlOiBbXSwgcmVtb3ZlOiBbXSwgdXBkYXRlOiBbXX07XG4gIHBhcnNlTm9kZXMod3JhcHBlci5maXJzdENoaWxkLCBvcENvZGVzLCBwYXJlbnRJbmRleCwgbmVzdGVkSWN1cywgdEljdXMsIGV4cGFuZG9TdGFydEluZGV4KTtcbiAgcmV0dXJuIG9wQ29kZXM7XG59XG5cbmNvbnN0IE5FU1RFRF9JQ1UgPSAv77+9KFxcZCsp77+9LztcblxuLyoqXG4gKiBQYXJzZXMgYSBub2RlLCBpdHMgY2hpbGRyZW4gYW5kIGl0cyBzaWJsaW5ncywgYW5kIGdlbmVyYXRlcyB0aGUgbXV0YXRlICYgdXBkYXRlIE9wQ29kZXMuXG4gKlxuICogQHBhcmFtIGN1cnJlbnROb2RlIFRoZSBmaXJzdCBub2RlIHRvIHBhcnNlXG4gKiBAcGFyYW0gaWN1Q2FzZSBUaGUgZGF0YSBmb3IgdGhlIElDVSBleHByZXNzaW9uIGNhc2UgdGhhdCBjb250YWlucyB0aG9zZSBub2Rlc1xuICogQHBhcmFtIHBhcmVudEluZGV4IEluZGV4IG9mIHRoZSBjdXJyZW50IG5vZGUncyBwYXJlbnRcbiAqIEBwYXJhbSBuZXN0ZWRJY3VzIERhdGEgZm9yIHRoZSBuZXN0ZWQgSUNVIGV4cHJlc3Npb25zIHRoYXQgdGhpcyBjYXNlIGNvbnRhaW5zXG4gKiBAcGFyYW0gdEljdXMgRGF0YSBmb3IgYWxsIElDVSBleHByZXNzaW9ucyBvZiB0aGUgY3VycmVudCBtZXNzYWdlXG4gKiBAcGFyYW0gZXhwYW5kb1N0YXJ0SW5kZXggRXhwYW5kbyBzdGFydCBpbmRleCBmb3IgdGhlIGN1cnJlbnQgSUNVIGV4cHJlc3Npb25cbiAqL1xuZnVuY3Rpb24gcGFyc2VOb2RlcyhcbiAgICBjdXJyZW50Tm9kZTogTm9kZSB8IG51bGwsIGljdUNhc2U6IEljdUNhc2UsIHBhcmVudEluZGV4OiBudW1iZXIsIG5lc3RlZEljdXM6IEljdUV4cHJlc3Npb25bXSxcbiAgICB0SWN1czogVEljdVtdLCBleHBhbmRvU3RhcnRJbmRleDogbnVtYmVyKSB7XG4gIGlmIChjdXJyZW50Tm9kZSkge1xuICAgIGNvbnN0IG5lc3RlZEljdXNUb0NyZWF0ZTogW0ljdUV4cHJlc3Npb24sIG51bWJlcl1bXSA9IFtdO1xuICAgIHdoaWxlIChjdXJyZW50Tm9kZSkge1xuICAgICAgY29uc3QgbmV4dE5vZGU6IE5vZGV8bnVsbCA9IGN1cnJlbnROb2RlLm5leHRTaWJsaW5nO1xuICAgICAgY29uc3QgbmV3SW5kZXggPSBleHBhbmRvU3RhcnRJbmRleCArICsraWN1Q2FzZS52YXJzO1xuICAgICAgc3dpdGNoIChjdXJyZW50Tm9kZS5ub2RlVHlwZSkge1xuICAgICAgICBjYXNlIE5vZGUuRUxFTUVOVF9OT0RFOlxuICAgICAgICAgIGNvbnN0IGVsZW1lbnQgPSBjdXJyZW50Tm9kZSBhcyBFbGVtZW50O1xuICAgICAgICAgIGNvbnN0IHRhZ05hbWUgPSBlbGVtZW50LnRhZ05hbWUudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICBpZiAoIVZBTElEX0VMRU1FTlRTLmhhc093blByb3BlcnR5KHRhZ05hbWUpKSB7XG4gICAgICAgICAgICAvLyBUaGlzIGlzbid0IGEgdmFsaWQgZWxlbWVudCwgd2Ugd29uJ3QgY3JlYXRlIGFuIGVsZW1lbnQgZm9yIGl0XG4gICAgICAgICAgICBpY3VDYXNlLnZhcnMtLTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWN1Q2FzZS5jcmVhdGUucHVzaChcbiAgICAgICAgICAgICAgICBFTEVNRU5UX01BUktFUiwgdGFnTmFtZSwgbmV3SW5kZXgsXG4gICAgICAgICAgICAgICAgcGFyZW50SW5kZXggPDwgSTE4bk11dGF0ZU9wQ29kZS5TSElGVF9QQVJFTlQgfCBJMThuTXV0YXRlT3BDb2RlLkFwcGVuZENoaWxkKTtcbiAgICAgICAgICAgIGNvbnN0IGVsQXR0cnMgPSBlbGVtZW50LmF0dHJpYnV0ZXM7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGVsQXR0cnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgY29uc3QgYXR0ciA9IGVsQXR0cnMuaXRlbShpKSAhO1xuICAgICAgICAgICAgICBjb25zdCBsb3dlckF0dHJOYW1lID0gYXR0ci5uYW1lLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgICAgIGNvbnN0IGhhc0JpbmRpbmcgPSAhIWF0dHIudmFsdWUubWF0Y2goQklORElOR19SRUdFWFApO1xuICAgICAgICAgICAgICAvLyB3ZSBhc3N1bWUgdGhlIGlucHV0IHN0cmluZyBpcyBzYWZlLCB1bmxlc3MgaXQncyB1c2luZyBhIGJpbmRpbmdcbiAgICAgICAgICAgICAgaWYgKGhhc0JpbmRpbmcpIHtcbiAgICAgICAgICAgICAgICBpZiAoVkFMSURfQVRUUlMuaGFzT3duUHJvcGVydHkobG93ZXJBdHRyTmFtZSkpIHtcbiAgICAgICAgICAgICAgICAgIGlmIChVUklfQVRUUlNbbG93ZXJBdHRyTmFtZV0pIHtcbiAgICAgICAgICAgICAgICAgICAgYWRkQWxsVG9BcnJheShcbiAgICAgICAgICAgICAgICAgICAgICAgIGdlbmVyYXRlQmluZGluZ1VwZGF0ZU9wQ29kZXMoYXR0ci52YWx1ZSwgbmV3SW5kZXgsIGF0dHIubmFtZSwgX3Nhbml0aXplVXJsKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGljdUNhc2UudXBkYXRlKTtcbiAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoU1JDU0VUX0FUVFJTW2xvd2VyQXR0ck5hbWVdKSB7XG4gICAgICAgICAgICAgICAgICAgIGFkZEFsbFRvQXJyYXkoXG4gICAgICAgICAgICAgICAgICAgICAgICBnZW5lcmF0ZUJpbmRpbmdVcGRhdGVPcENvZGVzKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF0dHIudmFsdWUsIG5ld0luZGV4LCBhdHRyLm5hbWUsIHNhbml0aXplU3Jjc2V0KSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGljdUNhc2UudXBkYXRlKTtcbiAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGFkZEFsbFRvQXJyYXkoXG4gICAgICAgICAgICAgICAgICAgICAgICBnZW5lcmF0ZUJpbmRpbmdVcGRhdGVPcENvZGVzKGF0dHIudmFsdWUsIG5ld0luZGV4LCBhdHRyLm5hbWUpLFxuICAgICAgICAgICAgICAgICAgICAgICAgaWN1Q2FzZS51cGRhdGUpO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICBuZ0Rldk1vZGUgJiZcbiAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGBXQVJOSU5HOiBpZ25vcmluZyB1bnNhZmUgYXR0cmlidXRlIHZhbHVlICR7bG93ZXJBdHRyTmFtZX0gb24gZWxlbWVudCAke3RhZ05hbWV9IChzZWUgaHR0cDovL2cuY28vbmcvc2VjdXJpdHkjeHNzKWApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpY3VDYXNlLmNyZWF0ZS5wdXNoKFxuICAgICAgICAgICAgICAgICAgICBuZXdJbmRleCA8PCBJMThuTXV0YXRlT3BDb2RlLlNISUZUX1JFRiB8IEkxOG5NdXRhdGVPcENvZGUuQXR0ciwgYXR0ci5uYW1lLFxuICAgICAgICAgICAgICAgICAgICBhdHRyLnZhbHVlKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gUGFyc2UgdGhlIGNoaWxkcmVuIG9mIHRoaXMgbm9kZSAoaWYgYW55KVxuICAgICAgICAgICAgcGFyc2VOb2RlcyhcbiAgICAgICAgICAgICAgICBjdXJyZW50Tm9kZS5maXJzdENoaWxkLCBpY3VDYXNlLCBuZXdJbmRleCwgbmVzdGVkSWN1cywgdEljdXMsIGV4cGFuZG9TdGFydEluZGV4KTtcbiAgICAgICAgICAgIC8vIFJlbW92ZSB0aGUgcGFyZW50IG5vZGUgYWZ0ZXIgdGhlIGNoaWxkcmVuXG4gICAgICAgICAgICBpY3VDYXNlLnJlbW92ZS5wdXNoKG5ld0luZGV4IDw8IEkxOG5NdXRhdGVPcENvZGUuU0hJRlRfUkVGIHwgSTE4bk11dGF0ZU9wQ29kZS5SZW1vdmUpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBOb2RlLlRFWFRfTk9ERTpcbiAgICAgICAgICBjb25zdCB2YWx1ZSA9IGN1cnJlbnROb2RlLnRleHRDb250ZW50IHx8ICcnO1xuICAgICAgICAgIGNvbnN0IGhhc0JpbmRpbmcgPSB2YWx1ZS5tYXRjaChCSU5ESU5HX1JFR0VYUCk7XG4gICAgICAgICAgaWN1Q2FzZS5jcmVhdGUucHVzaChcbiAgICAgICAgICAgICAgaGFzQmluZGluZyA/ICcnIDogdmFsdWUsIG5ld0luZGV4LFxuICAgICAgICAgICAgICBwYXJlbnRJbmRleCA8PCBJMThuTXV0YXRlT3BDb2RlLlNISUZUX1BBUkVOVCB8IEkxOG5NdXRhdGVPcENvZGUuQXBwZW5kQ2hpbGQpO1xuICAgICAgICAgIGljdUNhc2UucmVtb3ZlLnB1c2gobmV3SW5kZXggPDwgSTE4bk11dGF0ZU9wQ29kZS5TSElGVF9SRUYgfCBJMThuTXV0YXRlT3BDb2RlLlJlbW92ZSk7XG4gICAgICAgICAgaWYgKGhhc0JpbmRpbmcpIHtcbiAgICAgICAgICAgIGFkZEFsbFRvQXJyYXkoZ2VuZXJhdGVCaW5kaW5nVXBkYXRlT3BDb2Rlcyh2YWx1ZSwgbmV3SW5kZXgpLCBpY3VDYXNlLnVwZGF0ZSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIE5vZGUuQ09NTUVOVF9OT0RFOlxuICAgICAgICAgIC8vIENoZWNrIGlmIHRoZSBjb21tZW50IG5vZGUgaXMgYSBwbGFjZWhvbGRlciBmb3IgYSBuZXN0ZWQgSUNVXG4gICAgICAgICAgY29uc3QgbWF0Y2ggPSBORVNURURfSUNVLmV4ZWMoY3VycmVudE5vZGUudGV4dENvbnRlbnQgfHwgJycpO1xuICAgICAgICAgIGlmIChtYXRjaCkge1xuICAgICAgICAgICAgY29uc3QgbmVzdGVkSWN1SW5kZXggPSBwYXJzZUludChtYXRjaFsxXSwgMTApO1xuICAgICAgICAgICAgY29uc3QgbmV3TG9jYWwgPSBuZ0Rldk1vZGUgPyBgbmVzdGVkIElDVSAke25lc3RlZEljdUluZGV4fWAgOiAnJztcbiAgICAgICAgICAgIC8vIENyZWF0ZSB0aGUgY29tbWVudCBub2RlIHRoYXQgd2lsbCBhbmNob3IgdGhlIElDVSBleHByZXNzaW9uXG4gICAgICAgICAgICBpY3VDYXNlLmNyZWF0ZS5wdXNoKFxuICAgICAgICAgICAgICAgIENPTU1FTlRfTUFSS0VSLCBuZXdMb2NhbCwgbmV3SW5kZXgsXG4gICAgICAgICAgICAgICAgcGFyZW50SW5kZXggPDwgSTE4bk11dGF0ZU9wQ29kZS5TSElGVF9QQVJFTlQgfCBJMThuTXV0YXRlT3BDb2RlLkFwcGVuZENoaWxkKTtcbiAgICAgICAgICAgIGNvbnN0IG5lc3RlZEljdSA9IG5lc3RlZEljdXNbbmVzdGVkSWN1SW5kZXhdO1xuICAgICAgICAgICAgbmVzdGVkSWN1c1RvQ3JlYXRlLnB1c2goW25lc3RlZEljdSwgbmV3SW5kZXhdKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gV2UgZG8gbm90IGhhbmRsZSBhbnkgb3RoZXIgdHlwZSBvZiBjb21tZW50XG4gICAgICAgICAgICBpY3VDYXNlLnZhcnMtLTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgLy8gV2UgZG8gbm90IGhhbmRsZSBhbnkgb3RoZXIgdHlwZSBvZiBlbGVtZW50XG4gICAgICAgICAgaWN1Q2FzZS52YXJzLS07XG4gICAgICB9XG4gICAgICBjdXJyZW50Tm9kZSA9IG5leHROb2RlICE7XG4gICAgfVxuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBuZXN0ZWRJY3VzVG9DcmVhdGUubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IG5lc3RlZEljdSA9IG5lc3RlZEljdXNUb0NyZWF0ZVtpXVswXTtcbiAgICAgIGNvbnN0IG5lc3RlZEljdU5vZGVJbmRleCA9IG5lc3RlZEljdXNUb0NyZWF0ZVtpXVsxXTtcbiAgICAgIGljdVN0YXJ0KHRJY3VzLCBuZXN0ZWRJY3UsIG5lc3RlZEljdU5vZGVJbmRleCwgZXhwYW5kb1N0YXJ0SW5kZXggKyBpY3VDYXNlLnZhcnMpO1xuICAgICAgLy8gU2luY2UgdGhpcyBpcyByZWN1cnNpdmUsIHRoZSBsYXN0IFRJY3UgdGhhdCB3YXMgcHVzaGVkIGlzIHRoZSBvbmUgd2Ugd2FudFxuICAgICAgY29uc3QgbmVzdFRJY3VJbmRleCA9IHRJY3VzLmxlbmd0aCAtIDE7XG4gICAgICBpY3VDYXNlLnZhcnMgKz0gTWF0aC5tYXgoLi4udEljdXNbbmVzdFRJY3VJbmRleF0udmFycyk7XG4gICAgICBpY3VDYXNlLmNoaWxkSWN1cy5wdXNoKG5lc3RUSWN1SW5kZXgpO1xuICAgICAgY29uc3QgbWFzayA9IGdldEJpbmRpbmdNYXNrKG5lc3RlZEljdSk7XG4gICAgICBpY3VDYXNlLnVwZGF0ZS5wdXNoKFxuICAgICAgICAgIHRvTWFza0JpdChuZXN0ZWRJY3UubWFpbkJpbmRpbmcpLCAgLy8gbWFzayBvZiB0aGUgbWFpbiBiaW5kaW5nXG4gICAgICAgICAgMywgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBza2lwIDMgb3BDb2RlcyBpZiBub3QgY2hhbmdlZFxuICAgICAgICAgIC0xIC0gbmVzdGVkSWN1Lm1haW5CaW5kaW5nLFxuICAgICAgICAgIG5lc3RlZEljdU5vZGVJbmRleCA8PCBJMThuVXBkYXRlT3BDb2RlLlNISUZUX1JFRiB8IEkxOG5VcGRhdGVPcENvZGUuSWN1U3dpdGNoLFxuICAgICAgICAgIG5lc3RUSWN1SW5kZXgsXG4gICAgICAgICAgbWFzaywgIC8vIG1hc2sgb2YgYWxsIHRoZSBiaW5kaW5ncyBvZiB0aGlzIElDVSBleHByZXNzaW9uXG4gICAgICAgICAgMiwgICAgIC8vIHNraXAgMiBvcENvZGVzIGlmIG5vdCBjaGFuZ2VkXG4gICAgICAgICAgbmVzdGVkSWN1Tm9kZUluZGV4IDw8IEkxOG5VcGRhdGVPcENvZGUuU0hJRlRfUkVGIHwgSTE4blVwZGF0ZU9wQ29kZS5JY3VVcGRhdGUsXG4gICAgICAgICAgbmVzdFRJY3VJbmRleCk7XG4gICAgICBpY3VDYXNlLnJlbW92ZS5wdXNoKFxuICAgICAgICAgIG5lc3RUSWN1SW5kZXggPDwgSTE4bk11dGF0ZU9wQ29kZS5TSElGVF9SRUYgfCBJMThuTXV0YXRlT3BDb2RlLlJlbW92ZU5lc3RlZEljdSxcbiAgICAgICAgICBuZXN0ZWRJY3VOb2RlSW5kZXggPDwgSTE4bk11dGF0ZU9wQ29kZS5TSElGVF9SRUYgfCBJMThuTXV0YXRlT3BDb2RlLlJlbW92ZSk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogQW5ndWxhciBEYXJ0IGludHJvZHVjZWQgJm5nc3A7IGFzIGEgcGxhY2Vob2xkZXIgZm9yIG5vbi1yZW1vdmFibGUgc3BhY2UsIHNlZTpcbiAqIGh0dHBzOi8vZ2l0aHViLmNvbS9kYXJ0LWxhbmcvYW5ndWxhci9ibG9iLzBiYjYxMTM4N2QyOWQ2NWI1YWY3ZjlkMjUxNWFiNTcxZmQzZmJlZTQvX3Rlc3RzL3Rlc3QvY29tcGlsZXIvcHJlc2VydmVfd2hpdGVzcGFjZV90ZXN0LmRhcnQjTDI1LUwzMlxuICogSW4gQW5ndWxhciBEYXJ0ICZuZ3NwOyBpcyBjb252ZXJ0ZWQgdG8gdGhlIDB4RTUwMCBQVUEgKFByaXZhdGUgVXNlIEFyZWFzKSB1bmljb2RlIGNoYXJhY3RlclxuICogYW5kIGxhdGVyIG9uIHJlcGxhY2VkIGJ5IGEgc3BhY2UuIFdlIGFyZSByZS1pbXBsZW1lbnRpbmcgdGhlIHNhbWUgaWRlYSBoZXJlLCBzaW5jZSB0cmFuc2xhdGlvbnNcbiAqIG1pZ2h0IGNvbnRhaW4gdGhpcyBzcGVjaWFsIGNoYXJhY3Rlci5cbiAqL1xuY29uc3QgTkdTUF9VTklDT0RFX1JFR0VYUCA9IC9cXHVFNTAwL2c7XG5mdW5jdGlvbiByZXBsYWNlTmdzcCh2YWx1ZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHZhbHVlLnJlcGxhY2UoTkdTUF9VTklDT0RFX1JFR0VYUCwgJyAnKTtcbn1cblxuLyoqXG4gKiBUaGUgbG9jYWxlIGlkIHRoYXQgdGhlIGFwcGxpY2F0aW9uIGlzIGN1cnJlbnRseSB1c2luZyAoZm9yIHRyYW5zbGF0aW9ucyBhbmQgSUNVIGV4cHJlc3Npb25zKS5cbiAqIFRoaXMgaXMgdGhlIGl2eSB2ZXJzaW9uIG9mIGBMT0NBTEVfSURgIHRoYXQgd2FzIGRlZmluZWQgYXMgYW4gaW5qZWN0aW9uIHRva2VuIGZvciB0aGUgdmlldyBlbmdpbmVcbiAqIGJ1dCBpcyBub3cgZGVmaW5lZCBhcyBhIGdsb2JhbCB2YWx1ZS5cbiAqL1xubGV0IExPQ0FMRV9JRCA9IERFRkFVTFRfTE9DQUxFX0lEO1xuXG4vKipcbiAqIFNldHMgdGhlIGxvY2FsZSBpZCB0aGF0IHdpbGwgYmUgdXNlZCBmb3IgdHJhbnNsYXRpb25zIGFuZCBJQ1UgZXhwcmVzc2lvbnMuXG4gKiBUaGlzIGlzIHRoZSBpdnkgdmVyc2lvbiBvZiBgTE9DQUxFX0lEYCB0aGF0IHdhcyBkZWZpbmVkIGFzIGFuIGluamVjdGlvbiB0b2tlbiBmb3IgdGhlIHZpZXcgZW5naW5lXG4gKiBidXQgaXMgbm93IGRlZmluZWQgYXMgYSBnbG9iYWwgdmFsdWUuXG4gKlxuICogQHBhcmFtIGxvY2FsZUlkXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzZXRMb2NhbGVJZChsb2NhbGVJZDogc3RyaW5nKSB7XG4gIGFzc2VydERlZmluZWQobG9jYWxlSWQsIGBFeHBlY3RlZCBsb2NhbGVJZCB0byBiZSBkZWZpbmVkYCk7XG4gIGlmICh0eXBlb2YgbG9jYWxlSWQgPT09ICdzdHJpbmcnKSB7XG4gICAgTE9DQUxFX0lEID0gbG9jYWxlSWQudG9Mb3dlckNhc2UoKS5yZXBsYWNlKC9fL2csICctJyk7XG4gIH1cbn1cblxuLyoqXG4gKiBHZXRzIHRoZSBsb2NhbGUgaWQgdGhhdCB3aWxsIGJlIHVzZWQgZm9yIHRyYW5zbGF0aW9ucyBhbmQgSUNVIGV4cHJlc3Npb25zLlxuICogVGhpcyBpcyB0aGUgaXZ5IHZlcnNpb24gb2YgYExPQ0FMRV9JRGAgdGhhdCB3YXMgZGVmaW5lZCBhcyBhbiBpbmplY3Rpb24gdG9rZW4gZm9yIHRoZSB2aWV3IGVuZ2luZVxuICogYnV0IGlzIG5vdyBkZWZpbmVkIGFzIGEgZ2xvYmFsIHZhbHVlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0TG9jYWxlSWQoKTogc3RyaW5nIHtcbiAgcmV0dXJuIExPQ0FMRV9JRDtcbn1cbiJdfQ==