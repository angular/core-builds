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
 * more inside of the `render3/styling/map_based_bindings.ts` file.)
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3R5bGluZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaW50ZXJmYWNlcy9zdHlsaW5nLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFtVUEscUNBVUM7Ozs7Ozs7Ozs7O0lBT0M7O09BRUc7SUFDSCxVQUFtQjtJQUVuQjs7Ozs7Ozs7T0FRRztJQUNILGtCQUEyQjtJQUUzQjs7Ozs7Ozs7T0FRRztJQUNILGlCQUEwQjtJQUUxQjs7Ozs7Ozs7T0FRRztJQUNILHdCQUFpQztJQUVqQzs7Ozs7OztPQU9HO0lBQ0gsZ0JBQXlCO0lBRXpCOzs7Ozs7OztPQVFHO0lBQ0gsb0JBQThCO0lBRTlCOzs7Ozs7OztPQVFHO0lBQ0gsdUJBQWdDO0lBRWhDOzs7Ozs7OztPQVFHO0lBQ0gsbUJBQTRCO0lBRTVCOzs7Ozs7OztPQVFHO0lBQ0gsMEJBQW1DO0lBRW5DOzs7Ozs7OztPQVFHO0lBQ0gsdUJBQStCO0lBRS9CLHVDQUF1QztJQUN2QyxTQUFpQjtJQUVqQiw4Q0FBOEM7SUFDOUMsWUFBYTs7Ozs7SUFPYixpQkFBa0I7SUFDbEIsdUJBQXdCO0lBQ3hCLDhCQUErQjtJQUMvQixzQkFBdUI7SUFFdkIsa0NBQWtDO0lBQ2xDLG9GQUFvRjtJQUNwRixlQUFnQjtJQUNoQix5QkFBMEI7SUFDMUIsNkJBQThCO0lBQzlCLGFBQWM7SUFDZCxzQkFBdUI7Ozs7O0lBT3ZCLFVBQWE7SUFDYix1QkFBMEI7SUFDMUIsWUFBYTtJQUNiLE9BQVU7Ozs7Ozs7QUFNWixvQ0FHQzs7Ozs7Ozs7Ozs7O0FBc0JELHFDQUVDOzs7Ozs7O0lBTUMsMENBQTBDO0lBQzFDLHNCQUF1QjtJQUV2Qiw2RkFBNkY7SUFDN0YsbUJBQW9CO0lBRXBCLDRDQUE0QztJQUM1QyxZQUFhO0lBRWIscURBQXFEO0lBQ3JELGFBQWM7SUFFZCxrREFBa0Q7SUFDbEQsY0FBZTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQXdCakIsdUNBS0M7OztJQU1DLHVFQUF1RTtJQUN2RSxpQkFBc0I7SUFFdEIsMERBQTBEO0lBQzFELGlCQUFzQjtJQUV0Qiw2Q0FBNkM7SUFDN0Msa0JBQXVCO0lBRXZCLGdEQUFnRDtJQUNoRCxpQkFBc0I7SUFFdEIsd0RBQXdEO0lBQ3hELG1CQUF5QjtJQUV6QixpRUFBaUU7SUFDakUsbUJBQXlCIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4qIEBsaWNlbnNlXG4qIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuKlxuKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4qL1xuaW1wb3J0IHtTdHlsZVNhbml0aXplRm59IGZyb20gJy4uLy4uL3Nhbml0aXphdGlvbi9zdHlsZV9zYW5pdGl6ZXInO1xuaW1wb3J0IHtQcm9jZWR1cmFsUmVuZGVyZXIzLCBSRWxlbWVudCwgUmVuZGVyZXIzfSBmcm9tICcuL3JlbmRlcmVyJztcbmltcG9ydCB7TFZpZXd9IGZyb20gJy4vdmlldyc7XG5cbi8qKlxuICogLS0tLS0tLS1cbiAqXG4gKiBUaGlzIGZpbGUgY29udGFpbnMgdGhlIGNvcmUgaW50ZXJmYWNlcyBmb3Igc3R5bGluZyBpbiBBbmd1bGFyLlxuICpcbiAqIFRvIGxlYXJuIG1vcmUgYWJvdXQgdGhlIGFsZ29yaXRobSBzZWUgYFRTdHlsaW5nQ29udGV4dGAuXG4gKlxuICogLS0tLS0tLS1cbiAqL1xuXG4vKipcbiAqIEEgc3RhdGljLWxldmVsIHJlcHJlc2VudGF0aW9uIG9mIGFsbCBzdHlsZSBvciBjbGFzcyBiaW5kaW5ncy92YWx1ZXNcbiAqIGFzc29jaWF0ZWQgd2l0aCBhIGBUTm9kZWAuXG4gKlxuICogVGhlIGBUU3R5bGluZ0NvbnRleHRgIHVuaXRlcyBhbGwgdGVtcGxhdGUgc3R5bGluZyBiaW5kaW5ncyAoaS5lLlxuICogYFtjbGFzc11gIGFuZCBgW3N0eWxlXWAgYmluZGluZ3MpIGFzIHdlbGwgYXMgYWxsIGhvc3QtbGV2ZWxcbiAqIHN0eWxpbmcgYmluZGluZ3MgKGZvciBjb21wb25lbnRzIGFuZCBkaXJlY3RpdmVzKSB0b2dldGhlciBpbnRvXG4gKiBhIHNpbmdsZSBtYW5pZmVzdFxuICpcbiAqIFRoZSBzdHlsaW5nIGNvbnRleHQgaXMgc3RvcmVkIG9uIGEgYFROb2RlYCBvbiBhbmQgdGhlcmUgYXJlXG4gKiB0d28gaW5zdGFuY2VzIG9mIGl0OiBvbmUgZm9yIGNsYXNzZXMgYW5kIGFub3RoZXIgZm9yIHN0eWxlcy5cbiAqXG4gKiBgYGB0eXBlc2NyaXB0XG4gKiB0Tm9kZS5zdHlsZXMgPSBbIC4uLiBhIGNvbnRleHQgb25seSBmb3Igc3R5bGVzIC4uLiBdO1xuICogdE5vZGUuY2xhc3NlcyA9IFsgLi4uIGEgY29udGV4dCBvbmx5IGZvciBjbGFzc2VzIC4uLiBdO1xuICogYGBgXG4gKlxuICogVGhlIHN0eWxpbmcgY29udGV4dCBpcyBjcmVhdGVkIGVhY2ggdGltZSB0aGVyZSBhcmUgb25lIG9yIG1vcmVcbiAqIHN0eWxpbmcgYmluZGluZ3MgKHN0eWxlIG9yIGNsYXNzIGJpbmRpbmdzKSBwcmVzZW50IGZvciBhbiBlbGVtZW50LFxuICogYnV0IGlzIG9ubHkgY3JlYXRlZCBvbmNlIHBlciBgVE5vZGVgLlxuICpcbiAqIGB0Tm9kZS5zdHlsZXNgIGFuZCBgdE5vZGUuY2xhc3Nlc2AgY2FuIGJlIGFuIGluc3RhbmNlIG9mIHRoZSBmb2xsb3dpbmc6XG4gKlxuICogYGBgdHlwZXNjcmlwdFxuICogdE5vZGUuc3R5bGVzID0gbnVsbDsgLy8gbm8gc3RhdGljIHN0eWxpbmcgb3Igc3R5bGluZyBiaW5kaW5ncyBhY3RpdmVcbiAqIHROb2RlLnN0eWxlcyA9IFN0eWxpbmdNYXBBcnJheTsgLy8gb25seSBzdGF0aWMgdmFsdWVzIHByZXNlbnQgKGUuZy4gYDxkaXYgc3R5bGU9XCJ3aWR0aDoyMDBcIj5gKVxuICogdE5vZGUuc3R5bGVzID0gVFN0eWxpbmdDb250ZXh0OyAvLyBvbmUgb3IgbW9yZSBzdHlsaW5nIGJpbmRpbmdzIHByZXNlbnQgKGUuZy4gYDxkaXZcbiAqIFtzdHlsZS53aWR0aF0+YClcbiAqIGBgYFxuICpcbiAqIEJvdGggYHROb2RlLnN0eWxlc2AgYW5kIGB0Tm9kZS5jbGFzc2VzYCBhcmUgaW5zdGFudGlhdGVkIHdoZW4gYW55dGhpbmdcbiAqIHN0eWxpbmctcmVsYXRlZCBpcyBhY3RpdmUgb24gYW4gZWxlbWVudC4gVGhleSBhcmUgZmlyc3QgY3JlYXRlZCBmcm9tXG4gKiBmcm9tIHRoZSBhbnkgb2YgdGhlIGVsZW1lbnQtbGV2ZWwgaW5zdHJ1Y3Rpb25zIChlLmcuIGBlbGVtZW50YCxcbiAqIGBlbGVtZW50U3RhcnRgLCBgZWxlbWVudEhvc3RBdHRyc2ApLiBXaGVuIGFueSBzdGF0aWMgc3R5bGUvY2xhc3NcbiAqIHZhbHVlcyBhcmUgZW5jb3VudGVyZWQgdGhleSBhcmUgcmVnaXN0ZXJlZCBvbiB0aGUgYHROb2RlLnN0eWxlc2BcbiAqIGFuZCBgdE5vZGUuY2xhc3Nlc2AgZGF0YS1zdHJ1Y3R1cmVzLiBCeSBkZWZhdWx0ICh3aGVuIGFueSBzdGF0aWNcbiAqIHZhbHVlcyBhcmUgZW5jb3VudGVyZWQpIHRoZSBgdE5vZGUuc3R5bGVzYCBvciBgdE5vZGUuY2xhc3Nlc2AgdmFsdWVzXG4gKiBhcmUgaW5zdGFuY2VzIG9mIGEgYFN0eWxpbmdNYXBBcnJheWAuIE9ubHkgd2hlbiBzdHlsZS9jbGFzcyBiaW5kaW5nc1xuICogYXJlIGRldGVjdGVkIHRoZW4gdGhhdCBzdHlsaW5nIG1hcCBpcyBjb252ZXJ0ZWQgaW50byBhbiBpbnN0YW5jZSBvZlxuICogYFRTdHlsaW5nQ29udGV4dGAuXG4gKlxuICogRHVlIHRvIHRoZSBmYWN0IHRoZSB0aGUgYFRTdHlsaW5nQ29udGV4dGAgaXMgc3RvcmVkIG9uIGEgYFROb2RlYFxuICogdGhpcyBtZWFucyB0aGF0IGFsbCBkYXRhIHdpdGhpbiB0aGUgY29udGV4dCBpcyBzdGF0aWMuIEluc3RlYWQgb2ZcbiAqIHN0b3JpbmcgYWN0dWFsIHN0eWxpbmcgYmluZGluZyB2YWx1ZXMsIHRoZSBsVmlldyBiaW5kaW5nIGluZGV4IHZhbHVlc1xuICogYXJlIHN0b3JlZCB3aXRoaW4gdGhlIGNvbnRleHQuIChzdGF0aWMgbmF0dXJlIG1lYW5zIGl0IGlzIG1vcmUgY29tcGFjdC4pXG4gKlxuICogVGhlIGNvZGUgYmVsb3cgc2hvd3MgYSBicmVha2Rvd24gb2YgdHdvIGluc3RhbmNlcyBvZiBgVFN0eWxpbmdDb250ZXh0YFxuICogKG9uZSBmb3IgYHROb2RlLnN0eWxlc2AgYW5kIGFub3RoZXIgZm9yIGB0Tm9kZS5jbGFzc2VzYCk6XG4gKlxuICogYGBgdHlwZXNjcmlwdFxuICogLy8gPGRpdiBbY2xhc3MuYWN0aXZlXT1cImNcIiAgLy8gbFZpZXcgYmluZGluZyBpbmRleCA9IDIwXG4gKiAvLyAgICAgIFtzdHlsZS53aWR0aF09XCJ4XCIgICAvLyBsVmlldyBiaW5kaW5nIGluZGV4ID0gMjFcbiAqIC8vICAgICAgW3N0eWxlLmhlaWdodF09XCJ5XCI+IC8vIGxWaWV3IGJpbmRpbmcgaW5kZXggPSAyMlxuICogLy8gIC4uLlxuICogLy8gPC9kaXY+XG4gKiB0Tm9kZS5zdHlsZXMgPSBbXG4gKiAgIDAsICAgICAgICAgLy8gdGhlIGNvbnRleHQgY29uZmlnIHZhbHVlIChzZWUgYFRTdHlsaW5nQ29udGV4dENvbmZpZ2ApXG4gKiAgIDEsICAgICAgICAgLy8gdGhlIHRvdGFsIGFtb3VudCBvZiBzb3VyY2VzIHByZXNlbnQgKG9ubHkgYDFgIGIvYyB0aGVyZSBhcmUgb25seSB0ZW1wbGF0ZVxuICogYmluZGluZ3MpXG4gKiAgIFtudWxsXSwgICAgLy8gaW5pdGlhbCB2YWx1ZXMgYXJyYXkgKGFuIGluc3RhbmNlIG9mIGBTdHlsaW5nTWFwQXJyYXlgKVxuICpcbiAqICAgMCwgICAgICAgICAvLyBjb25maWcgZW50cnkgZm9yIHRoZSBwcm9wZXJ0eSAoc2VlIGBUU3R5bGluZ0NvbnRleHRQcm9wQ29uZmlnRmxhZ3NgKVxuICogICAwYjAxMCwgICAgIC8vIHRlbXBsYXRlIGd1YXJkIG1hc2sgZm9yIGhlaWdodFxuICogICAwLCAgICAgICAgIC8vIGhvc3QgYmluZGluZ3MgZ3VhcmQgbWFzayBmb3IgaGVpZ2h0XG4gKiAgICdoZWlnaHQnLCAgLy8gdGhlIHByb3BlcnR5IG5hbWVcbiAqICAgMjIsICAgICAgICAvLyB0aGUgYmluZGluZyBsb2NhdGlvbiBmb3IgdGhlIFwieVwiIGJpbmRpbmcgaW4gdGhlIGxWaWV3XG4gKiAgIG51bGwsICAgICAgLy8gdGhlIGRlZmF1bHQgdmFsdWUgZm9yIGhlaWdodFxuICpcbiAqICAgMCwgICAgICAgICAvLyBjb25maWcgZW50cnkgZm9yIHRoZSBwcm9wZXJ0eSAoc2VlIGBUU3R5bGluZ0NvbnRleHRQcm9wQ29uZmlnRmxhZ3NgKVxuICogICAwYjAwMSwgICAgIC8vIHRlbXBsYXRlIGd1YXJkIG1hc2sgZm9yIHdpZHRoXG4gKiAgIDAsICAgICAgICAgLy8gaG9zdCBiaW5kaW5ncyBndWFyZCBtYXNrIGZvciB3aWR0aFxuICogICAnd2lkdGgnLCAgIC8vIHRoZSBwcm9wZXJ0eSBuYW1lXG4gKiAgIDIxLCAgICAgICAgLy8gdGhlIGJpbmRpbmcgbG9jYXRpb24gZm9yIHRoZSBcInhcIiBiaW5kaW5nIGluIHRoZSBsVmlld1xuICogICBudWxsLCAgICAgIC8vIHRoZSBkZWZhdWx0IHZhbHVlIGZvciB3aWR0aFxuICogXTtcbiAqXG4gKiB0Tm9kZS5jbGFzc2VzID0gW1xuICogICAwLCAgICAgICAgIC8vIHRoZSBjb250ZXh0IGNvbmZpZyB2YWx1ZSAoc2VlIGBUU3R5bGluZ0NvbnRleHRDb25maWdgKVxuICogICAxLCAgICAgICAgIC8vIHRoZSB0b3RhbCBhbW91bnQgb2Ygc291cmNlcyBwcmVzZW50IChvbmx5IGAxYCBiL2MgdGhlcmUgYXJlIG9ubHkgdGVtcGxhdGVcbiAqIGJpbmRpbmdzKVxuICogICBbbnVsbF0sICAgIC8vIGluaXRpYWwgdmFsdWVzIGFycmF5IChhbiBpbnN0YW5jZSBvZiBgU3R5bGluZ01hcEFycmF5YClcbiAqXG4gKiAgIDAsICAgICAgICAgLy8gY29uZmlnIGVudHJ5IGZvciB0aGUgcHJvcGVydHkgKHNlZSBgVFN0eWxpbmdDb250ZXh0UHJvcENvbmZpZ0ZsYWdzYClcbiAqICAgMGIwMDEsICAgICAvLyB0ZW1wbGF0ZSBndWFyZCBtYXNrIGZvciB3aWR0aFxuICogICAwLCAgICAgICAgIC8vIGhvc3QgYmluZGluZ3MgZ3VhcmQgbWFzayBmb3Igd2lkdGhcbiAqICAgJ2FjdGl2ZScsICAvLyB0aGUgcHJvcGVydHkgbmFtZVxuICogICAyMCwgICAgICAgIC8vIHRoZSBiaW5kaW5nIGxvY2F0aW9uIGZvciB0aGUgXCJjXCIgYmluZGluZyBpbiB0aGUgbFZpZXdcbiAqICAgbnVsbCwgICAgICAvLyB0aGUgZGVmYXVsdCB2YWx1ZSBmb3IgdGhlIGBhY3RpdmVgIGNsYXNzXG4gKiBdO1xuICogYGBgXG4gKlxuICogRW50cnkgdmFsdWUgcHJlc2VudCBpbiBhbiBlbnRyeSAoY2FsbGVkIGEgdHVwbGUpIHdpdGhpbiB0aGVcbiAqIHN0eWxpbmcgY29udGV4dCBpcyBhcyBmb2xsb3dzOlxuICpcbiAqIGBgYHR5cGVzY3JpcHRcbiAqIGNvbnRleHQgPSBbXG4gKiAgIC8vLi4uXG4gKiAgIGNvbmZpZ1ZhbHVlLFxuICogICB0ZW1wbGF0ZUd1YXJkTWFzayxcbiAqICAgaG9zdEJpbmRpbmdzR3VhcmRNYXNrLFxuICogICBwcm9wTmFtZSxcbiAqICAgLi4uYmluZGluZ0luZGljZXMuLi4sXG4gKiAgIGRlZmF1bHRWYWx1ZVxuICogICAvLy4uLlxuICogXTtcbiAqIGBgYFxuICpcbiAqIEJlbG93IGlzIGEgYnJlYWtkb3duIG9mIGVhY2ggdmFsdWU6XG4gKlxuICogLSAqKmNvbmZpZ1ZhbHVlKio6XG4gKiAgIFByb3BlcnR5LXNwZWNpZmljIGNvbmZpZ3VyYXRpb24gdmFsdWVzLiBUaGUgb25seSBjb25maWcgc2V0dGluZ1xuICogICB0aGF0IGlzIGltcGxlbWVudGVkIHJpZ2h0IG5vdyBpcyB3aGV0aGVyIG9yIG5vdCB0byBzYW5pdGl6ZSB0aGVcbiAqICAgdmFsdWUuXG4gKlxuICogLSAqKnRlbXBsYXRlR3VhcmRNYXNrKio6XG4gKiAgIEEgbnVtZXJpYyB2YWx1ZSB3aGVyZSBlYWNoIGJpdCByZXByZXNlbnRzIGEgYmluZGluZyBpbmRleFxuICogICBsb2NhdGlvbi4gRWFjaCBiaW5kaW5nIGluZGV4IGxvY2F0aW9uIGlzIGFzc2lnbmVkIGJhc2VkIG9uXG4gKiAgIGEgbG9jYWwgY291bnRlciB2YWx1ZSB0aGF0IGluY3JlbWVudHMgZWFjaCB0aW1lIGFuIGluc3RydWN0aW9uXG4gKiAgIGlzIGNhbGxlZDpcbiAqXG4gKiBgYGBcbiAqIDxkaXYgW3N0eWxlLndpZHRoXT1cInhcIiAgIC8vIGJpbmRpbmcgaW5kZXggPSAyMSAoY291bnRlciBpbmRleCA9IDApXG4gKiAgICAgIFtzdHlsZS5oZWlnaHRdPVwieVwiPiAvLyBiaW5kaW5nIGluZGV4ID0gMjIgKGNvdW50ZXIgaW5kZXggPSAxKVxuICogYGBgXG4gKlxuICogICBJbiB0aGUgZXhhbXBsZSBjb2RlIGFib3ZlLCBpZiB0aGUgYHdpZHRoYCB2YWx1ZSB3aGVyZSB0byBjaGFuZ2VcbiAqICAgdGhlbiB0aGUgZmlyc3QgYml0IGluIHRoZSBsb2NhbCBiaXQgbWFzayB2YWx1ZSB3b3VsZCBiZSBmbGlwcGVkXG4gKiAgIChhbmQgdGhlIHNlY29uZCBiaXQgZm9yIHdoZW4gYGhlaWdodGApLlxuICpcbiAqICAgSWYgYW5kIHdoZW4gdGhlcmUgYXJlIG1vcmUgdGhhbiAzMiBiaW5kaW5nIHNvdXJjZXMgaW4gdGhlIGNvbnRleHRcbiAqICAgKG1vcmUgdGhhbiAzMiBgW3N0eWxlL2NsYXNzXWAgYmluZGluZ3MpIHRoZW4gdGhlIGJpdCBtYXNraW5nIHdpbGxcbiAqICAgb3ZlcmZsb3cgYW5kIHdlIGFyZSBsZWZ0IHdpdGggYSBzaXR1YXRpb24gd2hlcmUgYSBgLTFgIHZhbHVlIHdpbGxcbiAqICAgcmVwcmVzZW50IHRoZSBiaXQgbWFzay4gRHVlIHRvIHRoZSB3YXkgdGhhdCBKYXZhU2NyaXB0IGhhbmRsZXNcbiAqICAgbmVnYXRpdmUgdmFsdWVzLCB3aGVuIHRoZSBiaXQgbWFzayBpcyBgLTFgIHRoZW4gYWxsIGJpdHMgd2l0aGluXG4gKiAgIHRoYXQgdmFsdWUgd2lsbCBiZSBhdXRvbWF0aWNhbGx5IGZsaXBwZWQgKHRoaXMgaXMgYSBxdWljayBhbmRcbiAqICAgZWZmaWNpZW50IHdheSB0byBmbGlwIGFsbCBiaXRzIG9uIHRoZSBtYXNrIHdoZW4gYSBzcGVjaWFsIGtpbmRcbiAqICAgb2YgY2FjaGluZyBzY2VuYXJpbyBvY2N1cnMgb3Igd2hlbiB0aGVyZSBhcmUgbW9yZSB0aGFuIDMyIGJpbmRpbmdzKS5cbiAqXG4gKiAtICoqaG9zdEJpbmRpbmdzR3VhcmRNYXNrKio6XG4gKiAgIEFub3RoZXIgaW5zdGFuY2Ugb2YgYSBndWFyZCBtYXNrIHRoYXQgaXMgc3BlY2lmaWMgdG8gaG9zdCBiaW5kaW5ncy5cbiAqICAgVGhpcyBiZWhhdmVzIGV4YWN0bHkgdGhlIHNhbWUgd2F5IGFzIGRvZXMgdGhlIGB0ZW1wbGF0ZUd1YXJkTWFza2AsXG4gKiAgIGJ1dCB3aWxsIG5vdCBjb250YWluIGFueSBiaW5kaW5nIGluZm9ybWF0aW9uIHByb2Nlc3NlZCBpbiB0aGUgdGVtcGxhdGUuXG4gKiAgIFRoZSByZWFzb24gd2h5IHRoZXJlIGFyZSB0d28gaW5zdGFuY2VzIG9mIGd1YXJkIG1hc2tzIChvbmUgZm9yIHRoZVxuICogICB0ZW1wbGF0ZSBhbmQgYW5vdGhlciBmb3IgaG9zdCBiaW5kaW5ncykgaXMgYmVjYXVzZSB0aGUgdGVtcGxhdGUgYmluZGluZ3NcbiAqICAgYXJlIHByb2Nlc3NlZCBiZWZvcmUgaG9zdCBiaW5kaW5ncyBhbmQgdGhlIHN0YXRlIGluZm9ybWF0aW9uIGlzIG5vdFxuICogICBjYXJyaWVkIG92ZXIgaW50byB0aGUgaG9zdCBiaW5kaW5ncyBjb2RlLiBBcyBzb29uIGFzIGhvc3QgYmluZGluZ3MgYXJlXG4gKiAgIHByb2Nlc3NlZCBmb3IgYW4gZWxlbWVudCB0aGUgY291bnRlciBhbmQgc3RhdGUtYmFzZWQgYml0IG1hc2sgdmFsdWVzIGFyZVxuICogICBzZXQgdG8gYDBgLlxuICpcbiAqIGBgYFxuICogPGRpdiBbc3R5bGUud2lkdGhdPVwieFwiICAgLy8gYmluZGluZyBpbmRleCA9IDIxIChjb3VudGVyIGluZGV4ID0gMClcbiAqICAgICAgW3N0eWxlLmhlaWdodF09XCJ5XCIgIC8vIGJpbmRpbmcgaW5kZXggPSAyMiAoY291bnRlciBpbmRleCA9IDEpXG4gKiAgICAgIGRpci10aGF0LXNldHMtd2lkdGggIC8vIGJpbmRpbmcgaW5kZXggPSAzMCAoY291bnRlciBpbmRleCA9IDApXG4gKiAgICAgIGRpci10aGF0LXNldHMtd2lkdGg+IC8vIGJpbmRpbmcgaW5kZXggPSAzMSAoY291bnRlciBpbmRleCA9IDEpXG4gKiBgYGBcbiAqXG4gKiAtICoqcHJvcE5hbWUqKjpcbiAqICAgVGhlIENTUyBwcm9wZXJ0eSBuYW1lIG9yIGNsYXNzIG5hbWUgKGUuZyBgd2lkdGhgIG9yIGBhY3RpdmVgKS5cbiAqXG4gKiAtICoqYmluZGluZ0luZGljZXMuLi4qKjpcbiAqICAgQSBzZXJpZXMgb2YgbnVtZXJpYyBiaW5kaW5nIHZhbHVlcyB0aGF0IHJlZmxlY3Qgd2hlcmUgaW4gdGhlXG4gKiAgIGxWaWV3IHRvIGZpbmQgdGhlIHN0eWxlL2NsYXNzIHZhbHVlcyBhc3NvY2lhdGVkIHdpdGggdGhlIHByb3BlcnR5LlxuICogICBFYWNoIHZhbHVlIGlzIGluIG9yZGVyIGluIHRlcm1zIG9mIHByaW9yaXR5ICh0ZW1wbGF0ZXMgYXJlIGZpcnN0LFxuICogICB0aGVuIGRpcmVjdGl2ZXMgYW5kIHRoZW4gY29tcG9uZW50cykuIFdoZW4gdGhlIGNvbnRleHQgaXMgZmx1c2hlZFxuICogICBhbmQgdGhlIHN0eWxlL2NsYXNzIHZhbHVlcyBhcmUgYXBwbGllZCB0byB0aGUgZWxlbWVudCAodGhpcyBoYXBwZW5zXG4gKiAgIGluc2lkZSBvZiB0aGUgYHN0eWxpbmdBcHBseWAgaW5zdHJ1Y3Rpb24pIHRoZW4gdGhlIGZsdXNoaW5nIGNvZGVcbiAqICAgd2lsbCBrZWVwIGNoZWNraW5nIGVhY2ggYmluZGluZyBpbmRleCBhZ2FpbnN0IHRoZSBhc3NvY2lhdGVkIGxWaWV3XG4gKiAgIHRvIGZpbmQgdGhlIGZpcnN0IHN0eWxlL2NsYXNzIHZhbHVlIHRoYXQgaXMgbm9uLW51bGwuXG4gKlxuICogLSAqKmRlZmF1bHRWYWx1ZSoqOlxuICogICBUaGlzIGlzIHRoZSBkZWZhdWx0IHRoYXQgd2lsbCBhbHdheXMgYmUgYXBwbGllZCB0byB0aGUgZWxlbWVudCBpZlxuICogICBhbmQgd2hlbiBhbGwgb3RoZXIgYmluZGluZyBzb3VyY2VzIHJldHVybiBhIHJlc3VsdCB0aGF0IGlzIG51bGwuXG4gKiAgIFVzdWFsbHkgdGhpcyB2YWx1ZSBpcyBgbnVsbGAgYnV0IGl0IGNhbiBhbHNvIGJlIGEgc3RhdGljIHZhbHVlIHRoYXRcbiAqICAgaXMgaW50ZXJjZXB0ZWQgd2hlbiB0aGUgdE5vZGUgaXMgZmlyc3QgY29uc3RydWN0dXJlZCAoZS5nLlxuICogICBgPGRpdiBzdHlsZT1cIndpZHRoOjIwMHB4XCI+YCBoYXMgYSBkZWZhdWx0IHZhbHVlIG9mIGAyMDBweGAgZm9yXG4gKiAgIHRoZSBgd2lkdGhgIHByb3BlcnR5KS5cbiAqXG4gKiBFYWNoIHRpbWUgYSBuZXcgYmluZGluZyBpcyBlbmNvdW50ZXJlZCBpdCBpcyByZWdpc3RlcmVkIGludG8gdGhlXG4gKiBjb250ZXh0LiBUaGUgY29udGV4dCB0aGVuIGlzIGNvbnRpbnVhbGx5IHVwZGF0ZWQgdW50aWwgdGhlIGZpcnN0XG4gKiBzdHlsaW5nIGFwcGx5IGNhbGwgaGFzIGJlZW4gY2FsbGVkICh3aGljaCBpcyBhdXRvbWF0aWNhbGx5IHNjaGVkdWxlZFxuICogdG8gYmUgY2FsbGVkIG9uY2UgYW4gZWxlbWVudCBleGl0cyBkdXJpbmcgY2hhbmdlIGRldGVjdGlvbikuIE5vdGUgdGhhdFxuICogZWFjaCBlbnRyeSBpbiB0aGUgY29udGV4dCBpcyBzdG9yZWQgaW4gYWxwaGFiZXRpY2FsIG9yZGVyLlxuICpcbiAqIE9uY2Ugc3R5bGluZyBoYXMgYmVlbiBmbHVzaGVkIGZvciB0aGUgZmlyc3QgdGltZSBmb3IgYW4gZWxlbWVudCB0aGVcbiAqIGNvbnRleHQgd2lsbCBzZXQgYXMgbG9ja2VkICh0aGlzIHByZXZlbnRzIGJpbmRpbmdzIGZyb20gYmVpbmcgYWRkZWRcbiAqIHRvIHRoZSBjb250ZXh0IGxhdGVyIG9uKS5cbiAqXG4gKiAjIEhvdyBTdHlsZXMvQ2xhc3NlcyBhcmUgUmVuZGVyZWRcbiAqIEVhY2ggdGltZSBhIHN0eWxpbmcgaW5zdHJ1Y3Rpb24gKGUuZy4gYFtjbGFzcy5uYW1lXWAsIGBbc3R5bGUucHJvcF1gLFxuICogZXRjLi4uKSBpcyBleGVjdXRlZCwgdGhlIGFzc29jaWF0ZWQgYGxWaWV3YCBmb3IgdGhlIHZpZXcgaXMgdXBkYXRlZFxuICogYXQgdGhlIGN1cnJlbnQgYmluZGluZyBsb2NhdGlvbi4gQWxzbywgd2hlbiB0aGlzIGhhcHBlbnMsIGEgbG9jYWxcbiAqIGNvdW50ZXIgdmFsdWUgaXMgaW5jcmVtZW50ZWQuIElmIHRoZSBiaW5kaW5nIHZhbHVlIGhhcyBjaGFuZ2VkIHRoZW5cbiAqIGEgbG9jYWwgYGJpdE1hc2tgIHZhcmlhYmxlIGlzIHVwZGF0ZWQgd2l0aCB0aGUgc3BlY2lmaWMgYml0IGJhc2VkXG4gKiBvbiB0aGUgY291bnRlciB2YWx1ZS5cbiAqXG4gKiBCZWxvdyBpcyBhIGxpZ2h0d2VpZ2h0IGV4YW1wbGUgb2Ygd2hhdCBoYXBwZW5zIHdoZW4gYSBzaW5nbGUgc3R5bGVcbiAqIHByb3BlcnR5IGlzIHVwZGF0ZWQgKGkuZS4gYDxkaXYgW3N0eWxlLnByb3BdPVwidmFsXCI+YCk6XG4gKlxuICogYGBgdHlwZXNjcmlwdFxuICogZnVuY3Rpb24gdXBkYXRlU3R5bGVQcm9wKHByb3A6IHN0cmluZywgdmFsdWU6IHN0cmluZykge1xuICogICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gKiAgIGNvbnN0IGJpbmRpbmdJbmRleCA9IEJJTkRJTkdfSU5ERVgrKztcbiAqXG4gKiAgIC8vIHVwZGF0ZSB0aGUgbG9jYWwgY291bnRlciB2YWx1ZVxuICogICBjb25zdCBpbmRleEZvclN0eWxlID0gc3R5bGluZ1N0YXRlLnN0eWxlc0NvdW50Kys7XG4gKiAgIGlmIChsVmlld1tiaW5kaW5nSW5kZXhdICE9PSB2YWx1ZSkge1xuICogICAgIGxWaWV3W2JpbmRpbmdJbmRleF0gPSB2YWx1ZTtcbiAqXG4gKiAgICAgLy8gdGVsbCB0aGUgbG9jYWwgc3RhdGUgdGhhdCB3ZSBoYXZlIHVwZGF0ZWQgYSBzdHlsZSB2YWx1ZVxuICogICAgIC8vIGJ5IHVwZGF0aW5nIHRoZSBiaXQgbWFza1xuICogICAgIHN0eWxpbmdTdGF0ZS5iaXRNYXNrRm9yU3R5bGVzIHw9IDEgPDwgaW5kZXhGb3JTdHlsZTtcbiAqICAgfVxuICogfVxuICogYGBgXG4gKlxuICogT25jZSBhbGwgdGhlIGJpbmRpbmdzIGhhdmUgdXBkYXRlZCBhIGBiaXRNYXNrYCB2YWx1ZSB3aWxsIGJlIHBvcHVsYXRlZC5cbiAqIFRoaXMgYGJpdE1hc2tgIHZhbHVlIGlzIHVzZWQgaW4gdGhlIGFwcGx5IGFsZ29yaXRobSAod2hpY2ggaXMgY2FsbGVkXG4gKiBjb250ZXh0IHJlc29sdXRpb24pLlxuICpcbiAqICMjIFRoZSBBcHBseSBBbGdvcml0aG0gKENvbnRleHQgUmVzb2x1dGlvbilcbiAqIEFzIGV4cGxhaW5lZCBhYm92ZSwgZWFjaCB0aW1lIGEgYmluZGluZyB1cGRhdGVzIGl0cyB2YWx1ZSwgdGhlIHJlc3VsdGluZ1xuICogdmFsdWUgaXMgc3RvcmVkIGluIHRoZSBgbFZpZXdgIGFycmF5LiBUaGVzZSBzdHlsaW5nIHZhbHVlcyBoYXZlIHlldCB0b1xuICogYmUgZmx1c2hlZCB0byB0aGUgZWxlbWVudC5cbiAqXG4gKiBPbmNlIGFsbCB0aGUgc3R5bGluZyBpbnN0cnVjdGlvbnMgaGF2ZSBiZWVuIGV2YWx1YXRlZCwgdGhlbiB0aGUgc3R5bGluZ1xuICogY29udGV4dChzKSBhcmUgZmx1c2hlZCB0byB0aGUgZWxlbWVudC4gV2hlbiB0aGlzIGhhcHBlbnMsIHRoZSBjb250ZXh0IHdpbGxcbiAqIGJlIGl0ZXJhdGVkIG92ZXIgKHByb3BlcnR5IGJ5IHByb3BlcnR5KSBhbmQgZWFjaCBiaW5kaW5nIHNvdXJjZSB3aWxsIGJlXG4gKiBleGFtaW5lZCBhbmQgdGhlIGZpcnN0IG5vbi1udWxsIHZhbHVlIHdpbGwgYmUgYXBwbGllZCB0byB0aGUgZWxlbWVudC5cbiAqXG4gKiBMZXQncyBzYXkgdGhhdCB3ZSB0aGUgZm9sbG93aW5nIHRlbXBsYXRlIGNvZGU6XG4gKlxuICogYGBgaHRtbFxuICogPGRpdiBbc3R5bGUud2lkdGhdPVwidzFcIiBkaXItdGhhdC1zZXQtd2lkdGg9XCJ3MlwiPjwvZGl2PlxuICogYGBgXG4gKlxuICogVGhlcmUgYXJlIHR3byBzdHlsaW5nIGJpbmRpbmdzIGluIHRoZSBjb2RlIGFib3ZlIGFuZCB0aGV5IGJvdGggd3JpdGVcbiAqIHRvIHRoZSBgd2lkdGhgIHByb3BlcnR5LiBXaGVuIHN0eWxpbmcgaXMgZmx1c2hlZCBvbiB0aGUgZWxlbWVudCwgdGhlXG4gKiBhbGdvcml0aG0gd2lsbCB0cnkgYW5kIGZpZ3VyZSBvdXQgd2hpY2ggb25lIG9mIHRoZXNlIHZhbHVlcyB0byB3cml0ZVxuICogdG8gdGhlIGVsZW1lbnQuXG4gKlxuICogSW4gb3JkZXIgdG8gZmlndXJlIG91dCB3aGljaCB2YWx1ZSB0byBhcHBseSwgdGhlIGZvbGxvd2luZ1xuICogYmluZGluZyBwcmlvcml0aXphdGlvbiBpcyBhZGhlcmVkIHRvOlxuICpcbiAqICAgMS4gRmlyc3QgdGVtcGxhdGUtbGV2ZWwgc3R5bGluZyBiaW5kaW5ncyBhcmUgYXBwbGllZCAoaWYgcHJlc2VudCkuXG4gKiAgICAgIFRoaXMgaW5jbHVkZXMgdGhpbmdzIGxpa2UgYFtzdHlsZS53aWR0aF1gIGFuZCBgW2NsYXNzLmFjdGl2ZV1gLlxuICpcbiAqICAgMi4gU2Vjb25kIGFyZSBzdHlsaW5nLWxldmVsIGhvc3QgYmluZGluZ3MgcHJlc2VudCBpbiBkaXJlY3RpdmVzLlxuICogICAgICAoaWYgdGhlcmUgYXJlIHN1Yi9zdXBlciBkaXJlY3RpdmVzIHByZXNlbnQgdGhlbiB0aGUgc3ViIGRpcmVjdGl2ZXNcbiAqICAgICAgYXJlIGFwcGxpZWQgZmlyc3QpLlxuICpcbiAqICAgMy4gVGhpcmQgYXJlIHN0eWxpbmctbGV2ZWwgaG9zdCBiaW5kaW5ncyBwcmVzZW50IGluIGNvbXBvbmVudHMuXG4gKiAgICAgIChpZiB0aGVyZSBhcmUgc3ViL3N1cGVyIGNvbXBvbmVudHMgcHJlc2VudCB0aGVuIHRoZSBzdWIgZGlyZWN0aXZlc1xuICogICAgICBhcmUgYXBwbGllZCBmaXJzdCkuXG4gKlxuICogVGhpcyBtZWFucyB0aGF0IGluIHRoZSBjb2RlIGFib3ZlIHRoZSBzdHlsaW5nIGJpbmRpbmcgcHJlc2VudCBpbiB0aGVcbiAqIHRlbXBsYXRlIGlzIGFwcGxpZWQgZmlyc3QgYW5kLCBvbmx5IGlmIGl0cyBmYWxzeSwgdGhlbiB0aGUgZGlyZWN0aXZlXG4gKiBzdHlsaW5nIGJpbmRpbmcgZm9yIHdpZHRoIHdpbGwgYmUgYXBwbGllZC5cbiAqXG4gKiAjIyMgV2hhdCBhYm91dCBtYXAtYmFzZWQgc3R5bGluZyBiaW5kaW5ncz9cbiAqIE1hcC1iYXNlZCBzdHlsaW5nIGJpbmRpbmdzIGFyZSBhY3RpdmF0ZWQgd2hlbiB0aGVyZSBhcmUgb25lIG9yIG1vcmVcbiAqIGBbc3R5bGVdYCBhbmQvb3IgYFtjbGFzc11gIGJpbmRpbmdzIHByZXNlbnQgb24gYW4gZWxlbWVudC4gV2hlbiB0aGlzXG4gKiBjb2RlIGlzIGFjdGl2YXRlZCwgdGhlIGFwcGx5IGFsZ29yaXRobSB3aWxsIGl0ZXJhdGUgb3ZlciBlYWNoIG1hcFxuICogZW50cnkgYW5kIGFwcGx5IGVhY2ggc3R5bGluZyB2YWx1ZSB0byB0aGUgZWxlbWVudCB3aXRoIHRoZSBzYW1lXG4gKiBwcmlvcml0aXphdGlvbiBydWxlcyBhcyBhYm92ZS5cbiAqXG4gKiBGb3IgdGhlIGFsZ29yaXRobSB0byBhcHBseSBzdHlsaW5nIHZhbHVlcyBlZmZpY2llbnRseSwgdGhlXG4gKiBzdHlsaW5nIG1hcCBlbnRyaWVzIG11c3QgYmUgYXBwbGllZCBpbiBzeW5jIChwcm9wZXJ0eSBieSBwcm9wZXJ0eSlcbiAqIHdpdGggcHJvcC1iYXNlZCBiaW5kaW5ncy4gKFRoZSBtYXAtYmFzZWQgYWxnb3JpdGhtIGlzIGRlc2NyaWJlZFxuICogbW9yZSBpbnNpZGUgb2YgdGhlIGByZW5kZXIzL3N0eWxpbmcvbWFwX2Jhc2VkX2JpbmRpbmdzLnRzYCBmaWxlLilcbiAqXG4gKiAjIyBTYW5pdGl6YXRpb25cbiAqIFNhbml0aXphdGlvbiBpcyB1c2VkIHRvIHByZXZlbnQgaW52YWxpZCBzdHlsZSB2YWx1ZXMgZnJvbSBiZWluZyBhcHBsaWVkIHRvXG4gKiB0aGUgZWxlbWVudC5cbiAqXG4gKiBJdCBpcyBlbmFibGVkIGluIHR3byBjYXNlczpcbiAqXG4gKiAgIDEuIFRoZSBgc3R5bGVTYW5pdGl6ZXIoc2FuaXRpemVyRm4pYCBpbnN0cnVjdGlvbiB3YXMgY2FsbGVkIChqdXN0IGJlZm9yZSBhbnkgb3RoZXJcbiAqICAgICAgc3R5bGluZyBpbnN0cnVjdGlvbnMgYXJlIHJ1bikuXG4gKlxuICogICAyLiBUaGUgY29tcG9uZW50L2RpcmVjdGl2ZSBgTFZpZXdgIGluc3RhbmNlIGhhcyBhIHNhbml0aXplciBvYmplY3QgYXR0YWNoZWQgdG8gaXRcbiAqICAgICAgKHRoaXMgaGFwcGVucyB3aGVuIGByZW5kZXJDb21wb25lbnRgIGlzIGV4ZWN1dGVkIHdpdGggYSBgc2FuaXRpemVyYCB2YWx1ZSBvclxuICogICAgICBpZiB0aGUgbmdNb2R1bGUgY29udGFpbnMgYSBzYW5pdGl6ZXIgcHJvdmlkZXIgYXR0YWNoZWQgdG8gaXQpLlxuICpcbiAqIElmIGFuZCB3aGVuIHNhbml0aXphdGlvbiBpcyBhY3RpdmUgdGhlbiBhbGwgcHJvcGVydHkvdmFsdWUgZW50cmllcyB3aWxsIGJlIGV2YWx1YXRlZFxuICogdGhyb3VnaCB0aGUgYWN0aXZlIHNhbml0aXplciBiZWZvcmUgdGhleSBhcmUgYXBwbGllZCB0byB0aGUgZWxlbWVudCAob3IgdGhlIHN0eWxpbmdcbiAqIGRlYnVnIGhhbmRsZXIpLlxuICpcbiAqIElmIGEgYFNhbml0aXplcmAgb2JqZWN0IGlzIHVzZWQgKHZpYSB0aGUgYExWaWV3W1NBTklUSVpFUl1gIHZhbHVlKSB0aGVuIHRoYXQgb2JqZWN0XG4gKiB3aWxsIGJlIHVzZWQgZm9yIGV2ZXJ5IHByb3BlcnR5LlxuICpcbiAqIElmIGEgYFN0eWxlU2FuaXRpemVyRm5gIGZ1bmN0aW9uIGlzIHVzZWQgKHZpYSB0aGUgYHN0eWxlU2FuaXRpemVyYCkgdGhlbiBpdCB3aWxsIGJlXG4gKiBjYWxsZWQgaW4gdHdvIHdheXM6XG4gKlxuICogICAxLiBwcm9wZXJ0eSB2YWxpZGF0aW9uIG1vZGU6IHRoaXMgd2lsbCBiZSBjYWxsZWQgZWFybHkgdG8gbWFyayB3aGV0aGVyIGEgcHJvcGVydHlcbiAqICAgICAgc2hvdWxkIGJlIHNhbml0aXplZCBvciBub3QgYXQgZHVyaW5nIHRoZSBmbHVzaGluZyBzdGFnZS5cbiAqXG4gKiAgIDIuIHZhbHVlIHNhbml0aXphdGlvbiBtb2RlOiB0aGlzIHdpbGwgYmUgY2FsbGVkIGR1cmluZyB0aGUgZmx1c2hpbmcgc3RhZ2UgYW5kIHdpbGxcbiAqICAgICAgcnVuIHRoZSBzYW5pdGl6ZXIgZnVuY3Rpb24gYWdhaW5zdCB0aGUgdmFsdWUgYmVmb3JlIGFwcGx5aW5nIGl0IHRvIHRoZSBlbGVtZW50LlxuICpcbiAqIElmIHNhbml0aXphdGlvbiByZXR1cm5zIGFuIGVtcHR5IHZhbHVlIHRoZW4gdGhhdCBlbXB0eSB2YWx1ZSB3aWxsIGJlIGFwcGxpZWRcbiAqIHRvIHRoZSBlbGVtZW50LlxuICovXG5leHBvcnQgaW50ZXJmYWNlIFRTdHlsaW5nQ29udGV4dCBleHRlbmRzXG4gICAgQXJyYXk8bnVtYmVyfHN0cmluZ3xudW1iZXJ8Ym9vbGVhbnxudWxsfFN0eWxpbmdNYXBBcnJheXx7fT4ge1xuICAvKiogQ29uZmlndXJhdGlvbiBkYXRhIGZvciB0aGUgY29udGV4dCAqL1xuICBbVFN0eWxpbmdDb250ZXh0SW5kZXguQ29uZmlnUG9zaXRpb25dOiBUU3R5bGluZ0NvbmZpZztcblxuICAvKiogVGhlIHRvdGFsIGFtb3VudCBvZiBzb3VyY2VzIHByZXNlbnQgaW4gdGhlIGNvbnRleHQgKi9cbiAgW1RTdHlsaW5nQ29udGV4dEluZGV4LlRvdGFsU291cmNlc1Bvc2l0aW9uXTogbnVtYmVyO1xuXG4gIC8qKiBJbml0aWFsIHZhbHVlIHBvc2l0aW9uIGZvciBzdGF0aWMgc3R5bGVzICovXG4gIFtUU3R5bGluZ0NvbnRleHRJbmRleC5Jbml0aWFsU3R5bGluZ1ZhbHVlUG9zaXRpb25dOiBTdHlsaW5nTWFwQXJyYXk7XG59XG5cbi8qKlxuICogQSBzZXJpZXMgb2YgZmxhZ3MgdXNlZCB0byBjb25maWd1cmUgdGhlIGNvbmZpZyB2YWx1ZSBwcmVzZW50IHdpdGhpbiBhbiBpbnN0YW5jZSBvZlxuICogYFRTdHlsaW5nQ29udGV4dGAuXG4gKi9cbmV4cG9ydCBjb25zdCBlbnVtIFRTdHlsaW5nQ29uZmlnIHtcbiAgLyoqXG4gICAqIFRoZSBpbml0aWFsIHN0YXRlIG9mIHRoZSBzdHlsaW5nIGNvbnRleHQgY29uZmlnLlxuICAgKi9cbiAgSW5pdGlhbCA9IDBiMDAwMDAwMCxcblxuICAvKipcbiAgICogV2hldGhlciBvciBub3QgdGhlcmUgYXJlIHByb3AtYmFzZWQgYmluZGluZ3MgcHJlc2VudC5cbiAgICpcbiAgICogRXhhbXBsZXMgaW5jbHVkZTpcbiAgICogMS4gYDxkaXYgW3N0eWxlLnByb3BdPVwieFwiPmBcbiAgICogMi4gYDxkaXYgW2NsYXNzLnByb3BdPVwieFwiPmBcbiAgICogMy4gYEBIb3N0QmluZGluZygnc3R5bGUucHJvcCcpIHhgXG4gICAqIDQuIGBASG9zdEJpbmRpbmcoJ2NsYXNzLnByb3AnKSB4YFxuICAgKi9cbiAgSGFzUHJvcEJpbmRpbmdzID0gMGIwMDAwMDAxLFxuXG4gIC8qKlxuICAgKiBXaGV0aGVyIG9yIG5vdCB0aGVyZSBhcmUgbWFwLWJhc2VkIGJpbmRpbmdzIHByZXNlbnQuXG4gICAqXG4gICAqIEV4YW1wbGVzIGluY2x1ZGU6XG4gICAqIDEuIGA8ZGl2IFtzdHlsZV09XCJ4XCI+YFxuICAgKiAyLiBgPGRpdiBbY2xhc3NdPVwieFwiPmBcbiAgICogMy4gYEBIb3N0QmluZGluZygnc3R5bGUnKSB4YFxuICAgKiA0LiBgQEhvc3RCaW5kaW5nKCdjbGFzcycpIHhgXG4gICAqL1xuICBIYXNNYXBCaW5kaW5ncyA9IDBiMDAwMDAxMCxcblxuICAvKipcbiAgICogV2hldGhlciBvciBub3QgdGhlcmUgYXJlIG1hcC1iYXNlZCBhbmQgcHJvcC1iYXNlZCBiaW5kaW5ncyBwcmVzZW50LlxuICAgKlxuICAgKiBFeGFtcGxlcyBpbmNsdWRlOlxuICAgKiAxLiBgPGRpdiBbc3R5bGVdPVwieFwiIFtzdHlsZS5wcm9wXT1cInlcIj5gXG4gICAqIDIuIGA8ZGl2IFtjbGFzc109XCJ4XCIgW3N0eWxlLnByb3BdPVwieVwiPmBcbiAgICogMy4gYDxkaXYgW3N0eWxlXT1cInhcIiBkaXItdGhhdC1zZXRzLXNvbWUtcHJvcD5gXG4gICAqIDQuIGA8ZGl2IFtjbGFzc109XCJ4XCIgZGlyLXRoYXQtc2V0cy1zb21lLWNsYXNzPmBcbiAgICovXG4gIEhhc1Byb3BBbmRNYXBCaW5kaW5ncyA9IDBiMDAwMDAxMSxcblxuICAvKipcbiAgICogV2hldGhlciBvciBub3QgdGhlcmUgYXJlIHR3byBvciBtb3JlIHNvdXJjZXMgZm9yIGEgc2luZ2xlIHByb3BlcnR5IGluIHRoZSBjb250ZXh0LlxuICAgKlxuICAgKiBFeGFtcGxlcyBpbmNsdWRlOlxuICAgKiAxLiBwcm9wICsgcHJvcDogYDxkaXYgW3N0eWxlLndpZHRoXT1cInhcIiBkaXItdGhhdC1zZXRzLXdpZHRoPmBcbiAgICogMi4gbWFwICsgcHJvcDogYDxkaXYgW3N0eWxlXT1cInhcIiBbc3R5bGUucHJvcF0+YFxuICAgKiAzLiBtYXAgKyBtYXA6IGA8ZGl2IFtzdHlsZV09XCJ4XCIgZGlyLXRoYXQtc2V0cy1zdHlsZT5gXG4gICAqL1xuICBIYXNDb2xsaXNpb25zID0gMGIwMDAwMTAwLFxuXG4gIC8qKlxuICAgKiBXaGV0aGVyIG9yIG5vdCB0aGUgY29udGV4dCBjb250YWlucyBpbml0aWFsIHN0eWxpbmcgdmFsdWVzLlxuICAgKlxuICAgKiBFeGFtcGxlcyBpbmNsdWRlOlxuICAgKiAxLiBgPGRpdiBzdHlsZT1cIndpZHRoOjIwMHB4XCI+YFxuICAgKiAyLiBgPGRpdiBjbGFzcz1cIm9uZSB0d28gdGhyZWVcIj5gXG4gICAqIDMuIGBARGlyZWN0aXZlKHsgaG9zdDogeyAnc3R5bGUnOiAnd2lkdGg6MjAwcHgnIH0gfSlgXG4gICAqIDQuIGBARGlyZWN0aXZlKHsgaG9zdDogeyAnY2xhc3MnOiAnb25lIHR3byB0aHJlZScgfSB9KWBcbiAgICovXG4gIEhhc0luaXRpYWxTdHlsaW5nID0gMGIwMDAwMTAwMCxcblxuICAvKipcbiAgICogV2hldGhlciBvciBub3QgdGhlIGNvbnRleHQgY29udGFpbnMgb25lIG9yIG1vcmUgdGVtcGxhdGUgYmluZGluZ3MuXG4gICAqXG4gICAqIEV4YW1wbGVzIGluY2x1ZGU6XG4gICAqIDEuIGA8ZGl2IFtzdHlsZV09XCJ4XCI+YFxuICAgKiAyLiBgPGRpdiBbc3R5bGUud2lkdGhdPVwieFwiPmBcbiAgICogMy4gYDxkaXYgW2NsYXNzXT1cInhcIj5gXG4gICAqIDQuIGA8ZGl2IFtjbGFzcy5uYW1lXT1cInhcIj5gXG4gICAqL1xuICBIYXNUZW1wbGF0ZUJpbmRpbmdzID0gMGIwMDAxMDAwMCxcblxuICAvKipcbiAgICogV2hldGhlciBvciBub3QgdGhlIGNvbnRleHQgY29udGFpbnMgb25lIG9yIG1vcmUgaG9zdCBiaW5kaW5ncy5cbiAgICpcbiAgICogRXhhbXBsZXMgaW5jbHVkZTpcbiAgICogMS4gYEBIb3N0QmluZGluZygnc3R5bGUnKSB4YFxuICAgKiAyLiBgQEhvc3RCaW5kaW5nKCdzdHlsZS53aWR0aCcpIHhgXG4gICAqIDMuIGBASG9zdEJpbmRpbmcoJ2NsYXNzJykgeGBcbiAgICogNC4gYEBIb3N0QmluZGluZygnY2xhc3MubmFtZScpIHhgXG4gICAqL1xuICBIYXNIb3N0QmluZGluZ3MgPSAwYjAwMTAwMDAwLFxuXG4gIC8qKlxuICAgKiBXaGV0aGVyIG9yIG5vdCB0aGUgdGVtcGxhdGUgYmluZGluZ3MgYXJlIGFsbG93ZWQgdG8gYmUgcmVnaXN0ZXJlZCBpbiB0aGUgY29udGV4dC5cbiAgICpcbiAgICogVGhpcyBmbGFnIGlzIGFmdGVyIG9uZSBvciBtb3JlIHRlbXBsYXRlLWJhc2VkIHN0eWxlL2NsYXNzIGJpbmRpbmdzIHdlcmVcbiAgICogc2V0IGFuZCBwcm9jZXNzZWQgZm9yIGFuIGVsZW1lbnQuIE9uY2UgdGhlIGJpbmRpbmdzIGFyZSBwcm9jZXNzZWQgdGhlbiBhIGNhbGxcbiAgICogdG8gc3R5bGluZ0FwcGx5IGlzIGlzc3VlZCBhbmQgdGhlIGxvY2sgd2lsbCBiZSBwdXQgaW50byBwbGFjZS5cbiAgICpcbiAgICogTm90ZSB0aGF0IHRoaXMgaXMgb25seSBzZXQgb25jZS5cbiAgICovXG4gIFRlbXBsYXRlQmluZGluZ3NMb2NrZWQgPSAwYjAxMDAwMDAwLFxuXG4gIC8qKlxuICAgKiBXaGV0aGVyIG9yIG5vdCB0aGUgaG9zdCBiaW5kaW5ncyBhcmUgYWxsb3dlZCB0byBiZSByZWdpc3RlcmVkIGluIHRoZSBjb250ZXh0LlxuICAgKlxuICAgKiBUaGlzIGZsYWcgaXMgYWZ0ZXIgb25lIG9yIG1vcmUgaG9zdC1iYXNlZCBzdHlsZS9jbGFzcyBiaW5kaW5ncyB3ZXJlXG4gICAqIHNldCBhbmQgcHJvY2Vzc2VkIGZvciBhbiBlbGVtZW50LiBPbmNlIHRoZSBiaW5kaW5ncyBhcmUgcHJvY2Vzc2VkIHRoZW4gYSBjYWxsXG4gICAqIHRvIHN0eWxpbmdBcHBseSBpcyBpc3N1ZWQgYW5kIHRoZSBsb2NrIHdpbGwgYmUgcHV0IGludG8gcGxhY2UuXG4gICAqXG4gICAqIE5vdGUgdGhhdCB0aGlzIGlzIG9ubHkgc2V0IG9uY2UuXG4gICAqL1xuICBIb3N0QmluZGluZ3NMb2NrZWQgPSAwYjEwMDAwMDAwLFxuXG4gIC8qKiBBIE1hc2sgb2YgYWxsIHRoZSBjb25maWd1cmF0aW9ucyAqL1xuICBNYXNrID0gMGIxMTExMTExMSxcblxuICAvKiogVG90YWwgYW1vdW50IG9mIGNvbmZpZ3VyYXRpb24gYml0cyB1c2VkICovXG4gIFRvdGFsQml0cyA9IDgsXG59XG5cbi8qKlxuICogQW4gaW5kZXggb2YgcG9zaXRpb24gYW5kIG9mZnNldCB2YWx1ZXMgdXNlZCB0byBuYXZpZ2F0ZSB0aGUgYFRTdHlsaW5nQ29udGV4dGAuXG4gKi9cbmV4cG9ydCBjb25zdCBlbnVtIFRTdHlsaW5nQ29udGV4dEluZGV4IHtcbiAgQ29uZmlnUG9zaXRpb24gPSAwLFxuICBUb3RhbFNvdXJjZXNQb3NpdGlvbiA9IDEsXG4gIEluaXRpYWxTdHlsaW5nVmFsdWVQb3NpdGlvbiA9IDIsXG4gIFZhbHVlc1N0YXJ0UG9zaXRpb24gPSAzLFxuXG4gIC8vIGVhY2ggdHVwbGUgZW50cnkgaW4gdGhlIGNvbnRleHRcbiAgLy8gKGNvbmZpZywgdGVtcGxhdGVCaXRHdWFyZCwgaG9zdEJpbmRpbmdCaXRHdWFyZCwgcHJvcCwgLi4uYmluZGluZ3N8fGRlZmF1bHQtdmFsdWUpXG4gIENvbmZpZ09mZnNldCA9IDAsXG4gIFRlbXBsYXRlQml0R3VhcmRPZmZzZXQgPSAxLFxuICBIb3N0QmluZGluZ3NCaXRHdWFyZE9mZnNldCA9IDIsXG4gIFByb3BPZmZzZXQgPSAzLFxuICBCaW5kaW5nc1N0YXJ0T2Zmc2V0ID0gNFxufVxuXG4vKipcbiAqIEEgc2VyaWVzIG9mIGZsYWdzIHVzZWQgZm9yIGVhY2ggcHJvcGVydHkgZW50cnkgd2l0aGluIHRoZSBgVFN0eWxpbmdDb250ZXh0YC5cbiAqL1xuZXhwb3J0IGNvbnN0IGVudW0gVFN0eWxpbmdDb250ZXh0UHJvcENvbmZpZ0ZsYWdzIHtcbiAgRGVmYXVsdCA9IDBiMCxcbiAgU2FuaXRpemF0aW9uUmVxdWlyZWQgPSAwYjEsXG4gIFRvdGFsQml0cyA9IDEsXG4gIE1hc2sgPSAwYjEsXG59XG5cbi8qKlxuICogQSBmdW5jdGlvbiB1c2VkIHRvIGFwcGx5IG9yIHJlbW92ZSBzdHlsaW5nIGZyb20gYW4gZWxlbWVudCBmb3IgYSBnaXZlbiBwcm9wZXJ0eS5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBBcHBseVN0eWxpbmdGbiB7XG4gIChyZW5kZXJlcjogUmVuZGVyZXIzfFByb2NlZHVyYWxSZW5kZXJlcjN8bnVsbCwgZWxlbWVudDogUkVsZW1lbnQsIHByb3A6IHN0cmluZywgdmFsdWU6IGFueSxcbiAgIGJpbmRpbmdJbmRleD86IG51bWJlcnxudWxsKTogdm9pZDtcbn1cblxuLyoqXG4gKiBSdW50aW1lIGRhdGEgdHlwZSB0aGF0IGlzIHVzZWQgdG8gc3RvcmUgYmluZGluZyBkYXRhIHJlZmVyZW5jZWQgZnJvbSB0aGUgYFRTdHlsaW5nQ29udGV4dGAuXG4gKlxuICogQmVjYXVzZSBgTFZpZXdgIGlzIGp1c3QgYW4gYXJyYXkgd2l0aCBkYXRhLCB0aGVyZSBpcyBubyByZWFzb24gdG9cbiAqIHNwZWNpYWwgY2FzZSBgTFZpZXdgIGV2ZXJ5d2hlcmUgaW4gdGhlIHN0eWxpbmcgYWxnb3JpdGhtLiBCeSBhbGxvd2luZ1xuICogdGhpcyBkYXRhIHR5cGUgdG8gYmUgYW4gYXJyYXkgdGhhdCBjb250YWlucyB2YXJpb3VzIHNjYWxhciBkYXRhIHR5cGVzLFxuICogYW4gaW5zdGFuY2Ugb2YgYExWaWV3YCBkb2Vzbid0IG5lZWQgdG8gYmUgY29uc3RydWN0ZWQgZm9yIHRlc3RzLlxuICovXG5leHBvcnQgdHlwZSBMU3R5bGluZ0RhdGEgPSBMVmlldyB8IChzdHJpbmcgfCBudW1iZXIgfCBib29sZWFuIHwgbnVsbClbXTtcblxuLyoqXG4gKiBBcnJheS1iYXNlZCByZXByZXNlbnRhdGlvbiBvZiBhIGtleS92YWx1ZSBhcnJheS5cbiAqXG4gKiBUaGUgZm9ybWF0IG9mIHRoZSBhcnJheSBpcyBcInByb3BlcnR5XCIsIFwidmFsdWVcIiwgXCJwcm9wZXJ0eTJcIixcbiAqIFwidmFsdWUyXCIsIGV0Yy4uLlxuICpcbiAqIFRoZSBmaXJzdCB2YWx1ZSBpbiB0aGUgYXJyYXkgaXMgcmVzZXJ2ZWQgdG8gc3RvcmUgdGhlIGluc3RhbmNlXG4gKiBvZiB0aGUga2V5L3ZhbHVlIGFycmF5IHRoYXQgd2FzIHVzZWQgdG8gcG9wdWxhdGUgdGhlIHByb3BlcnR5L1xuICogdmFsdWUgZW50cmllcyB0aGF0IHRha2UgcGxhY2UgaW4gdGhlIHJlbWFpbmRlciBvZiB0aGUgYXJyYXkuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgU3R5bGluZ01hcEFycmF5IGV4dGVuZHMgQXJyYXk8e318c3RyaW5nfG51bWJlcnxudWxsPiB7XG4gIFtTdHlsaW5nTWFwQXJyYXlJbmRleC5SYXdWYWx1ZVBvc2l0aW9uXToge318c3RyaW5nfG51bGw7XG59XG5cbi8qKlxuICogQW4gaW5kZXggb2YgcG9zaXRpb24gYW5kIG9mZnNldCBwb2ludHMgZm9yIGFueSBkYXRhIHN0b3JlZCB3aXRoaW4gYSBgU3R5bGluZ01hcEFycmF5YCBpbnN0YW5jZS5cbiAqL1xuZXhwb3J0IGNvbnN0IGVudW0gU3R5bGluZ01hcEFycmF5SW5kZXgge1xuICAvKiogV2hlcmUgdGhlIHZhbHVlcyBzdGFydCBpbiB0aGUgYXJyYXkgKi9cbiAgVmFsdWVzU3RhcnRQb3NpdGlvbiA9IDEsXG5cbiAgLyoqIFRoZSBsb2NhdGlvbiBvZiB0aGUgcmF3IGtleS92YWx1ZSBtYXAgaW5zdGFuY2UgdXNlZCBsYXN0IHRvIHBvcHVsYXRlIHRoZSBhcnJheSBlbnRyaWVzICovXG4gIFJhd1ZhbHVlUG9zaXRpb24gPSAwLFxuXG4gIC8qKiBUaGUgc2l6ZSBvZiBlYWNoIHByb3BlcnR5L3ZhbHVlIGVudHJ5ICovXG4gIFR1cGxlU2l6ZSA9IDIsXG5cbiAgLyoqIFRoZSBvZmZzZXQgZm9yIHRoZSBwcm9wZXJ0eSBlbnRyeSBpbiB0aGUgdHVwbGUgKi9cbiAgUHJvcE9mZnNldCA9IDAsXG5cbiAgLyoqIFRoZSBvZmZzZXQgZm9yIHRoZSB2YWx1ZSBlbnRyeSBpbiB0aGUgdHVwbGUgKi9cbiAgVmFsdWVPZmZzZXQgPSAxLFxufVxuXG4vKipcbiAqIFVzZWQgdG8gYXBwbHkvdHJhdmVyc2UgYWNyb3NzIGFsbCBtYXAtYmFzZWQgc3R5bGluZyBlbnRyaWVzIHVwIHRvIHRoZSBwcm92aWRlZCBgdGFyZ2V0UHJvcGBcbiAqIHZhbHVlLlxuICpcbiAqIFdoZW4gY2FsbGVkLCBlYWNoIG9mIHRoZSBtYXAtYmFzZWQgYFN0eWxpbmdNYXBBcnJheWAgZW50cmllcyAod2hpY2ggYXJlIHN0b3JlZCBpblxuICogdGhlIHByb3ZpZGVkIGBMU3R5bGluZ0RhdGFgIGFycmF5KSB3aWxsIGJlIGl0ZXJhdGVkIG92ZXIuIERlcGVuZGluZyBvbiB0aGUgcHJvdmlkZWRcbiAqIGBtb2RlYCB2YWx1ZSwgZWFjaCBwcm9wL3ZhbHVlIGVudHJ5IG1heSBiZSBhcHBsaWVkIG9yIHNraXBwZWQgb3Zlci5cbiAqXG4gKiBJZiBgdGFyZ2V0UHJvcGAgdmFsdWUgaXMgcHJvdmlkZWQgdGhlIGl0ZXJhdGlvbiBjb2RlIHdpbGwgc3RvcCBvbmNlIGl0IHJlYWNoZXNcbiAqIHRoZSBwcm9wZXJ0eSAoaWYgZm91bmQpLiBPdGhlcndpc2UgaWYgdGhlIHRhcmdldCBwcm9wZXJ0eSBpcyBub3QgZW5jb3VudGVyZWQgdGhlblxuICogaXQgd2lsbCBzdG9wIG9uY2UgaXQgcmVhY2hlcyB0aGUgbmV4dCB2YWx1ZSB0aGF0IGFwcGVhcnMgYWxwaGFiZXRpY2FsbHkgYWZ0ZXIgaXQuXG4gKlxuICogSWYgYSBgZGVmYXVsdFZhbHVlYCBpcyBwcm92aWRlZCB0aGVuIGl0IHdpbGwgYmUgYXBwbGllZCB0byB0aGUgZWxlbWVudCBvbmx5IGlmIHRoZVxuICogYHRhcmdldFByb3BgIHByb3BlcnR5IHZhbHVlIGlzIGVuY291bnRlcmVkIGFuZCB0aGUgdmFsdWUgYXNzb2NpYXRlZCB3aXRoIHRoZSB0YXJnZXRcbiAqIHByb3BlcnR5IGlzIGBudWxsYC4gVGhlIHJlYXNvbiB3aHkgdGhlIGBkZWZhdWx0VmFsdWVgIGlzIG5lZWRlZCBpcyB0byBhdm9pZCBoYXZpbmcgdGhlXG4gKiBhbGdvcml0aG0gYXBwbHkgYSBgbnVsbGAgdmFsdWUgYW5kIHRoZW4gYXBwbHkgYSBkZWZhdWx0IHZhbHVlIGFmdGVyd2FyZHMgKHRoaXMgd291bGRcbiAqIGVuZCB1cCBiZWluZyB0d28gc3R5bGUgcHJvcGVydHkgd3JpdGVzKS5cbiAqXG4gKiBAcmV0dXJucyB3aGV0aGVyIG9yIG5vdCB0aGUgdGFyZ2V0IHByb3BlcnR5IHdhcyByZWFjaGVkIGFuZCBpdHMgdmFsdWUgd2FzXG4gKiAgYXBwbGllZCB0byB0aGUgZWxlbWVudC5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBTeW5jU3R5bGluZ01hcHNGbiB7XG4gIChjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIHJlbmRlcmVyOiBSZW5kZXJlcjN8UHJvY2VkdXJhbFJlbmRlcmVyM3xudWxsLCBlbGVtZW50OiBSRWxlbWVudCxcbiAgIGRhdGE6IExTdHlsaW5nRGF0YSwgc291cmNlSW5kZXg6IG51bWJlciwgYXBwbHlTdHlsaW5nRm46IEFwcGx5U3R5bGluZ0ZuLFxuICAgc2FuaXRpemVyOiBTdHlsZVNhbml0aXplRm58bnVsbCwgbW9kZTogU3R5bGluZ01hcHNTeW5jTW9kZSwgdGFyZ2V0UHJvcD86IHN0cmluZ3xudWxsLFxuICAgZGVmYXVsdFZhbHVlPzogYm9vbGVhbnxzdHJpbmd8bnVsbCk6IGJvb2xlYW47XG59XG5cbi8qKlxuICogVXNlZCB0byBkaXJlY3QgaG93IG1hcC1iYXNlZCB2YWx1ZXMgYXJlIGFwcGxpZWQvdHJhdmVyc2VkIHdoZW4gc3R5bGluZyBpcyBmbHVzaGVkLlxuICovXG5leHBvcnQgY29uc3QgZW51bSBTdHlsaW5nTWFwc1N5bmNNb2RlIHtcbiAgLyoqIE9ubHkgdHJhdmVyc2UgdmFsdWVzIChubyBwcm9wL3ZhbHVlIHN0eWxpbmcgZW50cmllcyBnZXQgYXBwbGllZCkgKi9cbiAgVHJhdmVyc2VWYWx1ZXMgPSAwYjAwMCxcblxuICAvKiogQXBwbHkgZXZlcnkgcHJvcC92YWx1ZSBzdHlsaW5nIGVudHJ5IHRvIHRoZSBlbGVtZW50ICovXG4gIEFwcGx5QWxsVmFsdWVzID0gMGIwMDEsXG5cbiAgLyoqIE9ubHkgYXBwbHkgdGhlIHRhcmdldCBwcm9wL3ZhbHVlIGVudHJ5ICovXG4gIEFwcGx5VGFyZ2V0UHJvcCA9IDBiMDEwLFxuXG4gIC8qKiBTa2lwIGFwcGx5aW5nIHRoZSB0YXJnZXQgcHJvcC92YWx1ZSBlbnRyeSAqL1xuICBTa2lwVGFyZ2V0UHJvcCA9IDBiMTAwLFxuXG4gIC8qKiBJdGVyYXRlIG92ZXIgaW5uZXIgbWFwcyBtYXAgdmFsdWVzIGluIHRoZSBjb250ZXh0ICovXG4gIFJlY3Vyc2VJbm5lck1hcHMgPSAwYjEwMDAsXG5cbiAgLyoqIE9ubHkgY2hlY2sgdG8gc2VlIGlmIGEgdmFsdWUgd2FzIHNldCBzb21ld2hlcmUgaW4gZWFjaCBtYXAgKi9cbiAgQ2hlY2tWYWx1ZXNPbmx5ID0gMGIxMDAwMCxcbn1cbiJdfQ==