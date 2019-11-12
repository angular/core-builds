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
    [TStylingContextIndex.TotalSourcesPosition]: number;*/
    /* Skipping unnamed member:
    [TStylingContextIndex.InitialStylingValuePosition]: StylingMapArray;*/
}
/** @enum {number} */
const TStylingContextIndex = {
    TotalSourcesPosition: 0,
    InitialStylingValuePosition: 1,
    ValuesStartPosition: 2,
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
    [StylingMapArrayIndex.RawValuePosition]: {}|string|number|null|undefined;*/
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
/**
 * Simplified `TNode` interface for styling-related code.
 *
 * The styling algorithm code only needs access to `flags`.
 * @record
 */
export function TStylingNode() { }
if (false) {
    /** @type {?} */
    TStylingNode.prototype.flags;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3R5bGluZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaW50ZXJmYWNlcy9zdHlsaW5nLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQXFVQSxxQ0FPQzs7Ozs7Ozs7O0lBTUMsdUJBQXdCO0lBQ3hCLDhCQUErQjtJQUMvQixzQkFBdUI7SUFFdkIsa0NBQWtDO0lBQ2xDLG9GQUFvRjtJQUNwRixlQUFnQjtJQUNoQix5QkFBMEI7SUFDMUIsNkJBQThCO0lBQzlCLGFBQWM7SUFDZCxzQkFBdUI7Ozs7O0lBT3ZCLFVBQWE7SUFDYix1QkFBMEI7SUFDMUIsWUFBYTtJQUNiLE9BQVU7Ozs7Ozs7QUFNWixvQ0FHQzs7Ozs7Ozs7Ozs7O0FBc0JELHFDQUtDOzs7Ozs7O0lBTUMsMENBQTBDO0lBQzFDLHNCQUF1QjtJQUV2Qiw2RkFBNkY7SUFDN0YsbUJBQW9CO0lBRXBCLDRDQUE0QztJQUM1QyxZQUFhO0lBRWIscURBQXFEO0lBQ3JELGFBQWM7SUFFZCxrREFBa0Q7SUFDbEQsY0FBZTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQXdCakIsdUNBS0M7OztJQU1DLHVFQUF1RTtJQUN2RSxpQkFBc0I7SUFFdEIsMERBQTBEO0lBQzFELGlCQUFzQjtJQUV0Qiw2Q0FBNkM7SUFDN0Msa0JBQXVCO0lBRXZCLGdEQUFnRDtJQUNoRCxpQkFBc0I7SUFFdEIsd0RBQXdEO0lBQ3hELG1CQUF5QjtJQUV6QixpRUFBaUU7SUFDakUsbUJBQXlCOzs7Ozs7Ozs7QUFRM0Isa0NBQW9EOzs7SUFBcEIsNkJBQWtCIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4qIEBsaWNlbnNlXG4qIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuKlxuKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4qL1xuaW1wb3J0IHtTdHlsZVNhbml0aXplRm59IGZyb20gJy4uLy4uL3Nhbml0aXphdGlvbi9zdHlsZV9zYW5pdGl6ZXInO1xuXG5pbXBvcnQge1ROb2RlRmxhZ3N9IGZyb20gJy4vbm9kZSc7XG5pbXBvcnQge1Byb2NlZHVyYWxSZW5kZXJlcjMsIFJFbGVtZW50LCBSZW5kZXJlcjN9IGZyb20gJy4vcmVuZGVyZXInO1xuaW1wb3J0IHtMVmlld30gZnJvbSAnLi92aWV3JztcblxuXG4vKipcbiAqIC0tLS0tLS0tXG4gKlxuICogVGhpcyBmaWxlIGNvbnRhaW5zIHRoZSBjb3JlIGludGVyZmFjZXMgZm9yIHN0eWxpbmcgaW4gQW5ndWxhci5cbiAqXG4gKiBUbyBsZWFybiBtb3JlIGFib3V0IHRoZSBhbGdvcml0aG0gc2VlIGBUU3R5bGluZ0NvbnRleHRgLlxuICpcbiAqIC0tLS0tLS0tXG4gKi9cblxuLyoqXG4gKiBBIHN0YXRpYy1sZXZlbCByZXByZXNlbnRhdGlvbiBvZiBhbGwgc3R5bGUgb3IgY2xhc3MgYmluZGluZ3MvdmFsdWVzXG4gKiBhc3NvY2lhdGVkIHdpdGggYSBgVE5vZGVgLlxuICpcbiAqIFRoZSBgVFN0eWxpbmdDb250ZXh0YCB1bml0ZXMgYWxsIHRlbXBsYXRlIHN0eWxpbmcgYmluZGluZ3MgKGkuZS5cbiAqIGBbY2xhc3NdYCBhbmQgYFtzdHlsZV1gIGJpbmRpbmdzKSBhcyB3ZWxsIGFzIGFsbCBob3N0LWxldmVsXG4gKiBzdHlsaW5nIGJpbmRpbmdzIChmb3IgY29tcG9uZW50cyBhbmQgZGlyZWN0aXZlcykgdG9nZXRoZXIgaW50b1xuICogYSBzaW5nbGUgbWFuaWZlc3RcbiAqXG4gKiBUaGUgc3R5bGluZyBjb250ZXh0IGlzIHN0b3JlZCBvbiBhIGBUTm9kZWAgb24gYW5kIHRoZXJlIGFyZVxuICogdHdvIGluc3RhbmNlcyBvZiBpdDogb25lIGZvciBjbGFzc2VzIGFuZCBhbm90aGVyIGZvciBzdHlsZXMuXG4gKlxuICogYGBgdHlwZXNjcmlwdFxuICogdE5vZGUuc3R5bGVzID0gWyAuLi4gYSBjb250ZXh0IG9ubHkgZm9yIHN0eWxlcyAuLi4gXTtcbiAqIHROb2RlLmNsYXNzZXMgPSBbIC4uLiBhIGNvbnRleHQgb25seSBmb3IgY2xhc3NlcyAuLi4gXTtcbiAqIGBgYFxuICpcbiAqIFRoZSBzdHlsaW5nIGNvbnRleHQgaXMgY3JlYXRlZCBlYWNoIHRpbWUgdGhlcmUgYXJlIG9uZSBvciBtb3JlXG4gKiBzdHlsaW5nIGJpbmRpbmdzIChzdHlsZSBvciBjbGFzcyBiaW5kaW5ncykgcHJlc2VudCBmb3IgYW4gZWxlbWVudCxcbiAqIGJ1dCBpcyBvbmx5IGNyZWF0ZWQgb25jZSBwZXIgYFROb2RlYC5cbiAqXG4gKiBgdE5vZGUuc3R5bGVzYCBhbmQgYHROb2RlLmNsYXNzZXNgIGNhbiBiZSBhbiBpbnN0YW5jZSBvZiB0aGUgZm9sbG93aW5nOlxuICpcbiAqIGBgYHR5cGVzY3JpcHRcbiAqIHROb2RlLnN0eWxlcyA9IG51bGw7IC8vIG5vIHN0YXRpYyBzdHlsaW5nIG9yIHN0eWxpbmcgYmluZGluZ3MgYWN0aXZlXG4gKiB0Tm9kZS5zdHlsZXMgPSBTdHlsaW5nTWFwQXJyYXk7IC8vIG9ubHkgc3RhdGljIHZhbHVlcyBwcmVzZW50IChlLmcuIGA8ZGl2IHN0eWxlPVwid2lkdGg6MjAwXCI+YClcbiAqIHROb2RlLnN0eWxlcyA9IFRTdHlsaW5nQ29udGV4dDsgLy8gb25lIG9yIG1vcmUgc3R5bGluZyBiaW5kaW5ncyBwcmVzZW50IChlLmcuIGA8ZGl2XG4gKiBbc3R5bGUud2lkdGhdPmApXG4gKiBgYGBcbiAqXG4gKiBCb3RoIGB0Tm9kZS5zdHlsZXNgIGFuZCBgdE5vZGUuY2xhc3Nlc2AgYXJlIGluc3RhbnRpYXRlZCB3aGVuIGFueXRoaW5nXG4gKiBzdHlsaW5nLXJlbGF0ZWQgaXMgYWN0aXZlIG9uIGFuIGVsZW1lbnQuIFRoZXkgYXJlIGZpcnN0IGNyZWF0ZWQgZnJvbVxuICogZnJvbSB0aGUgYW55IG9mIHRoZSBlbGVtZW50LWxldmVsIGluc3RydWN0aW9ucyAoZS5nLiBgZWxlbWVudGAsXG4gKiBgZWxlbWVudFN0YXJ0YCwgYGVsZW1lbnRIb3N0QXR0cnNgKS4gV2hlbiBhbnkgc3RhdGljIHN0eWxlL2NsYXNzXG4gKiB2YWx1ZXMgYXJlIGVuY291bnRlcmVkIHRoZXkgYXJlIHJlZ2lzdGVyZWQgb24gdGhlIGB0Tm9kZS5zdHlsZXNgXG4gKiBhbmQgYHROb2RlLmNsYXNzZXNgIGRhdGEtc3RydWN0dXJlcy4gQnkgZGVmYXVsdCAod2hlbiBhbnkgc3RhdGljXG4gKiB2YWx1ZXMgYXJlIGVuY291bnRlcmVkKSB0aGUgYHROb2RlLnN0eWxlc2Agb3IgYHROb2RlLmNsYXNzZXNgIHZhbHVlc1xuICogYXJlIGluc3RhbmNlcyBvZiBhIGBTdHlsaW5nTWFwQXJyYXlgLiBPbmx5IHdoZW4gc3R5bGUvY2xhc3MgYmluZGluZ3NcbiAqIGFyZSBkZXRlY3RlZCB0aGVuIHRoYXQgc3R5bGluZyBtYXAgaXMgY29udmVydGVkIGludG8gYW4gaW5zdGFuY2Ugb2ZcbiAqIGBUU3R5bGluZ0NvbnRleHRgLlxuICpcbiAqIER1ZSB0byB0aGUgZmFjdCB0aGUgdGhlIGBUU3R5bGluZ0NvbnRleHRgIGlzIHN0b3JlZCBvbiBhIGBUTm9kZWBcbiAqIHRoaXMgbWVhbnMgdGhhdCBhbGwgZGF0YSB3aXRoaW4gdGhlIGNvbnRleHQgaXMgc3RhdGljLiBJbnN0ZWFkIG9mXG4gKiBzdG9yaW5nIGFjdHVhbCBzdHlsaW5nIGJpbmRpbmcgdmFsdWVzLCB0aGUgbFZpZXcgYmluZGluZyBpbmRleCB2YWx1ZXNcbiAqIGFyZSBzdG9yZWQgd2l0aGluIHRoZSBjb250ZXh0LiAoc3RhdGljIG5hdHVyZSBtZWFucyBpdCBpcyBtb3JlIGNvbXBhY3QuKVxuICpcbiAqIFRoZSBjb2RlIGJlbG93IHNob3dzIGEgYnJlYWtkb3duIG9mIHR3byBpbnN0YW5jZXMgb2YgYFRTdHlsaW5nQ29udGV4dGBcbiAqIChvbmUgZm9yIGB0Tm9kZS5zdHlsZXNgIGFuZCBhbm90aGVyIGZvciBgdE5vZGUuY2xhc3Nlc2ApOlxuICpcbiAqIGBgYHR5cGVzY3JpcHRcbiAqIC8vIDxkaXYgW2NsYXNzLmFjdGl2ZV09XCJjXCIgIC8vIGxWaWV3IGJpbmRpbmcgaW5kZXggPSAyMFxuICogLy8gICAgICBbc3R5bGUud2lkdGhdPVwieFwiICAgLy8gbFZpZXcgYmluZGluZyBpbmRleCA9IDIxXG4gKiAvLyAgICAgIFtzdHlsZS5oZWlnaHRdPVwieVwiPiAvLyBsVmlldyBiaW5kaW5nIGluZGV4ID0gMjJcbiAqIC8vICAuLi5cbiAqIC8vIDwvZGl2PlxuICogdE5vZGUuc3R5bGVzID0gW1xuICogICAxLCAgICAgICAgIC8vIHRoZSB0b3RhbCBhbW91bnQgb2Ygc291cmNlcyBwcmVzZW50IChvbmx5IGAxYCBiL2MgdGhlcmUgYXJlIG9ubHkgdGVtcGxhdGVcbiAqIGJpbmRpbmdzKVxuICogICBbbnVsbF0sICAgIC8vIGluaXRpYWwgdmFsdWVzIGFycmF5IChhbiBpbnN0YW5jZSBvZiBgU3R5bGluZ01hcEFycmF5YClcbiAqXG4gKiAgIDAsICAgICAgICAgLy8gY29uZmlnIGVudHJ5IGZvciB0aGUgcHJvcGVydHkgKHNlZSBgVFN0eWxpbmdDb250ZXh0UHJvcENvbmZpZ0ZsYWdzYClcbiAqICAgMGIwMTAsICAgICAvLyB0ZW1wbGF0ZSBndWFyZCBtYXNrIGZvciBoZWlnaHRcbiAqICAgMCwgICAgICAgICAvLyBob3N0IGJpbmRpbmdzIGd1YXJkIG1hc2sgZm9yIGhlaWdodFxuICogICAnaGVpZ2h0JywgIC8vIHRoZSBwcm9wZXJ0eSBuYW1lXG4gKiAgIDIyLCAgICAgICAgLy8gdGhlIGJpbmRpbmcgbG9jYXRpb24gZm9yIHRoZSBcInlcIiBiaW5kaW5nIGluIHRoZSBsVmlld1xuICogICBudWxsLCAgICAgIC8vIHRoZSBkZWZhdWx0IHZhbHVlIGZvciBoZWlnaHRcbiAqXG4gKiAgIDAsICAgICAgICAgLy8gY29uZmlnIGVudHJ5IGZvciB0aGUgcHJvcGVydHkgKHNlZSBgVFN0eWxpbmdDb250ZXh0UHJvcENvbmZpZ0ZsYWdzYClcbiAqICAgMGIwMDEsICAgICAvLyB0ZW1wbGF0ZSBndWFyZCBtYXNrIGZvciB3aWR0aFxuICogICAwLCAgICAgICAgIC8vIGhvc3QgYmluZGluZ3MgZ3VhcmQgbWFzayBmb3Igd2lkdGhcbiAqICAgJ3dpZHRoJywgICAvLyB0aGUgcHJvcGVydHkgbmFtZVxuICogICAyMSwgICAgICAgIC8vIHRoZSBiaW5kaW5nIGxvY2F0aW9uIGZvciB0aGUgXCJ4XCIgYmluZGluZyBpbiB0aGUgbFZpZXdcbiAqICAgbnVsbCwgICAgICAvLyB0aGUgZGVmYXVsdCB2YWx1ZSBmb3Igd2lkdGhcbiAqIF07XG4gKlxuICogdE5vZGUuY2xhc3NlcyA9IFtcbiAqICAgMCwgICAgICAgICAvLyB0aGUgY29udGV4dCBjb25maWcgdmFsdWUgKHNlZSBgVFN0eWxpbmdDb250ZXh0Q29uZmlnYClcbiAqICAgMSwgICAgICAgICAvLyB0aGUgdG90YWwgYW1vdW50IG9mIHNvdXJjZXMgcHJlc2VudCAob25seSBgMWAgYi9jIHRoZXJlIGFyZSBvbmx5IHRlbXBsYXRlXG4gKiBiaW5kaW5ncylcbiAqICAgW251bGxdLCAgICAvLyBpbml0aWFsIHZhbHVlcyBhcnJheSAoYW4gaW5zdGFuY2Ugb2YgYFN0eWxpbmdNYXBBcnJheWApXG4gKlxuICogICAwLCAgICAgICAgIC8vIGNvbmZpZyBlbnRyeSBmb3IgdGhlIHByb3BlcnR5IChzZWUgYFRTdHlsaW5nQ29udGV4dFByb3BDb25maWdGbGFnc2ApXG4gKiAgIDBiMDAxLCAgICAgLy8gdGVtcGxhdGUgZ3VhcmQgbWFzayBmb3Igd2lkdGhcbiAqICAgMCwgICAgICAgICAvLyBob3N0IGJpbmRpbmdzIGd1YXJkIG1hc2sgZm9yIHdpZHRoXG4gKiAgICdhY3RpdmUnLCAgLy8gdGhlIHByb3BlcnR5IG5hbWVcbiAqICAgMjAsICAgICAgICAvLyB0aGUgYmluZGluZyBsb2NhdGlvbiBmb3IgdGhlIFwiY1wiIGJpbmRpbmcgaW4gdGhlIGxWaWV3XG4gKiAgIG51bGwsICAgICAgLy8gdGhlIGRlZmF1bHQgdmFsdWUgZm9yIHRoZSBgYWN0aXZlYCBjbGFzc1xuICogXTtcbiAqIGBgYFxuICpcbiAqIEVudHJ5IHZhbHVlIHByZXNlbnQgaW4gYW4gZW50cnkgKGNhbGxlZCBhIHR1cGxlKSB3aXRoaW4gdGhlXG4gKiBzdHlsaW5nIGNvbnRleHQgaXMgYXMgZm9sbG93czpcbiAqXG4gKiBgYGB0eXBlc2NyaXB0XG4gKiBjb250ZXh0ID0gW1xuICogICAvLy4uLlxuICogICBjb25maWdWYWx1ZSxcbiAqICAgdGVtcGxhdGVHdWFyZE1hc2ssXG4gKiAgIGhvc3RCaW5kaW5nc0d1YXJkTWFzayxcbiAqICAgcHJvcE5hbWUsXG4gKiAgIC4uLmJpbmRpbmdJbmRpY2VzLi4uLFxuICogICBkZWZhdWx0VmFsdWVcbiAqICAgLy8uLi5cbiAqIF07XG4gKiBgYGBcbiAqXG4gKiBCZWxvdyBpcyBhIGJyZWFrZG93biBvZiBlYWNoIHZhbHVlOlxuICpcbiAqIC0gKipjb25maWdWYWx1ZSoqOlxuICogICBQcm9wZXJ0eS1zcGVjaWZpYyBjb25maWd1cmF0aW9uIHZhbHVlcy4gVGhlIG9ubHkgY29uZmlnIHNldHRpbmdcbiAqICAgdGhhdCBpcyBpbXBsZW1lbnRlZCByaWdodCBub3cgaXMgd2hldGhlciBvciBub3QgdG8gc2FuaXRpemUgdGhlXG4gKiAgIHZhbHVlLlxuICpcbiAqIC0gKip0ZW1wbGF0ZUd1YXJkTWFzayoqOlxuICogICBBIG51bWVyaWMgdmFsdWUgd2hlcmUgZWFjaCBiaXQgcmVwcmVzZW50cyBhIGJpbmRpbmcgaW5kZXhcbiAqICAgbG9jYXRpb24uIEVhY2ggYmluZGluZyBpbmRleCBsb2NhdGlvbiBpcyBhc3NpZ25lZCBiYXNlZCBvblxuICogICBhIGxvY2FsIGNvdW50ZXIgdmFsdWUgdGhhdCBpbmNyZW1lbnRzIGVhY2ggdGltZSBhbiBpbnN0cnVjdGlvblxuICogICBpcyBjYWxsZWQ6XG4gKlxuICogYGBgXG4gKiA8ZGl2IFtzdHlsZS53aWR0aF09XCJ4XCIgICAvLyBiaW5kaW5nIGluZGV4ID0gMjEgKGNvdW50ZXIgaW5kZXggPSAwKVxuICogICAgICBbc3R5bGUuaGVpZ2h0XT1cInlcIj4gLy8gYmluZGluZyBpbmRleCA9IDIyIChjb3VudGVyIGluZGV4ID0gMSlcbiAqIGBgYFxuICpcbiAqICAgSW4gdGhlIGV4YW1wbGUgY29kZSBhYm92ZSwgaWYgdGhlIGB3aWR0aGAgdmFsdWUgd2hlcmUgdG8gY2hhbmdlXG4gKiAgIHRoZW4gdGhlIGZpcnN0IGJpdCBpbiB0aGUgbG9jYWwgYml0IG1hc2sgdmFsdWUgd291bGQgYmUgZmxpcHBlZFxuICogICAoYW5kIHRoZSBzZWNvbmQgYml0IGZvciB3aGVuIGBoZWlnaHRgKS5cbiAqXG4gKiAgIElmIGFuZCB3aGVuIHRoZXJlIGFyZSBtb3JlIHRoYW4gMzIgYmluZGluZyBzb3VyY2VzIGluIHRoZSBjb250ZXh0XG4gKiAgIChtb3JlIHRoYW4gMzIgYFtzdHlsZS9jbGFzc11gIGJpbmRpbmdzKSB0aGVuIHRoZSBiaXQgbWFza2luZyB3aWxsXG4gKiAgIG92ZXJmbG93IGFuZCB3ZSBhcmUgbGVmdCB3aXRoIGEgc2l0dWF0aW9uIHdoZXJlIGEgYC0xYCB2YWx1ZSB3aWxsXG4gKiAgIHJlcHJlc2VudCB0aGUgYml0IG1hc2suIER1ZSB0byB0aGUgd2F5IHRoYXQgSmF2YVNjcmlwdCBoYW5kbGVzXG4gKiAgIG5lZ2F0aXZlIHZhbHVlcywgd2hlbiB0aGUgYml0IG1hc2sgaXMgYC0xYCB0aGVuIGFsbCBiaXRzIHdpdGhpblxuICogICB0aGF0IHZhbHVlIHdpbGwgYmUgYXV0b21hdGljYWxseSBmbGlwcGVkICh0aGlzIGlzIGEgcXVpY2sgYW5kXG4gKiAgIGVmZmljaWVudCB3YXkgdG8gZmxpcCBhbGwgYml0cyBvbiB0aGUgbWFzayB3aGVuIGEgc3BlY2lhbCBraW5kXG4gKiAgIG9mIGNhY2hpbmcgc2NlbmFyaW8gb2NjdXJzIG9yIHdoZW4gdGhlcmUgYXJlIG1vcmUgdGhhbiAzMiBiaW5kaW5ncykuXG4gKlxuICogLSAqKmhvc3RCaW5kaW5nc0d1YXJkTWFzayoqOlxuICogICBBbm90aGVyIGluc3RhbmNlIG9mIGEgZ3VhcmQgbWFzayB0aGF0IGlzIHNwZWNpZmljIHRvIGhvc3QgYmluZGluZ3MuXG4gKiAgIFRoaXMgYmVoYXZlcyBleGFjdGx5IHRoZSBzYW1lIHdheSBhcyBkb2VzIHRoZSBgdGVtcGxhdGVHdWFyZE1hc2tgLFxuICogICBidXQgd2lsbCBub3QgY29udGFpbiBhbnkgYmluZGluZyBpbmZvcm1hdGlvbiBwcm9jZXNzZWQgaW4gdGhlIHRlbXBsYXRlLlxuICogICBUaGUgcmVhc29uIHdoeSB0aGVyZSBhcmUgdHdvIGluc3RhbmNlcyBvZiBndWFyZCBtYXNrcyAob25lIGZvciB0aGVcbiAqICAgdGVtcGxhdGUgYW5kIGFub3RoZXIgZm9yIGhvc3QgYmluZGluZ3MpIGlzIGJlY2F1c2UgdGhlIHRlbXBsYXRlIGJpbmRpbmdzXG4gKiAgIGFyZSBwcm9jZXNzZWQgYmVmb3JlIGhvc3QgYmluZGluZ3MgYW5kIHRoZSBzdGF0ZSBpbmZvcm1hdGlvbiBpcyBub3RcbiAqICAgY2FycmllZCBvdmVyIGludG8gdGhlIGhvc3QgYmluZGluZ3MgY29kZS4gQXMgc29vbiBhcyBob3N0IGJpbmRpbmdzIGFyZVxuICogICBwcm9jZXNzZWQgZm9yIGFuIGVsZW1lbnQgdGhlIGNvdW50ZXIgYW5kIHN0YXRlLWJhc2VkIGJpdCBtYXNrIHZhbHVlcyBhcmVcbiAqICAgc2V0IHRvIGAwYC5cbiAqXG4gKiBgYGBcbiAqIDxkaXYgW3N0eWxlLndpZHRoXT1cInhcIiAgIC8vIGJpbmRpbmcgaW5kZXggPSAyMSAoY291bnRlciBpbmRleCA9IDApXG4gKiAgICAgIFtzdHlsZS5oZWlnaHRdPVwieVwiICAvLyBiaW5kaW5nIGluZGV4ID0gMjIgKGNvdW50ZXIgaW5kZXggPSAxKVxuICogICAgICBkaXItdGhhdC1zZXRzLXdpZHRoICAvLyBiaW5kaW5nIGluZGV4ID0gMzAgKGNvdW50ZXIgaW5kZXggPSAwKVxuICogICAgICBkaXItdGhhdC1zZXRzLXdpZHRoPiAvLyBiaW5kaW5nIGluZGV4ID0gMzEgKGNvdW50ZXIgaW5kZXggPSAxKVxuICogYGBgXG4gKlxuICogLSAqKnByb3BOYW1lKio6XG4gKiAgIFRoZSBDU1MgcHJvcGVydHkgbmFtZSBvciBjbGFzcyBuYW1lIChlLmcgYHdpZHRoYCBvciBgYWN0aXZlYCkuXG4gKlxuICogLSAqKmJpbmRpbmdJbmRpY2VzLi4uKio6XG4gKiAgIEEgc2VyaWVzIG9mIG51bWVyaWMgYmluZGluZyB2YWx1ZXMgdGhhdCByZWZsZWN0IHdoZXJlIGluIHRoZVxuICogICBsVmlldyB0byBmaW5kIHRoZSBzdHlsZS9jbGFzcyB2YWx1ZXMgYXNzb2NpYXRlZCB3aXRoIHRoZSBwcm9wZXJ0eS5cbiAqICAgRWFjaCB2YWx1ZSBpcyBpbiBvcmRlciBpbiB0ZXJtcyBvZiBwcmlvcml0eSAodGVtcGxhdGVzIGFyZSBmaXJzdCxcbiAqICAgdGhlbiBkaXJlY3RpdmVzIGFuZCB0aGVuIGNvbXBvbmVudHMpLiBXaGVuIHRoZSBjb250ZXh0IGlzIGZsdXNoZWRcbiAqICAgYW5kIHRoZSBzdHlsZS9jbGFzcyB2YWx1ZXMgYXJlIGFwcGxpZWQgdG8gdGhlIGVsZW1lbnQgKHRoaXMgaGFwcGVuc1xuICogICBpbnNpZGUgb2YgdGhlIGBzdHlsaW5nQXBwbHlgIGluc3RydWN0aW9uKSB0aGVuIHRoZSBmbHVzaGluZyBjb2RlXG4gKiAgIHdpbGwga2VlcCBjaGVja2luZyBlYWNoIGJpbmRpbmcgaW5kZXggYWdhaW5zdCB0aGUgYXNzb2NpYXRlZCBsVmlld1xuICogICB0byBmaW5kIHRoZSBmaXJzdCBzdHlsZS9jbGFzcyB2YWx1ZSB0aGF0IGlzIG5vbi1udWxsLlxuICpcbiAqIC0gKipkZWZhdWx0VmFsdWUqKjpcbiAqICAgVGhpcyBpcyB0aGUgZGVmYXVsdCB0aGF0IHdpbGwgYWx3YXlzIGJlIGFwcGxpZWQgdG8gdGhlIGVsZW1lbnQgaWZcbiAqICAgYW5kIHdoZW4gYWxsIG90aGVyIGJpbmRpbmcgc291cmNlcyByZXR1cm4gYSByZXN1bHQgdGhhdCBpcyBudWxsLlxuICogICBVc3VhbGx5IHRoaXMgdmFsdWUgaXMgYG51bGxgIGJ1dCBpdCBjYW4gYWxzbyBiZSBhIHN0YXRpYyB2YWx1ZSB0aGF0XG4gKiAgIGlzIGludGVyY2VwdGVkIHdoZW4gdGhlIHROb2RlIGlzIGZpcnN0IGNvbnN0cnVjdHVyZWQgKGUuZy5cbiAqICAgYDxkaXYgc3R5bGU9XCJ3aWR0aDoyMDBweFwiPmAgaGFzIGEgZGVmYXVsdCB2YWx1ZSBvZiBgMjAwcHhgIGZvclxuICogICB0aGUgYHdpZHRoYCBwcm9wZXJ0eSkuXG4gKlxuICogRWFjaCB0aW1lIGEgbmV3IGJpbmRpbmcgaXMgZW5jb3VudGVyZWQgaXQgaXMgcmVnaXN0ZXJlZCBpbnRvIHRoZVxuICogY29udGV4dC4gVGhlIGNvbnRleHQgdGhlbiBpcyBjb250aW51YWxseSB1cGRhdGVkIHVudGlsIHRoZSBmaXJzdFxuICogc3R5bGluZyBhcHBseSBjYWxsIGhhcyBiZWVuIGNhbGxlZCAod2hpY2ggaXMgYXV0b21hdGljYWxseSBzY2hlZHVsZWRcbiAqIHRvIGJlIGNhbGxlZCBvbmNlIGFuIGVsZW1lbnQgZXhpdHMgZHVyaW5nIGNoYW5nZSBkZXRlY3Rpb24pLiBOb3RlIHRoYXRcbiAqIGVhY2ggZW50cnkgaW4gdGhlIGNvbnRleHQgaXMgc3RvcmVkIGluIGFscGhhYmV0aWNhbCBvcmRlci5cbiAqXG4gKiBPbmNlIHN0eWxpbmcgaGFzIGJlZW4gZmx1c2hlZCBmb3IgdGhlIGZpcnN0IHRpbWUgZm9yIGFuIGVsZW1lbnQgdGhlXG4gKiBjb250ZXh0IHdpbGwgc2V0IGFzIGxvY2tlZCAodGhpcyBwcmV2ZW50cyBiaW5kaW5ncyBmcm9tIGJlaW5nIGFkZGVkXG4gKiB0byB0aGUgY29udGV4dCBsYXRlciBvbikuXG4gKlxuICogIyBIb3cgU3R5bGVzL0NsYXNzZXMgYXJlIFJlbmRlcmVkXG4gKiBFYWNoIHRpbWUgYSBzdHlsaW5nIGluc3RydWN0aW9uIChlLmcuIGBbY2xhc3MubmFtZV1gLCBgW3N0eWxlLnByb3BdYCxcbiAqIGV0Yy4uLikgaXMgZXhlY3V0ZWQsIHRoZSBhc3NvY2lhdGVkIGBsVmlld2AgZm9yIHRoZSB2aWV3IGlzIHVwZGF0ZWRcbiAqIGF0IHRoZSBjdXJyZW50IGJpbmRpbmcgbG9jYXRpb24uIEFsc28sIHdoZW4gdGhpcyBoYXBwZW5zLCBhIGxvY2FsXG4gKiBjb3VudGVyIHZhbHVlIGlzIGluY3JlbWVudGVkLiBJZiB0aGUgYmluZGluZyB2YWx1ZSBoYXMgY2hhbmdlZCB0aGVuXG4gKiBhIGxvY2FsIGBiaXRNYXNrYCB2YXJpYWJsZSBpcyB1cGRhdGVkIHdpdGggdGhlIHNwZWNpZmljIGJpdCBiYXNlZFxuICogb24gdGhlIGNvdW50ZXIgdmFsdWUuXG4gKlxuICogQmVsb3cgaXMgYSBsaWdodHdlaWdodCBleGFtcGxlIG9mIHdoYXQgaGFwcGVucyB3aGVuIGEgc2luZ2xlIHN0eWxlXG4gKiBwcm9wZXJ0eSBpcyB1cGRhdGVkIChpLmUuIGA8ZGl2IFtzdHlsZS5wcm9wXT1cInZhbFwiPmApOlxuICpcbiAqIGBgYHR5cGVzY3JpcHRcbiAqIGZ1bmN0aW9uIHVwZGF0ZVN0eWxlUHJvcChwcm9wOiBzdHJpbmcsIHZhbHVlOiBzdHJpbmcpIHtcbiAqICAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICogICBjb25zdCBiaW5kaW5nSW5kZXggPSBCSU5ESU5HX0lOREVYKys7XG4gKlxuICogICAvLyB1cGRhdGUgdGhlIGxvY2FsIGNvdW50ZXIgdmFsdWVcbiAqICAgY29uc3QgaW5kZXhGb3JTdHlsZSA9IHN0eWxpbmdTdGF0ZS5zdHlsZXNDb3VudCsrO1xuICogICBpZiAobFZpZXdbYmluZGluZ0luZGV4XSAhPT0gdmFsdWUpIHtcbiAqICAgICBsVmlld1tiaW5kaW5nSW5kZXhdID0gdmFsdWU7XG4gKlxuICogICAgIC8vIHRlbGwgdGhlIGxvY2FsIHN0YXRlIHRoYXQgd2UgaGF2ZSB1cGRhdGVkIGEgc3R5bGUgdmFsdWVcbiAqICAgICAvLyBieSB1cGRhdGluZyB0aGUgYml0IG1hc2tcbiAqICAgICBzdHlsaW5nU3RhdGUuYml0TWFza0ZvclN0eWxlcyB8PSAxIDw8IGluZGV4Rm9yU3R5bGU7XG4gKiAgIH1cbiAqIH1cbiAqIGBgYFxuICpcbiAqIE9uY2UgYWxsIHRoZSBiaW5kaW5ncyBoYXZlIHVwZGF0ZWQgYSBgYml0TWFza2AgdmFsdWUgd2lsbCBiZSBwb3B1bGF0ZWQuXG4gKiBUaGlzIGBiaXRNYXNrYCB2YWx1ZSBpcyB1c2VkIGluIHRoZSBhcHBseSBhbGdvcml0aG0gKHdoaWNoIGlzIGNhbGxlZFxuICogY29udGV4dCByZXNvbHV0aW9uKS5cbiAqXG4gKiAjIyBUaGUgQXBwbHkgQWxnb3JpdGhtIChDb250ZXh0IFJlc29sdXRpb24pXG4gKiBBcyBleHBsYWluZWQgYWJvdmUsIGVhY2ggdGltZSBhIGJpbmRpbmcgdXBkYXRlcyBpdHMgdmFsdWUsIHRoZSByZXN1bHRpbmdcbiAqIHZhbHVlIGlzIHN0b3JlZCBpbiB0aGUgYGxWaWV3YCBhcnJheS4gVGhlc2Ugc3R5bGluZyB2YWx1ZXMgaGF2ZSB5ZXQgdG9cbiAqIGJlIGZsdXNoZWQgdG8gdGhlIGVsZW1lbnQuXG4gKlxuICogT25jZSBhbGwgdGhlIHN0eWxpbmcgaW5zdHJ1Y3Rpb25zIGhhdmUgYmVlbiBldmFsdWF0ZWQsIHRoZW4gdGhlIHN0eWxpbmdcbiAqIGNvbnRleHQocykgYXJlIGZsdXNoZWQgdG8gdGhlIGVsZW1lbnQuIFdoZW4gdGhpcyBoYXBwZW5zLCB0aGUgY29udGV4dCB3aWxsXG4gKiBiZSBpdGVyYXRlZCBvdmVyIChwcm9wZXJ0eSBieSBwcm9wZXJ0eSkgYW5kIGVhY2ggYmluZGluZyBzb3VyY2Ugd2lsbCBiZVxuICogZXhhbWluZWQgYW5kIHRoZSBmaXJzdCBub24tbnVsbCB2YWx1ZSB3aWxsIGJlIGFwcGxpZWQgdG8gdGhlIGVsZW1lbnQuXG4gKlxuICogTGV0J3Mgc2F5IHRoYXQgd2UgdGhlIGZvbGxvd2luZyB0ZW1wbGF0ZSBjb2RlOlxuICpcbiAqIGBgYGh0bWxcbiAqIDxkaXYgW3N0eWxlLndpZHRoXT1cIncxXCIgZGlyLXRoYXQtc2V0LXdpZHRoPVwidzJcIj48L2Rpdj5cbiAqIGBgYFxuICpcbiAqIFRoZXJlIGFyZSB0d28gc3R5bGluZyBiaW5kaW5ncyBpbiB0aGUgY29kZSBhYm92ZSBhbmQgdGhleSBib3RoIHdyaXRlXG4gKiB0byB0aGUgYHdpZHRoYCBwcm9wZXJ0eS4gV2hlbiBzdHlsaW5nIGlzIGZsdXNoZWQgb24gdGhlIGVsZW1lbnQsIHRoZVxuICogYWxnb3JpdGhtIHdpbGwgdHJ5IGFuZCBmaWd1cmUgb3V0IHdoaWNoIG9uZSBvZiB0aGVzZSB2YWx1ZXMgdG8gd3JpdGVcbiAqIHRvIHRoZSBlbGVtZW50LlxuICpcbiAqIEluIG9yZGVyIHRvIGZpZ3VyZSBvdXQgd2hpY2ggdmFsdWUgdG8gYXBwbHksIHRoZSBmb2xsb3dpbmdcbiAqIGJpbmRpbmcgcHJpb3JpdGl6YXRpb24gaXMgYWRoZXJlZCB0bzpcbiAqXG4gKiAgIDEuIEZpcnN0IHRlbXBsYXRlLWxldmVsIHN0eWxpbmcgYmluZGluZ3MgYXJlIGFwcGxpZWQgKGlmIHByZXNlbnQpLlxuICogICAgICBUaGlzIGluY2x1ZGVzIHRoaW5ncyBsaWtlIGBbc3R5bGUud2lkdGhdYCBhbmQgYFtjbGFzcy5hY3RpdmVdYC5cbiAqXG4gKiAgIDIuIFNlY29uZCBhcmUgc3R5bGluZy1sZXZlbCBob3N0IGJpbmRpbmdzIHByZXNlbnQgaW4gZGlyZWN0aXZlcy5cbiAqICAgICAgKGlmIHRoZXJlIGFyZSBzdWIvc3VwZXIgZGlyZWN0aXZlcyBwcmVzZW50IHRoZW4gdGhlIHN1YiBkaXJlY3RpdmVzXG4gKiAgICAgIGFyZSBhcHBsaWVkIGZpcnN0KS5cbiAqXG4gKiAgIDMuIFRoaXJkIGFyZSBzdHlsaW5nLWxldmVsIGhvc3QgYmluZGluZ3MgcHJlc2VudCBpbiBjb21wb25lbnRzLlxuICogICAgICAoaWYgdGhlcmUgYXJlIHN1Yi9zdXBlciBjb21wb25lbnRzIHByZXNlbnQgdGhlbiB0aGUgc3ViIGRpcmVjdGl2ZXNcbiAqICAgICAgYXJlIGFwcGxpZWQgZmlyc3QpLlxuICpcbiAqIFRoaXMgbWVhbnMgdGhhdCBpbiB0aGUgY29kZSBhYm92ZSB0aGUgc3R5bGluZyBiaW5kaW5nIHByZXNlbnQgaW4gdGhlXG4gKiB0ZW1wbGF0ZSBpcyBhcHBsaWVkIGZpcnN0IGFuZCwgb25seSBpZiBpdHMgZmFsc3ksIHRoZW4gdGhlIGRpcmVjdGl2ZVxuICogc3R5bGluZyBiaW5kaW5nIGZvciB3aWR0aCB3aWxsIGJlIGFwcGxpZWQuXG4gKlxuICogIyMjIFdoYXQgYWJvdXQgbWFwLWJhc2VkIHN0eWxpbmcgYmluZGluZ3M/XG4gKiBNYXAtYmFzZWQgc3R5bGluZyBiaW5kaW5ncyBhcmUgYWN0aXZhdGVkIHdoZW4gdGhlcmUgYXJlIG9uZSBvciBtb3JlXG4gKiBgW3N0eWxlXWAgYW5kL29yIGBbY2xhc3NdYCBiaW5kaW5ncyBwcmVzZW50IG9uIGFuIGVsZW1lbnQuIFdoZW4gdGhpc1xuICogY29kZSBpcyBhY3RpdmF0ZWQsIHRoZSBhcHBseSBhbGdvcml0aG0gd2lsbCBpdGVyYXRlIG92ZXIgZWFjaCBtYXBcbiAqIGVudHJ5IGFuZCBhcHBseSBlYWNoIHN0eWxpbmcgdmFsdWUgdG8gdGhlIGVsZW1lbnQgd2l0aCB0aGUgc2FtZVxuICogcHJpb3JpdGl6YXRpb24gcnVsZXMgYXMgYWJvdmUuXG4gKlxuICogRm9yIHRoZSBhbGdvcml0aG0gdG8gYXBwbHkgc3R5bGluZyB2YWx1ZXMgZWZmaWNpZW50bHksIHRoZVxuICogc3R5bGluZyBtYXAgZW50cmllcyBtdXN0IGJlIGFwcGxpZWQgaW4gc3luYyAocHJvcGVydHkgYnkgcHJvcGVydHkpXG4gKiB3aXRoIHByb3AtYmFzZWQgYmluZGluZ3MuIChUaGUgbWFwLWJhc2VkIGFsZ29yaXRobSBpcyBkZXNjcmliZWRcbiAqIG1vcmUgaW5zaWRlIG9mIHRoZSBgcmVuZGVyMy9zdHlsaW5nL21hcF9iYXNlZF9iaW5kaW5ncy50c2AgZmlsZS4pXG4gKlxuICogIyMgU2FuaXRpemF0aW9uXG4gKiBTYW5pdGl6YXRpb24gaXMgdXNlZCB0byBwcmV2ZW50IGludmFsaWQgc3R5bGUgdmFsdWVzIGZyb20gYmVpbmcgYXBwbGllZCB0b1xuICogdGhlIGVsZW1lbnQuXG4gKlxuICogSXQgaXMgZW5hYmxlZCBpbiB0d28gY2FzZXM6XG4gKlxuICogICAxLiBUaGUgYHN0eWxlU2FuaXRpemVyKHNhbml0aXplckZuKWAgaW5zdHJ1Y3Rpb24gd2FzIGNhbGxlZCAoanVzdCBiZWZvcmUgYW55IG90aGVyXG4gKiAgICAgIHN0eWxpbmcgaW5zdHJ1Y3Rpb25zIGFyZSBydW4pLlxuICpcbiAqICAgMi4gVGhlIGNvbXBvbmVudC9kaXJlY3RpdmUgYExWaWV3YCBpbnN0YW5jZSBoYXMgYSBzYW5pdGl6ZXIgb2JqZWN0IGF0dGFjaGVkIHRvIGl0XG4gKiAgICAgICh0aGlzIGhhcHBlbnMgd2hlbiBgcmVuZGVyQ29tcG9uZW50YCBpcyBleGVjdXRlZCB3aXRoIGEgYHNhbml0aXplcmAgdmFsdWUgb3JcbiAqICAgICAgaWYgdGhlIG5nTW9kdWxlIGNvbnRhaW5zIGEgc2FuaXRpemVyIHByb3ZpZGVyIGF0dGFjaGVkIHRvIGl0KS5cbiAqXG4gKiBJZiBhbmQgd2hlbiBzYW5pdGl6YXRpb24gaXMgYWN0aXZlIHRoZW4gYWxsIHByb3BlcnR5L3ZhbHVlIGVudHJpZXMgd2lsbCBiZSBldmFsdWF0ZWRcbiAqIHRocm91Z2ggdGhlIGFjdGl2ZSBzYW5pdGl6ZXIgYmVmb3JlIHRoZXkgYXJlIGFwcGxpZWQgdG8gdGhlIGVsZW1lbnQgKG9yIHRoZSBzdHlsaW5nXG4gKiBkZWJ1ZyBoYW5kbGVyKS5cbiAqXG4gKiBJZiBhIGBTYW5pdGl6ZXJgIG9iamVjdCBpcyB1c2VkICh2aWEgdGhlIGBMVmlld1tTQU5JVElaRVJdYCB2YWx1ZSkgdGhlbiB0aGF0IG9iamVjdFxuICogd2lsbCBiZSB1c2VkIGZvciBldmVyeSBwcm9wZXJ0eS5cbiAqXG4gKiBJZiBhIGBTdHlsZVNhbml0aXplckZuYCBmdW5jdGlvbiBpcyB1c2VkICh2aWEgdGhlIGBzdHlsZVNhbml0aXplcmApIHRoZW4gaXQgd2lsbCBiZVxuICogY2FsbGVkIGluIHR3byB3YXlzOlxuICpcbiAqICAgMS4gcHJvcGVydHkgdmFsaWRhdGlvbiBtb2RlOiB0aGlzIHdpbGwgYmUgY2FsbGVkIGVhcmx5IHRvIG1hcmsgd2hldGhlciBhIHByb3BlcnR5XG4gKiAgICAgIHNob3VsZCBiZSBzYW5pdGl6ZWQgb3Igbm90IGF0IGR1cmluZyB0aGUgZmx1c2hpbmcgc3RhZ2UuXG4gKlxuICogICAyLiB2YWx1ZSBzYW5pdGl6YXRpb24gbW9kZTogdGhpcyB3aWxsIGJlIGNhbGxlZCBkdXJpbmcgdGhlIGZsdXNoaW5nIHN0YWdlIGFuZCB3aWxsXG4gKiAgICAgIHJ1biB0aGUgc2FuaXRpemVyIGZ1bmN0aW9uIGFnYWluc3QgdGhlIHZhbHVlIGJlZm9yZSBhcHBseWluZyBpdCB0byB0aGUgZWxlbWVudC5cbiAqXG4gKiBJZiBzYW5pdGl6YXRpb24gcmV0dXJucyBhbiBlbXB0eSB2YWx1ZSB0aGVuIHRoYXQgZW1wdHkgdmFsdWUgd2lsbCBiZSBhcHBsaWVkXG4gKiB0byB0aGUgZWxlbWVudC5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBUU3R5bGluZ0NvbnRleHQgZXh0ZW5kc1xuICAgIEFycmF5PG51bWJlcnxzdHJpbmd8bnVtYmVyfGJvb2xlYW58bnVsbHxTdHlsaW5nTWFwQXJyYXl8e30+IHtcbiAgLyoqIFRoZSB0b3RhbCBhbW91bnQgb2Ygc291cmNlcyBwcmVzZW50IGluIHRoZSBjb250ZXh0ICovXG4gIFtUU3R5bGluZ0NvbnRleHRJbmRleC5Ub3RhbFNvdXJjZXNQb3NpdGlvbl06IG51bWJlcjtcblxuICAvKiogSW5pdGlhbCB2YWx1ZSBwb3NpdGlvbiBmb3Igc3RhdGljIHN0eWxlcyAqL1xuICBbVFN0eWxpbmdDb250ZXh0SW5kZXguSW5pdGlhbFN0eWxpbmdWYWx1ZVBvc2l0aW9uXTogU3R5bGluZ01hcEFycmF5O1xufVxuXG4vKipcbiAqIEFuIGluZGV4IG9mIHBvc2l0aW9uIGFuZCBvZmZzZXQgdmFsdWVzIHVzZWQgdG8gbmF2aWdhdGUgdGhlIGBUU3R5bGluZ0NvbnRleHRgLlxuICovXG5leHBvcnQgY29uc3QgZW51bSBUU3R5bGluZ0NvbnRleHRJbmRleCB7XG4gIFRvdGFsU291cmNlc1Bvc2l0aW9uID0gMCxcbiAgSW5pdGlhbFN0eWxpbmdWYWx1ZVBvc2l0aW9uID0gMSxcbiAgVmFsdWVzU3RhcnRQb3NpdGlvbiA9IDIsXG5cbiAgLy8gZWFjaCB0dXBsZSBlbnRyeSBpbiB0aGUgY29udGV4dFxuICAvLyAoY29uZmlnLCB0ZW1wbGF0ZUJpdEd1YXJkLCBob3N0QmluZGluZ0JpdEd1YXJkLCBwcm9wLCAuLi5iaW5kaW5nc3x8ZGVmYXVsdC12YWx1ZSlcbiAgQ29uZmlnT2Zmc2V0ID0gMCxcbiAgVGVtcGxhdGVCaXRHdWFyZE9mZnNldCA9IDEsXG4gIEhvc3RCaW5kaW5nc0JpdEd1YXJkT2Zmc2V0ID0gMixcbiAgUHJvcE9mZnNldCA9IDMsXG4gIEJpbmRpbmdzU3RhcnRPZmZzZXQgPSA0XG59XG5cbi8qKlxuICogQSBzZXJpZXMgb2YgZmxhZ3MgdXNlZCBmb3IgZWFjaCBwcm9wZXJ0eSBlbnRyeSB3aXRoaW4gdGhlIGBUU3R5bGluZ0NvbnRleHRgLlxuICovXG5leHBvcnQgY29uc3QgZW51bSBUU3R5bGluZ0NvbnRleHRQcm9wQ29uZmlnRmxhZ3Mge1xuICBEZWZhdWx0ID0gMGIwLFxuICBTYW5pdGl6YXRpb25SZXF1aXJlZCA9IDBiMSxcbiAgVG90YWxCaXRzID0gMSxcbiAgTWFzayA9IDBiMSxcbn1cblxuLyoqXG4gKiBBIGZ1bmN0aW9uIHVzZWQgdG8gYXBwbHkgb3IgcmVtb3ZlIHN0eWxpbmcgZnJvbSBhbiBlbGVtZW50IGZvciBhIGdpdmVuIHByb3BlcnR5LlxuICovXG5leHBvcnQgaW50ZXJmYWNlIEFwcGx5U3R5bGluZ0ZuIHtcbiAgKHJlbmRlcmVyOiBSZW5kZXJlcjN8UHJvY2VkdXJhbFJlbmRlcmVyM3xudWxsLCBlbGVtZW50OiBSRWxlbWVudCwgcHJvcDogc3RyaW5nLCB2YWx1ZTogYW55LFxuICAgYmluZGluZ0luZGV4PzogbnVtYmVyfG51bGwpOiB2b2lkO1xufVxuXG4vKipcbiAqIFJ1bnRpbWUgZGF0YSB0eXBlIHRoYXQgaXMgdXNlZCB0byBzdG9yZSBiaW5kaW5nIGRhdGEgcmVmZXJlbmNlZCBmcm9tIHRoZSBgVFN0eWxpbmdDb250ZXh0YC5cbiAqXG4gKiBCZWNhdXNlIGBMVmlld2AgaXMganVzdCBhbiBhcnJheSB3aXRoIGRhdGEsIHRoZXJlIGlzIG5vIHJlYXNvbiB0b1xuICogc3BlY2lhbCBjYXNlIGBMVmlld2AgZXZlcnl3aGVyZSBpbiB0aGUgc3R5bGluZyBhbGdvcml0aG0uIEJ5IGFsbG93aW5nXG4gKiB0aGlzIGRhdGEgdHlwZSB0byBiZSBhbiBhcnJheSB0aGF0IGNvbnRhaW5zIHZhcmlvdXMgc2NhbGFyIGRhdGEgdHlwZXMsXG4gKiBhbiBpbnN0YW5jZSBvZiBgTFZpZXdgIGRvZXNuJ3QgbmVlZCB0byBiZSBjb25zdHJ1Y3RlZCBmb3IgdGVzdHMuXG4gKi9cbmV4cG9ydCB0eXBlIExTdHlsaW5nRGF0YSA9IExWaWV3IHwgKHN0cmluZyB8IG51bWJlciB8IGJvb2xlYW4gfCBudWxsKVtdO1xuXG4vKipcbiAqIEFycmF5LWJhc2VkIHJlcHJlc2VudGF0aW9uIG9mIGEga2V5L3ZhbHVlIGFycmF5LlxuICpcbiAqIFRoZSBmb3JtYXQgb2YgdGhlIGFycmF5IGlzIFwicHJvcGVydHlcIiwgXCJ2YWx1ZVwiLCBcInByb3BlcnR5MlwiLFxuICogXCJ2YWx1ZTJcIiwgZXRjLi4uXG4gKlxuICogVGhlIGZpcnN0IHZhbHVlIGluIHRoZSBhcnJheSBpcyByZXNlcnZlZCB0byBzdG9yZSB0aGUgaW5zdGFuY2VcbiAqIG9mIHRoZSBrZXkvdmFsdWUgYXJyYXkgdGhhdCB3YXMgdXNlZCB0byBwb3B1bGF0ZSB0aGUgcHJvcGVydHkvXG4gKiB2YWx1ZSBlbnRyaWVzIHRoYXQgdGFrZSBwbGFjZSBpbiB0aGUgcmVtYWluZGVyIG9mIHRoZSBhcnJheS5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBTdHlsaW5nTWFwQXJyYXkgZXh0ZW5kcyBBcnJheTx7fXxzdHJpbmd8bnVtYmVyfG51bGx8dW5kZWZpbmVkPiB7XG4gIC8qKlxuICAgKiBUaGUgbGFzdCByYXcgdmFsdWUgdXNlZCB0byBnZW5lcmF0ZSB0aGUgZW50cmllcyBpbiB0aGUgbWFwLlxuICAgKi9cbiAgW1N0eWxpbmdNYXBBcnJheUluZGV4LlJhd1ZhbHVlUG9zaXRpb25dOiB7fXxzdHJpbmd8bnVtYmVyfG51bGx8dW5kZWZpbmVkO1xufVxuXG4vKipcbiAqIEFuIGluZGV4IG9mIHBvc2l0aW9uIGFuZCBvZmZzZXQgcG9pbnRzIGZvciBhbnkgZGF0YSBzdG9yZWQgd2l0aGluIGEgYFN0eWxpbmdNYXBBcnJheWAgaW5zdGFuY2UuXG4gKi9cbmV4cG9ydCBjb25zdCBlbnVtIFN0eWxpbmdNYXBBcnJheUluZGV4IHtcbiAgLyoqIFdoZXJlIHRoZSB2YWx1ZXMgc3RhcnQgaW4gdGhlIGFycmF5ICovXG4gIFZhbHVlc1N0YXJ0UG9zaXRpb24gPSAxLFxuXG4gIC8qKiBUaGUgbG9jYXRpb24gb2YgdGhlIHJhdyBrZXkvdmFsdWUgbWFwIGluc3RhbmNlIHVzZWQgbGFzdCB0byBwb3B1bGF0ZSB0aGUgYXJyYXkgZW50cmllcyAqL1xuICBSYXdWYWx1ZVBvc2l0aW9uID0gMCxcblxuICAvKiogVGhlIHNpemUgb2YgZWFjaCBwcm9wZXJ0eS92YWx1ZSBlbnRyeSAqL1xuICBUdXBsZVNpemUgPSAyLFxuXG4gIC8qKiBUaGUgb2Zmc2V0IGZvciB0aGUgcHJvcGVydHkgZW50cnkgaW4gdGhlIHR1cGxlICovXG4gIFByb3BPZmZzZXQgPSAwLFxuXG4gIC8qKiBUaGUgb2Zmc2V0IGZvciB0aGUgdmFsdWUgZW50cnkgaW4gdGhlIHR1cGxlICovXG4gIFZhbHVlT2Zmc2V0ID0gMSxcbn1cblxuLyoqXG4gKiBVc2VkIHRvIGFwcGx5L3RyYXZlcnNlIGFjcm9zcyBhbGwgbWFwLWJhc2VkIHN0eWxpbmcgZW50cmllcyB1cCB0byB0aGUgcHJvdmlkZWQgYHRhcmdldFByb3BgXG4gKiB2YWx1ZS5cbiAqXG4gKiBXaGVuIGNhbGxlZCwgZWFjaCBvZiB0aGUgbWFwLWJhc2VkIGBTdHlsaW5nTWFwQXJyYXlgIGVudHJpZXMgKHdoaWNoIGFyZSBzdG9yZWQgaW5cbiAqIHRoZSBwcm92aWRlZCBgTFN0eWxpbmdEYXRhYCBhcnJheSkgd2lsbCBiZSBpdGVyYXRlZCBvdmVyLiBEZXBlbmRpbmcgb24gdGhlIHByb3ZpZGVkXG4gKiBgbW9kZWAgdmFsdWUsIGVhY2ggcHJvcC92YWx1ZSBlbnRyeSBtYXkgYmUgYXBwbGllZCBvciBza2lwcGVkIG92ZXIuXG4gKlxuICogSWYgYHRhcmdldFByb3BgIHZhbHVlIGlzIHByb3ZpZGVkIHRoZSBpdGVyYXRpb24gY29kZSB3aWxsIHN0b3Agb25jZSBpdCByZWFjaGVzXG4gKiB0aGUgcHJvcGVydHkgKGlmIGZvdW5kKS4gT3RoZXJ3aXNlIGlmIHRoZSB0YXJnZXQgcHJvcGVydHkgaXMgbm90IGVuY291bnRlcmVkIHRoZW5cbiAqIGl0IHdpbGwgc3RvcCBvbmNlIGl0IHJlYWNoZXMgdGhlIG5leHQgdmFsdWUgdGhhdCBhcHBlYXJzIGFscGhhYmV0aWNhbGx5IGFmdGVyIGl0LlxuICpcbiAqIElmIGEgYGRlZmF1bHRWYWx1ZWAgaXMgcHJvdmlkZWQgdGhlbiBpdCB3aWxsIGJlIGFwcGxpZWQgdG8gdGhlIGVsZW1lbnQgb25seSBpZiB0aGVcbiAqIGB0YXJnZXRQcm9wYCBwcm9wZXJ0eSB2YWx1ZSBpcyBlbmNvdW50ZXJlZCBhbmQgdGhlIHZhbHVlIGFzc29jaWF0ZWQgd2l0aCB0aGUgdGFyZ2V0XG4gKiBwcm9wZXJ0eSBpcyBgbnVsbGAuIFRoZSByZWFzb24gd2h5IHRoZSBgZGVmYXVsdFZhbHVlYCBpcyBuZWVkZWQgaXMgdG8gYXZvaWQgaGF2aW5nIHRoZVxuICogYWxnb3JpdGhtIGFwcGx5IGEgYG51bGxgIHZhbHVlIGFuZCB0aGVuIGFwcGx5IGEgZGVmYXVsdCB2YWx1ZSBhZnRlcndhcmRzICh0aGlzIHdvdWxkXG4gKiBlbmQgdXAgYmVpbmcgdHdvIHN0eWxlIHByb3BlcnR5IHdyaXRlcykuXG4gKlxuICogQHJldHVybnMgd2hldGhlciBvciBub3QgdGhlIHRhcmdldCBwcm9wZXJ0eSB3YXMgcmVhY2hlZCBhbmQgaXRzIHZhbHVlIHdhc1xuICogIGFwcGxpZWQgdG8gdGhlIGVsZW1lbnQuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgU3luY1N0eWxpbmdNYXBzRm4ge1xuICAoY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCByZW5kZXJlcjogUmVuZGVyZXIzfFByb2NlZHVyYWxSZW5kZXJlcjN8bnVsbCwgZWxlbWVudDogUkVsZW1lbnQsXG4gICBkYXRhOiBMU3R5bGluZ0RhdGEsIHNvdXJjZUluZGV4OiBudW1iZXIsIGFwcGx5U3R5bGluZ0ZuOiBBcHBseVN0eWxpbmdGbixcbiAgIHNhbml0aXplcjogU3R5bGVTYW5pdGl6ZUZufG51bGwsIG1vZGU6IFN0eWxpbmdNYXBzU3luY01vZGUsIHRhcmdldFByb3A/OiBzdHJpbmd8bnVsbCxcbiAgIGRlZmF1bHRWYWx1ZT86IGJvb2xlYW58c3RyaW5nfG51bGwpOiBib29sZWFuO1xufVxuXG4vKipcbiAqIFVzZWQgdG8gZGlyZWN0IGhvdyBtYXAtYmFzZWQgdmFsdWVzIGFyZSBhcHBsaWVkL3RyYXZlcnNlZCB3aGVuIHN0eWxpbmcgaXMgZmx1c2hlZC5cbiAqL1xuZXhwb3J0IGNvbnN0IGVudW0gU3R5bGluZ01hcHNTeW5jTW9kZSB7XG4gIC8qKiBPbmx5IHRyYXZlcnNlIHZhbHVlcyAobm8gcHJvcC92YWx1ZSBzdHlsaW5nIGVudHJpZXMgZ2V0IGFwcGxpZWQpICovXG4gIFRyYXZlcnNlVmFsdWVzID0gMGIwMDAsXG5cbiAgLyoqIEFwcGx5IGV2ZXJ5IHByb3AvdmFsdWUgc3R5bGluZyBlbnRyeSB0byB0aGUgZWxlbWVudCAqL1xuICBBcHBseUFsbFZhbHVlcyA9IDBiMDAxLFxuXG4gIC8qKiBPbmx5IGFwcGx5IHRoZSB0YXJnZXQgcHJvcC92YWx1ZSBlbnRyeSAqL1xuICBBcHBseVRhcmdldFByb3AgPSAwYjAxMCxcblxuICAvKiogU2tpcCBhcHBseWluZyB0aGUgdGFyZ2V0IHByb3AvdmFsdWUgZW50cnkgKi9cbiAgU2tpcFRhcmdldFByb3AgPSAwYjEwMCxcblxuICAvKiogSXRlcmF0ZSBvdmVyIGlubmVyIG1hcHMgbWFwIHZhbHVlcyBpbiB0aGUgY29udGV4dCAqL1xuICBSZWN1cnNlSW5uZXJNYXBzID0gMGIxMDAwLFxuXG4gIC8qKiBPbmx5IGNoZWNrIHRvIHNlZSBpZiBhIHZhbHVlIHdhcyBzZXQgc29tZXdoZXJlIGluIGVhY2ggbWFwICovXG4gIENoZWNrVmFsdWVzT25seSA9IDBiMTAwMDAsXG59XG5cbi8qKlxuICogU2ltcGxpZmllZCBgVE5vZGVgIGludGVyZmFjZSBmb3Igc3R5bGluZy1yZWxhdGVkIGNvZGUuXG4gKlxuICogVGhlIHN0eWxpbmcgYWxnb3JpdGhtIGNvZGUgb25seSBuZWVkcyBhY2Nlc3MgdG8gYGZsYWdzYC5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBUU3R5bGluZ05vZGUgeyBmbGFnczogVE5vZGVGbGFnczsgfVxuIl19