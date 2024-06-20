/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { isDetachedByI18n } from '../i18n/utils';
import { ViewEncapsulation } from '../metadata';
import { assertTNode } from '../render3/assert';
import { collectNativeNodes, collectNativeNodesInLContainer } from '../render3/collect_native_nodes';
import { getComponentDef } from '../render3/definition';
import { CONTAINER_HEADER_OFFSET } from '../render3/interfaces/container';
import { isTNodeShape } from '../render3/interfaces/node';
import { hasI18n, isComponentHost, isLContainer, isProjectionTNode, isRootView, } from '../render3/interfaces/type_checks';
import { CONTEXT, HEADER_OFFSET, HOST, PARENT, RENDERER, TVIEW, } from '../render3/interfaces/view';
import { unwrapLView, unwrapRNode } from '../render3/util/view_utils';
import { TransferState } from '../transfer_state';
import { unsupportedProjectionOfDomNodes } from './error_handling';
import { collectDomEventsInfo } from './event_replay';
import { setJSActionAttribute } from '../event_delegation_utils';
import { getOrComputeI18nChildren, isI18nHydrationEnabled, isI18nHydrationSupportEnabled, trySerializeI18nBlock, } from './i18n';
import { CONTAINERS, DISCONNECTED_NODES, ELEMENT_CONTAINERS, I18N_DATA, MULTIPLIER, NODES, NUM_ROOT_NODES, TEMPLATE_ID, TEMPLATES, } from './interfaces';
import { calcPathForNode, isDisconnectedNode } from './node_lookup_utils';
import { isInSkipHydrationBlock, SKIP_HYDRATION_ATTR_NAME } from './skip_hydration';
import { EVENT_REPLAY_ENABLED_DEFAULT, IS_EVENT_REPLAY_ENABLED } from './tokens';
import { getLNodeForHydration, NGH_ATTR_NAME, NGH_DATA_KEY, processTextNodeBeforeSerialization, } from './utils';
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
    if (componentLViewNghIndex === null) {
        // Component was not serialized (for example, if hydration was skipped by adding
        // the `ngSkipHydration` attribute or this component uses i18n blocks in the template,
        // but `withI18nSupport()` was not added), avoid annotating host element with the `ngh`
        // attribute.
        return;
    }
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
    const eventTypesToReplay = {
        regular: new Set(),
        capture: new Set(),
    };
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
    return eventTypesToReplay;
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
    // Ensure we don't calculate the path multiple times.
    ngh[NODES][noOffsetIndex] ??= calcPathForNode(tNode, lView, excludedParentNodes);
}
/**
 * Helper function to append information about a disconnected node.
 * This info is needed at runtime to avoid DOM lookups for this element
 * and instead, the element would be created from scratch.
 */
function appendDisconnectedNodeIndex(ngh, tNodeOrNoOffsetIndex) {
    const noOffsetIndex = typeof tNodeOrNoOffsetIndex === 'number'
        ? tNodeOrNoOffsetIndex
        : tNodeOrNoOffsetIndex.index - HEADER_OFFSET;
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
    const nativeElementsToEventTypes = context.shouldReplayEvents
        ? collectDomEventsInfo(tView, lView, context.eventTypesToReplay)
        : null;
    // Iterate over DOM element references in an LView.
    for (let i = HEADER_OFFSET; i < tView.bindingStartIndex; i++) {
        const tNode = tView.data[i];
        const noOffsetIndex = i - HEADER_OFFSET;
        // Attempt to serialize any i18n data for the given slot. We do this first, as i18n
        // has its own process for serialization.
        const i18nData = trySerializeI18nBlock(lView, i, context);
        if (i18nData) {
            ngh[I18N_DATA] ??= {};
            ngh[I18N_DATA][noOffsetIndex] = i18nData.caseQueue;
            for (const nodeNoOffsetIndex of i18nData.disconnectedNodes) {
                appendDisconnectedNodeIndex(ngh, nodeNoOffsetIndex);
            }
            for (const nodeNoOffsetIndex of i18nData.disjointNodes) {
                const tNode = tView.data[nodeNoOffsetIndex + HEADER_OFFSET];
                ngDevMode && assertTNode(tNode);
                appendSerializedNodePath(ngh, tNode, lView, i18nChildren);
            }
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
        // Attach `jsaction` attribute to elements that have registered listeners,
        // thus potentially having a need to do an event replay.
        if (nativeElementsToEventTypes && tNode.type & 2 /* TNodeType.Element */) {
            const nativeElement = unwrapRNode(lView[i]);
            if (nativeElementsToEventTypes.has(nativeElement)) {
                setJSActionAttribute(nativeElement, nativeElementsToEventTypes.get(nativeElement));
            }
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
                while (nextTNode !== null && nextTNode.type & 16 /* TNodeType.Projection */) {
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
    if (tNode.projectionNext &&
        tNode.projectionNext !== tNode.next &&
        !isInSkipHydrationBlock(tNode.projectionNext)) {
        appendSerializedNodePath(ngh, tNode.projectionNext, lView, excludedParentNodes);
    }
    // Handle case #2 described above.
    // Note: we only do that for the first node (i.e. when `tNode.prev === null`),
    // the rest of the nodes would rely on the current node location, so no extra
    // annotation is needed.
    if (tNode.prev === null &&
        tNode.parent !== null &&
        isDisconnectedNode(tNode.parent, lView) &&
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
    return instance?.constructor
        ? getComponentDef(instance.constructor)?.encapsulation === ViewEncapsulation.ShadowDom
        : false;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYW5ub3RhdGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9oeWRyYXRpb24vYW5ub3RhdGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBSUgsT0FBTyxFQUFDLGdCQUFnQixFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQy9DLE9BQU8sRUFBQyxpQkFBaUIsRUFBQyxNQUFNLGFBQWEsQ0FBQztBQUU5QyxPQUFPLEVBQUMsV0FBVyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDOUMsT0FBTyxFQUFDLGtCQUFrQixFQUFFLDhCQUE4QixFQUFDLE1BQU0saUNBQWlDLENBQUM7QUFDbkcsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQ3RELE9BQU8sRUFBQyx1QkFBdUIsRUFBYSxNQUFNLGlDQUFpQyxDQUFDO0FBQ3BGLE9BQU8sRUFBQyxZQUFZLEVBQW1CLE1BQU0sNEJBQTRCLENBQUM7QUFFMUUsT0FBTyxFQUNMLE9BQU8sRUFDUCxlQUFlLEVBQ2YsWUFBWSxFQUNaLGlCQUFpQixFQUNqQixVQUFVLEdBQ1gsTUFBTSxtQ0FBbUMsQ0FBQztBQUMzQyxPQUFPLEVBQ0wsT0FBTyxFQUNQLGFBQWEsRUFDYixJQUFJLEVBRUosTUFBTSxFQUNOLFFBQVEsRUFFUixLQUFLLEdBRU4sTUFBTSw0QkFBNEIsQ0FBQztBQUNwQyxPQUFPLEVBQUMsV0FBVyxFQUFFLFdBQVcsRUFBQyxNQUFNLDRCQUE0QixDQUFDO0FBQ3BFLE9BQU8sRUFBQyxhQUFhLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUVoRCxPQUFPLEVBQUMsK0JBQStCLEVBQUMsTUFBTSxrQkFBa0IsQ0FBQztBQUNqRSxPQUFPLEVBQUMsb0JBQW9CLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUNwRCxPQUFPLEVBQUMsb0JBQW9CLEVBQUMsTUFBTSwyQkFBMkIsQ0FBQztBQUMvRCxPQUFP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RSxhQUFhLEVBQUUsS0FBSyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7UUFDaEUsT0FBTyxLQUFLLENBQUM7SUFDZixDQUFDO0FBQ0gsQ0FBQztBQUVEOzs7Ozs7OztHQVFHO0FBQ0gsU0FBUyw4QkFBOEIsQ0FDckMsa0JBQTRDLEVBQzVDLEdBQWE7SUFFYixLQUFLLE1BQU0sQ0FBQyxRQUFRLEVBQUUsTUFBTSxDQUFDLElBQUksa0JBQWtCLEVBQUUsQ0FBQztRQUNwRCxRQUFRLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztJQUM1QyxDQUFDO0FBQ0gsQ0FBQztBQUVEOzs7R0FHRztBQUNILFNBQVMsc0JBQXNCLENBQUMsS0FBWTtJQUMxQyxJQUFJLFlBQVksR0FBRyxLQUFLLENBQUM7SUFDekIsT0FBTyxZQUFZLElBQUksSUFBSSxFQUFFLENBQUM7UUFDNUIsNERBQTREO1FBQzVELG1EQUFtRDtRQUNuRCxJQUFJLGVBQWUsQ0FBQyxZQUFZLENBQUMsRUFBRSxDQUFDO1lBQ2xDLE9BQU8sSUFBSSxDQUFDO1FBQ2QsQ0FBQztRQUNELFlBQVksR0FBRyxZQUFZLENBQUMsTUFBZSxDQUFDO0lBQzlDLENBQUM7SUFDRCxPQUFPLEtBQUssQ0FBQztBQUNmLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtBcHBsaWNhdGlvblJlZn0gZnJvbSAnLi4vYXBwbGljYXRpb24vYXBwbGljYXRpb25fcmVmJztcbmltcG9ydCB7QVBQX0lEfSBmcm9tICcuLi9hcHBsaWNhdGlvbi9hcHBsaWNhdGlvbl90b2tlbnMnO1xuaW1wb3J0IHtpc0RldGFjaGVkQnlJMThufSBmcm9tICcuLi9pMThuL3V0aWxzJztcbmltcG9ydCB7Vmlld0VuY2Fwc3VsYXRpb259IGZyb20gJy4uL21ldGFkYXRhJztcbmltcG9ydCB7UmVuZGVyZXIyfSBmcm9tICcuLi9yZW5kZXInO1xuaW1wb3J0IHthc3NlcnRUTm9kZX0gZnJvbSAnLi4vcmVuZGVyMy9hc3NlcnQnO1xuaW1wb3J0IHtjb2xsZWN0TmF0aXZlTm9kZXMsIGNvbGxlY3ROYXRpdmVOb2Rlc0luTENvbnRhaW5lcn0gZnJvbSAnLi4vcmVuZGVyMy9jb2xsZWN0X25hdGl2ZV9ub2Rlcyc7XG5pbXBvcnQge2dldENvbXBvbmVudERlZn0gZnJvbSAnLi4vcmVuZGVyMy9kZWZpbml0aW9uJztcbmltcG9ydCB7Q09OVEFJTkVSX0hFQURFUl9PRkZTRVQsIExDb250YWluZXJ9IGZyb20gJy4uL3JlbmRlcjMvaW50ZXJmYWNlcy9jb250YWluZXInO1xuaW1wb3J0IHtpc1ROb2RlU2hhcGUsIFROb2RlLCBUTm9kZVR5cGV9IGZyb20gJy4uL3JlbmRlcjMvaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7UkVsZW1lbnR9IGZyb20gJy4uL3JlbmRlcjMvaW50ZXJmYWNlcy9yZW5kZXJlcl9kb20nO1xuaW1wb3J0IHtcbiAgaGFzSTE4bixcbiAgaXNDb21wb25lbnRIb3N0LFxuICBpc0xDb250YWluZXIsXG4gIGlzUHJvamVjdGlvblROb2RlLFxuICBpc1Jvb3RWaWV3LFxufSBmcm9tICcuLi9yZW5kZXIzL2ludGVyZmFjZXMvdHlwZV9jaGVja3MnO1xuaW1wb3J0IHtcbiAgQ09OVEVYVCxcbiAgSEVBREVSX09GRlNFVCxcbiAgSE9TVCxcbiAgTFZpZXcsXG4gIFBBUkVOVCxcbiAgUkVOREVSRVIsXG4gIFRWaWV3LFxuICBUVklFVyxcbiAgVFZpZXdUeXBlLFxufSBmcm9tICcuLi9yZW5kZXIzL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge3Vud3JhcExWaWV3LCB1bndyYXBSTm9kZX0gZnJvbSAnLi4vcmVuZGVyMy91dGlsL3ZpZXdfdXRpbHMnO1xuaW1wb3J0IHtUcmFuc2ZlclN0YXRlfSBmcm9tICcuLi90cmFuc2Zlcl9zdGF0ZSc7XG5cbmltcG9ydCB7dW5zdXBwb3J0ZWRQcm9qZWN0aW9uT2ZEb21Ob2Rlc30gZnJvbSAnLi9lcnJvcl9oYW5kbGluZyc7XG5pbXBvcnQge2NvbGxlY3REb21FdmVudHNJbmZvfSBmcm9tICcuL2V2ZW50X3JlcGxheSc7XG5pbXBvcnQge3NldEpTQWN0aW9uQXR0cmlidXRlfSBmcm9tICcuLi9ldmVudF9kZWxlZ2F0aW9uX3V0aWxzJztcbmltcG9ydCB7XG4gIGdldE9yQ29tcHV0ZUkxOG5DaGlsZHJlbixcbiAgaXNJMThuSHlkcmF0aW9uRW5hYmxlZCxcbiAgaXNJMThuSHlkcmF0aW9uU3VwcG9ydEVuYWJsZWQsXG4gIHRyeVNlcmlhbGl6ZUkxOG5CbG9jayxcbn0gZnJvbSAnLi9pMThuJztcbmltcG9ydCB7XG4gIENPTlRBSU5FUlMsXG4gIERJU0NPTk5FQ1RFRF9OT0RFUyxcbiAgRUxFTUVOVF9DT05UQUlORVJTLFxuICBJMThOX0RBVEEsXG4gIE1VTFRJUExJRVIsXG4gIE5PREVTLFxuICBOVU1fUk9PVF9OT0RFUyxcbiAgU2VyaWFsaXplZENvbnRhaW5lclZpZXcsXG4gIFNlcmlhbGl6ZWRWaWV3LFxuICBURU1QTEFURV9JRCxcbiAgVEVNUExBVEVTLFxufSBmcm9tICcuL2ludGVyZmFjZXMnO1xuaW1wb3J0IHtjYWxjUGF0aEZvck5vZGUsIGlzRGlzY29ubmVjdGVkTm9kZX0gZnJvbSAnLi9ub2RlX2xvb2t1cF91dGlscyc7XG5pbXBvcnQge2lzSW5Ta2lwSHlkcmF0aW9uQmxvY2ssIFNLSVBfSFlEUkFUSU9OX0FUVFJfTkFNRX0gZnJvbSAnLi9za2lwX2h5ZHJhdGlvbic7XG5pbXBvcnQge0VWRU5UX1JFUExBWV9FTkFCTEVEX0RFRkFVTFQsIElTX0VWRU5UX1JFUExBWV9FTkFCTEVEfSBmcm9tICcuL3Rva2Vucyc7XG5pbXBvcnQge1xuICBnZXRMTm9kZUZvckh5ZHJhdGlvbixcbiAgTkdIX0FUVFJfTkFNRSxcbiAgTkdIX0RBVEFfS0VZLFxuICBwcm9jZXNzVGV4dE5vZGVCZWZvcmVTZXJpYWxpemF0aW9uLFxuICBUZXh0Tm9kZU1hcmtlcixcbn0gZnJvbSAnLi91dGlscyc7XG5cbi8qKlxuICogQSBjb2xsZWN0aW9uIHRoYXQgdHJhY2tzIGFsbCBzZXJpYWxpemVkIHZpZXdzIChgbmdoYCBET00gYW5ub3RhdGlvbnMpXG4gKiB0byBhdm9pZCBkdXBsaWNhdGlvbi4gQW4gYXR0ZW1wdCB0byBhZGQgYSBkdXBsaWNhdGUgdmlldyByZXN1bHRzIGluIHRoZVxuICogY29sbGVjdGlvbiByZXR1cm5pbmcgdGhlIGluZGV4IG9mIHRoZSBwcmV2aW91c2x5IGNvbGxlY3RlZCBzZXJpYWxpemVkIHZpZXcuXG4gKiBUaGlzIHJlZHVjZXMgdGhlIG51bWJlciBvZiBhbm5vdGF0aW9ucyBuZWVkZWQgZm9yIGEgZ2l2ZW4gcGFnZS5cbiAqL1xuY2xhc3MgU2VyaWFsaXplZFZpZXdDb2xsZWN0aW9uIHtcbiAgcHJpdmF0ZSB2aWV3czogU2VyaWFsaXplZFZpZXdbXSA9IFtdO1xuICBwcml2YXRlIGluZGV4QnlDb250ZW50ID0gbmV3IE1hcDxzdHJpbmcsIG51bWJlcj4oKTtcblxuICBhZGQoc2VyaWFsaXplZFZpZXc6IFNlcmlhbGl6ZWRWaWV3KTogbnVtYmVyIHtcbiAgICBjb25zdCB2aWV3QXNTdHJpbmcgPSBKU09OLnN0cmluZ2lmeShzZXJpYWxpemVkVmlldyk7XG4gICAgaWYgKCF0aGlzLmluZGV4QnlDb250ZW50Lmhhcyh2aWV3QXNTdHJpbmcpKSB7XG4gICAgICBjb25zdCBpbmRleCA9IHRoaXMudmlld3MubGVuZ3RoO1xuICAgICAgdGhpcy52aWV3cy5wdXNoKHNlcmlhbGl6ZWRWaWV3KTtcbiAgICAgIHRoaXMuaW5kZXhCeUNvbnRlbnQuc2V0KHZpZXdBc1N0cmluZywgaW5kZXgpO1xuICAgICAgcmV0dXJuIGluZGV4O1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5pbmRleEJ5Q29udGVudC5nZXQodmlld0FzU3RyaW5nKSE7XG4gIH1cblxuICBnZXRBbGwoKTogU2VyaWFsaXplZFZpZXdbXSB7XG4gICAgcmV0dXJuIHRoaXMudmlld3M7XG4gIH1cbn1cblxuLyoqXG4gKiBHbG9iYWwgY291bnRlciB0aGF0IGlzIHVzZWQgdG8gZ2VuZXJhdGUgYSB1bmlxdWUgaWQgZm9yIFRWaWV3c1xuICogZHVyaW5nIHRoZSBzZXJpYWxpemF0aW9uIHByb2Nlc3MuXG4gKi9cbmxldCB0Vmlld1NzcklkID0gMDtcblxuLyoqXG4gKiBHZW5lcmF0ZXMgYSB1bmlxdWUgaWQgZm9yIGEgZ2l2ZW4gVFZpZXcgYW5kIHJldHVybnMgdGhpcyBpZC5cbiAqIFRoZSBpZCBpcyBhbHNvIHN0b3JlZCBvbiB0aGlzIGluc3RhbmNlIG9mIGEgVFZpZXcgYW5kIHJldXNlZCBpblxuICogc3Vic2VxdWVudCBjYWxscy5cbiAqXG4gKiBUaGlzIGlkIGlzIG5lZWRlZCB0byB1bmlxdWVseSBpZGVudGlmeSBhbmQgcGljayB1cCBkZWh5ZHJhdGVkIHZpZXdzXG4gKiBhdCBydW50aW1lLlxuICovXG5mdW5jdGlvbiBnZXRTc3JJZCh0VmlldzogVFZpZXcpOiBzdHJpbmcge1xuICBpZiAoIXRWaWV3LnNzcklkKSB7XG4gICAgdFZpZXcuc3NySWQgPSBgdCR7dFZpZXdTc3JJZCsrfWA7XG4gIH1cbiAgcmV0dXJuIHRWaWV3LnNzcklkO1xufVxuXG4vKipcbiAqIERlc2NyaWJlcyBhIGNvbnRleHQgYXZhaWxhYmxlIGR1cmluZyB0aGUgc2VyaWFsaXphdGlvblxuICogcHJvY2Vzcy4gVGhlIGNvbnRleHQgaXMgdXNlZCB0byBzaGFyZSBhbmQgY29sbGVjdCBpbmZvcm1hdGlvblxuICogZHVyaW5nIHRoZSBzZXJpYWxpemF0aW9uLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIEh5ZHJhdGlvbkNvbnRleHQge1xuICBzZXJpYWxpemVkVmlld0NvbGxlY3Rpb246IFNlcmlhbGl6ZWRWaWV3Q29sbGVjdGlvbjtcbiAgY29ycnVwdGVkVGV4dE5vZGVzOiBNYXA8SFRNTEVsZW1lbnQsIFRleHROb2RlTWFya2VyPjtcbiAgaXNJMThuSHlkcmF0aW9uRW5hYmxlZDogYm9vbGVhbjtcbiAgaTE4bkNoaWxkcmVuOiBNYXA8VFZpZXcsIFNldDxudW1iZXI+IHwgbnVsbD47XG4gIGV2ZW50VHlwZXNUb1JlcGxheToge3JlZ3VsYXI6IFNldDxzdHJpbmc+OyBjYXB0dXJlOiBTZXQ8c3RyaW5nPn07XG4gIHNob3VsZFJlcGxheUV2ZW50czogYm9vbGVhbjtcbn1cblxuLyoqXG4gKiBDb21wdXRlcyB0aGUgbnVtYmVyIG9mIHJvb3Qgbm9kZXMgaW4gYSBnaXZlbiB2aWV3XG4gKiAob3IgY2hpbGQgbm9kZXMgaW4gYSBnaXZlbiBjb250YWluZXIgaWYgYSB0Tm9kZSBpcyBwcm92aWRlZCkuXG4gKi9cbmZ1bmN0aW9uIGNhbGNOdW1Sb290Tm9kZXModFZpZXc6IFRWaWV3LCBsVmlldzogTFZpZXcsIHROb2RlOiBUTm9kZSB8IG51bGwpOiBudW1iZXIge1xuICBjb25zdCByb290Tm9kZXM6IHVua25vd25bXSA9IFtdO1xuICBjb2xsZWN0TmF0aXZlTm9kZXModFZpZXcsIGxWaWV3LCB0Tm9kZSwgcm9vdE5vZGVzKTtcbiAgcmV0dXJuIHJvb3ROb2Rlcy5sZW5ndGg7XG59XG5cbi8qKlxuICogQ29tcHV0ZXMgdGhlIG51bWJlciBvZiByb290IG5vZGVzIGluIGFsbCB2aWV3cyBpbiBhIGdpdmVuIExDb250YWluZXIuXG4gKi9cbmZ1bmN0aW9uIGNhbGNOdW1Sb290Tm9kZXNJbkxDb250YWluZXIobENvbnRhaW5lcjogTENvbnRhaW5lcik6IG51bWJlciB7XG4gIGNvbnN0IHJvb3ROb2RlczogdW5rbm93bltdID0gW107XG4gIGNvbGxlY3ROYXRpdmVOb2Rlc0luTENvbnRhaW5lcihsQ29udGFpbmVyLCByb290Tm9kZXMpO1xuICByZXR1cm4gcm9vdE5vZGVzLmxlbmd0aDtcbn1cblxuLyoqXG4gKiBBbm5vdGF0ZXMgcm9vdCBsZXZlbCBjb21wb25lbnQncyBMVmlldyBmb3IgaHlkcmF0aW9uLFxuICogc2VlIGBhbm5vdGF0ZUhvc3RFbGVtZW50Rm9ySHlkcmF0aW9uYCBmb3IgYWRkaXRpb25hbCBpbmZvcm1hdGlvbi5cbiAqL1xuZnVuY3Rpb24gYW5ub3RhdGVDb21wb25lbnRMVmlld0Zvckh5ZHJhdGlvbihcbiAgbFZpZXc6IExWaWV3LFxuICBjb250ZXh0OiBIeWRyYXRpb25Db250ZXh0LFxuKTogbnVtYmVyIHwgbnVsbCB7XG4gIGNvbnN0IGhvc3RFbGVtZW50ID0gbFZpZXdbSE9TVF07XG4gIC8vIFJvb3QgZWxlbWVudHMgbWlnaHQgYWxzbyBiZSBhbm5vdGF0ZWQgd2l0aCB0aGUgYG5nU2tpcEh5ZHJhdGlvbmAgYXR0cmlidXRlLFxuICAvLyBjaGVjayBpZiBpdCdzIHByZXNlbnQgYmVmb3JlIHN0YXJ0aW5nIHRoZSBzZXJpYWxpemF0aW9uIHByb2Nlc3MuXG4gIGlmIChob3N0RWxlbWVudCAmJiAhKGhvc3RFbGVtZW50IGFzIEhUTUxFbGVtZW50KS5oYXNBdHRyaWJ1dGUoU0tJUF9IWURSQVRJT05fQVRUUl9OQU1FKSkge1xuICAgIHJldHVybiBhbm5vdGF0ZUhvc3RFbGVtZW50Rm9ySHlkcmF0aW9uKGhvc3RFbGVtZW50IGFzIEhUTUxFbGVtZW50LCBsVmlldywgY29udGV4dCk7XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbi8qKlxuICogQW5ub3RhdGVzIHJvb3QgbGV2ZWwgTENvbnRhaW5lciBmb3IgaHlkcmF0aW9uLiBUaGlzIGhhcHBlbnMgd2hlbiBhIHJvb3QgY29tcG9uZW50XG4gKiBpbmplY3RzIFZpZXdDb250YWluZXJSZWYsIHRodXMgbWFraW5nIHRoZSBjb21wb25lbnQgYW4gYW5jaG9yIGZvciBhIHZpZXcgY29udGFpbmVyLlxuICogVGhpcyBmdW5jdGlvbiBzZXJpYWxpemVzIHRoZSBjb21wb25lbnQgaXRzZWxmIGFzIHdlbGwgYXMgYWxsIHZpZXdzIGZyb20gdGhlIHZpZXdcbiAqIGNvbnRhaW5lci5cbiAqL1xuZnVuY3Rpb24gYW5ub3RhdGVMQ29udGFpbmVyRm9ySHlkcmF0aW9uKGxDb250YWluZXI6IExDb250YWluZXIsIGNvbnRleHQ6IEh5ZHJhdGlvbkNvbnRleHQpIHtcbiAgY29uc3QgY29tcG9uZW50TFZpZXcgPSB1bndyYXBMVmlldyhsQ29udGFpbmVyW0hPU1RdKSBhcyBMVmlldzx1bmtub3duPjtcblxuICAvLyBTZXJpYWxpemUgdGhlIHJvb3QgY29tcG9uZW50IGl0c2VsZi5cbiAgY29uc3QgY29tcG9uZW50TFZpZXdOZ2hJbmRleCA9IGFubm90YXRlQ29tcG9uZW50TFZpZXdGb3JIeWRyYXRpb24oY29tcG9uZW50TFZpZXcsIGNvbnRleHQpO1xuXG4gIGlmIChjb21wb25lbnRMVmlld05naEluZGV4ID09PSBudWxsKSB7XG4gICAgLy8gQ29tcG9uZW50IHdhcyBub3Qgc2VyaWFsaXplZCAoZm9yIGV4YW1wbGUsIGlmIGh5ZHJhdGlvbiB3YXMgc2tpcHBlZCBieSBhZGRpbmdcbiAgICAvLyB0aGUgYG5nU2tpcEh5ZHJhdGlvbmAgYXR0cmlidXRlIG9yIHRoaXMgY29tcG9uZW50IHVzZXMgaTE4biBibG9ja3MgaW4gdGhlIHRlbXBsYXRlLFxuICAgIC8vIGJ1dCBgd2l0aEkxOG5TdXBwb3J0KClgIHdhcyBub3QgYWRkZWQpLCBhdm9pZCBhbm5vdGF0aW5nIGhvc3QgZWxlbWVudCB3aXRoIHRoZSBgbmdoYFxuICAgIC8vIGF0dHJpYnV0ZS5cbiAgICByZXR1cm47XG4gIH1cblxuICBjb25zdCBob3N0RWxlbWVudCA9IHVud3JhcFJOb2RlKGNvbXBvbmVudExWaWV3W0hPU1RdISkgYXMgSFRNTEVsZW1lbnQ7XG5cbiAgLy8gU2VyaWFsaXplIGFsbCB2aWV3cyB3aXRoaW4gdGhpcyB2aWV3IGNvbnRhaW5lci5cbiAgY29uc3Qgcm9vdExWaWV3ID0gbENvbnRhaW5lcltQQVJFTlRdO1xuICBjb25zdCByb290TFZpZXdOZ2hJbmRleCA9IGFubm90YXRlSG9zdEVsZW1lbnRGb3JIeWRyYXRpb24oaG9zdEVsZW1lbnQsIHJvb3RMVmlldywgY29udGV4dCk7XG5cbiAgY29uc3QgcmVuZGVyZXIgPSBjb21wb25lbnRMVmlld1tSRU5ERVJFUl0gYXMgUmVuZGVyZXIyO1xuXG4gIC8vIEZvciBjYXNlcyB3aGVuIGEgcm9vdCBjb21wb25lbnQgYWxzbyBhY3RzIGFzIGFuIGFuY2hvciBub2RlIGZvciBhIFZpZXdDb250YWluZXJSZWZcbiAgLy8gKGZvciBleGFtcGxlLCB3aGVuIFZpZXdDb250YWluZXJSZWYgaXMgaW5qZWN0ZWQgaW4gYSByb290IGNvbXBvbmVudCksIHRoZXJlIGlzIGEgbmVlZFxuICAvLyB0byBzZXJpYWxpemUgaW5mb3JtYXRpb24gYWJvdXQgdGhlIGNvbXBvbmVudCBpdHNlbGYsIGFzIHdlbGwgYXMgYW4gTENvbnRhaW5lciB0aGF0XG4gIC8vIHJlcHJlc2VudHMgdGhpcyBWaWV3Q29udGFpbmVyUmVmLiBFZmZlY3RpdmVseSwgd2UgbmVlZCB0byBzZXJpYWxpemUgMiBwaWVjZXMgb2YgaW5mbzpcbiAgLy8gKDEpIGh5ZHJhdGlvbiBpbmZvIGZvciB0aGUgcm9vdCBjb21wb25lbnQgaXRzZWxmIGFuZCAoMikgaHlkcmF0aW9uIGluZm8gZm9yIHRoZVxuICAvLyBWaWV3Q29udGFpbmVyUmVmIGluc3RhbmNlIChhbiBMQ29udGFpbmVyKS4gRWFjaCBwaWVjZSBvZiBpbmZvcm1hdGlvbiBpcyBpbmNsdWRlZCBpbnRvXG4gIC8vIHRoZSBoeWRyYXRpb24gZGF0YSAoaW4gdGhlIFRyYW5zZmVyU3RhdGUgb2JqZWN0KSBzZXBhcmF0ZWx5LCB0aHVzIHdlIGVuZCB1cCB3aXRoIDIgaWRzLlxuICAvLyBTaW5jZSB3ZSBvbmx5IGhhdmUgMSByb290IGVsZW1lbnQsIHdlIGVuY29kZSBib3RoIGJpdHMgb2YgaW5mbyBpbnRvIGEgc2luZ2xlIHN0cmluZzpcbiAgLy8gaWRzIGFyZSBzZXBhcmF0ZWQgYnkgdGhlIGB8YCBjaGFyIChlLmcuIGAxMHwyNWAsIHdoZXJlIGAxMGAgaXMgdGhlIG5naCBmb3IgYSBjb21wb25lbnQgdmlld1xuICAvLyBhbmQgMjUgaXMgdGhlIGBuZ2hgIGZvciBhIHJvb3QgdmlldyB3aGljaCBob2xkcyBMQ29udGFpbmVyKS5cbiAgY29uc3QgZmluYWxJbmRleCA9IGAke2NvbXBvbmVudExWaWV3TmdoSW5kZXh9fCR7cm9vdExWaWV3TmdoSW5kZXh9YDtcbiAgcmVuZGVyZXIuc2V0QXR0cmlidXRlKGhvc3RFbGVtZW50LCBOR0hfQVRUUl9OQU1FLCBmaW5hbEluZGV4KTtcbn1cblxuLyoqXG4gKiBBbm5vdGF0ZXMgYWxsIGNvbXBvbmVudHMgYm9vdHN0cmFwcGVkIGluIGEgZ2l2ZW4gQXBwbGljYXRpb25SZWZcbiAqIHdpdGggaW5mbyBuZWVkZWQgZm9yIGh5ZHJhdGlvbi5cbiAqXG4gKiBAcGFyYW0gYXBwUmVmIEFuIGluc3RhbmNlIG9mIGFuIEFwcGxpY2F0aW9uUmVmLlxuICogQHBhcmFtIGRvYyBBIHJlZmVyZW5jZSB0byB0aGUgY3VycmVudCBEb2N1bWVudCBpbnN0YW5jZS5cbiAqIEByZXR1cm4gZXZlbnQgdHlwZXMgdGhhdCBuZWVkIHRvIGJlIHJlcGxheWVkXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhbm5vdGF0ZUZvckh5ZHJhdGlvbihhcHBSZWY6IEFwcGxpY2F0aW9uUmVmLCBkb2M6IERvY3VtZW50KSB7XG4gIGNvbnN0IGluamVjdG9yID0gYXBwUmVmLmluamVjdG9yO1xuICBjb25zdCBpc0kxOG5IeWRyYXRpb25FbmFibGVkVmFsID0gaXNJMThuSHlkcmF0aW9uRW5hYmxlZChpbmplY3Rvcik7XG4gIGNvbnN0IHNlcmlhbGl6ZWRWaWV3Q29sbGVjdGlvbiA9IG5ldyBTZXJpYWxpemVkVmlld0NvbGxlY3Rpb24oKTtcbiAgY29uc3QgY29ycnVwdGVkVGV4dE5vZGVzID0gbmV3IE1hcDxIVE1MRWxlbWVudCwgVGV4dE5vZGVNYXJrZXI+KCk7XG4gIGNvbnN0IHZpZXdSZWZzID0gYXBwUmVmLl92aWV3cztcbiAgY29uc3Qgc2hvdWxkUmVwbGF5RXZlbnRzID0gaW5qZWN0b3IuZ2V0KElTX0VWRU5UX1JFUExBWV9FTkFCTEVELCBFVkVOVF9SRVBMQVlfRU5BQkxFRF9ERUZBVUxUKTtcbiAgY29uc3QgZXZlbnRUeXBlc1RvUmVwbGF5ID0ge1xuICAgIHJlZ3VsYXI6IG5ldyBTZXQ8c3RyaW5nPigpLFxuICAgIGNhcHR1cmU6IG5ldyBTZXQ8c3RyaW5nPigpLFxuICB9O1xuICBmb3IgKGNvbnN0IHZpZXdSZWYgb2Ygdmlld1JlZnMpIHtcbiAgICBjb25zdCBsTm9kZSA9IGdldExOb2RlRm9ySHlkcmF0aW9uKHZpZXdSZWYpO1xuXG4gICAgLy8gQW4gYGxWaWV3YCBtaWdodCBiZSBgbnVsbGAgaWYgYSBgVmlld1JlZmAgcmVwcmVzZW50c1xuICAgIC8vIGFuIGVtYmVkZGVkIHZpZXcgKG5vdCBhIGNvbXBvbmVudCB2aWV3KS5cbiAgICBpZiAobE5vZGUgIT09IG51bGwpIHtcbiAgICAgIGNvbnN0IGNvbnRleHQ6IEh5ZHJhdGlvbkNvbnRleHQgPSB7XG4gICAgICAgIHNlcmlhbGl6ZWRWaWV3Q29sbGVjdGlvbixcbiAgICAgICAgY29ycnVwdGVkVGV4dE5vZGVzLFxuICAgICAgICBpc0kxOG5IeWRyYXRpb25FbmFibGVkOiBpc0kxOG5IeWRyYXRpb25FbmFibGVkVmFsLFxuICAgICAgICBpMThuQ2hpbGRyZW46IG5ldyBNYXAoKSxcbiAgICAgICAgZXZlbnRUeXBlc1RvUmVwbGF5LFxuICAgICAgICBzaG91bGRSZXBsYXlFdmVudHMsXG4gICAgICB9O1xuICAgICAgaWYgKGlzTENvbnRhaW5lcihsTm9kZSkpIHtcbiAgICAgICAgYW5ub3RhdGVMQ29udGFpbmVyRm9ySHlkcmF0aW9uKGxOb2RlLCBjb250ZXh0KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGFubm90YXRlQ29tcG9uZW50TFZpZXdGb3JIeWRyYXRpb24obE5vZGUsIGNvbnRleHQpO1xuICAgICAgfVxuICAgICAgaW5zZXJ0Q29ycnVwdGVkVGV4dE5vZGVNYXJrZXJzKGNvcnJ1cHRlZFRleHROb2RlcywgZG9jKTtcbiAgICB9XG4gIH1cblxuICAvLyBOb3RlOiB3ZSAqYWx3YXlzKiBpbmNsdWRlIGh5ZHJhdGlvbiBpbmZvIGtleSBhbmQgYSBjb3JyZXNwb25kaW5nIHZhbHVlXG4gIC8vIGludG8gdGhlIFRyYW5zZmVyU3RhdGUsIGV2ZW4gaWYgdGhlIGxpc3Qgb2Ygc2VyaWFsaXplZCB2aWV3cyBpcyBlbXB0eS5cbiAgLy8gVGhpcyBpcyBuZWVkZWQgYXMgYSBzaWduYWwgdG8gdGhlIGNsaWVudCB0aGF0IHRoZSBzZXJ2ZXIgcGFydCBvZiB0aGVcbiAgLy8gaHlkcmF0aW9uIGxvZ2ljIHdhcyBzZXR1cCBhbmQgZW5hYmxlZCBjb3JyZWN0bHkuIE90aGVyd2lzZSwgaWYgYSBjbGllbnRcbiAgLy8gaHlkcmF0aW9uIGRvZXNuJ3QgZmluZCBhIGtleSBpbiB0aGUgdHJhbnNmZXIgc3RhdGUgLSBhbiBlcnJvciBpcyBwcm9kdWNlZC5cbiAgY29uc3Qgc2VyaWFsaXplZFZpZXdzID0gc2VyaWFsaXplZFZpZXdDb2xsZWN0aW9uLmdldEFsbCgpO1xuICBjb25zdCB0cmFuc2ZlclN0YXRlID0gaW5qZWN0b3IuZ2V0KFRyYW5zZmVyU3RhdGUpO1xuICB0cmFuc2ZlclN0YXRlLnNldChOR0hfREFUQV9LRVksIHNlcmlhbGl6ZWRWaWV3cyk7XG4gIHJldHVybiBldmVudFR5cGVzVG9SZXBsYXk7XG59XG5cbi8qKlxuICogU2VyaWFsaXplcyB0aGUgbENvbnRhaW5lciBkYXRhIGludG8gYSBsaXN0IG9mIFNlcmlhbGl6ZWRWaWV3IG9iamVjdHMsXG4gKiB0aGF0IHJlcHJlc2VudCB2aWV3cyB3aXRoaW4gdGhpcyBsQ29udGFpbmVyLlxuICpcbiAqIEBwYXJhbSBsQ29udGFpbmVyIHRoZSBsQ29udGFpbmVyIHdlIGFyZSBzZXJpYWxpemluZ1xuICogQHBhcmFtIGNvbnRleHQgdGhlIGh5ZHJhdGlvbiBjb250ZXh0XG4gKiBAcmV0dXJucyBhbiBhcnJheSBvZiB0aGUgYFNlcmlhbGl6ZWRWaWV3YCBvYmplY3RzXG4gKi9cbmZ1bmN0aW9uIHNlcmlhbGl6ZUxDb250YWluZXIoXG4gIGxDb250YWluZXI6IExDb250YWluZXIsXG4gIGNvbnRleHQ6IEh5ZHJhdGlvbkNvbnRleHQsXG4pOiBTZXJpYWxpemVkQ29udGFpbmVyVmlld1tdIHtcbiAgY29uc3Qgdmlld3M6IFNlcmlhbGl6ZWRDb250YWluZXJWaWV3W10gPSBbXTtcbiAgbGV0IGxhc3RWaWV3QXNTdHJpbmcgPSAnJztcblxuICBmb3IgKGxldCBpID0gQ09OVEFJTkVSX0hFQURFUl9PRkZTRVQ7IGkgPCBsQ29udGFpbmVyLmxlbmd0aDsgaSsrKSB7XG4gICAgbGV0IGNoaWxkTFZpZXcgPSBsQ29udGFpbmVyW2ldIGFzIExWaWV3O1xuXG4gICAgbGV0IHRlbXBsYXRlOiBzdHJpbmc7XG4gICAgbGV0IG51bVJvb3ROb2RlczogbnVtYmVyO1xuICAgIGxldCBzZXJpYWxpemVkVmlldzogU2VyaWFsaXplZENvbnRhaW5lclZpZXcgfCB1bmRlZmluZWQ7XG5cbiAgICBpZiAoaXNSb290VmlldyhjaGlsZExWaWV3KSkge1xuICAgICAgLy8gSWYgdGhpcyBpcyBhIHJvb3QgdmlldywgZ2V0IGFuIExWaWV3IGZvciB0aGUgdW5kZXJseWluZyBjb21wb25lbnQsXG4gICAgICAvLyBiZWNhdXNlIGl0IGNvbnRhaW5zIGluZm9ybWF0aW9uIGFib3V0IHRoZSB2aWV3IHRvIHNlcmlhbGl6ZS5cbiAgICAgIGNoaWxkTFZpZXcgPSBjaGlsZExWaWV3W0hFQURFUl9PRkZTRVRdO1xuXG4gICAgICAvLyBJZiB3ZSBoYXZlIGFuIExDb250YWluZXIgYXQgdGhpcyBwb3NpdGlvbiwgdGhpcyBpbmRpY2F0ZXMgdGhhdCB0aGVcbiAgICAgIC8vIGhvc3QgZWxlbWVudCB3YXMgdXNlZCBhcyBhIFZpZXdDb250YWluZXJSZWYgYW5jaG9yIChlLmcuIGEgYFZpZXdDb250YWluZXJSZWZgXG4gICAgICAvLyB3YXMgaW5qZWN0ZWQgd2l0aGluIHRoZSBjb21wb25lbnQgY2xhc3MpLiBUaGlzIGNhc2UgcmVxdWlyZXMgc3BlY2lhbCBoYW5kbGluZy5cbiAgICAgIGlmIChpc0xDb250YWluZXIoY2hpbGRMVmlldykpIHtcbiAgICAgICAgLy8gQ2FsY3VsYXRlIHRoZSBudW1iZXIgb2Ygcm9vdCBub2RlcyBpbiBhbGwgdmlld3MgaW4gYSBnaXZlbiBjb250YWluZXJcbiAgICAgICAgLy8gYW5kIGluY3JlbWVudCBieSBvbmUgdG8gYWNjb3VudCBmb3IgYW4gYW5jaG9yIG5vZGUgaXRzZWxmLCBpLmUuIGluIHRoaXNcbiAgICAgICAgLy8gc2NlbmFyaW8gd2UnbGwgaGF2ZSBhIGxheW91dCB0aGF0IHdvdWxkIGxvb2sgbGlrZSB0aGlzOlxuICAgICAgICAvLyBgPGFwcC1yb290IC8+PCNWSUVXMT48I1ZJRVcyPi4uLjwhLS1jb250YWluZXItLT5gXG4gICAgICAgIC8vIFRoZSBgKzFgIGlzIHRvIGNhcHR1cmUgdGhlIGA8YXBwLXJvb3QgLz5gIGVsZW1lbnQuXG4gICAgICAgIG51bVJvb3ROb2RlcyA9IGNhbGNOdW1Sb290Tm9kZXNJbkxDb250YWluZXIoY2hpbGRMVmlldykgKyAxO1xuXG4gICAgICAgIGFubm90YXRlTENvbnRhaW5lckZvckh5ZHJhdGlvbihjaGlsZExWaWV3LCBjb250ZXh0KTtcblxuICAgICAgICBjb25zdCBjb21wb25lbnRMVmlldyA9IHVud3JhcExWaWV3KGNoaWxkTFZpZXdbSE9TVF0pIGFzIExWaWV3PHVua25vd24+O1xuXG4gICAgICAgIHNlcmlhbGl6ZWRWaWV3ID0ge1xuICAgICAgICAgIFtURU1QTEFURV9JRF06IGNvbXBvbmVudExWaWV3W1RWSUVXXS5zc3JJZCEsXG4gICAgICAgICAgW05VTV9ST09UX05PREVTXTogbnVtUm9vdE5vZGVzLFxuICAgICAgICB9O1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmICghc2VyaWFsaXplZFZpZXcpIHtcbiAgICAgIGNvbnN0IGNoaWxkVFZpZXcgPSBjaGlsZExWaWV3W1RWSUVXXTtcblxuICAgICAgaWYgKGNoaWxkVFZpZXcudHlwZSA9PT0gVFZpZXdUeXBlLkNvbXBvbmVudCkge1xuICAgICAgICB0ZW1wbGF0ZSA9IGNoaWxkVFZpZXcuc3NySWQhO1xuXG4gICAgICAgIC8vIFRoaXMgaXMgYSBjb21wb25lbnQgdmlldywgdGh1cyBpdCBoYXMgb25seSAxIHJvb3Qgbm9kZTogdGhlIGNvbXBvbmVudFxuICAgICAgICAvLyBob3N0IG5vZGUgaXRzZWxmIChvdGhlciBub2RlcyB3b3VsZCBiZSBpbnNpZGUgdGhhdCBob3N0IG5vZGUpLlxuICAgICAgICBudW1Sb290Tm9kZXMgPSAxO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGVtcGxhdGUgPSBnZXRTc3JJZChjaGlsZFRWaWV3KTtcbiAgICAgICAgbnVtUm9vdE5vZGVzID0gY2FsY051bVJvb3ROb2RlcyhjaGlsZFRWaWV3LCBjaGlsZExWaWV3LCBjaGlsZFRWaWV3LmZpcnN0Q2hpbGQpO1xuICAgICAgfVxuXG4gICAgICBzZXJpYWxpemVkVmlldyA9IHtcbiAgICAgICAgW1RFTVBMQVRFX0lEXTogdGVtcGxhdGUsXG4gICAgICAgIFtOVU1fUk9PVF9OT0RFU106IG51bVJvb3ROb2RlcyxcbiAgICAgICAgLi4uc2VyaWFsaXplTFZpZXcobENvbnRhaW5lcltpXSBhcyBMVmlldywgY29udGV4dCksXG4gICAgICB9O1xuICAgIH1cblxuICAgIC8vIENoZWNrIGlmIHRoZSBwcmV2aW91cyB2aWV3IGhhcyB0aGUgc2FtZSBzaGFwZSAoZm9yIGV4YW1wbGUsIGl0IHdhc1xuICAgIC8vIHByb2R1Y2VkIGJ5IHRoZSAqbmdGb3IpLCBpbiB3aGljaCBjYXNlIGJ1bXAgdGhlIGNvdW50ZXIgb24gdGhlIHByZXZpb3VzXG4gICAgLy8gdmlldyBpbnN0ZWFkIG9mIGluY2x1ZGluZyB0aGUgc2FtZSBpbmZvcm1hdGlvbiBhZ2Fpbi5cbiAgICBjb25zdCBjdXJyZW50Vmlld0FzU3RyaW5nID0gSlNPTi5zdHJpbmdpZnkoc2VyaWFsaXplZFZpZXcpO1xuICAgIGlmICh2aWV3cy5sZW5ndGggPiAwICYmIGN1cnJlbnRWaWV3QXNTdHJpbmcgPT09IGxhc3RWaWV3QXNTdHJpbmcpIHtcbiAgICAgIGNvbnN0IHByZXZpb3VzVmlldyA9IHZpZXdzW3ZpZXdzLmxlbmd0aCAtIDFdO1xuICAgICAgcHJldmlvdXNWaWV3W01VTFRJUExJRVJdID8/PSAxO1xuICAgICAgcHJldmlvdXNWaWV3W01VTFRJUExJRVJdKys7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIFJlY29yZCB0aGlzIHZpZXcgYXMgbW9zdCByZWNlbnRseSBhZGRlZC5cbiAgICAgIGxhc3RWaWV3QXNTdHJpbmcgPSBjdXJyZW50Vmlld0FzU3RyaW5nO1xuICAgICAgdmlld3MucHVzaChzZXJpYWxpemVkVmlldyk7XG4gICAgfVxuICB9XG4gIHJldHVybiB2aWV3cztcbn1cblxuLyoqXG4gKiBIZWxwZXIgZnVuY3Rpb24gdG8gcHJvZHVjZSBhIG5vZGUgcGF0aCAod2hpY2ggbmF2aWdhdGlvbiBzdGVwcyBydW50aW1lIGxvZ2ljXG4gKiBuZWVkcyB0byB0YWtlIHRvIGxvY2F0ZSBhIG5vZGUpIGFuZCBzdG9yZXMgaXQgaW4gdGhlIGBOT0RFU2Agc2VjdGlvbiBvZiB0aGVcbiAqIGN1cnJlbnQgc2VyaWFsaXplZCB2aWV3LlxuICovXG5mdW5jdGlvbiBhcHBlbmRTZXJpYWxpemVkTm9kZVBhdGgoXG4gIG5naDogU2VyaWFsaXplZFZpZXcsXG4gIHROb2RlOiBUTm9kZSxcbiAgbFZpZXc6IExWaWV3LFxuICBleGNsdWRlZFBhcmVudE5vZGVzOiBTZXQ8bnVtYmVyPiB8IG51bGwsXG4pIHtcbiAgY29uc3Qgbm9PZmZzZXRJbmRleCA9IHROb2RlLmluZGV4IC0gSEVBREVSX09GRlNFVDtcbiAgbmdoW05PREVTXSA/Pz0ge307XG4gIC8vIEVuc3VyZSB3ZSBkb24ndCBjYWxjdWxhdGUgdGhlIHBhdGggbXVsdGlwbGUgdGltZXMuXG4gIG5naFtOT0RFU11bbm9PZmZzZXRJbmRleF0gPz89IGNhbGNQYXRoRm9yTm9kZSh0Tm9kZSwgbFZpZXcsIGV4Y2x1ZGVkUGFyZW50Tm9kZXMpO1xufVxuXG4vKipcbiAqIEhlbHBlciBmdW5jdGlvbiB0byBhcHBlbmQgaW5mb3JtYXRpb24gYWJvdXQgYSBkaXNjb25uZWN0ZWQgbm9kZS5cbiAqIFRoaXMgaW5mbyBpcyBuZWVkZWQgYXQgcnVudGltZSB0byBhdm9pZCBET00gbG9va3VwcyBmb3IgdGhpcyBlbGVtZW50XG4gKiBhbmQgaW5zdGVhZCwgdGhlIGVsZW1lbnQgd291bGQgYmUgY3JlYXRlZCBmcm9tIHNjcmF0Y2guXG4gKi9cbmZ1bmN0aW9uIGFwcGVuZERpc2Nvbm5lY3RlZE5vZGVJbmRleChuZ2g6IFNlcmlhbGl6ZWRWaWV3LCB0Tm9kZU9yTm9PZmZzZXRJbmRleDogVE5vZGUgfCBudW1iZXIpIHtcbiAgY29uc3Qgbm9PZmZzZXRJbmRleCA9XG4gICAgdHlwZW9mIHROb2RlT3JOb09mZnNldEluZGV4ID09PSAnbnVtYmVyJ1xuICAgICAgPyB0Tm9kZU9yTm9PZmZzZXRJbmRleFxuICAgICAgOiB0Tm9kZU9yTm9PZmZzZXRJbmRleC5pbmRleCAtIEhFQURFUl9PRkZTRVQ7XG4gIG5naFtESVNDT05ORUNURURfTk9ERVNdID8/PSBbXTtcbiAgaWYgKCFuZ2hbRElTQ09OTkVDVEVEX05PREVTXS5pbmNsdWRlcyhub09mZnNldEluZGV4KSkge1xuICAgIG5naFtESVNDT05ORUNURURfTk9ERVNdLnB1c2gobm9PZmZzZXRJbmRleCk7XG4gIH1cbn1cblxuLyoqXG4gKiBTZXJpYWxpemVzIHRoZSBsVmlldyBkYXRhIGludG8gYSBTZXJpYWxpemVkVmlldyBvYmplY3QgdGhhdCB3aWxsIGxhdGVyIGJlIGFkZGVkXG4gKiB0byB0aGUgVHJhbnNmZXJTdGF0ZSBzdG9yYWdlIGFuZCByZWZlcmVuY2VkIHVzaW5nIHRoZSBgbmdoYCBhdHRyaWJ1dGUgb24gYSBob3N0XG4gKiBlbGVtZW50LlxuICpcbiAqIEBwYXJhbSBsVmlldyB0aGUgbFZpZXcgd2UgYXJlIHNlcmlhbGl6aW5nXG4gKiBAcGFyYW0gY29udGV4dCB0aGUgaHlkcmF0aW9uIGNvbnRleHRcbiAqIEByZXR1cm5zIHRoZSBgU2VyaWFsaXplZFZpZXdgIG9iamVjdCBjb250YWluaW5nIHRoZSBkYXRhIHRvIGJlIGFkZGVkIHRvIHRoZSBob3N0IG5vZGVcbiAqL1xuZnVuY3Rpb24gc2VyaWFsaXplTFZpZXcobFZpZXc6IExWaWV3LCBjb250ZXh0OiBIeWRyYXRpb25Db250ZXh0KTogU2VyaWFsaXplZFZpZXcge1xuICBjb25zdCBuZ2g6IFNlcmlhbGl6ZWRWaWV3ID0ge307XG4gIGNvbnN0IHRWaWV3ID0gbFZpZXdbVFZJRVddO1xuICBjb25zdCBpMThuQ2hpbGRyZW4gPSBnZXRPckNvbXB1dGVJMThuQ2hpbGRyZW4odFZpZXcsIGNvbnRleHQpO1xuICBjb25zdCBuYXRpdmVFbGVtZW50c1RvRXZlbnRUeXBlcyA9IGNvbnRleHQuc2hvdWxkUmVwbGF5RXZlbnRzXG4gICAgPyBjb2xsZWN0RG9tRXZlbnRzSW5mbyh0VmlldywgbFZpZXcsIGNvbnRleHQuZXZlbnRUeXBlc1RvUmVwbGF5KVxuICAgIDogbnVsbDtcbiAgLy8gSXRlcmF0ZSBvdmVyIERPTSBlbGVtZW50IHJlZmVyZW5jZXMgaW4gYW4gTFZpZXcuXG4gIGZvciAobGV0IGkgPSBIRUFERVJfT0ZGU0VUOyBpIDwgdFZpZXcuYmluZGluZ1N0YXJ0SW5kZXg7IGkrKykge1xuICAgIGNvbnN0IHROb2RlID0gdFZpZXcuZGF0YVtpXSBhcyBUTm9kZTtcbiAgICBjb25zdCBub09mZnNldEluZGV4ID0gaSAtIEhFQURFUl9PRkZTRVQ7XG5cbiAgICAvLyBBdHRlbXB0IHRvIHNlcmlhbGl6ZSBhbnkgaTE4biBkYXRhIGZvciB0aGUgZ2l2ZW4gc2xvdC4gV2UgZG8gdGhpcyBmaXJzdCwgYXMgaTE4blxuICAgIC8vIGhhcyBpdHMgb3duIHByb2Nlc3MgZm9yIHNlcmlhbGl6YXRpb24uXG4gICAgY29uc3QgaTE4bkRhdGEgPSB0cnlTZXJpYWxpemVJMThuQmxvY2sobFZpZXcsIGksIGNvbnRleHQpO1xuICAgIGlmIChpMThuRGF0YSkge1xuICAgICAgbmdoW0kxOE5fREFUQV0gPz89IHt9O1xuICAgICAgbmdoW0kxOE5fREFUQV1bbm9PZmZzZXRJbmRleF0gPSBpMThuRGF0YS5jYXNlUXVldWU7XG5cbiAgICAgIGZvciAoY29uc3Qgbm9kZU5vT2Zmc2V0SW5kZXggb2YgaTE4bkRhdGEuZGlzY29ubmVjdGVkTm9kZXMpIHtcbiAgICAgICAgYXBwZW5kRGlzY29ubmVjdGVkTm9kZUluZGV4KG5naCwgbm9kZU5vT2Zmc2V0SW5kZXgpO1xuICAgICAgfVxuXG4gICAgICBmb3IgKGNvbnN0IG5vZGVOb09mZnNldEluZGV4IG9mIGkxOG5EYXRhLmRpc2pvaW50Tm9kZXMpIHtcbiAgICAgICAgY29uc3QgdE5vZGUgPSB0Vmlldy5kYXRhW25vZGVOb09mZnNldEluZGV4ICsgSEVBREVSX09GRlNFVF0gYXMgVE5vZGU7XG4gICAgICAgIG5nRGV2TW9kZSAmJiBhc3NlcnRUTm9kZSh0Tm9kZSk7XG4gICAgICAgIGFwcGVuZFNlcmlhbGl6ZWROb2RlUGF0aChuZ2gsIHROb2RlLCBsVmlldywgaTE4bkNoaWxkcmVuKTtcbiAgICAgIH1cblxuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgLy8gU2tpcCBwcm9jZXNzaW5nIG9mIGEgZ2l2ZW4gc2xvdCBpbiB0aGUgZm9sbG93aW5nIGNhc2VzOlxuICAgIC8vIC0gTG9jYWwgcmVmcyAoZS5nLiA8ZGl2ICNsb2NhbFJlZj4pIHRha2UgdXAgYW4gZXh0cmEgc2xvdCBpbiBMVmlld3NcbiAgICAvLyAgIHRvIHN0b3JlIHRoZSBzYW1lIGVsZW1lbnQuIEluIHRoaXMgY2FzZSwgdGhlcmUgaXMgbm8gaW5mb3JtYXRpb24gaW5cbiAgICAvLyAgIGEgY29ycmVzcG9uZGluZyBzbG90IGluIFROb2RlIGRhdGEgc3RydWN0dXJlLlxuICAgIC8vIC0gV2hlbiBhIHNsb3QgY29udGFpbnMgc29tZXRoaW5nIG90aGVyIHRoYW4gYSBUTm9kZS4gRm9yIGV4YW1wbGUsIHRoZXJlXG4gICAgLy8gICBtaWdodCBiZSBzb21lIG1ldGFkYXRhIGluZm9ybWF0aW9uIGFib3V0IGEgZGVmZXIgYmxvY2sgb3IgYSBjb250cm9sIGZsb3cgYmxvY2suXG4gICAgaWYgKCFpc1ROb2RlU2hhcGUodE5vZGUpKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICAvLyBTa2lwIGFueSBub2RlcyB0aGF0IGFyZSBpbiBhbiBpMThuIGJsb2NrIGJ1dCBhcmUgY29uc2lkZXJlZCBkZXRhY2hlZCAoaS5lLiBub3RcbiAgICAvLyBwcmVzZW50IGluIHRoZSB0ZW1wbGF0ZSkuIFRoZXNlIG5vZGVzIGFyZSBkaXNjb25uZWN0ZWQgZnJvbSB0aGUgRE9NIHRyZWUsIGFuZFxuICAgIC8vIHNvIHdlIGRvbid0IHdhbnQgdG8gc2VyaWFsaXplIGFueSBpbmZvcm1hdGlvbiBhYm91dCB0aGVtLlxuICAgIGlmIChpc0RldGFjaGVkQnlJMThuKHROb2RlKSkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgLy8gQ2hlY2sgaWYgYSBuYXRpdmUgbm9kZSB0aGF0IHJlcHJlc2VudHMgYSBnaXZlbiBUTm9kZSBpcyBkaXNjb25uZWN0ZWQgZnJvbSB0aGUgRE9NIHRyZWUuXG4gICAgLy8gU3VjaCBub2RlcyBtdXN0IGJlIGV4Y2x1ZGVkIGZyb20gdGhlIGh5ZHJhdGlvbiAoc2luY2UgdGhlIGh5ZHJhdGlvbiB3b24ndCBiZSBhYmxlIHRvXG4gICAgLy8gZmluZCB0aGVtKSwgc28gdGhlIFROb2RlIGlkcyBhcmUgY29sbGVjdGVkIGFuZCB1c2VkIGF0IHJ1bnRpbWUgdG8gc2tpcCB0aGUgaHlkcmF0aW9uLlxuICAgIC8vXG4gICAgLy8gVGhpcyBzaXR1YXRpb24gbWF5IGhhcHBlbiBkdXJpbmcgdGhlIGNvbnRlbnQgcHJvamVjdGlvbiwgd2hlbiBzb21lIG5vZGVzIGRvbid0IG1ha2UgaXRcbiAgICAvLyBpbnRvIG9uZSBvZiB0aGUgY29udGVudCBwcm9qZWN0aW9uIHNsb3RzIChmb3IgZXhhbXBsZSwgd2hlbiB0aGVyZSBpcyBubyBkZWZhdWx0XG4gICAgLy8gPG5nLWNvbnRlbnQgLz4gc2xvdCBpbiBwcm9qZWN0b3IgY29tcG9uZW50J3MgdGVtcGxhdGUpLlxuICAgIGlmIChpc0Rpc2Nvbm5lY3RlZE5vZGUodE5vZGUsIGxWaWV3KSAmJiBpc0NvbnRlbnRQcm9qZWN0ZWROb2RlKHROb2RlKSkge1xuICAgICAgYXBwZW5kRGlzY29ubmVjdGVkTm9kZUluZGV4KG5naCwgdE5vZGUpO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgLy8gQXR0YWNoIGBqc2FjdGlvbmAgYXR0cmlidXRlIHRvIGVsZW1lbnRzIHRoYXQgaGF2ZSByZWdpc3RlcmVkIGxpc3RlbmVycyxcbiAgICAvLyB0aHVzIHBvdGVudGlhbGx5IGhhdmluZyBhIG5lZWQgdG8gZG8gYW4gZXZlbnQgcmVwbGF5LlxuICAgIGlmIChuYXRpdmVFbGVtZW50c1RvRXZlbnRUeXBlcyAmJiB0Tm9kZS50eXBlICYgVE5vZGVUeXBlLkVsZW1lbnQpIHtcbiAgICAgIGNvbnN0IG5hdGl2ZUVsZW1lbnQgPSB1bndyYXBSTm9kZShsVmlld1tpXSkgYXMgRWxlbWVudDtcbiAgICAgIGlmIChuYXRpdmVFbGVtZW50c1RvRXZlbnRUeXBlcy5oYXMobmF0aXZlRWxlbWVudCkpIHtcbiAgICAgICAgc2V0SlNBY3Rpb25BdHRyaWJ1dGUobmF0aXZlRWxlbWVudCwgbmF0aXZlRWxlbWVudHNUb0V2ZW50VHlwZXMuZ2V0KG5hdGl2ZUVsZW1lbnQpISk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKEFycmF5LmlzQXJyYXkodE5vZGUucHJvamVjdGlvbikpIHtcbiAgICAgIGZvciAoY29uc3QgcHJvamVjdGlvbkhlYWRUTm9kZSBvZiB0Tm9kZS5wcm9qZWN0aW9uKSB7XG4gICAgICAgIC8vIFdlIG1heSBoYXZlIGBudWxsYHMgaW4gc2xvdHMgd2l0aCBubyBwcm9qZWN0ZWQgY29udGVudC5cbiAgICAgICAgaWYgKCFwcm9qZWN0aW9uSGVhZFROb2RlKSBjb250aW51ZTtcblxuICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkocHJvamVjdGlvbkhlYWRUTm9kZSkpIHtcbiAgICAgICAgICAvLyBJZiB3ZSBwcm9jZXNzIHJlLXByb2plY3RlZCBjb250ZW50IChpLmUuIGA8bmctY29udGVudD5gXG4gICAgICAgICAgLy8gYXBwZWFycyBhdCBwcm9qZWN0aW9uIGxvY2F0aW9uKSwgc2tpcCBhbm5vdGF0aW9ucyBmb3IgdGhpcyBjb250ZW50XG4gICAgICAgICAgLy8gc2luY2UgYWxsIERPTSBub2RlcyBpbiB0aGlzIHByb2plY3Rpb24gd2VyZSBoYW5kbGVkIHdoaWxlIHByb2Nlc3NpbmdcbiAgICAgICAgICAvLyBhIHBhcmVudCBsVmlldywgd2hpY2ggY29udGFpbnMgdGhvc2Ugbm9kZXMuXG4gICAgICAgICAgaWYgKFxuICAgICAgICAgICAgIWlzUHJvamVjdGlvblROb2RlKHByb2plY3Rpb25IZWFkVE5vZGUpICYmXG4gICAgICAgICAgICAhaXNJblNraXBIeWRyYXRpb25CbG9jayhwcm9qZWN0aW9uSGVhZFROb2RlKVxuICAgICAgICAgICkge1xuICAgICAgICAgICAgaWYgKGlzRGlzY29ubmVjdGVkTm9kZShwcm9qZWN0aW9uSGVhZFROb2RlLCBsVmlldykpIHtcbiAgICAgICAgICAgICAgLy8gQ2hlY2sgd2hldGhlciB0aGlzIG5vZGUgaXMgY29ubmVjdGVkLCBzaW5jZSB3ZSBtYXkgaGF2ZSBhIFROb2RlXG4gICAgICAgICAgICAgIC8vIGluIHRoZSBkYXRhIHN0cnVjdHVyZSBhcyBhIHByb2plY3Rpb24gc2VnbWVudCBoZWFkLCBidXQgdGhlXG4gICAgICAgICAgICAgIC8vIGNvbnRlbnQgcHJvamVjdGlvbiBzbG90IG1pZ2h0IGJlIGRpc2FibGVkIChlLmcuXG4gICAgICAgICAgICAgIC8vIDxuZy1jb250ZW50ICpuZ0lmPVwiZmFsc2VcIiAvPikuXG4gICAgICAgICAgICAgIGFwcGVuZERpc2Nvbm5lY3RlZE5vZGVJbmRleChuZ2gsIHByb2plY3Rpb25IZWFkVE5vZGUpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgYXBwZW5kU2VyaWFsaXplZE5vZGVQYXRoKG5naCwgcHJvamVjdGlvbkhlYWRUTm9kZSwgbFZpZXcsIGkxOG5DaGlsZHJlbik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIElmIGEgdmFsdWUgaXMgYW4gYXJyYXksIGl0IG1lYW5zIHRoYXQgd2UgYXJlIHByb2Nlc3NpbmcgYSBwcm9qZWN0aW9uXG4gICAgICAgICAgLy8gd2hlcmUgcHJvamVjdGFibGUgbm9kZXMgd2VyZSBwYXNzZWQgaW4gYXMgRE9NIG5vZGVzIChmb3IgZXhhbXBsZSwgd2hlblxuICAgICAgICAgIC8vIGNhbGxpbmcgYFZpZXdDb250YWluZXJSZWYuY3JlYXRlQ29tcG9uZW50KENtcEEsIHtwcm9qZWN0YWJsZU5vZGVzOiBbLi4uXX0pYCkuXG4gICAgICAgICAgLy9cbiAgICAgICAgICAvLyBJbiB0aGlzIHNjZW5hcmlvLCBub2RlcyBjYW4gY29tZSBmcm9tIGFueXdoZXJlIChlaXRoZXIgY3JlYXRlZCBtYW51YWxseSxcbiAgICAgICAgICAvLyBhY2Nlc3NlZCB2aWEgYGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JgLCBldGMpIGFuZCBtYXkgYmUgaW4gYW55IHN0YXRlXG4gICAgICAgICAgLy8gKGF0dGFjaGVkIG9yIGRldGFjaGVkIGZyb20gdGhlIERPTSB0cmVlKS4gQXMgYSByZXN1bHQsIHdlIGNhbiBub3QgcmVsaWFibHlcbiAgICAgICAgICAvLyByZXN0b3JlIHRoZSBzdGF0ZSBmb3Igc3VjaCBjYXNlcyBkdXJpbmcgaHlkcmF0aW9uLlxuXG4gICAgICAgICAgdGhyb3cgdW5zdXBwb3J0ZWRQcm9qZWN0aW9uT2ZEb21Ob2Rlcyh1bndyYXBSTm9kZShsVmlld1tpXSkpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uZGl0aW9uYWxseUFubm90YXRlTm9kZVBhdGgobmdoLCB0Tm9kZSwgbFZpZXcsIGkxOG5DaGlsZHJlbik7XG5cbiAgICBpZiAoaXNMQ29udGFpbmVyKGxWaWV3W2ldKSkge1xuICAgICAgLy8gU2VyaWFsaXplIGluZm9ybWF0aW9uIGFib3V0IGEgdGVtcGxhdGUuXG4gICAgICBjb25zdCBlbWJlZGRlZFRWaWV3ID0gdE5vZGUudFZpZXc7XG4gICAgICBpZiAoZW1iZWRkZWRUVmlldyAhPT0gbnVsbCkge1xuICAgICAgICBuZ2hbVEVNUExBVEVTXSA/Pz0ge307XG4gICAgICAgIG5naFtURU1QTEFURVNdW25vT2Zmc2V0SW5kZXhdID0gZ2V0U3NySWQoZW1iZWRkZWRUVmlldyk7XG4gICAgICB9XG5cbiAgICAgIC8vIFNlcmlhbGl6ZSB2aWV3cyB3aXRoaW4gdGhpcyBMQ29udGFpbmVyLlxuICAgICAgY29uc3QgaG9zdE5vZGUgPSBsVmlld1tpXVtIT1NUXSE7IC8vIGhvc3Qgbm9kZSBvZiB0aGlzIGNvbnRhaW5lclxuXG4gICAgICAvLyBMVmlld1tpXVtIT1NUXSBjYW4gYmUgb2YgMiBkaWZmZXJlbnQgdHlwZXM6XG4gICAgICAvLyAtIGVpdGhlciBhIERPTSBub2RlXG4gICAgICAvLyAtIG9yIGFuIGFycmF5IHRoYXQgcmVwcmVzZW50cyBhbiBMVmlldyBvZiBhIGNvbXBvbmVudFxuICAgICAgaWYgKEFycmF5LmlzQXJyYXkoaG9zdE5vZGUpKSB7XG4gICAgICAgIC8vIFRoaXMgaXMgYSBjb21wb25lbnQsIHNlcmlhbGl6ZSBpbmZvIGFib3V0IGl0LlxuICAgICAgICBjb25zdCB0YXJnZXROb2RlID0gdW53cmFwUk5vZGUoaG9zdE5vZGUgYXMgTFZpZXcpIGFzIFJFbGVtZW50O1xuICAgICAgICBpZiAoISh0YXJnZXROb2RlIGFzIEhUTUxFbGVtZW50KS5oYXNBdHRyaWJ1dGUoU0tJUF9IWURSQVRJT05fQVRUUl9OQU1FKSkge1xuICAgICAgICAgIGFubm90YXRlSG9zdEVsZW1lbnRGb3JIeWRyYXRpb24odGFyZ2V0Tm9kZSwgaG9zdE5vZGUgYXMgTFZpZXcsIGNvbnRleHQpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIG5naFtDT05UQUlORVJTXSA/Pz0ge307XG4gICAgICBuZ2hbQ09OVEFJTkVSU11bbm9PZmZzZXRJbmRleF0gPSBzZXJpYWxpemVMQ29udGFpbmVyKGxWaWV3W2ldLCBjb250ZXh0KTtcbiAgICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkobFZpZXdbaV0pKSB7XG4gICAgICAvLyBUaGlzIGlzIGEgY29tcG9uZW50LCBhbm5vdGF0ZSB0aGUgaG9zdCBub2RlIHdpdGggYW4gYG5naGAgYXR0cmlidXRlLlxuICAgICAgY29uc3QgdGFyZ2V0Tm9kZSA9IHVud3JhcFJOb2RlKGxWaWV3W2ldW0hPU1RdISk7XG4gICAgICBpZiAoISh0YXJnZXROb2RlIGFzIEhUTUxFbGVtZW50KS5oYXNBdHRyaWJ1dGUoU0tJUF9IWURSQVRJT05fQVRUUl9OQU1FKSkge1xuICAgICAgICBhbm5vdGF0ZUhvc3RFbGVtZW50Rm9ySHlkcmF0aW9uKHRhcmdldE5vZGUgYXMgUkVsZW1lbnQsIGxWaWV3W2ldLCBjb250ZXh0KTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gPG5nLWNvbnRhaW5lcj4gY2FzZVxuICAgICAgaWYgKHROb2RlLnR5cGUgJiBUTm9kZVR5cGUuRWxlbWVudENvbnRhaW5lcikge1xuICAgICAgICAvLyBBbiA8bmctY29udGFpbmVyPiBpcyByZXByZXNlbnRlZCBieSB0aGUgbnVtYmVyIG9mXG4gICAgICAgIC8vIHRvcC1sZXZlbCBub2Rlcy4gVGhpcyBpbmZvcm1hdGlvbiBpcyBuZWVkZWQgdG8gc2tpcCBvdmVyXG4gICAgICAgIC8vIHRob3NlIG5vZGVzIHRvIHJlYWNoIGEgY29ycmVzcG9uZGluZyBhbmNob3Igbm9kZSAoY29tbWVudCBub2RlKS5cbiAgICAgICAgbmdoW0VMRU1FTlRfQ09OVEFJTkVSU10gPz89IHt9O1xuICAgICAgICBuZ2hbRUxFTUVOVF9DT05UQUlORVJTXVtub09mZnNldEluZGV4XSA9IGNhbGNOdW1Sb290Tm9kZXModFZpZXcsIGxWaWV3LCB0Tm9kZS5jaGlsZCk7XG4gICAgICB9IGVsc2UgaWYgKHROb2RlLnR5cGUgJiBUTm9kZVR5cGUuUHJvamVjdGlvbikge1xuICAgICAgICAvLyBDdXJyZW50IFROb2RlIHJlcHJlc2VudHMgYW4gYDxuZy1jb250ZW50PmAgc2xvdCwgdGh1cyBpdCBoYXMgbm9cbiAgICAgICAgLy8gRE9NIGVsZW1lbnRzIGFzc29jaWF0ZWQgd2l0aCBpdCwgc28gdGhlICoqbmV4dCBzaWJsaW5nKiogbm9kZSB3b3VsZFxuICAgICAgICAvLyBub3QgYmUgYWJsZSB0byBmaW5kIGFuIGFuY2hvci4gSW4gdGhpcyBjYXNlLCB1c2UgZnVsbCBwYXRoIGluc3RlYWQuXG4gICAgICAgIGxldCBuZXh0VE5vZGUgPSB0Tm9kZS5uZXh0O1xuICAgICAgICAvLyBTa2lwIG92ZXIgYWxsIGA8bmctY29udGVudD5gIHNsb3RzIGluIGEgcm93LlxuICAgICAgICB3aGlsZSAobmV4dFROb2RlICE9PSBudWxsICYmIG5leHRUTm9kZS50eXBlICYgVE5vZGVUeXBlLlByb2plY3Rpb24pIHtcbiAgICAgICAgICBuZXh0VE5vZGUgPSBuZXh0VE5vZGUubmV4dDtcbiAgICAgICAgfVxuICAgICAgICBpZiAobmV4dFROb2RlICYmICFpc0luU2tpcEh5ZHJhdGlvbkJsb2NrKG5leHRUTm9kZSkpIHtcbiAgICAgICAgICAvLyBIYW5kbGUgYSB0Tm9kZSBhZnRlciB0aGUgYDxuZy1jb250ZW50PmAgc2xvdC5cbiAgICAgICAgICBhcHBlbmRTZXJpYWxpemVkTm9kZVBhdGgobmdoLCBuZXh0VE5vZGUsIGxWaWV3LCBpMThuQ2hpbGRyZW4pO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAodE5vZGUudHlwZSAmIFROb2RlVHlwZS5UZXh0KSB7XG4gICAgICAgICAgY29uc3Qgck5vZGUgPSB1bndyYXBSTm9kZShsVmlld1tpXSk7XG4gICAgICAgICAgcHJvY2Vzc1RleHROb2RlQmVmb3JlU2VyaWFsaXphdGlvbihjb250ZXh0LCByTm9kZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIG5naDtcbn1cblxuLyoqXG4gKiBTZXJpYWxpemVzIG5vZGUgbG9jYXRpb24gaW4gY2FzZXMgd2hlbiBpdCdzIG5lZWRlZCwgc3BlY2lmaWNhbGx5OlxuICpcbiAqICAxLiBJZiBgdE5vZGUucHJvamVjdGlvbk5leHRgIGlzIGRpZmZlcmVudCBmcm9tIGB0Tm9kZS5uZXh0YCAtIGl0IG1lYW5zIHRoYXRcbiAqICAgICB0aGUgbmV4dCBgdE5vZGVgIGFmdGVyIHByb2plY3Rpb24gaXMgZGlmZmVyZW50IGZyb20gdGhlIG9uZSBpbiB0aGUgb3JpZ2luYWxcbiAqICAgICB0ZW1wbGF0ZS4gU2luY2UgaHlkcmF0aW9uIHJlbGllcyBvbiBgdE5vZGUubmV4dGAsIHRoaXMgc2VyaWFsaXplZCBpbmZvXG4gKiAgICAgaXMgcmVxdWlyZWQgdG8gaGVscCBydW50aW1lIGNvZGUgZmluZCB0aGUgbm9kZSBhdCB0aGUgY29ycmVjdCBsb2NhdGlvbi5cbiAqICAyLiBJbiBjZXJ0YWluIGNvbnRlbnQgcHJvamVjdGlvbi1iYXNlZCB1c2UtY2FzZXMsIGl0J3MgcG9zc2libGUgdGhhdCBvbmx5XG4gKiAgICAgYSBjb250ZW50IG9mIGEgcHJvamVjdGVkIGVsZW1lbnQgaXMgcmVuZGVyZWQuIEluIHRoaXMgY2FzZSwgY29udGVudCBub2Rlc1xuICogICAgIHJlcXVpcmUgYW4gZXh0cmEgYW5ub3RhdGlvbiwgc2luY2UgcnVudGltZSBsb2dpYyBjYW4ndCByZWx5IG9uIHBhcmVudC1jaGlsZFxuICogICAgIGNvbm5lY3Rpb24gdG8gaWRlbnRpZnkgdGhlIGxvY2F0aW9uIG9mIGEgbm9kZS5cbiAqL1xuZnVuY3Rpb24gY29uZGl0aW9uYWxseUFubm90YXRlTm9kZVBhdGgoXG4gIG5naDogU2VyaWFsaXplZFZpZXcsXG4gIHROb2RlOiBUTm9kZSxcbiAgbFZpZXc6IExWaWV3PHVua25vd24+LFxuICBleGNsdWRlZFBhcmVudE5vZGVzOiBTZXQ8bnVtYmVyPiB8IG51bGwsXG4pIHtcbiAgLy8gSGFuZGxlIGNhc2UgIzEgZGVzY3JpYmVkIGFib3ZlLlxuICBpZiAoXG4gICAgdE5vZGUucHJvamVjdGlvbk5leHQgJiZcbiAgICB0Tm9kZS5wcm9qZWN0aW9uTmV4dCAhPT0gdE5vZGUubmV4dCAmJlxuICAgICFpc0luU2tpcEh5ZHJhdGlvbkJsb2NrKHROb2RlLnByb2plY3Rpb25OZXh0KVxuICApIHtcbiAgICBhcHBlbmRTZXJpYWxpemVkTm9kZVBhdGgobmdoLCB0Tm9kZS5wcm9qZWN0aW9uTmV4dCwgbFZpZXcsIGV4Y2x1ZGVkUGFyZW50Tm9kZXMpO1xuICB9XG5cbiAgLy8gSGFuZGxlIGNhc2UgIzIgZGVzY3JpYmVkIGFib3ZlLlxuICAvLyBOb3RlOiB3ZSBvbmx5IGRvIHRoYXQgZm9yIHRoZSBmaXJzdCBub2RlIChpLmUuIHdoZW4gYHROb2RlLnByZXYgPT09IG51bGxgKSxcbiAgLy8gdGhlIHJlc3Qgb2YgdGhlIG5vZGVzIHdvdWxkIHJlbHkgb24gdGhlIGN1cnJlbnQgbm9kZSBsb2NhdGlvbiwgc28gbm8gZXh0cmFcbiAgLy8gYW5ub3RhdGlvbiBpcyBuZWVkZWQuXG4gIGlmIChcbiAgICB0Tm9kZS5wcmV2ID09PSBudWxsICYmXG4gICAgdE5vZGUucGFyZW50ICE9PSBudWxsICYmXG4gICAgaXNEaXNjb25uZWN0ZWROb2RlKHROb2RlLnBhcmVudCwgbFZpZXcpICYmXG4gICAgIWlzRGlzY29ubmVjdGVkTm9kZSh0Tm9kZSwgbFZpZXcpXG4gICkge1xuICAgIGFwcGVuZFNlcmlhbGl6ZWROb2RlUGF0aChuZ2gsIHROb2RlLCBsVmlldywgZXhjbHVkZWRQYXJlbnROb2Rlcyk7XG4gIH1cbn1cblxuLyoqXG4gKiBEZXRlcm1pbmVzIHdoZXRoZXIgYSBjb21wb25lbnQgaW5zdGFuY2UgdGhhdCBpcyByZXByZXNlbnRlZFxuICogYnkgYSBnaXZlbiBMVmlldyB1c2VzIGBWaWV3RW5jYXBzdWxhdGlvbi5TaGFkb3dEb21gLlxuICovXG5mdW5jdGlvbiBjb21wb25lbnRVc2VzU2hhZG93RG9tRW5jYXBzdWxhdGlvbihsVmlldzogTFZpZXcpOiBib29sZWFuIHtcbiAgY29uc3QgaW5zdGFuY2UgPSBsVmlld1tDT05URVhUXTtcbiAgcmV0dXJuIGluc3RhbmNlPy5jb25zdHJ1Y3RvclxuICAgID8gZ2V0Q29tcG9uZW50RGVmKGluc3RhbmNlLmNvbnN0cnVjdG9yKT8uZW5jYXBzdWxhdGlvbiA9PT0gVmlld0VuY2Fwc3VsYXRpb24uU2hhZG93RG9tXG4gICAgOiBmYWxzZTtcbn1cblxuLyoqXG4gKiBBbm5vdGF0ZXMgY29tcG9uZW50IGhvc3QgZWxlbWVudCBmb3IgaHlkcmF0aW9uOlxuICogLSBieSBlaXRoZXIgYWRkaW5nIHRoZSBgbmdoYCBhdHRyaWJ1dGUgYW5kIGNvbGxlY3RpbmcgaHlkcmF0aW9uLXJlbGF0ZWQgaW5mb1xuICogICBmb3IgdGhlIHNlcmlhbGl6YXRpb24gYW5kIHRyYW5zZmVycmluZyB0byB0aGUgY2xpZW50XG4gKiAtIG9yIGJ5IGFkZGluZyB0aGUgYG5nU2tpcEh5ZHJhdGlvbmAgYXR0cmlidXRlIGluIGNhc2UgQW5ndWxhciBkZXRlY3RzIHRoYXRcbiAqICAgY29tcG9uZW50IGNvbnRlbnRzIGlzIG5vdCBjb21wYXRpYmxlIHdpdGggaHlkcmF0aW9uLlxuICpcbiAqIEBwYXJhbSBlbGVtZW50IFRoZSBIb3N0IGVsZW1lbnQgdG8gYmUgYW5ub3RhdGVkXG4gKiBAcGFyYW0gbFZpZXcgVGhlIGFzc29jaWF0ZWQgTFZpZXdcbiAqIEBwYXJhbSBjb250ZXh0IFRoZSBoeWRyYXRpb24gY29udGV4dFxuICogQHJldHVybnMgQW4gaW5kZXggb2Ygc2VyaWFsaXplZCB2aWV3IGZyb20gdGhlIHRyYW5zZmVyIHN0YXRlIG9iamVjdFxuICogICAgICAgICAgb3IgYG51bGxgIHdoZW4gYSBnaXZlbiBjb21wb25lbnQgY2FuIG5vdCBiZSBzZXJpYWxpemVkLlxuICovXG5mdW5jdGlvbiBhbm5vdGF0ZUhvc3RFbGVtZW50Rm9ySHlkcmF0aW9uKFxuICBlbGVtZW50OiBSRWxlbWVudCxcbiAgbFZpZXc6IExWaWV3LFxuICBjb250ZXh0OiBIeWRyYXRpb25Db250ZXh0LFxuKTogbnVtYmVyIHwgbnVsbCB7XG4gIGNvbnN0IHJlbmRlcmVyID0gbFZpZXdbUkVOREVSRVJdO1xuICBpZiAoXG4gICAgKGhhc0kxOG4obFZpZXcpICYmICFpc0kxOG5IeWRyYXRpb25TdXBwb3J0RW5hYmxlZCgpKSB8fFxuICAgIGNvbXBvbmVudFVzZXNTaGFkb3dEb21FbmNhcHN1bGF0aW9uKGxWaWV3KVxuICApIHtcbiAgICAvLyBBdHRhY2ggdGhlIHNraXAgaHlkcmF0aW9uIGF0dHJpYnV0ZSBpZiB0aGlzIGNvbXBvbmVudDpcbiAgICAvLyAtIGVpdGhlciBoYXMgaTE4biBibG9ja3MsIHNpbmNlIGh5ZHJhdGluZyBzdWNoIGJsb2NrcyBpcyBub3QgeWV0IHN1cHBvcnRlZFxuICAgIC8vIC0gb3IgdXNlcyBTaGFkb3dEb20gdmlldyBlbmNhcHN1bGF0aW9uLCBzaW5jZSBEb21pbm8gZG9lc24ndCBzdXBwb3J0XG4gICAgLy8gICBzaGFkb3cgRE9NLCBzbyB3ZSBjYW4gbm90IGd1YXJhbnRlZSB0aGF0IGNsaWVudCBhbmQgc2VydmVyIHJlcHJlc2VudGF0aW9uc1xuICAgIC8vICAgd291bGQgZXhhY3RseSBtYXRjaFxuICAgIHJlbmRlcmVyLnNldEF0dHJpYnV0ZShlbGVtZW50LCBTS0lQX0hZRFJBVElPTl9BVFRSX05BTUUsICcnKTtcbiAgICByZXR1cm4gbnVsbDtcbiAgfSBlbHNlIHtcbiAgICBjb25zdCBuZ2ggPSBzZXJpYWxpemVMVmlldyhsVmlldywgY29udGV4dCk7XG4gICAgY29uc3QgaW5kZXggPSBjb250ZXh0LnNlcmlhbGl6ZWRWaWV3Q29sbGVjdGlvbi5hZGQobmdoKTtcbiAgICByZW5kZXJlci5zZXRBdHRyaWJ1dGUoZWxlbWVudCwgTkdIX0FUVFJfTkFNRSwgaW5kZXgudG9TdHJpbmcoKSk7XG4gICAgcmV0dXJuIGluZGV4O1xuICB9XG59XG5cbi8qKlxuICogUGh5c2ljYWxseSBpbnNlcnRzIHRoZSBjb21tZW50IG5vZGVzIHRvIGVuc3VyZSBlbXB0eSB0ZXh0IG5vZGVzIGFuZCBhZGphY2VudFxuICogdGV4dCBub2RlIHNlcGFyYXRvcnMgYXJlIHByZXNlcnZlZCBhZnRlciBzZXJ2ZXIgc2VyaWFsaXphdGlvbiBvZiB0aGUgRE9NLlxuICogVGhlc2UgZ2V0IHN3YXBwZWQgYmFjayBmb3IgZW1wdHkgdGV4dCBub2RlcyBvciBzZXBhcmF0b3JzIG9uY2UgaHlkcmF0aW9uIGhhcHBlbnNcbiAqIG9uIHRoZSBjbGllbnQuXG4gKlxuICogQHBhcmFtIGNvcnJ1cHRlZFRleHROb2RlcyBUaGUgTWFwIG9mIHRleHQgbm9kZXMgdG8gYmUgcmVwbGFjZWQgd2l0aCBjb21tZW50c1xuICogQHBhcmFtIGRvYyBUaGUgZG9jdW1lbnRcbiAqL1xuZnVuY3Rpb24gaW5zZXJ0Q29ycnVwdGVkVGV4dE5vZGVNYXJrZXJzKFxuICBjb3JydXB0ZWRUZXh0Tm9kZXM6IE1hcDxIVE1MRWxlbWVudCwgc3RyaW5nPixcbiAgZG9jOiBEb2N1bWVudCxcbikge1xuICBmb3IgKGNvbnN0IFt0ZXh0Tm9kZSwgbWFya2VyXSBvZiBjb3JydXB0ZWRUZXh0Tm9kZXMpIHtcbiAgICB0ZXh0Tm9kZS5hZnRlcihkb2MuY3JlYXRlQ29tbWVudChtYXJrZXIpKTtcbiAgfVxufVxuXG4vKipcbiAqIERldGVjdHMgd2hldGhlciBhIGdpdmVuIFROb2RlIHJlcHJlc2VudHMgYSBub2RlIHRoYXRcbiAqIGlzIGJlaW5nIGNvbnRlbnQgcHJvamVjdGVkLlxuICovXG5mdW5jdGlvbiBpc0NvbnRlbnRQcm9qZWN0ZWROb2RlKHROb2RlOiBUTm9kZSk6IGJvb2xlYW4ge1xuICBsZXQgY3VycmVudFROb2RlID0gdE5vZGU7XG4gIHdoaWxlIChjdXJyZW50VE5vZGUgIT0gbnVsbCkge1xuICAgIC8vIElmIHdlIGNvbWUgYWNyb3NzIGEgY29tcG9uZW50IGhvc3Qgbm9kZSBpbiBwYXJlbnQgbm9kZXMgLVxuICAgIC8vIHRoaXMgVE5vZGUgaXMgaW4gdGhlIGNvbnRlbnQgcHJvamVjdGlvbiBzZWN0aW9uLlxuICAgIGlmIChpc0NvbXBvbmVudEhvc3QoY3VycmVudFROb2RlKSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIGN1cnJlbnRUTm9kZSA9IGN1cnJlbnRUTm9kZS5wYXJlbnQgYXMgVE5vZGU7XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuIl19