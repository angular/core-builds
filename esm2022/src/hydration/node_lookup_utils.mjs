/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { DECLARATION_COMPONENT_VIEW, HEADER_OFFSET, HOST } from '../render3/interfaces/view';
import { getFirstNativeNode } from '../render3/node_manipulation';
import { ɵɵresolveBody } from '../render3/util/misc_utils';
import { renderStringify } from '../render3/util/stringify_utils';
import { getNativeByTNode, unwrapRNode } from '../render3/util/view_utils';
import { assertDefined } from '../util/assert';
import { compressNodeLocation, decompressNodeLocation } from './compression';
import { nodeNotFoundAtPathError, nodeNotFoundError, validateSiblingNodeExists } from './error_handling';
import { NodeNavigationStep, NODES, REFERENCE_NODE_BODY, REFERENCE_NODE_HOST } from './interfaces';
import { calcSerializedContainerSize, getSegmentHead } from './utils';
/** Whether current TNode is a first node in an <ng-container>. */
function isFirstElementInNgContainer(tNode) {
    return !tNode.prev && tNode.parent?.type === 8 /* TNodeType.ElementContainer */;
}
/** Returns an instruction index (subtracting HEADER_OFFSET). */
function getNoOffsetIndex(tNode) {
    return tNode.index - HEADER_OFFSET;
}
/**
 * Check whether a given node exists, but is disconnected from the DOM.
 *
 * Note: we leverage the fact that we have this information available in the DOM emulation
 * layer (in Domino) for now. Longer-term solution should not rely on the DOM emulation and
 * only use internal data structures and state to compute this information.
 */
export function isDisconnectedNode(tNode, lView) {
    return !(tNode.type & 16 /* TNodeType.Projection */) && !!lView[tNode.index] &&
        !unwrapRNode(lView[tNode.index])?.isConnected;
}
/**
 * Locate a node in DOM tree that corresponds to a given TNode.
 *
 * @param hydrationInfo The hydration annotation data
 * @param tView the current tView
 * @param lView the current lView
 * @param tNode the current tNode
 * @returns an RNode that represents a given tNode
 */
export function locateNextRNode(hydrationInfo, tView, lView, tNode) {
    let native = null;
    const noOffsetIndex = getNoOffsetIndex(tNode);
    const nodes = hydrationInfo.data[NODES];
    if (nodes?.[noOffsetIndex]) {
        // We know the exact location of the node.
        native = locateRNodeByPath(nodes[noOffsetIndex], lView);
    }
    else if (tView.firstChild === tNode) {
        // We create a first node in this view, so we use a reference
        // to the first child in this DOM segment.
        native = hydrationInfo.firstChild;
    }
    else {
        // Locate a node based on a previous sibling or a parent node.
        const previousTNodeParent = tNode.prev === null;
        const previousTNode = (tNode.prev ?? tNode.parent);
        ngDevMode &&
            assertDefined(previousTNode, 'Unexpected state: current TNode does not have a connection ' +
                'to the previous node or a parent node.');
        if (isFirstElementInNgContainer(tNode)) {
            const noOffsetParentIndex = getNoOffsetIndex(tNode.parent);
            native = getSegmentHead(hydrationInfo, noOffsetParentIndex);
        }
        else {
            let previousRElement = getNativeByTNode(previousTNode, lView);
            if (previousTNodeParent) {
                native = previousRElement.firstChild;
            }
            else {
                // If the previous node is an element, but it also has container info,
                // this means that we are processing a node like `<div #vcrTarget>`, which is
                // represented in the DOM as `<div></div>...<!--container-->`.
                // In this case, there are nodes *after* this element and we need to skip
                // all of them to reach an element that we are looking for.
                const noOffsetPrevSiblingIndex = getNoOffsetIndex(previousTNode);
                const segmentHead = getSegmentHead(hydrationInfo, noOffsetPrevSiblingIndex);
                if (previousTNode.type === 2 /* TNodeType.Element */ && segmentHead) {
                    const numRootNodesToSkip = calcSerializedContainerSize(hydrationInfo, noOffsetPrevSiblingIndex);
                    // `+1` stands for an anchor comment node after all the views in this container.
                    const nodesToSkip = numRootNodesToSkip + 1;
                    // First node after this segment.
                    native = siblingAfter(nodesToSkip, segmentHead);
                }
                else {
                    native = previousRElement.nextSibling;
                }
            }
        }
    }
    return native;
}
/**
 * Skips over a specified number of nodes and returns the next sibling node after that.
 */
export function siblingAfter(skip, from) {
    let currentNode = from;
    for (let i = 0; i < skip; i++) {
        ngDevMode && validateSiblingNodeExists(currentNode);
        currentNode = currentNode.nextSibling;
    }
    return currentNode;
}
/**
 * Helper function to produce a string representation of the navigation steps
 * (in terms of `nextSibling` and `firstChild` navigations). Used in error
 * messages in dev mode.
 */
function stringifyNavigationInstructions(instructions) {
    const container = [];
    for (let i = 0; i < instructions.length; i += 2) {
        const step = instructions[i];
        const repeat = instructions[i + 1];
        for (let r = 0; r < repeat; r++) {
            container.push(step === NodeNavigationStep.FirstChild ? 'firstChild' : 'nextSibling');
        }
    }
    return container.join('.');
}
/**
 * Helper function that navigates from a starting point node (the `from` node)
 * using provided set of navigation instructions (within `path` argument).
 */
function navigateToNode(from, instructions) {
    let node = from;
    for (let i = 0; i < instructions.length; i += 2) {
        const step = instructions[i];
        const repeat = instructions[i + 1];
        for (let r = 0; r < repeat; r++) {
            if (ngDevMode && !node) {
                throw nodeNotFoundAtPathError(from, stringifyNavigationInstructions(instructions));
            }
            switch (step) {
                case NodeNavigationStep.FirstChild:
                    node = node.firstChild;
                    break;
                case NodeNavigationStep.NextSibling:
                    node = node.nextSibling;
                    break;
            }
        }
    }
    if (ngDevMode && !node) {
        throw nodeNotFoundAtPathError(from, stringifyNavigationInstructions(instructions));
    }
    return node;
}
/**
 * Locates an RNode given a set of navigation instructions (which also contains
 * a starting point node info).
 */
function locateRNodeByPath(path, lView) {
    const [referenceNode, ...navigationInstructions] = decompressNodeLocation(path);
    let ref;
    if (referenceNode === REFERENCE_NODE_HOST) {
        ref = lView[DECLARATION_COMPONENT_VIEW][HOST];
    }
    else if (referenceNode === REFERENCE_NODE_BODY) {
        ref = ɵɵresolveBody(lView[DECLARATION_COMPONENT_VIEW][HOST]);
    }
    else {
        const parentElementId = Number(referenceNode);
        ref = unwrapRNode(lView[parentElementId + HEADER_OFFSET]);
    }
    return navigateToNode(ref, navigationInstructions);
}
/**
 * Generate a list of DOM navigation operations to get from node `start` to node `finish`.
 *
 * Note: assumes that node `start` occurs before node `finish` in an in-order traversal of the DOM
 * tree. That is, we should be able to get from `start` to `finish` purely by using `.firstChild`
 * and `.nextSibling` operations.
 */
export function navigateBetween(start, finish) {
    if (start === finish) {
        return [];
    }
    else if (start.parentElement == null || finish.parentElement == null) {
        return null;
    }
    else if (start.parentElement === finish.parentElement) {
        return navigateBetweenSiblings(start, finish);
    }
    else {
        // `finish` is a child of its parent, so the parent will always have a child.
        const parent = finish.parentElement;
        const parentPath = navigateBetween(start, parent);
        const childPath = navigateBetween(parent.firstChild, finish);
        if (!parentPath || !childPath)
            return null;
        return [
            // First navigate to `finish`'s parent
            ...parentPath,
            // Then to its first child.
            NodeNavigationStep.FirstChild,
            // And finally from that node to `finish` (maybe a no-op if we're already there).
            ...childPath,
        ];
    }
}
/**
 * Calculates a path between 2 sibling nodes (generates a number of `NextSibling` navigations).
 * Returns `null` if no such path exists between the given nodes.
 */
function navigateBetweenSiblings(start, finish) {
    const nav = [];
    let node = null;
    for (node = start; node != null && node !== finish; node = node.nextSibling) {
        nav.push(NodeNavigationStep.NextSibling);
    }
    // If the `node` becomes `null` or `undefined` at the end, that means that we
    // didn't find the `end` node, thus return `null` (which would trigger serialization
    // error to be produced).
    return node == null ? null : nav;
}
/**
 * Calculates a path between 2 nodes in terms of `nextSibling` and `firstChild`
 * navigations:
 * - the `from` node is a known node, used as an starting point for the lookup
 *   (the `fromNodeName` argument is a string representation of the node).
 * - the `to` node is a node that the runtime logic would be looking up,
 *   using the path generated by this function.
 */
export function calcPathBetween(from, to, fromNodeName) {
    const path = navigateBetween(from, to);
    return path === null ? null : compressNodeLocation(fromNodeName, path);
}
/**
 * Invoked at serialization time (on the server) when a set of navigation
 * instructions needs to be generated for a TNode.
 */
export function calcPathForNode(tNode, lView) {
    let parentTNode = tNode.parent;
    let parentIndex;
    let parentRNode;
    let referenceNodeName;
    // Skip over all parent nodes that are disconnected from the DOM, such nodes
    // can not be used as anchors.
    //
    // This might happen in certain content projection-based use-cases, where
    // a content of an element is projected and used, when a parent element
    // itself remains detached from DOM. In this scenario we try to find a parent
    // element that is attached to DOM and can act as an anchor instead.
    while (parentTNode !== null && isDisconnectedNode(parentTNode, lView)) {
        parentTNode = parentTNode.parent;
    }
    if (parentTNode === null || !(parentTNode.type & 3 /* TNodeType.AnyRNode */)) {
        // If there is no parent TNode or a parent TNode does not represent an RNode
        // (i.e. not a DOM node), use component host element as a reference node.
        parentIndex = referenceNodeName = REFERENCE_NODE_HOST;
        parentRNode = lView[DECLARATION_COMPONENT_VIEW][HOST];
    }
    else {
        // Use parent TNode as a reference node.
        parentIndex = parentTNode.index;
        parentRNode = unwrapRNode(lView[parentIndex]);
        referenceNodeName = renderStringify(parentIndex - HEADER_OFFSET);
    }
    let rNode = unwrapRNode(lView[tNode.index]);
    if (tNode.type & 12 /* TNodeType.AnyContainer */) {
        // For <ng-container> nodes, instead of serializing a reference
        // to the anchor comment node, serialize a location of the first
        // DOM element. Paired with the container size (serialized as a part
        // of `ngh.containers`), it should give enough information for runtime
        // to hydrate nodes in this container.
        const firstRNode = getFirstNativeNode(lView, tNode);
        // If container is not empty, use a reference to the first element,
        // otherwise, rNode would point to an anchor comment node.
        if (firstRNode) {
            rNode = firstRNode;
        }
    }
    let path = calcPathBetween(parentRNode, rNode, referenceNodeName);
    if (path === null && parentRNode !== rNode) {
        // Searching for a path between elements within a host node failed.
        // Trying to find a path to an element starting from the `document.body` instead.
        //
        // Important note: this type of reference is relatively unstable, since Angular
        // may not be able to control parts of the page that the runtime logic navigates
        // through. This is mostly needed to cover "portals" use-case (like menus, dialog boxes,
        // etc), where nodes are content-projected (including direct DOM manipulations) outside
        // of the host node. The better solution is to provide APIs to work with "portals",
        // at which point this code path would not be needed.
        const body = parentRNode.ownerDocument.body;
        path = calcPathBetween(body, rNode, REFERENCE_NODE_BODY);
        if (path === null) {
            // If the path is still empty, it's likely that this node is detached and
            // won't be found during hydration.
            throw nodeNotFoundError(lView, tNode);
        }
    }
    return path;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9kZV9sb29rdXBfdXRpbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9oeWRyYXRpb24vbm9kZV9sb29rdXBfdXRpbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBSUgsT0FBTyxFQUFDLDBCQUEwQixFQUFFLGFBQWEsRUFBRSxJQUFJLEVBQWUsTUFBTSw0QkFBNEIsQ0FBQztBQUN6RyxPQUFPLEVBQUMsa0JBQWtCLEVBQUMsTUFBTSw4QkFBOEIsQ0FBQztBQUNoRSxPQUFPLEVBQUMsYUFBYSxFQUFDLE1BQU0sNEJBQTRCLENBQUM7QUFDekQsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLGlDQUFpQyxDQUFDO0FBQ2hFLE9BQU8sRUFBQyxnQkFBZ0IsRUFBRSxXQUFXLEVBQUMsTUFBTSw0QkFBNEIsQ0FBQztBQUN6RSxPQUFPLEVBQUMsYUFBYSxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFFN0MsT0FBTyxFQUFDLG9CQUFvQixFQUFFLHNCQUFzQixFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQzNFLE9BQU8sRUFBQyx1QkFBdUIsRUFBRSxpQkFBaUIsRUFBRSx5QkFBeUIsRUFBQyxNQUFNLGtCQUFrQixDQUFDO0FBQ3ZHLE9BQU8sRUFBaUIsa0JBQWtCLEVBQUUsS0FBSyxFQUFFLG1CQUFtQixFQUFFLG1CQUFtQixFQUFDLE1BQU0sY0FBYyxDQUFDO0FBQ2pILE9BQU8sRUFBQywyQkFBMkIsRUFBRSxjQUFjLEVBQUMsTUFBTSxTQUFTLENBQUM7QUFHcEUsa0VBQWtFO0FBQ2xFLFNBQVMsMkJBQTJCLENBQUMsS0FBWTtJQUMvQyxPQUFPLENBQUMsS0FBSyxDQUFDLElBQUksSUFBSSxLQUFLLENBQUMsTUFBTSxFQUFFLElBQUksdUNBQStCLENBQUM7QUFDMUUsQ0FBQztBQUVELGdFQUFnRTtBQUNoRSxTQUFTLGdCQUFnQixDQUFDLEtBQVk7SUFDcEMs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QXNFO1FBQ3RFLHNDQUFzQztRQUN0QyxNQUFNLFVBQVUsR0FBRyxrQkFBa0IsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFcEQsbUVBQW1FO1FBQ25FLDBEQUEwRDtRQUMxRCxJQUFJLFVBQVUsRUFBRSxDQUFDO1lBQ2YsS0FBSyxHQUFHLFVBQVUsQ0FBQztRQUNyQixDQUFDO0lBQ0gsQ0FBQztJQUNELElBQUksSUFBSSxHQUFnQixlQUFlLENBQUMsV0FBbUIsRUFBRSxLQUFhLEVBQUUsaUJBQWlCLENBQUMsQ0FBQztJQUMvRixJQUFJLElBQUksS0FBSyxJQUFJLElBQUksV0FBVyxLQUFLLEtBQUssRUFBRSxDQUFDO1FBQzNDLG1FQUFtRTtRQUNuRSxpRkFBaUY7UUFDakYsRUFBRTtRQUNGLCtFQUErRTtRQUMvRSxnRkFBZ0Y7UUFDaEYsd0ZBQXdGO1FBQ3hGLHVGQUF1RjtRQUN2RixtRkFBbUY7UUFDbkYscURBQXFEO1FBQ3JELE1BQU0sSUFBSSxHQUFJLFdBQW9CLENBQUMsYUFBYyxDQUFDLElBQVksQ0FBQztRQUMvRCxJQUFJLEdBQUcsZUFBZSxDQUFDLElBQUksRUFBRSxLQUFhLEVBQUUsbUJBQW1CLENBQUMsQ0FBQztRQUVqRSxJQUFJLElBQUksS0FBSyxJQUFJLEVBQUUsQ0FBQztZQUNsQix5RUFBeUU7WUFDekUsbUNBQW1DO1lBQ25DLE1BQU0saUJBQWlCLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ3hDLENBQUM7SUFDSCxDQUFDO0lBQ0QsT0FBTyxJQUFLLENBQUM7QUFDZixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7VE5vZGUsIFROb2RlVHlwZX0gZnJvbSAnLi4vcmVuZGVyMy9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtSRWxlbWVudCwgUk5vZGV9IGZyb20gJy4uL3JlbmRlcjMvaW50ZXJmYWNlcy9yZW5kZXJlcl9kb20nO1xuaW1wb3J0IHtERUNMQVJBVElPTl9DT01QT05FTlRfVklFVywgSEVBREVSX09GRlNFVCwgSE9TVCwgTFZpZXcsIFRWaWV3fSBmcm9tICcuLi9yZW5kZXIzL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2dldEZpcnN0TmF0aXZlTm9kZX0gZnJvbSAnLi4vcmVuZGVyMy9ub2RlX21hbmlwdWxhdGlvbic7XG5pbXBvcnQge8m1ybVyZXNvbHZlQm9keX0gZnJvbSAnLi4vcmVuZGVyMy91dGlsL21pc2NfdXRpbHMnO1xuaW1wb3J0IHtyZW5kZXJTdHJpbmdpZnl9IGZyb20gJy4uL3JlbmRlcjMvdXRpbC9zdHJpbmdpZnlfdXRpbHMnO1xuaW1wb3J0IHtnZXROYXRpdmVCeVROb2RlLCB1bndyYXBSTm9kZX0gZnJvbSAnLi4vcmVuZGVyMy91dGlsL3ZpZXdfdXRpbHMnO1xuaW1wb3J0IHthc3NlcnREZWZpbmVkfSBmcm9tICcuLi91dGlsL2Fzc2VydCc7XG5cbmltcG9ydCB7Y29tcHJlc3NOb2RlTG9jYXRpb24sIGRlY29tcHJlc3NOb2RlTG9jYXRpb259IGZyb20gJy4vY29tcHJlc3Npb24nO1xuaW1wb3J0IHtub2RlTm90Rm91bmRBdFBhdGhFcnJvciwgbm9kZU5vdEZvdW5kRXJyb3IsIHZhbGlkYXRlU2libGluZ05vZGVFeGlzdHN9IGZyb20gJy4vZXJyb3JfaGFuZGxpbmcnO1xuaW1wb3J0IHtEZWh5ZHJhdGVkVmlldywgTm9kZU5hdmlnYXRpb25TdGVwLCBOT0RFUywgUkVGRVJFTkNFX05PREVfQk9EWSwgUkVGRVJFTkNFX05PREVfSE9TVH0gZnJvbSAnLi9pbnRlcmZhY2VzJztcbmltcG9ydCB7Y2FsY1NlcmlhbGl6ZWRDb250YWluZXJTaXplLCBnZXRTZWdtZW50SGVhZH0gZnJvbSAnLi91dGlscyc7XG5cblxuLyoqIFdoZXRoZXIgY3VycmVudCBUTm9kZSBpcyBhIGZpcnN0IG5vZGUgaW4gYW4gPG5nLWNvbnRhaW5lcj4uICovXG5mdW5jdGlvbiBpc0ZpcnN0RWxlbWVudEluTmdDb250YWluZXIodE5vZGU6IFROb2RlKTogYm9vbGVhbiB7XG4gIHJldHVybiAhdE5vZGUucHJldiAmJiB0Tm9kZS5wYXJlbnQ/LnR5cGUgPT09IFROb2RlVHlwZS5FbGVtZW50Q29udGFpbmVyO1xufVxuXG4vKiogUmV0dXJucyBhbiBpbnN0cnVjdGlvbiBpbmRleCAoc3VidHJhY3RpbmcgSEVBREVSX09GRlNFVCkuICovXG5mdW5jdGlvbiBnZXROb09mZnNldEluZGV4KHROb2RlOiBUTm9kZSk6IG51bWJlciB7XG4gIHJldHVybiB0Tm9kZS5pbmRleCAtIEhFQURFUl9PRkZTRVQ7XG59XG5cbi8qKlxuICogQ2hlY2sgd2hldGhlciBhIGdpdmVuIG5vZGUgZXhpc3RzLCBidXQgaXMgZGlzY29ubmVjdGVkIGZyb20gdGhlIERPTS5cbiAqXG4gKiBOb3RlOiB3ZSBsZXZlcmFnZSB0aGUgZmFjdCB0aGF0IHdlIGhhdmUgdGhpcyBpbmZvcm1hdGlvbiBhdmFpbGFibGUgaW4gdGhlIERPTSBlbXVsYXRpb25cbiAqIGxheWVyIChpbiBEb21pbm8pIGZvciBub3cuIExvbmdlci10ZXJtIHNvbHV0aW9uIHNob3VsZCBub3QgcmVseSBvbiB0aGUgRE9NIGVtdWxhdGlvbiBhbmRcbiAqIG9ubHkgdXNlIGludGVybmFsIGRhdGEgc3RydWN0dXJlcyBhbmQgc3RhdGUgdG8gY29tcHV0ZSB0aGlzIGluZm9ybWF0aW9uLlxuICovXG5leHBvcnQgZnVuY3Rpb24gaXNEaXNjb25uZWN0ZWROb2RlKHROb2RlOiBUTm9kZSwgbFZpZXc6IExWaWV3KSB7XG4gIHJldHVybiAhKHROb2RlLnR5cGUgJiBUTm9kZVR5cGUuUHJvamVjdGlvbikgJiYgISFsVmlld1t0Tm9kZS5pbmRleF0gJiZcbiAgICAgICEodW53cmFwUk5vZGUobFZpZXdbdE5vZGUuaW5kZXhdKSBhcyBOb2RlKT8uaXNDb25uZWN0ZWQ7XG59XG5cbi8qKlxuICogTG9jYXRlIGEgbm9kZSBpbiBET00gdHJlZSB0aGF0IGNvcnJlc3BvbmRzIHRvIGEgZ2l2ZW4gVE5vZGUuXG4gKlxuICogQHBhcmFtIGh5ZHJhdGlvbkluZm8gVGhlIGh5ZHJhdGlvbiBhbm5vdGF0aW9uIGRhdGFcbiAqIEBwYXJhbSB0VmlldyB0aGUgY3VycmVudCB0Vmlld1xuICogQHBhcmFtIGxWaWV3IHRoZSBjdXJyZW50IGxWaWV3XG4gKiBAcGFyYW0gdE5vZGUgdGhlIGN1cnJlbnQgdE5vZGVcbiAqIEByZXR1cm5zIGFuIFJOb2RlIHRoYXQgcmVwcmVzZW50cyBhIGdpdmVuIHROb2RlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBsb2NhdGVOZXh0Uk5vZGU8VCBleHRlbmRzIFJOb2RlPihcbiAgICBoeWRyYXRpb25JbmZvOiBEZWh5ZHJhdGVkVmlldywgdFZpZXc6IFRWaWV3LCBsVmlldzogTFZpZXc8dW5rbm93bj4sIHROb2RlOiBUTm9kZSk6IFR8bnVsbCB7XG4gIGxldCBuYXRpdmU6IFJOb2RlfG51bGwgPSBudWxsO1xuICBjb25zdCBub09mZnNldEluZGV4ID0gZ2V0Tm9PZmZzZXRJbmRleCh0Tm9kZSk7XG4gIGNvbnN0IG5vZGVzID0gaHlkcmF0aW9uSW5mby5kYXRhW05PREVTXTtcbiAgaWYgKG5vZGVzPy5bbm9PZmZzZXRJbmRleF0pIHtcbiAgICAvLyBXZSBrbm93IHRoZSBleGFjdCBsb2NhdGlvbiBvZiB0aGUgbm9kZS5cbiAgICBuYXRpdmUgPSBsb2NhdGVSTm9kZUJ5UGF0aChub2Rlc1tub09mZnNldEluZGV4XSwgbFZpZXcpO1xuICB9IGVsc2UgaWYgKHRWaWV3LmZpcnN0Q2hpbGQgPT09IHROb2RlKSB7XG4gICAgLy8gV2UgY3JlYXRlIGEgZmlyc3Qgbm9kZSBpbiB0aGlzIHZpZXcsIHNvIHdlIHVzZSBhIHJlZmVyZW5jZVxuICAgIC8vIHRvIHRoZSBmaXJzdCBjaGlsZCBpbiB0aGlzIERPTSBzZWdtZW50LlxuICAgIG5hdGl2ZSA9IGh5ZHJhdGlvbkluZm8uZmlyc3RDaGlsZDtcbiAgfSBlbHNlIHtcbiAgICAvLyBMb2NhdGUgYSBub2RlIGJhc2VkIG9uIGEgcHJldmlvdXMgc2libGluZyBvciBhIHBhcmVudCBub2RlLlxuICAgIGNvbnN0IHByZXZpb3VzVE5vZGVQYXJlbnQgPSB0Tm9kZS5wcmV2ID09PSBudWxsO1xuICAgIGNvbnN0IHByZXZpb3VzVE5vZGUgPSAodE5vZGUucHJldiA/PyB0Tm9kZS5wYXJlbnQpITtcbiAgICBuZ0Rldk1vZGUgJiZcbiAgICAgICAgYXNzZXJ0RGVmaW5lZChcbiAgICAgICAgICAgIHByZXZpb3VzVE5vZGUsXG4gICAgICAgICAgICAnVW5leHBlY3RlZCBzdGF0ZTogY3VycmVudCBUTm9kZSBkb2VzIG5vdCBoYXZlIGEgY29ubmVjdGlvbiAnICtcbiAgICAgICAgICAgICAgICAndG8gdGhlIHByZXZpb3VzIG5vZGUgb3IgYSBwYXJlbnQgbm9kZS4nKTtcbiAgICBpZiAoaXNGaXJzdEVsZW1lbnRJbk5nQ29udGFpbmVyKHROb2RlKSkge1xuICAgICAgY29uc3Qgbm9PZmZzZXRQYXJlbnRJbmRleCA9IGdldE5vT2Zmc2V0SW5kZXgodE5vZGUucGFyZW50ISk7XG4gICAgICBuYXRpdmUgPSBnZXRTZWdtZW50SGVhZChoeWRyYXRpb25JbmZvLCBub09mZnNldFBhcmVudEluZGV4KTtcbiAgICB9IGVsc2Uge1xuICAgICAgbGV0IHByZXZpb3VzUkVsZW1lbnQgPSBnZXROYXRpdmVCeVROb2RlKHByZXZpb3VzVE5vZGUsIGxWaWV3KTtcbiAgICAgIGlmIChwcmV2aW91c1ROb2RlUGFyZW50KSB7XG4gICAgICAgIG5hdGl2ZSA9IChwcmV2aW91c1JFbGVtZW50IGFzIFJFbGVtZW50KS5maXJzdENoaWxkO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gSWYgdGhlIHByZXZpb3VzIG5vZGUgaXMgYW4gZWxlbWVudCwgYnV0IGl0IGFsc28gaGFzIGNvbnRhaW5lciBpbmZvLFxuICAgICAgICAvLyB0aGlzIG1lYW5zIHRoYXQgd2UgYXJlIHByb2Nlc3NpbmcgYSBub2RlIGxpa2UgYDxkaXYgI3ZjclRhcmdldD5gLCB3aGljaCBpc1xuICAgICAgICAvLyByZXByZXNlbnRlZCBpbiB0aGUgRE9NIGFzIGA8ZGl2PjwvZGl2Pi4uLjwhLS1jb250YWluZXItLT5gLlxuICAgICAgICAvLyBJbiB0aGlzIGNhc2UsIHRoZXJlIGFyZSBub2RlcyAqYWZ0ZXIqIHRoaXMgZWxlbWVudCBhbmQgd2UgbmVlZCB0byBza2lwXG4gICAgICAgIC8vIGFsbCBvZiB0aGVtIHRvIHJlYWNoIGFuIGVsZW1lbnQgdGhhdCB3ZSBhcmUgbG9va2luZyBmb3IuXG4gICAgICAgIGNvbnN0IG5vT2Zmc2V0UHJldlNpYmxpbmdJbmRleCA9IGdldE5vT2Zmc2V0SW5kZXgocHJldmlvdXNUTm9kZSk7XG4gICAgICAgIGNvbnN0IHNlZ21lbnRIZWFkID0gZ2V0U2VnbWVudEhlYWQoaHlkcmF0aW9uSW5mbywgbm9PZmZzZXRQcmV2U2libGluZ0luZGV4KTtcbiAgICAgICAgaWYgKHByZXZpb3VzVE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkVsZW1lbnQgJiYgc2VnbWVudEhlYWQpIHtcbiAgICAgICAgICBjb25zdCBudW1Sb290Tm9kZXNUb1NraXAgPVxuICAgICAgICAgICAgICBjYWxjU2VyaWFsaXplZENvbnRhaW5lclNpemUoaHlkcmF0aW9uSW5mbywgbm9PZmZzZXRQcmV2U2libGluZ0luZGV4KTtcbiAgICAgICAgICAvLyBgKzFgIHN0YW5kcyBmb3IgYW4gYW5jaG9yIGNvbW1lbnQgbm9kZSBhZnRlciBhbGwgdGhlIHZpZXdzIGluIHRoaXMgY29udGFpbmVyLlxuICAgICAgICAgIGNvbnN0IG5vZGVzVG9Ta2lwID0gbnVtUm9vdE5vZGVzVG9Ta2lwICsgMTtcbiAgICAgICAgICAvLyBGaXJzdCBub2RlIGFmdGVyIHRoaXMgc2VnbWVudC5cbiAgICAgICAgICBuYXRpdmUgPSBzaWJsaW5nQWZ0ZXIobm9kZXNUb1NraXAsIHNlZ21lbnRIZWFkKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBuYXRpdmUgPSBwcmV2aW91c1JFbGVtZW50Lm5leHRTaWJsaW5nO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBuYXRpdmUgYXMgVDtcbn1cblxuLyoqXG4gKiBTa2lwcyBvdmVyIGEgc3BlY2lmaWVkIG51bWJlciBvZiBub2RlcyBhbmQgcmV0dXJucyB0aGUgbmV4dCBzaWJsaW5nIG5vZGUgYWZ0ZXIgdGhhdC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNpYmxpbmdBZnRlcjxUIGV4dGVuZHMgUk5vZGU+KHNraXA6IG51bWJlciwgZnJvbTogUk5vZGUpOiBUfG51bGwge1xuICBsZXQgY3VycmVudE5vZGUgPSBmcm9tO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IHNraXA7IGkrKykge1xuICAgIG5nRGV2TW9kZSAmJiB2YWxpZGF0ZVNpYmxpbmdOb2RlRXhpc3RzKGN1cnJlbnROb2RlKTtcbiAgICBjdXJyZW50Tm9kZSA9IGN1cnJlbnROb2RlLm5leHRTaWJsaW5nITtcbiAgfVxuICByZXR1cm4gY3VycmVudE5vZGUgYXMgVDtcbn1cblxuLyoqXG4gKiBIZWxwZXIgZnVuY3Rpb24gdG8gcHJvZHVjZSBhIHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiB0aGUgbmF2aWdhdGlvbiBzdGVwc1xuICogKGluIHRlcm1zIG9mIGBuZXh0U2libGluZ2AgYW5kIGBmaXJzdENoaWxkYCBuYXZpZ2F0aW9ucykuIFVzZWQgaW4gZXJyb3JcbiAqIG1lc3NhZ2VzIGluIGRldiBtb2RlLlxuICovXG5mdW5jdGlvbiBzdHJpbmdpZnlOYXZpZ2F0aW9uSW5zdHJ1Y3Rpb25zKGluc3RydWN0aW9uczogKG51bWJlcnxOb2RlTmF2aWdhdGlvblN0ZXApW10pOiBzdHJpbmcge1xuICBjb25zdCBjb250YWluZXIgPSBbXTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBpbnN0cnVjdGlvbnMubGVuZ3RoOyBpICs9IDIpIHtcbiAgICBjb25zdCBzdGVwID0gaW5zdHJ1Y3Rpb25zW2ldO1xuICAgIGNvbnN0IHJlcGVhdCA9IGluc3RydWN0aW9uc1tpICsgMV0gYXMgbnVtYmVyO1xuICAgIGZvciAobGV0IHIgPSAwOyByIDwgcmVwZWF0OyByKyspIHtcbiAgICAgIGNvbnRhaW5lci5wdXNoKHN0ZXAgPT09IE5vZGVOYXZpZ2F0aW9uU3RlcC5GaXJzdENoaWxkID8gJ2ZpcnN0Q2hpbGQnIDogJ25leHRTaWJsaW5nJyk7XG4gICAgfVxuICB9XG4gIHJldHVybiBjb250YWluZXIuam9pbignLicpO1xufVxuXG4vKipcbiAqIEhlbHBlciBmdW5jdGlvbiB0aGF0IG5hdmlnYXRlcyBmcm9tIGEgc3RhcnRpbmcgcG9pbnQgbm9kZSAodGhlIGBmcm9tYCBub2RlKVxuICogdXNpbmcgcHJvdmlkZWQgc2V0IG9mIG5hdmlnYXRpb24gaW5zdHJ1Y3Rpb25zICh3aXRoaW4gYHBhdGhgIGFyZ3VtZW50KS5cbiAqL1xuZnVuY3Rpb24gbmF2aWdhdGVUb05vZGUoZnJvbTogTm9kZSwgaW5zdHJ1Y3Rpb25zOiAobnVtYmVyfE5vZGVOYXZpZ2F0aW9uU3RlcClbXSk6IFJOb2RlIHtcbiAgbGV0IG5vZGUgPSBmcm9tO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGluc3RydWN0aW9ucy5sZW5ndGg7IGkgKz0gMikge1xuICAgIGNvbnN0IHN0ZXAgPSBpbnN0cnVjdGlvbnNbaV07XG4gICAgY29uc3QgcmVwZWF0ID0gaW5zdHJ1Y3Rpb25zW2kgKyAxXSBhcyBudW1iZXI7XG4gICAgZm9yIChsZXQgciA9IDA7IHIgPCByZXBlYXQ7IHIrKykge1xuICAgICAgaWYgKG5nRGV2TW9kZSAmJiAhbm9kZSkge1xuICAgICAgICB0aHJvdyBub2RlTm90Rm91bmRBdFBhdGhFcnJvcihmcm9tLCBzdHJpbmdpZnlOYXZpZ2F0aW9uSW5zdHJ1Y3Rpb25zKGluc3RydWN0aW9ucykpO1xuICAgICAgfVxuICAgICAgc3dpdGNoIChzdGVwKSB7XG4gICAgICAgIGNhc2UgTm9kZU5hdmlnYXRpb25TdGVwLkZpcnN0Q2hpbGQ6XG4gICAgICAgICAgbm9kZSA9IG5vZGUuZmlyc3RDaGlsZCE7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgTm9kZU5hdmlnYXRpb25TdGVwLk5leHRTaWJsaW5nOlxuICAgICAgICAgIG5vZGUgPSBub2RlLm5leHRTaWJsaW5nITtcbiAgICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgaWYgKG5nRGV2TW9kZSAmJiAhbm9kZSkge1xuICAgIHRocm93IG5vZGVOb3RGb3VuZEF0UGF0aEVycm9yKGZyb20sIHN0cmluZ2lmeU5hdmlnYXRpb25JbnN0cnVjdGlvbnMoaW5zdHJ1Y3Rpb25zKSk7XG4gIH1cbiAgcmV0dXJuIG5vZGUgYXMgUk5vZGU7XG59XG5cbi8qKlxuICogTG9jYXRlcyBhbiBSTm9kZSBnaXZlbiBhIHNldCBvZiBuYXZpZ2F0aW9uIGluc3RydWN0aW9ucyAod2hpY2ggYWxzbyBjb250YWluc1xuICogYSBzdGFydGluZyBwb2ludCBub2RlIGluZm8pLlxuICovXG5mdW5jdGlvbiBsb2NhdGVSTm9kZUJ5UGF0aChwYXRoOiBzdHJpbmcsIGxWaWV3OiBMVmlldyk6IFJOb2RlIHtcbiAgY29uc3QgW3JlZmVyZW5jZU5vZGUsIC4uLm5hdmlnYXRpb25JbnN0cnVjdGlvbnNdID0gZGVjb21wcmVzc05vZGVMb2NhdGlvbihwYXRoKTtcbiAgbGV0IHJlZjogRWxlbWVudDtcbiAgaWYgKHJlZmVyZW5jZU5vZGUgPT09IFJFRkVSRU5DRV9OT0RFX0hPU1QpIHtcbiAgICByZWYgPSBsVmlld1tERUNMQVJBVElPTl9DT01QT05FTlRfVklFV11bSE9TVF0gYXMgdW5rbm93biBhcyBFbGVtZW50O1xuICB9IGVsc2UgaWYgKHJlZmVyZW5jZU5vZGUgPT09IFJFRkVSRU5DRV9OT0RFX0JPRFkpIHtcbiAgICByZWYgPSDJtcm1cmVzb2x2ZUJvZHkoXG4gICAgICAgIGxWaWV3W0RFQ0xBUkFUSU9OX0NPTVBPTkVOVF9WSUVXXVtIT1NUXSBhcyBSRWxlbWVudCAmIHtvd25lckRvY3VtZW50OiBEb2N1bWVudH0pO1xuICB9IGVsc2Uge1xuICAgIGNvbnN0IHBhcmVudEVsZW1lbnRJZCA9IE51bWJlcihyZWZlcmVuY2VOb2RlKTtcbiAgICByZWYgPSB1bndyYXBSTm9kZSgobFZpZXcgYXMgYW55KVtwYXJlbnRFbGVtZW50SWQgKyBIRUFERVJfT0ZGU0VUXSkgYXMgRWxlbWVudDtcbiAgfVxuICByZXR1cm4gbmF2aWdhdGVUb05vZGUocmVmLCBuYXZpZ2F0aW9uSW5zdHJ1Y3Rpb25zKTtcbn1cblxuLyoqXG4gKiBHZW5lcmF0ZSBhIGxpc3Qgb2YgRE9NIG5hdmlnYXRpb24gb3BlcmF0aW9ucyB0byBnZXQgZnJvbSBub2RlIGBzdGFydGAgdG8gbm9kZSBgZmluaXNoYC5cbiAqXG4gKiBOb3RlOiBhc3N1bWVzIHRoYXQgbm9kZSBgc3RhcnRgIG9jY3VycyBiZWZvcmUgbm9kZSBgZmluaXNoYCBpbiBhbiBpbi1vcmRlciB0cmF2ZXJzYWwgb2YgdGhlIERPTVxuICogdHJlZS4gVGhhdCBpcywgd2Ugc2hvdWxkIGJlIGFibGUgdG8gZ2V0IGZyb20gYHN0YXJ0YCB0byBgZmluaXNoYCBwdXJlbHkgYnkgdXNpbmcgYC5maXJzdENoaWxkYFxuICogYW5kIGAubmV4dFNpYmxpbmdgIG9wZXJhdGlvbnMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBuYXZpZ2F0ZUJldHdlZW4oc3RhcnQ6IE5vZGUsIGZpbmlzaDogTm9kZSk6IE5vZGVOYXZpZ2F0aW9uU3RlcFtdfG51bGwge1xuICBpZiAoc3RhcnQgPT09IGZpbmlzaCkge1xuICAgIHJldHVybiBbXTtcbiAgfSBlbHNlIGlmIChzdGFydC5wYXJlbnRFbGVtZW50ID09IG51bGwgfHwgZmluaXNoLnBhcmVudEVsZW1lbnQgPT0gbnVsbCkge1xuICAgIHJldHVybiBudWxsO1xuICB9IGVsc2UgaWYgKHN0YXJ0LnBhcmVudEVsZW1lbnQgPT09IGZpbmlzaC5wYXJlbnRFbGVtZW50KSB7XG4gICAgcmV0dXJuIG5hdmlnYXRlQmV0d2VlblNpYmxpbmdzKHN0YXJ0LCBmaW5pc2gpO1xuICB9IGVsc2Uge1xuICAgIC8vIGBmaW5pc2hgIGlzIGEgY2hpbGQgb2YgaXRzIHBhcmVudCwgc28gdGhlIHBhcmVudCB3aWxsIGFsd2F5cyBoYXZlIGEgY2hpbGQuXG4gICAgY29uc3QgcGFyZW50ID0gZmluaXNoLnBhcmVudEVsZW1lbnQhO1xuXG4gICAgY29uc3QgcGFyZW50UGF0aCA9IG5hdmlnYXRlQmV0d2VlbihzdGFydCwgcGFyZW50KTtcbiAgICBjb25zdCBjaGlsZFBhdGggPSBuYXZpZ2F0ZUJldHdlZW4ocGFyZW50LmZpcnN0Q2hpbGQhLCBmaW5pc2gpO1xuICAgIGlmICghcGFyZW50UGF0aCB8fCAhY2hpbGRQYXRoKSByZXR1cm4gbnVsbDtcblxuICAgIHJldHVybiBbXG4gICAgICAvLyBGaXJzdCBuYXZpZ2F0ZSB0byBgZmluaXNoYCdzIHBhcmVudFxuICAgICAgLi4ucGFyZW50UGF0aCxcbiAgICAgIC8vIFRoZW4gdG8gaXRzIGZpcnN0IGNoaWxkLlxuICAgICAgTm9kZU5hdmlnYXRpb25TdGVwLkZpcnN0Q2hpbGQsXG4gICAgICAvLyBBbmQgZmluYWxseSBmcm9tIHRoYXQgbm9kZSB0byBgZmluaXNoYCAobWF5YmUgYSBuby1vcCBpZiB3ZSdyZSBhbHJlYWR5IHRoZXJlKS5cbiAgICAgIC4uLmNoaWxkUGF0aCxcbiAgICBdO1xuICB9XG59XG5cbi8qKlxuICogQ2FsY3VsYXRlcyBhIHBhdGggYmV0d2VlbiAyIHNpYmxpbmcgbm9kZXMgKGdlbmVyYXRlcyBhIG51bWJlciBvZiBgTmV4dFNpYmxpbmdgIG5hdmlnYXRpb25zKS5cbiAqIFJldHVybnMgYG51bGxgIGlmIG5vIHN1Y2ggcGF0aCBleGlzdHMgYmV0d2VlbiB0aGUgZ2l2ZW4gbm9kZXMuXG4gKi9cbmZ1bmN0aW9uIG5hdmlnYXRlQmV0d2VlblNpYmxpbmdzKHN0YXJ0OiBOb2RlLCBmaW5pc2g6IE5vZGUpOiBOb2RlTmF2aWdhdGlvblN0ZXBbXXxudWxsIHtcbiAgY29uc3QgbmF2OiBOb2RlTmF2aWdhdGlvblN0ZXBbXSA9IFtdO1xuICBsZXQgbm9kZTogTm9kZXxudWxsID0gbnVsbDtcbiAgZm9yIChub2RlID0gc3RhcnQ7IG5vZGUgIT0gbnVsbCAmJiBub2RlICE9PSBmaW5pc2g7IG5vZGUgPSBub2RlLm5leHRTaWJsaW5nKSB7XG4gICAgbmF2LnB1c2goTm9kZU5hdmlnYXRpb25TdGVwLk5leHRTaWJsaW5nKTtcbiAgfVxuICAvLyBJZiB0aGUgYG5vZGVgIGJlY29tZXMgYG51bGxgIG9yIGB1bmRlZmluZWRgIGF0IHRoZSBlbmQsIHRoYXQgbWVhbnMgdGhhdCB3ZVxuICAvLyBkaWRuJ3QgZmluZCB0aGUgYGVuZGAgbm9kZSwgdGh1cyByZXR1cm4gYG51bGxgICh3aGljaCB3b3VsZCB0cmlnZ2VyIHNlcmlhbGl6YXRpb25cbiAgLy8gZXJyb3IgdG8gYmUgcHJvZHVjZWQpLlxuICByZXR1cm4gbm9kZSA9PSBudWxsID8gbnVsbCA6IG5hdjtcbn1cblxuLyoqXG4gKiBDYWxjdWxhdGVzIGEgcGF0aCBiZXR3ZWVuIDIgbm9kZXMgaW4gdGVybXMgb2YgYG5leHRTaWJsaW5nYCBhbmQgYGZpcnN0Q2hpbGRgXG4gKiBuYXZpZ2F0aW9uczpcbiAqIC0gdGhlIGBmcm9tYCBub2RlIGlzIGEga25vd24gbm9kZSwgdXNlZCBhcyBhbiBzdGFydGluZyBwb2ludCBmb3IgdGhlIGxvb2t1cFxuICogICAodGhlIGBmcm9tTm9kZU5hbWVgIGFyZ3VtZW50IGlzIGEgc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBub2RlKS5cbiAqIC0gdGhlIGB0b2Agbm9kZSBpcyBhIG5vZGUgdGhhdCB0aGUgcnVudGltZSBsb2dpYyB3b3VsZCBiZSBsb29raW5nIHVwLFxuICogICB1c2luZyB0aGUgcGF0aCBnZW5lcmF0ZWQgYnkgdGhpcyBmdW5jdGlvbi5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNhbGNQYXRoQmV0d2Vlbihmcm9tOiBOb2RlLCB0bzogTm9kZSwgZnJvbU5vZGVOYW1lOiBzdHJpbmcpOiBzdHJpbmd8bnVsbCB7XG4gIGNvbnN0IHBhdGggPSBuYXZpZ2F0ZUJldHdlZW4oZnJvbSwgdG8pO1xuICByZXR1cm4gcGF0aCA9PT0gbnVsbCA/IG51bGwgOiBjb21wcmVzc05vZGVMb2NhdGlvbihmcm9tTm9kZU5hbWUsIHBhdGgpO1xufVxuXG4vKipcbiAqIEludm9rZWQgYXQgc2VyaWFsaXphdGlvbiB0aW1lIChvbiB0aGUgc2VydmVyKSB3aGVuIGEgc2V0IG9mIG5hdmlnYXRpb25cbiAqIGluc3RydWN0aW9ucyBuZWVkcyB0byBiZSBnZW5lcmF0ZWQgZm9yIGEgVE5vZGUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjYWxjUGF0aEZvck5vZGUodE5vZGU6IFROb2RlLCBsVmlldzogTFZpZXcpOiBzdHJpbmcge1xuICBsZXQgcGFyZW50VE5vZGUgPSB0Tm9kZS5wYXJlbnQ7XG4gIGxldCBwYXJlbnRJbmRleDogbnVtYmVyfHN0cmluZztcbiAgbGV0IHBhcmVudFJOb2RlOiBSTm9kZTtcbiAgbGV0IHJlZmVyZW5jZU5vZGVOYW1lOiBzdHJpbmc7XG5cbiAgLy8gU2tpcCBvdmVyIGFsbCBwYXJlbnQgbm9kZXMgdGhhdCBhcmUgZGlzY29ubmVjdGVkIGZyb20gdGhlIERPTSwgc3VjaCBub2Rlc1xuICAvLyBjYW4gbm90IGJlIHVzZWQgYXMgYW5jaG9ycy5cbiAgLy9cbiAgLy8gVGhpcyBtaWdodCBoYXBwZW4gaW4gY2VydGFpbiBjb250ZW50IHByb2plY3Rpb24tYmFzZWQgdXNlLWNhc2VzLCB3aGVyZVxuICAvLyBhIGNvbnRlbnQgb2YgYW4gZWxlbWVudCBpcyBwcm9qZWN0ZWQgYW5kIHVzZWQsIHdoZW4gYSBwYXJlbnQgZWxlbWVudFxuICAvLyBpdHNlbGYgcmVtYWlucyBkZXRhY2hlZCBmcm9tIERPTS4gSW4gdGhpcyBzY2VuYXJpbyB3ZSB0cnkgdG8gZmluZCBhIHBhcmVudFxuICAvLyBlbGVtZW50IHRoYXQgaXMgYXR0YWNoZWQgdG8gRE9NIGFuZCBjYW4gYWN0IGFzIGFuIGFuY2hvciBpbnN0ZWFkLlxuICB3aGlsZSAocGFyZW50VE5vZGUgIT09IG51bGwgJiYgaXNEaXNjb25uZWN0ZWROb2RlKHBhcmVudFROb2RlLCBsVmlldykpIHtcbiAgICBwYXJlbnRUTm9kZSA9IHBhcmVudFROb2RlLnBhcmVudDtcbiAgfVxuXG4gIGlmIChwYXJlbnRUTm9kZSA9PT0gbnVsbCB8fCAhKHBhcmVudFROb2RlLnR5cGUgJiBUTm9kZVR5cGUuQW55Uk5vZGUpKSB7XG4gICAgLy8gSWYgdGhlcmUgaXMgbm8gcGFyZW50IFROb2RlIG9yIGEgcGFyZW50IFROb2RlIGRvZXMgbm90IHJlcHJlc2VudCBhbiBSTm9kZVxuICAgIC8vIChpLmUuIG5vdCBhIERPTSBub2RlKSwgdXNlIGNvbXBvbmVudCBob3N0IGVsZW1lbnQgYXMgYSByZWZlcmVuY2Ugbm9kZS5cbiAgICBwYXJlbnRJbmRleCA9IHJlZmVyZW5jZU5vZGVOYW1lID0gUkVGRVJFTkNFX05PREVfSE9TVDtcbiAgICBwYXJlbnRSTm9kZSA9IGxWaWV3W0RFQ0xBUkFUSU9OX0NPTVBPTkVOVF9WSUVXXVtIT1NUXSE7XG4gIH0gZWxzZSB7XG4gICAgLy8gVXNlIHBhcmVudCBUTm9kZSBhcyBhIHJlZmVyZW5jZSBub2RlLlxuICAgIHBhcmVudEluZGV4ID0gcGFyZW50VE5vZGUuaW5kZXg7XG4gICAgcGFyZW50Uk5vZGUgPSB1bndyYXBSTm9kZShsVmlld1twYXJlbnRJbmRleF0pO1xuICAgIHJlZmVyZW5jZU5vZGVOYW1lID0gcmVuZGVyU3RyaW5naWZ5KHBhcmVudEluZGV4IC0gSEVBREVSX09GRlNFVCk7XG4gIH1cbiAgbGV0IHJOb2RlID0gdW53cmFwUk5vZGUobFZpZXdbdE5vZGUuaW5kZXhdKTtcbiAgaWYgKHROb2RlLnR5cGUgJiBUTm9kZVR5cGUuQW55Q29udGFpbmVyKSB7XG4gICAgLy8gRm9yIDxuZy1jb250YWluZXI+IG5vZGVzLCBpbnN0ZWFkIG9mIHNlcmlhbGl6aW5nIGEgcmVmZXJlbmNlXG4gICAgLy8gdG8gdGhlIGFuY2hvciBjb21tZW50IG5vZGUsIHNlcmlhbGl6ZSBhIGxvY2F0aW9uIG9mIHRoZSBmaXJzdFxuICAgIC8vIERPTSBlbGVtZW50LiBQYWlyZWQgd2l0aCB0aGUgY29udGFpbmVyIHNpemUgKHNlcmlhbGl6ZWQgYXMgYSBwYXJ0XG4gICAgLy8gb2YgYG5naC5jb250YWluZXJzYCksIGl0IHNob3VsZCBnaXZlIGVub3VnaCBpbmZvcm1hdGlvbiBmb3IgcnVudGltZVxuICAgIC8vIHRvIGh5ZHJhdGUgbm9kZXMgaW4gdGhpcyBjb250YWluZXIuXG4gICAgY29uc3QgZmlyc3RSTm9kZSA9IGdldEZpcnN0TmF0aXZlTm9kZShsVmlldywgdE5vZGUpO1xuXG4gICAgLy8gSWYgY29udGFpbmVyIGlzIG5vdCBlbXB0eSwgdXNlIGEgcmVmZXJlbmNlIHRvIHRoZSBmaXJzdCBlbGVtZW50LFxuICAgIC8vIG90aGVyd2lzZSwgck5vZGUgd291bGQgcG9pbnQgdG8gYW4gYW5jaG9yIGNvbW1lbnQgbm9kZS5cbiAgICBpZiAoZmlyc3RSTm9kZSkge1xuICAgICAgck5vZGUgPSBmaXJzdFJOb2RlO1xuICAgIH1cbiAgfVxuICBsZXQgcGF0aDogc3RyaW5nfG51bGwgPSBjYWxjUGF0aEJldHdlZW4ocGFyZW50Uk5vZGUgYXMgTm9kZSwgck5vZGUgYXMgTm9kZSwgcmVmZXJlbmNlTm9kZU5hbWUpO1xuICBpZiAocGF0aCA9PT0gbnVsbCAmJiBwYXJlbnRSTm9kZSAhPT0gck5vZGUpIHtcbiAgICAvLyBTZWFyY2hpbmcgZm9yIGEgcGF0aCBiZXR3ZWVuIGVsZW1lbnRzIHdpdGhpbiBhIGhvc3Qgbm9kZSBmYWlsZWQuXG4gICAgLy8gVHJ5aW5nIHRvIGZpbmQgYSBwYXRoIHRvIGFuIGVsZW1lbnQgc3RhcnRpbmcgZnJvbSB0aGUgYGRvY3VtZW50LmJvZHlgIGluc3RlYWQuXG4gICAgLy9cbiAgICAvLyBJbXBvcnRhbnQgbm90ZTogdGhpcyB0eXBlIG9mIHJlZmVyZW5jZSBpcyByZWxhdGl2ZWx5IHVuc3RhYmxlLCBzaW5jZSBBbmd1bGFyXG4gICAgLy8gbWF5IG5vdCBiZSBhYmxlIHRvIGNvbnRyb2wgcGFydHMgb2YgdGhlIHBhZ2UgdGhhdCB0aGUgcnVudGltZSBsb2dpYyBuYXZpZ2F0ZXNcbiAgICAvLyB0aHJvdWdoLiBUaGlzIGlzIG1vc3RseSBuZWVkZWQgdG8gY292ZXIgXCJwb3J0YWxzXCIgdXNlLWNhc2UgKGxpa2UgbWVudXMsIGRpYWxvZyBib3hlcyxcbiAgICAvLyBldGMpLCB3aGVyZSBub2RlcyBhcmUgY29udGVudC1wcm9qZWN0ZWQgKGluY2x1ZGluZyBkaXJlY3QgRE9NIG1hbmlwdWxhdGlvbnMpIG91dHNpZGVcbiAgICAvLyBvZiB0aGUgaG9zdCBub2RlLiBUaGUgYmV0dGVyIHNvbHV0aW9uIGlzIHRvIHByb3ZpZGUgQVBJcyB0byB3b3JrIHdpdGggXCJwb3J0YWxzXCIsXG4gICAgLy8gYXQgd2hpY2ggcG9pbnQgdGhpcyBjb2RlIHBhdGggd291bGQgbm90IGJlIG5lZWRlZC5cbiAgICBjb25zdCBib2R5ID0gKHBhcmVudFJOb2RlIGFzIE5vZGUpLm93bmVyRG9jdW1lbnQhLmJvZHkgYXMgTm9kZTtcbiAgICBwYXRoID0gY2FsY1BhdGhCZXR3ZWVuKGJvZHksIHJOb2RlIGFzIE5vZGUsIFJFRkVSRU5DRV9OT0RFX0JPRFkpO1xuXG4gICAgaWYgKHBhdGggPT09IG51bGwpIHtcbiAgICAgIC8vIElmIHRoZSBwYXRoIGlzIHN0aWxsIGVtcHR5LCBpdCdzIGxpa2VseSB0aGF0IHRoaXMgbm9kZSBpcyBkZXRhY2hlZCBhbmRcbiAgICAgIC8vIHdvbid0IGJlIGZvdW5kIGR1cmluZyBoeWRyYXRpb24uXG4gICAgICB0aHJvdyBub2RlTm90Rm91bmRFcnJvcihsVmlldywgdE5vZGUpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gcGF0aCE7XG59XG4iXX0=