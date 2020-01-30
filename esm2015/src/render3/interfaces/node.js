/**
 * @fileoverview added by tsickle
 * Generated from: packages/core/src/render3/interfaces/node.ts
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
    /** Bit #1 - This bit is set if the node is a host for any directive (including a component) */
    isDirectiveHost: 1,
    /**
     * Bit #2 - This bit is set if the node is a host for a component.
     *
     * Setting this bit implies that the `isDirectiveHost` bit is set as well.
     * */
    isComponentHost: 2,
    /** Bit #3 - This bit is set if the node has been projected */
    isProjected: 4,
    /** Bit #4 - This bit is set if any directive on this node has content queries */
    hasContentQuery: 8,
    /** Bit #5 - This bit is set if the node has any "class" inputs */
    hasClassInput: 16,
    /** Bit #6 - This bit is set if the node has any "style" inputs */
    hasStyleInput: 32,
    /** Bit #7 This bit is set if the node has been detached by i18n */
    isDetached: 64,
    /**
     * Bit #8 - This bit is set if the node has directives with host bindings.
     *
     * This flags allows us to guard host-binding logic and invoke it only on nodes
     * that actually have directives with host bindings.
     */
    hasHostBindings: 128,
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
     * An implicit marker which indicates that the value in the array are of `attributeKey`,
     * `attributeValue` format.
     *
     * NOTE: This is implicit as it is the type when no marker is present in array. We indicate that
     * it should not be present at runtime by the negative number.
     */
    ImplicitAttributes: -1,
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
     * Same as `TNode.attrs` but contains merged data across all directive host bindings.
     *
     * We need to keep `attrs` as unmerged so that it can be used for attribute selectors.
     * We merge attrs here so that it can be used in a performant way for initial rendering.
     *
     * The `attrs` are merged in first pass in following order:
     * - Component's `hostAttrs`
     * - Directives' `hostAttrs`
     * - Template `TNode.attrs` associated with the current `TNode`.
     * @type {?}
     */
    TNode.prototype.mergedAttrs;
    /**
     * Stores the directive defs matched on the current TNode (along with style cursor.)
     * @type {?}
     */
    TNode.prototype.directives;
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
     * Input data for all directives on this node. `null` means that there are no directives with
     * inputs on this node.
     * @type {?}
     */
    TNode.prototype.inputs;
    /**
     * Output data for all directives on this node. `null` means that there are no directives with
     * outputs on this node.
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
     * A collection of all style static values for an element.
     *
     * This field will be populated if and when:
     *
     * - There are one or more initial styles on an element (e.g. `<div style="width:200px">`)
     * @type {?}
     */
    TNode.prototype.styles;
    /**
     * A `KeyValueArray` version of residual `styles`.
     *
     * When there are styling instructions than each instruction stores the static styling
     * which is of lower priority than itself. This means that there may be a higher priority styling
     * than the instruction.
     *
     * Imagine:
     * ```
     * <div style="color: highest;" my-dir>
     *
     * \@Directive({
     *   host: {
     *     style: 'color: lowest; ',
     *     '[styles.color]': 'exp' // ɵɵstyleProp('color', ctx.exp);
     *   }
     * })
     * ```
     *
     * In the above case:
     * - `color: lowest` is stored with `ɵɵstyleProp('color', ctx.exp);` instruction
     * -  `color: highest` is the residual and is stored here.
     *
     * - `undefined': not initialized.
     * - `null`: initialized but `styles` is `null`
     * - `KeyValueArray`: parsed version of `styles`.
     * @type {?}
     */
    TNode.prototype.residualStyles;
    /**
     * A collection of all class static values for an element.
     *
     * This field will be populated if and when:
     *
     * - There are one or more initial classes on an element (e.g. `<div class="one two three">`)
     * @type {?}
     */
    TNode.prototype.classes;
    /**
     * A `KeyValueArray` version of residual `classes`.
     *
     * Same as `TNode.residualStyles` but for classes.
     *
     * - `undefined': not initialized.
     * - `null`: initialized but `classes` is `null`
     * - `KeyValueArray`: parsed version of `classes`.
     * @type {?}
     */
    TNode.prototype.residualClasses;
    /**
     * Stores the head/tail index of the class bindings.
     *
     * - If no bindings, the head and tail will both be 0.
     * - If there are template bindings, stores the head/tail of the class bindings in the template.
     * - If no template bindings but there are host bindings, the head value will point to the last
     *   host binding for "class" (not the head of the linked list), tail will be 0.
     *
     * See: `style_binding_list.ts` for details.
     *
     * This is used by `insertTStylingBinding` to know where the next styling binding should be
     * inserted so that they can be sorted in priority order.
     * @type {?}
     */
    TNode.prototype.classBindings;
    /**
     * Stores the head/tail index of the class bindings.
     *
     * - If no bindings, the head and tail will both be 0.
     * - If there are template bindings, stores the head/tail of the style bindings in the template.
     * - If no template bindings but there are host bindings, the head value will point to the last
     *   host binding for "style" (not the head of the linked list), tail will be 0.
     *
     * See: `style_binding_list.ts` for details.
     *
     * This is used by `insertTStylingBinding` to know where the next styling binding should be
     * inserted so that they can be sorted in priority order.
     * @type {?}
     */
    TNode.prototype.styleBindings;
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
/**
 * Returns `true` if the `TNode` has a directive which has `\@Input()` for `class` binding.
 *
 * ```
 * <div my-dir [class]="exp"></div>
 * ```
 * and
 * ```
 * \@Directive({
 * })
 * class MyDirective {
 * \@Input()
 *   class: string;
 * }
 * ```
 *
 * In the above case it is necessary to write the reconciled styling information into the
 * directive's input.
 *
 * @param {?} tNode
 * @return {?}
 */
export function hasClassInput(tNode) {
    return (tNode.flags & 16 /* hasClassInput */) !== 0;
}
/**
 * Returns `true` if the `TNode` has a directive which has `\@Input()` for `style` binding.
 *
 * ```
 * <div my-dir [style]="exp"></div>
 * ```
 * and
 * ```
 * \@Directive({
 * })
 * class MyDirective {
 * \@Input()
 *   class: string;
 * }
 * ```
 *
 * In the above case it is necessary to write the reconciled styling information into the
 * directive's input.
 *
 * @param {?} tNode
 * @return {?}
 */
export function hasStyleInput(tNode) {
    return (tNode.flags & 32 /* hasStyleInput */) !== 0;
}
/** @enum {number} */
const DirectiveDefs = {
    /// Location where the STYLING_CURSOR is stored.
    STYLING_CURSOR: 0,
    /// Header offset from which iterating over `DirectiveDefs` should start.
    HEADER_OFFSET: 1,
};
export { DirectiveDefs };
/** @enum {number} */
const DirectiveDefsValues = {
    // Initial value for the `STYLING_CURSOR`
    INITIAL_STYLING_CURSOR_VALUE: 0,
};
export { DirectiveDefsValues };
/**
 * Stores `DirectiveDefs` associated with the current `TNode` as well as styling cursor.
 * @record
 */
export function TDirectiveDefs() { }
if (false) {
    /* Skipping unnamed member:
    [DirectiveDefs.STYLING_CURSOR]: number;*/
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9kZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaW50ZXJmYWNlcy9ub2RlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQW9CQSxNQUFrQixTQUFTO0lBQ3pCOztPQUVHO0lBQ0gsU0FBUyxHQUFJO0lBQ2I7O09BRUc7SUFDSCxVQUFVLEdBQUk7SUFDZDs7T0FFRztJQUNILElBQUksR0FBSTtJQUNSOztPQUVHO0lBQ0gsT0FBTyxHQUFJO0lBQ1g7O09BRUc7SUFDSCxnQkFBZ0IsR0FBSTtJQUNwQjs7T0FFRztJQUNILFlBQVksR0FBSTtFQUNqQjs7O0FBS0QsTUFBa0IsVUFBVTtJQUMxQiwrRkFBK0Y7SUFDL0YsZUFBZSxHQUFNO0lBRXJCOzs7O1NBSUs7SUFDTCxlQUFlLEdBQU07SUFFckIsOERBQThEO0lBQzlELFdBQVcsR0FBTTtJQUVqQixpRkFBaUY7SUFDakYsZUFBZSxHQUFNO0lBRXJCLGtFQUFrRTtJQUNsRSxhQUFhLElBQU87SUFFcEIsa0VBQWtFO0lBQ2xFLGFBQWEsSUFBTztJQUVwQixtRUFBbUU7SUFDbkUsVUFBVSxJQUFPO0lBRWpCOzs7OztPQUtHO0lBQ0gsZUFBZSxLQUFPO0VBQ3ZCOzs7QUFLRCxNQUFrQixvQkFBb0I7SUFDcEMsNEZBQTRGO0lBQzVGLHVCQUF1QixPQUFxQztJQUU1RDswQkFDc0I7SUFDdEIsMEJBQTBCLElBQUs7SUFDL0IsNEJBQTRCLE9BQXFDO0VBQ2xFOzs7QUFLRCxNQUFrQixlQUFlO0lBQy9COzs7Ozs7T0FNRztJQUNILGtCQUFrQixJQUFLO0lBRXZCOzs7O09BSUc7SUFDSCxZQUFZLEdBQUk7SUFFaEI7Ozs7Ozs7Ozs7Ozs7OztRQWVJO0lBQ0osT0FBTyxHQUFJO0lBRVg7Ozs7Ozs7Ozs7Ozs7Ozs7T0FnQkc7SUFDSCxNQUFNLEdBQUk7SUFFVjs7Ozs7Ozs7Ozs7Ozs7T0FjRztJQUNILFFBQVEsR0FBSTtJQUVaOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O09Bc0JHO0lBQ0gsUUFBUSxHQUFJO0lBRVo7Ozs7Ozs7Ozs7Ozs7O09BY0c7SUFDSCxTQUFTLEdBQUk7SUFFYjs7Ozs7Ozs7Ozs7OztPQWFHO0lBQ0gsSUFBSSxHQUFJO0VBQ1Q7Ozs7Ozs7Ozs7Ozs7O0FBNEJELDJCQWdVQzs7Ozs7O0lBOVRDLHFCQUFnQjs7Ozs7Ozs7OztJQVVoQixzQkFBYzs7Ozs7Ozs7Ozs7Ozs7O0lBZWQsOEJBQXNCOzs7OztJQUt0QiwrQkFBdUI7Ozs7O0lBS3ZCLDZCQUFxQjs7Ozs7O0lBTXJCLGlDQUFnQzs7Ozs7SUFLaEMsc0JBQWtCOzs7Ozs7OztJQVNsQixnQ0FBc0M7Ozs7O0lBR3RDLHdCQUFxQjs7Ozs7Ozs7Ozs7Ozs7OztJQWdCckIsc0JBQXdCOzs7Ozs7Ozs7Ozs7O0lBYXhCLDRCQUE4Qjs7Ozs7SUFPOUIsMkJBQWdDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBbUJoQywyQkFBbUM7Ozs7O0lBR25DLDhCQUErQzs7Ozs7O0lBTS9DLHVCQUE2Qjs7Ozs7O0lBTTdCLHdCQUE4Qjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQXNCOUIsdUJBQTJCOzs7Ozs7SUFNM0IscUJBQWlCOzs7Ozs7OztJQVFqQiwrQkFBMkI7Ozs7Ozs7O0lBUTNCLHNCQUFrQjs7Ozs7Ozs7Ozs7Ozs7OztJQWdCbEIsdUJBQXlDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQXlDekMsMkJBQTBDOzs7Ozs7Ozs7SUFTMUMsdUJBQW9COzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQTZCcEIsK0JBQWtEOzs7Ozs7Ozs7SUFTbEQsd0JBQXFCOzs7Ozs7Ozs7OztJQVdyQixnQ0FBbUQ7Ozs7Ozs7Ozs7Ozs7OztJQWVuRCw4QkFBNkI7Ozs7Ozs7Ozs7Ozs7OztJQWU3Qiw4QkFBNkI7Ozs7OztBQUkvQixrQ0FrQkM7Ozs7OztJQWhCQyw2QkFBYzs7SUFDZCw2QkFBd0Y7Ozs7Ozs7SUFNeEYsOEJBQWdEOztJQUNoRCw4QkFBYTs7Ozs7OztJQU9iLGtDQUFtQzs7Ozs7O0FBSXJDLCtCQVlDOzs7Ozs7SUFWQywwQkFBYzs7SUFDZCwwQkFBWTs7Ozs7OztJQU1aLDJCQUFnRDs7SUFDaEQsMkJBQWE7O0lBQ2IsK0JBQWlCOzs7Ozs7QUFJbkIsb0NBbUJDOzs7Ozs7Ozs7SUFaQywrQkFBYzs7SUFDZCwrQkFBWTs7Ozs7Ozs7SUFRWixnQ0FBZ0Q7O0lBQ2hELGdDQUEyQjs7SUFDM0Isb0NBQWlCOzs7Ozs7QUFJbkIsMkNBT0M7Ozs7OztJQUxDLHNDQUFjOztJQUNkLHNDQUF3Rjs7SUFDeEYsdUNBQWdEOztJQUNoRCx1Q0FBYTs7SUFDYiwyQ0FBaUI7Ozs7OztBQUluQix1Q0FZQzs7Ozs7O0lBVkMsa0NBQWM7O0lBQ2Qsa0NBQW1DOztJQUNuQyxtQ0FBZ0Q7O0lBQ2hELG1DQUFhOztJQUNiLHVDQUFpQjs7Ozs7O0lBS2pCLDRDQUE2Qjs7Ozs7O0FBSS9CLCtCQU9DOzs7Ozs7SUFMQywwQkFBYzs7SUFDZCwwQkFBd0Y7O0lBQ3hGLDJCQUE0Qjs7SUFDNUIsMkJBQWE7O0lBQ2IsK0JBQWlCOzs7Ozs7QUFJbkIscUNBYUM7Ozs7OztJQVhDLGdDQUFZOzs7Ozs7O0lBTVosaUNBQWdEOztJQUNoRCxpQ0FBYTs7Ozs7SUFHYixxQ0FBbUI7Ozs7O0FBbUVyQixNQUFNLE9BQU8sNkJBQTZCLEdBQUcsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFvQzlDLE1BQU0sVUFBVSxhQUFhLENBQUMsS0FBWTtJQUN4QyxPQUFPLENBQUMsS0FBSyxDQUFDLEtBQUsseUJBQTJCLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDeEQsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUF1QkQsTUFBTSxVQUFVLGFBQWEsQ0FBQyxLQUFZO0lBQ3hDLE9BQU8sQ0FBQyxLQUFLLENBQUMsS0FBSyx5QkFBMkIsQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUN4RCxDQUFDOztBQUtELE1BQWtCLGFBQWE7SUFDN0IsZ0RBQWdEO0lBQ2hELGNBQWMsR0FBSTtJQUNsQix5RUFBeUU7SUFDekUsYUFBYSxHQUFJO0VBQ2xCOzs7QUFLRCxNQUFrQixtQkFBbUI7SUFDbkMseUNBQXlDO0lBQ3pDLDRCQUE0QixHQUFJO0VBQ2pDOzs7Ozs7QUFLRCxvQ0E0QkMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5pbXBvcnQge0tleVZhbHVlQXJyYXl9IGZyb20gJy4uLy4uL3V0aWwvYXJyYXlfdXRpbHMnO1xuaW1wb3J0IHtUU3R5bGluZ1JhbmdlfSBmcm9tICcuLi9pbnRlcmZhY2VzL3N0eWxpbmcnO1xuXG5pbXBvcnQge0RpcmVjdGl2ZURlZn0gZnJvbSAnLi9kZWZpbml0aW9uJztcbmltcG9ydCB7Q3NzU2VsZWN0b3J9IGZyb20gJy4vcHJvamVjdGlvbic7XG5pbXBvcnQge1JOb2RlfSBmcm9tICcuL3JlbmRlcmVyJztcbmltcG9ydCB7TFZpZXcsIFRWaWV3fSBmcm9tICcuL3ZpZXcnO1xuXG5cblxuLyoqXG4gKiBUTm9kZVR5cGUgY29ycmVzcG9uZHMgdG8gdGhlIHtAbGluayBUTm9kZX0gYHR5cGVgIHByb3BlcnR5LlxuICovXG5leHBvcnQgY29uc3QgZW51bSBUTm9kZVR5cGUge1xuICAvKipcbiAgICogVGhlIFROb2RlIGNvbnRhaW5zIGluZm9ybWF0aW9uIGFib3V0IGFuIHtAbGluayBMQ29udGFpbmVyfSBmb3IgZW1iZWRkZWQgdmlld3MuXG4gICAqL1xuICBDb250YWluZXIgPSAwLFxuICAvKipcbiAgICogVGhlIFROb2RlIGNvbnRhaW5zIGluZm9ybWF0aW9uIGFib3V0IGFuIGA8bmctY29udGVudD5gIHByb2plY3Rpb25cbiAgICovXG4gIFByb2plY3Rpb24gPSAxLFxuICAvKipcbiAgICogVGhlIFROb2RlIGNvbnRhaW5zIGluZm9ybWF0aW9uIGFib3V0IGFuIHtAbGluayBMVmlld31cbiAgICovXG4gIFZpZXcgPSAyLFxuICAvKipcbiAgICogVGhlIFROb2RlIGNvbnRhaW5zIGluZm9ybWF0aW9uIGFib3V0IGEgRE9NIGVsZW1lbnQgYWthIHtAbGluayBSTm9kZX0uXG4gICAqL1xuICBFbGVtZW50ID0gMyxcbiAgLyoqXG4gICAqIFRoZSBUTm9kZSBjb250YWlucyBpbmZvcm1hdGlvbiBhYm91dCBhbiBgPG5nLWNvbnRhaW5lcj5gIGVsZW1lbnQge0BsaW5rIFJOb2RlfS5cbiAgICovXG4gIEVsZW1lbnRDb250YWluZXIgPSA0LFxuICAvKipcbiAgICogVGhlIFROb2RlIGNvbnRhaW5zIGluZm9ybWF0aW9uIGFib3V0IGFuIElDVSBjb21tZW50IHVzZWQgaW4gYGkxOG5gLlxuICAgKi9cbiAgSWN1Q29udGFpbmVyID0gNSxcbn1cblxuLyoqXG4gKiBDb3JyZXNwb25kcyB0byB0aGUgVE5vZGUuZmxhZ3MgcHJvcGVydHkuXG4gKi9cbmV4cG9ydCBjb25zdCBlbnVtIFROb2RlRmxhZ3Mge1xuICAvKiogQml0ICMxIC0gVGhpcyBiaXQgaXMgc2V0IGlmIHRoZSBub2RlIGlzIGEgaG9zdCBmb3IgYW55IGRpcmVjdGl2ZSAoaW5jbHVkaW5nIGEgY29tcG9uZW50KSAqL1xuICBpc0RpcmVjdGl2ZUhvc3QgPSAweDEsXG5cbiAgLyoqXG4gICAqIEJpdCAjMiAtIFRoaXMgYml0IGlzIHNldCBpZiB0aGUgbm9kZSBpcyBhIGhvc3QgZm9yIGEgY29tcG9uZW50LlxuICAgKlxuICAgKiBTZXR0aW5nIHRoaXMgYml0IGltcGxpZXMgdGhhdCB0aGUgYGlzRGlyZWN0aXZlSG9zdGAgYml0IGlzIHNldCBhcyB3ZWxsLlxuICAgKiAqL1xuICBpc0NvbXBvbmVudEhvc3QgPSAweDIsXG5cbiAgLyoqIEJpdCAjMyAtIFRoaXMgYml0IGlzIHNldCBpZiB0aGUgbm9kZSBoYXMgYmVlbiBwcm9qZWN0ZWQgKi9cbiAgaXNQcm9qZWN0ZWQgPSAweDQsXG5cbiAgLyoqIEJpdCAjNCAtIFRoaXMgYml0IGlzIHNldCBpZiBhbnkgZGlyZWN0aXZlIG9uIHRoaXMgbm9kZSBoYXMgY29udGVudCBxdWVyaWVzICovXG4gIGhhc0NvbnRlbnRRdWVyeSA9IDB4OCxcblxuICAvKiogQml0ICM1IC0gVGhpcyBiaXQgaXMgc2V0IGlmIHRoZSBub2RlIGhhcyBhbnkgXCJjbGFzc1wiIGlucHV0cyAqL1xuICBoYXNDbGFzc0lucHV0ID0gMHgxMCxcblxuICAvKiogQml0ICM2IC0gVGhpcyBiaXQgaXMgc2V0IGlmIHRoZSBub2RlIGhhcyBhbnkgXCJzdHlsZVwiIGlucHV0cyAqL1xuICBoYXNTdHlsZUlucHV0ID0gMHgyMCxcblxuICAvKiogQml0ICM3IFRoaXMgYml0IGlzIHNldCBpZiB0aGUgbm9kZSBoYXMgYmVlbiBkZXRhY2hlZCBieSBpMThuICovXG4gIGlzRGV0YWNoZWQgPSAweDQwLFxuXG4gIC8qKlxuICAgKiBCaXQgIzggLSBUaGlzIGJpdCBpcyBzZXQgaWYgdGhlIG5vZGUgaGFzIGRpcmVjdGl2ZXMgd2l0aCBob3N0IGJpbmRpbmdzLlxuICAgKlxuICAgKiBUaGlzIGZsYWdzIGFsbG93cyB1cyB0byBndWFyZCBob3N0LWJpbmRpbmcgbG9naWMgYW5kIGludm9rZSBpdCBvbmx5IG9uIG5vZGVzXG4gICAqIHRoYXQgYWN0dWFsbHkgaGF2ZSBkaXJlY3RpdmVzIHdpdGggaG9zdCBiaW5kaW5ncy5cbiAgICovXG4gIGhhc0hvc3RCaW5kaW5ncyA9IDB4ODAsXG59XG5cbi8qKlxuICogQ29ycmVzcG9uZHMgdG8gdGhlIFROb2RlLnByb3ZpZGVySW5kZXhlcyBwcm9wZXJ0eS5cbiAqL1xuZXhwb3J0IGNvbnN0IGVudW0gVE5vZGVQcm92aWRlckluZGV4ZXMge1xuICAvKiogVGhlIGluZGV4IG9mIHRoZSBmaXJzdCBwcm92aWRlciBvbiB0aGlzIG5vZGUgaXMgZW5jb2RlZCBvbiB0aGUgbGVhc3Qgc2lnbmlmaWNhbnQgYml0cyAqL1xuICBQcm92aWRlcnNTdGFydEluZGV4TWFzayA9IDBiMDAwMDAwMDAwMDAwMDAwMDExMTExMTExMTExMTExMTEsXG5cbiAgLyoqIFRoZSBjb3VudCBvZiB2aWV3IHByb3ZpZGVycyBmcm9tIHRoZSBjb21wb25lbnQgb24gdGhpcyBub2RlIGlzIGVuY29kZWQgb24gdGhlIDE2IG1vc3RcbiAgICAgc2lnbmlmaWNhbnQgYml0cyAqL1xuICBDcHRWaWV3UHJvdmlkZXJzQ291bnRTaGlmdCA9IDE2LFxuICBDcHRWaWV3UHJvdmlkZXJzQ291bnRTaGlmdGVyID0gMGIwMDAwMDAwMDAwMDAwMDAxMDAwMDAwMDAwMDAwMDAwMCxcbn1cbi8qKlxuICogQSBzZXQgb2YgbWFya2VyIHZhbHVlcyB0byBiZSB1c2VkIGluIHRoZSBhdHRyaWJ1dGVzIGFycmF5cy4gVGhlc2UgbWFya2VycyBpbmRpY2F0ZSB0aGF0IHNvbWVcbiAqIGl0ZW1zIGFyZSBub3QgcmVndWxhciBhdHRyaWJ1dGVzIGFuZCB0aGUgcHJvY2Vzc2luZyBzaG91bGQgYmUgYWRhcHRlZCBhY2NvcmRpbmdseS5cbiAqL1xuZXhwb3J0IGNvbnN0IGVudW0gQXR0cmlidXRlTWFya2VyIHtcbiAgLyoqXG4gICAqIEFuIGltcGxpY2l0IG1hcmtlciB3aGljaCBpbmRpY2F0ZXMgdGhhdCB0aGUgdmFsdWUgaW4gdGhlIGFycmF5IGFyZSBvZiBgYXR0cmlidXRlS2V5YCxcbiAgICogYGF0dHJpYnV0ZVZhbHVlYCBmb3JtYXQuXG4gICAqXG4gICAqIE5PVEU6IFRoaXMgaXMgaW1wbGljaXQgYXMgaXQgaXMgdGhlIHR5cGUgd2hlbiBubyBtYXJrZXIgaXMgcHJlc2VudCBpbiBhcnJheS4gV2UgaW5kaWNhdGUgdGhhdFxuICAgKiBpdCBzaG91bGQgbm90IGJlIHByZXNlbnQgYXQgcnVudGltZSBieSB0aGUgbmVnYXRpdmUgbnVtYmVyLlxuICAgKi9cbiAgSW1wbGljaXRBdHRyaWJ1dGVzID0gLTEsXG5cbiAgLyoqXG4gICAqIE1hcmtlciBpbmRpY2F0ZXMgdGhhdCB0aGUgZm9sbG93aW5nIDMgdmFsdWVzIGluIHRoZSBhdHRyaWJ1dGVzIGFycmF5IGFyZTpcbiAgICogbmFtZXNwYWNlVXJpLCBhdHRyaWJ1dGVOYW1lLCBhdHRyaWJ1dGVWYWx1ZVxuICAgKiBpbiB0aGF0IG9yZGVyLlxuICAgKi9cbiAgTmFtZXNwYWNlVVJJID0gMCxcblxuICAvKipcbiAgICAqIFNpZ25hbHMgY2xhc3MgZGVjbGFyYXRpb24uXG4gICAgKlxuICAgICogRWFjaCB2YWx1ZSBmb2xsb3dpbmcgYENsYXNzZXNgIGRlc2lnbmF0ZXMgYSBjbGFzcyBuYW1lIHRvIGluY2x1ZGUgb24gdGhlIGVsZW1lbnQuXG4gICAgKiAjIyBFeGFtcGxlOlxuICAgICpcbiAgICAqIEdpdmVuOlxuICAgICogYGBgXG4gICAgKiA8ZGl2IGNsYXNzPVwiZm9vIGJhciBiYXpcIj4uLi48ZC92aT5cbiAgICAqIGBgYFxuICAgICpcbiAgICAqIHRoZSBnZW5lcmF0ZWQgY29kZSBpczpcbiAgICAqIGBgYFxuICAgICogdmFyIF9jMSA9IFtBdHRyaWJ1dGVNYXJrZXIuQ2xhc3NlcywgJ2ZvbycsICdiYXInLCAnYmF6J107XG4gICAgKiBgYGBcbiAgICAqL1xuICBDbGFzc2VzID0gMSxcblxuICAvKipcbiAgICogU2lnbmFscyBzdHlsZSBkZWNsYXJhdGlvbi5cbiAgICpcbiAgICogRWFjaCBwYWlyIG9mIHZhbHVlcyBmb2xsb3dpbmcgYFN0eWxlc2AgZGVzaWduYXRlcyBhIHN0eWxlIG5hbWUgYW5kIHZhbHVlIHRvIGluY2x1ZGUgb24gdGhlXG4gICAqIGVsZW1lbnQuXG4gICAqICMjIEV4YW1wbGU6XG4gICAqXG4gICAqIEdpdmVuOlxuICAgKiBgYGBcbiAgICogPGRpdiBzdHlsZT1cIndpZHRoOjEwMHB4OyBoZWlnaHQ6MjAwcHg7IGNvbG9yOnJlZFwiPi4uLjwvZGl2PlxuICAgKiBgYGBcbiAgICpcbiAgICogdGhlIGdlbmVyYXRlZCBjb2RlIGlzOlxuICAgKiBgYGBcbiAgICogdmFyIF9jMSA9IFtBdHRyaWJ1dGVNYXJrZXIuU3R5bGVzLCAnd2lkdGgnLCAnMTAwcHgnLCAnaGVpZ2h0Jy4gJzIwMHB4JywgJ2NvbG9yJywgJ3JlZCddO1xuICAgKiBgYGBcbiAgICovXG4gIFN0eWxlcyA9IDIsXG5cbiAgLyoqXG4gICAqIFNpZ25hbHMgdGhhdCB0aGUgZm9sbG93aW5nIGF0dHJpYnV0ZSBuYW1lcyB3ZXJlIGV4dHJhY3RlZCBmcm9tIGlucHV0IG9yIG91dHB1dCBiaW5kaW5ncy5cbiAgICpcbiAgICogRm9yIGV4YW1wbGUsIGdpdmVuIHRoZSBmb2xsb3dpbmcgSFRNTDpcbiAgICpcbiAgICogYGBgXG4gICAqIDxkaXYgbW9vPVwiY2FyXCIgW2Zvb109XCJleHBcIiAoYmFyKT1cImRvU3RoKClcIj5cbiAgICogYGBgXG4gICAqXG4gICAqIHRoZSBnZW5lcmF0ZWQgY29kZSBpczpcbiAgICpcbiAgICogYGBgXG4gICAqIHZhciBfYzEgPSBbJ21vbycsICdjYXInLCBBdHRyaWJ1dGVNYXJrZXIuQmluZGluZ3MsICdmb28nLCAnYmFyJ107XG4gICAqIGBgYFxuICAgKi9cbiAgQmluZGluZ3MgPSAzLFxuXG4gIC8qKlxuICAgKiBTaWduYWxzIHRoYXQgdGhlIGZvbGxvd2luZyBhdHRyaWJ1dGUgbmFtZXMgd2VyZSBob2lzdGVkIGZyb20gYW4gaW5saW5lLXRlbXBsYXRlIGRlY2xhcmF0aW9uLlxuICAgKlxuICAgKiBGb3IgZXhhbXBsZSwgZ2l2ZW4gdGhlIGZvbGxvd2luZyBIVE1MOlxuICAgKlxuICAgKiBgYGBcbiAgICogPGRpdiAqbmdGb3I9XCJsZXQgdmFsdWUgb2YgdmFsdWVzOyB0cmFja0J5OnRyYWNrQnlcIiBkaXJBIFtkaXJCXT1cInZhbHVlXCI+XG4gICAqIGBgYFxuICAgKlxuICAgKiB0aGUgZ2VuZXJhdGVkIGNvZGUgZm9yIHRoZSBgdGVtcGxhdGUoKWAgaW5zdHJ1Y3Rpb24gd291bGQgaW5jbHVkZTpcbiAgICpcbiAgICogYGBgXG4gICAqIFsnZGlyQScsICcnLCBBdHRyaWJ1dGVNYXJrZXIuQmluZGluZ3MsICdkaXJCJywgQXR0cmlidXRlTWFya2VyLlRlbXBsYXRlLCAnbmdGb3InLCAnbmdGb3JPZicsXG4gICAqICduZ0ZvclRyYWNrQnknLCAnbGV0LXZhbHVlJ11cbiAgICogYGBgXG4gICAqXG4gICAqIHdoaWxlIHRoZSBnZW5lcmF0ZWQgY29kZSBmb3IgdGhlIGBlbGVtZW50KClgIGluc3RydWN0aW9uIGluc2lkZSB0aGUgdGVtcGxhdGUgZnVuY3Rpb24gd291bGRcbiAgICogaW5jbHVkZTpcbiAgICpcbiAgICogYGBgXG4gICAqIFsnZGlyQScsICcnLCBBdHRyaWJ1dGVNYXJrZXIuQmluZGluZ3MsICdkaXJCJ11cbiAgICogYGBgXG4gICAqL1xuICBUZW1wbGF0ZSA9IDQsXG5cbiAgLyoqXG4gICAqIFNpZ25hbHMgdGhhdCB0aGUgZm9sbG93aW5nIGF0dHJpYnV0ZSBpcyBgbmdQcm9qZWN0QXNgIGFuZCBpdHMgdmFsdWUgaXMgYSBwYXJzZWQgYENzc1NlbGVjdG9yYC5cbiAgICpcbiAgICogRm9yIGV4YW1wbGUsIGdpdmVuIHRoZSBmb2xsb3dpbmcgSFRNTDpcbiAgICpcbiAgICogYGBgXG4gICAqIDxoMSBhdHRyPVwidmFsdWVcIiBuZ1Byb2plY3RBcz1cIlt0aXRsZV1cIj5cbiAgICogYGBgXG4gICAqXG4gICAqIHRoZSBnZW5lcmF0ZWQgY29kZSBmb3IgdGhlIGBlbGVtZW50KClgIGluc3RydWN0aW9uIHdvdWxkIGluY2x1ZGU6XG4gICAqXG4gICAqIGBgYFxuICAgKiBbJ2F0dHInLCAndmFsdWUnLCBBdHRyaWJ1dGVNYXJrZXIuUHJvamVjdEFzLCBbJycsICd0aXRsZScsICcnXV1cbiAgICogYGBgXG4gICAqL1xuICBQcm9qZWN0QXMgPSA1LFxuXG4gIC8qKlxuICAgKiBTaWduYWxzIHRoYXQgdGhlIGZvbGxvd2luZyBhdHRyaWJ1dGUgd2lsbCBiZSB0cmFuc2xhdGVkIGJ5IHJ1bnRpbWUgaTE4blxuICAgKlxuICAgKiBGb3IgZXhhbXBsZSwgZ2l2ZW4gdGhlIGZvbGxvd2luZyBIVE1MOlxuICAgKlxuICAgKiBgYGBcbiAgICogPGRpdiBtb289XCJjYXJcIiBmb289XCJ2YWx1ZVwiIGkxOG4tZm9vIFtiYXJdPVwiYmluZGluZ1wiIGkxOG4tYmFyPlxuICAgKiBgYGBcbiAgICpcbiAgICogdGhlIGdlbmVyYXRlZCBjb2RlIGlzOlxuICAgKlxuICAgKiBgYGBcbiAgICogdmFyIF9jMSA9IFsnbW9vJywgJ2NhcicsIEF0dHJpYnV0ZU1hcmtlci5JMThuLCAnZm9vJywgJ2JhciddO1xuICAgKi9cbiAgSTE4biA9IDYsXG59XG5cbi8qKlxuICogQSBjb21iaW5hdGlvbiBvZjpcbiAqIC0gQXR0cmlidXRlIG5hbWVzIGFuZCB2YWx1ZXMuXG4gKiAtIFNwZWNpYWwgbWFya2VycyBhY3RpbmcgYXMgZmxhZ3MgdG8gYWx0ZXIgYXR0cmlidXRlcyBwcm9jZXNzaW5nLlxuICogLSBQYXJzZWQgbmdQcm9qZWN0QXMgc2VsZWN0b3JzLlxuICovXG5leHBvcnQgdHlwZSBUQXR0cmlidXRlcyA9IChzdHJpbmcgfCBBdHRyaWJ1dGVNYXJrZXIgfCBDc3NTZWxlY3RvcilbXTtcblxuLyoqXG4gKiBDb25zdGFudHMgdGhhdCBhcmUgYXNzb2NpYXRlZCB3aXRoIGEgdmlldy4gSW5jbHVkZXM6XG4gKiAtIEF0dHJpYnV0ZSBhcnJheXMuXG4gKiAtIExvY2FsIGRlZmluaXRpb24gYXJyYXlzLlxuICovXG5leHBvcnQgdHlwZSBUQ29uc3RhbnRzID0gKFRBdHRyaWJ1dGVzIHwgc3RyaW5nKVtdO1xuXG4vKipcbiAqIEJpbmRpbmcgZGF0YSAoZmx5d2VpZ2h0KSBmb3IgYSBwYXJ0aWN1bGFyIG5vZGUgdGhhdCBpcyBzaGFyZWQgYmV0d2VlbiBhbGwgdGVtcGxhdGVzXG4gKiBvZiBhIHNwZWNpZmljIHR5cGUuXG4gKlxuICogSWYgYSBwcm9wZXJ0eSBpczpcbiAqICAgIC0gUHJvcGVydHlBbGlhc2VzOiB0aGF0IHByb3BlcnR5J3MgZGF0YSB3YXMgZ2VuZXJhdGVkIGFuZCB0aGlzIGlzIGl0XG4gKiAgICAtIE51bGw6IHRoYXQgcHJvcGVydHkncyBkYXRhIHdhcyBhbHJlYWR5IGdlbmVyYXRlZCBhbmQgbm90aGluZyB3YXMgZm91bmQuXG4gKiAgICAtIFVuZGVmaW5lZDogdGhhdCBwcm9wZXJ0eSdzIGRhdGEgaGFzIG5vdCB5ZXQgYmVlbiBnZW5lcmF0ZWRcbiAqXG4gKiBzZWU6IGh0dHBzOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0ZseXdlaWdodF9wYXR0ZXJuIGZvciBtb3JlIG9uIHRoZSBGbHl3ZWlnaHQgcGF0dGVyblxuICovXG5leHBvcnQgaW50ZXJmYWNlIFROb2RlIHtcbiAgLyoqIFRoZSB0eXBlIG9mIHRoZSBUTm9kZS4gU2VlIFROb2RlVHlwZS4gKi9cbiAgdHlwZTogVE5vZGVUeXBlO1xuXG4gIC8qKlxuICAgKiBJbmRleCBvZiB0aGUgVE5vZGUgaW4gVFZpZXcuZGF0YSBhbmQgY29ycmVzcG9uZGluZyBuYXRpdmUgZWxlbWVudCBpbiBMVmlldy5cbiAgICpcbiAgICogVGhpcyBpcyBuZWNlc3NhcnkgdG8gZ2V0IGZyb20gYW55IFROb2RlIHRvIGl0cyBjb3JyZXNwb25kaW5nIG5hdGl2ZSBlbGVtZW50IHdoZW5cbiAgICogdHJhdmVyc2luZyB0aGUgbm9kZSB0cmVlLlxuICAgKlxuICAgKiBJZiBpbmRleCBpcyAtMSwgdGhpcyBpcyBhIGR5bmFtaWNhbGx5IGNyZWF0ZWQgY29udGFpbmVyIG5vZGUgb3IgZW1iZWRkZWQgdmlldyBub2RlLlxuICAgKi9cbiAgaW5kZXg6IG51bWJlcjtcblxuICAvKipcbiAgICogVGhlIGluZGV4IG9mIHRoZSBjbG9zZXN0IGluamVjdG9yIGluIHRoaXMgbm9kZSdzIExWaWV3LlxuICAgKlxuICAgKiBJZiB0aGUgaW5kZXggPT09IC0xLCB0aGVyZSBpcyBubyBpbmplY3RvciBvbiB0aGlzIG5vZGUgb3IgYW55IGFuY2VzdG9yIG5vZGUgaW4gdGhpcyB2aWV3LlxuICAgKlxuICAgKiBJZiB0aGUgaW5kZXggIT09IC0xLCBpdCBpcyB0aGUgaW5kZXggb2YgdGhpcyBub2RlJ3MgaW5qZWN0b3IgT1IgdGhlIGluZGV4IG9mIGEgcGFyZW50IGluamVjdG9yXG4gICAqIGluIHRoZSBzYW1lIHZpZXcuIFdlIHBhc3MgdGhlIHBhcmVudCBpbmplY3RvciBpbmRleCBkb3duIHRoZSBub2RlIHRyZWUgb2YgYSB2aWV3IHNvIGl0J3NcbiAgICogcG9zc2libGUgdG8gZmluZCB0aGUgcGFyZW50IGluamVjdG9yIHdpdGhvdXQgd2Fsa2luZyBhIHBvdGVudGlhbGx5IGRlZXAgbm9kZSB0cmVlLiBJbmplY3RvclxuICAgKiBpbmRpY2VzIGFyZSBub3Qgc2V0IGFjcm9zcyB2aWV3IGJvdW5kYXJpZXMgYmVjYXVzZSB0aGVyZSBjb3VsZCBiZSBtdWx0aXBsZSBjb21wb25lbnQgaG9zdHMuXG4gICAqXG4gICAqIElmIHROb2RlLmluamVjdG9ySW5kZXggPT09IHROb2RlLnBhcmVudC5pbmplY3RvckluZGV4LCB0aGVuIHRoZSBpbmRleCBiZWxvbmdzIHRvIGEgcGFyZW50XG4gICAqIGluamVjdG9yLlxuICAgKi9cbiAgaW5qZWN0b3JJbmRleDogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBTdG9yZXMgc3RhcnRpbmcgaW5kZXggb2YgdGhlIGRpcmVjdGl2ZXMuXG4gICAqL1xuICBkaXJlY3RpdmVTdGFydDogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBTdG9yZXMgZmluYWwgZXhjbHVzaXZlIGluZGV4IG9mIHRoZSBkaXJlY3RpdmVzLlxuICAgKi9cbiAgZGlyZWN0aXZlRW5kOiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIFN0b3JlcyBpbmRleGVzIG9mIHByb3BlcnR5IGJpbmRpbmdzLiBUaGlzIGZpZWxkIGlzIG9ubHkgc2V0IGluIHRoZSBuZ0Rldk1vZGUgYW5kIGhvbGRzIGluZGV4ZXNcbiAgICogb2YgcHJvcGVydHkgYmluZGluZ3Mgc28gVGVzdEJlZCBjYW4gZ2V0IGJvdW5kIHByb3BlcnR5IG1ldGFkYXRhIGZvciBhIGdpdmVuIG5vZGUuXG4gICAqL1xuICBwcm9wZXJ0eUJpbmRpbmdzOiBudW1iZXJbXXxudWxsO1xuXG4gIC8qKlxuICAgKiBTdG9yZXMgaWYgTm9kZSBpc0NvbXBvbmVudCwgaXNQcm9qZWN0ZWQsIGhhc0NvbnRlbnRRdWVyeSwgaGFzQ2xhc3NJbnB1dCBhbmQgaGFzU3R5bGVJbnB1dCBldGMuXG4gICAqL1xuICBmbGFnczogVE5vZGVGbGFncztcblxuICAvKipcbiAgICogVGhpcyBudW1iZXIgc3RvcmVzIHR3byB2YWx1ZXMgdXNpbmcgaXRzIGJpdHM6XG4gICAqXG4gICAqIC0gdGhlIGluZGV4IG9mIHRoZSBmaXJzdCBwcm92aWRlciBvbiB0aGF0IG5vZGUgKGZpcnN0IDE2IGJpdHMpXG4gICAqIC0gdGhlIGNvdW50IG9mIHZpZXcgcHJvdmlkZXJzIGZyb20gdGhlIGNvbXBvbmVudCBvbiB0aGlzIG5vZGUgKGxhc3QgMTYgYml0cylcbiAgICovXG4gIC8vIFRPRE8obWlza28pOiBicmVhayB0aGlzIGludG8gYWN0dWFsIHZhcnMuXG4gIHByb3ZpZGVySW5kZXhlczogVE5vZGVQcm92aWRlckluZGV4ZXM7XG5cbiAgLyoqIFRoZSB0YWcgbmFtZSBhc3NvY2lhdGVkIHdpdGggdGhpcyBub2RlLiAqL1xuICB0YWdOYW1lOiBzdHJpbmd8bnVsbDtcblxuICAvKipcbiAgICogQXR0cmlidXRlcyBhc3NvY2lhdGVkIHdpdGggYW4gZWxlbWVudC4gV2UgbmVlZCB0byBzdG9yZSBhdHRyaWJ1dGVzIHRvIHN1cHBvcnQgdmFyaW91cyB1c2UtY2FzZXNcbiAgICogKGF0dHJpYnV0ZSBpbmplY3Rpb24sIGNvbnRlbnQgcHJvamVjdGlvbiB3aXRoIHNlbGVjdG9ycywgZGlyZWN0aXZlcyBtYXRjaGluZykuXG4gICAqIEF0dHJpYnV0ZXMgYXJlIHN0b3JlZCBzdGF0aWNhbGx5IGJlY2F1c2UgcmVhZGluZyB0aGVtIGZyb20gdGhlIERPTSB3b3VsZCBiZSB3YXkgdG9vIHNsb3cgZm9yXG4gICAqIGNvbnRlbnQgcHJvamVjdGlvbiBhbmQgcXVlcmllcy5cbiAgICpcbiAgICogU2luY2UgYXR0cnMgd2lsbCBhbHdheXMgYmUgY2FsY3VsYXRlZCBmaXJzdCwgdGhleSB3aWxsIG5ldmVyIG5lZWQgdG8gYmUgbWFya2VkIHVuZGVmaW5lZCBieVxuICAgKiBvdGhlciBpbnN0cnVjdGlvbnMuXG4gICAqXG4gICAqIEZvciByZWd1bGFyIGF0dHJpYnV0ZXMgYSBuYW1lIG9mIGFuIGF0dHJpYnV0ZSBhbmQgaXRzIHZhbHVlIGFsdGVybmF0ZSBpbiB0aGUgYXJyYXkuXG4gICAqIGUuZy4gWydyb2xlJywgJ2NoZWNrYm94J11cbiAgICogVGhpcyBhcnJheSBjYW4gY29udGFpbiBmbGFncyB0aGF0IHdpbGwgaW5kaWNhdGUgXCJzcGVjaWFsIGF0dHJpYnV0ZXNcIiAoYXR0cmlidXRlcyB3aXRoXG4gICAqIG5hbWVzcGFjZXMsIGF0dHJpYnV0ZXMgZXh0cmFjdGVkIGZyb20gYmluZGluZ3MgYW5kIG91dHB1dHMpLlxuICAgKi9cbiAgYXR0cnM6IFRBdHRyaWJ1dGVzfG51bGw7XG5cbiAgLyoqXG4gICAqIFNhbWUgYXMgYFROb2RlLmF0dHJzYCBidXQgY29udGFpbnMgbWVyZ2VkIGRhdGEgYWNyb3NzIGFsbCBkaXJlY3RpdmUgaG9zdCBiaW5kaW5ncy5cbiAgICpcbiAgICogV2UgbmVlZCB0byBrZWVwIGBhdHRyc2AgYXMgdW5tZXJnZWQgc28gdGhhdCBpdCBjYW4gYmUgdXNlZCBmb3IgYXR0cmlidXRlIHNlbGVjdG9ycy5cbiAgICogV2UgbWVyZ2UgYXR0cnMgaGVyZSBzbyB0aGF0IGl0IGNhbiBiZSB1c2VkIGluIGEgcGVyZm9ybWFudCB3YXkgZm9yIGluaXRpYWwgcmVuZGVyaW5nLlxuICAgKlxuICAgKiBUaGUgYGF0dHJzYCBhcmUgbWVyZ2VkIGluIGZpcnN0IHBhc3MgaW4gZm9sbG93aW5nIG9yZGVyOlxuICAgKiAtIENvbXBvbmVudCdzIGBob3N0QXR0cnNgXG4gICAqIC0gRGlyZWN0aXZlcycgYGhvc3RBdHRyc2BcbiAgICogLSBUZW1wbGF0ZSBgVE5vZGUuYXR0cnNgIGFzc29jaWF0ZWQgd2l0aCB0aGUgY3VycmVudCBgVE5vZGVgLlxuICAgKi9cbiAgbWVyZ2VkQXR0cnM6IFRBdHRyaWJ1dGVzfG51bGw7XG5cbiAgLy8gVE9ETyhtaXNrbyk6IHByZSBkaXNjdXNzaW9uIHdpdGggS2FyYSwgaXQgc2VlbXMgdGhhdCB3ZSBkb24ndCBuZWVkIGBkaXJlY3RpdmVzYCBzaW5jZSB0aGUgc2FtZVxuICAvLyBpbmZvcm1hdGlvbiBpcyBhbHJlYWR5IHByZXNlbnQgaW4gdGhlIFREYXRhLiBNYXliZSB3b3J0aCByZWZhY3RvcmluZy5cbiAgLyoqXG4gICAqIFN0b3JlcyB0aGUgZGlyZWN0aXZlIGRlZnMgbWF0Y2hlZCBvbiB0aGUgY3VycmVudCBUTm9kZSAoYWxvbmcgd2l0aCBzdHlsZSBjdXJzb3IuKVxuICAgKi9cbiAgZGlyZWN0aXZlczogVERpcmVjdGl2ZURlZnN8bnVsbDtcblxuICAvKipcbiAgICogQSBzZXQgb2YgbG9jYWwgbmFtZXMgdW5kZXIgd2hpY2ggYSBnaXZlbiBlbGVtZW50IGlzIGV4cG9ydGVkIGluIGEgdGVtcGxhdGUgYW5kXG4gICAqIHZpc2libGUgdG8gcXVlcmllcy4gQW4gZW50cnkgaW4gdGhpcyBhcnJheSBjYW4gYmUgY3JlYXRlZCBmb3IgZGlmZmVyZW50IHJlYXNvbnM6XG4gICAqIC0gYW4gZWxlbWVudCBpdHNlbGYgaXMgcmVmZXJlbmNlZCwgZXguOiBgPGRpdiAjZm9vPmBcbiAgICogLSBhIGNvbXBvbmVudCBpcyByZWZlcmVuY2VkLCBleC46IGA8bXktY21wdCAjZm9vPmBcbiAgICogLSBhIGRpcmVjdGl2ZSBpcyByZWZlcmVuY2VkLCBleC46IGA8bXktY21wdCAjZm9vPVwiZGlyZWN0aXZlRXhwb3J0QXNcIj5gLlxuICAgKlxuICAgKiBBIGdpdmVuIGVsZW1lbnQgbWlnaHQgaGF2ZSBkaWZmZXJlbnQgbG9jYWwgbmFtZXMgYW5kIHRob3NlIG5hbWVzIGNhbiBiZSBhc3NvY2lhdGVkXG4gICAqIHdpdGggYSBkaXJlY3RpdmUuIFdlIHN0b3JlIGxvY2FsIG5hbWVzIGF0IGV2ZW4gaW5kZXhlcyB3aGlsZSBvZGQgaW5kZXhlcyBhcmUgcmVzZXJ2ZWRcbiAgICogZm9yIGRpcmVjdGl2ZSBpbmRleCBpbiBhIHZpZXcgKG9yIGAtMWAgaWYgdGhlcmUgaXMgbm8gYXNzb2NpYXRlZCBkaXJlY3RpdmUpLlxuICAgKlxuICAgKiBTb21lIGV4YW1wbGVzOlxuICAgKiAtIGA8ZGl2ICNmb28+YCA9PiBgW1wiZm9vXCIsIC0xXWBcbiAgICogLSBgPG15LWNtcHQgI2Zvbz5gID0+IGBbXCJmb29cIiwgbXlDbXB0SWR4XWBcbiAgICogLSBgPG15LWNtcHQgI2ZvbyAjYmFyPVwiZGlyZWN0aXZlRXhwb3J0QXNcIj5gID0+IGBbXCJmb29cIiwgbXlDbXB0SWR4LCBcImJhclwiLCBkaXJlY3RpdmVJZHhdYFxuICAgKiAtIGA8ZGl2ICNmb28gI2Jhcj1cImRpcmVjdGl2ZUV4cG9ydEFzXCI+YCA9PiBgW1wiZm9vXCIsIC0xLCBcImJhclwiLCBkaXJlY3RpdmVJZHhdYFxuICAgKi9cbiAgbG9jYWxOYW1lczogKHN0cmluZ3xudW1iZXIpW118bnVsbDtcblxuICAvKiogSW5mb3JtYXRpb24gYWJvdXQgaW5wdXQgcHJvcGVydGllcyB0aGF0IG5lZWQgdG8gYmUgc2V0IG9uY2UgZnJvbSBhdHRyaWJ1dGUgZGF0YS4gKi9cbiAgaW5pdGlhbElucHV0czogSW5pdGlhbElucHV0RGF0YXxudWxsfHVuZGVmaW5lZDtcblxuICAvKipcbiAgICogSW5wdXQgZGF0YSBmb3IgYWxsIGRpcmVjdGl2ZXMgb24gdGhpcyBub2RlLiBgbnVsbGAgbWVhbnMgdGhhdCB0aGVyZSBhcmUgbm8gZGlyZWN0aXZlcyB3aXRoXG4gICAqIGlucHV0cyBvbiB0aGlzIG5vZGUuXG4gICAqL1xuICBpbnB1dHM6IFByb3BlcnR5QWxpYXNlc3xudWxsO1xuXG4gIC8qKlxuICAgKiBPdXRwdXQgZGF0YSBmb3IgYWxsIGRpcmVjdGl2ZXMgb24gdGhpcyBub2RlLiBgbnVsbGAgbWVhbnMgdGhhdCB0aGVyZSBhcmUgbm8gZGlyZWN0aXZlcyB3aXRoXG4gICAqIG91dHB1dHMgb24gdGhpcyBub2RlLlxuICAgKi9cbiAgb3V0cHV0czogUHJvcGVydHlBbGlhc2VzfG51bGw7XG5cbiAgLyoqXG4gICAqIFRoZSBUVmlldyBvciBUVmlld3MgYXR0YWNoZWQgdG8gdGhpcyBub2RlLlxuICAgKlxuICAgKiBJZiB0aGlzIFROb2RlIGNvcnJlc3BvbmRzIHRvIGFuIExDb250YWluZXIgd2l0aCBpbmxpbmUgdmlld3MsIHRoZSBjb250YWluZXIgd2lsbFxuICAgKiBuZWVkIHRvIHN0b3JlIHNlcGFyYXRlIHN0YXRpYyBkYXRhIGZvciBlYWNoIG9mIGl0cyB2aWV3IGJsb2NrcyAoVFZpZXdbXSkuIE90aGVyd2lzZSxcbiAgICogbm9kZXMgaW4gaW5saW5lIHZpZXdzIHdpdGggdGhlIHNhbWUgaW5kZXggYXMgbm9kZXMgaW4gdGhlaXIgcGFyZW50IHZpZXdzIHdpbGwgb3ZlcndyaXRlXG4gICAqIGVhY2ggb3RoZXIsIGFzIHRoZXkgYXJlIGluIHRoZSBzYW1lIHRlbXBsYXRlLlxuICAgKlxuICAgKiBFYWNoIGluZGV4IGluIHRoaXMgYXJyYXkgY29ycmVzcG9uZHMgdG8gdGhlIHN0YXRpYyBkYXRhIGZvciBhIGNlcnRhaW5cbiAgICogdmlldy4gU28gaWYgeW91IGhhZCBWKDApIGFuZCBWKDEpIGluIGEgY29udGFpbmVyLCB5b3UgbWlnaHQgaGF2ZTpcbiAgICpcbiAgICogW1xuICAgKiAgIFt7dGFnTmFtZTogJ2RpdicsIGF0dHJzOiAuLi59LCBudWxsXSwgICAgIC8vIFYoMCkgVFZpZXdcbiAgICogICBbe3RhZ05hbWU6ICdidXR0b24nLCBhdHRycyAuLi59LCBudWxsXSAgICAvLyBWKDEpIFRWaWV3XG4gICAqXG4gICAqIElmIHRoaXMgVE5vZGUgY29ycmVzcG9uZHMgdG8gYW4gTENvbnRhaW5lciB3aXRoIGEgdGVtcGxhdGUgKGUuZy4gc3RydWN0dXJhbFxuICAgKiBkaXJlY3RpdmUpLCB0aGUgdGVtcGxhdGUncyBUVmlldyB3aWxsIGJlIHN0b3JlZCBoZXJlLlxuICAgKlxuICAgKiBJZiB0aGlzIFROb2RlIGNvcnJlc3BvbmRzIHRvIGFuIGVsZW1lbnQsIHRWaWV3cyB3aWxsIGJlIG51bGwgLlxuICAgKi9cbiAgdFZpZXdzOiBUVmlld3xUVmlld1tdfG51bGw7XG5cbiAgLyoqXG4gICAqIFRoZSBuZXh0IHNpYmxpbmcgbm9kZS4gTmVjZXNzYXJ5IHNvIHdlIGNhbiBwcm9wYWdhdGUgdGhyb3VnaCB0aGUgcm9vdCBub2RlcyBvZiBhIHZpZXdcbiAgICogdG8gaW5zZXJ0IHRoZW0gb3IgcmVtb3ZlIHRoZW0gZnJvbSB0aGUgRE9NLlxuICAgKi9cbiAgbmV4dDogVE5vZGV8bnVsbDtcblxuICAvKipcbiAgICogVGhlIG5leHQgcHJvamVjdGVkIHNpYmxpbmcuIFNpbmNlIGluIEFuZ3VsYXIgY29udGVudCBwcm9qZWN0aW9uIHdvcmtzIG9uIHRoZSBub2RlLWJ5LW5vZGUgYmFzaXNcbiAgICogdGhlIGFjdCBvZiBwcm9qZWN0aW5nIG5vZGVzIG1pZ2h0IGNoYW5nZSBub2RlcyByZWxhdGlvbnNoaXAgYXQgdGhlIGluc2VydGlvbiBwb2ludCAodGFyZ2V0XG4gICAqIHZpZXcpLiBBdCB0aGUgc2FtZSB0aW1lIHdlIG5lZWQgdG8ga2VlcCBpbml0aWFsIHJlbGF0aW9uc2hpcCBiZXR3ZWVuIG5vZGVzIGFzIGV4cHJlc3NlZCBpblxuICAgKiBjb250ZW50IHZpZXcuXG4gICAqL1xuICBwcm9qZWN0aW9uTmV4dDogVE5vZGV8bnVsbDtcblxuICAvKipcbiAgICogRmlyc3QgY2hpbGQgb2YgdGhlIGN1cnJlbnQgbm9kZS5cbiAgICpcbiAgICogRm9yIGNvbXBvbmVudCBub2RlcywgdGhlIGNoaWxkIHdpbGwgYWx3YXlzIGJlIGEgQ29udGVudENoaWxkIChpbiBzYW1lIHZpZXcpLlxuICAgKiBGb3IgZW1iZWRkZWQgdmlldyBub2RlcywgdGhlIGNoaWxkIHdpbGwgYmUgaW4gdGhlaXIgY2hpbGQgdmlldy5cbiAgICovXG4gIGNoaWxkOiBUTm9kZXxudWxsO1xuXG4gIC8qKlxuICAgKiBQYXJlbnQgbm9kZSAoaW4gdGhlIHNhbWUgdmlldyBvbmx5KS5cbiAgICpcbiAgICogV2UgbmVlZCBhIHJlZmVyZW5jZSB0byBhIG5vZGUncyBwYXJlbnQgc28gd2UgY2FuIGFwcGVuZCB0aGUgbm9kZSB0byBpdHMgcGFyZW50J3MgbmF0aXZlXG4gICAqIGVsZW1lbnQgYXQgdGhlIGFwcHJvcHJpYXRlIHRpbWUuXG4gICAqXG4gICAqIElmIHRoZSBwYXJlbnQgd291bGQgYmUgaW4gYSBkaWZmZXJlbnQgdmlldyAoZS5nLiBjb21wb25lbnQgaG9zdCksIHRoaXMgcHJvcGVydHkgd2lsbCBiZSBudWxsLlxuICAgKiBJdCdzIGltcG9ydGFudCB0aGF0IHdlIGRvbid0IHRyeSB0byBjcm9zcyBjb21wb25lbnQgYm91bmRhcmllcyB3aGVuIHJldHJpZXZpbmcgdGhlIHBhcmVudFxuICAgKiBiZWNhdXNlIHRoZSBwYXJlbnQgd2lsbCBjaGFuZ2UgKGUuZy4gaW5kZXgsIGF0dHJzKSBkZXBlbmRpbmcgb24gd2hlcmUgdGhlIGNvbXBvbmVudCB3YXNcbiAgICogdXNlZCAoYW5kIHRodXMgc2hvdWxkbid0IGJlIHN0b3JlZCBvbiBUTm9kZSkuIEluIHRoZXNlIGNhc2VzLCB3ZSByZXRyaWV2ZSB0aGUgcGFyZW50IHRocm91Z2hcbiAgICogTFZpZXcubm9kZSBpbnN0ZWFkICh3aGljaCB3aWxsIGJlIGluc3RhbmNlLXNwZWNpZmljKS5cbiAgICpcbiAgICogSWYgdGhpcyBpcyBhbiBpbmxpbmUgdmlldyBub2RlIChWKSwgdGhlIHBhcmVudCB3aWxsIGJlIGl0cyBjb250YWluZXIuXG4gICAqL1xuICBwYXJlbnQ6IFRFbGVtZW50Tm9kZXxUQ29udGFpbmVyTm9kZXxudWxsO1xuXG4gIC8qKlxuICAgKiBMaXN0IG9mIHByb2plY3RlZCBUTm9kZXMgZm9yIGEgZ2l2ZW4gY29tcG9uZW50IGhvc3QgZWxlbWVudCBPUiBpbmRleCBpbnRvIHRoZSBzYWlkIG5vZGVzLlxuICAgKlxuICAgKiBGb3IgZWFzaWVyIGRpc2N1c3Npb24gYXNzdW1lIHRoaXMgZXhhbXBsZTpcbiAgICogYDxwYXJlbnQ+YCdzIHZpZXcgZGVmaW5pdGlvbjpcbiAgICogYGBgXG4gICAqIDxjaGlsZCBpZD1cImMxXCI+Y29udGVudDE8L2NoaWxkPlxuICAgKiA8Y2hpbGQgaWQ9XCJjMlwiPjxzcGFuPmNvbnRlbnQyPC9zcGFuPjwvY2hpbGQ+XG4gICAqIGBgYFxuICAgKiBgPGNoaWxkPmAncyB2aWV3IGRlZmluaXRpb246XG4gICAqIGBgYFxuICAgKiA8bmctY29udGVudCBpZD1cImNvbnQxXCI+PC9uZy1jb250ZW50PlxuICAgKiBgYGBcbiAgICpcbiAgICogSWYgYEFycmF5LmlzQXJyYXkocHJvamVjdGlvbilgIHRoZW4gYFROb2RlYCBpcyBhIGhvc3QgZWxlbWVudDpcbiAgICogLSBgcHJvamVjdGlvbmAgc3RvcmVzIHRoZSBjb250ZW50IG5vZGVzIHdoaWNoIGFyZSB0byBiZSBwcm9qZWN0ZWQuXG4gICAqICAgIC0gVGhlIG5vZGVzIHJlcHJlc2VudCBjYXRlZ29yaWVzIGRlZmluZWQgYnkgdGhlIHNlbGVjdG9yOiBGb3IgZXhhbXBsZTpcbiAgICogICAgICBgPG5nLWNvbnRlbnQvPjxuZy1jb250ZW50IHNlbGVjdD1cImFiY1wiLz5gIHdvdWxkIHJlcHJlc2VudCB0aGUgaGVhZHMgZm9yIGA8bmctY29udGVudC8+YFxuICAgKiAgICAgIGFuZCBgPG5nLWNvbnRlbnQgc2VsZWN0PVwiYWJjXCIvPmAgcmVzcGVjdGl2ZWx5LlxuICAgKiAgICAtIFRoZSBub2RlcyB3ZSBzdG9yZSBpbiBgcHJvamVjdGlvbmAgYXJlIGhlYWRzIG9ubHksIHdlIHVzZWQgYC5uZXh0YCB0byBnZXQgdGhlaXJcbiAgICogICAgICBzaWJsaW5ncy5cbiAgICogICAgLSBUaGUgbm9kZXMgYC5uZXh0YCBpcyBzb3J0ZWQvcmV3cml0dGVuIGFzIHBhcnQgb2YgdGhlIHByb2plY3Rpb24gc2V0dXAuXG4gICAqICAgIC0gYHByb2plY3Rpb25gIHNpemUgaXMgZXF1YWwgdG8gdGhlIG51bWJlciBvZiBwcm9qZWN0aW9ucyBgPG5nLWNvbnRlbnQ+YC4gVGhlIHNpemUgb2ZcbiAgICogICAgICBgYzFgIHdpbGwgYmUgYDFgIGJlY2F1c2UgYDxjaGlsZD5gIGhhcyBvbmx5IG9uZSBgPG5nLWNvbnRlbnQ+YC5cbiAgICogLSB3ZSBzdG9yZSBgcHJvamVjdGlvbmAgd2l0aCB0aGUgaG9zdCAoYGMxYCwgYGMyYCkgcmF0aGVyIHRoYW4gdGhlIGA8bmctY29udGVudD5gIChgY29udDFgKVxuICAgKiAgIGJlY2F1c2UgdGhlIHNhbWUgY29tcG9uZW50IChgPGNoaWxkPmApIGNhbiBiZSB1c2VkIGluIG11bHRpcGxlIGxvY2F0aW9ucyAoYGMxYCwgYGMyYCkgYW5kIGFzXG4gICAqICAgYSByZXN1bHQgaGF2ZSBkaWZmZXJlbnQgc2V0IG9mIG5vZGVzIHRvIHByb2plY3QuXG4gICAqIC0gd2l0aG91dCBgcHJvamVjdGlvbmAgaXQgd291bGQgYmUgZGlmZmljdWx0IHRvIGVmZmljaWVudGx5IHRyYXZlcnNlIG5vZGVzIHRvIGJlIHByb2plY3RlZC5cbiAgICpcbiAgICogSWYgYHR5cGVvZiBwcm9qZWN0aW9uID09ICdudW1iZXInYCB0aGVuIGBUTm9kZWAgaXMgYSBgPG5nLWNvbnRlbnQ+YCBlbGVtZW50OlxuICAgKiAtIGBwcm9qZWN0aW9uYCBpcyBhbiBpbmRleCBvZiB0aGUgaG9zdCdzIGBwcm9qZWN0aW9uYE5vZGVzLlxuICAgKiAgIC0gVGhpcyB3b3VsZCByZXR1cm4gdGhlIGZpcnN0IGhlYWQgbm9kZSB0byBwcm9qZWN0OlxuICAgKiAgICAgYGdldEhvc3QoY3VycmVudFROb2RlKS5wcm9qZWN0aW9uW2N1cnJlbnRUTm9kZS5wcm9qZWN0aW9uXWAuXG4gICAqIC0gV2hlbiBwcm9qZWN0aW5nIG5vZGVzIHRoZSBwYXJlbnQgbm9kZSByZXRyaWV2ZWQgbWF5IGJlIGEgYDxuZy1jb250ZW50PmAgbm9kZSwgaW4gd2hpY2ggY2FzZVxuICAgKiAgIHRoZSBwcm9jZXNzIGlzIHJlY3Vyc2l2ZSBpbiBuYXR1cmUuXG4gICAqXG4gICAqIElmIGBwcm9qZWN0aW9uYCBpcyBvZiB0eXBlIGBSTm9kZVtdW11gIHRoYW4gd2UgaGF2ZSBhIGNvbGxlY3Rpb24gb2YgbmF0aXZlIG5vZGVzIHBhc3NlZCBhc1xuICAgKiBwcm9qZWN0YWJsZSBub2RlcyBkdXJpbmcgZHluYW1pYyBjb21wb25lbnQgY3JlYXRpb24uXG4gICAqL1xuICBwcm9qZWN0aW9uOiAoVE5vZGV8Uk5vZGVbXSlbXXxudW1iZXJ8bnVsbDtcblxuICAvKipcbiAgICogQSBjb2xsZWN0aW9uIG9mIGFsbCBzdHlsZSBzdGF0aWMgdmFsdWVzIGZvciBhbiBlbGVtZW50LlxuICAgKlxuICAgKiBUaGlzIGZpZWxkIHdpbGwgYmUgcG9wdWxhdGVkIGlmIGFuZCB3aGVuOlxuICAgKlxuICAgKiAtIFRoZXJlIGFyZSBvbmUgb3IgbW9yZSBpbml0aWFsIHN0eWxlcyBvbiBhbiBlbGVtZW50IChlLmcuIGA8ZGl2IHN0eWxlPVwid2lkdGg6MjAwcHhcIj5gKVxuICAgKi9cbiAgc3R5bGVzOiBzdHJpbmd8bnVsbDtcblxuICAvKipcbiAgICogQSBgS2V5VmFsdWVBcnJheWAgdmVyc2lvbiBvZiByZXNpZHVhbCBgc3R5bGVzYC5cbiAgICpcbiAgICogV2hlbiB0aGVyZSBhcmUgc3R5bGluZyBpbnN0cnVjdGlvbnMgdGhhbiBlYWNoIGluc3RydWN0aW9uIHN0b3JlcyB0aGUgc3RhdGljIHN0eWxpbmdcbiAgICogd2hpY2ggaXMgb2YgbG93ZXIgcHJpb3JpdHkgdGhhbiBpdHNlbGYuIFRoaXMgbWVhbnMgdGhhdCB0aGVyZSBtYXkgYmUgYSBoaWdoZXIgcHJpb3JpdHkgc3R5bGluZ1xuICAgKiB0aGFuIHRoZSBpbnN0cnVjdGlvbi5cbiAgICpcbiAgICogSW1hZ2luZTpcbiAgICogYGBgXG4gICAqIDxkaXYgc3R5bGU9XCJjb2xvcjogaGlnaGVzdDtcIiBteS1kaXI+XG4gICAqXG4gICAqIEBEaXJlY3RpdmUoe1xuICAgKiAgIGhvc3Q6IHtcbiAgICogICAgIHN0eWxlOiAnY29sb3I6IGxvd2VzdDsgJyxcbiAgICogICAgICdbc3R5bGVzLmNvbG9yXSc6ICdleHAnIC8vIMm1ybVzdHlsZVByb3AoJ2NvbG9yJywgY3R4LmV4cCk7XG4gICAqICAgfVxuICAgKiB9KVxuICAgKiBgYGBcbiAgICpcbiAgICogSW4gdGhlIGFib3ZlIGNhc2U6XG4gICAqIC0gYGNvbG9yOiBsb3dlc3RgIGlzIHN0b3JlZCB3aXRoIGDJtcm1c3R5bGVQcm9wKCdjb2xvcicsIGN0eC5leHApO2AgaW5zdHJ1Y3Rpb25cbiAgICogLSAgYGNvbG9yOiBoaWdoZXN0YCBpcyB0aGUgcmVzaWR1YWwgYW5kIGlzIHN0b3JlZCBoZXJlLlxuICAgKlxuICAgKiAtIGB1bmRlZmluZWQnOiBub3QgaW5pdGlhbGl6ZWQuXG4gICAqIC0gYG51bGxgOiBpbml0aWFsaXplZCBidXQgYHN0eWxlc2AgaXMgYG51bGxgXG4gICAqIC0gYEtleVZhbHVlQXJyYXlgOiBwYXJzZWQgdmVyc2lvbiBvZiBgc3R5bGVzYC5cbiAgICovXG4gIHJlc2lkdWFsU3R5bGVzOiBLZXlWYWx1ZUFycmF5PGFueT58dW5kZWZpbmVkfG51bGw7XG5cbiAgLyoqXG4gICAqIEEgY29sbGVjdGlvbiBvZiBhbGwgY2xhc3Mgc3RhdGljIHZhbHVlcyBmb3IgYW4gZWxlbWVudC5cbiAgICpcbiAgICogVGhpcyBmaWVsZCB3aWxsIGJlIHBvcHVsYXRlZCBpZiBhbmQgd2hlbjpcbiAgICpcbiAgICogLSBUaGVyZSBhcmUgb25lIG9yIG1vcmUgaW5pdGlhbCBjbGFzc2VzIG9uIGFuIGVsZW1lbnQgKGUuZy4gYDxkaXYgY2xhc3M9XCJvbmUgdHdvIHRocmVlXCI+YClcbiAgICovXG4gIGNsYXNzZXM6IHN0cmluZ3xudWxsO1xuXG4gIC8qKlxuICAgKiBBIGBLZXlWYWx1ZUFycmF5YCB2ZXJzaW9uIG9mIHJlc2lkdWFsIGBjbGFzc2VzYC5cbiAgICpcbiAgICogU2FtZSBhcyBgVE5vZGUucmVzaWR1YWxTdHlsZXNgIGJ1dCBmb3IgY2xhc3Nlcy5cbiAgICpcbiAgICogLSBgdW5kZWZpbmVkJzogbm90IGluaXRpYWxpemVkLlxuICAgKiAtIGBudWxsYDogaW5pdGlhbGl6ZWQgYnV0IGBjbGFzc2VzYCBpcyBgbnVsbGBcbiAgICogLSBgS2V5VmFsdWVBcnJheWA6IHBhcnNlZCB2ZXJzaW9uIG9mIGBjbGFzc2VzYC5cbiAgICovXG4gIHJlc2lkdWFsQ2xhc3NlczogS2V5VmFsdWVBcnJheTxhbnk+fHVuZGVmaW5lZHxudWxsO1xuXG4gIC8qKlxuICAgKiBTdG9yZXMgdGhlIGhlYWQvdGFpbCBpbmRleCBvZiB0aGUgY2xhc3MgYmluZGluZ3MuXG4gICAqXG4gICAqIC0gSWYgbm8gYmluZGluZ3MsIHRoZSBoZWFkIGFuZCB0YWlsIHdpbGwgYm90aCBiZSAwLlxuICAgKiAtIElmIHRoZXJlIGFyZSB0ZW1wbGF0ZSBiaW5kaW5ncywgc3RvcmVzIHRoZSBoZWFkL3RhaWwgb2YgdGhlIGNsYXNzIGJpbmRpbmdzIGluIHRoZSB0ZW1wbGF0ZS5cbiAgICogLSBJZiBubyB0ZW1wbGF0ZSBiaW5kaW5ncyBidXQgdGhlcmUgYXJlIGhvc3QgYmluZGluZ3MsIHRoZSBoZWFkIHZhbHVlIHdpbGwgcG9pbnQgdG8gdGhlIGxhc3RcbiAgICogICBob3N0IGJpbmRpbmcgZm9yIFwiY2xhc3NcIiAobm90IHRoZSBoZWFkIG9mIHRoZSBsaW5rZWQgbGlzdCksIHRhaWwgd2lsbCBiZSAwLlxuICAgKlxuICAgKiBTZWU6IGBzdHlsZV9iaW5kaW5nX2xpc3QudHNgIGZvciBkZXRhaWxzLlxuICAgKlxuICAgKiBUaGlzIGlzIHVzZWQgYnkgYGluc2VydFRTdHlsaW5nQmluZGluZ2AgdG8ga25vdyB3aGVyZSB0aGUgbmV4dCBzdHlsaW5nIGJpbmRpbmcgc2hvdWxkIGJlXG4gICAqIGluc2VydGVkIHNvIHRoYXQgdGhleSBjYW4gYmUgc29ydGVkIGluIHByaW9yaXR5IG9yZGVyLlxuICAgKi9cbiAgY2xhc3NCaW5kaW5nczogVFN0eWxpbmdSYW5nZTtcblxuICAvKipcbiAgICogU3RvcmVzIHRoZSBoZWFkL3RhaWwgaW5kZXggb2YgdGhlIGNsYXNzIGJpbmRpbmdzLlxuICAgKlxuICAgKiAtIElmIG5vIGJpbmRpbmdzLCB0aGUgaGVhZCBhbmQgdGFpbCB3aWxsIGJvdGggYmUgMC5cbiAgICogLSBJZiB0aGVyZSBhcmUgdGVtcGxhdGUgYmluZGluZ3MsIHN0b3JlcyB0aGUgaGVhZC90YWlsIG9mIHRoZSBzdHlsZSBiaW5kaW5ncyBpbiB0aGUgdGVtcGxhdGUuXG4gICAqIC0gSWYgbm8gdGVtcGxhdGUgYmluZGluZ3MgYnV0IHRoZXJlIGFyZSBob3N0IGJpbmRpbmdzLCB0aGUgaGVhZCB2YWx1ZSB3aWxsIHBvaW50IHRvIHRoZSBsYXN0XG4gICAqICAgaG9zdCBiaW5kaW5nIGZvciBcInN0eWxlXCIgKG5vdCB0aGUgaGVhZCBvZiB0aGUgbGlua2VkIGxpc3QpLCB0YWlsIHdpbGwgYmUgMC5cbiAgICpcbiAgICogU2VlOiBgc3R5bGVfYmluZGluZ19saXN0LnRzYCBmb3IgZGV0YWlscy5cbiAgICpcbiAgICogVGhpcyBpcyB1c2VkIGJ5IGBpbnNlcnRUU3R5bGluZ0JpbmRpbmdgIHRvIGtub3cgd2hlcmUgdGhlIG5leHQgc3R5bGluZyBiaW5kaW5nIHNob3VsZCBiZVxuICAgKiBpbnNlcnRlZCBzbyB0aGF0IHRoZXkgY2FuIGJlIHNvcnRlZCBpbiBwcmlvcml0eSBvcmRlci5cbiAgICovXG4gIHN0eWxlQmluZGluZ3M6IFRTdHlsaW5nUmFuZ2U7XG59XG5cbi8qKiBTdGF0aWMgZGF0YSBmb3IgYW4gZWxlbWVudCAgKi9cbmV4cG9ydCBpbnRlcmZhY2UgVEVsZW1lbnROb2RlIGV4dGVuZHMgVE5vZGUge1xuICAvKiogSW5kZXggaW4gdGhlIGRhdGFbXSBhcnJheSAqL1xuICBpbmRleDogbnVtYmVyO1xuICBjaGlsZDogVEVsZW1lbnROb2RlfFRUZXh0Tm9kZXxURWxlbWVudENvbnRhaW5lck5vZGV8VENvbnRhaW5lck5vZGV8VFByb2plY3Rpb25Ob2RlfG51bGw7XG4gIC8qKlxuICAgKiBFbGVtZW50IG5vZGVzIHdpbGwgaGF2ZSBwYXJlbnRzIHVubGVzcyB0aGV5IGFyZSB0aGUgZmlyc3Qgbm9kZSBvZiBhIGNvbXBvbmVudCBvclxuICAgKiBlbWJlZGRlZCB2aWV3ICh3aGljaCBtZWFucyB0aGVpciBwYXJlbnQgaXMgaW4gYSBkaWZmZXJlbnQgdmlldyBhbmQgbXVzdCBiZVxuICAgKiByZXRyaWV2ZWQgdXNpbmcgdmlld0RhdGFbSE9TVF9OT0RFXSkuXG4gICAqL1xuICBwYXJlbnQ6IFRFbGVtZW50Tm9kZXxURWxlbWVudENvbnRhaW5lck5vZGV8bnVsbDtcbiAgdFZpZXdzOiBudWxsO1xuXG4gIC8qKlxuICAgKiBJZiB0aGlzIGlzIGEgY29tcG9uZW50IFROb2RlIHdpdGggcHJvamVjdGlvbiwgdGhpcyB3aWxsIGJlIGFuIGFycmF5IG9mIHByb2plY3RlZFxuICAgKiBUTm9kZXMgb3IgbmF0aXZlIG5vZGVzIChzZWUgVE5vZGUucHJvamVjdGlvbiBmb3IgbW9yZSBpbmZvKS4gSWYgaXQncyBhIHJlZ3VsYXIgZWxlbWVudCBub2RlIG9yXG4gICAqIGEgY29tcG9uZW50IHdpdGhvdXQgcHJvamVjdGlvbiwgaXQgd2lsbCBiZSBudWxsLlxuICAgKi9cbiAgcHJvamVjdGlvbjogKFROb2RlfFJOb2RlW10pW118bnVsbDtcbn1cblxuLyoqIFN0YXRpYyBkYXRhIGZvciBhIHRleHQgbm9kZSAqL1xuZXhwb3J0IGludGVyZmFjZSBUVGV4dE5vZGUgZXh0ZW5kcyBUTm9kZSB7XG4gIC8qKiBJbmRleCBpbiB0aGUgZGF0YVtdIGFycmF5ICovXG4gIGluZGV4OiBudW1iZXI7XG4gIGNoaWxkOiBudWxsO1xuICAvKipcbiAgICogVGV4dCBub2RlcyB3aWxsIGhhdmUgcGFyZW50cyB1bmxlc3MgdGhleSBhcmUgdGhlIGZpcnN0IG5vZGUgb2YgYSBjb21wb25lbnQgb3JcbiAgICogZW1iZWRkZWQgdmlldyAod2hpY2ggbWVhbnMgdGhlaXIgcGFyZW50IGlzIGluIGEgZGlmZmVyZW50IHZpZXcgYW5kIG11c3QgYmVcbiAgICogcmV0cmlldmVkIHVzaW5nIExWaWV3Lm5vZGUpLlxuICAgKi9cbiAgcGFyZW50OiBURWxlbWVudE5vZGV8VEVsZW1lbnRDb250YWluZXJOb2RlfG51bGw7XG4gIHRWaWV3czogbnVsbDtcbiAgcHJvamVjdGlvbjogbnVsbDtcbn1cblxuLyoqIFN0YXRpYyBkYXRhIGZvciBhbiBMQ29udGFpbmVyICovXG5leHBvcnQgaW50ZXJmYWNlIFRDb250YWluZXJOb2RlIGV4dGVuZHMgVE5vZGUge1xuICAvKipcbiAgICogSW5kZXggaW4gdGhlIGRhdGFbXSBhcnJheS5cbiAgICpcbiAgICogSWYgaXQncyAtMSwgdGhpcyBpcyBhIGR5bmFtaWNhbGx5IGNyZWF0ZWQgY29udGFpbmVyIG5vZGUgdGhhdCBpc24ndCBzdG9yZWQgaW5cbiAgICogZGF0YVtdIChlLmcuIHdoZW4geW91IGluamVjdCBWaWV3Q29udGFpbmVyUmVmKSAuXG4gICAqL1xuICBpbmRleDogbnVtYmVyO1xuICBjaGlsZDogbnVsbDtcblxuICAvKipcbiAgICogQ29udGFpbmVyIG5vZGVzIHdpbGwgaGF2ZSBwYXJlbnRzIHVubGVzczpcbiAgICpcbiAgICogLSBUaGV5IGFyZSB0aGUgZmlyc3Qgbm9kZSBvZiBhIGNvbXBvbmVudCBvciBlbWJlZGRlZCB2aWV3XG4gICAqIC0gVGhleSBhcmUgZHluYW1pY2FsbHkgY3JlYXRlZFxuICAgKi9cbiAgcGFyZW50OiBURWxlbWVudE5vZGV8VEVsZW1lbnRDb250YWluZXJOb2RlfG51bGw7XG4gIHRWaWV3czogVFZpZXd8VFZpZXdbXXxudWxsO1xuICBwcm9qZWN0aW9uOiBudWxsO1xufVxuXG4vKiogU3RhdGljIGRhdGEgZm9yIGFuIDxuZy1jb250YWluZXI+ICovXG5leHBvcnQgaW50ZXJmYWNlIFRFbGVtZW50Q29udGFpbmVyTm9kZSBleHRlbmRzIFROb2RlIHtcbiAgLyoqIEluZGV4IGluIHRoZSBMVmlld1tdIGFycmF5LiAqL1xuICBpbmRleDogbnVtYmVyO1xuICBjaGlsZDogVEVsZW1lbnROb2RlfFRUZXh0Tm9kZXxUQ29udGFpbmVyTm9kZXxURWxlbWVudENvbnRhaW5lck5vZGV8VFByb2plY3Rpb25Ob2RlfG51bGw7XG4gIHBhcmVudDogVEVsZW1lbnROb2RlfFRFbGVtZW50Q29udGFpbmVyTm9kZXxudWxsO1xuICB0Vmlld3M6IG51bGw7XG4gIHByb2plY3Rpb246IG51bGw7XG59XG5cbi8qKiBTdGF0aWMgZGF0YSBmb3IgYW4gSUNVIGV4cHJlc3Npb24gKi9cbmV4cG9ydCBpbnRlcmZhY2UgVEljdUNvbnRhaW5lck5vZGUgZXh0ZW5kcyBUTm9kZSB7XG4gIC8qKiBJbmRleCBpbiB0aGUgTFZpZXdbXSBhcnJheS4gKi9cbiAgaW5kZXg6IG51bWJlcjtcbiAgY2hpbGQ6IFRFbGVtZW50Tm9kZXxUVGV4dE5vZGV8bnVsbDtcbiAgcGFyZW50OiBURWxlbWVudE5vZGV8VEVsZW1lbnRDb250YWluZXJOb2RlfG51bGw7XG4gIHRWaWV3czogbnVsbDtcbiAgcHJvamVjdGlvbjogbnVsbDtcbiAgLyoqXG4gICAqIEluZGljYXRlcyB0aGUgY3VycmVudCBhY3RpdmUgY2FzZSBmb3IgYW4gSUNVIGV4cHJlc3Npb24uXG4gICAqIEl0IGlzIG51bGwgd2hlbiB0aGVyZSBpcyBubyBhY3RpdmUgY2FzZS5cbiAgICovXG4gIGFjdGl2ZUNhc2VJbmRleDogbnVtYmVyfG51bGw7XG59XG5cbi8qKiBTdGF0aWMgZGF0YSBmb3IgYSB2aWV3ICAqL1xuZXhwb3J0IGludGVyZmFjZSBUVmlld05vZGUgZXh0ZW5kcyBUTm9kZSB7XG4gIC8qKiBJZiAtMSwgaXQncyBhIGR5bmFtaWNhbGx5IGNyZWF0ZWQgdmlldy4gT3RoZXJ3aXNlLCBpdCBpcyB0aGUgdmlldyBibG9jayBJRC4gKi9cbiAgaW5kZXg6IG51bWJlcjtcbiAgY2hpbGQ6IFRFbGVtZW50Tm9kZXxUVGV4dE5vZGV8VEVsZW1lbnRDb250YWluZXJOb2RlfFRDb250YWluZXJOb2RlfFRQcm9qZWN0aW9uTm9kZXxudWxsO1xuICBwYXJlbnQ6IFRDb250YWluZXJOb2RlfG51bGw7XG4gIHRWaWV3czogbnVsbDtcbiAgcHJvamVjdGlvbjogbnVsbDtcbn1cblxuLyoqIFN0YXRpYyBkYXRhIGZvciBhbiBMUHJvamVjdGlvbk5vZGUgICovXG5leHBvcnQgaW50ZXJmYWNlIFRQcm9qZWN0aW9uTm9kZSBleHRlbmRzIFROb2RlIHtcbiAgLyoqIEluZGV4IGluIHRoZSBkYXRhW10gYXJyYXkgKi9cbiAgY2hpbGQ6IG51bGw7XG4gIC8qKlxuICAgKiBQcm9qZWN0aW9uIG5vZGVzIHdpbGwgaGF2ZSBwYXJlbnRzIHVubGVzcyB0aGV5IGFyZSB0aGUgZmlyc3Qgbm9kZSBvZiBhIGNvbXBvbmVudFxuICAgKiBvciBlbWJlZGRlZCB2aWV3ICh3aGljaCBtZWFucyB0aGVpciBwYXJlbnQgaXMgaW4gYSBkaWZmZXJlbnQgdmlldyBhbmQgbXVzdCBiZVxuICAgKiByZXRyaWV2ZWQgdXNpbmcgTFZpZXcubm9kZSkuXG4gICAqL1xuICBwYXJlbnQ6IFRFbGVtZW50Tm9kZXxURWxlbWVudENvbnRhaW5lck5vZGV8bnVsbDtcbiAgdFZpZXdzOiBudWxsO1xuXG4gIC8qKiBJbmRleCBvZiB0aGUgcHJvamVjdGlvbiBub2RlLiAoU2VlIFROb2RlLnByb2plY3Rpb24gZm9yIG1vcmUgaW5mby4pICovXG4gIHByb2plY3Rpb246IG51bWJlcjtcbn1cblxuLyoqXG4gKiBBIHVuaW9uIHR5cGUgcmVwcmVzZW50aW5nIGFsbCBUTm9kZSB0eXBlcyB0aGF0IGNhbiBob3N0IGEgZGlyZWN0aXZlLlxuICovXG5leHBvcnQgdHlwZSBURGlyZWN0aXZlSG9zdE5vZGUgPSBURWxlbWVudE5vZGUgfCBUQ29udGFpbmVyTm9kZSB8IFRFbGVtZW50Q29udGFpbmVyTm9kZTtcblxuLyoqXG4gKiBUaGlzIG1hcHBpbmcgaXMgbmVjZXNzYXJ5IHNvIHdlIGNhbiBzZXQgaW5wdXQgcHJvcGVydGllcyBhbmQgb3V0cHV0IGxpc3RlbmVyc1xuICogcHJvcGVybHkgYXQgcnVudGltZSB3aGVuIHByb3BlcnR5IG5hbWVzIGFyZSBtaW5pZmllZCBvciBhbGlhc2VkLlxuICpcbiAqIEtleTogdW5taW5pZmllZCAvIHB1YmxpYyBpbnB1dCBvciBvdXRwdXQgbmFtZVxuICogVmFsdWU6IGFycmF5IGNvbnRhaW5pbmcgbWluaWZpZWQgLyBpbnRlcm5hbCBuYW1lIGFuZCByZWxhdGVkIGRpcmVjdGl2ZSBpbmRleFxuICpcbiAqIFRoZSB2YWx1ZSBtdXN0IGJlIGFuIGFycmF5IHRvIHN1cHBvcnQgaW5wdXRzIGFuZCBvdXRwdXRzIHdpdGggdGhlIHNhbWUgbmFtZVxuICogb24gdGhlIHNhbWUgbm9kZS5cbiAqL1xuZXhwb3J0IHR5cGUgUHJvcGVydHlBbGlhc2VzID0ge1xuICAvLyBUaGlzIHVzZXMgYW4gb2JqZWN0IG1hcCBiZWNhdXNlIHVzaW5nIHRoZSBNYXAgdHlwZSB3b3VsZCBiZSB0b28gc2xvd1xuICBba2V5OiBzdHJpbmddOiBQcm9wZXJ0eUFsaWFzVmFsdWVcbn07XG5cbi8qKlxuICogU3RvcmUgdGhlIHJ1bnRpbWUgaW5wdXQgb3Igb3V0cHV0IG5hbWVzIGZvciBhbGwgdGhlIGRpcmVjdGl2ZXMuXG4gKlxuICogaSswOiBkaXJlY3RpdmUgaW5zdGFuY2UgaW5kZXhcbiAqIGkrMTogcHJpdmF0ZU5hbWVcbiAqXG4gKiBlLmcuIFswLCAnY2hhbmdlLW1pbmlmaWVkJ11cbiAqL1xuZXhwb3J0IHR5cGUgUHJvcGVydHlBbGlhc1ZhbHVlID0gKG51bWJlciB8IHN0cmluZylbXTtcblxuLyoqXG4gKiBUaGlzIGFycmF5IGNvbnRhaW5zIGluZm9ybWF0aW9uIGFib3V0IGlucHV0IHByb3BlcnRpZXMgdGhhdFxuICogbmVlZCB0byBiZSBzZXQgb25jZSBmcm9tIGF0dHJpYnV0ZSBkYXRhLiBJdCdzIG9yZGVyZWQgYnlcbiAqIGRpcmVjdGl2ZSBpbmRleCAocmVsYXRpdmUgdG8gZWxlbWVudCkgc28gaXQncyBzaW1wbGUgdG9cbiAqIGxvb2sgdXAgYSBzcGVjaWZpYyBkaXJlY3RpdmUncyBpbml0aWFsIGlucHV0IGRhdGEuXG4gKlxuICogV2l0aGluIGVhY2ggc3ViLWFycmF5OlxuICpcbiAqIGkrMDogYXR0cmlidXRlIG5hbWVcbiAqIGkrMTogbWluaWZpZWQvaW50ZXJuYWwgaW5wdXQgbmFtZVxuICogaSsyOiBpbml0aWFsIHZhbHVlXG4gKlxuICogSWYgYSBkaXJlY3RpdmUgb24gYSBub2RlIGRvZXMgbm90IGhhdmUgYW55IGlucHV0IHByb3BlcnRpZXNcbiAqIHRoYXQgc2hvdWxkIGJlIHNldCBmcm9tIGF0dHJpYnV0ZXMsIGl0cyBpbmRleCBpcyBzZXQgdG8gbnVsbFxuICogdG8gYXZvaWQgYSBzcGFyc2UgYXJyYXkuXG4gKlxuICogZS5nLiBbbnVsbCwgWydyb2xlLW1pbicsICdtaW5pZmllZC1pbnB1dCcsICdidXR0b24nXV1cbiAqL1xuZXhwb3J0IHR5cGUgSW5pdGlhbElucHV0RGF0YSA9IChJbml0aWFsSW5wdXRzIHwgbnVsbClbXTtcblxuLyoqXG4gKiBVc2VkIGJ5IEluaXRpYWxJbnB1dERhdGEgdG8gc3RvcmUgaW5wdXQgcHJvcGVydGllc1xuICogdGhhdCBzaG91bGQgYmUgc2V0IG9uY2UgZnJvbSBhdHRyaWJ1dGVzLlxuICpcbiAqIGkrMDogYXR0cmlidXRlIG5hbWVcbiAqIGkrMTogbWluaWZpZWQvaW50ZXJuYWwgaW5wdXQgbmFtZVxuICogaSsyOiBpbml0aWFsIHZhbHVlXG4gKlxuICogZS5nLiBbJ3JvbGUtbWluJywgJ21pbmlmaWVkLWlucHV0JywgJ2J1dHRvbiddXG4gKi9cbmV4cG9ydCB0eXBlIEluaXRpYWxJbnB1dHMgPSBzdHJpbmdbXTtcblxuLy8gTm90ZTogVGhpcyBoYWNrIGlzIG5lY2Vzc2FyeSBzbyB3ZSBkb24ndCBlcnJvbmVvdXNseSBnZXQgYSBjaXJjdWxhciBkZXBlbmRlbmN5XG4vLyBmYWlsdXJlIGJhc2VkIG9uIHR5cGVzLlxuZXhwb3J0IGNvbnN0IHVudXNlZFZhbHVlRXhwb3J0VG9QbGFjYXRlQWpkID0gMTtcblxuLyoqXG4gKiBUeXBlIHJlcHJlc2VudGluZyBhIHNldCBvZiBUTm9kZXMgdGhhdCBjYW4gaGF2ZSBsb2NhbCByZWZzIChgI2Zvb2ApIHBsYWNlZCBvbiB0aGVtLlxuICovXG5leHBvcnQgdHlwZSBUTm9kZVdpdGhMb2NhbFJlZnMgPSBUQ29udGFpbmVyTm9kZSB8IFRFbGVtZW50Tm9kZSB8IFRFbGVtZW50Q29udGFpbmVyTm9kZTtcblxuLyoqXG4gKiBUeXBlIGZvciBhIGZ1bmN0aW9uIHRoYXQgZXh0cmFjdHMgYSB2YWx1ZSBmb3IgYSBsb2NhbCByZWZzLlxuICogRXhhbXBsZTpcbiAqIC0gYDxkaXYgI25hdGl2ZURpdkVsPmAgLSBgbmF0aXZlRGl2RWxgIHNob3VsZCBwb2ludCB0byB0aGUgbmF0aXZlIGA8ZGl2PmAgZWxlbWVudDtcbiAqIC0gYDxuZy10ZW1wbGF0ZSAjdHBsUmVmPmAgLSBgdHBsUmVmYCBzaG91bGQgcG9pbnQgdG8gdGhlIGBUZW1wbGF0ZVJlZmAgaW5zdGFuY2U7XG4gKi9cbmV4cG9ydCB0eXBlIExvY2FsUmVmRXh0cmFjdG9yID0gKHROb2RlOiBUTm9kZVdpdGhMb2NhbFJlZnMsIGN1cnJlbnRWaWV3OiBMVmlldykgPT4gYW55O1xuXG4vKipcbiAqIFJldHVybnMgYHRydWVgIGlmIHRoZSBgVE5vZGVgIGhhcyBhIGRpcmVjdGl2ZSB3aGljaCBoYXMgYEBJbnB1dCgpYCBmb3IgYGNsYXNzYCBiaW5kaW5nLlxuICpcbiAqIGBgYFxuICogPGRpdiBteS1kaXIgW2NsYXNzXT1cImV4cFwiPjwvZGl2PlxuICogYGBgXG4gKiBhbmRcbiAqIGBgYFxuICogQERpcmVjdGl2ZSh7XG4gKiB9KVxuICogY2xhc3MgTXlEaXJlY3RpdmUge1xuICogICBASW5wdXQoKVxuICogICBjbGFzczogc3RyaW5nO1xuICogfVxuICogYGBgXG4gKlxuICogSW4gdGhlIGFib3ZlIGNhc2UgaXQgaXMgbmVjZXNzYXJ5IHRvIHdyaXRlIHRoZSByZWNvbmNpbGVkIHN0eWxpbmcgaW5mb3JtYXRpb24gaW50byB0aGVcbiAqIGRpcmVjdGl2ZSdzIGlucHV0LlxuICpcbiAqIEBwYXJhbSB0Tm9kZVxuICovXG5leHBvcnQgZnVuY3Rpb24gaGFzQ2xhc3NJbnB1dCh0Tm9kZTogVE5vZGUpIHtcbiAgcmV0dXJuICh0Tm9kZS5mbGFncyAmIFROb2RlRmxhZ3MuaGFzQ2xhc3NJbnB1dCkgIT09IDA7XG59XG5cbi8qKlxuICogUmV0dXJucyBgdHJ1ZWAgaWYgdGhlIGBUTm9kZWAgaGFzIGEgZGlyZWN0aXZlIHdoaWNoIGhhcyBgQElucHV0KClgIGZvciBgc3R5bGVgIGJpbmRpbmcuXG4gKlxuICogYGBgXG4gKiA8ZGl2IG15LWRpciBbc3R5bGVdPVwiZXhwXCI+PC9kaXY+XG4gKiBgYGBcbiAqIGFuZFxuICogYGBgXG4gKiBARGlyZWN0aXZlKHtcbiAqIH0pXG4gKiBjbGFzcyBNeURpcmVjdGl2ZSB7XG4gKiAgIEBJbnB1dCgpXG4gKiAgIGNsYXNzOiBzdHJpbmc7XG4gKiB9XG4gKiBgYGBcbiAqXG4gKiBJbiB0aGUgYWJvdmUgY2FzZSBpdCBpcyBuZWNlc3NhcnkgdG8gd3JpdGUgdGhlIHJlY29uY2lsZWQgc3R5bGluZyBpbmZvcm1hdGlvbiBpbnRvIHRoZVxuICogZGlyZWN0aXZlJ3MgaW5wdXQuXG4gKlxuICogQHBhcmFtIHROb2RlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBoYXNTdHlsZUlucHV0KHROb2RlOiBUTm9kZSkge1xuICByZXR1cm4gKHROb2RlLmZsYWdzICYgVE5vZGVGbGFncy5oYXNTdHlsZUlucHV0KSAhPT0gMDtcbn1cblxuLyoqXG4gKiBDb25zdGFudCBlbnVtcyBmb3IgYWNjZXNzaW5nIGRhdGEgaW4gdGhlIGBURGlyZWN0aXZlRGVmc2BcbiAqL1xuZXhwb3J0IGNvbnN0IGVudW0gRGlyZWN0aXZlRGVmcyB7XG4gIC8vLyBMb2NhdGlvbiB3aGVyZSB0aGUgU1RZTElOR19DVVJTT1IgaXMgc3RvcmVkLlxuICBTVFlMSU5HX0NVUlNPUiA9IDAsXG4gIC8vLyBIZWFkZXIgb2Zmc2V0IGZyb20gd2hpY2ggaXRlcmF0aW5nIG92ZXIgYERpcmVjdGl2ZURlZnNgIHNob3VsZCBzdGFydC5cbiAgSEVBREVSX09GRlNFVCA9IDFcbn1cblxuLyoqXG4gKiBDb25zdGFudCBlbnVtcyBmb3IgaW5pdGlhbCB2YWx1ZXMgaW4gdGhlIGBURGlyZWN0aXZlRGVmc2BcbiAqL1xuZXhwb3J0IGNvbnN0IGVudW0gRGlyZWN0aXZlRGVmc1ZhbHVlcyB7XG4gIC8vIEluaXRpYWwgdmFsdWUgZm9yIHRoZSBgU1RZTElOR19DVVJTT1JgXG4gIElOSVRJQUxfU1RZTElOR19DVVJTT1JfVkFMVUUgPSAwLFxufVxuXG4vKipcbiAqIFN0b3JlcyBgRGlyZWN0aXZlRGVmc2AgYXNzb2NpYXRlZCB3aXRoIHRoZSBjdXJyZW50IGBUTm9kZWAgYXMgd2VsbCBhcyBzdHlsaW5nIGN1cnNvci5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBURGlyZWN0aXZlRGVmcyBleHRlbmRzIEFycmF5PG51bWJlcnxEaXJlY3RpdmVEZWY8YW55Pj4ge1xuICAvKipcbiAgICogQXMgc3R5bGluZyBpbnN0cnVjdGlvbnMgKGDJtcm1c3R5bGVQcm9wYC9gybXJtWNsYXNzUHJvcGAvYMm1ybVzdHlsZU1hcGAvYMm1ybVjbGFzc01hcGApIGFyZSBleGVjdXRpbmdcbiAgICogdGhleSBhbHNvIG5lZWQgdG8gZ2V0IGEgaG9sZCBvZiB0aGUgYERpcmVjdGl2ZURlZi5ob3N0QXR0cnNgIGFuZCBzbyB0aGF0IHRoZXkga25vdyB3aGF0XG4gICAqIHN0YXRpYyBzdHlsaW5nIHZhbHVlcyB0byB1c2UuIFRoZSBzdHlsaW5nIGluc3RydWN0aW9ucyBuZWVkIHRoaXMgaW5mb3JtYXRpb24gc28gdGhhdCB0aGV5IGNhblxuICAgKiBsYXppbHkgY3JlYXRlIGBUU3R5bGluZ1N0YXRpY2AuXG4gICAqXG4gICAqIFdoZW4gc3R5bGluZyBpcyBleGVjdXRpbmcgaXQgY2FuIGdldCBhIGhvbGQgb2YgaXRzIGBEaXJlY3RpdmVEZWZzYCBidXQgdGhhdCBhbG9uZSBpcyBub3RcbiAgICogc3VmZmljaWVudCBmb3IgdHdvIHJlYXNvbnM6XG4gICAqIDEuIFN0eWxpbmcgaW5zdHJ1Y3Rpb24gbmVlZHMgdG8gY29hbGVzY2Ugb3RoZXIgZGlyZWN0aXZlcyB3aGljaCBjYW1lIGJlZm9yZSBpdCBhbmQgd2hpY2ggaGF2ZVxuICAgKiAgICBzdGF0aWMgdmFsdWUgYnV0IG1heSBub3QgaGF2ZSBhIHN0eWxpbmcgaW5zdHJ1Y3Rpb24gdG8gYXR0YWNoIHRoZSBzdGF0aWMgdmFsdWVzIHRvLlxuICAgKiAyLiBUaGVyZSBtYXkgYmUgbW9yZSB0aGFuIG9uZSBzdHlsaW5nIGluc3RydWN0aW9uIHBlciBgaG9zdEJpbmRpbmdzYCBhbmQgb25seSB0aGUgZmlyc3RcbiAgICogICAgc3R5bGluZyBpbnN0cnVjdGlvbiBzaG91bGQgY3JlYXRlIHRoZSBgVFN0eWxpbmdTdGF0aWNgLlxuICAgKlxuICAgKiBUaGUgYWxnb3JpdGhtIGZvciBkb2luZyB0aGlzIGlzOlxuICAgKiAtIGxvb2sgdXAgdGhlIGN1cnJlbnQgYERpcmVjdGl2ZURlZmAgYXNzb2NpYXRlZCB3aXRoIHRoZSBjdXJyZW50IGluc3RydWN0aW9uLlxuICAgKiAtIElmIGBTVFlMSU5HX0NVUlNPUiA9PT0gMCB8fCB0RGlyZWN0aXZlRGVmc1tzdHlsaW5nQ3Vyc29yXSAhPT0gY3VycmVudERpcmVjdGl2ZURlZmAgdGhhblxuICAgKiAgIGNyZWF0ZSBgVFN0eWxpbmdTdGF0aWNgIGFuZDpcbiAgICogICAtIGl0ZXJhdGUgb3ZlciBgVERpcmVjdGl2ZURlZnNbKytzdHlsaW5nQ3Vyc29yXWAgYW5kIGluc2VydCB0aGVtIGludG8gdGhlIGBUU3R5bGluZ1N0YXRpY2BcbiAgICogICAgIHVudGlsIHlvdSByZWFjaCBgRGlyZWN0aXZlRGVmYCBhc3NvY2lhdGVkIHdpdGggdGhlIGN1cnJlbnQgaW5zdHJ1Y3Rpb24uXG4gICAqIC0gSWYgbmV3IGBUU3R5bGluZ1N0YXRpY2Agd2FzIGNyZWF0ZWQsIHJlY29tcHV0ZSB0aGUgcmVzaWR1YWwgc3R5bGluZyB2YWx1ZXMuXG4gICAqXG4gICAqIFRoZSBhYm92ZSBhbGdvcml0aG0gd2lsbCBlbnN1cmUgdGhhdCB0aGUgc3R5bGluZyBpbnN0cnVjdGlvbnMgY29uc3VtZSBzdGF0aWMgc3R5bGluZyB2YWx1ZXNcbiAgICogYXNzb2NpYXRlZCB1bnRpbCBhIGdpdmVuIGluc3RydWN0aW9uLiBBZnRlciBjb25zdW1pbmcgaW5zdHJ1Y3Rpb25zLCBpdCBpcyBhbHdheXMgaW1wb3J0YW50IHRvXG4gICAqIGNsZWFyIHRoZSByZXNpZHVhbCAoU2VlIGBUTm9kZS5yZXNpZHVhbENsYXNzYC9gVE5vZGUucmVzaWR1YWxTdHlsZWApLCBzaW5jZSB0aGlzIG1heSBiZSB0aGVcbiAgICogbGFzdCBzdHlsaW5nIGluc3RydWN0aW9uLCBhbmQgd2UgbmVlZCB0byBsYXppbHkgcmVjcmVhdGUgdGhlIHJlc2lkdWFsIHZhbHVlIG9uIGFzIG5lZWRlZCBiYXNpcy5cbiAgICovXG4gIFtEaXJlY3RpdmVEZWZzLlNUWUxJTkdfQ1VSU09SXTogbnVtYmVyO1xufSJdfQ==