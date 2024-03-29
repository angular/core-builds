/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { inject, Injector } from '../di';
import { isRootTemplateMessage } from '../render3/i18n/i18n_util';
import { HEADER_OFFSET, HYDRATION, RENDERER, TVIEW } from '../render3/interfaces/view';
import { nativeRemoveNode } from '../render3/node_manipulation';
import { unwrapRNode } from '../render3/util/view_utils';
import { assertDefined, assertNotEqual } from '../util/assert';
import { I18N_DATA } from './interfaces';
import { locateNextRNode, tryLocateRNodeByPath } from './node_lookup_utils';
import { IS_I18N_HYDRATION_ENABLED } from './tokens';
import { getNgContainerSize, initDisconnectedNodes, isSerializedElementContainer, processTextNodeBeforeSerialization } from './utils';
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
    const caseQueue = [];
    tI18n.ast.forEach(node => serializeI18nBlock(lView, caseQueue, context, node));
    return caseQueue.length > 0 ? caseQueue : null;
}
function serializeI18nBlock(lView, caseQueue, context, node) {
    switch (node.kind) {
        case 0 /* I18nNodeKind.TEXT */:
            const rNode = unwrapRNode(lView[node.index]);
            processTextNodeBeforeSerialization(context, rNode);
            break;
        case 1 /* I18nNodeKind.ELEMENT */:
        case 2 /* I18nNodeKind.PLACEHOLDER */:
            node.children.forEach(node => serializeI18nBlock(lView, caseQueue, context, node));
            break;
        case 3 /* I18nNodeKind.ICU */:
            const currentCase = lView[node.currentCaseLViewIndex];
            if (currentCase != null) {
                // i18n uses a negative value to signal a change to a new case, so we
                // need to invert it to get the proper value.
                const caseIdx = currentCase < 0 ? ~currentCase : currentCase;
                caseQueue.push(caseIdx);
                node.cases[caseIdx].forEach(node => serializeI18nBlock(lView, caseQueue, context, node));
            }
            break;
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
    if (!isI18nHydrationSupportEnabled()) {
        return;
    }
    const hydrationInfo = lView[HYDRATION];
    if (!hydrationInfo) {
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
            return (parentTNode.type & 8 /* TNodeType.ElementContainer */) ? rootNode : rootNode.firstChild;
        }
        // This is a nested template in an i18n block. In this case, the entire view
        // is translated, and part of a dehydrated view in a container. This means that
        // we can simply begin hydration with the first dehydrated child.
        return hydrationInfo?.firstChild;
    }
    const currentNode = findHydrationRoot();
    ngDevMode && assertDefined(currentNode, 'Expected root i18n node during hydration');
    const disconnectedNodes = initDisconnectedNodes(hydrationInfo) ?? new Set();
    const i18nNodes = hydrationInfo.i18nNodes ??= new Map();
    const caseQueue = hydrationInfo.data[I18N_DATA]?.[index - HEADER_OFFSET] ?? [];
    const dehydratedIcuData = hydrationInfo.dehydratedIcuData ??=
        new Map();
    collectI18nNodesFromDom({ hydrationInfo, lView, i18nNodes, disconnectedNodes, caseQueue, dehydratedIcuData }, { currentNode, isConnected: true }, tI18n.ast);
    // Nodes from inactive ICU cases should be considered disconnected. We track them above
    // because they aren't (and shouldn't be) serialized. Since we may mutate or create a
    // new set, we need to be sure to write the expected value back to the DehydratedView.
    hydrationInfo.disconnectedNodes = disconnectedNodes.size === 0 ? null : disconnectedNodes;
}
function collectI18nNodesFromDom(context, state, nodeOrNodes) {
    if (Array.isArray(nodeOrNodes)) {
        for (const node of nodeOrNodes) {
            // If the node is being projected elsewhere, we need to temporarily
            // branch the state to that location to continue hydration.
            // Otherwise, we continue hydration from the current location.
            const targetNode = tryLocateRNodeByPath(context.hydrationInfo, context.lView, node.index - HEADER_OFFSET);
            const nextState = targetNode ? forkHydrationState(state, targetNode) : state;
            collectI18nNodesFromDom(context, nextState, node);
        }
    }
    else {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaTE4bi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL2h5ZHJhdGlvbi9pMThuLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxNQUFNLEVBQUUsUUFBUSxFQUFDLE1BQU0sT0FBTyxDQUFDO0FBQ3ZDLE9BQU8sRUFBQyxxQkFBcUIsRUFBQyxNQUFNLDJCQUEyQixDQUFDO0FBS2hFLE9BQU8sRUFBQyxhQUFhLEVBQUUsU0FBUyxFQUFTLFFBQVEsRUFBUyxLQUFLLEVBQUMsTUFBTSw0QkFBNEIsQ0FBQztBQUNuRyxPQUFPLEVBQUMsZ0JBQWdCLEVBQUMsTUFBTSw4QkFBOEIsQ0FBQztBQUM5RCxPQUFPLEVBQUMsV0FBVyxFQUFDLE1BQU0sNEJBQTRCLENBQUM7QUFDdkQsT0FBTyxFQUFDLGFBQWEsRUFBRSxjQUFjLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUc3RCxPQUFPLEVBQW9DLFNBQVMsRUFBQyxNQUFNLGNBQWMsQ0FBQztBQUMxRSxPQUFPLEVBQUMsZUFBZSxFQUFFLG9CQUFvQixFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDMUUsT0FBTyxFQUFDLHlCQUF5QixFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQ25ELE9BQU8sRUFBQyxrQkFBa0IsRUFBRSxxQkFBcUIsRUFBRSw0QkFBNEIsRUFBRSxrQ0FBa0MsRUFBQyxNQUFNLFNBQVMsQ0FBQztBQUVwSSxJQUFJLDhCQUE4QixHQUFHLEtBQUssQ0FBQztBQUUzQyxJQUFJLGlDQUFpQyxHQUE0QyxHQUFHLEVBQUU7SUFDcEYsbUVBQW1FO0FBQ3JFLENBQUMsQ0FBQztBQUVGLE1BQU0sVUFBVSxnQ0FBZ0MsQ0FBQyxPQUFnQjtJQUMvRCw4QkFBOEIsR0FBRyxPQUFPLENBQUM7QUFDM0MsQ0FBQztBQUVELE1BQU0sVUFBVSw2QkFBNkI7SUFDM0MsT0FBTyw4QkFBOEIsQ0FBQztBQUN4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QUFvQixDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUM7Z0JBQzlELHdCQUF3QixDQUFDLFFBQVEsRUFBRSxTQUFTLEVBQUUsaUJBQWlCLENBQUMsQ0FBQztZQUNuRSxDQUFDO1FBQ0gsQ0FBQztRQUVELGFBQWEsQ0FBQyxTQUFTLEdBQUcsU0FBUyxDQUFDO1FBQ3BDLGFBQWEsQ0FBQyxpQkFBaUIsR0FBRyxTQUFTLENBQUM7SUFDOUMsQ0FBQztBQUNILENBQUM7QUFFRCxTQUFTLHdCQUF3QixDQUM3QixRQUFrQixFQUFFLFNBQWtDLEVBQUUsaUJBQW9DO0lBQzlGLEtBQUssTUFBTSxJQUFJLElBQUksaUJBQWlCLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO1FBQ3hFLE1BQU0sS0FBSyxHQUFHLFNBQVMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEtBQUssR0FBRyxhQUFhLENBQUMsQ0FBQztRQUN4RCxJQUFJLEtBQUssRUFBRSxDQUFDO1lBQ1YsZ0JBQWdCLENBQUMsUUFBUSxFQUFFLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztRQUMzQyxDQUFDO0lBQ0gsQ0FBQztBQUNILENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtpbmplY3QsIEluamVjdG9yfSBmcm9tICcuLi9kaSc7XG5pbXBvcnQge2lzUm9vdFRlbXBsYXRlTWVzc2FnZX0gZnJvbSAnLi4vcmVuZGVyMy9pMThuL2kxOG5fdXRpbCc7XG5pbXBvcnQge0kxOG5Ob2RlLCBJMThuTm9kZUtpbmQsIEkxOG5QbGFjZWhvbGRlclR5cGUsIFRJMThufSBmcm9tICcuLi9yZW5kZXIzL2ludGVyZmFjZXMvaTE4bic7XG5pbXBvcnQge1ROb2RlLCBUTm9kZVR5cGV9IGZyb20gJy4uL3JlbmRlcjMvaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB0eXBlIHtSZW5kZXJlcn0gZnJvbSAnLi4vcmVuZGVyMy9pbnRlcmZhY2VzL3JlbmRlcmVyJztcbmltcG9ydCB0eXBlIHtSTm9kZX0gZnJvbSAnLi4vcmVuZGVyMy9pbnRlcmZhY2VzL3JlbmRlcmVyX2RvbSc7XG5pbXBvcnQge0hFQURFUl9PRkZTRVQsIEhZRFJBVElPTiwgTFZpZXcsIFJFTkRFUkVSLCBUVmlldywgVFZJRVd9IGZyb20gJy4uL3JlbmRlcjMvaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7bmF0aXZlUmVtb3ZlTm9kZX0gZnJvbSAnLi4vcmVuZGVyMy9ub2RlX21hbmlwdWxhdGlvbic7XG5pbXBvcnQge3Vud3JhcFJOb2RlfSBmcm9tICcuLi9yZW5kZXIzL3V0aWwvdmlld191dGlscyc7XG5pbXBvcnQge2Fzc2VydERlZmluZWQsIGFzc2VydE5vdEVxdWFsfSBmcm9tICcuLi91dGlsL2Fzc2VydCc7XG5cbmltcG9ydCB0eXBlIHtIeWRyYXRpb25Db250ZXh0fSBmcm9tICcuL2Fubm90YXRlJztcbmltcG9ydCB7RGVoeWRyYXRlZEljdURhdGEsIERlaHlkcmF0ZWRWaWV3LCBJMThOX0RBVEF9IGZyb20gJy4vaW50ZXJmYWNlcyc7XG5pbXBvcnQge2xvY2F0ZU5leHRSTm9kZSwgdHJ5TG9jYXRlUk5vZGVCeVBhdGh9IGZyb20gJy4vbm9kZV9sb29rdXBfdXRpbHMnO1xuaW1wb3J0IHtJU19JMThOX0hZRFJBVElPTl9FTkFCTEVEfSBmcm9tICcuL3Rva2Vucyc7XG5pbXBvcnQge2dldE5nQ29udGFpbmVyU2l6ZSwgaW5pdERpc2Nvbm5lY3RlZE5vZGVzLCBpc1NlcmlhbGl6ZWRFbGVtZW50Q29udGFpbmVyLCBwcm9jZXNzVGV4dE5vZGVCZWZvcmVTZXJpYWxpemF0aW9ufSBmcm9tICcuL3V0aWxzJztcblxubGV0IF9pc0kxOG5IeWRyYXRpb25TdXBwb3J0RW5hYmxlZCA9IGZhbHNlO1xuXG5sZXQgX3ByZXBhcmVJMThuQmxvY2tGb3JIeWRyYXRpb25JbXBsOiB0eXBlb2YgcHJlcGFyZUkxOG5CbG9ja0Zvckh5ZHJhdGlvbkltcGwgPSAoKSA9PiB7XG4gIC8vIG5vb3AgdW5sZXNzIGBlbmFibGVQcmVwYXJlSTE4bkJsb2NrRm9ySHlkcmF0aW9uSW1wbGAgaXMgaW52b2tlZC5cbn07XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRJc0kxOG5IeWRyYXRpb25TdXBwb3J0RW5hYmxlZChlbmFibGVkOiBib29sZWFuKSB7XG4gIF9pc0kxOG5IeWRyYXRpb25TdXBwb3J0RW5hYmxlZCA9IGVuYWJsZWQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0kxOG5IeWRyYXRpb25TdXBwb3J0RW5hYmxlZCgpIHtcbiAgcmV0dXJuIF9pc0kxOG5IeWRyYXRpb25TdXBwb3J0RW5hYmxlZDtcbn1cblxuLyoqXG4gKiBQcmVwYXJlcyBhbiBpMThuIGJsb2NrIGFuZCBpdHMgY2hpbGRyZW4sIGxvY2F0ZWQgYXQgdGhlIGdpdmVuXG4gKiB2aWV3IGFuZCBpbnN0cnVjdGlvbiBpbmRleCwgZm9yIGh5ZHJhdGlvbi5cbiAqXG4gKiBAcGFyYW0gbFZpZXcgbFZpZXcgd2l0aCB0aGUgaTE4biBibG9ja1xuICogQHBhcmFtIGluZGV4IGluZGV4IG9mIHRoZSBpMThuIGJsb2NrIGluIHRoZSBsVmlld1xuICogQHBhcmFtIHBhcmVudFROb2RlIFROb2RlIG9mIHRoZSBwYXJlbnQgb2YgdGhlIGkxOG4gYmxvY2tcbiAqIEBwYXJhbSBzdWJUZW1wbGF0ZUluZGV4IHN1Yi10ZW1wbGF0ZSBpbmRleCwgb3IgLTEgZm9yIHRoZSBtYWluIHRlbXBsYXRlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwcmVwYXJlSTE4bkJsb2NrRm9ySHlkcmF0aW9uKFxuICAgIGxWaWV3OiBMVmlldywgaW5kZXg6IG51bWJlciwgcGFyZW50VE5vZGU6IFROb2RlfG51bGwsIHN1YlRlbXBsYXRlSW5kZXg6IG51bWJlcik6IHZvaWQge1xuICBfcHJlcGFyZUkxOG5CbG9ja0Zvckh5ZHJhdGlvbkltcGwobFZpZXcsIGluZGV4LCBwYXJlbnRUTm9kZSwgc3ViVGVtcGxhdGVJbmRleCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBlbmFibGVQcmVwYXJlSTE4bkJsb2NrRm9ySHlkcmF0aW9uSW1wbCgpIHtcbiAgX3ByZXBhcmVJMThuQmxvY2tGb3JIeWRyYXRpb25JbXBsID0gcHJlcGFyZUkxOG5CbG9ja0Zvckh5ZHJhdGlvbkltcGw7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0kxOG5IeWRyYXRpb25FbmFibGVkKGluamVjdG9yPzogSW5qZWN0b3IpIHtcbiAgaW5qZWN0b3IgPSBpbmplY3RvciA/PyBpbmplY3QoSW5qZWN0b3IpO1xuICByZXR1cm4gaW5qZWN0b3IuZ2V0KElTX0kxOE5fSFlEUkFUSU9OX0VOQUJMRUQsIGZhbHNlKTtcbn1cblxuLyoqXG4gKiBDb2xsZWN0cywgaWYgbm90IGFscmVhZHkgY2FjaGVkLCBhbGwgb2YgdGhlIGluZGljZXMgaW4gdGhlXG4gKiBnaXZlbiBUVmlldyB3aGljaCBhcmUgY2hpbGRyZW4gb2YgYW4gaTE4biBibG9jay5cbiAqXG4gKiBTaW5jZSBpMThuIGJsb2NrcyBkb24ndCBpbnRyb2R1Y2UgYSBwYXJlbnQgVE5vZGUsIHRoaXMgaXMgbmVjZXNzYXJ5XG4gKiBpbiBvcmRlciB0byBkZXRlcm1pbmUgd2hpY2ggaW5kaWNlcyBpbiBhIExWaWV3IGFyZSB0cmFuc2xhdGVkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0T3JDb21wdXRlSTE4bkNoaWxkcmVuKHRWaWV3OiBUVmlldywgY29udGV4dDogSHlkcmF0aW9uQ29udGV4dCk6IFNldDxudW1iZXI+fFxuICAgIG51bGwge1xuICBsZXQgaTE4bkNoaWxkcmVuID0gY29udGV4dC5pMThuQ2hpbGRyZW4uZ2V0KHRWaWV3KTtcbiAgaWYgKGkxOG5DaGlsZHJlbiA9PT0gdW5kZWZpbmVkKSB7XG4gICAgaTE4bkNoaWxkcmVuID0gY29sbGVjdEkxOG5DaGlsZHJlbih0Vmlldyk7XG4gICAgY29udGV4dC5pMThuQ2hpbGRyZW4uc2V0KHRWaWV3LCBpMThuQ2hpbGRyZW4pO1xuICB9XG4gIHJldHVybiBpMThuQ2hpbGRyZW47XG59XG5cbmZ1bmN0aW9uIGNvbGxlY3RJMThuQ2hpbGRyZW4odFZpZXc6IFRWaWV3KTogU2V0PG51bWJlcj58bnVsbCB7XG4gIGNvbnN0IGNoaWxkcmVuID0gbmV3IFNldDxudW1iZXI+KCk7XG5cbiAgZnVuY3Rpb24gY29sbGVjdEkxOG5WaWV3cyhub2RlOiBJMThuTm9kZSkge1xuICAgIGNoaWxkcmVuLmFkZChub2RlLmluZGV4KTtcblxuICAgIHN3aXRjaCAobm9kZS5raW5kKSB7XG4gICAgICBjYXNlIEkxOG5Ob2RlS2luZC5FTEVNRU5UOlxuICAgICAgY2FzZSBJMThuTm9kZUtpbmQuUExBQ0VIT0xERVI6IHtcbiAgICAgICAgZm9yIChjb25zdCBjaGlsZE5vZGUgb2Ygbm9kZS5jaGlsZHJlbikge1xuICAgICAgICAgIGNvbGxlY3RJMThuVmlld3MoY2hpbGROb2RlKTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIH1cblxuICAgICAgY2FzZSBJMThuTm9kZUtpbmQuSUNVOiB7XG4gICAgICAgIGZvciAoY29uc3QgY2FzZU5vZGVzIG9mIG5vZGUuY2FzZXMpIHtcbiAgICAgICAgICBmb3IgKGNvbnN0IGNhc2VOb2RlIG9mIGNhc2VOb2Rlcykge1xuICAgICAgICAgICAgY29sbGVjdEkxOG5WaWV3cyhjYXNlTm9kZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8vIFRyYXZlcnNlIHRocm91Z2ggdGhlIEFTVCBvZiBlYWNoIGkxOG4gYmxvY2sgaW4gdGhlIExWaWV3LFxuICAvLyBhbmQgY29sbGVjdCBldmVyeSBpbnN0cnVjdGlvbiBpbmRleC5cbiAgZm9yIChsZXQgaSA9IEhFQURFUl9PRkZTRVQ7IGkgPCB0Vmlldy5iaW5kaW5nU3RhcnRJbmRleDsgaSsrKSB7XG4gICAgY29uc3QgdEkxOG4gPSB0Vmlldy5kYXRhW2ldIGFzIFRJMThuIHwgdW5kZWZpbmVkO1xuICAgIGlmICghdEkxOG4gfHwgIXRJMThuLmFzdCkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgZm9yIChjb25zdCBub2RlIG9mIHRJMThuLmFzdCkge1xuICAgICAgY29sbGVjdEkxOG5WaWV3cyhub2RlKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gY2hpbGRyZW4uc2l6ZSA9PT0gMCA/IG51bGwgOiBjaGlsZHJlbjtcbn1cblxuLyoqXG4gKiBBdHRlbXB0cyB0byBzZXJpYWxpemUgaTE4biBkYXRhIGZvciBhbiBpMThuIGJsb2NrLCBsb2NhdGVkIGF0XG4gKiB0aGUgZ2l2ZW4gdmlldyBhbmQgaW5zdHJ1Y3Rpb24gaW5kZXguXG4gKlxuICogQHBhcmFtIGxWaWV3IGxWaWV3IHdpdGggdGhlIGkxOG4gYmxvY2tcbiAqIEBwYXJhbSBpbmRleCBpbmRleCBvZiB0aGUgaTE4biBibG9jayBpbiB0aGUgbFZpZXdcbiAqIEBwYXJhbSBjb250ZXh0IHRoZSBoeWRyYXRpb24gY29udGV4dFxuICogQHJldHVybnMgdGhlIGkxOG4gZGF0YSwgb3IgbnVsbCBpZiB0aGVyZSBpcyBubyByZWxldmFudCBkYXRhXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0cnlTZXJpYWxpemVJMThuQmxvY2soXG4gICAgbFZpZXc6IExWaWV3LCBpbmRleDogbnVtYmVyLCBjb250ZXh0OiBIeWRyYXRpb25Db250ZXh0KTogQXJyYXk8bnVtYmVyPnxudWxsIHtcbiAgaWYgKCFjb250ZXh0LmlzSTE4bkh5ZHJhdGlvbkVuYWJsZWQpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIGNvbnN0IHRWaWV3ID0gbFZpZXdbVFZJRVddO1xuICBjb25zdCB0STE4biA9IHRWaWV3LmRhdGFbaW5kZXhdIGFzIFRJMThuIHwgdW5kZWZpbmVkO1xuICBpZiAoIXRJMThuIHx8ICF0STE4bi5hc3QpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIGNvbnN0IGNhc2VRdWV1ZTogbnVtYmVyW10gPSBbXTtcbiAgdEkxOG4uYXN0LmZvckVhY2gobm9kZSA9PiBzZXJpYWxpemVJMThuQmxvY2sobFZpZXcsIGNhc2VRdWV1ZSwgY29udGV4dCwgbm9kZSkpO1xuICByZXR1cm4gY2FzZVF1ZXVlLmxlbmd0aCA+IDAgPyBjYXNlUXVldWUgOiBudWxsO1xufVxuXG5mdW5jdGlvbiBzZXJpYWxpemVJMThuQmxvY2soXG4gICAgbFZpZXc6IExWaWV3LCBjYXNlUXVldWU6IG51bWJlcltdLCBjb250ZXh0OiBIeWRyYXRpb25Db250ZXh0LCBub2RlOiBJMThuTm9kZSkge1xuICBzd2l0Y2ggKG5vZGUua2luZCkge1xuICAgIGNhc2UgSTE4bk5vZGVLaW5kLlRFWFQ6XG4gICAgICBjb25zdCByTm9kZSA9IHVud3JhcFJOb2RlKGxWaWV3W25vZGUuaW5kZXhdISk7XG4gICAgICBwcm9jZXNzVGV4dE5vZGVCZWZvcmVTZXJpYWxpemF0aW9uKGNvbnRleHQsIHJOb2RlKTtcbiAgICAgIGJyZWFrO1xuXG4gICAgY2FzZSBJMThuTm9kZUtpbmQuRUxFTUVOVDpcbiAgICBjYXNlIEkxOG5Ob2RlS2luZC5QTEFDRUhPTERFUjpcbiAgICAgIG5vZGUuY2hpbGRyZW4uZm9yRWFjaChub2RlID0+IHNlcmlhbGl6ZUkxOG5CbG9jayhsVmlldywgY2FzZVF1ZXVlLCBjb250ZXh0LCBub2RlKSk7XG4gICAgICBicmVhaztcblxuICAgIGNhc2UgSTE4bk5vZGVLaW5kLklDVTpcbiAgICAgIGNvbnN0IGN1cnJlbnRDYXNlID0gbFZpZXdbbm9kZS5jdXJyZW50Q2FzZUxWaWV3SW5kZXhdIGFzIG51bWJlciB8IG51bGw7XG4gICAgICBpZiAoY3VycmVudENhc2UgIT0gbnVsbCkge1xuICAgICAgICAvLyBpMThuIHVzZXMgYSBuZWdhdGl2ZSB2YWx1ZSB0byBzaWduYWwgYSBjaGFuZ2UgdG8gYSBuZXcgY2FzZSwgc28gd2VcbiAgICAgICAgLy8gbmVlZCB0byBpbnZlcnQgaXQgdG8gZ2V0IHRoZSBwcm9wZXIgdmFsdWUuXG4gICAgICAgIGNvbnN0IGNhc2VJZHggPSBjdXJyZW50Q2FzZSA8IDAgPyB+Y3VycmVudENhc2UgOiBjdXJyZW50Q2FzZTtcbiAgICAgICAgY2FzZVF1ZXVlLnB1c2goY2FzZUlkeCk7XG4gICAgICAgIG5vZGUuY2FzZXNbY2FzZUlkeF0uZm9yRWFjaChub2RlID0+IHNlcmlhbGl6ZUkxOG5CbG9jayhsVmlldywgY2FzZVF1ZXVlLCBjb250ZXh0LCBub2RlKSk7XG4gICAgICB9XG4gICAgICBicmVhaztcbiAgfVxufVxuXG4vKipcbiAqIERlc2NyaWJlcyBzaGFyZWQgZGF0YSBhdmFpbGFibGUgZHVyaW5nIHRoZSBoeWRyYXRpb24gcHJvY2Vzcy5cbiAqL1xuaW50ZXJmYWNlIEkxOG5IeWRyYXRpb25Db250ZXh0IHtcbiAgaHlkcmF0aW9uSW5mbzogRGVoeWRyYXRlZFZpZXc7XG4gIGxWaWV3OiBMVmlldztcbiAgaTE4bk5vZGVzOiBNYXA8bnVtYmVyLCBSTm9kZXxudWxsPjtcbiAgZGlzY29ubmVjdGVkTm9kZXM6IFNldDxudW1iZXI+O1xuICBjYXNlUXVldWU6IG51bWJlcltdO1xuICBkZWh5ZHJhdGVkSWN1RGF0YTogTWFwPG51bWJlciwgRGVoeWRyYXRlZEljdURhdGE+O1xufVxuXG4vKipcbiAqIERlc2NyaWJlcyBjdXJyZW50IGh5ZHJhdGlvbiBzdGF0ZS5cbiAqL1xuaW50ZXJmYWNlIEkxOG5IeWRyYXRpb25TdGF0ZSB7XG4gIC8vIFRoZSBjdXJyZW50IG5vZGVcbiAgY3VycmVudE5vZGU6IE5vZGV8bnVsbDtcblxuICAvKipcbiAgICogV2hldGhlciB0aGUgdHJlZSBzaG91bGQgYmUgY29ubmVjdGVkLlxuICAgKlxuICAgKiBEdXJpbmcgaHlkcmF0aW9uLCBpdCBjYW4gaGFwcGVuIHRoYXQgd2UgZXhwZWN0IHRvIGhhdmUgYVxuICAgKiBjdXJyZW50IFJOb2RlLCBidXQgd2UgZG9uJ3QuIEluIHN1Y2ggY2FzZXMsIHdlIHN0aWxsIG5lZWRcbiAgICogdG8gcHJvcGFnYXRlIHRoZSBleHBlY3RhdGlvbiB0byB0aGUgY29ycmVzcG9uZGluZyBMVmlld3MsXG4gICAqIHNvIHRoYXQgdGhlIHByb3BlciBkb3duc3RyZWFtIGVycm9yIGhhbmRsaW5nIGNhbiBwcm92aWRlXG4gICAqIHRoZSBjb3JyZWN0IGNvbnRleHQgZm9yIHRoZSBlcnJvci5cbiAgICovXG4gIGlzQ29ubmVjdGVkOiBib29sZWFuO1xufVxuXG5mdW5jdGlvbiBzZXRDdXJyZW50Tm9kZShzdGF0ZTogSTE4bkh5ZHJhdGlvblN0YXRlLCBub2RlOiBOb2RlfG51bGwpIHtcbiAgc3RhdGUuY3VycmVudE5vZGUgPSBub2RlO1xufVxuXG4vKipcbiAqIE1hcmtzIHRoZSBjdXJyZW50IFJOb2RlIGFzIHRoZSBoeWRyYXRpb24gcm9vdCBmb3IgdGhlIGdpdmVuXG4gKiBBU1Qgbm9kZS5cbiAqL1xuZnVuY3Rpb24gYXBwZW5kSTE4bk5vZGVUb0NvbGxlY3Rpb24oXG4gICAgY29udGV4dDogSTE4bkh5ZHJhdGlvbkNvbnRleHQsIHN0YXRlOiBJMThuSHlkcmF0aW9uU3RhdGUsIGFzdE5vZGU6IEkxOG5Ob2RlKSB7XG4gIGNvbnN0IG5vT2Zmc2V0SW5kZXggPSBhc3ROb2RlLmluZGV4IC0gSEVBREVSX09GRlNFVDtcbiAgY29uc3Qge2Rpc2Nvbm5lY3RlZE5vZGVzfSA9IGNvbnRleHQ7XG4gIGNvbnN0IGN1cnJlbnROb2RlID0gc3RhdGUuY3VycmVudE5vZGU7XG5cbiAgaWYgKHN0YXRlLmlzQ29ubmVjdGVkKSB7XG4gICAgY29udGV4dC5pMThuTm9kZXMuc2V0KG5vT2Zmc2V0SW5kZXgsIGN1cnJlbnROb2RlKTtcblxuICAgIC8vIFdlIGV4cGVjdCB0aGUgbm9kZSB0byBiZSBjb25uZWN0ZWQsIHNvIGVuc3VyZSB0aGF0IGl0XG4gICAgLy8gaXMgbm90IGluIHRoZSBzZXQsIHJlZ2FyZGxlc3Mgb2Ygd2hldGhlciB3ZSBmb3VuZCBpdCxcbiAgICAvLyBzbyB0aGF0IHRoZSBkb3duc3RyZWFtIGVycm9yIGhhbmRsaW5nIGNhbiBwcm92aWRlIHRoZVxuICAgIC8vIHByb3BlciBjb250ZXh0LlxuICAgIGRpc2Nvbm5lY3RlZE5vZGVzLmRlbGV0ZShub09mZnNldEluZGV4KTtcbiAgfSBlbHNlIHtcbiAgICBkaXNjb25uZWN0ZWROb2Rlcy5hZGQobm9PZmZzZXRJbmRleCk7XG4gIH1cblxuICByZXR1cm4gY3VycmVudE5vZGU7XG59XG5cbi8qKlxuICogU2tpcCBvdmVyIHNvbWUgc2libGluZyBub2RlcyBkdXJpbmcgaHlkcmF0aW9uLlxuICpcbiAqIE5vdGU6IHdlIHVzZSB0aGlzIGluc3RlYWQgb2YgYHNpYmxpbmdBZnRlcmAgYXMgaXQncyBleHBlY3RlZCB0aGF0XG4gKiBzb21ldGltZXMgd2UgbWlnaHQgZW5jb3VudGVyIG51bGwgbm9kZXMuIEluIHRob3NlIGNhc2VzLCB3ZSB3YW50IHRvXG4gKiBkZWZlciB0byBkb3duc3RyZWFtIGVycm9yIGhhbmRsaW5nIHRvIHByb3ZpZGUgcHJvcGVyIGNvbnRleHQuXG4gKi9cbmZ1bmN0aW9uIHNraXBTaWJsaW5nTm9kZXMoc3RhdGU6IEkxOG5IeWRyYXRpb25TdGF0ZSwgc2tpcDogbnVtYmVyKSB7XG4gIGxldCBjdXJyZW50Tm9kZSA9IHN0YXRlLmN1cnJlbnROb2RlO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IHNraXA7IGkrKykge1xuICAgIGlmICghY3VycmVudE5vZGUpIHtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBjdXJyZW50Tm9kZSA9IGN1cnJlbnROb2RlPy5uZXh0U2libGluZyA/PyBudWxsO1xuICB9XG4gIHJldHVybiBjdXJyZW50Tm9kZTtcbn1cblxuLyoqXG4gKiBGb3JrIHRoZSBnaXZlbiBzdGF0ZSBpbnRvIGEgbmV3IHN0YXRlIGZvciBoeWRyYXRpbmcgY2hpbGRyZW4uXG4gKi9cbmZ1bmN0aW9uIGZvcmtIeWRyYXRpb25TdGF0ZShzdGF0ZTogSTE4bkh5ZHJhdGlvblN0YXRlLCBuZXh0Tm9kZTogTm9kZXxudWxsKSB7XG4gIHJldHVybiB7Y3VycmVudE5vZGU6IG5leHROb2RlLCBpc0Nvbm5lY3RlZDogc3RhdGUuaXNDb25uZWN0ZWR9O1xufVxuXG5mdW5jdGlvbiBwcmVwYXJlSTE4bkJsb2NrRm9ySHlkcmF0aW9uSW1wbChcbiAgICBsVmlldzogTFZpZXcsIGluZGV4OiBudW1iZXIsIHBhcmVudFROb2RlOiBUTm9kZXxudWxsLCBzdWJUZW1wbGF0ZUluZGV4OiBudW1iZXIpIHtcbiAgaWYgKCFpc0kxOG5IeWRyYXRpb25TdXBwb3J0RW5hYmxlZCgpKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY29uc3QgaHlkcmF0aW9uSW5mbyA9IGxWaWV3W0hZRFJBVElPTl07XG4gIGlmICghaHlkcmF0aW9uSW5mbykge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvbnN0IHRWaWV3ID0gbFZpZXdbVFZJRVddO1xuICBjb25zdCB0STE4biA9IHRWaWV3LmRhdGFbaW5kZXhdIGFzIFRJMThuO1xuICBuZ0Rldk1vZGUgJiZcbiAgICAgIGFzc2VydERlZmluZWQoXG4gICAgICAgICAgdEkxOG4sICdFeHBlY3RlZCBpMThuIGRhdGEgdG8gYmUgcHJlc2VudCBpbiBhIGdpdmVuIFRWaWV3IHNsb3QgZHVyaW5nIGh5ZHJhdGlvbicpO1xuXG4gIGZ1bmN0aW9uIGZpbmRIeWRyYXRpb25Sb290KCkge1xuICAgIGlmIChpc1Jvb3RUZW1wbGF0ZU1lc3NhZ2Uoc3ViVGVtcGxhdGVJbmRleCkpIHtcbiAgICAgIC8vIFRoaXMgaXMgdGhlIHJvb3Qgb2YgYW4gaTE4biBibG9jay4gSW4gdGhpcyBjYXNlLCBvdXIgaHlkcmF0aW9uIHJvb3Qgd2lsbFxuICAgICAgLy8gZGVwZW5kIG9uIHdoZXJlIG91ciBwYXJlbnQgVE5vZGUgKGkuZS4gdGhlIGJsb2NrIHdpdGggaTE4biBhcHBsaWVkKSBpc1xuICAgICAgLy8gaW4gdGhlIERPTS5cbiAgICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKHBhcmVudFROb2RlLCAnRXhwZWN0ZWQgcGFyZW50IFROb2RlIHdoaWxlIGh5ZHJhdGluZyBpMThuIHJvb3QnKTtcbiAgICAgIGNvbnN0IHJvb3ROb2RlID0gbG9jYXRlTmV4dFJOb2RlKGh5ZHJhdGlvbkluZm8hLCB0VmlldywgbFZpZXcsIHBhcmVudFROb2RlISkgYXMgTm9kZTtcblxuICAgICAgLy8gSWYgdGhpcyBpMThuIGJsb2NrIGlzIGF0dGFjaGVkIHRvIGFuIDxuZy1jb250YWluZXI+LCB0aGVuIHdlIHdhbnQgdG8gYmVnaW5cbiAgICAgIC8vIGh5ZHJhdGluZyBkaXJlY3RseSB3aXRoIHRoZSBSTm9kZS4gT3RoZXJ3aXNlLCBmb3IgYSBUTm9kZSB3aXRoIGEgcGh5c2ljYWwgRE9NXG4gICAgICAvLyBlbGVtZW50LCB3ZSB3YW50IHRvIHJlY3Vyc2UgaW50byB0aGUgZmlyc3QgY2hpbGQgYW5kIGJlZ2luIHRoZXJlLlxuICAgICAgcmV0dXJuIChwYXJlbnRUTm9kZSEudHlwZSAmIFROb2RlVHlwZS5FbGVtZW50Q29udGFpbmVyKSA/IHJvb3ROb2RlIDogcm9vdE5vZGUuZmlyc3RDaGlsZDtcbiAgICB9XG5cbiAgICAvLyBUaGlzIGlzIGEgbmVzdGVkIHRlbXBsYXRlIGluIGFuIGkxOG4gYmxvY2suIEluIHRoaXMgY2FzZSwgdGhlIGVudGlyZSB2aWV3XG4gICAgLy8gaXMgdHJhbnNsYXRlZCwgYW5kIHBhcnQgb2YgYSBkZWh5ZHJhdGVkIHZpZXcgaW4gYSBjb250YWluZXIuIFRoaXMgbWVhbnMgdGhhdFxuICAgIC8vIHdlIGNhbiBzaW1wbHkgYmVnaW4gaHlkcmF0aW9uIHdpdGggdGhlIGZpcnN0IGRlaHlkcmF0ZWQgY2hpbGQuXG4gICAgcmV0dXJuIGh5ZHJhdGlvbkluZm8/LmZpcnN0Q2hpbGQgYXMgTm9kZTtcbiAgfVxuXG4gIGNvbnN0IGN1cnJlbnROb2RlID0gZmluZEh5ZHJhdGlvblJvb3QoKTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQoY3VycmVudE5vZGUsICdFeHBlY3RlZCByb290IGkxOG4gbm9kZSBkdXJpbmcgaHlkcmF0aW9uJyk7XG5cbiAgY29uc3QgZGlzY29ubmVjdGVkTm9kZXMgPSBpbml0RGlzY29ubmVjdGVkTm9kZXMoaHlkcmF0aW9uSW5mbykgPz8gbmV3IFNldCgpO1xuICBjb25zdCBpMThuTm9kZXMgPSBoeWRyYXRpb25JbmZvLmkxOG5Ob2RlcyA/Pz0gbmV3IE1hcDxudW1iZXIsIFJOb2RlfG51bGw+KCk7XG4gIGNvbnN0IGNhc2VRdWV1ZSA9IGh5ZHJhdGlvbkluZm8uZGF0YVtJMThOX0RBVEFdPy5baW5kZXggLSBIRUFERVJfT0ZGU0VUXSA/PyBbXTtcbiAgY29uc3QgZGVoeWRyYXRlZEljdURhdGEgPSBoeWRyYXRpb25JbmZvLmRlaHlkcmF0ZWRJY3VEYXRhID8/PVxuICAgICAgbmV3IE1hcDxudW1iZXIsIERlaHlkcmF0ZWRJY3VEYXRhPigpO1xuXG4gIGNvbGxlY3RJMThuTm9kZXNGcm9tRG9tKFxuICAgICAge2h5ZHJhdGlvbkluZm8sIGxWaWV3LCBpMThuTm9kZXMsIGRpc2Nvbm5lY3RlZE5vZGVzLCBjYXNlUXVldWUsIGRlaHlkcmF0ZWRJY3VEYXRhfSxcbiAgICAgIHtjdXJyZW50Tm9kZSwgaXNDb25uZWN0ZWQ6IHRydWV9LCB0STE4bi5hc3QpO1xuXG4gIC8vIE5vZGVzIGZyb20gaW5hY3RpdmUgSUNVIGNhc2VzIHNob3VsZCBiZSBjb25zaWRlcmVkIGRpc2Nvbm5lY3RlZC4gV2UgdHJhY2sgdGhlbSBhYm92ZVxuICAvLyBiZWNhdXNlIHRoZXkgYXJlbid0IChhbmQgc2hvdWxkbid0IGJlKSBzZXJpYWxpemVkLiBTaW5jZSB3ZSBtYXkgbXV0YXRlIG9yIGNyZWF0ZSBhXG4gIC8vIG5ldyBzZXQsIHdlIG5lZWQgdG8gYmUgc3VyZSB0byB3cml0ZSB0aGUgZXhwZWN0ZWQgdmFsdWUgYmFjayB0byB0aGUgRGVoeWRyYXRlZFZpZXcuXG4gIGh5ZHJhdGlvbkluZm8uZGlzY29ubmVjdGVkTm9kZXMgPSBkaXNjb25uZWN0ZWROb2Rlcy5zaXplID09PSAwID8gbnVsbCA6IGRpc2Nvbm5lY3RlZE5vZGVzO1xufVxuXG5mdW5jdGlvbiBjb2xsZWN0STE4bk5vZGVzRnJvbURvbShcbiAgICBjb250ZXh0OiBJMThuSHlkcmF0aW9uQ29udGV4dCwgc3RhdGU6IEkxOG5IeWRyYXRpb25TdGF0ZSwgbm9kZU9yTm9kZXM6IEkxOG5Ob2RlfEkxOG5Ob2RlW10pIHtcbiAgaWYgKEFycmF5LmlzQXJyYXkobm9kZU9yTm9kZXMpKSB7XG4gICAgZm9yIChjb25zdCBub2RlIG9mIG5vZGVPck5vZGVzKSB7XG4gICAgICAvLyBJZiB0aGUgbm9kZSBpcyBiZWluZyBwcm9qZWN0ZWQgZWxzZXdoZXJlLCB3ZSBuZWVkIHRvIHRlbXBvcmFyaWx5XG4gICAgICAvLyBicmFuY2ggdGhlIHN0YXRlIHRvIHRoYXQgbG9jYXRpb24gdG8gY29udGludWUgaHlkcmF0aW9uLlxuICAgICAgLy8gT3RoZXJ3aXNlLCB3ZSBjb250aW51ZSBoeWRyYXRpb24gZnJvbSB0aGUgY3VycmVudCBsb2NhdGlvbi5cbiAgICAgIGNvbnN0IHRhcmdldE5vZGUgPVxuICAgICAgICAgIHRyeUxvY2F0ZVJOb2RlQnlQYXRoKGNvbnRleHQuaHlkcmF0aW9uSW5mbywgY29udGV4dC5sVmlldywgbm9kZS5pbmRleCAtIEhFQURFUl9PRkZTRVQpO1xuICAgICAgY29uc3QgbmV4dFN0YXRlID0gdGFyZ2V0Tm9kZSA/IGZvcmtIeWRyYXRpb25TdGF0ZShzdGF0ZSwgdGFyZ2V0Tm9kZSBhcyBOb2RlKSA6IHN0YXRlO1xuICAgICAgY29sbGVjdEkxOG5Ob2Rlc0Zyb21Eb20oY29udGV4dCwgbmV4dFN0YXRlLCBub2RlKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgc3dpdGNoIChub2RlT3JOb2Rlcy5raW5kKSB7XG4gICAgICBjYXNlIEkxOG5Ob2RlS2luZC5URVhUOiB7XG4gICAgICAgIC8vIENsYWltIGEgdGV4dCBub2RlIGZvciBoeWRyYXRpb25cbiAgICAgICAgY29uc3QgY3VycmVudE5vZGUgPSBhcHBlbmRJMThuTm9kZVRvQ29sbGVjdGlvbihjb250ZXh0LCBzdGF0ZSwgbm9kZU9yTm9kZXMpO1xuICAgICAgICBzZXRDdXJyZW50Tm9kZShzdGF0ZSwgY3VycmVudE5vZGU/Lm5leHRTaWJsaW5nID8/IG51bGwpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cblxuICAgICAgY2FzZSBJMThuTm9kZUtpbmQuRUxFTUVOVDoge1xuICAgICAgICAvLyBSZWN1cnNlIGludG8gdGhlIGN1cnJlbnQgZWxlbWVudCdzIGNoaWxkcmVuLi4uXG4gICAgICAgIGNvbGxlY3RJMThuTm9kZXNGcm9tRG9tKFxuICAgICAgICAgICAgY29udGV4dCwgZm9ya0h5ZHJhdGlvblN0YXRlKHN0YXRlLCBzdGF0ZS5jdXJyZW50Tm9kZT8uZmlyc3RDaGlsZCA/PyBudWxsKSxcbiAgICAgICAgICAgIG5vZGVPck5vZGVzLmNoaWxkcmVuKTtcblxuICAgICAgICAvLyBBbmQgY2xhaW0gdGhlIHBhcmVudCBlbGVtZW50IGl0c2VsZi5cbiAgICAgICAgY29uc3QgY3VycmVudE5vZGUgPSBhcHBlbmRJMThuTm9kZVRvQ29sbGVjdGlvbihjb250ZXh0LCBzdGF0ZSwgbm9kZU9yTm9kZXMpO1xuICAgICAgICBzZXRDdXJyZW50Tm9kZShzdGF0ZSwgY3VycmVudE5vZGU/Lm5leHRTaWJsaW5nID8/IG51bGwpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cblxuICAgICAgY2FzZSBJMThuTm9kZUtpbmQuUExBQ0VIT0xERVI6IHtcbiAgICAgICAgY29uc3Qgbm9PZmZzZXRJbmRleCA9IG5vZGVPck5vZGVzLmluZGV4IC0gSEVBREVSX09GRlNFVDtcbiAgICAgICAgY29uc3Qge2h5ZHJhdGlvbkluZm99ID0gY29udGV4dDtcbiAgICAgICAgY29uc3QgY29udGFpbmVyU2l6ZSA9IGdldE5nQ29udGFpbmVyU2l6ZShoeWRyYXRpb25JbmZvLCBub09mZnNldEluZGV4KTtcblxuICAgICAgICBzd2l0Y2ggKG5vZGVPck5vZGVzLnR5cGUpIHtcbiAgICAgICAgICBjYXNlIEkxOG5QbGFjZWhvbGRlclR5cGUuRUxFTUVOVDoge1xuICAgICAgICAgICAgLy8gSHlkcmF0aW9uIGV4cGVjdHMgdG8gZmluZCB0aGUgaGVhZCBvZiB0aGUgZWxlbWVudC5cbiAgICAgICAgICAgIGNvbnN0IGN1cnJlbnROb2RlID0gYXBwZW5kSTE4bk5vZGVUb0NvbGxlY3Rpb24oY29udGV4dCwgc3RhdGUsIG5vZGVPck5vZGVzKTtcblxuICAgICAgICAgICAgLy8gQSBUTm9kZSBmb3IgdGhlIG5vZGUgbWF5IG5vdCB5ZXQgaWYgd2UncmUgaHlkcmF0aW5nIGR1cmluZyB0aGUgZmlyc3QgcGFzcyxcbiAgICAgICAgICAgIC8vIHNvIHVzZSB0aGUgc2VyaWFsaXplZCBkYXRhIHRvIGRldGVybWluZSBpZiB0aGlzIGlzIGFuIDxuZy1jb250YWluZXI+LlxuICAgICAgICAgICAgaWYgKGlzU2VyaWFsaXplZEVsZW1lbnRDb250YWluZXIoaHlkcmF0aW9uSW5mbywgbm9PZmZzZXRJbmRleCkpIHtcbiAgICAgICAgICAgICAgLy8gQW4gPG5nLWNvbnRhaW5lcj4gZG9lc24ndCBoYXZlIGEgcGh5c2ljYWwgRE9NIG5vZGUsIHNvIHdlIG5lZWQgdG9cbiAgICAgICAgICAgICAgLy8gY29udGludWUgaHlkcmF0aW5nIGZyb20gc2libGluZ3MuXG4gICAgICAgICAgICAgIGNvbGxlY3RJMThuTm9kZXNGcm9tRG9tKGNvbnRleHQsIHN0YXRlLCBub2RlT3JOb2Rlcy5jaGlsZHJlbik7XG5cbiAgICAgICAgICAgICAgLy8gU2tpcCBvdmVyIHRoZSBhbmNob3IgZWxlbWVudC4gSXQgd2lsbCBiZSBjbGFpbWVkIGJ5IHRoZVxuICAgICAgICAgICAgICAvLyBkb3duc3RyZWFtIGNvbnRhaW5lciBoeWRyYXRpb24uXG4gICAgICAgICAgICAgIGNvbnN0IG5leHROb2RlID0gc2tpcFNpYmxpbmdOb2RlcyhzdGF0ZSwgMSk7XG4gICAgICAgICAgICAgIHNldEN1cnJlbnROb2RlKHN0YXRlLCBuZXh0Tm9kZSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAvLyBOb24tY29udGFpbmVyIGVsZW1lbnRzIHJlcHJlc2VudCBhbiBhY3R1YWwgbm9kZSBpbiB0aGUgRE9NLCBzbyB3ZVxuICAgICAgICAgICAgICAvLyBuZWVkIHRvIGNvbnRpbnVlIGh5ZHJhdGlvbiB3aXRoIHRoZSBjaGlsZHJlbiwgYW5kIGNsYWltIHRoZSBub2RlLlxuICAgICAgICAgICAgICBjb2xsZWN0STE4bk5vZGVzRnJvbURvbShcbiAgICAgICAgICAgICAgICAgIGNvbnRleHQsIGZvcmtIeWRyYXRpb25TdGF0ZShzdGF0ZSwgc3RhdGUuY3VycmVudE5vZGU/LmZpcnN0Q2hpbGQgPz8gbnVsbCksXG4gICAgICAgICAgICAgICAgICBub2RlT3JOb2Rlcy5jaGlsZHJlbik7XG4gICAgICAgICAgICAgIHNldEN1cnJlbnROb2RlKHN0YXRlLCBjdXJyZW50Tm9kZT8ubmV4dFNpYmxpbmcgPz8gbnVsbCk7XG5cbiAgICAgICAgICAgICAgLy8gRWxlbWVudHMgY2FuIGFsc28gYmUgdGhlIGFuY2hvciBvZiBhIHZpZXcgY29udGFpbmVyLCBzbyB0aGVyZSBtYXlcbiAgICAgICAgICAgICAgLy8gYmUgZWxlbWVudHMgYWZ0ZXIgdGhpcyBub2RlIHRoYXQgd2UgbmVlZCB0byBza2lwLlxuICAgICAgICAgICAgICBpZiAoY29udGFpbmVyU2l6ZSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIC8vIGArMWAgc3RhbmRzIGZvciBhbiBhbmNob3Igbm9kZSBhZnRlciBhbGwgb2YgdGhlIHZpZXdzIGluIHRoZSBjb250YWluZXIuXG4gICAgICAgICAgICAgICAgY29uc3QgbmV4dE5vZGUgPSBza2lwU2libGluZ05vZGVzKHN0YXRlLCBjb250YWluZXJTaXplICsgMSk7XG4gICAgICAgICAgICAgICAgc2V0Q3VycmVudE5vZGUoc3RhdGUsIG5leHROb2RlKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY2FzZSBJMThuUGxhY2Vob2xkZXJUeXBlLlNVQlRFTVBMQVRFOiB7XG4gICAgICAgICAgICBuZ0Rldk1vZGUgJiZcbiAgICAgICAgICAgICAgICBhc3NlcnROb3RFcXVhbChcbiAgICAgICAgICAgICAgICAgICAgY29udGFpbmVyU2l6ZSwgbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgJ0V4cGVjdGVkIGEgY29udGFpbmVyIHNpemUgd2hpbGUgaHlkcmF0aW5nIGkxOG4gc3VidGVtcGxhdGUnKTtcblxuICAgICAgICAgICAgLy8gSHlkcmF0aW9uIGV4cGVjdHMgdG8gZmluZCB0aGUgaGVhZCBvZiB0aGUgdGVtcGxhdGUuXG4gICAgICAgICAgICBhcHBlbmRJMThuTm9kZVRvQ29sbGVjdGlvbihjb250ZXh0LCBzdGF0ZSwgbm9kZU9yTm9kZXMpO1xuXG4gICAgICAgICAgICAvLyBTa2lwIG92ZXIgYWxsIG9mIHRoZSB0ZW1wbGF0ZSBjaGlsZHJlbiwgYXMgd2VsbCBhcyB0aGUgYW5jaG9yXG4gICAgICAgICAgICAvLyBub2RlLCBzaW5jZSB0aGUgdGVtcGxhdGUgaXRzZWxmIHdpbGwgaGFuZGxlIHRoZW0gaW5zdGVhZC5cbiAgICAgICAgICAgIGNvbnN0IG5leHROb2RlID0gc2tpcFNpYmxpbmdOb2RlcyhzdGF0ZSwgY29udGFpbmVyU2l6ZSEgKyAxKTtcbiAgICAgICAgICAgIHNldEN1cnJlbnROb2RlKHN0YXRlLCBuZXh0Tm9kZSk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG5cbiAgICAgIGNhc2UgSTE4bk5vZGVLaW5kLklDVToge1xuICAgICAgICAvLyBJZiB0aGUgY3VycmVudCBub2RlIGlzIGNvbm5lY3RlZCwgd2UgbmVlZCB0byBwb3AgdGhlIG5leHQgY2FzZSBmcm9tIHRoZVxuICAgICAgICAvLyBxdWV1ZSwgc28gdGhhdCB0aGUgYWN0aXZlIGNhc2UgaXMgYWxzbyBjb25zaWRlcmVkIGNvbm5lY3RlZC5cbiAgICAgICAgY29uc3Qgc2VsZWN0ZWRDYXNlID0gc3RhdGUuaXNDb25uZWN0ZWQgPyBjb250ZXh0LmNhc2VRdWV1ZS5zaGlmdCgpISA6IG51bGw7XG4gICAgICAgIGNvbnN0IGNoaWxkU3RhdGUgPSB7Y3VycmVudE5vZGU6IG51bGwsIGlzQ29ubmVjdGVkOiBmYWxzZX07XG5cbiAgICAgICAgLy8gV2UgdHJhdmVyc2UgdGhyb3VnaCBlYWNoIGNhc2UsIGV2ZW4gaWYgaXQncyBub3QgYWN0aXZlLFxuICAgICAgICAvLyBzbyB0aGF0IHdlIGNvcnJlY3RseSBwb3B1bGF0ZSBkaXNjb25uZWN0ZWQgbm9kZXMuXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbm9kZU9yTm9kZXMuY2FzZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBjb2xsZWN0STE4bk5vZGVzRnJvbURvbShcbiAgICAgICAgICAgICAgY29udGV4dCwgaSA9PT0gc2VsZWN0ZWRDYXNlID8gc3RhdGUgOiBjaGlsZFN0YXRlLCBub2RlT3JOb2Rlcy5jYXNlc1tpXSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoc2VsZWN0ZWRDYXNlICE9PSBudWxsKSB7XG4gICAgICAgICAgLy8gSUNVcyByZXByZXNlbnQgYSBicmFuY2hpbmcgc3RhdGUsIGFuZCB0aGUgc2VsZWN0ZWQgY2FzZSBjb3VsZCBiZSBkaWZmZXJlbnRcbiAgICAgICAgICAvLyB0aGFuIHdoYXQgaXQgd2FzIG9uIHRoZSBzZXJ2ZXIuIEluIHRoYXQgY2FzZSwgd2UgbmVlZCB0byBiZSBhYmxlIHRvIGNsZWFuXG4gICAgICAgICAgLy8gdXAgdGhlIG5vZGVzIGZyb20gdGhlIG9yaWdpbmFsIGNhc2UuIFRvIGRvIHRoYXQsIHdlIHN0b3JlIHRoZSBzZWxlY3RlZCBjYXNlLlxuICAgICAgICAgIGNvbnRleHQuZGVoeWRyYXRlZEljdURhdGEuc2V0KG5vZGVPck5vZGVzLmluZGV4LCB7Y2FzZTogc2VsZWN0ZWRDYXNlLCBub2RlOiBub2RlT3JOb2Rlc30pO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gSHlkcmF0aW9uIGV4cGVjdHMgdG8gZmluZCB0aGUgSUNVIGFuY2hvciBlbGVtZW50LlxuICAgICAgICBjb25zdCBjdXJyZW50Tm9kZSA9IGFwcGVuZEkxOG5Ob2RlVG9Db2xsZWN0aW9uKGNvbnRleHQsIHN0YXRlLCBub2RlT3JOb2Rlcyk7XG4gICAgICAgIHNldEN1cnJlbnROb2RlKHN0YXRlLCBjdXJyZW50Tm9kZT8ubmV4dFNpYmxpbmcgPz8gbnVsbCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG5sZXQgX2NsYWltRGVoeWRyYXRlZEljdUNhc2VJbXBsOiB0eXBlb2YgY2xhaW1EZWh5ZHJhdGVkSWN1Q2FzZUltcGwgPSAoKSA9PiB7XG4gIC8vIG5vb3AgdW5sZXNzIGBlbmFibGVDbGFpbURlaHlkcmF0ZWRJY3VDYXNlSW1wbGAgaXMgaW52b2tlZFxufTtcblxuLyoqXG4gKiBNYXJrIHRoZSBjYXNlIGZvciB0aGUgSUNVIG5vZGUgYXQgdGhlIGdpdmVuIGluZGV4IGluIHRoZSB2aWV3IGFzIGNsYWltZWQsXG4gKiBhbGxvd2luZyBpdHMgbm9kZXMgdG8gYmUgaHlkcmF0ZWQgYW5kIG5vdCBjbGVhbmVkIHVwLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY2xhaW1EZWh5ZHJhdGVkSWN1Q2FzZShsVmlldzogTFZpZXcsIGljdUluZGV4OiBudW1iZXIsIGNhc2VJbmRleDogbnVtYmVyKSB7XG4gIF9jbGFpbURlaHlkcmF0ZWRJY3VDYXNlSW1wbChsVmlldywgaWN1SW5kZXgsIGNhc2VJbmRleCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBlbmFibGVDbGFpbURlaHlkcmF0ZWRJY3VDYXNlSW1wbCgpIHtcbiAgX2NsYWltRGVoeWRyYXRlZEljdUNhc2VJbXBsID0gY2xhaW1EZWh5ZHJhdGVkSWN1Q2FzZUltcGw7XG59XG5cbmZ1bmN0aW9uIGNsYWltRGVoeWRyYXRlZEljdUNhc2VJbXBsKGxWaWV3OiBMVmlldywgaWN1SW5kZXg6IG51bWJlciwgY2FzZUluZGV4OiBudW1iZXIpIHtcbiAgY29uc3QgZGVoeWRyYXRlZEljdURhdGFNYXAgPSBsVmlld1tIWURSQVRJT05dPy5kZWh5ZHJhdGVkSWN1RGF0YTtcbiAgaWYgKGRlaHlkcmF0ZWRJY3VEYXRhTWFwKSB7XG4gICAgY29uc3QgZGVoeWRyYXRlZEljdURhdGEgPSBkZWh5ZHJhdGVkSWN1RGF0YU1hcC5nZXQoaWN1SW5kZXgpO1xuICAgIGlmIChkZWh5ZHJhdGVkSWN1RGF0YT8uY2FzZSA9PT0gY2FzZUluZGV4KSB7XG4gICAgICAvLyBJZiB0aGUgY2FzZSB3ZSdyZSBhdHRlbXB0aW5nIHRvIGNsYWltIG1hdGNoZXMgdGhlIGRlaHlkcmF0ZWQgb25lLFxuICAgICAgLy8gd2UgcmVtb3ZlIGl0IGZyb20gdGhlIG1hcCB0byBtYXJrIGl0IGFzIFwiY2xhaW1lZC5cIlxuICAgICAgZGVoeWRyYXRlZEljdURhdGFNYXAuZGVsZXRlKGljdUluZGV4KTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBDbGVhbiB1cCBhbGwgaTE4biBoeWRyYXRpb24gZGF0YSBhc3NvY2lhdGVkIHdpdGggdGhlIGdpdmVuIHZpZXcuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjbGVhbnVwSTE4bkh5ZHJhdGlvbkRhdGEobFZpZXc6IExWaWV3KSB7XG4gIGNvbnN0IGh5ZHJhdGlvbkluZm8gPSBsVmlld1tIWURSQVRJT05dO1xuICBpZiAoaHlkcmF0aW9uSW5mbykge1xuICAgIGNvbnN0IHtpMThuTm9kZXMsIGRlaHlkcmF0ZWRJY3VEYXRhOiBkZWh5ZHJhdGVkSWN1RGF0YU1hcH0gPSBoeWRyYXRpb25JbmZvO1xuICAgIGlmIChpMThuTm9kZXMgJiYgZGVoeWRyYXRlZEljdURhdGFNYXApIHtcbiAgICAgIGNvbnN0IHJlbmRlcmVyID0gbFZpZXdbUkVOREVSRVJdO1xuICAgICAgZm9yIChjb25zdCBkZWh5ZHJhdGVkSWN1RGF0YSBvZiBkZWh5ZHJhdGVkSWN1RGF0YU1hcC52YWx1ZXMoKSkge1xuICAgICAgICBjbGVhbnVwRGVoeWRyYXRlZEljdURhdGEocmVuZGVyZXIsIGkxOG5Ob2RlcywgZGVoeWRyYXRlZEljdURhdGEpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGh5ZHJhdGlvbkluZm8uaTE4bk5vZGVzID0gdW5kZWZpbmVkO1xuICAgIGh5ZHJhdGlvbkluZm8uZGVoeWRyYXRlZEljdURhdGEgPSB1bmRlZmluZWQ7XG4gIH1cbn1cblxuZnVuY3Rpb24gY2xlYW51cERlaHlkcmF0ZWRJY3VEYXRhKFxuICAgIHJlbmRlcmVyOiBSZW5kZXJlciwgaTE4bk5vZGVzOiBNYXA8bnVtYmVyLCBSTm9kZXxudWxsPiwgZGVoeWRyYXRlZEljdURhdGE6IERlaHlkcmF0ZWRJY3VEYXRhKSB7XG4gIGZvciAoY29uc3Qgbm9kZSBvZiBkZWh5ZHJhdGVkSWN1RGF0YS5ub2RlLmNhc2VzW2RlaHlkcmF0ZWRJY3VEYXRhLmNhc2VdKSB7XG4gICAgY29uc3Qgck5vZGUgPSBpMThuTm9kZXMuZ2V0KG5vZGUuaW5kZXggLSBIRUFERVJfT0ZGU0VUKTtcbiAgICBpZiAock5vZGUpIHtcbiAgICAgIG5hdGl2ZVJlbW92ZU5vZGUocmVuZGVyZXIsIHJOb2RlLCBmYWxzZSk7XG4gICAgfVxuICB9XG59XG4iXX0=