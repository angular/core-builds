/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { assertEqual, assertLessThan } from './assert';
import { NO_CHANGE, bindingUpdated, createLNode, getPreviousOrParentNode, getRenderer, getViewData, load, resetApplicationState } from './instructions';
import { RENDER_PARENT } from './interfaces/container';
import { BINDING_INDEX, HEADER_OFFSET, TVIEW } from './interfaces/view';
import { appendChild, createTextNode, getParentLNode, removeChild } from './node_manipulation';
import { stringify } from './util';
/** @enum {number} */
const I18nInstructions = {
    Text: 536870912,
    Element: 1073741824,
    Expression: 1610612736,
    CloseNode: -2147483648,
    RemoveNode: -1610612736,
    /** Used to decode the number encoded with the instruction. */
    IndexMask: 536870911,
    /** Used to test the type of instruction. */
    InstructionMask: -536870912,
};
export { I18nInstructions };
const /** @type {?} */ i18nTagRegex = /\{\$([^}]+)\}/g;
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
 * @param {?=} tmplContainers An array of template container placeholders whose content should be ignored
 * when generating the instructions for their parent template.
 * @param {?=} lastChildIndex The index of the last child of the i18n node. Used when the i18n block is
 * an ng-container.
 *
 * @return {?} A list of instructions used to translate each template.
 */
export function i18nMapping(translation, elements, expressions, tmplContainers, lastChildIndex) {
    const /** @type {?} */ translationParts = translation.split(i18nTagRegex);
    const /** @type {?} */ instructions = [];
    generateMappingInstructions(0, translationParts, instructions, elements, expressions, tmplContainers, lastChildIndex);
    return instructions;
}
/**
 * Internal function that reads the translation parts and generates a set of instructions for each
 * template.
 *
 * See `i18nMapping()` for more details.
 *
 * @param {?} index The current index in `translationParts`.
 * @param {?} translationParts The translation string split into an array of placeholders and text
 * elements.
 * @param {?} instructions The current list of instructions to update.
 * @param {?} elements An array containing, for each template, the maps of element placeholders and
 * their indexes.
 * @param {?=} expressions An array containing, for each template, the maps of expression placeholders
 * and their indexes.
 * @param {?=} tmplContainers An array of template container placeholders whose content should be ignored
 * when generating the instructions for their parent template.
 * @param {?=} lastChildIndex The index of the last child of the i18n node. Used when the i18n block is
 * an ng-container.
 * @return {?} the current index in `translationParts`
 */
function generateMappingInstructions(index, translationParts, instructions, elements, expressions, tmplContainers, lastChildIndex) {
    const /** @type {?} */ tmplIndex = instructions.length;
    const /** @type {?} */ tmplInstructions = [];
    const /** @type {?} */ phVisited = [];
    let /** @type {?} */ openedTagCount = 0;
    let /** @type {?} */ maxIndex = 0;
    instructions.push(tmplInstructions);
    for (; index < translationParts.length; index++) {
        const /** @type {?} */ value = translationParts[index];
        // Odd indexes are placeholders
        if (index & 1) {
            let /** @type {?} */ phIndex;
            if (elements && elements[tmplIndex] &&
                typeof (phIndex = /** @type {?} */ ((elements[tmplIndex]))[value]) !== 'undefined') {
                // The placeholder represents a DOM element
                // Add an instruction to move the element
                tmplInstructions.push(phIndex | 1073741824 /* Element */);
                phVisited.push(value);
                openedTagCount++;
            }
            else if (expressions && expressions[tmplIndex] &&
                typeof (phIndex = /** @type {?} */ ((expressions[tmplIndex]))[value]) !== 'undefined') {
                // The placeholder represents an expression
                // Add an instruction to move the expression
                tmplInstructions.push(phIndex | 1610612736 /* Expression */);
                phVisited.push(value);
            }
            else { // It is a closing tag
                // It is a closing tag
                tmplInstructions.push(-2147483648 /* CloseNode */);
                if (tmplIndex > 0) {
                    openedTagCount--;
                    // If we have reached the closing tag for this template, exit the loop
                    if (openedTagCount === 0) {
                        break;
                    }
                }
            }
            if (typeof phIndex !== 'undefined' && phIndex > maxIndex) {
                maxIndex = phIndex;
            }
            if (tmplContainers && tmplContainers.indexOf(value) !== -1 &&
                tmplContainers.indexOf(value) >= tmplIndex) {
                index = generateMappingInstructions(index, translationParts, instructions, elements, expressions, tmplContainers, lastChildIndex);
            }
        }
        else if (value) {
            // It's a non-empty string, create a text node
            tmplInstructions.push(536870912 /* Text */, value);
        }
    }
    // Check if some elements from the template are missing from the translation
    if (elements) {
        const /** @type {?} */ tmplElements = elements[tmplIndex];
        if (tmplElements) {
            const /** @type {?} */ phKeys = Object.keys(tmplElements);
            for (let /** @type {?} */ i = 0; i < phKeys.length; i++) {
                const /** @type {?} */ ph = phKeys[i];
                if (phVisited.indexOf(ph) === -1) {
                    let /** @type {?} */ index = tmplElements[ph];
                    // Add an instruction to remove the element
                    tmplInstructions.push(index | -1610612736 /* RemoveNode */);
                    if (index > maxIndex) {
                        maxIndex = index;
                    }
                }
            }
        }
    }
    // Check if some expressions from the template are missing from the translation
    if (expressions) {
        const /** @type {?} */ tmplExpressions = expressions[tmplIndex];
        if (tmplExpressions) {
            const /** @type {?} */ phKeys = Object.keys(tmplExpressions);
            for (let /** @type {?} */ i = 0; i < phKeys.length; i++) {
                const /** @type {?} */ ph = phKeys[i];
                if (phVisited.indexOf(ph) === -1) {
                    let /** @type {?} */ index = tmplExpressions[ph];
                    if (ngDevMode) {
                        assertLessThan(index.toString(2).length, 28, `Index ${index} is too big and will overflow`);
                    }
                    // Add an instruction to remove the expression
                    tmplInstructions.push(index | -1610612736 /* RemoveNode */);
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
        for (let /** @type {?} */ i = maxIndex + 1; i <= lastChildIndex; i++) {
            if (ngDevMode) {
                assertLessThan(i.toString(2).length, 28, `Index ${i} is too big and will overflow`);
            }
            // We consider those additional placeholders as expressions because we don't care about
            // their children, all we need to do is to append them
            tmplInstructions.push(i | 1610612736 /* Expression */);
        }
    }
    return index;
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
    const /** @type {?} */ viewData = getViewData();
    appendChild(parentNode, node.native || null, viewData);
    // On first pass, re-organize node tree to put this node in the correct position.
    const /** @type {?} */ firstTemplatePass = node.view[TVIEW].firstTemplatePass;
    if (firstTemplatePass) {
        node.tNode.next = null;
        if (previousNode === parentNode && node.tNode !== parentNode.tNode.child) {
            node.tNode.next = parentNode.tNode.child;
            parentNode.tNode.child = node.tNode;
        }
        else if (previousNode !== parentNode && node.tNode !== previousNode.tNode.next) {
            node.tNode.next = previousNode.tNode.next;
            previousNode.tNode.next = node.tNode;
        }
    }
    // Template containers also have a comment node for the `ViewContainerRef` that should be moved
    if (node.tNode.type === 0 /* Container */ && node.dynamicLContainerNode) {
        // (node.native as RComment).textContent = 'test';
        // console.log(node.native);
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
    const /** @type {?} */ viewData = getViewData();
    if (ngDevMode) {
        assertEqual(viewData[BINDING_INDEX], -1, 'i18nApply should be called before any binding');
    }
    if (!instructions) {
        return;
    }
    const /** @type {?} */ renderer = getRenderer();
    let /** @type {?} */ localParentNode = getParentLNode(load(startIndex)) || getPreviousOrParentNode();
    let /** @type {?} */ localPreviousNode = localParentNode;
    resetApplicationState(); // We don't want to add to the tree with the wrong previous node
    for (let /** @type {?} */ i = 0; i < instructions.length; i++) {
        const /** @type {?} */ instruction = /** @type {?} */ (instructions[i]);
        switch (instruction & -536870912 /* InstructionMask */) {
            case 1073741824 /* Element */:
                const /** @type {?} */ element = load(instruction & 536870911 /* IndexMask */);
                localPreviousNode = appendI18nNode(element, localParentNode, localPreviousNode);
                localParentNode = element;
                break;
            case 1610612736 /* Expression */:
                const /** @type {?} */ expr = load(instruction & 536870911 /* IndexMask */);
                localPreviousNode = appendI18nNode(expr, localParentNode, localPreviousNode);
                break;
            case 536870912 /* Text */:
                if (ngDevMode) {
                    ngDevMode.rendererCreateTextNode++;
                }
                const /** @type {?} */ value = instructions[++i];
                const /** @type {?} */ textRNode = createTextNode(value, renderer);
                // If we were to only create a `RNode` then projections won't move the text.
                // Create text node at the current end of viewData. Must subtract header offset because
                // createLNode takes a raw index (not adjusted by header offset).
                const /** @type {?} */ textLNode = createLNode(viewData.length - HEADER_OFFSET, 3 /* Element */, textRNode, null, null);
                localPreviousNode = appendI18nNode(textLNode, localParentNode, localPreviousNode);
                resetApplicationState();
                break;
            case -2147483648 /* CloseNode */:
                localPreviousNode = localParentNode;
                localParentNode = /** @type {?} */ ((getParentLNode(localParentNode)));
                break;
            case -1610612736 /* RemoveNode */:
                if (ngDevMode) {
                    ngDevMode.rendererRemoveNode++;
                }
                const /** @type {?} */ index = instruction & 536870911 /* IndexMask */;
                const /** @type {?} */ removedNode = load(index);
                const /** @type {?} */ parentNode = /** @type {?} */ ((getParentLNode(removedNode)));
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
    const /** @type {?} */ staticText = translation.split(i18nTagRegex);
    // odd indexes are placeholders
    for (let /** @type {?} */ i = 1; i < staticText.length; i += 2) {
        staticText[i] = placeholders[staticText[i]];
    }
    return staticText;
}
/**
 * Checks if the value of up to 8 expressions have changed and replaces them by their values in a
 * translation, or returns NO_CHANGE.
 *
 * @param {?} instructions
 * @param {?} numberOfExp
 * @param {?} v0
 * @param {?=} v1
 * @param {?=} v2
 * @param {?=} v3
 * @param {?=} v4
 * @param {?=} v5
 * @param {?=} v6
 * @param {?=} v7
 * @return {?} The concatenated string when any of the arguments changes, `NO_CHANGE` otherwise.
 */
export function i18nInterpolation(instructions, numberOfExp, v0, v1, v2, v3, v4, v5, v6, v7) {
    let /** @type {?} */ different = bindingUpdated(v0);
    if (numberOfExp > 1) {
        different = bindingUpdated(v1) || different;
        if (numberOfExp > 2) {
            different = bindingUpdated(v2) || different;
            if (numberOfExp > 3) {
                different = bindingUpdated(v3) || different;
                if (numberOfExp > 4) {
                    different = bindingUpdated(v4) || different;
                    if (numberOfExp > 5) {
                        different = bindingUpdated(v5) || different;
                        if (numberOfExp > 6) {
                            different = bindingUpdated(v6) || different;
                            if (numberOfExp > 7) {
                                different = bindingUpdated(v7) || different;
                            }
                        }
                    }
                }
            }
        }
    }
    if (!different) {
        return NO_CHANGE;
    }
    let /** @type {?} */ res = '';
    for (let /** @type {?} */ i = 0; i < instructions.length; i++) {
        let /** @type {?} */ value;
        // Odd indexes are placeholders
        if (i & 1) {
            switch (instructions[i]) {
                case 0:
                    value = v0;
                    break;
                case 1:
                    value = v1;
                    break;
                case 2:
                    value = v2;
                    break;
                case 3:
                    value = v3;
                    break;
                case 4:
                    value = v4;
                    break;
                case 5:
                    value = v5;
                    break;
                case 6:
                    value = v6;
                    break;
                case 7:
                    value = v7;
                    break;
            }
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
    let /** @type {?} */ different = false;
    for (let /** @type {?} */ i = 0; i < values.length; i++) {
        // Check if bindings have changed
        bindingUpdated(values[i]) && (different = true);
    }
    if (!different) {
        return NO_CHANGE;
    }
    let /** @type {?} */ res = '';
    for (let /** @type {?} */ i = 0; i < instructions.length; i++) {
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaTE4bi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaTE4bi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQVFBLE9BQU8sRUFBQyxXQUFXLEVBQUUsY0FBYyxFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQ3JELE9BQU8sRUFBQyxTQUFTLEVBQUUsY0FBYyxFQUFFLFdBQVcsRUFBRSx1QkFBdUIsRUFBRSxXQUFXLEVBQUUsV0FBVyxFQUFFLElBQUksRUFBRSxxQkFBcUIsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBQ3RKLE9BQU8sRUFBQyxhQUFhLEVBQUMsTUFBTSx3QkFBd0IsQ0FBQztBQUVyRCxPQUFPLEVBQUMsYUFBYSxFQUFFLGFBQWEsRUFBRSxLQUFLLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUN0RSxPQUFPLEVBQUMsV0FBVyxFQUFFLGNBQWMsRUFBRSxjQUFjLEVBQUUsV0FBVyxFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDN0YsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLFFBQVEsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7QUFrQ2pDLHVCQUFNLFlBQVksR0FBRyxnQkFBZ0IsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQXVCdEMsTUFBTSxzQkFDRixXQUFtQixFQUFFLFFBQTBDLEVBQy9ELFdBQThDLEVBQUUsY0FBZ0MsRUFDaEYsY0FBOEI7SUFDaEMsdUJBQU0sZ0JBQWdCLEdBQUcsV0FBVyxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUMsQ0FBQztJQUN6RCx1QkFBTSxZQUFZLEdBQXdCLEVBQUUsQ0FBQztJQUU3QywyQkFBMkIsQ0FDdkIsQ0FBQyxFQUFFLGdCQUFnQixFQUFFLFlBQVksRUFBRSxRQUFRLEVBQUUsV0FBVyxFQUFFLGNBQWMsRUFBRSxjQUFjLENBQUMsQ0FBQztJQUU5RixPQUFPLFlBQVksQ0FBQztDQUNyQjs7Ozs7Ozs7Ozs7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QztJQUN0QixLQUFLLHFCQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7O1FBRXRDLGNBQWMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsQ0FBQztLQUNqRDtJQUVELElBQUksQ0FBQyxTQUFTLEVBQUU7UUFDZCxPQUFPLFNBQVMsQ0FBQztLQUNsQjtJQUVELHFCQUFJLEdBQUcsR0FBRyxFQUFFLENBQUM7SUFDYixLQUFLLHFCQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFlBQVksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7O1FBRTVDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRTtZQUNULEdBQUcsSUFBSSxTQUFTLENBQUMsTUFBTSxtQkFBQyxZQUFZLENBQUMsQ0FBQyxDQUFXLEVBQUMsQ0FBQyxDQUFDO1NBQ3JEO2FBQU07WUFDTCxHQUFHLElBQUksWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDO1NBQ3hCO0tBQ0Y7SUFFRCxPQUFPLEdBQUcsQ0FBQztDQUNaIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge2Fzc2VydEVxdWFsLCBhc3NlcnRMZXNzVGhhbn0gZnJvbSAnLi9hc3NlcnQnO1xuaW1wb3J0IHtOT19DSEFOR0UsIGJpbmRpbmdVcGRhdGVkLCBjcmVhdGVMTm9kZSwgZ2V0UHJldmlvdXNPclBhcmVudE5vZGUsIGdldFJlbmRlcmVyLCBnZXRWaWV3RGF0YSwgbG9hZCwgcmVzZXRBcHBsaWNhdGlvblN0YXRlfSBmcm9tICcuL2luc3RydWN0aW9ucyc7XG5pbXBvcnQge1JFTkRFUl9QQVJFTlR9IGZyb20gJy4vaW50ZXJmYWNlcy9jb250YWluZXInO1xuaW1wb3J0IHtMQ29udGFpbmVyTm9kZSwgTEVsZW1lbnROb2RlLCBMTm9kZSwgVENvbnRhaW5lck5vZGUsIFROb2RlVHlwZX0gZnJvbSAnLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtCSU5ESU5HX0lOREVYLCBIRUFERVJfT0ZGU0VULCBUVklFV30gZnJvbSAnLi9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHthcHBlbmRDaGlsZCwgY3JlYXRlVGV4dE5vZGUsIGdldFBhcmVudExOb2RlLCByZW1vdmVDaGlsZH0gZnJvbSAnLi9ub2RlX21hbmlwdWxhdGlvbic7XG5pbXBvcnQge3N0cmluZ2lmeX0gZnJvbSAnLi91dGlsJztcblxuLyoqXG4gKiBBIGxpc3Qgb2YgZmxhZ3MgdG8gZW5jb2RlIHRoZSBpMThuIGluc3RydWN0aW9ucyB1c2VkIHRvIHRyYW5zbGF0ZSB0aGUgdGVtcGxhdGUuXG4gKiBXZSBzaGlmdCB0aGUgZmxhZ3MgYnkgMjkgc28gdGhhdCAzMCAmIDMxICYgMzIgYml0cyBjb250YWlucyB0aGUgaW5zdHJ1Y3Rpb25zLlxuICovXG5leHBvcnQgY29uc3QgZW51bSBJMThuSW5zdHJ1Y3Rpb25zIHtcbiAgVGV4dCA9IDEgPDwgMjksXG4gIEVsZW1lbnQgPSAyIDw8IDI5LFxuICBFeHByZXNzaW9uID0gMyA8PCAyOSxcbiAgQ2xvc2VOb2RlID0gNCA8PCAyOSxcbiAgUmVtb3ZlTm9kZSA9IDUgPDwgMjksXG4gIC8qKiBVc2VkIHRvIGRlY29kZSB0aGUgbnVtYmVyIGVuY29kZWQgd2l0aCB0aGUgaW5zdHJ1Y3Rpb24uICovXG4gIEluZGV4TWFzayA9ICgxIDw8IDI5KSAtIDEsXG4gIC8qKiBVc2VkIHRvIHRlc3QgdGhlIHR5cGUgb2YgaW5zdHJ1Y3Rpb24uICovXG4gIEluc3RydWN0aW9uTWFzayA9IH4oKDEgPDwgMjkpIC0gMSksXG59XG5cbi8qKlxuICogUmVwcmVzZW50cyB0aGUgaW5zdHJ1Y3Rpb25zIHVzZWQgdG8gdHJhbnNsYXRlIHRoZSB0ZW1wbGF0ZS5cbiAqIEluc3RydWN0aW9ucyBjYW4gYmUgYSBwbGFjZWhvbGRlciBpbmRleCwgYSBzdGF0aWMgdGV4dCBvciBhIHNpbXBsZSBiaXQgZmllbGQgKGBJMThuRmxhZ2ApLlxuICogV2hlbiB0aGUgaW5zdHJ1Y3Rpb24gaXMgdGhlIGZsYWcgYFRleHRgLCBpdCBpcyBhbHdheXMgZm9sbG93ZWQgYnkgaXRzIHRleHQgdmFsdWUuXG4gKi9cbmV4cG9ydCB0eXBlIEkxOG5JbnN0cnVjdGlvbiA9IG51bWJlciB8IHN0cmluZztcbi8qKlxuICogUmVwcmVzZW50cyB0aGUgaW5zdHJ1Y3Rpb25zIHVzZWQgdG8gdHJhbnNsYXRlIGF0dHJpYnV0ZXMgY29udGFpbmluZyBleHByZXNzaW9ucy5cbiAqIEV2ZW4gaW5kZXhlcyBjb250YWluIHN0YXRpYyBzdHJpbmdzLCB3aGlsZSBvZGQgaW5kZXhlcyBjb250YWluIHRoZSBpbmRleCBvZiB0aGUgZXhwcmVzc2lvbiB3aG9zZVxuICogdmFsdWUgd2lsbCBiZSBjb25jYXRlbmF0ZWQgaW50byB0aGUgZmluYWwgdHJhbnNsYXRpb24uXG4gKi9cbmV4cG9ydCB0eXBlIEkxOG5FeHBJbnN0cnVjdGlvbiA9IG51bWJlciB8IHN0cmluZztcbi8qKiBNYXBwaW5nIG9mIHBsYWNlaG9sZGVyIG5hbWVzIHRvIHRoZWlyIGFic29sdXRlIGluZGV4ZXMgaW4gdGhlaXIgdGVtcGxhdGVzLiAqL1xuZXhwb3J0IHR5cGUgUGxhY2Vob2xkZXJNYXAgPSB7XG4gIFtuYW1lOiBzdHJpbmddOiBudW1iZXJcbn07XG5jb25zdCBpMThuVGFnUmVnZXggPSAvXFx7XFwkKFtefV0rKVxcfS9nO1xuXG4vKipcbiAqIFRha2VzIGEgdHJhbnNsYXRpb24gc3RyaW5nLCB0aGUgaW5pdGlhbCBsaXN0IG9mIHBsYWNlaG9sZGVycyAoZWxlbWVudHMgYW5kIGV4cHJlc3Npb25zKSBhbmQgdGhlXG4gKiBpbmRleGVzIG9mIHRoZWlyIGNvcnJlc3BvbmRpbmcgZXhwcmVzc2lvbiBub2RlcyB0byByZXR1cm4gYSBsaXN0IG9mIGluc3RydWN0aW9ucyBmb3IgZWFjaFxuICogdGVtcGxhdGUgZnVuY3Rpb24uXG4gKlxuICogQmVjYXVzZSBlbWJlZGRlZCB0ZW1wbGF0ZXMgaGF2ZSBkaWZmZXJlbnQgaW5kZXhlcyBmb3IgZWFjaCBwbGFjZWhvbGRlciwgZWFjaCBwYXJhbWV0ZXIgKGV4Y2VwdFxuICogdGhlIHRyYW5zbGF0aW9uKSBpcyBhbiBhcnJheSwgd2hlcmUgZWFjaCB2YWx1ZSBjb3JyZXNwb25kcyB0byBhIGRpZmZlcmVudCB0ZW1wbGF0ZSwgYnkgb3JkZXIgb2ZcbiAqIGFwcGVhcmFuY2UuXG4gKlxuICogQHBhcmFtIHRyYW5zbGF0aW9uIEEgdHJhbnNsYXRpb24gc3RyaW5nIHdoZXJlIHBsYWNlaG9sZGVycyBhcmUgcmVwcmVzZW50ZWQgYnkgYHskbmFtZX1gXG4gKiBAcGFyYW0gZWxlbWVudHMgQW4gYXJyYXkgY29udGFpbmluZywgZm9yIGVhY2ggdGVtcGxhdGUsIHRoZSBtYXBzIG9mIGVsZW1lbnQgcGxhY2Vob2xkZXJzIGFuZFxuICogdGhlaXIgaW5kZXhlcy5cbiAqIEBwYXJhbSBleHByZXNzaW9ucyBBbiBhcnJheSBjb250YWluaW5nLCBmb3IgZWFjaCB0ZW1wbGF0ZSwgdGhlIG1hcHMgb2YgZXhwcmVzc2lvbiBwbGFjZWhvbGRlcnNcbiAqIGFuZCB0aGVpciBpbmRleGVzLlxuICogQHBhcmFtIHRtcGxDb250YWluZXJzIEFuIGFycmF5IG9mIHRlbXBsYXRlIGNvbnRhaW5lciBwbGFjZWhvbGRlcnMgd2hvc2UgY29udGVudCBzaG91bGQgYmUgaWdub3JlZFxuICogd2hlbiBnZW5lcmF0aW5nIHRoZSBpbnN0cnVjdGlvbnMgZm9yIHRoZWlyIHBhcmVudCB0ZW1wbGF0ZS5cbiAqIEBwYXJhbSBsYXN0Q2hpbGRJbmRleCBUaGUgaW5kZXggb2YgdGhlIGxhc3QgY2hpbGQgb2YgdGhlIGkxOG4gbm9kZS4gVXNlZCB3aGVuIHRoZSBpMThuIGJsb2NrIGlzXG4gKiBhbiBuZy1jb250YWluZXIuXG4gKlxuICogQHJldHVybnMgQSBsaXN0IG9mIGluc3RydWN0aW9ucyB1c2VkIHRvIHRyYW5zbGF0ZSBlYWNoIHRlbXBsYXRlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gaTE4bk1hcHBpbmcoXG4gICAgdHJhbnNsYXRpb246IHN0cmluZywgZWxlbWVudHM6IChQbGFjZWhvbGRlck1hcCB8IG51bGwpW10gfCBudWxsLFxuICAgIGV4cHJlc3Npb25zPzogKFBsYWNlaG9sZGVyTWFwIHwgbnVsbClbXSB8IG51bGwsIHRtcGxDb250YWluZXJzPzogc3RyaW5nW10gfCBudWxsLFxuICAgIGxhc3RDaGlsZEluZGV4PzogbnVtYmVyIHwgbnVsbCk6IEkxOG5JbnN0cnVjdGlvbltdW10ge1xuICBjb25zdCB0cmFuc2xhdGlvblBhcnRzID0gdHJhbnNsYXRpb24uc3BsaXQoaTE4blRhZ1JlZ2V4KTtcbiAgY29uc3QgaW5zdHJ1Y3Rpb25zOiBJMThuSW5zdHJ1Y3Rpb25bXVtdID0gW107XG5cbiAgZ2VuZXJhdGVNYXBwaW5nSW5zdHJ1Y3Rpb25zKFxuICAgICAgMCwgdHJhbnNsYXRpb25QYXJ0cywgaW5zdHJ1Y3Rpb25zLCBlbGVtZW50cywgZXhwcmVzc2lvbnMsIHRtcGxDb250YWluZXJzLCBsYXN0Q2hpbGRJbmRleCk7XG5cbiAgcmV0dXJuIGluc3RydWN0aW9ucztcbn1cblxuLyoqXG4gKiBJbnRlcm5hbCBmdW5jdGlvbiB0aGF0IHJlYWRzIHRoZSB0cmFuc2xhdGlvbiBwYXJ0cyBhbmQgZ2VuZXJhdGVzIGEgc2V0IG9mIGluc3RydWN0aW9ucyBmb3IgZWFjaFxuICogdGVtcGxhdGUuXG4gKlxuICogU2VlIGBpMThuTWFwcGluZygpYCBmb3IgbW9yZSBkZXRhaWxzLlxuICpcbiAqIEBwYXJhbSBpbmRleCBUaGUgY3VycmVudCBpbmRleCBpbiBgdHJhbnNsYXRpb25QYXJ0c2AuXG4gKiBAcGFyYW0gdHJhbnNsYXRpb25QYXJ0cyBUaGUgdHJhbnNsYXRpb24gc3RyaW5nIHNwbGl0IGludG8gYW4gYXJyYXkgb2YgcGxhY2Vob2xkZXJzIGFuZCB0ZXh0XG4gKiBlbGVtZW50cy5cbiAqIEBwYXJhbSBpbnN0cnVjdGlvbnMgVGhlIGN1cnJlbnQgbGlzdCBvZiBpbnN0cnVjdGlvbnMgdG8gdXBkYXRlLlxuICogQHBhcmFtIGVsZW1lbnRzIEFuIGFycmF5IGNvbnRhaW5pbmcsIGZvciBlYWNoIHRlbXBsYXRlLCB0aGUgbWFwcyBvZiBlbGVtZW50IHBsYWNlaG9sZGVycyBhbmRcbiAqIHRoZWlyIGluZGV4ZXMuXG4gKiBAcGFyYW0gZXhwcmVzc2lvbnMgQW4gYXJyYXkgY29udGFpbmluZywgZm9yIGVhY2ggdGVtcGxhdGUsIHRoZSBtYXBzIG9mIGV4cHJlc3Npb24gcGxhY2Vob2xkZXJzXG4gKiBhbmQgdGhlaXIgaW5kZXhlcy5cbiAqIEBwYXJhbSB0bXBsQ29udGFpbmVycyBBbiBhcnJheSBvZiB0ZW1wbGF0ZSBjb250YWluZXIgcGxhY2Vob2xkZXJzIHdob3NlIGNvbnRlbnQgc2hvdWxkIGJlIGlnbm9yZWRcbiAqIHdoZW4gZ2VuZXJhdGluZyB0aGUgaW5zdHJ1Y3Rpb25zIGZvciB0aGVpciBwYXJlbnQgdGVtcGxhdGUuXG4gKiBAcGFyYW0gbGFzdENoaWxkSW5kZXggVGhlIGluZGV4IG9mIHRoZSBsYXN0IGNoaWxkIG9mIHRoZSBpMThuIG5vZGUuIFVzZWQgd2hlbiB0aGUgaTE4biBibG9jayBpc1xuICogYW4gbmctY29udGFpbmVyLlxuICogQHJldHVybnMgdGhlIGN1cnJlbnQgaW5kZXggaW4gYHRyYW5zbGF0aW9uUGFydHNgXG4gKi9cbmZ1bmN0aW9uIGdlbmVyYXRlTWFwcGluZ0luc3RydWN0aW9ucyhcbiAgICBpbmRleDogbnVtYmVyLCB0cmFuc2xhdGlvblBhcnRzOiBzdHJpbmdbXSwgaW5zdHJ1Y3Rpb25zOiBJMThuSW5zdHJ1Y3Rpb25bXVtdLFxuICAgIGVsZW1lbnRzOiAoUGxhY2Vob2xkZXJNYXAgfCBudWxsKVtdIHwgbnVsbCwgZXhwcmVzc2lvbnM/OiAoUGxhY2Vob2xkZXJNYXAgfCBudWxsKVtdIHwgbnVsbCxcbiAgICB0bXBsQ29udGFpbmVycz86IHN0cmluZ1tdIHwgbnVsbCwgbGFzdENoaWxkSW5kZXg/OiBudW1iZXIgfCBudWxsKTogbnVtYmVyIHtcbiAgY29uc3QgdG1wbEluZGV4ID0gaW5zdHJ1Y3Rpb25zLmxlbmd0aDtcbiAgY29uc3QgdG1wbEluc3RydWN0aW9uczogSTE4bkluc3RydWN0aW9uW10gPSBbXTtcbiAgY29uc3QgcGhWaXNpdGVkID0gW107XG4gIGxldCBvcGVuZWRUYWdDb3VudCA9IDA7XG4gIGxldCBtYXhJbmRleCA9IDA7XG5cbiAgaW5zdHJ1Y3Rpb25zLnB1c2godG1wbEluc3RydWN0aW9ucyk7XG5cbiAgZm9yICg7IGluZGV4IDwgdHJhbnNsYXRpb25QYXJ0cy5sZW5ndGg7IGluZGV4KyspIHtcbiAgICBjb25zdCB2YWx1ZSA9IHRyYW5zbGF0aW9uUGFydHNbaW5kZXhdO1xuXG4gICAgLy8gT2RkIGluZGV4ZXMgYXJlIHBsYWNlaG9sZGVyc1xuICAgIGlmIChpbmRleCAmIDEpIHtcbiAgICAgIGxldCBwaEluZGV4O1xuXG4gICAgICBpZiAoZWxlbWVudHMgJiYgZWxlbWVudHNbdG1wbEluZGV4XSAmJlxuICAgICAgICAgIHR5cGVvZihwaEluZGV4ID0gZWxlbWVudHNbdG1wbEluZGV4XSAhW3ZhbHVlXSkgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIC8vIFRoZSBwbGFjZWhvbGRlciByZXByZXNlbnRzIGEgRE9NIGVsZW1lbnRcbiAgICAgICAgLy8gQWRkIGFuIGluc3RydWN0aW9uIHRvIG1vdmUgdGhlIGVsZW1lbnRcbiAgICAgICAgdG1wbEluc3RydWN0aW9ucy5wdXNoKHBoSW5kZXggfCBJMThuSW5zdHJ1Y3Rpb25zLkVsZW1lbnQpO1xuICAgICAgICBwaFZpc2l0ZWQucHVzaCh2YWx1ZSk7XG4gICAgICAgIG9wZW5lZFRhZ0NvdW50Kys7XG4gICAgICB9IGVsc2UgaWYgKFxuICAgICAgICAgIGV4cHJlc3Npb25zICYmIGV4cHJlc3Npb25zW3RtcGxJbmRleF0gJiZcbiAgICAgICAgICB0eXBlb2YocGhJbmRleCA9IGV4cHJlc3Npb25zW3RtcGxJbmRleF0gIVt2YWx1ZV0pICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAvLyBUaGUgcGxhY2Vob2xkZXIgcmVwcmVzZW50cyBhbiBleHByZXNzaW9uXG4gICAgICAgIC8vIEFkZCBhbiBpbnN0cnVjdGlvbiB0byBtb3ZlIHRoZSBleHByZXNzaW9uXG4gICAgICAgIHRtcGxJbnN0cnVjdGlvbnMucHVzaChwaEluZGV4IHwgSTE4bkluc3RydWN0aW9ucy5FeHByZXNzaW9uKTtcbiAgICAgICAgcGhWaXNpdGVkLnB1c2godmFsdWUpO1xuICAgICAgfSBlbHNlIHsgIC8vIEl0IGlzIGEgY2xvc2luZyB0YWdcbiAgICAgICAgdG1wbEluc3RydWN0aW9ucy5wdXNoKEkxOG5JbnN0cnVjdGlvbnMuQ2xvc2VOb2RlKTtcblxuICAgICAgICBpZiAodG1wbEluZGV4ID4gMCkge1xuICAgICAgICAgIG9wZW5lZFRhZ0NvdW50LS07XG5cbiAgICAgICAgICAvLyBJZiB3ZSBoYXZlIHJlYWNoZWQgdGhlIGNsb3NpbmcgdGFnIGZvciB0aGlzIHRlbXBsYXRlLCBleGl0IHRoZSBsb29wXG4gICAgICAgICAgaWYgKG9wZW5lZFRhZ0NvdW50ID09PSAwKSB7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKHR5cGVvZiBwaEluZGV4ICE9PSAndW5kZWZpbmVkJyAmJiBwaEluZGV4ID4gbWF4SW5kZXgpIHtcbiAgICAgICAgbWF4SW5kZXggPSBwaEluZGV4O1xuICAgICAgfVxuXG4gICAgICBpZiAodG1wbENvbnRhaW5lcnMgJiYgdG1wbENvbnRhaW5lcnMuaW5kZXhPZih2YWx1ZSkgIT09IC0xICYmXG4gICAgICAgICAgdG1wbENvbnRhaW5lcnMuaW5kZXhPZih2YWx1ZSkgPj0gdG1wbEluZGV4KSB7XG4gICAgICAgIGluZGV4ID0gZ2VuZXJhdGVNYXBwaW5nSW5zdHJ1Y3Rpb25zKFxuICAgICAgICAgICAgaW5kZXgsIHRyYW5zbGF0aW9uUGFydHMsIGluc3RydWN0aW9ucywgZWxlbWVudHMsIGV4cHJlc3Npb25zLCB0bXBsQ29udGFpbmVycyxcbiAgICAgICAgICAgIGxhc3RDaGlsZEluZGV4KTtcbiAgICAgIH1cblxuICAgIH0gZWxzZSBpZiAodmFsdWUpIHtcbiAgICAgIC8vIEl0J3MgYSBub24tZW1wdHkgc3RyaW5nLCBjcmVhdGUgYSB0ZXh0IG5vZGVcbiAgICAgIHRtcGxJbnN0cnVjdGlvbnMucHVzaChJMThuSW5zdHJ1Y3Rpb25zLlRleHQsIHZhbHVlKTtcbiAgICB9XG4gIH1cblxuICAvLyBDaGVjayBpZiBzb21lIGVsZW1lbnRzIGZyb20gdGhlIHRlbXBsYXRlIGFyZSBtaXNzaW5nIGZyb20gdGhlIHRyYW5zbGF0aW9uXG4gIGlmIChlbGVtZW50cykge1xuICAgIGNvbnN0IHRtcGxFbGVtZW50cyA9IGVsZW1lbnRzW3RtcGxJbmRleF07XG5cbiAgICBpZiAodG1wbEVsZW1lbnRzKSB7XG4gICAgICBjb25zdCBwaEtleXMgPSBPYmplY3Qua2V5cyh0bXBsRWxlbWVudHMpO1xuXG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHBoS2V5cy5sZW5ndGg7IGkrKykge1xuICAgICAgICBjb25zdCBwaCA9IHBoS2V5c1tpXTtcblxuICAgICAgICBpZiAocGhWaXNpdGVkLmluZGV4T2YocGgpID09PSAtMSkge1xuICAgICAgICAgIGxldCBpbmRleCA9IHRtcGxFbGVtZW50c1twaF07XG4gICAgICAgICAgLy8gQWRkIGFuIGluc3RydWN0aW9uIHRvIHJlbW92ZSB0aGUgZWxlbWVudFxuICAgICAgICAgIHRtcGxJbnN0cnVjdGlvbnMucHVzaChpbmRleCB8IEkxOG5JbnN0cnVjdGlvbnMuUmVtb3ZlTm9kZSk7XG5cbiAgICAgICAgICBpZiAoaW5kZXggPiBtYXhJbmRleCkge1xuICAgICAgICAgICAgbWF4SW5kZXggPSBpbmRleDtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvLyBDaGVjayBpZiBzb21lIGV4cHJlc3Npb25zIGZyb20gdGhlIHRlbXBsYXRlIGFyZSBtaXNzaW5nIGZyb20gdGhlIHRyYW5zbGF0aW9uXG4gIGlmIChleHByZXNzaW9ucykge1xuICAgIGNvbnN0IHRtcGxFeHByZXNzaW9ucyA9IGV4cHJlc3Npb25zW3RtcGxJbmRleF07XG5cbiAgICBpZiAodG1wbEV4cHJlc3Npb25zKSB7XG4gICAgICBjb25zdCBwaEtleXMgPSBPYmplY3Qua2V5cyh0bXBsRXhwcmVzc2lvbnMpO1xuXG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHBoS2V5cy5sZW5ndGg7IGkrKykge1xuICAgICAgICBjb25zdCBwaCA9IHBoS2V5c1tpXTtcblxuICAgICAgICBpZiAocGhWaXNpdGVkLmluZGV4T2YocGgpID09PSAtMSkge1xuICAgICAgICAgIGxldCBpbmRleCA9IHRtcGxFeHByZXNzaW9uc1twaF07XG4gICAgICAgICAgaWYgKG5nRGV2TW9kZSkge1xuICAgICAgICAgICAgYXNzZXJ0TGVzc1RoYW4oXG4gICAgICAgICAgICAgICAgaW5kZXgudG9TdHJpbmcoMikubGVuZ3RoLCAyOCwgYEluZGV4ICR7aW5kZXh9IGlzIHRvbyBiaWcgYW5kIHdpbGwgb3ZlcmZsb3dgKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgLy8gQWRkIGFuIGluc3RydWN0aW9uIHRvIHJlbW92ZSB0aGUgZXhwcmVzc2lvblxuICAgICAgICAgIHRtcGxJbnN0cnVjdGlvbnMucHVzaChpbmRleCB8IEkxOG5JbnN0cnVjdGlvbnMuUmVtb3ZlTm9kZSk7XG5cbiAgICAgICAgICBpZiAoaW5kZXggPiBtYXhJbmRleCkge1xuICAgICAgICAgICAgbWF4SW5kZXggPSBpbmRleDtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBpZiAodG1wbEluZGV4ID09PSAwICYmIHR5cGVvZiBsYXN0Q2hpbGRJbmRleCA9PT0gJ251bWJlcicpIHtcbiAgICAvLyBUaGUgY3VycmVudCBwYXJlbnQgaXMgYW4gbmctY29udGFpbmVyIGFuZCBpdCBoYXMgbW9yZSBjaGlsZHJlbiBhZnRlciB0aGUgdHJhbnNsYXRpb24gdGhhdCB3ZVxuICAgIC8vIG5lZWQgdG8gYXBwZW5kIHRvIGtlZXAgdGhlIG9yZGVyIG9mIHRoZSBET00gbm9kZXMgY29ycmVjdFxuICAgIGZvciAobGV0IGkgPSBtYXhJbmRleCArIDE7IGkgPD0gbGFzdENoaWxkSW5kZXg7IGkrKykge1xuICAgICAgaWYgKG5nRGV2TW9kZSkge1xuICAgICAgICBhc3NlcnRMZXNzVGhhbihpLnRvU3RyaW5nKDIpLmxlbmd0aCwgMjgsIGBJbmRleCAke2l9IGlzIHRvbyBiaWcgYW5kIHdpbGwgb3ZlcmZsb3dgKTtcbiAgICAgIH1cbiAgICAgIC8vIFdlIGNvbnNpZGVyIHRob3NlIGFkZGl0aW9uYWwgcGxhY2Vob2xkZXJzIGFzIGV4cHJlc3Npb25zIGJlY2F1c2Ugd2UgZG9uJ3QgY2FyZSBhYm91dFxuICAgICAgLy8gdGhlaXIgY2hpbGRyZW4sIGFsbCB3ZSBuZWVkIHRvIGRvIGlzIHRvIGFwcGVuZCB0aGVtXG4gICAgICB0bXBsSW5zdHJ1Y3Rpb25zLnB1c2goaSB8IEkxOG5JbnN0cnVjdGlvbnMuRXhwcmVzc2lvbik7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGluZGV4O1xufVxuXG5mdW5jdGlvbiBhcHBlbmRJMThuTm9kZShub2RlOiBMTm9kZSwgcGFyZW50Tm9kZTogTE5vZGUsIHByZXZpb3VzTm9kZTogTE5vZGUpIHtcbiAgaWYgKG5nRGV2TW9kZSkge1xuICAgIG5nRGV2TW9kZS5yZW5kZXJlck1vdmVOb2RlKys7XG4gIH1cblxuICBjb25zdCB2aWV3RGF0YSA9IGdldFZpZXdEYXRhKCk7XG5cbiAgYXBwZW5kQ2hpbGQocGFyZW50Tm9kZSwgbm9kZS5uYXRpdmUgfHwgbnVsbCwgdmlld0RhdGEpO1xuXG4gIC8vIE9uIGZpcnN0IHBhc3MsIHJlLW9yZ2FuaXplIG5vZGUgdHJlZSB0byBwdXQgdGhpcyBub2RlIGluIHRoZSBjb3JyZWN0IHBvc2l0aW9uLlxuICBjb25zdCBmaXJzdFRlbXBsYXRlUGFzcyA9IG5vZGUudmlld1tUVklFV10uZmlyc3RUZW1wbGF0ZVBhc3M7XG4gIGlmIChmaXJzdFRlbXBsYXRlUGFzcykge1xuICAgIG5vZGUudE5vZGUubmV4dCA9IG51bGw7XG4gICAgaWYgKHByZXZpb3VzTm9kZSA9PT0gcGFyZW50Tm9kZSAmJiBub2RlLnROb2RlICE9PSBwYXJlbnROb2RlLnROb2RlLmNoaWxkKSB7XG4gICAgICBub2RlLnROb2RlLm5leHQgPSBwYXJlbnROb2RlLnROb2RlLmNoaWxkO1xuICAgICAgcGFyZW50Tm9kZS50Tm9kZS5jaGlsZCA9IG5vZGUudE5vZGU7XG4gICAgfSBlbHNlIGlmIChwcmV2aW91c05vZGUgIT09IHBhcmVudE5vZGUgJiYgbm9kZS50Tm9kZSAhPT0gcHJldmlvdXNOb2RlLnROb2RlLm5leHQpIHtcbiAgICAgIG5vZGUudE5vZGUubmV4dCA9IHByZXZpb3VzTm9kZS50Tm9kZS5uZXh0O1xuICAgICAgcHJldmlvdXNOb2RlLnROb2RlLm5leHQgPSBub2RlLnROb2RlO1xuICAgIH1cbiAgfVxuXG4gIC8vIFRlbXBsYXRlIGNvbnRhaW5lcnMgYWxzbyBoYXZlIGEgY29tbWVudCBub2RlIGZvciB0aGUgYFZpZXdDb250YWluZXJSZWZgIHRoYXQgc2hvdWxkIGJlIG1vdmVkXG4gIGlmIChub2RlLnROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5Db250YWluZXIgJiYgbm9kZS5keW5hbWljTENvbnRhaW5lck5vZGUpIHtcbiAgICAvLyAobm9kZS5uYXRpdmUgYXMgUkNvbW1lbnQpLnRleHRDb250ZW50ID0gJ3Rlc3QnO1xuICAgIC8vIGNvbnNvbGUubG9nKG5vZGUubmF0aXZlKTtcbiAgICBhcHBlbmRDaGlsZChwYXJlbnROb2RlLCBub2RlLmR5bmFtaWNMQ29udGFpbmVyTm9kZS5uYXRpdmUgfHwgbnVsbCwgdmlld0RhdGEpO1xuICAgIGlmIChmaXJzdFRlbXBsYXRlUGFzcykge1xuICAgICAgbm9kZS50Tm9kZS5keW5hbWljQ29udGFpbmVyTm9kZSA9IG5vZGUuZHluYW1pY0xDb250YWluZXJOb2RlLnROb2RlO1xuICAgICAgbm9kZS5keW5hbWljTENvbnRhaW5lck5vZGUudE5vZGUucGFyZW50ID0gbm9kZS50Tm9kZSBhcyBUQ29udGFpbmVyTm9kZTtcbiAgICB9XG4gICAgcmV0dXJuIG5vZGUuZHluYW1pY0xDb250YWluZXJOb2RlO1xuICB9XG5cbiAgcmV0dXJuIG5vZGU7XG59XG5cbi8qKlxuICogVGFrZXMgYSBsaXN0IG9mIGluc3RydWN0aW9ucyBnZW5lcmF0ZWQgYnkgYGkxOG5NYXBwaW5nKClgIHRvIHRyYW5zZm9ybSB0aGUgdGVtcGxhdGUgYWNjb3JkaW5nbHkuXG4gKlxuICogQHBhcmFtIHN0YXJ0SW5kZXggSW5kZXggb2YgdGhlIGZpcnN0IGVsZW1lbnQgdG8gdHJhbnNsYXRlIChmb3IgaW5zdGFuY2UgdGhlIGZpcnN0IGNoaWxkIG9mIHRoZVxuICogZWxlbWVudCB3aXRoIHRoZSBpMThuIGF0dHJpYnV0ZSkuXG4gKiBAcGFyYW0gaW5zdHJ1Y3Rpb25zIFRoZSBsaXN0IG9mIGluc3RydWN0aW9ucyB0byBhcHBseSBvbiB0aGUgY3VycmVudCB2aWV3LlxuICovXG5leHBvcnQgZnVuY3Rpb24gaTE4bkFwcGx5KHN0YXJ0SW5kZXg6IG51bWJlciwgaW5zdHJ1Y3Rpb25zOiBJMThuSW5zdHJ1Y3Rpb25bXSk6IHZvaWQge1xuICBjb25zdCB2aWV3RGF0YSA9IGdldFZpZXdEYXRhKCk7XG4gIGlmIChuZ0Rldk1vZGUpIHtcbiAgICBhc3NlcnRFcXVhbCh2aWV3RGF0YVtCSU5ESU5HX0lOREVYXSwgLTEsICdpMThuQXBwbHkgc2hvdWxkIGJlIGNhbGxlZCBiZWZvcmUgYW55IGJpbmRpbmcnKTtcbiAgfVxuXG4gIGlmICghaW5zdHJ1Y3Rpb25zKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY29uc3QgcmVuZGVyZXIgPSBnZXRSZW5kZXJlcigpO1xuICBsZXQgbG9jYWxQYXJlbnROb2RlOiBMTm9kZSA9IGdldFBhcmVudExOb2RlKGxvYWQoc3RhcnRJbmRleCkpIHx8IGdldFByZXZpb3VzT3JQYXJlbnROb2RlKCk7XG4gIGxldCBsb2NhbFByZXZpb3VzTm9kZTogTE5vZGUgPSBsb2NhbFBhcmVudE5vZGU7XG4gIHJlc2V0QXBwbGljYXRpb25TdGF0ZSgpOyAgLy8gV2UgZG9uJ3Qgd2FudCB0byBhZGQgdG8gdGhlIHRyZWUgd2l0aCB0aGUgd3JvbmcgcHJldmlvdXMgbm9kZVxuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgaW5zdHJ1Y3Rpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgaW5zdHJ1Y3Rpb24gPSBpbnN0cnVjdGlvbnNbaV0gYXMgbnVtYmVyO1xuICAgIHN3aXRjaCAoaW5zdHJ1Y3Rpb24gJiBJMThuSW5zdHJ1Y3Rpb25zLkluc3RydWN0aW9uTWFzaykge1xuICAgICAgY2FzZSBJMThuSW5zdHJ1Y3Rpb25zLkVsZW1lbnQ6XG4gICAgICAgIGNvbnN0IGVsZW1lbnQ6IExOb2RlID0gbG9hZChpbnN0cnVjdGlvbiAmIEkxOG5JbnN0cnVjdGlvbnMuSW5kZXhNYXNrKTtcbiAgICAgICAgbG9jYWxQcmV2aW91c05vZGUgPSBhcHBlbmRJMThuTm9kZShlbGVtZW50LCBsb2NhbFBhcmVudE5vZGUsIGxvY2FsUHJldmlvdXNOb2RlKTtcbiAgICAgICAgbG9jYWxQYXJlbnROb2RlID0gZWxlbWVudDtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIEkxOG5JbnN0cnVjdGlvbnMuRXhwcmVzc2lvbjpcbiAgICAgICAgY29uc3QgZXhwcjogTE5vZGUgPSBsb2FkKGluc3RydWN0aW9uICYgSTE4bkluc3RydWN0aW9ucy5JbmRleE1hc2spO1xuICAgICAgICBsb2NhbFByZXZpb3VzTm9kZSA9IGFwcGVuZEkxOG5Ob2RlKGV4cHIsIGxvY2FsUGFyZW50Tm9kZSwgbG9jYWxQcmV2aW91c05vZGUpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgSTE4bkluc3RydWN0aW9ucy5UZXh0OlxuICAgICAgICBpZiAobmdEZXZNb2RlKSB7XG4gICAgICAgICAgbmdEZXZNb2RlLnJlbmRlcmVyQ3JlYXRlVGV4dE5vZGUrKztcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB2YWx1ZSA9IGluc3RydWN0aW9uc1srK2ldO1xuICAgICAgICBjb25zdCB0ZXh0Uk5vZGUgPSBjcmVhdGVUZXh0Tm9kZSh2YWx1ZSwgcmVuZGVyZXIpO1xuICAgICAgICAvLyBJZiB3ZSB3ZXJlIHRvIG9ubHkgY3JlYXRlIGEgYFJOb2RlYCB0aGVuIHByb2plY3Rpb25zIHdvbid0IG1vdmUgdGhlIHRleHQuXG4gICAgICAgIC8vIENyZWF0ZSB0ZXh0IG5vZGUgYXQgdGhlIGN1cnJlbnQgZW5kIG9mIHZpZXdEYXRhLiBNdXN0IHN1YnRyYWN0IGhlYWRlciBvZmZzZXQgYmVjYXVzZVxuICAgICAgICAvLyBjcmVhdGVMTm9kZSB0YWtlcyBhIHJhdyBpbmRleCAobm90IGFkanVzdGVkIGJ5IGhlYWRlciBvZmZzZXQpLlxuICAgICAgICBjb25zdCB0ZXh0TE5vZGUgPVxuICAgICAgICAgICAgY3JlYXRlTE5vZGUodmlld0RhdGEubGVuZ3RoIC0gSEVBREVSX09GRlNFVCwgVE5vZGVUeXBlLkVsZW1lbnQsIHRleHRSTm9kZSwgbnVsbCwgbnVsbCk7XG4gICAgICAgIGxvY2FsUHJldmlvdXNOb2RlID0gYXBwZW5kSTE4bk5vZGUodGV4dExOb2RlLCBsb2NhbFBhcmVudE5vZGUsIGxvY2FsUHJldmlvdXNOb2RlKTtcbiAgICAgICAgcmVzZXRBcHBsaWNhdGlvblN0YXRlKCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBJMThuSW5zdHJ1Y3Rpb25zLkNsb3NlTm9kZTpcbiAgICAgICAgbG9jYWxQcmV2aW91c05vZGUgPSBsb2NhbFBhcmVudE5vZGU7XG4gICAgICAgIGxvY2FsUGFyZW50Tm9kZSA9IGdldFBhcmVudExOb2RlKGxvY2FsUGFyZW50Tm9kZSkgITtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIEkxOG5JbnN0cnVjdGlvbnMuUmVtb3ZlTm9kZTpcbiAgICAgICAgaWYgKG5nRGV2TW9kZSkge1xuICAgICAgICAgIG5nRGV2TW9kZS5yZW5kZXJlclJlbW92ZU5vZGUrKztcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBpbmRleCA9IGluc3RydWN0aW9uICYgSTE4bkluc3RydWN0aW9ucy5JbmRleE1hc2s7XG4gICAgICAgIGNvbnN0IHJlbW92ZWROb2RlOiBMTm9kZXxMQ29udGFpbmVyTm9kZSA9IGxvYWQoaW5kZXgpO1xuICAgICAgICBjb25zdCBwYXJlbnROb2RlID0gZ2V0UGFyZW50TE5vZGUocmVtb3ZlZE5vZGUpICE7XG4gICAgICAgIHJlbW92ZUNoaWxkKHBhcmVudE5vZGUsIHJlbW92ZWROb2RlLm5hdGl2ZSB8fCBudWxsLCB2aWV3RGF0YSk7XG5cbiAgICAgICAgLy8gRm9yIHRlbXBsYXRlIGNvbnRhaW5lcnMgd2UgYWxzbyBuZWVkIHRvIHJlbW92ZSB0aGVpciBgVmlld0NvbnRhaW5lclJlZmAgZnJvbSB0aGUgRE9NXG4gICAgICAgIGlmIChyZW1vdmVkTm9kZS50Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuQ29udGFpbmVyICYmIHJlbW92ZWROb2RlLmR5bmFtaWNMQ29udGFpbmVyTm9kZSkge1xuICAgICAgICAgIHJlbW92ZUNoaWxkKHBhcmVudE5vZGUsIHJlbW92ZWROb2RlLmR5bmFtaWNMQ29udGFpbmVyTm9kZS5uYXRpdmUgfHwgbnVsbCwgdmlld0RhdGEpO1xuICAgICAgICAgIHJlbW92ZWROb2RlLmR5bmFtaWNMQ29udGFpbmVyTm9kZS50Tm9kZS5kZXRhY2hlZCA9IHRydWU7XG4gICAgICAgICAgcmVtb3ZlZE5vZGUuZHluYW1pY0xDb250YWluZXJOb2RlLmRhdGFbUkVOREVSX1BBUkVOVF0gPSBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIFRha2VzIGEgdHJhbnNsYXRpb24gc3RyaW5nIGFuZCB0aGUgaW5pdGlhbCBsaXN0IG9mIGV4cHJlc3Npb25zIGFuZCByZXR1cm5zIGEgbGlzdCBvZiBpbnN0cnVjdGlvbnNcbiAqIHRoYXQgd2lsbCBiZSB1c2VkIHRvIHRyYW5zbGF0ZSBhbiBhdHRyaWJ1dGUuXG4gKiBFdmVuIGluZGV4ZXMgY29udGFpbiBzdGF0aWMgc3RyaW5ncywgd2hpbGUgb2RkIGluZGV4ZXMgY29udGFpbiB0aGUgaW5kZXggb2YgdGhlIGV4cHJlc3Npb24gd2hvc2VcbiAqIHZhbHVlIHdpbGwgYmUgY29uY2F0ZW5hdGVkIGludG8gdGhlIGZpbmFsIHRyYW5zbGF0aW9uLlxuICovXG5leHBvcnQgZnVuY3Rpb24gaTE4bkV4cE1hcHBpbmcoXG4gICAgdHJhbnNsYXRpb246IHN0cmluZywgcGxhY2Vob2xkZXJzOiBQbGFjZWhvbGRlck1hcCk6IEkxOG5FeHBJbnN0cnVjdGlvbltdIHtcbiAgY29uc3Qgc3RhdGljVGV4dDogSTE4bkV4cEluc3RydWN0aW9uW10gPSB0cmFuc2xhdGlvbi5zcGxpdChpMThuVGFnUmVnZXgpO1xuICAvLyBvZGQgaW5kZXhlcyBhcmUgcGxhY2Vob2xkZXJzXG4gIGZvciAobGV0IGkgPSAxOyBpIDwgc3RhdGljVGV4dC5sZW5ndGg7IGkgKz0gMikge1xuICAgIHN0YXRpY1RleHRbaV0gPSBwbGFjZWhvbGRlcnNbc3RhdGljVGV4dFtpXV07XG4gIH1cbiAgcmV0dXJuIHN0YXRpY1RleHQ7XG59XG5cbi8qKlxuICogQ2hlY2tzIGlmIHRoZSB2YWx1ZSBvZiB1cCB0byA4IGV4cHJlc3Npb25zIGhhdmUgY2hhbmdlZCBhbmQgcmVwbGFjZXMgdGhlbSBieSB0aGVpciB2YWx1ZXMgaW4gYVxuICogdHJhbnNsYXRpb24sIG9yIHJldHVybnMgTk9fQ0hBTkdFLlxuICpcbiAqIEByZXR1cm5zIFRoZSBjb25jYXRlbmF0ZWQgc3RyaW5nIHdoZW4gYW55IG9mIHRoZSBhcmd1bWVudHMgY2hhbmdlcywgYE5PX0NIQU5HRWAgb3RoZXJ3aXNlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gaTE4bkludGVycG9sYXRpb24oXG4gICAgaW5zdHJ1Y3Rpb25zOiBJMThuRXhwSW5zdHJ1Y3Rpb25bXSwgbnVtYmVyT2ZFeHA6IG51bWJlciwgdjA6IGFueSwgdjE/OiBhbnksIHYyPzogYW55LCB2Mz86IGFueSxcbiAgICB2ND86IGFueSwgdjU/OiBhbnksIHY2PzogYW55LCB2Nz86IGFueSk6IHN0cmluZ3xOT19DSEFOR0Uge1xuICBsZXQgZGlmZmVyZW50ID0gYmluZGluZ1VwZGF0ZWQodjApO1xuXG4gIGlmIChudW1iZXJPZkV4cCA+IDEpIHtcbiAgICBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZCh2MSkgfHwgZGlmZmVyZW50O1xuXG4gICAgaWYgKG51bWJlck9mRXhwID4gMikge1xuICAgICAgZGlmZmVyZW50ID0gYmluZGluZ1VwZGF0ZWQodjIpIHx8IGRpZmZlcmVudDtcblxuICAgICAgaWYgKG51bWJlck9mRXhwID4gMykge1xuICAgICAgICBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZCh2MykgfHwgZGlmZmVyZW50O1xuXG4gICAgICAgIGlmIChudW1iZXJPZkV4cCA+IDQpIHtcbiAgICAgICAgICBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZCh2NCkgfHwgZGlmZmVyZW50O1xuXG4gICAgICAgICAgaWYgKG51bWJlck9mRXhwID4gNSkge1xuICAgICAgICAgICAgZGlmZmVyZW50ID0gYmluZGluZ1VwZGF0ZWQodjUpIHx8IGRpZmZlcmVudDtcblxuICAgICAgICAgICAgaWYgKG51bWJlck9mRXhwID4gNikge1xuICAgICAgICAgICAgICBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZCh2NikgfHwgZGlmZmVyZW50O1xuXG4gICAgICAgICAgICAgIGlmIChudW1iZXJPZkV4cCA+IDcpIHtcbiAgICAgICAgICAgICAgICBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZCh2NykgfHwgZGlmZmVyZW50O1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgaWYgKCFkaWZmZXJlbnQpIHtcbiAgICByZXR1cm4gTk9fQ0hBTkdFO1xuICB9XG5cbiAgbGV0IHJlcyA9ICcnO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGluc3RydWN0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgIGxldCB2YWx1ZTogYW55O1xuICAgIC8vIE9kZCBpbmRleGVzIGFyZSBwbGFjZWhvbGRlcnNcbiAgICBpZiAoaSAmIDEpIHtcbiAgICAgIHN3aXRjaCAoaW5zdHJ1Y3Rpb25zW2ldKSB7XG4gICAgICAgIGNhc2UgMDpcbiAgICAgICAgICB2YWx1ZSA9IHYwO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIDE6XG4gICAgICAgICAgdmFsdWUgPSB2MTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAyOlxuICAgICAgICAgIHZhbHVlID0gdjI7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgMzpcbiAgICAgICAgICB2YWx1ZSA9IHYzO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIDQ6XG4gICAgICAgICAgdmFsdWUgPSB2NDtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSA1OlxuICAgICAgICAgIHZhbHVlID0gdjU7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgNjpcbiAgICAgICAgICB2YWx1ZSA9IHY2O1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIDc6XG4gICAgICAgICAgdmFsdWUgPSB2NztcbiAgICAgICAgICBicmVhaztcbiAgICAgIH1cblxuICAgICAgcmVzICs9IHN0cmluZ2lmeSh2YWx1ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlcyArPSBpbnN0cnVjdGlvbnNbaV07XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHJlcztcbn1cblxuLyoqXG4gKiBDcmVhdGUgYSB0cmFuc2xhdGVkIGludGVycG9sYXRpb24gYmluZGluZyB3aXRoIGEgdmFyaWFibGUgbnVtYmVyIG9mIGV4cHJlc3Npb25zLlxuICpcbiAqIElmIHRoZXJlIGFyZSAxIHRvIDggZXhwcmVzc2lvbnMgdGhlbiBgaTE4bkludGVycG9sYXRpb24oKWAgc2hvdWxkIGJlIHVzZWQgaW5zdGVhZC4gSXQgaXMgZmFzdGVyXG4gKiBiZWNhdXNlIHRoZXJlIGlzIG5vIG5lZWQgdG8gY3JlYXRlIGFuIGFycmF5IG9mIGV4cHJlc3Npb25zIGFuZCBpdGVyYXRlIG92ZXIgaXQuXG4gKlxuICogQHJldHVybnMgVGhlIGNvbmNhdGVuYXRlZCBzdHJpbmcgd2hlbiBhbnkgb2YgdGhlIGFyZ3VtZW50cyBjaGFuZ2VzLCBgTk9fQ0hBTkdFYCBvdGhlcndpc2UuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpMThuSW50ZXJwb2xhdGlvblYoaW5zdHJ1Y3Rpb25zOiBJMThuRXhwSW5zdHJ1Y3Rpb25bXSwgdmFsdWVzOiBhbnlbXSk6IHN0cmluZ3xcbiAgICBOT19DSEFOR0Uge1xuICBsZXQgZGlmZmVyZW50ID0gZmFsc2U7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgdmFsdWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgLy8gQ2hlY2sgaWYgYmluZGluZ3MgaGF2ZSBjaGFuZ2VkXG4gICAgYmluZGluZ1VwZGF0ZWQodmFsdWVzW2ldKSAmJiAoZGlmZmVyZW50ID0gdHJ1ZSk7XG4gIH1cblxuICBpZiAoIWRpZmZlcmVudCkge1xuICAgIHJldHVybiBOT19DSEFOR0U7XG4gIH1cblxuICBsZXQgcmVzID0gJyc7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgaW5zdHJ1Y3Rpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgLy8gT2RkIGluZGV4ZXMgYXJlIHBsYWNlaG9sZGVyc1xuICAgIGlmIChpICYgMSkge1xuICAgICAgcmVzICs9IHN0cmluZ2lmeSh2YWx1ZXNbaW5zdHJ1Y3Rpb25zW2ldIGFzIG51bWJlcl0pO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXMgKz0gaW5zdHJ1Y3Rpb25zW2ldO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiByZXM7XG59XG4iXX0=