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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9kZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaW50ZXJmYWNlcy9ub2RlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQWdCQSxNQUFrQixTQUFTO0lBQ3pCOztPQUVHO0lBQ0gsU0FBUyxHQUFJO0lBQ2I7O09BRUc7SUFDSCxVQUFVLEdBQUk7SUFDZDs7T0FFRztJQUNILElBQUksR0FBSTtJQUNSOztPQUVHO0lBQ0gsT0FBTyxHQUFJO0lBQ1g7O09BRUc7SUFDSCxnQkFBZ0IsR0FBSTtJQUNwQjs7T0FFRztJQUNILFlBQVksR0FBSTtFQUNqQjs7O0FBS0QsTUFBa0IsVUFBVTtJQUMxQiwrRkFBK0Y7SUFDL0YsZUFBZSxHQUFNO0lBRXJCOzs7O1NBSUs7SUFDTCxlQUFlLEdBQU07SUFFckIsOERBQThEO0lBQzlELFdBQVcsR0FBTTtJQUVqQixpRkFBaUY7SUFDakYsZUFBZSxHQUFNO0lBRXJCLGtFQUFrRTtJQUNsRSxhQUFhLElBQU87SUFFcEIsa0VBQWtFO0lBQ2xFLGFBQWEsSUFBTztJQUVwQixtRUFBbUU7SUFDbkUsVUFBVSxJQUFPO0lBRWpCOzs7OztPQUtHO0lBQ0gsZUFBZSxLQUFPO0lBRXRCLCtEQUErRDtJQUMvRCxpQkFBaUIsS0FBUTtJQUV6Qjs7Ozs7O09BTUc7SUFDSCxtQkFBbUIsS0FBUTtJQUUzQjs7Ozs7O09BTUc7SUFDSCxvQkFBb0IsTUFBUTtJQUU1Qjs7T0FFRztJQUNILDBCQUEwQixNQUE2QztJQUV2RTs7Ozs7O09BTUc7SUFDSCx3QkFBd0IsTUFBUTtJQUVoQzs7Ozs7O09BTUc7SUFDSCxvQkFBb0IsTUFBUztJQUU3Qjs7Ozs7OztPQU9HO0lBQ0gseUJBQXlCLE1BQVM7SUFFbEM7Ozs7OztPQU1HO0lBQ0gsbUJBQW1CLE9BQVM7SUFFNUI7Ozs7OztPQU1HO0lBQ0gsb0JBQW9CLE9BQVM7SUFFN0I7O09BRUc7SUFDSCwwQkFBMEIsT0FBNkM7SUFFdkU7Ozs7OztPQU1HO0lBQ0gsd0JBQXdCLE9BQVU7SUFFbEM7Ozs7OztPQU1HO0lBQ0gsb0JBQW9CLFFBQVU7SUFFOUI7Ozs7Ozs7T0FPRztJQUNILHlCQUF5QixRQUFVO0VBQ3BDOzs7QUFLRCxNQUFrQixvQkFBb0I7SUFDcEMsNEZBQTRGO0lBQzVGLHVCQUF1QixPQUFxQztJQUU1RDswQkFDc0I7SUFDdEIsMEJBQTBCLElBQUs7SUFDL0IsNEJBQTRCLE9BQXFDO0VBQ2xFOzs7QUFLRCxNQUFrQixlQUFlO0lBQy9COzs7O09BSUc7SUFDSCxZQUFZLEdBQUk7SUFFaEI7Ozs7Ozs7Ozs7Ozs7OztRQWVJO0lBQ0osT0FBTyxHQUFJO0lBRVg7Ozs7Ozs7Ozs7Ozs7Ozs7T0FnQkc7SUFDSCxNQUFNLEdBQUk7SUFFVjs7Ozs7Ozs7Ozs7Ozs7T0FjRztJQUNILFFBQVEsR0FBSTtJQUVaOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O09Bc0JHO0lBQ0gsUUFBUSxHQUFJO0lBRVo7Ozs7Ozs7Ozs7Ozs7O09BY0c7SUFDSCxTQUFTLEdBQUk7SUFFYjs7Ozs7Ozs7Ozs7OztPQWFHO0lBQ0gsSUFBSSxHQUFJO0VBQ1Q7Ozs7Ozs7Ozs7Ozs7O0FBNEJELDJCQTRQQzs7Ozs7O0lBMVBDLHFCQUFnQjs7Ozs7Ozs7OztJQVVoQixzQkFBYzs7Ozs7Ozs7Ozs7Ozs7O0lBZWQsOEJBQXNCOzs7OztJQUt0QiwrQkFBdUI7Ozs7O0lBS3ZCLDZCQUFxQjs7Ozs7O0lBTXJCLGlDQUFnQzs7Ozs7SUFLaEMsc0JBQWtCOzs7Ozs7OztJQVNsQixnQ0FBc0M7Ozs7O0lBR3RDLHdCQUFxQjs7Ozs7Ozs7Ozs7Ozs7OztJQWdCckIsc0JBQXdCOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBbUJ4QiwyQkFBbUM7Ozs7O0lBR25DLDhCQUErQzs7Ozs7O0lBTS9DLHVCQUE2Qjs7Ozs7O0lBTTdCLHdCQUE4Qjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQXNCOUIsdUJBQTJCOzs7Ozs7SUFNM0IscUJBQWlCOzs7Ozs7OztJQVFqQiwrQkFBMkI7Ozs7Ozs7O0lBUTNCLHNCQUFrQjs7Ozs7Ozs7Ozs7Ozs7OztJQWdCbEIsdUJBQXlDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQXlDekMsMkJBQTBDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQW9CMUMsdUJBQTZDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQW9CN0Msd0JBQThDOzs7Ozs7QUFJaEQsa0NBa0JDOzs7Ozs7SUFoQkMsNkJBQWM7O0lBQ2QsNkJBQXdGOzs7Ozs7O0lBTXhGLDhCQUFnRDs7SUFDaEQsOEJBQWE7Ozs7Ozs7SUFPYixrQ0FBbUM7Ozs7OztBQUlyQywrQkFZQzs7Ozs7O0lBVkMsMEJBQWM7O0lBQ2QsMEJBQVk7Ozs7Ozs7SUFNWiwyQkFBZ0Q7O0lBQ2hELDJCQUFhOztJQUNiLCtCQUFpQjs7Ozs7O0FBSW5CLG9DQW1CQzs7Ozs7Ozs7O0lBWkMsK0JBQWM7O0lBQ2QsK0JBQVk7Ozs7Ozs7O0lBUVosZ0NBQWdEOztJQUNoRCxnQ0FBMkI7O0lBQzNCLG9DQUFpQjs7Ozs7O0FBSW5CLDJDQU9DOzs7Ozs7SUFMQyxzQ0FBYzs7SUFDZCxzQ0FBd0Y7O0lBQ3hGLHVDQUFnRDs7SUFDaEQsdUNBQWE7O0lBQ2IsMkNBQWlCOzs7Ozs7QUFJbkIsdUNBWUM7Ozs7OztJQVZDLGtDQUFjOztJQUNkLGtDQUFtQzs7SUFDbkMsbUNBQWdEOztJQUNoRCxtQ0FBYTs7SUFDYix1Q0FBaUI7Ozs7OztJQUtqQiw0Q0FBNkI7Ozs7OztBQUkvQiwrQkFPQzs7Ozs7O0lBTEMsMEJBQWM7O0lBQ2QsMEJBQXdGOztJQUN4RiwyQkFBNEI7O0lBQzVCLDJCQUFhOztJQUNiLCtCQUFpQjs7Ozs7O0FBSW5CLHFDQWFDOzs7Ozs7SUFYQyxnQ0FBWTs7Ozs7OztJQU1aLGlDQUFnRDs7SUFDaEQsaUNBQWE7Ozs7O0lBR2IscUNBQW1COzs7OztBQW1FckIsTUFBTSxPQUFPLDZCQUE2QixHQUFHLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5pbXBvcnQge1N0eWxpbmdNYXBBcnJheSwgVFN0eWxpbmdDb250ZXh0fSBmcm9tICcuLi9pbnRlcmZhY2VzL3N0eWxpbmcnO1xuaW1wb3J0IHtDc3NTZWxlY3Rvcn0gZnJvbSAnLi9wcm9qZWN0aW9uJztcbmltcG9ydCB7Uk5vZGV9IGZyb20gJy4vcmVuZGVyZXInO1xuaW1wb3J0IHtMVmlldywgVFZpZXd9IGZyb20gJy4vdmlldyc7XG5cblxuLyoqXG4gKiBUTm9kZVR5cGUgY29ycmVzcG9uZHMgdG8gdGhlIHtAbGluayBUTm9kZX0gYHR5cGVgIHByb3BlcnR5LlxuICovXG5leHBvcnQgY29uc3QgZW51bSBUTm9kZVR5cGUge1xuICAvKipcbiAgICogVGhlIFROb2RlIGNvbnRhaW5zIGluZm9ybWF0aW9uIGFib3V0IGFuIHtAbGluayBMQ29udGFpbmVyfSBmb3IgZW1iZWRkZWQgdmlld3MuXG4gICAqL1xuICBDb250YWluZXIgPSAwLFxuICAvKipcbiAgICogVGhlIFROb2RlIGNvbnRhaW5zIGluZm9ybWF0aW9uIGFib3V0IGFuIGA8bmctY29udGVudD5gIHByb2plY3Rpb25cbiAgICovXG4gIFByb2plY3Rpb24gPSAxLFxuICAvKipcbiAgICogVGhlIFROb2RlIGNvbnRhaW5zIGluZm9ybWF0aW9uIGFib3V0IGFuIHtAbGluayBMVmlld31cbiAgICovXG4gIFZpZXcgPSAyLFxuICAvKipcbiAgICogVGhlIFROb2RlIGNvbnRhaW5zIGluZm9ybWF0aW9uIGFib3V0IGEgRE9NIGVsZW1lbnQgYWthIHtAbGluayBSTm9kZX0uXG4gICAqL1xuICBFbGVtZW50ID0gMyxcbiAgLyoqXG4gICAqIFRoZSBUTm9kZSBjb250YWlucyBpbmZvcm1hdGlvbiBhYm91dCBhbiBgPG5nLWNvbnRhaW5lcj5gIGVsZW1lbnQge0BsaW5rIFJOb2RlfS5cbiAgICovXG4gIEVsZW1lbnRDb250YWluZXIgPSA0LFxuICAvKipcbiAgICogVGhlIFROb2RlIGNvbnRhaW5zIGluZm9ybWF0aW9uIGFib3V0IGFuIElDVSBjb21tZW50IHVzZWQgaW4gYGkxOG5gLlxuICAgKi9cbiAgSWN1Q29udGFpbmVyID0gNSxcbn1cblxuLyoqXG4gKiBDb3JyZXNwb25kcyB0byB0aGUgVE5vZGUuZmxhZ3MgcHJvcGVydHkuXG4gKi9cbmV4cG9ydCBjb25zdCBlbnVtIFROb2RlRmxhZ3Mge1xuICAvKiogQml0ICMxIC0gVGhpcyBiaXQgaXMgc2V0IGlmIHRoZSBub2RlIGlzIGEgaG9zdCBmb3IgYW55IGRpcmVjdGl2ZSAoaW5jbHVkaW5nIGEgY29tcG9uZW50KSAqL1xuICBpc0RpcmVjdGl2ZUhvc3QgPSAweDEsXG5cbiAgLyoqXG4gICAqIEJpdCAjMiAtIFRoaXMgYml0IGlzIHNldCBpZiB0aGUgbm9kZSBpcyBhIGhvc3QgZm9yIGEgY29tcG9uZW50LlxuICAgKlxuICAgKiBTZXR0aW5nIHRoaXMgYml0IGltcGxpZXMgdGhhdCB0aGUgYGlzRGlyZWN0aXZlSG9zdGAgYml0IGlzIHNldCBhcyB3ZWxsLlxuICAgKiAqL1xuICBpc0NvbXBvbmVudEhvc3QgPSAweDIsXG5cbiAgLyoqIEJpdCAjMyAtIFRoaXMgYml0IGlzIHNldCBpZiB0aGUgbm9kZSBoYXMgYmVlbiBwcm9qZWN0ZWQgKi9cbiAgaXNQcm9qZWN0ZWQgPSAweDQsXG5cbiAgLyoqIEJpdCAjNCAtIFRoaXMgYml0IGlzIHNldCBpZiBhbnkgZGlyZWN0aXZlIG9uIHRoaXMgbm9kZSBoYXMgY29udGVudCBxdWVyaWVzICovXG4gIGhhc0NvbnRlbnRRdWVyeSA9IDB4OCxcblxuICAvKiogQml0ICM1IC0gVGhpcyBiaXQgaXMgc2V0IGlmIHRoZSBub2RlIGhhcyBhbnkgXCJjbGFzc1wiIGlucHV0cyAqL1xuICBoYXNDbGFzc0lucHV0ID0gMHgxMCxcblxuICAvKiogQml0ICM2IC0gVGhpcyBiaXQgaXMgc2V0IGlmIHRoZSBub2RlIGhhcyBhbnkgXCJzdHlsZVwiIGlucHV0cyAqL1xuICBoYXNTdHlsZUlucHV0ID0gMHgyMCxcblxuICAvKiogQml0ICM3IFRoaXMgYml0IGlzIHNldCBpZiB0aGUgbm9kZSBoYXMgYmVlbiBkZXRhY2hlZCBieSBpMThuICovXG4gIGlzRGV0YWNoZWQgPSAweDQwLFxuXG4gIC8qKlxuICAgKiBCaXQgIzggLSBUaGlzIGJpdCBpcyBzZXQgaWYgdGhlIG5vZGUgaGFzIGRpcmVjdGl2ZXMgd2l0aCBob3N0IGJpbmRpbmdzLlxuICAgKlxuICAgKiBUaGlzIGZsYWdzIGFsbG93cyB1cyB0byBndWFyZCBob3N0LWJpbmRpbmcgbG9naWMgYW5kIGludm9rZSBpdCBvbmx5IG9uIG5vZGVzXG4gICAqIHRoYXQgYWN0dWFsbHkgaGF2ZSBkaXJlY3RpdmVzIHdpdGggaG9zdCBiaW5kaW5ncy5cbiAgICovXG4gIGhhc0hvc3RCaW5kaW5ncyA9IDB4ODAsXG5cbiAgLyoqIEJpdCAjOSAtIFRoaXMgYml0IGlzIHNldCBpZiB0aGUgbm9kZSBoYXMgaW5pdGlhbCBzdHlsaW5nICovXG4gIGhhc0luaXRpYWxTdHlsaW5nID0gMHgxMDAsXG5cbiAgLyoqXG4gICAqIEJpdCAjMTAgLSBXaGV0aGVyIG9yIG5vdCB0aGVyZSBhcmUgY2xhc3MtYmFzZWQgbWFwIGJpbmRpbmdzIHByZXNlbnQuXG4gICAqXG4gICAqIEV4YW1wbGVzIGluY2x1ZGU6XG4gICAqIDEuIGA8ZGl2IFtjbGFzc109XCJ4XCI+YFxuICAgKiAyLiBgQEhvc3RCaW5kaW5nKCdjbGFzcycpIHhgXG4gICAqL1xuICBoYXNDbGFzc01hcEJpbmRpbmdzID0gMHgyMDAsXG5cbiAgLyoqXG4gICAqIEJpdCAjMTEgLSBXaGV0aGVyIG9yIG5vdCB0aGVyZSBhcmUgYW55IGNsYXNzLWJhc2VkIHByb3AgYmluZGluZ3MgcHJlc2VudC5cbiAgICpcbiAgICogRXhhbXBsZXMgaW5jbHVkZTpcbiAgICogMS4gYDxkaXYgW2NsYXNzLm5hbWVdPVwieFwiPmBcbiAgICogMi4gYEBIb3N0QmluZGluZygnY2xhc3MubmFtZScpIHhgXG4gICAqL1xuICBoYXNDbGFzc1Byb3BCaW5kaW5ncyA9IDB4NDAwLFxuXG4gIC8qKlxuICAgKiBCaXQgIzEyIC0gd2hldGhlciBvciBub3QgdGhlcmUgYXJlIGFueSBhY3RpdmUgW2NsYXNzXSBhbmQgW2NsYXNzLm5hbWVdIGJpbmRpbmdzXG4gICAqL1xuICBoYXNDbGFzc1Byb3BBbmRNYXBCaW5kaW5ncyA9IGhhc0NsYXNzTWFwQmluZGluZ3MgfCBoYXNDbGFzc1Byb3BCaW5kaW5ncyxcblxuICAvKipcbiAgICogQml0ICMxMyAtIFdoZXRoZXIgb3Igbm90IHRoZSBjb250ZXh0IGNvbnRhaW5zIG9uZSBvciBtb3JlIGNsYXNzLWJhc2VkIHRlbXBsYXRlIGJpbmRpbmdzLlxuICAgKlxuICAgKiBFeGFtcGxlcyBpbmNsdWRlOlxuICAgKiAxLiBgPGRpdiBbY2xhc3NdPVwieFwiPmBcbiAgICogMi4gYDxkaXYgW2NsYXNzLm5hbWVdPVwieFwiPmBcbiAgICovXG4gIGhhc1RlbXBsYXRlQ2xhc3NCaW5kaW5ncyA9IDB4ODAwLFxuXG4gIC8qKlxuICAgKiBCaXQgIzE0IC0gV2hldGhlciBvciBub3QgdGhlIGNvbnRleHQgY29udGFpbnMgb25lIG9yIG1vcmUgY2xhc3MtYmFzZWQgaG9zdCBiaW5kaW5ncy5cbiAgICpcbiAgICogRXhhbXBsZXMgaW5jbHVkZTpcbiAgICogMS4gYEBIb3N0QmluZGluZygnY2xhc3MnKSB4YFxuICAgKiAyLiBgQEhvc3RCaW5kaW5nKCdjbGFzcy5uYW1lJykgeGBcbiAgICovXG4gIGhhc0hvc3RDbGFzc0JpbmRpbmdzID0gMHgxMDAwLFxuXG4gIC8qKlxuICAgKiBCaXQgIzE1IC0gV2hldGhlciBvciBub3QgdGhlcmUgYXJlIHR3byBvciBtb3JlIHNvdXJjZXMgZm9yIGEgY2xhc3MgcHJvcGVydHkgaW4gdGhlIGNvbnRleHQuXG4gICAqXG4gICAqIEV4YW1wbGVzIGluY2x1ZGU6XG4gICAqIDEuIHByb3AgKyBwcm9wOiBgPGRpdiBbY2xhc3MuYWN0aXZlXT1cInhcIiBkaXItdGhhdC1zZXRzLWFjdGl2ZS1jbGFzcz5gXG4gICAqIDIuIG1hcCArIHByb3A6IGA8ZGl2IFtjbGFzc109XCJ4XCIgW2NsYXNzLmZvb10+YFxuICAgKiAzLiBtYXAgKyBtYXA6IGA8ZGl2IFtjbGFzc109XCJ4XCIgZGlyLXRoYXQtc2V0cy1jbGFzcz5gXG4gICAqL1xuICBoYXNEdXBsaWNhdGVDbGFzc0JpbmRpbmdzID0gMHgyMDAwLFxuXG4gIC8qKlxuICAgKiBCaXQgIzE2IC0gV2hldGhlciBvciBub3QgdGhlcmUgYXJlIHN0eWxlLWJhc2VkIG1hcCBiaW5kaW5ncyBwcmVzZW50LlxuICAgKlxuICAgKiBFeGFtcGxlcyBpbmNsdWRlOlxuICAgKiAxLiBgPGRpdiBbc3R5bGVdPVwieFwiPmBcbiAgICogMi4gYEBIb3N0QmluZGluZygnc3R5bGUnKSB4YFxuICAgKi9cbiAgaGFzU3R5bGVNYXBCaW5kaW5ncyA9IDB4NDAwMCxcblxuICAvKipcbiAgICogQml0ICMxNyAtIFdoZXRoZXIgb3Igbm90IHRoZXJlIGFyZSBhbnkgc3R5bGUtYmFzZWQgcHJvcCBiaW5kaW5ncyBwcmVzZW50LlxuICAgKlxuICAgKiBFeGFtcGxlcyBpbmNsdWRlOlxuICAgKiAxLiBgPGRpdiBbc3R5bGUucHJvcF09XCJ4XCI+YFxuICAgKiAyLiBgQEhvc3RCaW5kaW5nKCdzdHlsZS5wcm9wJykgeGBcbiAgICovXG4gIGhhc1N0eWxlUHJvcEJpbmRpbmdzID0gMHg4MDAwLFxuXG4gIC8qKlxuICAgKiBCaXQgIzE4IC0gd2hldGhlciBvciBub3QgdGhlcmUgYXJlIGFueSBhY3RpdmUgW3N0eWxlXSBhbmQgW3N0eWxlLnByb3BdIGJpbmRpbmdzXG4gICAqL1xuICBoYXNTdHlsZVByb3BBbmRNYXBCaW5kaW5ncyA9IGhhc1N0eWxlTWFwQmluZGluZ3MgfCBoYXNTdHlsZVByb3BCaW5kaW5ncyxcblxuICAvKipcbiAgICogQml0ICMxOSAtIFdoZXRoZXIgb3Igbm90IHRoZSBjb250ZXh0IGNvbnRhaW5zIG9uZSBvciBtb3JlIHN0eWxlLWJhc2VkIHRlbXBsYXRlIGJpbmRpbmdzLlxuICAgKlxuICAgKiBFeGFtcGxlcyBpbmNsdWRlOlxuICAgKiAxLiBgPGRpdiBbc3R5bGVdPVwieFwiPmBcbiAgICogMi4gYDxkaXYgW3N0eWxlLnByb3BdPVwieFwiPmBcbiAgICovXG4gIGhhc1RlbXBsYXRlU3R5bGVCaW5kaW5ncyA9IDB4MTAwMDAsXG5cbiAgLyoqXG4gICAqIEJpdCAjMjAgLSBXaGV0aGVyIG9yIG5vdCB0aGUgY29udGV4dCBjb250YWlucyBvbmUgb3IgbW9yZSBzdHlsZS1iYXNlZCBob3N0IGJpbmRpbmdzLlxuICAgKlxuICAgKiBFeGFtcGxlcyBpbmNsdWRlOlxuICAgKiAxLiBgQEhvc3RCaW5kaW5nKCdzdHlsZScpIHhgXG4gICAqIDIuIGBASG9zdEJpbmRpbmcoJ3N0eWxlLnByb3AnKSB4YFxuICAgKi9cbiAgaGFzSG9zdFN0eWxlQmluZGluZ3MgPSAweDIwMDAwLFxuXG4gIC8qKlxuICAgKiBCaXQgIzIxIC0gV2hldGhlciBvciBub3QgdGhlcmUgYXJlIHR3byBvciBtb3JlIHNvdXJjZXMgZm9yIGEgc3R5bGUgcHJvcGVydHkgaW4gdGhlIGNvbnRleHQuXG4gICAqXG4gICAqIEV4YW1wbGVzIGluY2x1ZGU6XG4gICAqIDEuIHByb3AgKyBwcm9wOiBgPGRpdiBbc3R5bGUud2lkdGhdPVwieFwiIGRpci10aGF0LXNldHMtd2lkdGg+YFxuICAgKiAyLiBtYXAgKyBwcm9wOiBgPGRpdiBbc3R5bGVdPVwieFwiIFtzdHlsZS5wcm9wXT5gXG4gICAqIDMuIG1hcCArIG1hcDogYDxkaXYgW3N0eWxlXT1cInhcIiBkaXItdGhhdC1zZXRzLXN0eWxlPmBcbiAgICovXG4gIGhhc0R1cGxpY2F0ZVN0eWxlQmluZGluZ3MgPSAweDQwMDAwLFxufVxuXG4vKipcbiAqIENvcnJlc3BvbmRzIHRvIHRoZSBUTm9kZS5wcm92aWRlckluZGV4ZXMgcHJvcGVydHkuXG4gKi9cbmV4cG9ydCBjb25zdCBlbnVtIFROb2RlUHJvdmlkZXJJbmRleGVzIHtcbiAgLyoqIFRoZSBpbmRleCBvZiB0aGUgZmlyc3QgcHJvdmlkZXIgb24gdGhpcyBub2RlIGlzIGVuY29kZWQgb24gdGhlIGxlYXN0IHNpZ25pZmljYW50IGJpdHMgKi9cbiAgUHJvdmlkZXJzU3RhcnRJbmRleE1hc2sgPSAwYjAwMDAwMDAwMDAwMDAwMDAxMTExMTExMTExMTExMTExLFxuXG4gIC8qKiBUaGUgY291bnQgb2YgdmlldyBwcm92aWRlcnMgZnJvbSB0aGUgY29tcG9uZW50IG9uIHRoaXMgbm9kZSBpcyBlbmNvZGVkIG9uIHRoZSAxNiBtb3N0XG4gICAgIHNpZ25pZmljYW50IGJpdHMgKi9cbiAgQ3B0Vmlld1Byb3ZpZGVyc0NvdW50U2hpZnQgPSAxNixcbiAgQ3B0Vmlld1Byb3ZpZGVyc0NvdW50U2hpZnRlciA9IDBiMDAwMDAwMDAwMDAwMDAwMTAwMDAwMDAwMDAwMDAwMDAsXG59XG4vKipcbiAqIEEgc2V0IG9mIG1hcmtlciB2YWx1ZXMgdG8gYmUgdXNlZCBpbiB0aGUgYXR0cmlidXRlcyBhcnJheXMuIFRoZXNlIG1hcmtlcnMgaW5kaWNhdGUgdGhhdCBzb21lXG4gKiBpdGVtcyBhcmUgbm90IHJlZ3VsYXIgYXR0cmlidXRlcyBhbmQgdGhlIHByb2Nlc3Npbmcgc2hvdWxkIGJlIGFkYXB0ZWQgYWNjb3JkaW5nbHkuXG4gKi9cbmV4cG9ydCBjb25zdCBlbnVtIEF0dHJpYnV0ZU1hcmtlciB7XG4gIC8qKlxuICAgKiBNYXJrZXIgaW5kaWNhdGVzIHRoYXQgdGhlIGZvbGxvd2luZyAzIHZhbHVlcyBpbiB0aGUgYXR0cmlidXRlcyBhcnJheSBhcmU6XG4gICAqIG5hbWVzcGFjZVVyaSwgYXR0cmlidXRlTmFtZSwgYXR0cmlidXRlVmFsdWVcbiAgICogaW4gdGhhdCBvcmRlci5cbiAgICovXG4gIE5hbWVzcGFjZVVSSSA9IDAsXG5cbiAgLyoqXG4gICAgKiBTaWduYWxzIGNsYXNzIGRlY2xhcmF0aW9uLlxuICAgICpcbiAgICAqIEVhY2ggdmFsdWUgZm9sbG93aW5nIGBDbGFzc2VzYCBkZXNpZ25hdGVzIGEgY2xhc3MgbmFtZSB0byBpbmNsdWRlIG9uIHRoZSBlbGVtZW50LlxuICAgICogIyMgRXhhbXBsZTpcbiAgICAqXG4gICAgKiBHaXZlbjpcbiAgICAqIGBgYFxuICAgICogPGRpdiBjbGFzcz1cImZvbyBiYXIgYmF6XCI+Li4uPGQvdmk+XG4gICAgKiBgYGBcbiAgICAqXG4gICAgKiB0aGUgZ2VuZXJhdGVkIGNvZGUgaXM6XG4gICAgKiBgYGBcbiAgICAqIHZhciBfYzEgPSBbQXR0cmlidXRlTWFya2VyLkNsYXNzZXMsICdmb28nLCAnYmFyJywgJ2JheiddO1xuICAgICogYGBgXG4gICAgKi9cbiAgQ2xhc3NlcyA9IDEsXG5cbiAgLyoqXG4gICAqIFNpZ25hbHMgc3R5bGUgZGVjbGFyYXRpb24uXG4gICAqXG4gICAqIEVhY2ggcGFpciBvZiB2YWx1ZXMgZm9sbG93aW5nIGBTdHlsZXNgIGRlc2lnbmF0ZXMgYSBzdHlsZSBuYW1lIGFuZCB2YWx1ZSB0byBpbmNsdWRlIG9uIHRoZVxuICAgKiBlbGVtZW50LlxuICAgKiAjIyBFeGFtcGxlOlxuICAgKlxuICAgKiBHaXZlbjpcbiAgICogYGBgXG4gICAqIDxkaXYgc3R5bGU9XCJ3aWR0aDoxMDBweDsgaGVpZ2h0OjIwMHB4OyBjb2xvcjpyZWRcIj4uLi48L2Rpdj5cbiAgICogYGBgXG4gICAqXG4gICAqIHRoZSBnZW5lcmF0ZWQgY29kZSBpczpcbiAgICogYGBgXG4gICAqIHZhciBfYzEgPSBbQXR0cmlidXRlTWFya2VyLlN0eWxlcywgJ3dpZHRoJywgJzEwMHB4JywgJ2hlaWdodCcuICcyMDBweCcsICdjb2xvcicsICdyZWQnXTtcbiAgICogYGBgXG4gICAqL1xuICBTdHlsZXMgPSAyLFxuXG4gIC8qKlxuICAgKiBTaWduYWxzIHRoYXQgdGhlIGZvbGxvd2luZyBhdHRyaWJ1dGUgbmFtZXMgd2VyZSBleHRyYWN0ZWQgZnJvbSBpbnB1dCBvciBvdXRwdXQgYmluZGluZ3MuXG4gICAqXG4gICAqIEZvciBleGFtcGxlLCBnaXZlbiB0aGUgZm9sbG93aW5nIEhUTUw6XG4gICAqXG4gICAqIGBgYFxuICAgKiA8ZGl2IG1vbz1cImNhclwiIFtmb29dPVwiZXhwXCIgKGJhcik9XCJkb1N0aCgpXCI+XG4gICAqIGBgYFxuICAgKlxuICAgKiB0aGUgZ2VuZXJhdGVkIGNvZGUgaXM6XG4gICAqXG4gICAqIGBgYFxuICAgKiB2YXIgX2MxID0gWydtb28nLCAnY2FyJywgQXR0cmlidXRlTWFya2VyLkJpbmRpbmdzLCAnZm9vJywgJ2JhciddO1xuICAgKiBgYGBcbiAgICovXG4gIEJpbmRpbmdzID0gMyxcblxuICAvKipcbiAgICogU2lnbmFscyB0aGF0IHRoZSBmb2xsb3dpbmcgYXR0cmlidXRlIG5hbWVzIHdlcmUgaG9pc3RlZCBmcm9tIGFuIGlubGluZS10ZW1wbGF0ZSBkZWNsYXJhdGlvbi5cbiAgICpcbiAgICogRm9yIGV4YW1wbGUsIGdpdmVuIHRoZSBmb2xsb3dpbmcgSFRNTDpcbiAgICpcbiAgICogYGBgXG4gICAqIDxkaXYgKm5nRm9yPVwibGV0IHZhbHVlIG9mIHZhbHVlczsgdHJhY2tCeTp0cmFja0J5XCIgZGlyQSBbZGlyQl09XCJ2YWx1ZVwiPlxuICAgKiBgYGBcbiAgICpcbiAgICogdGhlIGdlbmVyYXRlZCBjb2RlIGZvciB0aGUgYHRlbXBsYXRlKClgIGluc3RydWN0aW9uIHdvdWxkIGluY2x1ZGU6XG4gICAqXG4gICAqIGBgYFxuICAgKiBbJ2RpckEnLCAnJywgQXR0cmlidXRlTWFya2VyLkJpbmRpbmdzLCAnZGlyQicsIEF0dHJpYnV0ZU1hcmtlci5UZW1wbGF0ZSwgJ25nRm9yJywgJ25nRm9yT2YnLFxuICAgKiAnbmdGb3JUcmFja0J5JywgJ2xldC12YWx1ZSddXG4gICAqIGBgYFxuICAgKlxuICAgKiB3aGlsZSB0aGUgZ2VuZXJhdGVkIGNvZGUgZm9yIHRoZSBgZWxlbWVudCgpYCBpbnN0cnVjdGlvbiBpbnNpZGUgdGhlIHRlbXBsYXRlIGZ1bmN0aW9uIHdvdWxkXG4gICAqIGluY2x1ZGU6XG4gICAqXG4gICAqIGBgYFxuICAgKiBbJ2RpckEnLCAnJywgQXR0cmlidXRlTWFya2VyLkJpbmRpbmdzLCAnZGlyQiddXG4gICAqIGBgYFxuICAgKi9cbiAgVGVtcGxhdGUgPSA0LFxuXG4gIC8qKlxuICAgKiBTaWduYWxzIHRoYXQgdGhlIGZvbGxvd2luZyBhdHRyaWJ1dGUgaXMgYG5nUHJvamVjdEFzYCBhbmQgaXRzIHZhbHVlIGlzIGEgcGFyc2VkIGBDc3NTZWxlY3RvcmAuXG4gICAqXG4gICAqIEZvciBleGFtcGxlLCBnaXZlbiB0aGUgZm9sbG93aW5nIEhUTUw6XG4gICAqXG4gICAqIGBgYFxuICAgKiA8aDEgYXR0cj1cInZhbHVlXCIgbmdQcm9qZWN0QXM9XCJbdGl0bGVdXCI+XG4gICAqIGBgYFxuICAgKlxuICAgKiB0aGUgZ2VuZXJhdGVkIGNvZGUgZm9yIHRoZSBgZWxlbWVudCgpYCBpbnN0cnVjdGlvbiB3b3VsZCBpbmNsdWRlOlxuICAgKlxuICAgKiBgYGBcbiAgICogWydhdHRyJywgJ3ZhbHVlJywgQXR0cmlidXRlTWFya2VyLlByb2plY3RBcywgWycnLCAndGl0bGUnLCAnJ11dXG4gICAqIGBgYFxuICAgKi9cbiAgUHJvamVjdEFzID0gNSxcblxuICAvKipcbiAgICogU2lnbmFscyB0aGF0IHRoZSBmb2xsb3dpbmcgYXR0cmlidXRlIHdpbGwgYmUgdHJhbnNsYXRlZCBieSBydW50aW1lIGkxOG5cbiAgICpcbiAgICogRm9yIGV4YW1wbGUsIGdpdmVuIHRoZSBmb2xsb3dpbmcgSFRNTDpcbiAgICpcbiAgICogYGBgXG4gICAqIDxkaXYgbW9vPVwiY2FyXCIgZm9vPVwidmFsdWVcIiBpMThuLWZvbyBbYmFyXT1cImJpbmRpbmdcIiBpMThuLWJhcj5cbiAgICogYGBgXG4gICAqXG4gICAqIHRoZSBnZW5lcmF0ZWQgY29kZSBpczpcbiAgICpcbiAgICogYGBgXG4gICAqIHZhciBfYzEgPSBbJ21vbycsICdjYXInLCBBdHRyaWJ1dGVNYXJrZXIuSTE4biwgJ2ZvbycsICdiYXInXTtcbiAgICovXG4gIEkxOG4gPSA2LFxufVxuXG4vKipcbiAqIEEgY29tYmluYXRpb24gb2Y6XG4gKiAtIEF0dHJpYnV0ZSBuYW1lcyBhbmQgdmFsdWVzLlxuICogLSBTcGVjaWFsIG1hcmtlcnMgYWN0aW5nIGFzIGZsYWdzIHRvIGFsdGVyIGF0dHJpYnV0ZXMgcHJvY2Vzc2luZy5cbiAqIC0gUGFyc2VkIG5nUHJvamVjdEFzIHNlbGVjdG9ycy5cbiAqL1xuZXhwb3J0IHR5cGUgVEF0dHJpYnV0ZXMgPSAoc3RyaW5nIHwgQXR0cmlidXRlTWFya2VyIHwgQ3NzU2VsZWN0b3IpW107XG5cbi8qKlxuICogQ29uc3RhbnRzIHRoYXQgYXJlIGFzc29jaWF0ZWQgd2l0aCBhIHZpZXcuIEluY2x1ZGVzOlxuICogLSBBdHRyaWJ1dGUgYXJyYXlzLlxuICogLSBMb2NhbCBkZWZpbml0aW9uIGFycmF5cy5cbiAqL1xuZXhwb3J0IHR5cGUgVENvbnN0YW50cyA9IChUQXR0cmlidXRlcyB8IHN0cmluZylbXTtcblxuLyoqXG4gKiBCaW5kaW5nIGRhdGEgKGZseXdlaWdodCkgZm9yIGEgcGFydGljdWxhciBub2RlIHRoYXQgaXMgc2hhcmVkIGJldHdlZW4gYWxsIHRlbXBsYXRlc1xuICogb2YgYSBzcGVjaWZpYyB0eXBlLlxuICpcbiAqIElmIGEgcHJvcGVydHkgaXM6XG4gKiAgICAtIFByb3BlcnR5QWxpYXNlczogdGhhdCBwcm9wZXJ0eSdzIGRhdGEgd2FzIGdlbmVyYXRlZCBhbmQgdGhpcyBpcyBpdFxuICogICAgLSBOdWxsOiB0aGF0IHByb3BlcnR5J3MgZGF0YSB3YXMgYWxyZWFkeSBnZW5lcmF0ZWQgYW5kIG5vdGhpbmcgd2FzIGZvdW5kLlxuICogICAgLSBVbmRlZmluZWQ6IHRoYXQgcHJvcGVydHkncyBkYXRhIGhhcyBub3QgeWV0IGJlZW4gZ2VuZXJhdGVkXG4gKlxuICogc2VlOiBodHRwczovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9GbHl3ZWlnaHRfcGF0dGVybiBmb3IgbW9yZSBvbiB0aGUgRmx5d2VpZ2h0IHBhdHRlcm5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBUTm9kZSB7XG4gIC8qKiBUaGUgdHlwZSBvZiB0aGUgVE5vZGUuIFNlZSBUTm9kZVR5cGUuICovXG4gIHR5cGU6IFROb2RlVHlwZTtcblxuICAvKipcbiAgICogSW5kZXggb2YgdGhlIFROb2RlIGluIFRWaWV3LmRhdGEgYW5kIGNvcnJlc3BvbmRpbmcgbmF0aXZlIGVsZW1lbnQgaW4gTFZpZXcuXG4gICAqXG4gICAqIFRoaXMgaXMgbmVjZXNzYXJ5IHRvIGdldCBmcm9tIGFueSBUTm9kZSB0byBpdHMgY29ycmVzcG9uZGluZyBuYXRpdmUgZWxlbWVudCB3aGVuXG4gICAqIHRyYXZlcnNpbmcgdGhlIG5vZGUgdHJlZS5cbiAgICpcbiAgICogSWYgaW5kZXggaXMgLTEsIHRoaXMgaXMgYSBkeW5hbWljYWxseSBjcmVhdGVkIGNvbnRhaW5lciBub2RlIG9yIGVtYmVkZGVkIHZpZXcgbm9kZS5cbiAgICovXG4gIGluZGV4OiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIFRoZSBpbmRleCBvZiB0aGUgY2xvc2VzdCBpbmplY3RvciBpbiB0aGlzIG5vZGUncyBMVmlldy5cbiAgICpcbiAgICogSWYgdGhlIGluZGV4ID09PSAtMSwgdGhlcmUgaXMgbm8gaW5qZWN0b3Igb24gdGhpcyBub2RlIG9yIGFueSBhbmNlc3RvciBub2RlIGluIHRoaXMgdmlldy5cbiAgICpcbiAgICogSWYgdGhlIGluZGV4ICE9PSAtMSwgaXQgaXMgdGhlIGluZGV4IG9mIHRoaXMgbm9kZSdzIGluamVjdG9yIE9SIHRoZSBpbmRleCBvZiBhIHBhcmVudCBpbmplY3RvclxuICAgKiBpbiB0aGUgc2FtZSB2aWV3LiBXZSBwYXNzIHRoZSBwYXJlbnQgaW5qZWN0b3IgaW5kZXggZG93biB0aGUgbm9kZSB0cmVlIG9mIGEgdmlldyBzbyBpdCdzXG4gICAqIHBvc3NpYmxlIHRvIGZpbmQgdGhlIHBhcmVudCBpbmplY3RvciB3aXRob3V0IHdhbGtpbmcgYSBwb3RlbnRpYWxseSBkZWVwIG5vZGUgdHJlZS4gSW5qZWN0b3JcbiAgICogaW5kaWNlcyBhcmUgbm90IHNldCBhY3Jvc3MgdmlldyBib3VuZGFyaWVzIGJlY2F1c2UgdGhlcmUgY291bGQgYmUgbXVsdGlwbGUgY29tcG9uZW50IGhvc3RzLlxuICAgKlxuICAgKiBJZiB0Tm9kZS5pbmplY3RvckluZGV4ID09PSB0Tm9kZS5wYXJlbnQuaW5qZWN0b3JJbmRleCwgdGhlbiB0aGUgaW5kZXggYmVsb25ncyB0byBhIHBhcmVudFxuICAgKiBpbmplY3Rvci5cbiAgICovXG4gIGluamVjdG9ySW5kZXg6IG51bWJlcjtcblxuICAvKipcbiAgICogU3RvcmVzIHN0YXJ0aW5nIGluZGV4IG9mIHRoZSBkaXJlY3RpdmVzLlxuICAgKi9cbiAgZGlyZWN0aXZlU3RhcnQ6IG51bWJlcjtcblxuICAvKipcbiAgICogU3RvcmVzIGZpbmFsIGV4Y2x1c2l2ZSBpbmRleCBvZiB0aGUgZGlyZWN0aXZlcy5cbiAgICovXG4gIGRpcmVjdGl2ZUVuZDogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBTdG9yZXMgaW5kZXhlcyBvZiBwcm9wZXJ0eSBiaW5kaW5ncy4gVGhpcyBmaWVsZCBpcyBvbmx5IHNldCBpbiB0aGUgbmdEZXZNb2RlIGFuZCBob2xkcyBpbmRleGVzXG4gICAqIG9mIHByb3BlcnR5IGJpbmRpbmdzIHNvIFRlc3RCZWQgY2FuIGdldCBib3VuZCBwcm9wZXJ0eSBtZXRhZGF0YSBmb3IgYSBnaXZlbiBub2RlLlxuICAgKi9cbiAgcHJvcGVydHlCaW5kaW5nczogbnVtYmVyW118bnVsbDtcblxuICAvKipcbiAgICogU3RvcmVzIGlmIE5vZGUgaXNDb21wb25lbnQsIGlzUHJvamVjdGVkLCBoYXNDb250ZW50UXVlcnksIGhhc0NsYXNzSW5wdXQgYW5kIGhhc1N0eWxlSW5wdXQgZXRjLlxuICAgKi9cbiAgZmxhZ3M6IFROb2RlRmxhZ3M7XG5cbiAgLyoqXG4gICAqIFRoaXMgbnVtYmVyIHN0b3JlcyB0d28gdmFsdWVzIHVzaW5nIGl0cyBiaXRzOlxuICAgKlxuICAgKiAtIHRoZSBpbmRleCBvZiB0aGUgZmlyc3QgcHJvdmlkZXIgb24gdGhhdCBub2RlIChmaXJzdCAxNiBiaXRzKVxuICAgKiAtIHRoZSBjb3VudCBvZiB2aWV3IHByb3ZpZGVycyBmcm9tIHRoZSBjb21wb25lbnQgb24gdGhpcyBub2RlIChsYXN0IDE2IGJpdHMpXG4gICAqL1xuICAvLyBUT0RPKG1pc2tvKTogYnJlYWsgdGhpcyBpbnRvIGFjdHVhbCB2YXJzLlxuICBwcm92aWRlckluZGV4ZXM6IFROb2RlUHJvdmlkZXJJbmRleGVzO1xuXG4gIC8qKiBUaGUgdGFnIG5hbWUgYXNzb2NpYXRlZCB3aXRoIHRoaXMgbm9kZS4gKi9cbiAgdGFnTmFtZTogc3RyaW5nfG51bGw7XG5cbiAgLyoqXG4gICAqIEF0dHJpYnV0ZXMgYXNzb2NpYXRlZCB3aXRoIGFuIGVsZW1lbnQuIFdlIG5lZWQgdG8gc3RvcmUgYXR0cmlidXRlcyB0byBzdXBwb3J0IHZhcmlvdXMgdXNlLWNhc2VzXG4gICAqIChhdHRyaWJ1dGUgaW5qZWN0aW9uLCBjb250ZW50IHByb2plY3Rpb24gd2l0aCBzZWxlY3RvcnMsIGRpcmVjdGl2ZXMgbWF0Y2hpbmcpLlxuICAgKiBBdHRyaWJ1dGVzIGFyZSBzdG9yZWQgc3RhdGljYWxseSBiZWNhdXNlIHJlYWRpbmcgdGhlbSBmcm9tIHRoZSBET00gd291bGQgYmUgd2F5IHRvbyBzbG93IGZvclxuICAgKiBjb250ZW50IHByb2plY3Rpb24gYW5kIHF1ZXJpZXMuXG4gICAqXG4gICAqIFNpbmNlIGF0dHJzIHdpbGwgYWx3YXlzIGJlIGNhbGN1bGF0ZWQgZmlyc3QsIHRoZXkgd2lsbCBuZXZlciBuZWVkIHRvIGJlIG1hcmtlZCB1bmRlZmluZWQgYnlcbiAgICogb3RoZXIgaW5zdHJ1Y3Rpb25zLlxuICAgKlxuICAgKiBGb3IgcmVndWxhciBhdHRyaWJ1dGVzIGEgbmFtZSBvZiBhbiBhdHRyaWJ1dGUgYW5kIGl0cyB2YWx1ZSBhbHRlcm5hdGUgaW4gdGhlIGFycmF5LlxuICAgKiBlLmcuIFsncm9sZScsICdjaGVja2JveCddXG4gICAqIFRoaXMgYXJyYXkgY2FuIGNvbnRhaW4gZmxhZ3MgdGhhdCB3aWxsIGluZGljYXRlIFwic3BlY2lhbCBhdHRyaWJ1dGVzXCIgKGF0dHJpYnV0ZXMgd2l0aFxuICAgKiBuYW1lc3BhY2VzLCBhdHRyaWJ1dGVzIGV4dHJhY3RlZCBmcm9tIGJpbmRpbmdzIGFuZCBvdXRwdXRzKS5cbiAgICovXG4gIGF0dHJzOiBUQXR0cmlidXRlc3xudWxsO1xuXG4gIC8qKlxuICAgKiBBIHNldCBvZiBsb2NhbCBuYW1lcyB1bmRlciB3aGljaCBhIGdpdmVuIGVsZW1lbnQgaXMgZXhwb3J0ZWQgaW4gYSB0ZW1wbGF0ZSBhbmRcbiAgICogdmlzaWJsZSB0byBxdWVyaWVzLiBBbiBlbnRyeSBpbiB0aGlzIGFycmF5IGNhbiBiZSBjcmVhdGVkIGZvciBkaWZmZXJlbnQgcmVhc29uczpcbiAgICogLSBhbiBlbGVtZW50IGl0c2VsZiBpcyByZWZlcmVuY2VkLCBleC46IGA8ZGl2ICNmb28+YFxuICAgKiAtIGEgY29tcG9uZW50IGlzIHJlZmVyZW5jZWQsIGV4LjogYDxteS1jbXB0ICNmb28+YFxuICAgKiAtIGEgZGlyZWN0aXZlIGlzIHJlZmVyZW5jZWQsIGV4LjogYDxteS1jbXB0ICNmb289XCJkaXJlY3RpdmVFeHBvcnRBc1wiPmAuXG4gICAqXG4gICAqIEEgZ2l2ZW4gZWxlbWVudCBtaWdodCBoYXZlIGRpZmZlcmVudCBsb2NhbCBuYW1lcyBhbmQgdGhvc2UgbmFtZXMgY2FuIGJlIGFzc29jaWF0ZWRcbiAgICogd2l0aCBhIGRpcmVjdGl2ZS4gV2Ugc3RvcmUgbG9jYWwgbmFtZXMgYXQgZXZlbiBpbmRleGVzIHdoaWxlIG9kZCBpbmRleGVzIGFyZSByZXNlcnZlZFxuICAgKiBmb3IgZGlyZWN0aXZlIGluZGV4IGluIGEgdmlldyAob3IgYC0xYCBpZiB0aGVyZSBpcyBubyBhc3NvY2lhdGVkIGRpcmVjdGl2ZSkuXG4gICAqXG4gICAqIFNvbWUgZXhhbXBsZXM6XG4gICAqIC0gYDxkaXYgI2Zvbz5gID0+IGBbXCJmb29cIiwgLTFdYFxuICAgKiAtIGA8bXktY21wdCAjZm9vPmAgPT4gYFtcImZvb1wiLCBteUNtcHRJZHhdYFxuICAgKiAtIGA8bXktY21wdCAjZm9vICNiYXI9XCJkaXJlY3RpdmVFeHBvcnRBc1wiPmAgPT4gYFtcImZvb1wiLCBteUNtcHRJZHgsIFwiYmFyXCIsIGRpcmVjdGl2ZUlkeF1gXG4gICAqIC0gYDxkaXYgI2ZvbyAjYmFyPVwiZGlyZWN0aXZlRXhwb3J0QXNcIj5gID0+IGBbXCJmb29cIiwgLTEsIFwiYmFyXCIsIGRpcmVjdGl2ZUlkeF1gXG4gICAqL1xuICBsb2NhbE5hbWVzOiAoc3RyaW5nfG51bWJlcilbXXxudWxsO1xuXG4gIC8qKiBJbmZvcm1hdGlvbiBhYm91dCBpbnB1dCBwcm9wZXJ0aWVzIHRoYXQgbmVlZCB0byBiZSBzZXQgb25jZSBmcm9tIGF0dHJpYnV0ZSBkYXRhLiAqL1xuICBpbml0aWFsSW5wdXRzOiBJbml0aWFsSW5wdXREYXRhfG51bGx8dW5kZWZpbmVkO1xuXG4gIC8qKlxuICAgKiBJbnB1dCBkYXRhIGZvciBhbGwgZGlyZWN0aXZlcyBvbiB0aGlzIG5vZGUuIGBudWxsYCBtZWFucyB0aGF0IHRoZXJlIGFyZSBubyBkaXJlY3RpdmVzIHdpdGhcbiAgICogaW5wdXRzIG9uIHRoaXMgbm9kZS5cbiAgICovXG4gIGlucHV0czogUHJvcGVydHlBbGlhc2VzfG51bGw7XG5cbiAgLyoqXG4gICAqIE91dHB1dCBkYXRhIGZvciBhbGwgZGlyZWN0aXZlcyBvbiB0aGlzIG5vZGUuIGBudWxsYCBtZWFucyB0aGF0IHRoZXJlIGFyZSBubyBkaXJlY3RpdmVzIHdpdGhcbiAgICogb3V0cHV0cyBvbiB0aGlzIG5vZGUuXG4gICAqL1xuICBvdXRwdXRzOiBQcm9wZXJ0eUFsaWFzZXN8bnVsbDtcblxuICAvKipcbiAgICogVGhlIFRWaWV3IG9yIFRWaWV3cyBhdHRhY2hlZCB0byB0aGlzIG5vZGUuXG4gICAqXG4gICAqIElmIHRoaXMgVE5vZGUgY29ycmVzcG9uZHMgdG8gYW4gTENvbnRhaW5lciB3aXRoIGlubGluZSB2aWV3cywgdGhlIGNvbnRhaW5lciB3aWxsXG4gICAqIG5lZWQgdG8gc3RvcmUgc2VwYXJhdGUgc3RhdGljIGRhdGEgZm9yIGVhY2ggb2YgaXRzIHZpZXcgYmxvY2tzIChUVmlld1tdKS4gT3RoZXJ3aXNlLFxuICAgKiBub2RlcyBpbiBpbmxpbmUgdmlld3Mgd2l0aCB0aGUgc2FtZSBpbmRleCBhcyBub2RlcyBpbiB0aGVpciBwYXJlbnQgdmlld3Mgd2lsbCBvdmVyd3JpdGVcbiAgICogZWFjaCBvdGhlciwgYXMgdGhleSBhcmUgaW4gdGhlIHNhbWUgdGVtcGxhdGUuXG4gICAqXG4gICAqIEVhY2ggaW5kZXggaW4gdGhpcyBhcnJheSBjb3JyZXNwb25kcyB0byB0aGUgc3RhdGljIGRhdGEgZm9yIGEgY2VydGFpblxuICAgKiB2aWV3LiBTbyBpZiB5b3UgaGFkIFYoMCkgYW5kIFYoMSkgaW4gYSBjb250YWluZXIsIHlvdSBtaWdodCBoYXZlOlxuICAgKlxuICAgKiBbXG4gICAqICAgW3t0YWdOYW1lOiAnZGl2JywgYXR0cnM6IC4uLn0sIG51bGxdLCAgICAgLy8gVigwKSBUVmlld1xuICAgKiAgIFt7dGFnTmFtZTogJ2J1dHRvbicsIGF0dHJzIC4uLn0sIG51bGxdICAgIC8vIFYoMSkgVFZpZXdcbiAgICpcbiAgICogSWYgdGhpcyBUTm9kZSBjb3JyZXNwb25kcyB0byBhbiBMQ29udGFpbmVyIHdpdGggYSB0ZW1wbGF0ZSAoZS5nLiBzdHJ1Y3R1cmFsXG4gICAqIGRpcmVjdGl2ZSksIHRoZSB0ZW1wbGF0ZSdzIFRWaWV3IHdpbGwgYmUgc3RvcmVkIGhlcmUuXG4gICAqXG4gICAqIElmIHRoaXMgVE5vZGUgY29ycmVzcG9uZHMgdG8gYW4gZWxlbWVudCwgdFZpZXdzIHdpbGwgYmUgbnVsbCAuXG4gICAqL1xuICB0Vmlld3M6IFRWaWV3fFRWaWV3W118bnVsbDtcblxuICAvKipcbiAgICogVGhlIG5leHQgc2libGluZyBub2RlLiBOZWNlc3Nhcnkgc28gd2UgY2FuIHByb3BhZ2F0ZSB0aHJvdWdoIHRoZSByb290IG5vZGVzIG9mIGEgdmlld1xuICAgKiB0byBpbnNlcnQgdGhlbSBvciByZW1vdmUgdGhlbSBmcm9tIHRoZSBET00uXG4gICAqL1xuICBuZXh0OiBUTm9kZXxudWxsO1xuXG4gIC8qKlxuICAgKiBUaGUgbmV4dCBwcm9qZWN0ZWQgc2libGluZy4gU2luY2UgaW4gQW5ndWxhciBjb250ZW50IHByb2plY3Rpb24gd29ya3Mgb24gdGhlIG5vZGUtYnktbm9kZSBiYXNpc1xuICAgKiB0aGUgYWN0IG9mIHByb2plY3Rpbmcgbm9kZXMgbWlnaHQgY2hhbmdlIG5vZGVzIHJlbGF0aW9uc2hpcCBhdCB0aGUgaW5zZXJ0aW9uIHBvaW50ICh0YXJnZXRcbiAgICogdmlldykuIEF0IHRoZSBzYW1lIHRpbWUgd2UgbmVlZCB0byBrZWVwIGluaXRpYWwgcmVsYXRpb25zaGlwIGJldHdlZW4gbm9kZXMgYXMgZXhwcmVzc2VkIGluXG4gICAqIGNvbnRlbnQgdmlldy5cbiAgICovXG4gIHByb2plY3Rpb25OZXh0OiBUTm9kZXxudWxsO1xuXG4gIC8qKlxuICAgKiBGaXJzdCBjaGlsZCBvZiB0aGUgY3VycmVudCBub2RlLlxuICAgKlxuICAgKiBGb3IgY29tcG9uZW50IG5vZGVzLCB0aGUgY2hpbGQgd2lsbCBhbHdheXMgYmUgYSBDb250ZW50Q2hpbGQgKGluIHNhbWUgdmlldykuXG4gICAqIEZvciBlbWJlZGRlZCB2aWV3IG5vZGVzLCB0aGUgY2hpbGQgd2lsbCBiZSBpbiB0aGVpciBjaGlsZCB2aWV3LlxuICAgKi9cbiAgY2hpbGQ6IFROb2RlfG51bGw7XG5cbiAgLyoqXG4gICAqIFBhcmVudCBub2RlIChpbiB0aGUgc2FtZSB2aWV3IG9ubHkpLlxuICAgKlxuICAgKiBXZSBuZWVkIGEgcmVmZXJlbmNlIHRvIGEgbm9kZSdzIHBhcmVudCBzbyB3ZSBjYW4gYXBwZW5kIHRoZSBub2RlIHRvIGl0cyBwYXJlbnQncyBuYXRpdmVcbiAgICogZWxlbWVudCBhdCB0aGUgYXBwcm9wcmlhdGUgdGltZS5cbiAgICpcbiAgICogSWYgdGhlIHBhcmVudCB3b3VsZCBiZSBpbiBhIGRpZmZlcmVudCB2aWV3IChlLmcuIGNvbXBvbmVudCBob3N0KSwgdGhpcyBwcm9wZXJ0eSB3aWxsIGJlIG51bGwuXG4gICAqIEl0J3MgaW1wb3J0YW50IHRoYXQgd2UgZG9uJ3QgdHJ5IHRvIGNyb3NzIGNvbXBvbmVudCBib3VuZGFyaWVzIHdoZW4gcmV0cmlldmluZyB0aGUgcGFyZW50XG4gICAqIGJlY2F1c2UgdGhlIHBhcmVudCB3aWxsIGNoYW5nZSAoZS5nLiBpbmRleCwgYXR0cnMpIGRlcGVuZGluZyBvbiB3aGVyZSB0aGUgY29tcG9uZW50IHdhc1xuICAgKiB1c2VkIChhbmQgdGh1cyBzaG91bGRuJ3QgYmUgc3RvcmVkIG9uIFROb2RlKS4gSW4gdGhlc2UgY2FzZXMsIHdlIHJldHJpZXZlIHRoZSBwYXJlbnQgdGhyb3VnaFxuICAgKiBMVmlldy5ub2RlIGluc3RlYWQgKHdoaWNoIHdpbGwgYmUgaW5zdGFuY2Utc3BlY2lmaWMpLlxuICAgKlxuICAgKiBJZiB0aGlzIGlzIGFuIGlubGluZSB2aWV3IG5vZGUgKFYpLCB0aGUgcGFyZW50IHdpbGwgYmUgaXRzIGNvbnRhaW5lci5cbiAgICovXG4gIHBhcmVudDogVEVsZW1lbnROb2RlfFRDb250YWluZXJOb2RlfG51bGw7XG5cbiAgLyoqXG4gICAqIExpc3Qgb2YgcHJvamVjdGVkIFROb2RlcyBmb3IgYSBnaXZlbiBjb21wb25lbnQgaG9zdCBlbGVtZW50IE9SIGluZGV4IGludG8gdGhlIHNhaWQgbm9kZXMuXG4gICAqXG4gICAqIEZvciBlYXNpZXIgZGlzY3Vzc2lvbiBhc3N1bWUgdGhpcyBleGFtcGxlOlxuICAgKiBgPHBhcmVudD5gJ3MgdmlldyBkZWZpbml0aW9uOlxuICAgKiBgYGBcbiAgICogPGNoaWxkIGlkPVwiYzFcIj5jb250ZW50MTwvY2hpbGQ+XG4gICAqIDxjaGlsZCBpZD1cImMyXCI+PHNwYW4+Y29udGVudDI8L3NwYW4+PC9jaGlsZD5cbiAgICogYGBgXG4gICAqIGA8Y2hpbGQ+YCdzIHZpZXcgZGVmaW5pdGlvbjpcbiAgICogYGBgXG4gICAqIDxuZy1jb250ZW50IGlkPVwiY29udDFcIj48L25nLWNvbnRlbnQ+XG4gICAqIGBgYFxuICAgKlxuICAgKiBJZiBgQXJyYXkuaXNBcnJheShwcm9qZWN0aW9uKWAgdGhlbiBgVE5vZGVgIGlzIGEgaG9zdCBlbGVtZW50OlxuICAgKiAtIGBwcm9qZWN0aW9uYCBzdG9yZXMgdGhlIGNvbnRlbnQgbm9kZXMgd2hpY2ggYXJlIHRvIGJlIHByb2plY3RlZC5cbiAgICogICAgLSBUaGUgbm9kZXMgcmVwcmVzZW50IGNhdGVnb3JpZXMgZGVmaW5lZCBieSB0aGUgc2VsZWN0b3I6IEZvciBleGFtcGxlOlxuICAgKiAgICAgIGA8bmctY29udGVudC8+PG5nLWNvbnRlbnQgc2VsZWN0PVwiYWJjXCIvPmAgd291bGQgcmVwcmVzZW50IHRoZSBoZWFkcyBmb3IgYDxuZy1jb250ZW50Lz5gXG4gICAqICAgICAgYW5kIGA8bmctY29udGVudCBzZWxlY3Q9XCJhYmNcIi8+YCByZXNwZWN0aXZlbHkuXG4gICAqICAgIC0gVGhlIG5vZGVzIHdlIHN0b3JlIGluIGBwcm9qZWN0aW9uYCBhcmUgaGVhZHMgb25seSwgd2UgdXNlZCBgLm5leHRgIHRvIGdldCB0aGVpclxuICAgKiAgICAgIHNpYmxpbmdzLlxuICAgKiAgICAtIFRoZSBub2RlcyBgLm5leHRgIGlzIHNvcnRlZC9yZXdyaXR0ZW4gYXMgcGFydCBvZiB0aGUgcHJvamVjdGlvbiBzZXR1cC5cbiAgICogICAgLSBgcHJvamVjdGlvbmAgc2l6ZSBpcyBlcXVhbCB0byB0aGUgbnVtYmVyIG9mIHByb2plY3Rpb25zIGA8bmctY29udGVudD5gLiBUaGUgc2l6ZSBvZlxuICAgKiAgICAgIGBjMWAgd2lsbCBiZSBgMWAgYmVjYXVzZSBgPGNoaWxkPmAgaGFzIG9ubHkgb25lIGA8bmctY29udGVudD5gLlxuICAgKiAtIHdlIHN0b3JlIGBwcm9qZWN0aW9uYCB3aXRoIHRoZSBob3N0IChgYzFgLCBgYzJgKSByYXRoZXIgdGhhbiB0aGUgYDxuZy1jb250ZW50PmAgKGBjb250MWApXG4gICAqICAgYmVjYXVzZSB0aGUgc2FtZSBjb21wb25lbnQgKGA8Y2hpbGQ+YCkgY2FuIGJlIHVzZWQgaW4gbXVsdGlwbGUgbG9jYXRpb25zIChgYzFgLCBgYzJgKSBhbmQgYXNcbiAgICogICBhIHJlc3VsdCBoYXZlIGRpZmZlcmVudCBzZXQgb2Ygbm9kZXMgdG8gcHJvamVjdC5cbiAgICogLSB3aXRob3V0IGBwcm9qZWN0aW9uYCBpdCB3b3VsZCBiZSBkaWZmaWN1bHQgdG8gZWZmaWNpZW50bHkgdHJhdmVyc2Ugbm9kZXMgdG8gYmUgcHJvamVjdGVkLlxuICAgKlxuICAgKiBJZiBgdHlwZW9mIHByb2plY3Rpb24gPT0gJ251bWJlcidgIHRoZW4gYFROb2RlYCBpcyBhIGA8bmctY29udGVudD5gIGVsZW1lbnQ6XG4gICAqIC0gYHByb2plY3Rpb25gIGlzIGFuIGluZGV4IG9mIHRoZSBob3N0J3MgYHByb2plY3Rpb25gTm9kZXMuXG4gICAqICAgLSBUaGlzIHdvdWxkIHJldHVybiB0aGUgZmlyc3QgaGVhZCBub2RlIHRvIHByb2plY3Q6XG4gICAqICAgICBgZ2V0SG9zdChjdXJyZW50VE5vZGUpLnByb2plY3Rpb25bY3VycmVudFROb2RlLnByb2plY3Rpb25dYC5cbiAgICogLSBXaGVuIHByb2plY3Rpbmcgbm9kZXMgdGhlIHBhcmVudCBub2RlIHJldHJpZXZlZCBtYXkgYmUgYSBgPG5nLWNvbnRlbnQ+YCBub2RlLCBpbiB3aGljaCBjYXNlXG4gICAqICAgdGhlIHByb2Nlc3MgaXMgcmVjdXJzaXZlIGluIG5hdHVyZS5cbiAgICpcbiAgICogSWYgYHByb2plY3Rpb25gIGlzIG9mIHR5cGUgYFJOb2RlW11bXWAgdGhhbiB3ZSBoYXZlIGEgY29sbGVjdGlvbiBvZiBuYXRpdmUgbm9kZXMgcGFzc2VkIGFzXG4gICAqIHByb2plY3RhYmxlIG5vZGVzIGR1cmluZyBkeW5hbWljIGNvbXBvbmVudCBjcmVhdGlvbi5cbiAgICovXG4gIHByb2plY3Rpb246IChUTm9kZXxSTm9kZVtdKVtdfG51bWJlcnxudWxsO1xuXG4gIC8qKlxuICAgKiBBIGNvbGxlY3Rpb24gb2YgYWxsIHN0eWxlIGJpbmRpbmdzIGFuZC9vciBzdGF0aWMgc3R5bGUgdmFsdWVzIGZvciBhbiBlbGVtZW50LlxuICAgKlxuICAgKiBUaGlzIGZpZWxkIHdpbGwgYmUgcG9wdWxhdGVkIGlmIGFuZCB3aGVuOlxuICAgKlxuICAgKiAtIFRoZXJlIGFyZSBvbmUgb3IgbW9yZSBpbml0aWFsIHN0eWxlcyBvbiBhbiBlbGVtZW50IChlLmcuIGA8ZGl2IHN0eWxlPVwid2lkdGg6MjAwcHhcIj5gKVxuICAgKiAtIFRoZXJlIGFyZSBvbmUgb3IgbW9yZSBzdHlsZSBiaW5kaW5ncyBvbiBhbiBlbGVtZW50IChlLmcuIGA8ZGl2IFtzdHlsZS53aWR0aF09XCJ3XCI+YClcbiAgICpcbiAgICogSWYgYW5kIHdoZW4gdGhlcmUgYXJlIG9ubHkgaW5pdGlhbCBzdHlsZXMgKG5vIGJpbmRpbmdzKSB0aGVuIGFuIGluc3RhbmNlIG9mIGBTdHlsaW5nTWFwQXJyYXlgXG4gICAqIHdpbGwgYmUgdXNlZCBoZXJlLiBPdGhlcndpc2UgYW4gaW5zdGFuY2Ugb2YgYFRTdHlsaW5nQ29udGV4dGAgd2lsbCBiZSBjcmVhdGVkIHdoZW4gdGhlcmVcbiAgICogYXJlIG9uZSBvciBtb3JlIHN0eWxlIGJpbmRpbmdzIG9uIGFuIGVsZW1lbnQuXG4gICAqXG4gICAqIER1cmluZyBlbGVtZW50IGNyZWF0aW9uIHRoaXMgdmFsdWUgaXMgbGlrZWx5IHRvIGJlIHBvcHVsYXRlZCB3aXRoIGFuIGluc3RhbmNlIG9mXG4gICAqIGBTdHlsaW5nTWFwQXJyYXlgIGFuZCBvbmx5IHdoZW4gdGhlIGJpbmRpbmdzIGFyZSBldmFsdWF0ZWQgKHdoaWNoIGhhcHBlbnMgZHVyaW5nXG4gICAqIHVwZGF0ZSBtb2RlKSB0aGVuIGl0IHdpbGwgYmUgY29udmVydGVkIHRvIGEgYFRTdHlsaW5nQ29udGV4dGAgaWYgYW55IHN0eWxlIGJpbmRpbmdzXG4gICAqIGFyZSBlbmNvdW50ZXJlZC4gSWYgYW5kIHdoZW4gdGhpcyBoYXBwZW5zIHRoZW4gdGhlIGV4aXN0aW5nIGBTdHlsaW5nTWFwQXJyYXlgIHZhbHVlXG4gICAqIHdpbGwgYmUgcGxhY2VkIGludG8gdGhlIGluaXRpYWwgc3R5bGluZyBzbG90IGluIHRoZSBuZXdseSBjcmVhdGVkIGBUU3R5bGluZ0NvbnRleHRgLlxuICAgKi9cbiAgc3R5bGVzOiBTdHlsaW5nTWFwQXJyYXl8VFN0eWxpbmdDb250ZXh0fG51bGw7XG5cbiAgLyoqXG4gICAqIEEgY29sbGVjdGlvbiBvZiBhbGwgY2xhc3MgYmluZGluZ3MgYW5kL29yIHN0YXRpYyBjbGFzcyB2YWx1ZXMgZm9yIGFuIGVsZW1lbnQuXG4gICAqXG4gICAqIFRoaXMgZmllbGQgd2lsbCBiZSBwb3B1bGF0ZWQgaWYgYW5kIHdoZW46XG4gICAqXG4gICAqIC0gVGhlcmUgYXJlIG9uZSBvciBtb3JlIGluaXRpYWwgY2xhc3NlcyBvbiBhbiBlbGVtZW50IChlLmcuIGA8ZGl2IGNsYXNzPVwib25lIHR3byB0aHJlZVwiPmApXG4gICAqIC0gVGhlcmUgYXJlIG9uZSBvciBtb3JlIGNsYXNzIGJpbmRpbmdzIG9uIGFuIGVsZW1lbnQgKGUuZy4gYDxkaXYgW2NsYXNzLmZvb109XCJmXCI+YClcbiAgICpcbiAgICogSWYgYW5kIHdoZW4gdGhlcmUgYXJlIG9ubHkgaW5pdGlhbCBjbGFzc2VzIChubyBiaW5kaW5ncykgdGhlbiBhbiBpbnN0YW5jZSBvZiBgU3R5bGluZ01hcEFycmF5YFxuICAgKiB3aWxsIGJlIHVzZWQgaGVyZS4gT3RoZXJ3aXNlIGFuIGluc3RhbmNlIG9mIGBUU3R5bGluZ0NvbnRleHRgIHdpbGwgYmUgY3JlYXRlZCB3aGVuIHRoZXJlXG4gICAqIGFyZSBvbmUgb3IgbW9yZSBjbGFzcyBiaW5kaW5ncyBvbiBhbiBlbGVtZW50LlxuICAgKlxuICAgKiBEdXJpbmcgZWxlbWVudCBjcmVhdGlvbiB0aGlzIHZhbHVlIGlzIGxpa2VseSB0byBiZSBwb3B1bGF0ZWQgd2l0aCBhbiBpbnN0YW5jZSBvZlxuICAgKiBgU3R5bGluZ01hcEFycmF5YCBhbmQgb25seSB3aGVuIHRoZSBiaW5kaW5ncyBhcmUgZXZhbHVhdGVkICh3aGljaCBoYXBwZW5zIGR1cmluZ1xuICAgKiB1cGRhdGUgbW9kZSkgdGhlbiBpdCB3aWxsIGJlIGNvbnZlcnRlZCB0byBhIGBUU3R5bGluZ0NvbnRleHRgIGlmIGFueSBjbGFzcyBiaW5kaW5nc1xuICAgKiBhcmUgZW5jb3VudGVyZWQuIElmIGFuZCB3aGVuIHRoaXMgaGFwcGVucyB0aGVuIHRoZSBleGlzdGluZyBgU3R5bGluZ01hcEFycmF5YCB2YWx1ZVxuICAgKiB3aWxsIGJlIHBsYWNlZCBpbnRvIHRoZSBpbml0aWFsIHN0eWxpbmcgc2xvdCBpbiB0aGUgbmV3bHkgY3JlYXRlZCBgVFN0eWxpbmdDb250ZXh0YC5cbiAgICovXG4gIGNsYXNzZXM6IFN0eWxpbmdNYXBBcnJheXxUU3R5bGluZ0NvbnRleHR8bnVsbDtcbn1cblxuLyoqIFN0YXRpYyBkYXRhIGZvciBhbiBlbGVtZW50ICAqL1xuZXhwb3J0IGludGVyZmFjZSBURWxlbWVudE5vZGUgZXh0ZW5kcyBUTm9kZSB7XG4gIC8qKiBJbmRleCBpbiB0aGUgZGF0YVtdIGFycmF5ICovXG4gIGluZGV4OiBudW1iZXI7XG4gIGNoaWxkOiBURWxlbWVudE5vZGV8VFRleHROb2RlfFRFbGVtZW50Q29udGFpbmVyTm9kZXxUQ29udGFpbmVyTm9kZXxUUHJvamVjdGlvbk5vZGV8bnVsbDtcbiAgLyoqXG4gICAqIEVsZW1lbnQgbm9kZXMgd2lsbCBoYXZlIHBhcmVudHMgdW5sZXNzIHRoZXkgYXJlIHRoZSBmaXJzdCBub2RlIG9mIGEgY29tcG9uZW50IG9yXG4gICAqIGVtYmVkZGVkIHZpZXcgKHdoaWNoIG1lYW5zIHRoZWlyIHBhcmVudCBpcyBpbiBhIGRpZmZlcmVudCB2aWV3IGFuZCBtdXN0IGJlXG4gICAqIHJldHJpZXZlZCB1c2luZyB2aWV3RGF0YVtIT1NUX05PREVdKS5cbiAgICovXG4gIHBhcmVudDogVEVsZW1lbnROb2RlfFRFbGVtZW50Q29udGFpbmVyTm9kZXxudWxsO1xuICB0Vmlld3M6IG51bGw7XG5cbiAgLyoqXG4gICAqIElmIHRoaXMgaXMgYSBjb21wb25lbnQgVE5vZGUgd2l0aCBwcm9qZWN0aW9uLCB0aGlzIHdpbGwgYmUgYW4gYXJyYXkgb2YgcHJvamVjdGVkXG4gICAqIFROb2RlcyBvciBuYXRpdmUgbm9kZXMgKHNlZSBUTm9kZS5wcm9qZWN0aW9uIGZvciBtb3JlIGluZm8pLiBJZiBpdCdzIGEgcmVndWxhciBlbGVtZW50IG5vZGUgb3JcbiAgICogYSBjb21wb25lbnQgd2l0aG91dCBwcm9qZWN0aW9uLCBpdCB3aWxsIGJlIG51bGwuXG4gICAqL1xuICBwcm9qZWN0aW9uOiAoVE5vZGV8Uk5vZGVbXSlbXXxudWxsO1xufVxuXG4vKiogU3RhdGljIGRhdGEgZm9yIGEgdGV4dCBub2RlICovXG5leHBvcnQgaW50ZXJmYWNlIFRUZXh0Tm9kZSBleHRlbmRzIFROb2RlIHtcbiAgLyoqIEluZGV4IGluIHRoZSBkYXRhW10gYXJyYXkgKi9cbiAgaW5kZXg6IG51bWJlcjtcbiAgY2hpbGQ6IG51bGw7XG4gIC8qKlxuICAgKiBUZXh0IG5vZGVzIHdpbGwgaGF2ZSBwYXJlbnRzIHVubGVzcyB0aGV5IGFyZSB0aGUgZmlyc3Qgbm9kZSBvZiBhIGNvbXBvbmVudCBvclxuICAgKiBlbWJlZGRlZCB2aWV3ICh3aGljaCBtZWFucyB0aGVpciBwYXJlbnQgaXMgaW4gYSBkaWZmZXJlbnQgdmlldyBhbmQgbXVzdCBiZVxuICAgKiByZXRyaWV2ZWQgdXNpbmcgTFZpZXcubm9kZSkuXG4gICAqL1xuICBwYXJlbnQ6IFRFbGVtZW50Tm9kZXxURWxlbWVudENvbnRhaW5lck5vZGV8bnVsbDtcbiAgdFZpZXdzOiBudWxsO1xuICBwcm9qZWN0aW9uOiBudWxsO1xufVxuXG4vKiogU3RhdGljIGRhdGEgZm9yIGFuIExDb250YWluZXIgKi9cbmV4cG9ydCBpbnRlcmZhY2UgVENvbnRhaW5lck5vZGUgZXh0ZW5kcyBUTm9kZSB7XG4gIC8qKlxuICAgKiBJbmRleCBpbiB0aGUgZGF0YVtdIGFycmF5LlxuICAgKlxuICAgKiBJZiBpdCdzIC0xLCB0aGlzIGlzIGEgZHluYW1pY2FsbHkgY3JlYXRlZCBjb250YWluZXIgbm9kZSB0aGF0IGlzbid0IHN0b3JlZCBpblxuICAgKiBkYXRhW10gKGUuZy4gd2hlbiB5b3UgaW5qZWN0IFZpZXdDb250YWluZXJSZWYpIC5cbiAgICovXG4gIGluZGV4OiBudW1iZXI7XG4gIGNoaWxkOiBudWxsO1xuXG4gIC8qKlxuICAgKiBDb250YWluZXIgbm9kZXMgd2lsbCBoYXZlIHBhcmVudHMgdW5sZXNzOlxuICAgKlxuICAgKiAtIFRoZXkgYXJlIHRoZSBmaXJzdCBub2RlIG9mIGEgY29tcG9uZW50IG9yIGVtYmVkZGVkIHZpZXdcbiAgICogLSBUaGV5IGFyZSBkeW5hbWljYWxseSBjcmVhdGVkXG4gICAqL1xuICBwYXJlbnQ6IFRFbGVtZW50Tm9kZXxURWxlbWVudENvbnRhaW5lck5vZGV8bnVsbDtcbiAgdFZpZXdzOiBUVmlld3xUVmlld1tdfG51bGw7XG4gIHByb2plY3Rpb246IG51bGw7XG59XG5cbi8qKiBTdGF0aWMgZGF0YSBmb3IgYW4gPG5nLWNvbnRhaW5lcj4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgVEVsZW1lbnRDb250YWluZXJOb2RlIGV4dGVuZHMgVE5vZGUge1xuICAvKiogSW5kZXggaW4gdGhlIExWaWV3W10gYXJyYXkuICovXG4gIGluZGV4OiBudW1iZXI7XG4gIGNoaWxkOiBURWxlbWVudE5vZGV8VFRleHROb2RlfFRDb250YWluZXJOb2RlfFRFbGVtZW50Q29udGFpbmVyTm9kZXxUUHJvamVjdGlvbk5vZGV8bnVsbDtcbiAgcGFyZW50OiBURWxlbWVudE5vZGV8VEVsZW1lbnRDb250YWluZXJOb2RlfG51bGw7XG4gIHRWaWV3czogbnVsbDtcbiAgcHJvamVjdGlvbjogbnVsbDtcbn1cblxuLyoqIFN0YXRpYyBkYXRhIGZvciBhbiBJQ1UgZXhwcmVzc2lvbiAqL1xuZXhwb3J0IGludGVyZmFjZSBUSWN1Q29udGFpbmVyTm9kZSBleHRlbmRzIFROb2RlIHtcbiAgLyoqIEluZGV4IGluIHRoZSBMVmlld1tdIGFycmF5LiAqL1xuICBpbmRleDogbnVtYmVyO1xuICBjaGlsZDogVEVsZW1lbnROb2RlfFRUZXh0Tm9kZXxudWxsO1xuICBwYXJlbnQ6IFRFbGVtZW50Tm9kZXxURWxlbWVudENvbnRhaW5lck5vZGV8bnVsbDtcbiAgdFZpZXdzOiBudWxsO1xuICBwcm9qZWN0aW9uOiBudWxsO1xuICAvKipcbiAgICogSW5kaWNhdGVzIHRoZSBjdXJyZW50IGFjdGl2ZSBjYXNlIGZvciBhbiBJQ1UgZXhwcmVzc2lvbi5cbiAgICogSXQgaXMgbnVsbCB3aGVuIHRoZXJlIGlzIG5vIGFjdGl2ZSBjYXNlLlxuICAgKi9cbiAgYWN0aXZlQ2FzZUluZGV4OiBudW1iZXJ8bnVsbDtcbn1cblxuLyoqIFN0YXRpYyBkYXRhIGZvciBhIHZpZXcgICovXG5leHBvcnQgaW50ZXJmYWNlIFRWaWV3Tm9kZSBleHRlbmRzIFROb2RlIHtcbiAgLyoqIElmIC0xLCBpdCdzIGEgZHluYW1pY2FsbHkgY3JlYXRlZCB2aWV3LiBPdGhlcndpc2UsIGl0IGlzIHRoZSB2aWV3IGJsb2NrIElELiAqL1xuICBpbmRleDogbnVtYmVyO1xuICBjaGlsZDogVEVsZW1lbnROb2RlfFRUZXh0Tm9kZXxURWxlbWVudENvbnRhaW5lck5vZGV8VENvbnRhaW5lck5vZGV8VFByb2plY3Rpb25Ob2RlfG51bGw7XG4gIHBhcmVudDogVENvbnRhaW5lck5vZGV8bnVsbDtcbiAgdFZpZXdzOiBudWxsO1xuICBwcm9qZWN0aW9uOiBudWxsO1xufVxuXG4vKiogU3RhdGljIGRhdGEgZm9yIGFuIExQcm9qZWN0aW9uTm9kZSAgKi9cbmV4cG9ydCBpbnRlcmZhY2UgVFByb2plY3Rpb25Ob2RlIGV4dGVuZHMgVE5vZGUge1xuICAvKiogSW5kZXggaW4gdGhlIGRhdGFbXSBhcnJheSAqL1xuICBjaGlsZDogbnVsbDtcbiAgLyoqXG4gICAqIFByb2plY3Rpb24gbm9kZXMgd2lsbCBoYXZlIHBhcmVudHMgdW5sZXNzIHRoZXkgYXJlIHRoZSBmaXJzdCBub2RlIG9mIGEgY29tcG9uZW50XG4gICAqIG9yIGVtYmVkZGVkIHZpZXcgKHdoaWNoIG1lYW5zIHRoZWlyIHBhcmVudCBpcyBpbiBhIGRpZmZlcmVudCB2aWV3IGFuZCBtdXN0IGJlXG4gICAqIHJldHJpZXZlZCB1c2luZyBMVmlldy5ub2RlKS5cbiAgICovXG4gIHBhcmVudDogVEVsZW1lbnROb2RlfFRFbGVtZW50Q29udGFpbmVyTm9kZXxudWxsO1xuICB0Vmlld3M6IG51bGw7XG5cbiAgLyoqIEluZGV4IG9mIHRoZSBwcm9qZWN0aW9uIG5vZGUuIChTZWUgVE5vZGUucHJvamVjdGlvbiBmb3IgbW9yZSBpbmZvLikgKi9cbiAgcHJvamVjdGlvbjogbnVtYmVyO1xufVxuXG4vKipcbiAqIEEgdW5pb24gdHlwZSByZXByZXNlbnRpbmcgYWxsIFROb2RlIHR5cGVzIHRoYXQgY2FuIGhvc3QgYSBkaXJlY3RpdmUuXG4gKi9cbmV4cG9ydCB0eXBlIFREaXJlY3RpdmVIb3N0Tm9kZSA9IFRFbGVtZW50Tm9kZSB8IFRDb250YWluZXJOb2RlIHwgVEVsZW1lbnRDb250YWluZXJOb2RlO1xuXG4vKipcbiAqIFRoaXMgbWFwcGluZyBpcyBuZWNlc3Nhcnkgc28gd2UgY2FuIHNldCBpbnB1dCBwcm9wZXJ0aWVzIGFuZCBvdXRwdXQgbGlzdGVuZXJzXG4gKiBwcm9wZXJseSBhdCBydW50aW1lIHdoZW4gcHJvcGVydHkgbmFtZXMgYXJlIG1pbmlmaWVkIG9yIGFsaWFzZWQuXG4gKlxuICogS2V5OiB1bm1pbmlmaWVkIC8gcHVibGljIGlucHV0IG9yIG91dHB1dCBuYW1lXG4gKiBWYWx1ZTogYXJyYXkgY29udGFpbmluZyBtaW5pZmllZCAvIGludGVybmFsIG5hbWUgYW5kIHJlbGF0ZWQgZGlyZWN0aXZlIGluZGV4XG4gKlxuICogVGhlIHZhbHVlIG11c3QgYmUgYW4gYXJyYXkgdG8gc3VwcG9ydCBpbnB1dHMgYW5kIG91dHB1dHMgd2l0aCB0aGUgc2FtZSBuYW1lXG4gKiBvbiB0aGUgc2FtZSBub2RlLlxuICovXG5leHBvcnQgdHlwZSBQcm9wZXJ0eUFsaWFzZXMgPSB7XG4gIC8vIFRoaXMgdXNlcyBhbiBvYmplY3QgbWFwIGJlY2F1c2UgdXNpbmcgdGhlIE1hcCB0eXBlIHdvdWxkIGJlIHRvbyBzbG93XG4gIFtrZXk6IHN0cmluZ106IFByb3BlcnR5QWxpYXNWYWx1ZVxufTtcblxuLyoqXG4gKiBTdG9yZSB0aGUgcnVudGltZSBpbnB1dCBvciBvdXRwdXQgbmFtZXMgZm9yIGFsbCB0aGUgZGlyZWN0aXZlcy5cbiAqXG4gKiBpKzA6IGRpcmVjdGl2ZSBpbnN0YW5jZSBpbmRleFxuICogaSsxOiBwcml2YXRlTmFtZVxuICpcbiAqIGUuZy4gWzAsICdjaGFuZ2UtbWluaWZpZWQnXVxuICovXG5leHBvcnQgdHlwZSBQcm9wZXJ0eUFsaWFzVmFsdWUgPSAobnVtYmVyIHwgc3RyaW5nKVtdO1xuXG4vKipcbiAqIFRoaXMgYXJyYXkgY29udGFpbnMgaW5mb3JtYXRpb24gYWJvdXQgaW5wdXQgcHJvcGVydGllcyB0aGF0XG4gKiBuZWVkIHRvIGJlIHNldCBvbmNlIGZyb20gYXR0cmlidXRlIGRhdGEuIEl0J3Mgb3JkZXJlZCBieVxuICogZGlyZWN0aXZlIGluZGV4IChyZWxhdGl2ZSB0byBlbGVtZW50KSBzbyBpdCdzIHNpbXBsZSB0b1xuICogbG9vayB1cCBhIHNwZWNpZmljIGRpcmVjdGl2ZSdzIGluaXRpYWwgaW5wdXQgZGF0YS5cbiAqXG4gKiBXaXRoaW4gZWFjaCBzdWItYXJyYXk6XG4gKlxuICogaSswOiBhdHRyaWJ1dGUgbmFtZVxuICogaSsxOiBtaW5pZmllZC9pbnRlcm5hbCBpbnB1dCBuYW1lXG4gKiBpKzI6IGluaXRpYWwgdmFsdWVcbiAqXG4gKiBJZiBhIGRpcmVjdGl2ZSBvbiBhIG5vZGUgZG9lcyBub3QgaGF2ZSBhbnkgaW5wdXQgcHJvcGVydGllc1xuICogdGhhdCBzaG91bGQgYmUgc2V0IGZyb20gYXR0cmlidXRlcywgaXRzIGluZGV4IGlzIHNldCB0byBudWxsXG4gKiB0byBhdm9pZCBhIHNwYXJzZSBhcnJheS5cbiAqXG4gKiBlLmcuIFtudWxsLCBbJ3JvbGUtbWluJywgJ21pbmlmaWVkLWlucHV0JywgJ2J1dHRvbiddXVxuICovXG5leHBvcnQgdHlwZSBJbml0aWFsSW5wdXREYXRhID0gKEluaXRpYWxJbnB1dHMgfCBudWxsKVtdO1xuXG4vKipcbiAqIFVzZWQgYnkgSW5pdGlhbElucHV0RGF0YSB0byBzdG9yZSBpbnB1dCBwcm9wZXJ0aWVzXG4gKiB0aGF0IHNob3VsZCBiZSBzZXQgb25jZSBmcm9tIGF0dHJpYnV0ZXMuXG4gKlxuICogaSswOiBhdHRyaWJ1dGUgbmFtZVxuICogaSsxOiBtaW5pZmllZC9pbnRlcm5hbCBpbnB1dCBuYW1lXG4gKiBpKzI6IGluaXRpYWwgdmFsdWVcbiAqXG4gKiBlLmcuIFsncm9sZS1taW4nLCAnbWluaWZpZWQtaW5wdXQnLCAnYnV0dG9uJ11cbiAqL1xuZXhwb3J0IHR5cGUgSW5pdGlhbElucHV0cyA9IHN0cmluZ1tdO1xuXG4vLyBOb3RlOiBUaGlzIGhhY2sgaXMgbmVjZXNzYXJ5IHNvIHdlIGRvbid0IGVycm9uZW91c2x5IGdldCBhIGNpcmN1bGFyIGRlcGVuZGVuY3lcbi8vIGZhaWx1cmUgYmFzZWQgb24gdHlwZXMuXG5leHBvcnQgY29uc3QgdW51c2VkVmFsdWVFeHBvcnRUb1BsYWNhdGVBamQgPSAxO1xuXG4vKipcbiAqIFR5cGUgcmVwcmVzZW50aW5nIGEgc2V0IG9mIFROb2RlcyB0aGF0IGNhbiBoYXZlIGxvY2FsIHJlZnMgKGAjZm9vYCkgcGxhY2VkIG9uIHRoZW0uXG4gKi9cbmV4cG9ydCB0eXBlIFROb2RlV2l0aExvY2FsUmVmcyA9IFRDb250YWluZXJOb2RlIHwgVEVsZW1lbnROb2RlIHwgVEVsZW1lbnRDb250YWluZXJOb2RlO1xuXG4vKipcbiAqIFR5cGUgZm9yIGEgZnVuY3Rpb24gdGhhdCBleHRyYWN0cyBhIHZhbHVlIGZvciBhIGxvY2FsIHJlZnMuXG4gKiBFeGFtcGxlOlxuICogLSBgPGRpdiAjbmF0aXZlRGl2RWw+YCAtIGBuYXRpdmVEaXZFbGAgc2hvdWxkIHBvaW50IHRvIHRoZSBuYXRpdmUgYDxkaXY+YCBlbGVtZW50O1xuICogLSBgPG5nLXRlbXBsYXRlICN0cGxSZWY+YCAtIGB0cGxSZWZgIHNob3VsZCBwb2ludCB0byB0aGUgYFRlbXBsYXRlUmVmYCBpbnN0YW5jZTtcbiAqL1xuZXhwb3J0IHR5cGUgTG9jYWxSZWZFeHRyYWN0b3IgPSAodE5vZGU6IFROb2RlV2l0aExvY2FsUmVmcywgY3VycmVudFZpZXc6IExWaWV3KSA9PiBhbnk7XG4iXX0=