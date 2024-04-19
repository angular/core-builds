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
import { collectDomEventsInfo, EVENT_REPLAY_ENABLED_DEFAULT, setJSActionAttribute } from './event_replay';
import { getOrComputeI18nChildren, isI18nHydrationEnabled, isI18nHydrationSupportEnabled, trySerializeI18nBlock } from './i18n';
import { CONTAINERS, DISCONNECTED_NODES, ELEMENT_CONTAINERS, I18N_DATA, MULTIPLIER, NODES, NUM_ROOT_NODES, TEMPLATE_ID, TEMPLATES } from './interfaces';
import { calcPathForNode, isDisconnectedNode } from './node_lookup_utils';
import { isInSkipHydrationBlock, SKIP_HYDRATION_ATTR_NAME } from './skip_hydration';
import { IS_EVENT_REPLAY_ENABLED } from './tokens';
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
 * @return event types that need to be replayed
 */
export function annotateForHydration(appRef, doc) {
    const injector = appRef.injector;
    const isI18nHydrationEnabledVal = isI18nHydrationEnabled(injector);
    const serializedViewCollection = new SerializedViewCollection();
    const corruptedTextNodes = new Map();
    const viewRefs = appRef._views;
    const shouldReplayEvents = injector.get(IS_EVENT_REPLAY_ENABLED, EVENT_REPLAY_ENABLED_DEFAULT);
    const eventTypesToReplay = new Set();
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
                eventTypesToReplay,
                shouldReplayEvents,
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
    return eventTypesToReplay.size > 0 ? eventTypesToReplay : undefined;
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
    const nativeElementsToEventTypes = context.shouldReplayEvents ?
        collectDomEventsInfo(tView, lView, context.eventTypesToReplay) :
        null;
    // Iterate over DOM element references in an LView.
    for (let i = HEADER_OFFSET; i < tView.bindingStartIndex; i++) {
        const tNode = tView.data[i];
        const noOffsetIndex = i - HEADER_OFFSET;
        if (nativeElementsToEventTypes) {
            setJSActionAttribute(tNode, lView[i], nativeElementsToEventTypes);
        }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYW5ub3RhdGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9oeWRyYXRpb24vYW5ub3RhdGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBSUgsT0FBTyxFQUFDLGdCQUFnQixFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQy9DLE9BQU8sRUFBQyxpQkFBaUIsRUFBQyxNQUFNLGFBQWEsQ0FBQztBQUU5QyxPQUFPLEVBQUMsa0JBQWtCLEVBQUUsOEJBQThCLEVBQUMsTUFBTSxpQ0FBaUMsQ0FBQztBQUNuRyxPQUFPLEVBQUMsZUFBZSxFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDdEQsT0FBTyxFQUFDLHVCQUF1QixFQUFhLE1BQU0saUNBQWlDLENBQUM7QUFDcEYsT0FBTyxFQUFDLFlBQVksRUFBbUIsTUFBTSw0QkFBNEIsQ0FBQztBQUUxRSxPQUFPLEVBQUMsT0FBTyxFQUFFLGVBQWUsRUFBRSxZQUFZLEVBQUUsaUJBQWlCLEVBQUUsVUFBVSxFQUFDLE1BQU0sbUNBQW1DLENBQUM7QUFDeEgsT0FBTyxFQUFDLE9BQU8sRUFBRSxhQUFhLEVBQUUsSUFBSSxFQUFTLE1BQU0sRUFBRSxRQUFRLEVBQVMsS0FBSyxFQUFZLE1BQU0sNEJBQTRCLENBQUM7QUFDMUgsT0FBTyxFQUFDLFdBQVcsRUFBRSxXQUFXLEVBQUMsTUFBTSw0QkFBNEIsQ0FBQztBQUNwRSxPQUFPLEVBQUMsYUFBYSxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFFaEQsT0FBTyxFQUFDLCtCQUErQixFQUFDLE1BQU0sa0JBQWtCLENBQUM7QUFDakUsT0FBTyxFQUFDLG9CQUFvQixFQUFFLDRCQUE0QixFQUFFLG9CQUFvQixFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFDeEcsT0FBTyxFQUFDLHdCQUF3QixFQUFFLHNCQUFzQixFQUFFLDZCQUE2QixFQUFFLHFCQUFxQixFQUFDLE1BQU0sUUFBUSxD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QUFDO1FBQzNDLE1BQU0sS0FBSyxHQUFHLE9BQU8sQ0FBQyx3QkFBd0IsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDeEQsUUFBUSxDQUFDLFlBQVksQ0FBQyxPQUFPLEVBQUUsYUFBYSxFQUFFLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1FBQ2hFLE9BQU8sS0FBSyxDQUFDO0lBQ2YsQ0FBQztBQUNILENBQUM7QUFFRDs7Ozs7Ozs7R0FRRztBQUNILFNBQVMsOEJBQThCLENBQ25DLGtCQUE0QyxFQUFFLEdBQWE7SUFDN0QsS0FBSyxNQUFNLENBQUMsUUFBUSxFQUFFLE1BQU0sQ0FBQyxJQUFJLGtCQUFrQixFQUFFLENBQUM7UUFDcEQsUUFBUSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7SUFDNUMsQ0FBQztBQUNILENBQUM7QUFFRDs7O0dBR0c7QUFDSCxTQUFTLHNCQUFzQixDQUFDLEtBQVk7SUFDMUMsSUFBSSxZQUFZLEdBQUcsS0FBSyxDQUFDO0lBQ3pCLE9BQU8sWUFBWSxJQUFJLElBQUksRUFBRSxDQUFDO1FBQzVCLDREQUE0RDtRQUM1RCxtREFBbUQ7UUFDbkQsSUFBSSxlQUFlLENBQUMsWUFBWSxDQUFDLEVBQUUsQ0FBQztZQUNsQyxPQUFPLElBQUksQ0FBQztRQUNkLENBQUM7UUFDRCxZQUFZLEdBQUcsWUFBWSxDQUFDLE1BQWUsQ0FBQztJQUM5QyxDQUFDO0lBQ0QsT0FBTyxLQUFLLENBQUM7QUFDZixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7QXBwbGljYXRpb25SZWZ9IGZyb20gJy4uL2FwcGxpY2F0aW9uL2FwcGxpY2F0aW9uX3JlZic7XG5pbXBvcnQge0FQUF9JRH0gZnJvbSAnLi4vYXBwbGljYXRpb24vYXBwbGljYXRpb25fdG9rZW5zJztcbmltcG9ydCB7aXNEZXRhY2hlZEJ5STE4bn0gZnJvbSAnLi4vaTE4bi91dGlscyc7XG5pbXBvcnQge1ZpZXdFbmNhcHN1bGF0aW9ufSBmcm9tICcuLi9tZXRhZGF0YSc7XG5pbXBvcnQge1JlbmRlcmVyMn0gZnJvbSAnLi4vcmVuZGVyJztcbmltcG9ydCB7Y29sbGVjdE5hdGl2ZU5vZGVzLCBjb2xsZWN0TmF0aXZlTm9kZXNJbkxDb250YWluZXJ9IGZyb20gJy4uL3JlbmRlcjMvY29sbGVjdF9uYXRpdmVfbm9kZXMnO1xuaW1wb3J0IHtnZXRDb21wb25lbnREZWZ9IGZyb20gJy4uL3JlbmRlcjMvZGVmaW5pdGlvbic7XG5pbXBvcnQge0NPTlRBSU5FUl9IRUFERVJfT0ZGU0VULCBMQ29udGFpbmVyfSBmcm9tICcuLi9yZW5kZXIzL2ludGVyZmFjZXMvY29udGFpbmVyJztcbmltcG9ydCB7aXNUTm9kZVNoYXBlLCBUTm9kZSwgVE5vZGVUeXBlfSBmcm9tICcuLi9yZW5kZXIzL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge1JFbGVtZW50fSBmcm9tICcuLi9yZW5kZXIzL2ludGVyZmFjZXMvcmVuZGVyZXJfZG9tJztcbmltcG9ydCB7aGFzSTE4biwgaXNDb21wb25lbnRIb3N0LCBpc0xDb250YWluZXIsIGlzUHJvamVjdGlvblROb2RlLCBpc1Jvb3RWaWV3fSBmcm9tICcuLi9yZW5kZXIzL2ludGVyZmFjZXMvdHlwZV9jaGVja3MnO1xuaW1wb3J0IHtDT05URVhULCBIRUFERVJfT0ZGU0VULCBIT1NULCBMVmlldywgUEFSRU5ULCBSRU5ERVJFUiwgVFZpZXcsIFRWSUVXLCBUVmlld1R5cGV9IGZyb20gJy4uL3JlbmRlcjMvaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7dW53cmFwTFZpZXcsIHVud3JhcFJOb2RlfSBmcm9tICcuLi9yZW5kZXIzL3V0aWwvdmlld191dGlscyc7XG5pbXBvcnQge1RyYW5zZmVyU3RhdGV9IGZyb20gJy4uL3RyYW5zZmVyX3N0YXRlJztcblxuaW1wb3J0IHt1bnN1cHBvcnRlZFByb2plY3Rpb25PZkRvbU5vZGVzfSBmcm9tICcuL2Vycm9yX2hhbmRsaW5nJztcbmltcG9ydCB7Y29sbGVjdERvbUV2ZW50c0luZm8sIEVWRU5UX1JFUExBWV9FTkFCTEVEX0RFRkFVTFQsIHNldEpTQWN0aW9uQXR0cmlidXRlfSBmcm9tICcuL2V2ZW50X3JlcGxheSc7XG5pbXBvcnQge2dldE9yQ29tcHV0ZUkxOG5DaGlsZHJlbiwgaXNJMThuSHlkcmF0aW9uRW5hYmxlZCwgaXNJMThuSHlkcmF0aW9uU3VwcG9ydEVuYWJsZWQsIHRyeVNlcmlhbGl6ZUkxOG5CbG9ja30gZnJvbSAnLi9pMThuJztcbmltcG9ydCB7Q09OVEFJTkVSUywgRElTQ09OTkVDVEVEX05PREVTLCBFTEVNRU5UX0NPTlRBSU5FUlMsIEkxOE5fREFUQSwgTVVMVElQTElFUiwgTk9ERVMsIE5VTV9ST09UX05PREVTLCBTZXJpYWxpemVkQ29udGFpbmVyVmlldywgU2VyaWFsaXplZFZpZXcsIFRFTVBMQVRFX0lELCBURU1QTEFURVN9IGZyb20gJy4vaW50ZXJmYWNlcyc7XG5pbXBvcnQge2NhbGNQYXRoRm9yTm9kZSwgaXNEaXNjb25uZWN0ZWROb2RlfSBmcm9tICcuL25vZGVfbG9va3VwX3V0aWxzJztcbmltcG9ydCB7aXNJblNraXBIeWRyYXRpb25CbG9jaywgU0tJUF9IWURSQVRJT05fQVRUUl9OQU1FfSBmcm9tICcuL3NraXBfaHlkcmF0aW9uJztcbmltcG9ydCB7SVNfRVZFTlRfUkVQTEFZX0VOQUJMRUR9IGZyb20gJy4vdG9rZW5zJztcbmltcG9ydCB7Z2V0TE5vZGVGb3JIeWRyYXRpb24sIE5HSF9BVFRSX05BTUUsIE5HSF9EQVRBX0tFWSwgcHJvY2Vzc1RleHROb2RlQmVmb3JlU2VyaWFsaXphdGlvbiwgVGV4dE5vZGVNYXJrZXJ9IGZyb20gJy4vdXRpbHMnO1xuXG5cbi8qKlxuICogQSBjb2xsZWN0aW9uIHRoYXQgdHJhY2tzIGFsbCBzZXJpYWxpemVkIHZpZXdzIChgbmdoYCBET00gYW5ub3RhdGlvbnMpXG4gKiB0byBhdm9pZCBkdXBsaWNhdGlvbi4gQW4gYXR0ZW1wdCB0byBhZGQgYSBkdXBsaWNhdGUgdmlldyByZXN1bHRzIGluIHRoZVxuICogY29sbGVjdGlvbiByZXR1cm5pbmcgdGhlIGluZGV4IG9mIHRoZSBwcmV2aW91c2x5IGNvbGxlY3RlZCBzZXJpYWxpemVkIHZpZXcuXG4gKiBUaGlzIHJlZHVjZXMgdGhlIG51bWJlciBvZiBhbm5vdGF0aW9ucyBuZWVkZWQgZm9yIGEgZ2l2ZW4gcGFnZS5cbiAqL1xuY2xhc3MgU2VyaWFsaXplZFZpZXdDb2xsZWN0aW9uIHtcbiAgcHJpdmF0ZSB2aWV3czogU2VyaWFsaXplZFZpZXdbXSA9IFtdO1xuICBwcml2YXRlIGluZGV4QnlDb250ZW50ID0gbmV3IE1hcDxzdHJpbmcsIG51bWJlcj4oKTtcblxuICBhZGQoc2VyaWFsaXplZFZpZXc6IFNlcmlhbGl6ZWRWaWV3KTogbnVtYmVyIHtcbiAgICBjb25zdCB2aWV3QXNTdHJpbmcgPSBKU09OLnN0cmluZ2lmeShzZXJpYWxpemVkVmlldyk7XG4gICAgaWYgKCF0aGlzLmluZGV4QnlDb250ZW50Lmhhcyh2aWV3QXNTdHJpbmcpKSB7XG4gICAgICBjb25zdCBpbmRleCA9IHRoaXMudmlld3MubGVuZ3RoO1xuICAgICAgdGhpcy52aWV3cy5wdXNoKHNlcmlhbGl6ZWRWaWV3KTtcbiAgICAgIHRoaXMuaW5kZXhCeUNvbnRlbnQuc2V0KHZpZXdBc1N0cmluZywgaW5kZXgpO1xuICAgICAgcmV0dXJuIGluZGV4O1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5pbmRleEJ5Q29udGVudC5nZXQodmlld0FzU3RyaW5nKSE7XG4gIH1cblxuICBnZXRBbGwoKTogU2VyaWFsaXplZFZpZXdbXSB7XG4gICAgcmV0dXJuIHRoaXMudmlld3M7XG4gIH1cbn1cblxuLyoqXG4gKiBHbG9iYWwgY291bnRlciB0aGF0IGlzIHVzZWQgdG8gZ2VuZXJhdGUgYSB1bmlxdWUgaWQgZm9yIFRWaWV3c1xuICogZHVyaW5nIHRoZSBzZXJpYWxpemF0aW9uIHByb2Nlc3MuXG4gKi9cbmxldCB0Vmlld1NzcklkID0gMDtcblxuLyoqXG4gKiBHZW5lcmF0ZXMgYSB1bmlxdWUgaWQgZm9yIGEgZ2l2ZW4gVFZpZXcgYW5kIHJldHVybnMgdGhpcyBpZC5cbiAqIFRoZSBpZCBpcyBhbHNvIHN0b3JlZCBvbiB0aGlzIGluc3RhbmNlIG9mIGEgVFZpZXcgYW5kIHJldXNlZCBpblxuICogc3Vic2VxdWVudCBjYWxscy5cbiAqXG4gKiBUaGlzIGlkIGlzIG5lZWRlZCB0byB1bmlxdWVseSBpZGVudGlmeSBhbmQgcGljayB1cCBkZWh5ZHJhdGVkIHZpZXdzXG4gKiBhdCBydW50aW1lLlxuICovXG5mdW5jdGlvbiBnZXRTc3JJZCh0VmlldzogVFZpZXcpOiBzdHJpbmcge1xuICBpZiAoIXRWaWV3LnNzcklkKSB7XG4gICAgdFZpZXcuc3NySWQgPSBgdCR7dFZpZXdTc3JJZCsrfWA7XG4gIH1cbiAgcmV0dXJuIHRWaWV3LnNzcklkO1xufVxuXG4vKipcbiAqIERlc2NyaWJlcyBhIGNvbnRleHQgYXZhaWxhYmxlIGR1cmluZyB0aGUgc2VyaWFsaXphdGlvblxuICogcHJvY2Vzcy4gVGhlIGNvbnRleHQgaXMgdXNlZCB0byBzaGFyZSBhbmQgY29sbGVjdCBpbmZvcm1hdGlvblxuICogZHVyaW5nIHRoZSBzZXJpYWxpemF0aW9uLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIEh5ZHJhdGlvbkNvbnRleHQge1xuICBzZXJpYWxpemVkVmlld0NvbGxlY3Rpb246IFNlcmlhbGl6ZWRWaWV3Q29sbGVjdGlvbjtcbiAgY29ycnVwdGVkVGV4dE5vZGVzOiBNYXA8SFRNTEVsZW1lbnQsIFRleHROb2RlTWFya2VyPjtcbiAgaXNJMThuSHlkcmF0aW9uRW5hYmxlZDogYm9vbGVhbjtcbiAgaTE4bkNoaWxkcmVuOiBNYXA8VFZpZXcsIFNldDxudW1iZXI+fG51bGw+O1xuICBldmVudFR5cGVzVG9SZXBsYXk6IFNldDxzdHJpbmc+O1xuICBzaG91bGRSZXBsYXlFdmVudHM6IGJvb2xlYW47XG59XG5cbi8qKlxuICogQ29tcHV0ZXMgdGhlIG51bWJlciBvZiByb290IG5vZGVzIGluIGEgZ2l2ZW4gdmlld1xuICogKG9yIGNoaWxkIG5vZGVzIGluIGEgZ2l2ZW4gY29udGFpbmVyIGlmIGEgdE5vZGUgaXMgcHJvdmlkZWQpLlxuICovXG5mdW5jdGlvbiBjYWxjTnVtUm9vdE5vZGVzKHRWaWV3OiBUVmlldywgbFZpZXc6IExWaWV3LCB0Tm9kZTogVE5vZGV8bnVsbCk6IG51bWJlciB7XG4gIGNvbnN0IHJvb3ROb2RlczogdW5rbm93bltdID0gW107XG4gIGNvbGxlY3ROYXRpdmVOb2Rlcyh0VmlldywgbFZpZXcsIHROb2RlLCByb290Tm9kZXMpO1xuICByZXR1cm4gcm9vdE5vZGVzLmxlbmd0aDtcbn1cblxuLyoqXG4gKiBDb21wdXRlcyB0aGUgbnVtYmVyIG9mIHJvb3Qgbm9kZXMgaW4gYWxsIHZpZXdzIGluIGEgZ2l2ZW4gTENvbnRhaW5lci5cbiAqL1xuZnVuY3Rpb24gY2FsY051bVJvb3ROb2Rlc0luTENvbnRhaW5lcihsQ29udGFpbmVyOiBMQ29udGFpbmVyKTogbnVtYmVyIHtcbiAgY29uc3Qgcm9vdE5vZGVzOiB1bmtub3duW10gPSBbXTtcbiAgY29sbGVjdE5hdGl2ZU5vZGVzSW5MQ29udGFpbmVyKGxDb250YWluZXIsIHJvb3ROb2Rlcyk7XG4gIHJldHVybiByb290Tm9kZXMubGVuZ3RoO1xufVxuXG5cbi8qKlxuICogQW5ub3RhdGVzIHJvb3QgbGV2ZWwgY29tcG9uZW50J3MgTFZpZXcgZm9yIGh5ZHJhdGlvbixcbiAqIHNlZSBgYW5ub3RhdGVIb3N0RWxlbWVudEZvckh5ZHJhdGlvbmAgZm9yIGFkZGl0aW9uYWwgaW5mb3JtYXRpb24uXG4gKi9cbmZ1bmN0aW9uIGFubm90YXRlQ29tcG9uZW50TFZpZXdGb3JIeWRyYXRpb24obFZpZXc6IExWaWV3LCBjb250ZXh0OiBIeWRyYXRpb25Db250ZXh0KTogbnVtYmVyfG51bGwge1xuICBjb25zdCBob3N0RWxlbWVudCA9IGxWaWV3W0hPU1RdO1xuICAvLyBSb290IGVsZW1lbnRzIG1pZ2h0IGFsc28gYmUgYW5ub3RhdGVkIHdpdGggdGhlIGBuZ1NraXBIeWRyYXRpb25gIGF0dHJpYnV0ZSxcbiAgLy8gY2hlY2sgaWYgaXQncyBwcmVzZW50IGJlZm9yZSBzdGFydGluZyB0aGUgc2VyaWFsaXphdGlvbiBwcm9jZXNzLlxuICBpZiAoaG9zdEVsZW1lbnQgJiYgIShob3N0RWxlbWVudCBhcyBIVE1MRWxlbWVudCkuaGFzQXR0cmlidXRlKFNLSVBfSFlEUkFUSU9OX0FUVFJfTkFNRSkpIHtcbiAgICByZXR1cm4gYW5ub3RhdGVIb3N0RWxlbWVudEZvckh5ZHJhdGlvbihob3N0RWxlbWVudCBhcyBIVE1MRWxlbWVudCwgbFZpZXcsIGNvbnRleHQpO1xuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG4vKipcbiAqIEFubm90YXRlcyByb290IGxldmVsIExDb250YWluZXIgZm9yIGh5ZHJhdGlvbi4gVGhpcyBoYXBwZW5zIHdoZW4gYSByb290IGNvbXBvbmVudFxuICogaW5qZWN0cyBWaWV3Q29udGFpbmVyUmVmLCB0aHVzIG1ha2luZyB0aGUgY29tcG9uZW50IGFuIGFuY2hvciBmb3IgYSB2aWV3IGNvbnRhaW5lci5cbiAqIFRoaXMgZnVuY3Rpb24gc2VyaWFsaXplcyB0aGUgY29tcG9uZW50IGl0c2VsZiBhcyB3ZWxsIGFzIGFsbCB2aWV3cyBmcm9tIHRoZSB2aWV3XG4gKiBjb250YWluZXIuXG4gKi9cbmZ1bmN0aW9uIGFubm90YXRlTENvbnRhaW5lckZvckh5ZHJhdGlvbihsQ29udGFpbmVyOiBMQ29udGFpbmVyLCBjb250ZXh0OiBIeWRyYXRpb25Db250ZXh0KSB7XG4gIGNvbnN0IGNvbXBvbmVudExWaWV3ID0gdW53cmFwTFZpZXcobENvbnRhaW5lcltIT1NUXSkgYXMgTFZpZXc8dW5rbm93bj47XG5cbiAgLy8gU2VyaWFsaXplIHRoZSByb290IGNvbXBvbmVudCBpdHNlbGYuXG4gIGNvbnN0IGNvbXBvbmVudExWaWV3TmdoSW5kZXggPSBhbm5vdGF0ZUNvbXBvbmVudExWaWV3Rm9ySHlkcmF0aW9uKGNvbXBvbmVudExWaWV3LCBjb250ZXh0KTtcblxuICBjb25zdCBob3N0RWxlbWVudCA9IHVud3JhcFJOb2RlKGNvbXBvbmVudExWaWV3W0hPU1RdISkgYXMgSFRNTEVsZW1lbnQ7XG5cbiAgLy8gU2VyaWFsaXplIGFsbCB2aWV3cyB3aXRoaW4gdGhpcyB2aWV3IGNvbnRhaW5lci5cbiAgY29uc3Qgcm9vdExWaWV3ID0gbENvbnRhaW5lcltQQVJFTlRdO1xuICBjb25zdCByb290TFZpZXdOZ2hJbmRleCA9IGFubm90YXRlSG9zdEVsZW1lbnRGb3JIeWRyYXRpb24oaG9zdEVsZW1lbnQsIHJvb3RMVmlldywgY29udGV4dCk7XG5cbiAgY29uc3QgcmVuZGVyZXIgPSBjb21wb25lbnRMVmlld1tSRU5ERVJFUl0gYXMgUmVuZGVyZXIyO1xuXG4gIC8vIEZvciBjYXNlcyB3aGVuIGEgcm9vdCBjb21wb25lbnQgYWxzbyBhY3RzIGFzIGFuIGFuY2hvciBub2RlIGZvciBhIFZpZXdDb250YWluZXJSZWZcbiAgLy8gKGZvciBleGFtcGxlLCB3aGVuIFZpZXdDb250YWluZXJSZWYgaXMgaW5qZWN0ZWQgaW4gYSByb290IGNvbXBvbmVudCksIHRoZXJlIGlzIGEgbmVlZFxuICAvLyB0byBzZXJpYWxpemUgaW5mb3JtYXRpb24gYWJvdXQgdGhlIGNvbXBvbmVudCBpdHNlbGYsIGFzIHdlbGwgYXMgYW4gTENvbnRhaW5lciB0aGF0XG4gIC8vIHJlcHJlc2VudHMgdGhpcyBWaWV3Q29udGFpbmVyUmVmLiBFZmZlY3RpdmVseSwgd2UgbmVlZCB0byBzZXJpYWxpemUgMiBwaWVjZXMgb2YgaW5mbzpcbiAgLy8gKDEpIGh5ZHJhdGlvbiBpbmZvIGZvciB0aGUgcm9vdCBjb21wb25lbnQgaXRzZWxmIGFuZCAoMikgaHlkcmF0aW9uIGluZm8gZm9yIHRoZVxuICAvLyBWaWV3Q29udGFpbmVyUmVmIGluc3RhbmNlIChhbiBMQ29udGFpbmVyKS4gRWFjaCBwaWVjZSBvZiBpbmZvcm1hdGlvbiBpcyBpbmNsdWRlZCBpbnRvXG4gIC8vIHRoZSBoeWRyYXRpb24gZGF0YSAoaW4gdGhlIFRyYW5zZmVyU3RhdGUgb2JqZWN0KSBzZXBhcmF0ZWx5LCB0aHVzIHdlIGVuZCB1cCB3aXRoIDIgaWRzLlxuICAvLyBTaW5jZSB3ZSBvbmx5IGhhdmUgMSByb290IGVsZW1lbnQsIHdlIGVuY29kZSBib3RoIGJpdHMgb2YgaW5mbyBpbnRvIGEgc2luZ2xlIHN0cmluZzpcbiAgLy8gaWRzIGFyZSBzZXBhcmF0ZWQgYnkgdGhlIGB8YCBjaGFyIChlLmcuIGAxMHwyNWAsIHdoZXJlIGAxMGAgaXMgdGhlIG5naCBmb3IgYSBjb21wb25lbnQgdmlld1xuICAvLyBhbmQgMjUgaXMgdGhlIGBuZ2hgIGZvciBhIHJvb3QgdmlldyB3aGljaCBob2xkcyBMQ29udGFpbmVyKS5cbiAgY29uc3QgZmluYWxJbmRleCA9IGAke2NvbXBvbmVudExWaWV3TmdoSW5kZXh9fCR7cm9vdExWaWV3TmdoSW5kZXh9YDtcbiAgcmVuZGVyZXIuc2V0QXR0cmlidXRlKGhvc3RFbGVtZW50LCBOR0hfQVRUUl9OQU1FLCBmaW5hbEluZGV4KTtcbn1cblxuLyoqXG4gKiBBbm5vdGF0ZXMgYWxsIGNvbXBvbmVudHMgYm9vdHN0cmFwcGVkIGluIGEgZ2l2ZW4gQXBwbGljYXRpb25SZWZcbiAqIHdpdGggaW5mbyBuZWVkZWQgZm9yIGh5ZHJhdGlvbi5cbiAqXG4gKiBAcGFyYW0gYXBwUmVmIEFuIGluc3RhbmNlIG9mIGFuIEFwcGxpY2F0aW9uUmVmLlxuICogQHBhcmFtIGRvYyBBIHJlZmVyZW5jZSB0byB0aGUgY3VycmVudCBEb2N1bWVudCBpbnN0YW5jZS5cbiAqIEByZXR1cm4gZXZlbnQgdHlwZXMgdGhhdCBuZWVkIHRvIGJlIHJlcGxheWVkXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhbm5vdGF0ZUZvckh5ZHJhdGlvbihhcHBSZWY6IEFwcGxpY2F0aW9uUmVmLCBkb2M6IERvY3VtZW50KSB7XG4gIGNvbnN0IGluamVjdG9yID0gYXBwUmVmLmluamVjdG9yO1xuICBjb25zdCBpc0kxOG5IeWRyYXRpb25FbmFibGVkVmFsID0gaXNJMThuSHlkcmF0aW9uRW5hYmxlZChpbmplY3Rvcik7XG4gIGNvbnN0IHNlcmlhbGl6ZWRWaWV3Q29sbGVjdGlvbiA9IG5ldyBTZXJpYWxpemVkVmlld0NvbGxlY3Rpb24oKTtcbiAgY29uc3QgY29ycnVwdGVkVGV4dE5vZGVzID0gbmV3IE1hcDxIVE1MRWxlbWVudCwgVGV4dE5vZGVNYXJrZXI+KCk7XG4gIGNvbnN0IHZpZXdSZWZzID0gYXBwUmVmLl92aWV3cztcbiAgY29uc3Qgc2hvdWxkUmVwbGF5RXZlbnRzID0gaW5qZWN0b3IuZ2V0KElTX0VWRU5UX1JFUExBWV9FTkFCTEVELCBFVkVOVF9SRVBMQVlfRU5BQkxFRF9ERUZBVUxUKTtcbiAgY29uc3QgZXZlbnRUeXBlc1RvUmVwbGF5ID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gIGZvciAoY29uc3Qgdmlld1JlZiBvZiB2aWV3UmVmcykge1xuICAgIGNvbnN0IGxOb2RlID0gZ2V0TE5vZGVGb3JIeWRyYXRpb24odmlld1JlZik7XG5cbiAgICAvLyBBbiBgbFZpZXdgIG1pZ2h0IGJlIGBudWxsYCBpZiBhIGBWaWV3UmVmYCByZXByZXNlbnRzXG4gICAgLy8gYW4gZW1iZWRkZWQgdmlldyAobm90IGEgY29tcG9uZW50IHZpZXcpLlxuICAgIGlmIChsTm9kZSAhPT0gbnVsbCkge1xuICAgICAgY29uc3QgY29udGV4dDogSHlkcmF0aW9uQ29udGV4dCA9IHtcbiAgICAgICAgc2VyaWFsaXplZFZpZXdDb2xsZWN0aW9uLFxuICAgICAgICBjb3JydXB0ZWRUZXh0Tm9kZXMsXG4gICAgICAgIGlzSTE4bkh5ZHJhdGlvbkVuYWJsZWQ6IGlzSTE4bkh5ZHJhdGlvbkVuYWJsZWRWYWwsXG4gICAgICAgIGkxOG5DaGlsZHJlbjogbmV3IE1hcCgpLFxuICAgICAgICBldmVudFR5cGVzVG9SZXBsYXksXG4gICAgICAgIHNob3VsZFJlcGxheUV2ZW50cyxcbiAgICAgIH07XG4gICAgICBpZiAoaXNMQ29udGFpbmVyKGxOb2RlKSkge1xuICAgICAgICBhbm5vdGF0ZUxDb250YWluZXJGb3JIeWRyYXRpb24obE5vZGUsIGNvbnRleHQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYW5ub3RhdGVDb21wb25lbnRMVmlld0Zvckh5ZHJhdGlvbihsTm9kZSwgY29udGV4dCk7XG4gICAgICB9XG4gICAgICBpbnNlcnRDb3JydXB0ZWRUZXh0Tm9kZU1hcmtlcnMoY29ycnVwdGVkVGV4dE5vZGVzLCBkb2MpO1xuICAgIH1cbiAgfVxuXG4gIC8vIE5vdGU6IHdlICphbHdheXMqIGluY2x1ZGUgaHlkcmF0aW9uIGluZm8ga2V5IGFuZCBhIGNvcnJlc3BvbmRpbmcgdmFsdWVcbiAgLy8gaW50byB0aGUgVHJhbnNmZXJTdGF0ZSwgZXZlbiBpZiB0aGUgbGlzdCBvZiBzZXJpYWxpemVkIHZpZXdzIGlzIGVtcHR5LlxuICAvLyBUaGlzIGlzIG5lZWRlZCBhcyBhIHNpZ25hbCB0byB0aGUgY2xpZW50IHRoYXQgdGhlIHNlcnZlciBwYXJ0IG9mIHRoZVxuICAvLyBoeWRyYXRpb24gbG9naWMgd2FzIHNldHVwIGFuZCBlbmFibGVkIGNvcnJlY3RseS4gT3RoZXJ3aXNlLCBpZiBhIGNsaWVudFxuICAvLyBoeWRyYXRpb24gZG9lc24ndCBmaW5kIGEga2V5IGluIHRoZSB0cmFuc2ZlciBzdGF0ZSAtIGFuIGVycm9yIGlzIHByb2R1Y2VkLlxuICBjb25zdCBzZXJpYWxpemVkVmlld3MgPSBzZXJpYWxpemVkVmlld0NvbGxlY3Rpb24uZ2V0QWxsKCk7XG4gIGNvbnN0IHRyYW5zZmVyU3RhdGUgPSBpbmplY3Rvci5nZXQoVHJhbnNmZXJTdGF0ZSk7XG4gIHRyYW5zZmVyU3RhdGUuc2V0KE5HSF9EQVRBX0tFWSwgc2VyaWFsaXplZFZpZXdzKTtcbiAgcmV0dXJuIGV2ZW50VHlwZXNUb1JlcGxheS5zaXplID4gMCA/IGV2ZW50VHlwZXNUb1JlcGxheSA6IHVuZGVmaW5lZDtcbn1cblxuLyoqXG4gKiBTZXJpYWxpemVzIHRoZSBsQ29udGFpbmVyIGRhdGEgaW50byBhIGxpc3Qgb2YgU2VyaWFsaXplZFZpZXcgb2JqZWN0cyxcbiAqIHRoYXQgcmVwcmVzZW50IHZpZXdzIHdpdGhpbiB0aGlzIGxDb250YWluZXIuXG4gKlxuICogQHBhcmFtIGxDb250YWluZXIgdGhlIGxDb250YWluZXIgd2UgYXJlIHNlcmlhbGl6aW5nXG4gKiBAcGFyYW0gY29udGV4dCB0aGUgaHlkcmF0aW9uIGNvbnRleHRcbiAqIEByZXR1cm5zIGFuIGFycmF5IG9mIHRoZSBgU2VyaWFsaXplZFZpZXdgIG9iamVjdHNcbiAqL1xuZnVuY3Rpb24gc2VyaWFsaXplTENvbnRhaW5lcihcbiAgICBsQ29udGFpbmVyOiBMQ29udGFpbmVyLCBjb250ZXh0OiBIeWRyYXRpb25Db250ZXh0KTogU2VyaWFsaXplZENvbnRhaW5lclZpZXdbXSB7XG4gIGNvbnN0IHZpZXdzOiBTZXJpYWxpemVkQ29udGFpbmVyVmlld1tdID0gW107XG4gIGxldCBsYXN0Vmlld0FzU3RyaW5nID0gJyc7XG5cbiAgZm9yIChsZXQgaSA9IENPTlRBSU5FUl9IRUFERVJfT0ZGU0VUOyBpIDwgbENvbnRhaW5lci5sZW5ndGg7IGkrKykge1xuICAgIGxldCBjaGlsZExWaWV3ID0gbENvbnRhaW5lcltpXSBhcyBMVmlldztcblxuICAgIGxldCB0ZW1wbGF0ZTogc3RyaW5nO1xuICAgIGxldCBudW1Sb290Tm9kZXM6IG51bWJlcjtcbiAgICBsZXQgc2VyaWFsaXplZFZpZXc6IFNlcmlhbGl6ZWRDb250YWluZXJWaWV3fHVuZGVmaW5lZDtcblxuICAgIGlmIChpc1Jvb3RWaWV3KGNoaWxkTFZpZXcpKSB7XG4gICAgICAvLyBJZiB0aGlzIGlzIGEgcm9vdCB2aWV3LCBnZXQgYW4gTFZpZXcgZm9yIHRoZSB1bmRlcmx5aW5nIGNvbXBvbmVudCxcbiAgICAgIC8vIGJlY2F1c2UgaXQgY29udGFpbnMgaW5mb3JtYXRpb24gYWJvdXQgdGhlIHZpZXcgdG8gc2VyaWFsaXplLlxuICAgICAgY2hpbGRMVmlldyA9IGNoaWxkTFZpZXdbSEVBREVSX09GRlNFVF07XG5cbiAgICAgIC8vIElmIHdlIGhhdmUgYW4gTENvbnRhaW5lciBhdCB0aGlzIHBvc2l0aW9uLCB0aGlzIGluZGljYXRlcyB0aGF0IHRoZVxuICAgICAgLy8gaG9zdCBlbGVtZW50IHdhcyB1c2VkIGFzIGEgVmlld0NvbnRhaW5lclJlZiBhbmNob3IgKGUuZy4gYSBgVmlld0NvbnRhaW5lclJlZmBcbiAgICAgIC8vIHdhcyBpbmplY3RlZCB3aXRoaW4gdGhlIGNvbXBvbmVudCBjbGFzcykuIFRoaXMgY2FzZSByZXF1aXJlcyBzcGVjaWFsIGhhbmRsaW5nLlxuICAgICAgaWYgKGlzTENvbnRhaW5lcihjaGlsZExWaWV3KSkge1xuICAgICAgICAvLyBDYWxjdWxhdGUgdGhlIG51bWJlciBvZiByb290IG5vZGVzIGluIGFsbCB2aWV3cyBpbiBhIGdpdmVuIGNvbnRhaW5lclxuICAgICAgICAvLyBhbmQgaW5jcmVtZW50IGJ5IG9uZSB0byBhY2NvdW50IGZvciBhbiBhbmNob3Igbm9kZSBpdHNlbGYsIGkuZS4gaW4gdGhpc1xuICAgICAgICAvLyBzY2VuYXJpbyB3ZSdsbCBoYXZlIGEgbGF5b3V0IHRoYXQgd291bGQgbG9vayBsaWtlIHRoaXM6XG4gICAgICAgIC8vIGA8YXBwLXJvb3QgLz48I1ZJRVcxPjwjVklFVzI+Li4uPCEtLWNvbnRhaW5lci0tPmBcbiAgICAgICAgLy8gVGhlIGArMWAgaXMgdG8gY2FwdHVyZSB0aGUgYDxhcHAtcm9vdCAvPmAgZWxlbWVudC5cbiAgICAgICAgbnVtUm9vdE5vZGVzID0gY2FsY051bVJvb3ROb2Rlc0luTENvbnRhaW5lcihjaGlsZExWaWV3KSArIDE7XG5cbiAgICAgICAgYW5ub3RhdGVMQ29udGFpbmVyRm9ySHlkcmF0aW9uKGNoaWxkTFZpZXcsIGNvbnRleHQpO1xuXG4gICAgICAgIGNvbnN0IGNvbXBvbmVudExWaWV3ID0gdW53cmFwTFZpZXcoY2hpbGRMVmlld1tIT1NUXSkgYXMgTFZpZXc8dW5rbm93bj47XG5cbiAgICAgICAgc2VyaWFsaXplZFZpZXcgPSB7XG4gICAgICAgICAgW1RFTVBMQVRFX0lEXTogY29tcG9uZW50TFZpZXdbVFZJRVddLnNzcklkISxcbiAgICAgICAgICBbTlVNX1JPT1RfTk9ERVNdOiBudW1Sb290Tm9kZXMsXG4gICAgICAgIH07XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKCFzZXJpYWxpemVkVmlldykge1xuICAgICAgY29uc3QgY2hpbGRUVmlldyA9IGNoaWxkTFZpZXdbVFZJRVddO1xuXG4gICAgICBpZiAoY2hpbGRUVmlldy50eXBlID09PSBUVmlld1R5cGUuQ29tcG9uZW50KSB7XG4gICAgICAgIHRlbXBsYXRlID0gY2hpbGRUVmlldy5zc3JJZCE7XG5cbiAgICAgICAgLy8gVGhpcyBpcyBhIGNvbXBvbmVudCB2aWV3LCB0aHVzIGl0IGhhcyBvbmx5IDEgcm9vdCBub2RlOiB0aGUgY29tcG9uZW50XG4gICAgICAgIC8vIGhvc3Qgbm9kZSBpdHNlbGYgKG90aGVyIG5vZGVzIHdvdWxkIGJlIGluc2lkZSB0aGF0IGhvc3Qgbm9kZSkuXG4gICAgICAgIG51bVJvb3ROb2RlcyA9IDE7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0ZW1wbGF0ZSA9IGdldFNzcklkKGNoaWxkVFZpZXcpO1xuICAgICAgICBudW1Sb290Tm9kZXMgPSBjYWxjTnVtUm9vdE5vZGVzKGNoaWxkVFZpZXcsIGNoaWxkTFZpZXcsIGNoaWxkVFZpZXcuZmlyc3RDaGlsZCk7XG4gICAgICB9XG5cbiAgICAgIHNlcmlhbGl6ZWRWaWV3ID0ge1xuICAgICAgICBbVEVNUExBVEVfSURdOiB0ZW1wbGF0ZSxcbiAgICAgICAgW05VTV9ST09UX05PREVTXTogbnVtUm9vdE5vZGVzLFxuICAgICAgICAuLi5zZXJpYWxpemVMVmlldyhsQ29udGFpbmVyW2ldIGFzIExWaWV3LCBjb250ZXh0KSxcbiAgICAgIH07XG4gICAgfVxuXG4gICAgLy8gQ2hlY2sgaWYgdGhlIHByZXZpb3VzIHZpZXcgaGFzIHRoZSBzYW1lIHNoYXBlIChmb3IgZXhhbXBsZSwgaXQgd2FzXG4gICAgLy8gcHJvZHVjZWQgYnkgdGhlICpuZ0ZvciksIGluIHdoaWNoIGNhc2UgYnVtcCB0aGUgY291bnRlciBvbiB0aGUgcHJldmlvdXNcbiAgICAvLyB2aWV3IGluc3RlYWQgb2YgaW5jbHVkaW5nIHRoZSBzYW1lIGluZm9ybWF0aW9uIGFnYWluLlxuICAgIGNvbnN0IGN1cnJlbnRWaWV3QXNTdHJpbmcgPSBKU09OLnN0cmluZ2lmeShzZXJpYWxpemVkVmlldyk7XG4gICAgaWYgKHZpZXdzLmxlbmd0aCA+IDAgJiYgY3VycmVudFZpZXdBc1N0cmluZyA9PT0gbGFzdFZpZXdBc1N0cmluZykge1xuICAgICAgY29uc3QgcHJldmlvdXNWaWV3ID0gdmlld3Nbdmlld3MubGVuZ3RoIC0gMV07XG4gICAgICBwcmV2aW91c1ZpZXdbTVVMVElQTElFUl0gPz89IDE7XG4gICAgICBwcmV2aW91c1ZpZXdbTVVMVElQTElFUl0rKztcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gUmVjb3JkIHRoaXMgdmlldyBhcyBtb3N0IHJlY2VudGx5IGFkZGVkLlxuICAgICAgbGFzdFZpZXdBc1N0cmluZyA9IGN1cnJlbnRWaWV3QXNTdHJpbmc7XG4gICAgICB2aWV3cy5wdXNoKHNlcmlhbGl6ZWRWaWV3KTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHZpZXdzO1xufVxuXG4vKipcbiAqIEhlbHBlciBmdW5jdGlvbiB0byBwcm9kdWNlIGEgbm9kZSBwYXRoICh3aGljaCBuYXZpZ2F0aW9uIHN0ZXBzIHJ1bnRpbWUgbG9naWNcbiAqIG5lZWRzIHRvIHRha2UgdG8gbG9jYXRlIGEgbm9kZSkgYW5kIHN0b3JlcyBpdCBpbiB0aGUgYE5PREVTYCBzZWN0aW9uIG9mIHRoZVxuICogY3VycmVudCBzZXJpYWxpemVkIHZpZXcuXG4gKi9cbmZ1bmN0aW9uIGFwcGVuZFNlcmlhbGl6ZWROb2RlUGF0aChcbiAgICBuZ2g6IFNlcmlhbGl6ZWRWaWV3LCB0Tm9kZTogVE5vZGUsIGxWaWV3OiBMVmlldywgZXhjbHVkZWRQYXJlbnROb2RlczogU2V0PG51bWJlcj58bnVsbCkge1xuICBjb25zdCBub09mZnNldEluZGV4ID0gdE5vZGUuaW5kZXggLSBIRUFERVJfT0ZGU0VUO1xuICBuZ2hbTk9ERVNdID8/PSB7fTtcbiAgbmdoW05PREVTXVtub09mZnNldEluZGV4XSA9IGNhbGNQYXRoRm9yTm9kZSh0Tm9kZSwgbFZpZXcsIGV4Y2x1ZGVkUGFyZW50Tm9kZXMpO1xufVxuXG4vKipcbiAqIEhlbHBlciBmdW5jdGlvbiB0byBhcHBlbmQgaW5mb3JtYXRpb24gYWJvdXQgYSBkaXNjb25uZWN0ZWQgbm9kZS5cbiAqIFRoaXMgaW5mbyBpcyBuZWVkZWQgYXQgcnVudGltZSB0byBhdm9pZCBET00gbG9va3VwcyBmb3IgdGhpcyBlbGVtZW50XG4gKiBhbmQgaW5zdGVhZCwgdGhlIGVsZW1lbnQgd291bGQgYmUgY3JlYXRlZCBmcm9tIHNjcmF0Y2guXG4gKi9cbmZ1bmN0aW9uIGFwcGVuZERpc2Nvbm5lY3RlZE5vZGVJbmRleChuZ2g6IFNlcmlhbGl6ZWRWaWV3LCB0Tm9kZTogVE5vZGUpIHtcbiAgY29uc3Qgbm9PZmZzZXRJbmRleCA9IHROb2RlLmluZGV4IC0gSEVBREVSX09GRlNFVDtcbiAgbmdoW0RJU0NPTk5FQ1RFRF9OT0RFU10gPz89IFtdO1xuICBpZiAoIW5naFtESVNDT05ORUNURURfTk9ERVNdLmluY2x1ZGVzKG5vT2Zmc2V0SW5kZXgpKSB7XG4gICAgbmdoW0RJU0NPTk5FQ1RFRF9OT0RFU10ucHVzaChub09mZnNldEluZGV4KTtcbiAgfVxufVxuXG4vKipcbiAqIFNlcmlhbGl6ZXMgdGhlIGxWaWV3IGRhdGEgaW50byBhIFNlcmlhbGl6ZWRWaWV3IG9iamVjdCB0aGF0IHdpbGwgbGF0ZXIgYmUgYWRkZWRcbiAqIHRvIHRoZSBUcmFuc2ZlclN0YXRlIHN0b3JhZ2UgYW5kIHJlZmVyZW5jZWQgdXNpbmcgdGhlIGBuZ2hgIGF0dHJpYnV0ZSBvbiBhIGhvc3RcbiAqIGVsZW1lbnQuXG4gKlxuICogQHBhcmFtIGxWaWV3IHRoZSBsVmlldyB3ZSBhcmUgc2VyaWFsaXppbmdcbiAqIEBwYXJhbSBjb250ZXh0IHRoZSBoeWRyYXRpb24gY29udGV4dFxuICogQHJldHVybnMgdGhlIGBTZXJpYWxpemVkVmlld2Agb2JqZWN0IGNvbnRhaW5pbmcgdGhlIGRhdGEgdG8gYmUgYWRkZWQgdG8gdGhlIGhvc3Qgbm9kZVxuICovXG5mdW5jdGlvbiBzZXJpYWxpemVMVmlldyhsVmlldzogTFZpZXcsIGNvbnRleHQ6IEh5ZHJhdGlvbkNvbnRleHQpOiBTZXJpYWxpemVkVmlldyB7XG4gIGNvbnN0IG5naDogU2VyaWFsaXplZFZpZXcgPSB7fTtcbiAgY29uc3QgdFZpZXcgPSBsVmlld1tUVklFV107XG4gIGNvbnN0IGkxOG5DaGlsZHJlbiA9IGdldE9yQ29tcHV0ZUkxOG5DaGlsZHJlbih0VmlldywgY29udGV4dCk7XG4gIGNvbnN0IG5hdGl2ZUVsZW1lbnRzVG9FdmVudFR5cGVzID0gY29udGV4dC5zaG91bGRSZXBsYXlFdmVudHMgP1xuICAgICAgY29sbGVjdERvbUV2ZW50c0luZm8odFZpZXcsIGxWaWV3LCBjb250ZXh0LmV2ZW50VHlwZXNUb1JlcGxheSkgOlxuICAgICAgbnVsbDtcbiAgLy8gSXRlcmF0ZSBvdmVyIERPTSBlbGVtZW50IHJlZmVyZW5jZXMgaW4gYW4gTFZpZXcuXG4gIGZvciAobGV0IGkgPSBIRUFERVJfT0ZGU0VUOyBpIDwgdFZpZXcuYmluZGluZ1N0YXJ0SW5kZXg7IGkrKykge1xuICAgIGNvbnN0IHROb2RlID0gdFZpZXcuZGF0YVtpXSBhcyBUTm9kZTtcbiAgICBjb25zdCBub09mZnNldEluZGV4ID0gaSAtIEhFQURFUl9PRkZTRVQ7XG4gICAgaWYgKG5hdGl2ZUVsZW1lbnRzVG9FdmVudFR5cGVzKSB7XG4gICAgICBzZXRKU0FjdGlvbkF0dHJpYnV0ZSh0Tm9kZSwgbFZpZXdbaV0sIG5hdGl2ZUVsZW1lbnRzVG9FdmVudFR5cGVzKTtcbiAgICB9XG5cbiAgICAvLyBBdHRlbXB0IHRvIHNlcmlhbGl6ZSBhbnkgaTE4biBkYXRhIGZvciB0aGUgZ2l2ZW4gc2xvdC4gV2UgZG8gdGhpcyBmaXJzdCwgYXMgaTE4blxuICAgIC8vIGhhcyBpdHMgb3duIHByb2Nlc3MgZm9yIHNlcmlhbGl6YXRpb24uXG4gICAgY29uc3QgaTE4bkRhdGEgPSB0cnlTZXJpYWxpemVJMThuQmxvY2sobFZpZXcsIGksIGNvbnRleHQpO1xuICAgIGlmIChpMThuRGF0YSkge1xuICAgICAgbmdoW0kxOE5fREFUQV0gPz89IHt9O1xuICAgICAgbmdoW0kxOE5fREFUQV1bbm9PZmZzZXRJbmRleF0gPSBpMThuRGF0YTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIC8vIFNraXAgcHJvY2Vzc2luZyBvZiBhIGdpdmVuIHNsb3QgaW4gdGhlIGZvbGxvd2luZyBjYXNlczpcbiAgICAvLyAtIExvY2FsIHJlZnMgKGUuZy4gPGRpdiAjbG9jYWxSZWY+KSB0YWtlIHVwIGFuIGV4dHJhIHNsb3QgaW4gTFZpZXdzXG4gICAgLy8gICB0byBzdG9yZSB0aGUgc2FtZSBlbGVtZW50LiBJbiB0aGlzIGNhc2UsIHRoZXJlIGlzIG5vIGluZm9ybWF0aW9uIGluXG4gICAgLy8gICBhIGNvcnJlc3BvbmRpbmcgc2xvdCBpbiBUTm9kZSBkYXRhIHN0cnVjdHVyZS5cbiAgICAvLyAtIFdoZW4gYSBzbG90IGNvbnRhaW5zIHNvbWV0aGluZyBvdGhlciB0aGFuIGEgVE5vZGUuIEZvciBleGFtcGxlLCB0aGVyZVxuICAgIC8vICAgbWlnaHQgYmUgc29tZSBtZXRhZGF0YSBpbmZvcm1hdGlvbiBhYm91dCBhIGRlZmVyIGJsb2NrIG9yIGEgY29udHJvbCBmbG93IGJsb2NrLlxuICAgIGlmICghaXNUTm9kZVNoYXBlKHROb2RlKSkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgLy8gU2tpcCBhbnkgbm9kZXMgdGhhdCBhcmUgaW4gYW4gaTE4biBibG9jayBidXQgYXJlIGNvbnNpZGVyZWQgZGV0YWNoZWQgKGkuZS4gbm90XG4gICAgLy8gcHJlc2VudCBpbiB0aGUgdGVtcGxhdGUpLiBUaGVzZSBub2RlcyBhcmUgZGlzY29ubmVjdGVkIGZyb20gdGhlIERPTSB0cmVlLCBhbmRcbiAgICAvLyBzbyB3ZSBkb24ndCB3YW50IHRvIHNlcmlhbGl6ZSBhbnkgaW5mb3JtYXRpb24gYWJvdXQgdGhlbS5cbiAgICBpZiAoaXNEZXRhY2hlZEJ5STE4bih0Tm9kZSkpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIC8vIENoZWNrIGlmIGEgbmF0aXZlIG5vZGUgdGhhdCByZXByZXNlbnRzIGEgZ2l2ZW4gVE5vZGUgaXMgZGlzY29ubmVjdGVkIGZyb20gdGhlIERPTSB0cmVlLlxuICAgIC8vIFN1Y2ggbm9kZXMgbXVzdCBiZSBleGNsdWRlZCBmcm9tIHRoZSBoeWRyYXRpb24gKHNpbmNlIHRoZSBoeWRyYXRpb24gd29uJ3QgYmUgYWJsZSB0b1xuICAgIC8vIGZpbmQgdGhlbSksIHNvIHRoZSBUTm9kZSBpZHMgYXJlIGNvbGxlY3RlZCBhbmQgdXNlZCBhdCBydW50aW1lIHRvIHNraXAgdGhlIGh5ZHJhdGlvbi5cbiAgICAvL1xuICAgIC8vIFRoaXMgc2l0dWF0aW9uIG1heSBoYXBwZW4gZHVyaW5nIHRoZSBjb250ZW50IHByb2plY3Rpb24sIHdoZW4gc29tZSBub2RlcyBkb24ndCBtYWtlIGl0XG4gICAgLy8gaW50byBvbmUgb2YgdGhlIGNvbnRlbnQgcHJvamVjdGlvbiBzbG90cyAoZm9yIGV4YW1wbGUsIHdoZW4gdGhlcmUgaXMgbm8gZGVmYXVsdFxuICAgIC8vIDxuZy1jb250ZW50IC8+IHNsb3QgaW4gcHJvamVjdG9yIGNvbXBvbmVudCdzIHRlbXBsYXRlKS5cbiAgICBpZiAoaXNEaXNjb25uZWN0ZWROb2RlKHROb2RlLCBsVmlldykgJiYgaXNDb250ZW50UHJvamVjdGVkTm9kZSh0Tm9kZSkpIHtcbiAgICAgIGFwcGVuZERpc2Nvbm5lY3RlZE5vZGVJbmRleChuZ2gsIHROb2RlKTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICBpZiAoQXJyYXkuaXNBcnJheSh0Tm9kZS5wcm9qZWN0aW9uKSkge1xuICAgICAgZm9yIChjb25zdCBwcm9qZWN0aW9uSGVhZFROb2RlIG9mIHROb2RlLnByb2plY3Rpb24pIHtcbiAgICAgICAgLy8gV2UgbWF5IGhhdmUgYG51bGxgcyBpbiBzbG90cyB3aXRoIG5vIHByb2plY3RlZCBjb250ZW50LlxuICAgICAgICBpZiAoIXByb2plY3Rpb25IZWFkVE5vZGUpIGNvbnRpbnVlO1xuXG4gICAgICAgIGlmICghQXJyYXkuaXNBcnJheShwcm9qZWN0aW9uSGVhZFROb2RlKSkge1xuICAgICAgICAgIC8vIElmIHdlIHByb2Nlc3MgcmUtcHJvamVjdGVkIGNvbnRlbnQgKGkuZS4gYDxuZy1jb250ZW50PmBcbiAgICAgICAgICAvLyBhcHBlYXJzIGF0IHByb2plY3Rpb24gbG9jYXRpb24pLCBza2lwIGFubm90YXRpb25zIGZvciB0aGlzIGNvbnRlbnRcbiAgICAgICAgICAvLyBzaW5jZSBhbGwgRE9NIG5vZGVzIGluIHRoaXMgcHJvamVjdGlvbiB3ZXJlIGhhbmRsZWQgd2hpbGUgcHJvY2Vzc2luZ1xuICAgICAgICAgIC8vIGEgcGFyZW50IGxWaWV3LCB3aGljaCBjb250YWlucyB0aG9zZSBub2Rlcy5cbiAgICAgICAgICBpZiAoIWlzUHJvamVjdGlvblROb2RlKHByb2plY3Rpb25IZWFkVE5vZGUpICYmXG4gICAgICAgICAgICAgICFpc0luU2tpcEh5ZHJhdGlvbkJsb2NrKHByb2plY3Rpb25IZWFkVE5vZGUpKSB7XG4gICAgICAgICAgICBpZiAoaXNEaXNjb25uZWN0ZWROb2RlKHByb2plY3Rpb25IZWFkVE5vZGUsIGxWaWV3KSkge1xuICAgICAgICAgICAgICAvLyBDaGVjayB3aGV0aGVyIHRoaXMgbm9kZSBpcyBjb25uZWN0ZWQsIHNpbmNlIHdlIG1heSBoYXZlIGEgVE5vZGVcbiAgICAgICAgICAgICAgLy8gaW4gdGhlIGRhdGEgc3RydWN0dXJlIGFzIGEgcHJvamVjdGlvbiBzZWdtZW50IGhlYWQsIGJ1dCB0aGVcbiAgICAgICAgICAgICAgLy8gY29udGVudCBwcm9qZWN0aW9uIHNsb3QgbWlnaHQgYmUgZGlzYWJsZWQgKGUuZy5cbiAgICAgICAgICAgICAgLy8gPG5nLWNvbnRlbnQgKm5nSWY9XCJmYWxzZVwiIC8+KS5cbiAgICAgICAgICAgICAgYXBwZW5kRGlzY29ubmVjdGVkTm9kZUluZGV4KG5naCwgcHJvamVjdGlvbkhlYWRUTm9kZSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBhcHBlbmRTZXJpYWxpemVkTm9kZVBhdGgobmdoLCBwcm9qZWN0aW9uSGVhZFROb2RlLCBsVmlldywgaTE4bkNoaWxkcmVuKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gSWYgYSB2YWx1ZSBpcyBhbiBhcnJheSwgaXQgbWVhbnMgdGhhdCB3ZSBhcmUgcHJvY2Vzc2luZyBhIHByb2plY3Rpb25cbiAgICAgICAgICAvLyB3aGVyZSBwcm9qZWN0YWJsZSBub2RlcyB3ZXJlIHBhc3NlZCBpbiBhcyBET00gbm9kZXMgKGZvciBleGFtcGxlLCB3aGVuXG4gICAgICAgICAgLy8gY2FsbGluZyBgVmlld0NvbnRhaW5lclJlZi5jcmVhdGVDb21wb25lbnQoQ21wQSwge3Byb2plY3RhYmxlTm9kZXM6IFsuLi5dfSlgKS5cbiAgICAgICAgICAvL1xuICAgICAgICAgIC8vIEluIHRoaXMgc2NlbmFyaW8sIG5vZGVzIGNhbiBjb21lIGZyb20gYW55d2hlcmUgKGVpdGhlciBjcmVhdGVkIG1hbnVhbGx5LFxuICAgICAgICAgIC8vIGFjY2Vzc2VkIHZpYSBgZG9jdW1lbnQucXVlcnlTZWxlY3RvcmAsIGV0YykgYW5kIG1heSBiZSBpbiBhbnkgc3RhdGVcbiAgICAgICAgICAvLyAoYXR0YWNoZWQgb3IgZGV0YWNoZWQgZnJvbSB0aGUgRE9NIHRyZWUpLiBBcyBhIHJlc3VsdCwgd2UgY2FuIG5vdCByZWxpYWJseVxuICAgICAgICAgIC8vIHJlc3RvcmUgdGhlIHN0YXRlIGZvciBzdWNoIGNhc2VzIGR1cmluZyBoeWRyYXRpb24uXG5cbiAgICAgICAgICB0aHJvdyB1bnN1cHBvcnRlZFByb2plY3Rpb25PZkRvbU5vZGVzKHVud3JhcFJOb2RlKGxWaWV3W2ldKSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25kaXRpb25hbGx5QW5ub3RhdGVOb2RlUGF0aChuZ2gsIHROb2RlLCBsVmlldywgaTE4bkNoaWxkcmVuKTtcblxuICAgIGlmIChpc0xDb250YWluZXIobFZpZXdbaV0pKSB7XG4gICAgICAvLyBTZXJpYWxpemUgaW5mb3JtYXRpb24gYWJvdXQgYSB0ZW1wbGF0ZS5cbiAgICAgIGNvbnN0IGVtYmVkZGVkVFZpZXcgPSB0Tm9kZS50VmlldztcbiAgICAgIGlmIChlbWJlZGRlZFRWaWV3ICE9PSBudWxsKSB7XG4gICAgICAgIG5naFtURU1QTEFURVNdID8/PSB7fTtcbiAgICAgICAgbmdoW1RFTVBMQVRFU11bbm9PZmZzZXRJbmRleF0gPSBnZXRTc3JJZChlbWJlZGRlZFRWaWV3KTtcbiAgICAgIH1cblxuICAgICAgLy8gU2VyaWFsaXplIHZpZXdzIHdpdGhpbiB0aGlzIExDb250YWluZXIuXG4gICAgICBjb25zdCBob3N0Tm9kZSA9IGxWaWV3W2ldW0hPU1RdITsgIC8vIGhvc3Qgbm9kZSBvZiB0aGlzIGNvbnRhaW5lclxuXG4gICAgICAvLyBMVmlld1tpXVtIT1NUXSBjYW4gYmUgb2YgMiBkaWZmZXJlbnQgdHlwZXM6XG4gICAgICAvLyAtIGVpdGhlciBhIERPTSBub2RlXG4gICAgICAvLyAtIG9yIGFuIGFycmF5IHRoYXQgcmVwcmVzZW50cyBhbiBMVmlldyBvZiBhIGNvbXBvbmVudFxuICAgICAgaWYgKEFycmF5LmlzQXJyYXkoaG9zdE5vZGUpKSB7XG4gICAgICAgIC8vIFRoaXMgaXMgYSBjb21wb25lbnQsIHNlcmlhbGl6ZSBpbmZvIGFib3V0IGl0LlxuICAgICAgICBjb25zdCB0YXJnZXROb2RlID0gdW53cmFwUk5vZGUoaG9zdE5vZGUgYXMgTFZpZXcpIGFzIFJFbGVtZW50O1xuICAgICAgICBpZiAoISh0YXJnZXROb2RlIGFzIEhUTUxFbGVtZW50KS5oYXNBdHRyaWJ1dGUoU0tJUF9IWURSQVRJT05fQVRUUl9OQU1FKSkge1xuICAgICAgICAgIGFubm90YXRlSG9zdEVsZW1lbnRGb3JIeWRyYXRpb24odGFyZ2V0Tm9kZSwgaG9zdE5vZGUgYXMgTFZpZXcsIGNvbnRleHQpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIG5naFtDT05UQUlORVJTXSA/Pz0ge307XG4gICAgICBuZ2hbQ09OVEFJTkVSU11bbm9PZmZzZXRJbmRleF0gPSBzZXJpYWxpemVMQ29udGFpbmVyKGxWaWV3W2ldLCBjb250ZXh0KTtcbiAgICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkobFZpZXdbaV0pKSB7XG4gICAgICAvLyBUaGlzIGlzIGEgY29tcG9uZW50LCBhbm5vdGF0ZSB0aGUgaG9zdCBub2RlIHdpdGggYW4gYG5naGAgYXR0cmlidXRlLlxuICAgICAgY29uc3QgdGFyZ2V0Tm9kZSA9IHVud3JhcFJOb2RlKGxWaWV3W2ldW0hPU1RdISk7XG4gICAgICBpZiAoISh0YXJnZXROb2RlIGFzIEhUTUxFbGVtZW50KS5oYXNBdHRyaWJ1dGUoU0tJUF9IWURSQVRJT05fQVRUUl9OQU1FKSkge1xuICAgICAgICBhbm5vdGF0ZUhvc3RFbGVtZW50Rm9ySHlkcmF0aW9uKHRhcmdldE5vZGUgYXMgUkVsZW1lbnQsIGxWaWV3W2ldLCBjb250ZXh0KTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gPG5nLWNvbnRhaW5lcj4gY2FzZVxuICAgICAgaWYgKHROb2RlLnR5cGUgJiBUTm9kZVR5cGUuRWxlbWVudENvbnRhaW5lcikge1xuICAgICAgICAvLyBBbiA8bmctY29udGFpbmVyPiBpcyByZXByZXNlbnRlZCBieSB0aGUgbnVtYmVyIG9mXG4gICAgICAgIC8vIHRvcC1sZXZlbCBub2Rlcy4gVGhpcyBpbmZvcm1hdGlvbiBpcyBuZWVkZWQgdG8gc2tpcCBvdmVyXG4gICAgICAgIC8vIHRob3NlIG5vZGVzIHRvIHJlYWNoIGEgY29ycmVzcG9uZGluZyBhbmNob3Igbm9kZSAoY29tbWVudCBub2RlKS5cbiAgICAgICAgbmdoW0VMRU1FTlRfQ09OVEFJTkVSU10gPz89IHt9O1xuICAgICAgICBuZ2hbRUxFTUVOVF9DT05UQUlORVJTXVtub09mZnNldEluZGV4XSA9IGNhbGNOdW1Sb290Tm9kZXModFZpZXcsIGxWaWV3LCB0Tm9kZS5jaGlsZCk7XG4gICAgICB9IGVsc2UgaWYgKHROb2RlLnR5cGUgJiBUTm9kZVR5cGUuUHJvamVjdGlvbikge1xuICAgICAgICAvLyBDdXJyZW50IFROb2RlIHJlcHJlc2VudHMgYW4gYDxuZy1jb250ZW50PmAgc2xvdCwgdGh1cyBpdCBoYXMgbm9cbiAgICAgICAgLy8gRE9NIGVsZW1lbnRzIGFzc29jaWF0ZWQgd2l0aCBpdCwgc28gdGhlICoqbmV4dCBzaWJsaW5nKiogbm9kZSB3b3VsZFxuICAgICAgICAvLyBub3QgYmUgYWJsZSB0byBmaW5kIGFuIGFuY2hvci4gSW4gdGhpcyBjYXNlLCB1c2UgZnVsbCBwYXRoIGluc3RlYWQuXG4gICAgICAgIGxldCBuZXh0VE5vZGUgPSB0Tm9kZS5uZXh0O1xuICAgICAgICAvLyBTa2lwIG92ZXIgYWxsIGA8bmctY29udGVudD5gIHNsb3RzIGluIGEgcm93LlxuICAgICAgICB3aGlsZSAobmV4dFROb2RlICE9PSBudWxsICYmIChuZXh0VE5vZGUudHlwZSAmIFROb2RlVHlwZS5Qcm9qZWN0aW9uKSkge1xuICAgICAgICAgIG5leHRUTm9kZSA9IG5leHRUTm9kZS5uZXh0O1xuICAgICAgICB9XG4gICAgICAgIGlmIChuZXh0VE5vZGUgJiYgIWlzSW5Ta2lwSHlkcmF0aW9uQmxvY2sobmV4dFROb2RlKSkge1xuICAgICAgICAgIC8vIEhhbmRsZSBhIHROb2RlIGFmdGVyIHRoZSBgPG5nLWNvbnRlbnQ+YCBzbG90LlxuICAgICAgICAgIGFwcGVuZFNlcmlhbGl6ZWROb2RlUGF0aChuZ2gsIG5leHRUTm9kZSwgbFZpZXcsIGkxOG5DaGlsZHJlbik7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmICh0Tm9kZS50eXBlICYgVE5vZGVUeXBlLlRleHQpIHtcbiAgICAgICAgICBjb25zdCByTm9kZSA9IHVud3JhcFJOb2RlKGxWaWV3W2ldKTtcbiAgICAgICAgICBwcm9jZXNzVGV4dE5vZGVCZWZvcmVTZXJpYWxpemF0aW9uKGNvbnRleHQsIHJOb2RlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gbmdoO1xufVxuXG4vKipcbiAqIFNlcmlhbGl6ZXMgbm9kZSBsb2NhdGlvbiBpbiBjYXNlcyB3aGVuIGl0J3MgbmVlZGVkLCBzcGVjaWZpY2FsbHk6XG4gKlxuICogIDEuIElmIGB0Tm9kZS5wcm9qZWN0aW9uTmV4dGAgaXMgZGlmZmVyZW50IGZyb20gYHROb2RlLm5leHRgIC0gaXQgbWVhbnMgdGhhdFxuICogICAgIHRoZSBuZXh0IGB0Tm9kZWAgYWZ0ZXIgcHJvamVjdGlvbiBpcyBkaWZmZXJlbnQgZnJvbSB0aGUgb25lIGluIHRoZSBvcmlnaW5hbFxuICogICAgIHRlbXBsYXRlLiBTaW5jZSBoeWRyYXRpb24gcmVsaWVzIG9uIGB0Tm9kZS5uZXh0YCwgdGhpcyBzZXJpYWxpemVkIGluZm9cbiAqICAgICBpcyByZXF1aXJlZCB0byBoZWxwIHJ1bnRpbWUgY29kZSBmaW5kIHRoZSBub2RlIGF0IHRoZSBjb3JyZWN0IGxvY2F0aW9uLlxuICogIDIuIEluIGNlcnRhaW4gY29udGVudCBwcm9qZWN0aW9uLWJhc2VkIHVzZS1jYXNlcywgaXQncyBwb3NzaWJsZSB0aGF0IG9ubHlcbiAqICAgICBhIGNvbnRlbnQgb2YgYSBwcm9qZWN0ZWQgZWxlbWVudCBpcyByZW5kZXJlZC4gSW4gdGhpcyBjYXNlLCBjb250ZW50IG5vZGVzXG4gKiAgICAgcmVxdWlyZSBhbiBleHRyYSBhbm5vdGF0aW9uLCBzaW5jZSBydW50aW1lIGxvZ2ljIGNhbid0IHJlbHkgb24gcGFyZW50LWNoaWxkXG4gKiAgICAgY29ubmVjdGlvbiB0byBpZGVudGlmeSB0aGUgbG9jYXRpb24gb2YgYSBub2RlLlxuICovXG5mdW5jdGlvbiBjb25kaXRpb25hbGx5QW5ub3RhdGVOb2RlUGF0aChcbiAgICBuZ2g6IFNlcmlhbGl6ZWRWaWV3LCB0Tm9kZTogVE5vZGUsIGxWaWV3OiBMVmlldzx1bmtub3duPixcbiAgICBleGNsdWRlZFBhcmVudE5vZGVzOiBTZXQ8bnVtYmVyPnxudWxsKSB7XG4gIC8vIEhhbmRsZSBjYXNlICMxIGRlc2NyaWJlZCBhYm92ZS5cbiAgaWYgKHROb2RlLnByb2plY3Rpb25OZXh0ICYmIHROb2RlLnByb2plY3Rpb25OZXh0ICE9PSB0Tm9kZS5uZXh0ICYmXG4gICAgICAhaXNJblNraXBIeWRyYXRpb25CbG9jayh0Tm9kZS5wcm9qZWN0aW9uTmV4dCkpIHtcbiAgICBhcHBlbmRTZXJpYWxpemVkTm9kZVBhdGgobmdoLCB0Tm9kZS5wcm9qZWN0aW9uTmV4dCwgbFZpZXcsIGV4Y2x1ZGVkUGFyZW50Tm9kZXMpO1xuICB9XG5cbiAgLy8gSGFuZGxlIGNhc2UgIzIgZGVzY3JpYmVkIGFib3ZlLlxuICAvLyBOb3RlOiB3ZSBvbmx5IGRvIHRoYXQgZm9yIHRoZSBmaXJzdCBub2RlIChpLmUuIHdoZW4gYHROb2RlLnByZXYgPT09IG51bGxgKSxcbiAgLy8gdGhlIHJlc3Qgb2YgdGhlIG5vZGVzIHdvdWxkIHJlbHkgb24gdGhlIGN1cnJlbnQgbm9kZSBsb2NhdGlvbiwgc28gbm8gZXh0cmFcbiAgLy8gYW5ub3RhdGlvbiBpcyBuZWVkZWQuXG4gIGlmICh0Tm9kZS5wcmV2ID09PSBudWxsICYmIHROb2RlLnBhcmVudCAhPT0gbnVsbCAmJiBpc0Rpc2Nvbm5lY3RlZE5vZGUodE5vZGUucGFyZW50LCBsVmlldykgJiZcbiAgICAgICFpc0Rpc2Nvbm5lY3RlZE5vZGUodE5vZGUsIGxWaWV3KSkge1xuICAgIGFwcGVuZFNlcmlhbGl6ZWROb2RlUGF0aChuZ2gsIHROb2RlLCBsVmlldywgZXhjbHVkZWRQYXJlbnROb2Rlcyk7XG4gIH1cbn1cblxuLyoqXG4gKiBEZXRlcm1pbmVzIHdoZXRoZXIgYSBjb21wb25lbnQgaW5zdGFuY2UgdGhhdCBpcyByZXByZXNlbnRlZFxuICogYnkgYSBnaXZlbiBMVmlldyB1c2VzIGBWaWV3RW5jYXBzdWxhdGlvbi5TaGFkb3dEb21gLlxuICovXG5mdW5jdGlvbiBjb21wb25lbnRVc2VzU2hhZG93RG9tRW5jYXBzdWxhdGlvbihsVmlldzogTFZpZXcpOiBib29sZWFuIHtcbiAgY29uc3QgaW5zdGFuY2UgPSBsVmlld1tDT05URVhUXTtcbiAgcmV0dXJuIGluc3RhbmNlPy5jb25zdHJ1Y3RvciA/XG4gICAgICBnZXRDb21wb25lbnREZWYoaW5zdGFuY2UuY29uc3RydWN0b3IpPy5lbmNhcHN1bGF0aW9uID09PSBWaWV3RW5jYXBzdWxhdGlvbi5TaGFkb3dEb20gOlxuICAgICAgZmFsc2U7XG59XG5cbi8qKlxuICogQW5ub3RhdGVzIGNvbXBvbmVudCBob3N0IGVsZW1lbnQgZm9yIGh5ZHJhdGlvbjpcbiAqIC0gYnkgZWl0aGVyIGFkZGluZyB0aGUgYG5naGAgYXR0cmlidXRlIGFuZCBjb2xsZWN0aW5nIGh5ZHJhdGlvbi1yZWxhdGVkIGluZm9cbiAqICAgZm9yIHRoZSBzZXJpYWxpemF0aW9uIGFuZCB0cmFuc2ZlcnJpbmcgdG8gdGhlIGNsaWVudFxuICogLSBvciBieSBhZGRpbmcgdGhlIGBuZ1NraXBIeWRyYXRpb25gIGF0dHJpYnV0ZSBpbiBjYXNlIEFuZ3VsYXIgZGV0ZWN0cyB0aGF0XG4gKiAgIGNvbXBvbmVudCBjb250ZW50cyBpcyBub3QgY29tcGF0aWJsZSB3aXRoIGh5ZHJhdGlvbi5cbiAqXG4gKiBAcGFyYW0gZWxlbWVudCBUaGUgSG9zdCBlbGVtZW50IHRvIGJlIGFubm90YXRlZFxuICogQHBhcmFtIGxWaWV3IFRoZSBhc3NvY2lhdGVkIExWaWV3XG4gKiBAcGFyYW0gY29udGV4dCBUaGUgaHlkcmF0aW9uIGNvbnRleHRcbiAqIEByZXR1cm5zIEFuIGluZGV4IG9mIHNlcmlhbGl6ZWQgdmlldyBmcm9tIHRoZSB0cmFuc2ZlciBzdGF0ZSBvYmplY3RcbiAqICAgICAgICAgIG9yIGBudWxsYCB3aGVuIGEgZ2l2ZW4gY29tcG9uZW50IGNhbiBub3QgYmUgc2VyaWFsaXplZC5cbiAqL1xuZnVuY3Rpb24gYW5ub3RhdGVIb3N0RWxlbWVudEZvckh5ZHJhdGlvbihcbiAgICBlbGVtZW50OiBSRWxlbWVudCwgbFZpZXc6IExWaWV3LCBjb250ZXh0OiBIeWRyYXRpb25Db250ZXh0KTogbnVtYmVyfG51bGwge1xuICBjb25zdCByZW5kZXJlciA9IGxWaWV3W1JFTkRFUkVSXTtcbiAgaWYgKChoYXNJMThuKGxWaWV3KSAmJiAhaXNJMThuSHlkcmF0aW9uU3VwcG9ydEVuYWJsZWQoKSkgfHxcbiAgICAgIGNvbXBvbmVudFVzZXNTaGFkb3dEb21FbmNhcHN1bGF0aW9uKGxWaWV3KSkge1xuICAgIC8vIEF0dGFjaCB0aGUgc2tpcCBoeWRyYXRpb24gYXR0cmlidXRlIGlmIHRoaXMgY29tcG9uZW50OlxuICAgIC8vIC0gZWl0aGVyIGhhcyBpMThuIGJsb2Nrcywgc2luY2UgaHlkcmF0aW5nIHN1Y2ggYmxvY2tzIGlzIG5vdCB5ZXQgc3VwcG9ydGVkXG4gICAgLy8gLSBvciB1c2VzIFNoYWRvd0RvbSB2aWV3IGVuY2Fwc3VsYXRpb24sIHNpbmNlIERvbWlubyBkb2Vzbid0IHN1cHBvcnRcbiAgICAvLyAgIHNoYWRvdyBET00sIHNvIHdlIGNhbiBub3QgZ3VhcmFudGVlIHRoYXQgY2xpZW50IGFuZCBzZXJ2ZXIgcmVwcmVzZW50YXRpb25zXG4gICAgLy8gICB3b3VsZCBleGFjdGx5IG1hdGNoXG4gICAgcmVuZGVyZXIuc2V0QXR0cmlidXRlKGVsZW1lbnQsIFNLSVBfSFlEUkFUSU9OX0FUVFJfTkFNRSwgJycpO1xuICAgIHJldHVybiBudWxsO1xuICB9IGVsc2Uge1xuICAgIGNvbnN0IG5naCA9IHNlcmlhbGl6ZUxWaWV3KGxWaWV3LCBjb250ZXh0KTtcbiAgICBjb25zdCBpbmRleCA9IGNvbnRleHQuc2VyaWFsaXplZFZpZXdDb2xsZWN0aW9uLmFkZChuZ2gpO1xuICAgIHJlbmRlcmVyLnNldEF0dHJpYnV0ZShlbGVtZW50LCBOR0hfQVRUUl9OQU1FLCBpbmRleC50b1N0cmluZygpKTtcbiAgICByZXR1cm4gaW5kZXg7XG4gIH1cbn1cblxuLyoqXG4gKiBQaHlzaWNhbGx5IGluc2VydHMgdGhlIGNvbW1lbnQgbm9kZXMgdG8gZW5zdXJlIGVtcHR5IHRleHQgbm9kZXMgYW5kIGFkamFjZW50XG4gKiB0ZXh0IG5vZGUgc2VwYXJhdG9ycyBhcmUgcHJlc2VydmVkIGFmdGVyIHNlcnZlciBzZXJpYWxpemF0aW9uIG9mIHRoZSBET00uXG4gKiBUaGVzZSBnZXQgc3dhcHBlZCBiYWNrIGZvciBlbXB0eSB0ZXh0IG5vZGVzIG9yIHNlcGFyYXRvcnMgb25jZSBoeWRyYXRpb24gaGFwcGVuc1xuICogb24gdGhlIGNsaWVudC5cbiAqXG4gKiBAcGFyYW0gY29ycnVwdGVkVGV4dE5vZGVzIFRoZSBNYXAgb2YgdGV4dCBub2RlcyB0byBiZSByZXBsYWNlZCB3aXRoIGNvbW1lbnRzXG4gKiBAcGFyYW0gZG9jIFRoZSBkb2N1bWVudFxuICovXG5mdW5jdGlvbiBpbnNlcnRDb3JydXB0ZWRUZXh0Tm9kZU1hcmtlcnMoXG4gICAgY29ycnVwdGVkVGV4dE5vZGVzOiBNYXA8SFRNTEVsZW1lbnQsIHN0cmluZz4sIGRvYzogRG9jdW1lbnQpIHtcbiAgZm9yIChjb25zdCBbdGV4dE5vZGUsIG1hcmtlcl0gb2YgY29ycnVwdGVkVGV4dE5vZGVzKSB7XG4gICAgdGV4dE5vZGUuYWZ0ZXIoZG9jLmNyZWF0ZUNvbW1lbnQobWFya2VyKSk7XG4gIH1cbn1cblxuLyoqXG4gKiBEZXRlY3RzIHdoZXRoZXIgYSBnaXZlbiBUTm9kZSByZXByZXNlbnRzIGEgbm9kZSB0aGF0XG4gKiBpcyBiZWluZyBjb250ZW50IHByb2plY3RlZC5cbiAqL1xuZnVuY3Rpb24gaXNDb250ZW50UHJvamVjdGVkTm9kZSh0Tm9kZTogVE5vZGUpOiBib29sZWFuIHtcbiAgbGV0IGN1cnJlbnRUTm9kZSA9IHROb2RlO1xuICB3aGlsZSAoY3VycmVudFROb2RlICE9IG51bGwpIHtcbiAgICAvLyBJZiB3ZSBjb21lIGFjcm9zcyBhIGNvbXBvbmVudCBob3N0IG5vZGUgaW4gcGFyZW50IG5vZGVzIC1cbiAgICAvLyB0aGlzIFROb2RlIGlzIGluIHRoZSBjb250ZW50IHByb2plY3Rpb24gc2VjdGlvbi5cbiAgICBpZiAoaXNDb21wb25lbnRIb3N0KGN1cnJlbnRUTm9kZSkpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBjdXJyZW50VE5vZGUgPSBjdXJyZW50VE5vZGUucGFyZW50IGFzIFROb2RlO1xuICB9XG4gIHJldHVybiBmYWxzZTtcbn1cbiJdfQ==