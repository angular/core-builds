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
 * @param translation A translation string where placeholders are represented by `{$name}`
 * @param elements An array containing, for each template, the maps of element placeholders and
 * their indexes.
 * @param expressions An array containing, for each template, the maps of expression placeholders
 * and their indexes.
 * @param templateRoots An array of template roots whose content should be ignored when
 * generating the instructions for their parent template.
 * @param lastChildIndex The index of the last child of the i18n node. Used when the i18n block is
 * an ng-container.
 *
 * @returns A list of instructions used to translate each template.
 */
export function i18nMapping(translation, elements, expressions, templateRoots, lastChildIndex) {
    const translationParts = translation.split(i18nTagRegex);
    const nbTemplates = templateRoots ? templateRoots.length + 1 : 1;
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
 * @param tmplIndex The order of appearance of the template.
 * 0 for the root template, following indexes match the order in `templateRoots`.
 * @param partIndex The current index in `translationParts`.
 * @param translationParts The translation string split into an array of placeholders and text
 * elements.
 * @param instructions The current list of instructions to update.
 * @param elements An array containing, for each template, the maps of element placeholders and
 * their indexes.
 * @param expressions An array containing, for each template, the maps of expression placeholders
 * and their indexes.
 * @param templateRoots An array of template roots whose content should be ignored when
 * generating the instructions for their parent template.
 * @param lastChildIndex The index of the last child of the i18n node. Used when the i18n block is
 * an ng-container.
 *
 * @returns the current index in `translationParts`
 */
function generateMappingInstructions(tmplIndex, partIndex, translationParts, instructions, elements, expressions, templateRoots, lastChildIndex) {
    const tmplInstructions = [];
    const phVisited = [];
    let openedTagCount = 0;
    let maxIndex = 0;
    let currentElements = elements && elements[tmplIndex] ? elements[tmplIndex] : null;
    let currentExpressions = expressions && expressions[tmplIndex] ? expressions[tmplIndex] : null;
    instructions[tmplIndex] = tmplInstructions;
    for (; partIndex < translationParts.length; partIndex++) {
        // The value can either be text or the name of a placeholder (element/template root/expression)
        const value = translationParts[partIndex];
        // Odd indexes are placeholders
        if (partIndex & 1) {
            let phIndex;
            if (currentElements && currentElements[value] !== undefined) {
                phIndex = currentElements[value];
                // The placeholder represents a DOM element, add an instruction to move it
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
        const tmplElements = elements[tmplIndex];
        if (tmplElements) {
            const phKeys = Object.keys(tmplElements);
            for (let i = 0; i < phKeys.length; i++) {
                const ph = phKeys[i];
                if (phVisited.indexOf(ph) === -1) {
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
        const tmplExpressions = expressions[tmplIndex];
        if (tmplExpressions) {
            const phKeys = Object.keys(tmplExpressions);
            for (let i = 0; i < phKeys.length; i++) {
                const ph = phKeys[i];
                if (phVisited.indexOf(ph) === -1) {
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
// TODO: Remove LNode arg when we remove dynamicContainerNode
function appendI18nNode(node, tNode, parentTNode, previousTNode) {
    if (ngDevMode) {
        ngDevMode.rendererMoveNode++;
    }
    const viewData = _getViewData();
    // On first pass, re-organize node tree to put this node in the correct position.
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
            tNode.parent = parentTNode;
        }
    }
    appendChild(node.native, tNode, viewData);
    // Template containers also have a comment node for the `ViewContainerRef` that should be moved
    if (tNode.type === 0 /* Container */ && node.dynamicLContainerNode) {
        appendChild(node.dynamicLContainerNode.native, tNode, viewData);
        return tNode.dynamicContainerNode;
    }
    return tNode;
}
/**
 * Takes a list of instructions generated by `i18nMapping()` to transform the template accordingly.
 *
 * @param startIndex Index of the first element to translate (for instance the first child of the
 * element with the i18n attribute).
 * @param instructions The list of instructions to apply on the current view.
 */
export function i18nApply(startIndex, instructions) {
    const viewData = _getViewData();
    if (ngDevMode) {
        assertEqual(viewData[BINDING_INDEX], viewData[TVIEW].bindingStartIndex, 'i18nApply should be called before any binding');
    }
    if (!instructions) {
        return;
    }
    const renderer = getRenderer();
    const startTNode = getTNode(startIndex);
    let localParentTNode = startTNode.parent || viewData[HOST_NODE];
    let localPreviousTNode = localParentTNode;
    resetComponentState(); // We don't want to add to the tree with the wrong previous node
    for (let i = 0; i < instructions.length; i++) {
        const instruction = instructions[i];
        switch (instruction & -536870912 /* InstructionMask */) {
            case 1073741824 /* Element */:
                const elementIndex = instruction & 536870911 /* IndexMask */;
                const element = load(elementIndex);
                const elementTNode = getTNode(elementIndex);
                localPreviousTNode =
                    appendI18nNode(element, elementTNode, localParentTNode, localPreviousTNode);
                localParentTNode = elementTNode;
                break;
            case 1610612736 /* Expression */:
            case -2147483648 /* TemplateRoot */:
            case -1610612736 /* Any */:
                const nodeIndex = instruction & 536870911 /* IndexMask */;
                const node = load(nodeIndex);
                localPreviousTNode =
                    appendI18nNode(node, getTNode(nodeIndex), localParentTNode, localPreviousTNode);
                break;
            case 536870912 /* Text */:
                if (ngDevMode) {
                    ngDevMode.rendererCreateTextNode++;
                }
                const value = instructions[++i];
                const textRNode = createTextNode(value, renderer);
                // If we were to only create a `RNode` then projections won't move the text.
                // Create text node at the current end of viewData. Must subtract header offset because
                // createNodeAtIndex takes a raw index (not adjusted by header offset).
                adjustBlueprintForNewNode(viewData);
                const lastNodeIndex = viewData.length - 1 - HEADER_OFFSET;
                const textTNode = createNodeAtIndex(lastNodeIndex, 3 /* Element */, textRNode, null, null);
                localPreviousTNode = appendI18nNode(loadElement(lastNodeIndex), textTNode, localParentTNode, localPreviousTNode);
                resetComponentState();
                break;
            case -1073741824 /* CloseNode */:
                localPreviousTNode = localParentTNode;
                localParentTNode = localParentTNode.parent || viewData[HOST_NODE];
                break;
            case -536870912 /* RemoveNode */:
                if (ngDevMode) {
                    ngDevMode.rendererRemoveNode++;
                }
                const removeIndex = instruction & 536870911 /* IndexMask */;
                const removedNode = load(removeIndex);
                const removedTNode = getTNode(removeIndex);
                removeChild(removedTNode, removedNode.native || null, viewData);
                // For template containers we also need to remove their `ViewContainerRef` from the DOM
                if (removedTNode.type === 0 /* Container */ && removedNode.dynamicLContainerNode) {
                    removeChild(removedTNode, removedNode.dynamicLContainerNode.native || null, viewData);
                    removedTNode.dynamicContainerNode.detached = true;
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
 */
export function i18nExpMapping(translation, placeholders) {
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
 * @param instructions A list of instructions that will be used to translate an attribute.
 * @param v0 value checked for change.
 *
 * @returns The concatenated string when any of the arguments changes, `NO_CHANGE` otherwise.
 */
export function i18nInterpolation1(instructions, v0) {
    const different = bindingUpdated(_getViewData()[BINDING_INDEX]++, v0);
    if (!different) {
        return NO_CHANGE;
    }
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
 * @param instructions A list of instructions that will be used to translate an attribute.
 * @param v0 value checked for change.
 * @param v1 value checked for change.
 *
 * @returns The concatenated string when any of the arguments changes, `NO_CHANGE` otherwise.
 */
export function i18nInterpolation2(instructions, v0, v1) {
    const viewData = _getViewData();
    const different = bindingUpdated2(viewData[BINDING_INDEX], v0, v1);
    viewData[BINDING_INDEX] += 2;
    if (!different) {
        return NO_CHANGE;
    }
    let res = '';
    for (let i = 0; i < instructions.length; i++) {
        // Odd indexes are bindings
        if (i & 1) {
            // Extract bits
            const idx = instructions[i];
            const b1 = idx & 1;
            // Get the value from the argument vx where x = idx
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
 * @param instructions A list of instructions that will be used to translate an attribute.
 * @param v0 value checked for change.
 * @param v1 value checked for change.
 * @param v2 value checked for change.
 *
 * @returns The concatenated string when any of the arguments changes, `NO_CHANGE` otherwise.
 */
export function i18nInterpolation3(instructions, v0, v1, v2) {
    const viewData = _getViewData();
    const different = bindingUpdated3(viewData[BINDING_INDEX], v0, v1, v2);
    viewData[BINDING_INDEX] += 3;
    if (!different) {
        return NO_CHANGE;
    }
    let res = '';
    for (let i = 0; i < instructions.length; i++) {
        // Odd indexes are bindings
        if (i & 1) {
            // Extract bits
            const idx = instructions[i];
            const b2 = idx & 2;
            const b1 = idx & 1;
            // Get the value from the argument vx where x = idx
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
 * @param instructions A list of instructions that will be used to translate an attribute.
 * @param v0 value checked for change.
 * @param v1 value checked for change.
 * @param v2 value checked for change.
 * @param v3 value checked for change.
 *
 * @returns The concatenated string when any of the arguments changes, `NO_CHANGE` otherwise.
 */
export function i18nInterpolation4(instructions, v0, v1, v2, v3) {
    const viewData = _getViewData();
    const different = bindingUpdated4(viewData[BINDING_INDEX], v0, v1, v2, v3);
    viewData[BINDING_INDEX] += 4;
    if (!different) {
        return NO_CHANGE;
    }
    let res = '';
    for (let i = 0; i < instructions.length; i++) {
        // Odd indexes are bindings
        if (i & 1) {
            // Extract bits
            const idx = instructions[i];
            const b2 = idx & 2;
            const b1 = idx & 1;
            // Get the value from the argument vx where x = idx
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
 * @param instructions A list of instructions that will be used to translate an attribute.
 * @param v0 value checked for change.
 * @param v1 value checked for change.
 * @param v2 value checked for change.
 * @param v3 value checked for change.
 * @param v4 value checked for change.
 *
 * @returns The concatenated string when any of the arguments changes, `NO_CHANGE` otherwise.
 */
export function i18nInterpolation5(instructions, v0, v1, v2, v3, v4) {
    const viewData = _getViewData();
    let different = bindingUpdated4(viewData[BINDING_INDEX], v0, v1, v2, v3);
    different = bindingUpdated(viewData[BINDING_INDEX] + 4, v4) || different;
    viewData[BINDING_INDEX] += 5;
    if (!different) {
        return NO_CHANGE;
    }
    let res = '';
    for (let i = 0; i < instructions.length; i++) {
        // Odd indexes are bindings
        if (i & 1) {
            // Extract bits
            const idx = instructions[i];
            const b4 = idx & 4;
            const b2 = idx & 2;
            const b1 = idx & 1;
            // Get the value from the argument vx where x = idx
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
 * @param instructions A list of instructions that will be used to translate an attribute.
 * @param v0 value checked for change.
 * @param v1 value checked for change.
 * @param v2 value checked for change.
 * @param v3 value checked for change.
 * @param v4 value checked for change.
 * @param v5 value checked for change.
 *
 * @returns The concatenated string when any of the arguments changes, `NO_CHANGE` otherwise.
 */ export function i18nInterpolation6(instructions, v0, v1, v2, v3, v4, v5) {
    const viewData = _getViewData();
    let different = bindingUpdated4(viewData[BINDING_INDEX], v0, v1, v2, v3);
    different = bindingUpdated2(viewData[BINDING_INDEX] + 4, v4, v5) || different;
    viewData[BINDING_INDEX] += 6;
    if (!different) {
        return NO_CHANGE;
    }
    let res = '';
    for (let i = 0; i < instructions.length; i++) {
        // Odd indexes are bindings
        if (i & 1) {
            // Extract bits
            const idx = instructions[i];
            const b4 = idx & 4;
            const b2 = idx & 2;
            const b1 = idx & 1;
            // Get the value from the argument vx where x = idx
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
 * @param instructions A list of instructions that will be used to translate an attribute.
 * @param v0 value checked for change.
 * @param v1 value checked for change.
 * @param v2 value checked for change.
 * @param v3 value checked for change.
 * @param v4 value checked for change.
 * @param v5 value checked for change.
 * @param v6 value checked for change.
 *
 * @returns The concatenated string when any of the arguments changes, `NO_CHANGE` otherwise.
 */
export function i18nInterpolation7(instructions, v0, v1, v2, v3, v4, v5, v6) {
    const viewData = _getViewData();
    let different = bindingUpdated4(viewData[BINDING_INDEX], v0, v1, v2, v3);
    different = bindingUpdated3(viewData[BINDING_INDEX] + 4, v4, v5, v6) || different;
    viewData[BINDING_INDEX] += 7;
    if (!different) {
        return NO_CHANGE;
    }
    let res = '';
    for (let i = 0; i < instructions.length; i++) {
        // Odd indexes are bindings
        if (i & 1) {
            // Extract bits
            const idx = instructions[i];
            const b4 = idx & 4;
            const b2 = idx & 2;
            const b1 = idx & 1;
            // Get the value from the argument vx where x = idx
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
 * @param instructions A list of instructions that will be used to translate an attribute.
 * @param v0 value checked for change.
 * @param v1 value checked for change.
 * @param v2 value checked for change.
 * @param v3 value checked for change.
 * @param v4 value checked for change.
 * @param v5 value checked for change.
 * @param v6 value checked for change.
 * @param v7 value checked for change.
 *
 * @returns The concatenated string when any of the arguments changes, `NO_CHANGE` otherwise.
 */
export function i18nInterpolation8(instructions, v0, v1, v2, v3, v4, v5, v6, v7) {
    const viewData = _getViewData();
    let different = bindingUpdated4(viewData[BINDING_INDEX], v0, v1, v2, v3);
    different = bindingUpdated4(viewData[BINDING_INDEX] + 4, v4, v5, v6, v7) || different;
    viewData[BINDING_INDEX] += 8;
    if (!different) {
        return NO_CHANGE;
    }
    let res = '';
    for (let i = 0; i < instructions.length; i++) {
        // Odd indexes are bindings
        if (i & 1) {
            // Extract bits
            const idx = instructions[i];
            const b4 = idx & 4;
            const b2 = idx & 2;
            const b1 = idx & 1;
            // Get the value from the argument vx where x = idx
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
 * @returns The concatenated string when any of the arguments changes, `NO_CHANGE` otherwise.
 */
export function i18nInterpolationV(instructions, values) {
    const viewData = _getViewData();
    let different = false;
    for (let i = 0; i < values.length; i++) {
        // Check if bindings have changed
        bindingUpdated(viewData[BINDING_INDEX]++, values[i]) && (different = true);
    }
    if (!different) {
        return NO_CHANGE;
    }
    let res = '';
    for (let i = 0; i < instructions.length; i++) {
        // Odd indexes are placeholders
        if (i & 1) {
            res += stringify(values[instructions[i]]);
        }
        else {
            res += instructions[i];
        }
    }
    return res;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaTE4bi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaTE4bi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsV0FBVyxFQUFFLGNBQWMsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUNyRCxPQUFPLEVBQUMsU0FBUyxFQUFFLFlBQVksRUFBRSx5QkFBeUIsRUFBRSxjQUFjLEVBQUUsZUFBZSxFQUFFLGVBQWUsRUFBRSxlQUFlLEVBQUUsaUJBQWlCLEVBQUUsV0FBVyxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsV0FBVyxFQUFFLG1CQUFtQixFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFDdk8sT0FBTyxFQUFDLGFBQWEsRUFBQyxNQUFNLHdCQUF3QixDQUFDO0FBRXJELE9BQU8sRUFBQyxhQUFhLEVBQUUsYUFBYSxFQUFFLFNBQVMsRUFBRSxLQUFLLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUNqRixPQUFPLEVBQUMsV0FBVyxFQUFFLGNBQWMsRUFBRSxXQUFXLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUM3RSxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sUUFBUSxDQUFDO0FBb0NqQyxNQUFNLFlBQVksR0FBRyxjQUFjLENBQUM7QUFFcEM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBb0JHO0FBQ0gsTUFBTSxVQUFVLFdBQVcsQ0FDdkIsV0FBbUIsRUFBRSxRQUEwQyxFQUMvRCxXQUE4QyxFQUFFLGFBQStCLEVBQy9FLGNBQThCO0lBQ2hDLE1BQU0sZ0JBQWdCLEdBQUcsV0FBVyxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUMsQ0FBQztJQUN6RCxNQUFNLFdBQVcsR0FBRyxhQUFhLENBQUMsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDakUsTUFBTSxZQUFZLEdB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LENBQUMsS0FBSyxDQUFDLENBQUM7U0FDekI7YUFBTTtZQUNMLEdBQUcsSUFBSSxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUM7U0FDeEI7S0FDRjtJQUVELE9BQU8sR0FBRyxDQUFDO0FBQ2IsQ0FBQztBQUVEOzs7Ozs7O0dBT0c7QUFDSCxNQUFNLFVBQVUsa0JBQWtCLENBQUMsWUFBa0MsRUFBRSxNQUFhO0lBRWxGLE1BQU0sUUFBUSxHQUFHLFlBQVksRUFBRSxDQUFDO0lBQ2hDLElBQUksU0FBUyxHQUFHLEtBQUssQ0FBQztJQUN0QixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtRQUN0QyxpQ0FBaUM7UUFDakMsY0FBYyxDQUFDLFFBQVEsQ0FBQyxhQUFhLENBQUMsRUFBRSxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxDQUFDO0tBQzVFO0lBRUQsSUFBSSxDQUFDLFNBQVMsRUFBRTtRQUNkLE9BQU8sU0FBUyxDQUFDO0tBQ2xCO0lBRUQsSUFBSSxHQUFHLEdBQUcsRUFBRSxDQUFDO0lBQ2IsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFlBQVksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7UUFDNUMsK0JBQStCO1FBQy9CLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRTtZQUNULEdBQUcsSUFBSSxTQUFTLENBQUMsTUFBTSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQVcsQ0FBQyxDQUFDLENBQUM7U0FDckQ7YUFBTTtZQUNMLEdBQUcsSUFBSSxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUM7U0FDeEI7S0FDRjtJQUVELE9BQU8sR0FBRyxDQUFDO0FBQ2IsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHthc3NlcnRFcXVhbCwgYXNzZXJ0TGVzc1RoYW59IGZyb20gJy4vYXNzZXJ0JztcbmltcG9ydCB7Tk9fQ0hBTkdFLCBfZ2V0Vmlld0RhdGEsIGFkanVzdEJsdWVwcmludEZvck5ld05vZGUsIGJpbmRpbmdVcGRhdGVkLCBiaW5kaW5nVXBkYXRlZDIsIGJpbmRpbmdVcGRhdGVkMywgYmluZGluZ1VwZGF0ZWQ0LCBjcmVhdGVOb2RlQXRJbmRleCwgZ2V0UmVuZGVyZXIsIGdldFROb2RlLCBsb2FkLCBsb2FkRWxlbWVudCwgcmVzZXRDb21wb25lbnRTdGF0ZX0gZnJvbSAnLi9pbnN0cnVjdGlvbnMnO1xuaW1wb3J0IHtSRU5ERVJfUEFSRU5UfSBmcm9tICcuL2ludGVyZmFjZXMvY29udGFpbmVyJztcbmltcG9ydCB7TENvbnRhaW5lck5vZGUsIExOb2RlLCBURWxlbWVudE5vZGUsIFROb2RlLCBUTm9kZVR5cGV9IGZyb20gJy4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7QklORElOR19JTkRFWCwgSEVBREVSX09GRlNFVCwgSE9TVF9OT0RFLCBUVklFV30gZnJvbSAnLi9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHthcHBlbmRDaGlsZCwgY3JlYXRlVGV4dE5vZGUsIHJlbW92ZUNoaWxkfSBmcm9tICcuL25vZGVfbWFuaXB1bGF0aW9uJztcbmltcG9ydCB7c3RyaW5naWZ5fSBmcm9tICcuL3V0aWwnO1xuXG4vKipcbiAqIEEgbGlzdCBvZiBmbGFncyB0byBlbmNvZGUgdGhlIGkxOG4gaW5zdHJ1Y3Rpb25zIHVzZWQgdG8gdHJhbnNsYXRlIHRoZSB0ZW1wbGF0ZS5cbiAqIFdlIHNoaWZ0IHRoZSBmbGFncyBieSAyOSBzbyB0aGF0IDMwICYgMzEgJiAzMiBiaXRzIGNvbnRhaW5zIHRoZSBpbnN0cnVjdGlvbnMuXG4gKi9cbmV4cG9ydCBjb25zdCBlbnVtIEkxOG5JbnN0cnVjdGlvbnMge1xuICBUZXh0ID0gMSA8PCAyOSxcbiAgRWxlbWVudCA9IDIgPDwgMjksXG4gIEV4cHJlc3Npb24gPSAzIDw8IDI5LFxuICBUZW1wbGF0ZVJvb3QgPSA0IDw8IDI5LFxuICBBbnkgPSA1IDw8IDI5LFxuICBDbG9zZU5vZGUgPSA2IDw8IDI5LFxuICBSZW1vdmVOb2RlID0gNyA8PCAyOSxcbiAgLyoqIFVzZWQgdG8gZGVjb2RlIHRoZSBudW1iZXIgZW5jb2RlZCB3aXRoIHRoZSBpbnN0cnVjdGlvbi4gKi9cbiAgSW5kZXhNYXNrID0gKDEgPDwgMjkpIC0gMSxcbiAgLyoqIFVzZWQgdG8gdGVzdCB0aGUgdHlwZSBvZiBpbnN0cnVjdGlvbi4gKi9cbiAgSW5zdHJ1Y3Rpb25NYXNrID0gfigoMSA8PCAyOSkgLSAxKSxcbn1cblxuLyoqXG4gKiBSZXByZXNlbnRzIHRoZSBpbnN0cnVjdGlvbnMgdXNlZCB0byB0cmFuc2xhdGUgdGhlIHRlbXBsYXRlLlxuICogSW5zdHJ1Y3Rpb25zIGNhbiBiZSBhIHBsYWNlaG9sZGVyIGluZGV4LCBhIHN0YXRpYyB0ZXh0IG9yIGEgc2ltcGxlIGJpdCBmaWVsZCAoYEkxOG5GbGFnYCkuXG4gKiBXaGVuIHRoZSBpbnN0cnVjdGlvbiBpcyB0aGUgZmxhZyBgVGV4dGAsIGl0IGlzIGFsd2F5cyBmb2xsb3dlZCBieSBpdHMgdGV4dCB2YWx1ZS5cbiAqL1xuZXhwb3J0IHR5cGUgSTE4bkluc3RydWN0aW9uID0gbnVtYmVyIHwgc3RyaW5nO1xuLyoqXG4gKiBSZXByZXNlbnRzIHRoZSBpbnN0cnVjdGlvbnMgdXNlZCB0byB0cmFuc2xhdGUgYXR0cmlidXRlcyBjb250YWluaW5nIGV4cHJlc3Npb25zLlxuICogRXZlbiBpbmRleGVzIGNvbnRhaW4gc3RhdGljIHN0cmluZ3MsIHdoaWxlIG9kZCBpbmRleGVzIGNvbnRhaW4gdGhlIGluZGV4IG9mIHRoZSBleHByZXNzaW9uIHdob3NlXG4gKiB2YWx1ZSB3aWxsIGJlIGNvbmNhdGVuYXRlZCBpbnRvIHRoZSBmaW5hbCB0cmFuc2xhdGlvbi5cbiAqL1xuZXhwb3J0IHR5cGUgSTE4bkV4cEluc3RydWN0aW9uID0gbnVtYmVyIHwgc3RyaW5nO1xuLyoqIE1hcHBpbmcgb2YgcGxhY2Vob2xkZXIgbmFtZXMgdG8gdGhlaXIgYWJzb2x1dGUgaW5kZXhlcyBpbiB0aGVpciB0ZW1wbGF0ZXMuICovXG5leHBvcnQgdHlwZSBQbGFjZWhvbGRlck1hcCA9IHtcbiAgW25hbWU6IHN0cmluZ106IG51bWJlclxufTtcbmNvbnN0IGkxOG5UYWdSZWdleCA9IC97XFwkKFtefV0rKX0vZztcblxuLyoqXG4gKiBUYWtlcyBhIHRyYW5zbGF0aW9uIHN0cmluZywgdGhlIGluaXRpYWwgbGlzdCBvZiBwbGFjZWhvbGRlcnMgKGVsZW1lbnRzIGFuZCBleHByZXNzaW9ucykgYW5kIHRoZVxuICogaW5kZXhlcyBvZiB0aGVpciBjb3JyZXNwb25kaW5nIGV4cHJlc3Npb24gbm9kZXMgdG8gcmV0dXJuIGEgbGlzdCBvZiBpbnN0cnVjdGlvbnMgZm9yIGVhY2hcbiAqIHRlbXBsYXRlIGZ1bmN0aW9uLlxuICpcbiAqIEJlY2F1c2UgZW1iZWRkZWQgdGVtcGxhdGVzIGhhdmUgZGlmZmVyZW50IGluZGV4ZXMgZm9yIGVhY2ggcGxhY2Vob2xkZXIsIGVhY2ggcGFyYW1ldGVyIChleGNlcHRcbiAqIHRoZSB0cmFuc2xhdGlvbikgaXMgYW4gYXJyYXksIHdoZXJlIGVhY2ggdmFsdWUgY29ycmVzcG9uZHMgdG8gYSBkaWZmZXJlbnQgdGVtcGxhdGUsIGJ5IG9yZGVyIG9mXG4gKiBhcHBlYXJhbmNlLlxuICpcbiAqIEBwYXJhbSB0cmFuc2xhdGlvbiBBIHRyYW5zbGF0aW9uIHN0cmluZyB3aGVyZSBwbGFjZWhvbGRlcnMgYXJlIHJlcHJlc2VudGVkIGJ5IGB7JG5hbWV9YFxuICogQHBhcmFtIGVsZW1lbnRzIEFuIGFycmF5IGNvbnRhaW5pbmcsIGZvciBlYWNoIHRlbXBsYXRlLCB0aGUgbWFwcyBvZiBlbGVtZW50IHBsYWNlaG9sZGVycyBhbmRcbiAqIHRoZWlyIGluZGV4ZXMuXG4gKiBAcGFyYW0gZXhwcmVzc2lvbnMgQW4gYXJyYXkgY29udGFpbmluZywgZm9yIGVhY2ggdGVtcGxhdGUsIHRoZSBtYXBzIG9mIGV4cHJlc3Npb24gcGxhY2Vob2xkZXJzXG4gKiBhbmQgdGhlaXIgaW5kZXhlcy5cbiAqIEBwYXJhbSB0ZW1wbGF0ZVJvb3RzIEFuIGFycmF5IG9mIHRlbXBsYXRlIHJvb3RzIHdob3NlIGNvbnRlbnQgc2hvdWxkIGJlIGlnbm9yZWQgd2hlblxuICogZ2VuZXJhdGluZyB0aGUgaW5zdHJ1Y3Rpb25zIGZvciB0aGVpciBwYXJlbnQgdGVtcGxhdGUuXG4gKiBAcGFyYW0gbGFzdENoaWxkSW5kZXggVGhlIGluZGV4IG9mIHRoZSBsYXN0IGNoaWxkIG9mIHRoZSBpMThuIG5vZGUuIFVzZWQgd2hlbiB0aGUgaTE4biBibG9jayBpc1xuICogYW4gbmctY29udGFpbmVyLlxuICpcbiAqIEByZXR1cm5zIEEgbGlzdCBvZiBpbnN0cnVjdGlvbnMgdXNlZCB0byB0cmFuc2xhdGUgZWFjaCB0ZW1wbGF0ZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGkxOG5NYXBwaW5nKFxuICAgIHRyYW5zbGF0aW9uOiBzdHJpbmcsIGVsZW1lbnRzOiAoUGxhY2Vob2xkZXJNYXAgfCBudWxsKVtdIHwgbnVsbCxcbiAgICBleHByZXNzaW9ucz86IChQbGFjZWhvbGRlck1hcCB8IG51bGwpW10gfCBudWxsLCB0ZW1wbGF0ZVJvb3RzPzogc3RyaW5nW10gfCBudWxsLFxuICAgIGxhc3RDaGlsZEluZGV4PzogbnVtYmVyIHwgbnVsbCk6IEkxOG5JbnN0cnVjdGlvbltdW10ge1xuICBjb25zdCB0cmFuc2xhdGlvblBhcnRzID0gdHJhbnNsYXRpb24uc3BsaXQoaTE4blRhZ1JlZ2V4KTtcbiAgY29uc3QgbmJUZW1wbGF0ZXMgPSB0ZW1wbGF0ZVJvb3RzID8gdGVtcGxhdGVSb290cy5sZW5ndGggKyAxIDogMTtcbiAgY29uc3QgaW5zdHJ1Y3Rpb25zOiBJMThuSW5zdHJ1Y3Rpb25bXVtdID0gKG5ldyBBcnJheShuYlRlbXBsYXRlcykpLmZpbGwodW5kZWZpbmVkKTtcblxuICBnZW5lcmF0ZU1hcHBpbmdJbnN0cnVjdGlvbnMoXG4gICAgICAwLCAwLCB0cmFuc2xhdGlvblBhcnRzLCBpbnN0cnVjdGlvbnMsIGVsZW1lbnRzLCBleHByZXNzaW9ucywgdGVtcGxhdGVSb290cywgbGFzdENoaWxkSW5kZXgpO1xuXG4gIHJldHVybiBpbnN0cnVjdGlvbnM7XG59XG5cbi8qKlxuICogSW50ZXJuYWwgZnVuY3Rpb24gdGhhdCByZWFkcyB0aGUgdHJhbnNsYXRpb24gcGFydHMgYW5kIGdlbmVyYXRlcyBhIHNldCBvZiBpbnN0cnVjdGlvbnMgZm9yIGVhY2hcbiAqIHRlbXBsYXRlLlxuICpcbiAqIFNlZSBgaTE4bk1hcHBpbmcoKWAgZm9yIG1vcmUgZGV0YWlscy5cbiAqXG4gKiBAcGFyYW0gdG1wbEluZGV4IFRoZSBvcmRlciBvZiBhcHBlYXJhbmNlIG9mIHRoZSB0ZW1wbGF0ZS5cbiAqIDAgZm9yIHRoZSByb290IHRlbXBsYXRlLCBmb2xsb3dpbmcgaW5kZXhlcyBtYXRjaCB0aGUgb3JkZXIgaW4gYHRlbXBsYXRlUm9vdHNgLlxuICogQHBhcmFtIHBhcnRJbmRleCBUaGUgY3VycmVudCBpbmRleCBpbiBgdHJhbnNsYXRpb25QYXJ0c2AuXG4gKiBAcGFyYW0gdHJhbnNsYXRpb25QYXJ0cyBUaGUgdHJhbnNsYXRpb24gc3RyaW5nIHNwbGl0IGludG8gYW4gYXJyYXkgb2YgcGxhY2Vob2xkZXJzIGFuZCB0ZXh0XG4gKiBlbGVtZW50cy5cbiAqIEBwYXJhbSBpbnN0cnVjdGlvbnMgVGhlIGN1cnJlbnQgbGlzdCBvZiBpbnN0cnVjdGlvbnMgdG8gdXBkYXRlLlxuICogQHBhcmFtIGVsZW1lbnRzIEFuIGFycmF5IGNvbnRhaW5pbmcsIGZvciBlYWNoIHRlbXBsYXRlLCB0aGUgbWFwcyBvZiBlbGVtZW50IHBsYWNlaG9sZGVycyBhbmRcbiAqIHRoZWlyIGluZGV4ZXMuXG4gKiBAcGFyYW0gZXhwcmVzc2lvbnMgQW4gYXJyYXkgY29udGFpbmluZywgZm9yIGVhY2ggdGVtcGxhdGUsIHRoZSBtYXBzIG9mIGV4cHJlc3Npb24gcGxhY2Vob2xkZXJzXG4gKiBhbmQgdGhlaXIgaW5kZXhlcy5cbiAqIEBwYXJhbSB0ZW1wbGF0ZVJvb3RzIEFuIGFycmF5IG9mIHRlbXBsYXRlIHJvb3RzIHdob3NlIGNvbnRlbnQgc2hvdWxkIGJlIGlnbm9yZWQgd2hlblxuICogZ2VuZXJhdGluZyB0aGUgaW5zdHJ1Y3Rpb25zIGZvciB0aGVpciBwYXJlbnQgdGVtcGxhdGUuXG4gKiBAcGFyYW0gbGFzdENoaWxkSW5kZXggVGhlIGluZGV4IG9mIHRoZSBsYXN0IGNoaWxkIG9mIHRoZSBpMThuIG5vZGUuIFVzZWQgd2hlbiB0aGUgaTE4biBibG9jayBpc1xuICogYW4gbmctY29udGFpbmVyLlxuICpcbiAqIEByZXR1cm5zIHRoZSBjdXJyZW50IGluZGV4IGluIGB0cmFuc2xhdGlvblBhcnRzYFxuICovXG5mdW5jdGlvbiBnZW5lcmF0ZU1hcHBpbmdJbnN0cnVjdGlvbnMoXG4gICAgdG1wbEluZGV4OiBudW1iZXIsIHBhcnRJbmRleDogbnVtYmVyLCB0cmFuc2xhdGlvblBhcnRzOiBzdHJpbmdbXSxcbiAgICBpbnN0cnVjdGlvbnM6IEkxOG5JbnN0cnVjdGlvbltdW10sIGVsZW1lbnRzOiAoUGxhY2Vob2xkZXJNYXAgfCBudWxsKVtdIHwgbnVsbCxcbiAgICBleHByZXNzaW9ucz86IChQbGFjZWhvbGRlck1hcCB8IG51bGwpW10gfCBudWxsLCB0ZW1wbGF0ZVJvb3RzPzogc3RyaW5nW10gfCBudWxsLFxuICAgIGxhc3RDaGlsZEluZGV4PzogbnVtYmVyIHwgbnVsbCk6IG51bWJlciB7XG4gIGNvbnN0IHRtcGxJbnN0cnVjdGlvbnM6IEkxOG5JbnN0cnVjdGlvbltdID0gW107XG4gIGNvbnN0IHBoVmlzaXRlZDogc3RyaW5nW10gPSBbXTtcbiAgbGV0IG9wZW5lZFRhZ0NvdW50ID0gMDtcbiAgbGV0IG1heEluZGV4ID0gMDtcbiAgbGV0IGN1cnJlbnRFbGVtZW50czogUGxhY2Vob2xkZXJNYXB8bnVsbCA9XG4gICAgICBlbGVtZW50cyAmJiBlbGVtZW50c1t0bXBsSW5kZXhdID8gZWxlbWVudHNbdG1wbEluZGV4XSA6IG51bGw7XG4gIGxldCBjdXJyZW50RXhwcmVzc2lvbnM6IFBsYWNlaG9sZGVyTWFwfG51bGwgPVxuICAgICAgZXhwcmVzc2lvbnMgJiYgZXhwcmVzc2lvbnNbdG1wbEluZGV4XSA/IGV4cHJlc3Npb25zW3RtcGxJbmRleF0gOiBudWxsO1xuXG4gIGluc3RydWN0aW9uc1t0bXBsSW5kZXhdID0gdG1wbEluc3RydWN0aW9ucztcblxuICBmb3IgKDsgcGFydEluZGV4IDwgdHJhbnNsYXRpb25QYXJ0cy5sZW5ndGg7IHBhcnRJbmRleCsrKSB7XG4gICAgLy8gVGhlIHZhbHVlIGNhbiBlaXRoZXIgYmUgdGV4dCBvciB0aGUgbmFtZSBvZiBhIHBsYWNlaG9sZGVyIChlbGVtZW50L3RlbXBsYXRlIHJvb3QvZXhwcmVzc2lvbilcbiAgICBjb25zdCB2YWx1ZSA9IHRyYW5zbGF0aW9uUGFydHNbcGFydEluZGV4XTtcblxuICAgIC8vIE9kZCBpbmRleGVzIGFyZSBwbGFjZWhvbGRlcnNcbiAgICBpZiAocGFydEluZGV4ICYgMSkge1xuICAgICAgbGV0IHBoSW5kZXg7XG4gICAgICBpZiAoY3VycmVudEVsZW1lbnRzICYmIGN1cnJlbnRFbGVtZW50c1t2YWx1ZV0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBwaEluZGV4ID0gY3VycmVudEVsZW1lbnRzW3ZhbHVlXTtcbiAgICAgICAgLy8gVGhlIHBsYWNlaG9sZGVyIHJlcHJlc2VudHMgYSBET00gZWxlbWVudCwgYWRkIGFuIGluc3RydWN0aW9uIHRvIG1vdmUgaXRcbiAgICAgICAgbGV0IHRlbXBsYXRlUm9vdEluZGV4ID0gdGVtcGxhdGVSb290cyA/IHRlbXBsYXRlUm9vdHMuaW5kZXhPZih2YWx1ZSkgOiAtMTtcbiAgICAgICAgaWYgKHRlbXBsYXRlUm9vdEluZGV4ICE9PSAtMSAmJiAodGVtcGxhdGVSb290SW5kZXggKyAxKSAhPT0gdG1wbEluZGV4KSB7XG4gICAgICAgICAgLy8gVGhpcyBpcyBhIHRlbXBsYXRlIHJvb3QsIGl0IGhhcyBubyBjbG9zaW5nIHRhZywgbm90IHRyZWF0aW5nIGl0IGFzIGFuIGVsZW1lbnRcbiAgICAgICAgICB0bXBsSW5zdHJ1Y3Rpb25zLnB1c2gocGhJbmRleCB8IEkxOG5JbnN0cnVjdGlvbnMuVGVtcGxhdGVSb290KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0bXBsSW5zdHJ1Y3Rpb25zLnB1c2gocGhJbmRleCB8IEkxOG5JbnN0cnVjdGlvbnMuRWxlbWVudCk7XG4gICAgICAgICAgb3BlbmVkVGFnQ291bnQrKztcbiAgICAgICAgfVxuICAgICAgICBwaFZpc2l0ZWQucHVzaCh2YWx1ZSk7XG4gICAgICB9IGVsc2UgaWYgKGN1cnJlbnRFeHByZXNzaW9ucyAmJiBjdXJyZW50RXhwcmVzc2lvbnNbdmFsdWVdICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcGhJbmRleCA9IGN1cnJlbnRFeHByZXNzaW9uc1t2YWx1ZV07XG4gICAgICAgIC8vIFRoZSBwbGFjZWhvbGRlciByZXByZXNlbnRzIGFuIGV4cHJlc3Npb24sIGFkZCBhbiBpbnN0cnVjdGlvbiB0byBtb3ZlIGl0XG4gICAgICAgIHRtcGxJbnN0cnVjdGlvbnMucHVzaChwaEluZGV4IHwgSTE4bkluc3RydWN0aW9ucy5FeHByZXNzaW9uKTtcbiAgICAgICAgcGhWaXNpdGVkLnB1c2godmFsdWUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gSXQgaXMgYSBjbG9zaW5nIHRhZ1xuICAgICAgICB0bXBsSW5zdHJ1Y3Rpb25zLnB1c2goSTE4bkluc3RydWN0aW9ucy5DbG9zZU5vZGUpO1xuXG4gICAgICAgIGlmICh0bXBsSW5kZXggPiAwKSB7XG4gICAgICAgICAgb3BlbmVkVGFnQ291bnQtLTtcblxuICAgICAgICAgIC8vIElmIHdlIGhhdmUgcmVhY2hlZCB0aGUgY2xvc2luZyB0YWcgZm9yIHRoaXMgdGVtcGxhdGUsIGV4aXQgdGhlIGxvb3BcbiAgICAgICAgICBpZiAob3BlbmVkVGFnQ291bnQgPT09IDApIHtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAocGhJbmRleCAhPT0gdW5kZWZpbmVkICYmIHBoSW5kZXggPiBtYXhJbmRleCkge1xuICAgICAgICBtYXhJbmRleCA9IHBoSW5kZXg7XG4gICAgICB9XG5cbiAgICAgIGlmICh0ZW1wbGF0ZVJvb3RzKSB7XG4gICAgICAgIGNvbnN0IG5ld1RtcGxJbmRleCA9IHRlbXBsYXRlUm9vdHMuaW5kZXhPZih2YWx1ZSkgKyAxO1xuICAgICAgICBpZiAobmV3VG1wbEluZGV4ICE9PSAwICYmIG5ld1RtcGxJbmRleCAhPT0gdG1wbEluZGV4KSB7XG4gICAgICAgICAgcGFydEluZGV4ID0gZ2VuZXJhdGVNYXBwaW5nSW5zdHJ1Y3Rpb25zKFxuICAgICAgICAgICAgICBuZXdUbXBsSW5kZXgsIHBhcnRJbmRleCwgdHJhbnNsYXRpb25QYXJ0cywgaW5zdHJ1Y3Rpb25zLCBlbGVtZW50cywgZXhwcmVzc2lvbnMsXG4gICAgICAgICAgICAgIHRlbXBsYXRlUm9vdHMsIGxhc3RDaGlsZEluZGV4KTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgfSBlbHNlIGlmICh2YWx1ZSkge1xuICAgICAgLy8gSXQncyBhIG5vbi1lbXB0eSBzdHJpbmcsIGNyZWF0ZSBhIHRleHQgbm9kZVxuICAgICAgdG1wbEluc3RydWN0aW9ucy5wdXNoKEkxOG5JbnN0cnVjdGlvbnMuVGV4dCwgdmFsdWUpO1xuICAgIH1cbiAgfVxuXG4gIC8vIEFkZCBpbnN0cnVjdGlvbnMgdG8gcmVtb3ZlIGVsZW1lbnRzIHRoYXQgYXJlIG5vdCB1c2VkIGluIHRoZSB0cmFuc2xhdGlvblxuICBpZiAoZWxlbWVudHMpIHtcbiAgICBjb25zdCB0bXBsRWxlbWVudHMgPSBlbGVtZW50c1t0bXBsSW5kZXhdO1xuXG4gICAgaWYgKHRtcGxFbGVtZW50cykge1xuICAgICAgY29uc3QgcGhLZXlzID0gT2JqZWN0LmtleXModG1wbEVsZW1lbnRzKTtcblxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwaEtleXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3QgcGggPSBwaEtleXNbaV07XG5cbiAgICAgICAgaWYgKHBoVmlzaXRlZC5pbmRleE9mKHBoKSA9PT0gLTEpIHtcbiAgICAgICAgICBsZXQgaW5kZXggPSB0bXBsRWxlbWVudHNbcGhdO1xuICAgICAgICAgIC8vIEFkZCBhbiBpbnN0cnVjdGlvbiB0byByZW1vdmUgdGhlIGVsZW1lbnRcbiAgICAgICAgICB0bXBsSW5zdHJ1Y3Rpb25zLnB1c2goaW5kZXggfCBJMThuSW5zdHJ1Y3Rpb25zLlJlbW92ZU5vZGUpO1xuXG4gICAgICAgICAgaWYgKGluZGV4ID4gbWF4SW5kZXgpIHtcbiAgICAgICAgICAgIG1heEluZGV4ID0gaW5kZXg7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8gQWRkIGluc3RydWN0aW9ucyB0byByZW1vdmUgZXhwcmVzc2lvbnMgdGhhdCBhcmUgbm90IHVzZWQgaW4gdGhlIHRyYW5zbGF0aW9uXG4gIGlmIChleHByZXNzaW9ucykge1xuICAgIGNvbnN0IHRtcGxFeHByZXNzaW9ucyA9IGV4cHJlc3Npb25zW3RtcGxJbmRleF07XG5cbiAgICBpZiAodG1wbEV4cHJlc3Npb25zKSB7XG4gICAgICBjb25zdCBwaEtleXMgPSBPYmplY3Qua2V5cyh0bXBsRXhwcmVzc2lvbnMpO1xuXG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHBoS2V5cy5sZW5ndGg7IGkrKykge1xuICAgICAgICBjb25zdCBwaCA9IHBoS2V5c1tpXTtcblxuICAgICAgICBpZiAocGhWaXNpdGVkLmluZGV4T2YocGgpID09PSAtMSkge1xuICAgICAgICAgIGxldCBpbmRleCA9IHRtcGxFeHByZXNzaW9uc1twaF07XG4gICAgICAgICAgaWYgKG5nRGV2TW9kZSkge1xuICAgICAgICAgICAgYXNzZXJ0TGVzc1RoYW4oXG4gICAgICAgICAgICAgICAgaW5kZXgudG9TdHJpbmcoMikubGVuZ3RoLCAyOCwgYEluZGV4ICR7aW5kZXh9IGlzIHRvbyBiaWcgYW5kIHdpbGwgb3ZlcmZsb3dgKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgLy8gQWRkIGFuIGluc3RydWN0aW9uIHRvIHJlbW92ZSB0aGUgZXhwcmVzc2lvblxuICAgICAgICAgIHRtcGxJbnN0cnVjdGlvbnMucHVzaChpbmRleCB8IEkxOG5JbnN0cnVjdGlvbnMuUmVtb3ZlTm9kZSk7XG5cbiAgICAgICAgICBpZiAoaW5kZXggPiBtYXhJbmRleCkge1xuICAgICAgICAgICAgbWF4SW5kZXggPSBpbmRleDtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBpZiAodG1wbEluZGV4ID09PSAwICYmIHR5cGVvZiBsYXN0Q2hpbGRJbmRleCA9PT0gJ251bWJlcicpIHtcbiAgICAvLyBUaGUgY3VycmVudCBwYXJlbnQgaXMgYW4gbmctY29udGFpbmVyIGFuZCBpdCBoYXMgbW9yZSBjaGlsZHJlbiBhZnRlciB0aGUgdHJhbnNsYXRpb24gdGhhdCB3ZVxuICAgIC8vIG5lZWQgdG8gYXBwZW5kIHRvIGtlZXAgdGhlIG9yZGVyIG9mIHRoZSBET00gbm9kZXMgY29ycmVjdFxuICAgIGZvciAobGV0IGkgPSBtYXhJbmRleCArIDE7IGkgPD0gbGFzdENoaWxkSW5kZXg7IGkrKykge1xuICAgICAgaWYgKG5nRGV2TW9kZSkge1xuICAgICAgICBhc3NlcnRMZXNzVGhhbihpLnRvU3RyaW5nKDIpLmxlbmd0aCwgMjgsIGBJbmRleCAke2l9IGlzIHRvbyBiaWcgYW5kIHdpbGwgb3ZlcmZsb3dgKTtcbiAgICAgIH1cbiAgICAgIHRtcGxJbnN0cnVjdGlvbnMucHVzaChpIHwgSTE4bkluc3RydWN0aW9ucy5BbnkpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBwYXJ0SW5kZXg7XG59XG5cbi8vIFRPRE86IFJlbW92ZSBMTm9kZSBhcmcgd2hlbiB3ZSByZW1vdmUgZHluYW1pY0NvbnRhaW5lck5vZGVcbmZ1bmN0aW9uIGFwcGVuZEkxOG5Ob2RlKFxuICAgIG5vZGU6IExOb2RlLCB0Tm9kZTogVE5vZGUsIHBhcmVudFROb2RlOiBUTm9kZSwgcHJldmlvdXNUTm9kZTogVE5vZGUpOiBUTm9kZSB7XG4gIGlmIChuZ0Rldk1vZGUpIHtcbiAgICBuZ0Rldk1vZGUucmVuZGVyZXJNb3ZlTm9kZSsrO1xuICB9XG5cbiAgY29uc3Qgdmlld0RhdGEgPSBfZ2V0Vmlld0RhdGEoKTtcblxuICAvLyBPbiBmaXJzdCBwYXNzLCByZS1vcmdhbml6ZSBub2RlIHRyZWUgdG8gcHV0IHRoaXMgbm9kZSBpbiB0aGUgY29ycmVjdCBwb3NpdGlvbi5cbiAgY29uc3QgZmlyc3RUZW1wbGF0ZVBhc3MgPSB2aWV3RGF0YVtUVklFV10uZmlyc3RUZW1wbGF0ZVBhc3M7XG4gIGlmIChmaXJzdFRlbXBsYXRlUGFzcykge1xuICAgIGlmIChwcmV2aW91c1ROb2RlID09PSBwYXJlbnRUTm9kZSAmJiB0Tm9kZSAhPT0gcGFyZW50VE5vZGUuY2hpbGQpIHtcbiAgICAgIHROb2RlLm5leHQgPSBwYXJlbnRUTm9kZS5jaGlsZDtcbiAgICAgIHBhcmVudFROb2RlLmNoaWxkID0gdE5vZGU7XG4gICAgfSBlbHNlIGlmIChwcmV2aW91c1ROb2RlICE9PSBwYXJlbnRUTm9kZSAmJiB0Tm9kZSAhPT0gcHJldmlvdXNUTm9kZS5uZXh0KSB7XG4gICAgICB0Tm9kZS5uZXh0ID0gcHJldmlvdXNUTm9kZS5uZXh0O1xuICAgICAgcHJldmlvdXNUTm9kZS5uZXh0ID0gdE5vZGU7XG4gICAgfSBlbHNlIHtcbiAgICAgIHROb2RlLm5leHQgPSBudWxsO1xuICAgIH1cblxuICAgIGlmIChwYXJlbnRUTm9kZSAhPT0gdmlld0RhdGFbSE9TVF9OT0RFXSkge1xuICAgICAgdE5vZGUucGFyZW50ID0gcGFyZW50VE5vZGUgYXMgVEVsZW1lbnROb2RlO1xuICAgIH1cbiAgfVxuXG4gIGFwcGVuZENoaWxkKG5vZGUubmF0aXZlLCB0Tm9kZSwgdmlld0RhdGEpO1xuXG4gIC8vIFRlbXBsYXRlIGNvbnRhaW5lcnMgYWxzbyBoYXZlIGEgY29tbWVudCBub2RlIGZvciB0aGUgYFZpZXdDb250YWluZXJSZWZgIHRoYXQgc2hvdWxkIGJlIG1vdmVkXG4gIGlmICh0Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuQ29udGFpbmVyICYmIG5vZGUuZHluYW1pY0xDb250YWluZXJOb2RlKSB7XG4gICAgYXBwZW5kQ2hpbGQobm9kZS5keW5hbWljTENvbnRhaW5lck5vZGUubmF0aXZlLCB0Tm9kZSwgdmlld0RhdGEpO1xuICAgIHJldHVybiB0Tm9kZS5keW5hbWljQ29udGFpbmVyTm9kZSAhO1xuICB9XG5cbiAgcmV0dXJuIHROb2RlO1xufVxuXG4vKipcbiAqIFRha2VzIGEgbGlzdCBvZiBpbnN0cnVjdGlvbnMgZ2VuZXJhdGVkIGJ5IGBpMThuTWFwcGluZygpYCB0byB0cmFuc2Zvcm0gdGhlIHRlbXBsYXRlIGFjY29yZGluZ2x5LlxuICpcbiAqIEBwYXJhbSBzdGFydEluZGV4IEluZGV4IG9mIHRoZSBmaXJzdCBlbGVtZW50IHRvIHRyYW5zbGF0ZSAoZm9yIGluc3RhbmNlIHRoZSBmaXJzdCBjaGlsZCBvZiB0aGVcbiAqIGVsZW1lbnQgd2l0aCB0aGUgaTE4biBhdHRyaWJ1dGUpLlxuICogQHBhcmFtIGluc3RydWN0aW9ucyBUaGUgbGlzdCBvZiBpbnN0cnVjdGlvbnMgdG8gYXBwbHkgb24gdGhlIGN1cnJlbnQgdmlldy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGkxOG5BcHBseShzdGFydEluZGV4OiBudW1iZXIsIGluc3RydWN0aW9uczogSTE4bkluc3RydWN0aW9uW10pOiB2b2lkIHtcbiAgY29uc3Qgdmlld0RhdGEgPSBfZ2V0Vmlld0RhdGEoKTtcbiAgaWYgKG5nRGV2TW9kZSkge1xuICAgIGFzc2VydEVxdWFsKFxuICAgICAgICB2aWV3RGF0YVtCSU5ESU5HX0lOREVYXSwgdmlld0RhdGFbVFZJRVddLmJpbmRpbmdTdGFydEluZGV4LFxuICAgICAgICAnaTE4bkFwcGx5IHNob3VsZCBiZSBjYWxsZWQgYmVmb3JlIGFueSBiaW5kaW5nJyk7XG4gIH1cblxuICBpZiAoIWluc3RydWN0aW9ucykge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvbnN0IHJlbmRlcmVyID0gZ2V0UmVuZGVyZXIoKTtcbiAgY29uc3Qgc3RhcnRUTm9kZSA9IGdldFROb2RlKHN0YXJ0SW5kZXgpO1xuICBsZXQgbG9jYWxQYXJlbnRUTm9kZTogVE5vZGUgPSBzdGFydFROb2RlLnBhcmVudCB8fCB2aWV3RGF0YVtIT1NUX05PREVdICE7XG4gIGxldCBsb2NhbFByZXZpb3VzVE5vZGU6IFROb2RlID0gbG9jYWxQYXJlbnRUTm9kZTtcbiAgcmVzZXRDb21wb25lbnRTdGF0ZSgpOyAgLy8gV2UgZG9uJ3Qgd2FudCB0byBhZGQgdG8gdGhlIHRyZWUgd2l0aCB0aGUgd3JvbmcgcHJldmlvdXMgbm9kZVxuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgaW5zdHJ1Y3Rpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgaW5zdHJ1Y3Rpb24gPSBpbnN0cnVjdGlvbnNbaV0gYXMgbnVtYmVyO1xuICAgIHN3aXRjaCAoaW5zdHJ1Y3Rpb24gJiBJMThuSW5zdHJ1Y3Rpb25zLkluc3RydWN0aW9uTWFzaykge1xuICAgICAgY2FzZSBJMThuSW5zdHJ1Y3Rpb25zLkVsZW1lbnQ6XG4gICAgICAgIGNvbnN0IGVsZW1lbnRJbmRleCA9IGluc3RydWN0aW9uICYgSTE4bkluc3RydWN0aW9ucy5JbmRleE1hc2s7XG4gICAgICAgIGNvbnN0IGVsZW1lbnQ6IExOb2RlID0gbG9hZChlbGVtZW50SW5kZXgpO1xuICAgICAgICBjb25zdCBlbGVtZW50VE5vZGUgPSBnZXRUTm9kZShlbGVtZW50SW5kZXgpO1xuICAgICAgICBsb2NhbFByZXZpb3VzVE5vZGUgPVxuICAgICAgICAgICAgYXBwZW5kSTE4bk5vZGUoZWxlbWVudCwgZWxlbWVudFROb2RlLCBsb2NhbFBhcmVudFROb2RlLCBsb2NhbFByZXZpb3VzVE5vZGUpO1xuICAgICAgICBsb2NhbFBhcmVudFROb2RlID0gZWxlbWVudFROb2RlO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgSTE4bkluc3RydWN0aW9ucy5FeHByZXNzaW9uOlxuICAgICAgY2FzZSBJMThuSW5zdHJ1Y3Rpb25zLlRlbXBsYXRlUm9vdDpcbiAgICAgIGNhc2UgSTE4bkluc3RydWN0aW9ucy5Bbnk6XG4gICAgICAgIGNvbnN0IG5vZGVJbmRleCA9IGluc3RydWN0aW9uICYgSTE4bkluc3RydWN0aW9ucy5JbmRleE1hc2s7XG4gICAgICAgIGNvbnN0IG5vZGU6IExOb2RlID0gbG9hZChub2RlSW5kZXgpO1xuICAgICAgICBsb2NhbFByZXZpb3VzVE5vZGUgPVxuICAgICAgICAgICAgYXBwZW5kSTE4bk5vZGUobm9kZSwgZ2V0VE5vZGUobm9kZUluZGV4KSwgbG9jYWxQYXJlbnRUTm9kZSwgbG9jYWxQcmV2aW91c1ROb2RlKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIEkxOG5JbnN0cnVjdGlvbnMuVGV4dDpcbiAgICAgICAgaWYgKG5nRGV2TW9kZSkge1xuICAgICAgICAgIG5nRGV2TW9kZS5yZW5kZXJlckNyZWF0ZVRleHROb2RlKys7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgdmFsdWUgPSBpbnN0cnVjdGlvbnNbKytpXTtcbiAgICAgICAgY29uc3QgdGV4dFJOb2RlID0gY3JlYXRlVGV4dE5vZGUodmFsdWUsIHJlbmRlcmVyKTtcbiAgICAgICAgLy8gSWYgd2Ugd2VyZSB0byBvbmx5IGNyZWF0ZSBhIGBSTm9kZWAgdGhlbiBwcm9qZWN0aW9ucyB3b24ndCBtb3ZlIHRoZSB0ZXh0LlxuICAgICAgICAvLyBDcmVhdGUgdGV4dCBub2RlIGF0IHRoZSBjdXJyZW50IGVuZCBvZiB2aWV3RGF0YS4gTXVzdCBzdWJ0cmFjdCBoZWFkZXIgb2Zmc2V0IGJlY2F1c2VcbiAgICAgICAgLy8gY3JlYXRlTm9kZUF0SW5kZXggdGFrZXMgYSByYXcgaW5kZXggKG5vdCBhZGp1c3RlZCBieSBoZWFkZXIgb2Zmc2V0KS5cbiAgICAgICAgYWRqdXN0Qmx1ZXByaW50Rm9yTmV3Tm9kZSh2aWV3RGF0YSk7XG4gICAgICAgIGNvbnN0IGxhc3ROb2RlSW5kZXggPSB2aWV3RGF0YS5sZW5ndGggLSAxIC0gSEVBREVSX09GRlNFVDtcbiAgICAgICAgY29uc3QgdGV4dFROb2RlID1cbiAgICAgICAgICAgIGNyZWF0ZU5vZGVBdEluZGV4KGxhc3ROb2RlSW5kZXgsIFROb2RlVHlwZS5FbGVtZW50LCB0ZXh0Uk5vZGUsIG51bGwsIG51bGwpO1xuICAgICAgICBsb2NhbFByZXZpb3VzVE5vZGUgPSBhcHBlbmRJMThuTm9kZShcbiAgICAgICAgICAgIGxvYWRFbGVtZW50KGxhc3ROb2RlSW5kZXgpLCB0ZXh0VE5vZGUsIGxvY2FsUGFyZW50VE5vZGUsIGxvY2FsUHJldmlvdXNUTm9kZSk7XG4gICAgICAgIHJlc2V0Q29tcG9uZW50U3RhdGUoKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIEkxOG5JbnN0cnVjdGlvbnMuQ2xvc2VOb2RlOlxuICAgICAgICBsb2NhbFByZXZpb3VzVE5vZGUgPSBsb2NhbFBhcmVudFROb2RlO1xuICAgICAgICBsb2NhbFBhcmVudFROb2RlID0gbG9jYWxQYXJlbnRUTm9kZS5wYXJlbnQgfHwgdmlld0RhdGFbSE9TVF9OT0RFXSAhO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgSTE4bkluc3RydWN0aW9ucy5SZW1vdmVOb2RlOlxuICAgICAgICBpZiAobmdEZXZNb2RlKSB7XG4gICAgICAgICAgbmdEZXZNb2RlLnJlbmRlcmVyUmVtb3ZlTm9kZSsrO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHJlbW92ZUluZGV4ID0gaW5zdHJ1Y3Rpb24gJiBJMThuSW5zdHJ1Y3Rpb25zLkluZGV4TWFzaztcbiAgICAgICAgY29uc3QgcmVtb3ZlZE5vZGU6IExOb2RlfExDb250YWluZXJOb2RlID0gbG9hZChyZW1vdmVJbmRleCk7XG4gICAgICAgIGNvbnN0IHJlbW92ZWRUTm9kZSA9IGdldFROb2RlKHJlbW92ZUluZGV4KTtcbiAgICAgICAgcmVtb3ZlQ2hpbGQocmVtb3ZlZFROb2RlLCByZW1vdmVkTm9kZS5uYXRpdmUgfHwgbnVsbCwgdmlld0RhdGEpO1xuXG4gICAgICAgIC8vIEZvciB0ZW1wbGF0ZSBjb250YWluZXJzIHdlIGFsc28gbmVlZCB0byByZW1vdmUgdGhlaXIgYFZpZXdDb250YWluZXJSZWZgIGZyb20gdGhlIERPTVxuICAgICAgICBpZiAocmVtb3ZlZFROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5Db250YWluZXIgJiYgcmVtb3ZlZE5vZGUuZHluYW1pY0xDb250YWluZXJOb2RlKSB7XG4gICAgICAgICAgcmVtb3ZlQ2hpbGQocmVtb3ZlZFROb2RlLCByZW1vdmVkTm9kZS5keW5hbWljTENvbnRhaW5lck5vZGUubmF0aXZlIHx8IG51bGwsIHZpZXdEYXRhKTtcbiAgICAgICAgICByZW1vdmVkVE5vZGUuZHluYW1pY0NvbnRhaW5lck5vZGUgIS5kZXRhY2hlZCA9IHRydWU7XG4gICAgICAgICAgcmVtb3ZlZE5vZGUuZHluYW1pY0xDb250YWluZXJOb2RlLmRhdGFbUkVOREVSX1BBUkVOVF0gPSBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIFRha2VzIGEgdHJhbnNsYXRpb24gc3RyaW5nIGFuZCB0aGUgaW5pdGlhbCBsaXN0IG9mIGV4cHJlc3Npb25zIGFuZCByZXR1cm5zIGEgbGlzdCBvZiBpbnN0cnVjdGlvbnNcbiAqIHRoYXQgd2lsbCBiZSB1c2VkIHRvIHRyYW5zbGF0ZSBhbiBhdHRyaWJ1dGUuXG4gKiBFdmVuIGluZGV4ZXMgY29udGFpbiBzdGF0aWMgc3RyaW5ncywgd2hpbGUgb2RkIGluZGV4ZXMgY29udGFpbiB0aGUgaW5kZXggb2YgdGhlIGV4cHJlc3Npb24gd2hvc2VcbiAqIHZhbHVlIHdpbGwgYmUgY29uY2F0ZW5hdGVkIGludG8gdGhlIGZpbmFsIHRyYW5zbGF0aW9uLlxuICovXG5leHBvcnQgZnVuY3Rpb24gaTE4bkV4cE1hcHBpbmcoXG4gICAgdHJhbnNsYXRpb246IHN0cmluZywgcGxhY2Vob2xkZXJzOiBQbGFjZWhvbGRlck1hcCk6IEkxOG5FeHBJbnN0cnVjdGlvbltdIHtcbiAgY29uc3Qgc3RhdGljVGV4dDogSTE4bkV4cEluc3RydWN0aW9uW10gPSB0cmFuc2xhdGlvbi5zcGxpdChpMThuVGFnUmVnZXgpO1xuICAvLyBvZGQgaW5kZXhlcyBhcmUgcGxhY2Vob2xkZXJzXG4gIGZvciAobGV0IGkgPSAxOyBpIDwgc3RhdGljVGV4dC5sZW5ndGg7IGkgKz0gMikge1xuICAgIHN0YXRpY1RleHRbaV0gPSBwbGFjZWhvbGRlcnNbc3RhdGljVGV4dFtpXV07XG4gIH1cbiAgcmV0dXJuIHN0YXRpY1RleHQ7XG59XG5cbi8qKlxuICogQ2hlY2tzIGlmIHRoZSB2YWx1ZSBvZiBhbiBleHByZXNzaW9uIGhhcyBjaGFuZ2VkIGFuZCByZXBsYWNlcyBpdCBieSBpdHMgdmFsdWUgaW4gYSB0cmFuc2xhdGlvbixcbiAqIG9yIHJldHVybnMgTk9fQ0hBTkdFLlxuICpcbiAqIEBwYXJhbSBpbnN0cnVjdGlvbnMgQSBsaXN0IG9mIGluc3RydWN0aW9ucyB0aGF0IHdpbGwgYmUgdXNlZCB0byB0cmFuc2xhdGUgYW4gYXR0cmlidXRlLlxuICogQHBhcmFtIHYwIHZhbHVlIGNoZWNrZWQgZm9yIGNoYW5nZS5cbiAqXG4gKiBAcmV0dXJucyBUaGUgY29uY2F0ZW5hdGVkIHN0cmluZyB3aGVuIGFueSBvZiB0aGUgYXJndW1lbnRzIGNoYW5nZXMsIGBOT19DSEFOR0VgIG90aGVyd2lzZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGkxOG5JbnRlcnBvbGF0aW9uMShpbnN0cnVjdGlvbnM6IEkxOG5FeHBJbnN0cnVjdGlvbltdLCB2MDogYW55KTogc3RyaW5nfE5PX0NIQU5HRSB7XG4gIGNvbnN0IGRpZmZlcmVudCA9IGJpbmRpbmdVcGRhdGVkKF9nZXRWaWV3RGF0YSgpW0JJTkRJTkdfSU5ERVhdKyssIHYwKTtcblxuICBpZiAoIWRpZmZlcmVudCkge1xuICAgIHJldHVybiBOT19DSEFOR0U7XG4gIH1cblxuICBsZXQgcmVzID0gJyc7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgaW5zdHJ1Y3Rpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgLy8gT2RkIGluZGV4ZXMgYXJlIGJpbmRpbmdzXG4gICAgaWYgKGkgJiAxKSB7XG4gICAgICByZXMgKz0gc3RyaW5naWZ5KHYwKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmVzICs9IGluc3RydWN0aW9uc1tpXTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gcmVzO1xufVxuXG4vKipcbiAqIENoZWNrcyBpZiB0aGUgdmFsdWVzIG9mIHVwIHRvIDIgZXhwcmVzc2lvbnMgaGF2ZSBjaGFuZ2VkIGFuZCByZXBsYWNlcyB0aGVtIGJ5IHRoZWlyIHZhbHVlcyBpbiBhXG4gKiB0cmFuc2xhdGlvbiwgb3IgcmV0dXJucyBOT19DSEFOR0UuXG4gKlxuICogQHBhcmFtIGluc3RydWN0aW9ucyBBIGxpc3Qgb2YgaW5zdHJ1Y3Rpb25zIHRoYXQgd2lsbCBiZSB1c2VkIHRvIHRyYW5zbGF0ZSBhbiBhdHRyaWJ1dGUuXG4gKiBAcGFyYW0gdjAgdmFsdWUgY2hlY2tlZCBmb3IgY2hhbmdlLlxuICogQHBhcmFtIHYxIHZhbHVlIGNoZWNrZWQgZm9yIGNoYW5nZS5cbiAqXG4gKiBAcmV0dXJucyBUaGUgY29uY2F0ZW5hdGVkIHN0cmluZyB3aGVuIGFueSBvZiB0aGUgYXJndW1lbnRzIGNoYW5nZXMsIGBOT19DSEFOR0VgIG90aGVyd2lzZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGkxOG5JbnRlcnBvbGF0aW9uMihpbnN0cnVjdGlvbnM6IEkxOG5FeHBJbnN0cnVjdGlvbltdLCB2MDogYW55LCB2MTogYW55KTogc3RyaW5nfFxuICAgIE5PX0NIQU5HRSB7XG4gIGNvbnN0IHZpZXdEYXRhID0gX2dldFZpZXdEYXRhKCk7XG4gIGNvbnN0IGRpZmZlcmVudCA9IGJpbmRpbmdVcGRhdGVkMih2aWV3RGF0YVtCSU5ESU5HX0lOREVYXSwgdjAsIHYxKTtcbiAgdmlld0RhdGFbQklORElOR19JTkRFWF0gKz0gMjtcblxuICBpZiAoIWRpZmZlcmVudCkge1xuICAgIHJldHVybiBOT19DSEFOR0U7XG4gIH1cblxuICBsZXQgcmVzID0gJyc7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgaW5zdHJ1Y3Rpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgLy8gT2RkIGluZGV4ZXMgYXJlIGJpbmRpbmdzXG4gICAgaWYgKGkgJiAxKSB7XG4gICAgICAvLyBFeHRyYWN0IGJpdHNcbiAgICAgIGNvbnN0IGlkeCA9IGluc3RydWN0aW9uc1tpXSBhcyBudW1iZXI7XG4gICAgICBjb25zdCBiMSA9IGlkeCAmIDE7XG4gICAgICAvLyBHZXQgdGhlIHZhbHVlIGZyb20gdGhlIGFyZ3VtZW50IHZ4IHdoZXJlIHggPSBpZHhcbiAgICAgIGNvbnN0IHZhbHVlID0gYjEgPyB2MSA6IHYwO1xuXG4gICAgICByZXMgKz0gc3RyaW5naWZ5KHZhbHVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmVzICs9IGluc3RydWN0aW9uc1tpXTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gcmVzO1xufVxuXG4vKipcbiAqIENoZWNrcyBpZiB0aGUgdmFsdWVzIG9mIHVwIHRvIDMgZXhwcmVzc2lvbnMgaGF2ZSBjaGFuZ2VkIGFuZCByZXBsYWNlcyB0aGVtIGJ5IHRoZWlyIHZhbHVlcyBpbiBhXG4gKiB0cmFuc2xhdGlvbiwgb3IgcmV0dXJucyBOT19DSEFOR0UuXG4gKlxuICogQHBhcmFtIGluc3RydWN0aW9ucyBBIGxpc3Qgb2YgaW5zdHJ1Y3Rpb25zIHRoYXQgd2lsbCBiZSB1c2VkIHRvIHRyYW5zbGF0ZSBhbiBhdHRyaWJ1dGUuXG4gKiBAcGFyYW0gdjAgdmFsdWUgY2hlY2tlZCBmb3IgY2hhbmdlLlxuICogQHBhcmFtIHYxIHZhbHVlIGNoZWNrZWQgZm9yIGNoYW5nZS5cbiAqIEBwYXJhbSB2MiB2YWx1ZSBjaGVja2VkIGZvciBjaGFuZ2UuXG4gKlxuICogQHJldHVybnMgVGhlIGNvbmNhdGVuYXRlZCBzdHJpbmcgd2hlbiBhbnkgb2YgdGhlIGFyZ3VtZW50cyBjaGFuZ2VzLCBgTk9fQ0hBTkdFYCBvdGhlcndpc2UuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpMThuSW50ZXJwb2xhdGlvbjMoXG4gICAgaW5zdHJ1Y3Rpb25zOiBJMThuRXhwSW5zdHJ1Y3Rpb25bXSwgdjA6IGFueSwgdjE6IGFueSwgdjI6IGFueSk6IHN0cmluZ3xOT19DSEFOR0Uge1xuICBjb25zdCB2aWV3RGF0YSA9IF9nZXRWaWV3RGF0YSgpO1xuICBjb25zdCBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZDModmlld0RhdGFbQklORElOR19JTkRFWF0sIHYwLCB2MSwgdjIpO1xuICB2aWV3RGF0YVtCSU5ESU5HX0lOREVYXSArPSAzO1xuXG4gIGlmICghZGlmZmVyZW50KSB7XG4gICAgcmV0dXJuIE5PX0NIQU5HRTtcbiAgfVxuXG4gIGxldCByZXMgPSAnJztcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBpbnN0cnVjdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAvLyBPZGQgaW5kZXhlcyBhcmUgYmluZGluZ3NcbiAgICBpZiAoaSAmIDEpIHtcbiAgICAgIC8vIEV4dHJhY3QgYml0c1xuICAgICAgY29uc3QgaWR4ID0gaW5zdHJ1Y3Rpb25zW2ldIGFzIG51bWJlcjtcbiAgICAgIGNvbnN0IGIyID0gaWR4ICYgMjtcbiAgICAgIGNvbnN0IGIxID0gaWR4ICYgMTtcbiAgICAgIC8vIEdldCB0aGUgdmFsdWUgZnJvbSB0aGUgYXJndW1lbnQgdnggd2hlcmUgeCA9IGlkeFxuICAgICAgY29uc3QgdmFsdWUgPSBiMiA/IHYyIDogKGIxID8gdjEgOiB2MCk7XG5cbiAgICAgIHJlcyArPSBzdHJpbmdpZnkodmFsdWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXMgKz0gaW5zdHJ1Y3Rpb25zW2ldO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiByZXM7XG59XG5cbi8qKlxuICogQ2hlY2tzIGlmIHRoZSB2YWx1ZXMgb2YgdXAgdG8gNCBleHByZXNzaW9ucyBoYXZlIGNoYW5nZWQgYW5kIHJlcGxhY2VzIHRoZW0gYnkgdGhlaXIgdmFsdWVzIGluIGFcbiAqIHRyYW5zbGF0aW9uLCBvciByZXR1cm5zIE5PX0NIQU5HRS5cbiAqXG4gKiBAcGFyYW0gaW5zdHJ1Y3Rpb25zIEEgbGlzdCBvZiBpbnN0cnVjdGlvbnMgdGhhdCB3aWxsIGJlIHVzZWQgdG8gdHJhbnNsYXRlIGFuIGF0dHJpYnV0ZS5cbiAqIEBwYXJhbSB2MCB2YWx1ZSBjaGVja2VkIGZvciBjaGFuZ2UuXG4gKiBAcGFyYW0gdjEgdmFsdWUgY2hlY2tlZCBmb3IgY2hhbmdlLlxuICogQHBhcmFtIHYyIHZhbHVlIGNoZWNrZWQgZm9yIGNoYW5nZS5cbiAqIEBwYXJhbSB2MyB2YWx1ZSBjaGVja2VkIGZvciBjaGFuZ2UuXG4gKlxuICogQHJldHVybnMgVGhlIGNvbmNhdGVuYXRlZCBzdHJpbmcgd2hlbiBhbnkgb2YgdGhlIGFyZ3VtZW50cyBjaGFuZ2VzLCBgTk9fQ0hBTkdFYCBvdGhlcndpc2UuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpMThuSW50ZXJwb2xhdGlvbjQoXG4gICAgaW5zdHJ1Y3Rpb25zOiBJMThuRXhwSW5zdHJ1Y3Rpb25bXSwgdjA6IGFueSwgdjE6IGFueSwgdjI6IGFueSwgdjM6IGFueSk6IHN0cmluZ3xOT19DSEFOR0Uge1xuICBjb25zdCB2aWV3RGF0YSA9IF9nZXRWaWV3RGF0YSgpO1xuICBjb25zdCBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZDQodmlld0RhdGFbQklORElOR19JTkRFWF0sIHYwLCB2MSwgdjIsIHYzKTtcbiAgdmlld0RhdGFbQklORElOR19JTkRFWF0gKz0gNDtcblxuICBpZiAoIWRpZmZlcmVudCkge1xuICAgIHJldHVybiBOT19DSEFOR0U7XG4gIH1cblxuICBsZXQgcmVzID0gJyc7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgaW5zdHJ1Y3Rpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgLy8gT2RkIGluZGV4ZXMgYXJlIGJpbmRpbmdzXG4gICAgaWYgKGkgJiAxKSB7XG4gICAgICAvLyBFeHRyYWN0IGJpdHNcbiAgICAgIGNvbnN0IGlkeCA9IGluc3RydWN0aW9uc1tpXSBhcyBudW1iZXI7XG4gICAgICBjb25zdCBiMiA9IGlkeCAmIDI7XG4gICAgICBjb25zdCBiMSA9IGlkeCAmIDE7XG4gICAgICAvLyBHZXQgdGhlIHZhbHVlIGZyb20gdGhlIGFyZ3VtZW50IHZ4IHdoZXJlIHggPSBpZHhcbiAgICAgIGNvbnN0IHZhbHVlID0gYjIgPyAoYjEgPyB2MyA6IHYyKSA6IChiMSA/IHYxIDogdjApO1xuXG4gICAgICByZXMgKz0gc3RyaW5naWZ5KHZhbHVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmVzICs9IGluc3RydWN0aW9uc1tpXTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gcmVzO1xufVxuXG4vKipcbiAqIENoZWNrcyBpZiB0aGUgdmFsdWVzIG9mIHVwIHRvIDUgZXhwcmVzc2lvbnMgaGF2ZSBjaGFuZ2VkIGFuZCByZXBsYWNlcyB0aGVtIGJ5IHRoZWlyIHZhbHVlcyBpbiBhXG4gKiB0cmFuc2xhdGlvbiwgb3IgcmV0dXJucyBOT19DSEFOR0UuXG4gKlxuICogQHBhcmFtIGluc3RydWN0aW9ucyBBIGxpc3Qgb2YgaW5zdHJ1Y3Rpb25zIHRoYXQgd2lsbCBiZSB1c2VkIHRvIHRyYW5zbGF0ZSBhbiBhdHRyaWJ1dGUuXG4gKiBAcGFyYW0gdjAgdmFsdWUgY2hlY2tlZCBmb3IgY2hhbmdlLlxuICogQHBhcmFtIHYxIHZhbHVlIGNoZWNrZWQgZm9yIGNoYW5nZS5cbiAqIEBwYXJhbSB2MiB2YWx1ZSBjaGVja2VkIGZvciBjaGFuZ2UuXG4gKiBAcGFyYW0gdjMgdmFsdWUgY2hlY2tlZCBmb3IgY2hhbmdlLlxuICogQHBhcmFtIHY0IHZhbHVlIGNoZWNrZWQgZm9yIGNoYW5nZS5cbiAqXG4gKiBAcmV0dXJucyBUaGUgY29uY2F0ZW5hdGVkIHN0cmluZyB3aGVuIGFueSBvZiB0aGUgYXJndW1lbnRzIGNoYW5nZXMsIGBOT19DSEFOR0VgIG90aGVyd2lzZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGkxOG5JbnRlcnBvbGF0aW9uNShcbiAgICBpbnN0cnVjdGlvbnM6IEkxOG5FeHBJbnN0cnVjdGlvbltdLCB2MDogYW55LCB2MTogYW55LCB2MjogYW55LCB2MzogYW55LCB2NDogYW55KTogc3RyaW5nfFxuICAgIE5PX0NIQU5HRSB7XG4gIGNvbnN0IHZpZXdEYXRhID0gX2dldFZpZXdEYXRhKCk7XG4gIGxldCBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZDQodmlld0RhdGFbQklORElOR19JTkRFWF0sIHYwLCB2MSwgdjIsIHYzKTtcbiAgZGlmZmVyZW50ID0gYmluZGluZ1VwZGF0ZWQodmlld0RhdGFbQklORElOR19JTkRFWF0gKyA0LCB2NCkgfHwgZGlmZmVyZW50O1xuICB2aWV3RGF0YVtCSU5ESU5HX0lOREVYXSArPSA1O1xuXG4gIGlmICghZGlmZmVyZW50KSB7XG4gICAgcmV0dXJuIE5PX0NIQU5HRTtcbiAgfVxuXG4gIGxldCByZXMgPSAnJztcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBpbnN0cnVjdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAvLyBPZGQgaW5kZXhlcyBhcmUgYmluZGluZ3NcbiAgICBpZiAoaSAmIDEpIHtcbiAgICAgIC8vIEV4dHJhY3QgYml0c1xuICAgICAgY29uc3QgaWR4ID0gaW5zdHJ1Y3Rpb25zW2ldIGFzIG51bWJlcjtcbiAgICAgIGNvbnN0IGI0ID0gaWR4ICYgNDtcbiAgICAgIGNvbnN0IGIyID0gaWR4ICYgMjtcbiAgICAgIGNvbnN0IGIxID0gaWR4ICYgMTtcbiAgICAgIC8vIEdldCB0aGUgdmFsdWUgZnJvbSB0aGUgYXJndW1lbnQgdnggd2hlcmUgeCA9IGlkeFxuICAgICAgY29uc3QgdmFsdWUgPSBiNCA/IHY0IDogKGIyID8gKGIxID8gdjMgOiB2MikgOiAoYjEgPyB2MSA6IHYwKSk7XG5cbiAgICAgIHJlcyArPSBzdHJpbmdpZnkodmFsdWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXMgKz0gaW5zdHJ1Y3Rpb25zW2ldO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiByZXM7XG59XG5cbi8qKlxuICogQ2hlY2tzIGlmIHRoZSB2YWx1ZXMgb2YgdXAgdG8gNiBleHByZXNzaW9ucyBoYXZlIGNoYW5nZWQgYW5kIHJlcGxhY2VzIHRoZW0gYnkgdGhlaXIgdmFsdWVzIGluIGFcbiAqIHRyYW5zbGF0aW9uLCBvciByZXR1cm5zIE5PX0NIQU5HRS5cbiAqXG4gKiBAcGFyYW0gaW5zdHJ1Y3Rpb25zIEEgbGlzdCBvZiBpbnN0cnVjdGlvbnMgdGhhdCB3aWxsIGJlIHVzZWQgdG8gdHJhbnNsYXRlIGFuIGF0dHJpYnV0ZS5cbiAqIEBwYXJhbSB2MCB2YWx1ZSBjaGVja2VkIGZvciBjaGFuZ2UuXG4gKiBAcGFyYW0gdjEgdmFsdWUgY2hlY2tlZCBmb3IgY2hhbmdlLlxuICogQHBhcmFtIHYyIHZhbHVlIGNoZWNrZWQgZm9yIGNoYW5nZS5cbiAqIEBwYXJhbSB2MyB2YWx1ZSBjaGVja2VkIGZvciBjaGFuZ2UuXG4gKiBAcGFyYW0gdjQgdmFsdWUgY2hlY2tlZCBmb3IgY2hhbmdlLlxuICogQHBhcmFtIHY1IHZhbHVlIGNoZWNrZWQgZm9yIGNoYW5nZS5cbiAqXG4gKiBAcmV0dXJucyBUaGUgY29uY2F0ZW5hdGVkIHN0cmluZyB3aGVuIGFueSBvZiB0aGUgYXJndW1lbnRzIGNoYW5nZXMsIGBOT19DSEFOR0VgIG90aGVyd2lzZS5cbiAqLyBleHBvcnQgZnVuY3Rpb25cbmkxOG5JbnRlcnBvbGF0aW9uNihcbiAgICBpbnN0cnVjdGlvbnM6IEkxOG5FeHBJbnN0cnVjdGlvbltdLCB2MDogYW55LCB2MTogYW55LCB2MjogYW55LCB2MzogYW55LCB2NDogYW55LCB2NTogYW55KTpcbiAgICBzdHJpbmd8Tk9fQ0hBTkdFIHtcbiAgY29uc3Qgdmlld0RhdGEgPSBfZ2V0Vmlld0RhdGEoKTtcbiAgbGV0IGRpZmZlcmVudCA9IGJpbmRpbmdVcGRhdGVkNCh2aWV3RGF0YVtCSU5ESU5HX0lOREVYXSwgdjAsIHYxLCB2MiwgdjMpO1xuICBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZDIodmlld0RhdGFbQklORElOR19JTkRFWF0gKyA0LCB2NCwgdjUpIHx8IGRpZmZlcmVudDtcbiAgdmlld0RhdGFbQklORElOR19JTkRFWF0gKz0gNjtcblxuICBpZiAoIWRpZmZlcmVudCkge1xuICAgIHJldHVybiBOT19DSEFOR0U7XG4gIH1cblxuICBsZXQgcmVzID0gJyc7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgaW5zdHJ1Y3Rpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgLy8gT2RkIGluZGV4ZXMgYXJlIGJpbmRpbmdzXG4gICAgaWYgKGkgJiAxKSB7XG4gICAgICAvLyBFeHRyYWN0IGJpdHNcbiAgICAgIGNvbnN0IGlkeCA9IGluc3RydWN0aW9uc1tpXSBhcyBudW1iZXI7XG4gICAgICBjb25zdCBiNCA9IGlkeCAmIDQ7XG4gICAgICBjb25zdCBiMiA9IGlkeCAmIDI7XG4gICAgICBjb25zdCBiMSA9IGlkeCAmIDE7XG4gICAgICAvLyBHZXQgdGhlIHZhbHVlIGZyb20gdGhlIGFyZ3VtZW50IHZ4IHdoZXJlIHggPSBpZHhcbiAgICAgIGNvbnN0IHZhbHVlID0gYjQgPyAoYjEgPyB2NSA6IHY0KSA6IChiMiA/IChiMSA/IHYzIDogdjIpIDogKGIxID8gdjEgOiB2MCkpO1xuXG4gICAgICByZXMgKz0gc3RyaW5naWZ5KHZhbHVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmVzICs9IGluc3RydWN0aW9uc1tpXTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gcmVzO1xufVxuXG4vKipcbiAqIENoZWNrcyBpZiB0aGUgdmFsdWVzIG9mIHVwIHRvIDcgZXhwcmVzc2lvbnMgaGF2ZSBjaGFuZ2VkIGFuZCByZXBsYWNlcyB0aGVtIGJ5IHRoZWlyIHZhbHVlcyBpbiBhXG4gKiB0cmFuc2xhdGlvbiwgb3IgcmV0dXJucyBOT19DSEFOR0UuXG4gKlxuICogQHBhcmFtIGluc3RydWN0aW9ucyBBIGxpc3Qgb2YgaW5zdHJ1Y3Rpb25zIHRoYXQgd2lsbCBiZSB1c2VkIHRvIHRyYW5zbGF0ZSBhbiBhdHRyaWJ1dGUuXG4gKiBAcGFyYW0gdjAgdmFsdWUgY2hlY2tlZCBmb3IgY2hhbmdlLlxuICogQHBhcmFtIHYxIHZhbHVlIGNoZWNrZWQgZm9yIGNoYW5nZS5cbiAqIEBwYXJhbSB2MiB2YWx1ZSBjaGVja2VkIGZvciBjaGFuZ2UuXG4gKiBAcGFyYW0gdjMgdmFsdWUgY2hlY2tlZCBmb3IgY2hhbmdlLlxuICogQHBhcmFtIHY0IHZhbHVlIGNoZWNrZWQgZm9yIGNoYW5nZS5cbiAqIEBwYXJhbSB2NSB2YWx1ZSBjaGVja2VkIGZvciBjaGFuZ2UuXG4gKiBAcGFyYW0gdjYgdmFsdWUgY2hlY2tlZCBmb3IgY2hhbmdlLlxuICpcbiAqIEByZXR1cm5zIFRoZSBjb25jYXRlbmF0ZWQgc3RyaW5nIHdoZW4gYW55IG9mIHRoZSBhcmd1bWVudHMgY2hhbmdlcywgYE5PX0NIQU5HRWAgb3RoZXJ3aXNlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gaTE4bkludGVycG9sYXRpb243KFxuICAgIGluc3RydWN0aW9uczogSTE4bkV4cEluc3RydWN0aW9uW10sIHYwOiBhbnksIHYxOiBhbnksIHYyOiBhbnksIHYzOiBhbnksIHY0OiBhbnksIHY1OiBhbnksXG4gICAgdjY6IGFueSk6IHN0cmluZ3xOT19DSEFOR0Uge1xuICBjb25zdCB2aWV3RGF0YSA9IF9nZXRWaWV3RGF0YSgpO1xuICBsZXQgZGlmZmVyZW50ID0gYmluZGluZ1VwZGF0ZWQ0KHZpZXdEYXRhW0JJTkRJTkdfSU5ERVhdLCB2MCwgdjEsIHYyLCB2Myk7XG4gIGRpZmZlcmVudCA9IGJpbmRpbmdVcGRhdGVkMyh2aWV3RGF0YVtCSU5ESU5HX0lOREVYXSArIDQsIHY0LCB2NSwgdjYpIHx8IGRpZmZlcmVudDtcbiAgdmlld0RhdGFbQklORElOR19JTkRFWF0gKz0gNztcblxuICBpZiAoIWRpZmZlcmVudCkge1xuICAgIHJldHVybiBOT19DSEFOR0U7XG4gIH1cblxuICBsZXQgcmVzID0gJyc7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgaW5zdHJ1Y3Rpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgLy8gT2RkIGluZGV4ZXMgYXJlIGJpbmRpbmdzXG4gICAgaWYgKGkgJiAxKSB7XG4gICAgICAvLyBFeHRyYWN0IGJpdHNcbiAgICAgIGNvbnN0IGlkeCA9IGluc3RydWN0aW9uc1tpXSBhcyBudW1iZXI7XG4gICAgICBjb25zdCBiNCA9IGlkeCAmIDQ7XG4gICAgICBjb25zdCBiMiA9IGlkeCAmIDI7XG4gICAgICBjb25zdCBiMSA9IGlkeCAmIDE7XG4gICAgICAvLyBHZXQgdGhlIHZhbHVlIGZyb20gdGhlIGFyZ3VtZW50IHZ4IHdoZXJlIHggPSBpZHhcbiAgICAgIGNvbnN0IHZhbHVlID0gYjQgPyAoYjIgPyB2NiA6IChiMSA/IHY1IDogdjQpKSA6IChiMiA/IChiMSA/IHYzIDogdjIpIDogKGIxID8gdjEgOiB2MCkpO1xuXG4gICAgICByZXMgKz0gc3RyaW5naWZ5KHZhbHVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmVzICs9IGluc3RydWN0aW9uc1tpXTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gcmVzO1xufVxuXG4vKipcbiAqIENoZWNrcyBpZiB0aGUgdmFsdWVzIG9mIHVwIHRvIDggZXhwcmVzc2lvbnMgaGF2ZSBjaGFuZ2VkIGFuZCByZXBsYWNlcyB0aGVtIGJ5IHRoZWlyIHZhbHVlcyBpbiBhXG4gKiB0cmFuc2xhdGlvbiwgb3IgcmV0dXJucyBOT19DSEFOR0UuXG4gKlxuICogQHBhcmFtIGluc3RydWN0aW9ucyBBIGxpc3Qgb2YgaW5zdHJ1Y3Rpb25zIHRoYXQgd2lsbCBiZSB1c2VkIHRvIHRyYW5zbGF0ZSBhbiBhdHRyaWJ1dGUuXG4gKiBAcGFyYW0gdjAgdmFsdWUgY2hlY2tlZCBmb3IgY2hhbmdlLlxuICogQHBhcmFtIHYxIHZhbHVlIGNoZWNrZWQgZm9yIGNoYW5nZS5cbiAqIEBwYXJhbSB2MiB2YWx1ZSBjaGVja2VkIGZvciBjaGFuZ2UuXG4gKiBAcGFyYW0gdjMgdmFsdWUgY2hlY2tlZCBmb3IgY2hhbmdlLlxuICogQHBhcmFtIHY0IHZhbHVlIGNoZWNrZWQgZm9yIGNoYW5nZS5cbiAqIEBwYXJhbSB2NSB2YWx1ZSBjaGVja2VkIGZvciBjaGFuZ2UuXG4gKiBAcGFyYW0gdjYgdmFsdWUgY2hlY2tlZCBmb3IgY2hhbmdlLlxuICogQHBhcmFtIHY3IHZhbHVlIGNoZWNrZWQgZm9yIGNoYW5nZS5cbiAqXG4gKiBAcmV0dXJucyBUaGUgY29uY2F0ZW5hdGVkIHN0cmluZyB3aGVuIGFueSBvZiB0aGUgYXJndW1lbnRzIGNoYW5nZXMsIGBOT19DSEFOR0VgIG90aGVyd2lzZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGkxOG5JbnRlcnBvbGF0aW9uOChcbiAgICBpbnN0cnVjdGlvbnM6IEkxOG5FeHBJbnN0cnVjdGlvbltdLCB2MDogYW55LCB2MTogYW55LCB2MjogYW55LCB2MzogYW55LCB2NDogYW55LCB2NTogYW55LFxuICAgIHY2OiBhbnksIHY3OiBhbnkpOiBzdHJpbmd8Tk9fQ0hBTkdFIHtcbiAgY29uc3Qgdmlld0RhdGEgPSBfZ2V0Vmlld0RhdGEoKTtcbiAgbGV0IGRpZmZlcmVudCA9IGJpbmRpbmdVcGRhdGVkNCh2aWV3RGF0YVtCSU5ESU5HX0lOREVYXSwgdjAsIHYxLCB2MiwgdjMpO1xuICBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZDQodmlld0RhdGFbQklORElOR19JTkRFWF0gKyA0LCB2NCwgdjUsIHY2LCB2NykgfHwgZGlmZmVyZW50O1xuICB2aWV3RGF0YVtCSU5ESU5HX0lOREVYXSArPSA4O1xuXG4gIGlmICghZGlmZmVyZW50KSB7XG4gICAgcmV0dXJuIE5PX0NIQU5HRTtcbiAgfVxuXG4gIGxldCByZXMgPSAnJztcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBpbnN0cnVjdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAvLyBPZGQgaW5kZXhlcyBhcmUgYmluZGluZ3NcbiAgICBpZiAoaSAmIDEpIHtcbiAgICAgIC8vIEV4dHJhY3QgYml0c1xuICAgICAgY29uc3QgaWR4ID0gaW5zdHJ1Y3Rpb25zW2ldIGFzIG51bWJlcjtcbiAgICAgIGNvbnN0IGI0ID0gaWR4ICYgNDtcbiAgICAgIGNvbnN0IGIyID0gaWR4ICYgMjtcbiAgICAgIGNvbnN0IGIxID0gaWR4ICYgMTtcbiAgICAgIC8vIEdldCB0aGUgdmFsdWUgZnJvbSB0aGUgYXJndW1lbnQgdnggd2hlcmUgeCA9IGlkeFxuICAgICAgY29uc3QgdmFsdWUgPVxuICAgICAgICAgIGI0ID8gKGIyID8gKGIxID8gdjcgOiB2NikgOiAoYjEgPyB2NSA6IHY0KSkgOiAoYjIgPyAoYjEgPyB2MyA6IHYyKSA6IChiMSA/IHYxIDogdjApKTtcblxuICAgICAgcmVzICs9IHN0cmluZ2lmeSh2YWx1ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlcyArPSBpbnN0cnVjdGlvbnNbaV07XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHJlcztcbn1cblxuLyoqXG4gKiBDcmVhdGUgYSB0cmFuc2xhdGVkIGludGVycG9sYXRpb24gYmluZGluZyB3aXRoIGEgdmFyaWFibGUgbnVtYmVyIG9mIGV4cHJlc3Npb25zLlxuICpcbiAqIElmIHRoZXJlIGFyZSAxIHRvIDggZXhwcmVzc2lvbnMgdGhlbiBgaTE4bkludGVycG9sYXRpb24oKWAgc2hvdWxkIGJlIHVzZWQgaW5zdGVhZC4gSXQgaXMgZmFzdGVyXG4gKiBiZWNhdXNlIHRoZXJlIGlzIG5vIG5lZWQgdG8gY3JlYXRlIGFuIGFycmF5IG9mIGV4cHJlc3Npb25zIGFuZCBpdGVyYXRlIG92ZXIgaXQuXG4gKlxuICogQHJldHVybnMgVGhlIGNvbmNhdGVuYXRlZCBzdHJpbmcgd2hlbiBhbnkgb2YgdGhlIGFyZ3VtZW50cyBjaGFuZ2VzLCBgTk9fQ0hBTkdFYCBvdGhlcndpc2UuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpMThuSW50ZXJwb2xhdGlvblYoaW5zdHJ1Y3Rpb25zOiBJMThuRXhwSW5zdHJ1Y3Rpb25bXSwgdmFsdWVzOiBhbnlbXSk6IHN0cmluZ3xcbiAgICBOT19DSEFOR0Uge1xuICBjb25zdCB2aWV3RGF0YSA9IF9nZXRWaWV3RGF0YSgpO1xuICBsZXQgZGlmZmVyZW50ID0gZmFsc2U7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgdmFsdWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgLy8gQ2hlY2sgaWYgYmluZGluZ3MgaGF2ZSBjaGFuZ2VkXG4gICAgYmluZGluZ1VwZGF0ZWQodmlld0RhdGFbQklORElOR19JTkRFWF0rKywgdmFsdWVzW2ldKSAmJiAoZGlmZmVyZW50ID0gdHJ1ZSk7XG4gIH1cblxuICBpZiAoIWRpZmZlcmVudCkge1xuICAgIHJldHVybiBOT19DSEFOR0U7XG4gIH1cblxuICBsZXQgcmVzID0gJyc7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgaW5zdHJ1Y3Rpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgLy8gT2RkIGluZGV4ZXMgYXJlIHBsYWNlaG9sZGVyc1xuICAgIGlmIChpICYgMSkge1xuICAgICAgcmVzICs9IHN0cmluZ2lmeSh2YWx1ZXNbaW5zdHJ1Y3Rpb25zW2ldIGFzIG51bWJlcl0pO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXMgKz0gaW5zdHJ1Y3Rpb25zW2ldO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiByZXM7XG59XG4iXX0=