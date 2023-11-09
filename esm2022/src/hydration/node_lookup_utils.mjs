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
    const parentTNode = tNode.parent;
    let parentIndex;
    let parentRNode;
    let referenceNodeName;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9kZV9sb29rdXBfdXRpbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9oeWRyYXRpb24vbm9kZV9sb29rdXBfdXRpbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBSUgsT0FBTyxFQUFDLDBCQUEwQixFQUFFLGFBQWEsRUFBRSxJQUFJLEVBQWUsTUFBTSw0QkFBNEIsQ0FBQztBQUN6RyxPQUFPLEVBQUMsa0JBQWtCLEVBQUMsTUFBTSw4QkFBOEIsQ0FBQztBQUNoRSxPQUFPLEVBQUMsYUFBYSxFQUFDLE1BQU0sNEJBQTRCLENBQUM7QUFDekQsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLGlDQUFpQyxDQUFDO0FBQ2hFLE9BQU8sRUFBQyxnQkFBZ0IsRUFBRSxXQUFXLEVBQUMsTUFBTSw0QkFBNEIsQ0FBQztBQUN6RSxPQUFPLEVBQUMsYUFBYSxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFFN0MsT0FBTyxFQUFDLG9CQUFvQixFQUFFLHNCQUFzQixFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQzNFLE9BQU8sRUFBQyx1QkFBdUIsRUFBRSxpQkFBaUIsRUFBRSx5QkFBeUIsRUFBQyxNQUFNLGtCQUFrQixDQUFDO0FBQ3ZHLE9BQU8sRUFBaUIsa0JBQWtCLEVBQUUsS0FBSyxFQUFFLG1CQUFtQixFQUFFLG1CQUFtQixFQUFDLE1BQU0sY0FBYyxDQUFDO0FBQ2pILE9BQU8sRUFBQywyQkFBMkIsRUFBRSxjQUFjLEVBQUMsTUFBTSxTQUFTLENBQUM7QUFHcEUsa0VBQWtFO0FBQ2xFLFNBQVMsMkJBQTJCLENBQUMsS0FBWTtJQUMvQyxPQUFPLENBQUMsS0FBSyxDQUFDLElBQUksSUFBSSxLQUFLLENBQUMsTUFBTSxFQUFFLElBQUksdUNBQStCLENBQUM7QUFDMUUsQ0FBQztBQUVELGdFQUFnRTtBQUNoRSxTQUFTLGdCQUFnQixDQUFDLEtBQVk7SUFDcEMs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Q0FBQyxhQUFjLENBQUMsSUFBWSxDQUFDO1FBQy9ELElBQUksR0FBRyxlQUFlLENBQUMsSUFBSSxFQUFFLEtBQWEsRUFBRSxtQkFBbUIsQ0FBQyxDQUFDO1FBRWpFLElBQUksSUFBSSxLQUFLLElBQUksRUFBRSxDQUFDO1lBQ2xCLHlFQUF5RTtZQUN6RSxtQ0FBbUM7WUFDbkMsTUFBTSxpQkFBaUIsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDeEMsQ0FBQztJQUNILENBQUM7SUFDRCxPQUFPLElBQUssQ0FBQztBQUNmLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtUTm9kZSwgVE5vZGVUeXBlfSBmcm9tICcuLi9yZW5kZXIzL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge1JFbGVtZW50LCBSTm9kZX0gZnJvbSAnLi4vcmVuZGVyMy9pbnRlcmZhY2VzL3JlbmRlcmVyX2RvbSc7XG5pbXBvcnQge0RFQ0xBUkFUSU9OX0NPTVBPTkVOVF9WSUVXLCBIRUFERVJfT0ZGU0VULCBIT1NULCBMVmlldywgVFZpZXd9IGZyb20gJy4uL3JlbmRlcjMvaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7Z2V0Rmlyc3ROYXRpdmVOb2RlfSBmcm9tICcuLi9yZW5kZXIzL25vZGVfbWFuaXB1bGF0aW9uJztcbmltcG9ydCB7ybXJtXJlc29sdmVCb2R5fSBmcm9tICcuLi9yZW5kZXIzL3V0aWwvbWlzY191dGlscyc7XG5pbXBvcnQge3JlbmRlclN0cmluZ2lmeX0gZnJvbSAnLi4vcmVuZGVyMy91dGlsL3N0cmluZ2lmeV91dGlscyc7XG5pbXBvcnQge2dldE5hdGl2ZUJ5VE5vZGUsIHVud3JhcFJOb2RlfSBmcm9tICcuLi9yZW5kZXIzL3V0aWwvdmlld191dGlscyc7XG5pbXBvcnQge2Fzc2VydERlZmluZWR9IGZyb20gJy4uL3V0aWwvYXNzZXJ0JztcblxuaW1wb3J0IHtjb21wcmVzc05vZGVMb2NhdGlvbiwgZGVjb21wcmVzc05vZGVMb2NhdGlvbn0gZnJvbSAnLi9jb21wcmVzc2lvbic7XG5pbXBvcnQge25vZGVOb3RGb3VuZEF0UGF0aEVycm9yLCBub2RlTm90Rm91bmRFcnJvciwgdmFsaWRhdGVTaWJsaW5nTm9kZUV4aXN0c30gZnJvbSAnLi9lcnJvcl9oYW5kbGluZyc7XG5pbXBvcnQge0RlaHlkcmF0ZWRWaWV3LCBOb2RlTmF2aWdhdGlvblN0ZXAsIE5PREVTLCBSRUZFUkVOQ0VfTk9ERV9CT0RZLCBSRUZFUkVOQ0VfTk9ERV9IT1NUfSBmcm9tICcuL2ludGVyZmFjZXMnO1xuaW1wb3J0IHtjYWxjU2VyaWFsaXplZENvbnRhaW5lclNpemUsIGdldFNlZ21lbnRIZWFkfSBmcm9tICcuL3V0aWxzJztcblxuXG4vKiogV2hldGhlciBjdXJyZW50IFROb2RlIGlzIGEgZmlyc3Qgbm9kZSBpbiBhbiA8bmctY29udGFpbmVyPi4gKi9cbmZ1bmN0aW9uIGlzRmlyc3RFbGVtZW50SW5OZ0NvbnRhaW5lcih0Tm9kZTogVE5vZGUpOiBib29sZWFuIHtcbiAgcmV0dXJuICF0Tm9kZS5wcmV2ICYmIHROb2RlLnBhcmVudD8udHlwZSA9PT0gVE5vZGVUeXBlLkVsZW1lbnRDb250YWluZXI7XG59XG5cbi8qKiBSZXR1cm5zIGFuIGluc3RydWN0aW9uIGluZGV4IChzdWJ0cmFjdGluZyBIRUFERVJfT0ZGU0VUKS4gKi9cbmZ1bmN0aW9uIGdldE5vT2Zmc2V0SW5kZXgodE5vZGU6IFROb2RlKTogbnVtYmVyIHtcbiAgcmV0dXJuIHROb2RlLmluZGV4IC0gSEVBREVSX09GRlNFVDtcbn1cblxuLyoqXG4gKiBMb2NhdGUgYSBub2RlIGluIERPTSB0cmVlIHRoYXQgY29ycmVzcG9uZHMgdG8gYSBnaXZlbiBUTm9kZS5cbiAqXG4gKiBAcGFyYW0gaHlkcmF0aW9uSW5mbyBUaGUgaHlkcmF0aW9uIGFubm90YXRpb24gZGF0YVxuICogQHBhcmFtIHRWaWV3IHRoZSBjdXJyZW50IHRWaWV3XG4gKiBAcGFyYW0gbFZpZXcgdGhlIGN1cnJlbnQgbFZpZXdcbiAqIEBwYXJhbSB0Tm9kZSB0aGUgY3VycmVudCB0Tm9kZVxuICogQHJldHVybnMgYW4gUk5vZGUgdGhhdCByZXByZXNlbnRzIGEgZ2l2ZW4gdE5vZGVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGxvY2F0ZU5leHRSTm9kZTxUIGV4dGVuZHMgUk5vZGU+KFxuICAgIGh5ZHJhdGlvbkluZm86IERlaHlkcmF0ZWRWaWV3LCB0VmlldzogVFZpZXcsIGxWaWV3OiBMVmlldzx1bmtub3duPiwgdE5vZGU6IFROb2RlKTogVHxudWxsIHtcbiAgbGV0IG5hdGl2ZTogUk5vZGV8bnVsbCA9IG51bGw7XG4gIGNvbnN0IG5vT2Zmc2V0SW5kZXggPSBnZXROb09mZnNldEluZGV4KHROb2RlKTtcbiAgY29uc3Qgbm9kZXMgPSBoeWRyYXRpb25JbmZvLmRhdGFbTk9ERVNdO1xuICBpZiAobm9kZXM/Lltub09mZnNldEluZGV4XSkge1xuICAgIC8vIFdlIGtub3cgdGhlIGV4YWN0IGxvY2F0aW9uIG9mIHRoZSBub2RlLlxuICAgIG5hdGl2ZSA9IGxvY2F0ZVJOb2RlQnlQYXRoKG5vZGVzW25vT2Zmc2V0SW5kZXhdLCBsVmlldyk7XG4gIH0gZWxzZSBpZiAodFZpZXcuZmlyc3RDaGlsZCA9PT0gdE5vZGUpIHtcbiAgICAvLyBXZSBjcmVhdGUgYSBmaXJzdCBub2RlIGluIHRoaXMgdmlldywgc28gd2UgdXNlIGEgcmVmZXJlbmNlXG4gICAgLy8gdG8gdGhlIGZpcnN0IGNoaWxkIGluIHRoaXMgRE9NIHNlZ21lbnQuXG4gICAgbmF0aXZlID0gaHlkcmF0aW9uSW5mby5maXJzdENoaWxkO1xuICB9IGVsc2Uge1xuICAgIC8vIExvY2F0ZSBhIG5vZGUgYmFzZWQgb24gYSBwcmV2aW91cyBzaWJsaW5nIG9yIGEgcGFyZW50IG5vZGUuXG4gICAgY29uc3QgcHJldmlvdXNUTm9kZVBhcmVudCA9IHROb2RlLnByZXYgPT09IG51bGw7XG4gICAgY29uc3QgcHJldmlvdXNUTm9kZSA9ICh0Tm9kZS5wcmV2ID8/IHROb2RlLnBhcmVudCkhO1xuICAgIG5nRGV2TW9kZSAmJlxuICAgICAgICBhc3NlcnREZWZpbmVkKFxuICAgICAgICAgICAgcHJldmlvdXNUTm9kZSxcbiAgICAgICAgICAgICdVbmV4cGVjdGVkIHN0YXRlOiBjdXJyZW50IFROb2RlIGRvZXMgbm90IGhhdmUgYSBjb25uZWN0aW9uICcgK1xuICAgICAgICAgICAgICAgICd0byB0aGUgcHJldmlvdXMgbm9kZSBvciBhIHBhcmVudCBub2RlLicpO1xuICAgIGlmIChpc0ZpcnN0RWxlbWVudEluTmdDb250YWluZXIodE5vZGUpKSB7XG4gICAgICBjb25zdCBub09mZnNldFBhcmVudEluZGV4ID0gZ2V0Tm9PZmZzZXRJbmRleCh0Tm9kZS5wYXJlbnQhKTtcbiAgICAgIG5hdGl2ZSA9IGdldFNlZ21lbnRIZWFkKGh5ZHJhdGlvbkluZm8sIG5vT2Zmc2V0UGFyZW50SW5kZXgpO1xuICAgIH0gZWxzZSB7XG4gICAgICBsZXQgcHJldmlvdXNSRWxlbWVudCA9IGdldE5hdGl2ZUJ5VE5vZGUocHJldmlvdXNUTm9kZSwgbFZpZXcpO1xuICAgICAgaWYgKHByZXZpb3VzVE5vZGVQYXJlbnQpIHtcbiAgICAgICAgbmF0aXZlID0gKHByZXZpb3VzUkVsZW1lbnQgYXMgUkVsZW1lbnQpLmZpcnN0Q2hpbGQ7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBJZiB0aGUgcHJldmlvdXMgbm9kZSBpcyBhbiBlbGVtZW50LCBidXQgaXQgYWxzbyBoYXMgY29udGFpbmVyIGluZm8sXG4gICAgICAgIC8vIHRoaXMgbWVhbnMgdGhhdCB3ZSBhcmUgcHJvY2Vzc2luZyBhIG5vZGUgbGlrZSBgPGRpdiAjdmNyVGFyZ2V0PmAsIHdoaWNoIGlzXG4gICAgICAgIC8vIHJlcHJlc2VudGVkIGluIHRoZSBET00gYXMgYDxkaXY+PC9kaXY+Li4uPCEtLWNvbnRhaW5lci0tPmAuXG4gICAgICAgIC8vIEluIHRoaXMgY2FzZSwgdGhlcmUgYXJlIG5vZGVzICphZnRlciogdGhpcyBlbGVtZW50IGFuZCB3ZSBuZWVkIHRvIHNraXBcbiAgICAgICAgLy8gYWxsIG9mIHRoZW0gdG8gcmVhY2ggYW4gZWxlbWVudCB0aGF0IHdlIGFyZSBsb29raW5nIGZvci5cbiAgICAgICAgY29uc3Qgbm9PZmZzZXRQcmV2U2libGluZ0luZGV4ID0gZ2V0Tm9PZmZzZXRJbmRleChwcmV2aW91c1ROb2RlKTtcbiAgICAgICAgY29uc3Qgc2VnbWVudEhlYWQgPSBnZXRTZWdtZW50SGVhZChoeWRyYXRpb25JbmZvLCBub09mZnNldFByZXZTaWJsaW5nSW5kZXgpO1xuICAgICAgICBpZiAocHJldmlvdXNUTm9kZS50eXBlID09PSBUTm9kZVR5cGUuRWxlbWVudCAmJiBzZWdtZW50SGVhZCkge1xuICAgICAgICAgIGNvbnN0IG51bVJvb3ROb2Rlc1RvU2tpcCA9XG4gICAgICAgICAgICAgIGNhbGNTZXJpYWxpemVkQ29udGFpbmVyU2l6ZShoeWRyYXRpb25JbmZvLCBub09mZnNldFByZXZTaWJsaW5nSW5kZXgpO1xuICAgICAgICAgIC8vIGArMWAgc3RhbmRzIGZvciBhbiBhbmNob3IgY29tbWVudCBub2RlIGFmdGVyIGFsbCB0aGUgdmlld3MgaW4gdGhpcyBjb250YWluZXIuXG4gICAgICAgICAgY29uc3Qgbm9kZXNUb1NraXAgPSBudW1Sb290Tm9kZXNUb1NraXAgKyAxO1xuICAgICAgICAgIC8vIEZpcnN0IG5vZGUgYWZ0ZXIgdGhpcyBzZWdtZW50LlxuICAgICAgICAgIG5hdGl2ZSA9IHNpYmxpbmdBZnRlcihub2Rlc1RvU2tpcCwgc2VnbWVudEhlYWQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG5hdGl2ZSA9IHByZXZpb3VzUkVsZW1lbnQubmV4dFNpYmxpbmc7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIG5hdGl2ZSBhcyBUO1xufVxuXG4vKipcbiAqIFNraXBzIG92ZXIgYSBzcGVjaWZpZWQgbnVtYmVyIG9mIG5vZGVzIGFuZCByZXR1cm5zIHRoZSBuZXh0IHNpYmxpbmcgbm9kZSBhZnRlciB0aGF0LlxuICovXG5leHBvcnQgZnVuY3Rpb24gc2libGluZ0FmdGVyPFQgZXh0ZW5kcyBSTm9kZT4oc2tpcDogbnVtYmVyLCBmcm9tOiBSTm9kZSk6IFR8bnVsbCB7XG4gIGxldCBjdXJyZW50Tm9kZSA9IGZyb207XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgc2tpcDsgaSsrKSB7XG4gICAgbmdEZXZNb2RlICYmIHZhbGlkYXRlU2libGluZ05vZGVFeGlzdHMoY3VycmVudE5vZGUpO1xuICAgIGN1cnJlbnROb2RlID0gY3VycmVudE5vZGUubmV4dFNpYmxpbmchO1xuICB9XG4gIHJldHVybiBjdXJyZW50Tm9kZSBhcyBUO1xufVxuXG4vKipcbiAqIEhlbHBlciBmdW5jdGlvbiB0byBwcm9kdWNlIGEgc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBuYXZpZ2F0aW9uIHN0ZXBzXG4gKiAoaW4gdGVybXMgb2YgYG5leHRTaWJsaW5nYCBhbmQgYGZpcnN0Q2hpbGRgIG5hdmlnYXRpb25zKS4gVXNlZCBpbiBlcnJvclxuICogbWVzc2FnZXMgaW4gZGV2IG1vZGUuXG4gKi9cbmZ1bmN0aW9uIHN0cmluZ2lmeU5hdmlnYXRpb25JbnN0cnVjdGlvbnMoaW5zdHJ1Y3Rpb25zOiAobnVtYmVyfE5vZGVOYXZpZ2F0aW9uU3RlcClbXSk6IHN0cmluZyB7XG4gIGNvbnN0IGNvbnRhaW5lciA9IFtdO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGluc3RydWN0aW9ucy5sZW5ndGg7IGkgKz0gMikge1xuICAgIGNvbnN0IHN0ZXAgPSBpbnN0cnVjdGlvbnNbaV07XG4gICAgY29uc3QgcmVwZWF0ID0gaW5zdHJ1Y3Rpb25zW2kgKyAxXSBhcyBudW1iZXI7XG4gICAgZm9yIChsZXQgciA9IDA7IHIgPCByZXBlYXQ7IHIrKykge1xuICAgICAgY29udGFpbmVyLnB1c2goc3RlcCA9PT0gTm9kZU5hdmlnYXRpb25TdGVwLkZpcnN0Q2hpbGQgPyAnZmlyc3RDaGlsZCcgOiAnbmV4dFNpYmxpbmcnKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGNvbnRhaW5lci5qb2luKCcuJyk7XG59XG5cbi8qKlxuICogSGVscGVyIGZ1bmN0aW9uIHRoYXQgbmF2aWdhdGVzIGZyb20gYSBzdGFydGluZyBwb2ludCBub2RlICh0aGUgYGZyb21gIG5vZGUpXG4gKiB1c2luZyBwcm92aWRlZCBzZXQgb2YgbmF2aWdhdGlvbiBpbnN0cnVjdGlvbnMgKHdpdGhpbiBgcGF0aGAgYXJndW1lbnQpLlxuICovXG5mdW5jdGlvbiBuYXZpZ2F0ZVRvTm9kZShmcm9tOiBOb2RlLCBpbnN0cnVjdGlvbnM6IChudW1iZXJ8Tm9kZU5hdmlnYXRpb25TdGVwKVtdKTogUk5vZGUge1xuICBsZXQgbm9kZSA9IGZyb207XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgaW5zdHJ1Y3Rpb25zLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgY29uc3Qgc3RlcCA9IGluc3RydWN0aW9uc1tpXTtcbiAgICBjb25zdCByZXBlYXQgPSBpbnN0cnVjdGlvbnNbaSArIDFdIGFzIG51bWJlcjtcbiAgICBmb3IgKGxldCByID0gMDsgciA8IHJlcGVhdDsgcisrKSB7XG4gICAgICBpZiAobmdEZXZNb2RlICYmICFub2RlKSB7XG4gICAgICAgIHRocm93IG5vZGVOb3RGb3VuZEF0UGF0aEVycm9yKGZyb20sIHN0cmluZ2lmeU5hdmlnYXRpb25JbnN0cnVjdGlvbnMoaW5zdHJ1Y3Rpb25zKSk7XG4gICAgICB9XG4gICAgICBzd2l0Y2ggKHN0ZXApIHtcbiAgICAgICAgY2FzZSBOb2RlTmF2aWdhdGlvblN0ZXAuRmlyc3RDaGlsZDpcbiAgICAgICAgICBub2RlID0gbm9kZS5maXJzdENoaWxkITtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBOb2RlTmF2aWdhdGlvblN0ZXAuTmV4dFNpYmxpbmc6XG4gICAgICAgICAgbm9kZSA9IG5vZGUubmV4dFNpYmxpbmchO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICBpZiAobmdEZXZNb2RlICYmICFub2RlKSB7XG4gICAgdGhyb3cgbm9kZU5vdEZvdW5kQXRQYXRoRXJyb3IoZnJvbSwgc3RyaW5naWZ5TmF2aWdhdGlvbkluc3RydWN0aW9ucyhpbnN0cnVjdGlvbnMpKTtcbiAgfVxuICByZXR1cm4gbm9kZSBhcyBSTm9kZTtcbn1cblxuLyoqXG4gKiBMb2NhdGVzIGFuIFJOb2RlIGdpdmVuIGEgc2V0IG9mIG5hdmlnYXRpb24gaW5zdHJ1Y3Rpb25zICh3aGljaCBhbHNvIGNvbnRhaW5zXG4gKiBhIHN0YXJ0aW5nIHBvaW50IG5vZGUgaW5mbykuXG4gKi9cbmZ1bmN0aW9uIGxvY2F0ZVJOb2RlQnlQYXRoKHBhdGg6IHN0cmluZywgbFZpZXc6IExWaWV3KTogUk5vZGUge1xuICBjb25zdCBbcmVmZXJlbmNlTm9kZSwgLi4ubmF2aWdhdGlvbkluc3RydWN0aW9uc10gPSBkZWNvbXByZXNzTm9kZUxvY2F0aW9uKHBhdGgpO1xuICBsZXQgcmVmOiBFbGVtZW50O1xuICBpZiAocmVmZXJlbmNlTm9kZSA9PT0gUkVGRVJFTkNFX05PREVfSE9TVCkge1xuICAgIHJlZiA9IGxWaWV3W0RFQ0xBUkFUSU9OX0NPTVBPTkVOVF9WSUVXXVtIT1NUXSBhcyB1bmtub3duIGFzIEVsZW1lbnQ7XG4gIH0gZWxzZSBpZiAocmVmZXJlbmNlTm9kZSA9PT0gUkVGRVJFTkNFX05PREVfQk9EWSkge1xuICAgIHJlZiA9IMm1ybVyZXNvbHZlQm9keShcbiAgICAgICAgbFZpZXdbREVDTEFSQVRJT05fQ09NUE9ORU5UX1ZJRVddW0hPU1RdIGFzIFJFbGVtZW50ICYge293bmVyRG9jdW1lbnQ6IERvY3VtZW50fSk7XG4gIH0gZWxzZSB7XG4gICAgY29uc3QgcGFyZW50RWxlbWVudElkID0gTnVtYmVyKHJlZmVyZW5jZU5vZGUpO1xuICAgIHJlZiA9IHVud3JhcFJOb2RlKChsVmlldyBhcyBhbnkpW3BhcmVudEVsZW1lbnRJZCArIEhFQURFUl9PRkZTRVRdKSBhcyBFbGVtZW50O1xuICB9XG4gIHJldHVybiBuYXZpZ2F0ZVRvTm9kZShyZWYsIG5hdmlnYXRpb25JbnN0cnVjdGlvbnMpO1xufVxuXG4vKipcbiAqIEdlbmVyYXRlIGEgbGlzdCBvZiBET00gbmF2aWdhdGlvbiBvcGVyYXRpb25zIHRvIGdldCBmcm9tIG5vZGUgYHN0YXJ0YCB0byBub2RlIGBmaW5pc2hgLlxuICpcbiAqIE5vdGU6IGFzc3VtZXMgdGhhdCBub2RlIGBzdGFydGAgb2NjdXJzIGJlZm9yZSBub2RlIGBmaW5pc2hgIGluIGFuIGluLW9yZGVyIHRyYXZlcnNhbCBvZiB0aGUgRE9NXG4gKiB0cmVlLiBUaGF0IGlzLCB3ZSBzaG91bGQgYmUgYWJsZSB0byBnZXQgZnJvbSBgc3RhcnRgIHRvIGBmaW5pc2hgIHB1cmVseSBieSB1c2luZyBgLmZpcnN0Q2hpbGRgXG4gKiBhbmQgYC5uZXh0U2libGluZ2Agb3BlcmF0aW9ucy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG5hdmlnYXRlQmV0d2VlbihzdGFydDogTm9kZSwgZmluaXNoOiBOb2RlKTogTm9kZU5hdmlnYXRpb25TdGVwW118bnVsbCB7XG4gIGlmIChzdGFydCA9PT0gZmluaXNoKSB7XG4gICAgcmV0dXJuIFtdO1xuICB9IGVsc2UgaWYgKHN0YXJ0LnBhcmVudEVsZW1lbnQgPT0gbnVsbCB8fCBmaW5pc2gucGFyZW50RWxlbWVudCA9PSBudWxsKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH0gZWxzZSBpZiAoc3RhcnQucGFyZW50RWxlbWVudCA9PT0gZmluaXNoLnBhcmVudEVsZW1lbnQpIHtcbiAgICByZXR1cm4gbmF2aWdhdGVCZXR3ZWVuU2libGluZ3Moc3RhcnQsIGZpbmlzaCk7XG4gIH0gZWxzZSB7XG4gICAgLy8gYGZpbmlzaGAgaXMgYSBjaGlsZCBvZiBpdHMgcGFyZW50LCBzbyB0aGUgcGFyZW50IHdpbGwgYWx3YXlzIGhhdmUgYSBjaGlsZC5cbiAgICBjb25zdCBwYXJlbnQgPSBmaW5pc2gucGFyZW50RWxlbWVudCE7XG5cbiAgICBjb25zdCBwYXJlbnRQYXRoID0gbmF2aWdhdGVCZXR3ZWVuKHN0YXJ0LCBwYXJlbnQpO1xuICAgIGNvbnN0IGNoaWxkUGF0aCA9IG5hdmlnYXRlQmV0d2VlbihwYXJlbnQuZmlyc3RDaGlsZCEsIGZpbmlzaCk7XG4gICAgaWYgKCFwYXJlbnRQYXRoIHx8ICFjaGlsZFBhdGgpIHJldHVybiBudWxsO1xuXG4gICAgcmV0dXJuIFtcbiAgICAgIC8vIEZpcnN0IG5hdmlnYXRlIHRvIGBmaW5pc2hgJ3MgcGFyZW50XG4gICAgICAuLi5wYXJlbnRQYXRoLFxuICAgICAgLy8gVGhlbiB0byBpdHMgZmlyc3QgY2hpbGQuXG4gICAgICBOb2RlTmF2aWdhdGlvblN0ZXAuRmlyc3RDaGlsZCxcbiAgICAgIC8vIEFuZCBmaW5hbGx5IGZyb20gdGhhdCBub2RlIHRvIGBmaW5pc2hgIChtYXliZSBhIG5vLW9wIGlmIHdlJ3JlIGFscmVhZHkgdGhlcmUpLlxuICAgICAgLi4uY2hpbGRQYXRoLFxuICAgIF07XG4gIH1cbn1cblxuLyoqXG4gKiBDYWxjdWxhdGVzIGEgcGF0aCBiZXR3ZWVuIDIgc2libGluZyBub2RlcyAoZ2VuZXJhdGVzIGEgbnVtYmVyIG9mIGBOZXh0U2libGluZ2AgbmF2aWdhdGlvbnMpLlxuICogUmV0dXJucyBgbnVsbGAgaWYgbm8gc3VjaCBwYXRoIGV4aXN0cyBiZXR3ZWVuIHRoZSBnaXZlbiBub2Rlcy5cbiAqL1xuZnVuY3Rpb24gbmF2aWdhdGVCZXR3ZWVuU2libGluZ3Moc3RhcnQ6IE5vZGUsIGZpbmlzaDogTm9kZSk6IE5vZGVOYXZpZ2F0aW9uU3RlcFtdfG51bGwge1xuICBjb25zdCBuYXY6IE5vZGVOYXZpZ2F0aW9uU3RlcFtdID0gW107XG4gIGxldCBub2RlOiBOb2RlfG51bGwgPSBudWxsO1xuICBmb3IgKG5vZGUgPSBzdGFydDsgbm9kZSAhPSBudWxsICYmIG5vZGUgIT09IGZpbmlzaDsgbm9kZSA9IG5vZGUubmV4dFNpYmxpbmcpIHtcbiAgICBuYXYucHVzaChOb2RlTmF2aWdhdGlvblN0ZXAuTmV4dFNpYmxpbmcpO1xuICB9XG4gIC8vIElmIHRoZSBgbm9kZWAgYmVjb21lcyBgbnVsbGAgb3IgYHVuZGVmaW5lZGAgYXQgdGhlIGVuZCwgdGhhdCBtZWFucyB0aGF0IHdlXG4gIC8vIGRpZG4ndCBmaW5kIHRoZSBgZW5kYCBub2RlLCB0aHVzIHJldHVybiBgbnVsbGAgKHdoaWNoIHdvdWxkIHRyaWdnZXIgc2VyaWFsaXphdGlvblxuICAvLyBlcnJvciB0byBiZSBwcm9kdWNlZCkuXG4gIHJldHVybiBub2RlID09IG51bGwgPyBudWxsIDogbmF2O1xufVxuXG4vKipcbiAqIENhbGN1bGF0ZXMgYSBwYXRoIGJldHdlZW4gMiBub2RlcyBpbiB0ZXJtcyBvZiBgbmV4dFNpYmxpbmdgIGFuZCBgZmlyc3RDaGlsZGBcbiAqIG5hdmlnYXRpb25zOlxuICogLSB0aGUgYGZyb21gIG5vZGUgaXMgYSBrbm93biBub2RlLCB1c2VkIGFzIGFuIHN0YXJ0aW5nIHBvaW50IGZvciB0aGUgbG9va3VwXG4gKiAgICh0aGUgYGZyb21Ob2RlTmFtZWAgYXJndW1lbnQgaXMgYSBzdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgdGhlIG5vZGUpLlxuICogLSB0aGUgYHRvYCBub2RlIGlzIGEgbm9kZSB0aGF0IHRoZSBydW50aW1lIGxvZ2ljIHdvdWxkIGJlIGxvb2tpbmcgdXAsXG4gKiAgIHVzaW5nIHRoZSBwYXRoIGdlbmVyYXRlZCBieSB0aGlzIGZ1bmN0aW9uLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY2FsY1BhdGhCZXR3ZWVuKGZyb206IE5vZGUsIHRvOiBOb2RlLCBmcm9tTm9kZU5hbWU6IHN0cmluZyk6IHN0cmluZ3xudWxsIHtcbiAgY29uc3QgcGF0aCA9IG5hdmlnYXRlQmV0d2Vlbihmcm9tLCB0byk7XG4gIHJldHVybiBwYXRoID09PSBudWxsID8gbnVsbCA6IGNvbXByZXNzTm9kZUxvY2F0aW9uKGZyb21Ob2RlTmFtZSwgcGF0aCk7XG59XG5cbi8qKlxuICogSW52b2tlZCBhdCBzZXJpYWxpemF0aW9uIHRpbWUgKG9uIHRoZSBzZXJ2ZXIpIHdoZW4gYSBzZXQgb2YgbmF2aWdhdGlvblxuICogaW5zdHJ1Y3Rpb25zIG5lZWRzIHRvIGJlIGdlbmVyYXRlZCBmb3IgYSBUTm9kZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNhbGNQYXRoRm9yTm9kZSh0Tm9kZTogVE5vZGUsIGxWaWV3OiBMVmlldyk6IHN0cmluZyB7XG4gIGNvbnN0IHBhcmVudFROb2RlID0gdE5vZGUucGFyZW50O1xuICBsZXQgcGFyZW50SW5kZXg6IG51bWJlcnxzdHJpbmc7XG4gIGxldCBwYXJlbnRSTm9kZTogUk5vZGU7XG4gIGxldCByZWZlcmVuY2VOb2RlTmFtZTogc3RyaW5nO1xuICBpZiAocGFyZW50VE5vZGUgPT09IG51bGwgfHwgIShwYXJlbnRUTm9kZS50eXBlICYgVE5vZGVUeXBlLkFueVJOb2RlKSkge1xuICAgIC8vIElmIHRoZXJlIGlzIG5vIHBhcmVudCBUTm9kZSBvciBhIHBhcmVudCBUTm9kZSBkb2VzIG5vdCByZXByZXNlbnQgYW4gUk5vZGVcbiAgICAvLyAoaS5lLiBub3QgYSBET00gbm9kZSksIHVzZSBjb21wb25lbnQgaG9zdCBlbGVtZW50IGFzIGEgcmVmZXJlbmNlIG5vZGUuXG4gICAgcGFyZW50SW5kZXggPSByZWZlcmVuY2VOb2RlTmFtZSA9IFJFRkVSRU5DRV9OT0RFX0hPU1Q7XG4gICAgcGFyZW50Uk5vZGUgPSBsVmlld1tERUNMQVJBVElPTl9DT01QT05FTlRfVklFV11bSE9TVF0hO1xuICB9IGVsc2Uge1xuICAgIC8vIFVzZSBwYXJlbnQgVE5vZGUgYXMgYSByZWZlcmVuY2Ugbm9kZS5cbiAgICBwYXJlbnRJbmRleCA9IHBhcmVudFROb2RlLmluZGV4O1xuICAgIHBhcmVudFJOb2RlID0gdW53cmFwUk5vZGUobFZpZXdbcGFyZW50SW5kZXhdKTtcbiAgICByZWZlcmVuY2VOb2RlTmFtZSA9IHJlbmRlclN0cmluZ2lmeShwYXJlbnRJbmRleCAtIEhFQURFUl9PRkZTRVQpO1xuICB9XG4gIGxldCByTm9kZSA9IHVud3JhcFJOb2RlKGxWaWV3W3ROb2RlLmluZGV4XSk7XG4gIGlmICh0Tm9kZS50eXBlICYgVE5vZGVUeXBlLkFueUNvbnRhaW5lcikge1xuICAgIC8vIEZvciA8bmctY29udGFpbmVyPiBub2RlcywgaW5zdGVhZCBvZiBzZXJpYWxpemluZyBhIHJlZmVyZW5jZVxuICAgIC8vIHRvIHRoZSBhbmNob3IgY29tbWVudCBub2RlLCBzZXJpYWxpemUgYSBsb2NhdGlvbiBvZiB0aGUgZmlyc3RcbiAgICAvLyBET00gZWxlbWVudC4gUGFpcmVkIHdpdGggdGhlIGNvbnRhaW5lciBzaXplIChzZXJpYWxpemVkIGFzIGEgcGFydFxuICAgIC8vIG9mIGBuZ2guY29udGFpbmVyc2ApLCBpdCBzaG91bGQgZ2l2ZSBlbm91Z2ggaW5mb3JtYXRpb24gZm9yIHJ1bnRpbWVcbiAgICAvLyB0byBoeWRyYXRlIG5vZGVzIGluIHRoaXMgY29udGFpbmVyLlxuICAgIGNvbnN0IGZpcnN0Uk5vZGUgPSBnZXRGaXJzdE5hdGl2ZU5vZGUobFZpZXcsIHROb2RlKTtcblxuICAgIC8vIElmIGNvbnRhaW5lciBpcyBub3QgZW1wdHksIHVzZSBhIHJlZmVyZW5jZSB0byB0aGUgZmlyc3QgZWxlbWVudCxcbiAgICAvLyBvdGhlcndpc2UsIHJOb2RlIHdvdWxkIHBvaW50IHRvIGFuIGFuY2hvciBjb21tZW50IG5vZGUuXG4gICAgaWYgKGZpcnN0Uk5vZGUpIHtcbiAgICAgIHJOb2RlID0gZmlyc3RSTm9kZTtcbiAgICB9XG4gIH1cbiAgbGV0IHBhdGg6IHN0cmluZ3xudWxsID0gY2FsY1BhdGhCZXR3ZWVuKHBhcmVudFJOb2RlIGFzIE5vZGUsIHJOb2RlIGFzIE5vZGUsIHJlZmVyZW5jZU5vZGVOYW1lKTtcbiAgaWYgKHBhdGggPT09IG51bGwgJiYgcGFyZW50Uk5vZGUgIT09IHJOb2RlKSB7XG4gICAgLy8gU2VhcmNoaW5nIGZvciBhIHBhdGggYmV0d2VlbiBlbGVtZW50cyB3aXRoaW4gYSBob3N0IG5vZGUgZmFpbGVkLlxuICAgIC8vIFRyeWluZyB0byBmaW5kIGEgcGF0aCB0byBhbiBlbGVtZW50IHN0YXJ0aW5nIGZyb20gdGhlIGBkb2N1bWVudC5ib2R5YCBpbnN0ZWFkLlxuICAgIC8vXG4gICAgLy8gSW1wb3J0YW50IG5vdGU6IHRoaXMgdHlwZSBvZiByZWZlcmVuY2UgaXMgcmVsYXRpdmVseSB1bnN0YWJsZSwgc2luY2UgQW5ndWxhclxuICAgIC8vIG1heSBub3QgYmUgYWJsZSB0byBjb250cm9sIHBhcnRzIG9mIHRoZSBwYWdlIHRoYXQgdGhlIHJ1bnRpbWUgbG9naWMgbmF2aWdhdGVzXG4gICAgLy8gdGhyb3VnaC4gVGhpcyBpcyBtb3N0bHkgbmVlZGVkIHRvIGNvdmVyIFwicG9ydGFsc1wiIHVzZS1jYXNlIChsaWtlIG1lbnVzLCBkaWFsb2cgYm94ZXMsXG4gICAgLy8gZXRjKSwgd2hlcmUgbm9kZXMgYXJlIGNvbnRlbnQtcHJvamVjdGVkIChpbmNsdWRpbmcgZGlyZWN0IERPTSBtYW5pcHVsYXRpb25zKSBvdXRzaWRlXG4gICAgLy8gb2YgdGhlIGhvc3Qgbm9kZS4gVGhlIGJldHRlciBzb2x1dGlvbiBpcyB0byBwcm92aWRlIEFQSXMgdG8gd29yayB3aXRoIFwicG9ydGFsc1wiLFxuICAgIC8vIGF0IHdoaWNoIHBvaW50IHRoaXMgY29kZSBwYXRoIHdvdWxkIG5vdCBiZSBuZWVkZWQuXG4gICAgY29uc3QgYm9keSA9IChwYXJlbnRSTm9kZSBhcyBOb2RlKS5vd25lckRvY3VtZW50IS5ib2R5IGFzIE5vZGU7XG4gICAgcGF0aCA9IGNhbGNQYXRoQmV0d2Vlbihib2R5LCByTm9kZSBhcyBOb2RlLCBSRUZFUkVOQ0VfTk9ERV9CT0RZKTtcblxuICAgIGlmIChwYXRoID09PSBudWxsKSB7XG4gICAgICAvLyBJZiB0aGUgcGF0aCBpcyBzdGlsbCBlbXB0eSwgaXQncyBsaWtlbHkgdGhhdCB0aGlzIG5vZGUgaXMgZGV0YWNoZWQgYW5kXG4gICAgICAvLyB3b24ndCBiZSBmb3VuZCBkdXJpbmcgaHlkcmF0aW9uLlxuICAgICAgdGhyb3cgbm9kZU5vdEZvdW5kRXJyb3IobFZpZXcsIHROb2RlKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHBhdGghO1xufVxuIl19