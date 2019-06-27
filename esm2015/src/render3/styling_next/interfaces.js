/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * A static-level representation of all style or class bindings/values
 * associated with a `TNode`.
 *
 * The `TStylingContext` unites all template styling bindings (i.e.
 * `[class]` and `[style]` bindings) as well as all host-level
 * styling bindings (for components and directives) together into
 * a single manifest. It is used each time there are one or more
 * styling bindings present for an element.
 *
 * The styling context is stored on a `TNode` on and there are
 * two instances of it: one for classes and another for styles.
 *
 * ```typescript
 * tNode.styles = [ ... a context only for styles ... ];
 * tNode.classes = [ ... a context only for classes ... ];
 * ```
 *
 * Due to the fact the the `TStylingContext` is stored on a `TNode`
 * this means that all data within the context is static. Instead of
 * storing actual styling binding values, the lView binding index values
 * are stored within the context. (static nature means it is more compact.)
 *
 * ```typescript
 * // <div [class.active]="c"  // lView binding index = 20
 * //      [style.width]="x"   // lView binding index = 21
 * //      [style.height]="y"> // lView binding index = 22
 * tNode.stylesContext = [
 *   0, // the context config value
 *
 *   0b001, // guard mask for width
 *   2, // total entries for width
 *   'width', // the property name
 *   21, // the binding location for the "x" binding in the lView
 *   null,
 *
 *   0b010, // guard mask for height
 *   2, // total entries for height
 *   'height', // the property name
 *   22, // the binding location for the "y" binding in the lView
 *   null,
 * ];
 *
 * tNode.classesContext = [
 *   0, // the context config value
 *
 *   0b001, // guard mask for active
 *   2, // total entries for active
 *   'active', // the property name
 *   20, // the binding location for the "c" binding in the lView
 *   null,
 * ];
 * ```
 *
 * Entry value present in an entry (called a tuple) within the
 * styling context is as follows:
 *
 * ```typescript
 * context = [
 *   CONFIG, // the styling context config value
 *   //...
 *   guardMask,
 *   totalEntries,
 *   propName,
 *   bindingIndices...,
 *   defaultValue
 * ];
 * ```
 *
 * Below is a breakdown of each value:
 *
 * - **guardMask**:
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
 * - **totalEntries**:
 *   Each property present in the contains various binding sources of
 *   where the styling data could come from. This includes template
 *   level bindings, directive/component host bindings as well as the
 *   default value (or static value) all writing to the same property.
 *   This value depicts how many binding source entries exist for the
 *   property.
 *
 *   The reason why the totalEntries value is needed is because the
 *   styling context is dynamic in size and it's not possible
 *   for the flushing or update algorithms to know when and where
 *   a property starts and ends without it.
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
 *   Usually this value is null but it can also be a static value that
 *   is intercepted when the tNode is first constructured (e.g.
 *   `<div style="width:200px">` has a default value of `200px` for
 *   the `width` property).
 *
 * Each time a new binding is encountered it is registered into the
 * context. The context then is continually updated until the first
 * styling apply call has been called (this is triggered by the
 * `stylingApply()` instruction for the active element).
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
 *   const indexForStyle = localStylesCounter++;
 *   if (lView[bindingIndex] !== value) {
 *     lView[bindingIndex] = value;
 *     localBitMaskForStyles |= 1 << indexForStyle;
 *   }
 * }
 * ```
 *
 * ## The Apply Algorithm
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
    [TStylingContextIndex.ConfigPosition]: TStylingConfigFlags;*/
    /* Skipping unnamed member:
    [TStylingContextIndex.MaxDirectiveIndexPosition]: number;*/
    /* Skipping unnamed member:
    [TStylingContextIndex.MapBindingsBitGuardPosition]: number;*/
    /* Skipping unnamed member:
    [TStylingContextIndex.MapBindingsValuesCountPosition]: number;*/
    /* Skipping unnamed member:
    [TStylingContextIndex.MapBindingsPropPosition]: string;*/
}
/** @enum {number} */
const TStylingConfigFlags = {
    /**
     * The initial state of the styling context config
     */
    Initial: 0,
    /**
     * A flag which marks the context as being locked.
     *
     * The styling context is constructed across an element template
     * function as well as any associated hostBindings functions. When
     * this occurs, the context itself is open to mutation and only once
     * it has been flushed once then it will be locked for good (no extra
     * bindings can be added to it).
     */
    Locked: 1,
};
export { TStylingConfigFlags };
/** @enum {number} */
const TStylingContextIndex = {
    ConfigPosition: 0,
    MaxDirectiveIndexPosition: 1,
    // index/offset values for map-based entries (i.e. `[style]`
    // and `[class] bindings).
    MapBindingsPosition: 2,
    MapBindingsBitGuardPosition: 2,
    MapBindingsValuesCountPosition: 3,
    MapBindingsPropPosition: 4,
    MapBindingsBindingsStartPosition: 5,
    // each tuple entry in the context
    // (mask, count, prop, ...bindings||default-value)
    ConfigAndGuardOffset: 0,
    ValuesCountOffset: 1,
    PropOffset: 2,
    BindingsStartOffset: 3,
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
export function LStylingMap() { }
if (false) {
    /* Skipping unnamed member:
    [LStylingMapIndex.RawValuePosition]: {}|string|null;*/
}
/** @enum {number} */
const LStylingMapIndex = {
    /** The location of the raw key/value map instance used last to populate the array entries */
    RawValuePosition: 0,
    /** Where the values start in the array */
    ValuesStartPosition: 1,
    /** The size of each property/value entry */
    TupleSize: 2,
    /** The offset for the property entry in the tuple */
    PropOffset: 0,
    /** The offset for the value entry in the tuple */
    ValueOffset: 1,
};
export { LStylingMapIndex };
/**
 * Used to apply/traverse across all map-based styling entries up to the provided `targetProp`
 * value.
 *
 * When called, each of the map-based `LStylingMap` entries (which are stored in
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
};
export { StylingMapsSyncMode };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW50ZXJmYWNlcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvc3R5bGluZ19uZXh0L2ludGVyZmFjZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFzUUEscUNBcUJDOzs7Ozs7Ozs7Ozs7Ozs7SUFPQzs7T0FFRztJQUNILFVBQWE7SUFFYjs7Ozs7Ozs7T0FRRztJQUNILFNBQVk7Ozs7O0lBT1osaUJBQWtCO0lBQ2xCLDRCQUE2QjtJQUU3Qiw0REFBNEQ7SUFDNUQsMEJBQTBCO0lBQzFCLHNCQUF1QjtJQUN2Qiw4QkFBK0I7SUFDL0IsaUNBQWtDO0lBQ2xDLDBCQUEyQjtJQUMzQixtQ0FBb0M7SUFFcEMsa0NBQWtDO0lBQ2xDLGtEQUFrRDtJQUNsRCx1QkFBd0I7SUFDeEIsb0JBQXFCO0lBQ3JCLGFBQWM7SUFDZCxzQkFBdUI7Ozs7O0lBT3ZCLFVBQWE7SUFDYix1QkFBMEI7SUFDMUIsWUFBYTtJQUNiLE9BQVU7Ozs7Ozs7QUFNWixvQ0FHQzs7Ozs7Ozs7Ozs7O0FBc0JELGlDQUVDOzs7Ozs7O0lBTUMsNkZBQTZGO0lBQzdGLG1CQUFvQjtJQUVwQiwwQ0FBMEM7SUFDMUMsc0JBQXVCO0lBRXZCLDRDQUE0QztJQUM1QyxZQUFhO0lBRWIscURBQXFEO0lBQ3JELGFBQWM7SUFFZCxrREFBa0Q7SUFDbEQsY0FBZTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQXdCakIsdUNBSUM7OztJQU1DLHVFQUF1RTtJQUN2RSxpQkFBc0I7SUFFdEIsMERBQTBEO0lBQzFELGlCQUFzQjtJQUV0Qiw2Q0FBNkM7SUFDN0Msa0JBQXVCO0lBRXZCLGdEQUFnRDtJQUNoRCxpQkFBc0IiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiogQGxpY2Vuc2VcbiogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4qXG4qIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4qIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiovXG5pbXBvcnQge1N0eWxlU2FuaXRpemVGbn0gZnJvbSAnLi4vLi4vc2FuaXRpemF0aW9uL3N0eWxlX3Nhbml0aXplcic7XG5pbXBvcnQge1Byb2NlZHVyYWxSZW5kZXJlcjMsIFJFbGVtZW50LCBSZW5kZXJlcjN9IGZyb20gJy4uL2ludGVyZmFjZXMvcmVuZGVyZXInO1xuaW1wb3J0IHtMVmlld30gZnJvbSAnLi4vaW50ZXJmYWNlcy92aWV3JztcblxuLyoqXG4gKiAtLS0tLS0tLVxuICpcbiAqIFRoaXMgZmlsZSBjb250YWlucyB0aGUgY29yZSBpbnRlcmZhY2VzIGZvciBzdHlsaW5nIGluIEFuZ3VsYXIuXG4gKlxuICogVG8gbGVhcm4gbW9yZSBhYm91dCB0aGUgYWxnb3JpdGhtIHNlZSBgVFN0eWxpbmdDb250ZXh0YC5cbiAqXG4gKiAtLS0tLS0tLVxuICovXG5cbi8qKlxuICogQSBzdGF0aWMtbGV2ZWwgcmVwcmVzZW50YXRpb24gb2YgYWxsIHN0eWxlIG9yIGNsYXNzIGJpbmRpbmdzL3ZhbHVlc1xuICogYXNzb2NpYXRlZCB3aXRoIGEgYFROb2RlYC5cbiAqXG4gKiBUaGUgYFRTdHlsaW5nQ29udGV4dGAgdW5pdGVzIGFsbCB0ZW1wbGF0ZSBzdHlsaW5nIGJpbmRpbmdzIChpLmUuXG4gKiBgW2NsYXNzXWAgYW5kIGBbc3R5bGVdYCBiaW5kaW5ncykgYXMgd2VsbCBhcyBhbGwgaG9zdC1sZXZlbFxuICogc3R5bGluZyBiaW5kaW5ncyAoZm9yIGNvbXBvbmVudHMgYW5kIGRpcmVjdGl2ZXMpIHRvZ2V0aGVyIGludG9cbiAqIGEgc2luZ2xlIG1hbmlmZXN0LiBJdCBpcyB1c2VkIGVhY2ggdGltZSB0aGVyZSBhcmUgb25lIG9yIG1vcmVcbiAqIHN0eWxpbmcgYmluZGluZ3MgcHJlc2VudCBmb3IgYW4gZWxlbWVudC5cbiAqXG4gKiBUaGUgc3R5bGluZyBjb250ZXh0IGlzIHN0b3JlZCBvbiBhIGBUTm9kZWAgb24gYW5kIHRoZXJlIGFyZVxuICogdHdvIGluc3RhbmNlcyBvZiBpdDogb25lIGZvciBjbGFzc2VzIGFuZCBhbm90aGVyIGZvciBzdHlsZXMuXG4gKlxuICogYGBgdHlwZXNjcmlwdFxuICogdE5vZGUuc3R5bGVzID0gWyAuLi4gYSBjb250ZXh0IG9ubHkgZm9yIHN0eWxlcyAuLi4gXTtcbiAqIHROb2RlLmNsYXNzZXMgPSBbIC4uLiBhIGNvbnRleHQgb25seSBmb3IgY2xhc3NlcyAuLi4gXTtcbiAqIGBgYFxuICpcbiAqIER1ZSB0byB0aGUgZmFjdCB0aGUgdGhlIGBUU3R5bGluZ0NvbnRleHRgIGlzIHN0b3JlZCBvbiBhIGBUTm9kZWBcbiAqIHRoaXMgbWVhbnMgdGhhdCBhbGwgZGF0YSB3aXRoaW4gdGhlIGNvbnRleHQgaXMgc3RhdGljLiBJbnN0ZWFkIG9mXG4gKiBzdG9yaW5nIGFjdHVhbCBzdHlsaW5nIGJpbmRpbmcgdmFsdWVzLCB0aGUgbFZpZXcgYmluZGluZyBpbmRleCB2YWx1ZXNcbiAqIGFyZSBzdG9yZWQgd2l0aGluIHRoZSBjb250ZXh0LiAoc3RhdGljIG5hdHVyZSBtZWFucyBpdCBpcyBtb3JlIGNvbXBhY3QuKVxuXG4gKlxuICogYGBgdHlwZXNjcmlwdFxuICogLy8gPGRpdiBbY2xhc3MuYWN0aXZlXT1cImNcIiAgLy8gbFZpZXcgYmluZGluZyBpbmRleCA9IDIwXG4gKiAvLyAgICAgIFtzdHlsZS53aWR0aF09XCJ4XCIgICAvLyBsVmlldyBiaW5kaW5nIGluZGV4ID0gMjFcbiAqIC8vICAgICAgW3N0eWxlLmhlaWdodF09XCJ5XCI+IC8vIGxWaWV3IGJpbmRpbmcgaW5kZXggPSAyMlxuICogdE5vZGUuc3R5bGVzQ29udGV4dCA9IFtcbiAqICAgMCwgLy8gdGhlIGNvbnRleHQgY29uZmlnIHZhbHVlXG4gKlxuICogICAwYjAwMSwgLy8gZ3VhcmQgbWFzayBmb3Igd2lkdGhcbiAqICAgMiwgLy8gdG90YWwgZW50cmllcyBmb3Igd2lkdGhcbiAqICAgJ3dpZHRoJywgLy8gdGhlIHByb3BlcnR5IG5hbWVcbiAqICAgMjEsIC8vIHRoZSBiaW5kaW5nIGxvY2F0aW9uIGZvciB0aGUgXCJ4XCIgYmluZGluZyBpbiB0aGUgbFZpZXdcbiAqICAgbnVsbCxcbiAqXG4gKiAgIDBiMDEwLCAvLyBndWFyZCBtYXNrIGZvciBoZWlnaHRcbiAqICAgMiwgLy8gdG90YWwgZW50cmllcyBmb3IgaGVpZ2h0XG4gKiAgICdoZWlnaHQnLCAvLyB0aGUgcHJvcGVydHkgbmFtZVxuICogICAyMiwgLy8gdGhlIGJpbmRpbmcgbG9jYXRpb24gZm9yIHRoZSBcInlcIiBiaW5kaW5nIGluIHRoZSBsVmlld1xuICogICBudWxsLFxuICogXTtcbiAqXG4gKiB0Tm9kZS5jbGFzc2VzQ29udGV4dCA9IFtcbiAqICAgMCwgLy8gdGhlIGNvbnRleHQgY29uZmlnIHZhbHVlXG4gKlxuICogICAwYjAwMSwgLy8gZ3VhcmQgbWFzayBmb3IgYWN0aXZlXG4gKiAgIDIsIC8vIHRvdGFsIGVudHJpZXMgZm9yIGFjdGl2ZVxuICogICAnYWN0aXZlJywgLy8gdGhlIHByb3BlcnR5IG5hbWVcbiAqICAgMjAsIC8vIHRoZSBiaW5kaW5nIGxvY2F0aW9uIGZvciB0aGUgXCJjXCIgYmluZGluZyBpbiB0aGUgbFZpZXdcbiAqICAgbnVsbCxcbiAqIF07XG4gKiBgYGBcbiAqXG4gKiBFbnRyeSB2YWx1ZSBwcmVzZW50IGluIGFuIGVudHJ5IChjYWxsZWQgYSB0dXBsZSkgd2l0aGluIHRoZVxuICogc3R5bGluZyBjb250ZXh0IGlzIGFzIGZvbGxvd3M6XG4gKlxuICogYGBgdHlwZXNjcmlwdFxuICogY29udGV4dCA9IFtcbiAqICAgQ09ORklHLCAvLyB0aGUgc3R5bGluZyBjb250ZXh0IGNvbmZpZyB2YWx1ZVxuICogICAvLy4uLlxuICogICBndWFyZE1hc2ssXG4gKiAgIHRvdGFsRW50cmllcyxcbiAqICAgcHJvcE5hbWUsXG4gKiAgIGJpbmRpbmdJbmRpY2VzLi4uLFxuICogICBkZWZhdWx0VmFsdWVcbiAqIF07XG4gKiBgYGBcbiAqXG4gKiBCZWxvdyBpcyBhIGJyZWFrZG93biBvZiBlYWNoIHZhbHVlOlxuICpcbiAqIC0gKipndWFyZE1hc2sqKjpcbiAqICAgQSBudW1lcmljIHZhbHVlIHdoZXJlIGVhY2ggYml0IHJlcHJlc2VudHMgYSBiaW5kaW5nIGluZGV4XG4gKiAgIGxvY2F0aW9uLiBFYWNoIGJpbmRpbmcgaW5kZXggbG9jYXRpb24gaXMgYXNzaWduZWQgYmFzZWQgb25cbiAqICAgYSBsb2NhbCBjb3VudGVyIHZhbHVlIHRoYXQgaW5jcmVtZW50cyBlYWNoIHRpbWUgYW4gaW5zdHJ1Y3Rpb25cbiAqICAgaXMgY2FsbGVkOlxuICpcbiAqIGBgYFxuICogPGRpdiBbc3R5bGUud2lkdGhdPVwieFwiICAgLy8gYmluZGluZyBpbmRleCA9IDIxIChjb3VudGVyIGluZGV4ID0gMClcbiAqICAgICAgW3N0eWxlLmhlaWdodF09XCJ5XCI+IC8vIGJpbmRpbmcgaW5kZXggPSAyMiAoY291bnRlciBpbmRleCA9IDEpXG4gKiBgYGBcbiAqXG4gKiAgIEluIHRoZSBleGFtcGxlIGNvZGUgYWJvdmUsIGlmIHRoZSBgd2lkdGhgIHZhbHVlIHdoZXJlIHRvIGNoYW5nZVxuICogICB0aGVuIHRoZSBmaXJzdCBiaXQgaW4gdGhlIGxvY2FsIGJpdCBtYXNrIHZhbHVlIHdvdWxkIGJlIGZsaXBwZWRcbiAqICAgKGFuZCB0aGUgc2Vjb25kIGJpdCBmb3Igd2hlbiBgaGVpZ2h0YCkuXG4gKlxuICogICBJZiBhbmQgd2hlbiB0aGVyZSBhcmUgbW9yZSB0aGFuIDMyIGJpbmRpbmcgc291cmNlcyBpbiB0aGUgY29udGV4dFxuICogICAobW9yZSB0aGFuIDMyIGBbc3R5bGUvY2xhc3NdYCBiaW5kaW5ncykgdGhlbiB0aGUgYml0IG1hc2tpbmcgd2lsbFxuICogICBvdmVyZmxvdyBhbmQgd2UgYXJlIGxlZnQgd2l0aCBhIHNpdHVhdGlvbiB3aGVyZSBhIGAtMWAgdmFsdWUgd2lsbFxuICogICByZXByZXNlbnQgdGhlIGJpdCBtYXNrLiBEdWUgdG8gdGhlIHdheSB0aGF0IEphdmFTY3JpcHQgaGFuZGxlc1xuICogICBuZWdhdGl2ZSB2YWx1ZXMsIHdoZW4gdGhlIGJpdCBtYXNrIGlzIGAtMWAgdGhlbiBhbGwgYml0cyB3aXRoaW5cbiAqICAgdGhhdCB2YWx1ZSB3aWxsIGJlIGF1dG9tYXRpY2FsbHkgZmxpcHBlZCAodGhpcyBpcyBhIHF1aWNrIGFuZFxuICogICBlZmZpY2llbnQgd2F5IHRvIGZsaXAgYWxsIGJpdHMgb24gdGhlIG1hc2sgd2hlbiBhIHNwZWNpYWwga2luZFxuICogICBvZiBjYWNoaW5nIHNjZW5hcmlvIG9jY3VycyBvciB3aGVuIHRoZXJlIGFyZSBtb3JlIHRoYW4gMzIgYmluZGluZ3MpLlxuICpcbiAqIC0gKip0b3RhbEVudHJpZXMqKjpcbiAqICAgRWFjaCBwcm9wZXJ0eSBwcmVzZW50IGluIHRoZSBjb250YWlucyB2YXJpb3VzIGJpbmRpbmcgc291cmNlcyBvZlxuICogICB3aGVyZSB0aGUgc3R5bGluZyBkYXRhIGNvdWxkIGNvbWUgZnJvbS4gVGhpcyBpbmNsdWRlcyB0ZW1wbGF0ZVxuICogICBsZXZlbCBiaW5kaW5ncywgZGlyZWN0aXZlL2NvbXBvbmVudCBob3N0IGJpbmRpbmdzIGFzIHdlbGwgYXMgdGhlXG4gKiAgIGRlZmF1bHQgdmFsdWUgKG9yIHN0YXRpYyB2YWx1ZSkgYWxsIHdyaXRpbmcgdG8gdGhlIHNhbWUgcHJvcGVydHkuXG4gKiAgIFRoaXMgdmFsdWUgZGVwaWN0cyBob3cgbWFueSBiaW5kaW5nIHNvdXJjZSBlbnRyaWVzIGV4aXN0IGZvciB0aGVcbiAqICAgcHJvcGVydHkuXG4gKlxuICogICBUaGUgcmVhc29uIHdoeSB0aGUgdG90YWxFbnRyaWVzIHZhbHVlIGlzIG5lZWRlZCBpcyBiZWNhdXNlIHRoZVxuICogICBzdHlsaW5nIGNvbnRleHQgaXMgZHluYW1pYyBpbiBzaXplIGFuZCBpdCdzIG5vdCBwb3NzaWJsZVxuICogICBmb3IgdGhlIGZsdXNoaW5nIG9yIHVwZGF0ZSBhbGdvcml0aG1zIHRvIGtub3cgd2hlbiBhbmQgd2hlcmVcbiAqICAgYSBwcm9wZXJ0eSBzdGFydHMgYW5kIGVuZHMgd2l0aG91dCBpdC5cbiAqXG4gKiAtICoqcHJvcE5hbWUqKjpcbiAqICAgVGhlIENTUyBwcm9wZXJ0eSBuYW1lIG9yIGNsYXNzIG5hbWUgKGUuZyBgd2lkdGhgIG9yIGBhY3RpdmVgKS5cbiAqXG4gKiAtICoqYmluZGluZ0luZGljZXMuLi4qKjpcbiAqICAgQSBzZXJpZXMgb2YgbnVtZXJpYyBiaW5kaW5nIHZhbHVlcyB0aGF0IHJlZmxlY3Qgd2hlcmUgaW4gdGhlXG4gKiAgIGxWaWV3IHRvIGZpbmQgdGhlIHN0eWxlL2NsYXNzIHZhbHVlcyBhc3NvY2lhdGVkIHdpdGggdGhlIHByb3BlcnR5LlxuICogICBFYWNoIHZhbHVlIGlzIGluIG9yZGVyIGluIHRlcm1zIG9mIHByaW9yaXR5ICh0ZW1wbGF0ZXMgYXJlIGZpcnN0LFxuICogICB0aGVuIGRpcmVjdGl2ZXMgYW5kIHRoZW4gY29tcG9uZW50cykuIFdoZW4gdGhlIGNvbnRleHQgaXMgZmx1c2hlZFxuICogICBhbmQgdGhlIHN0eWxlL2NsYXNzIHZhbHVlcyBhcmUgYXBwbGllZCB0byB0aGUgZWxlbWVudCAodGhpcyBoYXBwZW5zXG4gKiAgIGluc2lkZSBvZiB0aGUgYHN0eWxpbmdBcHBseWAgaW5zdHJ1Y3Rpb24pIHRoZW4gdGhlIGZsdXNoaW5nIGNvZGVcbiAqICAgd2lsbCBrZWVwIGNoZWNraW5nIGVhY2ggYmluZGluZyBpbmRleCBhZ2FpbnN0IHRoZSBhc3NvY2lhdGVkIGxWaWV3XG4gKiAgIHRvIGZpbmQgdGhlIGZpcnN0IHN0eWxlL2NsYXNzIHZhbHVlIHRoYXQgaXMgbm9uLW51bGwuXG4gKlxuICogLSAqKmRlZmF1bHRWYWx1ZSoqOlxuICogICBUaGlzIGlzIHRoZSBkZWZhdWx0IHRoYXQgd2lsbCBhbHdheXMgYmUgYXBwbGllZCB0byB0aGUgZWxlbWVudCBpZlxuICogICBhbmQgd2hlbiBhbGwgb3RoZXIgYmluZGluZyBzb3VyY2VzIHJldHVybiBhIHJlc3VsdCB0aGF0IGlzIG51bGwuXG4gKiAgIFVzdWFsbHkgdGhpcyB2YWx1ZSBpcyBudWxsIGJ1dCBpdCBjYW4gYWxzbyBiZSBhIHN0YXRpYyB2YWx1ZSB0aGF0XG4gKiAgIGlzIGludGVyY2VwdGVkIHdoZW4gdGhlIHROb2RlIGlzIGZpcnN0IGNvbnN0cnVjdHVyZWQgKGUuZy5cbiAqICAgYDxkaXYgc3R5bGU9XCJ3aWR0aDoyMDBweFwiPmAgaGFzIGEgZGVmYXVsdCB2YWx1ZSBvZiBgMjAwcHhgIGZvclxuICogICB0aGUgYHdpZHRoYCBwcm9wZXJ0eSkuXG4gKlxuICogRWFjaCB0aW1lIGEgbmV3IGJpbmRpbmcgaXMgZW5jb3VudGVyZWQgaXQgaXMgcmVnaXN0ZXJlZCBpbnRvIHRoZVxuICogY29udGV4dC4gVGhlIGNvbnRleHQgdGhlbiBpcyBjb250aW51YWxseSB1cGRhdGVkIHVudGlsIHRoZSBmaXJzdFxuICogc3R5bGluZyBhcHBseSBjYWxsIGhhcyBiZWVuIGNhbGxlZCAodGhpcyBpcyB0cmlnZ2VyZWQgYnkgdGhlXG4gKiBgc3R5bGluZ0FwcGx5KClgIGluc3RydWN0aW9uIGZvciB0aGUgYWN0aXZlIGVsZW1lbnQpLlxuICpcbiAqICMgSG93IFN0eWxlcy9DbGFzc2VzIGFyZSBSZW5kZXJlZFxuICogRWFjaCB0aW1lIGEgc3R5bGluZyBpbnN0cnVjdGlvbiAoZS5nLiBgW2NsYXNzLm5hbWVdYCwgYFtzdHlsZS5wcm9wXWAsXG4gKiBldGMuLi4pIGlzIGV4ZWN1dGVkLCB0aGUgYXNzb2NpYXRlZCBgbFZpZXdgIGZvciB0aGUgdmlldyBpcyB1cGRhdGVkXG4gKiBhdCB0aGUgY3VycmVudCBiaW5kaW5nIGxvY2F0aW9uLiBBbHNvLCB3aGVuIHRoaXMgaGFwcGVucywgYSBsb2NhbFxuICogY291bnRlciB2YWx1ZSBpcyBpbmNyZW1lbnRlZC4gSWYgdGhlIGJpbmRpbmcgdmFsdWUgaGFzIGNoYW5nZWQgdGhlblxuICogYSBsb2NhbCBgYml0TWFza2AgdmFyaWFibGUgaXMgdXBkYXRlZCB3aXRoIHRoZSBzcGVjaWZpYyBiaXQgYmFzZWRcbiAqIG9uIHRoZSBjb3VudGVyIHZhbHVlLlxuICpcbiAqIEJlbG93IGlzIGEgbGlnaHR3ZWlnaHQgZXhhbXBsZSBvZiB3aGF0IGhhcHBlbnMgd2hlbiBhIHNpbmdsZSBzdHlsZVxuICogcHJvcGVydHkgaXMgdXBkYXRlZCAoaS5lLiBgPGRpdiBbc3R5bGUucHJvcF09XCJ2YWxcIj5gKTpcbiAqXG4gKiBgYGB0eXBlc2NyaXB0XG4gKiBmdW5jdGlvbiB1cGRhdGVTdHlsZVByb3AocHJvcDogc3RyaW5nLCB2YWx1ZTogc3RyaW5nKSB7XG4gKiAgIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAqICAgY29uc3QgYmluZGluZ0luZGV4ID0gQklORElOR19JTkRFWCsrO1xuICogICBjb25zdCBpbmRleEZvclN0eWxlID0gbG9jYWxTdHlsZXNDb3VudGVyKys7XG4gKiAgIGlmIChsVmlld1tiaW5kaW5nSW5kZXhdICE9PSB2YWx1ZSkge1xuICogICAgIGxWaWV3W2JpbmRpbmdJbmRleF0gPSB2YWx1ZTtcbiAqICAgICBsb2NhbEJpdE1hc2tGb3JTdHlsZXMgfD0gMSA8PCBpbmRleEZvclN0eWxlO1xuICogICB9XG4gKiB9XG4gKiBgYGBcbiAqXG4gKiAjIyBUaGUgQXBwbHkgQWxnb3JpdGhtXG4gKiBBcyBleHBsYWluZWQgYWJvdmUsIGVhY2ggdGltZSBhIGJpbmRpbmcgdXBkYXRlcyBpdHMgdmFsdWUsIHRoZSByZXN1bHRpbmdcbiAqIHZhbHVlIGlzIHN0b3JlZCBpbiB0aGUgYGxWaWV3YCBhcnJheS4gVGhlc2Ugc3R5bGluZyB2YWx1ZXMgaGF2ZSB5ZXQgdG9cbiAqIGJlIGZsdXNoZWQgdG8gdGhlIGVsZW1lbnQuXG4gKlxuICogT25jZSBhbGwgdGhlIHN0eWxpbmcgaW5zdHJ1Y3Rpb25zIGhhdmUgYmVlbiBldmFsdWF0ZWQsIHRoZW4gdGhlIHN0eWxpbmdcbiAqIGNvbnRleHQocykgYXJlIGZsdXNoZWQgdG8gdGhlIGVsZW1lbnQuIFdoZW4gdGhpcyBoYXBwZW5zLCB0aGUgY29udGV4dCB3aWxsXG4gKiBiZSBpdGVyYXRlZCBvdmVyIChwcm9wZXJ0eSBieSBwcm9wZXJ0eSkgYW5kIGVhY2ggYmluZGluZyBzb3VyY2Ugd2lsbCBiZVxuICogZXhhbWluZWQgYW5kIHRoZSBmaXJzdCBub24tbnVsbCB2YWx1ZSB3aWxsIGJlIGFwcGxpZWQgdG8gdGhlIGVsZW1lbnQuXG4gKlxuICogTGV0J3Mgc2F5IHRoYXQgd2UgdGhlIGZvbGxvd2luZyB0ZW1wbGF0ZSBjb2RlOlxuICpcbiAqIGBgYGh0bWxcbiAqIDxkaXYgW3N0eWxlLndpZHRoXT1cIncxXCIgZGlyLXRoYXQtc2V0LXdpZHRoPVwidzJcIj48L2Rpdj5cbiAqIGBgYFxuICpcbiAqIFRoZXJlIGFyZSB0d28gc3R5bGluZyBiaW5kaW5ncyBpbiB0aGUgY29kZSBhYm92ZSBhbmQgdGhleSBib3RoIHdyaXRlXG4gKiB0byB0aGUgYHdpZHRoYCBwcm9wZXJ0eS4gV2hlbiBzdHlsaW5nIGlzIGZsdXNoZWQgb24gdGhlIGVsZW1lbnQsIHRoZVxuICogYWxnb3JpdGhtIHdpbGwgdHJ5IGFuZCBmaWd1cmUgb3V0IHdoaWNoIG9uZSBvZiB0aGVzZSB2YWx1ZXMgdG8gd3JpdGVcbiAqIHRvIHRoZSBlbGVtZW50LlxuICpcbiAqIEluIG9yZGVyIHRvIGZpZ3VyZSBvdXQgd2hpY2ggdmFsdWUgdG8gYXBwbHksIHRoZSBmb2xsb3dpbmdcbiAqIGJpbmRpbmcgcHJpb3JpdGl6YXRpb24gaXMgYWRoZXJlZCB0bzpcbiAqXG4gKiAgIDEuIEZpcnN0IHRlbXBsYXRlLWxldmVsIHN0eWxpbmcgYmluZGluZ3MgYXJlIGFwcGxpZWQgKGlmIHByZXNlbnQpLlxuICogICAgICBUaGlzIGluY2x1ZGVzIHRoaW5ncyBsaWtlIGBbc3R5bGUud2lkdGhdYCBhbmQgYFtjbGFzcy5hY3RpdmVdYC5cbiAqXG4gKiAgIDIuIFNlY29uZCBhcmUgc3R5bGluZy1sZXZlbCBob3N0IGJpbmRpbmdzIHByZXNlbnQgaW4gZGlyZWN0aXZlcy5cbiAqICAgICAgKGlmIHRoZXJlIGFyZSBzdWIvc3VwZXIgZGlyZWN0aXZlcyBwcmVzZW50IHRoZW4gdGhlIHN1YiBkaXJlY3RpdmVzXG4gKiAgICAgIGFyZSBhcHBsaWVkIGZpcnN0KS5cbiAqXG4gKiAgIDMuIFRoaXJkIGFyZSBzdHlsaW5nLWxldmVsIGhvc3QgYmluZGluZ3MgcHJlc2VudCBpbiBjb21wb25lbnRzLlxuICogICAgICAoaWYgdGhlcmUgYXJlIHN1Yi9zdXBlciBjb21wb25lbnRzIHByZXNlbnQgdGhlbiB0aGUgc3ViIGRpcmVjdGl2ZXNcbiAqICAgICAgYXJlIGFwcGxpZWQgZmlyc3QpLlxuICpcbiAqIFRoaXMgbWVhbnMgdGhhdCBpbiB0aGUgY29kZSBhYm92ZSB0aGUgc3R5bGluZyBiaW5kaW5nIHByZXNlbnQgaW4gdGhlXG4gKiB0ZW1wbGF0ZSBpcyBhcHBsaWVkIGZpcnN0IGFuZCwgb25seSBpZiBpdHMgZmFsc3ksIHRoZW4gdGhlIGRpcmVjdGl2ZVxuICogc3R5bGluZyBiaW5kaW5nIGZvciB3aWR0aCB3aWxsIGJlIGFwcGxpZWQuXG4gKlxuICogIyMjIFdoYXQgYWJvdXQgbWFwLWJhc2VkIHN0eWxpbmcgYmluZGluZ3M/XG4gKiBNYXAtYmFzZWQgc3R5bGluZyBiaW5kaW5ncyBhcmUgYWN0aXZhdGVkIHdoZW4gdGhlcmUgYXJlIG9uZSBvciBtb3JlXG4gKiBgW3N0eWxlXWAgYW5kL29yIGBbY2xhc3NdYCBiaW5kaW5ncyBwcmVzZW50IG9uIGFuIGVsZW1lbnQuIFdoZW4gdGhpc1xuICogY29kZSBpcyBhY3RpdmF0ZWQsIHRoZSBhcHBseSBhbGdvcml0aG0gd2lsbCBpdGVyYXRlIG92ZXIgZWFjaCBtYXBcbiAqIGVudHJ5IGFuZCBhcHBseSBlYWNoIHN0eWxpbmcgdmFsdWUgdG8gdGhlIGVsZW1lbnQgd2l0aCB0aGUgc2FtZVxuICogcHJpb3JpdGl6YXRpb24gcnVsZXMgYXMgYWJvdmUuXG4gKlxuICogRm9yIHRoZSBhbGdvcml0aG0gdG8gYXBwbHkgc3R5bGluZyB2YWx1ZXMgZWZmaWNpZW50bHksIHRoZVxuICogc3R5bGluZyBtYXAgZW50cmllcyBtdXN0IGJlIGFwcGxpZWQgaW4gc3luYyAocHJvcGVydHkgYnkgcHJvcGVydHkpXG4gKiB3aXRoIHByb3AtYmFzZWQgYmluZGluZ3MuIChUaGUgbWFwLWJhc2VkIGFsZ29yaXRobSBpcyBkZXNjcmliZWRcbiAqIG1vcmUgaW5zaWRlIG9mIHRoZSBgcmVuZGVyMy9zdHlsaW5nX25leHQvbWFwX2Jhc2VkX2JpbmRpbmdzLnRzYCBmaWxlLilcbiAqXG4gKiAjIyBTYW5pdGl6YXRpb25cbiAqIFNhbml0aXphdGlvbiBpcyB1c2VkIHRvIHByZXZlbnQgaW52YWxpZCBzdHlsZSB2YWx1ZXMgZnJvbSBiZWluZyBhcHBsaWVkIHRvXG4gKiB0aGUgZWxlbWVudC5cbiAqXG4gKiBJdCBpcyBlbmFibGVkIGluIHR3byBjYXNlczpcbiAqXG4gKiAgIDEuIFRoZSBgc3R5bGVTYW5pdGl6ZXIoc2FuaXRpemVyRm4pYCBpbnN0cnVjdGlvbiB3YXMgY2FsbGVkIChqdXN0IGJlZm9yZSBhbnkgb3RoZXJcbiAqICAgICAgc3R5bGluZyBpbnN0cnVjdGlvbnMgYXJlIHJ1bikuXG4gKlxuICogICAyLiBUaGUgY29tcG9uZW50L2RpcmVjdGl2ZSBgTFZpZXdgIGluc3RhbmNlIGhhcyBhIHNhbml0aXplciBvYmplY3QgYXR0YWNoZWQgdG8gaXRcbiAqICAgICAgKHRoaXMgaGFwcGVucyB3aGVuIGByZW5kZXJDb21wb25lbnRgIGlzIGV4ZWN1dGVkIHdpdGggYSBgc2FuaXRpemVyYCB2YWx1ZSBvclxuICogICAgICBpZiB0aGUgbmdNb2R1bGUgY29udGFpbnMgYSBzYW5pdGl6ZXIgcHJvdmlkZXIgYXR0YWNoZWQgdG8gaXQpLlxuICpcbiAqIElmIGFuZCB3aGVuIHNhbml0aXphdGlvbiBpcyBhY3RpdmUgdGhlbiBhbGwgcHJvcGVydHkvdmFsdWUgZW50cmllcyB3aWxsIGJlIGV2YWx1YXRlZFxuICogdGhyb3VnaCB0aGUgYWN0aXZlIHNhbml0aXplciBiZWZvcmUgdGhleSBhcmUgYXBwbGllZCB0byB0aGUgZWxlbWVudCAob3IgdGhlIHN0eWxpbmdcbiAqIGRlYnVnIGhhbmRsZXIpLlxuICpcbiAqIElmIGEgYFNhbml0aXplcmAgb2JqZWN0IGlzIHVzZWQgKHZpYSB0aGUgYExWaWV3W1NBTklUSVpFUl1gIHZhbHVlKSB0aGVuIHRoYXQgb2JqZWN0XG4gKiB3aWxsIGJlIHVzZWQgZm9yIGV2ZXJ5IHByb3BlcnR5LlxuICpcbiAqIElmIGEgYFN0eWxlU2FuaXRpemVyRm5gIGZ1bmN0aW9uIGlzIHVzZWQgKHZpYSB0aGUgYHN0eWxlU2FuaXRpemVyYCkgdGhlbiBpdCB3aWxsIGJlXG4gKiBjYWxsZWQgaW4gdHdvIHdheXM6XG4gKlxuICogICAxLiBwcm9wZXJ0eSB2YWxpZGF0aW9uIG1vZGU6IHRoaXMgd2lsbCBiZSBjYWxsZWQgZWFybHkgdG8gbWFyayB3aGV0aGVyIGEgcHJvcGVydHlcbiAqICAgICAgc2hvdWxkIGJlIHNhbml0aXplZCBvciBub3QgYXQgZHVyaW5nIHRoZSBmbHVzaGluZyBzdGFnZS5cbiAqXG4gKiAgIDIuIHZhbHVlIHNhbml0aXphdGlvbiBtb2RlOiB0aGlzIHdpbGwgYmUgY2FsbGVkIGR1cmluZyB0aGUgZmx1c2hpbmcgc3RhZ2UgYW5kIHdpbGxcbiAqICAgICAgcnVuIHRoZSBzYW5pdGl6ZXIgZnVuY3Rpb24gYWdhaW5zdCB0aGUgdmFsdWUgYmVmb3JlIGFwcGx5aW5nIGl0IHRvIHRoZSBlbGVtZW50LlxuICpcbiAqIElmIHNhbml0aXphdGlvbiByZXR1cm5zIGFuIGVtcHR5IHZhbHVlIHRoZW4gdGhhdCBlbXB0eSB2YWx1ZSB3aWxsIGJlIGFwcGxpZWRcbiAqIHRvIHRoZSBlbGVtZW50LlxuICovXG5leHBvcnQgaW50ZXJmYWNlIFRTdHlsaW5nQ29udGV4dCBleHRlbmRzIEFycmF5PG51bWJlcnxzdHJpbmd8bnVtYmVyfGJvb2xlYW58bnVsbHxMU3R5bGluZ01hcD4ge1xuICAvKiogQ29uZmlndXJhdGlvbiBkYXRhIGZvciB0aGUgY29udGV4dCAqL1xuICBbVFN0eWxpbmdDb250ZXh0SW5kZXguQ29uZmlnUG9zaXRpb25dOiBUU3R5bGluZ0NvbmZpZ0ZsYWdzO1xuXG4gIC8qKiBUZW1wb3JhcnkgdmFsdWUgdXNlZCB0byB0cmFjayBkaXJlY3RpdmUgaW5kZXggZW50cmllcyB1bnRpbFxuICAgICB0aGUgb2xkIHN0eWxpbmcgY29kZSBpcyBmdWxseSByZW1vdmVkLiBUaGUgcmVhc29uIHdoeSB0aGlzXG4gICAgIGlzIHJlcXVpcmVkIGlzIHRvIGZpZ3VyZSBvdXQgd2hpY2ggZGlyZWN0aXZlIGlzIGxhc3QgYW5kLFxuICAgICB3aGVuIGVuY291bnRlcmVkLCB0cmlnZ2VyIGEgc3R5bGluZyBmbHVzaCB0byBoYXBwZW4gKi9cbiAgW1RTdHlsaW5nQ29udGV4dEluZGV4Lk1heERpcmVjdGl2ZUluZGV4UG9zaXRpb25dOiBudW1iZXI7XG5cbiAgLyoqIFRoZSBiaXQgZ3VhcmQgdmFsdWUgZm9yIGFsbCBtYXAtYmFzZWQgYmluZGluZ3Mgb24gYW4gZWxlbWVudCAqL1xuICBbVFN0eWxpbmdDb250ZXh0SW5kZXguTWFwQmluZGluZ3NCaXRHdWFyZFBvc2l0aW9uXTogbnVtYmVyO1xuXG4gIC8qKiBUaGUgdG90YWwgYW1vdW50IG9mIG1hcC1iYXNlZCBiaW5kaW5ncyBwcmVzZW50IG9uIGFuIGVsZW1lbnQgKi9cbiAgW1RTdHlsaW5nQ29udGV4dEluZGV4Lk1hcEJpbmRpbmdzVmFsdWVzQ291bnRQb3NpdGlvbl06IG51bWJlcjtcblxuICAvKiogVGhlIHByb3AgdmFsdWUgZm9yIG1hcC1iYXNlZCBiaW5kaW5ncyAodGhlcmUgYWN0dWFsbHkgaXNuJ3QgYVxuICAgKiB2YWx1ZSBhdCBhbGwsIGJ1dCB0aGlzIGlzIGp1c3QgdXNlZCBpbiB0aGUgY29udGV4dCB0byBhdm9pZFxuICAgKiBoYXZpbmcgYW55IHNwZWNpYWwgY29kZSB0byB1cGRhdGUgdGhlIGJpbmRpbmcgaW5mb3JtYXRpb24gZm9yXG4gICAqIG1hcC1iYXNlZCBlbnRyaWVzKS4gKi9cbiAgW1RTdHlsaW5nQ29udGV4dEluZGV4Lk1hcEJpbmRpbmdzUHJvcFBvc2l0aW9uXTogc3RyaW5nO1xufVxuXG4vKipcbiAqIEEgc2VyaWVzIG9mIGZsYWdzIHVzZWQgdG8gY29uZmlndXJlIHRoZSBjb25maWcgdmFsdWUgcHJlc2VudCB3aXRoaW4gYVxuICogYFRTdHlsaW5nQ29udGV4dGAgdmFsdWUuXG4gKi9cbmV4cG9ydCBjb25zdCBlbnVtIFRTdHlsaW5nQ29uZmlnRmxhZ3Mge1xuICAvKipcbiAgICogVGhlIGluaXRpYWwgc3RhdGUgb2YgdGhlIHN0eWxpbmcgY29udGV4dCBjb25maWdcbiAgICovXG4gIEluaXRpYWwgPSAwYjAsXG5cbiAgLyoqXG4gICAqIEEgZmxhZyB3aGljaCBtYXJrcyB0aGUgY29udGV4dCBhcyBiZWluZyBsb2NrZWQuXG4gICAqXG4gICAqIFRoZSBzdHlsaW5nIGNvbnRleHQgaXMgY29uc3RydWN0ZWQgYWNyb3NzIGFuIGVsZW1lbnQgdGVtcGxhdGVcbiAgICogZnVuY3Rpb24gYXMgd2VsbCBhcyBhbnkgYXNzb2NpYXRlZCBob3N0QmluZGluZ3MgZnVuY3Rpb25zLiBXaGVuXG4gICAqIHRoaXMgb2NjdXJzLCB0aGUgY29udGV4dCBpdHNlbGYgaXMgb3BlbiB0byBtdXRhdGlvbiBhbmQgb25seSBvbmNlXG4gICAqIGl0IGhhcyBiZWVuIGZsdXNoZWQgb25jZSB0aGVuIGl0IHdpbGwgYmUgbG9ja2VkIGZvciBnb29kIChubyBleHRyYVxuICAgKiBiaW5kaW5ncyBjYW4gYmUgYWRkZWQgdG8gaXQpLlxuICAgKi9cbiAgTG9ja2VkID0gMGIxLFxufVxuXG4vKipcbiAqIEFuIGluZGV4IG9mIHBvc2l0aW9uIGFuZCBvZmZzZXQgdmFsdWVzIHVzZWQgdG8gbmF0aWdhdGUgdGhlIGBUU3R5bGluZ0NvbnRleHRgLlxuICovXG5leHBvcnQgY29uc3QgZW51bSBUU3R5bGluZ0NvbnRleHRJbmRleCB7XG4gIENvbmZpZ1Bvc2l0aW9uID0gMCxcbiAgTWF4RGlyZWN0aXZlSW5kZXhQb3NpdGlvbiA9IDEsXG5cbiAgLy8gaW5kZXgvb2Zmc2V0IHZhbHVlcyBmb3IgbWFwLWJhc2VkIGVudHJpZXMgKGkuZS4gYFtzdHlsZV1gXG4gIC8vIGFuZCBgW2NsYXNzXSBiaW5kaW5ncykuXG4gIE1hcEJpbmRpbmdzUG9zaXRpb24gPSAyLFxuICBNYXBCaW5kaW5nc0JpdEd1YXJkUG9zaXRpb24gPSAyLFxuICBNYXBCaW5kaW5nc1ZhbHVlc0NvdW50UG9zaXRpb24gPSAzLFxuICBNYXBCaW5kaW5nc1Byb3BQb3NpdGlvbiA9IDQsXG4gIE1hcEJpbmRpbmdzQmluZGluZ3NTdGFydFBvc2l0aW9uID0gNSxcblxuICAvLyBlYWNoIHR1cGxlIGVudHJ5IGluIHRoZSBjb250ZXh0XG4gIC8vIChtYXNrLCBjb3VudCwgcHJvcCwgLi4uYmluZGluZ3N8fGRlZmF1bHQtdmFsdWUpXG4gIENvbmZpZ0FuZEd1YXJkT2Zmc2V0ID0gMCxcbiAgVmFsdWVzQ291bnRPZmZzZXQgPSAxLFxuICBQcm9wT2Zmc2V0ID0gMixcbiAgQmluZGluZ3NTdGFydE9mZnNldCA9IDMsXG59XG5cbi8qKlxuICogQSBzZXJpZXMgb2YgZmxhZ3MgdXNlZCBmb3IgZWFjaCBwcm9wZXJ0eSBlbnRyeSB3aXRoaW4gdGhlIGBUU3R5bGluZ0NvbnRleHRgLlxuICovXG5leHBvcnQgY29uc3QgZW51bSBUU3R5bGluZ0NvbnRleHRQcm9wQ29uZmlnRmxhZ3Mge1xuICBEZWZhdWx0ID0gMGIwLFxuICBTYW5pdGl6YXRpb25SZXF1aXJlZCA9IDBiMSxcbiAgVG90YWxCaXRzID0gMSxcbiAgTWFzayA9IDBiMSxcbn1cblxuLyoqXG4gKiBBIGZ1bmN0aW9uIHVzZWQgdG8gYXBwbHkgb3IgcmVtb3ZlIHN0eWxpbmcgZnJvbSBhbiBlbGVtZW50IGZvciBhIGdpdmVuIHByb3BlcnR5LlxuICovXG5leHBvcnQgaW50ZXJmYWNlIEFwcGx5U3R5bGluZ0ZuIHtcbiAgKHJlbmRlcmVyOiBSZW5kZXJlcjN8UHJvY2VkdXJhbFJlbmRlcmVyM3xudWxsLCBlbGVtZW50OiBSRWxlbWVudCwgcHJvcDogc3RyaW5nLFxuICAgdmFsdWU6IHN0cmluZ3xudWxsLCBiaW5kaW5nSW5kZXg/OiBudW1iZXJ8bnVsbCk6IHZvaWQ7XG59XG5cbi8qKlxuICogUnVudGltZSBkYXRhIHR5cGUgdGhhdCBpcyB1c2VkIHRvIHN0b3JlIGJpbmRpbmcgZGF0YSByZWZlcmVuY2VkIGZyb20gdGhlIGBUU3R5bGluZ0NvbnRleHRgLlxuICpcbiAqIEJlY2F1c2UgYExWaWV3YCBpcyBqdXN0IGFuIGFycmF5IHdpdGggZGF0YSwgdGhlcmUgaXMgbm8gcmVhc29uIHRvXG4gKiBzcGVjaWFsIGNhc2UgYExWaWV3YCBldmVyeXdoZXJlIGluIHRoZSBzdHlsaW5nIGFsZ29yaXRobS4gQnkgYWxsb3dpbmdcbiAqIHRoaXMgZGF0YSB0eXBlIHRvIGJlIGFuIGFycmF5IHRoYXQgY29udGFpbnMgdmFyaW91cyBzY2FsYXIgZGF0YSB0eXBlcyxcbiAqIGFuIGluc3RhbmNlIG9mIGBMVmlld2AgZG9lc24ndCBuZWVkIHRvIGJlIGNvbnN0cnVjdGVkIGZvciB0ZXN0cy5cbiAqL1xuZXhwb3J0IHR5cGUgTFN0eWxpbmdEYXRhID0gTFZpZXcgfCAoc3RyaW5nIHwgbnVtYmVyIHwgYm9vbGVhbiB8IG51bGwpW107XG5cbi8qKlxuICogQXJyYXktYmFzZWQgcmVwcmVzZW50YXRpb24gb2YgYSBrZXkvdmFsdWUgYXJyYXkuXG4gKlxuICogVGhlIGZvcm1hdCBvZiB0aGUgYXJyYXkgaXMgXCJwcm9wZXJ0eVwiLCBcInZhbHVlXCIsIFwicHJvcGVydHkyXCIsXG4gKiBcInZhbHVlMlwiLCBldGMuLi5cbiAqXG4gKiBUaGUgZmlyc3QgdmFsdWUgaW4gdGhlIGFycmF5IGlzIHJlc2VydmVkIHRvIHN0b3JlIHRoZSBpbnN0YW5jZVxuICogb2YgdGhlIGtleS92YWx1ZSBhcnJheSB0aGF0IHdhcyB1c2VkIHRvIHBvcHVsYXRlIHRoZSBwcm9wZXJ0eS9cbiAqIHZhbHVlIGVudHJpZXMgdGhhdCB0YWtlIHBsYWNlIGluIHRoZSByZW1haW5kZXIgb2YgdGhlIGFycmF5LlxuICovXG5leHBvcnQgaW50ZXJmYWNlIExTdHlsaW5nTWFwIGV4dGVuZHMgQXJyYXk8e318c3RyaW5nfG51bWJlcnxudWxsPiB7XG4gIFtMU3R5bGluZ01hcEluZGV4LlJhd1ZhbHVlUG9zaXRpb25dOiB7fXxzdHJpbmd8bnVsbDtcbn1cblxuLyoqXG4gKiBBbiBpbmRleCBvZiBwb3NpdGlvbiBhbmQgb2Zmc2V0IHBvaW50cyBmb3IgYW55IGRhdGEgc3RvcmVkIHdpdGhpbiBhIGBMU3R5bGluZ01hcGAgaW5zdGFuY2UuXG4gKi9cbmV4cG9ydCBjb25zdCBlbnVtIExTdHlsaW5nTWFwSW5kZXgge1xuICAvKiogVGhlIGxvY2F0aW9uIG9mIHRoZSByYXcga2V5L3ZhbHVlIG1hcCBpbnN0YW5jZSB1c2VkIGxhc3QgdG8gcG9wdWxhdGUgdGhlIGFycmF5IGVudHJpZXMgKi9cbiAgUmF3VmFsdWVQb3NpdGlvbiA9IDAsXG5cbiAgLyoqIFdoZXJlIHRoZSB2YWx1ZXMgc3RhcnQgaW4gdGhlIGFycmF5ICovXG4gIFZhbHVlc1N0YXJ0UG9zaXRpb24gPSAxLFxuXG4gIC8qKiBUaGUgc2l6ZSBvZiBlYWNoIHByb3BlcnR5L3ZhbHVlIGVudHJ5ICovXG4gIFR1cGxlU2l6ZSA9IDIsXG5cbiAgLyoqIFRoZSBvZmZzZXQgZm9yIHRoZSBwcm9wZXJ0eSBlbnRyeSBpbiB0aGUgdHVwbGUgKi9cbiAgUHJvcE9mZnNldCA9IDAsXG5cbiAgLyoqIFRoZSBvZmZzZXQgZm9yIHRoZSB2YWx1ZSBlbnRyeSBpbiB0aGUgdHVwbGUgKi9cbiAgVmFsdWVPZmZzZXQgPSAxLFxufVxuXG4vKipcbiAqIFVzZWQgdG8gYXBwbHkvdHJhdmVyc2UgYWNyb3NzIGFsbCBtYXAtYmFzZWQgc3R5bGluZyBlbnRyaWVzIHVwIHRvIHRoZSBwcm92aWRlZCBgdGFyZ2V0UHJvcGBcbiAqIHZhbHVlLlxuICpcbiAqIFdoZW4gY2FsbGVkLCBlYWNoIG9mIHRoZSBtYXAtYmFzZWQgYExTdHlsaW5nTWFwYCBlbnRyaWVzICh3aGljaCBhcmUgc3RvcmVkIGluXG4gKiB0aGUgcHJvdmlkZWQgYExTdHlsaW5nRGF0YWAgYXJyYXkpIHdpbGwgYmUgaXRlcmF0ZWQgb3Zlci4gRGVwZW5kaW5nIG9uIHRoZSBwcm92aWRlZFxuICogYG1vZGVgIHZhbHVlLCBlYWNoIHByb3AvdmFsdWUgZW50cnkgbWF5IGJlIGFwcGxpZWQgb3Igc2tpcHBlZCBvdmVyLlxuICpcbiAqIElmIGB0YXJnZXRQcm9wYCB2YWx1ZSBpcyBwcm92aWRlZCB0aGUgaXRlcmF0aW9uIGNvZGUgd2lsbCBzdG9wIG9uY2UgaXQgcmVhY2hlc1xuICogdGhlIHByb3BlcnR5IChpZiBmb3VuZCkuIE90aGVyd2lzZSBpZiB0aGUgdGFyZ2V0IHByb3BlcnR5IGlzIG5vdCBlbmNvdW50ZXJlZCB0aGVuXG4gKiBpdCB3aWxsIHN0b3Agb25jZSBpdCByZWFjaGVzIHRoZSBuZXh0IHZhbHVlIHRoYXQgYXBwZWFycyBhbHBoYWJldGljYWxseSBhZnRlciBpdC5cbiAqXG4gKiBJZiBhIGBkZWZhdWx0VmFsdWVgIGlzIHByb3ZpZGVkIHRoZW4gaXQgd2lsbCBiZSBhcHBsaWVkIHRvIHRoZSBlbGVtZW50IG9ubHkgaWYgdGhlXG4gKiBgdGFyZ2V0UHJvcGAgcHJvcGVydHkgdmFsdWUgaXMgZW5jb3VudGVyZWQgYW5kIHRoZSB2YWx1ZSBhc3NvY2lhdGVkIHdpdGggdGhlIHRhcmdldFxuICogcHJvcGVydHkgaXMgYG51bGxgLiBUaGUgcmVhc29uIHdoeSB0aGUgYGRlZmF1bHRWYWx1ZWAgaXMgbmVlZGVkIGlzIHRvIGF2b2lkIGhhdmluZyB0aGVcbiAqIGFsZ29yaXRobSBhcHBseSBhIGBudWxsYCB2YWx1ZSBhbmQgdGhlbiBhcHBseSBhIGRlZmF1bHQgdmFsdWUgYWZ0ZXJ3YXJkcyAodGhpcyB3b3VsZFxuICogZW5kIHVwIGJlaW5nIHR3byBzdHlsZSBwcm9wZXJ0eSB3cml0ZXMpLlxuICpcbiAqIEByZXR1cm5zIHdoZXRoZXIgb3Igbm90IHRoZSB0YXJnZXQgcHJvcGVydHkgd2FzIHJlYWNoZWQgYW5kIGl0cyB2YWx1ZSB3YXNcbiAqICBhcHBsaWVkIHRvIHRoZSBlbGVtZW50LlxuICovXG5leHBvcnQgaW50ZXJmYWNlIFN5bmNTdHlsaW5nTWFwc0ZuIHtcbiAgKGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgcmVuZGVyZXI6IFJlbmRlcmVyM3xQcm9jZWR1cmFsUmVuZGVyZXIzfG51bGwsIGVsZW1lbnQ6IFJFbGVtZW50LFxuICAgZGF0YTogTFN0eWxpbmdEYXRhLCBhcHBseVN0eWxpbmdGbjogQXBwbHlTdHlsaW5nRm4sIHNhbml0aXplcjogU3R5bGVTYW5pdGl6ZUZufG51bGwsXG4gICBtb2RlOiBTdHlsaW5nTWFwc1N5bmNNb2RlLCB0YXJnZXRQcm9wPzogc3RyaW5nfG51bGwsIGRlZmF1bHRWYWx1ZT86IHN0cmluZ3xudWxsKTogYm9vbGVhbjtcbn1cblxuLyoqXG4gKiBVc2VkIHRvIGRpcmVjdCBob3cgbWFwLWJhc2VkIHZhbHVlcyBhcmUgYXBwbGllZC90cmF2ZXJzZWQgd2hlbiBzdHlsaW5nIGlzIGZsdXNoZWQuXG4gKi9cbmV4cG9ydCBjb25zdCBlbnVtIFN0eWxpbmdNYXBzU3luY01vZGUge1xuICAvKiogT25seSB0cmF2ZXJzZSB2YWx1ZXMgKG5vIHByb3AvdmFsdWUgc3R5bGluZyBlbnRyaWVzIGdldCBhcHBsaWVkKSAqL1xuICBUcmF2ZXJzZVZhbHVlcyA9IDBiMDAwLFxuXG4gIC8qKiBBcHBseSBldmVyeSBwcm9wL3ZhbHVlIHN0eWxpbmcgZW50cnkgdG8gdGhlIGVsZW1lbnQgKi9cbiAgQXBwbHlBbGxWYWx1ZXMgPSAwYjAwMSxcblxuICAvKiogT25seSBhcHBseSB0aGUgdGFyZ2V0IHByb3AvdmFsdWUgZW50cnkgKi9cbiAgQXBwbHlUYXJnZXRQcm9wID0gMGIwMTAsXG5cbiAgLyoqIFNraXAgYXBwbHlpbmcgdGhlIHRhcmdldCBwcm9wL3ZhbHVlIGVudHJ5ICovXG4gIFNraXBUYXJnZXRQcm9wID0gMGIxMDAsXG59XG4iXX0=