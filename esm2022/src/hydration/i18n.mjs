/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { inject, Injector } from '../di';
import { isRootTemplateMessage } from '../render3/i18n/i18n_util';
import { createIcuIterator } from '../render3/instructions/i18n_icu_container_visitor';
import { isTNodeShape } from '../render3/interfaces/node';
import { HEADER_OFFSET, HYDRATION, RENDERER, TVIEW } from '../render3/interfaces/view';
import { getFirstNativeNode, nativeRemoveNode } from '../render3/node_manipulation';
import { unwrapRNode } from '../render3/util/view_utils';
import { assertDefined, assertNotEqual } from '../util/assert';
import { I18N_DATA } from './interfaces';
import { isDisconnectedRNode, locateNextRNode, tryLocateRNodeByPath } from './node_lookup_utils';
import { isI18nInSkipHydrationBlock } from './skip_hydration';
import { IS_I18N_HYDRATION_ENABLED } from './tokens';
import { getNgContainerSize, initDisconnectedNodes, isDisconnectedNode, isSerializedElementContainer, processTextNodeBeforeSerialization, } from './utils';
let _isI18nHydrationSupportEnabled = false;
let _prepareI18nBlockForHydrationImpl = () => {
    // noop unless `enablePrepareI18nBlockForHydrationImpl` is invoked.
};
export function setIsI18nHydrationSupportEnabled(enabled) {
    _isI18nHydrationSupportEnabled = enabled;
}
export function isI18nHydrationSupportEnabled() {
    return _isI18nHydrationSupportEnabled;
}
/**
 * Prepares an i18n block and its children, located at the given
 * view and instruction index, for hydration.
 *
 * @param lView lView with the i18n block
 * @param index index of the i18n block in the lView
 * @param parentTNode TNode of the parent of the i18n block
 * @param subTemplateIndex sub-template index, or -1 for the main template
 */
export function prepareI18nBlockForHydration(lView, index, parentTNode, subTemplateIndex) {
    _prepareI18nBlockForHydrationImpl(lView, index, parentTNode, subTemplateIndex);
}
export function enablePrepareI18nBlockForHydrationImpl() {
    _prepareI18nBlockForHydrationImpl = prepareI18nBlockForHydrationImpl;
}
export function isI18nHydrationEnabled(injector) {
    injector = injector ?? inject(Injector);
    return injector.get(IS_I18N_HYDRATION_ENABLED, false);
}
/**
 * Collects, if not already cached, all of the indices in the
 * given TView which are children of an i18n block.
 *
 * Since i18n blocks don't introduce a parent TNode, this is necessary
 * in order to determine which indices in a LView are translated.
 */
export function getOrComputeI18nChildren(tView, context) {
    let i18nChildren = context.i18nChildren.get(tView);
    if (i18nChildren === undefined) {
        i18nChildren = collectI18nChildren(tView);
        context.i18nChildren.set(tView, i18nChildren);
    }
    return i18nChildren;
}
function collectI18nChildren(tView) {
    const children = new Set();
    function collectI18nViews(node) {
        children.add(node.index);
        switch (node.kind) {
            case 1 /* I18nNodeKind.ELEMENT */:
            case 2 /* I18nNodeKind.PLACEHOLDER */: {
                for (const childNode of node.children) {
                    collectI18nViews(childNode);
                }
                break;
            }
            case 3 /* I18nNodeKind.ICU */: {
                for (const caseNodes of node.cases) {
                    for (const caseNode of caseNodes) {
                        collectI18nViews(caseNode);
                    }
                }
                break;
            }
        }
    }
    // Traverse through the AST of each i18n block in the LView,
    // and collect every instruction index.
    for (let i = HEADER_OFFSET; i < tView.bindingStartIndex; i++) {
        const tI18n = tView.data[i];
        if (!tI18n || !tI18n.ast) {
            continue;
        }
        for (const node of tI18n.ast) {
            collectI18nViews(node);
        }
    }
    return children.size === 0 ? null : children;
}
/**
 * Attempts to serialize i18n data for an i18n block, located at
 * the given view and instruction index.
 *
 * @param lView lView with the i18n block
 * @param index index of the i18n block in the lView
 * @param context the hydration context
 * @returns the i18n data, or null if there is no relevant data
 */
export function trySerializeI18nBlock(lView, index, context) {
    if (!context.isI18nHydrationEnabled) {
        return null;
    }
    const tView = lView[TVIEW];
    const tI18n = tView.data[index];
    if (!tI18n || !tI18n.ast) {
        return null;
    }
    const parentTNode = tView.data[tI18n.parentTNodeIndex];
    if (parentTNode && isI18nInSkipHydrationBlock(parentTNode)) {
        return null;
    }
    const serializedI18nBlock = {
        caseQueue: [],
        disconnectedNodes: new Set(),
        disjointNodes: new Set(),
    };
    serializeI18nBlock(lView, serializedI18nBlock, context, tI18n.ast);
    return serializedI18nBlock.caseQueue.length === 0 &&
        serializedI18nBlock.disconnectedNodes.size === 0 &&
        serializedI18nBlock.disjointNodes.size === 0
        ? null
        : serializedI18nBlock;
}
function serializeI18nBlock(lView, serializedI18nBlock, context, nodes) {
    let prevRNode = null;
    for (const node of nodes) {
        const nextRNode = serializeI18nNode(lView, serializedI18nBlock, context, node);
        if (nextRNode) {
            if (isDisjointNode(prevRNode, nextRNode)) {
                serializedI18nBlock.disjointNodes.add(node.index - HEADER_OFFSET);
            }
            prevRNode = nextRNode;
        }
    }
    return prevRNode;
}
/**
 * Helper to determine whether the given nodes are "disjoint".
 *
 * The i18n hydration process walks through the DOM and i18n nodes
 * at the same time. It expects the sibling DOM node of the previous
 * i18n node to be the first node of the next i18n node.
 *
 * In cases of content projection, this won't always be the case. So
 * when we detect that, we mark the node as "disjoint", ensuring that
 * we will serialize the path to the node. This way, when we hydrate the
 * i18n node, we will be able to find the correct place to start.
 */
function isDisjointNode(prevNode, nextNode) {
    return prevNode && prevNode.nextSibling !== nextNode;
}
/**
 * Process the given i18n node for serialization.
 * Returns the first RNode for the i18n node to begin hydration.
 */
function serializeI18nNode(lView, serializedI18nBlock, context, node) {
    const maybeRNode = unwrapRNode(lView[node.index]);
    if (!maybeRNode || isDisconnectedRNode(maybeRNode)) {
        serializedI18nBlock.disconnectedNodes.add(node.index - HEADER_OFFSET);
        return null;
    }
    const rNode = maybeRNode;
    switch (node.kind) {
        case 0 /* I18nNodeKind.TEXT */: {
            processTextNodeBeforeSerialization(context, rNode);
            break;
        }
        case 1 /* I18nNodeKind.ELEMENT */:
        case 2 /* I18nNodeKind.PLACEHOLDER */: {
            serializeI18nBlock(lView, serializedI18nBlock, context, node.children);
            break;
        }
        case 3 /* I18nNodeKind.ICU */: {
            const currentCase = lView[node.currentCaseLViewIndex];
            if (currentCase != null) {
                // i18n uses a negative value to signal a change to a new case, so we
                // need to invert it to get the proper value.
                const caseIdx = currentCase < 0 ? ~currentCase : currentCase;
                serializedI18nBlock.caseQueue.push(caseIdx);
                serializeI18nBlock(lView, serializedI18nBlock, context, node.cases[caseIdx]);
            }
            break;
        }
    }
    return getFirstNativeNodeForI18nNode(lView, node);
}
/**
 * Helper function to get the first native node to begin hydrating
 * the given i18n node.
 */
function getFirstNativeNodeForI18nNode(lView, node) {
    const tView = lView[TVIEW];
    const maybeTNode = tView.data[node.index];
    if (isTNodeShape(maybeTNode)) {
        // If the node is backed by an actual TNode, we can simply delegate.
        return getFirstNativeNode(lView, maybeTNode);
    }
    else if (node.kind === 3 /* I18nNodeKind.ICU */) {
        // A nested ICU container won't have an actual TNode. In that case, we can use
        // an iterator to find the first child.
        const icuIterator = createIcuIterator(maybeTNode, lView);
        let rNode = icuIterator();
        // If the ICU container has no nodes, then we use the ICU anchor as the node.
        return rNode ?? unwrapRNode(lView[node.index]);
    }
    else {
        // Otherwise, the node is a text or trivial element in an ICU container,
        // and we can just use the RNode directly.
        return unwrapRNode(lView[node.index]) ?? null;
    }
}
function setCurrentNode(state, node) {
    state.currentNode = node;
}
/**
 * Marks the current RNode as the hydration root for the given
 * AST node.
 */
function appendI18nNodeToCollection(context, state, astNode) {
    const noOffsetIndex = astNode.index - HEADER_OFFSET;
    const { disconnectedNodes } = context;
    const currentNode = state.currentNode;
    if (state.isConnected) {
        context.i18nNodes.set(noOffsetIndex, currentNode);
        // We expect the node to be connected, so ensure that it
        // is not in the set, regardless of whether we found it,
        // so that the downstream error handling can provide the
        // proper context.
        disconnectedNodes.delete(noOffsetIndex);
    }
    else {
        disconnectedNodes.add(noOffsetIndex);
    }
    return currentNode;
}
/**
 * Skip over some sibling nodes during hydration.
 *
 * Note: we use this instead of `siblingAfter` as it's expected that
 * sometimes we might encounter null nodes. In those cases, we want to
 * defer to downstream error handling to provide proper context.
 */
function skipSiblingNodes(state, skip) {
    let currentNode = state.currentNode;
    for (let i = 0; i < skip; i++) {
        if (!currentNode) {
            break;
        }
        currentNode = currentNode?.nextSibling ?? null;
    }
    return currentNode;
}
/**
 * Fork the given state into a new state for hydrating children.
 */
function forkHydrationState(state, nextNode) {
    return { currentNode: nextNode, isConnected: state.isConnected };
}
function prepareI18nBlockForHydrationImpl(lView, index, parentTNode, subTemplateIndex) {
    const hydrationInfo = lView[HYDRATION];
    if (!hydrationInfo) {
        return;
    }
    if (!isI18nHydrationSupportEnabled() ||
        (parentTNode &&
            (isI18nInSkipHydrationBlock(parentTNode) ||
                isDisconnectedNode(hydrationInfo, parentTNode.index - HEADER_OFFSET)))) {
        return;
    }
    const tView = lView[TVIEW];
    const tI18n = tView.data[index];
    ngDevMode &&
        assertDefined(tI18n, 'Expected i18n data to be present in a given TView slot during hydration');
    function findHydrationRoot() {
        if (isRootTemplateMessage(subTemplateIndex)) {
            // This is the root of an i18n block. In this case, our hydration root will
            // depend on where our parent TNode (i.e. the block with i18n applied) is
            // in the DOM.
            ngDevMode && assertDefined(parentTNode, 'Expected parent TNode while hydrating i18n root');
            const rootNode = locateNextRNode(hydrationInfo, tView, lView, parentTNode);
            // If this i18n block is attached to an <ng-container>, then we want to begin
            // hydrating directly with the RNode. Otherwise, for a TNode with a physical DOM
            // element, we want to recurse into the first child and begin there.
            return parentTNode.type & 8 /* TNodeType.ElementContainer */ ? rootNode : rootNode.firstChild;
        }
        // This is a nested template in an i18n block. In this case, the entire view
        // is translated, and part of a dehydrated view in a container. This means that
        // we can simply begin hydration with the first dehydrated child.
        return hydrationInfo?.firstChild;
    }
    const currentNode = findHydrationRoot();
    ngDevMode && assertDefined(currentNode, 'Expected root i18n node during hydration');
    const disconnectedNodes = initDisconnectedNodes(hydrationInfo) ?? new Set();
    const i18nNodes = (hydrationInfo.i18nNodes ??= new Map());
    const caseQueue = hydrationInfo.data[I18N_DATA]?.[index - HEADER_OFFSET] ?? [];
    const dehydratedIcuData = (hydrationInfo.dehydratedIcuData ??= new Map());
    collectI18nNodesFromDom({ hydrationInfo, lView, i18nNodes, disconnectedNodes, caseQueue, dehydratedIcuData }, { currentNode, isConnected: true }, tI18n.ast);
    // Nodes from inactive ICU cases should be considered disconnected. We track them above
    // because they aren't (and shouldn't be) serialized. Since we may mutate or create a
    // new set, we need to be sure to write the expected value back to the DehydratedView.
    hydrationInfo.disconnectedNodes = disconnectedNodes.size === 0 ? null : disconnectedNodes;
}
function collectI18nNodesFromDom(context, state, nodeOrNodes) {
    if (Array.isArray(nodeOrNodes)) {
        let nextState = state;
        for (const node of nodeOrNodes) {
            // Whenever a node doesn't directly follow the previous RNode, it
            // is given a path. We need to resume collecting nodes from that location
            // until and unless we find another disjoint node.
            const targetNode = tryLocateRNodeByPath(context.hydrationInfo, context.lView, node.index - HEADER_OFFSET);
            if (targetNode) {
                nextState = forkHydrationState(state, targetNode);
            }
            collectI18nNodesFromDom(context, nextState, node);
        }
    }
    else {
        if (context.disconnectedNodes.has(nodeOrNodes.index - HEADER_OFFSET)) {
            // i18n nodes can be considered disconnected if e.g. they were projected.
            // In that case, we have to make sure to skip over them.
            return;
        }
        switch (nodeOrNodes.kind) {
            case 0 /* I18nNodeKind.TEXT */: {
                // Claim a text node for hydration
                const currentNode = appendI18nNodeToCollection(context, state, nodeOrNodes);
                setCurrentNode(state, currentNode?.nextSibling ?? null);
                break;
            }
            case 1 /* I18nNodeKind.ELEMENT */: {
                // Recurse into the current element's children...
                collectI18nNodesFromDom(context, forkHydrationState(state, state.currentNode?.firstChild ?? null), nodeOrNodes.children);
                // And claim the parent element itself.
                const currentNode = appendI18nNodeToCollection(context, state, nodeOrNodes);
                setCurrentNode(state, currentNode?.nextSibling ?? null);
                break;
            }
            case 2 /* I18nNodeKind.PLACEHOLDER */: {
                const noOffsetIndex = nodeOrNodes.index - HEADER_OFFSET;
                const { hydrationInfo } = context;
                const containerSize = getNgContainerSize(hydrationInfo, noOffsetIndex);
                switch (nodeOrNodes.type) {
                    case 0 /* I18nPlaceholderType.ELEMENT */: {
                        // Hydration expects to find the head of the element.
                        const currentNode = appendI18nNodeToCollection(context, state, nodeOrNodes);
                        // A TNode for the node may not yet if we're hydrating during the first pass,
                        // so use the serialized data to determine if this is an <ng-container>.
                        if (isSerializedElementContainer(hydrationInfo, noOffsetIndex)) {
                            // An <ng-container> doesn't have a physical DOM node, so we need to
                            // continue hydrating from siblings.
                            collectI18nNodesFromDom(context, state, nodeOrNodes.children);
                            // Skip over the anchor element. It will be claimed by the
                            // downstream container hydration.
                            const nextNode = skipSiblingNodes(state, 1);
                            setCurrentNode(state, nextNode);
                        }
                        else {
                            // Non-container elements represent an actual node in the DOM, so we
                            // need to continue hydration with the children, and claim the node.
                            collectI18nNodesFromDom(context, forkHydrationState(state, state.currentNode?.firstChild ?? null), nodeOrNodes.children);
                            setCurrentNode(state, currentNode?.nextSibling ?? null);
                            // Elements can also be the anchor of a view container, so there may
                            // be elements after this node that we need to skip.
                            if (containerSize !== null) {
                                // `+1` stands for an anchor node after all of the views in the container.
                                const nextNode = skipSiblingNodes(state, containerSize + 1);
                                setCurrentNode(state, nextNode);
                            }
                        }
                        break;
                    }
                    case 1 /* I18nPlaceholderType.SUBTEMPLATE */: {
                        ngDevMode &&
                            assertNotEqual(containerSize, null, 'Expected a container size while hydrating i18n subtemplate');
                        // Hydration expects to find the head of the template.
                        appendI18nNodeToCollection(context, state, nodeOrNodes);
                        // Skip over all of the template children, as well as the anchor
                        // node, since the template itself will handle them instead.
                        const nextNode = skipSiblingNodes(state, containerSize + 1);
                        setCurrentNode(state, nextNode);
                        break;
                    }
                }
                break;
            }
            case 3 /* I18nNodeKind.ICU */: {
                // If the current node is connected, we need to pop the next case from the
                // queue, so that the active case is also considered connected.
                const selectedCase = state.isConnected ? context.caseQueue.shift() : null;
                const childState = { currentNode: null, isConnected: false };
                // We traverse through each case, even if it's not active,
                // so that we correctly populate disconnected nodes.
                for (let i = 0; i < nodeOrNodes.cases.length; i++) {
                    collectI18nNodesFromDom(context, i === selectedCase ? state : childState, nodeOrNodes.cases[i]);
                }
                if (selectedCase !== null) {
                    // ICUs represent a branching state, and the selected case could be different
                    // than what it was on the server. In that case, we need to be able to clean
                    // up the nodes from the original case. To do that, we store the selected case.
                    context.dehydratedIcuData.set(nodeOrNodes.index, { case: selectedCase, node: nodeOrNodes });
                }
                // Hydration expects to find the ICU anchor element.
                const currentNode = appendI18nNodeToCollection(context, state, nodeOrNodes);
                setCurrentNode(state, currentNode?.nextSibling ?? null);
                break;
            }
        }
    }
}
let _claimDehydratedIcuCaseImpl = () => {
    // noop unless `enableClaimDehydratedIcuCaseImpl` is invoked
};
/**
 * Mark the case for the ICU node at the given index in the view as claimed,
 * allowing its nodes to be hydrated and not cleaned up.
 */
export function claimDehydratedIcuCase(lView, icuIndex, caseIndex) {
    _claimDehydratedIcuCaseImpl(lView, icuIndex, caseIndex);
}
export function enableClaimDehydratedIcuCaseImpl() {
    _claimDehydratedIcuCaseImpl = claimDehydratedIcuCaseImpl;
}
function claimDehydratedIcuCaseImpl(lView, icuIndex, caseIndex) {
    const dehydratedIcuDataMap = lView[HYDRATION]?.dehydratedIcuData;
    if (dehydratedIcuDataMap) {
        const dehydratedIcuData = dehydratedIcuDataMap.get(icuIndex);
        if (dehydratedIcuData?.case === caseIndex) {
            // If the case we're attempting to claim matches the dehydrated one,
            // we remove it from the map to mark it as "claimed."
            dehydratedIcuDataMap.delete(icuIndex);
        }
    }
}
/**
 * Clean up all i18n hydration data associated with the given view.
 */
export function cleanupI18nHydrationData(lView) {
    const hydrationInfo = lView[HYDRATION];
    if (hydrationInfo) {
        const { i18nNodes, dehydratedIcuData: dehydratedIcuDataMap } = hydrationInfo;
        if (i18nNodes && dehydratedIcuDataMap) {
            const renderer = lView[RENDERER];
            for (const dehydratedIcuData of dehydratedIcuDataMap.values()) {
                cleanupDehydratedIcuData(renderer, i18nNodes, dehydratedIcuData);
            }
        }
        hydrationInfo.i18nNodes = undefined;
        hydrationInfo.dehydratedIcuData = undefined;
    }
}
function cleanupDehydratedIcuData(renderer, i18nNodes, dehydratedIcuData) {
    for (const node of dehydratedIcuData.node.cases[dehydratedIcuData.case]) {
        const rNode = i18nNodes.get(node.index - HEADER_OFFSET);
        if (rNode) {
            nativeRemoveNode(renderer, rNode, false);
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaTE4bi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL2h5ZHJhdGlvbi9pMThuLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxNQUFNLEVBQUUsUUFBUSxFQUFDLE1BQU0sT0FBTyxDQUFDO0FBQ3ZDLE9BQU8sRUFBQyxxQkFBcUIsRUFBQyxNQUFNLDJCQUEyQixDQUFDO0FBQ2hFLE9BQU8sRUFBQyxpQkFBaUIsRUFBQyxNQUFNLG9EQUFvRCxDQUFDO0FBRXJGLE9BQU8sRUFBQyxZQUFZLEVBQW1CLE1BQU0sNEJBQTRCLENBQUM7QUFHMUUsT0FBTyxFQUFDLGFBQWEsRUFBRSxTQUFTLEVBQVMsUUFBUSxFQUFTLEtBQUssRUFBQyxNQUFNLDRCQUE0QixDQUFDO0FBQ25HLE9BQU8sRUFBQyxrQkFBa0IsRUFBRSxnQkFBZ0IsRUFBQyxNQUFNLDhCQUE4QixDQUFDO0FBQ2xGLE9BQU8sRUFBQyxXQUFXLEVBQUMsTUFBTSw0QkFBNEIsQ0FBQztBQUN2RCxPQUFPLEVBQUMsYUFBYSxFQUFFLGNBQWMsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBRzdELE9BQU8sRUFBb0MsU0FBUyxFQUFDLE1BQU0sY0FBYyxDQUFDO0FBQzFFLE9BQU8sRUFBQyxtQkFBbUIsRUFBRSxlQUFlLEVBQUUsb0JBQW9CLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUMvRixPQUFPLEVBQUMsMEJBQTBCLEVBQUMsTUFBTSxrQkFBa0IsQ0FBQztBQUM1RCxPQUFPLEVBQUMseUJBQXlCLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDbkQsT0FBTyxFQUNMLGtCQUFrQixFQUNsQixxQkFBcUIsRUFDckIsa0JBQWtCLEVBQ2xCLDRCQUE0QixFQUM1QixrQ0FBa0MsR0FDbkMsTUFBTSxTQUFTLENBQUM7QUFFakIsSUFBSSw4QkFBOEIsR0FBRyxLQUFLLENBQUM7QUFFM0MsSUFB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RCxJQUFJLEtBQUssRUFBRSxDQUFDO1lBQ1YsZ0JBQWdCLENBQUMsUUFBUSxFQUFFLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztRQUMzQyxDQUFDO0lBQ0gsQ0FBQztBQUNILENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtpbmplY3QsIEluamVjdG9yfSBmcm9tICcuLi9kaSc7XG5pbXBvcnQge2lzUm9vdFRlbXBsYXRlTWVzc2FnZX0gZnJvbSAnLi4vcmVuZGVyMy9pMThuL2kxOG5fdXRpbCc7XG5pbXBvcnQge2NyZWF0ZUljdUl0ZXJhdG9yfSBmcm9tICcuLi9yZW5kZXIzL2luc3RydWN0aW9ucy9pMThuX2ljdV9jb250YWluZXJfdmlzaXRvcic7XG5pbXBvcnQge0kxOG5Ob2RlLCBJMThuTm9kZUtpbmQsIEkxOG5QbGFjZWhvbGRlclR5cGUsIFRJMThuLCBUSWN1fSBmcm9tICcuLi9yZW5kZXIzL2ludGVyZmFjZXMvaTE4bic7XG5pbXBvcnQge2lzVE5vZGVTaGFwZSwgVE5vZGUsIFROb2RlVHlwZX0gZnJvbSAnLi4vcmVuZGVyMy9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHR5cGUge1JlbmRlcmVyfSBmcm9tICcuLi9yZW5kZXIzL2ludGVyZmFjZXMvcmVuZGVyZXInO1xuaW1wb3J0IHR5cGUge1JOb2RlfSBmcm9tICcuLi9yZW5kZXIzL2ludGVyZmFjZXMvcmVuZGVyZXJfZG9tJztcbmltcG9ydCB7SEVBREVSX09GRlNFVCwgSFlEUkFUSU9OLCBMVmlldywgUkVOREVSRVIsIFRWaWV3LCBUVklFV30gZnJvbSAnLi4vcmVuZGVyMy9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHtnZXRGaXJzdE5hdGl2ZU5vZGUsIG5hdGl2ZVJlbW92ZU5vZGV9IGZyb20gJy4uL3JlbmRlcjMvbm9kZV9tYW5pcHVsYXRpb24nO1xuaW1wb3J0IHt1bndyYXBSTm9kZX0gZnJvbSAnLi4vcmVuZGVyMy91dGlsL3ZpZXdfdXRpbHMnO1xuaW1wb3J0IHthc3NlcnREZWZpbmVkLCBhc3NlcnROb3RFcXVhbH0gZnJvbSAnLi4vdXRpbC9hc3NlcnQnO1xuXG5pbXBvcnQgdHlwZSB7SHlkcmF0aW9uQ29udGV4dH0gZnJvbSAnLi9hbm5vdGF0ZSc7XG5pbXBvcnQge0RlaHlkcmF0ZWRJY3VEYXRhLCBEZWh5ZHJhdGVkVmlldywgSTE4Tl9EQVRBfSBmcm9tICcuL2ludGVyZmFjZXMnO1xuaW1wb3J0IHtpc0Rpc2Nvbm5lY3RlZFJOb2RlLCBsb2NhdGVOZXh0Uk5vZGUsIHRyeUxvY2F0ZVJOb2RlQnlQYXRofSBmcm9tICcuL25vZGVfbG9va3VwX3V0aWxzJztcbmltcG9ydCB7aXNJMThuSW5Ta2lwSHlkcmF0aW9uQmxvY2t9IGZyb20gJy4vc2tpcF9oeWRyYXRpb24nO1xuaW1wb3J0IHtJU19JMThOX0hZRFJBVElPTl9FTkFCTEVEfSBmcm9tICcuL3Rva2Vucyc7XG5pbXBvcnQge1xuICBnZXROZ0NvbnRhaW5lclNpemUsXG4gIGluaXREaXNjb25uZWN0ZWROb2RlcyxcbiAgaXNEaXNjb25uZWN0ZWROb2RlLFxuICBpc1NlcmlhbGl6ZWRFbGVtZW50Q29udGFpbmVyLFxuICBwcm9jZXNzVGV4dE5vZGVCZWZvcmVTZXJpYWxpemF0aW9uLFxufSBmcm9tICcuL3V0aWxzJztcblxubGV0IF9pc0kxOG5IeWRyYXRpb25TdXBwb3J0RW5hYmxlZCA9IGZhbHNlO1xuXG5sZXQgX3ByZXBhcmVJMThuQmxvY2tGb3JIeWRyYXRpb25JbXBsOiB0eXBlb2YgcHJlcGFyZUkxOG5CbG9ja0Zvckh5ZHJhdGlvbkltcGwgPSAoKSA9PiB7XG4gIC8vIG5vb3AgdW5sZXNzIGBlbmFibGVQcmVwYXJlSTE4bkJsb2NrRm9ySHlkcmF0aW9uSW1wbGAgaXMgaW52b2tlZC5cbn07XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRJc0kxOG5IeWRyYXRpb25TdXBwb3J0RW5hYmxlZChlbmFibGVkOiBib29sZWFuKSB7XG4gIF9pc0kxOG5IeWRyYXRpb25TdXBwb3J0RW5hYmxlZCA9IGVuYWJsZWQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0kxOG5IeWRyYXRpb25TdXBwb3J0RW5hYmxlZCgpIHtcbiAgcmV0dXJuIF9pc0kxOG5IeWRyYXRpb25TdXBwb3J0RW5hYmxlZDtcbn1cblxuLyoqXG4gKiBQcmVwYXJlcyBhbiBpMThuIGJsb2NrIGFuZCBpdHMgY2hpbGRyZW4sIGxvY2F0ZWQgYXQgdGhlIGdpdmVuXG4gKiB2aWV3IGFuZCBpbnN0cnVjdGlvbiBpbmRleCwgZm9yIGh5ZHJhdGlvbi5cbiAqXG4gKiBAcGFyYW0gbFZpZXcgbFZpZXcgd2l0aCB0aGUgaTE4biBibG9ja1xuICogQHBhcmFtIGluZGV4IGluZGV4IG9mIHRoZSBpMThuIGJsb2NrIGluIHRoZSBsVmlld1xuICogQHBhcmFtIHBhcmVudFROb2RlIFROb2RlIG9mIHRoZSBwYXJlbnQgb2YgdGhlIGkxOG4gYmxvY2tcbiAqIEBwYXJhbSBzdWJUZW1wbGF0ZUluZGV4IHN1Yi10ZW1wbGF0ZSBpbmRleCwgb3IgLTEgZm9yIHRoZSBtYWluIHRlbXBsYXRlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwcmVwYXJlSTE4bkJsb2NrRm9ySHlkcmF0aW9uKFxuICBsVmlldzogTFZpZXcsXG4gIGluZGV4OiBudW1iZXIsXG4gIHBhcmVudFROb2RlOiBUTm9kZSB8IG51bGwsXG4gIHN1YlRlbXBsYXRlSW5kZXg6IG51bWJlcixcbik6IHZvaWQge1xuICBfcHJlcGFyZUkxOG5CbG9ja0Zvckh5ZHJhdGlvbkltcGwobFZpZXcsIGluZGV4LCBwYXJlbnRUTm9kZSwgc3ViVGVtcGxhdGVJbmRleCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBlbmFibGVQcmVwYXJlSTE4bkJsb2NrRm9ySHlkcmF0aW9uSW1wbCgpIHtcbiAgX3ByZXBhcmVJMThuQmxvY2tGb3JIeWRyYXRpb25JbXBsID0gcHJlcGFyZUkxOG5CbG9ja0Zvckh5ZHJhdGlvbkltcGw7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0kxOG5IeWRyYXRpb25FbmFibGVkKGluamVjdG9yPzogSW5qZWN0b3IpIHtcbiAgaW5qZWN0b3IgPSBpbmplY3RvciA/PyBpbmplY3QoSW5qZWN0b3IpO1xuICByZXR1cm4gaW5qZWN0b3IuZ2V0KElTX0kxOE5fSFlEUkFUSU9OX0VOQUJMRUQsIGZhbHNlKTtcbn1cblxuLyoqXG4gKiBDb2xsZWN0cywgaWYgbm90IGFscmVhZHkgY2FjaGVkLCBhbGwgb2YgdGhlIGluZGljZXMgaW4gdGhlXG4gKiBnaXZlbiBUVmlldyB3aGljaCBhcmUgY2hpbGRyZW4gb2YgYW4gaTE4biBibG9jay5cbiAqXG4gKiBTaW5jZSBpMThuIGJsb2NrcyBkb24ndCBpbnRyb2R1Y2UgYSBwYXJlbnQgVE5vZGUsIHRoaXMgaXMgbmVjZXNzYXJ5XG4gKiBpbiBvcmRlciB0byBkZXRlcm1pbmUgd2hpY2ggaW5kaWNlcyBpbiBhIExWaWV3IGFyZSB0cmFuc2xhdGVkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0T3JDb21wdXRlSTE4bkNoaWxkcmVuKFxuICB0VmlldzogVFZpZXcsXG4gIGNvbnRleHQ6IEh5ZHJhdGlvbkNvbnRleHQsXG4pOiBTZXQ8bnVtYmVyPiB8IG51bGwge1xuICBsZXQgaTE4bkNoaWxkcmVuID0gY29udGV4dC5pMThuQ2hpbGRyZW4uZ2V0KHRWaWV3KTtcbiAgaWYgKGkxOG5DaGlsZHJlbiA9PT0gdW5kZWZpbmVkKSB7XG4gICAgaTE4bkNoaWxkcmVuID0gY29sbGVjdEkxOG5DaGlsZHJlbih0Vmlldyk7XG4gICAgY29udGV4dC5pMThuQ2hpbGRyZW4uc2V0KHRWaWV3LCBpMThuQ2hpbGRyZW4pO1xuICB9XG4gIHJldHVybiBpMThuQ2hpbGRyZW47XG59XG5cbmZ1bmN0aW9uIGNvbGxlY3RJMThuQ2hpbGRyZW4odFZpZXc6IFRWaWV3KTogU2V0PG51bWJlcj4gfCBudWxsIHtcbiAgY29uc3QgY2hpbGRyZW4gPSBuZXcgU2V0PG51bWJlcj4oKTtcblxuICBmdW5jdGlvbiBjb2xsZWN0STE4blZpZXdzKG5vZGU6IEkxOG5Ob2RlKSB7XG4gICAgY2hpbGRyZW4uYWRkKG5vZGUuaW5kZXgpO1xuXG4gICAgc3dpdGNoIChub2RlLmtpbmQpIHtcbiAgICAgIGNhc2UgSTE4bk5vZGVLaW5kLkVMRU1FTlQ6XG4gICAgICBjYXNlIEkxOG5Ob2RlS2luZC5QTEFDRUhPTERFUjoge1xuICAgICAgICBmb3IgKGNvbnN0IGNoaWxkTm9kZSBvZiBub2RlLmNoaWxkcmVuKSB7XG4gICAgICAgICAgY29sbGVjdEkxOG5WaWV3cyhjaGlsZE5vZGUpO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuXG4gICAgICBjYXNlIEkxOG5Ob2RlS2luZC5JQ1U6IHtcbiAgICAgICAgZm9yIChjb25zdCBjYXNlTm9kZXMgb2Ygbm9kZS5jYXNlcykge1xuICAgICAgICAgIGZvciAoY29uc3QgY2FzZU5vZGUgb2YgY2FzZU5vZGVzKSB7XG4gICAgICAgICAgICBjb2xsZWN0STE4blZpZXdzKGNhc2VOb2RlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8gVHJhdmVyc2UgdGhyb3VnaCB0aGUgQVNUIG9mIGVhY2ggaTE4biBibG9jayBpbiB0aGUgTFZpZXcsXG4gIC8vIGFuZCBjb2xsZWN0IGV2ZXJ5IGluc3RydWN0aW9uIGluZGV4LlxuICBmb3IgKGxldCBpID0gSEVBREVSX09GRlNFVDsgaSA8IHRWaWV3LmJpbmRpbmdTdGFydEluZGV4OyBpKyspIHtcbiAgICBjb25zdCB0STE4biA9IHRWaWV3LmRhdGFbaV0gYXMgVEkxOG4gfCB1bmRlZmluZWQ7XG4gICAgaWYgKCF0STE4biB8fCAhdEkxOG4uYXN0KSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBmb3IgKGNvbnN0IG5vZGUgb2YgdEkxOG4uYXN0KSB7XG4gICAgICBjb2xsZWN0STE4blZpZXdzKG5vZGUpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBjaGlsZHJlbi5zaXplID09PSAwID8gbnVsbCA6IGNoaWxkcmVuO1xufVxuXG4vKipcbiAqIFJlc3VsdGluZyBkYXRhIGZyb20gc2VyaWFsaXppbmcgYW4gaTE4biBibG9jay5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBTZXJpYWxpemVkSTE4bkJsb2NrIHtcbiAgLyoqXG4gICAqIEEgcXVldWUgb2YgYWN0aXZlIElDVSBjYXNlcyBmcm9tIGEgZGVwdGgtZmlyc3QgdHJhdmVyc2FsXG4gICAqIG9mIHRoZSBpMThuIEFTVC4gVGhpcyBpcyBzZXJpYWxpemVkIHRvIHRoZSBjbGllbnQgaW4gb3JkZXJcbiAgICogdG8gY29ycmVjdGx5IGFzc29jaWF0ZSBET00gbm9kZXMgd2l0aCBpMThuIG5vZGVzIGR1cmluZ1xuICAgKiBoeWRyYXRpb24uXG4gICAqL1xuICBjYXNlUXVldWU6IEFycmF5PG51bWJlcj47XG5cbiAgLyoqXG4gICAqIEEgc2V0IG9mIGluZGljZXMgaW4gdGhlIGxWaWV3IG9mIHRoZSBibG9jayBmb3Igbm9kZXNcbiAgICogdGhhdCBhcmUgZGlzY29ubmVjdGVkIGZyb20gdGhlIERPTS4gSW4gaTE4biwgdGhpcyBjYW5cbiAgICogaGFwcGVuIHdoZW4gdXNpbmcgY29udGVudCBwcm9qZWN0aW9uIGJ1dCBzb21lIG5vZGVzIGFyZVxuICAgKiBub3Qgc2VsZWN0ZWQgYnkgYW4gPG5nLWNvbnRlbnQgLz4uXG4gICAqL1xuICBkaXNjb25uZWN0ZWROb2RlczogU2V0PG51bWJlcj47XG5cbiAgLyoqXG4gICAqIEEgc2V0IG9mIGluZGljZXMgaW4gdGhlIGxWaWV3IG9mIHRoZSBibG9jayBmb3Igbm9kZXNcbiAgICogY29uc2lkZXJlZCBcImRpc2pvaW50XCIsIGluZGljYXRpbmcgdGhhdCB3ZSBuZWVkIHRvIHNlcmlhbGl6ZVxuICAgKiBhIHBhdGggdG8gdGhlIG5vZGUgaW4gb3JkZXIgdG8gaHlkcmF0ZSBpdC5cbiAgICpcbiAgICogQSBub2RlIGlzIGNvbnNpZGVyZWQgZGlzam9pbnQgd2hlbiBpdHMgUk5vZGUgZG9lcyBub3RcbiAgICogZGlyZWN0bHkgZm9sbG93IHRoZSBSTm9kZSBvZiB0aGUgcHJldmlvdXMgaTE4biBub2RlLCBmb3JcbiAgICogZXhhbXBsZSwgYmVjYXVzZSBvZiBjb250ZW50IHByb2plY3Rpb24uXG4gICAqL1xuICBkaXNqb2ludE5vZGVzOiBTZXQ8bnVtYmVyPjtcbn1cblxuLyoqXG4gKiBBdHRlbXB0cyB0byBzZXJpYWxpemUgaTE4biBkYXRhIGZvciBhbiBpMThuIGJsb2NrLCBsb2NhdGVkIGF0XG4gKiB0aGUgZ2l2ZW4gdmlldyBhbmQgaW5zdHJ1Y3Rpb24gaW5kZXguXG4gKlxuICogQHBhcmFtIGxWaWV3IGxWaWV3IHdpdGggdGhlIGkxOG4gYmxvY2tcbiAqIEBwYXJhbSBpbmRleCBpbmRleCBvZiB0aGUgaTE4biBibG9jayBpbiB0aGUgbFZpZXdcbiAqIEBwYXJhbSBjb250ZXh0IHRoZSBoeWRyYXRpb24gY29udGV4dFxuICogQHJldHVybnMgdGhlIGkxOG4gZGF0YSwgb3IgbnVsbCBpZiB0aGVyZSBpcyBubyByZWxldmFudCBkYXRhXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0cnlTZXJpYWxpemVJMThuQmxvY2soXG4gIGxWaWV3OiBMVmlldyxcbiAgaW5kZXg6IG51bWJlcixcbiAgY29udGV4dDogSHlkcmF0aW9uQ29udGV4dCxcbik6IFNlcmlhbGl6ZWRJMThuQmxvY2sgfCBudWxsIHtcbiAgaWYgKCFjb250ZXh0LmlzSTE4bkh5ZHJhdGlvbkVuYWJsZWQpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIGNvbnN0IHRWaWV3ID0gbFZpZXdbVFZJRVddO1xuICBjb25zdCB0STE4biA9IHRWaWV3LmRhdGFbaW5kZXhdIGFzIFRJMThuIHwgdW5kZWZpbmVkO1xuICBpZiAoIXRJMThuIHx8ICF0STE4bi5hc3QpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIGNvbnN0IHBhcmVudFROb2RlID0gdFZpZXcuZGF0YVt0STE4bi5wYXJlbnRUTm9kZUluZGV4XSBhcyBUTm9kZTtcbiAgaWYgKHBhcmVudFROb2RlICYmIGlzSTE4bkluU2tpcEh5ZHJhdGlvbkJsb2NrKHBhcmVudFROb2RlKSkge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgY29uc3Qgc2VyaWFsaXplZEkxOG5CbG9jazogU2VyaWFsaXplZEkxOG5CbG9jayA9IHtcbiAgICBjYXNlUXVldWU6IFtdLFxuICAgIGRpc2Nvbm5lY3RlZE5vZGVzOiBuZXcgU2V0KCksXG4gICAgZGlzam9pbnROb2RlczogbmV3IFNldCgpLFxuICB9O1xuICBzZXJpYWxpemVJMThuQmxvY2sobFZpZXcsIHNlcmlhbGl6ZWRJMThuQmxvY2ssIGNvbnRleHQsIHRJMThuLmFzdCk7XG5cbiAgcmV0dXJuIHNlcmlhbGl6ZWRJMThuQmxvY2suY2FzZVF1ZXVlLmxlbmd0aCA9PT0gMCAmJlxuICAgIHNlcmlhbGl6ZWRJMThuQmxvY2suZGlzY29ubmVjdGVkTm9kZXMuc2l6ZSA9PT0gMCAmJlxuICAgIHNlcmlhbGl6ZWRJMThuQmxvY2suZGlzam9pbnROb2Rlcy5zaXplID09PSAwXG4gICAgPyBudWxsXG4gICAgOiBzZXJpYWxpemVkSTE4bkJsb2NrO1xufVxuXG5mdW5jdGlvbiBzZXJpYWxpemVJMThuQmxvY2soXG4gIGxWaWV3OiBMVmlldyxcbiAgc2VyaWFsaXplZEkxOG5CbG9jazogU2VyaWFsaXplZEkxOG5CbG9jayxcbiAgY29udGV4dDogSHlkcmF0aW9uQ29udGV4dCxcbiAgbm9kZXM6IEkxOG5Ob2RlW10sXG4pOiBOb2RlIHwgbnVsbCB7XG4gIGxldCBwcmV2Uk5vZGUgPSBudWxsO1xuICBmb3IgKGNvbnN0IG5vZGUgb2Ygbm9kZXMpIHtcbiAgICBjb25zdCBuZXh0Uk5vZGUgPSBzZXJpYWxpemVJMThuTm9kZShsVmlldywgc2VyaWFsaXplZEkxOG5CbG9jaywgY29udGV4dCwgbm9kZSk7XG4gICAgaWYgKG5leHRSTm9kZSkge1xuICAgICAgaWYgKGlzRGlzam9pbnROb2RlKHByZXZSTm9kZSwgbmV4dFJOb2RlKSkge1xuICAgICAgICBzZXJpYWxpemVkSTE4bkJsb2NrLmRpc2pvaW50Tm9kZXMuYWRkKG5vZGUuaW5kZXggLSBIRUFERVJfT0ZGU0VUKTtcbiAgICAgIH1cbiAgICAgIHByZXZSTm9kZSA9IG5leHRSTm9kZTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHByZXZSTm9kZTtcbn1cblxuLyoqXG4gKiBIZWxwZXIgdG8gZGV0ZXJtaW5lIHdoZXRoZXIgdGhlIGdpdmVuIG5vZGVzIGFyZSBcImRpc2pvaW50XCIuXG4gKlxuICogVGhlIGkxOG4gaHlkcmF0aW9uIHByb2Nlc3Mgd2Fsa3MgdGhyb3VnaCB0aGUgRE9NIGFuZCBpMThuIG5vZGVzXG4gKiBhdCB0aGUgc2FtZSB0aW1lLiBJdCBleHBlY3RzIHRoZSBzaWJsaW5nIERPTSBub2RlIG9mIHRoZSBwcmV2aW91c1xuICogaTE4biBub2RlIHRvIGJlIHRoZSBmaXJzdCBub2RlIG9mIHRoZSBuZXh0IGkxOG4gbm9kZS5cbiAqXG4gKiBJbiBjYXNlcyBvZiBjb250ZW50IHByb2plY3Rpb24sIHRoaXMgd29uJ3QgYWx3YXlzIGJlIHRoZSBjYXNlLiBTb1xuICogd2hlbiB3ZSBkZXRlY3QgdGhhdCwgd2UgbWFyayB0aGUgbm9kZSBhcyBcImRpc2pvaW50XCIsIGVuc3VyaW5nIHRoYXRcbiAqIHdlIHdpbGwgc2VyaWFsaXplIHRoZSBwYXRoIHRvIHRoZSBub2RlLiBUaGlzIHdheSwgd2hlbiB3ZSBoeWRyYXRlIHRoZVxuICogaTE4biBub2RlLCB3ZSB3aWxsIGJlIGFibGUgdG8gZmluZCB0aGUgY29ycmVjdCBwbGFjZSB0byBzdGFydC5cbiAqL1xuZnVuY3Rpb24gaXNEaXNqb2ludE5vZGUocHJldk5vZGU6IE5vZGUgfCBudWxsLCBuZXh0Tm9kZTogTm9kZSkge1xuICByZXR1cm4gcHJldk5vZGUgJiYgcHJldk5vZGUubmV4dFNpYmxpbmcgIT09IG5leHROb2RlO1xufVxuXG4vKipcbiAqIFByb2Nlc3MgdGhlIGdpdmVuIGkxOG4gbm9kZSBmb3Igc2VyaWFsaXphdGlvbi5cbiAqIFJldHVybnMgdGhlIGZpcnN0IFJOb2RlIGZvciB0aGUgaTE4biBub2RlIHRvIGJlZ2luIGh5ZHJhdGlvbi5cbiAqL1xuZnVuY3Rpb24gc2VyaWFsaXplSTE4bk5vZGUoXG4gIGxWaWV3OiBMVmlldyxcbiAgc2VyaWFsaXplZEkxOG5CbG9jazogU2VyaWFsaXplZEkxOG5CbG9jayxcbiAgY29udGV4dDogSHlkcmF0aW9uQ29udGV4dCxcbiAgbm9kZTogSTE4bk5vZGUsXG4pOiBOb2RlIHwgbnVsbCB7XG4gIGNvbnN0IG1heWJlUk5vZGUgPSB1bndyYXBSTm9kZShsVmlld1tub2RlLmluZGV4XSEpO1xuICBpZiAoIW1heWJlUk5vZGUgfHwgaXNEaXNjb25uZWN0ZWRSTm9kZShtYXliZVJOb2RlKSkge1xuICAgIHNlcmlhbGl6ZWRJMThuQmxvY2suZGlzY29ubmVjdGVkTm9kZXMuYWRkKG5vZGUuaW5kZXggLSBIRUFERVJfT0ZGU0VUKTtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIGNvbnN0IHJOb2RlID0gbWF5YmVSTm9kZSBhcyBOb2RlO1xuICBzd2l0Y2ggKG5vZGUua2luZCkge1xuICAgIGNhc2UgSTE4bk5vZGVLaW5kLlRFWFQ6IHtcbiAgICAgIHByb2Nlc3NUZXh0Tm9kZUJlZm9yZVNlcmlhbGl6YXRpb24oY29udGV4dCwgck5vZGUpO1xuICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgY2FzZSBJMThuTm9kZUtpbmQuRUxFTUVOVDpcbiAgICBjYXNlIEkxOG5Ob2RlS2luZC5QTEFDRUhPTERFUjoge1xuICAgICAgc2VyaWFsaXplSTE4bkJsb2NrKGxWaWV3LCBzZXJpYWxpemVkSTE4bkJsb2NrLCBjb250ZXh0LCBub2RlLmNoaWxkcmVuKTtcbiAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIGNhc2UgSTE4bk5vZGVLaW5kLklDVToge1xuICAgICAgY29uc3QgY3VycmVudENhc2UgPSBsVmlld1tub2RlLmN1cnJlbnRDYXNlTFZpZXdJbmRleF0gYXMgbnVtYmVyIHwgbnVsbDtcbiAgICAgIGlmIChjdXJyZW50Q2FzZSAhPSBudWxsKSB7XG4gICAgICAgIC8vIGkxOG4gdXNlcyBhIG5lZ2F0aXZlIHZhbHVlIHRvIHNpZ25hbCBhIGNoYW5nZSB0byBhIG5ldyBjYXNlLCBzbyB3ZVxuICAgICAgICAvLyBuZWVkIHRvIGludmVydCBpdCB0byBnZXQgdGhlIHByb3BlciB2YWx1ZS5cbiAgICAgICAgY29uc3QgY2FzZUlkeCA9IGN1cnJlbnRDYXNlIDwgMCA/IH5jdXJyZW50Q2FzZSA6IGN1cnJlbnRDYXNlO1xuICAgICAgICBzZXJpYWxpemVkSTE4bkJsb2NrLmNhc2VRdWV1ZS5wdXNoKGNhc2VJZHgpO1xuICAgICAgICBzZXJpYWxpemVJMThuQmxvY2sobFZpZXcsIHNlcmlhbGl6ZWRJMThuQmxvY2ssIGNvbnRleHQsIG5vZGUuY2FzZXNbY2FzZUlkeF0pO1xuICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGdldEZpcnN0TmF0aXZlTm9kZUZvckkxOG5Ob2RlKGxWaWV3LCBub2RlKSBhcyBOb2RlIHwgbnVsbDtcbn1cblxuLyoqXG4gKiBIZWxwZXIgZnVuY3Rpb24gdG8gZ2V0IHRoZSBmaXJzdCBuYXRpdmUgbm9kZSB0byBiZWdpbiBoeWRyYXRpbmdcbiAqIHRoZSBnaXZlbiBpMThuIG5vZGUuXG4gKi9cbmZ1bmN0aW9uIGdldEZpcnN0TmF0aXZlTm9kZUZvckkxOG5Ob2RlKGxWaWV3OiBMVmlldywgbm9kZTogSTE4bk5vZGUpIHtcbiAgY29uc3QgdFZpZXcgPSBsVmlld1tUVklFV107XG4gIGNvbnN0IG1heWJlVE5vZGUgPSB0Vmlldy5kYXRhW25vZGUuaW5kZXhdO1xuXG4gIGlmIChpc1ROb2RlU2hhcGUobWF5YmVUTm9kZSkpIHtcbiAgICAvLyBJZiB0aGUgbm9kZSBpcyBiYWNrZWQgYnkgYW4gYWN0dWFsIFROb2RlLCB3ZSBjYW4gc2ltcGx5IGRlbGVnYXRlLlxuICAgIHJldHVybiBnZXRGaXJzdE5hdGl2ZU5vZGUobFZpZXcsIG1heWJlVE5vZGUpO1xuICB9IGVsc2UgaWYgKG5vZGUua2luZCA9PT0gSTE4bk5vZGVLaW5kLklDVSkge1xuICAgIC8vIEEgbmVzdGVkIElDVSBjb250YWluZXIgd29uJ3QgaGF2ZSBhbiBhY3R1YWwgVE5vZGUuIEluIHRoYXQgY2FzZSwgd2UgY2FuIHVzZVxuICAgIC8vIGFuIGl0ZXJhdG9yIHRvIGZpbmQgdGhlIGZpcnN0IGNoaWxkLlxuICAgIGNvbnN0IGljdUl0ZXJhdG9yID0gY3JlYXRlSWN1SXRlcmF0b3IobWF5YmVUTm9kZSBhcyBUSWN1LCBsVmlldyk7XG4gICAgbGV0IHJOb2RlOiBSTm9kZSB8IG51bGwgPSBpY3VJdGVyYXRvcigpO1xuXG4gICAgLy8gSWYgdGhlIElDVSBjb250YWluZXIgaGFzIG5vIG5vZGVzLCB0aGVuIHdlIHVzZSB0aGUgSUNVIGFuY2hvciBhcyB0aGUgbm9kZS5cbiAgICByZXR1cm4gck5vZGUgPz8gdW53cmFwUk5vZGUobFZpZXdbbm9kZS5pbmRleF0pO1xuICB9IGVsc2Uge1xuICAgIC8vIE90aGVyd2lzZSwgdGhlIG5vZGUgaXMgYSB0ZXh0IG9yIHRyaXZpYWwgZWxlbWVudCBpbiBhbiBJQ1UgY29udGFpbmVyLFxuICAgIC8vIGFuZCB3ZSBjYW4ganVzdCB1c2UgdGhlIFJOb2RlIGRpcmVjdGx5LlxuICAgIHJldHVybiB1bndyYXBSTm9kZShsVmlld1tub2RlLmluZGV4XSkgPz8gbnVsbDtcbiAgfVxufVxuXG4vKipcbiAqIERlc2NyaWJlcyBzaGFyZWQgZGF0YSBhdmFpbGFibGUgZHVyaW5nIHRoZSBoeWRyYXRpb24gcHJvY2Vzcy5cbiAqL1xuaW50ZXJmYWNlIEkxOG5IeWRyYXRpb25Db250ZXh0IHtcbiAgaHlkcmF0aW9uSW5mbzogRGVoeWRyYXRlZFZpZXc7XG4gIGxWaWV3OiBMVmlldztcbiAgaTE4bk5vZGVzOiBNYXA8bnVtYmVyLCBSTm9kZSB8IG51bGw+O1xuICBkaXNjb25uZWN0ZWROb2RlczogU2V0PG51bWJlcj47XG4gIGNhc2VRdWV1ZTogbnVtYmVyW107XG4gIGRlaHlkcmF0ZWRJY3VEYXRhOiBNYXA8bnVtYmVyLCBEZWh5ZHJhdGVkSWN1RGF0YT47XG59XG5cbi8qKlxuICogRGVzY3JpYmVzIGN1cnJlbnQgaHlkcmF0aW9uIHN0YXRlLlxuICovXG5pbnRlcmZhY2UgSTE4bkh5ZHJhdGlvblN0YXRlIHtcbiAgLy8gVGhlIGN1cnJlbnQgbm9kZVxuICBjdXJyZW50Tm9kZTogTm9kZSB8IG51bGw7XG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgdGhlIHRyZWUgc2hvdWxkIGJlIGNvbm5lY3RlZC5cbiAgICpcbiAgICogRHVyaW5nIGh5ZHJhdGlvbiwgaXQgY2FuIGhhcHBlbiB0aGF0IHdlIGV4cGVjdCB0byBoYXZlIGFcbiAgICogY3VycmVudCBSTm9kZSwgYnV0IHdlIGRvbid0LiBJbiBzdWNoIGNhc2VzLCB3ZSBzdGlsbCBuZWVkXG4gICAqIHRvIHByb3BhZ2F0ZSB0aGUgZXhwZWN0YXRpb24gdG8gdGhlIGNvcnJlc3BvbmRpbmcgTFZpZXdzLFxuICAgKiBzbyB0aGF0IHRoZSBwcm9wZXIgZG93bnN0cmVhbSBlcnJvciBoYW5kbGluZyBjYW4gcHJvdmlkZVxuICAgKiB0aGUgY29ycmVjdCBjb250ZXh0IGZvciB0aGUgZXJyb3IuXG4gICAqL1xuICBpc0Nvbm5lY3RlZDogYm9vbGVhbjtcbn1cblxuZnVuY3Rpb24gc2V0Q3VycmVudE5vZGUoc3RhdGU6IEkxOG5IeWRyYXRpb25TdGF0ZSwgbm9kZTogTm9kZSB8IG51bGwpIHtcbiAgc3RhdGUuY3VycmVudE5vZGUgPSBub2RlO1xufVxuXG4vKipcbiAqIE1hcmtzIHRoZSBjdXJyZW50IFJOb2RlIGFzIHRoZSBoeWRyYXRpb24gcm9vdCBmb3IgdGhlIGdpdmVuXG4gKiBBU1Qgbm9kZS5cbiAqL1xuZnVuY3Rpb24gYXBwZW5kSTE4bk5vZGVUb0NvbGxlY3Rpb24oXG4gIGNvbnRleHQ6IEkxOG5IeWRyYXRpb25Db250ZXh0LFxuICBzdGF0ZTogSTE4bkh5ZHJhdGlvblN0YXRlLFxuICBhc3ROb2RlOiBJMThuTm9kZSxcbikge1xuICBjb25zdCBub09mZnNldEluZGV4ID0gYXN0Tm9kZS5pbmRleCAtIEhFQURFUl9PRkZTRVQ7XG4gIGNvbnN0IHtkaXNjb25uZWN0ZWROb2Rlc30gPSBjb250ZXh0O1xuICBjb25zdCBjdXJyZW50Tm9kZSA9IHN0YXRlLmN1cnJlbnROb2RlO1xuXG4gIGlmIChzdGF0ZS5pc0Nvbm5lY3RlZCkge1xuICAgIGNvbnRleHQuaTE4bk5vZGVzLnNldChub09mZnNldEluZGV4LCBjdXJyZW50Tm9kZSk7XG5cbiAgICAvLyBXZSBleHBlY3QgdGhlIG5vZGUgdG8gYmUgY29ubmVjdGVkLCBzbyBlbnN1cmUgdGhhdCBpdFxuICAgIC8vIGlzIG5vdCBpbiB0aGUgc2V0LCByZWdhcmRsZXNzIG9mIHdoZXRoZXIgd2UgZm91bmQgaXQsXG4gICAgLy8gc28gdGhhdCB0aGUgZG93bnN0cmVhbSBlcnJvciBoYW5kbGluZyBjYW4gcHJvdmlkZSB0aGVcbiAgICAvLyBwcm9wZXIgY29udGV4dC5cbiAgICBkaXNjb25uZWN0ZWROb2Rlcy5kZWxldGUobm9PZmZzZXRJbmRleCk7XG4gIH0gZWxzZSB7XG4gICAgZGlzY29ubmVjdGVkTm9kZXMuYWRkKG5vT2Zmc2V0SW5kZXgpO1xuICB9XG5cbiAgcmV0dXJuIGN1cnJlbnROb2RlO1xufVxuXG4vKipcbiAqIFNraXAgb3ZlciBzb21lIHNpYmxpbmcgbm9kZXMgZHVyaW5nIGh5ZHJhdGlvbi5cbiAqXG4gKiBOb3RlOiB3ZSB1c2UgdGhpcyBpbnN0ZWFkIG9mIGBzaWJsaW5nQWZ0ZXJgIGFzIGl0J3MgZXhwZWN0ZWQgdGhhdFxuICogc29tZXRpbWVzIHdlIG1pZ2h0IGVuY291bnRlciBudWxsIG5vZGVzLiBJbiB0aG9zZSBjYXNlcywgd2Ugd2FudCB0b1xuICogZGVmZXIgdG8gZG93bnN0cmVhbSBlcnJvciBoYW5kbGluZyB0byBwcm92aWRlIHByb3BlciBjb250ZXh0LlxuICovXG5mdW5jdGlvbiBza2lwU2libGluZ05vZGVzKHN0YXRlOiBJMThuSHlkcmF0aW9uU3RhdGUsIHNraXA6IG51bWJlcikge1xuICBsZXQgY3VycmVudE5vZGUgPSBzdGF0ZS5jdXJyZW50Tm9kZTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBza2lwOyBpKyspIHtcbiAgICBpZiAoIWN1cnJlbnROb2RlKSB7XG4gICAgICBicmVhaztcbiAgICB9XG4gICAgY3VycmVudE5vZGUgPSBjdXJyZW50Tm9kZT8ubmV4dFNpYmxpbmcgPz8gbnVsbDtcbiAgfVxuICByZXR1cm4gY3VycmVudE5vZGU7XG59XG5cbi8qKlxuICogRm9yayB0aGUgZ2l2ZW4gc3RhdGUgaW50byBhIG5ldyBzdGF0ZSBmb3IgaHlkcmF0aW5nIGNoaWxkcmVuLlxuICovXG5mdW5jdGlvbiBmb3JrSHlkcmF0aW9uU3RhdGUoc3RhdGU6IEkxOG5IeWRyYXRpb25TdGF0ZSwgbmV4dE5vZGU6IE5vZGUgfCBudWxsKSB7XG4gIHJldHVybiB7Y3VycmVudE5vZGU6IG5leHROb2RlLCBpc0Nvbm5lY3RlZDogc3RhdGUuaXNDb25uZWN0ZWR9O1xufVxuXG5mdW5jdGlvbiBwcmVwYXJlSTE4bkJsb2NrRm9ySHlkcmF0aW9uSW1wbChcbiAgbFZpZXc6IExWaWV3LFxuICBpbmRleDogbnVtYmVyLFxuICBwYXJlbnRUTm9kZTogVE5vZGUgfCBudWxsLFxuICBzdWJUZW1wbGF0ZUluZGV4OiBudW1iZXIsXG4pIHtcbiAgY29uc3QgaHlkcmF0aW9uSW5mbyA9IGxWaWV3W0hZRFJBVElPTl07XG4gIGlmICghaHlkcmF0aW9uSW5mbykge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGlmIChcbiAgICAhaXNJMThuSHlkcmF0aW9uU3VwcG9ydEVuYWJsZWQoKSB8fFxuICAgIChwYXJlbnRUTm9kZSAmJlxuICAgICAgKGlzSTE4bkluU2tpcEh5ZHJhdGlvbkJsb2NrKHBhcmVudFROb2RlKSB8fFxuICAgICAgICBpc0Rpc2Nvbm5lY3RlZE5vZGUoaHlkcmF0aW9uSW5mbywgcGFyZW50VE5vZGUuaW5kZXggLSBIRUFERVJfT0ZGU0VUKSkpXG4gICkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvbnN0IHRWaWV3ID0gbFZpZXdbVFZJRVddO1xuICBjb25zdCB0STE4biA9IHRWaWV3LmRhdGFbaW5kZXhdIGFzIFRJMThuO1xuICBuZ0Rldk1vZGUgJiZcbiAgICBhc3NlcnREZWZpbmVkKHRJMThuLCAnRXhwZWN0ZWQgaTE4biBkYXRhIHRvIGJlIHByZXNlbnQgaW4gYSBnaXZlbiBUVmlldyBzbG90IGR1cmluZyBoeWRyYXRpb24nKTtcblxuICBmdW5jdGlvbiBmaW5kSHlkcmF0aW9uUm9vdCgpIHtcbiAgICBpZiAoaXNSb290VGVtcGxhdGVNZXNzYWdlKHN1YlRlbXBsYXRlSW5kZXgpKSB7XG4gICAgICAvLyBUaGlzIGlzIHRoZSByb290IG9mIGFuIGkxOG4gYmxvY2suIEluIHRoaXMgY2FzZSwgb3VyIGh5ZHJhdGlvbiByb290IHdpbGxcbiAgICAgIC8vIGRlcGVuZCBvbiB3aGVyZSBvdXIgcGFyZW50IFROb2RlIChpLmUuIHRoZSBibG9jayB3aXRoIGkxOG4gYXBwbGllZCkgaXNcbiAgICAgIC8vIGluIHRoZSBET00uXG4gICAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChwYXJlbnRUTm9kZSwgJ0V4cGVjdGVkIHBhcmVudCBUTm9kZSB3aGlsZSBoeWRyYXRpbmcgaTE4biByb290Jyk7XG4gICAgICBjb25zdCByb290Tm9kZSA9IGxvY2F0ZU5leHRSTm9kZShoeWRyYXRpb25JbmZvISwgdFZpZXcsIGxWaWV3LCBwYXJlbnRUTm9kZSEpIGFzIE5vZGU7XG5cbiAgICAgIC8vIElmIHRoaXMgaTE4biBibG9jayBpcyBhdHRhY2hlZCB0byBhbiA8bmctY29udGFpbmVyPiwgdGhlbiB3ZSB3YW50IHRvIGJlZ2luXG4gICAgICAvLyBoeWRyYXRpbmcgZGlyZWN0bHkgd2l0aCB0aGUgUk5vZGUuIE90aGVyd2lzZSwgZm9yIGEgVE5vZGUgd2l0aCBhIHBoeXNpY2FsIERPTVxuICAgICAgLy8gZWxlbWVudCwgd2Ugd2FudCB0byByZWN1cnNlIGludG8gdGhlIGZpcnN0IGNoaWxkIGFuZCBiZWdpbiB0aGVyZS5cbiAgICAgIHJldHVybiBwYXJlbnRUTm9kZSEudHlwZSAmIFROb2RlVHlwZS5FbGVtZW50Q29udGFpbmVyID8gcm9vdE5vZGUgOiByb290Tm9kZS5maXJzdENoaWxkO1xuICAgIH1cblxuICAgIC8vIFRoaXMgaXMgYSBuZXN0ZWQgdGVtcGxhdGUgaW4gYW4gaTE4biBibG9jay4gSW4gdGhpcyBjYXNlLCB0aGUgZW50aXJlIHZpZXdcbiAgICAvLyBpcyB0cmFuc2xhdGVkLCBhbmQgcGFydCBvZiBhIGRlaHlkcmF0ZWQgdmlldyBpbiBhIGNvbnRhaW5lci4gVGhpcyBtZWFucyB0aGF0XG4gICAgLy8gd2UgY2FuIHNpbXBseSBiZWdpbiBoeWRyYXRpb24gd2l0aCB0aGUgZmlyc3QgZGVoeWRyYXRlZCBjaGlsZC5cbiAgICByZXR1cm4gaHlkcmF0aW9uSW5mbz8uZmlyc3RDaGlsZCBhcyBOb2RlO1xuICB9XG5cbiAgY29uc3QgY3VycmVudE5vZGUgPSBmaW5kSHlkcmF0aW9uUm9vdCgpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChjdXJyZW50Tm9kZSwgJ0V4cGVjdGVkIHJvb3QgaTE4biBub2RlIGR1cmluZyBoeWRyYXRpb24nKTtcblxuICBjb25zdCBkaXNjb25uZWN0ZWROb2RlcyA9IGluaXREaXNjb25uZWN0ZWROb2RlcyhoeWRyYXRpb25JbmZvKSA/PyBuZXcgU2V0KCk7XG4gIGNvbnN0IGkxOG5Ob2RlcyA9IChoeWRyYXRpb25JbmZvLmkxOG5Ob2RlcyA/Pz0gbmV3IE1hcDxudW1iZXIsIFJOb2RlIHwgbnVsbD4oKSk7XG4gIGNvbnN0IGNhc2VRdWV1ZSA9IGh5ZHJhdGlvbkluZm8uZGF0YVtJMThOX0RBVEFdPy5baW5kZXggLSBIRUFERVJfT0ZGU0VUXSA/PyBbXTtcbiAgY29uc3QgZGVoeWRyYXRlZEljdURhdGEgPSAoaHlkcmF0aW9uSW5mby5kZWh5ZHJhdGVkSWN1RGF0YSA/Pz0gbmV3IE1hcDxcbiAgICBudW1iZXIsXG4gICAgRGVoeWRyYXRlZEljdURhdGFcbiAgPigpKTtcblxuICBjb2xsZWN0STE4bk5vZGVzRnJvbURvbShcbiAgICB7aHlkcmF0aW9uSW5mbywgbFZpZXcsIGkxOG5Ob2RlcywgZGlzY29ubmVjdGVkTm9kZXMsIGNhc2VRdWV1ZSwgZGVoeWRyYXRlZEljdURhdGF9LFxuICAgIHtjdXJyZW50Tm9kZSwgaXNDb25uZWN0ZWQ6IHRydWV9LFxuICAgIHRJMThuLmFzdCxcbiAgKTtcblxuICAvLyBOb2RlcyBmcm9tIGluYWN0aXZlIElDVSBjYXNlcyBzaG91bGQgYmUgY29uc2lkZXJlZCBkaXNjb25uZWN0ZWQuIFdlIHRyYWNrIHRoZW0gYWJvdmVcbiAgLy8gYmVjYXVzZSB0aGV5IGFyZW4ndCAoYW5kIHNob3VsZG4ndCBiZSkgc2VyaWFsaXplZC4gU2luY2Ugd2UgbWF5IG11dGF0ZSBvciBjcmVhdGUgYVxuICAvLyBuZXcgc2V0LCB3ZSBuZWVkIHRvIGJlIHN1cmUgdG8gd3JpdGUgdGhlIGV4cGVjdGVkIHZhbHVlIGJhY2sgdG8gdGhlIERlaHlkcmF0ZWRWaWV3LlxuICBoeWRyYXRpb25JbmZvLmRpc2Nvbm5lY3RlZE5vZGVzID0gZGlzY29ubmVjdGVkTm9kZXMuc2l6ZSA9PT0gMCA/IG51bGwgOiBkaXNjb25uZWN0ZWROb2Rlcztcbn1cblxuZnVuY3Rpb24gY29sbGVjdEkxOG5Ob2Rlc0Zyb21Eb20oXG4gIGNvbnRleHQ6IEkxOG5IeWRyYXRpb25Db250ZXh0LFxuICBzdGF0ZTogSTE4bkh5ZHJhdGlvblN0YXRlLFxuICBub2RlT3JOb2RlczogSTE4bk5vZGUgfCBJMThuTm9kZVtdLFxuKSB7XG4gIGlmIChBcnJheS5pc0FycmF5KG5vZGVPck5vZGVzKSkge1xuICAgIGxldCBuZXh0U3RhdGUgPSBzdGF0ZTtcbiAgICBmb3IgKGNvbnN0IG5vZGUgb2Ygbm9kZU9yTm9kZXMpIHtcbiAgICAgIC8vIFdoZW5ldmVyIGEgbm9kZSBkb2Vzbid0IGRpcmVjdGx5IGZvbGxvdyB0aGUgcHJldmlvdXMgUk5vZGUsIGl0XG4gICAgICAvLyBpcyBnaXZlbiBhIHBhdGguIFdlIG5lZWQgdG8gcmVzdW1lIGNvbGxlY3Rpbmcgbm9kZXMgZnJvbSB0aGF0IGxvY2F0aW9uXG4gICAgICAvLyB1bnRpbCBhbmQgdW5sZXNzIHdlIGZpbmQgYW5vdGhlciBkaXNqb2ludCBub2RlLlxuICAgICAgY29uc3QgdGFyZ2V0Tm9kZSA9IHRyeUxvY2F0ZVJOb2RlQnlQYXRoKFxuICAgICAgICBjb250ZXh0Lmh5ZHJhdGlvbkluZm8sXG4gICAgICAgIGNvbnRleHQubFZpZXcsXG4gICAgICAgIG5vZGUuaW5kZXggLSBIRUFERVJfT0ZGU0VULFxuICAgICAgKTtcbiAgICAgIGlmICh0YXJnZXROb2RlKSB7XG4gICAgICAgIG5leHRTdGF0ZSA9IGZvcmtIeWRyYXRpb25TdGF0ZShzdGF0ZSwgdGFyZ2V0Tm9kZSBhcyBOb2RlKTtcbiAgICAgIH1cbiAgICAgIGNvbGxlY3RJMThuTm9kZXNGcm9tRG9tKGNvbnRleHQsIG5leHRTdGF0ZSwgbm9kZSk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGlmIChjb250ZXh0LmRpc2Nvbm5lY3RlZE5vZGVzLmhhcyhub2RlT3JOb2Rlcy5pbmRleCAtIEhFQURFUl9PRkZTRVQpKSB7XG4gICAgICAvLyBpMThuIG5vZGVzIGNhbiBiZSBjb25zaWRlcmVkIGRpc2Nvbm5lY3RlZCBpZiBlLmcuIHRoZXkgd2VyZSBwcm9qZWN0ZWQuXG4gICAgICAvLyBJbiB0aGF0IGNhc2UsIHdlIGhhdmUgdG8gbWFrZSBzdXJlIHRvIHNraXAgb3ZlciB0aGVtLlxuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHN3aXRjaCAobm9kZU9yTm9kZXMua2luZCkge1xuICAgICAgY2FzZSBJMThuTm9kZUtpbmQuVEVYVDoge1xuICAgICAgICAvLyBDbGFpbSBhIHRleHQgbm9kZSBmb3IgaHlkcmF0aW9uXG4gICAgICAgIGNvbnN0IGN1cnJlbnROb2RlID0gYXBwZW5kSTE4bk5vZGVUb0NvbGxlY3Rpb24oY29udGV4dCwgc3RhdGUsIG5vZGVPck5vZGVzKTtcbiAgICAgICAgc2V0Q3VycmVudE5vZGUoc3RhdGUsIGN1cnJlbnROb2RlPy5uZXh0U2libGluZyA/PyBudWxsKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG5cbiAgICAgIGNhc2UgSTE4bk5vZGVLaW5kLkVMRU1FTlQ6IHtcbiAgICAgICAgLy8gUmVjdXJzZSBpbnRvIHRoZSBjdXJyZW50IGVsZW1lbnQncyBjaGlsZHJlbi4uLlxuICAgICAgICBjb2xsZWN0STE4bk5vZGVzRnJvbURvbShcbiAgICAgICAgICBjb250ZXh0LFxuICAgICAgICAgIGZvcmtIeWRyYXRpb25TdGF0ZShzdGF0ZSwgc3RhdGUuY3VycmVudE5vZGU/LmZpcnN0Q2hpbGQgPz8gbnVsbCksXG4gICAgICAgICAgbm9kZU9yTm9kZXMuY2hpbGRyZW4sXG4gICAgICAgICk7XG5cbiAgICAgICAgLy8gQW5kIGNsYWltIHRoZSBwYXJlbnQgZWxlbWVudCBpdHNlbGYuXG4gICAgICAgIGNvbnN0IGN1cnJlbnROb2RlID0gYXBwZW5kSTE4bk5vZGVUb0NvbGxlY3Rpb24oY29udGV4dCwgc3RhdGUsIG5vZGVPck5vZGVzKTtcbiAgICAgICAgc2V0Q3VycmVudE5vZGUoc3RhdGUsIGN1cnJlbnROb2RlPy5uZXh0U2libGluZyA/PyBudWxsKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG5cbiAgICAgIGNhc2UgSTE4bk5vZGVLaW5kLlBMQUNFSE9MREVSOiB7XG4gICAgICAgIGNvbnN0IG5vT2Zmc2V0SW5kZXggPSBub2RlT3JOb2Rlcy5pbmRleCAtIEhFQURFUl9PRkZTRVQ7XG4gICAgICAgIGNvbnN0IHtoeWRyYXRpb25JbmZvfSA9IGNvbnRleHQ7XG4gICAgICAgIGNvbnN0IGNvbnRhaW5lclNpemUgPSBnZXROZ0NvbnRhaW5lclNpemUoaHlkcmF0aW9uSW5mbywgbm9PZmZzZXRJbmRleCk7XG5cbiAgICAgICAgc3dpdGNoIChub2RlT3JOb2Rlcy50eXBlKSB7XG4gICAgICAgICAgY2FzZSBJMThuUGxhY2Vob2xkZXJUeXBlLkVMRU1FTlQ6IHtcbiAgICAgICAgICAgIC8vIEh5ZHJhdGlvbiBleHBlY3RzIHRvIGZpbmQgdGhlIGhlYWQgb2YgdGhlIGVsZW1lbnQuXG4gICAgICAgICAgICBjb25zdCBjdXJyZW50Tm9kZSA9IGFwcGVuZEkxOG5Ob2RlVG9Db2xsZWN0aW9uKGNvbnRleHQsIHN0YXRlLCBub2RlT3JOb2Rlcyk7XG5cbiAgICAgICAgICAgIC8vIEEgVE5vZGUgZm9yIHRoZSBub2RlIG1heSBub3QgeWV0IGlmIHdlJ3JlIGh5ZHJhdGluZyBkdXJpbmcgdGhlIGZpcnN0IHBhc3MsXG4gICAgICAgICAgICAvLyBzbyB1c2UgdGhlIHNlcmlhbGl6ZWQgZGF0YSB0byBkZXRlcm1pbmUgaWYgdGhpcyBpcyBhbiA8bmctY29udGFpbmVyPi5cbiAgICAgICAgICAgIGlmIChpc1NlcmlhbGl6ZWRFbGVtZW50Q29udGFpbmVyKGh5ZHJhdGlvbkluZm8sIG5vT2Zmc2V0SW5kZXgpKSB7XG4gICAgICAgICAgICAgIC8vIEFuIDxuZy1jb250YWluZXI+IGRvZXNuJ3QgaGF2ZSBhIHBoeXNpY2FsIERPTSBub2RlLCBzbyB3ZSBuZWVkIHRvXG4gICAgICAgICAgICAgIC8vIGNvbnRpbnVlIGh5ZHJhdGluZyBmcm9tIHNpYmxpbmdzLlxuICAgICAgICAgICAgICBjb2xsZWN0STE4bk5vZGVzRnJvbURvbShjb250ZXh0LCBzdGF0ZSwgbm9kZU9yTm9kZXMuY2hpbGRyZW4pO1xuXG4gICAgICAgICAgICAgIC8vIFNraXAgb3ZlciB0aGUgYW5jaG9yIGVsZW1lbnQuIEl0IHdpbGwgYmUgY2xhaW1lZCBieSB0aGVcbiAgICAgICAgICAgICAgLy8gZG93bnN0cmVhbSBjb250YWluZXIgaHlkcmF0aW9uLlxuICAgICAgICAgICAgICBjb25zdCBuZXh0Tm9kZSA9IHNraXBTaWJsaW5nTm9kZXMoc3RhdGUsIDEpO1xuICAgICAgICAgICAgICBzZXRDdXJyZW50Tm9kZShzdGF0ZSwgbmV4dE5vZGUpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgLy8gTm9uLWNvbnRhaW5lciBlbGVtZW50cyByZXByZXNlbnQgYW4gYWN0dWFsIG5vZGUgaW4gdGhlIERPTSwgc28gd2VcbiAgICAgICAgICAgICAgLy8gbmVlZCB0byBjb250aW51ZSBoeWRyYXRpb24gd2l0aCB0aGUgY2hpbGRyZW4sIGFuZCBjbGFpbSB0aGUgbm9kZS5cbiAgICAgICAgICAgICAgY29sbGVjdEkxOG5Ob2Rlc0Zyb21Eb20oXG4gICAgICAgICAgICAgICAgY29udGV4dCxcbiAgICAgICAgICAgICAgICBmb3JrSHlkcmF0aW9uU3RhdGUoc3RhdGUsIHN0YXRlLmN1cnJlbnROb2RlPy5maXJzdENoaWxkID8/IG51bGwpLFxuICAgICAgICAgICAgICAgIG5vZGVPck5vZGVzLmNoaWxkcmVuLFxuICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICBzZXRDdXJyZW50Tm9kZShzdGF0ZSwgY3VycmVudE5vZGU/Lm5leHRTaWJsaW5nID8/IG51bGwpO1xuXG4gICAgICAgICAgICAgIC8vIEVsZW1lbnRzIGNhbiBhbHNvIGJlIHRoZSBhbmNob3Igb2YgYSB2aWV3IGNvbnRhaW5lciwgc28gdGhlcmUgbWF5XG4gICAgICAgICAgICAgIC8vIGJlIGVsZW1lbnRzIGFmdGVyIHRoaXMgbm9kZSB0aGF0IHdlIG5lZWQgdG8gc2tpcC5cbiAgICAgICAgICAgICAgaWYgKGNvbnRhaW5lclNpemUgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAvLyBgKzFgIHN0YW5kcyBmb3IgYW4gYW5jaG9yIG5vZGUgYWZ0ZXIgYWxsIG9mIHRoZSB2aWV3cyBpbiB0aGUgY29udGFpbmVyLlxuICAgICAgICAgICAgICAgIGNvbnN0IG5leHROb2RlID0gc2tpcFNpYmxpbmdOb2RlcyhzdGF0ZSwgY29udGFpbmVyU2l6ZSArIDEpO1xuICAgICAgICAgICAgICAgIHNldEN1cnJlbnROb2RlKHN0YXRlLCBuZXh0Tm9kZSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGNhc2UgSTE4blBsYWNlaG9sZGVyVHlwZS5TVUJURU1QTEFURToge1xuICAgICAgICAgICAgbmdEZXZNb2RlICYmXG4gICAgICAgICAgICAgIGFzc2VydE5vdEVxdWFsKFxuICAgICAgICAgICAgICAgIGNvbnRhaW5lclNpemUsXG4gICAgICAgICAgICAgICAgbnVsbCxcbiAgICAgICAgICAgICAgICAnRXhwZWN0ZWQgYSBjb250YWluZXIgc2l6ZSB3aGlsZSBoeWRyYXRpbmcgaTE4biBzdWJ0ZW1wbGF0ZScsXG4gICAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgIC8vIEh5ZHJhdGlvbiBleHBlY3RzIHRvIGZpbmQgdGhlIGhlYWQgb2YgdGhlIHRlbXBsYXRlLlxuICAgICAgICAgICAgYXBwZW5kSTE4bk5vZGVUb0NvbGxlY3Rpb24oY29udGV4dCwgc3RhdGUsIG5vZGVPck5vZGVzKTtcblxuICAgICAgICAgICAgLy8gU2tpcCBvdmVyIGFsbCBvZiB0aGUgdGVtcGxhdGUgY2hpbGRyZW4sIGFzIHdlbGwgYXMgdGhlIGFuY2hvclxuICAgICAgICAgICAgLy8gbm9kZSwgc2luY2UgdGhlIHRlbXBsYXRlIGl0c2VsZiB3aWxsIGhhbmRsZSB0aGVtIGluc3RlYWQuXG4gICAgICAgICAgICBjb25zdCBuZXh0Tm9kZSA9IHNraXBTaWJsaW5nTm9kZXMoc3RhdGUsIGNvbnRhaW5lclNpemUhICsgMSk7XG4gICAgICAgICAgICBzZXRDdXJyZW50Tm9kZShzdGF0ZSwgbmV4dE5vZGUpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuXG4gICAgICBjYXNlIEkxOG5Ob2RlS2luZC5JQ1U6IHtcbiAgICAgICAgLy8gSWYgdGhlIGN1cnJlbnQgbm9kZSBpcyBjb25uZWN0ZWQsIHdlIG5lZWQgdG8gcG9wIHRoZSBuZXh0IGNhc2UgZnJvbSB0aGVcbiAgICAgICAgLy8gcXVldWUsIHNvIHRoYXQgdGhlIGFjdGl2ZSBjYXNlIGlzIGFsc28gY29uc2lkZXJlZCBjb25uZWN0ZWQuXG4gICAgICAgIGNvbnN0IHNlbGVjdGVkQ2FzZSA9IHN0YXRlLmlzQ29ubmVjdGVkID8gY29udGV4dC5jYXNlUXVldWUuc2hpZnQoKSEgOiBudWxsO1xuICAgICAgICBjb25zdCBjaGlsZFN0YXRlID0ge2N1cnJlbnROb2RlOiBudWxsLCBpc0Nvbm5lY3RlZDogZmFsc2V9O1xuXG4gICAgICAgIC8vIFdlIHRyYXZlcnNlIHRocm91Z2ggZWFjaCBjYXNlLCBldmVuIGlmIGl0J3Mgbm90IGFjdGl2ZSxcbiAgICAgICAgLy8gc28gdGhhdCB3ZSBjb3JyZWN0bHkgcG9wdWxhdGUgZGlzY29ubmVjdGVkIG5vZGVzLlxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG5vZGVPck5vZGVzLmNhc2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgY29sbGVjdEkxOG5Ob2Rlc0Zyb21Eb20oXG4gICAgICAgICAgICBjb250ZXh0LFxuICAgICAgICAgICAgaSA9PT0gc2VsZWN0ZWRDYXNlID8gc3RhdGUgOiBjaGlsZFN0YXRlLFxuICAgICAgICAgICAgbm9kZU9yTm9kZXMuY2FzZXNbaV0sXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChzZWxlY3RlZENhc2UgIT09IG51bGwpIHtcbiAgICAgICAgICAvLyBJQ1VzIHJlcHJlc2VudCBhIGJyYW5jaGluZyBzdGF0ZSwgYW5kIHRoZSBzZWxlY3RlZCBjYXNlIGNvdWxkIGJlIGRpZmZlcmVudFxuICAgICAgICAgIC8vIHRoYW4gd2hhdCBpdCB3YXMgb24gdGhlIHNlcnZlci4gSW4gdGhhdCBjYXNlLCB3ZSBuZWVkIHRvIGJlIGFibGUgdG8gY2xlYW5cbiAgICAgICAgICAvLyB1cCB0aGUgbm9kZXMgZnJvbSB0aGUgb3JpZ2luYWwgY2FzZS4gVG8gZG8gdGhhdCwgd2Ugc3RvcmUgdGhlIHNlbGVjdGVkIGNhc2UuXG4gICAgICAgICAgY29udGV4dC5kZWh5ZHJhdGVkSWN1RGF0YS5zZXQobm9kZU9yTm9kZXMuaW5kZXgsIHtjYXNlOiBzZWxlY3RlZENhc2UsIG5vZGU6IG5vZGVPck5vZGVzfSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBIeWRyYXRpb24gZXhwZWN0cyB0byBmaW5kIHRoZSBJQ1UgYW5jaG9yIGVsZW1lbnQuXG4gICAgICAgIGNvbnN0IGN1cnJlbnROb2RlID0gYXBwZW5kSTE4bk5vZGVUb0NvbGxlY3Rpb24oY29udGV4dCwgc3RhdGUsIG5vZGVPck5vZGVzKTtcbiAgICAgICAgc2V0Q3VycmVudE5vZGUoc3RhdGUsIGN1cnJlbnROb2RlPy5uZXh0U2libGluZyA/PyBudWxsKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbmxldCBfY2xhaW1EZWh5ZHJhdGVkSWN1Q2FzZUltcGw6IHR5cGVvZiBjbGFpbURlaHlkcmF0ZWRJY3VDYXNlSW1wbCA9ICgpID0+IHtcbiAgLy8gbm9vcCB1bmxlc3MgYGVuYWJsZUNsYWltRGVoeWRyYXRlZEljdUNhc2VJbXBsYCBpcyBpbnZva2VkXG59O1xuXG4vKipcbiAqIE1hcmsgdGhlIGNhc2UgZm9yIHRoZSBJQ1Ugbm9kZSBhdCB0aGUgZ2l2ZW4gaW5kZXggaW4gdGhlIHZpZXcgYXMgY2xhaW1lZCxcbiAqIGFsbG93aW5nIGl0cyBub2RlcyB0byBiZSBoeWRyYXRlZCBhbmQgbm90IGNsZWFuZWQgdXAuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjbGFpbURlaHlkcmF0ZWRJY3VDYXNlKGxWaWV3OiBMVmlldywgaWN1SW5kZXg6IG51bWJlciwgY2FzZUluZGV4OiBudW1iZXIpIHtcbiAgX2NsYWltRGVoeWRyYXRlZEljdUNhc2VJbXBsKGxWaWV3LCBpY3VJbmRleCwgY2FzZUluZGV4KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGVuYWJsZUNsYWltRGVoeWRyYXRlZEljdUNhc2VJbXBsKCkge1xuICBfY2xhaW1EZWh5ZHJhdGVkSWN1Q2FzZUltcGwgPSBjbGFpbURlaHlkcmF0ZWRJY3VDYXNlSW1wbDtcbn1cblxuZnVuY3Rpb24gY2xhaW1EZWh5ZHJhdGVkSWN1Q2FzZUltcGwobFZpZXc6IExWaWV3LCBpY3VJbmRleDogbnVtYmVyLCBjYXNlSW5kZXg6IG51bWJlcikge1xuICBjb25zdCBkZWh5ZHJhdGVkSWN1RGF0YU1hcCA9IGxWaWV3W0hZRFJBVElPTl0/LmRlaHlkcmF0ZWRJY3VEYXRhO1xuICBpZiAoZGVoeWRyYXRlZEljdURhdGFNYXApIHtcbiAgICBjb25zdCBkZWh5ZHJhdGVkSWN1RGF0YSA9IGRlaHlkcmF0ZWRJY3VEYXRhTWFwLmdldChpY3VJbmRleCk7XG4gICAgaWYgKGRlaHlkcmF0ZWRJY3VEYXRhPy5jYXNlID09PSBjYXNlSW5kZXgpIHtcbiAgICAgIC8vIElmIHRoZSBjYXNlIHdlJ3JlIGF0dGVtcHRpbmcgdG8gY2xhaW0gbWF0Y2hlcyB0aGUgZGVoeWRyYXRlZCBvbmUsXG4gICAgICAvLyB3ZSByZW1vdmUgaXQgZnJvbSB0aGUgbWFwIHRvIG1hcmsgaXQgYXMgXCJjbGFpbWVkLlwiXG4gICAgICBkZWh5ZHJhdGVkSWN1RGF0YU1hcC5kZWxldGUoaWN1SW5kZXgpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIENsZWFuIHVwIGFsbCBpMThuIGh5ZHJhdGlvbiBkYXRhIGFzc29jaWF0ZWQgd2l0aCB0aGUgZ2l2ZW4gdmlldy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNsZWFudXBJMThuSHlkcmF0aW9uRGF0YShsVmlldzogTFZpZXcpIHtcbiAgY29uc3QgaHlkcmF0aW9uSW5mbyA9IGxWaWV3W0hZRFJBVElPTl07XG4gIGlmIChoeWRyYXRpb25JbmZvKSB7XG4gICAgY29uc3Qge2kxOG5Ob2RlcywgZGVoeWRyYXRlZEljdURhdGE6IGRlaHlkcmF0ZWRJY3VEYXRhTWFwfSA9IGh5ZHJhdGlvbkluZm87XG4gICAgaWYgKGkxOG5Ob2RlcyAmJiBkZWh5ZHJhdGVkSWN1RGF0YU1hcCkge1xuICAgICAgY29uc3QgcmVuZGVyZXIgPSBsVmlld1tSRU5ERVJFUl07XG4gICAgICBmb3IgKGNvbnN0IGRlaHlkcmF0ZWRJY3VEYXRhIG9mIGRlaHlkcmF0ZWRJY3VEYXRhTWFwLnZhbHVlcygpKSB7XG4gICAgICAgIGNsZWFudXBEZWh5ZHJhdGVkSWN1RGF0YShyZW5kZXJlciwgaTE4bk5vZGVzLCBkZWh5ZHJhdGVkSWN1RGF0YSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaHlkcmF0aW9uSW5mby5pMThuTm9kZXMgPSB1bmRlZmluZWQ7XG4gICAgaHlkcmF0aW9uSW5mby5kZWh5ZHJhdGVkSWN1RGF0YSA9IHVuZGVmaW5lZDtcbiAgfVxufVxuXG5mdW5jdGlvbiBjbGVhbnVwRGVoeWRyYXRlZEljdURhdGEoXG4gIHJlbmRlcmVyOiBSZW5kZXJlcixcbiAgaTE4bk5vZGVzOiBNYXA8bnVtYmVyLCBSTm9kZSB8IG51bGw+LFxuICBkZWh5ZHJhdGVkSWN1RGF0YTogRGVoeWRyYXRlZEljdURhdGEsXG4pIHtcbiAgZm9yIChjb25zdCBub2RlIG9mIGRlaHlkcmF0ZWRJY3VEYXRhLm5vZGUuY2FzZXNbZGVoeWRyYXRlZEljdURhdGEuY2FzZV0pIHtcbiAgICBjb25zdCByTm9kZSA9IGkxOG5Ob2Rlcy5nZXQobm9kZS5pbmRleCAtIEhFQURFUl9PRkZTRVQpO1xuICAgIGlmIChyTm9kZSkge1xuICAgICAgbmF0aXZlUmVtb3ZlTm9kZShyZW5kZXJlciwgck5vZGUsIGZhbHNlKTtcbiAgICB9XG4gIH1cbn1cbiJdfQ==