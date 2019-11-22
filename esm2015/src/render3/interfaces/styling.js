/**
 * @fileoverview added by tsickle
 * Generated from: packages/core/src/render3/interfaces/styling.ts
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3R5bGluZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaW50ZXJmYWNlcy9zdHlsaW5nLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFxVUEscUNBT0M7Ozs7Ozs7O0FBS0QsTUFBa0Isb0JBQW9CO0lBQ3BDLG9CQUFvQixHQUFJO0lBQ3hCLDJCQUEyQixHQUFJO0lBQy9CLG1CQUFtQixHQUFJO0lBRXZCLGtDQUFrQztJQUNsQyxvRkFBb0Y7SUFDcEYsWUFBWSxHQUFJO0lBQ2hCLHNCQUFzQixHQUFJO0lBQzFCLDBCQUEwQixHQUFJO0lBQzlCLFVBQVUsR0FBSTtJQUNkLG1CQUFtQixHQUFJO0VBQ3hCOzs7QUFLRCxNQUFrQiw4QkFBOEI7SUFDOUMsT0FBTyxHQUFNO0lBQ2Isb0JBQW9CLEdBQU07SUFDMUIsU0FBUyxHQUFJO0lBQ2IsSUFBSSxHQUFNO0VBQ1g7Ozs7OztBQUtELG9DQUdDOzs7Ozs7Ozs7Ozs7QUFzQkQscUNBS0M7Ozs7OztBQUtELE1BQWtCLG9CQUFvQjtJQUNwQywwQ0FBMEM7SUFDMUMsbUJBQW1CLEdBQUk7SUFFdkIsNkZBQTZGO0lBQzdGLGdCQUFnQixHQUFJO0lBRXBCLDRDQUE0QztJQUM1QyxTQUFTLEdBQUk7SUFFYixxREFBcUQ7SUFDckQsVUFBVSxHQUFJO0lBRWQsa0RBQWtEO0lBQ2xELFdBQVcsR0FBSTtFQUNoQjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBdUJELHVDQUtDOztBQUtELE1BQWtCLG1CQUFtQjtJQUNuQyx1RUFBdUU7SUFDdkUsY0FBYyxHQUFRO0lBRXRCLDBEQUEwRDtJQUMxRCxjQUFjLEdBQVE7SUFFdEIsNkNBQTZDO0lBQzdDLGVBQWUsR0FBUTtJQUV2QixnREFBZ0Q7SUFDaEQsY0FBYyxHQUFRO0lBRXRCLHdEQUF3RDtJQUN4RCxnQkFBZ0IsR0FBUztJQUV6QixpRUFBaUU7SUFDakUsZUFBZSxJQUFVO0VBQzFCOzs7Ozs7OztBQU9ELGtDQUFvRDs7O0lBQXBCLDZCQUFrQiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuKiBAbGljZW5zZVxuKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbipcbiogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuKi9cbmltcG9ydCB7U3R5bGVTYW5pdGl6ZUZufSBmcm9tICcuLi8uLi9zYW5pdGl6YXRpb24vc3R5bGVfc2FuaXRpemVyJztcblxuaW1wb3J0IHtUTm9kZUZsYWdzfSBmcm9tICcuL25vZGUnO1xuaW1wb3J0IHtQcm9jZWR1cmFsUmVuZGVyZXIzLCBSRWxlbWVudCwgUmVuZGVyZXIzfSBmcm9tICcuL3JlbmRlcmVyJztcbmltcG9ydCB7TFZpZXd9IGZyb20gJy4vdmlldyc7XG5cblxuLyoqXG4gKiAtLS0tLS0tLVxuICpcbiAqIFRoaXMgZmlsZSBjb250YWlucyB0aGUgY29yZSBpbnRlcmZhY2VzIGZvciBzdHlsaW5nIGluIEFuZ3VsYXIuXG4gKlxuICogVG8gbGVhcm4gbW9yZSBhYm91dCB0aGUgYWxnb3JpdGhtIHNlZSBgVFN0eWxpbmdDb250ZXh0YC5cbiAqXG4gKiAtLS0tLS0tLVxuICovXG5cbi8qKlxuICogQSBzdGF0aWMtbGV2ZWwgcmVwcmVzZW50YXRpb24gb2YgYWxsIHN0eWxlIG9yIGNsYXNzIGJpbmRpbmdzL3ZhbHVlc1xuICogYXNzb2NpYXRlZCB3aXRoIGEgYFROb2RlYC5cbiAqXG4gKiBUaGUgYFRTdHlsaW5nQ29udGV4dGAgdW5pdGVzIGFsbCB0ZW1wbGF0ZSBzdHlsaW5nIGJpbmRpbmdzIChpLmUuXG4gKiBgW2NsYXNzXWAgYW5kIGBbc3R5bGVdYCBiaW5kaW5ncykgYXMgd2VsbCBhcyBhbGwgaG9zdC1sZXZlbFxuICogc3R5bGluZyBiaW5kaW5ncyAoZm9yIGNvbXBvbmVudHMgYW5kIGRpcmVjdGl2ZXMpIHRvZ2V0aGVyIGludG9cbiAqIGEgc2luZ2xlIG1hbmlmZXN0XG4gKlxuICogVGhlIHN0eWxpbmcgY29udGV4dCBpcyBzdG9yZWQgb24gYSBgVE5vZGVgIG9uIGFuZCB0aGVyZSBhcmVcbiAqIHR3byBpbnN0YW5jZXMgb2YgaXQ6IG9uZSBmb3IgY2xhc3NlcyBhbmQgYW5vdGhlciBmb3Igc3R5bGVzLlxuICpcbiAqIGBgYHR5cGVzY3JpcHRcbiAqIHROb2RlLnN0eWxlcyA9IFsgLi4uIGEgY29udGV4dCBvbmx5IGZvciBzdHlsZXMgLi4uIF07XG4gKiB0Tm9kZS5jbGFzc2VzID0gWyAuLi4gYSBjb250ZXh0IG9ubHkgZm9yIGNsYXNzZXMgLi4uIF07XG4gKiBgYGBcbiAqXG4gKiBUaGUgc3R5bGluZyBjb250ZXh0IGlzIGNyZWF0ZWQgZWFjaCB0aW1lIHRoZXJlIGFyZSBvbmUgb3IgbW9yZVxuICogc3R5bGluZyBiaW5kaW5ncyAoc3R5bGUgb3IgY2xhc3MgYmluZGluZ3MpIHByZXNlbnQgZm9yIGFuIGVsZW1lbnQsXG4gKiBidXQgaXMgb25seSBjcmVhdGVkIG9uY2UgcGVyIGBUTm9kZWAuXG4gKlxuICogYHROb2RlLnN0eWxlc2AgYW5kIGB0Tm9kZS5jbGFzc2VzYCBjYW4gYmUgYW4gaW5zdGFuY2Ugb2YgdGhlIGZvbGxvd2luZzpcbiAqXG4gKiBgYGB0eXBlc2NyaXB0XG4gKiB0Tm9kZS5zdHlsZXMgPSBudWxsOyAvLyBubyBzdGF0aWMgc3R5bGluZyBvciBzdHlsaW5nIGJpbmRpbmdzIGFjdGl2ZVxuICogdE5vZGUuc3R5bGVzID0gU3R5bGluZ01hcEFycmF5OyAvLyBvbmx5IHN0YXRpYyB2YWx1ZXMgcHJlc2VudCAoZS5nLiBgPGRpdiBzdHlsZT1cIndpZHRoOjIwMFwiPmApXG4gKiB0Tm9kZS5zdHlsZXMgPSBUU3R5bGluZ0NvbnRleHQ7IC8vIG9uZSBvciBtb3JlIHN0eWxpbmcgYmluZGluZ3MgcHJlc2VudCAoZS5nLiBgPGRpdlxuICogW3N0eWxlLndpZHRoXT5gKVxuICogYGBgXG4gKlxuICogQm90aCBgdE5vZGUuc3R5bGVzYCBhbmQgYHROb2RlLmNsYXNzZXNgIGFyZSBpbnN0YW50aWF0ZWQgd2hlbiBhbnl0aGluZ1xuICogc3R5bGluZy1yZWxhdGVkIGlzIGFjdGl2ZSBvbiBhbiBlbGVtZW50LiBUaGV5IGFyZSBmaXJzdCBjcmVhdGVkIGZyb21cbiAqIGZyb20gdGhlIGFueSBvZiB0aGUgZWxlbWVudC1sZXZlbCBpbnN0cnVjdGlvbnMgKGUuZy4gYGVsZW1lbnRgLFxuICogYGVsZW1lbnRTdGFydGAsIGBlbGVtZW50SG9zdEF0dHJzYCkuIFdoZW4gYW55IHN0YXRpYyBzdHlsZS9jbGFzc1xuICogdmFsdWVzIGFyZSBlbmNvdW50ZXJlZCB0aGV5IGFyZSByZWdpc3RlcmVkIG9uIHRoZSBgdE5vZGUuc3R5bGVzYFxuICogYW5kIGB0Tm9kZS5jbGFzc2VzYCBkYXRhLXN0cnVjdHVyZXMuIEJ5IGRlZmF1bHQgKHdoZW4gYW55IHN0YXRpY1xuICogdmFsdWVzIGFyZSBlbmNvdW50ZXJlZCkgdGhlIGB0Tm9kZS5zdHlsZXNgIG9yIGB0Tm9kZS5jbGFzc2VzYCB2YWx1ZXNcbiAqIGFyZSBpbnN0YW5jZXMgb2YgYSBgU3R5bGluZ01hcEFycmF5YC4gT25seSB3aGVuIHN0eWxlL2NsYXNzIGJpbmRpbmdzXG4gKiBhcmUgZGV0ZWN0ZWQgdGhlbiB0aGF0IHN0eWxpbmcgbWFwIGlzIGNvbnZlcnRlZCBpbnRvIGFuIGluc3RhbmNlIG9mXG4gKiBgVFN0eWxpbmdDb250ZXh0YC5cbiAqXG4gKiBEdWUgdG8gdGhlIGZhY3QgdGhlIHRoZSBgVFN0eWxpbmdDb250ZXh0YCBpcyBzdG9yZWQgb24gYSBgVE5vZGVgXG4gKiB0aGlzIG1lYW5zIHRoYXQgYWxsIGRhdGEgd2l0aGluIHRoZSBjb250ZXh0IGlzIHN0YXRpYy4gSW5zdGVhZCBvZlxuICogc3RvcmluZyBhY3R1YWwgc3R5bGluZyBiaW5kaW5nIHZhbHVlcywgdGhlIGxWaWV3IGJpbmRpbmcgaW5kZXggdmFsdWVzXG4gKiBhcmUgc3RvcmVkIHdpdGhpbiB0aGUgY29udGV4dC4gKHN0YXRpYyBuYXR1cmUgbWVhbnMgaXQgaXMgbW9yZSBjb21wYWN0LilcbiAqXG4gKiBUaGUgY29kZSBiZWxvdyBzaG93cyBhIGJyZWFrZG93biBvZiB0d28gaW5zdGFuY2VzIG9mIGBUU3R5bGluZ0NvbnRleHRgXG4gKiAob25lIGZvciBgdE5vZGUuc3R5bGVzYCBhbmQgYW5vdGhlciBmb3IgYHROb2RlLmNsYXNzZXNgKTpcbiAqXG4gKiBgYGB0eXBlc2NyaXB0XG4gKiAvLyA8ZGl2IFtjbGFzcy5hY3RpdmVdPVwiY1wiICAvLyBsVmlldyBiaW5kaW5nIGluZGV4ID0gMjBcbiAqIC8vICAgICAgW3N0eWxlLndpZHRoXT1cInhcIiAgIC8vIGxWaWV3IGJpbmRpbmcgaW5kZXggPSAyMVxuICogLy8gICAgICBbc3R5bGUuaGVpZ2h0XT1cInlcIj4gLy8gbFZpZXcgYmluZGluZyBpbmRleCA9IDIyXG4gKiAvLyAgLi4uXG4gKiAvLyA8L2Rpdj5cbiAqIHROb2RlLnN0eWxlcyA9IFtcbiAqICAgMSwgICAgICAgICAvLyB0aGUgdG90YWwgYW1vdW50IG9mIHNvdXJjZXMgcHJlc2VudCAob25seSBgMWAgYi9jIHRoZXJlIGFyZSBvbmx5IHRlbXBsYXRlXG4gKiBiaW5kaW5ncylcbiAqICAgW251bGxdLCAgICAvLyBpbml0aWFsIHZhbHVlcyBhcnJheSAoYW4gaW5zdGFuY2Ugb2YgYFN0eWxpbmdNYXBBcnJheWApXG4gKlxuICogICAwLCAgICAgICAgIC8vIGNvbmZpZyBlbnRyeSBmb3IgdGhlIHByb3BlcnR5IChzZWUgYFRTdHlsaW5nQ29udGV4dFByb3BDb25maWdGbGFnc2ApXG4gKiAgIDBiMDEwLCAgICAgLy8gdGVtcGxhdGUgZ3VhcmQgbWFzayBmb3IgaGVpZ2h0XG4gKiAgIDAsICAgICAgICAgLy8gaG9zdCBiaW5kaW5ncyBndWFyZCBtYXNrIGZvciBoZWlnaHRcbiAqICAgJ2hlaWdodCcsICAvLyB0aGUgcHJvcGVydHkgbmFtZVxuICogICAyMiwgICAgICAgIC8vIHRoZSBiaW5kaW5nIGxvY2F0aW9uIGZvciB0aGUgXCJ5XCIgYmluZGluZyBpbiB0aGUgbFZpZXdcbiAqICAgbnVsbCwgICAgICAvLyB0aGUgZGVmYXVsdCB2YWx1ZSBmb3IgaGVpZ2h0XG4gKlxuICogICAwLCAgICAgICAgIC8vIGNvbmZpZyBlbnRyeSBmb3IgdGhlIHByb3BlcnR5IChzZWUgYFRTdHlsaW5nQ29udGV4dFByb3BDb25maWdGbGFnc2ApXG4gKiAgIDBiMDAxLCAgICAgLy8gdGVtcGxhdGUgZ3VhcmQgbWFzayBmb3Igd2lkdGhcbiAqICAgMCwgICAgICAgICAvLyBob3N0IGJpbmRpbmdzIGd1YXJkIG1hc2sgZm9yIHdpZHRoXG4gKiAgICd3aWR0aCcsICAgLy8gdGhlIHByb3BlcnR5IG5hbWVcbiAqICAgMjEsICAgICAgICAvLyB0aGUgYmluZGluZyBsb2NhdGlvbiBmb3IgdGhlIFwieFwiIGJpbmRpbmcgaW4gdGhlIGxWaWV3XG4gKiAgIG51bGwsICAgICAgLy8gdGhlIGRlZmF1bHQgdmFsdWUgZm9yIHdpZHRoXG4gKiBdO1xuICpcbiAqIHROb2RlLmNsYXNzZXMgPSBbXG4gKiAgIDAsICAgICAgICAgLy8gdGhlIGNvbnRleHQgY29uZmlnIHZhbHVlIChzZWUgYFRTdHlsaW5nQ29udGV4dENvbmZpZ2ApXG4gKiAgIDEsICAgICAgICAgLy8gdGhlIHRvdGFsIGFtb3VudCBvZiBzb3VyY2VzIHByZXNlbnQgKG9ubHkgYDFgIGIvYyB0aGVyZSBhcmUgb25seSB0ZW1wbGF0ZVxuICogYmluZGluZ3MpXG4gKiAgIFtudWxsXSwgICAgLy8gaW5pdGlhbCB2YWx1ZXMgYXJyYXkgKGFuIGluc3RhbmNlIG9mIGBTdHlsaW5nTWFwQXJyYXlgKVxuICpcbiAqICAgMCwgICAgICAgICAvLyBjb25maWcgZW50cnkgZm9yIHRoZSBwcm9wZXJ0eSAoc2VlIGBUU3R5bGluZ0NvbnRleHRQcm9wQ29uZmlnRmxhZ3NgKVxuICogICAwYjAwMSwgICAgIC8vIHRlbXBsYXRlIGd1YXJkIG1hc2sgZm9yIHdpZHRoXG4gKiAgIDAsICAgICAgICAgLy8gaG9zdCBiaW5kaW5ncyBndWFyZCBtYXNrIGZvciB3aWR0aFxuICogICAnYWN0aXZlJywgIC8vIHRoZSBwcm9wZXJ0eSBuYW1lXG4gKiAgIDIwLCAgICAgICAgLy8gdGhlIGJpbmRpbmcgbG9jYXRpb24gZm9yIHRoZSBcImNcIiBiaW5kaW5nIGluIHRoZSBsVmlld1xuICogICBudWxsLCAgICAgIC8vIHRoZSBkZWZhdWx0IHZhbHVlIGZvciB0aGUgYGFjdGl2ZWAgY2xhc3NcbiAqIF07XG4gKiBgYGBcbiAqXG4gKiBFbnRyeSB2YWx1ZSBwcmVzZW50IGluIGFuIGVudHJ5IChjYWxsZWQgYSB0dXBsZSkgd2l0aGluIHRoZVxuICogc3R5bGluZyBjb250ZXh0IGlzIGFzIGZvbGxvd3M6XG4gKlxuICogYGBgdHlwZXNjcmlwdFxuICogY29udGV4dCA9IFtcbiAqICAgLy8uLi5cbiAqICAgY29uZmlnVmFsdWUsXG4gKiAgIHRlbXBsYXRlR3VhcmRNYXNrLFxuICogICBob3N0QmluZGluZ3NHdWFyZE1hc2ssXG4gKiAgIHByb3BOYW1lLFxuICogICAuLi5iaW5kaW5nSW5kaWNlcy4uLixcbiAqICAgZGVmYXVsdFZhbHVlXG4gKiAgIC8vLi4uXG4gKiBdO1xuICogYGBgXG4gKlxuICogQmVsb3cgaXMgYSBicmVha2Rvd24gb2YgZWFjaCB2YWx1ZTpcbiAqXG4gKiAtICoqY29uZmlnVmFsdWUqKjpcbiAqICAgUHJvcGVydHktc3BlY2lmaWMgY29uZmlndXJhdGlvbiB2YWx1ZXMuIFRoZSBvbmx5IGNvbmZpZyBzZXR0aW5nXG4gKiAgIHRoYXQgaXMgaW1wbGVtZW50ZWQgcmlnaHQgbm93IGlzIHdoZXRoZXIgb3Igbm90IHRvIHNhbml0aXplIHRoZVxuICogICB2YWx1ZS5cbiAqXG4gKiAtICoqdGVtcGxhdGVHdWFyZE1hc2sqKjpcbiAqICAgQSBudW1lcmljIHZhbHVlIHdoZXJlIGVhY2ggYml0IHJlcHJlc2VudHMgYSBiaW5kaW5nIGluZGV4XG4gKiAgIGxvY2F0aW9uLiBFYWNoIGJpbmRpbmcgaW5kZXggbG9jYXRpb24gaXMgYXNzaWduZWQgYmFzZWQgb25cbiAqICAgYSBsb2NhbCBjb3VudGVyIHZhbHVlIHRoYXQgaW5jcmVtZW50cyBlYWNoIHRpbWUgYW4gaW5zdHJ1Y3Rpb25cbiAqICAgaXMgY2FsbGVkOlxuICpcbiAqIGBgYFxuICogPGRpdiBbc3R5bGUud2lkdGhdPVwieFwiICAgLy8gYmluZGluZyBpbmRleCA9IDIxIChjb3VudGVyIGluZGV4ID0gMClcbiAqICAgICAgW3N0eWxlLmhlaWdodF09XCJ5XCI+IC8vIGJpbmRpbmcgaW5kZXggPSAyMiAoY291bnRlciBpbmRleCA9IDEpXG4gKiBgYGBcbiAqXG4gKiAgIEluIHRoZSBleGFtcGxlIGNvZGUgYWJvdmUsIGlmIHRoZSBgd2lkdGhgIHZhbHVlIHdoZXJlIHRvIGNoYW5nZVxuICogICB0aGVuIHRoZSBmaXJzdCBiaXQgaW4gdGhlIGxvY2FsIGJpdCBtYXNrIHZhbHVlIHdvdWxkIGJlIGZsaXBwZWRcbiAqICAgKGFuZCB0aGUgc2Vjb25kIGJpdCBmb3Igd2hlbiBgaGVpZ2h0YCkuXG4gKlxuICogICBJZiBhbmQgd2hlbiB0aGVyZSBhcmUgbW9yZSB0aGFuIDMyIGJpbmRpbmcgc291cmNlcyBpbiB0aGUgY29udGV4dFxuICogICAobW9yZSB0aGFuIDMyIGBbc3R5bGUvY2xhc3NdYCBiaW5kaW5ncykgdGhlbiB0aGUgYml0IG1hc2tpbmcgd2lsbFxuICogICBvdmVyZmxvdyBhbmQgd2UgYXJlIGxlZnQgd2l0aCBhIHNpdHVhdGlvbiB3aGVyZSBhIGAtMWAgdmFsdWUgd2lsbFxuICogICByZXByZXNlbnQgdGhlIGJpdCBtYXNrLiBEdWUgdG8gdGhlIHdheSB0aGF0IEphdmFTY3JpcHQgaGFuZGxlc1xuICogICBuZWdhdGl2ZSB2YWx1ZXMsIHdoZW4gdGhlIGJpdCBtYXNrIGlzIGAtMWAgdGhlbiBhbGwgYml0cyB3aXRoaW5cbiAqICAgdGhhdCB2YWx1ZSB3aWxsIGJlIGF1dG9tYXRpY2FsbHkgZmxpcHBlZCAodGhpcyBpcyBhIHF1aWNrIGFuZFxuICogICBlZmZpY2llbnQgd2F5IHRvIGZsaXAgYWxsIGJpdHMgb24gdGhlIG1hc2sgd2hlbiBhIHNwZWNpYWwga2luZFxuICogICBvZiBjYWNoaW5nIHNjZW5hcmlvIG9jY3VycyBvciB3aGVuIHRoZXJlIGFyZSBtb3JlIHRoYW4gMzIgYmluZGluZ3MpLlxuICpcbiAqIC0gKipob3N0QmluZGluZ3NHdWFyZE1hc2sqKjpcbiAqICAgQW5vdGhlciBpbnN0YW5jZSBvZiBhIGd1YXJkIG1hc2sgdGhhdCBpcyBzcGVjaWZpYyB0byBob3N0IGJpbmRpbmdzLlxuICogICBUaGlzIGJlaGF2ZXMgZXhhY3RseSB0aGUgc2FtZSB3YXkgYXMgZG9lcyB0aGUgYHRlbXBsYXRlR3VhcmRNYXNrYCxcbiAqICAgYnV0IHdpbGwgbm90IGNvbnRhaW4gYW55IGJpbmRpbmcgaW5mb3JtYXRpb24gcHJvY2Vzc2VkIGluIHRoZSB0ZW1wbGF0ZS5cbiAqICAgVGhlIHJlYXNvbiB3aHkgdGhlcmUgYXJlIHR3byBpbnN0YW5jZXMgb2YgZ3VhcmQgbWFza3MgKG9uZSBmb3IgdGhlXG4gKiAgIHRlbXBsYXRlIGFuZCBhbm90aGVyIGZvciBob3N0IGJpbmRpbmdzKSBpcyBiZWNhdXNlIHRoZSB0ZW1wbGF0ZSBiaW5kaW5nc1xuICogICBhcmUgcHJvY2Vzc2VkIGJlZm9yZSBob3N0IGJpbmRpbmdzIGFuZCB0aGUgc3RhdGUgaW5mb3JtYXRpb24gaXMgbm90XG4gKiAgIGNhcnJpZWQgb3ZlciBpbnRvIHRoZSBob3N0IGJpbmRpbmdzIGNvZGUuIEFzIHNvb24gYXMgaG9zdCBiaW5kaW5ncyBhcmVcbiAqICAgcHJvY2Vzc2VkIGZvciBhbiBlbGVtZW50IHRoZSBjb3VudGVyIGFuZCBzdGF0ZS1iYXNlZCBiaXQgbWFzayB2YWx1ZXMgYXJlXG4gKiAgIHNldCB0byBgMGAuXG4gKlxuICogYGBgXG4gKiA8ZGl2IFtzdHlsZS53aWR0aF09XCJ4XCIgICAvLyBiaW5kaW5nIGluZGV4ID0gMjEgKGNvdW50ZXIgaW5kZXggPSAwKVxuICogICAgICBbc3R5bGUuaGVpZ2h0XT1cInlcIiAgLy8gYmluZGluZyBpbmRleCA9IDIyIChjb3VudGVyIGluZGV4ID0gMSlcbiAqICAgICAgZGlyLXRoYXQtc2V0cy13aWR0aCAgLy8gYmluZGluZyBpbmRleCA9IDMwIChjb3VudGVyIGluZGV4ID0gMClcbiAqICAgICAgZGlyLXRoYXQtc2V0cy13aWR0aD4gLy8gYmluZGluZyBpbmRleCA9IDMxIChjb3VudGVyIGluZGV4ID0gMSlcbiAqIGBgYFxuICpcbiAqIC0gKipwcm9wTmFtZSoqOlxuICogICBUaGUgQ1NTIHByb3BlcnR5IG5hbWUgb3IgY2xhc3MgbmFtZSAoZS5nIGB3aWR0aGAgb3IgYGFjdGl2ZWApLlxuICpcbiAqIC0gKipiaW5kaW5nSW5kaWNlcy4uLioqOlxuICogICBBIHNlcmllcyBvZiBudW1lcmljIGJpbmRpbmcgdmFsdWVzIHRoYXQgcmVmbGVjdCB3aGVyZSBpbiB0aGVcbiAqICAgbFZpZXcgdG8gZmluZCB0aGUgc3R5bGUvY2xhc3MgdmFsdWVzIGFzc29jaWF0ZWQgd2l0aCB0aGUgcHJvcGVydHkuXG4gKiAgIEVhY2ggdmFsdWUgaXMgaW4gb3JkZXIgaW4gdGVybXMgb2YgcHJpb3JpdHkgKHRlbXBsYXRlcyBhcmUgZmlyc3QsXG4gKiAgIHRoZW4gZGlyZWN0aXZlcyBhbmQgdGhlbiBjb21wb25lbnRzKS4gV2hlbiB0aGUgY29udGV4dCBpcyBmbHVzaGVkXG4gKiAgIGFuZCB0aGUgc3R5bGUvY2xhc3MgdmFsdWVzIGFyZSBhcHBsaWVkIHRvIHRoZSBlbGVtZW50ICh0aGlzIGhhcHBlbnNcbiAqICAgaW5zaWRlIG9mIHRoZSBgc3R5bGluZ0FwcGx5YCBpbnN0cnVjdGlvbikgdGhlbiB0aGUgZmx1c2hpbmcgY29kZVxuICogICB3aWxsIGtlZXAgY2hlY2tpbmcgZWFjaCBiaW5kaW5nIGluZGV4IGFnYWluc3QgdGhlIGFzc29jaWF0ZWQgbFZpZXdcbiAqICAgdG8gZmluZCB0aGUgZmlyc3Qgc3R5bGUvY2xhc3MgdmFsdWUgdGhhdCBpcyBub24tbnVsbC5cbiAqXG4gKiAtICoqZGVmYXVsdFZhbHVlKio6XG4gKiAgIFRoaXMgaXMgdGhlIGRlZmF1bHQgdGhhdCB3aWxsIGFsd2F5cyBiZSBhcHBsaWVkIHRvIHRoZSBlbGVtZW50IGlmXG4gKiAgIGFuZCB3aGVuIGFsbCBvdGhlciBiaW5kaW5nIHNvdXJjZXMgcmV0dXJuIGEgcmVzdWx0IHRoYXQgaXMgbnVsbC5cbiAqICAgVXN1YWxseSB0aGlzIHZhbHVlIGlzIGBudWxsYCBidXQgaXQgY2FuIGFsc28gYmUgYSBzdGF0aWMgdmFsdWUgdGhhdFxuICogICBpcyBpbnRlcmNlcHRlZCB3aGVuIHRoZSB0Tm9kZSBpcyBmaXJzdCBjb25zdHJ1Y3R1cmVkIChlLmcuXG4gKiAgIGA8ZGl2IHN0eWxlPVwid2lkdGg6MjAwcHhcIj5gIGhhcyBhIGRlZmF1bHQgdmFsdWUgb2YgYDIwMHB4YCBmb3JcbiAqICAgdGhlIGB3aWR0aGAgcHJvcGVydHkpLlxuICpcbiAqIEVhY2ggdGltZSBhIG5ldyBiaW5kaW5nIGlzIGVuY291bnRlcmVkIGl0IGlzIHJlZ2lzdGVyZWQgaW50byB0aGVcbiAqIGNvbnRleHQuIFRoZSBjb250ZXh0IHRoZW4gaXMgY29udGludWFsbHkgdXBkYXRlZCB1bnRpbCB0aGUgZmlyc3RcbiAqIHN0eWxpbmcgYXBwbHkgY2FsbCBoYXMgYmVlbiBjYWxsZWQgKHdoaWNoIGlzIGF1dG9tYXRpY2FsbHkgc2NoZWR1bGVkXG4gKiB0byBiZSBjYWxsZWQgb25jZSBhbiBlbGVtZW50IGV4aXRzIGR1cmluZyBjaGFuZ2UgZGV0ZWN0aW9uKS4gTm90ZSB0aGF0XG4gKiBlYWNoIGVudHJ5IGluIHRoZSBjb250ZXh0IGlzIHN0b3JlZCBpbiBhbHBoYWJldGljYWwgb3JkZXIuXG4gKlxuICogT25jZSBzdHlsaW5nIGhhcyBiZWVuIGZsdXNoZWQgZm9yIHRoZSBmaXJzdCB0aW1lIGZvciBhbiBlbGVtZW50IHRoZVxuICogY29udGV4dCB3aWxsIHNldCBhcyBsb2NrZWQgKHRoaXMgcHJldmVudHMgYmluZGluZ3MgZnJvbSBiZWluZyBhZGRlZFxuICogdG8gdGhlIGNvbnRleHQgbGF0ZXIgb24pLlxuICpcbiAqICMgSG93IFN0eWxlcy9DbGFzc2VzIGFyZSBSZW5kZXJlZFxuICogRWFjaCB0aW1lIGEgc3R5bGluZyBpbnN0cnVjdGlvbiAoZS5nLiBgW2NsYXNzLm5hbWVdYCwgYFtzdHlsZS5wcm9wXWAsXG4gKiBldGMuLi4pIGlzIGV4ZWN1dGVkLCB0aGUgYXNzb2NpYXRlZCBgbFZpZXdgIGZvciB0aGUgdmlldyBpcyB1cGRhdGVkXG4gKiBhdCB0aGUgY3VycmVudCBiaW5kaW5nIGxvY2F0aW9uLiBBbHNvLCB3aGVuIHRoaXMgaGFwcGVucywgYSBsb2NhbFxuICogY291bnRlciB2YWx1ZSBpcyBpbmNyZW1lbnRlZC4gSWYgdGhlIGJpbmRpbmcgdmFsdWUgaGFzIGNoYW5nZWQgdGhlblxuICogYSBsb2NhbCBgYml0TWFza2AgdmFyaWFibGUgaXMgdXBkYXRlZCB3aXRoIHRoZSBzcGVjaWZpYyBiaXQgYmFzZWRcbiAqIG9uIHRoZSBjb3VudGVyIHZhbHVlLlxuICpcbiAqIEJlbG93IGlzIGEgbGlnaHR3ZWlnaHQgZXhhbXBsZSBvZiB3aGF0IGhhcHBlbnMgd2hlbiBhIHNpbmdsZSBzdHlsZVxuICogcHJvcGVydHkgaXMgdXBkYXRlZCAoaS5lLiBgPGRpdiBbc3R5bGUucHJvcF09XCJ2YWxcIj5gKTpcbiAqXG4gKiBgYGB0eXBlc2NyaXB0XG4gKiBmdW5jdGlvbiB1cGRhdGVTdHlsZVByb3AocHJvcDogc3RyaW5nLCB2YWx1ZTogc3RyaW5nKSB7XG4gKiAgIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAqICAgY29uc3QgYmluZGluZ0luZGV4ID0gQklORElOR19JTkRFWCsrO1xuICpcbiAqICAgLy8gdXBkYXRlIHRoZSBsb2NhbCBjb3VudGVyIHZhbHVlXG4gKiAgIGNvbnN0IGluZGV4Rm9yU3R5bGUgPSBzdHlsaW5nU3RhdGUuc3R5bGVzQ291bnQrKztcbiAqICAgaWYgKGxWaWV3W2JpbmRpbmdJbmRleF0gIT09IHZhbHVlKSB7XG4gKiAgICAgbFZpZXdbYmluZGluZ0luZGV4XSA9IHZhbHVlO1xuICpcbiAqICAgICAvLyB0ZWxsIHRoZSBsb2NhbCBzdGF0ZSB0aGF0IHdlIGhhdmUgdXBkYXRlZCBhIHN0eWxlIHZhbHVlXG4gKiAgICAgLy8gYnkgdXBkYXRpbmcgdGhlIGJpdCBtYXNrXG4gKiAgICAgc3R5bGluZ1N0YXRlLmJpdE1hc2tGb3JTdHlsZXMgfD0gMSA8PCBpbmRleEZvclN0eWxlO1xuICogICB9XG4gKiB9XG4gKiBgYGBcbiAqXG4gKiBPbmNlIGFsbCB0aGUgYmluZGluZ3MgaGF2ZSB1cGRhdGVkIGEgYGJpdE1hc2tgIHZhbHVlIHdpbGwgYmUgcG9wdWxhdGVkLlxuICogVGhpcyBgYml0TWFza2AgdmFsdWUgaXMgdXNlZCBpbiB0aGUgYXBwbHkgYWxnb3JpdGhtICh3aGljaCBpcyBjYWxsZWRcbiAqIGNvbnRleHQgcmVzb2x1dGlvbikuXG4gKlxuICogIyMgVGhlIEFwcGx5IEFsZ29yaXRobSAoQ29udGV4dCBSZXNvbHV0aW9uKVxuICogQXMgZXhwbGFpbmVkIGFib3ZlLCBlYWNoIHRpbWUgYSBiaW5kaW5nIHVwZGF0ZXMgaXRzIHZhbHVlLCB0aGUgcmVzdWx0aW5nXG4gKiB2YWx1ZSBpcyBzdG9yZWQgaW4gdGhlIGBsVmlld2AgYXJyYXkuIFRoZXNlIHN0eWxpbmcgdmFsdWVzIGhhdmUgeWV0IHRvXG4gKiBiZSBmbHVzaGVkIHRvIHRoZSBlbGVtZW50LlxuICpcbiAqIE9uY2UgYWxsIHRoZSBzdHlsaW5nIGluc3RydWN0aW9ucyBoYXZlIGJlZW4gZXZhbHVhdGVkLCB0aGVuIHRoZSBzdHlsaW5nXG4gKiBjb250ZXh0KHMpIGFyZSBmbHVzaGVkIHRvIHRoZSBlbGVtZW50LiBXaGVuIHRoaXMgaGFwcGVucywgdGhlIGNvbnRleHQgd2lsbFxuICogYmUgaXRlcmF0ZWQgb3ZlciAocHJvcGVydHkgYnkgcHJvcGVydHkpIGFuZCBlYWNoIGJpbmRpbmcgc291cmNlIHdpbGwgYmVcbiAqIGV4YW1pbmVkIGFuZCB0aGUgZmlyc3Qgbm9uLW51bGwgdmFsdWUgd2lsbCBiZSBhcHBsaWVkIHRvIHRoZSBlbGVtZW50LlxuICpcbiAqIExldCdzIHNheSB0aGF0IHdlIHRoZSBmb2xsb3dpbmcgdGVtcGxhdGUgY29kZTpcbiAqXG4gKiBgYGBodG1sXG4gKiA8ZGl2IFtzdHlsZS53aWR0aF09XCJ3MVwiIGRpci10aGF0LXNldC13aWR0aD1cIncyXCI+PC9kaXY+XG4gKiBgYGBcbiAqXG4gKiBUaGVyZSBhcmUgdHdvIHN0eWxpbmcgYmluZGluZ3MgaW4gdGhlIGNvZGUgYWJvdmUgYW5kIHRoZXkgYm90aCB3cml0ZVxuICogdG8gdGhlIGB3aWR0aGAgcHJvcGVydHkuIFdoZW4gc3R5bGluZyBpcyBmbHVzaGVkIG9uIHRoZSBlbGVtZW50LCB0aGVcbiAqIGFsZ29yaXRobSB3aWxsIHRyeSBhbmQgZmlndXJlIG91dCB3aGljaCBvbmUgb2YgdGhlc2UgdmFsdWVzIHRvIHdyaXRlXG4gKiB0byB0aGUgZWxlbWVudC5cbiAqXG4gKiBJbiBvcmRlciB0byBmaWd1cmUgb3V0IHdoaWNoIHZhbHVlIHRvIGFwcGx5LCB0aGUgZm9sbG93aW5nXG4gKiBiaW5kaW5nIHByaW9yaXRpemF0aW9uIGlzIGFkaGVyZWQgdG86XG4gKlxuICogICAxLiBGaXJzdCB0ZW1wbGF0ZS1sZXZlbCBzdHlsaW5nIGJpbmRpbmdzIGFyZSBhcHBsaWVkIChpZiBwcmVzZW50KS5cbiAqICAgICAgVGhpcyBpbmNsdWRlcyB0aGluZ3MgbGlrZSBgW3N0eWxlLndpZHRoXWAgYW5kIGBbY2xhc3MuYWN0aXZlXWAuXG4gKlxuICogICAyLiBTZWNvbmQgYXJlIHN0eWxpbmctbGV2ZWwgaG9zdCBiaW5kaW5ncyBwcmVzZW50IGluIGRpcmVjdGl2ZXMuXG4gKiAgICAgIChpZiB0aGVyZSBhcmUgc3ViL3N1cGVyIGRpcmVjdGl2ZXMgcHJlc2VudCB0aGVuIHRoZSBzdWIgZGlyZWN0aXZlc1xuICogICAgICBhcmUgYXBwbGllZCBmaXJzdCkuXG4gKlxuICogICAzLiBUaGlyZCBhcmUgc3R5bGluZy1sZXZlbCBob3N0IGJpbmRpbmdzIHByZXNlbnQgaW4gY29tcG9uZW50cy5cbiAqICAgICAgKGlmIHRoZXJlIGFyZSBzdWIvc3VwZXIgY29tcG9uZW50cyBwcmVzZW50IHRoZW4gdGhlIHN1YiBkaXJlY3RpdmVzXG4gKiAgICAgIGFyZSBhcHBsaWVkIGZpcnN0KS5cbiAqXG4gKiBUaGlzIG1lYW5zIHRoYXQgaW4gdGhlIGNvZGUgYWJvdmUgdGhlIHN0eWxpbmcgYmluZGluZyBwcmVzZW50IGluIHRoZVxuICogdGVtcGxhdGUgaXMgYXBwbGllZCBmaXJzdCBhbmQsIG9ubHkgaWYgaXRzIGZhbHN5LCB0aGVuIHRoZSBkaXJlY3RpdmVcbiAqIHN0eWxpbmcgYmluZGluZyBmb3Igd2lkdGggd2lsbCBiZSBhcHBsaWVkLlxuICpcbiAqICMjIyBXaGF0IGFib3V0IG1hcC1iYXNlZCBzdHlsaW5nIGJpbmRpbmdzP1xuICogTWFwLWJhc2VkIHN0eWxpbmcgYmluZGluZ3MgYXJlIGFjdGl2YXRlZCB3aGVuIHRoZXJlIGFyZSBvbmUgb3IgbW9yZVxuICogYFtzdHlsZV1gIGFuZC9vciBgW2NsYXNzXWAgYmluZGluZ3MgcHJlc2VudCBvbiBhbiBlbGVtZW50LiBXaGVuIHRoaXNcbiAqIGNvZGUgaXMgYWN0aXZhdGVkLCB0aGUgYXBwbHkgYWxnb3JpdGhtIHdpbGwgaXRlcmF0ZSBvdmVyIGVhY2ggbWFwXG4gKiBlbnRyeSBhbmQgYXBwbHkgZWFjaCBzdHlsaW5nIHZhbHVlIHRvIHRoZSBlbGVtZW50IHdpdGggdGhlIHNhbWVcbiAqIHByaW9yaXRpemF0aW9uIHJ1bGVzIGFzIGFib3ZlLlxuICpcbiAqIEZvciB0aGUgYWxnb3JpdGhtIHRvIGFwcGx5IHN0eWxpbmcgdmFsdWVzIGVmZmljaWVudGx5LCB0aGVcbiAqIHN0eWxpbmcgbWFwIGVudHJpZXMgbXVzdCBiZSBhcHBsaWVkIGluIHN5bmMgKHByb3BlcnR5IGJ5IHByb3BlcnR5KVxuICogd2l0aCBwcm9wLWJhc2VkIGJpbmRpbmdzLiAoVGhlIG1hcC1iYXNlZCBhbGdvcml0aG0gaXMgZGVzY3JpYmVkXG4gKiBtb3JlIGluc2lkZSBvZiB0aGUgYHJlbmRlcjMvc3R5bGluZy9tYXBfYmFzZWRfYmluZGluZ3MudHNgIGZpbGUuKVxuICpcbiAqICMjIFNhbml0aXphdGlvblxuICogU2FuaXRpemF0aW9uIGlzIHVzZWQgdG8gcHJldmVudCBpbnZhbGlkIHN0eWxlIHZhbHVlcyBmcm9tIGJlaW5nIGFwcGxpZWQgdG9cbiAqIHRoZSBlbGVtZW50LlxuICpcbiAqIEl0IGlzIGVuYWJsZWQgaW4gdHdvIGNhc2VzOlxuICpcbiAqICAgMS4gVGhlIGBzdHlsZVNhbml0aXplcihzYW5pdGl6ZXJGbilgIGluc3RydWN0aW9uIHdhcyBjYWxsZWQgKGp1c3QgYmVmb3JlIGFueSBvdGhlclxuICogICAgICBzdHlsaW5nIGluc3RydWN0aW9ucyBhcmUgcnVuKS5cbiAqXG4gKiAgIDIuIFRoZSBjb21wb25lbnQvZGlyZWN0aXZlIGBMVmlld2AgaW5zdGFuY2UgaGFzIGEgc2FuaXRpemVyIG9iamVjdCBhdHRhY2hlZCB0byBpdFxuICogICAgICAodGhpcyBoYXBwZW5zIHdoZW4gYHJlbmRlckNvbXBvbmVudGAgaXMgZXhlY3V0ZWQgd2l0aCBhIGBzYW5pdGl6ZXJgIHZhbHVlIG9yXG4gKiAgICAgIGlmIHRoZSBuZ01vZHVsZSBjb250YWlucyBhIHNhbml0aXplciBwcm92aWRlciBhdHRhY2hlZCB0byBpdCkuXG4gKlxuICogSWYgYW5kIHdoZW4gc2FuaXRpemF0aW9uIGlzIGFjdGl2ZSB0aGVuIGFsbCBwcm9wZXJ0eS92YWx1ZSBlbnRyaWVzIHdpbGwgYmUgZXZhbHVhdGVkXG4gKiB0aHJvdWdoIHRoZSBhY3RpdmUgc2FuaXRpemVyIGJlZm9yZSB0aGV5IGFyZSBhcHBsaWVkIHRvIHRoZSBlbGVtZW50IChvciB0aGUgc3R5bGluZ1xuICogZGVidWcgaGFuZGxlcikuXG4gKlxuICogSWYgYSBgU2FuaXRpemVyYCBvYmplY3QgaXMgdXNlZCAodmlhIHRoZSBgTFZpZXdbU0FOSVRJWkVSXWAgdmFsdWUpIHRoZW4gdGhhdCBvYmplY3RcbiAqIHdpbGwgYmUgdXNlZCBmb3IgZXZlcnkgcHJvcGVydHkuXG4gKlxuICogSWYgYSBgU3R5bGVTYW5pdGl6ZXJGbmAgZnVuY3Rpb24gaXMgdXNlZCAodmlhIHRoZSBgc3R5bGVTYW5pdGl6ZXJgKSB0aGVuIGl0IHdpbGwgYmVcbiAqIGNhbGxlZCBpbiB0d28gd2F5czpcbiAqXG4gKiAgIDEuIHByb3BlcnR5IHZhbGlkYXRpb24gbW9kZTogdGhpcyB3aWxsIGJlIGNhbGxlZCBlYXJseSB0byBtYXJrIHdoZXRoZXIgYSBwcm9wZXJ0eVxuICogICAgICBzaG91bGQgYmUgc2FuaXRpemVkIG9yIG5vdCBhdCBkdXJpbmcgdGhlIGZsdXNoaW5nIHN0YWdlLlxuICpcbiAqICAgMi4gdmFsdWUgc2FuaXRpemF0aW9uIG1vZGU6IHRoaXMgd2lsbCBiZSBjYWxsZWQgZHVyaW5nIHRoZSBmbHVzaGluZyBzdGFnZSBhbmQgd2lsbFxuICogICAgICBydW4gdGhlIHNhbml0aXplciBmdW5jdGlvbiBhZ2FpbnN0IHRoZSB2YWx1ZSBiZWZvcmUgYXBwbHlpbmcgaXQgdG8gdGhlIGVsZW1lbnQuXG4gKlxuICogSWYgc2FuaXRpemF0aW9uIHJldHVybnMgYW4gZW1wdHkgdmFsdWUgdGhlbiB0aGF0IGVtcHR5IHZhbHVlIHdpbGwgYmUgYXBwbGllZFxuICogdG8gdGhlIGVsZW1lbnQuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgVFN0eWxpbmdDb250ZXh0IGV4dGVuZHNcbiAgICBBcnJheTxudW1iZXJ8c3RyaW5nfG51bWJlcnxib29sZWFufG51bGx8U3R5bGluZ01hcEFycmF5fHt9PiB7XG4gIC8qKiBUaGUgdG90YWwgYW1vdW50IG9mIHNvdXJjZXMgcHJlc2VudCBpbiB0aGUgY29udGV4dCAqL1xuICBbVFN0eWxpbmdDb250ZXh0SW5kZXguVG90YWxTb3VyY2VzUG9zaXRpb25dOiBudW1iZXI7XG5cbiAgLyoqIEluaXRpYWwgdmFsdWUgcG9zaXRpb24gZm9yIHN0YXRpYyBzdHlsZXMgKi9cbiAgW1RTdHlsaW5nQ29udGV4dEluZGV4LkluaXRpYWxTdHlsaW5nVmFsdWVQb3NpdGlvbl06IFN0eWxpbmdNYXBBcnJheTtcbn1cblxuLyoqXG4gKiBBbiBpbmRleCBvZiBwb3NpdGlvbiBhbmQgb2Zmc2V0IHZhbHVlcyB1c2VkIHRvIG5hdmlnYXRlIHRoZSBgVFN0eWxpbmdDb250ZXh0YC5cbiAqL1xuZXhwb3J0IGNvbnN0IGVudW0gVFN0eWxpbmdDb250ZXh0SW5kZXgge1xuICBUb3RhbFNvdXJjZXNQb3NpdGlvbiA9IDAsXG4gIEluaXRpYWxTdHlsaW5nVmFsdWVQb3NpdGlvbiA9IDEsXG4gIFZhbHVlc1N0YXJ0UG9zaXRpb24gPSAyLFxuXG4gIC8vIGVhY2ggdHVwbGUgZW50cnkgaW4gdGhlIGNvbnRleHRcbiAgLy8gKGNvbmZpZywgdGVtcGxhdGVCaXRHdWFyZCwgaG9zdEJpbmRpbmdCaXRHdWFyZCwgcHJvcCwgLi4uYmluZGluZ3N8fGRlZmF1bHQtdmFsdWUpXG4gIENvbmZpZ09mZnNldCA9IDAsXG4gIFRlbXBsYXRlQml0R3VhcmRPZmZzZXQgPSAxLFxuICBIb3N0QmluZGluZ3NCaXRHdWFyZE9mZnNldCA9IDIsXG4gIFByb3BPZmZzZXQgPSAzLFxuICBCaW5kaW5nc1N0YXJ0T2Zmc2V0ID0gNFxufVxuXG4vKipcbiAqIEEgc2VyaWVzIG9mIGZsYWdzIHVzZWQgZm9yIGVhY2ggcHJvcGVydHkgZW50cnkgd2l0aGluIHRoZSBgVFN0eWxpbmdDb250ZXh0YC5cbiAqL1xuZXhwb3J0IGNvbnN0IGVudW0gVFN0eWxpbmdDb250ZXh0UHJvcENvbmZpZ0ZsYWdzIHtcbiAgRGVmYXVsdCA9IDBiMCxcbiAgU2FuaXRpemF0aW9uUmVxdWlyZWQgPSAwYjEsXG4gIFRvdGFsQml0cyA9IDEsXG4gIE1hc2sgPSAwYjEsXG59XG5cbi8qKlxuICogQSBmdW5jdGlvbiB1c2VkIHRvIGFwcGx5IG9yIHJlbW92ZSBzdHlsaW5nIGZyb20gYW4gZWxlbWVudCBmb3IgYSBnaXZlbiBwcm9wZXJ0eS5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBBcHBseVN0eWxpbmdGbiB7XG4gIChyZW5kZXJlcjogUmVuZGVyZXIzfFByb2NlZHVyYWxSZW5kZXJlcjN8bnVsbCwgZWxlbWVudDogUkVsZW1lbnQsIHByb3A6IHN0cmluZywgdmFsdWU6IGFueSxcbiAgIGJpbmRpbmdJbmRleD86IG51bWJlcnxudWxsKTogdm9pZDtcbn1cblxuLyoqXG4gKiBSdW50aW1lIGRhdGEgdHlwZSB0aGF0IGlzIHVzZWQgdG8gc3RvcmUgYmluZGluZyBkYXRhIHJlZmVyZW5jZWQgZnJvbSB0aGUgYFRTdHlsaW5nQ29udGV4dGAuXG4gKlxuICogQmVjYXVzZSBgTFZpZXdgIGlzIGp1c3QgYW4gYXJyYXkgd2l0aCBkYXRhLCB0aGVyZSBpcyBubyByZWFzb24gdG9cbiAqIHNwZWNpYWwgY2FzZSBgTFZpZXdgIGV2ZXJ5d2hlcmUgaW4gdGhlIHN0eWxpbmcgYWxnb3JpdGhtLiBCeSBhbGxvd2luZ1xuICogdGhpcyBkYXRhIHR5cGUgdG8gYmUgYW4gYXJyYXkgdGhhdCBjb250YWlucyB2YXJpb3VzIHNjYWxhciBkYXRhIHR5cGVzLFxuICogYW4gaW5zdGFuY2Ugb2YgYExWaWV3YCBkb2Vzbid0IG5lZWQgdG8gYmUgY29uc3RydWN0ZWQgZm9yIHRlc3RzLlxuICovXG5leHBvcnQgdHlwZSBMU3R5bGluZ0RhdGEgPSBMVmlldyB8IChzdHJpbmcgfCBudW1iZXIgfCBib29sZWFuIHwgbnVsbClbXTtcblxuLyoqXG4gKiBBcnJheS1iYXNlZCByZXByZXNlbnRhdGlvbiBvZiBhIGtleS92YWx1ZSBhcnJheS5cbiAqXG4gKiBUaGUgZm9ybWF0IG9mIHRoZSBhcnJheSBpcyBcInByb3BlcnR5XCIsIFwidmFsdWVcIiwgXCJwcm9wZXJ0eTJcIixcbiAqIFwidmFsdWUyXCIsIGV0Yy4uLlxuICpcbiAqIFRoZSBmaXJzdCB2YWx1ZSBpbiB0aGUgYXJyYXkgaXMgcmVzZXJ2ZWQgdG8gc3RvcmUgdGhlIGluc3RhbmNlXG4gKiBvZiB0aGUga2V5L3ZhbHVlIGFycmF5IHRoYXQgd2FzIHVzZWQgdG8gcG9wdWxhdGUgdGhlIHByb3BlcnR5L1xuICogdmFsdWUgZW50cmllcyB0aGF0IHRha2UgcGxhY2UgaW4gdGhlIHJlbWFpbmRlciBvZiB0aGUgYXJyYXkuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgU3R5bGluZ01hcEFycmF5IGV4dGVuZHMgQXJyYXk8e318c3RyaW5nfG51bWJlcnxudWxsfHVuZGVmaW5lZD4ge1xuICAvKipcbiAgICogVGhlIGxhc3QgcmF3IHZhbHVlIHVzZWQgdG8gZ2VuZXJhdGUgdGhlIGVudHJpZXMgaW4gdGhlIG1hcC5cbiAgICovXG4gIFtTdHlsaW5nTWFwQXJyYXlJbmRleC5SYXdWYWx1ZVBvc2l0aW9uXToge318c3RyaW5nfG51bWJlcnxudWxsfHVuZGVmaW5lZDtcbn1cblxuLyoqXG4gKiBBbiBpbmRleCBvZiBwb3NpdGlvbiBhbmQgb2Zmc2V0IHBvaW50cyBmb3IgYW55IGRhdGEgc3RvcmVkIHdpdGhpbiBhIGBTdHlsaW5nTWFwQXJyYXlgIGluc3RhbmNlLlxuICovXG5leHBvcnQgY29uc3QgZW51bSBTdHlsaW5nTWFwQXJyYXlJbmRleCB7XG4gIC8qKiBXaGVyZSB0aGUgdmFsdWVzIHN0YXJ0IGluIHRoZSBhcnJheSAqL1xuICBWYWx1ZXNTdGFydFBvc2l0aW9uID0gMSxcblxuICAvKiogVGhlIGxvY2F0aW9uIG9mIHRoZSByYXcga2V5L3ZhbHVlIG1hcCBpbnN0YW5jZSB1c2VkIGxhc3QgdG8gcG9wdWxhdGUgdGhlIGFycmF5IGVudHJpZXMgKi9cbiAgUmF3VmFsdWVQb3NpdGlvbiA9IDAsXG5cbiAgLyoqIFRoZSBzaXplIG9mIGVhY2ggcHJvcGVydHkvdmFsdWUgZW50cnkgKi9cbiAgVHVwbGVTaXplID0gMixcblxuICAvKiogVGhlIG9mZnNldCBmb3IgdGhlIHByb3BlcnR5IGVudHJ5IGluIHRoZSB0dXBsZSAqL1xuICBQcm9wT2Zmc2V0ID0gMCxcblxuICAvKiogVGhlIG9mZnNldCBmb3IgdGhlIHZhbHVlIGVudHJ5IGluIHRoZSB0dXBsZSAqL1xuICBWYWx1ZU9mZnNldCA9IDEsXG59XG5cbi8qKlxuICogVXNlZCB0byBhcHBseS90cmF2ZXJzZSBhY3Jvc3MgYWxsIG1hcC1iYXNlZCBzdHlsaW5nIGVudHJpZXMgdXAgdG8gdGhlIHByb3ZpZGVkIGB0YXJnZXRQcm9wYFxuICogdmFsdWUuXG4gKlxuICogV2hlbiBjYWxsZWQsIGVhY2ggb2YgdGhlIG1hcC1iYXNlZCBgU3R5bGluZ01hcEFycmF5YCBlbnRyaWVzICh3aGljaCBhcmUgc3RvcmVkIGluXG4gKiB0aGUgcHJvdmlkZWQgYExTdHlsaW5nRGF0YWAgYXJyYXkpIHdpbGwgYmUgaXRlcmF0ZWQgb3Zlci4gRGVwZW5kaW5nIG9uIHRoZSBwcm92aWRlZFxuICogYG1vZGVgIHZhbHVlLCBlYWNoIHByb3AvdmFsdWUgZW50cnkgbWF5IGJlIGFwcGxpZWQgb3Igc2tpcHBlZCBvdmVyLlxuICpcbiAqIElmIGB0YXJnZXRQcm9wYCB2YWx1ZSBpcyBwcm92aWRlZCB0aGUgaXRlcmF0aW9uIGNvZGUgd2lsbCBzdG9wIG9uY2UgaXQgcmVhY2hlc1xuICogdGhlIHByb3BlcnR5IChpZiBmb3VuZCkuIE90aGVyd2lzZSBpZiB0aGUgdGFyZ2V0IHByb3BlcnR5IGlzIG5vdCBlbmNvdW50ZXJlZCB0aGVuXG4gKiBpdCB3aWxsIHN0b3Agb25jZSBpdCByZWFjaGVzIHRoZSBuZXh0IHZhbHVlIHRoYXQgYXBwZWFycyBhbHBoYWJldGljYWxseSBhZnRlciBpdC5cbiAqXG4gKiBJZiBhIGBkZWZhdWx0VmFsdWVgIGlzIHByb3ZpZGVkIHRoZW4gaXQgd2lsbCBiZSBhcHBsaWVkIHRvIHRoZSBlbGVtZW50IG9ubHkgaWYgdGhlXG4gKiBgdGFyZ2V0UHJvcGAgcHJvcGVydHkgdmFsdWUgaXMgZW5jb3VudGVyZWQgYW5kIHRoZSB2YWx1ZSBhc3NvY2lhdGVkIHdpdGggdGhlIHRhcmdldFxuICogcHJvcGVydHkgaXMgYG51bGxgLiBUaGUgcmVhc29uIHdoeSB0aGUgYGRlZmF1bHRWYWx1ZWAgaXMgbmVlZGVkIGlzIHRvIGF2b2lkIGhhdmluZyB0aGVcbiAqIGFsZ29yaXRobSBhcHBseSBhIGBudWxsYCB2YWx1ZSBhbmQgdGhlbiBhcHBseSBhIGRlZmF1bHQgdmFsdWUgYWZ0ZXJ3YXJkcyAodGhpcyB3b3VsZFxuICogZW5kIHVwIGJlaW5nIHR3byBzdHlsZSBwcm9wZXJ0eSB3cml0ZXMpLlxuICpcbiAqIEByZXR1cm5zIHdoZXRoZXIgb3Igbm90IHRoZSB0YXJnZXQgcHJvcGVydHkgd2FzIHJlYWNoZWQgYW5kIGl0cyB2YWx1ZSB3YXNcbiAqICBhcHBsaWVkIHRvIHRoZSBlbGVtZW50LlxuICovXG5leHBvcnQgaW50ZXJmYWNlIFN5bmNTdHlsaW5nTWFwc0ZuIHtcbiAgKGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgcmVuZGVyZXI6IFJlbmRlcmVyM3xQcm9jZWR1cmFsUmVuZGVyZXIzfG51bGwsIGVsZW1lbnQ6IFJFbGVtZW50LFxuICAgZGF0YTogTFN0eWxpbmdEYXRhLCBzb3VyY2VJbmRleDogbnVtYmVyLCBhcHBseVN0eWxpbmdGbjogQXBwbHlTdHlsaW5nRm4sXG4gICBzYW5pdGl6ZXI6IFN0eWxlU2FuaXRpemVGbnxudWxsLCBtb2RlOiBTdHlsaW5nTWFwc1N5bmNNb2RlLCB0YXJnZXRQcm9wPzogc3RyaW5nfG51bGwsXG4gICBkZWZhdWx0VmFsdWU/OiBib29sZWFufHN0cmluZ3xudWxsKTogYm9vbGVhbjtcbn1cblxuLyoqXG4gKiBVc2VkIHRvIGRpcmVjdCBob3cgbWFwLWJhc2VkIHZhbHVlcyBhcmUgYXBwbGllZC90cmF2ZXJzZWQgd2hlbiBzdHlsaW5nIGlzIGZsdXNoZWQuXG4gKi9cbmV4cG9ydCBjb25zdCBlbnVtIFN0eWxpbmdNYXBzU3luY01vZGUge1xuICAvKiogT25seSB0cmF2ZXJzZSB2YWx1ZXMgKG5vIHByb3AvdmFsdWUgc3R5bGluZyBlbnRyaWVzIGdldCBhcHBsaWVkKSAqL1xuICBUcmF2ZXJzZVZhbHVlcyA9IDBiMDAwLFxuXG4gIC8qKiBBcHBseSBldmVyeSBwcm9wL3ZhbHVlIHN0eWxpbmcgZW50cnkgdG8gdGhlIGVsZW1lbnQgKi9cbiAgQXBwbHlBbGxWYWx1ZXMgPSAwYjAwMSxcblxuICAvKiogT25seSBhcHBseSB0aGUgdGFyZ2V0IHByb3AvdmFsdWUgZW50cnkgKi9cbiAgQXBwbHlUYXJnZXRQcm9wID0gMGIwMTAsXG5cbiAgLyoqIFNraXAgYXBwbHlpbmcgdGhlIHRhcmdldCBwcm9wL3ZhbHVlIGVudHJ5ICovXG4gIFNraXBUYXJnZXRQcm9wID0gMGIxMDAsXG5cbiAgLyoqIEl0ZXJhdGUgb3ZlciBpbm5lciBtYXBzIG1hcCB2YWx1ZXMgaW4gdGhlIGNvbnRleHQgKi9cbiAgUmVjdXJzZUlubmVyTWFwcyA9IDBiMTAwMCxcblxuICAvKiogT25seSBjaGVjayB0byBzZWUgaWYgYSB2YWx1ZSB3YXMgc2V0IHNvbWV3aGVyZSBpbiBlYWNoIG1hcCAqL1xuICBDaGVja1ZhbHVlc09ubHkgPSAwYjEwMDAwLFxufVxuXG4vKipcbiAqIFNpbXBsaWZpZWQgYFROb2RlYCBpbnRlcmZhY2UgZm9yIHN0eWxpbmctcmVsYXRlZCBjb2RlLlxuICpcbiAqIFRoZSBzdHlsaW5nIGFsZ29yaXRobSBjb2RlIG9ubHkgbmVlZHMgYWNjZXNzIHRvIGBmbGFnc2AuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgVFN0eWxpbmdOb2RlIHsgZmxhZ3M6IFROb2RlRmxhZ3M7IH1cbiJdfQ==