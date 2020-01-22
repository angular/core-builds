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
    /** Bit #9 - This bit is set if the node has initial styling */
    hasInitialStyling: 256,
    /**
     * Bit #10 - Whether or not there are class-based map bindings present.
     *
     * Examples include:
     * 1. `<div [class]="x">`
     * 2. `@HostBinding('class') x`
     */
    hasClassMapBindings: 512,
    /**
     * Bit #11 - Whether or not there are any class-based prop bindings present.
     *
     * Examples include:
     * 1. `<div [class.name]="x">`
     * 2. `@HostBinding('class.name') x`
     */
    hasClassPropBindings: 1024,
    /**
     * Bit #12 - whether or not there are any active [class] and [class.name] bindings
     */
    hasClassPropAndMapBindings: 1536,
    /**
     * Bit #13 - Whether or not the context contains one or more class-based template bindings.
     *
     * Examples include:
     * 1. `<div [class]="x">`
     * 2. `<div [class.name]="x">`
     */
    hasTemplateClassBindings: 2048,
    /**
     * Bit #14 - Whether or not the context contains one or more class-based host bindings.
     *
     * Examples include:
     * 1. `@HostBinding('class') x`
     * 2. `@HostBinding('class.name') x`
     */
    hasHostClassBindings: 4096,
    /**
     * Bit #15 - Whether or not there are two or more sources for a class property in the context.
     *
     * Examples include:
     * 1. prop + prop: `<div [class.active]="x" dir-that-sets-active-class>`
     * 2. map + prop: `<div [class]="x" [class.foo]>`
     * 3. map + map: `<div [class]="x" dir-that-sets-class>`
     */
    hasDuplicateClassBindings: 8192,
    /**
     * Bit #16 - Whether or not there are style-based map bindings present.
     *
     * Examples include:
     * 1. `<div [style]="x">`
     * 2. `@HostBinding('style') x`
     */
    hasStyleMapBindings: 16384,
    /**
     * Bit #17 - Whether or not there are any style-based prop bindings present.
     *
     * Examples include:
     * 1. `<div [style.prop]="x">`
     * 2. `@HostBinding('style.prop') x`
     */
    hasStylePropBindings: 32768,
    /**
     * Bit #18 - whether or not there are any active [style] and [style.prop] bindings
     */
    hasStylePropAndMapBindings: 49152,
    /**
     * Bit #19 - Whether or not the context contains one or more style-based template bindings.
     *
     * Examples include:
     * 1. `<div [style]="x">`
     * 2. `<div [style.prop]="x">`
     */
    hasTemplateStyleBindings: 65536,
    /**
     * Bit #20 - Whether or not the context contains one or more style-based host bindings.
     *
     * Examples include:
     * 1. `@HostBinding('style') x`
     * 2. `@HostBinding('style.prop') x`
     */
    hasHostStyleBindings: 131072,
    /**
     * Bit #21 - Whether or not there are two or more sources for a style property in the context.
     *
     * Examples include:
     * 1. prop + prop: `<div [style.width]="x" dir-that-sets-width>`
     * 2. map + prop: `<div [style]="x" [style.prop]>`
     * 3. map + map: `<div [style]="x" dir-that-sets-style>`
     */
    hasDuplicateStyleBindings: 262144,
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9kZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaW50ZXJmYWNlcy9ub2RlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQWdCQSxNQUFrQixTQUFTO0lBQ3pCOztPQUVHO0lBQ0gsU0FBUyxHQUFJO0lBQ2I7O09BRUc7SUFDSCxVQUFVLEdBQUk7SUFDZDs7T0FFRztJQUNILElBQUksR0FBSTtJQUNSOztPQUVHO0lBQ0gsT0FBTyxHQUFJO0lBQ1g7O09BRUc7SUFDSCxnQkFBZ0IsR0FBSTtJQUNwQjs7T0FFRztJQUNILFlBQVksR0FBSTtFQUNqQjs7O0FBS0QsTUFBa0IsVUFBVTtJQUMxQiwrRkFBK0Y7SUFDL0YsZUFBZSxHQUFNO0lBRXJCOzs7O1NBSUs7SUFDTCxlQUFlLEdBQU07SUFFckIsOERBQThEO0lBQzlELFdBQVcsR0FBTTtJQUVqQixpRkFBaUY7SUFDakYsZUFBZSxHQUFNO0lBRXJCLGtFQUFrRTtJQUNsRSxhQUFhLElBQU87SUFFcEIsa0VBQWtFO0lBQ2xFLGFBQWEsSUFBTztJQUVwQixtRUFBbUU7SUFDbkUsVUFBVSxJQUFPO0lBRWpCOzs7OztPQUtHO0lBQ0gsZUFBZSxLQUFPO0lBRXRCLCtEQUErRDtJQUMvRCxpQkFBaUIsS0FBUTtJQUV6Qjs7Ozs7O09BTUc7SUFDSCxtQkFBbUIsS0FBUTtJQUUzQjs7Ozs7O09BTUc7SUFDSCxvQkFBb0IsTUFBUTtJQUU1Qjs7T0FFRztJQUNILDBCQUEwQixNQUE2QztJQUV2RTs7Ozs7O09BTUc7SUFDSCx3QkFBd0IsTUFBUTtJQUVoQzs7Ozs7O09BTUc7SUFDSCxvQkFBb0IsTUFBUztJQUU3Qjs7Ozs7OztPQU9HO0lBQ0gseUJBQXlCLE1BQVM7SUFFbEM7Ozs7OztPQU1HO0lBQ0gsbUJBQW1CLE9BQVM7SUFFNUI7Ozs7OztPQU1HO0lBQ0gsb0JBQW9CLE9BQVM7SUFFN0I7O09BRUc7SUFDSCwwQkFBMEIsT0FBNkM7SUFFdkU7Ozs7OztPQU1HO0lBQ0gsd0JBQXdCLE9BQVU7SUFFbEM7Ozs7OztPQU1HO0lBQ0gsb0JBQW9CLFFBQVU7SUFFOUI7Ozs7Ozs7T0FPRztJQUNILHlCQUF5QixRQUFVO0VBQ3BDOzs7QUFLRCxNQUFrQixvQkFBb0I7SUFDcEMsNEZBQTRGO0lBQzVGLHVCQUF1QixPQUFxQztJQUU1RDswQkFDc0I7SUFDdEIsMEJBQTBCLElBQUs7SUFDL0IsNEJBQTRCLE9BQXFDO0VBQ2xFOzs7QUFLRCxNQUFrQixlQUFlO0lBQy9COzs7Ozs7T0FNRztJQUNILGtCQUFrQixJQUFLO0lBRXZCOzs7O09BSUc7SUFDSCxZQUFZLEdBQUk7SUFFaEI7Ozs7Ozs7Ozs7Ozs7OztRQWVJO0lBQ0osT0FBTyxHQUFJO0lBRVg7Ozs7Ozs7Ozs7Ozs7Ozs7T0FnQkc7SUFDSCxNQUFNLEdBQUk7SUFFVjs7Ozs7Ozs7Ozs7Ozs7T0FjRztJQUNILFFBQVEsR0FBSTtJQUVaOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O09Bc0JHO0lBQ0gsUUFBUSxHQUFJO0lBRVo7Ozs7Ozs7Ozs7Ozs7O09BY0c7SUFDSCxTQUFTLEdBQUk7SUFFYjs7Ozs7Ozs7Ozs7OztPQWFHO0lBQ0gsSUFBSSxHQUFJO0VBQ1Q7Ozs7Ozs7Ozs7Ozs7O0FBNEJELDJCQXlTQzs7Ozs7O0lBdlNDLHFCQUFnQjs7Ozs7Ozs7OztJQVVoQixzQkFBYzs7Ozs7Ozs7Ozs7Ozs7O0lBZWQsOEJBQXNCOzs7OztJQUt0QiwrQkFBdUI7Ozs7O0lBS3ZCLDZCQUFxQjs7Ozs7O0lBTXJCLGlDQUFnQzs7Ozs7SUFLaEMsc0JBQWtCOzs7Ozs7OztJQVNsQixnQ0FBc0M7Ozs7O0lBR3RDLHdCQUFxQjs7Ozs7Ozs7Ozs7Ozs7OztJQWdCckIsc0JBQXdCOzs7Ozs7Ozs7Ozs7O0lBYXhCLDRCQUE4Qjs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQW1COUIsMkJBQW1DOzs7OztJQUduQyw4QkFBK0M7Ozs7OztJQU0vQyx1QkFBNkI7Ozs7OztJQU03Qix3QkFBOEI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUFzQjlCLHVCQUEyQjs7Ozs7O0lBTTNCLHFCQUFpQjs7Ozs7Ozs7SUFRakIsK0JBQTJCOzs7Ozs7OztJQVEzQixzQkFBa0I7Ozs7Ozs7Ozs7Ozs7Ozs7SUFnQmxCLHVCQUF5Qzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUF5Q3pDLDJCQUEwQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUFxQjFDLHVCQUFvRDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUFxQnBELHdCQUFxRDs7Ozs7Ozs7Ozs7Ozs7O0lBZXJELDhCQUE2Qjs7Ozs7Ozs7Ozs7Ozs7O0lBZTdCLDhCQUE2Qjs7Ozs7O0FBSS9CLGtDQWtCQzs7Ozs7O0lBaEJDLDZCQUFjOztJQUNkLDZCQUF3Rjs7Ozs7OztJQU14Riw4QkFBZ0Q7O0lBQ2hELDhCQUFhOzs7Ozs7O0lBT2Isa0NBQW1DOzs7Ozs7QUFJckMsK0JBWUM7Ozs7OztJQVZDLDBCQUFjOztJQUNkLDBCQUFZOzs7Ozs7O0lBTVosMkJBQWdEOztJQUNoRCwyQkFBYTs7SUFDYiwrQkFBaUI7Ozs7OztBQUluQixvQ0FtQkM7Ozs7Ozs7OztJQVpDLCtCQUFjOztJQUNkLCtCQUFZOzs7Ozs7OztJQVFaLGdDQUFnRDs7SUFDaEQsZ0NBQTJCOztJQUMzQixvQ0FBaUI7Ozs7OztBQUluQiwyQ0FPQzs7Ozs7O0lBTEMsc0NBQWM7O0lBQ2Qsc0NBQXdGOztJQUN4Rix1Q0FBZ0Q7O0lBQ2hELHVDQUFhOztJQUNiLDJDQUFpQjs7Ozs7O0FBSW5CLHVDQVlDOzs7Ozs7SUFWQyxrQ0FBYzs7SUFDZCxrQ0FBbUM7O0lBQ25DLG1DQUFnRDs7SUFDaEQsbUNBQWE7O0lBQ2IsdUNBQWlCOzs7Ozs7SUFLakIsNENBQTZCOzs7Ozs7QUFJL0IsK0JBT0M7Ozs7OztJQUxDLDBCQUFjOztJQUNkLDBCQUF3Rjs7SUFDeEYsMkJBQTRCOztJQUM1QiwyQkFBYTs7SUFDYiwrQkFBaUI7Ozs7OztBQUluQixxQ0FhQzs7Ozs7O0lBWEMsZ0NBQVk7Ozs7Ozs7SUFNWixpQ0FBZ0Q7O0lBQ2hELGlDQUFhOzs7OztJQUdiLHFDQUFtQjs7Ozs7QUFtRXJCLE1BQU0sT0FBTyw2QkFBNkIsR0FBRyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0IHtTdHlsaW5nTWFwQXJyYXksIFRTdHlsaW5nQ29udGV4dCwgVFN0eWxpbmdSYW5nZX0gZnJvbSAnLi4vaW50ZXJmYWNlcy9zdHlsaW5nJztcbmltcG9ydCB7Q3NzU2VsZWN0b3J9IGZyb20gJy4vcHJvamVjdGlvbic7XG5pbXBvcnQge1JOb2RlfSBmcm9tICcuL3JlbmRlcmVyJztcbmltcG9ydCB7TFZpZXcsIFRWaWV3fSBmcm9tICcuL3ZpZXcnO1xuXG5cbi8qKlxuICogVE5vZGVUeXBlIGNvcnJlc3BvbmRzIHRvIHRoZSB7QGxpbmsgVE5vZGV9IGB0eXBlYCBwcm9wZXJ0eS5cbiAqL1xuZXhwb3J0IGNvbnN0IGVudW0gVE5vZGVUeXBlIHtcbiAgLyoqXG4gICAqIFRoZSBUTm9kZSBjb250YWlucyBpbmZvcm1hdGlvbiBhYm91dCBhbiB7QGxpbmsgTENvbnRhaW5lcn0gZm9yIGVtYmVkZGVkIHZpZXdzLlxuICAgKi9cbiAgQ29udGFpbmVyID0gMCxcbiAgLyoqXG4gICAqIFRoZSBUTm9kZSBjb250YWlucyBpbmZvcm1hdGlvbiBhYm91dCBhbiBgPG5nLWNvbnRlbnQ+YCBwcm9qZWN0aW9uXG4gICAqL1xuICBQcm9qZWN0aW9uID0gMSxcbiAgLyoqXG4gICAqIFRoZSBUTm9kZSBjb250YWlucyBpbmZvcm1hdGlvbiBhYm91dCBhbiB7QGxpbmsgTFZpZXd9XG4gICAqL1xuICBWaWV3ID0gMixcbiAgLyoqXG4gICAqIFRoZSBUTm9kZSBjb250YWlucyBpbmZvcm1hdGlvbiBhYm91dCBhIERPTSBlbGVtZW50IGFrYSB7QGxpbmsgUk5vZGV9LlxuICAgKi9cbiAgRWxlbWVudCA9IDMsXG4gIC8qKlxuICAgKiBUaGUgVE5vZGUgY29udGFpbnMgaW5mb3JtYXRpb24gYWJvdXQgYW4gYDxuZy1jb250YWluZXI+YCBlbGVtZW50IHtAbGluayBSTm9kZX0uXG4gICAqL1xuICBFbGVtZW50Q29udGFpbmVyID0gNCxcbiAgLyoqXG4gICAqIFRoZSBUTm9kZSBjb250YWlucyBpbmZvcm1hdGlvbiBhYm91dCBhbiBJQ1UgY29tbWVudCB1c2VkIGluIGBpMThuYC5cbiAgICovXG4gIEljdUNvbnRhaW5lciA9IDUsXG59XG5cbi8qKlxuICogQ29ycmVzcG9uZHMgdG8gdGhlIFROb2RlLmZsYWdzIHByb3BlcnR5LlxuICovXG5leHBvcnQgY29uc3QgZW51bSBUTm9kZUZsYWdzIHtcbiAgLyoqIEJpdCAjMSAtIFRoaXMgYml0IGlzIHNldCBpZiB0aGUgbm9kZSBpcyBhIGhvc3QgZm9yIGFueSBkaXJlY3RpdmUgKGluY2x1ZGluZyBhIGNvbXBvbmVudCkgKi9cbiAgaXNEaXJlY3RpdmVIb3N0ID0gMHgxLFxuXG4gIC8qKlxuICAgKiBCaXQgIzIgLSBUaGlzIGJpdCBpcyBzZXQgaWYgdGhlIG5vZGUgaXMgYSBob3N0IGZvciBhIGNvbXBvbmVudC5cbiAgICpcbiAgICogU2V0dGluZyB0aGlzIGJpdCBpbXBsaWVzIHRoYXQgdGhlIGBpc0RpcmVjdGl2ZUhvc3RgIGJpdCBpcyBzZXQgYXMgd2VsbC5cbiAgICogKi9cbiAgaXNDb21wb25lbnRIb3N0ID0gMHgyLFxuXG4gIC8qKiBCaXQgIzMgLSBUaGlzIGJpdCBpcyBzZXQgaWYgdGhlIG5vZGUgaGFzIGJlZW4gcHJvamVjdGVkICovXG4gIGlzUHJvamVjdGVkID0gMHg0LFxuXG4gIC8qKiBCaXQgIzQgLSBUaGlzIGJpdCBpcyBzZXQgaWYgYW55IGRpcmVjdGl2ZSBvbiB0aGlzIG5vZGUgaGFzIGNvbnRlbnQgcXVlcmllcyAqL1xuICBoYXNDb250ZW50UXVlcnkgPSAweDgsXG5cbiAgLyoqIEJpdCAjNSAtIFRoaXMgYml0IGlzIHNldCBpZiB0aGUgbm9kZSBoYXMgYW55IFwiY2xhc3NcIiBpbnB1dHMgKi9cbiAgaGFzQ2xhc3NJbnB1dCA9IDB4MTAsXG5cbiAgLyoqIEJpdCAjNiAtIFRoaXMgYml0IGlzIHNldCBpZiB0aGUgbm9kZSBoYXMgYW55IFwic3R5bGVcIiBpbnB1dHMgKi9cbiAgaGFzU3R5bGVJbnB1dCA9IDB4MjAsXG5cbiAgLyoqIEJpdCAjNyBUaGlzIGJpdCBpcyBzZXQgaWYgdGhlIG5vZGUgaGFzIGJlZW4gZGV0YWNoZWQgYnkgaTE4biAqL1xuICBpc0RldGFjaGVkID0gMHg0MCxcblxuICAvKipcbiAgICogQml0ICM4IC0gVGhpcyBiaXQgaXMgc2V0IGlmIHRoZSBub2RlIGhhcyBkaXJlY3RpdmVzIHdpdGggaG9zdCBiaW5kaW5ncy5cbiAgICpcbiAgICogVGhpcyBmbGFncyBhbGxvd3MgdXMgdG8gZ3VhcmQgaG9zdC1iaW5kaW5nIGxvZ2ljIGFuZCBpbnZva2UgaXQgb25seSBvbiBub2Rlc1xuICAgKiB0aGF0IGFjdHVhbGx5IGhhdmUgZGlyZWN0aXZlcyB3aXRoIGhvc3QgYmluZGluZ3MuXG4gICAqL1xuICBoYXNIb3N0QmluZGluZ3MgPSAweDgwLFxuXG4gIC8qKiBCaXQgIzkgLSBUaGlzIGJpdCBpcyBzZXQgaWYgdGhlIG5vZGUgaGFzIGluaXRpYWwgc3R5bGluZyAqL1xuICBoYXNJbml0aWFsU3R5bGluZyA9IDB4MTAwLFxuXG4gIC8qKlxuICAgKiBCaXQgIzEwIC0gV2hldGhlciBvciBub3QgdGhlcmUgYXJlIGNsYXNzLWJhc2VkIG1hcCBiaW5kaW5ncyBwcmVzZW50LlxuICAgKlxuICAgKiBFeGFtcGxlcyBpbmNsdWRlOlxuICAgKiAxLiBgPGRpdiBbY2xhc3NdPVwieFwiPmBcbiAgICogMi4gYEBIb3N0QmluZGluZygnY2xhc3MnKSB4YFxuICAgKi9cbiAgaGFzQ2xhc3NNYXBCaW5kaW5ncyA9IDB4MjAwLFxuXG4gIC8qKlxuICAgKiBCaXQgIzExIC0gV2hldGhlciBvciBub3QgdGhlcmUgYXJlIGFueSBjbGFzcy1iYXNlZCBwcm9wIGJpbmRpbmdzIHByZXNlbnQuXG4gICAqXG4gICAqIEV4YW1wbGVzIGluY2x1ZGU6XG4gICAqIDEuIGA8ZGl2IFtjbGFzcy5uYW1lXT1cInhcIj5gXG4gICAqIDIuIGBASG9zdEJpbmRpbmcoJ2NsYXNzLm5hbWUnKSB4YFxuICAgKi9cbiAgaGFzQ2xhc3NQcm9wQmluZGluZ3MgPSAweDQwMCxcblxuICAvKipcbiAgICogQml0ICMxMiAtIHdoZXRoZXIgb3Igbm90IHRoZXJlIGFyZSBhbnkgYWN0aXZlIFtjbGFzc10gYW5kIFtjbGFzcy5uYW1lXSBiaW5kaW5nc1xuICAgKi9cbiAgaGFzQ2xhc3NQcm9wQW5kTWFwQmluZGluZ3MgPSBoYXNDbGFzc01hcEJpbmRpbmdzIHwgaGFzQ2xhc3NQcm9wQmluZGluZ3MsXG5cbiAgLyoqXG4gICAqIEJpdCAjMTMgLSBXaGV0aGVyIG9yIG5vdCB0aGUgY29udGV4dCBjb250YWlucyBvbmUgb3IgbW9yZSBjbGFzcy1iYXNlZCB0ZW1wbGF0ZSBiaW5kaW5ncy5cbiAgICpcbiAgICogRXhhbXBsZXMgaW5jbHVkZTpcbiAgICogMS4gYDxkaXYgW2NsYXNzXT1cInhcIj5gXG4gICAqIDIuIGA8ZGl2IFtjbGFzcy5uYW1lXT1cInhcIj5gXG4gICAqL1xuICBoYXNUZW1wbGF0ZUNsYXNzQmluZGluZ3MgPSAweDgwMCxcblxuICAvKipcbiAgICogQml0ICMxNCAtIFdoZXRoZXIgb3Igbm90IHRoZSBjb250ZXh0IGNvbnRhaW5zIG9uZSBvciBtb3JlIGNsYXNzLWJhc2VkIGhvc3QgYmluZGluZ3MuXG4gICAqXG4gICAqIEV4YW1wbGVzIGluY2x1ZGU6XG4gICAqIDEuIGBASG9zdEJpbmRpbmcoJ2NsYXNzJykgeGBcbiAgICogMi4gYEBIb3N0QmluZGluZygnY2xhc3MubmFtZScpIHhgXG4gICAqL1xuICBoYXNIb3N0Q2xhc3NCaW5kaW5ncyA9IDB4MTAwMCxcblxuICAvKipcbiAgICogQml0ICMxNSAtIFdoZXRoZXIgb3Igbm90IHRoZXJlIGFyZSB0d28gb3IgbW9yZSBzb3VyY2VzIGZvciBhIGNsYXNzIHByb3BlcnR5IGluIHRoZSBjb250ZXh0LlxuICAgKlxuICAgKiBFeGFtcGxlcyBpbmNsdWRlOlxuICAgKiAxLiBwcm9wICsgcHJvcDogYDxkaXYgW2NsYXNzLmFjdGl2ZV09XCJ4XCIgZGlyLXRoYXQtc2V0cy1hY3RpdmUtY2xhc3M+YFxuICAgKiAyLiBtYXAgKyBwcm9wOiBgPGRpdiBbY2xhc3NdPVwieFwiIFtjbGFzcy5mb29dPmBcbiAgICogMy4gbWFwICsgbWFwOiBgPGRpdiBbY2xhc3NdPVwieFwiIGRpci10aGF0LXNldHMtY2xhc3M+YFxuICAgKi9cbiAgaGFzRHVwbGljYXRlQ2xhc3NCaW5kaW5ncyA9IDB4MjAwMCxcblxuICAvKipcbiAgICogQml0ICMxNiAtIFdoZXRoZXIgb3Igbm90IHRoZXJlIGFyZSBzdHlsZS1iYXNlZCBtYXAgYmluZGluZ3MgcHJlc2VudC5cbiAgICpcbiAgICogRXhhbXBsZXMgaW5jbHVkZTpcbiAgICogMS4gYDxkaXYgW3N0eWxlXT1cInhcIj5gXG4gICAqIDIuIGBASG9zdEJpbmRpbmcoJ3N0eWxlJykgeGBcbiAgICovXG4gIGhhc1N0eWxlTWFwQmluZGluZ3MgPSAweDQwMDAsXG5cbiAgLyoqXG4gICAqIEJpdCAjMTcgLSBXaGV0aGVyIG9yIG5vdCB0aGVyZSBhcmUgYW55IHN0eWxlLWJhc2VkIHByb3AgYmluZGluZ3MgcHJlc2VudC5cbiAgICpcbiAgICogRXhhbXBsZXMgaW5jbHVkZTpcbiAgICogMS4gYDxkaXYgW3N0eWxlLnByb3BdPVwieFwiPmBcbiAgICogMi4gYEBIb3N0QmluZGluZygnc3R5bGUucHJvcCcpIHhgXG4gICAqL1xuICBoYXNTdHlsZVByb3BCaW5kaW5ncyA9IDB4ODAwMCxcblxuICAvKipcbiAgICogQml0ICMxOCAtIHdoZXRoZXIgb3Igbm90IHRoZXJlIGFyZSBhbnkgYWN0aXZlIFtzdHlsZV0gYW5kIFtzdHlsZS5wcm9wXSBiaW5kaW5nc1xuICAgKi9cbiAgaGFzU3R5bGVQcm9wQW5kTWFwQmluZGluZ3MgPSBoYXNTdHlsZU1hcEJpbmRpbmdzIHwgaGFzU3R5bGVQcm9wQmluZGluZ3MsXG5cbiAgLyoqXG4gICAqIEJpdCAjMTkgLSBXaGV0aGVyIG9yIG5vdCB0aGUgY29udGV4dCBjb250YWlucyBvbmUgb3IgbW9yZSBzdHlsZS1iYXNlZCB0ZW1wbGF0ZSBiaW5kaW5ncy5cbiAgICpcbiAgICogRXhhbXBsZXMgaW5jbHVkZTpcbiAgICogMS4gYDxkaXYgW3N0eWxlXT1cInhcIj5gXG4gICAqIDIuIGA8ZGl2IFtzdHlsZS5wcm9wXT1cInhcIj5gXG4gICAqL1xuICBoYXNUZW1wbGF0ZVN0eWxlQmluZGluZ3MgPSAweDEwMDAwLFxuXG4gIC8qKlxuICAgKiBCaXQgIzIwIC0gV2hldGhlciBvciBub3QgdGhlIGNvbnRleHQgY29udGFpbnMgb25lIG9yIG1vcmUgc3R5bGUtYmFzZWQgaG9zdCBiaW5kaW5ncy5cbiAgICpcbiAgICogRXhhbXBsZXMgaW5jbHVkZTpcbiAgICogMS4gYEBIb3N0QmluZGluZygnc3R5bGUnKSB4YFxuICAgKiAyLiBgQEhvc3RCaW5kaW5nKCdzdHlsZS5wcm9wJykgeGBcbiAgICovXG4gIGhhc0hvc3RTdHlsZUJpbmRpbmdzID0gMHgyMDAwMCxcblxuICAvKipcbiAgICogQml0ICMyMSAtIFdoZXRoZXIgb3Igbm90IHRoZXJlIGFyZSB0d28gb3IgbW9yZSBzb3VyY2VzIGZvciBhIHN0eWxlIHByb3BlcnR5IGluIHRoZSBjb250ZXh0LlxuICAgKlxuICAgKiBFeGFtcGxlcyBpbmNsdWRlOlxuICAgKiAxLiBwcm9wICsgcHJvcDogYDxkaXYgW3N0eWxlLndpZHRoXT1cInhcIiBkaXItdGhhdC1zZXRzLXdpZHRoPmBcbiAgICogMi4gbWFwICsgcHJvcDogYDxkaXYgW3N0eWxlXT1cInhcIiBbc3R5bGUucHJvcF0+YFxuICAgKiAzLiBtYXAgKyBtYXA6IGA8ZGl2IFtzdHlsZV09XCJ4XCIgZGlyLXRoYXQtc2V0cy1zdHlsZT5gXG4gICAqL1xuICBoYXNEdXBsaWNhdGVTdHlsZUJpbmRpbmdzID0gMHg0MDAwMCxcbn1cblxuLyoqXG4gKiBDb3JyZXNwb25kcyB0byB0aGUgVE5vZGUucHJvdmlkZXJJbmRleGVzIHByb3BlcnR5LlxuICovXG5leHBvcnQgY29uc3QgZW51bSBUTm9kZVByb3ZpZGVySW5kZXhlcyB7XG4gIC8qKiBUaGUgaW5kZXggb2YgdGhlIGZpcnN0IHByb3ZpZGVyIG9uIHRoaXMgbm9kZSBpcyBlbmNvZGVkIG9uIHRoZSBsZWFzdCBzaWduaWZpY2FudCBiaXRzICovXG4gIFByb3ZpZGVyc1N0YXJ0SW5kZXhNYXNrID0gMGIwMDAwMDAwMDAwMDAwMDAwMTExMTExMTExMTExMTExMSxcblxuICAvKiogVGhlIGNvdW50IG9mIHZpZXcgcHJvdmlkZXJzIGZyb20gdGhlIGNvbXBvbmVudCBvbiB0aGlzIG5vZGUgaXMgZW5jb2RlZCBvbiB0aGUgMTYgbW9zdFxuICAgICBzaWduaWZpY2FudCBiaXRzICovXG4gIENwdFZpZXdQcm92aWRlcnNDb3VudFNoaWZ0ID0gMTYsXG4gIENwdFZpZXdQcm92aWRlcnNDb3VudFNoaWZ0ZXIgPSAwYjAwMDAwMDAwMDAwMDAwMDEwMDAwMDAwMDAwMDAwMDAwLFxufVxuLyoqXG4gKiBBIHNldCBvZiBtYXJrZXIgdmFsdWVzIHRvIGJlIHVzZWQgaW4gdGhlIGF0dHJpYnV0ZXMgYXJyYXlzLiBUaGVzZSBtYXJrZXJzIGluZGljYXRlIHRoYXQgc29tZVxuICogaXRlbXMgYXJlIG5vdCByZWd1bGFyIGF0dHJpYnV0ZXMgYW5kIHRoZSBwcm9jZXNzaW5nIHNob3VsZCBiZSBhZGFwdGVkIGFjY29yZGluZ2x5LlxuICovXG5leHBvcnQgY29uc3QgZW51bSBBdHRyaWJ1dGVNYXJrZXIge1xuICAvKipcbiAgICogQW4gaW1wbGljaXQgbWFya2VyIHdoaWNoIGluZGljYXRlcyB0aGF0IHRoZSB2YWx1ZSBpbiB0aGUgYXJyYXkgYXJlIG9mIGBhdHRyaWJ1dGVLZXlgLFxuICAgKiBgYXR0cmlidXRlVmFsdWVgIGZvcm1hdC5cbiAgICpcbiAgICogTk9URTogVGhpcyBpcyBpbXBsaWNpdCBhcyBpdCBpcyB0aGUgdHlwZSB3aGVuIG5vIG1hcmtlciBpcyBwcmVzZW50IGluIGFycmF5LiBXZSBpbmRpY2F0ZSB0aGF0XG4gICAqIGl0IHNob3VsZCBub3QgYmUgcHJlc2VudCBhdCBydW50aW1lIGJ5IHRoZSBuZWdhdGl2ZSBudW1iZXIuXG4gICAqL1xuICBJbXBsaWNpdEF0dHJpYnV0ZXMgPSAtMSxcblxuICAvKipcbiAgICogTWFya2VyIGluZGljYXRlcyB0aGF0IHRoZSBmb2xsb3dpbmcgMyB2YWx1ZXMgaW4gdGhlIGF0dHJpYnV0ZXMgYXJyYXkgYXJlOlxuICAgKiBuYW1lc3BhY2VVcmksIGF0dHJpYnV0ZU5hbWUsIGF0dHJpYnV0ZVZhbHVlXG4gICAqIGluIHRoYXQgb3JkZXIuXG4gICAqL1xuICBOYW1lc3BhY2VVUkkgPSAwLFxuXG4gIC8qKlxuICAgICogU2lnbmFscyBjbGFzcyBkZWNsYXJhdGlvbi5cbiAgICAqXG4gICAgKiBFYWNoIHZhbHVlIGZvbGxvd2luZyBgQ2xhc3Nlc2AgZGVzaWduYXRlcyBhIGNsYXNzIG5hbWUgdG8gaW5jbHVkZSBvbiB0aGUgZWxlbWVudC5cbiAgICAqICMjIEV4YW1wbGU6XG4gICAgKlxuICAgICogR2l2ZW46XG4gICAgKiBgYGBcbiAgICAqIDxkaXYgY2xhc3M9XCJmb28gYmFyIGJhelwiPi4uLjxkL3ZpPlxuICAgICogYGBgXG4gICAgKlxuICAgICogdGhlIGdlbmVyYXRlZCBjb2RlIGlzOlxuICAgICogYGBgXG4gICAgKiB2YXIgX2MxID0gW0F0dHJpYnV0ZU1hcmtlci5DbGFzc2VzLCAnZm9vJywgJ2JhcicsICdiYXonXTtcbiAgICAqIGBgYFxuICAgICovXG4gIENsYXNzZXMgPSAxLFxuXG4gIC8qKlxuICAgKiBTaWduYWxzIHN0eWxlIGRlY2xhcmF0aW9uLlxuICAgKlxuICAgKiBFYWNoIHBhaXIgb2YgdmFsdWVzIGZvbGxvd2luZyBgU3R5bGVzYCBkZXNpZ25hdGVzIGEgc3R5bGUgbmFtZSBhbmQgdmFsdWUgdG8gaW5jbHVkZSBvbiB0aGVcbiAgICogZWxlbWVudC5cbiAgICogIyMgRXhhbXBsZTpcbiAgICpcbiAgICogR2l2ZW46XG4gICAqIGBgYFxuICAgKiA8ZGl2IHN0eWxlPVwid2lkdGg6MTAwcHg7IGhlaWdodDoyMDBweDsgY29sb3I6cmVkXCI+Li4uPC9kaXY+XG4gICAqIGBgYFxuICAgKlxuICAgKiB0aGUgZ2VuZXJhdGVkIGNvZGUgaXM6XG4gICAqIGBgYFxuICAgKiB2YXIgX2MxID0gW0F0dHJpYnV0ZU1hcmtlci5TdHlsZXMsICd3aWR0aCcsICcxMDBweCcsICdoZWlnaHQnLiAnMjAwcHgnLCAnY29sb3InLCAncmVkJ107XG4gICAqIGBgYFxuICAgKi9cbiAgU3R5bGVzID0gMixcblxuICAvKipcbiAgICogU2lnbmFscyB0aGF0IHRoZSBmb2xsb3dpbmcgYXR0cmlidXRlIG5hbWVzIHdlcmUgZXh0cmFjdGVkIGZyb20gaW5wdXQgb3Igb3V0cHV0IGJpbmRpbmdzLlxuICAgKlxuICAgKiBGb3IgZXhhbXBsZSwgZ2l2ZW4gdGhlIGZvbGxvd2luZyBIVE1MOlxuICAgKlxuICAgKiBgYGBcbiAgICogPGRpdiBtb289XCJjYXJcIiBbZm9vXT1cImV4cFwiIChiYXIpPVwiZG9TdGgoKVwiPlxuICAgKiBgYGBcbiAgICpcbiAgICogdGhlIGdlbmVyYXRlZCBjb2RlIGlzOlxuICAgKlxuICAgKiBgYGBcbiAgICogdmFyIF9jMSA9IFsnbW9vJywgJ2NhcicsIEF0dHJpYnV0ZU1hcmtlci5CaW5kaW5ncywgJ2ZvbycsICdiYXInXTtcbiAgICogYGBgXG4gICAqL1xuICBCaW5kaW5ncyA9IDMsXG5cbiAgLyoqXG4gICAqIFNpZ25hbHMgdGhhdCB0aGUgZm9sbG93aW5nIGF0dHJpYnV0ZSBuYW1lcyB3ZXJlIGhvaXN0ZWQgZnJvbSBhbiBpbmxpbmUtdGVtcGxhdGUgZGVjbGFyYXRpb24uXG4gICAqXG4gICAqIEZvciBleGFtcGxlLCBnaXZlbiB0aGUgZm9sbG93aW5nIEhUTUw6XG4gICAqXG4gICAqIGBgYFxuICAgKiA8ZGl2ICpuZ0Zvcj1cImxldCB2YWx1ZSBvZiB2YWx1ZXM7IHRyYWNrQnk6dHJhY2tCeVwiIGRpckEgW2RpckJdPVwidmFsdWVcIj5cbiAgICogYGBgXG4gICAqXG4gICAqIHRoZSBnZW5lcmF0ZWQgY29kZSBmb3IgdGhlIGB0ZW1wbGF0ZSgpYCBpbnN0cnVjdGlvbiB3b3VsZCBpbmNsdWRlOlxuICAgKlxuICAgKiBgYGBcbiAgICogWydkaXJBJywgJycsIEF0dHJpYnV0ZU1hcmtlci5CaW5kaW5ncywgJ2RpckInLCBBdHRyaWJ1dGVNYXJrZXIuVGVtcGxhdGUsICduZ0ZvcicsICduZ0Zvck9mJyxcbiAgICogJ25nRm9yVHJhY2tCeScsICdsZXQtdmFsdWUnXVxuICAgKiBgYGBcbiAgICpcbiAgICogd2hpbGUgdGhlIGdlbmVyYXRlZCBjb2RlIGZvciB0aGUgYGVsZW1lbnQoKWAgaW5zdHJ1Y3Rpb24gaW5zaWRlIHRoZSB0ZW1wbGF0ZSBmdW5jdGlvbiB3b3VsZFxuICAgKiBpbmNsdWRlOlxuICAgKlxuICAgKiBgYGBcbiAgICogWydkaXJBJywgJycsIEF0dHJpYnV0ZU1hcmtlci5CaW5kaW5ncywgJ2RpckInXVxuICAgKiBgYGBcbiAgICovXG4gIFRlbXBsYXRlID0gNCxcblxuICAvKipcbiAgICogU2lnbmFscyB0aGF0IHRoZSBmb2xsb3dpbmcgYXR0cmlidXRlIGlzIGBuZ1Byb2plY3RBc2AgYW5kIGl0cyB2YWx1ZSBpcyBhIHBhcnNlZCBgQ3NzU2VsZWN0b3JgLlxuICAgKlxuICAgKiBGb3IgZXhhbXBsZSwgZ2l2ZW4gdGhlIGZvbGxvd2luZyBIVE1MOlxuICAgKlxuICAgKiBgYGBcbiAgICogPGgxIGF0dHI9XCJ2YWx1ZVwiIG5nUHJvamVjdEFzPVwiW3RpdGxlXVwiPlxuICAgKiBgYGBcbiAgICpcbiAgICogdGhlIGdlbmVyYXRlZCBjb2RlIGZvciB0aGUgYGVsZW1lbnQoKWAgaW5zdHJ1Y3Rpb24gd291bGQgaW5jbHVkZTpcbiAgICpcbiAgICogYGBgXG4gICAqIFsnYXR0cicsICd2YWx1ZScsIEF0dHJpYnV0ZU1hcmtlci5Qcm9qZWN0QXMsIFsnJywgJ3RpdGxlJywgJyddXVxuICAgKiBgYGBcbiAgICovXG4gIFByb2plY3RBcyA9IDUsXG5cbiAgLyoqXG4gICAqIFNpZ25hbHMgdGhhdCB0aGUgZm9sbG93aW5nIGF0dHJpYnV0ZSB3aWxsIGJlIHRyYW5zbGF0ZWQgYnkgcnVudGltZSBpMThuXG4gICAqXG4gICAqIEZvciBleGFtcGxlLCBnaXZlbiB0aGUgZm9sbG93aW5nIEhUTUw6XG4gICAqXG4gICAqIGBgYFxuICAgKiA8ZGl2IG1vbz1cImNhclwiIGZvbz1cInZhbHVlXCIgaTE4bi1mb28gW2Jhcl09XCJiaW5kaW5nXCIgaTE4bi1iYXI+XG4gICAqIGBgYFxuICAgKlxuICAgKiB0aGUgZ2VuZXJhdGVkIGNvZGUgaXM6XG4gICAqXG4gICAqIGBgYFxuICAgKiB2YXIgX2MxID0gWydtb28nLCAnY2FyJywgQXR0cmlidXRlTWFya2VyLkkxOG4sICdmb28nLCAnYmFyJ107XG4gICAqL1xuICBJMThuID0gNixcbn1cblxuLyoqXG4gKiBBIGNvbWJpbmF0aW9uIG9mOlxuICogLSBBdHRyaWJ1dGUgbmFtZXMgYW5kIHZhbHVlcy5cbiAqIC0gU3BlY2lhbCBtYXJrZXJzIGFjdGluZyBhcyBmbGFncyB0byBhbHRlciBhdHRyaWJ1dGVzIHByb2Nlc3NpbmcuXG4gKiAtIFBhcnNlZCBuZ1Byb2plY3RBcyBzZWxlY3RvcnMuXG4gKi9cbmV4cG9ydCB0eXBlIFRBdHRyaWJ1dGVzID0gKHN0cmluZyB8IEF0dHJpYnV0ZU1hcmtlciB8IENzc1NlbGVjdG9yKVtdO1xuXG4vKipcbiAqIENvbnN0YW50cyB0aGF0IGFyZSBhc3NvY2lhdGVkIHdpdGggYSB2aWV3LiBJbmNsdWRlczpcbiAqIC0gQXR0cmlidXRlIGFycmF5cy5cbiAqIC0gTG9jYWwgZGVmaW5pdGlvbiBhcnJheXMuXG4gKi9cbmV4cG9ydCB0eXBlIFRDb25zdGFudHMgPSAoVEF0dHJpYnV0ZXMgfCBzdHJpbmcpW107XG5cbi8qKlxuICogQmluZGluZyBkYXRhIChmbHl3ZWlnaHQpIGZvciBhIHBhcnRpY3VsYXIgbm9kZSB0aGF0IGlzIHNoYXJlZCBiZXR3ZWVuIGFsbCB0ZW1wbGF0ZXNcbiAqIG9mIGEgc3BlY2lmaWMgdHlwZS5cbiAqXG4gKiBJZiBhIHByb3BlcnR5IGlzOlxuICogICAgLSBQcm9wZXJ0eUFsaWFzZXM6IHRoYXQgcHJvcGVydHkncyBkYXRhIHdhcyBnZW5lcmF0ZWQgYW5kIHRoaXMgaXMgaXRcbiAqICAgIC0gTnVsbDogdGhhdCBwcm9wZXJ0eSdzIGRhdGEgd2FzIGFscmVhZHkgZ2VuZXJhdGVkIGFuZCBub3RoaW5nIHdhcyBmb3VuZC5cbiAqICAgIC0gVW5kZWZpbmVkOiB0aGF0IHByb3BlcnR5J3MgZGF0YSBoYXMgbm90IHlldCBiZWVuIGdlbmVyYXRlZFxuICpcbiAqIHNlZTogaHR0cHM6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvRmx5d2VpZ2h0X3BhdHRlcm4gZm9yIG1vcmUgb24gdGhlIEZseXdlaWdodCBwYXR0ZXJuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgVE5vZGUge1xuICAvKiogVGhlIHR5cGUgb2YgdGhlIFROb2RlLiBTZWUgVE5vZGVUeXBlLiAqL1xuICB0eXBlOiBUTm9kZVR5cGU7XG5cbiAgLyoqXG4gICAqIEluZGV4IG9mIHRoZSBUTm9kZSBpbiBUVmlldy5kYXRhIGFuZCBjb3JyZXNwb25kaW5nIG5hdGl2ZSBlbGVtZW50IGluIExWaWV3LlxuICAgKlxuICAgKiBUaGlzIGlzIG5lY2Vzc2FyeSB0byBnZXQgZnJvbSBhbnkgVE5vZGUgdG8gaXRzIGNvcnJlc3BvbmRpbmcgbmF0aXZlIGVsZW1lbnQgd2hlblxuICAgKiB0cmF2ZXJzaW5nIHRoZSBub2RlIHRyZWUuXG4gICAqXG4gICAqIElmIGluZGV4IGlzIC0xLCB0aGlzIGlzIGEgZHluYW1pY2FsbHkgY3JlYXRlZCBjb250YWluZXIgbm9kZSBvciBlbWJlZGRlZCB2aWV3IG5vZGUuXG4gICAqL1xuICBpbmRleDogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBUaGUgaW5kZXggb2YgdGhlIGNsb3Nlc3QgaW5qZWN0b3IgaW4gdGhpcyBub2RlJ3MgTFZpZXcuXG4gICAqXG4gICAqIElmIHRoZSBpbmRleCA9PT0gLTEsIHRoZXJlIGlzIG5vIGluamVjdG9yIG9uIHRoaXMgbm9kZSBvciBhbnkgYW5jZXN0b3Igbm9kZSBpbiB0aGlzIHZpZXcuXG4gICAqXG4gICAqIElmIHRoZSBpbmRleCAhPT0gLTEsIGl0IGlzIHRoZSBpbmRleCBvZiB0aGlzIG5vZGUncyBpbmplY3RvciBPUiB0aGUgaW5kZXggb2YgYSBwYXJlbnQgaW5qZWN0b3JcbiAgICogaW4gdGhlIHNhbWUgdmlldy4gV2UgcGFzcyB0aGUgcGFyZW50IGluamVjdG9yIGluZGV4IGRvd24gdGhlIG5vZGUgdHJlZSBvZiBhIHZpZXcgc28gaXQnc1xuICAgKiBwb3NzaWJsZSB0byBmaW5kIHRoZSBwYXJlbnQgaW5qZWN0b3Igd2l0aG91dCB3YWxraW5nIGEgcG90ZW50aWFsbHkgZGVlcCBub2RlIHRyZWUuIEluamVjdG9yXG4gICAqIGluZGljZXMgYXJlIG5vdCBzZXQgYWNyb3NzIHZpZXcgYm91bmRhcmllcyBiZWNhdXNlIHRoZXJlIGNvdWxkIGJlIG11bHRpcGxlIGNvbXBvbmVudCBob3N0cy5cbiAgICpcbiAgICogSWYgdE5vZGUuaW5qZWN0b3JJbmRleCA9PT0gdE5vZGUucGFyZW50LmluamVjdG9ySW5kZXgsIHRoZW4gdGhlIGluZGV4IGJlbG9uZ3MgdG8gYSBwYXJlbnRcbiAgICogaW5qZWN0b3IuXG4gICAqL1xuICBpbmplY3RvckluZGV4OiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIFN0b3JlcyBzdGFydGluZyBpbmRleCBvZiB0aGUgZGlyZWN0aXZlcy5cbiAgICovXG4gIGRpcmVjdGl2ZVN0YXJ0OiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIFN0b3JlcyBmaW5hbCBleGNsdXNpdmUgaW5kZXggb2YgdGhlIGRpcmVjdGl2ZXMuXG4gICAqL1xuICBkaXJlY3RpdmVFbmQ6IG51bWJlcjtcblxuICAvKipcbiAgICogU3RvcmVzIGluZGV4ZXMgb2YgcHJvcGVydHkgYmluZGluZ3MuIFRoaXMgZmllbGQgaXMgb25seSBzZXQgaW4gdGhlIG5nRGV2TW9kZSBhbmQgaG9sZHMgaW5kZXhlc1xuICAgKiBvZiBwcm9wZXJ0eSBiaW5kaW5ncyBzbyBUZXN0QmVkIGNhbiBnZXQgYm91bmQgcHJvcGVydHkgbWV0YWRhdGEgZm9yIGEgZ2l2ZW4gbm9kZS5cbiAgICovXG4gIHByb3BlcnR5QmluZGluZ3M6IG51bWJlcltdfG51bGw7XG5cbiAgLyoqXG4gICAqIFN0b3JlcyBpZiBOb2RlIGlzQ29tcG9uZW50LCBpc1Byb2plY3RlZCwgaGFzQ29udGVudFF1ZXJ5LCBoYXNDbGFzc0lucHV0IGFuZCBoYXNTdHlsZUlucHV0IGV0Yy5cbiAgICovXG4gIGZsYWdzOiBUTm9kZUZsYWdzO1xuXG4gIC8qKlxuICAgKiBUaGlzIG51bWJlciBzdG9yZXMgdHdvIHZhbHVlcyB1c2luZyBpdHMgYml0czpcbiAgICpcbiAgICogLSB0aGUgaW5kZXggb2YgdGhlIGZpcnN0IHByb3ZpZGVyIG9uIHRoYXQgbm9kZSAoZmlyc3QgMTYgYml0cylcbiAgICogLSB0aGUgY291bnQgb2YgdmlldyBwcm92aWRlcnMgZnJvbSB0aGUgY29tcG9uZW50IG9uIHRoaXMgbm9kZSAobGFzdCAxNiBiaXRzKVxuICAgKi9cbiAgLy8gVE9ETyhtaXNrbyk6IGJyZWFrIHRoaXMgaW50byBhY3R1YWwgdmFycy5cbiAgcHJvdmlkZXJJbmRleGVzOiBUTm9kZVByb3ZpZGVySW5kZXhlcztcblxuICAvKiogVGhlIHRhZyBuYW1lIGFzc29jaWF0ZWQgd2l0aCB0aGlzIG5vZGUuICovXG4gIHRhZ05hbWU6IHN0cmluZ3xudWxsO1xuXG4gIC8qKlxuICAgKiBBdHRyaWJ1dGVzIGFzc29jaWF0ZWQgd2l0aCBhbiBlbGVtZW50LiBXZSBuZWVkIHRvIHN0b3JlIGF0dHJpYnV0ZXMgdG8gc3VwcG9ydCB2YXJpb3VzIHVzZS1jYXNlc1xuICAgKiAoYXR0cmlidXRlIGluamVjdGlvbiwgY29udGVudCBwcm9qZWN0aW9uIHdpdGggc2VsZWN0b3JzLCBkaXJlY3RpdmVzIG1hdGNoaW5nKS5cbiAgICogQXR0cmlidXRlcyBhcmUgc3RvcmVkIHN0YXRpY2FsbHkgYmVjYXVzZSByZWFkaW5nIHRoZW0gZnJvbSB0aGUgRE9NIHdvdWxkIGJlIHdheSB0b28gc2xvdyBmb3JcbiAgICogY29udGVudCBwcm9qZWN0aW9uIGFuZCBxdWVyaWVzLlxuICAgKlxuICAgKiBTaW5jZSBhdHRycyB3aWxsIGFsd2F5cyBiZSBjYWxjdWxhdGVkIGZpcnN0LCB0aGV5IHdpbGwgbmV2ZXIgbmVlZCB0byBiZSBtYXJrZWQgdW5kZWZpbmVkIGJ5XG4gICAqIG90aGVyIGluc3RydWN0aW9ucy5cbiAgICpcbiAgICogRm9yIHJlZ3VsYXIgYXR0cmlidXRlcyBhIG5hbWUgb2YgYW4gYXR0cmlidXRlIGFuZCBpdHMgdmFsdWUgYWx0ZXJuYXRlIGluIHRoZSBhcnJheS5cbiAgICogZS5nLiBbJ3JvbGUnLCAnY2hlY2tib3gnXVxuICAgKiBUaGlzIGFycmF5IGNhbiBjb250YWluIGZsYWdzIHRoYXQgd2lsbCBpbmRpY2F0ZSBcInNwZWNpYWwgYXR0cmlidXRlc1wiIChhdHRyaWJ1dGVzIHdpdGhcbiAgICogbmFtZXNwYWNlcywgYXR0cmlidXRlcyBleHRyYWN0ZWQgZnJvbSBiaW5kaW5ncyBhbmQgb3V0cHV0cykuXG4gICAqL1xuICBhdHRyczogVEF0dHJpYnV0ZXN8bnVsbDtcblxuICAvKipcbiAgICogU2FtZSBhcyBgVE5vZGUuYXR0cnNgIGJ1dCBjb250YWlucyBtZXJnZWQgZGF0YSBhY3Jvc3MgYWxsIGRpcmVjdGl2ZSBob3N0IGJpbmRpbmdzLlxuICAgKlxuICAgKiBXZSBuZWVkIHRvIGtlZXAgYGF0dHJzYCBhcyB1bm1lcmdlZCBzbyB0aGF0IGl0IGNhbiBiZSB1c2VkIGZvciBhdHRyaWJ1dGUgc2VsZWN0b3JzLlxuICAgKiBXZSBtZXJnZSBhdHRycyBoZXJlIHNvIHRoYXQgaXQgY2FuIGJlIHVzZWQgaW4gYSBwZXJmb3JtYW50IHdheSBmb3IgaW5pdGlhbCByZW5kZXJpbmcuXG4gICAqXG4gICAqIFRoZSBgYXR0cnNgIGFyZSBtZXJnZWQgaW4gZmlyc3QgcGFzcyBpbiBmb2xsb3dpbmcgb3JkZXI6XG4gICAqIC0gQ29tcG9uZW50J3MgYGhvc3RBdHRyc2BcbiAgICogLSBEaXJlY3RpdmVzJyBgaG9zdEF0dHJzYFxuICAgKiAtIFRlbXBsYXRlIGBUTm9kZS5hdHRyc2AgYXNzb2NpYXRlZCB3aXRoIHRoZSBjdXJyZW50IGBUTm9kZWAuXG4gICAqL1xuICBtZXJnZWRBdHRyczogVEF0dHJpYnV0ZXN8bnVsbDtcblxuICAvKipcbiAgICogQSBzZXQgb2YgbG9jYWwgbmFtZXMgdW5kZXIgd2hpY2ggYSBnaXZlbiBlbGVtZW50IGlzIGV4cG9ydGVkIGluIGEgdGVtcGxhdGUgYW5kXG4gICAqIHZpc2libGUgdG8gcXVlcmllcy4gQW4gZW50cnkgaW4gdGhpcyBhcnJheSBjYW4gYmUgY3JlYXRlZCBmb3IgZGlmZmVyZW50IHJlYXNvbnM6XG4gICAqIC0gYW4gZWxlbWVudCBpdHNlbGYgaXMgcmVmZXJlbmNlZCwgZXguOiBgPGRpdiAjZm9vPmBcbiAgICogLSBhIGNvbXBvbmVudCBpcyByZWZlcmVuY2VkLCBleC46IGA8bXktY21wdCAjZm9vPmBcbiAgICogLSBhIGRpcmVjdGl2ZSBpcyByZWZlcmVuY2VkLCBleC46IGA8bXktY21wdCAjZm9vPVwiZGlyZWN0aXZlRXhwb3J0QXNcIj5gLlxuICAgKlxuICAgKiBBIGdpdmVuIGVsZW1lbnQgbWlnaHQgaGF2ZSBkaWZmZXJlbnQgbG9jYWwgbmFtZXMgYW5kIHRob3NlIG5hbWVzIGNhbiBiZSBhc3NvY2lhdGVkXG4gICAqIHdpdGggYSBkaXJlY3RpdmUuIFdlIHN0b3JlIGxvY2FsIG5hbWVzIGF0IGV2ZW4gaW5kZXhlcyB3aGlsZSBvZGQgaW5kZXhlcyBhcmUgcmVzZXJ2ZWRcbiAgICogZm9yIGRpcmVjdGl2ZSBpbmRleCBpbiBhIHZpZXcgKG9yIGAtMWAgaWYgdGhlcmUgaXMgbm8gYXNzb2NpYXRlZCBkaXJlY3RpdmUpLlxuICAgKlxuICAgKiBTb21lIGV4YW1wbGVzOlxuICAgKiAtIGA8ZGl2ICNmb28+YCA9PiBgW1wiZm9vXCIsIC0xXWBcbiAgICogLSBgPG15LWNtcHQgI2Zvbz5gID0+IGBbXCJmb29cIiwgbXlDbXB0SWR4XWBcbiAgICogLSBgPG15LWNtcHQgI2ZvbyAjYmFyPVwiZGlyZWN0aXZlRXhwb3J0QXNcIj5gID0+IGBbXCJmb29cIiwgbXlDbXB0SWR4LCBcImJhclwiLCBkaXJlY3RpdmVJZHhdYFxuICAgKiAtIGA8ZGl2ICNmb28gI2Jhcj1cImRpcmVjdGl2ZUV4cG9ydEFzXCI+YCA9PiBgW1wiZm9vXCIsIC0xLCBcImJhclwiLCBkaXJlY3RpdmVJZHhdYFxuICAgKi9cbiAgbG9jYWxOYW1lczogKHN0cmluZ3xudW1iZXIpW118bnVsbDtcblxuICAvKiogSW5mb3JtYXRpb24gYWJvdXQgaW5wdXQgcHJvcGVydGllcyB0aGF0IG5lZWQgdG8gYmUgc2V0IG9uY2UgZnJvbSBhdHRyaWJ1dGUgZGF0YS4gKi9cbiAgaW5pdGlhbElucHV0czogSW5pdGlhbElucHV0RGF0YXxudWxsfHVuZGVmaW5lZDtcblxuICAvKipcbiAgICogSW5wdXQgZGF0YSBmb3IgYWxsIGRpcmVjdGl2ZXMgb24gdGhpcyBub2RlLiBgbnVsbGAgbWVhbnMgdGhhdCB0aGVyZSBhcmUgbm8gZGlyZWN0aXZlcyB3aXRoXG4gICAqIGlucHV0cyBvbiB0aGlzIG5vZGUuXG4gICAqL1xuICBpbnB1dHM6IFByb3BlcnR5QWxpYXNlc3xudWxsO1xuXG4gIC8qKlxuICAgKiBPdXRwdXQgZGF0YSBmb3IgYWxsIGRpcmVjdGl2ZXMgb24gdGhpcyBub2RlLiBgbnVsbGAgbWVhbnMgdGhhdCB0aGVyZSBhcmUgbm8gZGlyZWN0aXZlcyB3aXRoXG4gICAqIG91dHB1dHMgb24gdGhpcyBub2RlLlxuICAgKi9cbiAgb3V0cHV0czogUHJvcGVydHlBbGlhc2VzfG51bGw7XG5cbiAgLyoqXG4gICAqIFRoZSBUVmlldyBvciBUVmlld3MgYXR0YWNoZWQgdG8gdGhpcyBub2RlLlxuICAgKlxuICAgKiBJZiB0aGlzIFROb2RlIGNvcnJlc3BvbmRzIHRvIGFuIExDb250YWluZXIgd2l0aCBpbmxpbmUgdmlld3MsIHRoZSBjb250YWluZXIgd2lsbFxuICAgKiBuZWVkIHRvIHN0b3JlIHNlcGFyYXRlIHN0YXRpYyBkYXRhIGZvciBlYWNoIG9mIGl0cyB2aWV3IGJsb2NrcyAoVFZpZXdbXSkuIE90aGVyd2lzZSxcbiAgICogbm9kZXMgaW4gaW5saW5lIHZpZXdzIHdpdGggdGhlIHNhbWUgaW5kZXggYXMgbm9kZXMgaW4gdGhlaXIgcGFyZW50IHZpZXdzIHdpbGwgb3ZlcndyaXRlXG4gICAqIGVhY2ggb3RoZXIsIGFzIHRoZXkgYXJlIGluIHRoZSBzYW1lIHRlbXBsYXRlLlxuICAgKlxuICAgKiBFYWNoIGluZGV4IGluIHRoaXMgYXJyYXkgY29ycmVzcG9uZHMgdG8gdGhlIHN0YXRpYyBkYXRhIGZvciBhIGNlcnRhaW5cbiAgICogdmlldy4gU28gaWYgeW91IGhhZCBWKDApIGFuZCBWKDEpIGluIGEgY29udGFpbmVyLCB5b3UgbWlnaHQgaGF2ZTpcbiAgICpcbiAgICogW1xuICAgKiAgIFt7dGFnTmFtZTogJ2RpdicsIGF0dHJzOiAuLi59LCBudWxsXSwgICAgIC8vIFYoMCkgVFZpZXdcbiAgICogICBbe3RhZ05hbWU6ICdidXR0b24nLCBhdHRycyAuLi59LCBudWxsXSAgICAvLyBWKDEpIFRWaWV3XG4gICAqXG4gICAqIElmIHRoaXMgVE5vZGUgY29ycmVzcG9uZHMgdG8gYW4gTENvbnRhaW5lciB3aXRoIGEgdGVtcGxhdGUgKGUuZy4gc3RydWN0dXJhbFxuICAgKiBkaXJlY3RpdmUpLCB0aGUgdGVtcGxhdGUncyBUVmlldyB3aWxsIGJlIHN0b3JlZCBoZXJlLlxuICAgKlxuICAgKiBJZiB0aGlzIFROb2RlIGNvcnJlc3BvbmRzIHRvIGFuIGVsZW1lbnQsIHRWaWV3cyB3aWxsIGJlIG51bGwgLlxuICAgKi9cbiAgdFZpZXdzOiBUVmlld3xUVmlld1tdfG51bGw7XG5cbiAgLyoqXG4gICAqIFRoZSBuZXh0IHNpYmxpbmcgbm9kZS4gTmVjZXNzYXJ5IHNvIHdlIGNhbiBwcm9wYWdhdGUgdGhyb3VnaCB0aGUgcm9vdCBub2RlcyBvZiBhIHZpZXdcbiAgICogdG8gaW5zZXJ0IHRoZW0gb3IgcmVtb3ZlIHRoZW0gZnJvbSB0aGUgRE9NLlxuICAgKi9cbiAgbmV4dDogVE5vZGV8bnVsbDtcblxuICAvKipcbiAgICogVGhlIG5leHQgcHJvamVjdGVkIHNpYmxpbmcuIFNpbmNlIGluIEFuZ3VsYXIgY29udGVudCBwcm9qZWN0aW9uIHdvcmtzIG9uIHRoZSBub2RlLWJ5LW5vZGUgYmFzaXNcbiAgICogdGhlIGFjdCBvZiBwcm9qZWN0aW5nIG5vZGVzIG1pZ2h0IGNoYW5nZSBub2RlcyByZWxhdGlvbnNoaXAgYXQgdGhlIGluc2VydGlvbiBwb2ludCAodGFyZ2V0XG4gICAqIHZpZXcpLiBBdCB0aGUgc2FtZSB0aW1lIHdlIG5lZWQgdG8ga2VlcCBpbml0aWFsIHJlbGF0aW9uc2hpcCBiZXR3ZWVuIG5vZGVzIGFzIGV4cHJlc3NlZCBpblxuICAgKiBjb250ZW50IHZpZXcuXG4gICAqL1xuICBwcm9qZWN0aW9uTmV4dDogVE5vZGV8bnVsbDtcblxuICAvKipcbiAgICogRmlyc3QgY2hpbGQgb2YgdGhlIGN1cnJlbnQgbm9kZS5cbiAgICpcbiAgICogRm9yIGNvbXBvbmVudCBub2RlcywgdGhlIGNoaWxkIHdpbGwgYWx3YXlzIGJlIGEgQ29udGVudENoaWxkIChpbiBzYW1lIHZpZXcpLlxuICAgKiBGb3IgZW1iZWRkZWQgdmlldyBub2RlcywgdGhlIGNoaWxkIHdpbGwgYmUgaW4gdGhlaXIgY2hpbGQgdmlldy5cbiAgICovXG4gIGNoaWxkOiBUTm9kZXxudWxsO1xuXG4gIC8qKlxuICAgKiBQYXJlbnQgbm9kZSAoaW4gdGhlIHNhbWUgdmlldyBvbmx5KS5cbiAgICpcbiAgICogV2UgbmVlZCBhIHJlZmVyZW5jZSB0byBhIG5vZGUncyBwYXJlbnQgc28gd2UgY2FuIGFwcGVuZCB0aGUgbm9kZSB0byBpdHMgcGFyZW50J3MgbmF0aXZlXG4gICAqIGVsZW1lbnQgYXQgdGhlIGFwcHJvcHJpYXRlIHRpbWUuXG4gICAqXG4gICAqIElmIHRoZSBwYXJlbnQgd291bGQgYmUgaW4gYSBkaWZmZXJlbnQgdmlldyAoZS5nLiBjb21wb25lbnQgaG9zdCksIHRoaXMgcHJvcGVydHkgd2lsbCBiZSBudWxsLlxuICAgKiBJdCdzIGltcG9ydGFudCB0aGF0IHdlIGRvbid0IHRyeSB0byBjcm9zcyBjb21wb25lbnQgYm91bmRhcmllcyB3aGVuIHJldHJpZXZpbmcgdGhlIHBhcmVudFxuICAgKiBiZWNhdXNlIHRoZSBwYXJlbnQgd2lsbCBjaGFuZ2UgKGUuZy4gaW5kZXgsIGF0dHJzKSBkZXBlbmRpbmcgb24gd2hlcmUgdGhlIGNvbXBvbmVudCB3YXNcbiAgICogdXNlZCAoYW5kIHRodXMgc2hvdWxkbid0IGJlIHN0b3JlZCBvbiBUTm9kZSkuIEluIHRoZXNlIGNhc2VzLCB3ZSByZXRyaWV2ZSB0aGUgcGFyZW50IHRocm91Z2hcbiAgICogTFZpZXcubm9kZSBpbnN0ZWFkICh3aGljaCB3aWxsIGJlIGluc3RhbmNlLXNwZWNpZmljKS5cbiAgICpcbiAgICogSWYgdGhpcyBpcyBhbiBpbmxpbmUgdmlldyBub2RlIChWKSwgdGhlIHBhcmVudCB3aWxsIGJlIGl0cyBjb250YWluZXIuXG4gICAqL1xuICBwYXJlbnQ6IFRFbGVtZW50Tm9kZXxUQ29udGFpbmVyTm9kZXxudWxsO1xuXG4gIC8qKlxuICAgKiBMaXN0IG9mIHByb2plY3RlZCBUTm9kZXMgZm9yIGEgZ2l2ZW4gY29tcG9uZW50IGhvc3QgZWxlbWVudCBPUiBpbmRleCBpbnRvIHRoZSBzYWlkIG5vZGVzLlxuICAgKlxuICAgKiBGb3IgZWFzaWVyIGRpc2N1c3Npb24gYXNzdW1lIHRoaXMgZXhhbXBsZTpcbiAgICogYDxwYXJlbnQ+YCdzIHZpZXcgZGVmaW5pdGlvbjpcbiAgICogYGBgXG4gICAqIDxjaGlsZCBpZD1cImMxXCI+Y29udGVudDE8L2NoaWxkPlxuICAgKiA8Y2hpbGQgaWQ9XCJjMlwiPjxzcGFuPmNvbnRlbnQyPC9zcGFuPjwvY2hpbGQ+XG4gICAqIGBgYFxuICAgKiBgPGNoaWxkPmAncyB2aWV3IGRlZmluaXRpb246XG4gICAqIGBgYFxuICAgKiA8bmctY29udGVudCBpZD1cImNvbnQxXCI+PC9uZy1jb250ZW50PlxuICAgKiBgYGBcbiAgICpcbiAgICogSWYgYEFycmF5LmlzQXJyYXkocHJvamVjdGlvbilgIHRoZW4gYFROb2RlYCBpcyBhIGhvc3QgZWxlbWVudDpcbiAgICogLSBgcHJvamVjdGlvbmAgc3RvcmVzIHRoZSBjb250ZW50IG5vZGVzIHdoaWNoIGFyZSB0byBiZSBwcm9qZWN0ZWQuXG4gICAqICAgIC0gVGhlIG5vZGVzIHJlcHJlc2VudCBjYXRlZ29yaWVzIGRlZmluZWQgYnkgdGhlIHNlbGVjdG9yOiBGb3IgZXhhbXBsZTpcbiAgICogICAgICBgPG5nLWNvbnRlbnQvPjxuZy1jb250ZW50IHNlbGVjdD1cImFiY1wiLz5gIHdvdWxkIHJlcHJlc2VudCB0aGUgaGVhZHMgZm9yIGA8bmctY29udGVudC8+YFxuICAgKiAgICAgIGFuZCBgPG5nLWNvbnRlbnQgc2VsZWN0PVwiYWJjXCIvPmAgcmVzcGVjdGl2ZWx5LlxuICAgKiAgICAtIFRoZSBub2RlcyB3ZSBzdG9yZSBpbiBgcHJvamVjdGlvbmAgYXJlIGhlYWRzIG9ubHksIHdlIHVzZWQgYC5uZXh0YCB0byBnZXQgdGhlaXJcbiAgICogICAgICBzaWJsaW5ncy5cbiAgICogICAgLSBUaGUgbm9kZXMgYC5uZXh0YCBpcyBzb3J0ZWQvcmV3cml0dGVuIGFzIHBhcnQgb2YgdGhlIHByb2plY3Rpb24gc2V0dXAuXG4gICAqICAgIC0gYHByb2plY3Rpb25gIHNpemUgaXMgZXF1YWwgdG8gdGhlIG51bWJlciBvZiBwcm9qZWN0aW9ucyBgPG5nLWNvbnRlbnQ+YC4gVGhlIHNpemUgb2ZcbiAgICogICAgICBgYzFgIHdpbGwgYmUgYDFgIGJlY2F1c2UgYDxjaGlsZD5gIGhhcyBvbmx5IG9uZSBgPG5nLWNvbnRlbnQ+YC5cbiAgICogLSB3ZSBzdG9yZSBgcHJvamVjdGlvbmAgd2l0aCB0aGUgaG9zdCAoYGMxYCwgYGMyYCkgcmF0aGVyIHRoYW4gdGhlIGA8bmctY29udGVudD5gIChgY29udDFgKVxuICAgKiAgIGJlY2F1c2UgdGhlIHNhbWUgY29tcG9uZW50IChgPGNoaWxkPmApIGNhbiBiZSB1c2VkIGluIG11bHRpcGxlIGxvY2F0aW9ucyAoYGMxYCwgYGMyYCkgYW5kIGFzXG4gICAqICAgYSByZXN1bHQgaGF2ZSBkaWZmZXJlbnQgc2V0IG9mIG5vZGVzIHRvIHByb2plY3QuXG4gICAqIC0gd2l0aG91dCBgcHJvamVjdGlvbmAgaXQgd291bGQgYmUgZGlmZmljdWx0IHRvIGVmZmljaWVudGx5IHRyYXZlcnNlIG5vZGVzIHRvIGJlIHByb2plY3RlZC5cbiAgICpcbiAgICogSWYgYHR5cGVvZiBwcm9qZWN0aW9uID09ICdudW1iZXInYCB0aGVuIGBUTm9kZWAgaXMgYSBgPG5nLWNvbnRlbnQ+YCBlbGVtZW50OlxuICAgKiAtIGBwcm9qZWN0aW9uYCBpcyBhbiBpbmRleCBvZiB0aGUgaG9zdCdzIGBwcm9qZWN0aW9uYE5vZGVzLlxuICAgKiAgIC0gVGhpcyB3b3VsZCByZXR1cm4gdGhlIGZpcnN0IGhlYWQgbm9kZSB0byBwcm9qZWN0OlxuICAgKiAgICAgYGdldEhvc3QoY3VycmVudFROb2RlKS5wcm9qZWN0aW9uW2N1cnJlbnRUTm9kZS5wcm9qZWN0aW9uXWAuXG4gICAqIC0gV2hlbiBwcm9qZWN0aW5nIG5vZGVzIHRoZSBwYXJlbnQgbm9kZSByZXRyaWV2ZWQgbWF5IGJlIGEgYDxuZy1jb250ZW50PmAgbm9kZSwgaW4gd2hpY2ggY2FzZVxuICAgKiAgIHRoZSBwcm9jZXNzIGlzIHJlY3Vyc2l2ZSBpbiBuYXR1cmUuXG4gICAqXG4gICAqIElmIGBwcm9qZWN0aW9uYCBpcyBvZiB0eXBlIGBSTm9kZVtdW11gIHRoYW4gd2UgaGF2ZSBhIGNvbGxlY3Rpb24gb2YgbmF0aXZlIG5vZGVzIHBhc3NlZCBhc1xuICAgKiBwcm9qZWN0YWJsZSBub2RlcyBkdXJpbmcgZHluYW1pYyBjb21wb25lbnQgY3JlYXRpb24uXG4gICAqL1xuICBwcm9qZWN0aW9uOiAoVE5vZGV8Uk5vZGVbXSlbXXxudW1iZXJ8bnVsbDtcblxuICAvKipcbiAgICogQSBjb2xsZWN0aW9uIG9mIGFsbCBzdHlsZSBiaW5kaW5ncyBhbmQvb3Igc3RhdGljIHN0eWxlIHZhbHVlcyBmb3IgYW4gZWxlbWVudC5cbiAgICpcbiAgICogVGhpcyBmaWVsZCB3aWxsIGJlIHBvcHVsYXRlZCBpZiBhbmQgd2hlbjpcbiAgICpcbiAgICogLSBUaGVyZSBhcmUgb25lIG9yIG1vcmUgaW5pdGlhbCBzdHlsZXMgb24gYW4gZWxlbWVudCAoZS5nLiBgPGRpdiBzdHlsZT1cIndpZHRoOjIwMHB4XCI+YClcbiAgICogLSBUaGVyZSBhcmUgb25lIG9yIG1vcmUgc3R5bGUgYmluZGluZ3Mgb24gYW4gZWxlbWVudCAoZS5nLiBgPGRpdiBbc3R5bGUud2lkdGhdPVwid1wiPmApXG4gICAqXG4gICAqIElmIGFuZCB3aGVuIHRoZXJlIGFyZSBvbmx5IGluaXRpYWwgc3R5bGVzIChubyBiaW5kaW5ncykgdGhlbiBhbiBpbnN0YW5jZSBvZiBgU3R5bGluZ01hcEFycmF5YFxuICAgKiB3aWxsIGJlIHVzZWQgaGVyZS4gT3RoZXJ3aXNlIGFuIGluc3RhbmNlIG9mIGBUU3R5bGluZ0NvbnRleHRgIHdpbGwgYmUgY3JlYXRlZCB3aGVuIHRoZXJlXG4gICAqIGFyZSBvbmUgb3IgbW9yZSBzdHlsZSBiaW5kaW5ncyBvbiBhbiBlbGVtZW50LlxuICAgKlxuICAgKiBEdXJpbmcgZWxlbWVudCBjcmVhdGlvbiB0aGlzIHZhbHVlIGlzIGxpa2VseSB0byBiZSBwb3B1bGF0ZWQgd2l0aCBhbiBpbnN0YW5jZSBvZlxuICAgKiBgU3R5bGluZ01hcEFycmF5YCBhbmQgb25seSB3aGVuIHRoZSBiaW5kaW5ncyBhcmUgZXZhbHVhdGVkICh3aGljaCBoYXBwZW5zIGR1cmluZ1xuICAgKiB1cGRhdGUgbW9kZSkgdGhlbiBpdCB3aWxsIGJlIGNvbnZlcnRlZCB0byBhIGBUU3R5bGluZ0NvbnRleHRgIGlmIGFueSBzdHlsZSBiaW5kaW5nc1xuICAgKiBhcmUgZW5jb3VudGVyZWQuIElmIGFuZCB3aGVuIHRoaXMgaGFwcGVucyB0aGVuIHRoZSBleGlzdGluZyBgU3R5bGluZ01hcEFycmF5YCB2YWx1ZVxuICAgKiB3aWxsIGJlIHBsYWNlZCBpbnRvIHRoZSBpbml0aWFsIHN0eWxpbmcgc2xvdCBpbiB0aGUgbmV3bHkgY3JlYXRlZCBgVFN0eWxpbmdDb250ZXh0YC5cbiAgICovXG4gIC8vIFRPRE8obWlza28pOiBgUmVtb3ZlIFN0eWxpbmdNYXBBcnJheXxUU3R5bGluZ0NvbnRleHR8bnVsbGAgaW4gZm9sbG93IHVwIFBSLlxuICBzdHlsZXM6IFN0eWxpbmdNYXBBcnJheXxUU3R5bGluZ0NvbnRleHR8c3RyaW5nfG51bGw7XG5cbiAgLyoqXG4gICAqIEEgY29sbGVjdGlvbiBvZiBhbGwgY2xhc3MgYmluZGluZ3MgYW5kL29yIHN0YXRpYyBjbGFzcyB2YWx1ZXMgZm9yIGFuIGVsZW1lbnQuXG4gICAqXG4gICAqIFRoaXMgZmllbGQgd2lsbCBiZSBwb3B1bGF0ZWQgaWYgYW5kIHdoZW46XG4gICAqXG4gICAqIC0gVGhlcmUgYXJlIG9uZSBvciBtb3JlIGluaXRpYWwgY2xhc3NlcyBvbiBhbiBlbGVtZW50IChlLmcuIGA8ZGl2IGNsYXNzPVwib25lIHR3byB0aHJlZVwiPmApXG4gICAqIC0gVGhlcmUgYXJlIG9uZSBvciBtb3JlIGNsYXNzIGJpbmRpbmdzIG9uIGFuIGVsZW1lbnQgKGUuZy4gYDxkaXYgW2NsYXNzLmZvb109XCJmXCI+YClcbiAgICpcbiAgICogSWYgYW5kIHdoZW4gdGhlcmUgYXJlIG9ubHkgaW5pdGlhbCBjbGFzc2VzIChubyBiaW5kaW5ncykgdGhlbiBhbiBpbnN0YW5jZSBvZiBgU3R5bGluZ01hcEFycmF5YFxuICAgKiB3aWxsIGJlIHVzZWQgaGVyZS4gT3RoZXJ3aXNlIGFuIGluc3RhbmNlIG9mIGBUU3R5bGluZ0NvbnRleHRgIHdpbGwgYmUgY3JlYXRlZCB3aGVuIHRoZXJlXG4gICAqIGFyZSBvbmUgb3IgbW9yZSBjbGFzcyBiaW5kaW5ncyBvbiBhbiBlbGVtZW50LlxuICAgKlxuICAgKiBEdXJpbmcgZWxlbWVudCBjcmVhdGlvbiB0aGlzIHZhbHVlIGlzIGxpa2VseSB0byBiZSBwb3B1bGF0ZWQgd2l0aCBhbiBpbnN0YW5jZSBvZlxuICAgKiBgU3R5bGluZ01hcEFycmF5YCBhbmQgb25seSB3aGVuIHRoZSBiaW5kaW5ncyBhcmUgZXZhbHVhdGVkICh3aGljaCBoYXBwZW5zIGR1cmluZ1xuICAgKiB1cGRhdGUgbW9kZSkgdGhlbiBpdCB3aWxsIGJlIGNvbnZlcnRlZCB0byBhIGBUU3R5bGluZ0NvbnRleHRgIGlmIGFueSBjbGFzcyBiaW5kaW5nc1xuICAgKiBhcmUgZW5jb3VudGVyZWQuIElmIGFuZCB3aGVuIHRoaXMgaGFwcGVucyB0aGVuIHRoZSBleGlzdGluZyBgU3R5bGluZ01hcEFycmF5YCB2YWx1ZVxuICAgKiB3aWxsIGJlIHBsYWNlZCBpbnRvIHRoZSBpbml0aWFsIHN0eWxpbmcgc2xvdCBpbiB0aGUgbmV3bHkgY3JlYXRlZCBgVFN0eWxpbmdDb250ZXh0YC5cbiAgICovXG4gIC8vIFRPRE8obWlza28pOiBgUmVtb3ZlIFN0eWxpbmdNYXBBcnJheXxUU3R5bGluZ0NvbnRleHR8bnVsbGAgaW4gZm9sbG93IHVwIFBSLlxuICBjbGFzc2VzOiBTdHlsaW5nTWFwQXJyYXl8VFN0eWxpbmdDb250ZXh0fHN0cmluZ3xudWxsO1xuXG4gIC8qKlxuICAgKiBTdG9yZXMgdGhlIGhlYWQvdGFpbCBpbmRleCBvZiB0aGUgY2xhc3MgYmluZGluZ3MuXG4gICAqXG4gICAqIC0gSWYgbm8gYmluZGluZ3MsIHRoZSBoZWFkIGFuZCB0YWlsIHdpbGwgYm90aCBiZSAwLlxuICAgKiAtIElmIHRoZXJlIGFyZSB0ZW1wbGF0ZSBiaW5kaW5ncywgc3RvcmVzIHRoZSBoZWFkL3RhaWwgb2YgdGhlIGNsYXNzIGJpbmRpbmdzIGluIHRoZSB0ZW1wbGF0ZS5cbiAgICogLSBJZiBubyB0ZW1wbGF0ZSBiaW5kaW5ncyBidXQgdGhlcmUgYXJlIGhvc3QgYmluZGluZ3MsIHRoZSBoZWFkIHZhbHVlIHdpbGwgcG9pbnQgdG8gdGhlIGxhc3RcbiAgICogICBob3N0IGJpbmRpbmcgZm9yIFwiY2xhc3NcIiAobm90IHRoZSBoZWFkIG9mIHRoZSBsaW5rZWQgbGlzdCksIHRhaWwgd2lsbCBiZSAwLlxuICAgKlxuICAgKiBTZWU6IGBzdHlsZV9iaW5kaW5nX2xpc3QudHNgIGZvciBkZXRhaWxzLlxuICAgKlxuICAgKiBUaGlzIGlzIHVzZWQgYnkgYGluc2VydFRTdHlsaW5nQmluZGluZ2AgdG8ga25vdyB3aGVyZSB0aGUgbmV4dCBzdHlsaW5nIGJpbmRpbmcgc2hvdWxkIGJlXG4gICAqIGluc2VydGVkIHNvIHRoYXQgdGhleSBjYW4gYmUgc29ydGVkIGluIHByaW9yaXR5IG9yZGVyLlxuICAgKi9cbiAgY2xhc3NCaW5kaW5nczogVFN0eWxpbmdSYW5nZTtcblxuICAvKipcbiAgICogU3RvcmVzIHRoZSBoZWFkL3RhaWwgaW5kZXggb2YgdGhlIGNsYXNzIGJpbmRpbmdzLlxuICAgKlxuICAgKiAtIElmIG5vIGJpbmRpbmdzLCB0aGUgaGVhZCBhbmQgdGFpbCB3aWxsIGJvdGggYmUgMC5cbiAgICogLSBJZiB0aGVyZSBhcmUgdGVtcGxhdGUgYmluZGluZ3MsIHN0b3JlcyB0aGUgaGVhZC90YWlsIG9mIHRoZSBzdHlsZSBiaW5kaW5ncyBpbiB0aGUgdGVtcGxhdGUuXG4gICAqIC0gSWYgbm8gdGVtcGxhdGUgYmluZGluZ3MgYnV0IHRoZXJlIGFyZSBob3N0IGJpbmRpbmdzLCB0aGUgaGVhZCB2YWx1ZSB3aWxsIHBvaW50IHRvIHRoZSBsYXN0XG4gICAqICAgaG9zdCBiaW5kaW5nIGZvciBcInN0eWxlXCIgKG5vdCB0aGUgaGVhZCBvZiB0aGUgbGlua2VkIGxpc3QpLCB0YWlsIHdpbGwgYmUgMC5cbiAgICpcbiAgICogU2VlOiBgc3R5bGVfYmluZGluZ19saXN0LnRzYCBmb3IgZGV0YWlscy5cbiAgICpcbiAgICogVGhpcyBpcyB1c2VkIGJ5IGBpbnNlcnRUU3R5bGluZ0JpbmRpbmdgIHRvIGtub3cgd2hlcmUgdGhlIG5leHQgc3R5bGluZyBiaW5kaW5nIHNob3VsZCBiZVxuICAgKiBpbnNlcnRlZCBzbyB0aGF0IHRoZXkgY2FuIGJlIHNvcnRlZCBpbiBwcmlvcml0eSBvcmRlci5cbiAgICovXG4gIHN0eWxlQmluZGluZ3M6IFRTdHlsaW5nUmFuZ2U7XG59XG5cbi8qKiBTdGF0aWMgZGF0YSBmb3IgYW4gZWxlbWVudCAgKi9cbmV4cG9ydCBpbnRlcmZhY2UgVEVsZW1lbnROb2RlIGV4dGVuZHMgVE5vZGUge1xuICAvKiogSW5kZXggaW4gdGhlIGRhdGFbXSBhcnJheSAqL1xuICBpbmRleDogbnVtYmVyO1xuICBjaGlsZDogVEVsZW1lbnROb2RlfFRUZXh0Tm9kZXxURWxlbWVudENvbnRhaW5lck5vZGV8VENvbnRhaW5lck5vZGV8VFByb2plY3Rpb25Ob2RlfG51bGw7XG4gIC8qKlxuICAgKiBFbGVtZW50IG5vZGVzIHdpbGwgaGF2ZSBwYXJlbnRzIHVubGVzcyB0aGV5IGFyZSB0aGUgZmlyc3Qgbm9kZSBvZiBhIGNvbXBvbmVudCBvclxuICAgKiBlbWJlZGRlZCB2aWV3ICh3aGljaCBtZWFucyB0aGVpciBwYXJlbnQgaXMgaW4gYSBkaWZmZXJlbnQgdmlldyBhbmQgbXVzdCBiZVxuICAgKiByZXRyaWV2ZWQgdXNpbmcgdmlld0RhdGFbSE9TVF9OT0RFXSkuXG4gICAqL1xuICBwYXJlbnQ6IFRFbGVtZW50Tm9kZXxURWxlbWVudENvbnRhaW5lck5vZGV8bnVsbDtcbiAgdFZpZXdzOiBudWxsO1xuXG4gIC8qKlxuICAgKiBJZiB0aGlzIGlzIGEgY29tcG9uZW50IFROb2RlIHdpdGggcHJvamVjdGlvbiwgdGhpcyB3aWxsIGJlIGFuIGFycmF5IG9mIHByb2plY3RlZFxuICAgKiBUTm9kZXMgb3IgbmF0aXZlIG5vZGVzIChzZWUgVE5vZGUucHJvamVjdGlvbiBmb3IgbW9yZSBpbmZvKS4gSWYgaXQncyBhIHJlZ3VsYXIgZWxlbWVudCBub2RlIG9yXG4gICAqIGEgY29tcG9uZW50IHdpdGhvdXQgcHJvamVjdGlvbiwgaXQgd2lsbCBiZSBudWxsLlxuICAgKi9cbiAgcHJvamVjdGlvbjogKFROb2RlfFJOb2RlW10pW118bnVsbDtcbn1cblxuLyoqIFN0YXRpYyBkYXRhIGZvciBhIHRleHQgbm9kZSAqL1xuZXhwb3J0IGludGVyZmFjZSBUVGV4dE5vZGUgZXh0ZW5kcyBUTm9kZSB7XG4gIC8qKiBJbmRleCBpbiB0aGUgZGF0YVtdIGFycmF5ICovXG4gIGluZGV4OiBudW1iZXI7XG4gIGNoaWxkOiBudWxsO1xuICAvKipcbiAgICogVGV4dCBub2RlcyB3aWxsIGhhdmUgcGFyZW50cyB1bmxlc3MgdGhleSBhcmUgdGhlIGZpcnN0IG5vZGUgb2YgYSBjb21wb25lbnQgb3JcbiAgICogZW1iZWRkZWQgdmlldyAod2hpY2ggbWVhbnMgdGhlaXIgcGFyZW50IGlzIGluIGEgZGlmZmVyZW50IHZpZXcgYW5kIG11c3QgYmVcbiAgICogcmV0cmlldmVkIHVzaW5nIExWaWV3Lm5vZGUpLlxuICAgKi9cbiAgcGFyZW50OiBURWxlbWVudE5vZGV8VEVsZW1lbnRDb250YWluZXJOb2RlfG51bGw7XG4gIHRWaWV3czogbnVsbDtcbiAgcHJvamVjdGlvbjogbnVsbDtcbn1cblxuLyoqIFN0YXRpYyBkYXRhIGZvciBhbiBMQ29udGFpbmVyICovXG5leHBvcnQgaW50ZXJmYWNlIFRDb250YWluZXJOb2RlIGV4dGVuZHMgVE5vZGUge1xuICAvKipcbiAgICogSW5kZXggaW4gdGhlIGRhdGFbXSBhcnJheS5cbiAgICpcbiAgICogSWYgaXQncyAtMSwgdGhpcyBpcyBhIGR5bmFtaWNhbGx5IGNyZWF0ZWQgY29udGFpbmVyIG5vZGUgdGhhdCBpc24ndCBzdG9yZWQgaW5cbiAgICogZGF0YVtdIChlLmcuIHdoZW4geW91IGluamVjdCBWaWV3Q29udGFpbmVyUmVmKSAuXG4gICAqL1xuICBpbmRleDogbnVtYmVyO1xuICBjaGlsZDogbnVsbDtcblxuICAvKipcbiAgICogQ29udGFpbmVyIG5vZGVzIHdpbGwgaGF2ZSBwYXJlbnRzIHVubGVzczpcbiAgICpcbiAgICogLSBUaGV5IGFyZSB0aGUgZmlyc3Qgbm9kZSBvZiBhIGNvbXBvbmVudCBvciBlbWJlZGRlZCB2aWV3XG4gICAqIC0gVGhleSBhcmUgZHluYW1pY2FsbHkgY3JlYXRlZFxuICAgKi9cbiAgcGFyZW50OiBURWxlbWVudE5vZGV8VEVsZW1lbnRDb250YWluZXJOb2RlfG51bGw7XG4gIHRWaWV3czogVFZpZXd8VFZpZXdbXXxudWxsO1xuICBwcm9qZWN0aW9uOiBudWxsO1xufVxuXG4vKiogU3RhdGljIGRhdGEgZm9yIGFuIDxuZy1jb250YWluZXI+ICovXG5leHBvcnQgaW50ZXJmYWNlIFRFbGVtZW50Q29udGFpbmVyTm9kZSBleHRlbmRzIFROb2RlIHtcbiAgLyoqIEluZGV4IGluIHRoZSBMVmlld1tdIGFycmF5LiAqL1xuICBpbmRleDogbnVtYmVyO1xuICBjaGlsZDogVEVsZW1lbnROb2RlfFRUZXh0Tm9kZXxUQ29udGFpbmVyTm9kZXxURWxlbWVudENvbnRhaW5lck5vZGV8VFByb2plY3Rpb25Ob2RlfG51bGw7XG4gIHBhcmVudDogVEVsZW1lbnROb2RlfFRFbGVtZW50Q29udGFpbmVyTm9kZXxudWxsO1xuICB0Vmlld3M6IG51bGw7XG4gIHByb2plY3Rpb246IG51bGw7XG59XG5cbi8qKiBTdGF0aWMgZGF0YSBmb3IgYW4gSUNVIGV4cHJlc3Npb24gKi9cbmV4cG9ydCBpbnRlcmZhY2UgVEljdUNvbnRhaW5lck5vZGUgZXh0ZW5kcyBUTm9kZSB7XG4gIC8qKiBJbmRleCBpbiB0aGUgTFZpZXdbXSBhcnJheS4gKi9cbiAgaW5kZXg6IG51bWJlcjtcbiAgY2hpbGQ6IFRFbGVtZW50Tm9kZXxUVGV4dE5vZGV8bnVsbDtcbiAgcGFyZW50OiBURWxlbWVudE5vZGV8VEVsZW1lbnRDb250YWluZXJOb2RlfG51bGw7XG4gIHRWaWV3czogbnVsbDtcbiAgcHJvamVjdGlvbjogbnVsbDtcbiAgLyoqXG4gICAqIEluZGljYXRlcyB0aGUgY3VycmVudCBhY3RpdmUgY2FzZSBmb3IgYW4gSUNVIGV4cHJlc3Npb24uXG4gICAqIEl0IGlzIG51bGwgd2hlbiB0aGVyZSBpcyBubyBhY3RpdmUgY2FzZS5cbiAgICovXG4gIGFjdGl2ZUNhc2VJbmRleDogbnVtYmVyfG51bGw7XG59XG5cbi8qKiBTdGF0aWMgZGF0YSBmb3IgYSB2aWV3ICAqL1xuZXhwb3J0IGludGVyZmFjZSBUVmlld05vZGUgZXh0ZW5kcyBUTm9kZSB7XG4gIC8qKiBJZiAtMSwgaXQncyBhIGR5bmFtaWNhbGx5IGNyZWF0ZWQgdmlldy4gT3RoZXJ3aXNlLCBpdCBpcyB0aGUgdmlldyBibG9jayBJRC4gKi9cbiAgaW5kZXg6IG51bWJlcjtcbiAgY2hpbGQ6IFRFbGVtZW50Tm9kZXxUVGV4dE5vZGV8VEVsZW1lbnRDb250YWluZXJOb2RlfFRDb250YWluZXJOb2RlfFRQcm9qZWN0aW9uTm9kZXxudWxsO1xuICBwYXJlbnQ6IFRDb250YWluZXJOb2RlfG51bGw7XG4gIHRWaWV3czogbnVsbDtcbiAgcHJvamVjdGlvbjogbnVsbDtcbn1cblxuLyoqIFN0YXRpYyBkYXRhIGZvciBhbiBMUHJvamVjdGlvbk5vZGUgICovXG5leHBvcnQgaW50ZXJmYWNlIFRQcm9qZWN0aW9uTm9kZSBleHRlbmRzIFROb2RlIHtcbiAgLyoqIEluZGV4IGluIHRoZSBkYXRhW10gYXJyYXkgKi9cbiAgY2hpbGQ6IG51bGw7XG4gIC8qKlxuICAgKiBQcm9qZWN0aW9uIG5vZGVzIHdpbGwgaGF2ZSBwYXJlbnRzIHVubGVzcyB0aGV5IGFyZSB0aGUgZmlyc3Qgbm9kZSBvZiBhIGNvbXBvbmVudFxuICAgKiBvciBlbWJlZGRlZCB2aWV3ICh3aGljaCBtZWFucyB0aGVpciBwYXJlbnQgaXMgaW4gYSBkaWZmZXJlbnQgdmlldyBhbmQgbXVzdCBiZVxuICAgKiByZXRyaWV2ZWQgdXNpbmcgTFZpZXcubm9kZSkuXG4gICAqL1xuICBwYXJlbnQ6IFRFbGVtZW50Tm9kZXxURWxlbWVudENvbnRhaW5lck5vZGV8bnVsbDtcbiAgdFZpZXdzOiBudWxsO1xuXG4gIC8qKiBJbmRleCBvZiB0aGUgcHJvamVjdGlvbiBub2RlLiAoU2VlIFROb2RlLnByb2plY3Rpb24gZm9yIG1vcmUgaW5mby4pICovXG4gIHByb2plY3Rpb246IG51bWJlcjtcbn1cblxuLyoqXG4gKiBBIHVuaW9uIHR5cGUgcmVwcmVzZW50aW5nIGFsbCBUTm9kZSB0eXBlcyB0aGF0IGNhbiBob3N0IGEgZGlyZWN0aXZlLlxuICovXG5leHBvcnQgdHlwZSBURGlyZWN0aXZlSG9zdE5vZGUgPSBURWxlbWVudE5vZGUgfCBUQ29udGFpbmVyTm9kZSB8IFRFbGVtZW50Q29udGFpbmVyTm9kZTtcblxuLyoqXG4gKiBUaGlzIG1hcHBpbmcgaXMgbmVjZXNzYXJ5IHNvIHdlIGNhbiBzZXQgaW5wdXQgcHJvcGVydGllcyBhbmQgb3V0cHV0IGxpc3RlbmVyc1xuICogcHJvcGVybHkgYXQgcnVudGltZSB3aGVuIHByb3BlcnR5IG5hbWVzIGFyZSBtaW5pZmllZCBvciBhbGlhc2VkLlxuICpcbiAqIEtleTogdW5taW5pZmllZCAvIHB1YmxpYyBpbnB1dCBvciBvdXRwdXQgbmFtZVxuICogVmFsdWU6IGFycmF5IGNvbnRhaW5pbmcgbWluaWZpZWQgLyBpbnRlcm5hbCBuYW1lIGFuZCByZWxhdGVkIGRpcmVjdGl2ZSBpbmRleFxuICpcbiAqIFRoZSB2YWx1ZSBtdXN0IGJlIGFuIGFycmF5IHRvIHN1cHBvcnQgaW5wdXRzIGFuZCBvdXRwdXRzIHdpdGggdGhlIHNhbWUgbmFtZVxuICogb24gdGhlIHNhbWUgbm9kZS5cbiAqL1xuZXhwb3J0IHR5cGUgUHJvcGVydHlBbGlhc2VzID0ge1xuICAvLyBUaGlzIHVzZXMgYW4gb2JqZWN0IG1hcCBiZWNhdXNlIHVzaW5nIHRoZSBNYXAgdHlwZSB3b3VsZCBiZSB0b28gc2xvd1xuICBba2V5OiBzdHJpbmddOiBQcm9wZXJ0eUFsaWFzVmFsdWVcbn07XG5cbi8qKlxuICogU3RvcmUgdGhlIHJ1bnRpbWUgaW5wdXQgb3Igb3V0cHV0IG5hbWVzIGZvciBhbGwgdGhlIGRpcmVjdGl2ZXMuXG4gKlxuICogaSswOiBkaXJlY3RpdmUgaW5zdGFuY2UgaW5kZXhcbiAqIGkrMTogcHJpdmF0ZU5hbWVcbiAqXG4gKiBlLmcuIFswLCAnY2hhbmdlLW1pbmlmaWVkJ11cbiAqL1xuZXhwb3J0IHR5cGUgUHJvcGVydHlBbGlhc1ZhbHVlID0gKG51bWJlciB8IHN0cmluZylbXTtcblxuLyoqXG4gKiBUaGlzIGFycmF5IGNvbnRhaW5zIGluZm9ybWF0aW9uIGFib3V0IGlucHV0IHByb3BlcnRpZXMgdGhhdFxuICogbmVlZCB0byBiZSBzZXQgb25jZSBmcm9tIGF0dHJpYnV0ZSBkYXRhLiBJdCdzIG9yZGVyZWQgYnlcbiAqIGRpcmVjdGl2ZSBpbmRleCAocmVsYXRpdmUgdG8gZWxlbWVudCkgc28gaXQncyBzaW1wbGUgdG9cbiAqIGxvb2sgdXAgYSBzcGVjaWZpYyBkaXJlY3RpdmUncyBpbml0aWFsIGlucHV0IGRhdGEuXG4gKlxuICogV2l0aGluIGVhY2ggc3ViLWFycmF5OlxuICpcbiAqIGkrMDogYXR0cmlidXRlIG5hbWVcbiAqIGkrMTogbWluaWZpZWQvaW50ZXJuYWwgaW5wdXQgbmFtZVxuICogaSsyOiBpbml0aWFsIHZhbHVlXG4gKlxuICogSWYgYSBkaXJlY3RpdmUgb24gYSBub2RlIGRvZXMgbm90IGhhdmUgYW55IGlucHV0IHByb3BlcnRpZXNcbiAqIHRoYXQgc2hvdWxkIGJlIHNldCBmcm9tIGF0dHJpYnV0ZXMsIGl0cyBpbmRleCBpcyBzZXQgdG8gbnVsbFxuICogdG8gYXZvaWQgYSBzcGFyc2UgYXJyYXkuXG4gKlxuICogZS5nLiBbbnVsbCwgWydyb2xlLW1pbicsICdtaW5pZmllZC1pbnB1dCcsICdidXR0b24nXV1cbiAqL1xuZXhwb3J0IHR5cGUgSW5pdGlhbElucHV0RGF0YSA9IChJbml0aWFsSW5wdXRzIHwgbnVsbClbXTtcblxuLyoqXG4gKiBVc2VkIGJ5IEluaXRpYWxJbnB1dERhdGEgdG8gc3RvcmUgaW5wdXQgcHJvcGVydGllc1xuICogdGhhdCBzaG91bGQgYmUgc2V0IG9uY2UgZnJvbSBhdHRyaWJ1dGVzLlxuICpcbiAqIGkrMDogYXR0cmlidXRlIG5hbWVcbiAqIGkrMTogbWluaWZpZWQvaW50ZXJuYWwgaW5wdXQgbmFtZVxuICogaSsyOiBpbml0aWFsIHZhbHVlXG4gKlxuICogZS5nLiBbJ3JvbGUtbWluJywgJ21pbmlmaWVkLWlucHV0JywgJ2J1dHRvbiddXG4gKi9cbmV4cG9ydCB0eXBlIEluaXRpYWxJbnB1dHMgPSBzdHJpbmdbXTtcblxuLy8gTm90ZTogVGhpcyBoYWNrIGlzIG5lY2Vzc2FyeSBzbyB3ZSBkb24ndCBlcnJvbmVvdXNseSBnZXQgYSBjaXJjdWxhciBkZXBlbmRlbmN5XG4vLyBmYWlsdXJlIGJhc2VkIG9uIHR5cGVzLlxuZXhwb3J0IGNvbnN0IHVudXNlZFZhbHVlRXhwb3J0VG9QbGFjYXRlQWpkID0gMTtcblxuLyoqXG4gKiBUeXBlIHJlcHJlc2VudGluZyBhIHNldCBvZiBUTm9kZXMgdGhhdCBjYW4gaGF2ZSBsb2NhbCByZWZzIChgI2Zvb2ApIHBsYWNlZCBvbiB0aGVtLlxuICovXG5leHBvcnQgdHlwZSBUTm9kZVdpdGhMb2NhbFJlZnMgPSBUQ29udGFpbmVyTm9kZSB8IFRFbGVtZW50Tm9kZSB8IFRFbGVtZW50Q29udGFpbmVyTm9kZTtcblxuLyoqXG4gKiBUeXBlIGZvciBhIGZ1bmN0aW9uIHRoYXQgZXh0cmFjdHMgYSB2YWx1ZSBmb3IgYSBsb2NhbCByZWZzLlxuICogRXhhbXBsZTpcbiAqIC0gYDxkaXYgI25hdGl2ZURpdkVsPmAgLSBgbmF0aXZlRGl2RWxgIHNob3VsZCBwb2ludCB0byB0aGUgbmF0aXZlIGA8ZGl2PmAgZWxlbWVudDtcbiAqIC0gYDxuZy10ZW1wbGF0ZSAjdHBsUmVmPmAgLSBgdHBsUmVmYCBzaG91bGQgcG9pbnQgdG8gdGhlIGBUZW1wbGF0ZVJlZmAgaW5zdGFuY2U7XG4gKi9cbmV4cG9ydCB0eXBlIExvY2FsUmVmRXh0cmFjdG9yID0gKHROb2RlOiBUTm9kZVdpdGhMb2NhbFJlZnMsIGN1cnJlbnRWaWV3OiBMVmlldykgPT4gYW55O1xuIl19