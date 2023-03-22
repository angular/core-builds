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
        throw new RuntimeError(500 /* RuntimeErrorCode.HYDRATION_NODE_MISMATCH */, message);
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
        throw new RuntimeError(501 /* RuntimeErrorCode.HYDRATION_MISSING_SIBLINGS */, message);
    }
}
/**
 * Validates that a node exists or throws
 */
export function validateNodeExists(node) {
    if (!node) {
        throw new RuntimeError(502 /* RuntimeErrorCode.HYDRATION_MISSING_NODE */, `Hydration expected an element to be present at this location.`);
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
    throw new RuntimeError(502 /* RuntimeErrorCode.HYDRATION_MISSING_NODE */, header + expected + footer);
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
    throw new RuntimeError(502 /* RuntimeErrorCode.HYDRATION_MISSING_NODE */, header + footer);
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
    return new RuntimeError(503 /* RuntimeErrorCode.UNSUPPORTED_PROJECTION_DOM_NODES */, message);
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
    const footer = 'Please move the `ngSkipHydration` attribute to the component host element.';
    const message = header + actual + footer;
    return new RuntimeError(504 /* RuntimeErrorCode.INVALID_SKIP_HYDRATION_HOST */, message);
}
/**
 * Builds the hydration error message in the case that a user is attempting to enable
 * hydration on internationalized nodes, which is not yet supported.
 *
 * @param rNode the HTML Element
 * @returns an error
 */
export function notYetSupportedI18nBlockError(rNode) {
    const header = 'Hydration for nodes marked with `i18n` is not yet supported. ' +
        'You can opt-out a component that uses `i18n` in a template using ' +
        'the `ngSkipHydration` attribute or fall back to the previous ' +
        'hydration logic (which re-creates the application structure).\n\n';
    const actual = `${describeDomFromNode(rNode)}\n\n`;
    const message = header + actual;
    return new RuntimeError(518 /* RuntimeErrorCode.HYDRATION_I18N_NOT_YET_SUPPORTED */, message);
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
        `to its host node in a template`;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXJyb3JfaGFuZGxpbmcuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9oeWRyYXRpb24vZXJyb3JfaGFuZGxpbmcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLFlBQVksRUFBbUIsTUFBTSxXQUFXLENBQUM7QUFDekQsT0FBTyxFQUFDLDBCQUEwQixFQUFDLE1BQU0sNENBQTRDLENBQUM7QUFHdEYsT0FBTyxFQUFRLEtBQUssRUFBQyxNQUFNLDRCQUE0QixDQUFDO0FBQ3hELE9BQU8sRUFBQyxpQkFBaUIsRUFBQyxNQUFNLDhCQUE4QixDQUFDO0FBRS9ELE1BQU0sZ0JBQWdCLEdBQUcsc0JBQXNCLENBQUM7QUFFaEQ7Ozs7OztHQU1HO0FBQ0gsU0FBUyw4QkFBOEIsQ0FBQyxTQUFvQjtJQUMxRCxRQUFRLFNBQVMsRUFBRTtRQUNqQjtZQUNFLE9BQU8sZ0JBQWdCLENBQUM7UUFDMUI7WUFDRSxPQUFPLFNBQVMsQ0FBQztRQUNuQjtZQUNFLE9BQU8sY0FBYyxDQUFDO1FBQ3hCO1lBQ0UsT0FBTyxLQUFLLENBQUM7UUFDZjtZQUNFLE9BQU8sTUFBTSxDQUFDO1FBQ2hCO1lBQ0UsT0FBTyxZQUFZLENBQUM7UUFDdEI7WUFDRSxPQUFPLE1BQU0sQ0FBQztRQUNoQjtZQUNFLHFFQUFxRTtZQUNyRSxPQUFPLFdBQVcsQ0FBQztLQUN0QjtBQUNILENBQUM7QUFFRDs7R0FFRztBQUNILE1BQU0sVUFBVSxvQkFBb0IsQ0FDaEMsSUFBVyxFQUFFLFFBQWdCLEVBQUUsT0FBb0IsRUFBRSxLQUFZLEVBQUUsS0FBWSxFQUMvRSxxQkFBcUIsR0FBRyxLQUFLO0lBQy9CLElBQUksQ0FBQyxJQUFJO1FBQ0wsQ0FBRSxJQUFhLENBQUMsUUFBUSxLQUFLLFFBQVE7WUFDcEMsQ0FBRSxJQUFhLENBQUMsUUFBUSxLQUFLLElBQUksQ0FBQyxZQUFZO2dC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QUFhLDJDQUEyQztRQUNyRSxvRUFBb0U7UUFDcEUsZ0NBQWdDLENBQUM7QUFDdkMsQ0FBQztBQUVEOztHQUVHO0FBQ0gsU0FBUyx5QkFBeUI7SUFDaEMsT0FBTyxpRUFBaUU7UUFDcEUsa0RBQWtELENBQUM7QUFDekQsQ0FBQztBQUVELGdDQUFnQztBQUVoQzs7Ozs7R0FLRztBQUNILFNBQVMsYUFBYSxDQUFDLEtBQWE7SUFDbEMsT0FBTyxLQUFLLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxFQUFFLENBQUMsQ0FBQztBQUNwQyxDQUFDO0FBRUQ7Ozs7OztHQU1HO0FBQ0gsU0FBUyxPQUFPLENBQUMsS0FBa0IsRUFBRSxTQUFTLEdBQUcsRUFBRTtJQUNqRCxJQUFJLENBQUMsS0FBSyxFQUFFO1FBQ1YsT0FBTyxFQUFFLENBQUM7S0FDWDtJQUNELEtBQUssR0FBRyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDN0IsT0FBTyxLQUFLLENBQUMsTUFBTSxHQUFHLFNBQVMsQ0FBQyxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxTQUFTLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDO0FBQ3BGLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtSdW50aW1lRXJyb3IsIFJ1bnRpbWVFcnJvckNvZGV9IGZyb20gJy4uL2Vycm9ycyc7XG5pbXBvcnQge2dldERlY2xhcmF0aW9uQ29tcG9uZW50RGVmfSBmcm9tICcuLi9yZW5kZXIzL2luc3RydWN0aW9ucy9lbGVtZW50X3ZhbGlkYXRpb24nO1xuaW1wb3J0IHtUTm9kZSwgVE5vZGVUeXBlfSBmcm9tICcuLi9yZW5kZXIzL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge1JOb2RlfSBmcm9tICcuLi9yZW5kZXIzL2ludGVyZmFjZXMvcmVuZGVyZXJfZG9tJztcbmltcG9ydCB7TFZpZXcsIFRWSUVXfSBmcm9tICcuLi9yZW5kZXIzL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2dldFBhcmVudFJFbGVtZW50fSBmcm9tICcuLi9yZW5kZXIzL25vZGVfbWFuaXB1bGF0aW9uJztcblxuY29uc3QgQVRfVEhJU19MT0NBVElPTiA9ICc8LS0gQVQgVEhJUyBMT0NBVElPTic7XG5cbi8qKlxuICogUmV0cmlldmVzIGEgdXNlciBmcmllbmRseSBzdHJpbmcgZm9yIGEgZ2l2ZW4gVE5vZGVUeXBlIGZvciB1c2UgaW5cbiAqIGZyaWVuZGx5IGVycm9yIG1lc3NhZ2VzXG4gKlxuICogQHBhcmFtIHROb2RlVHlwZVxuICogQHJldHVybnNcbiAqL1xuZnVuY3Rpb24gZ2V0RnJpZW5kbHlTdHJpbmdGcm9tVE5vZGVUeXBlKHROb2RlVHlwZTogVE5vZGVUeXBlKTogc3RyaW5nIHtcbiAgc3dpdGNoICh0Tm9kZVR5cGUpIHtcbiAgICBjYXNlIFROb2RlVHlwZS5Db250YWluZXI6XG4gICAgICByZXR1cm4gJ3ZpZXcgY29udGFpbmVyJztcbiAgICBjYXNlIFROb2RlVHlwZS5FbGVtZW50OlxuICAgICAgcmV0dXJuICdlbGVtZW50JztcbiAgICBjYXNlIFROb2RlVHlwZS5FbGVtZW50Q29udGFpbmVyOlxuICAgICAgcmV0dXJuICduZy1jb250YWluZXInO1xuICAgIGNhc2UgVE5vZGVUeXBlLkljdTpcbiAgICAgIHJldHVybiAnaWN1JztcbiAgICBjYXNlIFROb2RlVHlwZS5QbGFjZWhvbGRlcjpcbiAgICAgIHJldHVybiAnaTE4bic7XG4gICAgY2FzZSBUTm9kZVR5cGUuUHJvamVjdGlvbjpcbiAgICAgIHJldHVybiAncHJvamVjdGlvbic7XG4gICAgY2FzZSBUTm9kZVR5cGUuVGV4dDpcbiAgICAgIHJldHVybiAndGV4dCc7XG4gICAgZGVmYXVsdDpcbiAgICAgIC8vIFRoaXMgc2hvdWxkIG5vdCBoYXBwZW4gYXMgd2UgY292ZXIgYWxsIHBvc3NpYmxlIFROb2RlIHR5cGVzIGFib3ZlLlxuICAgICAgcmV0dXJuICc8dW5rbm93bj4nO1xuICB9XG59XG5cbi8qKlxuICogVmFsaWRhdGVzIHRoYXQgcHJvdmlkZWQgbm9kZXMgbWF0Y2ggZHVyaW5nIHRoZSBoeWRyYXRpb24gcHJvY2Vzcy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHZhbGlkYXRlTWF0Y2hpbmdOb2RlKFxuICAgIG5vZGU6IFJOb2RlLCBub2RlVHlwZTogbnVtYmVyLCB0YWdOYW1lOiBzdHJpbmd8bnVsbCwgbFZpZXc6IExWaWV3LCB0Tm9kZTogVE5vZGUsXG4gICAgaXNWaWV3Q29udGFpbmVyQW5jaG9yID0gZmFsc2UpOiB2b2lkIHtcbiAgaWYgKCFub2RlIHx8XG4gICAgICAoKG5vZGUgYXMgTm9kZSkubm9kZVR5cGUgIT09IG5vZGVUeXBlIHx8XG4gICAgICAgKChub2RlIGFzIE5vZGUpLm5vZGVUeXBlID09PSBOb2RlLkVMRU1FTlRfTk9ERSAmJlxuICAgICAgICAobm9kZSBhcyBIVE1MRWxlbWVudCkudGFnTmFtZS50b0xvd2VyQ2FzZSgpICE9PSB0YWdOYW1lPy50b0xvd2VyQ2FzZSgpKSkpIHtcbiAgICBjb25zdCBleHBlY3RlZE5vZGUgPSBzaG9ydFJOb2RlRGVzY3JpcHRpb24obm9kZVR5cGUsIHRhZ05hbWUsIG51bGwpO1xuICAgIGxldCBoZWFkZXIgPSBgRHVyaW5nIGh5ZHJhdGlvbiBBbmd1bGFyIGV4cGVjdGVkICR7ZXhwZWN0ZWROb2RlfSBidXQgYDtcblxuICAgIGNvbnN0IGhvc3RDb21wb25lbnREZWYgPSBnZXREZWNsYXJhdGlvbkNvbXBvbmVudERlZihsVmlldyk7XG4gICAgY29uc3QgY29tcG9uZW50Q2xhc3NOYW1lID0gaG9zdENvbXBvbmVudERlZj8udHlwZT8ubmFtZTtcblxuICAgIGNvbnN0IGV4cGVjdGVkID0gYEFuZ3VsYXIgZXhwZWN0ZWQgdGhpcyBET006XFxuXFxuJHtcbiAgICAgICAgZGVzY3JpYmVFeHBlY3RlZERvbShsVmlldywgdE5vZGUsIGlzVmlld0NvbnRhaW5lckFuY2hvcil9XFxuXFxuYDtcblxuICAgIGxldCBhY3R1YWwgPSAnJztcblxuICAgIGlmICghbm9kZSkge1xuICAgICAgLy8gTm8gbm9kZSBmb3VuZCBkdXJpbmcgaHlkcmF0aW9uLlxuICAgICAgaGVhZGVyICs9IGB0aGUgbm9kZSB3YXMgbm90IGZvdW5kLlxcblxcbmA7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IGFjdHVhbE5vZGUgPSBzaG9ydFJOb2RlRGVzY3JpcHRpb24oXG4gICAgICAgICAgKG5vZGUgYXMgTm9kZSkubm9kZVR5cGUsIChub2RlIGFzIEhUTUxFbGVtZW50KS50YWdOYW1lID8/IG51bGwsXG4gICAgICAgICAgKG5vZGUgYXMgSFRNTEVsZW1lbnQpLnRleHRDb250ZW50ID8/IG51bGwpO1xuXG4gICAgICBoZWFkZXIgKz0gYGZvdW5kICR7YWN0dWFsTm9kZX0uXFxuXFxuYDtcbiAgICAgIGFjdHVhbCA9IGBBY3R1YWwgRE9NIGlzOlxcblxcbiR7ZGVzY3JpYmVEb21Gcm9tTm9kZShub2RlKX1cXG5cXG5gO1xuICAgIH1cblxuICAgIGNvbnN0IGZvb3RlciA9IGdldEh5ZHJhdGlvbkVycm9yRm9vdGVyKGNvbXBvbmVudENsYXNzTmFtZSk7XG4gICAgY29uc3QgbWVzc2FnZSA9IGhlYWRlciArIGV4cGVjdGVkICsgYWN0dWFsICsgZ2V0SHlkcmF0aW9uQXR0cmlidXRlTm90ZSgpICsgZm9vdGVyO1xuICAgIHRocm93IG5ldyBSdW50aW1lRXJyb3IoUnVudGltZUVycm9yQ29kZS5IWURSQVRJT05fTk9ERV9NSVNNQVRDSCwgbWVzc2FnZSk7XG4gIH1cbn1cblxuLyoqXG4gKiBWYWxpZGF0ZXMgdGhhdCBhIGdpdmVuIG5vZGUgaGFzIHNpYmxpbmcgbm9kZXNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHZhbGlkYXRlU2libGluZ05vZGVFeGlzdHMobm9kZTogUk5vZGV8bnVsbCk6IHZvaWQge1xuICB2YWxpZGF0ZU5vZGVFeGlzdHMobm9kZSk7XG4gIGlmICghbm9kZSEubmV4dFNpYmxpbmcpIHtcbiAgICBjb25zdCBoZWFkZXIgPSAnRHVyaW5nIGh5ZHJhdGlvbiBBbmd1bGFyIGV4cGVjdGVkIG1vcmUgc2libGluZyBub2RlcyB0byBiZSBwcmVzZW50Llxcblxcbic7XG4gICAgY29uc3QgYWN0dWFsID0gYEFjdHVhbCBET00gaXM6XFxuXFxuJHtkZXNjcmliZURvbUZyb21Ob2RlKG5vZGUhKX1cXG5cXG5gO1xuICAgIGNvbnN0IGZvb3RlciA9IGdldEh5ZHJhdGlvbkVycm9yRm9vdGVyKCk7XG5cbiAgICBjb25zdCBtZXNzYWdlID0gaGVhZGVyICsgYWN0dWFsICsgZm9vdGVyO1xuICAgIHRocm93IG5ldyBSdW50aW1lRXJyb3IoUnVudGltZUVycm9yQ29kZS5IWURSQVRJT05fTUlTU0lOR19TSUJMSU5HUywgbWVzc2FnZSk7XG4gIH1cbn1cblxuLyoqXG4gKiBWYWxpZGF0ZXMgdGhhdCBhIG5vZGUgZXhpc3RzIG9yIHRocm93c1xuICovXG5leHBvcnQgZnVuY3Rpb24gdmFsaWRhdGVOb2RlRXhpc3RzKG5vZGU6IFJOb2RlfG51bGwpOiB2b2lkIHtcbiAgaWYgKCFub2RlKSB7XG4gICAgdGhyb3cgbmV3IFJ1bnRpbWVFcnJvcihcbiAgICAgICAgUnVudGltZUVycm9yQ29kZS5IWURSQVRJT05fTUlTU0lOR19OT0RFLFxuICAgICAgICBgSHlkcmF0aW9uIGV4cGVjdGVkIGFuIGVsZW1lbnQgdG8gYmUgcHJlc2VudCBhdCB0aGlzIGxvY2F0aW9uLmApO1xuICB9XG59XG5cbi8qKlxuICogQnVpbGRzIHRoZSBoeWRyYXRpb24gZXJyb3IgbWVzc2FnZSB3aGVuIGEgbm9kZSBpcyBub3QgZm91bmRcbiAqXG4gKiBAcGFyYW0gbFZpZXcgdGhlIExWaWV3IHdoZXJlIHRoZSBub2RlIGV4aXN0c1xuICogQHBhcmFtIHROb2RlIHRoZSBUTm9kZVxuICovXG5leHBvcnQgZnVuY3Rpb24gbm9kZU5vdEZvdW5kRXJyb3IobFZpZXc6IExWaWV3LCB0Tm9kZTogVE5vZGUpOiBFcnJvciB7XG4gIGNvbnN0IGhlYWRlciA9ICdEdXJpbmcgc2VyaWFsaXphdGlvbiwgQW5ndWxhciB3YXMgdW5hYmxlIHRvIGZpbmQgYW4gZWxlbWVudCBpbiB0aGUgRE9NOlxcblxcbic7XG4gIGNvbnN0IGV4cGVjdGVkID0gYCR7ZGVzY3JpYmVFeHBlY3RlZERvbShsVmlldywgdE5vZGUsIGZhbHNlKX1cXG5cXG5gO1xuICBjb25zdCBmb290ZXIgPSBnZXRIeWRyYXRpb25FcnJvckZvb3RlcigpO1xuXG4gIHRocm93IG5ldyBSdW50aW1lRXJyb3IoUnVudGltZUVycm9yQ29kZS5IWURSQVRJT05fTUlTU0lOR19OT0RFLCBoZWFkZXIgKyBleHBlY3RlZCArIGZvb3Rlcik7XG59XG5cbi8qKlxuICogQnVpbGRzIGEgaHlkcmF0aW9uIGVycm9yIG1lc3NhZ2Ugd2hlbiBhIG5vZGUgaXMgbm90IGZvdW5kIGF0IGEgcGF0aCBsb2NhdGlvblxuICpcbiAqIEBwYXJhbSBob3N0IHRoZSBIb3N0IE5vZGVcbiAqIEBwYXJhbSBwYXRoIHRoZSBwYXRoIHRvIHRoZSBub2RlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBub2RlTm90Rm91bmRBdFBhdGhFcnJvcihob3N0OiBOb2RlLCBwYXRoOiBzdHJpbmcpOiBFcnJvciB7XG4gIGNvbnN0IGhlYWRlciA9IGBEdXJpbmcgaHlkcmF0aW9uIEFuZ3VsYXIgd2FzIHVuYWJsZSB0byBsb2NhdGUgYSBub2RlIGAgK1xuICAgICAgYHVzaW5nIHRoZSBcIiR7cGF0aH1cIiBwYXRoLCBzdGFydGluZyBmcm9tIHRoZSAke2Rlc2NyaWJlUk5vZGUoaG9zdCl9IG5vZGUuXFxuXFxuYDtcbiAgY29uc3QgZm9vdGVyID0gZ2V0SHlkcmF0aW9uRXJyb3JGb290ZXIoKTtcblxuICB0aHJvdyBuZXcgUnVudGltZUVycm9yKFJ1bnRpbWVFcnJvckNvZGUuSFlEUkFUSU9OX01JU1NJTkdfTk9ERSwgaGVhZGVyICsgZm9vdGVyKTtcbn1cblxuXG4vKipcbiAqIEJ1aWxkcyB0aGUgaHlkcmF0aW9uIGVycm9yIG1lc3NhZ2UgaW4gdGhlIGNhc2UgdGhhdCBkb20gbm9kZXMgYXJlIGNyZWF0ZWQgb3V0c2lkZSBvZlxuICogdGhlIEFuZ3VsYXIgY29udGV4dCBhbmQgYXJlIGJlaW5nIHVzZWQgYXMgcHJvamVjdGVkIG5vZGVzXG4gKlxuICogQHBhcmFtIGxWaWV3IHRoZSBMVmlld1xuICogQHBhcmFtIHROb2RlIHRoZSBUTm9kZVxuICogQHJldHVybnMgYW4gZXJyb3JcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHVuc3VwcG9ydGVkUHJvamVjdGlvbk9mRG9tTm9kZXMock5vZGU6IFJOb2RlKTogRXJyb3Ige1xuICBjb25zdCBoZWFkZXIgPSAnRHVyaW5nIHNlcmlhbGl6YXRpb24sIEFuZ3VsYXIgZGV0ZWN0ZWQgRE9NIG5vZGVzICcgK1xuICAgICAgJ3RoYXQgd2VyZSBjcmVhdGVkIG91dHNpZGUgb2YgQW5ndWxhciBjb250ZXh0IGFuZCBwcm92aWRlZCBhcyBwcm9qZWN0YWJsZSBub2RlcyAnICtcbiAgICAgICcobGlrZWx5IHZpYSBgVmlld0NvbnRhaW5lclJlZi5jcmVhdGVDb21wb25lbnRgIG9yIGBjcmVhdGVDb21wb25lbnRgIEFQSXMpLiAnICtcbiAgICAgICdIeWRyYXRpb24gaXMgbm90IHN1cHBvcnRlZCBmb3Igc3VjaCBjYXNlcywgY29uc2lkZXIgcmVmYWN0b3JpbmcgdGhlIGNvZGUgdG8gYXZvaWQgJyArXG4gICAgICAndGhpcyBwYXR0ZXJuIG9yIHVzaW5nIGBuZ1NraXBIeWRyYXRpb25gIG9uIHRoZSBob3N0IGVsZW1lbnQgb2YgdGhlIGNvbXBvbmVudC5cXG5cXG4nO1xuICBjb25zdCBhY3R1YWwgPSBgJHtkZXNjcmliZURvbUZyb21Ob2RlKHJOb2RlKX1cXG5cXG5gO1xuICBjb25zdCBtZXNzYWdlID0gaGVhZGVyICsgYWN0dWFsICsgZ2V0SHlkcmF0aW9uQXR0cmlidXRlTm90ZSgpO1xuICByZXR1cm4gbmV3IFJ1bnRpbWVFcnJvcihSdW50aW1lRXJyb3JDb2RlLlVOU1VQUE9SVEVEX1BST0pFQ1RJT05fRE9NX05PREVTLCBtZXNzYWdlKTtcbn1cblxuLyoqXG4gKiBCdWlsZHMgdGhlIGh5ZHJhdGlvbiBlcnJvciBtZXNzYWdlIGluIHRoZSBjYXNlIHRoYXQgbmdTa2lwSHlkcmF0aW9uIHdhcyB1c2VkIG9uIGFcbiAqIG5vZGUgdGhhdCBpcyBub3QgYSBjb21wb25lbnQgaG9zdCBlbGVtZW50IG9yIGhvc3QgYmluZGluZ1xuICpcbiAqIEBwYXJhbSByTm9kZSB0aGUgSFRNTCBFbGVtZW50XG4gKiBAcmV0dXJucyBhbiBlcnJvclxuICovXG5leHBvcnQgZnVuY3Rpb24gaW52YWxpZFNraXBIeWRyYXRpb25Ib3N0KHJOb2RlOiBSTm9kZSk6IEVycm9yIHtcbiAgY29uc3QgaGVhZGVyID0gJ1RoZSBgbmdTa2lwSHlkcmF0aW9uYCBmbGFnIGlzIGFwcGxpZWQgb24gYSBub2RlICcgK1xuICAgICAgJ3RoYXQgZG9lc25cXCd0IGFjdCBhcyBhIGNvbXBvbmVudCBob3N0LiBIeWRyYXRpb24gY2FuIGJlICcgK1xuICAgICAgJ3NraXBwZWQgb25seSBvbiBwZXItY29tcG9uZW50IGJhc2lzLlxcblxcbic7XG4gIGNvbnN0IGFjdHVhbCA9IGAke2Rlc2NyaWJlRG9tRnJvbU5vZGUock5vZGUpfVxcblxcbmA7XG4gIGNvbnN0IGZvb3RlciA9ICdQbGVhc2UgbW92ZSB0aGUgYG5nU2tpcEh5ZHJhdGlvbmAgYXR0cmlidXRlIHRvIHRoZSBjb21wb25lbnQgaG9zdCBlbGVtZW50Lic7XG4gIGNvbnN0IG1lc3NhZ2UgPSBoZWFkZXIgKyBhY3R1YWwgKyBmb290ZXI7XG4gIHJldHVybiBuZXcgUnVudGltZUVycm9yKFJ1bnRpbWVFcnJvckNvZGUuSU5WQUxJRF9TS0lQX0hZRFJBVElPTl9IT1NULCBtZXNzYWdlKTtcbn1cblxuLyoqXG4gKiBCdWlsZHMgdGhlIGh5ZHJhdGlvbiBlcnJvciBtZXNzYWdlIGluIHRoZSBjYXNlIHRoYXQgYSB1c2VyIGlzIGF0dGVtcHRpbmcgdG8gZW5hYmxlXG4gKiBoeWRyYXRpb24gb24gaW50ZXJuYXRpb25hbGl6ZWQgbm9kZXMsIHdoaWNoIGlzIG5vdCB5ZXQgc3VwcG9ydGVkLlxuICpcbiAqIEBwYXJhbSByTm9kZSB0aGUgSFRNTCBFbGVtZW50XG4gKiBAcmV0dXJucyBhbiBlcnJvclxuICovXG5leHBvcnQgZnVuY3Rpb24gbm90WWV0U3VwcG9ydGVkSTE4bkJsb2NrRXJyb3Iock5vZGU6IFJOb2RlKTogRXJyb3Ige1xuICBjb25zdCBoZWFkZXIgPSAnSHlkcmF0aW9uIGZvciBub2RlcyBtYXJrZWQgd2l0aCBgaTE4bmAgaXMgbm90IHlldCBzdXBwb3J0ZWQuICcgK1xuICAgICAgJ1lvdSBjYW4gb3B0LW91dCBhIGNvbXBvbmVudCB0aGF0IHVzZXMgYGkxOG5gIGluIGEgdGVtcGxhdGUgdXNpbmcgJyArXG4gICAgICAndGhlIGBuZ1NraXBIeWRyYXRpb25gIGF0dHJpYnV0ZSBvciBmYWxsIGJhY2sgdG8gdGhlIHByZXZpb3VzICcgK1xuICAgICAgJ2h5ZHJhdGlvbiBsb2dpYyAod2hpY2ggcmUtY3JlYXRlcyB0aGUgYXBwbGljYXRpb24gc3RydWN0dXJlKS5cXG5cXG4nO1xuICBjb25zdCBhY3R1YWwgPSBgJHtkZXNjcmliZURvbUZyb21Ob2RlKHJOb2RlKX1cXG5cXG5gO1xuICBjb25zdCBtZXNzYWdlID0gaGVhZGVyICsgYWN0dWFsO1xuICByZXR1cm4gbmV3IFJ1bnRpbWVFcnJvcihSdW50aW1lRXJyb3JDb2RlLkhZRFJBVElPTl9JMThOX05PVF9ZRVRfU1VQUE9SVEVELCBtZXNzYWdlKTtcbn1cblxuLy8gU3RyaW5naWZpY2F0aW9uIG1ldGhvZHNcblxuLyoqXG4gKiBTdHJpbmdpZmllcyBhIGdpdmVuIFROb2RlJ3MgYXR0cmlidXRlc1xuICpcbiAqIEBwYXJhbSB0Tm9kZSBhIHByb3ZpZGVkIFROb2RlXG4gKiBAcmV0dXJucyBzdHJpbmdcbiAqL1xuZnVuY3Rpb24gc3RyaW5naWZ5VE5vZGVBdHRycyh0Tm9kZTogVE5vZGUpOiBzdHJpbmcge1xuICBjb25zdCByZXN1bHRzID0gW107XG4gIGlmICh0Tm9kZS5hdHRycykge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdE5vZGUuYXR0cnMubGVuZ3RoOykge1xuICAgICAgY29uc3QgYXR0ck5hbWUgPSB0Tm9kZS5hdHRyc1tpKytdO1xuICAgICAgLy8gT25jZSB3ZSByZWFjaCB0aGUgZmlyc3QgZmxhZywgd2Uga25vdyB0aGF0IHRoZSBsaXN0IG9mXG4gICAgICAvLyBhdHRyaWJ1dGVzIGlzIG92ZXIuXG4gICAgICBpZiAodHlwZW9mIGF0dHJOYW1lID09ICdudW1iZXInKSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgY29uc3QgYXR0clZhbHVlID0gdE5vZGUuYXR0cnNbaSsrXTtcbiAgICAgIHJlc3VsdHMucHVzaChgJHthdHRyTmFtZX09XCIke3Nob3J0ZW4oYXR0clZhbHVlIGFzIHN0cmluZyl9XCJgKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHJlc3VsdHMuam9pbignICcpO1xufVxuXG4vKipcbiAqIFRoZSBsaXN0IG9mIGludGVybmFsIGF0dHJpYnV0ZXMgdGhhdCBzaG91bGQgYmUgZmlsdGVyZWQgb3V0IHdoaWxlXG4gKiBwcm9kdWNpbmcgYW4gZXJyb3IgbWVzc2FnZS5cbiAqL1xuY29uc3QgaW50ZXJuYWxBdHRycyA9IG5ldyBTZXQoWyduZ2gnLCAnbmctdmVyc2lvbicsICduZy1zZXJ2ZXItY29udGV4dCddKTtcblxuLyoqXG4gKiBTdHJpbmdpZmllcyBhbiBIVE1MIEVsZW1lbnQncyBhdHRyaWJ1dGVzXG4gKlxuICogQHBhcmFtIHJOb2RlIGFuIEhUTUwgRWxlbWVudFxuICogQHJldHVybnMgc3RyaW5nXG4gKi9cbmZ1bmN0aW9uIHN0cmluZ2lmeVJOb2RlQXR0cnMock5vZGU6IEhUTUxFbGVtZW50KTogc3RyaW5nIHtcbiAgY29uc3QgcmVzdWx0cyA9IFtdO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IHJOb2RlLmF0dHJpYnV0ZXMubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBhdHRyID0gck5vZGUuYXR0cmlidXRlc1tpXTtcbiAgICBpZiAoaW50ZXJuYWxBdHRycy5oYXMoYXR0ci5uYW1lKSkgY29udGludWU7XG4gICAgcmVzdWx0cy5wdXNoKGAke2F0dHIubmFtZX09XCIke3Nob3J0ZW4oYXR0ci52YWx1ZSl9XCJgKTtcbiAgfVxuICByZXR1cm4gcmVzdWx0cy5qb2luKCcgJyk7XG59XG5cbi8vIE1ldGhvZHMgZm9yIERlc2NyaWJpbmcgdGhlIERPTVxuXG4vKipcbiAqIENvbnZlcnRzIGEgdE5vZGUgdG8gYSBoZWxwZnVsIHJlYWRhYmxlIHN0cmluZyB2YWx1ZSBmb3IgdXNlIGluIGVycm9yIG1lc3NhZ2VzXG4gKlxuICogQHBhcmFtIHROb2RlIGEgZ2l2ZW4gVE5vZGVcbiAqIEBwYXJhbSBpbm5lckNvbnRlbnQgdGhlIGNvbnRlbnQgb2YgdGhlIG5vZGVcbiAqIEByZXR1cm5zIHN0cmluZ1xuICovXG5mdW5jdGlvbiBkZXNjcmliZVROb2RlKHROb2RlOiBUTm9kZSwgaW5uZXJDb250ZW50OiBzdHJpbmcgPSAn4oCmJyk6IHN0cmluZyB7XG4gIHN3aXRjaCAodE5vZGUudHlwZSkge1xuICAgIGNhc2UgVE5vZGVUeXBlLlRleHQ6XG4gICAgICBjb25zdCBjb250ZW50ID0gdE5vZGUudmFsdWUgPyBgKCR7dE5vZGUudmFsdWV9KWAgOiAnJztcbiAgICAgIHJldHVybiBgI3RleHQke2NvbnRlbnR9YDtcbiAgICBjYXNlIFROb2RlVHlwZS5FbGVtZW50OlxuICAgICAgY29uc3QgYXR0cnMgPSBzdHJpbmdpZnlUTm9kZUF0dHJzKHROb2RlKTtcbiAgICAgIGNvbnN0IHRhZyA9IHROb2RlLnZhbHVlLnRvTG93ZXJDYXNlKCk7XG4gICAgICByZXR1cm4gYDwke3RhZ30ke2F0dHJzID8gJyAnICsgYXR0cnMgOiAnJ30+JHtpbm5lckNvbnRlbnR9PC8ke3RhZ30+YDtcbiAgICBjYXNlIFROb2RlVHlwZS5FbGVtZW50Q29udGFpbmVyOlxuICAgICAgcmV0dXJuICc8IS0tIG5nLWNvbnRhaW5lciAtLT4nO1xuICAgIGNhc2UgVE5vZGVUeXBlLkNvbnRhaW5lcjpcbiAgICAgIHJldHVybiAnPCEtLSBjb250YWluZXIgLS0+JztcbiAgICBkZWZhdWx0OlxuICAgICAgY29uc3QgdHlwZUFzU3RyaW5nID0gZ2V0RnJpZW5kbHlTdHJpbmdGcm9tVE5vZGVUeXBlKHROb2RlLnR5cGUpO1xuICAgICAgcmV0dXJuIGAjbm9kZSgke3R5cGVBc1N0cmluZ30pYDtcbiAgfVxufVxuXG4vKipcbiAqIENvbnZlcnRzIGFuIFJOb2RlIHRvIGEgaGVscGZ1bCByZWFkYWJsZSBzdHJpbmcgdmFsdWUgZm9yIHVzZSBpbiBlcnJvciBtZXNzYWdlc1xuICpcbiAqIEBwYXJhbSByTm9kZSBhIGdpdmVuIFJOb2RlXG4gKiBAcGFyYW0gaW5uZXJDb250ZW50IHRoZSBjb250ZW50IG9mIHRoZSBub2RlXG4gKiBAcmV0dXJucyBzdHJpbmdcbiAqL1xuZnVuY3Rpb24gZGVzY3JpYmVSTm9kZShyTm9kZTogUk5vZGUsIGlubmVyQ29udGVudDogc3RyaW5nID0gJ+KApicpOiBzdHJpbmcge1xuICBjb25zdCBub2RlID0gck5vZGUgYXMgSFRNTEVsZW1lbnQ7XG4gIHN3aXRjaCAobm9kZS5ub2RlVHlwZSkge1xuICAgIGNhc2UgTm9kZS5FTEVNRU5UX05PREU6XG4gICAgICBjb25zdCB0YWcgPSBub2RlLnRhZ05hbWUhLnRvTG93ZXJDYXNlKCk7XG4gICAgICBjb25zdCBhdHRycyA9IHN0cmluZ2lmeVJOb2RlQXR0cnMobm9kZSk7XG4gICAgICByZXR1cm4gYDwke3RhZ30ke2F0dHJzID8gJyAnICsgYXR0cnMgOiAnJ30+JHtpbm5lckNvbnRlbnR9PC8ke3RhZ30+YDtcbiAgICBjYXNlIE5vZGUuVEVYVF9OT0RFOlxuICAgICAgY29uc3QgY29udGVudCA9IG5vZGUudGV4dENvbnRlbnQgPyBzaG9ydGVuKG5vZGUudGV4dENvbnRlbnQpIDogJyc7XG4gICAgICByZXR1cm4gYCN0ZXh0JHtjb250ZW50ID8gYCgke2NvbnRlbnR9KWAgOiAnJ31gO1xuICAgIGNhc2UgTm9kZS5DT01NRU5UX05PREU6XG4gICAgICByZXR1cm4gYDwhLS0gJHtzaG9ydGVuKG5vZGUudGV4dENvbnRlbnQgPz8gJycpfSAtLT5gO1xuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gYCNub2RlKCR7bm9kZS5ub2RlVHlwZX0pYDtcbiAgfVxufVxuXG4vKipcbiAqIEJ1aWxkcyB0aGUgc3RyaW5nIGNvbnRhaW5pbmcgdGhlIGV4cGVjdGVkIERPTSBwcmVzZW50IGdpdmVuIHRoZSBMVmlldyBhbmQgVE5vZGVcbiAqIHZhbHVlcyBmb3IgYSByZWFkYWJsZSBlcnJvciBtZXNzYWdlXG4gKlxuICogQHBhcmFtIGxWaWV3IHRoZSBsVmlldyBjb250YWluaW5nIHRoZSBET01cbiAqIEBwYXJhbSB0Tm9kZSB0aGUgdE5vZGVcbiAqIEBwYXJhbSBpc1ZpZXdDb250YWluZXJBbmNob3IgYm9vbGVhblxuICogQHJldHVybnMgc3RyaW5nXG4gKi9cbmZ1bmN0aW9uIGRlc2NyaWJlRXhwZWN0ZWREb20obFZpZXc6IExWaWV3LCB0Tm9kZTogVE5vZGUsIGlzVmlld0NvbnRhaW5lckFuY2hvcjogYm9vbGVhbik6IHN0cmluZyB7XG4gIGNvbnN0IHNwYWNlciA9ICcgICc7XG4gIGxldCBjb250ZW50ID0gJyc7XG4gIGlmICh0Tm9kZS5wcmV2KSB7XG4gICAgY29udGVudCArPSBzcGFjZXIgKyAn4oCmXFxuJztcbiAgICBjb250ZW50ICs9IHNwYWNlciArIGRlc2NyaWJlVE5vZGUodE5vZGUucHJldikgKyAnXFxuJztcbiAgfSBlbHNlIGlmICh0Tm9kZS50eXBlICYmIHROb2RlLnR5cGUgJiBUTm9kZVR5cGUuQW55Q29udGFpbmVyKSB7XG4gICAgY29udGVudCArPSBzcGFjZXIgKyAn4oCmXFxuJztcbiAgfVxuICBpZiAoaXNWaWV3Q29udGFpbmVyQW5jaG9yKSB7XG4gICAgY29udGVudCArPSBzcGFjZXIgKyBkZXNjcmliZVROb2RlKHROb2RlKSArICdcXG4nO1xuICAgIGNvbnRlbnQgKz0gc3BhY2VyICsgYDwhLS0gY29udGFpbmVyIC0tPiAgJHtBVF9USElTX0xPQ0FUSU9OfVxcbmA7XG4gIH0gZWxzZSB7XG4gICAgY29udGVudCArPSBzcGFjZXIgKyBkZXNjcmliZVROb2RlKHROb2RlKSArIGAgICR7QVRfVEhJU19MT0NBVElPTn1cXG5gO1xuICB9XG4gIGNvbnRlbnQgKz0gc3BhY2VyICsgJ+KAplxcbic7XG5cbiAgY29uc3QgcGFyZW50Uk5vZGUgPSB0Tm9kZS50eXBlID8gZ2V0UGFyZW50UkVsZW1lbnQobFZpZXdbVFZJRVddLCB0Tm9kZSwgbFZpZXcpIDogbnVsbDtcbiAgaWYgKHBhcmVudFJOb2RlKSB7XG4gICAgY29udGVudCA9IGRlc2NyaWJlUk5vZGUocGFyZW50Uk5vZGUgYXMgdW5rbm93biBhcyBOb2RlLCAnXFxuJyArIGNvbnRlbnQpO1xuICB9XG4gIHJldHVybiBjb250ZW50O1xufVxuXG4vKipcbiAqIEJ1aWxkcyB0aGUgc3RyaW5nIGNvbnRhaW5pbmcgdGhlIERPTSBwcmVzZW50IGFyb3VuZCBhIGdpdmVuIFJOb2RlIGZvciBhXG4gKiByZWFkYWJsZSBlcnJvciBtZXNzYWdlXG4gKlxuICogQHBhcmFtIG5vZGUgdGhlIFJOb2RlXG4gKiBAcmV0dXJucyBzdHJpbmdcbiAqL1xuZnVuY3Rpb24gZGVzY3JpYmVEb21Gcm9tTm9kZShub2RlOiBSTm9kZSk6IHN0cmluZyB7XG4gIGNvbnN0IHNwYWNlciA9ICcgICc7XG4gIGxldCBjb250ZW50ID0gJyc7XG4gIGNvbnN0IGN1cnJlbnROb2RlID0gbm9kZSBhcyBIVE1MRWxlbWVudDtcbiAgaWYgKGN1cnJlbnROb2RlLnByZXZpb3VzU2libGluZykge1xuICAgIGNvbnRlbnQgKz0gc3BhY2VyICsgJ+KAplxcbic7XG4gICAgY29udGVudCArPSBzcGFjZXIgKyBkZXNjcmliZVJOb2RlKGN1cnJlbnROb2RlLnByZXZpb3VzU2libGluZykgKyAnXFxuJztcbiAgfVxuICBjb250ZW50ICs9IHNwYWNlciArIGRlc2NyaWJlUk5vZGUoY3VycmVudE5vZGUpICsgYCAgJHtBVF9USElTX0xPQ0FUSU9OfVxcbmA7XG4gIGlmIChub2RlLm5leHRTaWJsaW5nKSB7XG4gICAgY29udGVudCArPSBzcGFjZXIgKyAn4oCmXFxuJztcbiAgfVxuICBpZiAobm9kZS5wYXJlbnROb2RlKSB7XG4gICAgY29udGVudCA9IGRlc2NyaWJlUk5vZGUoY3VycmVudE5vZGUucGFyZW50Tm9kZSBhcyBOb2RlLCAnXFxuJyArIGNvbnRlbnQpO1xuICB9XG4gIHJldHVybiBjb250ZW50O1xufVxuXG4vKipcbiAqIFNob3J0ZW5zIHRoZSBkZXNjcmlwdGlvbiBvZiBhIGdpdmVuIFJOb2RlIGJ5IGl0cyB0eXBlIGZvciByZWFkYWJpbGl0eVxuICpcbiAqIEBwYXJhbSBub2RlVHlwZSB0aGUgdHlwZSBvZiBub2RlXG4gKiBAcGFyYW0gdGFnTmFtZSB0aGUgbm9kZSB0YWcgbmFtZVxuICogQHBhcmFtIHRleHRDb250ZW50IHRoZSB0ZXh0IGNvbnRlbnQgaW4gdGhlIG5vZGVcbiAqIEByZXR1cm5zIHN0cmluZ1xuICovXG5mdW5jdGlvbiBzaG9ydFJOb2RlRGVzY3JpcHRpb24oXG4gICAgbm9kZVR5cGU6IG51bWJlciwgdGFnTmFtZTogc3RyaW5nfG51bGwsIHRleHRDb250ZW50OiBzdHJpbmd8bnVsbCk6IHN0cmluZyB7XG4gIHN3aXRjaCAobm9kZVR5cGUpIHtcbiAgICBjYXNlIE5vZGUuRUxFTUVOVF9OT0RFOlxuICAgICAgcmV0dXJuIGA8JHt0YWdOYW1lIS50b0xvd2VyQ2FzZSgpfT5gO1xuICAgIGNhc2UgTm9kZS5URVhUX05PREU6XG4gICAgICBjb25zdCBjb250ZW50ID0gdGV4dENvbnRlbnQgPyBgICh3aXRoIHRoZSBcIiR7c2hvcnRlbih0ZXh0Q29udGVudCl9XCIgY29udGVudClgIDogJyc7XG4gICAgICByZXR1cm4gYGEgdGV4dCBub2RlJHtjb250ZW50fWA7XG4gICAgY2FzZSBOb2RlLkNPTU1FTlRfTk9ERTpcbiAgICAgIHJldHVybiAnYSBjb21tZW50IG5vZGUnO1xuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gYCNub2RlKG5vZGVUeXBlPSR7bm9kZVR5cGV9KWA7XG4gIH1cbn1cblxuXG4vKipcbiAqIEJ1aWxkcyB0aGUgZm9vdGVyIGh5ZHJhdGlvbiBlcnJvciBtZXNzYWdlXG4gKlxuICogQHBhcmFtIGNvbXBvbmVudENsYXNzTmFtZSB0aGUgbmFtZSBvZiB0aGUgY29tcG9uZW50IGNsYXNzXG4gKiBAcmV0dXJucyBzdHJpbmdcbiAqL1xuZnVuY3Rpb24gZ2V0SHlkcmF0aW9uRXJyb3JGb290ZXIoY29tcG9uZW50Q2xhc3NOYW1lPzogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3QgY29tcG9uZW50SW5mbyA9IGNvbXBvbmVudENsYXNzTmFtZSA/IGB0aGUgXCIke2NvbXBvbmVudENsYXNzTmFtZX1cImAgOiAnY29ycmVzcG9uZGluZyc7XG4gIHJldHVybiBgVG8gZml4IHRoaXMgcHJvYmxlbTpcXG5gICtcbiAgICAgIGAgICogY2hlY2sgJHtjb21wb25lbnRJbmZvfSBjb21wb25lbnQgZm9yIGh5ZHJhdGlvbi1yZWxhdGVkIGlzc3Vlc1xcbmAgK1xuICAgICAgYCAgKiBvciBza2lwIGh5ZHJhdGlvbiBieSBhZGRpbmcgdGhlIFxcYG5nU2tpcEh5ZHJhdGlvblxcYCBhdHRyaWJ1dGUgYCArXG4gICAgICBgdG8gaXRzIGhvc3Qgbm9kZSBpbiBhIHRlbXBsYXRlYDtcbn1cblxuLyoqXG4gKiBBbiBhdHRyaWJ1dGUgcmVsYXRlZCBub3RlIGZvciBoeWRyYXRpb24gZXJyb3JzXG4gKi9cbmZ1bmN0aW9uIGdldEh5ZHJhdGlvbkF0dHJpYnV0ZU5vdGUoKTogc3RyaW5nIHtcbiAgcmV0dXJuICdOb3RlOiBhdHRyaWJ1dGVzIGFyZSBvbmx5IGRpc3BsYXllZCB0byBiZXR0ZXIgcmVwcmVzZW50IHRoZSBET00nICtcbiAgICAgICcgYnV0IGhhdmUgbm8gZWZmZWN0IG9uIGh5ZHJhdGlvbiBtaXNtYXRjaGVzLlxcblxcbic7XG59XG5cbi8vIE5vZGUgc3RyaW5nIHV0aWxpdHkgZnVuY3Rpb25zXG5cbi8qKlxuICogU3RyaXBzIGFsbCBuZXdsaW5lcyBvdXQgb2YgYSBnaXZlbiBzdHJpbmdcbiAqXG4gKiBAcGFyYW0gaW5wdXQgYSBzdHJpbmcgdG8gYmUgY2xlYXJlZCBvZiBuZXcgbGluZSBjaGFyYWN0ZXJzXG4gKiBAcmV0dXJuc1xuICovXG5mdW5jdGlvbiBzdHJpcE5ld2xpbmVzKGlucHV0OiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gaW5wdXQucmVwbGFjZSgvXFxzKy9nbSwgJycpO1xufVxuXG4vKipcbiAqIFJlZHVjZXMgYSBzdHJpbmcgZG93biB0byBhIG1heGltdW0gbGVuZ3RoIG9mIGNoYXJhY3RlcnMgd2l0aCBlbGxpcHNpcyBmb3IgcmVhZGFiaWxpdHlcbiAqXG4gKiBAcGFyYW0gaW5wdXQgYSBzdHJpbmcgaW5wdXRcbiAqIEBwYXJhbSBtYXhMZW5ndGggYSBtYXhpbXVtIGxlbmd0aCBpbiBjaGFyYWN0ZXJzXG4gKiBAcmV0dXJucyBzdHJpbmdcbiAqL1xuZnVuY3Rpb24gc2hvcnRlbihpbnB1dDogc3RyaW5nfG51bGwsIG1heExlbmd0aCA9IDUwKTogc3RyaW5nIHtcbiAgaWYgKCFpbnB1dCkge1xuICAgIHJldHVybiAnJztcbiAgfVxuICBpbnB1dCA9IHN0cmlwTmV3bGluZXMoaW5wdXQpO1xuICByZXR1cm4gaW5wdXQubGVuZ3RoID4gbWF4TGVuZ3RoID8gYCR7aW5wdXQuc3Vic3RyaW5nKDAsIG1heExlbmd0aCAtIDEpfeKApmAgOiBpbnB1dDtcbn1cbiJdfQ==