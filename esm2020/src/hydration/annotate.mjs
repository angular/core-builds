/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { collectNativeNodes } from '../render3/collect_native_nodes';
import { CONTAINER_HEADER_OFFSET } from '../render3/interfaces/container';
import { isLContainer, isProjectionTNode, isRootView } from '../render3/interfaces/type_checks';
import { HEADER_OFFSET, HOST, RENDERER, TVIEW } from '../render3/interfaces/view';
import { unwrapRNode } from '../render3/util/view_utils';
import { TransferState } from '../transfer_state';
import { notYetSupportedI18nBlockError, unsupportedProjectionOfDomNodes } from './error_handling';
import { CONTAINERS, ELEMENT_CONTAINERS, MULTIPLIER, NODES, NUM_ROOT_NODES, TEMPLATE_ID, TEMPLATES } from './interfaces';
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
            if (hostElement) {
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
            previousView[MULTIPLIER] ?? (previousView[MULTIPLIER] = 1);
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
    ngh[NODES] ?? (ngh[NODES] = {});
    ngh[NODES][noOffsetIndex] = calcPathForNode(tNode, lView);
}
/**
 * There is no special TNode type for an i18n block, so we verify
 * whether the structure that we store at the `TView.data[idx]` position
 * has the `TI18n` shape.
 */
function isTI18nNode(obj) {
    const tI18n = obj;
    return tI18n.hasOwnProperty('create') && tI18n.hasOwnProperty('update');
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
                        appendSerializedNodePath(ngh, projectionHeadTNode, lView);
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
                    throw unsupportedProjectionOfDomNodes();
                }
            }
        }
        if (isLContainer(lView[i])) {
            // Serialize information about a template.
            const embeddedTView = tNode.tView;
            if (embeddedTView !== null) {
                ngh[TEMPLATES] ?? (ngh[TEMPLATES] = {});
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
            ngh[CONTAINERS] ?? (ngh[CONTAINERS] = {});
            ngh[CONTAINERS][noOffsetIndex] = serializeLContainer(lView[i], context);
        }
        else if (Array.isArray(lView[i])) {
            // This is a component, annotate the host node with an `ngh` attribute.
            const targetNode = unwrapRNode(lView[i][HOST]);
            if (!targetNode.hasAttribute(SKIP_HYDRATION_ATTR_NAME)) {
                annotateHostElementForHydration(targetNode, lView[i], context);
            }
        }
        else if (isTI18nNode(tNode)) {
            // Hydration for i18n nodes is not *yet* supported.
            // Produce an error message which would also describe possible
            // solutions (switching back to the "destructive" hydration or
            // excluding a component from hydration via `ngSkipHydration`).
            throw notYetSupportedI18nBlockError();
        }
        else {
            // <ng-container> case
            if (tNode.type & 8 /* TNodeType.ElementContainer */) {
                // An <ng-container> is represented by the number of
                // top-level nodes. This information is needed to skip over
                // those nodes to reach a corresponding anchor node (comment node).
                ngh[ELEMENT_CONTAINERS] ?? (ngh[ELEMENT_CONTAINERS] = {});
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
 * Physically adds the `ngh` attribute and serialized data to the host element.
 *
 * @param element The Host element to be annotated
 * @param lView The associated LView
 * @param context The hydration context
 */
function annotateHostElementForHydration(element, lView, context) {
    const ngh = serializeLView(lView, context);
    const index = context.serializedViewCollection.add(ngh);
    const renderer = lView[RENDERER];
    renderer.setAttribute(element, NGH_ATTR_NAME, index.toString());
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYW5ub3RhdGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9oeWRyYXRpb24vYW5ub3RhdGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBR0gsT0FBTyxFQUFDLGtCQUFrQixFQUFDLE1BQU0saUNBQWlDLENBQUM7QUFDbkUsT0FBTyxFQUFDLHVCQUF1QixFQUFhLE1BQU0saUNBQWlDLENBQUM7QUFJcEYsT0FBTyxFQUFDLFlBQVksRUFBRSxpQkFBaUIsRUFBRSxVQUFVLEVBQUMsTUFBTSxtQ0FBbUMsQ0FBQztBQUM5RixPQUFPLEVBQUMsYUFBYSxFQUFFLElBQUksRUFBUyxRQUFRLEVBQVMsS0FBSyxFQUFZLE1BQU0sNEJBQTRCLENBQUM7QUFDekcsT0FBTyxFQUFDLFdBQVcsRUFBQyxNQUFNLDRCQUE0QixDQUFDO0FBQ3ZELE9BQU8sRUFBQyxhQUFhLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUVoRCxPQUFPLEVBQUMsNkJBQTZCLEVBQUUsK0JBQStCLEVBQUMsTUFBTSxrQkFBa0IsQ0FBQztBQUNoRyxPQUFPLEVBQUMsVUFBVSxFQUFFLGtCQUFrQixFQUFFLFVBQVUsRUFBRSxLQUFLLEVBQUUsY0FBYyxFQUEyQyxXQUFXLEVBQUUsU0FBUyxFQUFDLE1BQU0sY0FBYyxDQUFDO0FBQ2hLLE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUNwRCxPQUFPLEVBQUMsc0JBQXNCLEVBQUUsd0JBQXdCLEVBQUMsTUFBTSxrQkFBa0IsQ0FBQztBQUNsRixPQUFPLEVBQUMsNkJBQTZCLEVBQUUsYUFBYSxFQUFFLFlBQVksRUFBaUIsTUFBTSxTQUFTLENBQUM7QUFFbkc7Ozs7O0dBS0c7QUFDSCxNQUFNLHdCQUF3QjtJQUE5QjtRQUNVLFVBQUssR0FBcUIsRUFBRSxDQUFDO1FBQzdCLG1CQUFjLEdBQUcsSUFBSSxHQUFHLEVBQWtCLENB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LENBQUMsQ0FBQztpQkFDNUQ7YUFDRjtTQUNGO0tBQ0Y7SUFDRCxPQUFPLEdBQUcsQ0FBQztBQUNiLENBQUM7QUFFRDs7Ozs7O0dBTUc7QUFDSCxTQUFTLCtCQUErQixDQUNwQyxPQUFpQixFQUFFLEtBQVksRUFBRSxPQUF5QjtJQUM1RCxNQUFNLEdBQUcsR0FBRyxjQUFjLENBQUMsS0FBSyxFQUFFLE9BQU8sQ0FBQyxDQUFDO0lBQzNDLE1BQU0sS0FBSyxHQUFHLE9BQU8sQ0FBQyx3QkFBd0IsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDeEQsTUFBTSxRQUFRLEdBQUcsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQ2pDLFFBQVEsQ0FBQyxZQUFZLENBQUMsT0FBTyxFQUFFLGFBQWEsRUFBRSxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztBQUNsRSxDQUFDO0FBRUQ7Ozs7Ozs7O0dBUUc7QUFDSCxTQUFTLDhCQUE4QixDQUNuQyxrQkFBNEMsRUFBRSxHQUFhO0lBQzdELEtBQUssTUFBTSxDQUFDLFFBQVEsRUFBRSxNQUFNLENBQUMsSUFBSSxrQkFBa0IsRUFBRTtRQUNuRCxRQUFRLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztLQUMzQztBQUNILENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtBcHBsaWNhdGlvblJlZn0gZnJvbSAnLi4vYXBwbGljYXRpb25fcmVmJztcbmltcG9ydCB7Y29sbGVjdE5hdGl2ZU5vZGVzfSBmcm9tICcuLi9yZW5kZXIzL2NvbGxlY3RfbmF0aXZlX25vZGVzJztcbmltcG9ydCB7Q09OVEFJTkVSX0hFQURFUl9PRkZTRVQsIExDb250YWluZXJ9IGZyb20gJy4uL3JlbmRlcjMvaW50ZXJmYWNlcy9jb250YWluZXInO1xuaW1wb3J0IHtUSTE4bn0gZnJvbSAnLi4vcmVuZGVyMy9pbnRlcmZhY2VzL2kxOG4nO1xuaW1wb3J0IHtUTm9kZSwgVE5vZGVUeXBlfSBmcm9tICcuLi9yZW5kZXIzL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge1JFbGVtZW50fSBmcm9tICcuLi9yZW5kZXIzL2ludGVyZmFjZXMvcmVuZGVyZXJfZG9tJztcbmltcG9ydCB7aXNMQ29udGFpbmVyLCBpc1Byb2plY3Rpb25UTm9kZSwgaXNSb290Vmlld30gZnJvbSAnLi4vcmVuZGVyMy9pbnRlcmZhY2VzL3R5cGVfY2hlY2tzJztcbmltcG9ydCB7SEVBREVSX09GRlNFVCwgSE9TVCwgTFZpZXcsIFJFTkRFUkVSLCBUVmlldywgVFZJRVcsIFRWaWV3VHlwZX0gZnJvbSAnLi4vcmVuZGVyMy9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHt1bndyYXBSTm9kZX0gZnJvbSAnLi4vcmVuZGVyMy91dGlsL3ZpZXdfdXRpbHMnO1xuaW1wb3J0IHtUcmFuc2ZlclN0YXRlfSBmcm9tICcuLi90cmFuc2Zlcl9zdGF0ZSc7XG5cbmltcG9ydCB7bm90WWV0U3VwcG9ydGVkSTE4bkJsb2NrRXJyb3IsIHVuc3VwcG9ydGVkUHJvamVjdGlvbk9mRG9tTm9kZXN9IGZyb20gJy4vZXJyb3JfaGFuZGxpbmcnO1xuaW1wb3J0IHtDT05UQUlORVJTLCBFTEVNRU5UX0NPTlRBSU5FUlMsIE1VTFRJUExJRVIsIE5PREVTLCBOVU1fUk9PVF9OT0RFUywgU2VyaWFsaXplZENvbnRhaW5lclZpZXcsIFNlcmlhbGl6ZWRWaWV3LCBURU1QTEFURV9JRCwgVEVNUExBVEVTfSBmcm9tICcuL2ludGVyZmFjZXMnO1xuaW1wb3J0IHtjYWxjUGF0aEZvck5vZGV9IGZyb20gJy4vbm9kZV9sb29rdXBfdXRpbHMnO1xuaW1wb3J0IHtpc0luU2tpcEh5ZHJhdGlvbkJsb2NrLCBTS0lQX0hZRFJBVElPTl9BVFRSX05BTUV9IGZyb20gJy4vc2tpcF9oeWRyYXRpb24nO1xuaW1wb3J0IHtnZXRDb21wb25lbnRMVmlld0Zvckh5ZHJhdGlvbiwgTkdIX0FUVFJfTkFNRSwgTkdIX0RBVEFfS0VZLCBUZXh0Tm9kZU1hcmtlcn0gZnJvbSAnLi91dGlscyc7XG5cbi8qKlxuICogQSBjb2xsZWN0aW9uIHRoYXQgdHJhY2tzIGFsbCBzZXJpYWxpemVkIHZpZXdzIChgbmdoYCBET00gYW5ub3RhdGlvbnMpXG4gKiB0byBhdm9pZCBkdXBsaWNhdGlvbi4gQW4gYXR0ZW1wdCB0byBhZGQgYSBkdXBsaWNhdGUgdmlldyByZXN1bHRzIGluIHRoZVxuICogY29sbGVjdGlvbiByZXR1cm5pbmcgdGhlIGluZGV4IG9mIHRoZSBwcmV2aW91c2x5IGNvbGxlY3RlZCBzZXJpYWxpemVkIHZpZXcuXG4gKiBUaGlzIHJlZHVjZXMgdGhlIG51bWJlciBvZiBhbm5vdGF0aW9ucyBuZWVkZWQgZm9yIGEgZ2l2ZW4gcGFnZS5cbiAqL1xuY2xhc3MgU2VyaWFsaXplZFZpZXdDb2xsZWN0aW9uIHtcbiAgcHJpdmF0ZSB2aWV3czogU2VyaWFsaXplZFZpZXdbXSA9IFtdO1xuICBwcml2YXRlIGluZGV4QnlDb250ZW50ID0gbmV3IE1hcDxzdHJpbmcsIG51bWJlcj4oKTtcblxuICBhZGQoc2VyaWFsaXplZFZpZXc6IFNlcmlhbGl6ZWRWaWV3KTogbnVtYmVyIHtcbiAgICBjb25zdCB2aWV3QXNTdHJpbmcgPSBKU09OLnN0cmluZ2lmeShzZXJpYWxpemVkVmlldyk7XG4gICAgaWYgKCF0aGlzLmluZGV4QnlDb250ZW50Lmhhcyh2aWV3QXNTdHJpbmcpKSB7XG4gICAgICBjb25zdCBpbmRleCA9IHRoaXMudmlld3MubGVuZ3RoO1xuICAgICAgdGhpcy52aWV3cy5wdXNoKHNlcmlhbGl6ZWRWaWV3KTtcbiAgICAgIHRoaXMuaW5kZXhCeUNvbnRlbnQuc2V0KHZpZXdBc1N0cmluZywgaW5kZXgpO1xuICAgICAgcmV0dXJuIGluZGV4O1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5pbmRleEJ5Q29udGVudC5nZXQodmlld0FzU3RyaW5nKSE7XG4gIH1cblxuICBnZXRBbGwoKTogU2VyaWFsaXplZFZpZXdbXSB7XG4gICAgcmV0dXJuIHRoaXMudmlld3M7XG4gIH1cbn1cblxuLyoqXG4gKiBHbG9iYWwgY291bnRlciB0aGF0IGlzIHVzZWQgdG8gZ2VuZXJhdGUgYSB1bmlxdWUgaWQgZm9yIFRWaWV3c1xuICogZHVyaW5nIHRoZSBzZXJpYWxpemF0aW9uIHByb2Nlc3MuXG4gKi9cbmxldCB0Vmlld1NzcklkID0gMDtcblxuLyoqXG4gKiBHZW5lcmF0ZXMgYSB1bmlxdWUgaWQgZm9yIGEgZ2l2ZW4gVFZpZXcgYW5kIHJldHVybnMgdGhpcyBpZC5cbiAqIFRoZSBpZCBpcyBhbHNvIHN0b3JlZCBvbiB0aGlzIGluc3RhbmNlIG9mIGEgVFZpZXcgYW5kIHJldXNlZCBpblxuICogc3Vic2VxdWVudCBjYWxscy5cbiAqXG4gKiBUaGlzIGlkIGlzIG5lZWRlZCB0byB1bmlxdWVseSBpZGVudGlmeSBhbmQgcGljayB1cCBkZWh5ZHJhdGVkIHZpZXdzXG4gKiBhdCBydW50aW1lLlxuICovXG5mdW5jdGlvbiBnZXRTc3JJZCh0VmlldzogVFZpZXcpOiBzdHJpbmcge1xuICBpZiAoIXRWaWV3LnNzcklkKSB7XG4gICAgdFZpZXcuc3NySWQgPSBgdCR7dFZpZXdTc3JJZCsrfWA7XG4gIH1cbiAgcmV0dXJuIHRWaWV3LnNzcklkO1xufVxuXG4vKipcbiAqIERlc2NyaWJlcyBhIGNvbnRleHQgYXZhaWxhYmxlIGR1cmluZyB0aGUgc2VyaWFsaXphdGlvblxuICogcHJvY2Vzcy4gVGhlIGNvbnRleHQgaXMgdXNlZCB0byBzaGFyZSBhbmQgY29sbGVjdCBpbmZvcm1hdGlvblxuICogZHVyaW5nIHRoZSBzZXJpYWxpemF0aW9uLlxuICovXG5pbnRlcmZhY2UgSHlkcmF0aW9uQ29udGV4dCB7XG4gIHNlcmlhbGl6ZWRWaWV3Q29sbGVjdGlvbjogU2VyaWFsaXplZFZpZXdDb2xsZWN0aW9uO1xuICBjb3JydXB0ZWRUZXh0Tm9kZXM6IE1hcDxIVE1MRWxlbWVudCwgVGV4dE5vZGVNYXJrZXI+O1xufVxuXG4vKipcbiAqIENvbXB1dGVzIHRoZSBudW1iZXIgb2Ygcm9vdCBub2RlcyBpbiBhIGdpdmVuIHZpZXdcbiAqIChvciBjaGlsZCBub2RlcyBpbiBhIGdpdmVuIGNvbnRhaW5lciBpZiBhIHROb2RlIGlzIHByb3ZpZGVkKS5cbiAqL1xuZnVuY3Rpb24gY2FsY051bVJvb3ROb2Rlcyh0VmlldzogVFZpZXcsIGxWaWV3OiBMVmlldywgdE5vZGU6IFROb2RlfG51bGwpOiBudW1iZXIge1xuICBjb25zdCByb290Tm9kZXM6IHVua25vd25bXSA9IFtdO1xuICBjb2xsZWN0TmF0aXZlTm9kZXModFZpZXcsIGxWaWV3LCB0Tm9kZSwgcm9vdE5vZGVzKTtcbiAgcmV0dXJuIHJvb3ROb2Rlcy5sZW5ndGg7XG59XG5cbi8qKlxuICogQW5ub3RhdGVzIGFsbCBjb21wb25lbnRzIGJvb3RzdHJhcHBlZCBpbiBhIGdpdmVuIEFwcGxpY2F0aW9uUmVmXG4gKiB3aXRoIGluZm8gbmVlZGVkIGZvciBoeWRyYXRpb24uXG4gKlxuICogQHBhcmFtIGFwcFJlZiBBbiBpbnN0YW5jZSBvZiBhbiBBcHBsaWNhdGlvblJlZi5cbiAqIEBwYXJhbSBkb2MgQSByZWZlcmVuY2UgdG8gdGhlIGN1cnJlbnQgRG9jdW1lbnQgaW5zdGFuY2UuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhbm5vdGF0ZUZvckh5ZHJhdGlvbihhcHBSZWY6IEFwcGxpY2F0aW9uUmVmLCBkb2M6IERvY3VtZW50KSB7XG4gIGNvbnN0IHNlcmlhbGl6ZWRWaWV3Q29sbGVjdGlvbiA9IG5ldyBTZXJpYWxpemVkVmlld0NvbGxlY3Rpb24oKTtcbiAgY29uc3QgY29ycnVwdGVkVGV4dE5vZGVzID0gbmV3IE1hcDxIVE1MRWxlbWVudCwgVGV4dE5vZGVNYXJrZXI+KCk7XG4gIGNvbnN0IHZpZXdSZWZzID0gYXBwUmVmLl92aWV3cztcbiAgZm9yIChjb25zdCB2aWV3UmVmIG9mIHZpZXdSZWZzKSB7XG4gICAgY29uc3QgbFZpZXcgPSBnZXRDb21wb25lbnRMVmlld0Zvckh5ZHJhdGlvbih2aWV3UmVmKTtcbiAgICAvLyBBbiBgbFZpZXdgIG1pZ2h0IGJlIGBudWxsYCBpZiBhIGBWaWV3UmVmYCByZXByZXNlbnRzXG4gICAgLy8gYW4gZW1iZWRkZWQgdmlldyAobm90IGEgY29tcG9uZW50IHZpZXcpLlxuICAgIGlmIChsVmlldyAhPT0gbnVsbCkge1xuICAgICAgY29uc3QgaG9zdEVsZW1lbnQgPSBsVmlld1tIT1NUXTtcbiAgICAgIGlmIChob3N0RWxlbWVudCkge1xuICAgICAgICBjb25zdCBjb250ZXh0OiBIeWRyYXRpb25Db250ZXh0ID0ge1xuICAgICAgICAgIHNlcmlhbGl6ZWRWaWV3Q29sbGVjdGlvbixcbiAgICAgICAgICBjb3JydXB0ZWRUZXh0Tm9kZXMsXG4gICAgICAgIH07XG4gICAgICAgIGFubm90YXRlSG9zdEVsZW1lbnRGb3JIeWRyYXRpb24oaG9zdEVsZW1lbnQgYXMgSFRNTEVsZW1lbnQsIGxWaWV3LCBjb250ZXh0KTtcbiAgICAgICAgaW5zZXJ0Q29ycnVwdGVkVGV4dE5vZGVNYXJrZXJzKGNvcnJ1cHRlZFRleHROb2RlcywgZG9jKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgY29uc3QgYWxsU2VyaWFsaXplZFZpZXdzID0gc2VyaWFsaXplZFZpZXdDb2xsZWN0aW9uLmdldEFsbCgpO1xuICBpZiAoYWxsU2VyaWFsaXplZFZpZXdzLmxlbmd0aCA+IDApIHtcbiAgICBjb25zdCB0cmFuc2ZlclN0YXRlID0gYXBwUmVmLmluamVjdG9yLmdldChUcmFuc2ZlclN0YXRlKTtcbiAgICB0cmFuc2ZlclN0YXRlLnNldChOR0hfREFUQV9LRVksIGFsbFNlcmlhbGl6ZWRWaWV3cyk7XG4gIH1cbn1cblxuLyoqXG4gKiBTZXJpYWxpemVzIHRoZSBsQ29udGFpbmVyIGRhdGEgaW50byBhIGxpc3Qgb2YgU2VyaWFsaXplZFZpZXcgb2JqZWN0cyxcbiAqIHRoYXQgcmVwcmVzZW50IHZpZXdzIHdpdGhpbiB0aGlzIGxDb250YWluZXIuXG4gKlxuICogQHBhcmFtIGxDb250YWluZXIgdGhlIGxDb250YWluZXIgd2UgYXJlIHNlcmlhbGl6aW5nXG4gKiBAcGFyYW0gY29udGV4dCB0aGUgaHlkcmF0aW9uIGNvbnRleHRcbiAqIEByZXR1cm5zIGFuIGFycmF5IG9mIHRoZSBgU2VyaWFsaXplZFZpZXdgIG9iamVjdHNcbiAqL1xuZnVuY3Rpb24gc2VyaWFsaXplTENvbnRhaW5lcihcbiAgICBsQ29udGFpbmVyOiBMQ29udGFpbmVyLCBjb250ZXh0OiBIeWRyYXRpb25Db250ZXh0KTogU2VyaWFsaXplZENvbnRhaW5lclZpZXdbXSB7XG4gIGNvbnN0IHZpZXdzOiBTZXJpYWxpemVkQ29udGFpbmVyVmlld1tdID0gW107XG4gIGxldCBsYXN0Vmlld0FzU3RyaW5nOiBzdHJpbmcgPSAnJztcblxuICBmb3IgKGxldCBpID0gQ09OVEFJTkVSX0hFQURFUl9PRkZTRVQ7IGkgPCBsQ29udGFpbmVyLmxlbmd0aDsgaSsrKSB7XG4gICAgbGV0IGNoaWxkTFZpZXcgPSBsQ29udGFpbmVyW2ldIGFzIExWaWV3O1xuXG4gICAgLy8gSWYgdGhpcyBpcyBhIHJvb3QgdmlldywgZ2V0IGFuIExWaWV3IGZvciB0aGUgdW5kZXJseWluZyBjb21wb25lbnQsXG4gICAgLy8gYmVjYXVzZSBpdCBjb250YWlucyBpbmZvcm1hdGlvbiBhYm91dCB0aGUgdmlldyB0byBzZXJpYWxpemUuXG4gICAgaWYgKGlzUm9vdFZpZXcoY2hpbGRMVmlldykpIHtcbiAgICAgIGNoaWxkTFZpZXcgPSBjaGlsZExWaWV3W0hFQURFUl9PRkZTRVRdO1xuICAgIH1cbiAgICBjb25zdCBjaGlsZFRWaWV3ID0gY2hpbGRMVmlld1tUVklFV107XG5cbiAgICBsZXQgdGVtcGxhdGU6IHN0cmluZztcbiAgICBsZXQgbnVtUm9vdE5vZGVzID0gMDtcbiAgICBpZiAoY2hpbGRUVmlldy50eXBlID09PSBUVmlld1R5cGUuQ29tcG9uZW50KSB7XG4gICAgICB0ZW1wbGF0ZSA9IGNoaWxkVFZpZXcuc3NySWQhO1xuXG4gICAgICAvLyBUaGlzIGlzIGEgY29tcG9uZW50IHZpZXcsIHRodXMgaXQgaGFzIG9ubHkgMSByb290IG5vZGU6IHRoZSBjb21wb25lbnRcbiAgICAgIC8vIGhvc3Qgbm9kZSBpdHNlbGYgKG90aGVyIG5vZGVzIHdvdWxkIGJlIGluc2lkZSB0aGF0IGhvc3Qgbm9kZSkuXG4gICAgICBudW1Sb290Tm9kZXMgPSAxO1xuICAgIH0gZWxzZSB7XG4gICAgICB0ZW1wbGF0ZSA9IGdldFNzcklkKGNoaWxkVFZpZXcpO1xuICAgICAgbnVtUm9vdE5vZGVzID0gY2FsY051bVJvb3ROb2RlcyhjaGlsZFRWaWV3LCBjaGlsZExWaWV3LCBjaGlsZFRWaWV3LmZpcnN0Q2hpbGQpO1xuICAgIH1cblxuICAgIGNvbnN0IHZpZXc6IFNlcmlhbGl6ZWRDb250YWluZXJWaWV3ID0ge1xuICAgICAgW1RFTVBMQVRFX0lEXTogdGVtcGxhdGUsXG4gICAgICBbTlVNX1JPT1RfTk9ERVNdOiBudW1Sb290Tm9kZXMsXG4gICAgICAuLi5zZXJpYWxpemVMVmlldyhsQ29udGFpbmVyW2ldIGFzIExWaWV3LCBjb250ZXh0KSxcbiAgICB9O1xuXG4gICAgLy8gQ2hlY2sgaWYgdGhlIHByZXZpb3VzIHZpZXcgaGFzIHRoZSBzYW1lIHNoYXBlIChmb3IgZXhhbXBsZSwgaXQgd2FzXG4gICAgLy8gcHJvZHVjZWQgYnkgdGhlICpuZ0ZvciksIGluIHdoaWNoIGNhc2UgYnVtcCB0aGUgY291bnRlciBvbiB0aGUgcHJldmlvdXNcbiAgICAvLyB2aWV3IGluc3RlYWQgb2YgaW5jbHVkaW5nIHRoZSBzYW1lIGluZm9ybWF0aW9uIGFnYWluLlxuICAgIGNvbnN0IGN1cnJlbnRWaWV3QXNTdHJpbmcgPSBKU09OLnN0cmluZ2lmeSh2aWV3KTtcbiAgICBpZiAodmlld3MubGVuZ3RoID4gMCAmJiBjdXJyZW50Vmlld0FzU3RyaW5nID09PSBsYXN0Vmlld0FzU3RyaW5nKSB7XG4gICAgICBjb25zdCBwcmV2aW91c1ZpZXcgPSB2aWV3c1t2aWV3cy5sZW5ndGggLSAxXTtcbiAgICAgIHByZXZpb3VzVmlld1tNVUxUSVBMSUVSXSA/Pz0gMTtcbiAgICAgIHByZXZpb3VzVmlld1tNVUxUSVBMSUVSXSsrO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBSZWNvcmQgdGhpcyB2aWV3IGFzIG1vc3QgcmVjZW50bHkgYWRkZWQuXG4gICAgICBsYXN0Vmlld0FzU3RyaW5nID0gY3VycmVudFZpZXdBc1N0cmluZztcbiAgICAgIHZpZXdzLnB1c2godmlldyk7XG4gICAgfVxuICB9XG4gIHJldHVybiB2aWV3cztcbn1cblxuLyoqXG4gKiBIZWxwZXIgZnVuY3Rpb24gdG8gcHJvZHVjZSBhIG5vZGUgcGF0aCAod2hpY2ggbmF2aWdhdGlvbiBzdGVwcyBydW50aW1lIGxvZ2ljXG4gKiBuZWVkcyB0byB0YWtlIHRvIGxvY2F0ZSBhIG5vZGUpIGFuZCBzdG9yZXMgaXQgaW4gdGhlIGBOT0RFU2Agc2VjdGlvbiBvZiB0aGVcbiAqIGN1cnJlbnQgc2VyaWFsaXplZCB2aWV3LlxuICovXG5mdW5jdGlvbiBhcHBlbmRTZXJpYWxpemVkTm9kZVBhdGgobmdoOiBTZXJpYWxpemVkVmlldywgdE5vZGU6IFROb2RlLCBsVmlldzogTFZpZXcpIHtcbiAgY29uc3Qgbm9PZmZzZXRJbmRleCA9IHROb2RlLmluZGV4IC0gSEVBREVSX09GRlNFVDtcbiAgbmdoW05PREVTXSA/Pz0ge307XG4gIG5naFtOT0RFU11bbm9PZmZzZXRJbmRleF0gPSBjYWxjUGF0aEZvck5vZGUodE5vZGUsIGxWaWV3KTtcbn1cblxuLyoqXG4gKiBUaGVyZSBpcyBubyBzcGVjaWFsIFROb2RlIHR5cGUgZm9yIGFuIGkxOG4gYmxvY2ssIHNvIHdlIHZlcmlmeVxuICogd2hldGhlciB0aGUgc3RydWN0dXJlIHRoYXQgd2Ugc3RvcmUgYXQgdGhlIGBUVmlldy5kYXRhW2lkeF1gIHBvc2l0aW9uXG4gKiBoYXMgdGhlIGBUSTE4bmAgc2hhcGUuXG4gKi9cbmZ1bmN0aW9uIGlzVEkxOG5Ob2RlKG9iajogdW5rbm93bik6IGJvb2xlYW4ge1xuICBjb25zdCB0STE4biA9IG9iaiBhcyBUSTE4bjtcbiAgcmV0dXJuIHRJMThuLmhhc093blByb3BlcnR5KCdjcmVhdGUnKSAmJiB0STE4bi5oYXNPd25Qcm9wZXJ0eSgndXBkYXRlJyk7XG59XG5cbi8qKlxuICogU2VyaWFsaXplcyB0aGUgbFZpZXcgZGF0YSBpbnRvIGEgU2VyaWFsaXplZFZpZXcgb2JqZWN0IHRoYXQgd2lsbCBsYXRlciBiZSBhZGRlZFxuICogdG8gdGhlIFRyYW5zZmVyU3RhdGUgc3RvcmFnZSBhbmQgcmVmZXJlbmNlZCB1c2luZyB0aGUgYG5naGAgYXR0cmlidXRlIG9uIGEgaG9zdFxuICogZWxlbWVudC5cbiAqXG4gKiBAcGFyYW0gbFZpZXcgdGhlIGxWaWV3IHdlIGFyZSBzZXJpYWxpemluZ1xuICogQHBhcmFtIGNvbnRleHQgdGhlIGh5ZHJhdGlvbiBjb250ZXh0XG4gKiBAcmV0dXJucyB0aGUgYFNlcmlhbGl6ZWRWaWV3YCBvYmplY3QgY29udGFpbmluZyB0aGUgZGF0YSB0byBiZSBhZGRlZCB0byB0aGUgaG9zdCBub2RlXG4gKi9cbmZ1bmN0aW9uIHNlcmlhbGl6ZUxWaWV3KGxWaWV3OiBMVmlldywgY29udGV4dDogSHlkcmF0aW9uQ29udGV4dCk6IFNlcmlhbGl6ZWRWaWV3IHtcbiAgY29uc3QgbmdoOiBTZXJpYWxpemVkVmlldyA9IHt9O1xuICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgLy8gSXRlcmF0ZSBvdmVyIERPTSBlbGVtZW50IHJlZmVyZW5jZXMgaW4gYW4gTFZpZXcuXG4gIGZvciAobGV0IGkgPSBIRUFERVJfT0ZGU0VUOyBpIDwgdFZpZXcuYmluZGluZ1N0YXJ0SW5kZXg7IGkrKykge1xuICAgIGNvbnN0IHROb2RlID0gdFZpZXcuZGF0YVtpXSBhcyBUTm9kZTtcbiAgICBjb25zdCBub09mZnNldEluZGV4ID0gaSAtIEhFQURFUl9PRkZTRVQ7XG4gICAgLy8gTG9jYWwgcmVmcyAoZS5nLiA8ZGl2ICNsb2NhbFJlZj4pIHRha2UgdXAgYW4gZXh0cmEgc2xvdCBpbiBMVmlld3NcbiAgICAvLyB0byBzdG9yZSB0aGUgc2FtZSBlbGVtZW50LiBJbiB0aGlzIGNhc2UsIHRoZXJlIGlzIG5vIGluZm9ybWF0aW9uIGluXG4gICAgLy8gYSBjb3JyZXNwb25kaW5nIHNsb3QgaW4gVE5vZGUgZGF0YSBzdHJ1Y3R1cmUuIElmIHRoYXQncyB0aGUgY2FzZSwganVzdFxuICAgIC8vIHNraXAgdGhpcyBzbG90IGFuZCBtb3ZlIHRvIHRoZSBuZXh0IG9uZS5cbiAgICBpZiAoIXROb2RlKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgaWYgKEFycmF5LmlzQXJyYXkodE5vZGUucHJvamVjdGlvbikpIHtcbiAgICAgIGZvciAoY29uc3QgcHJvamVjdGlvbkhlYWRUTm9kZSBvZiB0Tm9kZS5wcm9qZWN0aW9uKSB7XG4gICAgICAgIC8vIFdlIG1heSBoYXZlIGBudWxsYHMgaW4gc2xvdHMgd2l0aCBubyBwcm9qZWN0ZWQgY29udGVudC5cbiAgICAgICAgaWYgKCFwcm9qZWN0aW9uSGVhZFROb2RlKSBjb250aW51ZTtcblxuICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkocHJvamVjdGlvbkhlYWRUTm9kZSkpIHtcbiAgICAgICAgICAvLyBJZiB3ZSBwcm9jZXNzIHJlLXByb2plY3RlZCBjb250ZW50IChpLmUuIGA8bmctY29udGVudD5gXG4gICAgICAgICAgLy8gYXBwZWFycyBhdCBwcm9qZWN0aW9uIGxvY2F0aW9uKSwgc2tpcCBhbm5vdGF0aW9ucyBmb3IgdGhpcyBjb250ZW50XG4gICAgICAgICAgLy8gc2luY2UgYWxsIERPTSBub2RlcyBpbiB0aGlzIHByb2plY3Rpb24gd2VyZSBoYW5kbGVkIHdoaWxlIHByb2Nlc3NpbmdcbiAgICAgICAgICAvLyBhIHBhcmVudCBsVmlldywgd2hpY2ggY29udGFpbnMgdGhvc2Ugbm9kZXMuXG4gICAgICAgICAgaWYgKCFpc1Byb2plY3Rpb25UTm9kZShwcm9qZWN0aW9uSGVhZFROb2RlKSAmJlxuICAgICAgICAgICAgICAhaXNJblNraXBIeWRyYXRpb25CbG9jayhwcm9qZWN0aW9uSGVhZFROb2RlKSkge1xuICAgICAgICAgICAgYXBwZW5kU2VyaWFsaXplZE5vZGVQYXRoKG5naCwgcHJvamVjdGlvbkhlYWRUTm9kZSwgbFZpZXcpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBJZiBhIHZhbHVlIGlzIGFuIGFycmF5LCBpdCBtZWFucyB0aGF0IHdlIGFyZSBwcm9jZXNzaW5nIGEgcHJvamVjdGlvblxuICAgICAgICAgIC8vIHdoZXJlIHByb2plY3RhYmxlIG5vZGVzIHdlcmUgcGFzc2VkIGluIGFzIERPTSBub2RlcyAoZm9yIGV4YW1wbGUsIHdoZW5cbiAgICAgICAgICAvLyBjYWxsaW5nIGBWaWV3Q29udGFpbmVyUmVmLmNyZWF0ZUNvbXBvbmVudChDbXBBLCB7cHJvamVjdGFibGVOb2RlczogWy4uLl19KWApLlxuICAgICAgICAgIC8vXG4gICAgICAgICAgLy8gSW4gdGhpcyBzY2VuYXJpbywgbm9kZXMgY2FuIGNvbWUgZnJvbSBhbnl3aGVyZSAoZWl0aGVyIGNyZWF0ZWQgbWFudWFsbHksXG4gICAgICAgICAgLy8gYWNjZXNzZWQgdmlhIGBkb2N1bWVudC5xdWVyeVNlbGVjdG9yYCwgZXRjKSBhbmQgbWF5IGJlIGluIGFueSBzdGF0ZVxuICAgICAgICAgIC8vIChhdHRhY2hlZCBvciBkZXRhY2hlZCBmcm9tIHRoZSBET00gdHJlZSkuIEFzIGEgcmVzdWx0LCB3ZSBjYW4gbm90IHJlbGlhYmx5XG4gICAgICAgICAgLy8gcmVzdG9yZSB0aGUgc3RhdGUgZm9yIHN1Y2ggY2FzZXMgZHVyaW5nIGh5ZHJhdGlvbi5cbiAgICAgICAgICB0aHJvdyB1bnN1cHBvcnRlZFByb2plY3Rpb25PZkRvbU5vZGVzKCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKGlzTENvbnRhaW5lcihsVmlld1tpXSkpIHtcbiAgICAgIC8vIFNlcmlhbGl6ZSBpbmZvcm1hdGlvbiBhYm91dCBhIHRlbXBsYXRlLlxuICAgICAgY29uc3QgZW1iZWRkZWRUVmlldyA9IHROb2RlLnRWaWV3O1xuICAgICAgaWYgKGVtYmVkZGVkVFZpZXcgIT09IG51bGwpIHtcbiAgICAgICAgbmdoW1RFTVBMQVRFU10gPz89IHt9O1xuICAgICAgICBuZ2hbVEVNUExBVEVTXVtub09mZnNldEluZGV4XSA9IGdldFNzcklkKGVtYmVkZGVkVFZpZXcpO1xuICAgICAgfVxuXG4gICAgICAvLyBTZXJpYWxpemUgdmlld3Mgd2l0aGluIHRoaXMgTENvbnRhaW5lci5cbiAgICAgIGNvbnN0IGhvc3ROb2RlID0gbFZpZXdbaV1bSE9TVF0hOyAgLy8gaG9zdCBub2RlIG9mIHRoaXMgY29udGFpbmVyXG5cbiAgICAgIC8vIExWaWV3W2ldW0hPU1RdIGNhbiBiZSBvZiAyIGRpZmZlcmVudCB0eXBlczpcbiAgICAgIC8vIC0gZWl0aGVyIGEgRE9NIG5vZGVcbiAgICAgIC8vIC0gb3IgYW4gYXJyYXkgdGhhdCByZXByZXNlbnRzIGFuIExWaWV3IG9mIGEgY29tcG9uZW50XG4gICAgICBpZiAoQXJyYXkuaXNBcnJheShob3N0Tm9kZSkpIHtcbiAgICAgICAgLy8gVGhpcyBpcyBhIGNvbXBvbmVudCwgc2VyaWFsaXplIGluZm8gYWJvdXQgaXQuXG4gICAgICAgIGNvbnN0IHRhcmdldE5vZGUgPSB1bndyYXBSTm9kZShob3N0Tm9kZSBhcyBMVmlldykgYXMgUkVsZW1lbnQ7XG4gICAgICAgIGlmICghKHRhcmdldE5vZGUgYXMgSFRNTEVsZW1lbnQpLmhhc0F0dHJpYnV0ZShTS0lQX0hZRFJBVElPTl9BVFRSX05BTUUpKSB7XG4gICAgICAgICAgYW5ub3RhdGVIb3N0RWxlbWVudEZvckh5ZHJhdGlvbih0YXJnZXROb2RlLCBob3N0Tm9kZSBhcyBMVmlldywgY29udGV4dCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIG5naFtDT05UQUlORVJTXSA/Pz0ge307XG4gICAgICBuZ2hbQ09OVEFJTkVSU11bbm9PZmZzZXRJbmRleF0gPSBzZXJpYWxpemVMQ29udGFpbmVyKGxWaWV3W2ldLCBjb250ZXh0KTtcbiAgICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkobFZpZXdbaV0pKSB7XG4gICAgICAvLyBUaGlzIGlzIGEgY29tcG9uZW50LCBhbm5vdGF0ZSB0aGUgaG9zdCBub2RlIHdpdGggYW4gYG5naGAgYXR0cmlidXRlLlxuICAgICAgY29uc3QgdGFyZ2V0Tm9kZSA9IHVud3JhcFJOb2RlKGxWaWV3W2ldW0hPU1RdISk7XG4gICAgICBpZiAoISh0YXJnZXROb2RlIGFzIEhUTUxFbGVtZW50KS5oYXNBdHRyaWJ1dGUoU0tJUF9IWURSQVRJT05fQVRUUl9OQU1FKSkge1xuICAgICAgICBhbm5vdGF0ZUhvc3RFbGVtZW50Rm9ySHlkcmF0aW9uKHRhcmdldE5vZGUgYXMgUkVsZW1lbnQsIGxWaWV3W2ldLCBjb250ZXh0KTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGlzVEkxOG5Ob2RlKHROb2RlKSkge1xuICAgICAgLy8gSHlkcmF0aW9uIGZvciBpMThuIG5vZGVzIGlzIG5vdCAqeWV0KiBzdXBwb3J0ZWQuXG4gICAgICAvLyBQcm9kdWNlIGFuIGVycm9yIG1lc3NhZ2Ugd2hpY2ggd291bGQgYWxzbyBkZXNjcmliZSBwb3NzaWJsZVxuICAgICAgLy8gc29sdXRpb25zIChzd2l0Y2hpbmcgYmFjayB0byB0aGUgXCJkZXN0cnVjdGl2ZVwiIGh5ZHJhdGlvbiBvclxuICAgICAgLy8gZXhjbHVkaW5nIGEgY29tcG9uZW50IGZyb20gaHlkcmF0aW9uIHZpYSBgbmdTa2lwSHlkcmF0aW9uYCkuXG4gICAgICB0aHJvdyBub3RZZXRTdXBwb3J0ZWRJMThuQmxvY2tFcnJvcigpO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyA8bmctY29udGFpbmVyPiBjYXNlXG4gICAgICBpZiAodE5vZGUudHlwZSAmIFROb2RlVHlwZS5FbGVtZW50Q29udGFpbmVyKSB7XG4gICAgICAgIC8vIEFuIDxuZy1jb250YWluZXI+IGlzIHJlcHJlc2VudGVkIGJ5IHRoZSBudW1iZXIgb2ZcbiAgICAgICAgLy8gdG9wLWxldmVsIG5vZGVzLiBUaGlzIGluZm9ybWF0aW9uIGlzIG5lZWRlZCB0byBza2lwIG92ZXJcbiAgICAgICAgLy8gdGhvc2Ugbm9kZXMgdG8gcmVhY2ggYSBjb3JyZXNwb25kaW5nIGFuY2hvciBub2RlIChjb21tZW50IG5vZGUpLlxuICAgICAgICBuZ2hbRUxFTUVOVF9DT05UQUlORVJTXSA/Pz0ge307XG4gICAgICAgIG5naFtFTEVNRU5UX0NPTlRBSU5FUlNdW25vT2Zmc2V0SW5kZXhdID0gY2FsY051bVJvb3ROb2Rlcyh0VmlldywgbFZpZXcsIHROb2RlLmNoaWxkKTtcbiAgICAgIH0gZWxzZSBpZiAodE5vZGUudHlwZSAmIFROb2RlVHlwZS5Qcm9qZWN0aW9uKSB7XG4gICAgICAgIC8vIEN1cnJlbnQgVE5vZGUgcmVwcmVzZW50cyBhbiBgPG5nLWNvbnRlbnQ+YCBzbG90LCB0aHVzIGl0IGhhcyBub1xuICAgICAgICAvLyBET00gZWxlbWVudHMgYXNzb2NpYXRlZCB3aXRoIGl0LCBzbyB0aGUgKipuZXh0IHNpYmxpbmcqKiBub2RlIHdvdWxkXG4gICAgICAgIC8vIG5vdCBiZSBhYmxlIHRvIGZpbmQgYW4gYW5jaG9yLiBJbiB0aGlzIGNhc2UsIHVzZSBmdWxsIHBhdGggaW5zdGVhZC5cbiAgICAgICAgbGV0IG5leHRUTm9kZSA9IHROb2RlLm5leHQ7XG4gICAgICAgIC8vIFNraXAgb3ZlciBhbGwgYDxuZy1jb250ZW50PmAgc2xvdHMgaW4gYSByb3cuXG4gICAgICAgIHdoaWxlIChuZXh0VE5vZGUgIT09IG51bGwgJiYgKG5leHRUTm9kZS50eXBlICYgVE5vZGVUeXBlLlByb2plY3Rpb24pKSB7XG4gICAgICAgICAgbmV4dFROb2RlID0gbmV4dFROb2RlLm5leHQ7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG5leHRUTm9kZSAmJiAhaXNJblNraXBIeWRyYXRpb25CbG9jayhuZXh0VE5vZGUpKSB7XG4gICAgICAgICAgLy8gSGFuZGxlIGEgdE5vZGUgYWZ0ZXIgdGhlIGA8bmctY29udGVudD5gIHNsb3QuXG4gICAgICAgICAgYXBwZW5kU2VyaWFsaXplZE5vZGVQYXRoKG5naCwgbmV4dFROb2RlLCBsVmlldyk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIEhhbmRsZSBjYXNlcyB3aGVyZSB0ZXh0IG5vZGVzIGNhbiBiZSBsb3N0IGFmdGVyIERPTSBzZXJpYWxpemF0aW9uOlxuICAgICAgICAvLyAgMS4gV2hlbiB0aGVyZSBpcyBhbiAqZW1wdHkgdGV4dCBub2RlKiBpbiBET006IGluIHRoaXMgY2FzZSwgdGhpc1xuICAgICAgICAvLyAgICAgbm9kZSB3b3VsZCBub3QgbWFrZSBpdCBpbnRvIHRoZSBzZXJpYWxpemVkIHN0cmluZyBhbmQgYXMgYSByZXN1bHQsXG4gICAgICAgIC8vICAgICB0aGlzIG5vZGUgd291bGRuJ3QgYmUgY3JlYXRlZCBpbiBhIGJyb3dzZXIuIFRoaXMgd291bGQgcmVzdWx0IGluXG4gICAgICAgIC8vICAgICBhIG1pc21hdGNoIGR1cmluZyB0aGUgaHlkcmF0aW9uLCB3aGVyZSB0aGUgcnVudGltZSBsb2dpYyB3b3VsZCBleHBlY3RcbiAgICAgICAgLy8gICAgIGEgdGV4dCBub2RlIHRvIGJlIHByZXNlbnQgaW4gbGl2ZSBET00sIGJ1dCBubyB0ZXh0IG5vZGUgd291bGQgZXhpc3QuXG4gICAgICAgIC8vICAgICBFeGFtcGxlOiBgPHNwYW4+e3sgbmFtZSB9fTwvc3Bhbj5gIHdoZW4gdGhlIGBuYW1lYCBpcyBhbiBlbXB0eSBzdHJpbmcuXG4gICAgICAgIC8vICAgICBUaGlzIHdvdWxkIHJlc3VsdCBpbiBgPHNwYW4+PC9zcGFuPmAgc3RyaW5nIGFmdGVyIHNlcmlhbGl6YXRpb24gYW5kXG4gICAgICAgIC8vICAgICBpbiBhIGJyb3dzZXIgb25seSB0aGUgYHNwYW5gIGVsZW1lbnQgd291bGQgYmUgY3JlYXRlZC4gVG8gcmVzb2x2ZSB0aGF0LFxuICAgICAgICAvLyAgICAgYW4gZXh0cmEgY29tbWVudCBub2RlIGlzIGFwcGVuZGVkIGluIHBsYWNlIG9mIGFuIGVtcHR5IHRleHQgbm9kZSBhbmRcbiAgICAgICAgLy8gICAgIHRoYXQgc3BlY2lhbCBjb21tZW50IG5vZGUgaXMgcmVwbGFjZWQgd2l0aCBhbiBlbXB0eSB0ZXh0IG5vZGUgKmJlZm9yZSpcbiAgICAgICAgLy8gICAgIGh5ZHJhdGlvbi5cbiAgICAgICAgLy8gIDIuIFdoZW4gdGhlcmUgYXJlIDIgY29uc2VjdXRpdmUgdGV4dCBub2RlcyBwcmVzZW50IGluIHRoZSBET00uXG4gICAgICAgIC8vICAgICBFeGFtcGxlOiBgPGRpdj5IZWxsbyA8bmctY29udGFpbmVyICpuZ0lmPVwidHJ1ZVwiPndvcmxkPC9uZy1jb250YWluZXI+PC9kaXY+YC5cbiAgICAgICAgLy8gICAgIEluIHRoaXMgc2NlbmFyaW8sIHRoZSBsaXZlIERPTSB3b3VsZCBsb29rIGxpa2UgdGhpczpcbiAgICAgICAgLy8gICAgICAgPGRpdj4jdGV4dCgnSGVsbG8gJykgI3RleHQoJ3dvcmxkJykgI2NvbW1lbnQoJ2NvbnRhaW5lcicpPC9kaXY+XG4gICAgICAgIC8vICAgICBTZXJpYWxpemVkIHN0cmluZyB3b3VsZCBsb29rIGxpa2UgdGhpczogYDxkaXY+SGVsbG8gd29ybGQ8IS0tY29udGFpbmVyLS0+PC9kaXY+YC5cbiAgICAgICAgLy8gICAgIFRoZSBsaXZlIERPTSBpbiBhIGJyb3dzZXIgYWZ0ZXIgdGhhdCB3b3VsZCBiZTpcbiAgICAgICAgLy8gICAgICAgPGRpdj4jdGV4dCgnSGVsbG8gd29ybGQnKSAjY29tbWVudCgnY29udGFpbmVyJyk8L2Rpdj5cbiAgICAgICAgLy8gICAgIE5vdGljZSBob3cgMiB0ZXh0IG5vZGVzIGFyZSBub3cgXCJtZXJnZWRcIiBpbnRvIG9uZS4gVGhpcyB3b3VsZCBjYXVzZSBoeWRyYXRpb25cbiAgICAgICAgLy8gICAgIGxvZ2ljIHRvIGZhaWwsIHNpbmNlIGl0J2QgZXhwZWN0IDIgdGV4dCBub2RlcyBiZWluZyBwcmVzZW50LCBub3Qgb25lLlxuICAgICAgICAvLyAgICAgVG8gZml4IHRoaXMsIHdlIGluc2VydCBhIHNwZWNpYWwgY29tbWVudCBub2RlIGluIGJldHdlZW4gdGhvc2UgdGV4dCBub2Rlcywgc29cbiAgICAgICAgLy8gICAgIHNlcmlhbGl6ZWQgcmVwcmVzZW50YXRpb24gaXM6IGA8ZGl2PkhlbGxvIDwhLS1uZ3Rucy0tPndvcmxkPCEtLWNvbnRhaW5lci0tPjwvZGl2PmAuXG4gICAgICAgIC8vICAgICBUaGlzIGZvcmNlcyBicm93c2VyIHRvIGNyZWF0ZSAyIHRleHQgbm9kZXMgc2VwYXJhdGVkIGJ5IGEgY29tbWVudCBub2RlLlxuICAgICAgICAvLyAgICAgQmVmb3JlIHJ1bm5pbmcgYSBoeWRyYXRpb24gcHJvY2VzcywgdGhpcyBzcGVjaWFsIGNvbW1lbnQgbm9kZSBpcyByZW1vdmVkLCBzbyB0aGVcbiAgICAgICAgLy8gICAgIGxpdmUgRE9NIGhhcyBleGFjdGx5IHRoZSBzYW1lIHN0YXRlIGFzIGl0IHdhcyBiZWZvcmUgc2VyaWFsaXphdGlvbi5cbiAgICAgICAgaWYgKHROb2RlLnR5cGUgJiBUTm9kZVR5cGUuVGV4dCkge1xuICAgICAgICAgIGNvbnN0IHJOb2RlID0gdW53cmFwUk5vZGUobFZpZXdbaV0pIGFzIEhUTUxFbGVtZW50O1xuICAgICAgICAgIGlmIChyTm9kZS50ZXh0Q29udGVudD8ucmVwbGFjZSgvXFxzL2dtLCAnJykgPT09ICcnKSB7XG4gICAgICAgICAgICBjb250ZXh0LmNvcnJ1cHRlZFRleHROb2Rlcy5zZXQock5vZGUsIFRleHROb2RlTWFya2VyLkVtcHR5Tm9kZSk7XG4gICAgICAgICAgfSBlbHNlIGlmIChyTm9kZS5uZXh0U2libGluZz8ubm9kZVR5cGUgPT09IE5vZGUuVEVYVF9OT0RFKSB7XG4gICAgICAgICAgICBjb250ZXh0LmNvcnJ1cHRlZFRleHROb2Rlcy5zZXQock5vZGUsIFRleHROb2RlTWFya2VyLlNlcGFyYXRvcik7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHROb2RlLnByb2plY3Rpb25OZXh0ICYmIHROb2RlLnByb2plY3Rpb25OZXh0ICE9PSB0Tm9kZS5uZXh0ICYmXG4gICAgICAgICAgICAhaXNJblNraXBIeWRyYXRpb25CbG9jayh0Tm9kZS5wcm9qZWN0aW9uTmV4dCkpIHtcbiAgICAgICAgICAvLyBDaGVjayBpZiBwcm9qZWN0aW9uIG5leHQgaXMgbm90IHRoZSBzYW1lIGFzIG5leHQsIGluIHdoaWNoIGNhc2VcbiAgICAgICAgICAvLyB0aGUgbm9kZSB3b3VsZCBub3QgYmUgZm91bmQgYXQgY3JlYXRpb24gdGltZSBhdCBydW50aW1lIGFuZCB3ZVxuICAgICAgICAgIC8vIG5lZWQgdG8gcHJvdmlkZSBhIGxvY2F0aW9uIGZvciB0aGF0IG5vZGUuXG4gICAgICAgICAgYXBwZW5kU2VyaWFsaXplZE5vZGVQYXRoKG5naCwgdE5vZGUucHJvamVjdGlvbk5leHQsIGxWaWV3KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gbmdoO1xufVxuXG4vKipcbiAqIFBoeXNpY2FsbHkgYWRkcyB0aGUgYG5naGAgYXR0cmlidXRlIGFuZCBzZXJpYWxpemVkIGRhdGEgdG8gdGhlIGhvc3QgZWxlbWVudC5cbiAqXG4gKiBAcGFyYW0gZWxlbWVudCBUaGUgSG9zdCBlbGVtZW50IHRvIGJlIGFubm90YXRlZFxuICogQHBhcmFtIGxWaWV3IFRoZSBhc3NvY2lhdGVkIExWaWV3XG4gKiBAcGFyYW0gY29udGV4dCBUaGUgaHlkcmF0aW9uIGNvbnRleHRcbiAqL1xuZnVuY3Rpb24gYW5ub3RhdGVIb3N0RWxlbWVudEZvckh5ZHJhdGlvbihcbiAgICBlbGVtZW50OiBSRWxlbWVudCwgbFZpZXc6IExWaWV3LCBjb250ZXh0OiBIeWRyYXRpb25Db250ZXh0KTogdm9pZCB7XG4gIGNvbnN0IG5naCA9IHNlcmlhbGl6ZUxWaWV3KGxWaWV3LCBjb250ZXh0KTtcbiAgY29uc3QgaW5kZXggPSBjb250ZXh0LnNlcmlhbGl6ZWRWaWV3Q29sbGVjdGlvbi5hZGQobmdoKTtcbiAgY29uc3QgcmVuZGVyZXIgPSBsVmlld1tSRU5ERVJFUl07XG4gIHJlbmRlcmVyLnNldEF0dHJpYnV0ZShlbGVtZW50LCBOR0hfQVRUUl9OQU1FLCBpbmRleC50b1N0cmluZygpKTtcbn1cblxuLyoqXG4gKiBQaHlzaWNhbGx5IGluc2VydHMgdGhlIGNvbW1lbnQgbm9kZXMgdG8gZW5zdXJlIGVtcHR5IHRleHQgbm9kZXMgYW5kIGFkamFjZW50XG4gKiB0ZXh0IG5vZGUgc2VwYXJhdG9ycyBhcmUgcHJlc2VydmVkIGFmdGVyIHNlcnZlciBzZXJpYWxpemF0aW9uIG9mIHRoZSBET00uXG4gKiBUaGVzZSBnZXQgc3dhcHBlZCBiYWNrIGZvciBlbXB0eSB0ZXh0IG5vZGVzIG9yIHNlcGFyYXRvcnMgb25jZSBoeWRyYXRpb24gaGFwcGVuc1xuICogb24gdGhlIGNsaWVudC5cbiAqXG4gKiBAcGFyYW0gY29ycnVwdGVkVGV4dE5vZGVzIFRoZSBNYXAgb2YgdGV4dCBub2RlcyB0byBiZSByZXBsYWNlZCB3aXRoIGNvbW1lbnRzXG4gKiBAcGFyYW0gZG9jIFRoZSBkb2N1bWVudFxuICovXG5mdW5jdGlvbiBpbnNlcnRDb3JydXB0ZWRUZXh0Tm9kZU1hcmtlcnMoXG4gICAgY29ycnVwdGVkVGV4dE5vZGVzOiBNYXA8SFRNTEVsZW1lbnQsIHN0cmluZz4sIGRvYzogRG9jdW1lbnQpIHtcbiAgZm9yIChjb25zdCBbdGV4dE5vZGUsIG1hcmtlcl0gb2YgY29ycnVwdGVkVGV4dE5vZGVzKSB7XG4gICAgdGV4dE5vZGUuYWZ0ZXIoZG9jLmNyZWF0ZUNvbW1lbnQobWFya2VyKSk7XG4gIH1cbn1cbiJdfQ==