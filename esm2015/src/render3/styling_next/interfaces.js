/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * A static-level representation of all style or class bindings/values
 * associated with a `TNode`.
 *
 * The `TStylingContext` unites all template styling bindings (i.e.
 * `[class]` and `[style]` bindings) as well as all host-level
 * styling bindings (for components and directives) together into
 * a single manifest
 *
 * The styling context is stored on a `TNode` on and there are
 * two instances of it: one for classes and another for styles.
 *
 * ```typescript
 * tNode.styles = [ ... a context only for styles ... ];
 * tNode.classes = [ ... a context only for classes ... ];
 * ```
 *
 * The styling context is created each time there are one or more
 * styling bindings (style or class bindings) present for an element,
 * but is only created once per `TNode`.
 *
 * `tNode.styles` and `tNode.classes` can be an instance of the following:
 *
 * ```typescript
 * tNode.styles = null; // no static styling or styling bindings active
 * tNode.styles = StylingMapArray; // only static values present (e.g. `<div style="width:200">`)
 * tNode.styles = TStylingContext; // one or more styling bindings present (e.g. `<div
 * [style.width]>`)
 * ```
 *
 * Both `tNode.styles` and `tNode.classes` are instantiated when anything
 * styling-related is active on an element. They are first created from
 * from the any of the element-level instructions (e.g. `element`,
 * `elementStart`, `elementHostAttrs`). When any static style/class
 * values are encountered they are registered on the `tNode.styles`
 * and `tNode.classes` data-structures. By default (when any static
 * values are encountered) the `tNode.styles` or `tNode.classes` values
 * are instances of a `StylingMapArray`. Only when style/class bindings
 * are detected then that styling map is converted into an instance of
 * `TStylingContext`.
 *
 * Due to the fact the the `TStylingContext` is stored on a `TNode`
 * this means that all data within the context is static. Instead of
 * storing actual styling binding values, the lView binding index values
 * are stored within the context. (static nature means it is more compact.)
 *
 * The code below shows a breakdown of two instances of `TStylingContext`
 * (one for `tNode.styles` and another for `tNode.classes`):
 *
 * ```typescript
 * // <div [class.active]="c"  // lView binding index = 20
 * //      [style.width]="x"   // lView binding index = 21
 * //      [style.height]="y"> // lView binding index = 22
 * //  ...
 * // </div>
 * tNode.styles = [
 *   0,         // the context config value (see `TStylingContextConfig`)
 *   1,         // the total amount of sources present (only `1` b/c there are only template
 * bindings)
 *   [null],    // initial values array (an instance of `StylingMapArray`)
 *
 *   0,         // config entry for the property (see `TStylingContextPropConfigFlags`)
 *   0b010,     // template guard mask for height
 *   0,         // host bindings guard mask for height
 *   'height',  // the property name
 *   22,        // the binding location for the "y" binding in the lView
 *   null,      // the default value for height
 *
 *   0,         // config entry for the property (see `TStylingContextPropConfigFlags`)
 *   0b001,     // template guard mask for width
 *   0,         // host bindings guard mask for width
 *   'width',   // the property name
 *   21,        // the binding location for the "x" binding in the lView
 *   null,      // the default value for width
 * ];
 *
 * tNode.classes = [
 *   0,         // the context config value (see `TStylingContextConfig`)
 *   1,         // the total amount of sources present (only `1` b/c there are only template
 * bindings)
 *   [null],    // initial values array (an instance of `StylingMapArray`)
 *
 *   0,         // config entry for the property (see `TStylingContextPropConfigFlags`)
 *   0b001,     // template guard mask for width
 *   0,         // host bindings guard mask for width
 *   'active',  // the property name
 *   20,        // the binding location for the "c" binding in the lView
 *   null,      // the default value for the `active` class
 * ];
 * ```
 *
 * Entry value present in an entry (called a tuple) within the
 * styling context is as follows:
 *
 * ```typescript
 * context = [
 *   //...
 *   configValue,
 *   templateGuardMask,
 *   hostBindingsGuardMask,
 *   propName,
 *   ...bindingIndices...,
 *   defaultValue
 *   //...
 * ];
 * ```
 *
 * Below is a breakdown of each value:
 *
 * - **configValue**:
 *   Property-specific configuration values. The only config setting
 *   that is implemented right now is whether or not to sanitize the
 *   value.
 *
 * - **templateGuardMask**:
 *   A numeric value where each bit represents a binding index
 *   location. Each binding index location is assigned based on
 *   a local counter value that increments each time an instruction
 *   is called:
 *
 * ```
 * <div [style.width]="x"   // binding index = 21 (counter index = 0)
 *      [style.height]="y"> // binding index = 22 (counter index = 1)
 * ```
 *
 *   In the example code above, if the `width` value where to change
 *   then the first bit in the local bit mask value would be flipped
 *   (and the second bit for when `height`).
 *
 *   If and when there are more than 32 binding sources in the context
 *   (more than 32 `[style/class]` bindings) then the bit masking will
 *   overflow and we are left with a situation where a `-1` value will
 *   represent the bit mask. Due to the way that JavaScript handles
 *   negative values, when the bit mask is `-1` then all bits within
 *   that value will be automatically flipped (this is a quick and
 *   efficient way to flip all bits on the mask when a special kind
 *   of caching scenario occurs or when there are more than 32 bindings).
 *
 * - **hostBindingsGuardMask**:
 *   Another instance of a guard mask that is specific to host bindings.
 *   This behaves exactly the same way as does the `templateGuardMask`,
 *   but will not contain any binding information processed in the template.
 *   The reason why there are two instances of guard masks (one for the
 *   template and another for host bindings) is because the template bindings
 *   are processed before host bindings and the state information is not
 *   carried over into the host bindings code. As soon as host bindings are
 *   processed for an element the counter and state-based bit mask values are
 *   set to `0`.
 *
 * ```
 * <div [style.width]="x"   // binding index = 21 (counter index = 0)
 *      [style.height]="y"  // binding index = 22 (counter index = 1)
 *      dir-that-sets-width  // binding index = 30 (counter index = 0)
 *      dir-that-sets-width> // binding index = 31 (counter index = 1)
 * ```
 *
 * - **propName**:
 *   The CSS property name or class name (e.g `width` or `active`).
 *
 * - **bindingIndices...**:
 *   A series of numeric binding values that reflect where in the
 *   lView to find the style/class values associated with the property.
 *   Each value is in order in terms of priority (templates are first,
 *   then directives and then components). When the context is flushed
 *   and the style/class values are applied to the element (this happens
 *   inside of the `stylingApply` instruction) then the flushing code
 *   will keep checking each binding index against the associated lView
 *   to find the first style/class value that is non-null.
 *
 * - **defaultValue**:
 *   This is the default that will always be applied to the element if
 *   and when all other binding sources return a result that is null.
 *   Usually this value is `null` but it can also be a static value that
 *   is intercepted when the tNode is first constructured (e.g.
 *   `<div style="width:200px">` has a default value of `200px` for
 *   the `width` property).
 *
 * Each time a new binding is encountered it is registered into the
 * context. The context then is continually updated until the first
 * styling apply call has been called (which is automatically scheduled
 * to be called once an element exits during change detection). Note that
 * each entry in the context is stored in alphabetical order.
 *
 * Once styling has been flushed for the first time for an element the
 * context will set as locked (this prevents bindings from being added
 * to the context later on).
 *
 * # How Styles/Classes are Rendered
 * Each time a styling instruction (e.g. `[class.name]`, `[style.prop]`,
 * etc...) is executed, the associated `lView` for the view is updated
 * at the current binding location. Also, when this happens, a local
 * counter value is incremented. If the binding value has changed then
 * a local `bitMask` variable is updated with the specific bit based
 * on the counter value.
 *
 * Below is a lightweight example of what happens when a single style
 * property is updated (i.e. `<div [style.prop]="val">`):
 *
 * ```typescript
 * function updateStyleProp(prop: string, value: string) {
 *   const lView = getLView();
 *   const bindingIndex = BINDING_INDEX++;
 *
 *   // update the local counter value
 *   const indexForStyle = stylingState.stylesCount++;
 *   if (lView[bindingIndex] !== value) {
 *     lView[bindingIndex] = value;
 *
 *     // tell the local state that we have updated a style value
 *     // by updating the bit mask
 *     stylingState.bitMaskForStyles |= 1 << indexForStyle;
 *   }
 * }
 * ```
 *
 * Once all the bindings have updated a `bitMask` value will be populated.
 * This `bitMask` value is used in the apply algorithm (which is called
 * context resolution).
 *
 * ## The Apply Algorithm (Context Resolution)
 * As explained above, each time a binding updates its value, the resulting
 * value is stored in the `lView` array. These styling values have yet to
 * be flushed to the element.
 *
 * Once all the styling instructions have been evaluated, then the styling
 * context(s) are flushed to the element. When this happens, the context will
 * be iterated over (property by property) and each binding source will be
 * examined and the first non-null value will be applied to the element.
 *
 * Let's say that we the following template code:
 *
 * ```html
 * <div [style.width]="w1" dir-that-set-width="w2"></div>
 * ```
 *
 * There are two styling bindings in the code above and they both write
 * to the `width` property. When styling is flushed on the element, the
 * algorithm will try and figure out which one of these values to write
 * to the element.
 *
 * In order to figure out which value to apply, the following
 * binding prioritization is adhered to:
 *
 *   1. First template-level styling bindings are applied (if present).
 *      This includes things like `[style.width]` and `[class.active]`.
 *
 *   2. Second are styling-level host bindings present in directives.
 *      (if there are sub/super directives present then the sub directives
 *      are applied first).
 *
 *   3. Third are styling-level host bindings present in components.
 *      (if there are sub/super components present then the sub directives
 *      are applied first).
 *
 * This means that in the code above the styling binding present in the
 * template is applied first and, only if its falsy, then the directive
 * styling binding for width will be applied.
 *
 * ### What about map-based styling bindings?
 * Map-based styling bindings are activated when there are one or more
 * `[style]` and/or `[class]` bindings present on an element. When this
 * code is activated, the apply algorithm will iterate over each map
 * entry and apply each styling value to the element with the same
 * prioritization rules as above.
 *
 * For the algorithm to apply styling values efficiently, the
 * styling map entries must be applied in sync (property by property)
 * with prop-based bindings. (The map-based algorithm is described
 * more inside of the `render3/styling_next/map_based_bindings.ts` file.)
 *
 * ## Sanitization
 * Sanitization is used to prevent invalid style values from being applied to
 * the element.
 *
 * It is enabled in two cases:
 *
 *   1. The `styleSanitizer(sanitizerFn)` instruction was called (just before any other
 *      styling instructions are run).
 *
 *   2. The component/directive `LView` instance has a sanitizer object attached to it
 *      (this happens when `renderComponent` is executed with a `sanitizer` value or
 *      if the ngModule contains a sanitizer provider attached to it).
 *
 * If and when sanitization is active then all property/value entries will be evaluated
 * through the active sanitizer before they are applied to the element (or the styling
 * debug handler).
 *
 * If a `Sanitizer` object is used (via the `LView[SANITIZER]` value) then that object
 * will be used for every property.
 *
 * If a `StyleSanitizerFn` function is used (via the `styleSanitizer`) then it will be
 * called in two ways:
 *
 *   1. property validation mode: this will be called early to mark whether a property
 *      should be sanitized or not at during the flushing stage.
 *
 *   2. value sanitization mode: this will be called during the flushing stage and will
 *      run the sanitizer function against the value before applying it to the element.
 *
 * If sanitization returns an empty value then that empty value will be applied
 * to the element.
 * @record
 */
export function TStylingContext() { }
if (false) {
    /* Skipping unnamed member:
    [TStylingContextIndex.ConfigPosition]: TStylingConfig;*/
    /* Skipping unnamed member:
    [TStylingContextIndex.TotalSourcesPosition]: number;*/
    /* Skipping unnamed member:
    [TStylingContextIndex.InitialStylingValuePosition]: StylingMapArray;*/
}
/** @enum {number} */
const TStylingConfig = {
    /**
     * The initial state of the styling context config.
     */
    Initial: 0,
    /**
     * Whether or not there are prop-based bindings present.
     *
     * Examples include:
     * 1. `<div [style.prop]="x">`
     * 2. `<div [class.prop]="x">`
     * 3. `@HostBinding('style.prop') x`
     * 4. `@HostBinding('class.prop') x`
     */
    HasPropBindings: 1,
    /**
     * Whether or not there are map-based bindings present.
     *
     * Examples include:
     * 1. `<div [style]="x">`
     * 2. `<div [class]="x">`
     * 3. `@HostBinding('style') x`
     * 4. `@HostBinding('class') x`
     */
    HasMapBindings: 2,
    /**
     * Whether or not there are map-based and prop-based bindings present.
     *
     * Examples include:
     * 1. `<div [style]="x" [style.prop]="y">`
     * 2. `<div [class]="x" [style.prop]="y">`
     * 3. `<div [style]="x" dir-that-sets-some-prop>`
     * 4. `<div [class]="x" dir-that-sets-some-class>`
     */
    HasPropAndMapBindings: 3,
    /**
     * Whether or not there are two or more sources for a single property in the context.
     *
     * Examples include:
     * 1. prop + prop: `<div [style.width]="x" dir-that-sets-width>`
     * 2. map + prop: `<div [style]="x" [style.prop]>`
     * 3. map + map: `<div [style]="x" dir-that-sets-style>`
     */
    HasCollisions: 4,
    /**
     * Whether or not the context contains initial styling values.
     *
     * Examples include:
     * 1. `<div style="width:200px">`
     * 2. `<div class="one two three">`
     * 3. `@Directive({ host: { 'style': 'width:200px' } })`
     * 4. `@Directive({ host: { 'class': 'one two three' } })`
     */
    HasInitialStyling: 8,
    /**
     * Whether or not the context contains one or more template bindings.
     *
     * Examples include:
     * 1. `<div [style]="x">`
     * 2. `<div [style.width]="x">`
     * 3. `<div [class]="x">`
     * 4. `<div [class.name]="x">`
     */
    HasTemplateBindings: 16,
    /**
     * Whether or not the context contains one or more host bindings.
     *
     * Examples include:
     * 1. `@HostBinding('style') x`
     * 2. `@HostBinding('style.width') x`
     * 3. `@HostBinding('class') x`
     * 4. `@HostBinding('class.name') x`
     */
    HasHostBindings: 32,
    /**
     * Whether or not the template bindings are allowed to be registered in the context.
     *
     * This flag is after one or more template-based style/class bindings were
     * set and processed for an element. Once the bindings are processed then a call
     * to stylingApply is issued and the lock will be put into place.
     *
     * Note that this is only set once.
     */
    TemplateBindingsLocked: 64,
    /**
     * Whether or not the host bindings are allowed to be registered in the context.
     *
     * This flag is after one or more host-based style/class bindings were
     * set and processed for an element. Once the bindings are processed then a call
     * to stylingApply is issued and the lock will be put into place.
     *
     * Note that this is only set once.
     */
    HostBindingsLocked: 128,
    /** A Mask of all the configurations */
    Mask: 255,
    /** Total amount of configuration bits used */
    TotalBits: 8,
};
export { TStylingConfig };
/** @enum {number} */
const TStylingContextIndex = {
    ConfigPosition: 0,
    TotalSourcesPosition: 1,
    InitialStylingValuePosition: 2,
    ValuesStartPosition: 3,
    // each tuple entry in the context
    // (config, templateBitGuard, hostBindingBitGuard, prop, ...bindings||default-value)
    ConfigOffset: 0,
    TemplateBitGuardOffset: 1,
    HostBindingsBitGuardOffset: 2,
    PropOffset: 3,
    BindingsStartOffset: 4,
};
export { TStylingContextIndex };
/** @enum {number} */
const TStylingContextPropConfigFlags = {
    Default: 0,
    SanitizationRequired: 1,
    TotalBits: 1,
    Mask: 1,
};
export { TStylingContextPropConfigFlags };
/**
 * A function used to apply or remove styling from an element for a given property.
 * @record
 */
export function ApplyStylingFn() { }
/**
 * Array-based representation of a key/value array.
 *
 * The format of the array is "property", "value", "property2",
 * "value2", etc...
 *
 * The first value in the array is reserved to store the instance
 * of the key/value array that was used to populate the property/
 * value entries that take place in the remainder of the array.
 * @record
 */
export function StylingMapArray() { }
if (false) {
    /* Skipping unnamed member:
    [StylingMapArrayIndex.RawValuePosition]: {}|string|null;*/
}
/** @enum {number} */
const StylingMapArrayIndex = {
    /** Where the values start in the array */
    ValuesStartPosition: 1,
    /** The location of the raw key/value map instance used last to populate the array entries */
    RawValuePosition: 0,
    /** The size of each property/value entry */
    TupleSize: 2,
    /** The offset for the property entry in the tuple */
    PropOffset: 0,
    /** The offset for the value entry in the tuple */
    ValueOffset: 1,
};
export { StylingMapArrayIndex };
/**
 * Used to apply/traverse across all map-based styling entries up to the provided `targetProp`
 * value.
 *
 * When called, each of the map-based `StylingMapArray` entries (which are stored in
 * the provided `LStylingData` array) will be iterated over. Depending on the provided
 * `mode` value, each prop/value entry may be applied or skipped over.
 *
 * If `targetProp` value is provided the iteration code will stop once it reaches
 * the property (if found). Otherwise if the target property is not encountered then
 * it will stop once it reaches the next value that appears alphabetically after it.
 *
 * If a `defaultValue` is provided then it will be applied to the element only if the
 * `targetProp` property value is encountered and the value associated with the target
 * property is `null`. The reason why the `defaultValue` is needed is to avoid having the
 * algorithm apply a `null` value and then apply a default value afterwards (this would
 * end up being two style property writes).
 *
 * @return whether or not the target property was reached and its value was
 *  applied to the element.
 * @record
 */
export function SyncStylingMapsFn() { }
/** @enum {number} */
const StylingMapsSyncMode = {
    /** Only traverse values (no prop/value styling entries get applied) */
    TraverseValues: 0,
    /** Apply every prop/value styling entry to the element */
    ApplyAllValues: 1,
    /** Only apply the target prop/value entry */
    ApplyTargetProp: 2,
    /** Skip applying the target prop/value entry */
    SkipTargetProp: 4,
    /** Iterate over inner maps map values in the context */
    RecurseInnerMaps: 8,
    /** Only check to see if a value was set somewhere in each map */
    CheckValuesOnly: 16,
};
export { StylingMapsSyncMode };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW50ZXJmYWNlcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvc3R5bGluZ19uZXh0L2ludGVyZmFjZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQW1VQSxxQ0FVQzs7Ozs7Ozs7Ozs7SUFPQzs7T0FFRztJQUNILFVBQW1CO0lBRW5COzs7Ozs7OztPQVFHO0lBQ0gsa0JBQTJCO0lBRTNCOzs7Ozs7OztPQVFHO0lBQ0gsaUJBQTBCO0lBRTFCOzs7Ozs7OztPQVFHO0lBQ0gsd0JBQWlDO0lBRWpDOzs7Ozs7O09BT0c7SUFDSCxnQkFBeUI7SUFFekI7Ozs7Ozs7O09BUUc7SUFDSCxvQkFBOEI7SUFFOUI7Ozs7Ozs7O09BUUc7SUFDSCx1QkFBZ0M7SUFFaEM7Ozs7Ozs7O09BUUc7SUFDSCxtQkFBNEI7SUFFNUI7Ozs7Ozs7O09BUUc7SUFDSCwwQkFBbUM7SUFFbkM7Ozs7Ozs7O09BUUc7SUFDSCx1QkFBK0I7SUFFL0IsdUNBQXVDO0lBQ3ZDLFNBQWlCO0lBRWpCLDhDQUE4QztJQUM5QyxZQUFhOzs7OztJQU9iLGlCQUFrQjtJQUNsQix1QkFBd0I7SUFDeEIsOEJBQStCO0lBQy9CLHNCQUF1QjtJQUV2QixrQ0FBa0M7SUFDbEMsb0ZBQW9GO0lBQ3BGLGVBQWdCO0lBQ2hCLHlCQUEwQjtJQUMxQiw2QkFBOEI7SUFDOUIsYUFBYztJQUNkLHNCQUF1Qjs7Ozs7SUFPdkIsVUFBYTtJQUNiLHVCQUEwQjtJQUMxQixZQUFhO0lBQ2IsT0FBVTs7Ozs7OztBQU1aLG9DQUdDOzs7Ozs7Ozs7Ozs7QUFzQkQscUNBRUM7Ozs7Ozs7SUFNQywwQ0FBMEM7SUFDMUMsc0JBQXVCO0lBRXZCLDZGQUE2RjtJQUM3RixtQkFBb0I7SUFFcEIsNENBQTRDO0lBQzVDLFlBQWE7SUFFYixxREFBcUQ7SUFDckQsYUFBYztJQUVkLGtEQUFrRDtJQUNsRCxjQUFlOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBd0JqQix1Q0FLQzs7O0lBTUMsdUVBQXVFO0lBQ3ZFLGlCQUFzQjtJQUV0QiwwREFBMEQ7SUFDMUQsaUJBQXNCO0lBRXRCLDZDQUE2QztJQUM3QyxrQkFBdUI7SUFFdkIsZ0RBQWdEO0lBQ2hELGlCQUFzQjtJQUV0Qix3REFBd0Q7SUFDeEQsbUJBQXlCO0lBRXpCLGlFQUFpRTtJQUNqRSxtQkFBeUIiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiogQGxpY2Vuc2VcbiogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4qXG4qIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4qIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiovXG5pbXBvcnQge1N0eWxlU2FuaXRpemVGbn0gZnJvbSAnLi4vLi4vc2FuaXRpemF0aW9uL3N0eWxlX3Nhbml0aXplcic7XG5pbXBvcnQge1Byb2NlZHVyYWxSZW5kZXJlcjMsIFJFbGVtZW50LCBSZW5kZXJlcjN9IGZyb20gJy4uL2ludGVyZmFjZXMvcmVuZGVyZXInO1xuaW1wb3J0IHtMVmlld30gZnJvbSAnLi4vaW50ZXJmYWNlcy92aWV3JztcblxuLyoqXG4gKiAtLS0tLS0tLVxuICpcbiAqIFRoaXMgZmlsZSBjb250YWlucyB0aGUgY29yZSBpbnRlcmZhY2VzIGZvciBzdHlsaW5nIGluIEFuZ3VsYXIuXG4gKlxuICogVG8gbGVhcm4gbW9yZSBhYm91dCB0aGUgYWxnb3JpdGhtIHNlZSBgVFN0eWxpbmdDb250ZXh0YC5cbiAqXG4gKiAtLS0tLS0tLVxuICovXG5cbi8qKlxuICogQSBzdGF0aWMtbGV2ZWwgcmVwcmVzZW50YXRpb24gb2YgYWxsIHN0eWxlIG9yIGNsYXNzIGJpbmRpbmdzL3ZhbHVlc1xuICogYXNzb2NpYXRlZCB3aXRoIGEgYFROb2RlYC5cbiAqXG4gKiBUaGUgYFRTdHlsaW5nQ29udGV4dGAgdW5pdGVzIGFsbCB0ZW1wbGF0ZSBzdHlsaW5nIGJpbmRpbmdzIChpLmUuXG4gKiBgW2NsYXNzXWAgYW5kIGBbc3R5bGVdYCBiaW5kaW5ncykgYXMgd2VsbCBhcyBhbGwgaG9zdC1sZXZlbFxuICogc3R5bGluZyBiaW5kaW5ncyAoZm9yIGNvbXBvbmVudHMgYW5kIGRpcmVjdGl2ZXMpIHRvZ2V0aGVyIGludG9cbiAqIGEgc2luZ2xlIG1hbmlmZXN0XG4gKlxuICogVGhlIHN0eWxpbmcgY29udGV4dCBpcyBzdG9yZWQgb24gYSBgVE5vZGVgIG9uIGFuZCB0aGVyZSBhcmVcbiAqIHR3byBpbnN0YW5jZXMgb2YgaXQ6IG9uZSBmb3IgY2xhc3NlcyBhbmQgYW5vdGhlciBmb3Igc3R5bGVzLlxuICpcbiAqIGBgYHR5cGVzY3JpcHRcbiAqIHROb2RlLnN0eWxlcyA9IFsgLi4uIGEgY29udGV4dCBvbmx5IGZvciBzdHlsZXMgLi4uIF07XG4gKiB0Tm9kZS5jbGFzc2VzID0gWyAuLi4gYSBjb250ZXh0IG9ubHkgZm9yIGNsYXNzZXMgLi4uIF07XG4gKiBgYGBcbiAqXG4gKiBUaGUgc3R5bGluZyBjb250ZXh0IGlzIGNyZWF0ZWQgZWFjaCB0aW1lIHRoZXJlIGFyZSBvbmUgb3IgbW9yZVxuICogc3R5bGluZyBiaW5kaW5ncyAoc3R5bGUgb3IgY2xhc3MgYmluZGluZ3MpIHByZXNlbnQgZm9yIGFuIGVsZW1lbnQsXG4gKiBidXQgaXMgb25seSBjcmVhdGVkIG9uY2UgcGVyIGBUTm9kZWAuXG4gKlxuICogYHROb2RlLnN0eWxlc2AgYW5kIGB0Tm9kZS5jbGFzc2VzYCBjYW4gYmUgYW4gaW5zdGFuY2Ugb2YgdGhlIGZvbGxvd2luZzpcbiAqXG4gKiBgYGB0eXBlc2NyaXB0XG4gKiB0Tm9kZS5zdHlsZXMgPSBudWxsOyAvLyBubyBzdGF0aWMgc3R5bGluZyBvciBzdHlsaW5nIGJpbmRpbmdzIGFjdGl2ZVxuICogdE5vZGUuc3R5bGVzID0gU3R5bGluZ01hcEFycmF5OyAvLyBvbmx5IHN0YXRpYyB2YWx1ZXMgcHJlc2VudCAoZS5nLiBgPGRpdiBzdHlsZT1cIndpZHRoOjIwMFwiPmApXG4gKiB0Tm9kZS5zdHlsZXMgPSBUU3R5bGluZ0NvbnRleHQ7IC8vIG9uZSBvciBtb3JlIHN0eWxpbmcgYmluZGluZ3MgcHJlc2VudCAoZS5nLiBgPGRpdlxuICogW3N0eWxlLndpZHRoXT5gKVxuICogYGBgXG4gKlxuICogQm90aCBgdE5vZGUuc3R5bGVzYCBhbmQgYHROb2RlLmNsYXNzZXNgIGFyZSBpbnN0YW50aWF0ZWQgd2hlbiBhbnl0aGluZ1xuICogc3R5bGluZy1yZWxhdGVkIGlzIGFjdGl2ZSBvbiBhbiBlbGVtZW50LiBUaGV5IGFyZSBmaXJzdCBjcmVhdGVkIGZyb21cbiAqIGZyb20gdGhlIGFueSBvZiB0aGUgZWxlbWVudC1sZXZlbCBpbnN0cnVjdGlvbnMgKGUuZy4gYGVsZW1lbnRgLFxuICogYGVsZW1lbnRTdGFydGAsIGBlbGVtZW50SG9zdEF0dHJzYCkuIFdoZW4gYW55IHN0YXRpYyBzdHlsZS9jbGFzc1xuICogdmFsdWVzIGFyZSBlbmNvdW50ZXJlZCB0aGV5IGFyZSByZWdpc3RlcmVkIG9uIHRoZSBgdE5vZGUuc3R5bGVzYFxuICogYW5kIGB0Tm9kZS5jbGFzc2VzYCBkYXRhLXN0cnVjdHVyZXMuIEJ5IGRlZmF1bHQgKHdoZW4gYW55IHN0YXRpY1xuICogdmFsdWVzIGFyZSBlbmNvdW50ZXJlZCkgdGhlIGB0Tm9kZS5zdHlsZXNgIG9yIGB0Tm9kZS5jbGFzc2VzYCB2YWx1ZXNcbiAqIGFyZSBpbnN0YW5jZXMgb2YgYSBgU3R5bGluZ01hcEFycmF5YC4gT25seSB3aGVuIHN0eWxlL2NsYXNzIGJpbmRpbmdzXG4gKiBhcmUgZGV0ZWN0ZWQgdGhlbiB0aGF0IHN0eWxpbmcgbWFwIGlzIGNvbnZlcnRlZCBpbnRvIGFuIGluc3RhbmNlIG9mXG4gKiBgVFN0eWxpbmdDb250ZXh0YC5cbiAqXG4gKiBEdWUgdG8gdGhlIGZhY3QgdGhlIHRoZSBgVFN0eWxpbmdDb250ZXh0YCBpcyBzdG9yZWQgb24gYSBgVE5vZGVgXG4gKiB0aGlzIG1lYW5zIHRoYXQgYWxsIGRhdGEgd2l0aGluIHRoZSBjb250ZXh0IGlzIHN0YXRpYy4gSW5zdGVhZCBvZlxuICogc3RvcmluZyBhY3R1YWwgc3R5bGluZyBiaW5kaW5nIHZhbHVlcywgdGhlIGxWaWV3IGJpbmRpbmcgaW5kZXggdmFsdWVzXG4gKiBhcmUgc3RvcmVkIHdpdGhpbiB0aGUgY29udGV4dC4gKHN0YXRpYyBuYXR1cmUgbWVhbnMgaXQgaXMgbW9yZSBjb21wYWN0LilcbiAqXG4gKiBUaGUgY29kZSBiZWxvdyBzaG93cyBhIGJyZWFrZG93biBvZiB0d28gaW5zdGFuY2VzIG9mIGBUU3R5bGluZ0NvbnRleHRgXG4gKiAob25lIGZvciBgdE5vZGUuc3R5bGVzYCBhbmQgYW5vdGhlciBmb3IgYHROb2RlLmNsYXNzZXNgKTpcbiAqXG4gKiBgYGB0eXBlc2NyaXB0XG4gKiAvLyA8ZGl2IFtjbGFzcy5hY3RpdmVdPVwiY1wiICAvLyBsVmlldyBiaW5kaW5nIGluZGV4ID0gMjBcbiAqIC8vICAgICAgW3N0eWxlLndpZHRoXT1cInhcIiAgIC8vIGxWaWV3IGJpbmRpbmcgaW5kZXggPSAyMVxuICogLy8gICAgICBbc3R5bGUuaGVpZ2h0XT1cInlcIj4gLy8gbFZpZXcgYmluZGluZyBpbmRleCA9IDIyXG4gKiAvLyAgLi4uXG4gKiAvLyA8L2Rpdj5cbiAqIHROb2RlLnN0eWxlcyA9IFtcbiAqICAgMCwgICAgICAgICAvLyB0aGUgY29udGV4dCBjb25maWcgdmFsdWUgKHNlZSBgVFN0eWxpbmdDb250ZXh0Q29uZmlnYClcbiAqICAgMSwgICAgICAgICAvLyB0aGUgdG90YWwgYW1vdW50IG9mIHNvdXJjZXMgcHJlc2VudCAob25seSBgMWAgYi9jIHRoZXJlIGFyZSBvbmx5IHRlbXBsYXRlXG4gKiBiaW5kaW5ncylcbiAqICAgW251bGxdLCAgICAvLyBpbml0aWFsIHZhbHVlcyBhcnJheSAoYW4gaW5zdGFuY2Ugb2YgYFN0eWxpbmdNYXBBcnJheWApXG4gKlxuICogICAwLCAgICAgICAgIC8vIGNvbmZpZyBlbnRyeSBmb3IgdGhlIHByb3BlcnR5IChzZWUgYFRTdHlsaW5nQ29udGV4dFByb3BDb25maWdGbGFnc2ApXG4gKiAgIDBiMDEwLCAgICAgLy8gdGVtcGxhdGUgZ3VhcmQgbWFzayBmb3IgaGVpZ2h0XG4gKiAgIDAsICAgICAgICAgLy8gaG9zdCBiaW5kaW5ncyBndWFyZCBtYXNrIGZvciBoZWlnaHRcbiAqICAgJ2hlaWdodCcsICAvLyB0aGUgcHJvcGVydHkgbmFtZVxuICogICAyMiwgICAgICAgIC8vIHRoZSBiaW5kaW5nIGxvY2F0aW9uIGZvciB0aGUgXCJ5XCIgYmluZGluZyBpbiB0aGUgbFZpZXdcbiAqICAgbnVsbCwgICAgICAvLyB0aGUgZGVmYXVsdCB2YWx1ZSBmb3IgaGVpZ2h0XG4gKlxuICogICAwLCAgICAgICAgIC8vIGNvbmZpZyBlbnRyeSBmb3IgdGhlIHByb3BlcnR5IChzZWUgYFRTdHlsaW5nQ29udGV4dFByb3BDb25maWdGbGFnc2ApXG4gKiAgIDBiMDAxLCAgICAgLy8gdGVtcGxhdGUgZ3VhcmQgbWFzayBmb3Igd2lkdGhcbiAqICAgMCwgICAgICAgICAvLyBob3N0IGJpbmRpbmdzIGd1YXJkIG1hc2sgZm9yIHdpZHRoXG4gKiAgICd3aWR0aCcsICAgLy8gdGhlIHByb3BlcnR5IG5hbWVcbiAqICAgMjEsICAgICAgICAvLyB0aGUgYmluZGluZyBsb2NhdGlvbiBmb3IgdGhlIFwieFwiIGJpbmRpbmcgaW4gdGhlIGxWaWV3XG4gKiAgIG51bGwsICAgICAgLy8gdGhlIGRlZmF1bHQgdmFsdWUgZm9yIHdpZHRoXG4gKiBdO1xuICpcbiAqIHROb2RlLmNsYXNzZXMgPSBbXG4gKiAgIDAsICAgICAgICAgLy8gdGhlIGNvbnRleHQgY29uZmlnIHZhbHVlIChzZWUgYFRTdHlsaW5nQ29udGV4dENvbmZpZ2ApXG4gKiAgIDEsICAgICAgICAgLy8gdGhlIHRvdGFsIGFtb3VudCBvZiBzb3VyY2VzIHByZXNlbnQgKG9ubHkgYDFgIGIvYyB0aGVyZSBhcmUgb25seSB0ZW1wbGF0ZVxuICogYmluZGluZ3MpXG4gKiAgIFtudWxsXSwgICAgLy8gaW5pdGlhbCB2YWx1ZXMgYXJyYXkgKGFuIGluc3RhbmNlIG9mIGBTdHlsaW5nTWFwQXJyYXlgKVxuICpcbiAqICAgMCwgICAgICAgICAvLyBjb25maWcgZW50cnkgZm9yIHRoZSBwcm9wZXJ0eSAoc2VlIGBUU3R5bGluZ0NvbnRleHRQcm9wQ29uZmlnRmxhZ3NgKVxuICogICAwYjAwMSwgICAgIC8vIHRlbXBsYXRlIGd1YXJkIG1hc2sgZm9yIHdpZHRoXG4gKiAgIDAsICAgICAgICAgLy8gaG9zdCBiaW5kaW5ncyBndWFyZCBtYXNrIGZvciB3aWR0aFxuICogICAnYWN0aXZlJywgIC8vIHRoZSBwcm9wZXJ0eSBuYW1lXG4gKiAgIDIwLCAgICAgICAgLy8gdGhlIGJpbmRpbmcgbG9jYXRpb24gZm9yIHRoZSBcImNcIiBiaW5kaW5nIGluIHRoZSBsVmlld1xuICogICBudWxsLCAgICAgIC8vIHRoZSBkZWZhdWx0IHZhbHVlIGZvciB0aGUgYGFjdGl2ZWAgY2xhc3NcbiAqIF07XG4gKiBgYGBcbiAqXG4gKiBFbnRyeSB2YWx1ZSBwcmVzZW50IGluIGFuIGVudHJ5IChjYWxsZWQgYSB0dXBsZSkgd2l0aGluIHRoZVxuICogc3R5bGluZyBjb250ZXh0IGlzIGFzIGZvbGxvd3M6XG4gKlxuICogYGBgdHlwZXNjcmlwdFxuICogY29udGV4dCA9IFtcbiAqICAgLy8uLi5cbiAqICAgY29uZmlnVmFsdWUsXG4gKiAgIHRlbXBsYXRlR3VhcmRNYXNrLFxuICogICBob3N0QmluZGluZ3NHdWFyZE1hc2ssXG4gKiAgIHByb3BOYW1lLFxuICogICAuLi5iaW5kaW5nSW5kaWNlcy4uLixcbiAqICAgZGVmYXVsdFZhbHVlXG4gKiAgIC8vLi4uXG4gKiBdO1xuICogYGBgXG4gKlxuICogQmVsb3cgaXMgYSBicmVha2Rvd24gb2YgZWFjaCB2YWx1ZTpcbiAqXG4gKiAtICoqY29uZmlnVmFsdWUqKjpcbiAqICAgUHJvcGVydHktc3BlY2lmaWMgY29uZmlndXJhdGlvbiB2YWx1ZXMuIFRoZSBvbmx5IGNvbmZpZyBzZXR0aW5nXG4gKiAgIHRoYXQgaXMgaW1wbGVtZW50ZWQgcmlnaHQgbm93IGlzIHdoZXRoZXIgb3Igbm90IHRvIHNhbml0aXplIHRoZVxuICogICB2YWx1ZS5cbiAqXG4gKiAtICoqdGVtcGxhdGVHdWFyZE1hc2sqKjpcbiAqICAgQSBudW1lcmljIHZhbHVlIHdoZXJlIGVhY2ggYml0IHJlcHJlc2VudHMgYSBiaW5kaW5nIGluZGV4XG4gKiAgIGxvY2F0aW9uLiBFYWNoIGJpbmRpbmcgaW5kZXggbG9jYXRpb24gaXMgYXNzaWduZWQgYmFzZWQgb25cbiAqICAgYSBsb2NhbCBjb3VudGVyIHZhbHVlIHRoYXQgaW5jcmVtZW50cyBlYWNoIHRpbWUgYW4gaW5zdHJ1Y3Rpb25cbiAqICAgaXMgY2FsbGVkOlxuICpcbiAqIGBgYFxuICogPGRpdiBbc3R5bGUud2lkdGhdPVwieFwiICAgLy8gYmluZGluZyBpbmRleCA9IDIxIChjb3VudGVyIGluZGV4ID0gMClcbiAqICAgICAgW3N0eWxlLmhlaWdodF09XCJ5XCI+IC8vIGJpbmRpbmcgaW5kZXggPSAyMiAoY291bnRlciBpbmRleCA9IDEpXG4gKiBgYGBcbiAqXG4gKiAgIEluIHRoZSBleGFtcGxlIGNvZGUgYWJvdmUsIGlmIHRoZSBgd2lkdGhgIHZhbHVlIHdoZXJlIHRvIGNoYW5nZVxuICogICB0aGVuIHRoZSBmaXJzdCBiaXQgaW4gdGhlIGxvY2FsIGJpdCBtYXNrIHZhbHVlIHdvdWxkIGJlIGZsaXBwZWRcbiAqICAgKGFuZCB0aGUgc2Vjb25kIGJpdCBmb3Igd2hlbiBgaGVpZ2h0YCkuXG4gKlxuICogICBJZiBhbmQgd2hlbiB0aGVyZSBhcmUgbW9yZSB0aGFuIDMyIGJpbmRpbmcgc291cmNlcyBpbiB0aGUgY29udGV4dFxuICogICAobW9yZSB0aGFuIDMyIGBbc3R5bGUvY2xhc3NdYCBiaW5kaW5ncykgdGhlbiB0aGUgYml0IG1hc2tpbmcgd2lsbFxuICogICBvdmVyZmxvdyBhbmQgd2UgYXJlIGxlZnQgd2l0aCBhIHNpdHVhdGlvbiB3aGVyZSBhIGAtMWAgdmFsdWUgd2lsbFxuICogICByZXByZXNlbnQgdGhlIGJpdCBtYXNrLiBEdWUgdG8gdGhlIHdheSB0aGF0IEphdmFTY3JpcHQgaGFuZGxlc1xuICogICBuZWdhdGl2ZSB2YWx1ZXMsIHdoZW4gdGhlIGJpdCBtYXNrIGlzIGAtMWAgdGhlbiBhbGwgYml0cyB3aXRoaW5cbiAqICAgdGhhdCB2YWx1ZSB3aWxsIGJlIGF1dG9tYXRpY2FsbHkgZmxpcHBlZCAodGhpcyBpcyBhIHF1aWNrIGFuZFxuICogICBlZmZpY2llbnQgd2F5IHRvIGZsaXAgYWxsIGJpdHMgb24gdGhlIG1hc2sgd2hlbiBhIHNwZWNpYWwga2luZFxuICogICBvZiBjYWNoaW5nIHNjZW5hcmlvIG9jY3VycyBvciB3aGVuIHRoZXJlIGFyZSBtb3JlIHRoYW4gMzIgYmluZGluZ3MpLlxuICpcbiAqIC0gKipob3N0QmluZGluZ3NHdWFyZE1hc2sqKjpcbiAqICAgQW5vdGhlciBpbnN0YW5jZSBvZiBhIGd1YXJkIG1hc2sgdGhhdCBpcyBzcGVjaWZpYyB0byBob3N0IGJpbmRpbmdzLlxuICogICBUaGlzIGJlaGF2ZXMgZXhhY3RseSB0aGUgc2FtZSB3YXkgYXMgZG9lcyB0aGUgYHRlbXBsYXRlR3VhcmRNYXNrYCxcbiAqICAgYnV0IHdpbGwgbm90IGNvbnRhaW4gYW55IGJpbmRpbmcgaW5mb3JtYXRpb24gcHJvY2Vzc2VkIGluIHRoZSB0ZW1wbGF0ZS5cbiAqICAgVGhlIHJlYXNvbiB3aHkgdGhlcmUgYXJlIHR3byBpbnN0YW5jZXMgb2YgZ3VhcmQgbWFza3MgKG9uZSBmb3IgdGhlXG4gKiAgIHRlbXBsYXRlIGFuZCBhbm90aGVyIGZvciBob3N0IGJpbmRpbmdzKSBpcyBiZWNhdXNlIHRoZSB0ZW1wbGF0ZSBiaW5kaW5nc1xuICogICBhcmUgcHJvY2Vzc2VkIGJlZm9yZSBob3N0IGJpbmRpbmdzIGFuZCB0aGUgc3RhdGUgaW5mb3JtYXRpb24gaXMgbm90XG4gKiAgIGNhcnJpZWQgb3ZlciBpbnRvIHRoZSBob3N0IGJpbmRpbmdzIGNvZGUuIEFzIHNvb24gYXMgaG9zdCBiaW5kaW5ncyBhcmVcbiAqICAgcHJvY2Vzc2VkIGZvciBhbiBlbGVtZW50IHRoZSBjb3VudGVyIGFuZCBzdGF0ZS1iYXNlZCBiaXQgbWFzayB2YWx1ZXMgYXJlXG4gKiAgIHNldCB0byBgMGAuXG4gKlxuICogYGBgXG4gKiA8ZGl2IFtzdHlsZS53aWR0aF09XCJ4XCIgICAvLyBiaW5kaW5nIGluZGV4ID0gMjEgKGNvdW50ZXIgaW5kZXggPSAwKVxuICogICAgICBbc3R5bGUuaGVpZ2h0XT1cInlcIiAgLy8gYmluZGluZyBpbmRleCA9IDIyIChjb3VudGVyIGluZGV4ID0gMSlcbiAqICAgICAgZGlyLXRoYXQtc2V0cy13aWR0aCAgLy8gYmluZGluZyBpbmRleCA9IDMwIChjb3VudGVyIGluZGV4ID0gMClcbiAqICAgICAgZGlyLXRoYXQtc2V0cy13aWR0aD4gLy8gYmluZGluZyBpbmRleCA9IDMxIChjb3VudGVyIGluZGV4ID0gMSlcbiAqIGBgYFxuICpcbiAqIC0gKipwcm9wTmFtZSoqOlxuICogICBUaGUgQ1NTIHByb3BlcnR5IG5hbWUgb3IgY2xhc3MgbmFtZSAoZS5nIGB3aWR0aGAgb3IgYGFjdGl2ZWApLlxuICpcbiAqIC0gKipiaW5kaW5nSW5kaWNlcy4uLioqOlxuICogICBBIHNlcmllcyBvZiBudW1lcmljIGJpbmRpbmcgdmFsdWVzIHRoYXQgcmVmbGVjdCB3aGVyZSBpbiB0aGVcbiAqICAgbFZpZXcgdG8gZmluZCB0aGUgc3R5bGUvY2xhc3MgdmFsdWVzIGFzc29jaWF0ZWQgd2l0aCB0aGUgcHJvcGVydHkuXG4gKiAgIEVhY2ggdmFsdWUgaXMgaW4gb3JkZXIgaW4gdGVybXMgb2YgcHJpb3JpdHkgKHRlbXBsYXRlcyBhcmUgZmlyc3QsXG4gKiAgIHRoZW4gZGlyZWN0aXZlcyBhbmQgdGhlbiBjb21wb25lbnRzKS4gV2hlbiB0aGUgY29udGV4dCBpcyBmbHVzaGVkXG4gKiAgIGFuZCB0aGUgc3R5bGUvY2xhc3MgdmFsdWVzIGFyZSBhcHBsaWVkIHRvIHRoZSBlbGVtZW50ICh0aGlzIGhhcHBlbnNcbiAqICAgaW5zaWRlIG9mIHRoZSBgc3R5bGluZ0FwcGx5YCBpbnN0cnVjdGlvbikgdGhlbiB0aGUgZmx1c2hpbmcgY29kZVxuICogICB3aWxsIGtlZXAgY2hlY2tpbmcgZWFjaCBiaW5kaW5nIGluZGV4IGFnYWluc3QgdGhlIGFzc29jaWF0ZWQgbFZpZXdcbiAqICAgdG8gZmluZCB0aGUgZmlyc3Qgc3R5bGUvY2xhc3MgdmFsdWUgdGhhdCBpcyBub24tbnVsbC5cbiAqXG4gKiAtICoqZGVmYXVsdFZhbHVlKio6XG4gKiAgIFRoaXMgaXMgdGhlIGRlZmF1bHQgdGhhdCB3aWxsIGFsd2F5cyBiZSBhcHBsaWVkIHRvIHRoZSBlbGVtZW50IGlmXG4gKiAgIGFuZCB3aGVuIGFsbCBvdGhlciBiaW5kaW5nIHNvdXJjZXMgcmV0dXJuIGEgcmVzdWx0IHRoYXQgaXMgbnVsbC5cbiAqICAgVXN1YWxseSB0aGlzIHZhbHVlIGlzIGBudWxsYCBidXQgaXQgY2FuIGFsc28gYmUgYSBzdGF0aWMgdmFsdWUgdGhhdFxuICogICBpcyBpbnRlcmNlcHRlZCB3aGVuIHRoZSB0Tm9kZSBpcyBmaXJzdCBjb25zdHJ1Y3R1cmVkIChlLmcuXG4gKiAgIGA8ZGl2IHN0eWxlPVwid2lkdGg6MjAwcHhcIj5gIGhhcyBhIGRlZmF1bHQgdmFsdWUgb2YgYDIwMHB4YCBmb3JcbiAqICAgdGhlIGB3aWR0aGAgcHJvcGVydHkpLlxuICpcbiAqIEVhY2ggdGltZSBhIG5ldyBiaW5kaW5nIGlzIGVuY291bnRlcmVkIGl0IGlzIHJlZ2lzdGVyZWQgaW50byB0aGVcbiAqIGNvbnRleHQuIFRoZSBjb250ZXh0IHRoZW4gaXMgY29udGludWFsbHkgdXBkYXRlZCB1bnRpbCB0aGUgZmlyc3RcbiAqIHN0eWxpbmcgYXBwbHkgY2FsbCBoYXMgYmVlbiBjYWxsZWQgKHdoaWNoIGlzIGF1dG9tYXRpY2FsbHkgc2NoZWR1bGVkXG4gKiB0byBiZSBjYWxsZWQgb25jZSBhbiBlbGVtZW50IGV4aXRzIGR1cmluZyBjaGFuZ2UgZGV0ZWN0aW9uKS4gTm90ZSB0aGF0XG4gKiBlYWNoIGVudHJ5IGluIHRoZSBjb250ZXh0IGlzIHN0b3JlZCBpbiBhbHBoYWJldGljYWwgb3JkZXIuXG4gKlxuICogT25jZSBzdHlsaW5nIGhhcyBiZWVuIGZsdXNoZWQgZm9yIHRoZSBmaXJzdCB0aW1lIGZvciBhbiBlbGVtZW50IHRoZVxuICogY29udGV4dCB3aWxsIHNldCBhcyBsb2NrZWQgKHRoaXMgcHJldmVudHMgYmluZGluZ3MgZnJvbSBiZWluZyBhZGRlZFxuICogdG8gdGhlIGNvbnRleHQgbGF0ZXIgb24pLlxuICpcbiAqICMgSG93IFN0eWxlcy9DbGFzc2VzIGFyZSBSZW5kZXJlZFxuICogRWFjaCB0aW1lIGEgc3R5bGluZyBpbnN0cnVjdGlvbiAoZS5nLiBgW2NsYXNzLm5hbWVdYCwgYFtzdHlsZS5wcm9wXWAsXG4gKiBldGMuLi4pIGlzIGV4ZWN1dGVkLCB0aGUgYXNzb2NpYXRlZCBgbFZpZXdgIGZvciB0aGUgdmlldyBpcyB1cGRhdGVkXG4gKiBhdCB0aGUgY3VycmVudCBiaW5kaW5nIGxvY2F0aW9uLiBBbHNvLCB3aGVuIHRoaXMgaGFwcGVucywgYSBsb2NhbFxuICogY291bnRlciB2YWx1ZSBpcyBpbmNyZW1lbnRlZC4gSWYgdGhlIGJpbmRpbmcgdmFsdWUgaGFzIGNoYW5nZWQgdGhlblxuICogYSBsb2NhbCBgYml0TWFza2AgdmFyaWFibGUgaXMgdXBkYXRlZCB3aXRoIHRoZSBzcGVjaWZpYyBiaXQgYmFzZWRcbiAqIG9uIHRoZSBjb3VudGVyIHZhbHVlLlxuICpcbiAqIEJlbG93IGlzIGEgbGlnaHR3ZWlnaHQgZXhhbXBsZSBvZiB3aGF0IGhhcHBlbnMgd2hlbiBhIHNpbmdsZSBzdHlsZVxuICogcHJvcGVydHkgaXMgdXBkYXRlZCAoaS5lLiBgPGRpdiBbc3R5bGUucHJvcF09XCJ2YWxcIj5gKTpcbiAqXG4gKiBgYGB0eXBlc2NyaXB0XG4gKiBmdW5jdGlvbiB1cGRhdGVTdHlsZVByb3AocHJvcDogc3RyaW5nLCB2YWx1ZTogc3RyaW5nKSB7XG4gKiAgIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAqICAgY29uc3QgYmluZGluZ0luZGV4ID0gQklORElOR19JTkRFWCsrO1xuICpcbiAqICAgLy8gdXBkYXRlIHRoZSBsb2NhbCBjb3VudGVyIHZhbHVlXG4gKiAgIGNvbnN0IGluZGV4Rm9yU3R5bGUgPSBzdHlsaW5nU3RhdGUuc3R5bGVzQ291bnQrKztcbiAqICAgaWYgKGxWaWV3W2JpbmRpbmdJbmRleF0gIT09IHZhbHVlKSB7XG4gKiAgICAgbFZpZXdbYmluZGluZ0luZGV4XSA9IHZhbHVlO1xuICpcbiAqICAgICAvLyB0ZWxsIHRoZSBsb2NhbCBzdGF0ZSB0aGF0IHdlIGhhdmUgdXBkYXRlZCBhIHN0eWxlIHZhbHVlXG4gKiAgICAgLy8gYnkgdXBkYXRpbmcgdGhlIGJpdCBtYXNrXG4gKiAgICAgc3R5bGluZ1N0YXRlLmJpdE1hc2tGb3JTdHlsZXMgfD0gMSA8PCBpbmRleEZvclN0eWxlO1xuICogICB9XG4gKiB9XG4gKiBgYGBcbiAqXG4gKiBPbmNlIGFsbCB0aGUgYmluZGluZ3MgaGF2ZSB1cGRhdGVkIGEgYGJpdE1hc2tgIHZhbHVlIHdpbGwgYmUgcG9wdWxhdGVkLlxuICogVGhpcyBgYml0TWFza2AgdmFsdWUgaXMgdXNlZCBpbiB0aGUgYXBwbHkgYWxnb3JpdGhtICh3aGljaCBpcyBjYWxsZWRcbiAqIGNvbnRleHQgcmVzb2x1dGlvbikuXG4gKlxuICogIyMgVGhlIEFwcGx5IEFsZ29yaXRobSAoQ29udGV4dCBSZXNvbHV0aW9uKVxuICogQXMgZXhwbGFpbmVkIGFib3ZlLCBlYWNoIHRpbWUgYSBiaW5kaW5nIHVwZGF0ZXMgaXRzIHZhbHVlLCB0aGUgcmVzdWx0aW5nXG4gKiB2YWx1ZSBpcyBzdG9yZWQgaW4gdGhlIGBsVmlld2AgYXJyYXkuIFRoZXNlIHN0eWxpbmcgdmFsdWVzIGhhdmUgeWV0IHRvXG4gKiBiZSBmbHVzaGVkIHRvIHRoZSBlbGVtZW50LlxuICpcbiAqIE9uY2UgYWxsIHRoZSBzdHlsaW5nIGluc3RydWN0aW9ucyBoYXZlIGJlZW4gZXZhbHVhdGVkLCB0aGVuIHRoZSBzdHlsaW5nXG4gKiBjb250ZXh0KHMpIGFyZSBmbHVzaGVkIHRvIHRoZSBlbGVtZW50LiBXaGVuIHRoaXMgaGFwcGVucywgdGhlIGNvbnRleHQgd2lsbFxuICogYmUgaXRlcmF0ZWQgb3ZlciAocHJvcGVydHkgYnkgcHJvcGVydHkpIGFuZCBlYWNoIGJpbmRpbmcgc291cmNlIHdpbGwgYmVcbiAqIGV4YW1pbmVkIGFuZCB0aGUgZmlyc3Qgbm9uLW51bGwgdmFsdWUgd2lsbCBiZSBhcHBsaWVkIHRvIHRoZSBlbGVtZW50LlxuICpcbiAqIExldCdzIHNheSB0aGF0IHdlIHRoZSBmb2xsb3dpbmcgdGVtcGxhdGUgY29kZTpcbiAqXG4gKiBgYGBodG1sXG4gKiA8ZGl2IFtzdHlsZS53aWR0aF09XCJ3MVwiIGRpci10aGF0LXNldC13aWR0aD1cIncyXCI+PC9kaXY+XG4gKiBgYGBcbiAqXG4gKiBUaGVyZSBhcmUgdHdvIHN0eWxpbmcgYmluZGluZ3MgaW4gdGhlIGNvZGUgYWJvdmUgYW5kIHRoZXkgYm90aCB3cml0ZVxuICogdG8gdGhlIGB3aWR0aGAgcHJvcGVydHkuIFdoZW4gc3R5bGluZyBpcyBmbHVzaGVkIG9uIHRoZSBlbGVtZW50LCB0aGVcbiAqIGFsZ29yaXRobSB3aWxsIHRyeSBhbmQgZmlndXJlIG91dCB3aGljaCBvbmUgb2YgdGhlc2UgdmFsdWVzIHRvIHdyaXRlXG4gKiB0byB0aGUgZWxlbWVudC5cbiAqXG4gKiBJbiBvcmRlciB0byBmaWd1cmUgb3V0IHdoaWNoIHZhbHVlIHRvIGFwcGx5LCB0aGUgZm9sbG93aW5nXG4gKiBiaW5kaW5nIHByaW9yaXRpemF0aW9uIGlzIGFkaGVyZWQgdG86XG4gKlxuICogICAxLiBGaXJzdCB0ZW1wbGF0ZS1sZXZlbCBzdHlsaW5nIGJpbmRpbmdzIGFyZSBhcHBsaWVkIChpZiBwcmVzZW50KS5cbiAqICAgICAgVGhpcyBpbmNsdWRlcyB0aGluZ3MgbGlrZSBgW3N0eWxlLndpZHRoXWAgYW5kIGBbY2xhc3MuYWN0aXZlXWAuXG4gKlxuICogICAyLiBTZWNvbmQgYXJlIHN0eWxpbmctbGV2ZWwgaG9zdCBiaW5kaW5ncyBwcmVzZW50IGluIGRpcmVjdGl2ZXMuXG4gKiAgICAgIChpZiB0aGVyZSBhcmUgc3ViL3N1cGVyIGRpcmVjdGl2ZXMgcHJlc2VudCB0aGVuIHRoZSBzdWIgZGlyZWN0aXZlc1xuICogICAgICBhcmUgYXBwbGllZCBmaXJzdCkuXG4gKlxuICogICAzLiBUaGlyZCBhcmUgc3R5bGluZy1sZXZlbCBob3N0IGJpbmRpbmdzIHByZXNlbnQgaW4gY29tcG9uZW50cy5cbiAqICAgICAgKGlmIHRoZXJlIGFyZSBzdWIvc3VwZXIgY29tcG9uZW50cyBwcmVzZW50IHRoZW4gdGhlIHN1YiBkaXJlY3RpdmVzXG4gKiAgICAgIGFyZSBhcHBsaWVkIGZpcnN0KS5cbiAqXG4gKiBUaGlzIG1lYW5zIHRoYXQgaW4gdGhlIGNvZGUgYWJvdmUgdGhlIHN0eWxpbmcgYmluZGluZyBwcmVzZW50IGluIHRoZVxuICogdGVtcGxhdGUgaXMgYXBwbGllZCBmaXJzdCBhbmQsIG9ubHkgaWYgaXRzIGZhbHN5LCB0aGVuIHRoZSBkaXJlY3RpdmVcbiAqIHN0eWxpbmcgYmluZGluZyBmb3Igd2lkdGggd2lsbCBiZSBhcHBsaWVkLlxuICpcbiAqICMjIyBXaGF0IGFib3V0IG1hcC1iYXNlZCBzdHlsaW5nIGJpbmRpbmdzP1xuICogTWFwLWJhc2VkIHN0eWxpbmcgYmluZGluZ3MgYXJlIGFjdGl2YXRlZCB3aGVuIHRoZXJlIGFyZSBvbmUgb3IgbW9yZVxuICogYFtzdHlsZV1gIGFuZC9vciBgW2NsYXNzXWAgYmluZGluZ3MgcHJlc2VudCBvbiBhbiBlbGVtZW50LiBXaGVuIHRoaXNcbiAqIGNvZGUgaXMgYWN0aXZhdGVkLCB0aGUgYXBwbHkgYWxnb3JpdGhtIHdpbGwgaXRlcmF0ZSBvdmVyIGVhY2ggbWFwXG4gKiBlbnRyeSBhbmQgYXBwbHkgZWFjaCBzdHlsaW5nIHZhbHVlIHRvIHRoZSBlbGVtZW50IHdpdGggdGhlIHNhbWVcbiAqIHByaW9yaXRpemF0aW9uIHJ1bGVzIGFzIGFib3ZlLlxuICpcbiAqIEZvciB0aGUgYWxnb3JpdGhtIHRvIGFwcGx5IHN0eWxpbmcgdmFsdWVzIGVmZmljaWVudGx5LCB0aGVcbiAqIHN0eWxpbmcgbWFwIGVudHJpZXMgbXVzdCBiZSBhcHBsaWVkIGluIHN5bmMgKHByb3BlcnR5IGJ5IHByb3BlcnR5KVxuICogd2l0aCBwcm9wLWJhc2VkIGJpbmRpbmdzLiAoVGhlIG1hcC1iYXNlZCBhbGdvcml0aG0gaXMgZGVzY3JpYmVkXG4gKiBtb3JlIGluc2lkZSBvZiB0aGUgYHJlbmRlcjMvc3R5bGluZ19uZXh0L21hcF9iYXNlZF9iaW5kaW5ncy50c2AgZmlsZS4pXG4gKlxuICogIyMgU2FuaXRpemF0aW9uXG4gKiBTYW5pdGl6YXRpb24gaXMgdXNlZCB0byBwcmV2ZW50IGludmFsaWQgc3R5bGUgdmFsdWVzIGZyb20gYmVpbmcgYXBwbGllZCB0b1xuICogdGhlIGVsZW1lbnQuXG4gKlxuICogSXQgaXMgZW5hYmxlZCBpbiB0d28gY2FzZXM6XG4gKlxuICogICAxLiBUaGUgYHN0eWxlU2FuaXRpemVyKHNhbml0aXplckZuKWAgaW5zdHJ1Y3Rpb24gd2FzIGNhbGxlZCAoanVzdCBiZWZvcmUgYW55IG90aGVyXG4gKiAgICAgIHN0eWxpbmcgaW5zdHJ1Y3Rpb25zIGFyZSBydW4pLlxuICpcbiAqICAgMi4gVGhlIGNvbXBvbmVudC9kaXJlY3RpdmUgYExWaWV3YCBpbnN0YW5jZSBoYXMgYSBzYW5pdGl6ZXIgb2JqZWN0IGF0dGFjaGVkIHRvIGl0XG4gKiAgICAgICh0aGlzIGhhcHBlbnMgd2hlbiBgcmVuZGVyQ29tcG9uZW50YCBpcyBleGVjdXRlZCB3aXRoIGEgYHNhbml0aXplcmAgdmFsdWUgb3JcbiAqICAgICAgaWYgdGhlIG5nTW9kdWxlIGNvbnRhaW5zIGEgc2FuaXRpemVyIHByb3ZpZGVyIGF0dGFjaGVkIHRvIGl0KS5cbiAqXG4gKiBJZiBhbmQgd2hlbiBzYW5pdGl6YXRpb24gaXMgYWN0aXZlIHRoZW4gYWxsIHByb3BlcnR5L3ZhbHVlIGVudHJpZXMgd2lsbCBiZSBldmFsdWF0ZWRcbiAqIHRocm91Z2ggdGhlIGFjdGl2ZSBzYW5pdGl6ZXIgYmVmb3JlIHRoZXkgYXJlIGFwcGxpZWQgdG8gdGhlIGVsZW1lbnQgKG9yIHRoZSBzdHlsaW5nXG4gKiBkZWJ1ZyBoYW5kbGVyKS5cbiAqXG4gKiBJZiBhIGBTYW5pdGl6ZXJgIG9iamVjdCBpcyB1c2VkICh2aWEgdGhlIGBMVmlld1tTQU5JVElaRVJdYCB2YWx1ZSkgdGhlbiB0aGF0IG9iamVjdFxuICogd2lsbCBiZSB1c2VkIGZvciBldmVyeSBwcm9wZXJ0eS5cbiAqXG4gKiBJZiBhIGBTdHlsZVNhbml0aXplckZuYCBmdW5jdGlvbiBpcyB1c2VkICh2aWEgdGhlIGBzdHlsZVNhbml0aXplcmApIHRoZW4gaXQgd2lsbCBiZVxuICogY2FsbGVkIGluIHR3byB3YXlzOlxuICpcbiAqICAgMS4gcHJvcGVydHkgdmFsaWRhdGlvbiBtb2RlOiB0aGlzIHdpbGwgYmUgY2FsbGVkIGVhcmx5IHRvIG1hcmsgd2hldGhlciBhIHByb3BlcnR5XG4gKiAgICAgIHNob3VsZCBiZSBzYW5pdGl6ZWQgb3Igbm90IGF0IGR1cmluZyB0aGUgZmx1c2hpbmcgc3RhZ2UuXG4gKlxuICogICAyLiB2YWx1ZSBzYW5pdGl6YXRpb24gbW9kZTogdGhpcyB3aWxsIGJlIGNhbGxlZCBkdXJpbmcgdGhlIGZsdXNoaW5nIHN0YWdlIGFuZCB3aWxsXG4gKiAgICAgIHJ1biB0aGUgc2FuaXRpemVyIGZ1bmN0aW9uIGFnYWluc3QgdGhlIHZhbHVlIGJlZm9yZSBhcHBseWluZyBpdCB0byB0aGUgZWxlbWVudC5cbiAqXG4gKiBJZiBzYW5pdGl6YXRpb24gcmV0dXJucyBhbiBlbXB0eSB2YWx1ZSB0aGVuIHRoYXQgZW1wdHkgdmFsdWUgd2lsbCBiZSBhcHBsaWVkXG4gKiB0byB0aGUgZWxlbWVudC5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBUU3R5bGluZ0NvbnRleHQgZXh0ZW5kc1xuICAgIEFycmF5PG51bWJlcnxzdHJpbmd8bnVtYmVyfGJvb2xlYW58bnVsbHxTdHlsaW5nTWFwQXJyYXl8e30+IHtcbiAgLyoqIENvbmZpZ3VyYXRpb24gZGF0YSBmb3IgdGhlIGNvbnRleHQgKi9cbiAgW1RTdHlsaW5nQ29udGV4dEluZGV4LkNvbmZpZ1Bvc2l0aW9uXTogVFN0eWxpbmdDb25maWc7XG5cbiAgLyoqIFRoZSB0b3RhbCBhbW91bnQgb2Ygc291cmNlcyBwcmVzZW50IGluIHRoZSBjb250ZXh0ICovXG4gIFtUU3R5bGluZ0NvbnRleHRJbmRleC5Ub3RhbFNvdXJjZXNQb3NpdGlvbl06IG51bWJlcjtcblxuICAvKiogSW5pdGlhbCB2YWx1ZSBwb3NpdGlvbiBmb3Igc3RhdGljIHN0eWxlcyAqL1xuICBbVFN0eWxpbmdDb250ZXh0SW5kZXguSW5pdGlhbFN0eWxpbmdWYWx1ZVBvc2l0aW9uXTogU3R5bGluZ01hcEFycmF5O1xufVxuXG4vKipcbiAqIEEgc2VyaWVzIG9mIGZsYWdzIHVzZWQgdG8gY29uZmlndXJlIHRoZSBjb25maWcgdmFsdWUgcHJlc2VudCB3aXRoaW4gYW4gaW5zdGFuY2Ugb2ZcbiAqIGBUU3R5bGluZ0NvbnRleHRgLlxuICovXG5leHBvcnQgY29uc3QgZW51bSBUU3R5bGluZ0NvbmZpZyB7XG4gIC8qKlxuICAgKiBUaGUgaW5pdGlhbCBzdGF0ZSBvZiB0aGUgc3R5bGluZyBjb250ZXh0IGNvbmZpZy5cbiAgICovXG4gIEluaXRpYWwgPSAwYjAwMDAwMDAsXG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgb3Igbm90IHRoZXJlIGFyZSBwcm9wLWJhc2VkIGJpbmRpbmdzIHByZXNlbnQuXG4gICAqXG4gICAqIEV4YW1wbGVzIGluY2x1ZGU6XG4gICAqIDEuIGA8ZGl2IFtzdHlsZS5wcm9wXT1cInhcIj5gXG4gICAqIDIuIGA8ZGl2IFtjbGFzcy5wcm9wXT1cInhcIj5gXG4gICAqIDMuIGBASG9zdEJpbmRpbmcoJ3N0eWxlLnByb3AnKSB4YFxuICAgKiA0LiBgQEhvc3RCaW5kaW5nKCdjbGFzcy5wcm9wJykgeGBcbiAgICovXG4gIEhhc1Byb3BCaW5kaW5ncyA9IDBiMDAwMDAwMSxcblxuICAvKipcbiAgICogV2hldGhlciBvciBub3QgdGhlcmUgYXJlIG1hcC1iYXNlZCBiaW5kaW5ncyBwcmVzZW50LlxuICAgKlxuICAgKiBFeGFtcGxlcyBpbmNsdWRlOlxuICAgKiAxLiBgPGRpdiBbc3R5bGVdPVwieFwiPmBcbiAgICogMi4gYDxkaXYgW2NsYXNzXT1cInhcIj5gXG4gICAqIDMuIGBASG9zdEJpbmRpbmcoJ3N0eWxlJykgeGBcbiAgICogNC4gYEBIb3N0QmluZGluZygnY2xhc3MnKSB4YFxuICAgKi9cbiAgSGFzTWFwQmluZGluZ3MgPSAwYjAwMDAwMTAsXG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgb3Igbm90IHRoZXJlIGFyZSBtYXAtYmFzZWQgYW5kIHByb3AtYmFzZWQgYmluZGluZ3MgcHJlc2VudC5cbiAgICpcbiAgICogRXhhbXBsZXMgaW5jbHVkZTpcbiAgICogMS4gYDxkaXYgW3N0eWxlXT1cInhcIiBbc3R5bGUucHJvcF09XCJ5XCI+YFxuICAgKiAyLiBgPGRpdiBbY2xhc3NdPVwieFwiIFtzdHlsZS5wcm9wXT1cInlcIj5gXG4gICAqIDMuIGA8ZGl2IFtzdHlsZV09XCJ4XCIgZGlyLXRoYXQtc2V0cy1zb21lLXByb3A+YFxuICAgKiA0LiBgPGRpdiBbY2xhc3NdPVwieFwiIGRpci10aGF0LXNldHMtc29tZS1jbGFzcz5gXG4gICAqL1xuICBIYXNQcm9wQW5kTWFwQmluZGluZ3MgPSAwYjAwMDAwMTEsXG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgb3Igbm90IHRoZXJlIGFyZSB0d28gb3IgbW9yZSBzb3VyY2VzIGZvciBhIHNpbmdsZSBwcm9wZXJ0eSBpbiB0aGUgY29udGV4dC5cbiAgICpcbiAgICogRXhhbXBsZXMgaW5jbHVkZTpcbiAgICogMS4gcHJvcCArIHByb3A6IGA8ZGl2IFtzdHlsZS53aWR0aF09XCJ4XCIgZGlyLXRoYXQtc2V0cy13aWR0aD5gXG4gICAqIDIuIG1hcCArIHByb3A6IGA8ZGl2IFtzdHlsZV09XCJ4XCIgW3N0eWxlLnByb3BdPmBcbiAgICogMy4gbWFwICsgbWFwOiBgPGRpdiBbc3R5bGVdPVwieFwiIGRpci10aGF0LXNldHMtc3R5bGU+YFxuICAgKi9cbiAgSGFzQ29sbGlzaW9ucyA9IDBiMDAwMDEwMCxcblxuICAvKipcbiAgICogV2hldGhlciBvciBub3QgdGhlIGNvbnRleHQgY29udGFpbnMgaW5pdGlhbCBzdHlsaW5nIHZhbHVlcy5cbiAgICpcbiAgICogRXhhbXBsZXMgaW5jbHVkZTpcbiAgICogMS4gYDxkaXYgc3R5bGU9XCJ3aWR0aDoyMDBweFwiPmBcbiAgICogMi4gYDxkaXYgY2xhc3M9XCJvbmUgdHdvIHRocmVlXCI+YFxuICAgKiAzLiBgQERpcmVjdGl2ZSh7IGhvc3Q6IHsgJ3N0eWxlJzogJ3dpZHRoOjIwMHB4JyB9IH0pYFxuICAgKiA0LiBgQERpcmVjdGl2ZSh7IGhvc3Q6IHsgJ2NsYXNzJzogJ29uZSB0d28gdGhyZWUnIH0gfSlgXG4gICAqL1xuICBIYXNJbml0aWFsU3R5bGluZyA9IDBiMDAwMDEwMDAsXG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgb3Igbm90IHRoZSBjb250ZXh0IGNvbnRhaW5zIG9uZSBvciBtb3JlIHRlbXBsYXRlIGJpbmRpbmdzLlxuICAgKlxuICAgKiBFeGFtcGxlcyBpbmNsdWRlOlxuICAgKiAxLiBgPGRpdiBbc3R5bGVdPVwieFwiPmBcbiAgICogMi4gYDxkaXYgW3N0eWxlLndpZHRoXT1cInhcIj5gXG4gICAqIDMuIGA8ZGl2IFtjbGFzc109XCJ4XCI+YFxuICAgKiA0LiBgPGRpdiBbY2xhc3MubmFtZV09XCJ4XCI+YFxuICAgKi9cbiAgSGFzVGVtcGxhdGVCaW5kaW5ncyA9IDBiMDAwMTAwMDAsXG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgb3Igbm90IHRoZSBjb250ZXh0IGNvbnRhaW5zIG9uZSBvciBtb3JlIGhvc3QgYmluZGluZ3MuXG4gICAqXG4gICAqIEV4YW1wbGVzIGluY2x1ZGU6XG4gICAqIDEuIGBASG9zdEJpbmRpbmcoJ3N0eWxlJykgeGBcbiAgICogMi4gYEBIb3N0QmluZGluZygnc3R5bGUud2lkdGgnKSB4YFxuICAgKiAzLiBgQEhvc3RCaW5kaW5nKCdjbGFzcycpIHhgXG4gICAqIDQuIGBASG9zdEJpbmRpbmcoJ2NsYXNzLm5hbWUnKSB4YFxuICAgKi9cbiAgSGFzSG9zdEJpbmRpbmdzID0gMGIwMDEwMDAwMCxcblxuICAvKipcbiAgICogV2hldGhlciBvciBub3QgdGhlIHRlbXBsYXRlIGJpbmRpbmdzIGFyZSBhbGxvd2VkIHRvIGJlIHJlZ2lzdGVyZWQgaW4gdGhlIGNvbnRleHQuXG4gICAqXG4gICAqIFRoaXMgZmxhZyBpcyBhZnRlciBvbmUgb3IgbW9yZSB0ZW1wbGF0ZS1iYXNlZCBzdHlsZS9jbGFzcyBiaW5kaW5ncyB3ZXJlXG4gICAqIHNldCBhbmQgcHJvY2Vzc2VkIGZvciBhbiBlbGVtZW50LiBPbmNlIHRoZSBiaW5kaW5ncyBhcmUgcHJvY2Vzc2VkIHRoZW4gYSBjYWxsXG4gICAqIHRvIHN0eWxpbmdBcHBseSBpcyBpc3N1ZWQgYW5kIHRoZSBsb2NrIHdpbGwgYmUgcHV0IGludG8gcGxhY2UuXG4gICAqXG4gICAqIE5vdGUgdGhhdCB0aGlzIGlzIG9ubHkgc2V0IG9uY2UuXG4gICAqL1xuICBUZW1wbGF0ZUJpbmRpbmdzTG9ja2VkID0gMGIwMTAwMDAwMCxcblxuICAvKipcbiAgICogV2hldGhlciBvciBub3QgdGhlIGhvc3QgYmluZGluZ3MgYXJlIGFsbG93ZWQgdG8gYmUgcmVnaXN0ZXJlZCBpbiB0aGUgY29udGV4dC5cbiAgICpcbiAgICogVGhpcyBmbGFnIGlzIGFmdGVyIG9uZSBvciBtb3JlIGhvc3QtYmFzZWQgc3R5bGUvY2xhc3MgYmluZGluZ3Mgd2VyZVxuICAgKiBzZXQgYW5kIHByb2Nlc3NlZCBmb3IgYW4gZWxlbWVudC4gT25jZSB0aGUgYmluZGluZ3MgYXJlIHByb2Nlc3NlZCB0aGVuIGEgY2FsbFxuICAgKiB0byBzdHlsaW5nQXBwbHkgaXMgaXNzdWVkIGFuZCB0aGUgbG9jayB3aWxsIGJlIHB1dCBpbnRvIHBsYWNlLlxuICAgKlxuICAgKiBOb3RlIHRoYXQgdGhpcyBpcyBvbmx5IHNldCBvbmNlLlxuICAgKi9cbiAgSG9zdEJpbmRpbmdzTG9ja2VkID0gMGIxMDAwMDAwMCxcblxuICAvKiogQSBNYXNrIG9mIGFsbCB0aGUgY29uZmlndXJhdGlvbnMgKi9cbiAgTWFzayA9IDBiMTExMTExMTEsXG5cbiAgLyoqIFRvdGFsIGFtb3VudCBvZiBjb25maWd1cmF0aW9uIGJpdHMgdXNlZCAqL1xuICBUb3RhbEJpdHMgPSA4LFxufVxuXG4vKipcbiAqIEFuIGluZGV4IG9mIHBvc2l0aW9uIGFuZCBvZmZzZXQgdmFsdWVzIHVzZWQgdG8gbmF2aWdhdGUgdGhlIGBUU3R5bGluZ0NvbnRleHRgLlxuICovXG5leHBvcnQgY29uc3QgZW51bSBUU3R5bGluZ0NvbnRleHRJbmRleCB7XG4gIENvbmZpZ1Bvc2l0aW9uID0gMCxcbiAgVG90YWxTb3VyY2VzUG9zaXRpb24gPSAxLFxuICBJbml0aWFsU3R5bGluZ1ZhbHVlUG9zaXRpb24gPSAyLFxuICBWYWx1ZXNTdGFydFBvc2l0aW9uID0gMyxcblxuICAvLyBlYWNoIHR1cGxlIGVudHJ5IGluIHRoZSBjb250ZXh0XG4gIC8vIChjb25maWcsIHRlbXBsYXRlQml0R3VhcmQsIGhvc3RCaW5kaW5nQml0R3VhcmQsIHByb3AsIC4uLmJpbmRpbmdzfHxkZWZhdWx0LXZhbHVlKVxuICBDb25maWdPZmZzZXQgPSAwLFxuICBUZW1wbGF0ZUJpdEd1YXJkT2Zmc2V0ID0gMSxcbiAgSG9zdEJpbmRpbmdzQml0R3VhcmRPZmZzZXQgPSAyLFxuICBQcm9wT2Zmc2V0ID0gMyxcbiAgQmluZGluZ3NTdGFydE9mZnNldCA9IDRcbn1cblxuLyoqXG4gKiBBIHNlcmllcyBvZiBmbGFncyB1c2VkIGZvciBlYWNoIHByb3BlcnR5IGVudHJ5IHdpdGhpbiB0aGUgYFRTdHlsaW5nQ29udGV4dGAuXG4gKi9cbmV4cG9ydCBjb25zdCBlbnVtIFRTdHlsaW5nQ29udGV4dFByb3BDb25maWdGbGFncyB7XG4gIERlZmF1bHQgPSAwYjAsXG4gIFNhbml0aXphdGlvblJlcXVpcmVkID0gMGIxLFxuICBUb3RhbEJpdHMgPSAxLFxuICBNYXNrID0gMGIxLFxufVxuXG4vKipcbiAqIEEgZnVuY3Rpb24gdXNlZCB0byBhcHBseSBvciByZW1vdmUgc3R5bGluZyBmcm9tIGFuIGVsZW1lbnQgZm9yIGEgZ2l2ZW4gcHJvcGVydHkuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgQXBwbHlTdHlsaW5nRm4ge1xuICAocmVuZGVyZXI6IFJlbmRlcmVyM3xQcm9jZWR1cmFsUmVuZGVyZXIzfG51bGwsIGVsZW1lbnQ6IFJFbGVtZW50LCBwcm9wOiBzdHJpbmcsIHZhbHVlOiBhbnksXG4gICBiaW5kaW5nSW5kZXg/OiBudW1iZXJ8bnVsbCk6IHZvaWQ7XG59XG5cbi8qKlxuICogUnVudGltZSBkYXRhIHR5cGUgdGhhdCBpcyB1c2VkIHRvIHN0b3JlIGJpbmRpbmcgZGF0YSByZWZlcmVuY2VkIGZyb20gdGhlIGBUU3R5bGluZ0NvbnRleHRgLlxuICpcbiAqIEJlY2F1c2UgYExWaWV3YCBpcyBqdXN0IGFuIGFycmF5IHdpdGggZGF0YSwgdGhlcmUgaXMgbm8gcmVhc29uIHRvXG4gKiBzcGVjaWFsIGNhc2UgYExWaWV3YCBldmVyeXdoZXJlIGluIHRoZSBzdHlsaW5nIGFsZ29yaXRobS4gQnkgYWxsb3dpbmdcbiAqIHRoaXMgZGF0YSB0eXBlIHRvIGJlIGFuIGFycmF5IHRoYXQgY29udGFpbnMgdmFyaW91cyBzY2FsYXIgZGF0YSB0eXBlcyxcbiAqIGFuIGluc3RhbmNlIG9mIGBMVmlld2AgZG9lc24ndCBuZWVkIHRvIGJlIGNvbnN0cnVjdGVkIGZvciB0ZXN0cy5cbiAqL1xuZXhwb3J0IHR5cGUgTFN0eWxpbmdEYXRhID0gTFZpZXcgfCAoc3RyaW5nIHwgbnVtYmVyIHwgYm9vbGVhbiB8IG51bGwpW107XG5cbi8qKlxuICogQXJyYXktYmFzZWQgcmVwcmVzZW50YXRpb24gb2YgYSBrZXkvdmFsdWUgYXJyYXkuXG4gKlxuICogVGhlIGZvcm1hdCBvZiB0aGUgYXJyYXkgaXMgXCJwcm9wZXJ0eVwiLCBcInZhbHVlXCIsIFwicHJvcGVydHkyXCIsXG4gKiBcInZhbHVlMlwiLCBldGMuLi5cbiAqXG4gKiBUaGUgZmlyc3QgdmFsdWUgaW4gdGhlIGFycmF5IGlzIHJlc2VydmVkIHRvIHN0b3JlIHRoZSBpbnN0YW5jZVxuICogb2YgdGhlIGtleS92YWx1ZSBhcnJheSB0aGF0IHdhcyB1c2VkIHRvIHBvcHVsYXRlIHRoZSBwcm9wZXJ0eS9cbiAqIHZhbHVlIGVudHJpZXMgdGhhdCB0YWtlIHBsYWNlIGluIHRoZSByZW1haW5kZXIgb2YgdGhlIGFycmF5LlxuICovXG5leHBvcnQgaW50ZXJmYWNlIFN0eWxpbmdNYXBBcnJheSBleHRlbmRzIEFycmF5PHt9fHN0cmluZ3xudW1iZXJ8bnVsbD4ge1xuICBbU3R5bGluZ01hcEFycmF5SW5kZXguUmF3VmFsdWVQb3NpdGlvbl06IHt9fHN0cmluZ3xudWxsO1xufVxuXG4vKipcbiAqIEFuIGluZGV4IG9mIHBvc2l0aW9uIGFuZCBvZmZzZXQgcG9pbnRzIGZvciBhbnkgZGF0YSBzdG9yZWQgd2l0aGluIGEgYFN0eWxpbmdNYXBBcnJheWAgaW5zdGFuY2UuXG4gKi9cbmV4cG9ydCBjb25zdCBlbnVtIFN0eWxpbmdNYXBBcnJheUluZGV4IHtcbiAgLyoqIFdoZXJlIHRoZSB2YWx1ZXMgc3RhcnQgaW4gdGhlIGFycmF5ICovXG4gIFZhbHVlc1N0YXJ0UG9zaXRpb24gPSAxLFxuXG4gIC8qKiBUaGUgbG9jYXRpb24gb2YgdGhlIHJhdyBrZXkvdmFsdWUgbWFwIGluc3RhbmNlIHVzZWQgbGFzdCB0byBwb3B1bGF0ZSB0aGUgYXJyYXkgZW50cmllcyAqL1xuICBSYXdWYWx1ZVBvc2l0aW9uID0gMCxcblxuICAvKiogVGhlIHNpemUgb2YgZWFjaCBwcm9wZXJ0eS92YWx1ZSBlbnRyeSAqL1xuICBUdXBsZVNpemUgPSAyLFxuXG4gIC8qKiBUaGUgb2Zmc2V0IGZvciB0aGUgcHJvcGVydHkgZW50cnkgaW4gdGhlIHR1cGxlICovXG4gIFByb3BPZmZzZXQgPSAwLFxuXG4gIC8qKiBUaGUgb2Zmc2V0IGZvciB0aGUgdmFsdWUgZW50cnkgaW4gdGhlIHR1cGxlICovXG4gIFZhbHVlT2Zmc2V0ID0gMSxcbn1cblxuLyoqXG4gKiBVc2VkIHRvIGFwcGx5L3RyYXZlcnNlIGFjcm9zcyBhbGwgbWFwLWJhc2VkIHN0eWxpbmcgZW50cmllcyB1cCB0byB0aGUgcHJvdmlkZWQgYHRhcmdldFByb3BgXG4gKiB2YWx1ZS5cbiAqXG4gKiBXaGVuIGNhbGxlZCwgZWFjaCBvZiB0aGUgbWFwLWJhc2VkIGBTdHlsaW5nTWFwQXJyYXlgIGVudHJpZXMgKHdoaWNoIGFyZSBzdG9yZWQgaW5cbiAqIHRoZSBwcm92aWRlZCBgTFN0eWxpbmdEYXRhYCBhcnJheSkgd2lsbCBiZSBpdGVyYXRlZCBvdmVyLiBEZXBlbmRpbmcgb24gdGhlIHByb3ZpZGVkXG4gKiBgbW9kZWAgdmFsdWUsIGVhY2ggcHJvcC92YWx1ZSBlbnRyeSBtYXkgYmUgYXBwbGllZCBvciBza2lwcGVkIG92ZXIuXG4gKlxuICogSWYgYHRhcmdldFByb3BgIHZhbHVlIGlzIHByb3ZpZGVkIHRoZSBpdGVyYXRpb24gY29kZSB3aWxsIHN0b3Agb25jZSBpdCByZWFjaGVzXG4gKiB0aGUgcHJvcGVydHkgKGlmIGZvdW5kKS4gT3RoZXJ3aXNlIGlmIHRoZSB0YXJnZXQgcHJvcGVydHkgaXMgbm90IGVuY291bnRlcmVkIHRoZW5cbiAqIGl0IHdpbGwgc3RvcCBvbmNlIGl0IHJlYWNoZXMgdGhlIG5leHQgdmFsdWUgdGhhdCBhcHBlYXJzIGFscGhhYmV0aWNhbGx5IGFmdGVyIGl0LlxuICpcbiAqIElmIGEgYGRlZmF1bHRWYWx1ZWAgaXMgcHJvdmlkZWQgdGhlbiBpdCB3aWxsIGJlIGFwcGxpZWQgdG8gdGhlIGVsZW1lbnQgb25seSBpZiB0aGVcbiAqIGB0YXJnZXRQcm9wYCBwcm9wZXJ0eSB2YWx1ZSBpcyBlbmNvdW50ZXJlZCBhbmQgdGhlIHZhbHVlIGFzc29jaWF0ZWQgd2l0aCB0aGUgdGFyZ2V0XG4gKiBwcm9wZXJ0eSBpcyBgbnVsbGAuIFRoZSByZWFzb24gd2h5IHRoZSBgZGVmYXVsdFZhbHVlYCBpcyBuZWVkZWQgaXMgdG8gYXZvaWQgaGF2aW5nIHRoZVxuICogYWxnb3JpdGhtIGFwcGx5IGEgYG51bGxgIHZhbHVlIGFuZCB0aGVuIGFwcGx5IGEgZGVmYXVsdCB2YWx1ZSBhZnRlcndhcmRzICh0aGlzIHdvdWxkXG4gKiBlbmQgdXAgYmVpbmcgdHdvIHN0eWxlIHByb3BlcnR5IHdyaXRlcykuXG4gKlxuICogQHJldHVybnMgd2hldGhlciBvciBub3QgdGhlIHRhcmdldCBwcm9wZXJ0eSB3YXMgcmVhY2hlZCBhbmQgaXRzIHZhbHVlIHdhc1xuICogIGFwcGxpZWQgdG8gdGhlIGVsZW1lbnQuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgU3luY1N0eWxpbmdNYXBzRm4ge1xuICAoY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCByZW5kZXJlcjogUmVuZGVyZXIzfFByb2NlZHVyYWxSZW5kZXJlcjN8bnVsbCwgZWxlbWVudDogUkVsZW1lbnQsXG4gICBkYXRhOiBMU3R5bGluZ0RhdGEsIHNvdXJjZUluZGV4OiBudW1iZXIsIGFwcGx5U3R5bGluZ0ZuOiBBcHBseVN0eWxpbmdGbixcbiAgIHNhbml0aXplcjogU3R5bGVTYW5pdGl6ZUZufG51bGwsIG1vZGU6IFN0eWxpbmdNYXBzU3luY01vZGUsIHRhcmdldFByb3A/OiBzdHJpbmd8bnVsbCxcbiAgIGRlZmF1bHRWYWx1ZT86IGJvb2xlYW58c3RyaW5nfG51bGwpOiBib29sZWFuO1xufVxuXG4vKipcbiAqIFVzZWQgdG8gZGlyZWN0IGhvdyBtYXAtYmFzZWQgdmFsdWVzIGFyZSBhcHBsaWVkL3RyYXZlcnNlZCB3aGVuIHN0eWxpbmcgaXMgZmx1c2hlZC5cbiAqL1xuZXhwb3J0IGNvbnN0IGVudW0gU3R5bGluZ01hcHNTeW5jTW9kZSB7XG4gIC8qKiBPbmx5IHRyYXZlcnNlIHZhbHVlcyAobm8gcHJvcC92YWx1ZSBzdHlsaW5nIGVudHJpZXMgZ2V0IGFwcGxpZWQpICovXG4gIFRyYXZlcnNlVmFsdWVzID0gMGIwMDAsXG5cbiAgLyoqIEFwcGx5IGV2ZXJ5IHByb3AvdmFsdWUgc3R5bGluZyBlbnRyeSB0byB0aGUgZWxlbWVudCAqL1xuICBBcHBseUFsbFZhbHVlcyA9IDBiMDAxLFxuXG4gIC8qKiBPbmx5IGFwcGx5IHRoZSB0YXJnZXQgcHJvcC92YWx1ZSBlbnRyeSAqL1xuICBBcHBseVRhcmdldFByb3AgPSAwYjAxMCxcblxuICAvKiogU2tpcCBhcHBseWluZyB0aGUgdGFyZ2V0IHByb3AvdmFsdWUgZW50cnkgKi9cbiAgU2tpcFRhcmdldFByb3AgPSAwYjEwMCxcblxuICAvKiogSXRlcmF0ZSBvdmVyIGlubmVyIG1hcHMgbWFwIHZhbHVlcyBpbiB0aGUgY29udGV4dCAqL1xuICBSZWN1cnNlSW5uZXJNYXBzID0gMGIxMDAwLFxuXG4gIC8qKiBPbmx5IGNoZWNrIHRvIHNlZSBpZiBhIHZhbHVlIHdhcyBzZXQgc29tZXdoZXJlIGluIGVhY2ggbWFwICovXG4gIENoZWNrVmFsdWVzT25seSA9IDBiMTAwMDAsXG59XG4iXX0=