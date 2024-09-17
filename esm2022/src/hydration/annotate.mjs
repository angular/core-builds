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
import { isLetDeclaration, isTNodeShape } from '../render3/interfaces/node';
import { hasI18n, isComponentHost, isLContainer, isProjectionTNode, isRootView, } from '../render3/interfaces/type_checks';
import { CONTEXT, HEADER_OFFSET, HOST, PARENT, RENDERER, TVIEW, } from '../render3/interfaces/view';
import { unwrapLView, unwrapRNode } from '../render3/util/view_utils';
import { TransferState } from '../transfer_state';
import { unsupportedProjectionOfDomNodes } from './error_handling';
import { collectDomEventsInfo } from './event_replay';
import { setJSActionAttributes } from '../event_delegation_utils';
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
                setJSActionAttributes(nativeElement, nativeElementsToEventTypes.get(nativeElement));
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
        else if (Array.isArray(lView[i]) && !isLetDeclaration(tNode)) {
            // This is a component, annotate the host node with an `ngh` attribute.
            // Note: Let declarations that return an array are also storing an array in the LView,
            // we need to exclude them.
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
            else if (tNode.type & (16 /* TNodeType.Projection */ | 128 /* TNodeType.LetDeclaration */)) {
                // Current TNode represents an `<ng-content>` slot or `@let` declaration,
                // thus it has no DOM elements associated with it, so the **next sibling**
                // node would not be able to find an anchor. In this case, use full path instead.
                let nextTNode = tNode.next;
                // Skip over all `<ng-content>` slots and `@let` declarations in a row.
                while (nextTNode !== null &&
                    nextTNode.type & (16 /* TNodeType.Projection */ | 128 /* TNodeType.LetDeclaration */)) {
                    nextTNode = nextTNode.next;
                }
                if (nextTNode && !isInSkipHydrationBlock(nextTNode)) {
                    // Handle a tNode after the `<ng-content>` slot.
                    appendSerializedNodePath(ngh, nextTNode, lView, i18nChildren);
                }
            }
            else if (tNode.type & 1 /* TNodeType.Text */) {
                const rNode = unwrapRNode(lView[i]);
                processTextNodeBeforeSerialization(context, rNode);
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
    if (isProjectionTNode(tNode)) {
        // Do not annotate projection nodes (<ng-content />), since
        // they don't have a corresponding DOM node representing them.
        return;
    }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYW5ub3RhdGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9oeWRyYXRpb24vYW5ub3RhdGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBR0gsT0FBTyxFQUFDLGdCQUFnQixFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQy9DLE9BQU8sRUFBQyxpQkFBaUIsRUFBQyxNQUFNLGFBQWEsQ0FBQztBQUU5QyxPQUFPLEVBQUMsV0FBVyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDOUMsT0FBTyxFQUFDLGtCQUFrQixFQUFFLDhCQUE4QixFQUFDLE1BQU0saUNBQWlDLENBQUM7QUFDbkcsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQ3RELE9BQU8sRUFBQyx1QkFBdUIsRUFBYSxNQUFNLGlDQUFpQyxDQUFDO0FBQ3BGLE9BQU8sRUFBQyxnQkFBZ0IsRUFBRSxZQUFZLEVBQW1CLE1BQU0sNEJBQTRCLENBQUM7QUFFNUYsT0FBTyxFQUNMLE9BQU8sRUFDUCxlQUFlLEVBQ2YsWUFBWSxFQUNaLGlCQUFpQixFQUNqQixVQUFVLEdBQ1gsTUFBTSxtQ0FBbUMsQ0FBQztBQUMzQyxPQUFPLEVBQ0wsT0FBTyxFQUNQLGFBQWEsRUFDYixJQUFJLEVBRUosTUFBTSxFQUNOLFFBQVEsRUFFUixLQUFLLEdBRU4sTUFBTSw0QkFBNEIsQ0FBQztBQUNwQyxPQUFPLEVBQUMsV0FBVyxFQUFFLFdBQVcsRUFBQyxNQUFNLDRCQUE0QixDQUFDO0FBQ3BFLE9BQU8sRUFBQyxhQUFhLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUVoRCxPQUFPLEVBQUMsK0JBQStCLEVBQUMsTUFBTSxrQkFBa0IsQ0FBQztBQUNqRSxPQUFPLEVBQUMsb0JBQW9CLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUNwRCxPQUFPLEVBQUMscUJBQXFCLEVBQUMsTUFBTSwyQkFBMkIsQ0FB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QztTQUFNLENBQUM7UUFDTixNQUFNLEdBQUcsR0FBRyxjQUFjLENBQUMsS0FBSyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBQzNDLE1BQU0sS0FBSyxHQUFHLE9BQU8sQ0FBQyx3QkFBd0IsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDeEQsUUFBUSxDQUFDLFlBQVksQ0FBQyxPQUFPLEVBQUUsYUFBYSxFQUFFLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1FBQ2hFLE9BQU8sS0FBSyxDQUFDO0lBQ2YsQ0FBQztBQUNILENBQUM7QUFFRDs7Ozs7Ozs7R0FRRztBQUNILFNBQVMsOEJBQThCLENBQ3JDLGtCQUE0QyxFQUM1QyxHQUFhO0lBRWIsS0FBSyxNQUFNLENBQUMsUUFBUSxFQUFFLE1BQU0sQ0FBQyxJQUFJLGtCQUFrQixFQUFFLENBQUM7UUFDcEQsUUFBUSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7SUFDNUMsQ0FBQztBQUNILENBQUM7QUFFRDs7O0dBR0c7QUFDSCxTQUFTLHNCQUFzQixDQUFDLEtBQVk7SUFDMUMsSUFBSSxZQUFZLEdBQUcsS0FBSyxDQUFDO0lBQ3pCLE9BQU8sWUFBWSxJQUFJLElBQUksRUFBRSxDQUFDO1FBQzVCLDREQUE0RDtRQUM1RCxtREFBbUQ7UUFDbkQsSUFBSSxlQUFlLENBQUMsWUFBWSxDQUFDLEVBQUUsQ0FBQztZQUNsQyxPQUFPLElBQUksQ0FBQztRQUNkLENBQUM7UUFDRCxZQUFZLEdBQUcsWUFBWSxDQUFDLE1BQWUsQ0FBQztJQUM5QyxDQUFDO0lBQ0QsT0FBTyxLQUFLLENBQUM7QUFDZixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7QXBwbGljYXRpb25SZWZ9IGZyb20gJy4uL2FwcGxpY2F0aW9uL2FwcGxpY2F0aW9uX3JlZic7XG5pbXBvcnQge2lzRGV0YWNoZWRCeUkxOG59IGZyb20gJy4uL2kxOG4vdXRpbHMnO1xuaW1wb3J0IHtWaWV3RW5jYXBzdWxhdGlvbn0gZnJvbSAnLi4vbWV0YWRhdGEnO1xuaW1wb3J0IHtSZW5kZXJlcjJ9IGZyb20gJy4uL3JlbmRlcic7XG5pbXBvcnQge2Fzc2VydFROb2RlfSBmcm9tICcuLi9yZW5kZXIzL2Fzc2VydCc7XG5pbXBvcnQge2NvbGxlY3ROYXRpdmVOb2RlcywgY29sbGVjdE5hdGl2ZU5vZGVzSW5MQ29udGFpbmVyfSBmcm9tICcuLi9yZW5kZXIzL2NvbGxlY3RfbmF0aXZlX25vZGVzJztcbmltcG9ydCB7Z2V0Q29tcG9uZW50RGVmfSBmcm9tICcuLi9yZW5kZXIzL2RlZmluaXRpb24nO1xuaW1wb3J0IHtDT05UQUlORVJfSEVBREVSX09GRlNFVCwgTENvbnRhaW5lcn0gZnJvbSAnLi4vcmVuZGVyMy9pbnRlcmZhY2VzL2NvbnRhaW5lcic7XG5pbXBvcnQge2lzTGV0RGVjbGFyYXRpb24sIGlzVE5vZGVTaGFwZSwgVE5vZGUsIFROb2RlVHlwZX0gZnJvbSAnLi4vcmVuZGVyMy9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtSRWxlbWVudH0gZnJvbSAnLi4vcmVuZGVyMy9pbnRlcmZhY2VzL3JlbmRlcmVyX2RvbSc7XG5pbXBvcnQge1xuICBoYXNJMThuLFxuICBpc0NvbXBvbmVudEhvc3QsXG4gIGlzTENvbnRhaW5lcixcbiAgaXNQcm9qZWN0aW9uVE5vZGUsXG4gIGlzUm9vdFZpZXcsXG59IGZyb20gJy4uL3JlbmRlcjMvaW50ZXJmYWNlcy90eXBlX2NoZWNrcyc7XG5pbXBvcnQge1xuICBDT05URVhULFxuICBIRUFERVJfT0ZGU0VULFxuICBIT1NULFxuICBMVmlldyxcbiAgUEFSRU5ULFxuICBSRU5ERVJFUixcbiAgVFZpZXcsXG4gIFRWSUVXLFxuICBUVmlld1R5cGUsXG59IGZyb20gJy4uL3JlbmRlcjMvaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7dW53cmFwTFZpZXcsIHVud3JhcFJOb2RlfSBmcm9tICcuLi9yZW5kZXIzL3V0aWwvdmlld191dGlscyc7XG5pbXBvcnQge1RyYW5zZmVyU3RhdGV9IGZyb20gJy4uL3RyYW5zZmVyX3N0YXRlJztcblxuaW1wb3J0IHt1bnN1cHBvcnRlZFByb2plY3Rpb25PZkRvbU5vZGVzfSBmcm9tICcuL2Vycm9yX2hhbmRsaW5nJztcbmltcG9ydCB7Y29sbGVjdERvbUV2ZW50c0luZm99IGZyb20gJy4vZXZlbnRfcmVwbGF5JztcbmltcG9ydCB7c2V0SlNBY3Rpb25BdHRyaWJ1dGVzfSBmcm9tICcuLi9ldmVudF9kZWxlZ2F0aW9uX3V0aWxzJztcbmltcG9ydCB7XG4gIGdldE9yQ29tcHV0ZUkxOG5DaGlsZHJlbixcbiAgaXNJMThuSHlkcmF0aW9uRW5hYmxlZCxcbiAgaXNJMThuSHlkcmF0aW9uU3VwcG9ydEVuYWJsZWQsXG4gIHRyeVNlcmlhbGl6ZUkxOG5CbG9jayxcbn0gZnJvbSAnLi9pMThuJztcbmltcG9ydCB7XG4gIENPTlRBSU5FUlMsXG4gIERJU0NPTk5FQ1RFRF9OT0RFUyxcbiAgRUxFTUVOVF9DT05UQUlORVJTLFxuICBJMThOX0RBVEEsXG4gIE1VTFRJUExJRVIsXG4gIE5PREVTLFxuICBOVU1fUk9PVF9OT0RFUyxcbiAgU2VyaWFsaXplZENvbnRhaW5lclZpZXcsXG4gIFNlcmlhbGl6ZWRWaWV3LFxuICBURU1QTEFURV9JRCxcbiAgVEVNUExBVEVTLFxufSBmcm9tICcuL2ludGVyZmFjZXMnO1xuaW1wb3J0IHtjYWxjUGF0aEZvck5vZGUsIGlzRGlzY29ubmVjdGVkTm9kZX0gZnJvbSAnLi9ub2RlX2xvb2t1cF91dGlscyc7XG5pbXBvcnQge2lzSW5Ta2lwSHlkcmF0aW9uQmxvY2ssIFNLSVBfSFlEUkFUSU9OX0FUVFJfTkFNRX0gZnJvbSAnLi9za2lwX2h5ZHJhdGlvbic7XG5pbXBvcnQge0VWRU5UX1JFUExBWV9FTkFCTEVEX0RFRkFVTFQsIElTX0VWRU5UX1JFUExBWV9FTkFCTEVEfSBmcm9tICcuL3Rva2Vucyc7XG5pbXBvcnQge1xuICBnZXRMTm9kZUZvckh5ZHJhdGlvbixcbiAgTkdIX0FUVFJfTkFNRSxcbiAgTkdIX0RBVEFfS0VZLFxuICBwcm9jZXNzVGV4dE5vZGVCZWZvcmVTZXJpYWxpemF0aW9uLFxuICBUZXh0Tm9kZU1hcmtlcixcbn0gZnJvbSAnLi91dGlscyc7XG5cbi8qKlxuICogQSBjb2xsZWN0aW9uIHRoYXQgdHJhY2tzIGFsbCBzZXJpYWxpemVkIHZpZXdzIChgbmdoYCBET00gYW5ub3RhdGlvbnMpXG4gKiB0byBhdm9pZCBkdXBsaWNhdGlvbi4gQW4gYXR0ZW1wdCB0byBhZGQgYSBkdXBsaWNhdGUgdmlldyByZXN1bHRzIGluIHRoZVxuICogY29sbGVjdGlvbiByZXR1cm5pbmcgdGhlIGluZGV4IG9mIHRoZSBwcmV2aW91c2x5IGNvbGxlY3RlZCBzZXJpYWxpemVkIHZpZXcuXG4gKiBUaGlzIHJlZHVjZXMgdGhlIG51bWJlciBvZiBhbm5vdGF0aW9ucyBuZWVkZWQgZm9yIGEgZ2l2ZW4gcGFnZS5cbiAqL1xuY2xhc3MgU2VyaWFsaXplZFZpZXdDb2xsZWN0aW9uIHtcbiAgcHJpdmF0ZSB2aWV3czogU2VyaWFsaXplZFZpZXdbXSA9IFtdO1xuICBwcml2YXRlIGluZGV4QnlDb250ZW50ID0gbmV3IE1hcDxzdHJpbmcsIG51bWJlcj4oKTtcblxuICBhZGQoc2VyaWFsaXplZFZpZXc6IFNlcmlhbGl6ZWRWaWV3KTogbnVtYmVyIHtcbiAgICBjb25zdCB2aWV3QXNTdHJpbmcgPSBKU09OLnN0cmluZ2lmeShzZXJpYWxpemVkVmlldyk7XG4gICAgaWYgKCF0aGlzLmluZGV4QnlDb250ZW50Lmhhcyh2aWV3QXNTdHJpbmcpKSB7XG4gICAgICBjb25zdCBpbmRleCA9IHRoaXMudmlld3MubGVuZ3RoO1xuICAgICAgdGhpcy52aWV3cy5wdXNoKHNlcmlhbGl6ZWRWaWV3KTtcbiAgICAgIHRoaXMuaW5kZXhCeUNvbnRlbnQuc2V0KHZpZXdBc1N0cmluZywgaW5kZXgpO1xuICAgICAgcmV0dXJuIGluZGV4O1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5pbmRleEJ5Q29udGVudC5nZXQodmlld0FzU3RyaW5nKSE7XG4gIH1cblxuICBnZXRBbGwoKTogU2VyaWFsaXplZFZpZXdbXSB7XG4gICAgcmV0dXJuIHRoaXMudmlld3M7XG4gIH1cbn1cblxuLyoqXG4gKiBHbG9iYWwgY291bnRlciB0aGF0IGlzIHVzZWQgdG8gZ2VuZXJhdGUgYSB1bmlxdWUgaWQgZm9yIFRWaWV3c1xuICogZHVyaW5nIHRoZSBzZXJpYWxpemF0aW9uIHByb2Nlc3MuXG4gKi9cbmxldCB0Vmlld1NzcklkID0gMDtcblxuLyoqXG4gKiBHZW5lcmF0ZXMgYSB1bmlxdWUgaWQgZm9yIGEgZ2l2ZW4gVFZpZXcgYW5kIHJldHVybnMgdGhpcyBpZC5cbiAqIFRoZSBpZCBpcyBhbHNvIHN0b3JlZCBvbiB0aGlzIGluc3RhbmNlIG9mIGEgVFZpZXcgYW5kIHJldXNlZCBpblxuICogc3Vic2VxdWVudCBjYWxscy5cbiAqXG4gKiBUaGlzIGlkIGlzIG5lZWRlZCB0byB1bmlxdWVseSBpZGVudGlmeSBhbmQgcGljayB1cCBkZWh5ZHJhdGVkIHZpZXdzXG4gKiBhdCBydW50aW1lLlxuICovXG5mdW5jdGlvbiBnZXRTc3JJZCh0VmlldzogVFZpZXcpOiBzdHJpbmcge1xuICBpZiAoIXRWaWV3LnNzcklkKSB7XG4gICAgdFZpZXcuc3NySWQgPSBgdCR7dFZpZXdTc3JJZCsrfWA7XG4gIH1cbiAgcmV0dXJuIHRWaWV3LnNzcklkO1xufVxuXG4vKipcbiAqIERlc2NyaWJlcyBhIGNvbnRleHQgYXZhaWxhYmxlIGR1cmluZyB0aGUgc2VyaWFsaXphdGlvblxuICogcHJvY2Vzcy4gVGhlIGNvbnRleHQgaXMgdXNlZCB0byBzaGFyZSBhbmQgY29sbGVjdCBpbmZvcm1hdGlvblxuICogZHVyaW5nIHRoZSBzZXJpYWxpemF0aW9uLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIEh5ZHJhdGlvbkNvbnRleHQge1xuICBzZXJpYWxpemVkVmlld0NvbGxlY3Rpb246IFNlcmlhbGl6ZWRWaWV3Q29sbGVjdGlvbjtcbiAgY29ycnVwdGVkVGV4dE5vZGVzOiBNYXA8SFRNTEVsZW1lbnQsIFRleHROb2RlTWFya2VyPjtcbiAgaXNJMThuSHlkcmF0aW9uRW5hYmxlZDogYm9vbGVhbjtcbiAgaTE4bkNoaWxkcmVuOiBNYXA8VFZpZXcsIFNldDxudW1iZXI+IHwgbnVsbD47XG4gIGV2ZW50VHlwZXNUb1JlcGxheToge3JlZ3VsYXI6IFNldDxzdHJpbmc+OyBjYXB0dXJlOiBTZXQ8c3RyaW5nPn07XG4gIHNob3VsZFJlcGxheUV2ZW50czogYm9vbGVhbjtcbn1cblxuLyoqXG4gKiBDb21wdXRlcyB0aGUgbnVtYmVyIG9mIHJvb3Qgbm9kZXMgaW4gYSBnaXZlbiB2aWV3XG4gKiAob3IgY2hpbGQgbm9kZXMgaW4gYSBnaXZlbiBjb250YWluZXIgaWYgYSB0Tm9kZSBpcyBwcm92aWRlZCkuXG4gKi9cbmZ1bmN0aW9uIGNhbGNOdW1Sb290Tm9kZXModFZpZXc6IFRWaWV3LCBsVmlldzogTFZpZXcsIHROb2RlOiBUTm9kZSB8IG51bGwpOiBudW1iZXIge1xuICBjb25zdCByb290Tm9kZXM6IHVua25vd25bXSA9IFtdO1xuICBjb2xsZWN0TmF0aXZlTm9kZXModFZpZXcsIGxWaWV3LCB0Tm9kZSwgcm9vdE5vZGVzKTtcbiAgcmV0dXJuIHJvb3ROb2Rlcy5sZW5ndGg7XG59XG5cbi8qKlxuICogQ29tcHV0ZXMgdGhlIG51bWJlciBvZiByb290IG5vZGVzIGluIGFsbCB2aWV3cyBpbiBhIGdpdmVuIExDb250YWluZXIuXG4gKi9cbmZ1bmN0aW9uIGNhbGNOdW1Sb290Tm9kZXNJbkxDb250YWluZXIobENvbnRhaW5lcjogTENvbnRhaW5lcik6IG51bWJlciB7XG4gIGNvbnN0IHJvb3ROb2RlczogdW5rbm93bltdID0gW107XG4gIGNvbGxlY3ROYXRpdmVOb2Rlc0luTENvbnRhaW5lcihsQ29udGFpbmVyLCByb290Tm9kZXMpO1xuICByZXR1cm4gcm9vdE5vZGVzLmxlbmd0aDtcbn1cblxuLyoqXG4gKiBBbm5vdGF0ZXMgcm9vdCBsZXZlbCBjb21wb25lbnQncyBMVmlldyBmb3IgaHlkcmF0aW9uLFxuICogc2VlIGBhbm5vdGF0ZUhvc3RFbGVtZW50Rm9ySHlkcmF0aW9uYCBmb3IgYWRkaXRpb25hbCBpbmZvcm1hdGlvbi5cbiAqL1xuZnVuY3Rpb24gYW5ub3RhdGVDb21wb25lbnRMVmlld0Zvckh5ZHJhdGlvbihcbiAgbFZpZXc6IExWaWV3LFxuICBjb250ZXh0OiBIeWRyYXRpb25Db250ZXh0LFxuKTogbnVtYmVyIHwgbnVsbCB7XG4gIGNvbnN0IGhvc3RFbGVtZW50ID0gbFZpZXdbSE9TVF07XG4gIC8vIFJvb3QgZWxlbWVudHMgbWlnaHQgYWxzbyBiZSBhbm5vdGF0ZWQgd2l0aCB0aGUgYG5nU2tpcEh5ZHJhdGlvbmAgYXR0cmlidXRlLFxuICAvLyBjaGVjayBpZiBpdCdzIHByZXNlbnQgYmVmb3JlIHN0YXJ0aW5nIHRoZSBzZXJpYWxpemF0aW9uIHByb2Nlc3MuXG4gIGlmIChob3N0RWxlbWVudCAmJiAhKGhvc3RFbGVtZW50IGFzIEhUTUxFbGVtZW50KS5oYXNBdHRyaWJ1dGUoU0tJUF9IWURSQVRJT05fQVRUUl9OQU1FKSkge1xuICAgIHJldHVybiBhbm5vdGF0ZUhvc3RFbGVtZW50Rm9ySHlkcmF0aW9uKGhvc3RFbGVtZW50IGFzIEhUTUxFbGVtZW50LCBsVmlldywgY29udGV4dCk7XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbi8qKlxuICogQW5ub3RhdGVzIHJvb3QgbGV2ZWwgTENvbnRhaW5lciBmb3IgaHlkcmF0aW9uLiBUaGlzIGhhcHBlbnMgd2hlbiBhIHJvb3QgY29tcG9uZW50XG4gKiBpbmplY3RzIFZpZXdDb250YWluZXJSZWYsIHRodXMgbWFraW5nIHRoZSBjb21wb25lbnQgYW4gYW5jaG9yIGZvciBhIHZpZXcgY29udGFpbmVyLlxuICogVGhpcyBmdW5jdGlvbiBzZXJpYWxpemVzIHRoZSBjb21wb25lbnQgaXRzZWxmIGFzIHdlbGwgYXMgYWxsIHZpZXdzIGZyb20gdGhlIHZpZXdcbiAqIGNvbnRhaW5lci5cbiAqL1xuZnVuY3Rpb24gYW5ub3RhdGVMQ29udGFpbmVyRm9ySHlkcmF0aW9uKGxDb250YWluZXI6IExDb250YWluZXIsIGNvbnRleHQ6IEh5ZHJhdGlvbkNvbnRleHQpIHtcbiAgY29uc3QgY29tcG9uZW50TFZpZXcgPSB1bndyYXBMVmlldyhsQ29udGFpbmVyW0hPU1RdKSBhcyBMVmlldzx1bmtub3duPjtcblxuICAvLyBTZXJpYWxpemUgdGhlIHJvb3QgY29tcG9uZW50IGl0c2VsZi5cbiAgY29uc3QgY29tcG9uZW50TFZpZXdOZ2hJbmRleCA9IGFubm90YXRlQ29tcG9uZW50TFZpZXdGb3JIeWRyYXRpb24oY29tcG9uZW50TFZpZXcsIGNvbnRleHQpO1xuXG4gIGlmIChjb21wb25lbnRMVmlld05naEluZGV4ID09PSBudWxsKSB7XG4gICAgLy8gQ29tcG9uZW50IHdhcyBub3Qgc2VyaWFsaXplZCAoZm9yIGV4YW1wbGUsIGlmIGh5ZHJhdGlvbiB3YXMgc2tpcHBlZCBieSBhZGRpbmdcbiAgICAvLyB0aGUgYG5nU2tpcEh5ZHJhdGlvbmAgYXR0cmlidXRlIG9yIHRoaXMgY29tcG9uZW50IHVzZXMgaTE4biBibG9ja3MgaW4gdGhlIHRlbXBsYXRlLFxuICAgIC8vIGJ1dCBgd2l0aEkxOG5TdXBwb3J0KClgIHdhcyBub3QgYWRkZWQpLCBhdm9pZCBhbm5vdGF0aW5nIGhvc3QgZWxlbWVudCB3aXRoIHRoZSBgbmdoYFxuICAgIC8vIGF0dHJpYnV0ZS5cbiAgICByZXR1cm47XG4gIH1cblxuICBjb25zdCBob3N0RWxlbWVudCA9IHVud3JhcFJOb2RlKGNvbXBvbmVudExWaWV3W0hPU1RdISkgYXMgSFRNTEVsZW1lbnQ7XG5cbiAgLy8gU2VyaWFsaXplIGFsbCB2aWV3cyB3aXRoaW4gdGhpcyB2aWV3IGNvbnRhaW5lci5cbiAgY29uc3Qgcm9vdExWaWV3ID0gbENvbnRhaW5lcltQQVJFTlRdO1xuICBjb25zdCByb290TFZpZXdOZ2hJbmRleCA9IGFubm90YXRlSG9zdEVsZW1lbnRGb3JIeWRyYXRpb24oaG9zdEVsZW1lbnQsIHJvb3RMVmlldywgY29udGV4dCk7XG5cbiAgY29uc3QgcmVuZGVyZXIgPSBjb21wb25lbnRMVmlld1tSRU5ERVJFUl0gYXMgUmVuZGVyZXIyO1xuXG4gIC8vIEZvciBjYXNlcyB3aGVuIGEgcm9vdCBjb21wb25lbnQgYWxzbyBhY3RzIGFzIGFuIGFuY2hvciBub2RlIGZvciBhIFZpZXdDb250YWluZXJSZWZcbiAgLy8gKGZvciBleGFtcGxlLCB3aGVuIFZpZXdDb250YWluZXJSZWYgaXMgaW5qZWN0ZWQgaW4gYSByb290IGNvbXBvbmVudCksIHRoZXJlIGlzIGEgbmVlZFxuICAvLyB0byBzZXJpYWxpemUgaW5mb3JtYXRpb24gYWJvdXQgdGhlIGNvbXBvbmVudCBpdHNlbGYsIGFzIHdlbGwgYXMgYW4gTENvbnRhaW5lciB0aGF0XG4gIC8vIHJlcHJlc2VudHMgdGhpcyBWaWV3Q29udGFpbmVyUmVmLiBFZmZlY3RpdmVseSwgd2UgbmVlZCB0byBzZXJpYWxpemUgMiBwaWVjZXMgb2YgaW5mbzpcbiAgLy8gKDEpIGh5ZHJhdGlvbiBpbmZvIGZvciB0aGUgcm9vdCBjb21wb25lbnQgaXRzZWxmIGFuZCAoMikgaHlkcmF0aW9uIGluZm8gZm9yIHRoZVxuICAvLyBWaWV3Q29udGFpbmVyUmVmIGluc3RhbmNlIChhbiBMQ29udGFpbmVyKS4gRWFjaCBwaWVjZSBvZiBpbmZvcm1hdGlvbiBpcyBpbmNsdWRlZCBpbnRvXG4gIC8vIHRoZSBoeWRyYXRpb24gZGF0YSAoaW4gdGhlIFRyYW5zZmVyU3RhdGUgb2JqZWN0KSBzZXBhcmF0ZWx5LCB0aHVzIHdlIGVuZCB1cCB3aXRoIDIgaWRzLlxuICAvLyBTaW5jZSB3ZSBvbmx5IGhhdmUgMSByb290IGVsZW1lbnQsIHdlIGVuY29kZSBib3RoIGJpdHMgb2YgaW5mbyBpbnRvIGEgc2luZ2xlIHN0cmluZzpcbiAgLy8gaWRzIGFyZSBzZXBhcmF0ZWQgYnkgdGhlIGB8YCBjaGFyIChlLmcuIGAxMHwyNWAsIHdoZXJlIGAxMGAgaXMgdGhlIG5naCBmb3IgYSBjb21wb25lbnQgdmlld1xuICAvLyBhbmQgMjUgaXMgdGhlIGBuZ2hgIGZvciBhIHJvb3QgdmlldyB3aGljaCBob2xkcyBMQ29udGFpbmVyKS5cbiAgY29uc3QgZmluYWxJbmRleCA9IGAke2NvbXBvbmVudExWaWV3TmdoSW5kZXh9fCR7cm9vdExWaWV3TmdoSW5kZXh9YDtcbiAgcmVuZGVyZXIuc2V0QXR0cmlidXRlKGhvc3RFbGVtZW50LCBOR0hfQVRUUl9OQU1FLCBmaW5hbEluZGV4KTtcbn1cblxuLyoqXG4gKiBBbm5vdGF0ZXMgYWxsIGNvbXBvbmVudHMgYm9vdHN0cmFwcGVkIGluIGEgZ2l2ZW4gQXBwbGljYXRpb25SZWZcbiAqIHdpdGggaW5mbyBuZWVkZWQgZm9yIGh5ZHJhdGlvbi5cbiAqXG4gKiBAcGFyYW0gYXBwUmVmIEFuIGluc3RhbmNlIG9mIGFuIEFwcGxpY2F0aW9uUmVmLlxuICogQHBhcmFtIGRvYyBBIHJlZmVyZW5jZSB0byB0aGUgY3VycmVudCBEb2N1bWVudCBpbnN0YW5jZS5cbiAqIEByZXR1cm4gZXZlbnQgdHlwZXMgdGhhdCBuZWVkIHRvIGJlIHJlcGxheWVkXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhbm5vdGF0ZUZvckh5ZHJhdGlvbihhcHBSZWY6IEFwcGxpY2F0aW9uUmVmLCBkb2M6IERvY3VtZW50KSB7XG4gIGNvbnN0IGluamVjdG9yID0gYXBwUmVmLmluamVjdG9yO1xuICBjb25zdCBpc0kxOG5IeWRyYXRpb25FbmFibGVkVmFsID0gaXNJMThuSHlkcmF0aW9uRW5hYmxlZChpbmplY3Rvcik7XG4gIGNvbnN0IHNlcmlhbGl6ZWRWaWV3Q29sbGVjdGlvbiA9IG5ldyBTZXJpYWxpemVkVmlld0NvbGxlY3Rpb24oKTtcbiAgY29uc3QgY29ycnVwdGVkVGV4dE5vZGVzID0gbmV3IE1hcDxIVE1MRWxlbWVudCwgVGV4dE5vZGVNYXJrZXI+KCk7XG4gIGNvbnN0IHZpZXdSZWZzID0gYXBwUmVmLl92aWV3cztcbiAgY29uc3Qgc2hvdWxkUmVwbGF5RXZlbnRzID0gaW5qZWN0b3IuZ2V0KElTX0VWRU5UX1JFUExBWV9FTkFCTEVELCBFVkVOVF9SRVBMQVlfRU5BQkxFRF9ERUZBVUxUKTtcbiAgY29uc3QgZXZlbnRUeXBlc1RvUmVwbGF5ID0ge1xuICAgIHJlZ3VsYXI6IG5ldyBTZXQ8c3RyaW5nPigpLFxuICAgIGNhcHR1cmU6IG5ldyBTZXQ8c3RyaW5nPigpLFxuICB9O1xuICBmb3IgKGNvbnN0IHZpZXdSZWYgb2Ygdmlld1JlZnMpIHtcbiAgICBjb25zdCBsTm9kZSA9IGdldExOb2RlRm9ySHlkcmF0aW9uKHZpZXdSZWYpO1xuXG4gICAgLy8gQW4gYGxWaWV3YCBtaWdodCBiZSBgbnVsbGAgaWYgYSBgVmlld1JlZmAgcmVwcmVzZW50c1xuICAgIC8vIGFuIGVtYmVkZGVkIHZpZXcgKG5vdCBhIGNvbXBvbmVudCB2aWV3KS5cbiAgICBpZiAobE5vZGUgIT09IG51bGwpIHtcbiAgICAgIGNvbnN0IGNvbnRleHQ6IEh5ZHJhdGlvbkNvbnRleHQgPSB7XG4gICAgICAgIHNlcmlhbGl6ZWRWaWV3Q29sbGVjdGlvbixcbiAgICAgICAgY29ycnVwdGVkVGV4dE5vZGVzLFxuICAgICAgICBpc0kxOG5IeWRyYXRpb25FbmFibGVkOiBpc0kxOG5IeWRyYXRpb25FbmFibGVkVmFsLFxuICAgICAgICBpMThuQ2hpbGRyZW46IG5ldyBNYXAoKSxcbiAgICAgICAgZXZlbnRUeXBlc1RvUmVwbGF5LFxuICAgICAgICBzaG91bGRSZXBsYXlFdmVudHMsXG4gICAgICB9O1xuICAgICAgaWYgKGlzTENvbnRhaW5lcihsTm9kZSkpIHtcbiAgICAgICAgYW5ub3RhdGVMQ29udGFpbmVyRm9ySHlkcmF0aW9uKGxOb2RlLCBjb250ZXh0KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGFubm90YXRlQ29tcG9uZW50TFZpZXdGb3JIeWRyYXRpb24obE5vZGUsIGNvbnRleHQpO1xuICAgICAgfVxuICAgICAgaW5zZXJ0Q29ycnVwdGVkVGV4dE5vZGVNYXJrZXJzKGNvcnJ1cHRlZFRleHROb2RlcywgZG9jKTtcbiAgICB9XG4gIH1cblxuICAvLyBOb3RlOiB3ZSAqYWx3YXlzKiBpbmNsdWRlIGh5ZHJhdGlvbiBpbmZvIGtleSBhbmQgYSBjb3JyZXNwb25kaW5nIHZhbHVlXG4gIC8vIGludG8gdGhlIFRyYW5zZmVyU3RhdGUsIGV2ZW4gaWYgdGhlIGxpc3Qgb2Ygc2VyaWFsaXplZCB2aWV3cyBpcyBlbXB0eS5cbiAgLy8gVGhpcyBpcyBuZWVkZWQgYXMgYSBzaWduYWwgdG8gdGhlIGNsaWVudCB0aGF0IHRoZSBzZXJ2ZXIgcGFydCBvZiB0aGVcbiAgLy8gaHlkcmF0aW9uIGxvZ2ljIHdhcyBzZXR1cCBhbmQgZW5hYmxlZCBjb3JyZWN0bHkuIE90aGVyd2lzZSwgaWYgYSBjbGllbnRcbiAgLy8gaHlkcmF0aW9uIGRvZXNuJ3QgZmluZCBhIGtleSBpbiB0aGUgdHJhbnNmZXIgc3RhdGUgLSBhbiBlcnJvciBpcyBwcm9kdWNlZC5cbiAgY29uc3Qgc2VyaWFsaXplZFZpZXdzID0gc2VyaWFsaXplZFZpZXdDb2xsZWN0aW9uLmdldEFsbCgpO1xuICBjb25zdCB0cmFuc2ZlclN0YXRlID0gaW5qZWN0b3IuZ2V0KFRyYW5zZmVyU3RhdGUpO1xuICB0cmFuc2ZlclN0YXRlLnNldChOR0hfREFUQV9LRVksIHNlcmlhbGl6ZWRWaWV3cyk7XG4gIHJldHVybiBldmVudFR5cGVzVG9SZXBsYXk7XG59XG5cbi8qKlxuICogU2VyaWFsaXplcyB0aGUgbENvbnRhaW5lciBkYXRhIGludG8gYSBsaXN0IG9mIFNlcmlhbGl6ZWRWaWV3IG9iamVjdHMsXG4gKiB0aGF0IHJlcHJlc2VudCB2aWV3cyB3aXRoaW4gdGhpcyBsQ29udGFpbmVyLlxuICpcbiAqIEBwYXJhbSBsQ29udGFpbmVyIHRoZSBsQ29udGFpbmVyIHdlIGFyZSBzZXJpYWxpemluZ1xuICogQHBhcmFtIGNvbnRleHQgdGhlIGh5ZHJhdGlvbiBjb250ZXh0XG4gKiBAcmV0dXJucyBhbiBhcnJheSBvZiB0aGUgYFNlcmlhbGl6ZWRWaWV3YCBvYmplY3RzXG4gKi9cbmZ1bmN0aW9uIHNlcmlhbGl6ZUxDb250YWluZXIoXG4gIGxDb250YWluZXI6IExDb250YWluZXIsXG4gIGNvbnRleHQ6IEh5ZHJhdGlvbkNvbnRleHQsXG4pOiBTZXJpYWxpemVkQ29udGFpbmVyVmlld1tdIHtcbiAgY29uc3Qgdmlld3M6IFNlcmlhbGl6ZWRDb250YWluZXJWaWV3W10gPSBbXTtcbiAgbGV0IGxhc3RWaWV3QXNTdHJpbmcgPSAnJztcblxuICBmb3IgKGxldCBpID0gQ09OVEFJTkVSX0hFQURFUl9PRkZTRVQ7IGkgPCBsQ29udGFpbmVyLmxlbmd0aDsgaSsrKSB7XG4gICAgbGV0IGNoaWxkTFZpZXcgPSBsQ29udGFpbmVyW2ldIGFzIExWaWV3O1xuXG4gICAgbGV0IHRlbXBsYXRlOiBzdHJpbmc7XG4gICAgbGV0IG51bVJvb3ROb2RlczogbnVtYmVyO1xuICAgIGxldCBzZXJpYWxpemVkVmlldzogU2VyaWFsaXplZENvbnRhaW5lclZpZXcgfCB1bmRlZmluZWQ7XG5cbiAgICBpZiAoaXNSb290VmlldyhjaGlsZExWaWV3KSkge1xuICAgICAgLy8gSWYgdGhpcyBpcyBhIHJvb3QgdmlldywgZ2V0IGFuIExWaWV3IGZvciB0aGUgdW5kZXJseWluZyBjb21wb25lbnQsXG4gICAgICAvLyBiZWNhdXNlIGl0IGNvbnRhaW5zIGluZm9ybWF0aW9uIGFib3V0IHRoZSB2aWV3IHRvIHNlcmlhbGl6ZS5cbiAgICAgIGNoaWxkTFZpZXcgPSBjaGlsZExWaWV3W0hFQURFUl9PRkZTRVRdO1xuXG4gICAgICAvLyBJZiB3ZSBoYXZlIGFuIExDb250YWluZXIgYXQgdGhpcyBwb3NpdGlvbiwgdGhpcyBpbmRpY2F0ZXMgdGhhdCB0aGVcbiAgICAgIC8vIGhvc3QgZWxlbWVudCB3YXMgdXNlZCBhcyBhIFZpZXdDb250YWluZXJSZWYgYW5jaG9yIChlLmcuIGEgYFZpZXdDb250YWluZXJSZWZgXG4gICAgICAvLyB3YXMgaW5qZWN0ZWQgd2l0aGluIHRoZSBjb21wb25lbnQgY2xhc3MpLiBUaGlzIGNhc2UgcmVxdWlyZXMgc3BlY2lhbCBoYW5kbGluZy5cbiAgICAgIGlmIChpc0xDb250YWluZXIoY2hpbGRMVmlldykpIHtcbiAgICAgICAgLy8gQ2FsY3VsYXRlIHRoZSBudW1iZXIgb2Ygcm9vdCBub2RlcyBpbiBhbGwgdmlld3MgaW4gYSBnaXZlbiBjb250YWluZXJcbiAgICAgICAgLy8gYW5kIGluY3JlbWVudCBieSBvbmUgdG8gYWNjb3VudCBmb3IgYW4gYW5jaG9yIG5vZGUgaXRzZWxmLCBpLmUuIGluIHRoaXNcbiAgICAgICAgLy8gc2NlbmFyaW8gd2UnbGwgaGF2ZSBhIGxheW91dCB0aGF0IHdvdWxkIGxvb2sgbGlrZSB0aGlzOlxuICAgICAgICAvLyBgPGFwcC1yb290IC8+PCNWSUVXMT48I1ZJRVcyPi4uLjwhLS1jb250YWluZXItLT5gXG4gICAgICAgIC8vIFRoZSBgKzFgIGlzIHRvIGNhcHR1cmUgdGhlIGA8YXBwLXJvb3QgLz5gIGVsZW1lbnQuXG4gICAgICAgIG51bVJvb3ROb2RlcyA9IGNhbGNOdW1Sb290Tm9kZXNJbkxDb250YWluZXIoY2hpbGRMVmlldykgKyAxO1xuXG4gICAgICAgIGFubm90YXRlTENvbnRhaW5lckZvckh5ZHJhdGlvbihjaGlsZExWaWV3LCBjb250ZXh0KTtcblxuICAgICAgICBjb25zdCBjb21wb25lbnRMVmlldyA9IHVud3JhcExWaWV3KGNoaWxkTFZpZXdbSE9TVF0pIGFzIExWaWV3PHVua25vd24+O1xuXG4gICAgICAgIHNlcmlhbGl6ZWRWaWV3ID0ge1xuICAgICAgICAgIFtURU1QTEFURV9JRF06IGNvbXBvbmVudExWaWV3W1RWSUVXXS5zc3JJZCEsXG4gICAgICAgICAgW05VTV9ST09UX05PREVTXTogbnVtUm9vdE5vZGVzLFxuICAgICAgICB9O1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmICghc2VyaWFsaXplZFZpZXcpIHtcbiAgICAgIGNvbnN0IGNoaWxkVFZpZXcgPSBjaGlsZExWaWV3W1RWSUVXXTtcblxuICAgICAgaWYgKGNoaWxkVFZpZXcudHlwZSA9PT0gVFZpZXdUeXBlLkNvbXBvbmVudCkge1xuICAgICAgICB0ZW1wbGF0ZSA9IGNoaWxkVFZpZXcuc3NySWQhO1xuXG4gICAgICAgIC8vIFRoaXMgaXMgYSBjb21wb25lbnQgdmlldywgdGh1cyBpdCBoYXMgb25seSAxIHJvb3Qgbm9kZTogdGhlIGNvbXBvbmVudFxuICAgICAgICAvLyBob3N0IG5vZGUgaXRzZWxmIChvdGhlciBub2RlcyB3b3VsZCBiZSBpbnNpZGUgdGhhdCBob3N0IG5vZGUpLlxuICAgICAgICBudW1Sb290Tm9kZXMgPSAxO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGVtcGxhdGUgPSBnZXRTc3JJZChjaGlsZFRWaWV3KTtcbiAgICAgICAgbnVtUm9vdE5vZGVzID0gY2FsY051bVJvb3ROb2RlcyhjaGlsZFRWaWV3LCBjaGlsZExWaWV3LCBjaGlsZFRWaWV3LmZpcnN0Q2hpbGQpO1xuICAgICAgfVxuXG4gICAgICBzZXJpYWxpemVkVmlldyA9IHtcbiAgICAgICAgW1RFTVBMQVRFX0lEXTogdGVtcGxhdGUsXG4gICAgICAgIFtOVU1fUk9PVF9OT0RFU106IG51bVJvb3ROb2RlcyxcbiAgICAgICAgLi4uc2VyaWFsaXplTFZpZXcobENvbnRhaW5lcltpXSBhcyBMVmlldywgY29udGV4dCksXG4gICAgICB9O1xuICAgIH1cblxuICAgIC8vIENoZWNrIGlmIHRoZSBwcmV2aW91cyB2aWV3IGhhcyB0aGUgc2FtZSBzaGFwZSAoZm9yIGV4YW1wbGUsIGl0IHdhc1xuICAgIC8vIHByb2R1Y2VkIGJ5IHRoZSAqbmdGb3IpLCBpbiB3aGljaCBjYXNlIGJ1bXAgdGhlIGNvdW50ZXIgb24gdGhlIHByZXZpb3VzXG4gICAgLy8gdmlldyBpbnN0ZWFkIG9mIGluY2x1ZGluZyB0aGUgc2FtZSBpbmZvcm1hdGlvbiBhZ2Fpbi5cbiAgICBjb25zdCBjdXJyZW50Vmlld0FzU3RyaW5nID0gSlNPTi5zdHJpbmdpZnkoc2VyaWFsaXplZFZpZXcpO1xuICAgIGlmICh2aWV3cy5sZW5ndGggPiAwICYmIGN1cnJlbnRWaWV3QXNTdHJpbmcgPT09IGxhc3RWaWV3QXNTdHJpbmcpIHtcbiAgICAgIGNvbnN0IHByZXZpb3VzVmlldyA9IHZpZXdzW3ZpZXdzLmxlbmd0aCAtIDFdO1xuICAgICAgcHJldmlvdXNWaWV3W01VTFRJUExJRVJdID8/PSAxO1xuICAgICAgcHJldmlvdXNWaWV3W01VTFRJUExJRVJdKys7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIFJlY29yZCB0aGlzIHZpZXcgYXMgbW9zdCByZWNlbnRseSBhZGRlZC5cbiAgICAgIGxhc3RWaWV3QXNTdHJpbmcgPSBjdXJyZW50Vmlld0FzU3RyaW5nO1xuICAgICAgdmlld3MucHVzaChzZXJpYWxpemVkVmlldyk7XG4gICAgfVxuICB9XG4gIHJldHVybiB2aWV3cztcbn1cblxuLyoqXG4gKiBIZWxwZXIgZnVuY3Rpb24gdG8gcHJvZHVjZSBhIG5vZGUgcGF0aCAod2hpY2ggbmF2aWdhdGlvbiBzdGVwcyBydW50aW1lIGxvZ2ljXG4gKiBuZWVkcyB0byB0YWtlIHRvIGxvY2F0ZSBhIG5vZGUpIGFuZCBzdG9yZXMgaXQgaW4gdGhlIGBOT0RFU2Agc2VjdGlvbiBvZiB0aGVcbiAqIGN1cnJlbnQgc2VyaWFsaXplZCB2aWV3LlxuICovXG5mdW5jdGlvbiBhcHBlbmRTZXJpYWxpemVkTm9kZVBhdGgoXG4gIG5naDogU2VyaWFsaXplZFZpZXcsXG4gIHROb2RlOiBUTm9kZSxcbiAgbFZpZXc6IExWaWV3LFxuICBleGNsdWRlZFBhcmVudE5vZGVzOiBTZXQ8bnVtYmVyPiB8IG51bGwsXG4pIHtcbiAgY29uc3Qgbm9PZmZzZXRJbmRleCA9IHROb2RlLmluZGV4IC0gSEVBREVSX09GRlNFVDtcbiAgbmdoW05PREVTXSA/Pz0ge307XG4gIC8vIEVuc3VyZSB3ZSBkb24ndCBjYWxjdWxhdGUgdGhlIHBhdGggbXVsdGlwbGUgdGltZXMuXG4gIG5naFtOT0RFU11bbm9PZmZzZXRJbmRleF0gPz89IGNhbGNQYXRoRm9yTm9kZSh0Tm9kZSwgbFZpZXcsIGV4Y2x1ZGVkUGFyZW50Tm9kZXMpO1xufVxuXG4vKipcbiAqIEhlbHBlciBmdW5jdGlvbiB0byBhcHBlbmQgaW5mb3JtYXRpb24gYWJvdXQgYSBkaXNjb25uZWN0ZWQgbm9kZS5cbiAqIFRoaXMgaW5mbyBpcyBuZWVkZWQgYXQgcnVudGltZSB0byBhdm9pZCBET00gbG9va3VwcyBmb3IgdGhpcyBlbGVtZW50XG4gKiBhbmQgaW5zdGVhZCwgdGhlIGVsZW1lbnQgd291bGQgYmUgY3JlYXRlZCBmcm9tIHNjcmF0Y2guXG4gKi9cbmZ1bmN0aW9uIGFwcGVuZERpc2Nvbm5lY3RlZE5vZGVJbmRleChuZ2g6IFNlcmlhbGl6ZWRWaWV3LCB0Tm9kZU9yTm9PZmZzZXRJbmRleDogVE5vZGUgfCBudW1iZXIpIHtcbiAgY29uc3Qgbm9PZmZzZXRJbmRleCA9XG4gICAgdHlwZW9mIHROb2RlT3JOb09mZnNldEluZGV4ID09PSAnbnVtYmVyJ1xuICAgICAgPyB0Tm9kZU9yTm9PZmZzZXRJbmRleFxuICAgICAgOiB0Tm9kZU9yTm9PZmZzZXRJbmRleC5pbmRleCAtIEhFQURFUl9PRkZTRVQ7XG4gIG5naFtESVNDT05ORUNURURfTk9ERVNdID8/PSBbXTtcbiAgaWYgKCFuZ2hbRElTQ09OTkVDVEVEX05PREVTXS5pbmNsdWRlcyhub09mZnNldEluZGV4KSkge1xuICAgIG5naFtESVNDT05ORUNURURfTk9ERVNdLnB1c2gobm9PZmZzZXRJbmRleCk7XG4gIH1cbn1cblxuLyoqXG4gKiBTZXJpYWxpemVzIHRoZSBsVmlldyBkYXRhIGludG8gYSBTZXJpYWxpemVkVmlldyBvYmplY3QgdGhhdCB3aWxsIGxhdGVyIGJlIGFkZGVkXG4gKiB0byB0aGUgVHJhbnNmZXJTdGF0ZSBzdG9yYWdlIGFuZCByZWZlcmVuY2VkIHVzaW5nIHRoZSBgbmdoYCBhdHRyaWJ1dGUgb24gYSBob3N0XG4gKiBlbGVtZW50LlxuICpcbiAqIEBwYXJhbSBsVmlldyB0aGUgbFZpZXcgd2UgYXJlIHNlcmlhbGl6aW5nXG4gKiBAcGFyYW0gY29udGV4dCB0aGUgaHlkcmF0aW9uIGNvbnRleHRcbiAqIEByZXR1cm5zIHRoZSBgU2VyaWFsaXplZFZpZXdgIG9iamVjdCBjb250YWluaW5nIHRoZSBkYXRhIHRvIGJlIGFkZGVkIHRvIHRoZSBob3N0IG5vZGVcbiAqL1xuZnVuY3Rpb24gc2VyaWFsaXplTFZpZXcobFZpZXc6IExWaWV3LCBjb250ZXh0OiBIeWRyYXRpb25Db250ZXh0KTogU2VyaWFsaXplZFZpZXcge1xuICBjb25zdCBuZ2g6IFNlcmlhbGl6ZWRWaWV3ID0ge307XG4gIGNvbnN0IHRWaWV3ID0gbFZpZXdbVFZJRVddO1xuICBjb25zdCBpMThuQ2hpbGRyZW4gPSBnZXRPckNvbXB1dGVJMThuQ2hpbGRyZW4odFZpZXcsIGNvbnRleHQpO1xuICBjb25zdCBuYXRpdmVFbGVtZW50c1RvRXZlbnRUeXBlcyA9IGNvbnRleHQuc2hvdWxkUmVwbGF5RXZlbnRzXG4gICAgPyBjb2xsZWN0RG9tRXZlbnRzSW5mbyh0VmlldywgbFZpZXcsIGNvbnRleHQuZXZlbnRUeXBlc1RvUmVwbGF5KVxuICAgIDogbnVsbDtcbiAgLy8gSXRlcmF0ZSBvdmVyIERPTSBlbGVtZW50IHJlZmVyZW5jZXMgaW4gYW4gTFZpZXcuXG4gIGZvciAobGV0IGkgPSBIRUFERVJfT0ZGU0VUOyBpIDwgdFZpZXcuYmluZGluZ1N0YXJ0SW5kZXg7IGkrKykge1xuICAgIGNvbnN0IHROb2RlID0gdFZpZXcuZGF0YVtpXTtcbiAgICBjb25zdCBub09mZnNldEluZGV4ID0gaSAtIEhFQURFUl9PRkZTRVQ7XG5cbiAgICAvLyBBdHRlbXB0IHRvIHNlcmlhbGl6ZSBhbnkgaTE4biBkYXRhIGZvciB0aGUgZ2l2ZW4gc2xvdC4gV2UgZG8gdGhpcyBmaXJzdCwgYXMgaTE4blxuICAgIC8vIGhhcyBpdHMgb3duIHByb2Nlc3MgZm9yIHNlcmlhbGl6YXRpb24uXG4gICAgY29uc3QgaTE4bkRhdGEgPSB0cnlTZXJpYWxpemVJMThuQmxvY2sobFZpZXcsIGksIGNvbnRleHQpO1xuICAgIGlmIChpMThuRGF0YSkge1xuICAgICAgbmdoW0kxOE5fREFUQV0gPz89IHt9O1xuICAgICAgbmdoW0kxOE5fREFUQV1bbm9PZmZzZXRJbmRleF0gPSBpMThuRGF0YS5jYXNlUXVldWU7XG5cbiAgICAgIGZvciAoY29uc3Qgbm9kZU5vT2Zmc2V0SW5kZXggb2YgaTE4bkRhdGEuZGlzY29ubmVjdGVkTm9kZXMpIHtcbiAgICAgICAgYXBwZW5kRGlzY29ubmVjdGVkTm9kZUluZGV4KG5naCwgbm9kZU5vT2Zmc2V0SW5kZXgpO1xuICAgICAgfVxuXG4gICAgICBmb3IgKGNvbnN0IG5vZGVOb09mZnNldEluZGV4IG9mIGkxOG5EYXRhLmRpc2pvaW50Tm9kZXMpIHtcbiAgICAgICAgY29uc3QgdE5vZGUgPSB0Vmlldy5kYXRhW25vZGVOb09mZnNldEluZGV4ICsgSEVBREVSX09GRlNFVF0gYXMgVE5vZGU7XG4gICAgICAgIG5nRGV2TW9kZSAmJiBhc3NlcnRUTm9kZSh0Tm9kZSk7XG4gICAgICAgIGFwcGVuZFNlcmlhbGl6ZWROb2RlUGF0aChuZ2gsIHROb2RlLCBsVmlldywgaTE4bkNoaWxkcmVuKTtcbiAgICAgIH1cblxuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgLy8gU2tpcCBwcm9jZXNzaW5nIG9mIGEgZ2l2ZW4gc2xvdCBpbiB0aGUgZm9sbG93aW5nIGNhc2VzOlxuICAgIC8vIC0gTG9jYWwgcmVmcyAoZS5nLiA8ZGl2ICNsb2NhbFJlZj4pIHRha2UgdXAgYW4gZXh0cmEgc2xvdCBpbiBMVmlld3NcbiAgICAvLyAgIHRvIHN0b3JlIHRoZSBzYW1lIGVsZW1lbnQuIEluIHRoaXMgY2FzZSwgdGhlcmUgaXMgbm8gaW5mb3JtYXRpb24gaW5cbiAgICAvLyAgIGEgY29ycmVzcG9uZGluZyBzbG90IGluIFROb2RlIGRhdGEgc3RydWN0dXJlLlxuICAgIC8vIC0gV2hlbiBhIHNsb3QgY29udGFpbnMgc29tZXRoaW5nIG90aGVyIHRoYW4gYSBUTm9kZS4gRm9yIGV4YW1wbGUsIHRoZXJlXG4gICAgLy8gICBtaWdodCBiZSBzb21lIG1ldGFkYXRhIGluZm9ybWF0aW9uIGFib3V0IGEgZGVmZXIgYmxvY2sgb3IgYSBjb250cm9sIGZsb3cgYmxvY2suXG4gICAgaWYgKCFpc1ROb2RlU2hhcGUodE5vZGUpKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICAvLyBTa2lwIGFueSBub2RlcyB0aGF0IGFyZSBpbiBhbiBpMThuIGJsb2NrIGJ1dCBhcmUgY29uc2lkZXJlZCBkZXRhY2hlZCAoaS5lLiBub3RcbiAgICAvLyBwcmVzZW50IGluIHRoZSB0ZW1wbGF0ZSkuIFRoZXNlIG5vZGVzIGFyZSBkaXNjb25uZWN0ZWQgZnJvbSB0aGUgRE9NIHRyZWUsIGFuZFxuICAgIC8vIHNvIHdlIGRvbid0IHdhbnQgdG8gc2VyaWFsaXplIGFueSBpbmZvcm1hdGlvbiBhYm91dCB0aGVtLlxuICAgIGlmIChpc0RldGFjaGVkQnlJMThuKHROb2RlKSkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgLy8gQ2hlY2sgaWYgYSBuYXRpdmUgbm9kZSB0aGF0IHJlcHJlc2VudHMgYSBnaXZlbiBUTm9kZSBpcyBkaXNjb25uZWN0ZWQgZnJvbSB0aGUgRE9NIHRyZWUuXG4gICAgLy8gU3VjaCBub2RlcyBtdXN0IGJlIGV4Y2x1ZGVkIGZyb20gdGhlIGh5ZHJhdGlvbiAoc2luY2UgdGhlIGh5ZHJhdGlvbiB3b24ndCBiZSBhYmxlIHRvXG4gICAgLy8gZmluZCB0aGVtKSwgc28gdGhlIFROb2RlIGlkcyBhcmUgY29sbGVjdGVkIGFuZCB1c2VkIGF0IHJ1bnRpbWUgdG8gc2tpcCB0aGUgaHlkcmF0aW9uLlxuICAgIC8vXG4gICAgLy8gVGhpcyBzaXR1YXRpb24gbWF5IGhhcHBlbiBkdXJpbmcgdGhlIGNvbnRlbnQgcHJvamVjdGlvbiwgd2hlbiBzb21lIG5vZGVzIGRvbid0IG1ha2UgaXRcbiAgICAvLyBpbnRvIG9uZSBvZiB0aGUgY29udGVudCBwcm9qZWN0aW9uIHNsb3RzIChmb3IgZXhhbXBsZSwgd2hlbiB0aGVyZSBpcyBubyBkZWZhdWx0XG4gICAgLy8gPG5nLWNvbnRlbnQgLz4gc2xvdCBpbiBwcm9qZWN0b3IgY29tcG9uZW50J3MgdGVtcGxhdGUpLlxuICAgIGlmIChpc0Rpc2Nvbm5lY3RlZE5vZGUodE5vZGUsIGxWaWV3KSAmJiBpc0NvbnRlbnRQcm9qZWN0ZWROb2RlKHROb2RlKSkge1xuICAgICAgYXBwZW5kRGlzY29ubmVjdGVkTm9kZUluZGV4KG5naCwgdE5vZGUpO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgLy8gQXR0YWNoIGBqc2FjdGlvbmAgYXR0cmlidXRlIHRvIGVsZW1lbnRzIHRoYXQgaGF2ZSByZWdpc3RlcmVkIGxpc3RlbmVycyxcbiAgICAvLyB0aHVzIHBvdGVudGlhbGx5IGhhdmluZyBhIG5lZWQgdG8gZG8gYW4gZXZlbnQgcmVwbGF5LlxuICAgIGlmIChuYXRpdmVFbGVtZW50c1RvRXZlbnRUeXBlcyAmJiB0Tm9kZS50eXBlICYgVE5vZGVUeXBlLkVsZW1lbnQpIHtcbiAgICAgIGNvbnN0IG5hdGl2ZUVsZW1lbnQgPSB1bndyYXBSTm9kZShsVmlld1tpXSkgYXMgRWxlbWVudDtcbiAgICAgIGlmIChuYXRpdmVFbGVtZW50c1RvRXZlbnRUeXBlcy5oYXMobmF0aXZlRWxlbWVudCkpIHtcbiAgICAgICAgc2V0SlNBY3Rpb25BdHRyaWJ1dGVzKG5hdGl2ZUVsZW1lbnQsIG5hdGl2ZUVsZW1lbnRzVG9FdmVudFR5cGVzLmdldChuYXRpdmVFbGVtZW50KSEpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChBcnJheS5pc0FycmF5KHROb2RlLnByb2plY3Rpb24pKSB7XG4gICAgICBmb3IgKGNvbnN0IHByb2plY3Rpb25IZWFkVE5vZGUgb2YgdE5vZGUucHJvamVjdGlvbikge1xuICAgICAgICAvLyBXZSBtYXkgaGF2ZSBgbnVsbGBzIGluIHNsb3RzIHdpdGggbm8gcHJvamVjdGVkIGNvbnRlbnQuXG4gICAgICAgIGlmICghcHJvamVjdGlvbkhlYWRUTm9kZSkgY29udGludWU7XG5cbiAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KHByb2plY3Rpb25IZWFkVE5vZGUpKSB7XG4gICAgICAgICAgLy8gSWYgd2UgcHJvY2VzcyByZS1wcm9qZWN0ZWQgY29udGVudCAoaS5lLiBgPG5nLWNvbnRlbnQ+YFxuICAgICAgICAgIC8vIGFwcGVhcnMgYXQgcHJvamVjdGlvbiBsb2NhdGlvbiksIHNraXAgYW5ub3RhdGlvbnMgZm9yIHRoaXMgY29udGVudFxuICAgICAgICAgIC8vIHNpbmNlIGFsbCBET00gbm9kZXMgaW4gdGhpcyBwcm9qZWN0aW9uIHdlcmUgaGFuZGxlZCB3aGlsZSBwcm9jZXNzaW5nXG4gICAgICAgICAgLy8gYSBwYXJlbnQgbFZpZXcsIHdoaWNoIGNvbnRhaW5zIHRob3NlIG5vZGVzLlxuICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICFpc1Byb2plY3Rpb25UTm9kZShwcm9qZWN0aW9uSGVhZFROb2RlKSAmJlxuICAgICAgICAgICAgIWlzSW5Ta2lwSHlkcmF0aW9uQmxvY2socHJvamVjdGlvbkhlYWRUTm9kZSlcbiAgICAgICAgICApIHtcbiAgICAgICAgICAgIGlmIChpc0Rpc2Nvbm5lY3RlZE5vZGUocHJvamVjdGlvbkhlYWRUTm9kZSwgbFZpZXcpKSB7XG4gICAgICAgICAgICAgIC8vIENoZWNrIHdoZXRoZXIgdGhpcyBub2RlIGlzIGNvbm5lY3RlZCwgc2luY2Ugd2UgbWF5IGhhdmUgYSBUTm9kZVxuICAgICAgICAgICAgICAvLyBpbiB0aGUgZGF0YSBzdHJ1Y3R1cmUgYXMgYSBwcm9qZWN0aW9uIHNlZ21lbnQgaGVhZCwgYnV0IHRoZVxuICAgICAgICAgICAgICAvLyBjb250ZW50IHByb2plY3Rpb24gc2xvdCBtaWdodCBiZSBkaXNhYmxlZCAoZS5nLlxuICAgICAgICAgICAgICAvLyA8bmctY29udGVudCAqbmdJZj1cImZhbHNlXCIgLz4pLlxuICAgICAgICAgICAgICBhcHBlbmREaXNjb25uZWN0ZWROb2RlSW5kZXgobmdoLCBwcm9qZWN0aW9uSGVhZFROb2RlKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGFwcGVuZFNlcmlhbGl6ZWROb2RlUGF0aChuZ2gsIHByb2plY3Rpb25IZWFkVE5vZGUsIGxWaWV3LCBpMThuQ2hpbGRyZW4pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBJZiBhIHZhbHVlIGlzIGFuIGFycmF5LCBpdCBtZWFucyB0aGF0IHdlIGFyZSBwcm9jZXNzaW5nIGEgcHJvamVjdGlvblxuICAgICAgICAgIC8vIHdoZXJlIHByb2plY3RhYmxlIG5vZGVzIHdlcmUgcGFzc2VkIGluIGFzIERPTSBub2RlcyAoZm9yIGV4YW1wbGUsIHdoZW5cbiAgICAgICAgICAvLyBjYWxsaW5nIGBWaWV3Q29udGFpbmVyUmVmLmNyZWF0ZUNvbXBvbmVudChDbXBBLCB7cHJvamVjdGFibGVOb2RlczogWy4uLl19KWApLlxuICAgICAgICAgIC8vXG4gICAgICAgICAgLy8gSW4gdGhpcyBzY2VuYXJpbywgbm9kZXMgY2FuIGNvbWUgZnJvbSBhbnl3aGVyZSAoZWl0aGVyIGNyZWF0ZWQgbWFudWFsbHksXG4gICAgICAgICAgLy8gYWNjZXNzZWQgdmlhIGBkb2N1bWVudC5xdWVyeVNlbGVjdG9yYCwgZXRjKSBhbmQgbWF5IGJlIGluIGFueSBzdGF0ZVxuICAgICAgICAgIC8vIChhdHRhY2hlZCBvciBkZXRhY2hlZCBmcm9tIHRoZSBET00gdHJlZSkuIEFzIGEgcmVzdWx0LCB3ZSBjYW4gbm90IHJlbGlhYmx5XG4gICAgICAgICAgLy8gcmVzdG9yZSB0aGUgc3RhdGUgZm9yIHN1Y2ggY2FzZXMgZHVyaW5nIGh5ZHJhdGlvbi5cblxuICAgICAgICAgIHRocm93IHVuc3VwcG9ydGVkUHJvamVjdGlvbk9mRG9tTm9kZXModW53cmFwUk5vZGUobFZpZXdbaV0pKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGNvbmRpdGlvbmFsbHlBbm5vdGF0ZU5vZGVQYXRoKG5naCwgdE5vZGUsIGxWaWV3LCBpMThuQ2hpbGRyZW4pO1xuXG4gICAgaWYgKGlzTENvbnRhaW5lcihsVmlld1tpXSkpIHtcbiAgICAgIC8vIFNlcmlhbGl6ZSBpbmZvcm1hdGlvbiBhYm91dCBhIHRlbXBsYXRlLlxuICAgICAgY29uc3QgZW1iZWRkZWRUVmlldyA9IHROb2RlLnRWaWV3O1xuICAgICAgaWYgKGVtYmVkZGVkVFZpZXcgIT09IG51bGwpIHtcbiAgICAgICAgbmdoW1RFTVBMQVRFU10gPz89IHt9O1xuICAgICAgICBuZ2hbVEVNUExBVEVTXVtub09mZnNldEluZGV4XSA9IGdldFNzcklkKGVtYmVkZGVkVFZpZXcpO1xuICAgICAgfVxuXG4gICAgICAvLyBTZXJpYWxpemUgdmlld3Mgd2l0aGluIHRoaXMgTENvbnRhaW5lci5cbiAgICAgIGNvbnN0IGhvc3ROb2RlID0gbFZpZXdbaV1bSE9TVF0hOyAvLyBob3N0IG5vZGUgb2YgdGhpcyBjb250YWluZXJcblxuICAgICAgLy8gTFZpZXdbaV1bSE9TVF0gY2FuIGJlIG9mIDIgZGlmZmVyZW50IHR5cGVzOlxuICAgICAgLy8gLSBlaXRoZXIgYSBET00gbm9kZVxuICAgICAgLy8gLSBvciBhbiBhcnJheSB0aGF0IHJlcHJlc2VudHMgYW4gTFZpZXcgb2YgYSBjb21wb25lbnRcbiAgICAgIGlmIChBcnJheS5pc0FycmF5KGhvc3ROb2RlKSkge1xuICAgICAgICAvLyBUaGlzIGlzIGEgY29tcG9uZW50LCBzZXJpYWxpemUgaW5mbyBhYm91dCBpdC5cbiAgICAgICAgY29uc3QgdGFyZ2V0Tm9kZSA9IHVud3JhcFJOb2RlKGhvc3ROb2RlIGFzIExWaWV3KSBhcyBSRWxlbWVudDtcbiAgICAgICAgaWYgKCEodGFyZ2V0Tm9kZSBhcyBIVE1MRWxlbWVudCkuaGFzQXR0cmlidXRlKFNLSVBfSFlEUkFUSU9OX0FUVFJfTkFNRSkpIHtcbiAgICAgICAgICBhbm5vdGF0ZUhvc3RFbGVtZW50Rm9ySHlkcmF0aW9uKHRhcmdldE5vZGUsIGhvc3ROb2RlIGFzIExWaWV3LCBjb250ZXh0KTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBuZ2hbQ09OVEFJTkVSU10gPz89IHt9O1xuICAgICAgbmdoW0NPTlRBSU5FUlNdW25vT2Zmc2V0SW5kZXhdID0gc2VyaWFsaXplTENvbnRhaW5lcihsVmlld1tpXSwgY29udGV4dCk7XG4gICAgfSBlbHNlIGlmIChBcnJheS5pc0FycmF5KGxWaWV3W2ldKSAmJiAhaXNMZXREZWNsYXJhdGlvbih0Tm9kZSkpIHtcbiAgICAgIC8vIFRoaXMgaXMgYSBjb21wb25lbnQsIGFubm90YXRlIHRoZSBob3N0IG5vZGUgd2l0aCBhbiBgbmdoYCBhdHRyaWJ1dGUuXG4gICAgICAvLyBOb3RlOiBMZXQgZGVjbGFyYXRpb25zIHRoYXQgcmV0dXJuIGFuIGFycmF5IGFyZSBhbHNvIHN0b3JpbmcgYW4gYXJyYXkgaW4gdGhlIExWaWV3LFxuICAgICAgLy8gd2UgbmVlZCB0byBleGNsdWRlIHRoZW0uXG4gICAgICBjb25zdCB0YXJnZXROb2RlID0gdW53cmFwUk5vZGUobFZpZXdbaV1bSE9TVF0hKTtcbiAgICAgIGlmICghKHRhcmdldE5vZGUgYXMgSFRNTEVsZW1lbnQpLmhhc0F0dHJpYnV0ZShTS0lQX0hZRFJBVElPTl9BVFRSX05BTUUpKSB7XG4gICAgICAgIGFubm90YXRlSG9zdEVsZW1lbnRGb3JIeWRyYXRpb24odGFyZ2V0Tm9kZSBhcyBSRWxlbWVudCwgbFZpZXdbaV0sIGNvbnRleHQpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAvLyA8bmctY29udGFpbmVyPiBjYXNlXG4gICAgICBpZiAodE5vZGUudHlwZSAmIFROb2RlVHlwZS5FbGVtZW50Q29udGFpbmVyKSB7XG4gICAgICAgIC8vIEFuIDxuZy1jb250YWluZXI+IGlzIHJlcHJlc2VudGVkIGJ5IHRoZSBudW1iZXIgb2ZcbiAgICAgICAgLy8gdG9wLWxldmVsIG5vZGVzLiBUaGlzIGluZm9ybWF0aW9uIGlzIG5lZWRlZCB0byBza2lwIG92ZXJcbiAgICAgICAgLy8gdGhvc2Ugbm9kZXMgdG8gcmVhY2ggYSBjb3JyZXNwb25kaW5nIGFuY2hvciBub2RlIChjb21tZW50IG5vZGUpLlxuICAgICAgICBuZ2hbRUxFTUVOVF9DT05UQUlORVJTXSA/Pz0ge307XG4gICAgICAgIG5naFtFTEVNRU5UX0NPTlRBSU5FUlNdW25vT2Zmc2V0SW5kZXhdID0gY2FsY051bVJvb3ROb2Rlcyh0VmlldywgbFZpZXcsIHROb2RlLmNoaWxkKTtcbiAgICAgIH0gZWxzZSBpZiAodE5vZGUudHlwZSAmIChUTm9kZVR5cGUuUHJvamVjdGlvbiB8IFROb2RlVHlwZS5MZXREZWNsYXJhdGlvbikpIHtcbiAgICAgICAgLy8gQ3VycmVudCBUTm9kZSByZXByZXNlbnRzIGFuIGA8bmctY29udGVudD5gIHNsb3Qgb3IgYEBsZXRgIGRlY2xhcmF0aW9uLFxuICAgICAgICAvLyB0aHVzIGl0IGhhcyBubyBET00gZWxlbWVudHMgYXNzb2NpYXRlZCB3aXRoIGl0LCBzbyB0aGUgKipuZXh0IHNpYmxpbmcqKlxuICAgICAgICAvLyBub2RlIHdvdWxkIG5vdCBiZSBhYmxlIHRvIGZpbmQgYW4gYW5jaG9yLiBJbiB0aGlzIGNhc2UsIHVzZSBmdWxsIHBhdGggaW5zdGVhZC5cbiAgICAgICAgbGV0IG5leHRUTm9kZSA9IHROb2RlLm5leHQ7XG4gICAgICAgIC8vIFNraXAgb3ZlciBhbGwgYDxuZy1jb250ZW50PmAgc2xvdHMgYW5kIGBAbGV0YCBkZWNsYXJhdGlvbnMgaW4gYSByb3cuXG4gICAgICAgIHdoaWxlIChcbiAgICAgICAgICBuZXh0VE5vZGUgIT09IG51bGwgJiZcbiAgICAgICAgICBuZXh0VE5vZGUudHlwZSAmIChUTm9kZVR5cGUuUHJvamVjdGlvbiB8IFROb2RlVHlwZS5MZXREZWNsYXJhdGlvbilcbiAgICAgICAgKSB7XG4gICAgICAgICAgbmV4dFROb2RlID0gbmV4dFROb2RlLm5leHQ7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG5leHRUTm9kZSAmJiAhaXNJblNraXBIeWRyYXRpb25CbG9jayhuZXh0VE5vZGUpKSB7XG4gICAgICAgICAgLy8gSGFuZGxlIGEgdE5vZGUgYWZ0ZXIgdGhlIGA8bmctY29udGVudD5gIHNsb3QuXG4gICAgICAgICAgYXBwZW5kU2VyaWFsaXplZE5vZGVQYXRoKG5naCwgbmV4dFROb2RlLCBsVmlldywgaTE4bkNoaWxkcmVuKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmICh0Tm9kZS50eXBlICYgVE5vZGVUeXBlLlRleHQpIHtcbiAgICAgICAgY29uc3Qgck5vZGUgPSB1bndyYXBSTm9kZShsVmlld1tpXSk7XG4gICAgICAgIHByb2Nlc3NUZXh0Tm9kZUJlZm9yZVNlcmlhbGl6YXRpb24oY29udGV4dCwgck5vZGUpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gbmdoO1xufVxuXG4vKipcbiAqIFNlcmlhbGl6ZXMgbm9kZSBsb2NhdGlvbiBpbiBjYXNlcyB3aGVuIGl0J3MgbmVlZGVkLCBzcGVjaWZpY2FsbHk6XG4gKlxuICogIDEuIElmIGB0Tm9kZS5wcm9qZWN0aW9uTmV4dGAgaXMgZGlmZmVyZW50IGZyb20gYHROb2RlLm5leHRgIC0gaXQgbWVhbnMgdGhhdFxuICogICAgIHRoZSBuZXh0IGB0Tm9kZWAgYWZ0ZXIgcHJvamVjdGlvbiBpcyBkaWZmZXJlbnQgZnJvbSB0aGUgb25lIGluIHRoZSBvcmlnaW5hbFxuICogICAgIHRlbXBsYXRlLiBTaW5jZSBoeWRyYXRpb24gcmVsaWVzIG9uIGB0Tm9kZS5uZXh0YCwgdGhpcyBzZXJpYWxpemVkIGluZm9cbiAqICAgICBpcyByZXF1aXJlZCB0byBoZWxwIHJ1bnRpbWUgY29kZSBmaW5kIHRoZSBub2RlIGF0IHRoZSBjb3JyZWN0IGxvY2F0aW9uLlxuICogIDIuIEluIGNlcnRhaW4gY29udGVudCBwcm9qZWN0aW9uLWJhc2VkIHVzZS1jYXNlcywgaXQncyBwb3NzaWJsZSB0aGF0IG9ubHlcbiAqICAgICBhIGNvbnRlbnQgb2YgYSBwcm9qZWN0ZWQgZWxlbWVudCBpcyByZW5kZXJlZC4gSW4gdGhpcyBjYXNlLCBjb250ZW50IG5vZGVzXG4gKiAgICAgcmVxdWlyZSBhbiBleHRyYSBhbm5vdGF0aW9uLCBzaW5jZSBydW50aW1lIGxvZ2ljIGNhbid0IHJlbHkgb24gcGFyZW50LWNoaWxkXG4gKiAgICAgY29ubmVjdGlvbiB0byBpZGVudGlmeSB0aGUgbG9jYXRpb24gb2YgYSBub2RlLlxuICovXG5mdW5jdGlvbiBjb25kaXRpb25hbGx5QW5ub3RhdGVOb2RlUGF0aChcbiAgbmdoOiBTZXJpYWxpemVkVmlldyxcbiAgdE5vZGU6IFROb2RlLFxuICBsVmlldzogTFZpZXc8dW5rbm93bj4sXG4gIGV4Y2x1ZGVkUGFyZW50Tm9kZXM6IFNldDxudW1iZXI+IHwgbnVsbCxcbikge1xuICBpZiAoaXNQcm9qZWN0aW9uVE5vZGUodE5vZGUpKSB7XG4gICAgLy8gRG8gbm90IGFubm90YXRlIHByb2plY3Rpb24gbm9kZXMgKDxuZy1jb250ZW50IC8+KSwgc2luY2VcbiAgICAvLyB0aGV5IGRvbid0IGhhdmUgYSBjb3JyZXNwb25kaW5nIERPTSBub2RlIHJlcHJlc2VudGluZyB0aGVtLlxuICAgIHJldHVybjtcbiAgfVxuXG4gIC8vIEhhbmRsZSBjYXNlICMxIGRlc2NyaWJlZCBhYm92ZS5cbiAgaWYgKFxuICAgIHROb2RlLnByb2plY3Rpb25OZXh0ICYmXG4gICAgdE5vZGUucHJvamVjdGlvbk5leHQgIT09IHROb2RlLm5leHQgJiZcbiAgICAhaXNJblNraXBIeWRyYXRpb25CbG9jayh0Tm9kZS5wcm9qZWN0aW9uTmV4dClcbiAgKSB7XG4gICAgYXBwZW5kU2VyaWFsaXplZE5vZGVQYXRoKG5naCwgdE5vZGUucHJvamVjdGlvbk5leHQsIGxWaWV3LCBleGNsdWRlZFBhcmVudE5vZGVzKTtcbiAgfVxuXG4gIC8vIEhhbmRsZSBjYXNlICMyIGRlc2NyaWJlZCBhYm92ZS5cbiAgLy8gTm90ZTogd2Ugb25seSBkbyB0aGF0IGZvciB0aGUgZmlyc3Qgbm9kZSAoaS5lLiB3aGVuIGB0Tm9kZS5wcmV2ID09PSBudWxsYCksXG4gIC8vIHRoZSByZXN0IG9mIHRoZSBub2RlcyB3b3VsZCByZWx5IG9uIHRoZSBjdXJyZW50IG5vZGUgbG9jYXRpb24sIHNvIG5vIGV4dHJhXG4gIC8vIGFubm90YXRpb24gaXMgbmVlZGVkLlxuICBpZiAoXG4gICAgdE5vZGUucHJldiA9PT0gbnVsbCAmJlxuICAgIHROb2RlLnBhcmVudCAhPT0gbnVsbCAmJlxuICAgIGlzRGlzY29ubmVjdGVkTm9kZSh0Tm9kZS5wYXJlbnQsIGxWaWV3KSAmJlxuICAgICFpc0Rpc2Nvbm5lY3RlZE5vZGUodE5vZGUsIGxWaWV3KVxuICApIHtcbiAgICBhcHBlbmRTZXJpYWxpemVkTm9kZVBhdGgobmdoLCB0Tm9kZSwgbFZpZXcsIGV4Y2x1ZGVkUGFyZW50Tm9kZXMpO1xuICB9XG59XG5cbi8qKlxuICogRGV0ZXJtaW5lcyB3aGV0aGVyIGEgY29tcG9uZW50IGluc3RhbmNlIHRoYXQgaXMgcmVwcmVzZW50ZWRcbiAqIGJ5IGEgZ2l2ZW4gTFZpZXcgdXNlcyBgVmlld0VuY2Fwc3VsYXRpb24uU2hhZG93RG9tYC5cbiAqL1xuZnVuY3Rpb24gY29tcG9uZW50VXNlc1NoYWRvd0RvbUVuY2Fwc3VsYXRpb24obFZpZXc6IExWaWV3KTogYm9vbGVhbiB7XG4gIGNvbnN0IGluc3RhbmNlID0gbFZpZXdbQ09OVEVYVF07XG4gIHJldHVybiBpbnN0YW5jZT8uY29uc3RydWN0b3JcbiAgICA/IGdldENvbXBvbmVudERlZihpbnN0YW5jZS5jb25zdHJ1Y3Rvcik/LmVuY2Fwc3VsYXRpb24gPT09IFZpZXdFbmNhcHN1bGF0aW9uLlNoYWRvd0RvbVxuICAgIDogZmFsc2U7XG59XG5cbi8qKlxuICogQW5ub3RhdGVzIGNvbXBvbmVudCBob3N0IGVsZW1lbnQgZm9yIGh5ZHJhdGlvbjpcbiAqIC0gYnkgZWl0aGVyIGFkZGluZyB0aGUgYG5naGAgYXR0cmlidXRlIGFuZCBjb2xsZWN0aW5nIGh5ZHJhdGlvbi1yZWxhdGVkIGluZm9cbiAqICAgZm9yIHRoZSBzZXJpYWxpemF0aW9uIGFuZCB0cmFuc2ZlcnJpbmcgdG8gdGhlIGNsaWVudFxuICogLSBvciBieSBhZGRpbmcgdGhlIGBuZ1NraXBIeWRyYXRpb25gIGF0dHJpYnV0ZSBpbiBjYXNlIEFuZ3VsYXIgZGV0ZWN0cyB0aGF0XG4gKiAgIGNvbXBvbmVudCBjb250ZW50cyBpcyBub3QgY29tcGF0aWJsZSB3aXRoIGh5ZHJhdGlvbi5cbiAqXG4gKiBAcGFyYW0gZWxlbWVudCBUaGUgSG9zdCBlbGVtZW50IHRvIGJlIGFubm90YXRlZFxuICogQHBhcmFtIGxWaWV3IFRoZSBhc3NvY2lhdGVkIExWaWV3XG4gKiBAcGFyYW0gY29udGV4dCBUaGUgaHlkcmF0aW9uIGNvbnRleHRcbiAqIEByZXR1cm5zIEFuIGluZGV4IG9mIHNlcmlhbGl6ZWQgdmlldyBmcm9tIHRoZSB0cmFuc2ZlciBzdGF0ZSBvYmplY3RcbiAqICAgICAgICAgIG9yIGBudWxsYCB3aGVuIGEgZ2l2ZW4gY29tcG9uZW50IGNhbiBub3QgYmUgc2VyaWFsaXplZC5cbiAqL1xuZnVuY3Rpb24gYW5ub3RhdGVIb3N0RWxlbWVudEZvckh5ZHJhdGlvbihcbiAgZWxlbWVudDogUkVsZW1lbnQsXG4gIGxWaWV3OiBMVmlldyxcbiAgY29udGV4dDogSHlkcmF0aW9uQ29udGV4dCxcbik6IG51bWJlciB8IG51bGwge1xuICBjb25zdCByZW5kZXJlciA9IGxWaWV3W1JFTkRFUkVSXTtcbiAgaWYgKFxuICAgIChoYXNJMThuKGxWaWV3KSAmJiAhaXNJMThuSHlkcmF0aW9uU3VwcG9ydEVuYWJsZWQoKSkgfHxcbiAgICBjb21wb25lbnRVc2VzU2hhZG93RG9tRW5jYXBzdWxhdGlvbihsVmlldylcbiAgKSB7XG4gICAgLy8gQXR0YWNoIHRoZSBza2lwIGh5ZHJhdGlvbiBhdHRyaWJ1dGUgaWYgdGhpcyBjb21wb25lbnQ6XG4gICAgLy8gLSBlaXRoZXIgaGFzIGkxOG4gYmxvY2tzLCBzaW5jZSBoeWRyYXRpbmcgc3VjaCBibG9ja3MgaXMgbm90IHlldCBzdXBwb3J0ZWRcbiAgICAvLyAtIG9yIHVzZXMgU2hhZG93RG9tIHZpZXcgZW5jYXBzdWxhdGlvbiwgc2luY2UgRG9taW5vIGRvZXNuJ3Qgc3VwcG9ydFxuICAgIC8vICAgc2hhZG93IERPTSwgc28gd2UgY2FuIG5vdCBndWFyYW50ZWUgdGhhdCBjbGllbnQgYW5kIHNlcnZlciByZXByZXNlbnRhdGlvbnNcbiAgICAvLyAgIHdvdWxkIGV4YWN0bHkgbWF0Y2hcbiAgICByZW5kZXJlci5zZXRBdHRyaWJ1dGUoZWxlbWVudCwgU0tJUF9IWURSQVRJT05fQVRUUl9OQU1FLCAnJyk7XG4gICAgcmV0dXJuIG51bGw7XG4gIH0gZWxzZSB7XG4gICAgY29uc3QgbmdoID0gc2VyaWFsaXplTFZpZXcobFZpZXcsIGNvbnRleHQpO1xuICAgIGNvbnN0IGluZGV4ID0gY29udGV4dC5zZXJpYWxpemVkVmlld0NvbGxlY3Rpb24uYWRkKG5naCk7XG4gICAgcmVuZGVyZXIuc2V0QXR0cmlidXRlKGVsZW1lbnQsIE5HSF9BVFRSX05BTUUsIGluZGV4LnRvU3RyaW5nKCkpO1xuICAgIHJldHVybiBpbmRleDtcbiAgfVxufVxuXG4vKipcbiAqIFBoeXNpY2FsbHkgaW5zZXJ0cyB0aGUgY29tbWVudCBub2RlcyB0byBlbnN1cmUgZW1wdHkgdGV4dCBub2RlcyBhbmQgYWRqYWNlbnRcbiAqIHRleHQgbm9kZSBzZXBhcmF0b3JzIGFyZSBwcmVzZXJ2ZWQgYWZ0ZXIgc2VydmVyIHNlcmlhbGl6YXRpb24gb2YgdGhlIERPTS5cbiAqIFRoZXNlIGdldCBzd2FwcGVkIGJhY2sgZm9yIGVtcHR5IHRleHQgbm9kZXMgb3Igc2VwYXJhdG9ycyBvbmNlIGh5ZHJhdGlvbiBoYXBwZW5zXG4gKiBvbiB0aGUgY2xpZW50LlxuICpcbiAqIEBwYXJhbSBjb3JydXB0ZWRUZXh0Tm9kZXMgVGhlIE1hcCBvZiB0ZXh0IG5vZGVzIHRvIGJlIHJlcGxhY2VkIHdpdGggY29tbWVudHNcbiAqIEBwYXJhbSBkb2MgVGhlIGRvY3VtZW50XG4gKi9cbmZ1bmN0aW9uIGluc2VydENvcnJ1cHRlZFRleHROb2RlTWFya2VycyhcbiAgY29ycnVwdGVkVGV4dE5vZGVzOiBNYXA8SFRNTEVsZW1lbnQsIHN0cmluZz4sXG4gIGRvYzogRG9jdW1lbnQsXG4pIHtcbiAgZm9yIChjb25zdCBbdGV4dE5vZGUsIG1hcmtlcl0gb2YgY29ycnVwdGVkVGV4dE5vZGVzKSB7XG4gICAgdGV4dE5vZGUuYWZ0ZXIoZG9jLmNyZWF0ZUNvbW1lbnQobWFya2VyKSk7XG4gIH1cbn1cblxuLyoqXG4gKiBEZXRlY3RzIHdoZXRoZXIgYSBnaXZlbiBUTm9kZSByZXByZXNlbnRzIGEgbm9kZSB0aGF0XG4gKiBpcyBiZWluZyBjb250ZW50IHByb2plY3RlZC5cbiAqL1xuZnVuY3Rpb24gaXNDb250ZW50UHJvamVjdGVkTm9kZSh0Tm9kZTogVE5vZGUpOiBib29sZWFuIHtcbiAgbGV0IGN1cnJlbnRUTm9kZSA9IHROb2RlO1xuICB3aGlsZSAoY3VycmVudFROb2RlICE9IG51bGwpIHtcbiAgICAvLyBJZiB3ZSBjb21lIGFjcm9zcyBhIGNvbXBvbmVudCBob3N0IG5vZGUgaW4gcGFyZW50IG5vZGVzIC1cbiAgICAvLyB0aGlzIFROb2RlIGlzIGluIHRoZSBjb250ZW50IHByb2plY3Rpb24gc2VjdGlvbi5cbiAgICBpZiAoaXNDb21wb25lbnRIb3N0KGN1cnJlbnRUTm9kZSkpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBjdXJyZW50VE5vZGUgPSBjdXJyZW50VE5vZGUucGFyZW50IGFzIFROb2RlO1xuICB9XG4gIHJldHVybiBmYWxzZTtcbn1cbiJdfQ==