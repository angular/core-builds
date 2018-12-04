/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,uselessCode} checked by tsc
 */
/**
 * The styling context acts as a styling manifest (shaped as an array) for determining which
 * styling properties have been assigned via the provided `updateStylingMap`, `updateStyleProp`
 * and `updateClassProp` functions. There are also two initialization functions
 * `allocStylingContext` and `createStylingContextTemplate` which are used to initialize
 * and/or clone the context.
 *
 * The context is an array where the first two cells are used for static data (initial styling)
 * and dirty flags / index offsets). The remaining set of cells is used for multi (map) and single
 * (prop) style values.
 *
 * each value from here onwards is mapped as so:
 * [i] = mutation/type flag for the style/class value
 * [i + 1] = prop string (or null incase it has been removed)
 * [i + 2] = value string (or null incase it has been removed)
 *
 * There are three types of styling types stored in this context:
 *   initial: any styles that are passed in once the context is created
 *            (these are stored in the first cell of the array and the first
 *             value of this array is always `null` even if no initial styling exists.
 *             the `null` value is there so that any new styles have a parent to point
 *             to. This way we can always assume that there is a parent.)
 *
 *   single: any styles that are updated using `updateStyleProp` or `updateClassProp` (fixed set)
 *
 *   multi: any styles that are updated using `updateStylingMap` (dynamic set)
 *
 * Note that context is only used to collect style information. Only when `renderStyling`
 * is called is when the styling payload will be rendered (or built as a key/value map).
 *
 * When the context is created, depending on what initial styling values are passed in, the
 * context itself will be pre-filled with slots based on the initial style properties. Say
 * for example we have a series of initial styles that look like so:
 *
 *   style="width:100px; height:200px;"
 *   class="foo"
 *
 * Then the initial state of the context (once initialized) will look like so:
 *
 * ```
 * context = [
 *   element,
 *   playerContext | null,
 *   styleSanitizer | null,
 *   [null, '100px', '200px', true],  // property names are not needed since they have already been
 * written to DOM.
 *
 *   configMasterVal,
 *   1, // this instructs how many `style` values there are so that class index values can be
 * offsetted
 *   { classOne: true, classTwo: false } | 'classOne classTwo' | null // last class value provided
 * into updateStylingMap
 *   { styleOne: '100px', styleTwo: 0 } | null // last style value provided into updateStylingMap
 *
 *   // 8
 *   'width',
 *   pointers(1, 15);  // Point to static `width`: `100px` and multi `width`.
 *   null,
 *
 *   // 11
 *   'height',
 *   pointers(2, 18); // Point to static `height`: `200px` and multi `height`.
 *   null,
 *
 *   // 14
 *   'foo',
 *   pointers(1, 21);  // Point to static `foo`: `true` and multi `foo`.
 *   null,
 *
 *   // 17
 *   'width',
 *   pointers(1, 6);  // Point to static `width`: `100px` and single `width`.
 *   null,
 *
 *   // 21
 *   'height',
 *   pointers(2, 9);  // Point to static `height`: `200px` and single `height`.
 *   null,
 *
 *   // 24
 *   'foo',
 *   pointers(3, 12);  // Point to static `foo`: `true` and single `foo`.
 *   null,
 * ]
 *
 * function pointers(staticIndex: number, dynamicIndex: number) {
 *   // combine the two indices into a single word.
 *   return (staticIndex << StylingFlags.BitCountSize) |
 *     (dynamicIndex << (StylingIndex.BitCountSize + StylingFlags.BitCountSize));
 * }
 * ```
 *
 * The values are duplicated so that space is set aside for both multi ([style] and [class])
 * and single ([style.prop] or [class.named]) values. The respective config values
 * (configValA, configValB, etc...) are a combination of the StylingFlags with two index
 * values: the `initialIndex` (which points to the index location of the style value in
 * the initial styles array in slot 0) and the `dynamicIndex` (which points to the
 * matching single/multi index position in the context array for the same prop).
 *
 * This means that every time `updateStyleProp` or `updateClassProp` are called then they
 * must be called using an index value (not a property string) which references the index
 * value of the initial style prop/class when the context was created. This also means that
 * `updateStyleProp` or `updateClassProp` cannot be called with a new property (only
 * `updateStylingMap` can include new CSS properties that will be added to the context).
 * @record
 */
export function StylingContext() { }
/**
 * The initial styles is populated whether or not there are any initial styles passed into
 * the context during allocation. The 0th value must be null so that index values of `0` within
 * the context flags can always point to a null value safely when nothing is set.
 *
 * All other entries in this array are of `string` value and correspond to the values that
 * were extracted from the `style=""` attribute in the HTML code for the provided template.
 * @record
 */
export function InitialStyles() { }
/** @enum {number} */
var StylingFlags = {
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
    // If NgClass is present (or some other class handler) then it will handle the map expressions and
    // initial classes
    OnlyProcessSingleClasses: 16,
    // The max amount of bits used to represent these configuration values
    BitCountSize: 5,
    // There are only five bits here
    BitMask: 31,
};
export { StylingFlags };
/** @enum {number} */
var StylingIndex = {
    // Position of where the initial styles are stored in the styling context
    PlayerContext: 0,
    // Position of where the style sanitizer is stored within the styling context
    StyleSanitizerPosition: 1,
    // Position of where the initial styles are stored in the styling context
    InitialStylesPosition: 2,
    // Index of location where the start of single properties are stored. (`updateStyleProp`)
    MasterFlagPosition: 3,
    // Index of location where the class index offset value is located
    ClassOffsetPosition: 4,
    // Position of where the initial styles are stored in the styling context
    // This index must align with HOST, see interfaces/view.ts
    ElementPosition: 5,
    // Position of where the last string-based CSS class value was stored (or a cached version of the
    // initial styles when a [class] directive is present)
    PreviousOrCachedMultiClassValue: 6,
    // Position of where the last string-based CSS class value was stored
    PreviousMultiStyleValue: 7,
    // Location of single (prop) value entries are stored within the context
    SingleStylesStartPosition: 8,
    // Multi and single entries are stored in `StylingContext` as: Flag; PropertyName;  PropertyValue
    FlagsOffset: 0,
    PropertyOffset: 1,
    ValueOffset: 2,
    PlayerBuilderIndexOffset: 3,
    // Size of each multi or single entry (flag + prop + value + playerBuilderIndex)
    Size: 4,
    // Each flag has a binary digit length of this value
    BitCountSize: 14,
    // (32 - 4) / 2 = ~14
    // The binary digit value as a mask
    BitMask: 16383,
};
export { StylingIndex };

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3R5bGluZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaW50ZXJmYWNlcy9zdHlsaW5nLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUF1TEUsT0FBYzs7SUFFZCxRQUFlOztJQUVmLFFBQWU7O0lBRWYsV0FBa0I7O0lBRWxCLHNCQUE2Qjs7O0lBRzdCLDRCQUFrQzs7SUFFbEMsZUFBZ0I7O0lBRWhCLFdBQWlCOzs7Ozs7SUFNakIsZ0JBQWlCOztJQUVqQix5QkFBMEI7O0lBRTFCLHdCQUF5Qjs7SUFFekIscUJBQXNCOztJQUV0QixzQkFBdUI7OztJQUd2QixrQkFBbUI7OztJQUduQixrQ0FBbUM7O0lBRW5DLDBCQUEyQjs7SUFFM0IsNEJBQTZCOztJQUU3QixjQUFlO0lBQ2YsaUJBQWtCO0lBQ2xCLGNBQWU7SUFDZiwyQkFBNEI7O0lBRTVCLE9BQVE7O0lBRVIsZ0JBQWlCOzs7SUFFakIsY0FBMEIiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5pbXBvcnQge1N0eWxlU2FuaXRpemVGbn0gZnJvbSAnLi4vLi4vc2FuaXRpemF0aW9uL3N0eWxlX3Nhbml0aXplcic7XG5pbXBvcnQge1JFbGVtZW50fSBmcm9tICcuLi9pbnRlcmZhY2VzL3JlbmRlcmVyJztcbmltcG9ydCB7UGxheWVyQ29udGV4dH0gZnJvbSAnLi9wbGF5ZXInO1xuXG5cbi8qKlxuICogVGhlIHN0eWxpbmcgY29udGV4dCBhY3RzIGFzIGEgc3R5bGluZyBtYW5pZmVzdCAoc2hhcGVkIGFzIGFuIGFycmF5KSBmb3IgZGV0ZXJtaW5pbmcgd2hpY2hcbiAqIHN0eWxpbmcgcHJvcGVydGllcyBoYXZlIGJlZW4gYXNzaWduZWQgdmlhIHRoZSBwcm92aWRlZCBgdXBkYXRlU3R5bGluZ01hcGAsIGB1cGRhdGVTdHlsZVByb3BgXG4gKiBhbmQgYHVwZGF0ZUNsYXNzUHJvcGAgZnVuY3Rpb25zLiBUaGVyZSBhcmUgYWxzbyB0d28gaW5pdGlhbGl6YXRpb24gZnVuY3Rpb25zXG4gKiBgYWxsb2NTdHlsaW5nQ29udGV4dGAgYW5kIGBjcmVhdGVTdHlsaW5nQ29udGV4dFRlbXBsYXRlYCB3aGljaCBhcmUgdXNlZCB0byBpbml0aWFsaXplXG4gKiBhbmQvb3IgY2xvbmUgdGhlIGNvbnRleHQuXG4gKlxuICogVGhlIGNvbnRleHQgaXMgYW4gYXJyYXkgd2hlcmUgdGhlIGZpcnN0IHR3byBjZWxscyBhcmUgdXNlZCBmb3Igc3RhdGljIGRhdGEgKGluaXRpYWwgc3R5bGluZylcbiAqIGFuZCBkaXJ0eSBmbGFncyAvIGluZGV4IG9mZnNldHMpLiBUaGUgcmVtYWluaW5nIHNldCBvZiBjZWxscyBpcyB1c2VkIGZvciBtdWx0aSAobWFwKSBhbmQgc2luZ2xlXG4gKiAocHJvcCkgc3R5bGUgdmFsdWVzLlxuICpcbiAqIGVhY2ggdmFsdWUgZnJvbSBoZXJlIG9ud2FyZHMgaXMgbWFwcGVkIGFzIHNvOlxuICogW2ldID0gbXV0YXRpb24vdHlwZSBmbGFnIGZvciB0aGUgc3R5bGUvY2xhc3MgdmFsdWVcbiAqIFtpICsgMV0gPSBwcm9wIHN0cmluZyAob3IgbnVsbCBpbmNhc2UgaXQgaGFzIGJlZW4gcmVtb3ZlZClcbiAqIFtpICsgMl0gPSB2YWx1ZSBzdHJpbmcgKG9yIG51bGwgaW5jYXNlIGl0IGhhcyBiZWVuIHJlbW92ZWQpXG4gKlxuICogVGhlcmUgYXJlIHRocmVlIHR5cGVzIG9mIHN0eWxpbmcgdHlwZXMgc3RvcmVkIGluIHRoaXMgY29udGV4dDpcbiAqICAgaW5pdGlhbDogYW55IHN0eWxlcyB0aGF0IGFyZSBwYXNzZWQgaW4gb25jZSB0aGUgY29udGV4dCBpcyBjcmVhdGVkXG4gKiAgICAgICAgICAgICh0aGVzZSBhcmUgc3RvcmVkIGluIHRoZSBmaXJzdCBjZWxsIG9mIHRoZSBhcnJheSBhbmQgdGhlIGZpcnN0XG4gKiAgICAgICAgICAgICB2YWx1ZSBvZiB0aGlzIGFycmF5IGlzIGFsd2F5cyBgbnVsbGAgZXZlbiBpZiBubyBpbml0aWFsIHN0eWxpbmcgZXhpc3RzLlxuICogICAgICAgICAgICAgdGhlIGBudWxsYCB2YWx1ZSBpcyB0aGVyZSBzbyB0aGF0IGFueSBuZXcgc3R5bGVzIGhhdmUgYSBwYXJlbnQgdG8gcG9pbnRcbiAqICAgICAgICAgICAgIHRvLiBUaGlzIHdheSB3ZSBjYW4gYWx3YXlzIGFzc3VtZSB0aGF0IHRoZXJlIGlzIGEgcGFyZW50LilcbiAqXG4gKiAgIHNpbmdsZTogYW55IHN0eWxlcyB0aGF0IGFyZSB1cGRhdGVkIHVzaW5nIGB1cGRhdGVTdHlsZVByb3BgIG9yIGB1cGRhdGVDbGFzc1Byb3BgIChmaXhlZCBzZXQpXG4gKlxuICogICBtdWx0aTogYW55IHN0eWxlcyB0aGF0IGFyZSB1cGRhdGVkIHVzaW5nIGB1cGRhdGVTdHlsaW5nTWFwYCAoZHluYW1pYyBzZXQpXG4gKlxuICogTm90ZSB0aGF0IGNvbnRleHQgaXMgb25seSB1c2VkIHRvIGNvbGxlY3Qgc3R5bGUgaW5mb3JtYXRpb24uIE9ubHkgd2hlbiBgcmVuZGVyU3R5bGluZ2BcbiAqIGlzIGNhbGxlZCBpcyB3aGVuIHRoZSBzdHlsaW5nIHBheWxvYWQgd2lsbCBiZSByZW5kZXJlZCAob3IgYnVpbHQgYXMgYSBrZXkvdmFsdWUgbWFwKS5cbiAqXG4gKiBXaGVuIHRoZSBjb250ZXh0IGlzIGNyZWF0ZWQsIGRlcGVuZGluZyBvbiB3aGF0IGluaXRpYWwgc3R5bGluZyB2YWx1ZXMgYXJlIHBhc3NlZCBpbiwgdGhlXG4gKiBjb250ZXh0IGl0c2VsZiB3aWxsIGJlIHByZS1maWxsZWQgd2l0aCBzbG90cyBiYXNlZCBvbiB0aGUgaW5pdGlhbCBzdHlsZSBwcm9wZXJ0aWVzLiBTYXlcbiAqIGZvciBleGFtcGxlIHdlIGhhdmUgYSBzZXJpZXMgb2YgaW5pdGlhbCBzdHlsZXMgdGhhdCBsb29rIGxpa2Ugc286XG4gKlxuICogICBzdHlsZT1cIndpZHRoOjEwMHB4OyBoZWlnaHQ6MjAwcHg7XCJcbiAqICAgY2xhc3M9XCJmb29cIlxuICpcbiAqIFRoZW4gdGhlIGluaXRpYWwgc3RhdGUgb2YgdGhlIGNvbnRleHQgKG9uY2UgaW5pdGlhbGl6ZWQpIHdpbGwgbG9vayBsaWtlIHNvOlxuICpcbiAqIGBgYFxuICogY29udGV4dCA9IFtcbiAqICAgZWxlbWVudCxcbiAqICAgcGxheWVyQ29udGV4dCB8IG51bGwsXG4gKiAgIHN0eWxlU2FuaXRpemVyIHwgbnVsbCxcbiAqICAgW251bGwsICcxMDBweCcsICcyMDBweCcsIHRydWVdLCAgLy8gcHJvcGVydHkgbmFtZXMgYXJlIG5vdCBuZWVkZWQgc2luY2UgdGhleSBoYXZlIGFscmVhZHkgYmVlblxuICogd3JpdHRlbiB0byBET00uXG4gKlxuICogICBjb25maWdNYXN0ZXJWYWwsXG4gKiAgIDEsIC8vIHRoaXMgaW5zdHJ1Y3RzIGhvdyBtYW55IGBzdHlsZWAgdmFsdWVzIHRoZXJlIGFyZSBzbyB0aGF0IGNsYXNzIGluZGV4IHZhbHVlcyBjYW4gYmVcbiAqIG9mZnNldHRlZFxuICogICB7IGNsYXNzT25lOiB0cnVlLCBjbGFzc1R3bzogZmFsc2UgfSB8ICdjbGFzc09uZSBjbGFzc1R3bycgfCBudWxsIC8vIGxhc3QgY2xhc3MgdmFsdWUgcHJvdmlkZWRcbiAqIGludG8gdXBkYXRlU3R5bGluZ01hcFxuICogICB7IHN0eWxlT25lOiAnMTAwcHgnLCBzdHlsZVR3bzogMCB9IHwgbnVsbCAvLyBsYXN0IHN0eWxlIHZhbHVlIHByb3ZpZGVkIGludG8gdXBkYXRlU3R5bGluZ01hcFxuICpcbiAqICAgLy8gOFxuICogICAnd2lkdGgnLFxuICogICBwb2ludGVycygxLCAxNSk7ICAvLyBQb2ludCB0byBzdGF0aWMgYHdpZHRoYDogYDEwMHB4YCBhbmQgbXVsdGkgYHdpZHRoYC5cbiAqICAgbnVsbCxcbiAqXG4gKiAgIC8vIDExXG4gKiAgICdoZWlnaHQnLFxuICogICBwb2ludGVycygyLCAxOCk7IC8vIFBvaW50IHRvIHN0YXRpYyBgaGVpZ2h0YDogYDIwMHB4YCBhbmQgbXVsdGkgYGhlaWdodGAuXG4gKiAgIG51bGwsXG4gKlxuICogICAvLyAxNFxuICogICAnZm9vJyxcbiAqICAgcG9pbnRlcnMoMSwgMjEpOyAgLy8gUG9pbnQgdG8gc3RhdGljIGBmb29gOiBgdHJ1ZWAgYW5kIG11bHRpIGBmb29gLlxuICogICBudWxsLFxuICpcbiAqICAgLy8gMTdcbiAqICAgJ3dpZHRoJyxcbiAqICAgcG9pbnRlcnMoMSwgNik7ICAvLyBQb2ludCB0byBzdGF0aWMgYHdpZHRoYDogYDEwMHB4YCBhbmQgc2luZ2xlIGB3aWR0aGAuXG4gKiAgIG51bGwsXG4gKlxuICogICAvLyAyMVxuICogICAnaGVpZ2h0JyxcbiAqICAgcG9pbnRlcnMoMiwgOSk7ICAvLyBQb2ludCB0byBzdGF0aWMgYGhlaWdodGA6IGAyMDBweGAgYW5kIHNpbmdsZSBgaGVpZ2h0YC5cbiAqICAgbnVsbCxcbiAqXG4gKiAgIC8vIDI0XG4gKiAgICdmb28nLFxuICogICBwb2ludGVycygzLCAxMik7ICAvLyBQb2ludCB0byBzdGF0aWMgYGZvb2A6IGB0cnVlYCBhbmQgc2luZ2xlIGBmb29gLlxuICogICBudWxsLFxuICogXVxuICpcbiAqIGZ1bmN0aW9uIHBvaW50ZXJzKHN0YXRpY0luZGV4OiBudW1iZXIsIGR5bmFtaWNJbmRleDogbnVtYmVyKSB7XG4gKiAgIC8vIGNvbWJpbmUgdGhlIHR3byBpbmRpY2VzIGludG8gYSBzaW5nbGUgd29yZC5cbiAqICAgcmV0dXJuIChzdGF0aWNJbmRleCA8PCBTdHlsaW5nRmxhZ3MuQml0Q291bnRTaXplKSB8XG4gKiAgICAgKGR5bmFtaWNJbmRleCA8PCAoU3R5bGluZ0luZGV4LkJpdENvdW50U2l6ZSArIFN0eWxpbmdGbGFncy5CaXRDb3VudFNpemUpKTtcbiAqIH1cbiAqIGBgYFxuICpcbiAqIFRoZSB2YWx1ZXMgYXJlIGR1cGxpY2F0ZWQgc28gdGhhdCBzcGFjZSBpcyBzZXQgYXNpZGUgZm9yIGJvdGggbXVsdGkgKFtzdHlsZV0gYW5kIFtjbGFzc10pXG4gKiBhbmQgc2luZ2xlIChbc3R5bGUucHJvcF0gb3IgW2NsYXNzLm5hbWVkXSkgdmFsdWVzLiBUaGUgcmVzcGVjdGl2ZSBjb25maWcgdmFsdWVzXG4gKiAoY29uZmlnVmFsQSwgY29uZmlnVmFsQiwgZXRjLi4uKSBhcmUgYSBjb21iaW5hdGlvbiBvZiB0aGUgU3R5bGluZ0ZsYWdzIHdpdGggdHdvIGluZGV4XG4gKiB2YWx1ZXM6IHRoZSBgaW5pdGlhbEluZGV4YCAod2hpY2ggcG9pbnRzIHRvIHRoZSBpbmRleCBsb2NhdGlvbiBvZiB0aGUgc3R5bGUgdmFsdWUgaW5cbiAqIHRoZSBpbml0aWFsIHN0eWxlcyBhcnJheSBpbiBzbG90IDApIGFuZCB0aGUgYGR5bmFtaWNJbmRleGAgKHdoaWNoIHBvaW50cyB0byB0aGVcbiAqIG1hdGNoaW5nIHNpbmdsZS9tdWx0aSBpbmRleCBwb3NpdGlvbiBpbiB0aGUgY29udGV4dCBhcnJheSBmb3IgdGhlIHNhbWUgcHJvcCkuXG4gKlxuICogVGhpcyBtZWFucyB0aGF0IGV2ZXJ5IHRpbWUgYHVwZGF0ZVN0eWxlUHJvcGAgb3IgYHVwZGF0ZUNsYXNzUHJvcGAgYXJlIGNhbGxlZCB0aGVuIHRoZXlcbiAqIG11c3QgYmUgY2FsbGVkIHVzaW5nIGFuIGluZGV4IHZhbHVlIChub3QgYSBwcm9wZXJ0eSBzdHJpbmcpIHdoaWNoIHJlZmVyZW5jZXMgdGhlIGluZGV4XG4gKiB2YWx1ZSBvZiB0aGUgaW5pdGlhbCBzdHlsZSBwcm9wL2NsYXNzIHdoZW4gdGhlIGNvbnRleHQgd2FzIGNyZWF0ZWQuIFRoaXMgYWxzbyBtZWFucyB0aGF0XG4gKiBgdXBkYXRlU3R5bGVQcm9wYCBvciBgdXBkYXRlQ2xhc3NQcm9wYCBjYW5ub3QgYmUgY2FsbGVkIHdpdGggYSBuZXcgcHJvcGVydHkgKG9ubHlcbiAqIGB1cGRhdGVTdHlsaW5nTWFwYCBjYW4gaW5jbHVkZSBuZXcgQ1NTIHByb3BlcnRpZXMgdGhhdCB3aWxsIGJlIGFkZGVkIHRvIHRoZSBjb250ZXh0KS5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBTdHlsaW5nQ29udGV4dCBleHRlbmRzIEFycmF5PEluaXRpYWxTdHlsZXN8e1trZXk6IHN0cmluZ106IGFueX18bnVtYmVyfHN0cmluZ3xcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBib29sZWFufFJFbGVtZW50fFN0eWxlU2FuaXRpemVGbnxQbGF5ZXJDb250ZXh0fG51bGw+IHtcbiAgLyoqXG4gICAqIExvY2F0aW9uIG9mIGFuaW1hdGlvbiBjb250ZXh0ICh3aGljaCBjb250YWlucyB0aGUgYWN0aXZlIHBsYXllcnMpIGZvciB0aGlzIGVsZW1lbnQgc3R5bGluZ1xuICAgKiBjb250ZXh0LlxuICAgKi9cbiAgW1N0eWxpbmdJbmRleC5QbGF5ZXJDb250ZXh0XTogUGxheWVyQ29udGV4dHxudWxsO1xuXG4gIC8qKlxuICAgKiBUaGUgc3R5bGUgc2FuaXRpemVyIHRoYXQgaXMgdXNlZCB3aXRoaW4gdGhpcyBjb250ZXh0XG4gICAqL1xuICBbU3R5bGluZ0luZGV4LlN0eWxlU2FuaXRpemVyUG9zaXRpb25dOiBTdHlsZVNhbml0aXplRm58bnVsbDtcblxuICAvKipcbiAgICogTG9jYXRpb24gb2YgaW5pdGlhbCBkYXRhIHNoYXJlZCBieSBhbGwgaW5zdGFuY2VzIG9mIHRoaXMgc3R5bGUuXG4gICAqL1xuICBbU3R5bGluZ0luZGV4LkluaXRpYWxTdHlsZXNQb3NpdGlvbl06IEluaXRpYWxTdHlsZXM7XG5cbiAgLyoqXG4gICAqIEEgbnVtZXJpYyB2YWx1ZSByZXByZXNlbnRpbmcgdGhlIGNvbmZpZ3VyYXRpb24gc3RhdHVzICh3aGV0aGVyIHRoZSBjb250ZXh0IGlzIGRpcnR5IG9yIG5vdClcbiAgICogbWl4ZWQgdG9nZXRoZXIgKHVzaW5nIGJpdCBzaGlmdGluZykgd2l0aCBhIGluZGV4IHZhbHVlIHdoaWNoIHRlbGxzIHRoZSBzdGFydGluZyBpbmRleCB2YWx1ZVxuICAgKiBvZiB3aGVyZSB0aGUgbXVsdGkgc3R5bGUgZW50cmllcyBiZWdpbi5cbiAgICovXG4gIFtTdHlsaW5nSW5kZXguTWFzdGVyRmxhZ1Bvc2l0aW9uXTogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBBIG51bWVyaWMgdmFsdWUgcmVwcmVzZW50aW5nIHRoZSBjbGFzcyBpbmRleCBvZmZzZXQgdmFsdWUuIFdoZW5ldmVyIGEgc2luZ2xlIGNsYXNzIGlzXG4gICAqIGFwcGxpZWQgKHVzaW5nIGBlbGVtZW50Q2xhc3NQcm9wYCkgaXQgc2hvdWxkIGhhdmUgYW4gc3R5bGluZyBpbmRleCB2YWx1ZSB0aGF0IGRvZXNuJ3RcbiAgICogbmVlZCB0byB0YWtlIGludG8gYWNjb3VudCBhbnkgc3R5bGUgdmFsdWVzIHRoYXQgZXhpc3QgaW4gdGhlIGNvbnRleHQuXG4gICAqL1xuICBbU3R5bGluZ0luZGV4LkNsYXNzT2Zmc2V0UG9zaXRpb25dOiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIExvY2F0aW9uIG9mIGVsZW1lbnQgdGhhdCBpcyB1c2VkIGFzIGEgdGFyZ2V0IGZvciB0aGlzIGNvbnRleHQuXG4gICAqL1xuICBbU3R5bGluZ0luZGV4LkVsZW1lbnRQb3NpdGlvbl06IFJFbGVtZW50fG51bGw7XG5cbiAgLyoqXG4gICAqIFRoZSBsYXN0IGNsYXNzIHZhbHVlIHRoYXQgd2FzIGludGVycHJldGVkIGJ5IGVsZW1lbnRTdHlsaW5nTWFwLiBUaGlzIGlzIGNhY2hlZFxuICAgKiBTbyB0aGF0IHRoZSBhbGdvcml0aG0gY2FuIGV4aXQgZWFybHkgaW5jYXNlIHRoZSB2YWx1ZSBoYXMgbm90IGNoYW5nZWQuXG4gICAqL1xuICBbU3R5bGluZ0luZGV4LlByZXZpb3VzT3JDYWNoZWRNdWx0aUNsYXNzVmFsdWVdOiB7W2tleTogc3RyaW5nXTogYW55fXxzdHJpbmd8bnVsbDtcblxuICAvKipcbiAgICogVGhlIGxhc3Qgc3R5bGUgdmFsdWUgdGhhdCB3YXMgaW50ZXJwcmV0ZWQgYnkgZWxlbWVudFN0eWxpbmdNYXAuIFRoaXMgaXMgY2FjaGVkXG4gICAqIFNvIHRoYXQgdGhlIGFsZ29yaXRobSBjYW4gZXhpdCBlYXJseSBpbmNhc2UgdGhlIHZhbHVlIGhhcyBub3QgY2hhbmdlZC5cbiAgICovXG4gIFtTdHlsaW5nSW5kZXguUHJldmlvdXNNdWx0aVN0eWxlVmFsdWVdOiB7W2tleTogc3RyaW5nXTogYW55fXxudWxsO1xufVxuXG4vKipcbiAqIFRoZSBpbml0aWFsIHN0eWxlcyBpcyBwb3B1bGF0ZWQgd2hldGhlciBvciBub3QgdGhlcmUgYXJlIGFueSBpbml0aWFsIHN0eWxlcyBwYXNzZWQgaW50b1xuICogdGhlIGNvbnRleHQgZHVyaW5nIGFsbG9jYXRpb24uIFRoZSAwdGggdmFsdWUgbXVzdCBiZSBudWxsIHNvIHRoYXQgaW5kZXggdmFsdWVzIG9mIGAwYCB3aXRoaW5cbiAqIHRoZSBjb250ZXh0IGZsYWdzIGNhbiBhbHdheXMgcG9pbnQgdG8gYSBudWxsIHZhbHVlIHNhZmVseSB3aGVuIG5vdGhpbmcgaXMgc2V0LlxuICpcbiAqIEFsbCBvdGhlciBlbnRyaWVzIGluIHRoaXMgYXJyYXkgYXJlIG9mIGBzdHJpbmdgIHZhbHVlIGFuZCBjb3JyZXNwb25kIHRvIHRoZSB2YWx1ZXMgdGhhdFxuICogd2VyZSBleHRyYWN0ZWQgZnJvbSB0aGUgYHN0eWxlPVwiXCJgIGF0dHJpYnV0ZSBpbiB0aGUgSFRNTCBjb2RlIGZvciB0aGUgcHJvdmlkZWQgdGVtcGxhdGUuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgSW5pdGlhbFN0eWxlcyBleHRlbmRzIEFycmF5PHN0cmluZ3xudWxsfGJvb2xlYW4+IHsgWzBdOiBudWxsOyB9XG5cbi8qKlxuICogVXNlZCB0byBzZXQgdGhlIGNvbnRleHQgdG8gYmUgZGlydHkgb3Igbm90IGJvdGggb24gdGhlIG1hc3RlciBmbGFnIChwb3NpdGlvbiAxKVxuICogb3IgZm9yIGVhY2ggc2luZ2xlL211bHRpIHByb3BlcnR5IHRoYXQgZXhpc3RzIGluIHRoZSBjb250ZXh0LlxuICovXG5leHBvcnQgY29uc3QgZW51bSBTdHlsaW5nRmxhZ3Mge1xuICAvLyBJbXBsaWVzIG5vIGNvbmZpZ3VyYXRpb25zXG4gIE5vbmUgPSAwYjAwMDAwLFxuICAvLyBXaGV0aGVyIG9yIG5vdCB0aGUgZW50cnkgb3IgY29udGV4dCBpdHNlbGYgaXMgZGlydHlcbiAgRGlydHkgPSAwYjAwMDAxLFxuICAvLyBXaGV0aGVyIG9yIG5vdCB0aGlzIGlzIGEgY2xhc3MtYmFzZWQgYXNzaWdubWVudFxuICBDbGFzcyA9IDBiMDAwMTAsXG4gIC8vIFdoZXRoZXIgb3Igbm90IGEgc2FuaXRpemVyIHdhcyBhcHBsaWVkIHRvIHRoaXMgcHJvcGVydHlcbiAgU2FuaXRpemUgPSAwYjAwMTAwLFxuICAvLyBXaGV0aGVyIG9yIG5vdCBhbnkgcGxheWVyIGJ1aWxkZXJzIHdpdGhpbiBuZWVkIHRvIHByb2R1Y2UgbmV3IHBsYXllcnNcbiAgUGxheWVyQnVpbGRlcnNEaXJ0eSA9IDBiMDEwMDAsXG4gIC8vIElmIE5nQ2xhc3MgaXMgcHJlc2VudCAob3Igc29tZSBvdGhlciBjbGFzcyBoYW5kbGVyKSB0aGVuIGl0IHdpbGwgaGFuZGxlIHRoZSBtYXAgZXhwcmVzc2lvbnMgYW5kXG4gIC8vIGluaXRpYWwgY2xhc3Nlc1xuICBPbmx5UHJvY2Vzc1NpbmdsZUNsYXNzZXMgPSAwYjEwMDAwLFxuICAvLyBUaGUgbWF4IGFtb3VudCBvZiBiaXRzIHVzZWQgdG8gcmVwcmVzZW50IHRoZXNlIGNvbmZpZ3VyYXRpb24gdmFsdWVzXG4gIEJpdENvdW50U2l6ZSA9IDUsXG4gIC8vIFRoZXJlIGFyZSBvbmx5IGZpdmUgYml0cyBoZXJlXG4gIEJpdE1hc2sgPSAwYjExMTExXG59XG5cbi8qKiBVc2VkIGFzIG51bWVyaWMgcG9pbnRlciB2YWx1ZXMgdG8gZGV0ZXJtaW5lIHdoYXQgY2VsbHMgdG8gdXBkYXRlIGluIHRoZSBgU3R5bGluZ0NvbnRleHRgICovXG5leHBvcnQgY29uc3QgZW51bSBTdHlsaW5nSW5kZXgge1xuICAvLyBQb3NpdGlvbiBvZiB3aGVyZSB0aGUgaW5pdGlhbCBzdHlsZXMgYXJlIHN0b3JlZCBpbiB0aGUgc3R5bGluZyBjb250ZXh0XG4gIFBsYXllckNvbnRleHQgPSAwLFxuICAvLyBQb3NpdGlvbiBvZiB3aGVyZSB0aGUgc3R5bGUgc2FuaXRpemVyIGlzIHN0b3JlZCB3aXRoaW4gdGhlIHN0eWxpbmcgY29udGV4dFxuICBTdHlsZVNhbml0aXplclBvc2l0aW9uID0gMSxcbiAgLy8gUG9zaXRpb24gb2Ygd2hlcmUgdGhlIGluaXRpYWwgc3R5bGVzIGFyZSBzdG9yZWQgaW4gdGhlIHN0eWxpbmcgY29udGV4dFxuICBJbml0aWFsU3R5bGVzUG9zaXRpb24gPSAyLFxuICAvLyBJbmRleCBvZiBsb2NhdGlvbiB3aGVyZSB0aGUgc3RhcnQgb2Ygc2luZ2xlIHByb3BlcnRpZXMgYXJlIHN0b3JlZC4gKGB1cGRhdGVTdHlsZVByb3BgKVxuICBNYXN0ZXJGbGFnUG9zaXRpb24gPSAzLFxuICAvLyBJbmRleCBvZiBsb2NhdGlvbiB3aGVyZSB0aGUgY2xhc3MgaW5kZXggb2Zmc2V0IHZhbHVlIGlzIGxvY2F0ZWRcbiAgQ2xhc3NPZmZzZXRQb3NpdGlvbiA9IDQsXG4gIC8vIFBvc2l0aW9uIG9mIHdoZXJlIHRoZSBpbml0aWFsIHN0eWxlcyBhcmUgc3RvcmVkIGluIHRoZSBzdHlsaW5nIGNvbnRleHRcbiAgLy8gVGhpcyBpbmRleCBtdXN0IGFsaWduIHdpdGggSE9TVCwgc2VlIGludGVyZmFjZXMvdmlldy50c1xuICBFbGVtZW50UG9zaXRpb24gPSA1LFxuICAvLyBQb3NpdGlvbiBvZiB3aGVyZSB0aGUgbGFzdCBzdHJpbmctYmFzZWQgQ1NTIGNsYXNzIHZhbHVlIHdhcyBzdG9yZWQgKG9yIGEgY2FjaGVkIHZlcnNpb24gb2YgdGhlXG4gIC8vIGluaXRpYWwgc3R5bGVzIHdoZW4gYSBbY2xhc3NdIGRpcmVjdGl2ZSBpcyBwcmVzZW50KVxuICBQcmV2aW91c09yQ2FjaGVkTXVsdGlDbGFzc1ZhbHVlID0gNixcbiAgLy8gUG9zaXRpb24gb2Ygd2hlcmUgdGhlIGxhc3Qgc3RyaW5nLWJhc2VkIENTUyBjbGFzcyB2YWx1ZSB3YXMgc3RvcmVkXG4gIFByZXZpb3VzTXVsdGlTdHlsZVZhbHVlID0gNyxcbiAgLy8gTG9jYXRpb24gb2Ygc2luZ2xlIChwcm9wKSB2YWx1ZSBlbnRyaWVzIGFyZSBzdG9yZWQgd2l0aGluIHRoZSBjb250ZXh0XG4gIFNpbmdsZVN0eWxlc1N0YXJ0UG9zaXRpb24gPSA4LFxuICAvLyBNdWx0aSBhbmQgc2luZ2xlIGVudHJpZXMgYXJlIHN0b3JlZCBpbiBgU3R5bGluZ0NvbnRleHRgIGFzOiBGbGFnOyBQcm9wZXJ0eU5hbWU7ICBQcm9wZXJ0eVZhbHVlXG4gIEZsYWdzT2Zmc2V0ID0gMCxcbiAgUHJvcGVydHlPZmZzZXQgPSAxLFxuICBWYWx1ZU9mZnNldCA9IDIsXG4gIFBsYXllckJ1aWxkZXJJbmRleE9mZnNldCA9IDMsXG4gIC8vIFNpemUgb2YgZWFjaCBtdWx0aSBvciBzaW5nbGUgZW50cnkgKGZsYWcgKyBwcm9wICsgdmFsdWUgKyBwbGF5ZXJCdWlsZGVySW5kZXgpXG4gIFNpemUgPSA0LFxuICAvLyBFYWNoIGZsYWcgaGFzIGEgYmluYXJ5IGRpZ2l0IGxlbmd0aCBvZiB0aGlzIHZhbHVlXG4gIEJpdENvdW50U2l6ZSA9IDE0LCAgLy8gKDMyIC0gNCkgLyAyID0gfjE0XG4gIC8vIFRoZSBiaW5hcnkgZGlnaXQgdmFsdWUgYXMgYSBtYXNrXG4gIEJpdE1hc2sgPSAwYjExMTExMTExMTExMTExLCAgLy8gMTQgYml0c1xufVxuIl19