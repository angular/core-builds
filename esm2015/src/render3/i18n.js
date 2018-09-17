/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { assertEqual, assertLessThan } from './assert';
import { NO_CHANGE, _getViewData, adjustBlueprintForNewNode, bindingUpdated, bindingUpdated2, bindingUpdated3, bindingUpdated4, createLNode, getPreviousOrParentNode, getRenderer, load, resetComponentState } from './instructions';
import { RENDER_PARENT } from './interfaces/container';
import { BINDING_INDEX, HEADER_OFFSET, TVIEW } from './interfaces/view';
import { appendChild, createTextNode, getParentLNode, removeChild } from './node_manipulation';
import { stringify } from './util';
/** @enum {number} */
var I18nInstructions = {
    Text: 536870912,
    Element: 1073741824,
    Expression: 1610612736,
    TemplateRoot: -2147483648,
    Any: -1610612736,
    CloseNode: -1073741824,
    RemoveNode: -536870912,
    /** Used to decode the number encoded with the instruction. */
    IndexMask: 536870911,
    /** Used to test the type of instruction. */
    InstructionMask: -536870912,
};
export { I18nInstructions };
/** @typedef {?} */
var I18nInstruction;
export { I18nInstruction };
/** @typedef {?} */
var I18nExpInstruction;
export { I18nExpInstruction };
/** @typedef {?} */
var PlaceholderMap;
export { PlaceholderMap };
/** @type {?} */
const i18nTagRegex = /{\$([^}]+)}/g;
/**
 * Takes a translation string, the initial list of placeholders (elements and expressions) and the
 * indexes of their corresponding expression nodes to return a list of instructions for each
 * template function.
 *
 * Because embedded templates have different indexes for each placeholder, each parameter (except
 * the translation) is an array, where each value corresponds to a different template, by order of
 * appearance.
 *
 * @param {?} translation A translation string where placeholders are represented by `{$name}`
 * @param {?} elements An array containing, for each template, the maps of element placeholders and
 * their indexes.
 * @param {?=} expressions An array containing, for each template, the maps of expression placeholders
 * and their indexes.
 * @param {?=} templateRoots An array of template roots whose content should be ignored when
 * generating the instructions for their parent template.
 * @param {?=} lastChildIndex The index of the last child of the i18n node. Used when the i18n block is
 * an ng-container.
 *
 * @return {?} A list of instructions used to translate each template.
 */
export function i18nMapping(translation, elements, expressions, templateRoots, lastChildIndex) {
    /** @type {?} */
    const translationParts = translation.split(i18nTagRegex);
    /** @type {?} */
    const nbTemplates = templateRoots ? templateRoots.length + 1 : 1;
    /** @type {?} */
    const instructions = (new Array(nbTemplates)).fill(undefined);
    generateMappingInstructions(0, 0, translationParts, instructions, elements, expressions, templateRoots, lastChildIndex);
    return instructions;
}
/**
 * Internal function that reads the translation parts and generates a set of instructions for each
 * template.
 *
 * See `i18nMapping()` for more details.
 *
 * @param {?} tmplIndex The order of appearance of the template.
 * 0 for the root template, following indexes match the order in `templateRoots`.
 * @param {?} partIndex The current index in `translationParts`.
 * @param {?} translationParts The translation string split into an array of placeholders and text
 * elements.
 * @param {?} instructions The current list of instructions to update.
 * @param {?} elements An array containing, for each template, the maps of element placeholders and
 * their indexes.
 * @param {?=} expressions An array containing, for each template, the maps of expression placeholders
 * and their indexes.
 * @param {?=} templateRoots An array of template roots whose content should be ignored when
 * generating the instructions for their parent template.
 * @param {?=} lastChildIndex The index of the last child of the i18n node. Used when the i18n block is
 * an ng-container.
 *
 * @return {?} the current index in `translationParts`
 */
function generateMappingInstructions(tmplIndex, partIndex, translationParts, instructions, elements, expressions, templateRoots, lastChildIndex) {
    /** @type {?} */
    const tmplInstructions = [];
    /** @type {?} */
    const phVisited = [];
    /** @type {?} */
    let openedTagCount = 0;
    /** @type {?} */
    let maxIndex = 0;
    /** @type {?} */
    let currentElements = elements && elements[tmplIndex] ? elements[tmplIndex] : null;
    /** @type {?} */
    let currentExpressions = expressions && expressions[tmplIndex] ? expressions[tmplIndex] : null;
    instructions[tmplIndex] = tmplInstructions;
    for (; partIndex < translationParts.length; partIndex++) {
        /** @type {?} */
        const value = translationParts[partIndex];
        // Odd indexes are placeholders
        if (partIndex & 1) {
            /** @type {?} */
            let phIndex;
            if (currentElements && currentElements[value] !== undefined) {
                phIndex = currentElements[value];
                /** @type {?} */
                let templateRootIndex = templateRoots ? templateRoots.indexOf(value) : -1;
                if (templateRootIndex !== -1 && (templateRootIndex + 1) !== tmplIndex) {
                    // This is a template root, it has no closing tag, not treating it as an element
                    tmplInstructions.push(phIndex | -2147483648 /* TemplateRoot */);
                }
                else {
                    tmplInstructions.push(phIndex | 1073741824 /* Element */);
                    openedTagCount++;
                }
                phVisited.push(value);
            }
            else if (currentExpressions && currentExpressions[value] !== undefined) {
                phIndex = currentExpressions[value];
                // The placeholder represents an expression, add an instruction to move it
                tmplInstructions.push(phIndex | 1610612736 /* Expression */);
                phVisited.push(value);
            }
            else {
                // It is a closing tag
                tmplInstructions.push(-1073741824 /* CloseNode */);
                if (tmplIndex > 0) {
                    openedTagCount--;
                    // If we have reached the closing tag for this template, exit the loop
                    if (openedTagCount === 0) {
                        break;
                    }
                }
            }
            if (phIndex !== undefined && phIndex > maxIndex) {
                maxIndex = phIndex;
            }
            if (templateRoots) {
                /** @type {?} */
                const newTmplIndex = templateRoots.indexOf(value) + 1;
                if (newTmplIndex !== 0 && newTmplIndex !== tmplIndex) {
                    partIndex = generateMappingInstructions(newTmplIndex, partIndex, translationParts, instructions, elements, expressions, templateRoots, lastChildIndex);
                }
            }
        }
        else if (value) {
            // It's a non-empty string, create a text node
            tmplInstructions.push(536870912 /* Text */, value);
        }
    }
    // Add instructions to remove elements that are not used in the translation
    if (elements) {
        /** @type {?} */
        const tmplElements = elements[tmplIndex];
        if (tmplElements) {
            /** @type {?} */
            const phKeys = Object.keys(tmplElements);
            for (let i = 0; i < phKeys.length; i++) {
                /** @type {?} */
                const ph = phKeys[i];
                if (phVisited.indexOf(ph) === -1) {
                    /** @type {?} */
                    let index = tmplElements[ph];
                    // Add an instruction to remove the element
                    tmplInstructions.push(index | -536870912 /* RemoveNode */);
                    if (index > maxIndex) {
                        maxIndex = index;
                    }
                }
            }
        }
    }
    // Add instructions to remove expressions that are not used in the translation
    if (expressions) {
        /** @type {?} */
        const tmplExpressions = expressions[tmplIndex];
        if (tmplExpressions) {
            /** @type {?} */
            const phKeys = Object.keys(tmplExpressions);
            for (let i = 0; i < phKeys.length; i++) {
                /** @type {?} */
                const ph = phKeys[i];
                if (phVisited.indexOf(ph) === -1) {
                    /** @type {?} */
                    let index = tmplExpressions[ph];
                    if (ngDevMode) {
                        assertLessThan(index.toString(2).length, 28, `Index ${index} is too big and will overflow`);
                    }
                    // Add an instruction to remove the expression
                    tmplInstructions.push(index | -536870912 /* RemoveNode */);
                    if (index > maxIndex) {
                        maxIndex = index;
                    }
                }
            }
        }
    }
    if (tmplIndex === 0 && typeof lastChildIndex === 'number') {
        // The current parent is an ng-container and it has more children after the translation that we
        // need to append to keep the order of the DOM nodes correct
        for (let i = maxIndex + 1; i <= lastChildIndex; i++) {
            if (ngDevMode) {
                assertLessThan(i.toString(2).length, 28, `Index ${i} is too big and will overflow`);
            }
            tmplInstructions.push(i | -1610612736 /* Any */);
        }
    }
    return partIndex;
}
/**
 * @param {?} node
 * @param {?} parentNode
 * @param {?} previousNode
 * @return {?}
 */
function appendI18nNode(node, parentNode, previousNode) {
    if (ngDevMode) {
        ngDevMode.rendererMoveNode++;
    }
    /** @type {?} */
    const viewData = _getViewData();
    appendChild(parentNode, node.native || null, viewData);
    /** @type {?} */
    const firstTemplatePass = node.view[TVIEW].firstTemplatePass;
    if (firstTemplatePass) {
        if (previousNode === parentNode && node.tNode !== parentNode.tNode.child) {
            node.tNode.next = parentNode.tNode.child;
            parentNode.tNode.child = node.tNode;
        }
        else if (previousNode !== parentNode && node.tNode !== previousNode.tNode.next) {
            node.tNode.next = previousNode.tNode.next;
            previousNode.tNode.next = node.tNode;
        }
        else {
            node.tNode.next = null;
        }
        if (parentNode.view === node.view)
            node.tNode.parent = /** @type {?} */ (parentNode.tNode);
    }
    // Template containers also have a comment node for the `ViewContainerRef` that should be moved
    if (node.tNode.type === 0 /* Container */ && node.dynamicLContainerNode) {
        appendChild(parentNode, node.dynamicLContainerNode.native || null, viewData);
        if (firstTemplatePass) {
            node.tNode.dynamicContainerNode = node.dynamicLContainerNode.tNode;
            node.dynamicLContainerNode.tNode.parent = /** @type {?} */ (node.tNode);
        }
        return node.dynamicLContainerNode;
    }
    return node;
}
/**
 * Takes a list of instructions generated by `i18nMapping()` to transform the template accordingly.
 *
 * @param {?} startIndex Index of the first element to translate (for instance the first child of the
 * element with the i18n attribute).
 * @param {?} instructions The list of instructions to apply on the current view.
 * @return {?}
 */
export function i18nApply(startIndex, instructions) {
    /** @type {?} */
    const viewData = _getViewData();
    if (ngDevMode) {
        assertEqual(viewData[BINDING_INDEX], viewData[TVIEW].bindingStartIndex, 'i18nApply should be called before any binding');
    }
    if (!instructions) {
        return;
    }
    /** @type {?} */
    const renderer = getRenderer();
    /** @type {?} */
    let localParentNode = getParentLNode(load(startIndex)) || getPreviousOrParentNode();
    /** @type {?} */
    let localPreviousNode = localParentNode;
    resetComponentState(); // We don't want to add to the tree with the wrong previous node
    for (let i = 0; i < instructions.length; i++) {
        /** @type {?} */
        const instruction = /** @type {?} */ (instructions[i]);
        switch (instruction & -536870912 /* InstructionMask */) {
            case 1073741824 /* Element */:
                /** @type {?} */
                const element = load(instruction & 536870911 /* IndexMask */);
                localPreviousNode = appendI18nNode(element, localParentNode, localPreviousNode);
                localParentNode = element;
                break;
            case 1610612736 /* Expression */:
            case -2147483648 /* TemplateRoot */:
            case -1610612736 /* Any */:
                /** @type {?} */
                const node = load(instruction & 536870911 /* IndexMask */);
                localPreviousNode = appendI18nNode(node, localParentNode, localPreviousNode);
                break;
            case 536870912 /* Text */:
                if (ngDevMode) {
                    ngDevMode.rendererCreateTextNode++;
                }
                /** @type {?} */
                const value = instructions[++i];
                /** @type {?} */
                const textRNode = createTextNode(value, renderer);
                // If we were to only create a `RNode` then projections won't move the text.
                // Create text node at the current end of viewData. Must subtract header offset because
                // createLNode takes a raw index (not adjusted by header offset).
                adjustBlueprintForNewNode(viewData);
                /** @type {?} */
                const lastNodeIndex = viewData.length - 1;
                /** @type {?} */
                const textLNode = createLNode(lastNodeIndex - HEADER_OFFSET, 3 /* Element */, textRNode, null, null);
                localPreviousNode = appendI18nNode(textLNode, localParentNode, localPreviousNode);
                resetComponentState();
                break;
            case -1073741824 /* CloseNode */:
                localPreviousNode = localParentNode;
                localParentNode = /** @type {?} */ ((getParentLNode(localParentNode)));
                break;
            case -536870912 /* RemoveNode */:
                if (ngDevMode) {
                    ngDevMode.rendererRemoveNode++;
                }
                /** @type {?} */
                const index = instruction & 536870911 /* IndexMask */;
                /** @type {?} */
                const removedNode = load(index);
                /** @type {?} */
                const parentNode = /** @type {?} */ ((getParentLNode(removedNode)));
                removeChild(parentNode, removedNode.native || null, viewData);
                // For template containers we also need to remove their `ViewContainerRef` from the DOM
                if (removedNode.tNode.type === 0 /* Container */ && removedNode.dynamicLContainerNode) {
                    removeChild(parentNode, removedNode.dynamicLContainerNode.native || null, viewData);
                    removedNode.dynamicLContainerNode.tNode.detached = true;
                    removedNode.dynamicLContainerNode.data[RENDER_PARENT] = null;
                }
                break;
        }
    }
}
/**
 * Takes a translation string and the initial list of expressions and returns a list of instructions
 * that will be used to translate an attribute.
 * Even indexes contain static strings, while odd indexes contain the index of the expression whose
 * value will be concatenated into the final translation.
 * @param {?} translation
 * @param {?} placeholders
 * @return {?}
 */
export function i18nExpMapping(translation, placeholders) {
    /** @type {?} */
    const staticText = translation.split(i18nTagRegex);
    // odd indexes are placeholders
    for (let i = 1; i < staticText.length; i += 2) {
        staticText[i] = placeholders[staticText[i]];
    }
    return staticText;
}
/**
 * Checks if the value of an expression has changed and replaces it by its value in a translation,
 * or returns NO_CHANGE.
 *
 * @param {?} instructions A list of instructions that will be used to translate an attribute.
 * @param {?} v0 value checked for change.
 *
 * @return {?} The concatenated string when any of the arguments changes, `NO_CHANGE` otherwise.
 */
export function i18nInterpolation1(instructions, v0) {
    /** @type {?} */
    const different = bindingUpdated(_getViewData()[BINDING_INDEX]++, v0);
    if (!different) {
        return NO_CHANGE;
    }
    /** @type {?} */
    let res = '';
    for (let i = 0; i < instructions.length; i++) {
        // Odd indexes are bindings
        if (i & 1) {
            res += stringify(v0);
        }
        else {
            res += instructions[i];
        }
    }
    return res;
}
/**
 * Checks if the values of up to 2 expressions have changed and replaces them by their values in a
 * translation, or returns NO_CHANGE.
 *
 * @param {?} instructions A list of instructions that will be used to translate an attribute.
 * @param {?} v0 value checked for change.
 * @param {?} v1 value checked for change.
 *
 * @return {?} The concatenated string when any of the arguments changes, `NO_CHANGE` otherwise.
 */
export function i18nInterpolation2(instructions, v0, v1) {
    /** @type {?} */
    const viewData = _getViewData();
    /** @type {?} */
    const different = bindingUpdated2(viewData[BINDING_INDEX], v0, v1);
    viewData[BINDING_INDEX] += 2;
    if (!different) {
        return NO_CHANGE;
    }
    /** @type {?} */
    let res = '';
    for (let i = 0; i < instructions.length; i++) {
        // Odd indexes are bindings
        if (i & 1) {
            /** @type {?} */
            const idx = /** @type {?} */ (instructions[i]);
            /** @type {?} */
            const b1 = idx & 1;
            /** @type {?} */
            const value = b1 ? v1 : v0;
            res += stringify(value);
        }
        else {
            res += instructions[i];
        }
    }
    return res;
}
/**
 * Checks if the values of up to 3 expressions have changed and replaces them by their values in a
 * translation, or returns NO_CHANGE.
 *
 * @param {?} instructions A list of instructions that will be used to translate an attribute.
 * @param {?} v0 value checked for change.
 * @param {?} v1 value checked for change.
 * @param {?} v2 value checked for change.
 *
 * @return {?} The concatenated string when any of the arguments changes, `NO_CHANGE` otherwise.
 */
export function i18nInterpolation3(instructions, v0, v1, v2) {
    /** @type {?} */
    const viewData = _getViewData();
    /** @type {?} */
    const different = bindingUpdated3(viewData[BINDING_INDEX], v0, v1, v2);
    viewData[BINDING_INDEX] += 3;
    if (!different) {
        return NO_CHANGE;
    }
    /** @type {?} */
    let res = '';
    for (let i = 0; i < instructions.length; i++) {
        // Odd indexes are bindings
        if (i & 1) {
            /** @type {?} */
            const idx = /** @type {?} */ (instructions[i]);
            /** @type {?} */
            const b2 = idx & 2;
            /** @type {?} */
            const b1 = idx & 1;
            /** @type {?} */
            const value = b2 ? v2 : (b1 ? v1 : v0);
            res += stringify(value);
        }
        else {
            res += instructions[i];
        }
    }
    return res;
}
/**
 * Checks if the values of up to 4 expressions have changed and replaces them by their values in a
 * translation, or returns NO_CHANGE.
 *
 * @param {?} instructions A list of instructions that will be used to translate an attribute.
 * @param {?} v0 value checked for change.
 * @param {?} v1 value checked for change.
 * @param {?} v2 value checked for change.
 * @param {?} v3 value checked for change.
 *
 * @return {?} The concatenated string when any of the arguments changes, `NO_CHANGE` otherwise.
 */
export function i18nInterpolation4(instructions, v0, v1, v2, v3) {
    /** @type {?} */
    const viewData = _getViewData();
    /** @type {?} */
    const different = bindingUpdated4(viewData[BINDING_INDEX], v0, v1, v2, v3);
    viewData[BINDING_INDEX] += 4;
    if (!different) {
        return NO_CHANGE;
    }
    /** @type {?} */
    let res = '';
    for (let i = 0; i < instructions.length; i++) {
        // Odd indexes are bindings
        if (i & 1) {
            /** @type {?} */
            const idx = /** @type {?} */ (instructions[i]);
            /** @type {?} */
            const b2 = idx & 2;
            /** @type {?} */
            const b1 = idx & 1;
            /** @type {?} */
            const value = b2 ? (b1 ? v3 : v2) : (b1 ? v1 : v0);
            res += stringify(value);
        }
        else {
            res += instructions[i];
        }
    }
    return res;
}
/**
 * Checks if the values of up to 5 expressions have changed and replaces them by their values in a
 * translation, or returns NO_CHANGE.
 *
 * @param {?} instructions A list of instructions that will be used to translate an attribute.
 * @param {?} v0 value checked for change.
 * @param {?} v1 value checked for change.
 * @param {?} v2 value checked for change.
 * @param {?} v3 value checked for change.
 * @param {?} v4 value checked for change.
 *
 * @return {?} The concatenated string when any of the arguments changes, `NO_CHANGE` otherwise.
 */
export function i18nInterpolation5(instructions, v0, v1, v2, v3, v4) {
    /** @type {?} */
    const viewData = _getViewData();
    /** @type {?} */
    let different = bindingUpdated4(viewData[BINDING_INDEX], v0, v1, v2, v3);
    different = bindingUpdated(viewData[BINDING_INDEX] + 4, v4) || different;
    viewData[BINDING_INDEX] += 5;
    if (!different) {
        return NO_CHANGE;
    }
    /** @type {?} */
    let res = '';
    for (let i = 0; i < instructions.length; i++) {
        // Odd indexes are bindings
        if (i & 1) {
            /** @type {?} */
            const idx = /** @type {?} */ (instructions[i]);
            /** @type {?} */
            const b4 = idx & 4;
            /** @type {?} */
            const b2 = idx & 2;
            /** @type {?} */
            const b1 = idx & 1;
            /** @type {?} */
            const value = b4 ? v4 : (b2 ? (b1 ? v3 : v2) : (b1 ? v1 : v0));
            res += stringify(value);
        }
        else {
            res += instructions[i];
        }
    }
    return res;
}
/**
 * Checks if the values of up to 6 expressions have changed and replaces them by their values in a
 * translation, or returns NO_CHANGE.
 *
 * @param {?} instructions A list of instructions that will be used to translate an attribute.
 * @param {?} v0 value checked for change.
 * @param {?} v1 value checked for change.
 * @param {?} v2 value checked for change.
 * @param {?} v3 value checked for change.
 * @param {?} v4 value checked for change.
 * @param {?} v5 value checked for change.
 *
 * @return {?} The concatenated string when any of the arguments changes, `NO_CHANGE` otherwise.
 */
export function i18nInterpolation6(instructions, v0, v1, v2, v3, v4, v5) {
    /** @type {?} */
    const viewData = _getViewData();
    /** @type {?} */
    let different = bindingUpdated4(viewData[BINDING_INDEX], v0, v1, v2, v3);
    different = bindingUpdated2(viewData[BINDING_INDEX] + 4, v4, v5) || different;
    viewData[BINDING_INDEX] += 6;
    if (!different) {
        return NO_CHANGE;
    }
    /** @type {?} */
    let res = '';
    for (let i = 0; i < instructions.length; i++) {
        // Odd indexes are bindings
        if (i & 1) {
            /** @type {?} */
            const idx = /** @type {?} */ (instructions[i]);
            /** @type {?} */
            const b4 = idx & 4;
            /** @type {?} */
            const b2 = idx & 2;
            /** @type {?} */
            const b1 = idx & 1;
            /** @type {?} */
            const value = b4 ? (b1 ? v5 : v4) : (b2 ? (b1 ? v3 : v2) : (b1 ? v1 : v0));
            res += stringify(value);
        }
        else {
            res += instructions[i];
        }
    }
    return res;
}
/**
 * Checks if the values of up to 7 expressions have changed and replaces them by their values in a
 * translation, or returns NO_CHANGE.
 *
 * @param {?} instructions A list of instructions that will be used to translate an attribute.
 * @param {?} v0 value checked for change.
 * @param {?} v1 value checked for change.
 * @param {?} v2 value checked for change.
 * @param {?} v3 value checked for change.
 * @param {?} v4 value checked for change.
 * @param {?} v5 value checked for change.
 * @param {?} v6 value checked for change.
 *
 * @return {?} The concatenated string when any of the arguments changes, `NO_CHANGE` otherwise.
 */
export function i18nInterpolation7(instructions, v0, v1, v2, v3, v4, v5, v6) {
    /** @type {?} */
    const viewData = _getViewData();
    /** @type {?} */
    let different = bindingUpdated4(viewData[BINDING_INDEX], v0, v1, v2, v3);
    different = bindingUpdated3(viewData[BINDING_INDEX] + 4, v4, v5, v6) || different;
    viewData[BINDING_INDEX] += 7;
    if (!different) {
        return NO_CHANGE;
    }
    /** @type {?} */
    let res = '';
    for (let i = 0; i < instructions.length; i++) {
        // Odd indexes are bindings
        if (i & 1) {
            /** @type {?} */
            const idx = /** @type {?} */ (instructions[i]);
            /** @type {?} */
            const b4 = idx & 4;
            /** @type {?} */
            const b2 = idx & 2;
            /** @type {?} */
            const b1 = idx & 1;
            /** @type {?} */
            const value = b4 ? (b2 ? v6 : (b1 ? v5 : v4)) : (b2 ? (b1 ? v3 : v2) : (b1 ? v1 : v0));
            res += stringify(value);
        }
        else {
            res += instructions[i];
        }
    }
    return res;
}
/**
 * Checks if the values of up to 8 expressions have changed and replaces them by their values in a
 * translation, or returns NO_CHANGE.
 *
 * @param {?} instructions A list of instructions that will be used to translate an attribute.
 * @param {?} v0 value checked for change.
 * @param {?} v1 value checked for change.
 * @param {?} v2 value checked for change.
 * @param {?} v3 value checked for change.
 * @param {?} v4 value checked for change.
 * @param {?} v5 value checked for change.
 * @param {?} v6 value checked for change.
 * @param {?} v7 value checked for change.
 *
 * @return {?} The concatenated string when any of the arguments changes, `NO_CHANGE` otherwise.
 */
export function i18nInterpolation8(instructions, v0, v1, v2, v3, v4, v5, v6, v7) {
    /** @type {?} */
    const viewData = _getViewData();
    /** @type {?} */
    let different = bindingUpdated4(viewData[BINDING_INDEX], v0, v1, v2, v3);
    different = bindingUpdated4(viewData[BINDING_INDEX] + 4, v4, v5, v6, v7) || different;
    viewData[BINDING_INDEX] += 8;
    if (!different) {
        return NO_CHANGE;
    }
    /** @type {?} */
    let res = '';
    for (let i = 0; i < instructions.length; i++) {
        // Odd indexes are bindings
        if (i & 1) {
            /** @type {?} */
            const idx = /** @type {?} */ (instructions[i]);
            /** @type {?} */
            const b4 = idx & 4;
            /** @type {?} */
            const b2 = idx & 2;
            /** @type {?} */
            const b1 = idx & 1;
            /** @type {?} */
            const value = b4 ? (b2 ? (b1 ? v7 : v6) : (b1 ? v5 : v4)) : (b2 ? (b1 ? v3 : v2) : (b1 ? v1 : v0));
            res += stringify(value);
        }
        else {
            res += instructions[i];
        }
    }
    return res;
}
/**
 * Create a translated interpolation binding with a variable number of expressions.
 *
 * If there are 1 to 8 expressions then `i18nInterpolation()` should be used instead. It is faster
 * because there is no need to create an array of expressions and iterate over it.
 *
 * @param {?} instructions
 * @param {?} values
 * @return {?} The concatenated string when any of the arguments changes, `NO_CHANGE` otherwise.
 */
export function i18nInterpolationV(instructions, values) {
    /** @type {?} */
    const viewData = _getViewData();
    /** @type {?} */
    let different = false;
    for (let i = 0; i < values.length; i++) {
        // Check if bindings have changed
        bindingUpdated(viewData[BINDING_INDEX]++, values[i]) && (different = true);
    }
    if (!different) {
        return NO_CHANGE;
    }
    /** @type {?} */
    let res = '';
    for (let i = 0; i < instructions.length; i++) {
        // Odd indexes are placeholders
        if (i & 1) {
            res += stringify(values[/** @type {?} */ (instructions[i])]);
        }
        else {
            res += instructions[i];
        }
    }
    return res;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaTE4bi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaTE4bi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQVFBLE9BQU8sRUFBQyxXQUFXLEVBQUUsY0FBYyxFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQ3JELE9BQU8sRUFBQyxTQUFTLEVBQUUsWUFBWSxFQUFFLHlCQUF5QixFQUFFLGNBQWMsRUFBRSxlQUFlLEVBQUUsZUFBZSxFQUFFLGVBQWUsRUFBRSxXQUFXLEVBQUUsdUJBQXVCLEVBQUUsV0FBVyxFQUFFLElBQUksRUFBRSxtQkFBbUIsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBQ25PLE9BQU8sRUFBQyxhQUFhLEVBQUMsTUFBTSx3QkFBd0IsQ0FBQztBQUVyRCxPQUFPLEVBQUMsYUFBYSxFQUFFLGFBQWEsRUFBRSxLQUFLLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUN0RSxPQUFPLEVBQUMsV0FBVyxFQUFFLGNBQWMsRUFBRSxjQUFjLEVBQUUsV0FBVyxFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDN0YsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLFFBQVEsQ0FBQzs7O0lBTy9CLGVBQWM7SUFDZCxtQkFBaUI7SUFDakIsc0JBQW9CO0lBQ3BCLHlCQUFzQjtJQUN0QixnQkFBYTtJQUNiLHNCQUFtQjtJQUNuQixzQkFBb0I7O0lBRXBCLG9CQUF5Qjs7SUFFekIsMkJBQWtDOzs7Ozs7Ozs7Ozs7O0FBbUJwQyxNQUFNLFlBQVksR0FBRyxjQUFjLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUF1QnBDLE1BQU0sVUFBVSxXQUFXLENBQ3ZCLFdBQW1CLEVBQUUsUUFBMEMsRUFDL0QsV0FBOEMsRUFBRSxhQUErQixFQUMvRSxjQUE4Qjs7SUFDaEMsTUFBTSxnQkFBZ0IsR0FBRyxXQUFXLENBQUMsS0FBSyxDQUFDLFlBQVksQ0FBQyxDQUFDOztJ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LEVBQUUsRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsQ0FBQztLQUM1RTtJQUVELElBQUksQ0FBQyxTQUFTLEVBQUU7UUFDZCxPQUFPLFNBQVMsQ0FBQztLQUNsQjs7SUFFRCxJQUFJLEdBQUcsR0FBRyxFQUFFLENBQUM7SUFDYixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsWUFBWSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTs7UUFFNUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFO1lBQ1QsR0FBRyxJQUFJLFNBQVMsQ0FBQyxNQUFNLG1CQUFDLFlBQVksQ0FBQyxDQUFDLENBQVcsRUFBQyxDQUFDLENBQUM7U0FDckQ7YUFBTTtZQUNMLEdBQUcsSUFBSSxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUM7U0FDeEI7S0FDRjtJQUVELE9BQU8sR0FBRyxDQUFDO0NBQ1oiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7YXNzZXJ0RXF1YWwsIGFzc2VydExlc3NUaGFufSBmcm9tICcuL2Fzc2VydCc7XG5pbXBvcnQge05PX0NIQU5HRSwgX2dldFZpZXdEYXRhLCBhZGp1c3RCbHVlcHJpbnRGb3JOZXdOb2RlLCBiaW5kaW5nVXBkYXRlZCwgYmluZGluZ1VwZGF0ZWQyLCBiaW5kaW5nVXBkYXRlZDMsIGJpbmRpbmdVcGRhdGVkNCwgY3JlYXRlTE5vZGUsIGdldFByZXZpb3VzT3JQYXJlbnROb2RlLCBnZXRSZW5kZXJlciwgbG9hZCwgcmVzZXRDb21wb25lbnRTdGF0ZX0gZnJvbSAnLi9pbnN0cnVjdGlvbnMnO1xuaW1wb3J0IHtSRU5ERVJfUEFSRU5UfSBmcm9tICcuL2ludGVyZmFjZXMvY29udGFpbmVyJztcbmltcG9ydCB7TENvbnRhaW5lck5vZGUsIExOb2RlLCBUQ29udGFpbmVyTm9kZSwgVEVsZW1lbnROb2RlLCBUTm9kZVR5cGV9IGZyb20gJy4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7QklORElOR19JTkRFWCwgSEVBREVSX09GRlNFVCwgVFZJRVd9IGZyb20gJy4vaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7YXBwZW5kQ2hpbGQsIGNyZWF0ZVRleHROb2RlLCBnZXRQYXJlbnRMTm9kZSwgcmVtb3ZlQ2hpbGR9IGZyb20gJy4vbm9kZV9tYW5pcHVsYXRpb24nO1xuaW1wb3J0IHtzdHJpbmdpZnl9IGZyb20gJy4vdXRpbCc7XG5cbi8qKlxuICogQSBsaXN0IG9mIGZsYWdzIHRvIGVuY29kZSB0aGUgaTE4biBpbnN0cnVjdGlvbnMgdXNlZCB0byB0cmFuc2xhdGUgdGhlIHRlbXBsYXRlLlxuICogV2Ugc2hpZnQgdGhlIGZsYWdzIGJ5IDI5IHNvIHRoYXQgMzAgJiAzMSAmIDMyIGJpdHMgY29udGFpbnMgdGhlIGluc3RydWN0aW9ucy5cbiAqL1xuZXhwb3J0IGNvbnN0IGVudW0gSTE4bkluc3RydWN0aW9ucyB7XG4gIFRleHQgPSAxIDw8IDI5LFxuICBFbGVtZW50ID0gMiA8PCAyOSxcbiAgRXhwcmVzc2lvbiA9IDMgPDwgMjksXG4gIFRlbXBsYXRlUm9vdCA9IDQgPDwgMjksXG4gIEFueSA9IDUgPDwgMjksXG4gIENsb3NlTm9kZSA9IDYgPDwgMjksXG4gIFJlbW92ZU5vZGUgPSA3IDw8IDI5LFxuICAvKiogVXNlZCB0byBkZWNvZGUgdGhlIG51bWJlciBlbmNvZGVkIHdpdGggdGhlIGluc3RydWN0aW9uLiAqL1xuICBJbmRleE1hc2sgPSAoMSA8PCAyOSkgLSAxLFxuICAvKiogVXNlZCB0byB0ZXN0IHRoZSB0eXBlIG9mIGluc3RydWN0aW9uLiAqL1xuICBJbnN0cnVjdGlvbk1hc2sgPSB+KCgxIDw8IDI5KSAtIDEpLFxufVxuXG4vKipcbiAqIFJlcHJlc2VudHMgdGhlIGluc3RydWN0aW9ucyB1c2VkIHRvIHRyYW5zbGF0ZSB0aGUgdGVtcGxhdGUuXG4gKiBJbnN0cnVjdGlvbnMgY2FuIGJlIGEgcGxhY2Vob2xkZXIgaW5kZXgsIGEgc3RhdGljIHRleHQgb3IgYSBzaW1wbGUgYml0IGZpZWxkIChgSTE4bkZsYWdgKS5cbiAqIFdoZW4gdGhlIGluc3RydWN0aW9uIGlzIHRoZSBmbGFnIGBUZXh0YCwgaXQgaXMgYWx3YXlzIGZvbGxvd2VkIGJ5IGl0cyB0ZXh0IHZhbHVlLlxuICovXG5leHBvcnQgdHlwZSBJMThuSW5zdHJ1Y3Rpb24gPSBudW1iZXIgfCBzdHJpbmc7XG4vKipcbiAqIFJlcHJlc2VudHMgdGhlIGluc3RydWN0aW9ucyB1c2VkIHRvIHRyYW5zbGF0ZSBhdHRyaWJ1dGVzIGNvbnRhaW5pbmcgZXhwcmVzc2lvbnMuXG4gKiBFdmVuIGluZGV4ZXMgY29udGFpbiBzdGF0aWMgc3RyaW5ncywgd2hpbGUgb2RkIGluZGV4ZXMgY29udGFpbiB0aGUgaW5kZXggb2YgdGhlIGV4cHJlc3Npb24gd2hvc2VcbiAqIHZhbHVlIHdpbGwgYmUgY29uY2F0ZW5hdGVkIGludG8gdGhlIGZpbmFsIHRyYW5zbGF0aW9uLlxuICovXG5leHBvcnQgdHlwZSBJMThuRXhwSW5zdHJ1Y3Rpb24gPSBudW1iZXIgfCBzdHJpbmc7XG4vKiogTWFwcGluZyBvZiBwbGFjZWhvbGRlciBuYW1lcyB0byB0aGVpciBhYnNvbHV0ZSBpbmRleGVzIGluIHRoZWlyIHRlbXBsYXRlcy4gKi9cbmV4cG9ydCB0eXBlIFBsYWNlaG9sZGVyTWFwID0ge1xuICBbbmFtZTogc3RyaW5nXTogbnVtYmVyXG59O1xuY29uc3QgaTE4blRhZ1JlZ2V4ID0gL3tcXCQoW159XSspfS9nO1xuXG4vKipcbiAqIFRha2VzIGEgdHJhbnNsYXRpb24gc3RyaW5nLCB0aGUgaW5pdGlhbCBsaXN0IG9mIHBsYWNlaG9sZGVycyAoZWxlbWVudHMgYW5kIGV4cHJlc3Npb25zKSBhbmQgdGhlXG4gKiBpbmRleGVzIG9mIHRoZWlyIGNvcnJlc3BvbmRpbmcgZXhwcmVzc2lvbiBub2RlcyB0byByZXR1cm4gYSBsaXN0IG9mIGluc3RydWN0aW9ucyBmb3IgZWFjaFxuICogdGVtcGxhdGUgZnVuY3Rpb24uXG4gKlxuICogQmVjYXVzZSBlbWJlZGRlZCB0ZW1wbGF0ZXMgaGF2ZSBkaWZmZXJlbnQgaW5kZXhlcyBmb3IgZWFjaCBwbGFjZWhvbGRlciwgZWFjaCBwYXJhbWV0ZXIgKGV4Y2VwdFxuICogdGhlIHRyYW5zbGF0aW9uKSBpcyBhbiBhcnJheSwgd2hlcmUgZWFjaCB2YWx1ZSBjb3JyZXNwb25kcyB0byBhIGRpZmZlcmVudCB0ZW1wbGF0ZSwgYnkgb3JkZXIgb2ZcbiAqIGFwcGVhcmFuY2UuXG4gKlxuICogQHBhcmFtIHRyYW5zbGF0aW9uIEEgdHJhbnNsYXRpb24gc3RyaW5nIHdoZXJlIHBsYWNlaG9sZGVycyBhcmUgcmVwcmVzZW50ZWQgYnkgYHskbmFtZX1gXG4gKiBAcGFyYW0gZWxlbWVudHMgQW4gYXJyYXkgY29udGFpbmluZywgZm9yIGVhY2ggdGVtcGxhdGUsIHRoZSBtYXBzIG9mIGVsZW1lbnQgcGxhY2Vob2xkZXJzIGFuZFxuICogdGhlaXIgaW5kZXhlcy5cbiAqIEBwYXJhbSBleHByZXNzaW9ucyBBbiBhcnJheSBjb250YWluaW5nLCBmb3IgZWFjaCB0ZW1wbGF0ZSwgdGhlIG1hcHMgb2YgZXhwcmVzc2lvbiBwbGFjZWhvbGRlcnNcbiAqIGFuZCB0aGVpciBpbmRleGVzLlxuICogQHBhcmFtIHRlbXBsYXRlUm9vdHMgQW4gYXJyYXkgb2YgdGVtcGxhdGUgcm9vdHMgd2hvc2UgY29udGVudCBzaG91bGQgYmUgaWdub3JlZCB3aGVuXG4gKiBnZW5lcmF0aW5nIHRoZSBpbnN0cnVjdGlvbnMgZm9yIHRoZWlyIHBhcmVudCB0ZW1wbGF0ZS5cbiAqIEBwYXJhbSBsYXN0Q2hpbGRJbmRleCBUaGUgaW5kZXggb2YgdGhlIGxhc3QgY2hpbGQgb2YgdGhlIGkxOG4gbm9kZS4gVXNlZCB3aGVuIHRoZSBpMThuIGJsb2NrIGlzXG4gKiBhbiBuZy1jb250YWluZXIuXG4gKlxuICogQHJldHVybnMgQSBsaXN0IG9mIGluc3RydWN0aW9ucyB1c2VkIHRvIHRyYW5zbGF0ZSBlYWNoIHRlbXBsYXRlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gaTE4bk1hcHBpbmcoXG4gICAgdHJhbnNsYXRpb246IHN0cmluZywgZWxlbWVudHM6IChQbGFjZWhvbGRlck1hcCB8IG51bGwpW10gfCBudWxsLFxuICAgIGV4cHJlc3Npb25zPzogKFBsYWNlaG9sZGVyTWFwIHwgbnVsbClbXSB8IG51bGwsIHRlbXBsYXRlUm9vdHM/OiBzdHJpbmdbXSB8IG51bGwsXG4gICAgbGFzdENoaWxkSW5kZXg/OiBudW1iZXIgfCBudWxsKTogSTE4bkluc3RydWN0aW9uW11bXSB7XG4gIGNvbnN0IHRyYW5zbGF0aW9uUGFydHMgPSB0cmFuc2xhdGlvbi5zcGxpdChpMThuVGFnUmVnZXgpO1xuICBjb25zdCBuYlRlbXBsYXRlcyA9IHRlbXBsYXRlUm9vdHMgPyB0ZW1wbGF0ZVJvb3RzLmxlbmd0aCArIDEgOiAxO1xuICBjb25zdCBpbnN0cnVjdGlvbnM6IEkxOG5JbnN0cnVjdGlvbltdW10gPSAobmV3IEFycmF5KG5iVGVtcGxhdGVzKSkuZmlsbCh1bmRlZmluZWQpO1xuXG4gIGdlbmVyYXRlTWFwcGluZ0luc3RydWN0aW9ucyhcbiAgICAgIDAsIDAsIHRyYW5zbGF0aW9uUGFydHMsIGluc3RydWN0aW9ucywgZWxlbWVudHMsIGV4cHJlc3Npb25zLCB0ZW1wbGF0ZVJvb3RzLCBsYXN0Q2hpbGRJbmRleCk7XG5cbiAgcmV0dXJuIGluc3RydWN0aW9ucztcbn1cblxuLyoqXG4gKiBJbnRlcm5hbCBmdW5jdGlvbiB0aGF0IHJlYWRzIHRoZSB0cmFuc2xhdGlvbiBwYXJ0cyBhbmQgZ2VuZXJhdGVzIGEgc2V0IG9mIGluc3RydWN0aW9ucyBmb3IgZWFjaFxuICogdGVtcGxhdGUuXG4gKlxuICogU2VlIGBpMThuTWFwcGluZygpYCBmb3IgbW9yZSBkZXRhaWxzLlxuICpcbiAqIEBwYXJhbSB0bXBsSW5kZXggVGhlIG9yZGVyIG9mIGFwcGVhcmFuY2Ugb2YgdGhlIHRlbXBsYXRlLlxuICogMCBmb3IgdGhlIHJvb3QgdGVtcGxhdGUsIGZvbGxvd2luZyBpbmRleGVzIG1hdGNoIHRoZSBvcmRlciBpbiBgdGVtcGxhdGVSb290c2AuXG4gKiBAcGFyYW0gcGFydEluZGV4IFRoZSBjdXJyZW50IGluZGV4IGluIGB0cmFuc2xhdGlvblBhcnRzYC5cbiAqIEBwYXJhbSB0cmFuc2xhdGlvblBhcnRzIFRoZSB0cmFuc2xhdGlvbiBzdHJpbmcgc3BsaXQgaW50byBhbiBhcnJheSBvZiBwbGFjZWhvbGRlcnMgYW5kIHRleHRcbiAqIGVsZW1lbnRzLlxuICogQHBhcmFtIGluc3RydWN0aW9ucyBUaGUgY3VycmVudCBsaXN0IG9mIGluc3RydWN0aW9ucyB0byB1cGRhdGUuXG4gKiBAcGFyYW0gZWxlbWVudHMgQW4gYXJyYXkgY29udGFpbmluZywgZm9yIGVhY2ggdGVtcGxhdGUsIHRoZSBtYXBzIG9mIGVsZW1lbnQgcGxhY2Vob2xkZXJzIGFuZFxuICogdGhlaXIgaW5kZXhlcy5cbiAqIEBwYXJhbSBleHByZXNzaW9ucyBBbiBhcnJheSBjb250YWluaW5nLCBmb3IgZWFjaCB0ZW1wbGF0ZSwgdGhlIG1hcHMgb2YgZXhwcmVzc2lvbiBwbGFjZWhvbGRlcnNcbiAqIGFuZCB0aGVpciBpbmRleGVzLlxuICogQHBhcmFtIHRlbXBsYXRlUm9vdHMgQW4gYXJyYXkgb2YgdGVtcGxhdGUgcm9vdHMgd2hvc2UgY29udGVudCBzaG91bGQgYmUgaWdub3JlZCB3aGVuXG4gKiBnZW5lcmF0aW5nIHRoZSBpbnN0cnVjdGlvbnMgZm9yIHRoZWlyIHBhcmVudCB0ZW1wbGF0ZS5cbiAqIEBwYXJhbSBsYXN0Q2hpbGRJbmRleCBUaGUgaW5kZXggb2YgdGhlIGxhc3QgY2hpbGQgb2YgdGhlIGkxOG4gbm9kZS4gVXNlZCB3aGVuIHRoZSBpMThuIGJsb2NrIGlzXG4gKiBhbiBuZy1jb250YWluZXIuXG4gKlxuICogQHJldHVybnMgdGhlIGN1cnJlbnQgaW5kZXggaW4gYHRyYW5zbGF0aW9uUGFydHNgXG4gKi9cbmZ1bmN0aW9uIGdlbmVyYXRlTWFwcGluZ0luc3RydWN0aW9ucyhcbiAgICB0bXBsSW5kZXg6IG51bWJlciwgcGFydEluZGV4OiBudW1iZXIsIHRyYW5zbGF0aW9uUGFydHM6IHN0cmluZ1tdLFxuICAgIGluc3RydWN0aW9uczogSTE4bkluc3RydWN0aW9uW11bXSwgZWxlbWVudHM6IChQbGFjZWhvbGRlck1hcCB8IG51bGwpW10gfCBudWxsLFxuICAgIGV4cHJlc3Npb25zPzogKFBsYWNlaG9sZGVyTWFwIHwgbnVsbClbXSB8IG51bGwsIHRlbXBsYXRlUm9vdHM/OiBzdHJpbmdbXSB8IG51bGwsXG4gICAgbGFzdENoaWxkSW5kZXg/OiBudW1iZXIgfCBudWxsKTogbnVtYmVyIHtcbiAgY29uc3QgdG1wbEluc3RydWN0aW9uczogSTE4bkluc3RydWN0aW9uW10gPSBbXTtcbiAgY29uc3QgcGhWaXNpdGVkOiBzdHJpbmdbXSA9IFtdO1xuICBsZXQgb3BlbmVkVGFnQ291bnQgPSAwO1xuICBsZXQgbWF4SW5kZXggPSAwO1xuICBsZXQgY3VycmVudEVsZW1lbnRzOiBQbGFjZWhvbGRlck1hcHxudWxsID1cbiAgICAgIGVsZW1lbnRzICYmIGVsZW1lbnRzW3RtcGxJbmRleF0gPyBlbGVtZW50c1t0bXBsSW5kZXhdIDogbnVsbDtcbiAgbGV0IGN1cnJlbnRFeHByZXNzaW9uczogUGxhY2Vob2xkZXJNYXB8bnVsbCA9XG4gICAgICBleHByZXNzaW9ucyAmJiBleHByZXNzaW9uc1t0bXBsSW5kZXhdID8gZXhwcmVzc2lvbnNbdG1wbEluZGV4XSA6IG51bGw7XG5cbiAgaW5zdHJ1Y3Rpb25zW3RtcGxJbmRleF0gPSB0bXBsSW5zdHJ1Y3Rpb25zO1xuXG4gIGZvciAoOyBwYXJ0SW5kZXggPCB0cmFuc2xhdGlvblBhcnRzLmxlbmd0aDsgcGFydEluZGV4KyspIHtcbiAgICAvLyBUaGUgdmFsdWUgY2FuIGVpdGhlciBiZSB0ZXh0IG9yIHRoZSBuYW1lIG9mIGEgcGxhY2Vob2xkZXIgKGVsZW1lbnQvdGVtcGxhdGUgcm9vdC9leHByZXNzaW9uKVxuICAgIGNvbnN0IHZhbHVlID0gdHJhbnNsYXRpb25QYXJ0c1twYXJ0SW5kZXhdO1xuXG4gICAgLy8gT2RkIGluZGV4ZXMgYXJlIHBsYWNlaG9sZGVyc1xuICAgIGlmIChwYXJ0SW5kZXggJiAxKSB7XG4gICAgICBsZXQgcGhJbmRleDtcbiAgICAgIGlmIChjdXJyZW50RWxlbWVudHMgJiYgY3VycmVudEVsZW1lbnRzW3ZhbHVlXSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHBoSW5kZXggPSBjdXJyZW50RWxlbWVudHNbdmFsdWVdO1xuICAgICAgICAvLyBUaGUgcGxhY2Vob2xkZXIgcmVwcmVzZW50cyBhIERPTSBlbGVtZW50LCBhZGQgYW4gaW5zdHJ1Y3Rpb24gdG8gbW92ZSBpdFxuICAgICAgICBsZXQgdGVtcGxhdGVSb290SW5kZXggPSB0ZW1wbGF0ZVJvb3RzID8gdGVtcGxhdGVSb290cy5pbmRleE9mKHZhbHVlKSA6IC0xO1xuICAgICAgICBpZiAodGVtcGxhdGVSb290SW5kZXggIT09IC0xICYmICh0ZW1wbGF0ZVJvb3RJbmRleCArIDEpICE9PSB0bXBsSW5kZXgpIHtcbiAgICAgICAgICAvLyBUaGlzIGlzIGEgdGVtcGxhdGUgcm9vdCwgaXQgaGFzIG5vIGNsb3NpbmcgdGFnLCBub3QgdHJlYXRpbmcgaXQgYXMgYW4gZWxlbWVudFxuICAgICAgICAgIHRtcGxJbnN0cnVjdGlvbnMucHVzaChwaEluZGV4IHwgSTE4bkluc3RydWN0aW9ucy5UZW1wbGF0ZVJvb3QpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRtcGxJbnN0cnVjdGlvbnMucHVzaChwaEluZGV4IHwgSTE4bkluc3RydWN0aW9ucy5FbGVtZW50KTtcbiAgICAgICAgICBvcGVuZWRUYWdDb3VudCsrO1xuICAgICAgICB9XG4gICAgICAgIHBoVmlzaXRlZC5wdXNoKHZhbHVlKTtcbiAgICAgIH0gZWxzZSBpZiAoY3VycmVudEV4cHJlc3Npb25zICYmIGN1cnJlbnRFeHByZXNzaW9uc1t2YWx1ZV0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBwaEluZGV4ID0gY3VycmVudEV4cHJlc3Npb25zW3ZhbHVlXTtcbiAgICAgICAgLy8gVGhlIHBsYWNlaG9sZGVyIHJlcHJlc2VudHMgYW4gZXhwcmVzc2lvbiwgYWRkIGFuIGluc3RydWN0aW9uIHRvIG1vdmUgaXRcbiAgICAgICAgdG1wbEluc3RydWN0aW9ucy5wdXNoKHBoSW5kZXggfCBJMThuSW5zdHJ1Y3Rpb25zLkV4cHJlc3Npb24pO1xuICAgICAgICBwaFZpc2l0ZWQucHVzaCh2YWx1ZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBJdCBpcyBhIGNsb3NpbmcgdGFnXG4gICAgICAgIHRtcGxJbnN0cnVjdGlvbnMucHVzaChJMThuSW5zdHJ1Y3Rpb25zLkNsb3NlTm9kZSk7XG5cbiAgICAgICAgaWYgKHRtcGxJbmRleCA+IDApIHtcbiAgICAgICAgICBvcGVuZWRUYWdDb3VudC0tO1xuXG4gICAgICAgICAgLy8gSWYgd2UgaGF2ZSByZWFjaGVkIHRoZSBjbG9zaW5nIHRhZyBmb3IgdGhpcyB0ZW1wbGF0ZSwgZXhpdCB0aGUgbG9vcFxuICAgICAgICAgIGlmIChvcGVuZWRUYWdDb3VudCA9PT0gMCkge1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChwaEluZGV4ICE9PSB1bmRlZmluZWQgJiYgcGhJbmRleCA+IG1heEluZGV4KSB7XG4gICAgICAgIG1heEluZGV4ID0gcGhJbmRleDtcbiAgICAgIH1cblxuICAgICAgaWYgKHRlbXBsYXRlUm9vdHMpIHtcbiAgICAgICAgY29uc3QgbmV3VG1wbEluZGV4ID0gdGVtcGxhdGVSb290cy5pbmRleE9mKHZhbHVlKSArIDE7XG4gICAgICAgIGlmIChuZXdUbXBsSW5kZXggIT09IDAgJiYgbmV3VG1wbEluZGV4ICE9PSB0bXBsSW5kZXgpIHtcbiAgICAgICAgICBwYXJ0SW5kZXggPSBnZW5lcmF0ZU1hcHBpbmdJbnN0cnVjdGlvbnMoXG4gICAgICAgICAgICAgIG5ld1RtcGxJbmRleCwgcGFydEluZGV4LCB0cmFuc2xhdGlvblBhcnRzLCBpbnN0cnVjdGlvbnMsIGVsZW1lbnRzLCBleHByZXNzaW9ucyxcbiAgICAgICAgICAgICAgdGVtcGxhdGVSb290cywgbGFzdENoaWxkSW5kZXgpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICB9IGVsc2UgaWYgKHZhbHVlKSB7XG4gICAgICAvLyBJdCdzIGEgbm9uLWVtcHR5IHN0cmluZywgY3JlYXRlIGEgdGV4dCBub2RlXG4gICAgICB0bXBsSW5zdHJ1Y3Rpb25zLnB1c2goSTE4bkluc3RydWN0aW9ucy5UZXh0LCB2YWx1ZSk7XG4gICAgfVxuICB9XG5cbiAgLy8gQWRkIGluc3RydWN0aW9ucyB0byByZW1vdmUgZWxlbWVudHMgdGhhdCBhcmUgbm90IHVzZWQgaW4gdGhlIHRyYW5zbGF0aW9uXG4gIGlmIChlbGVtZW50cykge1xuICAgIGNvbnN0IHRtcGxFbGVtZW50cyA9IGVsZW1lbnRzW3RtcGxJbmRleF07XG5cbiAgICBpZiAodG1wbEVsZW1lbnRzKSB7XG4gICAgICBjb25zdCBwaEtleXMgPSBPYmplY3Qua2V5cyh0bXBsRWxlbWVudHMpO1xuXG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHBoS2V5cy5sZW5ndGg7IGkrKykge1xuICAgICAgICBjb25zdCBwaCA9IHBoS2V5c1tpXTtcblxuICAgICAgICBpZiAocGhWaXNpdGVkLmluZGV4T2YocGgpID09PSAtMSkge1xuICAgICAgICAgIGxldCBpbmRleCA9IHRtcGxFbGVtZW50c1twaF07XG4gICAgICAgICAgLy8gQWRkIGFuIGluc3RydWN0aW9uIHRvIHJlbW92ZSB0aGUgZWxlbWVudFxuICAgICAgICAgIHRtcGxJbnN0cnVjdGlvbnMucHVzaChpbmRleCB8IEkxOG5JbnN0cnVjdGlvbnMuUmVtb3ZlTm9kZSk7XG5cbiAgICAgICAgICBpZiAoaW5kZXggPiBtYXhJbmRleCkge1xuICAgICAgICAgICAgbWF4SW5kZXggPSBpbmRleDtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvLyBBZGQgaW5zdHJ1Y3Rpb25zIHRvIHJlbW92ZSBleHByZXNzaW9ucyB0aGF0IGFyZSBub3QgdXNlZCBpbiB0aGUgdHJhbnNsYXRpb25cbiAgaWYgKGV4cHJlc3Npb25zKSB7XG4gICAgY29uc3QgdG1wbEV4cHJlc3Npb25zID0gZXhwcmVzc2lvbnNbdG1wbEluZGV4XTtcblxuICAgIGlmICh0bXBsRXhwcmVzc2lvbnMpIHtcbiAgICAgIGNvbnN0IHBoS2V5cyA9IE9iamVjdC5rZXlzKHRtcGxFeHByZXNzaW9ucyk7XG5cbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcGhLZXlzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IHBoID0gcGhLZXlzW2ldO1xuXG4gICAgICAgIGlmIChwaFZpc2l0ZWQuaW5kZXhPZihwaCkgPT09IC0xKSB7XG4gICAgICAgICAgbGV0IGluZGV4ID0gdG1wbEV4cHJlc3Npb25zW3BoXTtcbiAgICAgICAgICBpZiAobmdEZXZNb2RlKSB7XG4gICAgICAgICAgICBhc3NlcnRMZXNzVGhhbihcbiAgICAgICAgICAgICAgICBpbmRleC50b1N0cmluZygyKS5sZW5ndGgsIDI4LCBgSW5kZXggJHtpbmRleH0gaXMgdG9vIGJpZyBhbmQgd2lsbCBvdmVyZmxvd2ApO1xuICAgICAgICAgIH1cbiAgICAgICAgICAvLyBBZGQgYW4gaW5zdHJ1Y3Rpb24gdG8gcmVtb3ZlIHRoZSBleHByZXNzaW9uXG4gICAgICAgICAgdG1wbEluc3RydWN0aW9ucy5wdXNoKGluZGV4IHwgSTE4bkluc3RydWN0aW9ucy5SZW1vdmVOb2RlKTtcblxuICAgICAgICAgIGlmIChpbmRleCA+IG1heEluZGV4KSB7XG4gICAgICAgICAgICBtYXhJbmRleCA9IGluZGV4O1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGlmICh0bXBsSW5kZXggPT09IDAgJiYgdHlwZW9mIGxhc3RDaGlsZEluZGV4ID09PSAnbnVtYmVyJykge1xuICAgIC8vIFRoZSBjdXJyZW50IHBhcmVudCBpcyBhbiBuZy1jb250YWluZXIgYW5kIGl0IGhhcyBtb3JlIGNoaWxkcmVuIGFmdGVyIHRoZSB0cmFuc2xhdGlvbiB0aGF0IHdlXG4gICAgLy8gbmVlZCB0byBhcHBlbmQgdG8ga2VlcCB0aGUgb3JkZXIgb2YgdGhlIERPTSBub2RlcyBjb3JyZWN0XG4gICAgZm9yIChsZXQgaSA9IG1heEluZGV4ICsgMTsgaSA8PSBsYXN0Q2hpbGRJbmRleDsgaSsrKSB7XG4gICAgICBpZiAobmdEZXZNb2RlKSB7XG4gICAgICAgIGFzc2VydExlc3NUaGFuKGkudG9TdHJpbmcoMikubGVuZ3RoLCAyOCwgYEluZGV4ICR7aX0gaXMgdG9vIGJpZyBhbmQgd2lsbCBvdmVyZmxvd2ApO1xuICAgICAgfVxuICAgICAgdG1wbEluc3RydWN0aW9ucy5wdXNoKGkgfCBJMThuSW5zdHJ1Y3Rpb25zLkFueSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHBhcnRJbmRleDtcbn1cblxuZnVuY3Rpb24gYXBwZW5kSTE4bk5vZGUobm9kZTogTE5vZGUsIHBhcmVudE5vZGU6IExOb2RlLCBwcmV2aW91c05vZGU6IExOb2RlKSB7XG4gIGlmIChuZ0Rldk1vZGUpIHtcbiAgICBuZ0Rldk1vZGUucmVuZGVyZXJNb3ZlTm9kZSsrO1xuICB9XG5cbiAgY29uc3Qgdmlld0RhdGEgPSBfZ2V0Vmlld0RhdGEoKTtcblxuICBhcHBlbmRDaGlsZChwYXJlbnROb2RlLCBub2RlLm5hdGl2ZSB8fCBudWxsLCB2aWV3RGF0YSk7XG5cbiAgLy8gT24gZmlyc3QgcGFzcywgcmUtb3JnYW5pemUgbm9kZSB0cmVlIHRvIHB1dCB0aGlzIG5vZGUgaW4gdGhlIGNvcnJlY3QgcG9zaXRpb24uXG4gIGNvbnN0IGZpcnN0VGVtcGxhdGVQYXNzID0gbm9kZS52aWV3W1RWSUVXXS5maXJzdFRlbXBsYXRlUGFzcztcbiAgaWYgKGZpcnN0VGVtcGxhdGVQYXNzKSB7XG4gICAgaWYgKHByZXZpb3VzTm9kZSA9PT0gcGFyZW50Tm9kZSAmJiBub2RlLnROb2RlICE9PSBwYXJlbnROb2RlLnROb2RlLmNoaWxkKSB7XG4gICAgICBub2RlLnROb2RlLm5leHQgPSBwYXJlbnROb2RlLnROb2RlLmNoaWxkO1xuICAgICAgcGFyZW50Tm9kZS50Tm9kZS5jaGlsZCA9IG5vZGUudE5vZGU7XG4gICAgfSBlbHNlIGlmIChwcmV2aW91c05vZGUgIT09IHBhcmVudE5vZGUgJiYgbm9kZS50Tm9kZSAhPT0gcHJldmlvdXNOb2RlLnROb2RlLm5leHQpIHtcbiAgICAgIG5vZGUudE5vZGUubmV4dCA9IHByZXZpb3VzTm9kZS50Tm9kZS5uZXh0O1xuICAgICAgcHJldmlvdXNOb2RlLnROb2RlLm5leHQgPSBub2RlLnROb2RlO1xuICAgIH0gZWxzZSB7XG4gICAgICBub2RlLnROb2RlLm5leHQgPSBudWxsO1xuICAgIH1cblxuICAgIGlmIChwYXJlbnROb2RlLnZpZXcgPT09IG5vZGUudmlldykgbm9kZS50Tm9kZS5wYXJlbnQgPSBwYXJlbnROb2RlLnROb2RlIGFzIFRFbGVtZW50Tm9kZTtcbiAgfVxuXG4gIC8vIFRlbXBsYXRlIGNvbnRhaW5lcnMgYWxzbyBoYXZlIGEgY29tbWVudCBub2RlIGZvciB0aGUgYFZpZXdDb250YWluZXJSZWZgIHRoYXQgc2hvdWxkIGJlIG1vdmVkXG4gIGlmIChub2RlLnROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5Db250YWluZXIgJiYgbm9kZS5keW5hbWljTENvbnRhaW5lck5vZGUpIHtcbiAgICBhcHBlbmRDaGlsZChwYXJlbnROb2RlLCBub2RlLmR5bmFtaWNMQ29udGFpbmVyTm9kZS5uYXRpdmUgfHwgbnVsbCwgdmlld0RhdGEpO1xuICAgIGlmIChmaXJzdFRlbXBsYXRlUGFzcykge1xuICAgICAgbm9kZS50Tm9kZS5keW5hbWljQ29udGFpbmVyTm9kZSA9IG5vZGUuZHluYW1pY0xDb250YWluZXJOb2RlLnROb2RlO1xuICAgICAgbm9kZS5keW5hbWljTENvbnRhaW5lck5vZGUudE5vZGUucGFyZW50ID0gbm9kZS50Tm9kZSBhcyBUQ29udGFpbmVyTm9kZTtcbiAgICB9XG4gICAgcmV0dXJuIG5vZGUuZHluYW1pY0xDb250YWluZXJOb2RlO1xuICB9XG5cbiAgcmV0dXJuIG5vZGU7XG59XG5cbi8qKlxuICogVGFrZXMgYSBsaXN0IG9mIGluc3RydWN0aW9ucyBnZW5lcmF0ZWQgYnkgYGkxOG5NYXBwaW5nKClgIHRvIHRyYW5zZm9ybSB0aGUgdGVtcGxhdGUgYWNjb3JkaW5nbHkuXG4gKlxuICogQHBhcmFtIHN0YXJ0SW5kZXggSW5kZXggb2YgdGhlIGZpcnN0IGVsZW1lbnQgdG8gdHJhbnNsYXRlIChmb3IgaW5zdGFuY2UgdGhlIGZpcnN0IGNoaWxkIG9mIHRoZVxuICogZWxlbWVudCB3aXRoIHRoZSBpMThuIGF0dHJpYnV0ZSkuXG4gKiBAcGFyYW0gaW5zdHJ1Y3Rpb25zIFRoZSBsaXN0IG9mIGluc3RydWN0aW9ucyB0byBhcHBseSBvbiB0aGUgY3VycmVudCB2aWV3LlxuICovXG5leHBvcnQgZnVuY3Rpb24gaTE4bkFwcGx5KHN0YXJ0SW5kZXg6IG51bWJlciwgaW5zdHJ1Y3Rpb25zOiBJMThuSW5zdHJ1Y3Rpb25bXSk6IHZvaWQge1xuICBjb25zdCB2aWV3RGF0YSA9IF9nZXRWaWV3RGF0YSgpO1xuICBpZiAobmdEZXZNb2RlKSB7XG4gICAgYXNzZXJ0RXF1YWwoXG4gICAgICAgIHZpZXdEYXRhW0JJTkRJTkdfSU5ERVhdLCB2aWV3RGF0YVtUVklFV10uYmluZGluZ1N0YXJ0SW5kZXgsXG4gICAgICAgICdpMThuQXBwbHkgc2hvdWxkIGJlIGNhbGxlZCBiZWZvcmUgYW55IGJpbmRpbmcnKTtcbiAgfVxuXG4gIGlmICghaW5zdHJ1Y3Rpb25zKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY29uc3QgcmVuZGVyZXIgPSBnZXRSZW5kZXJlcigpO1xuICBsZXQgbG9jYWxQYXJlbnROb2RlOiBMTm9kZSA9IGdldFBhcmVudExOb2RlKGxvYWQoc3RhcnRJbmRleCkpIHx8IGdldFByZXZpb3VzT3JQYXJlbnROb2RlKCk7XG4gIGxldCBsb2NhbFByZXZpb3VzTm9kZTogTE5vZGUgPSBsb2NhbFBhcmVudE5vZGU7XG4gIHJlc2V0Q29tcG9uZW50U3RhdGUoKTsgIC8vIFdlIGRvbid0IHdhbnQgdG8gYWRkIHRvIHRoZSB0cmVlIHdpdGggdGhlIHdyb25nIHByZXZpb3VzIG5vZGVcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IGluc3RydWN0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IGluc3RydWN0aW9uID0gaW5zdHJ1Y3Rpb25zW2ldIGFzIG51bWJlcjtcbiAgICBzd2l0Y2ggKGluc3RydWN0aW9uICYgSTE4bkluc3RydWN0aW9ucy5JbnN0cnVjdGlvbk1hc2spIHtcbiAgICAgIGNhc2UgSTE4bkluc3RydWN0aW9ucy5FbGVtZW50OlxuICAgICAgICBjb25zdCBlbGVtZW50OiBMTm9kZSA9IGxvYWQoaW5zdHJ1Y3Rpb24gJiBJMThuSW5zdHJ1Y3Rpb25zLkluZGV4TWFzayk7XG4gICAgICAgIGxvY2FsUHJldmlvdXNOb2RlID0gYXBwZW5kSTE4bk5vZGUoZWxlbWVudCwgbG9jYWxQYXJlbnROb2RlLCBsb2NhbFByZXZpb3VzTm9kZSk7XG4gICAgICAgIGxvY2FsUGFyZW50Tm9kZSA9IGVsZW1lbnQ7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBJMThuSW5zdHJ1Y3Rpb25zLkV4cHJlc3Npb246XG4gICAgICBjYXNlIEkxOG5JbnN0cnVjdGlvbnMuVGVtcGxhdGVSb290OlxuICAgICAgY2FzZSBJMThuSW5zdHJ1Y3Rpb25zLkFueTpcbiAgICAgICAgY29uc3Qgbm9kZTogTE5vZGUgPSBsb2FkKGluc3RydWN0aW9uICYgSTE4bkluc3RydWN0aW9ucy5JbmRleE1hc2spO1xuICAgICAgICBsb2NhbFByZXZpb3VzTm9kZSA9IGFwcGVuZEkxOG5Ob2RlKG5vZGUsIGxvY2FsUGFyZW50Tm9kZSwgbG9jYWxQcmV2aW91c05vZGUpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgSTE4bkluc3RydWN0aW9ucy5UZXh0OlxuICAgICAgICBpZiAobmdEZXZNb2RlKSB7XG4gICAgICAgICAgbmdEZXZNb2RlLnJlbmRlcmVyQ3JlYXRlVGV4dE5vZGUrKztcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB2YWx1ZSA9IGluc3RydWN0aW9uc1srK2ldO1xuICAgICAgICBjb25zdCB0ZXh0Uk5vZGUgPSBjcmVhdGVUZXh0Tm9kZSh2YWx1ZSwgcmVuZGVyZXIpO1xuICAgICAgICAvLyBJZiB3ZSB3ZXJlIHRvIG9ubHkgY3JlYXRlIGEgYFJOb2RlYCB0aGVuIHByb2plY3Rpb25zIHdvbid0IG1vdmUgdGhlIHRleHQuXG4gICAgICAgIC8vIENyZWF0ZSB0ZXh0IG5vZGUgYXQgdGhlIGN1cnJlbnQgZW5kIG9mIHZpZXdEYXRhLiBNdXN0IHN1YnRyYWN0IGhlYWRlciBvZmZzZXQgYmVjYXVzZVxuICAgICAgICAvLyBjcmVhdGVMTm9kZSB0YWtlcyBhIHJhdyBpbmRleCAobm90IGFkanVzdGVkIGJ5IGhlYWRlciBvZmZzZXQpLlxuICAgICAgICBhZGp1c3RCbHVlcHJpbnRGb3JOZXdOb2RlKHZpZXdEYXRhKTtcbiAgICAgICAgY29uc3QgbGFzdE5vZGVJbmRleCA9IHZpZXdEYXRhLmxlbmd0aCAtIDE7XG4gICAgICAgIGNvbnN0IHRleHRMTm9kZSA9XG4gICAgICAgICAgICBjcmVhdGVMTm9kZShsYXN0Tm9kZUluZGV4IC0gSEVBREVSX09GRlNFVCwgVE5vZGVUeXBlLkVsZW1lbnQsIHRleHRSTm9kZSwgbnVsbCwgbnVsbCk7XG4gICAgICAgIGxvY2FsUHJldmlvdXNOb2RlID0gYXBwZW5kSTE4bk5vZGUodGV4dExOb2RlLCBsb2NhbFBhcmVudE5vZGUsIGxvY2FsUHJldmlvdXNOb2RlKTtcbiAgICAgICAgcmVzZXRDb21wb25lbnRTdGF0ZSgpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgSTE4bkluc3RydWN0aW9ucy5DbG9zZU5vZGU6XG4gICAgICAgIGxvY2FsUHJldmlvdXNOb2RlID0gbG9jYWxQYXJlbnROb2RlO1xuICAgICAgICBsb2NhbFBhcmVudE5vZGUgPSBnZXRQYXJlbnRMTm9kZShsb2NhbFBhcmVudE5vZGUpICE7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBJMThuSW5zdHJ1Y3Rpb25zLlJlbW92ZU5vZGU6XG4gICAgICAgIGlmIChuZ0Rldk1vZGUpIHtcbiAgICAgICAgICBuZ0Rldk1vZGUucmVuZGVyZXJSZW1vdmVOb2RlKys7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgaW5kZXggPSBpbnN0cnVjdGlvbiAmIEkxOG5JbnN0cnVjdGlvbnMuSW5kZXhNYXNrO1xuICAgICAgICBjb25zdCByZW1vdmVkTm9kZTogTE5vZGV8TENvbnRhaW5lck5vZGUgPSBsb2FkKGluZGV4KTtcbiAgICAgICAgY29uc3QgcGFyZW50Tm9kZSA9IGdldFBhcmVudExOb2RlKHJlbW92ZWROb2RlKSAhO1xuICAgICAgICByZW1vdmVDaGlsZChwYXJlbnROb2RlLCByZW1vdmVkTm9kZS5uYXRpdmUgfHwgbnVsbCwgdmlld0RhdGEpO1xuXG4gICAgICAgIC8vIEZvciB0ZW1wbGF0ZSBjb250YWluZXJzIHdlIGFsc28gbmVlZCB0byByZW1vdmUgdGhlaXIgYFZpZXdDb250YWluZXJSZWZgIGZyb20gdGhlIERPTVxuICAgICAgICBpZiAocmVtb3ZlZE5vZGUudE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkNvbnRhaW5lciAmJiByZW1vdmVkTm9kZS5keW5hbWljTENvbnRhaW5lck5vZGUpIHtcbiAgICAgICAgICByZW1vdmVDaGlsZChwYXJlbnROb2RlLCByZW1vdmVkTm9kZS5keW5hbWljTENvbnRhaW5lck5vZGUubmF0aXZlIHx8IG51bGwsIHZpZXdEYXRhKTtcbiAgICAgICAgICByZW1vdmVkTm9kZS5keW5hbWljTENvbnRhaW5lck5vZGUudE5vZGUuZGV0YWNoZWQgPSB0cnVlO1xuICAgICAgICAgIHJlbW92ZWROb2RlLmR5bmFtaWNMQ29udGFpbmVyTm9kZS5kYXRhW1JFTkRFUl9QQVJFTlRdID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBUYWtlcyBhIHRyYW5zbGF0aW9uIHN0cmluZyBhbmQgdGhlIGluaXRpYWwgbGlzdCBvZiBleHByZXNzaW9ucyBhbmQgcmV0dXJucyBhIGxpc3Qgb2YgaW5zdHJ1Y3Rpb25zXG4gKiB0aGF0IHdpbGwgYmUgdXNlZCB0byB0cmFuc2xhdGUgYW4gYXR0cmlidXRlLlxuICogRXZlbiBpbmRleGVzIGNvbnRhaW4gc3RhdGljIHN0cmluZ3MsIHdoaWxlIG9kZCBpbmRleGVzIGNvbnRhaW4gdGhlIGluZGV4IG9mIHRoZSBleHByZXNzaW9uIHdob3NlXG4gKiB2YWx1ZSB3aWxsIGJlIGNvbmNhdGVuYXRlZCBpbnRvIHRoZSBmaW5hbCB0cmFuc2xhdGlvbi5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGkxOG5FeHBNYXBwaW5nKFxuICAgIHRyYW5zbGF0aW9uOiBzdHJpbmcsIHBsYWNlaG9sZGVyczogUGxhY2Vob2xkZXJNYXApOiBJMThuRXhwSW5zdHJ1Y3Rpb25bXSB7XG4gIGNvbnN0IHN0YXRpY1RleHQ6IEkxOG5FeHBJbnN0cnVjdGlvbltdID0gdHJhbnNsYXRpb24uc3BsaXQoaTE4blRhZ1JlZ2V4KTtcbiAgLy8gb2RkIGluZGV4ZXMgYXJlIHBsYWNlaG9sZGVyc1xuICBmb3IgKGxldCBpID0gMTsgaSA8IHN0YXRpY1RleHQubGVuZ3RoOyBpICs9IDIpIHtcbiAgICBzdGF0aWNUZXh0W2ldID0gcGxhY2Vob2xkZXJzW3N0YXRpY1RleHRbaV1dO1xuICB9XG4gIHJldHVybiBzdGF0aWNUZXh0O1xufVxuXG4vKipcbiAqIENoZWNrcyBpZiB0aGUgdmFsdWUgb2YgYW4gZXhwcmVzc2lvbiBoYXMgY2hhbmdlZCBhbmQgcmVwbGFjZXMgaXQgYnkgaXRzIHZhbHVlIGluIGEgdHJhbnNsYXRpb24sXG4gKiBvciByZXR1cm5zIE5PX0NIQU5HRS5cbiAqXG4gKiBAcGFyYW0gaW5zdHJ1Y3Rpb25zIEEgbGlzdCBvZiBpbnN0cnVjdGlvbnMgdGhhdCB3aWxsIGJlIHVzZWQgdG8gdHJhbnNsYXRlIGFuIGF0dHJpYnV0ZS5cbiAqIEBwYXJhbSB2MCB2YWx1ZSBjaGVja2VkIGZvciBjaGFuZ2UuXG4gKlxuICogQHJldHVybnMgVGhlIGNvbmNhdGVuYXRlZCBzdHJpbmcgd2hlbiBhbnkgb2YgdGhlIGFyZ3VtZW50cyBjaGFuZ2VzLCBgTk9fQ0hBTkdFYCBvdGhlcndpc2UuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpMThuSW50ZXJwb2xhdGlvbjEoaW5zdHJ1Y3Rpb25zOiBJMThuRXhwSW5zdHJ1Y3Rpb25bXSwgdjA6IGFueSk6IHN0cmluZ3xOT19DSEFOR0Uge1xuICBjb25zdCBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZChfZ2V0Vmlld0RhdGEoKVtCSU5ESU5HX0lOREVYXSsrLCB2MCk7XG5cbiAgaWYgKCFkaWZmZXJlbnQpIHtcbiAgICByZXR1cm4gTk9fQ0hBTkdFO1xuICB9XG5cbiAgbGV0IHJlcyA9ICcnO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGluc3RydWN0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgIC8vIE9kZCBpbmRleGVzIGFyZSBiaW5kaW5nc1xuICAgIGlmIChpICYgMSkge1xuICAgICAgcmVzICs9IHN0cmluZ2lmeSh2MCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlcyArPSBpbnN0cnVjdGlvbnNbaV07XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHJlcztcbn1cblxuLyoqXG4gKiBDaGVja3MgaWYgdGhlIHZhbHVlcyBvZiB1cCB0byAyIGV4cHJlc3Npb25zIGhhdmUgY2hhbmdlZCBhbmQgcmVwbGFjZXMgdGhlbSBieSB0aGVpciB2YWx1ZXMgaW4gYVxuICogdHJhbnNsYXRpb24sIG9yIHJldHVybnMgTk9fQ0hBTkdFLlxuICpcbiAqIEBwYXJhbSBpbnN0cnVjdGlvbnMgQSBsaXN0IG9mIGluc3RydWN0aW9ucyB0aGF0IHdpbGwgYmUgdXNlZCB0byB0cmFuc2xhdGUgYW4gYXR0cmlidXRlLlxuICogQHBhcmFtIHYwIHZhbHVlIGNoZWNrZWQgZm9yIGNoYW5nZS5cbiAqIEBwYXJhbSB2MSB2YWx1ZSBjaGVja2VkIGZvciBjaGFuZ2UuXG4gKlxuICogQHJldHVybnMgVGhlIGNvbmNhdGVuYXRlZCBzdHJpbmcgd2hlbiBhbnkgb2YgdGhlIGFyZ3VtZW50cyBjaGFuZ2VzLCBgTk9fQ0hBTkdFYCBvdGhlcndpc2UuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpMThuSW50ZXJwb2xhdGlvbjIoaW5zdHJ1Y3Rpb25zOiBJMThuRXhwSW5zdHJ1Y3Rpb25bXSwgdjA6IGFueSwgdjE6IGFueSk6IHN0cmluZ3xcbiAgICBOT19DSEFOR0Uge1xuICBjb25zdCB2aWV3RGF0YSA9IF9nZXRWaWV3RGF0YSgpO1xuICBjb25zdCBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZDIodmlld0RhdGFbQklORElOR19JTkRFWF0sIHYwLCB2MSk7XG4gIHZpZXdEYXRhW0JJTkRJTkdfSU5ERVhdICs9IDI7XG5cbiAgaWYgKCFkaWZmZXJlbnQpIHtcbiAgICByZXR1cm4gTk9fQ0hBTkdFO1xuICB9XG5cbiAgbGV0IHJlcyA9ICcnO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGluc3RydWN0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgIC8vIE9kZCBpbmRleGVzIGFyZSBiaW5kaW5nc1xuICAgIGlmIChpICYgMSkge1xuICAgICAgLy8gRXh0cmFjdCBiaXRzXG4gICAgICBjb25zdCBpZHggPSBpbnN0cnVjdGlvbnNbaV0gYXMgbnVtYmVyO1xuICAgICAgY29uc3QgYjEgPSBpZHggJiAxO1xuICAgICAgLy8gR2V0IHRoZSB2YWx1ZSBmcm9tIHRoZSBhcmd1bWVudCB2eCB3aGVyZSB4ID0gaWR4XG4gICAgICBjb25zdCB2YWx1ZSA9IGIxID8gdjEgOiB2MDtcblxuICAgICAgcmVzICs9IHN0cmluZ2lmeSh2YWx1ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlcyArPSBpbnN0cnVjdGlvbnNbaV07XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHJlcztcbn1cblxuLyoqXG4gKiBDaGVja3MgaWYgdGhlIHZhbHVlcyBvZiB1cCB0byAzIGV4cHJlc3Npb25zIGhhdmUgY2hhbmdlZCBhbmQgcmVwbGFjZXMgdGhlbSBieSB0aGVpciB2YWx1ZXMgaW4gYVxuICogdHJhbnNsYXRpb24sIG9yIHJldHVybnMgTk9fQ0hBTkdFLlxuICpcbiAqIEBwYXJhbSBpbnN0cnVjdGlvbnMgQSBsaXN0IG9mIGluc3RydWN0aW9ucyB0aGF0IHdpbGwgYmUgdXNlZCB0byB0cmFuc2xhdGUgYW4gYXR0cmlidXRlLlxuICogQHBhcmFtIHYwIHZhbHVlIGNoZWNrZWQgZm9yIGNoYW5nZS5cbiAqIEBwYXJhbSB2MSB2YWx1ZSBjaGVja2VkIGZvciBjaGFuZ2UuXG4gKiBAcGFyYW0gdjIgdmFsdWUgY2hlY2tlZCBmb3IgY2hhbmdlLlxuICpcbiAqIEByZXR1cm5zIFRoZSBjb25jYXRlbmF0ZWQgc3RyaW5nIHdoZW4gYW55IG9mIHRoZSBhcmd1bWVudHMgY2hhbmdlcywgYE5PX0NIQU5HRWAgb3RoZXJ3aXNlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gaTE4bkludGVycG9sYXRpb24zKFxuICAgIGluc3RydWN0aW9uczogSTE4bkV4cEluc3RydWN0aW9uW10sIHYwOiBhbnksIHYxOiBhbnksIHYyOiBhbnkpOiBzdHJpbmd8Tk9fQ0hBTkdFIHtcbiAgY29uc3Qgdmlld0RhdGEgPSBfZ2V0Vmlld0RhdGEoKTtcbiAgY29uc3QgZGlmZmVyZW50ID0gYmluZGluZ1VwZGF0ZWQzKHZpZXdEYXRhW0JJTkRJTkdfSU5ERVhdLCB2MCwgdjEsIHYyKTtcbiAgdmlld0RhdGFbQklORElOR19JTkRFWF0gKz0gMztcblxuICBpZiAoIWRpZmZlcmVudCkge1xuICAgIHJldHVybiBOT19DSEFOR0U7XG4gIH1cblxuICBsZXQgcmVzID0gJyc7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgaW5zdHJ1Y3Rpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgLy8gT2RkIGluZGV4ZXMgYXJlIGJpbmRpbmdzXG4gICAgaWYgKGkgJiAxKSB7XG4gICAgICAvLyBFeHRyYWN0IGJpdHNcbiAgICAgIGNvbnN0IGlkeCA9IGluc3RydWN0aW9uc1tpXSBhcyBudW1iZXI7XG4gICAgICBjb25zdCBiMiA9IGlkeCAmIDI7XG4gICAgICBjb25zdCBiMSA9IGlkeCAmIDE7XG4gICAgICAvLyBHZXQgdGhlIHZhbHVlIGZyb20gdGhlIGFyZ3VtZW50IHZ4IHdoZXJlIHggPSBpZHhcbiAgICAgIGNvbnN0IHZhbHVlID0gYjIgPyB2MiA6IChiMSA/IHYxIDogdjApO1xuXG4gICAgICByZXMgKz0gc3RyaW5naWZ5KHZhbHVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmVzICs9IGluc3RydWN0aW9uc1tpXTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gcmVzO1xufVxuXG4vKipcbiAqIENoZWNrcyBpZiB0aGUgdmFsdWVzIG9mIHVwIHRvIDQgZXhwcmVzc2lvbnMgaGF2ZSBjaGFuZ2VkIGFuZCByZXBsYWNlcyB0aGVtIGJ5IHRoZWlyIHZhbHVlcyBpbiBhXG4gKiB0cmFuc2xhdGlvbiwgb3IgcmV0dXJucyBOT19DSEFOR0UuXG4gKlxuICogQHBhcmFtIGluc3RydWN0aW9ucyBBIGxpc3Qgb2YgaW5zdHJ1Y3Rpb25zIHRoYXQgd2lsbCBiZSB1c2VkIHRvIHRyYW5zbGF0ZSBhbiBhdHRyaWJ1dGUuXG4gKiBAcGFyYW0gdjAgdmFsdWUgY2hlY2tlZCBmb3IgY2hhbmdlLlxuICogQHBhcmFtIHYxIHZhbHVlIGNoZWNrZWQgZm9yIGNoYW5nZS5cbiAqIEBwYXJhbSB2MiB2YWx1ZSBjaGVja2VkIGZvciBjaGFuZ2UuXG4gKiBAcGFyYW0gdjMgdmFsdWUgY2hlY2tlZCBmb3IgY2hhbmdlLlxuICpcbiAqIEByZXR1cm5zIFRoZSBjb25jYXRlbmF0ZWQgc3RyaW5nIHdoZW4gYW55IG9mIHRoZSBhcmd1bWVudHMgY2hhbmdlcywgYE5PX0NIQU5HRWAgb3RoZXJ3aXNlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gaTE4bkludGVycG9sYXRpb240KFxuICAgIGluc3RydWN0aW9uczogSTE4bkV4cEluc3RydWN0aW9uW10sIHYwOiBhbnksIHYxOiBhbnksIHYyOiBhbnksIHYzOiBhbnkpOiBzdHJpbmd8Tk9fQ0hBTkdFIHtcbiAgY29uc3Qgdmlld0RhdGEgPSBfZ2V0Vmlld0RhdGEoKTtcbiAgY29uc3QgZGlmZmVyZW50ID0gYmluZGluZ1VwZGF0ZWQ0KHZpZXdEYXRhW0JJTkRJTkdfSU5ERVhdLCB2MCwgdjEsIHYyLCB2Myk7XG4gIHZpZXdEYXRhW0JJTkRJTkdfSU5ERVhdICs9IDQ7XG5cbiAgaWYgKCFkaWZmZXJlbnQpIHtcbiAgICByZXR1cm4gTk9fQ0hBTkdFO1xuICB9XG5cbiAgbGV0IHJlcyA9ICcnO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGluc3RydWN0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgIC8vIE9kZCBpbmRleGVzIGFyZSBiaW5kaW5nc1xuICAgIGlmIChpICYgMSkge1xuICAgICAgLy8gRXh0cmFjdCBiaXRzXG4gICAgICBjb25zdCBpZHggPSBpbnN0cnVjdGlvbnNbaV0gYXMgbnVtYmVyO1xuICAgICAgY29uc3QgYjIgPSBpZHggJiAyO1xuICAgICAgY29uc3QgYjEgPSBpZHggJiAxO1xuICAgICAgLy8gR2V0IHRoZSB2YWx1ZSBmcm9tIHRoZSBhcmd1bWVudCB2eCB3aGVyZSB4ID0gaWR4XG4gICAgICBjb25zdCB2YWx1ZSA9IGIyID8gKGIxID8gdjMgOiB2MikgOiAoYjEgPyB2MSA6IHYwKTtcblxuICAgICAgcmVzICs9IHN0cmluZ2lmeSh2YWx1ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlcyArPSBpbnN0cnVjdGlvbnNbaV07XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHJlcztcbn1cblxuLyoqXG4gKiBDaGVja3MgaWYgdGhlIHZhbHVlcyBvZiB1cCB0byA1IGV4cHJlc3Npb25zIGhhdmUgY2hhbmdlZCBhbmQgcmVwbGFjZXMgdGhlbSBieSB0aGVpciB2YWx1ZXMgaW4gYVxuICogdHJhbnNsYXRpb24sIG9yIHJldHVybnMgTk9fQ0hBTkdFLlxuICpcbiAqIEBwYXJhbSBpbnN0cnVjdGlvbnMgQSBsaXN0IG9mIGluc3RydWN0aW9ucyB0aGF0IHdpbGwgYmUgdXNlZCB0byB0cmFuc2xhdGUgYW4gYXR0cmlidXRlLlxuICogQHBhcmFtIHYwIHZhbHVlIGNoZWNrZWQgZm9yIGNoYW5nZS5cbiAqIEBwYXJhbSB2MSB2YWx1ZSBjaGVja2VkIGZvciBjaGFuZ2UuXG4gKiBAcGFyYW0gdjIgdmFsdWUgY2hlY2tlZCBmb3IgY2hhbmdlLlxuICogQHBhcmFtIHYzIHZhbHVlIGNoZWNrZWQgZm9yIGNoYW5nZS5cbiAqIEBwYXJhbSB2NCB2YWx1ZSBjaGVja2VkIGZvciBjaGFuZ2UuXG4gKlxuICogQHJldHVybnMgVGhlIGNvbmNhdGVuYXRlZCBzdHJpbmcgd2hlbiBhbnkgb2YgdGhlIGFyZ3VtZW50cyBjaGFuZ2VzLCBgTk9fQ0hBTkdFYCBvdGhlcndpc2UuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpMThuSW50ZXJwb2xhdGlvbjUoXG4gICAgaW5zdHJ1Y3Rpb25zOiBJMThuRXhwSW5zdHJ1Y3Rpb25bXSwgdjA6IGFueSwgdjE6IGFueSwgdjI6IGFueSwgdjM6IGFueSwgdjQ6IGFueSk6IHN0cmluZ3xcbiAgICBOT19DSEFOR0Uge1xuICBjb25zdCB2aWV3RGF0YSA9IF9nZXRWaWV3RGF0YSgpO1xuICBsZXQgZGlmZmVyZW50ID0gYmluZGluZ1VwZGF0ZWQ0KHZpZXdEYXRhW0JJTkRJTkdfSU5ERVhdLCB2MCwgdjEsIHYyLCB2Myk7XG4gIGRpZmZlcmVudCA9IGJpbmRpbmdVcGRhdGVkKHZpZXdEYXRhW0JJTkRJTkdfSU5ERVhdICsgNCwgdjQpIHx8IGRpZmZlcmVudDtcbiAgdmlld0RhdGFbQklORElOR19JTkRFWF0gKz0gNTtcblxuICBpZiAoIWRpZmZlcmVudCkge1xuICAgIHJldHVybiBOT19DSEFOR0U7XG4gIH1cblxuICBsZXQgcmVzID0gJyc7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgaW5zdHJ1Y3Rpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgLy8gT2RkIGluZGV4ZXMgYXJlIGJpbmRpbmdzXG4gICAgaWYgKGkgJiAxKSB7XG4gICAgICAvLyBFeHRyYWN0IGJpdHNcbiAgICAgIGNvbnN0IGlkeCA9IGluc3RydWN0aW9uc1tpXSBhcyBudW1iZXI7XG4gICAgICBjb25zdCBiNCA9IGlkeCAmIDQ7XG4gICAgICBjb25zdCBiMiA9IGlkeCAmIDI7XG4gICAgICBjb25zdCBiMSA9IGlkeCAmIDE7XG4gICAgICAvLyBHZXQgdGhlIHZhbHVlIGZyb20gdGhlIGFyZ3VtZW50IHZ4IHdoZXJlIHggPSBpZHhcbiAgICAgIGNvbnN0IHZhbHVlID0gYjQgPyB2NCA6IChiMiA/IChiMSA/IHYzIDogdjIpIDogKGIxID8gdjEgOiB2MCkpO1xuXG4gICAgICByZXMgKz0gc3RyaW5naWZ5KHZhbHVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmVzICs9IGluc3RydWN0aW9uc1tpXTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gcmVzO1xufVxuXG4vKipcbiAqIENoZWNrcyBpZiB0aGUgdmFsdWVzIG9mIHVwIHRvIDYgZXhwcmVzc2lvbnMgaGF2ZSBjaGFuZ2VkIGFuZCByZXBsYWNlcyB0aGVtIGJ5IHRoZWlyIHZhbHVlcyBpbiBhXG4gKiB0cmFuc2xhdGlvbiwgb3IgcmV0dXJucyBOT19DSEFOR0UuXG4gKlxuICogQHBhcmFtIGluc3RydWN0aW9ucyBBIGxpc3Qgb2YgaW5zdHJ1Y3Rpb25zIHRoYXQgd2lsbCBiZSB1c2VkIHRvIHRyYW5zbGF0ZSBhbiBhdHRyaWJ1dGUuXG4gKiBAcGFyYW0gdjAgdmFsdWUgY2hlY2tlZCBmb3IgY2hhbmdlLlxuICogQHBhcmFtIHYxIHZhbHVlIGNoZWNrZWQgZm9yIGNoYW5nZS5cbiAqIEBwYXJhbSB2MiB2YWx1ZSBjaGVja2VkIGZvciBjaGFuZ2UuXG4gKiBAcGFyYW0gdjMgdmFsdWUgY2hlY2tlZCBmb3IgY2hhbmdlLlxuICogQHBhcmFtIHY0IHZhbHVlIGNoZWNrZWQgZm9yIGNoYW5nZS5cbiAqIEBwYXJhbSB2NSB2YWx1ZSBjaGVja2VkIGZvciBjaGFuZ2UuXG4gKlxuICogQHJldHVybnMgVGhlIGNvbmNhdGVuYXRlZCBzdHJpbmcgd2hlbiBhbnkgb2YgdGhlIGFyZ3VtZW50cyBjaGFuZ2VzLCBgTk9fQ0hBTkdFYCBvdGhlcndpc2UuXG4gKi8gZXhwb3J0IGZ1bmN0aW9uXG5pMThuSW50ZXJwb2xhdGlvbjYoXG4gICAgaW5zdHJ1Y3Rpb25zOiBJMThuRXhwSW5zdHJ1Y3Rpb25bXSwgdjA6IGFueSwgdjE6IGFueSwgdjI6IGFueSwgdjM6IGFueSwgdjQ6IGFueSwgdjU6IGFueSk6XG4gICAgc3RyaW5nfE5PX0NIQU5HRSB7XG4gIGNvbnN0IHZpZXdEYXRhID0gX2dldFZpZXdEYXRhKCk7XG4gIGxldCBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZDQodmlld0RhdGFbQklORElOR19JTkRFWF0sIHYwLCB2MSwgdjIsIHYzKTtcbiAgZGlmZmVyZW50ID0gYmluZGluZ1VwZGF0ZWQyKHZpZXdEYXRhW0JJTkRJTkdfSU5ERVhdICsgNCwgdjQsIHY1KSB8fCBkaWZmZXJlbnQ7XG4gIHZpZXdEYXRhW0JJTkRJTkdfSU5ERVhdICs9IDY7XG5cbiAgaWYgKCFkaWZmZXJlbnQpIHtcbiAgICByZXR1cm4gTk9fQ0hBTkdFO1xuICB9XG5cbiAgbGV0IHJlcyA9ICcnO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGluc3RydWN0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgIC8vIE9kZCBpbmRleGVzIGFyZSBiaW5kaW5nc1xuICAgIGlmIChpICYgMSkge1xuICAgICAgLy8gRXh0cmFjdCBiaXRzXG4gICAgICBjb25zdCBpZHggPSBpbnN0cnVjdGlvbnNbaV0gYXMgbnVtYmVyO1xuICAgICAgY29uc3QgYjQgPSBpZHggJiA0O1xuICAgICAgY29uc3QgYjIgPSBpZHggJiAyO1xuICAgICAgY29uc3QgYjEgPSBpZHggJiAxO1xuICAgICAgLy8gR2V0IHRoZSB2YWx1ZSBmcm9tIHRoZSBhcmd1bWVudCB2eCB3aGVyZSB4ID0gaWR4XG4gICAgICBjb25zdCB2YWx1ZSA9IGI0ID8gKGIxID8gdjUgOiB2NCkgOiAoYjIgPyAoYjEgPyB2MyA6IHYyKSA6IChiMSA/IHYxIDogdjApKTtcblxuICAgICAgcmVzICs9IHN0cmluZ2lmeSh2YWx1ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlcyArPSBpbnN0cnVjdGlvbnNbaV07XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHJlcztcbn1cblxuLyoqXG4gKiBDaGVja3MgaWYgdGhlIHZhbHVlcyBvZiB1cCB0byA3IGV4cHJlc3Npb25zIGhhdmUgY2hhbmdlZCBhbmQgcmVwbGFjZXMgdGhlbSBieSB0aGVpciB2YWx1ZXMgaW4gYVxuICogdHJhbnNsYXRpb24sIG9yIHJldHVybnMgTk9fQ0hBTkdFLlxuICpcbiAqIEBwYXJhbSBpbnN0cnVjdGlvbnMgQSBsaXN0IG9mIGluc3RydWN0aW9ucyB0aGF0IHdpbGwgYmUgdXNlZCB0byB0cmFuc2xhdGUgYW4gYXR0cmlidXRlLlxuICogQHBhcmFtIHYwIHZhbHVlIGNoZWNrZWQgZm9yIGNoYW5nZS5cbiAqIEBwYXJhbSB2MSB2YWx1ZSBjaGVja2VkIGZvciBjaGFuZ2UuXG4gKiBAcGFyYW0gdjIgdmFsdWUgY2hlY2tlZCBmb3IgY2hhbmdlLlxuICogQHBhcmFtIHYzIHZhbHVlIGNoZWNrZWQgZm9yIGNoYW5nZS5cbiAqIEBwYXJhbSB2NCB2YWx1ZSBjaGVja2VkIGZvciBjaGFuZ2UuXG4gKiBAcGFyYW0gdjUgdmFsdWUgY2hlY2tlZCBmb3IgY2hhbmdlLlxuICogQHBhcmFtIHY2IHZhbHVlIGNoZWNrZWQgZm9yIGNoYW5nZS5cbiAqXG4gKiBAcmV0dXJucyBUaGUgY29uY2F0ZW5hdGVkIHN0cmluZyB3aGVuIGFueSBvZiB0aGUgYXJndW1lbnRzIGNoYW5nZXMsIGBOT19DSEFOR0VgIG90aGVyd2lzZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGkxOG5JbnRlcnBvbGF0aW9uNyhcbiAgICBpbnN0cnVjdGlvbnM6IEkxOG5FeHBJbnN0cnVjdGlvbltdLCB2MDogYW55LCB2MTogYW55LCB2MjogYW55LCB2MzogYW55LCB2NDogYW55LCB2NTogYW55LFxuICAgIHY2OiBhbnkpOiBzdHJpbmd8Tk9fQ0hBTkdFIHtcbiAgY29uc3Qgdmlld0RhdGEgPSBfZ2V0Vmlld0RhdGEoKTtcbiAgbGV0IGRpZmZlcmVudCA9IGJpbmRpbmdVcGRhdGVkNCh2aWV3RGF0YVtCSU5ESU5HX0lOREVYXSwgdjAsIHYxLCB2MiwgdjMpO1xuICBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZDModmlld0RhdGFbQklORElOR19JTkRFWF0gKyA0LCB2NCwgdjUsIHY2KSB8fCBkaWZmZXJlbnQ7XG4gIHZpZXdEYXRhW0JJTkRJTkdfSU5ERVhdICs9IDc7XG5cbiAgaWYgKCFkaWZmZXJlbnQpIHtcbiAgICByZXR1cm4gTk9fQ0hBTkdFO1xuICB9XG5cbiAgbGV0IHJlcyA9ICcnO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGluc3RydWN0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgIC8vIE9kZCBpbmRleGVzIGFyZSBiaW5kaW5nc1xuICAgIGlmIChpICYgMSkge1xuICAgICAgLy8gRXh0cmFjdCBiaXRzXG4gICAgICBjb25zdCBpZHggPSBpbnN0cnVjdGlvbnNbaV0gYXMgbnVtYmVyO1xuICAgICAgY29uc3QgYjQgPSBpZHggJiA0O1xuICAgICAgY29uc3QgYjIgPSBpZHggJiAyO1xuICAgICAgY29uc3QgYjEgPSBpZHggJiAxO1xuICAgICAgLy8gR2V0IHRoZSB2YWx1ZSBmcm9tIHRoZSBhcmd1bWVudCB2eCB3aGVyZSB4ID0gaWR4XG4gICAgICBjb25zdCB2YWx1ZSA9IGI0ID8gKGIyID8gdjYgOiAoYjEgPyB2NSA6IHY0KSkgOiAoYjIgPyAoYjEgPyB2MyA6IHYyKSA6IChiMSA/IHYxIDogdjApKTtcblxuICAgICAgcmVzICs9IHN0cmluZ2lmeSh2YWx1ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlcyArPSBpbnN0cnVjdGlvbnNbaV07XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHJlcztcbn1cblxuLyoqXG4gKiBDaGVja3MgaWYgdGhlIHZhbHVlcyBvZiB1cCB0byA4IGV4cHJlc3Npb25zIGhhdmUgY2hhbmdlZCBhbmQgcmVwbGFjZXMgdGhlbSBieSB0aGVpciB2YWx1ZXMgaW4gYVxuICogdHJhbnNsYXRpb24sIG9yIHJldHVybnMgTk9fQ0hBTkdFLlxuICpcbiAqIEBwYXJhbSBpbnN0cnVjdGlvbnMgQSBsaXN0IG9mIGluc3RydWN0aW9ucyB0aGF0IHdpbGwgYmUgdXNlZCB0byB0cmFuc2xhdGUgYW4gYXR0cmlidXRlLlxuICogQHBhcmFtIHYwIHZhbHVlIGNoZWNrZWQgZm9yIGNoYW5nZS5cbiAqIEBwYXJhbSB2MSB2YWx1ZSBjaGVja2VkIGZvciBjaGFuZ2UuXG4gKiBAcGFyYW0gdjIgdmFsdWUgY2hlY2tlZCBmb3IgY2hhbmdlLlxuICogQHBhcmFtIHYzIHZhbHVlIGNoZWNrZWQgZm9yIGNoYW5nZS5cbiAqIEBwYXJhbSB2NCB2YWx1ZSBjaGVja2VkIGZvciBjaGFuZ2UuXG4gKiBAcGFyYW0gdjUgdmFsdWUgY2hlY2tlZCBmb3IgY2hhbmdlLlxuICogQHBhcmFtIHY2IHZhbHVlIGNoZWNrZWQgZm9yIGNoYW5nZS5cbiAqIEBwYXJhbSB2NyB2YWx1ZSBjaGVja2VkIGZvciBjaGFuZ2UuXG4gKlxuICogQHJldHVybnMgVGhlIGNvbmNhdGVuYXRlZCBzdHJpbmcgd2hlbiBhbnkgb2YgdGhlIGFyZ3VtZW50cyBjaGFuZ2VzLCBgTk9fQ0hBTkdFYCBvdGhlcndpc2UuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpMThuSW50ZXJwb2xhdGlvbjgoXG4gICAgaW5zdHJ1Y3Rpb25zOiBJMThuRXhwSW5zdHJ1Y3Rpb25bXSwgdjA6IGFueSwgdjE6IGFueSwgdjI6IGFueSwgdjM6IGFueSwgdjQ6IGFueSwgdjU6IGFueSxcbiAgICB2NjogYW55LCB2NzogYW55KTogc3RyaW5nfE5PX0NIQU5HRSB7XG4gIGNvbnN0IHZpZXdEYXRhID0gX2dldFZpZXdEYXRhKCk7XG4gIGxldCBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZDQodmlld0RhdGFbQklORElOR19JTkRFWF0sIHYwLCB2MSwgdjIsIHYzKTtcbiAgZGlmZmVyZW50ID0gYmluZGluZ1VwZGF0ZWQ0KHZpZXdEYXRhW0JJTkRJTkdfSU5ERVhdICsgNCwgdjQsIHY1LCB2NiwgdjcpIHx8IGRpZmZlcmVudDtcbiAgdmlld0RhdGFbQklORElOR19JTkRFWF0gKz0gODtcblxuICBpZiAoIWRpZmZlcmVudCkge1xuICAgIHJldHVybiBOT19DSEFOR0U7XG4gIH1cblxuICBsZXQgcmVzID0gJyc7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgaW5zdHJ1Y3Rpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgLy8gT2RkIGluZGV4ZXMgYXJlIGJpbmRpbmdzXG4gICAgaWYgKGkgJiAxKSB7XG4gICAgICAvLyBFeHRyYWN0IGJpdHNcbiAgICAgIGNvbnN0IGlkeCA9IGluc3RydWN0aW9uc1tpXSBhcyBudW1iZXI7XG4gICAgICBjb25zdCBiNCA9IGlkeCAmIDQ7XG4gICAgICBjb25zdCBiMiA9IGlkeCAmIDI7XG4gICAgICBjb25zdCBiMSA9IGlkeCAmIDE7XG4gICAgICAvLyBHZXQgdGhlIHZhbHVlIGZyb20gdGhlIGFyZ3VtZW50IHZ4IHdoZXJlIHggPSBpZHhcbiAgICAgIGNvbnN0IHZhbHVlID1cbiAgICAgICAgICBiNCA/IChiMiA/IChiMSA/IHY3IDogdjYpIDogKGIxID8gdjUgOiB2NCkpIDogKGIyID8gKGIxID8gdjMgOiB2MikgOiAoYjEgPyB2MSA6IHYwKSk7XG5cbiAgICAgIHJlcyArPSBzdHJpbmdpZnkodmFsdWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXMgKz0gaW5zdHJ1Y3Rpb25zW2ldO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiByZXM7XG59XG5cbi8qKlxuICogQ3JlYXRlIGEgdHJhbnNsYXRlZCBpbnRlcnBvbGF0aW9uIGJpbmRpbmcgd2l0aCBhIHZhcmlhYmxlIG51bWJlciBvZiBleHByZXNzaW9ucy5cbiAqXG4gKiBJZiB0aGVyZSBhcmUgMSB0byA4IGV4cHJlc3Npb25zIHRoZW4gYGkxOG5JbnRlcnBvbGF0aW9uKClgIHNob3VsZCBiZSB1c2VkIGluc3RlYWQuIEl0IGlzIGZhc3RlclxuICogYmVjYXVzZSB0aGVyZSBpcyBubyBuZWVkIHRvIGNyZWF0ZSBhbiBhcnJheSBvZiBleHByZXNzaW9ucyBhbmQgaXRlcmF0ZSBvdmVyIGl0LlxuICpcbiAqIEByZXR1cm5zIFRoZSBjb25jYXRlbmF0ZWQgc3RyaW5nIHdoZW4gYW55IG9mIHRoZSBhcmd1bWVudHMgY2hhbmdlcywgYE5PX0NIQU5HRWAgb3RoZXJ3aXNlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gaTE4bkludGVycG9sYXRpb25WKGluc3RydWN0aW9uczogSTE4bkV4cEluc3RydWN0aW9uW10sIHZhbHVlczogYW55W10pOiBzdHJpbmd8XG4gICAgTk9fQ0hBTkdFIHtcbiAgY29uc3Qgdmlld0RhdGEgPSBfZ2V0Vmlld0RhdGEoKTtcbiAgbGV0IGRpZmZlcmVudCA9IGZhbHNlO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IHZhbHVlcy5sZW5ndGg7IGkrKykge1xuICAgIC8vIENoZWNrIGlmIGJpbmRpbmdzIGhhdmUgY2hhbmdlZFxuICAgIGJpbmRpbmdVcGRhdGVkKHZpZXdEYXRhW0JJTkRJTkdfSU5ERVhdKyssIHZhbHVlc1tpXSkgJiYgKGRpZmZlcmVudCA9IHRydWUpO1xuICB9XG5cbiAgaWYgKCFkaWZmZXJlbnQpIHtcbiAgICByZXR1cm4gTk9fQ0hBTkdFO1xuICB9XG5cbiAgbGV0IHJlcyA9ICcnO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGluc3RydWN0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgIC8vIE9kZCBpbmRleGVzIGFyZSBwbGFjZWhvbGRlcnNcbiAgICBpZiAoaSAmIDEpIHtcbiAgICAgIHJlcyArPSBzdHJpbmdpZnkodmFsdWVzW2luc3RydWN0aW9uc1tpXSBhcyBudW1iZXJdKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmVzICs9IGluc3RydWN0aW9uc1tpXTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gcmVzO1xufVxuIl19