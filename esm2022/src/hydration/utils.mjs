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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9oeWRyYXRpb24vdXRpbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBS0gsT0FBTyxFQUFDLFdBQVcsRUFBQyxNQUFNLGdDQUFnQyxDQUFDO0FBRTNELE9BQU8sRUFBQyxVQUFVLEVBQUMsTUFBTSxtQ0FBbUMsQ0FBQztBQUM3RCxPQUFPLEVBQUMsYUFBYSxFQUFTLEtBQUssRUFBWSxNQUFNLDRCQUE0QixDQUFDO0FBQ2xGLE9BQU8sRUFBQyxZQUFZLEVBQUUsYUFBYSxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDOUQsT0FBTyxFQUFDLGFBQWEsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBRTdDLE9BQU8sRUFBQyxVQUFVLEVBQWtCLGtCQUFrQixFQUFFLGtCQUFrQixFQUFFLFVBQVUsRUFBRSxjQUFjLEdBQTJDLE1BQU0sY0FBYyxDQUFDO0FBRXRLOzs7R0FHRztBQUNILE1BQU0sdUJBQXVCLEdBQUcsYUFBYSxDQUFDO0FBRTlDOztHQUVHO0FBQ0gsTUFBTSxDQUFDLE1BQU0sWUFBWSxHQUFHLFlBQVksQ0FBd0IsdUJBQXVCLENBQUMsQ0FBQztBQUV6Rjs7OztHQUlHO0FBQ0gsTUFBTSxDQUFDLE1BQU0sYUFBYSxHQUFHLEtBQUssQ0FBQztBQUVuQzs7R0FFRztBQUNILE1BQU0sQ0FBQyxNQUFNLDRCQUE0QixHQUFHLE1BQU0sQ0FBQztBQXNCbkQ7Ozs7Ozs7O0dBUUc7QUFDSCxJQUFJLDBCQUEwQixHQUFxQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUM7QUFFOUUsTUFBTSxVQUFVLHlCQUF5QixDQUNyQyxLQUFlLEVBQ2YsUUFBa0IsRUFDbEIsVUFBVSxHQUFHLEtBQUs7SUFFcEIsSUFBSSxZQUFZLEdBQUcsS0FBSyxDQUFDLFlBQVksQ0FBQyxhQUFhLENBQUMsQ0FBQztJQUNyRCxJQUFJ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QUFDLENBQUMsSUFBSSxDQUFDO0lBQ3RFLENBQUM7SUFDRCxPQUFPLENBQUMsQ0FBQyxhQUFhLENBQUMsaUJBQWlCLEVBQUUsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQ3ZELENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtJbmplY3Rvcn0gZnJvbSAnLi4vZGkvaW5qZWN0b3InO1xuaW1wb3J0IHtWaWV3UmVmfSBmcm9tICcuLi9saW5rZXIvdmlld19yZWYnO1xuaW1wb3J0IHtMQ29udGFpbmVyfSBmcm9tICcuLi9yZW5kZXIzL2ludGVyZmFjZXMvY29udGFpbmVyJztcbmltcG9ydCB7Z2V0RG9jdW1lbnR9IGZyb20gJy4uL3JlbmRlcjMvaW50ZXJmYWNlcy9kb2N1bWVudCc7XG5pbXBvcnQge1JFbGVtZW50LCBSTm9kZX0gZnJvbSAnLi4vcmVuZGVyMy9pbnRlcmZhY2VzL3JlbmRlcmVyX2RvbSc7XG5pbXBvcnQge2lzUm9vdFZpZXd9IGZyb20gJy4uL3JlbmRlcjMvaW50ZXJmYWNlcy90eXBlX2NoZWNrcyc7XG5pbXBvcnQge0hFQURFUl9PRkZTRVQsIExWaWV3LCBUVklFVywgVFZpZXdUeXBlfSBmcm9tICcuLi9yZW5kZXIzL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge21ha2VTdGF0ZUtleSwgVHJhbnNmZXJTdGF0ZX0gZnJvbSAnLi4vdHJhbnNmZXJfc3RhdGUnO1xuaW1wb3J0IHthc3NlcnREZWZpbmVkfSBmcm9tICcuLi91dGlsL2Fzc2VydCc7XG5cbmltcG9ydCB7Q09OVEFJTkVSUywgRGVoeWRyYXRlZFZpZXcsIERJU0NPTk5FQ1RFRF9OT0RFUywgRUxFTUVOVF9DT05UQUlORVJTLCBNVUxUSVBMSUVSLCBOVU1fUk9PVF9OT0RFUywgU2VyaWFsaXplZENvbnRhaW5lclZpZXcsIFNlcmlhbGl6ZWRWaWV3LH0gZnJvbSAnLi9pbnRlcmZhY2VzJztcblxuLyoqXG4gKiBUaGUgbmFtZSBvZiB0aGUga2V5IHVzZWQgaW4gdGhlIFRyYW5zZmVyU3RhdGUgY29sbGVjdGlvbixcbiAqIHdoZXJlIGh5ZHJhdGlvbiBpbmZvcm1hdGlvbiBpcyBsb2NhdGVkLlxuICovXG5jb25zdCBUUkFOU0ZFUl9TVEFURV9UT0tFTl9JRCA9ICdfX25naERhdGFfXyc7XG5cbi8qKlxuICogTG9va3VwIGtleSB1c2VkIHRvIHJlZmVyZW5jZSBET00gaHlkcmF0aW9uIGRhdGEgKG5naCkgaW4gYFRyYW5zZmVyU3RhdGVgLlxuICovXG5leHBvcnQgY29uc3QgTkdIX0RBVEFfS0VZID0gbWFrZVN0YXRlS2V5PEFycmF5PFNlcmlhbGl6ZWRWaWV3Pj4oVFJBTlNGRVJfU1RBVEVfVE9LRU5fSUQpO1xuXG4vKipcbiAqIFRoZSBuYW1lIG9mIHRoZSBhdHRyaWJ1dGUgdGhhdCB3b3VsZCBiZSBhZGRlZCB0byBob3N0IGNvbXBvbmVudFxuICogbm9kZXMgYW5kIGNvbnRhaW4gYSByZWZlcmVuY2UgdG8gYSBwYXJ0aWN1bGFyIHNsb3QgaW4gdHJhbnNmZXJyZWRcbiAqIHN0YXRlIHRoYXQgY29udGFpbnMgdGhlIG5lY2Vzc2FyeSBoeWRyYXRpb24gaW5mbyBmb3IgdGhpcyBjb21wb25lbnQuXG4gKi9cbmV4cG9ydCBjb25zdCBOR0hfQVRUUl9OQU1FID0gJ25naCc7XG5cbi8qKlxuICogTWFya2VyIHVzZWQgaW4gYSBjb21tZW50IG5vZGUgdG8gZW5zdXJlIGh5ZHJhdGlvbiBjb250ZW50IGludGVncml0eVxuICovXG5leHBvcnQgY29uc3QgU1NSX0NPTlRFTlRfSU5URUdSSVRZX01BUktFUiA9ICduZ2htJztcblxuZXhwb3J0IGNvbnN0IGVudW0gVGV4dE5vZGVNYXJrZXIge1xuICAvKipcbiAgICogVGhlIGNvbnRlbnRzIG9mIHRoZSB0ZXh0IGNvbW1lbnQgYWRkZWQgdG8gbm9kZXMgdGhhdCB3b3VsZCBvdGhlcndpc2UgYmVcbiAgICogZW1wdHkgd2hlbiBzZXJpYWxpemVkIGJ5IHRoZSBzZXJ2ZXIgYW5kIHBhc3NlZCB0byB0aGUgY2xpZW50LiBUaGUgZW1wdHlcbiAgICogbm9kZSBpcyBsb3N0IHdoZW4gdGhlIGJyb3dzZXIgcGFyc2VzIGl0IG90aGVyd2lzZS4gVGhpcyBjb21tZW50IG5vZGUgd2lsbFxuICAgKiBiZSByZXBsYWNlZCBkdXJpbmcgaHlkcmF0aW9uIGluIHRoZSBjbGllbnQgdG8gcmVzdG9yZSB0aGUgbG9zdCBlbXB0eSB0ZXh0XG4gICAqIG5vZGUuXG4gICAqL1xuICBFbXB0eU5vZGUgPSAnbmdldG4nLFxuXG4gIC8qKlxuICAgKiBUaGUgY29udGVudHMgb2YgdGhlIHRleHQgY29tbWVudCBhZGRlZCBpbiB0aGUgY2FzZSBvZiBhZGphY2VudCB0ZXh0IG5vZGVzLlxuICAgKiBXaGVuIGFkamFjZW50IHRleHQgbm9kZXMgYXJlIHNlcmlhbGl6ZWQgYnkgdGhlIHNlcnZlciBhbmQgc2VudCB0byB0aGVcbiAgICogY2xpZW50LCB0aGUgYnJvd3NlciBsb3NlcyByZWZlcmVuY2UgdG8gdGhlIGFtb3VudCBvZiBub2RlcyBhbmQgYXNzdW1lc1xuICAgKiBqdXN0IG9uZSB0ZXh0IG5vZGUuIFRoaXMgc2VwYXJhdG9yIGlzIHJlcGxhY2VkIGR1cmluZyBoeWRyYXRpb24gdG8gcmVzdG9yZVxuICAgKiB0aGUgcHJvcGVyIHNlcGFyYXRpb24gYW5kIGFtb3VudCBvZiB0ZXh0IG5vZGVzIHRoYXQgc2hvdWxkIGJlIHByZXNlbnQuXG4gICAqL1xuICBTZXBhcmF0b3IgPSAnbmd0bnMnLFxufVxuXG4vKipcbiAqIFJlZmVyZW5jZSB0byBhIGZ1bmN0aW9uIHRoYXQgcmVhZHMgYG5naGAgYXR0cmlidXRlIHZhbHVlIGZyb20gYSBnaXZlbiBSTm9kZVxuICogYW5kIHJldHJpZXZlcyBoeWRyYXRpb24gaW5mb3JtYXRpb24gZnJvbSB0aGUgVHJhbnNmZXJTdGF0ZSB1c2luZyB0aGF0IHZhbHVlXG4gKiBhcyBhbiBpbmRleC4gUmV0dXJucyBgbnVsbGAgYnkgZGVmYXVsdCwgd2hlbiBoeWRyYXRpb24gaXMgbm90IGVuYWJsZWQuXG4gKlxuICogQHBhcmFtIHJOb2RlIENvbXBvbmVudCdzIGhvc3QgZWxlbWVudC5cbiAqIEBwYXJhbSBpbmplY3RvciBJbmplY3RvciB0aGF0IHRoaXMgY29tcG9uZW50IGhhcyBhY2Nlc3MgdG8uXG4gKiBAcGFyYW0gaXNSb290VmlldyBTcGVjaWZpZXMgd2hldGhlciB3ZSB0cnlpbmcgdG8gcmVhZCBoeWRyYXRpb24gaW5mbyBmb3IgdGhlIHJvb3Qgdmlldy5cbiAqL1xubGV0IF9yZXRyaWV2ZUh5ZHJhdGlvbkluZm9JbXBsOiB0eXBlb2YgcmV0cmlldmVIeWRyYXRpb25JbmZvSW1wbCA9ICgpID0+IG51bGw7XG5cbmV4cG9ydCBmdW5jdGlvbiByZXRyaWV2ZUh5ZHJhdGlvbkluZm9JbXBsKFxuICAgIHJOb2RlOiBSRWxlbWVudCxcbiAgICBpbmplY3RvcjogSW5qZWN0b3IsXG4gICAgaXNSb290VmlldyA9IGZhbHNlLFxuICAgICk6IERlaHlkcmF0ZWRWaWV3fG51bGwge1xuICBsZXQgbmdoQXR0clZhbHVlID0gck5vZGUuZ2V0QXR0cmlidXRlKE5HSF9BVFRSX05BTUUpO1xuICBpZiAobmdoQXR0clZhbHVlID09IG51bGwpIHJldHVybiBudWxsO1xuXG4gIC8vIEZvciBjYXNlcyB3aGVuIGEgcm9vdCBjb21wb25lbnQgYWxzbyBhY3RzIGFzIGFuIGFuY2hvciBub2RlIGZvciBhIFZpZXdDb250YWluZXJSZWZcbiAgLy8gKGZvciBleGFtcGxlLCB3aGVuIFZpZXdDb250YWluZXJSZWYgaXMgaW5qZWN0ZWQgaW4gYSByb290IGNvbXBvbmVudCksIHRoZXJlIGlzIGEgbmVlZFxuICAvLyB0byBzZXJpYWxpemUgaW5mb3JtYXRpb24gYWJvdXQgdGhlIGNvbXBvbmVudCBpdHNlbGYsIGFzIHdlbGwgYXMgYW4gTENvbnRhaW5lciB0aGF0XG4gIC8vIHJlcHJlc2VudHMgdGhpcyBWaWV3Q29udGFpbmVyUmVmLiBFZmZlY3RpdmVseSwgd2UgbmVlZCB0byBzZXJpYWxpemUgMiBwaWVjZXMgb2YgaW5mbzpcbiAgLy8gKDEpIGh5ZHJhdGlvbiBpbmZvIGZvciB0aGUgcm9vdCBjb21wb25lbnQgaXRzZWxmIGFuZCAoMikgaHlkcmF0aW9uIGluZm8gZm9yIHRoZVxuICAvLyBWaWV3Q29udGFpbmVyUmVmIGluc3RhbmNlIChhbiBMQ29udGFpbmVyKS4gRWFjaCBwaWVjZSBvZiBpbmZvcm1hdGlvbiBpcyBpbmNsdWRlZCBpbnRvXG4gIC8vIHRoZSBoeWRyYXRpb24gZGF0YSAoaW4gdGhlIFRyYW5zZmVyU3RhdGUgb2JqZWN0KSBzZXBhcmF0ZWx5LCB0aHVzIHdlIGVuZCB1cCB3aXRoIDIgaWRzLlxuICAvLyBTaW5jZSB3ZSBvbmx5IGhhdmUgMSByb290IGVsZW1lbnQsIHdlIGVuY29kZSBib3RoIGJpdHMgb2YgaW5mbyBpbnRvIGEgc2luZ2xlIHN0cmluZzpcbiAgLy8gaWRzIGFyZSBzZXBhcmF0ZWQgYnkgdGhlIGB8YCBjaGFyIChlLmcuIGAxMHwyNWAsIHdoZXJlIGAxMGAgaXMgdGhlIG5naCBmb3IgYSBjb21wb25lbnQgdmlld1xuICAvLyBhbmQgMjUgaXMgdGhlIGBuZ2hgIGZvciBhIHJvb3QgdmlldyB3aGljaCBob2xkcyBMQ29udGFpbmVyKS5cbiAgY29uc3QgW2NvbXBvbmVudFZpZXdOZ2gsIHJvb3RWaWV3TmdoXSA9IG5naEF0dHJWYWx1ZS5zcGxpdCgnfCcpO1xuICBuZ2hBdHRyVmFsdWUgPSBpc1Jvb3RWaWV3ID8gcm9vdFZpZXdOZ2ggOiBjb21wb25lbnRWaWV3TmdoO1xuICBpZiAoIW5naEF0dHJWYWx1ZSkgcmV0dXJuIG51bGw7XG5cbiAgLy8gV2UndmUgcmVhZCBvbmUgb2YgdGhlIG5naCBpZHMsIGtlZXAgdGhlIHJlbWFpbmluZyBvbmUsIHNvIHRoYXRcbiAgLy8gd2UgY2FuIHNldCBpdCBiYWNrIG9uIHRoZSBET00gZWxlbWVudC5cbiAgY29uc3Qgcm9vdE5naCA9IHJvb3RWaWV3TmdoID8gYHwke3Jvb3RWaWV3TmdofWAgOiAnJztcbiAgY29uc3QgcmVtYWluaW5nTmdoID0gaXNSb290VmlldyA/IGNvbXBvbmVudFZpZXdOZ2ggOiByb290TmdoO1xuXG4gIGxldCBkYXRhOiBTZXJpYWxpemVkVmlldyA9IHt9O1xuICAvLyBBbiBlbGVtZW50IG1pZ2h0IGhhdmUgYW4gZW1wdHkgYG5naGAgYXR0cmlidXRlIHZhbHVlIChlLmcuIGA8Y29tcCBuZ2g9XCJcIiAvPmApLFxuICAvLyB3aGljaCBtZWFucyB0aGF0IG5vIHNwZWNpYWwgYW5ub3RhdGlvbnMgYXJlIHJlcXVpcmVkLiBEbyBub3QgYXR0ZW1wdCB0byByZWFkXG4gIC8vIGZyb20gdGhlIFRyYW5zZmVyU3RhdGUgaW4gdGhpcyBjYXNlLlxuICBpZiAobmdoQXR0clZhbHVlICE9PSAnJykge1xuICAgIGNvbnN0IHRyYW5zZmVyU3RhdGUgPSBpbmplY3Rvci5nZXQoVHJhbnNmZXJTdGF0ZSwgbnVsbCwge29wdGlvbmFsOiB0cnVlfSk7XG4gICAgaWYgKHRyYW5zZmVyU3RhdGUgIT09IG51bGwpIHtcbiAgICAgIGNvbnN0IG5naERhdGEgPSB0cmFuc2ZlclN0YXRlLmdldChOR0hfREFUQV9LRVksIFtdKTtcblxuICAgICAgLy8gVGhlIG5naEF0dHJWYWx1ZSBpcyBhbHdheXMgYSBudW1iZXIgcmVmZXJlbmNpbmcgYW4gaW5kZXhcbiAgICAgIC8vIGluIHRoZSBoeWRyYXRpb24gVHJhbnNmZXJTdGF0ZSBkYXRhLlxuICAgICAgZGF0YSA9IG5naERhdGFbTnVtYmVyKG5naEF0dHJWYWx1ZSldO1xuXG4gICAgICAvLyBJZiB0aGUgYG5naGAgYXR0cmlidXRlIGV4aXN0cyBhbmQgaGFzIGEgbm9uLWVtcHR5IHZhbHVlLFxuICAgICAgLy8gdGhlIGh5ZHJhdGlvbiBpbmZvICptdXN0KiBiZSBwcmVzZW50IGluIHRoZSBUcmFuc2ZlclN0YXRlLlxuICAgICAgLy8gSWYgdGhlcmUgaXMgbm8gZGF0YSBmb3Igc29tZSByZWFzb25zLCB0aGlzIGlzIGFuIGVycm9yLlxuICAgICAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQoZGF0YSwgJ1VuYWJsZSB0byByZXRyaWV2ZSBoeWRyYXRpb24gaW5mbyBmcm9tIHRoZSBUcmFuc2ZlclN0YXRlLicpO1xuICAgIH1cbiAgfVxuICBjb25zdCBkZWh5ZHJhdGVkVmlldzogRGVoeWRyYXRlZFZpZXcgPSB7XG4gICAgZGF0YSxcbiAgICBmaXJzdENoaWxkOiByTm9kZS5maXJzdENoaWxkID8/IG51bGwsXG4gIH07XG5cbiAgaWYgKGlzUm9vdFZpZXcpIHtcbiAgICAvLyBJZiB0aGVyZSBpcyBoeWRyYXRpb24gaW5mbyBwcmVzZW50IGZvciB0aGUgcm9vdCB2aWV3LCBpdCBtZWFucyB0aGF0IHRoZXJlIHdhc1xuICAgIC8vIGEgVmlld0NvbnRhaW5lclJlZiBpbmplY3RlZCBpbiB0aGUgcm9vdCBjb21wb25lbnQuIFRoZSByb290IGNvbXBvbmVudCBob3N0IGVsZW1lbnRcbiAgICAvLyBhY3RlZCBhcyBhbiBhbmNob3Igbm9kZSBpbiB0aGlzIHNjZW5hcmlvLiBBcyBhIHJlc3VsdCwgdGhlIERPTSBub2RlcyB0aGF0IHJlcHJlc2VudFxuICAgIC8vIGVtYmVkZGVkIHZpZXdzIGluIHRoaXMgVmlld0NvbnRhaW5lclJlZiBhcmUgbG9jYXRlZCBhcyBzaWJsaW5ncyB0byB0aGUgaG9zdCBub2RlLFxuICAgIC8vIGkuZS4gYDxhcHAtcm9vdCAvPjwjVklFVzE+PCNWSUVXMj4uLi48IS0tY29udGFpbmVyLS0+YC4gSW4gdGhpcyBjYXNlLCB0aGUgY3VycmVudFxuICAgIC8vIG5vZGUgYmVjb21lcyB0aGUgZmlyc3QgY2hpbGQgb2YgdGhpcyByb290IHZpZXcgYW5kIHRoZSBuZXh0IHNpYmxpbmcgaXMgdGhlIGZpcnN0XG4gICAgLy8gZWxlbWVudCBpbiB0aGUgRE9NIHNlZ21lbnQuXG4gICAgZGVoeWRyYXRlZFZpZXcuZmlyc3RDaGlsZCA9IHJOb2RlO1xuXG4gICAgLy8gV2UgdXNlIGAwYCBoZXJlLCBzaW5jZSB0aGlzIGlzIHRoZSBzbG90IChyaWdodCBhZnRlciB0aGUgSEVBREVSX09GRlNFVClcbiAgICAvLyB3aGVyZSBhIGNvbXBvbmVudCBMVmlldyBvciBhbiBMQ29udGFpbmVyIGlzIGxvY2F0ZWQgaW4gYSByb290IExWaWV3LlxuICAgIHNldFNlZ21lbnRIZWFkKGRlaHlkcmF0ZWRWaWV3LCAwLCByTm9kZS5uZXh0U2libGluZyk7XG4gIH1cblxuICBpZiAocmVtYWluaW5nTmdoKSB7XG4gICAgLy8gSWYgd2UgaGF2ZSBvbmx5IHVzZWQgb25lIG9mIHRoZSBuZ2ggaWRzLCBzdG9yZSB0aGUgcmVtYWluaW5nIG9uZVxuICAgIC8vIGJhY2sgb24gdGhpcyBSTm9kZS5cbiAgICByTm9kZS5zZXRBdHRyaWJ1dGUoTkdIX0FUVFJfTkFNRSwgcmVtYWluaW5nTmdoKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBUaGUgYG5naGAgYXR0cmlidXRlIGlzIGNsZWFyZWQgZnJvbSB0aGUgRE9NIG5vZGUgbm93XG4gICAgLy8gdGhhdCB0aGUgZGF0YSBoYXMgYmVlbiByZXRyaWV2ZWQgZm9yIGFsbCBpbmRpY2VzLlxuICAgIHJOb2RlLnJlbW92ZUF0dHJpYnV0ZShOR0hfQVRUUl9OQU1FKTtcbiAgfVxuXG4gIC8vIE5vdGU6IGRvbid0IGNoZWNrIHdoZXRoZXIgdGhpcyBub2RlIHdhcyBjbGFpbWVkIGZvciBoeWRyYXRpb24sXG4gIC8vIGJlY2F1c2UgdGhpcyBub2RlIG1pZ2h0J3ZlIGJlZW4gcHJldmlvdXNseSBjbGFpbWVkIHdoaWxlIHByb2Nlc3NpbmdcbiAgLy8gdGVtcGxhdGUgaW5zdHJ1Y3Rpb25zLlxuICBuZ0Rldk1vZGUgJiYgbWFya1JOb2RlQXNDbGFpbWVkQnlIeWRyYXRpb24ock5vZGUsIC8qIGNoZWNrSWZBbHJlYWR5Q2xhaW1lZCAqLyBmYWxzZSk7XG4gIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUuaHlkcmF0ZWRDb21wb25lbnRzKys7XG5cbiAgcmV0dXJuIGRlaHlkcmF0ZWRWaWV3O1xufVxuXG4vKipcbiAqIFNldHMgdGhlIGltcGxlbWVudGF0aW9uIGZvciB0aGUgYHJldHJpZXZlSHlkcmF0aW9uSW5mb2AgZnVuY3Rpb24uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbmFibGVSZXRyaWV2ZUh5ZHJhdGlvbkluZm9JbXBsKCkge1xuICBfcmV0cmlldmVIeWRyYXRpb25JbmZvSW1wbCA9IHJldHJpZXZlSHlkcmF0aW9uSW5mb0ltcGw7XG59XG5cbi8qKlxuICogUmV0cmlldmVzIGh5ZHJhdGlvbiBpbmZvIGJ5IHJlYWRpbmcgdGhlIHZhbHVlIGZyb20gdGhlIGBuZ2hgIGF0dHJpYnV0ZVxuICogYW5kIGFjY2Vzc2luZyBhIGNvcnJlc3BvbmRpbmcgc2xvdCBpbiBUcmFuc2ZlclN0YXRlIHN0b3JhZ2UuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZXRyaWV2ZUh5ZHJhdGlvbkluZm8oXG4gICAgck5vZGU6IFJFbGVtZW50LFxuICAgIGluamVjdG9yOiBJbmplY3RvcixcbiAgICBpc1Jvb3RWaWV3ID0gZmFsc2UsXG4gICAgKTogRGVoeWRyYXRlZFZpZXd8bnVsbCB7XG4gIHJldHVybiBfcmV0cmlldmVIeWRyYXRpb25JbmZvSW1wbChyTm9kZSwgaW5qZWN0b3IsIGlzUm9vdFZpZXcpO1xufVxuXG4vKipcbiAqIFJldHJpZXZlcyB0aGUgbmVjZXNzYXJ5IG9iamVjdCBmcm9tIGEgZ2l2ZW4gVmlld1JlZiB0byBzZXJpYWxpemU6XG4gKiAgLSBhbiBMVmlldyBmb3IgY29tcG9uZW50IHZpZXdzXG4gKiAgLSBhbiBMQ29udGFpbmVyIGZvciBjYXNlcyB3aGVuIGNvbXBvbmVudCBhY3RzIGFzIGEgVmlld0NvbnRhaW5lclJlZiBhbmNob3JcbiAqICAtIGBudWxsYCBpbiBjYXNlIG9mIGFuIGVtYmVkZGVkIHZpZXdcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldExOb2RlRm9ySHlkcmF0aW9uKHZpZXdSZWY6IFZpZXdSZWYpOiBMVmlld3xMQ29udGFpbmVyfG51bGwge1xuICAvLyBSZWFkaW5nIGFuIGludGVybmFsIGZpZWxkIGZyb20gYFZpZXdSZWZgIGluc3RhbmNlLlxuICBsZXQgbFZpZXcgPSAodmlld1JlZiBhcyBhbnkpLl9sVmlldyBhcyBMVmlldztcbiAgY29uc3QgdFZpZXcgPSBsVmlld1tUVklFV107XG4gIC8vIEEgcmVnaXN0ZXJlZCBWaWV3UmVmIG1pZ2h0IHJlcHJlc2VudCBhbiBpbnN0YW5jZSBvZiBhblxuICAvLyBlbWJlZGRlZCB2aWV3LCBpbiB3aGljaCBjYXNlIHdlIGRvIG5vdCBuZWVkIHRvIGFubm90YXRlIGl0LlxuICBpZiAodFZpZXcudHlwZSA9PT0gVFZpZXdUeXBlLkVtYmVkZGVkKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbiAgLy8gQ2hlY2sgaWYgaXQncyBhIHJvb3QgdmlldyBhbmQgaWYgc28sIHJldHJpZXZlIGNvbXBvbmVudCdzXG4gIC8vIExWaWV3IGZyb20gdGhlIGZpcnN0IHNsb3QgYWZ0ZXIgdGhlIGhlYWRlci5cbiAgaWYgKGlzUm9vdFZpZXcobFZpZXcpKSB7XG4gICAgbFZpZXcgPSBsVmlld1tIRUFERVJfT0ZGU0VUXTtcbiAgfVxuXG4gIHJldHVybiBsVmlldztcbn1cblxuZnVuY3Rpb24gZ2V0VGV4dE5vZGVDb250ZW50KG5vZGU6IE5vZGUpOiBzdHJpbmd8dW5kZWZpbmVkIHtcbiAgcmV0dXJuIG5vZGUudGV4dENvbnRlbnQ/LnJlcGxhY2UoL1xccy9nbSwgJycpO1xufVxuXG4vKipcbiAqIFJlc3RvcmVzIHRleHQgbm9kZXMgYW5kIHNlcGFyYXRvcnMgaW50byB0aGUgRE9NIHRoYXQgd2VyZSBsb3N0IGR1cmluZyBTU1JcbiAqIHNlcmlhbGl6YXRpb24uIFRoZSBoeWRyYXRpb24gcHJvY2VzcyByZXBsYWNlcyBlbXB0eSB0ZXh0IG5vZGVzIGFuZCB0ZXh0XG4gKiBub2RlcyB0aGF0IGFyZSBpbW1lZGlhdGVseSBhZGphY2VudCB0byBvdGhlciB0ZXh0IG5vZGVzIHdpdGggY29tbWVudCBub2Rlc1xuICogdGhhdCB0aGlzIG1ldGhvZCBmaWx0ZXJzIG9uIHRvIHJlc3RvcmUgdGhvc2UgbWlzc2luZyBub2RlcyB0aGF0IHRoZVxuICogaHlkcmF0aW9uIHByb2Nlc3MgaXMgZXhwZWN0aW5nIHRvIGJlIHByZXNlbnQuXG4gKlxuICogQHBhcmFtIG5vZGUgVGhlIGFwcCdzIHJvb3QgSFRNTCBFbGVtZW50XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwcm9jZXNzVGV4dE5vZGVNYXJrZXJzQmVmb3JlSHlkcmF0aW9uKG5vZGU6IEhUTUxFbGVtZW50KSB7XG4gIGNvbnN0IGRvYyA9IGdldERvY3VtZW50KCk7XG4gIGNvbnN0IGNvbW1lbnROb2Rlc0l0ZXJhdG9yID0gZG9jLmNyZWF0ZU5vZGVJdGVyYXRvcihub2RlLCBOb2RlRmlsdGVyLlNIT1dfQ09NTUVOVCwge1xuICAgIGFjY2VwdE5vZGUobm9kZSkge1xuICAgICAgY29uc3QgY29udGVudCA9IGdldFRleHROb2RlQ29udGVudChub2RlKTtcbiAgICAgIGNvbnN0IGlzVGV4dE5vZGVNYXJrZXIgPVxuICAgICAgICAgIGNvbnRlbnQgPT09IFRleHROb2RlTWFya2VyLkVtcHR5Tm9kZSB8fCBjb250ZW50ID09PSBUZXh0Tm9kZU1hcmtlci5TZXBhcmF0b3I7XG4gICAgICByZXR1cm4gaXNUZXh0Tm9kZU1hcmtlciA/IE5vZGVGaWx0ZXIuRklMVEVSX0FDQ0VQVCA6IE5vZGVGaWx0ZXIuRklMVEVSX1JFSkVDVDtcbiAgICB9LFxuICB9KTtcbiAgbGV0IGN1cnJlbnROb2RlOiBDb21tZW50O1xuICAvLyBXZSBjYW5ub3QgbW9kaWZ5IHRoZSBET00gd2hpbGUgdXNpbmcgdGhlIGNvbW1lbnRJdGVyYXRvcixcbiAgLy8gYmVjYXVzZSBpdCB0aHJvd3Mgb2ZmIHRoZSBpdGVyYXRvciBzdGF0ZS5cbiAgLy8gU28gd2UgY29sbGVjdCBhbGwgbWFya2VyIG5vZGVzIGZpcnN0IGFuZCB0aGVuIGZvbGxvdyB1cCB3aXRoXG4gIC8vIGFwcGx5aW5nIHRoZSBjaGFuZ2VzIHRvIHRoZSBET006IGVpdGhlciBpbnNlcnRpbmcgYW4gZW1wdHkgbm9kZVxuICAvLyBvciBqdXN0IHJlbW92aW5nIHRoZSBtYXJrZXIgaWYgaXQgd2FzIHVzZWQgYXMgYSBzZXBhcmF0b3IuXG4gIGNvbnN0IG5vZGVzID0gW107XG4gIHdoaWxlICgoY3VycmVudE5vZGUgPSBjb21tZW50Tm9kZXNJdGVyYXRvci5uZXh0Tm9kZSgpIGFzIENvbW1lbnQpKSB7XG4gICAgbm9kZXMucHVzaChjdXJyZW50Tm9kZSk7XG4gIH1cbiAgZm9yIChjb25zdCBub2RlIG9mIG5vZGVzKSB7XG4gICAgaWYgKG5vZGUudGV4dENvbnRlbnQgPT09IFRleHROb2RlTWFya2VyLkVtcHR5Tm9kZSkge1xuICAgICAgbm9kZS5yZXBsYWNlV2l0aChkb2MuY3JlYXRlVGV4dE5vZGUoJycpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbm9kZS5yZW1vdmUoKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBJbnRlcm5hbCB0eXBlIHRoYXQgcmVwcmVzZW50cyBhIGNsYWltZWQgbm9kZS5cbiAqIE9ubHkgdXNlZCBpbiBkZXYgbW9kZS5cbiAqL1xuZXhwb3J0IGVudW0gSHlkcmF0aW9uU3RhdHVzIHtcbiAgSHlkcmF0ZWQgPSAnaHlkcmF0ZWQnLFxuICBTa2lwcGVkID0gJ3NraXBwZWQnLFxuICBNaXNtYXRjaGVkID0gJ21pc21hdGNoZWQnLFxufVxuXG4vLyBjbGFuZy1mb3JtYXQgb2ZmXG5leHBvcnQgdHlwZSBIeWRyYXRpb25JbmZvID0ge1xuICBzdGF0dXM6IEh5ZHJhdGlvblN0YXR1cy5IeWRyYXRlZHxIeWRyYXRpb25TdGF0dXMuU2tpcHBlZDtcbn18e1xuICBzdGF0dXM6IEh5ZHJhdGlvblN0YXR1cy5NaXNtYXRjaGVkO1xuICBhY3R1YWxOb2RlRGV0YWlsczogc3RyaW5nfG51bGw7XG4gIGV4cGVjdGVkTm9kZURldGFpbHM6IHN0cmluZ3xudWxsXG59O1xuLy8gY2xhbmctZm9ybWF0IG9uXG5cbmNvbnN0IEhZRFJBVElPTl9JTkZPX0tFWSA9ICdfX25nRGVidWdIeWRyYXRpb25JbmZvX18nO1xuXG5leHBvcnQgdHlwZSBIeWRyYXRlZE5vZGUgPSB7XG4gIFtIWURSQVRJT05fSU5GT19LRVldPzogSHlkcmF0aW9uSW5mbztcbn07XG5cbmZ1bmN0aW9uIHBhdGNoSHlkcmF0aW9uSW5mbyhub2RlOiBSTm9kZSwgaW5mbzogSHlkcmF0aW9uSW5mbykge1xuICAobm9kZSBhcyBIeWRyYXRlZE5vZGUpW0hZRFJBVElPTl9JTkZPX0tFWV0gPSBpbmZvO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVhZEh5ZHJhdGlvbkluZm8obm9kZTogUk5vZGUpOiBIeWRyYXRpb25JbmZvfG51bGwge1xuICByZXR1cm4gKG5vZGUgYXMgSHlkcmF0ZWROb2RlKVtIWURSQVRJT05fSU5GT19LRVldID8/IG51bGw7XG59XG5cbi8qKlxuICogTWFya3MgYSBub2RlIGFzIFwiY2xhaW1lZFwiIGJ5IGh5ZHJhdGlvbiBwcm9jZXNzLlxuICogVGhpcyBpcyBuZWVkZWQgdG8gbWFrZSBhc3Nlc3NtZW50cyBpbiB0ZXN0cyB3aGV0aGVyXG4gKiB0aGUgaHlkcmF0aW9uIHByb2Nlc3MgaGFuZGxlZCBhbGwgbm9kZXMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBtYXJrUk5vZGVBc0NsYWltZWRCeUh5ZHJhdGlvbihub2RlOiBSTm9kZSwgY2hlY2tJZkFscmVhZHlDbGFpbWVkID0gdHJ1ZSkge1xuICBpZiAoIW5nRGV2TW9kZSkge1xuICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgJ0NhbGxpbmcgYG1hcmtSTm9kZUFzQ2xhaW1lZEJ5SHlkcmF0aW9uYCBpbiBwcm9kIG1vZGUgJyArXG4gICAgICAgICAgICAnaXMgbm90IHN1cHBvcnRlZCBhbmQgbGlrZWx5IGEgbWlzdGFrZS4nLFxuICAgICk7XG4gIH1cbiAgaWYgKGNoZWNrSWZBbHJlYWR5Q2xhaW1lZCAmJiBpc1JOb2RlQ2xhaW1lZEZvckh5ZHJhdGlvbihub2RlKSkge1xuICAgIHRocm93IG5ldyBFcnJvcignVHJ5aW5nIHRvIGNsYWltIGEgbm9kZSwgd2hpY2ggd2FzIGNsYWltZWQgYWxyZWFkeS4nKTtcbiAgfVxuICBwYXRjaEh5ZHJhdGlvbkluZm8obm9kZSwge3N0YXR1czogSHlkcmF0aW9uU3RhdHVzLkh5ZHJhdGVkfSk7XG4gIG5nRGV2TW9kZS5oeWRyYXRlZE5vZGVzKys7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBtYXJrUk5vZGVBc1NraXBwZWRCeUh5ZHJhdGlvbihub2RlOiBSTm9kZSkge1xuICBpZiAoIW5nRGV2TW9kZSkge1xuICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgJ0NhbGxpbmcgYG1hcmtSTm9kZUFzU2tpcHBlZEJ5SHlkcmF0aW9uYCBpbiBwcm9kIG1vZGUgJyArXG4gICAgICAgICAgICAnaXMgbm90IHN1cHBvcnRlZCBhbmQgbGlrZWx5IGEgbWlzdGFrZS4nLFxuICAgICk7XG4gIH1cbiAgcGF0Y2hIeWRyYXRpb25JbmZvKG5vZGUsIHtzdGF0dXM6IEh5ZHJhdGlvblN0YXR1cy5Ta2lwcGVkfSk7XG4gIG5nRGV2TW9kZS5jb21wb25lbnRzU2tpcHBlZEh5ZHJhdGlvbisrO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbWFya1JOb2RlQXNIYXZpbmdIeWRyYXRpb25NaXNtYXRjaChcbiAgICBub2RlOiBSTm9kZSxcbiAgICBleHBlY3RlZE5vZGVEZXRhaWxzOiBzdHJpbmd8bnVsbCA9IG51bGwsXG4gICAgYWN0dWFsTm9kZURldGFpbHM6IHN0cmluZ3xudWxsID0gbnVsbCxcbikge1xuICBpZiAoIW5nRGV2TW9kZSkge1xuICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgJ0NhbGxpbmcgYG1hcmtSTm9kZUFzTWlzbWF0Y2hlZEJ5SHlkcmF0aW9uYCBpbiBwcm9kIG1vZGUgJyArXG4gICAgICAgICAgICAnaXMgbm90IHN1cHBvcnRlZCBhbmQgbGlrZWx5IGEgbWlzdGFrZS4nLFxuICAgICk7XG4gIH1cblxuICAvLyBUaGUgUk5vZGUgY2FuIGJlIGEgc3RhbmRhcmQgSFRNTEVsZW1lbnRcbiAgLy8gVGhlIGRldnRvb2xzIGNvbXBvbmVudCB0cmVlIG9ubHkgZGlzcGxheXMgQW5ndWxhciBjb21wb25lbnRzICYgZGlyZWN0aXZlc1xuICAvLyBUaGVyZWZvcmUgd2UgYXR0YWNoIHRoZSBkZWJ1ZyBpbmZvIHRvIHRoZSBjbG9zZXN0IGEgY2xhaW1lZCBub2RlLlxuICB3aGlsZSAobm9kZSAmJiByZWFkSHlkcmF0aW9uSW5mbyhub2RlKT8uc3RhdHVzICE9PSBIeWRyYXRpb25TdGF0dXMuSHlkcmF0ZWQpIHtcbiAgICBub2RlID0gbm9kZT8ucGFyZW50Tm9kZSBhcyBSTm9kZTtcbiAgfVxuXG4gIGlmIChub2RlKSB7XG4gICAgcGF0Y2hIeWRyYXRpb25JbmZvKG5vZGUsIHtcbiAgICAgIHN0YXR1czogSHlkcmF0aW9uU3RhdHVzLk1pc21hdGNoZWQsXG4gICAgICBleHBlY3RlZE5vZGVEZXRhaWxzLFxuICAgICAgYWN0dWFsTm9kZURldGFpbHMsXG4gICAgfSk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzUk5vZGVDbGFpbWVkRm9ySHlkcmF0aW9uKG5vZGU6IFJOb2RlKTogYm9vbGVhbiB7XG4gIHJldHVybiByZWFkSHlkcmF0aW9uSW5mbyhub2RlKT8uc3RhdHVzID09PSBIeWRyYXRpb25TdGF0dXMuSHlkcmF0ZWQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRTZWdtZW50SGVhZChcbiAgICBoeWRyYXRpb25JbmZvOiBEZWh5ZHJhdGVkVmlldyxcbiAgICBpbmRleDogbnVtYmVyLFxuICAgIG5vZGU6IFJOb2RlfG51bGwsXG4gICAgKTogdm9pZCB7XG4gIGh5ZHJhdGlvbkluZm8uc2VnbWVudEhlYWRzID8/PSB7fTtcbiAgaHlkcmF0aW9uSW5mby5zZWdtZW50SGVhZHNbaW5kZXhdID0gbm9kZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFNlZ21lbnRIZWFkKGh5ZHJhdGlvbkluZm86IERlaHlkcmF0ZWRWaWV3LCBpbmRleDogbnVtYmVyKTogUk5vZGV8bnVsbCB7XG4gIHJldHVybiBoeWRyYXRpb25JbmZvLnNlZ21lbnRIZWFkcz8uW2luZGV4XSA/PyBudWxsO1xufVxuXG4vKipcbiAqIFJldHVybnMgdGhlIHNpemUgb2YgYW4gPG5nLWNvbnRhaW5lcj4sIHVzaW5nIGVpdGhlciB0aGUgaW5mb3JtYXRpb25cbiAqIHNlcmlhbGl6ZWQgaW4gYEVMRU1FTlRfQ09OVEFJTkVSU2AgKGVsZW1lbnQgY29udGFpbmVyIHNpemUpIG9yIGJ5XG4gKiBjb21wdXRpbmcgdGhlIHN1bSBvZiByb290IG5vZGVzIGluIGFsbCBkZWh5ZHJhdGVkIHZpZXdzIGluIGEgZ2l2ZW5cbiAqIGNvbnRhaW5lciAoaW4gY2FzZSB0aGlzIGA8bmctY29udGFpbmVyPmAgd2FzIGFsc28gdXNlZCBhcyBhIHZpZXdcbiAqIGNvbnRhaW5lciBob3N0IG5vZGUsIGUuZy4gPG5nLWNvbnRhaW5lciAqbmdJZj4pLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0TmdDb250YWluZXJTaXplKGh5ZHJhdGlvbkluZm86IERlaHlkcmF0ZWRWaWV3LCBpbmRleDogbnVtYmVyKTogbnVtYmVyfG51bGwge1xuICBjb25zdCBkYXRhID0gaHlkcmF0aW9uSW5mby5kYXRhO1xuICBsZXQgc2l6ZSA9IGRhdGFbRUxFTUVOVF9DT05UQUlORVJTXT8uW2luZGV4XSA/PyBudWxsO1xuICAvLyBJZiB0aGVyZSBpcyBubyBzZXJpYWxpemVkIGluZm9ybWF0aW9uIGF2YWlsYWJsZSBpbiB0aGUgYEVMRU1FTlRfQ09OVEFJTkVSU2Agc2xvdCxcbiAgLy8gY2hlY2sgaWYgd2UgaGF2ZSBpbmZvIGFib3V0IHZpZXcgY29udGFpbmVycyBhdCB0aGlzIGxvY2F0aW9uIChlLmcuXG4gIC8vIGA8bmctY29udGFpbmVyICpuZ0lmPmApIGFuZCB1c2UgY29udGFpbmVyIHNpemUgYXMgYSBudW1iZXIgb2Ygcm9vdCBub2RlcyBpbiB0aGlzXG4gIC8vIGVsZW1lbnQgY29udGFpbmVyLlxuICBpZiAoc2l6ZSA9PT0gbnVsbCAmJiBkYXRhW0NPTlRBSU5FUlNdPy5baW5kZXhdKSB7XG4gICAgc2l6ZSA9IGNhbGNTZXJpYWxpemVkQ29udGFpbmVyU2l6ZShoeWRyYXRpb25JbmZvLCBpbmRleCk7XG4gIH1cbiAgcmV0dXJuIHNpemU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRTZXJpYWxpemVkQ29udGFpbmVyVmlld3MoXG4gICAgaHlkcmF0aW9uSW5mbzogRGVoeWRyYXRlZFZpZXcsXG4gICAgaW5kZXg6IG51bWJlcixcbiAgICApOiBTZXJpYWxpemVkQ29udGFpbmVyVmlld1tdfG51bGwge1xuICByZXR1cm4gaHlkcmF0aW9uSW5mby5kYXRhW0NPTlRBSU5FUlNdPy5baW5kZXhdID8/IG51bGw7XG59XG5cbi8qKlxuICogQ29tcHV0ZXMgdGhlIHNpemUgb2YgYSBzZXJpYWxpemVkIGNvbnRhaW5lciAodGhlIG51bWJlciBvZiByb290IG5vZGVzKVxuICogYnkgY2FsY3VsYXRpbmcgdGhlIHN1bSBvZiByb290IG5vZGVzIGluIGFsbCBkZWh5ZHJhdGVkIHZpZXdzIGluIHRoaXMgY29udGFpbmVyLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY2FsY1NlcmlhbGl6ZWRDb250YWluZXJTaXplKGh5ZHJhdGlvbkluZm86IERlaHlkcmF0ZWRWaWV3LCBpbmRleDogbnVtYmVyKTogbnVtYmVyIHtcbiAgY29uc3Qgdmlld3MgPSBnZXRTZXJpYWxpemVkQ29udGFpbmVyVmlld3MoaHlkcmF0aW9uSW5mbywgaW5kZXgpID8/IFtdO1xuICBsZXQgbnVtTm9kZXMgPSAwO1xuICBmb3IgKGxldCB2aWV3IG9mIHZpZXdzKSB7XG4gICAgbnVtTm9kZXMgKz0gdmlld1tOVU1fUk9PVF9OT0RFU10gKiAodmlld1tNVUxUSVBMSUVSXSA/PyAxKTtcbiAgfVxuICByZXR1cm4gbnVtTm9kZXM7XG59XG5cbi8qKlxuICogQ2hlY2tzIHdoZXRoZXIgYSBub2RlIGlzIGFubm90YXRlZCBhcyBcImRpc2Nvbm5lY3RlZFwiLCBpLmUuIG5vdCBwcmVzZW50XG4gKiBpbiB0aGUgRE9NIGF0IHNlcmlhbGl6YXRpb24gdGltZS4gV2Ugc2hvdWxkIG5vdCBhdHRlbXB0IGh5ZHJhdGlvbiBmb3JcbiAqIHN1Y2ggbm9kZXMgYW5kIGluc3RlYWQsIHVzZSBhIHJlZ3VsYXIgXCJjcmVhdGlvbiBtb2RlXCIuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc0Rpc2Nvbm5lY3RlZE5vZGUoaHlkcmF0aW9uSW5mbzogRGVoeWRyYXRlZFZpZXcsIGluZGV4OiBudW1iZXIpOiBib29sZWFuIHtcbiAgLy8gQ2hlY2sgaWYgd2UgYXJlIHByb2Nlc3NpbmcgZGlzY29ubmVjdGVkIGluZm8gZm9yIHRoZSBmaXJzdCB0aW1lLlxuICBpZiAodHlwZW9mIGh5ZHJhdGlvbkluZm8uZGlzY29ubmVjdGVkTm9kZXMgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgY29uc3Qgbm9kZUlkcyA9IGh5ZHJhdGlvbkluZm8uZGF0YVtESVNDT05ORUNURURfTk9ERVNdO1xuICAgIGh5ZHJhdGlvbkluZm8uZGlzY29ubmVjdGVkTm9kZXMgPSBub2RlSWRzID8gbmV3IFNldChub2RlSWRzKSA6IG51bGw7XG4gIH1cbiAgcmV0dXJuICEhaHlkcmF0aW9uSW5mby5kaXNjb25uZWN0ZWROb2Rlcz8uaGFzKGluZGV4KTtcbn1cbiJdfQ==