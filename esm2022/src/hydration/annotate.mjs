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
    const allSerializedViews = serializedViewCollection.getAll();
    if (allSerializedViews.length > 0) {
        const transferState = appRef.injector.get(TransferState);
        transferState.set(NGH_DATA_KEY, allSerializedViews);
    }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYW5ub3RhdGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9oeWRyYXRpb24vYW5ub3RhdGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBR0gsT0FBTyxFQUFDLGlCQUFpQixFQUFDLE1BQU0sYUFBYSxDQUFDO0FBQzlDLE9BQU8sRUFBQyxrQkFBa0IsRUFBQyxNQUFNLGlDQUFpQyxDQUFDO0FBQ25FLE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUN0RCxPQUFPLEVBQUMsdUJBQXVCLEVBQWEsTUFBTSxpQ0FBaUMsQ0FBQztBQUdwRixPQUFPLEVBQUMsZUFBZSxFQUFFLFlBQVksRUFBRSxpQkFBaUIsRUFBRSxVQUFVLEVBQUMsTUFBTSxtQ0FBbUMsQ0FBQztBQUMvRyxPQUFPLEVBQUMsT0FBTyxFQUFFLEtBQUssRUFBRSxhQUFhLEVBQUUsSUFBSSxFQUFxQixRQUFRLEVBQVMsS0FBSyxFQUFZLE1BQU0sNEJBQTRCLENBQUM7QUFDckksT0FBTyxFQUFDLFdBQVcsRUFBQyxNQUFNLDRCQUE0QixDQUFDO0FBQ3ZELE9BQU8sRUFBQyxhQUFhLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUVoRCxPQUFPLEVBQUMsK0JBQStCLEVBQUMsTUFBTSxrQkFBa0IsQ0FBQztBQUNqRSxPQUFPLEVBQUMsVUFBVSxFQUFFLGtCQUFrQixFQUFFLGtCQUFrQixFQUFFLFVBQVUsRUFBRSxLQUFLLEVBQUUsY0FBYyxFQUEyQyxXQUFXLEVBQUUsU0FBUyxFQUFDLE1BQU0sY0FBYyxDQUFDO0FBQ3BMLE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUNwRCxPQUFPLEVBQUMsc0JBQXNCLEVBQUUsd0JBQXdCLEVBQUMsTUFBTSxrQkFBa0IsQ0FBQztBQUNsRixPQUFPLEVBQUMsNkJBQTZCLEVBQUUsYUFBYSxFQUFFLFlBQVksRUFBaUIsTUFBTSxTQUFTLENBQUM7QUFFbkc7Ozs7O0dBS0c7QUFDSCxNQUFNLHdCQUF3QjtJQUE5QjtRQUNVLFVBQUssR0FBcUIsRUFBRSxDQUFDO1FBQzdCLG1CQUFjLEdBQUcsSUFBSSxHQUFHLEVBQWtCLENBQUM7SUFnQnJELENBQUM7SUFkQyxHQUFHLENBQUMsY0FBOEI7UUFDaEMsTUFBTSxZQUFZLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxjQUFjLENBQUMsQ0FBQztRQUNwRCxJQUFJLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsWUFBWSxDQUFDLEVBQUU7WUFDMUMsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUM7WUFDaEMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUM7WUFDaEMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsWUFBWSxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQzdDLE9BQU8sS0FBSyxDQUFDO1NBQ2Q7UUFDRCxPQUFPLElBQUksQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLFlBQVksQ0FBRSxDQUFDO0lBQ2hELENBQUM7SUFFRCxNQUFNO1FBQ0osT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDO0lBQ3BCLENBQUM7Q0FDRjtBQUVEOzs7R0FHRztBQUNILElBQUksVUFBVSxHQUFHLENBQUMsQ0FBQztBQUVuQjs7Ozs7OztHQU9HO0FBQ0gsU0FBUyxRQUFRLENBQUMsS0FBWTtJQUM1QixJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssRUFBRTtRQUNoQixLQUFLLENBQUMsS0FBSyxHQUFHLElBQUksVUFBVSxFQUFFLEVBQUUsQ0FBQztLQUNsQztJQUNELE9BQU8sS0FBSyxDQUFDLEtBQUssQ0FBQztBQUNyQixDQUFDO0FBWUQ7OztHQUdHO0FBQ0gsU0FBUyxnQkFBZ0IsQ0FBQyxLQUFZLEVBQUUsS0FBWSxFQUFFLEtBQWlCO0lBQ3JFLE1BQU0sU0FBUyxHQUFjLEVBQUUsQ0FBQztJQUNoQyxrQkFBa0IsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxTQUFTLENBQUMsQ0FBQztJQUNuRCxPQUFPLFNBQVMsQ0FBQyxNQUFNLENBQUM7QUFDMUIsQ0FBQztBQUVEOzs7Ozs7R0FNRztBQUNILE1BQU0sVUFBVSxvQkFBb0IsQ0FBQyxNQUFzQixFQUFFLEdBQWE7SUFDeEUsTUFBTSx3QkFBd0IsR0FBRyxJQUFJLHdCQUF3QixFQUFFLENBQUM7SUFDaEUsTUFBTSxrQkFBa0IsR0FBRyxJQUFJLEdBQUcsRUFBK0IsQ0FBQztJQUNsRSxNQUFNLFFBQVEsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDO0lBQy9CLEtBQUssTUFBTSxPQUFPLElBQUksUUFBUSxFQUFFO1FBQzlCLE1BQU0sS0FBSyxHQUFHLDZCQUE2QixDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ3JELHVEQUF1RDtRQUN2RCwyQ0FBMkM7UUFDM0MsSUFBSSxLQUFLLEtBQUssSUFBSSxFQUFFO1lBQ2xCLE1BQU0sV0FBVyxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNoQyw4RUFBOEU7WUFDOUUsbUVBQW1FO1lBQ25FLElBQUksV0FBVyxJQUFJLENBQUUsV0FBMkIsQ0FBQyxZQUFZLENBQUMsd0JBQXdCLENBQUMsRUFBRTtnQkFDdkYsTUFBTSxPQUFPLEdBQXFCO29CQUNoQyx3QkFBd0I7b0JBQ3hCLGtCQUFrQjtpQkFDbkIsQ0FBQztnQkFDRiwrQkFBK0IsQ0FBQyxXQUEwQixFQUFFLEtBQUssRUFBRSxPQUFPLENBQUMsQ0FBQztnQkFDNUUsOEJBQThCLENBQUMsa0JBQWtCLEVBQUUsR0FBRyxDQUFDLENBQUM7YUFDekQ7U0FDRjtLQUNGO0lBQ0QsTUFBTSxrQkFBa0IsR0FBRyx3QkFBd0IsQ0FBQyxNQUFNLEVBQUUsQ0FBQztJQUM3RCxJQUFJLGtCQUFrQixDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7UUFDakMsTUFBTSxhQUFhLEdBQUcsTUFBTSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUFDLENBQUM7UUFDekQsYUFBYSxDQUFDLEdBQUcsQ0FBQyxZQUFZLEVBQUUsa0JBQWtCLENBQUMsQ0FBQztLQUNyRDtBQUNILENBQUM7QUFFRDs7Ozs7OztHQU9HO0FBQ0gsU0FBUyxtQkFBbUIsQ0FDeEIsVUFBc0IsRUFBRSxPQUF5QjtJQUNuRCxNQUFNLEtBQUssR0FBOEIsRUFBRSxDQUFDO0lBQzVDLElBQUksZ0JBQWdCLEdBQVcsRUFBRSxDQUFDO0lBRWxDLEtBQUssSUFBSSxDQUFDLEdBQUcsdUJBQXVCLEVBQUUsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7UUFDaEUsSUFBSSxVQUFVLEdBQUcsVUFBVSxDQUFDLENBQUMsQ0FBVSxDQUFDO1FBRXhDLHFFQUFxRTtRQUNyRSwrREFBK0Q7UUFDL0QsSUFBSSxVQUFVLENBQUMsVUFBVSxDQUFDLEVBQUU7WUFDMUIsVUFBVSxHQUFHLFVBQVUsQ0FBQyxhQUFhLENBQUMsQ0FBQztTQUN4QztRQUNELE1BQU0sVUFBVSxHQUFHLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUVyQyxJQUFJLFFBQWdCLENBQUM7UUFDckIsSUFBSSxZQUFZLEdBQUcsQ0FBQyxDQUFDO1FBQ3JCLElBQUksVUFBVSxDQUFDLElBQUksZ0NBQXdCLEVBQUU7WUFDM0MsUUFBUSxHQUFHLFVBQVUsQ0FBQyxLQUFNLENBQUM7WUFFN0Isd0VBQXdFO1lBQ3hFLGlFQUFpRTtZQUNqRSxZQUFZLEdBQUcsQ0FBQyxDQUFDO1NBQ2xCO2FBQU07WUFDTCxRQUFRLEdBQUcsUUFBUSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQ2hDLFlBQVksR0FBRyxnQkFBZ0IsQ0FBQyxVQUFVLEVBQUUsVUFBVSxFQUFFLFVBQVUsQ0FBQyxVQUFVLENBQUMsQ0FBQztTQUNoRjtRQUVELE1BQU0sSUFBSSxHQUE0QjtZQUNwQyxDQUFDLFdBQVcsQ0FBQyxFQUFFLFFBQVE7WUFDdkIsQ0FBQyxjQUFjLENBQUMsRUFBRSxZQUFZO1lBQzlCLEdBQUcsY0FBYyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQVUsRUFBRSxPQUFPLENBQUM7U0FDbkQsQ0FBQztRQUVGLHFFQUFxRTtRQUNyRSwwRUFBMEU7UUFDMUUsd0RBQXdEO1FBQ3hELE1BQU0sbUJBQW1CLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNqRCxJQUFJLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxJQUFJLG1CQUFtQixLQUFLLGdCQUFnQixFQUFFO1lBQ2hFLE1BQU0sWUFBWSxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQzdDLFlBQVksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDL0IsWUFBWSxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUM7U0FDNUI7YUFBTTtZQUNMLDJDQUEyQztZQUMzQyxnQkFBZ0IsR0FBRyxtQkFBbUIsQ0FBQztZQUN2QyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1NBQ2xCO0tBQ0Y7SUFDRCxPQUFPLEtBQUssQ0FBQztBQUNmLENBQUM7QUFFRDs7OztHQUlHO0FBQ0gsU0FBUyx3QkFBd0IsQ0FBQyxHQUFtQixFQUFFLEtBQVksRUFBRSxLQUFZO0lBQy9FLE1BQU0sYUFBYSxHQUFHLEtBQUssQ0FBQyxLQUFLLEdBQUcsYUFBYSxDQUFDO0lBQ2xELEdBQUcsQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFLENBQUM7SUFDbEIsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLGFBQWEsQ0FBQyxHQUFHLGVBQWUsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7QUFDNUQsQ0FBQztBQUVEOzs7O0dBSUc7QUFDSCxTQUFTLDJCQUEyQixDQUFDLEdBQW1CLEVBQUUsS0FBWTtJQUNwRSxNQUFNLGFBQWEsR0FBRyxLQUFLLENBQUMsS0FBSyxHQUFHLGFBQWEsQ0FBQztJQUNsRCxHQUFHLENBQUMsa0JBQWtCLENBQUMsS0FBSyxFQUFFLENBQUM7SUFDL0IsSUFBSSxDQUFDLEdBQUcsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxhQUFhLENBQUMsRUFBRTtRQUNwRCxHQUFHLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUM7S0FDN0M7QUFDSCxDQUFDO0FBRUQ7Ozs7Ozs7O0dBUUc7QUFDSCxTQUFTLGNBQWMsQ0FBQyxLQUFZLEVBQUUsT0FBeUI7SUFDN0QsTUFBTSxHQUFHLEdBQW1CLEVBQUUsQ0FBQztJQUMvQixNQUFNLEtBQUssR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDM0IsbURBQW1EO0lBQ25ELEtBQUssSUFBSSxDQUFDLEdBQUcsYUFBYSxFQUFFLENBQUMsR0FBRyxLQUFLLENBQUMsaUJBQWlCLEVBQUUsQ0FBQyxFQUFFLEVBQUU7UUFDNUQsTUFBTSxLQUFLLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQVUsQ0FBQztRQUNyQyxNQUFNLGFBQWEsR0FBRyxDQUFDLEdBQUcsYUFBYSxDQUFDO1FBQ3hDLG9FQUFvRTtRQUNwRSxzRUFBc0U7UUFDdEUseUVBQXlFO1FBQ3pFLDJDQUEyQztRQUMzQyxJQUFJLENBQUMsS0FBSyxFQUFFO1lBQ1YsU0FBUztTQUNWO1FBRUQsMEZBQTBGO1FBQzFGLHVGQUF1RjtRQUN2Rix3RkFBd0Y7UUFDeEYsRUFBRTtRQUNGLHlGQUF5RjtRQUN6RixrRkFBa0Y7UUFDbEYsMERBQTBEO1FBQzFELElBQUksa0JBQWtCLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxJQUFJLHNCQUFzQixDQUFDLEtBQUssQ0FBQyxFQUFFO1lBQ3JFLDJCQUEyQixDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUN4QyxTQUFTO1NBQ1Y7UUFDRCxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxFQUFFO1lBQ25DLEtBQUssTUFBTSxtQkFBbUIsSUFBSSxLQUFLLENBQUMsVUFBVSxFQUFFO2dCQUNsRCwwREFBMEQ7Z0JBQzFELElBQUksQ0FBQyxtQkFBbUI7b0JBQUUsU0FBUztnQkFFbkMsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsbUJBQW1CLENBQUMsRUFBRTtvQkFDdkMsMERBQTBEO29CQUMxRCxxRUFBcUU7b0JBQ3JFLHVFQUF1RTtvQkFDdkUsOENBQThDO29CQUM5QyxJQUFJLENBQUMsaUJBQWlCLENBQUMsbUJBQW1CLENBQUM7d0JBQ3ZDLENBQUMsc0JBQXNCLENBQUMsbUJBQW1CLENBQUMsRUFBRTt3QkFDaEQsSUFBSSxrQkFBa0IsQ0FBQyxtQkFBbUIsRUFBRSxLQUFLLENBQUMsRUFBRTs0QkFDbEQsa0VBQWtFOzRCQUNsRSw4REFBOEQ7NEJBQzlELGtEQUFrRDs0QkFDbEQsaUNBQWlDOzRCQUNqQywyQkFBMkIsQ0FBQyxHQUFHLEVBQUUsbUJBQW1CLENBQUMsQ0FBQzt5QkFDdkQ7NkJBQU07NEJBQ0wsd0JBQXdCLENBQUMsR0FBRyxFQUFFLG1CQUFtQixFQUFFLEtBQUssQ0FBQyxDQUFDO3lCQUMzRDtxQkFDRjtpQkFDRjtxQkFBTTtvQkFDTCx1RUFBdUU7b0JBQ3ZFLHlFQUF5RTtvQkFDekUsZ0ZBQWdGO29CQUNoRixFQUFFO29CQUNGLDJFQUEyRTtvQkFDM0Usc0VBQXNFO29CQUN0RSw2RUFBNkU7b0JBQzdFLHFEQUFxRDtvQkFFckQsTUFBTSwrQkFBK0IsQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztpQkFDOUQ7YUFDRjtTQUNGO1FBQ0QsSUFBSSxZQUFZLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUU7WUFDMUIsMENBQTBDO1lBQzFDLE1BQU0sYUFBYSxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUM7WUFDbEMsSUFBSSxhQUFhLEtBQUssSUFBSSxFQUFFO2dCQUMxQixHQUFHLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBRSxDQUFDO2dCQUN0QixHQUFHLENBQUMsU0FBUyxDQUFDLENBQUMsYUFBYSxDQUFDLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxDQUFDO2FBQ3pEO1lBRUQsMENBQTBDO1lBQzFDLE1BQU0sUUFBUSxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUUsQ0FBQyxDQUFFLDhCQUE4QjtZQUVqRSw4Q0FBOEM7WUFDOUMsc0JBQXNCO1lBQ3RCLHdEQUF3RDtZQUN4RCxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLEVBQUU7Z0JBQzNCLGdEQUFnRDtnQkFDaEQsTUFBTSxVQUFVLEdBQUcsV0FBVyxDQUFDLFFBQWlCLENBQWEsQ0FBQztnQkFDOUQsSUFBSSxDQUFFLFVBQTBCLENBQUMsWUFBWSxDQUFDLHdCQUF3QixDQUFDLEVBQUU7b0JBQ3ZFLCtCQUErQixDQUFDLFVBQVUsRUFBRSxRQUFpQixFQUFFLE9BQU8sQ0FBQyxDQUFDO2lCQUN6RTthQUNGO1lBQ0QsR0FBRyxDQUFDLFVBQVUsQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUN2QixHQUFHLENBQUMsVUFBVSxDQUFDLENBQUMsYUFBYSxDQUFDLEdBQUcsbUJBQW1CLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1NBQ3pFO2FBQU0sSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFO1lBQ2xDLHVFQUF1RTtZQUN2RSxNQUFNLFVBQVUsR0FBRyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBRSxDQUFDLENBQUM7WUFDaEQsSUFBSSxDQUFFLFVBQTBCLENBQUMsWUFBWSxDQUFDLHdCQUF3QixDQUFDLEVBQUU7Z0JBQ3ZFLCtCQUErQixDQUFDLFVBQXNCLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLE9BQU8sQ0FBQyxDQUFDO2FBQzVFO1NBQ0Y7YUFBTTtZQUNMLHNCQUFzQjtZQUN0QixJQUFJLEtBQUssQ0FBQyxJQUFJLHFDQUE2QixFQUFFO2dCQUMzQyxvREFBb0Q7Z0JBQ3BELDJEQUEyRDtnQkFDM0QsbUVBQW1FO2dCQUNuRSxHQUFHLENBQUMsa0JBQWtCLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBQy9CLEdBQUcsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxHQUFHLGdCQUFnQixDQUFDLEtBQUssRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO2FBQ3RGO2lCQUFNLElBQUksS0FBSyxDQUFDLElBQUksZ0NBQXVCLEVBQUU7Z0JBQzVDLGtFQUFrRTtnQkFDbEUsc0VBQXNFO2dCQUN0RSxzRUFBc0U7Z0JBQ3RFLElBQUksU0FBUyxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUM7Z0JBQzNCLCtDQUErQztnQkFDL0MsT0FBTyxTQUFTLEtBQUssSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZ0NBQXVCLENBQUMsRUFBRTtvQkFDcEUsU0FBUyxHQUFHLFNBQVMsQ0FBQyxJQUFJLENBQUM7aUJBQzVCO2dCQUNELElBQUksU0FBUyxJQUFJLENBQUMsc0JBQXNCLENBQUMsU0FBUyxDQUFDLEVBQUU7b0JBQ25ELGdEQUFnRDtvQkFDaEQsd0JBQXdCLENBQUMsR0FBRyxFQUFFLFNBQVMsRUFBRSxLQUFLLENBQUMsQ0FBQztpQkFDakQ7YUFDRjtpQkFBTTtnQkFDTCxxRUFBcUU7Z0JBQ3JFLG9FQUFvRTtnQkFDcEUseUVBQXlFO2dCQUN6RSx1RUFBdUU7Z0JBQ3ZFLDRFQUE0RTtnQkFDNUUsMkVBQTJFO2dCQUMzRSw2RUFBNkU7Z0JBQzdFLDBFQUEwRTtnQkFDMUUsOEVBQThFO2dCQUM5RSwyRUFBMkU7Z0JBQzNFLDZFQUE2RTtnQkFDN0UsaUJBQWlCO2dCQUNqQixrRUFBa0U7Z0JBQ2xFLG1GQUFtRjtnQkFDbkYsMkRBQTJEO2dCQUMzRCx3RUFBd0U7Z0JBQ3hFLHdGQUF3RjtnQkFDeEYscURBQXFEO2dCQUNyRCw4REFBOEQ7Z0JBQzlELG9GQUFvRjtnQkFDcEYsNEVBQTRFO2dCQUM1RSxvRkFBb0Y7Z0JBQ3BGLDBGQUEwRjtnQkFDMUYsOEVBQThFO2dCQUM5RSx1RkFBdUY7Z0JBQ3ZGLDBFQUEwRTtnQkFDMUUsSUFBSSxLQUFLLENBQUMsSUFBSSx5QkFBaUIsRUFBRTtvQkFDL0IsTUFBTSxLQUFLLEdBQUcsV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBZ0IsQ0FBQztvQkFDbkQsSUFBSSxLQUFLLENBQUMsV0FBVyxFQUFFLE9BQU8sQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLEtBQUssRUFBRSxFQUFFO3dCQUNqRCxPQUFPLENBQUMsa0JBQWtCLENBQUMsR0FBRyxDQUFDLEtBQUsseUNBQTJCLENBQUM7cUJBQ2pFO3lCQUFNLElBQUksS0FBSyxDQUFDLFdBQVcsRUFBRSxRQUFRLEtBQUssSUFBSSxDQUFDLFNBQVMsRUFBRTt3QkFDekQsT0FBTyxDQUFDLGtCQUFrQixDQUFDLEdBQUcsQ0FBQyxLQUFLLHlDQUEyQixDQUFDO3FCQUNqRTtpQkFDRjtnQkFFRCxJQUFJLEtBQUssQ0FBQyxjQUFjLElBQUksS0FBSyxDQUFDLGNBQWMsS0FBSyxLQUFLLENBQUMsSUFBSTtvQkFDM0QsQ0FBQyxzQkFBc0IsQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLEVBQUU7b0JBQ2pELGtFQUFrRTtvQkFDbEUsaUVBQWlFO29CQUNqRSw0Q0FBNEM7b0JBQzVDLHdCQUF3QixDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsY0FBYyxFQUFFLEtBQUssQ0FBQyxDQUFDO2lCQUM1RDthQUNGO1NBQ0Y7S0FDRjtJQUNELE9BQU8sR0FBRyxDQUFDO0FBQ2IsQ0FBQztBQUVEOzs7R0FHRztBQUNILFNBQVMsbUNBQW1DLENBQUMsS0FBWTtJQUN2RCxNQUFNLFFBQVEsR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDaEMsT0FBTyxRQUFRLEVBQUUsV0FBVyxDQUFDLENBQUM7UUFDMUIsZUFBZSxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsRUFBRSxhQUFhLEtBQUssaUJBQWlCLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDdEYsS0FBSyxDQUFDO0FBQ1osQ0FBQztBQUVEOzs7Ozs7Ozs7O0dBVUc7QUFDSCxTQUFTLCtCQUErQixDQUNwQyxPQUFpQixFQUFFLEtBQVksRUFBRSxPQUF5QjtJQUM1RCxNQUFNLFFBQVEsR0FBRyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDakMsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsOEJBQXFCLENBQUMsZ0NBQXVCO1FBQzFELG1DQUFtQyxDQUFDLEtBQUssQ0FBQyxFQUFFO1FBQzlDLHlEQUF5RDtRQUN6RCw2RUFBNkU7UUFDN0UsdUVBQXVFO1FBQ3ZFLCtFQUErRTtRQUMvRSx3QkFBd0I7UUFDeEIsUUFBUSxDQUFDLFlBQVksQ0FBQyxPQUFPLEVBQUUsd0JBQXdCLEVBQUUsRUFBRSxDQUFDLENBQUM7S0FDOUQ7U0FBTTtRQUNMLE1BQU0sR0FBRyxHQUFHLGNBQWMsQ0FBQyxLQUFLLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDM0MsTUFBTSxLQUFLLEdBQUcsT0FBTyxDQUFDLHdCQUF3QixDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUN4RCxRQUFRLENBQUMsWUFBWSxDQUFDLE9BQU8sRUFBRSxhQUFhLEVBQUUsS0FBSyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7S0FDakU7QUFDSCxDQUFDO0FBRUQ7Ozs7Ozs7O0dBUUc7QUFDSCxTQUFTLDhCQUE4QixDQUNuQyxrQkFBNEMsRUFBRSxHQUFhO0lBQzdELEtBQUssTUFBTSxDQUFDLFFBQVEsRUFBRSxNQUFNLENBQUMsSUFBSSxrQkFBa0IsRUFBRTtRQUNuRCxRQUFRLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztLQUMzQztBQUNILENBQUM7QUFFRDs7O0dBR0c7QUFDSCxTQUFTLHNCQUFzQixDQUFDLEtBQVk7SUFDMUMsSUFBSSxZQUFZLEdBQUcsS0FBSyxDQUFDO0lBQ3pCLE9BQU8sWUFBWSxJQUFJLElBQUksRUFBRTtRQUMzQiw0REFBNEQ7UUFDNUQsbURBQW1EO1FBQ25ELElBQUksZUFBZSxDQUFDLFlBQVksQ0FBQyxFQUFFO1lBQ2pDLE9BQU8sSUFBSSxDQUFDO1NBQ2I7UUFDRCxZQUFZLEdBQUcsWUFBWSxDQUFDLE1BQWUsQ0FBQztLQUM3QztJQUNELE9BQU8sS0FBSyxDQUFDO0FBQ2YsQ0FBQztBQUVEOzs7Ozs7R0FNRztBQUNILFNBQVMsa0JBQWtCLENBQUMsS0FBWSxFQUFFLEtBQVk7SUFDcEQsT0FBTyxDQUFDLENBQUMsS0FBSyxDQUFDLElBQUksZ0NBQXVCLENBQUMsSUFBSSxDQUFDLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUM7UUFDL0QsQ0FBRSxXQUFXLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBVSxDQUFDLFdBQVcsQ0FBQztBQUM3RCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7QXBwbGljYXRpb25SZWZ9IGZyb20gJy4uL2FwcGxpY2F0aW9uX3JlZic7XG5pbXBvcnQge1ZpZXdFbmNhcHN1bGF0aW9ufSBmcm9tICcuLi9tZXRhZGF0YSc7XG5pbXBvcnQge2NvbGxlY3ROYXRpdmVOb2Rlc30gZnJvbSAnLi4vcmVuZGVyMy9jb2xsZWN0X25hdGl2ZV9ub2Rlcyc7XG5pbXBvcnQge2dldENvbXBvbmVudERlZn0gZnJvbSAnLi4vcmVuZGVyMy9kZWZpbml0aW9uJztcbmltcG9ydCB7Q09OVEFJTkVSX0hFQURFUl9PRkZTRVQsIExDb250YWluZXJ9IGZyb20gJy4uL3JlbmRlcjMvaW50ZXJmYWNlcy9jb250YWluZXInO1xuaW1wb3J0IHtUTm9kZSwgVE5vZGVUeXBlfSBmcm9tICcuLi9yZW5kZXIzL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge1JFbGVtZW50fSBmcm9tICcuLi9yZW5kZXIzL2ludGVyZmFjZXMvcmVuZGVyZXJfZG9tJztcbmltcG9ydCB7aXNDb21wb25lbnRIb3N0LCBpc0xDb250YWluZXIsIGlzUHJvamVjdGlvblROb2RlLCBpc1Jvb3RWaWV3fSBmcm9tICcuLi9yZW5kZXIzL2ludGVyZmFjZXMvdHlwZV9jaGVja3MnO1xuaW1wb3J0IHtDT05URVhULCBGTEFHUywgSEVBREVSX09GRlNFVCwgSE9TVCwgTFZpZXcsIExWaWV3RmxhZ3MsIFJFTkRFUkVSLCBUVmlldywgVFZJRVcsIFRWaWV3VHlwZX0gZnJvbSAnLi4vcmVuZGVyMy9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHt1bndyYXBSTm9kZX0gZnJvbSAnLi4vcmVuZGVyMy91dGlsL3ZpZXdfdXRpbHMnO1xuaW1wb3J0IHtUcmFuc2ZlclN0YXRlfSBmcm9tICcuLi90cmFuc2Zlcl9zdGF0ZSc7XG5cbmltcG9ydCB7dW5zdXBwb3J0ZWRQcm9qZWN0aW9uT2ZEb21Ob2Rlc30gZnJvbSAnLi9lcnJvcl9oYW5kbGluZyc7XG5pbXBvcnQge0NPTlRBSU5FUlMsIERJU0NPTk5FQ1RFRF9OT0RFUywgRUxFTUVOVF9DT05UQUlORVJTLCBNVUxUSVBMSUVSLCBOT0RFUywgTlVNX1JPT1RfTk9ERVMsIFNlcmlhbGl6ZWRDb250YWluZXJWaWV3LCBTZXJpYWxpemVkVmlldywgVEVNUExBVEVfSUQsIFRFTVBMQVRFU30gZnJvbSAnLi9pbnRlcmZhY2VzJztcbmltcG9ydCB7Y2FsY1BhdGhGb3JOb2RlfSBmcm9tICcuL25vZGVfbG9va3VwX3V0aWxzJztcbmltcG9ydCB7aXNJblNraXBIeWRyYXRpb25CbG9jaywgU0tJUF9IWURSQVRJT05fQVRUUl9OQU1FfSBmcm9tICcuL3NraXBfaHlkcmF0aW9uJztcbmltcG9ydCB7Z2V0Q29tcG9uZW50TFZpZXdGb3JIeWRyYXRpb24sIE5HSF9BVFRSX05BTUUsIE5HSF9EQVRBX0tFWSwgVGV4dE5vZGVNYXJrZXJ9IGZyb20gJy4vdXRpbHMnO1xuXG4vKipcbiAqIEEgY29sbGVjdGlvbiB0aGF0IHRyYWNrcyBhbGwgc2VyaWFsaXplZCB2aWV3cyAoYG5naGAgRE9NIGFubm90YXRpb25zKVxuICogdG8gYXZvaWQgZHVwbGljYXRpb24uIEFuIGF0dGVtcHQgdG8gYWRkIGEgZHVwbGljYXRlIHZpZXcgcmVzdWx0cyBpbiB0aGVcbiAqIGNvbGxlY3Rpb24gcmV0dXJuaW5nIHRoZSBpbmRleCBvZiB0aGUgcHJldmlvdXNseSBjb2xsZWN0ZWQgc2VyaWFsaXplZCB2aWV3LlxuICogVGhpcyByZWR1Y2VzIHRoZSBudW1iZXIgb2YgYW5ub3RhdGlvbnMgbmVlZGVkIGZvciBhIGdpdmVuIHBhZ2UuXG4gKi9cbmNsYXNzIFNlcmlhbGl6ZWRWaWV3Q29sbGVjdGlvbiB7XG4gIHByaXZhdGUgdmlld3M6IFNlcmlhbGl6ZWRWaWV3W10gPSBbXTtcbiAgcHJpdmF0ZSBpbmRleEJ5Q29udGVudCA9IG5ldyBNYXA8c3RyaW5nLCBudW1iZXI+KCk7XG5cbiAgYWRkKHNlcmlhbGl6ZWRWaWV3OiBTZXJpYWxpemVkVmlldyk6IG51bWJlciB7XG4gICAgY29uc3Qgdmlld0FzU3RyaW5nID0gSlNPTi5zdHJpbmdpZnkoc2VyaWFsaXplZFZpZXcpO1xuICAgIGlmICghdGhpcy5pbmRleEJ5Q29udGVudC5oYXModmlld0FzU3RyaW5nKSkge1xuICAgICAgY29uc3QgaW5kZXggPSB0aGlzLnZpZXdzLmxlbmd0aDtcbiAgICAgIHRoaXMudmlld3MucHVzaChzZXJpYWxpemVkVmlldyk7XG4gICAgICB0aGlzLmluZGV4QnlDb250ZW50LnNldCh2aWV3QXNTdHJpbmcsIGluZGV4KTtcbiAgICAgIHJldHVybiBpbmRleDtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuaW5kZXhCeUNvbnRlbnQuZ2V0KHZpZXdBc1N0cmluZykhO1xuICB9XG5cbiAgZ2V0QWxsKCk6IFNlcmlhbGl6ZWRWaWV3W10ge1xuICAgIHJldHVybiB0aGlzLnZpZXdzO1xuICB9XG59XG5cbi8qKlxuICogR2xvYmFsIGNvdW50ZXIgdGhhdCBpcyB1c2VkIHRvIGdlbmVyYXRlIGEgdW5pcXVlIGlkIGZvciBUVmlld3NcbiAqIGR1cmluZyB0aGUgc2VyaWFsaXphdGlvbiBwcm9jZXNzLlxuICovXG5sZXQgdFZpZXdTc3JJZCA9IDA7XG5cbi8qKlxuICogR2VuZXJhdGVzIGEgdW5pcXVlIGlkIGZvciBhIGdpdmVuIFRWaWV3IGFuZCByZXR1cm5zIHRoaXMgaWQuXG4gKiBUaGUgaWQgaXMgYWxzbyBzdG9yZWQgb24gdGhpcyBpbnN0YW5jZSBvZiBhIFRWaWV3IGFuZCByZXVzZWQgaW5cbiAqIHN1YnNlcXVlbnQgY2FsbHMuXG4gKlxuICogVGhpcyBpZCBpcyBuZWVkZWQgdG8gdW5pcXVlbHkgaWRlbnRpZnkgYW5kIHBpY2sgdXAgZGVoeWRyYXRlZCB2aWV3c1xuICogYXQgcnVudGltZS5cbiAqL1xuZnVuY3Rpb24gZ2V0U3NySWQodFZpZXc6IFRWaWV3KTogc3RyaW5nIHtcbiAgaWYgKCF0Vmlldy5zc3JJZCkge1xuICAgIHRWaWV3LnNzcklkID0gYHQke3RWaWV3U3NySWQrK31gO1xuICB9XG4gIHJldHVybiB0Vmlldy5zc3JJZDtcbn1cblxuLyoqXG4gKiBEZXNjcmliZXMgYSBjb250ZXh0IGF2YWlsYWJsZSBkdXJpbmcgdGhlIHNlcmlhbGl6YXRpb25cbiAqIHByb2Nlc3MuIFRoZSBjb250ZXh0IGlzIHVzZWQgdG8gc2hhcmUgYW5kIGNvbGxlY3QgaW5mb3JtYXRpb25cbiAqIGR1cmluZyB0aGUgc2VyaWFsaXphdGlvbi5cbiAqL1xuaW50ZXJmYWNlIEh5ZHJhdGlvbkNvbnRleHQge1xuICBzZXJpYWxpemVkVmlld0NvbGxlY3Rpb246IFNlcmlhbGl6ZWRWaWV3Q29sbGVjdGlvbjtcbiAgY29ycnVwdGVkVGV4dE5vZGVzOiBNYXA8SFRNTEVsZW1lbnQsIFRleHROb2RlTWFya2VyPjtcbn1cblxuLyoqXG4gKiBDb21wdXRlcyB0aGUgbnVtYmVyIG9mIHJvb3Qgbm9kZXMgaW4gYSBnaXZlbiB2aWV3XG4gKiAob3IgY2hpbGQgbm9kZXMgaW4gYSBnaXZlbiBjb250YWluZXIgaWYgYSB0Tm9kZSBpcyBwcm92aWRlZCkuXG4gKi9cbmZ1bmN0aW9uIGNhbGNOdW1Sb290Tm9kZXModFZpZXc6IFRWaWV3LCBsVmlldzogTFZpZXcsIHROb2RlOiBUTm9kZXxudWxsKTogbnVtYmVyIHtcbiAgY29uc3Qgcm9vdE5vZGVzOiB1bmtub3duW10gPSBbXTtcbiAgY29sbGVjdE5hdGl2ZU5vZGVzKHRWaWV3LCBsVmlldywgdE5vZGUsIHJvb3ROb2Rlcyk7XG4gIHJldHVybiByb290Tm9kZXMubGVuZ3RoO1xufVxuXG4vKipcbiAqIEFubm90YXRlcyBhbGwgY29tcG9uZW50cyBib290c3RyYXBwZWQgaW4gYSBnaXZlbiBBcHBsaWNhdGlvblJlZlxuICogd2l0aCBpbmZvIG5lZWRlZCBmb3IgaHlkcmF0aW9uLlxuICpcbiAqIEBwYXJhbSBhcHBSZWYgQW4gaW5zdGFuY2Ugb2YgYW4gQXBwbGljYXRpb25SZWYuXG4gKiBAcGFyYW0gZG9jIEEgcmVmZXJlbmNlIHRvIHRoZSBjdXJyZW50IERvY3VtZW50IGluc3RhbmNlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gYW5ub3RhdGVGb3JIeWRyYXRpb24oYXBwUmVmOiBBcHBsaWNhdGlvblJlZiwgZG9jOiBEb2N1bWVudCkge1xuICBjb25zdCBzZXJpYWxpemVkVmlld0NvbGxlY3Rpb24gPSBuZXcgU2VyaWFsaXplZFZpZXdDb2xsZWN0aW9uKCk7XG4gIGNvbnN0IGNvcnJ1cHRlZFRleHROb2RlcyA9IG5ldyBNYXA8SFRNTEVsZW1lbnQsIFRleHROb2RlTWFya2VyPigpO1xuICBjb25zdCB2aWV3UmVmcyA9IGFwcFJlZi5fdmlld3M7XG4gIGZvciAoY29uc3Qgdmlld1JlZiBvZiB2aWV3UmVmcykge1xuICAgIGNvbnN0IGxWaWV3ID0gZ2V0Q29tcG9uZW50TFZpZXdGb3JIeWRyYXRpb24odmlld1JlZik7XG4gICAgLy8gQW4gYGxWaWV3YCBtaWdodCBiZSBgbnVsbGAgaWYgYSBgVmlld1JlZmAgcmVwcmVzZW50c1xuICAgIC8vIGFuIGVtYmVkZGVkIHZpZXcgKG5vdCBhIGNvbXBvbmVudCB2aWV3KS5cbiAgICBpZiAobFZpZXcgIT09IG51bGwpIHtcbiAgICAgIGNvbnN0IGhvc3RFbGVtZW50ID0gbFZpZXdbSE9TVF07XG4gICAgICAvLyBSb290IGVsZW1lbnRzIG1pZ2h0IGFsc28gYmUgYW5ub3RhdGVkIHdpdGggdGhlIGBuZ1NraXBIeWRyYXRpb25gIGF0dHJpYnV0ZSxcbiAgICAgIC8vIGNoZWNrIGlmIGl0J3MgcHJlc2VudCBiZWZvcmUgc3RhcnRpbmcgdGhlIHNlcmlhbGl6YXRpb24gcHJvY2Vzcy5cbiAgICAgIGlmIChob3N0RWxlbWVudCAmJiAhKGhvc3RFbGVtZW50IGFzIEhUTUxFbGVtZW50KS5oYXNBdHRyaWJ1dGUoU0tJUF9IWURSQVRJT05fQVRUUl9OQU1FKSkge1xuICAgICAgICBjb25zdCBjb250ZXh0OiBIeWRyYXRpb25Db250ZXh0ID0ge1xuICAgICAgICAgIHNlcmlhbGl6ZWRWaWV3Q29sbGVjdGlvbixcbiAgICAgICAgICBjb3JydXB0ZWRUZXh0Tm9kZXMsXG4gICAgICAgIH07XG4gICAgICAgIGFubm90YXRlSG9zdEVsZW1lbnRGb3JIeWRyYXRpb24oaG9zdEVsZW1lbnQgYXMgSFRNTEVsZW1lbnQsIGxWaWV3LCBjb250ZXh0KTtcbiAgICAgICAgaW5zZXJ0Q29ycnVwdGVkVGV4dE5vZGVNYXJrZXJzKGNvcnJ1cHRlZFRleHROb2RlcywgZG9jKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgY29uc3QgYWxsU2VyaWFsaXplZFZpZXdzID0gc2VyaWFsaXplZFZpZXdDb2xsZWN0aW9uLmdldEFsbCgpO1xuICBpZiAoYWxsU2VyaWFsaXplZFZpZXdzLmxlbmd0aCA+IDApIHtcbiAgICBjb25zdCB0cmFuc2ZlclN0YXRlID0gYXBwUmVmLmluamVjdG9yLmdldChUcmFuc2ZlclN0YXRlKTtcbiAgICB0cmFuc2ZlclN0YXRlLnNldChOR0hfREFUQV9LRVksIGFsbFNlcmlhbGl6ZWRWaWV3cyk7XG4gIH1cbn1cblxuLyoqXG4gKiBTZXJpYWxpemVzIHRoZSBsQ29udGFpbmVyIGRhdGEgaW50byBhIGxpc3Qgb2YgU2VyaWFsaXplZFZpZXcgb2JqZWN0cyxcbiAqIHRoYXQgcmVwcmVzZW50IHZpZXdzIHdpdGhpbiB0aGlzIGxDb250YWluZXIuXG4gKlxuICogQHBhcmFtIGxDb250YWluZXIgdGhlIGxDb250YWluZXIgd2UgYXJlIHNlcmlhbGl6aW5nXG4gKiBAcGFyYW0gY29udGV4dCB0aGUgaHlkcmF0aW9uIGNvbnRleHRcbiAqIEByZXR1cm5zIGFuIGFycmF5IG9mIHRoZSBgU2VyaWFsaXplZFZpZXdgIG9iamVjdHNcbiAqL1xuZnVuY3Rpb24gc2VyaWFsaXplTENvbnRhaW5lcihcbiAgICBsQ29udGFpbmVyOiBMQ29udGFpbmVyLCBjb250ZXh0OiBIeWRyYXRpb25Db250ZXh0KTogU2VyaWFsaXplZENvbnRhaW5lclZpZXdbXSB7XG4gIGNvbnN0IHZpZXdzOiBTZXJpYWxpemVkQ29udGFpbmVyVmlld1tdID0gW107XG4gIGxldCBsYXN0Vmlld0FzU3RyaW5nOiBzdHJpbmcgPSAnJztcblxuICBmb3IgKGxldCBpID0gQ09OVEFJTkVSX0hFQURFUl9PRkZTRVQ7IGkgPCBsQ29udGFpbmVyLmxlbmd0aDsgaSsrKSB7XG4gICAgbGV0IGNoaWxkTFZpZXcgPSBsQ29udGFpbmVyW2ldIGFzIExWaWV3O1xuXG4gICAgLy8gSWYgdGhpcyBpcyBhIHJvb3QgdmlldywgZ2V0IGFuIExWaWV3IGZvciB0aGUgdW5kZXJseWluZyBjb21wb25lbnQsXG4gICAgLy8gYmVjYXVzZSBpdCBjb250YWlucyBpbmZvcm1hdGlvbiBhYm91dCB0aGUgdmlldyB0byBzZXJpYWxpemUuXG4gICAgaWYgKGlzUm9vdFZpZXcoY2hpbGRMVmlldykpIHtcbiAgICAgIGNoaWxkTFZpZXcgPSBjaGlsZExWaWV3W0hFQURFUl9PRkZTRVRdO1xuICAgIH1cbiAgICBjb25zdCBjaGlsZFRWaWV3ID0gY2hpbGRMVmlld1tUVklFV107XG5cbiAgICBsZXQgdGVtcGxhdGU6IHN0cmluZztcbiAgICBsZXQgbnVtUm9vdE5vZGVzID0gMDtcbiAgICBpZiAoY2hpbGRUVmlldy50eXBlID09PSBUVmlld1R5cGUuQ29tcG9uZW50KSB7XG4gICAgICB0ZW1wbGF0ZSA9IGNoaWxkVFZpZXcuc3NySWQhO1xuXG4gICAgICAvLyBUaGlzIGlzIGEgY29tcG9uZW50IHZpZXcsIHRodXMgaXQgaGFzIG9ubHkgMSByb290IG5vZGU6IHRoZSBjb21wb25lbnRcbiAgICAgIC8vIGhvc3Qgbm9kZSBpdHNlbGYgKG90aGVyIG5vZGVzIHdvdWxkIGJlIGluc2lkZSB0aGF0IGhvc3Qgbm9kZSkuXG4gICAgICBudW1Sb290Tm9kZXMgPSAxO1xuICAgIH0gZWxzZSB7XG4gICAgICB0ZW1wbGF0ZSA9IGdldFNzcklkKGNoaWxkVFZpZXcpO1xuICAgICAgbnVtUm9vdE5vZGVzID0gY2FsY051bVJvb3ROb2RlcyhjaGlsZFRWaWV3LCBjaGlsZExWaWV3LCBjaGlsZFRWaWV3LmZpcnN0Q2hpbGQpO1xuICAgIH1cblxuICAgIGNvbnN0IHZpZXc6IFNlcmlhbGl6ZWRDb250YWluZXJWaWV3ID0ge1xuICAgICAgW1RFTVBMQVRFX0lEXTogdGVtcGxhdGUsXG4gICAgICBbTlVNX1JPT1RfTk9ERVNdOiBudW1Sb290Tm9kZXMsXG4gICAgICAuLi5zZXJpYWxpemVMVmlldyhsQ29udGFpbmVyW2ldIGFzIExWaWV3LCBjb250ZXh0KSxcbiAgICB9O1xuXG4gICAgLy8gQ2hlY2sgaWYgdGhlIHByZXZpb3VzIHZpZXcgaGFzIHRoZSBzYW1lIHNoYXBlIChmb3IgZXhhbXBsZSwgaXQgd2FzXG4gICAgLy8gcHJvZHVjZWQgYnkgdGhlICpuZ0ZvciksIGluIHdoaWNoIGNhc2UgYnVtcCB0aGUgY291bnRlciBvbiB0aGUgcHJldmlvdXNcbiAgICAvLyB2aWV3IGluc3RlYWQgb2YgaW5jbHVkaW5nIHRoZSBzYW1lIGluZm9ybWF0aW9uIGFnYWluLlxuICAgIGNvbnN0IGN1cnJlbnRWaWV3QXNTdHJpbmcgPSBKU09OLnN0cmluZ2lmeSh2aWV3KTtcbiAgICBpZiAodmlld3MubGVuZ3RoID4gMCAmJiBjdXJyZW50Vmlld0FzU3RyaW5nID09PSBsYXN0Vmlld0FzU3RyaW5nKSB7XG4gICAgICBjb25zdCBwcmV2aW91c1ZpZXcgPSB2aWV3c1t2aWV3cy5sZW5ndGggLSAxXTtcbiAgICAgIHByZXZpb3VzVmlld1tNVUxUSVBMSUVSXSA/Pz0gMTtcbiAgICAgIHByZXZpb3VzVmlld1tNVUxUSVBMSUVSXSsrO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBSZWNvcmQgdGhpcyB2aWV3IGFzIG1vc3QgcmVjZW50bHkgYWRkZWQuXG4gICAgICBsYXN0Vmlld0FzU3RyaW5nID0gY3VycmVudFZpZXdBc1N0cmluZztcbiAgICAgIHZpZXdzLnB1c2godmlldyk7XG4gICAgfVxuICB9XG4gIHJldHVybiB2aWV3cztcbn1cblxuLyoqXG4gKiBIZWxwZXIgZnVuY3Rpb24gdG8gcHJvZHVjZSBhIG5vZGUgcGF0aCAod2hpY2ggbmF2aWdhdGlvbiBzdGVwcyBydW50aW1lIGxvZ2ljXG4gKiBuZWVkcyB0byB0YWtlIHRvIGxvY2F0ZSBhIG5vZGUpIGFuZCBzdG9yZXMgaXQgaW4gdGhlIGBOT0RFU2Agc2VjdGlvbiBvZiB0aGVcbiAqIGN1cnJlbnQgc2VyaWFsaXplZCB2aWV3LlxuICovXG5mdW5jdGlvbiBhcHBlbmRTZXJpYWxpemVkTm9kZVBhdGgobmdoOiBTZXJpYWxpemVkVmlldywgdE5vZGU6IFROb2RlLCBsVmlldzogTFZpZXcpIHtcbiAgY29uc3Qgbm9PZmZzZXRJbmRleCA9IHROb2RlLmluZGV4IC0gSEVBREVSX09GRlNFVDtcbiAgbmdoW05PREVTXSA/Pz0ge307XG4gIG5naFtOT0RFU11bbm9PZmZzZXRJbmRleF0gPSBjYWxjUGF0aEZvck5vZGUodE5vZGUsIGxWaWV3KTtcbn1cblxuLyoqXG4gKiBIZWxwZXIgZnVuY3Rpb24gdG8gYXBwZW5kIGluZm9ybWF0aW9uIGFib3V0IGEgZGlzY29ubmVjdGVkIG5vZGUuXG4gKiBUaGlzIGluZm8gaXMgbmVlZGVkIGF0IHJ1bnRpbWUgdG8gYXZvaWQgRE9NIGxvb2t1cHMgZm9yIHRoaXMgZWxlbWVudFxuICogYW5kIGluc3RlYWQsIHRoZSBlbGVtZW50IHdvdWxkIGJlIGNyZWF0ZWQgZnJvbSBzY3JhdGNoLlxuICovXG5mdW5jdGlvbiBhcHBlbmREaXNjb25uZWN0ZWROb2RlSW5kZXgobmdoOiBTZXJpYWxpemVkVmlldywgdE5vZGU6IFROb2RlKSB7XG4gIGNvbnN0IG5vT2Zmc2V0SW5kZXggPSB0Tm9kZS5pbmRleCAtIEhFQURFUl9PRkZTRVQ7XG4gIG5naFtESVNDT05ORUNURURfTk9ERVNdID8/PSBbXTtcbiAgaWYgKCFuZ2hbRElTQ09OTkVDVEVEX05PREVTXS5pbmNsdWRlcyhub09mZnNldEluZGV4KSkge1xuICAgIG5naFtESVNDT05ORUNURURfTk9ERVNdLnB1c2gobm9PZmZzZXRJbmRleCk7XG4gIH1cbn1cblxuLyoqXG4gKiBTZXJpYWxpemVzIHRoZSBsVmlldyBkYXRhIGludG8gYSBTZXJpYWxpemVkVmlldyBvYmplY3QgdGhhdCB3aWxsIGxhdGVyIGJlIGFkZGVkXG4gKiB0byB0aGUgVHJhbnNmZXJTdGF0ZSBzdG9yYWdlIGFuZCByZWZlcmVuY2VkIHVzaW5nIHRoZSBgbmdoYCBhdHRyaWJ1dGUgb24gYSBob3N0XG4gKiBlbGVtZW50LlxuICpcbiAqIEBwYXJhbSBsVmlldyB0aGUgbFZpZXcgd2UgYXJlIHNlcmlhbGl6aW5nXG4gKiBAcGFyYW0gY29udGV4dCB0aGUgaHlkcmF0aW9uIGNvbnRleHRcbiAqIEByZXR1cm5zIHRoZSBgU2VyaWFsaXplZFZpZXdgIG9iamVjdCBjb250YWluaW5nIHRoZSBkYXRhIHRvIGJlIGFkZGVkIHRvIHRoZSBob3N0IG5vZGVcbiAqL1xuZnVuY3Rpb24gc2VyaWFsaXplTFZpZXcobFZpZXc6IExWaWV3LCBjb250ZXh0OiBIeWRyYXRpb25Db250ZXh0KTogU2VyaWFsaXplZFZpZXcge1xuICBjb25zdCBuZ2g6IFNlcmlhbGl6ZWRWaWV3ID0ge307XG4gIGNvbnN0IHRWaWV3ID0gbFZpZXdbVFZJRVddO1xuICAvLyBJdGVyYXRlIG92ZXIgRE9NIGVsZW1lbnQgcmVmZXJlbmNlcyBpbiBhbiBMVmlldy5cbiAgZm9yIChsZXQgaSA9IEhFQURFUl9PRkZTRVQ7IGkgPCB0Vmlldy5iaW5kaW5nU3RhcnRJbmRleDsgaSsrKSB7XG4gICAgY29uc3QgdE5vZGUgPSB0Vmlldy5kYXRhW2ldIGFzIFROb2RlO1xuICAgIGNvbnN0IG5vT2Zmc2V0SW5kZXggPSBpIC0gSEVBREVSX09GRlNFVDtcbiAgICAvLyBMb2NhbCByZWZzIChlLmcuIDxkaXYgI2xvY2FsUmVmPikgdGFrZSB1cCBhbiBleHRyYSBzbG90IGluIExWaWV3c1xuICAgIC8vIHRvIHN0b3JlIHRoZSBzYW1lIGVsZW1lbnQuIEluIHRoaXMgY2FzZSwgdGhlcmUgaXMgbm8gaW5mb3JtYXRpb24gaW5cbiAgICAvLyBhIGNvcnJlc3BvbmRpbmcgc2xvdCBpbiBUTm9kZSBkYXRhIHN0cnVjdHVyZS4gSWYgdGhhdCdzIHRoZSBjYXNlLCBqdXN0XG4gICAgLy8gc2tpcCB0aGlzIHNsb3QgYW5kIG1vdmUgdG8gdGhlIG5leHQgb25lLlxuICAgIGlmICghdE5vZGUpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIC8vIENoZWNrIGlmIGEgbmF0aXZlIG5vZGUgdGhhdCByZXByZXNlbnRzIGEgZ2l2ZW4gVE5vZGUgaXMgZGlzY29ubmVjdGVkIGZyb20gdGhlIERPTSB0cmVlLlxuICAgIC8vIFN1Y2ggbm9kZXMgbXVzdCBiZSBleGNsdWRlZCBmcm9tIHRoZSBoeWRyYXRpb24gKHNpbmNlIHRoZSBoeWRyYXRpb24gd29uJ3QgYmUgYWJsZSB0b1xuICAgIC8vIGZpbmQgdGhlbSksIHNvIHRoZSBUTm9kZSBpZHMgYXJlIGNvbGxlY3RlZCBhbmQgdXNlZCBhdCBydW50aW1lIHRvIHNraXAgdGhlIGh5ZHJhdGlvbi5cbiAgICAvL1xuICAgIC8vIFRoaXMgc2l0dWF0aW9uIG1heSBoYXBwZW4gZHVyaW5nIHRoZSBjb250ZW50IHByb2plY3Rpb24sIHdoZW4gc29tZSBub2RlcyBkb24ndCBtYWtlIGl0XG4gICAgLy8gaW50byBvbmUgb2YgdGhlIGNvbnRlbnQgcHJvamVjdGlvbiBzbG90cyAoZm9yIGV4YW1wbGUsIHdoZW4gdGhlcmUgaXMgbm8gZGVmYXVsdFxuICAgIC8vIDxuZy1jb250ZW50IC8+IHNsb3QgaW4gcHJvamVjdG9yIGNvbXBvbmVudCdzIHRlbXBsYXRlKS5cbiAgICBpZiAoaXNEaXNjb25uZWN0ZWROb2RlKHROb2RlLCBsVmlldykgJiYgaXNDb250ZW50UHJvamVjdGVkTm9kZSh0Tm9kZSkpIHtcbiAgICAgIGFwcGVuZERpc2Nvbm5lY3RlZE5vZGVJbmRleChuZ2gsIHROb2RlKTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICBpZiAoQXJyYXkuaXNBcnJheSh0Tm9kZS5wcm9qZWN0aW9uKSkge1xuICAgICAgZm9yIChjb25zdCBwcm9qZWN0aW9uSGVhZFROb2RlIG9mIHROb2RlLnByb2plY3Rpb24pIHtcbiAgICAgICAgLy8gV2UgbWF5IGhhdmUgYG51bGxgcyBpbiBzbG90cyB3aXRoIG5vIHByb2plY3RlZCBjb250ZW50LlxuICAgICAgICBpZiAoIXByb2plY3Rpb25IZWFkVE5vZGUpIGNvbnRpbnVlO1xuXG4gICAgICAgIGlmICghQXJyYXkuaXNBcnJheShwcm9qZWN0aW9uSGVhZFROb2RlKSkge1xuICAgICAgICAgIC8vIElmIHdlIHByb2Nlc3MgcmUtcHJvamVjdGVkIGNvbnRlbnQgKGkuZS4gYDxuZy1jb250ZW50PmBcbiAgICAgICAgICAvLyBhcHBlYXJzIGF0IHByb2plY3Rpb24gbG9jYXRpb24pLCBza2lwIGFubm90YXRpb25zIGZvciB0aGlzIGNvbnRlbnRcbiAgICAgICAgICAvLyBzaW5jZSBhbGwgRE9NIG5vZGVzIGluIHRoaXMgcHJvamVjdGlvbiB3ZXJlIGhhbmRsZWQgd2hpbGUgcHJvY2Vzc2luZ1xuICAgICAgICAgIC8vIGEgcGFyZW50IGxWaWV3LCB3aGljaCBjb250YWlucyB0aG9zZSBub2Rlcy5cbiAgICAgICAgICBpZiAoIWlzUHJvamVjdGlvblROb2RlKHByb2plY3Rpb25IZWFkVE5vZGUpICYmXG4gICAgICAgICAgICAgICFpc0luU2tpcEh5ZHJhdGlvbkJsb2NrKHByb2plY3Rpb25IZWFkVE5vZGUpKSB7XG4gICAgICAgICAgICBpZiAoaXNEaXNjb25uZWN0ZWROb2RlKHByb2plY3Rpb25IZWFkVE5vZGUsIGxWaWV3KSkge1xuICAgICAgICAgICAgICAvLyBDaGVjayB3aGV0aGVyIHRoaXMgbm9kZSBpcyBjb25uZWN0ZWQsIHNpbmNlIHdlIG1heSBoYXZlIGEgVE5vZGVcbiAgICAgICAgICAgICAgLy8gaW4gdGhlIGRhdGEgc3RydWN0dXJlIGFzIGEgcHJvamVjdGlvbiBzZWdtZW50IGhlYWQsIGJ1dCB0aGVcbiAgICAgICAgICAgICAgLy8gY29udGVudCBwcm9qZWN0aW9uIHNsb3QgbWlnaHQgYmUgZGlzYWJsZWQgKGUuZy5cbiAgICAgICAgICAgICAgLy8gPG5nLWNvbnRlbnQgKm5nSWY9XCJmYWxzZVwiIC8+KS5cbiAgICAgICAgICAgICAgYXBwZW5kRGlzY29ubmVjdGVkTm9kZUluZGV4KG5naCwgcHJvamVjdGlvbkhlYWRUTm9kZSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBhcHBlbmRTZXJpYWxpemVkTm9kZVBhdGgobmdoLCBwcm9qZWN0aW9uSGVhZFROb2RlLCBsVmlldyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIElmIGEgdmFsdWUgaXMgYW4gYXJyYXksIGl0IG1lYW5zIHRoYXQgd2UgYXJlIHByb2Nlc3NpbmcgYSBwcm9qZWN0aW9uXG4gICAgICAgICAgLy8gd2hlcmUgcHJvamVjdGFibGUgbm9kZXMgd2VyZSBwYXNzZWQgaW4gYXMgRE9NIG5vZGVzIChmb3IgZXhhbXBsZSwgd2hlblxuICAgICAgICAgIC8vIGNhbGxpbmcgYFZpZXdDb250YWluZXJSZWYuY3JlYXRlQ29tcG9uZW50KENtcEEsIHtwcm9qZWN0YWJsZU5vZGVzOiBbLi4uXX0pYCkuXG4gICAgICAgICAgLy9cbiAgICAgICAgICAvLyBJbiB0aGlzIHNjZW5hcmlvLCBub2RlcyBjYW4gY29tZSBmcm9tIGFueXdoZXJlIChlaXRoZXIgY3JlYXRlZCBtYW51YWxseSxcbiAgICAgICAgICAvLyBhY2Nlc3NlZCB2aWEgYGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JgLCBldGMpIGFuZCBtYXkgYmUgaW4gYW55IHN0YXRlXG4gICAgICAgICAgLy8gKGF0dGFjaGVkIG9yIGRldGFjaGVkIGZyb20gdGhlIERPTSB0cmVlKS4gQXMgYSByZXN1bHQsIHdlIGNhbiBub3QgcmVsaWFibHlcbiAgICAgICAgICAvLyByZXN0b3JlIHRoZSBzdGF0ZSBmb3Igc3VjaCBjYXNlcyBkdXJpbmcgaHlkcmF0aW9uLlxuXG4gICAgICAgICAgdGhyb3cgdW5zdXBwb3J0ZWRQcm9qZWN0aW9uT2ZEb21Ob2Rlcyh1bndyYXBSTm9kZShsVmlld1tpXSkpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChpc0xDb250YWluZXIobFZpZXdbaV0pKSB7XG4gICAgICAvLyBTZXJpYWxpemUgaW5mb3JtYXRpb24gYWJvdXQgYSB0ZW1wbGF0ZS5cbiAgICAgIGNvbnN0IGVtYmVkZGVkVFZpZXcgPSB0Tm9kZS50VmlldztcbiAgICAgIGlmIChlbWJlZGRlZFRWaWV3ICE9PSBudWxsKSB7XG4gICAgICAgIG5naFtURU1QTEFURVNdID8/PSB7fTtcbiAgICAgICAgbmdoW1RFTVBMQVRFU11bbm9PZmZzZXRJbmRleF0gPSBnZXRTc3JJZChlbWJlZGRlZFRWaWV3KTtcbiAgICAgIH1cblxuICAgICAgLy8gU2VyaWFsaXplIHZpZXdzIHdpdGhpbiB0aGlzIExDb250YWluZXIuXG4gICAgICBjb25zdCBob3N0Tm9kZSA9IGxWaWV3W2ldW0hPU1RdITsgIC8vIGhvc3Qgbm9kZSBvZiB0aGlzIGNvbnRhaW5lclxuXG4gICAgICAvLyBMVmlld1tpXVtIT1NUXSBjYW4gYmUgb2YgMiBkaWZmZXJlbnQgdHlwZXM6XG4gICAgICAvLyAtIGVpdGhlciBhIERPTSBub2RlXG4gICAgICAvLyAtIG9yIGFuIGFycmF5IHRoYXQgcmVwcmVzZW50cyBhbiBMVmlldyBvZiBhIGNvbXBvbmVudFxuICAgICAgaWYgKEFycmF5LmlzQXJyYXkoaG9zdE5vZGUpKSB7XG4gICAgICAgIC8vIFRoaXMgaXMgYSBjb21wb25lbnQsIHNlcmlhbGl6ZSBpbmZvIGFib3V0IGl0LlxuICAgICAgICBjb25zdCB0YXJnZXROb2RlID0gdW53cmFwUk5vZGUoaG9zdE5vZGUgYXMgTFZpZXcpIGFzIFJFbGVtZW50O1xuICAgICAgICBpZiAoISh0YXJnZXROb2RlIGFzIEhUTUxFbGVtZW50KS5oYXNBdHRyaWJ1dGUoU0tJUF9IWURSQVRJT05fQVRUUl9OQU1FKSkge1xuICAgICAgICAgIGFubm90YXRlSG9zdEVsZW1lbnRGb3JIeWRyYXRpb24odGFyZ2V0Tm9kZSwgaG9zdE5vZGUgYXMgTFZpZXcsIGNvbnRleHQpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBuZ2hbQ09OVEFJTkVSU10gPz89IHt9O1xuICAgICAgbmdoW0NPTlRBSU5FUlNdW25vT2Zmc2V0SW5kZXhdID0gc2VyaWFsaXplTENvbnRhaW5lcihsVmlld1tpXSwgY29udGV4dCk7XG4gICAgfSBlbHNlIGlmIChBcnJheS5pc0FycmF5KGxWaWV3W2ldKSkge1xuICAgICAgLy8gVGhpcyBpcyBhIGNvbXBvbmVudCwgYW5ub3RhdGUgdGhlIGhvc3Qgbm9kZSB3aXRoIGFuIGBuZ2hgIGF0dHJpYnV0ZS5cbiAgICAgIGNvbnN0IHRhcmdldE5vZGUgPSB1bndyYXBSTm9kZShsVmlld1tpXVtIT1NUXSEpO1xuICAgICAgaWYgKCEodGFyZ2V0Tm9kZSBhcyBIVE1MRWxlbWVudCkuaGFzQXR0cmlidXRlKFNLSVBfSFlEUkFUSU9OX0FUVFJfTkFNRSkpIHtcbiAgICAgICAgYW5ub3RhdGVIb3N0RWxlbWVudEZvckh5ZHJhdGlvbih0YXJnZXROb2RlIGFzIFJFbGVtZW50LCBsVmlld1tpXSwgY29udGV4dCk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIDxuZy1jb250YWluZXI+IGNhc2VcbiAgICAgIGlmICh0Tm9kZS50eXBlICYgVE5vZGVUeXBlLkVsZW1lbnRDb250YWluZXIpIHtcbiAgICAgICAgLy8gQW4gPG5nLWNvbnRhaW5lcj4gaXMgcmVwcmVzZW50ZWQgYnkgdGhlIG51bWJlciBvZlxuICAgICAgICAvLyB0b3AtbGV2ZWwgbm9kZXMuIFRoaXMgaW5mb3JtYXRpb24gaXMgbmVlZGVkIHRvIHNraXAgb3ZlclxuICAgICAgICAvLyB0aG9zZSBub2RlcyB0byByZWFjaCBhIGNvcnJlc3BvbmRpbmcgYW5jaG9yIG5vZGUgKGNvbW1lbnQgbm9kZSkuXG4gICAgICAgIG5naFtFTEVNRU5UX0NPTlRBSU5FUlNdID8/PSB7fTtcbiAgICAgICAgbmdoW0VMRU1FTlRfQ09OVEFJTkVSU11bbm9PZmZzZXRJbmRleF0gPSBjYWxjTnVtUm9vdE5vZGVzKHRWaWV3LCBsVmlldywgdE5vZGUuY2hpbGQpO1xuICAgICAgfSBlbHNlIGlmICh0Tm9kZS50eXBlICYgVE5vZGVUeXBlLlByb2plY3Rpb24pIHtcbiAgICAgICAgLy8gQ3VycmVudCBUTm9kZSByZXByZXNlbnRzIGFuIGA8bmctY29udGVudD5gIHNsb3QsIHRodXMgaXQgaGFzIG5vXG4gICAgICAgIC8vIERPTSBlbGVtZW50cyBhc3NvY2lhdGVkIHdpdGggaXQsIHNvIHRoZSAqKm5leHQgc2libGluZyoqIG5vZGUgd291bGRcbiAgICAgICAgLy8gbm90IGJlIGFibGUgdG8gZmluZCBhbiBhbmNob3IuIEluIHRoaXMgY2FzZSwgdXNlIGZ1bGwgcGF0aCBpbnN0ZWFkLlxuICAgICAgICBsZXQgbmV4dFROb2RlID0gdE5vZGUubmV4dDtcbiAgICAgICAgLy8gU2tpcCBvdmVyIGFsbCBgPG5nLWNvbnRlbnQ+YCBzbG90cyBpbiBhIHJvdy5cbiAgICAgICAgd2hpbGUgKG5leHRUTm9kZSAhPT0gbnVsbCAmJiAobmV4dFROb2RlLnR5cGUgJiBUTm9kZVR5cGUuUHJvamVjdGlvbikpIHtcbiAgICAgICAgICBuZXh0VE5vZGUgPSBuZXh0VE5vZGUubmV4dDtcbiAgICAgICAgfVxuICAgICAgICBpZiAobmV4dFROb2RlICYmICFpc0luU2tpcEh5ZHJhdGlvbkJsb2NrKG5leHRUTm9kZSkpIHtcbiAgICAgICAgICAvLyBIYW5kbGUgYSB0Tm9kZSBhZnRlciB0aGUgYDxuZy1jb250ZW50PmAgc2xvdC5cbiAgICAgICAgICBhcHBlbmRTZXJpYWxpemVkTm9kZVBhdGgobmdoLCBuZXh0VE5vZGUsIGxWaWV3KTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gSGFuZGxlIGNhc2VzIHdoZXJlIHRleHQgbm9kZXMgY2FuIGJlIGxvc3QgYWZ0ZXIgRE9NIHNlcmlhbGl6YXRpb246XG4gICAgICAgIC8vICAxLiBXaGVuIHRoZXJlIGlzIGFuICplbXB0eSB0ZXh0IG5vZGUqIGluIERPTTogaW4gdGhpcyBjYXNlLCB0aGlzXG4gICAgICAgIC8vICAgICBub2RlIHdvdWxkIG5vdCBtYWtlIGl0IGludG8gdGhlIHNlcmlhbGl6ZWQgc3RyaW5nIGFuZCBhcyBhIHJlc3VsdCxcbiAgICAgICAgLy8gICAgIHRoaXMgbm9kZSB3b3VsZG4ndCBiZSBjcmVhdGVkIGluIGEgYnJvd3Nlci4gVGhpcyB3b3VsZCByZXN1bHQgaW5cbiAgICAgICAgLy8gICAgIGEgbWlzbWF0Y2ggZHVyaW5nIHRoZSBoeWRyYXRpb24sIHdoZXJlIHRoZSBydW50aW1lIGxvZ2ljIHdvdWxkIGV4cGVjdFxuICAgICAgICAvLyAgICAgYSB0ZXh0IG5vZGUgdG8gYmUgcHJlc2VudCBpbiBsaXZlIERPTSwgYnV0IG5vIHRleHQgbm9kZSB3b3VsZCBleGlzdC5cbiAgICAgICAgLy8gICAgIEV4YW1wbGU6IGA8c3Bhbj57eyBuYW1lIH19PC9zcGFuPmAgd2hlbiB0aGUgYG5hbWVgIGlzIGFuIGVtcHR5IHN0cmluZy5cbiAgICAgICAgLy8gICAgIFRoaXMgd291bGQgcmVzdWx0IGluIGA8c3Bhbj48L3NwYW4+YCBzdHJpbmcgYWZ0ZXIgc2VyaWFsaXphdGlvbiBhbmRcbiAgICAgICAgLy8gICAgIGluIGEgYnJvd3NlciBvbmx5IHRoZSBgc3BhbmAgZWxlbWVudCB3b3VsZCBiZSBjcmVhdGVkLiBUbyByZXNvbHZlIHRoYXQsXG4gICAgICAgIC8vICAgICBhbiBleHRyYSBjb21tZW50IG5vZGUgaXMgYXBwZW5kZWQgaW4gcGxhY2Ugb2YgYW4gZW1wdHkgdGV4dCBub2RlIGFuZFxuICAgICAgICAvLyAgICAgdGhhdCBzcGVjaWFsIGNvbW1lbnQgbm9kZSBpcyByZXBsYWNlZCB3aXRoIGFuIGVtcHR5IHRleHQgbm9kZSAqYmVmb3JlKlxuICAgICAgICAvLyAgICAgaHlkcmF0aW9uLlxuICAgICAgICAvLyAgMi4gV2hlbiB0aGVyZSBhcmUgMiBjb25zZWN1dGl2ZSB0ZXh0IG5vZGVzIHByZXNlbnQgaW4gdGhlIERPTS5cbiAgICAgICAgLy8gICAgIEV4YW1wbGU6IGA8ZGl2PkhlbGxvIDxuZy1jb250YWluZXIgKm5nSWY9XCJ0cnVlXCI+d29ybGQ8L25nLWNvbnRhaW5lcj48L2Rpdj5gLlxuICAgICAgICAvLyAgICAgSW4gdGhpcyBzY2VuYXJpbywgdGhlIGxpdmUgRE9NIHdvdWxkIGxvb2sgbGlrZSB0aGlzOlxuICAgICAgICAvLyAgICAgICA8ZGl2PiN0ZXh0KCdIZWxsbyAnKSAjdGV4dCgnd29ybGQnKSAjY29tbWVudCgnY29udGFpbmVyJyk8L2Rpdj5cbiAgICAgICAgLy8gICAgIFNlcmlhbGl6ZWQgc3RyaW5nIHdvdWxkIGxvb2sgbGlrZSB0aGlzOiBgPGRpdj5IZWxsbyB3b3JsZDwhLS1jb250YWluZXItLT48L2Rpdj5gLlxuICAgICAgICAvLyAgICAgVGhlIGxpdmUgRE9NIGluIGEgYnJvd3NlciBhZnRlciB0aGF0IHdvdWxkIGJlOlxuICAgICAgICAvLyAgICAgICA8ZGl2PiN0ZXh0KCdIZWxsbyB3b3JsZCcpICNjb21tZW50KCdjb250YWluZXInKTwvZGl2PlxuICAgICAgICAvLyAgICAgTm90aWNlIGhvdyAyIHRleHQgbm9kZXMgYXJlIG5vdyBcIm1lcmdlZFwiIGludG8gb25lLiBUaGlzIHdvdWxkIGNhdXNlIGh5ZHJhdGlvblxuICAgICAgICAvLyAgICAgbG9naWMgdG8gZmFpbCwgc2luY2UgaXQnZCBleHBlY3QgMiB0ZXh0IG5vZGVzIGJlaW5nIHByZXNlbnQsIG5vdCBvbmUuXG4gICAgICAgIC8vICAgICBUbyBmaXggdGhpcywgd2UgaW5zZXJ0IGEgc3BlY2lhbCBjb21tZW50IG5vZGUgaW4gYmV0d2VlbiB0aG9zZSB0ZXh0IG5vZGVzLCBzb1xuICAgICAgICAvLyAgICAgc2VyaWFsaXplZCByZXByZXNlbnRhdGlvbiBpczogYDxkaXY+SGVsbG8gPCEtLW5ndG5zLS0+d29ybGQ8IS0tY29udGFpbmVyLS0+PC9kaXY+YC5cbiAgICAgICAgLy8gICAgIFRoaXMgZm9yY2VzIGJyb3dzZXIgdG8gY3JlYXRlIDIgdGV4dCBub2RlcyBzZXBhcmF0ZWQgYnkgYSBjb21tZW50IG5vZGUuXG4gICAgICAgIC8vICAgICBCZWZvcmUgcnVubmluZyBhIGh5ZHJhdGlvbiBwcm9jZXNzLCB0aGlzIHNwZWNpYWwgY29tbWVudCBub2RlIGlzIHJlbW92ZWQsIHNvIHRoZVxuICAgICAgICAvLyAgICAgbGl2ZSBET00gaGFzIGV4YWN0bHkgdGhlIHNhbWUgc3RhdGUgYXMgaXQgd2FzIGJlZm9yZSBzZXJpYWxpemF0aW9uLlxuICAgICAgICBpZiAodE5vZGUudHlwZSAmIFROb2RlVHlwZS5UZXh0KSB7XG4gICAgICAgICAgY29uc3Qgck5vZGUgPSB1bndyYXBSTm9kZShsVmlld1tpXSkgYXMgSFRNTEVsZW1lbnQ7XG4gICAgICAgICAgaWYgKHJOb2RlLnRleHRDb250ZW50Py5yZXBsYWNlKC9cXHMvZ20sICcnKSA9PT0gJycpIHtcbiAgICAgICAgICAgIGNvbnRleHQuY29ycnVwdGVkVGV4dE5vZGVzLnNldChyTm9kZSwgVGV4dE5vZGVNYXJrZXIuRW1wdHlOb2RlKTtcbiAgICAgICAgICB9IGVsc2UgaWYgKHJOb2RlLm5leHRTaWJsaW5nPy5ub2RlVHlwZSA9PT0gTm9kZS5URVhUX05PREUpIHtcbiAgICAgICAgICAgIGNvbnRleHQuY29ycnVwdGVkVGV4dE5vZGVzLnNldChyTm9kZSwgVGV4dE5vZGVNYXJrZXIuU2VwYXJhdG9yKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodE5vZGUucHJvamVjdGlvbk5leHQgJiYgdE5vZGUucHJvamVjdGlvbk5leHQgIT09IHROb2RlLm5leHQgJiZcbiAgICAgICAgICAgICFpc0luU2tpcEh5ZHJhdGlvbkJsb2NrKHROb2RlLnByb2plY3Rpb25OZXh0KSkge1xuICAgICAgICAgIC8vIENoZWNrIGlmIHByb2plY3Rpb24gbmV4dCBpcyBub3QgdGhlIHNhbWUgYXMgbmV4dCwgaW4gd2hpY2ggY2FzZVxuICAgICAgICAgIC8vIHRoZSBub2RlIHdvdWxkIG5vdCBiZSBmb3VuZCBhdCBjcmVhdGlvbiB0aW1lIGF0IHJ1bnRpbWUgYW5kIHdlXG4gICAgICAgICAgLy8gbmVlZCB0byBwcm92aWRlIGEgbG9jYXRpb24gZm9yIHRoYXQgbm9kZS5cbiAgICAgICAgICBhcHBlbmRTZXJpYWxpemVkTm9kZVBhdGgobmdoLCB0Tm9kZS5wcm9qZWN0aW9uTmV4dCwgbFZpZXcpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBuZ2g7XG59XG5cbi8qKlxuICogRGV0ZXJtaW5lcyB3aGV0aGVyIGEgY29tcG9uZW50IGluc3RhbmNlIHRoYXQgaXMgcmVwcmVzZW50ZWRcbiAqIGJ5IGEgZ2l2ZW4gTFZpZXcgdXNlcyBgVmlld0VuY2Fwc3VsYXRpb24uU2hhZG93RG9tYC5cbiAqL1xuZnVuY3Rpb24gY29tcG9uZW50VXNlc1NoYWRvd0RvbUVuY2Fwc3VsYXRpb24obFZpZXc6IExWaWV3KTogYm9vbGVhbiB7XG4gIGNvbnN0IGluc3RhbmNlID0gbFZpZXdbQ09OVEVYVF07XG4gIHJldHVybiBpbnN0YW5jZT8uY29uc3RydWN0b3IgP1xuICAgICAgZ2V0Q29tcG9uZW50RGVmKGluc3RhbmNlLmNvbnN0cnVjdG9yKT8uZW5jYXBzdWxhdGlvbiA9PT0gVmlld0VuY2Fwc3VsYXRpb24uU2hhZG93RG9tIDpcbiAgICAgIGZhbHNlO1xufVxuXG4vKipcbiAqIEFubm90YXRlcyBjb21wb25lbnQgaG9zdCBlbGVtZW50IGZvciBoeWRyYXRpb246XG4gKiAtIGJ5IGVpdGhlciBhZGRpbmcgdGhlIGBuZ2hgIGF0dHJpYnV0ZSBhbmQgY29sbGVjdGluZyBoeWRyYXRpb24tcmVsYXRlZCBpbmZvXG4gKiAgIGZvciB0aGUgc2VyaWFsaXphdGlvbiBhbmQgdHJhbnNmZXJyaW5nIHRvIHRoZSBjbGllbnRcbiAqIC0gb3IgYnkgYWRkaW5nIHRoZSBgbmdTa2lwSHlkcmF0aW9uYCBhdHRyaWJ1dGUgaW4gY2FzZSBBbmd1bGFyIGRldGVjdHMgdGhhdFxuICogICBjb21wb25lbnQgY29udGVudHMgaXMgbm90IGNvbXBhdGlibGUgd2l0aCBoeWRyYXRpb24uXG4gKlxuICogQHBhcmFtIGVsZW1lbnQgVGhlIEhvc3QgZWxlbWVudCB0byBiZSBhbm5vdGF0ZWRcbiAqIEBwYXJhbSBsVmlldyBUaGUgYXNzb2NpYXRlZCBMVmlld1xuICogQHBhcmFtIGNvbnRleHQgVGhlIGh5ZHJhdGlvbiBjb250ZXh0XG4gKi9cbmZ1bmN0aW9uIGFubm90YXRlSG9zdEVsZW1lbnRGb3JIeWRyYXRpb24oXG4gICAgZWxlbWVudDogUkVsZW1lbnQsIGxWaWV3OiBMVmlldywgY29udGV4dDogSHlkcmF0aW9uQ29udGV4dCk6IHZvaWQge1xuICBjb25zdCByZW5kZXJlciA9IGxWaWV3W1JFTkRFUkVSXTtcbiAgaWYgKChsVmlld1tGTEFHU10gJiBMVmlld0ZsYWdzLkhhc0kxOG4pID09PSBMVmlld0ZsYWdzLkhhc0kxOG4gfHxcbiAgICAgIGNvbXBvbmVudFVzZXNTaGFkb3dEb21FbmNhcHN1bGF0aW9uKGxWaWV3KSkge1xuICAgIC8vIEF0dGFjaCB0aGUgc2tpcCBoeWRyYXRpb24gYXR0cmlidXRlIGlmIHRoaXMgY29tcG9uZW50OlxuICAgIC8vIC0gZWl0aGVyIGhhcyBpMThuIGJsb2Nrcywgc2luY2UgaHlkcmF0aW5nIHN1Y2ggYmxvY2tzIGlzIG5vdCB5ZXQgc3VwcG9ydGVkXG4gICAgLy8gLSBvciB1c2VzIFNoYWRvd0RvbSB2aWV3IGVuY2Fwc3VsYXRpb24sIHNpbmNlIERvbWlubyBkb2Vzbid0IHN1cHBvcnRcbiAgICAvLyAgIHNoYWRvdyBET00sIHNvIHdlIGNhbiBub3QgZ3VhcmFudGVlIHRoYXQgY2xpZW50IGFuZCBzZXJ2ZXIgcmVwcmVzZW50YXRpb25zXG4gICAgLy8gICB3b3VsZCBleGFjdGx5IG1hdGNoXG4gICAgcmVuZGVyZXIuc2V0QXR0cmlidXRlKGVsZW1lbnQsIFNLSVBfSFlEUkFUSU9OX0FUVFJfTkFNRSwgJycpO1xuICB9IGVsc2Uge1xuICAgIGNvbnN0IG5naCA9IHNlcmlhbGl6ZUxWaWV3KGxWaWV3LCBjb250ZXh0KTtcbiAgICBjb25zdCBpbmRleCA9IGNvbnRleHQuc2VyaWFsaXplZFZpZXdDb2xsZWN0aW9uLmFkZChuZ2gpO1xuICAgIHJlbmRlcmVyLnNldEF0dHJpYnV0ZShlbGVtZW50LCBOR0hfQVRUUl9OQU1FLCBpbmRleC50b1N0cmluZygpKTtcbiAgfVxufVxuXG4vKipcbiAqIFBoeXNpY2FsbHkgaW5zZXJ0cyB0aGUgY29tbWVudCBub2RlcyB0byBlbnN1cmUgZW1wdHkgdGV4dCBub2RlcyBhbmQgYWRqYWNlbnRcbiAqIHRleHQgbm9kZSBzZXBhcmF0b3JzIGFyZSBwcmVzZXJ2ZWQgYWZ0ZXIgc2VydmVyIHNlcmlhbGl6YXRpb24gb2YgdGhlIERPTS5cbiAqIFRoZXNlIGdldCBzd2FwcGVkIGJhY2sgZm9yIGVtcHR5IHRleHQgbm9kZXMgb3Igc2VwYXJhdG9ycyBvbmNlIGh5ZHJhdGlvbiBoYXBwZW5zXG4gKiBvbiB0aGUgY2xpZW50LlxuICpcbiAqIEBwYXJhbSBjb3JydXB0ZWRUZXh0Tm9kZXMgVGhlIE1hcCBvZiB0ZXh0IG5vZGVzIHRvIGJlIHJlcGxhY2VkIHdpdGggY29tbWVudHNcbiAqIEBwYXJhbSBkb2MgVGhlIGRvY3VtZW50XG4gKi9cbmZ1bmN0aW9uIGluc2VydENvcnJ1cHRlZFRleHROb2RlTWFya2VycyhcbiAgICBjb3JydXB0ZWRUZXh0Tm9kZXM6IE1hcDxIVE1MRWxlbWVudCwgc3RyaW5nPiwgZG9jOiBEb2N1bWVudCkge1xuICBmb3IgKGNvbnN0IFt0ZXh0Tm9kZSwgbWFya2VyXSBvZiBjb3JydXB0ZWRUZXh0Tm9kZXMpIHtcbiAgICB0ZXh0Tm9kZS5hZnRlcihkb2MuY3JlYXRlQ29tbWVudChtYXJrZXIpKTtcbiAgfVxufVxuXG4vKipcbiAqIERldGVjdHMgd2hldGhlciBhIGdpdmVuIFROb2RlIHJlcHJlc2VudHMgYSBub2RlIHRoYXRcbiAqIGlzIGJlaW5nIGNvbnRlbnQgcHJvamVjdGVkLlxuICovXG5mdW5jdGlvbiBpc0NvbnRlbnRQcm9qZWN0ZWROb2RlKHROb2RlOiBUTm9kZSk6IGJvb2xlYW4ge1xuICBsZXQgY3VycmVudFROb2RlID0gdE5vZGU7XG4gIHdoaWxlIChjdXJyZW50VE5vZGUgIT0gbnVsbCkge1xuICAgIC8vIElmIHdlIGNvbWUgYWNyb3NzIGEgY29tcG9uZW50IGhvc3Qgbm9kZSBpbiBwYXJlbnQgbm9kZXMgLVxuICAgIC8vIHRoaXMgVE5vZGUgaXMgaW4gdGhlIGNvbnRlbnQgcHJvamVjdGlvbiBzZWN0aW9uLlxuICAgIGlmIChpc0NvbXBvbmVudEhvc3QoY3VycmVudFROb2RlKSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIGN1cnJlbnRUTm9kZSA9IGN1cnJlbnRUTm9kZS5wYXJlbnQgYXMgVE5vZGU7XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG4vKipcbiAqIENoZWNrIHdoZXRoZXIgYSBnaXZlbiBub2RlIGV4aXN0cywgYnV0IGlzIGRpc2Nvbm5lY3RlZCBmcm9tIHRoZSBET00uXG4gKlxuICogTm90ZTogd2UgbGV2ZXJhZ2UgdGhlIGZhY3QgdGhhdCB3ZSBoYXZlIHRoaXMgaW5mb3JtYXRpb24gYXZhaWxhYmxlIGluIHRoZSBET00gZW11bGF0aW9uXG4gKiBsYXllciAoaW4gRG9taW5vKSBmb3Igbm93LiBMb25nZXItdGVybSBzb2x1dGlvbiBzaG91bGQgbm90IHJlbHkgb24gdGhlIERPTSBlbXVsYXRpb24gYW5kXG4gKiBvbmx5IHVzZSBpbnRlcm5hbCBkYXRhIHN0cnVjdHVyZXMgYW5kIHN0YXRlIHRvIGNvbXB1dGUgdGhpcyBpbmZvcm1hdGlvbi5cbiAqL1xuZnVuY3Rpb24gaXNEaXNjb25uZWN0ZWROb2RlKHROb2RlOiBUTm9kZSwgbFZpZXc6IExWaWV3KSB7XG4gIHJldHVybiAhKHROb2RlLnR5cGUgJiBUTm9kZVR5cGUuUHJvamVjdGlvbikgJiYgISFsVmlld1t0Tm9kZS5pbmRleF0gJiZcbiAgICAgICEodW53cmFwUk5vZGUobFZpZXdbdE5vZGUuaW5kZXhdKSBhcyBOb2RlKS5pc0Nvbm5lY3RlZDtcbn1cbiJdfQ==