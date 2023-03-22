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
        // Check if a native node that represents a given TNode is disconnected from the DOM tree.
        // Such nodes must be excluded from the hydration (since the hydration won't be able to
        // find them), so the TNode ids are collected and used at runtime to skip the hydration.
        //
        // This situation may happen during the content projection, when some nodes don't make it
        // into one of the content projection slots (for example, when there is no default
        // <ng-content /> slot in projector component's template).
        //
        // Note: we leverage the fact that we have this information available in the DOM emulation
        // layer (in Domino) for now. Longer-term solution should not rely on the DOM emulation and
        // only use internal data structures and state to compute this information.
        if (!(tNode.type & 16 /* TNodeType.Projection */) && !!lView[i] &&
            !unwrapRNode(lView[i]).isConnected) {
            ngh[DISCONNECTED_NODES] ?? (ngh[DISCONNECTED_NODES] = []);
            ngh[DISCONNECTED_NODES].push(noOffsetIndex);
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
                    throw unsupportedProjectionOfDomNodes(unwrapRNode(lView[i]));
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
            //
            // TODO(akushnir): we should find a better way to get a hold of the node that has the `i18n`
            // attribute on it. For now, we either refer to the host element of the component or to the
            // previous element in the LView.
            const targetNode = (i === HEADER_OFFSET) ? lView[HOST] : unwrapRNode(lView[i - 1]);
            throw notYetSupportedI18nBlockError(targetNode);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYW5ub3RhdGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9oeWRyYXRpb24vYW5ub3RhdGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBR0gsT0FBTyxFQUFDLGtCQUFrQixFQUFDLE1BQU0saUNBQWlDLENBQUM7QUFDbkUsT0FBTyxFQUFDLHVCQUF1QixFQUFhLE1BQU0saUNBQWlDLENBQUM7QUFJcEYsT0FBTyxFQUFDLFlBQVksRUFBRSxpQkFBaUIsRUFBRSxVQUFVLEVBQUMsTUFBTSxtQ0FBbUMsQ0FBQztBQUM5RixPQUFPLEVBQUMsYUFBYSxFQUFFLElBQUksRUFBUyxRQUFRLEVBQVMsS0FBSyxFQUFZLE1BQU0sNEJBQTRCLENBQUM7QUFDekcsT0FBTyxFQUFDLFdBQVcsRUFBQyxNQUFNLDRCQUE0QixDQUFDO0FBQ3ZELE9BQU8sRUFBQyxhQUFhLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUVoRCxPQUFPLEVBQUMsNkJBQTZCLEVBQUUsK0JBQStCLEVBQUMsTUFBTSxrQkFBa0IsQ0FBQztBQUNoRyxPQUFPLEVBQUMsVUFBVSxFQUFFLGtCQUFrQixFQUFFLGtCQUFrQixFQUFFLFVBQVUsRUFBRSxLQUFLLEVBQUUsY0FBYyxFQUEyQyxXQUFXLEVBQUUsU0FBUyxFQUFDLE1BQU0sY0FBYyxDQUFDO0FBQ3BMLE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUNwRCxPQUFPLEVBQUMsc0JBQXNCLEVBQUUsd0JBQXdCLEVBQUMsTUFBTSxrQkFBa0IsQ0FBQztBQUNsRixPQUFPLEVBQUMsNkJBQTZCLEVBQUUsYUFBYSxFQUFFLFlBQVksRUFBaUIsTUFBTSxTQUFTLENBQUM7QUFFbkc7Ozs7O0dBS0c7QUFDSCxNQUFNLHdCQUF3QjtJQUE5QjtRQUNVLFVBQUssR0FBcUIsRUFBRSxDQUFDO1FBQzdCLG1CQUFjLEdBQUcsSUFBSSxH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QUFHLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDeEQsTUFBTSxRQUFRLEdBQUcsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQ2pDLFFBQVEsQ0FBQyxZQUFZLENBQUMsT0FBTyxFQUFFLGFBQWEsRUFBRSxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztBQUNsRSxDQUFDO0FBRUQ7Ozs7Ozs7O0dBUUc7QUFDSCxTQUFTLDhCQUE4QixDQUNuQyxrQkFBNEMsRUFBRSxHQUFhO0lBQzdELEtBQUssTUFBTSxDQUFDLFFBQVEsRUFBRSxNQUFNLENBQUMsSUFBSSxrQkFBa0IsRUFBRTtRQUNuRCxRQUFRLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztLQUMzQztBQUNILENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtBcHBsaWNhdGlvblJlZn0gZnJvbSAnLi4vYXBwbGljYXRpb25fcmVmJztcbmltcG9ydCB7Y29sbGVjdE5hdGl2ZU5vZGVzfSBmcm9tICcuLi9yZW5kZXIzL2NvbGxlY3RfbmF0aXZlX25vZGVzJztcbmltcG9ydCB7Q09OVEFJTkVSX0hFQURFUl9PRkZTRVQsIExDb250YWluZXJ9IGZyb20gJy4uL3JlbmRlcjMvaW50ZXJmYWNlcy9jb250YWluZXInO1xuaW1wb3J0IHtUSTE4bn0gZnJvbSAnLi4vcmVuZGVyMy9pbnRlcmZhY2VzL2kxOG4nO1xuaW1wb3J0IHtUTm9kZSwgVE5vZGVUeXBlfSBmcm9tICcuLi9yZW5kZXIzL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge1JFbGVtZW50fSBmcm9tICcuLi9yZW5kZXIzL2ludGVyZmFjZXMvcmVuZGVyZXJfZG9tJztcbmltcG9ydCB7aXNMQ29udGFpbmVyLCBpc1Byb2plY3Rpb25UTm9kZSwgaXNSb290Vmlld30gZnJvbSAnLi4vcmVuZGVyMy9pbnRlcmZhY2VzL3R5cGVfY2hlY2tzJztcbmltcG9ydCB7SEVBREVSX09GRlNFVCwgSE9TVCwgTFZpZXcsIFJFTkRFUkVSLCBUVmlldywgVFZJRVcsIFRWaWV3VHlwZX0gZnJvbSAnLi4vcmVuZGVyMy9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHt1bndyYXBSTm9kZX0gZnJvbSAnLi4vcmVuZGVyMy91dGlsL3ZpZXdfdXRpbHMnO1xuaW1wb3J0IHtUcmFuc2ZlclN0YXRlfSBmcm9tICcuLi90cmFuc2Zlcl9zdGF0ZSc7XG5cbmltcG9ydCB7bm90WWV0U3VwcG9ydGVkSTE4bkJsb2NrRXJyb3IsIHVuc3VwcG9ydGVkUHJvamVjdGlvbk9mRG9tTm9kZXN9IGZyb20gJy4vZXJyb3JfaGFuZGxpbmcnO1xuaW1wb3J0IHtDT05UQUlORVJTLCBESVNDT05ORUNURURfTk9ERVMsIEVMRU1FTlRfQ09OVEFJTkVSUywgTVVMVElQTElFUiwgTk9ERVMsIE5VTV9ST09UX05PREVTLCBTZXJpYWxpemVkQ29udGFpbmVyVmlldywgU2VyaWFsaXplZFZpZXcsIFRFTVBMQVRFX0lELCBURU1QTEFURVN9IGZyb20gJy4vaW50ZXJmYWNlcyc7XG5pbXBvcnQge2NhbGNQYXRoRm9yTm9kZX0gZnJvbSAnLi9ub2RlX2xvb2t1cF91dGlscyc7XG5pbXBvcnQge2lzSW5Ta2lwSHlkcmF0aW9uQmxvY2ssIFNLSVBfSFlEUkFUSU9OX0FUVFJfTkFNRX0gZnJvbSAnLi9za2lwX2h5ZHJhdGlvbic7XG5pbXBvcnQge2dldENvbXBvbmVudExWaWV3Rm9ySHlkcmF0aW9uLCBOR0hfQVRUUl9OQU1FLCBOR0hfREFUQV9LRVksIFRleHROb2RlTWFya2VyfSBmcm9tICcuL3V0aWxzJztcblxuLyoqXG4gKiBBIGNvbGxlY3Rpb24gdGhhdCB0cmFja3MgYWxsIHNlcmlhbGl6ZWQgdmlld3MgKGBuZ2hgIERPTSBhbm5vdGF0aW9ucylcbiAqIHRvIGF2b2lkIGR1cGxpY2F0aW9uLiBBbiBhdHRlbXB0IHRvIGFkZCBhIGR1cGxpY2F0ZSB2aWV3IHJlc3VsdHMgaW4gdGhlXG4gKiBjb2xsZWN0aW9uIHJldHVybmluZyB0aGUgaW5kZXggb2YgdGhlIHByZXZpb3VzbHkgY29sbGVjdGVkIHNlcmlhbGl6ZWQgdmlldy5cbiAqIFRoaXMgcmVkdWNlcyB0aGUgbnVtYmVyIG9mIGFubm90YXRpb25zIG5lZWRlZCBmb3IgYSBnaXZlbiBwYWdlLlxuICovXG5jbGFzcyBTZXJpYWxpemVkVmlld0NvbGxlY3Rpb24ge1xuICBwcml2YXRlIHZpZXdzOiBTZXJpYWxpemVkVmlld1tdID0gW107XG4gIHByaXZhdGUgaW5kZXhCeUNvbnRlbnQgPSBuZXcgTWFwPHN0cmluZywgbnVtYmVyPigpO1xuXG4gIGFkZChzZXJpYWxpemVkVmlldzogU2VyaWFsaXplZFZpZXcpOiBudW1iZXIge1xuICAgIGNvbnN0IHZpZXdBc1N0cmluZyA9IEpTT04uc3RyaW5naWZ5KHNlcmlhbGl6ZWRWaWV3KTtcbiAgICBpZiAoIXRoaXMuaW5kZXhCeUNvbnRlbnQuaGFzKHZpZXdBc1N0cmluZykpIHtcbiAgICAgIGNvbnN0IGluZGV4ID0gdGhpcy52aWV3cy5sZW5ndGg7XG4gICAgICB0aGlzLnZpZXdzLnB1c2goc2VyaWFsaXplZFZpZXcpO1xuICAgICAgdGhpcy5pbmRleEJ5Q29udGVudC5zZXQodmlld0FzU3RyaW5nLCBpbmRleCk7XG4gICAgICByZXR1cm4gaW5kZXg7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLmluZGV4QnlDb250ZW50LmdldCh2aWV3QXNTdHJpbmcpITtcbiAgfVxuXG4gIGdldEFsbCgpOiBTZXJpYWxpemVkVmlld1tdIHtcbiAgICByZXR1cm4gdGhpcy52aWV3cztcbiAgfVxufVxuXG4vKipcbiAqIEdsb2JhbCBjb3VudGVyIHRoYXQgaXMgdXNlZCB0byBnZW5lcmF0ZSBhIHVuaXF1ZSBpZCBmb3IgVFZpZXdzXG4gKiBkdXJpbmcgdGhlIHNlcmlhbGl6YXRpb24gcHJvY2Vzcy5cbiAqL1xubGV0IHRWaWV3U3NySWQgPSAwO1xuXG4vKipcbiAqIEdlbmVyYXRlcyBhIHVuaXF1ZSBpZCBmb3IgYSBnaXZlbiBUVmlldyBhbmQgcmV0dXJucyB0aGlzIGlkLlxuICogVGhlIGlkIGlzIGFsc28gc3RvcmVkIG9uIHRoaXMgaW5zdGFuY2Ugb2YgYSBUVmlldyBhbmQgcmV1c2VkIGluXG4gKiBzdWJzZXF1ZW50IGNhbGxzLlxuICpcbiAqIFRoaXMgaWQgaXMgbmVlZGVkIHRvIHVuaXF1ZWx5IGlkZW50aWZ5IGFuZCBwaWNrIHVwIGRlaHlkcmF0ZWQgdmlld3NcbiAqIGF0IHJ1bnRpbWUuXG4gKi9cbmZ1bmN0aW9uIGdldFNzcklkKHRWaWV3OiBUVmlldyk6IHN0cmluZyB7XG4gIGlmICghdFZpZXcuc3NySWQpIHtcbiAgICB0Vmlldy5zc3JJZCA9IGB0JHt0Vmlld1NzcklkKyt9YDtcbiAgfVxuICByZXR1cm4gdFZpZXcuc3NySWQ7XG59XG5cbi8qKlxuICogRGVzY3JpYmVzIGEgY29udGV4dCBhdmFpbGFibGUgZHVyaW5nIHRoZSBzZXJpYWxpemF0aW9uXG4gKiBwcm9jZXNzLiBUaGUgY29udGV4dCBpcyB1c2VkIHRvIHNoYXJlIGFuZCBjb2xsZWN0IGluZm9ybWF0aW9uXG4gKiBkdXJpbmcgdGhlIHNlcmlhbGl6YXRpb24uXG4gKi9cbmludGVyZmFjZSBIeWRyYXRpb25Db250ZXh0IHtcbiAgc2VyaWFsaXplZFZpZXdDb2xsZWN0aW9uOiBTZXJpYWxpemVkVmlld0NvbGxlY3Rpb247XG4gIGNvcnJ1cHRlZFRleHROb2RlczogTWFwPEhUTUxFbGVtZW50LCBUZXh0Tm9kZU1hcmtlcj47XG59XG5cbi8qKlxuICogQ29tcHV0ZXMgdGhlIG51bWJlciBvZiByb290IG5vZGVzIGluIGEgZ2l2ZW4gdmlld1xuICogKG9yIGNoaWxkIG5vZGVzIGluIGEgZ2l2ZW4gY29udGFpbmVyIGlmIGEgdE5vZGUgaXMgcHJvdmlkZWQpLlxuICovXG5mdW5jdGlvbiBjYWxjTnVtUm9vdE5vZGVzKHRWaWV3OiBUVmlldywgbFZpZXc6IExWaWV3LCB0Tm9kZTogVE5vZGV8bnVsbCk6IG51bWJlciB7XG4gIGNvbnN0IHJvb3ROb2RlczogdW5rbm93bltdID0gW107XG4gIGNvbGxlY3ROYXRpdmVOb2Rlcyh0VmlldywgbFZpZXcsIHROb2RlLCByb290Tm9kZXMpO1xuICByZXR1cm4gcm9vdE5vZGVzLmxlbmd0aDtcbn1cblxuLyoqXG4gKiBBbm5vdGF0ZXMgYWxsIGNvbXBvbmVudHMgYm9vdHN0cmFwcGVkIGluIGEgZ2l2ZW4gQXBwbGljYXRpb25SZWZcbiAqIHdpdGggaW5mbyBuZWVkZWQgZm9yIGh5ZHJhdGlvbi5cbiAqXG4gKiBAcGFyYW0gYXBwUmVmIEFuIGluc3RhbmNlIG9mIGFuIEFwcGxpY2F0aW9uUmVmLlxuICogQHBhcmFtIGRvYyBBIHJlZmVyZW5jZSB0byB0aGUgY3VycmVudCBEb2N1bWVudCBpbnN0YW5jZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFubm90YXRlRm9ySHlkcmF0aW9uKGFwcFJlZjogQXBwbGljYXRpb25SZWYsIGRvYzogRG9jdW1lbnQpIHtcbiAgY29uc3Qgc2VyaWFsaXplZFZpZXdDb2xsZWN0aW9uID0gbmV3IFNlcmlhbGl6ZWRWaWV3Q29sbGVjdGlvbigpO1xuICBjb25zdCBjb3JydXB0ZWRUZXh0Tm9kZXMgPSBuZXcgTWFwPEhUTUxFbGVtZW50LCBUZXh0Tm9kZU1hcmtlcj4oKTtcbiAgY29uc3Qgdmlld1JlZnMgPSBhcHBSZWYuX3ZpZXdzO1xuICBmb3IgKGNvbnN0IHZpZXdSZWYgb2Ygdmlld1JlZnMpIHtcbiAgICBjb25zdCBsVmlldyA9IGdldENvbXBvbmVudExWaWV3Rm9ySHlkcmF0aW9uKHZpZXdSZWYpO1xuICAgIC8vIEFuIGBsVmlld2AgbWlnaHQgYmUgYG51bGxgIGlmIGEgYFZpZXdSZWZgIHJlcHJlc2VudHNcbiAgICAvLyBhbiBlbWJlZGRlZCB2aWV3IChub3QgYSBjb21wb25lbnQgdmlldykuXG4gICAgaWYgKGxWaWV3ICE9PSBudWxsKSB7XG4gICAgICBjb25zdCBob3N0RWxlbWVudCA9IGxWaWV3W0hPU1RdO1xuICAgICAgaWYgKGhvc3RFbGVtZW50KSB7XG4gICAgICAgIGNvbnN0IGNvbnRleHQ6IEh5ZHJhdGlvbkNvbnRleHQgPSB7XG4gICAgICAgICAgc2VyaWFsaXplZFZpZXdDb2xsZWN0aW9uLFxuICAgICAgICAgIGNvcnJ1cHRlZFRleHROb2RlcyxcbiAgICAgICAgfTtcbiAgICAgICAgYW5ub3RhdGVIb3N0RWxlbWVudEZvckh5ZHJhdGlvbihob3N0RWxlbWVudCBhcyBIVE1MRWxlbWVudCwgbFZpZXcsIGNvbnRleHQpO1xuICAgICAgICBpbnNlcnRDb3JydXB0ZWRUZXh0Tm9kZU1hcmtlcnMoY29ycnVwdGVkVGV4dE5vZGVzLCBkb2MpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICBjb25zdCBhbGxTZXJpYWxpemVkVmlld3MgPSBzZXJpYWxpemVkVmlld0NvbGxlY3Rpb24uZ2V0QWxsKCk7XG4gIGlmIChhbGxTZXJpYWxpemVkVmlld3MubGVuZ3RoID4gMCkge1xuICAgIGNvbnN0IHRyYW5zZmVyU3RhdGUgPSBhcHBSZWYuaW5qZWN0b3IuZ2V0KFRyYW5zZmVyU3RhdGUpO1xuICAgIHRyYW5zZmVyU3RhdGUuc2V0KE5HSF9EQVRBX0tFWSwgYWxsU2VyaWFsaXplZFZpZXdzKTtcbiAgfVxufVxuXG4vKipcbiAqIFNlcmlhbGl6ZXMgdGhlIGxDb250YWluZXIgZGF0YSBpbnRvIGEgbGlzdCBvZiBTZXJpYWxpemVkVmlldyBvYmplY3RzLFxuICogdGhhdCByZXByZXNlbnQgdmlld3Mgd2l0aGluIHRoaXMgbENvbnRhaW5lci5cbiAqXG4gKiBAcGFyYW0gbENvbnRhaW5lciB0aGUgbENvbnRhaW5lciB3ZSBhcmUgc2VyaWFsaXppbmdcbiAqIEBwYXJhbSBjb250ZXh0IHRoZSBoeWRyYXRpb24gY29udGV4dFxuICogQHJldHVybnMgYW4gYXJyYXkgb2YgdGhlIGBTZXJpYWxpemVkVmlld2Agb2JqZWN0c1xuICovXG5mdW5jdGlvbiBzZXJpYWxpemVMQ29udGFpbmVyKFxuICAgIGxDb250YWluZXI6IExDb250YWluZXIsIGNvbnRleHQ6IEh5ZHJhdGlvbkNvbnRleHQpOiBTZXJpYWxpemVkQ29udGFpbmVyVmlld1tdIHtcbiAgY29uc3Qgdmlld3M6IFNlcmlhbGl6ZWRDb250YWluZXJWaWV3W10gPSBbXTtcbiAgbGV0IGxhc3RWaWV3QXNTdHJpbmc6IHN0cmluZyA9ICcnO1xuXG4gIGZvciAobGV0IGkgPSBDT05UQUlORVJfSEVBREVSX09GRlNFVDsgaSA8IGxDb250YWluZXIubGVuZ3RoOyBpKyspIHtcbiAgICBsZXQgY2hpbGRMVmlldyA9IGxDb250YWluZXJbaV0gYXMgTFZpZXc7XG5cbiAgICAvLyBJZiB0aGlzIGlzIGEgcm9vdCB2aWV3LCBnZXQgYW4gTFZpZXcgZm9yIHRoZSB1bmRlcmx5aW5nIGNvbXBvbmVudCxcbiAgICAvLyBiZWNhdXNlIGl0IGNvbnRhaW5zIGluZm9ybWF0aW9uIGFib3V0IHRoZSB2aWV3IHRvIHNlcmlhbGl6ZS5cbiAgICBpZiAoaXNSb290VmlldyhjaGlsZExWaWV3KSkge1xuICAgICAgY2hpbGRMVmlldyA9IGNoaWxkTFZpZXdbSEVBREVSX09GRlNFVF07XG4gICAgfVxuICAgIGNvbnN0IGNoaWxkVFZpZXcgPSBjaGlsZExWaWV3W1RWSUVXXTtcblxuICAgIGxldCB0ZW1wbGF0ZTogc3RyaW5nO1xuICAgIGxldCBudW1Sb290Tm9kZXMgPSAwO1xuICAgIGlmIChjaGlsZFRWaWV3LnR5cGUgPT09IFRWaWV3VHlwZS5Db21wb25lbnQpIHtcbiAgICAgIHRlbXBsYXRlID0gY2hpbGRUVmlldy5zc3JJZCE7XG5cbiAgICAgIC8vIFRoaXMgaXMgYSBjb21wb25lbnQgdmlldywgdGh1cyBpdCBoYXMgb25seSAxIHJvb3Qgbm9kZTogdGhlIGNvbXBvbmVudFxuICAgICAgLy8gaG9zdCBub2RlIGl0c2VsZiAob3RoZXIgbm9kZXMgd291bGQgYmUgaW5zaWRlIHRoYXQgaG9zdCBub2RlKS5cbiAgICAgIG51bVJvb3ROb2RlcyA9IDE7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRlbXBsYXRlID0gZ2V0U3NySWQoY2hpbGRUVmlldyk7XG4gICAgICBudW1Sb290Tm9kZXMgPSBjYWxjTnVtUm9vdE5vZGVzKGNoaWxkVFZpZXcsIGNoaWxkTFZpZXcsIGNoaWxkVFZpZXcuZmlyc3RDaGlsZCk7XG4gICAgfVxuXG4gICAgY29uc3QgdmlldzogU2VyaWFsaXplZENvbnRhaW5lclZpZXcgPSB7XG4gICAgICBbVEVNUExBVEVfSURdOiB0ZW1wbGF0ZSxcbiAgICAgIFtOVU1fUk9PVF9OT0RFU106IG51bVJvb3ROb2RlcyxcbiAgICAgIC4uLnNlcmlhbGl6ZUxWaWV3KGxDb250YWluZXJbaV0gYXMgTFZpZXcsIGNvbnRleHQpLFxuICAgIH07XG5cbiAgICAvLyBDaGVjayBpZiB0aGUgcHJldmlvdXMgdmlldyBoYXMgdGhlIHNhbWUgc2hhcGUgKGZvciBleGFtcGxlLCBpdCB3YXNcbiAgICAvLyBwcm9kdWNlZCBieSB0aGUgKm5nRm9yKSwgaW4gd2hpY2ggY2FzZSBidW1wIHRoZSBjb3VudGVyIG9uIHRoZSBwcmV2aW91c1xuICAgIC8vIHZpZXcgaW5zdGVhZCBvZiBpbmNsdWRpbmcgdGhlIHNhbWUgaW5mb3JtYXRpb24gYWdhaW4uXG4gICAgY29uc3QgY3VycmVudFZpZXdBc1N0cmluZyA9IEpTT04uc3RyaW5naWZ5KHZpZXcpO1xuICAgIGlmICh2aWV3cy5sZW5ndGggPiAwICYmIGN1cnJlbnRWaWV3QXNTdHJpbmcgPT09IGxhc3RWaWV3QXNTdHJpbmcpIHtcbiAgICAgIGNvbnN0IHByZXZpb3VzVmlldyA9IHZpZXdzW3ZpZXdzLmxlbmd0aCAtIDFdO1xuICAgICAgcHJldmlvdXNWaWV3W01VTFRJUExJRVJdID8/PSAxO1xuICAgICAgcHJldmlvdXNWaWV3W01VTFRJUExJRVJdKys7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIFJlY29yZCB0aGlzIHZpZXcgYXMgbW9zdCByZWNlbnRseSBhZGRlZC5cbiAgICAgIGxhc3RWaWV3QXNTdHJpbmcgPSBjdXJyZW50Vmlld0FzU3RyaW5nO1xuICAgICAgdmlld3MucHVzaCh2aWV3KTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHZpZXdzO1xufVxuXG4vKipcbiAqIEhlbHBlciBmdW5jdGlvbiB0byBwcm9kdWNlIGEgbm9kZSBwYXRoICh3aGljaCBuYXZpZ2F0aW9uIHN0ZXBzIHJ1bnRpbWUgbG9naWNcbiAqIG5lZWRzIHRvIHRha2UgdG8gbG9jYXRlIGEgbm9kZSkgYW5kIHN0b3JlcyBpdCBpbiB0aGUgYE5PREVTYCBzZWN0aW9uIG9mIHRoZVxuICogY3VycmVudCBzZXJpYWxpemVkIHZpZXcuXG4gKi9cbmZ1bmN0aW9uIGFwcGVuZFNlcmlhbGl6ZWROb2RlUGF0aChuZ2g6IFNlcmlhbGl6ZWRWaWV3LCB0Tm9kZTogVE5vZGUsIGxWaWV3OiBMVmlldykge1xuICBjb25zdCBub09mZnNldEluZGV4ID0gdE5vZGUuaW5kZXggLSBIRUFERVJfT0ZGU0VUO1xuICBuZ2hbTk9ERVNdID8/PSB7fTtcbiAgbmdoW05PREVTXVtub09mZnNldEluZGV4XSA9IGNhbGNQYXRoRm9yTm9kZSh0Tm9kZSwgbFZpZXcpO1xufVxuXG4vKipcbiAqIFRoZXJlIGlzIG5vIHNwZWNpYWwgVE5vZGUgdHlwZSBmb3IgYW4gaTE4biBibG9jaywgc28gd2UgdmVyaWZ5XG4gKiB3aGV0aGVyIHRoZSBzdHJ1Y3R1cmUgdGhhdCB3ZSBzdG9yZSBhdCB0aGUgYFRWaWV3LmRhdGFbaWR4XWAgcG9zaXRpb25cbiAqIGhhcyB0aGUgYFRJMThuYCBzaGFwZS5cbiAqL1xuZnVuY3Rpb24gaXNUSTE4bk5vZGUob2JqOiB1bmtub3duKTogYm9vbGVhbiB7XG4gIGNvbnN0IHRJMThuID0gb2JqIGFzIFRJMThuO1xuICByZXR1cm4gdEkxOG4uaGFzT3duUHJvcGVydHkoJ2NyZWF0ZScpICYmIHRJMThuLmhhc093blByb3BlcnR5KCd1cGRhdGUnKTtcbn1cblxuLyoqXG4gKiBTZXJpYWxpemVzIHRoZSBsVmlldyBkYXRhIGludG8gYSBTZXJpYWxpemVkVmlldyBvYmplY3QgdGhhdCB3aWxsIGxhdGVyIGJlIGFkZGVkXG4gKiB0byB0aGUgVHJhbnNmZXJTdGF0ZSBzdG9yYWdlIGFuZCByZWZlcmVuY2VkIHVzaW5nIHRoZSBgbmdoYCBhdHRyaWJ1dGUgb24gYSBob3N0XG4gKiBlbGVtZW50LlxuICpcbiAqIEBwYXJhbSBsVmlldyB0aGUgbFZpZXcgd2UgYXJlIHNlcmlhbGl6aW5nXG4gKiBAcGFyYW0gY29udGV4dCB0aGUgaHlkcmF0aW9uIGNvbnRleHRcbiAqIEByZXR1cm5zIHRoZSBgU2VyaWFsaXplZFZpZXdgIG9iamVjdCBjb250YWluaW5nIHRoZSBkYXRhIHRvIGJlIGFkZGVkIHRvIHRoZSBob3N0IG5vZGVcbiAqL1xuZnVuY3Rpb24gc2VyaWFsaXplTFZpZXcobFZpZXc6IExWaWV3LCBjb250ZXh0OiBIeWRyYXRpb25Db250ZXh0KTogU2VyaWFsaXplZFZpZXcge1xuICBjb25zdCBuZ2g6IFNlcmlhbGl6ZWRWaWV3ID0ge307XG4gIGNvbnN0IHRWaWV3ID0gbFZpZXdbVFZJRVddO1xuICAvLyBJdGVyYXRlIG92ZXIgRE9NIGVsZW1lbnQgcmVmZXJlbmNlcyBpbiBhbiBMVmlldy5cbiAgZm9yIChsZXQgaSA9IEhFQURFUl9PRkZTRVQ7IGkgPCB0Vmlldy5iaW5kaW5nU3RhcnRJbmRleDsgaSsrKSB7XG4gICAgY29uc3QgdE5vZGUgPSB0Vmlldy5kYXRhW2ldIGFzIFROb2RlO1xuICAgIGNvbnN0IG5vT2Zmc2V0SW5kZXggPSBpIC0gSEVBREVSX09GRlNFVDtcbiAgICAvLyBMb2NhbCByZWZzIChlLmcuIDxkaXYgI2xvY2FsUmVmPikgdGFrZSB1cCBhbiBleHRyYSBzbG90IGluIExWaWV3c1xuICAgIC8vIHRvIHN0b3JlIHRoZSBzYW1lIGVsZW1lbnQuIEluIHRoaXMgY2FzZSwgdGhlcmUgaXMgbm8gaW5mb3JtYXRpb24gaW5cbiAgICAvLyBhIGNvcnJlc3BvbmRpbmcgc2xvdCBpbiBUTm9kZSBkYXRhIHN0cnVjdHVyZS4gSWYgdGhhdCdzIHRoZSBjYXNlLCBqdXN0XG4gICAgLy8gc2tpcCB0aGlzIHNsb3QgYW5kIG1vdmUgdG8gdGhlIG5leHQgb25lLlxuICAgIGlmICghdE5vZGUpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIC8vIENoZWNrIGlmIGEgbmF0aXZlIG5vZGUgdGhhdCByZXByZXNlbnRzIGEgZ2l2ZW4gVE5vZGUgaXMgZGlzY29ubmVjdGVkIGZyb20gdGhlIERPTSB0cmVlLlxuICAgIC8vIFN1Y2ggbm9kZXMgbXVzdCBiZSBleGNsdWRlZCBmcm9tIHRoZSBoeWRyYXRpb24gKHNpbmNlIHRoZSBoeWRyYXRpb24gd29uJ3QgYmUgYWJsZSB0b1xuICAgIC8vIGZpbmQgdGhlbSksIHNvIHRoZSBUTm9kZSBpZHMgYXJlIGNvbGxlY3RlZCBhbmQgdXNlZCBhdCBydW50aW1lIHRvIHNraXAgdGhlIGh5ZHJhdGlvbi5cbiAgICAvL1xuICAgIC8vIFRoaXMgc2l0dWF0aW9uIG1heSBoYXBwZW4gZHVyaW5nIHRoZSBjb250ZW50IHByb2plY3Rpb24sIHdoZW4gc29tZSBub2RlcyBkb24ndCBtYWtlIGl0XG4gICAgLy8gaW50byBvbmUgb2YgdGhlIGNvbnRlbnQgcHJvamVjdGlvbiBzbG90cyAoZm9yIGV4YW1wbGUsIHdoZW4gdGhlcmUgaXMgbm8gZGVmYXVsdFxuICAgIC8vIDxuZy1jb250ZW50IC8+IHNsb3QgaW4gcHJvamVjdG9yIGNvbXBvbmVudCdzIHRlbXBsYXRlKS5cbiAgICAvL1xuICAgIC8vIE5vdGU6IHdlIGxldmVyYWdlIHRoZSBmYWN0IHRoYXQgd2UgaGF2ZSB0aGlzIGluZm9ybWF0aW9uIGF2YWlsYWJsZSBpbiB0aGUgRE9NIGVtdWxhdGlvblxuICAgIC8vIGxheWVyIChpbiBEb21pbm8pIGZvciBub3cuIExvbmdlci10ZXJtIHNvbHV0aW9uIHNob3VsZCBub3QgcmVseSBvbiB0aGUgRE9NIGVtdWxhdGlvbiBhbmRcbiAgICAvLyBvbmx5IHVzZSBpbnRlcm5hbCBkYXRhIHN0cnVjdHVyZXMgYW5kIHN0YXRlIHRvIGNvbXB1dGUgdGhpcyBpbmZvcm1hdGlvbi5cbiAgICBpZiAoISh0Tm9kZS50eXBlICYgVE5vZGVUeXBlLlByb2plY3Rpb24pICYmICEhbFZpZXdbaV0gJiZcbiAgICAgICAgISh1bndyYXBSTm9kZShsVmlld1tpXSkgYXMgTm9kZSkuaXNDb25uZWN0ZWQpIHtcbiAgICAgIG5naFtESVNDT05ORUNURURfTk9ERVNdID8/PSBbXTtcbiAgICAgIG5naFtESVNDT05ORUNURURfTk9ERVNdLnB1c2gobm9PZmZzZXRJbmRleCk7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgaWYgKEFycmF5LmlzQXJyYXkodE5vZGUucHJvamVjdGlvbikpIHtcbiAgICAgIGZvciAoY29uc3QgcHJvamVjdGlvbkhlYWRUTm9kZSBvZiB0Tm9kZS5wcm9qZWN0aW9uKSB7XG4gICAgICAgIC8vIFdlIG1heSBoYXZlIGBudWxsYHMgaW4gc2xvdHMgd2l0aCBubyBwcm9qZWN0ZWQgY29udGVudC5cbiAgICAgICAgaWYgKCFwcm9qZWN0aW9uSGVhZFROb2RlKSBjb250aW51ZTtcblxuICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkocHJvamVjdGlvbkhlYWRUTm9kZSkpIHtcbiAgICAgICAgICAvLyBJZiB3ZSBwcm9jZXNzIHJlLXByb2plY3RlZCBjb250ZW50IChpLmUuIGA8bmctY29udGVudD5gXG4gICAgICAgICAgLy8gYXBwZWFycyBhdCBwcm9qZWN0aW9uIGxvY2F0aW9uKSwgc2tpcCBhbm5vdGF0aW9ucyBmb3IgdGhpcyBjb250ZW50XG4gICAgICAgICAgLy8gc2luY2UgYWxsIERPTSBub2RlcyBpbiB0aGlzIHByb2plY3Rpb24gd2VyZSBoYW5kbGVkIHdoaWxlIHByb2Nlc3NpbmdcbiAgICAgICAgICAvLyBhIHBhcmVudCBsVmlldywgd2hpY2ggY29udGFpbnMgdGhvc2Ugbm9kZXMuXG4gICAgICAgICAgaWYgKCFpc1Byb2plY3Rpb25UTm9kZShwcm9qZWN0aW9uSGVhZFROb2RlKSAmJlxuICAgICAgICAgICAgICAhaXNJblNraXBIeWRyYXRpb25CbG9jayhwcm9qZWN0aW9uSGVhZFROb2RlKSkge1xuICAgICAgICAgICAgYXBwZW5kU2VyaWFsaXplZE5vZGVQYXRoKG5naCwgcHJvamVjdGlvbkhlYWRUTm9kZSwgbFZpZXcpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBJZiBhIHZhbHVlIGlzIGFuIGFycmF5LCBpdCBtZWFucyB0aGF0IHdlIGFyZSBwcm9jZXNzaW5nIGEgcHJvamVjdGlvblxuICAgICAgICAgIC8vIHdoZXJlIHByb2plY3RhYmxlIG5vZGVzIHdlcmUgcGFzc2VkIGluIGFzIERPTSBub2RlcyAoZm9yIGV4YW1wbGUsIHdoZW5cbiAgICAgICAgICAvLyBjYWxsaW5nIGBWaWV3Q29udGFpbmVyUmVmLmNyZWF0ZUNvbXBvbmVudChDbXBBLCB7cHJvamVjdGFibGVOb2RlczogWy4uLl19KWApLlxuICAgICAgICAgIC8vXG4gICAgICAgICAgLy8gSW4gdGhpcyBzY2VuYXJpbywgbm9kZXMgY2FuIGNvbWUgZnJvbSBhbnl3aGVyZSAoZWl0aGVyIGNyZWF0ZWQgbWFudWFsbHksXG4gICAgICAgICAgLy8gYWNjZXNzZWQgdmlhIGBkb2N1bWVudC5xdWVyeVNlbGVjdG9yYCwgZXRjKSBhbmQgbWF5IGJlIGluIGFueSBzdGF0ZVxuICAgICAgICAgIC8vIChhdHRhY2hlZCBvciBkZXRhY2hlZCBmcm9tIHRoZSBET00gdHJlZSkuIEFzIGEgcmVzdWx0LCB3ZSBjYW4gbm90IHJlbGlhYmx5XG4gICAgICAgICAgLy8gcmVzdG9yZSB0aGUgc3RhdGUgZm9yIHN1Y2ggY2FzZXMgZHVyaW5nIGh5ZHJhdGlvbi5cblxuICAgICAgICAgIHRocm93IHVuc3VwcG9ydGVkUHJvamVjdGlvbk9mRG9tTm9kZXModW53cmFwUk5vZGUobFZpZXdbaV0pKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBpZiAoaXNMQ29udGFpbmVyKGxWaWV3W2ldKSkge1xuICAgICAgLy8gU2VyaWFsaXplIGluZm9ybWF0aW9uIGFib3V0IGEgdGVtcGxhdGUuXG4gICAgICBjb25zdCBlbWJlZGRlZFRWaWV3ID0gdE5vZGUudFZpZXc7XG4gICAgICBpZiAoZW1iZWRkZWRUVmlldyAhPT0gbnVsbCkge1xuICAgICAgICBuZ2hbVEVNUExBVEVTXSA/Pz0ge307XG4gICAgICAgIG5naFtURU1QTEFURVNdW25vT2Zmc2V0SW5kZXhdID0gZ2V0U3NySWQoZW1iZWRkZWRUVmlldyk7XG4gICAgICB9XG5cbiAgICAgIC8vIFNlcmlhbGl6ZSB2aWV3cyB3aXRoaW4gdGhpcyBMQ29udGFpbmVyLlxuICAgICAgY29uc3QgaG9zdE5vZGUgPSBsVmlld1tpXVtIT1NUXSE7ICAvLyBob3N0IG5vZGUgb2YgdGhpcyBjb250YWluZXJcblxuICAgICAgLy8gTFZpZXdbaV1bSE9TVF0gY2FuIGJlIG9mIDIgZGlmZmVyZW50IHR5cGVzOlxuICAgICAgLy8gLSBlaXRoZXIgYSBET00gbm9kZVxuICAgICAgLy8gLSBvciBhbiBhcnJheSB0aGF0IHJlcHJlc2VudHMgYW4gTFZpZXcgb2YgYSBjb21wb25lbnRcbiAgICAgIGlmIChBcnJheS5pc0FycmF5KGhvc3ROb2RlKSkge1xuICAgICAgICAvLyBUaGlzIGlzIGEgY29tcG9uZW50LCBzZXJpYWxpemUgaW5mbyBhYm91dCBpdC5cbiAgICAgICAgY29uc3QgdGFyZ2V0Tm9kZSA9IHVud3JhcFJOb2RlKGhvc3ROb2RlIGFzIExWaWV3KSBhcyBSRWxlbWVudDtcbiAgICAgICAgaWYgKCEodGFyZ2V0Tm9kZSBhcyBIVE1MRWxlbWVudCkuaGFzQXR0cmlidXRlKFNLSVBfSFlEUkFUSU9OX0FUVFJfTkFNRSkpIHtcbiAgICAgICAgICBhbm5vdGF0ZUhvc3RFbGVtZW50Rm9ySHlkcmF0aW9uKHRhcmdldE5vZGUsIGhvc3ROb2RlIGFzIExWaWV3LCBjb250ZXh0KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgbmdoW0NPTlRBSU5FUlNdID8/PSB7fTtcbiAgICAgIG5naFtDT05UQUlORVJTXVtub09mZnNldEluZGV4XSA9IHNlcmlhbGl6ZUxDb250YWluZXIobFZpZXdbaV0sIGNvbnRleHQpO1xuICAgIH0gZWxzZSBpZiAoQXJyYXkuaXNBcnJheShsVmlld1tpXSkpIHtcbiAgICAgIC8vIFRoaXMgaXMgYSBjb21wb25lbnQsIGFubm90YXRlIHRoZSBob3N0IG5vZGUgd2l0aCBhbiBgbmdoYCBhdHRyaWJ1dGUuXG4gICAgICBjb25zdCB0YXJnZXROb2RlID0gdW53cmFwUk5vZGUobFZpZXdbaV1bSE9TVF0hKTtcbiAgICAgIGlmICghKHRhcmdldE5vZGUgYXMgSFRNTEVsZW1lbnQpLmhhc0F0dHJpYnV0ZShTS0lQX0hZRFJBVElPTl9BVFRSX05BTUUpKSB7XG4gICAgICAgIGFubm90YXRlSG9zdEVsZW1lbnRGb3JIeWRyYXRpb24odGFyZ2V0Tm9kZSBhcyBSRWxlbWVudCwgbFZpZXdbaV0sIGNvbnRleHQpO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoaXNUSTE4bk5vZGUodE5vZGUpKSB7XG4gICAgICAvLyBIeWRyYXRpb24gZm9yIGkxOG4gbm9kZXMgaXMgbm90ICp5ZXQqIHN1cHBvcnRlZC5cbiAgICAgIC8vIFByb2R1Y2UgYW4gZXJyb3IgbWVzc2FnZSB3aGljaCB3b3VsZCBhbHNvIGRlc2NyaWJlIHBvc3NpYmxlXG4gICAgICAvLyBzb2x1dGlvbnMgKHN3aXRjaGluZyBiYWNrIHRvIHRoZSBcImRlc3RydWN0aXZlXCIgaHlkcmF0aW9uIG9yXG4gICAgICAvLyBleGNsdWRpbmcgYSBjb21wb25lbnQgZnJvbSBoeWRyYXRpb24gdmlhIGBuZ1NraXBIeWRyYXRpb25gKS5cbiAgICAgIC8vXG4gICAgICAvLyBUT0RPKGFrdXNobmlyKTogd2Ugc2hvdWxkIGZpbmQgYSBiZXR0ZXIgd2F5IHRvIGdldCBhIGhvbGQgb2YgdGhlIG5vZGUgdGhhdCBoYXMgdGhlIGBpMThuYFxuICAgICAgLy8gYXR0cmlidXRlIG9uIGl0LiBGb3Igbm93LCB3ZSBlaXRoZXIgcmVmZXIgdG8gdGhlIGhvc3QgZWxlbWVudCBvZiB0aGUgY29tcG9uZW50IG9yIHRvIHRoZVxuICAgICAgLy8gcHJldmlvdXMgZWxlbWVudCBpbiB0aGUgTFZpZXcuXG4gICAgICBjb25zdCB0YXJnZXROb2RlID0gKGkgPT09IEhFQURFUl9PRkZTRVQpID8gbFZpZXdbSE9TVF0hIDogdW53cmFwUk5vZGUobFZpZXdbaSAtIDFdKTtcbiAgICAgIHRocm93IG5vdFlldFN1cHBvcnRlZEkxOG5CbG9ja0Vycm9yKHRhcmdldE5vZGUpO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyA8bmctY29udGFpbmVyPiBjYXNlXG4gICAgICBpZiAodE5vZGUudHlwZSAmIFROb2RlVHlwZS5FbGVtZW50Q29udGFpbmVyKSB7XG4gICAgICAgIC8vIEFuIDxuZy1jb250YWluZXI+IGlzIHJlcHJlc2VudGVkIGJ5IHRoZSBudW1iZXIgb2ZcbiAgICAgICAgLy8gdG9wLWxldmVsIG5vZGVzLiBUaGlzIGluZm9ybWF0aW9uIGlzIG5lZWRlZCB0byBza2lwIG92ZXJcbiAgICAgICAgLy8gdGhvc2Ugbm9kZXMgdG8gcmVhY2ggYSBjb3JyZXNwb25kaW5nIGFuY2hvciBub2RlIChjb21tZW50IG5vZGUpLlxuICAgICAgICBuZ2hbRUxFTUVOVF9DT05UQUlORVJTXSA/Pz0ge307XG4gICAgICAgIG5naFtFTEVNRU5UX0NPTlRBSU5FUlNdW25vT2Zmc2V0SW5kZXhdID0gY2FsY051bVJvb3ROb2Rlcyh0VmlldywgbFZpZXcsIHROb2RlLmNoaWxkKTtcbiAgICAgIH0gZWxzZSBpZiAodE5vZGUudHlwZSAmIFROb2RlVHlwZS5Qcm9qZWN0aW9uKSB7XG4gICAgICAgIC8vIEN1cnJlbnQgVE5vZGUgcmVwcmVzZW50cyBhbiBgPG5nLWNvbnRlbnQ+YCBzbG90LCB0aHVzIGl0IGhhcyBub1xuICAgICAgICAvLyBET00gZWxlbWVudHMgYXNzb2NpYXRlZCB3aXRoIGl0LCBzbyB0aGUgKipuZXh0IHNpYmxpbmcqKiBub2RlIHdvdWxkXG4gICAgICAgIC8vIG5vdCBiZSBhYmxlIHRvIGZpbmQgYW4gYW5jaG9yLiBJbiB0aGlzIGNhc2UsIHVzZSBmdWxsIHBhdGggaW5zdGVhZC5cbiAgICAgICAgbGV0IG5leHRUTm9kZSA9IHROb2RlLm5leHQ7XG4gICAgICAgIC8vIFNraXAgb3ZlciBhbGwgYDxuZy1jb250ZW50PmAgc2xvdHMgaW4gYSByb3cuXG4gICAgICAgIHdoaWxlIChuZXh0VE5vZGUgIT09IG51bGwgJiYgKG5leHRUTm9kZS50eXBlICYgVE5vZGVUeXBlLlByb2plY3Rpb24pKSB7XG4gICAgICAgICAgbmV4dFROb2RlID0gbmV4dFROb2RlLm5leHQ7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG5leHRUTm9kZSAmJiAhaXNJblNraXBIeWRyYXRpb25CbG9jayhuZXh0VE5vZGUpKSB7XG4gICAgICAgICAgLy8gSGFuZGxlIGEgdE5vZGUgYWZ0ZXIgdGhlIGA8bmctY29udGVudD5gIHNsb3QuXG4gICAgICAgICAgYXBwZW5kU2VyaWFsaXplZE5vZGVQYXRoKG5naCwgbmV4dFROb2RlLCBsVmlldyk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIEhhbmRsZSBjYXNlcyB3aGVyZSB0ZXh0IG5vZGVzIGNhbiBiZSBsb3N0IGFmdGVyIERPTSBzZXJpYWxpemF0aW9uOlxuICAgICAgICAvLyAgMS4gV2hlbiB0aGVyZSBpcyBhbiAqZW1wdHkgdGV4dCBub2RlKiBpbiBET006IGluIHRoaXMgY2FzZSwgdGhpc1xuICAgICAgICAvLyAgICAgbm9kZSB3b3VsZCBub3QgbWFrZSBpdCBpbnRvIHRoZSBzZXJpYWxpemVkIHN0cmluZyBhbmQgYXMgYSByZXN1bHQsXG4gICAgICAgIC8vICAgICB0aGlzIG5vZGUgd291bGRuJ3QgYmUgY3JlYXRlZCBpbiBhIGJyb3dzZXIuIFRoaXMgd291bGQgcmVzdWx0IGluXG4gICAgICAgIC8vICAgICBhIG1pc21hdGNoIGR1cmluZyB0aGUgaHlkcmF0aW9uLCB3aGVyZSB0aGUgcnVudGltZSBsb2dpYyB3b3VsZCBleHBlY3RcbiAgICAgICAgLy8gICAgIGEgdGV4dCBub2RlIHRvIGJlIHByZXNlbnQgaW4gbGl2ZSBET00sIGJ1dCBubyB0ZXh0IG5vZGUgd291bGQgZXhpc3QuXG4gICAgICAgIC8vICAgICBFeGFtcGxlOiBgPHNwYW4+e3sgbmFtZSB9fTwvc3Bhbj5gIHdoZW4gdGhlIGBuYW1lYCBpcyBhbiBlbXB0eSBzdHJpbmcuXG4gICAgICAgIC8vICAgICBUaGlzIHdvdWxkIHJlc3VsdCBpbiBgPHNwYW4+PC9zcGFuPmAgc3RyaW5nIGFmdGVyIHNlcmlhbGl6YXRpb24gYW5kXG4gICAgICAgIC8vICAgICBpbiBhIGJyb3dzZXIgb25seSB0aGUgYHNwYW5gIGVsZW1lbnQgd291bGQgYmUgY3JlYXRlZC4gVG8gcmVzb2x2ZSB0aGF0LFxuICAgICAgICAvLyAgICAgYW4gZXh0cmEgY29tbWVudCBub2RlIGlzIGFwcGVuZGVkIGluIHBsYWNlIG9mIGFuIGVtcHR5IHRleHQgbm9kZSBhbmRcbiAgICAgICAgLy8gICAgIHRoYXQgc3BlY2lhbCBjb21tZW50IG5vZGUgaXMgcmVwbGFjZWQgd2l0aCBhbiBlbXB0eSB0ZXh0IG5vZGUgKmJlZm9yZSpcbiAgICAgICAgLy8gICAgIGh5ZHJhdGlvbi5cbiAgICAgICAgLy8gIDIuIFdoZW4gdGhlcmUgYXJlIDIgY29uc2VjdXRpdmUgdGV4dCBub2RlcyBwcmVzZW50IGluIHRoZSBET00uXG4gICAgICAgIC8vICAgICBFeGFtcGxlOiBgPGRpdj5IZWxsbyA8bmctY29udGFpbmVyICpuZ0lmPVwidHJ1ZVwiPndvcmxkPC9uZy1jb250YWluZXI+PC9kaXY+YC5cbiAgICAgICAgLy8gICAgIEluIHRoaXMgc2NlbmFyaW8sIHRoZSBsaXZlIERPTSB3b3VsZCBsb29rIGxpa2UgdGhpczpcbiAgICAgICAgLy8gICAgICAgPGRpdj4jdGV4dCgnSGVsbG8gJykgI3RleHQoJ3dvcmxkJykgI2NvbW1lbnQoJ2NvbnRhaW5lcicpPC9kaXY+XG4gICAgICAgIC8vICAgICBTZXJpYWxpemVkIHN0cmluZyB3b3VsZCBsb29rIGxpa2UgdGhpczogYDxkaXY+SGVsbG8gd29ybGQ8IS0tY29udGFpbmVyLS0+PC9kaXY+YC5cbiAgICAgICAgLy8gICAgIFRoZSBsaXZlIERPTSBpbiBhIGJyb3dzZXIgYWZ0ZXIgdGhhdCB3b3VsZCBiZTpcbiAgICAgICAgLy8gICAgICAgPGRpdj4jdGV4dCgnSGVsbG8gd29ybGQnKSAjY29tbWVudCgnY29udGFpbmVyJyk8L2Rpdj5cbiAgICAgICAgLy8gICAgIE5vdGljZSBob3cgMiB0ZXh0IG5vZGVzIGFyZSBub3cgXCJtZXJnZWRcIiBpbnRvIG9uZS4gVGhpcyB3b3VsZCBjYXVzZSBoeWRyYXRpb25cbiAgICAgICAgLy8gICAgIGxvZ2ljIHRvIGZhaWwsIHNpbmNlIGl0J2QgZXhwZWN0IDIgdGV4dCBub2RlcyBiZWluZyBwcmVzZW50LCBub3Qgb25lLlxuICAgICAgICAvLyAgICAgVG8gZml4IHRoaXMsIHdlIGluc2VydCBhIHNwZWNpYWwgY29tbWVudCBub2RlIGluIGJldHdlZW4gdGhvc2UgdGV4dCBub2Rlcywgc29cbiAgICAgICAgLy8gICAgIHNlcmlhbGl6ZWQgcmVwcmVzZW50YXRpb24gaXM6IGA8ZGl2PkhlbGxvIDwhLS1uZ3Rucy0tPndvcmxkPCEtLWNvbnRhaW5lci0tPjwvZGl2PmAuXG4gICAgICAgIC8vICAgICBUaGlzIGZvcmNlcyBicm93c2VyIHRvIGNyZWF0ZSAyIHRleHQgbm9kZXMgc2VwYXJhdGVkIGJ5IGEgY29tbWVudCBub2RlLlxuICAgICAgICAvLyAgICAgQmVmb3JlIHJ1bm5pbmcgYSBoeWRyYXRpb24gcHJvY2VzcywgdGhpcyBzcGVjaWFsIGNvbW1lbnQgbm9kZSBpcyByZW1vdmVkLCBzbyB0aGVcbiAgICAgICAgLy8gICAgIGxpdmUgRE9NIGhhcyBleGFjdGx5IHRoZSBzYW1lIHN0YXRlIGFzIGl0IHdhcyBiZWZvcmUgc2VyaWFsaXphdGlvbi5cbiAgICAgICAgaWYgKHROb2RlLnR5cGUgJiBUTm9kZVR5cGUuVGV4dCkge1xuICAgICAgICAgIGNvbnN0IHJOb2RlID0gdW53cmFwUk5vZGUobFZpZXdbaV0pIGFzIEhUTUxFbGVtZW50O1xuICAgICAgICAgIGlmIChyTm9kZS50ZXh0Q29udGVudD8ucmVwbGFjZSgvXFxzL2dtLCAnJykgPT09ICcnKSB7XG4gICAgICAgICAgICBjb250ZXh0LmNvcnJ1cHRlZFRleHROb2Rlcy5zZXQock5vZGUsIFRleHROb2RlTWFya2VyLkVtcHR5Tm9kZSk7XG4gICAgICAgICAgfSBlbHNlIGlmIChyTm9kZS5uZXh0U2libGluZz8ubm9kZVR5cGUgPT09IE5vZGUuVEVYVF9OT0RFKSB7XG4gICAgICAgICAgICBjb250ZXh0LmNvcnJ1cHRlZFRleHROb2Rlcy5zZXQock5vZGUsIFRleHROb2RlTWFya2VyLlNlcGFyYXRvcik7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHROb2RlLnByb2plY3Rpb25OZXh0ICYmIHROb2RlLnByb2plY3Rpb25OZXh0ICE9PSB0Tm9kZS5uZXh0ICYmXG4gICAgICAgICAgICAhaXNJblNraXBIeWRyYXRpb25CbG9jayh0Tm9kZS5wcm9qZWN0aW9uTmV4dCkpIHtcbiAgICAgICAgICAvLyBDaGVjayBpZiBwcm9qZWN0aW9uIG5leHQgaXMgbm90IHRoZSBzYW1lIGFzIG5leHQsIGluIHdoaWNoIGNhc2VcbiAgICAgICAgICAvLyB0aGUgbm9kZSB3b3VsZCBub3QgYmUgZm91bmQgYXQgY3JlYXRpb24gdGltZSBhdCBydW50aW1lIGFuZCB3ZVxuICAgICAgICAgIC8vIG5lZWQgdG8gcHJvdmlkZSBhIGxvY2F0aW9uIGZvciB0aGF0IG5vZGUuXG4gICAgICAgICAgYXBwZW5kU2VyaWFsaXplZE5vZGVQYXRoKG5naCwgdE5vZGUucHJvamVjdGlvbk5leHQsIGxWaWV3KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gbmdoO1xufVxuXG4vKipcbiAqIFBoeXNpY2FsbHkgYWRkcyB0aGUgYG5naGAgYXR0cmlidXRlIGFuZCBzZXJpYWxpemVkIGRhdGEgdG8gdGhlIGhvc3QgZWxlbWVudC5cbiAqXG4gKiBAcGFyYW0gZWxlbWVudCBUaGUgSG9zdCBlbGVtZW50IHRvIGJlIGFubm90YXRlZFxuICogQHBhcmFtIGxWaWV3IFRoZSBhc3NvY2lhdGVkIExWaWV3XG4gKiBAcGFyYW0gY29udGV4dCBUaGUgaHlkcmF0aW9uIGNvbnRleHRcbiAqL1xuZnVuY3Rpb24gYW5ub3RhdGVIb3N0RWxlbWVudEZvckh5ZHJhdGlvbihcbiAgICBlbGVtZW50OiBSRWxlbWVudCwgbFZpZXc6IExWaWV3LCBjb250ZXh0OiBIeWRyYXRpb25Db250ZXh0KTogdm9pZCB7XG4gIGNvbnN0IG5naCA9IHNlcmlhbGl6ZUxWaWV3KGxWaWV3LCBjb250ZXh0KTtcbiAgY29uc3QgaW5kZXggPSBjb250ZXh0LnNlcmlhbGl6ZWRWaWV3Q29sbGVjdGlvbi5hZGQobmdoKTtcbiAgY29uc3QgcmVuZGVyZXIgPSBsVmlld1tSRU5ERVJFUl07XG4gIHJlbmRlcmVyLnNldEF0dHJpYnV0ZShlbGVtZW50LCBOR0hfQVRUUl9OQU1FLCBpbmRleC50b1N0cmluZygpKTtcbn1cblxuLyoqXG4gKiBQaHlzaWNhbGx5IGluc2VydHMgdGhlIGNvbW1lbnQgbm9kZXMgdG8gZW5zdXJlIGVtcHR5IHRleHQgbm9kZXMgYW5kIGFkamFjZW50XG4gKiB0ZXh0IG5vZGUgc2VwYXJhdG9ycyBhcmUgcHJlc2VydmVkIGFmdGVyIHNlcnZlciBzZXJpYWxpemF0aW9uIG9mIHRoZSBET00uXG4gKiBUaGVzZSBnZXQgc3dhcHBlZCBiYWNrIGZvciBlbXB0eSB0ZXh0IG5vZGVzIG9yIHNlcGFyYXRvcnMgb25jZSBoeWRyYXRpb24gaGFwcGVuc1xuICogb24gdGhlIGNsaWVudC5cbiAqXG4gKiBAcGFyYW0gY29ycnVwdGVkVGV4dE5vZGVzIFRoZSBNYXAgb2YgdGV4dCBub2RlcyB0byBiZSByZXBsYWNlZCB3aXRoIGNvbW1lbnRzXG4gKiBAcGFyYW0gZG9jIFRoZSBkb2N1bWVudFxuICovXG5mdW5jdGlvbiBpbnNlcnRDb3JydXB0ZWRUZXh0Tm9kZU1hcmtlcnMoXG4gICAgY29ycnVwdGVkVGV4dE5vZGVzOiBNYXA8SFRNTEVsZW1lbnQsIHN0cmluZz4sIGRvYzogRG9jdW1lbnQpIHtcbiAgZm9yIChjb25zdCBbdGV4dE5vZGUsIG1hcmtlcl0gb2YgY29ycnVwdGVkVGV4dE5vZGVzKSB7XG4gICAgdGV4dE5vZGUuYWZ0ZXIoZG9jLmNyZWF0ZUNvbW1lbnQobWFya2VyKSk7XG4gIH1cbn1cbiJdfQ==