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
            ngh[DISCONNECTED_NODES] ??= [];
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYW5ub3RhdGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9oeWRyYXRpb24vYW5ub3RhdGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBR0gsT0FBTyxFQUFDLGtCQUFrQixFQUFDLE1BQU0saUNBQWlDLENBQUM7QUFDbkUsT0FBTyxFQUFDLHVCQUF1QixFQUFhLE1BQU0saUNBQWlDLENBQUM7QUFJcEYsT0FBTyxFQUFDLFlBQVksRUFBRSxpQkFBaUIsRUFBRSxVQUFVLEVBQUMsTUFBTSxtQ0FBbUMsQ0FBQztBQUM5RixPQUFPLEVBQUMsYUFBYSxFQUFFLElBQUksRUFBUyxRQUFRLEVBQVMsS0FBSyxFQUFZLE1BQU0sNEJBQTRCLENBQUM7QUFDekcsT0FBTyxFQUFDLFdBQVcsRUFBQyxNQUFNLDRCQUE0QixDQUFDO0FBQ3ZELE9BQU8sRUFBQyxhQUFhLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUVoRCxPQUFPLEVBQUMsNkJBQTZCLEVBQUUsK0JBQStCLEVBQUMsTUFBTSxrQkFBa0IsQ0FBQztBQUNoRyxPQUFPLEVBQUMsVUFBVSxFQUFFLGtCQUFrQixFQUFFLGtCQUFrQixFQUFFLFVBQVUsRUFBRSxLQUFLLEVBQUUsY0FBYyxFQUEyQyxXQUFXLEVBQUUsU0FBUyxFQUFDLE1BQU0sY0FBYyxDQUFDO0FBQ3BMLE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUNwRCxPQUFPLEVBQUMsc0JBQXNCLEVBQUUsd0JBQXdCLEVBQUMsTUFBTSxrQkFBa0IsQ0FBQztBQUNsRixPQUFPLEVBQUMsNkJBQTZCLEVBQUUsYUFBYSxFQUFFLFlBQVksRUFBaUIsTUFBTSxTQUFTLENBQUM7QUFFbkc7Ozs7O0dBS0c7QUFDSCxNQUFNLHdCQUF3QjtJQUE5QjtRQUNVLFVBQUssR0FBcUIsRUFBRSxDQUFDO1FBQzdCLG1CQUFjLEdBQUcsSUFBSSxH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QUFPLEVBQUUsYUFBYSxFQUFFLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO0FBQ2xFLENBQUM7QUFFRDs7Ozs7Ozs7R0FRRztBQUNILFNBQVMsOEJBQThCLENBQ25DLGtCQUE0QyxFQUFFLEdBQWE7SUFDN0QsS0FBSyxNQUFNLENBQUMsUUFBUSxFQUFFLE1BQU0sQ0FBQyxJQUFJLGtCQUFrQixFQUFFO1FBQ25ELFFBQVEsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLGFBQWEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO0tBQzNDO0FBQ0gsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0FwcGxpY2F0aW9uUmVmfSBmcm9tICcuLi9hcHBsaWNhdGlvbl9yZWYnO1xuaW1wb3J0IHtjb2xsZWN0TmF0aXZlTm9kZXN9IGZyb20gJy4uL3JlbmRlcjMvY29sbGVjdF9uYXRpdmVfbm9kZXMnO1xuaW1wb3J0IHtDT05UQUlORVJfSEVBREVSX09GRlNFVCwgTENvbnRhaW5lcn0gZnJvbSAnLi4vcmVuZGVyMy9pbnRlcmZhY2VzL2NvbnRhaW5lcic7XG5pbXBvcnQge1RJMThufSBmcm9tICcuLi9yZW5kZXIzL2ludGVyZmFjZXMvaTE4bic7XG5pbXBvcnQge1ROb2RlLCBUTm9kZVR5cGV9IGZyb20gJy4uL3JlbmRlcjMvaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7UkVsZW1lbnR9IGZyb20gJy4uL3JlbmRlcjMvaW50ZXJmYWNlcy9yZW5kZXJlcl9kb20nO1xuaW1wb3J0IHtpc0xDb250YWluZXIsIGlzUHJvamVjdGlvblROb2RlLCBpc1Jvb3RWaWV3fSBmcm9tICcuLi9yZW5kZXIzL2ludGVyZmFjZXMvdHlwZV9jaGVja3MnO1xuaW1wb3J0IHtIRUFERVJfT0ZGU0VULCBIT1NULCBMVmlldywgUkVOREVSRVIsIFRWaWV3LCBUVklFVywgVFZpZXdUeXBlfSBmcm9tICcuLi9yZW5kZXIzL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge3Vud3JhcFJOb2RlfSBmcm9tICcuLi9yZW5kZXIzL3V0aWwvdmlld191dGlscyc7XG5pbXBvcnQge1RyYW5zZmVyU3RhdGV9IGZyb20gJy4uL3RyYW5zZmVyX3N0YXRlJztcblxuaW1wb3J0IHtub3RZZXRTdXBwb3J0ZWRJMThuQmxvY2tFcnJvciwgdW5zdXBwb3J0ZWRQcm9qZWN0aW9uT2ZEb21Ob2Rlc30gZnJvbSAnLi9lcnJvcl9oYW5kbGluZyc7XG5pbXBvcnQge0NPTlRBSU5FUlMsIERJU0NPTk5FQ1RFRF9OT0RFUywgRUxFTUVOVF9DT05UQUlORVJTLCBNVUxUSVBMSUVSLCBOT0RFUywgTlVNX1JPT1RfTk9ERVMsIFNlcmlhbGl6ZWRDb250YWluZXJWaWV3LCBTZXJpYWxpemVkVmlldywgVEVNUExBVEVfSUQsIFRFTVBMQVRFU30gZnJvbSAnLi9pbnRlcmZhY2VzJztcbmltcG9ydCB7Y2FsY1BhdGhGb3JOb2RlfSBmcm9tICcuL25vZGVfbG9va3VwX3V0aWxzJztcbmltcG9ydCB7aXNJblNraXBIeWRyYXRpb25CbG9jaywgU0tJUF9IWURSQVRJT05fQVRUUl9OQU1FfSBmcm9tICcuL3NraXBfaHlkcmF0aW9uJztcbmltcG9ydCB7Z2V0Q29tcG9uZW50TFZpZXdGb3JIeWRyYXRpb24sIE5HSF9BVFRSX05BTUUsIE5HSF9EQVRBX0tFWSwgVGV4dE5vZGVNYXJrZXJ9IGZyb20gJy4vdXRpbHMnO1xuXG4vKipcbiAqIEEgY29sbGVjdGlvbiB0aGF0IHRyYWNrcyBhbGwgc2VyaWFsaXplZCB2aWV3cyAoYG5naGAgRE9NIGFubm90YXRpb25zKVxuICogdG8gYXZvaWQgZHVwbGljYXRpb24uIEFuIGF0dGVtcHQgdG8gYWRkIGEgZHVwbGljYXRlIHZpZXcgcmVzdWx0cyBpbiB0aGVcbiAqIGNvbGxlY3Rpb24gcmV0dXJuaW5nIHRoZSBpbmRleCBvZiB0aGUgcHJldmlvdXNseSBjb2xsZWN0ZWQgc2VyaWFsaXplZCB2aWV3LlxuICogVGhpcyByZWR1Y2VzIHRoZSBudW1iZXIgb2YgYW5ub3RhdGlvbnMgbmVlZGVkIGZvciBhIGdpdmVuIHBhZ2UuXG4gKi9cbmNsYXNzIFNlcmlhbGl6ZWRWaWV3Q29sbGVjdGlvbiB7XG4gIHByaXZhdGUgdmlld3M6IFNlcmlhbGl6ZWRWaWV3W10gPSBbXTtcbiAgcHJpdmF0ZSBpbmRleEJ5Q29udGVudCA9IG5ldyBNYXA8c3RyaW5nLCBudW1iZXI+KCk7XG5cbiAgYWRkKHNlcmlhbGl6ZWRWaWV3OiBTZXJpYWxpemVkVmlldyk6IG51bWJlciB7XG4gICAgY29uc3Qgdmlld0FzU3RyaW5nID0gSlNPTi5zdHJpbmdpZnkoc2VyaWFsaXplZFZpZXcpO1xuICAgIGlmICghdGhpcy5pbmRleEJ5Q29udGVudC5oYXModmlld0FzU3RyaW5nKSkge1xuICAgICAgY29uc3QgaW5kZXggPSB0aGlzLnZpZXdzLmxlbmd0aDtcbiAgICAgIHRoaXMudmlld3MucHVzaChzZXJpYWxpemVkVmlldyk7XG4gICAgICB0aGlzLmluZGV4QnlDb250ZW50LnNldCh2aWV3QXNTdHJpbmcsIGluZGV4KTtcbiAgICAgIHJldHVybiBpbmRleDtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuaW5kZXhCeUNvbnRlbnQuZ2V0KHZpZXdBc1N0cmluZykhO1xuICB9XG5cbiAgZ2V0QWxsKCk6IFNlcmlhbGl6ZWRWaWV3W10ge1xuICAgIHJldHVybiB0aGlzLnZpZXdzO1xuICB9XG59XG5cbi8qKlxuICogR2xvYmFsIGNvdW50ZXIgdGhhdCBpcyB1c2VkIHRvIGdlbmVyYXRlIGEgdW5pcXVlIGlkIGZvciBUVmlld3NcbiAqIGR1cmluZyB0aGUgc2VyaWFsaXphdGlvbiBwcm9jZXNzLlxuICovXG5sZXQgdFZpZXdTc3JJZCA9IDA7XG5cbi8qKlxuICogR2VuZXJhdGVzIGEgdW5pcXVlIGlkIGZvciBhIGdpdmVuIFRWaWV3IGFuZCByZXR1cm5zIHRoaXMgaWQuXG4gKiBUaGUgaWQgaXMgYWxzbyBzdG9yZWQgb24gdGhpcyBpbnN0YW5jZSBvZiBhIFRWaWV3IGFuZCByZXVzZWQgaW5cbiAqIHN1YnNlcXVlbnQgY2FsbHMuXG4gKlxuICogVGhpcyBpZCBpcyBuZWVkZWQgdG8gdW5pcXVlbHkgaWRlbnRpZnkgYW5kIHBpY2sgdXAgZGVoeWRyYXRlZCB2aWV3c1xuICogYXQgcnVudGltZS5cbiAqL1xuZnVuY3Rpb24gZ2V0U3NySWQodFZpZXc6IFRWaWV3KTogc3RyaW5nIHtcbiAgaWYgKCF0Vmlldy5zc3JJZCkge1xuICAgIHRWaWV3LnNzcklkID0gYHQke3RWaWV3U3NySWQrK31gO1xuICB9XG4gIHJldHVybiB0Vmlldy5zc3JJZDtcbn1cblxuLyoqXG4gKiBEZXNjcmliZXMgYSBjb250ZXh0IGF2YWlsYWJsZSBkdXJpbmcgdGhlIHNlcmlhbGl6YXRpb25cbiAqIHByb2Nlc3MuIFRoZSBjb250ZXh0IGlzIHVzZWQgdG8gc2hhcmUgYW5kIGNvbGxlY3QgaW5mb3JtYXRpb25cbiAqIGR1cmluZyB0aGUgc2VyaWFsaXphdGlvbi5cbiAqL1xuaW50ZXJmYWNlIEh5ZHJhdGlvbkNvbnRleHQge1xuICBzZXJpYWxpemVkVmlld0NvbGxlY3Rpb246IFNlcmlhbGl6ZWRWaWV3Q29sbGVjdGlvbjtcbiAgY29ycnVwdGVkVGV4dE5vZGVzOiBNYXA8SFRNTEVsZW1lbnQsIFRleHROb2RlTWFya2VyPjtcbn1cblxuLyoqXG4gKiBDb21wdXRlcyB0aGUgbnVtYmVyIG9mIHJvb3Qgbm9kZXMgaW4gYSBnaXZlbiB2aWV3XG4gKiAob3IgY2hpbGQgbm9kZXMgaW4gYSBnaXZlbiBjb250YWluZXIgaWYgYSB0Tm9kZSBpcyBwcm92aWRlZCkuXG4gKi9cbmZ1bmN0aW9uIGNhbGNOdW1Sb290Tm9kZXModFZpZXc6IFRWaWV3LCBsVmlldzogTFZpZXcsIHROb2RlOiBUTm9kZXxudWxsKTogbnVtYmVyIHtcbiAgY29uc3Qgcm9vdE5vZGVzOiB1bmtub3duW10gPSBbXTtcbiAgY29sbGVjdE5hdGl2ZU5vZGVzKHRWaWV3LCBsVmlldywgdE5vZGUsIHJvb3ROb2Rlcyk7XG4gIHJldHVybiByb290Tm9kZXMubGVuZ3RoO1xufVxuXG4vKipcbiAqIEFubm90YXRlcyBhbGwgY29tcG9uZW50cyBib290c3RyYXBwZWQgaW4gYSBnaXZlbiBBcHBsaWNhdGlvblJlZlxuICogd2l0aCBpbmZvIG5lZWRlZCBmb3IgaHlkcmF0aW9uLlxuICpcbiAqIEBwYXJhbSBhcHBSZWYgQW4gaW5zdGFuY2Ugb2YgYW4gQXBwbGljYXRpb25SZWYuXG4gKiBAcGFyYW0gZG9jIEEgcmVmZXJlbmNlIHRvIHRoZSBjdXJyZW50IERvY3VtZW50IGluc3RhbmNlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gYW5ub3RhdGVGb3JIeWRyYXRpb24oYXBwUmVmOiBBcHBsaWNhdGlvblJlZiwgZG9jOiBEb2N1bWVudCkge1xuICBjb25zdCBzZXJpYWxpemVkVmlld0NvbGxlY3Rpb24gPSBuZXcgU2VyaWFsaXplZFZpZXdDb2xsZWN0aW9uKCk7XG4gIGNvbnN0IGNvcnJ1cHRlZFRleHROb2RlcyA9IG5ldyBNYXA8SFRNTEVsZW1lbnQsIFRleHROb2RlTWFya2VyPigpO1xuICBjb25zdCB2aWV3UmVmcyA9IGFwcFJlZi5fdmlld3M7XG4gIGZvciAoY29uc3Qgdmlld1JlZiBvZiB2aWV3UmVmcykge1xuICAgIGNvbnN0IGxWaWV3ID0gZ2V0Q29tcG9uZW50TFZpZXdGb3JIeWRyYXRpb24odmlld1JlZik7XG4gICAgLy8gQW4gYGxWaWV3YCBtaWdodCBiZSBgbnVsbGAgaWYgYSBgVmlld1JlZmAgcmVwcmVzZW50c1xuICAgIC8vIGFuIGVtYmVkZGVkIHZpZXcgKG5vdCBhIGNvbXBvbmVudCB2aWV3KS5cbiAgICBpZiAobFZpZXcgIT09IG51bGwpIHtcbiAgICAgIGNvbnN0IGhvc3RFbGVtZW50ID0gbFZpZXdbSE9TVF07XG4gICAgICBpZiAoaG9zdEVsZW1lbnQpIHtcbiAgICAgICAgY29uc3QgY29udGV4dDogSHlkcmF0aW9uQ29udGV4dCA9IHtcbiAgICAgICAgICBzZXJpYWxpemVkVmlld0NvbGxlY3Rpb24sXG4gICAgICAgICAgY29ycnVwdGVkVGV4dE5vZGVzLFxuICAgICAgICB9O1xuICAgICAgICBhbm5vdGF0ZUhvc3RFbGVtZW50Rm9ySHlkcmF0aW9uKGhvc3RFbGVtZW50IGFzIEhUTUxFbGVtZW50LCBsVmlldywgY29udGV4dCk7XG4gICAgICAgIGluc2VydENvcnJ1cHRlZFRleHROb2RlTWFya2Vycyhjb3JydXB0ZWRUZXh0Tm9kZXMsIGRvYyk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIGNvbnN0IGFsbFNlcmlhbGl6ZWRWaWV3cyA9IHNlcmlhbGl6ZWRWaWV3Q29sbGVjdGlvbi5nZXRBbGwoKTtcbiAgaWYgKGFsbFNlcmlhbGl6ZWRWaWV3cy5sZW5ndGggPiAwKSB7XG4gICAgY29uc3QgdHJhbnNmZXJTdGF0ZSA9IGFwcFJlZi5pbmplY3Rvci5nZXQoVHJhbnNmZXJTdGF0ZSk7XG4gICAgdHJhbnNmZXJTdGF0ZS5zZXQoTkdIX0RBVEFfS0VZLCBhbGxTZXJpYWxpemVkVmlld3MpO1xuICB9XG59XG5cbi8qKlxuICogU2VyaWFsaXplcyB0aGUgbENvbnRhaW5lciBkYXRhIGludG8gYSBsaXN0IG9mIFNlcmlhbGl6ZWRWaWV3IG9iamVjdHMsXG4gKiB0aGF0IHJlcHJlc2VudCB2aWV3cyB3aXRoaW4gdGhpcyBsQ29udGFpbmVyLlxuICpcbiAqIEBwYXJhbSBsQ29udGFpbmVyIHRoZSBsQ29udGFpbmVyIHdlIGFyZSBzZXJpYWxpemluZ1xuICogQHBhcmFtIGNvbnRleHQgdGhlIGh5ZHJhdGlvbiBjb250ZXh0XG4gKiBAcmV0dXJucyBhbiBhcnJheSBvZiB0aGUgYFNlcmlhbGl6ZWRWaWV3YCBvYmplY3RzXG4gKi9cbmZ1bmN0aW9uIHNlcmlhbGl6ZUxDb250YWluZXIoXG4gICAgbENvbnRhaW5lcjogTENvbnRhaW5lciwgY29udGV4dDogSHlkcmF0aW9uQ29udGV4dCk6IFNlcmlhbGl6ZWRDb250YWluZXJWaWV3W10ge1xuICBjb25zdCB2aWV3czogU2VyaWFsaXplZENvbnRhaW5lclZpZXdbXSA9IFtdO1xuICBsZXQgbGFzdFZpZXdBc1N0cmluZzogc3RyaW5nID0gJyc7XG5cbiAgZm9yIChsZXQgaSA9IENPTlRBSU5FUl9IRUFERVJfT0ZGU0VUOyBpIDwgbENvbnRhaW5lci5sZW5ndGg7IGkrKykge1xuICAgIGxldCBjaGlsZExWaWV3ID0gbENvbnRhaW5lcltpXSBhcyBMVmlldztcblxuICAgIC8vIElmIHRoaXMgaXMgYSByb290IHZpZXcsIGdldCBhbiBMVmlldyBmb3IgdGhlIHVuZGVybHlpbmcgY29tcG9uZW50LFxuICAgIC8vIGJlY2F1c2UgaXQgY29udGFpbnMgaW5mb3JtYXRpb24gYWJvdXQgdGhlIHZpZXcgdG8gc2VyaWFsaXplLlxuICAgIGlmIChpc1Jvb3RWaWV3KGNoaWxkTFZpZXcpKSB7XG4gICAgICBjaGlsZExWaWV3ID0gY2hpbGRMVmlld1tIRUFERVJfT0ZGU0VUXTtcbiAgICB9XG4gICAgY29uc3QgY2hpbGRUVmlldyA9IGNoaWxkTFZpZXdbVFZJRVddO1xuXG4gICAgbGV0IHRlbXBsYXRlOiBzdHJpbmc7XG4gICAgbGV0IG51bVJvb3ROb2RlcyA9IDA7XG4gICAgaWYgKGNoaWxkVFZpZXcudHlwZSA9PT0gVFZpZXdUeXBlLkNvbXBvbmVudCkge1xuICAgICAgdGVtcGxhdGUgPSBjaGlsZFRWaWV3LnNzcklkITtcblxuICAgICAgLy8gVGhpcyBpcyBhIGNvbXBvbmVudCB2aWV3LCB0aHVzIGl0IGhhcyBvbmx5IDEgcm9vdCBub2RlOiB0aGUgY29tcG9uZW50XG4gICAgICAvLyBob3N0IG5vZGUgaXRzZWxmIChvdGhlciBub2RlcyB3b3VsZCBiZSBpbnNpZGUgdGhhdCBob3N0IG5vZGUpLlxuICAgICAgbnVtUm9vdE5vZGVzID0gMTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGVtcGxhdGUgPSBnZXRTc3JJZChjaGlsZFRWaWV3KTtcbiAgICAgIG51bVJvb3ROb2RlcyA9IGNhbGNOdW1Sb290Tm9kZXMoY2hpbGRUVmlldywgY2hpbGRMVmlldywgY2hpbGRUVmlldy5maXJzdENoaWxkKTtcbiAgICB9XG5cbiAgICBjb25zdCB2aWV3OiBTZXJpYWxpemVkQ29udGFpbmVyVmlldyA9IHtcbiAgICAgIFtURU1QTEFURV9JRF06IHRlbXBsYXRlLFxuICAgICAgW05VTV9ST09UX05PREVTXTogbnVtUm9vdE5vZGVzLFxuICAgICAgLi4uc2VyaWFsaXplTFZpZXcobENvbnRhaW5lcltpXSBhcyBMVmlldywgY29udGV4dCksXG4gICAgfTtcblxuICAgIC8vIENoZWNrIGlmIHRoZSBwcmV2aW91cyB2aWV3IGhhcyB0aGUgc2FtZSBzaGFwZSAoZm9yIGV4YW1wbGUsIGl0IHdhc1xuICAgIC8vIHByb2R1Y2VkIGJ5IHRoZSAqbmdGb3IpLCBpbiB3aGljaCBjYXNlIGJ1bXAgdGhlIGNvdW50ZXIgb24gdGhlIHByZXZpb3VzXG4gICAgLy8gdmlldyBpbnN0ZWFkIG9mIGluY2x1ZGluZyB0aGUgc2FtZSBpbmZvcm1hdGlvbiBhZ2Fpbi5cbiAgICBjb25zdCBjdXJyZW50Vmlld0FzU3RyaW5nID0gSlNPTi5zdHJpbmdpZnkodmlldyk7XG4gICAgaWYgKHZpZXdzLmxlbmd0aCA+IDAgJiYgY3VycmVudFZpZXdBc1N0cmluZyA9PT0gbGFzdFZpZXdBc1N0cmluZykge1xuICAgICAgY29uc3QgcHJldmlvdXNWaWV3ID0gdmlld3Nbdmlld3MubGVuZ3RoIC0gMV07XG4gICAgICBwcmV2aW91c1ZpZXdbTVVMVElQTElFUl0gPz89IDE7XG4gICAgICBwcmV2aW91c1ZpZXdbTVVMVElQTElFUl0rKztcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gUmVjb3JkIHRoaXMgdmlldyBhcyBtb3N0IHJlY2VudGx5IGFkZGVkLlxuICAgICAgbGFzdFZpZXdBc1N0cmluZyA9IGN1cnJlbnRWaWV3QXNTdHJpbmc7XG4gICAgICB2aWV3cy5wdXNoKHZpZXcpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gdmlld3M7XG59XG5cbi8qKlxuICogSGVscGVyIGZ1bmN0aW9uIHRvIHByb2R1Y2UgYSBub2RlIHBhdGggKHdoaWNoIG5hdmlnYXRpb24gc3RlcHMgcnVudGltZSBsb2dpY1xuICogbmVlZHMgdG8gdGFrZSB0byBsb2NhdGUgYSBub2RlKSBhbmQgc3RvcmVzIGl0IGluIHRoZSBgTk9ERVNgIHNlY3Rpb24gb2YgdGhlXG4gKiBjdXJyZW50IHNlcmlhbGl6ZWQgdmlldy5cbiAqL1xuZnVuY3Rpb24gYXBwZW5kU2VyaWFsaXplZE5vZGVQYXRoKG5naDogU2VyaWFsaXplZFZpZXcsIHROb2RlOiBUTm9kZSwgbFZpZXc6IExWaWV3KSB7XG4gIGNvbnN0IG5vT2Zmc2V0SW5kZXggPSB0Tm9kZS5pbmRleCAtIEhFQURFUl9PRkZTRVQ7XG4gIG5naFtOT0RFU10gPz89IHt9O1xuICBuZ2hbTk9ERVNdW25vT2Zmc2V0SW5kZXhdID0gY2FsY1BhdGhGb3JOb2RlKHROb2RlLCBsVmlldyk7XG59XG5cbi8qKlxuICogVGhlcmUgaXMgbm8gc3BlY2lhbCBUTm9kZSB0eXBlIGZvciBhbiBpMThuIGJsb2NrLCBzbyB3ZSB2ZXJpZnlcbiAqIHdoZXRoZXIgdGhlIHN0cnVjdHVyZSB0aGF0IHdlIHN0b3JlIGF0IHRoZSBgVFZpZXcuZGF0YVtpZHhdYCBwb3NpdGlvblxuICogaGFzIHRoZSBgVEkxOG5gIHNoYXBlLlxuICovXG5mdW5jdGlvbiBpc1RJMThuTm9kZShvYmo6IHVua25vd24pOiBib29sZWFuIHtcbiAgY29uc3QgdEkxOG4gPSBvYmogYXMgVEkxOG47XG4gIHJldHVybiB0STE4bi5oYXNPd25Qcm9wZXJ0eSgnY3JlYXRlJykgJiYgdEkxOG4uaGFzT3duUHJvcGVydHkoJ3VwZGF0ZScpO1xufVxuXG4vKipcbiAqIFNlcmlhbGl6ZXMgdGhlIGxWaWV3IGRhdGEgaW50byBhIFNlcmlhbGl6ZWRWaWV3IG9iamVjdCB0aGF0IHdpbGwgbGF0ZXIgYmUgYWRkZWRcbiAqIHRvIHRoZSBUcmFuc2ZlclN0YXRlIHN0b3JhZ2UgYW5kIHJlZmVyZW5jZWQgdXNpbmcgdGhlIGBuZ2hgIGF0dHJpYnV0ZSBvbiBhIGhvc3RcbiAqIGVsZW1lbnQuXG4gKlxuICogQHBhcmFtIGxWaWV3IHRoZSBsVmlldyB3ZSBhcmUgc2VyaWFsaXppbmdcbiAqIEBwYXJhbSBjb250ZXh0IHRoZSBoeWRyYXRpb24gY29udGV4dFxuICogQHJldHVybnMgdGhlIGBTZXJpYWxpemVkVmlld2Agb2JqZWN0IGNvbnRhaW5pbmcgdGhlIGRhdGEgdG8gYmUgYWRkZWQgdG8gdGhlIGhvc3Qgbm9kZVxuICovXG5mdW5jdGlvbiBzZXJpYWxpemVMVmlldyhsVmlldzogTFZpZXcsIGNvbnRleHQ6IEh5ZHJhdGlvbkNvbnRleHQpOiBTZXJpYWxpemVkVmlldyB7XG4gIGNvbnN0IG5naDogU2VyaWFsaXplZFZpZXcgPSB7fTtcbiAgY29uc3QgdFZpZXcgPSBsVmlld1tUVklFV107XG4gIC8vIEl0ZXJhdGUgb3ZlciBET00gZWxlbWVudCByZWZlcmVuY2VzIGluIGFuIExWaWV3LlxuICBmb3IgKGxldCBpID0gSEVBREVSX09GRlNFVDsgaSA8IHRWaWV3LmJpbmRpbmdTdGFydEluZGV4OyBpKyspIHtcbiAgICBjb25zdCB0Tm9kZSA9IHRWaWV3LmRhdGFbaV0gYXMgVE5vZGU7XG4gICAgY29uc3Qgbm9PZmZzZXRJbmRleCA9IGkgLSBIRUFERVJfT0ZGU0VUO1xuICAgIC8vIExvY2FsIHJlZnMgKGUuZy4gPGRpdiAjbG9jYWxSZWY+KSB0YWtlIHVwIGFuIGV4dHJhIHNsb3QgaW4gTFZpZXdzXG4gICAgLy8gdG8gc3RvcmUgdGhlIHNhbWUgZWxlbWVudC4gSW4gdGhpcyBjYXNlLCB0aGVyZSBpcyBubyBpbmZvcm1hdGlvbiBpblxuICAgIC8vIGEgY29ycmVzcG9uZGluZyBzbG90IGluIFROb2RlIGRhdGEgc3RydWN0dXJlLiBJZiB0aGF0J3MgdGhlIGNhc2UsIGp1c3RcbiAgICAvLyBza2lwIHRoaXMgc2xvdCBhbmQgbW92ZSB0byB0aGUgbmV4dCBvbmUuXG4gICAgaWYgKCF0Tm9kZSkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgLy8gQ2hlY2sgaWYgYSBuYXRpdmUgbm9kZSB0aGF0IHJlcHJlc2VudHMgYSBnaXZlbiBUTm9kZSBpcyBkaXNjb25uZWN0ZWQgZnJvbSB0aGUgRE9NIHRyZWUuXG4gICAgLy8gU3VjaCBub2RlcyBtdXN0IGJlIGV4Y2x1ZGVkIGZyb20gdGhlIGh5ZHJhdGlvbiAoc2luY2UgdGhlIGh5ZHJhdGlvbiB3b24ndCBiZSBhYmxlIHRvXG4gICAgLy8gZmluZCB0aGVtKSwgc28gdGhlIFROb2RlIGlkcyBhcmUgY29sbGVjdGVkIGFuZCB1c2VkIGF0IHJ1bnRpbWUgdG8gc2tpcCB0aGUgaHlkcmF0aW9uLlxuICAgIC8vXG4gICAgLy8gVGhpcyBzaXR1YXRpb24gbWF5IGhhcHBlbiBkdXJpbmcgdGhlIGNvbnRlbnQgcHJvamVjdGlvbiwgd2hlbiBzb21lIG5vZGVzIGRvbid0IG1ha2UgaXRcbiAgICAvLyBpbnRvIG9uZSBvZiB0aGUgY29udGVudCBwcm9qZWN0aW9uIHNsb3RzIChmb3IgZXhhbXBsZSwgd2hlbiB0aGVyZSBpcyBubyBkZWZhdWx0XG4gICAgLy8gPG5nLWNvbnRlbnQgLz4gc2xvdCBpbiBwcm9qZWN0b3IgY29tcG9uZW50J3MgdGVtcGxhdGUpLlxuICAgIC8vXG4gICAgLy8gTm90ZTogd2UgbGV2ZXJhZ2UgdGhlIGZhY3QgdGhhdCB3ZSBoYXZlIHRoaXMgaW5mb3JtYXRpb24gYXZhaWxhYmxlIGluIHRoZSBET00gZW11bGF0aW9uXG4gICAgLy8gbGF5ZXIgKGluIERvbWlubykgZm9yIG5vdy4gTG9uZ2VyLXRlcm0gc29sdXRpb24gc2hvdWxkIG5vdCByZWx5IG9uIHRoZSBET00gZW11bGF0aW9uIGFuZFxuICAgIC8vIG9ubHkgdXNlIGludGVybmFsIGRhdGEgc3RydWN0dXJlcyBhbmQgc3RhdGUgdG8gY29tcHV0ZSB0aGlzIGluZm9ybWF0aW9uLlxuICAgIGlmICghKHROb2RlLnR5cGUgJiBUTm9kZVR5cGUuUHJvamVjdGlvbikgJiYgISFsVmlld1tpXSAmJlxuICAgICAgICAhKHVud3JhcFJOb2RlKGxWaWV3W2ldKSBhcyBOb2RlKS5pc0Nvbm5lY3RlZCkge1xuICAgICAgbmdoW0RJU0NPTk5FQ1RFRF9OT0RFU10gPz89IFtdO1xuICAgICAgbmdoW0RJU0NPTk5FQ1RFRF9OT0RFU10ucHVzaChub09mZnNldEluZGV4KTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICBpZiAoQXJyYXkuaXNBcnJheSh0Tm9kZS5wcm9qZWN0aW9uKSkge1xuICAgICAgZm9yIChjb25zdCBwcm9qZWN0aW9uSGVhZFROb2RlIG9mIHROb2RlLnByb2plY3Rpb24pIHtcbiAgICAgICAgLy8gV2UgbWF5IGhhdmUgYG51bGxgcyBpbiBzbG90cyB3aXRoIG5vIHByb2plY3RlZCBjb250ZW50LlxuICAgICAgICBpZiAoIXByb2plY3Rpb25IZWFkVE5vZGUpIGNvbnRpbnVlO1xuXG4gICAgICAgIGlmICghQXJyYXkuaXNBcnJheShwcm9qZWN0aW9uSGVhZFROb2RlKSkge1xuICAgICAgICAgIC8vIElmIHdlIHByb2Nlc3MgcmUtcHJvamVjdGVkIGNvbnRlbnQgKGkuZS4gYDxuZy1jb250ZW50PmBcbiAgICAgICAgICAvLyBhcHBlYXJzIGF0IHByb2plY3Rpb24gbG9jYXRpb24pLCBza2lwIGFubm90YXRpb25zIGZvciB0aGlzIGNvbnRlbnRcbiAgICAgICAgICAvLyBzaW5jZSBhbGwgRE9NIG5vZGVzIGluIHRoaXMgcHJvamVjdGlvbiB3ZXJlIGhhbmRsZWQgd2hpbGUgcHJvY2Vzc2luZ1xuICAgICAgICAgIC8vIGEgcGFyZW50IGxWaWV3LCB3aGljaCBjb250YWlucyB0aG9zZSBub2Rlcy5cbiAgICAgICAgICBpZiAoIWlzUHJvamVjdGlvblROb2RlKHByb2plY3Rpb25IZWFkVE5vZGUpICYmXG4gICAgICAgICAgICAgICFpc0luU2tpcEh5ZHJhdGlvbkJsb2NrKHByb2plY3Rpb25IZWFkVE5vZGUpKSB7XG4gICAgICAgICAgICBhcHBlbmRTZXJpYWxpemVkTm9kZVBhdGgobmdoLCBwcm9qZWN0aW9uSGVhZFROb2RlLCBsVmlldyk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIElmIGEgdmFsdWUgaXMgYW4gYXJyYXksIGl0IG1lYW5zIHRoYXQgd2UgYXJlIHByb2Nlc3NpbmcgYSBwcm9qZWN0aW9uXG4gICAgICAgICAgLy8gd2hlcmUgcHJvamVjdGFibGUgbm9kZXMgd2VyZSBwYXNzZWQgaW4gYXMgRE9NIG5vZGVzIChmb3IgZXhhbXBsZSwgd2hlblxuICAgICAgICAgIC8vIGNhbGxpbmcgYFZpZXdDb250YWluZXJSZWYuY3JlYXRlQ29tcG9uZW50KENtcEEsIHtwcm9qZWN0YWJsZU5vZGVzOiBbLi4uXX0pYCkuXG4gICAgICAgICAgLy9cbiAgICAgICAgICAvLyBJbiB0aGlzIHNjZW5hcmlvLCBub2RlcyBjYW4gY29tZSBmcm9tIGFueXdoZXJlIChlaXRoZXIgY3JlYXRlZCBtYW51YWxseSxcbiAgICAgICAgICAvLyBhY2Nlc3NlZCB2aWEgYGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JgLCBldGMpIGFuZCBtYXkgYmUgaW4gYW55IHN0YXRlXG4gICAgICAgICAgLy8gKGF0dGFjaGVkIG9yIGRldGFjaGVkIGZyb20gdGhlIERPTSB0cmVlKS4gQXMgYSByZXN1bHQsIHdlIGNhbiBub3QgcmVsaWFibHlcbiAgICAgICAgICAvLyByZXN0b3JlIHRoZSBzdGF0ZSBmb3Igc3VjaCBjYXNlcyBkdXJpbmcgaHlkcmF0aW9uLlxuXG4gICAgICAgICAgdGhyb3cgdW5zdXBwb3J0ZWRQcm9qZWN0aW9uT2ZEb21Ob2Rlcyh1bndyYXBSTm9kZShsVmlld1tpXSkpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChpc0xDb250YWluZXIobFZpZXdbaV0pKSB7XG4gICAgICAvLyBTZXJpYWxpemUgaW5mb3JtYXRpb24gYWJvdXQgYSB0ZW1wbGF0ZS5cbiAgICAgIGNvbnN0IGVtYmVkZGVkVFZpZXcgPSB0Tm9kZS50VmlldztcbiAgICAgIGlmIChlbWJlZGRlZFRWaWV3ICE9PSBudWxsKSB7XG4gICAgICAgIG5naFtURU1QTEFURVNdID8/PSB7fTtcbiAgICAgICAgbmdoW1RFTVBMQVRFU11bbm9PZmZzZXRJbmRleF0gPSBnZXRTc3JJZChlbWJlZGRlZFRWaWV3KTtcbiAgICAgIH1cblxuICAgICAgLy8gU2VyaWFsaXplIHZpZXdzIHdpdGhpbiB0aGlzIExDb250YWluZXIuXG4gICAgICBjb25zdCBob3N0Tm9kZSA9IGxWaWV3W2ldW0hPU1RdITsgIC8vIGhvc3Qgbm9kZSBvZiB0aGlzIGNvbnRhaW5lclxuXG4gICAgICAvLyBMVmlld1tpXVtIT1NUXSBjYW4gYmUgb2YgMiBkaWZmZXJlbnQgdHlwZXM6XG4gICAgICAvLyAtIGVpdGhlciBhIERPTSBub2RlXG4gICAgICAvLyAtIG9yIGFuIGFycmF5IHRoYXQgcmVwcmVzZW50cyBhbiBMVmlldyBvZiBhIGNvbXBvbmVudFxuICAgICAgaWYgKEFycmF5LmlzQXJyYXkoaG9zdE5vZGUpKSB7XG4gICAgICAgIC8vIFRoaXMgaXMgYSBjb21wb25lbnQsIHNlcmlhbGl6ZSBpbmZvIGFib3V0IGl0LlxuICAgICAgICBjb25zdCB0YXJnZXROb2RlID0gdW53cmFwUk5vZGUoaG9zdE5vZGUgYXMgTFZpZXcpIGFzIFJFbGVtZW50O1xuICAgICAgICBpZiAoISh0YXJnZXROb2RlIGFzIEhUTUxFbGVtZW50KS5oYXNBdHRyaWJ1dGUoU0tJUF9IWURSQVRJT05fQVRUUl9OQU1FKSkge1xuICAgICAgICAgIGFubm90YXRlSG9zdEVsZW1lbnRGb3JIeWRyYXRpb24odGFyZ2V0Tm9kZSwgaG9zdE5vZGUgYXMgTFZpZXcsIGNvbnRleHQpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBuZ2hbQ09OVEFJTkVSU10gPz89IHt9O1xuICAgICAgbmdoW0NPTlRBSU5FUlNdW25vT2Zmc2V0SW5kZXhdID0gc2VyaWFsaXplTENvbnRhaW5lcihsVmlld1tpXSwgY29udGV4dCk7XG4gICAgfSBlbHNlIGlmIChBcnJheS5pc0FycmF5KGxWaWV3W2ldKSkge1xuICAgICAgLy8gVGhpcyBpcyBhIGNvbXBvbmVudCwgYW5ub3RhdGUgdGhlIGhvc3Qgbm9kZSB3aXRoIGFuIGBuZ2hgIGF0dHJpYnV0ZS5cbiAgICAgIGNvbnN0IHRhcmdldE5vZGUgPSB1bndyYXBSTm9kZShsVmlld1tpXVtIT1NUXSEpO1xuICAgICAgaWYgKCEodGFyZ2V0Tm9kZSBhcyBIVE1MRWxlbWVudCkuaGFzQXR0cmlidXRlKFNLSVBfSFlEUkFUSU9OX0FUVFJfTkFNRSkpIHtcbiAgICAgICAgYW5ub3RhdGVIb3N0RWxlbWVudEZvckh5ZHJhdGlvbih0YXJnZXROb2RlIGFzIFJFbGVtZW50LCBsVmlld1tpXSwgY29udGV4dCk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChpc1RJMThuTm9kZSh0Tm9kZSkpIHtcbiAgICAgIC8vIEh5ZHJhdGlvbiBmb3IgaTE4biBub2RlcyBpcyBub3QgKnlldCogc3VwcG9ydGVkLlxuICAgICAgLy8gUHJvZHVjZSBhbiBlcnJvciBtZXNzYWdlIHdoaWNoIHdvdWxkIGFsc28gZGVzY3JpYmUgcG9zc2libGVcbiAgICAgIC8vIHNvbHV0aW9ucyAoc3dpdGNoaW5nIGJhY2sgdG8gdGhlIFwiZGVzdHJ1Y3RpdmVcIiBoeWRyYXRpb24gb3JcbiAgICAgIC8vIGV4Y2x1ZGluZyBhIGNvbXBvbmVudCBmcm9tIGh5ZHJhdGlvbiB2aWEgYG5nU2tpcEh5ZHJhdGlvbmApLlxuICAgICAgLy9cbiAgICAgIC8vIFRPRE8oYWt1c2huaXIpOiB3ZSBzaG91bGQgZmluZCBhIGJldHRlciB3YXkgdG8gZ2V0IGEgaG9sZCBvZiB0aGUgbm9kZSB0aGF0IGhhcyB0aGUgYGkxOG5gXG4gICAgICAvLyBhdHRyaWJ1dGUgb24gaXQuIEZvciBub3csIHdlIGVpdGhlciByZWZlciB0byB0aGUgaG9zdCBlbGVtZW50IG9mIHRoZSBjb21wb25lbnQgb3IgdG8gdGhlXG4gICAgICAvLyBwcmV2aW91cyBlbGVtZW50IGluIHRoZSBMVmlldy5cbiAgICAgIGNvbnN0IHRhcmdldE5vZGUgPSAoaSA9PT0gSEVBREVSX09GRlNFVCkgPyBsVmlld1tIT1NUXSEgOiB1bndyYXBSTm9kZShsVmlld1tpIC0gMV0pO1xuICAgICAgdGhyb3cgbm90WWV0U3VwcG9ydGVkSTE4bkJsb2NrRXJyb3IodGFyZ2V0Tm9kZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIDxuZy1jb250YWluZXI+IGNhc2VcbiAgICAgIGlmICh0Tm9kZS50eXBlICYgVE5vZGVUeXBlLkVsZW1lbnRDb250YWluZXIpIHtcbiAgICAgICAgLy8gQW4gPG5nLWNvbnRhaW5lcj4gaXMgcmVwcmVzZW50ZWQgYnkgdGhlIG51bWJlciBvZlxuICAgICAgICAvLyB0b3AtbGV2ZWwgbm9kZXMuIFRoaXMgaW5mb3JtYXRpb24gaXMgbmVlZGVkIHRvIHNraXAgb3ZlclxuICAgICAgICAvLyB0aG9zZSBub2RlcyB0byByZWFjaCBhIGNvcnJlc3BvbmRpbmcgYW5jaG9yIG5vZGUgKGNvbW1lbnQgbm9kZSkuXG4gICAgICAgIG5naFtFTEVNRU5UX0NPTlRBSU5FUlNdID8/PSB7fTtcbiAgICAgICAgbmdoW0VMRU1FTlRfQ09OVEFJTkVSU11bbm9PZmZzZXRJbmRleF0gPSBjYWxjTnVtUm9vdE5vZGVzKHRWaWV3LCBsVmlldywgdE5vZGUuY2hpbGQpO1xuICAgICAgfSBlbHNlIGlmICh0Tm9kZS50eXBlICYgVE5vZGVUeXBlLlByb2plY3Rpb24pIHtcbiAgICAgICAgLy8gQ3VycmVudCBUTm9kZSByZXByZXNlbnRzIGFuIGA8bmctY29udGVudD5gIHNsb3QsIHRodXMgaXQgaGFzIG5vXG4gICAgICAgIC8vIERPTSBlbGVtZW50cyBhc3NvY2lhdGVkIHdpdGggaXQsIHNvIHRoZSAqKm5leHQgc2libGluZyoqIG5vZGUgd291bGRcbiAgICAgICAgLy8gbm90IGJlIGFibGUgdG8gZmluZCBhbiBhbmNob3IuIEluIHRoaXMgY2FzZSwgdXNlIGZ1bGwgcGF0aCBpbnN0ZWFkLlxuICAgICAgICBsZXQgbmV4dFROb2RlID0gdE5vZGUubmV4dDtcbiAgICAgICAgLy8gU2tpcCBvdmVyIGFsbCBgPG5nLWNvbnRlbnQ+YCBzbG90cyBpbiBhIHJvdy5cbiAgICAgICAgd2hpbGUgKG5leHRUTm9kZSAhPT0gbnVsbCAmJiAobmV4dFROb2RlLnR5cGUgJiBUTm9kZVR5cGUuUHJvamVjdGlvbikpIHtcbiAgICAgICAgICBuZXh0VE5vZGUgPSBuZXh0VE5vZGUubmV4dDtcbiAgICAgICAgfVxuICAgICAgICBpZiAobmV4dFROb2RlICYmICFpc0luU2tpcEh5ZHJhdGlvbkJsb2NrKG5leHRUTm9kZSkpIHtcbiAgICAgICAgICAvLyBIYW5kbGUgYSB0Tm9kZSBhZnRlciB0aGUgYDxuZy1jb250ZW50PmAgc2xvdC5cbiAgICAgICAgICBhcHBlbmRTZXJpYWxpemVkTm9kZVBhdGgobmdoLCBuZXh0VE5vZGUsIGxWaWV3KTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gSGFuZGxlIGNhc2VzIHdoZXJlIHRleHQgbm9kZXMgY2FuIGJlIGxvc3QgYWZ0ZXIgRE9NIHNlcmlhbGl6YXRpb246XG4gICAgICAgIC8vICAxLiBXaGVuIHRoZXJlIGlzIGFuICplbXB0eSB0ZXh0IG5vZGUqIGluIERPTTogaW4gdGhpcyBjYXNlLCB0aGlzXG4gICAgICAgIC8vICAgICBub2RlIHdvdWxkIG5vdCBtYWtlIGl0IGludG8gdGhlIHNlcmlhbGl6ZWQgc3RyaW5nIGFuZCBhcyBhIHJlc3VsdCxcbiAgICAgICAgLy8gICAgIHRoaXMgbm9kZSB3b3VsZG4ndCBiZSBjcmVhdGVkIGluIGEgYnJvd3Nlci4gVGhpcyB3b3VsZCByZXN1bHQgaW5cbiAgICAgICAgLy8gICAgIGEgbWlzbWF0Y2ggZHVyaW5nIHRoZSBoeWRyYXRpb24sIHdoZXJlIHRoZSBydW50aW1lIGxvZ2ljIHdvdWxkIGV4cGVjdFxuICAgICAgICAvLyAgICAgYSB0ZXh0IG5vZGUgdG8gYmUgcHJlc2VudCBpbiBsaXZlIERPTSwgYnV0IG5vIHRleHQgbm9kZSB3b3VsZCBleGlzdC5cbiAgICAgICAgLy8gICAgIEV4YW1wbGU6IGA8c3Bhbj57eyBuYW1lIH19PC9zcGFuPmAgd2hlbiB0aGUgYG5hbWVgIGlzIGFuIGVtcHR5IHN0cmluZy5cbiAgICAgICAgLy8gICAgIFRoaXMgd291bGQgcmVzdWx0IGluIGA8c3Bhbj48L3NwYW4+YCBzdHJpbmcgYWZ0ZXIgc2VyaWFsaXphdGlvbiBhbmRcbiAgICAgICAgLy8gICAgIGluIGEgYnJvd3NlciBvbmx5IHRoZSBgc3BhbmAgZWxlbWVudCB3b3VsZCBiZSBjcmVhdGVkLiBUbyByZXNvbHZlIHRoYXQsXG4gICAgICAgIC8vICAgICBhbiBleHRyYSBjb21tZW50IG5vZGUgaXMgYXBwZW5kZWQgaW4gcGxhY2Ugb2YgYW4gZW1wdHkgdGV4dCBub2RlIGFuZFxuICAgICAgICAvLyAgICAgdGhhdCBzcGVjaWFsIGNvbW1lbnQgbm9kZSBpcyByZXBsYWNlZCB3aXRoIGFuIGVtcHR5IHRleHQgbm9kZSAqYmVmb3JlKlxuICAgICAgICAvLyAgICAgaHlkcmF0aW9uLlxuICAgICAgICAvLyAgMi4gV2hlbiB0aGVyZSBhcmUgMiBjb25zZWN1dGl2ZSB0ZXh0IG5vZGVzIHByZXNlbnQgaW4gdGhlIERPTS5cbiAgICAgICAgLy8gICAgIEV4YW1wbGU6IGA8ZGl2PkhlbGxvIDxuZy1jb250YWluZXIgKm5nSWY9XCJ0cnVlXCI+d29ybGQ8L25nLWNvbnRhaW5lcj48L2Rpdj5gLlxuICAgICAgICAvLyAgICAgSW4gdGhpcyBzY2VuYXJpbywgdGhlIGxpdmUgRE9NIHdvdWxkIGxvb2sgbGlrZSB0aGlzOlxuICAgICAgICAvLyAgICAgICA8ZGl2PiN0ZXh0KCdIZWxsbyAnKSAjdGV4dCgnd29ybGQnKSAjY29tbWVudCgnY29udGFpbmVyJyk8L2Rpdj5cbiAgICAgICAgLy8gICAgIFNlcmlhbGl6ZWQgc3RyaW5nIHdvdWxkIGxvb2sgbGlrZSB0aGlzOiBgPGRpdj5IZWxsbyB3b3JsZDwhLS1jb250YWluZXItLT48L2Rpdj5gLlxuICAgICAgICAvLyAgICAgVGhlIGxpdmUgRE9NIGluIGEgYnJvd3NlciBhZnRlciB0aGF0IHdvdWxkIGJlOlxuICAgICAgICAvLyAgICAgICA8ZGl2PiN0ZXh0KCdIZWxsbyB3b3JsZCcpICNjb21tZW50KCdjb250YWluZXInKTwvZGl2PlxuICAgICAgICAvLyAgICAgTm90aWNlIGhvdyAyIHRleHQgbm9kZXMgYXJlIG5vdyBcIm1lcmdlZFwiIGludG8gb25lLiBUaGlzIHdvdWxkIGNhdXNlIGh5ZHJhdGlvblxuICAgICAgICAvLyAgICAgbG9naWMgdG8gZmFpbCwgc2luY2UgaXQnZCBleHBlY3QgMiB0ZXh0IG5vZGVzIGJlaW5nIHByZXNlbnQsIG5vdCBvbmUuXG4gICAgICAgIC8vICAgICBUbyBmaXggdGhpcywgd2UgaW5zZXJ0IGEgc3BlY2lhbCBjb21tZW50IG5vZGUgaW4gYmV0d2VlbiB0aG9zZSB0ZXh0IG5vZGVzLCBzb1xuICAgICAgICAvLyAgICAgc2VyaWFsaXplZCByZXByZXNlbnRhdGlvbiBpczogYDxkaXY+SGVsbG8gPCEtLW5ndG5zLS0+d29ybGQ8IS0tY29udGFpbmVyLS0+PC9kaXY+YC5cbiAgICAgICAgLy8gICAgIFRoaXMgZm9yY2VzIGJyb3dzZXIgdG8gY3JlYXRlIDIgdGV4dCBub2RlcyBzZXBhcmF0ZWQgYnkgYSBjb21tZW50IG5vZGUuXG4gICAgICAgIC8vICAgICBCZWZvcmUgcnVubmluZyBhIGh5ZHJhdGlvbiBwcm9jZXNzLCB0aGlzIHNwZWNpYWwgY29tbWVudCBub2RlIGlzIHJlbW92ZWQsIHNvIHRoZVxuICAgICAgICAvLyAgICAgbGl2ZSBET00gaGFzIGV4YWN0bHkgdGhlIHNhbWUgc3RhdGUgYXMgaXQgd2FzIGJlZm9yZSBzZXJpYWxpemF0aW9uLlxuICAgICAgICBpZiAodE5vZGUudHlwZSAmIFROb2RlVHlwZS5UZXh0KSB7XG4gICAgICAgICAgY29uc3Qgck5vZGUgPSB1bndyYXBSTm9kZShsVmlld1tpXSkgYXMgSFRNTEVsZW1lbnQ7XG4gICAgICAgICAgaWYgKHJOb2RlLnRleHRDb250ZW50Py5yZXBsYWNlKC9cXHMvZ20sICcnKSA9PT0gJycpIHtcbiAgICAgICAgICAgIGNvbnRleHQuY29ycnVwdGVkVGV4dE5vZGVzLnNldChyTm9kZSwgVGV4dE5vZGVNYXJrZXIuRW1wdHlOb2RlKTtcbiAgICAgICAgICB9IGVsc2UgaWYgKHJOb2RlLm5leHRTaWJsaW5nPy5ub2RlVHlwZSA9PT0gTm9kZS5URVhUX05PREUpIHtcbiAgICAgICAgICAgIGNvbnRleHQuY29ycnVwdGVkVGV4dE5vZGVzLnNldChyTm9kZSwgVGV4dE5vZGVNYXJrZXIuU2VwYXJhdG9yKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodE5vZGUucHJvamVjdGlvbk5leHQgJiYgdE5vZGUucHJvamVjdGlvbk5leHQgIT09IHROb2RlLm5leHQgJiZcbiAgICAgICAgICAgICFpc0luU2tpcEh5ZHJhdGlvbkJsb2NrKHROb2RlLnByb2plY3Rpb25OZXh0KSkge1xuICAgICAgICAgIC8vIENoZWNrIGlmIHByb2plY3Rpb24gbmV4dCBpcyBub3QgdGhlIHNhbWUgYXMgbmV4dCwgaW4gd2hpY2ggY2FzZVxuICAgICAgICAgIC8vIHRoZSBub2RlIHdvdWxkIG5vdCBiZSBmb3VuZCBhdCBjcmVhdGlvbiB0aW1lIGF0IHJ1bnRpbWUgYW5kIHdlXG4gICAgICAgICAgLy8gbmVlZCB0byBwcm92aWRlIGEgbG9jYXRpb24gZm9yIHRoYXQgbm9kZS5cbiAgICAgICAgICBhcHBlbmRTZXJpYWxpemVkTm9kZVBhdGgobmdoLCB0Tm9kZS5wcm9qZWN0aW9uTmV4dCwgbFZpZXcpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBuZ2g7XG59XG5cbi8qKlxuICogUGh5c2ljYWxseSBhZGRzIHRoZSBgbmdoYCBhdHRyaWJ1dGUgYW5kIHNlcmlhbGl6ZWQgZGF0YSB0byB0aGUgaG9zdCBlbGVtZW50LlxuICpcbiAqIEBwYXJhbSBlbGVtZW50IFRoZSBIb3N0IGVsZW1lbnQgdG8gYmUgYW5ub3RhdGVkXG4gKiBAcGFyYW0gbFZpZXcgVGhlIGFzc29jaWF0ZWQgTFZpZXdcbiAqIEBwYXJhbSBjb250ZXh0IFRoZSBoeWRyYXRpb24gY29udGV4dFxuICovXG5mdW5jdGlvbiBhbm5vdGF0ZUhvc3RFbGVtZW50Rm9ySHlkcmF0aW9uKFxuICAgIGVsZW1lbnQ6IFJFbGVtZW50LCBsVmlldzogTFZpZXcsIGNvbnRleHQ6IEh5ZHJhdGlvbkNvbnRleHQpOiB2b2lkIHtcbiAgY29uc3QgbmdoID0gc2VyaWFsaXplTFZpZXcobFZpZXcsIGNvbnRleHQpO1xuICBjb25zdCBpbmRleCA9IGNvbnRleHQuc2VyaWFsaXplZFZpZXdDb2xsZWN0aW9uLmFkZChuZ2gpO1xuICBjb25zdCByZW5kZXJlciA9IGxWaWV3W1JFTkRFUkVSXTtcbiAgcmVuZGVyZXIuc2V0QXR0cmlidXRlKGVsZW1lbnQsIE5HSF9BVFRSX05BTUUsIGluZGV4LnRvU3RyaW5nKCkpO1xufVxuXG4vKipcbiAqIFBoeXNpY2FsbHkgaW5zZXJ0cyB0aGUgY29tbWVudCBub2RlcyB0byBlbnN1cmUgZW1wdHkgdGV4dCBub2RlcyBhbmQgYWRqYWNlbnRcbiAqIHRleHQgbm9kZSBzZXBhcmF0b3JzIGFyZSBwcmVzZXJ2ZWQgYWZ0ZXIgc2VydmVyIHNlcmlhbGl6YXRpb24gb2YgdGhlIERPTS5cbiAqIFRoZXNlIGdldCBzd2FwcGVkIGJhY2sgZm9yIGVtcHR5IHRleHQgbm9kZXMgb3Igc2VwYXJhdG9ycyBvbmNlIGh5ZHJhdGlvbiBoYXBwZW5zXG4gKiBvbiB0aGUgY2xpZW50LlxuICpcbiAqIEBwYXJhbSBjb3JydXB0ZWRUZXh0Tm9kZXMgVGhlIE1hcCBvZiB0ZXh0IG5vZGVzIHRvIGJlIHJlcGxhY2VkIHdpdGggY29tbWVudHNcbiAqIEBwYXJhbSBkb2MgVGhlIGRvY3VtZW50XG4gKi9cbmZ1bmN0aW9uIGluc2VydENvcnJ1cHRlZFRleHROb2RlTWFya2VycyhcbiAgICBjb3JydXB0ZWRUZXh0Tm9kZXM6IE1hcDxIVE1MRWxlbWVudCwgc3RyaW5nPiwgZG9jOiBEb2N1bWVudCkge1xuICBmb3IgKGNvbnN0IFt0ZXh0Tm9kZSwgbWFya2VyXSBvZiBjb3JydXB0ZWRUZXh0Tm9kZXMpIHtcbiAgICB0ZXh0Tm9kZS5hZnRlcihkb2MuY3JlYXRlQ29tbWVudChtYXJrZXIpKTtcbiAgfVxufVxuIl19