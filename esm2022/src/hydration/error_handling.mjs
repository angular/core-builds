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
export function validateNodeExists(node, lView = null, tNode = null) {
    if (!node) {
        const header = 'During hydration, Angular expected an element to be present at this location.\n\n';
        let expected = '';
        let footer = '';
        if (lView !== null && tNode !== null) {
            expected = `${describeExpectedDom(lView, tNode, false)}\n\n`;
            footer = getHydrationErrorFooter();
        }
        throw new RuntimeError(-502 /* RuntimeErrorCode.HYDRATION_MISSING_NODE */, header + expected + footer);
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
        `  * check to see if your template has valid HTML structure\n` +
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXJyb3JfaGFuZGxpbmcuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9oeWRyYXRpb24vZXJyb3JfaGFuZGxpbmcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLFlBQVksRUFBbUIsTUFBTSxXQUFXLENBQUM7QUFDekQsT0FBTyxFQUFDLDBCQUEwQixFQUFDLE1BQU0sNENBQTRDLENBQUM7QUFHdEYsT0FBTyxFQUFRLEtBQUssRUFBQyxNQUFNLDRCQUE0QixDQUFDO0FBQ3hELE9BQU8sRUFBQyxpQkFBaUIsRUFBQyxNQUFNLDhCQUE4QixDQUFDO0FBRS9ELE1BQU0sZ0JBQWdCLEdBQUcsc0JBQXNCLENBQUM7QUFFaEQ7Ozs7OztHQU1HO0FBQ0gsU0FBUyw4QkFBOEIsQ0FBQyxTQUFvQjtJQUMxRCxRQUFRLFNBQVMsRUFBRSxDQUFDO1FBQ2xCO1lBQ0UsT0FBTyxnQkFBZ0IsQ0FBQztRQUMxQjtZQUNFLE9BQU8sU0FBUyxDQUFDO1FBQ25CO1lBQ0UsT0FBTyxjQUFjLENBQUM7UUFDeEI7WUFDRSxPQUFPLEtBQUssQ0FBQztRQUNmO1lBQ0UsT0FBTyxNQUFNLENBQUM7UUFDaEI7WUFDRSxPQUFPLFlBQVksQ0FBQztRQUN0QjtZQUNFLE9BQU8sTUFBTSxDQUFDO1FBQ2hCO1lBQ0UscUVBQXFFO1lBQ3JFLE9BQU8sV0FBVyxDQUFDO0lBQ3ZCLENBQUM7QUFDSCxDQUFDO0FBRUQ7O0dBRUc7QUFDSCxNQUFNLFVBQVUsb0JBQW9CLENBQ2hDLElBQVcsRUFBRSxRQUFnQixFQUFFLE9BQW9CLEVBQUUsS0FBWSxFQUFFLEtBQVksRUFDL0UscUJBQXFCLEdBQUcsS0FBSztJQUMvQixJQUFJLENBQUMsSUFBSTtRQUNMLENBQUUsSUFBYSxDQUFDLFFBQVEsS0FBSyxRQUFRO1lBQ3BDLENBQUUsSUFBYSxDQUFDLFFBQVEsS0FBSyxJQUFJLENB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QUssSUFBSSxDQUFDLFlBQVk7WUFDcEIsT0FBTyxnQkFBZ0IsQ0FBQztRQUMxQjtZQUNFLE9BQU8sa0JBQWtCLFFBQVEsR0FBRyxDQUFDO0lBQ3pDLENBQUM7QUFDSCxDQUFDO0FBR0Q7Ozs7O0dBS0c7QUFDSCxTQUFTLHVCQUF1QixDQUFDLGtCQUEyQjtJQUMxRCxNQUFNLGFBQWEsR0FBRyxrQkFBa0IsQ0FBQyxDQUFDLENBQUMsUUFBUSxrQkFBa0IsR0FBRyxDQUFDLENBQUMsQ0FBQyxlQUFlLENBQUM7SUFDM0YsT0FBTyx3QkFBd0I7UUFDM0IsYUFBYSxhQUFhLDJDQUEyQztRQUNyRSw4REFBOEQ7UUFDOUQsb0VBQW9FO1FBQ3BFLG9DQUFvQyxDQUFDO0FBQzNDLENBQUM7QUFFRDs7R0FFRztBQUNILFNBQVMseUJBQXlCO0lBQ2hDLE9BQU8saUVBQWlFO1FBQ3BFLGtEQUFrRCxDQUFDO0FBQ3pELENBQUM7QUFFRCxnQ0FBZ0M7QUFFaEM7Ozs7O0dBS0c7QUFDSCxTQUFTLGFBQWEsQ0FBQyxLQUFhO0lBQ2xDLE9BQU8sS0FBSyxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDLENBQUM7QUFDcEMsQ0FBQztBQUVEOzs7Ozs7R0FNRztBQUNILFNBQVMsT0FBTyxDQUFDLEtBQWtCLEVBQUUsU0FBUyxHQUFHLEVBQUU7SUFDakQsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQ1gsT0FBTyxFQUFFLENBQUM7SUFDWixDQUFDO0lBQ0QsS0FBSyxHQUFHLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUM3QixPQUFPLEtBQUssQ0FBQyxNQUFNLEdBQUcsU0FBUyxDQUFDLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLFNBQVMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUM7QUFDcEYsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1J1bnRpbWVFcnJvciwgUnVudGltZUVycm9yQ29kZX0gZnJvbSAnLi4vZXJyb3JzJztcbmltcG9ydCB7Z2V0RGVjbGFyYXRpb25Db21wb25lbnREZWZ9IGZyb20gJy4uL3JlbmRlcjMvaW5zdHJ1Y3Rpb25zL2VsZW1lbnRfdmFsaWRhdGlvbic7XG5pbXBvcnQge1ROb2RlLCBUTm9kZVR5cGV9IGZyb20gJy4uL3JlbmRlcjMvaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7Uk5vZGV9IGZyb20gJy4uL3JlbmRlcjMvaW50ZXJmYWNlcy9yZW5kZXJlcl9kb20nO1xuaW1wb3J0IHtMVmlldywgVFZJRVd9IGZyb20gJy4uL3JlbmRlcjMvaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7Z2V0UGFyZW50UkVsZW1lbnR9IGZyb20gJy4uL3JlbmRlcjMvbm9kZV9tYW5pcHVsYXRpb24nO1xuXG5jb25zdCBBVF9USElTX0xPQ0FUSU9OID0gJzwtLSBBVCBUSElTIExPQ0FUSU9OJztcblxuLyoqXG4gKiBSZXRyaWV2ZXMgYSB1c2VyIGZyaWVuZGx5IHN0cmluZyBmb3IgYSBnaXZlbiBUTm9kZVR5cGUgZm9yIHVzZSBpblxuICogZnJpZW5kbHkgZXJyb3IgbWVzc2FnZXNcbiAqXG4gKiBAcGFyYW0gdE5vZGVUeXBlXG4gKiBAcmV0dXJuc1xuICovXG5mdW5jdGlvbiBnZXRGcmllbmRseVN0cmluZ0Zyb21UTm9kZVR5cGUodE5vZGVUeXBlOiBUTm9kZVR5cGUpOiBzdHJpbmcge1xuICBzd2l0Y2ggKHROb2RlVHlwZSkge1xuICAgIGNhc2UgVE5vZGVUeXBlLkNvbnRhaW5lcjpcbiAgICAgIHJldHVybiAndmlldyBjb250YWluZXInO1xuICAgIGNhc2UgVE5vZGVUeXBlLkVsZW1lbnQ6XG4gICAgICByZXR1cm4gJ2VsZW1lbnQnO1xuICAgIGNhc2UgVE5vZGVUeXBlLkVsZW1lbnRDb250YWluZXI6XG4gICAgICByZXR1cm4gJ25nLWNvbnRhaW5lcic7XG4gICAgY2FzZSBUTm9kZVR5cGUuSWN1OlxuICAgICAgcmV0dXJuICdpY3UnO1xuICAgIGNhc2UgVE5vZGVUeXBlLlBsYWNlaG9sZGVyOlxuICAgICAgcmV0dXJuICdpMThuJztcbiAgICBjYXNlIFROb2RlVHlwZS5Qcm9qZWN0aW9uOlxuICAgICAgcmV0dXJuICdwcm9qZWN0aW9uJztcbiAgICBjYXNlIFROb2RlVHlwZS5UZXh0OlxuICAgICAgcmV0dXJuICd0ZXh0JztcbiAgICBkZWZhdWx0OlxuICAgICAgLy8gVGhpcyBzaG91bGQgbm90IGhhcHBlbiBhcyB3ZSBjb3ZlciBhbGwgcG9zc2libGUgVE5vZGUgdHlwZXMgYWJvdmUuXG4gICAgICByZXR1cm4gJzx1bmtub3duPic7XG4gIH1cbn1cblxuLyoqXG4gKiBWYWxpZGF0ZXMgdGhhdCBwcm92aWRlZCBub2RlcyBtYXRjaCBkdXJpbmcgdGhlIGh5ZHJhdGlvbiBwcm9jZXNzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gdmFsaWRhdGVNYXRjaGluZ05vZGUoXG4gICAgbm9kZTogUk5vZGUsIG5vZGVUeXBlOiBudW1iZXIsIHRhZ05hbWU6IHN0cmluZ3xudWxsLCBsVmlldzogTFZpZXcsIHROb2RlOiBUTm9kZSxcbiAgICBpc1ZpZXdDb250YWluZXJBbmNob3IgPSBmYWxzZSk6IHZvaWQge1xuICBpZiAoIW5vZGUgfHxcbiAgICAgICgobm9kZSBhcyBOb2RlKS5ub2RlVHlwZSAhPT0gbm9kZVR5cGUgfHxcbiAgICAgICAoKG5vZGUgYXMgTm9kZSkubm9kZVR5cGUgPT09IE5vZGUuRUxFTUVOVF9OT0RFICYmXG4gICAgICAgIChub2RlIGFzIEhUTUxFbGVtZW50KS50YWdOYW1lLnRvTG93ZXJDYXNlKCkgIT09IHRhZ05hbWU/LnRvTG93ZXJDYXNlKCkpKSkge1xuICAgIGNvbnN0IGV4cGVjdGVkTm9kZSA9IHNob3J0Uk5vZGVEZXNjcmlwdGlvbihub2RlVHlwZSwgdGFnTmFtZSwgbnVsbCk7XG4gICAgbGV0IGhlYWRlciA9IGBEdXJpbmcgaHlkcmF0aW9uIEFuZ3VsYXIgZXhwZWN0ZWQgJHtleHBlY3RlZE5vZGV9IGJ1dCBgO1xuXG4gICAgY29uc3QgaG9zdENvbXBvbmVudERlZiA9IGdldERlY2xhcmF0aW9uQ29tcG9uZW50RGVmKGxWaWV3KTtcbiAgICBjb25zdCBjb21wb25lbnRDbGFzc05hbWUgPSBob3N0Q29tcG9uZW50RGVmPy50eXBlPy5uYW1lO1xuXG4gICAgY29uc3QgZXhwZWN0ZWQgPSBgQW5ndWxhciBleHBlY3RlZCB0aGlzIERPTTpcXG5cXG4ke1xuICAgICAgICBkZXNjcmliZUV4cGVjdGVkRG9tKGxWaWV3LCB0Tm9kZSwgaXNWaWV3Q29udGFpbmVyQW5jaG9yKX1cXG5cXG5gO1xuXG4gICAgbGV0IGFjdHVhbCA9ICcnO1xuXG4gICAgaWYgKCFub2RlKSB7XG4gICAgICAvLyBObyBub2RlIGZvdW5kIGR1cmluZyBoeWRyYXRpb24uXG4gICAgICBoZWFkZXIgKz0gYHRoZSBub2RlIHdhcyBub3QgZm91bmQuXFxuXFxuYDtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgYWN0dWFsTm9kZSA9IHNob3J0Uk5vZGVEZXNjcmlwdGlvbihcbiAgICAgICAgICAobm9kZSBhcyBOb2RlKS5ub2RlVHlwZSwgKG5vZGUgYXMgSFRNTEVsZW1lbnQpLnRhZ05hbWUgPz8gbnVsbCxcbiAgICAgICAgICAobm9kZSBhcyBIVE1MRWxlbWVudCkudGV4dENvbnRlbnQgPz8gbnVsbCk7XG5cbiAgICAgIGhlYWRlciArPSBgZm91bmQgJHthY3R1YWxOb2RlfS5cXG5cXG5gO1xuICAgICAgYWN0dWFsID0gYEFjdHVhbCBET00gaXM6XFxuXFxuJHtkZXNjcmliZURvbUZyb21Ob2RlKG5vZGUpfVxcblxcbmA7XG4gICAgfVxuXG4gICAgY29uc3QgZm9vdGVyID0gZ2V0SHlkcmF0aW9uRXJyb3JGb290ZXIoY29tcG9uZW50Q2xhc3NOYW1lKTtcbiAgICBjb25zdCBtZXNzYWdlID0gaGVhZGVyICsgZXhwZWN0ZWQgKyBhY3R1YWwgKyBnZXRIeWRyYXRpb25BdHRyaWJ1dGVOb3RlKCkgKyBmb290ZXI7XG4gICAgdGhyb3cgbmV3IFJ1bnRpbWVFcnJvcihSdW50aW1lRXJyb3JDb2RlLkhZRFJBVElPTl9OT0RFX01JU01BVENILCBtZXNzYWdlKTtcbiAgfVxufVxuXG4vKipcbiAqIFZhbGlkYXRlcyB0aGF0IGEgZ2l2ZW4gbm9kZSBoYXMgc2libGluZyBub2Rlc1xuICovXG5leHBvcnQgZnVuY3Rpb24gdmFsaWRhdGVTaWJsaW5nTm9kZUV4aXN0cyhub2RlOiBSTm9kZXxudWxsKTogdm9pZCB7XG4gIHZhbGlkYXRlTm9kZUV4aXN0cyhub2RlKTtcbiAgaWYgKCFub2RlIS5uZXh0U2libGluZykge1xuICAgIGNvbnN0IGhlYWRlciA9ICdEdXJpbmcgaHlkcmF0aW9uIEFuZ3VsYXIgZXhwZWN0ZWQgbW9yZSBzaWJsaW5nIG5vZGVzIHRvIGJlIHByZXNlbnQuXFxuXFxuJztcbiAgICBjb25zdCBhY3R1YWwgPSBgQWN0dWFsIERPTSBpczpcXG5cXG4ke2Rlc2NyaWJlRG9tRnJvbU5vZGUobm9kZSEpfVxcblxcbmA7XG4gICAgY29uc3QgZm9vdGVyID0gZ2V0SHlkcmF0aW9uRXJyb3JGb290ZXIoKTtcblxuICAgIGNvbnN0IG1lc3NhZ2UgPSBoZWFkZXIgKyBhY3R1YWwgKyBmb290ZXI7XG4gICAgdGhyb3cgbmV3IFJ1bnRpbWVFcnJvcihSdW50aW1lRXJyb3JDb2RlLkhZRFJBVElPTl9NSVNTSU5HX1NJQkxJTkdTLCBtZXNzYWdlKTtcbiAgfVxufVxuXG4vKipcbiAqIFZhbGlkYXRlcyB0aGF0IGEgbm9kZSBleGlzdHMgb3IgdGhyb3dzXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB2YWxpZGF0ZU5vZGVFeGlzdHMoXG4gICAgbm9kZTogUk5vZGV8bnVsbCwgbFZpZXc6IExWaWV3fG51bGwgPSBudWxsLCB0Tm9kZTogVE5vZGV8bnVsbCA9IG51bGwpOiB2b2lkIHtcbiAgaWYgKCFub2RlKSB7XG4gICAgY29uc3QgaGVhZGVyID1cbiAgICAgICAgJ0R1cmluZyBoeWRyYXRpb24sIEFuZ3VsYXIgZXhwZWN0ZWQgYW4gZWxlbWVudCB0byBiZSBwcmVzZW50IGF0IHRoaXMgbG9jYXRpb24uXFxuXFxuJztcbiAgICBsZXQgZXhwZWN0ZWQgPSAnJztcbiAgICBsZXQgZm9vdGVyID0gJyc7XG4gICAgaWYgKGxWaWV3ICE9PSBudWxsICYmIHROb2RlICE9PSBudWxsKSB7XG4gICAgICBleHBlY3RlZCA9IGAke2Rlc2NyaWJlRXhwZWN0ZWREb20obFZpZXcsIHROb2RlLCBmYWxzZSl9XFxuXFxuYDtcbiAgICAgIGZvb3RlciA9IGdldEh5ZHJhdGlvbkVycm9yRm9vdGVyKCk7XG4gICAgfVxuICAgIHRocm93IG5ldyBSdW50aW1lRXJyb3IoUnVudGltZUVycm9yQ29kZS5IWURSQVRJT05fTUlTU0lOR19OT0RFLCBoZWFkZXIgKyBleHBlY3RlZCArIGZvb3Rlcik7XG4gIH1cbn1cblxuLyoqXG4gKiBCdWlsZHMgdGhlIGh5ZHJhdGlvbiBlcnJvciBtZXNzYWdlIHdoZW4gYSBub2RlIGlzIG5vdCBmb3VuZFxuICpcbiAqIEBwYXJhbSBsVmlldyB0aGUgTFZpZXcgd2hlcmUgdGhlIG5vZGUgZXhpc3RzXG4gKiBAcGFyYW0gdE5vZGUgdGhlIFROb2RlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBub2RlTm90Rm91bmRFcnJvcihsVmlldzogTFZpZXcsIHROb2RlOiBUTm9kZSk6IEVycm9yIHtcbiAgY29uc3QgaGVhZGVyID0gJ0R1cmluZyBzZXJpYWxpemF0aW9uLCBBbmd1bGFyIHdhcyB1bmFibGUgdG8gZmluZCBhbiBlbGVtZW50IGluIHRoZSBET006XFxuXFxuJztcbiAgY29uc3QgZXhwZWN0ZWQgPSBgJHtkZXNjcmliZUV4cGVjdGVkRG9tKGxWaWV3LCB0Tm9kZSwgZmFsc2UpfVxcblxcbmA7XG4gIGNvbnN0IGZvb3RlciA9IGdldEh5ZHJhdGlvbkVycm9yRm9vdGVyKCk7XG5cbiAgdGhyb3cgbmV3IFJ1bnRpbWVFcnJvcihSdW50aW1lRXJyb3JDb2RlLkhZRFJBVElPTl9NSVNTSU5HX05PREUsIGhlYWRlciArIGV4cGVjdGVkICsgZm9vdGVyKTtcbn1cblxuLyoqXG4gKiBCdWlsZHMgYSBoeWRyYXRpb24gZXJyb3IgbWVzc2FnZSB3aGVuIGEgbm9kZSBpcyBub3QgZm91bmQgYXQgYSBwYXRoIGxvY2F0aW9uXG4gKlxuICogQHBhcmFtIGhvc3QgdGhlIEhvc3QgTm9kZVxuICogQHBhcmFtIHBhdGggdGhlIHBhdGggdG8gdGhlIG5vZGVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG5vZGVOb3RGb3VuZEF0UGF0aEVycm9yKGhvc3Q6IE5vZGUsIHBhdGg6IHN0cmluZyk6IEVycm9yIHtcbiAgY29uc3QgaGVhZGVyID0gYER1cmluZyBoeWRyYXRpb24gQW5ndWxhciB3YXMgdW5hYmxlIHRvIGxvY2F0ZSBhIG5vZGUgYCArXG4gICAgICBgdXNpbmcgdGhlIFwiJHtwYXRofVwiIHBhdGgsIHN0YXJ0aW5nIGZyb20gdGhlICR7ZGVzY3JpYmVSTm9kZShob3N0KX0gbm9kZS5cXG5cXG5gO1xuICBjb25zdCBmb290ZXIgPSBnZXRIeWRyYXRpb25FcnJvckZvb3RlcigpO1xuXG4gIHRocm93IG5ldyBSdW50aW1lRXJyb3IoUnVudGltZUVycm9yQ29kZS5IWURSQVRJT05fTUlTU0lOR19OT0RFLCBoZWFkZXIgKyBmb290ZXIpO1xufVxuXG5cbi8qKlxuICogQnVpbGRzIHRoZSBoeWRyYXRpb24gZXJyb3IgbWVzc2FnZSBpbiB0aGUgY2FzZSB0aGF0IGRvbSBub2RlcyBhcmUgY3JlYXRlZCBvdXRzaWRlIG9mXG4gKiB0aGUgQW5ndWxhciBjb250ZXh0IGFuZCBhcmUgYmVpbmcgdXNlZCBhcyBwcm9qZWN0ZWQgbm9kZXNcbiAqXG4gKiBAcGFyYW0gbFZpZXcgdGhlIExWaWV3XG4gKiBAcGFyYW0gdE5vZGUgdGhlIFROb2RlXG4gKiBAcmV0dXJucyBhbiBlcnJvclxuICovXG5leHBvcnQgZnVuY3Rpb24gdW5zdXBwb3J0ZWRQcm9qZWN0aW9uT2ZEb21Ob2RlcyhyTm9kZTogUk5vZGUpOiBFcnJvciB7XG4gIGNvbnN0IGhlYWRlciA9ICdEdXJpbmcgc2VyaWFsaXphdGlvbiwgQW5ndWxhciBkZXRlY3RlZCBET00gbm9kZXMgJyArXG4gICAgICAndGhhdCB3ZXJlIGNyZWF0ZWQgb3V0c2lkZSBvZiBBbmd1bGFyIGNvbnRleHQgYW5kIHByb3ZpZGVkIGFzIHByb2plY3RhYmxlIG5vZGVzICcgK1xuICAgICAgJyhsaWtlbHkgdmlhIGBWaWV3Q29udGFpbmVyUmVmLmNyZWF0ZUNvbXBvbmVudGAgb3IgYGNyZWF0ZUNvbXBvbmVudGAgQVBJcykuICcgK1xuICAgICAgJ0h5ZHJhdGlvbiBpcyBub3Qgc3VwcG9ydGVkIGZvciBzdWNoIGNhc2VzLCBjb25zaWRlciByZWZhY3RvcmluZyB0aGUgY29kZSB0byBhdm9pZCAnICtcbiAgICAgICd0aGlzIHBhdHRlcm4gb3IgdXNpbmcgYG5nU2tpcEh5ZHJhdGlvbmAgb24gdGhlIGhvc3QgZWxlbWVudCBvZiB0aGUgY29tcG9uZW50Llxcblxcbic7XG4gIGNvbnN0IGFjdHVhbCA9IGAke2Rlc2NyaWJlRG9tRnJvbU5vZGUock5vZGUpfVxcblxcbmA7XG4gIGNvbnN0IG1lc3NhZ2UgPSBoZWFkZXIgKyBhY3R1YWwgKyBnZXRIeWRyYXRpb25BdHRyaWJ1dGVOb3RlKCk7XG4gIHJldHVybiBuZXcgUnVudGltZUVycm9yKFJ1bnRpbWVFcnJvckNvZGUuVU5TVVBQT1JURURfUFJPSkVDVElPTl9ET01fTk9ERVMsIG1lc3NhZ2UpO1xufVxuXG4vKipcbiAqIEJ1aWxkcyB0aGUgaHlkcmF0aW9uIGVycm9yIG1lc3NhZ2UgaW4gdGhlIGNhc2UgdGhhdCBuZ1NraXBIeWRyYXRpb24gd2FzIHVzZWQgb24gYVxuICogbm9kZSB0aGF0IGlzIG5vdCBhIGNvbXBvbmVudCBob3N0IGVsZW1lbnQgb3IgaG9zdCBiaW5kaW5nXG4gKlxuICogQHBhcmFtIHJOb2RlIHRoZSBIVE1MIEVsZW1lbnRcbiAqIEByZXR1cm5zIGFuIGVycm9yXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbnZhbGlkU2tpcEh5ZHJhdGlvbkhvc3Qock5vZGU6IFJOb2RlKTogRXJyb3Ige1xuICBjb25zdCBoZWFkZXIgPSAnVGhlIGBuZ1NraXBIeWRyYXRpb25gIGZsYWcgaXMgYXBwbGllZCBvbiBhIG5vZGUgJyArXG4gICAgICAndGhhdCBkb2VzblxcJ3QgYWN0IGFzIGEgY29tcG9uZW50IGhvc3QuIEh5ZHJhdGlvbiBjYW4gYmUgJyArXG4gICAgICAnc2tpcHBlZCBvbmx5IG9uIHBlci1jb21wb25lbnQgYmFzaXMuXFxuXFxuJztcbiAgY29uc3QgYWN0dWFsID0gYCR7ZGVzY3JpYmVEb21Gcm9tTm9kZShyTm9kZSl9XFxuXFxuYDtcbiAgY29uc3QgZm9vdGVyID0gJ1BsZWFzZSBtb3ZlIHRoZSBgbmdTa2lwSHlkcmF0aW9uYCBhdHRyaWJ1dGUgdG8gdGhlIGNvbXBvbmVudCBob3N0IGVsZW1lbnQuXFxuXFxuJztcbiAgY29uc3QgbWVzc2FnZSA9IGhlYWRlciArIGFjdHVhbCArIGZvb3RlcjtcbiAgcmV0dXJuIG5ldyBSdW50aW1lRXJyb3IoUnVudGltZUVycm9yQ29kZS5JTlZBTElEX1NLSVBfSFlEUkFUSU9OX0hPU1QsIG1lc3NhZ2UpO1xufVxuXG4vLyBTdHJpbmdpZmljYXRpb24gbWV0aG9kc1xuXG4vKipcbiAqIFN0cmluZ2lmaWVzIGEgZ2l2ZW4gVE5vZGUncyBhdHRyaWJ1dGVzXG4gKlxuICogQHBhcmFtIHROb2RlIGEgcHJvdmlkZWQgVE5vZGVcbiAqIEByZXR1cm5zIHN0cmluZ1xuICovXG5mdW5jdGlvbiBzdHJpbmdpZnlUTm9kZUF0dHJzKHROb2RlOiBUTm9kZSk6IHN0cmluZyB7XG4gIGNvbnN0IHJlc3VsdHMgPSBbXTtcbiAgaWYgKHROb2RlLmF0dHJzKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0Tm9kZS5hdHRycy5sZW5ndGg7KSB7XG4gICAgICBjb25zdCBhdHRyTmFtZSA9IHROb2RlLmF0dHJzW2krK107XG4gICAgICAvLyBPbmNlIHdlIHJlYWNoIHRoZSBmaXJzdCBmbGFnLCB3ZSBrbm93IHRoYXQgdGhlIGxpc3Qgb2ZcbiAgICAgIC8vIGF0dHJpYnV0ZXMgaXMgb3Zlci5cbiAgICAgIGlmICh0eXBlb2YgYXR0ck5hbWUgPT0gJ251bWJlcicpIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBjb25zdCBhdHRyVmFsdWUgPSB0Tm9kZS5hdHRyc1tpKytdO1xuICAgICAgcmVzdWx0cy5wdXNoKGAke2F0dHJOYW1lfT1cIiR7c2hvcnRlbihhdHRyVmFsdWUgYXMgc3RyaW5nKX1cImApO1xuICAgIH1cbiAgfVxuICByZXR1cm4gcmVzdWx0cy5qb2luKCcgJyk7XG59XG5cbi8qKlxuICogVGhlIGxpc3Qgb2YgaW50ZXJuYWwgYXR0cmlidXRlcyB0aGF0IHNob3VsZCBiZSBmaWx0ZXJlZCBvdXQgd2hpbGVcbiAqIHByb2R1Y2luZyBhbiBlcnJvciBtZXNzYWdlLlxuICovXG5jb25zdCBpbnRlcm5hbEF0dHJzID0gbmV3IFNldChbJ25naCcsICduZy12ZXJzaW9uJywgJ25nLXNlcnZlci1jb250ZXh0J10pO1xuXG4vKipcbiAqIFN0cmluZ2lmaWVzIGFuIEhUTUwgRWxlbWVudCdzIGF0dHJpYnV0ZXNcbiAqXG4gKiBAcGFyYW0gck5vZGUgYW4gSFRNTCBFbGVtZW50XG4gKiBAcmV0dXJucyBzdHJpbmdcbiAqL1xuZnVuY3Rpb24gc3RyaW5naWZ5Uk5vZGVBdHRycyhyTm9kZTogSFRNTEVsZW1lbnQpOiBzdHJpbmcge1xuICBjb25zdCByZXN1bHRzID0gW107XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgck5vZGUuYXR0cmlidXRlcy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IGF0dHIgPSByTm9kZS5hdHRyaWJ1dGVzW2ldO1xuICAgIGlmIChpbnRlcm5hbEF0dHJzLmhhcyhhdHRyLm5hbWUpKSBjb250aW51ZTtcbiAgICByZXN1bHRzLnB1c2goYCR7YXR0ci5uYW1lfT1cIiR7c2hvcnRlbihhdHRyLnZhbHVlKX1cImApO1xuICB9XG4gIHJldHVybiByZXN1bHRzLmpvaW4oJyAnKTtcbn1cblxuLy8gTWV0aG9kcyBmb3IgRGVzY3JpYmluZyB0aGUgRE9NXG5cbi8qKlxuICogQ29udmVydHMgYSB0Tm9kZSB0byBhIGhlbHBmdWwgcmVhZGFibGUgc3RyaW5nIHZhbHVlIGZvciB1c2UgaW4gZXJyb3IgbWVzc2FnZXNcbiAqXG4gKiBAcGFyYW0gdE5vZGUgYSBnaXZlbiBUTm9kZVxuICogQHBhcmFtIGlubmVyQ29udGVudCB0aGUgY29udGVudCBvZiB0aGUgbm9kZVxuICogQHJldHVybnMgc3RyaW5nXG4gKi9cbmZ1bmN0aW9uIGRlc2NyaWJlVE5vZGUodE5vZGU6IFROb2RlLCBpbm5lckNvbnRlbnQ6IHN0cmluZyA9ICfigKYnKTogc3RyaW5nIHtcbiAgc3dpdGNoICh0Tm9kZS50eXBlKSB7XG4gICAgY2FzZSBUTm9kZVR5cGUuVGV4dDpcbiAgICAgIGNvbnN0IGNvbnRlbnQgPSB0Tm9kZS52YWx1ZSA/IGAoJHt0Tm9kZS52YWx1ZX0pYCA6ICcnO1xuICAgICAgcmV0dXJuIGAjdGV4dCR7Y29udGVudH1gO1xuICAgIGNhc2UgVE5vZGVUeXBlLkVsZW1lbnQ6XG4gICAgICBjb25zdCBhdHRycyA9IHN0cmluZ2lmeVROb2RlQXR0cnModE5vZGUpO1xuICAgICAgY29uc3QgdGFnID0gdE5vZGUudmFsdWUudG9Mb3dlckNhc2UoKTtcbiAgICAgIHJldHVybiBgPCR7dGFnfSR7YXR0cnMgPyAnICcgKyBhdHRycyA6ICcnfT4ke2lubmVyQ29udGVudH08LyR7dGFnfT5gO1xuICAgIGNhc2UgVE5vZGVUeXBlLkVsZW1lbnRDb250YWluZXI6XG4gICAgICByZXR1cm4gJzwhLS0gbmctY29udGFpbmVyIC0tPic7XG4gICAgY2FzZSBUTm9kZVR5cGUuQ29udGFpbmVyOlxuICAgICAgcmV0dXJuICc8IS0tIGNvbnRhaW5lciAtLT4nO1xuICAgIGRlZmF1bHQ6XG4gICAgICBjb25zdCB0eXBlQXNTdHJpbmcgPSBnZXRGcmllbmRseVN0cmluZ0Zyb21UTm9kZVR5cGUodE5vZGUudHlwZSk7XG4gICAgICByZXR1cm4gYCNub2RlKCR7dHlwZUFzU3RyaW5nfSlgO1xuICB9XG59XG5cbi8qKlxuICogQ29udmVydHMgYW4gUk5vZGUgdG8gYSBoZWxwZnVsIHJlYWRhYmxlIHN0cmluZyB2YWx1ZSBmb3IgdXNlIGluIGVycm9yIG1lc3NhZ2VzXG4gKlxuICogQHBhcmFtIHJOb2RlIGEgZ2l2ZW4gUk5vZGVcbiAqIEBwYXJhbSBpbm5lckNvbnRlbnQgdGhlIGNvbnRlbnQgb2YgdGhlIG5vZGVcbiAqIEByZXR1cm5zIHN0cmluZ1xuICovXG5mdW5jdGlvbiBkZXNjcmliZVJOb2RlKHJOb2RlOiBSTm9kZSwgaW5uZXJDb250ZW50OiBzdHJpbmcgPSAn4oCmJyk6IHN0cmluZyB7XG4gIGNvbnN0IG5vZGUgPSByTm9kZSBhcyBIVE1MRWxlbWVudDtcbiAgc3dpdGNoIChub2RlLm5vZGVUeXBlKSB7XG4gICAgY2FzZSBOb2RlLkVMRU1FTlRfTk9ERTpcbiAgICAgIGNvbnN0IHRhZyA9IG5vZGUudGFnTmFtZSEudG9Mb3dlckNhc2UoKTtcbiAgICAgIGNvbnN0IGF0dHJzID0gc3RyaW5naWZ5Uk5vZGVBdHRycyhub2RlKTtcbiAgICAgIHJldHVybiBgPCR7dGFnfSR7YXR0cnMgPyAnICcgKyBhdHRycyA6ICcnfT4ke2lubmVyQ29udGVudH08LyR7dGFnfT5gO1xuICAgIGNhc2UgTm9kZS5URVhUX05PREU6XG4gICAgICBjb25zdCBjb250ZW50ID0gbm9kZS50ZXh0Q29udGVudCA/IHNob3J0ZW4obm9kZS50ZXh0Q29udGVudCkgOiAnJztcbiAgICAgIHJldHVybiBgI3RleHQke2NvbnRlbnQgPyBgKCR7Y29udGVudH0pYCA6ICcnfWA7XG4gICAgY2FzZSBOb2RlLkNPTU1FTlRfTk9ERTpcbiAgICAgIHJldHVybiBgPCEtLSAke3Nob3J0ZW4obm9kZS50ZXh0Q29udGVudCA/PyAnJyl9IC0tPmA7XG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiBgI25vZGUoJHtub2RlLm5vZGVUeXBlfSlgO1xuICB9XG59XG5cbi8qKlxuICogQnVpbGRzIHRoZSBzdHJpbmcgY29udGFpbmluZyB0aGUgZXhwZWN0ZWQgRE9NIHByZXNlbnQgZ2l2ZW4gdGhlIExWaWV3IGFuZCBUTm9kZVxuICogdmFsdWVzIGZvciBhIHJlYWRhYmxlIGVycm9yIG1lc3NhZ2VcbiAqXG4gKiBAcGFyYW0gbFZpZXcgdGhlIGxWaWV3IGNvbnRhaW5pbmcgdGhlIERPTVxuICogQHBhcmFtIHROb2RlIHRoZSB0Tm9kZVxuICogQHBhcmFtIGlzVmlld0NvbnRhaW5lckFuY2hvciBib29sZWFuXG4gKiBAcmV0dXJucyBzdHJpbmdcbiAqL1xuZnVuY3Rpb24gZGVzY3JpYmVFeHBlY3RlZERvbShsVmlldzogTFZpZXcsIHROb2RlOiBUTm9kZSwgaXNWaWV3Q29udGFpbmVyQW5jaG9yOiBib29sZWFuKTogc3RyaW5nIHtcbiAgY29uc3Qgc3BhY2VyID0gJyAgJztcbiAgbGV0IGNvbnRlbnQgPSAnJztcbiAgaWYgKHROb2RlLnByZXYpIHtcbiAgICBjb250ZW50ICs9IHNwYWNlciArICfigKZcXG4nO1xuICAgIGNvbnRlbnQgKz0gc3BhY2VyICsgZGVzY3JpYmVUTm9kZSh0Tm9kZS5wcmV2KSArICdcXG4nO1xuICB9IGVsc2UgaWYgKHROb2RlLnR5cGUgJiYgdE5vZGUudHlwZSAmIFROb2RlVHlwZS5BbnlDb250YWluZXIpIHtcbiAgICBjb250ZW50ICs9IHNwYWNlciArICfigKZcXG4nO1xuICB9XG4gIGlmIChpc1ZpZXdDb250YWluZXJBbmNob3IpIHtcbiAgICBjb250ZW50ICs9IHNwYWNlciArIGRlc2NyaWJlVE5vZGUodE5vZGUpICsgJ1xcbic7XG4gICAgY29udGVudCArPSBzcGFjZXIgKyBgPCEtLSBjb250YWluZXIgLS0+ICAke0FUX1RISVNfTE9DQVRJT059XFxuYDtcbiAgfSBlbHNlIHtcbiAgICBjb250ZW50ICs9IHNwYWNlciArIGRlc2NyaWJlVE5vZGUodE5vZGUpICsgYCAgJHtBVF9USElTX0xPQ0FUSU9OfVxcbmA7XG4gIH1cbiAgY29udGVudCArPSBzcGFjZXIgKyAn4oCmXFxuJztcblxuICBjb25zdCBwYXJlbnRSTm9kZSA9IHROb2RlLnR5cGUgPyBnZXRQYXJlbnRSRWxlbWVudChsVmlld1tUVklFV10sIHROb2RlLCBsVmlldykgOiBudWxsO1xuICBpZiAocGFyZW50Uk5vZGUpIHtcbiAgICBjb250ZW50ID0gZGVzY3JpYmVSTm9kZShwYXJlbnRSTm9kZSBhcyB1bmtub3duIGFzIE5vZGUsICdcXG4nICsgY29udGVudCk7XG4gIH1cbiAgcmV0dXJuIGNvbnRlbnQ7XG59XG5cbi8qKlxuICogQnVpbGRzIHRoZSBzdHJpbmcgY29udGFpbmluZyB0aGUgRE9NIHByZXNlbnQgYXJvdW5kIGEgZ2l2ZW4gUk5vZGUgZm9yIGFcbiAqIHJlYWRhYmxlIGVycm9yIG1lc3NhZ2VcbiAqXG4gKiBAcGFyYW0gbm9kZSB0aGUgUk5vZGVcbiAqIEByZXR1cm5zIHN0cmluZ1xuICovXG5mdW5jdGlvbiBkZXNjcmliZURvbUZyb21Ob2RlKG5vZGU6IFJOb2RlKTogc3RyaW5nIHtcbiAgY29uc3Qgc3BhY2VyID0gJyAgJztcbiAgbGV0IGNvbnRlbnQgPSAnJztcbiAgY29uc3QgY3VycmVudE5vZGUgPSBub2RlIGFzIEhUTUxFbGVtZW50O1xuICBpZiAoY3VycmVudE5vZGUucHJldmlvdXNTaWJsaW5nKSB7XG4gICAgY29udGVudCArPSBzcGFjZXIgKyAn4oCmXFxuJztcbiAgICBjb250ZW50ICs9IHNwYWNlciArIGRlc2NyaWJlUk5vZGUoY3VycmVudE5vZGUucHJldmlvdXNTaWJsaW5nKSArICdcXG4nO1xuICB9XG4gIGNvbnRlbnQgKz0gc3BhY2VyICsgZGVzY3JpYmVSTm9kZShjdXJyZW50Tm9kZSkgKyBgICAke0FUX1RISVNfTE9DQVRJT059XFxuYDtcbiAgaWYgKG5vZGUubmV4dFNpYmxpbmcpIHtcbiAgICBjb250ZW50ICs9IHNwYWNlciArICfigKZcXG4nO1xuICB9XG4gIGlmIChub2RlLnBhcmVudE5vZGUpIHtcbiAgICBjb250ZW50ID0gZGVzY3JpYmVSTm9kZShjdXJyZW50Tm9kZS5wYXJlbnROb2RlIGFzIE5vZGUsICdcXG4nICsgY29udGVudCk7XG4gIH1cbiAgcmV0dXJuIGNvbnRlbnQ7XG59XG5cbi8qKlxuICogU2hvcnRlbnMgdGhlIGRlc2NyaXB0aW9uIG9mIGEgZ2l2ZW4gUk5vZGUgYnkgaXRzIHR5cGUgZm9yIHJlYWRhYmlsaXR5XG4gKlxuICogQHBhcmFtIG5vZGVUeXBlIHRoZSB0eXBlIG9mIG5vZGVcbiAqIEBwYXJhbSB0YWdOYW1lIHRoZSBub2RlIHRhZyBuYW1lXG4gKiBAcGFyYW0gdGV4dENvbnRlbnQgdGhlIHRleHQgY29udGVudCBpbiB0aGUgbm9kZVxuICogQHJldHVybnMgc3RyaW5nXG4gKi9cbmZ1bmN0aW9uIHNob3J0Uk5vZGVEZXNjcmlwdGlvbihcbiAgICBub2RlVHlwZTogbnVtYmVyLCB0YWdOYW1lOiBzdHJpbmd8bnVsbCwgdGV4dENvbnRlbnQ6IHN0cmluZ3xudWxsKTogc3RyaW5nIHtcbiAgc3dpdGNoIChub2RlVHlwZSkge1xuICAgIGNhc2UgTm9kZS5FTEVNRU5UX05PREU6XG4gICAgICByZXR1cm4gYDwke3RhZ05hbWUhLnRvTG93ZXJDYXNlKCl9PmA7XG4gICAgY2FzZSBOb2RlLlRFWFRfTk9ERTpcbiAgICAgIGNvbnN0IGNvbnRlbnQgPSB0ZXh0Q29udGVudCA/IGAgKHdpdGggdGhlIFwiJHtzaG9ydGVuKHRleHRDb250ZW50KX1cIiBjb250ZW50KWAgOiAnJztcbiAgICAgIHJldHVybiBgYSB0ZXh0IG5vZGUke2NvbnRlbnR9YDtcbiAgICBjYXNlIE5vZGUuQ09NTUVOVF9OT0RFOlxuICAgICAgcmV0dXJuICdhIGNvbW1lbnQgbm9kZSc7XG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiBgI25vZGUobm9kZVR5cGU9JHtub2RlVHlwZX0pYDtcbiAgfVxufVxuXG5cbi8qKlxuICogQnVpbGRzIHRoZSBmb290ZXIgaHlkcmF0aW9uIGVycm9yIG1lc3NhZ2VcbiAqXG4gKiBAcGFyYW0gY29tcG9uZW50Q2xhc3NOYW1lIHRoZSBuYW1lIG9mIHRoZSBjb21wb25lbnQgY2xhc3NcbiAqIEByZXR1cm5zIHN0cmluZ1xuICovXG5mdW5jdGlvbiBnZXRIeWRyYXRpb25FcnJvckZvb3Rlcihjb21wb25lbnRDbGFzc05hbWU/OiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCBjb21wb25lbnRJbmZvID0gY29tcG9uZW50Q2xhc3NOYW1lID8gYHRoZSBcIiR7Y29tcG9uZW50Q2xhc3NOYW1lfVwiYCA6ICdjb3JyZXNwb25kaW5nJztcbiAgcmV0dXJuIGBUbyBmaXggdGhpcyBwcm9ibGVtOlxcbmAgK1xuICAgICAgYCAgKiBjaGVjayAke2NvbXBvbmVudEluZm99IGNvbXBvbmVudCBmb3IgaHlkcmF0aW9uLXJlbGF0ZWQgaXNzdWVzXFxuYCArXG4gICAgICBgICAqIGNoZWNrIHRvIHNlZSBpZiB5b3VyIHRlbXBsYXRlIGhhcyB2YWxpZCBIVE1MIHN0cnVjdHVyZVxcbmAgK1xuICAgICAgYCAgKiBvciBza2lwIGh5ZHJhdGlvbiBieSBhZGRpbmcgdGhlIFxcYG5nU2tpcEh5ZHJhdGlvblxcYCBhdHRyaWJ1dGUgYCArXG4gICAgICBgdG8gaXRzIGhvc3Qgbm9kZSBpbiBhIHRlbXBsYXRlXFxuXFxuYDtcbn1cblxuLyoqXG4gKiBBbiBhdHRyaWJ1dGUgcmVsYXRlZCBub3RlIGZvciBoeWRyYXRpb24gZXJyb3JzXG4gKi9cbmZ1bmN0aW9uIGdldEh5ZHJhdGlvbkF0dHJpYnV0ZU5vdGUoKTogc3RyaW5nIHtcbiAgcmV0dXJuICdOb3RlOiBhdHRyaWJ1dGVzIGFyZSBvbmx5IGRpc3BsYXllZCB0byBiZXR0ZXIgcmVwcmVzZW50IHRoZSBET00nICtcbiAgICAgICcgYnV0IGhhdmUgbm8gZWZmZWN0IG9uIGh5ZHJhdGlvbiBtaXNtYXRjaGVzLlxcblxcbic7XG59XG5cbi8vIE5vZGUgc3RyaW5nIHV0aWxpdHkgZnVuY3Rpb25zXG5cbi8qKlxuICogU3RyaXBzIGFsbCBuZXdsaW5lcyBvdXQgb2YgYSBnaXZlbiBzdHJpbmdcbiAqXG4gKiBAcGFyYW0gaW5wdXQgYSBzdHJpbmcgdG8gYmUgY2xlYXJlZCBvZiBuZXcgbGluZSBjaGFyYWN0ZXJzXG4gKiBAcmV0dXJuc1xuICovXG5mdW5jdGlvbiBzdHJpcE5ld2xpbmVzKGlucHV0OiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gaW5wdXQucmVwbGFjZSgvXFxzKy9nbSwgJycpO1xufVxuXG4vKipcbiAqIFJlZHVjZXMgYSBzdHJpbmcgZG93biB0byBhIG1heGltdW0gbGVuZ3RoIG9mIGNoYXJhY3RlcnMgd2l0aCBlbGxpcHNpcyBmb3IgcmVhZGFiaWxpdHlcbiAqXG4gKiBAcGFyYW0gaW5wdXQgYSBzdHJpbmcgaW5wdXRcbiAqIEBwYXJhbSBtYXhMZW5ndGggYSBtYXhpbXVtIGxlbmd0aCBpbiBjaGFyYWN0ZXJzXG4gKiBAcmV0dXJucyBzdHJpbmdcbiAqL1xuZnVuY3Rpb24gc2hvcnRlbihpbnB1dDogc3RyaW5nfG51bGwsIG1heExlbmd0aCA9IDUwKTogc3RyaW5nIHtcbiAgaWYgKCFpbnB1dCkge1xuICAgIHJldHVybiAnJztcbiAgfVxuICBpbnB1dCA9IHN0cmlwTmV3bGluZXMoaW5wdXQpO1xuICByZXR1cm4gaW5wdXQubGVuZ3RoID4gbWF4TGVuZ3RoID8gYCR7aW5wdXQuc3Vic3RyaW5nKDAsIG1heExlbmd0aCAtIDEpfeKApmAgOiBpbnB1dDtcbn1cbiJdfQ==