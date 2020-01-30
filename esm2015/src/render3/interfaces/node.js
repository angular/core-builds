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
     * An `ArrayMap` version of residual `styles`.
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
     * - `ArrayMap`: parsed version of `styles`.
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
     * An `ArrayMap` version of residual `classes`.
     *
     * Same as `TNode.residualStyles` but for classes.
     *
     * - `undefined': not initialized.
     * - `null`: initialized but `classes` is `null`
     * - `ArrayMap`: parsed version of `S`.
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9kZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaW50ZXJmYWNlcy9ub2RlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQW9CQSxNQUFrQixTQUFTO0lBQ3pCOztPQUVHO0lBQ0gsU0FBUyxHQUFJO0lBQ2I7O09BRUc7SUFDSCxVQUFVLEdBQUk7SUFDZDs7T0FFRztJQUNILElBQUksR0FBSTtJQUNSOztPQUVHO0lBQ0gsT0FBTyxHQUFJO0lBQ1g7O09BRUc7SUFDSCxnQkFBZ0IsR0FBSTtJQUNwQjs7T0FFRztJQUNILFlBQVksR0FBSTtFQUNqQjs7O0FBS0QsTUFBa0IsVUFBVTtJQUMxQiwrRkFBK0Y7SUFDL0YsZUFBZSxHQUFNO0lBRXJCOzs7O1NBSUs7SUFDTCxlQUFlLEdBQU07SUFFckIsOERBQThEO0lBQzlELFdBQVcsR0FBTTtJQUVqQixpRkFBaUY7SUFDakYsZUFBZSxHQUFNO0lBRXJCLGtFQUFrRTtJQUNsRSxhQUFhLElBQU87SUFFcEIsa0VBQWtFO0lBQ2xFLGFBQWEsSUFBTztJQUVwQixtRUFBbUU7SUFDbkUsVUFBVSxJQUFPO0lBRWpCOzs7OztPQUtHO0lBQ0gsZUFBZSxLQUFPO0VBQ3ZCOzs7QUFLRCxNQUFrQixvQkFBb0I7SUFDcEMsNEZBQTRGO0lBQzVGLHVCQUF1QixPQUFxQztJQUU1RDswQkFDc0I7SUFDdEIsMEJBQTBCLElBQUs7SUFDL0IsNEJBQTRCLE9BQXFDO0VBQ2xFOzs7QUFLRCxNQUFrQixlQUFlO0lBQy9COzs7Ozs7T0FNRztJQUNILGtCQUFrQixJQUFLO0lBRXZCOzs7O09BSUc7SUFDSCxZQUFZLEdBQUk7SUFFaEI7Ozs7Ozs7Ozs7Ozs7OztRQWVJO0lBQ0osT0FBTyxHQUFJO0lBRVg7Ozs7Ozs7Ozs7Ozs7Ozs7T0FnQkc7SUFDSCxNQUFNLEdBQUk7SUFFVjs7Ozs7Ozs7Ozs7Ozs7T0FjRztJQUNILFFBQVEsR0FBSTtJQUVaOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O09Bc0JHO0lBQ0gsUUFBUSxHQUFJO0lBRVo7Ozs7Ozs7Ozs7Ozs7O09BY0c7SUFDSCxTQUFTLEdBQUk7SUFFYjs7Ozs7Ozs7Ozs7OztPQWFHO0lBQ0gsSUFBSSxHQUFJO0VBQ1Q7Ozs7Ozs7Ozs7Ozs7O0FBNEJELDJCQWdVQzs7Ozs7O0lBOVRDLHFCQUFnQjs7Ozs7Ozs7OztJQVVoQixzQkFBYzs7Ozs7Ozs7Ozs7Ozs7O0lBZWQsOEJBQXNCOzs7OztJQUt0QiwrQkFBdUI7Ozs7O0lBS3ZCLDZCQUFxQjs7Ozs7O0lBTXJCLGlDQUFnQzs7Ozs7SUFLaEMsc0JBQWtCOzs7Ozs7OztJQVNsQixnQ0FBc0M7Ozs7O0lBR3RDLHdCQUFxQjs7Ozs7Ozs7Ozs7Ozs7OztJQWdCckIsc0JBQXdCOzs7Ozs7Ozs7Ozs7O0lBYXhCLDRCQUE4Qjs7Ozs7SUFPOUIsMkJBQWdDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBbUJoQywyQkFBbUM7Ozs7O0lBR25DLDhCQUErQzs7Ozs7O0lBTS9DLHVCQUE2Qjs7Ozs7O0lBTTdCLHdCQUE4Qjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQXNCOUIsdUJBQTJCOzs7Ozs7SUFNM0IscUJBQWlCOzs7Ozs7OztJQVFqQiwrQkFBMkI7Ozs7Ozs7O0lBUTNCLHNCQUFrQjs7Ozs7Ozs7Ozs7Ozs7OztJQWdCbEIsdUJBQXlDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQXlDekMsMkJBQTBDOzs7Ozs7Ozs7SUFTMUMsdUJBQW9COzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQTZCcEIsK0JBQTZDOzs7Ozs7Ozs7SUFTN0Msd0JBQXFCOzs7Ozs7Ozs7OztJQVdyQixnQ0FBOEM7Ozs7Ozs7Ozs7Ozs7OztJQWU5Qyw4QkFBNkI7Ozs7Ozs7Ozs7Ozs7OztJQWU3Qiw4QkFBNkI7Ozs7OztBQUkvQixrQ0FrQkM7Ozs7OztJQWhCQyw2QkFBYzs7SUFDZCw2QkFBd0Y7Ozs7Ozs7SUFNeEYsOEJBQWdEOztJQUNoRCw4QkFBYTs7Ozs7OztJQU9iLGtDQUFtQzs7Ozs7O0FBSXJDLCtCQVlDOzs7Ozs7SUFWQywwQkFBYzs7SUFDZCwwQkFBWTs7Ozs7OztJQU1aLDJCQUFnRDs7SUFDaEQsMkJBQWE7O0lBQ2IsK0JBQWlCOzs7Ozs7QUFJbkIsb0NBbUJDOzs7Ozs7Ozs7SUFaQywrQkFBYzs7SUFDZCwrQkFBWTs7Ozs7Ozs7SUFRWixnQ0FBZ0Q7O0lBQ2hELGdDQUEyQjs7SUFDM0Isb0NBQWlCOzs7Ozs7QUFJbkIsMkNBT0M7Ozs7OztJQUxDLHNDQUFjOztJQUNkLHNDQUF3Rjs7SUFDeEYsdUNBQWdEOztJQUNoRCx1Q0FBYTs7SUFDYiwyQ0FBaUI7Ozs7OztBQUluQix1Q0FZQzs7Ozs7O0lBVkMsa0NBQWM7O0lBQ2Qsa0NBQW1DOztJQUNuQyxtQ0FBZ0Q7O0lBQ2hELG1DQUFhOztJQUNiLHVDQUFpQjs7Ozs7O0lBS2pCLDRDQUE2Qjs7Ozs7O0FBSS9CLCtCQU9DOzs7Ozs7SUFMQywwQkFBYzs7SUFDZCwwQkFBd0Y7O0lBQ3hGLDJCQUE0Qjs7SUFDNUIsMkJBQWE7O0lBQ2IsK0JBQWlCOzs7Ozs7QUFJbkIscUNBYUM7Ozs7OztJQVhDLGdDQUFZOzs7Ozs7O0lBTVosaUNBQWdEOztJQUNoRCxpQ0FBYTs7Ozs7SUFHYixxQ0FBbUI7Ozs7O0FBbUVyQixNQUFNLE9BQU8sNkJBQTZCLEdBQUcsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFvQzlDLE1BQU0sVUFBVSxhQUFhLENBQUMsS0FBWTtJQUN4QyxPQUFPLENBQUMsS0FBSyxDQUFDLEtBQUsseUJBQTJCLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDeEQsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUF1QkQsTUFBTSxVQUFVLGFBQWEsQ0FBQyxLQUFZO0lBQ3hDLE9BQU8sQ0FBQyxLQUFLLENBQUMsS0FBSyx5QkFBMkIsQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUN4RCxDQUFDOztBQUtELE1BQWtCLGFBQWE7SUFDN0IsZ0RBQWdEO0lBQ2hELGNBQWMsR0FBSTtJQUNsQix5RUFBeUU7SUFDekUsYUFBYSxHQUFJO0VBQ2xCOzs7QUFLRCxNQUFrQixtQkFBbUI7SUFDbkMseUNBQXlDO0lBQ3pDLDRCQUE0QixHQUFJO0VBQ2pDOzs7Ozs7QUFLRCxvQ0E0QkMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5pbXBvcnQge0FycmF5TWFwfSBmcm9tICcuLi8uLi91dGlsL2FycmF5X3V0aWxzJztcbmltcG9ydCB7VFN0eWxpbmdSYW5nZX0gZnJvbSAnLi4vaW50ZXJmYWNlcy9zdHlsaW5nJztcblxuaW1wb3J0IHtEaXJlY3RpdmVEZWZ9IGZyb20gJy4vZGVmaW5pdGlvbic7XG5pbXBvcnQge0Nzc1NlbGVjdG9yfSBmcm9tICcuL3Byb2plY3Rpb24nO1xuaW1wb3J0IHtSTm9kZX0gZnJvbSAnLi9yZW5kZXJlcic7XG5pbXBvcnQge0xWaWV3LCBUVmlld30gZnJvbSAnLi92aWV3JztcblxuXG5cbi8qKlxuICogVE5vZGVUeXBlIGNvcnJlc3BvbmRzIHRvIHRoZSB7QGxpbmsgVE5vZGV9IGB0eXBlYCBwcm9wZXJ0eS5cbiAqL1xuZXhwb3J0IGNvbnN0IGVudW0gVE5vZGVUeXBlIHtcbiAgLyoqXG4gICAqIFRoZSBUTm9kZSBjb250YWlucyBpbmZvcm1hdGlvbiBhYm91dCBhbiB7QGxpbmsgTENvbnRhaW5lcn0gZm9yIGVtYmVkZGVkIHZpZXdzLlxuICAgKi9cbiAgQ29udGFpbmVyID0gMCxcbiAgLyoqXG4gICAqIFRoZSBUTm9kZSBjb250YWlucyBpbmZvcm1hdGlvbiBhYm91dCBhbiBgPG5nLWNvbnRlbnQ+YCBwcm9qZWN0aW9uXG4gICAqL1xuICBQcm9qZWN0aW9uID0gMSxcbiAgLyoqXG4gICAqIFRoZSBUTm9kZSBjb250YWlucyBpbmZvcm1hdGlvbiBhYm91dCBhbiB7QGxpbmsgTFZpZXd9XG4gICAqL1xuICBWaWV3ID0gMixcbiAgLyoqXG4gICAqIFRoZSBUTm9kZSBjb250YWlucyBpbmZvcm1hdGlvbiBhYm91dCBhIERPTSBlbGVtZW50IGFrYSB7QGxpbmsgUk5vZGV9LlxuICAgKi9cbiAgRWxlbWVudCA9IDMsXG4gIC8qKlxuICAgKiBUaGUgVE5vZGUgY29udGFpbnMgaW5mb3JtYXRpb24gYWJvdXQgYW4gYDxuZy1jb250YWluZXI+YCBlbGVtZW50IHtAbGluayBSTm9kZX0uXG4gICAqL1xuICBFbGVtZW50Q29udGFpbmVyID0gNCxcbiAgLyoqXG4gICAqIFRoZSBUTm9kZSBjb250YWlucyBpbmZvcm1hdGlvbiBhYm91dCBhbiBJQ1UgY29tbWVudCB1c2VkIGluIGBpMThuYC5cbiAgICovXG4gIEljdUNvbnRhaW5lciA9IDUsXG59XG5cbi8qKlxuICogQ29ycmVzcG9uZHMgdG8gdGhlIFROb2RlLmZsYWdzIHByb3BlcnR5LlxuICovXG5leHBvcnQgY29uc3QgZW51bSBUTm9kZUZsYWdzIHtcbiAgLyoqIEJpdCAjMSAtIFRoaXMgYml0IGlzIHNldCBpZiB0aGUgbm9kZSBpcyBhIGhvc3QgZm9yIGFueSBkaXJlY3RpdmUgKGluY2x1ZGluZyBhIGNvbXBvbmVudCkgKi9cbiAgaXNEaXJlY3RpdmVIb3N0ID0gMHgxLFxuXG4gIC8qKlxuICAgKiBCaXQgIzIgLSBUaGlzIGJpdCBpcyBzZXQgaWYgdGhlIG5vZGUgaXMgYSBob3N0IGZvciBhIGNvbXBvbmVudC5cbiAgICpcbiAgICogU2V0dGluZyB0aGlzIGJpdCBpbXBsaWVzIHRoYXQgdGhlIGBpc0RpcmVjdGl2ZUhvc3RgIGJpdCBpcyBzZXQgYXMgd2VsbC5cbiAgICogKi9cbiAgaXNDb21wb25lbnRIb3N0ID0gMHgyLFxuXG4gIC8qKiBCaXQgIzMgLSBUaGlzIGJpdCBpcyBzZXQgaWYgdGhlIG5vZGUgaGFzIGJlZW4gcHJvamVjdGVkICovXG4gIGlzUHJvamVjdGVkID0gMHg0LFxuXG4gIC8qKiBCaXQgIzQgLSBUaGlzIGJpdCBpcyBzZXQgaWYgYW55IGRpcmVjdGl2ZSBvbiB0aGlzIG5vZGUgaGFzIGNvbnRlbnQgcXVlcmllcyAqL1xuICBoYXNDb250ZW50UXVlcnkgPSAweDgsXG5cbiAgLyoqIEJpdCAjNSAtIFRoaXMgYml0IGlzIHNldCBpZiB0aGUgbm9kZSBoYXMgYW55IFwiY2xhc3NcIiBpbnB1dHMgKi9cbiAgaGFzQ2xhc3NJbnB1dCA9IDB4MTAsXG5cbiAgLyoqIEJpdCAjNiAtIFRoaXMgYml0IGlzIHNldCBpZiB0aGUgbm9kZSBoYXMgYW55IFwic3R5bGVcIiBpbnB1dHMgKi9cbiAgaGFzU3R5bGVJbnB1dCA9IDB4MjAsXG5cbiAgLyoqIEJpdCAjNyBUaGlzIGJpdCBpcyBzZXQgaWYgdGhlIG5vZGUgaGFzIGJlZW4gZGV0YWNoZWQgYnkgaTE4biAqL1xuICBpc0RldGFjaGVkID0gMHg0MCxcblxuICAvKipcbiAgICogQml0ICM4IC0gVGhpcyBiaXQgaXMgc2V0IGlmIHRoZSBub2RlIGhhcyBkaXJlY3RpdmVzIHdpdGggaG9zdCBiaW5kaW5ncy5cbiAgICpcbiAgICogVGhpcyBmbGFncyBhbGxvd3MgdXMgdG8gZ3VhcmQgaG9zdC1iaW5kaW5nIGxvZ2ljIGFuZCBpbnZva2UgaXQgb25seSBvbiBub2Rlc1xuICAgKiB0aGF0IGFjdHVhbGx5IGhhdmUgZGlyZWN0aXZlcyB3aXRoIGhvc3QgYmluZGluZ3MuXG4gICAqL1xuICBoYXNIb3N0QmluZGluZ3MgPSAweDgwLFxufVxuXG4vKipcbiAqIENvcnJlc3BvbmRzIHRvIHRoZSBUTm9kZS5wcm92aWRlckluZGV4ZXMgcHJvcGVydHkuXG4gKi9cbmV4cG9ydCBjb25zdCBlbnVtIFROb2RlUHJvdmlkZXJJbmRleGVzIHtcbiAgLyoqIFRoZSBpbmRleCBvZiB0aGUgZmlyc3QgcHJvdmlkZXIgb24gdGhpcyBub2RlIGlzIGVuY29kZWQgb24gdGhlIGxlYXN0IHNpZ25pZmljYW50IGJpdHMgKi9cbiAgUHJvdmlkZXJzU3RhcnRJbmRleE1hc2sgPSAwYjAwMDAwMDAwMDAwMDAwMDAxMTExMTExMTExMTExMTExLFxuXG4gIC8qKiBUaGUgY291bnQgb2YgdmlldyBwcm92aWRlcnMgZnJvbSB0aGUgY29tcG9uZW50IG9uIHRoaXMgbm9kZSBpcyBlbmNvZGVkIG9uIHRoZSAxNiBtb3N0XG4gICAgIHNpZ25pZmljYW50IGJpdHMgKi9cbiAgQ3B0Vmlld1Byb3ZpZGVyc0NvdW50U2hpZnQgPSAxNixcbiAgQ3B0Vmlld1Byb3ZpZGVyc0NvdW50U2hpZnRlciA9IDBiMDAwMDAwMDAwMDAwMDAwMTAwMDAwMDAwMDAwMDAwMDAsXG59XG4vKipcbiAqIEEgc2V0IG9mIG1hcmtlciB2YWx1ZXMgdG8gYmUgdXNlZCBpbiB0aGUgYXR0cmlidXRlcyBhcnJheXMuIFRoZXNlIG1hcmtlcnMgaW5kaWNhdGUgdGhhdCBzb21lXG4gKiBpdGVtcyBhcmUgbm90IHJlZ3VsYXIgYXR0cmlidXRlcyBhbmQgdGhlIHByb2Nlc3Npbmcgc2hvdWxkIGJlIGFkYXB0ZWQgYWNjb3JkaW5nbHkuXG4gKi9cbmV4cG9ydCBjb25zdCBlbnVtIEF0dHJpYnV0ZU1hcmtlciB7XG4gIC8qKlxuICAgKiBBbiBpbXBsaWNpdCBtYXJrZXIgd2hpY2ggaW5kaWNhdGVzIHRoYXQgdGhlIHZhbHVlIGluIHRoZSBhcnJheSBhcmUgb2YgYGF0dHJpYnV0ZUtleWAsXG4gICAqIGBhdHRyaWJ1dGVWYWx1ZWAgZm9ybWF0LlxuICAgKlxuICAgKiBOT1RFOiBUaGlzIGlzIGltcGxpY2l0IGFzIGl0IGlzIHRoZSB0eXBlIHdoZW4gbm8gbWFya2VyIGlzIHByZXNlbnQgaW4gYXJyYXkuIFdlIGluZGljYXRlIHRoYXRcbiAgICogaXQgc2hvdWxkIG5vdCBiZSBwcmVzZW50IGF0IHJ1bnRpbWUgYnkgdGhlIG5lZ2F0aXZlIG51bWJlci5cbiAgICovXG4gIEltcGxpY2l0QXR0cmlidXRlcyA9IC0xLFxuXG4gIC8qKlxuICAgKiBNYXJrZXIgaW5kaWNhdGVzIHRoYXQgdGhlIGZvbGxvd2luZyAzIHZhbHVlcyBpbiB0aGUgYXR0cmlidXRlcyBhcnJheSBhcmU6XG4gICAqIG5hbWVzcGFjZVVyaSwgYXR0cmlidXRlTmFtZSwgYXR0cmlidXRlVmFsdWVcbiAgICogaW4gdGhhdCBvcmRlci5cbiAgICovXG4gIE5hbWVzcGFjZVVSSSA9IDAsXG5cbiAgLyoqXG4gICAgKiBTaWduYWxzIGNsYXNzIGRlY2xhcmF0aW9uLlxuICAgICpcbiAgICAqIEVhY2ggdmFsdWUgZm9sbG93aW5nIGBDbGFzc2VzYCBkZXNpZ25hdGVzIGEgY2xhc3MgbmFtZSB0byBpbmNsdWRlIG9uIHRoZSBlbGVtZW50LlxuICAgICogIyMgRXhhbXBsZTpcbiAgICAqXG4gICAgKiBHaXZlbjpcbiAgICAqIGBgYFxuICAgICogPGRpdiBjbGFzcz1cImZvbyBiYXIgYmF6XCI+Li4uPGQvdmk+XG4gICAgKiBgYGBcbiAgICAqXG4gICAgKiB0aGUgZ2VuZXJhdGVkIGNvZGUgaXM6XG4gICAgKiBgYGBcbiAgICAqIHZhciBfYzEgPSBbQXR0cmlidXRlTWFya2VyLkNsYXNzZXMsICdmb28nLCAnYmFyJywgJ2JheiddO1xuICAgICogYGBgXG4gICAgKi9cbiAgQ2xhc3NlcyA9IDEsXG5cbiAgLyoqXG4gICAqIFNpZ25hbHMgc3R5bGUgZGVjbGFyYXRpb24uXG4gICAqXG4gICAqIEVhY2ggcGFpciBvZiB2YWx1ZXMgZm9sbG93aW5nIGBTdHlsZXNgIGRlc2lnbmF0ZXMgYSBzdHlsZSBuYW1lIGFuZCB2YWx1ZSB0byBpbmNsdWRlIG9uIHRoZVxuICAgKiBlbGVtZW50LlxuICAgKiAjIyBFeGFtcGxlOlxuICAgKlxuICAgKiBHaXZlbjpcbiAgICogYGBgXG4gICAqIDxkaXYgc3R5bGU9XCJ3aWR0aDoxMDBweDsgaGVpZ2h0OjIwMHB4OyBjb2xvcjpyZWRcIj4uLi48L2Rpdj5cbiAgICogYGBgXG4gICAqXG4gICAqIHRoZSBnZW5lcmF0ZWQgY29kZSBpczpcbiAgICogYGBgXG4gICAqIHZhciBfYzEgPSBbQXR0cmlidXRlTWFya2VyLlN0eWxlcywgJ3dpZHRoJywgJzEwMHB4JywgJ2hlaWdodCcuICcyMDBweCcsICdjb2xvcicsICdyZWQnXTtcbiAgICogYGBgXG4gICAqL1xuICBTdHlsZXMgPSAyLFxuXG4gIC8qKlxuICAgKiBTaWduYWxzIHRoYXQgdGhlIGZvbGxvd2luZyBhdHRyaWJ1dGUgbmFtZXMgd2VyZSBleHRyYWN0ZWQgZnJvbSBpbnB1dCBvciBvdXRwdXQgYmluZGluZ3MuXG4gICAqXG4gICAqIEZvciBleGFtcGxlLCBnaXZlbiB0aGUgZm9sbG93aW5nIEhUTUw6XG4gICAqXG4gICAqIGBgYFxuICAgKiA8ZGl2IG1vbz1cImNhclwiIFtmb29dPVwiZXhwXCIgKGJhcik9XCJkb1N0aCgpXCI+XG4gICAqIGBgYFxuICAgKlxuICAgKiB0aGUgZ2VuZXJhdGVkIGNvZGUgaXM6XG4gICAqXG4gICAqIGBgYFxuICAgKiB2YXIgX2MxID0gWydtb28nLCAnY2FyJywgQXR0cmlidXRlTWFya2VyLkJpbmRpbmdzLCAnZm9vJywgJ2JhciddO1xuICAgKiBgYGBcbiAgICovXG4gIEJpbmRpbmdzID0gMyxcblxuICAvKipcbiAgICogU2lnbmFscyB0aGF0IHRoZSBmb2xsb3dpbmcgYXR0cmlidXRlIG5hbWVzIHdlcmUgaG9pc3RlZCBmcm9tIGFuIGlubGluZS10ZW1wbGF0ZSBkZWNsYXJhdGlvbi5cbiAgICpcbiAgICogRm9yIGV4YW1wbGUsIGdpdmVuIHRoZSBmb2xsb3dpbmcgSFRNTDpcbiAgICpcbiAgICogYGBgXG4gICAqIDxkaXYgKm5nRm9yPVwibGV0IHZhbHVlIG9mIHZhbHVlczsgdHJhY2tCeTp0cmFja0J5XCIgZGlyQSBbZGlyQl09XCJ2YWx1ZVwiPlxuICAgKiBgYGBcbiAgICpcbiAgICogdGhlIGdlbmVyYXRlZCBjb2RlIGZvciB0aGUgYHRlbXBsYXRlKClgIGluc3RydWN0aW9uIHdvdWxkIGluY2x1ZGU6XG4gICAqXG4gICAqIGBgYFxuICAgKiBbJ2RpckEnLCAnJywgQXR0cmlidXRlTWFya2VyLkJpbmRpbmdzLCAnZGlyQicsIEF0dHJpYnV0ZU1hcmtlci5UZW1wbGF0ZSwgJ25nRm9yJywgJ25nRm9yT2YnLFxuICAgKiAnbmdGb3JUcmFja0J5JywgJ2xldC12YWx1ZSddXG4gICAqIGBgYFxuICAgKlxuICAgKiB3aGlsZSB0aGUgZ2VuZXJhdGVkIGNvZGUgZm9yIHRoZSBgZWxlbWVudCgpYCBpbnN0cnVjdGlvbiBpbnNpZGUgdGhlIHRlbXBsYXRlIGZ1bmN0aW9uIHdvdWxkXG4gICAqIGluY2x1ZGU6XG4gICAqXG4gICAqIGBgYFxuICAgKiBbJ2RpckEnLCAnJywgQXR0cmlidXRlTWFya2VyLkJpbmRpbmdzLCAnZGlyQiddXG4gICAqIGBgYFxuICAgKi9cbiAgVGVtcGxhdGUgPSA0LFxuXG4gIC8qKlxuICAgKiBTaWduYWxzIHRoYXQgdGhlIGZvbGxvd2luZyBhdHRyaWJ1dGUgaXMgYG5nUHJvamVjdEFzYCBhbmQgaXRzIHZhbHVlIGlzIGEgcGFyc2VkIGBDc3NTZWxlY3RvcmAuXG4gICAqXG4gICAqIEZvciBleGFtcGxlLCBnaXZlbiB0aGUgZm9sbG93aW5nIEhUTUw6XG4gICAqXG4gICAqIGBgYFxuICAgKiA8aDEgYXR0cj1cInZhbHVlXCIgbmdQcm9qZWN0QXM9XCJbdGl0bGVdXCI+XG4gICAqIGBgYFxuICAgKlxuICAgKiB0aGUgZ2VuZXJhdGVkIGNvZGUgZm9yIHRoZSBgZWxlbWVudCgpYCBpbnN0cnVjdGlvbiB3b3VsZCBpbmNsdWRlOlxuICAgKlxuICAgKiBgYGBcbiAgICogWydhdHRyJywgJ3ZhbHVlJywgQXR0cmlidXRlTWFya2VyLlByb2plY3RBcywgWycnLCAndGl0bGUnLCAnJ11dXG4gICAqIGBgYFxuICAgKi9cbiAgUHJvamVjdEFzID0gNSxcblxuICAvKipcbiAgICogU2lnbmFscyB0aGF0IHRoZSBmb2xsb3dpbmcgYXR0cmlidXRlIHdpbGwgYmUgdHJhbnNsYXRlZCBieSBydW50aW1lIGkxOG5cbiAgICpcbiAgICogRm9yIGV4YW1wbGUsIGdpdmVuIHRoZSBmb2xsb3dpbmcgSFRNTDpcbiAgICpcbiAgICogYGBgXG4gICAqIDxkaXYgbW9vPVwiY2FyXCIgZm9vPVwidmFsdWVcIiBpMThuLWZvbyBbYmFyXT1cImJpbmRpbmdcIiBpMThuLWJhcj5cbiAgICogYGBgXG4gICAqXG4gICAqIHRoZSBnZW5lcmF0ZWQgY29kZSBpczpcbiAgICpcbiAgICogYGBgXG4gICAqIHZhciBfYzEgPSBbJ21vbycsICdjYXInLCBBdHRyaWJ1dGVNYXJrZXIuSTE4biwgJ2ZvbycsICdiYXInXTtcbiAgICovXG4gIEkxOG4gPSA2LFxufVxuXG4vKipcbiAqIEEgY29tYmluYXRpb24gb2Y6XG4gKiAtIEF0dHJpYnV0ZSBuYW1lcyBhbmQgdmFsdWVzLlxuICogLSBTcGVjaWFsIG1hcmtlcnMgYWN0aW5nIGFzIGZsYWdzIHRvIGFsdGVyIGF0dHJpYnV0ZXMgcHJvY2Vzc2luZy5cbiAqIC0gUGFyc2VkIG5nUHJvamVjdEFzIHNlbGVjdG9ycy5cbiAqL1xuZXhwb3J0IHR5cGUgVEF0dHJpYnV0ZXMgPSAoc3RyaW5nIHwgQXR0cmlidXRlTWFya2VyIHwgQ3NzU2VsZWN0b3IpW107XG5cbi8qKlxuICogQ29uc3RhbnRzIHRoYXQgYXJlIGFzc29jaWF0ZWQgd2l0aCBhIHZpZXcuIEluY2x1ZGVzOlxuICogLSBBdHRyaWJ1dGUgYXJyYXlzLlxuICogLSBMb2NhbCBkZWZpbml0aW9uIGFycmF5cy5cbiAqL1xuZXhwb3J0IHR5cGUgVENvbnN0YW50cyA9IChUQXR0cmlidXRlcyB8IHN0cmluZylbXTtcblxuLyoqXG4gKiBCaW5kaW5nIGRhdGEgKGZseXdlaWdodCkgZm9yIGEgcGFydGljdWxhciBub2RlIHRoYXQgaXMgc2hhcmVkIGJldHdlZW4gYWxsIHRlbXBsYXRlc1xuICogb2YgYSBzcGVjaWZpYyB0eXBlLlxuICpcbiAqIElmIGEgcHJvcGVydHkgaXM6XG4gKiAgICAtIFByb3BlcnR5QWxpYXNlczogdGhhdCBwcm9wZXJ0eSdzIGRhdGEgd2FzIGdlbmVyYXRlZCBhbmQgdGhpcyBpcyBpdFxuICogICAgLSBOdWxsOiB0aGF0IHByb3BlcnR5J3MgZGF0YSB3YXMgYWxyZWFkeSBnZW5lcmF0ZWQgYW5kIG5vdGhpbmcgd2FzIGZvdW5kLlxuICogICAgLSBVbmRlZmluZWQ6IHRoYXQgcHJvcGVydHkncyBkYXRhIGhhcyBub3QgeWV0IGJlZW4gZ2VuZXJhdGVkXG4gKlxuICogc2VlOiBodHRwczovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9GbHl3ZWlnaHRfcGF0dGVybiBmb3IgbW9yZSBvbiB0aGUgRmx5d2VpZ2h0IHBhdHRlcm5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBUTm9kZSB7XG4gIC8qKiBUaGUgdHlwZSBvZiB0aGUgVE5vZGUuIFNlZSBUTm9kZVR5cGUuICovXG4gIHR5cGU6IFROb2RlVHlwZTtcblxuICAvKipcbiAgICogSW5kZXggb2YgdGhlIFROb2RlIGluIFRWaWV3LmRhdGEgYW5kIGNvcnJlc3BvbmRpbmcgbmF0aXZlIGVsZW1lbnQgaW4gTFZpZXcuXG4gICAqXG4gICAqIFRoaXMgaXMgbmVjZXNzYXJ5IHRvIGdldCBmcm9tIGFueSBUTm9kZSB0byBpdHMgY29ycmVzcG9uZGluZyBuYXRpdmUgZWxlbWVudCB3aGVuXG4gICAqIHRyYXZlcnNpbmcgdGhlIG5vZGUgdHJlZS5cbiAgICpcbiAgICogSWYgaW5kZXggaXMgLTEsIHRoaXMgaXMgYSBkeW5hbWljYWxseSBjcmVhdGVkIGNvbnRhaW5lciBub2RlIG9yIGVtYmVkZGVkIHZpZXcgbm9kZS5cbiAgICovXG4gIGluZGV4OiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIFRoZSBpbmRleCBvZiB0aGUgY2xvc2VzdCBpbmplY3RvciBpbiB0aGlzIG5vZGUncyBMVmlldy5cbiAgICpcbiAgICogSWYgdGhlIGluZGV4ID09PSAtMSwgdGhlcmUgaXMgbm8gaW5qZWN0b3Igb24gdGhpcyBub2RlIG9yIGFueSBhbmNlc3RvciBub2RlIGluIHRoaXMgdmlldy5cbiAgICpcbiAgICogSWYgdGhlIGluZGV4ICE9PSAtMSwgaXQgaXMgdGhlIGluZGV4IG9mIHRoaXMgbm9kZSdzIGluamVjdG9yIE9SIHRoZSBpbmRleCBvZiBhIHBhcmVudCBpbmplY3RvclxuICAgKiBpbiB0aGUgc2FtZSB2aWV3LiBXZSBwYXNzIHRoZSBwYXJlbnQgaW5qZWN0b3IgaW5kZXggZG93biB0aGUgbm9kZSB0cmVlIG9mIGEgdmlldyBzbyBpdCdzXG4gICAqIHBvc3NpYmxlIHRvIGZpbmQgdGhlIHBhcmVudCBpbmplY3RvciB3aXRob3V0IHdhbGtpbmcgYSBwb3RlbnRpYWxseSBkZWVwIG5vZGUgdHJlZS4gSW5qZWN0b3JcbiAgICogaW5kaWNlcyBhcmUgbm90IHNldCBhY3Jvc3MgdmlldyBib3VuZGFyaWVzIGJlY2F1c2UgdGhlcmUgY291bGQgYmUgbXVsdGlwbGUgY29tcG9uZW50IGhvc3RzLlxuICAgKlxuICAgKiBJZiB0Tm9kZS5pbmplY3RvckluZGV4ID09PSB0Tm9kZS5wYXJlbnQuaW5qZWN0b3JJbmRleCwgdGhlbiB0aGUgaW5kZXggYmVsb25ncyB0byBhIHBhcmVudFxuICAgKiBpbmplY3Rvci5cbiAgICovXG4gIGluamVjdG9ySW5kZXg6IG51bWJlcjtcblxuICAvKipcbiAgICogU3RvcmVzIHN0YXJ0aW5nIGluZGV4IG9mIHRoZSBkaXJlY3RpdmVzLlxuICAgKi9cbiAgZGlyZWN0aXZlU3RhcnQ6IG51bWJlcjtcblxuICAvKipcbiAgICogU3RvcmVzIGZpbmFsIGV4Y2x1c2l2ZSBpbmRleCBvZiB0aGUgZGlyZWN0aXZlcy5cbiAgICovXG4gIGRpcmVjdGl2ZUVuZDogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBTdG9yZXMgaW5kZXhlcyBvZiBwcm9wZXJ0eSBiaW5kaW5ncy4gVGhpcyBmaWVsZCBpcyBvbmx5IHNldCBpbiB0aGUgbmdEZXZNb2RlIGFuZCBob2xkcyBpbmRleGVzXG4gICAqIG9mIHByb3BlcnR5IGJpbmRpbmdzIHNvIFRlc3RCZWQgY2FuIGdldCBib3VuZCBwcm9wZXJ0eSBtZXRhZGF0YSBmb3IgYSBnaXZlbiBub2RlLlxuICAgKi9cbiAgcHJvcGVydHlCaW5kaW5nczogbnVtYmVyW118bnVsbDtcblxuICAvKipcbiAgICogU3RvcmVzIGlmIE5vZGUgaXNDb21wb25lbnQsIGlzUHJvamVjdGVkLCBoYXNDb250ZW50UXVlcnksIGhhc0NsYXNzSW5wdXQgYW5kIGhhc1N0eWxlSW5wdXQgZXRjLlxuICAgKi9cbiAgZmxhZ3M6IFROb2RlRmxhZ3M7XG5cbiAgLyoqXG4gICAqIFRoaXMgbnVtYmVyIHN0b3JlcyB0d28gdmFsdWVzIHVzaW5nIGl0cyBiaXRzOlxuICAgKlxuICAgKiAtIHRoZSBpbmRleCBvZiB0aGUgZmlyc3QgcHJvdmlkZXIgb24gdGhhdCBub2RlIChmaXJzdCAxNiBiaXRzKVxuICAgKiAtIHRoZSBjb3VudCBvZiB2aWV3IHByb3ZpZGVycyBmcm9tIHRoZSBjb21wb25lbnQgb24gdGhpcyBub2RlIChsYXN0IDE2IGJpdHMpXG4gICAqL1xuICAvLyBUT0RPKG1pc2tvKTogYnJlYWsgdGhpcyBpbnRvIGFjdHVhbCB2YXJzLlxuICBwcm92aWRlckluZGV4ZXM6IFROb2RlUHJvdmlkZXJJbmRleGVzO1xuXG4gIC8qKiBUaGUgdGFnIG5hbWUgYXNzb2NpYXRlZCB3aXRoIHRoaXMgbm9kZS4gKi9cbiAgdGFnTmFtZTogc3RyaW5nfG51bGw7XG5cbiAgLyoqXG4gICAqIEF0dHJpYnV0ZXMgYXNzb2NpYXRlZCB3aXRoIGFuIGVsZW1lbnQuIFdlIG5lZWQgdG8gc3RvcmUgYXR0cmlidXRlcyB0byBzdXBwb3J0IHZhcmlvdXMgdXNlLWNhc2VzXG4gICAqIChhdHRyaWJ1dGUgaW5qZWN0aW9uLCBjb250ZW50IHByb2plY3Rpb24gd2l0aCBzZWxlY3RvcnMsIGRpcmVjdGl2ZXMgbWF0Y2hpbmcpLlxuICAgKiBBdHRyaWJ1dGVzIGFyZSBzdG9yZWQgc3RhdGljYWxseSBiZWNhdXNlIHJlYWRpbmcgdGhlbSBmcm9tIHRoZSBET00gd291bGQgYmUgd2F5IHRvbyBzbG93IGZvclxuICAgKiBjb250ZW50IHByb2plY3Rpb24gYW5kIHF1ZXJpZXMuXG4gICAqXG4gICAqIFNpbmNlIGF0dHJzIHdpbGwgYWx3YXlzIGJlIGNhbGN1bGF0ZWQgZmlyc3QsIHRoZXkgd2lsbCBuZXZlciBuZWVkIHRvIGJlIG1hcmtlZCB1bmRlZmluZWQgYnlcbiAgICogb3RoZXIgaW5zdHJ1Y3Rpb25zLlxuICAgKlxuICAgKiBGb3IgcmVndWxhciBhdHRyaWJ1dGVzIGEgbmFtZSBvZiBhbiBhdHRyaWJ1dGUgYW5kIGl0cyB2YWx1ZSBhbHRlcm5hdGUgaW4gdGhlIGFycmF5LlxuICAgKiBlLmcuIFsncm9sZScsICdjaGVja2JveCddXG4gICAqIFRoaXMgYXJyYXkgY2FuIGNvbnRhaW4gZmxhZ3MgdGhhdCB3aWxsIGluZGljYXRlIFwic3BlY2lhbCBhdHRyaWJ1dGVzXCIgKGF0dHJpYnV0ZXMgd2l0aFxuICAgKiBuYW1lc3BhY2VzLCBhdHRyaWJ1dGVzIGV4dHJhY3RlZCBmcm9tIGJpbmRpbmdzIGFuZCBvdXRwdXRzKS5cbiAgICovXG4gIGF0dHJzOiBUQXR0cmlidXRlc3xudWxsO1xuXG4gIC8qKlxuICAgKiBTYW1lIGFzIGBUTm9kZS5hdHRyc2AgYnV0IGNvbnRhaW5zIG1lcmdlZCBkYXRhIGFjcm9zcyBhbGwgZGlyZWN0aXZlIGhvc3QgYmluZGluZ3MuXG4gICAqXG4gICAqIFdlIG5lZWQgdG8ga2VlcCBgYXR0cnNgIGFzIHVubWVyZ2VkIHNvIHRoYXQgaXQgY2FuIGJlIHVzZWQgZm9yIGF0dHJpYnV0ZSBzZWxlY3RvcnMuXG4gICAqIFdlIG1lcmdlIGF0dHJzIGhlcmUgc28gdGhhdCBpdCBjYW4gYmUgdXNlZCBpbiBhIHBlcmZvcm1hbnQgd2F5IGZvciBpbml0aWFsIHJlbmRlcmluZy5cbiAgICpcbiAgICogVGhlIGBhdHRyc2AgYXJlIG1lcmdlZCBpbiBmaXJzdCBwYXNzIGluIGZvbGxvd2luZyBvcmRlcjpcbiAgICogLSBDb21wb25lbnQncyBgaG9zdEF0dHJzYFxuICAgKiAtIERpcmVjdGl2ZXMnIGBob3N0QXR0cnNgXG4gICAqIC0gVGVtcGxhdGUgYFROb2RlLmF0dHJzYCBhc3NvY2lhdGVkIHdpdGggdGhlIGN1cnJlbnQgYFROb2RlYC5cbiAgICovXG4gIG1lcmdlZEF0dHJzOiBUQXR0cmlidXRlc3xudWxsO1xuXG4gIC8vIFRPRE8obWlza28pOiBwcmUgZGlzY3Vzc2lvbiB3aXRoIEthcmEsIGl0IHNlZW1zIHRoYXQgd2UgZG9uJ3QgbmVlZCBgZGlyZWN0aXZlc2Agc2luY2UgdGhlIHNhbWVcbiAgLy8gaW5mb3JtYXRpb24gaXMgYWxyZWFkeSBwcmVzZW50IGluIHRoZSBURGF0YS4gTWF5YmUgd29ydGggcmVmYWN0b3JpbmcuXG4gIC8qKlxuICAgKiBTdG9yZXMgdGhlIGRpcmVjdGl2ZSBkZWZzIG1hdGNoZWQgb24gdGhlIGN1cnJlbnQgVE5vZGUgKGFsb25nIHdpdGggc3R5bGUgY3Vyc29yLilcbiAgICovXG4gIGRpcmVjdGl2ZXM6IFREaXJlY3RpdmVEZWZzfG51bGw7XG5cbiAgLyoqXG4gICAqIEEgc2V0IG9mIGxvY2FsIG5hbWVzIHVuZGVyIHdoaWNoIGEgZ2l2ZW4gZWxlbWVudCBpcyBleHBvcnRlZCBpbiBhIHRlbXBsYXRlIGFuZFxuICAgKiB2aXNpYmxlIHRvIHF1ZXJpZXMuIEFuIGVudHJ5IGluIHRoaXMgYXJyYXkgY2FuIGJlIGNyZWF0ZWQgZm9yIGRpZmZlcmVudCByZWFzb25zOlxuICAgKiAtIGFuIGVsZW1lbnQgaXRzZWxmIGlzIHJlZmVyZW5jZWQsIGV4LjogYDxkaXYgI2Zvbz5gXG4gICAqIC0gYSBjb21wb25lbnQgaXMgcmVmZXJlbmNlZCwgZXguOiBgPG15LWNtcHQgI2Zvbz5gXG4gICAqIC0gYSBkaXJlY3RpdmUgaXMgcmVmZXJlbmNlZCwgZXguOiBgPG15LWNtcHQgI2Zvbz1cImRpcmVjdGl2ZUV4cG9ydEFzXCI+YC5cbiAgICpcbiAgICogQSBnaXZlbiBlbGVtZW50IG1pZ2h0IGhhdmUgZGlmZmVyZW50IGxvY2FsIG5hbWVzIGFuZCB0aG9zZSBuYW1lcyBjYW4gYmUgYXNzb2NpYXRlZFxuICAgKiB3aXRoIGEgZGlyZWN0aXZlLiBXZSBzdG9yZSBsb2NhbCBuYW1lcyBhdCBldmVuIGluZGV4ZXMgd2hpbGUgb2RkIGluZGV4ZXMgYXJlIHJlc2VydmVkXG4gICAqIGZvciBkaXJlY3RpdmUgaW5kZXggaW4gYSB2aWV3IChvciBgLTFgIGlmIHRoZXJlIGlzIG5vIGFzc29jaWF0ZWQgZGlyZWN0aXZlKS5cbiAgICpcbiAgICogU29tZSBleGFtcGxlczpcbiAgICogLSBgPGRpdiAjZm9vPmAgPT4gYFtcImZvb1wiLCAtMV1gXG4gICAqIC0gYDxteS1jbXB0ICNmb28+YCA9PiBgW1wiZm9vXCIsIG15Q21wdElkeF1gXG4gICAqIC0gYDxteS1jbXB0ICNmb28gI2Jhcj1cImRpcmVjdGl2ZUV4cG9ydEFzXCI+YCA9PiBgW1wiZm9vXCIsIG15Q21wdElkeCwgXCJiYXJcIiwgZGlyZWN0aXZlSWR4XWBcbiAgICogLSBgPGRpdiAjZm9vICNiYXI9XCJkaXJlY3RpdmVFeHBvcnRBc1wiPmAgPT4gYFtcImZvb1wiLCAtMSwgXCJiYXJcIiwgZGlyZWN0aXZlSWR4XWBcbiAgICovXG4gIGxvY2FsTmFtZXM6IChzdHJpbmd8bnVtYmVyKVtdfG51bGw7XG5cbiAgLyoqIEluZm9ybWF0aW9uIGFib3V0IGlucHV0IHByb3BlcnRpZXMgdGhhdCBuZWVkIHRvIGJlIHNldCBvbmNlIGZyb20gYXR0cmlidXRlIGRhdGEuICovXG4gIGluaXRpYWxJbnB1dHM6IEluaXRpYWxJbnB1dERhdGF8bnVsbHx1bmRlZmluZWQ7XG5cbiAgLyoqXG4gICAqIElucHV0IGRhdGEgZm9yIGFsbCBkaXJlY3RpdmVzIG9uIHRoaXMgbm9kZS4gYG51bGxgIG1lYW5zIHRoYXQgdGhlcmUgYXJlIG5vIGRpcmVjdGl2ZXMgd2l0aFxuICAgKiBpbnB1dHMgb24gdGhpcyBub2RlLlxuICAgKi9cbiAgaW5wdXRzOiBQcm9wZXJ0eUFsaWFzZXN8bnVsbDtcblxuICAvKipcbiAgICogT3V0cHV0IGRhdGEgZm9yIGFsbCBkaXJlY3RpdmVzIG9uIHRoaXMgbm9kZS4gYG51bGxgIG1lYW5zIHRoYXQgdGhlcmUgYXJlIG5vIGRpcmVjdGl2ZXMgd2l0aFxuICAgKiBvdXRwdXRzIG9uIHRoaXMgbm9kZS5cbiAgICovXG4gIG91dHB1dHM6IFByb3BlcnR5QWxpYXNlc3xudWxsO1xuXG4gIC8qKlxuICAgKiBUaGUgVFZpZXcgb3IgVFZpZXdzIGF0dGFjaGVkIHRvIHRoaXMgbm9kZS5cbiAgICpcbiAgICogSWYgdGhpcyBUTm9kZSBjb3JyZXNwb25kcyB0byBhbiBMQ29udGFpbmVyIHdpdGggaW5saW5lIHZpZXdzLCB0aGUgY29udGFpbmVyIHdpbGxcbiAgICogbmVlZCB0byBzdG9yZSBzZXBhcmF0ZSBzdGF0aWMgZGF0YSBmb3IgZWFjaCBvZiBpdHMgdmlldyBibG9ja3MgKFRWaWV3W10pLiBPdGhlcndpc2UsXG4gICAqIG5vZGVzIGluIGlubGluZSB2aWV3cyB3aXRoIHRoZSBzYW1lIGluZGV4IGFzIG5vZGVzIGluIHRoZWlyIHBhcmVudCB2aWV3cyB3aWxsIG92ZXJ3cml0ZVxuICAgKiBlYWNoIG90aGVyLCBhcyB0aGV5IGFyZSBpbiB0aGUgc2FtZSB0ZW1wbGF0ZS5cbiAgICpcbiAgICogRWFjaCBpbmRleCBpbiB0aGlzIGFycmF5IGNvcnJlc3BvbmRzIHRvIHRoZSBzdGF0aWMgZGF0YSBmb3IgYSBjZXJ0YWluXG4gICAqIHZpZXcuIFNvIGlmIHlvdSBoYWQgVigwKSBhbmQgVigxKSBpbiBhIGNvbnRhaW5lciwgeW91IG1pZ2h0IGhhdmU6XG4gICAqXG4gICAqIFtcbiAgICogICBbe3RhZ05hbWU6ICdkaXYnLCBhdHRyczogLi4ufSwgbnVsbF0sICAgICAvLyBWKDApIFRWaWV3XG4gICAqICAgW3t0YWdOYW1lOiAnYnV0dG9uJywgYXR0cnMgLi4ufSwgbnVsbF0gICAgLy8gVigxKSBUVmlld1xuICAgKlxuICAgKiBJZiB0aGlzIFROb2RlIGNvcnJlc3BvbmRzIHRvIGFuIExDb250YWluZXIgd2l0aCBhIHRlbXBsYXRlIChlLmcuIHN0cnVjdHVyYWxcbiAgICogZGlyZWN0aXZlKSwgdGhlIHRlbXBsYXRlJ3MgVFZpZXcgd2lsbCBiZSBzdG9yZWQgaGVyZS5cbiAgICpcbiAgICogSWYgdGhpcyBUTm9kZSBjb3JyZXNwb25kcyB0byBhbiBlbGVtZW50LCB0Vmlld3Mgd2lsbCBiZSBudWxsIC5cbiAgICovXG4gIHRWaWV3czogVFZpZXd8VFZpZXdbXXxudWxsO1xuXG4gIC8qKlxuICAgKiBUaGUgbmV4dCBzaWJsaW5nIG5vZGUuIE5lY2Vzc2FyeSBzbyB3ZSBjYW4gcHJvcGFnYXRlIHRocm91Z2ggdGhlIHJvb3Qgbm9kZXMgb2YgYSB2aWV3XG4gICAqIHRvIGluc2VydCB0aGVtIG9yIHJlbW92ZSB0aGVtIGZyb20gdGhlIERPTS5cbiAgICovXG4gIG5leHQ6IFROb2RlfG51bGw7XG5cbiAgLyoqXG4gICAqIFRoZSBuZXh0IHByb2plY3RlZCBzaWJsaW5nLiBTaW5jZSBpbiBBbmd1bGFyIGNvbnRlbnQgcHJvamVjdGlvbiB3b3JrcyBvbiB0aGUgbm9kZS1ieS1ub2RlIGJhc2lzXG4gICAqIHRoZSBhY3Qgb2YgcHJvamVjdGluZyBub2RlcyBtaWdodCBjaGFuZ2Ugbm9kZXMgcmVsYXRpb25zaGlwIGF0IHRoZSBpbnNlcnRpb24gcG9pbnQgKHRhcmdldFxuICAgKiB2aWV3KS4gQXQgdGhlIHNhbWUgdGltZSB3ZSBuZWVkIHRvIGtlZXAgaW5pdGlhbCByZWxhdGlvbnNoaXAgYmV0d2VlbiBub2RlcyBhcyBleHByZXNzZWQgaW5cbiAgICogY29udGVudCB2aWV3LlxuICAgKi9cbiAgcHJvamVjdGlvbk5leHQ6IFROb2RlfG51bGw7XG5cbiAgLyoqXG4gICAqIEZpcnN0IGNoaWxkIG9mIHRoZSBjdXJyZW50IG5vZGUuXG4gICAqXG4gICAqIEZvciBjb21wb25lbnQgbm9kZXMsIHRoZSBjaGlsZCB3aWxsIGFsd2F5cyBiZSBhIENvbnRlbnRDaGlsZCAoaW4gc2FtZSB2aWV3KS5cbiAgICogRm9yIGVtYmVkZGVkIHZpZXcgbm9kZXMsIHRoZSBjaGlsZCB3aWxsIGJlIGluIHRoZWlyIGNoaWxkIHZpZXcuXG4gICAqL1xuICBjaGlsZDogVE5vZGV8bnVsbDtcblxuICAvKipcbiAgICogUGFyZW50IG5vZGUgKGluIHRoZSBzYW1lIHZpZXcgb25seSkuXG4gICAqXG4gICAqIFdlIG5lZWQgYSByZWZlcmVuY2UgdG8gYSBub2RlJ3MgcGFyZW50IHNvIHdlIGNhbiBhcHBlbmQgdGhlIG5vZGUgdG8gaXRzIHBhcmVudCdzIG5hdGl2ZVxuICAgKiBlbGVtZW50IGF0IHRoZSBhcHByb3ByaWF0ZSB0aW1lLlxuICAgKlxuICAgKiBJZiB0aGUgcGFyZW50IHdvdWxkIGJlIGluIGEgZGlmZmVyZW50IHZpZXcgKGUuZy4gY29tcG9uZW50IGhvc3QpLCB0aGlzIHByb3BlcnR5IHdpbGwgYmUgbnVsbC5cbiAgICogSXQncyBpbXBvcnRhbnQgdGhhdCB3ZSBkb24ndCB0cnkgdG8gY3Jvc3MgY29tcG9uZW50IGJvdW5kYXJpZXMgd2hlbiByZXRyaWV2aW5nIHRoZSBwYXJlbnRcbiAgICogYmVjYXVzZSB0aGUgcGFyZW50IHdpbGwgY2hhbmdlIChlLmcuIGluZGV4LCBhdHRycykgZGVwZW5kaW5nIG9uIHdoZXJlIHRoZSBjb21wb25lbnQgd2FzXG4gICAqIHVzZWQgKGFuZCB0aHVzIHNob3VsZG4ndCBiZSBzdG9yZWQgb24gVE5vZGUpLiBJbiB0aGVzZSBjYXNlcywgd2UgcmV0cmlldmUgdGhlIHBhcmVudCB0aHJvdWdoXG4gICAqIExWaWV3Lm5vZGUgaW5zdGVhZCAod2hpY2ggd2lsbCBiZSBpbnN0YW5jZS1zcGVjaWZpYykuXG4gICAqXG4gICAqIElmIHRoaXMgaXMgYW4gaW5saW5lIHZpZXcgbm9kZSAoViksIHRoZSBwYXJlbnQgd2lsbCBiZSBpdHMgY29udGFpbmVyLlxuICAgKi9cbiAgcGFyZW50OiBURWxlbWVudE5vZGV8VENvbnRhaW5lck5vZGV8bnVsbDtcblxuICAvKipcbiAgICogTGlzdCBvZiBwcm9qZWN0ZWQgVE5vZGVzIGZvciBhIGdpdmVuIGNvbXBvbmVudCBob3N0IGVsZW1lbnQgT1IgaW5kZXggaW50byB0aGUgc2FpZCBub2Rlcy5cbiAgICpcbiAgICogRm9yIGVhc2llciBkaXNjdXNzaW9uIGFzc3VtZSB0aGlzIGV4YW1wbGU6XG4gICAqIGA8cGFyZW50PmAncyB2aWV3IGRlZmluaXRpb246XG4gICAqIGBgYFxuICAgKiA8Y2hpbGQgaWQ9XCJjMVwiPmNvbnRlbnQxPC9jaGlsZD5cbiAgICogPGNoaWxkIGlkPVwiYzJcIj48c3Bhbj5jb250ZW50Mjwvc3Bhbj48L2NoaWxkPlxuICAgKiBgYGBcbiAgICogYDxjaGlsZD5gJ3MgdmlldyBkZWZpbml0aW9uOlxuICAgKiBgYGBcbiAgICogPG5nLWNvbnRlbnQgaWQ9XCJjb250MVwiPjwvbmctY29udGVudD5cbiAgICogYGBgXG4gICAqXG4gICAqIElmIGBBcnJheS5pc0FycmF5KHByb2plY3Rpb24pYCB0aGVuIGBUTm9kZWAgaXMgYSBob3N0IGVsZW1lbnQ6XG4gICAqIC0gYHByb2plY3Rpb25gIHN0b3JlcyB0aGUgY29udGVudCBub2RlcyB3aGljaCBhcmUgdG8gYmUgcHJvamVjdGVkLlxuICAgKiAgICAtIFRoZSBub2RlcyByZXByZXNlbnQgY2F0ZWdvcmllcyBkZWZpbmVkIGJ5IHRoZSBzZWxlY3RvcjogRm9yIGV4YW1wbGU6XG4gICAqICAgICAgYDxuZy1jb250ZW50Lz48bmctY29udGVudCBzZWxlY3Q9XCJhYmNcIi8+YCB3b3VsZCByZXByZXNlbnQgdGhlIGhlYWRzIGZvciBgPG5nLWNvbnRlbnQvPmBcbiAgICogICAgICBhbmQgYDxuZy1jb250ZW50IHNlbGVjdD1cImFiY1wiLz5gIHJlc3BlY3RpdmVseS5cbiAgICogICAgLSBUaGUgbm9kZXMgd2Ugc3RvcmUgaW4gYHByb2plY3Rpb25gIGFyZSBoZWFkcyBvbmx5LCB3ZSB1c2VkIGAubmV4dGAgdG8gZ2V0IHRoZWlyXG4gICAqICAgICAgc2libGluZ3MuXG4gICAqICAgIC0gVGhlIG5vZGVzIGAubmV4dGAgaXMgc29ydGVkL3Jld3JpdHRlbiBhcyBwYXJ0IG9mIHRoZSBwcm9qZWN0aW9uIHNldHVwLlxuICAgKiAgICAtIGBwcm9qZWN0aW9uYCBzaXplIGlzIGVxdWFsIHRvIHRoZSBudW1iZXIgb2YgcHJvamVjdGlvbnMgYDxuZy1jb250ZW50PmAuIFRoZSBzaXplIG9mXG4gICAqICAgICAgYGMxYCB3aWxsIGJlIGAxYCBiZWNhdXNlIGA8Y2hpbGQ+YCBoYXMgb25seSBvbmUgYDxuZy1jb250ZW50PmAuXG4gICAqIC0gd2Ugc3RvcmUgYHByb2plY3Rpb25gIHdpdGggdGhlIGhvc3QgKGBjMWAsIGBjMmApIHJhdGhlciB0aGFuIHRoZSBgPG5nLWNvbnRlbnQ+YCAoYGNvbnQxYClcbiAgICogICBiZWNhdXNlIHRoZSBzYW1lIGNvbXBvbmVudCAoYDxjaGlsZD5gKSBjYW4gYmUgdXNlZCBpbiBtdWx0aXBsZSBsb2NhdGlvbnMgKGBjMWAsIGBjMmApIGFuZCBhc1xuICAgKiAgIGEgcmVzdWx0IGhhdmUgZGlmZmVyZW50IHNldCBvZiBub2RlcyB0byBwcm9qZWN0LlxuICAgKiAtIHdpdGhvdXQgYHByb2plY3Rpb25gIGl0IHdvdWxkIGJlIGRpZmZpY3VsdCB0byBlZmZpY2llbnRseSB0cmF2ZXJzZSBub2RlcyB0byBiZSBwcm9qZWN0ZWQuXG4gICAqXG4gICAqIElmIGB0eXBlb2YgcHJvamVjdGlvbiA9PSAnbnVtYmVyJ2AgdGhlbiBgVE5vZGVgIGlzIGEgYDxuZy1jb250ZW50PmAgZWxlbWVudDpcbiAgICogLSBgcHJvamVjdGlvbmAgaXMgYW4gaW5kZXggb2YgdGhlIGhvc3QncyBgcHJvamVjdGlvbmBOb2Rlcy5cbiAgICogICAtIFRoaXMgd291bGQgcmV0dXJuIHRoZSBmaXJzdCBoZWFkIG5vZGUgdG8gcHJvamVjdDpcbiAgICogICAgIGBnZXRIb3N0KGN1cnJlbnRUTm9kZSkucHJvamVjdGlvbltjdXJyZW50VE5vZGUucHJvamVjdGlvbl1gLlxuICAgKiAtIFdoZW4gcHJvamVjdGluZyBub2RlcyB0aGUgcGFyZW50IG5vZGUgcmV0cmlldmVkIG1heSBiZSBhIGA8bmctY29udGVudD5gIG5vZGUsIGluIHdoaWNoIGNhc2VcbiAgICogICB0aGUgcHJvY2VzcyBpcyByZWN1cnNpdmUgaW4gbmF0dXJlLlxuICAgKlxuICAgKiBJZiBgcHJvamVjdGlvbmAgaXMgb2YgdHlwZSBgUk5vZGVbXVtdYCB0aGFuIHdlIGhhdmUgYSBjb2xsZWN0aW9uIG9mIG5hdGl2ZSBub2RlcyBwYXNzZWQgYXNcbiAgICogcHJvamVjdGFibGUgbm9kZXMgZHVyaW5nIGR5bmFtaWMgY29tcG9uZW50IGNyZWF0aW9uLlxuICAgKi9cbiAgcHJvamVjdGlvbjogKFROb2RlfFJOb2RlW10pW118bnVtYmVyfG51bGw7XG5cbiAgLyoqXG4gICAqIEEgY29sbGVjdGlvbiBvZiBhbGwgc3R5bGUgc3RhdGljIHZhbHVlcyBmb3IgYW4gZWxlbWVudC5cbiAgICpcbiAgICogVGhpcyBmaWVsZCB3aWxsIGJlIHBvcHVsYXRlZCBpZiBhbmQgd2hlbjpcbiAgICpcbiAgICogLSBUaGVyZSBhcmUgb25lIG9yIG1vcmUgaW5pdGlhbCBzdHlsZXMgb24gYW4gZWxlbWVudCAoZS5nLiBgPGRpdiBzdHlsZT1cIndpZHRoOjIwMHB4XCI+YClcbiAgICovXG4gIHN0eWxlczogc3RyaW5nfG51bGw7XG5cbiAgLyoqXG4gICAqIEFuIGBBcnJheU1hcGAgdmVyc2lvbiBvZiByZXNpZHVhbCBgc3R5bGVzYC5cbiAgICpcbiAgICogV2hlbiB0aGVyZSBhcmUgc3R5bGluZyBpbnN0cnVjdGlvbnMgdGhhbiBlYWNoIGluc3RydWN0aW9uIHN0b3JlcyB0aGUgc3RhdGljIHN0eWxpbmdcbiAgICogd2hpY2ggaXMgb2YgbG93ZXIgcHJpb3JpdHkgdGhhbiBpdHNlbGYuIFRoaXMgbWVhbnMgdGhhdCB0aGVyZSBtYXkgYmUgYSBoaWdoZXIgcHJpb3JpdHkgc3R5bGluZ1xuICAgKiB0aGFuIHRoZSBpbnN0cnVjdGlvbi5cbiAgICpcbiAgICogSW1hZ2luZTpcbiAgICogYGBgXG4gICAqIDxkaXYgc3R5bGU9XCJjb2xvcjogaGlnaGVzdDtcIiBteS1kaXI+XG4gICAqXG4gICAqIEBEaXJlY3RpdmUoe1xuICAgKiAgIGhvc3Q6IHtcbiAgICogICAgIHN0eWxlOiAnY29sb3I6IGxvd2VzdDsgJyxcbiAgICogICAgICdbc3R5bGVzLmNvbG9yXSc6ICdleHAnIC8vIMm1ybVzdHlsZVByb3AoJ2NvbG9yJywgY3R4LmV4cCk7XG4gICAqICAgfVxuICAgKiB9KVxuICAgKiBgYGBcbiAgICpcbiAgICogSW4gdGhlIGFib3ZlIGNhc2U6XG4gICAqIC0gYGNvbG9yOiBsb3dlc3RgIGlzIHN0b3JlZCB3aXRoIGDJtcm1c3R5bGVQcm9wKCdjb2xvcicsIGN0eC5leHApO2AgaW5zdHJ1Y3Rpb25cbiAgICogLSAgYGNvbG9yOiBoaWdoZXN0YCBpcyB0aGUgcmVzaWR1YWwgYW5kIGlzIHN0b3JlZCBoZXJlLlxuICAgKlxuICAgKiAtIGB1bmRlZmluZWQnOiBub3QgaW5pdGlhbGl6ZWQuXG4gICAqIC0gYG51bGxgOiBpbml0aWFsaXplZCBidXQgYHN0eWxlc2AgaXMgYG51bGxgXG4gICAqIC0gYEFycmF5TWFwYDogcGFyc2VkIHZlcnNpb24gb2YgYHN0eWxlc2AuXG4gICAqL1xuICByZXNpZHVhbFN0eWxlczogQXJyYXlNYXA8YW55Pnx1bmRlZmluZWR8bnVsbDtcblxuICAvKipcbiAgICogQSBjb2xsZWN0aW9uIG9mIGFsbCBjbGFzcyBzdGF0aWMgdmFsdWVzIGZvciBhbiBlbGVtZW50LlxuICAgKlxuICAgKiBUaGlzIGZpZWxkIHdpbGwgYmUgcG9wdWxhdGVkIGlmIGFuZCB3aGVuOlxuICAgKlxuICAgKiAtIFRoZXJlIGFyZSBvbmUgb3IgbW9yZSBpbml0aWFsIGNsYXNzZXMgb24gYW4gZWxlbWVudCAoZS5nLiBgPGRpdiBjbGFzcz1cIm9uZSB0d28gdGhyZWVcIj5gKVxuICAgKi9cbiAgY2xhc3Nlczogc3RyaW5nfG51bGw7XG5cbiAgLyoqXG4gICAqIEFuIGBBcnJheU1hcGAgdmVyc2lvbiBvZiByZXNpZHVhbCBgY2xhc3Nlc2AuXG4gICAqXG4gICAqIFNhbWUgYXMgYFROb2RlLnJlc2lkdWFsU3R5bGVzYCBidXQgZm9yIGNsYXNzZXMuXG4gICAqXG4gICAqIC0gYHVuZGVmaW5lZCc6IG5vdCBpbml0aWFsaXplZC5cbiAgICogLSBgbnVsbGA6IGluaXRpYWxpemVkIGJ1dCBgY2xhc3Nlc2AgaXMgYG51bGxgXG4gICAqIC0gYEFycmF5TWFwYDogcGFyc2VkIHZlcnNpb24gb2YgYFNgLlxuICAgKi9cbiAgcmVzaWR1YWxDbGFzc2VzOiBBcnJheU1hcDxhbnk+fHVuZGVmaW5lZHxudWxsO1xuXG4gIC8qKlxuICAgKiBTdG9yZXMgdGhlIGhlYWQvdGFpbCBpbmRleCBvZiB0aGUgY2xhc3MgYmluZGluZ3MuXG4gICAqXG4gICAqIC0gSWYgbm8gYmluZGluZ3MsIHRoZSBoZWFkIGFuZCB0YWlsIHdpbGwgYm90aCBiZSAwLlxuICAgKiAtIElmIHRoZXJlIGFyZSB0ZW1wbGF0ZSBiaW5kaW5ncywgc3RvcmVzIHRoZSBoZWFkL3RhaWwgb2YgdGhlIGNsYXNzIGJpbmRpbmdzIGluIHRoZSB0ZW1wbGF0ZS5cbiAgICogLSBJZiBubyB0ZW1wbGF0ZSBiaW5kaW5ncyBidXQgdGhlcmUgYXJlIGhvc3QgYmluZGluZ3MsIHRoZSBoZWFkIHZhbHVlIHdpbGwgcG9pbnQgdG8gdGhlIGxhc3RcbiAgICogICBob3N0IGJpbmRpbmcgZm9yIFwiY2xhc3NcIiAobm90IHRoZSBoZWFkIG9mIHRoZSBsaW5rZWQgbGlzdCksIHRhaWwgd2lsbCBiZSAwLlxuICAgKlxuICAgKiBTZWU6IGBzdHlsZV9iaW5kaW5nX2xpc3QudHNgIGZvciBkZXRhaWxzLlxuICAgKlxuICAgKiBUaGlzIGlzIHVzZWQgYnkgYGluc2VydFRTdHlsaW5nQmluZGluZ2AgdG8ga25vdyB3aGVyZSB0aGUgbmV4dCBzdHlsaW5nIGJpbmRpbmcgc2hvdWxkIGJlXG4gICAqIGluc2VydGVkIHNvIHRoYXQgdGhleSBjYW4gYmUgc29ydGVkIGluIHByaW9yaXR5IG9yZGVyLlxuICAgKi9cbiAgY2xhc3NCaW5kaW5nczogVFN0eWxpbmdSYW5nZTtcblxuICAvKipcbiAgICogU3RvcmVzIHRoZSBoZWFkL3RhaWwgaW5kZXggb2YgdGhlIGNsYXNzIGJpbmRpbmdzLlxuICAgKlxuICAgKiAtIElmIG5vIGJpbmRpbmdzLCB0aGUgaGVhZCBhbmQgdGFpbCB3aWxsIGJvdGggYmUgMC5cbiAgICogLSBJZiB0aGVyZSBhcmUgdGVtcGxhdGUgYmluZGluZ3MsIHN0b3JlcyB0aGUgaGVhZC90YWlsIG9mIHRoZSBzdHlsZSBiaW5kaW5ncyBpbiB0aGUgdGVtcGxhdGUuXG4gICAqIC0gSWYgbm8gdGVtcGxhdGUgYmluZGluZ3MgYnV0IHRoZXJlIGFyZSBob3N0IGJpbmRpbmdzLCB0aGUgaGVhZCB2YWx1ZSB3aWxsIHBvaW50IHRvIHRoZSBsYXN0XG4gICAqICAgaG9zdCBiaW5kaW5nIGZvciBcInN0eWxlXCIgKG5vdCB0aGUgaGVhZCBvZiB0aGUgbGlua2VkIGxpc3QpLCB0YWlsIHdpbGwgYmUgMC5cbiAgICpcbiAgICogU2VlOiBgc3R5bGVfYmluZGluZ19saXN0LnRzYCBmb3IgZGV0YWlscy5cbiAgICpcbiAgICogVGhpcyBpcyB1c2VkIGJ5IGBpbnNlcnRUU3R5bGluZ0JpbmRpbmdgIHRvIGtub3cgd2hlcmUgdGhlIG5leHQgc3R5bGluZyBiaW5kaW5nIHNob3VsZCBiZVxuICAgKiBpbnNlcnRlZCBzbyB0aGF0IHRoZXkgY2FuIGJlIHNvcnRlZCBpbiBwcmlvcml0eSBvcmRlci5cbiAgICovXG4gIHN0eWxlQmluZGluZ3M6IFRTdHlsaW5nUmFuZ2U7XG59XG5cbi8qKiBTdGF0aWMgZGF0YSBmb3IgYW4gZWxlbWVudCAgKi9cbmV4cG9ydCBpbnRlcmZhY2UgVEVsZW1lbnROb2RlIGV4dGVuZHMgVE5vZGUge1xuICAvKiogSW5kZXggaW4gdGhlIGRhdGFbXSBhcnJheSAqL1xuICBpbmRleDogbnVtYmVyO1xuICBjaGlsZDogVEVsZW1lbnROb2RlfFRUZXh0Tm9kZXxURWxlbWVudENvbnRhaW5lck5vZGV8VENvbnRhaW5lck5vZGV8VFByb2plY3Rpb25Ob2RlfG51bGw7XG4gIC8qKlxuICAgKiBFbGVtZW50IG5vZGVzIHdpbGwgaGF2ZSBwYXJlbnRzIHVubGVzcyB0aGV5IGFyZSB0aGUgZmlyc3Qgbm9kZSBvZiBhIGNvbXBvbmVudCBvclxuICAgKiBlbWJlZGRlZCB2aWV3ICh3aGljaCBtZWFucyB0aGVpciBwYXJlbnQgaXMgaW4gYSBkaWZmZXJlbnQgdmlldyBhbmQgbXVzdCBiZVxuICAgKiByZXRyaWV2ZWQgdXNpbmcgdmlld0RhdGFbSE9TVF9OT0RFXSkuXG4gICAqL1xuICBwYXJlbnQ6IFRFbGVtZW50Tm9kZXxURWxlbWVudENvbnRhaW5lck5vZGV8bnVsbDtcbiAgdFZpZXdzOiBudWxsO1xuXG4gIC8qKlxuICAgKiBJZiB0aGlzIGlzIGEgY29tcG9uZW50IFROb2RlIHdpdGggcHJvamVjdGlvbiwgdGhpcyB3aWxsIGJlIGFuIGFycmF5IG9mIHByb2plY3RlZFxuICAgKiBUTm9kZXMgb3IgbmF0aXZlIG5vZGVzIChzZWUgVE5vZGUucHJvamVjdGlvbiBmb3IgbW9yZSBpbmZvKS4gSWYgaXQncyBhIHJlZ3VsYXIgZWxlbWVudCBub2RlIG9yXG4gICAqIGEgY29tcG9uZW50IHdpdGhvdXQgcHJvamVjdGlvbiwgaXQgd2lsbCBiZSBudWxsLlxuICAgKi9cbiAgcHJvamVjdGlvbjogKFROb2RlfFJOb2RlW10pW118bnVsbDtcbn1cblxuLyoqIFN0YXRpYyBkYXRhIGZvciBhIHRleHQgbm9kZSAqL1xuZXhwb3J0IGludGVyZmFjZSBUVGV4dE5vZGUgZXh0ZW5kcyBUTm9kZSB7XG4gIC8qKiBJbmRleCBpbiB0aGUgZGF0YVtdIGFycmF5ICovXG4gIGluZGV4OiBudW1iZXI7XG4gIGNoaWxkOiBudWxsO1xuICAvKipcbiAgICogVGV4dCBub2RlcyB3aWxsIGhhdmUgcGFyZW50cyB1bmxlc3MgdGhleSBhcmUgdGhlIGZpcnN0IG5vZGUgb2YgYSBjb21wb25lbnQgb3JcbiAgICogZW1iZWRkZWQgdmlldyAod2hpY2ggbWVhbnMgdGhlaXIgcGFyZW50IGlzIGluIGEgZGlmZmVyZW50IHZpZXcgYW5kIG11c3QgYmVcbiAgICogcmV0cmlldmVkIHVzaW5nIExWaWV3Lm5vZGUpLlxuICAgKi9cbiAgcGFyZW50OiBURWxlbWVudE5vZGV8VEVsZW1lbnRDb250YWluZXJOb2RlfG51bGw7XG4gIHRWaWV3czogbnVsbDtcbiAgcHJvamVjdGlvbjogbnVsbDtcbn1cblxuLyoqIFN0YXRpYyBkYXRhIGZvciBhbiBMQ29udGFpbmVyICovXG5leHBvcnQgaW50ZXJmYWNlIFRDb250YWluZXJOb2RlIGV4dGVuZHMgVE5vZGUge1xuICAvKipcbiAgICogSW5kZXggaW4gdGhlIGRhdGFbXSBhcnJheS5cbiAgICpcbiAgICogSWYgaXQncyAtMSwgdGhpcyBpcyBhIGR5bmFtaWNhbGx5IGNyZWF0ZWQgY29udGFpbmVyIG5vZGUgdGhhdCBpc24ndCBzdG9yZWQgaW5cbiAgICogZGF0YVtdIChlLmcuIHdoZW4geW91IGluamVjdCBWaWV3Q29udGFpbmVyUmVmKSAuXG4gICAqL1xuICBpbmRleDogbnVtYmVyO1xuICBjaGlsZDogbnVsbDtcblxuICAvKipcbiAgICogQ29udGFpbmVyIG5vZGVzIHdpbGwgaGF2ZSBwYXJlbnRzIHVubGVzczpcbiAgICpcbiAgICogLSBUaGV5IGFyZSB0aGUgZmlyc3Qgbm9kZSBvZiBhIGNvbXBvbmVudCBvciBlbWJlZGRlZCB2aWV3XG4gICAqIC0gVGhleSBhcmUgZHluYW1pY2FsbHkgY3JlYXRlZFxuICAgKi9cbiAgcGFyZW50OiBURWxlbWVudE5vZGV8VEVsZW1lbnRDb250YWluZXJOb2RlfG51bGw7XG4gIHRWaWV3czogVFZpZXd8VFZpZXdbXXxudWxsO1xuICBwcm9qZWN0aW9uOiBudWxsO1xufVxuXG4vKiogU3RhdGljIGRhdGEgZm9yIGFuIDxuZy1jb250YWluZXI+ICovXG5leHBvcnQgaW50ZXJmYWNlIFRFbGVtZW50Q29udGFpbmVyTm9kZSBleHRlbmRzIFROb2RlIHtcbiAgLyoqIEluZGV4IGluIHRoZSBMVmlld1tdIGFycmF5LiAqL1xuICBpbmRleDogbnVtYmVyO1xuICBjaGlsZDogVEVsZW1lbnROb2RlfFRUZXh0Tm9kZXxUQ29udGFpbmVyTm9kZXxURWxlbWVudENvbnRhaW5lck5vZGV8VFByb2plY3Rpb25Ob2RlfG51bGw7XG4gIHBhcmVudDogVEVsZW1lbnROb2RlfFRFbGVtZW50Q29udGFpbmVyTm9kZXxudWxsO1xuICB0Vmlld3M6IG51bGw7XG4gIHByb2plY3Rpb246IG51bGw7XG59XG5cbi8qKiBTdGF0aWMgZGF0YSBmb3IgYW4gSUNVIGV4cHJlc3Npb24gKi9cbmV4cG9ydCBpbnRlcmZhY2UgVEljdUNvbnRhaW5lck5vZGUgZXh0ZW5kcyBUTm9kZSB7XG4gIC8qKiBJbmRleCBpbiB0aGUgTFZpZXdbXSBhcnJheS4gKi9cbiAgaW5kZXg6IG51bWJlcjtcbiAgY2hpbGQ6IFRFbGVtZW50Tm9kZXxUVGV4dE5vZGV8bnVsbDtcbiAgcGFyZW50OiBURWxlbWVudE5vZGV8VEVsZW1lbnRDb250YWluZXJOb2RlfG51bGw7XG4gIHRWaWV3czogbnVsbDtcbiAgcHJvamVjdGlvbjogbnVsbDtcbiAgLyoqXG4gICAqIEluZGljYXRlcyB0aGUgY3VycmVudCBhY3RpdmUgY2FzZSBmb3IgYW4gSUNVIGV4cHJlc3Npb24uXG4gICAqIEl0IGlzIG51bGwgd2hlbiB0aGVyZSBpcyBubyBhY3RpdmUgY2FzZS5cbiAgICovXG4gIGFjdGl2ZUNhc2VJbmRleDogbnVtYmVyfG51bGw7XG59XG5cbi8qKiBTdGF0aWMgZGF0YSBmb3IgYSB2aWV3ICAqL1xuZXhwb3J0IGludGVyZmFjZSBUVmlld05vZGUgZXh0ZW5kcyBUTm9kZSB7XG4gIC8qKiBJZiAtMSwgaXQncyBhIGR5bmFtaWNhbGx5IGNyZWF0ZWQgdmlldy4gT3RoZXJ3aXNlLCBpdCBpcyB0aGUgdmlldyBibG9jayBJRC4gKi9cbiAgaW5kZXg6IG51bWJlcjtcbiAgY2hpbGQ6IFRFbGVtZW50Tm9kZXxUVGV4dE5vZGV8VEVsZW1lbnRDb250YWluZXJOb2RlfFRDb250YWluZXJOb2RlfFRQcm9qZWN0aW9uTm9kZXxudWxsO1xuICBwYXJlbnQ6IFRDb250YWluZXJOb2RlfG51bGw7XG4gIHRWaWV3czogbnVsbDtcbiAgcHJvamVjdGlvbjogbnVsbDtcbn1cblxuLyoqIFN0YXRpYyBkYXRhIGZvciBhbiBMUHJvamVjdGlvbk5vZGUgICovXG5leHBvcnQgaW50ZXJmYWNlIFRQcm9qZWN0aW9uTm9kZSBleHRlbmRzIFROb2RlIHtcbiAgLyoqIEluZGV4IGluIHRoZSBkYXRhW10gYXJyYXkgKi9cbiAgY2hpbGQ6IG51bGw7XG4gIC8qKlxuICAgKiBQcm9qZWN0aW9uIG5vZGVzIHdpbGwgaGF2ZSBwYXJlbnRzIHVubGVzcyB0aGV5IGFyZSB0aGUgZmlyc3Qgbm9kZSBvZiBhIGNvbXBvbmVudFxuICAgKiBvciBlbWJlZGRlZCB2aWV3ICh3aGljaCBtZWFucyB0aGVpciBwYXJlbnQgaXMgaW4gYSBkaWZmZXJlbnQgdmlldyBhbmQgbXVzdCBiZVxuICAgKiByZXRyaWV2ZWQgdXNpbmcgTFZpZXcubm9kZSkuXG4gICAqL1xuICBwYXJlbnQ6IFRFbGVtZW50Tm9kZXxURWxlbWVudENvbnRhaW5lck5vZGV8bnVsbDtcbiAgdFZpZXdzOiBudWxsO1xuXG4gIC8qKiBJbmRleCBvZiB0aGUgcHJvamVjdGlvbiBub2RlLiAoU2VlIFROb2RlLnByb2plY3Rpb24gZm9yIG1vcmUgaW5mby4pICovXG4gIHByb2plY3Rpb246IG51bWJlcjtcbn1cblxuLyoqXG4gKiBBIHVuaW9uIHR5cGUgcmVwcmVzZW50aW5nIGFsbCBUTm9kZSB0eXBlcyB0aGF0IGNhbiBob3N0IGEgZGlyZWN0aXZlLlxuICovXG5leHBvcnQgdHlwZSBURGlyZWN0aXZlSG9zdE5vZGUgPSBURWxlbWVudE5vZGUgfCBUQ29udGFpbmVyTm9kZSB8IFRFbGVtZW50Q29udGFpbmVyTm9kZTtcblxuLyoqXG4gKiBUaGlzIG1hcHBpbmcgaXMgbmVjZXNzYXJ5IHNvIHdlIGNhbiBzZXQgaW5wdXQgcHJvcGVydGllcyBhbmQgb3V0cHV0IGxpc3RlbmVyc1xuICogcHJvcGVybHkgYXQgcnVudGltZSB3aGVuIHByb3BlcnR5IG5hbWVzIGFyZSBtaW5pZmllZCBvciBhbGlhc2VkLlxuICpcbiAqIEtleTogdW5taW5pZmllZCAvIHB1YmxpYyBpbnB1dCBvciBvdXRwdXQgbmFtZVxuICogVmFsdWU6IGFycmF5IGNvbnRhaW5pbmcgbWluaWZpZWQgLyBpbnRlcm5hbCBuYW1lIGFuZCByZWxhdGVkIGRpcmVjdGl2ZSBpbmRleFxuICpcbiAqIFRoZSB2YWx1ZSBtdXN0IGJlIGFuIGFycmF5IHRvIHN1cHBvcnQgaW5wdXRzIGFuZCBvdXRwdXRzIHdpdGggdGhlIHNhbWUgbmFtZVxuICogb24gdGhlIHNhbWUgbm9kZS5cbiAqL1xuZXhwb3J0IHR5cGUgUHJvcGVydHlBbGlhc2VzID0ge1xuICAvLyBUaGlzIHVzZXMgYW4gb2JqZWN0IG1hcCBiZWNhdXNlIHVzaW5nIHRoZSBNYXAgdHlwZSB3b3VsZCBiZSB0b28gc2xvd1xuICBba2V5OiBzdHJpbmddOiBQcm9wZXJ0eUFsaWFzVmFsdWVcbn07XG5cbi8qKlxuICogU3RvcmUgdGhlIHJ1bnRpbWUgaW5wdXQgb3Igb3V0cHV0IG5hbWVzIGZvciBhbGwgdGhlIGRpcmVjdGl2ZXMuXG4gKlxuICogaSswOiBkaXJlY3RpdmUgaW5zdGFuY2UgaW5kZXhcbiAqIGkrMTogcHJpdmF0ZU5hbWVcbiAqXG4gKiBlLmcuIFswLCAnY2hhbmdlLW1pbmlmaWVkJ11cbiAqL1xuZXhwb3J0IHR5cGUgUHJvcGVydHlBbGlhc1ZhbHVlID0gKG51bWJlciB8IHN0cmluZylbXTtcblxuLyoqXG4gKiBUaGlzIGFycmF5IGNvbnRhaW5zIGluZm9ybWF0aW9uIGFib3V0IGlucHV0IHByb3BlcnRpZXMgdGhhdFxuICogbmVlZCB0byBiZSBzZXQgb25jZSBmcm9tIGF0dHJpYnV0ZSBkYXRhLiBJdCdzIG9yZGVyZWQgYnlcbiAqIGRpcmVjdGl2ZSBpbmRleCAocmVsYXRpdmUgdG8gZWxlbWVudCkgc28gaXQncyBzaW1wbGUgdG9cbiAqIGxvb2sgdXAgYSBzcGVjaWZpYyBkaXJlY3RpdmUncyBpbml0aWFsIGlucHV0IGRhdGEuXG4gKlxuICogV2l0aGluIGVhY2ggc3ViLWFycmF5OlxuICpcbiAqIGkrMDogYXR0cmlidXRlIG5hbWVcbiAqIGkrMTogbWluaWZpZWQvaW50ZXJuYWwgaW5wdXQgbmFtZVxuICogaSsyOiBpbml0aWFsIHZhbHVlXG4gKlxuICogSWYgYSBkaXJlY3RpdmUgb24gYSBub2RlIGRvZXMgbm90IGhhdmUgYW55IGlucHV0IHByb3BlcnRpZXNcbiAqIHRoYXQgc2hvdWxkIGJlIHNldCBmcm9tIGF0dHJpYnV0ZXMsIGl0cyBpbmRleCBpcyBzZXQgdG8gbnVsbFxuICogdG8gYXZvaWQgYSBzcGFyc2UgYXJyYXkuXG4gKlxuICogZS5nLiBbbnVsbCwgWydyb2xlLW1pbicsICdtaW5pZmllZC1pbnB1dCcsICdidXR0b24nXV1cbiAqL1xuZXhwb3J0IHR5cGUgSW5pdGlhbElucHV0RGF0YSA9IChJbml0aWFsSW5wdXRzIHwgbnVsbClbXTtcblxuLyoqXG4gKiBVc2VkIGJ5IEluaXRpYWxJbnB1dERhdGEgdG8gc3RvcmUgaW5wdXQgcHJvcGVydGllc1xuICogdGhhdCBzaG91bGQgYmUgc2V0IG9uY2UgZnJvbSBhdHRyaWJ1dGVzLlxuICpcbiAqIGkrMDogYXR0cmlidXRlIG5hbWVcbiAqIGkrMTogbWluaWZpZWQvaW50ZXJuYWwgaW5wdXQgbmFtZVxuICogaSsyOiBpbml0aWFsIHZhbHVlXG4gKlxuICogZS5nLiBbJ3JvbGUtbWluJywgJ21pbmlmaWVkLWlucHV0JywgJ2J1dHRvbiddXG4gKi9cbmV4cG9ydCB0eXBlIEluaXRpYWxJbnB1dHMgPSBzdHJpbmdbXTtcblxuLy8gTm90ZTogVGhpcyBoYWNrIGlzIG5lY2Vzc2FyeSBzbyB3ZSBkb24ndCBlcnJvbmVvdXNseSBnZXQgYSBjaXJjdWxhciBkZXBlbmRlbmN5XG4vLyBmYWlsdXJlIGJhc2VkIG9uIHR5cGVzLlxuZXhwb3J0IGNvbnN0IHVudXNlZFZhbHVlRXhwb3J0VG9QbGFjYXRlQWpkID0gMTtcblxuLyoqXG4gKiBUeXBlIHJlcHJlc2VudGluZyBhIHNldCBvZiBUTm9kZXMgdGhhdCBjYW4gaGF2ZSBsb2NhbCByZWZzIChgI2Zvb2ApIHBsYWNlZCBvbiB0aGVtLlxuICovXG5leHBvcnQgdHlwZSBUTm9kZVdpdGhMb2NhbFJlZnMgPSBUQ29udGFpbmVyTm9kZSB8IFRFbGVtZW50Tm9kZSB8IFRFbGVtZW50Q29udGFpbmVyTm9kZTtcblxuLyoqXG4gKiBUeXBlIGZvciBhIGZ1bmN0aW9uIHRoYXQgZXh0cmFjdHMgYSB2YWx1ZSBmb3IgYSBsb2NhbCByZWZzLlxuICogRXhhbXBsZTpcbiAqIC0gYDxkaXYgI25hdGl2ZURpdkVsPmAgLSBgbmF0aXZlRGl2RWxgIHNob3VsZCBwb2ludCB0byB0aGUgbmF0aXZlIGA8ZGl2PmAgZWxlbWVudDtcbiAqIC0gYDxuZy10ZW1wbGF0ZSAjdHBsUmVmPmAgLSBgdHBsUmVmYCBzaG91bGQgcG9pbnQgdG8gdGhlIGBUZW1wbGF0ZVJlZmAgaW5zdGFuY2U7XG4gKi9cbmV4cG9ydCB0eXBlIExvY2FsUmVmRXh0cmFjdG9yID0gKHROb2RlOiBUTm9kZVdpdGhMb2NhbFJlZnMsIGN1cnJlbnRWaWV3OiBMVmlldykgPT4gYW55O1xuXG4vKipcbiAqIFJldHVybnMgYHRydWVgIGlmIHRoZSBgVE5vZGVgIGhhcyBhIGRpcmVjdGl2ZSB3aGljaCBoYXMgYEBJbnB1dCgpYCBmb3IgYGNsYXNzYCBiaW5kaW5nLlxuICpcbiAqIGBgYFxuICogPGRpdiBteS1kaXIgW2NsYXNzXT1cImV4cFwiPjwvZGl2PlxuICogYGBgXG4gKiBhbmRcbiAqIGBgYFxuICogQERpcmVjdGl2ZSh7XG4gKiB9KVxuICogY2xhc3MgTXlEaXJlY3RpdmUge1xuICogICBASW5wdXQoKVxuICogICBjbGFzczogc3RyaW5nO1xuICogfVxuICogYGBgXG4gKlxuICogSW4gdGhlIGFib3ZlIGNhc2UgaXQgaXMgbmVjZXNzYXJ5IHRvIHdyaXRlIHRoZSByZWNvbmNpbGVkIHN0eWxpbmcgaW5mb3JtYXRpb24gaW50byB0aGVcbiAqIGRpcmVjdGl2ZSdzIGlucHV0LlxuICpcbiAqIEBwYXJhbSB0Tm9kZVxuICovXG5leHBvcnQgZnVuY3Rpb24gaGFzQ2xhc3NJbnB1dCh0Tm9kZTogVE5vZGUpIHtcbiAgcmV0dXJuICh0Tm9kZS5mbGFncyAmIFROb2RlRmxhZ3MuaGFzQ2xhc3NJbnB1dCkgIT09IDA7XG59XG5cbi8qKlxuICogUmV0dXJucyBgdHJ1ZWAgaWYgdGhlIGBUTm9kZWAgaGFzIGEgZGlyZWN0aXZlIHdoaWNoIGhhcyBgQElucHV0KClgIGZvciBgc3R5bGVgIGJpbmRpbmcuXG4gKlxuICogYGBgXG4gKiA8ZGl2IG15LWRpciBbc3R5bGVdPVwiZXhwXCI+PC9kaXY+XG4gKiBgYGBcbiAqIGFuZFxuICogYGBgXG4gKiBARGlyZWN0aXZlKHtcbiAqIH0pXG4gKiBjbGFzcyBNeURpcmVjdGl2ZSB7XG4gKiAgIEBJbnB1dCgpXG4gKiAgIGNsYXNzOiBzdHJpbmc7XG4gKiB9XG4gKiBgYGBcbiAqXG4gKiBJbiB0aGUgYWJvdmUgY2FzZSBpdCBpcyBuZWNlc3NhcnkgdG8gd3JpdGUgdGhlIHJlY29uY2lsZWQgc3R5bGluZyBpbmZvcm1hdGlvbiBpbnRvIHRoZVxuICogZGlyZWN0aXZlJ3MgaW5wdXQuXG4gKlxuICogQHBhcmFtIHROb2RlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBoYXNTdHlsZUlucHV0KHROb2RlOiBUTm9kZSkge1xuICByZXR1cm4gKHROb2RlLmZsYWdzICYgVE5vZGVGbGFncy5oYXNTdHlsZUlucHV0KSAhPT0gMDtcbn1cblxuLyoqXG4gKiBDb25zdGFudCBlbnVtcyBmb3IgYWNjZXNzaW5nIGRhdGEgaW4gdGhlIGBURGlyZWN0aXZlRGVmc2BcbiAqL1xuZXhwb3J0IGNvbnN0IGVudW0gRGlyZWN0aXZlRGVmcyB7XG4gIC8vLyBMb2NhdGlvbiB3aGVyZSB0aGUgU1RZTElOR19DVVJTT1IgaXMgc3RvcmVkLlxuICBTVFlMSU5HX0NVUlNPUiA9IDAsXG4gIC8vLyBIZWFkZXIgb2Zmc2V0IGZyb20gd2hpY2ggaXRlcmF0aW5nIG92ZXIgYERpcmVjdGl2ZURlZnNgIHNob3VsZCBzdGFydC5cbiAgSEVBREVSX09GRlNFVCA9IDFcbn1cblxuLyoqXG4gKiBDb25zdGFudCBlbnVtcyBmb3IgaW5pdGlhbCB2YWx1ZXMgaW4gdGhlIGBURGlyZWN0aXZlRGVmc2BcbiAqL1xuZXhwb3J0IGNvbnN0IGVudW0gRGlyZWN0aXZlRGVmc1ZhbHVlcyB7XG4gIC8vIEluaXRpYWwgdmFsdWUgZm9yIHRoZSBgU1RZTElOR19DVVJTT1JgXG4gIElOSVRJQUxfU1RZTElOR19DVVJTT1JfVkFMVUUgPSAwLFxufVxuXG4vKipcbiAqIFN0b3JlcyBgRGlyZWN0aXZlRGVmc2AgYXNzb2NpYXRlZCB3aXRoIHRoZSBjdXJyZW50IGBUTm9kZWAgYXMgd2VsbCBhcyBzdHlsaW5nIGN1cnNvci5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBURGlyZWN0aXZlRGVmcyBleHRlbmRzIEFycmF5PG51bWJlcnxEaXJlY3RpdmVEZWY8YW55Pj4ge1xuICAvKipcbiAgICogQXMgc3R5bGluZyBpbnN0cnVjdGlvbnMgKGDJtcm1c3R5bGVQcm9wYC9gybXJtWNsYXNzUHJvcGAvYMm1ybVzdHlsZU1hcGAvYMm1ybVjbGFzc01hcGApIGFyZSBleGVjdXRpbmdcbiAgICogdGhleSBhbHNvIG5lZWQgdG8gZ2V0IGEgaG9sZCBvZiB0aGUgYERpcmVjdGl2ZURlZi5ob3N0QXR0cnNgIGFuZCBzbyB0aGF0IHRoZXkga25vdyB3aGF0XG4gICAqIHN0YXRpYyBzdHlsaW5nIHZhbHVlcyB0byB1c2UuIFRoZSBzdHlsaW5nIGluc3RydWN0aW9ucyBuZWVkIHRoaXMgaW5mb3JtYXRpb24gc28gdGhhdCB0aGV5IGNhblxuICAgKiBsYXppbHkgY3JlYXRlIGBUU3R5bGluZ1N0YXRpY2AuXG4gICAqXG4gICAqIFdoZW4gc3R5bGluZyBpcyBleGVjdXRpbmcgaXQgY2FuIGdldCBhIGhvbGQgb2YgaXRzIGBEaXJlY3RpdmVEZWZzYCBidXQgdGhhdCBhbG9uZSBpcyBub3RcbiAgICogc3VmZmljaWVudCBmb3IgdHdvIHJlYXNvbnM6XG4gICAqIDEuIFN0eWxpbmcgaW5zdHJ1Y3Rpb24gbmVlZHMgdG8gY29hbGVzY2Ugb3RoZXIgZGlyZWN0aXZlcyB3aGljaCBjYW1lIGJlZm9yZSBpdCBhbmQgd2hpY2ggaGF2ZVxuICAgKiAgICBzdGF0aWMgdmFsdWUgYnV0IG1heSBub3QgaGF2ZSBhIHN0eWxpbmcgaW5zdHJ1Y3Rpb24gdG8gYXR0YWNoIHRoZSBzdGF0aWMgdmFsdWVzIHRvLlxuICAgKiAyLiBUaGVyZSBtYXkgYmUgbW9yZSB0aGFuIG9uZSBzdHlsaW5nIGluc3RydWN0aW9uIHBlciBgaG9zdEJpbmRpbmdzYCBhbmQgb25seSB0aGUgZmlyc3RcbiAgICogICAgc3R5bGluZyBpbnN0cnVjdGlvbiBzaG91bGQgY3JlYXRlIHRoZSBgVFN0eWxpbmdTdGF0aWNgLlxuICAgKlxuICAgKiBUaGUgYWxnb3JpdGhtIGZvciBkb2luZyB0aGlzIGlzOlxuICAgKiAtIGxvb2sgdXAgdGhlIGN1cnJlbnQgYERpcmVjdGl2ZURlZmAgYXNzb2NpYXRlZCB3aXRoIHRoZSBjdXJyZW50IGluc3RydWN0aW9uLlxuICAgKiAtIElmIGBTVFlMSU5HX0NVUlNPUiA9PT0gMCB8fCB0RGlyZWN0aXZlRGVmc1tzdHlsaW5nQ3Vyc29yXSAhPT0gY3VycmVudERpcmVjdGl2ZURlZmAgdGhhblxuICAgKiAgIGNyZWF0ZSBgVFN0eWxpbmdTdGF0aWNgIGFuZDpcbiAgICogICAtIGl0ZXJhdGUgb3ZlciBgVERpcmVjdGl2ZURlZnNbKytzdHlsaW5nQ3Vyc29yXWAgYW5kIGluc2VydCB0aGVtIGludG8gdGhlIGBUU3R5bGluZ1N0YXRpY2BcbiAgICogICAgIHVudGlsIHlvdSByZWFjaCBgRGlyZWN0aXZlRGVmYCBhc3NvY2lhdGVkIHdpdGggdGhlIGN1cnJlbnQgaW5zdHJ1Y3Rpb24uXG4gICAqIC0gSWYgbmV3IGBUU3R5bGluZ1N0YXRpY2Agd2FzIGNyZWF0ZWQsIHJlY29tcHV0ZSB0aGUgcmVzaWR1YWwgc3R5bGluZyB2YWx1ZXMuXG4gICAqXG4gICAqIFRoZSBhYm92ZSBhbGdvcml0aG0gd2lsbCBlbnN1cmUgdGhhdCB0aGUgc3R5bGluZyBpbnN0cnVjdGlvbnMgY29uc3VtZSBzdGF0aWMgc3R5bGluZyB2YWx1ZXNcbiAgICogYXNzb2NpYXRlZCB1bnRpbCBhIGdpdmVuIGluc3RydWN0aW9uLiBBZnRlciBjb25zdW1pbmcgaW5zdHJ1Y3Rpb25zLCBpdCBpcyBhbHdheXMgaW1wb3J0YW50IHRvXG4gICAqIGNsZWFyIHRoZSByZXNpZHVhbCAoU2VlIGBUTm9kZS5yZXNpZHVhbENsYXNzYC9gVE5vZGUucmVzaWR1YWxTdHlsZWApLCBzaW5jZSB0aGlzIG1heSBiZSB0aGVcbiAgICogbGFzdCBzdHlsaW5nIGluc3RydWN0aW9uLCBhbmQgd2UgbmVlZCB0byBsYXppbHkgcmVjcmVhdGUgdGhlIHJlc2lkdWFsIHZhbHVlIG9uIGFzIG5lZWRlZCBiYXNpcy5cbiAgICovXG4gIFtEaXJlY3RpdmVEZWZzLlNUWUxJTkdfQ1VSU09SXTogbnVtYmVyO1xufSJdfQ==