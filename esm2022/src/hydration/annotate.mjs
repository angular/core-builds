/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { isDetachedByI18n } from '../i18n/utils';
import { ViewEncapsulation } from '../metadata';
import { collectNativeNodes, collectNativeNodesInLContainer } from '../render3/collect_native_nodes';
import { getComponentDef } from '../render3/definition';
import { CONTAINER_HEADER_OFFSET } from '../render3/interfaces/container';
import { isTNodeShape } from '../render3/interfaces/node';
import { hasI18n, isComponentHost, isLContainer, isProjectionTNode, isRootView } from '../render3/interfaces/type_checks';
import { CONTEXT, HEADER_OFFSET, HOST, PARENT, RENDERER, TVIEW } from '../render3/interfaces/view';
import { unwrapLView, unwrapRNode } from '../render3/util/view_utils';
import { TransferState } from '../transfer_state';
import { unsupportedProjectionOfDomNodes } from './error_handling';
import { getOrComputeI18nChildren, isI18nHydrationEnabled, isI18nHydrationSupportEnabled, trySerializeI18nBlock } from './i18n';
import { CONTAINERS, DISCONNECTED_NODES, ELEMENT_CONTAINERS, I18N_DATA, MULTIPLIER, NODES, NUM_ROOT_NODES, TEMPLATE_ID, TEMPLATES } from './interfaces';
import { calcPathForNode, isDisconnectedNode } from './node_lookup_utils';
import { isInSkipHydrationBlock, SKIP_HYDRATION_ATTR_NAME } from './skip_hydration';
import { getLNodeForHydration, NGH_ATTR_NAME, NGH_DATA_KEY, processTextNodeBeforeSerialization } from './utils';
/**
 * A collection that tracks all serialized views (`ngh` DOM annotations)
 * to avoid duplication. An attempt to add a duplicate view results in the
 * collection returning the index of the previously collected serialized view.
 * This reduces the number of annotations needed for a given page.
 */
class SerializedViewCollection {
    constructor() {
        this.views = [];
        this.indexByContent = new Map();
    }
    add(serializedView) {
        const viewAsString = JSON.stringify(serializedView);
        if (!this.indexByContent.has(viewAsString)) {
            const index = this.views.length;
            this.views.push(serializedView);
            this.indexByContent.set(viewAsString, index);
            return index;
        }
        return this.indexByContent.get(viewAsString);
    }
    getAll() {
        return this.views;
    }
}
/**
 * Global counter that is used to generate a unique id for TViews
 * during the serialization process.
 */
let tViewSsrId = 0;
/**
 * Generates a unique id for a given TView and returns this id.
 * The id is also stored on this instance of a TView and reused in
 * subsequent calls.
 *
 * This id is needed to uniquely identify and pick up dehydrated views
 * at runtime.
 */
function getSsrId(tView) {
    if (!tView.ssrId) {
        tView.ssrId = `t${tViewSsrId++}`;
    }
    return tView.ssrId;
}
/**
 * Computes the number of root nodes in a given view
 * (or child nodes in a given container if a tNode is provided).
 */
function calcNumRootNodes(tView, lView, tNode) {
    const rootNodes = [];
    collectNativeNodes(tView, lView, tNode, rootNodes);
    return rootNodes.length;
}
/**
 * Computes the number of root nodes in all views in a given LContainer.
 */
function calcNumRootNodesInLContainer(lContainer) {
    const rootNodes = [];
    collectNativeNodesInLContainer(lContainer, rootNodes);
    return rootNodes.length;
}
/**
 * Annotates root level component's LView for hydration,
 * see `annotateHostElementForHydration` for additional information.
 */
function annotateComponentLViewForHydration(lView, context) {
    const hostElement = lView[HOST];
    // Root elements might also be annotated with the `ngSkipHydration` attribute,
    // check if it's present before starting the serialization process.
    if (hostElement && !hostElement.hasAttribute(SKIP_HYDRATION_ATTR_NAME)) {
        return annotateHostElementForHydration(hostElement, lView, context);
    }
    return null;
}
/**
 * Annotates root level LContainer for hydration. This happens when a root component
 * injects ViewContainerRef, thus making the component an anchor for a view container.
 * This function serializes the component itself as well as all views from the view
 * container.
 */
function annotateLContainerForHydration(lContainer, context) {
    const componentLView = unwrapLView(lContainer[HOST]);
    // Serialize the root component itself.
    const componentLViewNghIndex = annotateComponentLViewForHydration(componentLView, context);
    const hostElement = unwrapRNode(componentLView[HOST]);
    // Serialize all views within this view container.
    const rootLView = lContainer[PARENT];
    const rootLViewNghIndex = annotateHostElementForHydration(hostElement, rootLView, context);
    const renderer = componentLView[RENDERER];
    // For cases when a root component also acts as an anchor node for a ViewContainerRef
    // (for example, when ViewContainerRef is injected in a root component), there is a need
    // to serialize information about the component itself, as well as an LContainer that
    // represents this ViewContainerRef. Effectively, we need to serialize 2 pieces of info:
    // (1) hydration info for the root component itself and (2) hydration info for the
    // ViewContainerRef instance (an LContainer). Each piece of information is included into
    // the hydration data (in the TransferState object) separately, thus we end up with 2 ids.
    // Since we only have 1 root element, we encode both bits of info into a single string:
    // ids are separated by the `|` char (e.g. `10|25`, where `10` is the ngh for a component view
    // and 25 is the `ngh` for a root view which holds LContainer).
    const finalIndex = `${componentLViewNghIndex}|${rootLViewNghIndex}`;
    renderer.setAttribute(hostElement, NGH_ATTR_NAME, finalIndex);
}
/**
 * Annotates all components bootstrapped in a given ApplicationRef
 * with info needed for hydration.
 *
 * @param appRef An instance of an ApplicationRef.
 * @param doc A reference to the current Document instance.
 */
export function annotateForHydration(appRef, doc) {
    const injector = appRef.injector;
    const isI18nHydrationEnabledVal = isI18nHydrationEnabled(injector);
    const serializedViewCollection = new SerializedViewCollection();
    const corruptedTextNodes = new Map();
    const viewRefs = appRef._views;
    for (const viewRef of viewRefs) {
        const lNode = getLNodeForHydration(viewRef);
        // An `lView` might be `null` if a `ViewRef` represents
        // an embedded view (not a component view).
        if (lNode !== null) {
            const context = {
                serializedViewCollection,
                corruptedTextNodes,
                isI18nHydrationEnabled: isI18nHydrationEnabledVal,
                i18nChildren: new Map(),
            };
            if (isLContainer(lNode)) {
                annotateLContainerForHydration(lNode, context);
            }
            else {
                annotateComponentLViewForHydration(lNode, context);
            }
            insertCorruptedTextNodeMarkers(corruptedTextNodes, doc);
        }
    }
    // Note: we *always* include hydration info key and a corresponding value
    // into the TransferState, even if the list of serialized views is empty.
    // This is needed as a signal to the client that the server part of the
    // hydration logic was setup and enabled correctly. Otherwise, if a client
    // hydration doesn't find a key in the transfer state - an error is produced.
    const serializedViews = serializedViewCollection.getAll();
    const transferState = injector.get(TransferState);
    transferState.set(NGH_DATA_KEY, serializedViews);
}
/**
 * Serializes the lContainer data into a list of SerializedView objects,
 * that represent views within this lContainer.
 *
 * @param lContainer the lContainer we are serializing
 * @param context the hydration context
 * @returns an array of the `SerializedView` objects
 */
function serializeLContainer(lContainer, context) {
    const views = [];
    let lastViewAsString = '';
    for (let i = CONTAINER_HEADER_OFFSET; i < lContainer.length; i++) {
        let childLView = lContainer[i];
        let template;
        let numRootNodes;
        let serializedView;
        if (isRootView(childLView)) {
            // If this is a root view, get an LView for the underlying component,
            // because it contains information about the view to serialize.
            childLView = childLView[HEADER_OFFSET];
            // If we have an LContainer at this position, this indicates that the
            // host element was used as a ViewContainerRef anchor (e.g. a `ViewContainerRef`
            // was injected within the component class). This case requires special handling.
            if (isLContainer(childLView)) {
                // Calculate the number of root nodes in all views in a given container
                // and increment by one to account for an anchor node itself, i.e. in this
                // scenario we'll have a layout that would look like this:
                // `<app-root /><#VIEW1><#VIEW2>...<!--container-->`
                // The `+1` is to capture the `<app-root />` element.
                numRootNodes = calcNumRootNodesInLContainer(childLView) + 1;
                annotateLContainerForHydration(childLView, context);
                const componentLView = unwrapLView(childLView[HOST]);
                serializedView = {
                    [TEMPLATE_ID]: componentLView[TVIEW].ssrId,
                    [NUM_ROOT_NODES]: numRootNodes,
                };
            }
        }
        if (!serializedView) {
            const childTView = childLView[TVIEW];
            if (childTView.type === 1 /* TViewType.Component */) {
                template = childTView.ssrId;
                // This is a component view, thus it has only 1 root node: the component
                // host node itself (other nodes would be inside that host node).
                numRootNodes = 1;
            }
            else {
                template = getSsrId(childTView);
                numRootNodes = calcNumRootNodes(childTView, childLView, childTView.firstChild);
            }
            serializedView = {
                [TEMPLATE_ID]: template,
                [NUM_ROOT_NODES]: numRootNodes,
                ...serializeLView(lContainer[i], context),
            };
        }
        // Check if the previous view has the same shape (for example, it was
        // produced by the *ngFor), in which case bump the counter on the previous
        // view instead of including the same information again.
        const currentViewAsString = JSON.stringify(serializedView);
        if (views.length > 0 && currentViewAsString === lastViewAsString) {
            const previousView = views[views.length - 1];
            previousView[MULTIPLIER] ??= 1;
            previousView[MULTIPLIER]++;
        }
        else {
            // Record this view as most recently added.
            lastViewAsString = currentViewAsString;
            views.push(serializedView);
        }
    }
    return views;
}
/**
 * Helper function to produce a node path (which navigation steps runtime logic
 * needs to take to locate a node) and stores it in the `NODES` section of the
 * current serialized view.
 */
function appendSerializedNodePath(ngh, tNode, lView, excludedParentNodes) {
    const noOffsetIndex = tNode.index - HEADER_OFFSET;
    ngh[NODES] ??= {};
    ngh[NODES][noOffsetIndex] = calcPathForNode(tNode, lView, excludedParentNodes);
}
/**
 * Helper function to append information about a disconnected node.
 * This info is needed at runtime to avoid DOM lookups for this element
 * and instead, the element would be created from scratch.
 */
function appendDisconnectedNodeIndex(ngh, tNode) {
    const noOffsetIndex = tNode.index - HEADER_OFFSET;
    ngh[DISCONNECTED_NODES] ??= [];
    if (!ngh[DISCONNECTED_NODES].includes(noOffsetIndex)) {
        ngh[DISCONNECTED_NODES].push(noOffsetIndex);
    }
}
/**
 * Serializes the lView data into a SerializedView object that will later be added
 * to the TransferState storage and referenced using the `ngh` attribute on a host
 * element.
 *
 * @param lView the lView we are serializing
 * @param context the hydration context
 * @returns the `SerializedView` object containing the data to be added to the host node
 */
function serializeLView(lView, context) {
    const ngh = {};
    const tView = lView[TVIEW];
    const i18nChildren = getOrComputeI18nChildren(tView, context);
    // Iterate over DOM element references in an LView.
    for (let i = HEADER_OFFSET; i < tView.bindingStartIndex; i++) {
        const tNode = tView.data[i];
        const noOffsetIndex = i - HEADER_OFFSET;
        // Attempt to serialize any i18n data for the given slot. We do this first, as i18n
        // has its own process for serialization.
        const i18nData = trySerializeI18nBlock(lView, i, context);
        if (i18nData) {
            ngh[I18N_DATA] ??= {};
            ngh[I18N_DATA][noOffsetIndex] = i18nData;
            continue;
        }
        // Skip processing of a given slot in the following cases:
        // - Local refs (e.g. <div #localRef>) take up an extra slot in LViews
        //   to store the same element. In this case, there is no information in
        //   a corresponding slot in TNode data structure.
        // - When a slot contains something other than a TNode. For example, there
        //   might be some metadata information about a defer block or a control flow block.
        if (!isTNodeShape(tNode)) {
            continue;
        }
        // Skip any nodes that are in an i18n block but are considered detached (i.e. not
        // present in the template). These nodes are disconnected from the DOM tree, and
        // so we don't want to serialize any information about them.
        if (isDetachedByI18n(tNode)) {
            continue;
        }
        // Check if a native node that represents a given TNode is disconnected from the DOM tree.
        // Such nodes must be excluded from the hydration (since the hydration won't be able to
        // find them), so the TNode ids are collected and used at runtime to skip the hydration.
        //
        // This situation may happen during the content projection, when some nodes don't make it
        // into one of the content projection slots (for example, when there is no default
        // <ng-content /> slot in projector component's template).
        if (isDisconnectedNode(tNode, lView) && isContentProjectedNode(tNode)) {
            appendDisconnectedNodeIndex(ngh, tNode);
            continue;
        }
        if (Array.isArray(tNode.projection)) {
            for (const projectionHeadTNode of tNode.projection) {
                // We may have `null`s in slots with no projected content.
                if (!projectionHeadTNode)
                    continue;
                if (!Array.isArray(projectionHeadTNode)) {
                    // If we process re-projected content (i.e. `<ng-content>`
                    // appears at projection location), skip annotations for this content
                    // since all DOM nodes in this projection were handled while processing
                    // a parent lView, which contains those nodes.
                    if (!isProjectionTNode(projectionHeadTNode) &&
                        !isInSkipHydrationBlock(projectionHeadTNode)) {
                        if (isDisconnectedNode(projectionHeadTNode, lView)) {
                            // Check whether this node is connected, since we may have a TNode
                            // in the data structure as a projection segment head, but the
                            // content projection slot might be disabled (e.g.
                            // <ng-content *ngIf="false" />).
                            appendDisconnectedNodeIndex(ngh, projectionHeadTNode);
                        }
                        else {
                            appendSerializedNodePath(ngh, projectionHeadTNode, lView, i18nChildren);
                        }
                    }
                }
                else {
                    // If a value is an array, it means that we are processing a projection
                    // where projectable nodes were passed in as DOM nodes (for example, when
                    // calling `ViewContainerRef.createComponent(CmpA, {projectableNodes: [...]})`).
                    //
                    // In this scenario, nodes can come from anywhere (either created manually,
                    // accessed via `document.querySelector`, etc) and may be in any state
                    // (attached or detached from the DOM tree). As a result, we can not reliably
                    // restore the state for such cases during hydration.
                    throw unsupportedProjectionOfDomNodes(unwrapRNode(lView[i]));
                }
            }
        }
        conditionallyAnnotateNodePath(ngh, tNode, lView, i18nChildren);
        if (isLContainer(lView[i])) {
            // Serialize information about a template.
            const embeddedTView = tNode.tView;
            if (embeddedTView !== null) {
                ngh[TEMPLATES] ??= {};
                ngh[TEMPLATES][noOffsetIndex] = getSsrId(embeddedTView);
            }
            // Serialize views within this LContainer.
            const hostNode = lView[i][HOST]; // host node of this container
            // LView[i][HOST] can be of 2 different types:
            // - either a DOM node
            // - or an array that represents an LView of a component
            if (Array.isArray(hostNode)) {
                // This is a component, serialize info about it.
                const targetNode = unwrapRNode(hostNode);
                if (!targetNode.hasAttribute(SKIP_HYDRATION_ATTR_NAME)) {
                    annotateHostElementForHydration(targetNode, hostNode, context);
                }
            }
            ngh[CONTAINERS] ??= {};
            ngh[CONTAINERS][noOffsetIndex] = serializeLContainer(lView[i], context);
        }
        else if (Array.isArray(lView[i])) {
            // This is a component, annotate the host node with an `ngh` attribute.
            const targetNode = unwrapRNode(lView[i][HOST]);
            if (!targetNode.hasAttribute(SKIP_HYDRATION_ATTR_NAME)) {
                annotateHostElementForHydration(targetNode, lView[i], context);
            }
        }
        else {
            // <ng-container> case
            if (tNode.type & 8 /* TNodeType.ElementContainer */) {
                // An <ng-container> is represented by the number of
                // top-level nodes. This information is needed to skip over
                // those nodes to reach a corresponding anchor node (comment node).
                ngh[ELEMENT_CONTAINERS] ??= {};
                ngh[ELEMENT_CONTAINERS][noOffsetIndex] = calcNumRootNodes(tView, lView, tNode.child);
            }
            else if (tNode.type & 16 /* TNodeType.Projection */) {
                // Current TNode represents an `<ng-content>` slot, thus it has no
                // DOM elements associated with it, so the **next sibling** node would
                // not be able to find an anchor. In this case, use full path instead.
                let nextTNode = tNode.next;
                // Skip over all `<ng-content>` slots in a row.
                while (nextTNode !== null && (nextTNode.type & 16 /* TNodeType.Projection */)) {
                    nextTNode = nextTNode.next;
                }
                if (nextTNode && !isInSkipHydrationBlock(nextTNode)) {
                    // Handle a tNode after the `<ng-content>` slot.
                    appendSerializedNodePath(ngh, nextTNode, lView, i18nChildren);
                }
            }
            else {
                if (tNode.type & 1 /* TNodeType.Text */) {
                    const rNode = unwrapRNode(lView[i]);
                    processTextNodeBeforeSerialization(context, rNode);
                }
            }
        }
    }
    return ngh;
}
/**
 * Serializes node location in cases when it's needed, specifically:
 *
 *  1. If `tNode.projectionNext` is different from `tNode.next` - it means that
 *     the next `tNode` after projection is different from the one in the original
 *     template. Since hydration relies on `tNode.next`, this serialized info
 *     is required to help runtime code find the node at the correct location.
 *  2. In certain content projection-based use-cases, it's possible that only
 *     a content of a projected element is rendered. In this case, content nodes
 *     require an extra annotation, since runtime logic can't rely on parent-child
 *     connection to identify the location of a node.
 */
function conditionallyAnnotateNodePath(ngh, tNode, lView, excludedParentNodes) {
    // Handle case #1 described above.
    if (tNode.projectionNext && tNode.projectionNext !== tNode.next &&
        !isInSkipHydrationBlock(tNode.projectionNext)) {
        appendSerializedNodePath(ngh, tNode.projectionNext, lView, excludedParentNodes);
    }
    // Handle case #2 described above.
    // Note: we only do that for the first node (i.e. when `tNode.prev === null`),
    // the rest of the nodes would rely on the current node location, so no extra
    // annotation is needed.
    if (tNode.prev === null && tNode.parent !== null && isDisconnectedNode(tNode.parent, lView) &&
        !isDisconnectedNode(tNode, lView)) {
        appendSerializedNodePath(ngh, tNode, lView, excludedParentNodes);
    }
}
/**
 * Determines whether a component instance that is represented
 * by a given LView uses `ViewEncapsulation.ShadowDom`.
 */
function componentUsesShadowDomEncapsulation(lView) {
    const instance = lView[CONTEXT];
    return instance?.constructor ?
        getComponentDef(instance.constructor)?.encapsulation === ViewEncapsulation.ShadowDom :
        false;
}
/**
 * Annotates component host element for hydration:
 * - by either adding the `ngh` attribute and collecting hydration-related info
 *   for the serialization and transferring to the client
 * - or by adding the `ngSkipHydration` attribute in case Angular detects that
 *   component contents is not compatible with hydration.
 *
 * @param element The Host element to be annotated
 * @param lView The associated LView
 * @param context The hydration context
 * @returns An index of serialized view from the transfer state object
 *          or `null` when a given component can not be serialized.
 */
function annotateHostElementForHydration(element, lView, context) {
    const renderer = lView[RENDERER];
    if ((hasI18n(lView) && !isI18nHydrationSupportEnabled()) ||
        componentUsesShadowDomEncapsulation(lView)) {
        // Attach the skip hydration attribute if this component:
        // - either has i18n blocks, since hydrating such blocks is not yet supported
        // - or uses ShadowDom view encapsulation, since Domino doesn't support
        //   shadow DOM, so we can not guarantee that client and server representations
        //   would exactly match
        renderer.setAttribute(element, SKIP_HYDRATION_ATTR_NAME, '');
        return null;
    }
    else {
        const ngh = serializeLView(lView, context);
        const index = context.serializedViewCollection.add(ngh);
        renderer.setAttribute(element, NGH_ATTR_NAME, index.toString());
        return index;
    }
}
/**
 * Physically inserts the comment nodes to ensure empty text nodes and adjacent
 * text node separators are preserved after server serialization of the DOM.
 * These get swapped back for empty text nodes or separators once hydration happens
 * on the client.
 *
 * @param corruptedTextNodes The Map of text nodes to be replaced with comments
 * @param doc The document
 */
function insertCorruptedTextNodeMarkers(corruptedTextNodes, doc) {
    for (const [textNode, marker] of corruptedTextNodes) {
        textNode.after(doc.createComment(marker));
    }
}
/**
 * Detects whether a given TNode represents a node that
 * is being content projected.
 */
function isContentProjectedNode(tNode) {
    let currentTNode = tNode;
    while (currentTNode != null) {
        // If we come across a component host node in parent nodes -
        // this TNode is in the content projection section.
        if (isComponentHost(currentTNode)) {
            return true;
        }
        currentTNode = currentTNode.parent;
    }
    return false;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYW5ub3RhdGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9oeWRyYXRpb24vYW5ub3RhdGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBR0gsT0FBTyxFQUFDLGdCQUFnQixFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQy9DLE9BQU8sRUFBQyxpQkFBaUIsRUFBQyxNQUFNLGFBQWEsQ0FBQztBQUU5QyxPQUFPLEVBQUMsa0JBQWtCLEVBQUUsOEJBQThCLEVBQUMsTUFBTSxpQ0FBaUMsQ0FBQztBQUNuRyxPQUFPLEVBQUMsZUFBZSxFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDdEQsT0FBTyxFQUFDLHVCQUF1QixFQUFhLE1BQU0saUNBQWlDLENBQUM7QUFDcEYsT0FBTyxFQUFDLFlBQVksRUFBbUIsTUFBTSw0QkFBNEIsQ0FBQztBQUUxRSxPQUFPLEVBQUMsT0FBTyxFQUFFLGVBQWUsRUFBRSxZQUFZLEVBQUUsaUJBQWlCLEVBQUUsVUFBVSxFQUFDLE1BQU0sbUNBQW1DLENBQUM7QUFDeEgsT0FBTyxFQUFDLE9BQU8sRUFBRSxhQUFhLEVBQUUsSUFBSSxFQUFTLE1BQU0sRUFBRSxRQUFRLEVBQVMsS0FBSyxFQUFZLE1BQU0sNEJBQTRCLENBQUM7QUFDMUgsT0FBTyxFQUFDLFdBQVcsRUFBRSxXQUFXLEVBQUMsTUFBTSw0QkFBNEIsQ0FBQztBQUNwRSxPQUFPLEVBQUMsYUFBYSxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFFaEQsT0FBTyxFQUFDLCtCQUErQixFQUFDLE1BQU0sa0JBQWtCLENBQUM7QUFDakUsT0FBTyxFQUFDLHdCQUF3QixFQUFFLHNCQUFzQixFQUFFLDZCQUE2QixFQUFFLHFCQUFxQixFQUFDLE1BQU0sUUFBUSxDQUFDO0FBQzlILE9BQU8sRUFBQyxVQUFVLEVBQUUsa0JBQWtCLEVBQUUsa0JBQWtCLEVBQUUsU0FBUyxFQUFFLFVBQVUs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Q0FBQztRQUNkLENBQUM7UUFDRCxZQUFZLEdBQUcsWUFBWSxDQUFDLE1BQWUsQ0FBQztJQUM5QyxDQUFDO0lBQ0QsT0FBTyxLQUFLLENBQUM7QUFDZixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7QXBwbGljYXRpb25SZWZ9IGZyb20gJy4uL2FwcGxpY2F0aW9uL2FwcGxpY2F0aW9uX3JlZic7XG5pbXBvcnQge2lzRGV0YWNoZWRCeUkxOG59IGZyb20gJy4uL2kxOG4vdXRpbHMnO1xuaW1wb3J0IHtWaWV3RW5jYXBzdWxhdGlvbn0gZnJvbSAnLi4vbWV0YWRhdGEnO1xuaW1wb3J0IHtSZW5kZXJlcjJ9IGZyb20gJy4uL3JlbmRlcic7XG5pbXBvcnQge2NvbGxlY3ROYXRpdmVOb2RlcywgY29sbGVjdE5hdGl2ZU5vZGVzSW5MQ29udGFpbmVyfSBmcm9tICcuLi9yZW5kZXIzL2NvbGxlY3RfbmF0aXZlX25vZGVzJztcbmltcG9ydCB7Z2V0Q29tcG9uZW50RGVmfSBmcm9tICcuLi9yZW5kZXIzL2RlZmluaXRpb24nO1xuaW1wb3J0IHtDT05UQUlORVJfSEVBREVSX09GRlNFVCwgTENvbnRhaW5lcn0gZnJvbSAnLi4vcmVuZGVyMy9pbnRlcmZhY2VzL2NvbnRhaW5lcic7XG5pbXBvcnQge2lzVE5vZGVTaGFwZSwgVE5vZGUsIFROb2RlVHlwZX0gZnJvbSAnLi4vcmVuZGVyMy9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtSRWxlbWVudH0gZnJvbSAnLi4vcmVuZGVyMy9pbnRlcmZhY2VzL3JlbmRlcmVyX2RvbSc7XG5pbXBvcnQge2hhc0kxOG4sIGlzQ29tcG9uZW50SG9zdCwgaXNMQ29udGFpbmVyLCBpc1Byb2plY3Rpb25UTm9kZSwgaXNSb290Vmlld30gZnJvbSAnLi4vcmVuZGVyMy9pbnRlcmZhY2VzL3R5cGVfY2hlY2tzJztcbmltcG9ydCB7Q09OVEVYVCwgSEVBREVSX09GRlNFVCwgSE9TVCwgTFZpZXcsIFBBUkVOVCwgUkVOREVSRVIsIFRWaWV3LCBUVklFVywgVFZpZXdUeXBlfSBmcm9tICcuLi9yZW5kZXIzL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge3Vud3JhcExWaWV3LCB1bndyYXBSTm9kZX0gZnJvbSAnLi4vcmVuZGVyMy91dGlsL3ZpZXdfdXRpbHMnO1xuaW1wb3J0IHtUcmFuc2ZlclN0YXRlfSBmcm9tICcuLi90cmFuc2Zlcl9zdGF0ZSc7XG5cbmltcG9ydCB7dW5zdXBwb3J0ZWRQcm9qZWN0aW9uT2ZEb21Ob2Rlc30gZnJvbSAnLi9lcnJvcl9oYW5kbGluZyc7XG5pbXBvcnQge2dldE9yQ29tcHV0ZUkxOG5DaGlsZHJlbiwgaXNJMThuSHlkcmF0aW9uRW5hYmxlZCwgaXNJMThuSHlkcmF0aW9uU3VwcG9ydEVuYWJsZWQsIHRyeVNlcmlhbGl6ZUkxOG5CbG9ja30gZnJvbSAnLi9pMThuJztcbmltcG9ydCB7Q09OVEFJTkVSUywgRElTQ09OTkVDVEVEX05PREVTLCBFTEVNRU5UX0NPTlRBSU5FUlMsIEkxOE5fREFUQSwgTVVMVElQTElFUiwgTk9ERVMsIE5VTV9ST09UX05PREVTLCBTZXJpYWxpemVkQ29udGFpbmVyVmlldywgU2VyaWFsaXplZFZpZXcsIFRFTVBMQVRFX0lELCBURU1QTEFURVN9IGZyb20gJy4vaW50ZXJmYWNlcyc7XG5pbXBvcnQge2NhbGNQYXRoRm9yTm9kZSwgaXNEaXNjb25uZWN0ZWROb2RlfSBmcm9tICcuL25vZGVfbG9va3VwX3V0aWxzJztcbmltcG9ydCB7aXNJblNraXBIeWRyYXRpb25CbG9jaywgU0tJUF9IWURSQVRJT05fQVRUUl9OQU1FfSBmcm9tICcuL3NraXBfaHlkcmF0aW9uJztcbmltcG9ydCB7Z2V0TE5vZGVGb3JIeWRyYXRpb24sIE5HSF9BVFRSX05BTUUsIE5HSF9EQVRBX0tFWSwgcHJvY2Vzc1RleHROb2RlQmVmb3JlU2VyaWFsaXphdGlvbiwgVGV4dE5vZGVNYXJrZXJ9IGZyb20gJy4vdXRpbHMnO1xuXG4vKipcbiAqIEEgY29sbGVjdGlvbiB0aGF0IHRyYWNrcyBhbGwgc2VyaWFsaXplZCB2aWV3cyAoYG5naGAgRE9NIGFubm90YXRpb25zKVxuICogdG8gYXZvaWQgZHVwbGljYXRpb24uIEFuIGF0dGVtcHQgdG8gYWRkIGEgZHVwbGljYXRlIHZpZXcgcmVzdWx0cyBpbiB0aGVcbiAqIGNvbGxlY3Rpb24gcmV0dXJuaW5nIHRoZSBpbmRleCBvZiB0aGUgcHJldmlvdXNseSBjb2xsZWN0ZWQgc2VyaWFsaXplZCB2aWV3LlxuICogVGhpcyByZWR1Y2VzIHRoZSBudW1iZXIgb2YgYW5ub3RhdGlvbnMgbmVlZGVkIGZvciBhIGdpdmVuIHBhZ2UuXG4gKi9cbmNsYXNzIFNlcmlhbGl6ZWRWaWV3Q29sbGVjdGlvbiB7XG4gIHByaXZhdGUgdmlld3M6IFNlcmlhbGl6ZWRWaWV3W10gPSBbXTtcbiAgcHJpdmF0ZSBpbmRleEJ5Q29udGVudCA9IG5ldyBNYXA8c3RyaW5nLCBudW1iZXI+KCk7XG5cbiAgYWRkKHNlcmlhbGl6ZWRWaWV3OiBTZXJpYWxpemVkVmlldyk6IG51bWJlciB7XG4gICAgY29uc3Qgdmlld0FzU3RyaW5nID0gSlNPTi5zdHJpbmdpZnkoc2VyaWFsaXplZFZpZXcpO1xuICAgIGlmICghdGhpcy5pbmRleEJ5Q29udGVudC5oYXModmlld0FzU3RyaW5nKSkge1xuICAgICAgY29uc3QgaW5kZXggPSB0aGlzLnZpZXdzLmxlbmd0aDtcbiAgICAgIHRoaXMudmlld3MucHVzaChzZXJpYWxpemVkVmlldyk7XG4gICAgICB0aGlzLmluZGV4QnlDb250ZW50LnNldCh2aWV3QXNTdHJpbmcsIGluZGV4KTtcbiAgICAgIHJldHVybiBpbmRleDtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuaW5kZXhCeUNvbnRlbnQuZ2V0KHZpZXdBc1N0cmluZykhO1xuICB9XG5cbiAgZ2V0QWxsKCk6IFNlcmlhbGl6ZWRWaWV3W10ge1xuICAgIHJldHVybiB0aGlzLnZpZXdzO1xuICB9XG59XG5cbi8qKlxuICogR2xvYmFsIGNvdW50ZXIgdGhhdCBpcyB1c2VkIHRvIGdlbmVyYXRlIGEgdW5pcXVlIGlkIGZvciBUVmlld3NcbiAqIGR1cmluZyB0aGUgc2VyaWFsaXphdGlvbiBwcm9jZXNzLlxuICovXG5sZXQgdFZpZXdTc3JJZCA9IDA7XG5cbi8qKlxuICogR2VuZXJhdGVzIGEgdW5pcXVlIGlkIGZvciBhIGdpdmVuIFRWaWV3IGFuZCByZXR1cm5zIHRoaXMgaWQuXG4gKiBUaGUgaWQgaXMgYWxzbyBzdG9yZWQgb24gdGhpcyBpbnN0YW5jZSBvZiBhIFRWaWV3IGFuZCByZXVzZWQgaW5cbiAqIHN1YnNlcXVlbnQgY2FsbHMuXG4gKlxuICogVGhpcyBpZCBpcyBuZWVkZWQgdG8gdW5pcXVlbHkgaWRlbnRpZnkgYW5kIHBpY2sgdXAgZGVoeWRyYXRlZCB2aWV3c1xuICogYXQgcnVudGltZS5cbiAqL1xuZnVuY3Rpb24gZ2V0U3NySWQodFZpZXc6IFRWaWV3KTogc3RyaW5nIHtcbiAgaWYgKCF0Vmlldy5zc3JJZCkge1xuICAgIHRWaWV3LnNzcklkID0gYHQke3RWaWV3U3NySWQrK31gO1xuICB9XG4gIHJldHVybiB0Vmlldy5zc3JJZDtcbn1cblxuLyoqXG4gKiBEZXNjcmliZXMgYSBjb250ZXh0IGF2YWlsYWJsZSBkdXJpbmcgdGhlIHNlcmlhbGl6YXRpb25cbiAqIHByb2Nlc3MuIFRoZSBjb250ZXh0IGlzIHVzZWQgdG8gc2hhcmUgYW5kIGNvbGxlY3QgaW5mb3JtYXRpb25cbiAqIGR1cmluZyB0aGUgc2VyaWFsaXphdGlvbi5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBIeWRyYXRpb25Db250ZXh0IHtcbiAgc2VyaWFsaXplZFZpZXdDb2xsZWN0aW9uOiBTZXJpYWxpemVkVmlld0NvbGxlY3Rpb247XG4gIGNvcnJ1cHRlZFRleHROb2RlczogTWFwPEhUTUxFbGVtZW50LCBUZXh0Tm9kZU1hcmtlcj47XG4gIGlzSTE4bkh5ZHJhdGlvbkVuYWJsZWQ6IGJvb2xlYW47XG4gIGkxOG5DaGlsZHJlbjogTWFwPFRWaWV3LCBTZXQ8bnVtYmVyPnxudWxsPjtcbn1cblxuLyoqXG4gKiBDb21wdXRlcyB0aGUgbnVtYmVyIG9mIHJvb3Qgbm9kZXMgaW4gYSBnaXZlbiB2aWV3XG4gKiAob3IgY2hpbGQgbm9kZXMgaW4gYSBnaXZlbiBjb250YWluZXIgaWYgYSB0Tm9kZSBpcyBwcm92aWRlZCkuXG4gKi9cbmZ1bmN0aW9uIGNhbGNOdW1Sb290Tm9kZXModFZpZXc6IFRWaWV3LCBsVmlldzogTFZpZXcsIHROb2RlOiBUTm9kZXxudWxsKTogbnVtYmVyIHtcbiAgY29uc3Qgcm9vdE5vZGVzOiB1bmtub3duW10gPSBbXTtcbiAgY29sbGVjdE5hdGl2ZU5vZGVzKHRWaWV3LCBsVmlldywgdE5vZGUsIHJvb3ROb2Rlcyk7XG4gIHJldHVybiByb290Tm9kZXMubGVuZ3RoO1xufVxuXG4vKipcbiAqIENvbXB1dGVzIHRoZSBudW1iZXIgb2Ygcm9vdCBub2RlcyBpbiBhbGwgdmlld3MgaW4gYSBnaXZlbiBMQ29udGFpbmVyLlxuICovXG5mdW5jdGlvbiBjYWxjTnVtUm9vdE5vZGVzSW5MQ29udGFpbmVyKGxDb250YWluZXI6IExDb250YWluZXIpOiBudW1iZXIge1xuICBjb25zdCByb290Tm9kZXM6IHVua25vd25bXSA9IFtdO1xuICBjb2xsZWN0TmF0aXZlTm9kZXNJbkxDb250YWluZXIobENvbnRhaW5lciwgcm9vdE5vZGVzKTtcbiAgcmV0dXJuIHJvb3ROb2Rlcy5sZW5ndGg7XG59XG5cblxuLyoqXG4gKiBBbm5vdGF0ZXMgcm9vdCBsZXZlbCBjb21wb25lbnQncyBMVmlldyBmb3IgaHlkcmF0aW9uLFxuICogc2VlIGBhbm5vdGF0ZUhvc3RFbGVtZW50Rm9ySHlkcmF0aW9uYCBmb3IgYWRkaXRpb25hbCBpbmZvcm1hdGlvbi5cbiAqL1xuZnVuY3Rpb24gYW5ub3RhdGVDb21wb25lbnRMVmlld0Zvckh5ZHJhdGlvbihsVmlldzogTFZpZXcsIGNvbnRleHQ6IEh5ZHJhdGlvbkNvbnRleHQpOiBudW1iZXJ8bnVsbCB7XG4gIGNvbnN0IGhvc3RFbGVtZW50ID0gbFZpZXdbSE9TVF07XG4gIC8vIFJvb3QgZWxlbWVudHMgbWlnaHQgYWxzbyBiZSBhbm5vdGF0ZWQgd2l0aCB0aGUgYG5nU2tpcEh5ZHJhdGlvbmAgYXR0cmlidXRlLFxuICAvLyBjaGVjayBpZiBpdCdzIHByZXNlbnQgYmVmb3JlIHN0YXJ0aW5nIHRoZSBzZXJpYWxpemF0aW9uIHByb2Nlc3MuXG4gIGlmIChob3N0RWxlbWVudCAmJiAhKGhvc3RFbGVtZW50IGFzIEhUTUxFbGVtZW50KS5oYXNBdHRyaWJ1dGUoU0tJUF9IWURSQVRJT05fQVRUUl9OQU1FKSkge1xuICAgIHJldHVybiBhbm5vdGF0ZUhvc3RFbGVtZW50Rm9ySHlkcmF0aW9uKGhvc3RFbGVtZW50IGFzIEhUTUxFbGVtZW50LCBsVmlldywgY29udGV4dCk7XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbi8qKlxuICogQW5ub3RhdGVzIHJvb3QgbGV2ZWwgTENvbnRhaW5lciBmb3IgaHlkcmF0aW9uLiBUaGlzIGhhcHBlbnMgd2hlbiBhIHJvb3QgY29tcG9uZW50XG4gKiBpbmplY3RzIFZpZXdDb250YWluZXJSZWYsIHRodXMgbWFraW5nIHRoZSBjb21wb25lbnQgYW4gYW5jaG9yIGZvciBhIHZpZXcgY29udGFpbmVyLlxuICogVGhpcyBmdW5jdGlvbiBzZXJpYWxpemVzIHRoZSBjb21wb25lbnQgaXRzZWxmIGFzIHdlbGwgYXMgYWxsIHZpZXdzIGZyb20gdGhlIHZpZXdcbiAqIGNvbnRhaW5lci5cbiAqL1xuZnVuY3Rpb24gYW5ub3RhdGVMQ29udGFpbmVyRm9ySHlkcmF0aW9uKGxDb250YWluZXI6IExDb250YWluZXIsIGNvbnRleHQ6IEh5ZHJhdGlvbkNvbnRleHQpIHtcbiAgY29uc3QgY29tcG9uZW50TFZpZXcgPSB1bndyYXBMVmlldyhsQ29udGFpbmVyW0hPU1RdKSBhcyBMVmlldzx1bmtub3duPjtcblxuICAvLyBTZXJpYWxpemUgdGhlIHJvb3QgY29tcG9uZW50IGl0c2VsZi5cbiAgY29uc3QgY29tcG9uZW50TFZpZXdOZ2hJbmRleCA9IGFubm90YXRlQ29tcG9uZW50TFZpZXdGb3JIeWRyYXRpb24oY29tcG9uZW50TFZpZXcsIGNvbnRleHQpO1xuXG4gIGNvbnN0IGhvc3RFbGVtZW50ID0gdW53cmFwUk5vZGUoY29tcG9uZW50TFZpZXdbSE9TVF0hKSBhcyBIVE1MRWxlbWVudDtcblxuICAvLyBTZXJpYWxpemUgYWxsIHZpZXdzIHdpdGhpbiB0aGlzIHZpZXcgY29udGFpbmVyLlxuICBjb25zdCByb290TFZpZXcgPSBsQ29udGFpbmVyW1BBUkVOVF07XG4gIGNvbnN0IHJvb3RMVmlld05naEluZGV4ID0gYW5ub3RhdGVIb3N0RWxlbWVudEZvckh5ZHJhdGlvbihob3N0RWxlbWVudCwgcm9vdExWaWV3LCBjb250ZXh0KTtcblxuICBjb25zdCByZW5kZXJlciA9IGNvbXBvbmVudExWaWV3W1JFTkRFUkVSXSBhcyBSZW5kZXJlcjI7XG5cbiAgLy8gRm9yIGNhc2VzIHdoZW4gYSByb290IGNvbXBvbmVudCBhbHNvIGFjdHMgYXMgYW4gYW5jaG9yIG5vZGUgZm9yIGEgVmlld0NvbnRhaW5lclJlZlxuICAvLyAoZm9yIGV4YW1wbGUsIHdoZW4gVmlld0NvbnRhaW5lclJlZiBpcyBpbmplY3RlZCBpbiBhIHJvb3QgY29tcG9uZW50KSwgdGhlcmUgaXMgYSBuZWVkXG4gIC8vIHRvIHNlcmlhbGl6ZSBpbmZvcm1hdGlvbiBhYm91dCB0aGUgY29tcG9uZW50IGl0c2VsZiwgYXMgd2VsbCBhcyBhbiBMQ29udGFpbmVyIHRoYXRcbiAgLy8gcmVwcmVzZW50cyB0aGlzIFZpZXdDb250YWluZXJSZWYuIEVmZmVjdGl2ZWx5LCB3ZSBuZWVkIHRvIHNlcmlhbGl6ZSAyIHBpZWNlcyBvZiBpbmZvOlxuICAvLyAoMSkgaHlkcmF0aW9uIGluZm8gZm9yIHRoZSByb290IGNvbXBvbmVudCBpdHNlbGYgYW5kICgyKSBoeWRyYXRpb24gaW5mbyBmb3IgdGhlXG4gIC8vIFZpZXdDb250YWluZXJSZWYgaW5zdGFuY2UgKGFuIExDb250YWluZXIpLiBFYWNoIHBpZWNlIG9mIGluZm9ybWF0aW9uIGlzIGluY2x1ZGVkIGludG9cbiAgLy8gdGhlIGh5ZHJhdGlvbiBkYXRhIChpbiB0aGUgVHJhbnNmZXJTdGF0ZSBvYmplY3QpIHNlcGFyYXRlbHksIHRodXMgd2UgZW5kIHVwIHdpdGggMiBpZHMuXG4gIC8vIFNpbmNlIHdlIG9ubHkgaGF2ZSAxIHJvb3QgZWxlbWVudCwgd2UgZW5jb2RlIGJvdGggYml0cyBvZiBpbmZvIGludG8gYSBzaW5nbGUgc3RyaW5nOlxuICAvLyBpZHMgYXJlIHNlcGFyYXRlZCBieSB0aGUgYHxgIGNoYXIgKGUuZy4gYDEwfDI1YCwgd2hlcmUgYDEwYCBpcyB0aGUgbmdoIGZvciBhIGNvbXBvbmVudCB2aWV3XG4gIC8vIGFuZCAyNSBpcyB0aGUgYG5naGAgZm9yIGEgcm9vdCB2aWV3IHdoaWNoIGhvbGRzIExDb250YWluZXIpLlxuICBjb25zdCBmaW5hbEluZGV4ID0gYCR7Y29tcG9uZW50TFZpZXdOZ2hJbmRleH18JHtyb290TFZpZXdOZ2hJbmRleH1gO1xuICByZW5kZXJlci5zZXRBdHRyaWJ1dGUoaG9zdEVsZW1lbnQsIE5HSF9BVFRSX05BTUUsIGZpbmFsSW5kZXgpO1xufVxuXG4vKipcbiAqIEFubm90YXRlcyBhbGwgY29tcG9uZW50cyBib290c3RyYXBwZWQgaW4gYSBnaXZlbiBBcHBsaWNhdGlvblJlZlxuICogd2l0aCBpbmZvIG5lZWRlZCBmb3IgaHlkcmF0aW9uLlxuICpcbiAqIEBwYXJhbSBhcHBSZWYgQW4gaW5zdGFuY2Ugb2YgYW4gQXBwbGljYXRpb25SZWYuXG4gKiBAcGFyYW0gZG9jIEEgcmVmZXJlbmNlIHRvIHRoZSBjdXJyZW50IERvY3VtZW50IGluc3RhbmNlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gYW5ub3RhdGVGb3JIeWRyYXRpb24oYXBwUmVmOiBBcHBsaWNhdGlvblJlZiwgZG9jOiBEb2N1bWVudCkge1xuICBjb25zdCBpbmplY3RvciA9IGFwcFJlZi5pbmplY3RvcjtcbiAgY29uc3QgaXNJMThuSHlkcmF0aW9uRW5hYmxlZFZhbCA9IGlzSTE4bkh5ZHJhdGlvbkVuYWJsZWQoaW5qZWN0b3IpO1xuXG4gIGNvbnN0IHNlcmlhbGl6ZWRWaWV3Q29sbGVjdGlvbiA9IG5ldyBTZXJpYWxpemVkVmlld0NvbGxlY3Rpb24oKTtcbiAgY29uc3QgY29ycnVwdGVkVGV4dE5vZGVzID0gbmV3IE1hcDxIVE1MRWxlbWVudCwgVGV4dE5vZGVNYXJrZXI+KCk7XG4gIGNvbnN0IHZpZXdSZWZzID0gYXBwUmVmLl92aWV3cztcbiAgZm9yIChjb25zdCB2aWV3UmVmIG9mIHZpZXdSZWZzKSB7XG4gICAgY29uc3QgbE5vZGUgPSBnZXRMTm9kZUZvckh5ZHJhdGlvbih2aWV3UmVmKTtcblxuICAgIC8vIEFuIGBsVmlld2AgbWlnaHQgYmUgYG51bGxgIGlmIGEgYFZpZXdSZWZgIHJlcHJlc2VudHNcbiAgICAvLyBhbiBlbWJlZGRlZCB2aWV3IChub3QgYSBjb21wb25lbnQgdmlldykuXG4gICAgaWYgKGxOb2RlICE9PSBudWxsKSB7XG4gICAgICBjb25zdCBjb250ZXh0OiBIeWRyYXRpb25Db250ZXh0ID0ge1xuICAgICAgICBzZXJpYWxpemVkVmlld0NvbGxlY3Rpb24sXG4gICAgICAgIGNvcnJ1cHRlZFRleHROb2RlcyxcbiAgICAgICAgaXNJMThuSHlkcmF0aW9uRW5hYmxlZDogaXNJMThuSHlkcmF0aW9uRW5hYmxlZFZhbCxcbiAgICAgICAgaTE4bkNoaWxkcmVuOiBuZXcgTWFwKCksXG4gICAgICB9O1xuICAgICAgaWYgKGlzTENvbnRhaW5lcihsTm9kZSkpIHtcbiAgICAgICAgYW5ub3RhdGVMQ29udGFpbmVyRm9ySHlkcmF0aW9uKGxOb2RlLCBjb250ZXh0KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGFubm90YXRlQ29tcG9uZW50TFZpZXdGb3JIeWRyYXRpb24obE5vZGUsIGNvbnRleHQpO1xuICAgICAgfVxuICAgICAgaW5zZXJ0Q29ycnVwdGVkVGV4dE5vZGVNYXJrZXJzKGNvcnJ1cHRlZFRleHROb2RlcywgZG9jKTtcbiAgICB9XG4gIH1cblxuICAvLyBOb3RlOiB3ZSAqYWx3YXlzKiBpbmNsdWRlIGh5ZHJhdGlvbiBpbmZvIGtleSBhbmQgYSBjb3JyZXNwb25kaW5nIHZhbHVlXG4gIC8vIGludG8gdGhlIFRyYW5zZmVyU3RhdGUsIGV2ZW4gaWYgdGhlIGxpc3Qgb2Ygc2VyaWFsaXplZCB2aWV3cyBpcyBlbXB0eS5cbiAgLy8gVGhpcyBpcyBuZWVkZWQgYXMgYSBzaWduYWwgdG8gdGhlIGNsaWVudCB0aGF0IHRoZSBzZXJ2ZXIgcGFydCBvZiB0aGVcbiAgLy8gaHlkcmF0aW9uIGxvZ2ljIHdhcyBzZXR1cCBhbmQgZW5hYmxlZCBjb3JyZWN0bHkuIE90aGVyd2lzZSwgaWYgYSBjbGllbnRcbiAgLy8gaHlkcmF0aW9uIGRvZXNuJ3QgZmluZCBhIGtleSBpbiB0aGUgdHJhbnNmZXIgc3RhdGUgLSBhbiBlcnJvciBpcyBwcm9kdWNlZC5cbiAgY29uc3Qgc2VyaWFsaXplZFZpZXdzID0gc2VyaWFsaXplZFZpZXdDb2xsZWN0aW9uLmdldEFsbCgpO1xuICBjb25zdCB0cmFuc2ZlclN0YXRlID0gaW5qZWN0b3IuZ2V0KFRyYW5zZmVyU3RhdGUpO1xuICB0cmFuc2ZlclN0YXRlLnNldChOR0hfREFUQV9LRVksIHNlcmlhbGl6ZWRWaWV3cyk7XG59XG5cbi8qKlxuICogU2VyaWFsaXplcyB0aGUgbENvbnRhaW5lciBkYXRhIGludG8gYSBsaXN0IG9mIFNlcmlhbGl6ZWRWaWV3IG9iamVjdHMsXG4gKiB0aGF0IHJlcHJlc2VudCB2aWV3cyB3aXRoaW4gdGhpcyBsQ29udGFpbmVyLlxuICpcbiAqIEBwYXJhbSBsQ29udGFpbmVyIHRoZSBsQ29udGFpbmVyIHdlIGFyZSBzZXJpYWxpemluZ1xuICogQHBhcmFtIGNvbnRleHQgdGhlIGh5ZHJhdGlvbiBjb250ZXh0XG4gKiBAcmV0dXJucyBhbiBhcnJheSBvZiB0aGUgYFNlcmlhbGl6ZWRWaWV3YCBvYmplY3RzXG4gKi9cbmZ1bmN0aW9uIHNlcmlhbGl6ZUxDb250YWluZXIoXG4gICAgbENvbnRhaW5lcjogTENvbnRhaW5lciwgY29udGV4dDogSHlkcmF0aW9uQ29udGV4dCk6IFNlcmlhbGl6ZWRDb250YWluZXJWaWV3W10ge1xuICBjb25zdCB2aWV3czogU2VyaWFsaXplZENvbnRhaW5lclZpZXdbXSA9IFtdO1xuICBsZXQgbGFzdFZpZXdBc1N0cmluZyA9ICcnO1xuXG4gIGZvciAobGV0IGkgPSBDT05UQUlORVJfSEVBREVSX09GRlNFVDsgaSA8IGxDb250YWluZXIubGVuZ3RoOyBpKyspIHtcbiAgICBsZXQgY2hpbGRMVmlldyA9IGxDb250YWluZXJbaV0gYXMgTFZpZXc7XG5cbiAgICBsZXQgdGVtcGxhdGU6IHN0cmluZztcbiAgICBsZXQgbnVtUm9vdE5vZGVzOiBudW1iZXI7XG4gICAgbGV0IHNlcmlhbGl6ZWRWaWV3OiBTZXJpYWxpemVkQ29udGFpbmVyVmlld3x1bmRlZmluZWQ7XG5cbiAgICBpZiAoaXNSb290VmlldyhjaGlsZExWaWV3KSkge1xuICAgICAgLy8gSWYgdGhpcyBpcyBhIHJvb3QgdmlldywgZ2V0IGFuIExWaWV3IGZvciB0aGUgdW5kZXJseWluZyBjb21wb25lbnQsXG4gICAgICAvLyBiZWNhdXNlIGl0IGNvbnRhaW5zIGluZm9ybWF0aW9uIGFib3V0IHRoZSB2aWV3IHRvIHNlcmlhbGl6ZS5cbiAgICAgIGNoaWxkTFZpZXcgPSBjaGlsZExWaWV3W0hFQURFUl9PRkZTRVRdO1xuXG4gICAgICAvLyBJZiB3ZSBoYXZlIGFuIExDb250YWluZXIgYXQgdGhpcyBwb3NpdGlvbiwgdGhpcyBpbmRpY2F0ZXMgdGhhdCB0aGVcbiAgICAgIC8vIGhvc3QgZWxlbWVudCB3YXMgdXNlZCBhcyBhIFZpZXdDb250YWluZXJSZWYgYW5jaG9yIChlLmcuIGEgYFZpZXdDb250YWluZXJSZWZgXG4gICAgICAvLyB3YXMgaW5qZWN0ZWQgd2l0aGluIHRoZSBjb21wb25lbnQgY2xhc3MpLiBUaGlzIGNhc2UgcmVxdWlyZXMgc3BlY2lhbCBoYW5kbGluZy5cbiAgICAgIGlmIChpc0xDb250YWluZXIoY2hpbGRMVmlldykpIHtcbiAgICAgICAgLy8gQ2FsY3VsYXRlIHRoZSBudW1iZXIgb2Ygcm9vdCBub2RlcyBpbiBhbGwgdmlld3MgaW4gYSBnaXZlbiBjb250YWluZXJcbiAgICAgICAgLy8gYW5kIGluY3JlbWVudCBieSBvbmUgdG8gYWNjb3VudCBmb3IgYW4gYW5jaG9yIG5vZGUgaXRzZWxmLCBpLmUuIGluIHRoaXNcbiAgICAgICAgLy8gc2NlbmFyaW8gd2UnbGwgaGF2ZSBhIGxheW91dCB0aGF0IHdvdWxkIGxvb2sgbGlrZSB0aGlzOlxuICAgICAgICAvLyBgPGFwcC1yb290IC8+PCNWSUVXMT48I1ZJRVcyPi4uLjwhLS1jb250YWluZXItLT5gXG4gICAgICAgIC8vIFRoZSBgKzFgIGlzIHRvIGNhcHR1cmUgdGhlIGA8YXBwLXJvb3QgLz5gIGVsZW1lbnQuXG4gICAgICAgIG51bVJvb3ROb2RlcyA9IGNhbGNOdW1Sb290Tm9kZXNJbkxDb250YWluZXIoY2hpbGRMVmlldykgKyAxO1xuXG4gICAgICAgIGFubm90YXRlTENvbnRhaW5lckZvckh5ZHJhdGlvbihjaGlsZExWaWV3LCBjb250ZXh0KTtcblxuICAgICAgICBjb25zdCBjb21wb25lbnRMVmlldyA9IHVud3JhcExWaWV3KGNoaWxkTFZpZXdbSE9TVF0pIGFzIExWaWV3PHVua25vd24+O1xuXG4gICAgICAgIHNlcmlhbGl6ZWRWaWV3ID0ge1xuICAgICAgICAgIFtURU1QTEFURV9JRF06IGNvbXBvbmVudExWaWV3W1RWSUVXXS5zc3JJZCEsXG4gICAgICAgICAgW05VTV9ST09UX05PREVTXTogbnVtUm9vdE5vZGVzLFxuICAgICAgICB9O1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmICghc2VyaWFsaXplZFZpZXcpIHtcbiAgICAgIGNvbnN0IGNoaWxkVFZpZXcgPSBjaGlsZExWaWV3W1RWSUVXXTtcblxuICAgICAgaWYgKGNoaWxkVFZpZXcudHlwZSA9PT0gVFZpZXdUeXBlLkNvbXBvbmVudCkge1xuICAgICAgICB0ZW1wbGF0ZSA9IGNoaWxkVFZpZXcuc3NySWQhO1xuXG4gICAgICAgIC8vIFRoaXMgaXMgYSBjb21wb25lbnQgdmlldywgdGh1cyBpdCBoYXMgb25seSAxIHJvb3Qgbm9kZTogdGhlIGNvbXBvbmVudFxuICAgICAgICAvLyBob3N0IG5vZGUgaXRzZWxmIChvdGhlciBub2RlcyB3b3VsZCBiZSBpbnNpZGUgdGhhdCBob3N0IG5vZGUpLlxuICAgICAgICBudW1Sb290Tm9kZXMgPSAxO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGVtcGxhdGUgPSBnZXRTc3JJZChjaGlsZFRWaWV3KTtcbiAgICAgICAgbnVtUm9vdE5vZGVzID0gY2FsY051bVJvb3ROb2RlcyhjaGlsZFRWaWV3LCBjaGlsZExWaWV3LCBjaGlsZFRWaWV3LmZpcnN0Q2hpbGQpO1xuICAgICAgfVxuXG4gICAgICBzZXJpYWxpemVkVmlldyA9IHtcbiAgICAgICAgW1RFTVBMQVRFX0lEXTogdGVtcGxhdGUsXG4gICAgICAgIFtOVU1fUk9PVF9OT0RFU106IG51bVJvb3ROb2RlcyxcbiAgICAgICAgLi4uc2VyaWFsaXplTFZpZXcobENvbnRhaW5lcltpXSBhcyBMVmlldywgY29udGV4dCksXG4gICAgICB9O1xuICAgIH1cblxuICAgIC8vIENoZWNrIGlmIHRoZSBwcmV2aW91cyB2aWV3IGhhcyB0aGUgc2FtZSBzaGFwZSAoZm9yIGV4YW1wbGUsIGl0IHdhc1xuICAgIC8vIHByb2R1Y2VkIGJ5IHRoZSAqbmdGb3IpLCBpbiB3aGljaCBjYXNlIGJ1bXAgdGhlIGNvdW50ZXIgb24gdGhlIHByZXZpb3VzXG4gICAgLy8gdmlldyBpbnN0ZWFkIG9mIGluY2x1ZGluZyB0aGUgc2FtZSBpbmZvcm1hdGlvbiBhZ2Fpbi5cbiAgICBjb25zdCBjdXJyZW50Vmlld0FzU3RyaW5nID0gSlNPTi5zdHJpbmdpZnkoc2VyaWFsaXplZFZpZXcpO1xuICAgIGlmICh2aWV3cy5sZW5ndGggPiAwICYmIGN1cnJlbnRWaWV3QXNTdHJpbmcgPT09IGxhc3RWaWV3QXNTdHJpbmcpIHtcbiAgICAgIGNvbnN0IHByZXZpb3VzVmlldyA9IHZpZXdzW3ZpZXdzLmxlbmd0aCAtIDFdO1xuICAgICAgcHJldmlvdXNWaWV3W01VTFRJUExJRVJdID8/PSAxO1xuICAgICAgcHJldmlvdXNWaWV3W01VTFRJUExJRVJdKys7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIFJlY29yZCB0aGlzIHZpZXcgYXMgbW9zdCByZWNlbnRseSBhZGRlZC5cbiAgICAgIGxhc3RWaWV3QXNTdHJpbmcgPSBjdXJyZW50Vmlld0FzU3RyaW5nO1xuICAgICAgdmlld3MucHVzaChzZXJpYWxpemVkVmlldyk7XG4gICAgfVxuICB9XG4gIHJldHVybiB2aWV3cztcbn1cblxuLyoqXG4gKiBIZWxwZXIgZnVuY3Rpb24gdG8gcHJvZHVjZSBhIG5vZGUgcGF0aCAod2hpY2ggbmF2aWdhdGlvbiBzdGVwcyBydW50aW1lIGxvZ2ljXG4gKiBuZWVkcyB0byB0YWtlIHRvIGxvY2F0ZSBhIG5vZGUpIGFuZCBzdG9yZXMgaXQgaW4gdGhlIGBOT0RFU2Agc2VjdGlvbiBvZiB0aGVcbiAqIGN1cnJlbnQgc2VyaWFsaXplZCB2aWV3LlxuICovXG5mdW5jdGlvbiBhcHBlbmRTZXJpYWxpemVkTm9kZVBhdGgoXG4gICAgbmdoOiBTZXJpYWxpemVkVmlldywgdE5vZGU6IFROb2RlLCBsVmlldzogTFZpZXcsIGV4Y2x1ZGVkUGFyZW50Tm9kZXM6IFNldDxudW1iZXI+fG51bGwpIHtcbiAgY29uc3Qgbm9PZmZzZXRJbmRleCA9IHROb2RlLmluZGV4IC0gSEVBREVSX09GRlNFVDtcbiAgbmdoW05PREVTXSA/Pz0ge307XG4gIG5naFtOT0RFU11bbm9PZmZzZXRJbmRleF0gPSBjYWxjUGF0aEZvck5vZGUodE5vZGUsIGxWaWV3LCBleGNsdWRlZFBhcmVudE5vZGVzKTtcbn1cblxuLyoqXG4gKiBIZWxwZXIgZnVuY3Rpb24gdG8gYXBwZW5kIGluZm9ybWF0aW9uIGFib3V0IGEgZGlzY29ubmVjdGVkIG5vZGUuXG4gKiBUaGlzIGluZm8gaXMgbmVlZGVkIGF0IHJ1bnRpbWUgdG8gYXZvaWQgRE9NIGxvb2t1cHMgZm9yIHRoaXMgZWxlbWVudFxuICogYW5kIGluc3RlYWQsIHRoZSBlbGVtZW50IHdvdWxkIGJlIGNyZWF0ZWQgZnJvbSBzY3JhdGNoLlxuICovXG5mdW5jdGlvbiBhcHBlbmREaXNjb25uZWN0ZWROb2RlSW5kZXgobmdoOiBTZXJpYWxpemVkVmlldywgdE5vZGU6IFROb2RlKSB7XG4gIGNvbnN0IG5vT2Zmc2V0SW5kZXggPSB0Tm9kZS5pbmRleCAtIEhFQURFUl9PRkZTRVQ7XG4gIG5naFtESVNDT05ORUNURURfTk9ERVNdID8/PSBbXTtcbiAgaWYgKCFuZ2hbRElTQ09OTkVDVEVEX05PREVTXS5pbmNsdWRlcyhub09mZnNldEluZGV4KSkge1xuICAgIG5naFtESVNDT05ORUNURURfTk9ERVNdLnB1c2gobm9PZmZzZXRJbmRleCk7XG4gIH1cbn1cblxuLyoqXG4gKiBTZXJpYWxpemVzIHRoZSBsVmlldyBkYXRhIGludG8gYSBTZXJpYWxpemVkVmlldyBvYmplY3QgdGhhdCB3aWxsIGxhdGVyIGJlIGFkZGVkXG4gKiB0byB0aGUgVHJhbnNmZXJTdGF0ZSBzdG9yYWdlIGFuZCByZWZlcmVuY2VkIHVzaW5nIHRoZSBgbmdoYCBhdHRyaWJ1dGUgb24gYSBob3N0XG4gKiBlbGVtZW50LlxuICpcbiAqIEBwYXJhbSBsVmlldyB0aGUgbFZpZXcgd2UgYXJlIHNlcmlhbGl6aW5nXG4gKiBAcGFyYW0gY29udGV4dCB0aGUgaHlkcmF0aW9uIGNvbnRleHRcbiAqIEByZXR1cm5zIHRoZSBgU2VyaWFsaXplZFZpZXdgIG9iamVjdCBjb250YWluaW5nIHRoZSBkYXRhIHRvIGJlIGFkZGVkIHRvIHRoZSBob3N0IG5vZGVcbiAqL1xuZnVuY3Rpb24gc2VyaWFsaXplTFZpZXcobFZpZXc6IExWaWV3LCBjb250ZXh0OiBIeWRyYXRpb25Db250ZXh0KTogU2VyaWFsaXplZFZpZXcge1xuICBjb25zdCBuZ2g6IFNlcmlhbGl6ZWRWaWV3ID0ge307XG4gIGNvbnN0IHRWaWV3ID0gbFZpZXdbVFZJRVddO1xuICBjb25zdCBpMThuQ2hpbGRyZW4gPSBnZXRPckNvbXB1dGVJMThuQ2hpbGRyZW4odFZpZXcsIGNvbnRleHQpO1xuICAvLyBJdGVyYXRlIG92ZXIgRE9NIGVsZW1lbnQgcmVmZXJlbmNlcyBpbiBhbiBMVmlldy5cbiAgZm9yIChsZXQgaSA9IEhFQURFUl9PRkZTRVQ7IGkgPCB0Vmlldy5iaW5kaW5nU3RhcnRJbmRleDsgaSsrKSB7XG4gICAgY29uc3QgdE5vZGUgPSB0Vmlldy5kYXRhW2ldIGFzIFROb2RlO1xuICAgIGNvbnN0IG5vT2Zmc2V0SW5kZXggPSBpIC0gSEVBREVSX09GRlNFVDtcblxuICAgIC8vIEF0dGVtcHQgdG8gc2VyaWFsaXplIGFueSBpMThuIGRhdGEgZm9yIHRoZSBnaXZlbiBzbG90LiBXZSBkbyB0aGlzIGZpcnN0LCBhcyBpMThuXG4gICAgLy8gaGFzIGl0cyBvd24gcHJvY2VzcyBmb3Igc2VyaWFsaXphdGlvbi5cbiAgICBjb25zdCBpMThuRGF0YSA9IHRyeVNlcmlhbGl6ZUkxOG5CbG9jayhsVmlldywgaSwgY29udGV4dCk7XG4gICAgaWYgKGkxOG5EYXRhKSB7XG4gICAgICBuZ2hbSTE4Tl9EQVRBXSA/Pz0ge307XG4gICAgICBuZ2hbSTE4Tl9EQVRBXVtub09mZnNldEluZGV4XSA9IGkxOG5EYXRhO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgLy8gU2tpcCBwcm9jZXNzaW5nIG9mIGEgZ2l2ZW4gc2xvdCBpbiB0aGUgZm9sbG93aW5nIGNhc2VzOlxuICAgIC8vIC0gTG9jYWwgcmVmcyAoZS5nLiA8ZGl2ICNsb2NhbFJlZj4pIHRha2UgdXAgYW4gZXh0cmEgc2xvdCBpbiBMVmlld3NcbiAgICAvLyAgIHRvIHN0b3JlIHRoZSBzYW1lIGVsZW1lbnQuIEluIHRoaXMgY2FzZSwgdGhlcmUgaXMgbm8gaW5mb3JtYXRpb24gaW5cbiAgICAvLyAgIGEgY29ycmVzcG9uZGluZyBzbG90IGluIFROb2RlIGRhdGEgc3RydWN0dXJlLlxuICAgIC8vIC0gV2hlbiBhIHNsb3QgY29udGFpbnMgc29tZXRoaW5nIG90aGVyIHRoYW4gYSBUTm9kZS4gRm9yIGV4YW1wbGUsIHRoZXJlXG4gICAgLy8gICBtaWdodCBiZSBzb21lIG1ldGFkYXRhIGluZm9ybWF0aW9uIGFib3V0IGEgZGVmZXIgYmxvY2sgb3IgYSBjb250cm9sIGZsb3cgYmxvY2suXG4gICAgaWYgKCFpc1ROb2RlU2hhcGUodE5vZGUpKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICAvLyBTa2lwIGFueSBub2RlcyB0aGF0IGFyZSBpbiBhbiBpMThuIGJsb2NrIGJ1dCBhcmUgY29uc2lkZXJlZCBkZXRhY2hlZCAoaS5lLiBub3RcbiAgICAvLyBwcmVzZW50IGluIHRoZSB0ZW1wbGF0ZSkuIFRoZXNlIG5vZGVzIGFyZSBkaXNjb25uZWN0ZWQgZnJvbSB0aGUgRE9NIHRyZWUsIGFuZFxuICAgIC8vIHNvIHdlIGRvbid0IHdhbnQgdG8gc2VyaWFsaXplIGFueSBpbmZvcm1hdGlvbiBhYm91dCB0aGVtLlxuICAgIGlmIChpc0RldGFjaGVkQnlJMThuKHROb2RlKSkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgLy8gQ2hlY2sgaWYgYSBuYXRpdmUgbm9kZSB0aGF0IHJlcHJlc2VudHMgYSBnaXZlbiBUTm9kZSBpcyBkaXNjb25uZWN0ZWQgZnJvbSB0aGUgRE9NIHRyZWUuXG4gICAgLy8gU3VjaCBub2RlcyBtdXN0IGJlIGV4Y2x1ZGVkIGZyb20gdGhlIGh5ZHJhdGlvbiAoc2luY2UgdGhlIGh5ZHJhdGlvbiB3b24ndCBiZSBhYmxlIHRvXG4gICAgLy8gZmluZCB0aGVtKSwgc28gdGhlIFROb2RlIGlkcyBhcmUgY29sbGVjdGVkIGFuZCB1c2VkIGF0IHJ1bnRpbWUgdG8gc2tpcCB0aGUgaHlkcmF0aW9uLlxuICAgIC8vXG4gICAgLy8gVGhpcyBzaXR1YXRpb24gbWF5IGhhcHBlbiBkdXJpbmcgdGhlIGNvbnRlbnQgcHJvamVjdGlvbiwgd2hlbiBzb21lIG5vZGVzIGRvbid0IG1ha2UgaXRcbiAgICAvLyBpbnRvIG9uZSBvZiB0aGUgY29udGVudCBwcm9qZWN0aW9uIHNsb3RzIChmb3IgZXhhbXBsZSwgd2hlbiB0aGVyZSBpcyBubyBkZWZhdWx0XG4gICAgLy8gPG5nLWNvbnRlbnQgLz4gc2xvdCBpbiBwcm9qZWN0b3IgY29tcG9uZW50J3MgdGVtcGxhdGUpLlxuICAgIGlmIChpc0Rpc2Nvbm5lY3RlZE5vZGUodE5vZGUsIGxWaWV3KSAmJiBpc0NvbnRlbnRQcm9qZWN0ZWROb2RlKHROb2RlKSkge1xuICAgICAgYXBwZW5kRGlzY29ubmVjdGVkTm9kZUluZGV4KG5naCwgdE5vZGUpO1xuICAgICAgY29udGludWU7XG4gICAgfVxuICAgIGlmIChBcnJheS5pc0FycmF5KHROb2RlLnByb2plY3Rpb24pKSB7XG4gICAgICBmb3IgKGNvbnN0IHByb2plY3Rpb25IZWFkVE5vZGUgb2YgdE5vZGUucHJvamVjdGlvbikge1xuICAgICAgICAvLyBXZSBtYXkgaGF2ZSBgbnVsbGBzIGluIHNsb3RzIHdpdGggbm8gcHJvamVjdGVkIGNvbnRlbnQuXG4gICAgICAgIGlmICghcHJvamVjdGlvbkhlYWRUTm9kZSkgY29udGludWU7XG5cbiAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KHByb2plY3Rpb25IZWFkVE5vZGUpKSB7XG4gICAgICAgICAgLy8gSWYgd2UgcHJvY2VzcyByZS1wcm9qZWN0ZWQgY29udGVudCAoaS5lLiBgPG5nLWNvbnRlbnQ+YFxuICAgICAgICAgIC8vIGFwcGVhcnMgYXQgcHJvamVjdGlvbiBsb2NhdGlvbiksIHNraXAgYW5ub3RhdGlvbnMgZm9yIHRoaXMgY29udGVudFxuICAgICAgICAgIC8vIHNpbmNlIGFsbCBET00gbm9kZXMgaW4gdGhpcyBwcm9qZWN0aW9uIHdlcmUgaGFuZGxlZCB3aGlsZSBwcm9jZXNzaW5nXG4gICAgICAgICAgLy8gYSBwYXJlbnQgbFZpZXcsIHdoaWNoIGNvbnRhaW5zIHRob3NlIG5vZGVzLlxuICAgICAgICAgIGlmICghaXNQcm9qZWN0aW9uVE5vZGUocHJvamVjdGlvbkhlYWRUTm9kZSkgJiZcbiAgICAgICAgICAgICAgIWlzSW5Ta2lwSHlkcmF0aW9uQmxvY2socHJvamVjdGlvbkhlYWRUTm9kZSkpIHtcbiAgICAgICAgICAgIGlmIChpc0Rpc2Nvbm5lY3RlZE5vZGUocHJvamVjdGlvbkhlYWRUTm9kZSwgbFZpZXcpKSB7XG4gICAgICAgICAgICAgIC8vIENoZWNrIHdoZXRoZXIgdGhpcyBub2RlIGlzIGNvbm5lY3RlZCwgc2luY2Ugd2UgbWF5IGhhdmUgYSBUTm9kZVxuICAgICAgICAgICAgICAvLyBpbiB0aGUgZGF0YSBzdHJ1Y3R1cmUgYXMgYSBwcm9qZWN0aW9uIHNlZ21lbnQgaGVhZCwgYnV0IHRoZVxuICAgICAgICAgICAgICAvLyBjb250ZW50IHByb2plY3Rpb24gc2xvdCBtaWdodCBiZSBkaXNhYmxlZCAoZS5nLlxuICAgICAgICAgICAgICAvLyA8bmctY29udGVudCAqbmdJZj1cImZhbHNlXCIgLz4pLlxuICAgICAgICAgICAgICBhcHBlbmREaXNjb25uZWN0ZWROb2RlSW5kZXgobmdoLCBwcm9qZWN0aW9uSGVhZFROb2RlKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGFwcGVuZFNlcmlhbGl6ZWROb2RlUGF0aChuZ2gsIHByb2plY3Rpb25IZWFkVE5vZGUsIGxWaWV3LCBpMThuQ2hpbGRyZW4pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBJZiBhIHZhbHVlIGlzIGFuIGFycmF5LCBpdCBtZWFucyB0aGF0IHdlIGFyZSBwcm9jZXNzaW5nIGEgcHJvamVjdGlvblxuICAgICAgICAgIC8vIHdoZXJlIHByb2plY3RhYmxlIG5vZGVzIHdlcmUgcGFzc2VkIGluIGFzIERPTSBub2RlcyAoZm9yIGV4YW1wbGUsIHdoZW5cbiAgICAgICAgICAvLyBjYWxsaW5nIGBWaWV3Q29udGFpbmVyUmVmLmNyZWF0ZUNvbXBvbmVudChDbXBBLCB7cHJvamVjdGFibGVOb2RlczogWy4uLl19KWApLlxuICAgICAgICAgIC8vXG4gICAgICAgICAgLy8gSW4gdGhpcyBzY2VuYXJpbywgbm9kZXMgY2FuIGNvbWUgZnJvbSBhbnl3aGVyZSAoZWl0aGVyIGNyZWF0ZWQgbWFudWFsbHksXG4gICAgICAgICAgLy8gYWNjZXNzZWQgdmlhIGBkb2N1bWVudC5xdWVyeVNlbGVjdG9yYCwgZXRjKSBhbmQgbWF5IGJlIGluIGFueSBzdGF0ZVxuICAgICAgICAgIC8vIChhdHRhY2hlZCBvciBkZXRhY2hlZCBmcm9tIHRoZSBET00gdHJlZSkuIEFzIGEgcmVzdWx0LCB3ZSBjYW4gbm90IHJlbGlhYmx5XG4gICAgICAgICAgLy8gcmVzdG9yZSB0aGUgc3RhdGUgZm9yIHN1Y2ggY2FzZXMgZHVyaW5nIGh5ZHJhdGlvbi5cblxuICAgICAgICAgIHRocm93IHVuc3VwcG9ydGVkUHJvamVjdGlvbk9mRG9tTm9kZXModW53cmFwUk5vZGUobFZpZXdbaV0pKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGNvbmRpdGlvbmFsbHlBbm5vdGF0ZU5vZGVQYXRoKG5naCwgdE5vZGUsIGxWaWV3LCBpMThuQ2hpbGRyZW4pO1xuXG4gICAgaWYgKGlzTENvbnRhaW5lcihsVmlld1tpXSkpIHtcbiAgICAgIC8vIFNlcmlhbGl6ZSBpbmZvcm1hdGlvbiBhYm91dCBhIHRlbXBsYXRlLlxuICAgICAgY29uc3QgZW1iZWRkZWRUVmlldyA9IHROb2RlLnRWaWV3O1xuICAgICAgaWYgKGVtYmVkZGVkVFZpZXcgIT09IG51bGwpIHtcbiAgICAgICAgbmdoW1RFTVBMQVRFU10gPz89IHt9O1xuICAgICAgICBuZ2hbVEVNUExBVEVTXVtub09mZnNldEluZGV4XSA9IGdldFNzcklkKGVtYmVkZGVkVFZpZXcpO1xuICAgICAgfVxuXG4gICAgICAvLyBTZXJpYWxpemUgdmlld3Mgd2l0aGluIHRoaXMgTENvbnRhaW5lci5cbiAgICAgIGNvbnN0IGhvc3ROb2RlID0gbFZpZXdbaV1bSE9TVF0hOyAgLy8gaG9zdCBub2RlIG9mIHRoaXMgY29udGFpbmVyXG5cbiAgICAgIC8vIExWaWV3W2ldW0hPU1RdIGNhbiBiZSBvZiAyIGRpZmZlcmVudCB0eXBlczpcbiAgICAgIC8vIC0gZWl0aGVyIGEgRE9NIG5vZGVcbiAgICAgIC8vIC0gb3IgYW4gYXJyYXkgdGhhdCByZXByZXNlbnRzIGFuIExWaWV3IG9mIGEgY29tcG9uZW50XG4gICAgICBpZiAoQXJyYXkuaXNBcnJheShob3N0Tm9kZSkpIHtcbiAgICAgICAgLy8gVGhpcyBpcyBhIGNvbXBvbmVudCwgc2VyaWFsaXplIGluZm8gYWJvdXQgaXQuXG4gICAgICAgIGNvbnN0IHRhcmdldE5vZGUgPSB1bndyYXBSTm9kZShob3N0Tm9kZSBhcyBMVmlldykgYXMgUkVsZW1lbnQ7XG4gICAgICAgIGlmICghKHRhcmdldE5vZGUgYXMgSFRNTEVsZW1lbnQpLmhhc0F0dHJpYnV0ZShTS0lQX0hZRFJBVElPTl9BVFRSX05BTUUpKSB7XG4gICAgICAgICAgYW5ub3RhdGVIb3N0RWxlbWVudEZvckh5ZHJhdGlvbih0YXJnZXROb2RlLCBob3N0Tm9kZSBhcyBMVmlldywgY29udGV4dCk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgbmdoW0NPTlRBSU5FUlNdID8/PSB7fTtcbiAgICAgIG5naFtDT05UQUlORVJTXVtub09mZnNldEluZGV4XSA9IHNlcmlhbGl6ZUxDb250YWluZXIobFZpZXdbaV0sIGNvbnRleHQpO1xuICAgIH0gZWxzZSBpZiAoQXJyYXkuaXNBcnJheShsVmlld1tpXSkpIHtcbiAgICAgIC8vIFRoaXMgaXMgYSBjb21wb25lbnQsIGFubm90YXRlIHRoZSBob3N0IG5vZGUgd2l0aCBhbiBgbmdoYCBhdHRyaWJ1dGUuXG4gICAgICBjb25zdCB0YXJnZXROb2RlID0gdW53cmFwUk5vZGUobFZpZXdbaV1bSE9TVF0hKTtcbiAgICAgIGlmICghKHRhcmdldE5vZGUgYXMgSFRNTEVsZW1lbnQpLmhhc0F0dHJpYnV0ZShTS0lQX0hZRFJBVElPTl9BVFRSX05BTUUpKSB7XG4gICAgICAgIGFubm90YXRlSG9zdEVsZW1lbnRGb3JIeWRyYXRpb24odGFyZ2V0Tm9kZSBhcyBSRWxlbWVudCwgbFZpZXdbaV0sIGNvbnRleHQpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAvLyA8bmctY29udGFpbmVyPiBjYXNlXG4gICAgICBpZiAodE5vZGUudHlwZSAmIFROb2RlVHlwZS5FbGVtZW50Q29udGFpbmVyKSB7XG4gICAgICAgIC8vIEFuIDxuZy1jb250YWluZXI+IGlzIHJlcHJlc2VudGVkIGJ5IHRoZSBudW1iZXIgb2ZcbiAgICAgICAgLy8gdG9wLWxldmVsIG5vZGVzLiBUaGlzIGluZm9ybWF0aW9uIGlzIG5lZWRlZCB0byBza2lwIG92ZXJcbiAgICAgICAgLy8gdGhvc2Ugbm9kZXMgdG8gcmVhY2ggYSBjb3JyZXNwb25kaW5nIGFuY2hvciBub2RlIChjb21tZW50IG5vZGUpLlxuICAgICAgICBuZ2hbRUxFTUVOVF9DT05UQUlORVJTXSA/Pz0ge307XG4gICAgICAgIG5naFtFTEVNRU5UX0NPTlRBSU5FUlNdW25vT2Zmc2V0SW5kZXhdID0gY2FsY051bVJvb3ROb2Rlcyh0VmlldywgbFZpZXcsIHROb2RlLmNoaWxkKTtcbiAgICAgIH0gZWxzZSBpZiAodE5vZGUudHlwZSAmIFROb2RlVHlwZS5Qcm9qZWN0aW9uKSB7XG4gICAgICAgIC8vIEN1cnJlbnQgVE5vZGUgcmVwcmVzZW50cyBhbiBgPG5nLWNvbnRlbnQ+YCBzbG90LCB0aHVzIGl0IGhhcyBub1xuICAgICAgICAvLyBET00gZWxlbWVudHMgYXNzb2NpYXRlZCB3aXRoIGl0LCBzbyB0aGUgKipuZXh0IHNpYmxpbmcqKiBub2RlIHdvdWxkXG4gICAgICAgIC8vIG5vdCBiZSBhYmxlIHRvIGZpbmQgYW4gYW5jaG9yLiBJbiB0aGlzIGNhc2UsIHVzZSBmdWxsIHBhdGggaW5zdGVhZC5cbiAgICAgICAgbGV0IG5leHRUTm9kZSA9IHROb2RlLm5leHQ7XG4gICAgICAgIC8vIFNraXAgb3ZlciBhbGwgYDxuZy1jb250ZW50PmAgc2xvdHMgaW4gYSByb3cuXG4gICAgICAgIHdoaWxlIChuZXh0VE5vZGUgIT09IG51bGwgJiYgKG5leHRUTm9kZS50eXBlICYgVE5vZGVUeXBlLlByb2plY3Rpb24pKSB7XG4gICAgICAgICAgbmV4dFROb2RlID0gbmV4dFROb2RlLm5leHQ7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG5leHRUTm9kZSAmJiAhaXNJblNraXBIeWRyYXRpb25CbG9jayhuZXh0VE5vZGUpKSB7XG4gICAgICAgICAgLy8gSGFuZGxlIGEgdE5vZGUgYWZ0ZXIgdGhlIGA8bmctY29udGVudD5gIHNsb3QuXG4gICAgICAgICAgYXBwZW5kU2VyaWFsaXplZE5vZGVQYXRoKG5naCwgbmV4dFROb2RlLCBsVmlldywgaTE4bkNoaWxkcmVuKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKHROb2RlLnR5cGUgJiBUTm9kZVR5cGUuVGV4dCkge1xuICAgICAgICAgIGNvbnN0IHJOb2RlID0gdW53cmFwUk5vZGUobFZpZXdbaV0pO1xuICAgICAgICAgIHByb2Nlc3NUZXh0Tm9kZUJlZm9yZVNlcmlhbGl6YXRpb24oY29udGV4dCwgck5vZGUpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBuZ2g7XG59XG5cbi8qKlxuICogU2VyaWFsaXplcyBub2RlIGxvY2F0aW9uIGluIGNhc2VzIHdoZW4gaXQncyBuZWVkZWQsIHNwZWNpZmljYWxseTpcbiAqXG4gKiAgMS4gSWYgYHROb2RlLnByb2plY3Rpb25OZXh0YCBpcyBkaWZmZXJlbnQgZnJvbSBgdE5vZGUubmV4dGAgLSBpdCBtZWFucyB0aGF0XG4gKiAgICAgdGhlIG5leHQgYHROb2RlYCBhZnRlciBwcm9qZWN0aW9uIGlzIGRpZmZlcmVudCBmcm9tIHRoZSBvbmUgaW4gdGhlIG9yaWdpbmFsXG4gKiAgICAgdGVtcGxhdGUuIFNpbmNlIGh5ZHJhdGlvbiByZWxpZXMgb24gYHROb2RlLm5leHRgLCB0aGlzIHNlcmlhbGl6ZWQgaW5mb1xuICogICAgIGlzIHJlcXVpcmVkIHRvIGhlbHAgcnVudGltZSBjb2RlIGZpbmQgdGhlIG5vZGUgYXQgdGhlIGNvcnJlY3QgbG9jYXRpb24uXG4gKiAgMi4gSW4gY2VydGFpbiBjb250ZW50IHByb2plY3Rpb24tYmFzZWQgdXNlLWNhc2VzLCBpdCdzIHBvc3NpYmxlIHRoYXQgb25seVxuICogICAgIGEgY29udGVudCBvZiBhIHByb2plY3RlZCBlbGVtZW50IGlzIHJlbmRlcmVkLiBJbiB0aGlzIGNhc2UsIGNvbnRlbnQgbm9kZXNcbiAqICAgICByZXF1aXJlIGFuIGV4dHJhIGFubm90YXRpb24sIHNpbmNlIHJ1bnRpbWUgbG9naWMgY2FuJ3QgcmVseSBvbiBwYXJlbnQtY2hpbGRcbiAqICAgICBjb25uZWN0aW9uIHRvIGlkZW50aWZ5IHRoZSBsb2NhdGlvbiBvZiBhIG5vZGUuXG4gKi9cbmZ1bmN0aW9uIGNvbmRpdGlvbmFsbHlBbm5vdGF0ZU5vZGVQYXRoKFxuICAgIG5naDogU2VyaWFsaXplZFZpZXcsIHROb2RlOiBUTm9kZSwgbFZpZXc6IExWaWV3PHVua25vd24+LFxuICAgIGV4Y2x1ZGVkUGFyZW50Tm9kZXM6IFNldDxudW1iZXI+fG51bGwpIHtcbiAgLy8gSGFuZGxlIGNhc2UgIzEgZGVzY3JpYmVkIGFib3ZlLlxuICBpZiAodE5vZGUucHJvamVjdGlvbk5leHQgJiYgdE5vZGUucHJvamVjdGlvbk5leHQgIT09IHROb2RlLm5leHQgJiZcbiAgICAgICFpc0luU2tpcEh5ZHJhdGlvbkJsb2NrKHROb2RlLnByb2plY3Rpb25OZXh0KSkge1xuICAgIGFwcGVuZFNlcmlhbGl6ZWROb2RlUGF0aChuZ2gsIHROb2RlLnByb2plY3Rpb25OZXh0LCBsVmlldywgZXhjbHVkZWRQYXJlbnROb2Rlcyk7XG4gIH1cblxuICAvLyBIYW5kbGUgY2FzZSAjMiBkZXNjcmliZWQgYWJvdmUuXG4gIC8vIE5vdGU6IHdlIG9ubHkgZG8gdGhhdCBmb3IgdGhlIGZpcnN0IG5vZGUgKGkuZS4gd2hlbiBgdE5vZGUucHJldiA9PT0gbnVsbGApLFxuICAvLyB0aGUgcmVzdCBvZiB0aGUgbm9kZXMgd291bGQgcmVseSBvbiB0aGUgY3VycmVudCBub2RlIGxvY2F0aW9uLCBzbyBubyBleHRyYVxuICAvLyBhbm5vdGF0aW9uIGlzIG5lZWRlZC5cbiAgaWYgKHROb2RlLnByZXYgPT09IG51bGwgJiYgdE5vZGUucGFyZW50ICE9PSBudWxsICYmIGlzRGlzY29ubmVjdGVkTm9kZSh0Tm9kZS5wYXJlbnQsIGxWaWV3KSAmJlxuICAgICAgIWlzRGlzY29ubmVjdGVkTm9kZSh0Tm9kZSwgbFZpZXcpKSB7XG4gICAgYXBwZW5kU2VyaWFsaXplZE5vZGVQYXRoKG5naCwgdE5vZGUsIGxWaWV3LCBleGNsdWRlZFBhcmVudE5vZGVzKTtcbiAgfVxufVxuXG4vKipcbiAqIERldGVybWluZXMgd2hldGhlciBhIGNvbXBvbmVudCBpbnN0YW5jZSB0aGF0IGlzIHJlcHJlc2VudGVkXG4gKiBieSBhIGdpdmVuIExWaWV3IHVzZXMgYFZpZXdFbmNhcHN1bGF0aW9uLlNoYWRvd0RvbWAuXG4gKi9cbmZ1bmN0aW9uIGNvbXBvbmVudFVzZXNTaGFkb3dEb21FbmNhcHN1bGF0aW9uKGxWaWV3OiBMVmlldyk6IGJvb2xlYW4ge1xuICBjb25zdCBpbnN0YW5jZSA9IGxWaWV3W0NPTlRFWFRdO1xuICByZXR1cm4gaW5zdGFuY2U/LmNvbnN0cnVjdG9yID9cbiAgICAgIGdldENvbXBvbmVudERlZihpbnN0YW5jZS5jb25zdHJ1Y3Rvcik/LmVuY2Fwc3VsYXRpb24gPT09IFZpZXdFbmNhcHN1bGF0aW9uLlNoYWRvd0RvbSA6XG4gICAgICBmYWxzZTtcbn1cblxuLyoqXG4gKiBBbm5vdGF0ZXMgY29tcG9uZW50IGhvc3QgZWxlbWVudCBmb3IgaHlkcmF0aW9uOlxuICogLSBieSBlaXRoZXIgYWRkaW5nIHRoZSBgbmdoYCBhdHRyaWJ1dGUgYW5kIGNvbGxlY3RpbmcgaHlkcmF0aW9uLXJlbGF0ZWQgaW5mb1xuICogICBmb3IgdGhlIHNlcmlhbGl6YXRpb24gYW5kIHRyYW5zZmVycmluZyB0byB0aGUgY2xpZW50XG4gKiAtIG9yIGJ5IGFkZGluZyB0aGUgYG5nU2tpcEh5ZHJhdGlvbmAgYXR0cmlidXRlIGluIGNhc2UgQW5ndWxhciBkZXRlY3RzIHRoYXRcbiAqICAgY29tcG9uZW50IGNvbnRlbnRzIGlzIG5vdCBjb21wYXRpYmxlIHdpdGggaHlkcmF0aW9uLlxuICpcbiAqIEBwYXJhbSBlbGVtZW50IFRoZSBIb3N0IGVsZW1lbnQgdG8gYmUgYW5ub3RhdGVkXG4gKiBAcGFyYW0gbFZpZXcgVGhlIGFzc29jaWF0ZWQgTFZpZXdcbiAqIEBwYXJhbSBjb250ZXh0IFRoZSBoeWRyYXRpb24gY29udGV4dFxuICogQHJldHVybnMgQW4gaW5kZXggb2Ygc2VyaWFsaXplZCB2aWV3IGZyb20gdGhlIHRyYW5zZmVyIHN0YXRlIG9iamVjdFxuICogICAgICAgICAgb3IgYG51bGxgIHdoZW4gYSBnaXZlbiBjb21wb25lbnQgY2FuIG5vdCBiZSBzZXJpYWxpemVkLlxuICovXG5mdW5jdGlvbiBhbm5vdGF0ZUhvc3RFbGVtZW50Rm9ySHlkcmF0aW9uKFxuICAgIGVsZW1lbnQ6IFJFbGVtZW50LCBsVmlldzogTFZpZXcsIGNvbnRleHQ6IEh5ZHJhdGlvbkNvbnRleHQpOiBudW1iZXJ8bnVsbCB7XG4gIGNvbnN0IHJlbmRlcmVyID0gbFZpZXdbUkVOREVSRVJdO1xuICBpZiAoKGhhc0kxOG4obFZpZXcpICYmICFpc0kxOG5IeWRyYXRpb25TdXBwb3J0RW5hYmxlZCgpKSB8fFxuICAgICAgY29tcG9uZW50VXNlc1NoYWRvd0RvbUVuY2Fwc3VsYXRpb24obFZpZXcpKSB7XG4gICAgLy8gQXR0YWNoIHRoZSBza2lwIGh5ZHJhdGlvbiBhdHRyaWJ1dGUgaWYgdGhpcyBjb21wb25lbnQ6XG4gICAgLy8gLSBlaXRoZXIgaGFzIGkxOG4gYmxvY2tzLCBzaW5jZSBoeWRyYXRpbmcgc3VjaCBibG9ja3MgaXMgbm90IHlldCBzdXBwb3J0ZWRcbiAgICAvLyAtIG9yIHVzZXMgU2hhZG93RG9tIHZpZXcgZW5jYXBzdWxhdGlvbiwgc2luY2UgRG9taW5vIGRvZXNuJ3Qgc3VwcG9ydFxuICAgIC8vICAgc2hhZG93IERPTSwgc28gd2UgY2FuIG5vdCBndWFyYW50ZWUgdGhhdCBjbGllbnQgYW5kIHNlcnZlciByZXByZXNlbnRhdGlvbnNcbiAgICAvLyAgIHdvdWxkIGV4YWN0bHkgbWF0Y2hcbiAgICByZW5kZXJlci5zZXRBdHRyaWJ1dGUoZWxlbWVudCwgU0tJUF9IWURSQVRJT05fQVRUUl9OQU1FLCAnJyk7XG4gICAgcmV0dXJuIG51bGw7XG4gIH0gZWxzZSB7XG4gICAgY29uc3QgbmdoID0gc2VyaWFsaXplTFZpZXcobFZpZXcsIGNvbnRleHQpO1xuICAgIGNvbnN0IGluZGV4ID0gY29udGV4dC5zZXJpYWxpemVkVmlld0NvbGxlY3Rpb24uYWRkKG5naCk7XG4gICAgcmVuZGVyZXIuc2V0QXR0cmlidXRlKGVsZW1lbnQsIE5HSF9BVFRSX05BTUUsIGluZGV4LnRvU3RyaW5nKCkpO1xuICAgIHJldHVybiBpbmRleDtcbiAgfVxufVxuXG4vKipcbiAqIFBoeXNpY2FsbHkgaW5zZXJ0cyB0aGUgY29tbWVudCBub2RlcyB0byBlbnN1cmUgZW1wdHkgdGV4dCBub2RlcyBhbmQgYWRqYWNlbnRcbiAqIHRleHQgbm9kZSBzZXBhcmF0b3JzIGFyZSBwcmVzZXJ2ZWQgYWZ0ZXIgc2VydmVyIHNlcmlhbGl6YXRpb24gb2YgdGhlIERPTS5cbiAqIFRoZXNlIGdldCBzd2FwcGVkIGJhY2sgZm9yIGVtcHR5IHRleHQgbm9kZXMgb3Igc2VwYXJhdG9ycyBvbmNlIGh5ZHJhdGlvbiBoYXBwZW5zXG4gKiBvbiB0aGUgY2xpZW50LlxuICpcbiAqIEBwYXJhbSBjb3JydXB0ZWRUZXh0Tm9kZXMgVGhlIE1hcCBvZiB0ZXh0IG5vZGVzIHRvIGJlIHJlcGxhY2VkIHdpdGggY29tbWVudHNcbiAqIEBwYXJhbSBkb2MgVGhlIGRvY3VtZW50XG4gKi9cbmZ1bmN0aW9uIGluc2VydENvcnJ1cHRlZFRleHROb2RlTWFya2VycyhcbiAgICBjb3JydXB0ZWRUZXh0Tm9kZXM6IE1hcDxIVE1MRWxlbWVudCwgc3RyaW5nPiwgZG9jOiBEb2N1bWVudCkge1xuICBmb3IgKGNvbnN0IFt0ZXh0Tm9kZSwgbWFya2VyXSBvZiBjb3JydXB0ZWRUZXh0Tm9kZXMpIHtcbiAgICB0ZXh0Tm9kZS5hZnRlcihkb2MuY3JlYXRlQ29tbWVudChtYXJrZXIpKTtcbiAgfVxufVxuXG4vKipcbiAqIERldGVjdHMgd2hldGhlciBhIGdpdmVuIFROb2RlIHJlcHJlc2VudHMgYSBub2RlIHRoYXRcbiAqIGlzIGJlaW5nIGNvbnRlbnQgcHJvamVjdGVkLlxuICovXG5mdW5jdGlvbiBpc0NvbnRlbnRQcm9qZWN0ZWROb2RlKHROb2RlOiBUTm9kZSk6IGJvb2xlYW4ge1xuICBsZXQgY3VycmVudFROb2RlID0gdE5vZGU7XG4gIHdoaWxlIChjdXJyZW50VE5vZGUgIT0gbnVsbCkge1xuICAgIC8vIElmIHdlIGNvbWUgYWNyb3NzIGEgY29tcG9uZW50IGhvc3Qgbm9kZSBpbiBwYXJlbnQgbm9kZXMgLVxuICAgIC8vIHRoaXMgVE5vZGUgaXMgaW4gdGhlIGNvbnRlbnQgcHJvamVjdGlvbiBzZWN0aW9uLlxuICAgIGlmIChpc0NvbXBvbmVudEhvc3QoY3VycmVudFROb2RlKSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIGN1cnJlbnRUTm9kZSA9IGN1cnJlbnRUTm9kZS5wYXJlbnQgYXMgVE5vZGU7XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuIl19