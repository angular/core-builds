/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ViewEncapsulation } from '../metadata';
import { collectNativeNodes } from '../render3/collect_native_nodes';
import { getComponentDef } from '../render3/definition';
import { CONTAINER_HEADER_OFFSET } from '../render3/interfaces/container';
import { isComponentHost, isLContainer, isProjectionTNode, isRootView } from '../render3/interfaces/type_checks';
import { CONTEXT, FLAGS, HEADER_OFFSET, HOST, RENDERER, TVIEW } from '../render3/interfaces/view';
import { unwrapRNode } from '../render3/util/view_utils';
import { TransferState } from '../transfer_state';
import { unsupportedProjectionOfDomNodes } from './error_handling';
import { CONTAINERS, DISCONNECTED_NODES, ELEMENT_CONTAINERS, MULTIPLIER, NODES, NUM_ROOT_NODES, TEMPLATE_ID, TEMPLATES } from './interfaces';
import { calcPathForNode } from './node_lookup_utils';
import { isInSkipHydrationBlock, SKIP_HYDRATION_ATTR_NAME } from './skip_hydration';
import { getComponentLViewForHydration, NGH_ATTR_NAME, NGH_DATA_KEY } from './utils';
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
 * Annotates all components bootstrapped in a given ApplicationRef
 * with info needed for hydration.
 *
 * @param appRef An instance of an ApplicationRef.
 * @param doc A reference to the current Document instance.
 */
export function annotateForHydration(appRef, doc) {
    const serializedViewCollection = new SerializedViewCollection();
    const corruptedTextNodes = new Map();
    const viewRefs = appRef._views;
    for (const viewRef of viewRefs) {
        const lView = getComponentLViewForHydration(viewRef);
        // An `lView` might be `null` if a `ViewRef` represents
        // an embedded view (not a component view).
        if (lView !== null) {
            const hostElement = lView[HOST];
            // Root elements might also be annotated with the `ngSkipHydration` attribute,
            // check if it's present before starting the serialization process.
            if (hostElement && !hostElement.hasAttribute(SKIP_HYDRATION_ATTR_NAME)) {
                const context = {
                    serializedViewCollection,
                    corruptedTextNodes,
                };
                annotateHostElementForHydration(hostElement, lView, context);
                insertCorruptedTextNodeMarkers(corruptedTextNodes, doc);
            }
        }
    }
    // Note: we *always* include hydration info key and a corresponding value
    // into the TransferState, even if the list of serialized views is empty.
    // This is needed as a signal to the client that the server part of the
    // hydration logic was setup and enabled correctly. Otherwise, if a client
    // hydration doesn't find a key in the transfer state - an error is produced.
    const serializedViews = serializedViewCollection.getAll();
    const transferState = appRef.injector.get(TransferState);
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
        // If this is a root view, get an LView for the underlying component,
        // because it contains information about the view to serialize.
        if (isRootView(childLView)) {
            childLView = childLView[HEADER_OFFSET];
        }
        const childTView = childLView[TVIEW];
        let template;
        let numRootNodes = 0;
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
        const view = {
            [TEMPLATE_ID]: template,
            [NUM_ROOT_NODES]: numRootNodes,
            ...serializeLView(lContainer[i], context),
        };
        // Check if the previous view has the same shape (for example, it was
        // produced by the *ngFor), in which case bump the counter on the previous
        // view instead of including the same information again.
        const currentViewAsString = JSON.stringify(view);
        if (views.length > 0 && currentViewAsString === lastViewAsString) {
            const previousView = views[views.length - 1];
            previousView[MULTIPLIER] ??= 1;
            previousView[MULTIPLIER]++;
        }
        else {
            // Record this view as most recently added.
            lastViewAsString = currentViewAsString;
            views.push(view);
        }
    }
    return views;
}
/**
 * Helper function to produce a node path (which navigation steps runtime logic
 * needs to take to locate a node) and stores it in the `NODES` section of the
 * current serialized view.
 */
function appendSerializedNodePath(ngh, tNode, lView) {
    const noOffsetIndex = tNode.index - HEADER_OFFSET;
    ngh[NODES] ??= {};
    ngh[NODES][noOffsetIndex] = calcPathForNode(tNode, lView);
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
    // Iterate over DOM element references in an LView.
    for (let i = HEADER_OFFSET; i < tView.bindingStartIndex; i++) {
        const tNode = tView.data[i];
        const noOffsetIndex = i - HEADER_OFFSET;
        // Local refs (e.g. <div #localRef>) take up an extra slot in LViews
        // to store the same element. In this case, there is no information in
        // a corresponding slot in TNode data structure. If that's the case, just
        // skip this slot and move to the next one.
        if (!tNode) {
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
                            appendSerializedNodePath(ngh, projectionHeadTNode, lView);
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
                    appendSerializedNodePath(ngh, nextTNode, lView);
                }
            }
            else {
                // Handle cases where text nodes can be lost after DOM serialization:
                //  1. When there is an *empty text node* in DOM: in this case, this
                //     node would not make it into the serialized string and as a result,
                //     this node wouldn't be created in a browser. This would result in
                //     a mismatch during the hydration, where the runtime logic would expect
                //     a text node to be present in live DOM, but no text node would exist.
                //     Example: `<span>{{ name }}</span>` when the `name` is an empty string.
                //     This would result in `<span></span>` string after serialization and
                //     in a browser only the `span` element would be created. To resolve that,
                //     an extra comment node is appended in place of an empty text node and
                //     that special comment node is replaced with an empty text node *before*
                //     hydration.
                //  2. When there are 2 consecutive text nodes present in the DOM.
                //     Example: `<div>Hello <ng-container *ngIf="true">world</ng-container></div>`.
                //     In this scenario, the live DOM would look like this:
                //       <div>#text('Hello ') #text('world') #comment('container')</div>
                //     Serialized string would look like this: `<div>Hello world<!--container--></div>`.
                //     The live DOM in a browser after that would be:
                //       <div>#text('Hello world') #comment('container')</div>
                //     Notice how 2 text nodes are now "merged" into one. This would cause hydration
                //     logic to fail, since it'd expect 2 text nodes being present, not one.
                //     To fix this, we insert a special comment node in between those text nodes, so
                //     serialized representation is: `<div>Hello <!--ngtns-->world<!--container--></div>`.
                //     This forces browser to create 2 text nodes separated by a comment node.
                //     Before running a hydration process, this special comment node is removed, so the
                //     live DOM has exactly the same state as it was before serialization.
                if (tNode.type & 1 /* TNodeType.Text */) {
                    const rNode = unwrapRNode(lView[i]);
                    if (rNode.textContent?.replace(/\s/gm, '') === '') {
                        context.corruptedTextNodes.set(rNode, "ngetn" /* TextNodeMarker.EmptyNode */);
                    }
                    else if (rNode.nextSibling?.nodeType === Node.TEXT_NODE) {
                        context.corruptedTextNodes.set(rNode, "ngtns" /* TextNodeMarker.Separator */);
                    }
                }
                if (tNode.projectionNext && tNode.projectionNext !== tNode.next &&
                    !isInSkipHydrationBlock(tNode.projectionNext)) {
                    // Check if projection next is not the same as next, in which case
                    // the node would not be found at creation time at runtime and we
                    // need to provide a location for that node.
                    appendSerializedNodePath(ngh, tNode.projectionNext, lView);
                }
            }
        }
    }
    return ngh;
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
 */
function annotateHostElementForHydration(element, lView, context) {
    const renderer = lView[RENDERER];
    if ((lView[FLAGS] & 32 /* LViewFlags.HasI18n */) === 32 /* LViewFlags.HasI18n */ ||
        componentUsesShadowDomEncapsulation(lView)) {
        // Attach the skip hydration attribute if this component:
        // - either has i18n blocks, since hydrating such blocks is not yet supported
        // - or uses ShadowDom view encapsulation, since Domino doesn't support
        //   shadow DOM, so we can not guarantee that client and server representations
        //   would exactly match
        renderer.setAttribute(element, SKIP_HYDRATION_ATTR_NAME, '');
    }
    else {
        const ngh = serializeLView(lView, context);
        const index = context.serializedViewCollection.add(ngh);
        renderer.setAttribute(element, NGH_ATTR_NAME, index.toString());
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
/**
 * Check whether a given node exists, but is disconnected from the DOM.
 *
 * Note: we leverage the fact that we have this information available in the DOM emulation
 * layer (in Domino) for now. Longer-term solution should not rely on the DOM emulation and
 * only use internal data structures and state to compute this information.
 */
function isDisconnectedNode(tNode, lView) {
    return !(tNode.type & 16 /* TNodeType.Projection */) && !!lView[tNode.index] &&
        !unwrapRNode(lView[tNode.index]).isConnected;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYW5ub3RhdGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9oeWRyYXRpb24vYW5ub3RhdGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBR0gsT0FBTyxFQUFDLGlCQUFpQixFQUFDLE1BQU0sYUFBYSxDQUFDO0FBQzlDLE9BQU8sRUFBQyxrQkFBa0IsRUFBQyxNQUFNLGlDQUFpQyxDQUFDO0FBQ25FLE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUN0RCxPQUFPLEVBQUMsdUJBQXVCLEVBQWEsTUFBTSxpQ0FBaUMsQ0FBQztBQUdwRixPQUFPLEVBQUMsZUFBZSxFQUFFLFlBQVksRUFBRSxpQkFBaUIsRUFBRSxVQUFVLEVBQUMsTUFBTSxtQ0FBbUMsQ0FBQztBQUMvRyxPQUFPLEVBQUMsT0FBTyxFQUFFLEtBQUssRUFBRSxhQUFhLEVBQUUsSUFBSSxFQUFxQixRQUFRLEVBQVMsS0FBSyxFQUFZLE1BQU0sNEJBQTRCLENBQUM7QUFDckksT0FBTyxFQUFDLFdBQVcsRUFBQyxNQUFNLDRCQUE0QixDQUFDO0FBQ3ZELE9BQU8sRUFBQyxhQUFhLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUVoRCxPQUFPLEVBQUMsK0JBQStCLEVBQUMsTUFBTSxrQkFBa0IsQ0FBQztBQUNqRSxPQUFPLEVBQUMsVUFBVSxFQUFFLGtCQUFrQixFQUFFLGtCQUFrQixFQUFFLFVBQVUsRUFBRSxLQUFLLEVBQUUsY0FBYyxFQUEyQyxXQUFXLEVBQUUsU0FBUyxFQUFDLE1BQU0sY0FBYyxDQUFDO0FBQ3BMLE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUNwRCxPQUFPLEVBQUMsc0JBQXNCLEVBQUUsd0JBQXdCLEVBQUMsTUFBTSxrQkFBa0IsQ0FBQztBQUNsRixPQUFPLEVBQUMsNkJBQTZCLEVBQUUsYUFBYSxFQUFFLFlBQVksRUFBaUIsTUFBTSxTQUFTLENBQUM7QUFFbkc7Ozs7O0dBS0c7QUFDSCxNQUFNLHdCQUF3QjtJQUE5QjtRQUNVLFVBQUssR0FBcUIsRUFBRSxDQUFDO1FBQzdCLG1CQUFjLEdBQUcsSUFBSSxHQUFHLEVBQWtCLENBQUM7SUFnQnJELENBQUM7SUFkQyxHQUFHLENBQUMsY0FBOEI7UUFDaEMsTUFBTSxZQUFZLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxjQUFjLENBQUMsQ0FBQztRQUNwRCxJQUFJLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsWUFBWSxDQUFDLEVBQUU7WUFDMUMsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUM7WUFDaEMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUM7WUFDaEMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsWUFBWSxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQzdDLE9BQU8sS0FBSyxDQUFDO1NBQ2Q7UUFDRCxPQUFPLElBQUksQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLFlBQVksQ0FBRSxDQUFDO0lBQ2hELENBQUM7SUFFRCxNQUFNO1FBQ0osT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDO0lBQ3BCLENBQUM7Q0FDRjtBQUVEOzs7R0FHRztBQUNILElBQUksVUFBVSxHQUFHLENBQUMsQ0FBQztBQUVuQjs7Ozs7OztHQU9HO0FBQ0gsU0FBUyxRQUFRLENBQUMsS0FBWTtJQUM1QixJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssRUFBRTtRQUNoQixLQUFLLENBQUMsS0FBSyxHQUFHLElBQUksVUFBVSxFQUFFLEVBQUUsQ0FBQztLQUNsQztJQUNELE9BQU8sS0FBSyxDQUFDLEtBQUssQ0FBQztBQUNyQixDQUFDO0FBWUQ7OztHQUdHO0FBQ0gsU0FBUyxnQkFBZ0IsQ0FBQyxLQUFZLEVBQUUsS0FBWSxFQUFFLEtBQWlCO0lBQ3JFLE1BQU0sU0FBUyxHQUFjLEVBQUUsQ0FBQztJQUNoQyxrQkFBa0IsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxTQUFTLENBQUMsQ0FBQztJQUNuRCxPQUFPLFNBQVMsQ0FBQyxNQUFNLENBQUM7QUFDMUIsQ0FBQztBQUVEOzs7Ozs7R0FNRztBQUNILE1BQU0sVUFBVSxvQkFBb0IsQ0FBQyxNQUFzQixFQUFFLEdBQWE7SUFDeEUsTUFBTSx3QkFBd0IsR0FBRyxJQUFJLHdCQUF3QixFQUFFLENBQUM7SUFDaEUsTUFBTSxrQkFBa0IsR0FBRyxJQUFJLEdBQUcsRUFBK0IsQ0FBQztJQUNsRSxNQUFNLFFBQVEsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDO0lBQy9CLEtBQUssTUFBTSxPQUFPLElBQUksUUFBUSxFQUFFO1FBQzlCLE1BQU0sS0FBSyxHQUFHLDZCQUE2QixDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ3JELHVEQUF1RDtRQUN2RCwyQ0FBMkM7UUFDM0MsSUFBSSxLQUFLLEtBQUssSUFBSSxFQUFFO1lBQ2xCLE1BQU0sV0FBVyxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNoQyw4RUFBOEU7WUFDOUUsbUVBQW1FO1lBQ25FLElBQUksV0FBVyxJQUFJLENBQUUsV0FBMkIsQ0FBQyxZQUFZLENBQUMsd0JBQXdCLENBQUMsRUFBRTtnQkFDdkYsTUFBTSxPQUFPLEdBQXFCO29CQUNoQyx3QkFBd0I7b0JBQ3hCLGtCQUFrQjtpQkFDbkIsQ0FBQztnQkFDRiwrQkFBK0IsQ0FBQyxXQUEwQixFQUFFLEtBQUssRUFBRSxPQUFPLENBQUMsQ0FBQztnQkFDNUUsOEJBQThCLENBQUMsa0JBQWtCLEVBQUUsR0FBRyxDQUFDLENBQUM7YUFDekQ7U0FDRjtLQUNGO0lBRUQseUVBQXlFO0lBQ3pFLHlFQUF5RTtJQUN6RSx1RUFBdUU7SUFDdkUsMEVBQTBFO0lBQzFFLDZFQUE2RTtJQUM3RSxNQUFNLGVBQWUsR0FBRyx3QkFBd0IsQ0FBQyxNQUFNLEVBQUUsQ0FBQztJQUMxRCxNQUFNLGFBQWEsR0FBRyxNQUFNLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUMsQ0FBQztJQUN6RCxhQUFhLENBQUMsR0FBRyxDQUFDLFlBQVksRUFBRSxlQUFlLENBQUMsQ0FBQztBQUNuRCxDQUFDO0FBRUQ7Ozs7Ozs7R0FPRztBQUNILFNBQVMsbUJBQW1CLENBQ3hCLFVBQXNCLEVBQUUsT0FBeUI7SUFDbkQsTUFBTSxLQUFLLEdBQThCLEVBQUUsQ0FBQztJQUM1QyxJQUFJLGdCQUFnQixHQUFXLEVBQUUsQ0FBQztJQUVsQyxLQUFLLElBQUksQ0FBQyxHQUFHLHVCQUF1QixFQUFFLENBQUMsR0FBRyxVQUFVLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO1FBQ2hFLElBQUksVUFBVSxHQUFHLFVBQVUsQ0FBQyxDQUFDLENBQVUsQ0FBQztRQUV4QyxxRUFBcUU7UUFDckUsK0RBQStEO1FBQy9ELElBQUksVUFBVSxDQUFDLFVBQVUsQ0FBQyxFQUFFO1lBQzFCLFVBQVUsR0FBRyxVQUFVLENBQUMsYUFBYSxDQUFDLENBQUM7U0FDeEM7UUFDRCxNQUFNLFVBQVUsR0FBRyxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUM7UUFFckMsSUFBSSxRQUFnQixDQUFDO1FBQ3JCLElBQUksWUFBWSxHQUFHLENBQUMsQ0FBQztRQUNyQixJQUFJLFVBQVUsQ0FBQyxJQUFJLGdDQUF3QixFQUFFO1lBQzNDLFFBQVEsR0FBRyxVQUFVLENBQUMsS0FBTSxDQUFDO1lBRTdCLHdFQUF3RTtZQUN4RSxpRUFBaUU7WUFDakUsWUFBWSxHQUFHLENBQUMsQ0FBQztTQUNsQjthQUFNO1lBQ0wsUUFBUSxHQUFHLFFBQVEsQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUNoQyxZQUFZLEdBQUcsZ0JBQWdCLENBQUMsVUFBVSxFQUFFLFVBQVUsRUFBRSxVQUFVLENBQUMsVUFBVSxDQUFDLENBQUM7U0FDaEY7UUFFRCxNQUFNLElBQUksR0FBNEI7WUFDcEMsQ0FBQyxXQUFXLENBQUMsRUFBRSxRQUFRO1lBQ3ZCLENBQUMsY0FBYyxDQUFDLEVBQUUsWUFBWTtZQUM5QixHQUFHLGNBQWMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFVLEVBQUUsT0FBTyxDQUFDO1NBQ25ELENBQUM7UUFFRixxRUFBcUU7UUFDckUsMEVBQTBFO1FBQzFFLHdEQUF3RDtRQUN4RCxNQUFNLG1CQUFtQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDakQsSUFBSSxLQUFLLENBQUMsTUFBTSxHQUFHLENBQUMsSUFBSSxtQkFBbUIsS0FBSyxnQkFBZ0IsRUFBRTtZQUNoRSxNQUFNLFlBQVksR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQztZQUM3QyxZQUFZLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQy9CLFlBQVksQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDO1NBQzVCO2FBQU07WUFDTCwyQ0FBMkM7WUFDM0MsZ0JBQWdCLEdBQUcsbUJBQW1CLENBQUM7WUFDdkMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztTQUNsQjtLQUNGO0lBQ0QsT0FBTyxLQUFLLENBQUM7QUFDZixDQUFDO0FBRUQ7Ozs7R0FJRztBQUNILFNBQVMsd0JBQXdCLENBQUMsR0FBbUIsRUFBRSxLQUFZLEVBQUUsS0FBWTtJQUMvRSxNQUFNLGFBQWEsR0FBRyxLQUFLLENBQUMsS0FBSyxHQUFHLGFBQWEsQ0FBQztJQUNsRCxHQUFHLENBQUMsS0FBSyxDQUFDLEtBQUssRUFBRSxDQUFDO0lBQ2xCLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxhQUFhLENBQUMsR0FBRyxlQUFlLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO0FBQzVELENBQUM7QUFFRDs7OztHQUlHO0FBQ0gsU0FBUywyQkFBMkIsQ0FBQyxHQUFtQixFQUFFLEtBQVk7SUFDcEUsTUFBTSxhQUFhLEdBQUcsS0FBSyxDQUFDLEtBQUssR0FBRyxhQUFhLENBQUM7SUFDbEQsR0FBRyxDQUFDLGtCQUFrQixDQUFDLEtBQUssRUFBRSxDQUFDO0lBQy9CLElBQUksQ0FBQyxHQUFHLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxRQUFRLENBQUMsYUFBYSxDQUFDLEVBQUU7UUFDcEQsR0FBRyxDQUFDLGtCQUFrQixDQUFDLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDO0tBQzdDO0FBQ0gsQ0FBQztBQUVEOzs7Ozs7OztHQVFHO0FBQ0gsU0FBUyxjQUFjLENBQUMsS0FBWSxFQUFFLE9BQXlCO0lBQzdELE1BQU0sR0FBRyxHQUFtQixFQUFFLENBQUM7SUFDL0IsTUFBTSxLQUFLLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQzNCLG1EQUFtRDtJQUNuRCxLQUFLLElBQUksQ0FBQyxHQUFHLGFBQWEsRUFBRSxDQUFDLEdBQUcsS0FBSyxDQUFDLGlCQUFpQixFQUFFLENBQUMsRUFBRSxFQUFFO1FBQzVELE1BQU0sS0FBSyxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFVLENBQUM7UUFDckMsTUFBTSxhQUFhLEdBQUcsQ0FBQyxHQUFHLGFBQWEsQ0FBQztRQUN4QyxvRUFBb0U7UUFDcEUsc0VBQXNFO1FBQ3RFLHlFQUF5RTtRQUN6RSwyQ0FBMkM7UUFDM0MsSUFBSSxDQUFDLEtBQUssRUFBRTtZQUNWLFNBQVM7U0FDVjtRQUVELDBGQUEwRjtRQUMxRix1RkFBdUY7UUFDdkYsd0ZBQXdGO1FBQ3hGLEVBQUU7UUFDRix5RkFBeUY7UUFDekYsa0ZBQWtGO1FBQ2xGLDBEQUEwRDtRQUMxRCxJQUFJLGtCQUFrQixDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsSUFBSSxzQkFBc0IsQ0FBQyxLQUFLLENBQUMsRUFBRTtZQUNyRSwyQkFBMkIsQ0FBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDeEMsU0FBUztTQUNWO1FBQ0QsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsRUFBRTtZQUNuQyxLQUFLLE1BQU0sbUJBQW1CLElBQUksS0FBSyxDQUFDLFVBQVUsRUFBRTtnQkFDbEQsMERBQTBEO2dCQUMxRCxJQUFJLENBQUMsbUJBQW1CO29CQUFFLFNBQVM7Z0JBRW5DLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLG1CQUFtQixDQUFDLEVBQUU7b0JBQ3ZDLDBEQUEwRDtvQkFDMUQscUVBQXFFO29CQUNyRSx1RUFBdUU7b0JBQ3ZFLDhDQUE4QztvQkFDOUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLG1CQUFtQixDQUFDO3dCQUN2QyxDQUFDLHNCQUFzQixDQUFDLG1CQUFtQixDQUFDLEVBQUU7d0JBQ2hELElBQUksa0JBQWtCLENBQUMsbUJBQW1CLEVBQUUsS0FBSyxDQUFDLEVBQUU7NEJBQ2xELGtFQUFrRTs0QkFDbEUsOERBQThEOzRCQUM5RCxrREFBa0Q7NEJBQ2xELGlDQUFpQzs0QkFDakMsMkJBQTJCLENBQUMsR0FBRyxFQUFFLG1CQUFtQixDQUFDLENBQUM7eUJBQ3ZEOzZCQUFNOzRCQUNMLHdCQUF3QixDQUFDLEdBQUcsRUFBRSxtQkFBbUIsRUFBRSxLQUFLLENBQUMsQ0FBQzt5QkFDM0Q7cUJBQ0Y7aUJBQ0Y7cUJBQU07b0JBQ0wsdUVBQXVFO29CQUN2RSx5RUFBeUU7b0JBQ3pFLGdGQUFnRjtvQkFDaEYsRUFBRTtvQkFDRiwyRUFBMkU7b0JBQzNFLHNFQUFzRTtvQkFDdEUsNkVBQTZFO29CQUM3RSxxREFBcUQ7b0JBRXJELE1BQU0sK0JBQStCLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7aUJBQzlEO2FBQ0Y7U0FDRjtRQUNELElBQUksWUFBWSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFO1lBQzFCLDBDQUEwQztZQUMxQyxNQUFNLGFBQWEsR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDO1lBQ2xDLElBQUksYUFBYSxLQUFLLElBQUksRUFBRTtnQkFDMUIsR0FBRyxDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDdEIsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsQ0FBQzthQUN6RDtZQUVELDBDQUEwQztZQUMxQyxNQUFNLFFBQVEsR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFFLENBQUMsQ0FBRSw4QkFBOEI7WUFFakUsOENBQThDO1lBQzlDLHNCQUFzQjtZQUN0Qix3REFBd0Q7WUFDeEQsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxFQUFFO2dCQUMzQixnREFBZ0Q7Z0JBQ2hELE1BQU0sVUFBVSxHQUFHLFdBQVcsQ0FBQyxRQUFpQixDQUFhLENBQUM7Z0JBQzlELElBQUksQ0FBRSxVQUEwQixDQUFDLFlBQVksQ0FBQyx3QkFBd0IsQ0FBQyxFQUFFO29CQUN2RSwrQkFBK0IsQ0FBQyxVQUFVLEVBQUUsUUFBaUIsRUFBRSxPQUFPLENBQUMsQ0FBQztpQkFDekU7YUFDRjtZQUNELEdBQUcsQ0FBQyxVQUFVLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDdkIsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxHQUFHLG1CQUFtQixDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxPQUFPLENBQUMsQ0FBQztTQUN6RTthQUFNLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRTtZQUNsQyx1RUFBdUU7WUFDdkUsTUFBTSxVQUFVLEdBQUcsV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUUsQ0FBQyxDQUFDO1lBQ2hELElBQUksQ0FBRSxVQUEwQixDQUFDLFlBQVksQ0FBQyx3QkFBd0IsQ0FBQyxFQUFFO2dCQUN2RSwrQkFBK0IsQ0FBQyxVQUFzQixFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxPQUFPLENBQUMsQ0FBQzthQUM1RTtTQUNGO2FBQU07WUFDTCxzQkFBc0I7WUFDdEIsSUFBSSxLQUFLLENBQUMsSUFBSSxxQ0FBNkIsRUFBRTtnQkFDM0Msb0RBQW9EO2dCQUNwRCwyREFBMkQ7Z0JBQzNELG1FQUFtRTtnQkFDbkUsR0FBRyxDQUFDLGtCQUFrQixDQUFDLEtBQUssRUFBRSxDQUFDO2dCQUMvQixHQUFHLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxhQUFhLENBQUMsR0FBRyxnQkFBZ0IsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQzthQUN0RjtpQkFBTSxJQUFJLEtBQUssQ0FBQyxJQUFJLGdDQUF1QixFQUFFO2dCQUM1QyxrRUFBa0U7Z0JBQ2xFLHNFQUFzRTtnQkFDdEUsc0VBQXNFO2dCQUN0RSxJQUFJLFNBQVMsR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDO2dCQUMzQiwrQ0FBK0M7Z0JBQy9DLE9BQU8sU0FBUyxLQUFLLElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGdDQUF1QixDQUFDLEVBQUU7b0JBQ3BFLFNBQVMsR0FBRyxTQUFTLENBQUMsSUFBSSxDQUFDO2lCQUM1QjtnQkFDRCxJQUFJLFNBQVMsSUFBSSxDQUFDLHNCQUFzQixDQUFDLFNBQVMsQ0FBQyxFQUFFO29CQUNuRCxnREFBZ0Q7b0JBQ2hELHdCQUF3QixDQUFDLEdBQUcsRUFBRSxTQUFTLEVBQUUsS0FBSyxDQUFDLENBQUM7aUJBQ2pEO2FBQ0Y7aUJBQU07Z0JBQ0wscUVBQXFFO2dCQUNyRSxvRUFBb0U7Z0JBQ3BFLHlFQUF5RTtnQkFDekUsdUVBQXVFO2dCQUN2RSw0RUFBNEU7Z0JBQzVFLDJFQUEyRTtnQkFDM0UsNkVBQTZFO2dCQUM3RSwwRUFBMEU7Z0JBQzFFLDhFQUE4RTtnQkFDOUUsMkVBQTJFO2dCQUMzRSw2RUFBNkU7Z0JBQzdFLGlCQUFpQjtnQkFDakIsa0VBQWtFO2dCQUNsRSxtRkFBbUY7Z0JBQ25GLDJEQUEyRDtnQkFDM0Qsd0VBQXdFO2dCQUN4RSx3RkFBd0Y7Z0JBQ3hGLHFEQUFxRDtnQkFDckQsOERBQThEO2dCQUM5RCxvRkFBb0Y7Z0JBQ3BGLDRFQUE0RTtnQkFDNUUsb0ZBQW9GO2dCQUNwRiwwRkFBMEY7Z0JBQzFGLDhFQUE4RTtnQkFDOUUsdUZBQXVGO2dCQUN2RiwwRUFBMEU7Z0JBQzFFLElBQUksS0FBSyxDQUFDLElBQUkseUJBQWlCLEVBQUU7b0JBQy9CLE1BQU0sS0FBSyxHQUFHLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQWdCLENBQUM7b0JBQ25ELElBQUksS0FBSyxDQUFDLFdBQVcsRUFBRSxPQUFPLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxLQUFLLEVBQUUsRUFBRTt3QkFDakQsT0FBTyxDQUFDLGtCQUFrQixDQUFDLEdBQUcsQ0FBQyxLQUFLLHlDQUEyQixDQUFDO3FCQUNqRTt5QkFBTSxJQUFJLEtBQUssQ0FBQyxXQUFXLEVBQUUsUUFBUSxLQUFLLElBQUksQ0FBQyxTQUFTLEVBQUU7d0JBQ3pELE9BQU8sQ0FBQyxrQkFBa0IsQ0FBQyxHQUFHLENBQUMsS0FBSyx5Q0FBMkIsQ0FBQztxQkFDakU7aUJBQ0Y7Z0JBRUQsSUFBSSxLQUFLLENBQUMsY0FBYyxJQUFJLEtBQUssQ0FBQyxjQUFjLEtBQUssS0FBSyxDQUFDLElBQUk7b0JBQzNELENBQUMsc0JBQXNCLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxFQUFFO29CQUNqRCxrRUFBa0U7b0JBQ2xFLGlFQUFpRTtvQkFDakUsNENBQTRDO29CQUM1Qyx3QkFBd0IsQ0FBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLGNBQWMsRUFBRSxLQUFLLENBQUMsQ0FBQztpQkFDNUQ7YUFDRjtTQUNGO0tBQ0Y7SUFDRCxPQUFPLEdBQUcsQ0FBQztBQUNiLENBQUM7QUFFRDs7O0dBR0c7QUFDSCxTQUFTLG1DQUFtQyxDQUFDLEtBQVk7SUFDdkQsTUFBTSxRQUFRLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQ2hDLE9BQU8sUUFBUSxFQUFFLFdBQVcsQ0FBQyxDQUFDO1FBQzFCLGVBQWUsQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLEVBQUUsYUFBYSxLQUFLLGlCQUFpQixDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQ3RGLEtBQUssQ0FBQztBQUNaLENBQUM7QUFFRDs7Ozs7Ozs7OztHQVVHO0FBQ0gsU0FBUywrQkFBK0IsQ0FDcEMsT0FBaUIsRUFBRSxLQUFZLEVBQUUsT0FBeUI7SUFDNUQsTUFBTSxRQUFRLEdBQUcsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQ2pDLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLDhCQUFxQixDQUFDLGdDQUF1QjtRQUMxRCxtQ0FBbUMsQ0FBQyxLQUFLLENBQUMsRUFBRTtRQUM5Qyx5REFBeUQ7UUFDekQsNkVBQTZFO1FBQzdFLHVFQUF1RTtRQUN2RSwrRUFBK0U7UUFDL0Usd0JBQXdCO1FBQ3hCLFFBQVEsQ0FBQyxZQUFZLENBQUMsT0FBTyxFQUFFLHdCQUF3QixFQUFFLEVBQUUsQ0FBQyxDQUFDO0tBQzlEO1NBQU07UUFDTCxNQUFNLEdBQUcsR0FBRyxjQUFjLENBQUMsS0FBSyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBQzNDLE1BQU0sS0FBSyxHQUFHLE9BQU8sQ0FBQyx3QkFBd0IsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDeEQsUUFBUSxDQUFDLFlBQVksQ0FBQyxPQUFPLEVBQUUsYUFBYSxFQUFFLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO0tBQ2pFO0FBQ0gsQ0FBQztBQUVEOzs7Ozs7OztHQVFHO0FBQ0gsU0FBUyw4QkFBOEIsQ0FDbkMsa0JBQTRDLEVBQUUsR0FBYTtJQUM3RCxLQUFLLE1BQU0sQ0FBQyxRQUFRLEVBQUUsTUFBTSxDQUFDLElBQUksa0JBQWtCLEVBQUU7UUFDbkQsUUFBUSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7S0FDM0M7QUFDSCxDQUFDO0FBRUQ7OztHQUdHO0FBQ0gsU0FBUyxzQkFBc0IsQ0FBQyxLQUFZO0lBQzFDLElBQUksWUFBWSxHQUFHLEtBQUssQ0FBQztJQUN6QixPQUFPLFlBQVksSUFBSSxJQUFJLEVBQUU7UUFDM0IsNERBQTREO1FBQzVELG1EQUFtRDtRQUNuRCxJQUFJLGVBQWUsQ0FBQyxZQUFZLENBQUMsRUFBRTtZQUNqQyxPQUFPLElBQUksQ0FBQztTQUNiO1FBQ0QsWUFBWSxHQUFHLFlBQVksQ0FBQyxNQUFlLENBQUM7S0FDN0M7SUFDRCxPQUFPLEtBQUssQ0FBQztBQUNmLENBQUM7QUFFRDs7Ozs7O0dBTUc7QUFDSCxTQUFTLGtCQUFrQixDQUFDLEtBQVksRUFBRSxLQUFZO0lBQ3BELE9BQU8sQ0FBQyxDQUFDLEtBQUssQ0FBQyxJQUFJLGdDQUF1QixDQUFDLElBQUksQ0FBQyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDO1FBQy9ELENBQUUsV0FBVyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQVUsQ0FBQyxXQUFXLENBQUM7QUFDN0QsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0FwcGxpY2F0aW9uUmVmfSBmcm9tICcuLi9hcHBsaWNhdGlvbl9yZWYnO1xuaW1wb3J0IHtWaWV3RW5jYXBzdWxhdGlvbn0gZnJvbSAnLi4vbWV0YWRhdGEnO1xuaW1wb3J0IHtjb2xsZWN0TmF0aXZlTm9kZXN9IGZyb20gJy4uL3JlbmRlcjMvY29sbGVjdF9uYXRpdmVfbm9kZXMnO1xuaW1wb3J0IHtnZXRDb21wb25lbnREZWZ9IGZyb20gJy4uL3JlbmRlcjMvZGVmaW5pdGlvbic7XG5pbXBvcnQge0NPTlRBSU5FUl9IRUFERVJfT0ZGU0VULCBMQ29udGFpbmVyfSBmcm9tICcuLi9yZW5kZXIzL2ludGVyZmFjZXMvY29udGFpbmVyJztcbmltcG9ydCB7VE5vZGUsIFROb2RlVHlwZX0gZnJvbSAnLi4vcmVuZGVyMy9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtSRWxlbWVudH0gZnJvbSAnLi4vcmVuZGVyMy9pbnRlcmZhY2VzL3JlbmRlcmVyX2RvbSc7XG5pbXBvcnQge2lzQ29tcG9uZW50SG9zdCwgaXNMQ29udGFpbmVyLCBpc1Byb2plY3Rpb25UTm9kZSwgaXNSb290Vmlld30gZnJvbSAnLi4vcmVuZGVyMy9pbnRlcmZhY2VzL3R5cGVfY2hlY2tzJztcbmltcG9ydCB7Q09OVEVYVCwgRkxBR1MsIEhFQURFUl9PRkZTRVQsIEhPU1QsIExWaWV3LCBMVmlld0ZsYWdzLCBSRU5ERVJFUiwgVFZpZXcsIFRWSUVXLCBUVmlld1R5cGV9IGZyb20gJy4uL3JlbmRlcjMvaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7dW53cmFwUk5vZGV9IGZyb20gJy4uL3JlbmRlcjMvdXRpbC92aWV3X3V0aWxzJztcbmltcG9ydCB7VHJhbnNmZXJTdGF0ZX0gZnJvbSAnLi4vdHJhbnNmZXJfc3RhdGUnO1xuXG5pbXBvcnQge3Vuc3VwcG9ydGVkUHJvamVjdGlvbk9mRG9tTm9kZXN9IGZyb20gJy4vZXJyb3JfaGFuZGxpbmcnO1xuaW1wb3J0IHtDT05UQUlORVJTLCBESVNDT05ORUNURURfTk9ERVMsIEVMRU1FTlRfQ09OVEFJTkVSUywgTVVMVElQTElFUiwgTk9ERVMsIE5VTV9ST09UX05PREVTLCBTZXJpYWxpemVkQ29udGFpbmVyVmlldywgU2VyaWFsaXplZFZpZXcsIFRFTVBMQVRFX0lELCBURU1QTEFURVN9IGZyb20gJy4vaW50ZXJmYWNlcyc7XG5pbXBvcnQge2NhbGNQYXRoRm9yTm9kZX0gZnJvbSAnLi9ub2RlX2xvb2t1cF91dGlscyc7XG5pbXBvcnQge2lzSW5Ta2lwSHlkcmF0aW9uQmxvY2ssIFNLSVBfSFlEUkFUSU9OX0FUVFJfTkFNRX0gZnJvbSAnLi9za2lwX2h5ZHJhdGlvbic7XG5pbXBvcnQge2dldENvbXBvbmVudExWaWV3Rm9ySHlkcmF0aW9uLCBOR0hfQVRUUl9OQU1FLCBOR0hfREFUQV9LRVksIFRleHROb2RlTWFya2VyfSBmcm9tICcuL3V0aWxzJztcblxuLyoqXG4gKiBBIGNvbGxlY3Rpb24gdGhhdCB0cmFja3MgYWxsIHNlcmlhbGl6ZWQgdmlld3MgKGBuZ2hgIERPTSBhbm5vdGF0aW9ucylcbiAqIHRvIGF2b2lkIGR1cGxpY2F0aW9uLiBBbiBhdHRlbXB0IHRvIGFkZCBhIGR1cGxpY2F0ZSB2aWV3IHJlc3VsdHMgaW4gdGhlXG4gKiBjb2xsZWN0aW9uIHJldHVybmluZyB0aGUgaW5kZXggb2YgdGhlIHByZXZpb3VzbHkgY29sbGVjdGVkIHNlcmlhbGl6ZWQgdmlldy5cbiAqIFRoaXMgcmVkdWNlcyB0aGUgbnVtYmVyIG9mIGFubm90YXRpb25zIG5lZWRlZCBmb3IgYSBnaXZlbiBwYWdlLlxuICovXG5jbGFzcyBTZXJpYWxpemVkVmlld0NvbGxlY3Rpb24ge1xuICBwcml2YXRlIHZpZXdzOiBTZXJpYWxpemVkVmlld1tdID0gW107XG4gIHByaXZhdGUgaW5kZXhCeUNvbnRlbnQgPSBuZXcgTWFwPHN0cmluZywgbnVtYmVyPigpO1xuXG4gIGFkZChzZXJpYWxpemVkVmlldzogU2VyaWFsaXplZFZpZXcpOiBudW1iZXIge1xuICAgIGNvbnN0IHZpZXdBc1N0cmluZyA9IEpTT04uc3RyaW5naWZ5KHNlcmlhbGl6ZWRWaWV3KTtcbiAgICBpZiAoIXRoaXMuaW5kZXhCeUNvbnRlbnQuaGFzKHZpZXdBc1N0cmluZykpIHtcbiAgICAgIGNvbnN0IGluZGV4ID0gdGhpcy52aWV3cy5sZW5ndGg7XG4gICAgICB0aGlzLnZpZXdzLnB1c2goc2VyaWFsaXplZFZpZXcpO1xuICAgICAgdGhpcy5pbmRleEJ5Q29udGVudC5zZXQodmlld0FzU3RyaW5nLCBpbmRleCk7XG4gICAgICByZXR1cm4gaW5kZXg7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLmluZGV4QnlDb250ZW50LmdldCh2aWV3QXNTdHJpbmcpITtcbiAgfVxuXG4gIGdldEFsbCgpOiBTZXJpYWxpemVkVmlld1tdIHtcbiAgICByZXR1cm4gdGhpcy52aWV3cztcbiAgfVxufVxuXG4vKipcbiAqIEdsb2JhbCBjb3VudGVyIHRoYXQgaXMgdXNlZCB0byBnZW5lcmF0ZSBhIHVuaXF1ZSBpZCBmb3IgVFZpZXdzXG4gKiBkdXJpbmcgdGhlIHNlcmlhbGl6YXRpb24gcHJvY2Vzcy5cbiAqL1xubGV0IHRWaWV3U3NySWQgPSAwO1xuXG4vKipcbiAqIEdlbmVyYXRlcyBhIHVuaXF1ZSBpZCBmb3IgYSBnaXZlbiBUVmlldyBhbmQgcmV0dXJucyB0aGlzIGlkLlxuICogVGhlIGlkIGlzIGFsc28gc3RvcmVkIG9uIHRoaXMgaW5zdGFuY2Ugb2YgYSBUVmlldyBhbmQgcmV1c2VkIGluXG4gKiBzdWJzZXF1ZW50IGNhbGxzLlxuICpcbiAqIFRoaXMgaWQgaXMgbmVlZGVkIHRvIHVuaXF1ZWx5IGlkZW50aWZ5IGFuZCBwaWNrIHVwIGRlaHlkcmF0ZWQgdmlld3NcbiAqIGF0IHJ1bnRpbWUuXG4gKi9cbmZ1bmN0aW9uIGdldFNzcklkKHRWaWV3OiBUVmlldyk6IHN0cmluZyB7XG4gIGlmICghdFZpZXcuc3NySWQpIHtcbiAgICB0Vmlldy5zc3JJZCA9IGB0JHt0Vmlld1NzcklkKyt9YDtcbiAgfVxuICByZXR1cm4gdFZpZXcuc3NySWQ7XG59XG5cbi8qKlxuICogRGVzY3JpYmVzIGEgY29udGV4dCBhdmFpbGFibGUgZHVyaW5nIHRoZSBzZXJpYWxpemF0aW9uXG4gKiBwcm9jZXNzLiBUaGUgY29udGV4dCBpcyB1c2VkIHRvIHNoYXJlIGFuZCBjb2xsZWN0IGluZm9ybWF0aW9uXG4gKiBkdXJpbmcgdGhlIHNlcmlhbGl6YXRpb24uXG4gKi9cbmludGVyZmFjZSBIeWRyYXRpb25Db250ZXh0IHtcbiAgc2VyaWFsaXplZFZpZXdDb2xsZWN0aW9uOiBTZXJpYWxpemVkVmlld0NvbGxlY3Rpb247XG4gIGNvcnJ1cHRlZFRleHROb2RlczogTWFwPEhUTUxFbGVtZW50LCBUZXh0Tm9kZU1hcmtlcj47XG59XG5cbi8qKlxuICogQ29tcHV0ZXMgdGhlIG51bWJlciBvZiByb290IG5vZGVzIGluIGEgZ2l2ZW4gdmlld1xuICogKG9yIGNoaWxkIG5vZGVzIGluIGEgZ2l2ZW4gY29udGFpbmVyIGlmIGEgdE5vZGUgaXMgcHJvdmlkZWQpLlxuICovXG5mdW5jdGlvbiBjYWxjTnVtUm9vdE5vZGVzKHRWaWV3OiBUVmlldywgbFZpZXc6IExWaWV3LCB0Tm9kZTogVE5vZGV8bnVsbCk6IG51bWJlciB7XG4gIGNvbnN0IHJvb3ROb2RlczogdW5rbm93bltdID0gW107XG4gIGNvbGxlY3ROYXRpdmVOb2Rlcyh0VmlldywgbFZpZXcsIHROb2RlLCByb290Tm9kZXMpO1xuICByZXR1cm4gcm9vdE5vZGVzLmxlbmd0aDtcbn1cblxuLyoqXG4gKiBBbm5vdGF0ZXMgYWxsIGNvbXBvbmVudHMgYm9vdHN0cmFwcGVkIGluIGEgZ2l2ZW4gQXBwbGljYXRpb25SZWZcbiAqIHdpdGggaW5mbyBuZWVkZWQgZm9yIGh5ZHJhdGlvbi5cbiAqXG4gKiBAcGFyYW0gYXBwUmVmIEFuIGluc3RhbmNlIG9mIGFuIEFwcGxpY2F0aW9uUmVmLlxuICogQHBhcmFtIGRvYyBBIHJlZmVyZW5jZSB0byB0aGUgY3VycmVudCBEb2N1bWVudCBpbnN0YW5jZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFubm90YXRlRm9ySHlkcmF0aW9uKGFwcFJlZjogQXBwbGljYXRpb25SZWYsIGRvYzogRG9jdW1lbnQpIHtcbiAgY29uc3Qgc2VyaWFsaXplZFZpZXdDb2xsZWN0aW9uID0gbmV3IFNlcmlhbGl6ZWRWaWV3Q29sbGVjdGlvbigpO1xuICBjb25zdCBjb3JydXB0ZWRUZXh0Tm9kZXMgPSBuZXcgTWFwPEhUTUxFbGVtZW50LCBUZXh0Tm9kZU1hcmtlcj4oKTtcbiAgY29uc3Qgdmlld1JlZnMgPSBhcHBSZWYuX3ZpZXdzO1xuICBmb3IgKGNvbnN0IHZpZXdSZWYgb2Ygdmlld1JlZnMpIHtcbiAgICBjb25zdCBsVmlldyA9IGdldENvbXBvbmVudExWaWV3Rm9ySHlkcmF0aW9uKHZpZXdSZWYpO1xuICAgIC8vIEFuIGBsVmlld2AgbWlnaHQgYmUgYG51bGxgIGlmIGEgYFZpZXdSZWZgIHJlcHJlc2VudHNcbiAgICAvLyBhbiBlbWJlZGRlZCB2aWV3IChub3QgYSBjb21wb25lbnQgdmlldykuXG4gICAgaWYgKGxWaWV3ICE9PSBudWxsKSB7XG4gICAgICBjb25zdCBob3N0RWxlbWVudCA9IGxWaWV3W0hPU1RdO1xuICAgICAgLy8gUm9vdCBlbGVtZW50cyBtaWdodCBhbHNvIGJlIGFubm90YXRlZCB3aXRoIHRoZSBgbmdTa2lwSHlkcmF0aW9uYCBhdHRyaWJ1dGUsXG4gICAgICAvLyBjaGVjayBpZiBpdCdzIHByZXNlbnQgYmVmb3JlIHN0YXJ0aW5nIHRoZSBzZXJpYWxpemF0aW9uIHByb2Nlc3MuXG4gICAgICBpZiAoaG9zdEVsZW1lbnQgJiYgIShob3N0RWxlbWVudCBhcyBIVE1MRWxlbWVudCkuaGFzQXR0cmlidXRlKFNLSVBfSFlEUkFUSU9OX0FUVFJfTkFNRSkpIHtcbiAgICAgICAgY29uc3QgY29udGV4dDogSHlkcmF0aW9uQ29udGV4dCA9IHtcbiAgICAgICAgICBzZXJpYWxpemVkVmlld0NvbGxlY3Rpb24sXG4gICAgICAgICAgY29ycnVwdGVkVGV4dE5vZGVzLFxuICAgICAgICB9O1xuICAgICAgICBhbm5vdGF0ZUhvc3RFbGVtZW50Rm9ySHlkcmF0aW9uKGhvc3RFbGVtZW50IGFzIEhUTUxFbGVtZW50LCBsVmlldywgY29udGV4dCk7XG4gICAgICAgIGluc2VydENvcnJ1cHRlZFRleHROb2RlTWFya2Vycyhjb3JydXB0ZWRUZXh0Tm9kZXMsIGRvYyk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8gTm90ZTogd2UgKmFsd2F5cyogaW5jbHVkZSBoeWRyYXRpb24gaW5mbyBrZXkgYW5kIGEgY29ycmVzcG9uZGluZyB2YWx1ZVxuICAvLyBpbnRvIHRoZSBUcmFuc2ZlclN0YXRlLCBldmVuIGlmIHRoZSBsaXN0IG9mIHNlcmlhbGl6ZWQgdmlld3MgaXMgZW1wdHkuXG4gIC8vIFRoaXMgaXMgbmVlZGVkIGFzIGEgc2lnbmFsIHRvIHRoZSBjbGllbnQgdGhhdCB0aGUgc2VydmVyIHBhcnQgb2YgdGhlXG4gIC8vIGh5ZHJhdGlvbiBsb2dpYyB3YXMgc2V0dXAgYW5kIGVuYWJsZWQgY29ycmVjdGx5LiBPdGhlcndpc2UsIGlmIGEgY2xpZW50XG4gIC8vIGh5ZHJhdGlvbiBkb2Vzbid0IGZpbmQgYSBrZXkgaW4gdGhlIHRyYW5zZmVyIHN0YXRlIC0gYW4gZXJyb3IgaXMgcHJvZHVjZWQuXG4gIGNvbnN0IHNlcmlhbGl6ZWRWaWV3cyA9IHNlcmlhbGl6ZWRWaWV3Q29sbGVjdGlvbi5nZXRBbGwoKTtcbiAgY29uc3QgdHJhbnNmZXJTdGF0ZSA9IGFwcFJlZi5pbmplY3Rvci5nZXQoVHJhbnNmZXJTdGF0ZSk7XG4gIHRyYW5zZmVyU3RhdGUuc2V0KE5HSF9EQVRBX0tFWSwgc2VyaWFsaXplZFZpZXdzKTtcbn1cblxuLyoqXG4gKiBTZXJpYWxpemVzIHRoZSBsQ29udGFpbmVyIGRhdGEgaW50byBhIGxpc3Qgb2YgU2VyaWFsaXplZFZpZXcgb2JqZWN0cyxcbiAqIHRoYXQgcmVwcmVzZW50IHZpZXdzIHdpdGhpbiB0aGlzIGxDb250YWluZXIuXG4gKlxuICogQHBhcmFtIGxDb250YWluZXIgdGhlIGxDb250YWluZXIgd2UgYXJlIHNlcmlhbGl6aW5nXG4gKiBAcGFyYW0gY29udGV4dCB0aGUgaHlkcmF0aW9uIGNvbnRleHRcbiAqIEByZXR1cm5zIGFuIGFycmF5IG9mIHRoZSBgU2VyaWFsaXplZFZpZXdgIG9iamVjdHNcbiAqL1xuZnVuY3Rpb24gc2VyaWFsaXplTENvbnRhaW5lcihcbiAgICBsQ29udGFpbmVyOiBMQ29udGFpbmVyLCBjb250ZXh0OiBIeWRyYXRpb25Db250ZXh0KTogU2VyaWFsaXplZENvbnRhaW5lclZpZXdbXSB7XG4gIGNvbnN0IHZpZXdzOiBTZXJpYWxpemVkQ29udGFpbmVyVmlld1tdID0gW107XG4gIGxldCBsYXN0Vmlld0FzU3RyaW5nOiBzdHJpbmcgPSAnJztcblxuICBmb3IgKGxldCBpID0gQ09OVEFJTkVSX0hFQURFUl9PRkZTRVQ7IGkgPCBsQ29udGFpbmVyLmxlbmd0aDsgaSsrKSB7XG4gICAgbGV0IGNoaWxkTFZpZXcgPSBsQ29udGFpbmVyW2ldIGFzIExWaWV3O1xuXG4gICAgLy8gSWYgdGhpcyBpcyBhIHJvb3QgdmlldywgZ2V0IGFuIExWaWV3IGZvciB0aGUgdW5kZXJseWluZyBjb21wb25lbnQsXG4gICAgLy8gYmVjYXVzZSBpdCBjb250YWlucyBpbmZvcm1hdGlvbiBhYm91dCB0aGUgdmlldyB0byBzZXJpYWxpemUuXG4gICAgaWYgKGlzUm9vdFZpZXcoY2hpbGRMVmlldykpIHtcbiAgICAgIGNoaWxkTFZpZXcgPSBjaGlsZExWaWV3W0hFQURFUl9PRkZTRVRdO1xuICAgIH1cbiAgICBjb25zdCBjaGlsZFRWaWV3ID0gY2hpbGRMVmlld1tUVklFV107XG5cbiAgICBsZXQgdGVtcGxhdGU6IHN0cmluZztcbiAgICBsZXQgbnVtUm9vdE5vZGVzID0gMDtcbiAgICBpZiAoY2hpbGRUVmlldy50eXBlID09PSBUVmlld1R5cGUuQ29tcG9uZW50KSB7XG4gICAgICB0ZW1wbGF0ZSA9IGNoaWxkVFZpZXcuc3NySWQhO1xuXG4gICAgICAvLyBUaGlzIGlzIGEgY29tcG9uZW50IHZpZXcsIHRodXMgaXQgaGFzIG9ubHkgMSByb290IG5vZGU6IHRoZSBjb21wb25lbnRcbiAgICAgIC8vIGhvc3Qgbm9kZSBpdHNlbGYgKG90aGVyIG5vZGVzIHdvdWxkIGJlIGluc2lkZSB0aGF0IGhvc3Qgbm9kZSkuXG4gICAgICBudW1Sb290Tm9kZXMgPSAxO1xuICAgIH0gZWxzZSB7XG4gICAgICB0ZW1wbGF0ZSA9IGdldFNzcklkKGNoaWxkVFZpZXcpO1xuICAgICAgbnVtUm9vdE5vZGVzID0gY2FsY051bVJvb3ROb2RlcyhjaGlsZFRWaWV3LCBjaGlsZExWaWV3LCBjaGlsZFRWaWV3LmZpcnN0Q2hpbGQpO1xuICAgIH1cblxuICAgIGNvbnN0IHZpZXc6IFNlcmlhbGl6ZWRDb250YWluZXJWaWV3ID0ge1xuICAgICAgW1RFTVBMQVRFX0lEXTogdGVtcGxhdGUsXG4gICAgICBbTlVNX1JPT1RfTk9ERVNdOiBudW1Sb290Tm9kZXMsXG4gICAgICAuLi5zZXJpYWxpemVMVmlldyhsQ29udGFpbmVyW2ldIGFzIExWaWV3LCBjb250ZXh0KSxcbiAgICB9O1xuXG4gICAgLy8gQ2hlY2sgaWYgdGhlIHByZXZpb3VzIHZpZXcgaGFzIHRoZSBzYW1lIHNoYXBlIChmb3IgZXhhbXBsZSwgaXQgd2FzXG4gICAgLy8gcHJvZHVjZWQgYnkgdGhlICpuZ0ZvciksIGluIHdoaWNoIGNhc2UgYnVtcCB0aGUgY291bnRlciBvbiB0aGUgcHJldmlvdXNcbiAgICAvLyB2aWV3IGluc3RlYWQgb2YgaW5jbHVkaW5nIHRoZSBzYW1lIGluZm9ybWF0aW9uIGFnYWluLlxuICAgIGNvbnN0IGN1cnJlbnRWaWV3QXNTdHJpbmcgPSBKU09OLnN0cmluZ2lmeSh2aWV3KTtcbiAgICBpZiAodmlld3MubGVuZ3RoID4gMCAmJiBjdXJyZW50Vmlld0FzU3RyaW5nID09PSBsYXN0Vmlld0FzU3RyaW5nKSB7XG4gICAgICBjb25zdCBwcmV2aW91c1ZpZXcgPSB2aWV3c1t2aWV3cy5sZW5ndGggLSAxXTtcbiAgICAgIHByZXZpb3VzVmlld1tNVUxUSVBMSUVSXSA/Pz0gMTtcbiAgICAgIHByZXZpb3VzVmlld1tNVUxUSVBMSUVSXSsrO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBSZWNvcmQgdGhpcyB2aWV3IGFzIG1vc3QgcmVjZW50bHkgYWRkZWQuXG4gICAgICBsYXN0Vmlld0FzU3RyaW5nID0gY3VycmVudFZpZXdBc1N0cmluZztcbiAgICAgIHZpZXdzLnB1c2godmlldyk7XG4gICAgfVxuICB9XG4gIHJldHVybiB2aWV3cztcbn1cblxuLyoqXG4gKiBIZWxwZXIgZnVuY3Rpb24gdG8gcHJvZHVjZSBhIG5vZGUgcGF0aCAod2hpY2ggbmF2aWdhdGlvbiBzdGVwcyBydW50aW1lIGxvZ2ljXG4gKiBuZWVkcyB0byB0YWtlIHRvIGxvY2F0ZSBhIG5vZGUpIGFuZCBzdG9yZXMgaXQgaW4gdGhlIGBOT0RFU2Agc2VjdGlvbiBvZiB0aGVcbiAqIGN1cnJlbnQgc2VyaWFsaXplZCB2aWV3LlxuICovXG5mdW5jdGlvbiBhcHBlbmRTZXJpYWxpemVkTm9kZVBhdGgobmdoOiBTZXJpYWxpemVkVmlldywgdE5vZGU6IFROb2RlLCBsVmlldzogTFZpZXcpIHtcbiAgY29uc3Qgbm9PZmZzZXRJbmRleCA9IHROb2RlLmluZGV4IC0gSEVBREVSX09GRlNFVDtcbiAgbmdoW05PREVTXSA/Pz0ge307XG4gIG5naFtOT0RFU11bbm9PZmZzZXRJbmRleF0gPSBjYWxjUGF0aEZvck5vZGUodE5vZGUsIGxWaWV3KTtcbn1cblxuLyoqXG4gKiBIZWxwZXIgZnVuY3Rpb24gdG8gYXBwZW5kIGluZm9ybWF0aW9uIGFib3V0IGEgZGlzY29ubmVjdGVkIG5vZGUuXG4gKiBUaGlzIGluZm8gaXMgbmVlZGVkIGF0IHJ1bnRpbWUgdG8gYXZvaWQgRE9NIGxvb2t1cHMgZm9yIHRoaXMgZWxlbWVudFxuICogYW5kIGluc3RlYWQsIHRoZSBlbGVtZW50IHdvdWxkIGJlIGNyZWF0ZWQgZnJvbSBzY3JhdGNoLlxuICovXG5mdW5jdGlvbiBhcHBlbmREaXNjb25uZWN0ZWROb2RlSW5kZXgobmdoOiBTZXJpYWxpemVkVmlldywgdE5vZGU6IFROb2RlKSB7XG4gIGNvbnN0IG5vT2Zmc2V0SW5kZXggPSB0Tm9kZS5pbmRleCAtIEhFQURFUl9PRkZTRVQ7XG4gIG5naFtESVNDT05ORUNURURfTk9ERVNdID8/PSBbXTtcbiAgaWYgKCFuZ2hbRElTQ09OTkVDVEVEX05PREVTXS5pbmNsdWRlcyhub09mZnNldEluZGV4KSkge1xuICAgIG5naFtESVNDT05ORUNURURfTk9ERVNdLnB1c2gobm9PZmZzZXRJbmRleCk7XG4gIH1cbn1cblxuLyoqXG4gKiBTZXJpYWxpemVzIHRoZSBsVmlldyBkYXRhIGludG8gYSBTZXJpYWxpemVkVmlldyBvYmplY3QgdGhhdCB3aWxsIGxhdGVyIGJlIGFkZGVkXG4gKiB0byB0aGUgVHJhbnNmZXJTdGF0ZSBzdG9yYWdlIGFuZCByZWZlcmVuY2VkIHVzaW5nIHRoZSBgbmdoYCBhdHRyaWJ1dGUgb24gYSBob3N0XG4gKiBlbGVtZW50LlxuICpcbiAqIEBwYXJhbSBsVmlldyB0aGUgbFZpZXcgd2UgYXJlIHNlcmlhbGl6aW5nXG4gKiBAcGFyYW0gY29udGV4dCB0aGUgaHlkcmF0aW9uIGNvbnRleHRcbiAqIEByZXR1cm5zIHRoZSBgU2VyaWFsaXplZFZpZXdgIG9iamVjdCBjb250YWluaW5nIHRoZSBkYXRhIHRvIGJlIGFkZGVkIHRvIHRoZSBob3N0IG5vZGVcbiAqL1xuZnVuY3Rpb24gc2VyaWFsaXplTFZpZXcobFZpZXc6IExWaWV3LCBjb250ZXh0OiBIeWRyYXRpb25Db250ZXh0KTogU2VyaWFsaXplZFZpZXcge1xuICBjb25zdCBuZ2g6IFNlcmlhbGl6ZWRWaWV3ID0ge307XG4gIGNvbnN0IHRWaWV3ID0gbFZpZXdbVFZJRVddO1xuICAvLyBJdGVyYXRlIG92ZXIgRE9NIGVsZW1lbnQgcmVmZXJlbmNlcyBpbiBhbiBMVmlldy5cbiAgZm9yIChsZXQgaSA9IEhFQURFUl9PRkZTRVQ7IGkgPCB0Vmlldy5iaW5kaW5nU3RhcnRJbmRleDsgaSsrKSB7XG4gICAgY29uc3QgdE5vZGUgPSB0Vmlldy5kYXRhW2ldIGFzIFROb2RlO1xuICAgIGNvbnN0IG5vT2Zmc2V0SW5kZXggPSBpIC0gSEVBREVSX09GRlNFVDtcbiAgICAvLyBMb2NhbCByZWZzIChlLmcuIDxkaXYgI2xvY2FsUmVmPikgdGFrZSB1cCBhbiBleHRyYSBzbG90IGluIExWaWV3c1xuICAgIC8vIHRvIHN0b3JlIHRoZSBzYW1lIGVsZW1lbnQuIEluIHRoaXMgY2FzZSwgdGhlcmUgaXMgbm8gaW5mb3JtYXRpb24gaW5cbiAgICAvLyBhIGNvcnJlc3BvbmRpbmcgc2xvdCBpbiBUTm9kZSBkYXRhIHN0cnVjdHVyZS4gSWYgdGhhdCdzIHRoZSBjYXNlLCBqdXN0XG4gICAgLy8gc2tpcCB0aGlzIHNsb3QgYW5kIG1vdmUgdG8gdGhlIG5leHQgb25lLlxuICAgIGlmICghdE5vZGUpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIC8vIENoZWNrIGlmIGEgbmF0aXZlIG5vZGUgdGhhdCByZXByZXNlbnRzIGEgZ2l2ZW4gVE5vZGUgaXMgZGlzY29ubmVjdGVkIGZyb20gdGhlIERPTSB0cmVlLlxuICAgIC8vIFN1Y2ggbm9kZXMgbXVzdCBiZSBleGNsdWRlZCBmcm9tIHRoZSBoeWRyYXRpb24gKHNpbmNlIHRoZSBoeWRyYXRpb24gd29uJ3QgYmUgYWJsZSB0b1xuICAgIC8vIGZpbmQgdGhlbSksIHNvIHRoZSBUTm9kZSBpZHMgYXJlIGNvbGxlY3RlZCBhbmQgdXNlZCBhdCBydW50aW1lIHRvIHNraXAgdGhlIGh5ZHJhdGlvbi5cbiAgICAvL1xuICAgIC8vIFRoaXMgc2l0dWF0aW9uIG1heSBoYXBwZW4gZHVyaW5nIHRoZSBjb250ZW50IHByb2plY3Rpb24sIHdoZW4gc29tZSBub2RlcyBkb24ndCBtYWtlIGl0XG4gICAgLy8gaW50byBvbmUgb2YgdGhlIGNvbnRlbnQgcHJvamVjdGlvbiBzbG90cyAoZm9yIGV4YW1wbGUsIHdoZW4gdGhlcmUgaXMgbm8gZGVmYXVsdFxuICAgIC8vIDxuZy1jb250ZW50IC8+IHNsb3QgaW4gcHJvamVjdG9yIGNvbXBvbmVudCdzIHRlbXBsYXRlKS5cbiAgICBpZiAoaXNEaXNjb25uZWN0ZWROb2RlKHROb2RlLCBsVmlldykgJiYgaXNDb250ZW50UHJvamVjdGVkTm9kZSh0Tm9kZSkpIHtcbiAgICAgIGFwcGVuZERpc2Nvbm5lY3RlZE5vZGVJbmRleChuZ2gsIHROb2RlKTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICBpZiAoQXJyYXkuaXNBcnJheSh0Tm9kZS5wcm9qZWN0aW9uKSkge1xuICAgICAgZm9yIChjb25zdCBwcm9qZWN0aW9uSGVhZFROb2RlIG9mIHROb2RlLnByb2plY3Rpb24pIHtcbiAgICAgICAgLy8gV2UgbWF5IGhhdmUgYG51bGxgcyBpbiBzbG90cyB3aXRoIG5vIHByb2plY3RlZCBjb250ZW50LlxuICAgICAgICBpZiAoIXByb2plY3Rpb25IZWFkVE5vZGUpIGNvbnRpbnVlO1xuXG4gICAgICAgIGlmICghQXJyYXkuaXNBcnJheShwcm9qZWN0aW9uSGVhZFROb2RlKSkge1xuICAgICAgICAgIC8vIElmIHdlIHByb2Nlc3MgcmUtcHJvamVjdGVkIGNvbnRlbnQgKGkuZS4gYDxuZy1jb250ZW50PmBcbiAgICAgICAgICAvLyBhcHBlYXJzIGF0IHByb2plY3Rpb24gbG9jYXRpb24pLCBza2lwIGFubm90YXRpb25zIGZvciB0aGlzIGNvbnRlbnRcbiAgICAgICAgICAvLyBzaW5jZSBhbGwgRE9NIG5vZGVzIGluIHRoaXMgcHJvamVjdGlvbiB3ZXJlIGhhbmRsZWQgd2hpbGUgcHJvY2Vzc2luZ1xuICAgICAgICAgIC8vIGEgcGFyZW50IGxWaWV3LCB3aGljaCBjb250YWlucyB0aG9zZSBub2Rlcy5cbiAgICAgICAgICBpZiAoIWlzUHJvamVjdGlvblROb2RlKHByb2plY3Rpb25IZWFkVE5vZGUpICYmXG4gICAgICAgICAgICAgICFpc0luU2tpcEh5ZHJhdGlvbkJsb2NrKHByb2plY3Rpb25IZWFkVE5vZGUpKSB7XG4gICAgICAgICAgICBpZiAoaXNEaXNjb25uZWN0ZWROb2RlKHByb2plY3Rpb25IZWFkVE5vZGUsIGxWaWV3KSkge1xuICAgICAgICAgICAgICAvLyBDaGVjayB3aGV0aGVyIHRoaXMgbm9kZSBpcyBjb25uZWN0ZWQsIHNpbmNlIHdlIG1heSBoYXZlIGEgVE5vZGVcbiAgICAgICAgICAgICAgLy8gaW4gdGhlIGRhdGEgc3RydWN0dXJlIGFzIGEgcHJvamVjdGlvbiBzZWdtZW50IGhlYWQsIGJ1dCB0aGVcbiAgICAgICAgICAgICAgLy8gY29udGVudCBwcm9qZWN0aW9uIHNsb3QgbWlnaHQgYmUgZGlzYWJsZWQgKGUuZy5cbiAgICAgICAgICAgICAgLy8gPG5nLWNvbnRlbnQgKm5nSWY9XCJmYWxzZVwiIC8+KS5cbiAgICAgICAgICAgICAgYXBwZW5kRGlzY29ubmVjdGVkTm9kZUluZGV4KG5naCwgcHJvamVjdGlvbkhlYWRUTm9kZSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBhcHBlbmRTZXJpYWxpemVkTm9kZVBhdGgobmdoLCBwcm9qZWN0aW9uSGVhZFROb2RlLCBsVmlldyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIElmIGEgdmFsdWUgaXMgYW4gYXJyYXksIGl0IG1lYW5zIHRoYXQgd2UgYXJlIHByb2Nlc3NpbmcgYSBwcm9qZWN0aW9uXG4gICAgICAgICAgLy8gd2hlcmUgcHJvamVjdGFibGUgbm9kZXMgd2VyZSBwYXNzZWQgaW4gYXMgRE9NIG5vZGVzIChmb3IgZXhhbXBsZSwgd2hlblxuICAgICAgICAgIC8vIGNhbGxpbmcgYFZpZXdDb250YWluZXJSZWYuY3JlYXRlQ29tcG9uZW50KENtcEEsIHtwcm9qZWN0YWJsZU5vZGVzOiBbLi4uXX0pYCkuXG4gICAgICAgICAgLy9cbiAgICAgICAgICAvLyBJbiB0aGlzIHNjZW5hcmlvLCBub2RlcyBjYW4gY29tZSBmcm9tIGFueXdoZXJlIChlaXRoZXIgY3JlYXRlZCBtYW51YWxseSxcbiAgICAgICAgICAvLyBhY2Nlc3NlZCB2aWEgYGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JgLCBldGMpIGFuZCBtYXkgYmUgaW4gYW55IHN0YXRlXG4gICAgICAgICAgLy8gKGF0dGFjaGVkIG9yIGRldGFjaGVkIGZyb20gdGhlIERPTSB0cmVlKS4gQXMgYSByZXN1bHQsIHdlIGNhbiBub3QgcmVsaWFibHlcbiAgICAgICAgICAvLyByZXN0b3JlIHRoZSBzdGF0ZSBmb3Igc3VjaCBjYXNlcyBkdXJpbmcgaHlkcmF0aW9uLlxuXG4gICAgICAgICAgdGhyb3cgdW5zdXBwb3J0ZWRQcm9qZWN0aW9uT2ZEb21Ob2Rlcyh1bndyYXBSTm9kZShsVmlld1tpXSkpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChpc0xDb250YWluZXIobFZpZXdbaV0pKSB7XG4gICAgICAvLyBTZXJpYWxpemUgaW5mb3JtYXRpb24gYWJvdXQgYSB0ZW1wbGF0ZS5cbiAgICAgIGNvbnN0IGVtYmVkZGVkVFZpZXcgPSB0Tm9kZS50VmlldztcbiAgICAgIGlmIChlbWJlZGRlZFRWaWV3ICE9PSBudWxsKSB7XG4gICAgICAgIG5naFtURU1QTEFURVNdID8/PSB7fTtcbiAgICAgICAgbmdoW1RFTVBMQVRFU11bbm9PZmZzZXRJbmRleF0gPSBnZXRTc3JJZChlbWJlZGRlZFRWaWV3KTtcbiAgICAgIH1cblxuICAgICAgLy8gU2VyaWFsaXplIHZpZXdzIHdpdGhpbiB0aGlzIExDb250YWluZXIuXG4gICAgICBjb25zdCBob3N0Tm9kZSA9IGxWaWV3W2ldW0hPU1RdITsgIC8vIGhvc3Qgbm9kZSBvZiB0aGlzIGNvbnRhaW5lclxuXG4gICAgICAvLyBMVmlld1tpXVtIT1NUXSBjYW4gYmUgb2YgMiBkaWZmZXJlbnQgdHlwZXM6XG4gICAgICAvLyAtIGVpdGhlciBhIERPTSBub2RlXG4gICAgICAvLyAtIG9yIGFuIGFycmF5IHRoYXQgcmVwcmVzZW50cyBhbiBMVmlldyBvZiBhIGNvbXBvbmVudFxuICAgICAgaWYgKEFycmF5LmlzQXJyYXkoaG9zdE5vZGUpKSB7XG4gICAgICAgIC8vIFRoaXMgaXMgYSBjb21wb25lbnQsIHNlcmlhbGl6ZSBpbmZvIGFib3V0IGl0LlxuICAgICAgICBjb25zdCB0YXJnZXROb2RlID0gdW53cmFwUk5vZGUoaG9zdE5vZGUgYXMgTFZpZXcpIGFzIFJFbGVtZW50O1xuICAgICAgICBpZiAoISh0YXJnZXROb2RlIGFzIEhUTUxFbGVtZW50KS5oYXNBdHRyaWJ1dGUoU0tJUF9IWURSQVRJT05fQVRUUl9OQU1FKSkge1xuICAgICAgICAgIGFubm90YXRlSG9zdEVsZW1lbnRGb3JIeWRyYXRpb24odGFyZ2V0Tm9kZSwgaG9zdE5vZGUgYXMgTFZpZXcsIGNvbnRleHQpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBuZ2hbQ09OVEFJTkVSU10gPz89IHt9O1xuICAgICAgbmdoW0NPTlRBSU5FUlNdW25vT2Zmc2V0SW5kZXhdID0gc2VyaWFsaXplTENvbnRhaW5lcihsVmlld1tpXSwgY29udGV4dCk7XG4gICAgfSBlbHNlIGlmIChBcnJheS5pc0FycmF5KGxWaWV3W2ldKSkge1xuICAgICAgLy8gVGhpcyBpcyBhIGNvbXBvbmVudCwgYW5ub3RhdGUgdGhlIGhvc3Qgbm9kZSB3aXRoIGFuIGBuZ2hgIGF0dHJpYnV0ZS5cbiAgICAgIGNvbnN0IHRhcmdldE5vZGUgPSB1bndyYXBSTm9kZShsVmlld1tpXVtIT1NUXSEpO1xuICAgICAgaWYgKCEodGFyZ2V0Tm9kZSBhcyBIVE1MRWxlbWVudCkuaGFzQXR0cmlidXRlKFNLSVBfSFlEUkFUSU9OX0FUVFJfTkFNRSkpIHtcbiAgICAgICAgYW5ub3RhdGVIb3N0RWxlbWVudEZvckh5ZHJhdGlvbih0YXJnZXROb2RlIGFzIFJFbGVtZW50LCBsVmlld1tpXSwgY29udGV4dCk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIDxuZy1jb250YWluZXI+IGNhc2VcbiAgICAgIGlmICh0Tm9kZS50eXBlICYgVE5vZGVUeXBlLkVsZW1lbnRDb250YWluZXIpIHtcbiAgICAgICAgLy8gQW4gPG5nLWNvbnRhaW5lcj4gaXMgcmVwcmVzZW50ZWQgYnkgdGhlIG51bWJlciBvZlxuICAgICAgICAvLyB0b3AtbGV2ZWwgbm9kZXMuIFRoaXMgaW5mb3JtYXRpb24gaXMgbmVlZGVkIHRvIHNraXAgb3ZlclxuICAgICAgICAvLyB0aG9zZSBub2RlcyB0byByZWFjaCBhIGNvcnJlc3BvbmRpbmcgYW5jaG9yIG5vZGUgKGNvbW1lbnQgbm9kZSkuXG4gICAgICAgIG5naFtFTEVNRU5UX0NPTlRBSU5FUlNdID8/PSB7fTtcbiAgICAgICAgbmdoW0VMRU1FTlRfQ09OVEFJTkVSU11bbm9PZmZzZXRJbmRleF0gPSBjYWxjTnVtUm9vdE5vZGVzKHRWaWV3LCBsVmlldywgdE5vZGUuY2hpbGQpO1xuICAgICAgfSBlbHNlIGlmICh0Tm9kZS50eXBlICYgVE5vZGVUeXBlLlByb2plY3Rpb24pIHtcbiAgICAgICAgLy8gQ3VycmVudCBUTm9kZSByZXByZXNlbnRzIGFuIGA8bmctY29udGVudD5gIHNsb3QsIHRodXMgaXQgaGFzIG5vXG4gICAgICAgIC8vIERPTSBlbGVtZW50cyBhc3NvY2lhdGVkIHdpdGggaXQsIHNvIHRoZSAqKm5leHQgc2libGluZyoqIG5vZGUgd291bGRcbiAgICAgICAgLy8gbm90IGJlIGFibGUgdG8gZmluZCBhbiBhbmNob3IuIEluIHRoaXMgY2FzZSwgdXNlIGZ1bGwgcGF0aCBpbnN0ZWFkLlxuICAgICAgICBsZXQgbmV4dFROb2RlID0gdE5vZGUubmV4dDtcbiAgICAgICAgLy8gU2tpcCBvdmVyIGFsbCBgPG5nLWNvbnRlbnQ+YCBzbG90cyBpbiBhIHJvdy5cbiAgICAgICAgd2hpbGUgKG5leHRUTm9kZSAhPT0gbnVsbCAmJiAobmV4dFROb2RlLnR5cGUgJiBUTm9kZVR5cGUuUHJvamVjdGlvbikpIHtcbiAgICAgICAgICBuZXh0VE5vZGUgPSBuZXh0VE5vZGUubmV4dDtcbiAgICAgICAgfVxuICAgICAgICBpZiAobmV4dFROb2RlICYmICFpc0luU2tpcEh5ZHJhdGlvbkJsb2NrKG5leHRUTm9kZSkpIHtcbiAgICAgICAgICAvLyBIYW5kbGUgYSB0Tm9kZSBhZnRlciB0aGUgYDxuZy1jb250ZW50PmAgc2xvdC5cbiAgICAgICAgICBhcHBlbmRTZXJpYWxpemVkTm9kZVBhdGgobmdoLCBuZXh0VE5vZGUsIGxWaWV3KTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gSGFuZGxlIGNhc2VzIHdoZXJlIHRleHQgbm9kZXMgY2FuIGJlIGxvc3QgYWZ0ZXIgRE9NIHNlcmlhbGl6YXRpb246XG4gICAgICAgIC8vICAxLiBXaGVuIHRoZXJlIGlzIGFuICplbXB0eSB0ZXh0IG5vZGUqIGluIERPTTogaW4gdGhpcyBjYXNlLCB0aGlzXG4gICAgICAgIC8vICAgICBub2RlIHdvdWxkIG5vdCBtYWtlIGl0IGludG8gdGhlIHNlcmlhbGl6ZWQgc3RyaW5nIGFuZCBhcyBhIHJlc3VsdCxcbiAgICAgICAgLy8gICAgIHRoaXMgbm9kZSB3b3VsZG4ndCBiZSBjcmVhdGVkIGluIGEgYnJvd3Nlci4gVGhpcyB3b3VsZCByZXN1bHQgaW5cbiAgICAgICAgLy8gICAgIGEgbWlzbWF0Y2ggZHVyaW5nIHRoZSBoeWRyYXRpb24sIHdoZXJlIHRoZSBydW50aW1lIGxvZ2ljIHdvdWxkIGV4cGVjdFxuICAgICAgICAvLyAgICAgYSB0ZXh0IG5vZGUgdG8gYmUgcHJlc2VudCBpbiBsaXZlIERPTSwgYnV0IG5vIHRleHQgbm9kZSB3b3VsZCBleGlzdC5cbiAgICAgICAgLy8gICAgIEV4YW1wbGU6IGA8c3Bhbj57eyBuYW1lIH19PC9zcGFuPmAgd2hlbiB0aGUgYG5hbWVgIGlzIGFuIGVtcHR5IHN0cmluZy5cbiAgICAgICAgLy8gICAgIFRoaXMgd291bGQgcmVzdWx0IGluIGA8c3Bhbj48L3NwYW4+YCBzdHJpbmcgYWZ0ZXIgc2VyaWFsaXphdGlvbiBhbmRcbiAgICAgICAgLy8gICAgIGluIGEgYnJvd3NlciBvbmx5IHRoZSBgc3BhbmAgZWxlbWVudCB3b3VsZCBiZSBjcmVhdGVkLiBUbyByZXNvbHZlIHRoYXQsXG4gICAgICAgIC8vICAgICBhbiBleHRyYSBjb21tZW50IG5vZGUgaXMgYXBwZW5kZWQgaW4gcGxhY2Ugb2YgYW4gZW1wdHkgdGV4dCBub2RlIGFuZFxuICAgICAgICAvLyAgICAgdGhhdCBzcGVjaWFsIGNvbW1lbnQgbm9kZSBpcyByZXBsYWNlZCB3aXRoIGFuIGVtcHR5IHRleHQgbm9kZSAqYmVmb3JlKlxuICAgICAgICAvLyAgICAgaHlkcmF0aW9uLlxuICAgICAgICAvLyAgMi4gV2hlbiB0aGVyZSBhcmUgMiBjb25zZWN1dGl2ZSB0ZXh0IG5vZGVzIHByZXNlbnQgaW4gdGhlIERPTS5cbiAgICAgICAgLy8gICAgIEV4YW1wbGU6IGA8ZGl2PkhlbGxvIDxuZy1jb250YWluZXIgKm5nSWY9XCJ0cnVlXCI+d29ybGQ8L25nLWNvbnRhaW5lcj48L2Rpdj5gLlxuICAgICAgICAvLyAgICAgSW4gdGhpcyBzY2VuYXJpbywgdGhlIGxpdmUgRE9NIHdvdWxkIGxvb2sgbGlrZSB0aGlzOlxuICAgICAgICAvLyAgICAgICA8ZGl2PiN0ZXh0KCdIZWxsbyAnKSAjdGV4dCgnd29ybGQnKSAjY29tbWVudCgnY29udGFpbmVyJyk8L2Rpdj5cbiAgICAgICAgLy8gICAgIFNlcmlhbGl6ZWQgc3RyaW5nIHdvdWxkIGxvb2sgbGlrZSB0aGlzOiBgPGRpdj5IZWxsbyB3b3JsZDwhLS1jb250YWluZXItLT48L2Rpdj5gLlxuICAgICAgICAvLyAgICAgVGhlIGxpdmUgRE9NIGluIGEgYnJvd3NlciBhZnRlciB0aGF0IHdvdWxkIGJlOlxuICAgICAgICAvLyAgICAgICA8ZGl2PiN0ZXh0KCdIZWxsbyB3b3JsZCcpICNjb21tZW50KCdjb250YWluZXInKTwvZGl2PlxuICAgICAgICAvLyAgICAgTm90aWNlIGhvdyAyIHRleHQgbm9kZXMgYXJlIG5vdyBcIm1lcmdlZFwiIGludG8gb25lLiBUaGlzIHdvdWxkIGNhdXNlIGh5ZHJhdGlvblxuICAgICAgICAvLyAgICAgbG9naWMgdG8gZmFpbCwgc2luY2UgaXQnZCBleHBlY3QgMiB0ZXh0IG5vZGVzIGJlaW5nIHByZXNlbnQsIG5vdCBvbmUuXG4gICAgICAgIC8vICAgICBUbyBmaXggdGhpcywgd2UgaW5zZXJ0IGEgc3BlY2lhbCBjb21tZW50IG5vZGUgaW4gYmV0d2VlbiB0aG9zZSB0ZXh0IG5vZGVzLCBzb1xuICAgICAgICAvLyAgICAgc2VyaWFsaXplZCByZXByZXNlbnRhdGlvbiBpczogYDxkaXY+SGVsbG8gPCEtLW5ndG5zLS0+d29ybGQ8IS0tY29udGFpbmVyLS0+PC9kaXY+YC5cbiAgICAgICAgLy8gICAgIFRoaXMgZm9yY2VzIGJyb3dzZXIgdG8gY3JlYXRlIDIgdGV4dCBub2RlcyBzZXBhcmF0ZWQgYnkgYSBjb21tZW50IG5vZGUuXG4gICAgICAgIC8vICAgICBCZWZvcmUgcnVubmluZyBhIGh5ZHJhdGlvbiBwcm9jZXNzLCB0aGlzIHNwZWNpYWwgY29tbWVudCBub2RlIGlzIHJlbW92ZWQsIHNvIHRoZVxuICAgICAgICAvLyAgICAgbGl2ZSBET00gaGFzIGV4YWN0bHkgdGhlIHNhbWUgc3RhdGUgYXMgaXQgd2FzIGJlZm9yZSBzZXJpYWxpemF0aW9uLlxuICAgICAgICBpZiAodE5vZGUudHlwZSAmIFROb2RlVHlwZS5UZXh0KSB7XG4gICAgICAgICAgY29uc3Qgck5vZGUgPSB1bndyYXBSTm9kZShsVmlld1tpXSkgYXMgSFRNTEVsZW1lbnQ7XG4gICAgICAgICAgaWYgKHJOb2RlLnRleHRDb250ZW50Py5yZXBsYWNlKC9cXHMvZ20sICcnKSA9PT0gJycpIHtcbiAgICAgICAgICAgIGNvbnRleHQuY29ycnVwdGVkVGV4dE5vZGVzLnNldChyTm9kZSwgVGV4dE5vZGVNYXJrZXIuRW1wdHlOb2RlKTtcbiAgICAgICAgICB9IGVsc2UgaWYgKHJOb2RlLm5leHRTaWJsaW5nPy5ub2RlVHlwZSA9PT0gTm9kZS5URVhUX05PREUpIHtcbiAgICAgICAgICAgIGNvbnRleHQuY29ycnVwdGVkVGV4dE5vZGVzLnNldChyTm9kZSwgVGV4dE5vZGVNYXJrZXIuU2VwYXJhdG9yKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodE5vZGUucHJvamVjdGlvbk5leHQgJiYgdE5vZGUucHJvamVjdGlvbk5leHQgIT09IHROb2RlLm5leHQgJiZcbiAgICAgICAgICAgICFpc0luU2tpcEh5ZHJhdGlvbkJsb2NrKHROb2RlLnByb2plY3Rpb25OZXh0KSkge1xuICAgICAgICAgIC8vIENoZWNrIGlmIHByb2plY3Rpb24gbmV4dCBpcyBub3QgdGhlIHNhbWUgYXMgbmV4dCwgaW4gd2hpY2ggY2FzZVxuICAgICAgICAgIC8vIHRoZSBub2RlIHdvdWxkIG5vdCBiZSBmb3VuZCBhdCBjcmVhdGlvbiB0aW1lIGF0IHJ1bnRpbWUgYW5kIHdlXG4gICAgICAgICAgLy8gbmVlZCB0byBwcm92aWRlIGEgbG9jYXRpb24gZm9yIHRoYXQgbm9kZS5cbiAgICAgICAgICBhcHBlbmRTZXJpYWxpemVkTm9kZVBhdGgobmdoLCB0Tm9kZS5wcm9qZWN0aW9uTmV4dCwgbFZpZXcpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBuZ2g7XG59XG5cbi8qKlxuICogRGV0ZXJtaW5lcyB3aGV0aGVyIGEgY29tcG9uZW50IGluc3RhbmNlIHRoYXQgaXMgcmVwcmVzZW50ZWRcbiAqIGJ5IGEgZ2l2ZW4gTFZpZXcgdXNlcyBgVmlld0VuY2Fwc3VsYXRpb24uU2hhZG93RG9tYC5cbiAqL1xuZnVuY3Rpb24gY29tcG9uZW50VXNlc1NoYWRvd0RvbUVuY2Fwc3VsYXRpb24obFZpZXc6IExWaWV3KTogYm9vbGVhbiB7XG4gIGNvbnN0IGluc3RhbmNlID0gbFZpZXdbQ09OVEVYVF07XG4gIHJldHVybiBpbnN0YW5jZT8uY29uc3RydWN0b3IgP1xuICAgICAgZ2V0Q29tcG9uZW50RGVmKGluc3RhbmNlLmNvbnN0cnVjdG9yKT8uZW5jYXBzdWxhdGlvbiA9PT0gVmlld0VuY2Fwc3VsYXRpb24uU2hhZG93RG9tIDpcbiAgICAgIGZhbHNlO1xufVxuXG4vKipcbiAqIEFubm90YXRlcyBjb21wb25lbnQgaG9zdCBlbGVtZW50IGZvciBoeWRyYXRpb246XG4gKiAtIGJ5IGVpdGhlciBhZGRpbmcgdGhlIGBuZ2hgIGF0dHJpYnV0ZSBhbmQgY29sbGVjdGluZyBoeWRyYXRpb24tcmVsYXRlZCBpbmZvXG4gKiAgIGZvciB0aGUgc2VyaWFsaXphdGlvbiBhbmQgdHJhbnNmZXJyaW5nIHRvIHRoZSBjbGllbnRcbiAqIC0gb3IgYnkgYWRkaW5nIHRoZSBgbmdTa2lwSHlkcmF0aW9uYCBhdHRyaWJ1dGUgaW4gY2FzZSBBbmd1bGFyIGRldGVjdHMgdGhhdFxuICogICBjb21wb25lbnQgY29udGVudHMgaXMgbm90IGNvbXBhdGlibGUgd2l0aCBoeWRyYXRpb24uXG4gKlxuICogQHBhcmFtIGVsZW1lbnQgVGhlIEhvc3QgZWxlbWVudCB0byBiZSBhbm5vdGF0ZWRcbiAqIEBwYXJhbSBsVmlldyBUaGUgYXNzb2NpYXRlZCBMVmlld1xuICogQHBhcmFtIGNvbnRleHQgVGhlIGh5ZHJhdGlvbiBjb250ZXh0XG4gKi9cbmZ1bmN0aW9uIGFubm90YXRlSG9zdEVsZW1lbnRGb3JIeWRyYXRpb24oXG4gICAgZWxlbWVudDogUkVsZW1lbnQsIGxWaWV3OiBMVmlldywgY29udGV4dDogSHlkcmF0aW9uQ29udGV4dCk6IHZvaWQge1xuICBjb25zdCByZW5kZXJlciA9IGxWaWV3W1JFTkRFUkVSXTtcbiAgaWYgKChsVmlld1tGTEFHU10gJiBMVmlld0ZsYWdzLkhhc0kxOG4pID09PSBMVmlld0ZsYWdzLkhhc0kxOG4gfHxcbiAgICAgIGNvbXBvbmVudFVzZXNTaGFkb3dEb21FbmNhcHN1bGF0aW9uKGxWaWV3KSkge1xuICAgIC8vIEF0dGFjaCB0aGUgc2tpcCBoeWRyYXRpb24gYXR0cmlidXRlIGlmIHRoaXMgY29tcG9uZW50OlxuICAgIC8vIC0gZWl0aGVyIGhhcyBpMThuIGJsb2Nrcywgc2luY2UgaHlkcmF0aW5nIHN1Y2ggYmxvY2tzIGlzIG5vdCB5ZXQgc3VwcG9ydGVkXG4gICAgLy8gLSBvciB1c2VzIFNoYWRvd0RvbSB2aWV3IGVuY2Fwc3VsYXRpb24sIHNpbmNlIERvbWlubyBkb2Vzbid0IHN1cHBvcnRcbiAgICAvLyAgIHNoYWRvdyBET00sIHNvIHdlIGNhbiBub3QgZ3VhcmFudGVlIHRoYXQgY2xpZW50IGFuZCBzZXJ2ZXIgcmVwcmVzZW50YXRpb25zXG4gICAgLy8gICB3b3VsZCBleGFjdGx5IG1hdGNoXG4gICAgcmVuZGVyZXIuc2V0QXR0cmlidXRlKGVsZW1lbnQsIFNLSVBfSFlEUkFUSU9OX0FUVFJfTkFNRSwgJycpO1xuICB9IGVsc2Uge1xuICAgIGNvbnN0IG5naCA9IHNlcmlhbGl6ZUxWaWV3KGxWaWV3LCBjb250ZXh0KTtcbiAgICBjb25zdCBpbmRleCA9IGNvbnRleHQuc2VyaWFsaXplZFZpZXdDb2xsZWN0aW9uLmFkZChuZ2gpO1xuICAgIHJlbmRlcmVyLnNldEF0dHJpYnV0ZShlbGVtZW50LCBOR0hfQVRUUl9OQU1FLCBpbmRleC50b1N0cmluZygpKTtcbiAgfVxufVxuXG4vKipcbiAqIFBoeXNpY2FsbHkgaW5zZXJ0cyB0aGUgY29tbWVudCBub2RlcyB0byBlbnN1cmUgZW1wdHkgdGV4dCBub2RlcyBhbmQgYWRqYWNlbnRcbiAqIHRleHQgbm9kZSBzZXBhcmF0b3JzIGFyZSBwcmVzZXJ2ZWQgYWZ0ZXIgc2VydmVyIHNlcmlhbGl6YXRpb24gb2YgdGhlIERPTS5cbiAqIFRoZXNlIGdldCBzd2FwcGVkIGJhY2sgZm9yIGVtcHR5IHRleHQgbm9kZXMgb3Igc2VwYXJhdG9ycyBvbmNlIGh5ZHJhdGlvbiBoYXBwZW5zXG4gKiBvbiB0aGUgY2xpZW50LlxuICpcbiAqIEBwYXJhbSBjb3JydXB0ZWRUZXh0Tm9kZXMgVGhlIE1hcCBvZiB0ZXh0IG5vZGVzIHRvIGJlIHJlcGxhY2VkIHdpdGggY29tbWVudHNcbiAqIEBwYXJhbSBkb2MgVGhlIGRvY3VtZW50XG4gKi9cbmZ1bmN0aW9uIGluc2VydENvcnJ1cHRlZFRleHROb2RlTWFya2VycyhcbiAgICBjb3JydXB0ZWRUZXh0Tm9kZXM6IE1hcDxIVE1MRWxlbWVudCwgc3RyaW5nPiwgZG9jOiBEb2N1bWVudCkge1xuICBmb3IgKGNvbnN0IFt0ZXh0Tm9kZSwgbWFya2VyXSBvZiBjb3JydXB0ZWRUZXh0Tm9kZXMpIHtcbiAgICB0ZXh0Tm9kZS5hZnRlcihkb2MuY3JlYXRlQ29tbWVudChtYXJrZXIpKTtcbiAgfVxufVxuXG4vKipcbiAqIERldGVjdHMgd2hldGhlciBhIGdpdmVuIFROb2RlIHJlcHJlc2VudHMgYSBub2RlIHRoYXRcbiAqIGlzIGJlaW5nIGNvbnRlbnQgcHJvamVjdGVkLlxuICovXG5mdW5jdGlvbiBpc0NvbnRlbnRQcm9qZWN0ZWROb2RlKHROb2RlOiBUTm9kZSk6IGJvb2xlYW4ge1xuICBsZXQgY3VycmVudFROb2RlID0gdE5vZGU7XG4gIHdoaWxlIChjdXJyZW50VE5vZGUgIT0gbnVsbCkge1xuICAgIC8vIElmIHdlIGNvbWUgYWNyb3NzIGEgY29tcG9uZW50IGhvc3Qgbm9kZSBpbiBwYXJlbnQgbm9kZXMgLVxuICAgIC8vIHRoaXMgVE5vZGUgaXMgaW4gdGhlIGNvbnRlbnQgcHJvamVjdGlvbiBzZWN0aW9uLlxuICAgIGlmIChpc0NvbXBvbmVudEhvc3QoY3VycmVudFROb2RlKSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIGN1cnJlbnRUTm9kZSA9IGN1cnJlbnRUTm9kZS5wYXJlbnQgYXMgVE5vZGU7XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG4vKipcbiAqIENoZWNrIHdoZXRoZXIgYSBnaXZlbiBub2RlIGV4aXN0cywgYnV0IGlzIGRpc2Nvbm5lY3RlZCBmcm9tIHRoZSBET00uXG4gKlxuICogTm90ZTogd2UgbGV2ZXJhZ2UgdGhlIGZhY3QgdGhhdCB3ZSBoYXZlIHRoaXMgaW5mb3JtYXRpb24gYXZhaWxhYmxlIGluIHRoZSBET00gZW11bGF0aW9uXG4gKiBsYXllciAoaW4gRG9taW5vKSBmb3Igbm93LiBMb25nZXItdGVybSBzb2x1dGlvbiBzaG91bGQgbm90IHJlbHkgb24gdGhlIERPTSBlbXVsYXRpb24gYW5kXG4gKiBvbmx5IHVzZSBpbnRlcm5hbCBkYXRhIHN0cnVjdHVyZXMgYW5kIHN0YXRlIHRvIGNvbXB1dGUgdGhpcyBpbmZvcm1hdGlvbi5cbiAqL1xuZnVuY3Rpb24gaXNEaXNjb25uZWN0ZWROb2RlKHROb2RlOiBUTm9kZSwgbFZpZXc6IExWaWV3KSB7XG4gIHJldHVybiAhKHROb2RlLnR5cGUgJiBUTm9kZVR5cGUuUHJvamVjdGlvbikgJiYgISFsVmlld1t0Tm9kZS5pbmRleF0gJiZcbiAgICAgICEodW53cmFwUk5vZGUobFZpZXdbdE5vZGUuaW5kZXhdKSBhcyBOb2RlKS5pc0Nvbm5lY3RlZDtcbn1cbiJdfQ==