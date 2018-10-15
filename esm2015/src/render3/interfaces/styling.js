/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
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
    // The max amount of bits used to represent these configuration values
    BitCountSize: 3,
    // There are only three bits here
    BitMask: 7,
};
export { StylingFlags };
/** @enum {number} */
var StylingIndex = {
    // Position of where the initial styles are stored in the styling context
    ElementPosition: 0,
    // Position of where the initial styles are stored in the styling context
    PlayerContext: 1,
    // Position of where the style sanitizer is stored within the styling context
    StyleSanitizerPosition: 2,
    // Position of where the initial styles are stored in the styling context
    InitialStylesPosition: 3,
    // Index of location where the start of single properties are stored. (`updateStyleProp`)
    MasterFlagPosition: 4,
    // Index of location where the class index offset value is located
    ClassOffsetPosition: 5,
    // Position of where the last string-based CSS class value was stored
    PreviousMultiClassValue: 6,
    // Position of where the last string-based CSS class value was stored
    PreviousMultiStyleValue: 7,
    // Location of single (prop) value entries are stored within the context
    SingleStylesStartPosition: 8,
    // Multi and single entries are stored in `StylingContext` as: Flag; PropertyName;  PropertyValue
    FlagsOffset: 0,
    PropertyOffset: 1,
    ValueOffset: 2,
    // Size of each multi or single entry (flag + prop + value)
    Size: 3,
    // Each flag has a binary digit length of this value
    BitCountSize: 14,
    // (32 - 3) / 2 = ~14
    // The binary digit value as a mask
    BitMask: 16383 // 14 bits
    ,
};
export { StylingIndex };

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3R5bGluZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaW50ZXJmYWNlcy9zdHlsaW5nLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBMkxFLE9BQVk7O0lBRVosUUFBYTs7SUFFYixRQUFhOztJQUViLFdBQWdCOztJQUVoQixlQUFnQjs7SUFFaEIsVUFBZTs7Ozs7O0lBTWYsa0JBQW1COztJQUVuQixnQkFBaUI7O0lBRWpCLHlCQUEwQjs7SUFFMUIsd0JBQXlCOztJQUV6QixxQkFBc0I7O0lBRXRCLHNCQUF1Qjs7SUFFdkIsMEJBQTJCOztJQUUzQiwwQkFBMkI7O0lBRTNCLDRCQUE2Qjs7SUFFN0IsY0FBZTtJQUNmLGlCQUFrQjtJQUNsQixjQUFlOztJQUVmLE9BQVE7O0lBRVIsZ0JBQWlCOzs7SUFFakIsY0FBMEIiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7U3R5bGVTYW5pdGl6ZUZufSBmcm9tICcuLi8uLi9zYW5pdGl6YXRpb24vc3R5bGVfc2FuaXRpemVyJztcblxuaW1wb3J0IHtMRWxlbWVudE5vZGV9IGZyb20gJy4vbm9kZSc7XG5pbXBvcnQge1BsYXllckNvbnRleHR9IGZyb20gJy4vcGxheWVyJztcblxuXG5cbi8qKlxuICogVGhlIHN0eWxpbmcgY29udGV4dCBhY3RzIGFzIGEgc3R5bGluZyBtYW5pZmVzdCAoc2hhcGVkIGFzIGFuIGFycmF5KSBmb3IgZGV0ZXJtaW5pbmcgd2hpY2hcbiAqIHN0eWxpbmcgcHJvcGVydGllcyBoYXZlIGJlZW4gYXNzaWduZWQgdmlhIHRoZSBwcm92aWRlZCBgdXBkYXRlU3R5bGluZ01hcGAsIGB1cGRhdGVTdHlsZVByb3BgXG4gKiBhbmQgYHVwZGF0ZUNsYXNzUHJvcGAgZnVuY3Rpb25zLiBUaGVyZSBhcmUgYWxzbyB0d28gaW5pdGlhbGl6YXRpb24gZnVuY3Rpb25zXG4gKiBgYWxsb2NTdHlsaW5nQ29udGV4dGAgYW5kIGBjcmVhdGVTdHlsaW5nQ29udGV4dFRlbXBsYXRlYCB3aGljaCBhcmUgdXNlZCB0byBpbml0aWFsaXplXG4gKiBhbmQvb3IgY2xvbmUgdGhlIGNvbnRleHQuXG4gKlxuICogVGhlIGNvbnRleHQgaXMgYW4gYXJyYXkgd2hlcmUgdGhlIGZpcnN0IHR3byBjZWxscyBhcmUgdXNlZCBmb3Igc3RhdGljIGRhdGEgKGluaXRpYWwgc3R5bGluZylcbiAqIGFuZCBkaXJ0eSBmbGFncyAvIGluZGV4IG9mZnNldHMpLiBUaGUgcmVtYWluaW5nIHNldCBvZiBjZWxscyBpcyB1c2VkIGZvciBtdWx0aSAobWFwKSBhbmQgc2luZ2xlXG4gKiAocHJvcCkgc3R5bGUgdmFsdWVzLlxuICpcbiAqIGVhY2ggdmFsdWUgZnJvbSBoZXJlIG9ud2FyZHMgaXMgbWFwcGVkIGFzIHNvOlxuICogW2ldID0gbXV0YXRpb24vdHlwZSBmbGFnIGZvciB0aGUgc3R5bGUvY2xhc3MgdmFsdWVcbiAqIFtpICsgMV0gPSBwcm9wIHN0cmluZyAob3IgbnVsbCBpbmNhc2UgaXQgaGFzIGJlZW4gcmVtb3ZlZClcbiAqIFtpICsgMl0gPSB2YWx1ZSBzdHJpbmcgKG9yIG51bGwgaW5jYXNlIGl0IGhhcyBiZWVuIHJlbW92ZWQpXG4gKlxuICogVGhlcmUgYXJlIHRocmVlIHR5cGVzIG9mIHN0eWxpbmcgdHlwZXMgc3RvcmVkIGluIHRoaXMgY29udGV4dDpcbiAqICAgaW5pdGlhbDogYW55IHN0eWxlcyB0aGF0IGFyZSBwYXNzZWQgaW4gb25jZSB0aGUgY29udGV4dCBpcyBjcmVhdGVkXG4gKiAgICAgICAgICAgICh0aGVzZSBhcmUgc3RvcmVkIGluIHRoZSBmaXJzdCBjZWxsIG9mIHRoZSBhcnJheSBhbmQgdGhlIGZpcnN0XG4gKiAgICAgICAgICAgICB2YWx1ZSBvZiB0aGlzIGFycmF5IGlzIGFsd2F5cyBgbnVsbGAgZXZlbiBpZiBubyBpbml0aWFsIHN0eWxpbmcgZXhpc3RzLlxuICogICAgICAgICAgICAgdGhlIGBudWxsYCB2YWx1ZSBpcyB0aGVyZSBzbyB0aGF0IGFueSBuZXcgc3R5bGVzIGhhdmUgYSBwYXJlbnQgdG8gcG9pbnRcbiAqICAgICAgICAgICAgIHRvLiBUaGlzIHdheSB3ZSBjYW4gYWx3YXlzIGFzc3VtZSB0aGF0IHRoZXJlIGlzIGEgcGFyZW50LilcbiAqXG4gKiAgIHNpbmdsZTogYW55IHN0eWxlcyB0aGF0IGFyZSB1cGRhdGVkIHVzaW5nIGB1cGRhdGVTdHlsZVByb3BgIG9yIGB1cGRhdGVDbGFzc1Byb3BgIChmaXhlZCBzZXQpXG4gKlxuICogICBtdWx0aTogYW55IHN0eWxlcyB0aGF0IGFyZSB1cGRhdGVkIHVzaW5nIGB1cGRhdGVTdHlsaW5nTWFwYCAoZHluYW1pYyBzZXQpXG4gKlxuICogTm90ZSB0aGF0IGNvbnRleHQgaXMgb25seSB1c2VkIHRvIGNvbGxlY3Qgc3R5bGUgaW5mb3JtYXRpb24uIE9ubHkgd2hlbiBgcmVuZGVyU3R5bGluZ2BcbiAqIGlzIGNhbGxlZCBpcyB3aGVuIHRoZSBzdHlsaW5nIHBheWxvYWQgd2lsbCBiZSByZW5kZXJlZCAob3IgYnVpbHQgYXMgYSBrZXkvdmFsdWUgbWFwKS5cbiAqXG4gKiBXaGVuIHRoZSBjb250ZXh0IGlzIGNyZWF0ZWQsIGRlcGVuZGluZyBvbiB3aGF0IGluaXRpYWwgc3R5bGluZyB2YWx1ZXMgYXJlIHBhc3NlZCBpbiwgdGhlXG4gKiBjb250ZXh0IGl0c2VsZiB3aWxsIGJlIHByZS1maWxsZWQgd2l0aCBzbG90cyBiYXNlZCBvbiB0aGUgaW5pdGlhbCBzdHlsZSBwcm9wZXJ0aWVzLiBTYXlcbiAqIGZvciBleGFtcGxlIHdlIGhhdmUgYSBzZXJpZXMgb2YgaW5pdGlhbCBzdHlsZXMgdGhhdCBsb29rIGxpa2Ugc286XG4gKlxuICogICBzdHlsZT1cIndpZHRoOjEwMHB4OyBoZWlnaHQ6MjAwcHg7XCJcbiAqICAgY2xhc3M9XCJmb29cIlxuICpcbiAqIFRoZW4gdGhlIGluaXRpYWwgc3RhdGUgb2YgdGhlIGNvbnRleHQgKG9uY2UgaW5pdGlhbGl6ZWQpIHdpbGwgbG9vayBsaWtlIHNvOlxuICpcbiAqIGBgYFxuICogY29udGV4dCA9IFtcbiAqICAgZWxlbWVudCxcbiAqICAgcGxheWVyQ29udGV4dCB8IG51bGwsXG4gKiAgIHN0eWxlU2FuaXRpemVyIHwgbnVsbCxcbiAqICAgW251bGwsICcxMDBweCcsICcyMDBweCcsIHRydWVdLCAgLy8gcHJvcGVydHkgbmFtZXMgYXJlIG5vdCBuZWVkZWQgc2luY2UgdGhleSBoYXZlIGFscmVhZHkgYmVlblxuICogd3JpdHRlbiB0byBET00uXG4gKlxuICogICBjb25maWdNYXN0ZXJWYWwsXG4gKiAgIDEsIC8vIHRoaXMgaW5zdHJ1Y3RzIGhvdyBtYW55IGBzdHlsZWAgdmFsdWVzIHRoZXJlIGFyZSBzbyB0aGF0IGNsYXNzIGluZGV4IHZhbHVlcyBjYW4gYmVcbiAqIG9mZnNldHRlZFxuICogICB7IGNsYXNzT25lOiB0cnVlLCBjbGFzc1R3bzogZmFsc2UgfSB8ICdjbGFzc09uZSBjbGFzc1R3bycgfCBudWxsIC8vIGxhc3QgY2xhc3MgdmFsdWUgcHJvdmlkZWRcbiAqIGludG8gdXBkYXRlU3R5bGluZ01hcFxuICogICB7IHN0eWxlT25lOiAnMTAwcHgnLCBzdHlsZVR3bzogMCB9IHwgbnVsbCAvLyBsYXN0IHN0eWxlIHZhbHVlIHByb3ZpZGVkIGludG8gdXBkYXRlU3R5bGluZ01hcFxuICpcbiAqICAgLy8gOFxuICogICAnd2lkdGgnLFxuICogICBwb2ludGVycygxLCAxNSk7ICAvLyBQb2ludCB0byBzdGF0aWMgYHdpZHRoYDogYDEwMHB4YCBhbmQgbXVsdGkgYHdpZHRoYC5cbiAqICAgbnVsbCxcbiAqXG4gKiAgIC8vIDExXG4gKiAgICdoZWlnaHQnLFxuICogICBwb2ludGVycygyLCAxOCk7IC8vIFBvaW50IHRvIHN0YXRpYyBgaGVpZ2h0YDogYDIwMHB4YCBhbmQgbXVsdGkgYGhlaWdodGAuXG4gKiAgIG51bGwsXG4gKlxuICogICAvLyAxNFxuICogICAnZm9vJyxcbiAqICAgcG9pbnRlcnMoMSwgMjEpOyAgLy8gUG9pbnQgdG8gc3RhdGljIGBmb29gOiBgdHJ1ZWAgYW5kIG11bHRpIGBmb29gLlxuICogICBudWxsLFxuICpcbiAqICAgLy8gMTdcbiAqICAgJ3dpZHRoJyxcbiAqICAgcG9pbnRlcnMoMSwgNik7ICAvLyBQb2ludCB0byBzdGF0aWMgYHdpZHRoYDogYDEwMHB4YCBhbmQgc2luZ2xlIGB3aWR0aGAuXG4gKiAgIG51bGwsXG4gKlxuICogICAvLyAyMVxuICogICAnaGVpZ2h0JyxcbiAqICAgcG9pbnRlcnMoMiwgOSk7ICAvLyBQb2ludCB0byBzdGF0aWMgYGhlaWdodGA6IGAyMDBweGAgYW5kIHNpbmdsZSBgaGVpZ2h0YC5cbiAqICAgbnVsbCxcbiAqXG4gKiAgIC8vIDI0XG4gKiAgICdmb28nLFxuICogICBwb2ludGVycygzLCAxMik7ICAvLyBQb2ludCB0byBzdGF0aWMgYGZvb2A6IGB0cnVlYCBhbmQgc2luZ2xlIGBmb29gLlxuICogICBudWxsLFxuICogXVxuICpcbiAqIGZ1bmN0aW9uIHBvaW50ZXJzKHN0YXRpY0luZGV4OiBudW1iZXIsIGR5bmFtaWNJbmRleDogbnVtYmVyKSB7XG4gKiAgIC8vIGNvbWJpbmUgdGhlIHR3byBpbmRpY2VzIGludG8gYSBzaW5nbGUgd29yZC5cbiAqICAgcmV0dXJuIChzdGF0aWNJbmRleCA8PCBTdHlsaW5nRmxhZ3MuQml0Q291bnRTaXplKSB8XG4gKiAgICAgKGR5bmFtaWNJbmRleCA8PCAoU3R5bGluZ0luZGV4LkJpdENvdW50U2l6ZSArIFN0eWxpbmdGbGFncy5CaXRDb3VudFNpemUpKTtcbiAqIH1cbiAqIGBgYFxuICpcbiAqIFRoZSB2YWx1ZXMgYXJlIGR1cGxpY2F0ZWQgc28gdGhhdCBzcGFjZSBpcyBzZXQgYXNpZGUgZm9yIGJvdGggbXVsdGkgKFtzdHlsZV0gYW5kIFtjbGFzc10pXG4gKiBhbmQgc2luZ2xlIChbc3R5bGUucHJvcF0gb3IgW2NsYXNzLm5hbWVkXSkgdmFsdWVzLiBUaGUgcmVzcGVjdGl2ZSBjb25maWcgdmFsdWVzXG4gKiAoY29uZmlnVmFsQSwgY29uZmlnVmFsQiwgZXRjLi4uKSBhcmUgYSBjb21iaW5hdGlvbiBvZiB0aGUgU3R5bGluZ0ZsYWdzIHdpdGggdHdvIGluZGV4XG4gKiB2YWx1ZXM6IHRoZSBgaW5pdGlhbEluZGV4YCAod2hpY2ggcG9pbnRzIHRvIHRoZSBpbmRleCBsb2NhdGlvbiBvZiB0aGUgc3R5bGUgdmFsdWUgaW5cbiAqIHRoZSBpbml0aWFsIHN0eWxlcyBhcnJheSBpbiBzbG90IDApIGFuZCB0aGUgYGR5bmFtaWNJbmRleGAgKHdoaWNoIHBvaW50cyB0byB0aGVcbiAqIG1hdGNoaW5nIHNpbmdsZS9tdWx0aSBpbmRleCBwb3NpdGlvbiBpbiB0aGUgY29udGV4dCBhcnJheSBmb3IgdGhlIHNhbWUgcHJvcCkuXG4gKlxuICogVGhpcyBtZWFucyB0aGF0IGV2ZXJ5IHRpbWUgYHVwZGF0ZVN0eWxlUHJvcGAgb3IgYHVwZGF0ZUNsYXNzUHJvcGAgYXJlIGNhbGxlZCB0aGVuIHRoZXlcbiAqIG11c3QgYmUgY2FsbGVkIHVzaW5nIGFuIGluZGV4IHZhbHVlIChub3QgYSBwcm9wZXJ0eSBzdHJpbmcpIHdoaWNoIHJlZmVyZW5jZXMgdGhlIGluZGV4XG4gKiB2YWx1ZSBvZiB0aGUgaW5pdGlhbCBzdHlsZSBwcm9wL2NsYXNzIHdoZW4gdGhlIGNvbnRleHQgd2FzIGNyZWF0ZWQuIFRoaXMgYWxzbyBtZWFucyB0aGF0XG4gKiBgdXBkYXRlU3R5bGVQcm9wYCBvciBgdXBkYXRlQ2xhc3NQcm9wYCBjYW5ub3QgYmUgY2FsbGVkIHdpdGggYSBuZXcgcHJvcGVydHkgKG9ubHlcbiAqIGB1cGRhdGVTdHlsaW5nTWFwYCBjYW4gaW5jbHVkZSBuZXcgQ1NTIHByb3BlcnRpZXMgdGhhdCB3aWxsIGJlIGFkZGVkIHRvIHRoZSBjb250ZXh0KS5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBTdHlsaW5nQ29udGV4dCBleHRlbmRzXG4gICAgQXJyYXk8SW5pdGlhbFN0eWxlc3x7W2tleTogc3RyaW5nXTogYW55fXxudW1iZXJ8c3RyaW5nfGJvb2xlYW58TEVsZW1lbnROb2RlfFN0eWxlU2FuaXRpemVGbnxcbiAgICAgICAgICBQbGF5ZXJDb250ZXh0fG51bGw+IHtcbiAgLyoqXG4gICAqIExvY2F0aW9uIG9mIGVsZW1lbnQgdGhhdCBpcyB1c2VkIGFzIGEgdGFyZ2V0IGZvciB0aGlzIGNvbnRleHQuXG4gICAqL1xuICBbU3R5bGluZ0luZGV4LkVsZW1lbnRQb3NpdGlvbl06IExFbGVtZW50Tm9kZXxudWxsO1xuXG4gIC8qKlxuICAgKiBMb2NhdGlvbiBvZiBhbmltYXRpb24gY29udGV4dCAod2hpY2ggY29udGFpbnMgdGhlIGFjdGl2ZSBwbGF5ZXJzKSBmb3IgdGhpcyBlbGVtZW50IHN0eWxpbmdcbiAgICogY29udGV4dC5cbiAgICovXG4gIFtTdHlsaW5nSW5kZXguUGxheWVyQ29udGV4dF06IFBsYXllckNvbnRleHR8bnVsbDtcblxuICAvKipcbiAgICogVGhlIHN0eWxlIHNhbml0aXplciB0aGF0IGlzIHVzZWQgd2l0aGluIHRoaXMgY29udGV4dFxuICAgKi9cbiAgW1N0eWxpbmdJbmRleC5TdHlsZVNhbml0aXplclBvc2l0aW9uXTogU3R5bGVTYW5pdGl6ZUZufG51bGw7XG5cbiAgLyoqXG4gICAqIExvY2F0aW9uIG9mIGluaXRpYWwgZGF0YSBzaGFyZWQgYnkgYWxsIGluc3RhbmNlcyBvZiB0aGlzIHN0eWxlLlxuICAgKi9cbiAgW1N0eWxpbmdJbmRleC5Jbml0aWFsU3R5bGVzUG9zaXRpb25dOiBJbml0aWFsU3R5bGVzO1xuXG4gIC8qKlxuICAgKiBBIG51bWVyaWMgdmFsdWUgcmVwcmVzZW50aW5nIHRoZSBjb25maWd1cmF0aW9uIHN0YXR1cyAod2hldGhlciB0aGUgY29udGV4dCBpcyBkaXJ0eSBvciBub3QpXG4gICAqIG1peGVkIHRvZ2V0aGVyICh1c2luZyBiaXQgc2hpZnRpbmcpIHdpdGggYSBpbmRleCB2YWx1ZSB3aGljaCB0ZWxscyB0aGUgc3RhcnRpbmcgaW5kZXggdmFsdWVcbiAgICogb2Ygd2hlcmUgdGhlIG11bHRpIHN0eWxlIGVudHJpZXMgYmVnaW4uXG4gICAqL1xuICBbU3R5bGluZ0luZGV4Lk1hc3RlckZsYWdQb3NpdGlvbl06IG51bWJlcjtcblxuICAvKipcbiAgICogQSBudW1lcmljIHZhbHVlIHJlcHJlc2VudGluZyB0aGUgY2xhc3MgaW5kZXggb2Zmc2V0IHZhbHVlLiBXaGVuZXZlciBhIHNpbmdsZSBjbGFzcyBpc1xuICAgKiBhcHBsaWVkICh1c2luZyBgZWxlbWVudENsYXNzUHJvcGApIGl0IHNob3VsZCBoYXZlIGFuIHN0eWxpbmcgaW5kZXggdmFsdWUgdGhhdCBkb2Vzbid0XG4gICAqIG5lZWQgdG8gdGFrZSBpbnRvIGFjY291bnQgYW55IHN0eWxlIHZhbHVlcyB0aGF0IGV4aXN0IGluIHRoZSBjb250ZXh0LlxuICAgKi9cbiAgW1N0eWxpbmdJbmRleC5DbGFzc09mZnNldFBvc2l0aW9uXTogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBUaGUgbGFzdCBjbGFzcyB2YWx1ZSB0aGF0IHdhcyBpbnRlcnByZXRlZCBieSBlbGVtZW50U3R5bGluZ01hcC4gVGhpcyBpcyBjYWNoZWRcbiAgICogU28gdGhhdCB0aGUgYWxnb3JpdGhtIGNhbiBleGl0IGVhcmx5IGluY2FzZSB0aGUgdmFsdWUgaGFzIG5vdCBjaGFuZ2VkLlxuICAgKi9cbiAgW1N0eWxpbmdJbmRleC5QcmV2aW91c011bHRpQ2xhc3NWYWx1ZV06IHtba2V5OiBzdHJpbmddOiBhbnl9fHN0cmluZ3xudWxsO1xuXG4gIC8qKlxuICAgKiBUaGUgbGFzdCBzdHlsZSB2YWx1ZSB0aGF0IHdhcyBpbnRlcnByZXRlZCBieSBlbGVtZW50U3R5bGluZ01hcC4gVGhpcyBpcyBjYWNoZWRcbiAgICogU28gdGhhdCB0aGUgYWxnb3JpdGhtIGNhbiBleGl0IGVhcmx5IGluY2FzZSB0aGUgdmFsdWUgaGFzIG5vdCBjaGFuZ2VkLlxuICAgKi9cbiAgW1N0eWxpbmdJbmRleC5QcmV2aW91c011bHRpU3R5bGVWYWx1ZV06IHtba2V5OiBzdHJpbmddOiBhbnl9fG51bGw7XG59XG5cbi8qKlxuICogVGhlIGluaXRpYWwgc3R5bGVzIGlzIHBvcHVsYXRlZCB3aGV0aGVyIG9yIG5vdCB0aGVyZSBhcmUgYW55IGluaXRpYWwgc3R5bGVzIHBhc3NlZCBpbnRvXG4gKiB0aGUgY29udGV4dCBkdXJpbmcgYWxsb2NhdGlvbi4gVGhlIDB0aCB2YWx1ZSBtdXN0IGJlIG51bGwgc28gdGhhdCBpbmRleCB2YWx1ZXMgb2YgYDBgIHdpdGhpblxuICogdGhlIGNvbnRleHQgZmxhZ3MgY2FuIGFsd2F5cyBwb2ludCB0byBhIG51bGwgdmFsdWUgc2FmZWx5IHdoZW4gbm90aGluZyBpcyBzZXQuXG4gKlxuICogQWxsIG90aGVyIGVudHJpZXMgaW4gdGhpcyBhcnJheSBhcmUgb2YgYHN0cmluZ2AgdmFsdWUgYW5kIGNvcnJlc3BvbmQgdG8gdGhlIHZhbHVlcyB0aGF0XG4gKiB3ZXJlIGV4dHJhY3RlZCBmcm9tIHRoZSBgc3R5bGU9XCJcImAgYXR0cmlidXRlIGluIHRoZSBIVE1MIGNvZGUgZm9yIHRoZSBwcm92aWRlZCB0ZW1wbGF0ZS5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBJbml0aWFsU3R5bGVzIGV4dGVuZHMgQXJyYXk8c3RyaW5nfG51bGx8Ym9vbGVhbj4geyBbMF06IG51bGw7IH1cblxuLyoqXG4gKiBVc2VkIHRvIHNldCB0aGUgY29udGV4dCB0byBiZSBkaXJ0eSBvciBub3QgYm90aCBvbiB0aGUgbWFzdGVyIGZsYWcgKHBvc2l0aW9uIDEpXG4gKiBvciBmb3IgZWFjaCBzaW5nbGUvbXVsdGkgcHJvcGVydHkgdGhhdCBleGlzdHMgaW4gdGhlIGNvbnRleHQuXG4gKi9cbmV4cG9ydCBjb25zdCBlbnVtIFN0eWxpbmdGbGFncyB7XG4gIC8vIEltcGxpZXMgbm8gY29uZmlndXJhdGlvbnNcbiAgTm9uZSA9IDBiMDAwLFxuICAvLyBXaGV0aGVyIG9yIG5vdCB0aGUgZW50cnkgb3IgY29udGV4dCBpdHNlbGYgaXMgZGlydHlcbiAgRGlydHkgPSAwYjAwMSxcbiAgLy8gV2hldGhlciBvciBub3QgdGhpcyBpcyBhIGNsYXNzLWJhc2VkIGFzc2lnbm1lbnRcbiAgQ2xhc3MgPSAwYjAxMCxcbiAgLy8gV2hldGhlciBvciBub3QgYSBzYW5pdGl6ZXIgd2FzIGFwcGxpZWQgdG8gdGhpcyBwcm9wZXJ0eVxuICBTYW5pdGl6ZSA9IDBiMTAwLFxuICAvLyBUaGUgbWF4IGFtb3VudCBvZiBiaXRzIHVzZWQgdG8gcmVwcmVzZW50IHRoZXNlIGNvbmZpZ3VyYXRpb24gdmFsdWVzXG4gIEJpdENvdW50U2l6ZSA9IDMsXG4gIC8vIFRoZXJlIGFyZSBvbmx5IHRocmVlIGJpdHMgaGVyZVxuICBCaXRNYXNrID0gMGIxMTFcbn1cblxuLyoqIFVzZWQgYXMgbnVtZXJpYyBwb2ludGVyIHZhbHVlcyB0byBkZXRlcm1pbmUgd2hhdCBjZWxscyB0byB1cGRhdGUgaW4gdGhlIGBTdHlsaW5nQ29udGV4dGAgKi9cbmV4cG9ydCBjb25zdCBlbnVtIFN0eWxpbmdJbmRleCB7XG4gIC8vIFBvc2l0aW9uIG9mIHdoZXJlIHRoZSBpbml0aWFsIHN0eWxlcyBhcmUgc3RvcmVkIGluIHRoZSBzdHlsaW5nIGNvbnRleHRcbiAgRWxlbWVudFBvc2l0aW9uID0gMCxcbiAgLy8gUG9zaXRpb24gb2Ygd2hlcmUgdGhlIGluaXRpYWwgc3R5bGVzIGFyZSBzdG9yZWQgaW4gdGhlIHN0eWxpbmcgY29udGV4dFxuICBQbGF5ZXJDb250ZXh0ID0gMSxcbiAgLy8gUG9zaXRpb24gb2Ygd2hlcmUgdGhlIHN0eWxlIHNhbml0aXplciBpcyBzdG9yZWQgd2l0aGluIHRoZSBzdHlsaW5nIGNvbnRleHRcbiAgU3R5bGVTYW5pdGl6ZXJQb3NpdGlvbiA9IDIsXG4gIC8vIFBvc2l0aW9uIG9mIHdoZXJlIHRoZSBpbml0aWFsIHN0eWxlcyBhcmUgc3RvcmVkIGluIHRoZSBzdHlsaW5nIGNvbnRleHRcbiAgSW5pdGlhbFN0eWxlc1Bvc2l0aW9uID0gMyxcbiAgLy8gSW5kZXggb2YgbG9jYXRpb24gd2hlcmUgdGhlIHN0YXJ0IG9mIHNpbmdsZSBwcm9wZXJ0aWVzIGFyZSBzdG9yZWQuIChgdXBkYXRlU3R5bGVQcm9wYClcbiAgTWFzdGVyRmxhZ1Bvc2l0aW9uID0gNCxcbiAgLy8gSW5kZXggb2YgbG9jYXRpb24gd2hlcmUgdGhlIGNsYXNzIGluZGV4IG9mZnNldCB2YWx1ZSBpcyBsb2NhdGVkXG4gIENsYXNzT2Zmc2V0UG9zaXRpb24gPSA1LFxuICAvLyBQb3NpdGlvbiBvZiB3aGVyZSB0aGUgbGFzdCBzdHJpbmctYmFzZWQgQ1NTIGNsYXNzIHZhbHVlIHdhcyBzdG9yZWRcbiAgUHJldmlvdXNNdWx0aUNsYXNzVmFsdWUgPSA2LFxuICAvLyBQb3NpdGlvbiBvZiB3aGVyZSB0aGUgbGFzdCBzdHJpbmctYmFzZWQgQ1NTIGNsYXNzIHZhbHVlIHdhcyBzdG9yZWRcbiAgUHJldmlvdXNNdWx0aVN0eWxlVmFsdWUgPSA3LFxuICAvLyBMb2NhdGlvbiBvZiBzaW5nbGUgKHByb3ApIHZhbHVlIGVudHJpZXMgYXJlIHN0b3JlZCB3aXRoaW4gdGhlIGNvbnRleHRcbiAgU2luZ2xlU3R5bGVzU3RhcnRQb3NpdGlvbiA9IDgsXG4gIC8vIE11bHRpIGFuZCBzaW5nbGUgZW50cmllcyBhcmUgc3RvcmVkIGluIGBTdHlsaW5nQ29udGV4dGAgYXM6IEZsYWc7IFByb3BlcnR5TmFtZTsgIFByb3BlcnR5VmFsdWVcbiAgRmxhZ3NPZmZzZXQgPSAwLFxuICBQcm9wZXJ0eU9mZnNldCA9IDEsXG4gIFZhbHVlT2Zmc2V0ID0gMixcbiAgLy8gU2l6ZSBvZiBlYWNoIG11bHRpIG9yIHNpbmdsZSBlbnRyeSAoZmxhZyArIHByb3AgKyB2YWx1ZSlcbiAgU2l6ZSA9IDMsXG4gIC8vIEVhY2ggZmxhZyBoYXMgYSBiaW5hcnkgZGlnaXQgbGVuZ3RoIG9mIHRoaXMgdmFsdWVcbiAgQml0Q291bnRTaXplID0gMTQsICAvLyAoMzIgLSAzKSAvIDIgPSB+MTRcbiAgLy8gVGhlIGJpbmFyeSBkaWdpdCB2YWx1ZSBhcyBhIG1hc2tcbiAgQml0TWFzayA9IDBiMTExMTExMTExMTExMTEgIC8vIDE0IGJpdHNcbn1cbiJdfQ==