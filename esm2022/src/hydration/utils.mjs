/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { getDocument } from '../render3/interfaces/document';
import { isRootView } from '../render3/interfaces/type_checks';
import { HEADER_OFFSET, TVIEW } from '../render3/interfaces/view';
import { makeStateKey, TransferState } from '../transfer_state';
import { assertDefined } from '../util/assert';
import { CONTAINERS, DISCONNECTED_NODES, ELEMENT_CONTAINERS, MULTIPLIER, NUM_ROOT_NODES, } from './interfaces';
/**
 * The name of the key used in the TransferState collection,
 * where hydration information is located.
 */
const TRANSFER_STATE_TOKEN_ID = '__nghData__';
/**
 * Lookup key used to reference DOM hydration data (ngh) in `TransferState`.
 */
export const NGH_DATA_KEY = makeStateKey(TRANSFER_STATE_TOKEN_ID);
/**
 * The name of the attribute that would be added to host component
 * nodes and contain a reference to a particular slot in transferred
 * state that contains the necessary hydration info for this component.
 */
export const NGH_ATTR_NAME = 'ngh';
/**
 * Marker used in a comment node to ensure hydration content integrity
 */
export const SSR_CONTENT_INTEGRITY_MARKER = 'nghm';
/**
 * Reference to a function that reads `ngh` attribute value from a given RNode
 * and retrieves hydration information from the TransferState using that value
 * as an index. Returns `null` by default, when hydration is not enabled.
 *
 * @param rNode Component's host element.
 * @param injector Injector that this component has access to.
 * @param isRootView Specifies whether we trying to read hydration info for the root view.
 */
let _retrieveHydrationInfoImpl = () => null;
export function retrieveHydrationInfoImpl(rNode, injector, isRootView = false) {
    let nghAttrValue = rNode.getAttribute(NGH_ATTR_NAME);
    if (nghAttrValue == null)
        return null;
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
    const [componentViewNgh, rootViewNgh] = nghAttrValue.split('|');
    nghAttrValue = isRootView ? rootViewNgh : componentViewNgh;
    if (!nghAttrValue)
        return null;
    // We've read one of the ngh ids, keep the remaining one, so that
    // we can set it back on the DOM element.
    const rootNgh = rootViewNgh ? `|${rootViewNgh}` : '';
    const remainingNgh = isRootView ? componentViewNgh : rootNgh;
    let data = {};
    // An element might have an empty `ngh` attribute value (e.g. `<comp ngh="" />`),
    // which means that no special annotations are required. Do not attempt to read
    // from the TransferState in this case.
    if (nghAttrValue !== '') {
        const transferState = injector.get(TransferState, null, { optional: true });
        if (transferState !== null) {
            const nghData = transferState.get(NGH_DATA_KEY, []);
            // The nghAttrValue is always a number referencing an index
            // in the hydration TransferState data.
            data = nghData[Number(nghAttrValue)];
            // If the `ngh` attribute exists and has a non-empty value,
            // the hydration info *must* be present in the TransferState.
            // If there is no data for some reasons, this is an error.
            ngDevMode && assertDefined(data, 'Unable to retrieve hydration info from the TransferState.');
        }
    }
    const dehydratedView = {
        data,
        firstChild: rNode.firstChild ?? null,
    };
    if (isRootView) {
        // If there is hydration info present for the root view, it means that there was
        // a ViewContainerRef injected in the root component. The root component host element
        // acted as an anchor node in this scenario. As a result, the DOM nodes that represent
        // embedded views in this ViewContainerRef are located as siblings to the host node,
        // i.e. `<app-root /><#VIEW1><#VIEW2>...<!--container-->`. In this case, the current
        // node becomes the first child of this root view and the next sibling is the first
        // element in the DOM segment.
        dehydratedView.firstChild = rNode;
        // We use `0` here, since this is the slot (right after the HEADER_OFFSET)
        // where a component LView or an LContainer is located in a root LView.
        setSegmentHead(dehydratedView, 0, rNode.nextSibling);
    }
    if (remainingNgh) {
        // If we have only used one of the ngh ids, store the remaining one
        // back on this RNode.
        rNode.setAttribute(NGH_ATTR_NAME, remainingNgh);
    }
    else {
        // The `ngh` attribute is cleared from the DOM node now
        // that the data has been retrieved for all indices.
        rNode.removeAttribute(NGH_ATTR_NAME);
    }
    // Note: don't check whether this node was claimed for hydration,
    // because this node might've been previously claimed while processing
    // template instructions.
    ngDevMode && markRNodeAsClaimedByHydration(rNode, /* checkIfAlreadyClaimed */ false);
    ngDevMode && ngDevMode.hydratedComponents++;
    return dehydratedView;
}
/**
 * Sets the implementation for the `retrieveHydrationInfo` function.
 */
export function enableRetrieveHydrationInfoImpl() {
    _retrieveHydrationInfoImpl = retrieveHydrationInfoImpl;
}
/**
 * Retrieves hydration info by reading the value from the `ngh` attribute
 * and accessing a corresponding slot in TransferState storage.
 */
export function retrieveHydrationInfo(rNode, injector, isRootView = false) {
    return _retrieveHydrationInfoImpl(rNode, injector, isRootView);
}
/**
 * Retrieves the necessary object from a given ViewRef to serialize:
 *  - an LView for component views
 *  - an LContainer for cases when component acts as a ViewContainerRef anchor
 *  - `null` in case of an embedded view
 */
export function getLNodeForHydration(viewRef) {
    // Reading an internal field from `ViewRef` instance.
    let lView = viewRef._lView;
    const tView = lView[TVIEW];
    // A registered ViewRef might represent an instance of an
    // embedded view, in which case we do not need to annotate it.
    if (tView.type === 2 /* TViewType.Embedded */) {
        return null;
    }
    // Check if it's a root view and if so, retrieve component's
    // LView from the first slot after the header.
    if (isRootView(lView)) {
        lView = lView[HEADER_OFFSET];
    }
    return lView;
}
function getTextNodeContent(node) {
    return node.textContent?.replace(/\s/gm, '');
}
/**
 * Restores text nodes and separators into the DOM that were lost during SSR
 * serialization. The hydration process replaces empty text nodes and text
 * nodes that are immediately adjacent to other text nodes with comment nodes
 * that this method filters on to restore those missing nodes that the
 * hydration process is expecting to be present.
 *
 * @param node The app's root HTML Element
 */
export function processTextNodeMarkersBeforeHydration(node) {
    const doc = getDocument();
    const commentNodesIterator = doc.createNodeIterator(node, NodeFilter.SHOW_COMMENT, {
        acceptNode(node) {
            const content = getTextNodeContent(node);
            const isTextNodeMarker = content === "ngetn" /* TextNodeMarker.EmptyNode */ || content === "ngtns" /* TextNodeMarker.Separator */;
            return isTextNodeMarker ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
        },
    });
    let currentNode;
    // We cannot modify the DOM while using the commentIterator,
    // because it throws off the iterator state.
    // So we collect all marker nodes first and then follow up with
    // applying the changes to the DOM: either inserting an empty node
    // or just removing the marker if it was used as a separator.
    const nodes = [];
    while ((currentNode = commentNodesIterator.nextNode())) {
        nodes.push(currentNode);
    }
    for (const node of nodes) {
        if (node.textContent === "ngetn" /* TextNodeMarker.EmptyNode */) {
            node.replaceWith(doc.createTextNode(''));
        }
        else {
            node.remove();
        }
    }
}
/**
 * Internal type that represents a claimed node.
 * Only used in dev mode.
 */
export var HydrationStatus;
(function (HydrationStatus) {
    HydrationStatus["Hydrated"] = "hydrated";
    HydrationStatus["Skipped"] = "skipped";
    HydrationStatus["Mismatched"] = "mismatched";
})(HydrationStatus || (HydrationStatus = {}));
// clang-format on
const HYDRATION_INFO_KEY = '__ngDebugHydrationInfo__';
function patchHydrationInfo(node, info) {
    node[HYDRATION_INFO_KEY] = info;
}
export function readHydrationInfo(node) {
    return node[HYDRATION_INFO_KEY] ?? null;
}
/**
 * Marks a node as "claimed" by hydration process.
 * This is needed to make assessments in tests whether
 * the hydration process handled all nodes.
 */
export function markRNodeAsClaimedByHydration(node, checkIfAlreadyClaimed = true) {
    if (!ngDevMode) {
        throw new Error('Calling `markRNodeAsClaimedByHydration` in prod mode ' +
            'is not supported and likely a mistake.');
    }
    if (checkIfAlreadyClaimed && isRNodeClaimedForHydration(node)) {
        throw new Error('Trying to claim a node, which was claimed already.');
    }
    patchHydrationInfo(node, { status: HydrationStatus.Hydrated });
    ngDevMode.hydratedNodes++;
}
export function markRNodeAsSkippedByHydration(node) {
    if (!ngDevMode) {
        throw new Error('Calling `markRNodeAsSkippedByHydration` in prod mode ' +
            'is not supported and likely a mistake.');
    }
    patchHydrationInfo(node, { status: HydrationStatus.Skipped });
    ngDevMode.componentsSkippedHydration++;
}
export function markRNodeAsHavingHydrationMismatch(node, expectedNodeDetails = null, actualNodeDetails = null) {
    if (!ngDevMode) {
        throw new Error('Calling `markRNodeAsMismatchedByHydration` in prod mode ' +
            'is not supported and likely a mistake.');
    }
    // The RNode can be a standard HTMLElement
    // The devtools component tree only displays Angular components & directives
    // Therefore we attach the debug info to the closest a claimed node.
    while (node && readHydrationInfo(node)?.status !== HydrationStatus.Hydrated) {
        node = node?.parentNode;
    }
    if (node) {
        patchHydrationInfo(node, {
            status: HydrationStatus.Mismatched,
            expectedNodeDetails,
            actualNodeDetails,
        });
    }
}
export function isRNodeClaimedForHydration(node) {
    return readHydrationInfo(node)?.status === HydrationStatus.Hydrated;
}
export function setSegmentHead(hydrationInfo, index, node) {
    hydrationInfo.segmentHeads ??= {};
    hydrationInfo.segmentHeads[index] = node;
}
export function getSegmentHead(hydrationInfo, index) {
    return hydrationInfo.segmentHeads?.[index] ?? null;
}
/**
 * Returns the size of an <ng-container>, using either the information
 * serialized in `ELEMENT_CONTAINERS` (element container size) or by
 * computing the sum of root nodes in all dehydrated views in a given
 * container (in case this `<ng-container>` was also used as a view
 * container host node, e.g. <ng-container *ngIf>).
 */
export function getNgContainerSize(hydrationInfo, index) {
    const data = hydrationInfo.data;
    let size = data[ELEMENT_CONTAINERS]?.[index] ?? null;
    // If there is no serialized information available in the `ELEMENT_CONTAINERS` slot,
    // check if we have info about view containers at this location (e.g.
    // `<ng-container *ngIf>`) and use container size as a number of root nodes in this
    // element container.
    if (size === null && data[CONTAINERS]?.[index]) {
        size = calcSerializedContainerSize(hydrationInfo, index);
    }
    return size;
}
export function getSerializedContainerViews(hydrationInfo, index) {
    return hydrationInfo.data[CONTAINERS]?.[index] ?? null;
}
/**
 * Computes the size of a serialized container (the number of root nodes)
 * by calculating the sum of root nodes in all dehydrated views in this container.
 */
export function calcSerializedContainerSize(hydrationInfo, index) {
    const views = getSerializedContainerViews(hydrationInfo, index) ?? [];
    let numNodes = 0;
    for (let view of views) {
        numNodes += view[NUM_ROOT_NODES] * (view[MULTIPLIER] ?? 1);
    }
    return numNodes;
}
/**
 * Checks whether a node is annotated as "disconnected", i.e. not present
 * in the DOM at serialization time. We should not attempt hydration for
 * such nodes and instead, use a regular "creation mode".
 */
export function isDisconnectedNode(hydrationInfo, index) {
    // Check if we are processing disconnected info for the first time.
    if (typeof hydrationInfo.disconnectedNodes === 'undefined') {
        const nodeIds = hydrationInfo.data[DISCONNECTED_NODES];
        hydrationInfo.disconnectedNodes = nodeIds ? new Set(nodeIds) : null;
    }
    return !!hydrationInfo.disconnectedNodes?.has(index);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9oeWRyYXRpb24vdXRpbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBS0gsT0FBTyxFQUFDLFdBQVcsRUFBQyxNQUFNLGdDQUFnQyxDQUFDO0FBRTNELE9BQU8sRUFBQyxVQUFVLEVBQUMsTUFBTSxtQ0FBbUMsQ0FBQztBQUM3RCxPQUFPLEVBQUMsYUFBYSxFQUFTLEtBQUssRUFBWSxNQUFNLDRCQUE0QixDQUFDO0FBQ2xGLE9BQU8sRUFBQyxZQUFZLEVBQUUsYUFBYSxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDOUQsT0FBTyxFQUFDLGFBQWEsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBRTdDLE9BQU8sRUFBQyxVQUFVLEVBQWtCLGtCQUFrQixFQUFFLGtCQUFrQixFQUFFLFVBQVUsRUFBRSxjQUFjLEdBQTJDLE1BQU0sY0FBYyxDQUFDO0FBRXRLOzs7R0FHRztBQUNILE1BQU0sdUJBQXVCLEdBQUcsYUFBYSxDQUFDO0FBRTlDOztHQUVHO0FBQ0gsTUFBTSxDQUFDLE1BQU0sWUFBWSxHQUFHLFlBQVksQ0FBd0IsdUJBQXVCLENBQUMsQ0FBQztBQUV6Rjs7OztHQUlHO0FBQ0gsTUFBTSxDQUFDLE1BQU0sYUFBYSxHQUFHLEtBQUssQ0FBQztBQUVuQzs7R0FFRztBQUNILE1BQU0sQ0FBQyxNQUFNLDRCQUE0QixHQUFHLE1BQU0sQ0FBQztBQXNCbkQ7Ozs7Ozs7O0dBUUc7QUFDSCxJQUFJLDBCQUEwQixHQUFxQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUM7QUFFOUUsTUFBTSxVQUFVLHlCQUF5QixDQUNyQyxLQUFlLEVBQ2YsUUFBa0IsRUFDbEIsVUFBVSxHQUFHLEtBQUs7SUFFcEIsSUFBSSxZQUFZLEdBQUcsS0FBSyxDQUFDLFlBQVksQ0FBQyxhQUFhLENBQUMsQ0FBQztJQUNyRCxJQUFJ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QUFDLENBQUMsSUFBSSxDQUFDO0lBQ3RFLENBQUM7SUFDRCxPQUFPLENBQUMsQ0FBQyxhQUFhLENBQUMsaUJBQWlCLEVBQUUsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQ3ZELENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtJbmplY3Rvcn0gZnJvbSAnLi4vZGkvaW5qZWN0b3InO1xuaW1wb3J0IHR5cGUge1ZpZXdSZWZ9IGZyb20gJy4uL2xpbmtlci92aWV3X3JlZic7XG5pbXBvcnQge0xDb250YWluZXJ9IGZyb20gJy4uL3JlbmRlcjMvaW50ZXJmYWNlcy9jb250YWluZXInO1xuaW1wb3J0IHtnZXREb2N1bWVudH0gZnJvbSAnLi4vcmVuZGVyMy9pbnRlcmZhY2VzL2RvY3VtZW50JztcbmltcG9ydCB7UkVsZW1lbnQsIFJOb2RlfSBmcm9tICcuLi9yZW5kZXIzL2ludGVyZmFjZXMvcmVuZGVyZXJfZG9tJztcbmltcG9ydCB7aXNSb290Vmlld30gZnJvbSAnLi4vcmVuZGVyMy9pbnRlcmZhY2VzL3R5cGVfY2hlY2tzJztcbmltcG9ydCB7SEVBREVSX09GRlNFVCwgTFZpZXcsIFRWSUVXLCBUVmlld1R5cGV9IGZyb20gJy4uL3JlbmRlcjMvaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7bWFrZVN0YXRlS2V5LCBUcmFuc2ZlclN0YXRlfSBmcm9tICcuLi90cmFuc2Zlcl9zdGF0ZSc7XG5pbXBvcnQge2Fzc2VydERlZmluZWR9IGZyb20gJy4uL3V0aWwvYXNzZXJ0JztcblxuaW1wb3J0IHtDT05UQUlORVJTLCBEZWh5ZHJhdGVkVmlldywgRElTQ09OTkVDVEVEX05PREVTLCBFTEVNRU5UX0NPTlRBSU5FUlMsIE1VTFRJUExJRVIsIE5VTV9ST09UX05PREVTLCBTZXJpYWxpemVkQ29udGFpbmVyVmlldywgU2VyaWFsaXplZFZpZXcsfSBmcm9tICcuL2ludGVyZmFjZXMnO1xuXG4vKipcbiAqIFRoZSBuYW1lIG9mIHRoZSBrZXkgdXNlZCBpbiB0aGUgVHJhbnNmZXJTdGF0ZSBjb2xsZWN0aW9uLFxuICogd2hlcmUgaHlkcmF0aW9uIGluZm9ybWF0aW9uIGlzIGxvY2F0ZWQuXG4gKi9cbmNvbnN0IFRSQU5TRkVSX1NUQVRFX1RPS0VOX0lEID0gJ19fbmdoRGF0YV9fJztcblxuLyoqXG4gKiBMb29rdXAga2V5IHVzZWQgdG8gcmVmZXJlbmNlIERPTSBoeWRyYXRpb24gZGF0YSAobmdoKSBpbiBgVHJhbnNmZXJTdGF0ZWAuXG4gKi9cbmV4cG9ydCBjb25zdCBOR0hfREFUQV9LRVkgPSBtYWtlU3RhdGVLZXk8QXJyYXk8U2VyaWFsaXplZFZpZXc+PihUUkFOU0ZFUl9TVEFURV9UT0tFTl9JRCk7XG5cbi8qKlxuICogVGhlIG5hbWUgb2YgdGhlIGF0dHJpYnV0ZSB0aGF0IHdvdWxkIGJlIGFkZGVkIHRvIGhvc3QgY29tcG9uZW50XG4gKiBub2RlcyBhbmQgY29udGFpbiBhIHJlZmVyZW5jZSB0byBhIHBhcnRpY3VsYXIgc2xvdCBpbiB0cmFuc2ZlcnJlZFxuICogc3RhdGUgdGhhdCBjb250YWlucyB0aGUgbmVjZXNzYXJ5IGh5ZHJhdGlvbiBpbmZvIGZvciB0aGlzIGNvbXBvbmVudC5cbiAqL1xuZXhwb3J0IGNvbnN0IE5HSF9BVFRSX05BTUUgPSAnbmdoJztcblxuLyoqXG4gKiBNYXJrZXIgdXNlZCBpbiBhIGNvbW1lbnQgbm9kZSB0byBlbnN1cmUgaHlkcmF0aW9uIGNvbnRlbnQgaW50ZWdyaXR5XG4gKi9cbmV4cG9ydCBjb25zdCBTU1JfQ09OVEVOVF9JTlRFR1JJVFlfTUFSS0VSID0gJ25naG0nO1xuXG5leHBvcnQgY29uc3QgZW51bSBUZXh0Tm9kZU1hcmtlciB7XG4gIC8qKlxuICAgKiBUaGUgY29udGVudHMgb2YgdGhlIHRleHQgY29tbWVudCBhZGRlZCB0byBub2RlcyB0aGF0IHdvdWxkIG90aGVyd2lzZSBiZVxuICAgKiBlbXB0eSB3aGVuIHNlcmlhbGl6ZWQgYnkgdGhlIHNlcnZlciBhbmQgcGFzc2VkIHRvIHRoZSBjbGllbnQuIFRoZSBlbXB0eVxuICAgKiBub2RlIGlzIGxvc3Qgd2hlbiB0aGUgYnJvd3NlciBwYXJzZXMgaXQgb3RoZXJ3aXNlLiBUaGlzIGNvbW1lbnQgbm9kZSB3aWxsXG4gICAqIGJlIHJlcGxhY2VkIGR1cmluZyBoeWRyYXRpb24gaW4gdGhlIGNsaWVudCB0byByZXN0b3JlIHRoZSBsb3N0IGVtcHR5IHRleHRcbiAgICogbm9kZS5cbiAgICovXG4gIEVtcHR5Tm9kZSA9ICduZ2V0bicsXG5cbiAgLyoqXG4gICAqIFRoZSBjb250ZW50cyBvZiB0aGUgdGV4dCBjb21tZW50IGFkZGVkIGluIHRoZSBjYXNlIG9mIGFkamFjZW50IHRleHQgbm9kZXMuXG4gICAqIFdoZW4gYWRqYWNlbnQgdGV4dCBub2RlcyBhcmUgc2VyaWFsaXplZCBieSB0aGUgc2VydmVyIGFuZCBzZW50IHRvIHRoZVxuICAgKiBjbGllbnQsIHRoZSBicm93c2VyIGxvc2VzIHJlZmVyZW5jZSB0byB0aGUgYW1vdW50IG9mIG5vZGVzIGFuZCBhc3N1bWVzXG4gICAqIGp1c3Qgb25lIHRleHQgbm9kZS4gVGhpcyBzZXBhcmF0b3IgaXMgcmVwbGFjZWQgZHVyaW5nIGh5ZHJhdGlvbiB0byByZXN0b3JlXG4gICAqIHRoZSBwcm9wZXIgc2VwYXJhdGlvbiBhbmQgYW1vdW50IG9mIHRleHQgbm9kZXMgdGhhdCBzaG91bGQgYmUgcHJlc2VudC5cbiAgICovXG4gIFNlcGFyYXRvciA9ICduZ3RucycsXG59XG5cbi8qKlxuICogUmVmZXJlbmNlIHRvIGEgZnVuY3Rpb24gdGhhdCByZWFkcyBgbmdoYCBhdHRyaWJ1dGUgdmFsdWUgZnJvbSBhIGdpdmVuIFJOb2RlXG4gKiBhbmQgcmV0cmlldmVzIGh5ZHJhdGlvbiBpbmZvcm1hdGlvbiBmcm9tIHRoZSBUcmFuc2ZlclN0YXRlIHVzaW5nIHRoYXQgdmFsdWVcbiAqIGFzIGFuIGluZGV4LiBSZXR1cm5zIGBudWxsYCBieSBkZWZhdWx0LCB3aGVuIGh5ZHJhdGlvbiBpcyBub3QgZW5hYmxlZC5cbiAqXG4gKiBAcGFyYW0gck5vZGUgQ29tcG9uZW50J3MgaG9zdCBlbGVtZW50LlxuICogQHBhcmFtIGluamVjdG9yIEluamVjdG9yIHRoYXQgdGhpcyBjb21wb25lbnQgaGFzIGFjY2VzcyB0by5cbiAqIEBwYXJhbSBpc1Jvb3RWaWV3IFNwZWNpZmllcyB3aGV0aGVyIHdlIHRyeWluZyB0byByZWFkIGh5ZHJhdGlvbiBpbmZvIGZvciB0aGUgcm9vdCB2aWV3LlxuICovXG5sZXQgX3JldHJpZXZlSHlkcmF0aW9uSW5mb0ltcGw6IHR5cGVvZiByZXRyaWV2ZUh5ZHJhdGlvbkluZm9JbXBsID0gKCkgPT4gbnVsbDtcblxuZXhwb3J0IGZ1bmN0aW9uIHJldHJpZXZlSHlkcmF0aW9uSW5mb0ltcGwoXG4gICAgck5vZGU6IFJFbGVtZW50LFxuICAgIGluamVjdG9yOiBJbmplY3RvcixcbiAgICBpc1Jvb3RWaWV3ID0gZmFsc2UsXG4gICAgKTogRGVoeWRyYXRlZFZpZXd8bnVsbCB7XG4gIGxldCBuZ2hBdHRyVmFsdWUgPSByTm9kZS5nZXRBdHRyaWJ1dGUoTkdIX0FUVFJfTkFNRSk7XG4gIGlmIChuZ2hBdHRyVmFsdWUgPT0gbnVsbCkgcmV0dXJuIG51bGw7XG5cbiAgLy8gRm9yIGNhc2VzIHdoZW4gYSByb290IGNvbXBvbmVudCBhbHNvIGFjdHMgYXMgYW4gYW5jaG9yIG5vZGUgZm9yIGEgVmlld0NvbnRhaW5lclJlZlxuICAvLyAoZm9yIGV4YW1wbGUsIHdoZW4gVmlld0NvbnRhaW5lclJlZiBpcyBpbmplY3RlZCBpbiBhIHJvb3QgY29tcG9uZW50KSwgdGhlcmUgaXMgYSBuZWVkXG4gIC8vIHRvIHNlcmlhbGl6ZSBpbmZvcm1hdGlvbiBhYm91dCB0aGUgY29tcG9uZW50IGl0c2VsZiwgYXMgd2VsbCBhcyBhbiBMQ29udGFpbmVyIHRoYXRcbiAgLy8gcmVwcmVzZW50cyB0aGlzIFZpZXdDb250YWluZXJSZWYuIEVmZmVjdGl2ZWx5LCB3ZSBuZWVkIHRvIHNlcmlhbGl6ZSAyIHBpZWNlcyBvZiBpbmZvOlxuICAvLyAoMSkgaHlkcmF0aW9uIGluZm8gZm9yIHRoZSByb290IGNvbXBvbmVudCBpdHNlbGYgYW5kICgyKSBoeWRyYXRpb24gaW5mbyBmb3IgdGhlXG4gIC8vIFZpZXdDb250YWluZXJSZWYgaW5zdGFuY2UgKGFuIExDb250YWluZXIpLiBFYWNoIHBpZWNlIG9mIGluZm9ybWF0aW9uIGlzIGluY2x1ZGVkIGludG9cbiAgLy8gdGhlIGh5ZHJhdGlvbiBkYXRhIChpbiB0aGUgVHJhbnNmZXJTdGF0ZSBvYmplY3QpIHNlcGFyYXRlbHksIHRodXMgd2UgZW5kIHVwIHdpdGggMiBpZHMuXG4gIC8vIFNpbmNlIHdlIG9ubHkgaGF2ZSAxIHJvb3QgZWxlbWVudCwgd2UgZW5jb2RlIGJvdGggYml0cyBvZiBpbmZvIGludG8gYSBzaW5nbGUgc3RyaW5nOlxuICAvLyBpZHMgYXJlIHNlcGFyYXRlZCBieSB0aGUgYHxgIGNoYXIgKGUuZy4gYDEwfDI1YCwgd2hlcmUgYDEwYCBpcyB0aGUgbmdoIGZvciBhIGNvbXBvbmVudCB2aWV3XG4gIC8vIGFuZCAyNSBpcyB0aGUgYG5naGAgZm9yIGEgcm9vdCB2aWV3IHdoaWNoIGhvbGRzIExDb250YWluZXIpLlxuICBjb25zdCBbY29tcG9uZW50Vmlld05naCwgcm9vdFZpZXdOZ2hdID0gbmdoQXR0clZhbHVlLnNwbGl0KCd8Jyk7XG4gIG5naEF0dHJWYWx1ZSA9IGlzUm9vdFZpZXcgPyByb290Vmlld05naCA6IGNvbXBvbmVudFZpZXdOZ2g7XG4gIGlmICghbmdoQXR0clZhbHVlKSByZXR1cm4gbnVsbDtcblxuICAvLyBXZSd2ZSByZWFkIG9uZSBvZiB0aGUgbmdoIGlkcywga2VlcCB0aGUgcmVtYWluaW5nIG9uZSwgc28gdGhhdFxuICAvLyB3ZSBjYW4gc2V0IGl0IGJhY2sgb24gdGhlIERPTSBlbGVtZW50LlxuICBjb25zdCByb290TmdoID0gcm9vdFZpZXdOZ2ggPyBgfCR7cm9vdFZpZXdOZ2h9YCA6ICcnO1xuICBjb25zdCByZW1haW5pbmdOZ2ggPSBpc1Jvb3RWaWV3ID8gY29tcG9uZW50Vmlld05naCA6IHJvb3ROZ2g7XG5cbiAgbGV0IGRhdGE6IFNlcmlhbGl6ZWRWaWV3ID0ge307XG4gIC8vIEFuIGVsZW1lbnQgbWlnaHQgaGF2ZSBhbiBlbXB0eSBgbmdoYCBhdHRyaWJ1dGUgdmFsdWUgKGUuZy4gYDxjb21wIG5naD1cIlwiIC8+YCksXG4gIC8vIHdoaWNoIG1lYW5zIHRoYXQgbm8gc3BlY2lhbCBhbm5vdGF0aW9ucyBhcmUgcmVxdWlyZWQuIERvIG5vdCBhdHRlbXB0IHRvIHJlYWRcbiAgLy8gZnJvbSB0aGUgVHJhbnNmZXJTdGF0ZSBpbiB0aGlzIGNhc2UuXG4gIGlmIChuZ2hBdHRyVmFsdWUgIT09ICcnKSB7XG4gICAgY29uc3QgdHJhbnNmZXJTdGF0ZSA9IGluamVjdG9yLmdldChUcmFuc2ZlclN0YXRlLCBudWxsLCB7b3B0aW9uYWw6IHRydWV9KTtcbiAgICBpZiAodHJhbnNmZXJTdGF0ZSAhPT0gbnVsbCkge1xuICAgICAgY29uc3QgbmdoRGF0YSA9IHRyYW5zZmVyU3RhdGUuZ2V0KE5HSF9EQVRBX0tFWSwgW10pO1xuXG4gICAgICAvLyBUaGUgbmdoQXR0clZhbHVlIGlzIGFsd2F5cyBhIG51bWJlciByZWZlcmVuY2luZyBhbiBpbmRleFxuICAgICAgLy8gaW4gdGhlIGh5ZHJhdGlvbiBUcmFuc2ZlclN0YXRlIGRhdGEuXG4gICAgICBkYXRhID0gbmdoRGF0YVtOdW1iZXIobmdoQXR0clZhbHVlKV07XG5cbiAgICAgIC8vIElmIHRoZSBgbmdoYCBhdHRyaWJ1dGUgZXhpc3RzIGFuZCBoYXMgYSBub24tZW1wdHkgdmFsdWUsXG4gICAgICAvLyB0aGUgaHlkcmF0aW9uIGluZm8gKm11c3QqIGJlIHByZXNlbnQgaW4gdGhlIFRyYW5zZmVyU3RhdGUuXG4gICAgICAvLyBJZiB0aGVyZSBpcyBubyBkYXRhIGZvciBzb21lIHJlYXNvbnMsIHRoaXMgaXMgYW4gZXJyb3IuXG4gICAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChkYXRhLCAnVW5hYmxlIHRvIHJldHJpZXZlIGh5ZHJhdGlvbiBpbmZvIGZyb20gdGhlIFRyYW5zZmVyU3RhdGUuJyk7XG4gICAgfVxuICB9XG4gIGNvbnN0IGRlaHlkcmF0ZWRWaWV3OiBEZWh5ZHJhdGVkVmlldyA9IHtcbiAgICBkYXRhLFxuICAgIGZpcnN0Q2hpbGQ6IHJOb2RlLmZpcnN0Q2hpbGQgPz8gbnVsbCxcbiAgfTtcblxuICBpZiAoaXNSb290Vmlldykge1xuICAgIC8vIElmIHRoZXJlIGlzIGh5ZHJhdGlvbiBpbmZvIHByZXNlbnQgZm9yIHRoZSByb290IHZpZXcsIGl0IG1lYW5zIHRoYXQgdGhlcmUgd2FzXG4gICAgLy8gYSBWaWV3Q29udGFpbmVyUmVmIGluamVjdGVkIGluIHRoZSByb290IGNvbXBvbmVudC4gVGhlIHJvb3QgY29tcG9uZW50IGhvc3QgZWxlbWVudFxuICAgIC8vIGFjdGVkIGFzIGFuIGFuY2hvciBub2RlIGluIHRoaXMgc2NlbmFyaW8uIEFzIGEgcmVzdWx0LCB0aGUgRE9NIG5vZGVzIHRoYXQgcmVwcmVzZW50XG4gICAgLy8gZW1iZWRkZWQgdmlld3MgaW4gdGhpcyBWaWV3Q29udGFpbmVyUmVmIGFyZSBsb2NhdGVkIGFzIHNpYmxpbmdzIHRvIHRoZSBob3N0IG5vZGUsXG4gICAgLy8gaS5lLiBgPGFwcC1yb290IC8+PCNWSUVXMT48I1ZJRVcyPi4uLjwhLS1jb250YWluZXItLT5gLiBJbiB0aGlzIGNhc2UsIHRoZSBjdXJyZW50XG4gICAgLy8gbm9kZSBiZWNvbWVzIHRoZSBmaXJzdCBjaGlsZCBvZiB0aGlzIHJvb3QgdmlldyBhbmQgdGhlIG5leHQgc2libGluZyBpcyB0aGUgZmlyc3RcbiAgICAvLyBlbGVtZW50IGluIHRoZSBET00gc2VnbWVudC5cbiAgICBkZWh5ZHJhdGVkVmlldy5maXJzdENoaWxkID0gck5vZGU7XG5cbiAgICAvLyBXZSB1c2UgYDBgIGhlcmUsIHNpbmNlIHRoaXMgaXMgdGhlIHNsb3QgKHJpZ2h0IGFmdGVyIHRoZSBIRUFERVJfT0ZGU0VUKVxuICAgIC8vIHdoZXJlIGEgY29tcG9uZW50IExWaWV3IG9yIGFuIExDb250YWluZXIgaXMgbG9jYXRlZCBpbiBhIHJvb3QgTFZpZXcuXG4gICAgc2V0U2VnbWVudEhlYWQoZGVoeWRyYXRlZFZpZXcsIDAsIHJOb2RlLm5leHRTaWJsaW5nKTtcbiAgfVxuXG4gIGlmIChyZW1haW5pbmdOZ2gpIHtcbiAgICAvLyBJZiB3ZSBoYXZlIG9ubHkgdXNlZCBvbmUgb2YgdGhlIG5naCBpZHMsIHN0b3JlIHRoZSByZW1haW5pbmcgb25lXG4gICAgLy8gYmFjayBvbiB0aGlzIFJOb2RlLlxuICAgIHJOb2RlLnNldEF0dHJpYnV0ZShOR0hfQVRUUl9OQU1FLCByZW1haW5pbmdOZ2gpO1xuICB9IGVsc2Uge1xuICAgIC8vIFRoZSBgbmdoYCBhdHRyaWJ1dGUgaXMgY2xlYXJlZCBmcm9tIHRoZSBET00gbm9kZSBub3dcbiAgICAvLyB0aGF0IHRoZSBkYXRhIGhhcyBiZWVuIHJldHJpZXZlZCBmb3IgYWxsIGluZGljZXMuXG4gICAgck5vZGUucmVtb3ZlQXR0cmlidXRlKE5HSF9BVFRSX05BTUUpO1xuICB9XG5cbiAgLy8gTm90ZTogZG9uJ3QgY2hlY2sgd2hldGhlciB0aGlzIG5vZGUgd2FzIGNsYWltZWQgZm9yIGh5ZHJhdGlvbixcbiAgLy8gYmVjYXVzZSB0aGlzIG5vZGUgbWlnaHQndmUgYmVlbiBwcmV2aW91c2x5IGNsYWltZWQgd2hpbGUgcHJvY2Vzc2luZ1xuICAvLyB0ZW1wbGF0ZSBpbnN0cnVjdGlvbnMuXG4gIG5nRGV2TW9kZSAmJiBtYXJrUk5vZGVBc0NsYWltZWRCeUh5ZHJhdGlvbihyTm9kZSwgLyogY2hlY2tJZkFscmVhZHlDbGFpbWVkICovIGZhbHNlKTtcbiAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5oeWRyYXRlZENvbXBvbmVudHMrKztcblxuICByZXR1cm4gZGVoeWRyYXRlZFZpZXc7XG59XG5cbi8qKlxuICogU2V0cyB0aGUgaW1wbGVtZW50YXRpb24gZm9yIHRoZSBgcmV0cmlldmVIeWRyYXRpb25JbmZvYCBmdW5jdGlvbi5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVuYWJsZVJldHJpZXZlSHlkcmF0aW9uSW5mb0ltcGwoKSB7XG4gIF9yZXRyaWV2ZUh5ZHJhdGlvbkluZm9JbXBsID0gcmV0cmlldmVIeWRyYXRpb25JbmZvSW1wbDtcbn1cblxuLyoqXG4gKiBSZXRyaWV2ZXMgaHlkcmF0aW9uIGluZm8gYnkgcmVhZGluZyB0aGUgdmFsdWUgZnJvbSB0aGUgYG5naGAgYXR0cmlidXRlXG4gKiBhbmQgYWNjZXNzaW5nIGEgY29ycmVzcG9uZGluZyBzbG90IGluIFRyYW5zZmVyU3RhdGUgc3RvcmFnZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJldHJpZXZlSHlkcmF0aW9uSW5mbyhcbiAgICByTm9kZTogUkVsZW1lbnQsXG4gICAgaW5qZWN0b3I6IEluamVjdG9yLFxuICAgIGlzUm9vdFZpZXcgPSBmYWxzZSxcbiAgICApOiBEZWh5ZHJhdGVkVmlld3xudWxsIHtcbiAgcmV0dXJuIF9yZXRyaWV2ZUh5ZHJhdGlvbkluZm9JbXBsKHJOb2RlLCBpbmplY3RvciwgaXNSb290Vmlldyk7XG59XG5cbi8qKlxuICogUmV0cmlldmVzIHRoZSBuZWNlc3Nhcnkgb2JqZWN0IGZyb20gYSBnaXZlbiBWaWV3UmVmIHRvIHNlcmlhbGl6ZTpcbiAqICAtIGFuIExWaWV3IGZvciBjb21wb25lbnQgdmlld3NcbiAqICAtIGFuIExDb250YWluZXIgZm9yIGNhc2VzIHdoZW4gY29tcG9uZW50IGFjdHMgYXMgYSBWaWV3Q29udGFpbmVyUmVmIGFuY2hvclxuICogIC0gYG51bGxgIGluIGNhc2Ugb2YgYW4gZW1iZWRkZWQgdmlld1xuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0TE5vZGVGb3JIeWRyYXRpb24odmlld1JlZjogVmlld1JlZik6IExWaWV3fExDb250YWluZXJ8bnVsbCB7XG4gIC8vIFJlYWRpbmcgYW4gaW50ZXJuYWwgZmllbGQgZnJvbSBgVmlld1JlZmAgaW5zdGFuY2UuXG4gIGxldCBsVmlldyA9ICh2aWV3UmVmIGFzIGFueSkuX2xWaWV3IGFzIExWaWV3O1xuICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgLy8gQSByZWdpc3RlcmVkIFZpZXdSZWYgbWlnaHQgcmVwcmVzZW50IGFuIGluc3RhbmNlIG9mIGFuXG4gIC8vIGVtYmVkZGVkIHZpZXcsIGluIHdoaWNoIGNhc2Ugd2UgZG8gbm90IG5lZWQgdG8gYW5ub3RhdGUgaXQuXG4gIGlmICh0Vmlldy50eXBlID09PSBUVmlld1R5cGUuRW1iZWRkZWQpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuICAvLyBDaGVjayBpZiBpdCdzIGEgcm9vdCB2aWV3IGFuZCBpZiBzbywgcmV0cmlldmUgY29tcG9uZW50J3NcbiAgLy8gTFZpZXcgZnJvbSB0aGUgZmlyc3Qgc2xvdCBhZnRlciB0aGUgaGVhZGVyLlxuICBpZiAoaXNSb290VmlldyhsVmlldykpIHtcbiAgICBsVmlldyA9IGxWaWV3W0hFQURFUl9PRkZTRVRdO1xuICB9XG5cbiAgcmV0dXJuIGxWaWV3O1xufVxuXG5mdW5jdGlvbiBnZXRUZXh0Tm9kZUNvbnRlbnQobm9kZTogTm9kZSk6IHN0cmluZ3x1bmRlZmluZWQge1xuICByZXR1cm4gbm9kZS50ZXh0Q29udGVudD8ucmVwbGFjZSgvXFxzL2dtLCAnJyk7XG59XG5cbi8qKlxuICogUmVzdG9yZXMgdGV4dCBub2RlcyBhbmQgc2VwYXJhdG9ycyBpbnRvIHRoZSBET00gdGhhdCB3ZXJlIGxvc3QgZHVyaW5nIFNTUlxuICogc2VyaWFsaXphdGlvbi4gVGhlIGh5ZHJhdGlvbiBwcm9jZXNzIHJlcGxhY2VzIGVtcHR5IHRleHQgbm9kZXMgYW5kIHRleHRcbiAqIG5vZGVzIHRoYXQgYXJlIGltbWVkaWF0ZWx5IGFkamFjZW50IHRvIG90aGVyIHRleHQgbm9kZXMgd2l0aCBjb21tZW50IG5vZGVzXG4gKiB0aGF0IHRoaXMgbWV0aG9kIGZpbHRlcnMgb24gdG8gcmVzdG9yZSB0aG9zZSBtaXNzaW5nIG5vZGVzIHRoYXQgdGhlXG4gKiBoeWRyYXRpb24gcHJvY2VzcyBpcyBleHBlY3RpbmcgdG8gYmUgcHJlc2VudC5cbiAqXG4gKiBAcGFyYW0gbm9kZSBUaGUgYXBwJ3Mgcm9vdCBIVE1MIEVsZW1lbnRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHByb2Nlc3NUZXh0Tm9kZU1hcmtlcnNCZWZvcmVIeWRyYXRpb24obm9kZTogSFRNTEVsZW1lbnQpIHtcbiAgY29uc3QgZG9jID0gZ2V0RG9jdW1lbnQoKTtcbiAgY29uc3QgY29tbWVudE5vZGVzSXRlcmF0b3IgPSBkb2MuY3JlYXRlTm9kZUl0ZXJhdG9yKG5vZGUsIE5vZGVGaWx0ZXIuU0hPV19DT01NRU5ULCB7XG4gICAgYWNjZXB0Tm9kZShub2RlKSB7XG4gICAgICBjb25zdCBjb250ZW50ID0gZ2V0VGV4dE5vZGVDb250ZW50KG5vZGUpO1xuICAgICAgY29uc3QgaXNUZXh0Tm9kZU1hcmtlciA9XG4gICAgICAgICAgY29udGVudCA9PT0gVGV4dE5vZGVNYXJrZXIuRW1wdHlOb2RlIHx8IGNvbnRlbnQgPT09IFRleHROb2RlTWFya2VyLlNlcGFyYXRvcjtcbiAgICAgIHJldHVybiBpc1RleHROb2RlTWFya2VyID8gTm9kZUZpbHRlci5GSUxURVJfQUNDRVBUIDogTm9kZUZpbHRlci5GSUxURVJfUkVKRUNUO1xuICAgIH0sXG4gIH0pO1xuICBsZXQgY3VycmVudE5vZGU6IENvbW1lbnQ7XG4gIC8vIFdlIGNhbm5vdCBtb2RpZnkgdGhlIERPTSB3aGlsZSB1c2luZyB0aGUgY29tbWVudEl0ZXJhdG9yLFxuICAvLyBiZWNhdXNlIGl0IHRocm93cyBvZmYgdGhlIGl0ZXJhdG9yIHN0YXRlLlxuICAvLyBTbyB3ZSBjb2xsZWN0IGFsbCBtYXJrZXIgbm9kZXMgZmlyc3QgYW5kIHRoZW4gZm9sbG93IHVwIHdpdGhcbiAgLy8gYXBwbHlpbmcgdGhlIGNoYW5nZXMgdG8gdGhlIERPTTogZWl0aGVyIGluc2VydGluZyBhbiBlbXB0eSBub2RlXG4gIC8vIG9yIGp1c3QgcmVtb3ZpbmcgdGhlIG1hcmtlciBpZiBpdCB3YXMgdXNlZCBhcyBhIHNlcGFyYXRvci5cbiAgY29uc3Qgbm9kZXMgPSBbXTtcbiAgd2hpbGUgKChjdXJyZW50Tm9kZSA9IGNvbW1lbnROb2Rlc0l0ZXJhdG9yLm5leHROb2RlKCkgYXMgQ29tbWVudCkpIHtcbiAgICBub2Rlcy5wdXNoKGN1cnJlbnROb2RlKTtcbiAgfVxuICBmb3IgKGNvbnN0IG5vZGUgb2Ygbm9kZXMpIHtcbiAgICBpZiAobm9kZS50ZXh0Q29udGVudCA9PT0gVGV4dE5vZGVNYXJrZXIuRW1wdHlOb2RlKSB7XG4gICAgICBub2RlLnJlcGxhY2VXaXRoKGRvYy5jcmVhdGVUZXh0Tm9kZSgnJykpO1xuICAgIH0gZWxzZSB7XG4gICAgICBub2RlLnJlbW92ZSgpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEludGVybmFsIHR5cGUgdGhhdCByZXByZXNlbnRzIGEgY2xhaW1lZCBub2RlLlxuICogT25seSB1c2VkIGluIGRldiBtb2RlLlxuICovXG5leHBvcnQgZW51bSBIeWRyYXRpb25TdGF0dXMge1xuICBIeWRyYXRlZCA9ICdoeWRyYXRlZCcsXG4gIFNraXBwZWQgPSAnc2tpcHBlZCcsXG4gIE1pc21hdGNoZWQgPSAnbWlzbWF0Y2hlZCcsXG59XG5cbi8vIGNsYW5nLWZvcm1hdCBvZmZcbmV4cG9ydCB0eXBlIEh5ZHJhdGlvbkluZm8gPSB7XG4gIHN0YXR1czogSHlkcmF0aW9uU3RhdHVzLkh5ZHJhdGVkfEh5ZHJhdGlvblN0YXR1cy5Ta2lwcGVkO1xufXx7XG4gIHN0YXR1czogSHlkcmF0aW9uU3RhdHVzLk1pc21hdGNoZWQ7XG4gIGFjdHVhbE5vZGVEZXRhaWxzOiBzdHJpbmd8bnVsbDtcbiAgZXhwZWN0ZWROb2RlRGV0YWlsczogc3RyaW5nfG51bGxcbn07XG4vLyBjbGFuZy1mb3JtYXQgb25cblxuY29uc3QgSFlEUkFUSU9OX0lORk9fS0VZID0gJ19fbmdEZWJ1Z0h5ZHJhdGlvbkluZm9fXyc7XG5cbmV4cG9ydCB0eXBlIEh5ZHJhdGVkTm9kZSA9IHtcbiAgW0hZRFJBVElPTl9JTkZPX0tFWV0/OiBIeWRyYXRpb25JbmZvO1xufTtcblxuZnVuY3Rpb24gcGF0Y2hIeWRyYXRpb25JbmZvKG5vZGU6IFJOb2RlLCBpbmZvOiBIeWRyYXRpb25JbmZvKSB7XG4gIChub2RlIGFzIEh5ZHJhdGVkTm9kZSlbSFlEUkFUSU9OX0lORk9fS0VZXSA9IGluZm87XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZWFkSHlkcmF0aW9uSW5mbyhub2RlOiBSTm9kZSk6IEh5ZHJhdGlvbkluZm98bnVsbCB7XG4gIHJldHVybiAobm9kZSBhcyBIeWRyYXRlZE5vZGUpW0hZRFJBVElPTl9JTkZPX0tFWV0gPz8gbnVsbDtcbn1cblxuLyoqXG4gKiBNYXJrcyBhIG5vZGUgYXMgXCJjbGFpbWVkXCIgYnkgaHlkcmF0aW9uIHByb2Nlc3MuXG4gKiBUaGlzIGlzIG5lZWRlZCB0byBtYWtlIGFzc2Vzc21lbnRzIGluIHRlc3RzIHdoZXRoZXJcbiAqIHRoZSBoeWRyYXRpb24gcHJvY2VzcyBoYW5kbGVkIGFsbCBub2Rlcy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG1hcmtSTm9kZUFzQ2xhaW1lZEJ5SHlkcmF0aW9uKG5vZGU6IFJOb2RlLCBjaGVja0lmQWxyZWFkeUNsYWltZWQgPSB0cnVlKSB7XG4gIGlmICghbmdEZXZNb2RlKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAnQ2FsbGluZyBgbWFya1JOb2RlQXNDbGFpbWVkQnlIeWRyYXRpb25gIGluIHByb2QgbW9kZSAnICtcbiAgICAgICAgICAgICdpcyBub3Qgc3VwcG9ydGVkIGFuZCBsaWtlbHkgYSBtaXN0YWtlLicsXG4gICAgKTtcbiAgfVxuICBpZiAoY2hlY2tJZkFscmVhZHlDbGFpbWVkICYmIGlzUk5vZGVDbGFpbWVkRm9ySHlkcmF0aW9uKG5vZGUpKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdUcnlpbmcgdG8gY2xhaW0gYSBub2RlLCB3aGljaCB3YXMgY2xhaW1lZCBhbHJlYWR5LicpO1xuICB9XG4gIHBhdGNoSHlkcmF0aW9uSW5mbyhub2RlLCB7c3RhdHVzOiBIeWRyYXRpb25TdGF0dXMuSHlkcmF0ZWR9KTtcbiAgbmdEZXZNb2RlLmh5ZHJhdGVkTm9kZXMrKztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG1hcmtSTm9kZUFzU2tpcHBlZEJ5SHlkcmF0aW9uKG5vZGU6IFJOb2RlKSB7XG4gIGlmICghbmdEZXZNb2RlKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAnQ2FsbGluZyBgbWFya1JOb2RlQXNTa2lwcGVkQnlIeWRyYXRpb25gIGluIHByb2QgbW9kZSAnICtcbiAgICAgICAgICAgICdpcyBub3Qgc3VwcG9ydGVkIGFuZCBsaWtlbHkgYSBtaXN0YWtlLicsXG4gICAgKTtcbiAgfVxuICBwYXRjaEh5ZHJhdGlvbkluZm8obm9kZSwge3N0YXR1czogSHlkcmF0aW9uU3RhdHVzLlNraXBwZWR9KTtcbiAgbmdEZXZNb2RlLmNvbXBvbmVudHNTa2lwcGVkSHlkcmF0aW9uKys7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBtYXJrUk5vZGVBc0hhdmluZ0h5ZHJhdGlvbk1pc21hdGNoKFxuICAgIG5vZGU6IFJOb2RlLFxuICAgIGV4cGVjdGVkTm9kZURldGFpbHM6IHN0cmluZ3xudWxsID0gbnVsbCxcbiAgICBhY3R1YWxOb2RlRGV0YWlsczogc3RyaW5nfG51bGwgPSBudWxsLFxuKSB7XG4gIGlmICghbmdEZXZNb2RlKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAnQ2FsbGluZyBgbWFya1JOb2RlQXNNaXNtYXRjaGVkQnlIeWRyYXRpb25gIGluIHByb2QgbW9kZSAnICtcbiAgICAgICAgICAgICdpcyBub3Qgc3VwcG9ydGVkIGFuZCBsaWtlbHkgYSBtaXN0YWtlLicsXG4gICAgKTtcbiAgfVxuXG4gIC8vIFRoZSBSTm9kZSBjYW4gYmUgYSBzdGFuZGFyZCBIVE1MRWxlbWVudFxuICAvLyBUaGUgZGV2dG9vbHMgY29tcG9uZW50IHRyZWUgb25seSBkaXNwbGF5cyBBbmd1bGFyIGNvbXBvbmVudHMgJiBkaXJlY3RpdmVzXG4gIC8vIFRoZXJlZm9yZSB3ZSBhdHRhY2ggdGhlIGRlYnVnIGluZm8gdG8gdGhlIGNsb3Nlc3QgYSBjbGFpbWVkIG5vZGUuXG4gIHdoaWxlIChub2RlICYmIHJlYWRIeWRyYXRpb25JbmZvKG5vZGUpPy5zdGF0dXMgIT09IEh5ZHJhdGlvblN0YXR1cy5IeWRyYXRlZCkge1xuICAgIG5vZGUgPSBub2RlPy5wYXJlbnROb2RlIGFzIFJOb2RlO1xuICB9XG5cbiAgaWYgKG5vZGUpIHtcbiAgICBwYXRjaEh5ZHJhdGlvbkluZm8obm9kZSwge1xuICAgICAgc3RhdHVzOiBIeWRyYXRpb25TdGF0dXMuTWlzbWF0Y2hlZCxcbiAgICAgIGV4cGVjdGVkTm9kZURldGFpbHMsXG4gICAgICBhY3R1YWxOb2RlRGV0YWlscyxcbiAgICB9KTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNSTm9kZUNsYWltZWRGb3JIeWRyYXRpb24obm9kZTogUk5vZGUpOiBib29sZWFuIHtcbiAgcmV0dXJuIHJlYWRIeWRyYXRpb25JbmZvKG5vZGUpPy5zdGF0dXMgPT09IEh5ZHJhdGlvblN0YXR1cy5IeWRyYXRlZDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNldFNlZ21lbnRIZWFkKFxuICAgIGh5ZHJhdGlvbkluZm86IERlaHlkcmF0ZWRWaWV3LFxuICAgIGluZGV4OiBudW1iZXIsXG4gICAgbm9kZTogUk5vZGV8bnVsbCxcbiAgICApOiB2b2lkIHtcbiAgaHlkcmF0aW9uSW5mby5zZWdtZW50SGVhZHMgPz89IHt9O1xuICBoeWRyYXRpb25JbmZvLnNlZ21lbnRIZWFkc1tpbmRleF0gPSBub2RlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0U2VnbWVudEhlYWQoaHlkcmF0aW9uSW5mbzogRGVoeWRyYXRlZFZpZXcsIGluZGV4OiBudW1iZXIpOiBSTm9kZXxudWxsIHtcbiAgcmV0dXJuIGh5ZHJhdGlvbkluZm8uc2VnbWVudEhlYWRzPy5baW5kZXhdID8/IG51bGw7XG59XG5cbi8qKlxuICogUmV0dXJucyB0aGUgc2l6ZSBvZiBhbiA8bmctY29udGFpbmVyPiwgdXNpbmcgZWl0aGVyIHRoZSBpbmZvcm1hdGlvblxuICogc2VyaWFsaXplZCBpbiBgRUxFTUVOVF9DT05UQUlORVJTYCAoZWxlbWVudCBjb250YWluZXIgc2l6ZSkgb3IgYnlcbiAqIGNvbXB1dGluZyB0aGUgc3VtIG9mIHJvb3Qgbm9kZXMgaW4gYWxsIGRlaHlkcmF0ZWQgdmlld3MgaW4gYSBnaXZlblxuICogY29udGFpbmVyIChpbiBjYXNlIHRoaXMgYDxuZy1jb250YWluZXI+YCB3YXMgYWxzbyB1c2VkIGFzIGEgdmlld1xuICogY29udGFpbmVyIGhvc3Qgbm9kZSwgZS5nLiA8bmctY29udGFpbmVyICpuZ0lmPikuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXROZ0NvbnRhaW5lclNpemUoaHlkcmF0aW9uSW5mbzogRGVoeWRyYXRlZFZpZXcsIGluZGV4OiBudW1iZXIpOiBudW1iZXJ8bnVsbCB7XG4gIGNvbnN0IGRhdGEgPSBoeWRyYXRpb25JbmZvLmRhdGE7XG4gIGxldCBzaXplID0gZGF0YVtFTEVNRU5UX0NPTlRBSU5FUlNdPy5baW5kZXhdID8/IG51bGw7XG4gIC8vIElmIHRoZXJlIGlzIG5vIHNlcmlhbGl6ZWQgaW5mb3JtYXRpb24gYXZhaWxhYmxlIGluIHRoZSBgRUxFTUVOVF9DT05UQUlORVJTYCBzbG90LFxuICAvLyBjaGVjayBpZiB3ZSBoYXZlIGluZm8gYWJvdXQgdmlldyBjb250YWluZXJzIGF0IHRoaXMgbG9jYXRpb24gKGUuZy5cbiAgLy8gYDxuZy1jb250YWluZXIgKm5nSWY+YCkgYW5kIHVzZSBjb250YWluZXIgc2l6ZSBhcyBhIG51bWJlciBvZiByb290IG5vZGVzIGluIHRoaXNcbiAgLy8gZWxlbWVudCBjb250YWluZXIuXG4gIGlmIChzaXplID09PSBudWxsICYmIGRhdGFbQ09OVEFJTkVSU10/LltpbmRleF0pIHtcbiAgICBzaXplID0gY2FsY1NlcmlhbGl6ZWRDb250YWluZXJTaXplKGh5ZHJhdGlvbkluZm8sIGluZGV4KTtcbiAgfVxuICByZXR1cm4gc2l6ZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFNlcmlhbGl6ZWRDb250YWluZXJWaWV3cyhcbiAgICBoeWRyYXRpb25JbmZvOiBEZWh5ZHJhdGVkVmlldyxcbiAgICBpbmRleDogbnVtYmVyLFxuICAgICk6IFNlcmlhbGl6ZWRDb250YWluZXJWaWV3W118bnVsbCB7XG4gIHJldHVybiBoeWRyYXRpb25JbmZvLmRhdGFbQ09OVEFJTkVSU10/LltpbmRleF0gPz8gbnVsbDtcbn1cblxuLyoqXG4gKiBDb21wdXRlcyB0aGUgc2l6ZSBvZiBhIHNlcmlhbGl6ZWQgY29udGFpbmVyICh0aGUgbnVtYmVyIG9mIHJvb3Qgbm9kZXMpXG4gKiBieSBjYWxjdWxhdGluZyB0aGUgc3VtIG9mIHJvb3Qgbm9kZXMgaW4gYWxsIGRlaHlkcmF0ZWQgdmlld3MgaW4gdGhpcyBjb250YWluZXIuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjYWxjU2VyaWFsaXplZENvbnRhaW5lclNpemUoaHlkcmF0aW9uSW5mbzogRGVoeWRyYXRlZFZpZXcsIGluZGV4OiBudW1iZXIpOiBudW1iZXIge1xuICBjb25zdCB2aWV3cyA9IGdldFNlcmlhbGl6ZWRDb250YWluZXJWaWV3cyhoeWRyYXRpb25JbmZvLCBpbmRleCkgPz8gW107XG4gIGxldCBudW1Ob2RlcyA9IDA7XG4gIGZvciAobGV0IHZpZXcgb2Ygdmlld3MpIHtcbiAgICBudW1Ob2RlcyArPSB2aWV3W05VTV9ST09UX05PREVTXSAqICh2aWV3W01VTFRJUExJRVJdID8/IDEpO1xuICB9XG4gIHJldHVybiBudW1Ob2Rlcztcbn1cblxuLyoqXG4gKiBDaGVja3Mgd2hldGhlciBhIG5vZGUgaXMgYW5ub3RhdGVkIGFzIFwiZGlzY29ubmVjdGVkXCIsIGkuZS4gbm90IHByZXNlbnRcbiAqIGluIHRoZSBET00gYXQgc2VyaWFsaXphdGlvbiB0aW1lLiBXZSBzaG91bGQgbm90IGF0dGVtcHQgaHlkcmF0aW9uIGZvclxuICogc3VjaCBub2RlcyBhbmQgaW5zdGVhZCwgdXNlIGEgcmVndWxhciBcImNyZWF0aW9uIG1vZGVcIi5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzRGlzY29ubmVjdGVkTm9kZShoeWRyYXRpb25JbmZvOiBEZWh5ZHJhdGVkVmlldywgaW5kZXg6IG51bWJlcik6IGJvb2xlYW4ge1xuICAvLyBDaGVjayBpZiB3ZSBhcmUgcHJvY2Vzc2luZyBkaXNjb25uZWN0ZWQgaW5mbyBmb3IgdGhlIGZpcnN0IHRpbWUuXG4gIGlmICh0eXBlb2YgaHlkcmF0aW9uSW5mby5kaXNjb25uZWN0ZWROb2RlcyA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBjb25zdCBub2RlSWRzID0gaHlkcmF0aW9uSW5mby5kYXRhW0RJU0NPTk5FQ1RFRF9OT0RFU107XG4gICAgaHlkcmF0aW9uSW5mby5kaXNjb25uZWN0ZWROb2RlcyA9IG5vZGVJZHMgPyBuZXcgU2V0KG5vZGVJZHMpIDogbnVsbDtcbiAgfVxuICByZXR1cm4gISFoeWRyYXRpb25JbmZvLmRpc2Nvbm5lY3RlZE5vZGVzPy5oYXMoaW5kZXgpO1xufVxuIl19