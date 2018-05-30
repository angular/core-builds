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
    NS: 0,
    // namespace. Has to be repeated.
    /**
       * This marker indicates that the following attribute names were extracted from bindings (ex.:
       * [foo]="exp") and / or event handlers (ex. (bar)="doSth()").
       * Taking the above bindings and outputs as an example an attributes array could look as follows:
       * ['class', 'fade in', AttributeMarker.SELECT_ONLY, 'foo', 'bar']
       */
    SELECT_ONLY: 1,
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
     * If null, this is a dynamically created container node or embedded view node.
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
     * If number, index in the data[] array.
     *
     * If null, this is a dynamically created container node that isn't stored in
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
     * If null, it's a dynamically created view
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9kZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaW50ZXJmYWNlcy9ub2RlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQStjQSxNQUFNLENBQUMsdUJBQU0sNkJBQTZCLEdBQUcsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0xDb250YWluZXJ9IGZyb20gJy4vY29udGFpbmVyJztcbmltcG9ydCB7TEluamVjdG9yfSBmcm9tICcuL2luamVjdG9yJztcbmltcG9ydCB7TFByb2plY3Rpb259IGZyb20gJy4vcHJvamVjdGlvbic7XG5pbXBvcnQge0xRdWVyaWVzfSBmcm9tICcuL3F1ZXJ5JztcbmltcG9ydCB7UkVsZW1lbnQsIFJOb2RlLCBSVGV4dH0gZnJvbSAnLi9yZW5kZXJlcic7XG5pbXBvcnQge0xWaWV3LCBURGF0YSwgVFZpZXd9IGZyb20gJy4vdmlldyc7XG5cblxuXG4vKipcbiAqIFROb2RlVHlwZSBjb3JyZXNwb25kcyB0byB0aGUgVE5vZGUudHlwZSBwcm9wZXJ0eS4gSXQgY29udGFpbnMgaW5mb3JtYXRpb25cbiAqIG9uIGhvdyB0byBtYXAgYSBwYXJ0aWN1bGFyIHNldCBvZiBiaXRzIGluIExOb2RlLmZsYWdzIHRvIHRoZSBub2RlIHR5cGUuXG4gKi9cbmV4cG9ydCBjb25zdCBlbnVtIFROb2RlVHlwZSB7XG4gIENvbnRhaW5lciA9IDBiMDAsXG4gIFByb2plY3Rpb24gPSAwYjAxLFxuICBWaWV3ID0gMGIxMCxcbiAgRWxlbWVudCA9IDBiMTEsXG4gIFZpZXdPckVsZW1lbnQgPSAwYjEwLFxufVxuXG4vKipcbiAqIENvcnJlc3BvbmRzIHRvIHRoZSBUTm9kZS5mbGFncyBwcm9wZXJ0eS5cbiAqL1xuZXhwb3J0IGNvbnN0IGVudW0gVE5vZGVGbGFncyB7XG4gIC8qKiBUaGUgbnVtYmVyIG9mIGRpcmVjdGl2ZXMgb24gdGhpcyBub2RlIGlzIGVuY29kZWQgb24gdGhlIGxlYXN0IHNpZ25pZmljYW50IGJpdHMgKi9cbiAgRGlyZWN0aXZlQ291bnRNYXNrID0gMGIwMDAwMDAwMDAwMDAwMDAwMDAwMDExMTExMTExMTExMSxcblxuICAvKiogVGhlbiB0aGlzIGJpdCBpcyBzZXQgd2hlbiB0aGUgbm9kZSBpcyBhIGNvbXBvbmVudCAqL1xuICBpc0NvbXBvbmVudCA9IDBiMTAwMDAwMDAwMDAwMCxcblxuICAvKiogVGhlIGluZGV4IG9mIHRoZSBmaXJzdCBkaXJlY3RpdmUgb24gdGhpcyBub2RlIGlzIGVuY29kZWQgb24gdGhlIG1vc3Qgc2lnbmlmaWNhbnQgYml0cyAgKi9cbiAgRGlyZWN0aXZlU3RhcnRpbmdJbmRleFNoaWZ0ID0gMTMsXG59XG5cbi8qKlxuICogTE5vZGUgaXMgYW4gaW50ZXJuYWwgZGF0YSBzdHJ1Y3R1cmUgd2hpY2ggaXMgdXNlZCBmb3IgdGhlIGluY3JlbWVudGFsIERPTSBhbGdvcml0aG0uXG4gKiBUaGUgXCJMXCIgc3RhbmRzIGZvciBcIkxvZ2ljYWxcIiB0byBkaWZmZXJlbnRpYXRlIGJldHdlZW4gYFJOb2Rlc2AgKGFjdHVhbCByZW5kZXJlZCBET01cbiAqIG5vZGUpIGFuZCBvdXIgbG9naWNhbCByZXByZXNlbnRhdGlvbiBvZiBET00gbm9kZXMsIGBMTm9kZXNgLlxuICpcbiAqIFRoZSBkYXRhIHN0cnVjdHVyZSBpcyBvcHRpbWl6ZWQgZm9yIHNwZWVkIGFuZCBzaXplLlxuICpcbiAqIEluIG9yZGVyIHRvIGJlIGZhc3QsIGFsbCBzdWJ0eXBlcyBvZiBgTE5vZGVgIHNob3VsZCBoYXZlIHRoZSBzYW1lIHNoYXBlLlxuICogQmVjYXVzZSBzaXplIG9mIHRoZSBgTE5vZGVgIG1hdHRlcnMsIG1hbnkgZmllbGRzIGhhdmUgbXVsdGlwbGUgcm9sZXMgZGVwZW5kaW5nXG4gKiBvbiB0aGUgYExOb2RlYCBzdWJ0eXBlLlxuICpcbiAqIFNlZTogaHR0cHM6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvSW5saW5lX2NhY2hpbmcjTW9ub21vcnBoaWNfaW5saW5lX2NhY2hpbmdcbiAqXG4gKiBOT1RFOiBUaGlzIGlzIGEgcHJpdmF0ZSBkYXRhIHN0cnVjdHVyZSBhbmQgc2hvdWxkIG5vdCBiZSBleHBvcnRlZCBieSBhbnkgb2YgdGhlXG4gKiBpbnN0cnVjdGlvbnMuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgTE5vZGUge1xuICAvKipcbiAgICogVGhlIGFzc29jaWF0ZWQgRE9NIG5vZGUuIFN0b3JpbmcgdGhpcyBhbGxvd3MgdXMgdG86XG4gICAqICAtIGFwcGVuZCBjaGlsZHJlbiB0byB0aGVpciBlbGVtZW50IHBhcmVudHMgaW4gdGhlIERPTSAoZS5nLiBgcGFyZW50Lm5hdGl2ZS5hcHBlbmRDaGlsZCguLi4pYClcbiAgICogIC0gcmV0cmlldmUgdGhlIHNpYmxpbmcgZWxlbWVudHMgb2YgdGV4dCBub2RlcyB3aG9zZSBjcmVhdGlvbiAvIGluc2VydGlvbiBoYXMgYmVlbiBkZWxheWVkXG4gICAqL1xuICByZWFkb25seSBuYXRpdmU6IFJFbGVtZW50fFJUZXh0fG51bGx8dW5kZWZpbmVkO1xuXG4gIC8qKlxuICAgKiBJZiByZWd1bGFyIExFbGVtZW50Tm9kZSwgdGhlbiBgZGF0YWAgd2lsbCBiZSBudWxsLlxuICAgKiBJZiBMRWxlbWVudE5vZGUgd2l0aCBjb21wb25lbnQsIHRoZW4gYGRhdGFgIGNvbnRhaW5zIExWaWV3LlxuICAgKiBJZiBMVmlld05vZGUsIHRoZW4gYGRhdGFgIGNvbnRhaW5zIHRoZSBMVmlldy5cbiAgICogSWYgTENvbnRhaW5lck5vZGUsIHRoZW4gYGRhdGFgIGNvbnRhaW5zIExDb250YWluZXIuXG4gICAqIElmIExQcm9qZWN0aW9uTm9kZSwgdGhlbiBgZGF0YWAgY29udGFpbnMgTFByb2plY3Rpb24uXG4gICAqL1xuICByZWFkb25seSBkYXRhOiBMVmlld3xMQ29udGFpbmVyfExQcm9qZWN0aW9ufG51bGw7XG5cblxuICAvKipcbiAgICogRWFjaCBub2RlIGJlbG9uZ3MgdG8gYSB2aWV3LlxuICAgKlxuICAgKiBXaGVuIHRoZSBpbmplY3RvciBpcyB3YWxraW5nIHVwIGEgdHJlZSwgaXQgbmVlZHMgYWNjZXNzIHRvIHRoZSBgZGlyZWN0aXZlc2AgKHBhcnQgb2YgdmlldykuXG4gICAqL1xuICByZWFkb25seSB2aWV3OiBMVmlldztcblxuICAvKiogVGhlIGluamVjdG9yIGFzc29jaWF0ZWQgd2l0aCB0aGlzIG5vZGUuIE5lY2Vzc2FyeSBmb3IgREkuICovXG4gIG5vZGVJbmplY3RvcjogTEluamVjdG9yfG51bGw7XG5cbiAgLyoqXG4gICAqIE9wdGlvbmFsIHNldCBvZiBxdWVyaWVzIHRoYXQgdHJhY2sgcXVlcnktcmVsYXRlZCBldmVudHMgZm9yIHRoaXMgbm9kZS5cbiAgICpcbiAgICogSWYgcHJlc2VudCB0aGUgbm9kZSBjcmVhdGlvbi91cGRhdGVzIGFyZSByZXBvcnRlZCB0byB0aGUgYExRdWVyaWVzYC5cbiAgICovXG4gIHF1ZXJpZXM6IExRdWVyaWVzfG51bGw7XG5cbiAgLyoqXG4gICAqIElmIHRoaXMgbm9kZSBpcyBwcm9qZWN0ZWQsIHBvaW50ZXIgdG8gdGhlIG5leHQgbm9kZSBpbiB0aGUgc2FtZSBwcm9qZWN0aW9uIHBhcmVudFxuICAgKiAod2hpY2ggaXMgYSBjb250YWluZXIsIGFuIGVsZW1lbnQsIG9yIGEgdGV4dCBub2RlKSwgb3IgdG8gdGhlIHBhcmVudCBwcm9qZWN0aW9uIG5vZGVcbiAgICogaWYgdGhpcyBpcyB0aGUgbGFzdCBub2RlIGluIHRoZSBwcm9qZWN0aW9uLlxuICAgKiBJZiB0aGlzIG5vZGUgaXMgbm90IHByb2plY3RlZCwgdGhpcyBmaWVsZCBpcyBudWxsLlxuICAgKi9cbiAgcE5leHRPclBhcmVudDogTE5vZGV8bnVsbDtcblxuICAvKipcbiAgICogUG9pbnRlciB0byB0aGUgY29ycmVzcG9uZGluZyBUTm9kZSBvYmplY3QsIHdoaWNoIHN0b3JlcyBzdGF0aWNcbiAgICogZGF0YSBhYm91dCB0aGlzIG5vZGUuXG4gICAqL1xuICB0Tm9kZTogVE5vZGU7XG5cbiAgLyoqXG4gICAqIEEgcG9pbnRlciB0byBhbiBMQ29udGFpbmVyTm9kZSBjcmVhdGVkIGJ5IGRpcmVjdGl2ZXMgcmVxdWVzdGluZyBWaWV3Q29udGFpbmVyUmVmXG4gICAqL1xuICAvLyBUT0RPKGthcmEpOiBSZW1vdmUgd2hlbiByZW1vdmluZyBMTm9kZXNcbiAgZHluYW1pY0xDb250YWluZXJOb2RlOiBMQ29udGFpbmVyTm9kZXxudWxsO1xufVxuXG5cbi8qKiBMTm9kZSByZXByZXNlbnRpbmcgYW4gZWxlbWVudC4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgTEVsZW1lbnROb2RlIGV4dGVuZHMgTE5vZGUge1xuICAvKiogVGhlIERPTSBlbGVtZW50IGFzc29jaWF0ZWQgd2l0aCB0aGlzIG5vZGUuICovXG4gIHJlYWRvbmx5IG5hdGl2ZTogUkVsZW1lbnQ7XG5cbiAgLyoqIElmIENvbXBvbmVudCB0aGVuIGRhdGEgaGFzIExWaWV3IChsaWdodCBET00pICovXG4gIHJlYWRvbmx5IGRhdGE6IExWaWV3fG51bGw7XG59XG5cbi8qKiBMTm9kZSByZXByZXNlbnRpbmcgYSAjdGV4dCBub2RlLiAqL1xuZXhwb3J0IGludGVyZmFjZSBMVGV4dE5vZGUgZXh0ZW5kcyBMTm9kZSB7XG4gIC8qKiBUaGUgdGV4dCBub2RlIGFzc29jaWF0ZWQgd2l0aCB0aGlzIG5vZGUuICovXG4gIG5hdGl2ZTogUlRleHQ7XG4gIHJlYWRvbmx5IGRhdGE6IG51bGw7XG4gIGR5bmFtaWNMQ29udGFpbmVyTm9kZTogbnVsbDtcbn1cblxuLyoqIEFic3RyYWN0IG5vZGUgd2hpY2ggY29udGFpbnMgcm9vdCBub2RlcyBvZiBhIHZpZXcuICovXG5leHBvcnQgaW50ZXJmYWNlIExWaWV3Tm9kZSBleHRlbmRzIExOb2RlIHtcbiAgcmVhZG9ubHkgbmF0aXZlOiBudWxsO1xuICByZWFkb25seSBkYXRhOiBMVmlldztcbiAgZHluYW1pY0xDb250YWluZXJOb2RlOiBudWxsO1xufVxuXG4vKiogQWJzdHJhY3Qgbm9kZSBjb250YWluZXIgd2hpY2ggY29udGFpbnMgb3RoZXIgdmlld3MuICovXG5leHBvcnQgaW50ZXJmYWNlIExDb250YWluZXJOb2RlIGV4dGVuZHMgTE5vZGUge1xuICAvKlxuICAgKiBDYWNoZXMgdGhlIHJlZmVyZW5jZSBvZiB0aGUgZmlyc3QgbmF0aXZlIG5vZGUgZm9sbG93aW5nIHRoaXMgY29udGFpbmVyIGluIHRoZSBzYW1lIG5hdGl2ZVxuICAgKiBwYXJlbnQuXG4gICAqIFRoaXMgaXMgcmVzZXQgdG8gdW5kZWZpbmVkIGluIGNvbnRhaW5lclJlZnJlc2hFbmQuXG4gICAqIFdoZW4gaXQgaXMgdW5kZWZpbmVkLCBpdCBtZWFucyB0aGUgdmFsdWUgaGFzIG5vdCBiZWVuIGNvbXB1dGVkIHlldC5cbiAgICogT3RoZXJ3aXNlLCBpdCBjb250YWlucyB0aGUgcmVzdWx0IG9mIGZpbmRCZWZvcmVOb2RlKGNvbnRhaW5lciwgbnVsbCkuXG4gICAqL1xuICBuYXRpdmU6IFJFbGVtZW50fFJUZXh0fG51bGx8dW5kZWZpbmVkO1xuICByZWFkb25seSBkYXRhOiBMQ29udGFpbmVyO1xufVxuXG5cbmV4cG9ydCBpbnRlcmZhY2UgTFByb2plY3Rpb25Ob2RlIGV4dGVuZHMgTE5vZGUge1xuICByZWFkb25seSBuYXRpdmU6IG51bGw7XG4gIHJlYWRvbmx5IGRhdGE6IExQcm9qZWN0aW9uO1xuICBkeW5hbWljTENvbnRhaW5lck5vZGU6IG51bGw7XG59XG5cbi8qKlxuICogQSBzZXQgb2YgbWFya2VyIHZhbHVlcyB0byBiZSB1c2VkIGluIHRoZSBhdHRyaWJ1dGVzIGFycmF5cy4gVGhvc2UgbWFya2VycyBpbmRpY2F0ZSB0aGF0IHNvbWVcbiAqIGl0ZW1zIGFyZSBub3QgcmVndWxhciBhdHRyaWJ1dGVzIGFuZCB0aGUgcHJvY2Vzc2luZyBzaG91bGQgYmUgYWRhcHRlZCBhY2NvcmRpbmdseS5cbiAqL1xuZXhwb3J0IGNvbnN0IGVudW0gQXR0cmlidXRlTWFya2VyIHtcbiAgTlMgPSAwLCAgLy8gbmFtZXNwYWNlLiBIYXMgdG8gYmUgcmVwZWF0ZWQuXG5cbiAgLyoqXG4gICAqIFRoaXMgbWFya2VyIGluZGljYXRlcyB0aGF0IHRoZSBmb2xsb3dpbmcgYXR0cmlidXRlIG5hbWVzIHdlcmUgZXh0cmFjdGVkIGZyb20gYmluZGluZ3MgKGV4LjpcbiAgICogW2Zvb109XCJleHBcIikgYW5kIC8gb3IgZXZlbnQgaGFuZGxlcnMgKGV4LiAoYmFyKT1cImRvU3RoKClcIikuXG4gICAqIFRha2luZyB0aGUgYWJvdmUgYmluZGluZ3MgYW5kIG91dHB1dHMgYXMgYW4gZXhhbXBsZSBhbiBhdHRyaWJ1dGVzIGFycmF5IGNvdWxkIGxvb2sgYXMgZm9sbG93czpcbiAgICogWydjbGFzcycsICdmYWRlIGluJywgQXR0cmlidXRlTWFya2VyLlNFTEVDVF9PTkxZLCAnZm9vJywgJ2JhciddXG4gICAqL1xuICBTRUxFQ1RfT05MWSA9IDFcbn1cblxuLyoqXG4gKiBBIGNvbWJpbmF0aW9uIG9mOlxuICogLSBhdHRyaWJ1dGUgbmFtZXMgYW5kIHZhbHVlc1xuICogLSBzcGVjaWFsIG1hcmtlcnMgYWN0aW5nIGFzIGZsYWdzIHRvIGFsdGVyIGF0dHJpYnV0ZXMgcHJvY2Vzc2luZy5cbiAqL1xuZXhwb3J0IHR5cGUgVEF0dHJpYnV0ZXMgPSAoc3RyaW5nIHwgQXR0cmlidXRlTWFya2VyKVtdO1xuXG4vKipcbiAqIExOb2RlIGJpbmRpbmcgZGF0YSAoZmx5d2VpZ2h0KSBmb3IgYSBwYXJ0aWN1bGFyIG5vZGUgdGhhdCBpcyBzaGFyZWQgYmV0d2VlbiBhbGwgdGVtcGxhdGVzXG4gKiBvZiBhIHNwZWNpZmljIHR5cGUuXG4gKlxuICogSWYgYSBwcm9wZXJ0eSBpczpcbiAqICAgIC0gUHJvcGVydHlBbGlhc2VzOiB0aGF0IHByb3BlcnR5J3MgZGF0YSB3YXMgZ2VuZXJhdGVkIGFuZCB0aGlzIGlzIGl0XG4gKiAgICAtIE51bGw6IHRoYXQgcHJvcGVydHkncyBkYXRhIHdhcyBhbHJlYWR5IGdlbmVyYXRlZCBhbmQgbm90aGluZyB3YXMgZm91bmQuXG4gKiAgICAtIFVuZGVmaW5lZDogdGhhdCBwcm9wZXJ0eSdzIGRhdGEgaGFzIG5vdCB5ZXQgYmVlbiBnZW5lcmF0ZWRcbiAqXG4gKiBzZWU6IGh0dHBzOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0ZseXdlaWdodF9wYXR0ZXJuIGZvciBtb3JlIG9uIHRoZSBGbHl3ZWlnaHQgcGF0dGVyblxuICovXG5leHBvcnQgaW50ZXJmYWNlIFROb2RlIHtcbiAgLyoqIFRoZSB0eXBlIG9mIHRoZSBUTm9kZS4gU2VlIFROb2RlVHlwZS4gKi9cbiAgdHlwZTogVE5vZGVUeXBlO1xuXG4gIC8qKlxuICAgKiBJbmRleCBvZiB0aGUgVE5vZGUgaW4gVFZpZXcuZGF0YSBhbmQgY29ycmVzcG9uZGluZyBMTm9kZSBpbiBMVmlldy5kYXRhLlxuICAgKlxuICAgKiBUaGlzIGlzIG5lY2Vzc2FyeSB0byBnZXQgZnJvbSBhbnkgVE5vZGUgdG8gaXRzIGNvcnJlc3BvbmRpbmcgTE5vZGUgd2hlblxuICAgKiB0cmF2ZXJzaW5nIHRoZSBub2RlIHRyZWUuXG4gICAqXG4gICAqIElmIG51bGwsIHRoaXMgaXMgYSBkeW5hbWljYWxseSBjcmVhdGVkIGNvbnRhaW5lciBub2RlIG9yIGVtYmVkZGVkIHZpZXcgbm9kZS5cbiAgICovXG4gIGluZGV4OiBudW1iZXJ8bnVsbDtcblxuICAvKipcbiAgICogVGhpcyBudW1iZXIgc3RvcmVzIHR3byB2YWx1ZXMgdXNpbmcgaXRzIGJpdHM6XG4gICAqXG4gICAqIC0gdGhlIG51bWJlciBvZiBkaXJlY3RpdmVzIG9uIHRoYXQgbm9kZSAoZmlyc3QgMTIgYml0cylcbiAgICogLSB0aGUgc3RhcnRpbmcgaW5kZXggb2YgdGhlIG5vZGUncyBkaXJlY3RpdmVzIGluIHRoZSBkaXJlY3RpdmVzIGFycmF5IChsYXN0IDIwIGJpdHMpLlxuICAgKlxuICAgKiBUaGVzZSB0d28gdmFsdWVzIGFyZSBuZWNlc3Nhcnkgc28gREkgY2FuIGVmZmVjdGl2ZWx5IHNlYXJjaCB0aGUgZGlyZWN0aXZlcyBhc3NvY2lhdGVkXG4gICAqIHdpdGggYSBub2RlIHdpdGhvdXQgc2VhcmNoaW5nIHRoZSB3aG9sZSBkaXJlY3RpdmVzIGFycmF5LlxuICAgKi9cbiAgZmxhZ3M6IFROb2RlRmxhZ3M7XG5cbiAgLyoqIFRoZSB0YWcgbmFtZSBhc3NvY2lhdGVkIHdpdGggdGhpcyBub2RlLiAqL1xuICB0YWdOYW1lOiBzdHJpbmd8bnVsbDtcblxuICAvKipcbiAgICogQXR0cmlidXRlcyBhc3NvY2lhdGVkIHdpdGggYW4gZWxlbWVudC4gV2UgbmVlZCB0byBzdG9yZSBhdHRyaWJ1dGVzIHRvIHN1cHBvcnQgdmFyaW91cyB1c2UtY2FzZXNcbiAgICogKGF0dHJpYnV0ZSBpbmplY3Rpb24sIGNvbnRlbnQgcHJvamVjdGlvbiB3aXRoIHNlbGVjdG9ycywgZGlyZWN0aXZlcyBtYXRjaGluZykuXG4gICAqIEF0dHJpYnV0ZXMgYXJlIHN0b3JlZCBzdGF0aWNhbGx5IGJlY2F1c2UgcmVhZGluZyB0aGVtIGZyb20gdGhlIERPTSB3b3VsZCBiZSB3YXkgdG9vIHNsb3cgZm9yXG4gICAqIGNvbnRlbnQgcHJvamVjdGlvbiBhbmQgcXVlcmllcy5cbiAgICpcbiAgICogU2luY2UgYXR0cnMgd2lsbCBhbHdheXMgYmUgY2FsY3VsYXRlZCBmaXJzdCwgdGhleSB3aWxsIG5ldmVyIG5lZWQgdG8gYmUgbWFya2VkIHVuZGVmaW5lZCBieVxuICAgKiBvdGhlciBpbnN0cnVjdGlvbnMuXG4gICAqXG4gICAqIEZvciByZWd1bGFyIGF0dHJpYnV0ZXMgYSBuYW1lIG9mIGFuIGF0dHJpYnV0ZSBhbmQgaXRzIHZhbHVlIGFsdGVybmF0ZSBpbiB0aGUgYXJyYXkuXG4gICAqIGUuZy4gWydyb2xlJywgJ2NoZWNrYm94J11cbiAgICogVGhpcyBhcnJheSBjYW4gY29udGFpbiBmbGFncyB0aGF0IHdpbGwgaW5kaWNhdGUgXCJzcGVjaWFsIGF0dHJpYnV0ZXNcIiAoYXR0cmlidXRlcyB3aXRoXG4gICAqIG5hbWVzcGFjZXMsIGF0dHJpYnV0ZXMgZXh0cmFjdGVkIGZyb20gYmluZGluZ3MgYW5kIG91dHB1dHMpLlxuICAgKi9cbiAgYXR0cnM6IFRBdHRyaWJ1dGVzfG51bGw7XG5cbiAgLyoqXG4gICAqIEEgc2V0IG9mIGxvY2FsIG5hbWVzIHVuZGVyIHdoaWNoIGEgZ2l2ZW4gZWxlbWVudCBpcyBleHBvcnRlZCBpbiBhIHRlbXBsYXRlIGFuZFxuICAgKiB2aXNpYmxlIHRvIHF1ZXJpZXMuIEFuIGVudHJ5IGluIHRoaXMgYXJyYXkgY2FuIGJlIGNyZWF0ZWQgZm9yIGRpZmZlcmVudCByZWFzb25zOlxuICAgKiAtIGFuIGVsZW1lbnQgaXRzZWxmIGlzIHJlZmVyZW5jZWQsIGV4LjogYDxkaXYgI2Zvbz5gXG4gICAqIC0gYSBjb21wb25lbnQgaXMgcmVmZXJlbmNlZCwgZXguOiBgPG15LWNtcHQgI2Zvbz5gXG4gICAqIC0gYSBkaXJlY3RpdmUgaXMgcmVmZXJlbmNlZCwgZXguOiBgPG15LWNtcHQgI2Zvbz1cImRpcmVjdGl2ZUV4cG9ydEFzXCI+YC5cbiAgICpcbiAgICogQSBnaXZlbiBlbGVtZW50IG1pZ2h0IGhhdmUgZGlmZmVyZW50IGxvY2FsIG5hbWVzIGFuZCB0aG9zZSBuYW1lcyBjYW4gYmUgYXNzb2NpYXRlZFxuICAgKiB3aXRoIGEgZGlyZWN0aXZlLiBXZSBzdG9yZSBsb2NhbCBuYW1lcyBhdCBldmVuIGluZGV4ZXMgd2hpbGUgb2RkIGluZGV4ZXMgYXJlIHJlc2VydmVkXG4gICAqIGZvciBkaXJlY3RpdmUgaW5kZXggaW4gYSB2aWV3IChvciBgLTFgIGlmIHRoZXJlIGlzIG5vIGFzc29jaWF0ZWQgZGlyZWN0aXZlKS5cbiAgICpcbiAgICogU29tZSBleGFtcGxlczpcbiAgICogLSBgPGRpdiAjZm9vPmAgPT4gYFtcImZvb1wiLCAtMV1gXG4gICAqIC0gYDxteS1jbXB0ICNmb28+YCA9PiBgW1wiZm9vXCIsIG15Q21wdElkeF1gXG4gICAqIC0gYDxteS1jbXB0ICNmb28gI2Jhcj1cImRpcmVjdGl2ZUV4cG9ydEFzXCI+YCA9PiBgW1wiZm9vXCIsIG15Q21wdElkeCwgXCJiYXJcIiwgZGlyZWN0aXZlSWR4XWBcbiAgICogLSBgPGRpdiAjZm9vICNiYXI9XCJkaXJlY3RpdmVFeHBvcnRBc1wiPmAgPT4gYFtcImZvb1wiLCAtMSwgXCJiYXJcIiwgZGlyZWN0aXZlSWR4XWBcbiAgICovXG4gIGxvY2FsTmFtZXM6IChzdHJpbmd8bnVtYmVyKVtdfG51bGw7XG5cbiAgLyoqIEluZm9ybWF0aW9uIGFib3V0IGlucHV0IHByb3BlcnRpZXMgdGhhdCBuZWVkIHRvIGJlIHNldCBvbmNlIGZyb20gYXR0cmlidXRlIGRhdGEuICovXG4gIGluaXRpYWxJbnB1dHM6IEluaXRpYWxJbnB1dERhdGF8bnVsbHx1bmRlZmluZWQ7XG5cbiAgLyoqXG4gICAqIElucHV0IGRhdGEgZm9yIGFsbCBkaXJlY3RpdmVzIG9uIHRoaXMgbm9kZS5cbiAgICpcbiAgICogLSBgdW5kZWZpbmVkYCBtZWFucyB0aGF0IHRoZSBwcm9wIGhhcyBub3QgYmVlbiBpbml0aWFsaXplZCB5ZXQsXG4gICAqIC0gYG51bGxgIG1lYW5zIHRoYXQgdGhlIHByb3AgaGFzIGJlZW4gaW5pdGlhbGl6ZWQgYnV0IG5vIGlucHV0cyBoYXZlIGJlZW4gZm91bmQuXG4gICAqL1xuICBpbnB1dHM6IFByb3BlcnR5QWxpYXNlc3xudWxsfHVuZGVmaW5lZDtcblxuICAvKipcbiAgICogT3V0cHV0IGRhdGEgZm9yIGFsbCBkaXJlY3RpdmVzIG9uIHRoaXMgbm9kZS5cbiAgICpcbiAgICogLSBgdW5kZWZpbmVkYCBtZWFucyB0aGF0IHRoZSBwcm9wIGhhcyBub3QgYmVlbiBpbml0aWFsaXplZCB5ZXQsXG4gICAqIC0gYG51bGxgIG1lYW5zIHRoYXQgdGhlIHByb3AgaGFzIGJlZW4gaW5pdGlhbGl6ZWQgYnV0IG5vIG91dHB1dHMgaGF2ZSBiZWVuIGZvdW5kLlxuICAgKi9cbiAgb3V0cHV0czogUHJvcGVydHlBbGlhc2VzfG51bGx8dW5kZWZpbmVkO1xuXG4gIC8qKlxuICAgKiBUaGUgVFZpZXcgb3IgVFZpZXdzIGF0dGFjaGVkIHRvIHRoaXMgbm9kZS5cbiAgICpcbiAgICogSWYgdGhpcyBUTm9kZSBjb3JyZXNwb25kcyB0byBhbiBMQ29udGFpbmVyTm9kZSB3aXRoIGlubGluZSB2aWV3cywgdGhlIGNvbnRhaW5lciB3aWxsXG4gICAqIG5lZWQgdG8gc3RvcmUgc2VwYXJhdGUgc3RhdGljIGRhdGEgZm9yIGVhY2ggb2YgaXRzIHZpZXcgYmxvY2tzIChUVmlld1tdKS4gT3RoZXJ3aXNlLFxuICAgKiBub2RlcyBpbiBpbmxpbmUgdmlld3Mgd2l0aCB0aGUgc2FtZSBpbmRleCBhcyBub2RlcyBpbiB0aGVpciBwYXJlbnQgdmlld3Mgd2lsbCBvdmVyd3JpdGVcbiAgICogZWFjaCBvdGhlciwgYXMgdGhleSBhcmUgaW4gdGhlIHNhbWUgdGVtcGxhdGUuXG4gICAqXG4gICAqIEVhY2ggaW5kZXggaW4gdGhpcyBhcnJheSBjb3JyZXNwb25kcyB0byB0aGUgc3RhdGljIGRhdGEgZm9yIGEgY2VydGFpblxuICAgKiB2aWV3LiBTbyBpZiB5b3UgaGFkIFYoMCkgYW5kIFYoMSkgaW4gYSBjb250YWluZXIsIHlvdSBtaWdodCBoYXZlOlxuICAgKlxuICAgKiBbXG4gICAqICAgW3t0YWdOYW1lOiAnZGl2JywgYXR0cnM6IC4uLn0sIG51bGxdLCAgICAgLy8gVigwKSBUVmlld1xuICAgKiAgIFt7dGFnTmFtZTogJ2J1dHRvbicsIGF0dHJzIC4uLn0sIG51bGxdICAgIC8vIFYoMSkgVFZpZXdcbiAgICpcbiAgICogSWYgdGhpcyBUTm9kZSBjb3JyZXNwb25kcyB0byBhbiBMQ29udGFpbmVyTm9kZSB3aXRoIGEgdGVtcGxhdGUgKGUuZy4gc3RydWN0dXJhbFxuICAgKiBkaXJlY3RpdmUpLCB0aGUgdGVtcGxhdGUncyBUVmlldyB3aWxsIGJlIHN0b3JlZCBoZXJlLlxuICAgKlxuICAgKiBJZiB0aGlzIFROb2RlIGNvcnJlc3BvbmRzIHRvIGFuIExFbGVtZW50Tm9kZSwgdFZpZXdzIHdpbGwgYmUgbnVsbCAuXG4gICAqL1xuICB0Vmlld3M6IFRWaWV3fFRWaWV3W118bnVsbDtcblxuICAvKipcbiAgICogVGhlIG5leHQgc2libGluZyBub2RlLiBOZWNlc3Nhcnkgc28gd2UgY2FuIHByb3BhZ2F0ZSB0aHJvdWdoIHRoZSByb290IG5vZGVzIG9mIGEgdmlld1xuICAgKiB0byBpbnNlcnQgdGhlbSBvciByZW1vdmUgdGhlbSBmcm9tIHRoZSBET00uXG4gICAqL1xuICBuZXh0OiBUTm9kZXxudWxsO1xuXG4gIC8qKlxuICAgKiBGaXJzdCBjaGlsZCBvZiB0aGUgY3VycmVudCBub2RlLlxuICAgKlxuICAgKiBGb3IgY29tcG9uZW50IG5vZGVzLCB0aGUgY2hpbGQgd2lsbCBhbHdheXMgYmUgYSBDb250ZW50Q2hpbGQgKGluIHNhbWUgdmlldykuXG4gICAqIEZvciBlbWJlZGRlZCB2aWV3IG5vZGVzLCB0aGUgY2hpbGQgd2lsbCBiZSBpbiB0aGVpciBjaGlsZCB2aWV3LlxuICAgKi9cbiAgY2hpbGQ6IFROb2RlfG51bGw7XG5cbiAgLyoqXG4gICAqIFBhcmVudCBub2RlIChpbiB0aGUgc2FtZSB2aWV3IG9ubHkpLlxuICAgKlxuICAgKiBXZSBuZWVkIGEgcmVmZXJlbmNlIHRvIGEgbm9kZSdzIHBhcmVudCBzbyB3ZSBjYW4gYXBwZW5kIHRoZSBub2RlIHRvIGl0cyBwYXJlbnQncyBuYXRpdmVcbiAgICogZWxlbWVudCBhdCB0aGUgYXBwcm9wcmlhdGUgdGltZS5cbiAgICpcbiAgICogSWYgdGhlIHBhcmVudCB3b3VsZCBiZSBpbiBhIGRpZmZlcmVudCB2aWV3IChlLmcuIGNvbXBvbmVudCBob3N0KSwgdGhpcyBwcm9wZXJ0eSB3aWxsIGJlIG51bGwuXG4gICAqIEl0J3MgaW1wb3J0YW50IHRoYXQgd2UgZG9uJ3QgdHJ5IHRvIGNyb3NzIGNvbXBvbmVudCBib3VuZGFyaWVzIHdoZW4gcmV0cmlldmluZyB0aGUgcGFyZW50XG4gICAqIGJlY2F1c2UgdGhlIHBhcmVudCB3aWxsIGNoYW5nZSAoZS5nLiBpbmRleCwgYXR0cnMpIGRlcGVuZGluZyBvbiB3aGVyZSB0aGUgY29tcG9uZW50IHdhc1xuICAgKiB1c2VkIChhbmQgdGh1cyBzaG91bGRuJ3QgYmUgc3RvcmVkIG9uIFROb2RlKS4gSW4gdGhlc2UgY2FzZXMsIHdlIHJldHJpZXZlIHRoZSBwYXJlbnQgdGhyb3VnaFxuICAgKiBMVmlldy5ub2RlIGluc3RlYWQgKHdoaWNoIHdpbGwgYmUgaW5zdGFuY2Utc3BlY2lmaWMpLlxuICAgKlxuICAgKiBJZiB0aGlzIGlzIGFuIGlubGluZSB2aWV3IG5vZGUgKFYpLCB0aGUgcGFyZW50IHdpbGwgYmUgaXRzIGNvbnRhaW5lci5cbiAgICovXG4gIHBhcmVudDogVEVsZW1lbnROb2RlfFRDb250YWluZXJOb2RlfG51bGw7XG5cbiAgLyoqXG4gICAqIEEgcG9pbnRlciB0byBhIFRDb250YWluZXJOb2RlIGNyZWF0ZWQgYnkgZGlyZWN0aXZlcyByZXF1ZXN0aW5nIFZpZXdDb250YWluZXJSZWZcbiAgICovXG4gIGR5bmFtaWNDb250YWluZXJOb2RlOiBUTm9kZXxudWxsO1xufVxuXG4vKiogU3RhdGljIGRhdGEgZm9yIGFuIExFbGVtZW50Tm9kZSAgKi9cbmV4cG9ydCBpbnRlcmZhY2UgVEVsZW1lbnROb2RlIGV4dGVuZHMgVE5vZGUge1xuICAvKiogSW5kZXggaW4gdGhlIGRhdGFbXSBhcnJheSAqL1xuICBpbmRleDogbnVtYmVyO1xuICBjaGlsZDogVEVsZW1lbnROb2RlfFRUZXh0Tm9kZXxUQ29udGFpbmVyTm9kZXxUUHJvamVjdGlvbk5vZGV8bnVsbDtcbiAgLyoqXG4gICAqIEVsZW1lbnQgbm9kZXMgd2lsbCBoYXZlIHBhcmVudHMgdW5sZXNzIHRoZXkgYXJlIHRoZSBmaXJzdCBub2RlIG9mIGEgY29tcG9uZW50IG9yXG4gICAqIGVtYmVkZGVkIHZpZXcgKHdoaWNoIG1lYW5zIHRoZWlyIHBhcmVudCBpcyBpbiBhIGRpZmZlcmVudCB2aWV3IGFuZCBtdXN0IGJlXG4gICAqIHJldHJpZXZlZCB1c2luZyBMVmlldy5ub2RlKS5cbiAgICovXG4gIHBhcmVudDogVEVsZW1lbnROb2RlfG51bGw7XG4gIHRWaWV3czogbnVsbDtcbn1cblxuLyoqIFN0YXRpYyBkYXRhIGZvciBhbiBMVGV4dE5vZGUgICovXG5leHBvcnQgaW50ZXJmYWNlIFRUZXh0Tm9kZSBleHRlbmRzIFROb2RlIHtcbiAgLyoqIEluZGV4IGluIHRoZSBkYXRhW10gYXJyYXkgKi9cbiAgaW5kZXg6IG51bWJlcjtcbiAgY2hpbGQ6IG51bGw7XG4gIC8qKlxuICAgKiBUZXh0IG5vZGVzIHdpbGwgaGF2ZSBwYXJlbnRzIHVubGVzcyB0aGV5IGFyZSB0aGUgZmlyc3Qgbm9kZSBvZiBhIGNvbXBvbmVudCBvclxuICAgKiBlbWJlZGRlZCB2aWV3ICh3aGljaCBtZWFucyB0aGVpciBwYXJlbnQgaXMgaW4gYSBkaWZmZXJlbnQgdmlldyBhbmQgbXVzdCBiZVxuICAgKiByZXRyaWV2ZWQgdXNpbmcgTFZpZXcubm9kZSkuXG4gICAqL1xuICBwYXJlbnQ6IFRFbGVtZW50Tm9kZXxudWxsO1xuICB0Vmlld3M6IG51bGw7XG59XG5cbi8qKiBTdGF0aWMgZGF0YSBmb3IgYW4gTENvbnRhaW5lck5vZGUgKi9cbmV4cG9ydCBpbnRlcmZhY2UgVENvbnRhaW5lck5vZGUgZXh0ZW5kcyBUTm9kZSB7XG4gIC8qKlxuICAgKiBJZiBudW1iZXIsIGluZGV4IGluIHRoZSBkYXRhW10gYXJyYXkuXG4gICAqXG4gICAqIElmIG51bGwsIHRoaXMgaXMgYSBkeW5hbWljYWxseSBjcmVhdGVkIGNvbnRhaW5lciBub2RlIHRoYXQgaXNuJ3Qgc3RvcmVkIGluXG4gICAqIGRhdGFbXSAoZS5nLiB3aGVuIHlvdSBpbmplY3QgVmlld0NvbnRhaW5lclJlZikgLlxuICAgKi9cbiAgaW5kZXg6IG51bWJlcnxudWxsO1xuICBjaGlsZDogbnVsbDtcblxuICAvKipcbiAgICogQ29udGFpbmVyIG5vZGVzIHdpbGwgaGF2ZSBwYXJlbnRzIHVubGVzczpcbiAgICpcbiAgICogLSBUaGV5IGFyZSB0aGUgZmlyc3Qgbm9kZSBvZiBhIGNvbXBvbmVudCBvciBlbWJlZGRlZCB2aWV3XG4gICAqIC0gVGhleSBhcmUgZHluYW1pY2FsbHkgY3JlYXRlZFxuICAgKi9cbiAgcGFyZW50OiBURWxlbWVudE5vZGV8bnVsbDtcbiAgdFZpZXdzOiBUVmlld3xUVmlld1tdfG51bGw7XG59XG5cbi8qKiBTdGF0aWMgZGF0YSBmb3IgYW4gTFZpZXdOb2RlICAqL1xuZXhwb3J0IGludGVyZmFjZSBUVmlld05vZGUgZXh0ZW5kcyBUTm9kZSB7XG4gIC8qKiBJZiBudWxsLCBpdCdzIGEgZHluYW1pY2FsbHkgY3JlYXRlZCB2aWV3Ki9cbiAgaW5kZXg6IG51bWJlcnxudWxsO1xuICBjaGlsZDogVEVsZW1lbnROb2RlfFRUZXh0Tm9kZXxUQ29udGFpbmVyTm9kZXxUUHJvamVjdGlvbk5vZGV8bnVsbDtcbiAgcGFyZW50OiBUQ29udGFpbmVyTm9kZXxudWxsO1xuICB0Vmlld3M6IG51bGw7XG59XG5cbi8qKiBTdGF0aWMgZGF0YSBmb3IgYW4gTFByb2plY3Rpb25Ob2RlICAqL1xuZXhwb3J0IGludGVyZmFjZSBUUHJvamVjdGlvbk5vZGUgZXh0ZW5kcyBUTm9kZSB7XG4gIC8qKiBJbmRleCBpbiB0aGUgZGF0YVtdIGFycmF5ICovXG4gIGNoaWxkOiBudWxsO1xuICAvKipcbiAgICogUHJvamVjdGlvbiBub2RlcyB3aWxsIGhhdmUgcGFyZW50cyB1bmxlc3MgdGhleSBhcmUgdGhlIGZpcnN0IG5vZGUgb2YgYSBjb21wb25lbnRcbiAgICogb3IgZW1iZWRkZWQgdmlldyAod2hpY2ggbWVhbnMgdGhlaXIgcGFyZW50IGlzIGluIGEgZGlmZmVyZW50IHZpZXcgYW5kIG11c3QgYmVcbiAgICogcmV0cmlldmVkIHVzaW5nIExWaWV3Lm5vZGUpLlxuICAgKi9cbiAgcGFyZW50OiBURWxlbWVudE5vZGV8bnVsbDtcbiAgdFZpZXdzOiBudWxsO1xufVxuXG4vKipcbiAqIFRoaXMgbWFwcGluZyBpcyBuZWNlc3Nhcnkgc28gd2UgY2FuIHNldCBpbnB1dCBwcm9wZXJ0aWVzIGFuZCBvdXRwdXQgbGlzdGVuZXJzXG4gKiBwcm9wZXJseSBhdCBydW50aW1lIHdoZW4gcHJvcGVydHkgbmFtZXMgYXJlIG1pbmlmaWVkIG9yIGFsaWFzZWQuXG4gKlxuICogS2V5OiB1bm1pbmlmaWVkIC8gcHVibGljIGlucHV0IG9yIG91dHB1dCBuYW1lXG4gKiBWYWx1ZTogYXJyYXkgY29udGFpbmluZyBtaW5pZmllZCAvIGludGVybmFsIG5hbWUgYW5kIHJlbGF0ZWQgZGlyZWN0aXZlIGluZGV4XG4gKlxuICogVGhlIHZhbHVlIG11c3QgYmUgYW4gYXJyYXkgdG8gc3VwcG9ydCBpbnB1dHMgYW5kIG91dHB1dHMgd2l0aCB0aGUgc2FtZSBuYW1lXG4gKiBvbiB0aGUgc2FtZSBub2RlLlxuICovXG5leHBvcnQgdHlwZSBQcm9wZXJ0eUFsaWFzZXMgPSB7XG4gIC8vIFRoaXMgdXNlcyBhbiBvYmplY3QgbWFwIGJlY2F1c2UgdXNpbmcgdGhlIE1hcCB0eXBlIHdvdWxkIGJlIHRvbyBzbG93XG4gIFtrZXk6IHN0cmluZ106IFByb3BlcnR5QWxpYXNWYWx1ZVxufTtcblxuLyoqXG4gKiBTdG9yZSB0aGUgcnVudGltZSBpbnB1dCBvciBvdXRwdXQgbmFtZXMgZm9yIGFsbCB0aGUgZGlyZWN0aXZlcy5cbiAqXG4gKiAtIEV2ZW4gaW5kaWNlczogZGlyZWN0aXZlIGluZGV4XG4gKiAtIE9kZCBpbmRpY2VzOiBtaW5pZmllZCAvIGludGVybmFsIG5hbWVcbiAqXG4gKiBlLmcuIFswLCAnY2hhbmdlLW1pbmlmaWVkJ11cbiAqL1xuZXhwb3J0IHR5cGUgUHJvcGVydHlBbGlhc1ZhbHVlID0gKG51bWJlciB8IHN0cmluZylbXTtcblxuXG4vKipcbiAqIFRoaXMgYXJyYXkgY29udGFpbnMgaW5mb3JtYXRpb24gYWJvdXQgaW5wdXQgcHJvcGVydGllcyB0aGF0XG4gKiBuZWVkIHRvIGJlIHNldCBvbmNlIGZyb20gYXR0cmlidXRlIGRhdGEuIEl0J3Mgb3JkZXJlZCBieVxuICogZGlyZWN0aXZlIGluZGV4IChyZWxhdGl2ZSB0byBlbGVtZW50KSBzbyBpdCdzIHNpbXBsZSB0b1xuICogbG9vayB1cCBhIHNwZWNpZmljIGRpcmVjdGl2ZSdzIGluaXRpYWwgaW5wdXQgZGF0YS5cbiAqXG4gKiBXaXRoaW4gZWFjaCBzdWItYXJyYXk6XG4gKlxuICogRXZlbiBpbmRpY2VzOiBtaW5pZmllZC9pbnRlcm5hbCBpbnB1dCBuYW1lXG4gKiBPZGQgaW5kaWNlczogaW5pdGlhbCB2YWx1ZVxuICpcbiAqIElmIGEgZGlyZWN0aXZlIG9uIGEgbm9kZSBkb2VzIG5vdCBoYXZlIGFueSBpbnB1dCBwcm9wZXJ0aWVzXG4gKiB0aGF0IHNob3VsZCBiZSBzZXQgZnJvbSBhdHRyaWJ1dGVzLCBpdHMgaW5kZXggaXMgc2V0IHRvIG51bGxcbiAqIHRvIGF2b2lkIGEgc3BhcnNlIGFycmF5LlxuICpcbiAqIGUuZy4gW251bGwsIFsncm9sZS1taW4nLCAnYnV0dG9uJ11dXG4gKi9cbmV4cG9ydCB0eXBlIEluaXRpYWxJbnB1dERhdGEgPSAoSW5pdGlhbElucHV0cyB8IG51bGwpW107XG5cbi8qKlxuICogVXNlZCBieSBJbml0aWFsSW5wdXREYXRhIHRvIHN0b3JlIGlucHV0IHByb3BlcnRpZXNcbiAqIHRoYXQgc2hvdWxkIGJlIHNldCBvbmNlIGZyb20gYXR0cmlidXRlcy5cbiAqXG4gKiBFdmVuIGluZGljZXM6IG1pbmlmaWVkL2ludGVybmFsIGlucHV0IG5hbWVcbiAqIE9kZCBpbmRpY2VzOiBpbml0aWFsIHZhbHVlXG4gKlxuICogZS5nLiBbJ3JvbGUtbWluJywgJ2J1dHRvbiddXG4gKi9cbmV4cG9ydCB0eXBlIEluaXRpYWxJbnB1dHMgPSBzdHJpbmdbXTtcblxuLy8gTm90ZTogVGhpcyBoYWNrIGlzIG5lY2Vzc2FyeSBzbyB3ZSBkb24ndCBlcnJvbmVvdXNseSBnZXQgYSBjaXJjdWxhciBkZXBlbmRlbmN5XG4vLyBmYWlsdXJlIGJhc2VkIG9uIHR5cGVzLlxuZXhwb3J0IGNvbnN0IHVudXNlZFZhbHVlRXhwb3J0VG9QbGFjYXRlQWpkID0gMTtcbiJdfQ==