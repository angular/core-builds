/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { assertEqual, assertLessThan } from './assert';
import { NO_CHANGE, bindingUpdated, createLNode, getPreviousOrParentNode, getRenderer, getViewData, load } from './instructions';
import { RENDER_PARENT } from './interfaces/container';
import { BINDING_INDEX } from './interfaces/view';
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
    if (previousNode === parentNode && parentNode.pChild === null) {
        parentNode.pChild = node;
    }
    else {
        previousNode.pNextOrParent = node;
    }
    // Template containers also have a comment node for the `ViewContainerRef` that should be moved
    if (node.tNode.type === 0 /* Container */ && node.dynamicLContainerNode) {
        // (node.native as RComment).textContent = 'test';
        // console.log(node.native);
        appendChild(parentNode, node.dynamicLContainerNode.native || null, viewData);
        node.pNextOrParent = node.dynamicLContainerNode;
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
                // But since this text doesn't have an index in `LViewData`, we need to create an
                // `LElementNode` with the index -1 so that it isn't saved in `LViewData`
                var textLNode = createLNode(-1, 3 /* Element */, textRNode, null, null);
                localPreviousNode = appendI18nNode(textLNode, localParentNode, localPreviousNode);
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaTE4bi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaTE4bi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsV0FBVyxFQUFFLGNBQWMsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUNyRCxPQUFPLEVBQUMsU0FBUyxFQUFFLGNBQWMsRUFBRSxXQUFXLEVBQUUsdUJBQXVCLEVBQUUsV0FBVyxFQUFFLFdBQVcsRUFBRSxJQUFJLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUMvSCxPQUFPLEVBQUMsYUFBYSxFQUFDLE1BQU0sd0JBQXdCLENBQUM7QUFFckQsT0FBTyxFQUFDLGFBQWEsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQ2hELE9BQU8sRUFBQyxXQUFXLEVBQUUsY0FBYyxFQUFFLGNBQWMsRUFBRSxXQUFXLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUM3RixPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sUUFBUSxDQUFDO0FBa0NqQyxJQUFNLFlBQVksR0FBRyxnQkFBZ0IsQ0FBQztBQUV0Qzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0FvQkc7QUFDSCxNQUFNLHNCQUNGLFdBQW1CLEVBQUUsUUFBMEMsRUFDL0QsV0FBOEMsRUFBRSxjQUFnQyxFQUNoRixjQUE4QjtJQUNoQyxJQUFNLGdCQUFnQixHQUFHLFdBQVcsQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDLENBQUM7SUFDekQsSUFBTSxZQUFZLEdBQXdCLEVBQUUsQ0FBQztJQUU3QywyQkFBMkIsQ0FDdkIsQ0FBQyxFQUFFLGdCQUFnQixFQUFFLFlBQVksRUFBRSxRQUFRLEVBQUUsV0FBVyxFQUFFLGNBQWMsRUFBRSxjQUFjLENBQUMsQ0FBQztJQUU5RixPQUFPLFlBQVksQ0FBQztBQUN0QixDQUFDO0FBRUQ7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0FtQkc7QUFD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RSxFQUFFO1FBQzVDLCtCQUErQjtRQUMvQixJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUU7WUFDVCxHQUFHLElBQUksU0FBUyxDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFXLENBQUMsQ0FBQyxDQUFDO1NBQ3JEO2FBQU07WUFDTCxHQUFHLElBQUksWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDO1NBQ3hCO0tBQ0Y7SUFFRCxPQUFPLEdBQUcsQ0FBQztBQUNiLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7YXNzZXJ0RXF1YWwsIGFzc2VydExlc3NUaGFufSBmcm9tICcuL2Fzc2VydCc7XG5pbXBvcnQge05PX0NIQU5HRSwgYmluZGluZ1VwZGF0ZWQsIGNyZWF0ZUxOb2RlLCBnZXRQcmV2aW91c09yUGFyZW50Tm9kZSwgZ2V0UmVuZGVyZXIsIGdldFZpZXdEYXRhLCBsb2FkfSBmcm9tICcuL2luc3RydWN0aW9ucyc7XG5pbXBvcnQge1JFTkRFUl9QQVJFTlR9IGZyb20gJy4vaW50ZXJmYWNlcy9jb250YWluZXInO1xuaW1wb3J0IHtMQ29udGFpbmVyTm9kZSwgTEVsZW1lbnROb2RlLCBMTm9kZSwgVE5vZGVUeXBlfSBmcm9tICcuL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge0JJTkRJTkdfSU5ERVh9IGZyb20gJy4vaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7YXBwZW5kQ2hpbGQsIGNyZWF0ZVRleHROb2RlLCBnZXRQYXJlbnRMTm9kZSwgcmVtb3ZlQ2hpbGR9IGZyb20gJy4vbm9kZV9tYW5pcHVsYXRpb24nO1xuaW1wb3J0IHtzdHJpbmdpZnl9IGZyb20gJy4vdXRpbCc7XG5cbi8qKlxuICogQSBsaXN0IG9mIGZsYWdzIHRvIGVuY29kZSB0aGUgaTE4biBpbnN0cnVjdGlvbnMgdXNlZCB0byB0cmFuc2xhdGUgdGhlIHRlbXBsYXRlLlxuICogV2Ugc2hpZnQgdGhlIGZsYWdzIGJ5IDI5IHNvIHRoYXQgMzAgJiAzMSAmIDMyIGJpdHMgY29udGFpbnMgdGhlIGluc3RydWN0aW9ucy5cbiAqL1xuZXhwb3J0IGNvbnN0IGVudW0gSTE4bkluc3RydWN0aW9ucyB7XG4gIFRleHQgPSAxIDw8IDI5LFxuICBFbGVtZW50ID0gMiA8PCAyOSxcbiAgRXhwcmVzc2lvbiA9IDMgPDwgMjksXG4gIENsb3NlTm9kZSA9IDQgPDwgMjksXG4gIFJlbW92ZU5vZGUgPSA1IDw8IDI5LFxuICAvKiogVXNlZCB0byBkZWNvZGUgdGhlIG51bWJlciBlbmNvZGVkIHdpdGggdGhlIGluc3RydWN0aW9uLiAqL1xuICBJbmRleE1hc2sgPSAoMSA8PCAyOSkgLSAxLFxuICAvKiogVXNlZCB0byB0ZXN0IHRoZSB0eXBlIG9mIGluc3RydWN0aW9uLiAqL1xuICBJbnN0cnVjdGlvbk1hc2sgPSB+KCgxIDw8IDI5KSAtIDEpLFxufVxuXG4vKipcbiAqIFJlcHJlc2VudHMgdGhlIGluc3RydWN0aW9ucyB1c2VkIHRvIHRyYW5zbGF0ZSB0aGUgdGVtcGxhdGUuXG4gKiBJbnN0cnVjdGlvbnMgY2FuIGJlIGEgcGxhY2Vob2xkZXIgaW5kZXgsIGEgc3RhdGljIHRleHQgb3IgYSBzaW1wbGUgYml0IGZpZWxkIChgSTE4bkZsYWdgKS5cbiAqIFdoZW4gdGhlIGluc3RydWN0aW9uIGlzIHRoZSBmbGFnIGBUZXh0YCwgaXQgaXMgYWx3YXlzIGZvbGxvd2VkIGJ5IGl0cyB0ZXh0IHZhbHVlLlxuICovXG5leHBvcnQgdHlwZSBJMThuSW5zdHJ1Y3Rpb24gPSBudW1iZXIgfCBzdHJpbmc7XG4vKipcbiAqIFJlcHJlc2VudHMgdGhlIGluc3RydWN0aW9ucyB1c2VkIHRvIHRyYW5zbGF0ZSBhdHRyaWJ1dGVzIGNvbnRhaW5pbmcgZXhwcmVzc2lvbnMuXG4gKiBFdmVuIGluZGV4ZXMgY29udGFpbiBzdGF0aWMgc3RyaW5ncywgd2hpbGUgb2RkIGluZGV4ZXMgY29udGFpbiB0aGUgaW5kZXggb2YgdGhlIGV4cHJlc3Npb24gd2hvc2VcbiAqIHZhbHVlIHdpbGwgYmUgY29uY2F0ZW5hdGVkIGludG8gdGhlIGZpbmFsIHRyYW5zbGF0aW9uLlxuICovXG5leHBvcnQgdHlwZSBJMThuRXhwSW5zdHJ1Y3Rpb24gPSBudW1iZXIgfCBzdHJpbmc7XG4vKiogTWFwcGluZyBvZiBwbGFjZWhvbGRlciBuYW1lcyB0byB0aGVpciBhYnNvbHV0ZSBpbmRleGVzIGluIHRoZWlyIHRlbXBsYXRlcy4gKi9cbmV4cG9ydCB0eXBlIFBsYWNlaG9sZGVyTWFwID0ge1xuICBbbmFtZTogc3RyaW5nXTogbnVtYmVyXG59O1xuY29uc3QgaTE4blRhZ1JlZ2V4ID0gL1xce1xcJChbXn1dKylcXH0vZztcblxuLyoqXG4gKiBUYWtlcyBhIHRyYW5zbGF0aW9uIHN0cmluZywgdGhlIGluaXRpYWwgbGlzdCBvZiBwbGFjZWhvbGRlcnMgKGVsZW1lbnRzIGFuZCBleHByZXNzaW9ucykgYW5kIHRoZVxuICogaW5kZXhlcyBvZiB0aGVpciBjb3JyZXNwb25kaW5nIGV4cHJlc3Npb24gbm9kZXMgdG8gcmV0dXJuIGEgbGlzdCBvZiBpbnN0cnVjdGlvbnMgZm9yIGVhY2hcbiAqIHRlbXBsYXRlIGZ1bmN0aW9uLlxuICpcbiAqIEJlY2F1c2UgZW1iZWRkZWQgdGVtcGxhdGVzIGhhdmUgZGlmZmVyZW50IGluZGV4ZXMgZm9yIGVhY2ggcGxhY2Vob2xkZXIsIGVhY2ggcGFyYW1ldGVyIChleGNlcHRcbiAqIHRoZSB0cmFuc2xhdGlvbikgaXMgYW4gYXJyYXksIHdoZXJlIGVhY2ggdmFsdWUgY29ycmVzcG9uZHMgdG8gYSBkaWZmZXJlbnQgdGVtcGxhdGUsIGJ5IG9yZGVyIG9mXG4gKiBhcHBlYXJhbmNlLlxuICpcbiAqIEBwYXJhbSB0cmFuc2xhdGlvbiBBIHRyYW5zbGF0aW9uIHN0cmluZyB3aGVyZSBwbGFjZWhvbGRlcnMgYXJlIHJlcHJlc2VudGVkIGJ5IGB7JG5hbWV9YFxuICogQHBhcmFtIGVsZW1lbnRzIEFuIGFycmF5IGNvbnRhaW5pbmcsIGZvciBlYWNoIHRlbXBsYXRlLCB0aGUgbWFwcyBvZiBlbGVtZW50IHBsYWNlaG9sZGVycyBhbmRcbiAqIHRoZWlyIGluZGV4ZXMuXG4gKiBAcGFyYW0gZXhwcmVzc2lvbnMgQW4gYXJyYXkgY29udGFpbmluZywgZm9yIGVhY2ggdGVtcGxhdGUsIHRoZSBtYXBzIG9mIGV4cHJlc3Npb24gcGxhY2Vob2xkZXJzXG4gKiBhbmQgdGhlaXIgaW5kZXhlcy5cbiAqIEBwYXJhbSB0bXBsQ29udGFpbmVycyBBbiBhcnJheSBvZiB0ZW1wbGF0ZSBjb250YWluZXIgcGxhY2Vob2xkZXJzIHdob3NlIGNvbnRlbnQgc2hvdWxkIGJlIGlnbm9yZWRcbiAqIHdoZW4gZ2VuZXJhdGluZyB0aGUgaW5zdHJ1Y3Rpb25zIGZvciB0aGVpciBwYXJlbnQgdGVtcGxhdGUuXG4gKiBAcGFyYW0gbGFzdENoaWxkSW5kZXggVGhlIGluZGV4IG9mIHRoZSBsYXN0IGNoaWxkIG9mIHRoZSBpMThuIG5vZGUuIFVzZWQgd2hlbiB0aGUgaTE4biBibG9jayBpc1xuICogYW4gbmctY29udGFpbmVyLlxuICpcbiAqIEByZXR1cm5zIEEgbGlzdCBvZiBpbnN0cnVjdGlvbnMgdXNlZCB0byB0cmFuc2xhdGUgZWFjaCB0ZW1wbGF0ZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGkxOG5NYXBwaW5nKFxuICAgIHRyYW5zbGF0aW9uOiBzdHJpbmcsIGVsZW1lbnRzOiAoUGxhY2Vob2xkZXJNYXAgfCBudWxsKVtdIHwgbnVsbCxcbiAgICBleHByZXNzaW9ucz86IChQbGFjZWhvbGRlck1hcCB8IG51bGwpW10gfCBudWxsLCB0bXBsQ29udGFpbmVycz86IHN0cmluZ1tdIHwgbnVsbCxcbiAgICBsYXN0Q2hpbGRJbmRleD86IG51bWJlciB8IG51bGwpOiBJMThuSW5zdHJ1Y3Rpb25bXVtdIHtcbiAgY29uc3QgdHJhbnNsYXRpb25QYXJ0cyA9IHRyYW5zbGF0aW9uLnNwbGl0KGkxOG5UYWdSZWdleCk7XG4gIGNvbnN0IGluc3RydWN0aW9uczogSTE4bkluc3RydWN0aW9uW11bXSA9IFtdO1xuXG4gIGdlbmVyYXRlTWFwcGluZ0luc3RydWN0aW9ucyhcbiAgICAgIDAsIHRyYW5zbGF0aW9uUGFydHMsIGluc3RydWN0aW9ucywgZWxlbWVudHMsIGV4cHJlc3Npb25zLCB0bXBsQ29udGFpbmVycywgbGFzdENoaWxkSW5kZXgpO1xuXG4gIHJldHVybiBpbnN0cnVjdGlvbnM7XG59XG5cbi8qKlxuICogSW50ZXJuYWwgZnVuY3Rpb24gdGhhdCByZWFkcyB0aGUgdHJhbnNsYXRpb24gcGFydHMgYW5kIGdlbmVyYXRlcyBhIHNldCBvZiBpbnN0cnVjdGlvbnMgZm9yIGVhY2hcbiAqIHRlbXBsYXRlLlxuICpcbiAqIFNlZSBgaTE4bk1hcHBpbmcoKWAgZm9yIG1vcmUgZGV0YWlscy5cbiAqXG4gKiBAcGFyYW0gaW5kZXggVGhlIGN1cnJlbnQgaW5kZXggaW4gYHRyYW5zbGF0aW9uUGFydHNgLlxuICogQHBhcmFtIHRyYW5zbGF0aW9uUGFydHMgVGhlIHRyYW5zbGF0aW9uIHN0cmluZyBzcGxpdCBpbnRvIGFuIGFycmF5IG9mIHBsYWNlaG9sZGVycyBhbmQgdGV4dFxuICogZWxlbWVudHMuXG4gKiBAcGFyYW0gaW5zdHJ1Y3Rpb25zIFRoZSBjdXJyZW50IGxpc3Qgb2YgaW5zdHJ1Y3Rpb25zIHRvIHVwZGF0ZS5cbiAqIEBwYXJhbSBlbGVtZW50cyBBbiBhcnJheSBjb250YWluaW5nLCBmb3IgZWFjaCB0ZW1wbGF0ZSwgdGhlIG1hcHMgb2YgZWxlbWVudCBwbGFjZWhvbGRlcnMgYW5kXG4gKiB0aGVpciBpbmRleGVzLlxuICogQHBhcmFtIGV4cHJlc3Npb25zIEFuIGFycmF5IGNvbnRhaW5pbmcsIGZvciBlYWNoIHRlbXBsYXRlLCB0aGUgbWFwcyBvZiBleHByZXNzaW9uIHBsYWNlaG9sZGVyc1xuICogYW5kIHRoZWlyIGluZGV4ZXMuXG4gKiBAcGFyYW0gdG1wbENvbnRhaW5lcnMgQW4gYXJyYXkgb2YgdGVtcGxhdGUgY29udGFpbmVyIHBsYWNlaG9sZGVycyB3aG9zZSBjb250ZW50IHNob3VsZCBiZSBpZ25vcmVkXG4gKiB3aGVuIGdlbmVyYXRpbmcgdGhlIGluc3RydWN0aW9ucyBmb3IgdGhlaXIgcGFyZW50IHRlbXBsYXRlLlxuICogQHBhcmFtIGxhc3RDaGlsZEluZGV4IFRoZSBpbmRleCBvZiB0aGUgbGFzdCBjaGlsZCBvZiB0aGUgaTE4biBub2RlLiBVc2VkIHdoZW4gdGhlIGkxOG4gYmxvY2sgaXNcbiAqIGFuIG5nLWNvbnRhaW5lci5cbiAqIEByZXR1cm5zIHRoZSBjdXJyZW50IGluZGV4IGluIGB0cmFuc2xhdGlvblBhcnRzYFxuICovXG5mdW5jdGlvbiBnZW5lcmF0ZU1hcHBpbmdJbnN0cnVjdGlvbnMoXG4gICAgaW5kZXg6IG51bWJlciwgdHJhbnNsYXRpb25QYXJ0czogc3RyaW5nW10sIGluc3RydWN0aW9uczogSTE4bkluc3RydWN0aW9uW11bXSxcbiAgICBlbGVtZW50czogKFBsYWNlaG9sZGVyTWFwIHwgbnVsbClbXSB8IG51bGwsIGV4cHJlc3Npb25zPzogKFBsYWNlaG9sZGVyTWFwIHwgbnVsbClbXSB8IG51bGwsXG4gICAgdG1wbENvbnRhaW5lcnM/OiBzdHJpbmdbXSB8IG51bGwsIGxhc3RDaGlsZEluZGV4PzogbnVtYmVyIHwgbnVsbCk6IG51bWJlciB7XG4gIGNvbnN0IHRtcGxJbmRleCA9IGluc3RydWN0aW9ucy5sZW5ndGg7XG4gIGNvbnN0IHRtcGxJbnN0cnVjdGlvbnM6IEkxOG5JbnN0cnVjdGlvbltdID0gW107XG4gIGNvbnN0IHBoVmlzaXRlZCA9IFtdO1xuICBsZXQgb3BlbmVkVGFnQ291bnQgPSAwO1xuICBsZXQgbWF4SW5kZXggPSAwO1xuXG4gIGluc3RydWN0aW9ucy5wdXNoKHRtcGxJbnN0cnVjdGlvbnMpO1xuXG4gIGZvciAoOyBpbmRleCA8IHRyYW5zbGF0aW9uUGFydHMubGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgY29uc3QgdmFsdWUgPSB0cmFuc2xhdGlvblBhcnRzW2luZGV4XTtcblxuICAgIC8vIE9kZCBpbmRleGVzIGFyZSBwbGFjZWhvbGRlcnNcbiAgICBpZiAoaW5kZXggJiAxKSB7XG4gICAgICBsZXQgcGhJbmRleDtcblxuICAgICAgaWYgKGVsZW1lbnRzICYmIGVsZW1lbnRzW3RtcGxJbmRleF0gJiZcbiAgICAgICAgICB0eXBlb2YocGhJbmRleCA9IGVsZW1lbnRzW3RtcGxJbmRleF0gIVt2YWx1ZV0pICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAvLyBUaGUgcGxhY2Vob2xkZXIgcmVwcmVzZW50cyBhIERPTSBlbGVtZW50XG4gICAgICAgIC8vIEFkZCBhbiBpbnN0cnVjdGlvbiB0byBtb3ZlIHRoZSBlbGVtZW50XG4gICAgICAgIHRtcGxJbnN0cnVjdGlvbnMucHVzaChwaEluZGV4IHwgSTE4bkluc3RydWN0aW9ucy5FbGVtZW50KTtcbiAgICAgICAgcGhWaXNpdGVkLnB1c2godmFsdWUpO1xuICAgICAgICBvcGVuZWRUYWdDb3VudCsrO1xuICAgICAgfSBlbHNlIGlmIChcbiAgICAgICAgICBleHByZXNzaW9ucyAmJiBleHByZXNzaW9uc1t0bXBsSW5kZXhdICYmXG4gICAgICAgICAgdHlwZW9mKHBoSW5kZXggPSBleHByZXNzaW9uc1t0bXBsSW5kZXhdICFbdmFsdWVdKSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgLy8gVGhlIHBsYWNlaG9sZGVyIHJlcHJlc2VudHMgYW4gZXhwcmVzc2lvblxuICAgICAgICAvLyBBZGQgYW4gaW5zdHJ1Y3Rpb24gdG8gbW92ZSB0aGUgZXhwcmVzc2lvblxuICAgICAgICB0bXBsSW5zdHJ1Y3Rpb25zLnB1c2gocGhJbmRleCB8IEkxOG5JbnN0cnVjdGlvbnMuRXhwcmVzc2lvbik7XG4gICAgICAgIHBoVmlzaXRlZC5wdXNoKHZhbHVlKTtcbiAgICAgIH0gZWxzZSB7ICAvLyBJdCBpcyBhIGNsb3NpbmcgdGFnXG4gICAgICAgIHRtcGxJbnN0cnVjdGlvbnMucHVzaChJMThuSW5zdHJ1Y3Rpb25zLkNsb3NlTm9kZSk7XG5cbiAgICAgICAgaWYgKHRtcGxJbmRleCA+IDApIHtcbiAgICAgICAgICBvcGVuZWRUYWdDb3VudC0tO1xuXG4gICAgICAgICAgLy8gSWYgd2UgaGF2ZSByZWFjaGVkIHRoZSBjbG9zaW5nIHRhZyBmb3IgdGhpcyB0ZW1wbGF0ZSwgZXhpdCB0aGUgbG9vcFxuICAgICAgICAgIGlmIChvcGVuZWRUYWdDb3VudCA9PT0gMCkge1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmICh0eXBlb2YgcGhJbmRleCAhPT0gJ3VuZGVmaW5lZCcgJiYgcGhJbmRleCA+IG1heEluZGV4KSB7XG4gICAgICAgIG1heEluZGV4ID0gcGhJbmRleDtcbiAgICAgIH1cblxuICAgICAgaWYgKHRtcGxDb250YWluZXJzICYmIHRtcGxDb250YWluZXJzLmluZGV4T2YodmFsdWUpICE9PSAtMSAmJlxuICAgICAgICAgIHRtcGxDb250YWluZXJzLmluZGV4T2YodmFsdWUpID49IHRtcGxJbmRleCkge1xuICAgICAgICBpbmRleCA9IGdlbmVyYXRlTWFwcGluZ0luc3RydWN0aW9ucyhcbiAgICAgICAgICAgIGluZGV4LCB0cmFuc2xhdGlvblBhcnRzLCBpbnN0cnVjdGlvbnMsIGVsZW1lbnRzLCBleHByZXNzaW9ucywgdG1wbENvbnRhaW5lcnMsXG4gICAgICAgICAgICBsYXN0Q2hpbGRJbmRleCk7XG4gICAgICB9XG5cbiAgICB9IGVsc2UgaWYgKHZhbHVlKSB7XG4gICAgICAvLyBJdCdzIGEgbm9uLWVtcHR5IHN0cmluZywgY3JlYXRlIGEgdGV4dCBub2RlXG4gICAgICB0bXBsSW5zdHJ1Y3Rpb25zLnB1c2goSTE4bkluc3RydWN0aW9ucy5UZXh0LCB2YWx1ZSk7XG4gICAgfVxuICB9XG5cbiAgLy8gQ2hlY2sgaWYgc29tZSBlbGVtZW50cyBmcm9tIHRoZSB0ZW1wbGF0ZSBhcmUgbWlzc2luZyBmcm9tIHRoZSB0cmFuc2xhdGlvblxuICBpZiAoZWxlbWVudHMpIHtcbiAgICBjb25zdCB0bXBsRWxlbWVudHMgPSBlbGVtZW50c1t0bXBsSW5kZXhdO1xuXG4gICAgaWYgKHRtcGxFbGVtZW50cykge1xuICAgICAgY29uc3QgcGhLZXlzID0gT2JqZWN0LmtleXModG1wbEVsZW1lbnRzKTtcblxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwaEtleXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3QgcGggPSBwaEtleXNbaV07XG5cbiAgICAgICAgaWYgKHBoVmlzaXRlZC5pbmRleE9mKHBoKSA9PT0gLTEpIHtcbiAgICAgICAgICBsZXQgaW5kZXggPSB0bXBsRWxlbWVudHNbcGhdO1xuICAgICAgICAgIC8vIEFkZCBhbiBpbnN0cnVjdGlvbiB0byByZW1vdmUgdGhlIGVsZW1lbnRcbiAgICAgICAgICB0bXBsSW5zdHJ1Y3Rpb25zLnB1c2goaW5kZXggfCBJMThuSW5zdHJ1Y3Rpb25zLlJlbW92ZU5vZGUpO1xuXG4gICAgICAgICAgaWYgKGluZGV4ID4gbWF4SW5kZXgpIHtcbiAgICAgICAgICAgIG1heEluZGV4ID0gaW5kZXg7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8gQ2hlY2sgaWYgc29tZSBleHByZXNzaW9ucyBmcm9tIHRoZSB0ZW1wbGF0ZSBhcmUgbWlzc2luZyBmcm9tIHRoZSB0cmFuc2xhdGlvblxuICBpZiAoZXhwcmVzc2lvbnMpIHtcbiAgICBjb25zdCB0bXBsRXhwcmVzc2lvbnMgPSBleHByZXNzaW9uc1t0bXBsSW5kZXhdO1xuXG4gICAgaWYgKHRtcGxFeHByZXNzaW9ucykge1xuICAgICAgY29uc3QgcGhLZXlzID0gT2JqZWN0LmtleXModG1wbEV4cHJlc3Npb25zKTtcblxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwaEtleXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3QgcGggPSBwaEtleXNbaV07XG5cbiAgICAgICAgaWYgKHBoVmlzaXRlZC5pbmRleE9mKHBoKSA9PT0gLTEpIHtcbiAgICAgICAgICBsZXQgaW5kZXggPSB0bXBsRXhwcmVzc2lvbnNbcGhdO1xuICAgICAgICAgIGlmIChuZ0Rldk1vZGUpIHtcbiAgICAgICAgICAgIGFzc2VydExlc3NUaGFuKFxuICAgICAgICAgICAgICAgIGluZGV4LnRvU3RyaW5nKDIpLmxlbmd0aCwgMjgsIGBJbmRleCAke2luZGV4fSBpcyB0b28gYmlnIGFuZCB3aWxsIG92ZXJmbG93YCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIC8vIEFkZCBhbiBpbnN0cnVjdGlvbiB0byByZW1vdmUgdGhlIGV4cHJlc3Npb25cbiAgICAgICAgICB0bXBsSW5zdHJ1Y3Rpb25zLnB1c2goaW5kZXggfCBJMThuSW5zdHJ1Y3Rpb25zLlJlbW92ZU5vZGUpO1xuXG4gICAgICAgICAgaWYgKGluZGV4ID4gbWF4SW5kZXgpIHtcbiAgICAgICAgICAgIG1heEluZGV4ID0gaW5kZXg7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgaWYgKHRtcGxJbmRleCA9PT0gMCAmJiB0eXBlb2YgbGFzdENoaWxkSW5kZXggPT09ICdudW1iZXInKSB7XG4gICAgLy8gVGhlIGN1cnJlbnQgcGFyZW50IGlzIGFuIG5nLWNvbnRhaW5lciBhbmQgaXQgaGFzIG1vcmUgY2hpbGRyZW4gYWZ0ZXIgdGhlIHRyYW5zbGF0aW9uIHRoYXQgd2VcbiAgICAvLyBuZWVkIHRvIGFwcGVuZCB0byBrZWVwIHRoZSBvcmRlciBvZiB0aGUgRE9NIG5vZGVzIGNvcnJlY3RcbiAgICBmb3IgKGxldCBpID0gbWF4SW5kZXggKyAxOyBpIDw9IGxhc3RDaGlsZEluZGV4OyBpKyspIHtcbiAgICAgIGlmIChuZ0Rldk1vZGUpIHtcbiAgICAgICAgYXNzZXJ0TGVzc1RoYW4oaS50b1N0cmluZygyKS5sZW5ndGgsIDI4LCBgSW5kZXggJHtpfSBpcyB0b28gYmlnIGFuZCB3aWxsIG92ZXJmbG93YCk7XG4gICAgICB9XG4gICAgICAvLyBXZSBjb25zaWRlciB0aG9zZSBhZGRpdGlvbmFsIHBsYWNlaG9sZGVycyBhcyBleHByZXNzaW9ucyBiZWNhdXNlIHdlIGRvbid0IGNhcmUgYWJvdXRcbiAgICAgIC8vIHRoZWlyIGNoaWxkcmVuLCBhbGwgd2UgbmVlZCB0byBkbyBpcyB0byBhcHBlbmQgdGhlbVxuICAgICAgdG1wbEluc3RydWN0aW9ucy5wdXNoKGkgfCBJMThuSW5zdHJ1Y3Rpb25zLkV4cHJlc3Npb24pO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBpbmRleDtcbn1cblxuZnVuY3Rpb24gYXBwZW5kSTE4bk5vZGUobm9kZTogTE5vZGUsIHBhcmVudE5vZGU6IExOb2RlLCBwcmV2aW91c05vZGU6IExOb2RlKSB7XG4gIGlmIChuZ0Rldk1vZGUpIHtcbiAgICBuZ0Rldk1vZGUucmVuZGVyZXJNb3ZlTm9kZSsrO1xuICB9XG5cbiAgY29uc3Qgdmlld0RhdGEgPSBnZXRWaWV3RGF0YSgpO1xuXG4gIGFwcGVuZENoaWxkKHBhcmVudE5vZGUsIG5vZGUubmF0aXZlIHx8IG51bGwsIHZpZXdEYXRhKTtcblxuICBpZiAocHJldmlvdXNOb2RlID09PSBwYXJlbnROb2RlICYmIHBhcmVudE5vZGUucENoaWxkID09PSBudWxsKSB7XG4gICAgcGFyZW50Tm9kZS5wQ2hpbGQgPSBub2RlO1xuICB9IGVsc2Uge1xuICAgIHByZXZpb3VzTm9kZS5wTmV4dE9yUGFyZW50ID0gbm9kZTtcbiAgfVxuXG4gIC8vIFRlbXBsYXRlIGNvbnRhaW5lcnMgYWxzbyBoYXZlIGEgY29tbWVudCBub2RlIGZvciB0aGUgYFZpZXdDb250YWluZXJSZWZgIHRoYXQgc2hvdWxkIGJlIG1vdmVkXG4gIGlmIChub2RlLnROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5Db250YWluZXIgJiYgbm9kZS5keW5hbWljTENvbnRhaW5lck5vZGUpIHtcbiAgICAvLyAobm9kZS5uYXRpdmUgYXMgUkNvbW1lbnQpLnRleHRDb250ZW50ID0gJ3Rlc3QnO1xuICAgIC8vIGNvbnNvbGUubG9nKG5vZGUubmF0aXZlKTtcbiAgICBhcHBlbmRDaGlsZChwYXJlbnROb2RlLCBub2RlLmR5bmFtaWNMQ29udGFpbmVyTm9kZS5uYXRpdmUgfHwgbnVsbCwgdmlld0RhdGEpO1xuICAgIG5vZGUucE5leHRPclBhcmVudCA9IG5vZGUuZHluYW1pY0xDb250YWluZXJOb2RlO1xuICAgIHJldHVybiBub2RlLmR5bmFtaWNMQ29udGFpbmVyTm9kZTtcbiAgfVxuXG4gIHJldHVybiBub2RlO1xufVxuXG4vKipcbiAqIFRha2VzIGEgbGlzdCBvZiBpbnN0cnVjdGlvbnMgZ2VuZXJhdGVkIGJ5IGBpMThuTWFwcGluZygpYCB0byB0cmFuc2Zvcm0gdGhlIHRlbXBsYXRlIGFjY29yZGluZ2x5LlxuICpcbiAqIEBwYXJhbSBzdGFydEluZGV4IEluZGV4IG9mIHRoZSBmaXJzdCBlbGVtZW50IHRvIHRyYW5zbGF0ZSAoZm9yIGluc3RhbmNlIHRoZSBmaXJzdCBjaGlsZCBvZiB0aGVcbiAqIGVsZW1lbnQgd2l0aCB0aGUgaTE4biBhdHRyaWJ1dGUpLlxuICogQHBhcmFtIGluc3RydWN0aW9ucyBUaGUgbGlzdCBvZiBpbnN0cnVjdGlvbnMgdG8gYXBwbHkgb24gdGhlIGN1cnJlbnQgdmlldy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGkxOG5BcHBseShzdGFydEluZGV4OiBudW1iZXIsIGluc3RydWN0aW9uczogSTE4bkluc3RydWN0aW9uW10pOiB2b2lkIHtcbiAgY29uc3Qgdmlld0RhdGEgPSBnZXRWaWV3RGF0YSgpO1xuICBpZiAobmdEZXZNb2RlKSB7XG4gICAgYXNzZXJ0RXF1YWwodmlld0RhdGFbQklORElOR19JTkRFWF0sIC0xLCAnaTE4bkFwcGx5IHNob3VsZCBiZSBjYWxsZWQgYmVmb3JlIGFueSBiaW5kaW5nJyk7XG4gIH1cblxuICBpZiAoIWluc3RydWN0aW9ucykge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvbnN0IHJlbmRlcmVyID0gZ2V0UmVuZGVyZXIoKTtcbiAgbGV0IGxvY2FsUGFyZW50Tm9kZTogTE5vZGUgPSBnZXRQYXJlbnRMTm9kZShsb2FkKHN0YXJ0SW5kZXgpKSB8fCBnZXRQcmV2aW91c09yUGFyZW50Tm9kZSgpO1xuICBsZXQgbG9jYWxQcmV2aW91c05vZGU6IExOb2RlID0gbG9jYWxQYXJlbnROb2RlO1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgaW5zdHJ1Y3Rpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgaW5zdHJ1Y3Rpb24gPSBpbnN0cnVjdGlvbnNbaV0gYXMgbnVtYmVyO1xuICAgIHN3aXRjaCAoaW5zdHJ1Y3Rpb24gJiBJMThuSW5zdHJ1Y3Rpb25zLkluc3RydWN0aW9uTWFzaykge1xuICAgICAgY2FzZSBJMThuSW5zdHJ1Y3Rpb25zLkVsZW1lbnQ6XG4gICAgICAgIGNvbnN0IGVsZW1lbnQ6IExOb2RlID0gbG9hZChpbnN0cnVjdGlvbiAmIEkxOG5JbnN0cnVjdGlvbnMuSW5kZXhNYXNrKTtcbiAgICAgICAgbG9jYWxQcmV2aW91c05vZGUgPSBhcHBlbmRJMThuTm9kZShlbGVtZW50LCBsb2NhbFBhcmVudE5vZGUsIGxvY2FsUHJldmlvdXNOb2RlKTtcbiAgICAgICAgbG9jYWxQYXJlbnROb2RlID0gZWxlbWVudDtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIEkxOG5JbnN0cnVjdGlvbnMuRXhwcmVzc2lvbjpcbiAgICAgICAgY29uc3QgZXhwcjogTE5vZGUgPSBsb2FkKGluc3RydWN0aW9uICYgSTE4bkluc3RydWN0aW9ucy5JbmRleE1hc2spO1xuICAgICAgICBsb2NhbFByZXZpb3VzTm9kZSA9IGFwcGVuZEkxOG5Ob2RlKGV4cHIsIGxvY2FsUGFyZW50Tm9kZSwgbG9jYWxQcmV2aW91c05vZGUpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgSTE4bkluc3RydWN0aW9ucy5UZXh0OlxuICAgICAgICBpZiAobmdEZXZNb2RlKSB7XG4gICAgICAgICAgbmdEZXZNb2RlLnJlbmRlcmVyQ3JlYXRlVGV4dE5vZGUrKztcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB2YWx1ZSA9IGluc3RydWN0aW9uc1srK2ldO1xuICAgICAgICBjb25zdCB0ZXh0Uk5vZGUgPSBjcmVhdGVUZXh0Tm9kZSh2YWx1ZSwgcmVuZGVyZXIpO1xuICAgICAgICAvLyBJZiB3ZSB3ZXJlIHRvIG9ubHkgY3JlYXRlIGEgYFJOb2RlYCB0aGVuIHByb2plY3Rpb25zIHdvbid0IG1vdmUgdGhlIHRleHQuXG4gICAgICAgIC8vIEJ1dCBzaW5jZSB0aGlzIHRleHQgZG9lc24ndCBoYXZlIGFuIGluZGV4IGluIGBMVmlld0RhdGFgLCB3ZSBuZWVkIHRvIGNyZWF0ZSBhblxuICAgICAgICAvLyBgTEVsZW1lbnROb2RlYCB3aXRoIHRoZSBpbmRleCAtMSBzbyB0aGF0IGl0IGlzbid0IHNhdmVkIGluIGBMVmlld0RhdGFgXG4gICAgICAgIGNvbnN0IHRleHRMTm9kZSA9IGNyZWF0ZUxOb2RlKC0xLCBUTm9kZVR5cGUuRWxlbWVudCwgdGV4dFJOb2RlLCBudWxsLCBudWxsKTtcbiAgICAgICAgbG9jYWxQcmV2aW91c05vZGUgPSBhcHBlbmRJMThuTm9kZSh0ZXh0TE5vZGUsIGxvY2FsUGFyZW50Tm9kZSwgbG9jYWxQcmV2aW91c05vZGUpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgSTE4bkluc3RydWN0aW9ucy5DbG9zZU5vZGU6XG4gICAgICAgIGxvY2FsUHJldmlvdXNOb2RlID0gbG9jYWxQYXJlbnROb2RlO1xuICAgICAgICBsb2NhbFBhcmVudE5vZGUgPSBnZXRQYXJlbnRMTm9kZShsb2NhbFBhcmVudE5vZGUpICE7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBJMThuSW5zdHJ1Y3Rpb25zLlJlbW92ZU5vZGU6XG4gICAgICAgIGlmIChuZ0Rldk1vZGUpIHtcbiAgICAgICAgICBuZ0Rldk1vZGUucmVuZGVyZXJSZW1vdmVOb2RlKys7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgaW5kZXggPSBpbnN0cnVjdGlvbiAmIEkxOG5JbnN0cnVjdGlvbnMuSW5kZXhNYXNrO1xuICAgICAgICBjb25zdCByZW1vdmVkTm9kZTogTE5vZGV8TENvbnRhaW5lck5vZGUgPSBsb2FkKGluZGV4KTtcbiAgICAgICAgY29uc3QgcGFyZW50Tm9kZSA9IGdldFBhcmVudExOb2RlKHJlbW92ZWROb2RlKSAhO1xuICAgICAgICByZW1vdmVDaGlsZChwYXJlbnROb2RlLCByZW1vdmVkTm9kZS5uYXRpdmUgfHwgbnVsbCwgdmlld0RhdGEpO1xuXG4gICAgICAgIC8vIEZvciB0ZW1wbGF0ZSBjb250YWluZXJzIHdlIGFsc28gbmVlZCB0byByZW1vdmUgdGhlaXIgYFZpZXdDb250YWluZXJSZWZgIGZyb20gdGhlIERPTVxuICAgICAgICBpZiAocmVtb3ZlZE5vZGUudE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkNvbnRhaW5lciAmJiByZW1vdmVkTm9kZS5keW5hbWljTENvbnRhaW5lck5vZGUpIHtcbiAgICAgICAgICByZW1vdmVDaGlsZChwYXJlbnROb2RlLCByZW1vdmVkTm9kZS5keW5hbWljTENvbnRhaW5lck5vZGUubmF0aXZlIHx8IG51bGwsIHZpZXdEYXRhKTtcbiAgICAgICAgICByZW1vdmVkTm9kZS5keW5hbWljTENvbnRhaW5lck5vZGUudE5vZGUuZGV0YWNoZWQgPSB0cnVlO1xuICAgICAgICAgIHJlbW92ZWROb2RlLmR5bmFtaWNMQ29udGFpbmVyTm9kZS5kYXRhW1JFTkRFUl9QQVJFTlRdID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBUYWtlcyBhIHRyYW5zbGF0aW9uIHN0cmluZyBhbmQgdGhlIGluaXRpYWwgbGlzdCBvZiBleHByZXNzaW9ucyBhbmQgcmV0dXJucyBhIGxpc3Qgb2YgaW5zdHJ1Y3Rpb25zXG4gKiB0aGF0IHdpbGwgYmUgdXNlZCB0byB0cmFuc2xhdGUgYW4gYXR0cmlidXRlLlxuICogRXZlbiBpbmRleGVzIGNvbnRhaW4gc3RhdGljIHN0cmluZ3MsIHdoaWxlIG9kZCBpbmRleGVzIGNvbnRhaW4gdGhlIGluZGV4IG9mIHRoZSBleHByZXNzaW9uIHdob3NlXG4gKiB2YWx1ZSB3aWxsIGJlIGNvbmNhdGVuYXRlZCBpbnRvIHRoZSBmaW5hbCB0cmFuc2xhdGlvbi5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGkxOG5FeHBNYXBwaW5nKFxuICAgIHRyYW5zbGF0aW9uOiBzdHJpbmcsIHBsYWNlaG9sZGVyczogUGxhY2Vob2xkZXJNYXApOiBJMThuRXhwSW5zdHJ1Y3Rpb25bXSB7XG4gIGNvbnN0IHN0YXRpY1RleHQ6IEkxOG5FeHBJbnN0cnVjdGlvbltdID0gdHJhbnNsYXRpb24uc3BsaXQoaTE4blRhZ1JlZ2V4KTtcbiAgLy8gb2RkIGluZGV4ZXMgYXJlIHBsYWNlaG9sZGVyc1xuICBmb3IgKGxldCBpID0gMTsgaSA8IHN0YXRpY1RleHQubGVuZ3RoOyBpICs9IDIpIHtcbiAgICBzdGF0aWNUZXh0W2ldID0gcGxhY2Vob2xkZXJzW3N0YXRpY1RleHRbaV1dO1xuICB9XG4gIHJldHVybiBzdGF0aWNUZXh0O1xufVxuXG4vKipcbiAqIENoZWNrcyBpZiB0aGUgdmFsdWUgb2YgdXAgdG8gOCBleHByZXNzaW9ucyBoYXZlIGNoYW5nZWQgYW5kIHJlcGxhY2VzIHRoZW0gYnkgdGhlaXIgdmFsdWVzIGluIGFcbiAqIHRyYW5zbGF0aW9uLCBvciByZXR1cm5zIE5PX0NIQU5HRS5cbiAqXG4gKiBAcmV0dXJucyBUaGUgY29uY2F0ZW5hdGVkIHN0cmluZyB3aGVuIGFueSBvZiB0aGUgYXJndW1lbnRzIGNoYW5nZXMsIGBOT19DSEFOR0VgIG90aGVyd2lzZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGkxOG5JbnRlcnBvbGF0aW9uKFxuICAgIGluc3RydWN0aW9uczogSTE4bkV4cEluc3RydWN0aW9uW10sIG51bWJlck9mRXhwOiBudW1iZXIsIHYwOiBhbnksIHYxPzogYW55LCB2Mj86IGFueSwgdjM/OiBhbnksXG4gICAgdjQ/OiBhbnksIHY1PzogYW55LCB2Nj86IGFueSwgdjc/OiBhbnkpOiBzdHJpbmd8Tk9fQ0hBTkdFIHtcbiAgbGV0IGRpZmZlcmVudCA9IGJpbmRpbmdVcGRhdGVkKHYwKTtcblxuICBpZiAobnVtYmVyT2ZFeHAgPiAxKSB7XG4gICAgZGlmZmVyZW50ID0gYmluZGluZ1VwZGF0ZWQodjEpIHx8IGRpZmZlcmVudDtcblxuICAgIGlmIChudW1iZXJPZkV4cCA+IDIpIHtcbiAgICAgIGRpZmZlcmVudCA9IGJpbmRpbmdVcGRhdGVkKHYyKSB8fCBkaWZmZXJlbnQ7XG5cbiAgICAgIGlmIChudW1iZXJPZkV4cCA+IDMpIHtcbiAgICAgICAgZGlmZmVyZW50ID0gYmluZGluZ1VwZGF0ZWQodjMpIHx8IGRpZmZlcmVudDtcblxuICAgICAgICBpZiAobnVtYmVyT2ZFeHAgPiA0KSB7XG4gICAgICAgICAgZGlmZmVyZW50ID0gYmluZGluZ1VwZGF0ZWQodjQpIHx8IGRpZmZlcmVudDtcblxuICAgICAgICAgIGlmIChudW1iZXJPZkV4cCA+IDUpIHtcbiAgICAgICAgICAgIGRpZmZlcmVudCA9IGJpbmRpbmdVcGRhdGVkKHY1KSB8fCBkaWZmZXJlbnQ7XG5cbiAgICAgICAgICAgIGlmIChudW1iZXJPZkV4cCA+IDYpIHtcbiAgICAgICAgICAgICAgZGlmZmVyZW50ID0gYmluZGluZ1VwZGF0ZWQodjYpIHx8IGRpZmZlcmVudDtcblxuICAgICAgICAgICAgICBpZiAobnVtYmVyT2ZFeHAgPiA3KSB7XG4gICAgICAgICAgICAgICAgZGlmZmVyZW50ID0gYmluZGluZ1VwZGF0ZWQodjcpIHx8IGRpZmZlcmVudDtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGlmICghZGlmZmVyZW50KSB7XG4gICAgcmV0dXJuIE5PX0NIQU5HRTtcbiAgfVxuXG4gIGxldCByZXMgPSAnJztcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBpbnN0cnVjdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICBsZXQgdmFsdWU6IGFueTtcbiAgICAvLyBPZGQgaW5kZXhlcyBhcmUgcGxhY2Vob2xkZXJzXG4gICAgaWYgKGkgJiAxKSB7XG4gICAgICBzd2l0Y2ggKGluc3RydWN0aW9uc1tpXSkge1xuICAgICAgICBjYXNlIDA6XG4gICAgICAgICAgdmFsdWUgPSB2MDtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAxOlxuICAgICAgICAgIHZhbHVlID0gdjE7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgMjpcbiAgICAgICAgICB2YWx1ZSA9IHYyO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIDM6XG4gICAgICAgICAgdmFsdWUgPSB2MztcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSA0OlxuICAgICAgICAgIHZhbHVlID0gdjQ7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgNTpcbiAgICAgICAgICB2YWx1ZSA9IHY1O1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIDY6XG4gICAgICAgICAgdmFsdWUgPSB2NjtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSA3OlxuICAgICAgICAgIHZhbHVlID0gdjc7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG5cbiAgICAgIHJlcyArPSBzdHJpbmdpZnkodmFsdWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXMgKz0gaW5zdHJ1Y3Rpb25zW2ldO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiByZXM7XG59XG5cbi8qKlxuICogQ3JlYXRlIGEgdHJhbnNsYXRlZCBpbnRlcnBvbGF0aW9uIGJpbmRpbmcgd2l0aCBhIHZhcmlhYmxlIG51bWJlciBvZiBleHByZXNzaW9ucy5cbiAqXG4gKiBJZiB0aGVyZSBhcmUgMSB0byA4IGV4cHJlc3Npb25zIHRoZW4gYGkxOG5JbnRlcnBvbGF0aW9uKClgIHNob3VsZCBiZSB1c2VkIGluc3RlYWQuIEl0IGlzIGZhc3RlclxuICogYmVjYXVzZSB0aGVyZSBpcyBubyBuZWVkIHRvIGNyZWF0ZSBhbiBhcnJheSBvZiBleHByZXNzaW9ucyBhbmQgaXRlcmF0ZSBvdmVyIGl0LlxuICpcbiAqIEByZXR1cm5zIFRoZSBjb25jYXRlbmF0ZWQgc3RyaW5nIHdoZW4gYW55IG9mIHRoZSBhcmd1bWVudHMgY2hhbmdlcywgYE5PX0NIQU5HRWAgb3RoZXJ3aXNlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gaTE4bkludGVycG9sYXRpb25WKGluc3RydWN0aW9uczogSTE4bkV4cEluc3RydWN0aW9uW10sIHZhbHVlczogYW55W10pOiBzdHJpbmd8XG4gICAgTk9fQ0hBTkdFIHtcbiAgbGV0IGRpZmZlcmVudCA9IGZhbHNlO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IHZhbHVlcy5sZW5ndGg7IGkrKykge1xuICAgIC8vIENoZWNrIGlmIGJpbmRpbmdzIGhhdmUgY2hhbmdlZFxuICAgIGJpbmRpbmdVcGRhdGVkKHZhbHVlc1tpXSkgJiYgKGRpZmZlcmVudCA9IHRydWUpO1xuICB9XG5cbiAgaWYgKCFkaWZmZXJlbnQpIHtcbiAgICByZXR1cm4gTk9fQ0hBTkdFO1xuICB9XG5cbiAgbGV0IHJlcyA9ICcnO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGluc3RydWN0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgIC8vIE9kZCBpbmRleGVzIGFyZSBwbGFjZWhvbGRlcnNcbiAgICBpZiAoaSAmIDEpIHtcbiAgICAgIHJlcyArPSBzdHJpbmdpZnkodmFsdWVzW2luc3RydWN0aW9uc1tpXSBhcyBudW1iZXJdKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmVzICs9IGluc3RydWN0aW9uc1tpXTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gcmVzO1xufVxuIl19