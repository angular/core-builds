/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { RuntimeError } from '../errors';
import { getDeclarationComponentDef } from '../render3/instructions/element_validation';
import { TVIEW } from '../render3/interfaces/view';
import { getParentRElement } from '../render3/node_manipulation';
const AT_THIS_LOCATION = '<-- AT THIS LOCATION';
/**
 * Retrieves a user friendly string for a given TNodeType for use in
 * friendly error messages
 *
 * @param tNodeType
 * @returns
 */
function getFriendlyStringFromTNodeType(tNodeType) {
    switch (tNodeType) {
        case 4 /* TNodeType.Container */:
            return 'view container';
        case 2 /* TNodeType.Element */:
            return 'element';
        case 8 /* TNodeType.ElementContainer */:
            return 'ng-container';
        case 32 /* TNodeType.Icu */:
            return 'icu';
        case 64 /* TNodeType.Placeholder */:
            return 'i18n';
        case 16 /* TNodeType.Projection */:
            return 'projection';
        case 1 /* TNodeType.Text */:
            return 'text';
        default:
            // This should not happen as we cover all possible TNode types above.
            return '<unknown>';
    }
}
/**
 * Validates that provided nodes match during the hydration process.
 */
export function validateMatchingNode(node, nodeType, tagName, lView, tNode, isViewContainerAnchor = false) {
    if (!node ||
        (node.nodeType !== nodeType ||
            (node.nodeType === Node.ELEMENT_NODE &&
                node.tagName.toLowerCase() !== tagName?.toLowerCase()))) {
        const expectedNode = shortRNodeDescription(nodeType, tagName, null);
        let header = `During hydration Angular expected ${expectedNode} but `;
        const hostComponentDef = getDeclarationComponentDef(lView);
        const componentClassName = hostComponentDef?.type?.name;
        const expected = `Angular expected this DOM:\n\n${describeExpectedDom(lView, tNode, isViewContainerAnchor)}\n\n`;
        let actual = '';
        if (!node) {
            // No node found during hydration.
            header += `the node was not found.\n\n`;
        }
        else {
            const actualNode = shortRNodeDescription(node.nodeType, node.tagName ?? null, node.textContent ?? null);
            header += `found ${actualNode}.\n\n`;
            actual = `Actual DOM is:\n\n${describeDomFromNode(node)}\n\n`;
        }
        const footer = getHydrationErrorFooter(componentClassName);
        const message = header + expected + actual + getHydrationAttributeNote() + footer;
        throw new RuntimeError(-500 /* RuntimeErrorCode.HYDRATION_NODE_MISMATCH */, message);
    }
}
/**
 * Validates that a given node has sibling nodes
 */
export function validateSiblingNodeExists(node) {
    validateNodeExists(node);
    if (!node.nextSibling) {
        const header = 'During hydration Angular expected more sibling nodes to be present.\n\n';
        const actual = `Actual DOM is:\n\n${describeDomFromNode(node)}\n\n`;
        const footer = getHydrationErrorFooter();
        const message = header + actual + footer;
        throw new RuntimeError(-501 /* RuntimeErrorCode.HYDRATION_MISSING_SIBLINGS */, message);
    }
}
/**
 * Validates that a node exists or throws
 */
export function validateNodeExists(node) {
    if (!node) {
        throw new RuntimeError(-502 /* RuntimeErrorCode.HYDRATION_MISSING_NODE */, `Hydration expected an element to be present at this location.`);
    }
}
/**
 * Builds the hydration error message when a node is not found
 *
 * @param lView the LView where the node exists
 * @param tNode the TNode
 */
export function nodeNotFoundError(lView, tNode) {
    const header = 'During serialization, Angular was unable to find an element in the DOM:\n\n';
    const expected = `${describeExpectedDom(lView, tNode, false)}\n\n`;
    const footer = getHydrationErrorFooter();
    throw new RuntimeError(-502 /* RuntimeErrorCode.HYDRATION_MISSING_NODE */, header + expected + footer);
}
/**
 * Builds a hydration error message when a node is not found at a path location
 *
 * @param host the Host Node
 * @param path the path to the node
 */
export function nodeNotFoundAtPathError(host, path) {
    const header = `During hydration Angular was unable to locate a node ` +
        `using the "${path}" path, starting from the ${describeRNode(host)} node.\n\n`;
    const footer = getHydrationErrorFooter();
    throw new RuntimeError(-502 /* RuntimeErrorCode.HYDRATION_MISSING_NODE */, header + footer);
}
/**
 * Builds the hydration error message in the case that dom nodes are created outside of
 * the Angular context and are being used as projected nodes
 *
 * @param lView the LView
 * @param tNode the TNode
 * @returns an error
 */
export function unsupportedProjectionOfDomNodes(rNode) {
    const header = 'During serialization, Angular detected DOM nodes ' +
        'that were created outside of Angular context and provided as projectable nodes ' +
        '(likely via `ViewContainerRef.createComponent` or `createComponent` APIs). ' +
        'Hydration is not supported for such cases, consider refactoring the code to avoid ' +
        'this pattern or using `ngSkipHydration` on the host element of the component.\n\n';
    const actual = `${describeDomFromNode(rNode)}\n\n`;
    const message = header + actual + getHydrationAttributeNote();
    return new RuntimeError(-503 /* RuntimeErrorCode.UNSUPPORTED_PROJECTION_DOM_NODES */, message);
}
/**
 * Builds the hydration error message in the case that ngSkipHydration was used on a
 * node that is not a component host element or host binding
 *
 * @param rNode the HTML Element
 * @returns an error
 */
export function invalidSkipHydrationHost(rNode) {
    const header = 'The `ngSkipHydration` flag is applied on a node ' +
        'that doesn\'t act as a component host. Hydration can be ' +
        'skipped only on per-component basis.\n\n';
    const actual = `${describeDomFromNode(rNode)}\n\n`;
    const footer = 'Please move the `ngSkipHydration` attribute to the component host element.\n\n';
    const message = header + actual + footer;
    return new RuntimeError(-504 /* RuntimeErrorCode.INVALID_SKIP_HYDRATION_HOST */, message);
}
// Stringification methods
/**
 * Stringifies a given TNode's attributes
 *
 * @param tNode a provided TNode
 * @returns string
 */
function stringifyTNodeAttrs(tNode) {
    const results = [];
    if (tNode.attrs) {
        for (let i = 0; i < tNode.attrs.length;) {
            const attrName = tNode.attrs[i++];
            // Once we reach the first flag, we know that the list of
            // attributes is over.
            if (typeof attrName == 'number') {
                break;
            }
            const attrValue = tNode.attrs[i++];
            results.push(`${attrName}="${shorten(attrValue)}"`);
        }
    }
    return results.join(' ');
}
/**
 * The list of internal attributes that should be filtered out while
 * producing an error message.
 */
const internalAttrs = new Set(['ngh', 'ng-version', 'ng-server-context']);
/**
 * Stringifies an HTML Element's attributes
 *
 * @param rNode an HTML Element
 * @returns string
 */
function stringifyRNodeAttrs(rNode) {
    const results = [];
    for (let i = 0; i < rNode.attributes.length; i++) {
        const attr = rNode.attributes[i];
        if (internalAttrs.has(attr.name))
            continue;
        results.push(`${attr.name}="${shorten(attr.value)}"`);
    }
    return results.join(' ');
}
// Methods for Describing the DOM
/**
 * Converts a tNode to a helpful readable string value for use in error messages
 *
 * @param tNode a given TNode
 * @param innerContent the content of the node
 * @returns string
 */
function describeTNode(tNode, innerContent = '…') {
    switch (tNode.type) {
        case 1 /* TNodeType.Text */:
            const content = tNode.value ? `(${tNode.value})` : '';
            return `#text${content}`;
        case 2 /* TNodeType.Element */:
            const attrs = stringifyTNodeAttrs(tNode);
            const tag = tNode.value.toLowerCase();
            return `<${tag}${attrs ? ' ' + attrs : ''}>${innerContent}</${tag}>`;
        case 8 /* TNodeType.ElementContainer */:
            return '<!-- ng-container -->';
        case 4 /* TNodeType.Container */:
            return '<!-- container -->';
        default:
            const typeAsString = getFriendlyStringFromTNodeType(tNode.type);
            return `#node(${typeAsString})`;
    }
}
/**
 * Converts an RNode to a helpful readable string value for use in error messages
 *
 * @param rNode a given RNode
 * @param innerContent the content of the node
 * @returns string
 */
function describeRNode(rNode, innerContent = '…') {
    const node = rNode;
    switch (node.nodeType) {
        case Node.ELEMENT_NODE:
            const tag = node.tagName.toLowerCase();
            const attrs = stringifyRNodeAttrs(node);
            return `<${tag}${attrs ? ' ' + attrs : ''}>${innerContent}</${tag}>`;
        case Node.TEXT_NODE:
            const content = node.textContent ? shorten(node.textContent) : '';
            return `#text${content ? `(${content})` : ''}`;
        case Node.COMMENT_NODE:
            return `<!-- ${shorten(node.textContent ?? '')} -->`;
        default:
            return `#node(${node.nodeType})`;
    }
}
/**
 * Builds the string containing the expected DOM present given the LView and TNode
 * values for a readable error message
 *
 * @param lView the lView containing the DOM
 * @param tNode the tNode
 * @param isViewContainerAnchor boolean
 * @returns string
 */
function describeExpectedDom(lView, tNode, isViewContainerAnchor) {
    const spacer = '  ';
    let content = '';
    if (tNode.prev) {
        content += spacer + '…\n';
        content += spacer + describeTNode(tNode.prev) + '\n';
    }
    else if (tNode.type && tNode.type & 12 /* TNodeType.AnyContainer */) {
        content += spacer + '…\n';
    }
    if (isViewContainerAnchor) {
        content += spacer + describeTNode(tNode) + '\n';
        content += spacer + `<!-- container -->  ${AT_THIS_LOCATION}\n`;
    }
    else {
        content += spacer + describeTNode(tNode) + `  ${AT_THIS_LOCATION}\n`;
    }
    content += spacer + '…\n';
    const parentRNode = tNode.type ? getParentRElement(lView[TVIEW], tNode, lView) : null;
    if (parentRNode) {
        content = describeRNode(parentRNode, '\n' + content);
    }
    return content;
}
/**
 * Builds the string containing the DOM present around a given RNode for a
 * readable error message
 *
 * @param node the RNode
 * @returns string
 */
function describeDomFromNode(node) {
    const spacer = '  ';
    let content = '';
    const currentNode = node;
    if (currentNode.previousSibling) {
        content += spacer + '…\n';
        content += spacer + describeRNode(currentNode.previousSibling) + '\n';
    }
    content += spacer + describeRNode(currentNode) + `  ${AT_THIS_LOCATION}\n`;
    if (node.nextSibling) {
        content += spacer + '…\n';
    }
    if (node.parentNode) {
        content = describeRNode(currentNode.parentNode, '\n' + content);
    }
    return content;
}
/**
 * Shortens the description of a given RNode by its type for readability
 *
 * @param nodeType the type of node
 * @param tagName the node tag name
 * @param textContent the text content in the node
 * @returns string
 */
function shortRNodeDescription(nodeType, tagName, textContent) {
    switch (nodeType) {
        case Node.ELEMENT_NODE:
            return `<${tagName.toLowerCase()}>`;
        case Node.TEXT_NODE:
            const content = textContent ? ` (with the "${shorten(textContent)}" content)` : '';
            return `a text node${content}`;
        case Node.COMMENT_NODE:
            return 'a comment node';
        default:
            return `#node(nodeType=${nodeType})`;
    }
}
/**
 * Builds the footer hydration error message
 *
 * @param componentClassName the name of the component class
 * @returns string
 */
function getHydrationErrorFooter(componentClassName) {
    const componentInfo = componentClassName ? `the "${componentClassName}"` : 'corresponding';
    return `To fix this problem:\n` +
        `  * check ${componentInfo} component for hydration-related issues\n` +
        `  * or skip hydration by adding the \`ngSkipHydration\` attribute ` +
        `to its host node in a template\n\n`;
}
/**
 * An attribute related note for hydration errors
 */
function getHydrationAttributeNote() {
    return 'Note: attributes are only displayed to better represent the DOM' +
        ' but have no effect on hydration mismatches.\n\n';
}
// Node string utility functions
/**
 * Strips all newlines out of a given string
 *
 * @param input a string to be cleared of new line characters
 * @returns
 */
function stripNewlines(input) {
    return input.replace(/\s+/gm, '');
}
/**
 * Reduces a string down to a maximum length of characters with ellipsis for readability
 *
 * @param input a string input
 * @param maxLength a maximum length in characters
 * @returns string
 */
function shorten(input, maxLength = 50) {
    if (!input) {
        return '';
    }
    input = stripNewlines(input);
    return input.length > maxLength ? `${input.substring(0, maxLength - 1)}…` : input;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXJyb3JfaGFuZGxpbmcuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9oeWRyYXRpb24vZXJyb3JfaGFuZGxpbmcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLFlBQVksRUFBbUIsTUFBTSxXQUFXLENBQUM7QUFDekQsT0FBTyxFQUFDLDBCQUEwQixFQUFDLE1BQU0sNENBQTRDLENBQUM7QUFHdEYsT0FBTyxFQUFRLEtBQUssRUFBQyxNQUFNLDRCQUE0QixDQUFDO0FBQ3hELE9BQU8sRUFBQyxpQkFBaUIsRUFBQyxNQUFNLDhCQUE4QixDQUFDO0FBRS9ELE1BQU0sZ0JBQWdCLEdBQUcsc0JBQXNCLENBQUM7QUFFaEQ7Ozs7OztHQU1HO0FBQ0gsU0FBUyw4QkFBOEIsQ0FBQyxTQUFvQjtJQUMxRCxRQUFRLFNBQVMsRUFBRTtRQUNqQjtZQUNFLE9BQU8sZ0JBQWdCLENBQUM7UUFDMUI7WUFDRSxPQUFPLFNBQVMsQ0FBQztRQUNuQjtZQUNFLE9BQU8sY0FBYyxDQUFDO1FBQ3hCO1lBQ0UsT0FBTyxLQUFLLENBQUM7UUFDZjtZQUNFLE9BQU8sTUFBTSxDQUFDO1FBQ2hCO1lBQ0UsT0FBTyxZQUFZLENBQUM7UUFDdEI7WUFDRSxPQUFPLE1BQU0sQ0FBQztRQUNoQjtZQUNFLHFFQUFxRTtZQUNyRSxPQUFPLFdBQVcsQ0FBQztLQUN0QjtBQUNILENBQUM7QUFFRDs7R0FFRztBQUNILE1BQU0sVUFBVSxvQkFBb0IsQ0FDaEMsSUFBVyxFQUFFLFFBQWdCLEVBQUUsT0FBb0IsRUFBRSxLQUFZLEVBQUUsS0FBWSxFQUMvRSxxQkFBcUIsR0FBRyxLQUFLO0lBQy9CLElBQUksQ0FBQyxJQUFJO1FBQ0wsQ0FBRSxJQUFhLENBQUMsUUFBUSxLQUFLLFFBQVE7WUFDcEMsQ0FBRSxJQUFhLENBQUMsUUFBUSxLQUFLLElBQUksQ0FBQyxZQUFZO2dC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T0FBTyxDQUFDLEtBQWtCLEVBQUUsU0FBUyxHQUFHLEVBQUU7SUFDakQsSUFBSSxDQUFDLEtBQUssRUFBRTtRQUNWLE9BQU8sRUFBRSxDQUFDO0tBQ1g7SUFDRCxLQUFLLEdBQUcsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQzdCLE9BQU8sS0FBSyxDQUFDLE1BQU0sR0FBRyxTQUFTLENBQUMsQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsU0FBUyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQztBQUNwRixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7UnVudGltZUVycm9yLCBSdW50aW1lRXJyb3JDb2RlfSBmcm9tICcuLi9lcnJvcnMnO1xuaW1wb3J0IHtnZXREZWNsYXJhdGlvbkNvbXBvbmVudERlZn0gZnJvbSAnLi4vcmVuZGVyMy9pbnN0cnVjdGlvbnMvZWxlbWVudF92YWxpZGF0aW9uJztcbmltcG9ydCB7VE5vZGUsIFROb2RlVHlwZX0gZnJvbSAnLi4vcmVuZGVyMy9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtSTm9kZX0gZnJvbSAnLi4vcmVuZGVyMy9pbnRlcmZhY2VzL3JlbmRlcmVyX2RvbSc7XG5pbXBvcnQge0xWaWV3LCBUVklFV30gZnJvbSAnLi4vcmVuZGVyMy9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHtnZXRQYXJlbnRSRWxlbWVudH0gZnJvbSAnLi4vcmVuZGVyMy9ub2RlX21hbmlwdWxhdGlvbic7XG5cbmNvbnN0IEFUX1RISVNfTE9DQVRJT04gPSAnPC0tIEFUIFRISVMgTE9DQVRJT04nO1xuXG4vKipcbiAqIFJldHJpZXZlcyBhIHVzZXIgZnJpZW5kbHkgc3RyaW5nIGZvciBhIGdpdmVuIFROb2RlVHlwZSBmb3IgdXNlIGluXG4gKiBmcmllbmRseSBlcnJvciBtZXNzYWdlc1xuICpcbiAqIEBwYXJhbSB0Tm9kZVR5cGVcbiAqIEByZXR1cm5zXG4gKi9cbmZ1bmN0aW9uIGdldEZyaWVuZGx5U3RyaW5nRnJvbVROb2RlVHlwZSh0Tm9kZVR5cGU6IFROb2RlVHlwZSk6IHN0cmluZyB7XG4gIHN3aXRjaCAodE5vZGVUeXBlKSB7XG4gICAgY2FzZSBUTm9kZVR5cGUuQ29udGFpbmVyOlxuICAgICAgcmV0dXJuICd2aWV3IGNvbnRhaW5lcic7XG4gICAgY2FzZSBUTm9kZVR5cGUuRWxlbWVudDpcbiAgICAgIHJldHVybiAnZWxlbWVudCc7XG4gICAgY2FzZSBUTm9kZVR5cGUuRWxlbWVudENvbnRhaW5lcjpcbiAgICAgIHJldHVybiAnbmctY29udGFpbmVyJztcbiAgICBjYXNlIFROb2RlVHlwZS5JY3U6XG4gICAgICByZXR1cm4gJ2ljdSc7XG4gICAgY2FzZSBUTm9kZVR5cGUuUGxhY2Vob2xkZXI6XG4gICAgICByZXR1cm4gJ2kxOG4nO1xuICAgIGNhc2UgVE5vZGVUeXBlLlByb2plY3Rpb246XG4gICAgICByZXR1cm4gJ3Byb2plY3Rpb24nO1xuICAgIGNhc2UgVE5vZGVUeXBlLlRleHQ6XG4gICAgICByZXR1cm4gJ3RleHQnO1xuICAgIGRlZmF1bHQ6XG4gICAgICAvLyBUaGlzIHNob3VsZCBub3QgaGFwcGVuIGFzIHdlIGNvdmVyIGFsbCBwb3NzaWJsZSBUTm9kZSB0eXBlcyBhYm92ZS5cbiAgICAgIHJldHVybiAnPHVua25vd24+JztcbiAgfVxufVxuXG4vKipcbiAqIFZhbGlkYXRlcyB0aGF0IHByb3ZpZGVkIG5vZGVzIG1hdGNoIGR1cmluZyB0aGUgaHlkcmF0aW9uIHByb2Nlc3MuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB2YWxpZGF0ZU1hdGNoaW5nTm9kZShcbiAgICBub2RlOiBSTm9kZSwgbm9kZVR5cGU6IG51bWJlciwgdGFnTmFtZTogc3RyaW5nfG51bGwsIGxWaWV3OiBMVmlldywgdE5vZGU6IFROb2RlLFxuICAgIGlzVmlld0NvbnRhaW5lckFuY2hvciA9IGZhbHNlKTogdm9pZCB7XG4gIGlmICghbm9kZSB8fFxuICAgICAgKChub2RlIGFzIE5vZGUpLm5vZGVUeXBlICE9PSBub2RlVHlwZSB8fFxuICAgICAgICgobm9kZSBhcyBOb2RlKS5ub2RlVHlwZSA9PT0gTm9kZS5FTEVNRU5UX05PREUgJiZcbiAgICAgICAgKG5vZGUgYXMgSFRNTEVsZW1lbnQpLnRhZ05hbWUudG9Mb3dlckNhc2UoKSAhPT0gdGFnTmFtZT8udG9Mb3dlckNhc2UoKSkpKSB7XG4gICAgY29uc3QgZXhwZWN0ZWROb2RlID0gc2hvcnRSTm9kZURlc2NyaXB0aW9uKG5vZGVUeXBlLCB0YWdOYW1lLCBudWxsKTtcbiAgICBsZXQgaGVhZGVyID0gYER1cmluZyBoeWRyYXRpb24gQW5ndWxhciBleHBlY3RlZCAke2V4cGVjdGVkTm9kZX0gYnV0IGA7XG5cbiAgICBjb25zdCBob3N0Q29tcG9uZW50RGVmID0gZ2V0RGVjbGFyYXRpb25Db21wb25lbnREZWYobFZpZXcpO1xuICAgIGNvbnN0IGNvbXBvbmVudENsYXNzTmFtZSA9IGhvc3RDb21wb25lbnREZWY/LnR5cGU/Lm5hbWU7XG5cbiAgICBjb25zdCBleHBlY3RlZCA9IGBBbmd1bGFyIGV4cGVjdGVkIHRoaXMgRE9NOlxcblxcbiR7XG4gICAgICAgIGRlc2NyaWJlRXhwZWN0ZWREb20obFZpZXcsIHROb2RlLCBpc1ZpZXdDb250YWluZXJBbmNob3IpfVxcblxcbmA7XG5cbiAgICBsZXQgYWN0dWFsID0gJyc7XG5cbiAgICBpZiAoIW5vZGUpIHtcbiAgICAgIC8vIE5vIG5vZGUgZm91bmQgZHVyaW5nIGh5ZHJhdGlvbi5cbiAgICAgIGhlYWRlciArPSBgdGhlIG5vZGUgd2FzIG5vdCBmb3VuZC5cXG5cXG5gO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBhY3R1YWxOb2RlID0gc2hvcnRSTm9kZURlc2NyaXB0aW9uKFxuICAgICAgICAgIChub2RlIGFzIE5vZGUpLm5vZGVUeXBlLCAobm9kZSBhcyBIVE1MRWxlbWVudCkudGFnTmFtZSA/PyBudWxsLFxuICAgICAgICAgIChub2RlIGFzIEhUTUxFbGVtZW50KS50ZXh0Q29udGVudCA/PyBudWxsKTtcblxuICAgICAgaGVhZGVyICs9IGBmb3VuZCAke2FjdHVhbE5vZGV9LlxcblxcbmA7XG4gICAgICBhY3R1YWwgPSBgQWN0dWFsIERPTSBpczpcXG5cXG4ke2Rlc2NyaWJlRG9tRnJvbU5vZGUobm9kZSl9XFxuXFxuYDtcbiAgICB9XG5cbiAgICBjb25zdCBmb290ZXIgPSBnZXRIeWRyYXRpb25FcnJvckZvb3Rlcihjb21wb25lbnRDbGFzc05hbWUpO1xuICAgIGNvbnN0IG1lc3NhZ2UgPSBoZWFkZXIgKyBleHBlY3RlZCArIGFjdHVhbCArIGdldEh5ZHJhdGlvbkF0dHJpYnV0ZU5vdGUoKSArIGZvb3RlcjtcbiAgICB0aHJvdyBuZXcgUnVudGltZUVycm9yKFJ1bnRpbWVFcnJvckNvZGUuSFlEUkFUSU9OX05PREVfTUlTTUFUQ0gsIG1lc3NhZ2UpO1xuICB9XG59XG5cbi8qKlxuICogVmFsaWRhdGVzIHRoYXQgYSBnaXZlbiBub2RlIGhhcyBzaWJsaW5nIG5vZGVzXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB2YWxpZGF0ZVNpYmxpbmdOb2RlRXhpc3RzKG5vZGU6IFJOb2RlfG51bGwpOiB2b2lkIHtcbiAgdmFsaWRhdGVOb2RlRXhpc3RzKG5vZGUpO1xuICBpZiAoIW5vZGUhLm5leHRTaWJsaW5nKSB7XG4gICAgY29uc3QgaGVhZGVyID0gJ0R1cmluZyBoeWRyYXRpb24gQW5ndWxhciBleHBlY3RlZCBtb3JlIHNpYmxpbmcgbm9kZXMgdG8gYmUgcHJlc2VudC5cXG5cXG4nO1xuICAgIGNvbnN0IGFjdHVhbCA9IGBBY3R1YWwgRE9NIGlzOlxcblxcbiR7ZGVzY3JpYmVEb21Gcm9tTm9kZShub2RlISl9XFxuXFxuYDtcbiAgICBjb25zdCBmb290ZXIgPSBnZXRIeWRyYXRpb25FcnJvckZvb3RlcigpO1xuXG4gICAgY29uc3QgbWVzc2FnZSA9IGhlYWRlciArIGFjdHVhbCArIGZvb3RlcjtcbiAgICB0aHJvdyBuZXcgUnVudGltZUVycm9yKFJ1bnRpbWVFcnJvckNvZGUuSFlEUkFUSU9OX01JU1NJTkdfU0lCTElOR1MsIG1lc3NhZ2UpO1xuICB9XG59XG5cbi8qKlxuICogVmFsaWRhdGVzIHRoYXQgYSBub2RlIGV4aXN0cyBvciB0aHJvd3NcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHZhbGlkYXRlTm9kZUV4aXN0cyhub2RlOiBSTm9kZXxudWxsKTogdm9pZCB7XG4gIGlmICghbm9kZSkge1xuICAgIHRocm93IG5ldyBSdW50aW1lRXJyb3IoXG4gICAgICAgIFJ1bnRpbWVFcnJvckNvZGUuSFlEUkFUSU9OX01JU1NJTkdfTk9ERSxcbiAgICAgICAgYEh5ZHJhdGlvbiBleHBlY3RlZCBhbiBlbGVtZW50IHRvIGJlIHByZXNlbnQgYXQgdGhpcyBsb2NhdGlvbi5gKTtcbiAgfVxufVxuXG4vKipcbiAqIEJ1aWxkcyB0aGUgaHlkcmF0aW9uIGVycm9yIG1lc3NhZ2Ugd2hlbiBhIG5vZGUgaXMgbm90IGZvdW5kXG4gKlxuICogQHBhcmFtIGxWaWV3IHRoZSBMVmlldyB3aGVyZSB0aGUgbm9kZSBleGlzdHNcbiAqIEBwYXJhbSB0Tm9kZSB0aGUgVE5vZGVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG5vZGVOb3RGb3VuZEVycm9yKGxWaWV3OiBMVmlldywgdE5vZGU6IFROb2RlKTogRXJyb3Ige1xuICBjb25zdCBoZWFkZXIgPSAnRHVyaW5nIHNlcmlhbGl6YXRpb24sIEFuZ3VsYXIgd2FzIHVuYWJsZSB0byBmaW5kIGFuIGVsZW1lbnQgaW4gdGhlIERPTTpcXG5cXG4nO1xuICBjb25zdCBleHBlY3RlZCA9IGAke2Rlc2NyaWJlRXhwZWN0ZWREb20obFZpZXcsIHROb2RlLCBmYWxzZSl9XFxuXFxuYDtcbiAgY29uc3QgZm9vdGVyID0gZ2V0SHlkcmF0aW9uRXJyb3JGb290ZXIoKTtcblxuICB0aHJvdyBuZXcgUnVudGltZUVycm9yKFJ1bnRpbWVFcnJvckNvZGUuSFlEUkFUSU9OX01JU1NJTkdfTk9ERSwgaGVhZGVyICsgZXhwZWN0ZWQgKyBmb290ZXIpO1xufVxuXG4vKipcbiAqIEJ1aWxkcyBhIGh5ZHJhdGlvbiBlcnJvciBtZXNzYWdlIHdoZW4gYSBub2RlIGlzIG5vdCBmb3VuZCBhdCBhIHBhdGggbG9jYXRpb25cbiAqXG4gKiBAcGFyYW0gaG9zdCB0aGUgSG9zdCBOb2RlXG4gKiBAcGFyYW0gcGF0aCB0aGUgcGF0aCB0byB0aGUgbm9kZVxuICovXG5leHBvcnQgZnVuY3Rpb24gbm9kZU5vdEZvdW5kQXRQYXRoRXJyb3IoaG9zdDogTm9kZSwgcGF0aDogc3RyaW5nKTogRXJyb3Ige1xuICBjb25zdCBoZWFkZXIgPSBgRHVyaW5nIGh5ZHJhdGlvbiBBbmd1bGFyIHdhcyB1bmFibGUgdG8gbG9jYXRlIGEgbm9kZSBgICtcbiAgICAgIGB1c2luZyB0aGUgXCIke3BhdGh9XCIgcGF0aCwgc3RhcnRpbmcgZnJvbSB0aGUgJHtkZXNjcmliZVJOb2RlKGhvc3QpfSBub2RlLlxcblxcbmA7XG4gIGNvbnN0IGZvb3RlciA9IGdldEh5ZHJhdGlvbkVycm9yRm9vdGVyKCk7XG5cbiAgdGhyb3cgbmV3IFJ1bnRpbWVFcnJvcihSdW50aW1lRXJyb3JDb2RlLkhZRFJBVElPTl9NSVNTSU5HX05PREUsIGhlYWRlciArIGZvb3Rlcik7XG59XG5cblxuLyoqXG4gKiBCdWlsZHMgdGhlIGh5ZHJhdGlvbiBlcnJvciBtZXNzYWdlIGluIHRoZSBjYXNlIHRoYXQgZG9tIG5vZGVzIGFyZSBjcmVhdGVkIG91dHNpZGUgb2ZcbiAqIHRoZSBBbmd1bGFyIGNvbnRleHQgYW5kIGFyZSBiZWluZyB1c2VkIGFzIHByb2plY3RlZCBub2Rlc1xuICpcbiAqIEBwYXJhbSBsVmlldyB0aGUgTFZpZXdcbiAqIEBwYXJhbSB0Tm9kZSB0aGUgVE5vZGVcbiAqIEByZXR1cm5zIGFuIGVycm9yXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB1bnN1cHBvcnRlZFByb2plY3Rpb25PZkRvbU5vZGVzKHJOb2RlOiBSTm9kZSk6IEVycm9yIHtcbiAgY29uc3QgaGVhZGVyID0gJ0R1cmluZyBzZXJpYWxpemF0aW9uLCBBbmd1bGFyIGRldGVjdGVkIERPTSBub2RlcyAnICtcbiAgICAgICd0aGF0IHdlcmUgY3JlYXRlZCBvdXRzaWRlIG9mIEFuZ3VsYXIgY29udGV4dCBhbmQgcHJvdmlkZWQgYXMgcHJvamVjdGFibGUgbm9kZXMgJyArXG4gICAgICAnKGxpa2VseSB2aWEgYFZpZXdDb250YWluZXJSZWYuY3JlYXRlQ29tcG9uZW50YCBvciBgY3JlYXRlQ29tcG9uZW50YCBBUElzKS4gJyArXG4gICAgICAnSHlkcmF0aW9uIGlzIG5vdCBzdXBwb3J0ZWQgZm9yIHN1Y2ggY2FzZXMsIGNvbnNpZGVyIHJlZmFjdG9yaW5nIHRoZSBjb2RlIHRvIGF2b2lkICcgK1xuICAgICAgJ3RoaXMgcGF0dGVybiBvciB1c2luZyBgbmdTa2lwSHlkcmF0aW9uYCBvbiB0aGUgaG9zdCBlbGVtZW50IG9mIHRoZSBjb21wb25lbnQuXFxuXFxuJztcbiAgY29uc3QgYWN0dWFsID0gYCR7ZGVzY3JpYmVEb21Gcm9tTm9kZShyTm9kZSl9XFxuXFxuYDtcbiAgY29uc3QgbWVzc2FnZSA9IGhlYWRlciArIGFjdHVhbCArIGdldEh5ZHJhdGlvbkF0dHJpYnV0ZU5vdGUoKTtcbiAgcmV0dXJuIG5ldyBSdW50aW1lRXJyb3IoUnVudGltZUVycm9yQ29kZS5VTlNVUFBPUlRFRF9QUk9KRUNUSU9OX0RPTV9OT0RFUywgbWVzc2FnZSk7XG59XG5cbi8qKlxuICogQnVpbGRzIHRoZSBoeWRyYXRpb24gZXJyb3IgbWVzc2FnZSBpbiB0aGUgY2FzZSB0aGF0IG5nU2tpcEh5ZHJhdGlvbiB3YXMgdXNlZCBvbiBhXG4gKiBub2RlIHRoYXQgaXMgbm90IGEgY29tcG9uZW50IGhvc3QgZWxlbWVudCBvciBob3N0IGJpbmRpbmdcbiAqXG4gKiBAcGFyYW0gck5vZGUgdGhlIEhUTUwgRWxlbWVudFxuICogQHJldHVybnMgYW4gZXJyb3JcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGludmFsaWRTa2lwSHlkcmF0aW9uSG9zdChyTm9kZTogUk5vZGUpOiBFcnJvciB7XG4gIGNvbnN0IGhlYWRlciA9ICdUaGUgYG5nU2tpcEh5ZHJhdGlvbmAgZmxhZyBpcyBhcHBsaWVkIG9uIGEgbm9kZSAnICtcbiAgICAgICd0aGF0IGRvZXNuXFwndCBhY3QgYXMgYSBjb21wb25lbnQgaG9zdC4gSHlkcmF0aW9uIGNhbiBiZSAnICtcbiAgICAgICdza2lwcGVkIG9ubHkgb24gcGVyLWNvbXBvbmVudCBiYXNpcy5cXG5cXG4nO1xuICBjb25zdCBhY3R1YWwgPSBgJHtkZXNjcmliZURvbUZyb21Ob2RlKHJOb2RlKX1cXG5cXG5gO1xuICBjb25zdCBmb290ZXIgPSAnUGxlYXNlIG1vdmUgdGhlIGBuZ1NraXBIeWRyYXRpb25gIGF0dHJpYnV0ZSB0byB0aGUgY29tcG9uZW50IGhvc3QgZWxlbWVudC5cXG5cXG4nO1xuICBjb25zdCBtZXNzYWdlID0gaGVhZGVyICsgYWN0dWFsICsgZm9vdGVyO1xuICByZXR1cm4gbmV3IFJ1bnRpbWVFcnJvcihSdW50aW1lRXJyb3JDb2RlLklOVkFMSURfU0tJUF9IWURSQVRJT05fSE9TVCwgbWVzc2FnZSk7XG59XG5cbi8vIFN0cmluZ2lmaWNhdGlvbiBtZXRob2RzXG5cbi8qKlxuICogU3RyaW5naWZpZXMgYSBnaXZlbiBUTm9kZSdzIGF0dHJpYnV0ZXNcbiAqXG4gKiBAcGFyYW0gdE5vZGUgYSBwcm92aWRlZCBUTm9kZVxuICogQHJldHVybnMgc3RyaW5nXG4gKi9cbmZ1bmN0aW9uIHN0cmluZ2lmeVROb2RlQXR0cnModE5vZGU6IFROb2RlKTogc3RyaW5nIHtcbiAgY29uc3QgcmVzdWx0cyA9IFtdO1xuICBpZiAodE5vZGUuYXR0cnMpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHROb2RlLmF0dHJzLmxlbmd0aDspIHtcbiAgICAgIGNvbnN0IGF0dHJOYW1lID0gdE5vZGUuYXR0cnNbaSsrXTtcbiAgICAgIC8vIE9uY2Ugd2UgcmVhY2ggdGhlIGZpcnN0IGZsYWcsIHdlIGtub3cgdGhhdCB0aGUgbGlzdCBvZlxuICAgICAgLy8gYXR0cmlidXRlcyBpcyBvdmVyLlxuICAgICAgaWYgKHR5cGVvZiBhdHRyTmFtZSA9PSAnbnVtYmVyJykge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNvbnN0IGF0dHJWYWx1ZSA9IHROb2RlLmF0dHJzW2krK107XG4gICAgICByZXN1bHRzLnB1c2goYCR7YXR0ck5hbWV9PVwiJHtzaG9ydGVuKGF0dHJWYWx1ZSBhcyBzdHJpbmcpfVwiYCk7XG4gICAgfVxuICB9XG4gIHJldHVybiByZXN1bHRzLmpvaW4oJyAnKTtcbn1cblxuLyoqXG4gKiBUaGUgbGlzdCBvZiBpbnRlcm5hbCBhdHRyaWJ1dGVzIHRoYXQgc2hvdWxkIGJlIGZpbHRlcmVkIG91dCB3aGlsZVxuICogcHJvZHVjaW5nIGFuIGVycm9yIG1lc3NhZ2UuXG4gKi9cbmNvbnN0IGludGVybmFsQXR0cnMgPSBuZXcgU2V0KFsnbmdoJywgJ25nLXZlcnNpb24nLCAnbmctc2VydmVyLWNvbnRleHQnXSk7XG5cbi8qKlxuICogU3RyaW5naWZpZXMgYW4gSFRNTCBFbGVtZW50J3MgYXR0cmlidXRlc1xuICpcbiAqIEBwYXJhbSByTm9kZSBhbiBIVE1MIEVsZW1lbnRcbiAqIEByZXR1cm5zIHN0cmluZ1xuICovXG5mdW5jdGlvbiBzdHJpbmdpZnlSTm9kZUF0dHJzKHJOb2RlOiBIVE1MRWxlbWVudCk6IHN0cmluZyB7XG4gIGNvbnN0IHJlc3VsdHMgPSBbXTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCByTm9kZS5hdHRyaWJ1dGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgYXR0ciA9IHJOb2RlLmF0dHJpYnV0ZXNbaV07XG4gICAgaWYgKGludGVybmFsQXR0cnMuaGFzKGF0dHIubmFtZSkpIGNvbnRpbnVlO1xuICAgIHJlc3VsdHMucHVzaChgJHthdHRyLm5hbWV9PVwiJHtzaG9ydGVuKGF0dHIudmFsdWUpfVwiYCk7XG4gIH1cbiAgcmV0dXJuIHJlc3VsdHMuam9pbignICcpO1xufVxuXG4vLyBNZXRob2RzIGZvciBEZXNjcmliaW5nIHRoZSBET01cblxuLyoqXG4gKiBDb252ZXJ0cyBhIHROb2RlIHRvIGEgaGVscGZ1bCByZWFkYWJsZSBzdHJpbmcgdmFsdWUgZm9yIHVzZSBpbiBlcnJvciBtZXNzYWdlc1xuICpcbiAqIEBwYXJhbSB0Tm9kZSBhIGdpdmVuIFROb2RlXG4gKiBAcGFyYW0gaW5uZXJDb250ZW50IHRoZSBjb250ZW50IG9mIHRoZSBub2RlXG4gKiBAcmV0dXJucyBzdHJpbmdcbiAqL1xuZnVuY3Rpb24gZGVzY3JpYmVUTm9kZSh0Tm9kZTogVE5vZGUsIGlubmVyQ29udGVudDogc3RyaW5nID0gJ+KApicpOiBzdHJpbmcge1xuICBzd2l0Y2ggKHROb2RlLnR5cGUpIHtcbiAgICBjYXNlIFROb2RlVHlwZS5UZXh0OlxuICAgICAgY29uc3QgY29udGVudCA9IHROb2RlLnZhbHVlID8gYCgke3ROb2RlLnZhbHVlfSlgIDogJyc7XG4gICAgICByZXR1cm4gYCN0ZXh0JHtjb250ZW50fWA7XG4gICAgY2FzZSBUTm9kZVR5cGUuRWxlbWVudDpcbiAgICAgIGNvbnN0IGF0dHJzID0gc3RyaW5naWZ5VE5vZGVBdHRycyh0Tm9kZSk7XG4gICAgICBjb25zdCB0YWcgPSB0Tm9kZS52YWx1ZS50b0xvd2VyQ2FzZSgpO1xuICAgICAgcmV0dXJuIGA8JHt0YWd9JHthdHRycyA/ICcgJyArIGF0dHJzIDogJyd9PiR7aW5uZXJDb250ZW50fTwvJHt0YWd9PmA7XG4gICAgY2FzZSBUTm9kZVR5cGUuRWxlbWVudENvbnRhaW5lcjpcbiAgICAgIHJldHVybiAnPCEtLSBuZy1jb250YWluZXIgLS0+JztcbiAgICBjYXNlIFROb2RlVHlwZS5Db250YWluZXI6XG4gICAgICByZXR1cm4gJzwhLS0gY29udGFpbmVyIC0tPic7XG4gICAgZGVmYXVsdDpcbiAgICAgIGNvbnN0IHR5cGVBc1N0cmluZyA9IGdldEZyaWVuZGx5U3RyaW5nRnJvbVROb2RlVHlwZSh0Tm9kZS50eXBlKTtcbiAgICAgIHJldHVybiBgI25vZGUoJHt0eXBlQXNTdHJpbmd9KWA7XG4gIH1cbn1cblxuLyoqXG4gKiBDb252ZXJ0cyBhbiBSTm9kZSB0byBhIGhlbHBmdWwgcmVhZGFibGUgc3RyaW5nIHZhbHVlIGZvciB1c2UgaW4gZXJyb3IgbWVzc2FnZXNcbiAqXG4gKiBAcGFyYW0gck5vZGUgYSBnaXZlbiBSTm9kZVxuICogQHBhcmFtIGlubmVyQ29udGVudCB0aGUgY29udGVudCBvZiB0aGUgbm9kZVxuICogQHJldHVybnMgc3RyaW5nXG4gKi9cbmZ1bmN0aW9uIGRlc2NyaWJlUk5vZGUock5vZGU6IFJOb2RlLCBpbm5lckNvbnRlbnQ6IHN0cmluZyA9ICfigKYnKTogc3RyaW5nIHtcbiAgY29uc3Qgbm9kZSA9IHJOb2RlIGFzIEhUTUxFbGVtZW50O1xuICBzd2l0Y2ggKG5vZGUubm9kZVR5cGUpIHtcbiAgICBjYXNlIE5vZGUuRUxFTUVOVF9OT0RFOlxuICAgICAgY29uc3QgdGFnID0gbm9kZS50YWdOYW1lIS50b0xvd2VyQ2FzZSgpO1xuICAgICAgY29uc3QgYXR0cnMgPSBzdHJpbmdpZnlSTm9kZUF0dHJzKG5vZGUpO1xuICAgICAgcmV0dXJuIGA8JHt0YWd9JHthdHRycyA/ICcgJyArIGF0dHJzIDogJyd9PiR7aW5uZXJDb250ZW50fTwvJHt0YWd9PmA7XG4gICAgY2FzZSBOb2RlLlRFWFRfTk9ERTpcbiAgICAgIGNvbnN0IGNvbnRlbnQgPSBub2RlLnRleHRDb250ZW50ID8gc2hvcnRlbihub2RlLnRleHRDb250ZW50KSA6ICcnO1xuICAgICAgcmV0dXJuIGAjdGV4dCR7Y29udGVudCA/IGAoJHtjb250ZW50fSlgIDogJyd9YDtcbiAgICBjYXNlIE5vZGUuQ09NTUVOVF9OT0RFOlxuICAgICAgcmV0dXJuIGA8IS0tICR7c2hvcnRlbihub2RlLnRleHRDb250ZW50ID8/ICcnKX0gLS0+YDtcbiAgICBkZWZhdWx0OlxuICAgICAgcmV0dXJuIGAjbm9kZSgke25vZGUubm9kZVR5cGV9KWA7XG4gIH1cbn1cblxuLyoqXG4gKiBCdWlsZHMgdGhlIHN0cmluZyBjb250YWluaW5nIHRoZSBleHBlY3RlZCBET00gcHJlc2VudCBnaXZlbiB0aGUgTFZpZXcgYW5kIFROb2RlXG4gKiB2YWx1ZXMgZm9yIGEgcmVhZGFibGUgZXJyb3IgbWVzc2FnZVxuICpcbiAqIEBwYXJhbSBsVmlldyB0aGUgbFZpZXcgY29udGFpbmluZyB0aGUgRE9NXG4gKiBAcGFyYW0gdE5vZGUgdGhlIHROb2RlXG4gKiBAcGFyYW0gaXNWaWV3Q29udGFpbmVyQW5jaG9yIGJvb2xlYW5cbiAqIEByZXR1cm5zIHN0cmluZ1xuICovXG5mdW5jdGlvbiBkZXNjcmliZUV4cGVjdGVkRG9tKGxWaWV3OiBMVmlldywgdE5vZGU6IFROb2RlLCBpc1ZpZXdDb250YWluZXJBbmNob3I6IGJvb2xlYW4pOiBzdHJpbmcge1xuICBjb25zdCBzcGFjZXIgPSAnICAnO1xuICBsZXQgY29udGVudCA9ICcnO1xuICBpZiAodE5vZGUucHJldikge1xuICAgIGNvbnRlbnQgKz0gc3BhY2VyICsgJ+KAplxcbic7XG4gICAgY29udGVudCArPSBzcGFjZXIgKyBkZXNjcmliZVROb2RlKHROb2RlLnByZXYpICsgJ1xcbic7XG4gIH0gZWxzZSBpZiAodE5vZGUudHlwZSAmJiB0Tm9kZS50eXBlICYgVE5vZGVUeXBlLkFueUNvbnRhaW5lcikge1xuICAgIGNvbnRlbnQgKz0gc3BhY2VyICsgJ+KAplxcbic7XG4gIH1cbiAgaWYgKGlzVmlld0NvbnRhaW5lckFuY2hvcikge1xuICAgIGNvbnRlbnQgKz0gc3BhY2VyICsgZGVzY3JpYmVUTm9kZSh0Tm9kZSkgKyAnXFxuJztcbiAgICBjb250ZW50ICs9IHNwYWNlciArIGA8IS0tIGNvbnRhaW5lciAtLT4gICR7QVRfVEhJU19MT0NBVElPTn1cXG5gO1xuICB9IGVsc2Uge1xuICAgIGNvbnRlbnQgKz0gc3BhY2VyICsgZGVzY3JpYmVUTm9kZSh0Tm9kZSkgKyBgICAke0FUX1RISVNfTE9DQVRJT059XFxuYDtcbiAgfVxuICBjb250ZW50ICs9IHNwYWNlciArICfigKZcXG4nO1xuXG4gIGNvbnN0IHBhcmVudFJOb2RlID0gdE5vZGUudHlwZSA/IGdldFBhcmVudFJFbGVtZW50KGxWaWV3W1RWSUVXXSwgdE5vZGUsIGxWaWV3KSA6IG51bGw7XG4gIGlmIChwYXJlbnRSTm9kZSkge1xuICAgIGNvbnRlbnQgPSBkZXNjcmliZVJOb2RlKHBhcmVudFJOb2RlIGFzIHVua25vd24gYXMgTm9kZSwgJ1xcbicgKyBjb250ZW50KTtcbiAgfVxuICByZXR1cm4gY29udGVudDtcbn1cblxuLyoqXG4gKiBCdWlsZHMgdGhlIHN0cmluZyBjb250YWluaW5nIHRoZSBET00gcHJlc2VudCBhcm91bmQgYSBnaXZlbiBSTm9kZSBmb3IgYVxuICogcmVhZGFibGUgZXJyb3IgbWVzc2FnZVxuICpcbiAqIEBwYXJhbSBub2RlIHRoZSBSTm9kZVxuICogQHJldHVybnMgc3RyaW5nXG4gKi9cbmZ1bmN0aW9uIGRlc2NyaWJlRG9tRnJvbU5vZGUobm9kZTogUk5vZGUpOiBzdHJpbmcge1xuICBjb25zdCBzcGFjZXIgPSAnICAnO1xuICBsZXQgY29udGVudCA9ICcnO1xuICBjb25zdCBjdXJyZW50Tm9kZSA9IG5vZGUgYXMgSFRNTEVsZW1lbnQ7XG4gIGlmIChjdXJyZW50Tm9kZS5wcmV2aW91c1NpYmxpbmcpIHtcbiAgICBjb250ZW50ICs9IHNwYWNlciArICfigKZcXG4nO1xuICAgIGNvbnRlbnQgKz0gc3BhY2VyICsgZGVzY3JpYmVSTm9kZShjdXJyZW50Tm9kZS5wcmV2aW91c1NpYmxpbmcpICsgJ1xcbic7XG4gIH1cbiAgY29udGVudCArPSBzcGFjZXIgKyBkZXNjcmliZVJOb2RlKGN1cnJlbnROb2RlKSArIGAgICR7QVRfVEhJU19MT0NBVElPTn1cXG5gO1xuICBpZiAobm9kZS5uZXh0U2libGluZykge1xuICAgIGNvbnRlbnQgKz0gc3BhY2VyICsgJ+KAplxcbic7XG4gIH1cbiAgaWYgKG5vZGUucGFyZW50Tm9kZSkge1xuICAgIGNvbnRlbnQgPSBkZXNjcmliZVJOb2RlKGN1cnJlbnROb2RlLnBhcmVudE5vZGUgYXMgTm9kZSwgJ1xcbicgKyBjb250ZW50KTtcbiAgfVxuICByZXR1cm4gY29udGVudDtcbn1cblxuLyoqXG4gKiBTaG9ydGVucyB0aGUgZGVzY3JpcHRpb24gb2YgYSBnaXZlbiBSTm9kZSBieSBpdHMgdHlwZSBmb3IgcmVhZGFiaWxpdHlcbiAqXG4gKiBAcGFyYW0gbm9kZVR5cGUgdGhlIHR5cGUgb2Ygbm9kZVxuICogQHBhcmFtIHRhZ05hbWUgdGhlIG5vZGUgdGFnIG5hbWVcbiAqIEBwYXJhbSB0ZXh0Q29udGVudCB0aGUgdGV4dCBjb250ZW50IGluIHRoZSBub2RlXG4gKiBAcmV0dXJucyBzdHJpbmdcbiAqL1xuZnVuY3Rpb24gc2hvcnRSTm9kZURlc2NyaXB0aW9uKFxuICAgIG5vZGVUeXBlOiBudW1iZXIsIHRhZ05hbWU6IHN0cmluZ3xudWxsLCB0ZXh0Q29udGVudDogc3RyaW5nfG51bGwpOiBzdHJpbmcge1xuICBzd2l0Y2ggKG5vZGVUeXBlKSB7XG4gICAgY2FzZSBOb2RlLkVMRU1FTlRfTk9ERTpcbiAgICAgIHJldHVybiBgPCR7dGFnTmFtZSEudG9Mb3dlckNhc2UoKX0+YDtcbiAgICBjYXNlIE5vZGUuVEVYVF9OT0RFOlxuICAgICAgY29uc3QgY29udGVudCA9IHRleHRDb250ZW50ID8gYCAod2l0aCB0aGUgXCIke3Nob3J0ZW4odGV4dENvbnRlbnQpfVwiIGNvbnRlbnQpYCA6ICcnO1xuICAgICAgcmV0dXJuIGBhIHRleHQgbm9kZSR7Y29udGVudH1gO1xuICAgIGNhc2UgTm9kZS5DT01NRU5UX05PREU6XG4gICAgICByZXR1cm4gJ2EgY29tbWVudCBub2RlJztcbiAgICBkZWZhdWx0OlxuICAgICAgcmV0dXJuIGAjbm9kZShub2RlVHlwZT0ke25vZGVUeXBlfSlgO1xuICB9XG59XG5cblxuLyoqXG4gKiBCdWlsZHMgdGhlIGZvb3RlciBoeWRyYXRpb24gZXJyb3IgbWVzc2FnZVxuICpcbiAqIEBwYXJhbSBjb21wb25lbnRDbGFzc05hbWUgdGhlIG5hbWUgb2YgdGhlIGNvbXBvbmVudCBjbGFzc1xuICogQHJldHVybnMgc3RyaW5nXG4gKi9cbmZ1bmN0aW9uIGdldEh5ZHJhdGlvbkVycm9yRm9vdGVyKGNvbXBvbmVudENsYXNzTmFtZT86IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IGNvbXBvbmVudEluZm8gPSBjb21wb25lbnRDbGFzc05hbWUgPyBgdGhlIFwiJHtjb21wb25lbnRDbGFzc05hbWV9XCJgIDogJ2NvcnJlc3BvbmRpbmcnO1xuICByZXR1cm4gYFRvIGZpeCB0aGlzIHByb2JsZW06XFxuYCArXG4gICAgICBgICAqIGNoZWNrICR7Y29tcG9uZW50SW5mb30gY29tcG9uZW50IGZvciBoeWRyYXRpb24tcmVsYXRlZCBpc3N1ZXNcXG5gICtcbiAgICAgIGAgICogb3Igc2tpcCBoeWRyYXRpb24gYnkgYWRkaW5nIHRoZSBcXGBuZ1NraXBIeWRyYXRpb25cXGAgYXR0cmlidXRlIGAgK1xuICAgICAgYHRvIGl0cyBob3N0IG5vZGUgaW4gYSB0ZW1wbGF0ZVxcblxcbmA7XG59XG5cbi8qKlxuICogQW4gYXR0cmlidXRlIHJlbGF0ZWQgbm90ZSBmb3IgaHlkcmF0aW9uIGVycm9yc1xuICovXG5mdW5jdGlvbiBnZXRIeWRyYXRpb25BdHRyaWJ1dGVOb3RlKCk6IHN0cmluZyB7XG4gIHJldHVybiAnTm90ZTogYXR0cmlidXRlcyBhcmUgb25seSBkaXNwbGF5ZWQgdG8gYmV0dGVyIHJlcHJlc2VudCB0aGUgRE9NJyArXG4gICAgICAnIGJ1dCBoYXZlIG5vIGVmZmVjdCBvbiBoeWRyYXRpb24gbWlzbWF0Y2hlcy5cXG5cXG4nO1xufVxuXG4vLyBOb2RlIHN0cmluZyB1dGlsaXR5IGZ1bmN0aW9uc1xuXG4vKipcbiAqIFN0cmlwcyBhbGwgbmV3bGluZXMgb3V0IG9mIGEgZ2l2ZW4gc3RyaW5nXG4gKlxuICogQHBhcmFtIGlucHV0IGEgc3RyaW5nIHRvIGJlIGNsZWFyZWQgb2YgbmV3IGxpbmUgY2hhcmFjdGVyc1xuICogQHJldHVybnNcbiAqL1xuZnVuY3Rpb24gc3RyaXBOZXdsaW5lcyhpbnB1dDogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIGlucHV0LnJlcGxhY2UoL1xccysvZ20sICcnKTtcbn1cblxuLyoqXG4gKiBSZWR1Y2VzIGEgc3RyaW5nIGRvd24gdG8gYSBtYXhpbXVtIGxlbmd0aCBvZiBjaGFyYWN0ZXJzIHdpdGggZWxsaXBzaXMgZm9yIHJlYWRhYmlsaXR5XG4gKlxuICogQHBhcmFtIGlucHV0IGEgc3RyaW5nIGlucHV0XG4gKiBAcGFyYW0gbWF4TGVuZ3RoIGEgbWF4aW11bSBsZW5ndGggaW4gY2hhcmFjdGVyc1xuICogQHJldHVybnMgc3RyaW5nXG4gKi9cbmZ1bmN0aW9uIHNob3J0ZW4oaW5wdXQ6IHN0cmluZ3xudWxsLCBtYXhMZW5ndGggPSA1MCk6IHN0cmluZyB7XG4gIGlmICghaW5wdXQpIHtcbiAgICByZXR1cm4gJyc7XG4gIH1cbiAgaW5wdXQgPSBzdHJpcE5ld2xpbmVzKGlucHV0KTtcbiAgcmV0dXJuIGlucHV0Lmxlbmd0aCA+IG1heExlbmd0aCA/IGAke2lucHV0LnN1YnN0cmluZygwLCBtYXhMZW5ndGggLSAxKX3igKZgIDogaW5wdXQ7XG59XG4iXX0=