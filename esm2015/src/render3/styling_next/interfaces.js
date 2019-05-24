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
 * # How Styles/Classes are Applied
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
 * Once all the styling instructions have been evaluated, then the styling
 * context(s) are flushed to the element. When this happens, the context will
 * be iterated over (property by property) and each binding source will be
 * examined and the first non-null value will be applied to the element.
 *
 * @record
 */
export function TStylingContext() { }
if (false) {
    /* Skipping unnamed member:
    [TStylingContextIndex.ConfigPosition]: TStylingConfigFlags;*/
    /* Skipping unnamed member:
    [TStylingContextIndex.MaxDirectiveIndexPosition]: number;*/
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
    ValuesStartPosition: 2,
    // each tuple entry in the context
    // (mask, count, prop, ...bindings||default-value)
    MaskOffset: 0,
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW50ZXJmYWNlcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvc3R5bGluZ19uZXh0L2ludGVyZmFjZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBOEtBLHFDQVFDOzs7Ozs7Ozs7SUFPQzs7T0FFRztJQUNILFVBQWE7SUFFYjs7Ozs7Ozs7T0FRRztJQUNILFNBQVk7Ozs7O0lBT1osaUJBQWtCO0lBQ2xCLDRCQUE2QjtJQUM3QixzQkFBdUI7SUFFdkIsa0NBQWtDO0lBQ2xDLGtEQUFrRDtJQUNsRCxhQUFjO0lBQ2Qsb0JBQXFCO0lBQ3JCLGFBQWM7SUFDZCxzQkFBdUI7Ozs7Ozs7QUFNekIsb0NBR0MiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiogQGxpY2Vuc2VcbiogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4qXG4qIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4qIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiovXG5pbXBvcnQge1Byb2NlZHVyYWxSZW5kZXJlcjMsIFJFbGVtZW50LCBSZW5kZXJlcjN9IGZyb20gJy4uL2ludGVyZmFjZXMvcmVuZGVyZXInO1xuaW1wb3J0IHtMVmlld30gZnJvbSAnLi4vaW50ZXJmYWNlcy92aWV3JztcblxuLyoqXG4gKiBBIHN0YXRpYy1sZXZlbCByZXByZXNlbnRhdGlvbiBvZiBhbGwgc3R5bGUgb3IgY2xhc3MgYmluZGluZ3MvdmFsdWVzXG4gKiBhc3NvY2lhdGVkIHdpdGggYSBgVE5vZGVgLlxuICpcbiAqIFRoZSBgVFN0eWxpbmdDb250ZXh0YCB1bml0ZXMgYWxsIHRlbXBsYXRlIHN0eWxpbmcgYmluZGluZ3MgKGkuZS5cbiAqIGBbY2xhc3NdYCBhbmQgYFtzdHlsZV1gIGJpbmRpbmdzKSBhcyB3ZWxsIGFzIGFsbCBob3N0LWxldmVsXG4gKiBzdHlsaW5nIGJpbmRpbmdzIChmb3IgY29tcG9uZW50cyBhbmQgZGlyZWN0aXZlcykgdG9nZXRoZXIgaW50b1xuICogYSBzaW5nbGUgbWFuaWZlc3QuIEl0IGlzIHVzZWQgZWFjaCB0aW1lIHRoZXJlIGFyZSBvbmUgb3IgbW9yZVxuICogc3R5bGluZyBiaW5kaW5ncyBwcmVzZW50IGZvciBhbiBlbGVtZW50LlxuICpcbiAqIFRoZSBzdHlsaW5nIGNvbnRleHQgaXMgc3RvcmVkIG9uIGEgYFROb2RlYCBvbiBhbmQgdGhlcmUgYXJlXG4gKiB0d28gaW5zdGFuY2VzIG9mIGl0OiBvbmUgZm9yIGNsYXNzZXMgYW5kIGFub3RoZXIgZm9yIHN0eWxlcy5cbiAqXG4gKiBgYGB0eXBlc2NyaXB0XG4gKiB0Tm9kZS5zdHlsZXMgPSBbIC4uLiBhIGNvbnRleHQgb25seSBmb3Igc3R5bGVzIC4uLiBdO1xuICogdE5vZGUuY2xhc3NlcyA9IFsgLi4uIGEgY29udGV4dCBvbmx5IGZvciBjbGFzc2VzIC4uLiBdO1xuICogYGBgXG4gKlxuICogRHVlIHRvIHRoZSBmYWN0IHRoZSB0aGUgYFRTdHlsaW5nQ29udGV4dGAgaXMgc3RvcmVkIG9uIGEgYFROb2RlYFxuICogdGhpcyBtZWFucyB0aGF0IGFsbCBkYXRhIHdpdGhpbiB0aGUgY29udGV4dCBpcyBzdGF0aWMuIEluc3RlYWQgb2ZcbiAqIHN0b3JpbmcgYWN0dWFsIHN0eWxpbmcgYmluZGluZyB2YWx1ZXMsIHRoZSBsVmlldyBiaW5kaW5nIGluZGV4IHZhbHVlc1xuICogYXJlIHN0b3JlZCB3aXRoaW4gdGhlIGNvbnRleHQuIChzdGF0aWMgbmF0dXJlIG1lYW5zIGl0IGlzIG1vcmUgY29tcGFjdC4pXG5cbiAqXG4gKiBgYGB0eXBlc2NyaXB0XG4gKiAvLyA8ZGl2IFtjbGFzcy5hY3RpdmVdPVwiY1wiICAvLyBsVmlldyBiaW5kaW5nIGluZGV4ID0gMjBcbiAqIC8vICAgICAgW3N0eWxlLndpZHRoXT1cInhcIiAgIC8vIGxWaWV3IGJpbmRpbmcgaW5kZXggPSAyMVxuICogLy8gICAgICBbc3R5bGUuaGVpZ2h0XT1cInlcIj4gLy8gbFZpZXcgYmluZGluZyBpbmRleCA9IDIyXG4gKiB0Tm9kZS5zdHlsZXNDb250ZXh0ID0gW1xuICogICAwLCAvLyB0aGUgY29udGV4dCBjb25maWcgdmFsdWVcbiAqXG4gKiAgIDBiMDAxLCAvLyBndWFyZCBtYXNrIGZvciB3aWR0aFxuICogICAyLCAvLyB0b3RhbCBlbnRyaWVzIGZvciB3aWR0aFxuICogICAnd2lkdGgnLCAvLyB0aGUgcHJvcGVydHkgbmFtZVxuICogICAyMSwgLy8gdGhlIGJpbmRpbmcgbG9jYXRpb24gZm9yIHRoZSBcInhcIiBiaW5kaW5nIGluIHRoZSBsVmlld1xuICogICBudWxsLFxuICpcbiAqICAgMGIwMTAsIC8vIGd1YXJkIG1hc2sgZm9yIGhlaWdodFxuICogICAyLCAvLyB0b3RhbCBlbnRyaWVzIGZvciBoZWlnaHRcbiAqICAgJ2hlaWdodCcsIC8vIHRoZSBwcm9wZXJ0eSBuYW1lXG4gKiAgIDIyLCAvLyB0aGUgYmluZGluZyBsb2NhdGlvbiBmb3IgdGhlIFwieVwiIGJpbmRpbmcgaW4gdGhlIGxWaWV3XG4gKiAgIG51bGwsXG4gKiBdO1xuICpcbiAqIHROb2RlLmNsYXNzZXNDb250ZXh0ID0gW1xuICogICAwLCAvLyB0aGUgY29udGV4dCBjb25maWcgdmFsdWVcbiAqXG4gKiAgIDBiMDAxLCAvLyBndWFyZCBtYXNrIGZvciBhY3RpdmVcbiAqICAgMiwgLy8gdG90YWwgZW50cmllcyBmb3IgYWN0aXZlXG4gKiAgICdhY3RpdmUnLCAvLyB0aGUgcHJvcGVydHkgbmFtZVxuICogICAyMCwgLy8gdGhlIGJpbmRpbmcgbG9jYXRpb24gZm9yIHRoZSBcImNcIiBiaW5kaW5nIGluIHRoZSBsVmlld1xuICogICBudWxsLFxuICogXTtcbiAqIGBgYFxuICpcbiAqIEVudHJ5IHZhbHVlIHByZXNlbnQgaW4gYW4gZW50cnkgKGNhbGxlZCBhIHR1cGxlKSB3aXRoaW4gdGhlXG4gKiBzdHlsaW5nIGNvbnRleHQgaXMgYXMgZm9sbG93czpcbiAqXG4gKiBgYGB0eXBlc2NyaXB0XG4gKiBjb250ZXh0ID0gW1xuICogICBDT05GSUcsIC8vIHRoZSBzdHlsaW5nIGNvbnRleHQgY29uZmlnIHZhbHVlXG4gKiAgIC8vLi4uXG4gKiAgIGd1YXJkTWFzayxcbiAqICAgdG90YWxFbnRyaWVzLFxuICogICBwcm9wTmFtZSxcbiAqICAgYmluZGluZ0luZGljZXMuLi4sXG4gKiAgIGRlZmF1bHRWYWx1ZVxuICogXTtcbiAqIGBgYFxuICpcbiAqIEJlbG93IGlzIGEgYnJlYWtkb3duIG9mIGVhY2ggdmFsdWU6XG4gKlxuICogLSAqKmd1YXJkTWFzayoqOlxuICogICBBIG51bWVyaWMgdmFsdWUgd2hlcmUgZWFjaCBiaXQgcmVwcmVzZW50cyBhIGJpbmRpbmcgaW5kZXhcbiAqICAgbG9jYXRpb24uIEVhY2ggYmluZGluZyBpbmRleCBsb2NhdGlvbiBpcyBhc3NpZ25lZCBiYXNlZCBvblxuICogICBhIGxvY2FsIGNvdW50ZXIgdmFsdWUgdGhhdCBpbmNyZW1lbnRzIGVhY2ggdGltZSBhbiBpbnN0cnVjdGlvblxuICogICBpcyBjYWxsZWQ6XG4gKlxuICogYGBgXG4gKiA8ZGl2IFtzdHlsZS53aWR0aF09XCJ4XCIgICAvLyBiaW5kaW5nIGluZGV4ID0gMjEgKGNvdW50ZXIgaW5kZXggPSAwKVxuICogICAgICBbc3R5bGUuaGVpZ2h0XT1cInlcIj4gLy8gYmluZGluZyBpbmRleCA9IDIyIChjb3VudGVyIGluZGV4ID0gMSlcbiAqIGBgYFxuICpcbiAqICAgSW4gdGhlIGV4YW1wbGUgY29kZSBhYm92ZSwgaWYgdGhlIGB3aWR0aGAgdmFsdWUgd2hlcmUgdG8gY2hhbmdlXG4gKiAgIHRoZW4gdGhlIGZpcnN0IGJpdCBpbiB0aGUgbG9jYWwgYml0IG1hc2sgdmFsdWUgd291bGQgYmUgZmxpcHBlZFxuICogICAoYW5kIHRoZSBzZWNvbmQgYml0IGZvciB3aGVuIGBoZWlnaHRgKS5cbiAqXG4gKiAgIElmIGFuZCB3aGVuIHRoZXJlIGFyZSBtb3JlIHRoYW4gMzIgYmluZGluZyBzb3VyY2VzIGluIHRoZSBjb250ZXh0XG4gKiAgIChtb3JlIHRoYW4gMzIgYFtzdHlsZS9jbGFzc11gIGJpbmRpbmdzKSB0aGVuIHRoZSBiaXQgbWFza2luZyB3aWxsXG4gKiAgIG92ZXJmbG93IGFuZCB3ZSBhcmUgbGVmdCB3aXRoIGEgc2l0dWF0aW9uIHdoZXJlIGEgYC0xYCB2YWx1ZSB3aWxsXG4gKiAgIHJlcHJlc2VudCB0aGUgYml0IG1hc2suIER1ZSB0byB0aGUgd2F5IHRoYXQgSmF2YVNjcmlwdCBoYW5kbGVzXG4gKiAgIG5lZ2F0aXZlIHZhbHVlcywgd2hlbiB0aGUgYml0IG1hc2sgaXMgYC0xYCB0aGVuIGFsbCBiaXRzIHdpdGhpblxuICogICB0aGF0IHZhbHVlIHdpbGwgYmUgYXV0b21hdGljYWxseSBmbGlwcGVkICh0aGlzIGlzIGEgcXVpY2sgYW5kXG4gKiAgIGVmZmljaWVudCB3YXkgdG8gZmxpcCBhbGwgYml0cyBvbiB0aGUgbWFzayB3aGVuIGEgc3BlY2lhbCBraW5kXG4gKiAgIG9mIGNhY2hpbmcgc2NlbmFyaW8gb2NjdXJzIG9yIHdoZW4gdGhlcmUgYXJlIG1vcmUgdGhhbiAzMiBiaW5kaW5ncykuXG4gKlxuICogLSAqKnRvdGFsRW50cmllcyoqOlxuICogICBFYWNoIHByb3BlcnR5IHByZXNlbnQgaW4gdGhlIGNvbnRhaW5zIHZhcmlvdXMgYmluZGluZyBzb3VyY2VzIG9mXG4gKiAgIHdoZXJlIHRoZSBzdHlsaW5nIGRhdGEgY291bGQgY29tZSBmcm9tLiBUaGlzIGluY2x1ZGVzIHRlbXBsYXRlXG4gKiAgIGxldmVsIGJpbmRpbmdzLCBkaXJlY3RpdmUvY29tcG9uZW50IGhvc3QgYmluZGluZ3MgYXMgd2VsbCBhcyB0aGVcbiAqICAgZGVmYXVsdCB2YWx1ZSAob3Igc3RhdGljIHZhbHVlKSBhbGwgd3JpdGluZyB0byB0aGUgc2FtZSBwcm9wZXJ0eS5cbiAqICAgVGhpcyB2YWx1ZSBkZXBpY3RzIGhvdyBtYW55IGJpbmRpbmcgc291cmNlIGVudHJpZXMgZXhpc3QgZm9yIHRoZVxuICogICBwcm9wZXJ0eS5cbiAqXG4gKiAgIFRoZSByZWFzb24gd2h5IHRoZSB0b3RhbEVudHJpZXMgdmFsdWUgaXMgbmVlZGVkIGlzIGJlY2F1c2UgdGhlXG4gKiAgIHN0eWxpbmcgY29udGV4dCBpcyBkeW5hbWljIGluIHNpemUgYW5kIGl0J3Mgbm90IHBvc3NpYmxlXG4gKiAgIGZvciB0aGUgZmx1c2hpbmcgb3IgdXBkYXRlIGFsZ29yaXRobXMgdG8ga25vdyB3aGVuIGFuZCB3aGVyZVxuICogICBhIHByb3BlcnR5IHN0YXJ0cyBhbmQgZW5kcyB3aXRob3V0IGl0LlxuICpcbiAqIC0gKipwcm9wTmFtZSoqOlxuICogICBUaGUgQ1NTIHByb3BlcnR5IG5hbWUgb3IgY2xhc3MgbmFtZSAoZS5nIGB3aWR0aGAgb3IgYGFjdGl2ZWApLlxuICpcbiAqIC0gKipiaW5kaW5nSW5kaWNlcy4uLioqOlxuICogICBBIHNlcmllcyBvZiBudW1lcmljIGJpbmRpbmcgdmFsdWVzIHRoYXQgcmVmbGVjdCB3aGVyZSBpbiB0aGVcbiAqICAgbFZpZXcgdG8gZmluZCB0aGUgc3R5bGUvY2xhc3MgdmFsdWVzIGFzc29jaWF0ZWQgd2l0aCB0aGUgcHJvcGVydHkuXG4gKiAgIEVhY2ggdmFsdWUgaXMgaW4gb3JkZXIgaW4gdGVybXMgb2YgcHJpb3JpdHkgKHRlbXBsYXRlcyBhcmUgZmlyc3QsXG4gKiAgIHRoZW4gZGlyZWN0aXZlcyBhbmQgdGhlbiBjb21wb25lbnRzKS4gV2hlbiB0aGUgY29udGV4dCBpcyBmbHVzaGVkXG4gKiAgIGFuZCB0aGUgc3R5bGUvY2xhc3MgdmFsdWVzIGFyZSBhcHBsaWVkIHRvIHRoZSBlbGVtZW50ICh0aGlzIGhhcHBlbnNcbiAqICAgaW5zaWRlIG9mIHRoZSBgc3R5bGluZ0FwcGx5YCBpbnN0cnVjdGlvbikgdGhlbiB0aGUgZmx1c2hpbmcgY29kZVxuICogICB3aWxsIGtlZXAgY2hlY2tpbmcgZWFjaCBiaW5kaW5nIGluZGV4IGFnYWluc3QgdGhlIGFzc29jaWF0ZWQgbFZpZXdcbiAqICAgdG8gZmluZCB0aGUgZmlyc3Qgc3R5bGUvY2xhc3MgdmFsdWUgdGhhdCBpcyBub24tbnVsbC5cbiAqXG4gKiAtICoqZGVmYXVsdFZhbHVlKio6XG4gKiAgIFRoaXMgaXMgdGhlIGRlZmF1bHQgdGhhdCB3aWxsIGFsd2F5cyBiZSBhcHBsaWVkIHRvIHRoZSBlbGVtZW50IGlmXG4gKiAgIGFuZCB3aGVuIGFsbCBvdGhlciBiaW5kaW5nIHNvdXJjZXMgcmV0dXJuIGEgcmVzdWx0IHRoYXQgaXMgbnVsbC5cbiAqICAgVXN1YWxseSB0aGlzIHZhbHVlIGlzIG51bGwgYnV0IGl0IGNhbiBhbHNvIGJlIGEgc3RhdGljIHZhbHVlIHRoYXRcbiAqICAgaXMgaW50ZXJjZXB0ZWQgd2hlbiB0aGUgdE5vZGUgaXMgZmlyc3QgY29uc3RydWN0dXJlZCAoZS5nLlxuICogICBgPGRpdiBzdHlsZT1cIndpZHRoOjIwMHB4XCI+YCBoYXMgYSBkZWZhdWx0IHZhbHVlIG9mIGAyMDBweGAgZm9yXG4gKiAgIHRoZSBgd2lkdGhgIHByb3BlcnR5KS5cbiAqXG4gKiBFYWNoIHRpbWUgYSBuZXcgYmluZGluZyBpcyBlbmNvdW50ZXJlZCBpdCBpcyByZWdpc3RlcmVkIGludG8gdGhlXG4gKiBjb250ZXh0LiBUaGUgY29udGV4dCB0aGVuIGlzIGNvbnRpbnVhbGx5IHVwZGF0ZWQgdW50aWwgdGhlIGZpcnN0XG4gKiBzdHlsaW5nIGFwcGx5IGNhbGwgaGFzIGJlZW4gY2FsbGVkICh0aGlzIGlzIHRyaWdnZXJlZCBieSB0aGVcbiAqIGBzdHlsaW5nQXBwbHkoKWAgaW5zdHJ1Y3Rpb24gZm9yIHRoZSBhY3RpdmUgZWxlbWVudCkuXG4gKlxuICogIyBIb3cgU3R5bGVzL0NsYXNzZXMgYXJlIEFwcGxpZWRcbiAqIEVhY2ggdGltZSBhIHN0eWxpbmcgaW5zdHJ1Y3Rpb24gKGUuZy4gYFtjbGFzcy5uYW1lXWAsIGBbc3R5bGUucHJvcF1gLFxuICogZXRjLi4uKSBpcyBleGVjdXRlZCwgdGhlIGFzc29jaWF0ZWQgYGxWaWV3YCBmb3IgdGhlIHZpZXcgaXMgdXBkYXRlZFxuICogYXQgdGhlIGN1cnJlbnQgYmluZGluZyBsb2NhdGlvbi4gQWxzbywgd2hlbiB0aGlzIGhhcHBlbnMsIGEgbG9jYWxcbiAqIGNvdW50ZXIgdmFsdWUgaXMgaW5jcmVtZW50ZWQuIElmIHRoZSBiaW5kaW5nIHZhbHVlIGhhcyBjaGFuZ2VkIHRoZW5cbiAqIGEgbG9jYWwgYGJpdE1hc2tgIHZhcmlhYmxlIGlzIHVwZGF0ZWQgd2l0aCB0aGUgc3BlY2lmaWMgYml0IGJhc2VkXG4gKiBvbiB0aGUgY291bnRlciB2YWx1ZS5cbiAqXG4gKiBCZWxvdyBpcyBhIGxpZ2h0d2VpZ2h0IGV4YW1wbGUgb2Ygd2hhdCBoYXBwZW5zIHdoZW4gYSBzaW5nbGUgc3R5bGVcbiAqIHByb3BlcnR5IGlzIHVwZGF0ZWQgKGkuZS4gYDxkaXYgW3N0eWxlLnByb3BdPVwidmFsXCI+YCk6XG4gKlxuICogYGBgdHlwZXNjcmlwdFxuICogZnVuY3Rpb24gdXBkYXRlU3R5bGVQcm9wKHByb3A6IHN0cmluZywgdmFsdWU6IHN0cmluZykge1xuICogICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gKiAgIGNvbnN0IGJpbmRpbmdJbmRleCA9IEJJTkRJTkdfSU5ERVgrKztcbiAqICAgY29uc3QgaW5kZXhGb3JTdHlsZSA9IGxvY2FsU3R5bGVzQ291bnRlcisrO1xuICogICBpZiAobFZpZXdbYmluZGluZ0luZGV4XSAhPT0gdmFsdWUpIHtcbiAqICAgICBsVmlld1tiaW5kaW5nSW5kZXhdID0gdmFsdWU7XG4gKiAgICAgbG9jYWxCaXRNYXNrRm9yU3R5bGVzIHw9IDEgPDwgaW5kZXhGb3JTdHlsZTtcbiAqICAgfVxuICogfVxuICogYGBgXG4gKlxuICogT25jZSBhbGwgdGhlIHN0eWxpbmcgaW5zdHJ1Y3Rpb25zIGhhdmUgYmVlbiBldmFsdWF0ZWQsIHRoZW4gdGhlIHN0eWxpbmdcbiAqIGNvbnRleHQocykgYXJlIGZsdXNoZWQgdG8gdGhlIGVsZW1lbnQuIFdoZW4gdGhpcyBoYXBwZW5zLCB0aGUgY29udGV4dCB3aWxsXG4gKiBiZSBpdGVyYXRlZCBvdmVyIChwcm9wZXJ0eSBieSBwcm9wZXJ0eSkgYW5kIGVhY2ggYmluZGluZyBzb3VyY2Ugd2lsbCBiZVxuICogZXhhbWluZWQgYW5kIHRoZSBmaXJzdCBub24tbnVsbCB2YWx1ZSB3aWxsIGJlIGFwcGxpZWQgdG8gdGhlIGVsZW1lbnQuXG4gKlxuICovXG5leHBvcnQgaW50ZXJmYWNlIFRTdHlsaW5nQ29udGV4dCBleHRlbmRzIEFycmF5PG51bWJlcnxzdHJpbmd8bnVtYmVyfGJvb2xlYW58bnVsbD4ge1xuICBbVFN0eWxpbmdDb250ZXh0SW5kZXguQ29uZmlnUG9zaXRpb25dOiBUU3R5bGluZ0NvbmZpZ0ZsYWdzO1xuXG4gIC8qIFRlbXBvcmFyeSB2YWx1ZSB1c2VkIHRvIHRyYWNrIGRpcmVjdGl2ZSBpbmRleCBlbnRyaWVzIHVudGlsXG4gICAgIHRoZSBvbGQgc3R5bGluZyBjb2RlIGlzIGZ1bGx5IHJlbW92ZWQuIFRoZSByZWFzb24gd2h5IHRoaXNcbiAgICAgaXMgcmVxdWlyZWQgaXMgdG8gZmlndXJlIG91dCB3aGljaCBkaXJlY3RpdmUgaXMgbGFzdCBhbmQsXG4gICAgIHdoZW4gZW5jb3VudGVyZWQsIHRyaWdnZXIgYSBzdHlsaW5nIGZsdXNoIHRvIGhhcHBlbiAqL1xuICBbVFN0eWxpbmdDb250ZXh0SW5kZXguTWF4RGlyZWN0aXZlSW5kZXhQb3NpdGlvbl06IG51bWJlcjtcbn1cblxuLyoqXG4gKiBBIHNlcmllcyBvZiBmbGFncyB1c2VkIHRvIGNvbmZpZ3VyZSB0aGUgY29uZmlnIHZhbHVlIHByZXNlbnQgd2l0aGluIGFcbiAqIGBUU3R5bGluZ0NvbnRleHRgIHZhbHVlLlxuICovXG5leHBvcnQgY29uc3QgZW51bSBUU3R5bGluZ0NvbmZpZ0ZsYWdzIHtcbiAgLyoqXG4gICAqIFRoZSBpbml0aWFsIHN0YXRlIG9mIHRoZSBzdHlsaW5nIGNvbnRleHQgY29uZmlnXG4gICAqL1xuICBJbml0aWFsID0gMGIwLFxuXG4gIC8qKlxuICAgKiBBIGZsYWcgd2hpY2ggbWFya3MgdGhlIGNvbnRleHQgYXMgYmVpbmcgbG9ja2VkLlxuICAgKlxuICAgKiBUaGUgc3R5bGluZyBjb250ZXh0IGlzIGNvbnN0cnVjdGVkIGFjcm9zcyBhbiBlbGVtZW50IHRlbXBsYXRlXG4gICAqIGZ1bmN0aW9uIGFzIHdlbGwgYXMgYW55IGFzc29jaWF0ZWQgaG9zdEJpbmRpbmdzIGZ1bmN0aW9ucy4gV2hlblxuICAgKiB0aGlzIG9jY3VycywgdGhlIGNvbnRleHQgaXRzZWxmIGlzIG9wZW4gdG8gbXV0YXRpb24gYW5kIG9ubHkgb25jZVxuICAgKiBpdCBoYXMgYmVlbiBmbHVzaGVkIG9uY2UgdGhlbiBpdCB3aWxsIGJlIGxvY2tlZCBmb3IgZ29vZCAobm8gZXh0cmFcbiAgICogYmluZGluZ3MgY2FuIGJlIGFkZGVkIHRvIGl0KS5cbiAgICovXG4gIExvY2tlZCA9IDBiMSxcbn1cblxuLyoqXG4gKiBBbiBpbmRleCBvZiBwb3NpdGlvbiBhbmQgb2Zmc2V0IHZhbHVlcyB1c2VkIHRvIG5hdGlnYXRlIHRoZSBgVFN0eWxpbmdDb250ZXh0YC5cbiAqL1xuZXhwb3J0IGNvbnN0IGVudW0gVFN0eWxpbmdDb250ZXh0SW5kZXgge1xuICBDb25maWdQb3NpdGlvbiA9IDAsXG4gIE1heERpcmVjdGl2ZUluZGV4UG9zaXRpb24gPSAxLFxuICBWYWx1ZXNTdGFydFBvc2l0aW9uID0gMixcblxuICAvLyBlYWNoIHR1cGxlIGVudHJ5IGluIHRoZSBjb250ZXh0XG4gIC8vIChtYXNrLCBjb3VudCwgcHJvcCwgLi4uYmluZGluZ3N8fGRlZmF1bHQtdmFsdWUpXG4gIE1hc2tPZmZzZXQgPSAwLFxuICBWYWx1ZXNDb3VudE9mZnNldCA9IDEsXG4gIFByb3BPZmZzZXQgPSAyLFxuICBCaW5kaW5nc1N0YXJ0T2Zmc2V0ID0gMyxcbn1cblxuLyoqXG4gKiBBIGZ1bmN0aW9uIHVzZWQgdG8gYXBwbHkgb3IgcmVtb3ZlIHN0eWxpbmcgZnJvbSBhbiBlbGVtZW50IGZvciBhIGdpdmVuIHByb3BlcnR5LlxuICovXG5leHBvcnQgaW50ZXJmYWNlIEFwcGx5U3R5bGluZ0ZuIHtcbiAgKHJlbmRlcmVyOiBSZW5kZXJlcjN8UHJvY2VkdXJhbFJlbmRlcmVyM3xudWxsLCBlbGVtZW50OiBSRWxlbWVudCwgcHJvcDogc3RyaW5nLFxuICAgdmFsdWU6IHN0cmluZ3xudWxsLCBiaW5kaW5nSW5kZXg6IG51bWJlcik6IHZvaWQ7XG59XG5cbi8qKlxuICogUnVudGltZSBkYXRhIHR5cGUgdGhhdCBpcyB1c2VkIHRvIHN0b3JlIGJpbmRpbmcgZGF0YSByZWZlcmVuY2VkIGZyb20gdGhlIGBUU3R5bGluZ0NvbnRleHRgLlxuICpcbiAqIEJlY2F1c2UgYExWaWV3YCBpcyBqdXN0IGFuIGFycmF5IHdpdGggZGF0YSwgdGhlcmUgaXMgbm8gcmVhc29uIHRvXG4gKiBzcGVjaWFsIGNhc2UgYExWaWV3YCBldmVyeXdoZXJlIGluIHRoZSBzdHlsaW5nIGFsZ29yaXRobS4gQnkgYWxsb3dpbmdcbiAqIHRoaXMgZGF0YSB0eXBlIHRvIGJlIGFuIGFycmF5IHRoYXQgY29udGFpbnMgdmFyaW91cyBzY2FsYXIgZGF0YSB0eXBlcyxcbiAqIGFuIGluc3RhbmNlIG9mIGBMVmlld2AgZG9lc24ndCBuZWVkIHRvIGJlIGNvbnN0cnVjdGVkIGZvciB0ZXN0cy5cbiAqL1xuZXhwb3J0IHR5cGUgU3R5bGluZ0JpbmRpbmdEYXRhID0gTFZpZXcgfCAoc3RyaW5nIHwgbnVtYmVyIHwgYm9vbGVhbilbXTtcbiJdfQ==