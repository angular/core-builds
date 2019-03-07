/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3R5bGluZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaW50ZXJmYWNlcy9zdHlsaW5nLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBdVFBLG9DQXFEQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFTRCwwQ0FHQzs7Ozs7Ozs7O0lBMEdDOztPQUVHO0lBQ0gsMkJBQTRCO0lBRTVCOzs7Ozs7Ozs7T0FTRztJQUNILDRCQUE2QjtJQUU3Qjs7T0FFRztJQUNILHdCQUF5QjtJQUV6Qjs7T0FFRztJQUNILGFBQWM7SUFFZDs7T0FFRztJQUNILGNBQWU7SUFFZjs7O09BR0c7SUFDSCx1QkFBd0I7SUFFeEI7O09BRUc7SUFDSCxPQUFROzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQStCViw2Q0FLQzs7Ozs7Ozs7Ozs7OztJQU9DLHVCQUF3QjtJQUN4Qiw4QkFBK0I7SUFDL0Isa0JBQW1CO0lBQ25CLHVCQUF3QjtJQUN4QixPQUFROzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUEwQlYsNENBR0M7Ozs7Ozs7OztJQU9DLHNCQUF1QjtJQUN2Qix1QkFBd0I7SUFDeEIscUJBQXNCOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBeUR4QiwwQ0FFQzs7Ozs7OztJQUdDLHVCQUF3QjtJQUN4QixzQkFBdUI7SUFDdkIsa0JBQW1CO0lBQ25CLHNCQUF1QjtJQUN2QixjQUFlO0lBQ2YsbUJBQW9CO0lBQ3BCLE9BQVE7Ozs7O0lBUVIsNEJBQTRCO0lBQzVCLE9BQWM7SUFDZCxzREFBc0Q7SUFDdEQsUUFBZTtJQUNmLGtEQUFrRDtJQUNsRCxRQUFlO0lBQ2YsMERBQTBEO0lBQzFELFdBQWtCO0lBQ2xCLHdFQUF3RTtJQUN4RSxzQkFBNkI7SUFDN0Isc0VBQXNFO0lBQ3RFLDJCQUFpQztJQUNqQyxlQUFnQjtJQUNoQixnQ0FBZ0M7SUFDaEMsV0FBaUI7Ozs7O0lBS2pCLHlFQUF5RTtJQUN6RSwwREFBMEQ7SUFDMUQsa0JBQW1CO0lBQ25CLHlGQUF5RjtJQUN6RixxQkFBc0I7SUFDdEIsNkVBQTZFO0lBQzdFLDRCQUE2QjtJQUM3Qix5RUFBeUU7SUFDekUsNkJBQThCO0lBQzlCLDZCQUE4QjtJQUM5QixrRUFBa0U7SUFDbEUsNEJBQTZCO0lBQzdCLGlHQUFpRztJQUNqRyxzREFBc0Q7SUFDdEQscUJBQXNCO0lBQ3RCLHFFQUFxRTtJQUNyRSxvQkFBcUI7SUFDckIsaUdBQWlHO0lBQ2pHLHlFQUF5RTtJQUN6RSxnQkFBaUI7SUFDakIsd0VBQXdFO0lBQ3hFLDRCQUE2QjtJQUM3QixjQUFlO0lBQ2YsaUJBQWtCO0lBQ2xCLGNBQWU7SUFDZiwyQkFBNEI7SUFDNUIsZ0ZBQWdGO0lBQ2hGLE9BQVE7SUFDUixvREFBb0Q7SUFDcEQsZ0JBQWlCO0lBQ2pCLG1DQUFtQztJQUNuQyxjQUEwQjs7Ozs7SUFZMUIsZ0JBQWlCO0lBQ2pCLGNBQTRCIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0IHtTdHlsZVNhbml0aXplRm59IGZyb20gJy4uLy4uL3Nhbml0aXphdGlvbi9zdHlsZV9zYW5pdGl6ZXInO1xuaW1wb3J0IHtSRWxlbWVudH0gZnJvbSAnLi4vaW50ZXJmYWNlcy9yZW5kZXJlcic7XG5pbXBvcnQge0xDb250YWluZXJ9IGZyb20gJy4vY29udGFpbmVyJztcbmltcG9ydCB7UGxheWVyQ29udGV4dH0gZnJvbSAnLi9wbGF5ZXInO1xuaW1wb3J0IHtMVmlld30gZnJvbSAnLi92aWV3JztcblxuXG4vKipcbiAqIFRoZSBzdHlsaW5nIGNvbnRleHQgYWN0cyBhcyBhIHN0eWxpbmcgbWFuaWZlc3QgKHNoYXBlZCBhcyBhbiBhcnJheSkgZm9yIGRldGVybWluaW5nIHdoaWNoXG4gKiBzdHlsaW5nIHByb3BlcnRpZXMgaGF2ZSBiZWVuIGFzc2lnbmVkIHZpYSB0aGUgcHJvdmlkZWQgYHVwZGF0ZVN0eWxpbmdNYXBgLCBgdXBkYXRlU3R5bGVQcm9wYFxuICogYW5kIGB1cGRhdGVDbGFzc1Byb3BgIGZ1bmN0aW9ucy4gSXQgYWxzbyBzdG9yZXMgdGhlIHN0YXRpYyBzdHlsZS9jbGFzcyB2YWx1ZXMgdGhhdCB3ZXJlXG4gKiBleHRyYWN0ZWQgZnJvbSB0aGUgdGVtcGxhdGUgYnkgdGhlIGNvbXBpbGVyLlxuICpcbiAqIEEgY29udGV4dCBpcyBjcmVhdGVkIGJ5IEFuZ3VsYXIgd2hlbjpcbiAqIDEuIEFuIGVsZW1lbnQgY29udGFpbnMgc3RhdGljIHN0eWxpbmcgdmFsdWVzIChsaWtlIHN0eWxlPVwiLi4uXCIgb3IgY2xhc3M9XCIuLi5cIilcbiAqIDIuIEFuIGVsZW1lbnQgY29udGFpbnMgc2luZ2xlIHByb3BlcnR5IGJpbmRpbmcgdmFsdWVzIChsaWtlIFtzdHlsZS5wcm9wXT1cInhcIiBvclxuICogW2NsYXNzLnByb3BdPVwieVwiKVxuICogMy4gQW4gZWxlbWVudCBjb250YWlucyBtdWx0aSBwcm9wZXJ0eSBiaW5kaW5nIHZhbHVlcyAobGlrZSBbc3R5bGVdPVwieFwiIG9yIFtjbGFzc109XCJ5XCIpXG4gKiA0LiBBIGRpcmVjdGl2ZSBjb250YWlucyBob3N0IGJpbmRpbmdzIGZvciBzdGF0aWMsIHNpbmdsZSBvciBtdWx0aSBzdHlsaW5nIHByb3BlcnRpZXMvYmluZGluZ3MuXG4gKiA1LiBBbiBhbmltYXRpb24gcGxheWVyIGlzIGFkZGVkIHRvIGFuIGVsZW1lbnQgdmlhIGBhZGRQbGF5ZXJgXG4gKlxuICogTm90ZSB0aGF0IGV2ZW4gaWYgYW4gZWxlbWVudCBjb250YWlucyBzdGF0aWMgc3R5bGluZyB0aGVuIHRoaXMgY29udGV4dCB3aWxsIGJlIGNyZWF0ZWQgYW5kXG4gKiBhdHRhY2hlZCB0byBpdC4gVGhlIHJlYXNvbiB3aHkgdGhpcyBoYXBwZW5zIChpbnN0ZWFkIG9mIHRyZWF0aW5nIHN0eWxlcy9jbGFzc2VzIGFzIHJlZ3VsYXJcbiAqIEhUTUwgYXR0cmlidXRlcykgaXMgYmVjYXVzZSB0aGUgc3R5bGUvY2xhc3MgYmluZGluZ3MgbXVzdCBiZSBhYmxlIHRvIGRlZmF1bHQgdGhlbXNlbHZlcyBiYWNrXG4gKiB0byB0aGVpciByZXNwZWN0aXZlIHN0YXRpYyB2YWx1ZXMgd2hlbiB0aGV5IGFyZSBzZXQgdG8gbnVsbC5cbiAqXG4gKiBTYXkgZm9yIGV4YW1wbGUgd2UgaGF2ZSB0aGlzOlxuICogYGBgXG4gKiA8IS0tIHdoZW4gYG15V2lkdGhFeHA9bnVsbGAgdGhlbiBhIHdpZHRoIG9mIGAxMDBweGBcbiAqICAgICAgd2lsbCBiZSB1c2VkIGEgZGVmYXVsdCB2YWx1ZSBmb3Igd2lkdGggLS0+XG4gKiA8ZGl2IHN0eWxlPVwid2lkdGg6MTAwcHhcIiBbc3R5bGUud2lkdGhdPVwibXlXaWR0aEV4cFwiPjwvZGl2PlxuICogYGBgXG4gKlxuICogRXZlbiBpbiB0aGUgc2l0dWF0aW9uIHdoZXJlIHRoZXJlIGFyZSBubyBiaW5kaW5ncywgdGhlIHN0YXRpYyBzdHlsaW5nIGlzIHN0aWxsIHBsYWNlZCBpbnRvIHRoZVxuICogY29udGV4dCBiZWNhdXNlIHRoZXJlIG1heSBiZSBhbm90aGVyIGRpcmVjdGl2ZSBvbiB0aGUgc2FtZSBlbGVtZW50IHRoYXQgaGFzIHN0eWxpbmcuXG4gKlxuICogV2hlbiBBbmd1bGFyIGluaXRpYWxpemVzIHN0eWxpbmcgZGF0YSBmb3IgYW4gZWxlbWVudCB0aGVuIGl0IHdpbGwgZmlyc3QgcmVnaXN0ZXIgdGhlIHN0YXRpY1xuICogc3R5bGluZyB2YWx1ZXMgb24gdGhlIGVsZW1lbnQgdXNpbmcgb25lIG9mIHRoZXNlIHR3byBpbnN0cnVjdGlvbnM6XG4gKlxuICogMS4gZWxlbWVudFN0YXJ0IG9yIGVsZW1lbnQgKHdpdGhpbiB0aGUgdGVtcGxhdGUgZnVuY3Rpb24gb2YgYSBjb21wb25lbnQpXG4gKiAyLiBlbGVtZW50SG9zdEF0dHJzIChmb3IgZGlyZWN0aXZlIGhvc3QgYmluZGluZ3MpXG4gKlxuICogSW4gZWl0aGVyIGNhc2UsIGEgc3R5bGluZyBjb250ZXh0IHdpbGwgYmUgY3JlYXRlZCBhbmQgc3RvcmVkIHdpdGhpbiBhbiBlbGVtZW50J3MgYExWaWV3RGF0YWAuXG4gKiBPbmNlIHRoZSBzdHlsaW5nIGNvbnRleHQgaXMgY3JlYXRlZCB0aGVuIHNpbmdsZSBhbmQgbXVsdGkgcHJvcGVydGllcyBjYW4gYmUgc3RvcmVkIHdpdGhpbiBpdC5cbiAqIEZvciB0aGlzIHRvIGhhcHBlbiwgdGhlIGZvbGxvd2luZyBmdW5jdGlvbiBuZWVkcyB0byBiZSBjYWxsZWQ6XG4gKlxuICogYGVsZW1lbnRTdHlsaW5nYCAoY2FsbGVkIHdpdGggc3R5bGUgcHJvcGVydGllcywgY2xhc3MgcHJvcGVydGllcyBhbmQgYSBzYW5pdGl6ZXIgKyBhIGRpcmVjdGl2ZVxuICogaW5zdGFuY2UpLlxuICpcbiAqIFdoZW4gdGhpcyBpbnN0cnVjdGlvbiBpcyBjYWxsZWQgaXQgd2lsbCBwb3B1bGF0ZSB0aGUgc3R5bGluZyBjb250ZXh0IHdpdGggdGhlIHByb3ZpZGVkIHN0eWxlXG4gKiBhbmQgY2xhc3MgbmFtZXMgaW50byB0aGUgY29udGV4dC5cbiAqXG4gKiBUaGUgY29udGV4dCBpdHNlbGYgbG9va3MgbGlrZSB0aGlzOlxuICpcbiAqIGNvbnRleHQgPSBbXG4gKiAgIC8vIDAtODogaGVhZGVyIHZhbHVlcyAoYWJvdXQgOCBlbnRyaWVzIG9mIGNvbmZpZ3VyYXRpb24gZGF0YSlcbiAqICAgLy8gOSs6IHRoaXMgaXMgd2hlcmUgZWFjaCBlbnRyeSBpcyBzdG9yZWQ6XG4gKiBdXG4gKlxuICogTGV0J3Mgc2F5IHdlIGhhdmUgdGhlIGZvbGxvd2luZyB0ZW1wbGF0ZSBjb2RlOlxuICpcbiAqIGBgYFxuICogPGRpdiBjbGFzcz1cImZvbyBiYXJcIlxuICogICAgICBzdHlsZT1cIndpZHRoOjIwMHB4OyBjb2xvcjpyZWRcIlxuICogICAgICBbc3R5bGUud2lkdGhdPVwibXlXaWR0aEV4cFwiXG4gKiAgICAgIFtzdHlsZS5oZWlnaHRdPVwibXlIZWlnaHRFeHBcIlxuICogICAgICBbY2xhc3MuYmF6XT1cIm15QmF6RXhwXCI+XG4gKiBgYGBcbiAqXG4gKiBUaGUgY29udGV4dCBnZW5lcmF0ZWQgZnJvbSB0aGVzZSB2YWx1ZXMgd2lsbCBsb29rIGxpa2UgdGhpcyAobm90ZSB0aGF0XG4gKiBmb3IgZWFjaCBiaW5kaW5nIG5hbWUgKHRoZSBjbGFzcyBhbmQgc3R5bGUgYmluZGluZ3MpIHRoZSB2YWx1ZXMgd2lsbFxuICogYmUgaW5zZXJ0ZWQgdHdpY2UgaW50byB0aGUgYXJyYXkgKG9uY2UgZm9yIHNpbmdsZSBwcm9wZXJ0eSBlbnRyaWVzIGFuZFxuICogYWdhaW4gZm9yIG11bHRpIHByb3BlcnR5IGVudHJpZXMpLlxuICpcbiAqIGNvbnRleHQgPSBbXG4gKiAgIC8vIDAtODogaGVhZGVyIHZhbHVlcyAoYWJvdXQgOCBlbnRyaWVzIG9mIGNvbmZpZ3VyYXRpb24gZGF0YSlcbiAqICAgLy8gOSs6IHRoaXMgaXMgd2hlcmUgZWFjaCBlbnRyeSBpcyBzdG9yZWQ6XG4gKlxuICogICAvLyBTSU5HTEUgUFJPUEVSVElFU1xuICogICBjb25maWdGb3JXaWR0aCxcbiAqICAgJ3dpZHRoJ1xuICogICBteVdpZHRoRXhwLCAvLyB0aGUgYmluZGluZyB2YWx1ZSBub3QgdGhlIGJpbmRpbmcgaXRzZWxmXG4gKiAgIDAsIC8vIHRoZSBkaXJlY3RpdmUgb3duZXJcbiAqXG4gKiAgIGNvbmZpZ0ZvckhlaWdodCxcbiAqICAgJ2hlaWdodCdcbiAqICAgbXlIZWlnaHRFeHAsIC8vIHRoZSBiaW5kaW5nIHZhbHVlIG5vdCB0aGUgYmluZGluZyBpdHNlbGZcbiAqICAgMCwgLy8gdGhlIGRpcmVjdGl2ZSBvd25lclxuICpcbiAqICAgY29uZmlnRm9yQmF6Q2xhc3MsXG4gKiAgICdiYXpcbiAqICAgbXlCYXpDbGFzc0V4cCwgLy8gdGhlIGJpbmRpbmcgdmFsdWUgbm90IHRoZSBiaW5kaW5nIGl0c2VsZlxuICogICAwLCAvLyB0aGUgZGlyZWN0aXZlIG93bmVyXG4gKlxuICogICAvLyBNVUxUSSBQUk9QRVJUSUVTXG4gKiAgIGNvbmZpZ0ZvcldpZHRoLFxuICogICAnd2lkdGgnXG4gKiAgIG15V2lkdGhFeHAsIC8vIHRoZSBiaW5kaW5nIHZhbHVlIG5vdCB0aGUgYmluZGluZyBpdHNlbGZcbiAqICAgMCwgLy8gdGhlIGRpcmVjdGl2ZSBvd25lclxuICpcbiAqICAgY29uZmlnRm9ySGVpZ2h0LFxuICogICAnaGVpZ2h0J1xuICogICBteUhlaWdodEV4cCwgLy8gdGhlIGJpbmRpbmcgdmFsdWUgbm90IHRoZSBiaW5kaW5nIGl0c2VsZlxuICogICAwLCAvLyB0aGUgZGlyZWN0aXZlIG93bmVyXG4gKlxuICogICBjb25maWdGb3JCYXpDbGFzcyxcbiAqICAgJ2JhelxuICogICBteUJhekNsYXNzRXhwLCAvLyB0aGUgYmluZGluZyB2YWx1ZSBub3QgdGhlIGJpbmRpbmcgaXRzZWxmXG4gKiAgIDAsIC8vIHRoZSBkaXJlY3RpdmUgb3duZXJcbiAqIF1cbiAqXG4gKiBUaGUgY29uZmlndXJhdGlvbiB2YWx1ZXMgYXJlIGxlZnQgb3V0IG9mIHRoZSBleGFtcGxlIGFib3ZlIGJlY2F1c2VcbiAqIHRoZSBvcmRlcmluZyBvZiB0aGVtIGNvdWxkIGNoYW5nZSBiZXR3ZWVuIGNvZGUgcGF0Y2hlcy4gUGxlYXNlIHJlYWQgdGhlXG4gKiBkb2N1bWVudGF0aW9uIGJlbG93IHRvIGdldCBhIGJldHRlciB1bmRlcnN0YW5kIG9mIHdoYXQgdGhlIGNvbmZpZ3VyYXRpb25cbiAqIHZhbHVlcyBhcmUgYW5kIGhvdyB0aGV5IHdvcmsuXG4gKlxuICogRWFjaCB0aW1lIGEgYmluZGluZyBwcm9wZXJ0eSBpcyB1cGRhdGVkICh3aGV0aGVyIGl0IGJlIHRocm91Z2ggYSBzaW5nbGVcbiAqIHByb3BlcnR5IGluc3RydWN0aW9uIGxpa2UgYGVsZW1lbnRTdHlsZVByb3BgLCBgZWxlbWVudENsYXNzUHJvcGAgb3JcbiAqIGBlbGVtZW50U3R5bGluZ01hcGApIHRoZW4gdGhlIHZhbHVlcyBpbiB0aGUgY29udGV4dCB3aWxsIGJlIHVwZGF0ZWQgYXNcbiAqIHdlbGwuXG4gKlxuICogSWYgZm9yIGV4YW1wbGUgYFtzdHlsZS53aWR0aF1gIHVwZGF0ZXMgdG8gYDU1NXB4YCB0aGVuIGl0cyB2YWx1ZSB3aWxsIGJlIHJlZmxlY3RlZFxuICogaW4gdGhlIGNvbnRleHQgYXMgc286XG4gKlxuICogY29udGV4dCA9IFtcbiAqICAgLy8gLi4uXG4gKiAgIGNvbmZpZ0ZvcldpZHRoLCAvLyB0aGlzIHdpbGwgYmUgbWFya2VkIERJUlRZXG4gKiAgICd3aWR0aCdcbiAqICAgJzU1NXB4JyxcbiAqICAgMCxcbiAqICAgLy8uLlxuICogXVxuICpcbiAqIFRoZSBjb250ZXh0IGFuZCBkaXJlY3RpdmUgZGF0YSB3aWxsIGFsc28gYmUgbWFya2VkIGRpcnR5LlxuICpcbiAqIERlc3BpdGUgdGhlIGNvbnRleHQgYmVpbmcgdXBkYXRlZCwgbm90aGluZyBoYXMgYmVlbiByZW5kZXJlZCBvbiBzY3JlZW4gKG5vdCBzdHlsZXMgb3JcbiAqIGNsYXNzZXMgaGF2ZSBiZWVuIHNldCBvbiB0aGUgZWxlbWVudCkuIFRvIGtpY2sgb2ZmIHJlbmRlcmluZyBmb3IgYW4gZWxlbWVudCB0aGUgZm9sbG93aW5nXG4gKiBmdW5jdGlvbiBuZWVkcyB0byBiZSBydW4gYGVsZW1lbnRTdHlsaW5nQXBwbHlgLlxuICpcbiAqIGBlbGVtZW50U3R5bGluZ0FwcGx5YCB3aWxsIHJ1biB0aHJvdWdoIHRoZSBjb250ZXh0IGFuZCBmaW5kIGVhY2ggZGlydHkgdmFsdWUgYW5kIHJlbmRlciB0aGVtIG9udG9cbiAqIHRoZSBlbGVtZW50LiBPbmNlIGNvbXBsZXRlLCBhbGwgc3R5bGVzL2NsYXNzZXMgd2lsbCBiZSBzZXQgdG8gY2xlYW4uIEJlY2F1c2Ugb2YgdGhpcywgdGhlIHJlbmRlclxuICogZnVuY3Rpb24gd2lsbCBub3cga25vdyBub3QgdG8gcmVydW4gaXRzZWxmIGFnYWluIGlmIGNhbGxlZCBhZ2FpbiB1bmxlc3MgbmV3IHN0eWxlL2NsYXNzIHZhbHVlc1xuICogaGF2ZSBjaGFuZ2VkLlxuICpcbiAqICMjIERpcmVjdGl2ZXNcbiAqIERpcmVjdGl2ZSBzdHlsZS9jbGFzcyB2YWx1ZXMgKHdoaWNoIGFyZSBwcm92aWRlZCB0aHJvdWdoIGhvc3QgYmluZGluZ3MpIGFyZSBhbHNvIHN1cHBvcnRlZCBhbmRcbiAqIGhvdXNlZCB3aXRoaW4gdGhlIHNhbWUgc3R5bGluZyBjb250ZXh0IGFzIGFyZSB0ZW1wbGF0ZS1sZXZlbCBzdHlsZS9jbGFzcyBwcm9wZXJ0aWVzL2JpbmRpbmdzXG4gKiBTbyBsb25nIGFzIHRoZXkgYXJlIGFsbCBhc3NpZ25lZCB0byB0aGUgc2FtZSBlbGVtZW50LCBib3RoIGRpcmVjdGl2ZS1sZXZlbCBhbmQgdGVtcGxhdGUtbGV2ZWxcbiAqIHN0eWxpbmcgYmluZGluZ3Mgc2hhcmUgdGhlIHNhbWUgY29udGV4dC5cbiAqXG4gKiBFYWNoIG9mIHRoZSBmb2xsb3dpbmcgaW5zdHJ1Y3Rpb25zIHN1cHBvcnRzIGFjY2VwdGluZyBhIGRpcmVjdGl2ZSBpbnN0YW5jZSBhcyBhbiBpbnB1dCBwYXJhbWV0ZXI6XG4gKlxuICogLSBgZWxlbWVudEhvc3RBdHRyc2BcbiAqIC0gYGVsZW1lbnRTdHlsaW5nYFxuICogLSBgZWxlbWVudFN0eWxlUHJvcGBcbiAqIC0gYGVsZW1lbnRDbGFzc1Byb3BgXG4gKiAtIGBlbGVtZW50U3R5bGluZ01hcGBcbiAqIC0gYGVsZW1lbnRTdHlsaW5nQXBwbHlgXG4gKlxuICogRWFjaCB0aW1lIGEgZGlyZWN0aXZlIHZhbHVlIGlzIHBhc3NlZCBpbiwgaXQgd2lsbCBiZSBjb252ZXJ0ZWQgaW50byBhbiBpbmRleCBieSBleGFtaW5pbmcgdGhlXG4gKiBkaXJlY3RpdmUgcmVnaXN0cnkgKHdoaWNoIGxpdmVzIGluIHRoZSBjb250ZXh0IGNvbmZpZ3VyYXRpb24gYXJlYSkuIFRoZSBpbmRleCBpcyB0aGVuIHVzZWRcbiAqIHRvIGhlbHAgc2luZ2xlIHN0eWxlIHByb3BlcnRpZXMgZmlndXJlIG91dCB3aGVyZSBhIHZhbHVlIGlzIGxvY2F0ZWQgaW4gdGhlIGNvbnRleHQuXG4gKlxuICpcbiAqICMjIFNpbmdsZS1sZXZlbCBzdHlsaW5nIGJpbmRpbmdzIChgW3N0eWxlLnByb3BdYCBhbmQgYFtjbGFzcy5uYW1lXWApXG4gKlxuICogQm90aCBgW3N0eWxlLnByb3BdYCBhbmQgYFtjbGFzcy5uYW1lXWAgYmluZGluZ3MgYXJlIHJ1biB0aHJvdWdoIHRoZSBgdXBkYXRlU3R5bGVQcm9wYFxuICogYW5kIGB1cGRhdGVDbGFzc1Byb3BgIGZ1bmN0aW9ucyByZXNwZWN0aXZlbHkuIFRoZXkgd29yayBieSBleGFtaW5pbmcgdGhlIHByb3ZpZGVkXG4gKiBgb2Zmc2V0YCB2YWx1ZSBhbmQgYXJlIGFibGUgdG8gbG9jYXRlIHRoZSBleGFjdCBzcG90IGluIHRoZSBjb250ZXh0IHdoZXJlIHRoZVxuICogbWF0Y2hpbmcgc3R5bGUgaXMgbG9jYXRlZC5cbiAqXG4gKiBCb3RoIGBbc3R5bGUucHJvcF1gIGFuZCBgW2NsYXNzLm5hbWVdYCBiaW5kaW5ncyBhcmUgYWJsZSB0byBwcm9jZXNzIHRoZXNlIHZhbHVlc1xuICogZnJvbSBkaXJlY3RpdmUgaG9zdCBiaW5kaW5ncy4gV2hlbiBldmFsdWF0ZWQgKGZyb20gdGhlIGhvc3QgYmluZGluZyBmdW5jdGlvbikgdGhlXG4gKiBgZGlyZWN0aXZlUmVmYCB2YWx1ZSBpcyB0aGVuIHBhc3NlZCBpbi5cbiAqXG4gKiBJZiB0d28gZGlyZWN0aXZlcyBvciBhIGRpcmVjdGl2ZSArIGEgdGVtcGxhdGUgYmluZGluZyBib3RoIHdyaXRlIHRvIHRoZSBzYW1lIHN0eWxlL2NsYXNzXG4gKiBiaW5kaW5nIHRoZW4gdGhlIHN0eWxpbmcgY29udGV4dCBjb2RlIHdpbGwgZGVjaWRlIHdoaWNoIG9uZSB3aW5zIGJhc2VkIG9uIHRoZSBmb2xsb3dpbmdcbiAqIHJ1bGU6XG4gKlxuICogMS4gSWYgdGhlIHRlbXBsYXRlIGJpbmRpbmcgaGFzIGEgdmFsdWUgdGhlbiBpdCBhbHdheXMgd2luc1xuICogMi4gT3RoZXJ3aXNlIHdoaWNoZXZlciBmaXJzdC1yZWdpc3RlcmVkIGRpcmVjdGl2ZSB0aGF0IGhhcyB0aGF0IHZhbHVlIGZpcnN0IHdpbGwgd2luXG4gKlxuICogVGhlIGNvZGUgZXhhbXBsZSBoZWxwcyBtYWtlIHRoaXMgY2xlYXI6XG4gKlxuICogYGBgXG4gKiA8IS0tXG4gKiA8ZGl2IFtzdHlsZS53aWR0aF09XCJteVdpZHRoXCJcbiAqICAgICAgW215LXdpZHRoLWRpcmVjdGl2ZV09XCInNjAwcHgnXCI+XG4gKiAtLT5cbiAqXG4gKiBARGlyZWN0aXZlKHtcbiAqICBzZWxlY3RvcjogJ1tteS13aWR0aC1kaXJlY3RpdmUnXVxuICogfSlcbiAqIGNsYXNzIE15V2lkdGhEaXJlY3RpdmUge1xuICogICBASW5wdXQoJ215LXdpZHRoLWRpcmVjdGl2ZScpXG4gKiAgIEBIb3N0QmluZGluZygnc3R5bGUud2lkdGgnKVxuICogICBwdWJsaWMgd2lkdGggPSBudWxsO1xuICogfVxuICogYGBgXG4gKlxuICogU2luY2UgdGhlcmUgaXMgYSBzdHlsZSBiaW5kaW5nIGZvciB3aWR0aCBwcmVzZW50IG9uIHRoZSBlbGVtZW50IChgW3N0eWxlLndpZHRoXWApIHRoZW5cbiAqIGl0IHdpbGwgYWx3YXlzIHdpbiBvdmVyIHRoZSB3aWR0aCBiaW5kaW5nIHRoYXQgaXMgcHJlc2VudCBhcyBhIGhvc3QgYmluZGluZyB3aXRoaW5cbiAqIHRoZSBgTXlXaWR0aERpcmVjdGl2ZWAuIEhvd2V2ZXIsIGlmIGBbc3R5bGUud2lkdGhdYCByZW5kZXJzIGFzIGBudWxsYCAoc28gYG15V2lkdGg9bnVsbGApXG4gKiB0aGVuIHRoZSBgTXlXaWR0aERpcmVjdGl2ZWAgd2lsbCBiZSBhYmxlIHRvIHdyaXRlIHRvIHRoZSBgd2lkdGhgIHN0eWxlIHdpdGhpbiB0aGUgY29udGV4dC5cbiAqIFNpbXBseSBwdXQsIHdoaWNoZXZlciBkaXJlY3RpdmUgd3JpdGVzIHRvIGEgdmFsdWUgZmlyc3QgZW5kcyB1cCBoYXZpbmcgb3duZXJzaGlwIG9mIGl0IGFzXG4gKiBsb25nIGFzIHRoZSB0ZW1wbGF0ZSBkaWRuJ3Qgc2V0IGFueXRoaW5nLlxuICpcbiAqIFRoZSB3YXkgaW4gd2hpY2ggdGhlIG93bmVyc2hpcCBpcyBmYWNpbGl0YXRlZCBpcyB0aHJvdWdoIGluZGV4IHZhbHVlLiBUaGUgZWFybGllc3QgZGlyZWN0aXZlc1xuICogZ2V0IHRoZSBzbWFsbGVzdCBpbmRleCB2YWx1ZXMgKHdpdGggMCBiZWluZyByZXNlcnZlZCBmb3IgdGhlIHRlbXBsYXRlIGVsZW1lbnQgYmluZGluZ3MpLiBFYWNoXG4gKiB0aW1lIGEgdmFsdWUgaXMgd3JpdHRlbiBmcm9tIGEgZGlyZWN0aXZlIG9yIHRoZSB0ZW1wbGF0ZSBiaW5kaW5ncywgdGhlIHZhbHVlIGl0c2VsZiBnZXRzXG4gKiBhc3NpZ25lZCB0aGUgZGlyZWN0aXZlIGluZGV4IHZhbHVlIGluIGl0cyBkYXRhLiBJZiBhbm90aGVyIGRpcmVjdGl2ZSB3cml0ZXMgYSB2YWx1ZSBhZ2FpbiB0aGVuXG4gKiBpdHMgZGlyZWN0aXZlIGluZGV4IGdldHMgY29tcGFyZWQgYWdhaW5zdCB0aGUgZGlyZWN0aXZlIGluZGV4IHRoYXQgZXhpc3RzIG9uIHRoZSBlbGVtZW50LiBPbmx5XG4gKiB3aGVuIHRoZSBuZXcgdmFsdWUncyBkaXJlY3RpdmUgaW5kZXggaXMgbGVzcyB0aGFuIHRoZSBleGlzdGluZyBkaXJlY3RpdmUgaW5kZXggdGhlbiB0aGUgbmV3XG4gKiB2YWx1ZSB3aWxsIGJlIHdyaXR0ZW4gdG8gdGhlIGNvbnRleHQuIEJ1dCwgaWYgdGhlIGV4aXN0aW5nIHZhbHVlIGlzIG51bGwgdGhlbiB0aGUgbmV3IHZhbHVlIGlzXG4gKiB3cml0dGVuIGJ5IHRoZSBsZXNzIGltcG9ydGFudCBkaXJlY3RpdmUuXG4gKlxuICogRWFjaCBkaXJlY3RpdmUgYWxzbyBoYXMgaXRzIG93biBzYW5pdGl6ZXIgYW5kIGRpcnR5IGZsYWdzLiBUaGVzZSB2YWx1ZXMgYXJlIGNvbnN1bWVkIHdpdGhpbiB0aGVcbiAqIHJlbmRlcmluZyBmdW5jdGlvbi5cbiAqXG4gKlxuICogIyMgTXVsdGktbGV2ZWwgc3R5bGluZyBiaW5kaW5ncyAoYFtzdHlsZV1gIGFuZCBgW2NsYXNzXWApXG4gKlxuICogTXVsdGktbGV2ZWwgc3R5bGluZyBiaW5kaW5ncyBhcmUgdHJlYXRlZCBhcyBsZXNzIGltcG9ydGFudCAobGVzcyBzcGVjaWZpYykgYXMgc2luZ2xlLWxldmVsXG4gKiBiaW5kaW5ncyAodGhpbmdzIGxpa2UgYFtzdHlsZS5wcm9wXWAgYW5kIGBbY2xhc3MubmFtZV1gKS5cbiAqXG4gKiBNdWx0aS1sZXZlbCBiaW5kaW5ncyBhcmUgc3RpbGwgYXBwbGllZCB0byB0aGUgY29udGV4dCBpbiBhIHNpbWlsYXIgd2F5IGFzIGFyZSBzaW5nbGUgbGV2ZWxcbiAqIGJpbmRpbmdzLCBidXQgdGhpcyBwcm9jZXNzIHdvcmtzIGJ5IGRpZmZpbmcgdGhlIG5ldyBtdWx0aS1sZXZlbCB2YWx1ZXMgKHdoaWNoIGFyZSBrZXkvdmFsdWVcbiAqIG1hcHMpIGFnYWluc3QgdGhlIGV4aXN0aW5nIHNldCBvZiBzdHlsZXMgdGhhdCBsaXZlIGluIHRoZSBjb250ZXh0LiBFYWNoIHRpbWUgYSBuZXcgbWFwIHZhbHVlXG4gKiBpcyBkZXRlY3RlZCAodmlhIGlkZW50aXR5IGNoZWNrKSB0aGVuIGl0IHdpbGwgbG9vcCB0aHJvdWdoIHRoZSB2YWx1ZXMgYW5kIGZpZ3VyZSBvdXQgd2hhdFxuICogaGFzIGNoYW5nZWQgYW5kIHJlb3JkZXIgdGhlIGNvbnRleHQgYXJyYXkgdG8gbWF0Y2ggdGhlIG9yZGVyaW5nIG9mIHRoZSBrZXlzLiBUaGlzIHJlb3JkZXJpbmdcbiAqIG9mIHRoZSBjb250ZXh0IG1ha2VzIHN1cmUgdGhhdCBmb2xsb3ctdXAgdHJhdmVyc2FscyBvZiB0aGUgY29udGV4dCB3aGVuIHVwZGF0ZWQgYWdhaW5zdCB0aGVcbiAqIGtleS92YWx1ZSBtYXAgYXJlIGFzIGNsb3NlIGFzIHBvc3NpYmxlIHRvIG8obikgKHdoZXJlIFwiblwiIGlzIHRoZSBzaXplIG9mIHRoZSBrZXkvdmFsdWUgbWFwKS5cbiAqXG4gKiBJZiBhIGBkaXJlY3RpdmVSZWZgIHZhbHVlIGlzIHBhc3NlZCBpbiB0aGVuIHRoZSBzdHlsaW5nIGFsZ29yaXRobSBjb2RlIHdpbGwgdGFrZSB0aGUgZGlyZWN0aXZlJ3NcbiAqIHByaW9yaXRpemF0aW9uIGluZGV4IGludG8gYWNjb3VudCBhbmQgdXBkYXRlIHRoZSB2YWx1ZXMgd2l0aCByZXNwZWN0IHRvIG1vcmUgaW1wb3J0YW50XG4gKiBkaXJlY3RpdmVzLiBUaGlzIG1lYW5zIHRoYXQgaWYgYSB2YWx1ZSBzdWNoIGFzIGB3aWR0aGAgaXMgdXBkYXRlZCBpbiB0d28gZGlmZmVyZW50IGBbc3R5bGVdYFxuICogYmluZGluZ3MgKHNheSBvbmUgb24gdGhlIHRlbXBsYXRlIGFuZCBhbm90aGVyIHdpdGhpbiBhIGRpcmVjdGl2ZSB0aGF0IHNpdHMgb24gdGhlIHNhbWUgZWxlbWVudClcbiAqIHRoZW4gdGhlIGFsZ29yaXRobSB3aWxsIGRlY2lkZSBob3cgdG8gdXBkYXRlIHRoZSB2YWx1ZSBiYXNlZCBvbiB0aGUgZm9sbG93aW5nIGhldXJpc3RpYzpcbiAqXG4gKiAxLiBJZiB0aGUgdGVtcGxhdGUgYmluZGluZyBoYXMgYSB2YWx1ZSB0aGVuIGl0IGFsd2F5cyB3aW5zXG4gKiAyLiBJZiBub3QgdGhlbiB3aGljaGV2ZXIgZmlyc3QtcmVnaXN0ZXJlZCBkaXJlY3RpdmUgdGhhdCBoYXMgdGhhdCB2YWx1ZSBmaXJzdCB3aWxsIHdpblxuICpcbiAqIEl0IHdpbGwgYWxzbyB1cGRhdGUgdGhlIHZhbHVlIGlmIGl0IHdhcyBzZXQgdG8gYG51bGxgIGJ5IGEgcHJldmlvdXMgZGlyZWN0aXZlIChvciB0aGUgdGVtcGxhdGUpLlxuICpcbiAqIEVhY2ggdGltZSBhIHZhbHVlIGlzIHVwZGF0ZWQgKG9yIHJlbW92ZWQpIHRoZW4gdGhlIGNvbnRleHQgd2lsbCBjaGFuZ2Ugc2hhcGUgdG8gYmV0dGVyIG1hdGNoXG4gKiB0aGUgb3JkZXJpbmcgb2YgdGhlIHN0eWxpbmcgZGF0YSBhcyB3ZWxsIGFzIHRoZSBvcmRlcmluZyBvZiBlYWNoIGRpcmVjdGl2ZSB0aGF0IGNvbnRhaW5zIHN0eWxpbmdcbiAqIGRhdGEuIChTZWUgYHBhdGNoU3R5bGluZ01hcEludG9Db250ZXh0YCBpbnNpZGUgb2YgY2xhc3NfYW5kX3N0eWxlX2JpbmRpbmdzLnRzIHRvIGJldHRlclxuICogdW5kZXJzdGFuZCBob3cgdGhpcyB3b3Jrcy4pXG4gKlxuICogIyMgUmVuZGVyaW5nXG4gKiBUaGUgcmVuZGVyaW5nIG1lY2hhbmlzbSAod2hlbiB0aGUgc3R5bGluZyBkYXRhIGlzIGFwcGxpZWQgb24gc2NyZWVuKSBvY2N1cnMgdmlhIHRoZVxuICogYGVsZW1lbnRTdHlsaW5nQXBwbHlgIGZ1bmN0aW9uIGFuZCBpcyBkZXNpZ25lZCB0byBydW4gYWZ0ZXIgKiphbGwqKiBzdHlsaW5nIGZ1bmN0aW9ucyBoYXZlIGJlZW5cbiAqIGV2YWx1YXRlZC4gVGhlIHJlbmRlcmluZyBhbGdvcml0aG0gd2lsbCBsb29wIG92ZXIgdGhlIGNvbnRleHQgYW5kIG9ubHkgYXBwbHkgdGhlIHN0eWxlcyB0aGF0IGFyZVxuICogZmxhZ2dlZCBhcyBkaXJ0eSAoZWl0aGVyIGJlY2F1c2UgdGhleSBhcmUgbmV3LCB1cGRhdGVkIG9yIGhhdmUgYmVlbiByZW1vdmVkIHZpYSBtdWx0aSBvclxuICogc2luZ2xlIGJpbmRpbmdzKS5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBTdHlsaW5nQ29udGV4dCBleHRlbmRzXG4gICAgQXJyYXk8e1trZXk6IHN0cmluZ106IGFueX18bnVtYmVyfHN0cmluZ3xib29sZWFufFJFbGVtZW50fFN0eWxlU2FuaXRpemVGbnxQbGF5ZXJDb250ZXh0fG51bGw+IHtcbiAgLyoqXG4gICAqIExvY2F0aW9uIG9mIGVsZW1lbnQgdGhhdCBpcyB1c2VkIGFzIGEgdGFyZ2V0IGZvciB0aGlzIGNvbnRleHQuXG4gICAqL1xuICBbU3R5bGluZ0luZGV4LkVsZW1lbnRQb3NpdGlvbl06IExDb250YWluZXJ8TFZpZXd8UkVsZW1lbnR8bnVsbDtcblxuICAvKipcbiAgICogQSBudW1lcmljIHZhbHVlIHJlcHJlc2VudGluZyB0aGUgY29uZmlndXJhdGlvbiBzdGF0dXMgKHdoZXRoZXIgdGhlIGNvbnRleHQgaXMgZGlydHkgb3Igbm90KVxuICAgKiBtaXhlZCB0b2dldGhlciAodXNpbmcgYml0IHNoaWZ0aW5nKSB3aXRoIGEgaW5kZXggdmFsdWUgd2hpY2ggdGVsbHMgdGhlIHN0YXJ0aW5nIGluZGV4IHZhbHVlXG4gICAqIG9mIHdoZXJlIHRoZSBtdWx0aSBzdHlsZSBlbnRyaWVzIGJlZ2luLlxuICAgKi9cbiAgW1N0eWxpbmdJbmRleC5NYXN0ZXJGbGFnUG9zaXRpb25dOiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIExvY2F0aW9uIG9mIHRoZSBjb2xsZWN0aW9uIG9mIGRpcmVjdGl2ZXMgZm9yIHRoaXMgY29udGV4dFxuICAgKi9cbiAgW1N0eWxpbmdJbmRleC5EaXJlY3RpdmVSZWdpc3RyeVBvc2l0aW9uXTogRGlyZWN0aXZlUmVnaXN0cnlWYWx1ZXM7XG5cbiAgLyoqXG4gICAqIExvY2F0aW9uIG9mIGFsbCBzdGF0aWMgc3R5bGVzIHZhbHVlc1xuICAgKi9cbiAgW1N0eWxpbmdJbmRleC5Jbml0aWFsU3R5bGVWYWx1ZXNQb3NpdGlvbl06IEluaXRpYWxTdHlsaW5nVmFsdWVzO1xuXG4gIC8qKlxuICAgKiBMb2NhdGlvbiBvZiBhbGwgc3RhdGljIGNsYXNzIHZhbHVlc1xuICAgKi9cbiAgW1N0eWxpbmdJbmRleC5Jbml0aWFsQ2xhc3NWYWx1ZXNQb3NpdGlvbl06IEluaXRpYWxTdHlsaW5nVmFsdWVzO1xuXG4gIC8qKlxuICAgKiBBIG51bWVyaWMgdmFsdWUgcmVwcmVzZW50aW5nIHRoZSBjbGFzcyBpbmRleCBvZmZzZXQgdmFsdWUuIFdoZW5ldmVyIGEgc2luZ2xlIGNsYXNzIGlzXG4gICAqIGFwcGxpZWQgKHVzaW5nIGBlbGVtZW50Q2xhc3NQcm9wYCkgaXQgc2hvdWxkIGhhdmUgYW4gc3R5bGluZyBpbmRleCB2YWx1ZSB0aGF0IGRvZXNuJ3RcbiAgICogbmVlZCB0byB0YWtlIGludG8gYWNjb3VudCBhbnkgc3R5bGUgdmFsdWVzIHRoYXQgZXhpc3QgaW4gdGhlIGNvbnRleHQuXG4gICAqL1xuICBbU3R5bGluZ0luZGV4LlNpbmdsZVByb3BPZmZzZXRQb3NpdGlvbnNdOiBTaW5nbGVQcm9wT2Zmc2V0VmFsdWVzO1xuXG4gIC8qKlxuICAgKiBUaGUgbGFzdCBjbGFzcyB2YWx1ZSB0aGF0IHdhcyBpbnRlcnByZXRlZCBieSBlbGVtZW50U3R5bGluZ01hcC4gVGhpcyBpcyBjYWNoZWRcbiAgICogU28gdGhhdCB0aGUgYWxnb3JpdGhtIGNhbiBleGl0IGVhcmx5IGluY2FzZSB0aGUgdmFsdWUgaGFzIG5vdCBjaGFuZ2VkLlxuICAgKi9cbiAgW1N0eWxpbmdJbmRleC5DYWNoZWRNdWx0aUNsYXNzZXNdOiBhbnl8TWFwQmFzZWRPZmZzZXRWYWx1ZXM7XG5cbiAgLyoqXG4gICAqIFRoZSBsYXN0IHN0eWxlIHZhbHVlIHRoYXQgd2FzIGludGVycHJldGVkIGJ5IGVsZW1lbnRTdHlsaW5nTWFwLiBUaGlzIGlzIGNhY2hlZFxuICAgKiBTbyB0aGF0IHRoZSBhbGdvcml0aG0gY2FuIGV4aXQgZWFybHkgaW5jYXNlIHRoZSB2YWx1ZSBoYXMgbm90IGNoYW5nZWQuXG4gICAqL1xuICBbU3R5bGluZ0luZGV4LkNhY2hlZE11bHRpU3R5bGVzXTogYW55fE1hcEJhc2VkT2Zmc2V0VmFsdWVzO1xuXG4gIC8qKlxuICAgKiBMb2NhdGlvbiBvZiBhbmltYXRpb24gY29udGV4dCAod2hpY2ggY29udGFpbnMgdGhlIGFjdGl2ZSBwbGF5ZXJzKSBmb3IgdGhpcyBlbGVtZW50IHN0eWxpbmdcbiAgICogY29udGV4dC5cbiAgICovXG4gIFtTdHlsaW5nSW5kZXguUGxheWVyQ29udGV4dF06IFBsYXllckNvbnRleHR8bnVsbDtcbn1cblxuLyoqXG4gKiBVc2VkIGFzIGEgc3R5bGluZyBhcnJheSB0byBob3VzZSBzdGF0aWMgY2xhc3MgYW5kIHN0eWxlIHZhbHVlcyB0aGF0IHdlcmUgZXh0cmFjdGVkXG4gKiBieSB0aGUgY29tcGlsZXIgYW5kIHBsYWNlZCBpbiB0aGUgYW5pbWF0aW9uIGNvbnRleHQgdmlhIGBlbGVtZW50U3RhcnRgIGFuZFxuICogYGVsZW1lbnRIb3N0QXR0cnNgLlxuICpcbiAqIFNlZSBbSW5pdGlhbFN0eWxpbmdWYWx1ZXNJbmRleF0gZm9yIGEgYnJlYWtkb3duIG9mIGhvdyBhbGwgdGhpcyB3b3Jrcy5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBJbml0aWFsU3R5bGluZ1ZhbHVlcyBleHRlbmRzIEFycmF5PHN0cmluZ3xib29sZWFufG51bWJlcnxudWxsPiB7XG4gIFtJbml0aWFsU3R5bGluZ1ZhbHVlc0luZGV4LkRlZmF1bHROdWxsVmFsdWVQb3NpdGlvbl06IG51bGw7XG4gIFtJbml0aWFsU3R5bGluZ1ZhbHVlc0luZGV4LkNhY2hlZFN0cmluZ1ZhbHVlUG9zaXRpb25dOiBzdHJpbmd8bnVsbDtcbn1cblxuLyoqXG4gKiBVc2VkIGFzIGFuIG9mZnNldC9wb3NpdGlvbiBpbmRleCB0byBmaWd1cmUgb3V0IHdoZXJlIGluaXRpYWwgc3R5bGluZ1xuICogdmFsdWVzIGFyZSBsb2NhdGVkLlxuICpcbiAqIFVzZWQgYXMgYSByZWZlcmVuY2UgcG9pbnQgdG8gcHJvdmlkZSBtYXJrZXJzIHRvIGFsbCBzdGF0aWMgc3R5bGluZ1xuICogdmFsdWVzICh0aGUgaW5pdGlhbCBzdHlsZSBhbmQgY2xhc3MgdmFsdWVzIG9uIGFuIGVsZW1lbnQpIHdpdGhpbiBhblxuICogYXJyYXkgd2l0aGluIHRoZSBgU3R5bGluZ0NvbnRleHRgLiBUaGlzIGFycmF5IGNvbnRhaW5zIGtleS92YWx1ZSBwYWlyc1xuICogd2hlcmUgdGhlIGtleSBpcyB0aGUgc3R5bGUgcHJvcGVydHkgbmFtZSBvciBjbGFzc05hbWUgYW5kIHRoZSB2YWx1ZSBpc1xuICogdGhlIHN0eWxlIHZhbHVlIG9yIHdoZXRoZXIgb3Igbm90IGEgY2xhc3MgaXMgcHJlc2VudCBvbiB0aGUgZWxtZW50LlxuICpcbiAqIFRoZSBmaXJzdCB2YWx1ZSBpcyBhbHdheXMgbnVsbCBzbyB0aGF0IGEgaW5pdGlhbCBpbmRleCB2YWx1ZSBvZlxuICogYDBgIHdpbGwgYWx3YXlzIHBvaW50IHRvIGEgbnVsbCB2YWx1ZS5cbiAqXG4gKiBUaGUgc2Vjb25kIHZhbHVlIGlzIGFsc28gYWx3YXlzIG51bGwgdW5sZXNzIGEgc3RyaW5nLWJhc2VkIHJlcHJlc2VudGF0aW9uXG4gKiBvZiB0aGUgc3R5bGluZyBkYXRhIHdhcyBjb25zdHJ1Y3RlZCAoaXQgZ2V0cyBjYWNoZWQgaW4gdGhpcyBzbG90KS5cbiAqXG4gKiBJZiBhIDxkaXY+IGVsZW1lbnRzIGNvbnRhaW5zIGEgbGlzdCBvZiBzdGF0aWMgc3R5bGluZyB2YWx1ZXMgbGlrZSBzbzpcbiAqXG4gKiA8ZGl2IGNsYXNzPVwiZm9vIGJhciBiYXpcIiBzdHlsZT1cIndpZHRoOjEwMHB4OyBoZWlnaHQ6MjAwcHg7XCI+XG4gKlxuICogVGhlbiB0aGUgaW5pdGlhbCBzdHlsZXMgZm9yIHRoYXQgd2lsbCBsb29rIGxpa2Ugc286XG4gKlxuICogU3R5bGVzOlxuICogYGBgXG4gKiBTdHlsaW5nQ29udGV4dFtJbml0aWFsU3R5bGVzSW5kZXhdID0gW1xuICogICBudWxsLCBudWxsLCAnd2lkdGgnLCAnMTAwcHgnLCBoZWlnaHQsICcyMDBweCdcbiAqIF1cbiAqIGBgYFxuICpcbiAqIENsYXNzZXM6XG4gKiBgYGBcbiAqIFN0eWxpbmdDb250ZXh0W0luaXRpYWxDbGFzc2VzSW5kZXhdID0gW1xuICogICBudWxsLCBudWxsLCAnZm9vJywgdHJ1ZSwgJ2JhcicsIHRydWUsICdiYXonLCB0cnVlXG4gKiBdXG4gKiBgYGBcbiAqXG4gKiBJbml0aWFsIHN0eWxlIGFuZCBjbGFzcyBlbnRyaWVzIGhhdmUgdGhlaXIgb3duIGFycmF5cy4gVGhpcyBpcyBiZWNhdXNlXG4gKiBpdCdzIGVhc2llciB0byBhZGQgdG8gdGhlIGVuZCBvZiBvbmUgYXJyYXkgYW5kIG5vdCB0aGVuIGhhdmUgdG8gdXBkYXRlXG4gKiBldmVyeSBjb250ZXh0IGVudHJpZXMnIHBvaW50ZXIgaW5kZXggdG8gdGhlIG5ld2x5IG9mZnNldGVkIHZhbHVlcy5cbiAqXG4gKiBXaGVuIHByb3BlcnR5IGJpbmRpbmRzIGFyZSBhZGRlZCB0byBhIGNvbnRleHQgdGhlbiBpbml0aWFsIHN0eWxlL2NsYXNzXG4gKiB2YWx1ZXMgd2lsbCBhbHNvIGJlIGluc2VydGVkIGludG8gdGhlIGFycmF5LiBUaGlzIGlzIHRvIGNyZWF0ZSBhIHNwYWNlXG4gKiBpbiB0aGUgc2l0dWF0aW9uIHdoZW4gYSBmb2xsb3ctdXAgZGlyZWN0aXZlIGluc2VydHMgc3RhdGljIHN0eWxpbmcgaW50b1xuICogdGhlIGFycmF5LiBCeSBkZWZhdWx0LCBzdHlsZSB2YWx1ZXMgYXJlIGBudWxsYCBhbmQgY2xhc3MgdmFsdWVzIGFyZVxuICogYGZhbHNlYCB3aGVuIGluc2VydGVkIGJ5IHByb3BlcnR5IGJpbmRpbmdzLlxuICpcbiAqIEZvciBleGFtcGxlOlxuICogYGBgXG4gKiA8ZGl2IGNsYXNzPVwiZm9vIGJhciBiYXpcIlxuICogICAgICBbY2xhc3MuY2FyXT1cIm15Q2FyRXhwXCJcbiAqICAgICAgc3R5bGU9XCJ3aWR0aDoxMDBweDsgaGVpZ2h0OjIwMHB4O1wiXG4gKiAgICAgIFtzdHlsZS5vcGFjaXR5XT1cIm15T3BhY2l0eUV4cFwiPlxuICogYGBgXG4gKlxuICogV2lsbCBjb25zdHJ1Y3QgaW5pdGlhbCBzdHlsaW5nIHZhbHVlcyB0aGF0IGxvb2sgbGlrZTpcbiAqXG4gKiBTdHlsZXM6XG4gKiBgYGBcbiAqIFN0eWxpbmdDb250ZXh0W0luaXRpYWxTdHlsZXNJbmRleF0gPSBbXG4gKiAgIG51bGwsIG51bGwsICd3aWR0aCcsICcxMDBweCcsIGhlaWdodCwgJzIwMHB4JywgJ29wYWNpdHknLCBudWxsXG4gKiBdXG4gKiBgYGBcbiAqXG4gKiBDbGFzc2VzOlxuICogYGBgXG4gKiBTdHlsaW5nQ29udGV4dFtJbml0aWFsQ2xhc3Nlc0luZGV4XSA9IFtcbiAqICAgbnVsbCwgbnVsbCwgJ2ZvbycsIHRydWUsICdiYXInLCB0cnVlLCAnYmF6JywgdHJ1ZSwgJ2NhcicsIGZhbHNlXG4gKiBdXG4gKiBgYGBcbiAqXG4gKiBOb3cgaWYgYSBkaXJlY3RpdmUgY29tZXMgYWxvbmcgYW5kIGludHJvZHVjZXMgYGNhcmAgYXMgYSBzdGF0aWNcbiAqIGNsYXNzIHZhbHVlIG9yIGBvcGFjaXR5YCB0aGVuIHRob3NlIHZhbHVlcyB3aWxsIGJlIGZpbGxlZCBpbnRvXG4gKiB0aGUgaW5pdGlhbCBzdHlsZXMgYXJyYXkuXG4gKlxuICogRm9yIGV4YW1wbGU6XG4gKlxuICogYGBgXG4gKiBARGlyZWN0aXZlKHtcbiAqICAgc2VsZWN0b3I6ICdvcGFjaXR5LWNhci1kaXJlY3RpdmUnLFxuICogICBob3N0OiB7XG4gKiAgICAgJ3N0eWxlJzogJ29wYWNpdHk6MC41JyxcbiAqICAgICAnY2xhc3MnOiAnY2FyJ1xuICogICB9XG4gKiB9KVxuICogY2xhc3MgT3BhY2l0eUNhckRpcmVjdGl2ZSB7fVxuICogYGBgXG4gKlxuICogVGhpcyB3aWxsIHJlbmRlciBpdHNlbGYgYXM6XG4gKlxuICogU3R5bGVzOlxuICogYGBgXG4gKiBTdHlsaW5nQ29udGV4dFtJbml0aWFsU3R5bGVzSW5kZXhdID0gW1xuICogICBudWxsLCBudWxsLCAnd2lkdGgnLCAnMTAwcHgnLCBoZWlnaHQsICcyMDBweCcsICdvcGFjaXR5JywgJzAuNSdcbiAqIF1cbiAqIGBgYFxuICpcbiAqIENsYXNzZXM6XG4gKiBgYGBcbiAqIFN0eWxpbmdDb250ZXh0W0luaXRpYWxDbGFzc2VzSW5kZXhdID0gW1xuICogICBudWxsLCBudWxsLCAnZm9vJywgdHJ1ZSwgJ2JhcicsIHRydWUsICdiYXonLCB0cnVlLCAnY2FyJywgdHJ1ZVxuICogXVxuICogYGBgXG4gKi9cbmV4cG9ydCBjb25zdCBlbnVtIEluaXRpYWxTdHlsaW5nVmFsdWVzSW5kZXgge1xuICAvKipcbiAgICogVGhlIGZpcnN0IHZhbHVlIGlzIGFsd2F5cyBgbnVsbGAgc28gdGhhdCBgc3R5bGVzWzBdID09IG51bGxgIGZvciB1bmFzc2lnbmVkIHZhbHVlc1xuICAgKi9cbiAgRGVmYXVsdE51bGxWYWx1ZVBvc2l0aW9uID0gMCxcblxuICAvKipcbiAgICogVXNlZCBmb3Igbm9uLXN0eWxpbmcgY29kZSB0byBleGFtaW5lIHdoYXQgdGhlIHN0eWxlIG9yIGNsYXNzTmFtZSBzdHJpbmcgaXM6XG4gICAqIHN0eWxlczogWyd3aWR0aCcsICcxMDBweCcsIDAsICdvcGFjaXR5JywgbnVsbCwgMCwgJ2hlaWdodCcsICcyMDBweCcsIDBdXG4gICAqICAgID0+IGluaXRpYWxTdHlsZXNbQ2FjaGVkU3RyaW5nVmFsdWVQb3NpdGlvbl0gPSAnd2lkdGg6MTAwcHg7aGVpZ2h0OjIwMHB4JztcbiAgICogY2xhc3NlczogWydmb28nLCB0cnVlLCAwLCAnYmFyJywgZmFsc2UsIDAsICdiYXonLCB0cnVlLCAwXVxuICAgKiAgICA9PiBpbml0aWFsQ2xhc3Nlc1tDYWNoZWRTdHJpbmdWYWx1ZVBvc2l0aW9uXSA9ICdmb28gYmFyJztcbiAgICpcbiAgICogTm90ZSB0aGF0IHRoaXMgdmFsdWUgaXMgYG51bGxgIGJ5IGRlZmF1bHQgYW5kIGl0IHdpbGwgb25seSBiZSBwb3B1bGF0ZWRcbiAgICogb25jZSBgZ2V0SW5pdGlhbFN0eWxlU3RyaW5nVmFsdWVgIG9yIGBnZXRJbml0aWFsQ2xhc3NOYW1lVmFsdWVgIGlzIGV4ZWN1dGVkLlxuICAgKi9cbiAgQ2FjaGVkU3RyaW5nVmFsdWVQb3NpdGlvbiA9IDEsXG5cbiAgLyoqXG4gICAqIFdoZXJlIHRoZSBzdHlsZSBvciBjbGFzcyB2YWx1ZXMgc3RhcnQgaW4gdGhlIHR1cGxlXG4gICAqL1xuICBLZXlWYWx1ZVN0YXJ0UG9zaXRpb24gPSAyLFxuXG4gIC8qKlxuICAgKiBUaGUgb2Zmc2V0IHZhbHVlIChpbmRleCArIG9mZnNldCkgZm9yIHRoZSBwcm9wZXJ0eSB2YWx1ZSBmb3IgZWFjaCBzdHlsZS9jbGFzcyBlbnRyeVxuICAgKi9cbiAgUHJvcE9mZnNldCA9IDAsXG5cbiAgLyoqXG4gICAqIFRoZSBvZmZzZXQgdmFsdWUgKGluZGV4ICsgb2Zmc2V0KSBmb3IgdGhlIHN0eWxlL2NsYXNzIHZhbHVlIGZvciBlYWNoIHN0eWxlL2NsYXNzIGVudHJ5XG4gICAqL1xuICBWYWx1ZU9mZnNldCA9IDEsXG5cbiAgLyoqXG4gICAqIFRoZSBvZmZzZXQgdmFsdWUgKGluZGV4ICsgb2Zmc2V0KSBmb3IgdGhlIHN0eWxlL2NsYXNzIGRpcmVjdGl2ZSBvd25lciBmb3IgZWFjaCBzdHlsZS9jbGFzc1xuICAgICBlbnRyeVxuICAgKi9cbiAgRGlyZWN0aXZlT3duZXJPZmZzZXQgPSAyLFxuXG4gIC8qKlxuICAgKiBUaGUgdG90YWwgc2l6ZSBmb3IgZWFjaCBzdHlsZS9jbGFzcyBlbnRyeSAocHJvcCArIHZhbHVlICsgZGlyZWN0aXZlT3duZXIpXG4gICAqL1xuICBTaXplID0gM1xufVxuXG4vKipcbiAqIEFuIGFycmF5IGxvY2F0ZWQgaW4gdGhlIFN0eWxpbmdDb250ZXh0IHRoYXQgaG91c2VzIGFsbCBkaXJlY3RpdmUgaW5zdGFuY2VzIGFuZCBhZGRpdGlvbmFsXG4gKiBkYXRhIGFib3V0IHRoZW0uXG4gKlxuICogRWFjaCBlbnRyeSBpbiB0aGlzIGFycmF5IHJlcHJlc2VudHMgYSBzb3VyY2Ugb2Ygd2hlcmUgc3R5bGUvY2xhc3MgYmluZGluZyB2YWx1ZXMgY291bGRcbiAqIGNvbWUgZnJvbS4gQnkgZGVmYXVsdCwgdGhlcmUgaXMgYWx3YXlzIGF0IGxlYXN0IG9uZSBkaXJlY3RpdmUgaGVyZSB3aXRoIGEgbnVsbCB2YWx1ZSBhbmRcbiAqIHRoYXQgcmVwcmVzZW50cyBiaW5kaW5ncyB0aGF0IGxpdmUgZGlyZWN0bHkgb24gYW4gZWxlbWVudCBpbiB0aGUgdGVtcGxhdGUgKG5vdCBob3N0IGJpbmRpbmdzKS5cbiAqXG4gKiBFYWNoIHN1Y2Nlc3NpdmUgZW50cnkgaW4gdGhlIGFycmF5IGlzIGFuIGFjdHVhbCBpbnN0YW5jZSBvZiBhIGRpcmVjdGl2ZSBhcyB3ZWxsIGFzIHNvbWVcbiAqIGFkZGl0aW9uYWwgaW5mbyBhYm91dCB0aGF0IGVudHJ5LlxuICpcbiAqIEFuIGVudHJ5IHdpdGhpbiB0aGlzIGFycmF5IGhhcyB0aGUgZm9sbG93aW5nIHZhbHVlczpcbiAqIFswXSA9IFRoZSBpbnN0YW5jZSBvZiB0aGUgZGlyZWN0aXZlICh0aGUgZmlyc3QgZW50cnkgaXMgbnVsbCBiZWNhdXNlIGl0cyByZXNlcnZlZCBmb3IgdGhlXG4gKiAgICAgICB0ZW1wbGF0ZSlcbiAqIFsxXSA9IFRoZSBwb2ludGVyIHRoYXQgdGVsbHMgd2hlcmUgdGhlIHNpbmdsZSBzdHlsaW5nIChzdHVmZiBsaWtlIFtjbGFzcy5mb29dIGFuZCBbc3R5bGUucHJvcF0pXG4gKiAgICAgICBvZmZzZXQgdmFsdWVzIGFyZSBsb2NhdGVkLiBUaGlzIHZhbHVlIHdpbGwgYWxsb3cgZm9yIGEgYmluZGluZyBpbnN0cnVjdGlvbiB0byBmaW5kIGV4YWN0bHlcbiAqICAgICAgIHdoZXJlIGEgc3R5bGUgaXMgbG9jYXRlZC5cbiAqIFsyXSA9IFdoZXRoZXIgb3Igbm90IHRoZSBkaXJlY3RpdmUgaGFzIGFueSBzdHlsaW5nIHZhbHVlcyB0aGF0IGFyZSBkaXJ0eS4gVGhpcyBpcyB1c2VkIGFzXG4gKiAgICAgICByZWZlcmVuY2Ugd2l0aGluIHRoZSBgcmVuZGVyU3R5bGluZ2AgZnVuY3Rpb24gdG8gZGVjaWRlIHdoZXRoZXIgdG8gc2tpcCBpdGVyYXRpbmdcbiAqICAgICAgIHRocm91Z2ggdGhlIGNvbnRleHQgd2hlbiByZW5kZXJpbmcgaXMgZXhlY3V0ZWQuXG4gKiBbM10gPSBUaGUgc3R5bGVTYW5pdGl6ZXIgaW5zdGFuY2UgdGhhdCBpcyBhc3NpZ25lZCB0byB0aGUgZGlyZWN0aXZlLiBBbHRob3VnaCBpdCdzIHVubGlrZWx5LFxuICogICAgICAgYSBkaXJlY3RpdmUgY291bGQgaW50cm9kdWNlIGl0cyBvd24gc3BlY2lhbCBzdHlsZSBzYW5pdGl6ZXIgYW5kIGZvciB0aGlzIHJlYWNoIGVhY2hcbiAqICAgICAgIGRpcmVjdGl2ZSB3aWxsIGdldCBpdHMgb3duIHNwYWNlIGZvciBpdCAoaWYgbnVsbCB0aGVuIHRoZSB2ZXJ5IGZpcnN0IHNhbml0aXplciBpcyB1c2VkKS5cbiAqXG4gKiBFYWNoIHRpbWUgYSBuZXcgZGlyZWN0aXZlIGlzIGFkZGVkIGl0IHdpbGwgaW5zZXJ0IHRoZXNlIGZvdXIgdmFsdWVzIGF0IHRoZSBlbmQgb2YgdGhlIGFycmF5LlxuICogV2hlbiB0aGlzIGFycmF5IGlzIGV4YW1pbmVkIHRoZW4gdGhlIHJlc3VsdGluZyBkaXJlY3RpdmVJbmRleCB3aWxsIGJlIHJlc29sdmVkIGJ5IGRpdmlkaW5nIHRoZVxuICogaW5kZXggdmFsdWUgYnkgdGhlIHNpemUgb2YgdGhlIGFycmF5IGVudHJpZXMgKHNvIGlmIERpckEgaXMgYXQgc3BvdCA4IHRoZW4gaXRzIGluZGV4IHdpbGwgYmUgMikuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgRGlyZWN0aXZlUmVnaXN0cnlWYWx1ZXMgZXh0ZW5kcyBBcnJheTxudWxsfHt9fGJvb2xlYW58bnVtYmVyfFN0eWxlU2FuaXRpemVGbj4ge1xuICBbRGlyZWN0aXZlUmVnaXN0cnlWYWx1ZXNJbmRleC5EaXJlY3RpdmVWYWx1ZU9mZnNldF06IG51bGw7XG4gIFtEaXJlY3RpdmVSZWdpc3RyeVZhbHVlc0luZGV4LlNpbmdsZVByb3BWYWx1ZXNJbmRleE9mZnNldF06IG51bWJlcjtcbiAgW0RpcmVjdGl2ZVJlZ2lzdHJ5VmFsdWVzSW5kZXguRGlydHlGbGFnT2Zmc2V0XTogYm9vbGVhbjtcbiAgW0RpcmVjdGl2ZVJlZ2lzdHJ5VmFsdWVzSW5kZXguU3R5bGVTYW5pdGl6ZXJPZmZzZXRdOiBTdHlsZVNhbml0aXplRm58bnVsbDtcbn1cblxuLyoqXG4gKiBBbiBlbnVtIHRoYXQgb3V0bGluZXMgdGhlIG9mZnNldC9wb3NpdGlvbiB2YWx1ZXMgZm9yIGVhY2ggZGlyZWN0aXZlIGVudHJ5IGFuZCBpdHMgZGF0YVxuICogdGhhdCBhcmUgaG91c2VkIGluc2lkZSBvZiBbRGlyZWN0aXZlUmVnaXN0cnlWYWx1ZXNdLlxuICovXG5leHBvcnQgY29uc3QgZW51bSBEaXJlY3RpdmVSZWdpc3RyeVZhbHVlc0luZGV4IHtcbiAgRGlyZWN0aXZlVmFsdWVPZmZzZXQgPSAwLFxuICBTaW5nbGVQcm9wVmFsdWVzSW5kZXhPZmZzZXQgPSAxLFxuICBEaXJ0eUZsYWdPZmZzZXQgPSAyLFxuICBTdHlsZVNhbml0aXplck9mZnNldCA9IDMsXG4gIFNpemUgPSA0XG59XG5cbi8qKlxuICogQW4gYXJyYXkgdGhhdCBjb250YWlucyB0aGUgaW5kZXggcG9pbnRlciB2YWx1ZXMgZm9yIGV2ZXJ5IHNpbmdsZSBzdHlsaW5nIHByb3BlcnR5XG4gKiB0aGF0IGV4aXN0cyBpbiB0aGUgY29udGV4dCBhbmQgZm9yIGV2ZXJ5IGRpcmVjdGl2ZS4gSXQgYWxzbyBjb250YWlucyB0aGUgdG90YWxcbiAqIHNpbmdsZSBzdHlsZXMgYW5kIHNpbmdsZSBjbGFzc2VzIHRoYXQgZXhpc3RzIGluIHRoZSBjb250ZXh0IGFzIHRoZSBmaXJzdCB0d28gdmFsdWVzLlxuICpcbiAqIExldCdzIHNheSB3ZSBoYXZlIHRoZSBmb2xsb3dpbmcgdGVtcGxhdGUgY29kZTpcbiAqXG4gKiA8ZGl2IFtzdHlsZS53aWR0aF09XCJteVdpZHRoXCJcbiAqICAgICAgW3N0eWxlLmhlaWdodF09XCJteUhlaWdodFwiXG4gKiAgICAgIFtjbGFzcy5mbGlwcGVkXT1cImZsaXBDbGFzc1wiXG4gKiAgICAgIGRpcmVjdGl2ZS13aXRoLW9wYWNpdHk+XG4gKiAgICAgIGRpcmVjdGl2ZS13aXRoLWZvby1iYXItY2xhc3Nlcz5cbiAqXG4gKiBXZSBoYXZlIHR3byBkaXJlY3RpdmUgYW5kIHRlbXBsYXRlLWJpbmRpbmcgc291cmNlcyxcbiAqIDIgKyAxIHN0eWxlcyBhbmQgMSArIDEgY2xhc3Nlcy4gV2hlbiB0aGUgYmluZGluZ3MgYXJlXG4gKiByZWdpc3RlcmVkIHRoZSBTaW5nbGVQcm9wT2Zmc2V0cyBhcnJheSB3aWxsIGxvb2sgbGlrZSBzbzpcbiAqXG4gKiBzXzAvY18wID0gdGVtcGxhdGUgZGlyZWN0aXZlIHZhbHVlXG4gKiBzXzEvY18xID0gZGlyZWN0aXZlIG9uZSAoZGlyZWN0aXZlLXdpdGgtb3BhY2l0eSlcbiAqIHNfMi9jXzIgPSBkaXJlY3RpdmUgdHdvIChkaXJlY3RpdmUtd2l0aC1mb28tYmFyLWNsYXNzZXMpXG4gKlxuICogWzMsIDIsIDIsIDEsIHNfMDAsIHMwMSwgY18wMSwgMSwgMCwgc18xMCwgMCwgMSwgY18yMFxuICovXG5leHBvcnQgaW50ZXJmYWNlIFNpbmdsZVByb3BPZmZzZXRWYWx1ZXMgZXh0ZW5kcyBBcnJheTxudW1iZXI+IHtcbiAgW1NpbmdsZVByb3BPZmZzZXRWYWx1ZXNJbmRleC5TdHlsZXNDb3VudFBvc2l0aW9uXTogbnVtYmVyO1xuICBbU2luZ2xlUHJvcE9mZnNldFZhbHVlc0luZGV4LkNsYXNzZXNDb3VudFBvc2l0aW9uXTogbnVtYmVyO1xufVxuXG4vKipcbiAqIEFuIGVudW0gdGhhdCBvdXRsaW5lcyB0aGUgb2Zmc2V0L3Bvc2l0aW9uIHZhbHVlcyBmb3IgZWFjaCBzaW5nbGUgcHJvcC9jbGFzcyBlbnRyeVxuICogdGhhdCBhcmUgaG91c2VkIGluc2lkZSBvZiBbU2luZ2xlUHJvcE9mZnNldFZhbHVlc10uXG4gKi9cbmV4cG9ydCBjb25zdCBlbnVtIFNpbmdsZVByb3BPZmZzZXRWYWx1ZXNJbmRleCB7XG4gIFN0eWxlc0NvdW50UG9zaXRpb24gPSAwLFxuICBDbGFzc2VzQ291bnRQb3NpdGlvbiA9IDEsXG4gIFZhbHVlU3RhcnRQb3NpdGlvbiA9IDJcbn1cblxuLyoqXG4gKiBVc2VkIGEgcmVmZXJlbmNlIGZvciBhbGwgbXVsdGkgc3R5bGluZyB2YWx1ZXMgKHZhbHVlcyB0aGF0IGFyZSBhc3NpZ25lZCB2aWEgdGhlXG4gKiBgW3N0eWxlXWAgYW5kIGBbY2xhc3NdYCBiaW5kaW5ncykuXG4gKlxuICogU2luZ2xlLXN0eWxpbmcgcHJvcGVydGllcyAodGhpbmdzIHNldCB2aWEgYFtzdHlsZS5wcm9wXWAgYW5kIGBbY2xhc3MubmFtZV1gIGJpbmRpbmdzKVxuICogYXJlIG5vdCBoYW5kbGVkIHVzaW5nIHRoZSBzYW1lIGFwcHJvYWNoIGFzIG11bHRpLXN0eWxpbmcgYmluZGluZ3MgKHN1Y2ggYXMgYFtzdHlsZV1gXG4gKiBgW2NsYXNzXWAgYmluZGluZ3MpLlxuICpcbiAqIE11bHRpLXN0eWxpbmcgYmluZGluZ3MgcmVseSBvbiBhIGRpZmZpbmcgYWxnb3JpdGhtIHRvIGZpZ3VyZSBvdXQgd2hhdCBwcm9wZXJ0aWVzIGhhdmUgYmVlbiBhZGRlZCxcbiAqIHJlbW92ZWQgYW5kIG1vZGlmaWVkLiBNdWx0aS1zdHlsaW5nIHByb3BlcnRpZXMgYXJlIGFsc28gZXZhbHVhdGVkIGFjcm9zcyBkaXJlY3RpdmVzLS13aGljaCBtZWFuc1xuICogdGhhdCBBbmd1bGFyIHN1cHBvcnRzIGhhdmluZyBtdWx0aXBsZSBkaXJlY3RpdmVzIGFsbCB3cml0ZSB0byB0aGUgc2FtZSBgW3N0eWxlXWAgYW5kIGBbY2xhc3NdYFxuICogYmluZGluZ3MgKHVzaW5nIGhvc3QgYmluZGluZ3MpIGV2ZW4gaWYgdGhlIGBbc3R5bGVdYCBhbmQvb3IgYFtjbGFzc11gIGJpbmRpbmdzIGFyZSBiZWluZyB3cml0dGVuXG4gKiB0byBvbiB0aGUgdGVtcGxhdGUgZWxlbWVudC5cbiAqXG4gKiBBbGwgbXVsdGktc3R5bGluZyB2YWx1ZXMgdGhhdCBhcmUgd3JpdHRlbiB0byBhbiBlbGVtZW50ICh3aGV0aGVyIGl0IGJlIGZyb20gdGhlIHRlbXBsYXRlIG9yIGFueVxuICogZGlyZWN0aXZlcyBhdHRhY2hlZCB0byB0aGUgZWxlbWVudCkgYXJlIGFsbCB3cml0dGVuIGludG8gdGhlIGBNYXBCYXNlZE9mZnNldFZhbHVlc2AgYXJyYXkuIChOb3RlXG4gKiB0aGF0IHRoZXJlIGFyZSB0d28gYXJyYXlzOiBvbmUgZm9yIHN0eWxlcyBhbmQgYW5vdGhlciBmb3IgY2xhc3Nlcy4pXG4gKlxuICogVGhpcyBhcnJheSBpcyBzaGFwZWQgaW4gdGhlIGZvbGxvd2luZyB3YXk6XG4gKlxuICogWzBdICA9IFRoZSB0b3RhbCBhbW91bnQgb2YgdW5pcXVlIG11bHRpLXN0eWxlIG9yIG11bHRpLWNsYXNzIGVudHJpZXMgdGhhdCBleGlzdCBjdXJyZW50bHkgaW4gdGhlXG4gKiAgICAgICAgY29udGV4dC5cbiAqIFsxK10gPSBDb250YWlucyBhbiBlbnRyeSBvZiBmb3VyIHZhbHVlcyAuLi4gRWFjaCBlbnRyeSBpcyBhIHZhbHVlIGFzc2lnbmVkIGJ5IGFcbiAqIGBbc3R5bGVdYC9gW2NsYXNzXWBcbiAqICAgICAgICBiaW5kaW5nICh3ZSBjYWxsIHRoaXMgYSAqKnNvdXJjZSoqKS5cbiAqXG4gKiAgICAgICAgQW4gZXhhbXBsZSBlbnRyeSBsb29rcyBsaWtlIHNvIChhdCBhIGdpdmVuIGBpYCBpbmRleCk6XG4gKiAgICAgICAgW2kgKyAwXSA9IFdoZXRoZXIgb3Igbm90IHRoZSB2YWx1ZSBpcyBkaXJ0eVxuICpcbiAqICAgICAgICBbaSArIDFdID0gVGhlIGluZGV4IG9mIHdoZXJlIHRoZSBtYXAtYmFzZWQgdmFsdWVzXG4gKiAgICAgICAgICAgICAgICAgIChmb3IgdGhpcyAqKnNvdXJjZSoqKSBzdGFydCB3aXRoaW4gdGhlIGNvbnRleHRcbiAqXG4gKiAgICAgICAgW2kgKyAyXSA9IFRoZSB1bnRvdWNoZWQsIGxhc3Qgc2V0IHZhbHVlIG9mIHRoZSBiaW5kaW5nXG4gKlxuICogICAgICAgIFtpICsgM10gPSBUaGUgdG90YWwgYW1vdW50IG9mIHVucWl1ZSBiaW5kaW5nIHZhbHVlcyB0aGF0IHdlcmVcbiAqICAgICAgICAgICAgICAgICAgZXh0cmFjdGVkIGFuZCBzZXQgaW50byB0aGUgY29udGV4dC4gKE5vdGUgdGhhdCB0aGlzIHZhbHVlIGRvZXNcbiAqICAgICAgICAgICAgICAgICAgbm90IHJlZmxlY3QgdGhlIHRvdGFsIGFtb3VudCBvZiB2YWx1ZXMgd2l0aGluIHRoZSBiaW5kaW5nXG4gKiAgICAgICAgICAgICAgICAgIHZhbHVlIChzaW5jZSBpdCdzIGEgbWFwKSwgYnV0IGluc3RlYWQgcmVmbGVjdHMgdGhlIHRvdGFsIHZhbHVlc1xuICogICAgICAgICAgICAgICAgICB0aGF0IHdlcmUgbm90IHVzZWQgYnkgYW5vdGhlciBkaXJlY3RpdmUpLlxuICpcbiAqIEVhY2ggdGltZSBhIGRpcmVjdGl2ZSAob3IgdGVtcGxhdGUpIHdyaXRlcyBhIHZhbHVlIHRvIGEgYFtjbGFzc11gL2Bbc3R5bGVdYCBiaW5kaW5nIHRoZW4gdGhlXG4gKiBzdHlsaW5nIGRpZmZpbmcgYWxnb3JpdGhtIGNvZGUgd2lsbCBkZWNpZGUgd2hldGhlciBvciBub3QgdG8gdXBkYXRlIHRoZSB2YWx1ZSBiYXNlZCBvbiB0aGVcbiAqIGZvbGxvd2luZyBydWxlczpcbiAqXG4gKiAxLiBJZiBhIG1vcmUgaW1wb3J0YW50IGRpcmVjdGl2ZSAoZWl0aGVyIHRoZSB0ZW1wbGF0ZSBvciBhIGRpcmVjdGl2ZSB0aGF0IHdhcyByZWdpc3RlcmVkXG4gKiAgICBiZWZvcmVoYW5kKSBoYXMgd3JpdHRlbiBhIHNwZWNpZmljIHN0eWxpbmcgdmFsdWUgaW50byB0aGUgY29udGV4dCB0aGVuIGFueSBmb2xsb3ctdXAgc3R5bGluZ1xuICogICAgdmFsdWVzIChzZXQgYnkgYW5vdGhlciBkaXJlY3RpdmUgdmlhIGl0cyBgW3N0eWxlXWAgYW5kL29yIGBbY2xhc3NdYCBob3N0IGJpbmRpbmcpIHdpbGwgbm90IGJlXG4gKiAgICBhYmxlIHRvIHNldCBpdC4gVGhpcyBpcyBiZWNhdXNlIHRoZSBmb3JtZXIgZGlyZWN0aXZlIGhhcyBwcmlvcnR5LlxuICogMi4gT25seSBpZiBhIGZvcm1lciBkaXJlY3RpdmUgaGFzIHNldCBhIHNwZWNpZmljIHN0eWxpbmcgdmFsdWUgdG8gbnVsbCAod2hldGhlciBieSBhY3R1YWxseVxuICogICAgc2V0dGluZyBpdCB0byBudWxsIG9yIG5vdCBpbmNsdWRpbmcgaXQgaW4gaXMgbWFwIHZhbHVlKSB0aGVuIGEgbGVzcyBpbXBvcmF0YW50IGRpcmVjdGl2ZSBjYW5cbiAqICAgIHNldCBpdHMgb3duIHZhbHVlLlxuICpcbiAqICMjIEhvdyB0aGUgbWFwLWJhc2VkIHN0eWxpbmcgYWxnb3JpdGhtIHVwZGF0ZXMgaXRzZWxmXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgTWFwQmFzZWRPZmZzZXRWYWx1ZXMgZXh0ZW5kcyBBcnJheTxhbnk+IHtcbiAgW01hcEJhc2VkT2Zmc2V0VmFsdWVzSW5kZXguRW50cmllc0NvdW50UG9zaXRpb25dOiBudW1iZXI7XG59XG5cbmV4cG9ydCBjb25zdCBlbnVtIE1hcEJhc2VkT2Zmc2V0VmFsdWVzSW5kZXgge1xuICBFbnRyaWVzQ291bnRQb3NpdGlvbiA9IDAsXG4gIFZhbHVlc1N0YXJ0UG9zaXRpb24gPSAxLFxuICBEaXJ0eUZsYWdPZmZzZXQgPSAwLFxuICBQb3NpdGlvblN0YXJ0T2Zmc2V0ID0gMSxcbiAgVmFsdWVPZmZzZXQgPSAyLFxuICBWYWx1ZUNvdW50T2Zmc2V0ID0gMyxcbiAgU2l6ZSA9IDRcbn1cblxuLyoqXG4gKiBVc2VkIHRvIHNldCB0aGUgY29udGV4dCB0byBiZSBkaXJ0eSBvciBub3QgYm90aCBvbiB0aGUgbWFzdGVyIGZsYWcgKHBvc2l0aW9uIDEpXG4gKiBvciBmb3IgZWFjaCBzaW5nbGUvbXVsdGkgcHJvcGVydHkgdGhhdCBleGlzdHMgaW4gdGhlIGNvbnRleHQuXG4gKi9cbmV4cG9ydCBjb25zdCBlbnVtIFN0eWxpbmdGbGFncyB7XG4gIC8vIEltcGxpZXMgbm8gY29uZmlndXJhdGlvbnNcbiAgTm9uZSA9IDBiMDAwMDAsXG4gIC8vIFdoZXRoZXIgb3Igbm90IHRoZSBlbnRyeSBvciBjb250ZXh0IGl0c2VsZiBpcyBkaXJ0eVxuICBEaXJ0eSA9IDBiMDAwMDEsXG4gIC8vIFdoZXRoZXIgb3Igbm90IHRoaXMgaXMgYSBjbGFzcy1iYXNlZCBhc3NpZ25tZW50XG4gIENsYXNzID0gMGIwMDAxMCxcbiAgLy8gV2hldGhlciBvciBub3QgYSBzYW5pdGl6ZXIgd2FzIGFwcGxpZWQgdG8gdGhpcyBwcm9wZXJ0eVxuICBTYW5pdGl6ZSA9IDBiMDAxMDAsXG4gIC8vIFdoZXRoZXIgb3Igbm90IGFueSBwbGF5ZXIgYnVpbGRlcnMgd2l0aGluIG5lZWQgdG8gcHJvZHVjZSBuZXcgcGxheWVyc1xuICBQbGF5ZXJCdWlsZGVyc0RpcnR5ID0gMGIwMTAwMCxcbiAgLy8gVGhlIG1heCBhbW91bnQgb2YgYml0cyB1c2VkIHRvIHJlcHJlc2VudCB0aGVzZSBjb25maWd1cmF0aW9uIHZhbHVlc1xuICBCaW5kaW5nQWxsb2NhdGlvbkxvY2tlZCA9IDBiMTAwMDAsXG4gIEJpdENvdW50U2l6ZSA9IDUsXG4gIC8vIFRoZXJlIGFyZSBvbmx5IGZpdmUgYml0cyBoZXJlXG4gIEJpdE1hc2sgPSAwYjExMTExXG59XG5cbi8qKiBVc2VkIGFzIG51bWVyaWMgcG9pbnRlciB2YWx1ZXMgdG8gZGV0ZXJtaW5lIHdoYXQgY2VsbHMgdG8gdXBkYXRlIGluIHRoZSBgU3R5bGluZ0NvbnRleHRgICovXG5leHBvcnQgY29uc3QgZW51bSBTdHlsaW5nSW5kZXgge1xuICAvLyBQb3NpdGlvbiBvZiB3aGVyZSB0aGUgaW5pdGlhbCBzdHlsZXMgYXJlIHN0b3JlZCBpbiB0aGUgc3R5bGluZyBjb250ZXh0XG4gIC8vIFRoaXMgaW5kZXggbXVzdCBhbGlnbiB3aXRoIEhPU1QsIHNlZSBpbnRlcmZhY2VzL3ZpZXcudHNcbiAgRWxlbWVudFBvc2l0aW9uID0gMCxcbiAgLy8gSW5kZXggb2YgbG9jYXRpb24gd2hlcmUgdGhlIHN0YXJ0IG9mIHNpbmdsZSBwcm9wZXJ0aWVzIGFyZSBzdG9yZWQuIChgdXBkYXRlU3R5bGVQcm9wYClcbiAgTWFzdGVyRmxhZ1Bvc2l0aW9uID0gMSxcbiAgLy8gUG9zaXRpb24gb2Ygd2hlcmUgdGhlIHJlZ2lzdGVyZWQgZGlyZWN0aXZlcyBleGlzdCBmb3IgdGhpcyBzdHlsaW5nIGNvbnRleHRcbiAgRGlyZWN0aXZlUmVnaXN0cnlQb3NpdGlvbiA9IDIsXG4gIC8vIFBvc2l0aW9uIG9mIHdoZXJlIHRoZSBpbml0aWFsIHN0eWxlcyBhcmUgc3RvcmVkIGluIHRoZSBzdHlsaW5nIGNvbnRleHRcbiAgSW5pdGlhbFN0eWxlVmFsdWVzUG9zaXRpb24gPSAzLFxuICBJbml0aWFsQ2xhc3NWYWx1ZXNQb3NpdGlvbiA9IDQsXG4gIC8vIEluZGV4IG9mIGxvY2F0aW9uIHdoZXJlIHRoZSBjbGFzcyBpbmRleCBvZmZzZXQgdmFsdWUgaXMgbG9jYXRlZFxuICBTaW5nbGVQcm9wT2Zmc2V0UG9zaXRpb25zID0gNSxcbiAgLy8gUG9zaXRpb24gb2Ygd2hlcmUgdGhlIGxhc3Qgc3RyaW5nLWJhc2VkIENTUyBjbGFzcyB2YWx1ZSB3YXMgc3RvcmVkIChvciBhIGNhY2hlZCB2ZXJzaW9uIG9mIHRoZVxuICAvLyBpbml0aWFsIHN0eWxlcyB3aGVuIGEgW2NsYXNzXSBkaXJlY3RpdmUgaXMgcHJlc2VudClcbiAgQ2FjaGVkTXVsdGlDbGFzc2VzID0gNixcbiAgLy8gUG9zaXRpb24gb2Ygd2hlcmUgdGhlIGxhc3Qgc3RyaW5nLWJhc2VkIENTUyBjbGFzcyB2YWx1ZSB3YXMgc3RvcmVkXG4gIENhY2hlZE11bHRpU3R5bGVzID0gNyxcbiAgLy8gTXVsdGkgYW5kIHNpbmdsZSBlbnRyaWVzIGFyZSBzdG9yZWQgaW4gYFN0eWxpbmdDb250ZXh0YCBhczogRmxhZzsgUHJvcGVydHlOYW1lOyAgUHJvcGVydHlWYWx1ZVxuICAvLyBQb3NpdGlvbiBvZiB3aGVyZSB0aGUgaW5pdGlhbCBzdHlsZXMgYXJlIHN0b3JlZCBpbiB0aGUgc3R5bGluZyBjb250ZXh0XG4gIFBsYXllckNvbnRleHQgPSA4LFxuICAvLyBMb2NhdGlvbiBvZiBzaW5nbGUgKHByb3ApIHZhbHVlIGVudHJpZXMgYXJlIHN0b3JlZCB3aXRoaW4gdGhlIGNvbnRleHRcbiAgU2luZ2xlU3R5bGVzU3RhcnRQb3NpdGlvbiA9IDksXG4gIEZsYWdzT2Zmc2V0ID0gMCxcbiAgUHJvcGVydHlPZmZzZXQgPSAxLFxuICBWYWx1ZU9mZnNldCA9IDIsXG4gIFBsYXllckJ1aWxkZXJJbmRleE9mZnNldCA9IDMsXG4gIC8vIFNpemUgb2YgZWFjaCBtdWx0aSBvciBzaW5nbGUgZW50cnkgKGZsYWcgKyBwcm9wICsgdmFsdWUgKyBwbGF5ZXJCdWlsZGVySW5kZXgpXG4gIFNpemUgPSA0LFxuICAvLyBFYWNoIGZsYWcgaGFzIGEgYmluYXJ5IGRpZ2l0IGxlbmd0aCBvZiB0aGlzIHZhbHVlXG4gIEJpdENvdW50U2l6ZSA9IDE0LCAgLy8gKDMyIC0gNCkgLyAyID0gfjE0XG4gIC8vIFRoZSBiaW5hcnkgZGlnaXQgdmFsdWUgYXMgYSBtYXNrXG4gIEJpdE1hc2sgPSAwYjExMTExMTExMTExMTExLCAgLy8gMTQgYml0c1xufVxuXG4vKipcbiAqIEFuIGVudW0gdGhhdCBvdXRsaW5lcyB0aGUgYml0IGZsYWcgZGF0YSBmb3IgZGlyZWN0aXZlIG93bmVyIGFuZCBwbGF5ZXIgaW5kZXhcbiAqIHZhbHVlcyB0aGF0IGV4aXN0IHdpdGhpbiBlbiBlbnRyeSB0aGF0IGxpdmVzIGluIHRoZSBTdHlsaW5nQ29udGV4dC5cbiAqXG4gKiBUaGUgdmFsdWVzIGhlcmUgc3BsaXQgYSBudW1iZXIgdmFsdWUgaW50byB0d28gc2V0cyBvZiBiaXRzOlxuICogIC0gVGhlIGZpcnN0IDE2IGJpdHMgYXJlIHVzZWQgdG8gc3RvcmUgdGhlIGRpcmVjdGl2ZUluZGV4IHRoYXQgb3ducyB0aGlzIHN0eWxlIHZhbHVlXG4gKiAgLSBUaGUgb3RoZXIgMTYgYml0cyBhcmUgdXNlZCB0byBzdG9yZSB0aGUgcGxheWVyQnVpbGRlckluZGV4IHRoYXQgaXMgYXR0YWNoZWQgdG8gdGhpcyBzdHlsZVxuICovXG5leHBvcnQgY29uc3QgZW51bSBEaXJlY3RpdmVPd25lckFuZFBsYXllckJ1aWxkZXJJbmRleCB7XG4gIEJpdENvdW50U2l6ZSA9IDE2LFxuICBCaXRNYXNrID0gMGIxMTExMTExMTExMTExMTExXG59XG4iXX0=