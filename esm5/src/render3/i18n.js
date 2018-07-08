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
var i18nTagRegex = /\{\$([^}]+)\}/g;
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
    var translationParts = translation.split(i18nTagRegex);
    var instructions = [];
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
    var tmplIndex = instructions.length;
    var tmplInstructions = [];
    var phVisited = [];
    var openedTagCount = 0;
    var maxIndex = 0;
    instructions.push(tmplInstructions);
    for (; index < translationParts.length; index++) {
        var value = translationParts[index];
        // Odd indexes are placeholders
        if (index & 1) {
            var phIndex = void 0;
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
        var tmplElements = elements[tmplIndex];
        if (tmplElements) {
            var phKeys = Object.keys(tmplElements);
            for (var i = 0; i < phKeys.length; i++) {
                var ph = phKeys[i];
                if (phVisited.indexOf(ph) === -1) {
                    var index_1 = tmplElements[ph];
                    // Add an instruction to remove the element
                    tmplInstructions.push(index_1 | -1610612736 /* RemoveNode */);
                    if (index_1 > maxIndex) {
                        maxIndex = index_1;
                    }
                }
            }
        }
    }
    // Check if some expressions from the template are missing from the translation
    if (expressions) {
        var tmplExpressions = expressions[tmplIndex];
        if (tmplExpressions) {
            var phKeys = Object.keys(tmplExpressions);
            for (var i = 0; i < phKeys.length; i++) {
                var ph = phKeys[i];
                if (phVisited.indexOf(ph) === -1) {
                    var index_2 = tmplExpressions[ph];
                    if (ngDevMode) {
                        assertLessThan(index_2.toString(2).length, 28, "Index " + index_2 + " is too big and will overflow");
                    }
                    // Add an instruction to remove the expression
                    tmplInstructions.push(index_2 | -1610612736 /* RemoveNode */);
                    if (index_2 > maxIndex) {
                        maxIndex = index_2;
                    }
                }
            }
        }
    }
    if (tmplIndex === 0 && typeof lastChildIndex === 'number') {
        // The current parent is an ng-container and it has more children after the translation that we
        // need to append to keep the order of the DOM nodes correct
        for (var i = maxIndex + 1; i <= lastChildIndex; i++) {
            if (ngDevMode) {
                assertLessThan(i.toString(2).length, 28, "Index " + i + " is too big and will overflow");
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
    var viewData = getViewData();
    appendChild(parentNode, node.native || null, viewData);
    // On first pass, re-organize node tree to put this node in the correct position.
    var firstTemplatePass = node.view[TVIEW].firstTemplatePass;
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
    var viewData = getViewData();
    if (ngDevMode) {
        assertEqual(viewData[BINDING_INDEX], -1, 'i18nApply should be called before any binding');
    }
    if (!instructions) {
        return;
    }
    var renderer = getRenderer();
    var localParentNode = getParentLNode(load(startIndex)) || getPreviousOrParentNode();
    var localPreviousNode = localParentNode;
    resetApplicationState(); // We don't want to add to the tree with the wrong previous node
    for (var i = 0; i < instructions.length; i++) {
        var instruction = instructions[i];
        switch (instruction & -536870912 /* InstructionMask */) {
            case 1073741824 /* Element */:
                var element = load(instruction & 536870911 /* IndexMask */);
                localPreviousNode = appendI18nNode(element, localParentNode, localPreviousNode);
                localParentNode = element;
                break;
            case 1610612736 /* Expression */:
                var expr = load(instruction & 536870911 /* IndexMask */);
                localPreviousNode = appendI18nNode(expr, localParentNode, localPreviousNode);
                break;
            case 536870912 /* Text */:
                if (ngDevMode) {
                    ngDevMode.rendererCreateTextNode++;
                }
                var value = instructions[++i];
                var textRNode = createTextNode(value, renderer);
                // If we were to only create a `RNode` then projections won't move the text.
                // Create text node at the current end of viewData. Must subtract header offset because
                // createLNode takes a raw index (not adjusted by header offset).
                var textLNode = createLNode(viewData.length - HEADER_OFFSET, 3 /* Element */, textRNode, null, null);
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
                var index = instruction & 536870911 /* IndexMask */;
                var removedNode = load(index);
                var parentNode = getParentLNode(removedNode);
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
    var staticText = translation.split(i18nTagRegex);
    // odd indexes are placeholders
    for (var i = 1; i < staticText.length; i += 2) {
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
    var different = bindingUpdated(v0);
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
    var res = '';
    for (var i = 0; i < instructions.length; i++) {
        var value = void 0;
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
    var different = false;
    for (var i = 0; i < values.length; i++) {
        // Check if bindings have changed
        bindingUpdated(values[i]) && (different = true);
    }
    if (!different) {
        return NO_CHANGE;
    }
    var res = '';
    for (var i = 0; i < instructions.length; i++) {
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaTE4bi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaTE4bi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsV0FBVyxFQUFFLGNBQWMsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUNyRCxPQUFPLEVBQUMsU0FBUyxFQUFFLGNBQWMsRUFBRSxXQUFXLEVBQUUsdUJBQXVCLEVBQUUsV0FBVyxFQUFFLFdBQVcsRUFBRSxJQUFJLEVBQUUscUJBQXFCLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUN0SixPQUFPLEVBQUMsYUFBYSxFQUFDLE1BQU0sd0JBQXdCLENBQUM7QUFFckQsT0FBTyxFQUFDLGFBQWEsRUFBRSxhQUFhLEVBQUUsS0FBSyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDdEUsT0FBTyxFQUFDLFdBQVcsRUFBRSxjQUFjLEVBQUUsY0FBYyxFQUFFLFdBQVcsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBQzdGLE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxRQUFRLENBQUM7QUFrQ2pDLElBQU0sWUFBWSxHQUFHLGdCQUFnQixDQUFDO0FBRXRDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQW9CRztBQUNILE1BQU0sc0JBQ0YsV0FBbUIsRUFBRSxRQUEwQyxFQUMvRCxXQUE4QyxFQUFFLGNBQWdDLEVBQ2hGLGNBQThCO0lBQ2hDLElBQU0sZ0JBQWdCLEdBQUcsV0FBVyxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUMsQ0FBQztJQUN6RCxJQUFNLFlBQVksR0FBd0IsRUFBRSxDQUFDO0lBRTdDLDJCQUEyQixDQUN2QixDQUFDLEVBQUUsZ0JBQWdCLEVBQUUsWUFBWSxFQUFFLFFBQVEsRUFBRSxXQUFXLEVBQUUsY0FBYyxFQUFFLGNBQWMsQ0FBQyxDQUFDO0lBRTlGLE9BQU8sWUFBWSxDQUFDO0FBQ3RCLENBQUM7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biAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHthc3NlcnRFcXVhbCwgYXNzZXJ0TGVzc1RoYW59IGZyb20gJy4vYXNzZXJ0JztcbmltcG9ydCB7Tk9fQ0hBTkdFLCBiaW5kaW5nVXBkYXRlZCwgY3JlYXRlTE5vZGUsIGdldFByZXZpb3VzT3JQYXJlbnROb2RlLCBnZXRSZW5kZXJlciwgZ2V0Vmlld0RhdGEsIGxvYWQsIHJlc2V0QXBwbGljYXRpb25TdGF0ZX0gZnJvbSAnLi9pbnN0cnVjdGlvbnMnO1xuaW1wb3J0IHtSRU5ERVJfUEFSRU5UfSBmcm9tICcuL2ludGVyZmFjZXMvY29udGFpbmVyJztcbmltcG9ydCB7TENvbnRhaW5lck5vZGUsIExFbGVtZW50Tm9kZSwgTE5vZGUsIFRDb250YWluZXJOb2RlLCBUTm9kZVR5cGV9IGZyb20gJy4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7QklORElOR19JTkRFWCwgSEVBREVSX09GRlNFVCwgVFZJRVd9IGZyb20gJy4vaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7YXBwZW5kQ2hpbGQsIGNyZWF0ZVRleHROb2RlLCBnZXRQYXJlbnRMTm9kZSwgcmVtb3ZlQ2hpbGR9IGZyb20gJy4vbm9kZV9tYW5pcHVsYXRpb24nO1xuaW1wb3J0IHtzdHJpbmdpZnl9IGZyb20gJy4vdXRpbCc7XG5cbi8qKlxuICogQSBsaXN0IG9mIGZsYWdzIHRvIGVuY29kZSB0aGUgaTE4biBpbnN0cnVjdGlvbnMgdXNlZCB0byB0cmFuc2xhdGUgdGhlIHRlbXBsYXRlLlxuICogV2Ugc2hpZnQgdGhlIGZsYWdzIGJ5IDI5IHNvIHRoYXQgMzAgJiAzMSAmIDMyIGJpdHMgY29udGFpbnMgdGhlIGluc3RydWN0aW9ucy5cbiAqL1xuZXhwb3J0IGNvbnN0IGVudW0gSTE4bkluc3RydWN0aW9ucyB7XG4gIFRleHQgPSAxIDw8IDI5LFxuICBFbGVtZW50ID0gMiA8PCAyOSxcbiAgRXhwcmVzc2lvbiA9IDMgPDwgMjksXG4gIENsb3NlTm9kZSA9IDQgPDwgMjksXG4gIFJlbW92ZU5vZGUgPSA1IDw8IDI5LFxuICAvKiogVXNlZCB0byBkZWNvZGUgdGhlIG51bWJlciBlbmNvZGVkIHdpdGggdGhlIGluc3RydWN0aW9uLiAqL1xuICBJbmRleE1hc2sgPSAoMSA8PCAyOSkgLSAxLFxuICAvKiogVXNlZCB0byB0ZXN0IHRoZSB0eXBlIG9mIGluc3RydWN0aW9uLiAqL1xuICBJbnN0cnVjdGlvbk1hc2sgPSB+KCgxIDw8IDI5KSAtIDEpLFxufVxuXG4vKipcbiAqIFJlcHJlc2VudHMgdGhlIGluc3RydWN0aW9ucyB1c2VkIHRvIHRyYW5zbGF0ZSB0aGUgdGVtcGxhdGUuXG4gKiBJbnN0cnVjdGlvbnMgY2FuIGJlIGEgcGxhY2Vob2xkZXIgaW5kZXgsIGEgc3RhdGljIHRleHQgb3IgYSBzaW1wbGUgYml0IGZpZWxkIChgSTE4bkZsYWdgKS5cbiAqIFdoZW4gdGhlIGluc3RydWN0aW9uIGlzIHRoZSBmbGFnIGBUZXh0YCwgaXQgaXMgYWx3YXlzIGZvbGxvd2VkIGJ5IGl0cyB0ZXh0IHZhbHVlLlxuICovXG5leHBvcnQgdHlwZSBJMThuSW5zdHJ1Y3Rpb24gPSBudW1iZXIgfCBzdHJpbmc7XG4vKipcbiAqIFJlcHJlc2VudHMgdGhlIGluc3RydWN0aW9ucyB1c2VkIHRvIHRyYW5zbGF0ZSBhdHRyaWJ1dGVzIGNvbnRhaW5pbmcgZXhwcmVzc2lvbnMuXG4gKiBFdmVuIGluZGV4ZXMgY29udGFpbiBzdGF0aWMgc3RyaW5ncywgd2hpbGUgb2RkIGluZGV4ZXMgY29udGFpbiB0aGUgaW5kZXggb2YgdGhlIGV4cHJlc3Npb24gd2hvc2VcbiAqIHZhbHVlIHdpbGwgYmUgY29uY2F0ZW5hdGVkIGludG8gdGhlIGZpbmFsIHRyYW5zbGF0aW9uLlxuICovXG5leHBvcnQgdHlwZSBJMThuRXhwSW5zdHJ1Y3Rpb24gPSBudW1iZXIgfCBzdHJpbmc7XG4vKiogTWFwcGluZyBvZiBwbGFjZWhvbGRlciBuYW1lcyB0byB0aGVpciBhYnNvbHV0ZSBpbmRleGVzIGluIHRoZWlyIHRlbXBsYXRlcy4gKi9cbmV4cG9ydCB0eXBlIFBsYWNlaG9sZGVyTWFwID0ge1xuICBbbmFtZTogc3RyaW5nXTogbnVtYmVyXG59O1xuY29uc3QgaTE4blRhZ1JlZ2V4ID0gL1xce1xcJChbXn1dKylcXH0vZztcblxuLyoqXG4gKiBUYWtlcyBhIHRyYW5zbGF0aW9uIHN0cmluZywgdGhlIGluaXRpYWwgbGlzdCBvZiBwbGFjZWhvbGRlcnMgKGVsZW1lbnRzIGFuZCBleHByZXNzaW9ucykgYW5kIHRoZVxuICogaW5kZXhlcyBvZiB0aGVpciBjb3JyZXNwb25kaW5nIGV4cHJlc3Npb24gbm9kZXMgdG8gcmV0dXJuIGEgbGlzdCBvZiBpbnN0cnVjdGlvbnMgZm9yIGVhY2hcbiAqIHRlbXBsYXRlIGZ1bmN0aW9uLlxuICpcbiAqIEJlY2F1c2UgZW1iZWRkZWQgdGVtcGxhdGVzIGhhdmUgZGlmZmVyZW50IGluZGV4ZXMgZm9yIGVhY2ggcGxhY2Vob2xkZXIsIGVhY2ggcGFyYW1ldGVyIChleGNlcHRcbiAqIHRoZSB0cmFuc2xhdGlvbikgaXMgYW4gYXJyYXksIHdoZXJlIGVhY2ggdmFsdWUgY29ycmVzcG9uZHMgdG8gYSBkaWZmZXJlbnQgdGVtcGxhdGUsIGJ5IG9yZGVyIG9mXG4gKiBhcHBlYXJhbmNlLlxuICpcbiAqIEBwYXJhbSB0cmFuc2xhdGlvbiBBIHRyYW5zbGF0aW9uIHN0cmluZyB3aGVyZSBwbGFjZWhvbGRlcnMgYXJlIHJlcHJlc2VudGVkIGJ5IGB7JG5hbWV9YFxuICogQHBhcmFtIGVsZW1lbnRzIEFuIGFycmF5IGNvbnRhaW5pbmcsIGZvciBlYWNoIHRlbXBsYXRlLCB0aGUgbWFwcyBvZiBlbGVtZW50IHBsYWNlaG9sZGVycyBhbmRcbiAqIHRoZWlyIGluZGV4ZXMuXG4gKiBAcGFyYW0gZXhwcmVzc2lvbnMgQW4gYXJyYXkgY29udGFpbmluZywgZm9yIGVhY2ggdGVtcGxhdGUsIHRoZSBtYXBzIG9mIGV4cHJlc3Npb24gcGxhY2Vob2xkZXJzXG4gKiBhbmQgdGhlaXIgaW5kZXhlcy5cbiAqIEBwYXJhbSB0bXBsQ29udGFpbmVycyBBbiBhcnJheSBvZiB0ZW1wbGF0ZSBjb250YWluZXIgcGxhY2Vob2xkZXJzIHdob3NlIGNvbnRlbnQgc2hvdWxkIGJlIGlnbm9yZWRcbiAqIHdoZW4gZ2VuZXJhdGluZyB0aGUgaW5zdHJ1Y3Rpb25zIGZvciB0aGVpciBwYXJlbnQgdGVtcGxhdGUuXG4gKiBAcGFyYW0gbGFzdENoaWxkSW5kZXggVGhlIGluZGV4IG9mIHRoZSBsYXN0IGNoaWxkIG9mIHRoZSBpMThuIG5vZGUuIFVzZWQgd2hlbiB0aGUgaTE4biBibG9jayBpc1xuICogYW4gbmctY29udGFpbmVyLlxuICpcbiAqIEByZXR1cm5zIEEgbGlzdCBvZiBpbnN0cnVjdGlvbnMgdXNlZCB0byB0cmFuc2xhdGUgZWFjaCB0ZW1wbGF0ZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGkxOG5NYXBwaW5nKFxuICAgIHRyYW5zbGF0aW9uOiBzdHJpbmcsIGVsZW1lbnRzOiAoUGxhY2Vob2xkZXJNYXAgfCBudWxsKVtdIHwgbnVsbCxcbiAgICBleHByZXNzaW9ucz86IChQbGFjZWhvbGRlck1hcCB8IG51bGwpW10gfCBudWxsLCB0bXBsQ29udGFpbmVycz86IHN0cmluZ1tdIHwgbnVsbCxcbiAgICBsYXN0Q2hpbGRJbmRleD86IG51bWJlciB8IG51bGwpOiBJMThuSW5zdHJ1Y3Rpb25bXVtdIHtcbiAgY29uc3QgdHJhbnNsYXRpb25QYXJ0cyA9IHRyYW5zbGF0aW9uLnNwbGl0KGkxOG5UYWdSZWdleCk7XG4gIGNvbnN0IGluc3RydWN0aW9uczogSTE4bkluc3RydWN0aW9uW11bXSA9IFtdO1xuXG4gIGdlbmVyYXRlTWFwcGluZ0luc3RydWN0aW9ucyhcbiAgICAgIDAsIHRyYW5zbGF0aW9uUGFydHMsIGluc3RydWN0aW9ucywgZWxlbWVudHMsIGV4cHJlc3Npb25zLCB0bXBsQ29udGFpbmVycywgbGFzdENoaWxkSW5kZXgpO1xuXG4gIHJldHVybiBpbnN0cnVjdGlvbnM7XG59XG5cbi8qKlxuICogSW50ZXJuYWwgZnVuY3Rpb24gdGhhdCByZWFkcyB0aGUgdHJhbnNsYXRpb24gcGFydHMgYW5kIGdlbmVyYXRlcyBhIHNldCBvZiBpbnN0cnVjdGlvbnMgZm9yIGVhY2hcbiAqIHRlbXBsYXRlLlxuICpcbiAqIFNlZSBgaTE4bk1hcHBpbmcoKWAgZm9yIG1vcmUgZGV0YWlscy5cbiAqXG4gKiBAcGFyYW0gaW5kZXggVGhlIGN1cnJlbnQgaW5kZXggaW4gYHRyYW5zbGF0aW9uUGFydHNgLlxuICogQHBhcmFtIHRyYW5zbGF0aW9uUGFydHMgVGhlIHRyYW5zbGF0aW9uIHN0cmluZyBzcGxpdCBpbnRvIGFuIGFycmF5IG9mIHBsYWNlaG9sZGVycyBhbmQgdGV4dFxuICogZWxlbWVudHMuXG4gKiBAcGFyYW0gaW5zdHJ1Y3Rpb25zIFRoZSBjdXJyZW50IGxpc3Qgb2YgaW5zdHJ1Y3Rpb25zIHRvIHVwZGF0ZS5cbiAqIEBwYXJhbSBlbGVtZW50cyBBbiBhcnJheSBjb250YWluaW5nLCBmb3IgZWFjaCB0ZW1wbGF0ZSwgdGhlIG1hcHMgb2YgZWxlbWVudCBwbGFjZWhvbGRlcnMgYW5kXG4gKiB0aGVpciBpbmRleGVzLlxuICogQHBhcmFtIGV4cHJlc3Npb25zIEFuIGFycmF5IGNvbnRhaW5pbmcsIGZvciBlYWNoIHRlbXBsYXRlLCB0aGUgbWFwcyBvZiBleHByZXNzaW9uIHBsYWNlaG9sZGVyc1xuICogYW5kIHRoZWlyIGluZGV4ZXMuXG4gKiBAcGFyYW0gdG1wbENvbnRhaW5lcnMgQW4gYXJyYXkgb2YgdGVtcGxhdGUgY29udGFpbmVyIHBsYWNlaG9sZGVycyB3aG9zZSBjb250ZW50IHNob3VsZCBiZSBpZ25vcmVkXG4gKiB3aGVuIGdlbmVyYXRpbmcgdGhlIGluc3RydWN0aW9ucyBmb3IgdGhlaXIgcGFyZW50IHRlbXBsYXRlLlxuICogQHBhcmFtIGxhc3RDaGlsZEluZGV4IFRoZSBpbmRleCBvZiB0aGUgbGFzdCBjaGlsZCBvZiB0aGUgaTE4biBub2RlLiBVc2VkIHdoZW4gdGhlIGkxOG4gYmxvY2sgaXNcbiAqIGFuIG5nLWNvbnRhaW5lci5cbiAqIEByZXR1cm5zIHRoZSBjdXJyZW50IGluZGV4IGluIGB0cmFuc2xhdGlvblBhcnRzYFxuICovXG5mdW5jdGlvbiBnZW5lcmF0ZU1hcHBpbmdJbnN0cnVjdGlvbnMoXG4gICAgaW5kZXg6IG51bWJlciwgdHJhbnNsYXRpb25QYXJ0czogc3RyaW5nW10sIGluc3RydWN0aW9uczogSTE4bkluc3RydWN0aW9uW11bXSxcbiAgICBlbGVtZW50czogKFBsYWNlaG9sZGVyTWFwIHwgbnVsbClbXSB8IG51bGwsIGV4cHJlc3Npb25zPzogKFBsYWNlaG9sZGVyTWFwIHwgbnVsbClbXSB8IG51bGwsXG4gICAgdG1wbENvbnRhaW5lcnM/OiBzdHJpbmdbXSB8IG51bGwsIGxhc3RDaGlsZEluZGV4PzogbnVtYmVyIHwgbnVsbCk6IG51bWJlciB7XG4gIGNvbnN0IHRtcGxJbmRleCA9IGluc3RydWN0aW9ucy5sZW5ndGg7XG4gIGNvbnN0IHRtcGxJbnN0cnVjdGlvbnM6IEkxOG5JbnN0cnVjdGlvbltdID0gW107XG4gIGNvbnN0IHBoVmlzaXRlZCA9IFtdO1xuICBsZXQgb3BlbmVkVGFnQ291bnQgPSAwO1xuICBsZXQgbWF4SW5kZXggPSAwO1xuXG4gIGluc3RydWN0aW9ucy5wdXNoKHRtcGxJbnN0cnVjdGlvbnMpO1xuXG4gIGZvciAoOyBpbmRleCA8IHRyYW5zbGF0aW9uUGFydHMubGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgY29uc3QgdmFsdWUgPSB0cmFuc2xhdGlvblBhcnRzW2luZGV4XTtcblxuICAgIC8vIE9kZCBpbmRleGVzIGFyZSBwbGFjZWhvbGRlcnNcbiAgICBpZiAoaW5kZXggJiAxKSB7XG4gICAgICBsZXQgcGhJbmRleDtcblxuICAgICAgaWYgKGVsZW1lbnRzICYmIGVsZW1lbnRzW3RtcGxJbmRleF0gJiZcbiAgICAgICAgICB0eXBlb2YocGhJbmRleCA9IGVsZW1lbnRzW3RtcGxJbmRleF0gIVt2YWx1ZV0pICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAvLyBUaGUgcGxhY2Vob2xkZXIgcmVwcmVzZW50cyBhIERPTSBlbGVtZW50XG4gICAgICAgIC8vIEFkZCBhbiBpbnN0cnVjdGlvbiB0byBtb3ZlIHRoZSBlbGVtZW50XG4gICAgICAgIHRtcGxJbnN0cnVjdGlvbnMucHVzaChwaEluZGV4IHwgSTE4bkluc3RydWN0aW9ucy5FbGVtZW50KTtcbiAgICAgICAgcGhWaXNpdGVkLnB1c2godmFsdWUpO1xuICAgICAgICBvcGVuZWRUYWdDb3VudCsrO1xuICAgICAgfSBlbHNlIGlmIChcbiAgICAgICAgICBleHByZXNzaW9ucyAmJiBleHByZXNzaW9uc1t0bXBsSW5kZXhdICYmXG4gICAgICAgICAgdHlwZW9mKHBoSW5kZXggPSBleHByZXNzaW9uc1t0bXBsSW5kZXhdICFbdmFsdWVdKSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgLy8gVGhlIHBsYWNlaG9sZGVyIHJlcHJlc2VudHMgYW4gZXhwcmVzc2lvblxuICAgICAgICAvLyBBZGQgYW4gaW5zdHJ1Y3Rpb24gdG8gbW92ZSB0aGUgZXhwcmVzc2lvblxuICAgICAgICB0bXBsSW5zdHJ1Y3Rpb25zLnB1c2gocGhJbmRleCB8IEkxOG5JbnN0cnVjdGlvbnMuRXhwcmVzc2lvbik7XG4gICAgICAgIHBoVmlzaXRlZC5wdXNoKHZhbHVlKTtcbiAgICAgIH0gZWxzZSB7ICAvLyBJdCBpcyBhIGNsb3NpbmcgdGFnXG4gICAgICAgIHRtcGxJbnN0cnVjdGlvbnMucHVzaChJMThuSW5zdHJ1Y3Rpb25zLkNsb3NlTm9kZSk7XG5cbiAgICAgICAgaWYgKHRtcGxJbmRleCA+IDApIHtcbiAgICAgICAgICBvcGVuZWRUYWdDb3VudC0tO1xuXG4gICAgICAgICAgLy8gSWYgd2UgaGF2ZSByZWFjaGVkIHRoZSBjbG9zaW5nIHRhZyBmb3IgdGhpcyB0ZW1wbGF0ZSwgZXhpdCB0aGUgbG9vcFxuICAgICAgICAgIGlmIChvcGVuZWRUYWdDb3VudCA9PT0gMCkge1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmICh0eXBlb2YgcGhJbmRleCAhPT0gJ3VuZGVmaW5lZCcgJiYgcGhJbmRleCA+IG1heEluZGV4KSB7XG4gICAgICAgIG1heEluZGV4ID0gcGhJbmRleDtcbiAgICAgIH1cblxuICAgICAgaWYgKHRtcGxDb250YWluZXJzICYmIHRtcGxDb250YWluZXJzLmluZGV4T2YodmFsdWUpICE9PSAtMSAmJlxuICAgICAgICAgIHRtcGxDb250YWluZXJzLmluZGV4T2YodmFsdWUpID49IHRtcGxJbmRleCkge1xuICAgICAgICBpbmRleCA9IGdlbmVyYXRlTWFwcGluZ0luc3RydWN0aW9ucyhcbiAgICAgICAgICAgIGluZGV4LCB0cmFuc2xhdGlvblBhcnRzLCBpbnN0cnVjdGlvbnMsIGVsZW1lbnRzLCBleHByZXNzaW9ucywgdG1wbENvbnRhaW5lcnMsXG4gICAgICAgICAgICBsYXN0Q2hpbGRJbmRleCk7XG4gICAgICB9XG5cbiAgICB9IGVsc2UgaWYgKHZhbHVlKSB7XG4gICAgICAvLyBJdCdzIGEgbm9uLWVtcHR5IHN0cmluZywgY3JlYXRlIGEgdGV4dCBub2RlXG4gICAgICB0bXBsSW5zdHJ1Y3Rpb25zLnB1c2goSTE4bkluc3RydWN0aW9ucy5UZXh0LCB2YWx1ZSk7XG4gICAgfVxuICB9XG5cbiAgLy8gQ2hlY2sgaWYgc29tZSBlbGVtZW50cyBmcm9tIHRoZSB0ZW1wbGF0ZSBhcmUgbWlzc2luZyBmcm9tIHRoZSB0cmFuc2xhdGlvblxuICBpZiAoZWxlbWVudHMpIHtcbiAgICBjb25zdCB0bXBsRWxlbWVudHMgPSBlbGVtZW50c1t0bXBsSW5kZXhdO1xuXG4gICAgaWYgKHRtcGxFbGVtZW50cykge1xuICAgICAgY29uc3QgcGhLZXlzID0gT2JqZWN0LmtleXModG1wbEVsZW1lbnRzKTtcblxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwaEtleXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3QgcGggPSBwaEtleXNbaV07XG5cbiAgICAgICAgaWYgKHBoVmlzaXRlZC5pbmRleE9mKHBoKSA9PT0gLTEpIHtcbiAgICAgICAgICBsZXQgaW5kZXggPSB0bXBsRWxlbWVudHNbcGhdO1xuICAgICAgICAgIC8vIEFkZCBhbiBpbnN0cnVjdGlvbiB0byByZW1vdmUgdGhlIGVsZW1lbnRcbiAgICAgICAgICB0bXBsSW5zdHJ1Y3Rpb25zLnB1c2goaW5kZXggfCBJMThuSW5zdHJ1Y3Rpb25zLlJlbW92ZU5vZGUpO1xuXG4gICAgICAgICAgaWYgKGluZGV4ID4gbWF4SW5kZXgpIHtcbiAgICAgICAgICAgIG1heEluZGV4ID0gaW5kZXg7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8gQ2hlY2sgaWYgc29tZSBleHByZXNzaW9ucyBmcm9tIHRoZSB0ZW1wbGF0ZSBhcmUgbWlzc2luZyBmcm9tIHRoZSB0cmFuc2xhdGlvblxuICBpZiAoZXhwcmVzc2lvbnMpIHtcbiAgICBjb25zdCB0bXBsRXhwcmVzc2lvbnMgPSBleHByZXNzaW9uc1t0bXBsSW5kZXhdO1xuXG4gICAgaWYgKHRtcGxFeHByZXNzaW9ucykge1xuICAgICAgY29uc3QgcGhLZXlzID0gT2JqZWN0LmtleXModG1wbEV4cHJlc3Npb25zKTtcblxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwaEtleXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3QgcGggPSBwaEtleXNbaV07XG5cbiAgICAgICAgaWYgKHBoVmlzaXRlZC5pbmRleE9mKHBoKSA9PT0gLTEpIHtcbiAgICAgICAgICBsZXQgaW5kZXggPSB0bXBsRXhwcmVzc2lvbnNbcGhdO1xuICAgICAgICAgIGlmIChuZ0Rldk1vZGUpIHtcbiAgICAgICAgICAgIGFzc2VydExlc3NUaGFuKFxuICAgICAgICAgICAgICAgIGluZGV4LnRvU3RyaW5nKDIpLmxlbmd0aCwgMjgsIGBJbmRleCAke2luZGV4fSBpcyB0b28gYmlnIGFuZCB3aWxsIG92ZXJmbG93YCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIC8vIEFkZCBhbiBpbnN0cnVjdGlvbiB0byByZW1vdmUgdGhlIGV4cHJlc3Npb25cbiAgICAgICAgICB0bXBsSW5zdHJ1Y3Rpb25zLnB1c2goaW5kZXggfCBJMThuSW5zdHJ1Y3Rpb25zLlJlbW92ZU5vZGUpO1xuXG4gICAgICAgICAgaWYgKGluZGV4ID4gbWF4SW5kZXgpIHtcbiAgICAgICAgICAgIG1heEluZGV4ID0gaW5kZXg7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgaWYgKHRtcGxJbmRleCA9PT0gMCAmJiB0eXBlb2YgbGFzdENoaWxkSW5kZXggPT09ICdudW1iZXInKSB7XG4gICAgLy8gVGhlIGN1cnJlbnQgcGFyZW50IGlzIGFuIG5nLWNvbnRhaW5lciBhbmQgaXQgaGFzIG1vcmUgY2hpbGRyZW4gYWZ0ZXIgdGhlIHRyYW5zbGF0aW9uIHRoYXQgd2VcbiAgICAvLyBuZWVkIHRvIGFwcGVuZCB0byBrZWVwIHRoZSBvcmRlciBvZiB0aGUgRE9NIG5vZGVzIGNvcnJlY3RcbiAgICBmb3IgKGxldCBpID0gbWF4SW5kZXggKyAxOyBpIDw9IGxhc3RDaGlsZEluZGV4OyBpKyspIHtcbiAgICAgIGlmIChuZ0Rldk1vZGUpIHtcbiAgICAgICAgYXNzZXJ0TGVzc1RoYW4oaS50b1N0cmluZygyKS5sZW5ndGgsIDI4LCBgSW5kZXggJHtpfSBpcyB0b28gYmlnIGFuZCB3aWxsIG92ZXJmbG93YCk7XG4gICAgICB9XG4gICAgICAvLyBXZSBjb25zaWRlciB0aG9zZSBhZGRpdGlvbmFsIHBsYWNlaG9sZGVycyBhcyBleHByZXNzaW9ucyBiZWNhdXNlIHdlIGRvbid0IGNhcmUgYWJvdXRcbiAgICAgIC8vIHRoZWlyIGNoaWxkcmVuLCBhbGwgd2UgbmVlZCB0byBkbyBpcyB0byBhcHBlbmQgdGhlbVxuICAgICAgdG1wbEluc3RydWN0aW9ucy5wdXNoKGkgfCBJMThuSW5zdHJ1Y3Rpb25zLkV4cHJlc3Npb24pO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBpbmRleDtcbn1cblxuZnVuY3Rpb24gYXBwZW5kSTE4bk5vZGUobm9kZTogTE5vZGUsIHBhcmVudE5vZGU6IExOb2RlLCBwcmV2aW91c05vZGU6IExOb2RlKSB7XG4gIGlmIChuZ0Rldk1vZGUpIHtcbiAgICBuZ0Rldk1vZGUucmVuZGVyZXJNb3ZlTm9kZSsrO1xuICB9XG5cbiAgY29uc3Qgdmlld0RhdGEgPSBnZXRWaWV3RGF0YSgpO1xuXG4gIGFwcGVuZENoaWxkKHBhcmVudE5vZGUsIG5vZGUubmF0aXZlIHx8IG51bGwsIHZpZXdEYXRhKTtcblxuICAvLyBPbiBmaXJzdCBwYXNzLCByZS1vcmdhbml6ZSBub2RlIHRyZWUgdG8gcHV0IHRoaXMgbm9kZSBpbiB0aGUgY29ycmVjdCBwb3NpdGlvbi5cbiAgY29uc3QgZmlyc3RUZW1wbGF0ZVBhc3MgPSBub2RlLnZpZXdbVFZJRVddLmZpcnN0VGVtcGxhdGVQYXNzO1xuICBpZiAoZmlyc3RUZW1wbGF0ZVBhc3MpIHtcbiAgICBub2RlLnROb2RlLm5leHQgPSBudWxsO1xuICAgIGlmIChwcmV2aW91c05vZGUgPT09IHBhcmVudE5vZGUgJiYgbm9kZS50Tm9kZSAhPT0gcGFyZW50Tm9kZS50Tm9kZS5jaGlsZCkge1xuICAgICAgbm9kZS50Tm9kZS5uZXh0ID0gcGFyZW50Tm9kZS50Tm9kZS5jaGlsZDtcbiAgICAgIHBhcmVudE5vZGUudE5vZGUuY2hpbGQgPSBub2RlLnROb2RlO1xuICAgIH0gZWxzZSBpZiAocHJldmlvdXNOb2RlICE9PSBwYXJlbnROb2RlICYmIG5vZGUudE5vZGUgIT09IHByZXZpb3VzTm9kZS50Tm9kZS5uZXh0KSB7XG4gICAgICBub2RlLnROb2RlLm5leHQgPSBwcmV2aW91c05vZGUudE5vZGUubmV4dDtcbiAgICAgIHByZXZpb3VzTm9kZS50Tm9kZS5uZXh0ID0gbm9kZS50Tm9kZTtcbiAgICB9XG4gIH1cblxuICAvLyBUZW1wbGF0ZSBjb250YWluZXJzIGFsc28gaGF2ZSBhIGNvbW1lbnQgbm9kZSBmb3IgdGhlIGBWaWV3Q29udGFpbmVyUmVmYCB0aGF0IHNob3VsZCBiZSBtb3ZlZFxuICBpZiAobm9kZS50Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuQ29udGFpbmVyICYmIG5vZGUuZHluYW1pY0xDb250YWluZXJOb2RlKSB7XG4gICAgLy8gKG5vZGUubmF0aXZlIGFzIFJDb21tZW50KS50ZXh0Q29udGVudCA9ICd0ZXN0JztcbiAgICAvLyBjb25zb2xlLmxvZyhub2RlLm5hdGl2ZSk7XG4gICAgYXBwZW5kQ2hpbGQocGFyZW50Tm9kZSwgbm9kZS5keW5hbWljTENvbnRhaW5lck5vZGUubmF0aXZlIHx8IG51bGwsIHZpZXdEYXRhKTtcbiAgICBpZiAoZmlyc3RUZW1wbGF0ZVBhc3MpIHtcbiAgICAgIG5vZGUudE5vZGUuZHluYW1pY0NvbnRhaW5lck5vZGUgPSBub2RlLmR5bmFtaWNMQ29udGFpbmVyTm9kZS50Tm9kZTtcbiAgICAgIG5vZGUuZHluYW1pY0xDb250YWluZXJOb2RlLnROb2RlLnBhcmVudCA9IG5vZGUudE5vZGUgYXMgVENvbnRhaW5lck5vZGU7XG4gICAgfVxuICAgIHJldHVybiBub2RlLmR5bmFtaWNMQ29udGFpbmVyTm9kZTtcbiAgfVxuXG4gIHJldHVybiBub2RlO1xufVxuXG4vKipcbiAqIFRha2VzIGEgbGlzdCBvZiBpbnN0cnVjdGlvbnMgZ2VuZXJhdGVkIGJ5IGBpMThuTWFwcGluZygpYCB0byB0cmFuc2Zvcm0gdGhlIHRlbXBsYXRlIGFjY29yZGluZ2x5LlxuICpcbiAqIEBwYXJhbSBzdGFydEluZGV4IEluZGV4IG9mIHRoZSBmaXJzdCBlbGVtZW50IHRvIHRyYW5zbGF0ZSAoZm9yIGluc3RhbmNlIHRoZSBmaXJzdCBjaGlsZCBvZiB0aGVcbiAqIGVsZW1lbnQgd2l0aCB0aGUgaTE4biBhdHRyaWJ1dGUpLlxuICogQHBhcmFtIGluc3RydWN0aW9ucyBUaGUgbGlzdCBvZiBpbnN0cnVjdGlvbnMgdG8gYXBwbHkgb24gdGhlIGN1cnJlbnQgdmlldy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGkxOG5BcHBseShzdGFydEluZGV4OiBudW1iZXIsIGluc3RydWN0aW9uczogSTE4bkluc3RydWN0aW9uW10pOiB2b2lkIHtcbiAgY29uc3Qgdmlld0RhdGEgPSBnZXRWaWV3RGF0YSgpO1xuICBpZiAobmdEZXZNb2RlKSB7XG4gICAgYXNzZXJ0RXF1YWwodmlld0RhdGFbQklORElOR19JTkRFWF0sIC0xLCAnaTE4bkFwcGx5IHNob3VsZCBiZSBjYWxsZWQgYmVmb3JlIGFueSBiaW5kaW5nJyk7XG4gIH1cblxuICBpZiAoIWluc3RydWN0aW9ucykge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvbnN0IHJlbmRlcmVyID0gZ2V0UmVuZGVyZXIoKTtcbiAgbGV0IGxvY2FsUGFyZW50Tm9kZTogTE5vZGUgPSBnZXRQYXJlbnRMTm9kZShsb2FkKHN0YXJ0SW5kZXgpKSB8fCBnZXRQcmV2aW91c09yUGFyZW50Tm9kZSgpO1xuICBsZXQgbG9jYWxQcmV2aW91c05vZGU6IExOb2RlID0gbG9jYWxQYXJlbnROb2RlO1xuICByZXNldEFwcGxpY2F0aW9uU3RhdGUoKTsgIC8vIFdlIGRvbid0IHdhbnQgdG8gYWRkIHRvIHRoZSB0cmVlIHdpdGggdGhlIHdyb25nIHByZXZpb3VzIG5vZGVcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IGluc3RydWN0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IGluc3RydWN0aW9uID0gaW5zdHJ1Y3Rpb25zW2ldIGFzIG51bWJlcjtcbiAgICBzd2l0Y2ggKGluc3RydWN0aW9uICYgSTE4bkluc3RydWN0aW9ucy5JbnN0cnVjdGlvbk1hc2spIHtcbiAgICAgIGNhc2UgSTE4bkluc3RydWN0aW9ucy5FbGVtZW50OlxuICAgICAgICBjb25zdCBlbGVtZW50OiBMTm9kZSA9IGxvYWQoaW5zdHJ1Y3Rpb24gJiBJMThuSW5zdHJ1Y3Rpb25zLkluZGV4TWFzayk7XG4gICAgICAgIGxvY2FsUHJldmlvdXNOb2RlID0gYXBwZW5kSTE4bk5vZGUoZWxlbWVudCwgbG9jYWxQYXJlbnROb2RlLCBsb2NhbFByZXZpb3VzTm9kZSk7XG4gICAgICAgIGxvY2FsUGFyZW50Tm9kZSA9IGVsZW1lbnQ7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBJMThuSW5zdHJ1Y3Rpb25zLkV4cHJlc3Npb246XG4gICAgICAgIGNvbnN0IGV4cHI6IExOb2RlID0gbG9hZChpbnN0cnVjdGlvbiAmIEkxOG5JbnN0cnVjdGlvbnMuSW5kZXhNYXNrKTtcbiAgICAgICAgbG9jYWxQcmV2aW91c05vZGUgPSBhcHBlbmRJMThuTm9kZShleHByLCBsb2NhbFBhcmVudE5vZGUsIGxvY2FsUHJldmlvdXNOb2RlKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIEkxOG5JbnN0cnVjdGlvbnMuVGV4dDpcbiAgICAgICAgaWYgKG5nRGV2TW9kZSkge1xuICAgICAgICAgIG5nRGV2TW9kZS5yZW5kZXJlckNyZWF0ZVRleHROb2RlKys7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgdmFsdWUgPSBpbnN0cnVjdGlvbnNbKytpXTtcbiAgICAgICAgY29uc3QgdGV4dFJOb2RlID0gY3JlYXRlVGV4dE5vZGUodmFsdWUsIHJlbmRlcmVyKTtcbiAgICAgICAgLy8gSWYgd2Ugd2VyZSB0byBvbmx5IGNyZWF0ZSBhIGBSTm9kZWAgdGhlbiBwcm9qZWN0aW9ucyB3b24ndCBtb3ZlIHRoZSB0ZXh0LlxuICAgICAgICAvLyBDcmVhdGUgdGV4dCBub2RlIGF0IHRoZSBjdXJyZW50IGVuZCBvZiB2aWV3RGF0YS4gTXVzdCBzdWJ0cmFjdCBoZWFkZXIgb2Zmc2V0IGJlY2F1c2VcbiAgICAgICAgLy8gY3JlYXRlTE5vZGUgdGFrZXMgYSByYXcgaW5kZXggKG5vdCBhZGp1c3RlZCBieSBoZWFkZXIgb2Zmc2V0KS5cbiAgICAgICAgY29uc3QgdGV4dExOb2RlID1cbiAgICAgICAgICAgIGNyZWF0ZUxOb2RlKHZpZXdEYXRhLmxlbmd0aCAtIEhFQURFUl9PRkZTRVQsIFROb2RlVHlwZS5FbGVtZW50LCB0ZXh0Uk5vZGUsIG51bGwsIG51bGwpO1xuICAgICAgICBsb2NhbFByZXZpb3VzTm9kZSA9IGFwcGVuZEkxOG5Ob2RlKHRleHRMTm9kZSwgbG9jYWxQYXJlbnROb2RlLCBsb2NhbFByZXZpb3VzTm9kZSk7XG4gICAgICAgIHJlc2V0QXBwbGljYXRpb25TdGF0ZSgpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgSTE4bkluc3RydWN0aW9ucy5DbG9zZU5vZGU6XG4gICAgICAgIGxvY2FsUHJldmlvdXNOb2RlID0gbG9jYWxQYXJlbnROb2RlO1xuICAgICAgICBsb2NhbFBhcmVudE5vZGUgPSBnZXRQYXJlbnRMTm9kZShsb2NhbFBhcmVudE5vZGUpICE7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBJMThuSW5zdHJ1Y3Rpb25zLlJlbW92ZU5vZGU6XG4gICAgICAgIGlmIChuZ0Rldk1vZGUpIHtcbiAgICAgICAgICBuZ0Rldk1vZGUucmVuZGVyZXJSZW1vdmVOb2RlKys7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgaW5kZXggPSBpbnN0cnVjdGlvbiAmIEkxOG5JbnN0cnVjdGlvbnMuSW5kZXhNYXNrO1xuICAgICAgICBjb25zdCByZW1vdmVkTm9kZTogTE5vZGV8TENvbnRhaW5lck5vZGUgPSBsb2FkKGluZGV4KTtcbiAgICAgICAgY29uc3QgcGFyZW50Tm9kZSA9IGdldFBhcmVudExOb2RlKHJlbW92ZWROb2RlKSAhO1xuICAgICAgICByZW1vdmVDaGlsZChwYXJlbnROb2RlLCByZW1vdmVkTm9kZS5uYXRpdmUgfHwgbnVsbCwgdmlld0RhdGEpO1xuXG4gICAgICAgIC8vIEZvciB0ZW1wbGF0ZSBjb250YWluZXJzIHdlIGFsc28gbmVlZCB0byByZW1vdmUgdGhlaXIgYFZpZXdDb250YWluZXJSZWZgIGZyb20gdGhlIERPTVxuICAgICAgICBpZiAocmVtb3ZlZE5vZGUudE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkNvbnRhaW5lciAmJiByZW1vdmVkTm9kZS5keW5hbWljTENvbnRhaW5lck5vZGUpIHtcbiAgICAgICAgICByZW1vdmVDaGlsZChwYXJlbnROb2RlLCByZW1vdmVkTm9kZS5keW5hbWljTENvbnRhaW5lck5vZGUubmF0aXZlIHx8IG51bGwsIHZpZXdEYXRhKTtcbiAgICAgICAgICByZW1vdmVkTm9kZS5keW5hbWljTENvbnRhaW5lck5vZGUudE5vZGUuZGV0YWNoZWQgPSB0cnVlO1xuICAgICAgICAgIHJlbW92ZWROb2RlLmR5bmFtaWNMQ29udGFpbmVyTm9kZS5kYXRhW1JFTkRFUl9QQVJFTlRdID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBUYWtlcyBhIHRyYW5zbGF0aW9uIHN0cmluZyBhbmQgdGhlIGluaXRpYWwgbGlzdCBvZiBleHByZXNzaW9ucyBhbmQgcmV0dXJucyBhIGxpc3Qgb2YgaW5zdHJ1Y3Rpb25zXG4gKiB0aGF0IHdpbGwgYmUgdXNlZCB0byB0cmFuc2xhdGUgYW4gYXR0cmlidXRlLlxuICogRXZlbiBpbmRleGVzIGNvbnRhaW4gc3RhdGljIHN0cmluZ3MsIHdoaWxlIG9kZCBpbmRleGVzIGNvbnRhaW4gdGhlIGluZGV4IG9mIHRoZSBleHByZXNzaW9uIHdob3NlXG4gKiB2YWx1ZSB3aWxsIGJlIGNvbmNhdGVuYXRlZCBpbnRvIHRoZSBmaW5hbCB0cmFuc2xhdGlvbi5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGkxOG5FeHBNYXBwaW5nKFxuICAgIHRyYW5zbGF0aW9uOiBzdHJpbmcsIHBsYWNlaG9sZGVyczogUGxhY2Vob2xkZXJNYXApOiBJMThuRXhwSW5zdHJ1Y3Rpb25bXSB7XG4gIGNvbnN0IHN0YXRpY1RleHQ6IEkxOG5FeHBJbnN0cnVjdGlvbltdID0gdHJhbnNsYXRpb24uc3BsaXQoaTE4blRhZ1JlZ2V4KTtcbiAgLy8gb2RkIGluZGV4ZXMgYXJlIHBsYWNlaG9sZGVyc1xuICBmb3IgKGxldCBpID0gMTsgaSA8IHN0YXRpY1RleHQubGVuZ3RoOyBpICs9IDIpIHtcbiAgICBzdGF0aWNUZXh0W2ldID0gcGxhY2Vob2xkZXJzW3N0YXRpY1RleHRbaV1dO1xuICB9XG4gIHJldHVybiBzdGF0aWNUZXh0O1xufVxuXG4vKipcbiAqIENoZWNrcyBpZiB0aGUgdmFsdWUgb2YgdXAgdG8gOCBleHByZXNzaW9ucyBoYXZlIGNoYW5nZWQgYW5kIHJlcGxhY2VzIHRoZW0gYnkgdGhlaXIgdmFsdWVzIGluIGFcbiAqIHRyYW5zbGF0aW9uLCBvciByZXR1cm5zIE5PX0NIQU5HRS5cbiAqXG4gKiBAcmV0dXJucyBUaGUgY29uY2F0ZW5hdGVkIHN0cmluZyB3aGVuIGFueSBvZiB0aGUgYXJndW1lbnRzIGNoYW5nZXMsIGBOT19DSEFOR0VgIG90aGVyd2lzZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGkxOG5JbnRlcnBvbGF0aW9uKFxuICAgIGluc3RydWN0aW9uczogSTE4bkV4cEluc3RydWN0aW9uW10sIG51bWJlck9mRXhwOiBudW1iZXIsIHYwOiBhbnksIHYxPzogYW55LCB2Mj86IGFueSwgdjM/OiBhbnksXG4gICAgdjQ/OiBhbnksIHY1PzogYW55LCB2Nj86IGFueSwgdjc/OiBhbnkpOiBzdHJpbmd8Tk9fQ0hBTkdFIHtcbiAgbGV0IGRpZmZlcmVudCA9IGJpbmRpbmdVcGRhdGVkKHYwKTtcblxuICBpZiAobnVtYmVyT2ZFeHAgPiAxKSB7XG4gICAgZGlmZmVyZW50ID0gYmluZGluZ1VwZGF0ZWQodjEpIHx8IGRpZmZlcmVudDtcblxuICAgIGlmIChudW1iZXJPZkV4cCA+IDIpIHtcbiAgICAgIGRpZmZlcmVudCA9IGJpbmRpbmdVcGRhdGVkKHYyKSB8fCBkaWZmZXJlbnQ7XG5cbiAgICAgIGlmIChudW1iZXJPZkV4cCA+IDMpIHtcbiAgICAgICAgZGlmZmVyZW50ID0gYmluZGluZ1VwZGF0ZWQodjMpIHx8IGRpZmZlcmVudDtcblxuICAgICAgICBpZiAobnVtYmVyT2ZFeHAgPiA0KSB7XG4gICAgICAgICAgZGlmZmVyZW50ID0gYmluZGluZ1VwZGF0ZWQodjQpIHx8IGRpZmZlcmVudDtcblxuICAgICAgICAgIGlmIChudW1iZXJPZkV4cCA+IDUpIHtcbiAgICAgICAgICAgIGRpZmZlcmVudCA9IGJpbmRpbmdVcGRhdGVkKHY1KSB8fCBkaWZmZXJlbnQ7XG5cbiAgICAgICAgICAgIGlmIChudW1iZXJPZkV4cCA+IDYpIHtcbiAgICAgICAgICAgICAgZGlmZmVyZW50ID0gYmluZGluZ1VwZGF0ZWQodjYpIHx8IGRpZmZlcmVudDtcblxuICAgICAgICAgICAgICBpZiAobnVtYmVyT2ZFeHAgPiA3KSB7XG4gICAgICAgICAgICAgICAgZGlmZmVyZW50ID0gYmluZGluZ1VwZGF0ZWQodjcpIHx8IGRpZmZlcmVudDtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGlmICghZGlmZmVyZW50KSB7XG4gICAgcmV0dXJuIE5PX0NIQU5HRTtcbiAgfVxuXG4gIGxldCByZXMgPSAnJztcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBpbnN0cnVjdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICBsZXQgdmFsdWU6IGFueTtcbiAgICAvLyBPZGQgaW5kZXhlcyBhcmUgcGxhY2Vob2xkZXJzXG4gICAgaWYgKGkgJiAxKSB7XG4gICAgICBzd2l0Y2ggKGluc3RydWN0aW9uc1tpXSkge1xuICAgICAgICBjYXNlIDA6XG4gICAgICAgICAgdmFsdWUgPSB2MDtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAxOlxuICAgICAgICAgIHZhbHVlID0gdjE7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgMjpcbiAgICAgICAgICB2YWx1ZSA9IHYyO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIDM6XG4gICAgICAgICAgdmFsdWUgPSB2MztcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSA0OlxuICAgICAgICAgIHZhbHVlID0gdjQ7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgNTpcbiAgICAgICAgICB2YWx1ZSA9IHY1O1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIDY6XG4gICAgICAgICAgdmFsdWUgPSB2NjtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSA3OlxuICAgICAgICAgIHZhbHVlID0gdjc7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG5cbiAgICAgIHJlcyArPSBzdHJpbmdpZnkodmFsdWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXMgKz0gaW5zdHJ1Y3Rpb25zW2ldO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiByZXM7XG59XG5cbi8qKlxuICogQ3JlYXRlIGEgdHJhbnNsYXRlZCBpbnRlcnBvbGF0aW9uIGJpbmRpbmcgd2l0aCBhIHZhcmlhYmxlIG51bWJlciBvZiBleHByZXNzaW9ucy5cbiAqXG4gKiBJZiB0aGVyZSBhcmUgMSB0byA4IGV4cHJlc3Npb25zIHRoZW4gYGkxOG5JbnRlcnBvbGF0aW9uKClgIHNob3VsZCBiZSB1c2VkIGluc3RlYWQuIEl0IGlzIGZhc3RlclxuICogYmVjYXVzZSB0aGVyZSBpcyBubyBuZWVkIHRvIGNyZWF0ZSBhbiBhcnJheSBvZiBleHByZXNzaW9ucyBhbmQgaXRlcmF0ZSBvdmVyIGl0LlxuICpcbiAqIEByZXR1cm5zIFRoZSBjb25jYXRlbmF0ZWQgc3RyaW5nIHdoZW4gYW55IG9mIHRoZSBhcmd1bWVudHMgY2hhbmdlcywgYE5PX0NIQU5HRWAgb3RoZXJ3aXNlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gaTE4bkludGVycG9sYXRpb25WKGluc3RydWN0aW9uczogSTE4bkV4cEluc3RydWN0aW9uW10sIHZhbHVlczogYW55W10pOiBzdHJpbmd8XG4gICAgTk9fQ0hBTkdFIHtcbiAgbGV0IGRpZmZlcmVudCA9IGZhbHNlO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IHZhbHVlcy5sZW5ndGg7IGkrKykge1xuICAgIC8vIENoZWNrIGlmIGJpbmRpbmdzIGhhdmUgY2hhbmdlZFxuICAgIGJpbmRpbmdVcGRhdGVkKHZhbHVlc1tpXSkgJiYgKGRpZmZlcmVudCA9IHRydWUpO1xuICB9XG5cbiAgaWYgKCFkaWZmZXJlbnQpIHtcbiAgICByZXR1cm4gTk9fQ0hBTkdFO1xuICB9XG5cbiAgbGV0IHJlcyA9ICcnO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGluc3RydWN0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgIC8vIE9kZCBpbmRleGVzIGFyZSBwbGFjZWhvbGRlcnNcbiAgICBpZiAoaSAmIDEpIHtcbiAgICAgIHJlcyArPSBzdHJpbmdpZnkodmFsdWVzW2luc3RydWN0aW9uc1tpXSBhcyBudW1iZXJdKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmVzICs9IGluc3RydWN0aW9uc1tpXTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gcmVzO1xufVxuIl19