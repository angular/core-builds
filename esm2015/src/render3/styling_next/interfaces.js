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
 * 1. First template-level styling bindings are applied (if present).
 *    This includes things like `[style.width]` and `[class.active]`.
 *
 * 2. Second are styling-level host bindings present in directives.
 *    (if there are sub/super directives present then the sub directives
 *    are applied first).
 *
 * 3. Third are styling-level host bindings present in components.
 *    (if there are sub/super components present then the sub directives
 *    are applied first).
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
 * more inside of the `render3/stlying_next/map_based_bindings.ts` file.)
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
    GuardOffset: 0,
    ValuesCountOffset: 1,
    PropOffset: 2,
    BindingsStartOffset: 3,
};
export { TStylingContextIndex };
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW50ZXJmYWNlcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvc3R5bGluZ19uZXh0L2ludGVyZmFjZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBcU9BLHFDQXFCQzs7Ozs7Ozs7Ozs7Ozs7O0lBT0M7O09BRUc7SUFDSCxVQUFhO0lBRWI7Ozs7Ozs7O09BUUc7SUFDSCxTQUFZOzs7OztJQU9aLGlCQUFrQjtJQUNsQiw0QkFBNkI7SUFFN0IsNERBQTREO0lBQzVELDBCQUEwQjtJQUMxQixzQkFBdUI7SUFDdkIsOEJBQStCO0lBQy9CLGlDQUFrQztJQUNsQywwQkFBMkI7SUFDM0IsbUNBQW9DO0lBRXBDLGtDQUFrQztJQUNsQyxrREFBa0Q7SUFDbEQsY0FBZTtJQUNmLG9CQUFxQjtJQUNyQixhQUFjO0lBQ2Qsc0JBQXVCOzs7Ozs7O0FBTXpCLG9DQUdDOzs7Ozs7Ozs7Ozs7QUFzQkQsaUNBRUM7Ozs7Ozs7SUFNQyw2RkFBNkY7SUFDN0YsbUJBQW9CO0lBRXBCLDBDQUEwQztJQUMxQyxzQkFBdUI7SUFFdkIsNENBQTRDO0lBQzVDLFlBQWE7SUFFYixxREFBcUQ7SUFDckQsYUFBYztJQUVkLGtEQUFrRDtJQUNsRCxjQUFlOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBd0JqQix1Q0FJQzs7O0lBTUMsdUVBQXVFO0lBQ3ZFLGlCQUFzQjtJQUV0QiwwREFBMEQ7SUFDMUQsaUJBQXNCO0lBRXRCLDZDQUE2QztJQUM3QyxrQkFBdUI7SUFFdkIsZ0RBQWdEO0lBQ2hELGlCQUFzQiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuKiBAbGljZW5zZVxuKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbipcbiogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuKi9cbmltcG9ydCB7UHJvY2VkdXJhbFJlbmRlcmVyMywgUkVsZW1lbnQsIFJlbmRlcmVyM30gZnJvbSAnLi4vaW50ZXJmYWNlcy9yZW5kZXJlcic7XG5pbXBvcnQge0xWaWV3fSBmcm9tICcuLi9pbnRlcmZhY2VzL3ZpZXcnO1xuXG4vKipcbiAqIC0tLS0tLS0tXG4gKlxuICogVGhpcyBmaWxlIGNvbnRhaW5zIHRoZSBjb3JlIGludGVyZmFjZXMgZm9yIHN0eWxpbmcgaW4gQW5ndWxhci5cbiAqXG4gKiBUbyBsZWFybiBtb3JlIGFib3V0IHRoZSBhbGdvcml0aG0gc2VlIGBUU3R5bGluZ0NvbnRleHRgLlxuICpcbiAqIC0tLS0tLS0tXG4gKi9cblxuLyoqXG4gKiBBIHN0YXRpYy1sZXZlbCByZXByZXNlbnRhdGlvbiBvZiBhbGwgc3R5bGUgb3IgY2xhc3MgYmluZGluZ3MvdmFsdWVzXG4gKiBhc3NvY2lhdGVkIHdpdGggYSBgVE5vZGVgLlxuICpcbiAqIFRoZSBgVFN0eWxpbmdDb250ZXh0YCB1bml0ZXMgYWxsIHRlbXBsYXRlIHN0eWxpbmcgYmluZGluZ3MgKGkuZS5cbiAqIGBbY2xhc3NdYCBhbmQgYFtzdHlsZV1gIGJpbmRpbmdzKSBhcyB3ZWxsIGFzIGFsbCBob3N0LWxldmVsXG4gKiBzdHlsaW5nIGJpbmRpbmdzIChmb3IgY29tcG9uZW50cyBhbmQgZGlyZWN0aXZlcykgdG9nZXRoZXIgaW50b1xuICogYSBzaW5nbGUgbWFuaWZlc3QuIEl0IGlzIHVzZWQgZWFjaCB0aW1lIHRoZXJlIGFyZSBvbmUgb3IgbW9yZVxuICogc3R5bGluZyBiaW5kaW5ncyBwcmVzZW50IGZvciBhbiBlbGVtZW50LlxuICpcbiAqIFRoZSBzdHlsaW5nIGNvbnRleHQgaXMgc3RvcmVkIG9uIGEgYFROb2RlYCBvbiBhbmQgdGhlcmUgYXJlXG4gKiB0d28gaW5zdGFuY2VzIG9mIGl0OiBvbmUgZm9yIGNsYXNzZXMgYW5kIGFub3RoZXIgZm9yIHN0eWxlcy5cbiAqXG4gKiBgYGB0eXBlc2NyaXB0XG4gKiB0Tm9kZS5zdHlsZXMgPSBbIC4uLiBhIGNvbnRleHQgb25seSBmb3Igc3R5bGVzIC4uLiBdO1xuICogdE5vZGUuY2xhc3NlcyA9IFsgLi4uIGEgY29udGV4dCBvbmx5IGZvciBjbGFzc2VzIC4uLiBdO1xuICogYGBgXG4gKlxuICogRHVlIHRvIHRoZSBmYWN0IHRoZSB0aGUgYFRTdHlsaW5nQ29udGV4dGAgaXMgc3RvcmVkIG9uIGEgYFROb2RlYFxuICogdGhpcyBtZWFucyB0aGF0IGFsbCBkYXRhIHdpdGhpbiB0aGUgY29udGV4dCBpcyBzdGF0aWMuIEluc3RlYWQgb2ZcbiAqIHN0b3JpbmcgYWN0dWFsIHN0eWxpbmcgYmluZGluZyB2YWx1ZXMsIHRoZSBsVmlldyBiaW5kaW5nIGluZGV4IHZhbHVlc1xuICogYXJlIHN0b3JlZCB3aXRoaW4gdGhlIGNvbnRleHQuIChzdGF0aWMgbmF0dXJlIG1lYW5zIGl0IGlzIG1vcmUgY29tcGFjdC4pXG5cbiAqXG4gKiBgYGB0eXBlc2NyaXB0XG4gKiAvLyA8ZGl2IFtjbGFzcy5hY3RpdmVdPVwiY1wiICAvLyBsVmlldyBiaW5kaW5nIGluZGV4ID0gMjBcbiAqIC8vICAgICAgW3N0eWxlLndpZHRoXT1cInhcIiAgIC8vIGxWaWV3IGJpbmRpbmcgaW5kZXggPSAyMVxuICogLy8gICAgICBbc3R5bGUuaGVpZ2h0XT1cInlcIj4gLy8gbFZpZXcgYmluZGluZyBpbmRleCA9IDIyXG4gKiB0Tm9kZS5zdHlsZXNDb250ZXh0ID0gW1xuICogICAwLCAvLyB0aGUgY29udGV4dCBjb25maWcgdmFsdWVcbiAqXG4gKiAgIDBiMDAxLCAvLyBndWFyZCBtYXNrIGZvciB3aWR0aFxuICogICAyLCAvLyB0b3RhbCBlbnRyaWVzIGZvciB3aWR0aFxuICogICAnd2lkdGgnLCAvLyB0aGUgcHJvcGVydHkgbmFtZVxuICogICAyMSwgLy8gdGhlIGJpbmRpbmcgbG9jYXRpb24gZm9yIHRoZSBcInhcIiBiaW5kaW5nIGluIHRoZSBsVmlld1xuICogICBudWxsLFxuICpcbiAqICAgMGIwMTAsIC8vIGd1YXJkIG1hc2sgZm9yIGhlaWdodFxuICogICAyLCAvLyB0b3RhbCBlbnRyaWVzIGZvciBoZWlnaHRcbiAqICAgJ2hlaWdodCcsIC8vIHRoZSBwcm9wZXJ0eSBuYW1lXG4gKiAgIDIyLCAvLyB0aGUgYmluZGluZyBsb2NhdGlvbiBmb3IgdGhlIFwieVwiIGJpbmRpbmcgaW4gdGhlIGxWaWV3XG4gKiAgIG51bGwsXG4gKiBdO1xuICpcbiAqIHROb2RlLmNsYXNzZXNDb250ZXh0ID0gW1xuICogICAwLCAvLyB0aGUgY29udGV4dCBjb25maWcgdmFsdWVcbiAqXG4gKiAgIDBiMDAxLCAvLyBndWFyZCBtYXNrIGZvciBhY3RpdmVcbiAqICAgMiwgLy8gdG90YWwgZW50cmllcyBmb3IgYWN0aXZlXG4gKiAgICdhY3RpdmUnLCAvLyB0aGUgcHJvcGVydHkgbmFtZVxuICogICAyMCwgLy8gdGhlIGJpbmRpbmcgbG9jYXRpb24gZm9yIHRoZSBcImNcIiBiaW5kaW5nIGluIHRoZSBsVmlld1xuICogICBudWxsLFxuICogXTtcbiAqIGBgYFxuICpcbiAqIEVudHJ5IHZhbHVlIHByZXNlbnQgaW4gYW4gZW50cnkgKGNhbGxlZCBhIHR1cGxlKSB3aXRoaW4gdGhlXG4gKiBzdHlsaW5nIGNvbnRleHQgaXMgYXMgZm9sbG93czpcbiAqXG4gKiBgYGB0eXBlc2NyaXB0XG4gKiBjb250ZXh0ID0gW1xuICogICBDT05GSUcsIC8vIHRoZSBzdHlsaW5nIGNvbnRleHQgY29uZmlnIHZhbHVlXG4gKiAgIC8vLi4uXG4gKiAgIGd1YXJkTWFzayxcbiAqICAgdG90YWxFbnRyaWVzLFxuICogICBwcm9wTmFtZSxcbiAqICAgYmluZGluZ0luZGljZXMuLi4sXG4gKiAgIGRlZmF1bHRWYWx1ZVxuICogXTtcbiAqIGBgYFxuICpcbiAqIEJlbG93IGlzIGEgYnJlYWtkb3duIG9mIGVhY2ggdmFsdWU6XG4gKlxuICogLSAqKmd1YXJkTWFzayoqOlxuICogICBBIG51bWVyaWMgdmFsdWUgd2hlcmUgZWFjaCBiaXQgcmVwcmVzZW50cyBhIGJpbmRpbmcgaW5kZXhcbiAqICAgbG9jYXRpb24uIEVhY2ggYmluZGluZyBpbmRleCBsb2NhdGlvbiBpcyBhc3NpZ25lZCBiYXNlZCBvblxuICogICBhIGxvY2FsIGNvdW50ZXIgdmFsdWUgdGhhdCBpbmNyZW1lbnRzIGVhY2ggdGltZSBhbiBpbnN0cnVjdGlvblxuICogICBpcyBjYWxsZWQ6XG4gKlxuICogYGBgXG4gKiA8ZGl2IFtzdHlsZS53aWR0aF09XCJ4XCIgICAvLyBiaW5kaW5nIGluZGV4ID0gMjEgKGNvdW50ZXIgaW5kZXggPSAwKVxuICogICAgICBbc3R5bGUuaGVpZ2h0XT1cInlcIj4gLy8gYmluZGluZyBpbmRleCA9IDIyIChjb3VudGVyIGluZGV4ID0gMSlcbiAqIGBgYFxuICpcbiAqICAgSW4gdGhlIGV4YW1wbGUgY29kZSBhYm92ZSwgaWYgdGhlIGB3aWR0aGAgdmFsdWUgd2hlcmUgdG8gY2hhbmdlXG4gKiAgIHRoZW4gdGhlIGZpcnN0IGJpdCBpbiB0aGUgbG9jYWwgYml0IG1hc2sgdmFsdWUgd291bGQgYmUgZmxpcHBlZFxuICogICAoYW5kIHRoZSBzZWNvbmQgYml0IGZvciB3aGVuIGBoZWlnaHRgKS5cbiAqXG4gKiAgIElmIGFuZCB3aGVuIHRoZXJlIGFyZSBtb3JlIHRoYW4gMzIgYmluZGluZyBzb3VyY2VzIGluIHRoZSBjb250ZXh0XG4gKiAgIChtb3JlIHRoYW4gMzIgYFtzdHlsZS9jbGFzc11gIGJpbmRpbmdzKSB0aGVuIHRoZSBiaXQgbWFza2luZyB3aWxsXG4gKiAgIG92ZXJmbG93IGFuZCB3ZSBhcmUgbGVmdCB3aXRoIGEgc2l0dWF0aW9uIHdoZXJlIGEgYC0xYCB2YWx1ZSB3aWxsXG4gKiAgIHJlcHJlc2VudCB0aGUgYml0IG1hc2suIER1ZSB0byB0aGUgd2F5IHRoYXQgSmF2YVNjcmlwdCBoYW5kbGVzXG4gKiAgIG5lZ2F0aXZlIHZhbHVlcywgd2hlbiB0aGUgYml0IG1hc2sgaXMgYC0xYCB0aGVuIGFsbCBiaXRzIHdpdGhpblxuICogICB0aGF0IHZhbHVlIHdpbGwgYmUgYXV0b21hdGljYWxseSBmbGlwcGVkICh0aGlzIGlzIGEgcXVpY2sgYW5kXG4gKiAgIGVmZmljaWVudCB3YXkgdG8gZmxpcCBhbGwgYml0cyBvbiB0aGUgbWFzayB3aGVuIGEgc3BlY2lhbCBraW5kXG4gKiAgIG9mIGNhY2hpbmcgc2NlbmFyaW8gb2NjdXJzIG9yIHdoZW4gdGhlcmUgYXJlIG1vcmUgdGhhbiAzMiBiaW5kaW5ncykuXG4gKlxuICogLSAqKnRvdGFsRW50cmllcyoqOlxuICogICBFYWNoIHByb3BlcnR5IHByZXNlbnQgaW4gdGhlIGNvbnRhaW5zIHZhcmlvdXMgYmluZGluZyBzb3VyY2VzIG9mXG4gKiAgIHdoZXJlIHRoZSBzdHlsaW5nIGRhdGEgY291bGQgY29tZSBmcm9tLiBUaGlzIGluY2x1ZGVzIHRlbXBsYXRlXG4gKiAgIGxldmVsIGJpbmRpbmdzLCBkaXJlY3RpdmUvY29tcG9uZW50IGhvc3QgYmluZGluZ3MgYXMgd2VsbCBhcyB0aGVcbiAqICAgZGVmYXVsdCB2YWx1ZSAob3Igc3RhdGljIHZhbHVlKSBhbGwgd3JpdGluZyB0byB0aGUgc2FtZSBwcm9wZXJ0eS5cbiAqICAgVGhpcyB2YWx1ZSBkZXBpY3RzIGhvdyBtYW55IGJpbmRpbmcgc291cmNlIGVudHJpZXMgZXhpc3QgZm9yIHRoZVxuICogICBwcm9wZXJ0eS5cbiAqXG4gKiAgIFRoZSByZWFzb24gd2h5IHRoZSB0b3RhbEVudHJpZXMgdmFsdWUgaXMgbmVlZGVkIGlzIGJlY2F1c2UgdGhlXG4gKiAgIHN0eWxpbmcgY29udGV4dCBpcyBkeW5hbWljIGluIHNpemUgYW5kIGl0J3Mgbm90IHBvc3NpYmxlXG4gKiAgIGZvciB0aGUgZmx1c2hpbmcgb3IgdXBkYXRlIGFsZ29yaXRobXMgdG8ga25vdyB3aGVuIGFuZCB3aGVyZVxuICogICBhIHByb3BlcnR5IHN0YXJ0cyBhbmQgZW5kcyB3aXRob3V0IGl0LlxuICpcbiAqIC0gKipwcm9wTmFtZSoqOlxuICogICBUaGUgQ1NTIHByb3BlcnR5IG5hbWUgb3IgY2xhc3MgbmFtZSAoZS5nIGB3aWR0aGAgb3IgYGFjdGl2ZWApLlxuICpcbiAqIC0gKipiaW5kaW5nSW5kaWNlcy4uLioqOlxuICogICBBIHNlcmllcyBvZiBudW1lcmljIGJpbmRpbmcgdmFsdWVzIHRoYXQgcmVmbGVjdCB3aGVyZSBpbiB0aGVcbiAqICAgbFZpZXcgdG8gZmluZCB0aGUgc3R5bGUvY2xhc3MgdmFsdWVzIGFzc29jaWF0ZWQgd2l0aCB0aGUgcHJvcGVydHkuXG4gKiAgIEVhY2ggdmFsdWUgaXMgaW4gb3JkZXIgaW4gdGVybXMgb2YgcHJpb3JpdHkgKHRlbXBsYXRlcyBhcmUgZmlyc3QsXG4gKiAgIHRoZW4gZGlyZWN0aXZlcyBhbmQgdGhlbiBjb21wb25lbnRzKS4gV2hlbiB0aGUgY29udGV4dCBpcyBmbHVzaGVkXG4gKiAgIGFuZCB0aGUgc3R5bGUvY2xhc3MgdmFsdWVzIGFyZSBhcHBsaWVkIHRvIHRoZSBlbGVtZW50ICh0aGlzIGhhcHBlbnNcbiAqICAgaW5zaWRlIG9mIHRoZSBgc3R5bGluZ0FwcGx5YCBpbnN0cnVjdGlvbikgdGhlbiB0aGUgZmx1c2hpbmcgY29kZVxuICogICB3aWxsIGtlZXAgY2hlY2tpbmcgZWFjaCBiaW5kaW5nIGluZGV4IGFnYWluc3QgdGhlIGFzc29jaWF0ZWQgbFZpZXdcbiAqICAgdG8gZmluZCB0aGUgZmlyc3Qgc3R5bGUvY2xhc3MgdmFsdWUgdGhhdCBpcyBub24tbnVsbC5cbiAqXG4gKiAtICoqZGVmYXVsdFZhbHVlKio6XG4gKiAgIFRoaXMgaXMgdGhlIGRlZmF1bHQgdGhhdCB3aWxsIGFsd2F5cyBiZSBhcHBsaWVkIHRvIHRoZSBlbGVtZW50IGlmXG4gKiAgIGFuZCB3aGVuIGFsbCBvdGhlciBiaW5kaW5nIHNvdXJjZXMgcmV0dXJuIGEgcmVzdWx0IHRoYXQgaXMgbnVsbC5cbiAqICAgVXN1YWxseSB0aGlzIHZhbHVlIGlzIG51bGwgYnV0IGl0IGNhbiBhbHNvIGJlIGEgc3RhdGljIHZhbHVlIHRoYXRcbiAqICAgaXMgaW50ZXJjZXB0ZWQgd2hlbiB0aGUgdE5vZGUgaXMgZmlyc3QgY29uc3RydWN0dXJlZCAoZS5nLlxuICogICBgPGRpdiBzdHlsZT1cIndpZHRoOjIwMHB4XCI+YCBoYXMgYSBkZWZhdWx0IHZhbHVlIG9mIGAyMDBweGAgZm9yXG4gKiAgIHRoZSBgd2lkdGhgIHByb3BlcnR5KS5cbiAqXG4gKiBFYWNoIHRpbWUgYSBuZXcgYmluZGluZyBpcyBlbmNvdW50ZXJlZCBpdCBpcyByZWdpc3RlcmVkIGludG8gdGhlXG4gKiBjb250ZXh0LiBUaGUgY29udGV4dCB0aGVuIGlzIGNvbnRpbnVhbGx5IHVwZGF0ZWQgdW50aWwgdGhlIGZpcnN0XG4gKiBzdHlsaW5nIGFwcGx5IGNhbGwgaGFzIGJlZW4gY2FsbGVkICh0aGlzIGlzIHRyaWdnZXJlZCBieSB0aGVcbiAqIGBzdHlsaW5nQXBwbHkoKWAgaW5zdHJ1Y3Rpb24gZm9yIHRoZSBhY3RpdmUgZWxlbWVudCkuXG4gKlxuICogIyBIb3cgU3R5bGVzL0NsYXNzZXMgYXJlIFJlbmRlcmVkXG4gKiBFYWNoIHRpbWUgYSBzdHlsaW5nIGluc3RydWN0aW9uIChlLmcuIGBbY2xhc3MubmFtZV1gLCBgW3N0eWxlLnByb3BdYCxcbiAqIGV0Yy4uLikgaXMgZXhlY3V0ZWQsIHRoZSBhc3NvY2lhdGVkIGBsVmlld2AgZm9yIHRoZSB2aWV3IGlzIHVwZGF0ZWRcbiAqIGF0IHRoZSBjdXJyZW50IGJpbmRpbmcgbG9jYXRpb24uIEFsc28sIHdoZW4gdGhpcyBoYXBwZW5zLCBhIGxvY2FsXG4gKiBjb3VudGVyIHZhbHVlIGlzIGluY3JlbWVudGVkLiBJZiB0aGUgYmluZGluZyB2YWx1ZSBoYXMgY2hhbmdlZCB0aGVuXG4gKiBhIGxvY2FsIGBiaXRNYXNrYCB2YXJpYWJsZSBpcyB1cGRhdGVkIHdpdGggdGhlIHNwZWNpZmljIGJpdCBiYXNlZFxuICogb24gdGhlIGNvdW50ZXIgdmFsdWUuXG4gKlxuICogQmVsb3cgaXMgYSBsaWdodHdlaWdodCBleGFtcGxlIG9mIHdoYXQgaGFwcGVucyB3aGVuIGEgc2luZ2xlIHN0eWxlXG4gKiBwcm9wZXJ0eSBpcyB1cGRhdGVkIChpLmUuIGA8ZGl2IFtzdHlsZS5wcm9wXT1cInZhbFwiPmApOlxuICpcbiAqIGBgYHR5cGVzY3JpcHRcbiAqIGZ1bmN0aW9uIHVwZGF0ZVN0eWxlUHJvcChwcm9wOiBzdHJpbmcsIHZhbHVlOiBzdHJpbmcpIHtcbiAqICAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICogICBjb25zdCBiaW5kaW5nSW5kZXggPSBCSU5ESU5HX0lOREVYKys7XG4gKiAgIGNvbnN0IGluZGV4Rm9yU3R5bGUgPSBsb2NhbFN0eWxlc0NvdW50ZXIrKztcbiAqICAgaWYgKGxWaWV3W2JpbmRpbmdJbmRleF0gIT09IHZhbHVlKSB7XG4gKiAgICAgbFZpZXdbYmluZGluZ0luZGV4XSA9IHZhbHVlO1xuICogICAgIGxvY2FsQml0TWFza0ZvclN0eWxlcyB8PSAxIDw8IGluZGV4Rm9yU3R5bGU7XG4gKiAgIH1cbiAqIH1cbiAqIGBgYFxuICpcbiAqICMjIFRoZSBBcHBseSBBbGdvcml0aG1cbiAqIEFzIGV4cGxhaW5lZCBhYm92ZSwgZWFjaCB0aW1lIGEgYmluZGluZyB1cGRhdGVzIGl0cyB2YWx1ZSwgdGhlIHJlc3VsdGluZ1xuICogdmFsdWUgaXMgc3RvcmVkIGluIHRoZSBgbFZpZXdgIGFycmF5LiBUaGVzZSBzdHlsaW5nIHZhbHVlcyBoYXZlIHlldCB0b1xuICogYmUgZmx1c2hlZCB0byB0aGUgZWxlbWVudC5cbiAqXG4gKiBPbmNlIGFsbCB0aGUgc3R5bGluZyBpbnN0cnVjdGlvbnMgaGF2ZSBiZWVuIGV2YWx1YXRlZCwgdGhlbiB0aGUgc3R5bGluZ1xuICogY29udGV4dChzKSBhcmUgZmx1c2hlZCB0byB0aGUgZWxlbWVudC4gV2hlbiB0aGlzIGhhcHBlbnMsIHRoZSBjb250ZXh0IHdpbGxcbiAqIGJlIGl0ZXJhdGVkIG92ZXIgKHByb3BlcnR5IGJ5IHByb3BlcnR5KSBhbmQgZWFjaCBiaW5kaW5nIHNvdXJjZSB3aWxsIGJlXG4gKiBleGFtaW5lZCBhbmQgdGhlIGZpcnN0IG5vbi1udWxsIHZhbHVlIHdpbGwgYmUgYXBwbGllZCB0byB0aGUgZWxlbWVudC5cbiAqXG4gKiBMZXQncyBzYXkgdGhhdCB3ZSB0aGUgZm9sbG93aW5nIHRlbXBsYXRlIGNvZGU6XG4gKlxuICogYGBgaHRtbFxuICogPGRpdiBbc3R5bGUud2lkdGhdPVwidzFcIiBkaXItdGhhdC1zZXQtd2lkdGg9XCJ3MlwiPjwvZGl2PlxuICogYGBgXG4gKlxuICogVGhlcmUgYXJlIHR3byBzdHlsaW5nIGJpbmRpbmdzIGluIHRoZSBjb2RlIGFib3ZlIGFuZCB0aGV5IGJvdGggd3JpdGVcbiAqIHRvIHRoZSBgd2lkdGhgIHByb3BlcnR5LiBXaGVuIHN0eWxpbmcgaXMgZmx1c2hlZCBvbiB0aGUgZWxlbWVudCwgdGhlXG4gKiBhbGdvcml0aG0gd2lsbCB0cnkgYW5kIGZpZ3VyZSBvdXQgd2hpY2ggb25lIG9mIHRoZXNlIHZhbHVlcyB0byB3cml0ZVxuICogdG8gdGhlIGVsZW1lbnQuXG4gKlxuICogSW4gb3JkZXIgdG8gZmlndXJlIG91dCB3aGljaCB2YWx1ZSB0byBhcHBseSwgdGhlIGZvbGxvd2luZ1xuICogYmluZGluZyBwcmlvcml0aXphdGlvbiBpcyBhZGhlcmVkIHRvOlxuICpcbiAqIDEuIEZpcnN0IHRlbXBsYXRlLWxldmVsIHN0eWxpbmcgYmluZGluZ3MgYXJlIGFwcGxpZWQgKGlmIHByZXNlbnQpLlxuICogICAgVGhpcyBpbmNsdWRlcyB0aGluZ3MgbGlrZSBgW3N0eWxlLndpZHRoXWAgYW5kIGBbY2xhc3MuYWN0aXZlXWAuXG4gKlxuICogMi4gU2Vjb25kIGFyZSBzdHlsaW5nLWxldmVsIGhvc3QgYmluZGluZ3MgcHJlc2VudCBpbiBkaXJlY3RpdmVzLlxuICogICAgKGlmIHRoZXJlIGFyZSBzdWIvc3VwZXIgZGlyZWN0aXZlcyBwcmVzZW50IHRoZW4gdGhlIHN1YiBkaXJlY3RpdmVzXG4gKiAgICBhcmUgYXBwbGllZCBmaXJzdCkuXG4gKlxuICogMy4gVGhpcmQgYXJlIHN0eWxpbmctbGV2ZWwgaG9zdCBiaW5kaW5ncyBwcmVzZW50IGluIGNvbXBvbmVudHMuXG4gKiAgICAoaWYgdGhlcmUgYXJlIHN1Yi9zdXBlciBjb21wb25lbnRzIHByZXNlbnQgdGhlbiB0aGUgc3ViIGRpcmVjdGl2ZXNcbiAqICAgIGFyZSBhcHBsaWVkIGZpcnN0KS5cbiAqXG4gKiBUaGlzIG1lYW5zIHRoYXQgaW4gdGhlIGNvZGUgYWJvdmUgdGhlIHN0eWxpbmcgYmluZGluZyBwcmVzZW50IGluIHRoZVxuICogdGVtcGxhdGUgaXMgYXBwbGllZCBmaXJzdCBhbmQsIG9ubHkgaWYgaXRzIGZhbHN5LCB0aGVuIHRoZSBkaXJlY3RpdmVcbiAqIHN0eWxpbmcgYmluZGluZyBmb3Igd2lkdGggd2lsbCBiZSBhcHBsaWVkLlxuICpcbiAqICMjIyBXaGF0IGFib3V0IG1hcC1iYXNlZCBzdHlsaW5nIGJpbmRpbmdzP1xuICogTWFwLWJhc2VkIHN0eWxpbmcgYmluZGluZ3MgYXJlIGFjdGl2YXRlZCB3aGVuIHRoZXJlIGFyZSBvbmUgb3IgbW9yZVxuICogYFtzdHlsZV1gIGFuZC9vciBgW2NsYXNzXWAgYmluZGluZ3MgcHJlc2VudCBvbiBhbiBlbGVtZW50LiBXaGVuIHRoaXNcbiAqIGNvZGUgaXMgYWN0aXZhdGVkLCB0aGUgYXBwbHkgYWxnb3JpdGhtIHdpbGwgaXRlcmF0ZSBvdmVyIGVhY2ggbWFwXG4gKiBlbnRyeSBhbmQgYXBwbHkgZWFjaCBzdHlsaW5nIHZhbHVlIHRvIHRoZSBlbGVtZW50IHdpdGggdGhlIHNhbWVcbiAqIHByaW9yaXRpemF0aW9uIHJ1bGVzIGFzIGFib3ZlLlxuICpcbiAqIEZvciB0aGUgYWxnb3JpdGhtIHRvIGFwcGx5IHN0eWxpbmcgdmFsdWVzIGVmZmljaWVudGx5LCB0aGVcbiAqIHN0eWxpbmcgbWFwIGVudHJpZXMgbXVzdCBiZSBhcHBsaWVkIGluIHN5bmMgKHByb3BlcnR5IGJ5IHByb3BlcnR5KVxuICogd2l0aCBwcm9wLWJhc2VkIGJpbmRpbmdzLiAoVGhlIG1hcC1iYXNlZCBhbGdvcml0aG0gaXMgZGVzY3JpYmVkXG4gKiBtb3JlIGluc2lkZSBvZiB0aGUgYHJlbmRlcjMvc3RseWluZ19uZXh0L21hcF9iYXNlZF9iaW5kaW5ncy50c2AgZmlsZS4pXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgVFN0eWxpbmdDb250ZXh0IGV4dGVuZHMgQXJyYXk8bnVtYmVyfHN0cmluZ3xudW1iZXJ8Ym9vbGVhbnxudWxsfExTdHlsaW5nTWFwPiB7XG4gIC8qKiBDb25maWd1cmF0aW9uIGRhdGEgZm9yIHRoZSBjb250ZXh0ICovXG4gIFtUU3R5bGluZ0NvbnRleHRJbmRleC5Db25maWdQb3NpdGlvbl06IFRTdHlsaW5nQ29uZmlnRmxhZ3M7XG5cbiAgLyoqIFRlbXBvcmFyeSB2YWx1ZSB1c2VkIHRvIHRyYWNrIGRpcmVjdGl2ZSBpbmRleCBlbnRyaWVzIHVudGlsXG4gICAgIHRoZSBvbGQgc3R5bGluZyBjb2RlIGlzIGZ1bGx5IHJlbW92ZWQuIFRoZSByZWFzb24gd2h5IHRoaXNcbiAgICAgaXMgcmVxdWlyZWQgaXMgdG8gZmlndXJlIG91dCB3aGljaCBkaXJlY3RpdmUgaXMgbGFzdCBhbmQsXG4gICAgIHdoZW4gZW5jb3VudGVyZWQsIHRyaWdnZXIgYSBzdHlsaW5nIGZsdXNoIHRvIGhhcHBlbiAqL1xuICBbVFN0eWxpbmdDb250ZXh0SW5kZXguTWF4RGlyZWN0aXZlSW5kZXhQb3NpdGlvbl06IG51bWJlcjtcblxuICAvKiogVGhlIGJpdCBndWFyZCB2YWx1ZSBmb3IgYWxsIG1hcC1iYXNlZCBiaW5kaW5ncyBvbiBhbiBlbGVtZW50ICovXG4gIFtUU3R5bGluZ0NvbnRleHRJbmRleC5NYXBCaW5kaW5nc0JpdEd1YXJkUG9zaXRpb25dOiBudW1iZXI7XG5cbiAgLyoqIFRoZSB0b3RhbCBhbW91bnQgb2YgbWFwLWJhc2VkIGJpbmRpbmdzIHByZXNlbnQgb24gYW4gZWxlbWVudCAqL1xuICBbVFN0eWxpbmdDb250ZXh0SW5kZXguTWFwQmluZGluZ3NWYWx1ZXNDb3VudFBvc2l0aW9uXTogbnVtYmVyO1xuXG4gIC8qKiBUaGUgcHJvcCB2YWx1ZSBmb3IgbWFwLWJhc2VkIGJpbmRpbmdzICh0aGVyZSBhY3R1YWxseSBpc24ndCBhXG4gICAqIHZhbHVlIGF0IGFsbCwgYnV0IHRoaXMgaXMganVzdCB1c2VkIGluIHRoZSBjb250ZXh0IHRvIGF2b2lkXG4gICAqIGhhdmluZyBhbnkgc3BlY2lhbCBjb2RlIHRvIHVwZGF0ZSB0aGUgYmluZGluZyBpbmZvcm1hdGlvbiBmb3JcbiAgICogbWFwLWJhc2VkIGVudHJpZXMpLiAqL1xuICBbVFN0eWxpbmdDb250ZXh0SW5kZXguTWFwQmluZGluZ3NQcm9wUG9zaXRpb25dOiBzdHJpbmc7XG59XG5cbi8qKlxuICogQSBzZXJpZXMgb2YgZmxhZ3MgdXNlZCB0byBjb25maWd1cmUgdGhlIGNvbmZpZyB2YWx1ZSBwcmVzZW50IHdpdGhpbiBhXG4gKiBgVFN0eWxpbmdDb250ZXh0YCB2YWx1ZS5cbiAqL1xuZXhwb3J0IGNvbnN0IGVudW0gVFN0eWxpbmdDb25maWdGbGFncyB7XG4gIC8qKlxuICAgKiBUaGUgaW5pdGlhbCBzdGF0ZSBvZiB0aGUgc3R5bGluZyBjb250ZXh0IGNvbmZpZ1xuICAgKi9cbiAgSW5pdGlhbCA9IDBiMCxcblxuICAvKipcbiAgICogQSBmbGFnIHdoaWNoIG1hcmtzIHRoZSBjb250ZXh0IGFzIGJlaW5nIGxvY2tlZC5cbiAgICpcbiAgICogVGhlIHN0eWxpbmcgY29udGV4dCBpcyBjb25zdHJ1Y3RlZCBhY3Jvc3MgYW4gZWxlbWVudCB0ZW1wbGF0ZVxuICAgKiBmdW5jdGlvbiBhcyB3ZWxsIGFzIGFueSBhc3NvY2lhdGVkIGhvc3RCaW5kaW5ncyBmdW5jdGlvbnMuIFdoZW5cbiAgICogdGhpcyBvY2N1cnMsIHRoZSBjb250ZXh0IGl0c2VsZiBpcyBvcGVuIHRvIG11dGF0aW9uIGFuZCBvbmx5IG9uY2VcbiAgICogaXQgaGFzIGJlZW4gZmx1c2hlZCBvbmNlIHRoZW4gaXQgd2lsbCBiZSBsb2NrZWQgZm9yIGdvb2QgKG5vIGV4dHJhXG4gICAqIGJpbmRpbmdzIGNhbiBiZSBhZGRlZCB0byBpdCkuXG4gICAqL1xuICBMb2NrZWQgPSAwYjEsXG59XG5cbi8qKlxuICogQW4gaW5kZXggb2YgcG9zaXRpb24gYW5kIG9mZnNldCB2YWx1ZXMgdXNlZCB0byBuYXRpZ2F0ZSB0aGUgYFRTdHlsaW5nQ29udGV4dGAuXG4gKi9cbmV4cG9ydCBjb25zdCBlbnVtIFRTdHlsaW5nQ29udGV4dEluZGV4IHtcbiAgQ29uZmlnUG9zaXRpb24gPSAwLFxuICBNYXhEaXJlY3RpdmVJbmRleFBvc2l0aW9uID0gMSxcblxuICAvLyBpbmRleC9vZmZzZXQgdmFsdWVzIGZvciBtYXAtYmFzZWQgZW50cmllcyAoaS5lLiBgW3N0eWxlXWBcbiAgLy8gYW5kIGBbY2xhc3NdIGJpbmRpbmdzKS5cbiAgTWFwQmluZGluZ3NQb3NpdGlvbiA9IDIsXG4gIE1hcEJpbmRpbmdzQml0R3VhcmRQb3NpdGlvbiA9IDIsXG4gIE1hcEJpbmRpbmdzVmFsdWVzQ291bnRQb3NpdGlvbiA9IDMsXG4gIE1hcEJpbmRpbmdzUHJvcFBvc2l0aW9uID0gNCxcbiAgTWFwQmluZGluZ3NCaW5kaW5nc1N0YXJ0UG9zaXRpb24gPSA1LFxuXG4gIC8vIGVhY2ggdHVwbGUgZW50cnkgaW4gdGhlIGNvbnRleHRcbiAgLy8gKG1hc2ssIGNvdW50LCBwcm9wLCAuLi5iaW5kaW5nc3x8ZGVmYXVsdC12YWx1ZSlcbiAgR3VhcmRPZmZzZXQgPSAwLFxuICBWYWx1ZXNDb3VudE9mZnNldCA9IDEsXG4gIFByb3BPZmZzZXQgPSAyLFxuICBCaW5kaW5nc1N0YXJ0T2Zmc2V0ID0gMyxcbn1cblxuLyoqXG4gKiBBIGZ1bmN0aW9uIHVzZWQgdG8gYXBwbHkgb3IgcmVtb3ZlIHN0eWxpbmcgZnJvbSBhbiBlbGVtZW50IGZvciBhIGdpdmVuIHByb3BlcnR5LlxuICovXG5leHBvcnQgaW50ZXJmYWNlIEFwcGx5U3R5bGluZ0ZuIHtcbiAgKHJlbmRlcmVyOiBSZW5kZXJlcjN8UHJvY2VkdXJhbFJlbmRlcmVyM3xudWxsLCBlbGVtZW50OiBSRWxlbWVudCwgcHJvcDogc3RyaW5nLFxuICAgdmFsdWU6IHN0cmluZ3xudWxsLCBiaW5kaW5nSW5kZXg/OiBudW1iZXJ8bnVsbCk6IHZvaWQ7XG59XG5cbi8qKlxuICogUnVudGltZSBkYXRhIHR5cGUgdGhhdCBpcyB1c2VkIHRvIHN0b3JlIGJpbmRpbmcgZGF0YSByZWZlcmVuY2VkIGZyb20gdGhlIGBUU3R5bGluZ0NvbnRleHRgLlxuICpcbiAqIEJlY2F1c2UgYExWaWV3YCBpcyBqdXN0IGFuIGFycmF5IHdpdGggZGF0YSwgdGhlcmUgaXMgbm8gcmVhc29uIHRvXG4gKiBzcGVjaWFsIGNhc2UgYExWaWV3YCBldmVyeXdoZXJlIGluIHRoZSBzdHlsaW5nIGFsZ29yaXRobS4gQnkgYWxsb3dpbmdcbiAqIHRoaXMgZGF0YSB0eXBlIHRvIGJlIGFuIGFycmF5IHRoYXQgY29udGFpbnMgdmFyaW91cyBzY2FsYXIgZGF0YSB0eXBlcyxcbiAqIGFuIGluc3RhbmNlIG9mIGBMVmlld2AgZG9lc24ndCBuZWVkIHRvIGJlIGNvbnN0cnVjdGVkIGZvciB0ZXN0cy5cbiAqL1xuZXhwb3J0IHR5cGUgTFN0eWxpbmdEYXRhID0gTFZpZXcgfCAoc3RyaW5nIHwgbnVtYmVyIHwgYm9vbGVhbiB8IG51bGwpW107XG5cbi8qKlxuICogQXJyYXktYmFzZWQgcmVwcmVzZW50YXRpb24gb2YgYSBrZXkvdmFsdWUgYXJyYXkuXG4gKlxuICogVGhlIGZvcm1hdCBvZiB0aGUgYXJyYXkgaXMgXCJwcm9wZXJ0eVwiLCBcInZhbHVlXCIsIFwicHJvcGVydHkyXCIsXG4gKiBcInZhbHVlMlwiLCBldGMuLi5cbiAqXG4gKiBUaGUgZmlyc3QgdmFsdWUgaW4gdGhlIGFycmF5IGlzIHJlc2VydmVkIHRvIHN0b3JlIHRoZSBpbnN0YW5jZVxuICogb2YgdGhlIGtleS92YWx1ZSBhcnJheSB0aGF0IHdhcyB1c2VkIHRvIHBvcHVsYXRlIHRoZSBwcm9wZXJ0eS9cbiAqIHZhbHVlIGVudHJpZXMgdGhhdCB0YWtlIHBsYWNlIGluIHRoZSByZW1haW5kZXIgb2YgdGhlIGFycmF5LlxuICovXG5leHBvcnQgaW50ZXJmYWNlIExTdHlsaW5nTWFwIGV4dGVuZHMgQXJyYXk8e318c3RyaW5nfG51bWJlcnxudWxsPiB7XG4gIFtMU3R5bGluZ01hcEluZGV4LlJhd1ZhbHVlUG9zaXRpb25dOiB7fXxzdHJpbmd8bnVsbDtcbn1cblxuLyoqXG4gKiBBbiBpbmRleCBvZiBwb3NpdGlvbiBhbmQgb2Zmc2V0IHBvaW50cyBmb3IgYW55IGRhdGEgc3RvcmVkIHdpdGhpbiBhIGBMU3R5bGluZ01hcGAgaW5zdGFuY2UuXG4gKi9cbmV4cG9ydCBjb25zdCBlbnVtIExTdHlsaW5nTWFwSW5kZXgge1xuICAvKiogVGhlIGxvY2F0aW9uIG9mIHRoZSByYXcga2V5L3ZhbHVlIG1hcCBpbnN0YW5jZSB1c2VkIGxhc3QgdG8gcG9wdWxhdGUgdGhlIGFycmF5IGVudHJpZXMgKi9cbiAgUmF3VmFsdWVQb3NpdGlvbiA9IDAsXG5cbiAgLyoqIFdoZXJlIHRoZSB2YWx1ZXMgc3RhcnQgaW4gdGhlIGFycmF5ICovXG4gIFZhbHVlc1N0YXJ0UG9zaXRpb24gPSAxLFxuXG4gIC8qKiBUaGUgc2l6ZSBvZiBlYWNoIHByb3BlcnR5L3ZhbHVlIGVudHJ5ICovXG4gIFR1cGxlU2l6ZSA9IDIsXG5cbiAgLyoqIFRoZSBvZmZzZXQgZm9yIHRoZSBwcm9wZXJ0eSBlbnRyeSBpbiB0aGUgdHVwbGUgKi9cbiAgUHJvcE9mZnNldCA9IDAsXG5cbiAgLyoqIFRoZSBvZmZzZXQgZm9yIHRoZSB2YWx1ZSBlbnRyeSBpbiB0aGUgdHVwbGUgKi9cbiAgVmFsdWVPZmZzZXQgPSAxLFxufVxuXG4vKipcbiAqIFVzZWQgdG8gYXBwbHkvdHJhdmVyc2UgYWNyb3NzIGFsbCBtYXAtYmFzZWQgc3R5bGluZyBlbnRyaWVzIHVwIHRvIHRoZSBwcm92aWRlZCBgdGFyZ2V0UHJvcGBcbiAqIHZhbHVlLlxuICpcbiAqIFdoZW4gY2FsbGVkLCBlYWNoIG9mIHRoZSBtYXAtYmFzZWQgYExTdHlsaW5nTWFwYCBlbnRyaWVzICh3aGljaCBhcmUgc3RvcmVkIGluXG4gKiB0aGUgcHJvdmlkZWQgYExTdHlsaW5nRGF0YWAgYXJyYXkpIHdpbGwgYmUgaXRlcmF0ZWQgb3Zlci4gRGVwZW5kaW5nIG9uIHRoZSBwcm92aWRlZFxuICogYG1vZGVgIHZhbHVlLCBlYWNoIHByb3AvdmFsdWUgZW50cnkgbWF5IGJlIGFwcGxpZWQgb3Igc2tpcHBlZCBvdmVyLlxuICpcbiAqIElmIGB0YXJnZXRQcm9wYCB2YWx1ZSBpcyBwcm92aWRlZCB0aGUgaXRlcmF0aW9uIGNvZGUgd2lsbCBzdG9wIG9uY2UgaXQgcmVhY2hlc1xuICogdGhlIHByb3BlcnR5IChpZiBmb3VuZCkuIE90aGVyd2lzZSBpZiB0aGUgdGFyZ2V0IHByb3BlcnR5IGlzIG5vdCBlbmNvdW50ZXJlZCB0aGVuXG4gKiBpdCB3aWxsIHN0b3Agb25jZSBpdCByZWFjaGVzIHRoZSBuZXh0IHZhbHVlIHRoYXQgYXBwZWFycyBhbHBoYWJldGljYWxseSBhZnRlciBpdC5cbiAqXG4gKiBJZiBhIGBkZWZhdWx0VmFsdWVgIGlzIHByb3ZpZGVkIHRoZW4gaXQgd2lsbCBiZSBhcHBsaWVkIHRvIHRoZSBlbGVtZW50IG9ubHkgaWYgdGhlXG4gKiBgdGFyZ2V0UHJvcGAgcHJvcGVydHkgdmFsdWUgaXMgZW5jb3VudGVyZWQgYW5kIHRoZSB2YWx1ZSBhc3NvY2lhdGVkIHdpdGggdGhlIHRhcmdldFxuICogcHJvcGVydHkgaXMgYG51bGxgLiBUaGUgcmVhc29uIHdoeSB0aGUgYGRlZmF1bHRWYWx1ZWAgaXMgbmVlZGVkIGlzIHRvIGF2b2lkIGhhdmluZyB0aGVcbiAqIGFsZ29yaXRobSBhcHBseSBhIGBudWxsYCB2YWx1ZSBhbmQgdGhlbiBhcHBseSBhIGRlZmF1bHQgdmFsdWUgYWZ0ZXJ3YXJkcyAodGhpcyB3b3VsZFxuICogZW5kIHVwIGJlaW5nIHR3byBzdHlsZSBwcm9wZXJ0eSB3cml0ZXMpLlxuICpcbiAqIEByZXR1cm5zIHdoZXRoZXIgb3Igbm90IHRoZSB0YXJnZXQgcHJvcGVydHkgd2FzIHJlYWNoZWQgYW5kIGl0cyB2YWx1ZSB3YXNcbiAqICBhcHBsaWVkIHRvIHRoZSBlbGVtZW50LlxuICovXG5leHBvcnQgaW50ZXJmYWNlIFN5bmNTdHlsaW5nTWFwc0ZuIHtcbiAgKGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgcmVuZGVyZXI6IFJlbmRlcmVyM3xQcm9jZWR1cmFsUmVuZGVyZXIzfG51bGwsIGVsZW1lbnQ6IFJFbGVtZW50LFxuICAgZGF0YTogTFN0eWxpbmdEYXRhLCBhcHBseVN0eWxpbmdGbjogQXBwbHlTdHlsaW5nRm4sIG1vZGU6IFN0eWxpbmdNYXBzU3luY01vZGUsXG4gICB0YXJnZXRQcm9wPzogc3RyaW5nfG51bGwsIGRlZmF1bHRWYWx1ZT86IHN0cmluZ3xudWxsKTogYm9vbGVhbjtcbn1cblxuLyoqXG4gKiBVc2VkIHRvIGRpcmVjdCBob3cgbWFwLWJhc2VkIHZhbHVlcyBhcmUgYXBwbGllZC90cmF2ZXJzZWQgd2hlbiBzdHlsaW5nIGlzIGZsdXNoZWQuXG4gKi9cbmV4cG9ydCBjb25zdCBlbnVtIFN0eWxpbmdNYXBzU3luY01vZGUge1xuICAvKiogT25seSB0cmF2ZXJzZSB2YWx1ZXMgKG5vIHByb3AvdmFsdWUgc3R5bGluZyBlbnRyaWVzIGdldCBhcHBsaWVkKSAqL1xuICBUcmF2ZXJzZVZhbHVlcyA9IDBiMDAwLFxuXG4gIC8qKiBBcHBseSBldmVyeSBwcm9wL3ZhbHVlIHN0eWxpbmcgZW50cnkgdG8gdGhlIGVsZW1lbnQgKi9cbiAgQXBwbHlBbGxWYWx1ZXMgPSAwYjAwMSxcblxuICAvKiogT25seSBhcHBseSB0aGUgdGFyZ2V0IHByb3AvdmFsdWUgZW50cnkgKi9cbiAgQXBwbHlUYXJnZXRQcm9wID0gMGIwMTAsXG5cbiAgLyoqIFNraXAgYXBwbHlpbmcgdGhlIHRhcmdldCBwcm9wL3ZhbHVlIGVudHJ5ICovXG4gIFNraXBUYXJnZXRQcm9wID0gMGIxMDAsXG59XG4iXX0=