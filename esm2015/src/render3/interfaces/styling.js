/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * The styling context acts as a styling manifest (shaped as an array) for determining which
 * styling properties have been assigned via the provided `updateStylingMap`, `updateStyleProp`
 * and `updateClassProp` functions. It also stores the static style/class values that were
 * extracted from the template by the compiler.
 *
 * A context is created by Angular when:
 * 1. An element contains static styling values (like style="..." or class="...")
 * 2. An element contains single property binding values (like [style.prop]="x" or
 * [class.prop]="y")
 * 3. An element contains multi property binding values (like [style]="x" or [class]="y")
 * 4. A directive contains host bindings for static, single or multi styling properties/bindings.
 * 5. An animation player is added to an element via `addPlayer`
 *
 * Note that even if an element contains static styling then this context will be created and
 * attached to it. The reason why this happens (instead of treating styles/classes as regular
 * HTML attributes) is because the style/class bindings must be able to default themselves back
 * to their respective static values when they are set to null.
 *
 * Say for example we have this:
 * ```
 * <!-- when `myWidthExp=null` then a width of `100px`
 *      will be used a default value for width -->
 * <div style="width:100px" [style.width]="myWidthExp"></div>
 * ```
 *
 * Even in the situation where there are no bindings, the static styling is still placed into the
 * context because there may be another directive on the same element that has styling.
 *
 * When Angular initializes styling data for an element then it will first register the static
 * styling values on the element using one of these two instructions:
 *
 * 1. elementStart or element (within the template function of a component)
 * 2. elementHostAttrs (for directive host bindings)
 *
 * In either case, a styling context will be created and stored within an element's `LViewData`.
 * Once the styling context is created then single and multi properties can be stored within it.
 * For this to happen, the following function needs to be called:
 *
 * `elementStyling` (called with style properties, class properties and a sanitizer + a directive
 * instance).
 *
 * When this instruction is called it will populate the styling context with the provided style
 * and class names into the context.
 *
 * The context itself looks like this:
 *
 * context = [
 *   // 0-8: header values (about 8 entries of configuration data)
 *   // 9+: this is where each entry is stored:
 * ]
 *
 * Let's say we have the following template code:
 *
 * ```
 * <div class="foo bar"
 *      style="width:200px; color:red"
 *      [style.width]="myWidthExp"
 *      [style.height]="myHeightExp"
 *      [class.baz]="myBazExp">
 * ```
 *
 * The context generated from these values will look like this (note that
 * for each binding name (the class and style bindings) the values will
 * be inserted twice into the array (once for single property entries and
 * again for multi property entries).
 *
 * context = [
 *   // 0-8: header values (about 8 entries of configuration data)
 *   // 9+: this is where each entry is stored:
 *
 *   // SINGLE PROPERTIES
 *   configForWidth,
 *   'width'
 *   myWidthExp, // the binding value not the binding itself
 *   0, // the directive owner
 *
 *   configForHeight,
 *   'height'
 *   myHeightExp, // the binding value not the binding itself
 *   0, // the directive owner
 *
 *   configForBazClass,
 *   'baz
 *   myBazClassExp, // the binding value not the binding itself
 *   0, // the directive owner
 *
 *   // MULTI PROPERTIES
 *   configForWidth,
 *   'width'
 *   myWidthExp, // the binding value not the binding itself
 *   0, // the directive owner
 *
 *   configForHeight,
 *   'height'
 *   myHeightExp, // the binding value not the binding itself
 *   0, // the directive owner
 *
 *   configForBazClass,
 *   'baz
 *   myBazClassExp, // the binding value not the binding itself
 *   0, // the directive owner
 * ]
 *
 * The configuration values are left out of the example above because
 * the ordering of them could change between code patches. Please read the
 * documentation below to get a better understand of what the configuration
 * values are and how they work.
 *
 * Each time a binding property is updated (whether it be through a single
 * property instruction like `elementStyleProp`, `elementClassProp` or
 * `elementStylingMap`) then the values in the context will be updated as
 * well.
 *
 * If for example `[style.width]` updates to `555px` then its value will be reflected
 * in the context as so:
 *
 * context = [
 *   // ...
 *   configForWidth, // this will be marked DIRTY
 *   'width'
 *   '555px',
 *   0,
 *   //..
 * ]
 *
 * The context and directive data will also be marked dirty.
 *
 * Despite the context being updated, nothing has been rendered on screen (not styles or
 * classes have been set on the element). To kick off rendering for an element the following
 * function needs to be run `elementStylingApply`.
 *
 * `elementStylingApply` will run through the context and find each dirty value and render them onto
 * the element. Once complete, all styles/classes will be set to clean. Because of this, the render
 * function will now know not to rerun itself again if called again unless new style/class values
 * have changed.
 *
 * ## Directives
 * Directive style/class values (which are provided through host bindings) are also supported and
 * housed within the same styling context as are template-level style/class properties/bindings
 * So long as they are all assigned to the same element, both directive-level and template-level
 * styling bindings share the same context.
 *
 * Each of the following instructions supports accepting a directive instance as an input parameter:
 *
 * - `elementHostAttrs`
 * - `elementStyling`
 * - `elementStyleProp`
 * - `elementClassProp`
 * - `elementStylingMap`
 * - `elementStylingApply`
 *
 * Each time a directive value is passed in, it will be converted into an index by examining the
 * directive registry (which lives in the context configuration area). The index is then used
 * to help single style properties figure out where a value is located in the context.
 *
 *
 * ## Single-level styling bindings (`[style.prop]` and `[class.name]`)
 *
 * Both `[style.prop]` and `[class.name]` bindings are run through the `updateStyleProp`
 * and `updateClassProp` functions respectively. They work by examining the provided
 * `offset` value and are able to locate the exact spot in the context where the
 * matching style is located.
 *
 * Both `[style.prop]` and `[class.name]` bindings are able to process these values
 * from directive host bindings. When evaluated (from the host binding function) the
 * `directiveRef` value is then passed in.
 *
 * If two directives or a directive + a template binding both write to the same style/class
 * binding then the styling context code will decide which one wins based on the following
 * rule:
 *
 * 1. If the template binding has a value then it always wins
 * 2. Otherwise whichever first-registered directive that has that value first will win
 *
 * The code example helps make this clear:
 *
 * ```
 * <!--
 * <div [style.width]="myWidth"
 *      [my-width-directive]="'600px'">
 * -->
 *
 * \@Directive({
 *  selector: '[my-width-directive']
 * })
 * class MyWidthDirective {
 * \@Input('my-width-directive')
 * \@HostBinding('style.width')
 *   public width = null;
 * }
 * ```
 *
 * Since there is a style binding for width present on the element (`[style.width]`) then
 * it will always win over the width binding that is present as a host binding within
 * the `MyWidthDirective`. However, if `[style.width]` renders as `null` (so `myWidth=null`)
 * then the `MyWidthDirective` will be able to write to the `width` style within the context.
 * Simply put, whichever directive writes to a value first ends up having ownership of it as
 * long as the template didn't set anything.
 *
 * The way in which the ownership is facilitated is through index value. The earliest directives
 * get the smallest index values (with 0 being reserved for the template element bindings). Each
 * time a value is written from a directive or the template bindings, the value itself gets
 * assigned the directive index value in its data. If another directive writes a value again then
 * its directive index gets compared against the directive index that exists on the element. Only
 * when the new value's directive index is less than the existing directive index then the new
 * value will be written to the context. But, if the existing value is null then the new value is
 * written by the less important directive.
 *
 * Each directive also has its own sanitizer and dirty flags. These values are consumed within the
 * rendering function.
 *
 *
 * ## Multi-level styling bindings (`[style]` and `[class]`)
 *
 * Multi-level styling bindings are treated as less important (less specific) as single-level
 * bindings (things like `[style.prop]` and `[class.name]`).
 *
 * Multi-level bindings are still applied to the context in a similar way as are single level
 * bindings, but this process works by diffing the new multi-level values (which are key/value
 * maps) against the existing set of styles that live in the context. Each time a new map value
 * is detected (via identity check) then it will loop through the values and figure out what
 * has changed and reorder the context array to match the ordering of the keys. This reordering
 * of the context makes sure that follow-up traversals of the context when updated against the
 * key/value map are as close as possible to o(n) (where "n" is the size of the key/value map).
 *
 * If a `directiveRef` value is passed in then the styling algorithm code will take the directive's
 * prioritization index into account and update the values with respect to more important
 * directives. This means that if a value such as `width` is updated in two different `[style]`
 * bindings (say one on the template and another within a directive that sits on the same element)
 * then the algorithm will decide how to update the value based on the following heuristic:
 *
 * 1. If the template binding has a value then it always wins
 * 2. If not then whichever first-registered directive that has that value first will win
 *
 * It will also update the value if it was set to `null` by a previous directive (or the template).
 *
 * Each time a value is updated (or removed) then the context will change shape to better match
 * the ordering of the styling data as well as the ordering of each directive that contains styling
 * data. (See `patchStylingMapIntoContext` inside of class_and_style_bindings.ts to better
 * understand how this works.)
 *
 * ## Rendering
 * The rendering mechanism (when the styling data is applied on screen) occurs via the
 * `elementStylingApply` function and is designed to run after **all** styling functions have been
 * evaluated. The rendering algorithm will loop over the context and only apply the styles that are
 * flagged as dirty (either because they are new, updated or have been removed via multi or
 * single bindings).
 * @record
 */
export function StylingContext() { }
if (false) {
    /* Skipping unnamed member:
    [StylingIndex.ElementPosition]: LContainer|LView|RElement|null;*/
    /* Skipping unnamed member:
    [StylingIndex.MasterFlagPosition]: number;*/
    /* Skipping unnamed member:
    [StylingIndex.DirectiveRegistryPosition]: DirectiveRegistryValues;*/
    /* Skipping unnamed member:
    [StylingIndex.InitialStyleValuesPosition]: InitialStylingValues;*/
    /* Skipping unnamed member:
    [StylingIndex.InitialClassValuesPosition]: InitialStylingValues;*/
    /* Skipping unnamed member:
    [StylingIndex.SinglePropOffsetPositions]: SinglePropOffsetValues;*/
    /* Skipping unnamed member:
    [StylingIndex.CachedMultiClasses]: any|MapBasedOffsetValues;*/
    /* Skipping unnamed member:
    [StylingIndex.CachedMultiStyles]: any|MapBasedOffsetValues;*/
    /* Skipping unnamed member:
    [StylingIndex.PlayerContext]: PlayerContext|null;*/
}
/**
 * Used as a styling array to house static class and style values that were extracted
 * by the compiler and placed in the animation context via `elementStart` and
 * `elementHostAttrs`.
 *
 * See [InitialStylingValuesIndex] for a breakdown of how all this works.
 * @record
 */
export function InitialStylingValues() { }
if (false) {
    /* Skipping unnamed member:
    [InitialStylingValuesIndex.DefaultNullValuePosition]: null;*/
    /* Skipping unnamed member:
    [InitialStylingValuesIndex.CachedStringValuePosition]: string|null;*/
}
/** @enum {number} */
const InitialStylingValuesIndex = {
    /**
     * The first value is always `null` so that `styles[0] == null` for unassigned values
     */
    DefaultNullValuePosition: 0,
    /**
     * Used for non-styling code to examine what the style or className string is:
     * styles: ['width', '100px', 0, 'opacity', null, 0, 'height', '200px', 0]
     *    => initialStyles[CachedStringValuePosition] = 'width:100px;height:200px';
     * classes: ['foo', true, 0, 'bar', false, 0, 'baz', true, 0]
     *    => initialClasses[CachedStringValuePosition] = 'foo bar';
     *
     * Note that this value is `null` by default and it will only be populated
     * once `getInitialStyleStringValue` or `getInitialClassNameValue` is executed.
     */
    CachedStringValuePosition: 1,
    /**
     * Where the style or class values start in the tuple
     */
    KeyValueStartPosition: 2,
    /**
     * The offset value (index + offset) for the property value for each style/class entry
     */
    PropOffset: 0,
    /**
     * The offset value (index + offset) for the style/class value for each style/class entry
     */
    ValueOffset: 1,
    /**
     * The offset value (index + offset) for the style/class directive owner for each style/class
       entry
     */
    DirectiveOwnerOffset: 2,
    /**
     * The first bit set aside to mark if the initial style was already rendere
     */
    AppliedFlagBitPosition: 0,
    AppliedFlagBitLength: 1,
    /**
     * The total size for each style/class entry (prop + value + directiveOwner)
     */
    Size: 3,
};
export { InitialStylingValuesIndex };
/**
 * An array located in the StylingContext that houses all directive instances and additional
 * data about them.
 *
 * Each entry in this array represents a source of where style/class binding values could
 * come from. By default, there is always at least one directive here with a null value and
 * that represents bindings that live directly on an element in the template (not host bindings).
 *
 * Each successive entry in the array is an actual instance of a directive as well as some
 * additional info about that entry.
 *
 * An entry within this array has the following values:
 * [0] = The instance of the directive (the first entry is null because its reserved for the
 *       template)
 * [1] = The pointer that tells where the single styling (stuff like [class.foo] and [style.prop])
 *       offset values are located. This value will allow for a binding instruction to find exactly
 *       where a style is located.
 * [2] = Whether or not the directive has any styling values that are dirty. This is used as
 *       reference within the `renderStyling` function to decide whether to skip iterating
 *       through the context when rendering is executed.
 * [3] = The styleSanitizer instance that is assigned to the directive. Although it's unlikely,
 *       a directive could introduce its own special style sanitizer and for this reach each
 *       directive will get its own space for it (if null then the very first sanitizer is used).
 *
 * Each time a new directive is added it will insert these four values at the end of the array.
 * When this array is examined then the resulting directiveIndex will be resolved by dividing the
 * index value by the size of the array entries (so if DirA is at spot 8 then its index will be 2).
 * @record
 */
export function DirectiveRegistryValues() { }
if (false) {
    /* Skipping unnamed member:
    [DirectiveRegistryValuesIndex.DirectiveValueOffset]: null;*/
    /* Skipping unnamed member:
    [DirectiveRegistryValuesIndex.SinglePropValuesIndexOffset]: number;*/
    /* Skipping unnamed member:
    [DirectiveRegistryValuesIndex.DirtyFlagOffset]: boolean;*/
    /* Skipping unnamed member:
    [DirectiveRegistryValuesIndex.StyleSanitizerOffset]: StyleSanitizeFn|null;*/
}
/** @enum {number} */
const DirectiveRegistryValuesIndex = {
    DirectiveValueOffset: 0,
    SinglePropValuesIndexOffset: 1,
    DirtyFlagOffset: 2,
    StyleSanitizerOffset: 3,
    Size: 4,
};
export { DirectiveRegistryValuesIndex };
/**
 * An array that contains the index pointer values for every single styling property
 * that exists in the context and for every directive. It also contains the total
 * single styles and single classes that exists in the context as the first two values.
 *
 * Let's say we have the following template code:
 *
 * <div [style.width]="myWidth"
 *      [style.height]="myHeight"
 *      [class.flipped]="flipClass"
 *      directive-with-opacity>
 *      directive-with-foo-bar-classes>
 *
 * We have two directive and template-binding sources,
 * 2 + 1 styles and 1 + 1 classes. When the bindings are
 * registered the SinglePropOffsets array will look like so:
 *
 * s_0/c_0 = template directive value
 * s_1/c_1 = directive one (directive-with-opacity)
 * s_2/c_2 = directive two (directive-with-foo-bar-classes)
 *
 * [3, 2, 2, 1, s_00, s01, c_01, 1, 0, s_10, 0, 1, c_20
 * @record
 */
export function SinglePropOffsetValues() { }
if (false) {
    /* Skipping unnamed member:
    [SinglePropOffsetValuesIndex.StylesCountPosition]: number;*/
    /* Skipping unnamed member:
    [SinglePropOffsetValuesIndex.ClassesCountPosition]: number;*/
}
/** @enum {number} */
const SinglePropOffsetValuesIndex = {
    StylesCountPosition: 0,
    ClassesCountPosition: 1,
    ValueStartPosition: 2,
};
export { SinglePropOffsetValuesIndex };
/**
 * Used a reference for all multi styling values (values that are assigned via the
 * `[style]` and `[class]` bindings).
 *
 * Single-styling properties (things set via `[style.prop]` and `[class.name]` bindings)
 * are not handled using the same approach as multi-styling bindings (such as `[style]`
 * `[class]` bindings).
 *
 * Multi-styling bindings rely on a diffing algorithm to figure out what properties have been added,
 * removed and modified. Multi-styling properties are also evaluated across directives--which means
 * that Angular supports having multiple directives all write to the same `[style]` and `[class]`
 * bindings (using host bindings) even if the `[style]` and/or `[class]` bindings are being written
 * to on the template element.
 *
 * All multi-styling values that are written to an element (whether it be from the template or any
 * directives attached to the element) are all written into the `MapBasedOffsetValues` array. (Note
 * that there are two arrays: one for styles and another for classes.)
 *
 * This array is shaped in the following way:
 *
 * [0]  = The total amount of unique multi-style or multi-class entries that exist currently in the
 *        context.
 * [1+] = Contains an entry of four values ... Each entry is a value assigned by a
 * `[style]`/`[class]`
 *        binding (we call this a **source**).
 *
 *        An example entry looks like so (at a given `i` index):
 *        [i + 0] = Whether or not the value is dirty
 *
 *        [i + 1] = The index of where the map-based values
 *                  (for this **source**) start within the context
 *
 *        [i + 2] = The untouched, last set value of the binding
 *
 *        [i + 3] = The total amount of unqiue binding values that were
 *                  extracted and set into the context. (Note that this value does
 *                  not reflect the total amount of values within the binding
 *                  value (since it's a map), but instead reflects the total values
 *                  that were not used by another directive).
 *
 * Each time a directive (or template) writes a value to a `[class]`/`[style]` binding then the
 * styling diffing algorithm code will decide whether or not to update the value based on the
 * following rules:
 *
 * 1. If a more important directive (either the template or a directive that was registered
 *    beforehand) has written a specific styling value into the context then any follow-up styling
 *    values (set by another directive via its `[style]` and/or `[class]` host binding) will not be
 *    able to set it. This is because the former directive has priorty.
 * 2. Only if a former directive has set a specific styling value to null (whether by actually
 *    setting it to null or not including it in is map value) then a less imporatant directive can
 *    set its own value.
 *
 * ## How the map-based styling algorithm updates itself
 * @record
 */
export function MapBasedOffsetValues() { }
if (false) {
    /* Skipping unnamed member:
    [MapBasedOffsetValuesIndex.EntriesCountPosition]: number;*/
}
/** @enum {number} */
const MapBasedOffsetValuesIndex = {
    EntriesCountPosition: 0,
    ValuesStartPosition: 1,
    DirtyFlagOffset: 0,
    PositionStartOffset: 1,
    ValueOffset: 2,
    ValueCountOffset: 3,
    Size: 4,
};
export { MapBasedOffsetValuesIndex };
/** @enum {number} */
const StylingFlags = {
    // Implies no configurations
    None: 0,
    // Whether or not the entry or context itself is dirty
    Dirty: 1,
    // Whether or not this is a class-based assignment
    Class: 2,
    // Whether or not a sanitizer was applied to this property
    Sanitize: 4,
    // Whether or not any player builders within need to produce new players
    PlayerBuildersDirty: 8,
    // The max amount of bits used to represent these configuration values
    BindingAllocationLocked: 16,
    BitCountSize: 5,
    // There are only five bits here
    BitMask: 31,
};
export { StylingFlags };
/** @enum {number} */
const StylingIndex = {
    // Position of where the initial styles are stored in the styling context
    // This index must align with HOST, see interfaces/view.ts
    ElementPosition: 0,
    // Index of location where the start of single properties are stored. (`updateStyleProp`)
    MasterFlagPosition: 1,
    // Position of where the registered directives exist for this styling context
    DirectiveRegistryPosition: 2,
    // Position of where the initial styles are stored in the styling context
    InitialStyleValuesPosition: 3,
    InitialClassValuesPosition: 4,
    // Index of location where the class index offset value is located
    SinglePropOffsetPositions: 5,
    // Position of where the last string-based CSS class value was stored (or a cached version of the
    // initial styles when a [class] directive is present)
    CachedMultiClasses: 6,
    // Position of where the last string-based CSS class value was stored
    CachedMultiStyles: 7,
    // Multi and single entries are stored in `StylingContext` as: Flag; PropertyName;  PropertyValue
    // Position of where the initial styles are stored in the styling context
    PlayerContext: 8,
    // Location of single (prop) value entries are stored within the context
    SingleStylesStartPosition: 9,
    FlagsOffset: 0,
    PropertyOffset: 1,
    ValueOffset: 2,
    PlayerBuilderIndexOffset: 3,
    // Size of each multi or single entry (flag + prop + value + playerBuilderIndex)
    Size: 4,
    // Each flag has a binary digit length of this value
    BitCountSize: 14,
    // The binary digit value as a mask
    BitMask: 16383,
};
export { StylingIndex };
/** @enum {number} */
const DirectiveOwnerAndPlayerBuilderIndex = {
    BitCountSize: 16,
    BitMask: 65535,
};
export { DirectiveOwnerAndPlayerBuilderIndex };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3R5bGluZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaW50ZXJmYWNlcy9zdHlsaW5nLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBdVFBLG9DQXFEQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFTRCwwQ0FHQzs7Ozs7Ozs7O0lBMEdDOztPQUVHO0lBQ0gsMkJBQTRCO0lBRTVCOzs7Ozs7Ozs7T0FTRztJQUNILDRCQUE2QjtJQUU3Qjs7T0FFRztJQUNILHdCQUF5QjtJQUV6Qjs7T0FFRztJQUNILGFBQWM7SUFFZDs7T0FFRztJQUNILGNBQWU7SUFFZjs7O09BR0c7SUFDSCx1QkFBd0I7SUFFeEI7O09BRUc7SUFDSCx5QkFBNEI7SUFDNUIsdUJBQXdCO0lBRXhCOztPQUVHO0lBQ0gsT0FBUTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUErQlYsNkNBS0M7Ozs7Ozs7Ozs7Ozs7SUFPQyx1QkFBd0I7SUFDeEIsOEJBQStCO0lBQy9CLGtCQUFtQjtJQUNuQix1QkFBd0I7SUFDeEIsT0FBUTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBMEJWLDRDQUdDOzs7Ozs7Ozs7SUFPQyxzQkFBdUI7SUFDdkIsdUJBQXdCO0lBQ3hCLHFCQUFzQjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQXlEeEIsMENBRUM7Ozs7Ozs7SUFHQyx1QkFBd0I7SUFDeEIsc0JBQXVCO0lBQ3ZCLGtCQUFtQjtJQUNuQixzQkFBdUI7SUFDdkIsY0FBZTtJQUNmLG1CQUFvQjtJQUNwQixPQUFROzs7OztJQVFSLDRCQUE0QjtJQUM1QixPQUFjO0lBQ2Qsc0RBQXNEO0lBQ3RELFFBQWU7SUFDZixrREFBa0Q7SUFDbEQsUUFBZTtJQUNmLDBEQUEwRDtJQUMxRCxXQUFrQjtJQUNsQix3RUFBd0U7SUFDeEUsc0JBQTZCO0lBQzdCLHNFQUFzRTtJQUN0RSwyQkFBaUM7SUFDakMsZUFBZ0I7SUFDaEIsZ0NBQWdDO0lBQ2hDLFdBQWlCOzs7OztJQUtqQix5RUFBeUU7SUFDekUsMERBQTBEO0lBQzFELGtCQUFtQjtJQUNuQix5RkFBeUY7SUFDekYscUJBQXNCO0lBQ3RCLDZFQUE2RTtJQUM3RSw0QkFBNkI7SUFDN0IseUVBQXlFO0lBQ3pFLDZCQUE4QjtJQUM5Qiw2QkFBOEI7SUFDOUIsa0VBQWtFO0lBQ2xFLDRCQUE2QjtJQUM3QixpR0FBaUc7SUFDakcsc0RBQXNEO0lBQ3RELHFCQUFzQjtJQUN0QixxRUFBcUU7SUFDckUsb0JBQXFCO0lBQ3JCLGlHQUFpRztJQUNqRyx5RUFBeUU7SUFDekUsZ0JBQWlCO0lBQ2pCLHdFQUF3RTtJQUN4RSw0QkFBNkI7SUFDN0IsY0FBZTtJQUNmLGlCQUFrQjtJQUNsQixjQUFlO0lBQ2YsMkJBQTRCO0lBQzVCLGdGQUFnRjtJQUNoRixPQUFRO0lBQ1Isb0RBQW9EO0lBQ3BELGdCQUFpQjtJQUNqQixtQ0FBbUM7SUFDbkMsY0FBMEI7Ozs7O0lBWTFCLGdCQUFpQjtJQUNqQixjQUE0QiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCB7U3R5bGVTYW5pdGl6ZUZufSBmcm9tICcuLi8uLi9zYW5pdGl6YXRpb24vc3R5bGVfc2FuaXRpemVyJztcbmltcG9ydCB7UkVsZW1lbnR9IGZyb20gJy4uL2ludGVyZmFjZXMvcmVuZGVyZXInO1xuaW1wb3J0IHtMQ29udGFpbmVyfSBmcm9tICcuL2NvbnRhaW5lcic7XG5pbXBvcnQge1BsYXllckNvbnRleHR9IGZyb20gJy4vcGxheWVyJztcbmltcG9ydCB7TFZpZXd9IGZyb20gJy4vdmlldyc7XG5cblxuLyoqXG4gKiBUaGUgc3R5bGluZyBjb250ZXh0IGFjdHMgYXMgYSBzdHlsaW5nIG1hbmlmZXN0IChzaGFwZWQgYXMgYW4gYXJyYXkpIGZvciBkZXRlcm1pbmluZyB3aGljaFxuICogc3R5bGluZyBwcm9wZXJ0aWVzIGhhdmUgYmVlbiBhc3NpZ25lZCB2aWEgdGhlIHByb3ZpZGVkIGB1cGRhdGVTdHlsaW5nTWFwYCwgYHVwZGF0ZVN0eWxlUHJvcGBcbiAqIGFuZCBgdXBkYXRlQ2xhc3NQcm9wYCBmdW5jdGlvbnMuIEl0IGFsc28gc3RvcmVzIHRoZSBzdGF0aWMgc3R5bGUvY2xhc3MgdmFsdWVzIHRoYXQgd2VyZVxuICogZXh0cmFjdGVkIGZyb20gdGhlIHRlbXBsYXRlIGJ5IHRoZSBjb21waWxlci5cbiAqXG4gKiBBIGNvbnRleHQgaXMgY3JlYXRlZCBieSBBbmd1bGFyIHdoZW46XG4gKiAxLiBBbiBlbGVtZW50IGNvbnRhaW5zIHN0YXRpYyBzdHlsaW5nIHZhbHVlcyAobGlrZSBzdHlsZT1cIi4uLlwiIG9yIGNsYXNzPVwiLi4uXCIpXG4gKiAyLiBBbiBlbGVtZW50IGNvbnRhaW5zIHNpbmdsZSBwcm9wZXJ0eSBiaW5kaW5nIHZhbHVlcyAobGlrZSBbc3R5bGUucHJvcF09XCJ4XCIgb3JcbiAqIFtjbGFzcy5wcm9wXT1cInlcIilcbiAqIDMuIEFuIGVsZW1lbnQgY29udGFpbnMgbXVsdGkgcHJvcGVydHkgYmluZGluZyB2YWx1ZXMgKGxpa2UgW3N0eWxlXT1cInhcIiBvciBbY2xhc3NdPVwieVwiKVxuICogNC4gQSBkaXJlY3RpdmUgY29udGFpbnMgaG9zdCBiaW5kaW5ncyBmb3Igc3RhdGljLCBzaW5nbGUgb3IgbXVsdGkgc3R5bGluZyBwcm9wZXJ0aWVzL2JpbmRpbmdzLlxuICogNS4gQW4gYW5pbWF0aW9uIHBsYXllciBpcyBhZGRlZCB0byBhbiBlbGVtZW50IHZpYSBgYWRkUGxheWVyYFxuICpcbiAqIE5vdGUgdGhhdCBldmVuIGlmIGFuIGVsZW1lbnQgY29udGFpbnMgc3RhdGljIHN0eWxpbmcgdGhlbiB0aGlzIGNvbnRleHQgd2lsbCBiZSBjcmVhdGVkIGFuZFxuICogYXR0YWNoZWQgdG8gaXQuIFRoZSByZWFzb24gd2h5IHRoaXMgaGFwcGVucyAoaW5zdGVhZCBvZiB0cmVhdGluZyBzdHlsZXMvY2xhc3NlcyBhcyByZWd1bGFyXG4gKiBIVE1MIGF0dHJpYnV0ZXMpIGlzIGJlY2F1c2UgdGhlIHN0eWxlL2NsYXNzIGJpbmRpbmdzIG11c3QgYmUgYWJsZSB0byBkZWZhdWx0IHRoZW1zZWx2ZXMgYmFja1xuICogdG8gdGhlaXIgcmVzcGVjdGl2ZSBzdGF0aWMgdmFsdWVzIHdoZW4gdGhleSBhcmUgc2V0IHRvIG51bGwuXG4gKlxuICogU2F5IGZvciBleGFtcGxlIHdlIGhhdmUgdGhpczpcbiAqIGBgYFxuICogPCEtLSB3aGVuIGBteVdpZHRoRXhwPW51bGxgIHRoZW4gYSB3aWR0aCBvZiBgMTAwcHhgXG4gKiAgICAgIHdpbGwgYmUgdXNlZCBhIGRlZmF1bHQgdmFsdWUgZm9yIHdpZHRoIC0tPlxuICogPGRpdiBzdHlsZT1cIndpZHRoOjEwMHB4XCIgW3N0eWxlLndpZHRoXT1cIm15V2lkdGhFeHBcIj48L2Rpdj5cbiAqIGBgYFxuICpcbiAqIEV2ZW4gaW4gdGhlIHNpdHVhdGlvbiB3aGVyZSB0aGVyZSBhcmUgbm8gYmluZGluZ3MsIHRoZSBzdGF0aWMgc3R5bGluZyBpcyBzdGlsbCBwbGFjZWQgaW50byB0aGVcbiAqIGNvbnRleHQgYmVjYXVzZSB0aGVyZSBtYXkgYmUgYW5vdGhlciBkaXJlY3RpdmUgb24gdGhlIHNhbWUgZWxlbWVudCB0aGF0IGhhcyBzdHlsaW5nLlxuICpcbiAqIFdoZW4gQW5ndWxhciBpbml0aWFsaXplcyBzdHlsaW5nIGRhdGEgZm9yIGFuIGVsZW1lbnQgdGhlbiBpdCB3aWxsIGZpcnN0IHJlZ2lzdGVyIHRoZSBzdGF0aWNcbiAqIHN0eWxpbmcgdmFsdWVzIG9uIHRoZSBlbGVtZW50IHVzaW5nIG9uZSBvZiB0aGVzZSB0d28gaW5zdHJ1Y3Rpb25zOlxuICpcbiAqIDEuIGVsZW1lbnRTdGFydCBvciBlbGVtZW50ICh3aXRoaW4gdGhlIHRlbXBsYXRlIGZ1bmN0aW9uIG9mIGEgY29tcG9uZW50KVxuICogMi4gZWxlbWVudEhvc3RBdHRycyAoZm9yIGRpcmVjdGl2ZSBob3N0IGJpbmRpbmdzKVxuICpcbiAqIEluIGVpdGhlciBjYXNlLCBhIHN0eWxpbmcgY29udGV4dCB3aWxsIGJlIGNyZWF0ZWQgYW5kIHN0b3JlZCB3aXRoaW4gYW4gZWxlbWVudCdzIGBMVmlld0RhdGFgLlxuICogT25jZSB0aGUgc3R5bGluZyBjb250ZXh0IGlzIGNyZWF0ZWQgdGhlbiBzaW5nbGUgYW5kIG11bHRpIHByb3BlcnRpZXMgY2FuIGJlIHN0b3JlZCB3aXRoaW4gaXQuXG4gKiBGb3IgdGhpcyB0byBoYXBwZW4sIHRoZSBmb2xsb3dpbmcgZnVuY3Rpb24gbmVlZHMgdG8gYmUgY2FsbGVkOlxuICpcbiAqIGBlbGVtZW50U3R5bGluZ2AgKGNhbGxlZCB3aXRoIHN0eWxlIHByb3BlcnRpZXMsIGNsYXNzIHByb3BlcnRpZXMgYW5kIGEgc2FuaXRpemVyICsgYSBkaXJlY3RpdmVcbiAqIGluc3RhbmNlKS5cbiAqXG4gKiBXaGVuIHRoaXMgaW5zdHJ1Y3Rpb24gaXMgY2FsbGVkIGl0IHdpbGwgcG9wdWxhdGUgdGhlIHN0eWxpbmcgY29udGV4dCB3aXRoIHRoZSBwcm92aWRlZCBzdHlsZVxuICogYW5kIGNsYXNzIG5hbWVzIGludG8gdGhlIGNvbnRleHQuXG4gKlxuICogVGhlIGNvbnRleHQgaXRzZWxmIGxvb2tzIGxpa2UgdGhpczpcbiAqXG4gKiBjb250ZXh0ID0gW1xuICogICAvLyAwLTg6IGhlYWRlciB2YWx1ZXMgKGFib3V0IDggZW50cmllcyBvZiBjb25maWd1cmF0aW9uIGRhdGEpXG4gKiAgIC8vIDkrOiB0aGlzIGlzIHdoZXJlIGVhY2ggZW50cnkgaXMgc3RvcmVkOlxuICogXVxuICpcbiAqIExldCdzIHNheSB3ZSBoYXZlIHRoZSBmb2xsb3dpbmcgdGVtcGxhdGUgY29kZTpcbiAqXG4gKiBgYGBcbiAqIDxkaXYgY2xhc3M9XCJmb28gYmFyXCJcbiAqICAgICAgc3R5bGU9XCJ3aWR0aDoyMDBweDsgY29sb3I6cmVkXCJcbiAqICAgICAgW3N0eWxlLndpZHRoXT1cIm15V2lkdGhFeHBcIlxuICogICAgICBbc3R5bGUuaGVpZ2h0XT1cIm15SGVpZ2h0RXhwXCJcbiAqICAgICAgW2NsYXNzLmJhel09XCJteUJhekV4cFwiPlxuICogYGBgXG4gKlxuICogVGhlIGNvbnRleHQgZ2VuZXJhdGVkIGZyb20gdGhlc2UgdmFsdWVzIHdpbGwgbG9vayBsaWtlIHRoaXMgKG5vdGUgdGhhdFxuICogZm9yIGVhY2ggYmluZGluZyBuYW1lICh0aGUgY2xhc3MgYW5kIHN0eWxlIGJpbmRpbmdzKSB0aGUgdmFsdWVzIHdpbGxcbiAqIGJlIGluc2VydGVkIHR3aWNlIGludG8gdGhlIGFycmF5IChvbmNlIGZvciBzaW5nbGUgcHJvcGVydHkgZW50cmllcyBhbmRcbiAqIGFnYWluIGZvciBtdWx0aSBwcm9wZXJ0eSBlbnRyaWVzKS5cbiAqXG4gKiBjb250ZXh0ID0gW1xuICogICAvLyAwLTg6IGhlYWRlciB2YWx1ZXMgKGFib3V0IDggZW50cmllcyBvZiBjb25maWd1cmF0aW9uIGRhdGEpXG4gKiAgIC8vIDkrOiB0aGlzIGlzIHdoZXJlIGVhY2ggZW50cnkgaXMgc3RvcmVkOlxuICpcbiAqICAgLy8gU0lOR0xFIFBST1BFUlRJRVNcbiAqICAgY29uZmlnRm9yV2lkdGgsXG4gKiAgICd3aWR0aCdcbiAqICAgbXlXaWR0aEV4cCwgLy8gdGhlIGJpbmRpbmcgdmFsdWUgbm90IHRoZSBiaW5kaW5nIGl0c2VsZlxuICogICAwLCAvLyB0aGUgZGlyZWN0aXZlIG93bmVyXG4gKlxuICogICBjb25maWdGb3JIZWlnaHQsXG4gKiAgICdoZWlnaHQnXG4gKiAgIG15SGVpZ2h0RXhwLCAvLyB0aGUgYmluZGluZyB2YWx1ZSBub3QgdGhlIGJpbmRpbmcgaXRzZWxmXG4gKiAgIDAsIC8vIHRoZSBkaXJlY3RpdmUgb3duZXJcbiAqXG4gKiAgIGNvbmZpZ0ZvckJhekNsYXNzLFxuICogICAnYmF6XG4gKiAgIG15QmF6Q2xhc3NFeHAsIC8vIHRoZSBiaW5kaW5nIHZhbHVlIG5vdCB0aGUgYmluZGluZyBpdHNlbGZcbiAqICAgMCwgLy8gdGhlIGRpcmVjdGl2ZSBvd25lclxuICpcbiAqICAgLy8gTVVMVEkgUFJPUEVSVElFU1xuICogICBjb25maWdGb3JXaWR0aCxcbiAqICAgJ3dpZHRoJ1xuICogICBteVdpZHRoRXhwLCAvLyB0aGUgYmluZGluZyB2YWx1ZSBub3QgdGhlIGJpbmRpbmcgaXRzZWxmXG4gKiAgIDAsIC8vIHRoZSBkaXJlY3RpdmUgb3duZXJcbiAqXG4gKiAgIGNvbmZpZ0ZvckhlaWdodCxcbiAqICAgJ2hlaWdodCdcbiAqICAgbXlIZWlnaHRFeHAsIC8vIHRoZSBiaW5kaW5nIHZhbHVlIG5vdCB0aGUgYmluZGluZyBpdHNlbGZcbiAqICAgMCwgLy8gdGhlIGRpcmVjdGl2ZSBvd25lclxuICpcbiAqICAgY29uZmlnRm9yQmF6Q2xhc3MsXG4gKiAgICdiYXpcbiAqICAgbXlCYXpDbGFzc0V4cCwgLy8gdGhlIGJpbmRpbmcgdmFsdWUgbm90IHRoZSBiaW5kaW5nIGl0c2VsZlxuICogICAwLCAvLyB0aGUgZGlyZWN0aXZlIG93bmVyXG4gKiBdXG4gKlxuICogVGhlIGNvbmZpZ3VyYXRpb24gdmFsdWVzIGFyZSBsZWZ0IG91dCBvZiB0aGUgZXhhbXBsZSBhYm92ZSBiZWNhdXNlXG4gKiB0aGUgb3JkZXJpbmcgb2YgdGhlbSBjb3VsZCBjaGFuZ2UgYmV0d2VlbiBjb2RlIHBhdGNoZXMuIFBsZWFzZSByZWFkIHRoZVxuICogZG9jdW1lbnRhdGlvbiBiZWxvdyB0byBnZXQgYSBiZXR0ZXIgdW5kZXJzdGFuZCBvZiB3aGF0IHRoZSBjb25maWd1cmF0aW9uXG4gKiB2YWx1ZXMgYXJlIGFuZCBob3cgdGhleSB3b3JrLlxuICpcbiAqIEVhY2ggdGltZSBhIGJpbmRpbmcgcHJvcGVydHkgaXMgdXBkYXRlZCAod2hldGhlciBpdCBiZSB0aHJvdWdoIGEgc2luZ2xlXG4gKiBwcm9wZXJ0eSBpbnN0cnVjdGlvbiBsaWtlIGBlbGVtZW50U3R5bGVQcm9wYCwgYGVsZW1lbnRDbGFzc1Byb3BgIG9yXG4gKiBgZWxlbWVudFN0eWxpbmdNYXBgKSB0aGVuIHRoZSB2YWx1ZXMgaW4gdGhlIGNvbnRleHQgd2lsbCBiZSB1cGRhdGVkIGFzXG4gKiB3ZWxsLlxuICpcbiAqIElmIGZvciBleGFtcGxlIGBbc3R5bGUud2lkdGhdYCB1cGRhdGVzIHRvIGA1NTVweGAgdGhlbiBpdHMgdmFsdWUgd2lsbCBiZSByZWZsZWN0ZWRcbiAqIGluIHRoZSBjb250ZXh0IGFzIHNvOlxuICpcbiAqIGNvbnRleHQgPSBbXG4gKiAgIC8vIC4uLlxuICogICBjb25maWdGb3JXaWR0aCwgLy8gdGhpcyB3aWxsIGJlIG1hcmtlZCBESVJUWVxuICogICAnd2lkdGgnXG4gKiAgICc1NTVweCcsXG4gKiAgIDAsXG4gKiAgIC8vLi5cbiAqIF1cbiAqXG4gKiBUaGUgY29udGV4dCBhbmQgZGlyZWN0aXZlIGRhdGEgd2lsbCBhbHNvIGJlIG1hcmtlZCBkaXJ0eS5cbiAqXG4gKiBEZXNwaXRlIHRoZSBjb250ZXh0IGJlaW5nIHVwZGF0ZWQsIG5vdGhpbmcgaGFzIGJlZW4gcmVuZGVyZWQgb24gc2NyZWVuIChub3Qgc3R5bGVzIG9yXG4gKiBjbGFzc2VzIGhhdmUgYmVlbiBzZXQgb24gdGhlIGVsZW1lbnQpLiBUbyBraWNrIG9mZiByZW5kZXJpbmcgZm9yIGFuIGVsZW1lbnQgdGhlIGZvbGxvd2luZ1xuICogZnVuY3Rpb24gbmVlZHMgdG8gYmUgcnVuIGBlbGVtZW50U3R5bGluZ0FwcGx5YC5cbiAqXG4gKiBgZWxlbWVudFN0eWxpbmdBcHBseWAgd2lsbCBydW4gdGhyb3VnaCB0aGUgY29udGV4dCBhbmQgZmluZCBlYWNoIGRpcnR5IHZhbHVlIGFuZCByZW5kZXIgdGhlbSBvbnRvXG4gKiB0aGUgZWxlbWVudC4gT25jZSBjb21wbGV0ZSwgYWxsIHN0eWxlcy9jbGFzc2VzIHdpbGwgYmUgc2V0IHRvIGNsZWFuLiBCZWNhdXNlIG9mIHRoaXMsIHRoZSByZW5kZXJcbiAqIGZ1bmN0aW9uIHdpbGwgbm93IGtub3cgbm90IHRvIHJlcnVuIGl0c2VsZiBhZ2FpbiBpZiBjYWxsZWQgYWdhaW4gdW5sZXNzIG5ldyBzdHlsZS9jbGFzcyB2YWx1ZXNcbiAqIGhhdmUgY2hhbmdlZC5cbiAqXG4gKiAjIyBEaXJlY3RpdmVzXG4gKiBEaXJlY3RpdmUgc3R5bGUvY2xhc3MgdmFsdWVzICh3aGljaCBhcmUgcHJvdmlkZWQgdGhyb3VnaCBob3N0IGJpbmRpbmdzKSBhcmUgYWxzbyBzdXBwb3J0ZWQgYW5kXG4gKiBob3VzZWQgd2l0aGluIHRoZSBzYW1lIHN0eWxpbmcgY29udGV4dCBhcyBhcmUgdGVtcGxhdGUtbGV2ZWwgc3R5bGUvY2xhc3MgcHJvcGVydGllcy9iaW5kaW5nc1xuICogU28gbG9uZyBhcyB0aGV5IGFyZSBhbGwgYXNzaWduZWQgdG8gdGhlIHNhbWUgZWxlbWVudCwgYm90aCBkaXJlY3RpdmUtbGV2ZWwgYW5kIHRlbXBsYXRlLWxldmVsXG4gKiBzdHlsaW5nIGJpbmRpbmdzIHNoYXJlIHRoZSBzYW1lIGNvbnRleHQuXG4gKlxuICogRWFjaCBvZiB0aGUgZm9sbG93aW5nIGluc3RydWN0aW9ucyBzdXBwb3J0cyBhY2NlcHRpbmcgYSBkaXJlY3RpdmUgaW5zdGFuY2UgYXMgYW4gaW5wdXQgcGFyYW1ldGVyOlxuICpcbiAqIC0gYGVsZW1lbnRIb3N0QXR0cnNgXG4gKiAtIGBlbGVtZW50U3R5bGluZ2BcbiAqIC0gYGVsZW1lbnRTdHlsZVByb3BgXG4gKiAtIGBlbGVtZW50Q2xhc3NQcm9wYFxuICogLSBgZWxlbWVudFN0eWxpbmdNYXBgXG4gKiAtIGBlbGVtZW50U3R5bGluZ0FwcGx5YFxuICpcbiAqIEVhY2ggdGltZSBhIGRpcmVjdGl2ZSB2YWx1ZSBpcyBwYXNzZWQgaW4sIGl0IHdpbGwgYmUgY29udmVydGVkIGludG8gYW4gaW5kZXggYnkgZXhhbWluaW5nIHRoZVxuICogZGlyZWN0aXZlIHJlZ2lzdHJ5ICh3aGljaCBsaXZlcyBpbiB0aGUgY29udGV4dCBjb25maWd1cmF0aW9uIGFyZWEpLiBUaGUgaW5kZXggaXMgdGhlbiB1c2VkXG4gKiB0byBoZWxwIHNpbmdsZSBzdHlsZSBwcm9wZXJ0aWVzIGZpZ3VyZSBvdXQgd2hlcmUgYSB2YWx1ZSBpcyBsb2NhdGVkIGluIHRoZSBjb250ZXh0LlxuICpcbiAqXG4gKiAjIyBTaW5nbGUtbGV2ZWwgc3R5bGluZyBiaW5kaW5ncyAoYFtzdHlsZS5wcm9wXWAgYW5kIGBbY2xhc3MubmFtZV1gKVxuICpcbiAqIEJvdGggYFtzdHlsZS5wcm9wXWAgYW5kIGBbY2xhc3MubmFtZV1gIGJpbmRpbmdzIGFyZSBydW4gdGhyb3VnaCB0aGUgYHVwZGF0ZVN0eWxlUHJvcGBcbiAqIGFuZCBgdXBkYXRlQ2xhc3NQcm9wYCBmdW5jdGlvbnMgcmVzcGVjdGl2ZWx5LiBUaGV5IHdvcmsgYnkgZXhhbWluaW5nIHRoZSBwcm92aWRlZFxuICogYG9mZnNldGAgdmFsdWUgYW5kIGFyZSBhYmxlIHRvIGxvY2F0ZSB0aGUgZXhhY3Qgc3BvdCBpbiB0aGUgY29udGV4dCB3aGVyZSB0aGVcbiAqIG1hdGNoaW5nIHN0eWxlIGlzIGxvY2F0ZWQuXG4gKlxuICogQm90aCBgW3N0eWxlLnByb3BdYCBhbmQgYFtjbGFzcy5uYW1lXWAgYmluZGluZ3MgYXJlIGFibGUgdG8gcHJvY2VzcyB0aGVzZSB2YWx1ZXNcbiAqIGZyb20gZGlyZWN0aXZlIGhvc3QgYmluZGluZ3MuIFdoZW4gZXZhbHVhdGVkIChmcm9tIHRoZSBob3N0IGJpbmRpbmcgZnVuY3Rpb24pIHRoZVxuICogYGRpcmVjdGl2ZVJlZmAgdmFsdWUgaXMgdGhlbiBwYXNzZWQgaW4uXG4gKlxuICogSWYgdHdvIGRpcmVjdGl2ZXMgb3IgYSBkaXJlY3RpdmUgKyBhIHRlbXBsYXRlIGJpbmRpbmcgYm90aCB3cml0ZSB0byB0aGUgc2FtZSBzdHlsZS9jbGFzc1xuICogYmluZGluZyB0aGVuIHRoZSBzdHlsaW5nIGNvbnRleHQgY29kZSB3aWxsIGRlY2lkZSB3aGljaCBvbmUgd2lucyBiYXNlZCBvbiB0aGUgZm9sbG93aW5nXG4gKiBydWxlOlxuICpcbiAqIDEuIElmIHRoZSB0ZW1wbGF0ZSBiaW5kaW5nIGhhcyBhIHZhbHVlIHRoZW4gaXQgYWx3YXlzIHdpbnNcbiAqIDIuIE90aGVyd2lzZSB3aGljaGV2ZXIgZmlyc3QtcmVnaXN0ZXJlZCBkaXJlY3RpdmUgdGhhdCBoYXMgdGhhdCB2YWx1ZSBmaXJzdCB3aWxsIHdpblxuICpcbiAqIFRoZSBjb2RlIGV4YW1wbGUgaGVscHMgbWFrZSB0aGlzIGNsZWFyOlxuICpcbiAqIGBgYFxuICogPCEtLVxuICogPGRpdiBbc3R5bGUud2lkdGhdPVwibXlXaWR0aFwiXG4gKiAgICAgIFtteS13aWR0aC1kaXJlY3RpdmVdPVwiJzYwMHB4J1wiPlxuICogLS0+XG4gKlxuICogQERpcmVjdGl2ZSh7XG4gKiAgc2VsZWN0b3I6ICdbbXktd2lkdGgtZGlyZWN0aXZlJ11cbiAqIH0pXG4gKiBjbGFzcyBNeVdpZHRoRGlyZWN0aXZlIHtcbiAqICAgQElucHV0KCdteS13aWR0aC1kaXJlY3RpdmUnKVxuICogICBASG9zdEJpbmRpbmcoJ3N0eWxlLndpZHRoJylcbiAqICAgcHVibGljIHdpZHRoID0gbnVsbDtcbiAqIH1cbiAqIGBgYFxuICpcbiAqIFNpbmNlIHRoZXJlIGlzIGEgc3R5bGUgYmluZGluZyBmb3Igd2lkdGggcHJlc2VudCBvbiB0aGUgZWxlbWVudCAoYFtzdHlsZS53aWR0aF1gKSB0aGVuXG4gKiBpdCB3aWxsIGFsd2F5cyB3aW4gb3ZlciB0aGUgd2lkdGggYmluZGluZyB0aGF0IGlzIHByZXNlbnQgYXMgYSBob3N0IGJpbmRpbmcgd2l0aGluXG4gKiB0aGUgYE15V2lkdGhEaXJlY3RpdmVgLiBIb3dldmVyLCBpZiBgW3N0eWxlLndpZHRoXWAgcmVuZGVycyBhcyBgbnVsbGAgKHNvIGBteVdpZHRoPW51bGxgKVxuICogdGhlbiB0aGUgYE15V2lkdGhEaXJlY3RpdmVgIHdpbGwgYmUgYWJsZSB0byB3cml0ZSB0byB0aGUgYHdpZHRoYCBzdHlsZSB3aXRoaW4gdGhlIGNvbnRleHQuXG4gKiBTaW1wbHkgcHV0LCB3aGljaGV2ZXIgZGlyZWN0aXZlIHdyaXRlcyB0byBhIHZhbHVlIGZpcnN0IGVuZHMgdXAgaGF2aW5nIG93bmVyc2hpcCBvZiBpdCBhc1xuICogbG9uZyBhcyB0aGUgdGVtcGxhdGUgZGlkbid0IHNldCBhbnl0aGluZy5cbiAqXG4gKiBUaGUgd2F5IGluIHdoaWNoIHRoZSBvd25lcnNoaXAgaXMgZmFjaWxpdGF0ZWQgaXMgdGhyb3VnaCBpbmRleCB2YWx1ZS4gVGhlIGVhcmxpZXN0IGRpcmVjdGl2ZXNcbiAqIGdldCB0aGUgc21hbGxlc3QgaW5kZXggdmFsdWVzICh3aXRoIDAgYmVpbmcgcmVzZXJ2ZWQgZm9yIHRoZSB0ZW1wbGF0ZSBlbGVtZW50IGJpbmRpbmdzKS4gRWFjaFxuICogdGltZSBhIHZhbHVlIGlzIHdyaXR0ZW4gZnJvbSBhIGRpcmVjdGl2ZSBvciB0aGUgdGVtcGxhdGUgYmluZGluZ3MsIHRoZSB2YWx1ZSBpdHNlbGYgZ2V0c1xuICogYXNzaWduZWQgdGhlIGRpcmVjdGl2ZSBpbmRleCB2YWx1ZSBpbiBpdHMgZGF0YS4gSWYgYW5vdGhlciBkaXJlY3RpdmUgd3JpdGVzIGEgdmFsdWUgYWdhaW4gdGhlblxuICogaXRzIGRpcmVjdGl2ZSBpbmRleCBnZXRzIGNvbXBhcmVkIGFnYWluc3QgdGhlIGRpcmVjdGl2ZSBpbmRleCB0aGF0IGV4aXN0cyBvbiB0aGUgZWxlbWVudC4gT25seVxuICogd2hlbiB0aGUgbmV3IHZhbHVlJ3MgZGlyZWN0aXZlIGluZGV4IGlzIGxlc3MgdGhhbiB0aGUgZXhpc3RpbmcgZGlyZWN0aXZlIGluZGV4IHRoZW4gdGhlIG5ld1xuICogdmFsdWUgd2lsbCBiZSB3cml0dGVuIHRvIHRoZSBjb250ZXh0LiBCdXQsIGlmIHRoZSBleGlzdGluZyB2YWx1ZSBpcyBudWxsIHRoZW4gdGhlIG5ldyB2YWx1ZSBpc1xuICogd3JpdHRlbiBieSB0aGUgbGVzcyBpbXBvcnRhbnQgZGlyZWN0aXZlLlxuICpcbiAqIEVhY2ggZGlyZWN0aXZlIGFsc28gaGFzIGl0cyBvd24gc2FuaXRpemVyIGFuZCBkaXJ0eSBmbGFncy4gVGhlc2UgdmFsdWVzIGFyZSBjb25zdW1lZCB3aXRoaW4gdGhlXG4gKiByZW5kZXJpbmcgZnVuY3Rpb24uXG4gKlxuICpcbiAqICMjIE11bHRpLWxldmVsIHN0eWxpbmcgYmluZGluZ3MgKGBbc3R5bGVdYCBhbmQgYFtjbGFzc11gKVxuICpcbiAqIE11bHRpLWxldmVsIHN0eWxpbmcgYmluZGluZ3MgYXJlIHRyZWF0ZWQgYXMgbGVzcyBpbXBvcnRhbnQgKGxlc3Mgc3BlY2lmaWMpIGFzIHNpbmdsZS1sZXZlbFxuICogYmluZGluZ3MgKHRoaW5ncyBsaWtlIGBbc3R5bGUucHJvcF1gIGFuZCBgW2NsYXNzLm5hbWVdYCkuXG4gKlxuICogTXVsdGktbGV2ZWwgYmluZGluZ3MgYXJlIHN0aWxsIGFwcGxpZWQgdG8gdGhlIGNvbnRleHQgaW4gYSBzaW1pbGFyIHdheSBhcyBhcmUgc2luZ2xlIGxldmVsXG4gKiBiaW5kaW5ncywgYnV0IHRoaXMgcHJvY2VzcyB3b3JrcyBieSBkaWZmaW5nIHRoZSBuZXcgbXVsdGktbGV2ZWwgdmFsdWVzICh3aGljaCBhcmUga2V5L3ZhbHVlXG4gKiBtYXBzKSBhZ2FpbnN0IHRoZSBleGlzdGluZyBzZXQgb2Ygc3R5bGVzIHRoYXQgbGl2ZSBpbiB0aGUgY29udGV4dC4gRWFjaCB0aW1lIGEgbmV3IG1hcCB2YWx1ZVxuICogaXMgZGV0ZWN0ZWQgKHZpYSBpZGVudGl0eSBjaGVjaykgdGhlbiBpdCB3aWxsIGxvb3AgdGhyb3VnaCB0aGUgdmFsdWVzIGFuZCBmaWd1cmUgb3V0IHdoYXRcbiAqIGhhcyBjaGFuZ2VkIGFuZCByZW9yZGVyIHRoZSBjb250ZXh0IGFycmF5IHRvIG1hdGNoIHRoZSBvcmRlcmluZyBvZiB0aGUga2V5cy4gVGhpcyByZW9yZGVyaW5nXG4gKiBvZiB0aGUgY29udGV4dCBtYWtlcyBzdXJlIHRoYXQgZm9sbG93LXVwIHRyYXZlcnNhbHMgb2YgdGhlIGNvbnRleHQgd2hlbiB1cGRhdGVkIGFnYWluc3QgdGhlXG4gKiBrZXkvdmFsdWUgbWFwIGFyZSBhcyBjbG9zZSBhcyBwb3NzaWJsZSB0byBvKG4pICh3aGVyZSBcIm5cIiBpcyB0aGUgc2l6ZSBvZiB0aGUga2V5L3ZhbHVlIG1hcCkuXG4gKlxuICogSWYgYSBgZGlyZWN0aXZlUmVmYCB2YWx1ZSBpcyBwYXNzZWQgaW4gdGhlbiB0aGUgc3R5bGluZyBhbGdvcml0aG0gY29kZSB3aWxsIHRha2UgdGhlIGRpcmVjdGl2ZSdzXG4gKiBwcmlvcml0aXphdGlvbiBpbmRleCBpbnRvIGFjY291bnQgYW5kIHVwZGF0ZSB0aGUgdmFsdWVzIHdpdGggcmVzcGVjdCB0byBtb3JlIGltcG9ydGFudFxuICogZGlyZWN0aXZlcy4gVGhpcyBtZWFucyB0aGF0IGlmIGEgdmFsdWUgc3VjaCBhcyBgd2lkdGhgIGlzIHVwZGF0ZWQgaW4gdHdvIGRpZmZlcmVudCBgW3N0eWxlXWBcbiAqIGJpbmRpbmdzIChzYXkgb25lIG9uIHRoZSB0ZW1wbGF0ZSBhbmQgYW5vdGhlciB3aXRoaW4gYSBkaXJlY3RpdmUgdGhhdCBzaXRzIG9uIHRoZSBzYW1lIGVsZW1lbnQpXG4gKiB0aGVuIHRoZSBhbGdvcml0aG0gd2lsbCBkZWNpZGUgaG93IHRvIHVwZGF0ZSB0aGUgdmFsdWUgYmFzZWQgb24gdGhlIGZvbGxvd2luZyBoZXVyaXN0aWM6XG4gKlxuICogMS4gSWYgdGhlIHRlbXBsYXRlIGJpbmRpbmcgaGFzIGEgdmFsdWUgdGhlbiBpdCBhbHdheXMgd2luc1xuICogMi4gSWYgbm90IHRoZW4gd2hpY2hldmVyIGZpcnN0LXJlZ2lzdGVyZWQgZGlyZWN0aXZlIHRoYXQgaGFzIHRoYXQgdmFsdWUgZmlyc3Qgd2lsbCB3aW5cbiAqXG4gKiBJdCB3aWxsIGFsc28gdXBkYXRlIHRoZSB2YWx1ZSBpZiBpdCB3YXMgc2V0IHRvIGBudWxsYCBieSBhIHByZXZpb3VzIGRpcmVjdGl2ZSAob3IgdGhlIHRlbXBsYXRlKS5cbiAqXG4gKiBFYWNoIHRpbWUgYSB2YWx1ZSBpcyB1cGRhdGVkIChvciByZW1vdmVkKSB0aGVuIHRoZSBjb250ZXh0IHdpbGwgY2hhbmdlIHNoYXBlIHRvIGJldHRlciBtYXRjaFxuICogdGhlIG9yZGVyaW5nIG9mIHRoZSBzdHlsaW5nIGRhdGEgYXMgd2VsbCBhcyB0aGUgb3JkZXJpbmcgb2YgZWFjaCBkaXJlY3RpdmUgdGhhdCBjb250YWlucyBzdHlsaW5nXG4gKiBkYXRhLiAoU2VlIGBwYXRjaFN0eWxpbmdNYXBJbnRvQ29udGV4dGAgaW5zaWRlIG9mIGNsYXNzX2FuZF9zdHlsZV9iaW5kaW5ncy50cyB0byBiZXR0ZXJcbiAqIHVuZGVyc3RhbmQgaG93IHRoaXMgd29ya3MuKVxuICpcbiAqICMjIFJlbmRlcmluZ1xuICogVGhlIHJlbmRlcmluZyBtZWNoYW5pc20gKHdoZW4gdGhlIHN0eWxpbmcgZGF0YSBpcyBhcHBsaWVkIG9uIHNjcmVlbikgb2NjdXJzIHZpYSB0aGVcbiAqIGBlbGVtZW50U3R5bGluZ0FwcGx5YCBmdW5jdGlvbiBhbmQgaXMgZGVzaWduZWQgdG8gcnVuIGFmdGVyICoqYWxsKiogc3R5bGluZyBmdW5jdGlvbnMgaGF2ZSBiZWVuXG4gKiBldmFsdWF0ZWQuIFRoZSByZW5kZXJpbmcgYWxnb3JpdGhtIHdpbGwgbG9vcCBvdmVyIHRoZSBjb250ZXh0IGFuZCBvbmx5IGFwcGx5IHRoZSBzdHlsZXMgdGhhdCBhcmVcbiAqIGZsYWdnZWQgYXMgZGlydHkgKGVpdGhlciBiZWNhdXNlIHRoZXkgYXJlIG5ldywgdXBkYXRlZCBvciBoYXZlIGJlZW4gcmVtb3ZlZCB2aWEgbXVsdGkgb3JcbiAqIHNpbmdsZSBiaW5kaW5ncykuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgU3R5bGluZ0NvbnRleHQgZXh0ZW5kc1xuICAgIEFycmF5PHtba2V5OiBzdHJpbmddOiBhbnl9fG51bWJlcnxzdHJpbmd8Ym9vbGVhbnxSRWxlbWVudHxTdHlsZVNhbml0aXplRm58UGxheWVyQ29udGV4dHxudWxsPiB7XG4gIC8qKlxuICAgKiBMb2NhdGlvbiBvZiBlbGVtZW50IHRoYXQgaXMgdXNlZCBhcyBhIHRhcmdldCBmb3IgdGhpcyBjb250ZXh0LlxuICAgKi9cbiAgW1N0eWxpbmdJbmRleC5FbGVtZW50UG9zaXRpb25dOiBMQ29udGFpbmVyfExWaWV3fFJFbGVtZW50fG51bGw7XG5cbiAgLyoqXG4gICAqIEEgbnVtZXJpYyB2YWx1ZSByZXByZXNlbnRpbmcgdGhlIGNvbmZpZ3VyYXRpb24gc3RhdHVzICh3aGV0aGVyIHRoZSBjb250ZXh0IGlzIGRpcnR5IG9yIG5vdClcbiAgICogbWl4ZWQgdG9nZXRoZXIgKHVzaW5nIGJpdCBzaGlmdGluZykgd2l0aCBhIGluZGV4IHZhbHVlIHdoaWNoIHRlbGxzIHRoZSBzdGFydGluZyBpbmRleCB2YWx1ZVxuICAgKiBvZiB3aGVyZSB0aGUgbXVsdGkgc3R5bGUgZW50cmllcyBiZWdpbi5cbiAgICovXG4gIFtTdHlsaW5nSW5kZXguTWFzdGVyRmxhZ1Bvc2l0aW9uXTogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBMb2NhdGlvbiBvZiB0aGUgY29sbGVjdGlvbiBvZiBkaXJlY3RpdmVzIGZvciB0aGlzIGNvbnRleHRcbiAgICovXG4gIFtTdHlsaW5nSW5kZXguRGlyZWN0aXZlUmVnaXN0cnlQb3NpdGlvbl06IERpcmVjdGl2ZVJlZ2lzdHJ5VmFsdWVzO1xuXG4gIC8qKlxuICAgKiBMb2NhdGlvbiBvZiBhbGwgc3RhdGljIHN0eWxlcyB2YWx1ZXNcbiAgICovXG4gIFtTdHlsaW5nSW5kZXguSW5pdGlhbFN0eWxlVmFsdWVzUG9zaXRpb25dOiBJbml0aWFsU3R5bGluZ1ZhbHVlcztcblxuICAvKipcbiAgICogTG9jYXRpb24gb2YgYWxsIHN0YXRpYyBjbGFzcyB2YWx1ZXNcbiAgICovXG4gIFtTdHlsaW5nSW5kZXguSW5pdGlhbENsYXNzVmFsdWVzUG9zaXRpb25dOiBJbml0aWFsU3R5bGluZ1ZhbHVlcztcblxuICAvKipcbiAgICogQSBudW1lcmljIHZhbHVlIHJlcHJlc2VudGluZyB0aGUgY2xhc3MgaW5kZXggb2Zmc2V0IHZhbHVlLiBXaGVuZXZlciBhIHNpbmdsZSBjbGFzcyBpc1xuICAgKiBhcHBsaWVkICh1c2luZyBgZWxlbWVudENsYXNzUHJvcGApIGl0IHNob3VsZCBoYXZlIGFuIHN0eWxpbmcgaW5kZXggdmFsdWUgdGhhdCBkb2Vzbid0XG4gICAqIG5lZWQgdG8gdGFrZSBpbnRvIGFjY291bnQgYW55IHN0eWxlIHZhbHVlcyB0aGF0IGV4aXN0IGluIHRoZSBjb250ZXh0LlxuICAgKi9cbiAgW1N0eWxpbmdJbmRleC5TaW5nbGVQcm9wT2Zmc2V0UG9zaXRpb25zXTogU2luZ2xlUHJvcE9mZnNldFZhbHVlcztcblxuICAvKipcbiAgICogVGhlIGxhc3QgY2xhc3MgdmFsdWUgdGhhdCB3YXMgaW50ZXJwcmV0ZWQgYnkgZWxlbWVudFN0eWxpbmdNYXAuIFRoaXMgaXMgY2FjaGVkXG4gICAqIFNvIHRoYXQgdGhlIGFsZ29yaXRobSBjYW4gZXhpdCBlYXJseSBpbmNhc2UgdGhlIHZhbHVlIGhhcyBub3QgY2hhbmdlZC5cbiAgICovXG4gIFtTdHlsaW5nSW5kZXguQ2FjaGVkTXVsdGlDbGFzc2VzXTogYW55fE1hcEJhc2VkT2Zmc2V0VmFsdWVzO1xuXG4gIC8qKlxuICAgKiBUaGUgbGFzdCBzdHlsZSB2YWx1ZSB0aGF0IHdhcyBpbnRlcnByZXRlZCBieSBlbGVtZW50U3R5bGluZ01hcC4gVGhpcyBpcyBjYWNoZWRcbiAgICogU28gdGhhdCB0aGUgYWxnb3JpdGhtIGNhbiBleGl0IGVhcmx5IGluY2FzZSB0aGUgdmFsdWUgaGFzIG5vdCBjaGFuZ2VkLlxuICAgKi9cbiAgW1N0eWxpbmdJbmRleC5DYWNoZWRNdWx0aVN0eWxlc106IGFueXxNYXBCYXNlZE9mZnNldFZhbHVlcztcblxuICAvKipcbiAgICogTG9jYXRpb24gb2YgYW5pbWF0aW9uIGNvbnRleHQgKHdoaWNoIGNvbnRhaW5zIHRoZSBhY3RpdmUgcGxheWVycykgZm9yIHRoaXMgZWxlbWVudCBzdHlsaW5nXG4gICAqIGNvbnRleHQuXG4gICAqL1xuICBbU3R5bGluZ0luZGV4LlBsYXllckNvbnRleHRdOiBQbGF5ZXJDb250ZXh0fG51bGw7XG59XG5cbi8qKlxuICogVXNlZCBhcyBhIHN0eWxpbmcgYXJyYXkgdG8gaG91c2Ugc3RhdGljIGNsYXNzIGFuZCBzdHlsZSB2YWx1ZXMgdGhhdCB3ZXJlIGV4dHJhY3RlZFxuICogYnkgdGhlIGNvbXBpbGVyIGFuZCBwbGFjZWQgaW4gdGhlIGFuaW1hdGlvbiBjb250ZXh0IHZpYSBgZWxlbWVudFN0YXJ0YCBhbmRcbiAqIGBlbGVtZW50SG9zdEF0dHJzYC5cbiAqXG4gKiBTZWUgW0luaXRpYWxTdHlsaW5nVmFsdWVzSW5kZXhdIGZvciBhIGJyZWFrZG93biBvZiBob3cgYWxsIHRoaXMgd29ya3MuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgSW5pdGlhbFN0eWxpbmdWYWx1ZXMgZXh0ZW5kcyBBcnJheTxzdHJpbmd8Ym9vbGVhbnxudW1iZXJ8bnVsbD4ge1xuICBbSW5pdGlhbFN0eWxpbmdWYWx1ZXNJbmRleC5EZWZhdWx0TnVsbFZhbHVlUG9zaXRpb25dOiBudWxsO1xuICBbSW5pdGlhbFN0eWxpbmdWYWx1ZXNJbmRleC5DYWNoZWRTdHJpbmdWYWx1ZVBvc2l0aW9uXTogc3RyaW5nfG51bGw7XG59XG5cbi8qKlxuICogVXNlZCBhcyBhbiBvZmZzZXQvcG9zaXRpb24gaW5kZXggdG8gZmlndXJlIG91dCB3aGVyZSBpbml0aWFsIHN0eWxpbmdcbiAqIHZhbHVlcyBhcmUgbG9jYXRlZC5cbiAqXG4gKiBVc2VkIGFzIGEgcmVmZXJlbmNlIHBvaW50IHRvIHByb3ZpZGUgbWFya2VycyB0byBhbGwgc3RhdGljIHN0eWxpbmdcbiAqIHZhbHVlcyAodGhlIGluaXRpYWwgc3R5bGUgYW5kIGNsYXNzIHZhbHVlcyBvbiBhbiBlbGVtZW50KSB3aXRoaW4gYW5cbiAqIGFycmF5IHdpdGhpbiB0aGUgYFN0eWxpbmdDb250ZXh0YC4gVGhpcyBhcnJheSBjb250YWlucyBrZXkvdmFsdWUgcGFpcnNcbiAqIHdoZXJlIHRoZSBrZXkgaXMgdGhlIHN0eWxlIHByb3BlcnR5IG5hbWUgb3IgY2xhc3NOYW1lIGFuZCB0aGUgdmFsdWUgaXNcbiAqIHRoZSBzdHlsZSB2YWx1ZSBvciB3aGV0aGVyIG9yIG5vdCBhIGNsYXNzIGlzIHByZXNlbnQgb24gdGhlIGVsbWVudC5cbiAqXG4gKiBUaGUgZmlyc3QgdmFsdWUgaXMgYWx3YXlzIG51bGwgc28gdGhhdCBhIGluaXRpYWwgaW5kZXggdmFsdWUgb2ZcbiAqIGAwYCB3aWxsIGFsd2F5cyBwb2ludCB0byBhIG51bGwgdmFsdWUuXG4gKlxuICogVGhlIHNlY29uZCB2YWx1ZSBpcyBhbHNvIGFsd2F5cyBudWxsIHVubGVzcyBhIHN0cmluZy1iYXNlZCByZXByZXNlbnRhdGlvblxuICogb2YgdGhlIHN0eWxpbmcgZGF0YSB3YXMgY29uc3RydWN0ZWQgKGl0IGdldHMgY2FjaGVkIGluIHRoaXMgc2xvdCkuXG4gKlxuICogSWYgYSA8ZGl2PiBlbGVtZW50cyBjb250YWlucyBhIGxpc3Qgb2Ygc3RhdGljIHN0eWxpbmcgdmFsdWVzIGxpa2Ugc286XG4gKlxuICogPGRpdiBjbGFzcz1cImZvbyBiYXIgYmF6XCIgc3R5bGU9XCJ3aWR0aDoxMDBweDsgaGVpZ2h0OjIwMHB4O1wiPlxuICpcbiAqIFRoZW4gdGhlIGluaXRpYWwgc3R5bGVzIGZvciB0aGF0IHdpbGwgbG9vayBsaWtlIHNvOlxuICpcbiAqIFN0eWxlczpcbiAqIGBgYFxuICogU3R5bGluZ0NvbnRleHRbSW5pdGlhbFN0eWxlc0luZGV4XSA9IFtcbiAqICAgbnVsbCwgbnVsbCwgJ3dpZHRoJywgJzEwMHB4JywgaGVpZ2h0LCAnMjAwcHgnXG4gKiBdXG4gKiBgYGBcbiAqXG4gKiBDbGFzc2VzOlxuICogYGBgXG4gKiBTdHlsaW5nQ29udGV4dFtJbml0aWFsQ2xhc3Nlc0luZGV4XSA9IFtcbiAqICAgbnVsbCwgbnVsbCwgJ2ZvbycsIHRydWUsICdiYXInLCB0cnVlLCAnYmF6JywgdHJ1ZVxuICogXVxuICogYGBgXG4gKlxuICogSW5pdGlhbCBzdHlsZSBhbmQgY2xhc3MgZW50cmllcyBoYXZlIHRoZWlyIG93biBhcnJheXMuIFRoaXMgaXMgYmVjYXVzZVxuICogaXQncyBlYXNpZXIgdG8gYWRkIHRvIHRoZSBlbmQgb2Ygb25lIGFycmF5IGFuZCBub3QgdGhlbiBoYXZlIHRvIHVwZGF0ZVxuICogZXZlcnkgY29udGV4dCBlbnRyaWVzJyBwb2ludGVyIGluZGV4IHRvIHRoZSBuZXdseSBvZmZzZXRlZCB2YWx1ZXMuXG4gKlxuICogV2hlbiBwcm9wZXJ0eSBiaW5kaW5kcyBhcmUgYWRkZWQgdG8gYSBjb250ZXh0IHRoZW4gaW5pdGlhbCBzdHlsZS9jbGFzc1xuICogdmFsdWVzIHdpbGwgYWxzbyBiZSBpbnNlcnRlZCBpbnRvIHRoZSBhcnJheS4gVGhpcyBpcyB0byBjcmVhdGUgYSBzcGFjZVxuICogaW4gdGhlIHNpdHVhdGlvbiB3aGVuIGEgZm9sbG93LXVwIGRpcmVjdGl2ZSBpbnNlcnRzIHN0YXRpYyBzdHlsaW5nIGludG9cbiAqIHRoZSBhcnJheS4gQnkgZGVmYXVsdCwgc3R5bGUgdmFsdWVzIGFyZSBgbnVsbGAgYW5kIGNsYXNzIHZhbHVlcyBhcmVcbiAqIGBmYWxzZWAgd2hlbiBpbnNlcnRlZCBieSBwcm9wZXJ0eSBiaW5kaW5ncy5cbiAqXG4gKiBGb3IgZXhhbXBsZTpcbiAqIGBgYFxuICogPGRpdiBjbGFzcz1cImZvbyBiYXIgYmF6XCJcbiAqICAgICAgW2NsYXNzLmNhcl09XCJteUNhckV4cFwiXG4gKiAgICAgIHN0eWxlPVwid2lkdGg6MTAwcHg7IGhlaWdodDoyMDBweDtcIlxuICogICAgICBbc3R5bGUub3BhY2l0eV09XCJteU9wYWNpdHlFeHBcIj5cbiAqIGBgYFxuICpcbiAqIFdpbGwgY29uc3RydWN0IGluaXRpYWwgc3R5bGluZyB2YWx1ZXMgdGhhdCBsb29rIGxpa2U6XG4gKlxuICogU3R5bGVzOlxuICogYGBgXG4gKiBTdHlsaW5nQ29udGV4dFtJbml0aWFsU3R5bGVzSW5kZXhdID0gW1xuICogICBudWxsLCBudWxsLCAnd2lkdGgnLCAnMTAwcHgnLCBoZWlnaHQsICcyMDBweCcsICdvcGFjaXR5JywgbnVsbFxuICogXVxuICogYGBgXG4gKlxuICogQ2xhc3NlczpcbiAqIGBgYFxuICogU3R5bGluZ0NvbnRleHRbSW5pdGlhbENsYXNzZXNJbmRleF0gPSBbXG4gKiAgIG51bGwsIG51bGwsICdmb28nLCB0cnVlLCAnYmFyJywgdHJ1ZSwgJ2JheicsIHRydWUsICdjYXInLCBmYWxzZVxuICogXVxuICogYGBgXG4gKlxuICogTm93IGlmIGEgZGlyZWN0aXZlIGNvbWVzIGFsb25nIGFuZCBpbnRyb2R1Y2VzIGBjYXJgIGFzIGEgc3RhdGljXG4gKiBjbGFzcyB2YWx1ZSBvciBgb3BhY2l0eWAgdGhlbiB0aG9zZSB2YWx1ZXMgd2lsbCBiZSBmaWxsZWQgaW50b1xuICogdGhlIGluaXRpYWwgc3R5bGVzIGFycmF5LlxuICpcbiAqIEZvciBleGFtcGxlOlxuICpcbiAqIGBgYFxuICogQERpcmVjdGl2ZSh7XG4gKiAgIHNlbGVjdG9yOiAnb3BhY2l0eS1jYXItZGlyZWN0aXZlJyxcbiAqICAgaG9zdDoge1xuICogICAgICdzdHlsZSc6ICdvcGFjaXR5OjAuNScsXG4gKiAgICAgJ2NsYXNzJzogJ2NhcidcbiAqICAgfVxuICogfSlcbiAqIGNsYXNzIE9wYWNpdHlDYXJEaXJlY3RpdmUge31cbiAqIGBgYFxuICpcbiAqIFRoaXMgd2lsbCByZW5kZXIgaXRzZWxmIGFzOlxuICpcbiAqIFN0eWxlczpcbiAqIGBgYFxuICogU3R5bGluZ0NvbnRleHRbSW5pdGlhbFN0eWxlc0luZGV4XSA9IFtcbiAqICAgbnVsbCwgbnVsbCwgJ3dpZHRoJywgJzEwMHB4JywgaGVpZ2h0LCAnMjAwcHgnLCAnb3BhY2l0eScsICcwLjUnXG4gKiBdXG4gKiBgYGBcbiAqXG4gKiBDbGFzc2VzOlxuICogYGBgXG4gKiBTdHlsaW5nQ29udGV4dFtJbml0aWFsQ2xhc3Nlc0luZGV4XSA9IFtcbiAqICAgbnVsbCwgbnVsbCwgJ2ZvbycsIHRydWUsICdiYXInLCB0cnVlLCAnYmF6JywgdHJ1ZSwgJ2NhcicsIHRydWVcbiAqIF1cbiAqIGBgYFxuICovXG5leHBvcnQgY29uc3QgZW51bSBJbml0aWFsU3R5bGluZ1ZhbHVlc0luZGV4IHtcbiAgLyoqXG4gICAqIFRoZSBmaXJzdCB2YWx1ZSBpcyBhbHdheXMgYG51bGxgIHNvIHRoYXQgYHN0eWxlc1swXSA9PSBudWxsYCBmb3IgdW5hc3NpZ25lZCB2YWx1ZXNcbiAgICovXG4gIERlZmF1bHROdWxsVmFsdWVQb3NpdGlvbiA9IDAsXG5cbiAgLyoqXG4gICAqIFVzZWQgZm9yIG5vbi1zdHlsaW5nIGNvZGUgdG8gZXhhbWluZSB3aGF0IHRoZSBzdHlsZSBvciBjbGFzc05hbWUgc3RyaW5nIGlzOlxuICAgKiBzdHlsZXM6IFsnd2lkdGgnLCAnMTAwcHgnLCAwLCAnb3BhY2l0eScsIG51bGwsIDAsICdoZWlnaHQnLCAnMjAwcHgnLCAwXVxuICAgKiAgICA9PiBpbml0aWFsU3R5bGVzW0NhY2hlZFN0cmluZ1ZhbHVlUG9zaXRpb25dID0gJ3dpZHRoOjEwMHB4O2hlaWdodDoyMDBweCc7XG4gICAqIGNsYXNzZXM6IFsnZm9vJywgdHJ1ZSwgMCwgJ2JhcicsIGZhbHNlLCAwLCAnYmF6JywgdHJ1ZSwgMF1cbiAgICogICAgPT4gaW5pdGlhbENsYXNzZXNbQ2FjaGVkU3RyaW5nVmFsdWVQb3NpdGlvbl0gPSAnZm9vIGJhcic7XG4gICAqXG4gICAqIE5vdGUgdGhhdCB0aGlzIHZhbHVlIGlzIGBudWxsYCBieSBkZWZhdWx0IGFuZCBpdCB3aWxsIG9ubHkgYmUgcG9wdWxhdGVkXG4gICAqIG9uY2UgYGdldEluaXRpYWxTdHlsZVN0cmluZ1ZhbHVlYCBvciBgZ2V0SW5pdGlhbENsYXNzTmFtZVZhbHVlYCBpcyBleGVjdXRlZC5cbiAgICovXG4gIENhY2hlZFN0cmluZ1ZhbHVlUG9zaXRpb24gPSAxLFxuXG4gIC8qKlxuICAgKiBXaGVyZSB0aGUgc3R5bGUgb3IgY2xhc3MgdmFsdWVzIHN0YXJ0IGluIHRoZSB0dXBsZVxuICAgKi9cbiAgS2V5VmFsdWVTdGFydFBvc2l0aW9uID0gMixcblxuICAvKipcbiAgICogVGhlIG9mZnNldCB2YWx1ZSAoaW5kZXggKyBvZmZzZXQpIGZvciB0aGUgcHJvcGVydHkgdmFsdWUgZm9yIGVhY2ggc3R5bGUvY2xhc3MgZW50cnlcbiAgICovXG4gIFByb3BPZmZzZXQgPSAwLFxuXG4gIC8qKlxuICAgKiBUaGUgb2Zmc2V0IHZhbHVlIChpbmRleCArIG9mZnNldCkgZm9yIHRoZSBzdHlsZS9jbGFzcyB2YWx1ZSBmb3IgZWFjaCBzdHlsZS9jbGFzcyBlbnRyeVxuICAgKi9cbiAgVmFsdWVPZmZzZXQgPSAxLFxuXG4gIC8qKlxuICAgKiBUaGUgb2Zmc2V0IHZhbHVlIChpbmRleCArIG9mZnNldCkgZm9yIHRoZSBzdHlsZS9jbGFzcyBkaXJlY3RpdmUgb3duZXIgZm9yIGVhY2ggc3R5bGUvY2xhc3NcbiAgICAgZW50cnlcbiAgICovXG4gIERpcmVjdGl2ZU93bmVyT2Zmc2V0ID0gMixcblxuICAvKipcbiAgICogVGhlIGZpcnN0IGJpdCBzZXQgYXNpZGUgdG8gbWFyayBpZiB0aGUgaW5pdGlhbCBzdHlsZSB3YXMgYWxyZWFkeSByZW5kZXJlXG4gICAqL1xuICBBcHBsaWVkRmxhZ0JpdFBvc2l0aW9uID0gMGIwLFxuICBBcHBsaWVkRmxhZ0JpdExlbmd0aCA9IDEsXG5cbiAgLyoqXG4gICAqIFRoZSB0b3RhbCBzaXplIGZvciBlYWNoIHN0eWxlL2NsYXNzIGVudHJ5IChwcm9wICsgdmFsdWUgKyBkaXJlY3RpdmVPd25lcilcbiAgICovXG4gIFNpemUgPSAzXG59XG5cbi8qKlxuICogQW4gYXJyYXkgbG9jYXRlZCBpbiB0aGUgU3R5bGluZ0NvbnRleHQgdGhhdCBob3VzZXMgYWxsIGRpcmVjdGl2ZSBpbnN0YW5jZXMgYW5kIGFkZGl0aW9uYWxcbiAqIGRhdGEgYWJvdXQgdGhlbS5cbiAqXG4gKiBFYWNoIGVudHJ5IGluIHRoaXMgYXJyYXkgcmVwcmVzZW50cyBhIHNvdXJjZSBvZiB3aGVyZSBzdHlsZS9jbGFzcyBiaW5kaW5nIHZhbHVlcyBjb3VsZFxuICogY29tZSBmcm9tLiBCeSBkZWZhdWx0LCB0aGVyZSBpcyBhbHdheXMgYXQgbGVhc3Qgb25lIGRpcmVjdGl2ZSBoZXJlIHdpdGggYSBudWxsIHZhbHVlIGFuZFxuICogdGhhdCByZXByZXNlbnRzIGJpbmRpbmdzIHRoYXQgbGl2ZSBkaXJlY3RseSBvbiBhbiBlbGVtZW50IGluIHRoZSB0ZW1wbGF0ZSAobm90IGhvc3QgYmluZGluZ3MpLlxuICpcbiAqIEVhY2ggc3VjY2Vzc2l2ZSBlbnRyeSBpbiB0aGUgYXJyYXkgaXMgYW4gYWN0dWFsIGluc3RhbmNlIG9mIGEgZGlyZWN0aXZlIGFzIHdlbGwgYXMgc29tZVxuICogYWRkaXRpb25hbCBpbmZvIGFib3V0IHRoYXQgZW50cnkuXG4gKlxuICogQW4gZW50cnkgd2l0aGluIHRoaXMgYXJyYXkgaGFzIHRoZSBmb2xsb3dpbmcgdmFsdWVzOlxuICogWzBdID0gVGhlIGluc3RhbmNlIG9mIHRoZSBkaXJlY3RpdmUgKHRoZSBmaXJzdCBlbnRyeSBpcyBudWxsIGJlY2F1c2UgaXRzIHJlc2VydmVkIGZvciB0aGVcbiAqICAgICAgIHRlbXBsYXRlKVxuICogWzFdID0gVGhlIHBvaW50ZXIgdGhhdCB0ZWxscyB3aGVyZSB0aGUgc2luZ2xlIHN0eWxpbmcgKHN0dWZmIGxpa2UgW2NsYXNzLmZvb10gYW5kIFtzdHlsZS5wcm9wXSlcbiAqICAgICAgIG9mZnNldCB2YWx1ZXMgYXJlIGxvY2F0ZWQuIFRoaXMgdmFsdWUgd2lsbCBhbGxvdyBmb3IgYSBiaW5kaW5nIGluc3RydWN0aW9uIHRvIGZpbmQgZXhhY3RseVxuICogICAgICAgd2hlcmUgYSBzdHlsZSBpcyBsb2NhdGVkLlxuICogWzJdID0gV2hldGhlciBvciBub3QgdGhlIGRpcmVjdGl2ZSBoYXMgYW55IHN0eWxpbmcgdmFsdWVzIHRoYXQgYXJlIGRpcnR5LiBUaGlzIGlzIHVzZWQgYXNcbiAqICAgICAgIHJlZmVyZW5jZSB3aXRoaW4gdGhlIGByZW5kZXJTdHlsaW5nYCBmdW5jdGlvbiB0byBkZWNpZGUgd2hldGhlciB0byBza2lwIGl0ZXJhdGluZ1xuICogICAgICAgdGhyb3VnaCB0aGUgY29udGV4dCB3aGVuIHJlbmRlcmluZyBpcyBleGVjdXRlZC5cbiAqIFszXSA9IFRoZSBzdHlsZVNhbml0aXplciBpbnN0YW5jZSB0aGF0IGlzIGFzc2lnbmVkIHRvIHRoZSBkaXJlY3RpdmUuIEFsdGhvdWdoIGl0J3MgdW5saWtlbHksXG4gKiAgICAgICBhIGRpcmVjdGl2ZSBjb3VsZCBpbnRyb2R1Y2UgaXRzIG93biBzcGVjaWFsIHN0eWxlIHNhbml0aXplciBhbmQgZm9yIHRoaXMgcmVhY2ggZWFjaFxuICogICAgICAgZGlyZWN0aXZlIHdpbGwgZ2V0IGl0cyBvd24gc3BhY2UgZm9yIGl0IChpZiBudWxsIHRoZW4gdGhlIHZlcnkgZmlyc3Qgc2FuaXRpemVyIGlzIHVzZWQpLlxuICpcbiAqIEVhY2ggdGltZSBhIG5ldyBkaXJlY3RpdmUgaXMgYWRkZWQgaXQgd2lsbCBpbnNlcnQgdGhlc2UgZm91ciB2YWx1ZXMgYXQgdGhlIGVuZCBvZiB0aGUgYXJyYXkuXG4gKiBXaGVuIHRoaXMgYXJyYXkgaXMgZXhhbWluZWQgdGhlbiB0aGUgcmVzdWx0aW5nIGRpcmVjdGl2ZUluZGV4IHdpbGwgYmUgcmVzb2x2ZWQgYnkgZGl2aWRpbmcgdGhlXG4gKiBpbmRleCB2YWx1ZSBieSB0aGUgc2l6ZSBvZiB0aGUgYXJyYXkgZW50cmllcyAoc28gaWYgRGlyQSBpcyBhdCBzcG90IDggdGhlbiBpdHMgaW5kZXggd2lsbCBiZSAyKS5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBEaXJlY3RpdmVSZWdpc3RyeVZhbHVlcyBleHRlbmRzIEFycmF5PG51bGx8e318Ym9vbGVhbnxudW1iZXJ8U3R5bGVTYW5pdGl6ZUZuPiB7XG4gIFtEaXJlY3RpdmVSZWdpc3RyeVZhbHVlc0luZGV4LkRpcmVjdGl2ZVZhbHVlT2Zmc2V0XTogbnVsbDtcbiAgW0RpcmVjdGl2ZVJlZ2lzdHJ5VmFsdWVzSW5kZXguU2luZ2xlUHJvcFZhbHVlc0luZGV4T2Zmc2V0XTogbnVtYmVyO1xuICBbRGlyZWN0aXZlUmVnaXN0cnlWYWx1ZXNJbmRleC5EaXJ0eUZsYWdPZmZzZXRdOiBib29sZWFuO1xuICBbRGlyZWN0aXZlUmVnaXN0cnlWYWx1ZXNJbmRleC5TdHlsZVNhbml0aXplck9mZnNldF06IFN0eWxlU2FuaXRpemVGbnxudWxsO1xufVxuXG4vKipcbiAqIEFuIGVudW0gdGhhdCBvdXRsaW5lcyB0aGUgb2Zmc2V0L3Bvc2l0aW9uIHZhbHVlcyBmb3IgZWFjaCBkaXJlY3RpdmUgZW50cnkgYW5kIGl0cyBkYXRhXG4gKiB0aGF0IGFyZSBob3VzZWQgaW5zaWRlIG9mIFtEaXJlY3RpdmVSZWdpc3RyeVZhbHVlc10uXG4gKi9cbmV4cG9ydCBjb25zdCBlbnVtIERpcmVjdGl2ZVJlZ2lzdHJ5VmFsdWVzSW5kZXgge1xuICBEaXJlY3RpdmVWYWx1ZU9mZnNldCA9IDAsXG4gIFNpbmdsZVByb3BWYWx1ZXNJbmRleE9mZnNldCA9IDEsXG4gIERpcnR5RmxhZ09mZnNldCA9IDIsXG4gIFN0eWxlU2FuaXRpemVyT2Zmc2V0ID0gMyxcbiAgU2l6ZSA9IDRcbn1cblxuLyoqXG4gKiBBbiBhcnJheSB0aGF0IGNvbnRhaW5zIHRoZSBpbmRleCBwb2ludGVyIHZhbHVlcyBmb3IgZXZlcnkgc2luZ2xlIHN0eWxpbmcgcHJvcGVydHlcbiAqIHRoYXQgZXhpc3RzIGluIHRoZSBjb250ZXh0IGFuZCBmb3IgZXZlcnkgZGlyZWN0aXZlLiBJdCBhbHNvIGNvbnRhaW5zIHRoZSB0b3RhbFxuICogc2luZ2xlIHN0eWxlcyBhbmQgc2luZ2xlIGNsYXNzZXMgdGhhdCBleGlzdHMgaW4gdGhlIGNvbnRleHQgYXMgdGhlIGZpcnN0IHR3byB2YWx1ZXMuXG4gKlxuICogTGV0J3Mgc2F5IHdlIGhhdmUgdGhlIGZvbGxvd2luZyB0ZW1wbGF0ZSBjb2RlOlxuICpcbiAqIDxkaXYgW3N0eWxlLndpZHRoXT1cIm15V2lkdGhcIlxuICogICAgICBbc3R5bGUuaGVpZ2h0XT1cIm15SGVpZ2h0XCJcbiAqICAgICAgW2NsYXNzLmZsaXBwZWRdPVwiZmxpcENsYXNzXCJcbiAqICAgICAgZGlyZWN0aXZlLXdpdGgtb3BhY2l0eT5cbiAqICAgICAgZGlyZWN0aXZlLXdpdGgtZm9vLWJhci1jbGFzc2VzPlxuICpcbiAqIFdlIGhhdmUgdHdvIGRpcmVjdGl2ZSBhbmQgdGVtcGxhdGUtYmluZGluZyBzb3VyY2VzLFxuICogMiArIDEgc3R5bGVzIGFuZCAxICsgMSBjbGFzc2VzLiBXaGVuIHRoZSBiaW5kaW5ncyBhcmVcbiAqIHJlZ2lzdGVyZWQgdGhlIFNpbmdsZVByb3BPZmZzZXRzIGFycmF5IHdpbGwgbG9vayBsaWtlIHNvOlxuICpcbiAqIHNfMC9jXzAgPSB0ZW1wbGF0ZSBkaXJlY3RpdmUgdmFsdWVcbiAqIHNfMS9jXzEgPSBkaXJlY3RpdmUgb25lIChkaXJlY3RpdmUtd2l0aC1vcGFjaXR5KVxuICogc18yL2NfMiA9IGRpcmVjdGl2ZSB0d28gKGRpcmVjdGl2ZS13aXRoLWZvby1iYXItY2xhc3NlcylcbiAqXG4gKiBbMywgMiwgMiwgMSwgc18wMCwgczAxLCBjXzAxLCAxLCAwLCBzXzEwLCAwLCAxLCBjXzIwXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgU2luZ2xlUHJvcE9mZnNldFZhbHVlcyBleHRlbmRzIEFycmF5PG51bWJlcj4ge1xuICBbU2luZ2xlUHJvcE9mZnNldFZhbHVlc0luZGV4LlN0eWxlc0NvdW50UG9zaXRpb25dOiBudW1iZXI7XG4gIFtTaW5nbGVQcm9wT2Zmc2V0VmFsdWVzSW5kZXguQ2xhc3Nlc0NvdW50UG9zaXRpb25dOiBudW1iZXI7XG59XG5cbi8qKlxuICogQW4gZW51bSB0aGF0IG91dGxpbmVzIHRoZSBvZmZzZXQvcG9zaXRpb24gdmFsdWVzIGZvciBlYWNoIHNpbmdsZSBwcm9wL2NsYXNzIGVudHJ5XG4gKiB0aGF0IGFyZSBob3VzZWQgaW5zaWRlIG9mIFtTaW5nbGVQcm9wT2Zmc2V0VmFsdWVzXS5cbiAqL1xuZXhwb3J0IGNvbnN0IGVudW0gU2luZ2xlUHJvcE9mZnNldFZhbHVlc0luZGV4IHtcbiAgU3R5bGVzQ291bnRQb3NpdGlvbiA9IDAsXG4gIENsYXNzZXNDb3VudFBvc2l0aW9uID0gMSxcbiAgVmFsdWVTdGFydFBvc2l0aW9uID0gMlxufVxuXG4vKipcbiAqIFVzZWQgYSByZWZlcmVuY2UgZm9yIGFsbCBtdWx0aSBzdHlsaW5nIHZhbHVlcyAodmFsdWVzIHRoYXQgYXJlIGFzc2lnbmVkIHZpYSB0aGVcbiAqIGBbc3R5bGVdYCBhbmQgYFtjbGFzc11gIGJpbmRpbmdzKS5cbiAqXG4gKiBTaW5nbGUtc3R5bGluZyBwcm9wZXJ0aWVzICh0aGluZ3Mgc2V0IHZpYSBgW3N0eWxlLnByb3BdYCBhbmQgYFtjbGFzcy5uYW1lXWAgYmluZGluZ3MpXG4gKiBhcmUgbm90IGhhbmRsZWQgdXNpbmcgdGhlIHNhbWUgYXBwcm9hY2ggYXMgbXVsdGktc3R5bGluZyBiaW5kaW5ncyAoc3VjaCBhcyBgW3N0eWxlXWBcbiAqIGBbY2xhc3NdYCBiaW5kaW5ncykuXG4gKlxuICogTXVsdGktc3R5bGluZyBiaW5kaW5ncyByZWx5IG9uIGEgZGlmZmluZyBhbGdvcml0aG0gdG8gZmlndXJlIG91dCB3aGF0IHByb3BlcnRpZXMgaGF2ZSBiZWVuIGFkZGVkLFxuICogcmVtb3ZlZCBhbmQgbW9kaWZpZWQuIE11bHRpLXN0eWxpbmcgcHJvcGVydGllcyBhcmUgYWxzbyBldmFsdWF0ZWQgYWNyb3NzIGRpcmVjdGl2ZXMtLXdoaWNoIG1lYW5zXG4gKiB0aGF0IEFuZ3VsYXIgc3VwcG9ydHMgaGF2aW5nIG11bHRpcGxlIGRpcmVjdGl2ZXMgYWxsIHdyaXRlIHRvIHRoZSBzYW1lIGBbc3R5bGVdYCBhbmQgYFtjbGFzc11gXG4gKiBiaW5kaW5ncyAodXNpbmcgaG9zdCBiaW5kaW5ncykgZXZlbiBpZiB0aGUgYFtzdHlsZV1gIGFuZC9vciBgW2NsYXNzXWAgYmluZGluZ3MgYXJlIGJlaW5nIHdyaXR0ZW5cbiAqIHRvIG9uIHRoZSB0ZW1wbGF0ZSBlbGVtZW50LlxuICpcbiAqIEFsbCBtdWx0aS1zdHlsaW5nIHZhbHVlcyB0aGF0IGFyZSB3cml0dGVuIHRvIGFuIGVsZW1lbnQgKHdoZXRoZXIgaXQgYmUgZnJvbSB0aGUgdGVtcGxhdGUgb3IgYW55XG4gKiBkaXJlY3RpdmVzIGF0dGFjaGVkIHRvIHRoZSBlbGVtZW50KSBhcmUgYWxsIHdyaXR0ZW4gaW50byB0aGUgYE1hcEJhc2VkT2Zmc2V0VmFsdWVzYCBhcnJheS4gKE5vdGVcbiAqIHRoYXQgdGhlcmUgYXJlIHR3byBhcnJheXM6IG9uZSBmb3Igc3R5bGVzIGFuZCBhbm90aGVyIGZvciBjbGFzc2VzLilcbiAqXG4gKiBUaGlzIGFycmF5IGlzIHNoYXBlZCBpbiB0aGUgZm9sbG93aW5nIHdheTpcbiAqXG4gKiBbMF0gID0gVGhlIHRvdGFsIGFtb3VudCBvZiB1bmlxdWUgbXVsdGktc3R5bGUgb3IgbXVsdGktY2xhc3MgZW50cmllcyB0aGF0IGV4aXN0IGN1cnJlbnRseSBpbiB0aGVcbiAqICAgICAgICBjb250ZXh0LlxuICogWzErXSA9IENvbnRhaW5zIGFuIGVudHJ5IG9mIGZvdXIgdmFsdWVzIC4uLiBFYWNoIGVudHJ5IGlzIGEgdmFsdWUgYXNzaWduZWQgYnkgYVxuICogYFtzdHlsZV1gL2BbY2xhc3NdYFxuICogICAgICAgIGJpbmRpbmcgKHdlIGNhbGwgdGhpcyBhICoqc291cmNlKiopLlxuICpcbiAqICAgICAgICBBbiBleGFtcGxlIGVudHJ5IGxvb2tzIGxpa2Ugc28gKGF0IGEgZ2l2ZW4gYGlgIGluZGV4KTpcbiAqICAgICAgICBbaSArIDBdID0gV2hldGhlciBvciBub3QgdGhlIHZhbHVlIGlzIGRpcnR5XG4gKlxuICogICAgICAgIFtpICsgMV0gPSBUaGUgaW5kZXggb2Ygd2hlcmUgdGhlIG1hcC1iYXNlZCB2YWx1ZXNcbiAqICAgICAgICAgICAgICAgICAgKGZvciB0aGlzICoqc291cmNlKiopIHN0YXJ0IHdpdGhpbiB0aGUgY29udGV4dFxuICpcbiAqICAgICAgICBbaSArIDJdID0gVGhlIHVudG91Y2hlZCwgbGFzdCBzZXQgdmFsdWUgb2YgdGhlIGJpbmRpbmdcbiAqXG4gKiAgICAgICAgW2kgKyAzXSA9IFRoZSB0b3RhbCBhbW91bnQgb2YgdW5xaXVlIGJpbmRpbmcgdmFsdWVzIHRoYXQgd2VyZVxuICogICAgICAgICAgICAgICAgICBleHRyYWN0ZWQgYW5kIHNldCBpbnRvIHRoZSBjb250ZXh0LiAoTm90ZSB0aGF0IHRoaXMgdmFsdWUgZG9lc1xuICogICAgICAgICAgICAgICAgICBub3QgcmVmbGVjdCB0aGUgdG90YWwgYW1vdW50IG9mIHZhbHVlcyB3aXRoaW4gdGhlIGJpbmRpbmdcbiAqICAgICAgICAgICAgICAgICAgdmFsdWUgKHNpbmNlIGl0J3MgYSBtYXApLCBidXQgaW5zdGVhZCByZWZsZWN0cyB0aGUgdG90YWwgdmFsdWVzXG4gKiAgICAgICAgICAgICAgICAgIHRoYXQgd2VyZSBub3QgdXNlZCBieSBhbm90aGVyIGRpcmVjdGl2ZSkuXG4gKlxuICogRWFjaCB0aW1lIGEgZGlyZWN0aXZlIChvciB0ZW1wbGF0ZSkgd3JpdGVzIGEgdmFsdWUgdG8gYSBgW2NsYXNzXWAvYFtzdHlsZV1gIGJpbmRpbmcgdGhlbiB0aGVcbiAqIHN0eWxpbmcgZGlmZmluZyBhbGdvcml0aG0gY29kZSB3aWxsIGRlY2lkZSB3aGV0aGVyIG9yIG5vdCB0byB1cGRhdGUgdGhlIHZhbHVlIGJhc2VkIG9uIHRoZVxuICogZm9sbG93aW5nIHJ1bGVzOlxuICpcbiAqIDEuIElmIGEgbW9yZSBpbXBvcnRhbnQgZGlyZWN0aXZlIChlaXRoZXIgdGhlIHRlbXBsYXRlIG9yIGEgZGlyZWN0aXZlIHRoYXQgd2FzIHJlZ2lzdGVyZWRcbiAqICAgIGJlZm9yZWhhbmQpIGhhcyB3cml0dGVuIGEgc3BlY2lmaWMgc3R5bGluZyB2YWx1ZSBpbnRvIHRoZSBjb250ZXh0IHRoZW4gYW55IGZvbGxvdy11cCBzdHlsaW5nXG4gKiAgICB2YWx1ZXMgKHNldCBieSBhbm90aGVyIGRpcmVjdGl2ZSB2aWEgaXRzIGBbc3R5bGVdYCBhbmQvb3IgYFtjbGFzc11gIGhvc3QgYmluZGluZykgd2lsbCBub3QgYmVcbiAqICAgIGFibGUgdG8gc2V0IGl0LiBUaGlzIGlzIGJlY2F1c2UgdGhlIGZvcm1lciBkaXJlY3RpdmUgaGFzIHByaW9ydHkuXG4gKiAyLiBPbmx5IGlmIGEgZm9ybWVyIGRpcmVjdGl2ZSBoYXMgc2V0IGEgc3BlY2lmaWMgc3R5bGluZyB2YWx1ZSB0byBudWxsICh3aGV0aGVyIGJ5IGFjdHVhbGx5XG4gKiAgICBzZXR0aW5nIGl0IHRvIG51bGwgb3Igbm90IGluY2x1ZGluZyBpdCBpbiBpcyBtYXAgdmFsdWUpIHRoZW4gYSBsZXNzIGltcG9yYXRhbnQgZGlyZWN0aXZlIGNhblxuICogICAgc2V0IGl0cyBvd24gdmFsdWUuXG4gKlxuICogIyMgSG93IHRoZSBtYXAtYmFzZWQgc3R5bGluZyBhbGdvcml0aG0gdXBkYXRlcyBpdHNlbGZcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBNYXBCYXNlZE9mZnNldFZhbHVlcyBleHRlbmRzIEFycmF5PGFueT4ge1xuICBbTWFwQmFzZWRPZmZzZXRWYWx1ZXNJbmRleC5FbnRyaWVzQ291bnRQb3NpdGlvbl06IG51bWJlcjtcbn1cblxuZXhwb3J0IGNvbnN0IGVudW0gTWFwQmFzZWRPZmZzZXRWYWx1ZXNJbmRleCB7XG4gIEVudHJpZXNDb3VudFBvc2l0aW9uID0gMCxcbiAgVmFsdWVzU3RhcnRQb3NpdGlvbiA9IDEsXG4gIERpcnR5RmxhZ09mZnNldCA9IDAsXG4gIFBvc2l0aW9uU3RhcnRPZmZzZXQgPSAxLFxuICBWYWx1ZU9mZnNldCA9IDIsXG4gIFZhbHVlQ291bnRPZmZzZXQgPSAzLFxuICBTaXplID0gNFxufVxuXG4vKipcbiAqIFVzZWQgdG8gc2V0IHRoZSBjb250ZXh0IHRvIGJlIGRpcnR5IG9yIG5vdCBib3RoIG9uIHRoZSBtYXN0ZXIgZmxhZyAocG9zaXRpb24gMSlcbiAqIG9yIGZvciBlYWNoIHNpbmdsZS9tdWx0aSBwcm9wZXJ0eSB0aGF0IGV4aXN0cyBpbiB0aGUgY29udGV4dC5cbiAqL1xuZXhwb3J0IGNvbnN0IGVudW0gU3R5bGluZ0ZsYWdzIHtcbiAgLy8gSW1wbGllcyBubyBjb25maWd1cmF0aW9uc1xuICBOb25lID0gMGIwMDAwMCxcbiAgLy8gV2hldGhlciBvciBub3QgdGhlIGVudHJ5IG9yIGNvbnRleHQgaXRzZWxmIGlzIGRpcnR5XG4gIERpcnR5ID0gMGIwMDAwMSxcbiAgLy8gV2hldGhlciBvciBub3QgdGhpcyBpcyBhIGNsYXNzLWJhc2VkIGFzc2lnbm1lbnRcbiAgQ2xhc3MgPSAwYjAwMDEwLFxuICAvLyBXaGV0aGVyIG9yIG5vdCBhIHNhbml0aXplciB3YXMgYXBwbGllZCB0byB0aGlzIHByb3BlcnR5XG4gIFNhbml0aXplID0gMGIwMDEwMCxcbiAgLy8gV2hldGhlciBvciBub3QgYW55IHBsYXllciBidWlsZGVycyB3aXRoaW4gbmVlZCB0byBwcm9kdWNlIG5ldyBwbGF5ZXJzXG4gIFBsYXllckJ1aWxkZXJzRGlydHkgPSAwYjAxMDAwLFxuICAvLyBUaGUgbWF4IGFtb3VudCBvZiBiaXRzIHVzZWQgdG8gcmVwcmVzZW50IHRoZXNlIGNvbmZpZ3VyYXRpb24gdmFsdWVzXG4gIEJpbmRpbmdBbGxvY2F0aW9uTG9ja2VkID0gMGIxMDAwMCxcbiAgQml0Q291bnRTaXplID0gNSxcbiAgLy8gVGhlcmUgYXJlIG9ubHkgZml2ZSBiaXRzIGhlcmVcbiAgQml0TWFzayA9IDBiMTExMTFcbn1cblxuLyoqIFVzZWQgYXMgbnVtZXJpYyBwb2ludGVyIHZhbHVlcyB0byBkZXRlcm1pbmUgd2hhdCBjZWxscyB0byB1cGRhdGUgaW4gdGhlIGBTdHlsaW5nQ29udGV4dGAgKi9cbmV4cG9ydCBjb25zdCBlbnVtIFN0eWxpbmdJbmRleCB7XG4gIC8vIFBvc2l0aW9uIG9mIHdoZXJlIHRoZSBpbml0aWFsIHN0eWxlcyBhcmUgc3RvcmVkIGluIHRoZSBzdHlsaW5nIGNvbnRleHRcbiAgLy8gVGhpcyBpbmRleCBtdXN0IGFsaWduIHdpdGggSE9TVCwgc2VlIGludGVyZmFjZXMvdmlldy50c1xuICBFbGVtZW50UG9zaXRpb24gPSAwLFxuICAvLyBJbmRleCBvZiBsb2NhdGlvbiB3aGVyZSB0aGUgc3RhcnQgb2Ygc2luZ2xlIHByb3BlcnRpZXMgYXJlIHN0b3JlZC4gKGB1cGRhdGVTdHlsZVByb3BgKVxuICBNYXN0ZXJGbGFnUG9zaXRpb24gPSAxLFxuICAvLyBQb3NpdGlvbiBvZiB3aGVyZSB0aGUgcmVnaXN0ZXJlZCBkaXJlY3RpdmVzIGV4aXN0IGZvciB0aGlzIHN0eWxpbmcgY29udGV4dFxuICBEaXJlY3RpdmVSZWdpc3RyeVBvc2l0aW9uID0gMixcbiAgLy8gUG9zaXRpb24gb2Ygd2hlcmUgdGhlIGluaXRpYWwgc3R5bGVzIGFyZSBzdG9yZWQgaW4gdGhlIHN0eWxpbmcgY29udGV4dFxuICBJbml0aWFsU3R5bGVWYWx1ZXNQb3NpdGlvbiA9IDMsXG4gIEluaXRpYWxDbGFzc1ZhbHVlc1Bvc2l0aW9uID0gNCxcbiAgLy8gSW5kZXggb2YgbG9jYXRpb24gd2hlcmUgdGhlIGNsYXNzIGluZGV4IG9mZnNldCB2YWx1ZSBpcyBsb2NhdGVkXG4gIFNpbmdsZVByb3BPZmZzZXRQb3NpdGlvbnMgPSA1LFxuICAvLyBQb3NpdGlvbiBvZiB3aGVyZSB0aGUgbGFzdCBzdHJpbmctYmFzZWQgQ1NTIGNsYXNzIHZhbHVlIHdhcyBzdG9yZWQgKG9yIGEgY2FjaGVkIHZlcnNpb24gb2YgdGhlXG4gIC8vIGluaXRpYWwgc3R5bGVzIHdoZW4gYSBbY2xhc3NdIGRpcmVjdGl2ZSBpcyBwcmVzZW50KVxuICBDYWNoZWRNdWx0aUNsYXNzZXMgPSA2LFxuICAvLyBQb3NpdGlvbiBvZiB3aGVyZSB0aGUgbGFzdCBzdHJpbmctYmFzZWQgQ1NTIGNsYXNzIHZhbHVlIHdhcyBzdG9yZWRcbiAgQ2FjaGVkTXVsdGlTdHlsZXMgPSA3LFxuICAvLyBNdWx0aSBhbmQgc2luZ2xlIGVudHJpZXMgYXJlIHN0b3JlZCBpbiBgU3R5bGluZ0NvbnRleHRgIGFzOiBGbGFnOyBQcm9wZXJ0eU5hbWU7ICBQcm9wZXJ0eVZhbHVlXG4gIC8vIFBvc2l0aW9uIG9mIHdoZXJlIHRoZSBpbml0aWFsIHN0eWxlcyBhcmUgc3RvcmVkIGluIHRoZSBzdHlsaW5nIGNvbnRleHRcbiAgUGxheWVyQ29udGV4dCA9IDgsXG4gIC8vIExvY2F0aW9uIG9mIHNpbmdsZSAocHJvcCkgdmFsdWUgZW50cmllcyBhcmUgc3RvcmVkIHdpdGhpbiB0aGUgY29udGV4dFxuICBTaW5nbGVTdHlsZXNTdGFydFBvc2l0aW9uID0gOSxcbiAgRmxhZ3NPZmZzZXQgPSAwLFxuICBQcm9wZXJ0eU9mZnNldCA9IDEsXG4gIFZhbHVlT2Zmc2V0ID0gMixcbiAgUGxheWVyQnVpbGRlckluZGV4T2Zmc2V0ID0gMyxcbiAgLy8gU2l6ZSBvZiBlYWNoIG11bHRpIG9yIHNpbmdsZSBlbnRyeSAoZmxhZyArIHByb3AgKyB2YWx1ZSArIHBsYXllckJ1aWxkZXJJbmRleClcbiAgU2l6ZSA9IDQsXG4gIC8vIEVhY2ggZmxhZyBoYXMgYSBiaW5hcnkgZGlnaXQgbGVuZ3RoIG9mIHRoaXMgdmFsdWVcbiAgQml0Q291bnRTaXplID0gMTQsICAvLyAoMzIgLSA0KSAvIDIgPSB+MTRcbiAgLy8gVGhlIGJpbmFyeSBkaWdpdCB2YWx1ZSBhcyBhIG1hc2tcbiAgQml0TWFzayA9IDBiMTExMTExMTExMTExMTEsICAvLyAxNCBiaXRzXG59XG5cbi8qKlxuICogQW4gZW51bSB0aGF0IG91dGxpbmVzIHRoZSBiaXQgZmxhZyBkYXRhIGZvciBkaXJlY3RpdmUgb3duZXIgYW5kIHBsYXllciBpbmRleFxuICogdmFsdWVzIHRoYXQgZXhpc3Qgd2l0aGluIGVuIGVudHJ5IHRoYXQgbGl2ZXMgaW4gdGhlIFN0eWxpbmdDb250ZXh0LlxuICpcbiAqIFRoZSB2YWx1ZXMgaGVyZSBzcGxpdCBhIG51bWJlciB2YWx1ZSBpbnRvIHR3byBzZXRzIG9mIGJpdHM6XG4gKiAgLSBUaGUgZmlyc3QgMTYgYml0cyBhcmUgdXNlZCB0byBzdG9yZSB0aGUgZGlyZWN0aXZlSW5kZXggdGhhdCBvd25zIHRoaXMgc3R5bGUgdmFsdWVcbiAqICAtIFRoZSBvdGhlciAxNiBiaXRzIGFyZSB1c2VkIHRvIHN0b3JlIHRoZSBwbGF5ZXJCdWlsZGVySW5kZXggdGhhdCBpcyBhdHRhY2hlZCB0byB0aGlzIHN0eWxlXG4gKi9cbmV4cG9ydCBjb25zdCBlbnVtIERpcmVjdGl2ZU93bmVyQW5kUGxheWVyQnVpbGRlckluZGV4IHtcbiAgQml0Q291bnRTaXplID0gMTYsXG4gIEJpdE1hc2sgPSAwYjExMTExMTExMTExMTExMTFcbn1cbiJdfQ==