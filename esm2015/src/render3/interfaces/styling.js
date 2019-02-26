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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3R5bGluZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaW50ZXJmYWNlcy9zdHlsaW5nLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBdVFBLG9DQXFEQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFTRCwwQ0FHQzs7Ozs7Ozs7O0lBMEdDLDJCQUE0QjtJQUM1QiwrQkFBZ0M7SUFDaEMsd0JBQXlCO0lBQ3pCLGFBQWM7SUFDZCxjQUFlO0lBQ2YsT0FBUTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUErQlYsNkNBS0M7Ozs7Ozs7Ozs7Ozs7SUFPQyx1QkFBd0I7SUFDeEIsOEJBQStCO0lBQy9CLGtCQUFtQjtJQUNuQix1QkFBd0I7SUFDeEIsT0FBUTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBMEJWLDRDQUdDOzs7Ozs7Ozs7SUFPQyxzQkFBdUI7SUFDdkIsdUJBQXdCO0lBQ3hCLHFCQUFzQjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQXlEeEIsMENBRUM7Ozs7Ozs7SUFHQyx1QkFBd0I7SUFDeEIsc0JBQXVCO0lBQ3ZCLGtCQUFtQjtJQUNuQixzQkFBdUI7SUFDdkIsY0FBZTtJQUNmLG1CQUFvQjtJQUNwQixPQUFROzs7OztJQVFSLDRCQUE0QjtJQUM1QixPQUFjO0lBQ2Qsc0RBQXNEO0lBQ3RELFFBQWU7SUFDZixrREFBa0Q7SUFDbEQsUUFBZTtJQUNmLDBEQUEwRDtJQUMxRCxXQUFrQjtJQUNsQix3RUFBd0U7SUFDeEUsc0JBQTZCO0lBQzdCLHNFQUFzRTtJQUN0RSwyQkFBaUM7SUFDakMsZUFBZ0I7SUFDaEIsZ0NBQWdDO0lBQ2hDLFdBQWlCOzs7OztJQUtqQix5RUFBeUU7SUFDekUsMERBQTBEO0lBQzFELGtCQUFtQjtJQUNuQix5RkFBeUY7SUFDekYscUJBQXNCO0lBQ3RCLDZFQUE2RTtJQUM3RSw0QkFBNkI7SUFDN0IseUVBQXlFO0lBQ3pFLDZCQUE4QjtJQUM5Qiw2QkFBOEI7SUFDOUIsa0VBQWtFO0lBQ2xFLDRCQUE2QjtJQUM3QixpR0FBaUc7SUFDakcsc0RBQXNEO0lBQ3RELHFCQUFzQjtJQUN0QixxRUFBcUU7SUFDckUsb0JBQXFCO0lBQ3JCLGlHQUFpRztJQUNqRyx5RUFBeUU7SUFDekUsZ0JBQWlCO0lBQ2pCLHdFQUF3RTtJQUN4RSw0QkFBNkI7SUFDN0IsY0FBZTtJQUNmLGlCQUFrQjtJQUNsQixjQUFlO0lBQ2YsMkJBQTRCO0lBQzVCLGdGQUFnRjtJQUNoRixPQUFRO0lBQ1Isb0RBQW9EO0lBQ3BELGdCQUFpQjtJQUNqQixtQ0FBbUM7SUFDbkMsY0FBMEI7Ozs7O0lBWTFCLGdCQUFpQjtJQUNqQixjQUE0QiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCB7U3R5bGVTYW5pdGl6ZUZufSBmcm9tICcuLi8uLi9zYW5pdGl6YXRpb24vc3R5bGVfc2FuaXRpemVyJztcbmltcG9ydCB7UkVsZW1lbnR9IGZyb20gJy4uL2ludGVyZmFjZXMvcmVuZGVyZXInO1xuaW1wb3J0IHtMQ29udGFpbmVyfSBmcm9tICcuL2NvbnRhaW5lcic7XG5pbXBvcnQge1BsYXllckNvbnRleHR9IGZyb20gJy4vcGxheWVyJztcbmltcG9ydCB7TFZpZXd9IGZyb20gJy4vdmlldyc7XG5cblxuLyoqXG4gKiBUaGUgc3R5bGluZyBjb250ZXh0IGFjdHMgYXMgYSBzdHlsaW5nIG1hbmlmZXN0IChzaGFwZWQgYXMgYW4gYXJyYXkpIGZvciBkZXRlcm1pbmluZyB3aGljaFxuICogc3R5bGluZyBwcm9wZXJ0aWVzIGhhdmUgYmVlbiBhc3NpZ25lZCB2aWEgdGhlIHByb3ZpZGVkIGB1cGRhdGVTdHlsaW5nTWFwYCwgYHVwZGF0ZVN0eWxlUHJvcGBcbiAqIGFuZCBgdXBkYXRlQ2xhc3NQcm9wYCBmdW5jdGlvbnMuIEl0IGFsc28gc3RvcmVzIHRoZSBzdGF0aWMgc3R5bGUvY2xhc3MgdmFsdWVzIHRoYXQgd2VyZVxuICogZXh0cmFjdGVkIGZyb20gdGhlIHRlbXBsYXRlIGJ5IHRoZSBjb21waWxlci5cbiAqXG4gKiBBIGNvbnRleHQgaXMgY3JlYXRlZCBieSBBbmd1bGFyIHdoZW46XG4gKiAxLiBBbiBlbGVtZW50IGNvbnRhaW5zIHN0YXRpYyBzdHlsaW5nIHZhbHVlcyAobGlrZSBzdHlsZT1cIi4uLlwiIG9yIGNsYXNzPVwiLi4uXCIpXG4gKiAyLiBBbiBlbGVtZW50IGNvbnRhaW5zIHNpbmdsZSBwcm9wZXJ0eSBiaW5kaW5nIHZhbHVlcyAobGlrZSBbc3R5bGUucHJvcF09XCJ4XCIgb3JcbiAqIFtjbGFzcy5wcm9wXT1cInlcIilcbiAqIDMuIEFuIGVsZW1lbnQgY29udGFpbnMgbXVsdGkgcHJvcGVydHkgYmluZGluZyB2YWx1ZXMgKGxpa2UgW3N0eWxlXT1cInhcIiBvciBbY2xhc3NdPVwieVwiKVxuICogNC4gQSBkaXJlY3RpdmUgY29udGFpbnMgaG9zdCBiaW5kaW5ncyBmb3Igc3RhdGljLCBzaW5nbGUgb3IgbXVsdGkgc3R5bGluZyBwcm9wZXJ0aWVzL2JpbmRpbmdzLlxuICogNS4gQW4gYW5pbWF0aW9uIHBsYXllciBpcyBhZGRlZCB0byBhbiBlbGVtZW50IHZpYSBgYWRkUGxheWVyYFxuICpcbiAqIE5vdGUgdGhhdCBldmVuIGlmIGFuIGVsZW1lbnQgY29udGFpbnMgc3RhdGljIHN0eWxpbmcgdGhlbiB0aGlzIGNvbnRleHQgd2lsbCBiZSBjcmVhdGVkIGFuZFxuICogYXR0YWNoZWQgdG8gaXQuIFRoZSByZWFzb24gd2h5IHRoaXMgaGFwcGVucyAoaW5zdGVhZCBvZiB0cmVhdGluZyBzdHlsZXMvY2xhc3NlcyBhcyByZWd1bGFyXG4gKiBIVE1MIGF0dHJpYnV0ZXMpIGlzIGJlY2F1c2UgdGhlIHN0eWxlL2NsYXNzIGJpbmRpbmdzIG11c3QgYmUgYWJsZSB0byBkZWZhdWx0IHRoZW1zZWx2ZXMgYmFja1xuICogdG8gdGhlaXIgcmVzcGVjdGl2ZSBzdGF0aWMgdmFsdWVzIHdoZW4gdGhleSBhcmUgc2V0IHRvIG51bGwuXG4gKlxuICogU2F5IGZvciBleGFtcGxlIHdlIGhhdmUgdGhpczpcbiAqIGBgYFxuICogPCEtLSB3aGVuIGBteVdpZHRoRXhwPW51bGxgIHRoZW4gYSB3aWR0aCBvZiBgMTAwcHhgXG4gKiAgICAgIHdpbGwgYmUgdXNlZCBhIGRlZmF1bHQgdmFsdWUgZm9yIHdpZHRoIC0tPlxuICogPGRpdiBzdHlsZT1cIndpZHRoOjEwMHB4XCIgW3N0eWxlLndpZHRoXT1cIm15V2lkdGhFeHBcIj48L2Rpdj5cbiAqIGBgYFxuICpcbiAqIEV2ZW4gaW4gdGhlIHNpdHVhdGlvbiB3aGVyZSB0aGVyZSBhcmUgbm8gYmluZGluZ3MsIHRoZSBzdGF0aWMgc3R5bGluZyBpcyBzdGlsbCBwbGFjZWQgaW50byB0aGVcbiAqIGNvbnRleHQgYmVjYXVzZSB0aGVyZSBtYXkgYmUgYW5vdGhlciBkaXJlY3RpdmUgb24gdGhlIHNhbWUgZWxlbWVudCB0aGF0IGhhcyBzdHlsaW5nLlxuICpcbiAqIFdoZW4gQW5ndWxhciBpbml0aWFsaXplcyBzdHlsaW5nIGRhdGEgZm9yIGFuIGVsZW1lbnQgdGhlbiBpdCB3aWxsIGZpcnN0IHJlZ2lzdGVyIHRoZSBzdGF0aWNcbiAqIHN0eWxpbmcgdmFsdWVzIG9uIHRoZSBlbGVtZW50IHVzaW5nIG9uZSBvZiB0aGVzZSB0d28gaW5zdHJ1Y3Rpb25zOlxuICpcbiAqIDEuIGVsZW1lbnRTdGFydCBvciBlbGVtZW50ICh3aXRoaW4gdGhlIHRlbXBsYXRlIGZ1bmN0aW9uIG9mIGEgY29tcG9uZW50KVxuICogMi4gZWxlbWVudEhvc3RBdHRycyAoZm9yIGRpcmVjdGl2ZSBob3N0IGJpbmRpbmdzKVxuICpcbiAqIEluIGVpdGhlciBjYXNlLCBhIHN0eWxpbmcgY29udGV4dCB3aWxsIGJlIGNyZWF0ZWQgYW5kIHN0b3JlZCB3aXRoaW4gYW4gZWxlbWVudCdzIGBMVmlld0RhdGFgLlxuICogT25jZSB0aGUgc3R5bGluZyBjb250ZXh0IGlzIGNyZWF0ZWQgdGhlbiBzaW5nbGUgYW5kIG11bHRpIHByb3BlcnRpZXMgY2FuIGJlIHN0b3JlZCB3aXRoaW4gaXQuXG4gKiBGb3IgdGhpcyB0byBoYXBwZW4sIHRoZSBmb2xsb3dpbmcgZnVuY3Rpb24gbmVlZHMgdG8gYmUgY2FsbGVkOlxuICpcbiAqIGBlbGVtZW50U3R5bGluZ2AgKGNhbGxlZCB3aXRoIHN0eWxlIHByb3BlcnRpZXMsIGNsYXNzIHByb3BlcnRpZXMgYW5kIGEgc2FuaXRpemVyICsgYSBkaXJlY3RpdmVcbiAqIGluc3RhbmNlKS5cbiAqXG4gKiBXaGVuIHRoaXMgaW5zdHJ1Y3Rpb24gaXMgY2FsbGVkIGl0IHdpbGwgcG9wdWxhdGUgdGhlIHN0eWxpbmcgY29udGV4dCB3aXRoIHRoZSBwcm92aWRlZCBzdHlsZVxuICogYW5kIGNsYXNzIG5hbWVzIGludG8gdGhlIGNvbnRleHQuXG4gKlxuICogVGhlIGNvbnRleHQgaXRzZWxmIGxvb2tzIGxpa2UgdGhpczpcbiAqXG4gKiBjb250ZXh0ID0gW1xuICogICAvLyAwLTg6IGhlYWRlciB2YWx1ZXMgKGFib3V0IDggZW50cmllcyBvZiBjb25maWd1cmF0aW9uIGRhdGEpXG4gKiAgIC8vIDkrOiB0aGlzIGlzIHdoZXJlIGVhY2ggZW50cnkgaXMgc3RvcmVkOlxuICogXVxuICpcbiAqIExldCdzIHNheSB3ZSBoYXZlIHRoZSBmb2xsb3dpbmcgdGVtcGxhdGUgY29kZTpcbiAqXG4gKiBgYGBcbiAqIDxkaXYgY2xhc3M9XCJmb28gYmFyXCJcbiAqICAgICAgc3R5bGU9XCJ3aWR0aDoyMDBweDsgY29sb3I6cmVkXCJcbiAqICAgICAgW3N0eWxlLndpZHRoXT1cIm15V2lkdGhFeHBcIlxuICogICAgICBbc3R5bGUuaGVpZ2h0XT1cIm15SGVpZ2h0RXhwXCJcbiAqICAgICAgW2NsYXNzLmJhel09XCJteUJhekV4cFwiPlxuICogYGBgXG4gKlxuICogVGhlIGNvbnRleHQgZ2VuZXJhdGVkIGZyb20gdGhlc2UgdmFsdWVzIHdpbGwgbG9vayBsaWtlIHRoaXMgKG5vdGUgdGhhdFxuICogZm9yIGVhY2ggYmluZGluZyBuYW1lICh0aGUgY2xhc3MgYW5kIHN0eWxlIGJpbmRpbmdzKSB0aGUgdmFsdWVzIHdpbGxcbiAqIGJlIGluc2VydGVkIHR3aWNlIGludG8gdGhlIGFycmF5IChvbmNlIGZvciBzaW5nbGUgcHJvcGVydHkgZW50cmllcyBhbmRcbiAqIGFnYWluIGZvciBtdWx0aSBwcm9wZXJ0eSBlbnRyaWVzKS5cbiAqXG4gKiBjb250ZXh0ID0gW1xuICogICAvLyAwLTg6IGhlYWRlciB2YWx1ZXMgKGFib3V0IDggZW50cmllcyBvZiBjb25maWd1cmF0aW9uIGRhdGEpXG4gKiAgIC8vIDkrOiB0aGlzIGlzIHdoZXJlIGVhY2ggZW50cnkgaXMgc3RvcmVkOlxuICpcbiAqICAgLy8gU0lOR0xFIFBST1BFUlRJRVNcbiAqICAgY29uZmlnRm9yV2lkdGgsXG4gKiAgICd3aWR0aCdcbiAqICAgbXlXaWR0aEV4cCwgLy8gdGhlIGJpbmRpbmcgdmFsdWUgbm90IHRoZSBiaW5kaW5nIGl0c2VsZlxuICogICAwLCAvLyB0aGUgZGlyZWN0aXZlIG93bmVyXG4gKlxuICogICBjb25maWdGb3JIZWlnaHQsXG4gKiAgICdoZWlnaHQnXG4gKiAgIG15SGVpZ2h0RXhwLCAvLyB0aGUgYmluZGluZyB2YWx1ZSBub3QgdGhlIGJpbmRpbmcgaXRzZWxmXG4gKiAgIDAsIC8vIHRoZSBkaXJlY3RpdmUgb3duZXJcbiAqXG4gKiAgIGNvbmZpZ0ZvckJhekNsYXNzLFxuICogICAnYmF6XG4gKiAgIG15QmF6Q2xhc3NFeHAsIC8vIHRoZSBiaW5kaW5nIHZhbHVlIG5vdCB0aGUgYmluZGluZyBpdHNlbGZcbiAqICAgMCwgLy8gdGhlIGRpcmVjdGl2ZSBvd25lclxuICpcbiAqICAgLy8gTVVMVEkgUFJPUEVSVElFU1xuICogICBjb25maWdGb3JXaWR0aCxcbiAqICAgJ3dpZHRoJ1xuICogICBteVdpZHRoRXhwLCAvLyB0aGUgYmluZGluZyB2YWx1ZSBub3QgdGhlIGJpbmRpbmcgaXRzZWxmXG4gKiAgIDAsIC8vIHRoZSBkaXJlY3RpdmUgb3duZXJcbiAqXG4gKiAgIGNvbmZpZ0ZvckhlaWdodCxcbiAqICAgJ2hlaWdodCdcbiAqICAgbXlIZWlnaHRFeHAsIC8vIHRoZSBiaW5kaW5nIHZhbHVlIG5vdCB0aGUgYmluZGluZyBpdHNlbGZcbiAqICAgMCwgLy8gdGhlIGRpcmVjdGl2ZSBvd25lclxuICpcbiAqICAgY29uZmlnRm9yQmF6Q2xhc3MsXG4gKiAgICdiYXpcbiAqICAgbXlCYXpDbGFzc0V4cCwgLy8gdGhlIGJpbmRpbmcgdmFsdWUgbm90IHRoZSBiaW5kaW5nIGl0c2VsZlxuICogICAwLCAvLyB0aGUgZGlyZWN0aXZlIG93bmVyXG4gKiBdXG4gKlxuICogVGhlIGNvbmZpZ3VyYXRpb24gdmFsdWVzIGFyZSBsZWZ0IG91dCBvZiB0aGUgZXhhbXBsZSBhYm92ZSBiZWNhdXNlXG4gKiB0aGUgb3JkZXJpbmcgb2YgdGhlbSBjb3VsZCBjaGFuZ2UgYmV0d2VlbiBjb2RlIHBhdGNoZXMuIFBsZWFzZSByZWFkIHRoZVxuICogZG9jdW1lbnRhdGlvbiBiZWxvdyB0byBnZXQgYSBiZXR0ZXIgdW5kZXJzdGFuZCBvZiB3aGF0IHRoZSBjb25maWd1cmF0aW9uXG4gKiB2YWx1ZXMgYXJlIGFuZCBob3cgdGhleSB3b3JrLlxuICpcbiAqIEVhY2ggdGltZSBhIGJpbmRpbmcgcHJvcGVydHkgaXMgdXBkYXRlZCAod2hldGhlciBpdCBiZSB0aHJvdWdoIGEgc2luZ2xlXG4gKiBwcm9wZXJ0eSBpbnN0cnVjdGlvbiBsaWtlIGBlbGVtZW50U3R5bGVQcm9wYCwgYGVsZW1lbnRDbGFzc1Byb3BgIG9yXG4gKiBgZWxlbWVudFN0eWxpbmdNYXBgKSB0aGVuIHRoZSB2YWx1ZXMgaW4gdGhlIGNvbnRleHQgd2lsbCBiZSB1cGRhdGVkIGFzXG4gKiB3ZWxsLlxuICpcbiAqIElmIGZvciBleGFtcGxlIGBbc3R5bGUud2lkdGhdYCB1cGRhdGVzIHRvIGA1NTVweGAgdGhlbiBpdHMgdmFsdWUgd2lsbCBiZSByZWZsZWN0ZWRcbiAqIGluIHRoZSBjb250ZXh0IGFzIHNvOlxuICpcbiAqIGNvbnRleHQgPSBbXG4gKiAgIC8vIC4uLlxuICogICBjb25maWdGb3JXaWR0aCwgLy8gdGhpcyB3aWxsIGJlIG1hcmtlZCBESVJUWVxuICogICAnd2lkdGgnXG4gKiAgICc1NTVweCcsXG4gKiAgIDAsXG4gKiAgIC8vLi5cbiAqIF1cbiAqXG4gKiBUaGUgY29udGV4dCBhbmQgZGlyZWN0aXZlIGRhdGEgd2lsbCBhbHNvIGJlIG1hcmtlZCBkaXJ0eS5cbiAqXG4gKiBEZXNwaXRlIHRoZSBjb250ZXh0IGJlaW5nIHVwZGF0ZWQsIG5vdGhpbmcgaGFzIGJlZW4gcmVuZGVyZWQgb24gc2NyZWVuIChub3Qgc3R5bGVzIG9yXG4gKiBjbGFzc2VzIGhhdmUgYmVlbiBzZXQgb24gdGhlIGVsZW1lbnQpLiBUbyBraWNrIG9mZiByZW5kZXJpbmcgZm9yIGFuIGVsZW1lbnQgdGhlIGZvbGxvd2luZ1xuICogZnVuY3Rpb24gbmVlZHMgdG8gYmUgcnVuIGBlbGVtZW50U3R5bGluZ0FwcGx5YC5cbiAqXG4gKiBgZWxlbWVudFN0eWxpbmdBcHBseWAgd2lsbCBydW4gdGhyb3VnaCB0aGUgY29udGV4dCBhbmQgZmluZCBlYWNoIGRpcnR5IHZhbHVlIGFuZCByZW5kZXIgdGhlbSBvbnRvXG4gKiB0aGUgZWxlbWVudC4gT25jZSBjb21wbGV0ZSwgYWxsIHN0eWxlcy9jbGFzc2VzIHdpbGwgYmUgc2V0IHRvIGNsZWFuLiBCZWNhdXNlIG9mIHRoaXMsIHRoZSByZW5kZXJcbiAqIGZ1bmN0aW9uIHdpbGwgbm93IGtub3cgbm90IHRvIHJlcnVuIGl0c2VsZiBhZ2FpbiBpZiBjYWxsZWQgYWdhaW4gdW5sZXNzIG5ldyBzdHlsZS9jbGFzcyB2YWx1ZXNcbiAqIGhhdmUgY2hhbmdlZC5cbiAqXG4gKiAjIyBEaXJlY3RpdmVzXG4gKiBEaXJlY3RpdmUgc3R5bGUvY2xhc3MgdmFsdWVzICh3aGljaCBhcmUgcHJvdmlkZWQgdGhyb3VnaCBob3N0IGJpbmRpbmdzKSBhcmUgYWxzbyBzdXBwb3J0ZWQgYW5kXG4gKiBob3VzZWQgd2l0aGluIHRoZSBzYW1lIHN0eWxpbmcgY29udGV4dCBhcyBhcmUgdGVtcGxhdGUtbGV2ZWwgc3R5bGUvY2xhc3MgcHJvcGVydGllcy9iaW5kaW5nc1xuICogU28gbG9uZyBhcyB0aGV5IGFyZSBhbGwgYXNzaWduZWQgdG8gdGhlIHNhbWUgZWxlbWVudCwgYm90aCBkaXJlY3RpdmUtbGV2ZWwgYW5kIHRlbXBsYXRlLWxldmVsXG4gKiBzdHlsaW5nIGJpbmRpbmdzIHNoYXJlIHRoZSBzYW1lIGNvbnRleHQuXG4gKlxuICogRWFjaCBvZiB0aGUgZm9sbG93aW5nIGluc3RydWN0aW9ucyBzdXBwb3J0cyBhY2NlcHRpbmcgYSBkaXJlY3RpdmUgaW5zdGFuY2UgYXMgYW4gaW5wdXQgcGFyYW1ldGVyOlxuICpcbiAqIC0gYGVsZW1lbnRIb3N0QXR0cnNgXG4gKiAtIGBlbGVtZW50U3R5bGluZ2BcbiAqIC0gYGVsZW1lbnRTdHlsZVByb3BgXG4gKiAtIGBlbGVtZW50Q2xhc3NQcm9wYFxuICogLSBgZWxlbWVudFN0eWxpbmdNYXBgXG4gKiAtIGBlbGVtZW50U3R5bGluZ0FwcGx5YFxuICpcbiAqIEVhY2ggdGltZSBhIGRpcmVjdGl2ZSB2YWx1ZSBpcyBwYXNzZWQgaW4sIGl0IHdpbGwgYmUgY29udmVydGVkIGludG8gYW4gaW5kZXggYnkgZXhhbWluaW5nIHRoZVxuICogZGlyZWN0aXZlIHJlZ2lzdHJ5ICh3aGljaCBsaXZlcyBpbiB0aGUgY29udGV4dCBjb25maWd1cmF0aW9uIGFyZWEpLiBUaGUgaW5kZXggaXMgdGhlbiB1c2VkXG4gKiB0byBoZWxwIHNpbmdsZSBzdHlsZSBwcm9wZXJ0aWVzIGZpZ3VyZSBvdXQgd2hlcmUgYSB2YWx1ZSBpcyBsb2NhdGVkIGluIHRoZSBjb250ZXh0LlxuICpcbiAqXG4gKiAjIyBTaW5nbGUtbGV2ZWwgc3R5bGluZyBiaW5kaW5ncyAoYFtzdHlsZS5wcm9wXWAgYW5kIGBbY2xhc3MubmFtZV1gKVxuICpcbiAqIEJvdGggYFtzdHlsZS5wcm9wXWAgYW5kIGBbY2xhc3MubmFtZV1gIGJpbmRpbmdzIGFyZSBydW4gdGhyb3VnaCB0aGUgYHVwZGF0ZVN0eWxlUHJvcGBcbiAqIGFuZCBgdXBkYXRlQ2xhc3NQcm9wYCBmdW5jdGlvbnMgcmVzcGVjdGl2ZWx5LiBUaGV5IHdvcmsgYnkgZXhhbWluaW5nIHRoZSBwcm92aWRlZFxuICogYG9mZnNldGAgdmFsdWUgYW5kIGFyZSBhYmxlIHRvIGxvY2F0ZSB0aGUgZXhhY3Qgc3BvdCBpbiB0aGUgY29udGV4dCB3aGVyZSB0aGVcbiAqIG1hdGNoaW5nIHN0eWxlIGlzIGxvY2F0ZWQuXG4gKlxuICogQm90aCBgW3N0eWxlLnByb3BdYCBhbmQgYFtjbGFzcy5uYW1lXWAgYmluZGluZ3MgYXJlIGFibGUgdG8gcHJvY2VzcyB0aGVzZSB2YWx1ZXNcbiAqIGZyb20gZGlyZWN0aXZlIGhvc3QgYmluZGluZ3MuIFdoZW4gZXZhbHVhdGVkIChmcm9tIHRoZSBob3N0IGJpbmRpbmcgZnVuY3Rpb24pIHRoZVxuICogYGRpcmVjdGl2ZVJlZmAgdmFsdWUgaXMgdGhlbiBwYXNzZWQgaW4uXG4gKlxuICogSWYgdHdvIGRpcmVjdGl2ZXMgb3IgYSBkaXJlY3RpdmUgKyBhIHRlbXBsYXRlIGJpbmRpbmcgYm90aCB3cml0ZSB0byB0aGUgc2FtZSBzdHlsZS9jbGFzc1xuICogYmluZGluZyB0aGVuIHRoZSBzdHlsaW5nIGNvbnRleHQgY29kZSB3aWxsIGRlY2lkZSB3aGljaCBvbmUgd2lucyBiYXNlZCBvbiB0aGUgZm9sbG93aW5nXG4gKiBydWxlOlxuICpcbiAqIDEuIElmIHRoZSB0ZW1wbGF0ZSBiaW5kaW5nIGhhcyBhIHZhbHVlIHRoZW4gaXQgYWx3YXlzIHdpbnNcbiAqIDIuIE90aGVyd2lzZSB3aGljaGV2ZXIgZmlyc3QtcmVnaXN0ZXJlZCBkaXJlY3RpdmUgdGhhdCBoYXMgdGhhdCB2YWx1ZSBmaXJzdCB3aWxsIHdpblxuICpcbiAqIFRoZSBjb2RlIGV4YW1wbGUgaGVscHMgbWFrZSB0aGlzIGNsZWFyOlxuICpcbiAqIGBgYFxuICogPCEtLVxuICogPGRpdiBbc3R5bGUud2lkdGhdPVwibXlXaWR0aFwiXG4gKiAgICAgIFtteS13aWR0aC1kaXJlY3RpdmVdPVwiJzYwMHB4J1wiPlxuICogLS0+XG4gKlxuICogQERpcmVjdGl2ZSh7XG4gKiAgc2VsZWN0b3I6ICdbbXktd2lkdGgtZGlyZWN0aXZlJ11cbiAqIH0pXG4gKiBjbGFzcyBNeVdpZHRoRGlyZWN0aXZlIHtcbiAqICAgQElucHV0KCdteS13aWR0aC1kaXJlY3RpdmUnKVxuICogICBASG9zdEJpbmRpbmcoJ3N0eWxlLndpZHRoJylcbiAqICAgcHVibGljIHdpZHRoID0gbnVsbDtcbiAqIH1cbiAqIGBgYFxuICpcbiAqIFNpbmNlIHRoZXJlIGlzIGEgc3R5bGUgYmluZGluZyBmb3Igd2lkdGggcHJlc2VudCBvbiB0aGUgZWxlbWVudCAoYFtzdHlsZS53aWR0aF1gKSB0aGVuXG4gKiBpdCB3aWxsIGFsd2F5cyB3aW4gb3ZlciB0aGUgd2lkdGggYmluZGluZyB0aGF0IGlzIHByZXNlbnQgYXMgYSBob3N0IGJpbmRpbmcgd2l0aGluXG4gKiB0aGUgYE15V2lkdGhEaXJlY3RpdmVgLiBIb3dldmVyLCBpZiBgW3N0eWxlLndpZHRoXWAgcmVuZGVycyBhcyBgbnVsbGAgKHNvIGBteVdpZHRoPW51bGxgKVxuICogdGhlbiB0aGUgYE15V2lkdGhEaXJlY3RpdmVgIHdpbGwgYmUgYWJsZSB0byB3cml0ZSB0byB0aGUgYHdpZHRoYCBzdHlsZSB3aXRoaW4gdGhlIGNvbnRleHQuXG4gKiBTaW1wbHkgcHV0LCB3aGljaGV2ZXIgZGlyZWN0aXZlIHdyaXRlcyB0byBhIHZhbHVlIGZpcnN0IGVuZHMgdXAgaGF2aW5nIG93bmVyc2hpcCBvZiBpdCBhc1xuICogbG9uZyBhcyB0aGUgdGVtcGxhdGUgZGlkbid0IHNldCBhbnl0aGluZy5cbiAqXG4gKiBUaGUgd2F5IGluIHdoaWNoIHRoZSBvd25lcnNoaXAgaXMgZmFjaWxpdGF0ZWQgaXMgdGhyb3VnaCBpbmRleCB2YWx1ZS4gVGhlIGVhcmxpZXN0IGRpcmVjdGl2ZXNcbiAqIGdldCB0aGUgc21hbGxlc3QgaW5kZXggdmFsdWVzICh3aXRoIDAgYmVpbmcgcmVzZXJ2ZWQgZm9yIHRoZSB0ZW1wbGF0ZSBlbGVtZW50IGJpbmRpbmdzKS4gRWFjaFxuICogdGltZSBhIHZhbHVlIGlzIHdyaXR0ZW4gZnJvbSBhIGRpcmVjdGl2ZSBvciB0aGUgdGVtcGxhdGUgYmluZGluZ3MsIHRoZSB2YWx1ZSBpdHNlbGYgZ2V0c1xuICogYXNzaWduZWQgdGhlIGRpcmVjdGl2ZSBpbmRleCB2YWx1ZSBpbiBpdHMgZGF0YS4gSWYgYW5vdGhlciBkaXJlY3RpdmUgd3JpdGVzIGEgdmFsdWUgYWdhaW4gdGhlblxuICogaXRzIGRpcmVjdGl2ZSBpbmRleCBnZXRzIGNvbXBhcmVkIGFnYWluc3QgdGhlIGRpcmVjdGl2ZSBpbmRleCB0aGF0IGV4aXN0cyBvbiB0aGUgZWxlbWVudC4gT25seVxuICogd2hlbiB0aGUgbmV3IHZhbHVlJ3MgZGlyZWN0aXZlIGluZGV4IGlzIGxlc3MgdGhhbiB0aGUgZXhpc3RpbmcgZGlyZWN0aXZlIGluZGV4IHRoZW4gdGhlIG5ld1xuICogdmFsdWUgd2lsbCBiZSB3cml0dGVuIHRvIHRoZSBjb250ZXh0LiBCdXQsIGlmIHRoZSBleGlzdGluZyB2YWx1ZSBpcyBudWxsIHRoZW4gdGhlIG5ldyB2YWx1ZSBpc1xuICogd3JpdHRlbiBieSB0aGUgbGVzcyBpbXBvcnRhbnQgZGlyZWN0aXZlLlxuICpcbiAqIEVhY2ggZGlyZWN0aXZlIGFsc28gaGFzIGl0cyBvd24gc2FuaXRpemVyIGFuZCBkaXJ0eSBmbGFncy4gVGhlc2UgdmFsdWVzIGFyZSBjb25zdW1lZCB3aXRoaW4gdGhlXG4gKiByZW5kZXJpbmcgZnVuY3Rpb24uXG4gKlxuICpcbiAqICMjIE11bHRpLWxldmVsIHN0eWxpbmcgYmluZGluZ3MgKGBbc3R5bGVdYCBhbmQgYFtjbGFzc11gKVxuICpcbiAqIE11bHRpLWxldmVsIHN0eWxpbmcgYmluZGluZ3MgYXJlIHRyZWF0ZWQgYXMgbGVzcyBpbXBvcnRhbnQgKGxlc3Mgc3BlY2lmaWMpIGFzIHNpbmdsZS1sZXZlbFxuICogYmluZGluZ3MgKHRoaW5ncyBsaWtlIGBbc3R5bGUucHJvcF1gIGFuZCBgW2NsYXNzLm5hbWVdYCkuXG4gKlxuICogTXVsdGktbGV2ZWwgYmluZGluZ3MgYXJlIHN0aWxsIGFwcGxpZWQgdG8gdGhlIGNvbnRleHQgaW4gYSBzaW1pbGFyIHdheSBhcyBhcmUgc2luZ2xlIGxldmVsXG4gKiBiaW5kaW5ncywgYnV0IHRoaXMgcHJvY2VzcyB3b3JrcyBieSBkaWZmaW5nIHRoZSBuZXcgbXVsdGktbGV2ZWwgdmFsdWVzICh3aGljaCBhcmUga2V5L3ZhbHVlXG4gKiBtYXBzKSBhZ2FpbnN0IHRoZSBleGlzdGluZyBzZXQgb2Ygc3R5bGVzIHRoYXQgbGl2ZSBpbiB0aGUgY29udGV4dC4gRWFjaCB0aW1lIGEgbmV3IG1hcCB2YWx1ZVxuICogaXMgZGV0ZWN0ZWQgKHZpYSBpZGVudGl0eSBjaGVjaykgdGhlbiBpdCB3aWxsIGxvb3AgdGhyb3VnaCB0aGUgdmFsdWVzIGFuZCBmaWd1cmUgb3V0IHdoYXRcbiAqIGhhcyBjaGFuZ2VkIGFuZCByZW9yZGVyIHRoZSBjb250ZXh0IGFycmF5IHRvIG1hdGNoIHRoZSBvcmRlcmluZyBvZiB0aGUga2V5cy4gVGhpcyByZW9yZGVyaW5nXG4gKiBvZiB0aGUgY29udGV4dCBtYWtlcyBzdXJlIHRoYXQgZm9sbG93LXVwIHRyYXZlcnNhbHMgb2YgdGhlIGNvbnRleHQgd2hlbiB1cGRhdGVkIGFnYWluc3QgdGhlXG4gKiBrZXkvdmFsdWUgbWFwIGFyZSBhcyBjbG9zZSBhcyBwb3NzaWJsZSB0byBvKG4pICh3aGVyZSBcIm5cIiBpcyB0aGUgc2l6ZSBvZiB0aGUga2V5L3ZhbHVlIG1hcCkuXG4gKlxuICogSWYgYSBgZGlyZWN0aXZlUmVmYCB2YWx1ZSBpcyBwYXNzZWQgaW4gdGhlbiB0aGUgc3R5bGluZyBhbGdvcml0aG0gY29kZSB3aWxsIHRha2UgdGhlIGRpcmVjdGl2ZSdzXG4gKiBwcmlvcml0aXphdGlvbiBpbmRleCBpbnRvIGFjY291bnQgYW5kIHVwZGF0ZSB0aGUgdmFsdWVzIHdpdGggcmVzcGVjdCB0byBtb3JlIGltcG9ydGFudFxuICogZGlyZWN0aXZlcy4gVGhpcyBtZWFucyB0aGF0IGlmIGEgdmFsdWUgc3VjaCBhcyBgd2lkdGhgIGlzIHVwZGF0ZWQgaW4gdHdvIGRpZmZlcmVudCBgW3N0eWxlXWBcbiAqIGJpbmRpbmdzIChzYXkgb25lIG9uIHRoZSB0ZW1wbGF0ZSBhbmQgYW5vdGhlciB3aXRoaW4gYSBkaXJlY3RpdmUgdGhhdCBzaXRzIG9uIHRoZSBzYW1lIGVsZW1lbnQpXG4gKiB0aGVuIHRoZSBhbGdvcml0aG0gd2lsbCBkZWNpZGUgaG93IHRvIHVwZGF0ZSB0aGUgdmFsdWUgYmFzZWQgb24gdGhlIGZvbGxvd2luZyBoZXVyaXN0aWM6XG4gKlxuICogMS4gSWYgdGhlIHRlbXBsYXRlIGJpbmRpbmcgaGFzIGEgdmFsdWUgdGhlbiBpdCBhbHdheXMgd2luc1xuICogMi4gSWYgbm90IHRoZW4gd2hpY2hldmVyIGZpcnN0LXJlZ2lzdGVyZWQgZGlyZWN0aXZlIHRoYXQgaGFzIHRoYXQgdmFsdWUgZmlyc3Qgd2lsbCB3aW5cbiAqXG4gKiBJdCB3aWxsIGFsc28gdXBkYXRlIHRoZSB2YWx1ZSBpZiBpdCB3YXMgc2V0IHRvIGBudWxsYCBieSBhIHByZXZpb3VzIGRpcmVjdGl2ZSAob3IgdGhlIHRlbXBsYXRlKS5cbiAqXG4gKiBFYWNoIHRpbWUgYSB2YWx1ZSBpcyB1cGRhdGVkIChvciByZW1vdmVkKSB0aGVuIHRoZSBjb250ZXh0IHdpbGwgY2hhbmdlIHNoYXBlIHRvIGJldHRlciBtYXRjaFxuICogdGhlIG9yZGVyaW5nIG9mIHRoZSBzdHlsaW5nIGRhdGEgYXMgd2VsbCBhcyB0aGUgb3JkZXJpbmcgb2YgZWFjaCBkaXJlY3RpdmUgdGhhdCBjb250YWlucyBzdHlsaW5nXG4gKiBkYXRhLiAoU2VlIGBwYXRjaFN0eWxpbmdNYXBJbnRvQ29udGV4dGAgaW5zaWRlIG9mIGNsYXNzX2FuZF9zdHlsZV9iaW5kaW5ncy50cyB0byBiZXR0ZXJcbiAqIHVuZGVyc3RhbmQgaG93IHRoaXMgd29ya3MuKVxuICpcbiAqICMjIFJlbmRlcmluZ1xuICogVGhlIHJlbmRlcmluZyBtZWNoYW5pc20gKHdoZW4gdGhlIHN0eWxpbmcgZGF0YSBpcyBhcHBsaWVkIG9uIHNjcmVlbikgb2NjdXJzIHZpYSB0aGVcbiAqIGBlbGVtZW50U3R5bGluZ0FwcGx5YCBmdW5jdGlvbiBhbmQgaXMgZGVzaWduZWQgdG8gcnVuIGFmdGVyICoqYWxsKiogc3R5bGluZyBmdW5jdGlvbnMgaGF2ZSBiZWVuXG4gKiBldmFsdWF0ZWQuIFRoZSByZW5kZXJpbmcgYWxnb3JpdGhtIHdpbGwgbG9vcCBvdmVyIHRoZSBjb250ZXh0IGFuZCBvbmx5IGFwcGx5IHRoZSBzdHlsZXMgdGhhdCBhcmVcbiAqIGZsYWdnZWQgYXMgZGlydHkgKGVpdGhlciBiZWNhdXNlIHRoZXkgYXJlIG5ldywgdXBkYXRlZCBvciBoYXZlIGJlZW4gcmVtb3ZlZCB2aWEgbXVsdGkgb3JcbiAqIHNpbmdsZSBiaW5kaW5ncykuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgU3R5bGluZ0NvbnRleHQgZXh0ZW5kc1xuICAgIEFycmF5PHtba2V5OiBzdHJpbmddOiBhbnl9fG51bWJlcnxzdHJpbmd8Ym9vbGVhbnxSRWxlbWVudHxTdHlsZVNhbml0aXplRm58UGxheWVyQ29udGV4dHxudWxsPiB7XG4gIC8qKlxuICAgKiBMb2NhdGlvbiBvZiBlbGVtZW50IHRoYXQgaXMgdXNlZCBhcyBhIHRhcmdldCBmb3IgdGhpcyBjb250ZXh0LlxuICAgKi9cbiAgW1N0eWxpbmdJbmRleC5FbGVtZW50UG9zaXRpb25dOiBMQ29udGFpbmVyfExWaWV3fFJFbGVtZW50fG51bGw7XG5cbiAgLyoqXG4gICAqIEEgbnVtZXJpYyB2YWx1ZSByZXByZXNlbnRpbmcgdGhlIGNvbmZpZ3VyYXRpb24gc3RhdHVzICh3aGV0aGVyIHRoZSBjb250ZXh0IGlzIGRpcnR5IG9yIG5vdClcbiAgICogbWl4ZWQgdG9nZXRoZXIgKHVzaW5nIGJpdCBzaGlmdGluZykgd2l0aCBhIGluZGV4IHZhbHVlIHdoaWNoIHRlbGxzIHRoZSBzdGFydGluZyBpbmRleCB2YWx1ZVxuICAgKiBvZiB3aGVyZSB0aGUgbXVsdGkgc3R5bGUgZW50cmllcyBiZWdpbi5cbiAgICovXG4gIFtTdHlsaW5nSW5kZXguTWFzdGVyRmxhZ1Bvc2l0aW9uXTogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBMb2NhdGlvbiBvZiB0aGUgY29sbGVjdGlvbiBvZiBkaXJlY3RpdmVzIGZvciB0aGlzIGNvbnRleHRcbiAgICovXG4gIFtTdHlsaW5nSW5kZXguRGlyZWN0aXZlUmVnaXN0cnlQb3NpdGlvbl06IERpcmVjdGl2ZVJlZ2lzdHJ5VmFsdWVzO1xuXG4gIC8qKlxuICAgKiBMb2NhdGlvbiBvZiBhbGwgc3RhdGljIHN0eWxlcyB2YWx1ZXNcbiAgICovXG4gIFtTdHlsaW5nSW5kZXguSW5pdGlhbFN0eWxlVmFsdWVzUG9zaXRpb25dOiBJbml0aWFsU3R5bGluZ1ZhbHVlcztcblxuICAvKipcbiAgICogTG9jYXRpb24gb2YgYWxsIHN0YXRpYyBjbGFzcyB2YWx1ZXNcbiAgICovXG4gIFtTdHlsaW5nSW5kZXguSW5pdGlhbENsYXNzVmFsdWVzUG9zaXRpb25dOiBJbml0aWFsU3R5bGluZ1ZhbHVlcztcblxuICAvKipcbiAgICogQSBudW1lcmljIHZhbHVlIHJlcHJlc2VudGluZyB0aGUgY2xhc3MgaW5kZXggb2Zmc2V0IHZhbHVlLiBXaGVuZXZlciBhIHNpbmdsZSBjbGFzcyBpc1xuICAgKiBhcHBsaWVkICh1c2luZyBgZWxlbWVudENsYXNzUHJvcGApIGl0IHNob3VsZCBoYXZlIGFuIHN0eWxpbmcgaW5kZXggdmFsdWUgdGhhdCBkb2Vzbid0XG4gICAqIG5lZWQgdG8gdGFrZSBpbnRvIGFjY291bnQgYW55IHN0eWxlIHZhbHVlcyB0aGF0IGV4aXN0IGluIHRoZSBjb250ZXh0LlxuICAgKi9cbiAgW1N0eWxpbmdJbmRleC5TaW5nbGVQcm9wT2Zmc2V0UG9zaXRpb25zXTogU2luZ2xlUHJvcE9mZnNldFZhbHVlcztcblxuICAvKipcbiAgICogVGhlIGxhc3QgY2xhc3MgdmFsdWUgdGhhdCB3YXMgaW50ZXJwcmV0ZWQgYnkgZWxlbWVudFN0eWxpbmdNYXAuIFRoaXMgaXMgY2FjaGVkXG4gICAqIFNvIHRoYXQgdGhlIGFsZ29yaXRobSBjYW4gZXhpdCBlYXJseSBpbmNhc2UgdGhlIHZhbHVlIGhhcyBub3QgY2hhbmdlZC5cbiAgICovXG4gIFtTdHlsaW5nSW5kZXguQ2FjaGVkTXVsdGlDbGFzc2VzXTogYW55fE1hcEJhc2VkT2Zmc2V0VmFsdWVzO1xuXG4gIC8qKlxuICAgKiBUaGUgbGFzdCBzdHlsZSB2YWx1ZSB0aGF0IHdhcyBpbnRlcnByZXRlZCBieSBlbGVtZW50U3R5bGluZ01hcC4gVGhpcyBpcyBjYWNoZWRcbiAgICogU28gdGhhdCB0aGUgYWxnb3JpdGhtIGNhbiBleGl0IGVhcmx5IGluY2FzZSB0aGUgdmFsdWUgaGFzIG5vdCBjaGFuZ2VkLlxuICAgKi9cbiAgW1N0eWxpbmdJbmRleC5DYWNoZWRNdWx0aVN0eWxlc106IGFueXxNYXBCYXNlZE9mZnNldFZhbHVlcztcblxuICAvKipcbiAgICogTG9jYXRpb24gb2YgYW5pbWF0aW9uIGNvbnRleHQgKHdoaWNoIGNvbnRhaW5zIHRoZSBhY3RpdmUgcGxheWVycykgZm9yIHRoaXMgZWxlbWVudCBzdHlsaW5nXG4gICAqIGNvbnRleHQuXG4gICAqL1xuICBbU3R5bGluZ0luZGV4LlBsYXllckNvbnRleHRdOiBQbGF5ZXJDb250ZXh0fG51bGw7XG59XG5cbi8qKlxuICogVXNlZCBhcyBhIHN0eWxpbmcgYXJyYXkgdG8gaG91c2Ugc3RhdGljIGNsYXNzIGFuZCBzdHlsZSB2YWx1ZXMgdGhhdCB3ZXJlIGV4dHJhY3RlZFxuICogYnkgdGhlIGNvbXBpbGVyIGFuZCBwbGFjZWQgaW4gdGhlIGFuaW1hdGlvbiBjb250ZXh0IHZpYSBgZWxlbWVudFN0YXJ0YCBhbmRcbiAqIGBlbGVtZW50SG9zdEF0dHJzYC5cbiAqXG4gKiBTZWUgW0luaXRpYWxTdHlsaW5nVmFsdWVzSW5kZXhdIGZvciBhIGJyZWFrZG93biBvZiBob3cgYWxsIHRoaXMgd29ya3MuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgSW5pdGlhbFN0eWxpbmdWYWx1ZXMgZXh0ZW5kcyBBcnJheTxzdHJpbmd8Ym9vbGVhbnxudWxsPiB7XG4gIFtJbml0aWFsU3R5bGluZ1ZhbHVlc0luZGV4LkRlZmF1bHROdWxsVmFsdWVQb3NpdGlvbl06IG51bGw7XG4gIFtJbml0aWFsU3R5bGluZ1ZhbHVlc0luZGV4LkluaXRpYWxDbGFzc2VzU3RyaW5nUG9zaXRpb25dOiBzdHJpbmd8bnVsbDtcbn1cblxuLyoqXG4gKiBVc2VkIGFzIGFuIG9mZnNldC9wb3NpdGlvbiBpbmRleCB0byBmaWd1cmUgb3V0IHdoZXJlIGluaXRpYWwgc3R5bGluZ1xuICogdmFsdWVzIGFyZSBsb2NhdGVkLlxuICpcbiAqIFVzZWQgYXMgYSByZWZlcmVuY2UgcG9pbnQgdG8gcHJvdmlkZSBtYXJrZXJzIHRvIGFsbCBzdGF0aWMgc3R5bGluZ1xuICogdmFsdWVzICh0aGUgaW5pdGlhbCBzdHlsZSBhbmQgY2xhc3MgdmFsdWVzIG9uIGFuIGVsZW1lbnQpIHdpdGhpbiBhblxuICogYXJyYXkgd2l0aGluIHRoZSBgU3R5bGluZ0NvbnRleHRgLiBUaGlzIGFycmF5IGNvbnRhaW5zIGtleS92YWx1ZSBwYWlyc1xuICogd2hlcmUgdGhlIGtleSBpcyB0aGUgc3R5bGUgcHJvcGVydHkgbmFtZSBvciBjbGFzc05hbWUgYW5kIHRoZSB2YWx1ZSBpc1xuICogdGhlIHN0eWxlIHZhbHVlIG9yIHdoZXRoZXIgb3Igbm90IGEgY2xhc3MgaXMgcHJlc2VudCBvbiB0aGUgZWxtZW50LlxuICpcbiAqIFRoZSBmaXJzdCB2YWx1ZSBpcyBhbHdheXMgbnVsbCBzbyB0aGF0IGEgaW5pdGlhbCBpbmRleCB2YWx1ZSBvZlxuICogYDBgIHdpbGwgYWx3YXlzIHBvaW50IHRvIGEgbnVsbCB2YWx1ZS5cbiAqXG4gKiBUaGUgc2Vjb25kIHZhbHVlIGlzIGFsc28gYWx3YXlzIG51bGwgdW5sZXNzIGEgc3RyaW5nLWJhc2VkIHJlcHJlc2VudGF0aW9uXG4gKiBvZiB0aGUgc3R5bGluZyBkYXRhIHdhcyBjb25zdHJ1Y3RlZCAoaXQgZ2V0cyBjYWNoZWQgaW4gdGhpcyBzbG90KS5cbiAqXG4gKiBJZiBhIDxkaXY+IGVsZW1lbnRzIGNvbnRhaW5zIGEgbGlzdCBvZiBzdGF0aWMgc3R5bGluZyB2YWx1ZXMgbGlrZSBzbzpcbiAqXG4gKiA8ZGl2IGNsYXNzPVwiZm9vIGJhciBiYXpcIiBzdHlsZT1cIndpZHRoOjEwMHB4OyBoZWlnaHQ6MjAwcHg7XCI+XG4gKlxuICogVGhlbiB0aGUgaW5pdGlhbCBzdHlsZXMgZm9yIHRoYXQgd2lsbCBsb29rIGxpa2Ugc286XG4gKlxuICogU3R5bGVzOlxuICogYGBgXG4gKiBTdHlsaW5nQ29udGV4dFtJbml0aWFsU3R5bGVzSW5kZXhdID0gW1xuICogICBudWxsLCBudWxsLCAnd2lkdGgnLCAnMTAwcHgnLCBoZWlnaHQsICcyMDBweCdcbiAqIF1cbiAqIGBgYFxuICpcbiAqIENsYXNzZXM6XG4gKiBgYGBcbiAqIFN0eWxpbmdDb250ZXh0W0luaXRpYWxDbGFzc2VzSW5kZXhdID0gW1xuICogICBudWxsLCBudWxsLCAnZm9vJywgdHJ1ZSwgJ2JhcicsIHRydWUsICdiYXonLCB0cnVlXG4gKiBdXG4gKiBgYGBcbiAqXG4gKiBJbml0aWFsIHN0eWxlIGFuZCBjbGFzcyBlbnRyaWVzIGhhdmUgdGhlaXIgb3duIGFycmF5cy4gVGhpcyBpcyBiZWNhdXNlXG4gKiBpdCdzIGVhc2llciB0byBhZGQgdG8gdGhlIGVuZCBvZiBvbmUgYXJyYXkgYW5kIG5vdCB0aGVuIGhhdmUgdG8gdXBkYXRlXG4gKiBldmVyeSBjb250ZXh0IGVudHJpZXMnIHBvaW50ZXIgaW5kZXggdG8gdGhlIG5ld2x5IG9mZnNldGVkIHZhbHVlcy5cbiAqXG4gKiBXaGVuIHByb3BlcnR5IGJpbmRpbmRzIGFyZSBhZGRlZCB0byBhIGNvbnRleHQgdGhlbiBpbml0aWFsIHN0eWxlL2NsYXNzXG4gKiB2YWx1ZXMgd2lsbCBhbHNvIGJlIGluc2VydGVkIGludG8gdGhlIGFycmF5LiBUaGlzIGlzIHRvIGNyZWF0ZSBhIHNwYWNlXG4gKiBpbiB0aGUgc2l0dWF0aW9uIHdoZW4gYSBmb2xsb3ctdXAgZGlyZWN0aXZlIGluc2VydHMgc3RhdGljIHN0eWxpbmcgaW50b1xuICogdGhlIGFycmF5LiBCeSBkZWZhdWx0LCBzdHlsZSB2YWx1ZXMgYXJlIGBudWxsYCBhbmQgY2xhc3MgdmFsdWVzIGFyZVxuICogYGZhbHNlYCB3aGVuIGluc2VydGVkIGJ5IHByb3BlcnR5IGJpbmRpbmdzLlxuICpcbiAqIEZvciBleGFtcGxlOlxuICogYGBgXG4gKiA8ZGl2IGNsYXNzPVwiZm9vIGJhciBiYXpcIlxuICogICAgICBbY2xhc3MuY2FyXT1cIm15Q2FyRXhwXCJcbiAqICAgICAgc3R5bGU9XCJ3aWR0aDoxMDBweDsgaGVpZ2h0OjIwMHB4O1wiXG4gKiAgICAgIFtzdHlsZS5vcGFjaXR5XT1cIm15T3BhY2l0eUV4cFwiPlxuICogYGBgXG4gKlxuICogV2lsbCBjb25zdHJ1Y3QgaW5pdGlhbCBzdHlsaW5nIHZhbHVlcyB0aGF0IGxvb2sgbGlrZTpcbiAqXG4gKiBTdHlsZXM6XG4gKiBgYGBcbiAqIFN0eWxpbmdDb250ZXh0W0luaXRpYWxTdHlsZXNJbmRleF0gPSBbXG4gKiAgIG51bGwsIG51bGwsICd3aWR0aCcsICcxMDBweCcsIGhlaWdodCwgJzIwMHB4JywgJ29wYWNpdHknLCBudWxsXG4gKiBdXG4gKiBgYGBcbiAqXG4gKiBDbGFzc2VzOlxuICogYGBgXG4gKiBTdHlsaW5nQ29udGV4dFtJbml0aWFsQ2xhc3Nlc0luZGV4XSA9IFtcbiAqICAgbnVsbCwgbnVsbCwgJ2ZvbycsIHRydWUsICdiYXInLCB0cnVlLCAnYmF6JywgdHJ1ZSwgJ2NhcicsIGZhbHNlXG4gKiBdXG4gKiBgYGBcbiAqXG4gKiBOb3cgaWYgYSBkaXJlY3RpdmUgY29tZXMgYWxvbmcgYW5kIGludHJvZHVjZXMgYGNhcmAgYXMgYSBzdGF0aWNcbiAqIGNsYXNzIHZhbHVlIG9yIGBvcGFjaXR5YCB0aGVuIHRob3NlIHZhbHVlcyB3aWxsIGJlIGZpbGxlZCBpbnRvXG4gKiB0aGUgaW5pdGlhbCBzdHlsZXMgYXJyYXkuXG4gKlxuICogRm9yIGV4YW1wbGU6XG4gKlxuICogYGBgXG4gKiBARGlyZWN0aXZlKHtcbiAqICAgc2VsZWN0b3I6ICdvcGFjaXR5LWNhci1kaXJlY3RpdmUnLFxuICogICBob3N0OiB7XG4gKiAgICAgJ3N0eWxlJzogJ29wYWNpdHk6MC41JyxcbiAqICAgICAnY2xhc3MnOiAnY2FyJ1xuICogICB9XG4gKiB9KVxuICogY2xhc3MgT3BhY2l0eUNhckRpcmVjdGl2ZSB7fVxuICogYGBgXG4gKlxuICogVGhpcyB3aWxsIHJlbmRlciBpdHNlbGYgYXM6XG4gKlxuICogU3R5bGVzOlxuICogYGBgXG4gKiBTdHlsaW5nQ29udGV4dFtJbml0aWFsU3R5bGVzSW5kZXhdID0gW1xuICogICBudWxsLCBudWxsLCAnd2lkdGgnLCAnMTAwcHgnLCBoZWlnaHQsICcyMDBweCcsICdvcGFjaXR5JywgJzAuNSdcbiAqIF1cbiAqIGBgYFxuICpcbiAqIENsYXNzZXM6XG4gKiBgYGBcbiAqIFN0eWxpbmdDb250ZXh0W0luaXRpYWxDbGFzc2VzSW5kZXhdID0gW1xuICogICBudWxsLCBudWxsLCAnZm9vJywgdHJ1ZSwgJ2JhcicsIHRydWUsICdiYXonLCB0cnVlLCAnY2FyJywgdHJ1ZVxuICogXVxuICogYGBgXG4gKi9cbmV4cG9ydCBjb25zdCBlbnVtIEluaXRpYWxTdHlsaW5nVmFsdWVzSW5kZXgge1xuICBEZWZhdWx0TnVsbFZhbHVlUG9zaXRpb24gPSAwLFxuICBJbml0aWFsQ2xhc3Nlc1N0cmluZ1Bvc2l0aW9uID0gMSxcbiAgS2V5VmFsdWVTdGFydFBvc2l0aW9uID0gMixcbiAgUHJvcE9mZnNldCA9IDAsXG4gIFZhbHVlT2Zmc2V0ID0gMSxcbiAgU2l6ZSA9IDJcbn1cblxuLyoqXG4gKiBBbiBhcnJheSBsb2NhdGVkIGluIHRoZSBTdHlsaW5nQ29udGV4dCB0aGF0IGhvdXNlcyBhbGwgZGlyZWN0aXZlIGluc3RhbmNlcyBhbmQgYWRkaXRpb25hbFxuICogZGF0YSBhYm91dCB0aGVtLlxuICpcbiAqIEVhY2ggZW50cnkgaW4gdGhpcyBhcnJheSByZXByZXNlbnRzIGEgc291cmNlIG9mIHdoZXJlIHN0eWxlL2NsYXNzIGJpbmRpbmcgdmFsdWVzIGNvdWxkXG4gKiBjb21lIGZyb20uIEJ5IGRlZmF1bHQsIHRoZXJlIGlzIGFsd2F5cyBhdCBsZWFzdCBvbmUgZGlyZWN0aXZlIGhlcmUgd2l0aCBhIG51bGwgdmFsdWUgYW5kXG4gKiB0aGF0IHJlcHJlc2VudHMgYmluZGluZ3MgdGhhdCBsaXZlIGRpcmVjdGx5IG9uIGFuIGVsZW1lbnQgaW4gdGhlIHRlbXBsYXRlIChub3QgaG9zdCBiaW5kaW5ncykuXG4gKlxuICogRWFjaCBzdWNjZXNzaXZlIGVudHJ5IGluIHRoZSBhcnJheSBpcyBhbiBhY3R1YWwgaW5zdGFuY2Ugb2YgYSBkaXJlY3RpdmUgYXMgd2VsbCBhcyBzb21lXG4gKiBhZGRpdGlvbmFsIGluZm8gYWJvdXQgdGhhdCBlbnRyeS5cbiAqXG4gKiBBbiBlbnRyeSB3aXRoaW4gdGhpcyBhcnJheSBoYXMgdGhlIGZvbGxvd2luZyB2YWx1ZXM6XG4gKiBbMF0gPSBUaGUgaW5zdGFuY2Ugb2YgdGhlIGRpcmVjdGl2ZSAodGhlIGZpcnN0IGVudHJ5IGlzIG51bGwgYmVjYXVzZSBpdHMgcmVzZXJ2ZWQgZm9yIHRoZVxuICogICAgICAgdGVtcGxhdGUpXG4gKiBbMV0gPSBUaGUgcG9pbnRlciB0aGF0IHRlbGxzIHdoZXJlIHRoZSBzaW5nbGUgc3R5bGluZyAoc3R1ZmYgbGlrZSBbY2xhc3MuZm9vXSBhbmQgW3N0eWxlLnByb3BdKVxuICogICAgICAgb2Zmc2V0IHZhbHVlcyBhcmUgbG9jYXRlZC4gVGhpcyB2YWx1ZSB3aWxsIGFsbG93IGZvciBhIGJpbmRpbmcgaW5zdHJ1Y3Rpb24gdG8gZmluZCBleGFjdGx5XG4gKiAgICAgICB3aGVyZSBhIHN0eWxlIGlzIGxvY2F0ZWQuXG4gKiBbMl0gPSBXaGV0aGVyIG9yIG5vdCB0aGUgZGlyZWN0aXZlIGhhcyBhbnkgc3R5bGluZyB2YWx1ZXMgdGhhdCBhcmUgZGlydHkuIFRoaXMgaXMgdXNlZCBhc1xuICogICAgICAgcmVmZXJlbmNlIHdpdGhpbiB0aGUgYHJlbmRlclN0eWxpbmdgIGZ1bmN0aW9uIHRvIGRlY2lkZSB3aGV0aGVyIHRvIHNraXAgaXRlcmF0aW5nXG4gKiAgICAgICB0aHJvdWdoIHRoZSBjb250ZXh0IHdoZW4gcmVuZGVyaW5nIGlzIGV4ZWN1dGVkLlxuICogWzNdID0gVGhlIHN0eWxlU2FuaXRpemVyIGluc3RhbmNlIHRoYXQgaXMgYXNzaWduZWQgdG8gdGhlIGRpcmVjdGl2ZS4gQWx0aG91Z2ggaXQncyB1bmxpa2VseSxcbiAqICAgICAgIGEgZGlyZWN0aXZlIGNvdWxkIGludHJvZHVjZSBpdHMgb3duIHNwZWNpYWwgc3R5bGUgc2FuaXRpemVyIGFuZCBmb3IgdGhpcyByZWFjaCBlYWNoXG4gKiAgICAgICBkaXJlY3RpdmUgd2lsbCBnZXQgaXRzIG93biBzcGFjZSBmb3IgaXQgKGlmIG51bGwgdGhlbiB0aGUgdmVyeSBmaXJzdCBzYW5pdGl6ZXIgaXMgdXNlZCkuXG4gKlxuICogRWFjaCB0aW1lIGEgbmV3IGRpcmVjdGl2ZSBpcyBhZGRlZCBpdCB3aWxsIGluc2VydCB0aGVzZSBmb3VyIHZhbHVlcyBhdCB0aGUgZW5kIG9mIHRoZSBhcnJheS5cbiAqIFdoZW4gdGhpcyBhcnJheSBpcyBleGFtaW5lZCB0aGVuIHRoZSByZXN1bHRpbmcgZGlyZWN0aXZlSW5kZXggd2lsbCBiZSByZXNvbHZlZCBieSBkaXZpZGluZyB0aGVcbiAqIGluZGV4IHZhbHVlIGJ5IHRoZSBzaXplIG9mIHRoZSBhcnJheSBlbnRyaWVzIChzbyBpZiBEaXJBIGlzIGF0IHNwb3QgOCB0aGVuIGl0cyBpbmRleCB3aWxsIGJlIDIpLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIERpcmVjdGl2ZVJlZ2lzdHJ5VmFsdWVzIGV4dGVuZHMgQXJyYXk8bnVsbHx7fXxib29sZWFufG51bWJlcnxTdHlsZVNhbml0aXplRm4+IHtcbiAgW0RpcmVjdGl2ZVJlZ2lzdHJ5VmFsdWVzSW5kZXguRGlyZWN0aXZlVmFsdWVPZmZzZXRdOiBudWxsO1xuICBbRGlyZWN0aXZlUmVnaXN0cnlWYWx1ZXNJbmRleC5TaW5nbGVQcm9wVmFsdWVzSW5kZXhPZmZzZXRdOiBudW1iZXI7XG4gIFtEaXJlY3RpdmVSZWdpc3RyeVZhbHVlc0luZGV4LkRpcnR5RmxhZ09mZnNldF06IGJvb2xlYW47XG4gIFtEaXJlY3RpdmVSZWdpc3RyeVZhbHVlc0luZGV4LlN0eWxlU2FuaXRpemVyT2Zmc2V0XTogU3R5bGVTYW5pdGl6ZUZufG51bGw7XG59XG5cbi8qKlxuICogQW4gZW51bSB0aGF0IG91dGxpbmVzIHRoZSBvZmZzZXQvcG9zaXRpb24gdmFsdWVzIGZvciBlYWNoIGRpcmVjdGl2ZSBlbnRyeSBhbmQgaXRzIGRhdGFcbiAqIHRoYXQgYXJlIGhvdXNlZCBpbnNpZGUgb2YgW0RpcmVjdGl2ZVJlZ2lzdHJ5VmFsdWVzXS5cbiAqL1xuZXhwb3J0IGNvbnN0IGVudW0gRGlyZWN0aXZlUmVnaXN0cnlWYWx1ZXNJbmRleCB7XG4gIERpcmVjdGl2ZVZhbHVlT2Zmc2V0ID0gMCxcbiAgU2luZ2xlUHJvcFZhbHVlc0luZGV4T2Zmc2V0ID0gMSxcbiAgRGlydHlGbGFnT2Zmc2V0ID0gMixcbiAgU3R5bGVTYW5pdGl6ZXJPZmZzZXQgPSAzLFxuICBTaXplID0gNFxufVxuXG4vKipcbiAqIEFuIGFycmF5IHRoYXQgY29udGFpbnMgdGhlIGluZGV4IHBvaW50ZXIgdmFsdWVzIGZvciBldmVyeSBzaW5nbGUgc3R5bGluZyBwcm9wZXJ0eVxuICogdGhhdCBleGlzdHMgaW4gdGhlIGNvbnRleHQgYW5kIGZvciBldmVyeSBkaXJlY3RpdmUuIEl0IGFsc28gY29udGFpbnMgdGhlIHRvdGFsXG4gKiBzaW5nbGUgc3R5bGVzIGFuZCBzaW5nbGUgY2xhc3NlcyB0aGF0IGV4aXN0cyBpbiB0aGUgY29udGV4dCBhcyB0aGUgZmlyc3QgdHdvIHZhbHVlcy5cbiAqXG4gKiBMZXQncyBzYXkgd2UgaGF2ZSB0aGUgZm9sbG93aW5nIHRlbXBsYXRlIGNvZGU6XG4gKlxuICogPGRpdiBbc3R5bGUud2lkdGhdPVwibXlXaWR0aFwiXG4gKiAgICAgIFtzdHlsZS5oZWlnaHRdPVwibXlIZWlnaHRcIlxuICogICAgICBbY2xhc3MuZmxpcHBlZF09XCJmbGlwQ2xhc3NcIlxuICogICAgICBkaXJlY3RpdmUtd2l0aC1vcGFjaXR5PlxuICogICAgICBkaXJlY3RpdmUtd2l0aC1mb28tYmFyLWNsYXNzZXM+XG4gKlxuICogV2UgaGF2ZSB0d28gZGlyZWN0aXZlIGFuZCB0ZW1wbGF0ZS1iaW5kaW5nIHNvdXJjZXMsXG4gKiAyICsgMSBzdHlsZXMgYW5kIDEgKyAxIGNsYXNzZXMuIFdoZW4gdGhlIGJpbmRpbmdzIGFyZVxuICogcmVnaXN0ZXJlZCB0aGUgU2luZ2xlUHJvcE9mZnNldHMgYXJyYXkgd2lsbCBsb29rIGxpa2Ugc286XG4gKlxuICogc18wL2NfMCA9IHRlbXBsYXRlIGRpcmVjdGl2ZSB2YWx1ZVxuICogc18xL2NfMSA9IGRpcmVjdGl2ZSBvbmUgKGRpcmVjdGl2ZS13aXRoLW9wYWNpdHkpXG4gKiBzXzIvY18yID0gZGlyZWN0aXZlIHR3byAoZGlyZWN0aXZlLXdpdGgtZm9vLWJhci1jbGFzc2VzKVxuICpcbiAqIFszLCAyLCAyLCAxLCBzXzAwLCBzMDEsIGNfMDEsIDEsIDAsIHNfMTAsIDAsIDEsIGNfMjBcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBTaW5nbGVQcm9wT2Zmc2V0VmFsdWVzIGV4dGVuZHMgQXJyYXk8bnVtYmVyPiB7XG4gIFtTaW5nbGVQcm9wT2Zmc2V0VmFsdWVzSW5kZXguU3R5bGVzQ291bnRQb3NpdGlvbl06IG51bWJlcjtcbiAgW1NpbmdsZVByb3BPZmZzZXRWYWx1ZXNJbmRleC5DbGFzc2VzQ291bnRQb3NpdGlvbl06IG51bWJlcjtcbn1cblxuLyoqXG4gKiBBbiBlbnVtIHRoYXQgb3V0bGluZXMgdGhlIG9mZnNldC9wb3NpdGlvbiB2YWx1ZXMgZm9yIGVhY2ggc2luZ2xlIHByb3AvY2xhc3MgZW50cnlcbiAqIHRoYXQgYXJlIGhvdXNlZCBpbnNpZGUgb2YgW1NpbmdsZVByb3BPZmZzZXRWYWx1ZXNdLlxuICovXG5leHBvcnQgY29uc3QgZW51bSBTaW5nbGVQcm9wT2Zmc2V0VmFsdWVzSW5kZXgge1xuICBTdHlsZXNDb3VudFBvc2l0aW9uID0gMCxcbiAgQ2xhc3Nlc0NvdW50UG9zaXRpb24gPSAxLFxuICBWYWx1ZVN0YXJ0UG9zaXRpb24gPSAyXG59XG5cbi8qKlxuICogVXNlZCBhIHJlZmVyZW5jZSBmb3IgYWxsIG11bHRpIHN0eWxpbmcgdmFsdWVzICh2YWx1ZXMgdGhhdCBhcmUgYXNzaWduZWQgdmlhIHRoZVxuICogYFtzdHlsZV1gIGFuZCBgW2NsYXNzXWAgYmluZGluZ3MpLlxuICpcbiAqIFNpbmdsZS1zdHlsaW5nIHByb3BlcnRpZXMgKHRoaW5ncyBzZXQgdmlhIGBbc3R5bGUucHJvcF1gIGFuZCBgW2NsYXNzLm5hbWVdYCBiaW5kaW5ncylcbiAqIGFyZSBub3QgaGFuZGxlZCB1c2luZyB0aGUgc2FtZSBhcHByb2FjaCBhcyBtdWx0aS1zdHlsaW5nIGJpbmRpbmdzIChzdWNoIGFzIGBbc3R5bGVdYFxuICogYFtjbGFzc11gIGJpbmRpbmdzKS5cbiAqXG4gKiBNdWx0aS1zdHlsaW5nIGJpbmRpbmdzIHJlbHkgb24gYSBkaWZmaW5nIGFsZ29yaXRobSB0byBmaWd1cmUgb3V0IHdoYXQgcHJvcGVydGllcyBoYXZlIGJlZW4gYWRkZWQsXG4gKiByZW1vdmVkIGFuZCBtb2RpZmllZC4gTXVsdGktc3R5bGluZyBwcm9wZXJ0aWVzIGFyZSBhbHNvIGV2YWx1YXRlZCBhY3Jvc3MgZGlyZWN0aXZlcy0td2hpY2ggbWVhbnNcbiAqIHRoYXQgQW5ndWxhciBzdXBwb3J0cyBoYXZpbmcgbXVsdGlwbGUgZGlyZWN0aXZlcyBhbGwgd3JpdGUgdG8gdGhlIHNhbWUgYFtzdHlsZV1gIGFuZCBgW2NsYXNzXWBcbiAqIGJpbmRpbmdzICh1c2luZyBob3N0IGJpbmRpbmdzKSBldmVuIGlmIHRoZSBgW3N0eWxlXWAgYW5kL29yIGBbY2xhc3NdYCBiaW5kaW5ncyBhcmUgYmVpbmcgd3JpdHRlblxuICogdG8gb24gdGhlIHRlbXBsYXRlIGVsZW1lbnQuXG4gKlxuICogQWxsIG11bHRpLXN0eWxpbmcgdmFsdWVzIHRoYXQgYXJlIHdyaXR0ZW4gdG8gYW4gZWxlbWVudCAod2hldGhlciBpdCBiZSBmcm9tIHRoZSB0ZW1wbGF0ZSBvciBhbnlcbiAqIGRpcmVjdGl2ZXMgYXR0YWNoZWQgdG8gdGhlIGVsZW1lbnQpIGFyZSBhbGwgd3JpdHRlbiBpbnRvIHRoZSBgTWFwQmFzZWRPZmZzZXRWYWx1ZXNgIGFycmF5LiAoTm90ZVxuICogdGhhdCB0aGVyZSBhcmUgdHdvIGFycmF5czogb25lIGZvciBzdHlsZXMgYW5kIGFub3RoZXIgZm9yIGNsYXNzZXMuKVxuICpcbiAqIFRoaXMgYXJyYXkgaXMgc2hhcGVkIGluIHRoZSBmb2xsb3dpbmcgd2F5OlxuICpcbiAqIFswXSAgPSBUaGUgdG90YWwgYW1vdW50IG9mIHVuaXF1ZSBtdWx0aS1zdHlsZSBvciBtdWx0aS1jbGFzcyBlbnRyaWVzIHRoYXQgZXhpc3QgY3VycmVudGx5IGluIHRoZVxuICogICAgICAgIGNvbnRleHQuXG4gKiBbMStdID0gQ29udGFpbnMgYW4gZW50cnkgb2YgZm91ciB2YWx1ZXMgLi4uIEVhY2ggZW50cnkgaXMgYSB2YWx1ZSBhc3NpZ25lZCBieSBhXG4gKiBgW3N0eWxlXWAvYFtjbGFzc11gXG4gKiAgICAgICAgYmluZGluZyAod2UgY2FsbCB0aGlzIGEgKipzb3VyY2UqKikuXG4gKlxuICogICAgICAgIEFuIGV4YW1wbGUgZW50cnkgbG9va3MgbGlrZSBzbyAoYXQgYSBnaXZlbiBgaWAgaW5kZXgpOlxuICogICAgICAgIFtpICsgMF0gPSBXaGV0aGVyIG9yIG5vdCB0aGUgdmFsdWUgaXMgZGlydHlcbiAqXG4gKiAgICAgICAgW2kgKyAxXSA9IFRoZSBpbmRleCBvZiB3aGVyZSB0aGUgbWFwLWJhc2VkIHZhbHVlc1xuICogICAgICAgICAgICAgICAgICAoZm9yIHRoaXMgKipzb3VyY2UqKikgc3RhcnQgd2l0aGluIHRoZSBjb250ZXh0XG4gKlxuICogICAgICAgIFtpICsgMl0gPSBUaGUgdW50b3VjaGVkLCBsYXN0IHNldCB2YWx1ZSBvZiB0aGUgYmluZGluZ1xuICpcbiAqICAgICAgICBbaSArIDNdID0gVGhlIHRvdGFsIGFtb3VudCBvZiB1bnFpdWUgYmluZGluZyB2YWx1ZXMgdGhhdCB3ZXJlXG4gKiAgICAgICAgICAgICAgICAgIGV4dHJhY3RlZCBhbmQgc2V0IGludG8gdGhlIGNvbnRleHQuIChOb3RlIHRoYXQgdGhpcyB2YWx1ZSBkb2VzXG4gKiAgICAgICAgICAgICAgICAgIG5vdCByZWZsZWN0IHRoZSB0b3RhbCBhbW91bnQgb2YgdmFsdWVzIHdpdGhpbiB0aGUgYmluZGluZ1xuICogICAgICAgICAgICAgICAgICB2YWx1ZSAoc2luY2UgaXQncyBhIG1hcCksIGJ1dCBpbnN0ZWFkIHJlZmxlY3RzIHRoZSB0b3RhbCB2YWx1ZXNcbiAqICAgICAgICAgICAgICAgICAgdGhhdCB3ZXJlIG5vdCB1c2VkIGJ5IGFub3RoZXIgZGlyZWN0aXZlKS5cbiAqXG4gKiBFYWNoIHRpbWUgYSBkaXJlY3RpdmUgKG9yIHRlbXBsYXRlKSB3cml0ZXMgYSB2YWx1ZSB0byBhIGBbY2xhc3NdYC9gW3N0eWxlXWAgYmluZGluZyB0aGVuIHRoZVxuICogc3R5bGluZyBkaWZmaW5nIGFsZ29yaXRobSBjb2RlIHdpbGwgZGVjaWRlIHdoZXRoZXIgb3Igbm90IHRvIHVwZGF0ZSB0aGUgdmFsdWUgYmFzZWQgb24gdGhlXG4gKiBmb2xsb3dpbmcgcnVsZXM6XG4gKlxuICogMS4gSWYgYSBtb3JlIGltcG9ydGFudCBkaXJlY3RpdmUgKGVpdGhlciB0aGUgdGVtcGxhdGUgb3IgYSBkaXJlY3RpdmUgdGhhdCB3YXMgcmVnaXN0ZXJlZFxuICogICAgYmVmb3JlaGFuZCkgaGFzIHdyaXR0ZW4gYSBzcGVjaWZpYyBzdHlsaW5nIHZhbHVlIGludG8gdGhlIGNvbnRleHQgdGhlbiBhbnkgZm9sbG93LXVwIHN0eWxpbmdcbiAqICAgIHZhbHVlcyAoc2V0IGJ5IGFub3RoZXIgZGlyZWN0aXZlIHZpYSBpdHMgYFtzdHlsZV1gIGFuZC9vciBgW2NsYXNzXWAgaG9zdCBiaW5kaW5nKSB3aWxsIG5vdCBiZVxuICogICAgYWJsZSB0byBzZXQgaXQuIFRoaXMgaXMgYmVjYXVzZSB0aGUgZm9ybWVyIGRpcmVjdGl2ZSBoYXMgcHJpb3J0eS5cbiAqIDIuIE9ubHkgaWYgYSBmb3JtZXIgZGlyZWN0aXZlIGhhcyBzZXQgYSBzcGVjaWZpYyBzdHlsaW5nIHZhbHVlIHRvIG51bGwgKHdoZXRoZXIgYnkgYWN0dWFsbHlcbiAqICAgIHNldHRpbmcgaXQgdG8gbnVsbCBvciBub3QgaW5jbHVkaW5nIGl0IGluIGlzIG1hcCB2YWx1ZSkgdGhlbiBhIGxlc3MgaW1wb3JhdGFudCBkaXJlY3RpdmUgY2FuXG4gKiAgICBzZXQgaXRzIG93biB2YWx1ZS5cbiAqXG4gKiAjIyBIb3cgdGhlIG1hcC1iYXNlZCBzdHlsaW5nIGFsZ29yaXRobSB1cGRhdGVzIGl0c2VsZlxuICovXG5leHBvcnQgaW50ZXJmYWNlIE1hcEJhc2VkT2Zmc2V0VmFsdWVzIGV4dGVuZHMgQXJyYXk8YW55PiB7XG4gIFtNYXBCYXNlZE9mZnNldFZhbHVlc0luZGV4LkVudHJpZXNDb3VudFBvc2l0aW9uXTogbnVtYmVyO1xufVxuXG5leHBvcnQgY29uc3QgZW51bSBNYXBCYXNlZE9mZnNldFZhbHVlc0luZGV4IHtcbiAgRW50cmllc0NvdW50UG9zaXRpb24gPSAwLFxuICBWYWx1ZXNTdGFydFBvc2l0aW9uID0gMSxcbiAgRGlydHlGbGFnT2Zmc2V0ID0gMCxcbiAgUG9zaXRpb25TdGFydE9mZnNldCA9IDEsXG4gIFZhbHVlT2Zmc2V0ID0gMixcbiAgVmFsdWVDb3VudE9mZnNldCA9IDMsXG4gIFNpemUgPSA0XG59XG5cbi8qKlxuICogVXNlZCB0byBzZXQgdGhlIGNvbnRleHQgdG8gYmUgZGlydHkgb3Igbm90IGJvdGggb24gdGhlIG1hc3RlciBmbGFnIChwb3NpdGlvbiAxKVxuICogb3IgZm9yIGVhY2ggc2luZ2xlL211bHRpIHByb3BlcnR5IHRoYXQgZXhpc3RzIGluIHRoZSBjb250ZXh0LlxuICovXG5leHBvcnQgY29uc3QgZW51bSBTdHlsaW5nRmxhZ3Mge1xuICAvLyBJbXBsaWVzIG5vIGNvbmZpZ3VyYXRpb25zXG4gIE5vbmUgPSAwYjAwMDAwLFxuICAvLyBXaGV0aGVyIG9yIG5vdCB0aGUgZW50cnkgb3IgY29udGV4dCBpdHNlbGYgaXMgZGlydHlcbiAgRGlydHkgPSAwYjAwMDAxLFxuICAvLyBXaGV0aGVyIG9yIG5vdCB0aGlzIGlzIGEgY2xhc3MtYmFzZWQgYXNzaWdubWVudFxuICBDbGFzcyA9IDBiMDAwMTAsXG4gIC8vIFdoZXRoZXIgb3Igbm90IGEgc2FuaXRpemVyIHdhcyBhcHBsaWVkIHRvIHRoaXMgcHJvcGVydHlcbiAgU2FuaXRpemUgPSAwYjAwMTAwLFxuICAvLyBXaGV0aGVyIG9yIG5vdCBhbnkgcGxheWVyIGJ1aWxkZXJzIHdpdGhpbiBuZWVkIHRvIHByb2R1Y2UgbmV3IHBsYXllcnNcbiAgUGxheWVyQnVpbGRlcnNEaXJ0eSA9IDBiMDEwMDAsXG4gIC8vIFRoZSBtYXggYW1vdW50IG9mIGJpdHMgdXNlZCB0byByZXByZXNlbnQgdGhlc2UgY29uZmlndXJhdGlvbiB2YWx1ZXNcbiAgQmluZGluZ0FsbG9jYXRpb25Mb2NrZWQgPSAwYjEwMDAwLFxuICBCaXRDb3VudFNpemUgPSA1LFxuICAvLyBUaGVyZSBhcmUgb25seSBmaXZlIGJpdHMgaGVyZVxuICBCaXRNYXNrID0gMGIxMTExMVxufVxuXG4vKiogVXNlZCBhcyBudW1lcmljIHBvaW50ZXIgdmFsdWVzIHRvIGRldGVybWluZSB3aGF0IGNlbGxzIHRvIHVwZGF0ZSBpbiB0aGUgYFN0eWxpbmdDb250ZXh0YCAqL1xuZXhwb3J0IGNvbnN0IGVudW0gU3R5bGluZ0luZGV4IHtcbiAgLy8gUG9zaXRpb24gb2Ygd2hlcmUgdGhlIGluaXRpYWwgc3R5bGVzIGFyZSBzdG9yZWQgaW4gdGhlIHN0eWxpbmcgY29udGV4dFxuICAvLyBUaGlzIGluZGV4IG11c3QgYWxpZ24gd2l0aCBIT1NULCBzZWUgaW50ZXJmYWNlcy92aWV3LnRzXG4gIEVsZW1lbnRQb3NpdGlvbiA9IDAsXG4gIC8vIEluZGV4IG9mIGxvY2F0aW9uIHdoZXJlIHRoZSBzdGFydCBvZiBzaW5nbGUgcHJvcGVydGllcyBhcmUgc3RvcmVkLiAoYHVwZGF0ZVN0eWxlUHJvcGApXG4gIE1hc3RlckZsYWdQb3NpdGlvbiA9IDEsXG4gIC8vIFBvc2l0aW9uIG9mIHdoZXJlIHRoZSByZWdpc3RlcmVkIGRpcmVjdGl2ZXMgZXhpc3QgZm9yIHRoaXMgc3R5bGluZyBjb250ZXh0XG4gIERpcmVjdGl2ZVJlZ2lzdHJ5UG9zaXRpb24gPSAyLFxuICAvLyBQb3NpdGlvbiBvZiB3aGVyZSB0aGUgaW5pdGlhbCBzdHlsZXMgYXJlIHN0b3JlZCBpbiB0aGUgc3R5bGluZyBjb250ZXh0XG4gIEluaXRpYWxTdHlsZVZhbHVlc1Bvc2l0aW9uID0gMyxcbiAgSW5pdGlhbENsYXNzVmFsdWVzUG9zaXRpb24gPSA0LFxuICAvLyBJbmRleCBvZiBsb2NhdGlvbiB3aGVyZSB0aGUgY2xhc3MgaW5kZXggb2Zmc2V0IHZhbHVlIGlzIGxvY2F0ZWRcbiAgU2luZ2xlUHJvcE9mZnNldFBvc2l0aW9ucyA9IDUsXG4gIC8vIFBvc2l0aW9uIG9mIHdoZXJlIHRoZSBsYXN0IHN0cmluZy1iYXNlZCBDU1MgY2xhc3MgdmFsdWUgd2FzIHN0b3JlZCAob3IgYSBjYWNoZWQgdmVyc2lvbiBvZiB0aGVcbiAgLy8gaW5pdGlhbCBzdHlsZXMgd2hlbiBhIFtjbGFzc10gZGlyZWN0aXZlIGlzIHByZXNlbnQpXG4gIENhY2hlZE11bHRpQ2xhc3NlcyA9IDYsXG4gIC8vIFBvc2l0aW9uIG9mIHdoZXJlIHRoZSBsYXN0IHN0cmluZy1iYXNlZCBDU1MgY2xhc3MgdmFsdWUgd2FzIHN0b3JlZFxuICBDYWNoZWRNdWx0aVN0eWxlcyA9IDcsXG4gIC8vIE11bHRpIGFuZCBzaW5nbGUgZW50cmllcyBhcmUgc3RvcmVkIGluIGBTdHlsaW5nQ29udGV4dGAgYXM6IEZsYWc7IFByb3BlcnR5TmFtZTsgIFByb3BlcnR5VmFsdWVcbiAgLy8gUG9zaXRpb24gb2Ygd2hlcmUgdGhlIGluaXRpYWwgc3R5bGVzIGFyZSBzdG9yZWQgaW4gdGhlIHN0eWxpbmcgY29udGV4dFxuICBQbGF5ZXJDb250ZXh0ID0gOCxcbiAgLy8gTG9jYXRpb24gb2Ygc2luZ2xlIChwcm9wKSB2YWx1ZSBlbnRyaWVzIGFyZSBzdG9yZWQgd2l0aGluIHRoZSBjb250ZXh0XG4gIFNpbmdsZVN0eWxlc1N0YXJ0UG9zaXRpb24gPSA5LFxuICBGbGFnc09mZnNldCA9IDAsXG4gIFByb3BlcnR5T2Zmc2V0ID0gMSxcbiAgVmFsdWVPZmZzZXQgPSAyLFxuICBQbGF5ZXJCdWlsZGVySW5kZXhPZmZzZXQgPSAzLFxuICAvLyBTaXplIG9mIGVhY2ggbXVsdGkgb3Igc2luZ2xlIGVudHJ5IChmbGFnICsgcHJvcCArIHZhbHVlICsgcGxheWVyQnVpbGRlckluZGV4KVxuICBTaXplID0gNCxcbiAgLy8gRWFjaCBmbGFnIGhhcyBhIGJpbmFyeSBkaWdpdCBsZW5ndGggb2YgdGhpcyB2YWx1ZVxuICBCaXRDb3VudFNpemUgPSAxNCwgIC8vICgzMiAtIDQpIC8gMiA9IH4xNFxuICAvLyBUaGUgYmluYXJ5IGRpZ2l0IHZhbHVlIGFzIGEgbWFza1xuICBCaXRNYXNrID0gMGIxMTExMTExMTExMTExMSwgIC8vIDE0IGJpdHNcbn1cblxuLyoqXG4gKiBBbiBlbnVtIHRoYXQgb3V0bGluZXMgdGhlIGJpdCBmbGFnIGRhdGEgZm9yIGRpcmVjdGl2ZSBvd25lciBhbmQgcGxheWVyIGluZGV4XG4gKiB2YWx1ZXMgdGhhdCBleGlzdCB3aXRoaW4gZW4gZW50cnkgdGhhdCBsaXZlcyBpbiB0aGUgU3R5bGluZ0NvbnRleHQuXG4gKlxuICogVGhlIHZhbHVlcyBoZXJlIHNwbGl0IGEgbnVtYmVyIHZhbHVlIGludG8gdHdvIHNldHMgb2YgYml0czpcbiAqICAtIFRoZSBmaXJzdCAxNiBiaXRzIGFyZSB1c2VkIHRvIHN0b3JlIHRoZSBkaXJlY3RpdmVJbmRleCB0aGF0IG93bnMgdGhpcyBzdHlsZSB2YWx1ZVxuICogIC0gVGhlIG90aGVyIDE2IGJpdHMgYXJlIHVzZWQgdG8gc3RvcmUgdGhlIHBsYXllckJ1aWxkZXJJbmRleCB0aGF0IGlzIGF0dGFjaGVkIHRvIHRoaXMgc3R5bGVcbiAqL1xuZXhwb3J0IGNvbnN0IGVudW0gRGlyZWN0aXZlT3duZXJBbmRQbGF5ZXJCdWlsZGVySW5kZXgge1xuICBCaXRDb3VudFNpemUgPSAxNixcbiAgQml0TWFzayA9IDBiMTExMTExMTExMTExMTExMVxufVxuIl19