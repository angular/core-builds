/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { getComponent } from '../render3/util/discovery_utils';
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
    // The RNode can be a standard HTMLElement (not an Angular component or directive)
    // The devtools component tree only displays Angular components & directives
    // Therefore we attach the debug info to the closest component/directive
    while (node && !getComponent(node)) {
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
export function isSerializedElementContainer(hydrationInfo, index) {
    return hydrationInfo.data[ELEMENT_CONTAINERS]?.[index] !== undefined;
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
 * Attempt to initialize the `disconnectedNodes` field of the given
 * `DehydratedView`. Returns the initialized value.
 */
export function initDisconnectedNodes(hydrationInfo) {
    // Check if we are processing disconnected info for the first time.
    if (typeof hydrationInfo.disconnectedNodes === 'undefined') {
        const nodeIds = hydrationInfo.data[DISCONNECTED_NODES];
        hydrationInfo.disconnectedNodes = nodeIds ? new Set(nodeIds) : null;
    }
    return hydrationInfo.disconnectedNodes;
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
    return !!initDisconnectedNodes(hydrationInfo)?.has(index);
}
/**
 * Helper function to prepare text nodes for serialization by ensuring
 * that seperate logical text blocks in the DOM remain separate after
 * serialization.
 */
export function processTextNodeBeforeSerialization(context, node) {
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
    // Collect this node as required special annotation only when its
    // contents is empty. Otherwise, such text node would be present on
    // the client after server-side rendering and no special handling needed.
    const el = node;
    const corruptedTextNodes = context.corruptedTextNodes;
    if (el.textContent === '') {
        corruptedTextNodes.set(el, "ngetn" /* TextNodeMarker.EmptyNode */);
    }
    else if (el.nextSibling?.nodeType === Node.TEXT_NODE) {
        corruptedTextNodes.set(el, "ngtns" /* TextNodeMarker.Separator */);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9oeWRyYXRpb24vdXRpbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBSUgsT0FBTyxFQUFDLFlBQVksRUFBQyxNQUFNLGlDQUFpQyxDQUFDO0FBRTdELE9BQU8sRUFBQyxXQUFXLEVBQUMsTUFBTSxnQ0FBZ0MsQ0FBQztBQUUzRCxPQUFPLEVBQUMsVUFBVSxFQUFDLE1BQU0sbUNBQW1DLENBQUM7QUFDN0QsT0FBTyxFQUFDLGFBQWEsRUFBUyxLQUFLLEVBQVksTUFBTSw0QkFBNEIsQ0FBQztBQUNsRixPQUFPLEVBQUMsWUFBWSxFQUFFLGFBQWEsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQzlELE9BQU8sRUFBQyxhQUFhLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUc3QyxPQUFPLEVBQUMsVUFBVSxFQUFrQixrQkFBa0IsRUFBRSxrQkFBa0IsRUFBRSxVQUFVLEVBQUUsY0FBYyxHQUF3RSxNQUFNLGNBQWMsQ0FBQztBQUVuTTs7O0dBR0c7QUFDSCxNQUFNLHVCQUF1QixHQUFHLGFBQWEsQ0FBQztBQUU5Qzs7R0FFRztBQUNILE1BQU0sQ0FBQyxNQUFNLFlBQVksR0FBRyxZQUFZLENBQXdCLHVCQUF1QixDQUFDLENBQUM7QUFFekY7Ozs7R0FJRztBQUNILE1BQU0sQ0FBQyxNQUFNLGFBQWEsR0FBRyxLQUFLLENBQUM7QUFFbkM7O0dBRUc7QUFDSCxNQUFNLENBQUMsTUFBTSw0QkFBNEIsR0FBRyxNQUFNLENBQUM7QUFzQm5EOzs7Ozs7OztHQVFHO0FBQ0gsSUFBSSwwQkFBMEIsR0FBcUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDO0FBRTlFLE1BQU0sVUFBVSx5QkFBeUIsQ0FDckMsS0FBZSxFQUNmLFFBQWtCLEVBQ2xCLFVBQVUsR0FBRyxLQUFLO0lBRXBCLElBQUksWUFBWSxHQUFHLEtB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QUNwRiw0RUFBNEU7SUFDNUUsb0ZBQW9GO0lBQ3BGLDBGQUEwRjtJQUMxRiw4RUFBOEU7SUFDOUUsdUZBQXVGO0lBQ3ZGLDBFQUEwRTtJQUUxRSxpRUFBaUU7SUFDakUsbUVBQW1FO0lBQ25FLHlFQUF5RTtJQUN6RSxNQUFNLEVBQUUsR0FBRyxJQUFtQixDQUFDO0lBQy9CLE1BQU0sa0JBQWtCLEdBQUcsT0FBTyxDQUFDLGtCQUFrQixDQUFDO0lBQ3RELElBQUksRUFBRSxDQUFDLFdBQVcsS0FBSyxFQUFFLEVBQUUsQ0FBQztRQUMxQixrQkFBa0IsQ0FBQyxHQUFHLENBQUMsRUFBRSx5Q0FBMkIsQ0FBQztJQUN2RCxDQUFDO1NBQU0sSUFBSSxFQUFFLENBQUMsV0FBVyxFQUFFLFFBQVEsS0FBSyxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7UUFDdkQsa0JBQWtCLENBQUMsR0FBRyxDQUFDLEVBQUUseUNBQTJCLENBQUM7SUFDdkQsQ0FBQztBQUNILENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtJbmplY3Rvcn0gZnJvbSAnLi4vZGkvaW5qZWN0b3InO1xuaW1wb3J0IHR5cGUge1ZpZXdSZWZ9IGZyb20gJy4uL2xpbmtlci92aWV3X3JlZic7XG5pbXBvcnQge2dldENvbXBvbmVudH0gZnJvbSAnLi4vcmVuZGVyMy91dGlsL2Rpc2NvdmVyeV91dGlscyc7XG5pbXBvcnQge0xDb250YWluZXJ9IGZyb20gJy4uL3JlbmRlcjMvaW50ZXJmYWNlcy9jb250YWluZXInO1xuaW1wb3J0IHtnZXREb2N1bWVudH0gZnJvbSAnLi4vcmVuZGVyMy9pbnRlcmZhY2VzL2RvY3VtZW50JztcbmltcG9ydCB7UkVsZW1lbnQsIFJOb2RlfSBmcm9tICcuLi9yZW5kZXIzL2ludGVyZmFjZXMvcmVuZGVyZXJfZG9tJztcbmltcG9ydCB7aXNSb290Vmlld30gZnJvbSAnLi4vcmVuZGVyMy9pbnRlcmZhY2VzL3R5cGVfY2hlY2tzJztcbmltcG9ydCB7SEVBREVSX09GRlNFVCwgTFZpZXcsIFRWSUVXLCBUVmlld1R5cGV9IGZyb20gJy4uL3JlbmRlcjMvaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7bWFrZVN0YXRlS2V5LCBUcmFuc2ZlclN0YXRlfSBmcm9tICcuLi90cmFuc2Zlcl9zdGF0ZSc7XG5pbXBvcnQge2Fzc2VydERlZmluZWR9IGZyb20gJy4uL3V0aWwvYXNzZXJ0JztcbmltcG9ydCB0eXBlIHtIeWRyYXRpb25Db250ZXh0fSBmcm9tICcuL2Fubm90YXRlJztcblxuaW1wb3J0IHtDT05UQUlORVJTLCBEZWh5ZHJhdGVkVmlldywgRElTQ09OTkVDVEVEX05PREVTLCBFTEVNRU5UX0NPTlRBSU5FUlMsIE1VTFRJUExJRVIsIE5VTV9ST09UX05PREVTLCBTZXJpYWxpemVkQ29udGFpbmVyVmlldywgU2VyaWFsaXplZEVsZW1lbnRDb250YWluZXJzLCBTZXJpYWxpemVkVmlldyx9IGZyb20gJy4vaW50ZXJmYWNlcyc7XG5cbi8qKlxuICogVGhlIG5hbWUgb2YgdGhlIGtleSB1c2VkIGluIHRoZSBUcmFuc2ZlclN0YXRlIGNvbGxlY3Rpb24sXG4gKiB3aGVyZSBoeWRyYXRpb24gaW5mb3JtYXRpb24gaXMgbG9jYXRlZC5cbiAqL1xuY29uc3QgVFJBTlNGRVJfU1RBVEVfVE9LRU5fSUQgPSAnX19uZ2hEYXRhX18nO1xuXG4vKipcbiAqIExvb2t1cCBrZXkgdXNlZCB0byByZWZlcmVuY2UgRE9NIGh5ZHJhdGlvbiBkYXRhIChuZ2gpIGluIGBUcmFuc2ZlclN0YXRlYC5cbiAqL1xuZXhwb3J0IGNvbnN0IE5HSF9EQVRBX0tFWSA9IG1ha2VTdGF0ZUtleTxBcnJheTxTZXJpYWxpemVkVmlldz4+KFRSQU5TRkVSX1NUQVRFX1RPS0VOX0lEKTtcblxuLyoqXG4gKiBUaGUgbmFtZSBvZiB0aGUgYXR0cmlidXRlIHRoYXQgd291bGQgYmUgYWRkZWQgdG8gaG9zdCBjb21wb25lbnRcbiAqIG5vZGVzIGFuZCBjb250YWluIGEgcmVmZXJlbmNlIHRvIGEgcGFydGljdWxhciBzbG90IGluIHRyYW5zZmVycmVkXG4gKiBzdGF0ZSB0aGF0IGNvbnRhaW5zIHRoZSBuZWNlc3NhcnkgaHlkcmF0aW9uIGluZm8gZm9yIHRoaXMgY29tcG9uZW50LlxuICovXG5leHBvcnQgY29uc3QgTkdIX0FUVFJfTkFNRSA9ICduZ2gnO1xuXG4vKipcbiAqIE1hcmtlciB1c2VkIGluIGEgY29tbWVudCBub2RlIHRvIGVuc3VyZSBoeWRyYXRpb24gY29udGVudCBpbnRlZ3JpdHlcbiAqL1xuZXhwb3J0IGNvbnN0IFNTUl9DT05URU5UX0lOVEVHUklUWV9NQVJLRVIgPSAnbmdobSc7XG5cbmV4cG9ydCBjb25zdCBlbnVtIFRleHROb2RlTWFya2VyIHtcbiAgLyoqXG4gICAqIFRoZSBjb250ZW50cyBvZiB0aGUgdGV4dCBjb21tZW50IGFkZGVkIHRvIG5vZGVzIHRoYXQgd291bGQgb3RoZXJ3aXNlIGJlXG4gICAqIGVtcHR5IHdoZW4gc2VyaWFsaXplZCBieSB0aGUgc2VydmVyIGFuZCBwYXNzZWQgdG8gdGhlIGNsaWVudC4gVGhlIGVtcHR5XG4gICAqIG5vZGUgaXMgbG9zdCB3aGVuIHRoZSBicm93c2VyIHBhcnNlcyBpdCBvdGhlcndpc2UuIFRoaXMgY29tbWVudCBub2RlIHdpbGxcbiAgICogYmUgcmVwbGFjZWQgZHVyaW5nIGh5ZHJhdGlvbiBpbiB0aGUgY2xpZW50IHRvIHJlc3RvcmUgdGhlIGxvc3QgZW1wdHkgdGV4dFxuICAgKiBub2RlLlxuICAgKi9cbiAgRW1wdHlOb2RlID0gJ25nZXRuJyxcblxuICAvKipcbiAgICogVGhlIGNvbnRlbnRzIG9mIHRoZSB0ZXh0IGNvbW1lbnQgYWRkZWQgaW4gdGhlIGNhc2Ugb2YgYWRqYWNlbnQgdGV4dCBub2Rlcy5cbiAgICogV2hlbiBhZGphY2VudCB0ZXh0IG5vZGVzIGFyZSBzZXJpYWxpemVkIGJ5IHRoZSBzZXJ2ZXIgYW5kIHNlbnQgdG8gdGhlXG4gICAqIGNsaWVudCwgdGhlIGJyb3dzZXIgbG9zZXMgcmVmZXJlbmNlIHRvIHRoZSBhbW91bnQgb2Ygbm9kZXMgYW5kIGFzc3VtZXNcbiAgICoganVzdCBvbmUgdGV4dCBub2RlLiBUaGlzIHNlcGFyYXRvciBpcyByZXBsYWNlZCBkdXJpbmcgaHlkcmF0aW9uIHRvIHJlc3RvcmVcbiAgICogdGhlIHByb3BlciBzZXBhcmF0aW9uIGFuZCBhbW91bnQgb2YgdGV4dCBub2RlcyB0aGF0IHNob3VsZCBiZSBwcmVzZW50LlxuICAgKi9cbiAgU2VwYXJhdG9yID0gJ25ndG5zJyxcbn1cblxuLyoqXG4gKiBSZWZlcmVuY2UgdG8gYSBmdW5jdGlvbiB0aGF0IHJlYWRzIGBuZ2hgIGF0dHJpYnV0ZSB2YWx1ZSBmcm9tIGEgZ2l2ZW4gUk5vZGVcbiAqIGFuZCByZXRyaWV2ZXMgaHlkcmF0aW9uIGluZm9ybWF0aW9uIGZyb20gdGhlIFRyYW5zZmVyU3RhdGUgdXNpbmcgdGhhdCB2YWx1ZVxuICogYXMgYW4gaW5kZXguIFJldHVybnMgYG51bGxgIGJ5IGRlZmF1bHQsIHdoZW4gaHlkcmF0aW9uIGlzIG5vdCBlbmFibGVkLlxuICpcbiAqIEBwYXJhbSByTm9kZSBDb21wb25lbnQncyBob3N0IGVsZW1lbnQuXG4gKiBAcGFyYW0gaW5qZWN0b3IgSW5qZWN0b3IgdGhhdCB0aGlzIGNvbXBvbmVudCBoYXMgYWNjZXNzIHRvLlxuICogQHBhcmFtIGlzUm9vdFZpZXcgU3BlY2lmaWVzIHdoZXRoZXIgd2UgdHJ5aW5nIHRvIHJlYWQgaHlkcmF0aW9uIGluZm8gZm9yIHRoZSByb290IHZpZXcuXG4gKi9cbmxldCBfcmV0cmlldmVIeWRyYXRpb25JbmZvSW1wbDogdHlwZW9mIHJldHJpZXZlSHlkcmF0aW9uSW5mb0ltcGwgPSAoKSA9PiBudWxsO1xuXG5leHBvcnQgZnVuY3Rpb24gcmV0cmlldmVIeWRyYXRpb25JbmZvSW1wbChcbiAgICByTm9kZTogUkVsZW1lbnQsXG4gICAgaW5qZWN0b3I6IEluamVjdG9yLFxuICAgIGlzUm9vdFZpZXcgPSBmYWxzZSxcbiAgICApOiBEZWh5ZHJhdGVkVmlld3xudWxsIHtcbiAgbGV0IG5naEF0dHJWYWx1ZSA9IHJOb2RlLmdldEF0dHJpYnV0ZShOR0hfQVRUUl9OQU1FKTtcbiAgaWYgKG5naEF0dHJWYWx1ZSA9PSBudWxsKSByZXR1cm4gbnVsbDtcblxuICAvLyBGb3IgY2FzZXMgd2hlbiBhIHJvb3QgY29tcG9uZW50IGFsc28gYWN0cyBhcyBhbiBhbmNob3Igbm9kZSBmb3IgYSBWaWV3Q29udGFpbmVyUmVmXG4gIC8vIChmb3IgZXhhbXBsZSwgd2hlbiBWaWV3Q29udGFpbmVyUmVmIGlzIGluamVjdGVkIGluIGEgcm9vdCBjb21wb25lbnQpLCB0aGVyZSBpcyBhIG5lZWRcbiAgLy8gdG8gc2VyaWFsaXplIGluZm9ybWF0aW9uIGFib3V0IHRoZSBjb21wb25lbnQgaXRzZWxmLCBhcyB3ZWxsIGFzIGFuIExDb250YWluZXIgdGhhdFxuICAvLyByZXByZXNlbnRzIHRoaXMgVmlld0NvbnRhaW5lclJlZi4gRWZmZWN0aXZlbHksIHdlIG5lZWQgdG8gc2VyaWFsaXplIDIgcGllY2VzIG9mIGluZm86XG4gIC8vICgxKSBoeWRyYXRpb24gaW5mbyBmb3IgdGhlIHJvb3QgY29tcG9uZW50IGl0c2VsZiBhbmQgKDIpIGh5ZHJhdGlvbiBpbmZvIGZvciB0aGVcbiAgLy8gVmlld0NvbnRhaW5lclJlZiBpbnN0YW5jZSAoYW4gTENvbnRhaW5lcikuIEVhY2ggcGllY2Ugb2YgaW5mb3JtYXRpb24gaXMgaW5jbHVkZWQgaW50b1xuICAvLyB0aGUgaHlkcmF0aW9uIGRhdGEgKGluIHRoZSBUcmFuc2ZlclN0YXRlIG9iamVjdCkgc2VwYXJhdGVseSwgdGh1cyB3ZSBlbmQgdXAgd2l0aCAyIGlkcy5cbiAgLy8gU2luY2Ugd2Ugb25seSBoYXZlIDEgcm9vdCBlbGVtZW50LCB3ZSBlbmNvZGUgYm90aCBiaXRzIG9mIGluZm8gaW50byBhIHNpbmdsZSBzdHJpbmc6XG4gIC8vIGlkcyBhcmUgc2VwYXJhdGVkIGJ5IHRoZSBgfGAgY2hhciAoZS5nLiBgMTB8MjVgLCB3aGVyZSBgMTBgIGlzIHRoZSBuZ2ggZm9yIGEgY29tcG9uZW50IHZpZXdcbiAgLy8gYW5kIDI1IGlzIHRoZSBgbmdoYCBmb3IgYSByb290IHZpZXcgd2hpY2ggaG9sZHMgTENvbnRhaW5lcikuXG4gIGNvbnN0IFtjb21wb25lbnRWaWV3TmdoLCByb290Vmlld05naF0gPSBuZ2hBdHRyVmFsdWUuc3BsaXQoJ3wnKTtcbiAgbmdoQXR0clZhbHVlID0gaXNSb290VmlldyA/IHJvb3RWaWV3TmdoIDogY29tcG9uZW50Vmlld05naDtcbiAgaWYgKCFuZ2hBdHRyVmFsdWUpIHJldHVybiBudWxsO1xuXG4gIC8vIFdlJ3ZlIHJlYWQgb25lIG9mIHRoZSBuZ2ggaWRzLCBrZWVwIHRoZSByZW1haW5pbmcgb25lLCBzbyB0aGF0XG4gIC8vIHdlIGNhbiBzZXQgaXQgYmFjayBvbiB0aGUgRE9NIGVsZW1lbnQuXG4gIGNvbnN0IHJvb3ROZ2ggPSByb290Vmlld05naCA/IGB8JHtyb290Vmlld05naH1gIDogJyc7XG4gIGNvbnN0IHJlbWFpbmluZ05naCA9IGlzUm9vdFZpZXcgPyBjb21wb25lbnRWaWV3TmdoIDogcm9vdE5naDtcblxuICBsZXQgZGF0YTogU2VyaWFsaXplZFZpZXcgPSB7fTtcbiAgLy8gQW4gZWxlbWVudCBtaWdodCBoYXZlIGFuIGVtcHR5IGBuZ2hgIGF0dHJpYnV0ZSB2YWx1ZSAoZS5nLiBgPGNvbXAgbmdoPVwiXCIgLz5gKSxcbiAgLy8gd2hpY2ggbWVhbnMgdGhhdCBubyBzcGVjaWFsIGFubm90YXRpb25zIGFyZSByZXF1aXJlZC4gRG8gbm90IGF0dGVtcHQgdG8gcmVhZFxuICAvLyBmcm9tIHRoZSBUcmFuc2ZlclN0YXRlIGluIHRoaXMgY2FzZS5cbiAgaWYgKG5naEF0dHJWYWx1ZSAhPT0gJycpIHtcbiAgICBjb25zdCB0cmFuc2ZlclN0YXRlID0gaW5qZWN0b3IuZ2V0KFRyYW5zZmVyU3RhdGUsIG51bGwsIHtvcHRpb25hbDogdHJ1ZX0pO1xuICAgIGlmICh0cmFuc2ZlclN0YXRlICE9PSBudWxsKSB7XG4gICAgICBjb25zdCBuZ2hEYXRhID0gdHJhbnNmZXJTdGF0ZS5nZXQoTkdIX0RBVEFfS0VZLCBbXSk7XG5cbiAgICAgIC8vIFRoZSBuZ2hBdHRyVmFsdWUgaXMgYWx3YXlzIGEgbnVtYmVyIHJlZmVyZW5jaW5nIGFuIGluZGV4XG4gICAgICAvLyBpbiB0aGUgaHlkcmF0aW9uIFRyYW5zZmVyU3RhdGUgZGF0YS5cbiAgICAgIGRhdGEgPSBuZ2hEYXRhW051bWJlcihuZ2hBdHRyVmFsdWUpXTtcblxuICAgICAgLy8gSWYgdGhlIGBuZ2hgIGF0dHJpYnV0ZSBleGlzdHMgYW5kIGhhcyBhIG5vbi1lbXB0eSB2YWx1ZSxcbiAgICAgIC8vIHRoZSBoeWRyYXRpb24gaW5mbyAqbXVzdCogYmUgcHJlc2VudCBpbiB0aGUgVHJhbnNmZXJTdGF0ZS5cbiAgICAgIC8vIElmIHRoZXJlIGlzIG5vIGRhdGEgZm9yIHNvbWUgcmVhc29ucywgdGhpcyBpcyBhbiBlcnJvci5cbiAgICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKGRhdGEsICdVbmFibGUgdG8gcmV0cmlldmUgaHlkcmF0aW9uIGluZm8gZnJvbSB0aGUgVHJhbnNmZXJTdGF0ZS4nKTtcbiAgICB9XG4gIH1cbiAgY29uc3QgZGVoeWRyYXRlZFZpZXc6IERlaHlkcmF0ZWRWaWV3ID0ge1xuICAgIGRhdGEsXG4gICAgZmlyc3RDaGlsZDogck5vZGUuZmlyc3RDaGlsZCA/PyBudWxsLFxuICB9O1xuXG4gIGlmIChpc1Jvb3RWaWV3KSB7XG4gICAgLy8gSWYgdGhlcmUgaXMgaHlkcmF0aW9uIGluZm8gcHJlc2VudCBmb3IgdGhlIHJvb3QgdmlldywgaXQgbWVhbnMgdGhhdCB0aGVyZSB3YXNcbiAgICAvLyBhIFZpZXdDb250YWluZXJSZWYgaW5qZWN0ZWQgaW4gdGhlIHJvb3QgY29tcG9uZW50LiBUaGUgcm9vdCBjb21wb25lbnQgaG9zdCBlbGVtZW50XG4gICAgLy8gYWN0ZWQgYXMgYW4gYW5jaG9yIG5vZGUgaW4gdGhpcyBzY2VuYXJpby4gQXMgYSByZXN1bHQsIHRoZSBET00gbm9kZXMgdGhhdCByZXByZXNlbnRcbiAgICAvLyBlbWJlZGRlZCB2aWV3cyBpbiB0aGlzIFZpZXdDb250YWluZXJSZWYgYXJlIGxvY2F0ZWQgYXMgc2libGluZ3MgdG8gdGhlIGhvc3Qgbm9kZSxcbiAgICAvLyBpLmUuIGA8YXBwLXJvb3QgLz48I1ZJRVcxPjwjVklFVzI+Li4uPCEtLWNvbnRhaW5lci0tPmAuIEluIHRoaXMgY2FzZSwgdGhlIGN1cnJlbnRcbiAgICAvLyBub2RlIGJlY29tZXMgdGhlIGZpcnN0IGNoaWxkIG9mIHRoaXMgcm9vdCB2aWV3IGFuZCB0aGUgbmV4dCBzaWJsaW5nIGlzIHRoZSBmaXJzdFxuICAgIC8vIGVsZW1lbnQgaW4gdGhlIERPTSBzZWdtZW50LlxuICAgIGRlaHlkcmF0ZWRWaWV3LmZpcnN0Q2hpbGQgPSByTm9kZTtcblxuICAgIC8vIFdlIHVzZSBgMGAgaGVyZSwgc2luY2UgdGhpcyBpcyB0aGUgc2xvdCAocmlnaHQgYWZ0ZXIgdGhlIEhFQURFUl9PRkZTRVQpXG4gICAgLy8gd2hlcmUgYSBjb21wb25lbnQgTFZpZXcgb3IgYW4gTENvbnRhaW5lciBpcyBsb2NhdGVkIGluIGEgcm9vdCBMVmlldy5cbiAgICBzZXRTZWdtZW50SGVhZChkZWh5ZHJhdGVkVmlldywgMCwgck5vZGUubmV4dFNpYmxpbmcpO1xuICB9XG5cbiAgaWYgKHJlbWFpbmluZ05naCkge1xuICAgIC8vIElmIHdlIGhhdmUgb25seSB1c2VkIG9uZSBvZiB0aGUgbmdoIGlkcywgc3RvcmUgdGhlIHJlbWFpbmluZyBvbmVcbiAgICAvLyBiYWNrIG9uIHRoaXMgUk5vZGUuXG4gICAgck5vZGUuc2V0QXR0cmlidXRlKE5HSF9BVFRSX05BTUUsIHJlbWFpbmluZ05naCk7XG4gIH0gZWxzZSB7XG4gICAgLy8gVGhlIGBuZ2hgIGF0dHJpYnV0ZSBpcyBjbGVhcmVkIGZyb20gdGhlIERPTSBub2RlIG5vd1xuICAgIC8vIHRoYXQgdGhlIGRhdGEgaGFzIGJlZW4gcmV0cmlldmVkIGZvciBhbGwgaW5kaWNlcy5cbiAgICByTm9kZS5yZW1vdmVBdHRyaWJ1dGUoTkdIX0FUVFJfTkFNRSk7XG4gIH1cblxuICAvLyBOb3RlOiBkb24ndCBjaGVjayB3aGV0aGVyIHRoaXMgbm9kZSB3YXMgY2xhaW1lZCBmb3IgaHlkcmF0aW9uLFxuICAvLyBiZWNhdXNlIHRoaXMgbm9kZSBtaWdodCd2ZSBiZWVuIHByZXZpb3VzbHkgY2xhaW1lZCB3aGlsZSBwcm9jZXNzaW5nXG4gIC8vIHRlbXBsYXRlIGluc3RydWN0aW9ucy5cbiAgbmdEZXZNb2RlICYmIG1hcmtSTm9kZUFzQ2xhaW1lZEJ5SHlkcmF0aW9uKHJOb2RlLCAvKiBjaGVja0lmQWxyZWFkeUNsYWltZWQgKi8gZmFsc2UpO1xuICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLmh5ZHJhdGVkQ29tcG9uZW50cysrO1xuXG4gIHJldHVybiBkZWh5ZHJhdGVkVmlldztcbn1cblxuLyoqXG4gKiBTZXRzIHRoZSBpbXBsZW1lbnRhdGlvbiBmb3IgdGhlIGByZXRyaWV2ZUh5ZHJhdGlvbkluZm9gIGZ1bmN0aW9uLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZW5hYmxlUmV0cmlldmVIeWRyYXRpb25JbmZvSW1wbCgpIHtcbiAgX3JldHJpZXZlSHlkcmF0aW9uSW5mb0ltcGwgPSByZXRyaWV2ZUh5ZHJhdGlvbkluZm9JbXBsO1xufVxuXG4vKipcbiAqIFJldHJpZXZlcyBoeWRyYXRpb24gaW5mbyBieSByZWFkaW5nIHRoZSB2YWx1ZSBmcm9tIHRoZSBgbmdoYCBhdHRyaWJ1dGVcbiAqIGFuZCBhY2Nlc3NpbmcgYSBjb3JyZXNwb25kaW5nIHNsb3QgaW4gVHJhbnNmZXJTdGF0ZSBzdG9yYWdlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmV0cmlldmVIeWRyYXRpb25JbmZvKFxuICAgIHJOb2RlOiBSRWxlbWVudCxcbiAgICBpbmplY3RvcjogSW5qZWN0b3IsXG4gICAgaXNSb290VmlldyA9IGZhbHNlLFxuICAgICk6IERlaHlkcmF0ZWRWaWV3fG51bGwge1xuICByZXR1cm4gX3JldHJpZXZlSHlkcmF0aW9uSW5mb0ltcGwock5vZGUsIGluamVjdG9yLCBpc1Jvb3RWaWV3KTtcbn1cblxuLyoqXG4gKiBSZXRyaWV2ZXMgdGhlIG5lY2Vzc2FyeSBvYmplY3QgZnJvbSBhIGdpdmVuIFZpZXdSZWYgdG8gc2VyaWFsaXplOlxuICogIC0gYW4gTFZpZXcgZm9yIGNvbXBvbmVudCB2aWV3c1xuICogIC0gYW4gTENvbnRhaW5lciBmb3IgY2FzZXMgd2hlbiBjb21wb25lbnQgYWN0cyBhcyBhIFZpZXdDb250YWluZXJSZWYgYW5jaG9yXG4gKiAgLSBgbnVsbGAgaW4gY2FzZSBvZiBhbiBlbWJlZGRlZCB2aWV3XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRMTm9kZUZvckh5ZHJhdGlvbih2aWV3UmVmOiBWaWV3UmVmKTogTFZpZXd8TENvbnRhaW5lcnxudWxsIHtcbiAgLy8gUmVhZGluZyBhbiBpbnRlcm5hbCBmaWVsZCBmcm9tIGBWaWV3UmVmYCBpbnN0YW5jZS5cbiAgbGV0IGxWaWV3ID0gKHZpZXdSZWYgYXMgYW55KS5fbFZpZXcgYXMgTFZpZXc7XG4gIGNvbnN0IHRWaWV3ID0gbFZpZXdbVFZJRVddO1xuICAvLyBBIHJlZ2lzdGVyZWQgVmlld1JlZiBtaWdodCByZXByZXNlbnQgYW4gaW5zdGFuY2Ugb2YgYW5cbiAgLy8gZW1iZWRkZWQgdmlldywgaW4gd2hpY2ggY2FzZSB3ZSBkbyBub3QgbmVlZCB0byBhbm5vdGF0ZSBpdC5cbiAgaWYgKHRWaWV3LnR5cGUgPT09IFRWaWV3VHlwZS5FbWJlZGRlZCkge1xuICAgIHJldHVybiBudWxsO1xuICB9XG4gIC8vIENoZWNrIGlmIGl0J3MgYSByb290IHZpZXcgYW5kIGlmIHNvLCByZXRyaWV2ZSBjb21wb25lbnQnc1xuICAvLyBMVmlldyBmcm9tIHRoZSBmaXJzdCBzbG90IGFmdGVyIHRoZSBoZWFkZXIuXG4gIGlmIChpc1Jvb3RWaWV3KGxWaWV3KSkge1xuICAgIGxWaWV3ID0gbFZpZXdbSEVBREVSX09GRlNFVF07XG4gIH1cblxuICByZXR1cm4gbFZpZXc7XG59XG5cbmZ1bmN0aW9uIGdldFRleHROb2RlQ29udGVudChub2RlOiBOb2RlKTogc3RyaW5nfHVuZGVmaW5lZCB7XG4gIHJldHVybiBub2RlLnRleHRDb250ZW50Py5yZXBsYWNlKC9cXHMvZ20sICcnKTtcbn1cblxuLyoqXG4gKiBSZXN0b3JlcyB0ZXh0IG5vZGVzIGFuZCBzZXBhcmF0b3JzIGludG8gdGhlIERPTSB0aGF0IHdlcmUgbG9zdCBkdXJpbmcgU1NSXG4gKiBzZXJpYWxpemF0aW9uLiBUaGUgaHlkcmF0aW9uIHByb2Nlc3MgcmVwbGFjZXMgZW1wdHkgdGV4dCBub2RlcyBhbmQgdGV4dFxuICogbm9kZXMgdGhhdCBhcmUgaW1tZWRpYXRlbHkgYWRqYWNlbnQgdG8gb3RoZXIgdGV4dCBub2RlcyB3aXRoIGNvbW1lbnQgbm9kZXNcbiAqIHRoYXQgdGhpcyBtZXRob2QgZmlsdGVycyBvbiB0byByZXN0b3JlIHRob3NlIG1pc3Npbmcgbm9kZXMgdGhhdCB0aGVcbiAqIGh5ZHJhdGlvbiBwcm9jZXNzIGlzIGV4cGVjdGluZyB0byBiZSBwcmVzZW50LlxuICpcbiAqIEBwYXJhbSBub2RlIFRoZSBhcHAncyByb290IEhUTUwgRWxlbWVudFxuICovXG5leHBvcnQgZnVuY3Rpb24gcHJvY2Vzc1RleHROb2RlTWFya2Vyc0JlZm9yZUh5ZHJhdGlvbihub2RlOiBIVE1MRWxlbWVudCkge1xuICBjb25zdCBkb2MgPSBnZXREb2N1bWVudCgpO1xuICBjb25zdCBjb21tZW50Tm9kZXNJdGVyYXRvciA9IGRvYy5jcmVhdGVOb2RlSXRlcmF0b3Iobm9kZSwgTm9kZUZpbHRlci5TSE9XX0NPTU1FTlQsIHtcbiAgICBhY2NlcHROb2RlKG5vZGUpIHtcbiAgICAgIGNvbnN0IGNvbnRlbnQgPSBnZXRUZXh0Tm9kZUNvbnRlbnQobm9kZSk7XG4gICAgICBjb25zdCBpc1RleHROb2RlTWFya2VyID1cbiAgICAgICAgICBjb250ZW50ID09PSBUZXh0Tm9kZU1hcmtlci5FbXB0eU5vZGUgfHwgY29udGVudCA9PT0gVGV4dE5vZGVNYXJrZXIuU2VwYXJhdG9yO1xuICAgICAgcmV0dXJuIGlzVGV4dE5vZGVNYXJrZXIgPyBOb2RlRmlsdGVyLkZJTFRFUl9BQ0NFUFQgOiBOb2RlRmlsdGVyLkZJTFRFUl9SRUpFQ1Q7XG4gICAgfSxcbiAgfSk7XG4gIGxldCBjdXJyZW50Tm9kZTogQ29tbWVudDtcbiAgLy8gV2UgY2Fubm90IG1vZGlmeSB0aGUgRE9NIHdoaWxlIHVzaW5nIHRoZSBjb21tZW50SXRlcmF0b3IsXG4gIC8vIGJlY2F1c2UgaXQgdGhyb3dzIG9mZiB0aGUgaXRlcmF0b3Igc3RhdGUuXG4gIC8vIFNvIHdlIGNvbGxlY3QgYWxsIG1hcmtlciBub2RlcyBmaXJzdCBhbmQgdGhlbiBmb2xsb3cgdXAgd2l0aFxuICAvLyBhcHBseWluZyB0aGUgY2hhbmdlcyB0byB0aGUgRE9NOiBlaXRoZXIgaW5zZXJ0aW5nIGFuIGVtcHR5IG5vZGVcbiAgLy8gb3IganVzdCByZW1vdmluZyB0aGUgbWFya2VyIGlmIGl0IHdhcyB1c2VkIGFzIGEgc2VwYXJhdG9yLlxuICBjb25zdCBub2RlcyA9IFtdO1xuICB3aGlsZSAoKGN1cnJlbnROb2RlID0gY29tbWVudE5vZGVzSXRlcmF0b3IubmV4dE5vZGUoKSBhcyBDb21tZW50KSkge1xuICAgIG5vZGVzLnB1c2goY3VycmVudE5vZGUpO1xuICB9XG4gIGZvciAoY29uc3Qgbm9kZSBvZiBub2Rlcykge1xuICAgIGlmIChub2RlLnRleHRDb250ZW50ID09PSBUZXh0Tm9kZU1hcmtlci5FbXB0eU5vZGUpIHtcbiAgICAgIG5vZGUucmVwbGFjZVdpdGgoZG9jLmNyZWF0ZVRleHROb2RlKCcnKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5vZGUucmVtb3ZlKCk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogSW50ZXJuYWwgdHlwZSB0aGF0IHJlcHJlc2VudHMgYSBjbGFpbWVkIG5vZGUuXG4gKiBPbmx5IHVzZWQgaW4gZGV2IG1vZGUuXG4gKi9cbmV4cG9ydCBlbnVtIEh5ZHJhdGlvblN0YXR1cyB7XG4gIEh5ZHJhdGVkID0gJ2h5ZHJhdGVkJyxcbiAgU2tpcHBlZCA9ICdza2lwcGVkJyxcbiAgTWlzbWF0Y2hlZCA9ICdtaXNtYXRjaGVkJyxcbn1cblxuLy8gY2xhbmctZm9ybWF0IG9mZlxuZXhwb3J0IHR5cGUgSHlkcmF0aW9uSW5mbyA9IHtcbiAgc3RhdHVzOiBIeWRyYXRpb25TdGF0dXMuSHlkcmF0ZWR8SHlkcmF0aW9uU3RhdHVzLlNraXBwZWQ7XG59fHtcbiAgc3RhdHVzOiBIeWRyYXRpb25TdGF0dXMuTWlzbWF0Y2hlZDtcbiAgYWN0dWFsTm9kZURldGFpbHM6IHN0cmluZ3xudWxsO1xuICBleHBlY3RlZE5vZGVEZXRhaWxzOiBzdHJpbmd8bnVsbFxufTtcbi8vIGNsYW5nLWZvcm1hdCBvblxuXG5jb25zdCBIWURSQVRJT05fSU5GT19LRVkgPSAnX19uZ0RlYnVnSHlkcmF0aW9uSW5mb19fJztcblxuZXhwb3J0IHR5cGUgSHlkcmF0ZWROb2RlID0ge1xuICBbSFlEUkFUSU9OX0lORk9fS0VZXT86IEh5ZHJhdGlvbkluZm87XG59O1xuXG5mdW5jdGlvbiBwYXRjaEh5ZHJhdGlvbkluZm8obm9kZTogUk5vZGUsIGluZm86IEh5ZHJhdGlvbkluZm8pIHtcbiAgKG5vZGUgYXMgSHlkcmF0ZWROb2RlKVtIWURSQVRJT05fSU5GT19LRVldID0gaW5mbztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlYWRIeWRyYXRpb25JbmZvKG5vZGU6IFJOb2RlKTogSHlkcmF0aW9uSW5mb3xudWxsIHtcbiAgcmV0dXJuIChub2RlIGFzIEh5ZHJhdGVkTm9kZSlbSFlEUkFUSU9OX0lORk9fS0VZXSA/PyBudWxsO1xufVxuXG4vKipcbiAqIE1hcmtzIGEgbm9kZSBhcyBcImNsYWltZWRcIiBieSBoeWRyYXRpb24gcHJvY2Vzcy5cbiAqIFRoaXMgaXMgbmVlZGVkIHRvIG1ha2UgYXNzZXNzbWVudHMgaW4gdGVzdHMgd2hldGhlclxuICogdGhlIGh5ZHJhdGlvbiBwcm9jZXNzIGhhbmRsZWQgYWxsIG5vZGVzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gbWFya1JOb2RlQXNDbGFpbWVkQnlIeWRyYXRpb24obm9kZTogUk5vZGUsIGNoZWNrSWZBbHJlYWR5Q2xhaW1lZCA9IHRydWUpIHtcbiAgaWYgKCFuZ0Rldk1vZGUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICdDYWxsaW5nIGBtYXJrUk5vZGVBc0NsYWltZWRCeUh5ZHJhdGlvbmAgaW4gcHJvZCBtb2RlICcgK1xuICAgICAgICAgICAgJ2lzIG5vdCBzdXBwb3J0ZWQgYW5kIGxpa2VseSBhIG1pc3Rha2UuJyxcbiAgICApO1xuICB9XG4gIGlmIChjaGVja0lmQWxyZWFkeUNsYWltZWQgJiYgaXNSTm9kZUNsYWltZWRGb3JIeWRyYXRpb24obm9kZSkpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1RyeWluZyB0byBjbGFpbSBhIG5vZGUsIHdoaWNoIHdhcyBjbGFpbWVkIGFscmVhZHkuJyk7XG4gIH1cbiAgcGF0Y2hIeWRyYXRpb25JbmZvKG5vZGUsIHtzdGF0dXM6IEh5ZHJhdGlvblN0YXR1cy5IeWRyYXRlZH0pO1xuICBuZ0Rldk1vZGUuaHlkcmF0ZWROb2RlcysrO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbWFya1JOb2RlQXNTa2lwcGVkQnlIeWRyYXRpb24obm9kZTogUk5vZGUpIHtcbiAgaWYgKCFuZ0Rldk1vZGUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICdDYWxsaW5nIGBtYXJrUk5vZGVBc1NraXBwZWRCeUh5ZHJhdGlvbmAgaW4gcHJvZCBtb2RlICcgK1xuICAgICAgICAgICAgJ2lzIG5vdCBzdXBwb3J0ZWQgYW5kIGxpa2VseSBhIG1pc3Rha2UuJyxcbiAgICApO1xuICB9XG4gIHBhdGNoSHlkcmF0aW9uSW5mbyhub2RlLCB7c3RhdHVzOiBIeWRyYXRpb25TdGF0dXMuU2tpcHBlZH0pO1xuICBuZ0Rldk1vZGUuY29tcG9uZW50c1NraXBwZWRIeWRyYXRpb24rKztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG1hcmtSTm9kZUFzSGF2aW5nSHlkcmF0aW9uTWlzbWF0Y2goXG4gICAgbm9kZTogUk5vZGUsXG4gICAgZXhwZWN0ZWROb2RlRGV0YWlsczogc3RyaW5nfG51bGwgPSBudWxsLFxuICAgIGFjdHVhbE5vZGVEZXRhaWxzOiBzdHJpbmd8bnVsbCA9IG51bGwsXG4pIHtcbiAgaWYgKCFuZ0Rldk1vZGUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICdDYWxsaW5nIGBtYXJrUk5vZGVBc01pc21hdGNoZWRCeUh5ZHJhdGlvbmAgaW4gcHJvZCBtb2RlICcgK1xuICAgICAgICAgICAgJ2lzIG5vdCBzdXBwb3J0ZWQgYW5kIGxpa2VseSBhIG1pc3Rha2UuJyxcbiAgICApO1xuICB9XG5cbiAgLy8gVGhlIFJOb2RlIGNhbiBiZSBhIHN0YW5kYXJkIEhUTUxFbGVtZW50IChub3QgYW4gQW5ndWxhciBjb21wb25lbnQgb3IgZGlyZWN0aXZlKVxuICAvLyBUaGUgZGV2dG9vbHMgY29tcG9uZW50IHRyZWUgb25seSBkaXNwbGF5cyBBbmd1bGFyIGNvbXBvbmVudHMgJiBkaXJlY3RpdmVzXG4gIC8vIFRoZXJlZm9yZSB3ZSBhdHRhY2ggdGhlIGRlYnVnIGluZm8gdG8gdGhlIGNsb3Nlc3QgY29tcG9uZW50L2RpcmVjdGl2ZVxuICB3aGlsZSAobm9kZSAmJiAhZ2V0Q29tcG9uZW50KG5vZGUgYXMgRWxlbWVudCkpIHtcbiAgICBub2RlID0gbm9kZT8ucGFyZW50Tm9kZSBhcyBSTm9kZTtcbiAgfVxuXG4gIGlmIChub2RlKSB7XG4gICAgcGF0Y2hIeWRyYXRpb25JbmZvKG5vZGUsIHtcbiAgICAgIHN0YXR1czogSHlkcmF0aW9uU3RhdHVzLk1pc21hdGNoZWQsXG4gICAgICBleHBlY3RlZE5vZGVEZXRhaWxzLFxuICAgICAgYWN0dWFsTm9kZURldGFpbHMsXG4gICAgfSk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzUk5vZGVDbGFpbWVkRm9ySHlkcmF0aW9uKG5vZGU6IFJOb2RlKTogYm9vbGVhbiB7XG4gIHJldHVybiByZWFkSHlkcmF0aW9uSW5mbyhub2RlKT8uc3RhdHVzID09PSBIeWRyYXRpb25TdGF0dXMuSHlkcmF0ZWQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRTZWdtZW50SGVhZChcbiAgICBoeWRyYXRpb25JbmZvOiBEZWh5ZHJhdGVkVmlldyxcbiAgICBpbmRleDogbnVtYmVyLFxuICAgIG5vZGU6IFJOb2RlfG51bGwsXG4gICAgKTogdm9pZCB7XG4gIGh5ZHJhdGlvbkluZm8uc2VnbWVudEhlYWRzID8/PSB7fTtcbiAgaHlkcmF0aW9uSW5mby5zZWdtZW50SGVhZHNbaW5kZXhdID0gbm9kZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFNlZ21lbnRIZWFkKGh5ZHJhdGlvbkluZm86IERlaHlkcmF0ZWRWaWV3LCBpbmRleDogbnVtYmVyKTogUk5vZGV8bnVsbCB7XG4gIHJldHVybiBoeWRyYXRpb25JbmZvLnNlZ21lbnRIZWFkcz8uW2luZGV4XSA/PyBudWxsO1xufVxuXG4vKipcbiAqIFJldHVybnMgdGhlIHNpemUgb2YgYW4gPG5nLWNvbnRhaW5lcj4sIHVzaW5nIGVpdGhlciB0aGUgaW5mb3JtYXRpb25cbiAqIHNlcmlhbGl6ZWQgaW4gYEVMRU1FTlRfQ09OVEFJTkVSU2AgKGVsZW1lbnQgY29udGFpbmVyIHNpemUpIG9yIGJ5XG4gKiBjb21wdXRpbmcgdGhlIHN1bSBvZiByb290IG5vZGVzIGluIGFsbCBkZWh5ZHJhdGVkIHZpZXdzIGluIGEgZ2l2ZW5cbiAqIGNvbnRhaW5lciAoaW4gY2FzZSB0aGlzIGA8bmctY29udGFpbmVyPmAgd2FzIGFsc28gdXNlZCBhcyBhIHZpZXdcbiAqIGNvbnRhaW5lciBob3N0IG5vZGUsIGUuZy4gPG5nLWNvbnRhaW5lciAqbmdJZj4pLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0TmdDb250YWluZXJTaXplKGh5ZHJhdGlvbkluZm86IERlaHlkcmF0ZWRWaWV3LCBpbmRleDogbnVtYmVyKTogbnVtYmVyfG51bGwge1xuICBjb25zdCBkYXRhID0gaHlkcmF0aW9uSW5mby5kYXRhO1xuICBsZXQgc2l6ZSA9IGRhdGFbRUxFTUVOVF9DT05UQUlORVJTXT8uW2luZGV4XSA/PyBudWxsO1xuICAvLyBJZiB0aGVyZSBpcyBubyBzZXJpYWxpemVkIGluZm9ybWF0aW9uIGF2YWlsYWJsZSBpbiB0aGUgYEVMRU1FTlRfQ09OVEFJTkVSU2Agc2xvdCxcbiAgLy8gY2hlY2sgaWYgd2UgaGF2ZSBpbmZvIGFib3V0IHZpZXcgY29udGFpbmVycyBhdCB0aGlzIGxvY2F0aW9uIChlLmcuXG4gIC8vIGA8bmctY29udGFpbmVyICpuZ0lmPmApIGFuZCB1c2UgY29udGFpbmVyIHNpemUgYXMgYSBudW1iZXIgb2Ygcm9vdCBub2RlcyBpbiB0aGlzXG4gIC8vIGVsZW1lbnQgY29udGFpbmVyLlxuICBpZiAoc2l6ZSA9PT0gbnVsbCAmJiBkYXRhW0NPTlRBSU5FUlNdPy5baW5kZXhdKSB7XG4gICAgc2l6ZSA9IGNhbGNTZXJpYWxpemVkQ29udGFpbmVyU2l6ZShoeWRyYXRpb25JbmZvLCBpbmRleCk7XG4gIH1cbiAgcmV0dXJuIHNpemU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc1NlcmlhbGl6ZWRFbGVtZW50Q29udGFpbmVyKFxuICAgIGh5ZHJhdGlvbkluZm86IERlaHlkcmF0ZWRWaWV3LCBpbmRleDogbnVtYmVyKTogYm9vbGVhbiB7XG4gIHJldHVybiBoeWRyYXRpb25JbmZvLmRhdGFbRUxFTUVOVF9DT05UQUlORVJTXT8uW2luZGV4XSAhPT0gdW5kZWZpbmVkO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0U2VyaWFsaXplZENvbnRhaW5lclZpZXdzKFxuICAgIGh5ZHJhdGlvbkluZm86IERlaHlkcmF0ZWRWaWV3LFxuICAgIGluZGV4OiBudW1iZXIsXG4gICAgKTogU2VyaWFsaXplZENvbnRhaW5lclZpZXdbXXxudWxsIHtcbiAgcmV0dXJuIGh5ZHJhdGlvbkluZm8uZGF0YVtDT05UQUlORVJTXT8uW2luZGV4XSA/PyBudWxsO1xufVxuXG4vKipcbiAqIENvbXB1dGVzIHRoZSBzaXplIG9mIGEgc2VyaWFsaXplZCBjb250YWluZXIgKHRoZSBudW1iZXIgb2Ygcm9vdCBub2RlcylcbiAqIGJ5IGNhbGN1bGF0aW5nIHRoZSBzdW0gb2Ygcm9vdCBub2RlcyBpbiBhbGwgZGVoeWRyYXRlZCB2aWV3cyBpbiB0aGlzIGNvbnRhaW5lci5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNhbGNTZXJpYWxpemVkQ29udGFpbmVyU2l6ZShoeWRyYXRpb25JbmZvOiBEZWh5ZHJhdGVkVmlldywgaW5kZXg6IG51bWJlcik6IG51bWJlciB7XG4gIGNvbnN0IHZpZXdzID0gZ2V0U2VyaWFsaXplZENvbnRhaW5lclZpZXdzKGh5ZHJhdGlvbkluZm8sIGluZGV4KSA/PyBbXTtcbiAgbGV0IG51bU5vZGVzID0gMDtcbiAgZm9yIChsZXQgdmlldyBvZiB2aWV3cykge1xuICAgIG51bU5vZGVzICs9IHZpZXdbTlVNX1JPT1RfTk9ERVNdICogKHZpZXdbTVVMVElQTElFUl0gPz8gMSk7XG4gIH1cbiAgcmV0dXJuIG51bU5vZGVzO1xufVxuXG4vKipcbiAqIEF0dGVtcHQgdG8gaW5pdGlhbGl6ZSB0aGUgYGRpc2Nvbm5lY3RlZE5vZGVzYCBmaWVsZCBvZiB0aGUgZ2l2ZW5cbiAqIGBEZWh5ZHJhdGVkVmlld2AuIFJldHVybnMgdGhlIGluaXRpYWxpemVkIHZhbHVlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gaW5pdERpc2Nvbm5lY3RlZE5vZGVzKGh5ZHJhdGlvbkluZm86IERlaHlkcmF0ZWRWaWV3KTogU2V0PG51bWJlcj58bnVsbCB7XG4gIC8vIENoZWNrIGlmIHdlIGFyZSBwcm9jZXNzaW5nIGRpc2Nvbm5lY3RlZCBpbmZvIGZvciB0aGUgZmlyc3QgdGltZS5cbiAgaWYgKHR5cGVvZiBoeWRyYXRpb25JbmZvLmRpc2Nvbm5lY3RlZE5vZGVzID09PSAndW5kZWZpbmVkJykge1xuICAgIGNvbnN0IG5vZGVJZHMgPSBoeWRyYXRpb25JbmZvLmRhdGFbRElTQ09OTkVDVEVEX05PREVTXTtcbiAgICBoeWRyYXRpb25JbmZvLmRpc2Nvbm5lY3RlZE5vZGVzID0gbm9kZUlkcyA/IG5ldyBTZXQobm9kZUlkcykgOiBudWxsO1xuICB9XG4gIHJldHVybiBoeWRyYXRpb25JbmZvLmRpc2Nvbm5lY3RlZE5vZGVzO1xufVxuXG4vKipcbiAqIENoZWNrcyB3aGV0aGVyIGEgbm9kZSBpcyBhbm5vdGF0ZWQgYXMgXCJkaXNjb25uZWN0ZWRcIiwgaS5lLiBub3QgcHJlc2VudFxuICogaW4gdGhlIERPTSBhdCBzZXJpYWxpemF0aW9uIHRpbWUuIFdlIHNob3VsZCBub3QgYXR0ZW1wdCBoeWRyYXRpb24gZm9yXG4gKiBzdWNoIG5vZGVzIGFuZCBpbnN0ZWFkLCB1c2UgYSByZWd1bGFyIFwiY3JlYXRpb24gbW9kZVwiLlxuICovXG5leHBvcnQgZnVuY3Rpb24gaXNEaXNjb25uZWN0ZWROb2RlKGh5ZHJhdGlvbkluZm86IERlaHlkcmF0ZWRWaWV3LCBpbmRleDogbnVtYmVyKTogYm9vbGVhbiB7XG4gIC8vIENoZWNrIGlmIHdlIGFyZSBwcm9jZXNzaW5nIGRpc2Nvbm5lY3RlZCBpbmZvIGZvciB0aGUgZmlyc3QgdGltZS5cbiAgaWYgKHR5cGVvZiBoeWRyYXRpb25JbmZvLmRpc2Nvbm5lY3RlZE5vZGVzID09PSAndW5kZWZpbmVkJykge1xuICAgIGNvbnN0IG5vZGVJZHMgPSBoeWRyYXRpb25JbmZvLmRhdGFbRElTQ09OTkVDVEVEX05PREVTXTtcbiAgICBoeWRyYXRpb25JbmZvLmRpc2Nvbm5lY3RlZE5vZGVzID0gbm9kZUlkcyA/IG5ldyBTZXQobm9kZUlkcykgOiBudWxsO1xuICB9XG4gIHJldHVybiAhIWluaXREaXNjb25uZWN0ZWROb2RlcyhoeWRyYXRpb25JbmZvKT8uaGFzKGluZGV4KTtcbn1cblxuLyoqXG4gKiBIZWxwZXIgZnVuY3Rpb24gdG8gcHJlcGFyZSB0ZXh0IG5vZGVzIGZvciBzZXJpYWxpemF0aW9uIGJ5IGVuc3VyaW5nXG4gKiB0aGF0IHNlcGVyYXRlIGxvZ2ljYWwgdGV4dCBibG9ja3MgaW4gdGhlIERPTSByZW1haW4gc2VwYXJhdGUgYWZ0ZXJcbiAqIHNlcmlhbGl6YXRpb24uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwcm9jZXNzVGV4dE5vZGVCZWZvcmVTZXJpYWxpemF0aW9uKGNvbnRleHQ6IEh5ZHJhdGlvbkNvbnRleHQsIG5vZGU6IFJOb2RlKSB7XG4gIC8vIEhhbmRsZSBjYXNlcyB3aGVyZSB0ZXh0IG5vZGVzIGNhbiBiZSBsb3N0IGFmdGVyIERPTSBzZXJpYWxpemF0aW9uOlxuICAvLyAgMS4gV2hlbiB0aGVyZSBpcyBhbiAqZW1wdHkgdGV4dCBub2RlKiBpbiBET006IGluIHRoaXMgY2FzZSwgdGhpc1xuICAvLyAgICAgbm9kZSB3b3VsZCBub3QgbWFrZSBpdCBpbnRvIHRoZSBzZXJpYWxpemVkIHN0cmluZyBhbmQgYXMgYSByZXN1bHQsXG4gIC8vICAgICB0aGlzIG5vZGUgd291bGRuJ3QgYmUgY3JlYXRlZCBpbiBhIGJyb3dzZXIuIFRoaXMgd291bGQgcmVzdWx0IGluXG4gIC8vICAgICBhIG1pc21hdGNoIGR1cmluZyB0aGUgaHlkcmF0aW9uLCB3aGVyZSB0aGUgcnVudGltZSBsb2dpYyB3b3VsZCBleHBlY3RcbiAgLy8gICAgIGEgdGV4dCBub2RlIHRvIGJlIHByZXNlbnQgaW4gbGl2ZSBET00sIGJ1dCBubyB0ZXh0IG5vZGUgd291bGQgZXhpc3QuXG4gIC8vICAgICBFeGFtcGxlOiBgPHNwYW4+e3sgbmFtZSB9fTwvc3Bhbj5gIHdoZW4gdGhlIGBuYW1lYCBpcyBhbiBlbXB0eSBzdHJpbmcuXG4gIC8vICAgICBUaGlzIHdvdWxkIHJlc3VsdCBpbiBgPHNwYW4+PC9zcGFuPmAgc3RyaW5nIGFmdGVyIHNlcmlhbGl6YXRpb24gYW5kXG4gIC8vICAgICBpbiBhIGJyb3dzZXIgb25seSB0aGUgYHNwYW5gIGVsZW1lbnQgd291bGQgYmUgY3JlYXRlZC4gVG8gcmVzb2x2ZSB0aGF0LFxuICAvLyAgICAgYW4gZXh0cmEgY29tbWVudCBub2RlIGlzIGFwcGVuZGVkIGluIHBsYWNlIG9mIGFuIGVtcHR5IHRleHQgbm9kZSBhbmRcbiAgLy8gICAgIHRoYXQgc3BlY2lhbCBjb21tZW50IG5vZGUgaXMgcmVwbGFjZWQgd2l0aCBhbiBlbXB0eSB0ZXh0IG5vZGUgKmJlZm9yZSpcbiAgLy8gICAgIGh5ZHJhdGlvbi5cbiAgLy8gIDIuIFdoZW4gdGhlcmUgYXJlIDIgY29uc2VjdXRpdmUgdGV4dCBub2RlcyBwcmVzZW50IGluIHRoZSBET00uXG4gIC8vICAgICBFeGFtcGxlOiBgPGRpdj5IZWxsbyA8bmctY29udGFpbmVyICpuZ0lmPVwidHJ1ZVwiPndvcmxkPC9uZy1jb250YWluZXI+PC9kaXY+YC5cbiAgLy8gICAgIEluIHRoaXMgc2NlbmFyaW8sIHRoZSBsaXZlIERPTSB3b3VsZCBsb29rIGxpa2UgdGhpczpcbiAgLy8gICAgICAgPGRpdj4jdGV4dCgnSGVsbG8gJykgI3RleHQoJ3dvcmxkJykgI2NvbW1lbnQoJ2NvbnRhaW5lcicpPC9kaXY+XG4gIC8vICAgICBTZXJpYWxpemVkIHN0cmluZyB3b3VsZCBsb29rIGxpa2UgdGhpczogYDxkaXY+SGVsbG8gd29ybGQ8IS0tY29udGFpbmVyLS0+PC9kaXY+YC5cbiAgLy8gICAgIFRoZSBsaXZlIERPTSBpbiBhIGJyb3dzZXIgYWZ0ZXIgdGhhdCB3b3VsZCBiZTpcbiAgLy8gICAgICAgPGRpdj4jdGV4dCgnSGVsbG8gd29ybGQnKSAjY29tbWVudCgnY29udGFpbmVyJyk8L2Rpdj5cbiAgLy8gICAgIE5vdGljZSBob3cgMiB0ZXh0IG5vZGVzIGFyZSBub3cgXCJtZXJnZWRcIiBpbnRvIG9uZS4gVGhpcyB3b3VsZCBjYXVzZSBoeWRyYXRpb25cbiAgLy8gICAgIGxvZ2ljIHRvIGZhaWwsIHNpbmNlIGl0J2QgZXhwZWN0IDIgdGV4dCBub2RlcyBiZWluZyBwcmVzZW50LCBub3Qgb25lLlxuICAvLyAgICAgVG8gZml4IHRoaXMsIHdlIGluc2VydCBhIHNwZWNpYWwgY29tbWVudCBub2RlIGluIGJldHdlZW4gdGhvc2UgdGV4dCBub2Rlcywgc29cbiAgLy8gICAgIHNlcmlhbGl6ZWQgcmVwcmVzZW50YXRpb24gaXM6IGA8ZGl2PkhlbGxvIDwhLS1uZ3Rucy0tPndvcmxkPCEtLWNvbnRhaW5lci0tPjwvZGl2PmAuXG4gIC8vICAgICBUaGlzIGZvcmNlcyBicm93c2VyIHRvIGNyZWF0ZSAyIHRleHQgbm9kZXMgc2VwYXJhdGVkIGJ5IGEgY29tbWVudCBub2RlLlxuICAvLyAgICAgQmVmb3JlIHJ1bm5pbmcgYSBoeWRyYXRpb24gcHJvY2VzcywgdGhpcyBzcGVjaWFsIGNvbW1lbnQgbm9kZSBpcyByZW1vdmVkLCBzbyB0aGVcbiAgLy8gICAgIGxpdmUgRE9NIGhhcyBleGFjdGx5IHRoZSBzYW1lIHN0YXRlIGFzIGl0IHdhcyBiZWZvcmUgc2VyaWFsaXphdGlvbi5cblxuICAvLyBDb2xsZWN0IHRoaXMgbm9kZSBhcyByZXF1aXJlZCBzcGVjaWFsIGFubm90YXRpb24gb25seSB3aGVuIGl0c1xuICAvLyBjb250ZW50cyBpcyBlbXB0eS4gT3RoZXJ3aXNlLCBzdWNoIHRleHQgbm9kZSB3b3VsZCBiZSBwcmVzZW50IG9uXG4gIC8vIHRoZSBjbGllbnQgYWZ0ZXIgc2VydmVyLXNpZGUgcmVuZGVyaW5nIGFuZCBubyBzcGVjaWFsIGhhbmRsaW5nIG5lZWRlZC5cbiAgY29uc3QgZWwgPSBub2RlIGFzIEhUTUxFbGVtZW50O1xuICBjb25zdCBjb3JydXB0ZWRUZXh0Tm9kZXMgPSBjb250ZXh0LmNvcnJ1cHRlZFRleHROb2RlcztcbiAgaWYgKGVsLnRleHRDb250ZW50ID09PSAnJykge1xuICAgIGNvcnJ1cHRlZFRleHROb2Rlcy5zZXQoZWwsIFRleHROb2RlTWFya2VyLkVtcHR5Tm9kZSk7XG4gIH0gZWxzZSBpZiAoZWwubmV4dFNpYmxpbmc/Lm5vZGVUeXBlID09PSBOb2RlLlRFWFRfTk9ERSkge1xuICAgIGNvcnJ1cHRlZFRleHROb2Rlcy5zZXQoZWwsIFRleHROb2RlTWFya2VyLlNlcGFyYXRvcik7XG4gIH1cbn1cbiJdfQ==