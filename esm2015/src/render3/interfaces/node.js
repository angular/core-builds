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
     * This marker indicates that the following attribute names were extracted from bindings (ex.:
     * [foo]="exp") and / or event handlers (ex. (bar)="doSth()").
     * Taking the above bindings and outputs as an example an attributes array could look as follows:
     * ['class', 'fade in', AttributeMarker.SelectOnly, 'foo', 'bar']
     */
    SelectOnly: 1,
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
     * TNodes (see TNode.projection for more info). If it's a regular element node or a
     * component without projection, it will be null.
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9kZS5qcyIsInNvdXJjZVJvb3QiOiIuLi8uLi8iLCJzb3VyY2VzIjpbInBhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaW50ZXJmYWNlcy9ub2RlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7SUFpQkUsWUFBaUI7SUFDakIsYUFBa0I7SUFDbEIsT0FBWTtJQUNaLFVBQWU7SUFDZixnQkFBcUI7SUFDckIsbUJBQXdCO0lBQ3hCLGVBQW9COzs7OztJQU9wQixpREFBaUQ7SUFDakQsY0FBb0I7SUFFcEIscURBQXFEO0lBQ3JELGNBQW9CO0lBRXBCLDBEQUEwRDtJQUMxRCxrQkFBd0I7SUFFeEIsb0ZBQW9GO0lBQ3BGLGdCQUFzQjs7Ozs7SUFPdEIsNEZBQTRGO0lBQzVGLDhCQUE0RDtJQUU1RDswQkFDc0I7SUFDdEIsOEJBQStCO0lBQy9CLG1DQUFpRTs7Ozs7SUFPakU7Ozs7T0FJRztJQUNILGVBQWdCO0lBRWhCOzs7OztPQUtHO0lBQ0gsYUFBYzs7Ozs7Ozs7Ozs7Ozs7O0FBcUJoQiwyQkE4TUM7Ozs7OztJQTVNQyxxQkFBZ0I7Ozs7Ozs7Ozs7SUFVaEIsc0JBQWM7Ozs7Ozs7Ozs7Ozs7OztJQWVkLDhCQUFzQjs7Ozs7SUFLdEIsK0JBQXVCOzs7OztJQUt2Qiw2QkFBcUI7Ozs7O0lBS3JCLHNCQUFrQjs7Ozs7Ozs7SUFTbEIsZ0NBQXNDOzs7OztJQUd0Qyx3QkFBcUI7Ozs7Ozs7Ozs7Ozs7Ozs7SUFnQnJCLHNCQUF3Qjs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQW1CeEIsMkJBQW1DOzs7OztJQUduQyw4QkFBK0M7Ozs7Ozs7O0lBUS9DLHVCQUF1Qzs7Ozs7Ozs7SUFRdkMsd0JBQXdDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBc0J4Qyx1QkFBMkI7Ozs7OztJQU0zQixxQkFBaUI7Ozs7Ozs7O0lBUWpCLHNCQUFrQjs7Ozs7Ozs7Ozs7Ozs7OztJQWdCbEIsdUJBQXlDOzs7Ozs7SUFNekMseUJBQXVCOztJQUV2QixnQ0FBcUM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBcUNyQywyQkFBdUM7Ozs7OztBQUl6QyxrQ0FrQkM7Ozs7OztJQWhCQyw2QkFBYzs7SUFDZCw2QkFBd0Y7Ozs7Ozs7SUFNeEYsOEJBQWdEOztJQUNoRCw4QkFBYTs7Ozs7OztJQU9iLGtDQUFnQzs7Ozs7O0FBSWxDLCtCQVlDOzs7Ozs7SUFWQywwQkFBYzs7SUFDZCwwQkFBWTs7Ozs7OztJQU1aLDJCQUFnRDs7SUFDaEQsMkJBQWE7O0lBQ2IsK0JBQWlCOzs7Ozs7QUFJbkIsb0NBbUJDOzs7Ozs7Ozs7SUFaQywrQkFBYzs7SUFDZCwrQkFBWTs7Ozs7Ozs7SUFRWixnQ0FBZ0Q7O0lBQ2hELGdDQUEyQjs7SUFDM0Isb0NBQWlCOzs7Ozs7QUFJbkIsMkNBT0M7Ozs7OztJQUxDLHNDQUFjOztJQUNkLHNDQUF3Rjs7SUFDeEYsdUNBQWdEOztJQUNoRCx1Q0FBYTs7SUFDYiwyQ0FBaUI7Ozs7OztBQUluQix1Q0FZQzs7Ozs7O0lBVkMsa0NBQWM7O0lBQ2Qsa0NBQW1DOztJQUNuQyxtQ0FBZ0Q7O0lBQ2hELG1DQUFhOztJQUNiLHVDQUFpQjs7Ozs7O0lBS2pCLDRDQUE2Qjs7Ozs7O0FBSS9CLCtCQU9DOzs7Ozs7SUFMQywwQkFBYzs7SUFDZCwwQkFBd0Y7O0lBQ3hGLDJCQUE0Qjs7SUFDNUIsMkJBQWE7O0lBQ2IsK0JBQWlCOzs7Ozs7QUFJbkIscUNBYUM7Ozs7OztJQVhDLGdDQUFZOzs7Ozs7O0lBTVosaUNBQWdEOztJQUNoRCxpQ0FBYTs7Ozs7SUFHYixxQ0FBbUI7Ozs7O0FBNkRyQixNQUFNLE9BQU8sNkJBQTZCLEdBQUcsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtTdHlsaW5nQ29udGV4dH0gZnJvbSAnLi9zdHlsaW5nJztcbmltcG9ydCB7TFZpZXcsIFRWaWV3fSBmcm9tICcuL3ZpZXcnO1xuXG5cbi8qKlxuICogVE5vZGVUeXBlIGNvcnJlc3BvbmRzIHRvIHRoZSBUTm9kZS50eXBlIHByb3BlcnR5LiBJdCBjb250YWlucyBpbmZvcm1hdGlvblxuICogb24gaG93IHRvIG1hcCBhIHBhcnRpY3VsYXIgc2V0IG9mIGJpdHMgaW4gVE5vZGUuZmxhZ3MgdG8gdGhlIG5vZGUgdHlwZS5cbiAqL1xuZXhwb3J0IGNvbnN0IGVudW0gVE5vZGVUeXBlIHtcbiAgQ29udGFpbmVyID0gMGIwMDAsXG4gIFByb2plY3Rpb24gPSAwYjAwMSxcbiAgVmlldyA9IDBiMDEwLFxuICBFbGVtZW50ID0gMGIwMTEsXG4gIFZpZXdPckVsZW1lbnQgPSAwYjAxMCxcbiAgRWxlbWVudENvbnRhaW5lciA9IDBiMTAwLFxuICBJY3VDb250YWluZXIgPSAwYjEwMSxcbn1cblxuLyoqXG4gKiBDb3JyZXNwb25kcyB0byB0aGUgVE5vZGUuZmxhZ3MgcHJvcGVydHkuXG4gKi9cbmV4cG9ydCBjb25zdCBlbnVtIFROb2RlRmxhZ3Mge1xuICAvKiogVGhpcyBiaXQgaXMgc2V0IGlmIHRoZSBub2RlIGlzIGEgY29tcG9uZW50ICovXG4gIGlzQ29tcG9uZW50ID0gMGIwMDAxLFxuXG4gIC8qKiBUaGlzIGJpdCBpcyBzZXQgaWYgdGhlIG5vZGUgaGFzIGJlZW4gcHJvamVjdGVkICovXG4gIGlzUHJvamVjdGVkID0gMGIwMDEwLFxuXG4gIC8qKiBUaGlzIGJpdCBpcyBzZXQgaWYgdGhlIG5vZGUgaGFzIGFueSBjb250ZW50IHF1ZXJpZXMgKi9cbiAgaGFzQ29udGVudFF1ZXJ5ID0gMGIwMTAwLFxuXG4gIC8qKiBUaGlzIGJpdCBpcyBzZXQgaWYgdGhlIG5vZGUgaGFzIGFueSBkaXJlY3RpdmVzIHRoYXQgY29udGFpbiBbY2xhc3MgcHJvcGVydGllcyAqL1xuICBoYXNDbGFzc0lucHV0ID0gMGIxMDAwLFxufVxuXG4vKipcbiAqIENvcnJlc3BvbmRzIHRvIHRoZSBUTm9kZS5wcm92aWRlckluZGV4ZXMgcHJvcGVydHkuXG4gKi9cbmV4cG9ydCBjb25zdCBlbnVtIFROb2RlUHJvdmlkZXJJbmRleGVzIHtcbiAgLyoqIFRoZSBpbmRleCBvZiB0aGUgZmlyc3QgcHJvdmlkZXIgb24gdGhpcyBub2RlIGlzIGVuY29kZWQgb24gdGhlIGxlYXN0IHNpZ25pZmljYW50IGJpdHMgKi9cbiAgUHJvdmlkZXJzU3RhcnRJbmRleE1hc2sgPSAwYjAwMDAwMDAwMDAwMDAwMDAxMTExMTExMTExMTExMTExLFxuXG4gIC8qKiBUaGUgY291bnQgb2YgdmlldyBwcm92aWRlcnMgZnJvbSB0aGUgY29tcG9uZW50IG9uIHRoaXMgbm9kZSBpcyBlbmNvZGVkIG9uIHRoZSAxNiBtb3N0XG4gICAgIHNpZ25pZmljYW50IGJpdHMgKi9cbiAgQ3B0Vmlld1Byb3ZpZGVyc0NvdW50U2hpZnQgPSAxNixcbiAgQ3B0Vmlld1Byb3ZpZGVyc0NvdW50U2hpZnRlciA9IDBiMDAwMDAwMDAwMDAwMDAwMTAwMDAwMDAwMDAwMDAwMDAsXG59XG4vKipcbiAqIEEgc2V0IG9mIG1hcmtlciB2YWx1ZXMgdG8gYmUgdXNlZCBpbiB0aGUgYXR0cmlidXRlcyBhcnJheXMuIFRob3NlIG1hcmtlcnMgaW5kaWNhdGUgdGhhdCBzb21lXG4gKiBpdGVtcyBhcmUgbm90IHJlZ3VsYXIgYXR0cmlidXRlcyBhbmQgdGhlIHByb2Nlc3Npbmcgc2hvdWxkIGJlIGFkYXB0ZWQgYWNjb3JkaW5nbHkuXG4gKi9cbmV4cG9ydCBjb25zdCBlbnVtIEF0dHJpYnV0ZU1hcmtlciB7XG4gIC8qKlxuICAgKiBNYXJrZXIgaW5kaWNhdGVzIHRoYXQgdGhlIGZvbGxvd2luZyAzIHZhbHVlcyBpbiB0aGUgYXR0cmlidXRlcyBhcnJheSBhcmU6XG4gICAqIG5hbWVzcGFjZVVyaSwgYXR0cmlidXRlTmFtZSwgYXR0cmlidXRlVmFsdWVcbiAgICogaW4gdGhhdCBvcmRlci5cbiAgICovXG4gIE5hbWVzcGFjZVVSSSA9IDAsXG5cbiAgLyoqXG4gICAqIFRoaXMgbWFya2VyIGluZGljYXRlcyB0aGF0IHRoZSBmb2xsb3dpbmcgYXR0cmlidXRlIG5hbWVzIHdlcmUgZXh0cmFjdGVkIGZyb20gYmluZGluZ3MgKGV4LjpcbiAgICogW2Zvb109XCJleHBcIikgYW5kIC8gb3IgZXZlbnQgaGFuZGxlcnMgKGV4LiAoYmFyKT1cImRvU3RoKClcIikuXG4gICAqIFRha2luZyB0aGUgYWJvdmUgYmluZGluZ3MgYW5kIG91dHB1dHMgYXMgYW4gZXhhbXBsZSBhbiBhdHRyaWJ1dGVzIGFycmF5IGNvdWxkIGxvb2sgYXMgZm9sbG93czpcbiAgICogWydjbGFzcycsICdmYWRlIGluJywgQXR0cmlidXRlTWFya2VyLlNlbGVjdE9ubHksICdmb28nLCAnYmFyJ11cbiAgICovXG4gIFNlbGVjdE9ubHkgPSAxXG59XG5cbi8qKlxuICogQSBjb21iaW5hdGlvbiBvZjpcbiAqIC0gYXR0cmlidXRlIG5hbWVzIGFuZCB2YWx1ZXNcbiAqIC0gc3BlY2lhbCBtYXJrZXJzIGFjdGluZyBhcyBmbGFncyB0byBhbHRlciBhdHRyaWJ1dGVzIHByb2Nlc3NpbmcuXG4gKi9cbmV4cG9ydCB0eXBlIFRBdHRyaWJ1dGVzID0gKHN0cmluZyB8IEF0dHJpYnV0ZU1hcmtlcilbXTtcblxuLyoqXG4gKiBCaW5kaW5nIGRhdGEgKGZseXdlaWdodCkgZm9yIGEgcGFydGljdWxhciBub2RlIHRoYXQgaXMgc2hhcmVkIGJldHdlZW4gYWxsIHRlbXBsYXRlc1xuICogb2YgYSBzcGVjaWZpYyB0eXBlLlxuICpcbiAqIElmIGEgcHJvcGVydHkgaXM6XG4gKiAgICAtIFByb3BlcnR5QWxpYXNlczogdGhhdCBwcm9wZXJ0eSdzIGRhdGEgd2FzIGdlbmVyYXRlZCBhbmQgdGhpcyBpcyBpdFxuICogICAgLSBOdWxsOiB0aGF0IHByb3BlcnR5J3MgZGF0YSB3YXMgYWxyZWFkeSBnZW5lcmF0ZWQgYW5kIG5vdGhpbmcgd2FzIGZvdW5kLlxuICogICAgLSBVbmRlZmluZWQ6IHRoYXQgcHJvcGVydHkncyBkYXRhIGhhcyBub3QgeWV0IGJlZW4gZ2VuZXJhdGVkXG4gKlxuICogc2VlOiBodHRwczovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9GbHl3ZWlnaHRfcGF0dGVybiBmb3IgbW9yZSBvbiB0aGUgRmx5d2VpZ2h0IHBhdHRlcm5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBUTm9kZSB7XG4gIC8qKiBUaGUgdHlwZSBvZiB0aGUgVE5vZGUuIFNlZSBUTm9kZVR5cGUuICovXG4gIHR5cGU6IFROb2RlVHlwZTtcblxuICAvKipcbiAgICogSW5kZXggb2YgdGhlIFROb2RlIGluIFRWaWV3LmRhdGEgYW5kIGNvcnJlc3BvbmRpbmcgbmF0aXZlIGVsZW1lbnQgaW4gTFZpZXcuXG4gICAqXG4gICAqIFRoaXMgaXMgbmVjZXNzYXJ5IHRvIGdldCBmcm9tIGFueSBUTm9kZSB0byBpdHMgY29ycmVzcG9uZGluZyBuYXRpdmUgZWxlbWVudCB3aGVuXG4gICAqIHRyYXZlcnNpbmcgdGhlIG5vZGUgdHJlZS5cbiAgICpcbiAgICogSWYgaW5kZXggaXMgLTEsIHRoaXMgaXMgYSBkeW5hbWljYWxseSBjcmVhdGVkIGNvbnRhaW5lciBub2RlIG9yIGVtYmVkZGVkIHZpZXcgbm9kZS5cbiAgICovXG4gIGluZGV4OiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIFRoZSBpbmRleCBvZiB0aGUgY2xvc2VzdCBpbmplY3RvciBpbiB0aGlzIG5vZGUncyBMVmlldy5cbiAgICpcbiAgICogSWYgdGhlIGluZGV4ID09PSAtMSwgdGhlcmUgaXMgbm8gaW5qZWN0b3Igb24gdGhpcyBub2RlIG9yIGFueSBhbmNlc3RvciBub2RlIGluIHRoaXMgdmlldy5cbiAgICpcbiAgICogSWYgdGhlIGluZGV4ICE9PSAtMSwgaXQgaXMgdGhlIGluZGV4IG9mIHRoaXMgbm9kZSdzIGluamVjdG9yIE9SIHRoZSBpbmRleCBvZiBhIHBhcmVudCBpbmplY3RvclxuICAgKiBpbiB0aGUgc2FtZSB2aWV3LiBXZSBwYXNzIHRoZSBwYXJlbnQgaW5qZWN0b3IgaW5kZXggZG93biB0aGUgbm9kZSB0cmVlIG9mIGEgdmlldyBzbyBpdCdzXG4gICAqIHBvc3NpYmxlIHRvIGZpbmQgdGhlIHBhcmVudCBpbmplY3RvciB3aXRob3V0IHdhbGtpbmcgYSBwb3RlbnRpYWxseSBkZWVwIG5vZGUgdHJlZS4gSW5qZWN0b3JcbiAgICogaW5kaWNlcyBhcmUgbm90IHNldCBhY3Jvc3MgdmlldyBib3VuZGFyaWVzIGJlY2F1c2UgdGhlcmUgY291bGQgYmUgbXVsdGlwbGUgY29tcG9uZW50IGhvc3RzLlxuICAgKlxuICAgKiBJZiB0Tm9kZS5pbmplY3RvckluZGV4ID09PSB0Tm9kZS5wYXJlbnQuaW5qZWN0b3JJbmRleCwgdGhlbiB0aGUgaW5kZXggYmVsb25ncyB0byBhIHBhcmVudFxuICAgKiBpbmplY3Rvci5cbiAgICovXG4gIGluamVjdG9ySW5kZXg6IG51bWJlcjtcblxuICAvKipcbiAgICogU3RvcmVzIHN0YXJ0aW5nIGluZGV4IG9mIHRoZSBkaXJlY3RpdmVzLlxuICAgKi9cbiAgZGlyZWN0aXZlU3RhcnQ6IG51bWJlcjtcblxuICAvKipcbiAgICogU3RvcmVzIGZpbmFsIGV4Y2x1c2l2ZSBpbmRleCBvZiB0aGUgZGlyZWN0aXZlcy5cbiAgICovXG4gIGRpcmVjdGl2ZUVuZDogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBTdG9yZXMgaWYgTm9kZSBpc0NvbXBvbmVudCwgaXNQcm9qZWN0ZWQsIGhhc0NvbnRlbnRRdWVyeSBhbmQgaGFzQ2xhc3NJbnB1dFxuICAgKi9cbiAgZmxhZ3M6IFROb2RlRmxhZ3M7XG5cbiAgLyoqXG4gICAqIFRoaXMgbnVtYmVyIHN0b3JlcyB0d28gdmFsdWVzIHVzaW5nIGl0cyBiaXRzOlxuICAgKlxuICAgKiAtIHRoZSBpbmRleCBvZiB0aGUgZmlyc3QgcHJvdmlkZXIgb24gdGhhdCBub2RlIChmaXJzdCAxNiBiaXRzKVxuICAgKiAtIHRoZSBjb3VudCBvZiB2aWV3IHByb3ZpZGVycyBmcm9tIHRoZSBjb21wb25lbnQgb24gdGhpcyBub2RlIChsYXN0IDE2IGJpdHMpXG4gICAqL1xuICAvLyBUT0RPKG1pc2tvKTogYnJlYWsgdGhpcyBpbnRvIGFjdHVhbCB2YXJzLlxuICBwcm92aWRlckluZGV4ZXM6IFROb2RlUHJvdmlkZXJJbmRleGVzO1xuXG4gIC8qKiBUaGUgdGFnIG5hbWUgYXNzb2NpYXRlZCB3aXRoIHRoaXMgbm9kZS4gKi9cbiAgdGFnTmFtZTogc3RyaW5nfG51bGw7XG5cbiAgLyoqXG4gICAqIEF0dHJpYnV0ZXMgYXNzb2NpYXRlZCB3aXRoIGFuIGVsZW1lbnQuIFdlIG5lZWQgdG8gc3RvcmUgYXR0cmlidXRlcyB0byBzdXBwb3J0IHZhcmlvdXMgdXNlLWNhc2VzXG4gICAqIChhdHRyaWJ1dGUgaW5qZWN0aW9uLCBjb250ZW50IHByb2plY3Rpb24gd2l0aCBzZWxlY3RvcnMsIGRpcmVjdGl2ZXMgbWF0Y2hpbmcpLlxuICAgKiBBdHRyaWJ1dGVzIGFyZSBzdG9yZWQgc3RhdGljYWxseSBiZWNhdXNlIHJlYWRpbmcgdGhlbSBmcm9tIHRoZSBET00gd291bGQgYmUgd2F5IHRvbyBzbG93IGZvclxuICAgKiBjb250ZW50IHByb2plY3Rpb24gYW5kIHF1ZXJpZXMuXG4gICAqXG4gICAqIFNpbmNlIGF0dHJzIHdpbGwgYWx3YXlzIGJlIGNhbGN1bGF0ZWQgZmlyc3QsIHRoZXkgd2lsbCBuZXZlciBuZWVkIHRvIGJlIG1hcmtlZCB1bmRlZmluZWQgYnlcbiAgICogb3RoZXIgaW5zdHJ1Y3Rpb25zLlxuICAgKlxuICAgKiBGb3IgcmVndWxhciBhdHRyaWJ1dGVzIGEgbmFtZSBvZiBhbiBhdHRyaWJ1dGUgYW5kIGl0cyB2YWx1ZSBhbHRlcm5hdGUgaW4gdGhlIGFycmF5LlxuICAgKiBlLmcuIFsncm9sZScsICdjaGVja2JveCddXG4gICAqIFRoaXMgYXJyYXkgY2FuIGNvbnRhaW4gZmxhZ3MgdGhhdCB3aWxsIGluZGljYXRlIFwic3BlY2lhbCBhdHRyaWJ1dGVzXCIgKGF0dHJpYnV0ZXMgd2l0aFxuICAgKiBuYW1lc3BhY2VzLCBhdHRyaWJ1dGVzIGV4dHJhY3RlZCBmcm9tIGJpbmRpbmdzIGFuZCBvdXRwdXRzKS5cbiAgICovXG4gIGF0dHJzOiBUQXR0cmlidXRlc3xudWxsO1xuXG4gIC8qKlxuICAgKiBBIHNldCBvZiBsb2NhbCBuYW1lcyB1bmRlciB3aGljaCBhIGdpdmVuIGVsZW1lbnQgaXMgZXhwb3J0ZWQgaW4gYSB0ZW1wbGF0ZSBhbmRcbiAgICogdmlzaWJsZSB0byBxdWVyaWVzLiBBbiBlbnRyeSBpbiB0aGlzIGFycmF5IGNhbiBiZSBjcmVhdGVkIGZvciBkaWZmZXJlbnQgcmVhc29uczpcbiAgICogLSBhbiBlbGVtZW50IGl0c2VsZiBpcyByZWZlcmVuY2VkLCBleC46IGA8ZGl2ICNmb28+YFxuICAgKiAtIGEgY29tcG9uZW50IGlzIHJlZmVyZW5jZWQsIGV4LjogYDxteS1jbXB0ICNmb28+YFxuICAgKiAtIGEgZGlyZWN0aXZlIGlzIHJlZmVyZW5jZWQsIGV4LjogYDxteS1jbXB0ICNmb289XCJkaXJlY3RpdmVFeHBvcnRBc1wiPmAuXG4gICAqXG4gICAqIEEgZ2l2ZW4gZWxlbWVudCBtaWdodCBoYXZlIGRpZmZlcmVudCBsb2NhbCBuYW1lcyBhbmQgdGhvc2UgbmFtZXMgY2FuIGJlIGFzc29jaWF0ZWRcbiAgICogd2l0aCBhIGRpcmVjdGl2ZS4gV2Ugc3RvcmUgbG9jYWwgbmFtZXMgYXQgZXZlbiBpbmRleGVzIHdoaWxlIG9kZCBpbmRleGVzIGFyZSByZXNlcnZlZFxuICAgKiBmb3IgZGlyZWN0aXZlIGluZGV4IGluIGEgdmlldyAob3IgYC0xYCBpZiB0aGVyZSBpcyBubyBhc3NvY2lhdGVkIGRpcmVjdGl2ZSkuXG4gICAqXG4gICAqIFNvbWUgZXhhbXBsZXM6XG4gICAqIC0gYDxkaXYgI2Zvbz5gID0+IGBbXCJmb29cIiwgLTFdYFxuICAgKiAtIGA8bXktY21wdCAjZm9vPmAgPT4gYFtcImZvb1wiLCBteUNtcHRJZHhdYFxuICAgKiAtIGA8bXktY21wdCAjZm9vICNiYXI9XCJkaXJlY3RpdmVFeHBvcnRBc1wiPmAgPT4gYFtcImZvb1wiLCBteUNtcHRJZHgsIFwiYmFyXCIsIGRpcmVjdGl2ZUlkeF1gXG4gICAqIC0gYDxkaXYgI2ZvbyAjYmFyPVwiZGlyZWN0aXZlRXhwb3J0QXNcIj5gID0+IGBbXCJmb29cIiwgLTEsIFwiYmFyXCIsIGRpcmVjdGl2ZUlkeF1gXG4gICAqL1xuICBsb2NhbE5hbWVzOiAoc3RyaW5nfG51bWJlcilbXXxudWxsO1xuXG4gIC8qKiBJbmZvcm1hdGlvbiBhYm91dCBpbnB1dCBwcm9wZXJ0aWVzIHRoYXQgbmVlZCB0byBiZSBzZXQgb25jZSBmcm9tIGF0dHJpYnV0ZSBkYXRhLiAqL1xuICBpbml0aWFsSW5wdXRzOiBJbml0aWFsSW5wdXREYXRhfG51bGx8dW5kZWZpbmVkO1xuXG4gIC8qKlxuICAgKiBJbnB1dCBkYXRhIGZvciBhbGwgZGlyZWN0aXZlcyBvbiB0aGlzIG5vZGUuXG4gICAqXG4gICAqIC0gYHVuZGVmaW5lZGAgbWVhbnMgdGhhdCB0aGUgcHJvcCBoYXMgbm90IGJlZW4gaW5pdGlhbGl6ZWQgeWV0LFxuICAgKiAtIGBudWxsYCBtZWFucyB0aGF0IHRoZSBwcm9wIGhhcyBiZWVuIGluaXRpYWxpemVkIGJ1dCBubyBpbnB1dHMgaGF2ZSBiZWVuIGZvdW5kLlxuICAgKi9cbiAgaW5wdXRzOiBQcm9wZXJ0eUFsaWFzZXN8bnVsbHx1bmRlZmluZWQ7XG5cbiAgLyoqXG4gICAqIE91dHB1dCBkYXRhIGZvciBhbGwgZGlyZWN0aXZlcyBvbiB0aGlzIG5vZGUuXG4gICAqXG4gICAqIC0gYHVuZGVmaW5lZGAgbWVhbnMgdGhhdCB0aGUgcHJvcCBoYXMgbm90IGJlZW4gaW5pdGlhbGl6ZWQgeWV0LFxuICAgKiAtIGBudWxsYCBtZWFucyB0aGF0IHRoZSBwcm9wIGhhcyBiZWVuIGluaXRpYWxpemVkIGJ1dCBubyBvdXRwdXRzIGhhdmUgYmVlbiBmb3VuZC5cbiAgICovXG4gIG91dHB1dHM6IFByb3BlcnR5QWxpYXNlc3xudWxsfHVuZGVmaW5lZDtcblxuICAvKipcbiAgICogVGhlIFRWaWV3IG9yIFRWaWV3cyBhdHRhY2hlZCB0byB0aGlzIG5vZGUuXG4gICAqXG4gICAqIElmIHRoaXMgVE5vZGUgY29ycmVzcG9uZHMgdG8gYW4gTENvbnRhaW5lciB3aXRoIGlubGluZSB2aWV3cywgdGhlIGNvbnRhaW5lciB3aWxsXG4gICAqIG5lZWQgdG8gc3RvcmUgc2VwYXJhdGUgc3RhdGljIGRhdGEgZm9yIGVhY2ggb2YgaXRzIHZpZXcgYmxvY2tzIChUVmlld1tdKS4gT3RoZXJ3aXNlLFxuICAgKiBub2RlcyBpbiBpbmxpbmUgdmlld3Mgd2l0aCB0aGUgc2FtZSBpbmRleCBhcyBub2RlcyBpbiB0aGVpciBwYXJlbnQgdmlld3Mgd2lsbCBvdmVyd3JpdGVcbiAgICogZWFjaCBvdGhlciwgYXMgdGhleSBhcmUgaW4gdGhlIHNhbWUgdGVtcGxhdGUuXG4gICAqXG4gICAqIEVhY2ggaW5kZXggaW4gdGhpcyBhcnJheSBjb3JyZXNwb25kcyB0byB0aGUgc3RhdGljIGRhdGEgZm9yIGEgY2VydGFpblxuICAgKiB2aWV3LiBTbyBpZiB5b3UgaGFkIFYoMCkgYW5kIFYoMSkgaW4gYSBjb250YWluZXIsIHlvdSBtaWdodCBoYXZlOlxuICAgKlxuICAgKiBbXG4gICAqICAgW3t0YWdOYW1lOiAnZGl2JywgYXR0cnM6IC4uLn0sIG51bGxdLCAgICAgLy8gVigwKSBUVmlld1xuICAgKiAgIFt7dGFnTmFtZTogJ2J1dHRvbicsIGF0dHJzIC4uLn0sIG51bGxdICAgIC8vIFYoMSkgVFZpZXdcbiAgICpcbiAgICogSWYgdGhpcyBUTm9kZSBjb3JyZXNwb25kcyB0byBhbiBMQ29udGFpbmVyIHdpdGggYSB0ZW1wbGF0ZSAoZS5nLiBzdHJ1Y3R1cmFsXG4gICAqIGRpcmVjdGl2ZSksIHRoZSB0ZW1wbGF0ZSdzIFRWaWV3IHdpbGwgYmUgc3RvcmVkIGhlcmUuXG4gICAqXG4gICAqIElmIHRoaXMgVE5vZGUgY29ycmVzcG9uZHMgdG8gYW4gZWxlbWVudCwgdFZpZXdzIHdpbGwgYmUgbnVsbCAuXG4gICAqL1xuICB0Vmlld3M6IFRWaWV3fFRWaWV3W118bnVsbDtcblxuICAvKipcbiAgICogVGhlIG5leHQgc2libGluZyBub2RlLiBOZWNlc3Nhcnkgc28gd2UgY2FuIHByb3BhZ2F0ZSB0aHJvdWdoIHRoZSByb290IG5vZGVzIG9mIGEgdmlld1xuICAgKiB0byBpbnNlcnQgdGhlbSBvciByZW1vdmUgdGhlbSBmcm9tIHRoZSBET00uXG4gICAqL1xuICBuZXh0OiBUTm9kZXxudWxsO1xuXG4gIC8qKlxuICAgKiBGaXJzdCBjaGlsZCBvZiB0aGUgY3VycmVudCBub2RlLlxuICAgKlxuICAgKiBGb3IgY29tcG9uZW50IG5vZGVzLCB0aGUgY2hpbGQgd2lsbCBhbHdheXMgYmUgYSBDb250ZW50Q2hpbGQgKGluIHNhbWUgdmlldykuXG4gICAqIEZvciBlbWJlZGRlZCB2aWV3IG5vZGVzLCB0aGUgY2hpbGQgd2lsbCBiZSBpbiB0aGVpciBjaGlsZCB2aWV3LlxuICAgKi9cbiAgY2hpbGQ6IFROb2RlfG51bGw7XG5cbiAgLyoqXG4gICAqIFBhcmVudCBub2RlIChpbiB0aGUgc2FtZSB2aWV3IG9ubHkpLlxuICAgKlxuICAgKiBXZSBuZWVkIGEgcmVmZXJlbmNlIHRvIGEgbm9kZSdzIHBhcmVudCBzbyB3ZSBjYW4gYXBwZW5kIHRoZSBub2RlIHRvIGl0cyBwYXJlbnQncyBuYXRpdmVcbiAgICogZWxlbWVudCBhdCB0aGUgYXBwcm9wcmlhdGUgdGltZS5cbiAgICpcbiAgICogSWYgdGhlIHBhcmVudCB3b3VsZCBiZSBpbiBhIGRpZmZlcmVudCB2aWV3IChlLmcuIGNvbXBvbmVudCBob3N0KSwgdGhpcyBwcm9wZXJ0eSB3aWxsIGJlIG51bGwuXG4gICAqIEl0J3MgaW1wb3J0YW50IHRoYXQgd2UgZG9uJ3QgdHJ5IHRvIGNyb3NzIGNvbXBvbmVudCBib3VuZGFyaWVzIHdoZW4gcmV0cmlldmluZyB0aGUgcGFyZW50XG4gICAqIGJlY2F1c2UgdGhlIHBhcmVudCB3aWxsIGNoYW5nZSAoZS5nLiBpbmRleCwgYXR0cnMpIGRlcGVuZGluZyBvbiB3aGVyZSB0aGUgY29tcG9uZW50IHdhc1xuICAgKiB1c2VkIChhbmQgdGh1cyBzaG91bGRuJ3QgYmUgc3RvcmVkIG9uIFROb2RlKS4gSW4gdGhlc2UgY2FzZXMsIHdlIHJldHJpZXZlIHRoZSBwYXJlbnQgdGhyb3VnaFxuICAgKiBMVmlldy5ub2RlIGluc3RlYWQgKHdoaWNoIHdpbGwgYmUgaW5zdGFuY2Utc3BlY2lmaWMpLlxuICAgKlxuICAgKiBJZiB0aGlzIGlzIGFuIGlubGluZSB2aWV3IG5vZGUgKFYpLCB0aGUgcGFyZW50IHdpbGwgYmUgaXRzIGNvbnRhaW5lci5cbiAgICovXG4gIHBhcmVudDogVEVsZW1lbnROb2RlfFRDb250YWluZXJOb2RlfG51bGw7XG5cbiAgLyoqXG4gICAqIElmIHRoaXMgbm9kZSBpcyBwYXJ0IG9mIGFuIGkxOG4gYmxvY2ssIGl0IGluZGljYXRlcyB3aGV0aGVyIHRoaXMgbm9kZSBpcyBwYXJ0IG9mIHRoZSBET00uXG4gICAqIElmIHRoaXMgbm9kZSBpcyBub3QgcGFydCBvZiBhbiBpMThuIGJsb2NrLCB0aGlzIGZpZWxkIGlzIG51bGwuXG4gICAqL1xuICBkZXRhY2hlZDogYm9vbGVhbnxudWxsO1xuXG4gIHN0eWxpbmdUZW1wbGF0ZTogU3R5bGluZ0NvbnRleHR8bnVsbDtcbiAgLyoqXG4gICAqIExpc3Qgb2YgcHJvamVjdGVkIFROb2RlcyBmb3IgYSBnaXZlbiBjb21wb25lbnQgaG9zdCBlbGVtZW50IE9SIGluZGV4IGludG8gdGhlIHNhaWQgbm9kZXMuXG4gICAqXG4gICAqIEZvciBlYXNpZXIgZGlzY3Vzc2lvbiBhc3N1bWUgdGhpcyBleGFtcGxlOlxuICAgKiBgPHBhcmVudD5gJ3MgdmlldyBkZWZpbml0aW9uOlxuICAgKiBgYGBcbiAgICogPGNoaWxkIGlkPVwiYzFcIj5jb250ZW50MTwvY2hpbGQ+XG4gICAqIDxjaGlsZCBpZD1cImMyXCI+PHNwYW4+Y29udGVudDI8L3NwYW4+PC9jaGlsZD5cbiAgICogYGBgXG4gICAqIGA8Y2hpbGQ+YCdzIHZpZXcgZGVmaW5pdGlvbjpcbiAgICogYGBgXG4gICAqIDxuZy1jb250ZW50IGlkPVwiY29udDFcIj48L25nLWNvbnRlbnQ+XG4gICAqIGBgYFxuICAgKlxuICAgKiBJZiBgQXJyYXkuaXNBcnJheShwcm9qZWN0aW9uKWAgdGhlbiBgVE5vZGVgIGlzIGEgaG9zdCBlbGVtZW50OlxuICAgKiAtIGBwcm9qZWN0aW9uYCBzdG9yZXMgdGhlIGNvbnRlbnQgbm9kZXMgd2hpY2ggYXJlIHRvIGJlIHByb2plY3RlZC5cbiAgICogICAgLSBUaGUgbm9kZXMgcmVwcmVzZW50IGNhdGVnb3JpZXMgZGVmaW5lZCBieSB0aGUgc2VsZWN0b3I6IEZvciBleGFtcGxlOlxuICAgKiAgICAgIGA8bmctY29udGVudC8+PG5nLWNvbnRlbnQgc2VsZWN0PVwiYWJjXCIvPmAgd291bGQgcmVwcmVzZW50IHRoZSBoZWFkcyBmb3IgYDxuZy1jb250ZW50Lz5gXG4gICAqICAgICAgYW5kIGA8bmctY29udGVudCBzZWxlY3Q9XCJhYmNcIi8+YCByZXNwZWN0aXZlbHkuXG4gICAqICAgIC0gVGhlIG5vZGVzIHdlIHN0b3JlIGluIGBwcm9qZWN0aW9uYCBhcmUgaGVhZHMgb25seSwgd2UgdXNlZCBgLm5leHRgIHRvIGdldCB0aGVpclxuICAgKiAgICAgIHNpYmxpbmdzLlxuICAgKiAgICAtIFRoZSBub2RlcyBgLm5leHRgIGlzIHNvcnRlZC9yZXdyaXR0ZW4gYXMgcGFydCBvZiB0aGUgcHJvamVjdGlvbiBzZXR1cC5cbiAgICogICAgLSBgcHJvamVjdGlvbmAgc2l6ZSBpcyBlcXVhbCB0byB0aGUgbnVtYmVyIG9mIHByb2plY3Rpb25zIGA8bmctY29udGVudD5gLiBUaGUgc2l6ZSBvZlxuICAgKiAgICAgIGBjMWAgd2lsbCBiZSBgMWAgYmVjYXVzZSBgPGNoaWxkPmAgaGFzIG9ubHkgb25lIGA8bmctY29udGVudD5gLlxuICAgKiAtIHdlIHN0b3JlIGBwcm9qZWN0aW9uYCB3aXRoIHRoZSBob3N0IChgYzFgLCBgYzJgKSByYXRoZXIgdGhhbiB0aGUgYDxuZy1jb250ZW50PmAgKGBjb250MWApXG4gICAqICAgYmVjYXVzZSB0aGUgc2FtZSBjb21wb25lbnQgKGA8Y2hpbGQ+YCkgY2FuIGJlIHVzZWQgaW4gbXVsdGlwbGUgbG9jYXRpb25zIChgYzFgLCBgYzJgKSBhbmQgYXNcbiAgICogICBhIHJlc3VsdCBoYXZlIGRpZmZlcmVudCBzZXQgb2Ygbm9kZXMgdG8gcHJvamVjdC5cbiAgICogLSB3aXRob3V0IGBwcm9qZWN0aW9uYCBpdCB3b3VsZCBiZSBkaWZmaWN1bHQgdG8gZWZmaWNpZW50bHkgdHJhdmVyc2Ugbm9kZXMgdG8gYmUgcHJvamVjdGVkLlxuICAgKlxuICAgKiBJZiBgdHlwZW9mIHByb2plY3Rpb24gPT0gJ251bWJlcidgIHRoZW4gYFROb2RlYCBpcyBhIGA8bmctY29udGVudD5gIGVsZW1lbnQ6XG4gICAqIC0gYHByb2plY3Rpb25gIGlzIGFuIGluZGV4IG9mIHRoZSBob3N0J3MgYHByb2plY3Rpb25gTm9kZXMuXG4gICAqICAgLSBUaGlzIHdvdWxkIHJldHVybiB0aGUgZmlyc3QgaGVhZCBub2RlIHRvIHByb2plY3Q6XG4gICAqICAgICBgZ2V0SG9zdChjdXJyZW50VE5vZGUpLnByb2plY3Rpb25bY3VycmVudFROb2RlLnByb2plY3Rpb25dYC5cbiAgICogLSBXaGVuIHByb2plY3Rpbmcgbm9kZXMgdGhlIHBhcmVudCBub2RlIHJldHJpZXZlZCBtYXkgYmUgYSBgPG5nLWNvbnRlbnQ+YCBub2RlLCBpbiB3aGljaCBjYXNlXG4gICAqICAgdGhlIHByb2Nlc3MgaXMgcmVjdXJzaXZlIGluIG5hdHVyZSAobm90IGltcGxlbWVudGF0aW9uKS5cbiAgICovXG4gIHByb2plY3Rpb246IChUTm9kZXxudWxsKVtdfG51bWJlcnxudWxsO1xufVxuXG4vKiogU3RhdGljIGRhdGEgZm9yIGFuIGVsZW1lbnQgICovXG5leHBvcnQgaW50ZXJmYWNlIFRFbGVtZW50Tm9kZSBleHRlbmRzIFROb2RlIHtcbiAgLyoqIEluZGV4IGluIHRoZSBkYXRhW10gYXJyYXkgKi9cbiAgaW5kZXg6IG51bWJlcjtcbiAgY2hpbGQ6IFRFbGVtZW50Tm9kZXxUVGV4dE5vZGV8VEVsZW1lbnRDb250YWluZXJOb2RlfFRDb250YWluZXJOb2RlfFRQcm9qZWN0aW9uTm9kZXxudWxsO1xuICAvKipcbiAgICogRWxlbWVudCBub2RlcyB3aWxsIGhhdmUgcGFyZW50cyB1bmxlc3MgdGhleSBhcmUgdGhlIGZpcnN0IG5vZGUgb2YgYSBjb21wb25lbnQgb3JcbiAgICogZW1iZWRkZWQgdmlldyAod2hpY2ggbWVhbnMgdGhlaXIgcGFyZW50IGlzIGluIGEgZGlmZmVyZW50IHZpZXcgYW5kIG11c3QgYmVcbiAgICogcmV0cmlldmVkIHVzaW5nIHZpZXdEYXRhW0hPU1RfTk9ERV0pLlxuICAgKi9cbiAgcGFyZW50OiBURWxlbWVudE5vZGV8VEVsZW1lbnRDb250YWluZXJOb2RlfG51bGw7XG4gIHRWaWV3czogbnVsbDtcblxuICAvKipcbiAgICogSWYgdGhpcyBpcyBhIGNvbXBvbmVudCBUTm9kZSB3aXRoIHByb2plY3Rpb24sIHRoaXMgd2lsbCBiZSBhbiBhcnJheSBvZiBwcm9qZWN0ZWRcbiAgICogVE5vZGVzIChzZWUgVE5vZGUucHJvamVjdGlvbiBmb3IgbW9yZSBpbmZvKS4gSWYgaXQncyBhIHJlZ3VsYXIgZWxlbWVudCBub2RlIG9yIGFcbiAgICogY29tcG9uZW50IHdpdGhvdXQgcHJvamVjdGlvbiwgaXQgd2lsbCBiZSBudWxsLlxuICAgKi9cbiAgcHJvamVjdGlvbjogKFROb2RlfG51bGwpW118bnVsbDtcbn1cblxuLyoqIFN0YXRpYyBkYXRhIGZvciBhIHRleHQgbm9kZSAqL1xuZXhwb3J0IGludGVyZmFjZSBUVGV4dE5vZGUgZXh0ZW5kcyBUTm9kZSB7XG4gIC8qKiBJbmRleCBpbiB0aGUgZGF0YVtdIGFycmF5ICovXG4gIGluZGV4OiBudW1iZXI7XG4gIGNoaWxkOiBudWxsO1xuICAvKipcbiAgICogVGV4dCBub2RlcyB3aWxsIGhhdmUgcGFyZW50cyB1bmxlc3MgdGhleSBhcmUgdGhlIGZpcnN0IG5vZGUgb2YgYSBjb21wb25lbnQgb3JcbiAgICogZW1iZWRkZWQgdmlldyAod2hpY2ggbWVhbnMgdGhlaXIgcGFyZW50IGlzIGluIGEgZGlmZmVyZW50IHZpZXcgYW5kIG11c3QgYmVcbiAgICogcmV0cmlldmVkIHVzaW5nIExWaWV3Lm5vZGUpLlxuICAgKi9cbiAgcGFyZW50OiBURWxlbWVudE5vZGV8VEVsZW1lbnRDb250YWluZXJOb2RlfG51bGw7XG4gIHRWaWV3czogbnVsbDtcbiAgcHJvamVjdGlvbjogbnVsbDtcbn1cblxuLyoqIFN0YXRpYyBkYXRhIGZvciBhbiBMQ29udGFpbmVyICovXG5leHBvcnQgaW50ZXJmYWNlIFRDb250YWluZXJOb2RlIGV4dGVuZHMgVE5vZGUge1xuICAvKipcbiAgICogSW5kZXggaW4gdGhlIGRhdGFbXSBhcnJheS5cbiAgICpcbiAgICogSWYgaXQncyAtMSwgdGhpcyBpcyBhIGR5bmFtaWNhbGx5IGNyZWF0ZWQgY29udGFpbmVyIG5vZGUgdGhhdCBpc24ndCBzdG9yZWQgaW5cbiAgICogZGF0YVtdIChlLmcuIHdoZW4geW91IGluamVjdCBWaWV3Q29udGFpbmVyUmVmKSAuXG4gICAqL1xuICBpbmRleDogbnVtYmVyO1xuICBjaGlsZDogbnVsbDtcblxuICAvKipcbiAgICogQ29udGFpbmVyIG5vZGVzIHdpbGwgaGF2ZSBwYXJlbnRzIHVubGVzczpcbiAgICpcbiAgICogLSBUaGV5IGFyZSB0aGUgZmlyc3Qgbm9kZSBvZiBhIGNvbXBvbmVudCBvciBlbWJlZGRlZCB2aWV3XG4gICAqIC0gVGhleSBhcmUgZHluYW1pY2FsbHkgY3JlYXRlZFxuICAgKi9cbiAgcGFyZW50OiBURWxlbWVudE5vZGV8VEVsZW1lbnRDb250YWluZXJOb2RlfG51bGw7XG4gIHRWaWV3czogVFZpZXd8VFZpZXdbXXxudWxsO1xuICBwcm9qZWN0aW9uOiBudWxsO1xufVxuXG4vKiogU3RhdGljIGRhdGEgZm9yIGFuIDxuZy1jb250YWluZXI+ICovXG5leHBvcnQgaW50ZXJmYWNlIFRFbGVtZW50Q29udGFpbmVyTm9kZSBleHRlbmRzIFROb2RlIHtcbiAgLyoqIEluZGV4IGluIHRoZSBMVmlld1tdIGFycmF5LiAqL1xuICBpbmRleDogbnVtYmVyO1xuICBjaGlsZDogVEVsZW1lbnROb2RlfFRUZXh0Tm9kZXxUQ29udGFpbmVyTm9kZXxURWxlbWVudENvbnRhaW5lck5vZGV8VFByb2plY3Rpb25Ob2RlfG51bGw7XG4gIHBhcmVudDogVEVsZW1lbnROb2RlfFRFbGVtZW50Q29udGFpbmVyTm9kZXxudWxsO1xuICB0Vmlld3M6IG51bGw7XG4gIHByb2plY3Rpb246IG51bGw7XG59XG5cbi8qKiBTdGF0aWMgZGF0YSBmb3IgYW4gSUNVIGV4cHJlc3Npb24gKi9cbmV4cG9ydCBpbnRlcmZhY2UgVEljdUNvbnRhaW5lck5vZGUgZXh0ZW5kcyBUTm9kZSB7XG4gIC8qKiBJbmRleCBpbiB0aGUgTFZpZXdbXSBhcnJheS4gKi9cbiAgaW5kZXg6IG51bWJlcjtcbiAgY2hpbGQ6IFRFbGVtZW50Tm9kZXxUVGV4dE5vZGV8bnVsbDtcbiAgcGFyZW50OiBURWxlbWVudE5vZGV8VEVsZW1lbnRDb250YWluZXJOb2RlfG51bGw7XG4gIHRWaWV3czogbnVsbDtcbiAgcHJvamVjdGlvbjogbnVsbDtcbiAgLyoqXG4gICAqIEluZGljYXRlcyB0aGUgY3VycmVudCBhY3RpdmUgY2FzZSBmb3IgYW4gSUNVIGV4cHJlc3Npb24uXG4gICAqIEl0IGlzIG51bGwgd2hlbiB0aGVyZSBpcyBubyBhY3RpdmUgY2FzZS5cbiAgICovXG4gIGFjdGl2ZUNhc2VJbmRleDogbnVtYmVyfG51bGw7XG59XG5cbi8qKiBTdGF0aWMgZGF0YSBmb3IgYSB2aWV3ICAqL1xuZXhwb3J0IGludGVyZmFjZSBUVmlld05vZGUgZXh0ZW5kcyBUTm9kZSB7XG4gIC8qKiBJZiAtMSwgaXQncyBhIGR5bmFtaWNhbGx5IGNyZWF0ZWQgdmlldy4gT3RoZXJ3aXNlLCBpdCBpcyB0aGUgdmlldyBibG9jayBJRC4gKi9cbiAgaW5kZXg6IG51bWJlcjtcbiAgY2hpbGQ6IFRFbGVtZW50Tm9kZXxUVGV4dE5vZGV8VEVsZW1lbnRDb250YWluZXJOb2RlfFRDb250YWluZXJOb2RlfFRQcm9qZWN0aW9uTm9kZXxudWxsO1xuICBwYXJlbnQ6IFRDb250YWluZXJOb2RlfG51bGw7XG4gIHRWaWV3czogbnVsbDtcbiAgcHJvamVjdGlvbjogbnVsbDtcbn1cblxuLyoqIFN0YXRpYyBkYXRhIGZvciBhbiBMUHJvamVjdGlvbk5vZGUgICovXG5leHBvcnQgaW50ZXJmYWNlIFRQcm9qZWN0aW9uTm9kZSBleHRlbmRzIFROb2RlIHtcbiAgLyoqIEluZGV4IGluIHRoZSBkYXRhW10gYXJyYXkgKi9cbiAgY2hpbGQ6IG51bGw7XG4gIC8qKlxuICAgKiBQcm9qZWN0aW9uIG5vZGVzIHdpbGwgaGF2ZSBwYXJlbnRzIHVubGVzcyB0aGV5IGFyZSB0aGUgZmlyc3Qgbm9kZSBvZiBhIGNvbXBvbmVudFxuICAgKiBvciBlbWJlZGRlZCB2aWV3ICh3aGljaCBtZWFucyB0aGVpciBwYXJlbnQgaXMgaW4gYSBkaWZmZXJlbnQgdmlldyBhbmQgbXVzdCBiZVxuICAgKiByZXRyaWV2ZWQgdXNpbmcgTFZpZXcubm9kZSkuXG4gICAqL1xuICBwYXJlbnQ6IFRFbGVtZW50Tm9kZXxURWxlbWVudENvbnRhaW5lck5vZGV8bnVsbDtcbiAgdFZpZXdzOiBudWxsO1xuXG4gIC8qKiBJbmRleCBvZiB0aGUgcHJvamVjdGlvbiBub2RlLiAoU2VlIFROb2RlLnByb2plY3Rpb24gZm9yIG1vcmUgaW5mby4pICovXG4gIHByb2plY3Rpb246IG51bWJlcjtcbn1cblxuLyoqXG4gKiBUaGlzIG1hcHBpbmcgaXMgbmVjZXNzYXJ5IHNvIHdlIGNhbiBzZXQgaW5wdXQgcHJvcGVydGllcyBhbmQgb3V0cHV0IGxpc3RlbmVyc1xuICogcHJvcGVybHkgYXQgcnVudGltZSB3aGVuIHByb3BlcnR5IG5hbWVzIGFyZSBtaW5pZmllZCBvciBhbGlhc2VkLlxuICpcbiAqIEtleTogdW5taW5pZmllZCAvIHB1YmxpYyBpbnB1dCBvciBvdXRwdXQgbmFtZVxuICogVmFsdWU6IGFycmF5IGNvbnRhaW5pbmcgbWluaWZpZWQgLyBpbnRlcm5hbCBuYW1lIGFuZCByZWxhdGVkIGRpcmVjdGl2ZSBpbmRleFxuICpcbiAqIFRoZSB2YWx1ZSBtdXN0IGJlIGFuIGFycmF5IHRvIHN1cHBvcnQgaW5wdXRzIGFuZCBvdXRwdXRzIHdpdGggdGhlIHNhbWUgbmFtZVxuICogb24gdGhlIHNhbWUgbm9kZS5cbiAqL1xuZXhwb3J0IHR5cGUgUHJvcGVydHlBbGlhc2VzID0ge1xuICAvLyBUaGlzIHVzZXMgYW4gb2JqZWN0IG1hcCBiZWNhdXNlIHVzaW5nIHRoZSBNYXAgdHlwZSB3b3VsZCBiZSB0b28gc2xvd1xuICBba2V5OiBzdHJpbmddOiBQcm9wZXJ0eUFsaWFzVmFsdWVcbn07XG5cbi8qKlxuICogU3RvcmUgdGhlIHJ1bnRpbWUgaW5wdXQgb3Igb3V0cHV0IG5hbWVzIGZvciBhbGwgdGhlIGRpcmVjdGl2ZXMuXG4gKlxuICogLSBFdmVuIGluZGljZXM6IGRpcmVjdGl2ZSBpbmRleFxuICogLSBPZGQgaW5kaWNlczogbWluaWZpZWQgLyBpbnRlcm5hbCBuYW1lXG4gKlxuICogZS5nLiBbMCwgJ2NoYW5nZS1taW5pZmllZCddXG4gKi9cbmV4cG9ydCB0eXBlIFByb3BlcnR5QWxpYXNWYWx1ZSA9IChudW1iZXIgfCBzdHJpbmcpW107XG5cblxuLyoqXG4gKiBUaGlzIGFycmF5IGNvbnRhaW5zIGluZm9ybWF0aW9uIGFib3V0IGlucHV0IHByb3BlcnRpZXMgdGhhdFxuICogbmVlZCB0byBiZSBzZXQgb25jZSBmcm9tIGF0dHJpYnV0ZSBkYXRhLiBJdCdzIG9yZGVyZWQgYnlcbiAqIGRpcmVjdGl2ZSBpbmRleCAocmVsYXRpdmUgdG8gZWxlbWVudCkgc28gaXQncyBzaW1wbGUgdG9cbiAqIGxvb2sgdXAgYSBzcGVjaWZpYyBkaXJlY3RpdmUncyBpbml0aWFsIGlucHV0IGRhdGEuXG4gKlxuICogV2l0aGluIGVhY2ggc3ViLWFycmF5OlxuICpcbiAqIEV2ZW4gaW5kaWNlczogbWluaWZpZWQvaW50ZXJuYWwgaW5wdXQgbmFtZVxuICogT2RkIGluZGljZXM6IGluaXRpYWwgdmFsdWVcbiAqXG4gKiBJZiBhIGRpcmVjdGl2ZSBvbiBhIG5vZGUgZG9lcyBub3QgaGF2ZSBhbnkgaW5wdXQgcHJvcGVydGllc1xuICogdGhhdCBzaG91bGQgYmUgc2V0IGZyb20gYXR0cmlidXRlcywgaXRzIGluZGV4IGlzIHNldCB0byBudWxsXG4gKiB0byBhdm9pZCBhIHNwYXJzZSBhcnJheS5cbiAqXG4gKiBlLmcuIFtudWxsLCBbJ3JvbGUtbWluJywgJ2J1dHRvbiddXVxuICovXG5leHBvcnQgdHlwZSBJbml0aWFsSW5wdXREYXRhID0gKEluaXRpYWxJbnB1dHMgfCBudWxsKVtdO1xuXG4vKipcbiAqIFVzZWQgYnkgSW5pdGlhbElucHV0RGF0YSB0byBzdG9yZSBpbnB1dCBwcm9wZXJ0aWVzXG4gKiB0aGF0IHNob3VsZCBiZSBzZXQgb25jZSBmcm9tIGF0dHJpYnV0ZXMuXG4gKlxuICogRXZlbiBpbmRpY2VzOiBtaW5pZmllZC9pbnRlcm5hbCBpbnB1dCBuYW1lXG4gKiBPZGQgaW5kaWNlczogaW5pdGlhbCB2YWx1ZVxuICpcbiAqIGUuZy4gWydyb2xlLW1pbicsICdidXR0b24nXVxuICovXG5leHBvcnQgdHlwZSBJbml0aWFsSW5wdXRzID0gc3RyaW5nW107XG5cbi8vIE5vdGU6IFRoaXMgaGFjayBpcyBuZWNlc3Nhcnkgc28gd2UgZG9uJ3QgZXJyb25lb3VzbHkgZ2V0IGEgY2lyY3VsYXIgZGVwZW5kZW5jeVxuLy8gZmFpbHVyZSBiYXNlZCBvbiB0eXBlcy5cbmV4cG9ydCBjb25zdCB1bnVzZWRWYWx1ZUV4cG9ydFRvUGxhY2F0ZUFqZCA9IDE7XG5cbi8qKlxuICogVHlwZSByZXByZXNlbnRpbmcgYSBzZXQgb2YgVE5vZGVzIHRoYXQgY2FuIGhhdmUgbG9jYWwgcmVmcyAoYCNmb29gKSBwbGFjZWQgb24gdGhlbS5cbiAqL1xuZXhwb3J0IHR5cGUgVE5vZGVXaXRoTG9jYWxSZWZzID0gVENvbnRhaW5lck5vZGUgfCBURWxlbWVudE5vZGUgfCBURWxlbWVudENvbnRhaW5lck5vZGU7XG5cbi8qKlxuICogVHlwZSBmb3IgYSBmdW5jdGlvbiB0aGF0IGV4dHJhY3RzIGEgdmFsdWUgZm9yIGEgbG9jYWwgcmVmcy5cbiAqIEV4YW1wbGU6XG4gKiAtIGA8ZGl2ICNuYXRpdmVEaXZFbD5gIC0gYG5hdGl2ZURpdkVsYCBzaG91bGQgcG9pbnQgdG8gdGhlIG5hdGl2ZSBgPGRpdj5gIGVsZW1lbnQ7XG4gKiAtIGA8bmctdGVtcGxhdGUgI3RwbFJlZj5gIC0gYHRwbFJlZmAgc2hvdWxkIHBvaW50IHRvIHRoZSBgVGVtcGxhdGVSZWZgIGluc3RhbmNlO1xuICovXG5leHBvcnQgdHlwZSBMb2NhbFJlZkV4dHJhY3RvciA9ICh0Tm9kZTogVE5vZGVXaXRoTG9jYWxSZWZzLCBjdXJyZW50VmlldzogTFZpZXcpID0+IGFueTtcbiJdfQ==