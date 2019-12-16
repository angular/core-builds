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
/**
 * For performance reasons we want to make sure that all subclasses have the same shape object.
 *
 * See subclasses for implementation details.
 * @record
 */
export function TStylingKeyShape() { }
if (false) {
    /** @type {?} */
    TStylingKeyShape.prototype.key;
    /** @type {?} */
    TStylingKeyShape.prototype.extra;
}
/**
 * Used in the case of `ɵɵstyleProp('width', exp, 'px')`.
 * @record
 */
export function TStylingSuffixKey() { }
if (false) {
    /** @type {?} */
    TStylingSuffixKey.prototype.key;
    /** @type {?} */
    TStylingSuffixKey.prototype.extra;
}
/**
 * Used in the case of `ɵɵstyleProp('url', exp, styleSanitizationFn)`.
 * @record
 */
export function TStylingSanitizationKey() { }
if (false) {
    /** @type {?} */
    TStylingSanitizationKey.prototype.key;
    /** @type {?} */
    TStylingSanitizationKey.prototype.extra;
}
/**
 * Used in the case of `ɵɵstyleMap()`/`ɵɵclassMap()`.
 * @record
 */
export function TStylingMapKey() { }
if (false) {
    /** @type {?} */
    TStylingMapKey.prototype.key;
    /** @type {?} */
    TStylingMapKey.prototype.extra;
}
/**
 * This is a branded number which contains previous and next index.
 *
 * When we come across styling instructions we need to store the `TStylingKey` in the correct
 * order so that we can re-concatenate the styling value in the desired priority.
 *
 * The insertion can happen either at the:
 * - end of template as in the case of coming across additional styling instruction in the template
 * - in front of the template in the case of coming across additional instruction in the
 *   `hostBindings`.
 *
 * We use `TStylingRange` to store the previous and next index into the `TData` where the template
 * bindings can be found.
 *
 * - bit 0 is used to mark that the previous index has a duplicate for current value.
 * - bit 1 is used to mark that the next index has a duplicate for the current value.
 * - bits 2-16 are used to encode the next/tail of the template.
 * - bits 17-32 are used to encode the previous/head of template.
 *
 * NODE: *duplicate* false implies that it is statically known that this binding will not collide
 * with other bindings and therefore there is no need to check other bindings. For example the
 * bindings in `<div [style.color]="exp" [style.width]="exp">` will never collide and will have
 * their bits set accordingly. Previous duplicate means that we may need to check previous if the
 * current binding is `null`. Next duplicate means that we may need to check next bindings if the
 * current binding is not `null`.
 *
 * NOTE: `0` has special significance and represents `null` as in no additional pointer.
 * @record
 */
export function TStylingRange() { }
if (false) {
    /** @type {?} */
    TStylingRange.prototype.__brand__;
}
/** @enum {number} */
const StylingRange = {
    /// Number of bits to shift for the previous pointer
    PREV_SHIFT: 18,
    /// Previous pointer mask.
    PREV_MASK: 4294705152,
    /// Number of bits to shift for the next pointer
    NEXT_SHIFT: 2,
    /// Next pointer mask.
    NEXT_MASK: 16380,
    /**
     * This bit is set if the previous bindings contains a binding which could possibly cause a
     * duplicate. For example: `<div [style]="map" [style.width]="width">`, the `width` binding will
     * have previous duplicate set. The implication is that if `width` binding becomes `null`, it is
     * necessary to defer the value to `map.width`. (Because `width` overwrites `map.width`.)
     */
    PREV_DUPLICATE: 2,
    /**
     * This bit is set to if the next binding contains a binding which could possibly cause a
     * duplicate. For example: `<div [style]="map" [style.width]="width">`, the `map` binding will
     * have next duplicate set. The implication is that if `map.width` binding becomes not `null`, it
     * is necessary to defer the value to `width`. (Because `width` overwrites `map.width`.)
     */
    NEXT_DUPLICATE: 1,
};
export { StylingRange };
/**
 * @param {?} prev
 * @param {?} next
 * @return {?}
 */
export function toTStylingRange(prev, next) {
    return (/** @type {?} */ ((prev << 18 /* PREV_SHIFT */ | next << 2 /* NEXT_SHIFT */)));
}
/**
 * @param {?} tStylingRange
 * @return {?}
 */
export function getTStylingRangePrev(tStylingRange) {
    return ((/** @type {?} */ ((/** @type {?} */ (tStylingRange))))) >> 18 /* PREV_SHIFT */;
}
/**
 * @param {?} tStylingRange
 * @return {?}
 */
export function getTStylingRangePrevDuplicate(tStylingRange) {
    return (((/** @type {?} */ ((/** @type {?} */ (tStylingRange))))) & 2 /* PREV_DUPLICATE */) ==
        2 /* PREV_DUPLICATE */;
}
/**
 * @param {?} tStylingRange
 * @param {?} previous
 * @return {?}
 */
export function setTStylingRangePrev(tStylingRange, previous) {
    return (/** @type {?} */ (((((/** @type {?} */ ((/** @type {?} */ (tStylingRange))))) & ~4294705152 /* PREV_MASK */) |
        (previous << 18 /* PREV_SHIFT */))));
}
/**
 * @param {?} tStylingRange
 * @return {?}
 */
export function setTStylingRangePrevDuplicate(tStylingRange) {
    return (/** @type {?} */ ((((/** @type {?} */ ((/** @type {?} */ (tStylingRange))))) | 2 /* PREV_DUPLICATE */)));
}
/**
 * @param {?} tStylingRange
 * @return {?}
 */
export function getTStylingRangeNext(tStylingRange) {
    return (((/** @type {?} */ ((/** @type {?} */ (tStylingRange))))) & 16380 /* NEXT_MASK */) >> 2 /* NEXT_SHIFT */;
}
/**
 * @param {?} tStylingRange
 * @param {?} next
 * @return {?}
 */
export function setTStylingRangeNext(tStylingRange, next) {
    return (/** @type {?} */ (((((/** @type {?} */ ((/** @type {?} */ (tStylingRange))))) & ~16380 /* NEXT_MASK */) | //
        next << 2 /* NEXT_SHIFT */)));
}
/**
 * @param {?} tStylingRange
 * @return {?}
 */
export function getTStylingRangeNextDuplicate(tStylingRange) {
    return (((/** @type {?} */ ((/** @type {?} */ (tStylingRange))))) & 1 /* NEXT_DUPLICATE */) ===
        1 /* NEXT_DUPLICATE */;
}
/**
 * @param {?} tStylingRange
 * @return {?}
 */
export function setTStylingRangeNextDuplicate(tStylingRange) {
    return (/** @type {?} */ ((((/** @type {?} */ ((/** @type {?} */ (tStylingRange))))) | 1 /* NEXT_DUPLICATE */)));
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3R5bGluZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaW50ZXJmYWNlcy9zdHlsaW5nLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFzVUEscUNBT0M7Ozs7Ozs7O0FBS0QsTUFBa0Isb0JBQW9CO0lBQ3BDLG9CQUFvQixHQUFJO0lBQ3hCLDJCQUEyQixHQUFJO0lBQy9CLG1CQUFtQixHQUFJO0lBRXZCLGtDQUFrQztJQUNsQyxvRkFBb0Y7SUFDcEYsWUFBWSxHQUFJO0lBQ2hCLHNCQUFzQixHQUFJO0lBQzFCLDBCQUEwQixHQUFJO0lBQzlCLFVBQVUsR0FBSTtJQUNkLG1CQUFtQixHQUFJO0VBQ3hCOzs7QUFLRCxNQUFrQiw4QkFBOEI7SUFDOUMsT0FBTyxHQUFNO0lBQ2Isb0JBQW9CLEdBQU07SUFDMUIsU0FBUyxHQUFJO0lBQ2IsSUFBSSxHQUFNO0VBQ1g7Ozs7OztBQUtELG9DQUdDOzs7Ozs7Ozs7Ozs7QUFzQkQscUNBS0M7Ozs7OztBQUtELE1BQWtCLG9CQUFvQjtJQUNwQywwQ0FBMEM7SUFDMUMsbUJBQW1CLEdBQUk7SUFFdkIsNkZBQTZGO0lBQzdGLGdCQUFnQixHQUFJO0lBRXBCLDRDQUE0QztJQUM1QyxTQUFTLEdBQUk7SUFFYixxREFBcUQ7SUFDckQsVUFBVSxHQUFJO0lBRWQsa0RBQWtEO0lBQ2xELFdBQVcsR0FBSTtFQUNoQjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBdUJELHVDQUtDOztBQUtELE1BQWtCLG1CQUFtQjtJQUNuQyx1RUFBdUU7SUFDdkUsY0FBYyxHQUFRO0lBRXRCLDBEQUEwRDtJQUMxRCxjQUFjLEdBQVE7SUFFdEIsNkNBQTZDO0lBQzdDLGVBQWUsR0FBUTtJQUV2QixnREFBZ0Q7SUFDaEQsY0FBYyxHQUFRO0lBRXRCLHdEQUF3RDtJQUN4RCxnQkFBZ0IsR0FBUztJQUV6QixpRUFBaUU7SUFDakUsZUFBZSxJQUFVO0VBQzFCOzs7Ozs7OztBQU9ELGtDQUFvRDs7O0lBQXBCLDZCQUFrQjs7Ozs7Ozs7QUFpQmxELHNDQUdDOzs7SUFGQywrQkFBaUI7O0lBQ2pCLGlDQUF3Qzs7Ozs7O0FBTTFDLHVDQUtDOzs7SUFIQyxnQ0FBWTs7SUFFWixrQ0FBYzs7Ozs7O0FBTWhCLDZDQUtDOzs7SUFIQyxzQ0FBWTs7SUFFWix3Q0FBbUI7Ozs7OztBQU1yQixvQ0FVQzs7O0lBUkMsNkJBQVU7O0lBT1YsK0JBQXFCOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBeUN2QixtQ0FBOEQ7OztJQUE3QixrQ0FBMkI7OztBQUs1RCxNQUFrQixZQUFZO0lBQzVCLG9EQUFvRDtJQUNwRCxVQUFVLElBQUs7SUFDZiwwQkFBMEI7SUFDMUIsU0FBUyxZQUFhO0lBRXRCLGdEQUFnRDtJQUNoRCxVQUFVLEdBQUk7SUFDZCxzQkFBc0I7SUFDdEIsU0FBUyxPQUFZO0lBRXJCOzs7OztPQUtHO0lBQ0gsY0FBYyxHQUFPO0lBRXJCOzs7OztPQUtHO0lBQ0gsY0FBYyxHQUFPO0VBQ3RCOzs7Ozs7O0FBR0QsTUFBTSxVQUFVLGVBQWUsQ0FBQyxJQUFZLEVBQUUsSUFBWTtJQUN4RCxPQUFPLG1CQUFBLENBQUMsSUFBSSx1QkFBMkIsR0FBRyxJQUFJLHNCQUEyQixDQUFDLEVBQU8sQ0FBQztBQUNwRixDQUFDOzs7OztBQUVELE1BQU0sVUFBVSxvQkFBb0IsQ0FBQyxhQUE0QjtJQUMvRCxPQUFPLENBQUMsbUJBQUEsbUJBQUEsYUFBYSxFQUFPLEVBQVUsQ0FBQyx1QkFBMkIsQ0FBQztBQUNyRSxDQUFDOzs7OztBQUVELE1BQU0sVUFBVSw2QkFBNkIsQ0FBQyxhQUE0QjtJQUN4RSxPQUFPLENBQUMsQ0FBQyxtQkFBQSxtQkFBQSxhQUFhLEVBQU8sRUFBVSxDQUFDLHlCQUE4QixDQUFDOzhCQUN4QyxDQUFDO0FBQ2xDLENBQUM7Ozs7OztBQUVELE1BQU0sVUFBVSxvQkFBb0IsQ0FDaEMsYUFBNEIsRUFBRSxRQUFnQjtJQUNoRCxPQUFPLG1CQUFBLENBQ0gsQ0FBQyxDQUFDLG1CQUFBLG1CQUFBLGFBQWEsRUFBTyxFQUFVLENBQUMsR0FBRywyQkFBdUIsQ0FBQztRQUM1RCxDQUFDLFFBQVEsdUJBQTJCLENBQUMsQ0FBQyxFQUFPLENBQUM7QUFDcEQsQ0FBQzs7Ozs7QUFFRCxNQUFNLFVBQVUsNkJBQTZCLENBQUMsYUFBNEI7SUFDeEUsT0FBTyxtQkFBQSxDQUFDLENBQUMsbUJBQUEsbUJBQUEsYUFBYSxFQUFPLEVBQVUsQ0FBQyx5QkFBOEIsQ0FBQyxFQUFPLENBQUM7QUFDakYsQ0FBQzs7Ozs7QUFFRCxNQUFNLFVBQVUsb0JBQW9CLENBQUMsYUFBNEI7SUFDL0QsT0FBTyxDQUFDLENBQUMsbUJBQUEsbUJBQUEsYUFBYSxFQUFPLEVBQVUsQ0FBQyx3QkFBeUIsQ0FBQyxzQkFBMkIsQ0FBQztBQUNoRyxDQUFDOzs7Ozs7QUFFRCxNQUFNLFVBQVUsb0JBQW9CLENBQUMsYUFBNEIsRUFBRSxJQUFZO0lBQzdFLE9BQU8sbUJBQUEsQ0FDSCxDQUFDLENBQUMsbUJBQUEsbUJBQUEsYUFBYSxFQUFPLEVBQVUsQ0FBQyxHQUFHLHNCQUF1QixDQUFDLEdBQUksRUFBRTtRQUNsRSxJQUFJLHNCQUEyQixDQUFDLEVBQU8sQ0FBQztBQUM5QyxDQUFDOzs7OztBQUVELE1BQU0sVUFBVSw2QkFBNkIsQ0FBQyxhQUE0QjtJQUN4RSxPQUFPLENBQUMsQ0FBQyxtQkFBQSxtQkFBQSxhQUFhLEVBQU8sRUFBVSxDQUFDLHlCQUE4QixDQUFDOzhCQUN4QyxDQUFDO0FBQ2xDLENBQUM7Ozs7O0FBRUQsTUFBTSxVQUFVLDZCQUE2QixDQUFDLGFBQTRCO0lBQ3hFLE9BQU8sbUJBQUEsQ0FBQyxDQUFDLG1CQUFBLG1CQUFBLGFBQWEsRUFBTyxFQUFVLENBQUMseUJBQThCLENBQUMsRUFBTyxDQUFDO0FBQ2pGLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiogQGxpY2Vuc2VcbiogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4qXG4qIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4qIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiovXG5pbXBvcnQge1N0eWxlU2FuaXRpemVGbn0gZnJvbSAnLi4vLi4vc2FuaXRpemF0aW9uL3N0eWxlX3Nhbml0aXplcic7XG5cbmltcG9ydCB7VE5vZGVGbGFnc30gZnJvbSAnLi9ub2RlJztcbmltcG9ydCB7UHJvY2VkdXJhbFJlbmRlcmVyMywgUkVsZW1lbnQsIFJlbmRlcmVyM30gZnJvbSAnLi9yZW5kZXJlcic7XG5pbXBvcnQge1Nhbml0aXplckZufSBmcm9tICcuL3Nhbml0aXphdGlvbic7XG5pbXBvcnQge0xWaWV3fSBmcm9tICcuL3ZpZXcnO1xuXG5cbi8qKlxuICogLS0tLS0tLS1cbiAqXG4gKiBUaGlzIGZpbGUgY29udGFpbnMgdGhlIGNvcmUgaW50ZXJmYWNlcyBmb3Igc3R5bGluZyBpbiBBbmd1bGFyLlxuICpcbiAqIFRvIGxlYXJuIG1vcmUgYWJvdXQgdGhlIGFsZ29yaXRobSBzZWUgYFRTdHlsaW5nQ29udGV4dGAuXG4gKlxuICogLS0tLS0tLS1cbiAqL1xuXG4vKipcbiAqIEEgc3RhdGljLWxldmVsIHJlcHJlc2VudGF0aW9uIG9mIGFsbCBzdHlsZSBvciBjbGFzcyBiaW5kaW5ncy92YWx1ZXNcbiAqIGFzc29jaWF0ZWQgd2l0aCBhIGBUTm9kZWAuXG4gKlxuICogVGhlIGBUU3R5bGluZ0NvbnRleHRgIHVuaXRlcyBhbGwgdGVtcGxhdGUgc3R5bGluZyBiaW5kaW5ncyAoaS5lLlxuICogYFtjbGFzc11gIGFuZCBgW3N0eWxlXWAgYmluZGluZ3MpIGFzIHdlbGwgYXMgYWxsIGhvc3QtbGV2ZWxcbiAqIHN0eWxpbmcgYmluZGluZ3MgKGZvciBjb21wb25lbnRzIGFuZCBkaXJlY3RpdmVzKSB0b2dldGhlciBpbnRvXG4gKiBhIHNpbmdsZSBtYW5pZmVzdFxuICpcbiAqIFRoZSBzdHlsaW5nIGNvbnRleHQgaXMgc3RvcmVkIG9uIGEgYFROb2RlYCBvbiBhbmQgdGhlcmUgYXJlXG4gKiB0d28gaW5zdGFuY2VzIG9mIGl0OiBvbmUgZm9yIGNsYXNzZXMgYW5kIGFub3RoZXIgZm9yIHN0eWxlcy5cbiAqXG4gKiBgYGB0eXBlc2NyaXB0XG4gKiB0Tm9kZS5zdHlsZXMgPSBbIC4uLiBhIGNvbnRleHQgb25seSBmb3Igc3R5bGVzIC4uLiBdO1xuICogdE5vZGUuY2xhc3NlcyA9IFsgLi4uIGEgY29udGV4dCBvbmx5IGZvciBjbGFzc2VzIC4uLiBdO1xuICogYGBgXG4gKlxuICogVGhlIHN0eWxpbmcgY29udGV4dCBpcyBjcmVhdGVkIGVhY2ggdGltZSB0aGVyZSBhcmUgb25lIG9yIG1vcmVcbiAqIHN0eWxpbmcgYmluZGluZ3MgKHN0eWxlIG9yIGNsYXNzIGJpbmRpbmdzKSBwcmVzZW50IGZvciBhbiBlbGVtZW50LFxuICogYnV0IGlzIG9ubHkgY3JlYXRlZCBvbmNlIHBlciBgVE5vZGVgLlxuICpcbiAqIGB0Tm9kZS5zdHlsZXNgIGFuZCBgdE5vZGUuY2xhc3Nlc2AgY2FuIGJlIGFuIGluc3RhbmNlIG9mIHRoZSBmb2xsb3dpbmc6XG4gKlxuICogYGBgdHlwZXNjcmlwdFxuICogdE5vZGUuc3R5bGVzID0gbnVsbDsgLy8gbm8gc3RhdGljIHN0eWxpbmcgb3Igc3R5bGluZyBiaW5kaW5ncyBhY3RpdmVcbiAqIHROb2RlLnN0eWxlcyA9IFN0eWxpbmdNYXBBcnJheTsgLy8gb25seSBzdGF0aWMgdmFsdWVzIHByZXNlbnQgKGUuZy4gYDxkaXYgc3R5bGU9XCJ3aWR0aDoyMDBcIj5gKVxuICogdE5vZGUuc3R5bGVzID0gVFN0eWxpbmdDb250ZXh0OyAvLyBvbmUgb3IgbW9yZSBzdHlsaW5nIGJpbmRpbmdzIHByZXNlbnQgKGUuZy4gYDxkaXZcbiAqIFtzdHlsZS53aWR0aF0+YClcbiAqIGBgYFxuICpcbiAqIEJvdGggYHROb2RlLnN0eWxlc2AgYW5kIGB0Tm9kZS5jbGFzc2VzYCBhcmUgaW5zdGFudGlhdGVkIHdoZW4gYW55dGhpbmdcbiAqIHN0eWxpbmctcmVsYXRlZCBpcyBhY3RpdmUgb24gYW4gZWxlbWVudC4gVGhleSBhcmUgZmlyc3QgY3JlYXRlZCBmcm9tXG4gKiBmcm9tIHRoZSBhbnkgb2YgdGhlIGVsZW1lbnQtbGV2ZWwgaW5zdHJ1Y3Rpb25zIChlLmcuIGBlbGVtZW50YCxcbiAqIGBlbGVtZW50U3RhcnRgLCBgZWxlbWVudEhvc3RBdHRyc2ApLiBXaGVuIGFueSBzdGF0aWMgc3R5bGUvY2xhc3NcbiAqIHZhbHVlcyBhcmUgZW5jb3VudGVyZWQgdGhleSBhcmUgcmVnaXN0ZXJlZCBvbiB0aGUgYHROb2RlLnN0eWxlc2BcbiAqIGFuZCBgdE5vZGUuY2xhc3Nlc2AgZGF0YS1zdHJ1Y3R1cmVzLiBCeSBkZWZhdWx0ICh3aGVuIGFueSBzdGF0aWNcbiAqIHZhbHVlcyBhcmUgZW5jb3VudGVyZWQpIHRoZSBgdE5vZGUuc3R5bGVzYCBvciBgdE5vZGUuY2xhc3Nlc2AgdmFsdWVzXG4gKiBhcmUgaW5zdGFuY2VzIG9mIGEgYFN0eWxpbmdNYXBBcnJheWAuIE9ubHkgd2hlbiBzdHlsZS9jbGFzcyBiaW5kaW5nc1xuICogYXJlIGRldGVjdGVkIHRoZW4gdGhhdCBzdHlsaW5nIG1hcCBpcyBjb252ZXJ0ZWQgaW50byBhbiBpbnN0YW5jZSBvZlxuICogYFRTdHlsaW5nQ29udGV4dGAuXG4gKlxuICogRHVlIHRvIHRoZSBmYWN0IHRoZSB0aGUgYFRTdHlsaW5nQ29udGV4dGAgaXMgc3RvcmVkIG9uIGEgYFROb2RlYFxuICogdGhpcyBtZWFucyB0aGF0IGFsbCBkYXRhIHdpdGhpbiB0aGUgY29udGV4dCBpcyBzdGF0aWMuIEluc3RlYWQgb2ZcbiAqIHN0b3JpbmcgYWN0dWFsIHN0eWxpbmcgYmluZGluZyB2YWx1ZXMsIHRoZSBsVmlldyBiaW5kaW5nIGluZGV4IHZhbHVlc1xuICogYXJlIHN0b3JlZCB3aXRoaW4gdGhlIGNvbnRleHQuIChzdGF0aWMgbmF0dXJlIG1lYW5zIGl0IGlzIG1vcmUgY29tcGFjdC4pXG4gKlxuICogVGhlIGNvZGUgYmVsb3cgc2hvd3MgYSBicmVha2Rvd24gb2YgdHdvIGluc3RhbmNlcyBvZiBgVFN0eWxpbmdDb250ZXh0YFxuICogKG9uZSBmb3IgYHROb2RlLnN0eWxlc2AgYW5kIGFub3RoZXIgZm9yIGB0Tm9kZS5jbGFzc2VzYCk6XG4gKlxuICogYGBgdHlwZXNjcmlwdFxuICogLy8gPGRpdiBbY2xhc3MuYWN0aXZlXT1cImNcIiAgLy8gbFZpZXcgYmluZGluZyBpbmRleCA9IDIwXG4gKiAvLyAgICAgIFtzdHlsZS53aWR0aF09XCJ4XCIgICAvLyBsVmlldyBiaW5kaW5nIGluZGV4ID0gMjFcbiAqIC8vICAgICAgW3N0eWxlLmhlaWdodF09XCJ5XCI+IC8vIGxWaWV3IGJpbmRpbmcgaW5kZXggPSAyMlxuICogLy8gIC4uLlxuICogLy8gPC9kaXY+XG4gKiB0Tm9kZS5zdHlsZXMgPSBbXG4gKiAgIDEsICAgICAgICAgLy8gdGhlIHRvdGFsIGFtb3VudCBvZiBzb3VyY2VzIHByZXNlbnQgKG9ubHkgYDFgIGIvYyB0aGVyZSBhcmUgb25seSB0ZW1wbGF0ZVxuICogYmluZGluZ3MpXG4gKiAgIFtudWxsXSwgICAgLy8gaW5pdGlhbCB2YWx1ZXMgYXJyYXkgKGFuIGluc3RhbmNlIG9mIGBTdHlsaW5nTWFwQXJyYXlgKVxuICpcbiAqICAgMCwgICAgICAgICAvLyBjb25maWcgZW50cnkgZm9yIHRoZSBwcm9wZXJ0eSAoc2VlIGBUU3R5bGluZ0NvbnRleHRQcm9wQ29uZmlnRmxhZ3NgKVxuICogICAwYjAxMCwgICAgIC8vIHRlbXBsYXRlIGd1YXJkIG1hc2sgZm9yIGhlaWdodFxuICogICAwLCAgICAgICAgIC8vIGhvc3QgYmluZGluZ3MgZ3VhcmQgbWFzayBmb3IgaGVpZ2h0XG4gKiAgICdoZWlnaHQnLCAgLy8gdGhlIHByb3BlcnR5IG5hbWVcbiAqICAgMjIsICAgICAgICAvLyB0aGUgYmluZGluZyBsb2NhdGlvbiBmb3IgdGhlIFwieVwiIGJpbmRpbmcgaW4gdGhlIGxWaWV3XG4gKiAgIG51bGwsICAgICAgLy8gdGhlIGRlZmF1bHQgdmFsdWUgZm9yIGhlaWdodFxuICpcbiAqICAgMCwgICAgICAgICAvLyBjb25maWcgZW50cnkgZm9yIHRoZSBwcm9wZXJ0eSAoc2VlIGBUU3R5bGluZ0NvbnRleHRQcm9wQ29uZmlnRmxhZ3NgKVxuICogICAwYjAwMSwgICAgIC8vIHRlbXBsYXRlIGd1YXJkIG1hc2sgZm9yIHdpZHRoXG4gKiAgIDAsICAgICAgICAgLy8gaG9zdCBiaW5kaW5ncyBndWFyZCBtYXNrIGZvciB3aWR0aFxuICogICAnd2lkdGgnLCAgIC8vIHRoZSBwcm9wZXJ0eSBuYW1lXG4gKiAgIDIxLCAgICAgICAgLy8gdGhlIGJpbmRpbmcgbG9jYXRpb24gZm9yIHRoZSBcInhcIiBiaW5kaW5nIGluIHRoZSBsVmlld1xuICogICBudWxsLCAgICAgIC8vIHRoZSBkZWZhdWx0IHZhbHVlIGZvciB3aWR0aFxuICogXTtcbiAqXG4gKiB0Tm9kZS5jbGFzc2VzID0gW1xuICogICAwLCAgICAgICAgIC8vIHRoZSBjb250ZXh0IGNvbmZpZyB2YWx1ZSAoc2VlIGBUU3R5bGluZ0NvbnRleHRDb25maWdgKVxuICogICAxLCAgICAgICAgIC8vIHRoZSB0b3RhbCBhbW91bnQgb2Ygc291cmNlcyBwcmVzZW50IChvbmx5IGAxYCBiL2MgdGhlcmUgYXJlIG9ubHkgdGVtcGxhdGVcbiAqIGJpbmRpbmdzKVxuICogICBbbnVsbF0sICAgIC8vIGluaXRpYWwgdmFsdWVzIGFycmF5IChhbiBpbnN0YW5jZSBvZiBgU3R5bGluZ01hcEFycmF5YClcbiAqXG4gKiAgIDAsICAgICAgICAgLy8gY29uZmlnIGVudHJ5IGZvciB0aGUgcHJvcGVydHkgKHNlZSBgVFN0eWxpbmdDb250ZXh0UHJvcENvbmZpZ0ZsYWdzYClcbiAqICAgMGIwMDEsICAgICAvLyB0ZW1wbGF0ZSBndWFyZCBtYXNrIGZvciB3aWR0aFxuICogICAwLCAgICAgICAgIC8vIGhvc3QgYmluZGluZ3MgZ3VhcmQgbWFzayBmb3Igd2lkdGhcbiAqICAgJ2FjdGl2ZScsICAvLyB0aGUgcHJvcGVydHkgbmFtZVxuICogICAyMCwgICAgICAgIC8vIHRoZSBiaW5kaW5nIGxvY2F0aW9uIGZvciB0aGUgXCJjXCIgYmluZGluZyBpbiB0aGUgbFZpZXdcbiAqICAgbnVsbCwgICAgICAvLyB0aGUgZGVmYXVsdCB2YWx1ZSBmb3IgdGhlIGBhY3RpdmVgIGNsYXNzXG4gKiBdO1xuICogYGBgXG4gKlxuICogRW50cnkgdmFsdWUgcHJlc2VudCBpbiBhbiBlbnRyeSAoY2FsbGVkIGEgdHVwbGUpIHdpdGhpbiB0aGVcbiAqIHN0eWxpbmcgY29udGV4dCBpcyBhcyBmb2xsb3dzOlxuICpcbiAqIGBgYHR5cGVzY3JpcHRcbiAqIGNvbnRleHQgPSBbXG4gKiAgIC8vLi4uXG4gKiAgIGNvbmZpZ1ZhbHVlLFxuICogICB0ZW1wbGF0ZUd1YXJkTWFzayxcbiAqICAgaG9zdEJpbmRpbmdzR3VhcmRNYXNrLFxuICogICBwcm9wTmFtZSxcbiAqICAgLi4uYmluZGluZ0luZGljZXMuLi4sXG4gKiAgIGRlZmF1bHRWYWx1ZVxuICogICAvLy4uLlxuICogXTtcbiAqIGBgYFxuICpcbiAqIEJlbG93IGlzIGEgYnJlYWtkb3duIG9mIGVhY2ggdmFsdWU6XG4gKlxuICogLSAqKmNvbmZpZ1ZhbHVlKio6XG4gKiAgIFByb3BlcnR5LXNwZWNpZmljIGNvbmZpZ3VyYXRpb24gdmFsdWVzLiBUaGUgb25seSBjb25maWcgc2V0dGluZ1xuICogICB0aGF0IGlzIGltcGxlbWVudGVkIHJpZ2h0IG5vdyBpcyB3aGV0aGVyIG9yIG5vdCB0byBzYW5pdGl6ZSB0aGVcbiAqICAgdmFsdWUuXG4gKlxuICogLSAqKnRlbXBsYXRlR3VhcmRNYXNrKio6XG4gKiAgIEEgbnVtZXJpYyB2YWx1ZSB3aGVyZSBlYWNoIGJpdCByZXByZXNlbnRzIGEgYmluZGluZyBpbmRleFxuICogICBsb2NhdGlvbi4gRWFjaCBiaW5kaW5nIGluZGV4IGxvY2F0aW9uIGlzIGFzc2lnbmVkIGJhc2VkIG9uXG4gKiAgIGEgbG9jYWwgY291bnRlciB2YWx1ZSB0aGF0IGluY3JlbWVudHMgZWFjaCB0aW1lIGFuIGluc3RydWN0aW9uXG4gKiAgIGlzIGNhbGxlZDpcbiAqXG4gKiBgYGBcbiAqIDxkaXYgW3N0eWxlLndpZHRoXT1cInhcIiAgIC8vIGJpbmRpbmcgaW5kZXggPSAyMSAoY291bnRlciBpbmRleCA9IDApXG4gKiAgICAgIFtzdHlsZS5oZWlnaHRdPVwieVwiPiAvLyBiaW5kaW5nIGluZGV4ID0gMjIgKGNvdW50ZXIgaW5kZXggPSAxKVxuICogYGBgXG4gKlxuICogICBJbiB0aGUgZXhhbXBsZSBjb2RlIGFib3ZlLCBpZiB0aGUgYHdpZHRoYCB2YWx1ZSB3aGVyZSB0byBjaGFuZ2VcbiAqICAgdGhlbiB0aGUgZmlyc3QgYml0IGluIHRoZSBsb2NhbCBiaXQgbWFzayB2YWx1ZSB3b3VsZCBiZSBmbGlwcGVkXG4gKiAgIChhbmQgdGhlIHNlY29uZCBiaXQgZm9yIHdoZW4gYGhlaWdodGApLlxuICpcbiAqICAgSWYgYW5kIHdoZW4gdGhlcmUgYXJlIG1vcmUgdGhhbiAzMiBiaW5kaW5nIHNvdXJjZXMgaW4gdGhlIGNvbnRleHRcbiAqICAgKG1vcmUgdGhhbiAzMiBgW3N0eWxlL2NsYXNzXWAgYmluZGluZ3MpIHRoZW4gdGhlIGJpdCBtYXNraW5nIHdpbGxcbiAqICAgb3ZlcmZsb3cgYW5kIHdlIGFyZSBsZWZ0IHdpdGggYSBzaXR1YXRpb24gd2hlcmUgYSBgLTFgIHZhbHVlIHdpbGxcbiAqICAgcmVwcmVzZW50IHRoZSBiaXQgbWFzay4gRHVlIHRvIHRoZSB3YXkgdGhhdCBKYXZhU2NyaXB0IGhhbmRsZXNcbiAqICAgbmVnYXRpdmUgdmFsdWVzLCB3aGVuIHRoZSBiaXQgbWFzayBpcyBgLTFgIHRoZW4gYWxsIGJpdHMgd2l0aGluXG4gKiAgIHRoYXQgdmFsdWUgd2lsbCBiZSBhdXRvbWF0aWNhbGx5IGZsaXBwZWQgKHRoaXMgaXMgYSBxdWljayBhbmRcbiAqICAgZWZmaWNpZW50IHdheSB0byBmbGlwIGFsbCBiaXRzIG9uIHRoZSBtYXNrIHdoZW4gYSBzcGVjaWFsIGtpbmRcbiAqICAgb2YgY2FjaGluZyBzY2VuYXJpbyBvY2N1cnMgb3Igd2hlbiB0aGVyZSBhcmUgbW9yZSB0aGFuIDMyIGJpbmRpbmdzKS5cbiAqXG4gKiAtICoqaG9zdEJpbmRpbmdzR3VhcmRNYXNrKio6XG4gKiAgIEFub3RoZXIgaW5zdGFuY2Ugb2YgYSBndWFyZCBtYXNrIHRoYXQgaXMgc3BlY2lmaWMgdG8gaG9zdCBiaW5kaW5ncy5cbiAqICAgVGhpcyBiZWhhdmVzIGV4YWN0bHkgdGhlIHNhbWUgd2F5IGFzIGRvZXMgdGhlIGB0ZW1wbGF0ZUd1YXJkTWFza2AsXG4gKiAgIGJ1dCB3aWxsIG5vdCBjb250YWluIGFueSBiaW5kaW5nIGluZm9ybWF0aW9uIHByb2Nlc3NlZCBpbiB0aGUgdGVtcGxhdGUuXG4gKiAgIFRoZSByZWFzb24gd2h5IHRoZXJlIGFyZSB0d28gaW5zdGFuY2VzIG9mIGd1YXJkIG1hc2tzIChvbmUgZm9yIHRoZVxuICogICB0ZW1wbGF0ZSBhbmQgYW5vdGhlciBmb3IgaG9zdCBiaW5kaW5ncykgaXMgYmVjYXVzZSB0aGUgdGVtcGxhdGUgYmluZGluZ3NcbiAqICAgYXJlIHByb2Nlc3NlZCBiZWZvcmUgaG9zdCBiaW5kaW5ncyBhbmQgdGhlIHN0YXRlIGluZm9ybWF0aW9uIGlzIG5vdFxuICogICBjYXJyaWVkIG92ZXIgaW50byB0aGUgaG9zdCBiaW5kaW5ncyBjb2RlLiBBcyBzb29uIGFzIGhvc3QgYmluZGluZ3MgYXJlXG4gKiAgIHByb2Nlc3NlZCBmb3IgYW4gZWxlbWVudCB0aGUgY291bnRlciBhbmQgc3RhdGUtYmFzZWQgYml0IG1hc2sgdmFsdWVzIGFyZVxuICogICBzZXQgdG8gYDBgLlxuICpcbiAqIGBgYFxuICogPGRpdiBbc3R5bGUud2lkdGhdPVwieFwiICAgLy8gYmluZGluZyBpbmRleCA9IDIxIChjb3VudGVyIGluZGV4ID0gMClcbiAqICAgICAgW3N0eWxlLmhlaWdodF09XCJ5XCIgIC8vIGJpbmRpbmcgaW5kZXggPSAyMiAoY291bnRlciBpbmRleCA9IDEpXG4gKiAgICAgIGRpci10aGF0LXNldHMtd2lkdGggIC8vIGJpbmRpbmcgaW5kZXggPSAzMCAoY291bnRlciBpbmRleCA9IDApXG4gKiAgICAgIGRpci10aGF0LXNldHMtd2lkdGg+IC8vIGJpbmRpbmcgaW5kZXggPSAzMSAoY291bnRlciBpbmRleCA9IDEpXG4gKiBgYGBcbiAqXG4gKiAtICoqcHJvcE5hbWUqKjpcbiAqICAgVGhlIENTUyBwcm9wZXJ0eSBuYW1lIG9yIGNsYXNzIG5hbWUgKGUuZyBgd2lkdGhgIG9yIGBhY3RpdmVgKS5cbiAqXG4gKiAtICoqYmluZGluZ0luZGljZXMuLi4qKjpcbiAqICAgQSBzZXJpZXMgb2YgbnVtZXJpYyBiaW5kaW5nIHZhbHVlcyB0aGF0IHJlZmxlY3Qgd2hlcmUgaW4gdGhlXG4gKiAgIGxWaWV3IHRvIGZpbmQgdGhlIHN0eWxlL2NsYXNzIHZhbHVlcyBhc3NvY2lhdGVkIHdpdGggdGhlIHByb3BlcnR5LlxuICogICBFYWNoIHZhbHVlIGlzIGluIG9yZGVyIGluIHRlcm1zIG9mIHByaW9yaXR5ICh0ZW1wbGF0ZXMgYXJlIGZpcnN0LFxuICogICB0aGVuIGRpcmVjdGl2ZXMgYW5kIHRoZW4gY29tcG9uZW50cykuIFdoZW4gdGhlIGNvbnRleHQgaXMgZmx1c2hlZFxuICogICBhbmQgdGhlIHN0eWxlL2NsYXNzIHZhbHVlcyBhcmUgYXBwbGllZCB0byB0aGUgZWxlbWVudCAodGhpcyBoYXBwZW5zXG4gKiAgIGluc2lkZSBvZiB0aGUgYHN0eWxpbmdBcHBseWAgaW5zdHJ1Y3Rpb24pIHRoZW4gdGhlIGZsdXNoaW5nIGNvZGVcbiAqICAgd2lsbCBrZWVwIGNoZWNraW5nIGVhY2ggYmluZGluZyBpbmRleCBhZ2FpbnN0IHRoZSBhc3NvY2lhdGVkIGxWaWV3XG4gKiAgIHRvIGZpbmQgdGhlIGZpcnN0IHN0eWxlL2NsYXNzIHZhbHVlIHRoYXQgaXMgbm9uLW51bGwuXG4gKlxuICogLSAqKmRlZmF1bHRWYWx1ZSoqOlxuICogICBUaGlzIGlzIHRoZSBkZWZhdWx0IHRoYXQgd2lsbCBhbHdheXMgYmUgYXBwbGllZCB0byB0aGUgZWxlbWVudCBpZlxuICogICBhbmQgd2hlbiBhbGwgb3RoZXIgYmluZGluZyBzb3VyY2VzIHJldHVybiBhIHJlc3VsdCB0aGF0IGlzIG51bGwuXG4gKiAgIFVzdWFsbHkgdGhpcyB2YWx1ZSBpcyBgbnVsbGAgYnV0IGl0IGNhbiBhbHNvIGJlIGEgc3RhdGljIHZhbHVlIHRoYXRcbiAqICAgaXMgaW50ZXJjZXB0ZWQgd2hlbiB0aGUgdE5vZGUgaXMgZmlyc3QgY29uc3RydWN0dXJlZCAoZS5nLlxuICogICBgPGRpdiBzdHlsZT1cIndpZHRoOjIwMHB4XCI+YCBoYXMgYSBkZWZhdWx0IHZhbHVlIG9mIGAyMDBweGAgZm9yXG4gKiAgIHRoZSBgd2lkdGhgIHByb3BlcnR5KS5cbiAqXG4gKiBFYWNoIHRpbWUgYSBuZXcgYmluZGluZyBpcyBlbmNvdW50ZXJlZCBpdCBpcyByZWdpc3RlcmVkIGludG8gdGhlXG4gKiBjb250ZXh0LiBUaGUgY29udGV4dCB0aGVuIGlzIGNvbnRpbnVhbGx5IHVwZGF0ZWQgdW50aWwgdGhlIGZpcnN0XG4gKiBzdHlsaW5nIGFwcGx5IGNhbGwgaGFzIGJlZW4gY2FsbGVkICh3aGljaCBpcyBhdXRvbWF0aWNhbGx5IHNjaGVkdWxlZFxuICogdG8gYmUgY2FsbGVkIG9uY2UgYW4gZWxlbWVudCBleGl0cyBkdXJpbmcgY2hhbmdlIGRldGVjdGlvbikuIE5vdGUgdGhhdFxuICogZWFjaCBlbnRyeSBpbiB0aGUgY29udGV4dCBpcyBzdG9yZWQgaW4gYWxwaGFiZXRpY2FsIG9yZGVyLlxuICpcbiAqIE9uY2Ugc3R5bGluZyBoYXMgYmVlbiBmbHVzaGVkIGZvciB0aGUgZmlyc3QgdGltZSBmb3IgYW4gZWxlbWVudCB0aGVcbiAqIGNvbnRleHQgd2lsbCBzZXQgYXMgbG9ja2VkICh0aGlzIHByZXZlbnRzIGJpbmRpbmdzIGZyb20gYmVpbmcgYWRkZWRcbiAqIHRvIHRoZSBjb250ZXh0IGxhdGVyIG9uKS5cbiAqXG4gKiAjIEhvdyBTdHlsZXMvQ2xhc3NlcyBhcmUgUmVuZGVyZWRcbiAqIEVhY2ggdGltZSBhIHN0eWxpbmcgaW5zdHJ1Y3Rpb24gKGUuZy4gYFtjbGFzcy5uYW1lXWAsIGBbc3R5bGUucHJvcF1gLFxuICogZXRjLi4uKSBpcyBleGVjdXRlZCwgdGhlIGFzc29jaWF0ZWQgYGxWaWV3YCBmb3IgdGhlIHZpZXcgaXMgdXBkYXRlZFxuICogYXQgdGhlIGN1cnJlbnQgYmluZGluZyBsb2NhdGlvbi4gQWxzbywgd2hlbiB0aGlzIGhhcHBlbnMsIGEgbG9jYWxcbiAqIGNvdW50ZXIgdmFsdWUgaXMgaW5jcmVtZW50ZWQuIElmIHRoZSBiaW5kaW5nIHZhbHVlIGhhcyBjaGFuZ2VkIHRoZW5cbiAqIGEgbG9jYWwgYGJpdE1hc2tgIHZhcmlhYmxlIGlzIHVwZGF0ZWQgd2l0aCB0aGUgc3BlY2lmaWMgYml0IGJhc2VkXG4gKiBvbiB0aGUgY291bnRlciB2YWx1ZS5cbiAqXG4gKiBCZWxvdyBpcyBhIGxpZ2h0d2VpZ2h0IGV4YW1wbGUgb2Ygd2hhdCBoYXBwZW5zIHdoZW4gYSBzaW5nbGUgc3R5bGVcbiAqIHByb3BlcnR5IGlzIHVwZGF0ZWQgKGkuZS4gYDxkaXYgW3N0eWxlLnByb3BdPVwidmFsXCI+YCk6XG4gKlxuICogYGBgdHlwZXNjcmlwdFxuICogZnVuY3Rpb24gdXBkYXRlU3R5bGVQcm9wKHByb3A6IHN0cmluZywgdmFsdWU6IHN0cmluZykge1xuICogICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gKiAgIGNvbnN0IGJpbmRpbmdJbmRleCA9IEJJTkRJTkdfSU5ERVgrKztcbiAqXG4gKiAgIC8vIHVwZGF0ZSB0aGUgbG9jYWwgY291bnRlciB2YWx1ZVxuICogICBjb25zdCBpbmRleEZvclN0eWxlID0gc3R5bGluZ1N0YXRlLnN0eWxlc0NvdW50Kys7XG4gKiAgIGlmIChsVmlld1tiaW5kaW5nSW5kZXhdICE9PSB2YWx1ZSkge1xuICogICAgIGxWaWV3W2JpbmRpbmdJbmRleF0gPSB2YWx1ZTtcbiAqXG4gKiAgICAgLy8gdGVsbCB0aGUgbG9jYWwgc3RhdGUgdGhhdCB3ZSBoYXZlIHVwZGF0ZWQgYSBzdHlsZSB2YWx1ZVxuICogICAgIC8vIGJ5IHVwZGF0aW5nIHRoZSBiaXQgbWFza1xuICogICAgIHN0eWxpbmdTdGF0ZS5iaXRNYXNrRm9yU3R5bGVzIHw9IDEgPDwgaW5kZXhGb3JTdHlsZTtcbiAqICAgfVxuICogfVxuICogYGBgXG4gKlxuICogT25jZSBhbGwgdGhlIGJpbmRpbmdzIGhhdmUgdXBkYXRlZCBhIGBiaXRNYXNrYCB2YWx1ZSB3aWxsIGJlIHBvcHVsYXRlZC5cbiAqIFRoaXMgYGJpdE1hc2tgIHZhbHVlIGlzIHVzZWQgaW4gdGhlIGFwcGx5IGFsZ29yaXRobSAod2hpY2ggaXMgY2FsbGVkXG4gKiBjb250ZXh0IHJlc29sdXRpb24pLlxuICpcbiAqICMjIFRoZSBBcHBseSBBbGdvcml0aG0gKENvbnRleHQgUmVzb2x1dGlvbilcbiAqIEFzIGV4cGxhaW5lZCBhYm92ZSwgZWFjaCB0aW1lIGEgYmluZGluZyB1cGRhdGVzIGl0cyB2YWx1ZSwgdGhlIHJlc3VsdGluZ1xuICogdmFsdWUgaXMgc3RvcmVkIGluIHRoZSBgbFZpZXdgIGFycmF5LiBUaGVzZSBzdHlsaW5nIHZhbHVlcyBoYXZlIHlldCB0b1xuICogYmUgZmx1c2hlZCB0byB0aGUgZWxlbWVudC5cbiAqXG4gKiBPbmNlIGFsbCB0aGUgc3R5bGluZyBpbnN0cnVjdGlvbnMgaGF2ZSBiZWVuIGV2YWx1YXRlZCwgdGhlbiB0aGUgc3R5bGluZ1xuICogY29udGV4dChzKSBhcmUgZmx1c2hlZCB0byB0aGUgZWxlbWVudC4gV2hlbiB0aGlzIGhhcHBlbnMsIHRoZSBjb250ZXh0IHdpbGxcbiAqIGJlIGl0ZXJhdGVkIG92ZXIgKHByb3BlcnR5IGJ5IHByb3BlcnR5KSBhbmQgZWFjaCBiaW5kaW5nIHNvdXJjZSB3aWxsIGJlXG4gKiBleGFtaW5lZCBhbmQgdGhlIGZpcnN0IG5vbi1udWxsIHZhbHVlIHdpbGwgYmUgYXBwbGllZCB0byB0aGUgZWxlbWVudC5cbiAqXG4gKiBMZXQncyBzYXkgdGhhdCB3ZSB0aGUgZm9sbG93aW5nIHRlbXBsYXRlIGNvZGU6XG4gKlxuICogYGBgaHRtbFxuICogPGRpdiBbc3R5bGUud2lkdGhdPVwidzFcIiBkaXItdGhhdC1zZXQtd2lkdGg9XCJ3MlwiPjwvZGl2PlxuICogYGBgXG4gKlxuICogVGhlcmUgYXJlIHR3byBzdHlsaW5nIGJpbmRpbmdzIGluIHRoZSBjb2RlIGFib3ZlIGFuZCB0aGV5IGJvdGggd3JpdGVcbiAqIHRvIHRoZSBgd2lkdGhgIHByb3BlcnR5LiBXaGVuIHN0eWxpbmcgaXMgZmx1c2hlZCBvbiB0aGUgZWxlbWVudCwgdGhlXG4gKiBhbGdvcml0aG0gd2lsbCB0cnkgYW5kIGZpZ3VyZSBvdXQgd2hpY2ggb25lIG9mIHRoZXNlIHZhbHVlcyB0byB3cml0ZVxuICogdG8gdGhlIGVsZW1lbnQuXG4gKlxuICogSW4gb3JkZXIgdG8gZmlndXJlIG91dCB3aGljaCB2YWx1ZSB0byBhcHBseSwgdGhlIGZvbGxvd2luZ1xuICogYmluZGluZyBwcmlvcml0aXphdGlvbiBpcyBhZGhlcmVkIHRvOlxuICpcbiAqICAgMS4gRmlyc3QgdGVtcGxhdGUtbGV2ZWwgc3R5bGluZyBiaW5kaW5ncyBhcmUgYXBwbGllZCAoaWYgcHJlc2VudCkuXG4gKiAgICAgIFRoaXMgaW5jbHVkZXMgdGhpbmdzIGxpa2UgYFtzdHlsZS53aWR0aF1gIGFuZCBgW2NsYXNzLmFjdGl2ZV1gLlxuICpcbiAqICAgMi4gU2Vjb25kIGFyZSBzdHlsaW5nLWxldmVsIGhvc3QgYmluZGluZ3MgcHJlc2VudCBpbiBkaXJlY3RpdmVzLlxuICogICAgICAoaWYgdGhlcmUgYXJlIHN1Yi9zdXBlciBkaXJlY3RpdmVzIHByZXNlbnQgdGhlbiB0aGUgc3ViIGRpcmVjdGl2ZXNcbiAqICAgICAgYXJlIGFwcGxpZWQgZmlyc3QpLlxuICpcbiAqICAgMy4gVGhpcmQgYXJlIHN0eWxpbmctbGV2ZWwgaG9zdCBiaW5kaW5ncyBwcmVzZW50IGluIGNvbXBvbmVudHMuXG4gKiAgICAgIChpZiB0aGVyZSBhcmUgc3ViL3N1cGVyIGNvbXBvbmVudHMgcHJlc2VudCB0aGVuIHRoZSBzdWIgZGlyZWN0aXZlc1xuICogICAgICBhcmUgYXBwbGllZCBmaXJzdCkuXG4gKlxuICogVGhpcyBtZWFucyB0aGF0IGluIHRoZSBjb2RlIGFib3ZlIHRoZSBzdHlsaW5nIGJpbmRpbmcgcHJlc2VudCBpbiB0aGVcbiAqIHRlbXBsYXRlIGlzIGFwcGxpZWQgZmlyc3QgYW5kLCBvbmx5IGlmIGl0cyBmYWxzeSwgdGhlbiB0aGUgZGlyZWN0aXZlXG4gKiBzdHlsaW5nIGJpbmRpbmcgZm9yIHdpZHRoIHdpbGwgYmUgYXBwbGllZC5cbiAqXG4gKiAjIyMgV2hhdCBhYm91dCBtYXAtYmFzZWQgc3R5bGluZyBiaW5kaW5ncz9cbiAqIE1hcC1iYXNlZCBzdHlsaW5nIGJpbmRpbmdzIGFyZSBhY3RpdmF0ZWQgd2hlbiB0aGVyZSBhcmUgb25lIG9yIG1vcmVcbiAqIGBbc3R5bGVdYCBhbmQvb3IgYFtjbGFzc11gIGJpbmRpbmdzIHByZXNlbnQgb24gYW4gZWxlbWVudC4gV2hlbiB0aGlzXG4gKiBjb2RlIGlzIGFjdGl2YXRlZCwgdGhlIGFwcGx5IGFsZ29yaXRobSB3aWxsIGl0ZXJhdGUgb3ZlciBlYWNoIG1hcFxuICogZW50cnkgYW5kIGFwcGx5IGVhY2ggc3R5bGluZyB2YWx1ZSB0byB0aGUgZWxlbWVudCB3aXRoIHRoZSBzYW1lXG4gKiBwcmlvcml0aXphdGlvbiBydWxlcyBhcyBhYm92ZS5cbiAqXG4gKiBGb3IgdGhlIGFsZ29yaXRobSB0byBhcHBseSBzdHlsaW5nIHZhbHVlcyBlZmZpY2llbnRseSwgdGhlXG4gKiBzdHlsaW5nIG1hcCBlbnRyaWVzIG11c3QgYmUgYXBwbGllZCBpbiBzeW5jIChwcm9wZXJ0eSBieSBwcm9wZXJ0eSlcbiAqIHdpdGggcHJvcC1iYXNlZCBiaW5kaW5ncy4gKFRoZSBtYXAtYmFzZWQgYWxnb3JpdGhtIGlzIGRlc2NyaWJlZFxuICogbW9yZSBpbnNpZGUgb2YgdGhlIGByZW5kZXIzL3N0eWxpbmcvbWFwX2Jhc2VkX2JpbmRpbmdzLnRzYCBmaWxlLilcbiAqXG4gKiAjIyBTYW5pdGl6YXRpb25cbiAqIFNhbml0aXphdGlvbiBpcyB1c2VkIHRvIHByZXZlbnQgaW52YWxpZCBzdHlsZSB2YWx1ZXMgZnJvbSBiZWluZyBhcHBsaWVkIHRvXG4gKiB0aGUgZWxlbWVudC5cbiAqXG4gKiBJdCBpcyBlbmFibGVkIGluIHR3byBjYXNlczpcbiAqXG4gKiAgIDEuIFRoZSBgc3R5bGVTYW5pdGl6ZXIoc2FuaXRpemVyRm4pYCBpbnN0cnVjdGlvbiB3YXMgY2FsbGVkIChqdXN0IGJlZm9yZSBhbnkgb3RoZXJcbiAqICAgICAgc3R5bGluZyBpbnN0cnVjdGlvbnMgYXJlIHJ1bikuXG4gKlxuICogICAyLiBUaGUgY29tcG9uZW50L2RpcmVjdGl2ZSBgTFZpZXdgIGluc3RhbmNlIGhhcyBhIHNhbml0aXplciBvYmplY3QgYXR0YWNoZWQgdG8gaXRcbiAqICAgICAgKHRoaXMgaGFwcGVucyB3aGVuIGByZW5kZXJDb21wb25lbnRgIGlzIGV4ZWN1dGVkIHdpdGggYSBgc2FuaXRpemVyYCB2YWx1ZSBvclxuICogICAgICBpZiB0aGUgbmdNb2R1bGUgY29udGFpbnMgYSBzYW5pdGl6ZXIgcHJvdmlkZXIgYXR0YWNoZWQgdG8gaXQpLlxuICpcbiAqIElmIGFuZCB3aGVuIHNhbml0aXphdGlvbiBpcyBhY3RpdmUgdGhlbiBhbGwgcHJvcGVydHkvdmFsdWUgZW50cmllcyB3aWxsIGJlIGV2YWx1YXRlZFxuICogdGhyb3VnaCB0aGUgYWN0aXZlIHNhbml0aXplciBiZWZvcmUgdGhleSBhcmUgYXBwbGllZCB0byB0aGUgZWxlbWVudCAob3IgdGhlIHN0eWxpbmdcbiAqIGRlYnVnIGhhbmRsZXIpLlxuICpcbiAqIElmIGEgYFNhbml0aXplcmAgb2JqZWN0IGlzIHVzZWQgKHZpYSB0aGUgYExWaWV3W1NBTklUSVpFUl1gIHZhbHVlKSB0aGVuIHRoYXQgb2JqZWN0XG4gKiB3aWxsIGJlIHVzZWQgZm9yIGV2ZXJ5IHByb3BlcnR5LlxuICpcbiAqIElmIGEgYFN0eWxlU2FuaXRpemVyRm5gIGZ1bmN0aW9uIGlzIHVzZWQgKHZpYSB0aGUgYHN0eWxlU2FuaXRpemVyYCkgdGhlbiBpdCB3aWxsIGJlXG4gKiBjYWxsZWQgaW4gdHdvIHdheXM6XG4gKlxuICogICAxLiBwcm9wZXJ0eSB2YWxpZGF0aW9uIG1vZGU6IHRoaXMgd2lsbCBiZSBjYWxsZWQgZWFybHkgdG8gbWFyayB3aGV0aGVyIGEgcHJvcGVydHlcbiAqICAgICAgc2hvdWxkIGJlIHNhbml0aXplZCBvciBub3QgYXQgZHVyaW5nIHRoZSBmbHVzaGluZyBzdGFnZS5cbiAqXG4gKiAgIDIuIHZhbHVlIHNhbml0aXphdGlvbiBtb2RlOiB0aGlzIHdpbGwgYmUgY2FsbGVkIGR1cmluZyB0aGUgZmx1c2hpbmcgc3RhZ2UgYW5kIHdpbGxcbiAqICAgICAgcnVuIHRoZSBzYW5pdGl6ZXIgZnVuY3Rpb24gYWdhaW5zdCB0aGUgdmFsdWUgYmVmb3JlIGFwcGx5aW5nIGl0IHRvIHRoZSBlbGVtZW50LlxuICpcbiAqIElmIHNhbml0aXphdGlvbiByZXR1cm5zIGFuIGVtcHR5IHZhbHVlIHRoZW4gdGhhdCBlbXB0eSB2YWx1ZSB3aWxsIGJlIGFwcGxpZWRcbiAqIHRvIHRoZSBlbGVtZW50LlxuICovXG5leHBvcnQgaW50ZXJmYWNlIFRTdHlsaW5nQ29udGV4dCBleHRlbmRzXG4gICAgQXJyYXk8bnVtYmVyfHN0cmluZ3xudW1iZXJ8Ym9vbGVhbnxudWxsfFN0eWxpbmdNYXBBcnJheXx7fT4ge1xuICAvKiogVGhlIHRvdGFsIGFtb3VudCBvZiBzb3VyY2VzIHByZXNlbnQgaW4gdGhlIGNvbnRleHQgKi9cbiAgW1RTdHlsaW5nQ29udGV4dEluZGV4LlRvdGFsU291cmNlc1Bvc2l0aW9uXTogbnVtYmVyO1xuXG4gIC8qKiBJbml0aWFsIHZhbHVlIHBvc2l0aW9uIGZvciBzdGF0aWMgc3R5bGVzICovXG4gIFtUU3R5bGluZ0NvbnRleHRJbmRleC5Jbml0aWFsU3R5bGluZ1ZhbHVlUG9zaXRpb25dOiBTdHlsaW5nTWFwQXJyYXk7XG59XG5cbi8qKlxuICogQW4gaW5kZXggb2YgcG9zaXRpb24gYW5kIG9mZnNldCB2YWx1ZXMgdXNlZCB0byBuYXZpZ2F0ZSB0aGUgYFRTdHlsaW5nQ29udGV4dGAuXG4gKi9cbmV4cG9ydCBjb25zdCBlbnVtIFRTdHlsaW5nQ29udGV4dEluZGV4IHtcbiAgVG90YWxTb3VyY2VzUG9zaXRpb24gPSAwLFxuICBJbml0aWFsU3R5bGluZ1ZhbHVlUG9zaXRpb24gPSAxLFxuICBWYWx1ZXNTdGFydFBvc2l0aW9uID0gMixcblxuICAvLyBlYWNoIHR1cGxlIGVudHJ5IGluIHRoZSBjb250ZXh0XG4gIC8vIChjb25maWcsIHRlbXBsYXRlQml0R3VhcmQsIGhvc3RCaW5kaW5nQml0R3VhcmQsIHByb3AsIC4uLmJpbmRpbmdzfHxkZWZhdWx0LXZhbHVlKVxuICBDb25maWdPZmZzZXQgPSAwLFxuICBUZW1wbGF0ZUJpdEd1YXJkT2Zmc2V0ID0gMSxcbiAgSG9zdEJpbmRpbmdzQml0R3VhcmRPZmZzZXQgPSAyLFxuICBQcm9wT2Zmc2V0ID0gMyxcbiAgQmluZGluZ3NTdGFydE9mZnNldCA9IDRcbn1cblxuLyoqXG4gKiBBIHNlcmllcyBvZiBmbGFncyB1c2VkIGZvciBlYWNoIHByb3BlcnR5IGVudHJ5IHdpdGhpbiB0aGUgYFRTdHlsaW5nQ29udGV4dGAuXG4gKi9cbmV4cG9ydCBjb25zdCBlbnVtIFRTdHlsaW5nQ29udGV4dFByb3BDb25maWdGbGFncyB7XG4gIERlZmF1bHQgPSAwYjAsXG4gIFNhbml0aXphdGlvblJlcXVpcmVkID0gMGIxLFxuICBUb3RhbEJpdHMgPSAxLFxuICBNYXNrID0gMGIxLFxufVxuXG4vKipcbiAqIEEgZnVuY3Rpb24gdXNlZCB0byBhcHBseSBvciByZW1vdmUgc3R5bGluZyBmcm9tIGFuIGVsZW1lbnQgZm9yIGEgZ2l2ZW4gcHJvcGVydHkuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgQXBwbHlTdHlsaW5nRm4ge1xuICAocmVuZGVyZXI6IFJlbmRlcmVyM3xQcm9jZWR1cmFsUmVuZGVyZXIzfG51bGwsIGVsZW1lbnQ6IFJFbGVtZW50LCBwcm9wOiBzdHJpbmcsIHZhbHVlOiBhbnksXG4gICBiaW5kaW5nSW5kZXg/OiBudW1iZXJ8bnVsbCk6IHZvaWQ7XG59XG5cbi8qKlxuICogUnVudGltZSBkYXRhIHR5cGUgdGhhdCBpcyB1c2VkIHRvIHN0b3JlIGJpbmRpbmcgZGF0YSByZWZlcmVuY2VkIGZyb20gdGhlIGBUU3R5bGluZ0NvbnRleHRgLlxuICpcbiAqIEJlY2F1c2UgYExWaWV3YCBpcyBqdXN0IGFuIGFycmF5IHdpdGggZGF0YSwgdGhlcmUgaXMgbm8gcmVhc29uIHRvXG4gKiBzcGVjaWFsIGNhc2UgYExWaWV3YCBldmVyeXdoZXJlIGluIHRoZSBzdHlsaW5nIGFsZ29yaXRobS4gQnkgYWxsb3dpbmdcbiAqIHRoaXMgZGF0YSB0eXBlIHRvIGJlIGFuIGFycmF5IHRoYXQgY29udGFpbnMgdmFyaW91cyBzY2FsYXIgZGF0YSB0eXBlcyxcbiAqIGFuIGluc3RhbmNlIG9mIGBMVmlld2AgZG9lc24ndCBuZWVkIHRvIGJlIGNvbnN0cnVjdGVkIGZvciB0ZXN0cy5cbiAqL1xuZXhwb3J0IHR5cGUgTFN0eWxpbmdEYXRhID0gTFZpZXcgfCAoc3RyaW5nIHwgbnVtYmVyIHwgYm9vbGVhbiB8IG51bGwpW107XG5cbi8qKlxuICogQXJyYXktYmFzZWQgcmVwcmVzZW50YXRpb24gb2YgYSBrZXkvdmFsdWUgYXJyYXkuXG4gKlxuICogVGhlIGZvcm1hdCBvZiB0aGUgYXJyYXkgaXMgXCJwcm9wZXJ0eVwiLCBcInZhbHVlXCIsIFwicHJvcGVydHkyXCIsXG4gKiBcInZhbHVlMlwiLCBldGMuLi5cbiAqXG4gKiBUaGUgZmlyc3QgdmFsdWUgaW4gdGhlIGFycmF5IGlzIHJlc2VydmVkIHRvIHN0b3JlIHRoZSBpbnN0YW5jZVxuICogb2YgdGhlIGtleS92YWx1ZSBhcnJheSB0aGF0IHdhcyB1c2VkIHRvIHBvcHVsYXRlIHRoZSBwcm9wZXJ0eS9cbiAqIHZhbHVlIGVudHJpZXMgdGhhdCB0YWtlIHBsYWNlIGluIHRoZSByZW1haW5kZXIgb2YgdGhlIGFycmF5LlxuICovXG5leHBvcnQgaW50ZXJmYWNlIFN0eWxpbmdNYXBBcnJheSBleHRlbmRzIEFycmF5PHt9fHN0cmluZ3xudW1iZXJ8bnVsbHx1bmRlZmluZWQ+IHtcbiAgLyoqXG4gICAqIFRoZSBsYXN0IHJhdyB2YWx1ZSB1c2VkIHRvIGdlbmVyYXRlIHRoZSBlbnRyaWVzIGluIHRoZSBtYXAuXG4gICAqL1xuICBbU3R5bGluZ01hcEFycmF5SW5kZXguUmF3VmFsdWVQb3NpdGlvbl06IHt9fHN0cmluZ3xudW1iZXJ8bnVsbHx1bmRlZmluZWQ7XG59XG5cbi8qKlxuICogQW4gaW5kZXggb2YgcG9zaXRpb24gYW5kIG9mZnNldCBwb2ludHMgZm9yIGFueSBkYXRhIHN0b3JlZCB3aXRoaW4gYSBgU3R5bGluZ01hcEFycmF5YCBpbnN0YW5jZS5cbiAqL1xuZXhwb3J0IGNvbnN0IGVudW0gU3R5bGluZ01hcEFycmF5SW5kZXgge1xuICAvKiogV2hlcmUgdGhlIHZhbHVlcyBzdGFydCBpbiB0aGUgYXJyYXkgKi9cbiAgVmFsdWVzU3RhcnRQb3NpdGlvbiA9IDEsXG5cbiAgLyoqIFRoZSBsb2NhdGlvbiBvZiB0aGUgcmF3IGtleS92YWx1ZSBtYXAgaW5zdGFuY2UgdXNlZCBsYXN0IHRvIHBvcHVsYXRlIHRoZSBhcnJheSBlbnRyaWVzICovXG4gIFJhd1ZhbHVlUG9zaXRpb24gPSAwLFxuXG4gIC8qKiBUaGUgc2l6ZSBvZiBlYWNoIHByb3BlcnR5L3ZhbHVlIGVudHJ5ICovXG4gIFR1cGxlU2l6ZSA9IDIsXG5cbiAgLyoqIFRoZSBvZmZzZXQgZm9yIHRoZSBwcm9wZXJ0eSBlbnRyeSBpbiB0aGUgdHVwbGUgKi9cbiAgUHJvcE9mZnNldCA9IDAsXG5cbiAgLyoqIFRoZSBvZmZzZXQgZm9yIHRoZSB2YWx1ZSBlbnRyeSBpbiB0aGUgdHVwbGUgKi9cbiAgVmFsdWVPZmZzZXQgPSAxLFxufVxuXG4vKipcbiAqIFVzZWQgdG8gYXBwbHkvdHJhdmVyc2UgYWNyb3NzIGFsbCBtYXAtYmFzZWQgc3R5bGluZyBlbnRyaWVzIHVwIHRvIHRoZSBwcm92aWRlZCBgdGFyZ2V0UHJvcGBcbiAqIHZhbHVlLlxuICpcbiAqIFdoZW4gY2FsbGVkLCBlYWNoIG9mIHRoZSBtYXAtYmFzZWQgYFN0eWxpbmdNYXBBcnJheWAgZW50cmllcyAod2hpY2ggYXJlIHN0b3JlZCBpblxuICogdGhlIHByb3ZpZGVkIGBMU3R5bGluZ0RhdGFgIGFycmF5KSB3aWxsIGJlIGl0ZXJhdGVkIG92ZXIuIERlcGVuZGluZyBvbiB0aGUgcHJvdmlkZWRcbiAqIGBtb2RlYCB2YWx1ZSwgZWFjaCBwcm9wL3ZhbHVlIGVudHJ5IG1heSBiZSBhcHBsaWVkIG9yIHNraXBwZWQgb3Zlci5cbiAqXG4gKiBJZiBgdGFyZ2V0UHJvcGAgdmFsdWUgaXMgcHJvdmlkZWQgdGhlIGl0ZXJhdGlvbiBjb2RlIHdpbGwgc3RvcCBvbmNlIGl0IHJlYWNoZXNcbiAqIHRoZSBwcm9wZXJ0eSAoaWYgZm91bmQpLiBPdGhlcndpc2UgaWYgdGhlIHRhcmdldCBwcm9wZXJ0eSBpcyBub3QgZW5jb3VudGVyZWQgdGhlblxuICogaXQgd2lsbCBzdG9wIG9uY2UgaXQgcmVhY2hlcyB0aGUgbmV4dCB2YWx1ZSB0aGF0IGFwcGVhcnMgYWxwaGFiZXRpY2FsbHkgYWZ0ZXIgaXQuXG4gKlxuICogSWYgYSBgZGVmYXVsdFZhbHVlYCBpcyBwcm92aWRlZCB0aGVuIGl0IHdpbGwgYmUgYXBwbGllZCB0byB0aGUgZWxlbWVudCBvbmx5IGlmIHRoZVxuICogYHRhcmdldFByb3BgIHByb3BlcnR5IHZhbHVlIGlzIGVuY291bnRlcmVkIGFuZCB0aGUgdmFsdWUgYXNzb2NpYXRlZCB3aXRoIHRoZSB0YXJnZXRcbiAqIHByb3BlcnR5IGlzIGBudWxsYC4gVGhlIHJlYXNvbiB3aHkgdGhlIGBkZWZhdWx0VmFsdWVgIGlzIG5lZWRlZCBpcyB0byBhdm9pZCBoYXZpbmcgdGhlXG4gKiBhbGdvcml0aG0gYXBwbHkgYSBgbnVsbGAgdmFsdWUgYW5kIHRoZW4gYXBwbHkgYSBkZWZhdWx0IHZhbHVlIGFmdGVyd2FyZHMgKHRoaXMgd291bGRcbiAqIGVuZCB1cCBiZWluZyB0d28gc3R5bGUgcHJvcGVydHkgd3JpdGVzKS5cbiAqXG4gKiBAcmV0dXJucyB3aGV0aGVyIG9yIG5vdCB0aGUgdGFyZ2V0IHByb3BlcnR5IHdhcyByZWFjaGVkIGFuZCBpdHMgdmFsdWUgd2FzXG4gKiAgYXBwbGllZCB0byB0aGUgZWxlbWVudC5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBTeW5jU3R5bGluZ01hcHNGbiB7XG4gIChjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIHJlbmRlcmVyOiBSZW5kZXJlcjN8UHJvY2VkdXJhbFJlbmRlcmVyM3xudWxsLCBlbGVtZW50OiBSRWxlbWVudCxcbiAgIGRhdGE6IExTdHlsaW5nRGF0YSwgc291cmNlSW5kZXg6IG51bWJlciwgYXBwbHlTdHlsaW5nRm46IEFwcGx5U3R5bGluZ0ZuLFxuICAgc2FuaXRpemVyOiBTdHlsZVNhbml0aXplRm58bnVsbCwgbW9kZTogU3R5bGluZ01hcHNTeW5jTW9kZSwgdGFyZ2V0UHJvcD86IHN0cmluZ3xudWxsLFxuICAgZGVmYXVsdFZhbHVlPzogYm9vbGVhbnxzdHJpbmd8bnVsbCk6IGJvb2xlYW47XG59XG5cbi8qKlxuICogVXNlZCB0byBkaXJlY3QgaG93IG1hcC1iYXNlZCB2YWx1ZXMgYXJlIGFwcGxpZWQvdHJhdmVyc2VkIHdoZW4gc3R5bGluZyBpcyBmbHVzaGVkLlxuICovXG5leHBvcnQgY29uc3QgZW51bSBTdHlsaW5nTWFwc1N5bmNNb2RlIHtcbiAgLyoqIE9ubHkgdHJhdmVyc2UgdmFsdWVzIChubyBwcm9wL3ZhbHVlIHN0eWxpbmcgZW50cmllcyBnZXQgYXBwbGllZCkgKi9cbiAgVHJhdmVyc2VWYWx1ZXMgPSAwYjAwMCxcblxuICAvKiogQXBwbHkgZXZlcnkgcHJvcC92YWx1ZSBzdHlsaW5nIGVudHJ5IHRvIHRoZSBlbGVtZW50ICovXG4gIEFwcGx5QWxsVmFsdWVzID0gMGIwMDEsXG5cbiAgLyoqIE9ubHkgYXBwbHkgdGhlIHRhcmdldCBwcm9wL3ZhbHVlIGVudHJ5ICovXG4gIEFwcGx5VGFyZ2V0UHJvcCA9IDBiMDEwLFxuXG4gIC8qKiBTa2lwIGFwcGx5aW5nIHRoZSB0YXJnZXQgcHJvcC92YWx1ZSBlbnRyeSAqL1xuICBTa2lwVGFyZ2V0UHJvcCA9IDBiMTAwLFxuXG4gIC8qKiBJdGVyYXRlIG92ZXIgaW5uZXIgbWFwcyBtYXAgdmFsdWVzIGluIHRoZSBjb250ZXh0ICovXG4gIFJlY3Vyc2VJbm5lck1hcHMgPSAwYjEwMDAsXG5cbiAgLyoqIE9ubHkgY2hlY2sgdG8gc2VlIGlmIGEgdmFsdWUgd2FzIHNldCBzb21ld2hlcmUgaW4gZWFjaCBtYXAgKi9cbiAgQ2hlY2tWYWx1ZXNPbmx5ID0gMGIxMDAwMCxcbn1cblxuLyoqXG4gKiBTaW1wbGlmaWVkIGBUTm9kZWAgaW50ZXJmYWNlIGZvciBzdHlsaW5nLXJlbGF0ZWQgY29kZS5cbiAqXG4gKiBUaGUgc3R5bGluZyBhbGdvcml0aG0gY29kZSBvbmx5IG5lZWRzIGFjY2VzcyB0byBgZmxhZ3NgLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIFRTdHlsaW5nTm9kZSB7IGZsYWdzOiBUTm9kZUZsYWdzOyB9XG5cblxuLyoqXG4gKiBWYWx1ZSBzdG9yZWQgaW4gdGhlIGBURGF0YWAgd2hpY2ggaXMgbmVlZGVkIHRvIHJlLWNvbmNhdGVuYXRlIHRoZSBzdHlsaW5nLlxuICpcbiAqIC0gYHN0cmluZ2A6IFN0b3JlcyB0aGUgcHJvcGVydHkgbmFtZS4gVXNlZCB3aXRoIGDJtcm1c3R5bGVQcm9wYC9gybXJtWNsYXNzUHJvcGAgaW5zdHJ1Y3Rpb24gd2hpY2hcbiAqIGRvbid0IGhhdmUgc3VmZml4IG9yIGRvbid0IG5lZWQgc2FuaXRpemF0aW9uLlxuICovXG5leHBvcnQgdHlwZSBUU3R5bGluZ0tleSA9IHN0cmluZyB8IFRTdHlsaW5nU3VmZml4S2V5IHwgVFN0eWxpbmdTYW5pdGl6YXRpb25LZXkgfCBUU3R5bGluZ01hcEtleTtcblxuXG4vKipcbiAqIEZvciBwZXJmb3JtYW5jZSByZWFzb25zIHdlIHdhbnQgdG8gbWFrZSBzdXJlIHRoYXQgYWxsIHN1YmNsYXNzZXMgaGF2ZSB0aGUgc2FtZSBzaGFwZSBvYmplY3QuXG4gKlxuICogU2VlIHN1YmNsYXNzZXMgZm9yIGltcGxlbWVudGF0aW9uIGRldGFpbHMuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgVFN0eWxpbmdLZXlTaGFwZSB7XG4gIGtleTogc3RyaW5nfG51bGw7XG4gIGV4dHJhOiBzdHJpbmd8U2FuaXRpemVyRm58VFN0eWxpbmdNYXBGbjtcbn1cblxuLyoqXG4gKiBVc2VkIGluIHRoZSBjYXNlIG9mIGDJtcm1c3R5bGVQcm9wKCd3aWR0aCcsIGV4cCwgJ3B4JylgLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIFRTdHlsaW5nU3VmZml4S2V5IGV4dGVuZHMgVFN0eWxpbmdLZXlTaGFwZSB7XG4gIC8vLyBTdG9yZXMgdGhlIHByb3BlcnR5IGtleS5cbiAga2V5OiBzdHJpbmc7XG4gIC8vLyBTdG9yZXMgdGhlIHByb3BlcnR5IHN1ZmZpeC5cbiAgZXh0cmE6IHN0cmluZztcbn1cblxuLyoqXG4gKiBVc2VkIGluIHRoZSBjYXNlIG9mIGDJtcm1c3R5bGVQcm9wKCd1cmwnLCBleHAsIHN0eWxlU2FuaXRpemF0aW9uRm4pYC5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBUU3R5bGluZ1Nhbml0aXphdGlvbktleSBleHRlbmRzIFRTdHlsaW5nS2V5U2hhcGUge1xuICAvLy8gU3RvcmVzIHRoZSBwcm9wZXJ0eSBrZXkuXG4gIGtleTogc3RyaW5nO1xuICAvLy8gU3RvcmVzIHNhbml0aXphdGlvbiBmdW5jdGlvbi5cbiAgZXh0cmE6IFNhbml0aXplckZuO1xufVxuXG4vKipcbiAqIFVzZWQgaW4gdGhlIGNhc2Ugb2YgYMm1ybVzdHlsZU1hcCgpYC9gybXJtWNsYXNzTWFwKClgLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIFRTdHlsaW5nTWFwS2V5IGV4dGVuZHMgVFN0eWxpbmdLZXlTaGFwZSB7XG4gIC8vLyBUaGVyZSBpcyBubyBrZXlcbiAga2V5OiBudWxsO1xuICAvLy8gSW52b2tlIHRoaXMgZnVuY3Rpb24gdG8gcHJvY2VzcyB0aGUgdmFsdWUgKGNvbnZlcnQgaXQgaW50byB0aGUgcmVzdWx0KVxuICAvLy8gVGhpcyBpcyBpbXBsZW1lbnRlZCB0aGlzIHdheSBzbyB0aGF0IHRoZSBsb2dpYyBhc3NvY2lhdGVkIHdpdGggYMm1ybVzdHlsZU1hcCgpYC9gybXJtWNsYXNzTWFwKClgXG4gIC8vLyBjYW4gYmUgdHJlZSBzaGFrZW4gYXdheS4gSW50ZXJuYWxseSB0aGUgZnVuY3Rpb24gd2lsbCBicmVhayB0aGUgYE1hcGAvYEFycmF5YCBkb3duIGludG9cbiAgLy8vIHBhcnRzIGFuZCBjYWxsIGBhcHBlbmRTdHlsaW5nYCBvbiBwYXJ0cy5cbiAgLy8vXG4gIC8vLyBTZWU6IGBDTEFTU19NQVBfU1RZTElOR19LRVlgIGFuZCBgU1RZTEVfTUFQX1NUWUxJTkdfS0VZYCBmb3IgZGV0YWlscy5cbiAgZXh0cmE6IFRTdHlsaW5nTWFwRm47XG59XG5cbi8qKlxuICogSW52b2tlIHRoaXMgZnVuY3Rpb24gdG8gcHJvY2VzcyB0aGUgc3R5bGluZyB2YWx1ZSB3aGljaCBpcyBub24tcHJpbWl0aXZlIChNYXAvQXJyYXkpXG4gKiBUaGlzIGlzIGltcGxlbWVudGVkIHRoaXMgd2F5IHNvIHRoYXQgdGhlIGxvZ2ljIGFzc29jaWF0ZWQgd2l0aCBgybXJtXN0eWxlTWFwKClgL2DJtcm1Y2xhc3NNYXAoKWBcbiAqIGNhbiBiZSB0cmVlIHNoYWtlbiBhd2F5LiBJbnRlcm5hbGx5IHRoZSBmdW5jdGlvbiB3aWxsIGJyZWFrIHRoZSBgTWFwYC9gQXJyYXlgIGRvd24gaW50b1xuICogcGFydHMgYW5kIGNhbGwgYGFwcGVuZFN0eWxpbmdgIG9uIHBhcnRzLlxuICpcbiAqIFNlZTogYENMQVNTX01BUF9TVFlMSU5HX0tFWWAgYW5kIGBTVFlMRV9NQVBfU1RZTElOR19LRVlgIGZvciBkZXRhaWxzLlxuICovXG5leHBvcnQgdHlwZSBUU3R5bGluZ01hcEZuID0gKHRleHQ6IHN0cmluZywgdmFsdWU6IGFueSwgaGFzUHJldmlvdXNEdXBsaWNhdGU6IGJvb2xlYW4pID0+IHN0cmluZztcblxuLyoqXG4gKiBUaGlzIGlzIGEgYnJhbmRlZCBudW1iZXIgd2hpY2ggY29udGFpbnMgcHJldmlvdXMgYW5kIG5leHQgaW5kZXguXG4gKlxuICogV2hlbiB3ZSBjb21lIGFjcm9zcyBzdHlsaW5nIGluc3RydWN0aW9ucyB3ZSBuZWVkIHRvIHN0b3JlIHRoZSBgVFN0eWxpbmdLZXlgIGluIHRoZSBjb3JyZWN0XG4gKiBvcmRlciBzbyB0aGF0IHdlIGNhbiByZS1jb25jYXRlbmF0ZSB0aGUgc3R5bGluZyB2YWx1ZSBpbiB0aGUgZGVzaXJlZCBwcmlvcml0eS5cbiAqXG4gKiBUaGUgaW5zZXJ0aW9uIGNhbiBoYXBwZW4gZWl0aGVyIGF0IHRoZTpcbiAqIC0gZW5kIG9mIHRlbXBsYXRlIGFzIGluIHRoZSBjYXNlIG9mIGNvbWluZyBhY3Jvc3MgYWRkaXRpb25hbCBzdHlsaW5nIGluc3RydWN0aW9uIGluIHRoZSB0ZW1wbGF0ZVxuICogLSBpbiBmcm9udCBvZiB0aGUgdGVtcGxhdGUgaW4gdGhlIGNhc2Ugb2YgY29taW5nIGFjcm9zcyBhZGRpdGlvbmFsIGluc3RydWN0aW9uIGluIHRoZVxuICogICBgaG9zdEJpbmRpbmdzYC5cbiAqXG4gKiBXZSB1c2UgYFRTdHlsaW5nUmFuZ2VgIHRvIHN0b3JlIHRoZSBwcmV2aW91cyBhbmQgbmV4dCBpbmRleCBpbnRvIHRoZSBgVERhdGFgIHdoZXJlIHRoZSB0ZW1wbGF0ZVxuICogYmluZGluZ3MgY2FuIGJlIGZvdW5kLlxuICpcbiAqIC0gYml0IDAgaXMgdXNlZCB0byBtYXJrIHRoYXQgdGhlIHByZXZpb3VzIGluZGV4IGhhcyBhIGR1cGxpY2F0ZSBmb3IgY3VycmVudCB2YWx1ZS5cbiAqIC0gYml0IDEgaXMgdXNlZCB0byBtYXJrIHRoYXQgdGhlIG5leHQgaW5kZXggaGFzIGEgZHVwbGljYXRlIGZvciB0aGUgY3VycmVudCB2YWx1ZS5cbiAqIC0gYml0cyAyLTE2IGFyZSB1c2VkIHRvIGVuY29kZSB0aGUgbmV4dC90YWlsIG9mIHRoZSB0ZW1wbGF0ZS5cbiAqIC0gYml0cyAxNy0zMiBhcmUgdXNlZCB0byBlbmNvZGUgdGhlIHByZXZpb3VzL2hlYWQgb2YgdGVtcGxhdGUuXG4gKlxuICogTk9ERTogKmR1cGxpY2F0ZSogZmFsc2UgaW1wbGllcyB0aGF0IGl0IGlzIHN0YXRpY2FsbHkga25vd24gdGhhdCB0aGlzIGJpbmRpbmcgd2lsbCBub3QgY29sbGlkZVxuICogd2l0aCBvdGhlciBiaW5kaW5ncyBhbmQgdGhlcmVmb3JlIHRoZXJlIGlzIG5vIG5lZWQgdG8gY2hlY2sgb3RoZXIgYmluZGluZ3MuIEZvciBleGFtcGxlIHRoZVxuICogYmluZGluZ3MgaW4gYDxkaXYgW3N0eWxlLmNvbG9yXT1cImV4cFwiIFtzdHlsZS53aWR0aF09XCJleHBcIj5gIHdpbGwgbmV2ZXIgY29sbGlkZSBhbmQgd2lsbCBoYXZlXG4gKiB0aGVpciBiaXRzIHNldCBhY2NvcmRpbmdseS4gUHJldmlvdXMgZHVwbGljYXRlIG1lYW5zIHRoYXQgd2UgbWF5IG5lZWQgdG8gY2hlY2sgcHJldmlvdXMgaWYgdGhlXG4gKiBjdXJyZW50IGJpbmRpbmcgaXMgYG51bGxgLiBOZXh0IGR1cGxpY2F0ZSBtZWFucyB0aGF0IHdlIG1heSBuZWVkIHRvIGNoZWNrIG5leHQgYmluZGluZ3MgaWYgdGhlXG4gKiBjdXJyZW50IGJpbmRpbmcgaXMgbm90IGBudWxsYC5cbiAqXG4gKiBOT1RFOiBgMGAgaGFzIHNwZWNpYWwgc2lnbmlmaWNhbmNlIGFuZCByZXByZXNlbnRzIGBudWxsYCBhcyBpbiBubyBhZGRpdGlvbmFsIHBvaW50ZXIuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgVFN0eWxpbmdSYW5nZSB7IF9fYnJhbmRfXzogJ1RTdHlsaW5nUmFuZ2UnOyB9XG5cbi8qKlxuICogU2hpZnQgYW5kIG1hc2tzIGNvbnN0YW50cyBmb3IgZW5jb2RpbmcgdHdvIG51bWJlcnMgaW50byBhbmQgZHVwbGljYXRlIGluZm8gaW50byBhIHNpbmdsZSBudW1iZXIuXG4gKi9cbmV4cG9ydCBjb25zdCBlbnVtIFN0eWxpbmdSYW5nZSB7XG4gIC8vLyBOdW1iZXIgb2YgYml0cyB0byBzaGlmdCBmb3IgdGhlIHByZXZpb3VzIHBvaW50ZXJcbiAgUFJFVl9TSElGVCA9IDE4LFxuICAvLy8gUHJldmlvdXMgcG9pbnRlciBtYXNrLlxuICBQUkVWX01BU0sgPSAweEZGRkMwMDAwLFxuXG4gIC8vLyBOdW1iZXIgb2YgYml0cyB0byBzaGlmdCBmb3IgdGhlIG5leHQgcG9pbnRlclxuICBORVhUX1NISUZUID0gMixcbiAgLy8vIE5leHQgcG9pbnRlciBtYXNrLlxuICBORVhUX01BU0sgPSAweDAwMDNGRkMsXG5cbiAgLyoqXG4gICAqIFRoaXMgYml0IGlzIHNldCBpZiB0aGUgcHJldmlvdXMgYmluZGluZ3MgY29udGFpbnMgYSBiaW5kaW5nIHdoaWNoIGNvdWxkIHBvc3NpYmx5IGNhdXNlIGFcbiAgICogZHVwbGljYXRlLiBGb3IgZXhhbXBsZTogYDxkaXYgW3N0eWxlXT1cIm1hcFwiIFtzdHlsZS53aWR0aF09XCJ3aWR0aFwiPmAsIHRoZSBgd2lkdGhgIGJpbmRpbmcgd2lsbFxuICAgKiBoYXZlIHByZXZpb3VzIGR1cGxpY2F0ZSBzZXQuIFRoZSBpbXBsaWNhdGlvbiBpcyB0aGF0IGlmIGB3aWR0aGAgYmluZGluZyBiZWNvbWVzIGBudWxsYCwgaXQgaXNcbiAgICogbmVjZXNzYXJ5IHRvIGRlZmVyIHRoZSB2YWx1ZSB0byBgbWFwLndpZHRoYC4gKEJlY2F1c2UgYHdpZHRoYCBvdmVyd3JpdGVzIGBtYXAud2lkdGhgLilcbiAgICovXG4gIFBSRVZfRFVQTElDQVRFID0gMHgwMixcblxuICAvKipcbiAgICogVGhpcyBiaXQgaXMgc2V0IHRvIGlmIHRoZSBuZXh0IGJpbmRpbmcgY29udGFpbnMgYSBiaW5kaW5nIHdoaWNoIGNvdWxkIHBvc3NpYmx5IGNhdXNlIGFcbiAgICogZHVwbGljYXRlLiBGb3IgZXhhbXBsZTogYDxkaXYgW3N0eWxlXT1cIm1hcFwiIFtzdHlsZS53aWR0aF09XCJ3aWR0aFwiPmAsIHRoZSBgbWFwYCBiaW5kaW5nIHdpbGxcbiAgICogaGF2ZSBuZXh0IGR1cGxpY2F0ZSBzZXQuIFRoZSBpbXBsaWNhdGlvbiBpcyB0aGF0IGlmIGBtYXAud2lkdGhgIGJpbmRpbmcgYmVjb21lcyBub3QgYG51bGxgLCBpdFxuICAgKiBpcyBuZWNlc3NhcnkgdG8gZGVmZXIgdGhlIHZhbHVlIHRvIGB3aWR0aGAuIChCZWNhdXNlIGB3aWR0aGAgb3ZlcndyaXRlcyBgbWFwLndpZHRoYC4pXG4gICAqL1xuICBORVhUX0RVUExJQ0FURSA9IDB4MDEsXG59XG5cblxuZXhwb3J0IGZ1bmN0aW9uIHRvVFN0eWxpbmdSYW5nZShwcmV2OiBudW1iZXIsIG5leHQ6IG51bWJlcik6IFRTdHlsaW5nUmFuZ2Uge1xuICByZXR1cm4gKHByZXYgPDwgU3R5bGluZ1JhbmdlLlBSRVZfU0hJRlQgfCBuZXh0IDw8IFN0eWxpbmdSYW5nZS5ORVhUX1NISUZUKSBhcyBhbnk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRUU3R5bGluZ1JhbmdlUHJldih0U3R5bGluZ1JhbmdlOiBUU3R5bGluZ1JhbmdlKTogbnVtYmVyIHtcbiAgcmV0dXJuICh0U3R5bGluZ1JhbmdlIGFzIGFueSBhcyBudW1iZXIpID4+IFN0eWxpbmdSYW5nZS5QUkVWX1NISUZUO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0VFN0eWxpbmdSYW5nZVByZXZEdXBsaWNhdGUodFN0eWxpbmdSYW5nZTogVFN0eWxpbmdSYW5nZSk6IGJvb2xlYW4ge1xuICByZXR1cm4gKCh0U3R5bGluZ1JhbmdlIGFzIGFueSBhcyBudW1iZXIpICYgU3R5bGluZ1JhbmdlLlBSRVZfRFVQTElDQVRFKSA9PVxuICAgICAgU3R5bGluZ1JhbmdlLlBSRVZfRFVQTElDQVRFO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2V0VFN0eWxpbmdSYW5nZVByZXYoXG4gICAgdFN0eWxpbmdSYW5nZTogVFN0eWxpbmdSYW5nZSwgcHJldmlvdXM6IG51bWJlcik6IFRTdHlsaW5nUmFuZ2Uge1xuICByZXR1cm4gKFxuICAgICAgKCh0U3R5bGluZ1JhbmdlIGFzIGFueSBhcyBudW1iZXIpICYgflN0eWxpbmdSYW5nZS5QUkVWX01BU0spIHxcbiAgICAgIChwcmV2aW91cyA8PCBTdHlsaW5nUmFuZ2UuUFJFVl9TSElGVCkpIGFzIGFueTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNldFRTdHlsaW5nUmFuZ2VQcmV2RHVwbGljYXRlKHRTdHlsaW5nUmFuZ2U6IFRTdHlsaW5nUmFuZ2UpOiBUU3R5bGluZ1JhbmdlIHtcbiAgcmV0dXJuICgodFN0eWxpbmdSYW5nZSBhcyBhbnkgYXMgbnVtYmVyKSB8IFN0eWxpbmdSYW5nZS5QUkVWX0RVUExJQ0FURSkgYXMgYW55O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0VFN0eWxpbmdSYW5nZU5leHQodFN0eWxpbmdSYW5nZTogVFN0eWxpbmdSYW5nZSk6IG51bWJlciB7XG4gIHJldHVybiAoKHRTdHlsaW5nUmFuZ2UgYXMgYW55IGFzIG51bWJlcikgJiBTdHlsaW5nUmFuZ2UuTkVYVF9NQVNLKSA+PiBTdHlsaW5nUmFuZ2UuTkVYVF9TSElGVDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNldFRTdHlsaW5nUmFuZ2VOZXh0KHRTdHlsaW5nUmFuZ2U6IFRTdHlsaW5nUmFuZ2UsIG5leHQ6IG51bWJlcik6IFRTdHlsaW5nUmFuZ2Uge1xuICByZXR1cm4gKFxuICAgICAgKCh0U3R5bGluZ1JhbmdlIGFzIGFueSBhcyBudW1iZXIpICYgflN0eWxpbmdSYW5nZS5ORVhUX01BU0spIHwgIC8vXG4gICAgICBuZXh0IDw8IFN0eWxpbmdSYW5nZS5ORVhUX1NISUZUKSBhcyBhbnk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRUU3R5bGluZ1JhbmdlTmV4dER1cGxpY2F0ZSh0U3R5bGluZ1JhbmdlOiBUU3R5bGluZ1JhbmdlKTogYm9vbGVhbiB7XG4gIHJldHVybiAoKHRTdHlsaW5nUmFuZ2UgYXMgYW55IGFzIG51bWJlcikgJiBTdHlsaW5nUmFuZ2UuTkVYVF9EVVBMSUNBVEUpID09PVxuICAgICAgU3R5bGluZ1JhbmdlLk5FWFRfRFVQTElDQVRFO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2V0VFN0eWxpbmdSYW5nZU5leHREdXBsaWNhdGUodFN0eWxpbmdSYW5nZTogVFN0eWxpbmdSYW5nZSk6IFRTdHlsaW5nUmFuZ2Uge1xuICByZXR1cm4gKCh0U3R5bGluZ1JhbmdlIGFzIGFueSBhcyBudW1iZXIpIHwgU3R5bGluZ1JhbmdlLk5FWFRfRFVQTElDQVRFKSBhcyBhbnk7XG59XG4iXX0=