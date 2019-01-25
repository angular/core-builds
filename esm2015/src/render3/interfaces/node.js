/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
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
    ElementContainer: 4,
    IcuContainer: 5,
};
export { TNodeType };
/** @enum {number} */
const TNodeFlags = {
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
const TNodeProviderIndexes = {
    /** The index of the first provider on this node is encoded on the least significant bits */
    ProvidersStartIndexMask: 65535,
    /** The count of view providers from the component on this node is encoded on the 16 most
       significant bits */
    CptViewProvidersCountShift: 16,
    CptViewProvidersCountShifter: 65536,
};
export { TNodeProviderIndexes };
/** @enum {number} */
const AttributeMarker = {
    /**
     * Marker indicates that the following 3 values in the attributes array are:
     * namespaceUri, attributeName, attributeValue
     * in that order.
     */
    NamespaceURI: 0,
    /**
      * Signals class declaration.
      *
      * Each value following `Classes` designates a class name to include on the element.
      * ## Example:
      *
      * Given:
      * ```
      * <div class="foo bar baz">...<d/vi>
      * ```
      *
      * the generated code is:
      * ```
      * var _c1 = [AttributeMarker.Classes, 'foo', 'bar', 'baz'];
      * ```
      */
    Classes: 1,
    /**
     * Signals style declaration.
     *
     * Each pair of values following `Styles` designates a style name and value to include on the
     * element.
     * ## Example:
     *
     * Given:
     * ```
     * <div style="width:100px; height:200px; color:red">...</div>
     * ```
     *
     * the generated code is:
     * ```
     * var _c1 = [AttributeMarker.Styles, 'width', '100px', 'height'. '200px', 'color', 'red'];
     * ```
     */
    Styles: 2,
    /**
     * This marker indicates that the following attribute names were extracted from bindings (ex.:
     * [foo]="exp") and / or event handlers (ex. (bar)="doSth()").
     * Taking the above bindings and outputs as an example an attributes array could look as follows:
     * ['class', 'fade in', AttributeMarker.SelectOnly, 'foo', 'bar']
     */
    SelectOnly: 3,
};
export { AttributeMarker };
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
if (false) {
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
     * Stores the first index where property binding metadata is stored for
     * this node.
     * @type {?}
     */
    TNode.prototype.propertyMetadataStartIndex;
    /**
     * Stores the exclusive final index where property binding metadata is
     * stored for this node.
     * @type {?}
     */
    TNode.prototype.propertyMetadataEndIndex;
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
     *
     * If `projection` is of type `RNode[][]` than we have a collection of native nodes passed as
     * projectable nodes during dynamic component creation.
     * @type {?}
     */
    TNode.prototype.projection;
}
/**
 * Static data for an element
 * @record
 */
export function TElementNode() { }
if (false) {
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
     * TNodes or native nodes (see TNode.projection for more info). If it's a regular element node or
     * a component without projection, it will be null.
     * @type {?}
     */
    TElementNode.prototype.projection;
}
/**
 * Static data for a text node
 * @record
 */
export function TTextNode() { }
if (false) {
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
}
/**
 * Static data for an LContainer
 * @record
 */
export function TContainerNode() { }
if (false) {
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
}
/**
 * Static data for an <ng-container>
 * @record
 */
export function TElementContainerNode() { }
if (false) {
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
}
/**
 * Static data for an ICU expression
 * @record
 */
export function TIcuContainerNode() { }
if (false) {
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
}
/**
 * Static data for a view
 * @record
 */
export function TViewNode() { }
if (false) {
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
}
/**
 * Static data for an LProjectionNode
 * @record
 */
export function TProjectionNode() { }
if (false) {
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
}
// Note: This hack is necessary so we don't erroneously get a circular dependency
// failure based on types.
/** @type {?} */
export const unusedValueExportToPlacateAjd = 1;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9kZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaW50ZXJmYWNlcy9ub2RlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7SUFrQkUsWUFBaUI7SUFDakIsYUFBa0I7SUFDbEIsT0FBWTtJQUNaLFVBQWU7SUFDZixnQkFBcUI7SUFDckIsbUJBQXdCO0lBQ3hCLGVBQW9COzs7OztJQU9wQixpREFBaUQ7SUFDakQsY0FBb0I7SUFFcEIscURBQXFEO0lBQ3JELGNBQW9CO0lBRXBCLDBEQUEwRDtJQUMxRCxrQkFBd0I7SUFFeEIsb0ZBQW9GO0lBQ3BGLGdCQUFzQjs7Ozs7SUFPdEIsNEZBQTRGO0lBQzVGLDhCQUE0RDtJQUU1RDswQkFDc0I7SUFDdEIsOEJBQStCO0lBQy9CLG1DQUFpRTs7Ozs7SUFPakU7Ozs7T0FJRztJQUNILGVBQWdCO0lBRWhCOzs7Ozs7Ozs7Ozs7Ozs7UUFlSTtJQUNKLFVBQVc7SUFFWDs7Ozs7Ozs7Ozs7Ozs7OztPQWdCRztJQUNILFNBQVU7SUFFVjs7Ozs7T0FLRztJQUNILGFBQWM7Ozs7Ozs7Ozs7Ozs7OztBQXFCaEIsMkJBNk5DOzs7Ozs7SUEzTkMscUJBQWdCOzs7Ozs7Ozs7O0lBVWhCLHNCQUFjOzs7Ozs7Ozs7Ozs7Ozs7SUFlZCw4QkFBc0I7Ozs7O0lBS3RCLCtCQUF1Qjs7Ozs7SUFLdkIsNkJBQXFCOzs7Ozs7SUFNckIsMkNBQW1DOzs7Ozs7SUFNbkMseUNBQWlDOzs7OztJQUtqQyxzQkFBa0I7Ozs7Ozs7O0lBU2xCLGdDQUFzQzs7Ozs7SUFHdEMsd0JBQXFCOzs7Ozs7Ozs7Ozs7Ozs7O0lBZ0JyQixzQkFBd0I7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUFtQnhCLDJCQUFtQzs7Ozs7SUFHbkMsOEJBQStDOzs7Ozs7OztJQVEvQyx1QkFBdUM7Ozs7Ozs7O0lBUXZDLHdCQUF3Qzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQXNCeEMsdUJBQTJCOzs7Ozs7SUFNM0IscUJBQWlCOzs7Ozs7OztJQVFqQixzQkFBa0I7Ozs7Ozs7Ozs7Ozs7Ozs7SUFnQmxCLHVCQUF5Qzs7Ozs7O0lBTXpDLHlCQUF1Qjs7SUFFdkIsZ0NBQXFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQXdDckMsMkJBQTBDOzs7Ozs7QUFJNUMsa0NBa0JDOzs7Ozs7SUFoQkMsNkJBQWM7O0lBQ2QsNkJBQXdGOzs7Ozs7O0lBTXhGLDhCQUFnRDs7SUFDaEQsOEJBQWE7Ozs7Ozs7SUFPYixrQ0FBbUM7Ozs7OztBQUlyQywrQkFZQzs7Ozs7O0lBVkMsMEJBQWM7O0lBQ2QsMEJBQVk7Ozs7Ozs7SUFNWiwyQkFBZ0Q7O0lBQ2hELDJCQUFhOztJQUNiLCtCQUFpQjs7Ozs7O0FBSW5CLG9DQW1CQzs7Ozs7Ozs7O0lBWkMsK0JBQWM7O0lBQ2QsK0JBQVk7Ozs7Ozs7O0lBUVosZ0NBQWdEOztJQUNoRCxnQ0FBMkI7O0lBQzNCLG9DQUFpQjs7Ozs7O0FBSW5CLDJDQU9DOzs7Ozs7SUFMQyxzQ0FBYzs7SUFDZCxzQ0FBd0Y7O0lBQ3hGLHVDQUFnRDs7SUFDaEQsdUNBQWE7O0lBQ2IsMkNBQWlCOzs7Ozs7QUFJbkIsdUNBWUM7Ozs7OztJQVZDLGtDQUFjOztJQUNkLGtDQUFtQzs7SUFDbkMsbUNBQWdEOztJQUNoRCxtQ0FBYTs7SUFDYix1Q0FBaUI7Ozs7OztJQUtqQiw0Q0FBNkI7Ozs7OztBQUkvQiwrQkFPQzs7Ozs7O0lBTEMsMEJBQWM7O0lBQ2QsMEJBQXdGOztJQUN4RiwyQkFBNEI7O0lBQzVCLDJCQUFhOztJQUNiLCtCQUFpQjs7Ozs7O0FBSW5CLHFDQWFDOzs7Ozs7SUFYQyxnQ0FBWTs7Ozs7OztJQU1aLGlDQUFnRDs7SUFDaEQsaUNBQWE7Ozs7O0lBR2IscUNBQW1COzs7OztBQStEckIsTUFBTSxPQUFPLDZCQUE2QixHQUFHLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7Uk5vZGV9IGZyb20gJy4vcmVuZGVyZXInO1xuaW1wb3J0IHtTdHlsaW5nQ29udGV4dH0gZnJvbSAnLi9zdHlsaW5nJztcbmltcG9ydCB7TFZpZXcsIFRWaWV3fSBmcm9tICcuL3ZpZXcnO1xuXG5cbi8qKlxuICogVE5vZGVUeXBlIGNvcnJlc3BvbmRzIHRvIHRoZSBUTm9kZS50eXBlIHByb3BlcnR5LiBJdCBjb250YWlucyBpbmZvcm1hdGlvblxuICogb24gaG93IHRvIG1hcCBhIHBhcnRpY3VsYXIgc2V0IG9mIGJpdHMgaW4gVE5vZGUuZmxhZ3MgdG8gdGhlIG5vZGUgdHlwZS5cbiAqL1xuZXhwb3J0IGNvbnN0IGVudW0gVE5vZGVUeXBlIHtcbiAgQ29udGFpbmVyID0gMGIwMDAsXG4gIFByb2plY3Rpb24gPSAwYjAwMSxcbiAgVmlldyA9IDBiMDEwLFxuICBFbGVtZW50ID0gMGIwMTEsXG4gIFZpZXdPckVsZW1lbnQgPSAwYjAxMCxcbiAgRWxlbWVudENvbnRhaW5lciA9IDBiMTAwLFxuICBJY3VDb250YWluZXIgPSAwYjEwMSxcbn1cblxuLyoqXG4gKiBDb3JyZXNwb25kcyB0byB0aGUgVE5vZGUuZmxhZ3MgcHJvcGVydHkuXG4gKi9cbmV4cG9ydCBjb25zdCBlbnVtIFROb2RlRmxhZ3Mge1xuICAvKiogVGhpcyBiaXQgaXMgc2V0IGlmIHRoZSBub2RlIGlzIGEgY29tcG9uZW50ICovXG4gIGlzQ29tcG9uZW50ID0gMGIwMDAxLFxuXG4gIC8qKiBUaGlzIGJpdCBpcyBzZXQgaWYgdGhlIG5vZGUgaGFzIGJlZW4gcHJvamVjdGVkICovXG4gIGlzUHJvamVjdGVkID0gMGIwMDEwLFxuXG4gIC8qKiBUaGlzIGJpdCBpcyBzZXQgaWYgdGhlIG5vZGUgaGFzIGFueSBjb250ZW50IHF1ZXJpZXMgKi9cbiAgaGFzQ29udGVudFF1ZXJ5ID0gMGIwMTAwLFxuXG4gIC8qKiBUaGlzIGJpdCBpcyBzZXQgaWYgdGhlIG5vZGUgaGFzIGFueSBkaXJlY3RpdmVzIHRoYXQgY29udGFpbiBbY2xhc3MgcHJvcGVydGllcyAqL1xuICBoYXNDbGFzc0lucHV0ID0gMGIxMDAwLFxufVxuXG4vKipcbiAqIENvcnJlc3BvbmRzIHRvIHRoZSBUTm9kZS5wcm92aWRlckluZGV4ZXMgcHJvcGVydHkuXG4gKi9cbmV4cG9ydCBjb25zdCBlbnVtIFROb2RlUHJvdmlkZXJJbmRleGVzIHtcbiAgLyoqIFRoZSBpbmRleCBvZiB0aGUgZmlyc3QgcHJvdmlkZXIgb24gdGhpcyBub2RlIGlzIGVuY29kZWQgb24gdGhlIGxlYXN0IHNpZ25pZmljYW50IGJpdHMgKi9cbiAgUHJvdmlkZXJzU3RhcnRJbmRleE1hc2sgPSAwYjAwMDAwMDAwMDAwMDAwMDAxMTExMTExMTExMTExMTExLFxuXG4gIC8qKiBUaGUgY291bnQgb2YgdmlldyBwcm92aWRlcnMgZnJvbSB0aGUgY29tcG9uZW50IG9uIHRoaXMgbm9kZSBpcyBlbmNvZGVkIG9uIHRoZSAxNiBtb3N0XG4gICAgIHNpZ25pZmljYW50IGJpdHMgKi9cbiAgQ3B0Vmlld1Byb3ZpZGVyc0NvdW50U2hpZnQgPSAxNixcbiAgQ3B0Vmlld1Byb3ZpZGVyc0NvdW50U2hpZnRlciA9IDBiMDAwMDAwMDAwMDAwMDAwMTAwMDAwMDAwMDAwMDAwMDAsXG59XG4vKipcbiAqIEEgc2V0IG9mIG1hcmtlciB2YWx1ZXMgdG8gYmUgdXNlZCBpbiB0aGUgYXR0cmlidXRlcyBhcnJheXMuIFRoZXNlIG1hcmtlcnMgaW5kaWNhdGUgdGhhdCBzb21lXG4gKiBpdGVtcyBhcmUgbm90IHJlZ3VsYXIgYXR0cmlidXRlcyBhbmQgdGhlIHByb2Nlc3Npbmcgc2hvdWxkIGJlIGFkYXB0ZWQgYWNjb3JkaW5nbHkuXG4gKi9cbmV4cG9ydCBjb25zdCBlbnVtIEF0dHJpYnV0ZU1hcmtlciB7XG4gIC8qKlxuICAgKiBNYXJrZXIgaW5kaWNhdGVzIHRoYXQgdGhlIGZvbGxvd2luZyAzIHZhbHVlcyBpbiB0aGUgYXR0cmlidXRlcyBhcnJheSBhcmU6XG4gICAqIG5hbWVzcGFjZVVyaSwgYXR0cmlidXRlTmFtZSwgYXR0cmlidXRlVmFsdWVcbiAgICogaW4gdGhhdCBvcmRlci5cbiAgICovXG4gIE5hbWVzcGFjZVVSSSA9IDAsXG5cbiAgLyoqXG4gICAgKiBTaWduYWxzIGNsYXNzIGRlY2xhcmF0aW9uLlxuICAgICpcbiAgICAqIEVhY2ggdmFsdWUgZm9sbG93aW5nIGBDbGFzc2VzYCBkZXNpZ25hdGVzIGEgY2xhc3MgbmFtZSB0byBpbmNsdWRlIG9uIHRoZSBlbGVtZW50LlxuICAgICogIyMgRXhhbXBsZTpcbiAgICAqXG4gICAgKiBHaXZlbjpcbiAgICAqIGBgYFxuICAgICogPGRpdiBjbGFzcz1cImZvbyBiYXIgYmF6XCI+Li4uPGQvdmk+XG4gICAgKiBgYGBcbiAgICAqXG4gICAgKiB0aGUgZ2VuZXJhdGVkIGNvZGUgaXM6XG4gICAgKiBgYGBcbiAgICAqIHZhciBfYzEgPSBbQXR0cmlidXRlTWFya2VyLkNsYXNzZXMsICdmb28nLCAnYmFyJywgJ2JheiddO1xuICAgICogYGBgXG4gICAgKi9cbiAgQ2xhc3NlcyA9IDEsXG5cbiAgLyoqXG4gICAqIFNpZ25hbHMgc3R5bGUgZGVjbGFyYXRpb24uXG4gICAqXG4gICAqIEVhY2ggcGFpciBvZiB2YWx1ZXMgZm9sbG93aW5nIGBTdHlsZXNgIGRlc2lnbmF0ZXMgYSBzdHlsZSBuYW1lIGFuZCB2YWx1ZSB0byBpbmNsdWRlIG9uIHRoZVxuICAgKiBlbGVtZW50LlxuICAgKiAjIyBFeGFtcGxlOlxuICAgKlxuICAgKiBHaXZlbjpcbiAgICogYGBgXG4gICAqIDxkaXYgc3R5bGU9XCJ3aWR0aDoxMDBweDsgaGVpZ2h0OjIwMHB4OyBjb2xvcjpyZWRcIj4uLi48L2Rpdj5cbiAgICogYGBgXG4gICAqXG4gICAqIHRoZSBnZW5lcmF0ZWQgY29kZSBpczpcbiAgICogYGBgXG4gICAqIHZhciBfYzEgPSBbQXR0cmlidXRlTWFya2VyLlN0eWxlcywgJ3dpZHRoJywgJzEwMHB4JywgJ2hlaWdodCcuICcyMDBweCcsICdjb2xvcicsICdyZWQnXTtcbiAgICogYGBgXG4gICAqL1xuICBTdHlsZXMgPSAyLFxuXG4gIC8qKlxuICAgKiBUaGlzIG1hcmtlciBpbmRpY2F0ZXMgdGhhdCB0aGUgZm9sbG93aW5nIGF0dHJpYnV0ZSBuYW1lcyB3ZXJlIGV4dHJhY3RlZCBmcm9tIGJpbmRpbmdzIChleC46XG4gICAqIFtmb29dPVwiZXhwXCIpIGFuZCAvIG9yIGV2ZW50IGhhbmRsZXJzIChleC4gKGJhcik9XCJkb1N0aCgpXCIpLlxuICAgKiBUYWtpbmcgdGhlIGFib3ZlIGJpbmRpbmdzIGFuZCBvdXRwdXRzIGFzIGFuIGV4YW1wbGUgYW4gYXR0cmlidXRlcyBhcnJheSBjb3VsZCBsb29rIGFzIGZvbGxvd3M6XG4gICAqIFsnY2xhc3MnLCAnZmFkZSBpbicsIEF0dHJpYnV0ZU1hcmtlci5TZWxlY3RPbmx5LCAnZm9vJywgJ2JhciddXG4gICAqL1xuICBTZWxlY3RPbmx5ID0gMyxcbn1cblxuLyoqXG4gKiBBIGNvbWJpbmF0aW9uIG9mOlxuICogLSBhdHRyaWJ1dGUgbmFtZXMgYW5kIHZhbHVlc1xuICogLSBzcGVjaWFsIG1hcmtlcnMgYWN0aW5nIGFzIGZsYWdzIHRvIGFsdGVyIGF0dHJpYnV0ZXMgcHJvY2Vzc2luZy5cbiAqL1xuZXhwb3J0IHR5cGUgVEF0dHJpYnV0ZXMgPSAoc3RyaW5nIHwgQXR0cmlidXRlTWFya2VyKVtdO1xuXG4vKipcbiAqIEJpbmRpbmcgZGF0YSAoZmx5d2VpZ2h0KSBmb3IgYSBwYXJ0aWN1bGFyIG5vZGUgdGhhdCBpcyBzaGFyZWQgYmV0d2VlbiBhbGwgdGVtcGxhdGVzXG4gKiBvZiBhIHNwZWNpZmljIHR5cGUuXG4gKlxuICogSWYgYSBwcm9wZXJ0eSBpczpcbiAqICAgIC0gUHJvcGVydHlBbGlhc2VzOiB0aGF0IHByb3BlcnR5J3MgZGF0YSB3YXMgZ2VuZXJhdGVkIGFuZCB0aGlzIGlzIGl0XG4gKiAgICAtIE51bGw6IHRoYXQgcHJvcGVydHkncyBkYXRhIHdhcyBhbHJlYWR5IGdlbmVyYXRlZCBhbmQgbm90aGluZyB3YXMgZm91bmQuXG4gKiAgICAtIFVuZGVmaW5lZDogdGhhdCBwcm9wZXJ0eSdzIGRhdGEgaGFzIG5vdCB5ZXQgYmVlbiBnZW5lcmF0ZWRcbiAqXG4gKiBzZWU6IGh0dHBzOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0ZseXdlaWdodF9wYXR0ZXJuIGZvciBtb3JlIG9uIHRoZSBGbHl3ZWlnaHQgcGF0dGVyblxuICovXG5leHBvcnQgaW50ZXJmYWNlIFROb2RlIHtcbiAgLyoqIFRoZSB0eXBlIG9mIHRoZSBUTm9kZS4gU2VlIFROb2RlVHlwZS4gKi9cbiAgdHlwZTogVE5vZGVUeXBlO1xuXG4gIC8qKlxuICAgKiBJbmRleCBvZiB0aGUgVE5vZGUgaW4gVFZpZXcuZGF0YSBhbmQgY29ycmVzcG9uZGluZyBuYXRpdmUgZWxlbWVudCBpbiBMVmlldy5cbiAgICpcbiAgICogVGhpcyBpcyBuZWNlc3NhcnkgdG8gZ2V0IGZyb20gYW55IFROb2RlIHRvIGl0cyBjb3JyZXNwb25kaW5nIG5hdGl2ZSBlbGVtZW50IHdoZW5cbiAgICogdHJhdmVyc2luZyB0aGUgbm9kZSB0cmVlLlxuICAgKlxuICAgKiBJZiBpbmRleCBpcyAtMSwgdGhpcyBpcyBhIGR5bmFtaWNhbGx5IGNyZWF0ZWQgY29udGFpbmVyIG5vZGUgb3IgZW1iZWRkZWQgdmlldyBub2RlLlxuICAgKi9cbiAgaW5kZXg6IG51bWJlcjtcblxuICAvKipcbiAgICogVGhlIGluZGV4IG9mIHRoZSBjbG9zZXN0IGluamVjdG9yIGluIHRoaXMgbm9kZSdzIExWaWV3LlxuICAgKlxuICAgKiBJZiB0aGUgaW5kZXggPT09IC0xLCB0aGVyZSBpcyBubyBpbmplY3RvciBvbiB0aGlzIG5vZGUgb3IgYW55IGFuY2VzdG9yIG5vZGUgaW4gdGhpcyB2aWV3LlxuICAgKlxuICAgKiBJZiB0aGUgaW5kZXggIT09IC0xLCBpdCBpcyB0aGUgaW5kZXggb2YgdGhpcyBub2RlJ3MgaW5qZWN0b3IgT1IgdGhlIGluZGV4IG9mIGEgcGFyZW50IGluamVjdG9yXG4gICAqIGluIHRoZSBzYW1lIHZpZXcuIFdlIHBhc3MgdGhlIHBhcmVudCBpbmplY3RvciBpbmRleCBkb3duIHRoZSBub2RlIHRyZWUgb2YgYSB2aWV3IHNvIGl0J3NcbiAgICogcG9zc2libGUgdG8gZmluZCB0aGUgcGFyZW50IGluamVjdG9yIHdpdGhvdXQgd2Fsa2luZyBhIHBvdGVudGlhbGx5IGRlZXAgbm9kZSB0cmVlLiBJbmplY3RvclxuICAgKiBpbmRpY2VzIGFyZSBub3Qgc2V0IGFjcm9zcyB2aWV3IGJvdW5kYXJpZXMgYmVjYXVzZSB0aGVyZSBjb3VsZCBiZSBtdWx0aXBsZSBjb21wb25lbnQgaG9zdHMuXG4gICAqXG4gICAqIElmIHROb2RlLmluamVjdG9ySW5kZXggPT09IHROb2RlLnBhcmVudC5pbmplY3RvckluZGV4LCB0aGVuIHRoZSBpbmRleCBiZWxvbmdzIHRvIGEgcGFyZW50XG4gICAqIGluamVjdG9yLlxuICAgKi9cbiAgaW5qZWN0b3JJbmRleDogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBTdG9yZXMgc3RhcnRpbmcgaW5kZXggb2YgdGhlIGRpcmVjdGl2ZXMuXG4gICAqL1xuICBkaXJlY3RpdmVTdGFydDogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBTdG9yZXMgZmluYWwgZXhjbHVzaXZlIGluZGV4IG9mIHRoZSBkaXJlY3RpdmVzLlxuICAgKi9cbiAgZGlyZWN0aXZlRW5kOiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIFN0b3JlcyB0aGUgZmlyc3QgaW5kZXggd2hlcmUgcHJvcGVydHkgYmluZGluZyBtZXRhZGF0YSBpcyBzdG9yZWQgZm9yXG4gICAqIHRoaXMgbm9kZS5cbiAgICovXG4gIHByb3BlcnR5TWV0YWRhdGFTdGFydEluZGV4OiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIFN0b3JlcyB0aGUgZXhjbHVzaXZlIGZpbmFsIGluZGV4IHdoZXJlIHByb3BlcnR5IGJpbmRpbmcgbWV0YWRhdGEgaXNcbiAgICogc3RvcmVkIGZvciB0aGlzIG5vZGUuXG4gICAqL1xuICBwcm9wZXJ0eU1ldGFkYXRhRW5kSW5kZXg6IG51bWJlcjtcblxuICAvKipcbiAgICogU3RvcmVzIGlmIE5vZGUgaXNDb21wb25lbnQsIGlzUHJvamVjdGVkLCBoYXNDb250ZW50UXVlcnkgYW5kIGhhc0NsYXNzSW5wdXRcbiAgICovXG4gIGZsYWdzOiBUTm9kZUZsYWdzO1xuXG4gIC8qKlxuICAgKiBUaGlzIG51bWJlciBzdG9yZXMgdHdvIHZhbHVlcyB1c2luZyBpdHMgYml0czpcbiAgICpcbiAgICogLSB0aGUgaW5kZXggb2YgdGhlIGZpcnN0IHByb3ZpZGVyIG9uIHRoYXQgbm9kZSAoZmlyc3QgMTYgYml0cylcbiAgICogLSB0aGUgY291bnQgb2YgdmlldyBwcm92aWRlcnMgZnJvbSB0aGUgY29tcG9uZW50IG9uIHRoaXMgbm9kZSAobGFzdCAxNiBiaXRzKVxuICAgKi9cbiAgLy8gVE9ETyhtaXNrbyk6IGJyZWFrIHRoaXMgaW50byBhY3R1YWwgdmFycy5cbiAgcHJvdmlkZXJJbmRleGVzOiBUTm9kZVByb3ZpZGVySW5kZXhlcztcblxuICAvKiogVGhlIHRhZyBuYW1lIGFzc29jaWF0ZWQgd2l0aCB0aGlzIG5vZGUuICovXG4gIHRhZ05hbWU6IHN0cmluZ3xudWxsO1xuXG4gIC8qKlxuICAgKiBBdHRyaWJ1dGVzIGFzc29jaWF0ZWQgd2l0aCBhbiBlbGVtZW50LiBXZSBuZWVkIHRvIHN0b3JlIGF0dHJpYnV0ZXMgdG8gc3VwcG9ydCB2YXJpb3VzIHVzZS1jYXNlc1xuICAgKiAoYXR0cmlidXRlIGluamVjdGlvbiwgY29udGVudCBwcm9qZWN0aW9uIHdpdGggc2VsZWN0b3JzLCBkaXJlY3RpdmVzIG1hdGNoaW5nKS5cbiAgICogQXR0cmlidXRlcyBhcmUgc3RvcmVkIHN0YXRpY2FsbHkgYmVjYXVzZSByZWFkaW5nIHRoZW0gZnJvbSB0aGUgRE9NIHdvdWxkIGJlIHdheSB0b28gc2xvdyBmb3JcbiAgICogY29udGVudCBwcm9qZWN0aW9uIGFuZCBxdWVyaWVzLlxuICAgKlxuICAgKiBTaW5jZSBhdHRycyB3aWxsIGFsd2F5cyBiZSBjYWxjdWxhdGVkIGZpcnN0LCB0aGV5IHdpbGwgbmV2ZXIgbmVlZCB0byBiZSBtYXJrZWQgdW5kZWZpbmVkIGJ5XG4gICAqIG90aGVyIGluc3RydWN0aW9ucy5cbiAgICpcbiAgICogRm9yIHJlZ3VsYXIgYXR0cmlidXRlcyBhIG5hbWUgb2YgYW4gYXR0cmlidXRlIGFuZCBpdHMgdmFsdWUgYWx0ZXJuYXRlIGluIHRoZSBhcnJheS5cbiAgICogZS5nLiBbJ3JvbGUnLCAnY2hlY2tib3gnXVxuICAgKiBUaGlzIGFycmF5IGNhbiBjb250YWluIGZsYWdzIHRoYXQgd2lsbCBpbmRpY2F0ZSBcInNwZWNpYWwgYXR0cmlidXRlc1wiIChhdHRyaWJ1dGVzIHdpdGhcbiAgICogbmFtZXNwYWNlcywgYXR0cmlidXRlcyBleHRyYWN0ZWQgZnJvbSBiaW5kaW5ncyBhbmQgb3V0cHV0cykuXG4gICAqL1xuICBhdHRyczogVEF0dHJpYnV0ZXN8bnVsbDtcblxuICAvKipcbiAgICogQSBzZXQgb2YgbG9jYWwgbmFtZXMgdW5kZXIgd2hpY2ggYSBnaXZlbiBlbGVtZW50IGlzIGV4cG9ydGVkIGluIGEgdGVtcGxhdGUgYW5kXG4gICAqIHZpc2libGUgdG8gcXVlcmllcy4gQW4gZW50cnkgaW4gdGhpcyBhcnJheSBjYW4gYmUgY3JlYXRlZCBmb3IgZGlmZmVyZW50IHJlYXNvbnM6XG4gICAqIC0gYW4gZWxlbWVudCBpdHNlbGYgaXMgcmVmZXJlbmNlZCwgZXguOiBgPGRpdiAjZm9vPmBcbiAgICogLSBhIGNvbXBvbmVudCBpcyByZWZlcmVuY2VkLCBleC46IGA8bXktY21wdCAjZm9vPmBcbiAgICogLSBhIGRpcmVjdGl2ZSBpcyByZWZlcmVuY2VkLCBleC46IGA8bXktY21wdCAjZm9vPVwiZGlyZWN0aXZlRXhwb3J0QXNcIj5gLlxuICAgKlxuICAgKiBBIGdpdmVuIGVsZW1lbnQgbWlnaHQgaGF2ZSBkaWZmZXJlbnQgbG9jYWwgbmFtZXMgYW5kIHRob3NlIG5hbWVzIGNhbiBiZSBhc3NvY2lhdGVkXG4gICAqIHdpdGggYSBkaXJlY3RpdmUuIFdlIHN0b3JlIGxvY2FsIG5hbWVzIGF0IGV2ZW4gaW5kZXhlcyB3aGlsZSBvZGQgaW5kZXhlcyBhcmUgcmVzZXJ2ZWRcbiAgICogZm9yIGRpcmVjdGl2ZSBpbmRleCBpbiBhIHZpZXcgKG9yIGAtMWAgaWYgdGhlcmUgaXMgbm8gYXNzb2NpYXRlZCBkaXJlY3RpdmUpLlxuICAgKlxuICAgKiBTb21lIGV4YW1wbGVzOlxuICAgKiAtIGA8ZGl2ICNmb28+YCA9PiBgW1wiZm9vXCIsIC0xXWBcbiAgICogLSBgPG15LWNtcHQgI2Zvbz5gID0+IGBbXCJmb29cIiwgbXlDbXB0SWR4XWBcbiAgICogLSBgPG15LWNtcHQgI2ZvbyAjYmFyPVwiZGlyZWN0aXZlRXhwb3J0QXNcIj5gID0+IGBbXCJmb29cIiwgbXlDbXB0SWR4LCBcImJhclwiLCBkaXJlY3RpdmVJZHhdYFxuICAgKiAtIGA8ZGl2ICNmb28gI2Jhcj1cImRpcmVjdGl2ZUV4cG9ydEFzXCI+YCA9PiBgW1wiZm9vXCIsIC0xLCBcImJhclwiLCBkaXJlY3RpdmVJZHhdYFxuICAgKi9cbiAgbG9jYWxOYW1lczogKHN0cmluZ3xudW1iZXIpW118bnVsbDtcblxuICAvKiogSW5mb3JtYXRpb24gYWJvdXQgaW5wdXQgcHJvcGVydGllcyB0aGF0IG5lZWQgdG8gYmUgc2V0IG9uY2UgZnJvbSBhdHRyaWJ1dGUgZGF0YS4gKi9cbiAgaW5pdGlhbElucHV0czogSW5pdGlhbElucHV0RGF0YXxudWxsfHVuZGVmaW5lZDtcblxuICAvKipcbiAgICogSW5wdXQgZGF0YSBmb3IgYWxsIGRpcmVjdGl2ZXMgb24gdGhpcyBub2RlLlxuICAgKlxuICAgKiAtIGB1bmRlZmluZWRgIG1lYW5zIHRoYXQgdGhlIHByb3AgaGFzIG5vdCBiZWVuIGluaXRpYWxpemVkIHlldCxcbiAgICogLSBgbnVsbGAgbWVhbnMgdGhhdCB0aGUgcHJvcCBoYXMgYmVlbiBpbml0aWFsaXplZCBidXQgbm8gaW5wdXRzIGhhdmUgYmVlbiBmb3VuZC5cbiAgICovXG4gIGlucHV0czogUHJvcGVydHlBbGlhc2VzfG51bGx8dW5kZWZpbmVkO1xuXG4gIC8qKlxuICAgKiBPdXRwdXQgZGF0YSBmb3IgYWxsIGRpcmVjdGl2ZXMgb24gdGhpcyBub2RlLlxuICAgKlxuICAgKiAtIGB1bmRlZmluZWRgIG1lYW5zIHRoYXQgdGhlIHByb3AgaGFzIG5vdCBiZWVuIGluaXRpYWxpemVkIHlldCxcbiAgICogLSBgbnVsbGAgbWVhbnMgdGhhdCB0aGUgcHJvcCBoYXMgYmVlbiBpbml0aWFsaXplZCBidXQgbm8gb3V0cHV0cyBoYXZlIGJlZW4gZm91bmQuXG4gICAqL1xuICBvdXRwdXRzOiBQcm9wZXJ0eUFsaWFzZXN8bnVsbHx1bmRlZmluZWQ7XG5cbiAgLyoqXG4gICAqIFRoZSBUVmlldyBvciBUVmlld3MgYXR0YWNoZWQgdG8gdGhpcyBub2RlLlxuICAgKlxuICAgKiBJZiB0aGlzIFROb2RlIGNvcnJlc3BvbmRzIHRvIGFuIExDb250YWluZXIgd2l0aCBpbmxpbmUgdmlld3MsIHRoZSBjb250YWluZXIgd2lsbFxuICAgKiBuZWVkIHRvIHN0b3JlIHNlcGFyYXRlIHN0YXRpYyBkYXRhIGZvciBlYWNoIG9mIGl0cyB2aWV3IGJsb2NrcyAoVFZpZXdbXSkuIE90aGVyd2lzZSxcbiAgICogbm9kZXMgaW4gaW5saW5lIHZpZXdzIHdpdGggdGhlIHNhbWUgaW5kZXggYXMgbm9kZXMgaW4gdGhlaXIgcGFyZW50IHZpZXdzIHdpbGwgb3ZlcndyaXRlXG4gICAqIGVhY2ggb3RoZXIsIGFzIHRoZXkgYXJlIGluIHRoZSBzYW1lIHRlbXBsYXRlLlxuICAgKlxuICAgKiBFYWNoIGluZGV4IGluIHRoaXMgYXJyYXkgY29ycmVzcG9uZHMgdG8gdGhlIHN0YXRpYyBkYXRhIGZvciBhIGNlcnRhaW5cbiAgICogdmlldy4gU28gaWYgeW91IGhhZCBWKDApIGFuZCBWKDEpIGluIGEgY29udGFpbmVyLCB5b3UgbWlnaHQgaGF2ZTpcbiAgICpcbiAgICogW1xuICAgKiAgIFt7dGFnTmFtZTogJ2RpdicsIGF0dHJzOiAuLi59LCBudWxsXSwgICAgIC8vIFYoMCkgVFZpZXdcbiAgICogICBbe3RhZ05hbWU6ICdidXR0b24nLCBhdHRycyAuLi59LCBudWxsXSAgICAvLyBWKDEpIFRWaWV3XG4gICAqXG4gICAqIElmIHRoaXMgVE5vZGUgY29ycmVzcG9uZHMgdG8gYW4gTENvbnRhaW5lciB3aXRoIGEgdGVtcGxhdGUgKGUuZy4gc3RydWN0dXJhbFxuICAgKiBkaXJlY3RpdmUpLCB0aGUgdGVtcGxhdGUncyBUVmlldyB3aWxsIGJlIHN0b3JlZCBoZXJlLlxuICAgKlxuICAgKiBJZiB0aGlzIFROb2RlIGNvcnJlc3BvbmRzIHRvIGFuIGVsZW1lbnQsIHRWaWV3cyB3aWxsIGJlIG51bGwgLlxuICAgKi9cbiAgdFZpZXdzOiBUVmlld3xUVmlld1tdfG51bGw7XG5cbiAgLyoqXG4gICAqIFRoZSBuZXh0IHNpYmxpbmcgbm9kZS4gTmVjZXNzYXJ5IHNvIHdlIGNhbiBwcm9wYWdhdGUgdGhyb3VnaCB0aGUgcm9vdCBub2RlcyBvZiBhIHZpZXdcbiAgICogdG8gaW5zZXJ0IHRoZW0gb3IgcmVtb3ZlIHRoZW0gZnJvbSB0aGUgRE9NLlxuICAgKi9cbiAgbmV4dDogVE5vZGV8bnVsbDtcblxuICAvKipcbiAgICogRmlyc3QgY2hpbGQgb2YgdGhlIGN1cnJlbnQgbm9kZS5cbiAgICpcbiAgICogRm9yIGNvbXBvbmVudCBub2RlcywgdGhlIGNoaWxkIHdpbGwgYWx3YXlzIGJlIGEgQ29udGVudENoaWxkIChpbiBzYW1lIHZpZXcpLlxuICAgKiBGb3IgZW1iZWRkZWQgdmlldyBub2RlcywgdGhlIGNoaWxkIHdpbGwgYmUgaW4gdGhlaXIgY2hpbGQgdmlldy5cbiAgICovXG4gIGNoaWxkOiBUTm9kZXxudWxsO1xuXG4gIC8qKlxuICAgKiBQYXJlbnQgbm9kZSAoaW4gdGhlIHNhbWUgdmlldyBvbmx5KS5cbiAgICpcbiAgICogV2UgbmVlZCBhIHJlZmVyZW5jZSB0byBhIG5vZGUncyBwYXJlbnQgc28gd2UgY2FuIGFwcGVuZCB0aGUgbm9kZSB0byBpdHMgcGFyZW50J3MgbmF0aXZlXG4gICAqIGVsZW1lbnQgYXQgdGhlIGFwcHJvcHJpYXRlIHRpbWUuXG4gICAqXG4gICAqIElmIHRoZSBwYXJlbnQgd291bGQgYmUgaW4gYSBkaWZmZXJlbnQgdmlldyAoZS5nLiBjb21wb25lbnQgaG9zdCksIHRoaXMgcHJvcGVydHkgd2lsbCBiZSBudWxsLlxuICAgKiBJdCdzIGltcG9ydGFudCB0aGF0IHdlIGRvbid0IHRyeSB0byBjcm9zcyBjb21wb25lbnQgYm91bmRhcmllcyB3aGVuIHJldHJpZXZpbmcgdGhlIHBhcmVudFxuICAgKiBiZWNhdXNlIHRoZSBwYXJlbnQgd2lsbCBjaGFuZ2UgKGUuZy4gaW5kZXgsIGF0dHJzKSBkZXBlbmRpbmcgb24gd2hlcmUgdGhlIGNvbXBvbmVudCB3YXNcbiAgICogdXNlZCAoYW5kIHRodXMgc2hvdWxkbid0IGJlIHN0b3JlZCBvbiBUTm9kZSkuIEluIHRoZXNlIGNhc2VzLCB3ZSByZXRyaWV2ZSB0aGUgcGFyZW50IHRocm91Z2hcbiAgICogTFZpZXcubm9kZSBpbnN0ZWFkICh3aGljaCB3aWxsIGJlIGluc3RhbmNlLXNwZWNpZmljKS5cbiAgICpcbiAgICogSWYgdGhpcyBpcyBhbiBpbmxpbmUgdmlldyBub2RlIChWKSwgdGhlIHBhcmVudCB3aWxsIGJlIGl0cyBjb250YWluZXIuXG4gICAqL1xuICBwYXJlbnQ6IFRFbGVtZW50Tm9kZXxUQ29udGFpbmVyTm9kZXxudWxsO1xuXG4gIC8qKlxuICAgKiBJZiB0aGlzIG5vZGUgaXMgcGFydCBvZiBhbiBpMThuIGJsb2NrLCBpdCBpbmRpY2F0ZXMgd2hldGhlciB0aGlzIG5vZGUgaXMgcGFydCBvZiB0aGUgRE9NLlxuICAgKiBJZiB0aGlzIG5vZGUgaXMgbm90IHBhcnQgb2YgYW4gaTE4biBibG9jaywgdGhpcyBmaWVsZCBpcyBudWxsLlxuICAgKi9cbiAgZGV0YWNoZWQ6IGJvb2xlYW58bnVsbDtcblxuICBzdHlsaW5nVGVtcGxhdGU6IFN0eWxpbmdDb250ZXh0fG51bGw7XG4gIC8qKlxuICAgKiBMaXN0IG9mIHByb2plY3RlZCBUTm9kZXMgZm9yIGEgZ2l2ZW4gY29tcG9uZW50IGhvc3QgZWxlbWVudCBPUiBpbmRleCBpbnRvIHRoZSBzYWlkIG5vZGVzLlxuICAgKlxuICAgKiBGb3IgZWFzaWVyIGRpc2N1c3Npb24gYXNzdW1lIHRoaXMgZXhhbXBsZTpcbiAgICogYDxwYXJlbnQ+YCdzIHZpZXcgZGVmaW5pdGlvbjpcbiAgICogYGBgXG4gICAqIDxjaGlsZCBpZD1cImMxXCI+Y29udGVudDE8L2NoaWxkPlxuICAgKiA8Y2hpbGQgaWQ9XCJjMlwiPjxzcGFuPmNvbnRlbnQyPC9zcGFuPjwvY2hpbGQ+XG4gICAqIGBgYFxuICAgKiBgPGNoaWxkPmAncyB2aWV3IGRlZmluaXRpb246XG4gICAqIGBgYFxuICAgKiA8bmctY29udGVudCBpZD1cImNvbnQxXCI+PC9uZy1jb250ZW50PlxuICAgKiBgYGBcbiAgICpcbiAgICogSWYgYEFycmF5LmlzQXJyYXkocHJvamVjdGlvbilgIHRoZW4gYFROb2RlYCBpcyBhIGhvc3QgZWxlbWVudDpcbiAgICogLSBgcHJvamVjdGlvbmAgc3RvcmVzIHRoZSBjb250ZW50IG5vZGVzIHdoaWNoIGFyZSB0byBiZSBwcm9qZWN0ZWQuXG4gICAqICAgIC0gVGhlIG5vZGVzIHJlcHJlc2VudCBjYXRlZ29yaWVzIGRlZmluZWQgYnkgdGhlIHNlbGVjdG9yOiBGb3IgZXhhbXBsZTpcbiAgICogICAgICBgPG5nLWNvbnRlbnQvPjxuZy1jb250ZW50IHNlbGVjdD1cImFiY1wiLz5gIHdvdWxkIHJlcHJlc2VudCB0aGUgaGVhZHMgZm9yIGA8bmctY29udGVudC8+YFxuICAgKiAgICAgIGFuZCBgPG5nLWNvbnRlbnQgc2VsZWN0PVwiYWJjXCIvPmAgcmVzcGVjdGl2ZWx5LlxuICAgKiAgICAtIFRoZSBub2RlcyB3ZSBzdG9yZSBpbiBgcHJvamVjdGlvbmAgYXJlIGhlYWRzIG9ubHksIHdlIHVzZWQgYC5uZXh0YCB0byBnZXQgdGhlaXJcbiAgICogICAgICBzaWJsaW5ncy5cbiAgICogICAgLSBUaGUgbm9kZXMgYC5uZXh0YCBpcyBzb3J0ZWQvcmV3cml0dGVuIGFzIHBhcnQgb2YgdGhlIHByb2plY3Rpb24gc2V0dXAuXG4gICAqICAgIC0gYHByb2plY3Rpb25gIHNpemUgaXMgZXF1YWwgdG8gdGhlIG51bWJlciBvZiBwcm9qZWN0aW9ucyBgPG5nLWNvbnRlbnQ+YC4gVGhlIHNpemUgb2ZcbiAgICogICAgICBgYzFgIHdpbGwgYmUgYDFgIGJlY2F1c2UgYDxjaGlsZD5gIGhhcyBvbmx5IG9uZSBgPG5nLWNvbnRlbnQ+YC5cbiAgICogLSB3ZSBzdG9yZSBgcHJvamVjdGlvbmAgd2l0aCB0aGUgaG9zdCAoYGMxYCwgYGMyYCkgcmF0aGVyIHRoYW4gdGhlIGA8bmctY29udGVudD5gIChgY29udDFgKVxuICAgKiAgIGJlY2F1c2UgdGhlIHNhbWUgY29tcG9uZW50IChgPGNoaWxkPmApIGNhbiBiZSB1c2VkIGluIG11bHRpcGxlIGxvY2F0aW9ucyAoYGMxYCwgYGMyYCkgYW5kIGFzXG4gICAqICAgYSByZXN1bHQgaGF2ZSBkaWZmZXJlbnQgc2V0IG9mIG5vZGVzIHRvIHByb2plY3QuXG4gICAqIC0gd2l0aG91dCBgcHJvamVjdGlvbmAgaXQgd291bGQgYmUgZGlmZmljdWx0IHRvIGVmZmljaWVudGx5IHRyYXZlcnNlIG5vZGVzIHRvIGJlIHByb2plY3RlZC5cbiAgICpcbiAgICogSWYgYHR5cGVvZiBwcm9qZWN0aW9uID09ICdudW1iZXInYCB0aGVuIGBUTm9kZWAgaXMgYSBgPG5nLWNvbnRlbnQ+YCBlbGVtZW50OlxuICAgKiAtIGBwcm9qZWN0aW9uYCBpcyBhbiBpbmRleCBvZiB0aGUgaG9zdCdzIGBwcm9qZWN0aW9uYE5vZGVzLlxuICAgKiAgIC0gVGhpcyB3b3VsZCByZXR1cm4gdGhlIGZpcnN0IGhlYWQgbm9kZSB0byBwcm9qZWN0OlxuICAgKiAgICAgYGdldEhvc3QoY3VycmVudFROb2RlKS5wcm9qZWN0aW9uW2N1cnJlbnRUTm9kZS5wcm9qZWN0aW9uXWAuXG4gICAqIC0gV2hlbiBwcm9qZWN0aW5nIG5vZGVzIHRoZSBwYXJlbnQgbm9kZSByZXRyaWV2ZWQgbWF5IGJlIGEgYDxuZy1jb250ZW50PmAgbm9kZSwgaW4gd2hpY2ggY2FzZVxuICAgKiAgIHRoZSBwcm9jZXNzIGlzIHJlY3Vyc2l2ZSBpbiBuYXR1cmUgKG5vdCBpbXBsZW1lbnRhdGlvbikuXG4gICAqXG4gICAqIElmIGBwcm9qZWN0aW9uYCBpcyBvZiB0eXBlIGBSTm9kZVtdW11gIHRoYW4gd2UgaGF2ZSBhIGNvbGxlY3Rpb24gb2YgbmF0aXZlIG5vZGVzIHBhc3NlZCBhc1xuICAgKiBwcm9qZWN0YWJsZSBub2RlcyBkdXJpbmcgZHluYW1pYyBjb21wb25lbnQgY3JlYXRpb24uXG4gICAqL1xuICBwcm9qZWN0aW9uOiAoVE5vZGV8Uk5vZGVbXSlbXXxudW1iZXJ8bnVsbDtcbn1cblxuLyoqIFN0YXRpYyBkYXRhIGZvciBhbiBlbGVtZW50ICAqL1xuZXhwb3J0IGludGVyZmFjZSBURWxlbWVudE5vZGUgZXh0ZW5kcyBUTm9kZSB7XG4gIC8qKiBJbmRleCBpbiB0aGUgZGF0YVtdIGFycmF5ICovXG4gIGluZGV4OiBudW1iZXI7XG4gIGNoaWxkOiBURWxlbWVudE5vZGV8VFRleHROb2RlfFRFbGVtZW50Q29udGFpbmVyTm9kZXxUQ29udGFpbmVyTm9kZXxUUHJvamVjdGlvbk5vZGV8bnVsbDtcbiAgLyoqXG4gICAqIEVsZW1lbnQgbm9kZXMgd2lsbCBoYXZlIHBhcmVudHMgdW5sZXNzIHRoZXkgYXJlIHRoZSBmaXJzdCBub2RlIG9mIGEgY29tcG9uZW50IG9yXG4gICAqIGVtYmVkZGVkIHZpZXcgKHdoaWNoIG1lYW5zIHRoZWlyIHBhcmVudCBpcyBpbiBhIGRpZmZlcmVudCB2aWV3IGFuZCBtdXN0IGJlXG4gICAqIHJldHJpZXZlZCB1c2luZyB2aWV3RGF0YVtIT1NUX05PREVdKS5cbiAgICovXG4gIHBhcmVudDogVEVsZW1lbnROb2RlfFRFbGVtZW50Q29udGFpbmVyTm9kZXxudWxsO1xuICB0Vmlld3M6IG51bGw7XG5cbiAgLyoqXG4gICAqIElmIHRoaXMgaXMgYSBjb21wb25lbnQgVE5vZGUgd2l0aCBwcm9qZWN0aW9uLCB0aGlzIHdpbGwgYmUgYW4gYXJyYXkgb2YgcHJvamVjdGVkXG4gICAqIFROb2RlcyBvciBuYXRpdmUgbm9kZXMgKHNlZSBUTm9kZS5wcm9qZWN0aW9uIGZvciBtb3JlIGluZm8pLiBJZiBpdCdzIGEgcmVndWxhciBlbGVtZW50IG5vZGUgb3JcbiAgICogYSBjb21wb25lbnQgd2l0aG91dCBwcm9qZWN0aW9uLCBpdCB3aWxsIGJlIG51bGwuXG4gICAqL1xuICBwcm9qZWN0aW9uOiAoVE5vZGV8Uk5vZGVbXSlbXXxudWxsO1xufVxuXG4vKiogU3RhdGljIGRhdGEgZm9yIGEgdGV4dCBub2RlICovXG5leHBvcnQgaW50ZXJmYWNlIFRUZXh0Tm9kZSBleHRlbmRzIFROb2RlIHtcbiAgLyoqIEluZGV4IGluIHRoZSBkYXRhW10gYXJyYXkgKi9cbiAgaW5kZXg6IG51bWJlcjtcbiAgY2hpbGQ6IG51bGw7XG4gIC8qKlxuICAgKiBUZXh0IG5vZGVzIHdpbGwgaGF2ZSBwYXJlbnRzIHVubGVzcyB0aGV5IGFyZSB0aGUgZmlyc3Qgbm9kZSBvZiBhIGNvbXBvbmVudCBvclxuICAgKiBlbWJlZGRlZCB2aWV3ICh3aGljaCBtZWFucyB0aGVpciBwYXJlbnQgaXMgaW4gYSBkaWZmZXJlbnQgdmlldyBhbmQgbXVzdCBiZVxuICAgKiByZXRyaWV2ZWQgdXNpbmcgTFZpZXcubm9kZSkuXG4gICAqL1xuICBwYXJlbnQ6IFRFbGVtZW50Tm9kZXxURWxlbWVudENvbnRhaW5lck5vZGV8bnVsbDtcbiAgdFZpZXdzOiBudWxsO1xuICBwcm9qZWN0aW9uOiBudWxsO1xufVxuXG4vKiogU3RhdGljIGRhdGEgZm9yIGFuIExDb250YWluZXIgKi9cbmV4cG9ydCBpbnRlcmZhY2UgVENvbnRhaW5lck5vZGUgZXh0ZW5kcyBUTm9kZSB7XG4gIC8qKlxuICAgKiBJbmRleCBpbiB0aGUgZGF0YVtdIGFycmF5LlxuICAgKlxuICAgKiBJZiBpdCdzIC0xLCB0aGlzIGlzIGEgZHluYW1pY2FsbHkgY3JlYXRlZCBjb250YWluZXIgbm9kZSB0aGF0IGlzbid0IHN0b3JlZCBpblxuICAgKiBkYXRhW10gKGUuZy4gd2hlbiB5b3UgaW5qZWN0IFZpZXdDb250YWluZXJSZWYpIC5cbiAgICovXG4gIGluZGV4OiBudW1iZXI7XG4gIGNoaWxkOiBudWxsO1xuXG4gIC8qKlxuICAgKiBDb250YWluZXIgbm9kZXMgd2lsbCBoYXZlIHBhcmVudHMgdW5sZXNzOlxuICAgKlxuICAgKiAtIFRoZXkgYXJlIHRoZSBmaXJzdCBub2RlIG9mIGEgY29tcG9uZW50IG9yIGVtYmVkZGVkIHZpZXdcbiAgICogLSBUaGV5IGFyZSBkeW5hbWljYWxseSBjcmVhdGVkXG4gICAqL1xuICBwYXJlbnQ6IFRFbGVtZW50Tm9kZXxURWxlbWVudENvbnRhaW5lck5vZGV8bnVsbDtcbiAgdFZpZXdzOiBUVmlld3xUVmlld1tdfG51bGw7XG4gIHByb2plY3Rpb246IG51bGw7XG59XG5cbi8qKiBTdGF0aWMgZGF0YSBmb3IgYW4gPG5nLWNvbnRhaW5lcj4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgVEVsZW1lbnRDb250YWluZXJOb2RlIGV4dGVuZHMgVE5vZGUge1xuICAvKiogSW5kZXggaW4gdGhlIExWaWV3W10gYXJyYXkuICovXG4gIGluZGV4OiBudW1iZXI7XG4gIGNoaWxkOiBURWxlbWVudE5vZGV8VFRleHROb2RlfFRDb250YWluZXJOb2RlfFRFbGVtZW50Q29udGFpbmVyTm9kZXxUUHJvamVjdGlvbk5vZGV8bnVsbDtcbiAgcGFyZW50OiBURWxlbWVudE5vZGV8VEVsZW1lbnRDb250YWluZXJOb2RlfG51bGw7XG4gIHRWaWV3czogbnVsbDtcbiAgcHJvamVjdGlvbjogbnVsbDtcbn1cblxuLyoqIFN0YXRpYyBkYXRhIGZvciBhbiBJQ1UgZXhwcmVzc2lvbiAqL1xuZXhwb3J0IGludGVyZmFjZSBUSWN1Q29udGFpbmVyTm9kZSBleHRlbmRzIFROb2RlIHtcbiAgLyoqIEluZGV4IGluIHRoZSBMVmlld1tdIGFycmF5LiAqL1xuICBpbmRleDogbnVtYmVyO1xuICBjaGlsZDogVEVsZW1lbnROb2RlfFRUZXh0Tm9kZXxudWxsO1xuICBwYXJlbnQ6IFRFbGVtZW50Tm9kZXxURWxlbWVudENvbnRhaW5lck5vZGV8bnVsbDtcbiAgdFZpZXdzOiBudWxsO1xuICBwcm9qZWN0aW9uOiBudWxsO1xuICAvKipcbiAgICogSW5kaWNhdGVzIHRoZSBjdXJyZW50IGFjdGl2ZSBjYXNlIGZvciBhbiBJQ1UgZXhwcmVzc2lvbi5cbiAgICogSXQgaXMgbnVsbCB3aGVuIHRoZXJlIGlzIG5vIGFjdGl2ZSBjYXNlLlxuICAgKi9cbiAgYWN0aXZlQ2FzZUluZGV4OiBudW1iZXJ8bnVsbDtcbn1cblxuLyoqIFN0YXRpYyBkYXRhIGZvciBhIHZpZXcgICovXG5leHBvcnQgaW50ZXJmYWNlIFRWaWV3Tm9kZSBleHRlbmRzIFROb2RlIHtcbiAgLyoqIElmIC0xLCBpdCdzIGEgZHluYW1pY2FsbHkgY3JlYXRlZCB2aWV3LiBPdGhlcndpc2UsIGl0IGlzIHRoZSB2aWV3IGJsb2NrIElELiAqL1xuICBpbmRleDogbnVtYmVyO1xuICBjaGlsZDogVEVsZW1lbnROb2RlfFRUZXh0Tm9kZXxURWxlbWVudENvbnRhaW5lck5vZGV8VENvbnRhaW5lck5vZGV8VFByb2plY3Rpb25Ob2RlfG51bGw7XG4gIHBhcmVudDogVENvbnRhaW5lck5vZGV8bnVsbDtcbiAgdFZpZXdzOiBudWxsO1xuICBwcm9qZWN0aW9uOiBudWxsO1xufVxuXG4vKiogU3RhdGljIGRhdGEgZm9yIGFuIExQcm9qZWN0aW9uTm9kZSAgKi9cbmV4cG9ydCBpbnRlcmZhY2UgVFByb2plY3Rpb25Ob2RlIGV4dGVuZHMgVE5vZGUge1xuICAvKiogSW5kZXggaW4gdGhlIGRhdGFbXSBhcnJheSAqL1xuICBjaGlsZDogbnVsbDtcbiAgLyoqXG4gICAqIFByb2plY3Rpb24gbm9kZXMgd2lsbCBoYXZlIHBhcmVudHMgdW5sZXNzIHRoZXkgYXJlIHRoZSBmaXJzdCBub2RlIG9mIGEgY29tcG9uZW50XG4gICAqIG9yIGVtYmVkZGVkIHZpZXcgKHdoaWNoIG1lYW5zIHRoZWlyIHBhcmVudCBpcyBpbiBhIGRpZmZlcmVudCB2aWV3IGFuZCBtdXN0IGJlXG4gICAqIHJldHJpZXZlZCB1c2luZyBMVmlldy5ub2RlKS5cbiAgICovXG4gIHBhcmVudDogVEVsZW1lbnROb2RlfFRFbGVtZW50Q29udGFpbmVyTm9kZXxudWxsO1xuICB0Vmlld3M6IG51bGw7XG5cbiAgLyoqIEluZGV4IG9mIHRoZSBwcm9qZWN0aW9uIG5vZGUuIChTZWUgVE5vZGUucHJvamVjdGlvbiBmb3IgbW9yZSBpbmZvLikgKi9cbiAgcHJvamVjdGlvbjogbnVtYmVyO1xufVxuXG4vKipcbiAqIFRoaXMgbWFwcGluZyBpcyBuZWNlc3Nhcnkgc28gd2UgY2FuIHNldCBpbnB1dCBwcm9wZXJ0aWVzIGFuZCBvdXRwdXQgbGlzdGVuZXJzXG4gKiBwcm9wZXJseSBhdCBydW50aW1lIHdoZW4gcHJvcGVydHkgbmFtZXMgYXJlIG1pbmlmaWVkIG9yIGFsaWFzZWQuXG4gKlxuICogS2V5OiB1bm1pbmlmaWVkIC8gcHVibGljIGlucHV0IG9yIG91dHB1dCBuYW1lXG4gKiBWYWx1ZTogYXJyYXkgY29udGFpbmluZyBtaW5pZmllZCAvIGludGVybmFsIG5hbWUgYW5kIHJlbGF0ZWQgZGlyZWN0aXZlIGluZGV4XG4gKlxuICogVGhlIHZhbHVlIG11c3QgYmUgYW4gYXJyYXkgdG8gc3VwcG9ydCBpbnB1dHMgYW5kIG91dHB1dHMgd2l0aCB0aGUgc2FtZSBuYW1lXG4gKiBvbiB0aGUgc2FtZSBub2RlLlxuICovXG5leHBvcnQgdHlwZSBQcm9wZXJ0eUFsaWFzZXMgPSB7XG4gIC8vIFRoaXMgdXNlcyBhbiBvYmplY3QgbWFwIGJlY2F1c2UgdXNpbmcgdGhlIE1hcCB0eXBlIHdvdWxkIGJlIHRvbyBzbG93XG4gIFtrZXk6IHN0cmluZ106IFByb3BlcnR5QWxpYXNWYWx1ZVxufTtcblxuLyoqXG4gKiBTdG9yZSB0aGUgcnVudGltZSBpbnB1dCBvciBvdXRwdXQgbmFtZXMgZm9yIGFsbCB0aGUgZGlyZWN0aXZlcy5cbiAqXG4gKiBpKzA6IGRpcmVjdGl2ZSBpbnN0YW5jZSBpbmRleFxuICogaSsxOiBwdWJsaWNOYW1lXG4gKiBpKzI6IHByaXZhdGVOYW1lXG4gKlxuICogZS5nLiBbMCwgJ2NoYW5nZScsICdjaGFuZ2UtbWluaWZpZWQnXVxuICovXG5leHBvcnQgdHlwZSBQcm9wZXJ0eUFsaWFzVmFsdWUgPSAobnVtYmVyIHwgc3RyaW5nKVtdO1xuXG4vKipcbiAqIFRoaXMgYXJyYXkgY29udGFpbnMgaW5mb3JtYXRpb24gYWJvdXQgaW5wdXQgcHJvcGVydGllcyB0aGF0XG4gKiBuZWVkIHRvIGJlIHNldCBvbmNlIGZyb20gYXR0cmlidXRlIGRhdGEuIEl0J3Mgb3JkZXJlZCBieVxuICogZGlyZWN0aXZlIGluZGV4IChyZWxhdGl2ZSB0byBlbGVtZW50KSBzbyBpdCdzIHNpbXBsZSB0b1xuICogbG9vayB1cCBhIHNwZWNpZmljIGRpcmVjdGl2ZSdzIGluaXRpYWwgaW5wdXQgZGF0YS5cbiAqXG4gKiBXaXRoaW4gZWFjaCBzdWItYXJyYXk6XG4gKlxuICogaSswOiBhdHRyaWJ1dGUgbmFtZVxuICogaSsxOiBtaW5pZmllZC9pbnRlcm5hbCBpbnB1dCBuYW1lXG4gKiBpKzI6IGluaXRpYWwgdmFsdWVcbiAqXG4gKiBJZiBhIGRpcmVjdGl2ZSBvbiBhIG5vZGUgZG9lcyBub3QgaGF2ZSBhbnkgaW5wdXQgcHJvcGVydGllc1xuICogdGhhdCBzaG91bGQgYmUgc2V0IGZyb20gYXR0cmlidXRlcywgaXRzIGluZGV4IGlzIHNldCB0byBudWxsXG4gKiB0byBhdm9pZCBhIHNwYXJzZSBhcnJheS5cbiAqXG4gKiBlLmcuIFtudWxsLCBbJ3JvbGUtbWluJywgJ21pbmlmaWVkLWlucHV0JywgJ2J1dHRvbiddXVxuICovXG5leHBvcnQgdHlwZSBJbml0aWFsSW5wdXREYXRhID0gKEluaXRpYWxJbnB1dHMgfCBudWxsKVtdO1xuXG4vKipcbiAqIFVzZWQgYnkgSW5pdGlhbElucHV0RGF0YSB0byBzdG9yZSBpbnB1dCBwcm9wZXJ0aWVzXG4gKiB0aGF0IHNob3VsZCBiZSBzZXQgb25jZSBmcm9tIGF0dHJpYnV0ZXMuXG4gKlxuICogaSswOiBhdHRyaWJ1dGUgbmFtZVxuICogaSsxOiBtaW5pZmllZC9pbnRlcm5hbCBpbnB1dCBuYW1lXG4gKiBpKzI6IGluaXRpYWwgdmFsdWVcbiAqXG4gKiBlLmcuIFsncm9sZS1taW4nLCAnbWluaWZpZWQtaW5wdXQnLCAnYnV0dG9uJ11cbiAqL1xuZXhwb3J0IHR5cGUgSW5pdGlhbElucHV0cyA9IHN0cmluZ1tdO1xuXG4vLyBOb3RlOiBUaGlzIGhhY2sgaXMgbmVjZXNzYXJ5IHNvIHdlIGRvbid0IGVycm9uZW91c2x5IGdldCBhIGNpcmN1bGFyIGRlcGVuZGVuY3lcbi8vIGZhaWx1cmUgYmFzZWQgb24gdHlwZXMuXG5leHBvcnQgY29uc3QgdW51c2VkVmFsdWVFeHBvcnRUb1BsYWNhdGVBamQgPSAxO1xuXG4vKipcbiAqIFR5cGUgcmVwcmVzZW50aW5nIGEgc2V0IG9mIFROb2RlcyB0aGF0IGNhbiBoYXZlIGxvY2FsIHJlZnMgKGAjZm9vYCkgcGxhY2VkIG9uIHRoZW0uXG4gKi9cbmV4cG9ydCB0eXBlIFROb2RlV2l0aExvY2FsUmVmcyA9IFRDb250YWluZXJOb2RlIHwgVEVsZW1lbnROb2RlIHwgVEVsZW1lbnRDb250YWluZXJOb2RlO1xuXG4vKipcbiAqIFR5cGUgZm9yIGEgZnVuY3Rpb24gdGhhdCBleHRyYWN0cyBhIHZhbHVlIGZvciBhIGxvY2FsIHJlZnMuXG4gKiBFeGFtcGxlOlxuICogLSBgPGRpdiAjbmF0aXZlRGl2RWw+YCAtIGBuYXRpdmVEaXZFbGAgc2hvdWxkIHBvaW50IHRvIHRoZSBuYXRpdmUgYDxkaXY+YCBlbGVtZW50O1xuICogLSBgPG5nLXRlbXBsYXRlICN0cGxSZWY+YCAtIGB0cGxSZWZgIHNob3VsZCBwb2ludCB0byB0aGUgYFRlbXBsYXRlUmVmYCBpbnN0YW5jZTtcbiAqL1xuZXhwb3J0IHR5cGUgTG9jYWxSZWZFeHRyYWN0b3IgPSAodE5vZGU6IFROb2RlV2l0aExvY2FsUmVmcywgY3VycmVudFZpZXc6IExWaWV3KSA9PiBhbnk7XG4iXX0=