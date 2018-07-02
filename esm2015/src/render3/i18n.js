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
const i18nTagRegex = /\{\$([^}]+)\}/g;
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
 * @param tmplContainers An array of template container placeholders whose content should be ignored
 * when generating the instructions for their parent template.
 * @param lastChildIndex The index of the last child of the i18n node. Used when the i18n block is
 * an ng-container.
 *
 * @returns A list of instructions used to translate each template.
 */
export function i18nMapping(translation, elements, expressions, tmplContainers, lastChildIndex) {
    const translationParts = translation.split(i18nTagRegex);
    const instructions = [];
    generateMappingInstructions(0, translationParts, instructions, elements, expressions, tmplContainers, lastChildIndex);
    return instructions;
}
/**
 * Internal function that reads the translation parts and generates a set of instructions for each
 * template.
 *
 * See `i18nMapping()` for more details.
 *
 * @param index The current index in `translationParts`.
 * @param translationParts The translation string split into an array of placeholders and text
 * elements.
 * @param instructions The current list of instructions to update.
 * @param elements An array containing, for each template, the maps of element placeholders and
 * their indexes.
 * @param expressions An array containing, for each template, the maps of expression placeholders
 * and their indexes.
 * @param tmplContainers An array of template container placeholders whose content should be ignored
 * when generating the instructions for their parent template.
 * @param lastChildIndex The index of the last child of the i18n node. Used when the i18n block is
 * an ng-container.
 * @returns the current index in `translationParts`
 */
function generateMappingInstructions(index, translationParts, instructions, elements, expressions, tmplContainers, lastChildIndex) {
    const tmplIndex = instructions.length;
    const tmplInstructions = [];
    const phVisited = [];
    let openedTagCount = 0;
    let maxIndex = 0;
    instructions.push(tmplInstructions);
    for (; index < translationParts.length; index++) {
        const value = translationParts[index];
        // Odd indexes are placeholders
        if (index & 1) {
            let phIndex;
            if (elements && elements[tmplIndex] &&
                typeof (phIndex = elements[tmplIndex][value]) !== 'undefined') {
                // The placeholder represents a DOM element
                // Add an instruction to move the element
                tmplInstructions.push(phIndex | 1073741824 /* Element */);
                phVisited.push(value);
                openedTagCount++;
            }
            else if (expressions && expressions[tmplIndex] &&
                typeof (phIndex = expressions[tmplIndex][value]) !== 'undefined') {
                // The placeholder represents an expression
                // Add an instruction to move the expression
                tmplInstructions.push(phIndex | 1610612736 /* Expression */);
                phVisited.push(value);
            }
            else { // It is a closing tag
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
        const tmplElements = elements[tmplIndex];
        if (tmplElements) {
            const phKeys = Object.keys(tmplElements);
            for (let i = 0; i < phKeys.length; i++) {
                const ph = phKeys[i];
                if (phVisited.indexOf(ph) === -1) {
                    let index = tmplElements[ph];
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
        for (let i = maxIndex + 1; i <= lastChildIndex; i++) {
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
function appendI18nNode(node, parentNode, previousNode) {
    if (ngDevMode) {
        ngDevMode.rendererMoveNode++;
    }
    const viewData = getViewData();
    appendChild(parentNode, node.native || null, viewData);
    // On first pass, re-organize node tree to put this node in the correct position.
    const firstTemplatePass = node.view[TVIEW].firstTemplatePass;
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
            node.dynamicLContainerNode.tNode.parent = node.tNode;
        }
        return node.dynamicLContainerNode;
    }
    return node;
}
/**
 * Takes a list of instructions generated by `i18nMapping()` to transform the template accordingly.
 *
 * @param startIndex Index of the first element to translate (for instance the first child of the
 * element with the i18n attribute).
 * @param instructions The list of instructions to apply on the current view.
 */
export function i18nApply(startIndex, instructions) {
    const viewData = getViewData();
    if (ngDevMode) {
        assertEqual(viewData[BINDING_INDEX], -1, 'i18nApply should be called before any binding');
    }
    if (!instructions) {
        return;
    }
    const renderer = getRenderer();
    let localParentNode = getParentLNode(load(startIndex)) || getPreviousOrParentNode();
    let localPreviousNode = localParentNode;
    resetApplicationState(); // We don't want to add to the tree with the wrong previous node
    for (let i = 0; i < instructions.length; i++) {
        const instruction = instructions[i];
        switch (instruction & -536870912 /* InstructionMask */) {
            case 1073741824 /* Element */:
                const element = load(instruction & 536870911 /* IndexMask */);
                localPreviousNode = appendI18nNode(element, localParentNode, localPreviousNode);
                localParentNode = element;
                break;
            case 1610612736 /* Expression */:
                const expr = load(instruction & 536870911 /* IndexMask */);
                localPreviousNode = appendI18nNode(expr, localParentNode, localPreviousNode);
                break;
            case 536870912 /* Text */:
                if (ngDevMode) {
                    ngDevMode.rendererCreateTextNode++;
                }
                const value = instructions[++i];
                const textRNode = createTextNode(value, renderer);
                // If we were to only create a `RNode` then projections won't move the text.
                // Create text node at the current end of viewData. Must subtract header offset because
                // createLNode takes a raw index (not adjusted by header offset).
                const textLNode = createLNode(viewData.length - HEADER_OFFSET, 3 /* Element */, textRNode, null, null);
                localPreviousNode = appendI18nNode(textLNode, localParentNode, localPreviousNode);
                resetApplicationState();
                break;
            case -2147483648 /* CloseNode */:
                localPreviousNode = localParentNode;
                localParentNode = getParentLNode(localParentNode);
                break;
            case -1610612736 /* RemoveNode */:
                if (ngDevMode) {
                    ngDevMode.rendererRemoveNode++;
                }
                const index = instruction & 536870911 /* IndexMask */;
                const removedNode = load(index);
                const parentNode = getParentLNode(removedNode);
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
 * Checks if the value of up to 8 expressions have changed and replaces them by their values in a
 * translation, or returns NO_CHANGE.
 *
 * @returns The concatenated string when any of the arguments changes, `NO_CHANGE` otherwise.
 */
export function i18nInterpolation(instructions, numberOfExp, v0, v1, v2, v3, v4, v5, v6, v7) {
    let different = bindingUpdated(v0);
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
    let res = '';
    for (let i = 0; i < instructions.length; i++) {
        let value;
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
 * @returns The concatenated string when any of the arguments changes, `NO_CHANGE` otherwise.
 */
export function i18nInterpolationV(instructions, values) {
    let different = false;
    for (let i = 0; i < values.length; i++) {
        // Check if bindings have changed
        bindingUpdated(values[i]) && (different = true);
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaTE4bi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaTE4bi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsV0FBVyxFQUFFLGNBQWMsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUNyRCxPQUFPLEVBQUMsU0FBUyxFQUFFLGNBQWMsRUFBRSxXQUFXLEVBQUUsdUJBQXVCLEVBQUUsV0FBVyxFQUFFLFdBQVcsRUFBRSxJQUFJLEVBQUUscUJBQXFCLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUN0SixPQUFPLEVBQUMsYUFBYSxFQUFDLE1BQU0sd0JBQXdCLENBQUM7QUFFckQsT0FBTyxFQUFDLGFBQWEsRUFBRSxhQUFhLEVBQUUsS0FBSyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDdEUsT0FBTyxFQUFDLFdBQVcsRUFBRSxjQUFjLEVBQUUsY0FBYyxFQUFFLFdBQVcsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBQzdGLE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxRQUFRLENBQUM7QUFrQ2pDLE1BQU0sWUFBWSxHQUFHLGdCQUFnQixDQUFDO0FBRXRDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQW9CRztBQUNILE1BQU0sc0JBQ0YsV0FBbUIsRUFBRSxRQUEwQyxFQUMvRCxXQUE4QyxFQUFFLGNBQWdDLEVBQ2hGLGNBQThCO0lBQ2hDLE1BQU0sZ0JBQWdCLEdBQUcsV0FBVyxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUMsQ0FBQztJQUN6RCxNQUFNLFlBQVksR0FBd0IsRUFBRSxDQUFDO0lBRTdDLDJCQUEyQixDQUN2QixDQUFDLEVBQUUsZ0JBQWdCLEVBQUUsWUFBWSxFQUFFLFFBQVEsRUFBRSxXQUFXLEVBQUUsY0FBYyxFQUFFLGNBQWMsQ0FBQyxDQUFDO0lBRTlGLE9BQU8sWUFBWSxDQUFDO0FBQ3RCLENBQUM7QUFFRDs7Ozs7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ZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge2Fzc2VydEVxdWFsLCBhc3NlcnRMZXNzVGhhbn0gZnJvbSAnLi9hc3NlcnQnO1xuaW1wb3J0IHtOT19DSEFOR0UsIGJpbmRpbmdVcGRhdGVkLCBjcmVhdGVMTm9kZSwgZ2V0UHJldmlvdXNPclBhcmVudE5vZGUsIGdldFJlbmRlcmVyLCBnZXRWaWV3RGF0YSwgbG9hZCwgcmVzZXRBcHBsaWNhdGlvblN0YXRlfSBmcm9tICcuL2luc3RydWN0aW9ucyc7XG5pbXBvcnQge1JFTkRFUl9QQVJFTlR9IGZyb20gJy4vaW50ZXJmYWNlcy9jb250YWluZXInO1xuaW1wb3J0IHtMQ29udGFpbmVyTm9kZSwgTEVsZW1lbnROb2RlLCBMTm9kZSwgVENvbnRhaW5lck5vZGUsIFROb2RlVHlwZX0gZnJvbSAnLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtCSU5ESU5HX0lOREVYLCBIRUFERVJfT0ZGU0VULCBUVklFV30gZnJvbSAnLi9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHthcHBlbmRDaGlsZCwgY3JlYXRlVGV4dE5vZGUsIGdldFBhcmVudExOb2RlLCByZW1vdmVDaGlsZH0gZnJvbSAnLi9ub2RlX21hbmlwdWxhdGlvbic7XG5pbXBvcnQge3N0cmluZ2lmeX0gZnJvbSAnLi91dGlsJztcblxuLyoqXG4gKiBBIGxpc3Qgb2YgZmxhZ3MgdG8gZW5jb2RlIHRoZSBpMThuIGluc3RydWN0aW9ucyB1c2VkIHRvIHRyYW5zbGF0ZSB0aGUgdGVtcGxhdGUuXG4gKiBXZSBzaGlmdCB0aGUgZmxhZ3MgYnkgMjkgc28gdGhhdCAzMCAmIDMxICYgMzIgYml0cyBjb250YWlucyB0aGUgaW5zdHJ1Y3Rpb25zLlxuICovXG5leHBvcnQgY29uc3QgZW51bSBJMThuSW5zdHJ1Y3Rpb25zIHtcbiAgVGV4dCA9IDEgPDwgMjksXG4gIEVsZW1lbnQgPSAyIDw8IDI5LFxuICBFeHByZXNzaW9uID0gMyA8PCAyOSxcbiAgQ2xvc2VOb2RlID0gNCA8PCAyOSxcbiAgUmVtb3ZlTm9kZSA9IDUgPDwgMjksXG4gIC8qKiBVc2VkIHRvIGRlY29kZSB0aGUgbnVtYmVyIGVuY29kZWQgd2l0aCB0aGUgaW5zdHJ1Y3Rpb24uICovXG4gIEluZGV4TWFzayA9ICgxIDw8IDI5KSAtIDEsXG4gIC8qKiBVc2VkIHRvIHRlc3QgdGhlIHR5cGUgb2YgaW5zdHJ1Y3Rpb24uICovXG4gIEluc3RydWN0aW9uTWFzayA9IH4oKDEgPDwgMjkpIC0gMSksXG59XG5cbi8qKlxuICogUmVwcmVzZW50cyB0aGUgaW5zdHJ1Y3Rpb25zIHVzZWQgdG8gdHJhbnNsYXRlIHRoZSB0ZW1wbGF0ZS5cbiAqIEluc3RydWN0aW9ucyBjYW4gYmUgYSBwbGFjZWhvbGRlciBpbmRleCwgYSBzdGF0aWMgdGV4dCBvciBhIHNpbXBsZSBiaXQgZmllbGQgKGBJMThuRmxhZ2ApLlxuICogV2hlbiB0aGUgaW5zdHJ1Y3Rpb24gaXMgdGhlIGZsYWcgYFRleHRgLCBpdCBpcyBhbHdheXMgZm9sbG93ZWQgYnkgaXRzIHRleHQgdmFsdWUuXG4gKi9cbmV4cG9ydCB0eXBlIEkxOG5JbnN0cnVjdGlvbiA9IG51bWJlciB8IHN0cmluZztcbi8qKlxuICogUmVwcmVzZW50cyB0aGUgaW5zdHJ1Y3Rpb25zIHVzZWQgdG8gdHJhbnNsYXRlIGF0dHJpYnV0ZXMgY29udGFpbmluZyBleHByZXNzaW9ucy5cbiAqIEV2ZW4gaW5kZXhlcyBjb250YWluIHN0YXRpYyBzdHJpbmdzLCB3aGlsZSBvZGQgaW5kZXhlcyBjb250YWluIHRoZSBpbmRleCBvZiB0aGUgZXhwcmVzc2lvbiB3aG9zZVxuICogdmFsdWUgd2lsbCBiZSBjb25jYXRlbmF0ZWQgaW50byB0aGUgZmluYWwgdHJhbnNsYXRpb24uXG4gKi9cbmV4cG9ydCB0eXBlIEkxOG5FeHBJbnN0cnVjdGlvbiA9IG51bWJlciB8IHN0cmluZztcbi8qKiBNYXBwaW5nIG9mIHBsYWNlaG9sZGVyIG5hbWVzIHRvIHRoZWlyIGFic29sdXRlIGluZGV4ZXMgaW4gdGhlaXIgdGVtcGxhdGVzLiAqL1xuZXhwb3J0IHR5cGUgUGxhY2Vob2xkZXJNYXAgPSB7XG4gIFtuYW1lOiBzdHJpbmddOiBudW1iZXJcbn07XG5jb25zdCBpMThuVGFnUmVnZXggPSAvXFx7XFwkKFtefV0rKVxcfS9nO1xuXG4vKipcbiAqIFRha2VzIGEgdHJhbnNsYXRpb24gc3RyaW5nLCB0aGUgaW5pdGlhbCBsaXN0IG9mIHBsYWNlaG9sZGVycyAoZWxlbWVudHMgYW5kIGV4cHJlc3Npb25zKSBhbmQgdGhlXG4gKiBpbmRleGVzIG9mIHRoZWlyIGNvcnJlc3BvbmRpbmcgZXhwcmVzc2lvbiBub2RlcyB0byByZXR1cm4gYSBsaXN0IG9mIGluc3RydWN0aW9ucyBmb3IgZWFjaFxuICogdGVtcGxhdGUgZnVuY3Rpb24uXG4gKlxuICogQmVjYXVzZSBlbWJlZGRlZCB0ZW1wbGF0ZXMgaGF2ZSBkaWZmZXJlbnQgaW5kZXhlcyBmb3IgZWFjaCBwbGFjZWhvbGRlciwgZWFjaCBwYXJhbWV0ZXIgKGV4Y2VwdFxuICogdGhlIHRyYW5zbGF0aW9uKSBpcyBhbiBhcnJheSwgd2hlcmUgZWFjaCB2YWx1ZSBjb3JyZXNwb25kcyB0byBhIGRpZmZlcmVudCB0ZW1wbGF0ZSwgYnkgb3JkZXIgb2ZcbiAqIGFwcGVhcmFuY2UuXG4gKlxuICogQHBhcmFtIHRyYW5zbGF0aW9uIEEgdHJhbnNsYXRpb24gc3RyaW5nIHdoZXJlIHBsYWNlaG9sZGVycyBhcmUgcmVwcmVzZW50ZWQgYnkgYHskbmFtZX1gXG4gKiBAcGFyYW0gZWxlbWVudHMgQW4gYXJyYXkgY29udGFpbmluZywgZm9yIGVhY2ggdGVtcGxhdGUsIHRoZSBtYXBzIG9mIGVsZW1lbnQgcGxhY2Vob2xkZXJzIGFuZFxuICogdGhlaXIgaW5kZXhlcy5cbiAqIEBwYXJhbSBleHByZXNzaW9ucyBBbiBhcnJheSBjb250YWluaW5nLCBmb3IgZWFjaCB0ZW1wbGF0ZSwgdGhlIG1hcHMgb2YgZXhwcmVzc2lvbiBwbGFjZWhvbGRlcnNcbiAqIGFuZCB0aGVpciBpbmRleGVzLlxuICogQHBhcmFtIHRtcGxDb250YWluZXJzIEFuIGFycmF5IG9mIHRlbXBsYXRlIGNvbnRhaW5lciBwbGFjZWhvbGRlcnMgd2hvc2UgY29udGVudCBzaG91bGQgYmUgaWdub3JlZFxuICogd2hlbiBnZW5lcmF0aW5nIHRoZSBpbnN0cnVjdGlvbnMgZm9yIHRoZWlyIHBhcmVudCB0ZW1wbGF0ZS5cbiAqIEBwYXJhbSBsYXN0Q2hpbGRJbmRleCBUaGUgaW5kZXggb2YgdGhlIGxhc3QgY2hpbGQgb2YgdGhlIGkxOG4gbm9kZS4gVXNlZCB3aGVuIHRoZSBpMThuIGJsb2NrIGlzXG4gKiBhbiBuZy1jb250YWluZXIuXG4gKlxuICogQHJldHVybnMgQSBsaXN0IG9mIGluc3RydWN0aW9ucyB1c2VkIHRvIHRyYW5zbGF0ZSBlYWNoIHRlbXBsYXRlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gaTE4bk1hcHBpbmcoXG4gICAgdHJhbnNsYXRpb246IHN0cmluZywgZWxlbWVudHM6IChQbGFjZWhvbGRlck1hcCB8IG51bGwpW10gfCBudWxsLFxuICAgIGV4cHJlc3Npb25zPzogKFBsYWNlaG9sZGVyTWFwIHwgbnVsbClbXSB8IG51bGwsIHRtcGxDb250YWluZXJzPzogc3RyaW5nW10gfCBudWxsLFxuICAgIGxhc3RDaGlsZEluZGV4PzogbnVtYmVyIHwgbnVsbCk6IEkxOG5JbnN0cnVjdGlvbltdW10ge1xuICBjb25zdCB0cmFuc2xhdGlvblBhcnRzID0gdHJhbnNsYXRpb24uc3BsaXQoaTE4blRhZ1JlZ2V4KTtcbiAgY29uc3QgaW5zdHJ1Y3Rpb25zOiBJMThuSW5zdHJ1Y3Rpb25bXVtdID0gW107XG5cbiAgZ2VuZXJhdGVNYXBwaW5nSW5zdHJ1Y3Rpb25zKFxuICAgICAgMCwgdHJhbnNsYXRpb25QYXJ0cywgaW5zdHJ1Y3Rpb25zLCBlbGVtZW50cywgZXhwcmVzc2lvbnMsIHRtcGxDb250YWluZXJzLCBsYXN0Q2hpbGRJbmRleCk7XG5cbiAgcmV0dXJuIGluc3RydWN0aW9ucztcbn1cblxuLyoqXG4gKiBJbnRlcm5hbCBmdW5jdGlvbiB0aGF0IHJlYWRzIHRoZSB0cmFuc2xhdGlvbiBwYXJ0cyBhbmQgZ2VuZXJhdGVzIGEgc2V0IG9mIGluc3RydWN0aW9ucyBmb3IgZWFjaFxuICogdGVtcGxhdGUuXG4gKlxuICogU2VlIGBpMThuTWFwcGluZygpYCBmb3IgbW9yZSBkZXRhaWxzLlxuICpcbiAqIEBwYXJhbSBpbmRleCBUaGUgY3VycmVudCBpbmRleCBpbiBgdHJhbnNsYXRpb25QYXJ0c2AuXG4gKiBAcGFyYW0gdHJhbnNsYXRpb25QYXJ0cyBUaGUgdHJhbnNsYXRpb24gc3RyaW5nIHNwbGl0IGludG8gYW4gYXJyYXkgb2YgcGxhY2Vob2xkZXJzIGFuZCB0ZXh0XG4gKiBlbGVtZW50cy5cbiAqIEBwYXJhbSBpbnN0cnVjdGlvbnMgVGhlIGN1cnJlbnQgbGlzdCBvZiBpbnN0cnVjdGlvbnMgdG8gdXBkYXRlLlxuICogQHBhcmFtIGVsZW1lbnRzIEFuIGFycmF5IGNvbnRhaW5pbmcsIGZvciBlYWNoIHRlbXBsYXRlLCB0aGUgbWFwcyBvZiBlbGVtZW50IHBsYWNlaG9sZGVycyBhbmRcbiAqIHRoZWlyIGluZGV4ZXMuXG4gKiBAcGFyYW0gZXhwcmVzc2lvbnMgQW4gYXJyYXkgY29udGFpbmluZywgZm9yIGVhY2ggdGVtcGxhdGUsIHRoZSBtYXBzIG9mIGV4cHJlc3Npb24gcGxhY2Vob2xkZXJzXG4gKiBhbmQgdGhlaXIgaW5kZXhlcy5cbiAqIEBwYXJhbSB0bXBsQ29udGFpbmVycyBBbiBhcnJheSBvZiB0ZW1wbGF0ZSBjb250YWluZXIgcGxhY2Vob2xkZXJzIHdob3NlIGNvbnRlbnQgc2hvdWxkIGJlIGlnbm9yZWRcbiAqIHdoZW4gZ2VuZXJhdGluZyB0aGUgaW5zdHJ1Y3Rpb25zIGZvciB0aGVpciBwYXJlbnQgdGVtcGxhdGUuXG4gKiBAcGFyYW0gbGFzdENoaWxkSW5kZXggVGhlIGluZGV4IG9mIHRoZSBsYXN0IGNoaWxkIG9mIHRoZSBpMThuIG5vZGUuIFVzZWQgd2hlbiB0aGUgaTE4biBibG9jayBpc1xuICogYW4gbmctY29udGFpbmVyLlxuICogQHJldHVybnMgdGhlIGN1cnJlbnQgaW5kZXggaW4gYHRyYW5zbGF0aW9uUGFydHNgXG4gKi9cbmZ1bmN0aW9uIGdlbmVyYXRlTWFwcGluZ0luc3RydWN0aW9ucyhcbiAgICBpbmRleDogbnVtYmVyLCB0cmFuc2xhdGlvblBhcnRzOiBzdHJpbmdbXSwgaW5zdHJ1Y3Rpb25zOiBJMThuSW5zdHJ1Y3Rpb25bXVtdLFxuICAgIGVsZW1lbnRzOiAoUGxhY2Vob2xkZXJNYXAgfCBudWxsKVtdIHwgbnVsbCwgZXhwcmVzc2lvbnM/OiAoUGxhY2Vob2xkZXJNYXAgfCBudWxsKVtdIHwgbnVsbCxcbiAgICB0bXBsQ29udGFpbmVycz86IHN0cmluZ1tdIHwgbnVsbCwgbGFzdENoaWxkSW5kZXg/OiBudW1iZXIgfCBudWxsKTogbnVtYmVyIHtcbiAgY29uc3QgdG1wbEluZGV4ID0gaW5zdHJ1Y3Rpb25zLmxlbmd0aDtcbiAgY29uc3QgdG1wbEluc3RydWN0aW9uczogSTE4bkluc3RydWN0aW9uW10gPSBbXTtcbiAgY29uc3QgcGhWaXNpdGVkID0gW107XG4gIGxldCBvcGVuZWRUYWdDb3VudCA9IDA7XG4gIGxldCBtYXhJbmRleCA9IDA7XG5cbiAgaW5zdHJ1Y3Rpb25zLnB1c2godG1wbEluc3RydWN0aW9ucyk7XG5cbiAgZm9yICg7IGluZGV4IDwgdHJhbnNsYXRpb25QYXJ0cy5sZW5ndGg7IGluZGV4KyspIHtcbiAgICBjb25zdCB2YWx1ZSA9IHRyYW5zbGF0aW9uUGFydHNbaW5kZXhdO1xuXG4gICAgLy8gT2RkIGluZGV4ZXMgYXJlIHBsYWNlaG9sZGVyc1xuICAgIGlmIChpbmRleCAmIDEpIHtcbiAgICAgIGxldCBwaEluZGV4O1xuXG4gICAgICBpZiAoZWxlbWVudHMgJiYgZWxlbWVudHNbdG1wbEluZGV4XSAmJlxuICAgICAgICAgIHR5cGVvZihwaEluZGV4ID0gZWxlbWVudHNbdG1wbEluZGV4XSAhW3ZhbHVlXSkgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIC8vIFRoZSBwbGFjZWhvbGRlciByZXByZXNlbnRzIGEgRE9NIGVsZW1lbnRcbiAgICAgICAgLy8gQWRkIGFuIGluc3RydWN0aW9uIHRvIG1vdmUgdGhlIGVsZW1lbnRcbiAgICAgICAgdG1wbEluc3RydWN0aW9ucy5wdXNoKHBoSW5kZXggfCBJMThuSW5zdHJ1Y3Rpb25zLkVsZW1lbnQpO1xuICAgICAgICBwaFZpc2l0ZWQucHVzaCh2YWx1ZSk7XG4gICAgICAgIG9wZW5lZFRhZ0NvdW50Kys7XG4gICAgICB9IGVsc2UgaWYgKFxuICAgICAgICAgIGV4cHJlc3Npb25zICYmIGV4cHJlc3Npb25zW3RtcGxJbmRleF0gJiZcbiAgICAgICAgICB0eXBlb2YocGhJbmRleCA9IGV4cHJlc3Npb25zW3RtcGxJbmRleF0gIVt2YWx1ZV0pICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAvLyBUaGUgcGxhY2Vob2xkZXIgcmVwcmVzZW50cyBhbiBleHByZXNzaW9uXG4gICAgICAgIC8vIEFkZCBhbiBpbnN0cnVjdGlvbiB0byBtb3ZlIHRoZSBleHByZXNzaW9uXG4gICAgICAgIHRtcGxJbnN0cnVjdGlvbnMucHVzaChwaEluZGV4IHwgSTE4bkluc3RydWN0aW9ucy5FeHByZXNzaW9uKTtcbiAgICAgICAgcGhWaXNpdGVkLnB1c2godmFsdWUpO1xuICAgICAgfSBlbHNlIHsgIC8vIEl0IGlzIGEgY2xvc2luZyB0YWdcbiAgICAgICAgdG1wbEluc3RydWN0aW9ucy5wdXNoKEkxOG5JbnN0cnVjdGlvbnMuQ2xvc2VOb2RlKTtcblxuICAgICAgICBpZiAodG1wbEluZGV4ID4gMCkge1xuICAgICAgICAgIG9wZW5lZFRhZ0NvdW50LS07XG5cbiAgICAgICAgICAvLyBJZiB3ZSBoYXZlIHJlYWNoZWQgdGhlIGNsb3NpbmcgdGFnIGZvciB0aGlzIHRlbXBsYXRlLCBleGl0IHRoZSBsb29wXG4gICAgICAgICAgaWYgKG9wZW5lZFRhZ0NvdW50ID09PSAwKSB7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKHR5cGVvZiBwaEluZGV4ICE9PSAndW5kZWZpbmVkJyAmJiBwaEluZGV4ID4gbWF4SW5kZXgpIHtcbiAgICAgICAgbWF4SW5kZXggPSBwaEluZGV4O1xuICAgICAgfVxuXG4gICAgICBpZiAodG1wbENvbnRhaW5lcnMgJiYgdG1wbENvbnRhaW5lcnMuaW5kZXhPZih2YWx1ZSkgIT09IC0xICYmXG4gICAgICAgICAgdG1wbENvbnRhaW5lcnMuaW5kZXhPZih2YWx1ZSkgPj0gdG1wbEluZGV4KSB7XG4gICAgICAgIGluZGV4ID0gZ2VuZXJhdGVNYXBwaW5nSW5zdHJ1Y3Rpb25zKFxuICAgICAgICAgICAgaW5kZXgsIHRyYW5zbGF0aW9uUGFydHMsIGluc3RydWN0aW9ucywgZWxlbWVudHMsIGV4cHJlc3Npb25zLCB0bXBsQ29udGFpbmVycyxcbiAgICAgICAgICAgIGxhc3RDaGlsZEluZGV4KTtcbiAgICAgIH1cblxuICAgIH0gZWxzZSBpZiAodmFsdWUpIHtcbiAgICAgIC8vIEl0J3MgYSBub24tZW1wdHkgc3RyaW5nLCBjcmVhdGUgYSB0ZXh0IG5vZGVcbiAgICAgIHRtcGxJbnN0cnVjdGlvbnMucHVzaChJMThuSW5zdHJ1Y3Rpb25zLlRleHQsIHZhbHVlKTtcbiAgICB9XG4gIH1cblxuICAvLyBDaGVjayBpZiBzb21lIGVsZW1lbnRzIGZyb20gdGhlIHRlbXBsYXRlIGFyZSBtaXNzaW5nIGZyb20gdGhlIHRyYW5zbGF0aW9uXG4gIGlmIChlbGVtZW50cykge1xuICAgIGNvbnN0IHRtcGxFbGVtZW50cyA9IGVsZW1lbnRzW3RtcGxJbmRleF07XG5cbiAgICBpZiAodG1wbEVsZW1lbnRzKSB7XG4gICAgICBjb25zdCBwaEtleXMgPSBPYmplY3Qua2V5cyh0bXBsRWxlbWVudHMpO1xuXG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHBoS2V5cy5sZW5ndGg7IGkrKykge1xuICAgICAgICBjb25zdCBwaCA9IHBoS2V5c1tpXTtcblxuICAgICAgICBpZiAocGhWaXNpdGVkLmluZGV4T2YocGgpID09PSAtMSkge1xuICAgICAgICAgIGxldCBpbmRleCA9IHRtcGxFbGVtZW50c1twaF07XG4gICAgICAgICAgLy8gQWRkIGFuIGluc3RydWN0aW9uIHRvIHJlbW92ZSB0aGUgZWxlbWVudFxuICAgICAgICAgIHRtcGxJbnN0cnVjdGlvbnMucHVzaChpbmRleCB8IEkxOG5JbnN0cnVjdGlvbnMuUmVtb3ZlTm9kZSk7XG5cbiAgICAgICAgICBpZiAoaW5kZXggPiBtYXhJbmRleCkge1xuICAgICAgICAgICAgbWF4SW5kZXggPSBpbmRleDtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvLyBDaGVjayBpZiBzb21lIGV4cHJlc3Npb25zIGZyb20gdGhlIHRlbXBsYXRlIGFyZSBtaXNzaW5nIGZyb20gdGhlIHRyYW5zbGF0aW9uXG4gIGlmIChleHByZXNzaW9ucykge1xuICAgIGNvbnN0IHRtcGxFeHByZXNzaW9ucyA9IGV4cHJlc3Npb25zW3RtcGxJbmRleF07XG5cbiAgICBpZiAodG1wbEV4cHJlc3Npb25zKSB7XG4gICAgICBjb25zdCBwaEtleXMgPSBPYmplY3Qua2V5cyh0bXBsRXhwcmVzc2lvbnMpO1xuXG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHBoS2V5cy5sZW5ndGg7IGkrKykge1xuICAgICAgICBjb25zdCBwaCA9IHBoS2V5c1tpXTtcblxuICAgICAgICBpZiAocGhWaXNpdGVkLmluZGV4T2YocGgpID09PSAtMSkge1xuICAgICAgICAgIGxldCBpbmRleCA9IHRtcGxFeHByZXNzaW9uc1twaF07XG4gICAgICAgICAgaWYgKG5nRGV2TW9kZSkge1xuICAgICAgICAgICAgYXNzZXJ0TGVzc1RoYW4oXG4gICAgICAgICAgICAgICAgaW5kZXgudG9TdHJpbmcoMikubGVuZ3RoLCAyOCwgYEluZGV4ICR7aW5kZXh9IGlzIHRvbyBiaWcgYW5kIHdpbGwgb3ZlcmZsb3dgKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgLy8gQWRkIGFuIGluc3RydWN0aW9uIHRvIHJlbW92ZSB0aGUgZXhwcmVzc2lvblxuICAgICAgICAgIHRtcGxJbnN0cnVjdGlvbnMucHVzaChpbmRleCB8IEkxOG5JbnN0cnVjdGlvbnMuUmVtb3ZlTm9kZSk7XG5cbiAgICAgICAgICBpZiAoaW5kZXggPiBtYXhJbmRleCkge1xuICAgICAgICAgICAgbWF4SW5kZXggPSBpbmRleDtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBpZiAodG1wbEluZGV4ID09PSAwICYmIHR5cGVvZiBsYXN0Q2hpbGRJbmRleCA9PT0gJ251bWJlcicpIHtcbiAgICAvLyBUaGUgY3VycmVudCBwYXJlbnQgaXMgYW4gbmctY29udGFpbmVyIGFuZCBpdCBoYXMgbW9yZSBjaGlsZHJlbiBhZnRlciB0aGUgdHJhbnNsYXRpb24gdGhhdCB3ZVxuICAgIC8vIG5lZWQgdG8gYXBwZW5kIHRvIGtlZXAgdGhlIG9yZGVyIG9mIHRoZSBET00gbm9kZXMgY29ycmVjdFxuICAgIGZvciAobGV0IGkgPSBtYXhJbmRleCArIDE7IGkgPD0gbGFzdENoaWxkSW5kZXg7IGkrKykge1xuICAgICAgaWYgKG5nRGV2TW9kZSkge1xuICAgICAgICBhc3NlcnRMZXNzVGhhbihpLnRvU3RyaW5nKDIpLmxlbmd0aCwgMjgsIGBJbmRleCAke2l9IGlzIHRvbyBiaWcgYW5kIHdpbGwgb3ZlcmZsb3dgKTtcbiAgICAgIH1cbiAgICAgIC8vIFdlIGNvbnNpZGVyIHRob3NlIGFkZGl0aW9uYWwgcGxhY2Vob2xkZXJzIGFzIGV4cHJlc3Npb25zIGJlY2F1c2Ugd2UgZG9uJ3QgY2FyZSBhYm91dFxuICAgICAgLy8gdGhlaXIgY2hpbGRyZW4sIGFsbCB3ZSBuZWVkIHRvIGRvIGlzIHRvIGFwcGVuZCB0aGVtXG4gICAgICB0bXBsSW5zdHJ1Y3Rpb25zLnB1c2goaSB8IEkxOG5JbnN0cnVjdGlvbnMuRXhwcmVzc2lvbik7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGluZGV4O1xufVxuXG5mdW5jdGlvbiBhcHBlbmRJMThuTm9kZShub2RlOiBMTm9kZSwgcGFyZW50Tm9kZTogTE5vZGUsIHByZXZpb3VzTm9kZTogTE5vZGUpIHtcbiAgaWYgKG5nRGV2TW9kZSkge1xuICAgIG5nRGV2TW9kZS5yZW5kZXJlck1vdmVOb2RlKys7XG4gIH1cblxuICBjb25zdCB2aWV3RGF0YSA9IGdldFZpZXdEYXRhKCk7XG5cbiAgYXBwZW5kQ2hpbGQocGFyZW50Tm9kZSwgbm9kZS5uYXRpdmUgfHwgbnVsbCwgdmlld0RhdGEpO1xuXG4gIC8vIE9uIGZpcnN0IHBhc3MsIHJlLW9yZ2FuaXplIG5vZGUgdHJlZSB0byBwdXQgdGhpcyBub2RlIGluIHRoZSBjb3JyZWN0IHBvc2l0aW9uLlxuICBjb25zdCBmaXJzdFRlbXBsYXRlUGFzcyA9IG5vZGUudmlld1tUVklFV10uZmlyc3RUZW1wbGF0ZVBhc3M7XG4gIGlmIChmaXJzdFRlbXBsYXRlUGFzcykge1xuICAgIG5vZGUudE5vZGUubmV4dCA9IG51bGw7XG4gICAgaWYgKHByZXZpb3VzTm9kZSA9PT0gcGFyZW50Tm9kZSAmJiBub2RlLnROb2RlICE9PSBwYXJlbnROb2RlLnROb2RlLmNoaWxkKSB7XG4gICAgICBub2RlLnROb2RlLm5leHQgPSBwYXJlbnROb2RlLnROb2RlLmNoaWxkO1xuICAgICAgcGFyZW50Tm9kZS50Tm9kZS5jaGlsZCA9IG5vZGUudE5vZGU7XG4gICAgfSBlbHNlIGlmIChwcmV2aW91c05vZGUgIT09IHBhcmVudE5vZGUgJiYgbm9kZS50Tm9kZSAhPT0gcHJldmlvdXNOb2RlLnROb2RlLm5leHQpIHtcbiAgICAgIG5vZGUudE5vZGUubmV4dCA9IHByZXZpb3VzTm9kZS50Tm9kZS5uZXh0O1xuICAgICAgcHJldmlvdXNOb2RlLnROb2RlLm5leHQgPSBub2RlLnROb2RlO1xuICAgIH1cbiAgfVxuXG4gIC8vIFRlbXBsYXRlIGNvbnRhaW5lcnMgYWxzbyBoYXZlIGEgY29tbWVudCBub2RlIGZvciB0aGUgYFZpZXdDb250YWluZXJSZWZgIHRoYXQgc2hvdWxkIGJlIG1vdmVkXG4gIGlmIChub2RlLnROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5Db250YWluZXIgJiYgbm9kZS5keW5hbWljTENvbnRhaW5lck5vZGUpIHtcbiAgICAvLyAobm9kZS5uYXRpdmUgYXMgUkNvbW1lbnQpLnRleHRDb250ZW50ID0gJ3Rlc3QnO1xuICAgIC8vIGNvbnNvbGUubG9nKG5vZGUubmF0aXZlKTtcbiAgICBhcHBlbmRDaGlsZChwYXJlbnROb2RlLCBub2RlLmR5bmFtaWNMQ29udGFpbmVyTm9kZS5uYXRpdmUgfHwgbnVsbCwgdmlld0RhdGEpO1xuICAgIGlmIChmaXJzdFRlbXBsYXRlUGFzcykge1xuICAgICAgbm9kZS50Tm9kZS5keW5hbWljQ29udGFpbmVyTm9kZSA9IG5vZGUuZHluYW1pY0xDb250YWluZXJOb2RlLnROb2RlO1xuICAgICAgbm9kZS5keW5hbWljTENvbnRhaW5lck5vZGUudE5vZGUucGFyZW50ID0gbm9kZS50Tm9kZSBhcyBUQ29udGFpbmVyTm9kZTtcbiAgICB9XG4gICAgcmV0dXJuIG5vZGUuZHluYW1pY0xDb250YWluZXJOb2RlO1xuICB9XG5cbiAgcmV0dXJuIG5vZGU7XG59XG5cbi8qKlxuICogVGFrZXMgYSBsaXN0IG9mIGluc3RydWN0aW9ucyBnZW5lcmF0ZWQgYnkgYGkxOG5NYXBwaW5nKClgIHRvIHRyYW5zZm9ybSB0aGUgdGVtcGxhdGUgYWNjb3JkaW5nbHkuXG4gKlxuICogQHBhcmFtIHN0YXJ0SW5kZXggSW5kZXggb2YgdGhlIGZpcnN0IGVsZW1lbnQgdG8gdHJhbnNsYXRlIChmb3IgaW5zdGFuY2UgdGhlIGZpcnN0IGNoaWxkIG9mIHRoZVxuICogZWxlbWVudCB3aXRoIHRoZSBpMThuIGF0dHJpYnV0ZSkuXG4gKiBAcGFyYW0gaW5zdHJ1Y3Rpb25zIFRoZSBsaXN0IG9mIGluc3RydWN0aW9ucyB0byBhcHBseSBvbiB0aGUgY3VycmVudCB2aWV3LlxuICovXG5leHBvcnQgZnVuY3Rpb24gaTE4bkFwcGx5KHN0YXJ0SW5kZXg6IG51bWJlciwgaW5zdHJ1Y3Rpb25zOiBJMThuSW5zdHJ1Y3Rpb25bXSk6IHZvaWQge1xuICBjb25zdCB2aWV3RGF0YSA9IGdldFZpZXdEYXRhKCk7XG4gIGlmIChuZ0Rldk1vZGUpIHtcbiAgICBhc3NlcnRFcXVhbCh2aWV3RGF0YVtCSU5ESU5HX0lOREVYXSwgLTEsICdpMThuQXBwbHkgc2hvdWxkIGJlIGNhbGxlZCBiZWZvcmUgYW55IGJpbmRpbmcnKTtcbiAgfVxuXG4gIGlmICghaW5zdHJ1Y3Rpb25zKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY29uc3QgcmVuZGVyZXIgPSBnZXRSZW5kZXJlcigpO1xuICBsZXQgbG9jYWxQYXJlbnROb2RlOiBMTm9kZSA9IGdldFBhcmVudExOb2RlKGxvYWQoc3RhcnRJbmRleCkpIHx8IGdldFByZXZpb3VzT3JQYXJlbnROb2RlKCk7XG4gIGxldCBsb2NhbFByZXZpb3VzTm9kZTogTE5vZGUgPSBsb2NhbFBhcmVudE5vZGU7XG4gIHJlc2V0QXBwbGljYXRpb25TdGF0ZSgpOyAgLy8gV2UgZG9uJ3Qgd2FudCB0byBhZGQgdG8gdGhlIHRyZWUgd2l0aCB0aGUgd3JvbmcgcHJldmlvdXMgbm9kZVxuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgaW5zdHJ1Y3Rpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgaW5zdHJ1Y3Rpb24gPSBpbnN0cnVjdGlvbnNbaV0gYXMgbnVtYmVyO1xuICAgIHN3aXRjaCAoaW5zdHJ1Y3Rpb24gJiBJMThuSW5zdHJ1Y3Rpb25zLkluc3RydWN0aW9uTWFzaykge1xuICAgICAgY2FzZSBJMThuSW5zdHJ1Y3Rpb25zLkVsZW1lbnQ6XG4gICAgICAgIGNvbnN0IGVsZW1lbnQ6IExOb2RlID0gbG9hZChpbnN0cnVjdGlvbiAmIEkxOG5JbnN0cnVjdGlvbnMuSW5kZXhNYXNrKTtcbiAgICAgICAgbG9jYWxQcmV2aW91c05vZGUgPSBhcHBlbmRJMThuTm9kZShlbGVtZW50LCBsb2NhbFBhcmVudE5vZGUsIGxvY2FsUHJldmlvdXNOb2RlKTtcbiAgICAgICAgbG9jYWxQYXJlbnROb2RlID0gZWxlbWVudDtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIEkxOG5JbnN0cnVjdGlvbnMuRXhwcmVzc2lvbjpcbiAgICAgICAgY29uc3QgZXhwcjogTE5vZGUgPSBsb2FkKGluc3RydWN0aW9uICYgSTE4bkluc3RydWN0aW9ucy5JbmRleE1hc2spO1xuICAgICAgICBsb2NhbFByZXZpb3VzTm9kZSA9IGFwcGVuZEkxOG5Ob2RlKGV4cHIsIGxvY2FsUGFyZW50Tm9kZSwgbG9jYWxQcmV2aW91c05vZGUpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgSTE4bkluc3RydWN0aW9ucy5UZXh0OlxuICAgICAgICBpZiAobmdEZXZNb2RlKSB7XG4gICAgICAgICAgbmdEZXZNb2RlLnJlbmRlcmVyQ3JlYXRlVGV4dE5vZGUrKztcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB2YWx1ZSA9IGluc3RydWN0aW9uc1srK2ldO1xuICAgICAgICBjb25zdCB0ZXh0Uk5vZGUgPSBjcmVhdGVUZXh0Tm9kZSh2YWx1ZSwgcmVuZGVyZXIpO1xuICAgICAgICAvLyBJZiB3ZSB3ZXJlIHRvIG9ubHkgY3JlYXRlIGEgYFJOb2RlYCB0aGVuIHByb2plY3Rpb25zIHdvbid0IG1vdmUgdGhlIHRleHQuXG4gICAgICAgIC8vIENyZWF0ZSB0ZXh0IG5vZGUgYXQgdGhlIGN1cnJlbnQgZW5kIG9mIHZpZXdEYXRhLiBNdXN0IHN1YnRyYWN0IGhlYWRlciBvZmZzZXQgYmVjYXVzZVxuICAgICAgICAvLyBjcmVhdGVMTm9kZSB0YWtlcyBhIHJhdyBpbmRleCAobm90IGFkanVzdGVkIGJ5IGhlYWRlciBvZmZzZXQpLlxuICAgICAgICBjb25zdCB0ZXh0TE5vZGUgPVxuICAgICAgICAgICAgY3JlYXRlTE5vZGUodmlld0RhdGEubGVuZ3RoIC0gSEVBREVSX09GRlNFVCwgVE5vZGVUeXBlLkVsZW1lbnQsIHRleHRSTm9kZSwgbnVsbCwgbnVsbCk7XG4gICAgICAgIGxvY2FsUHJldmlvdXNOb2RlID0gYXBwZW5kSTE4bk5vZGUodGV4dExOb2RlLCBsb2NhbFBhcmVudE5vZGUsIGxvY2FsUHJldmlvdXNOb2RlKTtcbiAgICAgICAgcmVzZXRBcHBsaWNhdGlvblN0YXRlKCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBJMThuSW5zdHJ1Y3Rpb25zLkNsb3NlTm9kZTpcbiAgICAgICAgbG9jYWxQcmV2aW91c05vZGUgPSBsb2NhbFBhcmVudE5vZGU7XG4gICAgICAgIGxvY2FsUGFyZW50Tm9kZSA9IGdldFBhcmVudExOb2RlKGxvY2FsUGFyZW50Tm9kZSkgITtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIEkxOG5JbnN0cnVjdGlvbnMuUmVtb3ZlTm9kZTpcbiAgICAgICAgaWYgKG5nRGV2TW9kZSkge1xuICAgICAgICAgIG5nRGV2TW9kZS5yZW5kZXJlclJlbW92ZU5vZGUrKztcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBpbmRleCA9IGluc3RydWN0aW9uICYgSTE4bkluc3RydWN0aW9ucy5JbmRleE1hc2s7XG4gICAgICAgIGNvbnN0IHJlbW92ZWROb2RlOiBMTm9kZXxMQ29udGFpbmVyTm9kZSA9IGxvYWQoaW5kZXgpO1xuICAgICAgICBjb25zdCBwYXJlbnROb2RlID0gZ2V0UGFyZW50TE5vZGUocmVtb3ZlZE5vZGUpICE7XG4gICAgICAgIHJlbW92ZUNoaWxkKHBhcmVudE5vZGUsIHJlbW92ZWROb2RlLm5hdGl2ZSB8fCBudWxsLCB2aWV3RGF0YSk7XG5cbiAgICAgICAgLy8gRm9yIHRlbXBsYXRlIGNvbnRhaW5lcnMgd2UgYWxzbyBuZWVkIHRvIHJlbW92ZSB0aGVpciBgVmlld0NvbnRhaW5lclJlZmAgZnJvbSB0aGUgRE9NXG4gICAgICAgIGlmIChyZW1vdmVkTm9kZS50Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuQ29udGFpbmVyICYmIHJlbW92ZWROb2RlLmR5bmFtaWNMQ29udGFpbmVyTm9kZSkge1xuICAgICAgICAgIHJlbW92ZUNoaWxkKHBhcmVudE5vZGUsIHJlbW92ZWROb2RlLmR5bmFtaWNMQ29udGFpbmVyTm9kZS5uYXRpdmUgfHwgbnVsbCwgdmlld0RhdGEpO1xuICAgICAgICAgIHJlbW92ZWROb2RlLmR5bmFtaWNMQ29udGFpbmVyTm9kZS50Tm9kZS5kZXRhY2hlZCA9IHRydWU7XG4gICAgICAgICAgcmVtb3ZlZE5vZGUuZHluYW1pY0xDb250YWluZXJOb2RlLmRhdGFbUkVOREVSX1BBUkVOVF0gPSBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIFRha2VzIGEgdHJhbnNsYXRpb24gc3RyaW5nIGFuZCB0aGUgaW5pdGlhbCBsaXN0IG9mIGV4cHJlc3Npb25zIGFuZCByZXR1cm5zIGEgbGlzdCBvZiBpbnN0cnVjdGlvbnNcbiAqIHRoYXQgd2lsbCBiZSB1c2VkIHRvIHRyYW5zbGF0ZSBhbiBhdHRyaWJ1dGUuXG4gKiBFdmVuIGluZGV4ZXMgY29udGFpbiBzdGF0aWMgc3RyaW5ncywgd2hpbGUgb2RkIGluZGV4ZXMgY29udGFpbiB0aGUgaW5kZXggb2YgdGhlIGV4cHJlc3Npb24gd2hvc2VcbiAqIHZhbHVlIHdpbGwgYmUgY29uY2F0ZW5hdGVkIGludG8gdGhlIGZpbmFsIHRyYW5zbGF0aW9uLlxuICovXG5leHBvcnQgZnVuY3Rpb24gaTE4bkV4cE1hcHBpbmcoXG4gICAgdHJhbnNsYXRpb246IHN0cmluZywgcGxhY2Vob2xkZXJzOiBQbGFjZWhvbGRlck1hcCk6IEkxOG5FeHBJbnN0cnVjdGlvbltdIHtcbiAgY29uc3Qgc3RhdGljVGV4dDogSTE4bkV4cEluc3RydWN0aW9uW10gPSB0cmFuc2xhdGlvbi5zcGxpdChpMThuVGFnUmVnZXgpO1xuICAvLyBvZGQgaW5kZXhlcyBhcmUgcGxhY2Vob2xkZXJzXG4gIGZvciAobGV0IGkgPSAxOyBpIDwgc3RhdGljVGV4dC5sZW5ndGg7IGkgKz0gMikge1xuICAgIHN0YXRpY1RleHRbaV0gPSBwbGFjZWhvbGRlcnNbc3RhdGljVGV4dFtpXV07XG4gIH1cbiAgcmV0dXJuIHN0YXRpY1RleHQ7XG59XG5cbi8qKlxuICogQ2hlY2tzIGlmIHRoZSB2YWx1ZSBvZiB1cCB0byA4IGV4cHJlc3Npb25zIGhhdmUgY2hhbmdlZCBhbmQgcmVwbGFjZXMgdGhlbSBieSB0aGVpciB2YWx1ZXMgaW4gYVxuICogdHJhbnNsYXRpb24sIG9yIHJldHVybnMgTk9fQ0hBTkdFLlxuICpcbiAqIEByZXR1cm5zIFRoZSBjb25jYXRlbmF0ZWQgc3RyaW5nIHdoZW4gYW55IG9mIHRoZSBhcmd1bWVudHMgY2hhbmdlcywgYE5PX0NIQU5HRWAgb3RoZXJ3aXNlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gaTE4bkludGVycG9sYXRpb24oXG4gICAgaW5zdHJ1Y3Rpb25zOiBJMThuRXhwSW5zdHJ1Y3Rpb25bXSwgbnVtYmVyT2ZFeHA6IG51bWJlciwgdjA6IGFueSwgdjE/OiBhbnksIHYyPzogYW55LCB2Mz86IGFueSxcbiAgICB2ND86IGFueSwgdjU/OiBhbnksIHY2PzogYW55LCB2Nz86IGFueSk6IHN0cmluZ3xOT19DSEFOR0Uge1xuICBsZXQgZGlmZmVyZW50ID0gYmluZGluZ1VwZGF0ZWQodjApO1xuXG4gIGlmIChudW1iZXJPZkV4cCA+IDEpIHtcbiAgICBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZCh2MSkgfHwgZGlmZmVyZW50O1xuXG4gICAgaWYgKG51bWJlck9mRXhwID4gMikge1xuICAgICAgZGlmZmVyZW50ID0gYmluZGluZ1VwZGF0ZWQodjIpIHx8IGRpZmZlcmVudDtcblxuICAgICAgaWYgKG51bWJlck9mRXhwID4gMykge1xuICAgICAgICBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZCh2MykgfHwgZGlmZmVyZW50O1xuXG4gICAgICAgIGlmIChudW1iZXJPZkV4cCA+IDQpIHtcbiAgICAgICAgICBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZCh2NCkgfHwgZGlmZmVyZW50O1xuXG4gICAgICAgICAgaWYgKG51bWJlck9mRXhwID4gNSkge1xuICAgICAgICAgICAgZGlmZmVyZW50ID0gYmluZGluZ1VwZGF0ZWQodjUpIHx8IGRpZmZlcmVudDtcblxuICAgICAgICAgICAgaWYgKG51bWJlck9mRXhwID4gNikge1xuICAgICAgICAgICAgICBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZCh2NikgfHwgZGlmZmVyZW50O1xuXG4gICAgICAgICAgICAgIGlmIChudW1iZXJPZkV4cCA+IDcpIHtcbiAgICAgICAgICAgICAgICBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZCh2NykgfHwgZGlmZmVyZW50O1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgaWYgKCFkaWZmZXJlbnQpIHtcbiAgICByZXR1cm4gTk9fQ0hBTkdFO1xuICB9XG5cbiAgbGV0IHJlcyA9ICcnO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGluc3RydWN0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgIGxldCB2YWx1ZTogYW55O1xuICAgIC8vIE9kZCBpbmRleGVzIGFyZSBwbGFjZWhvbGRlcnNcbiAgICBpZiAoaSAmIDEpIHtcbiAgICAgIHN3aXRjaCAoaW5zdHJ1Y3Rpb25zW2ldKSB7XG4gICAgICAgIGNhc2UgMDpcbiAgICAgICAgICB2YWx1ZSA9IHYwO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIDE6XG4gICAgICAgICAgdmFsdWUgPSB2MTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAyOlxuICAgICAgICAgIHZhbHVlID0gdjI7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgMzpcbiAgICAgICAgICB2YWx1ZSA9IHYzO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIDQ6XG4gICAgICAgICAgdmFsdWUgPSB2NDtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSA1OlxuICAgICAgICAgIHZhbHVlID0gdjU7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgNjpcbiAgICAgICAgICB2YWx1ZSA9IHY2O1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIDc6XG4gICAgICAgICAgdmFsdWUgPSB2NztcbiAgICAgICAgICBicmVhaztcbiAgICAgIH1cblxuICAgICAgcmVzICs9IHN0cmluZ2lmeSh2YWx1ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlcyArPSBpbnN0cnVjdGlvbnNbaV07XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHJlcztcbn1cblxuLyoqXG4gKiBDcmVhdGUgYSB0cmFuc2xhdGVkIGludGVycG9sYXRpb24gYmluZGluZyB3aXRoIGEgdmFyaWFibGUgbnVtYmVyIG9mIGV4cHJlc3Npb25zLlxuICpcbiAqIElmIHRoZXJlIGFyZSAxIHRvIDggZXhwcmVzc2lvbnMgdGhlbiBgaTE4bkludGVycG9sYXRpb24oKWAgc2hvdWxkIGJlIHVzZWQgaW5zdGVhZC4gSXQgaXMgZmFzdGVyXG4gKiBiZWNhdXNlIHRoZXJlIGlzIG5vIG5lZWQgdG8gY3JlYXRlIGFuIGFycmF5IG9mIGV4cHJlc3Npb25zIGFuZCBpdGVyYXRlIG92ZXIgaXQuXG4gKlxuICogQHJldHVybnMgVGhlIGNvbmNhdGVuYXRlZCBzdHJpbmcgd2hlbiBhbnkgb2YgdGhlIGFyZ3VtZW50cyBjaGFuZ2VzLCBgTk9fQ0hBTkdFYCBvdGhlcndpc2UuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpMThuSW50ZXJwb2xhdGlvblYoaW5zdHJ1Y3Rpb25zOiBJMThuRXhwSW5zdHJ1Y3Rpb25bXSwgdmFsdWVzOiBhbnlbXSk6IHN0cmluZ3xcbiAgICBOT19DSEFOR0Uge1xuICBsZXQgZGlmZmVyZW50ID0gZmFsc2U7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgdmFsdWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgLy8gQ2hlY2sgaWYgYmluZGluZ3MgaGF2ZSBjaGFuZ2VkXG4gICAgYmluZGluZ1VwZGF0ZWQodmFsdWVzW2ldKSAmJiAoZGlmZmVyZW50ID0gdHJ1ZSk7XG4gIH1cblxuICBpZiAoIWRpZmZlcmVudCkge1xuICAgIHJldHVybiBOT19DSEFOR0U7XG4gIH1cblxuICBsZXQgcmVzID0gJyc7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgaW5zdHJ1Y3Rpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgLy8gT2RkIGluZGV4ZXMgYXJlIHBsYWNlaG9sZGVyc1xuICAgIGlmIChpICYgMSkge1xuICAgICAgcmVzICs9IHN0cmluZ2lmeSh2YWx1ZXNbaW5zdHJ1Y3Rpb25zW2ldIGFzIG51bWJlcl0pO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXMgKz0gaW5zdHJ1Y3Rpb25zW2ldO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiByZXM7XG59XG4iXX0=