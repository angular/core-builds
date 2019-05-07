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
 * property instruction like `elementStyleProp`, `elementClassProp`,
 * `elementStyleMap` or `elementClassMap`) then the values in the context will be updated as
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
 * - `elementStyleMap`
 * - `elementClassMap`
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
    [StylingIndex.HostInstructionsQueue]: HostInstructionsQueue|null;*/
    /* Skipping unnamed member:
    [StylingIndex.PlayerContext]: PlayerContext|null;*/
}
/**
 * A queue of all host-related styling instructions (these are buffered and evaluated just before
 * the styling is applied).
 *
 * This queue is used when any `hostStyling` instructions are executed from the `hostBindings`
 * function. Template-level styling functions (e.g. `elementStyleMap` and `elementClassProp`)
 * do not make use of this queue (they are applied to the styling context immediately).
 *
 * Due to the nature of how components/directives are evaluated, directives (both parent and
 * subclass directives) may not apply their styling at the right time for the styling
 * algorithm code to prioritize them. Therefore, all host-styling instructions are queued up
 * (buffered) into the array below and are automatically sorted in terms of priority. The
 * priority for host-styling is as follows:
 *
 * 1. The template (this doesn't get queued, but gets evaluated immediately)
 * 2. Any directives present on the host
 *   2a) first child directive styling bindings are updated
 *   2b) then any parent directives
 * 3. Component host bindings
 *
 * Angular runs change detection for each of these cases in a different order. Because of this
 * the array below is populated with each of the host styling functions + their arguments.
 *
 * context[HostInstructionsQueue] = [
 *   directiveIndex,
 *   hostStylingFn,
 *   [argumentsForFn],
 *   ...
 *   anotherDirectiveIndex, <-- this has a lower priority (a higher directive index)
 *   anotherHostStylingFn,
 *   [argumentsForFn],
 * ]
 *
 * When `renderStyling` is called (within `class_and_host_bindings.ts`) then the queue is
 * drained and each of the instructions are executed. Once complete the queue is empty then
 * the style/class binding code is rendered on the element (which is what happens normally
 * inside of `renderStyling`).
 *
 * Right now each directive's hostBindings function, as well the template function, both
 * call `elementStylingApply()` and `hostStylingApply()`. The fact that this is called
 * multiple times for the same element (b/c of change detection) causes some issues. To avoid
 * having styling code be rendered on an element multiple times, the `HostInstructionsQueue`
 * reserves a slot for a reference pointing to the very last directive that was registered and
 * only allows for styling to be applied once that directive is encountered (which will happen
 * as the last update for that element).
 * @record
 */
export function HostInstructionsQueue() { }
if (false) {
    /* Skipping unnamed member:
    [0]: number;*/
}
/** @enum {number} */
const HostInstructionsQueueIndex = {
    LastRegisteredDirectiveIndexPosition: 0,
    ValuesStartPosition: 1,
    DirectiveIndexOffset: 0,
    InstructionFnOffset: 1,
    ParamsOffset: 2,
    Size: 3,
};
export { HostInstructionsQueueIndex };
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
    [DirectiveRegistryValuesIndex.SinglePropValuesIndexOffset]: number;*/
    /* Skipping unnamed member:
    [DirectiveRegistryValuesIndex.StyleSanitizerOffset]: StyleSanitizeFn|null;*/
}
/** @enum {number} */
const DirectiveRegistryValuesIndex = {
    SinglePropValuesIndexOffset: 0,
    StyleSanitizerOffset: 1,
    Size: 2,
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
    HostInstructionsQueue: 8,
    PlayerContext: 9,
    // Location of single (prop) value entries are stored within the context
    SingleStylesStartPosition: 10,
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
/**
 * The default directive styling index value for template-based bindings.
 *
 * All host-level bindings (e.g. `hostStyleProp` and `hostClassMap`) are
 * assigned a directive styling index value based on the current directive
 * uniqueId and the directive super-class inheritance depth. But for template
 * bindings they always have the same directive styling index value.
 * @type {?}
 */
export const DEFAULT_TEMPLATE_DIRECTIVE_INDEX = 0;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3R5bGluZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaW50ZXJmYWNlcy9zdHlsaW5nLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQXdRQSxvQ0FvRUM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFnREQsMkNBQTRGOzs7Ozs7O0lBTTFGLHVDQUF3QztJQUN4QyxzQkFBdUI7SUFDdkIsdUJBQXdCO0lBQ3hCLHNCQUF1QjtJQUN2QixlQUFnQjtJQUNoQixPQUFROzs7Ozs7Ozs7OztBQVVWLDBDQUdDOzs7Ozs7Ozs7SUEwR0M7O09BRUc7SUFDSCwyQkFBNEI7SUFFNUI7Ozs7Ozs7OztPQVNHO0lBQ0gsNEJBQTZCO0lBRTdCOztPQUVHO0lBQ0gsd0JBQXlCO0lBRXpCOztPQUVHO0lBQ0gsYUFBYztJQUVkOztPQUVHO0lBQ0gsY0FBZTtJQUVmOzs7T0FHRztJQUNILHVCQUF3QjtJQUV4Qjs7T0FFRztJQUNILHlCQUE0QjtJQUM1Qix1QkFBd0I7SUFFeEI7O09BRUc7SUFDSCxPQUFROzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQStCViw2Q0FHQzs7Ozs7Ozs7O0lBT0MsOEJBQStCO0lBQy9CLHVCQUF3QjtJQUN4QixPQUFROzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUEwQlYsNENBR0M7Ozs7Ozs7OztJQU9DLHNCQUF1QjtJQUN2Qix1QkFBd0I7SUFDeEIscUJBQXNCOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBeUR4QiwwQ0FFQzs7Ozs7OztJQUdDLHVCQUF3QjtJQUN4QixzQkFBdUI7SUFDdkIsa0JBQW1CO0lBQ25CLHNCQUF1QjtJQUN2QixjQUFlO0lBQ2YsbUJBQW9CO0lBQ3BCLE9BQVE7Ozs7O0lBUVIsNEJBQTRCO0lBQzVCLE9BQWM7SUFDZCxzREFBc0Q7SUFDdEQsUUFBZTtJQUNmLGtEQUFrRDtJQUNsRCxRQUFlO0lBQ2YsMERBQTBEO0lBQzFELFdBQWtCO0lBQ2xCLHdFQUF3RTtJQUN4RSxzQkFBNkI7SUFDN0Isc0VBQXNFO0lBQ3RFLDJCQUFpQztJQUNqQyxlQUFnQjtJQUNoQixnQ0FBZ0M7SUFDaEMsV0FBaUI7Ozs7O0lBS2pCLHlFQUF5RTtJQUN6RSwwREFBMEQ7SUFDMUQsa0JBQW1CO0lBQ25CLHlGQUF5RjtJQUN6RixxQkFBc0I7SUFDdEIsNkVBQTZFO0lBQzdFLDRCQUE2QjtJQUM3Qix5RUFBeUU7SUFDekUsNkJBQThCO0lBQzlCLDZCQUE4QjtJQUM5QixrRUFBa0U7SUFDbEUsNEJBQTZCO0lBQzdCLGlHQUFpRztJQUNqRyxzREFBc0Q7SUFDdEQscUJBQXNCO0lBQ3RCLHFFQUFxRTtJQUNyRSxvQkFBcUI7SUFDckIsaUdBQWlHO0lBQ2pHLHlFQUF5RTtJQUN6RSx3QkFBeUI7SUFDekIsZ0JBQWlCO0lBQ2pCLHdFQUF3RTtJQUN4RSw2QkFBOEI7SUFDOUIsY0FBZTtJQUNmLGlCQUFrQjtJQUNsQixjQUFlO0lBQ2YsMkJBQTRCO0lBQzVCLGdGQUFnRjtJQUNoRixPQUFRO0lBQ1Isb0RBQW9EO0lBQ3BELGdCQUFpQjtJQUNqQixtQ0FBbUM7SUFDbkMsY0FBMEI7Ozs7O0lBWTFCLGdCQUFpQjtJQUNqQixjQUE0Qjs7Ozs7Ozs7Ozs7O0FBVzlCLE1BQU0sT0FBTyxnQ0FBZ0MsR0FBRyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0IHtTdHlsZVNhbml0aXplRm59IGZyb20gJy4uLy4uL3Nhbml0aXphdGlvbi9zdHlsZV9zYW5pdGl6ZXInO1xuaW1wb3J0IHtSRWxlbWVudH0gZnJvbSAnLi4vaW50ZXJmYWNlcy9yZW5kZXJlcic7XG5pbXBvcnQge0xDb250YWluZXJ9IGZyb20gJy4vY29udGFpbmVyJztcbmltcG9ydCB7UGxheWVyQ29udGV4dH0gZnJvbSAnLi9wbGF5ZXInO1xuaW1wb3J0IHtMVmlld30gZnJvbSAnLi92aWV3JztcblxuXG4vKipcbiAqIFRoZSBzdHlsaW5nIGNvbnRleHQgYWN0cyBhcyBhIHN0eWxpbmcgbWFuaWZlc3QgKHNoYXBlZCBhcyBhbiBhcnJheSkgZm9yIGRldGVybWluaW5nIHdoaWNoXG4gKiBzdHlsaW5nIHByb3BlcnRpZXMgaGF2ZSBiZWVuIGFzc2lnbmVkIHZpYSB0aGUgcHJvdmlkZWQgYHVwZGF0ZVN0eWxpbmdNYXBgLCBgdXBkYXRlU3R5bGVQcm9wYFxuICogYW5kIGB1cGRhdGVDbGFzc1Byb3BgIGZ1bmN0aW9ucy4gSXQgYWxzbyBzdG9yZXMgdGhlIHN0YXRpYyBzdHlsZS9jbGFzcyB2YWx1ZXMgdGhhdCB3ZXJlXG4gKiBleHRyYWN0ZWQgZnJvbSB0aGUgdGVtcGxhdGUgYnkgdGhlIGNvbXBpbGVyLlxuICpcbiAqIEEgY29udGV4dCBpcyBjcmVhdGVkIGJ5IEFuZ3VsYXIgd2hlbjpcbiAqIDEuIEFuIGVsZW1lbnQgY29udGFpbnMgc3RhdGljIHN0eWxpbmcgdmFsdWVzIChsaWtlIHN0eWxlPVwiLi4uXCIgb3IgY2xhc3M9XCIuLi5cIilcbiAqIDIuIEFuIGVsZW1lbnQgY29udGFpbnMgc2luZ2xlIHByb3BlcnR5IGJpbmRpbmcgdmFsdWVzIChsaWtlIFtzdHlsZS5wcm9wXT1cInhcIiBvclxuICogW2NsYXNzLnByb3BdPVwieVwiKVxuICogMy4gQW4gZWxlbWVudCBjb250YWlucyBtdWx0aSBwcm9wZXJ0eSBiaW5kaW5nIHZhbHVlcyAobGlrZSBbc3R5bGVdPVwieFwiIG9yIFtjbGFzc109XCJ5XCIpXG4gKiA0LiBBIGRpcmVjdGl2ZSBjb250YWlucyBob3N0IGJpbmRpbmdzIGZvciBzdGF0aWMsIHNpbmdsZSBvciBtdWx0aSBzdHlsaW5nIHByb3BlcnRpZXMvYmluZGluZ3MuXG4gKiA1LiBBbiBhbmltYXRpb24gcGxheWVyIGlzIGFkZGVkIHRvIGFuIGVsZW1lbnQgdmlhIGBhZGRQbGF5ZXJgXG4gKlxuICogTm90ZSB0aGF0IGV2ZW4gaWYgYW4gZWxlbWVudCBjb250YWlucyBzdGF0aWMgc3R5bGluZyB0aGVuIHRoaXMgY29udGV4dCB3aWxsIGJlIGNyZWF0ZWQgYW5kXG4gKiBhdHRhY2hlZCB0byBpdC4gVGhlIHJlYXNvbiB3aHkgdGhpcyBoYXBwZW5zIChpbnN0ZWFkIG9mIHRyZWF0aW5nIHN0eWxlcy9jbGFzc2VzIGFzIHJlZ3VsYXJcbiAqIEhUTUwgYXR0cmlidXRlcykgaXMgYmVjYXVzZSB0aGUgc3R5bGUvY2xhc3MgYmluZGluZ3MgbXVzdCBiZSBhYmxlIHRvIGRlZmF1bHQgdGhlbXNlbHZlcyBiYWNrXG4gKiB0byB0aGVpciByZXNwZWN0aXZlIHN0YXRpYyB2YWx1ZXMgd2hlbiB0aGV5IGFyZSBzZXQgdG8gbnVsbC5cbiAqXG4gKiBTYXkgZm9yIGV4YW1wbGUgd2UgaGF2ZSB0aGlzOlxuICogYGBgXG4gKiA8IS0tIHdoZW4gYG15V2lkdGhFeHA9bnVsbGAgdGhlbiBhIHdpZHRoIG9mIGAxMDBweGBcbiAqICAgICAgd2lsbCBiZSB1c2VkIGEgZGVmYXVsdCB2YWx1ZSBmb3Igd2lkdGggLS0+XG4gKiA8ZGl2IHN0eWxlPVwid2lkdGg6MTAwcHhcIiBbc3R5bGUud2lkdGhdPVwibXlXaWR0aEV4cFwiPjwvZGl2PlxuICogYGBgXG4gKlxuICogRXZlbiBpbiB0aGUgc2l0dWF0aW9uIHdoZXJlIHRoZXJlIGFyZSBubyBiaW5kaW5ncywgdGhlIHN0YXRpYyBzdHlsaW5nIGlzIHN0aWxsIHBsYWNlZCBpbnRvIHRoZVxuICogY29udGV4dCBiZWNhdXNlIHRoZXJlIG1heSBiZSBhbm90aGVyIGRpcmVjdGl2ZSBvbiB0aGUgc2FtZSBlbGVtZW50IHRoYXQgaGFzIHN0eWxpbmcuXG4gKlxuICogV2hlbiBBbmd1bGFyIGluaXRpYWxpemVzIHN0eWxpbmcgZGF0YSBmb3IgYW4gZWxlbWVudCB0aGVuIGl0IHdpbGwgZmlyc3QgcmVnaXN0ZXIgdGhlIHN0YXRpY1xuICogc3R5bGluZyB2YWx1ZXMgb24gdGhlIGVsZW1lbnQgdXNpbmcgb25lIG9mIHRoZXNlIHR3byBpbnN0cnVjdGlvbnM6XG4gKlxuICogMS4gZWxlbWVudFN0YXJ0IG9yIGVsZW1lbnQgKHdpdGhpbiB0aGUgdGVtcGxhdGUgZnVuY3Rpb24gb2YgYSBjb21wb25lbnQpXG4gKiAyLiBlbGVtZW50SG9zdEF0dHJzIChmb3IgZGlyZWN0aXZlIGhvc3QgYmluZGluZ3MpXG4gKlxuICogSW4gZWl0aGVyIGNhc2UsIGEgc3R5bGluZyBjb250ZXh0IHdpbGwgYmUgY3JlYXRlZCBhbmQgc3RvcmVkIHdpdGhpbiBhbiBlbGVtZW50J3MgYExWaWV3RGF0YWAuXG4gKiBPbmNlIHRoZSBzdHlsaW5nIGNvbnRleHQgaXMgY3JlYXRlZCB0aGVuIHNpbmdsZSBhbmQgbXVsdGkgcHJvcGVydGllcyBjYW4gYmUgc3RvcmVkIHdpdGhpbiBpdC5cbiAqIEZvciB0aGlzIHRvIGhhcHBlbiwgdGhlIGZvbGxvd2luZyBmdW5jdGlvbiBuZWVkcyB0byBiZSBjYWxsZWQ6XG4gKlxuICogYGVsZW1lbnRTdHlsaW5nYCAoY2FsbGVkIHdpdGggc3R5bGUgcHJvcGVydGllcywgY2xhc3MgcHJvcGVydGllcyBhbmQgYSBzYW5pdGl6ZXIgKyBhIGRpcmVjdGl2ZVxuICogaW5zdGFuY2UpLlxuICpcbiAqIFdoZW4gdGhpcyBpbnN0cnVjdGlvbiBpcyBjYWxsZWQgaXQgd2lsbCBwb3B1bGF0ZSB0aGUgc3R5bGluZyBjb250ZXh0IHdpdGggdGhlIHByb3ZpZGVkIHN0eWxlXG4gKiBhbmQgY2xhc3MgbmFtZXMgaW50byB0aGUgY29udGV4dC5cbiAqXG4gKiBUaGUgY29udGV4dCBpdHNlbGYgbG9va3MgbGlrZSB0aGlzOlxuICpcbiAqIGNvbnRleHQgPSBbXG4gKiAgIC8vIDAtODogaGVhZGVyIHZhbHVlcyAoYWJvdXQgOCBlbnRyaWVzIG9mIGNvbmZpZ3VyYXRpb24gZGF0YSlcbiAqICAgLy8gOSs6IHRoaXMgaXMgd2hlcmUgZWFjaCBlbnRyeSBpcyBzdG9yZWQ6XG4gKiBdXG4gKlxuICogTGV0J3Mgc2F5IHdlIGhhdmUgdGhlIGZvbGxvd2luZyB0ZW1wbGF0ZSBjb2RlOlxuICpcbiAqIGBgYFxuICogPGRpdiBjbGFzcz1cImZvbyBiYXJcIlxuICogICAgICBzdHlsZT1cIndpZHRoOjIwMHB4OyBjb2xvcjpyZWRcIlxuICogICAgICBbc3R5bGUud2lkdGhdPVwibXlXaWR0aEV4cFwiXG4gKiAgICAgIFtzdHlsZS5oZWlnaHRdPVwibXlIZWlnaHRFeHBcIlxuICogICAgICBbY2xhc3MuYmF6XT1cIm15QmF6RXhwXCI+XG4gKiBgYGBcbiAqXG4gKiBUaGUgY29udGV4dCBnZW5lcmF0ZWQgZnJvbSB0aGVzZSB2YWx1ZXMgd2lsbCBsb29rIGxpa2UgdGhpcyAobm90ZSB0aGF0XG4gKiBmb3IgZWFjaCBiaW5kaW5nIG5hbWUgKHRoZSBjbGFzcyBhbmQgc3R5bGUgYmluZGluZ3MpIHRoZSB2YWx1ZXMgd2lsbFxuICogYmUgaW5zZXJ0ZWQgdHdpY2UgaW50byB0aGUgYXJyYXkgKG9uY2UgZm9yIHNpbmdsZSBwcm9wZXJ0eSBlbnRyaWVzIGFuZFxuICogYWdhaW4gZm9yIG11bHRpIHByb3BlcnR5IGVudHJpZXMpLlxuICpcbiAqIGNvbnRleHQgPSBbXG4gKiAgIC8vIDAtODogaGVhZGVyIHZhbHVlcyAoYWJvdXQgOCBlbnRyaWVzIG9mIGNvbmZpZ3VyYXRpb24gZGF0YSlcbiAqICAgLy8gOSs6IHRoaXMgaXMgd2hlcmUgZWFjaCBlbnRyeSBpcyBzdG9yZWQ6XG4gKlxuICogICAvLyBTSU5HTEUgUFJPUEVSVElFU1xuICogICBjb25maWdGb3JXaWR0aCxcbiAqICAgJ3dpZHRoJ1xuICogICBteVdpZHRoRXhwLCAvLyB0aGUgYmluZGluZyB2YWx1ZSBub3QgdGhlIGJpbmRpbmcgaXRzZWxmXG4gKiAgIDAsIC8vIHRoZSBkaXJlY3RpdmUgb3duZXJcbiAqXG4gKiAgIGNvbmZpZ0ZvckhlaWdodCxcbiAqICAgJ2hlaWdodCdcbiAqICAgbXlIZWlnaHRFeHAsIC8vIHRoZSBiaW5kaW5nIHZhbHVlIG5vdCB0aGUgYmluZGluZyBpdHNlbGZcbiAqICAgMCwgLy8gdGhlIGRpcmVjdGl2ZSBvd25lclxuICpcbiAqICAgY29uZmlnRm9yQmF6Q2xhc3MsXG4gKiAgICdiYXpcbiAqICAgbXlCYXpDbGFzc0V4cCwgLy8gdGhlIGJpbmRpbmcgdmFsdWUgbm90IHRoZSBiaW5kaW5nIGl0c2VsZlxuICogICAwLCAvLyB0aGUgZGlyZWN0aXZlIG93bmVyXG4gKlxuICogICAvLyBNVUxUSSBQUk9QRVJUSUVTXG4gKiAgIGNvbmZpZ0ZvcldpZHRoLFxuICogICAnd2lkdGgnXG4gKiAgIG15V2lkdGhFeHAsIC8vIHRoZSBiaW5kaW5nIHZhbHVlIG5vdCB0aGUgYmluZGluZyBpdHNlbGZcbiAqICAgMCwgLy8gdGhlIGRpcmVjdGl2ZSBvd25lclxuICpcbiAqICAgY29uZmlnRm9ySGVpZ2h0LFxuICogICAnaGVpZ2h0J1xuICogICBteUhlaWdodEV4cCwgLy8gdGhlIGJpbmRpbmcgdmFsdWUgbm90IHRoZSBiaW5kaW5nIGl0c2VsZlxuICogICAwLCAvLyB0aGUgZGlyZWN0aXZlIG93bmVyXG4gKlxuICogICBjb25maWdGb3JCYXpDbGFzcyxcbiAqICAgJ2JhelxuICogICBteUJhekNsYXNzRXhwLCAvLyB0aGUgYmluZGluZyB2YWx1ZSBub3QgdGhlIGJpbmRpbmcgaXRzZWxmXG4gKiAgIDAsIC8vIHRoZSBkaXJlY3RpdmUgb3duZXJcbiAqIF1cbiAqXG4gKiBUaGUgY29uZmlndXJhdGlvbiB2YWx1ZXMgYXJlIGxlZnQgb3V0IG9mIHRoZSBleGFtcGxlIGFib3ZlIGJlY2F1c2VcbiAqIHRoZSBvcmRlcmluZyBvZiB0aGVtIGNvdWxkIGNoYW5nZSBiZXR3ZWVuIGNvZGUgcGF0Y2hlcy4gUGxlYXNlIHJlYWQgdGhlXG4gKiBkb2N1bWVudGF0aW9uIGJlbG93IHRvIGdldCBhIGJldHRlciB1bmRlcnN0YW5kIG9mIHdoYXQgdGhlIGNvbmZpZ3VyYXRpb25cbiAqIHZhbHVlcyBhcmUgYW5kIGhvdyB0aGV5IHdvcmsuXG4gKlxuICogRWFjaCB0aW1lIGEgYmluZGluZyBwcm9wZXJ0eSBpcyB1cGRhdGVkICh3aGV0aGVyIGl0IGJlIHRocm91Z2ggYSBzaW5nbGVcbiAqIHByb3BlcnR5IGluc3RydWN0aW9uIGxpa2UgYGVsZW1lbnRTdHlsZVByb3BgLCBgZWxlbWVudENsYXNzUHJvcGAsXG4gKiBgZWxlbWVudFN0eWxlTWFwYCBvciBgZWxlbWVudENsYXNzTWFwYCkgdGhlbiB0aGUgdmFsdWVzIGluIHRoZSBjb250ZXh0IHdpbGwgYmUgdXBkYXRlZCBhc1xuICogd2VsbC5cbiAqXG4gKiBJZiBmb3IgZXhhbXBsZSBgW3N0eWxlLndpZHRoXWAgdXBkYXRlcyB0byBgNTU1cHhgIHRoZW4gaXRzIHZhbHVlIHdpbGwgYmUgcmVmbGVjdGVkXG4gKiBpbiB0aGUgY29udGV4dCBhcyBzbzpcbiAqXG4gKiBjb250ZXh0ID0gW1xuICogICAvLyAuLi5cbiAqICAgY29uZmlnRm9yV2lkdGgsIC8vIHRoaXMgd2lsbCBiZSBtYXJrZWQgRElSVFlcbiAqICAgJ3dpZHRoJ1xuICogICAnNTU1cHgnLFxuICogICAwLFxuICogICAvLy4uXG4gKiBdXG4gKlxuICogVGhlIGNvbnRleHQgYW5kIGRpcmVjdGl2ZSBkYXRhIHdpbGwgYWxzbyBiZSBtYXJrZWQgZGlydHkuXG4gKlxuICogRGVzcGl0ZSB0aGUgY29udGV4dCBiZWluZyB1cGRhdGVkLCBub3RoaW5nIGhhcyBiZWVuIHJlbmRlcmVkIG9uIHNjcmVlbiAobm90IHN0eWxlcyBvclxuICogY2xhc3NlcyBoYXZlIGJlZW4gc2V0IG9uIHRoZSBlbGVtZW50KS4gVG8ga2ljayBvZmYgcmVuZGVyaW5nIGZvciBhbiBlbGVtZW50IHRoZSBmb2xsb3dpbmdcbiAqIGZ1bmN0aW9uIG5lZWRzIHRvIGJlIHJ1biBgZWxlbWVudFN0eWxpbmdBcHBseWAuXG4gKlxuICogYGVsZW1lbnRTdHlsaW5nQXBwbHlgIHdpbGwgcnVuIHRocm91Z2ggdGhlIGNvbnRleHQgYW5kIGZpbmQgZWFjaCBkaXJ0eSB2YWx1ZSBhbmQgcmVuZGVyIHRoZW0gb250b1xuICogdGhlIGVsZW1lbnQuIE9uY2UgY29tcGxldGUsIGFsbCBzdHlsZXMvY2xhc3NlcyB3aWxsIGJlIHNldCB0byBjbGVhbi4gQmVjYXVzZSBvZiB0aGlzLCB0aGUgcmVuZGVyXG4gKiBmdW5jdGlvbiB3aWxsIG5vdyBrbm93IG5vdCB0byByZXJ1biBpdHNlbGYgYWdhaW4gaWYgY2FsbGVkIGFnYWluIHVubGVzcyBuZXcgc3R5bGUvY2xhc3MgdmFsdWVzXG4gKiBoYXZlIGNoYW5nZWQuXG4gKlxuICogIyMgRGlyZWN0aXZlc1xuICogRGlyZWN0aXZlIHN0eWxlL2NsYXNzIHZhbHVlcyAod2hpY2ggYXJlIHByb3ZpZGVkIHRocm91Z2ggaG9zdCBiaW5kaW5ncykgYXJlIGFsc28gc3VwcG9ydGVkIGFuZFxuICogaG91c2VkIHdpdGhpbiB0aGUgc2FtZSBzdHlsaW5nIGNvbnRleHQgYXMgYXJlIHRlbXBsYXRlLWxldmVsIHN0eWxlL2NsYXNzIHByb3BlcnRpZXMvYmluZGluZ3NcbiAqIFNvIGxvbmcgYXMgdGhleSBhcmUgYWxsIGFzc2lnbmVkIHRvIHRoZSBzYW1lIGVsZW1lbnQsIGJvdGggZGlyZWN0aXZlLWxldmVsIGFuZCB0ZW1wbGF0ZS1sZXZlbFxuICogc3R5bGluZyBiaW5kaW5ncyBzaGFyZSB0aGUgc2FtZSBjb250ZXh0LlxuICpcbiAqIEVhY2ggb2YgdGhlIGZvbGxvd2luZyBpbnN0cnVjdGlvbnMgc3VwcG9ydHMgYWNjZXB0aW5nIGEgZGlyZWN0aXZlIGluc3RhbmNlIGFzIGFuIGlucHV0IHBhcmFtZXRlcjpcbiAqXG4gKiAtIGBlbGVtZW50SG9zdEF0dHJzYFxuICogLSBgZWxlbWVudFN0eWxpbmdgXG4gKiAtIGBlbGVtZW50U3R5bGVQcm9wYFxuICogLSBgZWxlbWVudENsYXNzUHJvcGBcbiAqIC0gYGVsZW1lbnRTdHlsZU1hcGBcbiAqIC0gYGVsZW1lbnRDbGFzc01hcGBcbiAqIC0gYGVsZW1lbnRTdHlsaW5nQXBwbHlgXG4gKlxuICogRWFjaCB0aW1lIGEgZGlyZWN0aXZlIHZhbHVlIGlzIHBhc3NlZCBpbiwgaXQgd2lsbCBiZSBjb252ZXJ0ZWQgaW50byBhbiBpbmRleCBieSBleGFtaW5pbmcgdGhlXG4gKiBkaXJlY3RpdmUgcmVnaXN0cnkgKHdoaWNoIGxpdmVzIGluIHRoZSBjb250ZXh0IGNvbmZpZ3VyYXRpb24gYXJlYSkuIFRoZSBpbmRleCBpcyB0aGVuIHVzZWRcbiAqIHRvIGhlbHAgc2luZ2xlIHN0eWxlIHByb3BlcnRpZXMgZmlndXJlIG91dCB3aGVyZSBhIHZhbHVlIGlzIGxvY2F0ZWQgaW4gdGhlIGNvbnRleHQuXG4gKlxuICpcbiAqICMjIFNpbmdsZS1sZXZlbCBzdHlsaW5nIGJpbmRpbmdzIChgW3N0eWxlLnByb3BdYCBhbmQgYFtjbGFzcy5uYW1lXWApXG4gKlxuICogQm90aCBgW3N0eWxlLnByb3BdYCBhbmQgYFtjbGFzcy5uYW1lXWAgYmluZGluZ3MgYXJlIHJ1biB0aHJvdWdoIHRoZSBgdXBkYXRlU3R5bGVQcm9wYFxuICogYW5kIGB1cGRhdGVDbGFzc1Byb3BgIGZ1bmN0aW9ucyByZXNwZWN0aXZlbHkuIFRoZXkgd29yayBieSBleGFtaW5pbmcgdGhlIHByb3ZpZGVkXG4gKiBgb2Zmc2V0YCB2YWx1ZSBhbmQgYXJlIGFibGUgdG8gbG9jYXRlIHRoZSBleGFjdCBzcG90IGluIHRoZSBjb250ZXh0IHdoZXJlIHRoZVxuICogbWF0Y2hpbmcgc3R5bGUgaXMgbG9jYXRlZC5cbiAqXG4gKiBCb3RoIGBbc3R5bGUucHJvcF1gIGFuZCBgW2NsYXNzLm5hbWVdYCBiaW5kaW5ncyBhcmUgYWJsZSB0byBwcm9jZXNzIHRoZXNlIHZhbHVlc1xuICogZnJvbSBkaXJlY3RpdmUgaG9zdCBiaW5kaW5ncy4gV2hlbiBldmFsdWF0ZWQgKGZyb20gdGhlIGhvc3QgYmluZGluZyBmdW5jdGlvbikgdGhlXG4gKiBgZGlyZWN0aXZlUmVmYCB2YWx1ZSBpcyB0aGVuIHBhc3NlZCBpbi5cbiAqXG4gKiBJZiB0d28gZGlyZWN0aXZlcyBvciBhIGRpcmVjdGl2ZSArIGEgdGVtcGxhdGUgYmluZGluZyBib3RoIHdyaXRlIHRvIHRoZSBzYW1lIHN0eWxlL2NsYXNzXG4gKiBiaW5kaW5nIHRoZW4gdGhlIHN0eWxpbmcgY29udGV4dCBjb2RlIHdpbGwgZGVjaWRlIHdoaWNoIG9uZSB3aW5zIGJhc2VkIG9uIHRoZSBmb2xsb3dpbmdcbiAqIHJ1bGU6XG4gKlxuICogMS4gSWYgdGhlIHRlbXBsYXRlIGJpbmRpbmcgaGFzIGEgdmFsdWUgdGhlbiBpdCBhbHdheXMgd2luc1xuICogMi4gT3RoZXJ3aXNlIHdoaWNoZXZlciBmaXJzdC1yZWdpc3RlcmVkIGRpcmVjdGl2ZSB0aGF0IGhhcyB0aGF0IHZhbHVlIGZpcnN0IHdpbGwgd2luXG4gKlxuICogVGhlIGNvZGUgZXhhbXBsZSBoZWxwcyBtYWtlIHRoaXMgY2xlYXI6XG4gKlxuICogYGBgXG4gKiA8IS0tXG4gKiA8ZGl2IFtzdHlsZS53aWR0aF09XCJteVdpZHRoXCJcbiAqICAgICAgW215LXdpZHRoLWRpcmVjdGl2ZV09XCInNjAwcHgnXCI+XG4gKiAtLT5cbiAqXG4gKiBARGlyZWN0aXZlKHtcbiAqICBzZWxlY3RvcjogJ1tteS13aWR0aC1kaXJlY3RpdmUnXVxuICogfSlcbiAqIGNsYXNzIE15V2lkdGhEaXJlY3RpdmUge1xuICogICBASW5wdXQoJ215LXdpZHRoLWRpcmVjdGl2ZScpXG4gKiAgIEBIb3N0QmluZGluZygnc3R5bGUud2lkdGgnKVxuICogICBwdWJsaWMgd2lkdGggPSBudWxsO1xuICogfVxuICogYGBgXG4gKlxuICogU2luY2UgdGhlcmUgaXMgYSBzdHlsZSBiaW5kaW5nIGZvciB3aWR0aCBwcmVzZW50IG9uIHRoZSBlbGVtZW50IChgW3N0eWxlLndpZHRoXWApIHRoZW5cbiAqIGl0IHdpbGwgYWx3YXlzIHdpbiBvdmVyIHRoZSB3aWR0aCBiaW5kaW5nIHRoYXQgaXMgcHJlc2VudCBhcyBhIGhvc3QgYmluZGluZyB3aXRoaW5cbiAqIHRoZSBgTXlXaWR0aERpcmVjdGl2ZWAuIEhvd2V2ZXIsIGlmIGBbc3R5bGUud2lkdGhdYCByZW5kZXJzIGFzIGBudWxsYCAoc28gYG15V2lkdGg9bnVsbGApXG4gKiB0aGVuIHRoZSBgTXlXaWR0aERpcmVjdGl2ZWAgd2lsbCBiZSBhYmxlIHRvIHdyaXRlIHRvIHRoZSBgd2lkdGhgIHN0eWxlIHdpdGhpbiB0aGUgY29udGV4dC5cbiAqIFNpbXBseSBwdXQsIHdoaWNoZXZlciBkaXJlY3RpdmUgd3JpdGVzIHRvIGEgdmFsdWUgZmlyc3QgZW5kcyB1cCBoYXZpbmcgb3duZXJzaGlwIG9mIGl0IGFzXG4gKiBsb25nIGFzIHRoZSB0ZW1wbGF0ZSBkaWRuJ3Qgc2V0IGFueXRoaW5nLlxuICpcbiAqIFRoZSB3YXkgaW4gd2hpY2ggdGhlIG93bmVyc2hpcCBpcyBmYWNpbGl0YXRlZCBpcyB0aHJvdWdoIGluZGV4IHZhbHVlLiBUaGUgZWFybGllc3QgZGlyZWN0aXZlc1xuICogZ2V0IHRoZSBzbWFsbGVzdCBpbmRleCB2YWx1ZXMgKHdpdGggMCBiZWluZyByZXNlcnZlZCBmb3IgdGhlIHRlbXBsYXRlIGVsZW1lbnQgYmluZGluZ3MpLiBFYWNoXG4gKiB0aW1lIGEgdmFsdWUgaXMgd3JpdHRlbiBmcm9tIGEgZGlyZWN0aXZlIG9yIHRoZSB0ZW1wbGF0ZSBiaW5kaW5ncywgdGhlIHZhbHVlIGl0c2VsZiBnZXRzXG4gKiBhc3NpZ25lZCB0aGUgZGlyZWN0aXZlIGluZGV4IHZhbHVlIGluIGl0cyBkYXRhLiBJZiBhbm90aGVyIGRpcmVjdGl2ZSB3cml0ZXMgYSB2YWx1ZSBhZ2FpbiB0aGVuXG4gKiBpdHMgZGlyZWN0aXZlIGluZGV4IGdldHMgY29tcGFyZWQgYWdhaW5zdCB0aGUgZGlyZWN0aXZlIGluZGV4IHRoYXQgZXhpc3RzIG9uIHRoZSBlbGVtZW50LiBPbmx5XG4gKiB3aGVuIHRoZSBuZXcgdmFsdWUncyBkaXJlY3RpdmUgaW5kZXggaXMgbGVzcyB0aGFuIHRoZSBleGlzdGluZyBkaXJlY3RpdmUgaW5kZXggdGhlbiB0aGUgbmV3XG4gKiB2YWx1ZSB3aWxsIGJlIHdyaXR0ZW4gdG8gdGhlIGNvbnRleHQuIEJ1dCwgaWYgdGhlIGV4aXN0aW5nIHZhbHVlIGlzIG51bGwgdGhlbiB0aGUgbmV3IHZhbHVlIGlzXG4gKiB3cml0dGVuIGJ5IHRoZSBsZXNzIGltcG9ydGFudCBkaXJlY3RpdmUuXG4gKlxuICogRWFjaCBkaXJlY3RpdmUgYWxzbyBoYXMgaXRzIG93biBzYW5pdGl6ZXIgYW5kIGRpcnR5IGZsYWdzLiBUaGVzZSB2YWx1ZXMgYXJlIGNvbnN1bWVkIHdpdGhpbiB0aGVcbiAqIHJlbmRlcmluZyBmdW5jdGlvbi5cbiAqXG4gKlxuICogIyMgTXVsdGktbGV2ZWwgc3R5bGluZyBiaW5kaW5ncyAoYFtzdHlsZV1gIGFuZCBgW2NsYXNzXWApXG4gKlxuICogTXVsdGktbGV2ZWwgc3R5bGluZyBiaW5kaW5ncyBhcmUgdHJlYXRlZCBhcyBsZXNzIGltcG9ydGFudCAobGVzcyBzcGVjaWZpYykgYXMgc2luZ2xlLWxldmVsXG4gKiBiaW5kaW5ncyAodGhpbmdzIGxpa2UgYFtzdHlsZS5wcm9wXWAgYW5kIGBbY2xhc3MubmFtZV1gKS5cbiAqXG4gKiBNdWx0aS1sZXZlbCBiaW5kaW5ncyBhcmUgc3RpbGwgYXBwbGllZCB0byB0aGUgY29udGV4dCBpbiBhIHNpbWlsYXIgd2F5IGFzIGFyZSBzaW5nbGUgbGV2ZWxcbiAqIGJpbmRpbmdzLCBidXQgdGhpcyBwcm9jZXNzIHdvcmtzIGJ5IGRpZmZpbmcgdGhlIG5ldyBtdWx0aS1sZXZlbCB2YWx1ZXMgKHdoaWNoIGFyZSBrZXkvdmFsdWVcbiAqIG1hcHMpIGFnYWluc3QgdGhlIGV4aXN0aW5nIHNldCBvZiBzdHlsZXMgdGhhdCBsaXZlIGluIHRoZSBjb250ZXh0LiBFYWNoIHRpbWUgYSBuZXcgbWFwIHZhbHVlXG4gKiBpcyBkZXRlY3RlZCAodmlhIGlkZW50aXR5IGNoZWNrKSB0aGVuIGl0IHdpbGwgbG9vcCB0aHJvdWdoIHRoZSB2YWx1ZXMgYW5kIGZpZ3VyZSBvdXQgd2hhdFxuICogaGFzIGNoYW5nZWQgYW5kIHJlb3JkZXIgdGhlIGNvbnRleHQgYXJyYXkgdG8gbWF0Y2ggdGhlIG9yZGVyaW5nIG9mIHRoZSBrZXlzLiBUaGlzIHJlb3JkZXJpbmdcbiAqIG9mIHRoZSBjb250ZXh0IG1ha2VzIHN1cmUgdGhhdCBmb2xsb3ctdXAgdHJhdmVyc2FscyBvZiB0aGUgY29udGV4dCB3aGVuIHVwZGF0ZWQgYWdhaW5zdCB0aGVcbiAqIGtleS92YWx1ZSBtYXAgYXJlIGFzIGNsb3NlIGFzIHBvc3NpYmxlIHRvIG8obikgKHdoZXJlIFwiblwiIGlzIHRoZSBzaXplIG9mIHRoZSBrZXkvdmFsdWUgbWFwKS5cbiAqXG4gKiBJZiBhIGBkaXJlY3RpdmVSZWZgIHZhbHVlIGlzIHBhc3NlZCBpbiB0aGVuIHRoZSBzdHlsaW5nIGFsZ29yaXRobSBjb2RlIHdpbGwgdGFrZSB0aGUgZGlyZWN0aXZlJ3NcbiAqIHByaW9yaXRpemF0aW9uIGluZGV4IGludG8gYWNjb3VudCBhbmQgdXBkYXRlIHRoZSB2YWx1ZXMgd2l0aCByZXNwZWN0IHRvIG1vcmUgaW1wb3J0YW50XG4gKiBkaXJlY3RpdmVzLiBUaGlzIG1lYW5zIHRoYXQgaWYgYSB2YWx1ZSBzdWNoIGFzIGB3aWR0aGAgaXMgdXBkYXRlZCBpbiB0d28gZGlmZmVyZW50IGBbc3R5bGVdYFxuICogYmluZGluZ3MgKHNheSBvbmUgb24gdGhlIHRlbXBsYXRlIGFuZCBhbm90aGVyIHdpdGhpbiBhIGRpcmVjdGl2ZSB0aGF0IHNpdHMgb24gdGhlIHNhbWUgZWxlbWVudClcbiAqIHRoZW4gdGhlIGFsZ29yaXRobSB3aWxsIGRlY2lkZSBob3cgdG8gdXBkYXRlIHRoZSB2YWx1ZSBiYXNlZCBvbiB0aGUgZm9sbG93aW5nIGhldXJpc3RpYzpcbiAqXG4gKiAxLiBJZiB0aGUgdGVtcGxhdGUgYmluZGluZyBoYXMgYSB2YWx1ZSB0aGVuIGl0IGFsd2F5cyB3aW5zXG4gKiAyLiBJZiBub3QgdGhlbiB3aGljaGV2ZXIgZmlyc3QtcmVnaXN0ZXJlZCBkaXJlY3RpdmUgdGhhdCBoYXMgdGhhdCB2YWx1ZSBmaXJzdCB3aWxsIHdpblxuICpcbiAqIEl0IHdpbGwgYWxzbyB1cGRhdGUgdGhlIHZhbHVlIGlmIGl0IHdhcyBzZXQgdG8gYG51bGxgIGJ5IGEgcHJldmlvdXMgZGlyZWN0aXZlIChvciB0aGUgdGVtcGxhdGUpLlxuICpcbiAqIEVhY2ggdGltZSBhIHZhbHVlIGlzIHVwZGF0ZWQgKG9yIHJlbW92ZWQpIHRoZW4gdGhlIGNvbnRleHQgd2lsbCBjaGFuZ2Ugc2hhcGUgdG8gYmV0dGVyIG1hdGNoXG4gKiB0aGUgb3JkZXJpbmcgb2YgdGhlIHN0eWxpbmcgZGF0YSBhcyB3ZWxsIGFzIHRoZSBvcmRlcmluZyBvZiBlYWNoIGRpcmVjdGl2ZSB0aGF0IGNvbnRhaW5zIHN0eWxpbmdcbiAqIGRhdGEuIChTZWUgYHBhdGNoU3R5bGluZ01hcEludG9Db250ZXh0YCBpbnNpZGUgb2YgY2xhc3NfYW5kX3N0eWxlX2JpbmRpbmdzLnRzIHRvIGJldHRlclxuICogdW5kZXJzdGFuZCBob3cgdGhpcyB3b3Jrcy4pXG4gKlxuICogIyMgUmVuZGVyaW5nXG4gKiBUaGUgcmVuZGVyaW5nIG1lY2hhbmlzbSAod2hlbiB0aGUgc3R5bGluZyBkYXRhIGlzIGFwcGxpZWQgb24gc2NyZWVuKSBvY2N1cnMgdmlhIHRoZVxuICogYGVsZW1lbnRTdHlsaW5nQXBwbHlgIGZ1bmN0aW9uIGFuZCBpcyBkZXNpZ25lZCB0byBydW4gYWZ0ZXIgKiphbGwqKiBzdHlsaW5nIGZ1bmN0aW9ucyBoYXZlIGJlZW5cbiAqIGV2YWx1YXRlZC4gVGhlIHJlbmRlcmluZyBhbGdvcml0aG0gd2lsbCBsb29wIG92ZXIgdGhlIGNvbnRleHQgYW5kIG9ubHkgYXBwbHkgdGhlIHN0eWxlcyB0aGF0IGFyZVxuICogZmxhZ2dlZCBhcyBkaXJ0eSAoZWl0aGVyIGJlY2F1c2UgdGhleSBhcmUgbmV3LCB1cGRhdGVkIG9yIGhhdmUgYmVlbiByZW1vdmVkIHZpYSBtdWx0aSBvclxuICogc2luZ2xlIGJpbmRpbmdzKS5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBTdHlsaW5nQ29udGV4dCBleHRlbmRzXG4gICAgQXJyYXk8e1trZXk6IHN0cmluZ106IGFueX18bnVtYmVyfHN0cmluZ3xib29sZWFufFJFbGVtZW50fFN0eWxlU2FuaXRpemVGbnxQbGF5ZXJDb250ZXh0fG51bGw+IHtcbiAgLyoqXG4gICAqIExvY2F0aW9uIG9mIGVsZW1lbnQgdGhhdCBpcyB1c2VkIGFzIGEgdGFyZ2V0IGZvciB0aGlzIGNvbnRleHQuXG4gICAqL1xuICBbU3R5bGluZ0luZGV4LkVsZW1lbnRQb3NpdGlvbl06IExDb250YWluZXJ8TFZpZXd8UkVsZW1lbnR8bnVsbDtcblxuICAvKipcbiAgICogQSBudW1lcmljIHZhbHVlIHJlcHJlc2VudGluZyB0aGUgY29uZmlndXJhdGlvbiBzdGF0dXMgKHdoZXRoZXIgdGhlIGNvbnRleHQgaXMgZGlydHkgb3Igbm90KVxuICAgKiBtaXhlZCB0b2dldGhlciAodXNpbmcgYml0IHNoaWZ0aW5nKSB3aXRoIGEgaW5kZXggdmFsdWUgd2hpY2ggdGVsbHMgdGhlIHN0YXJ0aW5nIGluZGV4IHZhbHVlXG4gICAqIG9mIHdoZXJlIHRoZSBtdWx0aSBzdHlsZSBlbnRyaWVzIGJlZ2luLlxuICAgKi9cbiAgW1N0eWxpbmdJbmRleC5NYXN0ZXJGbGFnUG9zaXRpb25dOiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIExvY2F0aW9uIG9mIHRoZSBjb2xsZWN0aW9uIG9mIGRpcmVjdGl2ZXMgZm9yIHRoaXMgY29udGV4dFxuICAgKi9cbiAgW1N0eWxpbmdJbmRleC5EaXJlY3RpdmVSZWdpc3RyeVBvc2l0aW9uXTogRGlyZWN0aXZlUmVnaXN0cnlWYWx1ZXM7XG5cbiAgLyoqXG4gICAqIExvY2F0aW9uIG9mIGFsbCBzdGF0aWMgc3R5bGVzIHZhbHVlc1xuICAgKi9cbiAgW1N0eWxpbmdJbmRleC5Jbml0aWFsU3R5bGVWYWx1ZXNQb3NpdGlvbl06IEluaXRpYWxTdHlsaW5nVmFsdWVzO1xuXG4gIC8qKlxuICAgKiBMb2NhdGlvbiBvZiBhbGwgc3RhdGljIGNsYXNzIHZhbHVlc1xuICAgKi9cbiAgW1N0eWxpbmdJbmRleC5Jbml0aWFsQ2xhc3NWYWx1ZXNQb3NpdGlvbl06IEluaXRpYWxTdHlsaW5nVmFsdWVzO1xuXG4gIC8qKlxuICAgKiBBIG51bWVyaWMgdmFsdWUgcmVwcmVzZW50aW5nIHRoZSBjbGFzcyBpbmRleCBvZmZzZXQgdmFsdWUuIFdoZW5ldmVyIGEgc2luZ2xlIGNsYXNzIGlzXG4gICAqIGFwcGxpZWQgKHVzaW5nIGBlbGVtZW50Q2xhc3NQcm9wYCkgaXQgc2hvdWxkIGhhdmUgYW4gc3R5bGluZyBpbmRleCB2YWx1ZSB0aGF0IGRvZXNuJ3RcbiAgICogbmVlZCB0byB0YWtlIGludG8gYWNjb3VudCBhbnkgc3R5bGUgdmFsdWVzIHRoYXQgZXhpc3QgaW4gdGhlIGNvbnRleHQuXG4gICAqL1xuICBbU3R5bGluZ0luZGV4LlNpbmdsZVByb3BPZmZzZXRQb3NpdGlvbnNdOiBTaW5nbGVQcm9wT2Zmc2V0VmFsdWVzO1xuXG4gIC8qKlxuICAgKiBUaGUgbGFzdCBjbGFzcyB2YWx1ZSB0aGF0IHdhcyBpbnRlcnByZXRlZCBieSBgZWxlbWVudFN0eWxlTWFwYC4gVGhpcyBpcyBjYWNoZWRcbiAgICogU28gdGhhdCB0aGUgYWxnb3JpdGhtIGNhbiBleGl0IGVhcmx5IGluY2FzZSB0aGUgdmFsdWUgaGFzIG5vdCBjaGFuZ2VkLlxuICAgKi9cbiAgW1N0eWxpbmdJbmRleC5DYWNoZWRNdWx0aUNsYXNzZXNdOiBhbnl8TWFwQmFzZWRPZmZzZXRWYWx1ZXM7XG5cbiAgLyoqXG4gICAqIFRoZSBsYXN0IHN0eWxlIHZhbHVlIHRoYXQgd2FzIGludGVycHJldGVkIGJ5IGBlbGVtZW50Q2xhc3NNYXBgLiBUaGlzIGlzIGNhY2hlZFxuICAgKiBTbyB0aGF0IHRoZSBhbGdvcml0aG0gY2FuIGV4aXQgZWFybHkgaW5jYXNlIHRoZSB2YWx1ZSBoYXMgbm90IGNoYW5nZWQuXG4gICAqL1xuICBbU3R5bGluZ0luZGV4LkNhY2hlZE11bHRpU3R5bGVzXTogYW55fE1hcEJhc2VkT2Zmc2V0VmFsdWVzO1xuXG4gIC8qKlxuICAgKiBBIHF1ZXVlIG9mIGFsbCBob3N0U3R5bGluZyBpbnN0cnVjdGlvbnMuXG4gICAqXG4gICAqIFRoaXMgYXJyYXkgKHF1ZXVlKSBpcyBwb3B1bGF0ZWQgb25seSB3aGVuIGhvc3QtbGV2ZWwgc3R5bGluZyBpbnN0cnVjdGlvbnNcbiAgICogKGUuZy4gYGhvc3RTdHlsZU1hcGAgYW5kIGBob3N0Q2xhc3NQcm9wYCkgYXJlIHVzZWQgdG8gYXBwbHkgc3R5bGUgYW5kXG4gICAqIGNsYXNzIHZhbHVlcyB2aWEgaG9zdCBiaW5kaW5ncyB0byB0aGUgaG9zdCBlbGVtZW50LiBEZXNwaXRlIHRoZXNlIGJlaW5nXG4gICAqIHN0YW5kYXJkIGFuZ3VsYXIgaW5zdHJ1Y3Rpb25zLCB0aGV5IGFyZSBub3QgZGVzaWduZWQgdG8gaW1tZWRpYXRlbHkgYXBwbHlcbiAgICogdGhlaXIgdmFsdWVzIHRvIHRoZSBzdHlsaW5nIGNvbnRleHQgd2hlbiBleGVjdXRlZC4gV2hhdCBoYXBwZW5zIGluc3RlYWQgaXNcbiAgICogYSBxdWV1ZSBpcyBjb25zdHJ1Y3RlZCBhbmQgZWFjaCBpbnN0cnVjdGlvbiBpcyBwb3B1bGF0ZWQgaW50byB0aGUgcXVldWUuXG4gICAqIFRoZW4sIG9uY2UgdGhlIHN0eWxlL2NsYXNzIHZhbHVlcyBhcmUgc2V0IHRvIGZsdXNoICh2aWEgYGVsZW1lbnRTdHlsaW5nQXBwbHlgIG9yXG4gICAqIGBob3N0U3R5bGluZ0FwcGx5YCksIHRoZSBxdWV1ZSBpcyBmbHVzaGVkIGFuZCB0aGUgdmFsdWVzIGFyZSByZW5kZXJlZCBvbnRvXG4gICAqIHRoZSBob3N0IGVsZW1lbnQuXG4gICAqL1xuICBbU3R5bGluZ0luZGV4Lkhvc3RJbnN0cnVjdGlvbnNRdWV1ZV06IEhvc3RJbnN0cnVjdGlvbnNRdWV1ZXxudWxsO1xuXG4gIC8qKlxuICAgKiBMb2NhdGlvbiBvZiBhbmltYXRpb24gY29udGV4dCAod2hpY2ggY29udGFpbnMgdGhlIGFjdGl2ZSBwbGF5ZXJzKSBmb3IgdGhpcyBlbGVtZW50IHN0eWxpbmdcbiAgICogY29udGV4dC5cbiAgICovXG4gIFtTdHlsaW5nSW5kZXguUGxheWVyQ29udGV4dF06IFBsYXllckNvbnRleHR8bnVsbDtcbn1cblxuLyoqXG4gKiBBIHF1ZXVlIG9mIGFsbCBob3N0LXJlbGF0ZWQgc3R5bGluZyBpbnN0cnVjdGlvbnMgKHRoZXNlIGFyZSBidWZmZXJlZCBhbmQgZXZhbHVhdGVkIGp1c3QgYmVmb3JlXG4gKiB0aGUgc3R5bGluZyBpcyBhcHBsaWVkKS5cbiAqXG4gKiBUaGlzIHF1ZXVlIGlzIHVzZWQgd2hlbiBhbnkgYGhvc3RTdHlsaW5nYCBpbnN0cnVjdGlvbnMgYXJlIGV4ZWN1dGVkIGZyb20gdGhlIGBob3N0QmluZGluZ3NgXG4gKiBmdW5jdGlvbi4gVGVtcGxhdGUtbGV2ZWwgc3R5bGluZyBmdW5jdGlvbnMgKGUuZy4gYGVsZW1lbnRTdHlsZU1hcGAgYW5kIGBlbGVtZW50Q2xhc3NQcm9wYClcbiAqIGRvIG5vdCBtYWtlIHVzZSBvZiB0aGlzIHF1ZXVlICh0aGV5IGFyZSBhcHBsaWVkIHRvIHRoZSBzdHlsaW5nIGNvbnRleHQgaW1tZWRpYXRlbHkpLlxuICpcbiAqIER1ZSB0byB0aGUgbmF0dXJlIG9mIGhvdyBjb21wb25lbnRzL2RpcmVjdGl2ZXMgYXJlIGV2YWx1YXRlZCwgZGlyZWN0aXZlcyAoYm90aCBwYXJlbnQgYW5kXG4gKiBzdWJjbGFzcyBkaXJlY3RpdmVzKSBtYXkgbm90IGFwcGx5IHRoZWlyIHN0eWxpbmcgYXQgdGhlIHJpZ2h0IHRpbWUgZm9yIHRoZSBzdHlsaW5nXG4gKiBhbGdvcml0aG0gY29kZSB0byBwcmlvcml0aXplIHRoZW0uIFRoZXJlZm9yZSwgYWxsIGhvc3Qtc3R5bGluZyBpbnN0cnVjdGlvbnMgYXJlIHF1ZXVlZCB1cFxuICogKGJ1ZmZlcmVkKSBpbnRvIHRoZSBhcnJheSBiZWxvdyBhbmQgYXJlIGF1dG9tYXRpY2FsbHkgc29ydGVkIGluIHRlcm1zIG9mIHByaW9yaXR5LiBUaGVcbiAqIHByaW9yaXR5IGZvciBob3N0LXN0eWxpbmcgaXMgYXMgZm9sbG93czpcbiAqXG4gKiAxLiBUaGUgdGVtcGxhdGUgKHRoaXMgZG9lc24ndCBnZXQgcXVldWVkLCBidXQgZ2V0cyBldmFsdWF0ZWQgaW1tZWRpYXRlbHkpXG4gKiAyLiBBbnkgZGlyZWN0aXZlcyBwcmVzZW50IG9uIHRoZSBob3N0XG4gKiAgIDJhKSBmaXJzdCBjaGlsZCBkaXJlY3RpdmUgc3R5bGluZyBiaW5kaW5ncyBhcmUgdXBkYXRlZFxuICogICAyYikgdGhlbiBhbnkgcGFyZW50IGRpcmVjdGl2ZXNcbiAqIDMuIENvbXBvbmVudCBob3N0IGJpbmRpbmdzXG4gKlxuICogQW5ndWxhciBydW5zIGNoYW5nZSBkZXRlY3Rpb24gZm9yIGVhY2ggb2YgdGhlc2UgY2FzZXMgaW4gYSBkaWZmZXJlbnQgb3JkZXIuIEJlY2F1c2Ugb2YgdGhpc1xuICogdGhlIGFycmF5IGJlbG93IGlzIHBvcHVsYXRlZCB3aXRoIGVhY2ggb2YgdGhlIGhvc3Qgc3R5bGluZyBmdW5jdGlvbnMgKyB0aGVpciBhcmd1bWVudHMuXG4gKlxuICogY29udGV4dFtIb3N0SW5zdHJ1Y3Rpb25zUXVldWVdID0gW1xuICogICBkaXJlY3RpdmVJbmRleCxcbiAqICAgaG9zdFN0eWxpbmdGbixcbiAqICAgW2FyZ3VtZW50c0ZvckZuXSxcbiAqICAgLi4uXG4gKiAgIGFub3RoZXJEaXJlY3RpdmVJbmRleCwgPC0tIHRoaXMgaGFzIGEgbG93ZXIgcHJpb3JpdHkgKGEgaGlnaGVyIGRpcmVjdGl2ZSBpbmRleClcbiAqICAgYW5vdGhlckhvc3RTdHlsaW5nRm4sXG4gKiAgIFthcmd1bWVudHNGb3JGbl0sXG4gKiBdXG4gKlxuICogV2hlbiBgcmVuZGVyU3R5bGluZ2AgaXMgY2FsbGVkICh3aXRoaW4gYGNsYXNzX2FuZF9ob3N0X2JpbmRpbmdzLnRzYCkgdGhlbiB0aGUgcXVldWUgaXNcbiAqIGRyYWluZWQgYW5kIGVhY2ggb2YgdGhlIGluc3RydWN0aW9ucyBhcmUgZXhlY3V0ZWQuIE9uY2UgY29tcGxldGUgdGhlIHF1ZXVlIGlzIGVtcHR5IHRoZW5cbiAqIHRoZSBzdHlsZS9jbGFzcyBiaW5kaW5nIGNvZGUgaXMgcmVuZGVyZWQgb24gdGhlIGVsZW1lbnQgKHdoaWNoIGlzIHdoYXQgaGFwcGVucyBub3JtYWxseVxuICogaW5zaWRlIG9mIGByZW5kZXJTdHlsaW5nYCkuXG4gKlxuICogUmlnaHQgbm93IGVhY2ggZGlyZWN0aXZlJ3MgaG9zdEJpbmRpbmdzIGZ1bmN0aW9uLCBhcyB3ZWxsIHRoZSB0ZW1wbGF0ZSBmdW5jdGlvbiwgYm90aFxuICogY2FsbCBgZWxlbWVudFN0eWxpbmdBcHBseSgpYCBhbmQgYGhvc3RTdHlsaW5nQXBwbHkoKWAuIFRoZSBmYWN0IHRoYXQgdGhpcyBpcyBjYWxsZWRcbiAqIG11bHRpcGxlIHRpbWVzIGZvciB0aGUgc2FtZSBlbGVtZW50IChiL2Mgb2YgY2hhbmdlIGRldGVjdGlvbikgY2F1c2VzIHNvbWUgaXNzdWVzLiBUbyBhdm9pZFxuICogaGF2aW5nIHN0eWxpbmcgY29kZSBiZSByZW5kZXJlZCBvbiBhbiBlbGVtZW50IG11bHRpcGxlIHRpbWVzLCB0aGUgYEhvc3RJbnN0cnVjdGlvbnNRdWV1ZWBcbiAqIHJlc2VydmVzIGEgc2xvdCBmb3IgYSByZWZlcmVuY2UgcG9pbnRpbmcgdG8gdGhlIHZlcnkgbGFzdCBkaXJlY3RpdmUgdGhhdCB3YXMgcmVnaXN0ZXJlZCBhbmRcbiAqIG9ubHkgYWxsb3dzIGZvciBzdHlsaW5nIHRvIGJlIGFwcGxpZWQgb25jZSB0aGF0IGRpcmVjdGl2ZSBpcyBlbmNvdW50ZXJlZCAod2hpY2ggd2lsbCBoYXBwZW5cbiAqIGFzIHRoZSBsYXN0IHVwZGF0ZSBmb3IgdGhhdCBlbGVtZW50KS5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBIb3N0SW5zdHJ1Y3Rpb25zUXVldWUgZXh0ZW5kcyBBcnJheTxudW1iZXJ8RnVuY3Rpb258YW55W10+IHsgWzBdOiBudW1iZXI7IH1cblxuLyoqXG4gKiBVc2VkIGFzIGEgcmVmZXJlbmNlIGZvciBhbnkgdmFsdWVzIGNvbnRhaW5lZCB3aXRoaW4gYEhvc3RJbnN0cnVjdGlvbnNRdWV1ZWAuXG4gKi9cbmV4cG9ydCBjb25zdCBlbnVtIEhvc3RJbnN0cnVjdGlvbnNRdWV1ZUluZGV4IHtcbiAgTGFzdFJlZ2lzdGVyZWREaXJlY3RpdmVJbmRleFBvc2l0aW9uID0gMCxcbiAgVmFsdWVzU3RhcnRQb3NpdGlvbiA9IDEsXG4gIERpcmVjdGl2ZUluZGV4T2Zmc2V0ID0gMCxcbiAgSW5zdHJ1Y3Rpb25Gbk9mZnNldCA9IDEsXG4gIFBhcmFtc09mZnNldCA9IDIsXG4gIFNpemUgPSAzLFxufVxuXG4vKipcbiAqIFVzZWQgYXMgYSBzdHlsaW5nIGFycmF5IHRvIGhvdXNlIHN0YXRpYyBjbGFzcyBhbmQgc3R5bGUgdmFsdWVzIHRoYXQgd2VyZSBleHRyYWN0ZWRcbiAqIGJ5IHRoZSBjb21waWxlciBhbmQgcGxhY2VkIGluIHRoZSBhbmltYXRpb24gY29udGV4dCB2aWEgYGVsZW1lbnRTdGFydGAgYW5kXG4gKiBgZWxlbWVudEhvc3RBdHRyc2AuXG4gKlxuICogU2VlIFtJbml0aWFsU3R5bGluZ1ZhbHVlc0luZGV4XSBmb3IgYSBicmVha2Rvd24gb2YgaG93IGFsbCB0aGlzIHdvcmtzLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIEluaXRpYWxTdHlsaW5nVmFsdWVzIGV4dGVuZHMgQXJyYXk8c3RyaW5nfGJvb2xlYW58bnVtYmVyfG51bGw+IHtcbiAgW0luaXRpYWxTdHlsaW5nVmFsdWVzSW5kZXguRGVmYXVsdE51bGxWYWx1ZVBvc2l0aW9uXTogbnVsbDtcbiAgW0luaXRpYWxTdHlsaW5nVmFsdWVzSW5kZXguQ2FjaGVkU3RyaW5nVmFsdWVQb3NpdGlvbl06IHN0cmluZ3xudWxsO1xufVxuXG4vKipcbiAqIFVzZWQgYXMgYW4gb2Zmc2V0L3Bvc2l0aW9uIGluZGV4IHRvIGZpZ3VyZSBvdXQgd2hlcmUgaW5pdGlhbCBzdHlsaW5nXG4gKiB2YWx1ZXMgYXJlIGxvY2F0ZWQuXG4gKlxuICogVXNlZCBhcyBhIHJlZmVyZW5jZSBwb2ludCB0byBwcm92aWRlIG1hcmtlcnMgdG8gYWxsIHN0YXRpYyBzdHlsaW5nXG4gKiB2YWx1ZXMgKHRoZSBpbml0aWFsIHN0eWxlIGFuZCBjbGFzcyB2YWx1ZXMgb24gYW4gZWxlbWVudCkgd2l0aGluIGFuXG4gKiBhcnJheSB3aXRoaW4gdGhlIGBTdHlsaW5nQ29udGV4dGAuIFRoaXMgYXJyYXkgY29udGFpbnMga2V5L3ZhbHVlIHBhaXJzXG4gKiB3aGVyZSB0aGUga2V5IGlzIHRoZSBzdHlsZSBwcm9wZXJ0eSBuYW1lIG9yIGNsYXNzTmFtZSBhbmQgdGhlIHZhbHVlIGlzXG4gKiB0aGUgc3R5bGUgdmFsdWUgb3Igd2hldGhlciBvciBub3QgYSBjbGFzcyBpcyBwcmVzZW50IG9uIHRoZSBlbG1lbnQuXG4gKlxuICogVGhlIGZpcnN0IHZhbHVlIGlzIGFsd2F5cyBudWxsIHNvIHRoYXQgYSBpbml0aWFsIGluZGV4IHZhbHVlIG9mXG4gKiBgMGAgd2lsbCBhbHdheXMgcG9pbnQgdG8gYSBudWxsIHZhbHVlLlxuICpcbiAqIFRoZSBzZWNvbmQgdmFsdWUgaXMgYWxzbyBhbHdheXMgbnVsbCB1bmxlc3MgYSBzdHJpbmctYmFzZWQgcmVwcmVzZW50YXRpb25cbiAqIG9mIHRoZSBzdHlsaW5nIGRhdGEgd2FzIGNvbnN0cnVjdGVkIChpdCBnZXRzIGNhY2hlZCBpbiB0aGlzIHNsb3QpLlxuICpcbiAqIElmIGEgPGRpdj4gZWxlbWVudHMgY29udGFpbnMgYSBsaXN0IG9mIHN0YXRpYyBzdHlsaW5nIHZhbHVlcyBsaWtlIHNvOlxuICpcbiAqIDxkaXYgY2xhc3M9XCJmb28gYmFyIGJhelwiIHN0eWxlPVwid2lkdGg6MTAwcHg7IGhlaWdodDoyMDBweDtcIj5cbiAqXG4gKiBUaGVuIHRoZSBpbml0aWFsIHN0eWxlcyBmb3IgdGhhdCB3aWxsIGxvb2sgbGlrZSBzbzpcbiAqXG4gKiBTdHlsZXM6XG4gKiBgYGBcbiAqIFN0eWxpbmdDb250ZXh0W0luaXRpYWxTdHlsZXNJbmRleF0gPSBbXG4gKiAgIG51bGwsIG51bGwsICd3aWR0aCcsICcxMDBweCcsIGhlaWdodCwgJzIwMHB4J1xuICogXVxuICogYGBgXG4gKlxuICogQ2xhc3NlczpcbiAqIGBgYFxuICogU3R5bGluZ0NvbnRleHRbSW5pdGlhbENsYXNzZXNJbmRleF0gPSBbXG4gKiAgIG51bGwsIG51bGwsICdmb28nLCB0cnVlLCAnYmFyJywgdHJ1ZSwgJ2JheicsIHRydWVcbiAqIF1cbiAqIGBgYFxuICpcbiAqIEluaXRpYWwgc3R5bGUgYW5kIGNsYXNzIGVudHJpZXMgaGF2ZSB0aGVpciBvd24gYXJyYXlzLiBUaGlzIGlzIGJlY2F1c2VcbiAqIGl0J3MgZWFzaWVyIHRvIGFkZCB0byB0aGUgZW5kIG9mIG9uZSBhcnJheSBhbmQgbm90IHRoZW4gaGF2ZSB0byB1cGRhdGVcbiAqIGV2ZXJ5IGNvbnRleHQgZW50cmllcycgcG9pbnRlciBpbmRleCB0byB0aGUgbmV3bHkgb2Zmc2V0ZWQgdmFsdWVzLlxuICpcbiAqIFdoZW4gcHJvcGVydHkgYmluZGluZHMgYXJlIGFkZGVkIHRvIGEgY29udGV4dCB0aGVuIGluaXRpYWwgc3R5bGUvY2xhc3NcbiAqIHZhbHVlcyB3aWxsIGFsc28gYmUgaW5zZXJ0ZWQgaW50byB0aGUgYXJyYXkuIFRoaXMgaXMgdG8gY3JlYXRlIGEgc3BhY2VcbiAqIGluIHRoZSBzaXR1YXRpb24gd2hlbiBhIGZvbGxvdy11cCBkaXJlY3RpdmUgaW5zZXJ0cyBzdGF0aWMgc3R5bGluZyBpbnRvXG4gKiB0aGUgYXJyYXkuIEJ5IGRlZmF1bHQsIHN0eWxlIHZhbHVlcyBhcmUgYG51bGxgIGFuZCBjbGFzcyB2YWx1ZXMgYXJlXG4gKiBgZmFsc2VgIHdoZW4gaW5zZXJ0ZWQgYnkgcHJvcGVydHkgYmluZGluZ3MuXG4gKlxuICogRm9yIGV4YW1wbGU6XG4gKiBgYGBcbiAqIDxkaXYgY2xhc3M9XCJmb28gYmFyIGJhelwiXG4gKiAgICAgIFtjbGFzcy5jYXJdPVwibXlDYXJFeHBcIlxuICogICAgICBzdHlsZT1cIndpZHRoOjEwMHB4OyBoZWlnaHQ6MjAwcHg7XCJcbiAqICAgICAgW3N0eWxlLm9wYWNpdHldPVwibXlPcGFjaXR5RXhwXCI+XG4gKiBgYGBcbiAqXG4gKiBXaWxsIGNvbnN0cnVjdCBpbml0aWFsIHN0eWxpbmcgdmFsdWVzIHRoYXQgbG9vayBsaWtlOlxuICpcbiAqIFN0eWxlczpcbiAqIGBgYFxuICogU3R5bGluZ0NvbnRleHRbSW5pdGlhbFN0eWxlc0luZGV4XSA9IFtcbiAqICAgbnVsbCwgbnVsbCwgJ3dpZHRoJywgJzEwMHB4JywgaGVpZ2h0LCAnMjAwcHgnLCAnb3BhY2l0eScsIG51bGxcbiAqIF1cbiAqIGBgYFxuICpcbiAqIENsYXNzZXM6XG4gKiBgYGBcbiAqIFN0eWxpbmdDb250ZXh0W0luaXRpYWxDbGFzc2VzSW5kZXhdID0gW1xuICogICBudWxsLCBudWxsLCAnZm9vJywgdHJ1ZSwgJ2JhcicsIHRydWUsICdiYXonLCB0cnVlLCAnY2FyJywgZmFsc2VcbiAqIF1cbiAqIGBgYFxuICpcbiAqIE5vdyBpZiBhIGRpcmVjdGl2ZSBjb21lcyBhbG9uZyBhbmQgaW50cm9kdWNlcyBgY2FyYCBhcyBhIHN0YXRpY1xuICogY2xhc3MgdmFsdWUgb3IgYG9wYWNpdHlgIHRoZW4gdGhvc2UgdmFsdWVzIHdpbGwgYmUgZmlsbGVkIGludG9cbiAqIHRoZSBpbml0aWFsIHN0eWxlcyBhcnJheS5cbiAqXG4gKiBGb3IgZXhhbXBsZTpcbiAqXG4gKiBgYGBcbiAqIEBEaXJlY3RpdmUoe1xuICogICBzZWxlY3RvcjogJ29wYWNpdHktY2FyLWRpcmVjdGl2ZScsXG4gKiAgIGhvc3Q6IHtcbiAqICAgICAnc3R5bGUnOiAnb3BhY2l0eTowLjUnLFxuICogICAgICdjbGFzcyc6ICdjYXInXG4gKiAgIH1cbiAqIH0pXG4gKiBjbGFzcyBPcGFjaXR5Q2FyRGlyZWN0aXZlIHt9XG4gKiBgYGBcbiAqXG4gKiBUaGlzIHdpbGwgcmVuZGVyIGl0c2VsZiBhczpcbiAqXG4gKiBTdHlsZXM6XG4gKiBgYGBcbiAqIFN0eWxpbmdDb250ZXh0W0luaXRpYWxTdHlsZXNJbmRleF0gPSBbXG4gKiAgIG51bGwsIG51bGwsICd3aWR0aCcsICcxMDBweCcsIGhlaWdodCwgJzIwMHB4JywgJ29wYWNpdHknLCAnMC41J1xuICogXVxuICogYGBgXG4gKlxuICogQ2xhc3NlczpcbiAqIGBgYFxuICogU3R5bGluZ0NvbnRleHRbSW5pdGlhbENsYXNzZXNJbmRleF0gPSBbXG4gKiAgIG51bGwsIG51bGwsICdmb28nLCB0cnVlLCAnYmFyJywgdHJ1ZSwgJ2JheicsIHRydWUsICdjYXInLCB0cnVlXG4gKiBdXG4gKiBgYGBcbiAqL1xuZXhwb3J0IGNvbnN0IGVudW0gSW5pdGlhbFN0eWxpbmdWYWx1ZXNJbmRleCB7XG4gIC8qKlxuICAgKiBUaGUgZmlyc3QgdmFsdWUgaXMgYWx3YXlzIGBudWxsYCBzbyB0aGF0IGBzdHlsZXNbMF0gPT0gbnVsbGAgZm9yIHVuYXNzaWduZWQgdmFsdWVzXG4gICAqL1xuICBEZWZhdWx0TnVsbFZhbHVlUG9zaXRpb24gPSAwLFxuXG4gIC8qKlxuICAgKiBVc2VkIGZvciBub24tc3R5bGluZyBjb2RlIHRvIGV4YW1pbmUgd2hhdCB0aGUgc3R5bGUgb3IgY2xhc3NOYW1lIHN0cmluZyBpczpcbiAgICogc3R5bGVzOiBbJ3dpZHRoJywgJzEwMHB4JywgMCwgJ29wYWNpdHknLCBudWxsLCAwLCAnaGVpZ2h0JywgJzIwMHB4JywgMF1cbiAgICogICAgPT4gaW5pdGlhbFN0eWxlc1tDYWNoZWRTdHJpbmdWYWx1ZVBvc2l0aW9uXSA9ICd3aWR0aDoxMDBweDtoZWlnaHQ6MjAwcHgnO1xuICAgKiBjbGFzc2VzOiBbJ2ZvbycsIHRydWUsIDAsICdiYXInLCBmYWxzZSwgMCwgJ2JheicsIHRydWUsIDBdXG4gICAqICAgID0+IGluaXRpYWxDbGFzc2VzW0NhY2hlZFN0cmluZ1ZhbHVlUG9zaXRpb25dID0gJ2ZvbyBiYXInO1xuICAgKlxuICAgKiBOb3RlIHRoYXQgdGhpcyB2YWx1ZSBpcyBgbnVsbGAgYnkgZGVmYXVsdCBhbmQgaXQgd2lsbCBvbmx5IGJlIHBvcHVsYXRlZFxuICAgKiBvbmNlIGBnZXRJbml0aWFsU3R5bGVTdHJpbmdWYWx1ZWAgb3IgYGdldEluaXRpYWxDbGFzc05hbWVWYWx1ZWAgaXMgZXhlY3V0ZWQuXG4gICAqL1xuICBDYWNoZWRTdHJpbmdWYWx1ZVBvc2l0aW9uID0gMSxcblxuICAvKipcbiAgICogV2hlcmUgdGhlIHN0eWxlIG9yIGNsYXNzIHZhbHVlcyBzdGFydCBpbiB0aGUgdHVwbGVcbiAgICovXG4gIEtleVZhbHVlU3RhcnRQb3NpdGlvbiA9IDIsXG5cbiAgLyoqXG4gICAqIFRoZSBvZmZzZXQgdmFsdWUgKGluZGV4ICsgb2Zmc2V0KSBmb3IgdGhlIHByb3BlcnR5IHZhbHVlIGZvciBlYWNoIHN0eWxlL2NsYXNzIGVudHJ5XG4gICAqL1xuICBQcm9wT2Zmc2V0ID0gMCxcblxuICAvKipcbiAgICogVGhlIG9mZnNldCB2YWx1ZSAoaW5kZXggKyBvZmZzZXQpIGZvciB0aGUgc3R5bGUvY2xhc3MgdmFsdWUgZm9yIGVhY2ggc3R5bGUvY2xhc3MgZW50cnlcbiAgICovXG4gIFZhbHVlT2Zmc2V0ID0gMSxcblxuICAvKipcbiAgICogVGhlIG9mZnNldCB2YWx1ZSAoaW5kZXggKyBvZmZzZXQpIGZvciB0aGUgc3R5bGUvY2xhc3MgZGlyZWN0aXZlIG93bmVyIGZvciBlYWNoIHN0eWxlL2NsYXNzXG4gICAgIGVudHJ5XG4gICAqL1xuICBEaXJlY3RpdmVPd25lck9mZnNldCA9IDIsXG5cbiAgLyoqXG4gICAqIFRoZSBmaXJzdCBiaXQgc2V0IGFzaWRlIHRvIG1hcmsgaWYgdGhlIGluaXRpYWwgc3R5bGUgd2FzIGFscmVhZHkgcmVuZGVyZVxuICAgKi9cbiAgQXBwbGllZEZsYWdCaXRQb3NpdGlvbiA9IDBiMCxcbiAgQXBwbGllZEZsYWdCaXRMZW5ndGggPSAxLFxuXG4gIC8qKlxuICAgKiBUaGUgdG90YWwgc2l6ZSBmb3IgZWFjaCBzdHlsZS9jbGFzcyBlbnRyeSAocHJvcCArIHZhbHVlICsgZGlyZWN0aXZlT3duZXIpXG4gICAqL1xuICBTaXplID0gM1xufVxuXG4vKipcbiAqIEFuIGFycmF5IGxvY2F0ZWQgaW4gdGhlIFN0eWxpbmdDb250ZXh0IHRoYXQgaG91c2VzIGFsbCBkaXJlY3RpdmUgaW5zdGFuY2VzIGFuZCBhZGRpdGlvbmFsXG4gKiBkYXRhIGFib3V0IHRoZW0uXG4gKlxuICogRWFjaCBlbnRyeSBpbiB0aGlzIGFycmF5IHJlcHJlc2VudHMgYSBzb3VyY2Ugb2Ygd2hlcmUgc3R5bGUvY2xhc3MgYmluZGluZyB2YWx1ZXMgY291bGRcbiAqIGNvbWUgZnJvbS4gQnkgZGVmYXVsdCwgdGhlcmUgaXMgYWx3YXlzIGF0IGxlYXN0IG9uZSBkaXJlY3RpdmUgaGVyZSB3aXRoIGEgbnVsbCB2YWx1ZSBhbmRcbiAqIHRoYXQgcmVwcmVzZW50cyBiaW5kaW5ncyB0aGF0IGxpdmUgZGlyZWN0bHkgb24gYW4gZWxlbWVudCBpbiB0aGUgdGVtcGxhdGUgKG5vdCBob3N0IGJpbmRpbmdzKS5cbiAqXG4gKiBFYWNoIHN1Y2Nlc3NpdmUgZW50cnkgaW4gdGhlIGFycmF5IGlzIGFuIGFjdHVhbCBpbnN0YW5jZSBvZiBhIGRpcmVjdGl2ZSBhcyB3ZWxsIGFzIHNvbWVcbiAqIGFkZGl0aW9uYWwgaW5mbyBhYm91dCB0aGF0IGVudHJ5LlxuICpcbiAqIEFuIGVudHJ5IHdpdGhpbiB0aGlzIGFycmF5IGhhcyB0aGUgZm9sbG93aW5nIHZhbHVlczpcbiAqIFswXSA9IFRoZSBpbnN0YW5jZSBvZiB0aGUgZGlyZWN0aXZlICh0aGUgZmlyc3QgZW50cnkgaXMgbnVsbCBiZWNhdXNlIGl0cyByZXNlcnZlZCBmb3IgdGhlXG4gKiAgICAgICB0ZW1wbGF0ZSlcbiAqIFsxXSA9IFRoZSBwb2ludGVyIHRoYXQgdGVsbHMgd2hlcmUgdGhlIHNpbmdsZSBzdHlsaW5nIChzdHVmZiBsaWtlIFtjbGFzcy5mb29dIGFuZCBbc3R5bGUucHJvcF0pXG4gKiAgICAgICBvZmZzZXQgdmFsdWVzIGFyZSBsb2NhdGVkLiBUaGlzIHZhbHVlIHdpbGwgYWxsb3cgZm9yIGEgYmluZGluZyBpbnN0cnVjdGlvbiB0byBmaW5kIGV4YWN0bHlcbiAqICAgICAgIHdoZXJlIGEgc3R5bGUgaXMgbG9jYXRlZC5cbiAqIFsyXSA9IFdoZXRoZXIgb3Igbm90IHRoZSBkaXJlY3RpdmUgaGFzIGFueSBzdHlsaW5nIHZhbHVlcyB0aGF0IGFyZSBkaXJ0eS4gVGhpcyBpcyB1c2VkIGFzXG4gKiAgICAgICByZWZlcmVuY2Ugd2l0aGluIHRoZSBgcmVuZGVyU3R5bGluZ2AgZnVuY3Rpb24gdG8gZGVjaWRlIHdoZXRoZXIgdG8gc2tpcCBpdGVyYXRpbmdcbiAqICAgICAgIHRocm91Z2ggdGhlIGNvbnRleHQgd2hlbiByZW5kZXJpbmcgaXMgZXhlY3V0ZWQuXG4gKiBbM10gPSBUaGUgc3R5bGVTYW5pdGl6ZXIgaW5zdGFuY2UgdGhhdCBpcyBhc3NpZ25lZCB0byB0aGUgZGlyZWN0aXZlLiBBbHRob3VnaCBpdCdzIHVubGlrZWx5LFxuICogICAgICAgYSBkaXJlY3RpdmUgY291bGQgaW50cm9kdWNlIGl0cyBvd24gc3BlY2lhbCBzdHlsZSBzYW5pdGl6ZXIgYW5kIGZvciB0aGlzIHJlYWNoIGVhY2hcbiAqICAgICAgIGRpcmVjdGl2ZSB3aWxsIGdldCBpdHMgb3duIHNwYWNlIGZvciBpdCAoaWYgbnVsbCB0aGVuIHRoZSB2ZXJ5IGZpcnN0IHNhbml0aXplciBpcyB1c2VkKS5cbiAqXG4gKiBFYWNoIHRpbWUgYSBuZXcgZGlyZWN0aXZlIGlzIGFkZGVkIGl0IHdpbGwgaW5zZXJ0IHRoZXNlIGZvdXIgdmFsdWVzIGF0IHRoZSBlbmQgb2YgdGhlIGFycmF5LlxuICogV2hlbiB0aGlzIGFycmF5IGlzIGV4YW1pbmVkIHRoZW4gdGhlIHJlc3VsdGluZyBkaXJlY3RpdmVJbmRleCB3aWxsIGJlIHJlc29sdmVkIGJ5IGRpdmlkaW5nIHRoZVxuICogaW5kZXggdmFsdWUgYnkgdGhlIHNpemUgb2YgdGhlIGFycmF5IGVudHJpZXMgKHNvIGlmIERpckEgaXMgYXQgc3BvdCA4IHRoZW4gaXRzIGluZGV4IHdpbGwgYmUgMikuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgRGlyZWN0aXZlUmVnaXN0cnlWYWx1ZXMgZXh0ZW5kcyBBcnJheTxudWxsfHt9fGJvb2xlYW58bnVtYmVyfFN0eWxlU2FuaXRpemVGbj4ge1xuICBbRGlyZWN0aXZlUmVnaXN0cnlWYWx1ZXNJbmRleC5TaW5nbGVQcm9wVmFsdWVzSW5kZXhPZmZzZXRdOiBudW1iZXI7XG4gIFtEaXJlY3RpdmVSZWdpc3RyeVZhbHVlc0luZGV4LlN0eWxlU2FuaXRpemVyT2Zmc2V0XTogU3R5bGVTYW5pdGl6ZUZufG51bGw7XG59XG5cbi8qKlxuICogQW4gZW51bSB0aGF0IG91dGxpbmVzIHRoZSBvZmZzZXQvcG9zaXRpb24gdmFsdWVzIGZvciBlYWNoIGRpcmVjdGl2ZSBlbnRyeSBhbmQgaXRzIGRhdGFcbiAqIHRoYXQgYXJlIGhvdXNlZCBpbnNpZGUgb2YgW0RpcmVjdGl2ZVJlZ2lzdHJ5VmFsdWVzXS5cbiAqL1xuZXhwb3J0IGNvbnN0IGVudW0gRGlyZWN0aXZlUmVnaXN0cnlWYWx1ZXNJbmRleCB7XG4gIFNpbmdsZVByb3BWYWx1ZXNJbmRleE9mZnNldCA9IDAsXG4gIFN0eWxlU2FuaXRpemVyT2Zmc2V0ID0gMSxcbiAgU2l6ZSA9IDJcbn1cblxuLyoqXG4gKiBBbiBhcnJheSB0aGF0IGNvbnRhaW5zIHRoZSBpbmRleCBwb2ludGVyIHZhbHVlcyBmb3IgZXZlcnkgc2luZ2xlIHN0eWxpbmcgcHJvcGVydHlcbiAqIHRoYXQgZXhpc3RzIGluIHRoZSBjb250ZXh0IGFuZCBmb3IgZXZlcnkgZGlyZWN0aXZlLiBJdCBhbHNvIGNvbnRhaW5zIHRoZSB0b3RhbFxuICogc2luZ2xlIHN0eWxlcyBhbmQgc2luZ2xlIGNsYXNzZXMgdGhhdCBleGlzdHMgaW4gdGhlIGNvbnRleHQgYXMgdGhlIGZpcnN0IHR3byB2YWx1ZXMuXG4gKlxuICogTGV0J3Mgc2F5IHdlIGhhdmUgdGhlIGZvbGxvd2luZyB0ZW1wbGF0ZSBjb2RlOlxuICpcbiAqIDxkaXYgW3N0eWxlLndpZHRoXT1cIm15V2lkdGhcIlxuICogICAgICBbc3R5bGUuaGVpZ2h0XT1cIm15SGVpZ2h0XCJcbiAqICAgICAgW2NsYXNzLmZsaXBwZWRdPVwiZmxpcENsYXNzXCJcbiAqICAgICAgZGlyZWN0aXZlLXdpdGgtb3BhY2l0eT5cbiAqICAgICAgZGlyZWN0aXZlLXdpdGgtZm9vLWJhci1jbGFzc2VzPlxuICpcbiAqIFdlIGhhdmUgdHdvIGRpcmVjdGl2ZSBhbmQgdGVtcGxhdGUtYmluZGluZyBzb3VyY2VzLFxuICogMiArIDEgc3R5bGVzIGFuZCAxICsgMSBjbGFzc2VzLiBXaGVuIHRoZSBiaW5kaW5ncyBhcmVcbiAqIHJlZ2lzdGVyZWQgdGhlIFNpbmdsZVByb3BPZmZzZXRzIGFycmF5IHdpbGwgbG9vayBsaWtlIHNvOlxuICpcbiAqIHNfMC9jXzAgPSB0ZW1wbGF0ZSBkaXJlY3RpdmUgdmFsdWVcbiAqIHNfMS9jXzEgPSBkaXJlY3RpdmUgb25lIChkaXJlY3RpdmUtd2l0aC1vcGFjaXR5KVxuICogc18yL2NfMiA9IGRpcmVjdGl2ZSB0d28gKGRpcmVjdGl2ZS13aXRoLWZvby1iYXItY2xhc3NlcylcbiAqXG4gKiBbMywgMiwgMiwgMSwgc18wMCwgczAxLCBjXzAxLCAxLCAwLCBzXzEwLCAwLCAxLCBjXzIwXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgU2luZ2xlUHJvcE9mZnNldFZhbHVlcyBleHRlbmRzIEFycmF5PG51bWJlcj4ge1xuICBbU2luZ2xlUHJvcE9mZnNldFZhbHVlc0luZGV4LlN0eWxlc0NvdW50UG9zaXRpb25dOiBudW1iZXI7XG4gIFtTaW5nbGVQcm9wT2Zmc2V0VmFsdWVzSW5kZXguQ2xhc3Nlc0NvdW50UG9zaXRpb25dOiBudW1iZXI7XG59XG5cbi8qKlxuICogQW4gZW51bSB0aGF0IG91dGxpbmVzIHRoZSBvZmZzZXQvcG9zaXRpb24gdmFsdWVzIGZvciBlYWNoIHNpbmdsZSBwcm9wL2NsYXNzIGVudHJ5XG4gKiB0aGF0IGFyZSBob3VzZWQgaW5zaWRlIG9mIFtTaW5nbGVQcm9wT2Zmc2V0VmFsdWVzXS5cbiAqL1xuZXhwb3J0IGNvbnN0IGVudW0gU2luZ2xlUHJvcE9mZnNldFZhbHVlc0luZGV4IHtcbiAgU3R5bGVzQ291bnRQb3NpdGlvbiA9IDAsXG4gIENsYXNzZXNDb3VudFBvc2l0aW9uID0gMSxcbiAgVmFsdWVTdGFydFBvc2l0aW9uID0gMlxufVxuXG4vKipcbiAqIFVzZWQgYSByZWZlcmVuY2UgZm9yIGFsbCBtdWx0aSBzdHlsaW5nIHZhbHVlcyAodmFsdWVzIHRoYXQgYXJlIGFzc2lnbmVkIHZpYSB0aGVcbiAqIGBbc3R5bGVdYCBhbmQgYFtjbGFzc11gIGJpbmRpbmdzKS5cbiAqXG4gKiBTaW5nbGUtc3R5bGluZyBwcm9wZXJ0aWVzICh0aGluZ3Mgc2V0IHZpYSBgW3N0eWxlLnByb3BdYCBhbmQgYFtjbGFzcy5uYW1lXWAgYmluZGluZ3MpXG4gKiBhcmUgbm90IGhhbmRsZWQgdXNpbmcgdGhlIHNhbWUgYXBwcm9hY2ggYXMgbXVsdGktc3R5bGluZyBiaW5kaW5ncyAoc3VjaCBhcyBgW3N0eWxlXWBcbiAqIGBbY2xhc3NdYCBiaW5kaW5ncykuXG4gKlxuICogTXVsdGktc3R5bGluZyBiaW5kaW5ncyByZWx5IG9uIGEgZGlmZmluZyBhbGdvcml0aG0gdG8gZmlndXJlIG91dCB3aGF0IHByb3BlcnRpZXMgaGF2ZSBiZWVuIGFkZGVkLFxuICogcmVtb3ZlZCBhbmQgbW9kaWZpZWQuIE11bHRpLXN0eWxpbmcgcHJvcGVydGllcyBhcmUgYWxzbyBldmFsdWF0ZWQgYWNyb3NzIGRpcmVjdGl2ZXMtLXdoaWNoIG1lYW5zXG4gKiB0aGF0IEFuZ3VsYXIgc3VwcG9ydHMgaGF2aW5nIG11bHRpcGxlIGRpcmVjdGl2ZXMgYWxsIHdyaXRlIHRvIHRoZSBzYW1lIGBbc3R5bGVdYCBhbmQgYFtjbGFzc11gXG4gKiBiaW5kaW5ncyAodXNpbmcgaG9zdCBiaW5kaW5ncykgZXZlbiBpZiB0aGUgYFtzdHlsZV1gIGFuZC9vciBgW2NsYXNzXWAgYmluZGluZ3MgYXJlIGJlaW5nIHdyaXR0ZW5cbiAqIHRvIG9uIHRoZSB0ZW1wbGF0ZSBlbGVtZW50LlxuICpcbiAqIEFsbCBtdWx0aS1zdHlsaW5nIHZhbHVlcyB0aGF0IGFyZSB3cml0dGVuIHRvIGFuIGVsZW1lbnQgKHdoZXRoZXIgaXQgYmUgZnJvbSB0aGUgdGVtcGxhdGUgb3IgYW55XG4gKiBkaXJlY3RpdmVzIGF0dGFjaGVkIHRvIHRoZSBlbGVtZW50KSBhcmUgYWxsIHdyaXR0ZW4gaW50byB0aGUgYE1hcEJhc2VkT2Zmc2V0VmFsdWVzYCBhcnJheS4gKE5vdGVcbiAqIHRoYXQgdGhlcmUgYXJlIHR3byBhcnJheXM6IG9uZSBmb3Igc3R5bGVzIGFuZCBhbm90aGVyIGZvciBjbGFzc2VzLilcbiAqXG4gKiBUaGlzIGFycmF5IGlzIHNoYXBlZCBpbiB0aGUgZm9sbG93aW5nIHdheTpcbiAqXG4gKiBbMF0gID0gVGhlIHRvdGFsIGFtb3VudCBvZiB1bmlxdWUgbXVsdGktc3R5bGUgb3IgbXVsdGktY2xhc3MgZW50cmllcyB0aGF0IGV4aXN0IGN1cnJlbnRseSBpbiB0aGVcbiAqICAgICAgICBjb250ZXh0LlxuICogWzErXSA9IENvbnRhaW5zIGFuIGVudHJ5IG9mIGZvdXIgdmFsdWVzIC4uLiBFYWNoIGVudHJ5IGlzIGEgdmFsdWUgYXNzaWduZWQgYnkgYVxuICogYFtzdHlsZV1gL2BbY2xhc3NdYFxuICogICAgICAgIGJpbmRpbmcgKHdlIGNhbGwgdGhpcyBhICoqc291cmNlKiopLlxuICpcbiAqICAgICAgICBBbiBleGFtcGxlIGVudHJ5IGxvb2tzIGxpa2Ugc28gKGF0IGEgZ2l2ZW4gYGlgIGluZGV4KTpcbiAqICAgICAgICBbaSArIDBdID0gV2hldGhlciBvciBub3QgdGhlIHZhbHVlIGlzIGRpcnR5XG4gKlxuICogICAgICAgIFtpICsgMV0gPSBUaGUgaW5kZXggb2Ygd2hlcmUgdGhlIG1hcC1iYXNlZCB2YWx1ZXNcbiAqICAgICAgICAgICAgICAgICAgKGZvciB0aGlzICoqc291cmNlKiopIHN0YXJ0IHdpdGhpbiB0aGUgY29udGV4dFxuICpcbiAqICAgICAgICBbaSArIDJdID0gVGhlIHVudG91Y2hlZCwgbGFzdCBzZXQgdmFsdWUgb2YgdGhlIGJpbmRpbmdcbiAqXG4gKiAgICAgICAgW2kgKyAzXSA9IFRoZSB0b3RhbCBhbW91bnQgb2YgdW5xaXVlIGJpbmRpbmcgdmFsdWVzIHRoYXQgd2VyZVxuICogICAgICAgICAgICAgICAgICBleHRyYWN0ZWQgYW5kIHNldCBpbnRvIHRoZSBjb250ZXh0LiAoTm90ZSB0aGF0IHRoaXMgdmFsdWUgZG9lc1xuICogICAgICAgICAgICAgICAgICBub3QgcmVmbGVjdCB0aGUgdG90YWwgYW1vdW50IG9mIHZhbHVlcyB3aXRoaW4gdGhlIGJpbmRpbmdcbiAqICAgICAgICAgICAgICAgICAgdmFsdWUgKHNpbmNlIGl0J3MgYSBtYXApLCBidXQgaW5zdGVhZCByZWZsZWN0cyB0aGUgdG90YWwgdmFsdWVzXG4gKiAgICAgICAgICAgICAgICAgIHRoYXQgd2VyZSBub3QgdXNlZCBieSBhbm90aGVyIGRpcmVjdGl2ZSkuXG4gKlxuICogRWFjaCB0aW1lIGEgZGlyZWN0aXZlIChvciB0ZW1wbGF0ZSkgd3JpdGVzIGEgdmFsdWUgdG8gYSBgW2NsYXNzXWAvYFtzdHlsZV1gIGJpbmRpbmcgdGhlbiB0aGVcbiAqIHN0eWxpbmcgZGlmZmluZyBhbGdvcml0aG0gY29kZSB3aWxsIGRlY2lkZSB3aGV0aGVyIG9yIG5vdCB0byB1cGRhdGUgdGhlIHZhbHVlIGJhc2VkIG9uIHRoZVxuICogZm9sbG93aW5nIHJ1bGVzOlxuICpcbiAqIDEuIElmIGEgbW9yZSBpbXBvcnRhbnQgZGlyZWN0aXZlIChlaXRoZXIgdGhlIHRlbXBsYXRlIG9yIGEgZGlyZWN0aXZlIHRoYXQgd2FzIHJlZ2lzdGVyZWRcbiAqICAgIGJlZm9yZWhhbmQpIGhhcyB3cml0dGVuIGEgc3BlY2lmaWMgc3R5bGluZyB2YWx1ZSBpbnRvIHRoZSBjb250ZXh0IHRoZW4gYW55IGZvbGxvdy11cCBzdHlsaW5nXG4gKiAgICB2YWx1ZXMgKHNldCBieSBhbm90aGVyIGRpcmVjdGl2ZSB2aWEgaXRzIGBbc3R5bGVdYCBhbmQvb3IgYFtjbGFzc11gIGhvc3QgYmluZGluZykgd2lsbCBub3QgYmVcbiAqICAgIGFibGUgdG8gc2V0IGl0LiBUaGlzIGlzIGJlY2F1c2UgdGhlIGZvcm1lciBkaXJlY3RpdmUgaGFzIHByaW9ydHkuXG4gKiAyLiBPbmx5IGlmIGEgZm9ybWVyIGRpcmVjdGl2ZSBoYXMgc2V0IGEgc3BlY2lmaWMgc3R5bGluZyB2YWx1ZSB0byBudWxsICh3aGV0aGVyIGJ5IGFjdHVhbGx5XG4gKiAgICBzZXR0aW5nIGl0IHRvIG51bGwgb3Igbm90IGluY2x1ZGluZyBpdCBpbiBpcyBtYXAgdmFsdWUpIHRoZW4gYSBsZXNzIGltcG9yYXRhbnQgZGlyZWN0aXZlIGNhblxuICogICAgc2V0IGl0cyBvd24gdmFsdWUuXG4gKlxuICogIyMgSG93IHRoZSBtYXAtYmFzZWQgc3R5bGluZyBhbGdvcml0aG0gdXBkYXRlcyBpdHNlbGZcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBNYXBCYXNlZE9mZnNldFZhbHVlcyBleHRlbmRzIEFycmF5PGFueT4ge1xuICBbTWFwQmFzZWRPZmZzZXRWYWx1ZXNJbmRleC5FbnRyaWVzQ291bnRQb3NpdGlvbl06IG51bWJlcjtcbn1cblxuZXhwb3J0IGNvbnN0IGVudW0gTWFwQmFzZWRPZmZzZXRWYWx1ZXNJbmRleCB7XG4gIEVudHJpZXNDb3VudFBvc2l0aW9uID0gMCxcbiAgVmFsdWVzU3RhcnRQb3NpdGlvbiA9IDEsXG4gIERpcnR5RmxhZ09mZnNldCA9IDAsXG4gIFBvc2l0aW9uU3RhcnRPZmZzZXQgPSAxLFxuICBWYWx1ZU9mZnNldCA9IDIsXG4gIFZhbHVlQ291bnRPZmZzZXQgPSAzLFxuICBTaXplID0gNFxufVxuXG4vKipcbiAqIFVzZWQgdG8gc2V0IHRoZSBjb250ZXh0IHRvIGJlIGRpcnR5IG9yIG5vdCBib3RoIG9uIHRoZSBtYXN0ZXIgZmxhZyAocG9zaXRpb24gMSlcbiAqIG9yIGZvciBlYWNoIHNpbmdsZS9tdWx0aSBwcm9wZXJ0eSB0aGF0IGV4aXN0cyBpbiB0aGUgY29udGV4dC5cbiAqL1xuZXhwb3J0IGNvbnN0IGVudW0gU3R5bGluZ0ZsYWdzIHtcbiAgLy8gSW1wbGllcyBubyBjb25maWd1cmF0aW9uc1xuICBOb25lID0gMGIwMDAwMCxcbiAgLy8gV2hldGhlciBvciBub3QgdGhlIGVudHJ5IG9yIGNvbnRleHQgaXRzZWxmIGlzIGRpcnR5XG4gIERpcnR5ID0gMGIwMDAwMSxcbiAgLy8gV2hldGhlciBvciBub3QgdGhpcyBpcyBhIGNsYXNzLWJhc2VkIGFzc2lnbm1lbnRcbiAgQ2xhc3MgPSAwYjAwMDEwLFxuICAvLyBXaGV0aGVyIG9yIG5vdCBhIHNhbml0aXplciB3YXMgYXBwbGllZCB0byB0aGlzIHByb3BlcnR5XG4gIFNhbml0aXplID0gMGIwMDEwMCxcbiAgLy8gV2hldGhlciBvciBub3QgYW55IHBsYXllciBidWlsZGVycyB3aXRoaW4gbmVlZCB0byBwcm9kdWNlIG5ldyBwbGF5ZXJzXG4gIFBsYXllckJ1aWxkZXJzRGlydHkgPSAwYjAxMDAwLFxuICAvLyBUaGUgbWF4IGFtb3VudCBvZiBiaXRzIHVzZWQgdG8gcmVwcmVzZW50IHRoZXNlIGNvbmZpZ3VyYXRpb24gdmFsdWVzXG4gIEJpbmRpbmdBbGxvY2F0aW9uTG9ja2VkID0gMGIxMDAwMCxcbiAgQml0Q291bnRTaXplID0gNSxcbiAgLy8gVGhlcmUgYXJlIG9ubHkgZml2ZSBiaXRzIGhlcmVcbiAgQml0TWFzayA9IDBiMTExMTFcbn1cblxuLyoqIFVzZWQgYXMgbnVtZXJpYyBwb2ludGVyIHZhbHVlcyB0byBkZXRlcm1pbmUgd2hhdCBjZWxscyB0byB1cGRhdGUgaW4gdGhlIGBTdHlsaW5nQ29udGV4dGAgKi9cbmV4cG9ydCBjb25zdCBlbnVtIFN0eWxpbmdJbmRleCB7XG4gIC8vIFBvc2l0aW9uIG9mIHdoZXJlIHRoZSBpbml0aWFsIHN0eWxlcyBhcmUgc3RvcmVkIGluIHRoZSBzdHlsaW5nIGNvbnRleHRcbiAgLy8gVGhpcyBpbmRleCBtdXN0IGFsaWduIHdpdGggSE9TVCwgc2VlIGludGVyZmFjZXMvdmlldy50c1xuICBFbGVtZW50UG9zaXRpb24gPSAwLFxuICAvLyBJbmRleCBvZiBsb2NhdGlvbiB3aGVyZSB0aGUgc3RhcnQgb2Ygc2luZ2xlIHByb3BlcnRpZXMgYXJlIHN0b3JlZC4gKGB1cGRhdGVTdHlsZVByb3BgKVxuICBNYXN0ZXJGbGFnUG9zaXRpb24gPSAxLFxuICAvLyBQb3NpdGlvbiBvZiB3aGVyZSB0aGUgcmVnaXN0ZXJlZCBkaXJlY3RpdmVzIGV4aXN0IGZvciB0aGlzIHN0eWxpbmcgY29udGV4dFxuICBEaXJlY3RpdmVSZWdpc3RyeVBvc2l0aW9uID0gMixcbiAgLy8gUG9zaXRpb24gb2Ygd2hlcmUgdGhlIGluaXRpYWwgc3R5bGVzIGFyZSBzdG9yZWQgaW4gdGhlIHN0eWxpbmcgY29udGV4dFxuICBJbml0aWFsU3R5bGVWYWx1ZXNQb3NpdGlvbiA9IDMsXG4gIEluaXRpYWxDbGFzc1ZhbHVlc1Bvc2l0aW9uID0gNCxcbiAgLy8gSW5kZXggb2YgbG9jYXRpb24gd2hlcmUgdGhlIGNsYXNzIGluZGV4IG9mZnNldCB2YWx1ZSBpcyBsb2NhdGVkXG4gIFNpbmdsZVByb3BPZmZzZXRQb3NpdGlvbnMgPSA1LFxuICAvLyBQb3NpdGlvbiBvZiB3aGVyZSB0aGUgbGFzdCBzdHJpbmctYmFzZWQgQ1NTIGNsYXNzIHZhbHVlIHdhcyBzdG9yZWQgKG9yIGEgY2FjaGVkIHZlcnNpb24gb2YgdGhlXG4gIC8vIGluaXRpYWwgc3R5bGVzIHdoZW4gYSBbY2xhc3NdIGRpcmVjdGl2ZSBpcyBwcmVzZW50KVxuICBDYWNoZWRNdWx0aUNsYXNzZXMgPSA2LFxuICAvLyBQb3NpdGlvbiBvZiB3aGVyZSB0aGUgbGFzdCBzdHJpbmctYmFzZWQgQ1NTIGNsYXNzIHZhbHVlIHdhcyBzdG9yZWRcbiAgQ2FjaGVkTXVsdGlTdHlsZXMgPSA3LFxuICAvLyBNdWx0aSBhbmQgc2luZ2xlIGVudHJpZXMgYXJlIHN0b3JlZCBpbiBgU3R5bGluZ0NvbnRleHRgIGFzOiBGbGFnOyBQcm9wZXJ0eU5hbWU7ICBQcm9wZXJ0eVZhbHVlXG4gIC8vIFBvc2l0aW9uIG9mIHdoZXJlIHRoZSBpbml0aWFsIHN0eWxlcyBhcmUgc3RvcmVkIGluIHRoZSBzdHlsaW5nIGNvbnRleHRcbiAgSG9zdEluc3RydWN0aW9uc1F1ZXVlID0gOCxcbiAgUGxheWVyQ29udGV4dCA9IDksXG4gIC8vIExvY2F0aW9uIG9mIHNpbmdsZSAocHJvcCkgdmFsdWUgZW50cmllcyBhcmUgc3RvcmVkIHdpdGhpbiB0aGUgY29udGV4dFxuICBTaW5nbGVTdHlsZXNTdGFydFBvc2l0aW9uID0gMTAsXG4gIEZsYWdzT2Zmc2V0ID0gMCxcbiAgUHJvcGVydHlPZmZzZXQgPSAxLFxuICBWYWx1ZU9mZnNldCA9IDIsXG4gIFBsYXllckJ1aWxkZXJJbmRleE9mZnNldCA9IDMsXG4gIC8vIFNpemUgb2YgZWFjaCBtdWx0aSBvciBzaW5nbGUgZW50cnkgKGZsYWcgKyBwcm9wICsgdmFsdWUgKyBwbGF5ZXJCdWlsZGVySW5kZXgpXG4gIFNpemUgPSA0LFxuICAvLyBFYWNoIGZsYWcgaGFzIGEgYmluYXJ5IGRpZ2l0IGxlbmd0aCBvZiB0aGlzIHZhbHVlXG4gIEJpdENvdW50U2l6ZSA9IDE0LCAgLy8gKDMyIC0gNCkgLyAyID0gfjE0XG4gIC8vIFRoZSBiaW5hcnkgZGlnaXQgdmFsdWUgYXMgYSBtYXNrXG4gIEJpdE1hc2sgPSAwYjExMTExMTExMTExMTExLCAgLy8gMTQgYml0c1xufVxuXG4vKipcbiAqIEFuIGVudW0gdGhhdCBvdXRsaW5lcyB0aGUgYml0IGZsYWcgZGF0YSBmb3IgZGlyZWN0aXZlIG93bmVyIGFuZCBwbGF5ZXIgaW5kZXhcbiAqIHZhbHVlcyB0aGF0IGV4aXN0IHdpdGhpbiBlbiBlbnRyeSB0aGF0IGxpdmVzIGluIHRoZSBTdHlsaW5nQ29udGV4dC5cbiAqXG4gKiBUaGUgdmFsdWVzIGhlcmUgc3BsaXQgYSBudW1iZXIgdmFsdWUgaW50byB0d28gc2V0cyBvZiBiaXRzOlxuICogIC0gVGhlIGZpcnN0IDE2IGJpdHMgYXJlIHVzZWQgdG8gc3RvcmUgdGhlIGRpcmVjdGl2ZUluZGV4IHRoYXQgb3ducyB0aGlzIHN0eWxlIHZhbHVlXG4gKiAgLSBUaGUgb3RoZXIgMTYgYml0cyBhcmUgdXNlZCB0byBzdG9yZSB0aGUgcGxheWVyQnVpbGRlckluZGV4IHRoYXQgaXMgYXR0YWNoZWQgdG8gdGhpcyBzdHlsZVxuICovXG5leHBvcnQgY29uc3QgZW51bSBEaXJlY3RpdmVPd25lckFuZFBsYXllckJ1aWxkZXJJbmRleCB7XG4gIEJpdENvdW50U2l6ZSA9IDE2LFxuICBCaXRNYXNrID0gMGIxMTExMTExMTExMTExMTExXG59XG5cbi8qKlxuICogVGhlIGRlZmF1bHQgZGlyZWN0aXZlIHN0eWxpbmcgaW5kZXggdmFsdWUgZm9yIHRlbXBsYXRlLWJhc2VkIGJpbmRpbmdzLlxuICpcbiAqIEFsbCBob3N0LWxldmVsIGJpbmRpbmdzIChlLmcuIGBob3N0U3R5bGVQcm9wYCBhbmQgYGhvc3RDbGFzc01hcGApIGFyZVxuICogYXNzaWduZWQgYSBkaXJlY3RpdmUgc3R5bGluZyBpbmRleCB2YWx1ZSBiYXNlZCBvbiB0aGUgY3VycmVudCBkaXJlY3RpdmVcbiAqIHVuaXF1ZUlkIGFuZCB0aGUgZGlyZWN0aXZlIHN1cGVyLWNsYXNzIGluaGVyaXRhbmNlIGRlcHRoLiBCdXQgZm9yIHRlbXBsYXRlXG4gKiBiaW5kaW5ncyB0aGV5IGFsd2F5cyBoYXZlIHRoZSBzYW1lIGRpcmVjdGl2ZSBzdHlsaW5nIGluZGV4IHZhbHVlLlxuICovXG5leHBvcnQgY29uc3QgREVGQVVMVF9URU1QTEFURV9ESVJFQ1RJVkVfSU5ERVggPSAwO1xuIl19