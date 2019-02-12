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
    [StylingIndex.ElementPosition]: RElement|null;*/
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
    [InitialStylingValuesIndex.InitialClassesStringPosition]: string|null;*/
}
/** @enum {number} */
const InitialStylingValuesIndex = {
    DefaultNullValuePosition: 0,
    InitialClassesStringPosition: 1,
    KeyValueStartPosition: 2,
    PropOffset: 0,
    ValueOffset: 1,
    Size: 2,
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
    // Index of location where the start of single properties are stored. (`updateStyleProp`)
    MasterFlagPosition: 0,
    // Position of where the registered directives exist for this styling context
    DirectiveRegistryPosition: 1,
    // Position of where the initial styles are stored in the styling context
    InitialStyleValuesPosition: 2,
    InitialClassValuesPosition: 3,
    // Index of location where the class index offset value is located
    SinglePropOffsetPositions: 4,
    // Position of where the initial styles are stored in the styling context
    // This index must align with HOST, see interfaces/view.ts
    ElementPosition: 5,
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3R5bGluZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaW50ZXJmYWNlcy9zdHlsaW5nLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBb1FBLG9DQXFEQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFTRCwwQ0FHQzs7Ozs7Ozs7O0lBMEdDLDJCQUE0QjtJQUM1QiwrQkFBZ0M7SUFDaEMsd0JBQXlCO0lBQ3pCLGFBQWM7SUFDZCxjQUFlO0lBQ2YsT0FBUTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUErQlYsNkNBS0M7Ozs7Ozs7Ozs7Ozs7SUFPQyx1QkFBd0I7SUFDeEIsOEJBQStCO0lBQy9CLGtCQUFtQjtJQUNuQix1QkFBd0I7SUFDeEIsT0FBUTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBMEJWLDRDQUdDOzs7Ozs7Ozs7SUFPQyxzQkFBdUI7SUFDdkIsdUJBQXdCO0lBQ3hCLHFCQUFzQjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQXlEeEIsMENBRUM7Ozs7Ozs7SUFHQyx1QkFBd0I7SUFDeEIsc0JBQXVCO0lBQ3ZCLGtCQUFtQjtJQUNuQixzQkFBdUI7SUFDdkIsY0FBZTtJQUNmLG1CQUFvQjtJQUNwQixPQUFROzs7OztJQVFSLDRCQUE0QjtJQUM1QixPQUFjO0lBQ2Qsc0RBQXNEO0lBQ3RELFFBQWU7SUFDZixrREFBa0Q7SUFDbEQsUUFBZTtJQUNmLDBEQUEwRDtJQUMxRCxXQUFrQjtJQUNsQix3RUFBd0U7SUFDeEUsc0JBQTZCO0lBQzdCLHNFQUFzRTtJQUN0RSwyQkFBaUM7SUFDakMsZUFBZ0I7SUFDaEIsZ0NBQWdDO0lBQ2hDLFdBQWlCOzs7OztJQUtqQix5RkFBeUY7SUFDekYscUJBQXNCO0lBQ3RCLDZFQUE2RTtJQUM3RSw0QkFBNkI7SUFDN0IseUVBQXlFO0lBQ3pFLDZCQUE4QjtJQUM5Qiw2QkFBOEI7SUFDOUIsa0VBQWtFO0lBQ2xFLDRCQUE2QjtJQUM3Qix5RUFBeUU7SUFDekUsMERBQTBEO0lBQzFELGtCQUFtQjtJQUNuQixpR0FBaUc7SUFDakcsc0RBQXNEO0lBQ3RELHFCQUFzQjtJQUN0QixxRUFBcUU7SUFDckUsb0JBQXFCO0lBQ3JCLGlHQUFpRztJQUNqRyx5RUFBeUU7SUFDekUsZ0JBQWlCO0lBQ2pCLHdFQUF3RTtJQUN4RSw0QkFBNkI7SUFDN0IsY0FBZTtJQUNmLGlCQUFrQjtJQUNsQixjQUFlO0lBQ2YsMkJBQTRCO0lBQzVCLGdGQUFnRjtJQUNoRixPQUFRO0lBQ1Isb0RBQW9EO0lBQ3BELGdCQUFpQjtJQUNqQixtQ0FBbUM7SUFDbkMsY0FBMEI7Ozs7O0lBWTFCLGdCQUFpQjtJQUNqQixjQUE0QiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCB7U3R5bGVTYW5pdGl6ZUZufSBmcm9tICcuLi8uLi9zYW5pdGl6YXRpb24vc3R5bGVfc2FuaXRpemVyJztcbmltcG9ydCB7UkVsZW1lbnR9IGZyb20gJy4uL2ludGVyZmFjZXMvcmVuZGVyZXInO1xuaW1wb3J0IHtQbGF5ZXJDb250ZXh0fSBmcm9tICcuL3BsYXllcic7XG5cbi8qKlxuICogVGhlIHN0eWxpbmcgY29udGV4dCBhY3RzIGFzIGEgc3R5bGluZyBtYW5pZmVzdCAoc2hhcGVkIGFzIGFuIGFycmF5KSBmb3IgZGV0ZXJtaW5pbmcgd2hpY2hcbiAqIHN0eWxpbmcgcHJvcGVydGllcyBoYXZlIGJlZW4gYXNzaWduZWQgdmlhIHRoZSBwcm92aWRlZCBgdXBkYXRlU3R5bGluZ01hcGAsIGB1cGRhdGVTdHlsZVByb3BgXG4gKiBhbmQgYHVwZGF0ZUNsYXNzUHJvcGAgZnVuY3Rpb25zLiBJdCBhbHNvIHN0b3JlcyB0aGUgc3RhdGljIHN0eWxlL2NsYXNzIHZhbHVlcyB0aGF0IHdlcmVcbiAqIGV4dHJhY3RlZCBmcm9tIHRoZSB0ZW1wbGF0ZSBieSB0aGUgY29tcGlsZXIuXG4gKlxuICogQSBjb250ZXh0IGlzIGNyZWF0ZWQgYnkgQW5ndWxhciB3aGVuOlxuICogMS4gQW4gZWxlbWVudCBjb250YWlucyBzdGF0aWMgc3R5bGluZyB2YWx1ZXMgKGxpa2Ugc3R5bGU9XCIuLi5cIiBvciBjbGFzcz1cIi4uLlwiKVxuICogMi4gQW4gZWxlbWVudCBjb250YWlucyBzaW5nbGUgcHJvcGVydHkgYmluZGluZyB2YWx1ZXMgKGxpa2UgW3N0eWxlLnByb3BdPVwieFwiIG9yXG4gKiBbY2xhc3MucHJvcF09XCJ5XCIpXG4gKiAzLiBBbiBlbGVtZW50IGNvbnRhaW5zIG11bHRpIHByb3BlcnR5IGJpbmRpbmcgdmFsdWVzIChsaWtlIFtzdHlsZV09XCJ4XCIgb3IgW2NsYXNzXT1cInlcIilcbiAqIDQuIEEgZGlyZWN0aXZlIGNvbnRhaW5zIGhvc3QgYmluZGluZ3MgZm9yIHN0YXRpYywgc2luZ2xlIG9yIG11bHRpIHN0eWxpbmcgcHJvcGVydGllcy9iaW5kaW5ncy5cbiAqIDUuIEFuIGFuaW1hdGlvbiBwbGF5ZXIgaXMgYWRkZWQgdG8gYW4gZWxlbWVudCB2aWEgYGFkZFBsYXllcmBcbiAqXG4gKiBOb3RlIHRoYXQgZXZlbiBpZiBhbiBlbGVtZW50IGNvbnRhaW5zIHN0YXRpYyBzdHlsaW5nIHRoZW4gdGhpcyBjb250ZXh0IHdpbGwgYmUgY3JlYXRlZCBhbmRcbiAqIGF0dGFjaGVkIHRvIGl0LiBUaGUgcmVhc29uIHdoeSB0aGlzIGhhcHBlbnMgKGluc3RlYWQgb2YgdHJlYXRpbmcgc3R5bGVzL2NsYXNzZXMgYXMgcmVndWxhclxuICogSFRNTCBhdHRyaWJ1dGVzKSBpcyBiZWNhdXNlIHRoZSBzdHlsZS9jbGFzcyBiaW5kaW5ncyBtdXN0IGJlIGFibGUgdG8gZGVmYXVsdCB0aGVtc2VsdmVzIGJhY2tcbiAqIHRvIHRoZWlyIHJlc3BlY3RpdmUgc3RhdGljIHZhbHVlcyB3aGVuIHRoZXkgYXJlIHNldCB0byBudWxsLlxuICpcbiAqIFNheSBmb3IgZXhhbXBsZSB3ZSBoYXZlIHRoaXM6XG4gKiBgYGBcbiAqIDwhLS0gd2hlbiBgbXlXaWR0aEV4cD1udWxsYCB0aGVuIGEgd2lkdGggb2YgYDEwMHB4YFxuICogICAgICB3aWxsIGJlIHVzZWQgYSBkZWZhdWx0IHZhbHVlIGZvciB3aWR0aCAtLT5cbiAqIDxkaXYgc3R5bGU9XCJ3aWR0aDoxMDBweFwiIFtzdHlsZS53aWR0aF09XCJteVdpZHRoRXhwXCI+PC9kaXY+XG4gKiBgYGBcbiAqXG4gKiBFdmVuIGluIHRoZSBzaXR1YXRpb24gd2hlcmUgdGhlcmUgYXJlIG5vIGJpbmRpbmdzLCB0aGUgc3RhdGljIHN0eWxpbmcgaXMgc3RpbGwgcGxhY2VkIGludG8gdGhlXG4gKiBjb250ZXh0IGJlY2F1c2UgdGhlcmUgbWF5IGJlIGFub3RoZXIgZGlyZWN0aXZlIG9uIHRoZSBzYW1lIGVsZW1lbnQgdGhhdCBoYXMgc3R5bGluZy5cbiAqXG4gKiBXaGVuIEFuZ3VsYXIgaW5pdGlhbGl6ZXMgc3R5bGluZyBkYXRhIGZvciBhbiBlbGVtZW50IHRoZW4gaXQgd2lsbCBmaXJzdCByZWdpc3RlciB0aGUgc3RhdGljXG4gKiBzdHlsaW5nIHZhbHVlcyBvbiB0aGUgZWxlbWVudCB1c2luZyBvbmUgb2YgdGhlc2UgdHdvIGluc3RydWN0aW9uczpcbiAqXG4gKiAxLiBlbGVtZW50U3RhcnQgb3IgZWxlbWVudCAod2l0aGluIHRoZSB0ZW1wbGF0ZSBmdW5jdGlvbiBvZiBhIGNvbXBvbmVudClcbiAqIDIuIGVsZW1lbnRIb3N0QXR0cnMgKGZvciBkaXJlY3RpdmUgaG9zdCBiaW5kaW5ncylcbiAqXG4gKiBJbiBlaXRoZXIgY2FzZSwgYSBzdHlsaW5nIGNvbnRleHQgd2lsbCBiZSBjcmVhdGVkIGFuZCBzdG9yZWQgd2l0aGluIGFuIGVsZW1lbnQncyBgTFZpZXdEYXRhYC5cbiAqIE9uY2UgdGhlIHN0eWxpbmcgY29udGV4dCBpcyBjcmVhdGVkIHRoZW4gc2luZ2xlIGFuZCBtdWx0aSBwcm9wZXJ0aWVzIGNhbiBiZSBzdG9yZWQgd2l0aGluIGl0LlxuICogRm9yIHRoaXMgdG8gaGFwcGVuLCB0aGUgZm9sbG93aW5nIGZ1bmN0aW9uIG5lZWRzIHRvIGJlIGNhbGxlZDpcbiAqXG4gKiBgZWxlbWVudFN0eWxpbmdgIChjYWxsZWQgd2l0aCBzdHlsZSBwcm9wZXJ0aWVzLCBjbGFzcyBwcm9wZXJ0aWVzIGFuZCBhIHNhbml0aXplciArIGEgZGlyZWN0aXZlXG4gKiBpbnN0YW5jZSkuXG4gKlxuICogV2hlbiB0aGlzIGluc3RydWN0aW9uIGlzIGNhbGxlZCBpdCB3aWxsIHBvcHVsYXRlIHRoZSBzdHlsaW5nIGNvbnRleHQgd2l0aCB0aGUgcHJvdmlkZWQgc3R5bGVcbiAqIGFuZCBjbGFzcyBuYW1lcyBpbnRvIHRoZSBjb250ZXh0LlxuICpcbiAqIFRoZSBjb250ZXh0IGl0c2VsZiBsb29rcyBsaWtlIHRoaXM6XG4gKlxuICogY29udGV4dCA9IFtcbiAqICAgLy8gMC04OiBoZWFkZXIgdmFsdWVzIChhYm91dCA4IGVudHJpZXMgb2YgY29uZmlndXJhdGlvbiBkYXRhKVxuICogICAvLyA5KzogdGhpcyBpcyB3aGVyZSBlYWNoIGVudHJ5IGlzIHN0b3JlZDpcbiAqIF1cbiAqXG4gKiBMZXQncyBzYXkgd2UgaGF2ZSB0aGUgZm9sbG93aW5nIHRlbXBsYXRlIGNvZGU6XG4gKlxuICogYGBgXG4gKiA8ZGl2IGNsYXNzPVwiZm9vIGJhclwiXG4gKiAgICAgIHN0eWxlPVwid2lkdGg6MjAwcHg7IGNvbG9yOnJlZFwiXG4gKiAgICAgIFtzdHlsZS53aWR0aF09XCJteVdpZHRoRXhwXCJcbiAqICAgICAgW3N0eWxlLmhlaWdodF09XCJteUhlaWdodEV4cFwiXG4gKiAgICAgIFtjbGFzcy5iYXpdPVwibXlCYXpFeHBcIj5cbiAqIGBgYFxuICpcbiAqIFRoZSBjb250ZXh0IGdlbmVyYXRlZCBmcm9tIHRoZXNlIHZhbHVlcyB3aWxsIGxvb2sgbGlrZSB0aGlzIChub3RlIHRoYXRcbiAqIGZvciBlYWNoIGJpbmRpbmcgbmFtZSAodGhlIGNsYXNzIGFuZCBzdHlsZSBiaW5kaW5ncykgdGhlIHZhbHVlcyB3aWxsXG4gKiBiZSBpbnNlcnRlZCB0d2ljZSBpbnRvIHRoZSBhcnJheSAob25jZSBmb3Igc2luZ2xlIHByb3BlcnR5IGVudHJpZXMgYW5kXG4gKiBhZ2FpbiBmb3IgbXVsdGkgcHJvcGVydHkgZW50cmllcykuXG4gKlxuICogY29udGV4dCA9IFtcbiAqICAgLy8gMC04OiBoZWFkZXIgdmFsdWVzIChhYm91dCA4IGVudHJpZXMgb2YgY29uZmlndXJhdGlvbiBkYXRhKVxuICogICAvLyA5KzogdGhpcyBpcyB3aGVyZSBlYWNoIGVudHJ5IGlzIHN0b3JlZDpcbiAqXG4gKiAgIC8vIFNJTkdMRSBQUk9QRVJUSUVTXG4gKiAgIGNvbmZpZ0ZvcldpZHRoLFxuICogICAnd2lkdGgnXG4gKiAgIG15V2lkdGhFeHAsIC8vIHRoZSBiaW5kaW5nIHZhbHVlIG5vdCB0aGUgYmluZGluZyBpdHNlbGZcbiAqICAgMCwgLy8gdGhlIGRpcmVjdGl2ZSBvd25lclxuICpcbiAqICAgY29uZmlnRm9ySGVpZ2h0LFxuICogICAnaGVpZ2h0J1xuICogICBteUhlaWdodEV4cCwgLy8gdGhlIGJpbmRpbmcgdmFsdWUgbm90IHRoZSBiaW5kaW5nIGl0c2VsZlxuICogICAwLCAvLyB0aGUgZGlyZWN0aXZlIG93bmVyXG4gKlxuICogICBjb25maWdGb3JCYXpDbGFzcyxcbiAqICAgJ2JhelxuICogICBteUJhekNsYXNzRXhwLCAvLyB0aGUgYmluZGluZyB2YWx1ZSBub3QgdGhlIGJpbmRpbmcgaXRzZWxmXG4gKiAgIDAsIC8vIHRoZSBkaXJlY3RpdmUgb3duZXJcbiAqXG4gKiAgIC8vIE1VTFRJIFBST1BFUlRJRVNcbiAqICAgY29uZmlnRm9yV2lkdGgsXG4gKiAgICd3aWR0aCdcbiAqICAgbXlXaWR0aEV4cCwgLy8gdGhlIGJpbmRpbmcgdmFsdWUgbm90IHRoZSBiaW5kaW5nIGl0c2VsZlxuICogICAwLCAvLyB0aGUgZGlyZWN0aXZlIG93bmVyXG4gKlxuICogICBjb25maWdGb3JIZWlnaHQsXG4gKiAgICdoZWlnaHQnXG4gKiAgIG15SGVpZ2h0RXhwLCAvLyB0aGUgYmluZGluZyB2YWx1ZSBub3QgdGhlIGJpbmRpbmcgaXRzZWxmXG4gKiAgIDAsIC8vIHRoZSBkaXJlY3RpdmUgb3duZXJcbiAqXG4gKiAgIGNvbmZpZ0ZvckJhekNsYXNzLFxuICogICAnYmF6XG4gKiAgIG15QmF6Q2xhc3NFeHAsIC8vIHRoZSBiaW5kaW5nIHZhbHVlIG5vdCB0aGUgYmluZGluZyBpdHNlbGZcbiAqICAgMCwgLy8gdGhlIGRpcmVjdGl2ZSBvd25lclxuICogXVxuICpcbiAqIFRoZSBjb25maWd1cmF0aW9uIHZhbHVlcyBhcmUgbGVmdCBvdXQgb2YgdGhlIGV4YW1wbGUgYWJvdmUgYmVjYXVzZVxuICogdGhlIG9yZGVyaW5nIG9mIHRoZW0gY291bGQgY2hhbmdlIGJldHdlZW4gY29kZSBwYXRjaGVzLiBQbGVhc2UgcmVhZCB0aGVcbiAqIGRvY3VtZW50YXRpb24gYmVsb3cgdG8gZ2V0IGEgYmV0dGVyIHVuZGVyc3RhbmQgb2Ygd2hhdCB0aGUgY29uZmlndXJhdGlvblxuICogdmFsdWVzIGFyZSBhbmQgaG93IHRoZXkgd29yay5cbiAqXG4gKiBFYWNoIHRpbWUgYSBiaW5kaW5nIHByb3BlcnR5IGlzIHVwZGF0ZWQgKHdoZXRoZXIgaXQgYmUgdGhyb3VnaCBhIHNpbmdsZVxuICogcHJvcGVydHkgaW5zdHJ1Y3Rpb24gbGlrZSBgZWxlbWVudFN0eWxlUHJvcGAsIGBlbGVtZW50Q2xhc3NQcm9wYCBvclxuICogYGVsZW1lbnRTdHlsaW5nTWFwYCkgdGhlbiB0aGUgdmFsdWVzIGluIHRoZSBjb250ZXh0IHdpbGwgYmUgdXBkYXRlZCBhc1xuICogd2VsbC5cbiAqXG4gKiBJZiBmb3IgZXhhbXBsZSBgW3N0eWxlLndpZHRoXWAgdXBkYXRlcyB0byBgNTU1cHhgIHRoZW4gaXRzIHZhbHVlIHdpbGwgYmUgcmVmbGVjdGVkXG4gKiBpbiB0aGUgY29udGV4dCBhcyBzbzpcbiAqXG4gKiBjb250ZXh0ID0gW1xuICogICAvLyAuLi5cbiAqICAgY29uZmlnRm9yV2lkdGgsIC8vIHRoaXMgd2lsbCBiZSBtYXJrZWQgRElSVFlcbiAqICAgJ3dpZHRoJ1xuICogICAnNTU1cHgnLFxuICogICAwLFxuICogICAvLy4uXG4gKiBdXG4gKlxuICogVGhlIGNvbnRleHQgYW5kIGRpcmVjdGl2ZSBkYXRhIHdpbGwgYWxzbyBiZSBtYXJrZWQgZGlydHkuXG4gKlxuICogRGVzcGl0ZSB0aGUgY29udGV4dCBiZWluZyB1cGRhdGVkLCBub3RoaW5nIGhhcyBiZWVuIHJlbmRlcmVkIG9uIHNjcmVlbiAobm90IHN0eWxlcyBvclxuICogY2xhc3NlcyBoYXZlIGJlZW4gc2V0IG9uIHRoZSBlbGVtZW50KS4gVG8ga2ljayBvZmYgcmVuZGVyaW5nIGZvciBhbiBlbGVtZW50IHRoZSBmb2xsb3dpbmdcbiAqIGZ1bmN0aW9uIG5lZWRzIHRvIGJlIHJ1biBgZWxlbWVudFN0eWxpbmdBcHBseWAuXG4gKlxuICogYGVsZW1lbnRTdHlsaW5nQXBwbHlgIHdpbGwgcnVuIHRocm91Z2ggdGhlIGNvbnRleHQgYW5kIGZpbmQgZWFjaCBkaXJ0eSB2YWx1ZSBhbmQgcmVuZGVyIHRoZW0gb250b1xuICogdGhlIGVsZW1lbnQuIE9uY2UgY29tcGxldGUsIGFsbCBzdHlsZXMvY2xhc3NlcyB3aWxsIGJlIHNldCB0byBjbGVhbi4gQmVjYXVzZSBvZiB0aGlzLCB0aGUgcmVuZGVyXG4gKiBmdW5jdGlvbiB3aWxsIG5vdyBrbm93IG5vdCB0byByZXJ1biBpdHNlbGYgYWdhaW4gaWYgY2FsbGVkIGFnYWluIHVubGVzcyBuZXcgc3R5bGUvY2xhc3MgdmFsdWVzXG4gKiBoYXZlIGNoYW5nZWQuXG4gKlxuICogIyMgRGlyZWN0aXZlc1xuICogRGlyZWN0aXZlIHN0eWxlL2NsYXNzIHZhbHVlcyAod2hpY2ggYXJlIHByb3ZpZGVkIHRocm91Z2ggaG9zdCBiaW5kaW5ncykgYXJlIGFsc28gc3VwcG9ydGVkIGFuZFxuICogaG91c2VkIHdpdGhpbiB0aGUgc2FtZSBzdHlsaW5nIGNvbnRleHQgYXMgYXJlIHRlbXBsYXRlLWxldmVsIHN0eWxlL2NsYXNzIHByb3BlcnRpZXMvYmluZGluZ3NcbiAqIFNvIGxvbmcgYXMgdGhleSBhcmUgYWxsIGFzc2lnbmVkIHRvIHRoZSBzYW1lIGVsZW1lbnQsIGJvdGggZGlyZWN0aXZlLWxldmVsIGFuZCB0ZW1wbGF0ZS1sZXZlbFxuICogc3R5bGluZyBiaW5kaW5ncyBzaGFyZSB0aGUgc2FtZSBjb250ZXh0LlxuICpcbiAqIEVhY2ggb2YgdGhlIGZvbGxvd2luZyBpbnN0cnVjdGlvbnMgc3VwcG9ydHMgYWNjZXB0aW5nIGEgZGlyZWN0aXZlIGluc3RhbmNlIGFzIGFuIGlucHV0IHBhcmFtZXRlcjpcbiAqXG4gKiAtIGBlbGVtZW50SG9zdEF0dHJzYFxuICogLSBgZWxlbWVudFN0eWxpbmdgXG4gKiAtIGBlbGVtZW50U3R5bGVQcm9wYFxuICogLSBgZWxlbWVudENsYXNzUHJvcGBcbiAqIC0gYGVsZW1lbnRTdHlsaW5nTWFwYFxuICogLSBgZWxlbWVudFN0eWxpbmdBcHBseWBcbiAqXG4gKiBFYWNoIHRpbWUgYSBkaXJlY3RpdmUgdmFsdWUgaXMgcGFzc2VkIGluLCBpdCB3aWxsIGJlIGNvbnZlcnRlZCBpbnRvIGFuIGluZGV4IGJ5IGV4YW1pbmluZyB0aGVcbiAqIGRpcmVjdGl2ZSByZWdpc3RyeSAod2hpY2ggbGl2ZXMgaW4gdGhlIGNvbnRleHQgY29uZmlndXJhdGlvbiBhcmVhKS4gVGhlIGluZGV4IGlzIHRoZW4gdXNlZFxuICogdG8gaGVscCBzaW5nbGUgc3R5bGUgcHJvcGVydGllcyBmaWd1cmUgb3V0IHdoZXJlIGEgdmFsdWUgaXMgbG9jYXRlZCBpbiB0aGUgY29udGV4dC5cbiAqXG4gKlxuICogIyMgU2luZ2xlLWxldmVsIHN0eWxpbmcgYmluZGluZ3MgKGBbc3R5bGUucHJvcF1gIGFuZCBgW2NsYXNzLm5hbWVdYClcbiAqXG4gKiBCb3RoIGBbc3R5bGUucHJvcF1gIGFuZCBgW2NsYXNzLm5hbWVdYCBiaW5kaW5ncyBhcmUgcnVuIHRocm91Z2ggdGhlIGB1cGRhdGVTdHlsZVByb3BgXG4gKiBhbmQgYHVwZGF0ZUNsYXNzUHJvcGAgZnVuY3Rpb25zIHJlc3BlY3RpdmVseS4gVGhleSB3b3JrIGJ5IGV4YW1pbmluZyB0aGUgcHJvdmlkZWRcbiAqIGBvZmZzZXRgIHZhbHVlIGFuZCBhcmUgYWJsZSB0byBsb2NhdGUgdGhlIGV4YWN0IHNwb3QgaW4gdGhlIGNvbnRleHQgd2hlcmUgdGhlXG4gKiBtYXRjaGluZyBzdHlsZSBpcyBsb2NhdGVkLlxuICpcbiAqIEJvdGggYFtzdHlsZS5wcm9wXWAgYW5kIGBbY2xhc3MubmFtZV1gIGJpbmRpbmdzIGFyZSBhYmxlIHRvIHByb2Nlc3MgdGhlc2UgdmFsdWVzXG4gKiBmcm9tIGRpcmVjdGl2ZSBob3N0IGJpbmRpbmdzLiBXaGVuIGV2YWx1YXRlZCAoZnJvbSB0aGUgaG9zdCBiaW5kaW5nIGZ1bmN0aW9uKSB0aGVcbiAqIGBkaXJlY3RpdmVSZWZgIHZhbHVlIGlzIHRoZW4gcGFzc2VkIGluLlxuICpcbiAqIElmIHR3byBkaXJlY3RpdmVzIG9yIGEgZGlyZWN0aXZlICsgYSB0ZW1wbGF0ZSBiaW5kaW5nIGJvdGggd3JpdGUgdG8gdGhlIHNhbWUgc3R5bGUvY2xhc3NcbiAqIGJpbmRpbmcgdGhlbiB0aGUgc3R5bGluZyBjb250ZXh0IGNvZGUgd2lsbCBkZWNpZGUgd2hpY2ggb25lIHdpbnMgYmFzZWQgb24gdGhlIGZvbGxvd2luZ1xuICogcnVsZTpcbiAqXG4gKiAxLiBJZiB0aGUgdGVtcGxhdGUgYmluZGluZyBoYXMgYSB2YWx1ZSB0aGVuIGl0IGFsd2F5cyB3aW5zXG4gKiAyLiBPdGhlcndpc2Ugd2hpY2hldmVyIGZpcnN0LXJlZ2lzdGVyZWQgZGlyZWN0aXZlIHRoYXQgaGFzIHRoYXQgdmFsdWUgZmlyc3Qgd2lsbCB3aW5cbiAqXG4gKiBUaGUgY29kZSBleGFtcGxlIGhlbHBzIG1ha2UgdGhpcyBjbGVhcjpcbiAqXG4gKiBgYGBcbiAqIDwhLS1cbiAqIDxkaXYgW3N0eWxlLndpZHRoXT1cIm15V2lkdGhcIlxuICogICAgICBbbXktd2lkdGgtZGlyZWN0aXZlXT1cIic2MDBweCdcIj5cbiAqIC0tPlxuICpcbiAqIEBEaXJlY3RpdmUoe1xuICogIHNlbGVjdG9yOiAnW215LXdpZHRoLWRpcmVjdGl2ZSddXG4gKiB9KVxuICogY2xhc3MgTXlXaWR0aERpcmVjdGl2ZSB7XG4gKiAgIEBJbnB1dCgnbXktd2lkdGgtZGlyZWN0aXZlJylcbiAqICAgQEhvc3RCaW5kaW5nKCdzdHlsZS53aWR0aCcpXG4gKiAgIHB1YmxpYyB3aWR0aCA9IG51bGw7XG4gKiB9XG4gKiBgYGBcbiAqXG4gKiBTaW5jZSB0aGVyZSBpcyBhIHN0eWxlIGJpbmRpbmcgZm9yIHdpZHRoIHByZXNlbnQgb24gdGhlIGVsZW1lbnQgKGBbc3R5bGUud2lkdGhdYCkgdGhlblxuICogaXQgd2lsbCBhbHdheXMgd2luIG92ZXIgdGhlIHdpZHRoIGJpbmRpbmcgdGhhdCBpcyBwcmVzZW50IGFzIGEgaG9zdCBiaW5kaW5nIHdpdGhpblxuICogdGhlIGBNeVdpZHRoRGlyZWN0aXZlYC4gSG93ZXZlciwgaWYgYFtzdHlsZS53aWR0aF1gIHJlbmRlcnMgYXMgYG51bGxgIChzbyBgbXlXaWR0aD1udWxsYClcbiAqIHRoZW4gdGhlIGBNeVdpZHRoRGlyZWN0aXZlYCB3aWxsIGJlIGFibGUgdG8gd3JpdGUgdG8gdGhlIGB3aWR0aGAgc3R5bGUgd2l0aGluIHRoZSBjb250ZXh0LlxuICogU2ltcGx5IHB1dCwgd2hpY2hldmVyIGRpcmVjdGl2ZSB3cml0ZXMgdG8gYSB2YWx1ZSBmaXJzdCBlbmRzIHVwIGhhdmluZyBvd25lcnNoaXAgb2YgaXQgYXNcbiAqIGxvbmcgYXMgdGhlIHRlbXBsYXRlIGRpZG4ndCBzZXQgYW55dGhpbmcuXG4gKlxuICogVGhlIHdheSBpbiB3aGljaCB0aGUgb3duZXJzaGlwIGlzIGZhY2lsaXRhdGVkIGlzIHRocm91Z2ggaW5kZXggdmFsdWUuIFRoZSBlYXJsaWVzdCBkaXJlY3RpdmVzXG4gKiBnZXQgdGhlIHNtYWxsZXN0IGluZGV4IHZhbHVlcyAod2l0aCAwIGJlaW5nIHJlc2VydmVkIGZvciB0aGUgdGVtcGxhdGUgZWxlbWVudCBiaW5kaW5ncykuIEVhY2hcbiAqIHRpbWUgYSB2YWx1ZSBpcyB3cml0dGVuIGZyb20gYSBkaXJlY3RpdmUgb3IgdGhlIHRlbXBsYXRlIGJpbmRpbmdzLCB0aGUgdmFsdWUgaXRzZWxmIGdldHNcbiAqIGFzc2lnbmVkIHRoZSBkaXJlY3RpdmUgaW5kZXggdmFsdWUgaW4gaXRzIGRhdGEuIElmIGFub3RoZXIgZGlyZWN0aXZlIHdyaXRlcyBhIHZhbHVlIGFnYWluIHRoZW5cbiAqIGl0cyBkaXJlY3RpdmUgaW5kZXggZ2V0cyBjb21wYXJlZCBhZ2FpbnN0IHRoZSBkaXJlY3RpdmUgaW5kZXggdGhhdCBleGlzdHMgb24gdGhlIGVsZW1lbnQuIE9ubHlcbiAqIHdoZW4gdGhlIG5ldyB2YWx1ZSdzIGRpcmVjdGl2ZSBpbmRleCBpcyBsZXNzIHRoYW4gdGhlIGV4aXN0aW5nIGRpcmVjdGl2ZSBpbmRleCB0aGVuIHRoZSBuZXdcbiAqIHZhbHVlIHdpbGwgYmUgd3JpdHRlbiB0byB0aGUgY29udGV4dC4gQnV0LCBpZiB0aGUgZXhpc3RpbmcgdmFsdWUgaXMgbnVsbCB0aGVuIHRoZSBuZXcgdmFsdWUgaXNcbiAqIHdyaXR0ZW4gYnkgdGhlIGxlc3MgaW1wb3J0YW50IGRpcmVjdGl2ZS5cbiAqXG4gKiBFYWNoIGRpcmVjdGl2ZSBhbHNvIGhhcyBpdHMgb3duIHNhbml0aXplciBhbmQgZGlydHkgZmxhZ3MuIFRoZXNlIHZhbHVlcyBhcmUgY29uc3VtZWQgd2l0aGluIHRoZVxuICogcmVuZGVyaW5nIGZ1bmN0aW9uLlxuICpcbiAqXG4gKiAjIyBNdWx0aS1sZXZlbCBzdHlsaW5nIGJpbmRpbmdzIChgW3N0eWxlXWAgYW5kIGBbY2xhc3NdYClcbiAqXG4gKiBNdWx0aS1sZXZlbCBzdHlsaW5nIGJpbmRpbmdzIGFyZSB0cmVhdGVkIGFzIGxlc3MgaW1wb3J0YW50IChsZXNzIHNwZWNpZmljKSBhcyBzaW5nbGUtbGV2ZWxcbiAqIGJpbmRpbmdzICh0aGluZ3MgbGlrZSBgW3N0eWxlLnByb3BdYCBhbmQgYFtjbGFzcy5uYW1lXWApLlxuICpcbiAqIE11bHRpLWxldmVsIGJpbmRpbmdzIGFyZSBzdGlsbCBhcHBsaWVkIHRvIHRoZSBjb250ZXh0IGluIGEgc2ltaWxhciB3YXkgYXMgYXJlIHNpbmdsZSBsZXZlbFxuICogYmluZGluZ3MsIGJ1dCB0aGlzIHByb2Nlc3Mgd29ya3MgYnkgZGlmZmluZyB0aGUgbmV3IG11bHRpLWxldmVsIHZhbHVlcyAod2hpY2ggYXJlIGtleS92YWx1ZVxuICogbWFwcykgYWdhaW5zdCB0aGUgZXhpc3Rpbmcgc2V0IG9mIHN0eWxlcyB0aGF0IGxpdmUgaW4gdGhlIGNvbnRleHQuIEVhY2ggdGltZSBhIG5ldyBtYXAgdmFsdWVcbiAqIGlzIGRldGVjdGVkICh2aWEgaWRlbnRpdHkgY2hlY2spIHRoZW4gaXQgd2lsbCBsb29wIHRocm91Z2ggdGhlIHZhbHVlcyBhbmQgZmlndXJlIG91dCB3aGF0XG4gKiBoYXMgY2hhbmdlZCBhbmQgcmVvcmRlciB0aGUgY29udGV4dCBhcnJheSB0byBtYXRjaCB0aGUgb3JkZXJpbmcgb2YgdGhlIGtleXMuIFRoaXMgcmVvcmRlcmluZ1xuICogb2YgdGhlIGNvbnRleHQgbWFrZXMgc3VyZSB0aGF0IGZvbGxvdy11cCB0cmF2ZXJzYWxzIG9mIHRoZSBjb250ZXh0IHdoZW4gdXBkYXRlZCBhZ2FpbnN0IHRoZVxuICoga2V5L3ZhbHVlIG1hcCBhcmUgYXMgY2xvc2UgYXMgcG9zc2libGUgdG8gbyhuKSAod2hlcmUgXCJuXCIgaXMgdGhlIHNpemUgb2YgdGhlIGtleS92YWx1ZSBtYXApLlxuICpcbiAqIElmIGEgYGRpcmVjdGl2ZVJlZmAgdmFsdWUgaXMgcGFzc2VkIGluIHRoZW4gdGhlIHN0eWxpbmcgYWxnb3JpdGhtIGNvZGUgd2lsbCB0YWtlIHRoZSBkaXJlY3RpdmUnc1xuICogcHJpb3JpdGl6YXRpb24gaW5kZXggaW50byBhY2NvdW50IGFuZCB1cGRhdGUgdGhlIHZhbHVlcyB3aXRoIHJlc3BlY3QgdG8gbW9yZSBpbXBvcnRhbnRcbiAqIGRpcmVjdGl2ZXMuIFRoaXMgbWVhbnMgdGhhdCBpZiBhIHZhbHVlIHN1Y2ggYXMgYHdpZHRoYCBpcyB1cGRhdGVkIGluIHR3byBkaWZmZXJlbnQgYFtzdHlsZV1gXG4gKiBiaW5kaW5ncyAoc2F5IG9uZSBvbiB0aGUgdGVtcGxhdGUgYW5kIGFub3RoZXIgd2l0aGluIGEgZGlyZWN0aXZlIHRoYXQgc2l0cyBvbiB0aGUgc2FtZSBlbGVtZW50KVxuICogdGhlbiB0aGUgYWxnb3JpdGhtIHdpbGwgZGVjaWRlIGhvdyB0byB1cGRhdGUgdGhlIHZhbHVlIGJhc2VkIG9uIHRoZSBmb2xsb3dpbmcgaGV1cmlzdGljOlxuICpcbiAqIDEuIElmIHRoZSB0ZW1wbGF0ZSBiaW5kaW5nIGhhcyBhIHZhbHVlIHRoZW4gaXQgYWx3YXlzIHdpbnNcbiAqIDIuIElmIG5vdCB0aGVuIHdoaWNoZXZlciBmaXJzdC1yZWdpc3RlcmVkIGRpcmVjdGl2ZSB0aGF0IGhhcyB0aGF0IHZhbHVlIGZpcnN0IHdpbGwgd2luXG4gKlxuICogSXQgd2lsbCBhbHNvIHVwZGF0ZSB0aGUgdmFsdWUgaWYgaXQgd2FzIHNldCB0byBgbnVsbGAgYnkgYSBwcmV2aW91cyBkaXJlY3RpdmUgKG9yIHRoZSB0ZW1wbGF0ZSkuXG4gKlxuICogRWFjaCB0aW1lIGEgdmFsdWUgaXMgdXBkYXRlZCAob3IgcmVtb3ZlZCkgdGhlbiB0aGUgY29udGV4dCB3aWxsIGNoYW5nZSBzaGFwZSB0byBiZXR0ZXIgbWF0Y2hcbiAqIHRoZSBvcmRlcmluZyBvZiB0aGUgc3R5bGluZyBkYXRhIGFzIHdlbGwgYXMgdGhlIG9yZGVyaW5nIG9mIGVhY2ggZGlyZWN0aXZlIHRoYXQgY29udGFpbnMgc3R5bGluZ1xuICogZGF0YS4gKFNlZSBgcGF0Y2hTdHlsaW5nTWFwSW50b0NvbnRleHRgIGluc2lkZSBvZiBjbGFzc19hbmRfc3R5bGVfYmluZGluZ3MudHMgdG8gYmV0dGVyXG4gKiB1bmRlcnN0YW5kIGhvdyB0aGlzIHdvcmtzLilcbiAqXG4gKiAjIyBSZW5kZXJpbmdcbiAqIFRoZSByZW5kZXJpbmcgbWVjaGFuaXNtICh3aGVuIHRoZSBzdHlsaW5nIGRhdGEgaXMgYXBwbGllZCBvbiBzY3JlZW4pIG9jY3VycyB2aWEgdGhlXG4gKiBgZWxlbWVudFN0eWxpbmdBcHBseWAgZnVuY3Rpb24gYW5kIGlzIGRlc2lnbmVkIHRvIHJ1biBhZnRlciAqKmFsbCoqIHN0eWxpbmcgZnVuY3Rpb25zIGhhdmUgYmVlblxuICogZXZhbHVhdGVkLiBUaGUgcmVuZGVyaW5nIGFsZ29yaXRobSB3aWxsIGxvb3Agb3ZlciB0aGUgY29udGV4dCBhbmQgb25seSBhcHBseSB0aGUgc3R5bGVzIHRoYXQgYXJlXG4gKiBmbGFnZ2VkIGFzIGRpcnR5IChlaXRoZXIgYmVjYXVzZSB0aGV5IGFyZSBuZXcsIHVwZGF0ZWQgb3IgaGF2ZSBiZWVuIHJlbW92ZWQgdmlhIG11bHRpIG9yXG4gKiBzaW5nbGUgYmluZGluZ3MpLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIFN0eWxpbmdDb250ZXh0IGV4dGVuZHNcbiAgICBBcnJheTx7W2tleTogc3RyaW5nXTogYW55fXxudW1iZXJ8c3RyaW5nfGJvb2xlYW58UkVsZW1lbnR8U3R5bGVTYW5pdGl6ZUZufFBsYXllckNvbnRleHR8bnVsbD4ge1xuICAvKipcbiAgICogQSBudW1lcmljIHZhbHVlIHJlcHJlc2VudGluZyB0aGUgY29uZmlndXJhdGlvbiBzdGF0dXMgKHdoZXRoZXIgdGhlIGNvbnRleHQgaXMgZGlydHkgb3Igbm90KVxuICAgKiBtaXhlZCB0b2dldGhlciAodXNpbmcgYml0IHNoaWZ0aW5nKSB3aXRoIGEgaW5kZXggdmFsdWUgd2hpY2ggdGVsbHMgdGhlIHN0YXJ0aW5nIGluZGV4IHZhbHVlXG4gICAqIG9mIHdoZXJlIHRoZSBtdWx0aSBzdHlsZSBlbnRyaWVzIGJlZ2luLlxuICAgKi9cbiAgW1N0eWxpbmdJbmRleC5NYXN0ZXJGbGFnUG9zaXRpb25dOiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIExvY2F0aW9uIG9mIHRoZSBjb2xsZWN0aW9uIG9mIGRpcmVjdGl2ZXMgZm9yIHRoaXMgY29udGV4dFxuICAgKi9cbiAgW1N0eWxpbmdJbmRleC5EaXJlY3RpdmVSZWdpc3RyeVBvc2l0aW9uXTogRGlyZWN0aXZlUmVnaXN0cnlWYWx1ZXM7XG5cbiAgLyoqXG4gICAqIExvY2F0aW9uIG9mIGFsbCBzdGF0aWMgc3R5bGVzIHZhbHVlc1xuICAgKi9cbiAgW1N0eWxpbmdJbmRleC5Jbml0aWFsU3R5bGVWYWx1ZXNQb3NpdGlvbl06IEluaXRpYWxTdHlsaW5nVmFsdWVzO1xuXG4gIC8qKlxuICAgKiBMb2NhdGlvbiBvZiBhbGwgc3RhdGljIGNsYXNzIHZhbHVlc1xuICAgKi9cbiAgW1N0eWxpbmdJbmRleC5Jbml0aWFsQ2xhc3NWYWx1ZXNQb3NpdGlvbl06IEluaXRpYWxTdHlsaW5nVmFsdWVzO1xuXG4gIC8qKlxuICAgKiBBIG51bWVyaWMgdmFsdWUgcmVwcmVzZW50aW5nIHRoZSBjbGFzcyBpbmRleCBvZmZzZXQgdmFsdWUuIFdoZW5ldmVyIGEgc2luZ2xlIGNsYXNzIGlzXG4gICAqIGFwcGxpZWQgKHVzaW5nIGBlbGVtZW50Q2xhc3NQcm9wYCkgaXQgc2hvdWxkIGhhdmUgYW4gc3R5bGluZyBpbmRleCB2YWx1ZSB0aGF0IGRvZXNuJ3RcbiAgICogbmVlZCB0byB0YWtlIGludG8gYWNjb3VudCBhbnkgc3R5bGUgdmFsdWVzIHRoYXQgZXhpc3QgaW4gdGhlIGNvbnRleHQuXG4gICAqL1xuICBbU3R5bGluZ0luZGV4LlNpbmdsZVByb3BPZmZzZXRQb3NpdGlvbnNdOiBTaW5nbGVQcm9wT2Zmc2V0VmFsdWVzO1xuXG4gIC8qKlxuICAgKiBMb2NhdGlvbiBvZiBlbGVtZW50IHRoYXQgaXMgdXNlZCBhcyBhIHRhcmdldCBmb3IgdGhpcyBjb250ZXh0LlxuICAgKi9cbiAgW1N0eWxpbmdJbmRleC5FbGVtZW50UG9zaXRpb25dOiBSRWxlbWVudHxudWxsO1xuXG4gIC8qKlxuICAgKiBUaGUgbGFzdCBjbGFzcyB2YWx1ZSB0aGF0IHdhcyBpbnRlcnByZXRlZCBieSBlbGVtZW50U3R5bGluZ01hcC4gVGhpcyBpcyBjYWNoZWRcbiAgICogU28gdGhhdCB0aGUgYWxnb3JpdGhtIGNhbiBleGl0IGVhcmx5IGluY2FzZSB0aGUgdmFsdWUgaGFzIG5vdCBjaGFuZ2VkLlxuICAgKi9cbiAgW1N0eWxpbmdJbmRleC5DYWNoZWRNdWx0aUNsYXNzZXNdOiBhbnl8TWFwQmFzZWRPZmZzZXRWYWx1ZXM7XG5cbiAgLyoqXG4gICAqIFRoZSBsYXN0IHN0eWxlIHZhbHVlIHRoYXQgd2FzIGludGVycHJldGVkIGJ5IGVsZW1lbnRTdHlsaW5nTWFwLiBUaGlzIGlzIGNhY2hlZFxuICAgKiBTbyB0aGF0IHRoZSBhbGdvcml0aG0gY2FuIGV4aXQgZWFybHkgaW5jYXNlIHRoZSB2YWx1ZSBoYXMgbm90IGNoYW5nZWQuXG4gICAqL1xuICBbU3R5bGluZ0luZGV4LkNhY2hlZE11bHRpU3R5bGVzXTogYW55fE1hcEJhc2VkT2Zmc2V0VmFsdWVzO1xuXG4gIC8qKlxuICAgKiBMb2NhdGlvbiBvZiBhbmltYXRpb24gY29udGV4dCAod2hpY2ggY29udGFpbnMgdGhlIGFjdGl2ZSBwbGF5ZXJzKSBmb3IgdGhpcyBlbGVtZW50IHN0eWxpbmdcbiAgICogY29udGV4dC5cbiAgICovXG4gIFtTdHlsaW5nSW5kZXguUGxheWVyQ29udGV4dF06IFBsYXllckNvbnRleHR8bnVsbDtcbn1cblxuLyoqXG4gKiBVc2VkIGFzIGEgc3R5bGluZyBhcnJheSB0byBob3VzZSBzdGF0aWMgY2xhc3MgYW5kIHN0eWxlIHZhbHVlcyB0aGF0IHdlcmUgZXh0cmFjdGVkXG4gKiBieSB0aGUgY29tcGlsZXIgYW5kIHBsYWNlZCBpbiB0aGUgYW5pbWF0aW9uIGNvbnRleHQgdmlhIGBlbGVtZW50U3RhcnRgIGFuZFxuICogYGVsZW1lbnRIb3N0QXR0cnNgLlxuICpcbiAqIFNlZSBbSW5pdGlhbFN0eWxpbmdWYWx1ZXNJbmRleF0gZm9yIGEgYnJlYWtkb3duIG9mIGhvdyBhbGwgdGhpcyB3b3Jrcy5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBJbml0aWFsU3R5bGluZ1ZhbHVlcyBleHRlbmRzIEFycmF5PHN0cmluZ3xib29sZWFufG51bGw+IHtcbiAgW0luaXRpYWxTdHlsaW5nVmFsdWVzSW5kZXguRGVmYXVsdE51bGxWYWx1ZVBvc2l0aW9uXTogbnVsbDtcbiAgW0luaXRpYWxTdHlsaW5nVmFsdWVzSW5kZXguSW5pdGlhbENsYXNzZXNTdHJpbmdQb3NpdGlvbl06IHN0cmluZ3xudWxsO1xufVxuXG4vKipcbiAqIFVzZWQgYXMgYW4gb2Zmc2V0L3Bvc2l0aW9uIGluZGV4IHRvIGZpZ3VyZSBvdXQgd2hlcmUgaW5pdGlhbCBzdHlsaW5nXG4gKiB2YWx1ZXMgYXJlIGxvY2F0ZWQuXG4gKlxuICogVXNlZCBhcyBhIHJlZmVyZW5jZSBwb2ludCB0byBwcm92aWRlIG1hcmtlcnMgdG8gYWxsIHN0YXRpYyBzdHlsaW5nXG4gKiB2YWx1ZXMgKHRoZSBpbml0aWFsIHN0eWxlIGFuZCBjbGFzcyB2YWx1ZXMgb24gYW4gZWxlbWVudCkgd2l0aGluIGFuXG4gKiBhcnJheSB3aXRoaW4gdGhlIGBTdHlsaW5nQ29udGV4dGAuIFRoaXMgYXJyYXkgY29udGFpbnMga2V5L3ZhbHVlIHBhaXJzXG4gKiB3aGVyZSB0aGUga2V5IGlzIHRoZSBzdHlsZSBwcm9wZXJ0eSBuYW1lIG9yIGNsYXNzTmFtZSBhbmQgdGhlIHZhbHVlIGlzXG4gKiB0aGUgc3R5bGUgdmFsdWUgb3Igd2hldGhlciBvciBub3QgYSBjbGFzcyBpcyBwcmVzZW50IG9uIHRoZSBlbG1lbnQuXG4gKlxuICogVGhlIGZpcnN0IHZhbHVlIGlzIGFsd2F5cyBudWxsIHNvIHRoYXQgYSBpbml0aWFsIGluZGV4IHZhbHVlIG9mXG4gKiBgMGAgd2lsbCBhbHdheXMgcG9pbnQgdG8gYSBudWxsIHZhbHVlLlxuICpcbiAqIFRoZSBzZWNvbmQgdmFsdWUgaXMgYWxzbyBhbHdheXMgbnVsbCB1bmxlc3MgYSBzdHJpbmctYmFzZWQgcmVwcmVzZW50YXRpb25cbiAqIG9mIHRoZSBzdHlsaW5nIGRhdGEgd2FzIGNvbnN0cnVjdGVkIChpdCBnZXRzIGNhY2hlZCBpbiB0aGlzIHNsb3QpLlxuICpcbiAqIElmIGEgPGRpdj4gZWxlbWVudHMgY29udGFpbnMgYSBsaXN0IG9mIHN0YXRpYyBzdHlsaW5nIHZhbHVlcyBsaWtlIHNvOlxuICpcbiAqIDxkaXYgY2xhc3M9XCJmb28gYmFyIGJhelwiIHN0eWxlPVwid2lkdGg6MTAwcHg7IGhlaWdodDoyMDBweDtcIj5cbiAqXG4gKiBUaGVuIHRoZSBpbml0aWFsIHN0eWxlcyBmb3IgdGhhdCB3aWxsIGxvb2sgbGlrZSBzbzpcbiAqXG4gKiBTdHlsZXM6XG4gKiBgYGBcbiAqIFN0eWxpbmdDb250ZXh0W0luaXRpYWxTdHlsZXNJbmRleF0gPSBbXG4gKiAgIG51bGwsIG51bGwsICd3aWR0aCcsICcxMDBweCcsIGhlaWdodCwgJzIwMHB4J1xuICogXVxuICogYGBgXG4gKlxuICogQ2xhc3NlczpcbiAqIGBgYFxuICogU3R5bGluZ0NvbnRleHRbSW5pdGlhbENsYXNzZXNJbmRleF0gPSBbXG4gKiAgIG51bGwsIG51bGwsICdmb28nLCB0cnVlLCAnYmFyJywgdHJ1ZSwgJ2JheicsIHRydWVcbiAqIF1cbiAqIGBgYFxuICpcbiAqIEluaXRpYWwgc3R5bGUgYW5kIGNsYXNzIGVudHJpZXMgaGF2ZSB0aGVpciBvd24gYXJyYXlzLiBUaGlzIGlzIGJlY2F1c2VcbiAqIGl0J3MgZWFzaWVyIHRvIGFkZCB0byB0aGUgZW5kIG9mIG9uZSBhcnJheSBhbmQgbm90IHRoZW4gaGF2ZSB0byB1cGRhdGVcbiAqIGV2ZXJ5IGNvbnRleHQgZW50cmllcycgcG9pbnRlciBpbmRleCB0byB0aGUgbmV3bHkgb2Zmc2V0ZWQgdmFsdWVzLlxuICpcbiAqIFdoZW4gcHJvcGVydHkgYmluZGluZHMgYXJlIGFkZGVkIHRvIGEgY29udGV4dCB0aGVuIGluaXRpYWwgc3R5bGUvY2xhc3NcbiAqIHZhbHVlcyB3aWxsIGFsc28gYmUgaW5zZXJ0ZWQgaW50byB0aGUgYXJyYXkuIFRoaXMgaXMgdG8gY3JlYXRlIGEgc3BhY2VcbiAqIGluIHRoZSBzaXR1YXRpb24gd2hlbiBhIGZvbGxvdy11cCBkaXJlY3RpdmUgaW5zZXJ0cyBzdGF0aWMgc3R5bGluZyBpbnRvXG4gKiB0aGUgYXJyYXkuIEJ5IGRlZmF1bHQsIHN0eWxlIHZhbHVlcyBhcmUgYG51bGxgIGFuZCBjbGFzcyB2YWx1ZXMgYXJlXG4gKiBgZmFsc2VgIHdoZW4gaW5zZXJ0ZWQgYnkgcHJvcGVydHkgYmluZGluZ3MuXG4gKlxuICogRm9yIGV4YW1wbGU6XG4gKiBgYGBcbiAqIDxkaXYgY2xhc3M9XCJmb28gYmFyIGJhelwiXG4gKiAgICAgIFtjbGFzcy5jYXJdPVwibXlDYXJFeHBcIlxuICogICAgICBzdHlsZT1cIndpZHRoOjEwMHB4OyBoZWlnaHQ6MjAwcHg7XCJcbiAqICAgICAgW3N0eWxlLm9wYWNpdHldPVwibXlPcGFjaXR5RXhwXCI+XG4gKiBgYGBcbiAqXG4gKiBXaWxsIGNvbnN0cnVjdCBpbml0aWFsIHN0eWxpbmcgdmFsdWVzIHRoYXQgbG9vayBsaWtlOlxuICpcbiAqIFN0eWxlczpcbiAqIGBgYFxuICogU3R5bGluZ0NvbnRleHRbSW5pdGlhbFN0eWxlc0luZGV4XSA9IFtcbiAqICAgbnVsbCwgbnVsbCwgJ3dpZHRoJywgJzEwMHB4JywgaGVpZ2h0LCAnMjAwcHgnLCAnb3BhY2l0eScsIG51bGxcbiAqIF1cbiAqIGBgYFxuICpcbiAqIENsYXNzZXM6XG4gKiBgYGBcbiAqIFN0eWxpbmdDb250ZXh0W0luaXRpYWxDbGFzc2VzSW5kZXhdID0gW1xuICogICBudWxsLCBudWxsLCAnZm9vJywgdHJ1ZSwgJ2JhcicsIHRydWUsICdiYXonLCB0cnVlLCAnY2FyJywgZmFsc2VcbiAqIF1cbiAqIGBgYFxuICpcbiAqIE5vdyBpZiBhIGRpcmVjdGl2ZSBjb21lcyBhbG9uZyBhbmQgaW50cm9kdWNlcyBgY2FyYCBhcyBhIHN0YXRpY1xuICogY2xhc3MgdmFsdWUgb3IgYG9wYWNpdHlgIHRoZW4gdGhvc2UgdmFsdWVzIHdpbGwgYmUgZmlsbGVkIGludG9cbiAqIHRoZSBpbml0aWFsIHN0eWxlcyBhcnJheS5cbiAqXG4gKiBGb3IgZXhhbXBsZTpcbiAqXG4gKiBgYGBcbiAqIEBEaXJlY3RpdmUoe1xuICogICBzZWxlY3RvcjogJ29wYWNpdHktY2FyLWRpcmVjdGl2ZScsXG4gKiAgIGhvc3Q6IHtcbiAqICAgICAnc3R5bGUnOiAnb3BhY2l0eTowLjUnLFxuICogICAgICdjbGFzcyc6ICdjYXInXG4gKiAgIH1cbiAqIH0pXG4gKiBjbGFzcyBPcGFjaXR5Q2FyRGlyZWN0aXZlIHt9XG4gKiBgYGBcbiAqXG4gKiBUaGlzIHdpbGwgcmVuZGVyIGl0c2VsZiBhczpcbiAqXG4gKiBTdHlsZXM6XG4gKiBgYGBcbiAqIFN0eWxpbmdDb250ZXh0W0luaXRpYWxTdHlsZXNJbmRleF0gPSBbXG4gKiAgIG51bGwsIG51bGwsICd3aWR0aCcsICcxMDBweCcsIGhlaWdodCwgJzIwMHB4JywgJ29wYWNpdHknLCAnMC41J1xuICogXVxuICogYGBgXG4gKlxuICogQ2xhc3NlczpcbiAqIGBgYFxuICogU3R5bGluZ0NvbnRleHRbSW5pdGlhbENsYXNzZXNJbmRleF0gPSBbXG4gKiAgIG51bGwsIG51bGwsICdmb28nLCB0cnVlLCAnYmFyJywgdHJ1ZSwgJ2JheicsIHRydWUsICdjYXInLCB0cnVlXG4gKiBdXG4gKiBgYGBcbiAqL1xuZXhwb3J0IGNvbnN0IGVudW0gSW5pdGlhbFN0eWxpbmdWYWx1ZXNJbmRleCB7XG4gIERlZmF1bHROdWxsVmFsdWVQb3NpdGlvbiA9IDAsXG4gIEluaXRpYWxDbGFzc2VzU3RyaW5nUG9zaXRpb24gPSAxLFxuICBLZXlWYWx1ZVN0YXJ0UG9zaXRpb24gPSAyLFxuICBQcm9wT2Zmc2V0ID0gMCxcbiAgVmFsdWVPZmZzZXQgPSAxLFxuICBTaXplID0gMlxufVxuXG4vKipcbiAqIEFuIGFycmF5IGxvY2F0ZWQgaW4gdGhlIFN0eWxpbmdDb250ZXh0IHRoYXQgaG91c2VzIGFsbCBkaXJlY3RpdmUgaW5zdGFuY2VzIGFuZCBhZGRpdGlvbmFsXG4gKiBkYXRhIGFib3V0IHRoZW0uXG4gKlxuICogRWFjaCBlbnRyeSBpbiB0aGlzIGFycmF5IHJlcHJlc2VudHMgYSBzb3VyY2Ugb2Ygd2hlcmUgc3R5bGUvY2xhc3MgYmluZGluZyB2YWx1ZXMgY291bGRcbiAqIGNvbWUgZnJvbS4gQnkgZGVmYXVsdCwgdGhlcmUgaXMgYWx3YXlzIGF0IGxlYXN0IG9uZSBkaXJlY3RpdmUgaGVyZSB3aXRoIGEgbnVsbCB2YWx1ZSBhbmRcbiAqIHRoYXQgcmVwcmVzZW50cyBiaW5kaW5ncyB0aGF0IGxpdmUgZGlyZWN0bHkgb24gYW4gZWxlbWVudCBpbiB0aGUgdGVtcGxhdGUgKG5vdCBob3N0IGJpbmRpbmdzKS5cbiAqXG4gKiBFYWNoIHN1Y2Nlc3NpdmUgZW50cnkgaW4gdGhlIGFycmF5IGlzIGFuIGFjdHVhbCBpbnN0YW5jZSBvZiBhIGRpcmVjdGl2ZSBhcyB3ZWxsIGFzIHNvbWVcbiAqIGFkZGl0aW9uYWwgaW5mbyBhYm91dCB0aGF0IGVudHJ5LlxuICpcbiAqIEFuIGVudHJ5IHdpdGhpbiB0aGlzIGFycmF5IGhhcyB0aGUgZm9sbG93aW5nIHZhbHVlczpcbiAqIFswXSA9IFRoZSBpbnN0YW5jZSBvZiB0aGUgZGlyZWN0aXZlICh0aGUgZmlyc3QgZW50cnkgaXMgbnVsbCBiZWNhdXNlIGl0cyByZXNlcnZlZCBmb3IgdGhlXG4gKiAgICAgICB0ZW1wbGF0ZSlcbiAqIFsxXSA9IFRoZSBwb2ludGVyIHRoYXQgdGVsbHMgd2hlcmUgdGhlIHNpbmdsZSBzdHlsaW5nIChzdHVmZiBsaWtlIFtjbGFzcy5mb29dIGFuZCBbc3R5bGUucHJvcF0pXG4gKiAgICAgICBvZmZzZXQgdmFsdWVzIGFyZSBsb2NhdGVkLiBUaGlzIHZhbHVlIHdpbGwgYWxsb3cgZm9yIGEgYmluZGluZyBpbnN0cnVjdGlvbiB0byBmaW5kIGV4YWN0bHlcbiAqICAgICAgIHdoZXJlIGEgc3R5bGUgaXMgbG9jYXRlZC5cbiAqIFsyXSA9IFdoZXRoZXIgb3Igbm90IHRoZSBkaXJlY3RpdmUgaGFzIGFueSBzdHlsaW5nIHZhbHVlcyB0aGF0IGFyZSBkaXJ0eS4gVGhpcyBpcyB1c2VkIGFzXG4gKiAgICAgICByZWZlcmVuY2Ugd2l0aGluIHRoZSBgcmVuZGVyU3R5bGluZ2AgZnVuY3Rpb24gdG8gZGVjaWRlIHdoZXRoZXIgdG8gc2tpcCBpdGVyYXRpbmdcbiAqICAgICAgIHRocm91Z2ggdGhlIGNvbnRleHQgd2hlbiByZW5kZXJpbmcgaXMgZXhlY3V0ZWQuXG4gKiBbM10gPSBUaGUgc3R5bGVTYW5pdGl6ZXIgaW5zdGFuY2UgdGhhdCBpcyBhc3NpZ25lZCB0byB0aGUgZGlyZWN0aXZlLiBBbHRob3VnaCBpdCdzIHVubGlrZWx5LFxuICogICAgICAgYSBkaXJlY3RpdmUgY291bGQgaW50cm9kdWNlIGl0cyBvd24gc3BlY2lhbCBzdHlsZSBzYW5pdGl6ZXIgYW5kIGZvciB0aGlzIHJlYWNoIGVhY2hcbiAqICAgICAgIGRpcmVjdGl2ZSB3aWxsIGdldCBpdHMgb3duIHNwYWNlIGZvciBpdCAoaWYgbnVsbCB0aGVuIHRoZSB2ZXJ5IGZpcnN0IHNhbml0aXplciBpcyB1c2VkKS5cbiAqXG4gKiBFYWNoIHRpbWUgYSBuZXcgZGlyZWN0aXZlIGlzIGFkZGVkIGl0IHdpbGwgaW5zZXJ0IHRoZXNlIGZvdXIgdmFsdWVzIGF0IHRoZSBlbmQgb2YgdGhlIGFycmF5LlxuICogV2hlbiB0aGlzIGFycmF5IGlzIGV4YW1pbmVkIHRoZW4gdGhlIHJlc3VsdGluZyBkaXJlY3RpdmVJbmRleCB3aWxsIGJlIHJlc29sdmVkIGJ5IGRpdmlkaW5nIHRoZVxuICogaW5kZXggdmFsdWUgYnkgdGhlIHNpemUgb2YgdGhlIGFycmF5IGVudHJpZXMgKHNvIGlmIERpckEgaXMgYXQgc3BvdCA4IHRoZW4gaXRzIGluZGV4IHdpbGwgYmUgMikuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgRGlyZWN0aXZlUmVnaXN0cnlWYWx1ZXMgZXh0ZW5kcyBBcnJheTxudWxsfHt9fGJvb2xlYW58bnVtYmVyfFN0eWxlU2FuaXRpemVGbj4ge1xuICBbRGlyZWN0aXZlUmVnaXN0cnlWYWx1ZXNJbmRleC5EaXJlY3RpdmVWYWx1ZU9mZnNldF06IG51bGw7XG4gIFtEaXJlY3RpdmVSZWdpc3RyeVZhbHVlc0luZGV4LlNpbmdsZVByb3BWYWx1ZXNJbmRleE9mZnNldF06IG51bWJlcjtcbiAgW0RpcmVjdGl2ZVJlZ2lzdHJ5VmFsdWVzSW5kZXguRGlydHlGbGFnT2Zmc2V0XTogYm9vbGVhbjtcbiAgW0RpcmVjdGl2ZVJlZ2lzdHJ5VmFsdWVzSW5kZXguU3R5bGVTYW5pdGl6ZXJPZmZzZXRdOiBTdHlsZVNhbml0aXplRm58bnVsbDtcbn1cblxuLyoqXG4gKiBBbiBlbnVtIHRoYXQgb3V0bGluZXMgdGhlIG9mZnNldC9wb3NpdGlvbiB2YWx1ZXMgZm9yIGVhY2ggZGlyZWN0aXZlIGVudHJ5IGFuZCBpdHMgZGF0YVxuICogdGhhdCBhcmUgaG91c2VkIGluc2lkZSBvZiBbRGlyZWN0aXZlUmVnaXN0cnlWYWx1ZXNdLlxuICovXG5leHBvcnQgY29uc3QgZW51bSBEaXJlY3RpdmVSZWdpc3RyeVZhbHVlc0luZGV4IHtcbiAgRGlyZWN0aXZlVmFsdWVPZmZzZXQgPSAwLFxuICBTaW5nbGVQcm9wVmFsdWVzSW5kZXhPZmZzZXQgPSAxLFxuICBEaXJ0eUZsYWdPZmZzZXQgPSAyLFxuICBTdHlsZVNhbml0aXplck9mZnNldCA9IDMsXG4gIFNpemUgPSA0XG59XG5cbi8qKlxuICogQW4gYXJyYXkgdGhhdCBjb250YWlucyB0aGUgaW5kZXggcG9pbnRlciB2YWx1ZXMgZm9yIGV2ZXJ5IHNpbmdsZSBzdHlsaW5nIHByb3BlcnR5XG4gKiB0aGF0IGV4aXN0cyBpbiB0aGUgY29udGV4dCBhbmQgZm9yIGV2ZXJ5IGRpcmVjdGl2ZS4gSXQgYWxzbyBjb250YWlucyB0aGUgdG90YWxcbiAqIHNpbmdsZSBzdHlsZXMgYW5kIHNpbmdsZSBjbGFzc2VzIHRoYXQgZXhpc3RzIGluIHRoZSBjb250ZXh0IGFzIHRoZSBmaXJzdCB0d28gdmFsdWVzLlxuICpcbiAqIExldCdzIHNheSB3ZSBoYXZlIHRoZSBmb2xsb3dpbmcgdGVtcGxhdGUgY29kZTpcbiAqXG4gKiA8ZGl2IFtzdHlsZS53aWR0aF09XCJteVdpZHRoXCJcbiAqICAgICAgW3N0eWxlLmhlaWdodF09XCJteUhlaWdodFwiXG4gKiAgICAgIFtjbGFzcy5mbGlwcGVkXT1cImZsaXBDbGFzc1wiXG4gKiAgICAgIGRpcmVjdGl2ZS13aXRoLW9wYWNpdHk+XG4gKiAgICAgIGRpcmVjdGl2ZS13aXRoLWZvby1iYXItY2xhc3Nlcz5cbiAqXG4gKiBXZSBoYXZlIHR3byBkaXJlY3RpdmUgYW5kIHRlbXBsYXRlLWJpbmRpbmcgc291cmNlcyxcbiAqIDIgKyAxIHN0eWxlcyBhbmQgMSArIDEgY2xhc3Nlcy4gV2hlbiB0aGUgYmluZGluZ3MgYXJlXG4gKiByZWdpc3RlcmVkIHRoZSBTaW5nbGVQcm9wT2Zmc2V0cyBhcnJheSB3aWxsIGxvb2sgbGlrZSBzbzpcbiAqXG4gKiBzXzAvY18wID0gdGVtcGxhdGUgZGlyZWN0aXZlIHZhbHVlXG4gKiBzXzEvY18xID0gZGlyZWN0aXZlIG9uZSAoZGlyZWN0aXZlLXdpdGgtb3BhY2l0eSlcbiAqIHNfMi9jXzIgPSBkaXJlY3RpdmUgdHdvIChkaXJlY3RpdmUtd2l0aC1mb28tYmFyLWNsYXNzZXMpXG4gKlxuICogWzMsIDIsIDIsIDEsIHNfMDAsIHMwMSwgY18wMSwgMSwgMCwgc18xMCwgMCwgMSwgY18yMFxuICovXG5leHBvcnQgaW50ZXJmYWNlIFNpbmdsZVByb3BPZmZzZXRWYWx1ZXMgZXh0ZW5kcyBBcnJheTxudW1iZXI+IHtcbiAgW1NpbmdsZVByb3BPZmZzZXRWYWx1ZXNJbmRleC5TdHlsZXNDb3VudFBvc2l0aW9uXTogbnVtYmVyO1xuICBbU2luZ2xlUHJvcE9mZnNldFZhbHVlc0luZGV4LkNsYXNzZXNDb3VudFBvc2l0aW9uXTogbnVtYmVyO1xufVxuXG4vKipcbiAqIEFuIGVudW0gdGhhdCBvdXRsaW5lcyB0aGUgb2Zmc2V0L3Bvc2l0aW9uIHZhbHVlcyBmb3IgZWFjaCBzaW5nbGUgcHJvcC9jbGFzcyBlbnRyeVxuICogdGhhdCBhcmUgaG91c2VkIGluc2lkZSBvZiBbU2luZ2xlUHJvcE9mZnNldFZhbHVlc10uXG4gKi9cbmV4cG9ydCBjb25zdCBlbnVtIFNpbmdsZVByb3BPZmZzZXRWYWx1ZXNJbmRleCB7XG4gIFN0eWxlc0NvdW50UG9zaXRpb24gPSAwLFxuICBDbGFzc2VzQ291bnRQb3NpdGlvbiA9IDEsXG4gIFZhbHVlU3RhcnRQb3NpdGlvbiA9IDJcbn1cblxuLyoqXG4gKiBVc2VkIGEgcmVmZXJlbmNlIGZvciBhbGwgbXVsdGkgc3R5bGluZyB2YWx1ZXMgKHZhbHVlcyB0aGF0IGFyZSBhc3NpZ25lZCB2aWEgdGhlXG4gKiBgW3N0eWxlXWAgYW5kIGBbY2xhc3NdYCBiaW5kaW5ncykuXG4gKlxuICogU2luZ2xlLXN0eWxpbmcgcHJvcGVydGllcyAodGhpbmdzIHNldCB2aWEgYFtzdHlsZS5wcm9wXWAgYW5kIGBbY2xhc3MubmFtZV1gIGJpbmRpbmdzKVxuICogYXJlIG5vdCBoYW5kbGVkIHVzaW5nIHRoZSBzYW1lIGFwcHJvYWNoIGFzIG11bHRpLXN0eWxpbmcgYmluZGluZ3MgKHN1Y2ggYXMgYFtzdHlsZV1gXG4gKiBgW2NsYXNzXWAgYmluZGluZ3MpLlxuICpcbiAqIE11bHRpLXN0eWxpbmcgYmluZGluZ3MgcmVseSBvbiBhIGRpZmZpbmcgYWxnb3JpdGhtIHRvIGZpZ3VyZSBvdXQgd2hhdCBwcm9wZXJ0aWVzIGhhdmUgYmVlbiBhZGRlZCxcbiAqIHJlbW92ZWQgYW5kIG1vZGlmaWVkLiBNdWx0aS1zdHlsaW5nIHByb3BlcnRpZXMgYXJlIGFsc28gZXZhbHVhdGVkIGFjcm9zcyBkaXJlY3RpdmVzLS13aGljaCBtZWFuc1xuICogdGhhdCBBbmd1bGFyIHN1cHBvcnRzIGhhdmluZyBtdWx0aXBsZSBkaXJlY3RpdmVzIGFsbCB3cml0ZSB0byB0aGUgc2FtZSBgW3N0eWxlXWAgYW5kIGBbY2xhc3NdYFxuICogYmluZGluZ3MgKHVzaW5nIGhvc3QgYmluZGluZ3MpIGV2ZW4gaWYgdGhlIGBbc3R5bGVdYCBhbmQvb3IgYFtjbGFzc11gIGJpbmRpbmdzIGFyZSBiZWluZyB3cml0dGVuXG4gKiB0byBvbiB0aGUgdGVtcGxhdGUgZWxlbWVudC5cbiAqXG4gKiBBbGwgbXVsdGktc3R5bGluZyB2YWx1ZXMgdGhhdCBhcmUgd3JpdHRlbiB0byBhbiBlbGVtZW50ICh3aGV0aGVyIGl0IGJlIGZyb20gdGhlIHRlbXBsYXRlIG9yIGFueVxuICogZGlyZWN0aXZlcyBhdHRhY2hlZCB0byB0aGUgZWxlbWVudCkgYXJlIGFsbCB3cml0dGVuIGludG8gdGhlIGBNYXBCYXNlZE9mZnNldFZhbHVlc2AgYXJyYXkuIChOb3RlXG4gKiB0aGF0IHRoZXJlIGFyZSB0d28gYXJyYXlzOiBvbmUgZm9yIHN0eWxlcyBhbmQgYW5vdGhlciBmb3IgY2xhc3Nlcy4pXG4gKlxuICogVGhpcyBhcnJheSBpcyBzaGFwZWQgaW4gdGhlIGZvbGxvd2luZyB3YXk6XG4gKlxuICogWzBdICA9IFRoZSB0b3RhbCBhbW91bnQgb2YgdW5pcXVlIG11bHRpLXN0eWxlIG9yIG11bHRpLWNsYXNzIGVudHJpZXMgdGhhdCBleGlzdCBjdXJyZW50bHkgaW4gdGhlXG4gKiAgICAgICAgY29udGV4dC5cbiAqIFsxK10gPSBDb250YWlucyBhbiBlbnRyeSBvZiBmb3VyIHZhbHVlcyAuLi4gRWFjaCBlbnRyeSBpcyBhIHZhbHVlIGFzc2lnbmVkIGJ5IGFcbiAqIGBbc3R5bGVdYC9gW2NsYXNzXWBcbiAqICAgICAgICBiaW5kaW5nICh3ZSBjYWxsIHRoaXMgYSAqKnNvdXJjZSoqKS5cbiAqXG4gKiAgICAgICAgQW4gZXhhbXBsZSBlbnRyeSBsb29rcyBsaWtlIHNvIChhdCBhIGdpdmVuIGBpYCBpbmRleCk6XG4gKiAgICAgICAgW2kgKyAwXSA9IFdoZXRoZXIgb3Igbm90IHRoZSB2YWx1ZSBpcyBkaXJ0eVxuICpcbiAqICAgICAgICBbaSArIDFdID0gVGhlIGluZGV4IG9mIHdoZXJlIHRoZSBtYXAtYmFzZWQgdmFsdWVzXG4gKiAgICAgICAgICAgICAgICAgIChmb3IgdGhpcyAqKnNvdXJjZSoqKSBzdGFydCB3aXRoaW4gdGhlIGNvbnRleHRcbiAqXG4gKiAgICAgICAgW2kgKyAyXSA9IFRoZSB1bnRvdWNoZWQsIGxhc3Qgc2V0IHZhbHVlIG9mIHRoZSBiaW5kaW5nXG4gKlxuICogICAgICAgIFtpICsgM10gPSBUaGUgdG90YWwgYW1vdW50IG9mIHVucWl1ZSBiaW5kaW5nIHZhbHVlcyB0aGF0IHdlcmVcbiAqICAgICAgICAgICAgICAgICAgZXh0cmFjdGVkIGFuZCBzZXQgaW50byB0aGUgY29udGV4dC4gKE5vdGUgdGhhdCB0aGlzIHZhbHVlIGRvZXNcbiAqICAgICAgICAgICAgICAgICAgbm90IHJlZmxlY3QgdGhlIHRvdGFsIGFtb3VudCBvZiB2YWx1ZXMgd2l0aGluIHRoZSBiaW5kaW5nXG4gKiAgICAgICAgICAgICAgICAgIHZhbHVlIChzaW5jZSBpdCdzIGEgbWFwKSwgYnV0IGluc3RlYWQgcmVmbGVjdHMgdGhlIHRvdGFsIHZhbHVlc1xuICogICAgICAgICAgICAgICAgICB0aGF0IHdlcmUgbm90IHVzZWQgYnkgYW5vdGhlciBkaXJlY3RpdmUpLlxuICpcbiAqIEVhY2ggdGltZSBhIGRpcmVjdGl2ZSAob3IgdGVtcGxhdGUpIHdyaXRlcyBhIHZhbHVlIHRvIGEgYFtjbGFzc11gL2Bbc3R5bGVdYCBiaW5kaW5nIHRoZW4gdGhlXG4gKiBzdHlsaW5nIGRpZmZpbmcgYWxnb3JpdGhtIGNvZGUgd2lsbCBkZWNpZGUgd2hldGhlciBvciBub3QgdG8gdXBkYXRlIHRoZSB2YWx1ZSBiYXNlZCBvbiB0aGVcbiAqIGZvbGxvd2luZyBydWxlczpcbiAqXG4gKiAxLiBJZiBhIG1vcmUgaW1wb3J0YW50IGRpcmVjdGl2ZSAoZWl0aGVyIHRoZSB0ZW1wbGF0ZSBvciBhIGRpcmVjdGl2ZSB0aGF0IHdhcyByZWdpc3RlcmVkXG4gKiAgICBiZWZvcmVoYW5kKSBoYXMgd3JpdHRlbiBhIHNwZWNpZmljIHN0eWxpbmcgdmFsdWUgaW50byB0aGUgY29udGV4dCB0aGVuIGFueSBmb2xsb3ctdXAgc3R5bGluZ1xuICogICAgdmFsdWVzIChzZXQgYnkgYW5vdGhlciBkaXJlY3RpdmUgdmlhIGl0cyBgW3N0eWxlXWAgYW5kL29yIGBbY2xhc3NdYCBob3N0IGJpbmRpbmcpIHdpbGwgbm90IGJlXG4gKiAgICBhYmxlIHRvIHNldCBpdC4gVGhpcyBpcyBiZWNhdXNlIHRoZSBmb3JtZXIgZGlyZWN0aXZlIGhhcyBwcmlvcnR5LlxuICogMi4gT25seSBpZiBhIGZvcm1lciBkaXJlY3RpdmUgaGFzIHNldCBhIHNwZWNpZmljIHN0eWxpbmcgdmFsdWUgdG8gbnVsbCAod2hldGhlciBieSBhY3R1YWxseVxuICogICAgc2V0dGluZyBpdCB0byBudWxsIG9yIG5vdCBpbmNsdWRpbmcgaXQgaW4gaXMgbWFwIHZhbHVlKSB0aGVuIGEgbGVzcyBpbXBvcmF0YW50IGRpcmVjdGl2ZSBjYW5cbiAqICAgIHNldCBpdHMgb3duIHZhbHVlLlxuICpcbiAqICMjIEhvdyB0aGUgbWFwLWJhc2VkIHN0eWxpbmcgYWxnb3JpdGhtIHVwZGF0ZXMgaXRzZWxmXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgTWFwQmFzZWRPZmZzZXRWYWx1ZXMgZXh0ZW5kcyBBcnJheTxhbnk+IHtcbiAgW01hcEJhc2VkT2Zmc2V0VmFsdWVzSW5kZXguRW50cmllc0NvdW50UG9zaXRpb25dOiBudW1iZXI7XG59XG5cbmV4cG9ydCBjb25zdCBlbnVtIE1hcEJhc2VkT2Zmc2V0VmFsdWVzSW5kZXgge1xuICBFbnRyaWVzQ291bnRQb3NpdGlvbiA9IDAsXG4gIFZhbHVlc1N0YXJ0UG9zaXRpb24gPSAxLFxuICBEaXJ0eUZsYWdPZmZzZXQgPSAwLFxuICBQb3NpdGlvblN0YXJ0T2Zmc2V0ID0gMSxcbiAgVmFsdWVPZmZzZXQgPSAyLFxuICBWYWx1ZUNvdW50T2Zmc2V0ID0gMyxcbiAgU2l6ZSA9IDRcbn1cblxuLyoqXG4gKiBVc2VkIHRvIHNldCB0aGUgY29udGV4dCB0byBiZSBkaXJ0eSBvciBub3QgYm90aCBvbiB0aGUgbWFzdGVyIGZsYWcgKHBvc2l0aW9uIDEpXG4gKiBvciBmb3IgZWFjaCBzaW5nbGUvbXVsdGkgcHJvcGVydHkgdGhhdCBleGlzdHMgaW4gdGhlIGNvbnRleHQuXG4gKi9cbmV4cG9ydCBjb25zdCBlbnVtIFN0eWxpbmdGbGFncyB7XG4gIC8vIEltcGxpZXMgbm8gY29uZmlndXJhdGlvbnNcbiAgTm9uZSA9IDBiMDAwMDAsXG4gIC8vIFdoZXRoZXIgb3Igbm90IHRoZSBlbnRyeSBvciBjb250ZXh0IGl0c2VsZiBpcyBkaXJ0eVxuICBEaXJ0eSA9IDBiMDAwMDEsXG4gIC8vIFdoZXRoZXIgb3Igbm90IHRoaXMgaXMgYSBjbGFzcy1iYXNlZCBhc3NpZ25tZW50XG4gIENsYXNzID0gMGIwMDAxMCxcbiAgLy8gV2hldGhlciBvciBub3QgYSBzYW5pdGl6ZXIgd2FzIGFwcGxpZWQgdG8gdGhpcyBwcm9wZXJ0eVxuICBTYW5pdGl6ZSA9IDBiMDAxMDAsXG4gIC8vIFdoZXRoZXIgb3Igbm90IGFueSBwbGF5ZXIgYnVpbGRlcnMgd2l0aGluIG5lZWQgdG8gcHJvZHVjZSBuZXcgcGxheWVyc1xuICBQbGF5ZXJCdWlsZGVyc0RpcnR5ID0gMGIwMTAwMCxcbiAgLy8gVGhlIG1heCBhbW91bnQgb2YgYml0cyB1c2VkIHRvIHJlcHJlc2VudCB0aGVzZSBjb25maWd1cmF0aW9uIHZhbHVlc1xuICBCaW5kaW5nQWxsb2NhdGlvbkxvY2tlZCA9IDBiMTAwMDAsXG4gIEJpdENvdW50U2l6ZSA9IDUsXG4gIC8vIFRoZXJlIGFyZSBvbmx5IGZpdmUgYml0cyBoZXJlXG4gIEJpdE1hc2sgPSAwYjExMTExXG59XG5cbi8qKiBVc2VkIGFzIG51bWVyaWMgcG9pbnRlciB2YWx1ZXMgdG8gZGV0ZXJtaW5lIHdoYXQgY2VsbHMgdG8gdXBkYXRlIGluIHRoZSBgU3R5bGluZ0NvbnRleHRgICovXG5leHBvcnQgY29uc3QgZW51bSBTdHlsaW5nSW5kZXgge1xuICAvLyBJbmRleCBvZiBsb2NhdGlvbiB3aGVyZSB0aGUgc3RhcnQgb2Ygc2luZ2xlIHByb3BlcnRpZXMgYXJlIHN0b3JlZC4gKGB1cGRhdGVTdHlsZVByb3BgKVxuICBNYXN0ZXJGbGFnUG9zaXRpb24gPSAwLFxuICAvLyBQb3NpdGlvbiBvZiB3aGVyZSB0aGUgcmVnaXN0ZXJlZCBkaXJlY3RpdmVzIGV4aXN0IGZvciB0aGlzIHN0eWxpbmcgY29udGV4dFxuICBEaXJlY3RpdmVSZWdpc3RyeVBvc2l0aW9uID0gMSxcbiAgLy8gUG9zaXRpb24gb2Ygd2hlcmUgdGhlIGluaXRpYWwgc3R5bGVzIGFyZSBzdG9yZWQgaW4gdGhlIHN0eWxpbmcgY29udGV4dFxuICBJbml0aWFsU3R5bGVWYWx1ZXNQb3NpdGlvbiA9IDIsXG4gIEluaXRpYWxDbGFzc1ZhbHVlc1Bvc2l0aW9uID0gMyxcbiAgLy8gSW5kZXggb2YgbG9jYXRpb24gd2hlcmUgdGhlIGNsYXNzIGluZGV4IG9mZnNldCB2YWx1ZSBpcyBsb2NhdGVkXG4gIFNpbmdsZVByb3BPZmZzZXRQb3NpdGlvbnMgPSA0LFxuICAvLyBQb3NpdGlvbiBvZiB3aGVyZSB0aGUgaW5pdGlhbCBzdHlsZXMgYXJlIHN0b3JlZCBpbiB0aGUgc3R5bGluZyBjb250ZXh0XG4gIC8vIFRoaXMgaW5kZXggbXVzdCBhbGlnbiB3aXRoIEhPU1QsIHNlZSBpbnRlcmZhY2VzL3ZpZXcudHNcbiAgRWxlbWVudFBvc2l0aW9uID0gNSxcbiAgLy8gUG9zaXRpb24gb2Ygd2hlcmUgdGhlIGxhc3Qgc3RyaW5nLWJhc2VkIENTUyBjbGFzcyB2YWx1ZSB3YXMgc3RvcmVkIChvciBhIGNhY2hlZCB2ZXJzaW9uIG9mIHRoZVxuICAvLyBpbml0aWFsIHN0eWxlcyB3aGVuIGEgW2NsYXNzXSBkaXJlY3RpdmUgaXMgcHJlc2VudClcbiAgQ2FjaGVkTXVsdGlDbGFzc2VzID0gNixcbiAgLy8gUG9zaXRpb24gb2Ygd2hlcmUgdGhlIGxhc3Qgc3RyaW5nLWJhc2VkIENTUyBjbGFzcyB2YWx1ZSB3YXMgc3RvcmVkXG4gIENhY2hlZE11bHRpU3R5bGVzID0gNyxcbiAgLy8gTXVsdGkgYW5kIHNpbmdsZSBlbnRyaWVzIGFyZSBzdG9yZWQgaW4gYFN0eWxpbmdDb250ZXh0YCBhczogRmxhZzsgUHJvcGVydHlOYW1lOyAgUHJvcGVydHlWYWx1ZVxuICAvLyBQb3NpdGlvbiBvZiB3aGVyZSB0aGUgaW5pdGlhbCBzdHlsZXMgYXJlIHN0b3JlZCBpbiB0aGUgc3R5bGluZyBjb250ZXh0XG4gIFBsYXllckNvbnRleHQgPSA4LFxuICAvLyBMb2NhdGlvbiBvZiBzaW5nbGUgKHByb3ApIHZhbHVlIGVudHJpZXMgYXJlIHN0b3JlZCB3aXRoaW4gdGhlIGNvbnRleHRcbiAgU2luZ2xlU3R5bGVzU3RhcnRQb3NpdGlvbiA9IDksXG4gIEZsYWdzT2Zmc2V0ID0gMCxcbiAgUHJvcGVydHlPZmZzZXQgPSAxLFxuICBWYWx1ZU9mZnNldCA9IDIsXG4gIFBsYXllckJ1aWxkZXJJbmRleE9mZnNldCA9IDMsXG4gIC8vIFNpemUgb2YgZWFjaCBtdWx0aSBvciBzaW5nbGUgZW50cnkgKGZsYWcgKyBwcm9wICsgdmFsdWUgKyBwbGF5ZXJCdWlsZGVySW5kZXgpXG4gIFNpemUgPSA0LFxuICAvLyBFYWNoIGZsYWcgaGFzIGEgYmluYXJ5IGRpZ2l0IGxlbmd0aCBvZiB0aGlzIHZhbHVlXG4gIEJpdENvdW50U2l6ZSA9IDE0LCAgLy8gKDMyIC0gNCkgLyAyID0gfjE0XG4gIC8vIFRoZSBiaW5hcnkgZGlnaXQgdmFsdWUgYXMgYSBtYXNrXG4gIEJpdE1hc2sgPSAwYjExMTExMTExMTExMTExLCAgLy8gMTQgYml0c1xufVxuXG4vKipcbiAqIEFuIGVudW0gdGhhdCBvdXRsaW5lcyB0aGUgYml0IGZsYWcgZGF0YSBmb3IgZGlyZWN0aXZlIG93bmVyIGFuZCBwbGF5ZXIgaW5kZXhcbiAqIHZhbHVlcyB0aGF0IGV4aXN0IHdpdGhpbiBlbiBlbnRyeSB0aGF0IGxpdmVzIGluIHRoZSBTdHlsaW5nQ29udGV4dC5cbiAqXG4gKiBUaGUgdmFsdWVzIGhlcmUgc3BsaXQgYSBudW1iZXIgdmFsdWUgaW50byB0d28gc2V0cyBvZiBiaXRzOlxuICogIC0gVGhlIGZpcnN0IDE2IGJpdHMgYXJlIHVzZWQgdG8gc3RvcmUgdGhlIGRpcmVjdGl2ZUluZGV4IHRoYXQgb3ducyB0aGlzIHN0eWxlIHZhbHVlXG4gKiAgLSBUaGUgb3RoZXIgMTYgYml0cyBhcmUgdXNlZCB0byBzdG9yZSB0aGUgcGxheWVyQnVpbGRlckluZGV4IHRoYXQgaXMgYXR0YWNoZWQgdG8gdGhpcyBzdHlsZVxuICovXG5leHBvcnQgY29uc3QgZW51bSBEaXJlY3RpdmVPd25lckFuZFBsYXllckJ1aWxkZXJJbmRleCB7XG4gIEJpdENvdW50U2l6ZSA9IDE2LFxuICBCaXRNYXNrID0gMGIxMTExMTExMTExMTExMTExXG59XG4iXX0=