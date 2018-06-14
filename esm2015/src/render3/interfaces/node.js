/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/** @enum {number} */
const TNodeType = {
    Container: 0,
    Projection: 1,
    View: 2,
    Element: 3,
    ViewOrElement: 2,
};
export { TNodeType };
/** @enum {number} */
const TNodeFlags = {
    /** The number of directives on this node is encoded on the least significant bits */
    DirectiveCountMask: 4095,
    /** Then this bit is set when the node is a component */
    isComponent: 4096,
    /** The index of the first directive on this node is encoded on the most significant bits  */
    DirectiveStartingIndexShift: 13,
};
export { TNodeFlags };
/**
 * LNode is an internal data structure which is used for the incremental DOM algorithm.
 * The "L" stands for "Logical" to differentiate between `RNodes` (actual rendered DOM
 * node) and our logical representation of DOM nodes, `LNodes`.
 *
 * The data structure is optimized for speed and size.
 *
 * In order to be fast, all subtypes of `LNode` should have the same shape.
 * Because size of the `LNode` matters, many fields have multiple roles depending
 * on the `LNode` subtype.
 *
 * See: https://en.wikipedia.org/wiki/Inline_caching#Monomorphic_inline_caching
 *
 * NOTE: This is a private data structure and should not be exported by any of the
 * instructions.
 * @record
 */
export function LNode() { }
function LNode_tsickle_Closure_declarations() {
    /**
     * The associated DOM node. Storing this allows us to:
     *  - append children to their element parents in the DOM (e.g. `parent.native.appendChild(...)`)
     *  - retrieve the sibling elements of text nodes whose creation / insertion has been delayed
     * @type {?}
     */
    LNode.prototype.native;
    /**
     * If regular LElementNode, then `data` will be null.
     * If LElementNode with component, then `data` contains LView.
     * If LViewNode, then `data` contains the LView.
     * If LContainerNode, then `data` contains LContainer.
     * If LProjectionNode, then `data` contains LProjection.
     * @type {?}
     */
    LNode.prototype.data;
    /**
     * Each node belongs to a view.
     *
     * When the injector is walking up a tree, it needs access to the `directives` (part of view).
     * @type {?}
     */
    LNode.prototype.view;
    /**
     * The injector associated with this node. Necessary for DI.
     * @type {?}
     */
    LNode.prototype.nodeInjector;
    /**
     * Optional set of queries that track query-related events for this node.
     *
     * If present the node creation/updates are reported to the `LQueries`.
     * @type {?}
     */
    LNode.prototype.queries;
    /**
     * If this node is projected, pointer to the next node in the same projection parent
     * (which is a container, an element, or a text node), or to the parent projection node
     * if this is the last node in the projection.
     * If this node is not projected, this field is null.
     * @type {?}
     */
    LNode.prototype.pNextOrParent;
    /**
     * Pointer to the corresponding TNode object, which stores static
     * data about this node.
     * @type {?}
     */
    LNode.prototype.tNode;
    /**
     * A pointer to an LContainerNode created by directives requesting ViewContainerRef
     * @type {?}
     */
    LNode.prototype.dynamicLContainerNode;
}
/**
 * LNode representing an element.
 * @record
 */
export function LElementNode() { }
function LElementNode_tsickle_Closure_declarations() {
    /**
     * The DOM element associated with this node.
     * @type {?}
     */
    LElementNode.prototype.native;
    /**
     * If Component then data has LView (light DOM)
     * @type {?}
     */
    LElementNode.prototype.data;
}
/**
 * LNode representing a #text node.
 * @record
 */
export function LTextNode() { }
function LTextNode_tsickle_Closure_declarations() {
    /**
     * The text node associated with this node.
     * @type {?}
     */
    LTextNode.prototype.native;
    /** @type {?} */
    LTextNode.prototype.data;
    /** @type {?} */
    LTextNode.prototype.dynamicLContainerNode;
}
/**
 * Abstract node which contains root nodes of a view.
 * @record
 */
export function LViewNode() { }
function LViewNode_tsickle_Closure_declarations() {
    /** @type {?} */
    LViewNode.prototype.native;
    /** @type {?} */
    LViewNode.prototype.data;
    /** @type {?} */
    LViewNode.prototype.dynamicLContainerNode;
}
/**
 * Abstract node container which contains other views.
 * @record
 */
export function LContainerNode() { }
function LContainerNode_tsickle_Closure_declarations() {
    /** @type {?} */
    LContainerNode.prototype.native;
    /** @type {?} */
    LContainerNode.prototype.data;
}
/**
 * @record
 */
export function LProjectionNode() { }
function LProjectionNode_tsickle_Closure_declarations() {
    /** @type {?} */
    LProjectionNode.prototype.native;
    /** @type {?} */
    LProjectionNode.prototype.data;
    /** @type {?} */
    LProjectionNode.prototype.dynamicLContainerNode;
}
/** @enum {number} */
const AttributeMarker = {
    /**
       * Marker indicates that the following 3 values in the attributes array are:
       * namespaceUri, attributeName, attributeValue
       * in that order.
       */
    NamespaceURI: 0,
    /**
       * This marker indicates that the following attribute names were extracted from bindings (ex.:
       * [foo]="exp") and / or event handlers (ex. (bar)="doSth()").
       * Taking the above bindings and outputs as an example an attributes array could look as follows:
       * ['class', 'fade in', AttributeMarker.SelectOnly, 'foo', 'bar']
       */
    SelectOnly: 1,
};
export { AttributeMarker };
/**
 * LNode binding data (flyweight) for a particular node that is shared between all templates
 * of a specific type.
 *
 * If a property is:
 *    - PropertyAliases: that property's data was generated and this is it
 *    - Null: that property's data was already generated and nothing was found.
 *    - Undefined: that property's data has not yet been generated
 *
 * see: https://en.wikipedia.org/wiki/Flyweight_pattern for more on the Flyweight pattern
 * @record
 */
export function TNode() { }
function TNode_tsickle_Closure_declarations() {
    /**
     * The type of the TNode. See TNodeType.
     * @type {?}
     */
    TNode.prototype.type;
    /**
     * Index of the TNode in TView.data and corresponding LNode in LView.data.
     *
     * This is necessary to get from any TNode to its corresponding LNode when
     * traversing the node tree.
     *
     * If index is -1, this is a dynamically created container node or embedded view node.
     * @type {?}
     */
    TNode.prototype.index;
    /**
     * This number stores two values using its bits:
     *
     * - the number of directives on that node (first 12 bits)
     * - the starting index of the node's directives in the directives array (last 20 bits).
     *
     * These two values are necessary so DI can effectively search the directives associated
     * with a node without searching the whole directives array.
     * @type {?}
     */
    TNode.prototype.flags;
    /**
     * The tag name associated with this node.
     * @type {?}
     */
    TNode.prototype.tagName;
    /**
     * Attributes associated with an element. We need to store attributes to support various use-cases
     * (attribute injection, content projection with selectors, directives matching).
     * Attributes are stored statically because reading them from the DOM would be way too slow for
     * content projection and queries.
     *
     * Since attrs will always be calculated first, they will never need to be marked undefined by
     * other instructions.
     *
     * For regular attributes a name of an attribute and its value alternate in the array.
     * e.g. ['role', 'checkbox']
     * This array can contain flags that will indicate "special attributes" (attributes with
     * namespaces, attributes extracted from bindings and outputs).
     * @type {?}
     */
    TNode.prototype.attrs;
    /**
     * A set of local names under which a given element is exported in a template and
     * visible to queries. An entry in this array can be created for different reasons:
     * - an element itself is referenced, ex.: `<div #foo>`
     * - a component is referenced, ex.: `<my-cmpt #foo>`
     * - a directive is referenced, ex.: `<my-cmpt #foo="directiveExportAs">`.
     *
     * A given element might have different local names and those names can be associated
     * with a directive. We store local names at even indexes while odd indexes are reserved
     * for directive index in a view (or `-1` if there is no associated directive).
     *
     * Some examples:
     * - `<div #foo>` => `["foo", -1]`
     * - `<my-cmpt #foo>` => `["foo", myCmptIdx]`
     * - `<my-cmpt #foo #bar="directiveExportAs">` => `["foo", myCmptIdx, "bar", directiveIdx]`
     * - `<div #foo #bar="directiveExportAs">` => `["foo", -1, "bar", directiveIdx]`
     * @type {?}
     */
    TNode.prototype.localNames;
    /**
     * Information about input properties that need to be set once from attribute data.
     * @type {?}
     */
    TNode.prototype.initialInputs;
    /**
     * Input data for all directives on this node.
     *
     * - `undefined` means that the prop has not been initialized yet,
     * - `null` means that the prop has been initialized but no inputs have been found.
     * @type {?}
     */
    TNode.prototype.inputs;
    /**
     * Output data for all directives on this node.
     *
     * - `undefined` means that the prop has not been initialized yet,
     * - `null` means that the prop has been initialized but no outputs have been found.
     * @type {?}
     */
    TNode.prototype.outputs;
    /**
     * The TView or TViews attached to this node.
     *
     * If this TNode corresponds to an LContainerNode with inline views, the container will
     * need to store separate static data for each of its view blocks (TView[]). Otherwise,
     * nodes in inline views with the same index as nodes in their parent views will overwrite
     * each other, as they are in the same template.
     *
     * Each index in this array corresponds to the static data for a certain
     * view. So if you had V(0) and V(1) in a container, you might have:
     *
     * [
     *   [{tagName: 'div', attrs: ...}, null],     // V(0) TView
     *   [{tagName: 'button', attrs ...}, null]    // V(1) TView
     *
     * If this TNode corresponds to an LContainerNode with a template (e.g. structural
     * directive), the template's TView will be stored here.
     *
     * If this TNode corresponds to an LElementNode, tViews will be null .
     * @type {?}
     */
    TNode.prototype.tViews;
    /**
     * The next sibling node. Necessary so we can propagate through the root nodes of a view
     * to insert them or remove them from the DOM.
     * @type {?}
     */
    TNode.prototype.next;
    /**
     * First child of the current node.
     *
     * For component nodes, the child will always be a ContentChild (in same view).
     * For embedded view nodes, the child will be in their child view.
     * @type {?}
     */
    TNode.prototype.child;
    /**
     * Parent node (in the same view only).
     *
     * We need a reference to a node's parent so we can append the node to its parent's native
     * element at the appropriate time.
     *
     * If the parent would be in a different view (e.g. component host), this property will be null.
     * It's important that we don't try to cross component boundaries when retrieving the parent
     * because the parent will change (e.g. index, attrs) depending on where the component was
     * used (and thus shouldn't be stored on TNode). In these cases, we retrieve the parent through
     * LView.node instead (which will be instance-specific).
     *
     * If this is an inline view node (V), the parent will be its container.
     * @type {?}
     */
    TNode.prototype.parent;
    /**
     * A pointer to a TContainerNode created by directives requesting ViewContainerRef
     * @type {?}
     */
    TNode.prototype.dynamicContainerNode;
}
/**
 * Static data for an LElementNode
 * @record
 */
export function TElementNode() { }
function TElementNode_tsickle_Closure_declarations() {
    /**
     * Index in the data[] array
     * @type {?}
     */
    TElementNode.prototype.index;
    /** @type {?} */
    TElementNode.prototype.child;
    /**
     * Element nodes will have parents unless they are the first node of a component or
     * embedded view (which means their parent is in a different view and must be
     * retrieved using LView.node).
     * @type {?}
     */
    TElementNode.prototype.parent;
    /** @type {?} */
    TElementNode.prototype.tViews;
}
/**
 * Static data for an LTextNode
 * @record
 */
export function TTextNode() { }
function TTextNode_tsickle_Closure_declarations() {
    /**
     * Index in the data[] array
     * @type {?}
     */
    TTextNode.prototype.index;
    /** @type {?} */
    TTextNode.prototype.child;
    /**
     * Text nodes will have parents unless they are the first node of a component or
     * embedded view (which means their parent is in a different view and must be
     * retrieved using LView.node).
     * @type {?}
     */
    TTextNode.prototype.parent;
    /** @type {?} */
    TTextNode.prototype.tViews;
}
/**
 * Static data for an LContainerNode
 * @record
 */
export function TContainerNode() { }
function TContainerNode_tsickle_Closure_declarations() {
    /**
     * Index in the data[] array.
     *
     * If it's -1, this is a dynamically created container node that isn't stored in
     * data[] (e.g. when you inject ViewContainerRef) .
     * @type {?}
     */
    TContainerNode.prototype.index;
    /** @type {?} */
    TContainerNode.prototype.child;
    /**
     * Container nodes will have parents unless:
     *
     * - They are the first node of a component or embedded view
     * - They are dynamically created
     * @type {?}
     */
    TContainerNode.prototype.parent;
    /** @type {?} */
    TContainerNode.prototype.tViews;
}
/**
 * Static data for an LViewNode
 * @record
 */
export function TViewNode() { }
function TViewNode_tsickle_Closure_declarations() {
    /**
     * If -1, it's a dynamically created view. Otherwise, it is the view block ID.
     * @type {?}
     */
    TViewNode.prototype.index;
    /** @type {?} */
    TViewNode.prototype.child;
    /** @type {?} */
    TViewNode.prototype.parent;
    /** @type {?} */
    TViewNode.prototype.tViews;
}
/**
 * Static data for an LProjectionNode
 * @record
 */
export function TProjectionNode() { }
function TProjectionNode_tsickle_Closure_declarations() {
    /**
     * Index in the data[] array
     * @type {?}
     */
    TProjectionNode.prototype.child;
    /**
     * Projection nodes will have parents unless they are the first node of a component
     * or embedded view (which means their parent is in a different view and must be
     * retrieved using LView.node).
     * @type {?}
     */
    TProjectionNode.prototype.parent;
    /** @type {?} */
    TProjectionNode.prototype.tViews;
}
// Note: This hack is necessary so we don't erroneously get a circular dependency
// failure based on types.
export const /** @type {?} */ unusedValueExportToPlacateAjd = 1;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9kZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaW50ZXJmYWNlcy9ub2RlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFvZEEsTUFBTSxDQUFDLHVCQUFNLDZCQUE2QixHQUFHLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtMQ29udGFpbmVyfSBmcm9tICcuL2NvbnRhaW5lcic7XG5pbXBvcnQge0xJbmplY3Rvcn0gZnJvbSAnLi9pbmplY3Rvcic7XG5pbXBvcnQge0xQcm9qZWN0aW9ufSBmcm9tICcuL3Byb2plY3Rpb24nO1xuaW1wb3J0IHtMUXVlcmllc30gZnJvbSAnLi9xdWVyeSc7XG5pbXBvcnQge1JDb21tZW50LCBSRWxlbWVudCwgUlRleHR9IGZyb20gJy4vcmVuZGVyZXInO1xuaW1wb3J0IHtMVmlld0RhdGEsIFRWaWV3fSBmcm9tICcuL3ZpZXcnO1xuXG5cblxuLyoqXG4gKiBUTm9kZVR5cGUgY29ycmVzcG9uZHMgdG8gdGhlIFROb2RlLnR5cGUgcHJvcGVydHkuIEl0IGNvbnRhaW5zIGluZm9ybWF0aW9uXG4gKiBvbiBob3cgdG8gbWFwIGEgcGFydGljdWxhciBzZXQgb2YgYml0cyBpbiBMTm9kZS5mbGFncyB0byB0aGUgbm9kZSB0eXBlLlxuICovXG5leHBvcnQgY29uc3QgZW51bSBUTm9kZVR5cGUge1xuICBDb250YWluZXIgPSAwYjAwLFxuICBQcm9qZWN0aW9uID0gMGIwMSxcbiAgVmlldyA9IDBiMTAsXG4gIEVsZW1lbnQgPSAwYjExLFxuICBWaWV3T3JFbGVtZW50ID0gMGIxMCxcbn1cblxuLyoqXG4gKiBDb3JyZXNwb25kcyB0byB0aGUgVE5vZGUuZmxhZ3MgcHJvcGVydHkuXG4gKi9cbmV4cG9ydCBjb25zdCBlbnVtIFROb2RlRmxhZ3Mge1xuICAvKiogVGhlIG51bWJlciBvZiBkaXJlY3RpdmVzIG9uIHRoaXMgbm9kZSBpcyBlbmNvZGVkIG9uIHRoZSBsZWFzdCBzaWduaWZpY2FudCBiaXRzICovXG4gIERpcmVjdGl2ZUNvdW50TWFzayA9IDBiMDAwMDAwMDAwMDAwMDAwMDAwMDAxMTExMTExMTExMTEsXG5cbiAgLyoqIFRoZW4gdGhpcyBiaXQgaXMgc2V0IHdoZW4gdGhlIG5vZGUgaXMgYSBjb21wb25lbnQgKi9cbiAgaXNDb21wb25lbnQgPSAwYjEwMDAwMDAwMDAwMDAsXG5cbiAgLyoqIFRoZSBpbmRleCBvZiB0aGUgZmlyc3QgZGlyZWN0aXZlIG9uIHRoaXMgbm9kZSBpcyBlbmNvZGVkIG9uIHRoZSBtb3N0IHNpZ25pZmljYW50IGJpdHMgICovXG4gIERpcmVjdGl2ZVN0YXJ0aW5nSW5kZXhTaGlmdCA9IDEzLFxufVxuXG4vKipcbiAqIExOb2RlIGlzIGFuIGludGVybmFsIGRhdGEgc3RydWN0dXJlIHdoaWNoIGlzIHVzZWQgZm9yIHRoZSBpbmNyZW1lbnRhbCBET00gYWxnb3JpdGhtLlxuICogVGhlIFwiTFwiIHN0YW5kcyBmb3IgXCJMb2dpY2FsXCIgdG8gZGlmZmVyZW50aWF0ZSBiZXR3ZWVuIGBSTm9kZXNgIChhY3R1YWwgcmVuZGVyZWQgRE9NXG4gKiBub2RlKSBhbmQgb3VyIGxvZ2ljYWwgcmVwcmVzZW50YXRpb24gb2YgRE9NIG5vZGVzLCBgTE5vZGVzYC5cbiAqXG4gKiBUaGUgZGF0YSBzdHJ1Y3R1cmUgaXMgb3B0aW1pemVkIGZvciBzcGVlZCBhbmQgc2l6ZS5cbiAqXG4gKiBJbiBvcmRlciB0byBiZSBmYXN0LCBhbGwgc3VidHlwZXMgb2YgYExOb2RlYCBzaG91bGQgaGF2ZSB0aGUgc2FtZSBzaGFwZS5cbiAqIEJlY2F1c2Ugc2l6ZSBvZiB0aGUgYExOb2RlYCBtYXR0ZXJzLCBtYW55IGZpZWxkcyBoYXZlIG11bHRpcGxlIHJvbGVzIGRlcGVuZGluZ1xuICogb24gdGhlIGBMTm9kZWAgc3VidHlwZS5cbiAqXG4gKiBTZWU6IGh0dHBzOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0lubGluZV9jYWNoaW5nI01vbm9tb3JwaGljX2lubGluZV9jYWNoaW5nXG4gKlxuICogTk9URTogVGhpcyBpcyBhIHByaXZhdGUgZGF0YSBzdHJ1Y3R1cmUgYW5kIHNob3VsZCBub3QgYmUgZXhwb3J0ZWQgYnkgYW55IG9mIHRoZVxuICogaW5zdHJ1Y3Rpb25zLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIExOb2RlIHtcbiAgLyoqXG4gICAqIFRoZSBhc3NvY2lhdGVkIERPTSBub2RlLiBTdG9yaW5nIHRoaXMgYWxsb3dzIHVzIHRvOlxuICAgKiAgLSBhcHBlbmQgY2hpbGRyZW4gdG8gdGhlaXIgZWxlbWVudCBwYXJlbnRzIGluIHRoZSBET00gKGUuZy4gYHBhcmVudC5uYXRpdmUuYXBwZW5kQ2hpbGQoLi4uKWApXG4gICAqICAtIHJldHJpZXZlIHRoZSBzaWJsaW5nIGVsZW1lbnRzIG9mIHRleHQgbm9kZXMgd2hvc2UgY3JlYXRpb24gLyBpbnNlcnRpb24gaGFzIGJlZW4gZGVsYXllZFxuICAgKi9cbiAgcmVhZG9ubHkgbmF0aXZlOiBSQ29tbWVudHxSRWxlbWVudHxSVGV4dHxudWxsO1xuXG4gIC8qKlxuICAgKiBJZiByZWd1bGFyIExFbGVtZW50Tm9kZSwgdGhlbiBgZGF0YWAgd2lsbCBiZSBudWxsLlxuICAgKiBJZiBMRWxlbWVudE5vZGUgd2l0aCBjb21wb25lbnQsIHRoZW4gYGRhdGFgIGNvbnRhaW5zIExWaWV3LlxuICAgKiBJZiBMVmlld05vZGUsIHRoZW4gYGRhdGFgIGNvbnRhaW5zIHRoZSBMVmlldy5cbiAgICogSWYgTENvbnRhaW5lck5vZGUsIHRoZW4gYGRhdGFgIGNvbnRhaW5zIExDb250YWluZXIuXG4gICAqIElmIExQcm9qZWN0aW9uTm9kZSwgdGhlbiBgZGF0YWAgY29udGFpbnMgTFByb2plY3Rpb24uXG4gICAqL1xuICByZWFkb25seSBkYXRhOiBMVmlld0RhdGF8TENvbnRhaW5lcnxMUHJvamVjdGlvbnxudWxsO1xuXG5cbiAgLyoqXG4gICAqIEVhY2ggbm9kZSBiZWxvbmdzIHRvIGEgdmlldy5cbiAgICpcbiAgICogV2hlbiB0aGUgaW5qZWN0b3IgaXMgd2Fsa2luZyB1cCBhIHRyZWUsIGl0IG5lZWRzIGFjY2VzcyB0byB0aGUgYGRpcmVjdGl2ZXNgIChwYXJ0IG9mIHZpZXcpLlxuICAgKi9cbiAgcmVhZG9ubHkgdmlldzogTFZpZXdEYXRhO1xuXG4gIC8qKiBUaGUgaW5qZWN0b3IgYXNzb2NpYXRlZCB3aXRoIHRoaXMgbm9kZS4gTmVjZXNzYXJ5IGZvciBESS4gKi9cbiAgbm9kZUluamVjdG9yOiBMSW5qZWN0b3J8bnVsbDtcblxuICAvKipcbiAgICogT3B0aW9uYWwgc2V0IG9mIHF1ZXJpZXMgdGhhdCB0cmFjayBxdWVyeS1yZWxhdGVkIGV2ZW50cyBmb3IgdGhpcyBub2RlLlxuICAgKlxuICAgKiBJZiBwcmVzZW50IHRoZSBub2RlIGNyZWF0aW9uL3VwZGF0ZXMgYXJlIHJlcG9ydGVkIHRvIHRoZSBgTFF1ZXJpZXNgLlxuICAgKi9cbiAgcXVlcmllczogTFF1ZXJpZXN8bnVsbDtcblxuICAvKipcbiAgICogSWYgdGhpcyBub2RlIGlzIHByb2plY3RlZCwgcG9pbnRlciB0byB0aGUgbmV4dCBub2RlIGluIHRoZSBzYW1lIHByb2plY3Rpb24gcGFyZW50XG4gICAqICh3aGljaCBpcyBhIGNvbnRhaW5lciwgYW4gZWxlbWVudCwgb3IgYSB0ZXh0IG5vZGUpLCBvciB0byB0aGUgcGFyZW50IHByb2plY3Rpb24gbm9kZVxuICAgKiBpZiB0aGlzIGlzIHRoZSBsYXN0IG5vZGUgaW4gdGhlIHByb2plY3Rpb24uXG4gICAqIElmIHRoaXMgbm9kZSBpcyBub3QgcHJvamVjdGVkLCB0aGlzIGZpZWxkIGlzIG51bGwuXG4gICAqL1xuICBwTmV4dE9yUGFyZW50OiBMTm9kZXxudWxsO1xuXG4gIC8qKlxuICAgKiBQb2ludGVyIHRvIHRoZSBjb3JyZXNwb25kaW5nIFROb2RlIG9iamVjdCwgd2hpY2ggc3RvcmVzIHN0YXRpY1xuICAgKiBkYXRhIGFib3V0IHRoaXMgbm9kZS5cbiAgICovXG4gIHROb2RlOiBUTm9kZTtcblxuICAvKipcbiAgICogQSBwb2ludGVyIHRvIGFuIExDb250YWluZXJOb2RlIGNyZWF0ZWQgYnkgZGlyZWN0aXZlcyByZXF1ZXN0aW5nIFZpZXdDb250YWluZXJSZWZcbiAgICovXG4gIC8vIFRPRE8oa2FyYSk6IFJlbW92ZSB3aGVuIHJlbW92aW5nIExOb2Rlc1xuICBkeW5hbWljTENvbnRhaW5lck5vZGU6IExDb250YWluZXJOb2RlfG51bGw7XG59XG5cblxuLyoqIExOb2RlIHJlcHJlc2VudGluZyBhbiBlbGVtZW50LiAqL1xuZXhwb3J0IGludGVyZmFjZSBMRWxlbWVudE5vZGUgZXh0ZW5kcyBMTm9kZSB7XG4gIC8qKiBUaGUgRE9NIGVsZW1lbnQgYXNzb2NpYXRlZCB3aXRoIHRoaXMgbm9kZS4gKi9cbiAgcmVhZG9ubHkgbmF0aXZlOiBSRWxlbWVudDtcblxuICAvKiogSWYgQ29tcG9uZW50IHRoZW4gZGF0YSBoYXMgTFZpZXcgKGxpZ2h0IERPTSkgKi9cbiAgcmVhZG9ubHkgZGF0YTogTFZpZXdEYXRhfG51bGw7XG59XG5cbi8qKiBMTm9kZSByZXByZXNlbnRpbmcgYSAjdGV4dCBub2RlLiAqL1xuZXhwb3J0IGludGVyZmFjZSBMVGV4dE5vZGUgZXh0ZW5kcyBMTm9kZSB7XG4gIC8qKiBUaGUgdGV4dCBub2RlIGFzc29jaWF0ZWQgd2l0aCB0aGlzIG5vZGUuICovXG4gIG5hdGl2ZTogUlRleHQ7XG4gIHJlYWRvbmx5IGRhdGE6IG51bGw7XG4gIGR5bmFtaWNMQ29udGFpbmVyTm9kZTogbnVsbDtcbn1cblxuLyoqIEFic3RyYWN0IG5vZGUgd2hpY2ggY29udGFpbnMgcm9vdCBub2RlcyBvZiBhIHZpZXcuICovXG5leHBvcnQgaW50ZXJmYWNlIExWaWV3Tm9kZSBleHRlbmRzIExOb2RlIHtcbiAgcmVhZG9ubHkgbmF0aXZlOiBudWxsO1xuICByZWFkb25seSBkYXRhOiBMVmlld0RhdGE7XG4gIGR5bmFtaWNMQ29udGFpbmVyTm9kZTogbnVsbDtcbn1cblxuLyoqIEFic3RyYWN0IG5vZGUgY29udGFpbmVyIHdoaWNoIGNvbnRhaW5zIG90aGVyIHZpZXdzLiAqL1xuZXhwb3J0IGludGVyZmFjZSBMQ29udGFpbmVyTm9kZSBleHRlbmRzIExOb2RlIHtcbiAgLypcbiAgICogVGhpcyBjb21tZW50IG5vZGUgaXMgYXBwZW5kZWQgdG8gdGhlIGNvbnRhaW5lcidzIHBhcmVudCBlbGVtZW50IHRvIG1hcmsgd2hlcmVcbiAgICogaW4gdGhlIERPTSB0aGUgY29udGFpbmVyJ3MgY2hpbGQgdmlld3Mgc2hvdWxkIGJlIGFkZGVkLlxuICAgKlxuICAgKiBJZiB0aGUgY29udGFpbmVyIGlzIGEgcm9vdCBub2RlIG9mIGEgdmlldywgdGhpcyBjb21tZW50IHdpbGwgbm90IGJlIGFwcGVuZGVkXG4gICAqIHVudGlsIHRoZSBwYXJlbnQgdmlldyBpcyBwcm9jZXNzZWQuXG4gICAqL1xuICBuYXRpdmU6IFJDb21tZW50O1xuICByZWFkb25seSBkYXRhOiBMQ29udGFpbmVyO1xufVxuXG5cbmV4cG9ydCBpbnRlcmZhY2UgTFByb2plY3Rpb25Ob2RlIGV4dGVuZHMgTE5vZGUge1xuICByZWFkb25seSBuYXRpdmU6IG51bGw7XG4gIHJlYWRvbmx5IGRhdGE6IExQcm9qZWN0aW9uO1xuICBkeW5hbWljTENvbnRhaW5lck5vZGU6IG51bGw7XG59XG5cbi8qKlxuICogQSBzZXQgb2YgbWFya2VyIHZhbHVlcyB0byBiZSB1c2VkIGluIHRoZSBhdHRyaWJ1dGVzIGFycmF5cy4gVGhvc2UgbWFya2VycyBpbmRpY2F0ZSB0aGF0IHNvbWVcbiAqIGl0ZW1zIGFyZSBub3QgcmVndWxhciBhdHRyaWJ1dGVzIGFuZCB0aGUgcHJvY2Vzc2luZyBzaG91bGQgYmUgYWRhcHRlZCBhY2NvcmRpbmdseS5cbiAqL1xuZXhwb3J0IGNvbnN0IGVudW0gQXR0cmlidXRlTWFya2VyIHtcbiAgLyoqXG4gICAqIE1hcmtlciBpbmRpY2F0ZXMgdGhhdCB0aGUgZm9sbG93aW5nIDMgdmFsdWVzIGluIHRoZSBhdHRyaWJ1dGVzIGFycmF5IGFyZTpcbiAgICogbmFtZXNwYWNlVXJpLCBhdHRyaWJ1dGVOYW1lLCBhdHRyaWJ1dGVWYWx1ZVxuICAgKiBpbiB0aGF0IG9yZGVyLlxuICAgKi9cbiAgTmFtZXNwYWNlVVJJID0gMCxcblxuICAvKipcbiAgICogVGhpcyBtYXJrZXIgaW5kaWNhdGVzIHRoYXQgdGhlIGZvbGxvd2luZyBhdHRyaWJ1dGUgbmFtZXMgd2VyZSBleHRyYWN0ZWQgZnJvbSBiaW5kaW5ncyAoZXguOlxuICAgKiBbZm9vXT1cImV4cFwiKSBhbmQgLyBvciBldmVudCBoYW5kbGVycyAoZXguIChiYXIpPVwiZG9TdGgoKVwiKS5cbiAgICogVGFraW5nIHRoZSBhYm92ZSBiaW5kaW5ncyBhbmQgb3V0cHV0cyBhcyBhbiBleGFtcGxlIGFuIGF0dHJpYnV0ZXMgYXJyYXkgY291bGQgbG9vayBhcyBmb2xsb3dzOlxuICAgKiBbJ2NsYXNzJywgJ2ZhZGUgaW4nLCBBdHRyaWJ1dGVNYXJrZXIuU2VsZWN0T25seSwgJ2ZvbycsICdiYXInXVxuICAgKi9cbiAgU2VsZWN0T25seSA9IDFcbn1cblxuLyoqXG4gKiBBIGNvbWJpbmF0aW9uIG9mOlxuICogLSBhdHRyaWJ1dGUgbmFtZXMgYW5kIHZhbHVlc1xuICogLSBzcGVjaWFsIG1hcmtlcnMgYWN0aW5nIGFzIGZsYWdzIHRvIGFsdGVyIGF0dHJpYnV0ZXMgcHJvY2Vzc2luZy5cbiAqL1xuZXhwb3J0IHR5cGUgVEF0dHJpYnV0ZXMgPSAoc3RyaW5nIHwgQXR0cmlidXRlTWFya2VyKVtdO1xuXG4vKipcbiAqIExOb2RlIGJpbmRpbmcgZGF0YSAoZmx5d2VpZ2h0KSBmb3IgYSBwYXJ0aWN1bGFyIG5vZGUgdGhhdCBpcyBzaGFyZWQgYmV0d2VlbiBhbGwgdGVtcGxhdGVzXG4gKiBvZiBhIHNwZWNpZmljIHR5cGUuXG4gKlxuICogSWYgYSBwcm9wZXJ0eSBpczpcbiAqICAgIC0gUHJvcGVydHlBbGlhc2VzOiB0aGF0IHByb3BlcnR5J3MgZGF0YSB3YXMgZ2VuZXJhdGVkIGFuZCB0aGlzIGlzIGl0XG4gKiAgICAtIE51bGw6IHRoYXQgcHJvcGVydHkncyBkYXRhIHdhcyBhbHJlYWR5IGdlbmVyYXRlZCBhbmQgbm90aGluZyB3YXMgZm91bmQuXG4gKiAgICAtIFVuZGVmaW5lZDogdGhhdCBwcm9wZXJ0eSdzIGRhdGEgaGFzIG5vdCB5ZXQgYmVlbiBnZW5lcmF0ZWRcbiAqXG4gKiBzZWU6IGh0dHBzOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0ZseXdlaWdodF9wYXR0ZXJuIGZvciBtb3JlIG9uIHRoZSBGbHl3ZWlnaHQgcGF0dGVyblxuICovXG5leHBvcnQgaW50ZXJmYWNlIFROb2RlIHtcbiAgLyoqIFRoZSB0eXBlIG9mIHRoZSBUTm9kZS4gU2VlIFROb2RlVHlwZS4gKi9cbiAgdHlwZTogVE5vZGVUeXBlO1xuXG4gIC8qKlxuICAgKiBJbmRleCBvZiB0aGUgVE5vZGUgaW4gVFZpZXcuZGF0YSBhbmQgY29ycmVzcG9uZGluZyBMTm9kZSBpbiBMVmlldy5kYXRhLlxuICAgKlxuICAgKiBUaGlzIGlzIG5lY2Vzc2FyeSB0byBnZXQgZnJvbSBhbnkgVE5vZGUgdG8gaXRzIGNvcnJlc3BvbmRpbmcgTE5vZGUgd2hlblxuICAgKiB0cmF2ZXJzaW5nIHRoZSBub2RlIHRyZWUuXG4gICAqXG4gICAqIElmIGluZGV4IGlzIC0xLCB0aGlzIGlzIGEgZHluYW1pY2FsbHkgY3JlYXRlZCBjb250YWluZXIgbm9kZSBvciBlbWJlZGRlZCB2aWV3IG5vZGUuXG4gICAqL1xuICBpbmRleDogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBUaGlzIG51bWJlciBzdG9yZXMgdHdvIHZhbHVlcyB1c2luZyBpdHMgYml0czpcbiAgICpcbiAgICogLSB0aGUgbnVtYmVyIG9mIGRpcmVjdGl2ZXMgb24gdGhhdCBub2RlIChmaXJzdCAxMiBiaXRzKVxuICAgKiAtIHRoZSBzdGFydGluZyBpbmRleCBvZiB0aGUgbm9kZSdzIGRpcmVjdGl2ZXMgaW4gdGhlIGRpcmVjdGl2ZXMgYXJyYXkgKGxhc3QgMjAgYml0cykuXG4gICAqXG4gICAqIFRoZXNlIHR3byB2YWx1ZXMgYXJlIG5lY2Vzc2FyeSBzbyBESSBjYW4gZWZmZWN0aXZlbHkgc2VhcmNoIHRoZSBkaXJlY3RpdmVzIGFzc29jaWF0ZWRcbiAgICogd2l0aCBhIG5vZGUgd2l0aG91dCBzZWFyY2hpbmcgdGhlIHdob2xlIGRpcmVjdGl2ZXMgYXJyYXkuXG4gICAqL1xuICBmbGFnczogVE5vZGVGbGFncztcblxuICAvKiogVGhlIHRhZyBuYW1lIGFzc29jaWF0ZWQgd2l0aCB0aGlzIG5vZGUuICovXG4gIHRhZ05hbWU6IHN0cmluZ3xudWxsO1xuXG4gIC8qKlxuICAgKiBBdHRyaWJ1dGVzIGFzc29jaWF0ZWQgd2l0aCBhbiBlbGVtZW50LiBXZSBuZWVkIHRvIHN0b3JlIGF0dHJpYnV0ZXMgdG8gc3VwcG9ydCB2YXJpb3VzIHVzZS1jYXNlc1xuICAgKiAoYXR0cmlidXRlIGluamVjdGlvbiwgY29udGVudCBwcm9qZWN0aW9uIHdpdGggc2VsZWN0b3JzLCBkaXJlY3RpdmVzIG1hdGNoaW5nKS5cbiAgICogQXR0cmlidXRlcyBhcmUgc3RvcmVkIHN0YXRpY2FsbHkgYmVjYXVzZSByZWFkaW5nIHRoZW0gZnJvbSB0aGUgRE9NIHdvdWxkIGJlIHdheSB0b28gc2xvdyBmb3JcbiAgICogY29udGVudCBwcm9qZWN0aW9uIGFuZCBxdWVyaWVzLlxuICAgKlxuICAgKiBTaW5jZSBhdHRycyB3aWxsIGFsd2F5cyBiZSBjYWxjdWxhdGVkIGZpcnN0LCB0aGV5IHdpbGwgbmV2ZXIgbmVlZCB0byBiZSBtYXJrZWQgdW5kZWZpbmVkIGJ5XG4gICAqIG90aGVyIGluc3RydWN0aW9ucy5cbiAgICpcbiAgICogRm9yIHJlZ3VsYXIgYXR0cmlidXRlcyBhIG5hbWUgb2YgYW4gYXR0cmlidXRlIGFuZCBpdHMgdmFsdWUgYWx0ZXJuYXRlIGluIHRoZSBhcnJheS5cbiAgICogZS5nLiBbJ3JvbGUnLCAnY2hlY2tib3gnXVxuICAgKiBUaGlzIGFycmF5IGNhbiBjb250YWluIGZsYWdzIHRoYXQgd2lsbCBpbmRpY2F0ZSBcInNwZWNpYWwgYXR0cmlidXRlc1wiIChhdHRyaWJ1dGVzIHdpdGhcbiAgICogbmFtZXNwYWNlcywgYXR0cmlidXRlcyBleHRyYWN0ZWQgZnJvbSBiaW5kaW5ncyBhbmQgb3V0cHV0cykuXG4gICAqL1xuICBhdHRyczogVEF0dHJpYnV0ZXN8bnVsbDtcblxuICAvKipcbiAgICogQSBzZXQgb2YgbG9jYWwgbmFtZXMgdW5kZXIgd2hpY2ggYSBnaXZlbiBlbGVtZW50IGlzIGV4cG9ydGVkIGluIGEgdGVtcGxhdGUgYW5kXG4gICAqIHZpc2libGUgdG8gcXVlcmllcy4gQW4gZW50cnkgaW4gdGhpcyBhcnJheSBjYW4gYmUgY3JlYXRlZCBmb3IgZGlmZmVyZW50IHJlYXNvbnM6XG4gICAqIC0gYW4gZWxlbWVudCBpdHNlbGYgaXMgcmVmZXJlbmNlZCwgZXguOiBgPGRpdiAjZm9vPmBcbiAgICogLSBhIGNvbXBvbmVudCBpcyByZWZlcmVuY2VkLCBleC46IGA8bXktY21wdCAjZm9vPmBcbiAgICogLSBhIGRpcmVjdGl2ZSBpcyByZWZlcmVuY2VkLCBleC46IGA8bXktY21wdCAjZm9vPVwiZGlyZWN0aXZlRXhwb3J0QXNcIj5gLlxuICAgKlxuICAgKiBBIGdpdmVuIGVsZW1lbnQgbWlnaHQgaGF2ZSBkaWZmZXJlbnQgbG9jYWwgbmFtZXMgYW5kIHRob3NlIG5hbWVzIGNhbiBiZSBhc3NvY2lhdGVkXG4gICAqIHdpdGggYSBkaXJlY3RpdmUuIFdlIHN0b3JlIGxvY2FsIG5hbWVzIGF0IGV2ZW4gaW5kZXhlcyB3aGlsZSBvZGQgaW5kZXhlcyBhcmUgcmVzZXJ2ZWRcbiAgICogZm9yIGRpcmVjdGl2ZSBpbmRleCBpbiBhIHZpZXcgKG9yIGAtMWAgaWYgdGhlcmUgaXMgbm8gYXNzb2NpYXRlZCBkaXJlY3RpdmUpLlxuICAgKlxuICAgKiBTb21lIGV4YW1wbGVzOlxuICAgKiAtIGA8ZGl2ICNmb28+YCA9PiBgW1wiZm9vXCIsIC0xXWBcbiAgICogLSBgPG15LWNtcHQgI2Zvbz5gID0+IGBbXCJmb29cIiwgbXlDbXB0SWR4XWBcbiAgICogLSBgPG15LWNtcHQgI2ZvbyAjYmFyPVwiZGlyZWN0aXZlRXhwb3J0QXNcIj5gID0+IGBbXCJmb29cIiwgbXlDbXB0SWR4LCBcImJhclwiLCBkaXJlY3RpdmVJZHhdYFxuICAgKiAtIGA8ZGl2ICNmb28gI2Jhcj1cImRpcmVjdGl2ZUV4cG9ydEFzXCI+YCA9PiBgW1wiZm9vXCIsIC0xLCBcImJhclwiLCBkaXJlY3RpdmVJZHhdYFxuICAgKi9cbiAgbG9jYWxOYW1lczogKHN0cmluZ3xudW1iZXIpW118bnVsbDtcblxuICAvKiogSW5mb3JtYXRpb24gYWJvdXQgaW5wdXQgcHJvcGVydGllcyB0aGF0IG5lZWQgdG8gYmUgc2V0IG9uY2UgZnJvbSBhdHRyaWJ1dGUgZGF0YS4gKi9cbiAgaW5pdGlhbElucHV0czogSW5pdGlhbElucHV0RGF0YXxudWxsfHVuZGVmaW5lZDtcblxuICAvKipcbiAgICogSW5wdXQgZGF0YSBmb3IgYWxsIGRpcmVjdGl2ZXMgb24gdGhpcyBub2RlLlxuICAgKlxuICAgKiAtIGB1bmRlZmluZWRgIG1lYW5zIHRoYXQgdGhlIHByb3AgaGFzIG5vdCBiZWVuIGluaXRpYWxpemVkIHlldCxcbiAgICogLSBgbnVsbGAgbWVhbnMgdGhhdCB0aGUgcHJvcCBoYXMgYmVlbiBpbml0aWFsaXplZCBidXQgbm8gaW5wdXRzIGhhdmUgYmVlbiBmb3VuZC5cbiAgICovXG4gIGlucHV0czogUHJvcGVydHlBbGlhc2VzfG51bGx8dW5kZWZpbmVkO1xuXG4gIC8qKlxuICAgKiBPdXRwdXQgZGF0YSBmb3IgYWxsIGRpcmVjdGl2ZXMgb24gdGhpcyBub2RlLlxuICAgKlxuICAgKiAtIGB1bmRlZmluZWRgIG1lYW5zIHRoYXQgdGhlIHByb3AgaGFzIG5vdCBiZWVuIGluaXRpYWxpemVkIHlldCxcbiAgICogLSBgbnVsbGAgbWVhbnMgdGhhdCB0aGUgcHJvcCBoYXMgYmVlbiBpbml0aWFsaXplZCBidXQgbm8gb3V0cHV0cyBoYXZlIGJlZW4gZm91bmQuXG4gICAqL1xuICBvdXRwdXRzOiBQcm9wZXJ0eUFsaWFzZXN8bnVsbHx1bmRlZmluZWQ7XG5cbiAgLyoqXG4gICAqIFRoZSBUVmlldyBvciBUVmlld3MgYXR0YWNoZWQgdG8gdGhpcyBub2RlLlxuICAgKlxuICAgKiBJZiB0aGlzIFROb2RlIGNvcnJlc3BvbmRzIHRvIGFuIExDb250YWluZXJOb2RlIHdpdGggaW5saW5lIHZpZXdzLCB0aGUgY29udGFpbmVyIHdpbGxcbiAgICogbmVlZCB0byBzdG9yZSBzZXBhcmF0ZSBzdGF0aWMgZGF0YSBmb3IgZWFjaCBvZiBpdHMgdmlldyBibG9ja3MgKFRWaWV3W10pLiBPdGhlcndpc2UsXG4gICAqIG5vZGVzIGluIGlubGluZSB2aWV3cyB3aXRoIHRoZSBzYW1lIGluZGV4IGFzIG5vZGVzIGluIHRoZWlyIHBhcmVudCB2aWV3cyB3aWxsIG92ZXJ3cml0ZVxuICAgKiBlYWNoIG90aGVyLCBhcyB0aGV5IGFyZSBpbiB0aGUgc2FtZSB0ZW1wbGF0ZS5cbiAgICpcbiAgICogRWFjaCBpbmRleCBpbiB0aGlzIGFycmF5IGNvcnJlc3BvbmRzIHRvIHRoZSBzdGF0aWMgZGF0YSBmb3IgYSBjZXJ0YWluXG4gICAqIHZpZXcuIFNvIGlmIHlvdSBoYWQgVigwKSBhbmQgVigxKSBpbiBhIGNvbnRhaW5lciwgeW91IG1pZ2h0IGhhdmU6XG4gICAqXG4gICAqIFtcbiAgICogICBbe3RhZ05hbWU6ICdkaXYnLCBhdHRyczogLi4ufSwgbnVsbF0sICAgICAvLyBWKDApIFRWaWV3XG4gICAqICAgW3t0YWdOYW1lOiAnYnV0dG9uJywgYXR0cnMgLi4ufSwgbnVsbF0gICAgLy8gVigxKSBUVmlld1xuICAgKlxuICAgKiBJZiB0aGlzIFROb2RlIGNvcnJlc3BvbmRzIHRvIGFuIExDb250YWluZXJOb2RlIHdpdGggYSB0ZW1wbGF0ZSAoZS5nLiBzdHJ1Y3R1cmFsXG4gICAqIGRpcmVjdGl2ZSksIHRoZSB0ZW1wbGF0ZSdzIFRWaWV3IHdpbGwgYmUgc3RvcmVkIGhlcmUuXG4gICAqXG4gICAqIElmIHRoaXMgVE5vZGUgY29ycmVzcG9uZHMgdG8gYW4gTEVsZW1lbnROb2RlLCB0Vmlld3Mgd2lsbCBiZSBudWxsIC5cbiAgICovXG4gIHRWaWV3czogVFZpZXd8VFZpZXdbXXxudWxsO1xuXG4gIC8qKlxuICAgKiBUaGUgbmV4dCBzaWJsaW5nIG5vZGUuIE5lY2Vzc2FyeSBzbyB3ZSBjYW4gcHJvcGFnYXRlIHRocm91Z2ggdGhlIHJvb3Qgbm9kZXMgb2YgYSB2aWV3XG4gICAqIHRvIGluc2VydCB0aGVtIG9yIHJlbW92ZSB0aGVtIGZyb20gdGhlIERPTS5cbiAgICovXG4gIG5leHQ6IFROb2RlfG51bGw7XG5cbiAgLyoqXG4gICAqIEZpcnN0IGNoaWxkIG9mIHRoZSBjdXJyZW50IG5vZGUuXG4gICAqXG4gICAqIEZvciBjb21wb25lbnQgbm9kZXMsIHRoZSBjaGlsZCB3aWxsIGFsd2F5cyBiZSBhIENvbnRlbnRDaGlsZCAoaW4gc2FtZSB2aWV3KS5cbiAgICogRm9yIGVtYmVkZGVkIHZpZXcgbm9kZXMsIHRoZSBjaGlsZCB3aWxsIGJlIGluIHRoZWlyIGNoaWxkIHZpZXcuXG4gICAqL1xuICBjaGlsZDogVE5vZGV8bnVsbDtcblxuICAvKipcbiAgICogUGFyZW50IG5vZGUgKGluIHRoZSBzYW1lIHZpZXcgb25seSkuXG4gICAqXG4gICAqIFdlIG5lZWQgYSByZWZlcmVuY2UgdG8gYSBub2RlJ3MgcGFyZW50IHNvIHdlIGNhbiBhcHBlbmQgdGhlIG5vZGUgdG8gaXRzIHBhcmVudCdzIG5hdGl2ZVxuICAgKiBlbGVtZW50IGF0IHRoZSBhcHByb3ByaWF0ZSB0aW1lLlxuICAgKlxuICAgKiBJZiB0aGUgcGFyZW50IHdvdWxkIGJlIGluIGEgZGlmZmVyZW50IHZpZXcgKGUuZy4gY29tcG9uZW50IGhvc3QpLCB0aGlzIHByb3BlcnR5IHdpbGwgYmUgbnVsbC5cbiAgICogSXQncyBpbXBvcnRhbnQgdGhhdCB3ZSBkb24ndCB0cnkgdG8gY3Jvc3MgY29tcG9uZW50IGJvdW5kYXJpZXMgd2hlbiByZXRyaWV2aW5nIHRoZSBwYXJlbnRcbiAgICogYmVjYXVzZSB0aGUgcGFyZW50IHdpbGwgY2hhbmdlIChlLmcuIGluZGV4LCBhdHRycykgZGVwZW5kaW5nIG9uIHdoZXJlIHRoZSBjb21wb25lbnQgd2FzXG4gICAqIHVzZWQgKGFuZCB0aHVzIHNob3VsZG4ndCBiZSBzdG9yZWQgb24gVE5vZGUpLiBJbiB0aGVzZSBjYXNlcywgd2UgcmV0cmlldmUgdGhlIHBhcmVudCB0aHJvdWdoXG4gICAqIExWaWV3Lm5vZGUgaW5zdGVhZCAod2hpY2ggd2lsbCBiZSBpbnN0YW5jZS1zcGVjaWZpYykuXG4gICAqXG4gICAqIElmIHRoaXMgaXMgYW4gaW5saW5lIHZpZXcgbm9kZSAoViksIHRoZSBwYXJlbnQgd2lsbCBiZSBpdHMgY29udGFpbmVyLlxuICAgKi9cbiAgcGFyZW50OiBURWxlbWVudE5vZGV8VENvbnRhaW5lck5vZGV8bnVsbDtcblxuICAvKipcbiAgICogQSBwb2ludGVyIHRvIGEgVENvbnRhaW5lck5vZGUgY3JlYXRlZCBieSBkaXJlY3RpdmVzIHJlcXVlc3RpbmcgVmlld0NvbnRhaW5lclJlZlxuICAgKi9cbiAgZHluYW1pY0NvbnRhaW5lck5vZGU6IFROb2RlfG51bGw7XG59XG5cbi8qKiBTdGF0aWMgZGF0YSBmb3IgYW4gTEVsZW1lbnROb2RlICAqL1xuZXhwb3J0IGludGVyZmFjZSBURWxlbWVudE5vZGUgZXh0ZW5kcyBUTm9kZSB7XG4gIC8qKiBJbmRleCBpbiB0aGUgZGF0YVtdIGFycmF5ICovXG4gIGluZGV4OiBudW1iZXI7XG4gIGNoaWxkOiBURWxlbWVudE5vZGV8VFRleHROb2RlfFRDb250YWluZXJOb2RlfFRQcm9qZWN0aW9uTm9kZXxudWxsO1xuICAvKipcbiAgICogRWxlbWVudCBub2RlcyB3aWxsIGhhdmUgcGFyZW50cyB1bmxlc3MgdGhleSBhcmUgdGhlIGZpcnN0IG5vZGUgb2YgYSBjb21wb25lbnQgb3JcbiAgICogZW1iZWRkZWQgdmlldyAod2hpY2ggbWVhbnMgdGhlaXIgcGFyZW50IGlzIGluIGEgZGlmZmVyZW50IHZpZXcgYW5kIG11c3QgYmVcbiAgICogcmV0cmlldmVkIHVzaW5nIExWaWV3Lm5vZGUpLlxuICAgKi9cbiAgcGFyZW50OiBURWxlbWVudE5vZGV8bnVsbDtcbiAgdFZpZXdzOiBudWxsO1xufVxuXG4vKiogU3RhdGljIGRhdGEgZm9yIGFuIExUZXh0Tm9kZSAgKi9cbmV4cG9ydCBpbnRlcmZhY2UgVFRleHROb2RlIGV4dGVuZHMgVE5vZGUge1xuICAvKiogSW5kZXggaW4gdGhlIGRhdGFbXSBhcnJheSAqL1xuICBpbmRleDogbnVtYmVyO1xuICBjaGlsZDogbnVsbDtcbiAgLyoqXG4gICAqIFRleHQgbm9kZXMgd2lsbCBoYXZlIHBhcmVudHMgdW5sZXNzIHRoZXkgYXJlIHRoZSBmaXJzdCBub2RlIG9mIGEgY29tcG9uZW50IG9yXG4gICAqIGVtYmVkZGVkIHZpZXcgKHdoaWNoIG1lYW5zIHRoZWlyIHBhcmVudCBpcyBpbiBhIGRpZmZlcmVudCB2aWV3IGFuZCBtdXN0IGJlXG4gICAqIHJldHJpZXZlZCB1c2luZyBMVmlldy5ub2RlKS5cbiAgICovXG4gIHBhcmVudDogVEVsZW1lbnROb2RlfG51bGw7XG4gIHRWaWV3czogbnVsbDtcbn1cblxuLyoqIFN0YXRpYyBkYXRhIGZvciBhbiBMQ29udGFpbmVyTm9kZSAqL1xuZXhwb3J0IGludGVyZmFjZSBUQ29udGFpbmVyTm9kZSBleHRlbmRzIFROb2RlIHtcbiAgLyoqXG4gICAqIEluZGV4IGluIHRoZSBkYXRhW10gYXJyYXkuXG4gICAqXG4gICAqIElmIGl0J3MgLTEsIHRoaXMgaXMgYSBkeW5hbWljYWxseSBjcmVhdGVkIGNvbnRhaW5lciBub2RlIHRoYXQgaXNuJ3Qgc3RvcmVkIGluXG4gICAqIGRhdGFbXSAoZS5nLiB3aGVuIHlvdSBpbmplY3QgVmlld0NvbnRhaW5lclJlZikgLlxuICAgKi9cbiAgaW5kZXg6IG51bWJlcjtcbiAgY2hpbGQ6IG51bGw7XG5cbiAgLyoqXG4gICAqIENvbnRhaW5lciBub2RlcyB3aWxsIGhhdmUgcGFyZW50cyB1bmxlc3M6XG4gICAqXG4gICAqIC0gVGhleSBhcmUgdGhlIGZpcnN0IG5vZGUgb2YgYSBjb21wb25lbnQgb3IgZW1iZWRkZWQgdmlld1xuICAgKiAtIFRoZXkgYXJlIGR5bmFtaWNhbGx5IGNyZWF0ZWRcbiAgICovXG4gIHBhcmVudDogVEVsZW1lbnROb2RlfG51bGw7XG4gIHRWaWV3czogVFZpZXd8VFZpZXdbXXxudWxsO1xufVxuXG4vKiogU3RhdGljIGRhdGEgZm9yIGFuIExWaWV3Tm9kZSAgKi9cbmV4cG9ydCBpbnRlcmZhY2UgVFZpZXdOb2RlIGV4dGVuZHMgVE5vZGUge1xuICAvKiogSWYgLTEsIGl0J3MgYSBkeW5hbWljYWxseSBjcmVhdGVkIHZpZXcuIE90aGVyd2lzZSwgaXQgaXMgdGhlIHZpZXcgYmxvY2sgSUQuICovXG4gIGluZGV4OiBudW1iZXI7XG4gIGNoaWxkOiBURWxlbWVudE5vZGV8VFRleHROb2RlfFRDb250YWluZXJOb2RlfFRQcm9qZWN0aW9uTm9kZXxudWxsO1xuICBwYXJlbnQ6IFRDb250YWluZXJOb2RlfG51bGw7XG4gIHRWaWV3czogbnVsbDtcbn1cblxuLyoqIFN0YXRpYyBkYXRhIGZvciBhbiBMUHJvamVjdGlvbk5vZGUgICovXG5leHBvcnQgaW50ZXJmYWNlIFRQcm9qZWN0aW9uTm9kZSBleHRlbmRzIFROb2RlIHtcbiAgLyoqIEluZGV4IGluIHRoZSBkYXRhW10gYXJyYXkgKi9cbiAgY2hpbGQ6IG51bGw7XG4gIC8qKlxuICAgKiBQcm9qZWN0aW9uIG5vZGVzIHdpbGwgaGF2ZSBwYXJlbnRzIHVubGVzcyB0aGV5IGFyZSB0aGUgZmlyc3Qgbm9kZSBvZiBhIGNvbXBvbmVudFxuICAgKiBvciBlbWJlZGRlZCB2aWV3ICh3aGljaCBtZWFucyB0aGVpciBwYXJlbnQgaXMgaW4gYSBkaWZmZXJlbnQgdmlldyBhbmQgbXVzdCBiZVxuICAgKiByZXRyaWV2ZWQgdXNpbmcgTFZpZXcubm9kZSkuXG4gICAqL1xuICBwYXJlbnQ6IFRFbGVtZW50Tm9kZXxudWxsO1xuICB0Vmlld3M6IG51bGw7XG59XG5cbi8qKlxuICogVGhpcyBtYXBwaW5nIGlzIG5lY2Vzc2FyeSBzbyB3ZSBjYW4gc2V0IGlucHV0IHByb3BlcnRpZXMgYW5kIG91dHB1dCBsaXN0ZW5lcnNcbiAqIHByb3Blcmx5IGF0IHJ1bnRpbWUgd2hlbiBwcm9wZXJ0eSBuYW1lcyBhcmUgbWluaWZpZWQgb3IgYWxpYXNlZC5cbiAqXG4gKiBLZXk6IHVubWluaWZpZWQgLyBwdWJsaWMgaW5wdXQgb3Igb3V0cHV0IG5hbWVcbiAqIFZhbHVlOiBhcnJheSBjb250YWluaW5nIG1pbmlmaWVkIC8gaW50ZXJuYWwgbmFtZSBhbmQgcmVsYXRlZCBkaXJlY3RpdmUgaW5kZXhcbiAqXG4gKiBUaGUgdmFsdWUgbXVzdCBiZSBhbiBhcnJheSB0byBzdXBwb3J0IGlucHV0cyBhbmQgb3V0cHV0cyB3aXRoIHRoZSBzYW1lIG5hbWVcbiAqIG9uIHRoZSBzYW1lIG5vZGUuXG4gKi9cbmV4cG9ydCB0eXBlIFByb3BlcnR5QWxpYXNlcyA9IHtcbiAgLy8gVGhpcyB1c2VzIGFuIG9iamVjdCBtYXAgYmVjYXVzZSB1c2luZyB0aGUgTWFwIHR5cGUgd291bGQgYmUgdG9vIHNsb3dcbiAgW2tleTogc3RyaW5nXTogUHJvcGVydHlBbGlhc1ZhbHVlXG59O1xuXG4vKipcbiAqIFN0b3JlIHRoZSBydW50aW1lIGlucHV0IG9yIG91dHB1dCBuYW1lcyBmb3IgYWxsIHRoZSBkaXJlY3RpdmVzLlxuICpcbiAqIC0gRXZlbiBpbmRpY2VzOiBkaXJlY3RpdmUgaW5kZXhcbiAqIC0gT2RkIGluZGljZXM6IG1pbmlmaWVkIC8gaW50ZXJuYWwgbmFtZVxuICpcbiAqIGUuZy4gWzAsICdjaGFuZ2UtbWluaWZpZWQnXVxuICovXG5leHBvcnQgdHlwZSBQcm9wZXJ0eUFsaWFzVmFsdWUgPSAobnVtYmVyIHwgc3RyaW5nKVtdO1xuXG5cbi8qKlxuICogVGhpcyBhcnJheSBjb250YWlucyBpbmZvcm1hdGlvbiBhYm91dCBpbnB1dCBwcm9wZXJ0aWVzIHRoYXRcbiAqIG5lZWQgdG8gYmUgc2V0IG9uY2UgZnJvbSBhdHRyaWJ1dGUgZGF0YS4gSXQncyBvcmRlcmVkIGJ5XG4gKiBkaXJlY3RpdmUgaW5kZXggKHJlbGF0aXZlIHRvIGVsZW1lbnQpIHNvIGl0J3Mgc2ltcGxlIHRvXG4gKiBsb29rIHVwIGEgc3BlY2lmaWMgZGlyZWN0aXZlJ3MgaW5pdGlhbCBpbnB1dCBkYXRhLlxuICpcbiAqIFdpdGhpbiBlYWNoIHN1Yi1hcnJheTpcbiAqXG4gKiBFdmVuIGluZGljZXM6IG1pbmlmaWVkL2ludGVybmFsIGlucHV0IG5hbWVcbiAqIE9kZCBpbmRpY2VzOiBpbml0aWFsIHZhbHVlXG4gKlxuICogSWYgYSBkaXJlY3RpdmUgb24gYSBub2RlIGRvZXMgbm90IGhhdmUgYW55IGlucHV0IHByb3BlcnRpZXNcbiAqIHRoYXQgc2hvdWxkIGJlIHNldCBmcm9tIGF0dHJpYnV0ZXMsIGl0cyBpbmRleCBpcyBzZXQgdG8gbnVsbFxuICogdG8gYXZvaWQgYSBzcGFyc2UgYXJyYXkuXG4gKlxuICogZS5nLiBbbnVsbCwgWydyb2xlLW1pbicsICdidXR0b24nXV1cbiAqL1xuZXhwb3J0IHR5cGUgSW5pdGlhbElucHV0RGF0YSA9IChJbml0aWFsSW5wdXRzIHwgbnVsbClbXTtcblxuLyoqXG4gKiBVc2VkIGJ5IEluaXRpYWxJbnB1dERhdGEgdG8gc3RvcmUgaW5wdXQgcHJvcGVydGllc1xuICogdGhhdCBzaG91bGQgYmUgc2V0IG9uY2UgZnJvbSBhdHRyaWJ1dGVzLlxuICpcbiAqIEV2ZW4gaW5kaWNlczogbWluaWZpZWQvaW50ZXJuYWwgaW5wdXQgbmFtZVxuICogT2RkIGluZGljZXM6IGluaXRpYWwgdmFsdWVcbiAqXG4gKiBlLmcuIFsncm9sZS1taW4nLCAnYnV0dG9uJ11cbiAqL1xuZXhwb3J0IHR5cGUgSW5pdGlhbElucHV0cyA9IHN0cmluZ1tdO1xuXG4vLyBOb3RlOiBUaGlzIGhhY2sgaXMgbmVjZXNzYXJ5IHNvIHdlIGRvbid0IGVycm9uZW91c2x5IGdldCBhIGNpcmN1bGFyIGRlcGVuZGVuY3lcbi8vIGZhaWx1cmUgYmFzZWQgb24gdHlwZXMuXG5leHBvcnQgY29uc3QgdW51c2VkVmFsdWVFeHBvcnRUb1BsYWNhdGVBamQgPSAxO1xuIl19