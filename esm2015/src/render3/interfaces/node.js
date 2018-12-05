/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/** @enum {number} */
var TNodeType = {
    Container: 0,
    Projection: 1,
    View: 2,
    Element: 3,
    ViewOrElement: 2,
    ElementContainer: 4,
    IcuContainer: 5,
};
export { TNodeType };
/** @enum {number} */
var TNodeFlags = {
    /** This bit is set if the node is a component */
    isComponent: 1,
    /** This bit is set if the node has been projected */
    isProjected: 2,
    /** This bit is set if the node has any content queries */
    hasContentQuery: 4,
    /** This bit is set if the node has any directives that contain [class properties */
    hasClassInput: 8,
};
export { TNodeFlags };
/** @enum {number} */
var TNodeProviderIndexes = {
    /** The index of the first provider on this node is encoded on the least significant bits */
    ProvidersStartIndexMask: 65535,
    /** The count of view providers from the component on this node is encoded on the 16 most
         significant bits */
    CptViewProvidersCountShift: 16,
    CptViewProvidersCountShifter: 65536,
};
export { TNodeProviderIndexes };
/** @enum {number} */
var AttributeMarker = {
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
/** @typedef {?} */
var TAttributes;
export { TAttributes };
/**
 * Binding data (flyweight) for a particular node that is shared between all templates
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
/**
 * The type of the TNode. See TNodeType.
 * @type {?}
 */
TNode.prototype.type;
/**
 * Index of the TNode in TView.data and corresponding native element in LView.
 *
 * This is necessary to get from any TNode to its corresponding native element when
 * traversing the node tree.
 *
 * If index is -1, this is a dynamically created container node or embedded view node.
 * @type {?}
 */
TNode.prototype.index;
/**
 * The index of the closest injector in this node's LView.
 *
 * If the index === -1, there is no injector on this node or any ancestor node in this view.
 *
 * If the index !== -1, it is the index of this node's injector OR the index of a parent injector
 * in the same view. We pass the parent injector index down the node tree of a view so it's
 * possible to find the parent injector without walking a potentially deep node tree. Injector
 * indices are not set across view boundaries because there could be multiple component hosts.
 *
 * If tNode.injectorIndex === tNode.parent.injectorIndex, then the index belongs to a parent
 * injector.
 * @type {?}
 */
TNode.prototype.injectorIndex;
/**
 * Stores starting index of the directives.
 * @type {?}
 */
TNode.prototype.directiveStart;
/**
 * Stores final exclusive index of the directives.
 * @type {?}
 */
TNode.prototype.directiveEnd;
/**
 * Stores if Node isComponent, isProjected, hasContentQuery and hasClassInput
 * @type {?}
 */
TNode.prototype.flags;
/**
 * This number stores two values using its bits:
 *
 * - the index of the first provider on that node (first 16 bits)
 * - the count of view providers from the component on this node (last 16 bits)
 * @type {?}
 */
TNode.prototype.providerIndexes;
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
 * If this TNode corresponds to an LContainer with inline views, the container will
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
 * If this TNode corresponds to an LContainer with a template (e.g. structural
 * directive), the template's TView will be stored here.
 *
 * If this TNode corresponds to an element, tViews will be null .
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
 * If this node is part of an i18n block, it indicates whether this node is part of the DOM.
 * If this node is not part of an i18n block, this field is null.
 * @type {?}
 */
TNode.prototype.detached;
/** @type {?} */
TNode.prototype.stylingTemplate;
/**
 * List of projected TNodes for a given component host element OR index into the said nodes.
 *
 * For easier discussion assume this example:
 * `<parent>`'s view definition:
 * ```
 * <child id="c1">content1</child>
 * <child id="c2"><span>content2</span></child>
 * ```
 * `<child>`'s view definition:
 * ```
 * <ng-content id="cont1"></ng-content>
 * ```
 *
 * If `Array.isArray(projection)` then `TNode` is a host element:
 * - `projection` stores the content nodes which are to be projected.
 *    - The nodes represent categories defined by the selector: For example:
 *      `<ng-content/><ng-content select="abc"/>` would represent the heads for `<ng-content/>`
 *      and `<ng-content select="abc"/>` respectively.
 *    - The nodes we store in `projection` are heads only, we used `.next` to get their
 *      siblings.
 *    - The nodes `.next` is sorted/rewritten as part of the projection setup.
 *    - `projection` size is equal to the number of projections `<ng-content>`. The size of
 *      `c1` will be `1` because `<child>` has only one `<ng-content>`.
 * - we store `projection` with the host (`c1`, `c2`) rather than the `<ng-content>` (`cont1`)
 *   because the same component (`<child>`) can be used in multiple locations (`c1`, `c2`) and as
 *   a result have different set of nodes to project.
 * - without `projection` it would be difficult to efficiently traverse nodes to be projected.
 *
 * If `typeof projection == 'number'` then `TNode` is a `<ng-content>` element:
 * - `projection` is an index of the host's `projection`Nodes.
 *   - This would return the first head node to project:
 *     `getHost(currentTNode).projection[currentTNode.projection]`.
 * - When projecting nodes the parent node retrieved may be a `<ng-content>` node, in which case
 *   the process is recursive in nature (not implementation).
 * @type {?}
 */
TNode.prototype.projection;
/**
 * Static data for an element
 * @record
 */
export function TElementNode() { }
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
 * retrieved using viewData[HOST_NODE]).
 * @type {?}
 */
TElementNode.prototype.parent;
/** @type {?} */
TElementNode.prototype.tViews;
/**
 * If this is a component TNode with projection, this will be an array of projected
 * TNodes (see TNode.projection for more info). If it's a regular element node or a
 * component without projection, it will be null.
 * @type {?}
 */
TElementNode.prototype.projection;
/**
 * Static data for a text node
 * @record
 */
export function TTextNode() { }
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
/** @type {?} */
TTextNode.prototype.projection;
/**
 * Static data for an LContainer
 * @record
 */
export function TContainerNode() { }
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
/** @type {?} */
TContainerNode.prototype.projection;
/**
 * Static data for an <ng-container>
 * @record
 */
export function TElementContainerNode() { }
/**
 * Index in the LView[] array.
 * @type {?}
 */
TElementContainerNode.prototype.index;
/** @type {?} */
TElementContainerNode.prototype.child;
/** @type {?} */
TElementContainerNode.prototype.parent;
/** @type {?} */
TElementContainerNode.prototype.tViews;
/** @type {?} */
TElementContainerNode.prototype.projection;
/**
 * Static data for an ICU expression
 * @record
 */
export function TIcuContainerNode() { }
/**
 * Index in the LView[] array.
 * @type {?}
 */
TIcuContainerNode.prototype.index;
/** @type {?} */
TIcuContainerNode.prototype.child;
/** @type {?} */
TIcuContainerNode.prototype.parent;
/** @type {?} */
TIcuContainerNode.prototype.tViews;
/** @type {?} */
TIcuContainerNode.prototype.projection;
/**
 * Indicates the current active case for an ICU expression.
 * It is null when there is no active case.
 * @type {?}
 */
TIcuContainerNode.prototype.activeCaseIndex;
/**
 * Static data for a view
 * @record
 */
export function TViewNode() { }
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
/** @type {?} */
TViewNode.prototype.projection;
/**
 * Static data for an LProjectionNode
 * @record
 */
export function TProjectionNode() { }
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
/**
 * Index of the projection node. (See TNode.projection for more info.)
 * @type {?}
 */
TProjectionNode.prototype.projection;
/** @typedef {?} */
var PropertyAliases;
export { PropertyAliases };
/** @typedef {?} */
var PropertyAliasValue;
export { PropertyAliasValue };
/** @typedef {?} */
var InitialInputData;
export { InitialInputData };
/** @typedef {?} */
var InitialInputs;
export { InitialInputs };
/** @type {?} */
export const unusedValueExportToPlacateAjd = 1;
/** @typedef {?} */
var TNodeWithLocalRefs;
export { TNodeWithLocalRefs };
/** @typedef {?} */
var LocalRefExtractor;
export { LocalRefExtractor };

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9kZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaW50ZXJmYWNlcy9ub2RlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7SUFpQkUsWUFBaUI7SUFDakIsYUFBa0I7SUFDbEIsT0FBWTtJQUNaLFVBQWU7SUFDZixnQkFBcUI7SUFDckIsbUJBQXdCO0lBQ3hCLGVBQW9COzs7Ozs7SUFRcEIsY0FBb0I7O0lBR3BCLGNBQW9COztJQUdwQixrQkFBd0I7O0lBR3hCLGdCQUFzQjs7Ozs7O0lBUXRCLDhCQUE0RDs7O0lBSTVELDhCQUErQjtJQUMvQixtQ0FBaUU7Ozs7Ozs7Ozs7SUFZakUsZUFBZ0I7Ozs7Ozs7SUFRaEIsYUFBYzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQTRZaEIsYUFBYSw2QkFBNkIsR0FBRyxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7U3R5bGluZ0NvbnRleHR9IGZyb20gJy4vc3R5bGluZyc7XG5pbXBvcnQge0xWaWV3LCBUVmlld30gZnJvbSAnLi92aWV3JztcblxuXG4vKipcbiAqIFROb2RlVHlwZSBjb3JyZXNwb25kcyB0byB0aGUgVE5vZGUudHlwZSBwcm9wZXJ0eS4gSXQgY29udGFpbnMgaW5mb3JtYXRpb25cbiAqIG9uIGhvdyB0byBtYXAgYSBwYXJ0aWN1bGFyIHNldCBvZiBiaXRzIGluIFROb2RlLmZsYWdzIHRvIHRoZSBub2RlIHR5cGUuXG4gKi9cbmV4cG9ydCBjb25zdCBlbnVtIFROb2RlVHlwZSB7XG4gIENvbnRhaW5lciA9IDBiMDAwLFxuICBQcm9qZWN0aW9uID0gMGIwMDEsXG4gIFZpZXcgPSAwYjAxMCxcbiAgRWxlbWVudCA9IDBiMDExLFxuICBWaWV3T3JFbGVtZW50ID0gMGIwMTAsXG4gIEVsZW1lbnRDb250YWluZXIgPSAwYjEwMCxcbiAgSWN1Q29udGFpbmVyID0gMGIxMDEsXG59XG5cbi8qKlxuICogQ29ycmVzcG9uZHMgdG8gdGhlIFROb2RlLmZsYWdzIHByb3BlcnR5LlxuICovXG5leHBvcnQgY29uc3QgZW51bSBUTm9kZUZsYWdzIHtcbiAgLyoqIFRoaXMgYml0IGlzIHNldCBpZiB0aGUgbm9kZSBpcyBhIGNvbXBvbmVudCAqL1xuICBpc0NvbXBvbmVudCA9IDBiMDAwMSxcblxuICAvKiogVGhpcyBiaXQgaXMgc2V0IGlmIHRoZSBub2RlIGhhcyBiZWVuIHByb2plY3RlZCAqL1xuICBpc1Byb2plY3RlZCA9IDBiMDAxMCxcblxuICAvKiogVGhpcyBiaXQgaXMgc2V0IGlmIHRoZSBub2RlIGhhcyBhbnkgY29udGVudCBxdWVyaWVzICovXG4gIGhhc0NvbnRlbnRRdWVyeSA9IDBiMDEwMCxcblxuICAvKiogVGhpcyBiaXQgaXMgc2V0IGlmIHRoZSBub2RlIGhhcyBhbnkgZGlyZWN0aXZlcyB0aGF0IGNvbnRhaW4gW2NsYXNzIHByb3BlcnRpZXMgKi9cbiAgaGFzQ2xhc3NJbnB1dCA9IDBiMTAwMCxcbn1cblxuLyoqXG4gKiBDb3JyZXNwb25kcyB0byB0aGUgVE5vZGUucHJvdmlkZXJJbmRleGVzIHByb3BlcnR5LlxuICovXG5leHBvcnQgY29uc3QgZW51bSBUTm9kZVByb3ZpZGVySW5kZXhlcyB7XG4gIC8qKiBUaGUgaW5kZXggb2YgdGhlIGZpcnN0IHByb3ZpZGVyIG9uIHRoaXMgbm9kZSBpcyBlbmNvZGVkIG9uIHRoZSBsZWFzdCBzaWduaWZpY2FudCBiaXRzICovXG4gIFByb3ZpZGVyc1N0YXJ0SW5kZXhNYXNrID0gMGIwMDAwMDAwMDAwMDAwMDAwMTExMTExMTExMTExMTExMSxcblxuICAvKiogVGhlIGNvdW50IG9mIHZpZXcgcHJvdmlkZXJzIGZyb20gdGhlIGNvbXBvbmVudCBvbiB0aGlzIG5vZGUgaXMgZW5jb2RlZCBvbiB0aGUgMTYgbW9zdFxuICAgICBzaWduaWZpY2FudCBiaXRzICovXG4gIENwdFZpZXdQcm92aWRlcnNDb3VudFNoaWZ0ID0gMTYsXG4gIENwdFZpZXdQcm92aWRlcnNDb3VudFNoaWZ0ZXIgPSAwYjAwMDAwMDAwMDAwMDAwMDEwMDAwMDAwMDAwMDAwMDAwLFxufVxuLyoqXG4gKiBBIHNldCBvZiBtYXJrZXIgdmFsdWVzIHRvIGJlIHVzZWQgaW4gdGhlIGF0dHJpYnV0ZXMgYXJyYXlzLiBUaG9zZSBtYXJrZXJzIGluZGljYXRlIHRoYXQgc29tZVxuICogaXRlbXMgYXJlIG5vdCByZWd1bGFyIGF0dHJpYnV0ZXMgYW5kIHRoZSBwcm9jZXNzaW5nIHNob3VsZCBiZSBhZGFwdGVkIGFjY29yZGluZ2x5LlxuICovXG5leHBvcnQgY29uc3QgZW51bSBBdHRyaWJ1dGVNYXJrZXIge1xuICAvKipcbiAgICogTWFya2VyIGluZGljYXRlcyB0aGF0IHRoZSBmb2xsb3dpbmcgMyB2YWx1ZXMgaW4gdGhlIGF0dHJpYnV0ZXMgYXJyYXkgYXJlOlxuICAgKiBuYW1lc3BhY2VVcmksIGF0dHJpYnV0ZU5hbWUsIGF0dHJpYnV0ZVZhbHVlXG4gICAqIGluIHRoYXQgb3JkZXIuXG4gICAqL1xuICBOYW1lc3BhY2VVUkkgPSAwLFxuXG4gIC8qKlxuICAgKiBUaGlzIG1hcmtlciBpbmRpY2F0ZXMgdGhhdCB0aGUgZm9sbG93aW5nIGF0dHJpYnV0ZSBuYW1lcyB3ZXJlIGV4dHJhY3RlZCBmcm9tIGJpbmRpbmdzIChleC46XG4gICAqIFtmb29dPVwiZXhwXCIpIGFuZCAvIG9yIGV2ZW50IGhhbmRsZXJzIChleC4gKGJhcik9XCJkb1N0aCgpXCIpLlxuICAgKiBUYWtpbmcgdGhlIGFib3ZlIGJpbmRpbmdzIGFuZCBvdXRwdXRzIGFzIGFuIGV4YW1wbGUgYW4gYXR0cmlidXRlcyBhcnJheSBjb3VsZCBsb29rIGFzIGZvbGxvd3M6XG4gICAqIFsnY2xhc3MnLCAnZmFkZSBpbicsIEF0dHJpYnV0ZU1hcmtlci5TZWxlY3RPbmx5LCAnZm9vJywgJ2JhciddXG4gICAqL1xuICBTZWxlY3RPbmx5ID0gMVxufVxuXG4vKipcbiAqIEEgY29tYmluYXRpb24gb2Y6XG4gKiAtIGF0dHJpYnV0ZSBuYW1lcyBhbmQgdmFsdWVzXG4gKiAtIHNwZWNpYWwgbWFya2VycyBhY3RpbmcgYXMgZmxhZ3MgdG8gYWx0ZXIgYXR0cmlidXRlcyBwcm9jZXNzaW5nLlxuICovXG5leHBvcnQgdHlwZSBUQXR0cmlidXRlcyA9IChzdHJpbmcgfCBBdHRyaWJ1dGVNYXJrZXIpW107XG5cbi8qKlxuICogQmluZGluZyBkYXRhIChmbHl3ZWlnaHQpIGZvciBhIHBhcnRpY3VsYXIgbm9kZSB0aGF0IGlzIHNoYXJlZCBiZXR3ZWVuIGFsbCB0ZW1wbGF0ZXNcbiAqIG9mIGEgc3BlY2lmaWMgdHlwZS5cbiAqXG4gKiBJZiBhIHByb3BlcnR5IGlzOlxuICogICAgLSBQcm9wZXJ0eUFsaWFzZXM6IHRoYXQgcHJvcGVydHkncyBkYXRhIHdhcyBnZW5lcmF0ZWQgYW5kIHRoaXMgaXMgaXRcbiAqICAgIC0gTnVsbDogdGhhdCBwcm9wZXJ0eSdzIGRhdGEgd2FzIGFscmVhZHkgZ2VuZXJhdGVkIGFuZCBub3RoaW5nIHdhcyBmb3VuZC5cbiAqICAgIC0gVW5kZWZpbmVkOiB0aGF0IHByb3BlcnR5J3MgZGF0YSBoYXMgbm90IHlldCBiZWVuIGdlbmVyYXRlZFxuICpcbiAqIHNlZTogaHR0cHM6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvRmx5d2VpZ2h0X3BhdHRlcm4gZm9yIG1vcmUgb24gdGhlIEZseXdlaWdodCBwYXR0ZXJuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgVE5vZGUge1xuICAvKiogVGhlIHR5cGUgb2YgdGhlIFROb2RlLiBTZWUgVE5vZGVUeXBlLiAqL1xuICB0eXBlOiBUTm9kZVR5cGU7XG5cbiAgLyoqXG4gICAqIEluZGV4IG9mIHRoZSBUTm9kZSBpbiBUVmlldy5kYXRhIGFuZCBjb3JyZXNwb25kaW5nIG5hdGl2ZSBlbGVtZW50IGluIExWaWV3LlxuICAgKlxuICAgKiBUaGlzIGlzIG5lY2Vzc2FyeSB0byBnZXQgZnJvbSBhbnkgVE5vZGUgdG8gaXRzIGNvcnJlc3BvbmRpbmcgbmF0aXZlIGVsZW1lbnQgd2hlblxuICAgKiB0cmF2ZXJzaW5nIHRoZSBub2RlIHRyZWUuXG4gICAqXG4gICAqIElmIGluZGV4IGlzIC0xLCB0aGlzIGlzIGEgZHluYW1pY2FsbHkgY3JlYXRlZCBjb250YWluZXIgbm9kZSBvciBlbWJlZGRlZCB2aWV3IG5vZGUuXG4gICAqL1xuICBpbmRleDogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBUaGUgaW5kZXggb2YgdGhlIGNsb3Nlc3QgaW5qZWN0b3IgaW4gdGhpcyBub2RlJ3MgTFZpZXcuXG4gICAqXG4gICAqIElmIHRoZSBpbmRleCA9PT0gLTEsIHRoZXJlIGlzIG5vIGluamVjdG9yIG9uIHRoaXMgbm9kZSBvciBhbnkgYW5jZXN0b3Igbm9kZSBpbiB0aGlzIHZpZXcuXG4gICAqXG4gICAqIElmIHRoZSBpbmRleCAhPT0gLTEsIGl0IGlzIHRoZSBpbmRleCBvZiB0aGlzIG5vZGUncyBpbmplY3RvciBPUiB0aGUgaW5kZXggb2YgYSBwYXJlbnQgaW5qZWN0b3JcbiAgICogaW4gdGhlIHNhbWUgdmlldy4gV2UgcGFzcyB0aGUgcGFyZW50IGluamVjdG9yIGluZGV4IGRvd24gdGhlIG5vZGUgdHJlZSBvZiBhIHZpZXcgc28gaXQnc1xuICAgKiBwb3NzaWJsZSB0byBmaW5kIHRoZSBwYXJlbnQgaW5qZWN0b3Igd2l0aG91dCB3YWxraW5nIGEgcG90ZW50aWFsbHkgZGVlcCBub2RlIHRyZWUuIEluamVjdG9yXG4gICAqIGluZGljZXMgYXJlIG5vdCBzZXQgYWNyb3NzIHZpZXcgYm91bmRhcmllcyBiZWNhdXNlIHRoZXJlIGNvdWxkIGJlIG11bHRpcGxlIGNvbXBvbmVudCBob3N0cy5cbiAgICpcbiAgICogSWYgdE5vZGUuaW5qZWN0b3JJbmRleCA9PT0gdE5vZGUucGFyZW50LmluamVjdG9ySW5kZXgsIHRoZW4gdGhlIGluZGV4IGJlbG9uZ3MgdG8gYSBwYXJlbnRcbiAgICogaW5qZWN0b3IuXG4gICAqL1xuICBpbmplY3RvckluZGV4OiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIFN0b3JlcyBzdGFydGluZyBpbmRleCBvZiB0aGUgZGlyZWN0aXZlcy5cbiAgICovXG4gIGRpcmVjdGl2ZVN0YXJ0OiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIFN0b3JlcyBmaW5hbCBleGNsdXNpdmUgaW5kZXggb2YgdGhlIGRpcmVjdGl2ZXMuXG4gICAqL1xuICBkaXJlY3RpdmVFbmQ6IG51bWJlcjtcblxuICAvKipcbiAgICogU3RvcmVzIGlmIE5vZGUgaXNDb21wb25lbnQsIGlzUHJvamVjdGVkLCBoYXNDb250ZW50UXVlcnkgYW5kIGhhc0NsYXNzSW5wdXRcbiAgICovXG4gIGZsYWdzOiBUTm9kZUZsYWdzO1xuXG4gIC8qKlxuICAgKiBUaGlzIG51bWJlciBzdG9yZXMgdHdvIHZhbHVlcyB1c2luZyBpdHMgYml0czpcbiAgICpcbiAgICogLSB0aGUgaW5kZXggb2YgdGhlIGZpcnN0IHByb3ZpZGVyIG9uIHRoYXQgbm9kZSAoZmlyc3QgMTYgYml0cylcbiAgICogLSB0aGUgY291bnQgb2YgdmlldyBwcm92aWRlcnMgZnJvbSB0aGUgY29tcG9uZW50IG9uIHRoaXMgbm9kZSAobGFzdCAxNiBiaXRzKVxuICAgKi9cbiAgLy8gVE9ETyhtaXNrbyk6IGJyZWFrIHRoaXMgaW50byBhY3R1YWwgdmFycy5cbiAgcHJvdmlkZXJJbmRleGVzOiBUTm9kZVByb3ZpZGVySW5kZXhlcztcblxuICAvKiogVGhlIHRhZyBuYW1lIGFzc29jaWF0ZWQgd2l0aCB0aGlzIG5vZGUuICovXG4gIHRhZ05hbWU6IHN0cmluZ3xudWxsO1xuXG4gIC8qKlxuICAgKiBBdHRyaWJ1dGVzIGFzc29jaWF0ZWQgd2l0aCBhbiBlbGVtZW50LiBXZSBuZWVkIHRvIHN0b3JlIGF0dHJpYnV0ZXMgdG8gc3VwcG9ydCB2YXJpb3VzIHVzZS1jYXNlc1xuICAgKiAoYXR0cmlidXRlIGluamVjdGlvbiwgY29udGVudCBwcm9qZWN0aW9uIHdpdGggc2VsZWN0b3JzLCBkaXJlY3RpdmVzIG1hdGNoaW5nKS5cbiAgICogQXR0cmlidXRlcyBhcmUgc3RvcmVkIHN0YXRpY2FsbHkgYmVjYXVzZSByZWFkaW5nIHRoZW0gZnJvbSB0aGUgRE9NIHdvdWxkIGJlIHdheSB0b28gc2xvdyBmb3JcbiAgICogY29udGVudCBwcm9qZWN0aW9uIGFuZCBxdWVyaWVzLlxuICAgKlxuICAgKiBTaW5jZSBhdHRycyB3aWxsIGFsd2F5cyBiZSBjYWxjdWxhdGVkIGZpcnN0LCB0aGV5IHdpbGwgbmV2ZXIgbmVlZCB0byBiZSBtYXJrZWQgdW5kZWZpbmVkIGJ5XG4gICAqIG90aGVyIGluc3RydWN0aW9ucy5cbiAgICpcbiAgICogRm9yIHJlZ3VsYXIgYXR0cmlidXRlcyBhIG5hbWUgb2YgYW4gYXR0cmlidXRlIGFuZCBpdHMgdmFsdWUgYWx0ZXJuYXRlIGluIHRoZSBhcnJheS5cbiAgICogZS5nLiBbJ3JvbGUnLCAnY2hlY2tib3gnXVxuICAgKiBUaGlzIGFycmF5IGNhbiBjb250YWluIGZsYWdzIHRoYXQgd2lsbCBpbmRpY2F0ZSBcInNwZWNpYWwgYXR0cmlidXRlc1wiIChhdHRyaWJ1dGVzIHdpdGhcbiAgICogbmFtZXNwYWNlcywgYXR0cmlidXRlcyBleHRyYWN0ZWQgZnJvbSBiaW5kaW5ncyBhbmQgb3V0cHV0cykuXG4gICAqL1xuICBhdHRyczogVEF0dHJpYnV0ZXN8bnVsbDtcblxuICAvKipcbiAgICogQSBzZXQgb2YgbG9jYWwgbmFtZXMgdW5kZXIgd2hpY2ggYSBnaXZlbiBlbGVtZW50IGlzIGV4cG9ydGVkIGluIGEgdGVtcGxhdGUgYW5kXG4gICAqIHZpc2libGUgdG8gcXVlcmllcy4gQW4gZW50cnkgaW4gdGhpcyBhcnJheSBjYW4gYmUgY3JlYXRlZCBmb3IgZGlmZmVyZW50IHJlYXNvbnM6XG4gICAqIC0gYW4gZWxlbWVudCBpdHNlbGYgaXMgcmVmZXJlbmNlZCwgZXguOiBgPGRpdiAjZm9vPmBcbiAgICogLSBhIGNvbXBvbmVudCBpcyByZWZlcmVuY2VkLCBleC46IGA8bXktY21wdCAjZm9vPmBcbiAgICogLSBhIGRpcmVjdGl2ZSBpcyByZWZlcmVuY2VkLCBleC46IGA8bXktY21wdCAjZm9vPVwiZGlyZWN0aXZlRXhwb3J0QXNcIj5gLlxuICAgKlxuICAgKiBBIGdpdmVuIGVsZW1lbnQgbWlnaHQgaGF2ZSBkaWZmZXJlbnQgbG9jYWwgbmFtZXMgYW5kIHRob3NlIG5hbWVzIGNhbiBiZSBhc3NvY2lhdGVkXG4gICAqIHdpdGggYSBkaXJlY3RpdmUuIFdlIHN0b3JlIGxvY2FsIG5hbWVzIGF0IGV2ZW4gaW5kZXhlcyB3aGlsZSBvZGQgaW5kZXhlcyBhcmUgcmVzZXJ2ZWRcbiAgICogZm9yIGRpcmVjdGl2ZSBpbmRleCBpbiBhIHZpZXcgKG9yIGAtMWAgaWYgdGhlcmUgaXMgbm8gYXNzb2NpYXRlZCBkaXJlY3RpdmUpLlxuICAgKlxuICAgKiBTb21lIGV4YW1wbGVzOlxuICAgKiAtIGA8ZGl2ICNmb28+YCA9PiBgW1wiZm9vXCIsIC0xXWBcbiAgICogLSBgPG15LWNtcHQgI2Zvbz5gID0+IGBbXCJmb29cIiwgbXlDbXB0SWR4XWBcbiAgICogLSBgPG15LWNtcHQgI2ZvbyAjYmFyPVwiZGlyZWN0aXZlRXhwb3J0QXNcIj5gID0+IGBbXCJmb29cIiwgbXlDbXB0SWR4LCBcImJhclwiLCBkaXJlY3RpdmVJZHhdYFxuICAgKiAtIGA8ZGl2ICNmb28gI2Jhcj1cImRpcmVjdGl2ZUV4cG9ydEFzXCI+YCA9PiBgW1wiZm9vXCIsIC0xLCBcImJhclwiLCBkaXJlY3RpdmVJZHhdYFxuICAgKi9cbiAgbG9jYWxOYW1lczogKHN0cmluZ3xudW1iZXIpW118bnVsbDtcblxuICAvKiogSW5mb3JtYXRpb24gYWJvdXQgaW5wdXQgcHJvcGVydGllcyB0aGF0IG5lZWQgdG8gYmUgc2V0IG9uY2UgZnJvbSBhdHRyaWJ1dGUgZGF0YS4gKi9cbiAgaW5pdGlhbElucHV0czogSW5pdGlhbElucHV0RGF0YXxudWxsfHVuZGVmaW5lZDtcblxuICAvKipcbiAgICogSW5wdXQgZGF0YSBmb3IgYWxsIGRpcmVjdGl2ZXMgb24gdGhpcyBub2RlLlxuICAgKlxuICAgKiAtIGB1bmRlZmluZWRgIG1lYW5zIHRoYXQgdGhlIHByb3AgaGFzIG5vdCBiZWVuIGluaXRpYWxpemVkIHlldCxcbiAgICogLSBgbnVsbGAgbWVhbnMgdGhhdCB0aGUgcHJvcCBoYXMgYmVlbiBpbml0aWFsaXplZCBidXQgbm8gaW5wdXRzIGhhdmUgYmVlbiBmb3VuZC5cbiAgICovXG4gIGlucHV0czogUHJvcGVydHlBbGlhc2VzfG51bGx8dW5kZWZpbmVkO1xuXG4gIC8qKlxuICAgKiBPdXRwdXQgZGF0YSBmb3IgYWxsIGRpcmVjdGl2ZXMgb24gdGhpcyBub2RlLlxuICAgKlxuICAgKiAtIGB1bmRlZmluZWRgIG1lYW5zIHRoYXQgdGhlIHByb3AgaGFzIG5vdCBiZWVuIGluaXRpYWxpemVkIHlldCxcbiAgICogLSBgbnVsbGAgbWVhbnMgdGhhdCB0aGUgcHJvcCBoYXMgYmVlbiBpbml0aWFsaXplZCBidXQgbm8gb3V0cHV0cyBoYXZlIGJlZW4gZm91bmQuXG4gICAqL1xuICBvdXRwdXRzOiBQcm9wZXJ0eUFsaWFzZXN8bnVsbHx1bmRlZmluZWQ7XG5cbiAgLyoqXG4gICAqIFRoZSBUVmlldyBvciBUVmlld3MgYXR0YWNoZWQgdG8gdGhpcyBub2RlLlxuICAgKlxuICAgKiBJZiB0aGlzIFROb2RlIGNvcnJlc3BvbmRzIHRvIGFuIExDb250YWluZXIgd2l0aCBpbmxpbmUgdmlld3MsIHRoZSBjb250YWluZXIgd2lsbFxuICAgKiBuZWVkIHRvIHN0b3JlIHNlcGFyYXRlIHN0YXRpYyBkYXRhIGZvciBlYWNoIG9mIGl0cyB2aWV3IGJsb2NrcyAoVFZpZXdbXSkuIE90aGVyd2lzZSxcbiAgICogbm9kZXMgaW4gaW5saW5lIHZpZXdzIHdpdGggdGhlIHNhbWUgaW5kZXggYXMgbm9kZXMgaW4gdGhlaXIgcGFyZW50IHZpZXdzIHdpbGwgb3ZlcndyaXRlXG4gICAqIGVhY2ggb3RoZXIsIGFzIHRoZXkgYXJlIGluIHRoZSBzYW1lIHRlbXBsYXRlLlxuICAgKlxuICAgKiBFYWNoIGluZGV4IGluIHRoaXMgYXJyYXkgY29ycmVzcG9uZHMgdG8gdGhlIHN0YXRpYyBkYXRhIGZvciBhIGNlcnRhaW5cbiAgICogdmlldy4gU28gaWYgeW91IGhhZCBWKDApIGFuZCBWKDEpIGluIGEgY29udGFpbmVyLCB5b3UgbWlnaHQgaGF2ZTpcbiAgICpcbiAgICogW1xuICAgKiAgIFt7dGFnTmFtZTogJ2RpdicsIGF0dHJzOiAuLi59LCBudWxsXSwgICAgIC8vIFYoMCkgVFZpZXdcbiAgICogICBbe3RhZ05hbWU6ICdidXR0b24nLCBhdHRycyAuLi59LCBudWxsXSAgICAvLyBWKDEpIFRWaWV3XG4gICAqXG4gICAqIElmIHRoaXMgVE5vZGUgY29ycmVzcG9uZHMgdG8gYW4gTENvbnRhaW5lciB3aXRoIGEgdGVtcGxhdGUgKGUuZy4gc3RydWN0dXJhbFxuICAgKiBkaXJlY3RpdmUpLCB0aGUgdGVtcGxhdGUncyBUVmlldyB3aWxsIGJlIHN0b3JlZCBoZXJlLlxuICAgKlxuICAgKiBJZiB0aGlzIFROb2RlIGNvcnJlc3BvbmRzIHRvIGFuIGVsZW1lbnQsIHRWaWV3cyB3aWxsIGJlIG51bGwgLlxuICAgKi9cbiAgdFZpZXdzOiBUVmlld3xUVmlld1tdfG51bGw7XG5cbiAgLyoqXG4gICAqIFRoZSBuZXh0IHNpYmxpbmcgbm9kZS4gTmVjZXNzYXJ5IHNvIHdlIGNhbiBwcm9wYWdhdGUgdGhyb3VnaCB0aGUgcm9vdCBub2RlcyBvZiBhIHZpZXdcbiAgICogdG8gaW5zZXJ0IHRoZW0gb3IgcmVtb3ZlIHRoZW0gZnJvbSB0aGUgRE9NLlxuICAgKi9cbiAgbmV4dDogVE5vZGV8bnVsbDtcblxuICAvKipcbiAgICogRmlyc3QgY2hpbGQgb2YgdGhlIGN1cnJlbnQgbm9kZS5cbiAgICpcbiAgICogRm9yIGNvbXBvbmVudCBub2RlcywgdGhlIGNoaWxkIHdpbGwgYWx3YXlzIGJlIGEgQ29udGVudENoaWxkIChpbiBzYW1lIHZpZXcpLlxuICAgKiBGb3IgZW1iZWRkZWQgdmlldyBub2RlcywgdGhlIGNoaWxkIHdpbGwgYmUgaW4gdGhlaXIgY2hpbGQgdmlldy5cbiAgICovXG4gIGNoaWxkOiBUTm9kZXxudWxsO1xuXG4gIC8qKlxuICAgKiBQYXJlbnQgbm9kZSAoaW4gdGhlIHNhbWUgdmlldyBvbmx5KS5cbiAgICpcbiAgICogV2UgbmVlZCBhIHJlZmVyZW5jZSB0byBhIG5vZGUncyBwYXJlbnQgc28gd2UgY2FuIGFwcGVuZCB0aGUgbm9kZSB0byBpdHMgcGFyZW50J3MgbmF0aXZlXG4gICAqIGVsZW1lbnQgYXQgdGhlIGFwcHJvcHJpYXRlIHRpbWUuXG4gICAqXG4gICAqIElmIHRoZSBwYXJlbnQgd291bGQgYmUgaW4gYSBkaWZmZXJlbnQgdmlldyAoZS5nLiBjb21wb25lbnQgaG9zdCksIHRoaXMgcHJvcGVydHkgd2lsbCBiZSBudWxsLlxuICAgKiBJdCdzIGltcG9ydGFudCB0aGF0IHdlIGRvbid0IHRyeSB0byBjcm9zcyBjb21wb25lbnQgYm91bmRhcmllcyB3aGVuIHJldHJpZXZpbmcgdGhlIHBhcmVudFxuICAgKiBiZWNhdXNlIHRoZSBwYXJlbnQgd2lsbCBjaGFuZ2UgKGUuZy4gaW5kZXgsIGF0dHJzKSBkZXBlbmRpbmcgb24gd2hlcmUgdGhlIGNvbXBvbmVudCB3YXNcbiAgICogdXNlZCAoYW5kIHRodXMgc2hvdWxkbid0IGJlIHN0b3JlZCBvbiBUTm9kZSkuIEluIHRoZXNlIGNhc2VzLCB3ZSByZXRyaWV2ZSB0aGUgcGFyZW50IHRocm91Z2hcbiAgICogTFZpZXcubm9kZSBpbnN0ZWFkICh3aGljaCB3aWxsIGJlIGluc3RhbmNlLXNwZWNpZmljKS5cbiAgICpcbiAgICogSWYgdGhpcyBpcyBhbiBpbmxpbmUgdmlldyBub2RlIChWKSwgdGhlIHBhcmVudCB3aWxsIGJlIGl0cyBjb250YWluZXIuXG4gICAqL1xuICBwYXJlbnQ6IFRFbGVtZW50Tm9kZXxUQ29udGFpbmVyTm9kZXxudWxsO1xuXG4gIC8qKlxuICAgKiBJZiB0aGlzIG5vZGUgaXMgcGFydCBvZiBhbiBpMThuIGJsb2NrLCBpdCBpbmRpY2F0ZXMgd2hldGhlciB0aGlzIG5vZGUgaXMgcGFydCBvZiB0aGUgRE9NLlxuICAgKiBJZiB0aGlzIG5vZGUgaXMgbm90IHBhcnQgb2YgYW4gaTE4biBibG9jaywgdGhpcyBmaWVsZCBpcyBudWxsLlxuICAgKi9cbiAgZGV0YWNoZWQ6IGJvb2xlYW58bnVsbDtcblxuICBzdHlsaW5nVGVtcGxhdGU6IFN0eWxpbmdDb250ZXh0fG51bGw7XG4gIC8qKlxuICAgKiBMaXN0IG9mIHByb2plY3RlZCBUTm9kZXMgZm9yIGEgZ2l2ZW4gY29tcG9uZW50IGhvc3QgZWxlbWVudCBPUiBpbmRleCBpbnRvIHRoZSBzYWlkIG5vZGVzLlxuICAgKlxuICAgKiBGb3IgZWFzaWVyIGRpc2N1c3Npb24gYXNzdW1lIHRoaXMgZXhhbXBsZTpcbiAgICogYDxwYXJlbnQ+YCdzIHZpZXcgZGVmaW5pdGlvbjpcbiAgICogYGBgXG4gICAqIDxjaGlsZCBpZD1cImMxXCI+Y29udGVudDE8L2NoaWxkPlxuICAgKiA8Y2hpbGQgaWQ9XCJjMlwiPjxzcGFuPmNvbnRlbnQyPC9zcGFuPjwvY2hpbGQ+XG4gICAqIGBgYFxuICAgKiBgPGNoaWxkPmAncyB2aWV3IGRlZmluaXRpb246XG4gICAqIGBgYFxuICAgKiA8bmctY29udGVudCBpZD1cImNvbnQxXCI+PC9uZy1jb250ZW50PlxuICAgKiBgYGBcbiAgICpcbiAgICogSWYgYEFycmF5LmlzQXJyYXkocHJvamVjdGlvbilgIHRoZW4gYFROb2RlYCBpcyBhIGhvc3QgZWxlbWVudDpcbiAgICogLSBgcHJvamVjdGlvbmAgc3RvcmVzIHRoZSBjb250ZW50IG5vZGVzIHdoaWNoIGFyZSB0byBiZSBwcm9qZWN0ZWQuXG4gICAqICAgIC0gVGhlIG5vZGVzIHJlcHJlc2VudCBjYXRlZ29yaWVzIGRlZmluZWQgYnkgdGhlIHNlbGVjdG9yOiBGb3IgZXhhbXBsZTpcbiAgICogICAgICBgPG5nLWNvbnRlbnQvPjxuZy1jb250ZW50IHNlbGVjdD1cImFiY1wiLz5gIHdvdWxkIHJlcHJlc2VudCB0aGUgaGVhZHMgZm9yIGA8bmctY29udGVudC8+YFxuICAgKiAgICAgIGFuZCBgPG5nLWNvbnRlbnQgc2VsZWN0PVwiYWJjXCIvPmAgcmVzcGVjdGl2ZWx5LlxuICAgKiAgICAtIFRoZSBub2RlcyB3ZSBzdG9yZSBpbiBgcHJvamVjdGlvbmAgYXJlIGhlYWRzIG9ubHksIHdlIHVzZWQgYC5uZXh0YCB0byBnZXQgdGhlaXJcbiAgICogICAgICBzaWJsaW5ncy5cbiAgICogICAgLSBUaGUgbm9kZXMgYC5uZXh0YCBpcyBzb3J0ZWQvcmV3cml0dGVuIGFzIHBhcnQgb2YgdGhlIHByb2plY3Rpb24gc2V0dXAuXG4gICAqICAgIC0gYHByb2plY3Rpb25gIHNpemUgaXMgZXF1YWwgdG8gdGhlIG51bWJlciBvZiBwcm9qZWN0aW9ucyBgPG5nLWNvbnRlbnQ+YC4gVGhlIHNpemUgb2ZcbiAgICogICAgICBgYzFgIHdpbGwgYmUgYDFgIGJlY2F1c2UgYDxjaGlsZD5gIGhhcyBvbmx5IG9uZSBgPG5nLWNvbnRlbnQ+YC5cbiAgICogLSB3ZSBzdG9yZSBgcHJvamVjdGlvbmAgd2l0aCB0aGUgaG9zdCAoYGMxYCwgYGMyYCkgcmF0aGVyIHRoYW4gdGhlIGA8bmctY29udGVudD5gIChgY29udDFgKVxuICAgKiAgIGJlY2F1c2UgdGhlIHNhbWUgY29tcG9uZW50IChgPGNoaWxkPmApIGNhbiBiZSB1c2VkIGluIG11bHRpcGxlIGxvY2F0aW9ucyAoYGMxYCwgYGMyYCkgYW5kIGFzXG4gICAqICAgYSByZXN1bHQgaGF2ZSBkaWZmZXJlbnQgc2V0IG9mIG5vZGVzIHRvIHByb2plY3QuXG4gICAqIC0gd2l0aG91dCBgcHJvamVjdGlvbmAgaXQgd291bGQgYmUgZGlmZmljdWx0IHRvIGVmZmljaWVudGx5IHRyYXZlcnNlIG5vZGVzIHRvIGJlIHByb2plY3RlZC5cbiAgICpcbiAgICogSWYgYHR5cGVvZiBwcm9qZWN0aW9uID09ICdudW1iZXInYCB0aGVuIGBUTm9kZWAgaXMgYSBgPG5nLWNvbnRlbnQ+YCBlbGVtZW50OlxuICAgKiAtIGBwcm9qZWN0aW9uYCBpcyBhbiBpbmRleCBvZiB0aGUgaG9zdCdzIGBwcm9qZWN0aW9uYE5vZGVzLlxuICAgKiAgIC0gVGhpcyB3b3VsZCByZXR1cm4gdGhlIGZpcnN0IGhlYWQgbm9kZSB0byBwcm9qZWN0OlxuICAgKiAgICAgYGdldEhvc3QoY3VycmVudFROb2RlKS5wcm9qZWN0aW9uW2N1cnJlbnRUTm9kZS5wcm9qZWN0aW9uXWAuXG4gICAqIC0gV2hlbiBwcm9qZWN0aW5nIG5vZGVzIHRoZSBwYXJlbnQgbm9kZSByZXRyaWV2ZWQgbWF5IGJlIGEgYDxuZy1jb250ZW50PmAgbm9kZSwgaW4gd2hpY2ggY2FzZVxuICAgKiAgIHRoZSBwcm9jZXNzIGlzIHJlY3Vyc2l2ZSBpbiBuYXR1cmUgKG5vdCBpbXBsZW1lbnRhdGlvbikuXG4gICAqL1xuICBwcm9qZWN0aW9uOiAoVE5vZGV8bnVsbClbXXxudW1iZXJ8bnVsbDtcbn1cblxuLyoqIFN0YXRpYyBkYXRhIGZvciBhbiBlbGVtZW50ICAqL1xuZXhwb3J0IGludGVyZmFjZSBURWxlbWVudE5vZGUgZXh0ZW5kcyBUTm9kZSB7XG4gIC8qKiBJbmRleCBpbiB0aGUgZGF0YVtdIGFycmF5ICovXG4gIGluZGV4OiBudW1iZXI7XG4gIGNoaWxkOiBURWxlbWVudE5vZGV8VFRleHROb2RlfFRFbGVtZW50Q29udGFpbmVyTm9kZXxUQ29udGFpbmVyTm9kZXxUUHJvamVjdGlvbk5vZGV8bnVsbDtcbiAgLyoqXG4gICAqIEVsZW1lbnQgbm9kZXMgd2lsbCBoYXZlIHBhcmVudHMgdW5sZXNzIHRoZXkgYXJlIHRoZSBmaXJzdCBub2RlIG9mIGEgY29tcG9uZW50IG9yXG4gICAqIGVtYmVkZGVkIHZpZXcgKHdoaWNoIG1lYW5zIHRoZWlyIHBhcmVudCBpcyBpbiBhIGRpZmZlcmVudCB2aWV3IGFuZCBtdXN0IGJlXG4gICAqIHJldHJpZXZlZCB1c2luZyB2aWV3RGF0YVtIT1NUX05PREVdKS5cbiAgICovXG4gIHBhcmVudDogVEVsZW1lbnROb2RlfFRFbGVtZW50Q29udGFpbmVyTm9kZXxudWxsO1xuICB0Vmlld3M6IG51bGw7XG5cbiAgLyoqXG4gICAqIElmIHRoaXMgaXMgYSBjb21wb25lbnQgVE5vZGUgd2l0aCBwcm9qZWN0aW9uLCB0aGlzIHdpbGwgYmUgYW4gYXJyYXkgb2YgcHJvamVjdGVkXG4gICAqIFROb2RlcyAoc2VlIFROb2RlLnByb2plY3Rpb24gZm9yIG1vcmUgaW5mbykuIElmIGl0J3MgYSByZWd1bGFyIGVsZW1lbnQgbm9kZSBvciBhXG4gICAqIGNvbXBvbmVudCB3aXRob3V0IHByb2plY3Rpb24sIGl0IHdpbGwgYmUgbnVsbC5cbiAgICovXG4gIHByb2plY3Rpb246IChUTm9kZXxudWxsKVtdfG51bGw7XG59XG5cbi8qKiBTdGF0aWMgZGF0YSBmb3IgYSB0ZXh0IG5vZGUgKi9cbmV4cG9ydCBpbnRlcmZhY2UgVFRleHROb2RlIGV4dGVuZHMgVE5vZGUge1xuICAvKiogSW5kZXggaW4gdGhlIGRhdGFbXSBhcnJheSAqL1xuICBpbmRleDogbnVtYmVyO1xuICBjaGlsZDogbnVsbDtcbiAgLyoqXG4gICAqIFRleHQgbm9kZXMgd2lsbCBoYXZlIHBhcmVudHMgdW5sZXNzIHRoZXkgYXJlIHRoZSBmaXJzdCBub2RlIG9mIGEgY29tcG9uZW50IG9yXG4gICAqIGVtYmVkZGVkIHZpZXcgKHdoaWNoIG1lYW5zIHRoZWlyIHBhcmVudCBpcyBpbiBhIGRpZmZlcmVudCB2aWV3IGFuZCBtdXN0IGJlXG4gICAqIHJldHJpZXZlZCB1c2luZyBMVmlldy5ub2RlKS5cbiAgICovXG4gIHBhcmVudDogVEVsZW1lbnROb2RlfFRFbGVtZW50Q29udGFpbmVyTm9kZXxudWxsO1xuICB0Vmlld3M6IG51bGw7XG4gIHByb2plY3Rpb246IG51bGw7XG59XG5cbi8qKiBTdGF0aWMgZGF0YSBmb3IgYW4gTENvbnRhaW5lciAqL1xuZXhwb3J0IGludGVyZmFjZSBUQ29udGFpbmVyTm9kZSBleHRlbmRzIFROb2RlIHtcbiAgLyoqXG4gICAqIEluZGV4IGluIHRoZSBkYXRhW10gYXJyYXkuXG4gICAqXG4gICAqIElmIGl0J3MgLTEsIHRoaXMgaXMgYSBkeW5hbWljYWxseSBjcmVhdGVkIGNvbnRhaW5lciBub2RlIHRoYXQgaXNuJ3Qgc3RvcmVkIGluXG4gICAqIGRhdGFbXSAoZS5nLiB3aGVuIHlvdSBpbmplY3QgVmlld0NvbnRhaW5lclJlZikgLlxuICAgKi9cbiAgaW5kZXg6IG51bWJlcjtcbiAgY2hpbGQ6IG51bGw7XG5cbiAgLyoqXG4gICAqIENvbnRhaW5lciBub2RlcyB3aWxsIGhhdmUgcGFyZW50cyB1bmxlc3M6XG4gICAqXG4gICAqIC0gVGhleSBhcmUgdGhlIGZpcnN0IG5vZGUgb2YgYSBjb21wb25lbnQgb3IgZW1iZWRkZWQgdmlld1xuICAgKiAtIFRoZXkgYXJlIGR5bmFtaWNhbGx5IGNyZWF0ZWRcbiAgICovXG4gIHBhcmVudDogVEVsZW1lbnROb2RlfFRFbGVtZW50Q29udGFpbmVyTm9kZXxudWxsO1xuICB0Vmlld3M6IFRWaWV3fFRWaWV3W118bnVsbDtcbiAgcHJvamVjdGlvbjogbnVsbDtcbn1cblxuLyoqIFN0YXRpYyBkYXRhIGZvciBhbiA8bmctY29udGFpbmVyPiAqL1xuZXhwb3J0IGludGVyZmFjZSBURWxlbWVudENvbnRhaW5lck5vZGUgZXh0ZW5kcyBUTm9kZSB7XG4gIC8qKiBJbmRleCBpbiB0aGUgTFZpZXdbXSBhcnJheS4gKi9cbiAgaW5kZXg6IG51bWJlcjtcbiAgY2hpbGQ6IFRFbGVtZW50Tm9kZXxUVGV4dE5vZGV8VENvbnRhaW5lck5vZGV8VEVsZW1lbnRDb250YWluZXJOb2RlfFRQcm9qZWN0aW9uTm9kZXxudWxsO1xuICBwYXJlbnQ6IFRFbGVtZW50Tm9kZXxURWxlbWVudENvbnRhaW5lck5vZGV8bnVsbDtcbiAgdFZpZXdzOiBudWxsO1xuICBwcm9qZWN0aW9uOiBudWxsO1xufVxuXG4vKiogU3RhdGljIGRhdGEgZm9yIGFuIElDVSBleHByZXNzaW9uICovXG5leHBvcnQgaW50ZXJmYWNlIFRJY3VDb250YWluZXJOb2RlIGV4dGVuZHMgVE5vZGUge1xuICAvKiogSW5kZXggaW4gdGhlIExWaWV3W10gYXJyYXkuICovXG4gIGluZGV4OiBudW1iZXI7XG4gIGNoaWxkOiBURWxlbWVudE5vZGV8VFRleHROb2RlfG51bGw7XG4gIHBhcmVudDogVEVsZW1lbnROb2RlfFRFbGVtZW50Q29udGFpbmVyTm9kZXxudWxsO1xuICB0Vmlld3M6IG51bGw7XG4gIHByb2plY3Rpb246IG51bGw7XG4gIC8qKlxuICAgKiBJbmRpY2F0ZXMgdGhlIGN1cnJlbnQgYWN0aXZlIGNhc2UgZm9yIGFuIElDVSBleHByZXNzaW9uLlxuICAgKiBJdCBpcyBudWxsIHdoZW4gdGhlcmUgaXMgbm8gYWN0aXZlIGNhc2UuXG4gICAqL1xuICBhY3RpdmVDYXNlSW5kZXg6IG51bWJlcnxudWxsO1xufVxuXG4vKiogU3RhdGljIGRhdGEgZm9yIGEgdmlldyAgKi9cbmV4cG9ydCBpbnRlcmZhY2UgVFZpZXdOb2RlIGV4dGVuZHMgVE5vZGUge1xuICAvKiogSWYgLTEsIGl0J3MgYSBkeW5hbWljYWxseSBjcmVhdGVkIHZpZXcuIE90aGVyd2lzZSwgaXQgaXMgdGhlIHZpZXcgYmxvY2sgSUQuICovXG4gIGluZGV4OiBudW1iZXI7XG4gIGNoaWxkOiBURWxlbWVudE5vZGV8VFRleHROb2RlfFRFbGVtZW50Q29udGFpbmVyTm9kZXxUQ29udGFpbmVyTm9kZXxUUHJvamVjdGlvbk5vZGV8bnVsbDtcbiAgcGFyZW50OiBUQ29udGFpbmVyTm9kZXxudWxsO1xuICB0Vmlld3M6IG51bGw7XG4gIHByb2plY3Rpb246IG51bGw7XG59XG5cbi8qKiBTdGF0aWMgZGF0YSBmb3IgYW4gTFByb2plY3Rpb25Ob2RlICAqL1xuZXhwb3J0IGludGVyZmFjZSBUUHJvamVjdGlvbk5vZGUgZXh0ZW5kcyBUTm9kZSB7XG4gIC8qKiBJbmRleCBpbiB0aGUgZGF0YVtdIGFycmF5ICovXG4gIGNoaWxkOiBudWxsO1xuICAvKipcbiAgICogUHJvamVjdGlvbiBub2RlcyB3aWxsIGhhdmUgcGFyZW50cyB1bmxlc3MgdGhleSBhcmUgdGhlIGZpcnN0IG5vZGUgb2YgYSBjb21wb25lbnRcbiAgICogb3IgZW1iZWRkZWQgdmlldyAod2hpY2ggbWVhbnMgdGhlaXIgcGFyZW50IGlzIGluIGEgZGlmZmVyZW50IHZpZXcgYW5kIG11c3QgYmVcbiAgICogcmV0cmlldmVkIHVzaW5nIExWaWV3Lm5vZGUpLlxuICAgKi9cbiAgcGFyZW50OiBURWxlbWVudE5vZGV8VEVsZW1lbnRDb250YWluZXJOb2RlfG51bGw7XG4gIHRWaWV3czogbnVsbDtcblxuICAvKiogSW5kZXggb2YgdGhlIHByb2plY3Rpb24gbm9kZS4gKFNlZSBUTm9kZS5wcm9qZWN0aW9uIGZvciBtb3JlIGluZm8uKSAqL1xuICBwcm9qZWN0aW9uOiBudW1iZXI7XG59XG5cbi8qKlxuICogVGhpcyBtYXBwaW5nIGlzIG5lY2Vzc2FyeSBzbyB3ZSBjYW4gc2V0IGlucHV0IHByb3BlcnRpZXMgYW5kIG91dHB1dCBsaXN0ZW5lcnNcbiAqIHByb3Blcmx5IGF0IHJ1bnRpbWUgd2hlbiBwcm9wZXJ0eSBuYW1lcyBhcmUgbWluaWZpZWQgb3IgYWxpYXNlZC5cbiAqXG4gKiBLZXk6IHVubWluaWZpZWQgLyBwdWJsaWMgaW5wdXQgb3Igb3V0cHV0IG5hbWVcbiAqIFZhbHVlOiBhcnJheSBjb250YWluaW5nIG1pbmlmaWVkIC8gaW50ZXJuYWwgbmFtZSBhbmQgcmVsYXRlZCBkaXJlY3RpdmUgaW5kZXhcbiAqXG4gKiBUaGUgdmFsdWUgbXVzdCBiZSBhbiBhcnJheSB0byBzdXBwb3J0IGlucHV0cyBhbmQgb3V0cHV0cyB3aXRoIHRoZSBzYW1lIG5hbWVcbiAqIG9uIHRoZSBzYW1lIG5vZGUuXG4gKi9cbmV4cG9ydCB0eXBlIFByb3BlcnR5QWxpYXNlcyA9IHtcbiAgLy8gVGhpcyB1c2VzIGFuIG9iamVjdCBtYXAgYmVjYXVzZSB1c2luZyB0aGUgTWFwIHR5cGUgd291bGQgYmUgdG9vIHNsb3dcbiAgW2tleTogc3RyaW5nXTogUHJvcGVydHlBbGlhc1ZhbHVlXG59O1xuXG4vKipcbiAqIFN0b3JlIHRoZSBydW50aW1lIGlucHV0IG9yIG91dHB1dCBuYW1lcyBmb3IgYWxsIHRoZSBkaXJlY3RpdmVzLlxuICpcbiAqIC0gRXZlbiBpbmRpY2VzOiBkaXJlY3RpdmUgaW5kZXhcbiAqIC0gT2RkIGluZGljZXM6IG1pbmlmaWVkIC8gaW50ZXJuYWwgbmFtZVxuICpcbiAqIGUuZy4gWzAsICdjaGFuZ2UtbWluaWZpZWQnXVxuICovXG5leHBvcnQgdHlwZSBQcm9wZXJ0eUFsaWFzVmFsdWUgPSAobnVtYmVyIHwgc3RyaW5nKVtdO1xuXG5cbi8qKlxuICogVGhpcyBhcnJheSBjb250YWlucyBpbmZvcm1hdGlvbiBhYm91dCBpbnB1dCBwcm9wZXJ0aWVzIHRoYXRcbiAqIG5lZWQgdG8gYmUgc2V0IG9uY2UgZnJvbSBhdHRyaWJ1dGUgZGF0YS4gSXQncyBvcmRlcmVkIGJ5XG4gKiBkaXJlY3RpdmUgaW5kZXggKHJlbGF0aXZlIHRvIGVsZW1lbnQpIHNvIGl0J3Mgc2ltcGxlIHRvXG4gKiBsb29rIHVwIGEgc3BlY2lmaWMgZGlyZWN0aXZlJ3MgaW5pdGlhbCBpbnB1dCBkYXRhLlxuICpcbiAqIFdpdGhpbiBlYWNoIHN1Yi1hcnJheTpcbiAqXG4gKiBFdmVuIGluZGljZXM6IG1pbmlmaWVkL2ludGVybmFsIGlucHV0IG5hbWVcbiAqIE9kZCBpbmRpY2VzOiBpbml0aWFsIHZhbHVlXG4gKlxuICogSWYgYSBkaXJlY3RpdmUgb24gYSBub2RlIGRvZXMgbm90IGhhdmUgYW55IGlucHV0IHByb3BlcnRpZXNcbiAqIHRoYXQgc2hvdWxkIGJlIHNldCBmcm9tIGF0dHJpYnV0ZXMsIGl0cyBpbmRleCBpcyBzZXQgdG8gbnVsbFxuICogdG8gYXZvaWQgYSBzcGFyc2UgYXJyYXkuXG4gKlxuICogZS5nLiBbbnVsbCwgWydyb2xlLW1pbicsICdidXR0b24nXV1cbiAqL1xuZXhwb3J0IHR5cGUgSW5pdGlhbElucHV0RGF0YSA9IChJbml0aWFsSW5wdXRzIHwgbnVsbClbXTtcblxuLyoqXG4gKiBVc2VkIGJ5IEluaXRpYWxJbnB1dERhdGEgdG8gc3RvcmUgaW5wdXQgcHJvcGVydGllc1xuICogdGhhdCBzaG91bGQgYmUgc2V0IG9uY2UgZnJvbSBhdHRyaWJ1dGVzLlxuICpcbiAqIEV2ZW4gaW5kaWNlczogbWluaWZpZWQvaW50ZXJuYWwgaW5wdXQgbmFtZVxuICogT2RkIGluZGljZXM6IGluaXRpYWwgdmFsdWVcbiAqXG4gKiBlLmcuIFsncm9sZS1taW4nLCAnYnV0dG9uJ11cbiAqL1xuZXhwb3J0IHR5cGUgSW5pdGlhbElucHV0cyA9IHN0cmluZ1tdO1xuXG4vLyBOb3RlOiBUaGlzIGhhY2sgaXMgbmVjZXNzYXJ5IHNvIHdlIGRvbid0IGVycm9uZW91c2x5IGdldCBhIGNpcmN1bGFyIGRlcGVuZGVuY3lcbi8vIGZhaWx1cmUgYmFzZWQgb24gdHlwZXMuXG5leHBvcnQgY29uc3QgdW51c2VkVmFsdWVFeHBvcnRUb1BsYWNhdGVBamQgPSAxO1xuXG4vKipcbiAqIFR5cGUgcmVwcmVzZW50aW5nIGEgc2V0IG9mIFROb2RlcyB0aGF0IGNhbiBoYXZlIGxvY2FsIHJlZnMgKGAjZm9vYCkgcGxhY2VkIG9uIHRoZW0uXG4gKi9cbmV4cG9ydCB0eXBlIFROb2RlV2l0aExvY2FsUmVmcyA9IFRDb250YWluZXJOb2RlIHwgVEVsZW1lbnROb2RlIHwgVEVsZW1lbnRDb250YWluZXJOb2RlO1xuXG4vKipcbiAqIFR5cGUgZm9yIGEgZnVuY3Rpb24gdGhhdCBleHRyYWN0cyBhIHZhbHVlIGZvciBhIGxvY2FsIHJlZnMuXG4gKiBFeGFtcGxlOlxuICogLSBgPGRpdiAjbmF0aXZlRGl2RWw+YCAtIGBuYXRpdmVEaXZFbGAgc2hvdWxkIHBvaW50IHRvIHRoZSBuYXRpdmUgYDxkaXY+YCBlbGVtZW50O1xuICogLSBgPG5nLXRlbXBsYXRlICN0cGxSZWY+YCAtIGB0cGxSZWZgIHNob3VsZCBwb2ludCB0byB0aGUgYFRlbXBsYXRlUmVmYCBpbnN0YW5jZTtcbiAqL1xuZXhwb3J0IHR5cGUgTG9jYWxSZWZFeHRyYWN0b3IgPSAodE5vZGU6IFROb2RlV2l0aExvY2FsUmVmcywgY3VycmVudFZpZXc6IExWaWV3KSA9PiBhbnk7XG4iXX0=