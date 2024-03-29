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
 * Locate a node in an i18n tree that corresponds to a given instruction index.
 *
 * @param hydrationInfo The hydration annotation data
 * @param noOffsetIndex the instruction index
 * @returns an RNode that corresponds to the instruction index
 */
export function locateI18nRNodeByIndex(hydrationInfo, noOffsetIndex) {
    const i18nNodes = hydrationInfo.i18nNodes;
    if (i18nNodes) {
        return i18nNodes.get(noOffsetIndex);
    }
    return undefined;
}
/**
 * Attempt to locate an RNode by a path, if it exists.
 *
 * @param hydrationInfo The hydration annotation data
 * @param lView the current lView
 * @param noOffsetIndex the instruction index
 * @returns an RNode that corresponds to the instruction index or null if no path exists
 */
export function tryLocateRNodeByPath(hydrationInfo, lView, noOffsetIndex) {
    const nodes = hydrationInfo.data[NODES];
    const path = nodes?.[noOffsetIndex];
    return path ? locateRNodeByPath(path, lView) : null;
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
    const noOffsetIndex = getNoOffsetIndex(tNode);
    let native = locateI18nRNodeByIndex(hydrationInfo, noOffsetIndex);
    if (native === undefined) {
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
export function calcPathForNode(tNode, lView, excludedParentNodes) {
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
    //
    // It can also happen that the parent node should be excluded, for example,
    // because it belongs to an i18n block, which requires paths which aren't
    // relative to other views in an i18n block.
    while (parentTNode !== null &&
        (isDisconnectedNode(parentTNode, lView) || (excludedParentNodes?.has(parentTNode.index)))) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9kZV9sb29rdXBfdXRpbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9oeWRyYXRpb24vbm9kZV9sb29rdXBfdXRpbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBSUgsT0FBTyxFQUFDLDBCQUEwQixFQUFFLGFBQWEsRUFBRSxJQUFJLEVBQWUsTUFBTSw0QkFBNEIsQ0FBQztBQUN6RyxPQUFPLEVBQUMsa0JBQWtCLEVBQUMsTUFBTSw4QkFBOEIsQ0FBQztBQUNoRSxPQUFPLEVBQUMsYUFBYSxFQUFDLE1BQU0sNEJBQTRCLENBQUM7QUFDekQsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLGlDQUFpQyxDQUFDO0FBQ2hFLE9BQU8sRUFBQyxnQkFBZ0IsRUFBRSxXQUFXLEVBQUMsTUFBTSw0QkFBNEIsQ0FBQztBQUN6RSxPQUFPLEVBQUMsYUFBYSxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFFN0MsT0FBTyxFQUFDLG9CQUFvQixFQUFFLHNCQUFzQixFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQzNFLE9BQU8sRUFBQyx1QkFBdUIsRUFBRSxpQkFBaUIsRUFBRSx5QkFBeUIsRUFBQyxNQUFNLGtCQUFrQixDQUFDO0FBQ3ZHLE9BQU8sRUFBaUIsa0JBQWtCLEVBQUUsS0FBSyxFQUFFLG1CQUFtQixFQUFFLG1CQUFtQixFQUFDLE1BQU0sY0FBYyxDQUFDO0FBQ2pILE9BQU8sRUFBQywyQkFBMkIsRUFBRSxjQUFjLEVBQUMsTUFBTSxTQUFTLENBQUM7QUFHcEUsa0VBQWtFO0FBQ2xFLFNBQVMsMkJBQTJCLENBQUMsS0FBWTtJQUMvQyxPQUFPLENBQUMsS0FBSyxDQUFDLElBQUksSUFBSSxLQUFLLENBQUMsTUFBTSxFQUFFLElBQUksdUNBQStCLENBQUM7QUFDMUUsQ0FBQztBQUVELGdFQUFnRTtBQUNoRSxTQUFTLGdCQUFnQixDQUFDLEtBQVk7SUFDcEMs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QWUsQ0FBQyxXQUFtQixFQUFFLEtBQWEsRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO0lBQy9GLElBQUksSUFBSSxLQUFLLElBQUksSUFBSSxXQUFXLEtBQUssS0FBSyxFQUFFLENBQUM7UUFDM0MsbUVBQW1FO1FBQ25FLGlGQUFpRjtRQUNqRixFQUFFO1FBQ0YsK0VBQStFO1FBQy9FLGdGQUFnRjtRQUNoRix3RkFBd0Y7UUFDeEYsdUZBQXVGO1FBQ3ZGLG1GQUFtRjtRQUNuRixxREFBcUQ7UUFDckQsTUFBTSxJQUFJLEdBQUksV0FBb0IsQ0FBQyxhQUFjLENBQUMsSUFBWSxDQUFDO1FBQy9ELElBQUksR0FBRyxlQUFlLENBQUMsSUFBSSxFQUFFLEtBQWEsRUFBRSxtQkFBbUIsQ0FBQyxDQUFDO1FBRWpFLElBQUksSUFBSSxLQUFLLElBQUksRUFBRSxDQUFDO1lBQ2xCLHlFQUF5RTtZQUN6RSxtQ0FBbUM7WUFDbkMsTUFBTSxpQkFBaUIsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDeEMsQ0FBQztJQUNILENBQUM7SUFDRCxPQUFPLElBQUssQ0FBQztBQUNmLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtUTm9kZSwgVE5vZGVUeXBlfSBmcm9tICcuLi9yZW5kZXIzL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge1JFbGVtZW50LCBSTm9kZX0gZnJvbSAnLi4vcmVuZGVyMy9pbnRlcmZhY2VzL3JlbmRlcmVyX2RvbSc7XG5pbXBvcnQge0RFQ0xBUkFUSU9OX0NPTVBPTkVOVF9WSUVXLCBIRUFERVJfT0ZGU0VULCBIT1NULCBMVmlldywgVFZpZXd9IGZyb20gJy4uL3JlbmRlcjMvaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7Z2V0Rmlyc3ROYXRpdmVOb2RlfSBmcm9tICcuLi9yZW5kZXIzL25vZGVfbWFuaXB1bGF0aW9uJztcbmltcG9ydCB7ybXJtXJlc29sdmVCb2R5fSBmcm9tICcuLi9yZW5kZXIzL3V0aWwvbWlzY191dGlscyc7XG5pbXBvcnQge3JlbmRlclN0cmluZ2lmeX0gZnJvbSAnLi4vcmVuZGVyMy91dGlsL3N0cmluZ2lmeV91dGlscyc7XG5pbXBvcnQge2dldE5hdGl2ZUJ5VE5vZGUsIHVud3JhcFJOb2RlfSBmcm9tICcuLi9yZW5kZXIzL3V0aWwvdmlld191dGlscyc7XG5pbXBvcnQge2Fzc2VydERlZmluZWR9IGZyb20gJy4uL3V0aWwvYXNzZXJ0JztcblxuaW1wb3J0IHtjb21wcmVzc05vZGVMb2NhdGlvbiwgZGVjb21wcmVzc05vZGVMb2NhdGlvbn0gZnJvbSAnLi9jb21wcmVzc2lvbic7XG5pbXBvcnQge25vZGVOb3RGb3VuZEF0UGF0aEVycm9yLCBub2RlTm90Rm91bmRFcnJvciwgdmFsaWRhdGVTaWJsaW5nTm9kZUV4aXN0c30gZnJvbSAnLi9lcnJvcl9oYW5kbGluZyc7XG5pbXBvcnQge0RlaHlkcmF0ZWRWaWV3LCBOb2RlTmF2aWdhdGlvblN0ZXAsIE5PREVTLCBSRUZFUkVOQ0VfTk9ERV9CT0RZLCBSRUZFUkVOQ0VfTk9ERV9IT1NUfSBmcm9tICcuL2ludGVyZmFjZXMnO1xuaW1wb3J0IHtjYWxjU2VyaWFsaXplZENvbnRhaW5lclNpemUsIGdldFNlZ21lbnRIZWFkfSBmcm9tICcuL3V0aWxzJztcblxuXG4vKiogV2hldGhlciBjdXJyZW50IFROb2RlIGlzIGEgZmlyc3Qgbm9kZSBpbiBhbiA8bmctY29udGFpbmVyPi4gKi9cbmZ1bmN0aW9uIGlzRmlyc3RFbGVtZW50SW5OZ0NvbnRhaW5lcih0Tm9kZTogVE5vZGUpOiBib29sZWFuIHtcbiAgcmV0dXJuICF0Tm9kZS5wcmV2ICYmIHROb2RlLnBhcmVudD8udHlwZSA9PT0gVE5vZGVUeXBlLkVsZW1lbnRDb250YWluZXI7XG59XG5cbi8qKiBSZXR1cm5zIGFuIGluc3RydWN0aW9uIGluZGV4IChzdWJ0cmFjdGluZyBIRUFERVJfT0ZGU0VUKS4gKi9cbmZ1bmN0aW9uIGdldE5vT2Zmc2V0SW5kZXgodE5vZGU6IFROb2RlKTogbnVtYmVyIHtcbiAgcmV0dXJuIHROb2RlLmluZGV4IC0gSEVBREVSX09GRlNFVDtcbn1cblxuLyoqXG4gKiBDaGVjayB3aGV0aGVyIGEgZ2l2ZW4gbm9kZSBleGlzdHMsIGJ1dCBpcyBkaXNjb25uZWN0ZWQgZnJvbSB0aGUgRE9NLlxuICpcbiAqIE5vdGU6IHdlIGxldmVyYWdlIHRoZSBmYWN0IHRoYXQgd2UgaGF2ZSB0aGlzIGluZm9ybWF0aW9uIGF2YWlsYWJsZSBpbiB0aGUgRE9NIGVtdWxhdGlvblxuICogbGF5ZXIgKGluIERvbWlubykgZm9yIG5vdy4gTG9uZ2VyLXRlcm0gc29sdXRpb24gc2hvdWxkIG5vdCByZWx5IG9uIHRoZSBET00gZW11bGF0aW9uIGFuZFxuICogb25seSB1c2UgaW50ZXJuYWwgZGF0YSBzdHJ1Y3R1cmVzIGFuZCBzdGF0ZSB0byBjb21wdXRlIHRoaXMgaW5mb3JtYXRpb24uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc0Rpc2Nvbm5lY3RlZE5vZGUodE5vZGU6IFROb2RlLCBsVmlldzogTFZpZXcpIHtcbiAgcmV0dXJuICEodE5vZGUudHlwZSAmIFROb2RlVHlwZS5Qcm9qZWN0aW9uKSAmJiAhIWxWaWV3W3ROb2RlLmluZGV4XSAmJlxuICAgICAgISh1bndyYXBSTm9kZShsVmlld1t0Tm9kZS5pbmRleF0pIGFzIE5vZGUpPy5pc0Nvbm5lY3RlZDtcbn1cblxuLyoqXG4gKiBMb2NhdGUgYSBub2RlIGluIGFuIGkxOG4gdHJlZSB0aGF0IGNvcnJlc3BvbmRzIHRvIGEgZ2l2ZW4gaW5zdHJ1Y3Rpb24gaW5kZXguXG4gKlxuICogQHBhcmFtIGh5ZHJhdGlvbkluZm8gVGhlIGh5ZHJhdGlvbiBhbm5vdGF0aW9uIGRhdGFcbiAqIEBwYXJhbSBub09mZnNldEluZGV4IHRoZSBpbnN0cnVjdGlvbiBpbmRleFxuICogQHJldHVybnMgYW4gUk5vZGUgdGhhdCBjb3JyZXNwb25kcyB0byB0aGUgaW5zdHJ1Y3Rpb24gaW5kZXhcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGxvY2F0ZUkxOG5STm9kZUJ5SW5kZXg8VCBleHRlbmRzIFJOb2RlPihcbiAgICBoeWRyYXRpb25JbmZvOiBEZWh5ZHJhdGVkVmlldywgbm9PZmZzZXRJbmRleDogbnVtYmVyKTogVHxudWxsfHVuZGVmaW5lZCB7XG4gIGNvbnN0IGkxOG5Ob2RlcyA9IGh5ZHJhdGlvbkluZm8uaTE4bk5vZGVzO1xuICBpZiAoaTE4bk5vZGVzKSB7XG4gICAgcmV0dXJuIGkxOG5Ob2Rlcy5nZXQobm9PZmZzZXRJbmRleCkgYXMgVCB8IG51bGwgfCB1bmRlZmluZWQ7XG4gIH1cbiAgcmV0dXJuIHVuZGVmaW5lZDtcbn1cblxuLyoqXG4gKiBBdHRlbXB0IHRvIGxvY2F0ZSBhbiBSTm9kZSBieSBhIHBhdGgsIGlmIGl0IGV4aXN0cy5cbiAqXG4gKiBAcGFyYW0gaHlkcmF0aW9uSW5mbyBUaGUgaHlkcmF0aW9uIGFubm90YXRpb24gZGF0YVxuICogQHBhcmFtIGxWaWV3IHRoZSBjdXJyZW50IGxWaWV3XG4gKiBAcGFyYW0gbm9PZmZzZXRJbmRleCB0aGUgaW5zdHJ1Y3Rpb24gaW5kZXhcbiAqIEByZXR1cm5zIGFuIFJOb2RlIHRoYXQgY29ycmVzcG9uZHMgdG8gdGhlIGluc3RydWN0aW9uIGluZGV4IG9yIG51bGwgaWYgbm8gcGF0aCBleGlzdHNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHRyeUxvY2F0ZVJOb2RlQnlQYXRoKFxuICAgIGh5ZHJhdGlvbkluZm86IERlaHlkcmF0ZWRWaWV3LCBsVmlldzogTFZpZXc8dW5rbm93bj4sIG5vT2Zmc2V0SW5kZXg6IG51bWJlcik6IFJOb2RlfG51bGwge1xuICBjb25zdCBub2RlcyA9IGh5ZHJhdGlvbkluZm8uZGF0YVtOT0RFU107XG4gIGNvbnN0IHBhdGggPSBub2Rlcz8uW25vT2Zmc2V0SW5kZXhdO1xuICByZXR1cm4gcGF0aCA/IGxvY2F0ZVJOb2RlQnlQYXRoKHBhdGgsIGxWaWV3KSA6IG51bGw7XG59XG5cbi8qKlxuICogTG9jYXRlIGEgbm9kZSBpbiBET00gdHJlZSB0aGF0IGNvcnJlc3BvbmRzIHRvIGEgZ2l2ZW4gVE5vZGUuXG4gKlxuICogQHBhcmFtIGh5ZHJhdGlvbkluZm8gVGhlIGh5ZHJhdGlvbiBhbm5vdGF0aW9uIGRhdGFcbiAqIEBwYXJhbSB0VmlldyB0aGUgY3VycmVudCB0Vmlld1xuICogQHBhcmFtIGxWaWV3IHRoZSBjdXJyZW50IGxWaWV3XG4gKiBAcGFyYW0gdE5vZGUgdGhlIGN1cnJlbnQgdE5vZGVcbiAqIEByZXR1cm5zIGFuIFJOb2RlIHRoYXQgcmVwcmVzZW50cyBhIGdpdmVuIHROb2RlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBsb2NhdGVOZXh0Uk5vZGU8VCBleHRlbmRzIFJOb2RlPihcbiAgICBoeWRyYXRpb25JbmZvOiBEZWh5ZHJhdGVkVmlldywgdFZpZXc6IFRWaWV3LCBsVmlldzogTFZpZXc8dW5rbm93bj4sIHROb2RlOiBUTm9kZSk6IFR8bnVsbCB7XG4gIGNvbnN0IG5vT2Zmc2V0SW5kZXggPSBnZXROb09mZnNldEluZGV4KHROb2RlKTtcbiAgbGV0IG5hdGl2ZSA9IGxvY2F0ZUkxOG5STm9kZUJ5SW5kZXgoaHlkcmF0aW9uSW5mbywgbm9PZmZzZXRJbmRleCk7XG5cbiAgaWYgKG5hdGl2ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgY29uc3Qgbm9kZXMgPSBoeWRyYXRpb25JbmZvLmRhdGFbTk9ERVNdO1xuICAgIGlmIChub2Rlcz8uW25vT2Zmc2V0SW5kZXhdKSB7XG4gICAgICAvLyBXZSBrbm93IHRoZSBleGFjdCBsb2NhdGlvbiBvZiB0aGUgbm9kZS5cbiAgICAgIG5hdGl2ZSA9IGxvY2F0ZVJOb2RlQnlQYXRoKG5vZGVzW25vT2Zmc2V0SW5kZXhdLCBsVmlldyk7XG4gICAgfSBlbHNlIGlmICh0Vmlldy5maXJzdENoaWxkID09PSB0Tm9kZSkge1xuICAgICAgLy8gV2UgY3JlYXRlIGEgZmlyc3Qgbm9kZSBpbiB0aGlzIHZpZXcsIHNvIHdlIHVzZSBhIHJlZmVyZW5jZVxuICAgICAgLy8gdG8gdGhlIGZpcnN0IGNoaWxkIGluIHRoaXMgRE9NIHNlZ21lbnQuXG4gICAgICBuYXRpdmUgPSBoeWRyYXRpb25JbmZvLmZpcnN0Q2hpbGQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIExvY2F0ZSBhIG5vZGUgYmFzZWQgb24gYSBwcmV2aW91cyBzaWJsaW5nIG9yIGEgcGFyZW50IG5vZGUuXG4gICAgICBjb25zdCBwcmV2aW91c1ROb2RlUGFyZW50ID0gdE5vZGUucHJldiA9PT0gbnVsbDtcbiAgICAgIGNvbnN0IHByZXZpb3VzVE5vZGUgPSAodE5vZGUucHJldiA/PyB0Tm9kZS5wYXJlbnQpITtcbiAgICAgIG5nRGV2TW9kZSAmJlxuICAgICAgICAgIGFzc2VydERlZmluZWQoXG4gICAgICAgICAgICAgIHByZXZpb3VzVE5vZGUsXG4gICAgICAgICAgICAgICdVbmV4cGVjdGVkIHN0YXRlOiBjdXJyZW50IFROb2RlIGRvZXMgbm90IGhhdmUgYSBjb25uZWN0aW9uICcgK1xuICAgICAgICAgICAgICAgICAgJ3RvIHRoZSBwcmV2aW91cyBub2RlIG9yIGEgcGFyZW50IG5vZGUuJyk7XG4gICAgICBpZiAoaXNGaXJzdEVsZW1lbnRJbk5nQ29udGFpbmVyKHROb2RlKSkge1xuICAgICAgICBjb25zdCBub09mZnNldFBhcmVudEluZGV4ID0gZ2V0Tm9PZmZzZXRJbmRleCh0Tm9kZS5wYXJlbnQhKTtcbiAgICAgICAgbmF0aXZlID0gZ2V0U2VnbWVudEhlYWQoaHlkcmF0aW9uSW5mbywgbm9PZmZzZXRQYXJlbnRJbmRleCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBsZXQgcHJldmlvdXNSRWxlbWVudCA9IGdldE5hdGl2ZUJ5VE5vZGUocHJldmlvdXNUTm9kZSwgbFZpZXcpO1xuICAgICAgICBpZiAocHJldmlvdXNUTm9kZVBhcmVudCkge1xuICAgICAgICAgIG5hdGl2ZSA9IChwcmV2aW91c1JFbGVtZW50IGFzIFJFbGVtZW50KS5maXJzdENoaWxkO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIElmIHRoZSBwcmV2aW91cyBub2RlIGlzIGFuIGVsZW1lbnQsIGJ1dCBpdCBhbHNvIGhhcyBjb250YWluZXIgaW5mbyxcbiAgICAgICAgICAvLyB0aGlzIG1lYW5zIHRoYXQgd2UgYXJlIHByb2Nlc3NpbmcgYSBub2RlIGxpa2UgYDxkaXYgI3ZjclRhcmdldD5gLCB3aGljaCBpc1xuICAgICAgICAgIC8vIHJlcHJlc2VudGVkIGluIHRoZSBET00gYXMgYDxkaXY+PC9kaXY+Li4uPCEtLWNvbnRhaW5lci0tPmAuXG4gICAgICAgICAgLy8gSW4gdGhpcyBjYXNlLCB0aGVyZSBhcmUgbm9kZXMgKmFmdGVyKiB0aGlzIGVsZW1lbnQgYW5kIHdlIG5lZWQgdG8gc2tpcFxuICAgICAgICAgIC8vIGFsbCBvZiB0aGVtIHRvIHJlYWNoIGFuIGVsZW1lbnQgdGhhdCB3ZSBhcmUgbG9va2luZyBmb3IuXG4gICAgICAgICAgY29uc3Qgbm9PZmZzZXRQcmV2U2libGluZ0luZGV4ID0gZ2V0Tm9PZmZzZXRJbmRleChwcmV2aW91c1ROb2RlKTtcbiAgICAgICAgICBjb25zdCBzZWdtZW50SGVhZCA9IGdldFNlZ21lbnRIZWFkKGh5ZHJhdGlvbkluZm8sIG5vT2Zmc2V0UHJldlNpYmxpbmdJbmRleCk7XG4gICAgICAgICAgaWYgKHByZXZpb3VzVE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkVsZW1lbnQgJiYgc2VnbWVudEhlYWQpIHtcbiAgICAgICAgICAgIGNvbnN0IG51bVJvb3ROb2Rlc1RvU2tpcCA9XG4gICAgICAgICAgICAgICAgY2FsY1NlcmlhbGl6ZWRDb250YWluZXJTaXplKGh5ZHJhdGlvbkluZm8sIG5vT2Zmc2V0UHJldlNpYmxpbmdJbmRleCk7XG4gICAgICAgICAgICAvLyBgKzFgIHN0YW5kcyBmb3IgYW4gYW5jaG9yIGNvbW1lbnQgbm9kZSBhZnRlciBhbGwgdGhlIHZpZXdzIGluIHRoaXMgY29udGFpbmVyLlxuICAgICAgICAgICAgY29uc3Qgbm9kZXNUb1NraXAgPSBudW1Sb290Tm9kZXNUb1NraXAgKyAxO1xuICAgICAgICAgICAgLy8gRmlyc3Qgbm9kZSBhZnRlciB0aGlzIHNlZ21lbnQuXG4gICAgICAgICAgICBuYXRpdmUgPSBzaWJsaW5nQWZ0ZXIobm9kZXNUb1NraXAsIHNlZ21lbnRIZWFkKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbmF0aXZlID0gcHJldmlvdXNSRWxlbWVudC5uZXh0U2libGluZztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIG5hdGl2ZSBhcyBUO1xufVxuXG4vKipcbiAqIFNraXBzIG92ZXIgYSBzcGVjaWZpZWQgbnVtYmVyIG9mIG5vZGVzIGFuZCByZXR1cm5zIHRoZSBuZXh0IHNpYmxpbmcgbm9kZSBhZnRlciB0aGF0LlxuICovXG5leHBvcnQgZnVuY3Rpb24gc2libGluZ0FmdGVyPFQgZXh0ZW5kcyBSTm9kZT4oc2tpcDogbnVtYmVyLCBmcm9tOiBSTm9kZSk6IFR8bnVsbCB7XG4gIGxldCBjdXJyZW50Tm9kZSA9IGZyb207XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgc2tpcDsgaSsrKSB7XG4gICAgbmdEZXZNb2RlICYmIHZhbGlkYXRlU2libGluZ05vZGVFeGlzdHMoY3VycmVudE5vZGUpO1xuICAgIGN1cnJlbnROb2RlID0gY3VycmVudE5vZGUubmV4dFNpYmxpbmchO1xuICB9XG4gIHJldHVybiBjdXJyZW50Tm9kZSBhcyBUO1xufVxuXG4vKipcbiAqIEhlbHBlciBmdW5jdGlvbiB0byBwcm9kdWNlIGEgc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBuYXZpZ2F0aW9uIHN0ZXBzXG4gKiAoaW4gdGVybXMgb2YgYG5leHRTaWJsaW5nYCBhbmQgYGZpcnN0Q2hpbGRgIG5hdmlnYXRpb25zKS4gVXNlZCBpbiBlcnJvclxuICogbWVzc2FnZXMgaW4gZGV2IG1vZGUuXG4gKi9cbmZ1bmN0aW9uIHN0cmluZ2lmeU5hdmlnYXRpb25JbnN0cnVjdGlvbnMoaW5zdHJ1Y3Rpb25zOiAobnVtYmVyfE5vZGVOYXZpZ2F0aW9uU3RlcClbXSk6IHN0cmluZyB7XG4gIGNvbnN0IGNvbnRhaW5lciA9IFtdO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGluc3RydWN0aW9ucy5sZW5ndGg7IGkgKz0gMikge1xuICAgIGNvbnN0IHN0ZXAgPSBpbnN0cnVjdGlvbnNbaV07XG4gICAgY29uc3QgcmVwZWF0ID0gaW5zdHJ1Y3Rpb25zW2kgKyAxXSBhcyBudW1iZXI7XG4gICAgZm9yIChsZXQgciA9IDA7IHIgPCByZXBlYXQ7IHIrKykge1xuICAgICAgY29udGFpbmVyLnB1c2goc3RlcCA9PT0gTm9kZU5hdmlnYXRpb25TdGVwLkZpcnN0Q2hpbGQgPyAnZmlyc3RDaGlsZCcgOiAnbmV4dFNpYmxpbmcnKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGNvbnRhaW5lci5qb2luKCcuJyk7XG59XG5cbi8qKlxuICogSGVscGVyIGZ1bmN0aW9uIHRoYXQgbmF2aWdhdGVzIGZyb20gYSBzdGFydGluZyBwb2ludCBub2RlICh0aGUgYGZyb21gIG5vZGUpXG4gKiB1c2luZyBwcm92aWRlZCBzZXQgb2YgbmF2aWdhdGlvbiBpbnN0cnVjdGlvbnMgKHdpdGhpbiBgcGF0aGAgYXJndW1lbnQpLlxuICovXG5mdW5jdGlvbiBuYXZpZ2F0ZVRvTm9kZShmcm9tOiBOb2RlLCBpbnN0cnVjdGlvbnM6IChudW1iZXJ8Tm9kZU5hdmlnYXRpb25TdGVwKVtdKTogUk5vZGUge1xuICBsZXQgbm9kZSA9IGZyb207XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgaW5zdHJ1Y3Rpb25zLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgY29uc3Qgc3RlcCA9IGluc3RydWN0aW9uc1tpXTtcbiAgICBjb25zdCByZXBlYXQgPSBpbnN0cnVjdGlvbnNbaSArIDFdIGFzIG51bWJlcjtcbiAgICBmb3IgKGxldCByID0gMDsgciA8IHJlcGVhdDsgcisrKSB7XG4gICAgICBpZiAobmdEZXZNb2RlICYmICFub2RlKSB7XG4gICAgICAgIHRocm93IG5vZGVOb3RGb3VuZEF0UGF0aEVycm9yKGZyb20sIHN0cmluZ2lmeU5hdmlnYXRpb25JbnN0cnVjdGlvbnMoaW5zdHJ1Y3Rpb25zKSk7XG4gICAgICB9XG4gICAgICBzd2l0Y2ggKHN0ZXApIHtcbiAgICAgICAgY2FzZSBOb2RlTmF2aWdhdGlvblN0ZXAuRmlyc3RDaGlsZDpcbiAgICAgICAgICBub2RlID0gbm9kZS5maXJzdENoaWxkITtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBOb2RlTmF2aWdhdGlvblN0ZXAuTmV4dFNpYmxpbmc6XG4gICAgICAgICAgbm9kZSA9IG5vZGUubmV4dFNpYmxpbmchO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICBpZiAobmdEZXZNb2RlICYmICFub2RlKSB7XG4gICAgdGhyb3cgbm9kZU5vdEZvdW5kQXRQYXRoRXJyb3IoZnJvbSwgc3RyaW5naWZ5TmF2aWdhdGlvbkluc3RydWN0aW9ucyhpbnN0cnVjdGlvbnMpKTtcbiAgfVxuICByZXR1cm4gbm9kZSBhcyBSTm9kZTtcbn1cblxuLyoqXG4gKiBMb2NhdGVzIGFuIFJOb2RlIGdpdmVuIGEgc2V0IG9mIG5hdmlnYXRpb24gaW5zdHJ1Y3Rpb25zICh3aGljaCBhbHNvIGNvbnRhaW5zXG4gKiBhIHN0YXJ0aW5nIHBvaW50IG5vZGUgaW5mbykuXG4gKi9cbmZ1bmN0aW9uIGxvY2F0ZVJOb2RlQnlQYXRoKHBhdGg6IHN0cmluZywgbFZpZXc6IExWaWV3KTogUk5vZGUge1xuICBjb25zdCBbcmVmZXJlbmNlTm9kZSwgLi4ubmF2aWdhdGlvbkluc3RydWN0aW9uc10gPSBkZWNvbXByZXNzTm9kZUxvY2F0aW9uKHBhdGgpO1xuICBsZXQgcmVmOiBFbGVtZW50O1xuICBpZiAocmVmZXJlbmNlTm9kZSA9PT0gUkVGRVJFTkNFX05PREVfSE9TVCkge1xuICAgIHJlZiA9IGxWaWV3W0RFQ0xBUkFUSU9OX0NPTVBPTkVOVF9WSUVXXVtIT1NUXSBhcyB1bmtub3duIGFzIEVsZW1lbnQ7XG4gIH0gZWxzZSBpZiAocmVmZXJlbmNlTm9kZSA9PT0gUkVGRVJFTkNFX05PREVfQk9EWSkge1xuICAgIHJlZiA9IMm1ybVyZXNvbHZlQm9keShcbiAgICAgICAgbFZpZXdbREVDTEFSQVRJT05fQ09NUE9ORU5UX1ZJRVddW0hPU1RdIGFzIFJFbGVtZW50ICYge293bmVyRG9jdW1lbnQ6IERvY3VtZW50fSk7XG4gIH0gZWxzZSB7XG4gICAgY29uc3QgcGFyZW50RWxlbWVudElkID0gTnVtYmVyKHJlZmVyZW5jZU5vZGUpO1xuICAgIHJlZiA9IHVud3JhcFJOb2RlKChsVmlldyBhcyBhbnkpW3BhcmVudEVsZW1lbnRJZCArIEhFQURFUl9PRkZTRVRdKSBhcyBFbGVtZW50O1xuICB9XG4gIHJldHVybiBuYXZpZ2F0ZVRvTm9kZShyZWYsIG5hdmlnYXRpb25JbnN0cnVjdGlvbnMpO1xufVxuXG4vKipcbiAqIEdlbmVyYXRlIGEgbGlzdCBvZiBET00gbmF2aWdhdGlvbiBvcGVyYXRpb25zIHRvIGdldCBmcm9tIG5vZGUgYHN0YXJ0YCB0byBub2RlIGBmaW5pc2hgLlxuICpcbiAqIE5vdGU6IGFzc3VtZXMgdGhhdCBub2RlIGBzdGFydGAgb2NjdXJzIGJlZm9yZSBub2RlIGBmaW5pc2hgIGluIGFuIGluLW9yZGVyIHRyYXZlcnNhbCBvZiB0aGUgRE9NXG4gKiB0cmVlLiBUaGF0IGlzLCB3ZSBzaG91bGQgYmUgYWJsZSB0byBnZXQgZnJvbSBgc3RhcnRgIHRvIGBmaW5pc2hgIHB1cmVseSBieSB1c2luZyBgLmZpcnN0Q2hpbGRgXG4gKiBhbmQgYC5uZXh0U2libGluZ2Agb3BlcmF0aW9ucy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG5hdmlnYXRlQmV0d2VlbihzdGFydDogTm9kZSwgZmluaXNoOiBOb2RlKTogTm9kZU5hdmlnYXRpb25TdGVwW118bnVsbCB7XG4gIGlmIChzdGFydCA9PT0gZmluaXNoKSB7XG4gICAgcmV0dXJuIFtdO1xuICB9IGVsc2UgaWYgKHN0YXJ0LnBhcmVudEVsZW1lbnQgPT0gbnVsbCB8fCBmaW5pc2gucGFyZW50RWxlbWVudCA9PSBudWxsKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH0gZWxzZSBpZiAoc3RhcnQucGFyZW50RWxlbWVudCA9PT0gZmluaXNoLnBhcmVudEVsZW1lbnQpIHtcbiAgICByZXR1cm4gbmF2aWdhdGVCZXR3ZWVuU2libGluZ3Moc3RhcnQsIGZpbmlzaCk7XG4gIH0gZWxzZSB7XG4gICAgLy8gYGZpbmlzaGAgaXMgYSBjaGlsZCBvZiBpdHMgcGFyZW50LCBzbyB0aGUgcGFyZW50IHdpbGwgYWx3YXlzIGhhdmUgYSBjaGlsZC5cbiAgICBjb25zdCBwYXJlbnQgPSBmaW5pc2gucGFyZW50RWxlbWVudCE7XG5cbiAgICBjb25zdCBwYXJlbnRQYXRoID0gbmF2aWdhdGVCZXR3ZWVuKHN0YXJ0LCBwYXJlbnQpO1xuICAgIGNvbnN0IGNoaWxkUGF0aCA9IG5hdmlnYXRlQmV0d2VlbihwYXJlbnQuZmlyc3RDaGlsZCEsIGZpbmlzaCk7XG4gICAgaWYgKCFwYXJlbnRQYXRoIHx8ICFjaGlsZFBhdGgpIHJldHVybiBudWxsO1xuXG4gICAgcmV0dXJuIFtcbiAgICAgIC8vIEZpcnN0IG5hdmlnYXRlIHRvIGBmaW5pc2hgJ3MgcGFyZW50XG4gICAgICAuLi5wYXJlbnRQYXRoLFxuICAgICAgLy8gVGhlbiB0byBpdHMgZmlyc3QgY2hpbGQuXG4gICAgICBOb2RlTmF2aWdhdGlvblN0ZXAuRmlyc3RDaGlsZCxcbiAgICAgIC8vIEFuZCBmaW5hbGx5IGZyb20gdGhhdCBub2RlIHRvIGBmaW5pc2hgIChtYXliZSBhIG5vLW9wIGlmIHdlJ3JlIGFscmVhZHkgdGhlcmUpLlxuICAgICAgLi4uY2hpbGRQYXRoLFxuICAgIF07XG4gIH1cbn1cblxuLyoqXG4gKiBDYWxjdWxhdGVzIGEgcGF0aCBiZXR3ZWVuIDIgc2libGluZyBub2RlcyAoZ2VuZXJhdGVzIGEgbnVtYmVyIG9mIGBOZXh0U2libGluZ2AgbmF2aWdhdGlvbnMpLlxuICogUmV0dXJucyBgbnVsbGAgaWYgbm8gc3VjaCBwYXRoIGV4aXN0cyBiZXR3ZWVuIHRoZSBnaXZlbiBub2Rlcy5cbiAqL1xuZnVuY3Rpb24gbmF2aWdhdGVCZXR3ZWVuU2libGluZ3Moc3RhcnQ6IE5vZGUsIGZpbmlzaDogTm9kZSk6IE5vZGVOYXZpZ2F0aW9uU3RlcFtdfG51bGwge1xuICBjb25zdCBuYXY6IE5vZGVOYXZpZ2F0aW9uU3RlcFtdID0gW107XG4gIGxldCBub2RlOiBOb2RlfG51bGwgPSBudWxsO1xuICBmb3IgKG5vZGUgPSBzdGFydDsgbm9kZSAhPSBudWxsICYmIG5vZGUgIT09IGZpbmlzaDsgbm9kZSA9IG5vZGUubmV4dFNpYmxpbmcpIHtcbiAgICBuYXYucHVzaChOb2RlTmF2aWdhdGlvblN0ZXAuTmV4dFNpYmxpbmcpO1xuICB9XG4gIC8vIElmIHRoZSBgbm9kZWAgYmVjb21lcyBgbnVsbGAgb3IgYHVuZGVmaW5lZGAgYXQgdGhlIGVuZCwgdGhhdCBtZWFucyB0aGF0IHdlXG4gIC8vIGRpZG4ndCBmaW5kIHRoZSBgZW5kYCBub2RlLCB0aHVzIHJldHVybiBgbnVsbGAgKHdoaWNoIHdvdWxkIHRyaWdnZXIgc2VyaWFsaXphdGlvblxuICAvLyBlcnJvciB0byBiZSBwcm9kdWNlZCkuXG4gIHJldHVybiBub2RlID09IG51bGwgPyBudWxsIDogbmF2O1xufVxuXG4vKipcbiAqIENhbGN1bGF0ZXMgYSBwYXRoIGJldHdlZW4gMiBub2RlcyBpbiB0ZXJtcyBvZiBgbmV4dFNpYmxpbmdgIGFuZCBgZmlyc3RDaGlsZGBcbiAqIG5hdmlnYXRpb25zOlxuICogLSB0aGUgYGZyb21gIG5vZGUgaXMgYSBrbm93biBub2RlLCB1c2VkIGFzIGFuIHN0YXJ0aW5nIHBvaW50IGZvciB0aGUgbG9va3VwXG4gKiAgICh0aGUgYGZyb21Ob2RlTmFtZWAgYXJndW1lbnQgaXMgYSBzdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgdGhlIG5vZGUpLlxuICogLSB0aGUgYHRvYCBub2RlIGlzIGEgbm9kZSB0aGF0IHRoZSBydW50aW1lIGxvZ2ljIHdvdWxkIGJlIGxvb2tpbmcgdXAsXG4gKiAgIHVzaW5nIHRoZSBwYXRoIGdlbmVyYXRlZCBieSB0aGlzIGZ1bmN0aW9uLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY2FsY1BhdGhCZXR3ZWVuKGZyb206IE5vZGUsIHRvOiBOb2RlLCBmcm9tTm9kZU5hbWU6IHN0cmluZyk6IHN0cmluZ3xudWxsIHtcbiAgY29uc3QgcGF0aCA9IG5hdmlnYXRlQmV0d2Vlbihmcm9tLCB0byk7XG4gIHJldHVybiBwYXRoID09PSBudWxsID8gbnVsbCA6IGNvbXByZXNzTm9kZUxvY2F0aW9uKGZyb21Ob2RlTmFtZSwgcGF0aCk7XG59XG5cbi8qKlxuICogSW52b2tlZCBhdCBzZXJpYWxpemF0aW9uIHRpbWUgKG9uIHRoZSBzZXJ2ZXIpIHdoZW4gYSBzZXQgb2YgbmF2aWdhdGlvblxuICogaW5zdHJ1Y3Rpb25zIG5lZWRzIHRvIGJlIGdlbmVyYXRlZCBmb3IgYSBUTm9kZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNhbGNQYXRoRm9yTm9kZShcbiAgICB0Tm9kZTogVE5vZGUsIGxWaWV3OiBMVmlldywgZXhjbHVkZWRQYXJlbnROb2RlczogU2V0PG51bWJlcj58bnVsbCk6IHN0cmluZyB7XG4gIGxldCBwYXJlbnRUTm9kZSA9IHROb2RlLnBhcmVudDtcbiAgbGV0IHBhcmVudEluZGV4OiBudW1iZXJ8c3RyaW5nO1xuICBsZXQgcGFyZW50Uk5vZGU6IFJOb2RlO1xuICBsZXQgcmVmZXJlbmNlTm9kZU5hbWU6IHN0cmluZztcblxuICAvLyBTa2lwIG92ZXIgYWxsIHBhcmVudCBub2RlcyB0aGF0IGFyZSBkaXNjb25uZWN0ZWQgZnJvbSB0aGUgRE9NLCBzdWNoIG5vZGVzXG4gIC8vIGNhbiBub3QgYmUgdXNlZCBhcyBhbmNob3JzLlxuICAvL1xuICAvLyBUaGlzIG1pZ2h0IGhhcHBlbiBpbiBjZXJ0YWluIGNvbnRlbnQgcHJvamVjdGlvbi1iYXNlZCB1c2UtY2FzZXMsIHdoZXJlXG4gIC8vIGEgY29udGVudCBvZiBhbiBlbGVtZW50IGlzIHByb2plY3RlZCBhbmQgdXNlZCwgd2hlbiBhIHBhcmVudCBlbGVtZW50XG4gIC8vIGl0c2VsZiByZW1haW5zIGRldGFjaGVkIGZyb20gRE9NLiBJbiB0aGlzIHNjZW5hcmlvIHdlIHRyeSB0byBmaW5kIGEgcGFyZW50XG4gIC8vIGVsZW1lbnQgdGhhdCBpcyBhdHRhY2hlZCB0byBET00gYW5kIGNhbiBhY3QgYXMgYW4gYW5jaG9yIGluc3RlYWQuXG4gIC8vXG4gIC8vIEl0IGNhbiBhbHNvIGhhcHBlbiB0aGF0IHRoZSBwYXJlbnQgbm9kZSBzaG91bGQgYmUgZXhjbHVkZWQsIGZvciBleGFtcGxlLFxuICAvLyBiZWNhdXNlIGl0IGJlbG9uZ3MgdG8gYW4gaTE4biBibG9jaywgd2hpY2ggcmVxdWlyZXMgcGF0aHMgd2hpY2ggYXJlbid0XG4gIC8vIHJlbGF0aXZlIHRvIG90aGVyIHZpZXdzIGluIGFuIGkxOG4gYmxvY2suXG4gIHdoaWxlIChcbiAgICAgIHBhcmVudFROb2RlICE9PSBudWxsICYmXG4gICAgICAoaXNEaXNjb25uZWN0ZWROb2RlKHBhcmVudFROb2RlLCBsVmlldykgfHwgKGV4Y2x1ZGVkUGFyZW50Tm9kZXM/LmhhcyhwYXJlbnRUTm9kZS5pbmRleCkpKSkge1xuICAgIHBhcmVudFROb2RlID0gcGFyZW50VE5vZGUucGFyZW50O1xuICB9XG5cbiAgaWYgKHBhcmVudFROb2RlID09PSBudWxsIHx8ICEocGFyZW50VE5vZGUudHlwZSAmIFROb2RlVHlwZS5BbnlSTm9kZSkpIHtcbiAgICAvLyBJZiB0aGVyZSBpcyBubyBwYXJlbnQgVE5vZGUgb3IgYSBwYXJlbnQgVE5vZGUgZG9lcyBub3QgcmVwcmVzZW50IGFuIFJOb2RlXG4gICAgLy8gKGkuZS4gbm90IGEgRE9NIG5vZGUpLCB1c2UgY29tcG9uZW50IGhvc3QgZWxlbWVudCBhcyBhIHJlZmVyZW5jZSBub2RlLlxuICAgIHBhcmVudEluZGV4ID0gcmVmZXJlbmNlTm9kZU5hbWUgPSBSRUZFUkVOQ0VfTk9ERV9IT1NUO1xuICAgIHBhcmVudFJOb2RlID0gbFZpZXdbREVDTEFSQVRJT05fQ09NUE9ORU5UX1ZJRVddW0hPU1RdITtcbiAgfSBlbHNlIHtcbiAgICAvLyBVc2UgcGFyZW50IFROb2RlIGFzIGEgcmVmZXJlbmNlIG5vZGUuXG4gICAgcGFyZW50SW5kZXggPSBwYXJlbnRUTm9kZS5pbmRleDtcbiAgICBwYXJlbnRSTm9kZSA9IHVud3JhcFJOb2RlKGxWaWV3W3BhcmVudEluZGV4XSk7XG4gICAgcmVmZXJlbmNlTm9kZU5hbWUgPSByZW5kZXJTdHJpbmdpZnkocGFyZW50SW5kZXggLSBIRUFERVJfT0ZGU0VUKTtcbiAgfVxuICBsZXQgck5vZGUgPSB1bndyYXBSTm9kZShsVmlld1t0Tm9kZS5pbmRleF0pO1xuICBpZiAodE5vZGUudHlwZSAmIFROb2RlVHlwZS5BbnlDb250YWluZXIpIHtcbiAgICAvLyBGb3IgPG5nLWNvbnRhaW5lcj4gbm9kZXMsIGluc3RlYWQgb2Ygc2VyaWFsaXppbmcgYSByZWZlcmVuY2VcbiAgICAvLyB0byB0aGUgYW5jaG9yIGNvbW1lbnQgbm9kZSwgc2VyaWFsaXplIGEgbG9jYXRpb24gb2YgdGhlIGZpcnN0XG4gICAgLy8gRE9NIGVsZW1lbnQuIFBhaXJlZCB3aXRoIHRoZSBjb250YWluZXIgc2l6ZSAoc2VyaWFsaXplZCBhcyBhIHBhcnRcbiAgICAvLyBvZiBgbmdoLmNvbnRhaW5lcnNgKSwgaXQgc2hvdWxkIGdpdmUgZW5vdWdoIGluZm9ybWF0aW9uIGZvciBydW50aW1lXG4gICAgLy8gdG8gaHlkcmF0ZSBub2RlcyBpbiB0aGlzIGNvbnRhaW5lci5cbiAgICBjb25zdCBmaXJzdFJOb2RlID0gZ2V0Rmlyc3ROYXRpdmVOb2RlKGxWaWV3LCB0Tm9kZSk7XG5cbiAgICAvLyBJZiBjb250YWluZXIgaXMgbm90IGVtcHR5LCB1c2UgYSByZWZlcmVuY2UgdG8gdGhlIGZpcnN0IGVsZW1lbnQsXG4gICAgLy8gb3RoZXJ3aXNlLCByTm9kZSB3b3VsZCBwb2ludCB0byBhbiBhbmNob3IgY29tbWVudCBub2RlLlxuICAgIGlmIChmaXJzdFJOb2RlKSB7XG4gICAgICByTm9kZSA9IGZpcnN0Uk5vZGU7XG4gICAgfVxuICB9XG4gIGxldCBwYXRoOiBzdHJpbmd8bnVsbCA9IGNhbGNQYXRoQmV0d2VlbihwYXJlbnRSTm9kZSBhcyBOb2RlLCByTm9kZSBhcyBOb2RlLCByZWZlcmVuY2VOb2RlTmFtZSk7XG4gIGlmIChwYXRoID09PSBudWxsICYmIHBhcmVudFJOb2RlICE9PSByTm9kZSkge1xuICAgIC8vIFNlYXJjaGluZyBmb3IgYSBwYXRoIGJldHdlZW4gZWxlbWVudHMgd2l0aGluIGEgaG9zdCBub2RlIGZhaWxlZC5cbiAgICAvLyBUcnlpbmcgdG8gZmluZCBhIHBhdGggdG8gYW4gZWxlbWVudCBzdGFydGluZyBmcm9tIHRoZSBgZG9jdW1lbnQuYm9keWAgaW5zdGVhZC5cbiAgICAvL1xuICAgIC8vIEltcG9ydGFudCBub3RlOiB0aGlzIHR5cGUgb2YgcmVmZXJlbmNlIGlzIHJlbGF0aXZlbHkgdW5zdGFibGUsIHNpbmNlIEFuZ3VsYXJcbiAgICAvLyBtYXkgbm90IGJlIGFibGUgdG8gY29udHJvbCBwYXJ0cyBvZiB0aGUgcGFnZSB0aGF0IHRoZSBydW50aW1lIGxvZ2ljIG5hdmlnYXRlc1xuICAgIC8vIHRocm91Z2guIFRoaXMgaXMgbW9zdGx5IG5lZWRlZCB0byBjb3ZlciBcInBvcnRhbHNcIiB1c2UtY2FzZSAobGlrZSBtZW51cywgZGlhbG9nIGJveGVzLFxuICAgIC8vIGV0YyksIHdoZXJlIG5vZGVzIGFyZSBjb250ZW50LXByb2plY3RlZCAoaW5jbHVkaW5nIGRpcmVjdCBET00gbWFuaXB1bGF0aW9ucykgb3V0c2lkZVxuICAgIC8vIG9mIHRoZSBob3N0IG5vZGUuIFRoZSBiZXR0ZXIgc29sdXRpb24gaXMgdG8gcHJvdmlkZSBBUElzIHRvIHdvcmsgd2l0aCBcInBvcnRhbHNcIixcbiAgICAvLyBhdCB3aGljaCBwb2ludCB0aGlzIGNvZGUgcGF0aCB3b3VsZCBub3QgYmUgbmVlZGVkLlxuICAgIGNvbnN0IGJvZHkgPSAocGFyZW50Uk5vZGUgYXMgTm9kZSkub3duZXJEb2N1bWVudCEuYm9keSBhcyBOb2RlO1xuICAgIHBhdGggPSBjYWxjUGF0aEJldHdlZW4oYm9keSwgck5vZGUgYXMgTm9kZSwgUkVGRVJFTkNFX05PREVfQk9EWSk7XG5cbiAgICBpZiAocGF0aCA9PT0gbnVsbCkge1xuICAgICAgLy8gSWYgdGhlIHBhdGggaXMgc3RpbGwgZW1wdHksIGl0J3MgbGlrZWx5IHRoYXQgdGhpcyBub2RlIGlzIGRldGFjaGVkIGFuZFxuICAgICAgLy8gd29uJ3QgYmUgZm91bmQgZHVyaW5nIGh5ZHJhdGlvbi5cbiAgICAgIHRocm93IG5vZGVOb3RGb3VuZEVycm9yKGxWaWV3LCB0Tm9kZSk7XG4gICAgfVxuICB9XG4gIHJldHVybiBwYXRoITtcbn1cbiJdfQ==