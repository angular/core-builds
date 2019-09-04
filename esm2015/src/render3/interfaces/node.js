/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
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
    /** This bit is set if the node is a host for any directive (including a component) */
    isDirectiveHost: 1,
    /**
     * This bit is set if the node is a host for a component. Setting this bit implies that the
     * isDirectiveHost bit is set as well. */
    isComponentHost: 2,
    /** This bit is set if the node has been projected */
    isProjected: 4,
    /** This bit is set if any directive on this node has content queries */
    hasContentQuery: 8,
    /** This bit is set if the node has any "class" inputs */
    hasClassInput: 16,
    /** This bit is set if the node has any "style" inputs */
    hasStyleInput: 32,
    /** This bit is set if the node has been detached by i18n */
    isDetached: 64,
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
     * Stores indexes of property bindings. This field is only set in the ngDevMode and holds indexes
     * of property bindings so TestBed can get bound property metadata for a given node.
     * @type {?}
     */
    TNode.prototype.propertyBindings;
    /**
     * Stores if Node isComponent, isProjected, hasContentQuery, hasClassInput and hasStyleInput etc.
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
     *   the process is recursive in nature.
     *
     * If `projection` is of type `RNode[][]` than we have a collection of native nodes passed as
     * projectable nodes during dynamic component creation.
     * @type {?}
     */
    TNode.prototype.projection;
    /**
     * A collection of all style bindings and/or static style values for an element.
     *
     * This field will be populated if and when:
     *
     * - There are one or more initial styles on an element (e.g. `<div style="width:200px">`)
     * - There are one or more style bindings on an element (e.g. `<div [style.width]="w">`)
     *
     * If and when there are only initial styles (no bindings) then an instance of `StylingMapArray`
     * will be used here. Otherwise an instance of `TStylingContext` will be created when there
     * are one or more style bindings on an element.
     *
     * During element creation this value is likely to be populated with an instance of
     * `StylingMapArray` and only when the bindings are evaluated (which happens during
     * update mode) then it will be converted to a `TStylingContext` if any style bindings
     * are encountered. If and when this happens then the existing `StylingMapArray` value
     * will be placed into the initial styling slot in the newly created `TStylingContext`.
     * @type {?}
     */
    TNode.prototype.styles;
    /**
     * A collection of all class bindings and/or static class values for an element.
     *
     * This field will be populated if and when:
     *
     * - There are one or more initial classes on an element (e.g. `<div class="one two three">`)
     * - There are one or more class bindings on an element (e.g. `<div [class.foo]="f">`)
     *
     * If and when there are only initial classes (no bindings) then an instance of `StylingMapArray`
     * will be used here. Otherwise an instance of `TStylingContext` will be created when there
     * are one or more class bindings on an element.
     *
     * During element creation this value is likely to be populated with an instance of
     * `StylingMapArray` and only when the bindings are evaluated (which happens during
     * update mode) then it will be converted to a `TStylingContext` if any class bindings
     * are encountered. If and when this happens then the existing `StylingMapArray` value
     * will be placed into the initial styling slot in the newly created `TStylingContext`.
     * @type {?}
     */
    TNode.prototype.classes;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9kZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaW50ZXJmYWNlcy9ub2RlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztJQWlCRTs7T0FFRztJQUNILFlBQWE7SUFDYjs7T0FFRztJQUNILGFBQWM7SUFDZDs7T0FFRztJQUNILE9BQVE7SUFDUjs7T0FFRztJQUNILFVBQVc7SUFDWDs7T0FFRztJQUNILG1CQUFvQjtJQUNwQjs7T0FFRztJQUNILGVBQWdCOzs7OztJQU9oQixzRkFBc0Y7SUFDdEYsa0JBQTRCO0lBRTVCOzs2Q0FFeUM7SUFDekMsa0JBQTRCO0lBRTVCLHFEQUFxRDtJQUNyRCxjQUF3QjtJQUV4Qix3RUFBd0U7SUFDeEUsa0JBQTRCO0lBRTVCLHlEQUF5RDtJQUN6RCxpQkFBMEI7SUFFMUIseURBQXlEO0lBQ3pELGlCQUEwQjtJQUUxQiw0REFBNEQ7SUFDNUQsY0FBdUI7Ozs7O0lBT3ZCLDRGQUE0RjtJQUM1Riw4QkFBNEQ7SUFFNUQ7MEJBQ3NCO0lBQ3RCLDhCQUErQjtJQUMvQixtQ0FBaUU7Ozs7O0lBT2pFOzs7O09BSUc7SUFDSCxlQUFnQjtJQUVoQjs7Ozs7Ozs7Ozs7Ozs7O1FBZUk7SUFDSixVQUFXO0lBRVg7Ozs7Ozs7Ozs7Ozs7Ozs7T0FnQkc7SUFDSCxTQUFVO0lBRVY7Ozs7Ozs7Ozs7Ozs7O09BY0c7SUFDSCxXQUFZO0lBRVo7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7T0FzQkc7SUFDSCxXQUFZO0lBRVo7Ozs7Ozs7Ozs7Ozs7O09BY0c7SUFDSCxZQUFhO0lBRWI7Ozs7Ozs7Ozs7Ozs7T0FhRztJQUNILE9BQVE7Ozs7Ozs7Ozs7Ozs7OztBQXNCViwyQkFnUUM7Ozs7OztJQTlQQyxxQkFBZ0I7Ozs7Ozs7Ozs7SUFVaEIsc0JBQWM7Ozs7Ozs7Ozs7Ozs7OztJQWVkLDhCQUFzQjs7Ozs7SUFLdEIsK0JBQXVCOzs7OztJQUt2Qiw2QkFBcUI7Ozs7OztJQU1yQixpQ0FBZ0M7Ozs7O0lBS2hDLHNCQUFrQjs7Ozs7Ozs7SUFTbEIsZ0NBQXNDOzs7OztJQUd0Qyx3QkFBcUI7Ozs7Ozs7Ozs7Ozs7Ozs7SUFnQnJCLHNCQUF3Qjs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQW1CeEIsMkJBQW1DOzs7OztJQUduQyw4QkFBK0M7Ozs7Ozs7O0lBUS9DLHVCQUF1Qzs7Ozs7Ozs7SUFRdkMsd0JBQXdDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBc0J4Qyx1QkFBMkI7Ozs7OztJQU0zQixxQkFBaUI7Ozs7Ozs7O0lBUWpCLCtCQUEyQjs7Ozs7Ozs7SUFRM0Isc0JBQWtCOzs7Ozs7Ozs7Ozs7Ozs7O0lBZ0JsQix1QkFBeUM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBeUN6QywyQkFBMEM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBb0IxQyx1QkFBNkM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBb0I3Qyx3QkFBOEM7Ozs7OztBQUloRCxrQ0FrQkM7Ozs7OztJQWhCQyw2QkFBYzs7SUFDZCw2QkFBd0Y7Ozs7Ozs7SUFNeEYsOEJBQWdEOztJQUNoRCw4QkFBYTs7Ozs7OztJQU9iLGtDQUFtQzs7Ozs7O0FBSXJDLCtCQVlDOzs7Ozs7SUFWQywwQkFBYzs7SUFDZCwwQkFBWTs7Ozs7OztJQU1aLDJCQUFnRDs7SUFDaEQsMkJBQWE7O0lBQ2IsK0JBQWlCOzs7Ozs7QUFJbkIsb0NBbUJDOzs7Ozs7Ozs7SUFaQywrQkFBYzs7SUFDZCwrQkFBWTs7Ozs7Ozs7SUFRWixnQ0FBZ0Q7O0lBQ2hELGdDQUEyQjs7SUFDM0Isb0NBQWlCOzs7Ozs7QUFJbkIsMkNBT0M7Ozs7OztJQUxDLHNDQUFjOztJQUNkLHNDQUF3Rjs7SUFDeEYsdUNBQWdEOztJQUNoRCx1Q0FBYTs7SUFDYiwyQ0FBaUI7Ozs7OztBQUluQix1Q0FZQzs7Ozs7O0lBVkMsa0NBQWM7O0lBQ2Qsa0NBQW1DOztJQUNuQyxtQ0FBZ0Q7O0lBQ2hELG1DQUFhOztJQUNiLHVDQUFpQjs7Ozs7O0lBS2pCLDRDQUE2Qjs7Ozs7O0FBSS9CLCtCQU9DOzs7Ozs7SUFMQywwQkFBYzs7SUFDZCwwQkFBd0Y7O0lBQ3hGLDJCQUE0Qjs7SUFDNUIsMkJBQWE7O0lBQ2IsK0JBQWlCOzs7Ozs7QUFJbkIscUNBYUM7Ozs7OztJQVhDLGdDQUFZOzs7Ozs7O0lBTVosaUNBQWdEOztJQUNoRCxpQ0FBYTs7Ozs7SUFHYixxQ0FBbUI7Ozs7O0FBK0RyQixNQUFNLE9BQU8sNkJBQTZCLEdBQUcsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCB7U3R5bGluZ01hcEFycmF5LCBUU3R5bGluZ0NvbnRleHR9IGZyb20gJy4uL3N0eWxpbmdfbmV4dC9pbnRlcmZhY2VzJztcbmltcG9ydCB7Q3NzU2VsZWN0b3J9IGZyb20gJy4vcHJvamVjdGlvbic7XG5pbXBvcnQge1JOb2RlfSBmcm9tICcuL3JlbmRlcmVyJztcbmltcG9ydCB7TFZpZXcsIFRWaWV3fSBmcm9tICcuL3ZpZXcnO1xuXG5cbi8qKlxuICogVE5vZGVUeXBlIGNvcnJlc3BvbmRzIHRvIHRoZSB7QGxpbmsgVE5vZGV9IGB0eXBlYCBwcm9wZXJ0eS5cbiAqL1xuZXhwb3J0IGNvbnN0IGVudW0gVE5vZGVUeXBlIHtcbiAgLyoqXG4gICAqIFRoZSBUTm9kZSBjb250YWlucyBpbmZvcm1hdGlvbiBhYm91dCBhbiB7QGxpbmsgTENvbnRhaW5lcn0gZm9yIGVtYmVkZGVkIHZpZXdzLlxuICAgKi9cbiAgQ29udGFpbmVyID0gMCxcbiAgLyoqXG4gICAqIFRoZSBUTm9kZSBjb250YWlucyBpbmZvcm1hdGlvbiBhYm91dCBhbiBgPG5nLWNvbnRlbnQ+YCBwcm9qZWN0aW9uXG4gICAqL1xuICBQcm9qZWN0aW9uID0gMSxcbiAgLyoqXG4gICAqIFRoZSBUTm9kZSBjb250YWlucyBpbmZvcm1hdGlvbiBhYm91dCBhbiB7QGxpbmsgTFZpZXd9XG4gICAqL1xuICBWaWV3ID0gMixcbiAgLyoqXG4gICAqIFRoZSBUTm9kZSBjb250YWlucyBpbmZvcm1hdGlvbiBhYm91dCBhIERPTSBlbGVtZW50IGFrYSB7QGxpbmsgUk5vZGV9LlxuICAgKi9cbiAgRWxlbWVudCA9IDMsXG4gIC8qKlxuICAgKiBUaGUgVE5vZGUgY29udGFpbnMgaW5mb3JtYXRpb24gYWJvdXQgYW4gYDxuZy1jb250YWluZXI+YCBlbGVtZW50IHtAbGluayBSTm9kZX0uXG4gICAqL1xuICBFbGVtZW50Q29udGFpbmVyID0gNCxcbiAgLyoqXG4gICAqIFRoZSBUTm9kZSBjb250YWlucyBpbmZvcm1hdGlvbiBhYm91dCBhbiBJQ1UgY29tbWVudCB1c2VkIGluIGBpMThuYC5cbiAgICovXG4gIEljdUNvbnRhaW5lciA9IDUsXG59XG5cbi8qKlxuICogQ29ycmVzcG9uZHMgdG8gdGhlIFROb2RlLmZsYWdzIHByb3BlcnR5LlxuICovXG5leHBvcnQgY29uc3QgZW51bSBUTm9kZUZsYWdzIHtcbiAgLyoqIFRoaXMgYml0IGlzIHNldCBpZiB0aGUgbm9kZSBpcyBhIGhvc3QgZm9yIGFueSBkaXJlY3RpdmUgKGluY2x1ZGluZyBhIGNvbXBvbmVudCkgKi9cbiAgaXNEaXJlY3RpdmVIb3N0ID0gMGIwMDAwMDAwMSxcblxuICAvKipcbiAgICogVGhpcyBiaXQgaXMgc2V0IGlmIHRoZSBub2RlIGlzIGEgaG9zdCBmb3IgYSBjb21wb25lbnQuIFNldHRpbmcgdGhpcyBiaXQgaW1wbGllcyB0aGF0IHRoZVxuICAgKiBpc0RpcmVjdGl2ZUhvc3QgYml0IGlzIHNldCBhcyB3ZWxsLiAqL1xuICBpc0NvbXBvbmVudEhvc3QgPSAwYjAwMDAwMDEwLFxuXG4gIC8qKiBUaGlzIGJpdCBpcyBzZXQgaWYgdGhlIG5vZGUgaGFzIGJlZW4gcHJvamVjdGVkICovXG4gIGlzUHJvamVjdGVkID0gMGIwMDAwMDEwMCxcblxuICAvKiogVGhpcyBiaXQgaXMgc2V0IGlmIGFueSBkaXJlY3RpdmUgb24gdGhpcyBub2RlIGhhcyBjb250ZW50IHF1ZXJpZXMgKi9cbiAgaGFzQ29udGVudFF1ZXJ5ID0gMGIwMDAwMTAwMCxcblxuICAvKiogVGhpcyBiaXQgaXMgc2V0IGlmIHRoZSBub2RlIGhhcyBhbnkgXCJjbGFzc1wiIGlucHV0cyAqL1xuICBoYXNDbGFzc0lucHV0ID0gMGIwMDAxMDAwMCxcblxuICAvKiogVGhpcyBiaXQgaXMgc2V0IGlmIHRoZSBub2RlIGhhcyBhbnkgXCJzdHlsZVwiIGlucHV0cyAqL1xuICBoYXNTdHlsZUlucHV0ID0gMGIwMDEwMDAwMCxcblxuICAvKiogVGhpcyBiaXQgaXMgc2V0IGlmIHRoZSBub2RlIGhhcyBiZWVuIGRldGFjaGVkIGJ5IGkxOG4gKi9cbiAgaXNEZXRhY2hlZCA9IDBiMDEwMDAwMDAsXG59XG5cbi8qKlxuICogQ29ycmVzcG9uZHMgdG8gdGhlIFROb2RlLnByb3ZpZGVySW5kZXhlcyBwcm9wZXJ0eS5cbiAqL1xuZXhwb3J0IGNvbnN0IGVudW0gVE5vZGVQcm92aWRlckluZGV4ZXMge1xuICAvKiogVGhlIGluZGV4IG9mIHRoZSBmaXJzdCBwcm92aWRlciBvbiB0aGlzIG5vZGUgaXMgZW5jb2RlZCBvbiB0aGUgbGVhc3Qgc2lnbmlmaWNhbnQgYml0cyAqL1xuICBQcm92aWRlcnNTdGFydEluZGV4TWFzayA9IDBiMDAwMDAwMDAwMDAwMDAwMDExMTExMTExMTExMTExMTEsXG5cbiAgLyoqIFRoZSBjb3VudCBvZiB2aWV3IHByb3ZpZGVycyBmcm9tIHRoZSBjb21wb25lbnQgb24gdGhpcyBub2RlIGlzIGVuY29kZWQgb24gdGhlIDE2IG1vc3RcbiAgICAgc2lnbmlmaWNhbnQgYml0cyAqL1xuICBDcHRWaWV3UHJvdmlkZXJzQ291bnRTaGlmdCA9IDE2LFxuICBDcHRWaWV3UHJvdmlkZXJzQ291bnRTaGlmdGVyID0gMGIwMDAwMDAwMDAwMDAwMDAxMDAwMDAwMDAwMDAwMDAwMCxcbn1cbi8qKlxuICogQSBzZXQgb2YgbWFya2VyIHZhbHVlcyB0byBiZSB1c2VkIGluIHRoZSBhdHRyaWJ1dGVzIGFycmF5cy4gVGhlc2UgbWFya2VycyBpbmRpY2F0ZSB0aGF0IHNvbWVcbiAqIGl0ZW1zIGFyZSBub3QgcmVndWxhciBhdHRyaWJ1dGVzIGFuZCB0aGUgcHJvY2Vzc2luZyBzaG91bGQgYmUgYWRhcHRlZCBhY2NvcmRpbmdseS5cbiAqL1xuZXhwb3J0IGNvbnN0IGVudW0gQXR0cmlidXRlTWFya2VyIHtcbiAgLyoqXG4gICAqIE1hcmtlciBpbmRpY2F0ZXMgdGhhdCB0aGUgZm9sbG93aW5nIDMgdmFsdWVzIGluIHRoZSBhdHRyaWJ1dGVzIGFycmF5IGFyZTpcbiAgICogbmFtZXNwYWNlVXJpLCBhdHRyaWJ1dGVOYW1lLCBhdHRyaWJ1dGVWYWx1ZVxuICAgKiBpbiB0aGF0IG9yZGVyLlxuICAgKi9cbiAgTmFtZXNwYWNlVVJJID0gMCxcblxuICAvKipcbiAgICAqIFNpZ25hbHMgY2xhc3MgZGVjbGFyYXRpb24uXG4gICAgKlxuICAgICogRWFjaCB2YWx1ZSBmb2xsb3dpbmcgYENsYXNzZXNgIGRlc2lnbmF0ZXMgYSBjbGFzcyBuYW1lIHRvIGluY2x1ZGUgb24gdGhlIGVsZW1lbnQuXG4gICAgKiAjIyBFeGFtcGxlOlxuICAgICpcbiAgICAqIEdpdmVuOlxuICAgICogYGBgXG4gICAgKiA8ZGl2IGNsYXNzPVwiZm9vIGJhciBiYXpcIj4uLi48ZC92aT5cbiAgICAqIGBgYFxuICAgICpcbiAgICAqIHRoZSBnZW5lcmF0ZWQgY29kZSBpczpcbiAgICAqIGBgYFxuICAgICogdmFyIF9jMSA9IFtBdHRyaWJ1dGVNYXJrZXIuQ2xhc3NlcywgJ2ZvbycsICdiYXInLCAnYmF6J107XG4gICAgKiBgYGBcbiAgICAqL1xuICBDbGFzc2VzID0gMSxcblxuICAvKipcbiAgICogU2lnbmFscyBzdHlsZSBkZWNsYXJhdGlvbi5cbiAgICpcbiAgICogRWFjaCBwYWlyIG9mIHZhbHVlcyBmb2xsb3dpbmcgYFN0eWxlc2AgZGVzaWduYXRlcyBhIHN0eWxlIG5hbWUgYW5kIHZhbHVlIHRvIGluY2x1ZGUgb24gdGhlXG4gICAqIGVsZW1lbnQuXG4gICAqICMjIEV4YW1wbGU6XG4gICAqXG4gICAqIEdpdmVuOlxuICAgKiBgYGBcbiAgICogPGRpdiBzdHlsZT1cIndpZHRoOjEwMHB4OyBoZWlnaHQ6MjAwcHg7IGNvbG9yOnJlZFwiPi4uLjwvZGl2PlxuICAgKiBgYGBcbiAgICpcbiAgICogdGhlIGdlbmVyYXRlZCBjb2RlIGlzOlxuICAgKiBgYGBcbiAgICogdmFyIF9jMSA9IFtBdHRyaWJ1dGVNYXJrZXIuU3R5bGVzLCAnd2lkdGgnLCAnMTAwcHgnLCAnaGVpZ2h0Jy4gJzIwMHB4JywgJ2NvbG9yJywgJ3JlZCddO1xuICAgKiBgYGBcbiAgICovXG4gIFN0eWxlcyA9IDIsXG5cbiAgLyoqXG4gICAqIFNpZ25hbHMgdGhhdCB0aGUgZm9sbG93aW5nIGF0dHJpYnV0ZSBuYW1lcyB3ZXJlIGV4dHJhY3RlZCBmcm9tIGlucHV0IG9yIG91dHB1dCBiaW5kaW5ncy5cbiAgICpcbiAgICogRm9yIGV4YW1wbGUsIGdpdmVuIHRoZSBmb2xsb3dpbmcgSFRNTDpcbiAgICpcbiAgICogYGBgXG4gICAqIDxkaXYgbW9vPVwiY2FyXCIgW2Zvb109XCJleHBcIiAoYmFyKT1cImRvU3RoKClcIj5cbiAgICogYGBgXG4gICAqXG4gICAqIHRoZSBnZW5lcmF0ZWQgY29kZSBpczpcbiAgICpcbiAgICogYGBgXG4gICAqIHZhciBfYzEgPSBbJ21vbycsICdjYXInLCBBdHRyaWJ1dGVNYXJrZXIuQmluZGluZ3MsICdmb28nLCAnYmFyJ107XG4gICAqIGBgYFxuICAgKi9cbiAgQmluZGluZ3MgPSAzLFxuXG4gIC8qKlxuICAgKiBTaWduYWxzIHRoYXQgdGhlIGZvbGxvd2luZyBhdHRyaWJ1dGUgbmFtZXMgd2VyZSBob2lzdGVkIGZyb20gYW4gaW5saW5lLXRlbXBsYXRlIGRlY2xhcmF0aW9uLlxuICAgKlxuICAgKiBGb3IgZXhhbXBsZSwgZ2l2ZW4gdGhlIGZvbGxvd2luZyBIVE1MOlxuICAgKlxuICAgKiBgYGBcbiAgICogPGRpdiAqbmdGb3I9XCJsZXQgdmFsdWUgb2YgdmFsdWVzOyB0cmFja0J5OnRyYWNrQnlcIiBkaXJBIFtkaXJCXT1cInZhbHVlXCI+XG4gICAqIGBgYFxuICAgKlxuICAgKiB0aGUgZ2VuZXJhdGVkIGNvZGUgZm9yIHRoZSBgdGVtcGxhdGUoKWAgaW5zdHJ1Y3Rpb24gd291bGQgaW5jbHVkZTpcbiAgICpcbiAgICogYGBgXG4gICAqIFsnZGlyQScsICcnLCBBdHRyaWJ1dGVNYXJrZXIuQmluZGluZ3MsICdkaXJCJywgQXR0cmlidXRlTWFya2VyLlRlbXBsYXRlLCAnbmdGb3InLCAnbmdGb3JPZicsXG4gICAqICduZ0ZvclRyYWNrQnknLCAnbGV0LXZhbHVlJ11cbiAgICogYGBgXG4gICAqXG4gICAqIHdoaWxlIHRoZSBnZW5lcmF0ZWQgY29kZSBmb3IgdGhlIGBlbGVtZW50KClgIGluc3RydWN0aW9uIGluc2lkZSB0aGUgdGVtcGxhdGUgZnVuY3Rpb24gd291bGRcbiAgICogaW5jbHVkZTpcbiAgICpcbiAgICogYGBgXG4gICAqIFsnZGlyQScsICcnLCBBdHRyaWJ1dGVNYXJrZXIuQmluZGluZ3MsICdkaXJCJ11cbiAgICogYGBgXG4gICAqL1xuICBUZW1wbGF0ZSA9IDQsXG5cbiAgLyoqXG4gICAqIFNpZ25hbHMgdGhhdCB0aGUgZm9sbG93aW5nIGF0dHJpYnV0ZSBpcyBgbmdQcm9qZWN0QXNgIGFuZCBpdHMgdmFsdWUgaXMgYSBwYXJzZWQgYENzc1NlbGVjdG9yYC5cbiAgICpcbiAgICogRm9yIGV4YW1wbGUsIGdpdmVuIHRoZSBmb2xsb3dpbmcgSFRNTDpcbiAgICpcbiAgICogYGBgXG4gICAqIDxoMSBhdHRyPVwidmFsdWVcIiBuZ1Byb2plY3RBcz1cIlt0aXRsZV1cIj5cbiAgICogYGBgXG4gICAqXG4gICAqIHRoZSBnZW5lcmF0ZWQgY29kZSBmb3IgdGhlIGBlbGVtZW50KClgIGluc3RydWN0aW9uIHdvdWxkIGluY2x1ZGU6XG4gICAqXG4gICAqIGBgYFxuICAgKiBbJ2F0dHInLCAndmFsdWUnLCBBdHRyaWJ1dGVNYXJrZXIuUHJvamVjdEFzLCBbJycsICd0aXRsZScsICcnXV1cbiAgICogYGBgXG4gICAqL1xuICBQcm9qZWN0QXMgPSA1LFxuXG4gIC8qKlxuICAgKiBTaWduYWxzIHRoYXQgdGhlIGZvbGxvd2luZyBhdHRyaWJ1dGUgd2lsbCBiZSB0cmFuc2xhdGVkIGJ5IHJ1bnRpbWUgaTE4blxuICAgKlxuICAgKiBGb3IgZXhhbXBsZSwgZ2l2ZW4gdGhlIGZvbGxvd2luZyBIVE1MOlxuICAgKlxuICAgKiBgYGBcbiAgICogPGRpdiBtb289XCJjYXJcIiBmb289XCJ2YWx1ZVwiIGkxOG4tZm9vIFtiYXJdPVwiYmluZGluZ1wiIGkxOG4tYmFyPlxuICAgKiBgYGBcbiAgICpcbiAgICogdGhlIGdlbmVyYXRlZCBjb2RlIGlzOlxuICAgKlxuICAgKiBgYGBcbiAgICogdmFyIF9jMSA9IFsnbW9vJywgJ2NhcicsIEF0dHJpYnV0ZU1hcmtlci5JMThuLCAnZm9vJywgJ2JhciddO1xuICAgKi9cbiAgSTE4biA9IDYsXG59XG5cbi8qKlxuICogQSBjb21iaW5hdGlvbiBvZjpcbiAqIC0gQXR0cmlidXRlIG5hbWVzIGFuZCB2YWx1ZXMuXG4gKiAtIFNwZWNpYWwgbWFya2VycyBhY3RpbmcgYXMgZmxhZ3MgdG8gYWx0ZXIgYXR0cmlidXRlcyBwcm9jZXNzaW5nLlxuICogLSBQYXJzZWQgbmdQcm9qZWN0QXMgc2VsZWN0b3JzLlxuICovXG5leHBvcnQgdHlwZSBUQXR0cmlidXRlcyA9IChzdHJpbmcgfCBBdHRyaWJ1dGVNYXJrZXIgfCBDc3NTZWxlY3RvcilbXTtcblxuLyoqXG4gKiBCaW5kaW5nIGRhdGEgKGZseXdlaWdodCkgZm9yIGEgcGFydGljdWxhciBub2RlIHRoYXQgaXMgc2hhcmVkIGJldHdlZW4gYWxsIHRlbXBsYXRlc1xuICogb2YgYSBzcGVjaWZpYyB0eXBlLlxuICpcbiAqIElmIGEgcHJvcGVydHkgaXM6XG4gKiAgICAtIFByb3BlcnR5QWxpYXNlczogdGhhdCBwcm9wZXJ0eSdzIGRhdGEgd2FzIGdlbmVyYXRlZCBhbmQgdGhpcyBpcyBpdFxuICogICAgLSBOdWxsOiB0aGF0IHByb3BlcnR5J3MgZGF0YSB3YXMgYWxyZWFkeSBnZW5lcmF0ZWQgYW5kIG5vdGhpbmcgd2FzIGZvdW5kLlxuICogICAgLSBVbmRlZmluZWQ6IHRoYXQgcHJvcGVydHkncyBkYXRhIGhhcyBub3QgeWV0IGJlZW4gZ2VuZXJhdGVkXG4gKlxuICogc2VlOiBodHRwczovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9GbHl3ZWlnaHRfcGF0dGVybiBmb3IgbW9yZSBvbiB0aGUgRmx5d2VpZ2h0IHBhdHRlcm5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBUTm9kZSB7XG4gIC8qKiBUaGUgdHlwZSBvZiB0aGUgVE5vZGUuIFNlZSBUTm9kZVR5cGUuICovXG4gIHR5cGU6IFROb2RlVHlwZTtcblxuICAvKipcbiAgICogSW5kZXggb2YgdGhlIFROb2RlIGluIFRWaWV3LmRhdGEgYW5kIGNvcnJlc3BvbmRpbmcgbmF0aXZlIGVsZW1lbnQgaW4gTFZpZXcuXG4gICAqXG4gICAqIFRoaXMgaXMgbmVjZXNzYXJ5IHRvIGdldCBmcm9tIGFueSBUTm9kZSB0byBpdHMgY29ycmVzcG9uZGluZyBuYXRpdmUgZWxlbWVudCB3aGVuXG4gICAqIHRyYXZlcnNpbmcgdGhlIG5vZGUgdHJlZS5cbiAgICpcbiAgICogSWYgaW5kZXggaXMgLTEsIHRoaXMgaXMgYSBkeW5hbWljYWxseSBjcmVhdGVkIGNvbnRhaW5lciBub2RlIG9yIGVtYmVkZGVkIHZpZXcgbm9kZS5cbiAgICovXG4gIGluZGV4OiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIFRoZSBpbmRleCBvZiB0aGUgY2xvc2VzdCBpbmplY3RvciBpbiB0aGlzIG5vZGUncyBMVmlldy5cbiAgICpcbiAgICogSWYgdGhlIGluZGV4ID09PSAtMSwgdGhlcmUgaXMgbm8gaW5qZWN0b3Igb24gdGhpcyBub2RlIG9yIGFueSBhbmNlc3RvciBub2RlIGluIHRoaXMgdmlldy5cbiAgICpcbiAgICogSWYgdGhlIGluZGV4ICE9PSAtMSwgaXQgaXMgdGhlIGluZGV4IG9mIHRoaXMgbm9kZSdzIGluamVjdG9yIE9SIHRoZSBpbmRleCBvZiBhIHBhcmVudCBpbmplY3RvclxuICAgKiBpbiB0aGUgc2FtZSB2aWV3LiBXZSBwYXNzIHRoZSBwYXJlbnQgaW5qZWN0b3IgaW5kZXggZG93biB0aGUgbm9kZSB0cmVlIG9mIGEgdmlldyBzbyBpdCdzXG4gICAqIHBvc3NpYmxlIHRvIGZpbmQgdGhlIHBhcmVudCBpbmplY3RvciB3aXRob3V0IHdhbGtpbmcgYSBwb3RlbnRpYWxseSBkZWVwIG5vZGUgdHJlZS4gSW5qZWN0b3JcbiAgICogaW5kaWNlcyBhcmUgbm90IHNldCBhY3Jvc3MgdmlldyBib3VuZGFyaWVzIGJlY2F1c2UgdGhlcmUgY291bGQgYmUgbXVsdGlwbGUgY29tcG9uZW50IGhvc3RzLlxuICAgKlxuICAgKiBJZiB0Tm9kZS5pbmplY3RvckluZGV4ID09PSB0Tm9kZS5wYXJlbnQuaW5qZWN0b3JJbmRleCwgdGhlbiB0aGUgaW5kZXggYmVsb25ncyB0byBhIHBhcmVudFxuICAgKiBpbmplY3Rvci5cbiAgICovXG4gIGluamVjdG9ySW5kZXg6IG51bWJlcjtcblxuICAvKipcbiAgICogU3RvcmVzIHN0YXJ0aW5nIGluZGV4IG9mIHRoZSBkaXJlY3RpdmVzLlxuICAgKi9cbiAgZGlyZWN0aXZlU3RhcnQ6IG51bWJlcjtcblxuICAvKipcbiAgICogU3RvcmVzIGZpbmFsIGV4Y2x1c2l2ZSBpbmRleCBvZiB0aGUgZGlyZWN0aXZlcy5cbiAgICovXG4gIGRpcmVjdGl2ZUVuZDogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBTdG9yZXMgaW5kZXhlcyBvZiBwcm9wZXJ0eSBiaW5kaW5ncy4gVGhpcyBmaWVsZCBpcyBvbmx5IHNldCBpbiB0aGUgbmdEZXZNb2RlIGFuZCBob2xkcyBpbmRleGVzXG4gICAqIG9mIHByb3BlcnR5IGJpbmRpbmdzIHNvIFRlc3RCZWQgY2FuIGdldCBib3VuZCBwcm9wZXJ0eSBtZXRhZGF0YSBmb3IgYSBnaXZlbiBub2RlLlxuICAgKi9cbiAgcHJvcGVydHlCaW5kaW5nczogbnVtYmVyW118bnVsbDtcblxuICAvKipcbiAgICogU3RvcmVzIGlmIE5vZGUgaXNDb21wb25lbnQsIGlzUHJvamVjdGVkLCBoYXNDb250ZW50UXVlcnksIGhhc0NsYXNzSW5wdXQgYW5kIGhhc1N0eWxlSW5wdXQgZXRjLlxuICAgKi9cbiAgZmxhZ3M6IFROb2RlRmxhZ3M7XG5cbiAgLyoqXG4gICAqIFRoaXMgbnVtYmVyIHN0b3JlcyB0d28gdmFsdWVzIHVzaW5nIGl0cyBiaXRzOlxuICAgKlxuICAgKiAtIHRoZSBpbmRleCBvZiB0aGUgZmlyc3QgcHJvdmlkZXIgb24gdGhhdCBub2RlIChmaXJzdCAxNiBiaXRzKVxuICAgKiAtIHRoZSBjb3VudCBvZiB2aWV3IHByb3ZpZGVycyBmcm9tIHRoZSBjb21wb25lbnQgb24gdGhpcyBub2RlIChsYXN0IDE2IGJpdHMpXG4gICAqL1xuICAvLyBUT0RPKG1pc2tvKTogYnJlYWsgdGhpcyBpbnRvIGFjdHVhbCB2YXJzLlxuICBwcm92aWRlckluZGV4ZXM6IFROb2RlUHJvdmlkZXJJbmRleGVzO1xuXG4gIC8qKiBUaGUgdGFnIG5hbWUgYXNzb2NpYXRlZCB3aXRoIHRoaXMgbm9kZS4gKi9cbiAgdGFnTmFtZTogc3RyaW5nfG51bGw7XG5cbiAgLyoqXG4gICAqIEF0dHJpYnV0ZXMgYXNzb2NpYXRlZCB3aXRoIGFuIGVsZW1lbnQuIFdlIG5lZWQgdG8gc3RvcmUgYXR0cmlidXRlcyB0byBzdXBwb3J0IHZhcmlvdXMgdXNlLWNhc2VzXG4gICAqIChhdHRyaWJ1dGUgaW5qZWN0aW9uLCBjb250ZW50IHByb2plY3Rpb24gd2l0aCBzZWxlY3RvcnMsIGRpcmVjdGl2ZXMgbWF0Y2hpbmcpLlxuICAgKiBBdHRyaWJ1dGVzIGFyZSBzdG9yZWQgc3RhdGljYWxseSBiZWNhdXNlIHJlYWRpbmcgdGhlbSBmcm9tIHRoZSBET00gd291bGQgYmUgd2F5IHRvbyBzbG93IGZvclxuICAgKiBjb250ZW50IHByb2plY3Rpb24gYW5kIHF1ZXJpZXMuXG4gICAqXG4gICAqIFNpbmNlIGF0dHJzIHdpbGwgYWx3YXlzIGJlIGNhbGN1bGF0ZWQgZmlyc3QsIHRoZXkgd2lsbCBuZXZlciBuZWVkIHRvIGJlIG1hcmtlZCB1bmRlZmluZWQgYnlcbiAgICogb3RoZXIgaW5zdHJ1Y3Rpb25zLlxuICAgKlxuICAgKiBGb3IgcmVndWxhciBhdHRyaWJ1dGVzIGEgbmFtZSBvZiBhbiBhdHRyaWJ1dGUgYW5kIGl0cyB2YWx1ZSBhbHRlcm5hdGUgaW4gdGhlIGFycmF5LlxuICAgKiBlLmcuIFsncm9sZScsICdjaGVja2JveCddXG4gICAqIFRoaXMgYXJyYXkgY2FuIGNvbnRhaW4gZmxhZ3MgdGhhdCB3aWxsIGluZGljYXRlIFwic3BlY2lhbCBhdHRyaWJ1dGVzXCIgKGF0dHJpYnV0ZXMgd2l0aFxuICAgKiBuYW1lc3BhY2VzLCBhdHRyaWJ1dGVzIGV4dHJhY3RlZCBmcm9tIGJpbmRpbmdzIGFuZCBvdXRwdXRzKS5cbiAgICovXG4gIGF0dHJzOiBUQXR0cmlidXRlc3xudWxsO1xuXG4gIC8qKlxuICAgKiBBIHNldCBvZiBsb2NhbCBuYW1lcyB1bmRlciB3aGljaCBhIGdpdmVuIGVsZW1lbnQgaXMgZXhwb3J0ZWQgaW4gYSB0ZW1wbGF0ZSBhbmRcbiAgICogdmlzaWJsZSB0byBxdWVyaWVzLiBBbiBlbnRyeSBpbiB0aGlzIGFycmF5IGNhbiBiZSBjcmVhdGVkIGZvciBkaWZmZXJlbnQgcmVhc29uczpcbiAgICogLSBhbiBlbGVtZW50IGl0c2VsZiBpcyByZWZlcmVuY2VkLCBleC46IGA8ZGl2ICNmb28+YFxuICAgKiAtIGEgY29tcG9uZW50IGlzIHJlZmVyZW5jZWQsIGV4LjogYDxteS1jbXB0ICNmb28+YFxuICAgKiAtIGEgZGlyZWN0aXZlIGlzIHJlZmVyZW5jZWQsIGV4LjogYDxteS1jbXB0ICNmb289XCJkaXJlY3RpdmVFeHBvcnRBc1wiPmAuXG4gICAqXG4gICAqIEEgZ2l2ZW4gZWxlbWVudCBtaWdodCBoYXZlIGRpZmZlcmVudCBsb2NhbCBuYW1lcyBhbmQgdGhvc2UgbmFtZXMgY2FuIGJlIGFzc29jaWF0ZWRcbiAgICogd2l0aCBhIGRpcmVjdGl2ZS4gV2Ugc3RvcmUgbG9jYWwgbmFtZXMgYXQgZXZlbiBpbmRleGVzIHdoaWxlIG9kZCBpbmRleGVzIGFyZSByZXNlcnZlZFxuICAgKiBmb3IgZGlyZWN0aXZlIGluZGV4IGluIGEgdmlldyAob3IgYC0xYCBpZiB0aGVyZSBpcyBubyBhc3NvY2lhdGVkIGRpcmVjdGl2ZSkuXG4gICAqXG4gICAqIFNvbWUgZXhhbXBsZXM6XG4gICAqIC0gYDxkaXYgI2Zvbz5gID0+IGBbXCJmb29cIiwgLTFdYFxuICAgKiAtIGA8bXktY21wdCAjZm9vPmAgPT4gYFtcImZvb1wiLCBteUNtcHRJZHhdYFxuICAgKiAtIGA8bXktY21wdCAjZm9vICNiYXI9XCJkaXJlY3RpdmVFeHBvcnRBc1wiPmAgPT4gYFtcImZvb1wiLCBteUNtcHRJZHgsIFwiYmFyXCIsIGRpcmVjdGl2ZUlkeF1gXG4gICAqIC0gYDxkaXYgI2ZvbyAjYmFyPVwiZGlyZWN0aXZlRXhwb3J0QXNcIj5gID0+IGBbXCJmb29cIiwgLTEsIFwiYmFyXCIsIGRpcmVjdGl2ZUlkeF1gXG4gICAqL1xuICBsb2NhbE5hbWVzOiAoc3RyaW5nfG51bWJlcilbXXxudWxsO1xuXG4gIC8qKiBJbmZvcm1hdGlvbiBhYm91dCBpbnB1dCBwcm9wZXJ0aWVzIHRoYXQgbmVlZCB0byBiZSBzZXQgb25jZSBmcm9tIGF0dHJpYnV0ZSBkYXRhLiAqL1xuICBpbml0aWFsSW5wdXRzOiBJbml0aWFsSW5wdXREYXRhfG51bGx8dW5kZWZpbmVkO1xuXG4gIC8qKlxuICAgKiBJbnB1dCBkYXRhIGZvciBhbGwgZGlyZWN0aXZlcyBvbiB0aGlzIG5vZGUuXG4gICAqXG4gICAqIC0gYHVuZGVmaW5lZGAgbWVhbnMgdGhhdCB0aGUgcHJvcCBoYXMgbm90IGJlZW4gaW5pdGlhbGl6ZWQgeWV0LFxuICAgKiAtIGBudWxsYCBtZWFucyB0aGF0IHRoZSBwcm9wIGhhcyBiZWVuIGluaXRpYWxpemVkIGJ1dCBubyBpbnB1dHMgaGF2ZSBiZWVuIGZvdW5kLlxuICAgKi9cbiAgaW5wdXRzOiBQcm9wZXJ0eUFsaWFzZXN8bnVsbHx1bmRlZmluZWQ7XG5cbiAgLyoqXG4gICAqIE91dHB1dCBkYXRhIGZvciBhbGwgZGlyZWN0aXZlcyBvbiB0aGlzIG5vZGUuXG4gICAqXG4gICAqIC0gYHVuZGVmaW5lZGAgbWVhbnMgdGhhdCB0aGUgcHJvcCBoYXMgbm90IGJlZW4gaW5pdGlhbGl6ZWQgeWV0LFxuICAgKiAtIGBudWxsYCBtZWFucyB0aGF0IHRoZSBwcm9wIGhhcyBiZWVuIGluaXRpYWxpemVkIGJ1dCBubyBvdXRwdXRzIGhhdmUgYmVlbiBmb3VuZC5cbiAgICovXG4gIG91dHB1dHM6IFByb3BlcnR5QWxpYXNlc3xudWxsfHVuZGVmaW5lZDtcblxuICAvKipcbiAgICogVGhlIFRWaWV3IG9yIFRWaWV3cyBhdHRhY2hlZCB0byB0aGlzIG5vZGUuXG4gICAqXG4gICAqIElmIHRoaXMgVE5vZGUgY29ycmVzcG9uZHMgdG8gYW4gTENvbnRhaW5lciB3aXRoIGlubGluZSB2aWV3cywgdGhlIGNvbnRhaW5lciB3aWxsXG4gICAqIG5lZWQgdG8gc3RvcmUgc2VwYXJhdGUgc3RhdGljIGRhdGEgZm9yIGVhY2ggb2YgaXRzIHZpZXcgYmxvY2tzIChUVmlld1tdKS4gT3RoZXJ3aXNlLFxuICAgKiBub2RlcyBpbiBpbmxpbmUgdmlld3Mgd2l0aCB0aGUgc2FtZSBpbmRleCBhcyBub2RlcyBpbiB0aGVpciBwYXJlbnQgdmlld3Mgd2lsbCBvdmVyd3JpdGVcbiAgICogZWFjaCBvdGhlciwgYXMgdGhleSBhcmUgaW4gdGhlIHNhbWUgdGVtcGxhdGUuXG4gICAqXG4gICAqIEVhY2ggaW5kZXggaW4gdGhpcyBhcnJheSBjb3JyZXNwb25kcyB0byB0aGUgc3RhdGljIGRhdGEgZm9yIGEgY2VydGFpblxuICAgKiB2aWV3LiBTbyBpZiB5b3UgaGFkIFYoMCkgYW5kIFYoMSkgaW4gYSBjb250YWluZXIsIHlvdSBtaWdodCBoYXZlOlxuICAgKlxuICAgKiBbXG4gICAqICAgW3t0YWdOYW1lOiAnZGl2JywgYXR0cnM6IC4uLn0sIG51bGxdLCAgICAgLy8gVigwKSBUVmlld1xuICAgKiAgIFt7dGFnTmFtZTogJ2J1dHRvbicsIGF0dHJzIC4uLn0sIG51bGxdICAgIC8vIFYoMSkgVFZpZXdcbiAgICpcbiAgICogSWYgdGhpcyBUTm9kZSBjb3JyZXNwb25kcyB0byBhbiBMQ29udGFpbmVyIHdpdGggYSB0ZW1wbGF0ZSAoZS5nLiBzdHJ1Y3R1cmFsXG4gICAqIGRpcmVjdGl2ZSksIHRoZSB0ZW1wbGF0ZSdzIFRWaWV3IHdpbGwgYmUgc3RvcmVkIGhlcmUuXG4gICAqXG4gICAqIElmIHRoaXMgVE5vZGUgY29ycmVzcG9uZHMgdG8gYW4gZWxlbWVudCwgdFZpZXdzIHdpbGwgYmUgbnVsbCAuXG4gICAqL1xuICB0Vmlld3M6IFRWaWV3fFRWaWV3W118bnVsbDtcblxuICAvKipcbiAgICogVGhlIG5leHQgc2libGluZyBub2RlLiBOZWNlc3Nhcnkgc28gd2UgY2FuIHByb3BhZ2F0ZSB0aHJvdWdoIHRoZSByb290IG5vZGVzIG9mIGEgdmlld1xuICAgKiB0byBpbnNlcnQgdGhlbSBvciByZW1vdmUgdGhlbSBmcm9tIHRoZSBET00uXG4gICAqL1xuICBuZXh0OiBUTm9kZXxudWxsO1xuXG4gIC8qKlxuICAgKiBUaGUgbmV4dCBwcm9qZWN0ZWQgc2libGluZy4gU2luY2UgaW4gQW5ndWxhciBjb250ZW50IHByb2plY3Rpb24gd29ya3Mgb24gdGhlIG5vZGUtYnktbm9kZSBiYXNpc1xuICAgKiB0aGUgYWN0IG9mIHByb2plY3Rpbmcgbm9kZXMgbWlnaHQgY2hhbmdlIG5vZGVzIHJlbGF0aW9uc2hpcCBhdCB0aGUgaW5zZXJ0aW9uIHBvaW50ICh0YXJnZXRcbiAgICogdmlldykuIEF0IHRoZSBzYW1lIHRpbWUgd2UgbmVlZCB0byBrZWVwIGluaXRpYWwgcmVsYXRpb25zaGlwIGJldHdlZW4gbm9kZXMgYXMgZXhwcmVzc2VkIGluXG4gICAqIGNvbnRlbnQgdmlldy5cbiAgICovXG4gIHByb2plY3Rpb25OZXh0OiBUTm9kZXxudWxsO1xuXG4gIC8qKlxuICAgKiBGaXJzdCBjaGlsZCBvZiB0aGUgY3VycmVudCBub2RlLlxuICAgKlxuICAgKiBGb3IgY29tcG9uZW50IG5vZGVzLCB0aGUgY2hpbGQgd2lsbCBhbHdheXMgYmUgYSBDb250ZW50Q2hpbGQgKGluIHNhbWUgdmlldykuXG4gICAqIEZvciBlbWJlZGRlZCB2aWV3IG5vZGVzLCB0aGUgY2hpbGQgd2lsbCBiZSBpbiB0aGVpciBjaGlsZCB2aWV3LlxuICAgKi9cbiAgY2hpbGQ6IFROb2RlfG51bGw7XG5cbiAgLyoqXG4gICAqIFBhcmVudCBub2RlIChpbiB0aGUgc2FtZSB2aWV3IG9ubHkpLlxuICAgKlxuICAgKiBXZSBuZWVkIGEgcmVmZXJlbmNlIHRvIGEgbm9kZSdzIHBhcmVudCBzbyB3ZSBjYW4gYXBwZW5kIHRoZSBub2RlIHRvIGl0cyBwYXJlbnQncyBuYXRpdmVcbiAgICogZWxlbWVudCBhdCB0aGUgYXBwcm9wcmlhdGUgdGltZS5cbiAgICpcbiAgICogSWYgdGhlIHBhcmVudCB3b3VsZCBiZSBpbiBhIGRpZmZlcmVudCB2aWV3IChlLmcuIGNvbXBvbmVudCBob3N0KSwgdGhpcyBwcm9wZXJ0eSB3aWxsIGJlIG51bGwuXG4gICAqIEl0J3MgaW1wb3J0YW50IHRoYXQgd2UgZG9uJ3QgdHJ5IHRvIGNyb3NzIGNvbXBvbmVudCBib3VuZGFyaWVzIHdoZW4gcmV0cmlldmluZyB0aGUgcGFyZW50XG4gICAqIGJlY2F1c2UgdGhlIHBhcmVudCB3aWxsIGNoYW5nZSAoZS5nLiBpbmRleCwgYXR0cnMpIGRlcGVuZGluZyBvbiB3aGVyZSB0aGUgY29tcG9uZW50IHdhc1xuICAgKiB1c2VkIChhbmQgdGh1cyBzaG91bGRuJ3QgYmUgc3RvcmVkIG9uIFROb2RlKS4gSW4gdGhlc2UgY2FzZXMsIHdlIHJldHJpZXZlIHRoZSBwYXJlbnQgdGhyb3VnaFxuICAgKiBMVmlldy5ub2RlIGluc3RlYWQgKHdoaWNoIHdpbGwgYmUgaW5zdGFuY2Utc3BlY2lmaWMpLlxuICAgKlxuICAgKiBJZiB0aGlzIGlzIGFuIGlubGluZSB2aWV3IG5vZGUgKFYpLCB0aGUgcGFyZW50IHdpbGwgYmUgaXRzIGNvbnRhaW5lci5cbiAgICovXG4gIHBhcmVudDogVEVsZW1lbnROb2RlfFRDb250YWluZXJOb2RlfG51bGw7XG5cbiAgLyoqXG4gICAqIExpc3Qgb2YgcHJvamVjdGVkIFROb2RlcyBmb3IgYSBnaXZlbiBjb21wb25lbnQgaG9zdCBlbGVtZW50IE9SIGluZGV4IGludG8gdGhlIHNhaWQgbm9kZXMuXG4gICAqXG4gICAqIEZvciBlYXNpZXIgZGlzY3Vzc2lvbiBhc3N1bWUgdGhpcyBleGFtcGxlOlxuICAgKiBgPHBhcmVudD5gJ3MgdmlldyBkZWZpbml0aW9uOlxuICAgKiBgYGBcbiAgICogPGNoaWxkIGlkPVwiYzFcIj5jb250ZW50MTwvY2hpbGQ+XG4gICAqIDxjaGlsZCBpZD1cImMyXCI+PHNwYW4+Y29udGVudDI8L3NwYW4+PC9jaGlsZD5cbiAgICogYGBgXG4gICAqIGA8Y2hpbGQ+YCdzIHZpZXcgZGVmaW5pdGlvbjpcbiAgICogYGBgXG4gICAqIDxuZy1jb250ZW50IGlkPVwiY29udDFcIj48L25nLWNvbnRlbnQ+XG4gICAqIGBgYFxuICAgKlxuICAgKiBJZiBgQXJyYXkuaXNBcnJheShwcm9qZWN0aW9uKWAgdGhlbiBgVE5vZGVgIGlzIGEgaG9zdCBlbGVtZW50OlxuICAgKiAtIGBwcm9qZWN0aW9uYCBzdG9yZXMgdGhlIGNvbnRlbnQgbm9kZXMgd2hpY2ggYXJlIHRvIGJlIHByb2plY3RlZC5cbiAgICogICAgLSBUaGUgbm9kZXMgcmVwcmVzZW50IGNhdGVnb3JpZXMgZGVmaW5lZCBieSB0aGUgc2VsZWN0b3I6IEZvciBleGFtcGxlOlxuICAgKiAgICAgIGA8bmctY29udGVudC8+PG5nLWNvbnRlbnQgc2VsZWN0PVwiYWJjXCIvPmAgd291bGQgcmVwcmVzZW50IHRoZSBoZWFkcyBmb3IgYDxuZy1jb250ZW50Lz5gXG4gICAqICAgICAgYW5kIGA8bmctY29udGVudCBzZWxlY3Q9XCJhYmNcIi8+YCByZXNwZWN0aXZlbHkuXG4gICAqICAgIC0gVGhlIG5vZGVzIHdlIHN0b3JlIGluIGBwcm9qZWN0aW9uYCBhcmUgaGVhZHMgb25seSwgd2UgdXNlZCBgLm5leHRgIHRvIGdldCB0aGVpclxuICAgKiAgICAgIHNpYmxpbmdzLlxuICAgKiAgICAtIFRoZSBub2RlcyBgLm5leHRgIGlzIHNvcnRlZC9yZXdyaXR0ZW4gYXMgcGFydCBvZiB0aGUgcHJvamVjdGlvbiBzZXR1cC5cbiAgICogICAgLSBgcHJvamVjdGlvbmAgc2l6ZSBpcyBlcXVhbCB0byB0aGUgbnVtYmVyIG9mIHByb2plY3Rpb25zIGA8bmctY29udGVudD5gLiBUaGUgc2l6ZSBvZlxuICAgKiAgICAgIGBjMWAgd2lsbCBiZSBgMWAgYmVjYXVzZSBgPGNoaWxkPmAgaGFzIG9ubHkgb25lIGA8bmctY29udGVudD5gLlxuICAgKiAtIHdlIHN0b3JlIGBwcm9qZWN0aW9uYCB3aXRoIHRoZSBob3N0IChgYzFgLCBgYzJgKSByYXRoZXIgdGhhbiB0aGUgYDxuZy1jb250ZW50PmAgKGBjb250MWApXG4gICAqICAgYmVjYXVzZSB0aGUgc2FtZSBjb21wb25lbnQgKGA8Y2hpbGQ+YCkgY2FuIGJlIHVzZWQgaW4gbXVsdGlwbGUgbG9jYXRpb25zIChgYzFgLCBgYzJgKSBhbmQgYXNcbiAgICogICBhIHJlc3VsdCBoYXZlIGRpZmZlcmVudCBzZXQgb2Ygbm9kZXMgdG8gcHJvamVjdC5cbiAgICogLSB3aXRob3V0IGBwcm9qZWN0aW9uYCBpdCB3b3VsZCBiZSBkaWZmaWN1bHQgdG8gZWZmaWNpZW50bHkgdHJhdmVyc2Ugbm9kZXMgdG8gYmUgcHJvamVjdGVkLlxuICAgKlxuICAgKiBJZiBgdHlwZW9mIHByb2plY3Rpb24gPT0gJ251bWJlcidgIHRoZW4gYFROb2RlYCBpcyBhIGA8bmctY29udGVudD5gIGVsZW1lbnQ6XG4gICAqIC0gYHByb2plY3Rpb25gIGlzIGFuIGluZGV4IG9mIHRoZSBob3N0J3MgYHByb2plY3Rpb25gTm9kZXMuXG4gICAqICAgLSBUaGlzIHdvdWxkIHJldHVybiB0aGUgZmlyc3QgaGVhZCBub2RlIHRvIHByb2plY3Q6XG4gICAqICAgICBgZ2V0SG9zdChjdXJyZW50VE5vZGUpLnByb2plY3Rpb25bY3VycmVudFROb2RlLnByb2plY3Rpb25dYC5cbiAgICogLSBXaGVuIHByb2plY3Rpbmcgbm9kZXMgdGhlIHBhcmVudCBub2RlIHJldHJpZXZlZCBtYXkgYmUgYSBgPG5nLWNvbnRlbnQ+YCBub2RlLCBpbiB3aGljaCBjYXNlXG4gICAqICAgdGhlIHByb2Nlc3MgaXMgcmVjdXJzaXZlIGluIG5hdHVyZS5cbiAgICpcbiAgICogSWYgYHByb2plY3Rpb25gIGlzIG9mIHR5cGUgYFJOb2RlW11bXWAgdGhhbiB3ZSBoYXZlIGEgY29sbGVjdGlvbiBvZiBuYXRpdmUgbm9kZXMgcGFzc2VkIGFzXG4gICAqIHByb2plY3RhYmxlIG5vZGVzIGR1cmluZyBkeW5hbWljIGNvbXBvbmVudCBjcmVhdGlvbi5cbiAgICovXG4gIHByb2plY3Rpb246IChUTm9kZXxSTm9kZVtdKVtdfG51bWJlcnxudWxsO1xuXG4gIC8qKlxuICAgKiBBIGNvbGxlY3Rpb24gb2YgYWxsIHN0eWxlIGJpbmRpbmdzIGFuZC9vciBzdGF0aWMgc3R5bGUgdmFsdWVzIGZvciBhbiBlbGVtZW50LlxuICAgKlxuICAgKiBUaGlzIGZpZWxkIHdpbGwgYmUgcG9wdWxhdGVkIGlmIGFuZCB3aGVuOlxuICAgKlxuICAgKiAtIFRoZXJlIGFyZSBvbmUgb3IgbW9yZSBpbml0aWFsIHN0eWxlcyBvbiBhbiBlbGVtZW50IChlLmcuIGA8ZGl2IHN0eWxlPVwid2lkdGg6MjAwcHhcIj5gKVxuICAgKiAtIFRoZXJlIGFyZSBvbmUgb3IgbW9yZSBzdHlsZSBiaW5kaW5ncyBvbiBhbiBlbGVtZW50IChlLmcuIGA8ZGl2IFtzdHlsZS53aWR0aF09XCJ3XCI+YClcbiAgICpcbiAgICogSWYgYW5kIHdoZW4gdGhlcmUgYXJlIG9ubHkgaW5pdGlhbCBzdHlsZXMgKG5vIGJpbmRpbmdzKSB0aGVuIGFuIGluc3RhbmNlIG9mIGBTdHlsaW5nTWFwQXJyYXlgXG4gICAqIHdpbGwgYmUgdXNlZCBoZXJlLiBPdGhlcndpc2UgYW4gaW5zdGFuY2Ugb2YgYFRTdHlsaW5nQ29udGV4dGAgd2lsbCBiZSBjcmVhdGVkIHdoZW4gdGhlcmVcbiAgICogYXJlIG9uZSBvciBtb3JlIHN0eWxlIGJpbmRpbmdzIG9uIGFuIGVsZW1lbnQuXG4gICAqXG4gICAqIER1cmluZyBlbGVtZW50IGNyZWF0aW9uIHRoaXMgdmFsdWUgaXMgbGlrZWx5IHRvIGJlIHBvcHVsYXRlZCB3aXRoIGFuIGluc3RhbmNlIG9mXG4gICAqIGBTdHlsaW5nTWFwQXJyYXlgIGFuZCBvbmx5IHdoZW4gdGhlIGJpbmRpbmdzIGFyZSBldmFsdWF0ZWQgKHdoaWNoIGhhcHBlbnMgZHVyaW5nXG4gICAqIHVwZGF0ZSBtb2RlKSB0aGVuIGl0IHdpbGwgYmUgY29udmVydGVkIHRvIGEgYFRTdHlsaW5nQ29udGV4dGAgaWYgYW55IHN0eWxlIGJpbmRpbmdzXG4gICAqIGFyZSBlbmNvdW50ZXJlZC4gSWYgYW5kIHdoZW4gdGhpcyBoYXBwZW5zIHRoZW4gdGhlIGV4aXN0aW5nIGBTdHlsaW5nTWFwQXJyYXlgIHZhbHVlXG4gICAqIHdpbGwgYmUgcGxhY2VkIGludG8gdGhlIGluaXRpYWwgc3R5bGluZyBzbG90IGluIHRoZSBuZXdseSBjcmVhdGVkIGBUU3R5bGluZ0NvbnRleHRgLlxuICAgKi9cbiAgc3R5bGVzOiBTdHlsaW5nTWFwQXJyYXl8VFN0eWxpbmdDb250ZXh0fG51bGw7XG5cbiAgLyoqXG4gICAqIEEgY29sbGVjdGlvbiBvZiBhbGwgY2xhc3MgYmluZGluZ3MgYW5kL29yIHN0YXRpYyBjbGFzcyB2YWx1ZXMgZm9yIGFuIGVsZW1lbnQuXG4gICAqXG4gICAqIFRoaXMgZmllbGQgd2lsbCBiZSBwb3B1bGF0ZWQgaWYgYW5kIHdoZW46XG4gICAqXG4gICAqIC0gVGhlcmUgYXJlIG9uZSBvciBtb3JlIGluaXRpYWwgY2xhc3NlcyBvbiBhbiBlbGVtZW50IChlLmcuIGA8ZGl2IGNsYXNzPVwib25lIHR3byB0aHJlZVwiPmApXG4gICAqIC0gVGhlcmUgYXJlIG9uZSBvciBtb3JlIGNsYXNzIGJpbmRpbmdzIG9uIGFuIGVsZW1lbnQgKGUuZy4gYDxkaXYgW2NsYXNzLmZvb109XCJmXCI+YClcbiAgICpcbiAgICogSWYgYW5kIHdoZW4gdGhlcmUgYXJlIG9ubHkgaW5pdGlhbCBjbGFzc2VzIChubyBiaW5kaW5ncykgdGhlbiBhbiBpbnN0YW5jZSBvZiBgU3R5bGluZ01hcEFycmF5YFxuICAgKiB3aWxsIGJlIHVzZWQgaGVyZS4gT3RoZXJ3aXNlIGFuIGluc3RhbmNlIG9mIGBUU3R5bGluZ0NvbnRleHRgIHdpbGwgYmUgY3JlYXRlZCB3aGVuIHRoZXJlXG4gICAqIGFyZSBvbmUgb3IgbW9yZSBjbGFzcyBiaW5kaW5ncyBvbiBhbiBlbGVtZW50LlxuICAgKlxuICAgKiBEdXJpbmcgZWxlbWVudCBjcmVhdGlvbiB0aGlzIHZhbHVlIGlzIGxpa2VseSB0byBiZSBwb3B1bGF0ZWQgd2l0aCBhbiBpbnN0YW5jZSBvZlxuICAgKiBgU3R5bGluZ01hcEFycmF5YCBhbmQgb25seSB3aGVuIHRoZSBiaW5kaW5ncyBhcmUgZXZhbHVhdGVkICh3aGljaCBoYXBwZW5zIGR1cmluZ1xuICAgKiB1cGRhdGUgbW9kZSkgdGhlbiBpdCB3aWxsIGJlIGNvbnZlcnRlZCB0byBhIGBUU3R5bGluZ0NvbnRleHRgIGlmIGFueSBjbGFzcyBiaW5kaW5nc1xuICAgKiBhcmUgZW5jb3VudGVyZWQuIElmIGFuZCB3aGVuIHRoaXMgaGFwcGVucyB0aGVuIHRoZSBleGlzdGluZyBgU3R5bGluZ01hcEFycmF5YCB2YWx1ZVxuICAgKiB3aWxsIGJlIHBsYWNlZCBpbnRvIHRoZSBpbml0aWFsIHN0eWxpbmcgc2xvdCBpbiB0aGUgbmV3bHkgY3JlYXRlZCBgVFN0eWxpbmdDb250ZXh0YC5cbiAgICovXG4gIGNsYXNzZXM6IFN0eWxpbmdNYXBBcnJheXxUU3R5bGluZ0NvbnRleHR8bnVsbDtcbn1cblxuLyoqIFN0YXRpYyBkYXRhIGZvciBhbiBlbGVtZW50ICAqL1xuZXhwb3J0IGludGVyZmFjZSBURWxlbWVudE5vZGUgZXh0ZW5kcyBUTm9kZSB7XG4gIC8qKiBJbmRleCBpbiB0aGUgZGF0YVtdIGFycmF5ICovXG4gIGluZGV4OiBudW1iZXI7XG4gIGNoaWxkOiBURWxlbWVudE5vZGV8VFRleHROb2RlfFRFbGVtZW50Q29udGFpbmVyTm9kZXxUQ29udGFpbmVyTm9kZXxUUHJvamVjdGlvbk5vZGV8bnVsbDtcbiAgLyoqXG4gICAqIEVsZW1lbnQgbm9kZXMgd2lsbCBoYXZlIHBhcmVudHMgdW5sZXNzIHRoZXkgYXJlIHRoZSBmaXJzdCBub2RlIG9mIGEgY29tcG9uZW50IG9yXG4gICAqIGVtYmVkZGVkIHZpZXcgKHdoaWNoIG1lYW5zIHRoZWlyIHBhcmVudCBpcyBpbiBhIGRpZmZlcmVudCB2aWV3IGFuZCBtdXN0IGJlXG4gICAqIHJldHJpZXZlZCB1c2luZyB2aWV3RGF0YVtIT1NUX05PREVdKS5cbiAgICovXG4gIHBhcmVudDogVEVsZW1lbnROb2RlfFRFbGVtZW50Q29udGFpbmVyTm9kZXxudWxsO1xuICB0Vmlld3M6IG51bGw7XG5cbiAgLyoqXG4gICAqIElmIHRoaXMgaXMgYSBjb21wb25lbnQgVE5vZGUgd2l0aCBwcm9qZWN0aW9uLCB0aGlzIHdpbGwgYmUgYW4gYXJyYXkgb2YgcHJvamVjdGVkXG4gICAqIFROb2RlcyBvciBuYXRpdmUgbm9kZXMgKHNlZSBUTm9kZS5wcm9qZWN0aW9uIGZvciBtb3JlIGluZm8pLiBJZiBpdCdzIGEgcmVndWxhciBlbGVtZW50IG5vZGUgb3JcbiAgICogYSBjb21wb25lbnQgd2l0aG91dCBwcm9qZWN0aW9uLCBpdCB3aWxsIGJlIG51bGwuXG4gICAqL1xuICBwcm9qZWN0aW9uOiAoVE5vZGV8Uk5vZGVbXSlbXXxudWxsO1xufVxuXG4vKiogU3RhdGljIGRhdGEgZm9yIGEgdGV4dCBub2RlICovXG5leHBvcnQgaW50ZXJmYWNlIFRUZXh0Tm9kZSBleHRlbmRzIFROb2RlIHtcbiAgLyoqIEluZGV4IGluIHRoZSBkYXRhW10gYXJyYXkgKi9cbiAgaW5kZXg6IG51bWJlcjtcbiAgY2hpbGQ6IG51bGw7XG4gIC8qKlxuICAgKiBUZXh0IG5vZGVzIHdpbGwgaGF2ZSBwYXJlbnRzIHVubGVzcyB0aGV5IGFyZSB0aGUgZmlyc3Qgbm9kZSBvZiBhIGNvbXBvbmVudCBvclxuICAgKiBlbWJlZGRlZCB2aWV3ICh3aGljaCBtZWFucyB0aGVpciBwYXJlbnQgaXMgaW4gYSBkaWZmZXJlbnQgdmlldyBhbmQgbXVzdCBiZVxuICAgKiByZXRyaWV2ZWQgdXNpbmcgTFZpZXcubm9kZSkuXG4gICAqL1xuICBwYXJlbnQ6IFRFbGVtZW50Tm9kZXxURWxlbWVudENvbnRhaW5lck5vZGV8bnVsbDtcbiAgdFZpZXdzOiBudWxsO1xuICBwcm9qZWN0aW9uOiBudWxsO1xufVxuXG4vKiogU3RhdGljIGRhdGEgZm9yIGFuIExDb250YWluZXIgKi9cbmV4cG9ydCBpbnRlcmZhY2UgVENvbnRhaW5lck5vZGUgZXh0ZW5kcyBUTm9kZSB7XG4gIC8qKlxuICAgKiBJbmRleCBpbiB0aGUgZGF0YVtdIGFycmF5LlxuICAgKlxuICAgKiBJZiBpdCdzIC0xLCB0aGlzIGlzIGEgZHluYW1pY2FsbHkgY3JlYXRlZCBjb250YWluZXIgbm9kZSB0aGF0IGlzbid0IHN0b3JlZCBpblxuICAgKiBkYXRhW10gKGUuZy4gd2hlbiB5b3UgaW5qZWN0IFZpZXdDb250YWluZXJSZWYpIC5cbiAgICovXG4gIGluZGV4OiBudW1iZXI7XG4gIGNoaWxkOiBudWxsO1xuXG4gIC8qKlxuICAgKiBDb250YWluZXIgbm9kZXMgd2lsbCBoYXZlIHBhcmVudHMgdW5sZXNzOlxuICAgKlxuICAgKiAtIFRoZXkgYXJlIHRoZSBmaXJzdCBub2RlIG9mIGEgY29tcG9uZW50IG9yIGVtYmVkZGVkIHZpZXdcbiAgICogLSBUaGV5IGFyZSBkeW5hbWljYWxseSBjcmVhdGVkXG4gICAqL1xuICBwYXJlbnQ6IFRFbGVtZW50Tm9kZXxURWxlbWVudENvbnRhaW5lck5vZGV8bnVsbDtcbiAgdFZpZXdzOiBUVmlld3xUVmlld1tdfG51bGw7XG4gIHByb2plY3Rpb246IG51bGw7XG59XG5cbi8qKiBTdGF0aWMgZGF0YSBmb3IgYW4gPG5nLWNvbnRhaW5lcj4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgVEVsZW1lbnRDb250YWluZXJOb2RlIGV4dGVuZHMgVE5vZGUge1xuICAvKiogSW5kZXggaW4gdGhlIExWaWV3W10gYXJyYXkuICovXG4gIGluZGV4OiBudW1iZXI7XG4gIGNoaWxkOiBURWxlbWVudE5vZGV8VFRleHROb2RlfFRDb250YWluZXJOb2RlfFRFbGVtZW50Q29udGFpbmVyTm9kZXxUUHJvamVjdGlvbk5vZGV8bnVsbDtcbiAgcGFyZW50OiBURWxlbWVudE5vZGV8VEVsZW1lbnRDb250YWluZXJOb2RlfG51bGw7XG4gIHRWaWV3czogbnVsbDtcbiAgcHJvamVjdGlvbjogbnVsbDtcbn1cblxuLyoqIFN0YXRpYyBkYXRhIGZvciBhbiBJQ1UgZXhwcmVzc2lvbiAqL1xuZXhwb3J0IGludGVyZmFjZSBUSWN1Q29udGFpbmVyTm9kZSBleHRlbmRzIFROb2RlIHtcbiAgLyoqIEluZGV4IGluIHRoZSBMVmlld1tdIGFycmF5LiAqL1xuICBpbmRleDogbnVtYmVyO1xuICBjaGlsZDogVEVsZW1lbnROb2RlfFRUZXh0Tm9kZXxudWxsO1xuICBwYXJlbnQ6IFRFbGVtZW50Tm9kZXxURWxlbWVudENvbnRhaW5lck5vZGV8bnVsbDtcbiAgdFZpZXdzOiBudWxsO1xuICBwcm9qZWN0aW9uOiBudWxsO1xuICAvKipcbiAgICogSW5kaWNhdGVzIHRoZSBjdXJyZW50IGFjdGl2ZSBjYXNlIGZvciBhbiBJQ1UgZXhwcmVzc2lvbi5cbiAgICogSXQgaXMgbnVsbCB3aGVuIHRoZXJlIGlzIG5vIGFjdGl2ZSBjYXNlLlxuICAgKi9cbiAgYWN0aXZlQ2FzZUluZGV4OiBudW1iZXJ8bnVsbDtcbn1cblxuLyoqIFN0YXRpYyBkYXRhIGZvciBhIHZpZXcgICovXG5leHBvcnQgaW50ZXJmYWNlIFRWaWV3Tm9kZSBleHRlbmRzIFROb2RlIHtcbiAgLyoqIElmIC0xLCBpdCdzIGEgZHluYW1pY2FsbHkgY3JlYXRlZCB2aWV3LiBPdGhlcndpc2UsIGl0IGlzIHRoZSB2aWV3IGJsb2NrIElELiAqL1xuICBpbmRleDogbnVtYmVyO1xuICBjaGlsZDogVEVsZW1lbnROb2RlfFRUZXh0Tm9kZXxURWxlbWVudENvbnRhaW5lck5vZGV8VENvbnRhaW5lck5vZGV8VFByb2plY3Rpb25Ob2RlfG51bGw7XG4gIHBhcmVudDogVENvbnRhaW5lck5vZGV8bnVsbDtcbiAgdFZpZXdzOiBudWxsO1xuICBwcm9qZWN0aW9uOiBudWxsO1xufVxuXG4vKiogU3RhdGljIGRhdGEgZm9yIGFuIExQcm9qZWN0aW9uTm9kZSAgKi9cbmV4cG9ydCBpbnRlcmZhY2UgVFByb2plY3Rpb25Ob2RlIGV4dGVuZHMgVE5vZGUge1xuICAvKiogSW5kZXggaW4gdGhlIGRhdGFbXSBhcnJheSAqL1xuICBjaGlsZDogbnVsbDtcbiAgLyoqXG4gICAqIFByb2plY3Rpb24gbm9kZXMgd2lsbCBoYXZlIHBhcmVudHMgdW5sZXNzIHRoZXkgYXJlIHRoZSBmaXJzdCBub2RlIG9mIGEgY29tcG9uZW50XG4gICAqIG9yIGVtYmVkZGVkIHZpZXcgKHdoaWNoIG1lYW5zIHRoZWlyIHBhcmVudCBpcyBpbiBhIGRpZmZlcmVudCB2aWV3IGFuZCBtdXN0IGJlXG4gICAqIHJldHJpZXZlZCB1c2luZyBMVmlldy5ub2RlKS5cbiAgICovXG4gIHBhcmVudDogVEVsZW1lbnROb2RlfFRFbGVtZW50Q29udGFpbmVyTm9kZXxudWxsO1xuICB0Vmlld3M6IG51bGw7XG5cbiAgLyoqIEluZGV4IG9mIHRoZSBwcm9qZWN0aW9uIG5vZGUuIChTZWUgVE5vZGUucHJvamVjdGlvbiBmb3IgbW9yZSBpbmZvLikgKi9cbiAgcHJvamVjdGlvbjogbnVtYmVyO1xufVxuXG4vKipcbiAqIFRoaXMgbWFwcGluZyBpcyBuZWNlc3Nhcnkgc28gd2UgY2FuIHNldCBpbnB1dCBwcm9wZXJ0aWVzIGFuZCBvdXRwdXQgbGlzdGVuZXJzXG4gKiBwcm9wZXJseSBhdCBydW50aW1lIHdoZW4gcHJvcGVydHkgbmFtZXMgYXJlIG1pbmlmaWVkIG9yIGFsaWFzZWQuXG4gKlxuICogS2V5OiB1bm1pbmlmaWVkIC8gcHVibGljIGlucHV0IG9yIG91dHB1dCBuYW1lXG4gKiBWYWx1ZTogYXJyYXkgY29udGFpbmluZyBtaW5pZmllZCAvIGludGVybmFsIG5hbWUgYW5kIHJlbGF0ZWQgZGlyZWN0aXZlIGluZGV4XG4gKlxuICogVGhlIHZhbHVlIG11c3QgYmUgYW4gYXJyYXkgdG8gc3VwcG9ydCBpbnB1dHMgYW5kIG91dHB1dHMgd2l0aCB0aGUgc2FtZSBuYW1lXG4gKiBvbiB0aGUgc2FtZSBub2RlLlxuICovXG5leHBvcnQgdHlwZSBQcm9wZXJ0eUFsaWFzZXMgPSB7XG4gIC8vIFRoaXMgdXNlcyBhbiBvYmplY3QgbWFwIGJlY2F1c2UgdXNpbmcgdGhlIE1hcCB0eXBlIHdvdWxkIGJlIHRvbyBzbG93XG4gIFtrZXk6IHN0cmluZ106IFByb3BlcnR5QWxpYXNWYWx1ZVxufTtcblxuLyoqXG4gKiBTdG9yZSB0aGUgcnVudGltZSBpbnB1dCBvciBvdXRwdXQgbmFtZXMgZm9yIGFsbCB0aGUgZGlyZWN0aXZlcy5cbiAqXG4gKiBpKzA6IGRpcmVjdGl2ZSBpbnN0YW5jZSBpbmRleFxuICogaSsxOiBwdWJsaWNOYW1lXG4gKiBpKzI6IHByaXZhdGVOYW1lXG4gKlxuICogZS5nLiBbMCwgJ2NoYW5nZScsICdjaGFuZ2UtbWluaWZpZWQnXVxuICovXG5leHBvcnQgdHlwZSBQcm9wZXJ0eUFsaWFzVmFsdWUgPSAobnVtYmVyIHwgc3RyaW5nKVtdO1xuXG4vKipcbiAqIFRoaXMgYXJyYXkgY29udGFpbnMgaW5mb3JtYXRpb24gYWJvdXQgaW5wdXQgcHJvcGVydGllcyB0aGF0XG4gKiBuZWVkIHRvIGJlIHNldCBvbmNlIGZyb20gYXR0cmlidXRlIGRhdGEuIEl0J3Mgb3JkZXJlZCBieVxuICogZGlyZWN0aXZlIGluZGV4IChyZWxhdGl2ZSB0byBlbGVtZW50KSBzbyBpdCdzIHNpbXBsZSB0b1xuICogbG9vayB1cCBhIHNwZWNpZmljIGRpcmVjdGl2ZSdzIGluaXRpYWwgaW5wdXQgZGF0YS5cbiAqXG4gKiBXaXRoaW4gZWFjaCBzdWItYXJyYXk6XG4gKlxuICogaSswOiBhdHRyaWJ1dGUgbmFtZVxuICogaSsxOiBtaW5pZmllZC9pbnRlcm5hbCBpbnB1dCBuYW1lXG4gKiBpKzI6IGluaXRpYWwgdmFsdWVcbiAqXG4gKiBJZiBhIGRpcmVjdGl2ZSBvbiBhIG5vZGUgZG9lcyBub3QgaGF2ZSBhbnkgaW5wdXQgcHJvcGVydGllc1xuICogdGhhdCBzaG91bGQgYmUgc2V0IGZyb20gYXR0cmlidXRlcywgaXRzIGluZGV4IGlzIHNldCB0byBudWxsXG4gKiB0byBhdm9pZCBhIHNwYXJzZSBhcnJheS5cbiAqXG4gKiBlLmcuIFtudWxsLCBbJ3JvbGUtbWluJywgJ21pbmlmaWVkLWlucHV0JywgJ2J1dHRvbiddXVxuICovXG5leHBvcnQgdHlwZSBJbml0aWFsSW5wdXREYXRhID0gKEluaXRpYWxJbnB1dHMgfCBudWxsKVtdO1xuXG4vKipcbiAqIFVzZWQgYnkgSW5pdGlhbElucHV0RGF0YSB0byBzdG9yZSBpbnB1dCBwcm9wZXJ0aWVzXG4gKiB0aGF0IHNob3VsZCBiZSBzZXQgb25jZSBmcm9tIGF0dHJpYnV0ZXMuXG4gKlxuICogaSswOiBhdHRyaWJ1dGUgbmFtZVxuICogaSsxOiBtaW5pZmllZC9pbnRlcm5hbCBpbnB1dCBuYW1lXG4gKiBpKzI6IGluaXRpYWwgdmFsdWVcbiAqXG4gKiBlLmcuIFsncm9sZS1taW4nLCAnbWluaWZpZWQtaW5wdXQnLCAnYnV0dG9uJ11cbiAqL1xuZXhwb3J0IHR5cGUgSW5pdGlhbElucHV0cyA9IHN0cmluZ1tdO1xuXG4vLyBOb3RlOiBUaGlzIGhhY2sgaXMgbmVjZXNzYXJ5IHNvIHdlIGRvbid0IGVycm9uZW91c2x5IGdldCBhIGNpcmN1bGFyIGRlcGVuZGVuY3lcbi8vIGZhaWx1cmUgYmFzZWQgb24gdHlwZXMuXG5leHBvcnQgY29uc3QgdW51c2VkVmFsdWVFeHBvcnRUb1BsYWNhdGVBamQgPSAxO1xuXG4vKipcbiAqIFR5cGUgcmVwcmVzZW50aW5nIGEgc2V0IG9mIFROb2RlcyB0aGF0IGNhbiBoYXZlIGxvY2FsIHJlZnMgKGAjZm9vYCkgcGxhY2VkIG9uIHRoZW0uXG4gKi9cbmV4cG9ydCB0eXBlIFROb2RlV2l0aExvY2FsUmVmcyA9IFRDb250YWluZXJOb2RlIHwgVEVsZW1lbnROb2RlIHwgVEVsZW1lbnRDb250YWluZXJOb2RlO1xuXG4vKipcbiAqIFR5cGUgZm9yIGEgZnVuY3Rpb24gdGhhdCBleHRyYWN0cyBhIHZhbHVlIGZvciBhIGxvY2FsIHJlZnMuXG4gKiBFeGFtcGxlOlxuICogLSBgPGRpdiAjbmF0aXZlRGl2RWw+YCAtIGBuYXRpdmVEaXZFbGAgc2hvdWxkIHBvaW50IHRvIHRoZSBuYXRpdmUgYDxkaXY+YCBlbGVtZW50O1xuICogLSBgPG5nLXRlbXBsYXRlICN0cGxSZWY+YCAtIGB0cGxSZWZgIHNob3VsZCBwb2ludCB0byB0aGUgYFRlbXBsYXRlUmVmYCBpbnN0YW5jZTtcbiAqL1xuZXhwb3J0IHR5cGUgTG9jYWxSZWZFeHRyYWN0b3IgPSAodE5vZGU6IFROb2RlV2l0aExvY2FsUmVmcywgY3VycmVudFZpZXc6IExWaWV3KSA9PiBhbnk7XG4iXX0=