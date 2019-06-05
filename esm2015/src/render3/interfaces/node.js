/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/** @enum {number} */
const TNodeType = {
    /**
     * The TNode contains information about an {@link LContainer} for embedded views.
     */
    Container: 0,
    /**
     * The TNode contains information about an `<ng-content>` projection
     */
    Projection: 1,
    /**
     * The TNode contains information about an {@link LView}
     */
    View: 2,
    /**
     * The TNode contains information about a DOM element aka {@link RNode}.
     */
    Element: 3,
    /**
     * The TNode contains information about an `<ng-container>` element {@link RNode}.
     */
    ElementContainer: 4,
    /**
     * The TNode contains information about an ICU comment used in `i18n`.
     */
    IcuContainer: 5,
};
export { TNodeType };
/** @enum {number} */
const TNodeFlags = {
    /** This bit is set if the node is a component */
    isComponent: 1,
    /** This bit is set if the node has been projected */
    isProjected: 2,
    /** This bit is set if any directive on this node has content queries */
    hasContentQuery: 4,
    /** This bit is set if the node has any "class" inputs */
    hasClassInput: 8,
    /** This bit is set if the node has any "style" inputs */
    hasStyleInput: 16,
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
     * Signals that the following attribute names were extracted from input or output bindings.
     *
     * For example, given the following HTML:
     *
     * ```
     * <div moo="car" [foo]="exp" (bar)="doSth()">
     * ```
     *
     * the generated code is:
     *
     * ```
     * var _c1 = ['moo', 'car', AttributeMarker.Bindings, 'foo', 'bar'];
     * ```
     */
    Bindings: 3,
    /**
     * Signals that the following attribute names were hoisted from an inline-template declaration.
     *
     * For example, given the following HTML:
     *
     * ```
     * <div *ngFor="let value of values; trackBy:trackBy" dirA [dirB]="value">
     * ```
     *
     * the generated code for the `template()` instruction would include:
     *
     * ```
     * ['dirA', '', AttributeMarker.Bindings, 'dirB', AttributeMarker.Template, 'ngFor', 'ngForOf',
     * 'ngForTrackBy', 'let-value']
     * ```
     *
     * while the generated code for the `element()` instruction inside the template function would
     * include:
     *
     * ```
     * ['dirA', '', AttributeMarker.Bindings, 'dirB']
     * ```
     */
    Template: 4,
    /**
     * Signals that the following attribute is `ngProjectAs` and its value is a parsed `CssSelector`.
     *
     * For example, given the following HTML:
     *
     * ```
     * <h1 attr="value" ngProjectAs="[title]">
     * ```
     *
     * the generated code for the `element()` instruction would include:
     *
     * ```
     * ['attr', 'value', AttributeMarker.ProjectAs, ['', 'title', '']]
     * ```
     */
    ProjectAs: 5,
    /**
     * Signals that the following attribute will be translated by runtime i18n
     *
     * For example, given the following HTML:
     *
     * ```
     * <div moo="car" foo="value" i18n-foo [bar]="binding" i18n-bar>
     * ```
     *
     * the generated code is:
     *
     * ```
     * var _c1 = ['moo', 'car', AttributeMarker.I18n, 'foo', 'bar'];
     */
    I18n: 6,
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
     * Stores if Node isComponent, isProjected, hasContentQuery, hasClassInput and hasStyleInput
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
     * The next projected sibling. Since in Angular content projection works on the node-by-node basis
     * the act of projecting nodes might change nodes relationship at the insertion point (target
     * view). At the same time we need to keep initial relationship between nodes as expressed in
     * content view.
     * @type {?}
     */
    TNode.prototype.projectionNext;
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
    /**
     * A buffer of functions that will be called once `elementEnd` (or `element`) completes.
     *
     * Due to the nature of how directives work in Angular, some directive code may
     * need to fire after any template-level code runs. If present, this array will
     * be flushed (each function will be invoked) once the associated element is
     * created.
     *
     * If an element is created multiple times then this function will be populated
     * with functions each time the creation block is called.
     * @type {?}
     */
    TNode.prototype.onElementCreationFns;
    /** @type {?} */
    TNode.prototype.newStyles;
    /** @type {?} */
    TNode.prototype.newClasses;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9kZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaW50ZXJmYWNlcy9ub2RlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztJQWtCRTs7T0FFRztJQUNILFlBQWE7SUFDYjs7T0FFRztJQUNILGFBQWM7SUFDZDs7T0FFRztJQUNILE9BQVE7SUFDUjs7T0FFRztJQUNILFVBQVc7SUFDWDs7T0FFRztJQUNILG1CQUFvQjtJQUNwQjs7T0FFRztJQUNILGVBQWdCOzs7OztJQU9oQixpREFBaUQ7SUFDakQsY0FBcUI7SUFFckIscURBQXFEO0lBQ3JELGNBQXFCO0lBRXJCLHdFQUF3RTtJQUN4RSxrQkFBeUI7SUFFekIseURBQXlEO0lBQ3pELGdCQUF1QjtJQUV2Qix5REFBeUQ7SUFDekQsaUJBQXVCOzs7OztJQU92Qiw0RkFBNEY7SUFDNUYsOEJBQTREO0lBRTVEOzBCQUNzQjtJQUN0Qiw4QkFBK0I7SUFDL0IsbUNBQWlFOzs7OztJQU9qRTs7OztPQUlHO0lBQ0gsZUFBZ0I7SUFFaEI7Ozs7Ozs7Ozs7Ozs7OztRQWVJO0lBQ0osVUFBVztJQUVYOzs7Ozs7Ozs7Ozs7Ozs7O09BZ0JHO0lBQ0gsU0FBVTtJQUVWOzs7Ozs7Ozs7Ozs7OztPQWNHO0lBQ0gsV0FBWTtJQUVaOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O09Bc0JHO0lBQ0gsV0FBWTtJQUVaOzs7Ozs7Ozs7Ozs7OztPQWNHO0lBQ0gsWUFBYTtJQUViOzs7Ozs7Ozs7Ozs7O09BYUc7SUFDSCxPQUFJOzs7Ozs7Ozs7Ozs7Ozs7QUFzQk4sMkJBZ1BDOzs7Ozs7SUE5T0MscUJBQWdCOzs7Ozs7Ozs7O0lBVWhCLHNCQUFjOzs7Ozs7Ozs7Ozs7Ozs7SUFlZCw4QkFBc0I7Ozs7O0lBS3RCLCtCQUF1Qjs7Ozs7SUFLdkIsNkJBQXFCOzs7Ozs7SUFNckIsMkNBQW1DOzs7Ozs7SUFNbkMseUNBQWlDOzs7OztJQUtqQyxzQkFBa0I7Ozs7Ozs7O0lBU2xCLGdDQUFzQzs7Ozs7SUFHdEMsd0JBQXFCOzs7Ozs7Ozs7Ozs7Ozs7O0lBZ0JyQixzQkFBd0I7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUFtQnhCLDJCQUFtQzs7Ozs7SUFHbkMsOEJBQStDOzs7Ozs7OztJQVEvQyx1QkFBdUM7Ozs7Ozs7O0lBUXZDLHdCQUF3Qzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQXNCeEMsdUJBQTJCOzs7Ozs7SUFNM0IscUJBQWlCOzs7Ozs7OztJQVFqQiwrQkFBMkI7Ozs7Ozs7O0lBUTNCLHNCQUFrQjs7Ozs7Ozs7Ozs7Ozs7OztJQWdCbEIsdUJBQXlDOztJQUV6QyxnQ0FBcUM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBd0NyQywyQkFBMEM7Ozs7Ozs7Ozs7Ozs7SUFhMUMscUNBQXNDOztJQUV0QywwQkFBZ0M7O0lBRWhDLDJCQUFpQzs7Ozs7O0FBSW5DLGtDQWtCQzs7Ozs7O0lBaEJDLDZCQUFjOztJQUNkLDZCQUF3Rjs7Ozs7OztJQU14Riw4QkFBZ0Q7O0lBQ2hELDhCQUFhOzs7Ozs7O0lBT2Isa0NBQW1DOzs7Ozs7QUFJckMsK0JBWUM7Ozs7OztJQVZDLDBCQUFjOztJQUNkLDBCQUFZOzs7Ozs7O0lBTVosMkJBQWdEOztJQUNoRCwyQkFBYTs7SUFDYiwrQkFBaUI7Ozs7OztBQUluQixvQ0FtQkM7Ozs7Ozs7OztJQVpDLCtCQUFjOztJQUNkLCtCQUFZOzs7Ozs7OztJQVFaLGdDQUFnRDs7SUFDaEQsZ0NBQTJCOztJQUMzQixvQ0FBaUI7Ozs7OztBQUluQiwyQ0FPQzs7Ozs7O0lBTEMsc0NBQWM7O0lBQ2Qsc0NBQXdGOztJQUN4Rix1Q0FBZ0Q7O0lBQ2hELHVDQUFhOztJQUNiLDJDQUFpQjs7Ozs7O0FBSW5CLHVDQVlDOzs7Ozs7SUFWQyxrQ0FBYzs7SUFDZCxrQ0FBbUM7O0lBQ25DLG1DQUFnRDs7SUFDaEQsbUNBQWE7O0lBQ2IsdUNBQWlCOzs7Ozs7SUFLakIsNENBQTZCOzs7Ozs7QUFJL0IsK0JBT0M7Ozs7OztJQUxDLDBCQUFjOztJQUNkLDBCQUF3Rjs7SUFDeEYsMkJBQTRCOztJQUM1QiwyQkFBYTs7SUFDYiwrQkFBaUI7Ozs7OztBQUluQixxQ0FhQzs7Ozs7O0lBWEMsZ0NBQVk7Ozs7Ozs7SUFNWixpQ0FBZ0Q7O0lBQ2hELGlDQUFhOzs7OztJQUdiLHFDQUFtQjs7Ozs7QUErRHJCLE1BQU0sT0FBTyw2QkFBNkIsR0FBRyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0IHtUU3R5bGluZ0NvbnRleHR9IGZyb20gJy4uL3N0eWxpbmdfbmV4dC9pbnRlcmZhY2VzJztcbmltcG9ydCB7Q3NzU2VsZWN0b3J9IGZyb20gJy4vcHJvamVjdGlvbic7XG5pbXBvcnQge1JOb2RlfSBmcm9tICcuL3JlbmRlcmVyJztcbmltcG9ydCB7U3R5bGluZ0NvbnRleHR9IGZyb20gJy4vc3R5bGluZyc7XG5pbXBvcnQge0xWaWV3LCBUVmlld30gZnJvbSAnLi92aWV3JztcblxuXG4vKipcbiAqIFROb2RlVHlwZSBjb3JyZXNwb25kcyB0byB0aGUge0BsaW5rIFROb2RlfSBgdHlwZWAgcHJvcGVydHkuXG4gKi9cbmV4cG9ydCBjb25zdCBlbnVtIFROb2RlVHlwZSB7XG4gIC8qKlxuICAgKiBUaGUgVE5vZGUgY29udGFpbnMgaW5mb3JtYXRpb24gYWJvdXQgYW4ge0BsaW5rIExDb250YWluZXJ9IGZvciBlbWJlZGRlZCB2aWV3cy5cbiAgICovXG4gIENvbnRhaW5lciA9IDAsXG4gIC8qKlxuICAgKiBUaGUgVE5vZGUgY29udGFpbnMgaW5mb3JtYXRpb24gYWJvdXQgYW4gYDxuZy1jb250ZW50PmAgcHJvamVjdGlvblxuICAgKi9cbiAgUHJvamVjdGlvbiA9IDEsXG4gIC8qKlxuICAgKiBUaGUgVE5vZGUgY29udGFpbnMgaW5mb3JtYXRpb24gYWJvdXQgYW4ge0BsaW5rIExWaWV3fVxuICAgKi9cbiAgVmlldyA9IDIsXG4gIC8qKlxuICAgKiBUaGUgVE5vZGUgY29udGFpbnMgaW5mb3JtYXRpb24gYWJvdXQgYSBET00gZWxlbWVudCBha2Ege0BsaW5rIFJOb2RlfS5cbiAgICovXG4gIEVsZW1lbnQgPSAzLFxuICAvKipcbiAgICogVGhlIFROb2RlIGNvbnRhaW5zIGluZm9ybWF0aW9uIGFib3V0IGFuIGA8bmctY29udGFpbmVyPmAgZWxlbWVudCB7QGxpbmsgUk5vZGV9LlxuICAgKi9cbiAgRWxlbWVudENvbnRhaW5lciA9IDQsXG4gIC8qKlxuICAgKiBUaGUgVE5vZGUgY29udGFpbnMgaW5mb3JtYXRpb24gYWJvdXQgYW4gSUNVIGNvbW1lbnQgdXNlZCBpbiBgaTE4bmAuXG4gICAqL1xuICBJY3VDb250YWluZXIgPSA1LFxufVxuXG4vKipcbiAqIENvcnJlc3BvbmRzIHRvIHRoZSBUTm9kZS5mbGFncyBwcm9wZXJ0eS5cbiAqL1xuZXhwb3J0IGNvbnN0IGVudW0gVE5vZGVGbGFncyB7XG4gIC8qKiBUaGlzIGJpdCBpcyBzZXQgaWYgdGhlIG5vZGUgaXMgYSBjb21wb25lbnQgKi9cbiAgaXNDb21wb25lbnQgPSAwYjAwMDAxLFxuXG4gIC8qKiBUaGlzIGJpdCBpcyBzZXQgaWYgdGhlIG5vZGUgaGFzIGJlZW4gcHJvamVjdGVkICovXG4gIGlzUHJvamVjdGVkID0gMGIwMDAxMCxcblxuICAvKiogVGhpcyBiaXQgaXMgc2V0IGlmIGFueSBkaXJlY3RpdmUgb24gdGhpcyBub2RlIGhhcyBjb250ZW50IHF1ZXJpZXMgKi9cbiAgaGFzQ29udGVudFF1ZXJ5ID0gMGIwMDEwMCxcblxuICAvKiogVGhpcyBiaXQgaXMgc2V0IGlmIHRoZSBub2RlIGhhcyBhbnkgXCJjbGFzc1wiIGlucHV0cyAqL1xuICBoYXNDbGFzc0lucHV0ID0gMGIwMTAwMCxcblxuICAvKiogVGhpcyBiaXQgaXMgc2V0IGlmIHRoZSBub2RlIGhhcyBhbnkgXCJzdHlsZVwiIGlucHV0cyAqL1xuICBoYXNTdHlsZUlucHV0ID0gMGIxMDAwMCxcbn1cblxuLyoqXG4gKiBDb3JyZXNwb25kcyB0byB0aGUgVE5vZGUucHJvdmlkZXJJbmRleGVzIHByb3BlcnR5LlxuICovXG5leHBvcnQgY29uc3QgZW51bSBUTm9kZVByb3ZpZGVySW5kZXhlcyB7XG4gIC8qKiBUaGUgaW5kZXggb2YgdGhlIGZpcnN0IHByb3ZpZGVyIG9uIHRoaXMgbm9kZSBpcyBlbmNvZGVkIG9uIHRoZSBsZWFzdCBzaWduaWZpY2FudCBiaXRzICovXG4gIFByb3ZpZGVyc1N0YXJ0SW5kZXhNYXNrID0gMGIwMDAwMDAwMDAwMDAwMDAwMTExMTExMTExMTExMTExMSxcblxuICAvKiogVGhlIGNvdW50IG9mIHZpZXcgcHJvdmlkZXJzIGZyb20gdGhlIGNvbXBvbmVudCBvbiB0aGlzIG5vZGUgaXMgZW5jb2RlZCBvbiB0aGUgMTYgbW9zdFxuICAgICBzaWduaWZpY2FudCBiaXRzICovXG4gIENwdFZpZXdQcm92aWRlcnNDb3VudFNoaWZ0ID0gMTYsXG4gIENwdFZpZXdQcm92aWRlcnNDb3VudFNoaWZ0ZXIgPSAwYjAwMDAwMDAwMDAwMDAwMDEwMDAwMDAwMDAwMDAwMDAwLFxufVxuLyoqXG4gKiBBIHNldCBvZiBtYXJrZXIgdmFsdWVzIHRvIGJlIHVzZWQgaW4gdGhlIGF0dHJpYnV0ZXMgYXJyYXlzLiBUaGVzZSBtYXJrZXJzIGluZGljYXRlIHRoYXQgc29tZVxuICogaXRlbXMgYXJlIG5vdCByZWd1bGFyIGF0dHJpYnV0ZXMgYW5kIHRoZSBwcm9jZXNzaW5nIHNob3VsZCBiZSBhZGFwdGVkIGFjY29yZGluZ2x5LlxuICovXG5leHBvcnQgY29uc3QgZW51bSBBdHRyaWJ1dGVNYXJrZXIge1xuICAvKipcbiAgICogTWFya2VyIGluZGljYXRlcyB0aGF0IHRoZSBmb2xsb3dpbmcgMyB2YWx1ZXMgaW4gdGhlIGF0dHJpYnV0ZXMgYXJyYXkgYXJlOlxuICAgKiBuYW1lc3BhY2VVcmksIGF0dHJpYnV0ZU5hbWUsIGF0dHJpYnV0ZVZhbHVlXG4gICAqIGluIHRoYXQgb3JkZXIuXG4gICAqL1xuICBOYW1lc3BhY2VVUkkgPSAwLFxuXG4gIC8qKlxuICAgICogU2lnbmFscyBjbGFzcyBkZWNsYXJhdGlvbi5cbiAgICAqXG4gICAgKiBFYWNoIHZhbHVlIGZvbGxvd2luZyBgQ2xhc3Nlc2AgZGVzaWduYXRlcyBhIGNsYXNzIG5hbWUgdG8gaW5jbHVkZSBvbiB0aGUgZWxlbWVudC5cbiAgICAqICMjIEV4YW1wbGU6XG4gICAgKlxuICAgICogR2l2ZW46XG4gICAgKiBgYGBcbiAgICAqIDxkaXYgY2xhc3M9XCJmb28gYmFyIGJhelwiPi4uLjxkL3ZpPlxuICAgICogYGBgXG4gICAgKlxuICAgICogdGhlIGdlbmVyYXRlZCBjb2RlIGlzOlxuICAgICogYGBgXG4gICAgKiB2YXIgX2MxID0gW0F0dHJpYnV0ZU1hcmtlci5DbGFzc2VzLCAnZm9vJywgJ2JhcicsICdiYXonXTtcbiAgICAqIGBgYFxuICAgICovXG4gIENsYXNzZXMgPSAxLFxuXG4gIC8qKlxuICAgKiBTaWduYWxzIHN0eWxlIGRlY2xhcmF0aW9uLlxuICAgKlxuICAgKiBFYWNoIHBhaXIgb2YgdmFsdWVzIGZvbGxvd2luZyBgU3R5bGVzYCBkZXNpZ25hdGVzIGEgc3R5bGUgbmFtZSBhbmQgdmFsdWUgdG8gaW5jbHVkZSBvbiB0aGVcbiAgICogZWxlbWVudC5cbiAgICogIyMgRXhhbXBsZTpcbiAgICpcbiAgICogR2l2ZW46XG4gICAqIGBgYFxuICAgKiA8ZGl2IHN0eWxlPVwid2lkdGg6MTAwcHg7IGhlaWdodDoyMDBweDsgY29sb3I6cmVkXCI+Li4uPC9kaXY+XG4gICAqIGBgYFxuICAgKlxuICAgKiB0aGUgZ2VuZXJhdGVkIGNvZGUgaXM6XG4gICAqIGBgYFxuICAgKiB2YXIgX2MxID0gW0F0dHJpYnV0ZU1hcmtlci5TdHlsZXMsICd3aWR0aCcsICcxMDBweCcsICdoZWlnaHQnLiAnMjAwcHgnLCAnY29sb3InLCAncmVkJ107XG4gICAqIGBgYFxuICAgKi9cbiAgU3R5bGVzID0gMixcblxuICAvKipcbiAgICogU2lnbmFscyB0aGF0IHRoZSBmb2xsb3dpbmcgYXR0cmlidXRlIG5hbWVzIHdlcmUgZXh0cmFjdGVkIGZyb20gaW5wdXQgb3Igb3V0cHV0IGJpbmRpbmdzLlxuICAgKlxuICAgKiBGb3IgZXhhbXBsZSwgZ2l2ZW4gdGhlIGZvbGxvd2luZyBIVE1MOlxuICAgKlxuICAgKiBgYGBcbiAgICogPGRpdiBtb289XCJjYXJcIiBbZm9vXT1cImV4cFwiIChiYXIpPVwiZG9TdGgoKVwiPlxuICAgKiBgYGBcbiAgICpcbiAgICogdGhlIGdlbmVyYXRlZCBjb2RlIGlzOlxuICAgKlxuICAgKiBgYGBcbiAgICogdmFyIF9jMSA9IFsnbW9vJywgJ2NhcicsIEF0dHJpYnV0ZU1hcmtlci5CaW5kaW5ncywgJ2ZvbycsICdiYXInXTtcbiAgICogYGBgXG4gICAqL1xuICBCaW5kaW5ncyA9IDMsXG5cbiAgLyoqXG4gICAqIFNpZ25hbHMgdGhhdCB0aGUgZm9sbG93aW5nIGF0dHJpYnV0ZSBuYW1lcyB3ZXJlIGhvaXN0ZWQgZnJvbSBhbiBpbmxpbmUtdGVtcGxhdGUgZGVjbGFyYXRpb24uXG4gICAqXG4gICAqIEZvciBleGFtcGxlLCBnaXZlbiB0aGUgZm9sbG93aW5nIEhUTUw6XG4gICAqXG4gICAqIGBgYFxuICAgKiA8ZGl2ICpuZ0Zvcj1cImxldCB2YWx1ZSBvZiB2YWx1ZXM7IHRyYWNrQnk6dHJhY2tCeVwiIGRpckEgW2RpckJdPVwidmFsdWVcIj5cbiAgICogYGBgXG4gICAqXG4gICAqIHRoZSBnZW5lcmF0ZWQgY29kZSBmb3IgdGhlIGB0ZW1wbGF0ZSgpYCBpbnN0cnVjdGlvbiB3b3VsZCBpbmNsdWRlOlxuICAgKlxuICAgKiBgYGBcbiAgICogWydkaXJBJywgJycsIEF0dHJpYnV0ZU1hcmtlci5CaW5kaW5ncywgJ2RpckInLCBBdHRyaWJ1dGVNYXJrZXIuVGVtcGxhdGUsICduZ0ZvcicsICduZ0Zvck9mJyxcbiAgICogJ25nRm9yVHJhY2tCeScsICdsZXQtdmFsdWUnXVxuICAgKiBgYGBcbiAgICpcbiAgICogd2hpbGUgdGhlIGdlbmVyYXRlZCBjb2RlIGZvciB0aGUgYGVsZW1lbnQoKWAgaW5zdHJ1Y3Rpb24gaW5zaWRlIHRoZSB0ZW1wbGF0ZSBmdW5jdGlvbiB3b3VsZFxuICAgKiBpbmNsdWRlOlxuICAgKlxuICAgKiBgYGBcbiAgICogWydkaXJBJywgJycsIEF0dHJpYnV0ZU1hcmtlci5CaW5kaW5ncywgJ2RpckInXVxuICAgKiBgYGBcbiAgICovXG4gIFRlbXBsYXRlID0gNCxcblxuICAvKipcbiAgICogU2lnbmFscyB0aGF0IHRoZSBmb2xsb3dpbmcgYXR0cmlidXRlIGlzIGBuZ1Byb2plY3RBc2AgYW5kIGl0cyB2YWx1ZSBpcyBhIHBhcnNlZCBgQ3NzU2VsZWN0b3JgLlxuICAgKlxuICAgKiBGb3IgZXhhbXBsZSwgZ2l2ZW4gdGhlIGZvbGxvd2luZyBIVE1MOlxuICAgKlxuICAgKiBgYGBcbiAgICogPGgxIGF0dHI9XCJ2YWx1ZVwiIG5nUHJvamVjdEFzPVwiW3RpdGxlXVwiPlxuICAgKiBgYGBcbiAgICpcbiAgICogdGhlIGdlbmVyYXRlZCBjb2RlIGZvciB0aGUgYGVsZW1lbnQoKWAgaW5zdHJ1Y3Rpb24gd291bGQgaW5jbHVkZTpcbiAgICpcbiAgICogYGBgXG4gICAqIFsnYXR0cicsICd2YWx1ZScsIEF0dHJpYnV0ZU1hcmtlci5Qcm9qZWN0QXMsIFsnJywgJ3RpdGxlJywgJyddXVxuICAgKiBgYGBcbiAgICovXG4gIFByb2plY3RBcyA9IDUsXG5cbiAgLyoqXG4gICAqIFNpZ25hbHMgdGhhdCB0aGUgZm9sbG93aW5nIGF0dHJpYnV0ZSB3aWxsIGJlIHRyYW5zbGF0ZWQgYnkgcnVudGltZSBpMThuXG4gICAqXG4gICAqIEZvciBleGFtcGxlLCBnaXZlbiB0aGUgZm9sbG93aW5nIEhUTUw6XG4gICAqXG4gICAqIGBgYFxuICAgKiA8ZGl2IG1vbz1cImNhclwiIGZvbz1cInZhbHVlXCIgaTE4bi1mb28gW2Jhcl09XCJiaW5kaW5nXCIgaTE4bi1iYXI+XG4gICAqIGBgYFxuICAgKlxuICAgKiB0aGUgZ2VuZXJhdGVkIGNvZGUgaXM6XG4gICAqXG4gICAqIGBgYFxuICAgKiB2YXIgX2MxID0gWydtb28nLCAnY2FyJywgQXR0cmlidXRlTWFya2VyLkkxOG4sICdmb28nLCAnYmFyJ107XG4gICAqL1xuICBJMThuLFxufVxuXG4vKipcbiAqIEEgY29tYmluYXRpb24gb2Y6XG4gKiAtIEF0dHJpYnV0ZSBuYW1lcyBhbmQgdmFsdWVzLlxuICogLSBTcGVjaWFsIG1hcmtlcnMgYWN0aW5nIGFzIGZsYWdzIHRvIGFsdGVyIGF0dHJpYnV0ZXMgcHJvY2Vzc2luZy5cbiAqIC0gUGFyc2VkIG5nUHJvamVjdEFzIHNlbGVjdG9ycy5cbiAqL1xuZXhwb3J0IHR5cGUgVEF0dHJpYnV0ZXMgPSAoc3RyaW5nIHwgQXR0cmlidXRlTWFya2VyIHwgQ3NzU2VsZWN0b3IpW107XG5cbi8qKlxuICogQmluZGluZyBkYXRhIChmbHl3ZWlnaHQpIGZvciBhIHBhcnRpY3VsYXIgbm9kZSB0aGF0IGlzIHNoYXJlZCBiZXR3ZWVuIGFsbCB0ZW1wbGF0ZXNcbiAqIG9mIGEgc3BlY2lmaWMgdHlwZS5cbiAqXG4gKiBJZiBhIHByb3BlcnR5IGlzOlxuICogICAgLSBQcm9wZXJ0eUFsaWFzZXM6IHRoYXQgcHJvcGVydHkncyBkYXRhIHdhcyBnZW5lcmF0ZWQgYW5kIHRoaXMgaXMgaXRcbiAqICAgIC0gTnVsbDogdGhhdCBwcm9wZXJ0eSdzIGRhdGEgd2FzIGFscmVhZHkgZ2VuZXJhdGVkIGFuZCBub3RoaW5nIHdhcyBmb3VuZC5cbiAqICAgIC0gVW5kZWZpbmVkOiB0aGF0IHByb3BlcnR5J3MgZGF0YSBoYXMgbm90IHlldCBiZWVuIGdlbmVyYXRlZFxuICpcbiAqIHNlZTogaHR0cHM6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvRmx5d2VpZ2h0X3BhdHRlcm4gZm9yIG1vcmUgb24gdGhlIEZseXdlaWdodCBwYXR0ZXJuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgVE5vZGUge1xuICAvKiogVGhlIHR5cGUgb2YgdGhlIFROb2RlLiBTZWUgVE5vZGVUeXBlLiAqL1xuICB0eXBlOiBUTm9kZVR5cGU7XG5cbiAgLyoqXG4gICAqIEluZGV4IG9mIHRoZSBUTm9kZSBpbiBUVmlldy5kYXRhIGFuZCBjb3JyZXNwb25kaW5nIG5hdGl2ZSBlbGVtZW50IGluIExWaWV3LlxuICAgKlxuICAgKiBUaGlzIGlzIG5lY2Vzc2FyeSB0byBnZXQgZnJvbSBhbnkgVE5vZGUgdG8gaXRzIGNvcnJlc3BvbmRpbmcgbmF0aXZlIGVsZW1lbnQgd2hlblxuICAgKiB0cmF2ZXJzaW5nIHRoZSBub2RlIHRyZWUuXG4gICAqXG4gICAqIElmIGluZGV4IGlzIC0xLCB0aGlzIGlzIGEgZHluYW1pY2FsbHkgY3JlYXRlZCBjb250YWluZXIgbm9kZSBvciBlbWJlZGRlZCB2aWV3IG5vZGUuXG4gICAqL1xuICBpbmRleDogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBUaGUgaW5kZXggb2YgdGhlIGNsb3Nlc3QgaW5qZWN0b3IgaW4gdGhpcyBub2RlJ3MgTFZpZXcuXG4gICAqXG4gICAqIElmIHRoZSBpbmRleCA9PT0gLTEsIHRoZXJlIGlzIG5vIGluamVjdG9yIG9uIHRoaXMgbm9kZSBvciBhbnkgYW5jZXN0b3Igbm9kZSBpbiB0aGlzIHZpZXcuXG4gICAqXG4gICAqIElmIHRoZSBpbmRleCAhPT0gLTEsIGl0IGlzIHRoZSBpbmRleCBvZiB0aGlzIG5vZGUncyBpbmplY3RvciBPUiB0aGUgaW5kZXggb2YgYSBwYXJlbnQgaW5qZWN0b3JcbiAgICogaW4gdGhlIHNhbWUgdmlldy4gV2UgcGFzcyB0aGUgcGFyZW50IGluamVjdG9yIGluZGV4IGRvd24gdGhlIG5vZGUgdHJlZSBvZiBhIHZpZXcgc28gaXQnc1xuICAgKiBwb3NzaWJsZSB0byBmaW5kIHRoZSBwYXJlbnQgaW5qZWN0b3Igd2l0aG91dCB3YWxraW5nIGEgcG90ZW50aWFsbHkgZGVlcCBub2RlIHRyZWUuIEluamVjdG9yXG4gICAqIGluZGljZXMgYXJlIG5vdCBzZXQgYWNyb3NzIHZpZXcgYm91bmRhcmllcyBiZWNhdXNlIHRoZXJlIGNvdWxkIGJlIG11bHRpcGxlIGNvbXBvbmVudCBob3N0cy5cbiAgICpcbiAgICogSWYgdE5vZGUuaW5qZWN0b3JJbmRleCA9PT0gdE5vZGUucGFyZW50LmluamVjdG9ySW5kZXgsIHRoZW4gdGhlIGluZGV4IGJlbG9uZ3MgdG8gYSBwYXJlbnRcbiAgICogaW5qZWN0b3IuXG4gICAqL1xuICBpbmplY3RvckluZGV4OiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIFN0b3JlcyBzdGFydGluZyBpbmRleCBvZiB0aGUgZGlyZWN0aXZlcy5cbiAgICovXG4gIGRpcmVjdGl2ZVN0YXJ0OiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIFN0b3JlcyBmaW5hbCBleGNsdXNpdmUgaW5kZXggb2YgdGhlIGRpcmVjdGl2ZXMuXG4gICAqL1xuICBkaXJlY3RpdmVFbmQ6IG51bWJlcjtcblxuICAvKipcbiAgICogU3RvcmVzIHRoZSBmaXJzdCBpbmRleCB3aGVyZSBwcm9wZXJ0eSBiaW5kaW5nIG1ldGFkYXRhIGlzIHN0b3JlZCBmb3JcbiAgICogdGhpcyBub2RlLlxuICAgKi9cbiAgcHJvcGVydHlNZXRhZGF0YVN0YXJ0SW5kZXg6IG51bWJlcjtcblxuICAvKipcbiAgICogU3RvcmVzIHRoZSBleGNsdXNpdmUgZmluYWwgaW5kZXggd2hlcmUgcHJvcGVydHkgYmluZGluZyBtZXRhZGF0YSBpc1xuICAgKiBzdG9yZWQgZm9yIHRoaXMgbm9kZS5cbiAgICovXG4gIHByb3BlcnR5TWV0YWRhdGFFbmRJbmRleDogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBTdG9yZXMgaWYgTm9kZSBpc0NvbXBvbmVudCwgaXNQcm9qZWN0ZWQsIGhhc0NvbnRlbnRRdWVyeSwgaGFzQ2xhc3NJbnB1dCBhbmQgaGFzU3R5bGVJbnB1dFxuICAgKi9cbiAgZmxhZ3M6IFROb2RlRmxhZ3M7XG5cbiAgLyoqXG4gICAqIFRoaXMgbnVtYmVyIHN0b3JlcyB0d28gdmFsdWVzIHVzaW5nIGl0cyBiaXRzOlxuICAgKlxuICAgKiAtIHRoZSBpbmRleCBvZiB0aGUgZmlyc3QgcHJvdmlkZXIgb24gdGhhdCBub2RlIChmaXJzdCAxNiBiaXRzKVxuICAgKiAtIHRoZSBjb3VudCBvZiB2aWV3IHByb3ZpZGVycyBmcm9tIHRoZSBjb21wb25lbnQgb24gdGhpcyBub2RlIChsYXN0IDE2IGJpdHMpXG4gICAqL1xuICAvLyBUT0RPKG1pc2tvKTogYnJlYWsgdGhpcyBpbnRvIGFjdHVhbCB2YXJzLlxuICBwcm92aWRlckluZGV4ZXM6IFROb2RlUHJvdmlkZXJJbmRleGVzO1xuXG4gIC8qKiBUaGUgdGFnIG5hbWUgYXNzb2NpYXRlZCB3aXRoIHRoaXMgbm9kZS4gKi9cbiAgdGFnTmFtZTogc3RyaW5nfG51bGw7XG5cbiAgLyoqXG4gICAqIEF0dHJpYnV0ZXMgYXNzb2NpYXRlZCB3aXRoIGFuIGVsZW1lbnQuIFdlIG5lZWQgdG8gc3RvcmUgYXR0cmlidXRlcyB0byBzdXBwb3J0IHZhcmlvdXMgdXNlLWNhc2VzXG4gICAqIChhdHRyaWJ1dGUgaW5qZWN0aW9uLCBjb250ZW50IHByb2plY3Rpb24gd2l0aCBzZWxlY3RvcnMsIGRpcmVjdGl2ZXMgbWF0Y2hpbmcpLlxuICAgKiBBdHRyaWJ1dGVzIGFyZSBzdG9yZWQgc3RhdGljYWxseSBiZWNhdXNlIHJlYWRpbmcgdGhlbSBmcm9tIHRoZSBET00gd291bGQgYmUgd2F5IHRvbyBzbG93IGZvclxuICAgKiBjb250ZW50IHByb2plY3Rpb24gYW5kIHF1ZXJpZXMuXG4gICAqXG4gICAqIFNpbmNlIGF0dHJzIHdpbGwgYWx3YXlzIGJlIGNhbGN1bGF0ZWQgZmlyc3QsIHRoZXkgd2lsbCBuZXZlciBuZWVkIHRvIGJlIG1hcmtlZCB1bmRlZmluZWQgYnlcbiAgICogb3RoZXIgaW5zdHJ1Y3Rpb25zLlxuICAgKlxuICAgKiBGb3IgcmVndWxhciBhdHRyaWJ1dGVzIGEgbmFtZSBvZiBhbiBhdHRyaWJ1dGUgYW5kIGl0cyB2YWx1ZSBhbHRlcm5hdGUgaW4gdGhlIGFycmF5LlxuICAgKiBlLmcuIFsncm9sZScsICdjaGVja2JveCddXG4gICAqIFRoaXMgYXJyYXkgY2FuIGNvbnRhaW4gZmxhZ3MgdGhhdCB3aWxsIGluZGljYXRlIFwic3BlY2lhbCBhdHRyaWJ1dGVzXCIgKGF0dHJpYnV0ZXMgd2l0aFxuICAgKiBuYW1lc3BhY2VzLCBhdHRyaWJ1dGVzIGV4dHJhY3RlZCBmcm9tIGJpbmRpbmdzIGFuZCBvdXRwdXRzKS5cbiAgICovXG4gIGF0dHJzOiBUQXR0cmlidXRlc3xudWxsO1xuXG4gIC8qKlxuICAgKiBBIHNldCBvZiBsb2NhbCBuYW1lcyB1bmRlciB3aGljaCBhIGdpdmVuIGVsZW1lbnQgaXMgZXhwb3J0ZWQgaW4gYSB0ZW1wbGF0ZSBhbmRcbiAgICogdmlzaWJsZSB0byBxdWVyaWVzLiBBbiBlbnRyeSBpbiB0aGlzIGFycmF5IGNhbiBiZSBjcmVhdGVkIGZvciBkaWZmZXJlbnQgcmVhc29uczpcbiAgICogLSBhbiBlbGVtZW50IGl0c2VsZiBpcyByZWZlcmVuY2VkLCBleC46IGA8ZGl2ICNmb28+YFxuICAgKiAtIGEgY29tcG9uZW50IGlzIHJlZmVyZW5jZWQsIGV4LjogYDxteS1jbXB0ICNmb28+YFxuICAgKiAtIGEgZGlyZWN0aXZlIGlzIHJlZmVyZW5jZWQsIGV4LjogYDxteS1jbXB0ICNmb289XCJkaXJlY3RpdmVFeHBvcnRBc1wiPmAuXG4gICAqXG4gICAqIEEgZ2l2ZW4gZWxlbWVudCBtaWdodCBoYXZlIGRpZmZlcmVudCBsb2NhbCBuYW1lcyBhbmQgdGhvc2UgbmFtZXMgY2FuIGJlIGFzc29jaWF0ZWRcbiAgICogd2l0aCBhIGRpcmVjdGl2ZS4gV2Ugc3RvcmUgbG9jYWwgbmFtZXMgYXQgZXZlbiBpbmRleGVzIHdoaWxlIG9kZCBpbmRleGVzIGFyZSByZXNlcnZlZFxuICAgKiBmb3IgZGlyZWN0aXZlIGluZGV4IGluIGEgdmlldyAob3IgYC0xYCBpZiB0aGVyZSBpcyBubyBhc3NvY2lhdGVkIGRpcmVjdGl2ZSkuXG4gICAqXG4gICAqIFNvbWUgZXhhbXBsZXM6XG4gICAqIC0gYDxkaXYgI2Zvbz5gID0+IGBbXCJmb29cIiwgLTFdYFxuICAgKiAtIGA8bXktY21wdCAjZm9vPmAgPT4gYFtcImZvb1wiLCBteUNtcHRJZHhdYFxuICAgKiAtIGA8bXktY21wdCAjZm9vICNiYXI9XCJkaXJlY3RpdmVFeHBvcnRBc1wiPmAgPT4gYFtcImZvb1wiLCBteUNtcHRJZHgsIFwiYmFyXCIsIGRpcmVjdGl2ZUlkeF1gXG4gICAqIC0gYDxkaXYgI2ZvbyAjYmFyPVwiZGlyZWN0aXZlRXhwb3J0QXNcIj5gID0+IGBbXCJmb29cIiwgLTEsIFwiYmFyXCIsIGRpcmVjdGl2ZUlkeF1gXG4gICAqL1xuICBsb2NhbE5hbWVzOiAoc3RyaW5nfG51bWJlcilbXXxudWxsO1xuXG4gIC8qKiBJbmZvcm1hdGlvbiBhYm91dCBpbnB1dCBwcm9wZXJ0aWVzIHRoYXQgbmVlZCB0byBiZSBzZXQgb25jZSBmcm9tIGF0dHJpYnV0ZSBkYXRhLiAqL1xuICBpbml0aWFsSW5wdXRzOiBJbml0aWFsSW5wdXREYXRhfG51bGx8dW5kZWZpbmVkO1xuXG4gIC8qKlxuICAgKiBJbnB1dCBkYXRhIGZvciBhbGwgZGlyZWN0aXZlcyBvbiB0aGlzIG5vZGUuXG4gICAqXG4gICAqIC0gYHVuZGVmaW5lZGAgbWVhbnMgdGhhdCB0aGUgcHJvcCBoYXMgbm90IGJlZW4gaW5pdGlhbGl6ZWQgeWV0LFxuICAgKiAtIGBudWxsYCBtZWFucyB0aGF0IHRoZSBwcm9wIGhhcyBiZWVuIGluaXRpYWxpemVkIGJ1dCBubyBpbnB1dHMgaGF2ZSBiZWVuIGZvdW5kLlxuICAgKi9cbiAgaW5wdXRzOiBQcm9wZXJ0eUFsaWFzZXN8bnVsbHx1bmRlZmluZWQ7XG5cbiAgLyoqXG4gICAqIE91dHB1dCBkYXRhIGZvciBhbGwgZGlyZWN0aXZlcyBvbiB0aGlzIG5vZGUuXG4gICAqXG4gICAqIC0gYHVuZGVmaW5lZGAgbWVhbnMgdGhhdCB0aGUgcHJvcCBoYXMgbm90IGJlZW4gaW5pdGlhbGl6ZWQgeWV0LFxuICAgKiAtIGBudWxsYCBtZWFucyB0aGF0IHRoZSBwcm9wIGhhcyBiZWVuIGluaXRpYWxpemVkIGJ1dCBubyBvdXRwdXRzIGhhdmUgYmVlbiBmb3VuZC5cbiAgICovXG4gIG91dHB1dHM6IFByb3BlcnR5QWxpYXNlc3xudWxsfHVuZGVmaW5lZDtcblxuICAvKipcbiAgICogVGhlIFRWaWV3IG9yIFRWaWV3cyBhdHRhY2hlZCB0byB0aGlzIG5vZGUuXG4gICAqXG4gICAqIElmIHRoaXMgVE5vZGUgY29ycmVzcG9uZHMgdG8gYW4gTENvbnRhaW5lciB3aXRoIGlubGluZSB2aWV3cywgdGhlIGNvbnRhaW5lciB3aWxsXG4gICAqIG5lZWQgdG8gc3RvcmUgc2VwYXJhdGUgc3RhdGljIGRhdGEgZm9yIGVhY2ggb2YgaXRzIHZpZXcgYmxvY2tzIChUVmlld1tdKS4gT3RoZXJ3aXNlLFxuICAgKiBub2RlcyBpbiBpbmxpbmUgdmlld3Mgd2l0aCB0aGUgc2FtZSBpbmRleCBhcyBub2RlcyBpbiB0aGVpciBwYXJlbnQgdmlld3Mgd2lsbCBvdmVyd3JpdGVcbiAgICogZWFjaCBvdGhlciwgYXMgdGhleSBhcmUgaW4gdGhlIHNhbWUgdGVtcGxhdGUuXG4gICAqXG4gICAqIEVhY2ggaW5kZXggaW4gdGhpcyBhcnJheSBjb3JyZXNwb25kcyB0byB0aGUgc3RhdGljIGRhdGEgZm9yIGEgY2VydGFpblxuICAgKiB2aWV3LiBTbyBpZiB5b3UgaGFkIFYoMCkgYW5kIFYoMSkgaW4gYSBjb250YWluZXIsIHlvdSBtaWdodCBoYXZlOlxuICAgKlxuICAgKiBbXG4gICAqICAgW3t0YWdOYW1lOiAnZGl2JywgYXR0cnM6IC4uLn0sIG51bGxdLCAgICAgLy8gVigwKSBUVmlld1xuICAgKiAgIFt7dGFnTmFtZTogJ2J1dHRvbicsIGF0dHJzIC4uLn0sIG51bGxdICAgIC8vIFYoMSkgVFZpZXdcbiAgICpcbiAgICogSWYgdGhpcyBUTm9kZSBjb3JyZXNwb25kcyB0byBhbiBMQ29udGFpbmVyIHdpdGggYSB0ZW1wbGF0ZSAoZS5nLiBzdHJ1Y3R1cmFsXG4gICAqIGRpcmVjdGl2ZSksIHRoZSB0ZW1wbGF0ZSdzIFRWaWV3IHdpbGwgYmUgc3RvcmVkIGhlcmUuXG4gICAqXG4gICAqIElmIHRoaXMgVE5vZGUgY29ycmVzcG9uZHMgdG8gYW4gZWxlbWVudCwgdFZpZXdzIHdpbGwgYmUgbnVsbCAuXG4gICAqL1xuICB0Vmlld3M6IFRWaWV3fFRWaWV3W118bnVsbDtcblxuICAvKipcbiAgICogVGhlIG5leHQgc2libGluZyBub2RlLiBOZWNlc3Nhcnkgc28gd2UgY2FuIHByb3BhZ2F0ZSB0aHJvdWdoIHRoZSByb290IG5vZGVzIG9mIGEgdmlld1xuICAgKiB0byBpbnNlcnQgdGhlbSBvciByZW1vdmUgdGhlbSBmcm9tIHRoZSBET00uXG4gICAqL1xuICBuZXh0OiBUTm9kZXxudWxsO1xuXG4gIC8qKlxuICAgKiBUaGUgbmV4dCBwcm9qZWN0ZWQgc2libGluZy4gU2luY2UgaW4gQW5ndWxhciBjb250ZW50IHByb2plY3Rpb24gd29ya3Mgb24gdGhlIG5vZGUtYnktbm9kZSBiYXNpc1xuICAgKiB0aGUgYWN0IG9mIHByb2plY3Rpbmcgbm9kZXMgbWlnaHQgY2hhbmdlIG5vZGVzIHJlbGF0aW9uc2hpcCBhdCB0aGUgaW5zZXJ0aW9uIHBvaW50ICh0YXJnZXRcbiAgICogdmlldykuIEF0IHRoZSBzYW1lIHRpbWUgd2UgbmVlZCB0byBrZWVwIGluaXRpYWwgcmVsYXRpb25zaGlwIGJldHdlZW4gbm9kZXMgYXMgZXhwcmVzc2VkIGluXG4gICAqIGNvbnRlbnQgdmlldy5cbiAgICovXG4gIHByb2plY3Rpb25OZXh0OiBUTm9kZXxudWxsO1xuXG4gIC8qKlxuICAgKiBGaXJzdCBjaGlsZCBvZiB0aGUgY3VycmVudCBub2RlLlxuICAgKlxuICAgKiBGb3IgY29tcG9uZW50IG5vZGVzLCB0aGUgY2hpbGQgd2lsbCBhbHdheXMgYmUgYSBDb250ZW50Q2hpbGQgKGluIHNhbWUgdmlldykuXG4gICAqIEZvciBlbWJlZGRlZCB2aWV3IG5vZGVzLCB0aGUgY2hpbGQgd2lsbCBiZSBpbiB0aGVpciBjaGlsZCB2aWV3LlxuICAgKi9cbiAgY2hpbGQ6IFROb2RlfG51bGw7XG5cbiAgLyoqXG4gICAqIFBhcmVudCBub2RlIChpbiB0aGUgc2FtZSB2aWV3IG9ubHkpLlxuICAgKlxuICAgKiBXZSBuZWVkIGEgcmVmZXJlbmNlIHRvIGEgbm9kZSdzIHBhcmVudCBzbyB3ZSBjYW4gYXBwZW5kIHRoZSBub2RlIHRvIGl0cyBwYXJlbnQncyBuYXRpdmVcbiAgICogZWxlbWVudCBhdCB0aGUgYXBwcm9wcmlhdGUgdGltZS5cbiAgICpcbiAgICogSWYgdGhlIHBhcmVudCB3b3VsZCBiZSBpbiBhIGRpZmZlcmVudCB2aWV3IChlLmcuIGNvbXBvbmVudCBob3N0KSwgdGhpcyBwcm9wZXJ0eSB3aWxsIGJlIG51bGwuXG4gICAqIEl0J3MgaW1wb3J0YW50IHRoYXQgd2UgZG9uJ3QgdHJ5IHRvIGNyb3NzIGNvbXBvbmVudCBib3VuZGFyaWVzIHdoZW4gcmV0cmlldmluZyB0aGUgcGFyZW50XG4gICAqIGJlY2F1c2UgdGhlIHBhcmVudCB3aWxsIGNoYW5nZSAoZS5nLiBpbmRleCwgYXR0cnMpIGRlcGVuZGluZyBvbiB3aGVyZSB0aGUgY29tcG9uZW50IHdhc1xuICAgKiB1c2VkIChhbmQgdGh1cyBzaG91bGRuJ3QgYmUgc3RvcmVkIG9uIFROb2RlKS4gSW4gdGhlc2UgY2FzZXMsIHdlIHJldHJpZXZlIHRoZSBwYXJlbnQgdGhyb3VnaFxuICAgKiBMVmlldy5ub2RlIGluc3RlYWQgKHdoaWNoIHdpbGwgYmUgaW5zdGFuY2Utc3BlY2lmaWMpLlxuICAgKlxuICAgKiBJZiB0aGlzIGlzIGFuIGlubGluZSB2aWV3IG5vZGUgKFYpLCB0aGUgcGFyZW50IHdpbGwgYmUgaXRzIGNvbnRhaW5lci5cbiAgICovXG4gIHBhcmVudDogVEVsZW1lbnROb2RlfFRDb250YWluZXJOb2RlfG51bGw7XG5cbiAgc3R5bGluZ1RlbXBsYXRlOiBTdHlsaW5nQ29udGV4dHxudWxsO1xuICAvKipcbiAgICogTGlzdCBvZiBwcm9qZWN0ZWQgVE5vZGVzIGZvciBhIGdpdmVuIGNvbXBvbmVudCBob3N0IGVsZW1lbnQgT1IgaW5kZXggaW50byB0aGUgc2FpZCBub2Rlcy5cbiAgICpcbiAgICogRm9yIGVhc2llciBkaXNjdXNzaW9uIGFzc3VtZSB0aGlzIGV4YW1wbGU6XG4gICAqIGA8cGFyZW50PmAncyB2aWV3IGRlZmluaXRpb246XG4gICAqIGBgYFxuICAgKiA8Y2hpbGQgaWQ9XCJjMVwiPmNvbnRlbnQxPC9jaGlsZD5cbiAgICogPGNoaWxkIGlkPVwiYzJcIj48c3Bhbj5jb250ZW50Mjwvc3Bhbj48L2NoaWxkPlxuICAgKiBgYGBcbiAgICogYDxjaGlsZD5gJ3MgdmlldyBkZWZpbml0aW9uOlxuICAgKiBgYGBcbiAgICogPG5nLWNvbnRlbnQgaWQ9XCJjb250MVwiPjwvbmctY29udGVudD5cbiAgICogYGBgXG4gICAqXG4gICAqIElmIGBBcnJheS5pc0FycmF5KHByb2plY3Rpb24pYCB0aGVuIGBUTm9kZWAgaXMgYSBob3N0IGVsZW1lbnQ6XG4gICAqIC0gYHByb2plY3Rpb25gIHN0b3JlcyB0aGUgY29udGVudCBub2RlcyB3aGljaCBhcmUgdG8gYmUgcHJvamVjdGVkLlxuICAgKiAgICAtIFRoZSBub2RlcyByZXByZXNlbnQgY2F0ZWdvcmllcyBkZWZpbmVkIGJ5IHRoZSBzZWxlY3RvcjogRm9yIGV4YW1wbGU6XG4gICAqICAgICAgYDxuZy1jb250ZW50Lz48bmctY29udGVudCBzZWxlY3Q9XCJhYmNcIi8+YCB3b3VsZCByZXByZXNlbnQgdGhlIGhlYWRzIGZvciBgPG5nLWNvbnRlbnQvPmBcbiAgICogICAgICBhbmQgYDxuZy1jb250ZW50IHNlbGVjdD1cImFiY1wiLz5gIHJlc3BlY3RpdmVseS5cbiAgICogICAgLSBUaGUgbm9kZXMgd2Ugc3RvcmUgaW4gYHByb2plY3Rpb25gIGFyZSBoZWFkcyBvbmx5LCB3ZSB1c2VkIGAubmV4dGAgdG8gZ2V0IHRoZWlyXG4gICAqICAgICAgc2libGluZ3MuXG4gICAqICAgIC0gVGhlIG5vZGVzIGAubmV4dGAgaXMgc29ydGVkL3Jld3JpdHRlbiBhcyBwYXJ0IG9mIHRoZSBwcm9qZWN0aW9uIHNldHVwLlxuICAgKiAgICAtIGBwcm9qZWN0aW9uYCBzaXplIGlzIGVxdWFsIHRvIHRoZSBudW1iZXIgb2YgcHJvamVjdGlvbnMgYDxuZy1jb250ZW50PmAuIFRoZSBzaXplIG9mXG4gICAqICAgICAgYGMxYCB3aWxsIGJlIGAxYCBiZWNhdXNlIGA8Y2hpbGQ+YCBoYXMgb25seSBvbmUgYDxuZy1jb250ZW50PmAuXG4gICAqIC0gd2Ugc3RvcmUgYHByb2plY3Rpb25gIHdpdGggdGhlIGhvc3QgKGBjMWAsIGBjMmApIHJhdGhlciB0aGFuIHRoZSBgPG5nLWNvbnRlbnQ+YCAoYGNvbnQxYClcbiAgICogICBiZWNhdXNlIHRoZSBzYW1lIGNvbXBvbmVudCAoYDxjaGlsZD5gKSBjYW4gYmUgdXNlZCBpbiBtdWx0aXBsZSBsb2NhdGlvbnMgKGBjMWAsIGBjMmApIGFuZCBhc1xuICAgKiAgIGEgcmVzdWx0IGhhdmUgZGlmZmVyZW50IHNldCBvZiBub2RlcyB0byBwcm9qZWN0LlxuICAgKiAtIHdpdGhvdXQgYHByb2plY3Rpb25gIGl0IHdvdWxkIGJlIGRpZmZpY3VsdCB0byBlZmZpY2llbnRseSB0cmF2ZXJzZSBub2RlcyB0byBiZSBwcm9qZWN0ZWQuXG4gICAqXG4gICAqIElmIGB0eXBlb2YgcHJvamVjdGlvbiA9PSAnbnVtYmVyJ2AgdGhlbiBgVE5vZGVgIGlzIGEgYDxuZy1jb250ZW50PmAgZWxlbWVudDpcbiAgICogLSBgcHJvamVjdGlvbmAgaXMgYW4gaW5kZXggb2YgdGhlIGhvc3QncyBgcHJvamVjdGlvbmBOb2Rlcy5cbiAgICogICAtIFRoaXMgd291bGQgcmV0dXJuIHRoZSBmaXJzdCBoZWFkIG5vZGUgdG8gcHJvamVjdDpcbiAgICogICAgIGBnZXRIb3N0KGN1cnJlbnRUTm9kZSkucHJvamVjdGlvbltjdXJyZW50VE5vZGUucHJvamVjdGlvbl1gLlxuICAgKiAtIFdoZW4gcHJvamVjdGluZyBub2RlcyB0aGUgcGFyZW50IG5vZGUgcmV0cmlldmVkIG1heSBiZSBhIGA8bmctY29udGVudD5gIG5vZGUsIGluIHdoaWNoIGNhc2VcbiAgICogICB0aGUgcHJvY2VzcyBpcyByZWN1cnNpdmUgaW4gbmF0dXJlIChub3QgaW1wbGVtZW50YXRpb24pLlxuICAgKlxuICAgKiBJZiBgcHJvamVjdGlvbmAgaXMgb2YgdHlwZSBgUk5vZGVbXVtdYCB0aGFuIHdlIGhhdmUgYSBjb2xsZWN0aW9uIG9mIG5hdGl2ZSBub2RlcyBwYXNzZWQgYXNcbiAgICogcHJvamVjdGFibGUgbm9kZXMgZHVyaW5nIGR5bmFtaWMgY29tcG9uZW50IGNyZWF0aW9uLlxuICAgKi9cbiAgcHJvamVjdGlvbjogKFROb2RlfFJOb2RlW10pW118bnVtYmVyfG51bGw7XG5cbiAgLyoqXG4gICAqIEEgYnVmZmVyIG9mIGZ1bmN0aW9ucyB0aGF0IHdpbGwgYmUgY2FsbGVkIG9uY2UgYGVsZW1lbnRFbmRgIChvciBgZWxlbWVudGApIGNvbXBsZXRlcy5cbiAgICpcbiAgICogRHVlIHRvIHRoZSBuYXR1cmUgb2YgaG93IGRpcmVjdGl2ZXMgd29yayBpbiBBbmd1bGFyLCBzb21lIGRpcmVjdGl2ZSBjb2RlIG1heVxuICAgKiBuZWVkIHRvIGZpcmUgYWZ0ZXIgYW55IHRlbXBsYXRlLWxldmVsIGNvZGUgcnVucy4gSWYgcHJlc2VudCwgdGhpcyBhcnJheSB3aWxsXG4gICAqIGJlIGZsdXNoZWQgKGVhY2ggZnVuY3Rpb24gd2lsbCBiZSBpbnZva2VkKSBvbmNlIHRoZSBhc3NvY2lhdGVkIGVsZW1lbnQgaXNcbiAgICogY3JlYXRlZC5cbiAgICpcbiAgICogSWYgYW4gZWxlbWVudCBpcyBjcmVhdGVkIG11bHRpcGxlIHRpbWVzIHRoZW4gdGhpcyBmdW5jdGlvbiB3aWxsIGJlIHBvcHVsYXRlZFxuICAgKiB3aXRoIGZ1bmN0aW9ucyBlYWNoIHRpbWUgdGhlIGNyZWF0aW9uIGJsb2NrIGlzIGNhbGxlZC5cbiAgICovXG4gIG9uRWxlbWVudENyZWF0aW9uRm5zOiBGdW5jdGlvbltdfG51bGw7XG4gIC8vIFRPRE8gKG1hdHNrbyk6IHJlbmFtZSB0aGlzIHRvIGBzdHlsZXNgIG9uY2UgdGhlIG9sZCBzdHlsaW5nIGltcGwgaXMgZ29uZVxuICBuZXdTdHlsZXM6IFRTdHlsaW5nQ29udGV4dHxudWxsO1xuICAvLyBUT0RPIChtYXRza28pOiByZW5hbWUgdGhpcyB0byBgY2xhc3Nlc2Agb25jZSB0aGUgb2xkIHN0eWxpbmcgaW1wbCBpcyBnb25lXG4gIG5ld0NsYXNzZXM6IFRTdHlsaW5nQ29udGV4dHxudWxsO1xufVxuXG4vKiogU3RhdGljIGRhdGEgZm9yIGFuIGVsZW1lbnQgICovXG5leHBvcnQgaW50ZXJmYWNlIFRFbGVtZW50Tm9kZSBleHRlbmRzIFROb2RlIHtcbiAgLyoqIEluZGV4IGluIHRoZSBkYXRhW10gYXJyYXkgKi9cbiAgaW5kZXg6IG51bWJlcjtcbiAgY2hpbGQ6IFRFbGVtZW50Tm9kZXxUVGV4dE5vZGV8VEVsZW1lbnRDb250YWluZXJOb2RlfFRDb250YWluZXJOb2RlfFRQcm9qZWN0aW9uTm9kZXxudWxsO1xuICAvKipcbiAgICogRWxlbWVudCBub2RlcyB3aWxsIGhhdmUgcGFyZW50cyB1bmxlc3MgdGhleSBhcmUgdGhlIGZpcnN0IG5vZGUgb2YgYSBjb21wb25lbnQgb3JcbiAgICogZW1iZWRkZWQgdmlldyAod2hpY2ggbWVhbnMgdGhlaXIgcGFyZW50IGlzIGluIGEgZGlmZmVyZW50IHZpZXcgYW5kIG11c3QgYmVcbiAgICogcmV0cmlldmVkIHVzaW5nIHZpZXdEYXRhW0hPU1RfTk9ERV0pLlxuICAgKi9cbiAgcGFyZW50OiBURWxlbWVudE5vZGV8VEVsZW1lbnRDb250YWluZXJOb2RlfG51bGw7XG4gIHRWaWV3czogbnVsbDtcblxuICAvKipcbiAgICogSWYgdGhpcyBpcyBhIGNvbXBvbmVudCBUTm9kZSB3aXRoIHByb2plY3Rpb24sIHRoaXMgd2lsbCBiZSBhbiBhcnJheSBvZiBwcm9qZWN0ZWRcbiAgICogVE5vZGVzIG9yIG5hdGl2ZSBub2RlcyAoc2VlIFROb2RlLnByb2plY3Rpb24gZm9yIG1vcmUgaW5mbykuIElmIGl0J3MgYSByZWd1bGFyIGVsZW1lbnQgbm9kZSBvclxuICAgKiBhIGNvbXBvbmVudCB3aXRob3V0IHByb2plY3Rpb24sIGl0IHdpbGwgYmUgbnVsbC5cbiAgICovXG4gIHByb2plY3Rpb246IChUTm9kZXxSTm9kZVtdKVtdfG51bGw7XG59XG5cbi8qKiBTdGF0aWMgZGF0YSBmb3IgYSB0ZXh0IG5vZGUgKi9cbmV4cG9ydCBpbnRlcmZhY2UgVFRleHROb2RlIGV4dGVuZHMgVE5vZGUge1xuICAvKiogSW5kZXggaW4gdGhlIGRhdGFbXSBhcnJheSAqL1xuICBpbmRleDogbnVtYmVyO1xuICBjaGlsZDogbnVsbDtcbiAgLyoqXG4gICAqIFRleHQgbm9kZXMgd2lsbCBoYXZlIHBhcmVudHMgdW5sZXNzIHRoZXkgYXJlIHRoZSBmaXJzdCBub2RlIG9mIGEgY29tcG9uZW50IG9yXG4gICAqIGVtYmVkZGVkIHZpZXcgKHdoaWNoIG1lYW5zIHRoZWlyIHBhcmVudCBpcyBpbiBhIGRpZmZlcmVudCB2aWV3IGFuZCBtdXN0IGJlXG4gICAqIHJldHJpZXZlZCB1c2luZyBMVmlldy5ub2RlKS5cbiAgICovXG4gIHBhcmVudDogVEVsZW1lbnROb2RlfFRFbGVtZW50Q29udGFpbmVyTm9kZXxudWxsO1xuICB0Vmlld3M6IG51bGw7XG4gIHByb2plY3Rpb246IG51bGw7XG59XG5cbi8qKiBTdGF0aWMgZGF0YSBmb3IgYW4gTENvbnRhaW5lciAqL1xuZXhwb3J0IGludGVyZmFjZSBUQ29udGFpbmVyTm9kZSBleHRlbmRzIFROb2RlIHtcbiAgLyoqXG4gICAqIEluZGV4IGluIHRoZSBkYXRhW10gYXJyYXkuXG4gICAqXG4gICAqIElmIGl0J3MgLTEsIHRoaXMgaXMgYSBkeW5hbWljYWxseSBjcmVhdGVkIGNvbnRhaW5lciBub2RlIHRoYXQgaXNuJ3Qgc3RvcmVkIGluXG4gICAqIGRhdGFbXSAoZS5nLiB3aGVuIHlvdSBpbmplY3QgVmlld0NvbnRhaW5lclJlZikgLlxuICAgKi9cbiAgaW5kZXg6IG51bWJlcjtcbiAgY2hpbGQ6IG51bGw7XG5cbiAgLyoqXG4gICAqIENvbnRhaW5lciBub2RlcyB3aWxsIGhhdmUgcGFyZW50cyB1bmxlc3M6XG4gICAqXG4gICAqIC0gVGhleSBhcmUgdGhlIGZpcnN0IG5vZGUgb2YgYSBjb21wb25lbnQgb3IgZW1iZWRkZWQgdmlld1xuICAgKiAtIFRoZXkgYXJlIGR5bmFtaWNhbGx5IGNyZWF0ZWRcbiAgICovXG4gIHBhcmVudDogVEVsZW1lbnROb2RlfFRFbGVtZW50Q29udGFpbmVyTm9kZXxudWxsO1xuICB0Vmlld3M6IFRWaWV3fFRWaWV3W118bnVsbDtcbiAgcHJvamVjdGlvbjogbnVsbDtcbn1cblxuLyoqIFN0YXRpYyBkYXRhIGZvciBhbiA8bmctY29udGFpbmVyPiAqL1xuZXhwb3J0IGludGVyZmFjZSBURWxlbWVudENvbnRhaW5lck5vZGUgZXh0ZW5kcyBUTm9kZSB7XG4gIC8qKiBJbmRleCBpbiB0aGUgTFZpZXdbXSBhcnJheS4gKi9cbiAgaW5kZXg6IG51bWJlcjtcbiAgY2hpbGQ6IFRFbGVtZW50Tm9kZXxUVGV4dE5vZGV8VENvbnRhaW5lck5vZGV8VEVsZW1lbnRDb250YWluZXJOb2RlfFRQcm9qZWN0aW9uTm9kZXxudWxsO1xuICBwYXJlbnQ6IFRFbGVtZW50Tm9kZXxURWxlbWVudENvbnRhaW5lck5vZGV8bnVsbDtcbiAgdFZpZXdzOiBudWxsO1xuICBwcm9qZWN0aW9uOiBudWxsO1xufVxuXG4vKiogU3RhdGljIGRhdGEgZm9yIGFuIElDVSBleHByZXNzaW9uICovXG5leHBvcnQgaW50ZXJmYWNlIFRJY3VDb250YWluZXJOb2RlIGV4dGVuZHMgVE5vZGUge1xuICAvKiogSW5kZXggaW4gdGhlIExWaWV3W10gYXJyYXkuICovXG4gIGluZGV4OiBudW1iZXI7XG4gIGNoaWxkOiBURWxlbWVudE5vZGV8VFRleHROb2RlfG51bGw7XG4gIHBhcmVudDogVEVsZW1lbnROb2RlfFRFbGVtZW50Q29udGFpbmVyTm9kZXxudWxsO1xuICB0Vmlld3M6IG51bGw7XG4gIHByb2plY3Rpb246IG51bGw7XG4gIC8qKlxuICAgKiBJbmRpY2F0ZXMgdGhlIGN1cnJlbnQgYWN0aXZlIGNhc2UgZm9yIGFuIElDVSBleHByZXNzaW9uLlxuICAgKiBJdCBpcyBudWxsIHdoZW4gdGhlcmUgaXMgbm8gYWN0aXZlIGNhc2UuXG4gICAqL1xuICBhY3RpdmVDYXNlSW5kZXg6IG51bWJlcnxudWxsO1xufVxuXG4vKiogU3RhdGljIGRhdGEgZm9yIGEgdmlldyAgKi9cbmV4cG9ydCBpbnRlcmZhY2UgVFZpZXdOb2RlIGV4dGVuZHMgVE5vZGUge1xuICAvKiogSWYgLTEsIGl0J3MgYSBkeW5hbWljYWxseSBjcmVhdGVkIHZpZXcuIE90aGVyd2lzZSwgaXQgaXMgdGhlIHZpZXcgYmxvY2sgSUQuICovXG4gIGluZGV4OiBudW1iZXI7XG4gIGNoaWxkOiBURWxlbWVudE5vZGV8VFRleHROb2RlfFRFbGVtZW50Q29udGFpbmVyTm9kZXxUQ29udGFpbmVyTm9kZXxUUHJvamVjdGlvbk5vZGV8bnVsbDtcbiAgcGFyZW50OiBUQ29udGFpbmVyTm9kZXxudWxsO1xuICB0Vmlld3M6IG51bGw7XG4gIHByb2plY3Rpb246IG51bGw7XG59XG5cbi8qKiBTdGF0aWMgZGF0YSBmb3IgYW4gTFByb2plY3Rpb25Ob2RlICAqL1xuZXhwb3J0IGludGVyZmFjZSBUUHJvamVjdGlvbk5vZGUgZXh0ZW5kcyBUTm9kZSB7XG4gIC8qKiBJbmRleCBpbiB0aGUgZGF0YVtdIGFycmF5ICovXG4gIGNoaWxkOiBudWxsO1xuICAvKipcbiAgICogUHJvamVjdGlvbiBub2RlcyB3aWxsIGhhdmUgcGFyZW50cyB1bmxlc3MgdGhleSBhcmUgdGhlIGZpcnN0IG5vZGUgb2YgYSBjb21wb25lbnRcbiAgICogb3IgZW1iZWRkZWQgdmlldyAod2hpY2ggbWVhbnMgdGhlaXIgcGFyZW50IGlzIGluIGEgZGlmZmVyZW50IHZpZXcgYW5kIG11c3QgYmVcbiAgICogcmV0cmlldmVkIHVzaW5nIExWaWV3Lm5vZGUpLlxuICAgKi9cbiAgcGFyZW50OiBURWxlbWVudE5vZGV8VEVsZW1lbnRDb250YWluZXJOb2RlfG51bGw7XG4gIHRWaWV3czogbnVsbDtcblxuICAvKiogSW5kZXggb2YgdGhlIHByb2plY3Rpb24gbm9kZS4gKFNlZSBUTm9kZS5wcm9qZWN0aW9uIGZvciBtb3JlIGluZm8uKSAqL1xuICBwcm9qZWN0aW9uOiBudW1iZXI7XG59XG5cbi8qKlxuICogVGhpcyBtYXBwaW5nIGlzIG5lY2Vzc2FyeSBzbyB3ZSBjYW4gc2V0IGlucHV0IHByb3BlcnRpZXMgYW5kIG91dHB1dCBsaXN0ZW5lcnNcbiAqIHByb3Blcmx5IGF0IHJ1bnRpbWUgd2hlbiBwcm9wZXJ0eSBuYW1lcyBhcmUgbWluaWZpZWQgb3IgYWxpYXNlZC5cbiAqXG4gKiBLZXk6IHVubWluaWZpZWQgLyBwdWJsaWMgaW5wdXQgb3Igb3V0cHV0IG5hbWVcbiAqIFZhbHVlOiBhcnJheSBjb250YWluaW5nIG1pbmlmaWVkIC8gaW50ZXJuYWwgbmFtZSBhbmQgcmVsYXRlZCBkaXJlY3RpdmUgaW5kZXhcbiAqXG4gKiBUaGUgdmFsdWUgbXVzdCBiZSBhbiBhcnJheSB0byBzdXBwb3J0IGlucHV0cyBhbmQgb3V0cHV0cyB3aXRoIHRoZSBzYW1lIG5hbWVcbiAqIG9uIHRoZSBzYW1lIG5vZGUuXG4gKi9cbmV4cG9ydCB0eXBlIFByb3BlcnR5QWxpYXNlcyA9IHtcbiAgLy8gVGhpcyB1c2VzIGFuIG9iamVjdCBtYXAgYmVjYXVzZSB1c2luZyB0aGUgTWFwIHR5cGUgd291bGQgYmUgdG9vIHNsb3dcbiAgW2tleTogc3RyaW5nXTogUHJvcGVydHlBbGlhc1ZhbHVlXG59O1xuXG4vKipcbiAqIFN0b3JlIHRoZSBydW50aW1lIGlucHV0IG9yIG91dHB1dCBuYW1lcyBmb3IgYWxsIHRoZSBkaXJlY3RpdmVzLlxuICpcbiAqIGkrMDogZGlyZWN0aXZlIGluc3RhbmNlIGluZGV4XG4gKiBpKzE6IHB1YmxpY05hbWVcbiAqIGkrMjogcHJpdmF0ZU5hbWVcbiAqXG4gKiBlLmcuIFswLCAnY2hhbmdlJywgJ2NoYW5nZS1taW5pZmllZCddXG4gKi9cbmV4cG9ydCB0eXBlIFByb3BlcnR5QWxpYXNWYWx1ZSA9IChudW1iZXIgfCBzdHJpbmcpW107XG5cbi8qKlxuICogVGhpcyBhcnJheSBjb250YWlucyBpbmZvcm1hdGlvbiBhYm91dCBpbnB1dCBwcm9wZXJ0aWVzIHRoYXRcbiAqIG5lZWQgdG8gYmUgc2V0IG9uY2UgZnJvbSBhdHRyaWJ1dGUgZGF0YS4gSXQncyBvcmRlcmVkIGJ5XG4gKiBkaXJlY3RpdmUgaW5kZXggKHJlbGF0aXZlIHRvIGVsZW1lbnQpIHNvIGl0J3Mgc2ltcGxlIHRvXG4gKiBsb29rIHVwIGEgc3BlY2lmaWMgZGlyZWN0aXZlJ3MgaW5pdGlhbCBpbnB1dCBkYXRhLlxuICpcbiAqIFdpdGhpbiBlYWNoIHN1Yi1hcnJheTpcbiAqXG4gKiBpKzA6IGF0dHJpYnV0ZSBuYW1lXG4gKiBpKzE6IG1pbmlmaWVkL2ludGVybmFsIGlucHV0IG5hbWVcbiAqIGkrMjogaW5pdGlhbCB2YWx1ZVxuICpcbiAqIElmIGEgZGlyZWN0aXZlIG9uIGEgbm9kZSBkb2VzIG5vdCBoYXZlIGFueSBpbnB1dCBwcm9wZXJ0aWVzXG4gKiB0aGF0IHNob3VsZCBiZSBzZXQgZnJvbSBhdHRyaWJ1dGVzLCBpdHMgaW5kZXggaXMgc2V0IHRvIG51bGxcbiAqIHRvIGF2b2lkIGEgc3BhcnNlIGFycmF5LlxuICpcbiAqIGUuZy4gW251bGwsIFsncm9sZS1taW4nLCAnbWluaWZpZWQtaW5wdXQnLCAnYnV0dG9uJ11dXG4gKi9cbmV4cG9ydCB0eXBlIEluaXRpYWxJbnB1dERhdGEgPSAoSW5pdGlhbElucHV0cyB8IG51bGwpW107XG5cbi8qKlxuICogVXNlZCBieSBJbml0aWFsSW5wdXREYXRhIHRvIHN0b3JlIGlucHV0IHByb3BlcnRpZXNcbiAqIHRoYXQgc2hvdWxkIGJlIHNldCBvbmNlIGZyb20gYXR0cmlidXRlcy5cbiAqXG4gKiBpKzA6IGF0dHJpYnV0ZSBuYW1lXG4gKiBpKzE6IG1pbmlmaWVkL2ludGVybmFsIGlucHV0IG5hbWVcbiAqIGkrMjogaW5pdGlhbCB2YWx1ZVxuICpcbiAqIGUuZy4gWydyb2xlLW1pbicsICdtaW5pZmllZC1pbnB1dCcsICdidXR0b24nXVxuICovXG5leHBvcnQgdHlwZSBJbml0aWFsSW5wdXRzID0gc3RyaW5nW107XG5cbi8vIE5vdGU6IFRoaXMgaGFjayBpcyBuZWNlc3Nhcnkgc28gd2UgZG9uJ3QgZXJyb25lb3VzbHkgZ2V0IGEgY2lyY3VsYXIgZGVwZW5kZW5jeVxuLy8gZmFpbHVyZSBiYXNlZCBvbiB0eXBlcy5cbmV4cG9ydCBjb25zdCB1bnVzZWRWYWx1ZUV4cG9ydFRvUGxhY2F0ZUFqZCA9IDE7XG5cbi8qKlxuICogVHlwZSByZXByZXNlbnRpbmcgYSBzZXQgb2YgVE5vZGVzIHRoYXQgY2FuIGhhdmUgbG9jYWwgcmVmcyAoYCNmb29gKSBwbGFjZWQgb24gdGhlbS5cbiAqL1xuZXhwb3J0IHR5cGUgVE5vZGVXaXRoTG9jYWxSZWZzID0gVENvbnRhaW5lck5vZGUgfCBURWxlbWVudE5vZGUgfCBURWxlbWVudENvbnRhaW5lck5vZGU7XG5cbi8qKlxuICogVHlwZSBmb3IgYSBmdW5jdGlvbiB0aGF0IGV4dHJhY3RzIGEgdmFsdWUgZm9yIGEgbG9jYWwgcmVmcy5cbiAqIEV4YW1wbGU6XG4gKiAtIGA8ZGl2ICNuYXRpdmVEaXZFbD5gIC0gYG5hdGl2ZURpdkVsYCBzaG91bGQgcG9pbnQgdG8gdGhlIG5hdGl2ZSBgPGRpdj5gIGVsZW1lbnQ7XG4gKiAtIGA8bmctdGVtcGxhdGUgI3RwbFJlZj5gIC0gYHRwbFJlZmAgc2hvdWxkIHBvaW50IHRvIHRoZSBgVGVtcGxhdGVSZWZgIGluc3RhbmNlO1xuICovXG5leHBvcnQgdHlwZSBMb2NhbFJlZkV4dHJhY3RvciA9ICh0Tm9kZTogVE5vZGVXaXRoTG9jYWxSZWZzLCBjdXJyZW50VmlldzogTFZpZXcpID0+IGFueTtcbiJdfQ==