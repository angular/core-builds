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
import { NO_CHANGE, _getViewData, adjustBlueprintForNewNode, bindingUpdated, bindingUpdated2, bindingUpdated3, bindingUpdated4, createNodeAtIndex, getRenderer, getTNode, load, loadElement, resetComponentState } from './instructions';
import { RENDER_PARENT } from './interfaces/container';
import { BINDING_INDEX, HEADER_OFFSET, HOST_NODE, TVIEW } from './interfaces/view';
import { appendChild, createTextNode, removeChild } from './node_manipulation';
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
 * @param {?} tNode
 * @param {?} parentTNode
 * @param {?} previousTNode
 * @return {?}
 */
function appendI18nNode(node, tNode, parentTNode, previousTNode) {
    if (ngDevMode) {
        ngDevMode.rendererMoveNode++;
    }
    /** @type {?} */
    const viewData = _getViewData();
    /** @type {?} */
    const firstTemplatePass = viewData[TVIEW].firstTemplatePass;
    if (firstTemplatePass) {
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
            tNode.parent = /** @type {?} */ (parentTNode);
        }
    }
    appendChild(node.native, tNode, viewData);
    // Template containers also have a comment node for the `ViewContainerRef` that should be moved
    if (tNode.type === 0 /* Container */ && node.dynamicLContainerNode) {
        appendChild(node.dynamicLContainerNode.native, tNode, viewData);
        return /** @type {?} */ ((tNode.dynamicContainerNode));
    }
    return tNode;
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
    const startTNode = getTNode(startIndex);
    /** @type {?} */
    let localParentTNode = startTNode.parent || /** @type {?} */ ((viewData[HOST_NODE]));
    /** @type {?} */
    let localPreviousTNode = localParentTNode;
    resetComponentState(); // We don't want to add to the tree with the wrong previous node
    for (let i = 0; i < instructions.length; i++) {
        /** @type {?} */
        const instruction = /** @type {?} */ (instructions[i]);
        switch (instruction & -536870912 /* InstructionMask */) {
            case 1073741824 /* Element */:
                /** @type {?} */
                const elementIndex = instruction & 536870911 /* IndexMask */;
                /** @type {?} */
                const element = load(elementIndex);
                /** @type {?} */
                const elementTNode = getTNode(elementIndex);
                localPreviousTNode =
                    appendI18nNode(element, elementTNode, localParentTNode, localPreviousTNode);
                localParentTNode = elementTNode;
                break;
            case 1610612736 /* Expression */:
            case -2147483648 /* TemplateRoot */:
            case -1610612736 /* Any */:
                /** @type {?} */
                const nodeIndex = instruction & 536870911 /* IndexMask */;
                /** @type {?} */
                const node = load(nodeIndex);
                localPreviousTNode =
                    appendI18nNode(node, getTNode(nodeIndex), localParentTNode, localPreviousTNode);
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
                // createNodeAtIndex takes a raw index (not adjusted by header offset).
                adjustBlueprintForNewNode(viewData);
                /** @type {?} */
                const lastNodeIndex = viewData.length - 1 - HEADER_OFFSET;
                /** @type {?} */
                const textTNode = createNodeAtIndex(lastNodeIndex, 3 /* Element */, textRNode, null, null);
                localPreviousTNode = appendI18nNode(loadElement(lastNodeIndex), textTNode, localParentTNode, localPreviousTNode);
                resetComponentState();
                break;
            case -1073741824 /* CloseNode */:
                localPreviousTNode = localParentTNode;
                localParentTNode = localParentTNode.parent || /** @type {?} */ ((viewData[HOST_NODE]));
                break;
            case -536870912 /* RemoveNode */:
                if (ngDevMode) {
                    ngDevMode.rendererRemoveNode++;
                }
                /** @type {?} */
                const removeIndex = instruction & 536870911 /* IndexMask */;
                /** @type {?} */
                const removedNode = load(removeIndex);
                /** @type {?} */
                const removedTNode = getTNode(removeIndex);
                removeChild(removedTNode, removedNode.native || null, viewData);
                // For template containers we also need to remove their `ViewContainerRef` from the DOM
                if (removedTNode.type === 0 /* Container */ && removedNode.dynamicLContainerNode) {
                    removeChild(removedTNode, removedNode.dynamicLContainerNode.native || null, viewData); /** @type {?} */
                    ((removedTNode.dynamicContainerNode)).detached = true;
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaTE4bi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaTE4bi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQVFBLE9BQU8sRUFBQyxXQUFXLEVBQUUsY0FBYyxFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQ3JELE9BQU8sRUFBQyxTQUFTLEVBQUUsWUFBWSxFQUFFLHlCQUF5QixFQUFFLGNBQWMsRUFBRSxlQUFlLEVBQUUsZUFBZSxFQUFFLGVBQWUsRUFBRSxpQkFBaUIsRUFBRSxXQUFXLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxXQUFXLEVBQUUsbUJBQW1CLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUN2TyxPQUFPLEVBQUMsYUFBYSxFQUFDLE1BQU0sd0JBQXdCLENBQUM7QUFFckQsT0FBTyxFQUFDLGFBQWEsRUFBRSxhQUFhLEVBQUUsU0FBUyxFQUFFLEtBQUssRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQ2pGLE9BQU8sRUFBQyxXQUFXLEVBQUUsY0FBYyxFQUFFLFdBQVcsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBQzdFLE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxRQUFRLENBQUM7OztJQU8vQixlQUFjO0lBQ2QsbUJBQWlCO0lBQ2pCLHNCQUFvQjtJQUNwQix5QkFBc0I7SUFDdEIsZ0JBQWE7SUFDYixzQkFBbUI7SUFDbkIsc0JBQW9COztJQUVwQixvQkFBeUI7O0lBRXpCLDJCQUFrQzs7Ozs7Ozs7Ozs7OztBQW1CcEMsTUFBTSxZQUFZLEdBQUcsY0FBYyxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBdUJwQyxNQUFNLFVBQVUsV0FBVyxDQUN2QixXQUFtQixFQUFFLFFBQTBDLEVBQy9ELFdBQThDLEVBQUUsYUFBK0IsRUFDL0UsY0FBOEI7O0lBQ2hDLE1BQU0sZ0JBQWdCLEdBQUcsV0FBVyxDQUFDLEtBQUssQ0FBQyxZQUFZLENB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UUFDZCxPQUFPLFNBQVMsQ0FBQztLQUNsQjs7SUFFRCxJQUFJLEdBQUcsR0FBRyxFQUFFLENBQUM7SUFDYixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsWUFBWSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTs7UUFFNUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFO1lBQ1QsR0FBRyxJQUFJLFNBQVMsQ0FBQyxNQUFNLG1CQUFDLFlBQVksQ0FBQyxDQUFDLENBQVcsRUFBQyxDQUFDLENBQUM7U0FDckQ7YUFBTTtZQUNMLEdBQUcsSUFBSSxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUM7U0FDeEI7S0FDRjtJQUVELE9BQU8sR0FBRyxDQUFDO0NBQ1oiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7YXNzZXJ0RXF1YWwsIGFzc2VydExlc3NUaGFufSBmcm9tICcuL2Fzc2VydCc7XG5pbXBvcnQge05PX0NIQU5HRSwgX2dldFZpZXdEYXRhLCBhZGp1c3RCbHVlcHJpbnRGb3JOZXdOb2RlLCBiaW5kaW5nVXBkYXRlZCwgYmluZGluZ1VwZGF0ZWQyLCBiaW5kaW5nVXBkYXRlZDMsIGJpbmRpbmdVcGRhdGVkNCwgY3JlYXRlTm9kZUF0SW5kZXgsIGdldFJlbmRlcmVyLCBnZXRUTm9kZSwgbG9hZCwgbG9hZEVsZW1lbnQsIHJlc2V0Q29tcG9uZW50U3RhdGV9IGZyb20gJy4vaW5zdHJ1Y3Rpb25zJztcbmltcG9ydCB7UkVOREVSX1BBUkVOVH0gZnJvbSAnLi9pbnRlcmZhY2VzL2NvbnRhaW5lcic7XG5pbXBvcnQge0xDb250YWluZXJOb2RlLCBMTm9kZSwgVEVsZW1lbnROb2RlLCBUTm9kZSwgVE5vZGVUeXBlfSBmcm9tICcuL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge0JJTkRJTkdfSU5ERVgsIEhFQURFUl9PRkZTRVQsIEhPU1RfTk9ERSwgVFZJRVd9IGZyb20gJy4vaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7YXBwZW5kQ2hpbGQsIGNyZWF0ZVRleHROb2RlLCByZW1vdmVDaGlsZH0gZnJvbSAnLi9ub2RlX21hbmlwdWxhdGlvbic7XG5pbXBvcnQge3N0cmluZ2lmeX0gZnJvbSAnLi91dGlsJztcblxuLyoqXG4gKiBBIGxpc3Qgb2YgZmxhZ3MgdG8gZW5jb2RlIHRoZSBpMThuIGluc3RydWN0aW9ucyB1c2VkIHRvIHRyYW5zbGF0ZSB0aGUgdGVtcGxhdGUuXG4gKiBXZSBzaGlmdCB0aGUgZmxhZ3MgYnkgMjkgc28gdGhhdCAzMCAmIDMxICYgMzIgYml0cyBjb250YWlucyB0aGUgaW5zdHJ1Y3Rpb25zLlxuICovXG5leHBvcnQgY29uc3QgZW51bSBJMThuSW5zdHJ1Y3Rpb25zIHtcbiAgVGV4dCA9IDEgPDwgMjksXG4gIEVsZW1lbnQgPSAyIDw8IDI5LFxuICBFeHByZXNzaW9uID0gMyA8PCAyOSxcbiAgVGVtcGxhdGVSb290ID0gNCA8PCAyOSxcbiAgQW55ID0gNSA8PCAyOSxcbiAgQ2xvc2VOb2RlID0gNiA8PCAyOSxcbiAgUmVtb3ZlTm9kZSA9IDcgPDwgMjksXG4gIC8qKiBVc2VkIHRvIGRlY29kZSB0aGUgbnVtYmVyIGVuY29kZWQgd2l0aCB0aGUgaW5zdHJ1Y3Rpb24uICovXG4gIEluZGV4TWFzayA9ICgxIDw8IDI5KSAtIDEsXG4gIC8qKiBVc2VkIHRvIHRlc3QgdGhlIHR5cGUgb2YgaW5zdHJ1Y3Rpb24uICovXG4gIEluc3RydWN0aW9uTWFzayA9IH4oKDEgPDwgMjkpIC0gMSksXG59XG5cbi8qKlxuICogUmVwcmVzZW50cyB0aGUgaW5zdHJ1Y3Rpb25zIHVzZWQgdG8gdHJhbnNsYXRlIHRoZSB0ZW1wbGF0ZS5cbiAqIEluc3RydWN0aW9ucyBjYW4gYmUgYSBwbGFjZWhvbGRlciBpbmRleCwgYSBzdGF0aWMgdGV4dCBvciBhIHNpbXBsZSBiaXQgZmllbGQgKGBJMThuRmxhZ2ApLlxuICogV2hlbiB0aGUgaW5zdHJ1Y3Rpb24gaXMgdGhlIGZsYWcgYFRleHRgLCBpdCBpcyBhbHdheXMgZm9sbG93ZWQgYnkgaXRzIHRleHQgdmFsdWUuXG4gKi9cbmV4cG9ydCB0eXBlIEkxOG5JbnN0cnVjdGlvbiA9IG51bWJlciB8IHN0cmluZztcbi8qKlxuICogUmVwcmVzZW50cyB0aGUgaW5zdHJ1Y3Rpb25zIHVzZWQgdG8gdHJhbnNsYXRlIGF0dHJpYnV0ZXMgY29udGFpbmluZyBleHByZXNzaW9ucy5cbiAqIEV2ZW4gaW5kZXhlcyBjb250YWluIHN0YXRpYyBzdHJpbmdzLCB3aGlsZSBvZGQgaW5kZXhlcyBjb250YWluIHRoZSBpbmRleCBvZiB0aGUgZXhwcmVzc2lvbiB3aG9zZVxuICogdmFsdWUgd2lsbCBiZSBjb25jYXRlbmF0ZWQgaW50byB0aGUgZmluYWwgdHJhbnNsYXRpb24uXG4gKi9cbmV4cG9ydCB0eXBlIEkxOG5FeHBJbnN0cnVjdGlvbiA9IG51bWJlciB8IHN0cmluZztcbi8qKiBNYXBwaW5nIG9mIHBsYWNlaG9sZGVyIG5hbWVzIHRvIHRoZWlyIGFic29sdXRlIGluZGV4ZXMgaW4gdGhlaXIgdGVtcGxhdGVzLiAqL1xuZXhwb3J0IHR5cGUgUGxhY2Vob2xkZXJNYXAgPSB7XG4gIFtuYW1lOiBzdHJpbmddOiBudW1iZXJcbn07XG5jb25zdCBpMThuVGFnUmVnZXggPSAve1xcJChbXn1dKyl9L2c7XG5cbi8qKlxuICogVGFrZXMgYSB0cmFuc2xhdGlvbiBzdHJpbmcsIHRoZSBpbml0aWFsIGxpc3Qgb2YgcGxhY2Vob2xkZXJzIChlbGVtZW50cyBhbmQgZXhwcmVzc2lvbnMpIGFuZCB0aGVcbiAqIGluZGV4ZXMgb2YgdGhlaXIgY29ycmVzcG9uZGluZyBleHByZXNzaW9uIG5vZGVzIHRvIHJldHVybiBhIGxpc3Qgb2YgaW5zdHJ1Y3Rpb25zIGZvciBlYWNoXG4gKiB0ZW1wbGF0ZSBmdW5jdGlvbi5cbiAqXG4gKiBCZWNhdXNlIGVtYmVkZGVkIHRlbXBsYXRlcyBoYXZlIGRpZmZlcmVudCBpbmRleGVzIGZvciBlYWNoIHBsYWNlaG9sZGVyLCBlYWNoIHBhcmFtZXRlciAoZXhjZXB0XG4gKiB0aGUgdHJhbnNsYXRpb24pIGlzIGFuIGFycmF5LCB3aGVyZSBlYWNoIHZhbHVlIGNvcnJlc3BvbmRzIHRvIGEgZGlmZmVyZW50IHRlbXBsYXRlLCBieSBvcmRlciBvZlxuICogYXBwZWFyYW5jZS5cbiAqXG4gKiBAcGFyYW0gdHJhbnNsYXRpb24gQSB0cmFuc2xhdGlvbiBzdHJpbmcgd2hlcmUgcGxhY2Vob2xkZXJzIGFyZSByZXByZXNlbnRlZCBieSBgeyRuYW1lfWBcbiAqIEBwYXJhbSBlbGVtZW50cyBBbiBhcnJheSBjb250YWluaW5nLCBmb3IgZWFjaCB0ZW1wbGF0ZSwgdGhlIG1hcHMgb2YgZWxlbWVudCBwbGFjZWhvbGRlcnMgYW5kXG4gKiB0aGVpciBpbmRleGVzLlxuICogQHBhcmFtIGV4cHJlc3Npb25zIEFuIGFycmF5IGNvbnRhaW5pbmcsIGZvciBlYWNoIHRlbXBsYXRlLCB0aGUgbWFwcyBvZiBleHByZXNzaW9uIHBsYWNlaG9sZGVyc1xuICogYW5kIHRoZWlyIGluZGV4ZXMuXG4gKiBAcGFyYW0gdGVtcGxhdGVSb290cyBBbiBhcnJheSBvZiB0ZW1wbGF0ZSByb290cyB3aG9zZSBjb250ZW50IHNob3VsZCBiZSBpZ25vcmVkIHdoZW5cbiAqIGdlbmVyYXRpbmcgdGhlIGluc3RydWN0aW9ucyBmb3IgdGhlaXIgcGFyZW50IHRlbXBsYXRlLlxuICogQHBhcmFtIGxhc3RDaGlsZEluZGV4IFRoZSBpbmRleCBvZiB0aGUgbGFzdCBjaGlsZCBvZiB0aGUgaTE4biBub2RlLiBVc2VkIHdoZW4gdGhlIGkxOG4gYmxvY2sgaXNcbiAqIGFuIG5nLWNvbnRhaW5lci5cbiAqXG4gKiBAcmV0dXJucyBBIGxpc3Qgb2YgaW5zdHJ1Y3Rpb25zIHVzZWQgdG8gdHJhbnNsYXRlIGVhY2ggdGVtcGxhdGUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpMThuTWFwcGluZyhcbiAgICB0cmFuc2xhdGlvbjogc3RyaW5nLCBlbGVtZW50czogKFBsYWNlaG9sZGVyTWFwIHwgbnVsbClbXSB8IG51bGwsXG4gICAgZXhwcmVzc2lvbnM/OiAoUGxhY2Vob2xkZXJNYXAgfCBudWxsKVtdIHwgbnVsbCwgdGVtcGxhdGVSb290cz86IHN0cmluZ1tdIHwgbnVsbCxcbiAgICBsYXN0Q2hpbGRJbmRleD86IG51bWJlciB8IG51bGwpOiBJMThuSW5zdHJ1Y3Rpb25bXVtdIHtcbiAgY29uc3QgdHJhbnNsYXRpb25QYXJ0cyA9IHRyYW5zbGF0aW9uLnNwbGl0KGkxOG5UYWdSZWdleCk7XG4gIGNvbnN0IG5iVGVtcGxhdGVzID0gdGVtcGxhdGVSb290cyA/IHRlbXBsYXRlUm9vdHMubGVuZ3RoICsgMSA6IDE7XG4gIGNvbnN0IGluc3RydWN0aW9uczogSTE4bkluc3RydWN0aW9uW11bXSA9IChuZXcgQXJyYXkobmJUZW1wbGF0ZXMpKS5maWxsKHVuZGVmaW5lZCk7XG5cbiAgZ2VuZXJhdGVNYXBwaW5nSW5zdHJ1Y3Rpb25zKFxuICAgICAgMCwgMCwgdHJhbnNsYXRpb25QYXJ0cywgaW5zdHJ1Y3Rpb25zLCBlbGVtZW50cywgZXhwcmVzc2lvbnMsIHRlbXBsYXRlUm9vdHMsIGxhc3RDaGlsZEluZGV4KTtcblxuICByZXR1cm4gaW5zdHJ1Y3Rpb25zO1xufVxuXG4vKipcbiAqIEludGVybmFsIGZ1bmN0aW9uIHRoYXQgcmVhZHMgdGhlIHRyYW5zbGF0aW9uIHBhcnRzIGFuZCBnZW5lcmF0ZXMgYSBzZXQgb2YgaW5zdHJ1Y3Rpb25zIGZvciBlYWNoXG4gKiB0ZW1wbGF0ZS5cbiAqXG4gKiBTZWUgYGkxOG5NYXBwaW5nKClgIGZvciBtb3JlIGRldGFpbHMuXG4gKlxuICogQHBhcmFtIHRtcGxJbmRleCBUaGUgb3JkZXIgb2YgYXBwZWFyYW5jZSBvZiB0aGUgdGVtcGxhdGUuXG4gKiAwIGZvciB0aGUgcm9vdCB0ZW1wbGF0ZSwgZm9sbG93aW5nIGluZGV4ZXMgbWF0Y2ggdGhlIG9yZGVyIGluIGB0ZW1wbGF0ZVJvb3RzYC5cbiAqIEBwYXJhbSBwYXJ0SW5kZXggVGhlIGN1cnJlbnQgaW5kZXggaW4gYHRyYW5zbGF0aW9uUGFydHNgLlxuICogQHBhcmFtIHRyYW5zbGF0aW9uUGFydHMgVGhlIHRyYW5zbGF0aW9uIHN0cmluZyBzcGxpdCBpbnRvIGFuIGFycmF5IG9mIHBsYWNlaG9sZGVycyBhbmQgdGV4dFxuICogZWxlbWVudHMuXG4gKiBAcGFyYW0gaW5zdHJ1Y3Rpb25zIFRoZSBjdXJyZW50IGxpc3Qgb2YgaW5zdHJ1Y3Rpb25zIHRvIHVwZGF0ZS5cbiAqIEBwYXJhbSBlbGVtZW50cyBBbiBhcnJheSBjb250YWluaW5nLCBmb3IgZWFjaCB0ZW1wbGF0ZSwgdGhlIG1hcHMgb2YgZWxlbWVudCBwbGFjZWhvbGRlcnMgYW5kXG4gKiB0aGVpciBpbmRleGVzLlxuICogQHBhcmFtIGV4cHJlc3Npb25zIEFuIGFycmF5IGNvbnRhaW5pbmcsIGZvciBlYWNoIHRlbXBsYXRlLCB0aGUgbWFwcyBvZiBleHByZXNzaW9uIHBsYWNlaG9sZGVyc1xuICogYW5kIHRoZWlyIGluZGV4ZXMuXG4gKiBAcGFyYW0gdGVtcGxhdGVSb290cyBBbiBhcnJheSBvZiB0ZW1wbGF0ZSByb290cyB3aG9zZSBjb250ZW50IHNob3VsZCBiZSBpZ25vcmVkIHdoZW5cbiAqIGdlbmVyYXRpbmcgdGhlIGluc3RydWN0aW9ucyBmb3IgdGhlaXIgcGFyZW50IHRlbXBsYXRlLlxuICogQHBhcmFtIGxhc3RDaGlsZEluZGV4IFRoZSBpbmRleCBvZiB0aGUgbGFzdCBjaGlsZCBvZiB0aGUgaTE4biBub2RlLiBVc2VkIHdoZW4gdGhlIGkxOG4gYmxvY2sgaXNcbiAqIGFuIG5nLWNvbnRhaW5lci5cbiAqXG4gKiBAcmV0dXJucyB0aGUgY3VycmVudCBpbmRleCBpbiBgdHJhbnNsYXRpb25QYXJ0c2BcbiAqL1xuZnVuY3Rpb24gZ2VuZXJhdGVNYXBwaW5nSW5zdHJ1Y3Rpb25zKFxuICAgIHRtcGxJbmRleDogbnVtYmVyLCBwYXJ0SW5kZXg6IG51bWJlciwgdHJhbnNsYXRpb25QYXJ0czogc3RyaW5nW10sXG4gICAgaW5zdHJ1Y3Rpb25zOiBJMThuSW5zdHJ1Y3Rpb25bXVtdLCBlbGVtZW50czogKFBsYWNlaG9sZGVyTWFwIHwgbnVsbClbXSB8IG51bGwsXG4gICAgZXhwcmVzc2lvbnM/OiAoUGxhY2Vob2xkZXJNYXAgfCBudWxsKVtdIHwgbnVsbCwgdGVtcGxhdGVSb290cz86IHN0cmluZ1tdIHwgbnVsbCxcbiAgICBsYXN0Q2hpbGRJbmRleD86IG51bWJlciB8IG51bGwpOiBudW1iZXIge1xuICBjb25zdCB0bXBsSW5zdHJ1Y3Rpb25zOiBJMThuSW5zdHJ1Y3Rpb25bXSA9IFtdO1xuICBjb25zdCBwaFZpc2l0ZWQ6IHN0cmluZ1tdID0gW107XG4gIGxldCBvcGVuZWRUYWdDb3VudCA9IDA7XG4gIGxldCBtYXhJbmRleCA9IDA7XG4gIGxldCBjdXJyZW50RWxlbWVudHM6IFBsYWNlaG9sZGVyTWFwfG51bGwgPVxuICAgICAgZWxlbWVudHMgJiYgZWxlbWVudHNbdG1wbEluZGV4XSA/IGVsZW1lbnRzW3RtcGxJbmRleF0gOiBudWxsO1xuICBsZXQgY3VycmVudEV4cHJlc3Npb25zOiBQbGFjZWhvbGRlck1hcHxudWxsID1cbiAgICAgIGV4cHJlc3Npb25zICYmIGV4cHJlc3Npb25zW3RtcGxJbmRleF0gPyBleHByZXNzaW9uc1t0bXBsSW5kZXhdIDogbnVsbDtcblxuICBpbnN0cnVjdGlvbnNbdG1wbEluZGV4XSA9IHRtcGxJbnN0cnVjdGlvbnM7XG5cbiAgZm9yICg7IHBhcnRJbmRleCA8IHRyYW5zbGF0aW9uUGFydHMubGVuZ3RoOyBwYXJ0SW5kZXgrKykge1xuICAgIC8vIFRoZSB2YWx1ZSBjYW4gZWl0aGVyIGJlIHRleHQgb3IgdGhlIG5hbWUgb2YgYSBwbGFjZWhvbGRlciAoZWxlbWVudC90ZW1wbGF0ZSByb290L2V4cHJlc3Npb24pXG4gICAgY29uc3QgdmFsdWUgPSB0cmFuc2xhdGlvblBhcnRzW3BhcnRJbmRleF07XG5cbiAgICAvLyBPZGQgaW5kZXhlcyBhcmUgcGxhY2Vob2xkZXJzXG4gICAgaWYgKHBhcnRJbmRleCAmIDEpIHtcbiAgICAgIGxldCBwaEluZGV4O1xuICAgICAgaWYgKGN1cnJlbnRFbGVtZW50cyAmJiBjdXJyZW50RWxlbWVudHNbdmFsdWVdICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcGhJbmRleCA9IGN1cnJlbnRFbGVtZW50c1t2YWx1ZV07XG4gICAgICAgIC8vIFRoZSBwbGFjZWhvbGRlciByZXByZXNlbnRzIGEgRE9NIGVsZW1lbnQsIGFkZCBhbiBpbnN0cnVjdGlvbiB0byBtb3ZlIGl0XG4gICAgICAgIGxldCB0ZW1wbGF0ZVJvb3RJbmRleCA9IHRlbXBsYXRlUm9vdHMgPyB0ZW1wbGF0ZVJvb3RzLmluZGV4T2YodmFsdWUpIDogLTE7XG4gICAgICAgIGlmICh0ZW1wbGF0ZVJvb3RJbmRleCAhPT0gLTEgJiYgKHRlbXBsYXRlUm9vdEluZGV4ICsgMSkgIT09IHRtcGxJbmRleCkge1xuICAgICAgICAgIC8vIFRoaXMgaXMgYSB0ZW1wbGF0ZSByb290LCBpdCBoYXMgbm8gY2xvc2luZyB0YWcsIG5vdCB0cmVhdGluZyBpdCBhcyBhbiBlbGVtZW50XG4gICAgICAgICAgdG1wbEluc3RydWN0aW9ucy5wdXNoKHBoSW5kZXggfCBJMThuSW5zdHJ1Y3Rpb25zLlRlbXBsYXRlUm9vdCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdG1wbEluc3RydWN0aW9ucy5wdXNoKHBoSW5kZXggfCBJMThuSW5zdHJ1Y3Rpb25zLkVsZW1lbnQpO1xuICAgICAgICAgIG9wZW5lZFRhZ0NvdW50Kys7XG4gICAgICAgIH1cbiAgICAgICAgcGhWaXNpdGVkLnB1c2godmFsdWUpO1xuICAgICAgfSBlbHNlIGlmIChjdXJyZW50RXhwcmVzc2lvbnMgJiYgY3VycmVudEV4cHJlc3Npb25zW3ZhbHVlXSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHBoSW5kZXggPSBjdXJyZW50RXhwcmVzc2lvbnNbdmFsdWVdO1xuICAgICAgICAvLyBUaGUgcGxhY2Vob2xkZXIgcmVwcmVzZW50cyBhbiBleHByZXNzaW9uLCBhZGQgYW4gaW5zdHJ1Y3Rpb24gdG8gbW92ZSBpdFxuICAgICAgICB0bXBsSW5zdHJ1Y3Rpb25zLnB1c2gocGhJbmRleCB8IEkxOG5JbnN0cnVjdGlvbnMuRXhwcmVzc2lvbik7XG4gICAgICAgIHBoVmlzaXRlZC5wdXNoKHZhbHVlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIEl0IGlzIGEgY2xvc2luZyB0YWdcbiAgICAgICAgdG1wbEluc3RydWN0aW9ucy5wdXNoKEkxOG5JbnN0cnVjdGlvbnMuQ2xvc2VOb2RlKTtcblxuICAgICAgICBpZiAodG1wbEluZGV4ID4gMCkge1xuICAgICAgICAgIG9wZW5lZFRhZ0NvdW50LS07XG5cbiAgICAgICAgICAvLyBJZiB3ZSBoYXZlIHJlYWNoZWQgdGhlIGNsb3NpbmcgdGFnIGZvciB0aGlzIHRlbXBsYXRlLCBleGl0IHRoZSBsb29wXG4gICAgICAgICAgaWYgKG9wZW5lZFRhZ0NvdW50ID09PSAwKSB7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKHBoSW5kZXggIT09IHVuZGVmaW5lZCAmJiBwaEluZGV4ID4gbWF4SW5kZXgpIHtcbiAgICAgICAgbWF4SW5kZXggPSBwaEluZGV4O1xuICAgICAgfVxuXG4gICAgICBpZiAodGVtcGxhdGVSb290cykge1xuICAgICAgICBjb25zdCBuZXdUbXBsSW5kZXggPSB0ZW1wbGF0ZVJvb3RzLmluZGV4T2YodmFsdWUpICsgMTtcbiAgICAgICAgaWYgKG5ld1RtcGxJbmRleCAhPT0gMCAmJiBuZXdUbXBsSW5kZXggIT09IHRtcGxJbmRleCkge1xuICAgICAgICAgIHBhcnRJbmRleCA9IGdlbmVyYXRlTWFwcGluZ0luc3RydWN0aW9ucyhcbiAgICAgICAgICAgICAgbmV3VG1wbEluZGV4LCBwYXJ0SW5kZXgsIHRyYW5zbGF0aW9uUGFydHMsIGluc3RydWN0aW9ucywgZWxlbWVudHMsIGV4cHJlc3Npb25zLFxuICAgICAgICAgICAgICB0ZW1wbGF0ZVJvb3RzLCBsYXN0Q2hpbGRJbmRleCk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgIH0gZWxzZSBpZiAodmFsdWUpIHtcbiAgICAgIC8vIEl0J3MgYSBub24tZW1wdHkgc3RyaW5nLCBjcmVhdGUgYSB0ZXh0IG5vZGVcbiAgICAgIHRtcGxJbnN0cnVjdGlvbnMucHVzaChJMThuSW5zdHJ1Y3Rpb25zLlRleHQsIHZhbHVlKTtcbiAgICB9XG4gIH1cblxuICAvLyBBZGQgaW5zdHJ1Y3Rpb25zIHRvIHJlbW92ZSBlbGVtZW50cyB0aGF0IGFyZSBub3QgdXNlZCBpbiB0aGUgdHJhbnNsYXRpb25cbiAgaWYgKGVsZW1lbnRzKSB7XG4gICAgY29uc3QgdG1wbEVsZW1lbnRzID0gZWxlbWVudHNbdG1wbEluZGV4XTtcblxuICAgIGlmICh0bXBsRWxlbWVudHMpIHtcbiAgICAgIGNvbnN0IHBoS2V5cyA9IE9iamVjdC5rZXlzKHRtcGxFbGVtZW50cyk7XG5cbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcGhLZXlzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IHBoID0gcGhLZXlzW2ldO1xuXG4gICAgICAgIGlmIChwaFZpc2l0ZWQuaW5kZXhPZihwaCkgPT09IC0xKSB7XG4gICAgICAgICAgbGV0IGluZGV4ID0gdG1wbEVsZW1lbnRzW3BoXTtcbiAgICAgICAgICAvLyBBZGQgYW4gaW5zdHJ1Y3Rpb24gdG8gcmVtb3ZlIHRoZSBlbGVtZW50XG4gICAgICAgICAgdG1wbEluc3RydWN0aW9ucy5wdXNoKGluZGV4IHwgSTE4bkluc3RydWN0aW9ucy5SZW1vdmVOb2RlKTtcblxuICAgICAgICAgIGlmIChpbmRleCA+IG1heEluZGV4KSB7XG4gICAgICAgICAgICBtYXhJbmRleCA9IGluZGV4O1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8vIEFkZCBpbnN0cnVjdGlvbnMgdG8gcmVtb3ZlIGV4cHJlc3Npb25zIHRoYXQgYXJlIG5vdCB1c2VkIGluIHRoZSB0cmFuc2xhdGlvblxuICBpZiAoZXhwcmVzc2lvbnMpIHtcbiAgICBjb25zdCB0bXBsRXhwcmVzc2lvbnMgPSBleHByZXNzaW9uc1t0bXBsSW5kZXhdO1xuXG4gICAgaWYgKHRtcGxFeHByZXNzaW9ucykge1xuICAgICAgY29uc3QgcGhLZXlzID0gT2JqZWN0LmtleXModG1wbEV4cHJlc3Npb25zKTtcblxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwaEtleXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3QgcGggPSBwaEtleXNbaV07XG5cbiAgICAgICAgaWYgKHBoVmlzaXRlZC5pbmRleE9mKHBoKSA9PT0gLTEpIHtcbiAgICAgICAgICBsZXQgaW5kZXggPSB0bXBsRXhwcmVzc2lvbnNbcGhdO1xuICAgICAgICAgIGlmIChuZ0Rldk1vZGUpIHtcbiAgICAgICAgICAgIGFzc2VydExlc3NUaGFuKFxuICAgICAgICAgICAgICAgIGluZGV4LnRvU3RyaW5nKDIpLmxlbmd0aCwgMjgsIGBJbmRleCAke2luZGV4fSBpcyB0b28gYmlnIGFuZCB3aWxsIG92ZXJmbG93YCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIC8vIEFkZCBhbiBpbnN0cnVjdGlvbiB0byByZW1vdmUgdGhlIGV4cHJlc3Npb25cbiAgICAgICAgICB0bXBsSW5zdHJ1Y3Rpb25zLnB1c2goaW5kZXggfCBJMThuSW5zdHJ1Y3Rpb25zLlJlbW92ZU5vZGUpO1xuXG4gICAgICAgICAgaWYgKGluZGV4ID4gbWF4SW5kZXgpIHtcbiAgICAgICAgICAgIG1heEluZGV4ID0gaW5kZXg7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgaWYgKHRtcGxJbmRleCA9PT0gMCAmJiB0eXBlb2YgbGFzdENoaWxkSW5kZXggPT09ICdudW1iZXInKSB7XG4gICAgLy8gVGhlIGN1cnJlbnQgcGFyZW50IGlzIGFuIG5nLWNvbnRhaW5lciBhbmQgaXQgaGFzIG1vcmUgY2hpbGRyZW4gYWZ0ZXIgdGhlIHRyYW5zbGF0aW9uIHRoYXQgd2VcbiAgICAvLyBuZWVkIHRvIGFwcGVuZCB0byBrZWVwIHRoZSBvcmRlciBvZiB0aGUgRE9NIG5vZGVzIGNvcnJlY3RcbiAgICBmb3IgKGxldCBpID0gbWF4SW5kZXggKyAxOyBpIDw9IGxhc3RDaGlsZEluZGV4OyBpKyspIHtcbiAgICAgIGlmIChuZ0Rldk1vZGUpIHtcbiAgICAgICAgYXNzZXJ0TGVzc1RoYW4oaS50b1N0cmluZygyKS5sZW5ndGgsIDI4LCBgSW5kZXggJHtpfSBpcyB0b28gYmlnIGFuZCB3aWxsIG92ZXJmbG93YCk7XG4gICAgICB9XG4gICAgICB0bXBsSW5zdHJ1Y3Rpb25zLnB1c2goaSB8IEkxOG5JbnN0cnVjdGlvbnMuQW55KTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gcGFydEluZGV4O1xufVxuXG4vLyBUT0RPOiBSZW1vdmUgTE5vZGUgYXJnIHdoZW4gd2UgcmVtb3ZlIGR5bmFtaWNDb250YWluZXJOb2RlXG5mdW5jdGlvbiBhcHBlbmRJMThuTm9kZShcbiAgICBub2RlOiBMTm9kZSwgdE5vZGU6IFROb2RlLCBwYXJlbnRUTm9kZTogVE5vZGUsIHByZXZpb3VzVE5vZGU6IFROb2RlKTogVE5vZGUge1xuICBpZiAobmdEZXZNb2RlKSB7XG4gICAgbmdEZXZNb2RlLnJlbmRlcmVyTW92ZU5vZGUrKztcbiAgfVxuXG4gIGNvbnN0IHZpZXdEYXRhID0gX2dldFZpZXdEYXRhKCk7XG5cbiAgLy8gT24gZmlyc3QgcGFzcywgcmUtb3JnYW5pemUgbm9kZSB0cmVlIHRvIHB1dCB0aGlzIG5vZGUgaW4gdGhlIGNvcnJlY3QgcG9zaXRpb24uXG4gIGNvbnN0IGZpcnN0VGVtcGxhdGVQYXNzID0gdmlld0RhdGFbVFZJRVddLmZpcnN0VGVtcGxhdGVQYXNzO1xuICBpZiAoZmlyc3RUZW1wbGF0ZVBhc3MpIHtcbiAgICBpZiAocHJldmlvdXNUTm9kZSA9PT0gcGFyZW50VE5vZGUgJiYgdE5vZGUgIT09IHBhcmVudFROb2RlLmNoaWxkKSB7XG4gICAgICB0Tm9kZS5uZXh0ID0gcGFyZW50VE5vZGUuY2hpbGQ7XG4gICAgICBwYXJlbnRUTm9kZS5jaGlsZCA9IHROb2RlO1xuICAgIH0gZWxzZSBpZiAocHJldmlvdXNUTm9kZSAhPT0gcGFyZW50VE5vZGUgJiYgdE5vZGUgIT09IHByZXZpb3VzVE5vZGUubmV4dCkge1xuICAgICAgdE5vZGUubmV4dCA9IHByZXZpb3VzVE5vZGUubmV4dDtcbiAgICAgIHByZXZpb3VzVE5vZGUubmV4dCA9IHROb2RlO1xuICAgIH0gZWxzZSB7XG4gICAgICB0Tm9kZS5uZXh0ID0gbnVsbDtcbiAgICB9XG5cbiAgICBpZiAocGFyZW50VE5vZGUgIT09IHZpZXdEYXRhW0hPU1RfTk9ERV0pIHtcbiAgICAgIHROb2RlLnBhcmVudCA9IHBhcmVudFROb2RlIGFzIFRFbGVtZW50Tm9kZTtcbiAgICB9XG4gIH1cblxuICBhcHBlbmRDaGlsZChub2RlLm5hdGl2ZSwgdE5vZGUsIHZpZXdEYXRhKTtcblxuICAvLyBUZW1wbGF0ZSBjb250YWluZXJzIGFsc28gaGF2ZSBhIGNvbW1lbnQgbm9kZSBmb3IgdGhlIGBWaWV3Q29udGFpbmVyUmVmYCB0aGF0IHNob3VsZCBiZSBtb3ZlZFxuICBpZiAodE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkNvbnRhaW5lciAmJiBub2RlLmR5bmFtaWNMQ29udGFpbmVyTm9kZSkge1xuICAgIGFwcGVuZENoaWxkKG5vZGUuZHluYW1pY0xDb250YWluZXJOb2RlLm5hdGl2ZSwgdE5vZGUsIHZpZXdEYXRhKTtcbiAgICByZXR1cm4gdE5vZGUuZHluYW1pY0NvbnRhaW5lck5vZGUgITtcbiAgfVxuXG4gIHJldHVybiB0Tm9kZTtcbn1cblxuLyoqXG4gKiBUYWtlcyBhIGxpc3Qgb2YgaW5zdHJ1Y3Rpb25zIGdlbmVyYXRlZCBieSBgaTE4bk1hcHBpbmcoKWAgdG8gdHJhbnNmb3JtIHRoZSB0ZW1wbGF0ZSBhY2NvcmRpbmdseS5cbiAqXG4gKiBAcGFyYW0gc3RhcnRJbmRleCBJbmRleCBvZiB0aGUgZmlyc3QgZWxlbWVudCB0byB0cmFuc2xhdGUgKGZvciBpbnN0YW5jZSB0aGUgZmlyc3QgY2hpbGQgb2YgdGhlXG4gKiBlbGVtZW50IHdpdGggdGhlIGkxOG4gYXR0cmlidXRlKS5cbiAqIEBwYXJhbSBpbnN0cnVjdGlvbnMgVGhlIGxpc3Qgb2YgaW5zdHJ1Y3Rpb25zIHRvIGFwcGx5IG9uIHRoZSBjdXJyZW50IHZpZXcuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpMThuQXBwbHkoc3RhcnRJbmRleDogbnVtYmVyLCBpbnN0cnVjdGlvbnM6IEkxOG5JbnN0cnVjdGlvbltdKTogdm9pZCB7XG4gIGNvbnN0IHZpZXdEYXRhID0gX2dldFZpZXdEYXRhKCk7XG4gIGlmIChuZ0Rldk1vZGUpIHtcbiAgICBhc3NlcnRFcXVhbChcbiAgICAgICAgdmlld0RhdGFbQklORElOR19JTkRFWF0sIHZpZXdEYXRhW1RWSUVXXS5iaW5kaW5nU3RhcnRJbmRleCxcbiAgICAgICAgJ2kxOG5BcHBseSBzaG91bGQgYmUgY2FsbGVkIGJlZm9yZSBhbnkgYmluZGluZycpO1xuICB9XG5cbiAgaWYgKCFpbnN0cnVjdGlvbnMpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICBjb25zdCByZW5kZXJlciA9IGdldFJlbmRlcmVyKCk7XG4gIGNvbnN0IHN0YXJ0VE5vZGUgPSBnZXRUTm9kZShzdGFydEluZGV4KTtcbiAgbGV0IGxvY2FsUGFyZW50VE5vZGU6IFROb2RlID0gc3RhcnRUTm9kZS5wYXJlbnQgfHwgdmlld0RhdGFbSE9TVF9OT0RFXSAhO1xuICBsZXQgbG9jYWxQcmV2aW91c1ROb2RlOiBUTm9kZSA9IGxvY2FsUGFyZW50VE5vZGU7XG4gIHJlc2V0Q29tcG9uZW50U3RhdGUoKTsgIC8vIFdlIGRvbid0IHdhbnQgdG8gYWRkIHRvIHRoZSB0cmVlIHdpdGggdGhlIHdyb25nIHByZXZpb3VzIG5vZGVcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IGluc3RydWN0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IGluc3RydWN0aW9uID0gaW5zdHJ1Y3Rpb25zW2ldIGFzIG51bWJlcjtcbiAgICBzd2l0Y2ggKGluc3RydWN0aW9uICYgSTE4bkluc3RydWN0aW9ucy5JbnN0cnVjdGlvbk1hc2spIHtcbiAgICAgIGNhc2UgSTE4bkluc3RydWN0aW9ucy5FbGVtZW50OlxuICAgICAgICBjb25zdCBlbGVtZW50SW5kZXggPSBpbnN0cnVjdGlvbiAmIEkxOG5JbnN0cnVjdGlvbnMuSW5kZXhNYXNrO1xuICAgICAgICBjb25zdCBlbGVtZW50OiBMTm9kZSA9IGxvYWQoZWxlbWVudEluZGV4KTtcbiAgICAgICAgY29uc3QgZWxlbWVudFROb2RlID0gZ2V0VE5vZGUoZWxlbWVudEluZGV4KTtcbiAgICAgICAgbG9jYWxQcmV2aW91c1ROb2RlID1cbiAgICAgICAgICAgIGFwcGVuZEkxOG5Ob2RlKGVsZW1lbnQsIGVsZW1lbnRUTm9kZSwgbG9jYWxQYXJlbnRUTm9kZSwgbG9jYWxQcmV2aW91c1ROb2RlKTtcbiAgICAgICAgbG9jYWxQYXJlbnRUTm9kZSA9IGVsZW1lbnRUTm9kZTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIEkxOG5JbnN0cnVjdGlvbnMuRXhwcmVzc2lvbjpcbiAgICAgIGNhc2UgSTE4bkluc3RydWN0aW9ucy5UZW1wbGF0ZVJvb3Q6XG4gICAgICBjYXNlIEkxOG5JbnN0cnVjdGlvbnMuQW55OlxuICAgICAgICBjb25zdCBub2RlSW5kZXggPSBpbnN0cnVjdGlvbiAmIEkxOG5JbnN0cnVjdGlvbnMuSW5kZXhNYXNrO1xuICAgICAgICBjb25zdCBub2RlOiBMTm9kZSA9IGxvYWQobm9kZUluZGV4KTtcbiAgICAgICAgbG9jYWxQcmV2aW91c1ROb2RlID1cbiAgICAgICAgICAgIGFwcGVuZEkxOG5Ob2RlKG5vZGUsIGdldFROb2RlKG5vZGVJbmRleCksIGxvY2FsUGFyZW50VE5vZGUsIGxvY2FsUHJldmlvdXNUTm9kZSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBJMThuSW5zdHJ1Y3Rpb25zLlRleHQ6XG4gICAgICAgIGlmIChuZ0Rldk1vZGUpIHtcbiAgICAgICAgICBuZ0Rldk1vZGUucmVuZGVyZXJDcmVhdGVUZXh0Tm9kZSsrO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHZhbHVlID0gaW5zdHJ1Y3Rpb25zWysraV07XG4gICAgICAgIGNvbnN0IHRleHRSTm9kZSA9IGNyZWF0ZVRleHROb2RlKHZhbHVlLCByZW5kZXJlcik7XG4gICAgICAgIC8vIElmIHdlIHdlcmUgdG8gb25seSBjcmVhdGUgYSBgUk5vZGVgIHRoZW4gcHJvamVjdGlvbnMgd29uJ3QgbW92ZSB0aGUgdGV4dC5cbiAgICAgICAgLy8gQ3JlYXRlIHRleHQgbm9kZSBhdCB0aGUgY3VycmVudCBlbmQgb2Ygdmlld0RhdGEuIE11c3Qgc3VidHJhY3QgaGVhZGVyIG9mZnNldCBiZWNhdXNlXG4gICAgICAgIC8vIGNyZWF0ZU5vZGVBdEluZGV4IHRha2VzIGEgcmF3IGluZGV4IChub3QgYWRqdXN0ZWQgYnkgaGVhZGVyIG9mZnNldCkuXG4gICAgICAgIGFkanVzdEJsdWVwcmludEZvck5ld05vZGUodmlld0RhdGEpO1xuICAgICAgICBjb25zdCBsYXN0Tm9kZUluZGV4ID0gdmlld0RhdGEubGVuZ3RoIC0gMSAtIEhFQURFUl9PRkZTRVQ7XG4gICAgICAgIGNvbnN0IHRleHRUTm9kZSA9XG4gICAgICAgICAgICBjcmVhdGVOb2RlQXRJbmRleChsYXN0Tm9kZUluZGV4LCBUTm9kZVR5cGUuRWxlbWVudCwgdGV4dFJOb2RlLCBudWxsLCBudWxsKTtcbiAgICAgICAgbG9jYWxQcmV2aW91c1ROb2RlID0gYXBwZW5kSTE4bk5vZGUoXG4gICAgICAgICAgICBsb2FkRWxlbWVudChsYXN0Tm9kZUluZGV4KSwgdGV4dFROb2RlLCBsb2NhbFBhcmVudFROb2RlLCBsb2NhbFByZXZpb3VzVE5vZGUpO1xuICAgICAgICByZXNldENvbXBvbmVudFN0YXRlKCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBJMThuSW5zdHJ1Y3Rpb25zLkNsb3NlTm9kZTpcbiAgICAgICAgbG9jYWxQcmV2aW91c1ROb2RlID0gbG9jYWxQYXJlbnRUTm9kZTtcbiAgICAgICAgbG9jYWxQYXJlbnRUTm9kZSA9IGxvY2FsUGFyZW50VE5vZGUucGFyZW50IHx8IHZpZXdEYXRhW0hPU1RfTk9ERV0gITtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIEkxOG5JbnN0cnVjdGlvbnMuUmVtb3ZlTm9kZTpcbiAgICAgICAgaWYgKG5nRGV2TW9kZSkge1xuICAgICAgICAgIG5nRGV2TW9kZS5yZW5kZXJlclJlbW92ZU5vZGUrKztcbiAgICAgICAgfVxuICAgICAgICBjb25zdCByZW1vdmVJbmRleCA9IGluc3RydWN0aW9uICYgSTE4bkluc3RydWN0aW9ucy5JbmRleE1hc2s7XG4gICAgICAgIGNvbnN0IHJlbW92ZWROb2RlOiBMTm9kZXxMQ29udGFpbmVyTm9kZSA9IGxvYWQocmVtb3ZlSW5kZXgpO1xuICAgICAgICBjb25zdCByZW1vdmVkVE5vZGUgPSBnZXRUTm9kZShyZW1vdmVJbmRleCk7XG4gICAgICAgIHJlbW92ZUNoaWxkKHJlbW92ZWRUTm9kZSwgcmVtb3ZlZE5vZGUubmF0aXZlIHx8IG51bGwsIHZpZXdEYXRhKTtcblxuICAgICAgICAvLyBGb3IgdGVtcGxhdGUgY29udGFpbmVycyB3ZSBhbHNvIG5lZWQgdG8gcmVtb3ZlIHRoZWlyIGBWaWV3Q29udGFpbmVyUmVmYCBmcm9tIHRoZSBET01cbiAgICAgICAgaWYgKHJlbW92ZWRUTm9kZS50eXBlID09PSBUTm9kZVR5cGUuQ29udGFpbmVyICYmIHJlbW92ZWROb2RlLmR5bmFtaWNMQ29udGFpbmVyTm9kZSkge1xuICAgICAgICAgIHJlbW92ZUNoaWxkKHJlbW92ZWRUTm9kZSwgcmVtb3ZlZE5vZGUuZHluYW1pY0xDb250YWluZXJOb2RlLm5hdGl2ZSB8fCBudWxsLCB2aWV3RGF0YSk7XG4gICAgICAgICAgcmVtb3ZlZFROb2RlLmR5bmFtaWNDb250YWluZXJOb2RlICEuZGV0YWNoZWQgPSB0cnVlO1xuICAgICAgICAgIHJlbW92ZWROb2RlLmR5bmFtaWNMQ29udGFpbmVyTm9kZS5kYXRhW1JFTkRFUl9QQVJFTlRdID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBUYWtlcyBhIHRyYW5zbGF0aW9uIHN0cmluZyBhbmQgdGhlIGluaXRpYWwgbGlzdCBvZiBleHByZXNzaW9ucyBhbmQgcmV0dXJucyBhIGxpc3Qgb2YgaW5zdHJ1Y3Rpb25zXG4gKiB0aGF0IHdpbGwgYmUgdXNlZCB0byB0cmFuc2xhdGUgYW4gYXR0cmlidXRlLlxuICogRXZlbiBpbmRleGVzIGNvbnRhaW4gc3RhdGljIHN0cmluZ3MsIHdoaWxlIG9kZCBpbmRleGVzIGNvbnRhaW4gdGhlIGluZGV4IG9mIHRoZSBleHByZXNzaW9uIHdob3NlXG4gKiB2YWx1ZSB3aWxsIGJlIGNvbmNhdGVuYXRlZCBpbnRvIHRoZSBmaW5hbCB0cmFuc2xhdGlvbi5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGkxOG5FeHBNYXBwaW5nKFxuICAgIHRyYW5zbGF0aW9uOiBzdHJpbmcsIHBsYWNlaG9sZGVyczogUGxhY2Vob2xkZXJNYXApOiBJMThuRXhwSW5zdHJ1Y3Rpb25bXSB7XG4gIGNvbnN0IHN0YXRpY1RleHQ6IEkxOG5FeHBJbnN0cnVjdGlvbltdID0gdHJhbnNsYXRpb24uc3BsaXQoaTE4blRhZ1JlZ2V4KTtcbiAgLy8gb2RkIGluZGV4ZXMgYXJlIHBsYWNlaG9sZGVyc1xuICBmb3IgKGxldCBpID0gMTsgaSA8IHN0YXRpY1RleHQubGVuZ3RoOyBpICs9IDIpIHtcbiAgICBzdGF0aWNUZXh0W2ldID0gcGxhY2Vob2xkZXJzW3N0YXRpY1RleHRbaV1dO1xuICB9XG4gIHJldHVybiBzdGF0aWNUZXh0O1xufVxuXG4vKipcbiAqIENoZWNrcyBpZiB0aGUgdmFsdWUgb2YgYW4gZXhwcmVzc2lvbiBoYXMgY2hhbmdlZCBhbmQgcmVwbGFjZXMgaXQgYnkgaXRzIHZhbHVlIGluIGEgdHJhbnNsYXRpb24sXG4gKiBvciByZXR1cm5zIE5PX0NIQU5HRS5cbiAqXG4gKiBAcGFyYW0gaW5zdHJ1Y3Rpb25zIEEgbGlzdCBvZiBpbnN0cnVjdGlvbnMgdGhhdCB3aWxsIGJlIHVzZWQgdG8gdHJhbnNsYXRlIGFuIGF0dHJpYnV0ZS5cbiAqIEBwYXJhbSB2MCB2YWx1ZSBjaGVja2VkIGZvciBjaGFuZ2UuXG4gKlxuICogQHJldHVybnMgVGhlIGNvbmNhdGVuYXRlZCBzdHJpbmcgd2hlbiBhbnkgb2YgdGhlIGFyZ3VtZW50cyBjaGFuZ2VzLCBgTk9fQ0hBTkdFYCBvdGhlcndpc2UuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpMThuSW50ZXJwb2xhdGlvbjEoaW5zdHJ1Y3Rpb25zOiBJMThuRXhwSW5zdHJ1Y3Rpb25bXSwgdjA6IGFueSk6IHN0cmluZ3xOT19DSEFOR0Uge1xuICBjb25zdCBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZChfZ2V0Vmlld0RhdGEoKVtCSU5ESU5HX0lOREVYXSsrLCB2MCk7XG5cbiAgaWYgKCFkaWZmZXJlbnQpIHtcbiAgICByZXR1cm4gTk9fQ0hBTkdFO1xuICB9XG5cbiAgbGV0IHJlcyA9ICcnO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGluc3RydWN0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgIC8vIE9kZCBpbmRleGVzIGFyZSBiaW5kaW5nc1xuICAgIGlmIChpICYgMSkge1xuICAgICAgcmVzICs9IHN0cmluZ2lmeSh2MCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlcyArPSBpbnN0cnVjdGlvbnNbaV07XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHJlcztcbn1cblxuLyoqXG4gKiBDaGVja3MgaWYgdGhlIHZhbHVlcyBvZiB1cCB0byAyIGV4cHJlc3Npb25zIGhhdmUgY2hhbmdlZCBhbmQgcmVwbGFjZXMgdGhlbSBieSB0aGVpciB2YWx1ZXMgaW4gYVxuICogdHJhbnNsYXRpb24sIG9yIHJldHVybnMgTk9fQ0hBTkdFLlxuICpcbiAqIEBwYXJhbSBpbnN0cnVjdGlvbnMgQSBsaXN0IG9mIGluc3RydWN0aW9ucyB0aGF0IHdpbGwgYmUgdXNlZCB0byB0cmFuc2xhdGUgYW4gYXR0cmlidXRlLlxuICogQHBhcmFtIHYwIHZhbHVlIGNoZWNrZWQgZm9yIGNoYW5nZS5cbiAqIEBwYXJhbSB2MSB2YWx1ZSBjaGVja2VkIGZvciBjaGFuZ2UuXG4gKlxuICogQHJldHVybnMgVGhlIGNvbmNhdGVuYXRlZCBzdHJpbmcgd2hlbiBhbnkgb2YgdGhlIGFyZ3VtZW50cyBjaGFuZ2VzLCBgTk9fQ0hBTkdFYCBvdGhlcndpc2UuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpMThuSW50ZXJwb2xhdGlvbjIoaW5zdHJ1Y3Rpb25zOiBJMThuRXhwSW5zdHJ1Y3Rpb25bXSwgdjA6IGFueSwgdjE6IGFueSk6IHN0cmluZ3xcbiAgICBOT19DSEFOR0Uge1xuICBjb25zdCB2aWV3RGF0YSA9IF9nZXRWaWV3RGF0YSgpO1xuICBjb25zdCBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZDIodmlld0RhdGFbQklORElOR19JTkRFWF0sIHYwLCB2MSk7XG4gIHZpZXdEYXRhW0JJTkRJTkdfSU5ERVhdICs9IDI7XG5cbiAgaWYgKCFkaWZmZXJlbnQpIHtcbiAgICByZXR1cm4gTk9fQ0hBTkdFO1xuICB9XG5cbiAgbGV0IHJlcyA9ICcnO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGluc3RydWN0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgIC8vIE9kZCBpbmRleGVzIGFyZSBiaW5kaW5nc1xuICAgIGlmIChpICYgMSkge1xuICAgICAgLy8gRXh0cmFjdCBiaXRzXG4gICAgICBjb25zdCBpZHggPSBpbnN0cnVjdGlvbnNbaV0gYXMgbnVtYmVyO1xuICAgICAgY29uc3QgYjEgPSBpZHggJiAxO1xuICAgICAgLy8gR2V0IHRoZSB2YWx1ZSBmcm9tIHRoZSBhcmd1bWVudCB2eCB3aGVyZSB4ID0gaWR4XG4gICAgICBjb25zdCB2YWx1ZSA9IGIxID8gdjEgOiB2MDtcblxuICAgICAgcmVzICs9IHN0cmluZ2lmeSh2YWx1ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlcyArPSBpbnN0cnVjdGlvbnNbaV07XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHJlcztcbn1cblxuLyoqXG4gKiBDaGVja3MgaWYgdGhlIHZhbHVlcyBvZiB1cCB0byAzIGV4cHJlc3Npb25zIGhhdmUgY2hhbmdlZCBhbmQgcmVwbGFjZXMgdGhlbSBieSB0aGVpciB2YWx1ZXMgaW4gYVxuICogdHJhbnNsYXRpb24sIG9yIHJldHVybnMgTk9fQ0hBTkdFLlxuICpcbiAqIEBwYXJhbSBpbnN0cnVjdGlvbnMgQSBsaXN0IG9mIGluc3RydWN0aW9ucyB0aGF0IHdpbGwgYmUgdXNlZCB0byB0cmFuc2xhdGUgYW4gYXR0cmlidXRlLlxuICogQHBhcmFtIHYwIHZhbHVlIGNoZWNrZWQgZm9yIGNoYW5nZS5cbiAqIEBwYXJhbSB2MSB2YWx1ZSBjaGVja2VkIGZvciBjaGFuZ2UuXG4gKiBAcGFyYW0gdjIgdmFsdWUgY2hlY2tlZCBmb3IgY2hhbmdlLlxuICpcbiAqIEByZXR1cm5zIFRoZSBjb25jYXRlbmF0ZWQgc3RyaW5nIHdoZW4gYW55IG9mIHRoZSBhcmd1bWVudHMgY2hhbmdlcywgYE5PX0NIQU5HRWAgb3RoZXJ3aXNlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gaTE4bkludGVycG9sYXRpb24zKFxuICAgIGluc3RydWN0aW9uczogSTE4bkV4cEluc3RydWN0aW9uW10sIHYwOiBhbnksIHYxOiBhbnksIHYyOiBhbnkpOiBzdHJpbmd8Tk9fQ0hBTkdFIHtcbiAgY29uc3Qgdmlld0RhdGEgPSBfZ2V0Vmlld0RhdGEoKTtcbiAgY29uc3QgZGlmZmVyZW50ID0gYmluZGluZ1VwZGF0ZWQzKHZpZXdEYXRhW0JJTkRJTkdfSU5ERVhdLCB2MCwgdjEsIHYyKTtcbiAgdmlld0RhdGFbQklORElOR19JTkRFWF0gKz0gMztcblxuICBpZiAoIWRpZmZlcmVudCkge1xuICAgIHJldHVybiBOT19DSEFOR0U7XG4gIH1cblxuICBsZXQgcmVzID0gJyc7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgaW5zdHJ1Y3Rpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgLy8gT2RkIGluZGV4ZXMgYXJlIGJpbmRpbmdzXG4gICAgaWYgKGkgJiAxKSB7XG4gICAgICAvLyBFeHRyYWN0IGJpdHNcbiAgICAgIGNvbnN0IGlkeCA9IGluc3RydWN0aW9uc1tpXSBhcyBudW1iZXI7XG4gICAgICBjb25zdCBiMiA9IGlkeCAmIDI7XG4gICAgICBjb25zdCBiMSA9IGlkeCAmIDE7XG4gICAgICAvLyBHZXQgdGhlIHZhbHVlIGZyb20gdGhlIGFyZ3VtZW50IHZ4IHdoZXJlIHggPSBpZHhcbiAgICAgIGNvbnN0IHZhbHVlID0gYjIgPyB2MiA6IChiMSA/IHYxIDogdjApO1xuXG4gICAgICByZXMgKz0gc3RyaW5naWZ5KHZhbHVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmVzICs9IGluc3RydWN0aW9uc1tpXTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gcmVzO1xufVxuXG4vKipcbiAqIENoZWNrcyBpZiB0aGUgdmFsdWVzIG9mIHVwIHRvIDQgZXhwcmVzc2lvbnMgaGF2ZSBjaGFuZ2VkIGFuZCByZXBsYWNlcyB0aGVtIGJ5IHRoZWlyIHZhbHVlcyBpbiBhXG4gKiB0cmFuc2xhdGlvbiwgb3IgcmV0dXJucyBOT19DSEFOR0UuXG4gKlxuICogQHBhcmFtIGluc3RydWN0aW9ucyBBIGxpc3Qgb2YgaW5zdHJ1Y3Rpb25zIHRoYXQgd2lsbCBiZSB1c2VkIHRvIHRyYW5zbGF0ZSBhbiBhdHRyaWJ1dGUuXG4gKiBAcGFyYW0gdjAgdmFsdWUgY2hlY2tlZCBmb3IgY2hhbmdlLlxuICogQHBhcmFtIHYxIHZhbHVlIGNoZWNrZWQgZm9yIGNoYW5nZS5cbiAqIEBwYXJhbSB2MiB2YWx1ZSBjaGVja2VkIGZvciBjaGFuZ2UuXG4gKiBAcGFyYW0gdjMgdmFsdWUgY2hlY2tlZCBmb3IgY2hhbmdlLlxuICpcbiAqIEByZXR1cm5zIFRoZSBjb25jYXRlbmF0ZWQgc3RyaW5nIHdoZW4gYW55IG9mIHRoZSBhcmd1bWVudHMgY2hhbmdlcywgYE5PX0NIQU5HRWAgb3RoZXJ3aXNlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gaTE4bkludGVycG9sYXRpb240KFxuICAgIGluc3RydWN0aW9uczogSTE4bkV4cEluc3RydWN0aW9uW10sIHYwOiBhbnksIHYxOiBhbnksIHYyOiBhbnksIHYzOiBhbnkpOiBzdHJpbmd8Tk9fQ0hBTkdFIHtcbiAgY29uc3Qgdmlld0RhdGEgPSBfZ2V0Vmlld0RhdGEoKTtcbiAgY29uc3QgZGlmZmVyZW50ID0gYmluZGluZ1VwZGF0ZWQ0KHZpZXdEYXRhW0JJTkRJTkdfSU5ERVhdLCB2MCwgdjEsIHYyLCB2Myk7XG4gIHZpZXdEYXRhW0JJTkRJTkdfSU5ERVhdICs9IDQ7XG5cbiAgaWYgKCFkaWZmZXJlbnQpIHtcbiAgICByZXR1cm4gTk9fQ0hBTkdFO1xuICB9XG5cbiAgbGV0IHJlcyA9ICcnO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGluc3RydWN0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgIC8vIE9kZCBpbmRleGVzIGFyZSBiaW5kaW5nc1xuICAgIGlmIChpICYgMSkge1xuICAgICAgLy8gRXh0cmFjdCBiaXRzXG4gICAgICBjb25zdCBpZHggPSBpbnN0cnVjdGlvbnNbaV0gYXMgbnVtYmVyO1xuICAgICAgY29uc3QgYjIgPSBpZHggJiAyO1xuICAgICAgY29uc3QgYjEgPSBpZHggJiAxO1xuICAgICAgLy8gR2V0IHRoZSB2YWx1ZSBmcm9tIHRoZSBhcmd1bWVudCB2eCB3aGVyZSB4ID0gaWR4XG4gICAgICBjb25zdCB2YWx1ZSA9IGIyID8gKGIxID8gdjMgOiB2MikgOiAoYjEgPyB2MSA6IHYwKTtcblxuICAgICAgcmVzICs9IHN0cmluZ2lmeSh2YWx1ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlcyArPSBpbnN0cnVjdGlvbnNbaV07XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHJlcztcbn1cblxuLyoqXG4gKiBDaGVja3MgaWYgdGhlIHZhbHVlcyBvZiB1cCB0byA1IGV4cHJlc3Npb25zIGhhdmUgY2hhbmdlZCBhbmQgcmVwbGFjZXMgdGhlbSBieSB0aGVpciB2YWx1ZXMgaW4gYVxuICogdHJhbnNsYXRpb24sIG9yIHJldHVybnMgTk9fQ0hBTkdFLlxuICpcbiAqIEBwYXJhbSBpbnN0cnVjdGlvbnMgQSBsaXN0IG9mIGluc3RydWN0aW9ucyB0aGF0IHdpbGwgYmUgdXNlZCB0byB0cmFuc2xhdGUgYW4gYXR0cmlidXRlLlxuICogQHBhcmFtIHYwIHZhbHVlIGNoZWNrZWQgZm9yIGNoYW5nZS5cbiAqIEBwYXJhbSB2MSB2YWx1ZSBjaGVja2VkIGZvciBjaGFuZ2UuXG4gKiBAcGFyYW0gdjIgdmFsdWUgY2hlY2tlZCBmb3IgY2hhbmdlLlxuICogQHBhcmFtIHYzIHZhbHVlIGNoZWNrZWQgZm9yIGNoYW5nZS5cbiAqIEBwYXJhbSB2NCB2YWx1ZSBjaGVja2VkIGZvciBjaGFuZ2UuXG4gKlxuICogQHJldHVybnMgVGhlIGNvbmNhdGVuYXRlZCBzdHJpbmcgd2hlbiBhbnkgb2YgdGhlIGFyZ3VtZW50cyBjaGFuZ2VzLCBgTk9fQ0hBTkdFYCBvdGhlcndpc2UuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpMThuSW50ZXJwb2xhdGlvbjUoXG4gICAgaW5zdHJ1Y3Rpb25zOiBJMThuRXhwSW5zdHJ1Y3Rpb25bXSwgdjA6IGFueSwgdjE6IGFueSwgdjI6IGFueSwgdjM6IGFueSwgdjQ6IGFueSk6IHN0cmluZ3xcbiAgICBOT19DSEFOR0Uge1xuICBjb25zdCB2aWV3RGF0YSA9IF9nZXRWaWV3RGF0YSgpO1xuICBsZXQgZGlmZmVyZW50ID0gYmluZGluZ1VwZGF0ZWQ0KHZpZXdEYXRhW0JJTkRJTkdfSU5ERVhdLCB2MCwgdjEsIHYyLCB2Myk7XG4gIGRpZmZlcmVudCA9IGJpbmRpbmdVcGRhdGVkKHZpZXdEYXRhW0JJTkRJTkdfSU5ERVhdICsgNCwgdjQpIHx8IGRpZmZlcmVudDtcbiAgdmlld0RhdGFbQklORElOR19JTkRFWF0gKz0gNTtcblxuICBpZiAoIWRpZmZlcmVudCkge1xuICAgIHJldHVybiBOT19DSEFOR0U7XG4gIH1cblxuICBsZXQgcmVzID0gJyc7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgaW5zdHJ1Y3Rpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgLy8gT2RkIGluZGV4ZXMgYXJlIGJpbmRpbmdzXG4gICAgaWYgKGkgJiAxKSB7XG4gICAgICAvLyBFeHRyYWN0IGJpdHNcbiAgICAgIGNvbnN0IGlkeCA9IGluc3RydWN0aW9uc1tpXSBhcyBudW1iZXI7XG4gICAgICBjb25zdCBiNCA9IGlkeCAmIDQ7XG4gICAgICBjb25zdCBiMiA9IGlkeCAmIDI7XG4gICAgICBjb25zdCBiMSA9IGlkeCAmIDE7XG4gICAgICAvLyBHZXQgdGhlIHZhbHVlIGZyb20gdGhlIGFyZ3VtZW50IHZ4IHdoZXJlIHggPSBpZHhcbiAgICAgIGNvbnN0IHZhbHVlID0gYjQgPyB2NCA6IChiMiA/IChiMSA/IHYzIDogdjIpIDogKGIxID8gdjEgOiB2MCkpO1xuXG4gICAgICByZXMgKz0gc3RyaW5naWZ5KHZhbHVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmVzICs9IGluc3RydWN0aW9uc1tpXTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gcmVzO1xufVxuXG4vKipcbiAqIENoZWNrcyBpZiB0aGUgdmFsdWVzIG9mIHVwIHRvIDYgZXhwcmVzc2lvbnMgaGF2ZSBjaGFuZ2VkIGFuZCByZXBsYWNlcyB0aGVtIGJ5IHRoZWlyIHZhbHVlcyBpbiBhXG4gKiB0cmFuc2xhdGlvbiwgb3IgcmV0dXJucyBOT19DSEFOR0UuXG4gKlxuICogQHBhcmFtIGluc3RydWN0aW9ucyBBIGxpc3Qgb2YgaW5zdHJ1Y3Rpb25zIHRoYXQgd2lsbCBiZSB1c2VkIHRvIHRyYW5zbGF0ZSBhbiBhdHRyaWJ1dGUuXG4gKiBAcGFyYW0gdjAgdmFsdWUgY2hlY2tlZCBmb3IgY2hhbmdlLlxuICogQHBhcmFtIHYxIHZhbHVlIGNoZWNrZWQgZm9yIGNoYW5nZS5cbiAqIEBwYXJhbSB2MiB2YWx1ZSBjaGVja2VkIGZvciBjaGFuZ2UuXG4gKiBAcGFyYW0gdjMgdmFsdWUgY2hlY2tlZCBmb3IgY2hhbmdlLlxuICogQHBhcmFtIHY0IHZhbHVlIGNoZWNrZWQgZm9yIGNoYW5nZS5cbiAqIEBwYXJhbSB2NSB2YWx1ZSBjaGVja2VkIGZvciBjaGFuZ2UuXG4gKlxuICogQHJldHVybnMgVGhlIGNvbmNhdGVuYXRlZCBzdHJpbmcgd2hlbiBhbnkgb2YgdGhlIGFyZ3VtZW50cyBjaGFuZ2VzLCBgTk9fQ0hBTkdFYCBvdGhlcndpc2UuXG4gKi8gZXhwb3J0IGZ1bmN0aW9uXG5pMThuSW50ZXJwb2xhdGlvbjYoXG4gICAgaW5zdHJ1Y3Rpb25zOiBJMThuRXhwSW5zdHJ1Y3Rpb25bXSwgdjA6IGFueSwgdjE6IGFueSwgdjI6IGFueSwgdjM6IGFueSwgdjQ6IGFueSwgdjU6IGFueSk6XG4gICAgc3RyaW5nfE5PX0NIQU5HRSB7XG4gIGNvbnN0IHZpZXdEYXRhID0gX2dldFZpZXdEYXRhKCk7XG4gIGxldCBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZDQodmlld0RhdGFbQklORElOR19JTkRFWF0sIHYwLCB2MSwgdjIsIHYzKTtcbiAgZGlmZmVyZW50ID0gYmluZGluZ1VwZGF0ZWQyKHZpZXdEYXRhW0JJTkRJTkdfSU5ERVhdICsgNCwgdjQsIHY1KSB8fCBkaWZmZXJlbnQ7XG4gIHZpZXdEYXRhW0JJTkRJTkdfSU5ERVhdICs9IDY7XG5cbiAgaWYgKCFkaWZmZXJlbnQpIHtcbiAgICByZXR1cm4gTk9fQ0hBTkdFO1xuICB9XG5cbiAgbGV0IHJlcyA9ICcnO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGluc3RydWN0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgIC8vIE9kZCBpbmRleGVzIGFyZSBiaW5kaW5nc1xuICAgIGlmIChpICYgMSkge1xuICAgICAgLy8gRXh0cmFjdCBiaXRzXG4gICAgICBjb25zdCBpZHggPSBpbnN0cnVjdGlvbnNbaV0gYXMgbnVtYmVyO1xuICAgICAgY29uc3QgYjQgPSBpZHggJiA0O1xuICAgICAgY29uc3QgYjIgPSBpZHggJiAyO1xuICAgICAgY29uc3QgYjEgPSBpZHggJiAxO1xuICAgICAgLy8gR2V0IHRoZSB2YWx1ZSBmcm9tIHRoZSBhcmd1bWVudCB2eCB3aGVyZSB4ID0gaWR4XG4gICAgICBjb25zdCB2YWx1ZSA9IGI0ID8gKGIxID8gdjUgOiB2NCkgOiAoYjIgPyAoYjEgPyB2MyA6IHYyKSA6IChiMSA/IHYxIDogdjApKTtcblxuICAgICAgcmVzICs9IHN0cmluZ2lmeSh2YWx1ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlcyArPSBpbnN0cnVjdGlvbnNbaV07XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHJlcztcbn1cblxuLyoqXG4gKiBDaGVja3MgaWYgdGhlIHZhbHVlcyBvZiB1cCB0byA3IGV4cHJlc3Npb25zIGhhdmUgY2hhbmdlZCBhbmQgcmVwbGFjZXMgdGhlbSBieSB0aGVpciB2YWx1ZXMgaW4gYVxuICogdHJhbnNsYXRpb24sIG9yIHJldHVybnMgTk9fQ0hBTkdFLlxuICpcbiAqIEBwYXJhbSBpbnN0cnVjdGlvbnMgQSBsaXN0IG9mIGluc3RydWN0aW9ucyB0aGF0IHdpbGwgYmUgdXNlZCB0byB0cmFuc2xhdGUgYW4gYXR0cmlidXRlLlxuICogQHBhcmFtIHYwIHZhbHVlIGNoZWNrZWQgZm9yIGNoYW5nZS5cbiAqIEBwYXJhbSB2MSB2YWx1ZSBjaGVja2VkIGZvciBjaGFuZ2UuXG4gKiBAcGFyYW0gdjIgdmFsdWUgY2hlY2tlZCBmb3IgY2hhbmdlLlxuICogQHBhcmFtIHYzIHZhbHVlIGNoZWNrZWQgZm9yIGNoYW5nZS5cbiAqIEBwYXJhbSB2NCB2YWx1ZSBjaGVja2VkIGZvciBjaGFuZ2UuXG4gKiBAcGFyYW0gdjUgdmFsdWUgY2hlY2tlZCBmb3IgY2hhbmdlLlxuICogQHBhcmFtIHY2IHZhbHVlIGNoZWNrZWQgZm9yIGNoYW5nZS5cbiAqXG4gKiBAcmV0dXJucyBUaGUgY29uY2F0ZW5hdGVkIHN0cmluZyB3aGVuIGFueSBvZiB0aGUgYXJndW1lbnRzIGNoYW5nZXMsIGBOT19DSEFOR0VgIG90aGVyd2lzZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGkxOG5JbnRlcnBvbGF0aW9uNyhcbiAgICBpbnN0cnVjdGlvbnM6IEkxOG5FeHBJbnN0cnVjdGlvbltdLCB2MDogYW55LCB2MTogYW55LCB2MjogYW55LCB2MzogYW55LCB2NDogYW55LCB2NTogYW55LFxuICAgIHY2OiBhbnkpOiBzdHJpbmd8Tk9fQ0hBTkdFIHtcbiAgY29uc3Qgdmlld0RhdGEgPSBfZ2V0Vmlld0RhdGEoKTtcbiAgbGV0IGRpZmZlcmVudCA9IGJpbmRpbmdVcGRhdGVkNCh2aWV3RGF0YVtCSU5ESU5HX0lOREVYXSwgdjAsIHYxLCB2MiwgdjMpO1xuICBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZDModmlld0RhdGFbQklORElOR19JTkRFWF0gKyA0LCB2NCwgdjUsIHY2KSB8fCBkaWZmZXJlbnQ7XG4gIHZpZXdEYXRhW0JJTkRJTkdfSU5ERVhdICs9IDc7XG5cbiAgaWYgKCFkaWZmZXJlbnQpIHtcbiAgICByZXR1cm4gTk9fQ0hBTkdFO1xuICB9XG5cbiAgbGV0IHJlcyA9ICcnO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGluc3RydWN0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgIC8vIE9kZCBpbmRleGVzIGFyZSBiaW5kaW5nc1xuICAgIGlmIChpICYgMSkge1xuICAgICAgLy8gRXh0cmFjdCBiaXRzXG4gICAgICBjb25zdCBpZHggPSBpbnN0cnVjdGlvbnNbaV0gYXMgbnVtYmVyO1xuICAgICAgY29uc3QgYjQgPSBpZHggJiA0O1xuICAgICAgY29uc3QgYjIgPSBpZHggJiAyO1xuICAgICAgY29uc3QgYjEgPSBpZHggJiAxO1xuICAgICAgLy8gR2V0IHRoZSB2YWx1ZSBmcm9tIHRoZSBhcmd1bWVudCB2eCB3aGVyZSB4ID0gaWR4XG4gICAgICBjb25zdCB2YWx1ZSA9IGI0ID8gKGIyID8gdjYgOiAoYjEgPyB2NSA6IHY0KSkgOiAoYjIgPyAoYjEgPyB2MyA6IHYyKSA6IChiMSA/IHYxIDogdjApKTtcblxuICAgICAgcmVzICs9IHN0cmluZ2lmeSh2YWx1ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlcyArPSBpbnN0cnVjdGlvbnNbaV07XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHJlcztcbn1cblxuLyoqXG4gKiBDaGVja3MgaWYgdGhlIHZhbHVlcyBvZiB1cCB0byA4IGV4cHJlc3Npb25zIGhhdmUgY2hhbmdlZCBhbmQgcmVwbGFjZXMgdGhlbSBieSB0aGVpciB2YWx1ZXMgaW4gYVxuICogdHJhbnNsYXRpb24sIG9yIHJldHVybnMgTk9fQ0hBTkdFLlxuICpcbiAqIEBwYXJhbSBpbnN0cnVjdGlvbnMgQSBsaXN0IG9mIGluc3RydWN0aW9ucyB0aGF0IHdpbGwgYmUgdXNlZCB0byB0cmFuc2xhdGUgYW4gYXR0cmlidXRlLlxuICogQHBhcmFtIHYwIHZhbHVlIGNoZWNrZWQgZm9yIGNoYW5nZS5cbiAqIEBwYXJhbSB2MSB2YWx1ZSBjaGVja2VkIGZvciBjaGFuZ2UuXG4gKiBAcGFyYW0gdjIgdmFsdWUgY2hlY2tlZCBmb3IgY2hhbmdlLlxuICogQHBhcmFtIHYzIHZhbHVlIGNoZWNrZWQgZm9yIGNoYW5nZS5cbiAqIEBwYXJhbSB2NCB2YWx1ZSBjaGVja2VkIGZvciBjaGFuZ2UuXG4gKiBAcGFyYW0gdjUgdmFsdWUgY2hlY2tlZCBmb3IgY2hhbmdlLlxuICogQHBhcmFtIHY2IHZhbHVlIGNoZWNrZWQgZm9yIGNoYW5nZS5cbiAqIEBwYXJhbSB2NyB2YWx1ZSBjaGVja2VkIGZvciBjaGFuZ2UuXG4gKlxuICogQHJldHVybnMgVGhlIGNvbmNhdGVuYXRlZCBzdHJpbmcgd2hlbiBhbnkgb2YgdGhlIGFyZ3VtZW50cyBjaGFuZ2VzLCBgTk9fQ0hBTkdFYCBvdGhlcndpc2UuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpMThuSW50ZXJwb2xhdGlvbjgoXG4gICAgaW5zdHJ1Y3Rpb25zOiBJMThuRXhwSW5zdHJ1Y3Rpb25bXSwgdjA6IGFueSwgdjE6IGFueSwgdjI6IGFueSwgdjM6IGFueSwgdjQ6IGFueSwgdjU6IGFueSxcbiAgICB2NjogYW55LCB2NzogYW55KTogc3RyaW5nfE5PX0NIQU5HRSB7XG4gIGNvbnN0IHZpZXdEYXRhID0gX2dldFZpZXdEYXRhKCk7XG4gIGxldCBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZDQodmlld0RhdGFbQklORElOR19JTkRFWF0sIHYwLCB2MSwgdjIsIHYzKTtcbiAgZGlmZmVyZW50ID0gYmluZGluZ1VwZGF0ZWQ0KHZpZXdEYXRhW0JJTkRJTkdfSU5ERVhdICsgNCwgdjQsIHY1LCB2NiwgdjcpIHx8IGRpZmZlcmVudDtcbiAgdmlld0RhdGFbQklORElOR19JTkRFWF0gKz0gODtcblxuICBpZiAoIWRpZmZlcmVudCkge1xuICAgIHJldHVybiBOT19DSEFOR0U7XG4gIH1cblxuICBsZXQgcmVzID0gJyc7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgaW5zdHJ1Y3Rpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgLy8gT2RkIGluZGV4ZXMgYXJlIGJpbmRpbmdzXG4gICAgaWYgKGkgJiAxKSB7XG4gICAgICAvLyBFeHRyYWN0IGJpdHNcbiAgICAgIGNvbnN0IGlkeCA9IGluc3RydWN0aW9uc1tpXSBhcyBudW1iZXI7XG4gICAgICBjb25zdCBiNCA9IGlkeCAmIDQ7XG4gICAgICBjb25zdCBiMiA9IGlkeCAmIDI7XG4gICAgICBjb25zdCBiMSA9IGlkeCAmIDE7XG4gICAgICAvLyBHZXQgdGhlIHZhbHVlIGZyb20gdGhlIGFyZ3VtZW50IHZ4IHdoZXJlIHggPSBpZHhcbiAgICAgIGNvbnN0IHZhbHVlID1cbiAgICAgICAgICBiNCA/IChiMiA/IChiMSA/IHY3IDogdjYpIDogKGIxID8gdjUgOiB2NCkpIDogKGIyID8gKGIxID8gdjMgOiB2MikgOiAoYjEgPyB2MSA6IHYwKSk7XG5cbiAgICAgIHJlcyArPSBzdHJpbmdpZnkodmFsdWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXMgKz0gaW5zdHJ1Y3Rpb25zW2ldO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiByZXM7XG59XG5cbi8qKlxuICogQ3JlYXRlIGEgdHJhbnNsYXRlZCBpbnRlcnBvbGF0aW9uIGJpbmRpbmcgd2l0aCBhIHZhcmlhYmxlIG51bWJlciBvZiBleHByZXNzaW9ucy5cbiAqXG4gKiBJZiB0aGVyZSBhcmUgMSB0byA4IGV4cHJlc3Npb25zIHRoZW4gYGkxOG5JbnRlcnBvbGF0aW9uKClgIHNob3VsZCBiZSB1c2VkIGluc3RlYWQuIEl0IGlzIGZhc3RlclxuICogYmVjYXVzZSB0aGVyZSBpcyBubyBuZWVkIHRvIGNyZWF0ZSBhbiBhcnJheSBvZiBleHByZXNzaW9ucyBhbmQgaXRlcmF0ZSBvdmVyIGl0LlxuICpcbiAqIEByZXR1cm5zIFRoZSBjb25jYXRlbmF0ZWQgc3RyaW5nIHdoZW4gYW55IG9mIHRoZSBhcmd1bWVudHMgY2hhbmdlcywgYE5PX0NIQU5HRWAgb3RoZXJ3aXNlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gaTE4bkludGVycG9sYXRpb25WKGluc3RydWN0aW9uczogSTE4bkV4cEluc3RydWN0aW9uW10sIHZhbHVlczogYW55W10pOiBzdHJpbmd8XG4gICAgTk9fQ0hBTkdFIHtcbiAgY29uc3Qgdmlld0RhdGEgPSBfZ2V0Vmlld0RhdGEoKTtcbiAgbGV0IGRpZmZlcmVudCA9IGZhbHNlO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IHZhbHVlcy5sZW5ndGg7IGkrKykge1xuICAgIC8vIENoZWNrIGlmIGJpbmRpbmdzIGhhdmUgY2hhbmdlZFxuICAgIGJpbmRpbmdVcGRhdGVkKHZpZXdEYXRhW0JJTkRJTkdfSU5ERVhdKyssIHZhbHVlc1tpXSkgJiYgKGRpZmZlcmVudCA9IHRydWUpO1xuICB9XG5cbiAgaWYgKCFkaWZmZXJlbnQpIHtcbiAgICByZXR1cm4gTk9fQ0hBTkdFO1xuICB9XG5cbiAgbGV0IHJlcyA9ICcnO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGluc3RydWN0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgIC8vIE9kZCBpbmRleGVzIGFyZSBwbGFjZWhvbGRlcnNcbiAgICBpZiAoaSAmIDEpIHtcbiAgICAgIHJlcyArPSBzdHJpbmdpZnkodmFsdWVzW2luc3RydWN0aW9uc1tpXSBhcyBudW1iZXJdKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmVzICs9IGluc3RydWN0aW9uc1tpXTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gcmVzO1xufVxuIl19