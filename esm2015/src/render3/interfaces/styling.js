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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3R5bGluZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaW50ZXJmYWNlcy9zdHlsaW5nLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBMExFLE9BQVk7O0lBRVosUUFBYTs7SUFFYixRQUFhOztJQUViLFdBQWdCOztJQUVoQixlQUFnQjs7SUFFaEIsVUFBZTs7Ozs7O0lBTWYsZ0JBQWlCOztJQUVqQix5QkFBMEI7O0lBRTFCLHdCQUF5Qjs7SUFFekIscUJBQXNCOztJQUV0QixzQkFBdUI7OztJQUd2QixrQkFBbUI7O0lBRW5CLDBCQUEyQjs7SUFFM0IsMEJBQTJCOztJQUUzQiw0QkFBNkI7O0lBRTdCLGNBQWU7SUFDZixpQkFBa0I7SUFDbEIsY0FBZTs7SUFFZixPQUFROztJQUVSLGdCQUFpQjs7O0lBRWpCLGNBQTBCIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1N0eWxlU2FuaXRpemVGbn0gZnJvbSAnLi4vLi4vc2FuaXRpemF0aW9uL3N0eWxlX3Nhbml0aXplcic7XG5pbXBvcnQge1JFbGVtZW50fSBmcm9tICcuLi9pbnRlcmZhY2VzL3JlbmRlcmVyJztcblxuaW1wb3J0IHtQbGF5ZXJDb250ZXh0fSBmcm9tICcuL3BsYXllcic7XG5cblxuXG4vKipcbiAqIFRoZSBzdHlsaW5nIGNvbnRleHQgYWN0cyBhcyBhIHN0eWxpbmcgbWFuaWZlc3QgKHNoYXBlZCBhcyBhbiBhcnJheSkgZm9yIGRldGVybWluaW5nIHdoaWNoXG4gKiBzdHlsaW5nIHByb3BlcnRpZXMgaGF2ZSBiZWVuIGFzc2lnbmVkIHZpYSB0aGUgcHJvdmlkZWQgYHVwZGF0ZVN0eWxpbmdNYXBgLCBgdXBkYXRlU3R5bGVQcm9wYFxuICogYW5kIGB1cGRhdGVDbGFzc1Byb3BgIGZ1bmN0aW9ucy4gVGhlcmUgYXJlIGFsc28gdHdvIGluaXRpYWxpemF0aW9uIGZ1bmN0aW9uc1xuICogYGFsbG9jU3R5bGluZ0NvbnRleHRgIGFuZCBgY3JlYXRlU3R5bGluZ0NvbnRleHRUZW1wbGF0ZWAgd2hpY2ggYXJlIHVzZWQgdG8gaW5pdGlhbGl6ZVxuICogYW5kL29yIGNsb25lIHRoZSBjb250ZXh0LlxuICpcbiAqIFRoZSBjb250ZXh0IGlzIGFuIGFycmF5IHdoZXJlIHRoZSBmaXJzdCB0d28gY2VsbHMgYXJlIHVzZWQgZm9yIHN0YXRpYyBkYXRhIChpbml0aWFsIHN0eWxpbmcpXG4gKiBhbmQgZGlydHkgZmxhZ3MgLyBpbmRleCBvZmZzZXRzKS4gVGhlIHJlbWFpbmluZyBzZXQgb2YgY2VsbHMgaXMgdXNlZCBmb3IgbXVsdGkgKG1hcCkgYW5kIHNpbmdsZVxuICogKHByb3ApIHN0eWxlIHZhbHVlcy5cbiAqXG4gKiBlYWNoIHZhbHVlIGZyb20gaGVyZSBvbndhcmRzIGlzIG1hcHBlZCBhcyBzbzpcbiAqIFtpXSA9IG11dGF0aW9uL3R5cGUgZmxhZyBmb3IgdGhlIHN0eWxlL2NsYXNzIHZhbHVlXG4gKiBbaSArIDFdID0gcHJvcCBzdHJpbmcgKG9yIG51bGwgaW5jYXNlIGl0IGhhcyBiZWVuIHJlbW92ZWQpXG4gKiBbaSArIDJdID0gdmFsdWUgc3RyaW5nIChvciBudWxsIGluY2FzZSBpdCBoYXMgYmVlbiByZW1vdmVkKVxuICpcbiAqIFRoZXJlIGFyZSB0aHJlZSB0eXBlcyBvZiBzdHlsaW5nIHR5cGVzIHN0b3JlZCBpbiB0aGlzIGNvbnRleHQ6XG4gKiAgIGluaXRpYWw6IGFueSBzdHlsZXMgdGhhdCBhcmUgcGFzc2VkIGluIG9uY2UgdGhlIGNvbnRleHQgaXMgY3JlYXRlZFxuICogICAgICAgICAgICAodGhlc2UgYXJlIHN0b3JlZCBpbiB0aGUgZmlyc3QgY2VsbCBvZiB0aGUgYXJyYXkgYW5kIHRoZSBmaXJzdFxuICogICAgICAgICAgICAgdmFsdWUgb2YgdGhpcyBhcnJheSBpcyBhbHdheXMgYG51bGxgIGV2ZW4gaWYgbm8gaW5pdGlhbCBzdHlsaW5nIGV4aXN0cy5cbiAqICAgICAgICAgICAgIHRoZSBgbnVsbGAgdmFsdWUgaXMgdGhlcmUgc28gdGhhdCBhbnkgbmV3IHN0eWxlcyBoYXZlIGEgcGFyZW50IHRvIHBvaW50XG4gKiAgICAgICAgICAgICB0by4gVGhpcyB3YXkgd2UgY2FuIGFsd2F5cyBhc3N1bWUgdGhhdCB0aGVyZSBpcyBhIHBhcmVudC4pXG4gKlxuICogICBzaW5nbGU6IGFueSBzdHlsZXMgdGhhdCBhcmUgdXBkYXRlZCB1c2luZyBgdXBkYXRlU3R5bGVQcm9wYCBvciBgdXBkYXRlQ2xhc3NQcm9wYCAoZml4ZWQgc2V0KVxuICpcbiAqICAgbXVsdGk6IGFueSBzdHlsZXMgdGhhdCBhcmUgdXBkYXRlZCB1c2luZyBgdXBkYXRlU3R5bGluZ01hcGAgKGR5bmFtaWMgc2V0KVxuICpcbiAqIE5vdGUgdGhhdCBjb250ZXh0IGlzIG9ubHkgdXNlZCB0byBjb2xsZWN0IHN0eWxlIGluZm9ybWF0aW9uLiBPbmx5IHdoZW4gYHJlbmRlclN0eWxpbmdgXG4gKiBpcyBjYWxsZWQgaXMgd2hlbiB0aGUgc3R5bGluZyBwYXlsb2FkIHdpbGwgYmUgcmVuZGVyZWQgKG9yIGJ1aWx0IGFzIGEga2V5L3ZhbHVlIG1hcCkuXG4gKlxuICogV2hlbiB0aGUgY29udGV4dCBpcyBjcmVhdGVkLCBkZXBlbmRpbmcgb24gd2hhdCBpbml0aWFsIHN0eWxpbmcgdmFsdWVzIGFyZSBwYXNzZWQgaW4sIHRoZVxuICogY29udGV4dCBpdHNlbGYgd2lsbCBiZSBwcmUtZmlsbGVkIHdpdGggc2xvdHMgYmFzZWQgb24gdGhlIGluaXRpYWwgc3R5bGUgcHJvcGVydGllcy4gU2F5XG4gKiBmb3IgZXhhbXBsZSB3ZSBoYXZlIGEgc2VyaWVzIG9mIGluaXRpYWwgc3R5bGVzIHRoYXQgbG9vayBsaWtlIHNvOlxuICpcbiAqICAgc3R5bGU9XCJ3aWR0aDoxMDBweDsgaGVpZ2h0OjIwMHB4O1wiXG4gKiAgIGNsYXNzPVwiZm9vXCJcbiAqXG4gKiBUaGVuIHRoZSBpbml0aWFsIHN0YXRlIG9mIHRoZSBjb250ZXh0IChvbmNlIGluaXRpYWxpemVkKSB3aWxsIGxvb2sgbGlrZSBzbzpcbiAqXG4gKiBgYGBcbiAqIGNvbnRleHQgPSBbXG4gKiAgIGVsZW1lbnQsXG4gKiAgIHBsYXllckNvbnRleHQgfCBudWxsLFxuICogICBzdHlsZVNhbml0aXplciB8IG51bGwsXG4gKiAgIFtudWxsLCAnMTAwcHgnLCAnMjAwcHgnLCB0cnVlXSwgIC8vIHByb3BlcnR5IG5hbWVzIGFyZSBub3QgbmVlZGVkIHNpbmNlIHRoZXkgaGF2ZSBhbHJlYWR5IGJlZW5cbiAqIHdyaXR0ZW4gdG8gRE9NLlxuICpcbiAqICAgY29uZmlnTWFzdGVyVmFsLFxuICogICAxLCAvLyB0aGlzIGluc3RydWN0cyBob3cgbWFueSBgc3R5bGVgIHZhbHVlcyB0aGVyZSBhcmUgc28gdGhhdCBjbGFzcyBpbmRleCB2YWx1ZXMgY2FuIGJlXG4gKiBvZmZzZXR0ZWRcbiAqICAgeyBjbGFzc09uZTogdHJ1ZSwgY2xhc3NUd286IGZhbHNlIH0gfCAnY2xhc3NPbmUgY2xhc3NUd28nIHwgbnVsbCAvLyBsYXN0IGNsYXNzIHZhbHVlIHByb3ZpZGVkXG4gKiBpbnRvIHVwZGF0ZVN0eWxpbmdNYXBcbiAqICAgeyBzdHlsZU9uZTogJzEwMHB4Jywgc3R5bGVUd286IDAgfSB8IG51bGwgLy8gbGFzdCBzdHlsZSB2YWx1ZSBwcm92aWRlZCBpbnRvIHVwZGF0ZVN0eWxpbmdNYXBcbiAqXG4gKiAgIC8vIDhcbiAqICAgJ3dpZHRoJyxcbiAqICAgcG9pbnRlcnMoMSwgMTUpOyAgLy8gUG9pbnQgdG8gc3RhdGljIGB3aWR0aGA6IGAxMDBweGAgYW5kIG11bHRpIGB3aWR0aGAuXG4gKiAgIG51bGwsXG4gKlxuICogICAvLyAxMVxuICogICAnaGVpZ2h0JyxcbiAqICAgcG9pbnRlcnMoMiwgMTgpOyAvLyBQb2ludCB0byBzdGF0aWMgYGhlaWdodGA6IGAyMDBweGAgYW5kIG11bHRpIGBoZWlnaHRgLlxuICogICBudWxsLFxuICpcbiAqICAgLy8gMTRcbiAqICAgJ2ZvbycsXG4gKiAgIHBvaW50ZXJzKDEsIDIxKTsgIC8vIFBvaW50IHRvIHN0YXRpYyBgZm9vYDogYHRydWVgIGFuZCBtdWx0aSBgZm9vYC5cbiAqICAgbnVsbCxcbiAqXG4gKiAgIC8vIDE3XG4gKiAgICd3aWR0aCcsXG4gKiAgIHBvaW50ZXJzKDEsIDYpOyAgLy8gUG9pbnQgdG8gc3RhdGljIGB3aWR0aGA6IGAxMDBweGAgYW5kIHNpbmdsZSBgd2lkdGhgLlxuICogICBudWxsLFxuICpcbiAqICAgLy8gMjFcbiAqICAgJ2hlaWdodCcsXG4gKiAgIHBvaW50ZXJzKDIsIDkpOyAgLy8gUG9pbnQgdG8gc3RhdGljIGBoZWlnaHRgOiBgMjAwcHhgIGFuZCBzaW5nbGUgYGhlaWdodGAuXG4gKiAgIG51bGwsXG4gKlxuICogICAvLyAyNFxuICogICAnZm9vJyxcbiAqICAgcG9pbnRlcnMoMywgMTIpOyAgLy8gUG9pbnQgdG8gc3RhdGljIGBmb29gOiBgdHJ1ZWAgYW5kIHNpbmdsZSBgZm9vYC5cbiAqICAgbnVsbCxcbiAqIF1cbiAqXG4gKiBmdW5jdGlvbiBwb2ludGVycyhzdGF0aWNJbmRleDogbnVtYmVyLCBkeW5hbWljSW5kZXg6IG51bWJlcikge1xuICogICAvLyBjb21iaW5lIHRoZSB0d28gaW5kaWNlcyBpbnRvIGEgc2luZ2xlIHdvcmQuXG4gKiAgIHJldHVybiAoc3RhdGljSW5kZXggPDwgU3R5bGluZ0ZsYWdzLkJpdENvdW50U2l6ZSkgfFxuICogICAgIChkeW5hbWljSW5kZXggPDwgKFN0eWxpbmdJbmRleC5CaXRDb3VudFNpemUgKyBTdHlsaW5nRmxhZ3MuQml0Q291bnRTaXplKSk7XG4gKiB9XG4gKiBgYGBcbiAqXG4gKiBUaGUgdmFsdWVzIGFyZSBkdXBsaWNhdGVkIHNvIHRoYXQgc3BhY2UgaXMgc2V0IGFzaWRlIGZvciBib3RoIG11bHRpIChbc3R5bGVdIGFuZCBbY2xhc3NdKVxuICogYW5kIHNpbmdsZSAoW3N0eWxlLnByb3BdIG9yIFtjbGFzcy5uYW1lZF0pIHZhbHVlcy4gVGhlIHJlc3BlY3RpdmUgY29uZmlnIHZhbHVlc1xuICogKGNvbmZpZ1ZhbEEsIGNvbmZpZ1ZhbEIsIGV0Yy4uLikgYXJlIGEgY29tYmluYXRpb24gb2YgdGhlIFN0eWxpbmdGbGFncyB3aXRoIHR3byBpbmRleFxuICogdmFsdWVzOiB0aGUgYGluaXRpYWxJbmRleGAgKHdoaWNoIHBvaW50cyB0byB0aGUgaW5kZXggbG9jYXRpb24gb2YgdGhlIHN0eWxlIHZhbHVlIGluXG4gKiB0aGUgaW5pdGlhbCBzdHlsZXMgYXJyYXkgaW4gc2xvdCAwKSBhbmQgdGhlIGBkeW5hbWljSW5kZXhgICh3aGljaCBwb2ludHMgdG8gdGhlXG4gKiBtYXRjaGluZyBzaW5nbGUvbXVsdGkgaW5kZXggcG9zaXRpb24gaW4gdGhlIGNvbnRleHQgYXJyYXkgZm9yIHRoZSBzYW1lIHByb3ApLlxuICpcbiAqIFRoaXMgbWVhbnMgdGhhdCBldmVyeSB0aW1lIGB1cGRhdGVTdHlsZVByb3BgIG9yIGB1cGRhdGVDbGFzc1Byb3BgIGFyZSBjYWxsZWQgdGhlbiB0aGV5XG4gKiBtdXN0IGJlIGNhbGxlZCB1c2luZyBhbiBpbmRleCB2YWx1ZSAobm90IGEgcHJvcGVydHkgc3RyaW5nKSB3aGljaCByZWZlcmVuY2VzIHRoZSBpbmRleFxuICogdmFsdWUgb2YgdGhlIGluaXRpYWwgc3R5bGUgcHJvcC9jbGFzcyB3aGVuIHRoZSBjb250ZXh0IHdhcyBjcmVhdGVkLiBUaGlzIGFsc28gbWVhbnMgdGhhdFxuICogYHVwZGF0ZVN0eWxlUHJvcGAgb3IgYHVwZGF0ZUNsYXNzUHJvcGAgY2Fubm90IGJlIGNhbGxlZCB3aXRoIGEgbmV3IHByb3BlcnR5IChvbmx5XG4gKiBgdXBkYXRlU3R5bGluZ01hcGAgY2FuIGluY2x1ZGUgbmV3IENTUyBwcm9wZXJ0aWVzIHRoYXQgd2lsbCBiZSBhZGRlZCB0byB0aGUgY29udGV4dCkuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgU3R5bGluZ0NvbnRleHQgZXh0ZW5kcyBBcnJheTxJbml0aWFsU3R5bGVzfHtba2V5OiBzdHJpbmddOiBhbnl9fG51bWJlcnxzdHJpbmd8XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYm9vbGVhbnxSRWxlbWVudHxTdHlsZVNhbml0aXplRm58UGxheWVyQ29udGV4dHxudWxsPiB7XG4gIC8qKlxuICAgKiBMb2NhdGlvbiBvZiBhbmltYXRpb24gY29udGV4dCAod2hpY2ggY29udGFpbnMgdGhlIGFjdGl2ZSBwbGF5ZXJzKSBmb3IgdGhpcyBlbGVtZW50IHN0eWxpbmdcbiAgICogY29udGV4dC5cbiAgICovXG4gIFtTdHlsaW5nSW5kZXguUGxheWVyQ29udGV4dF06IFBsYXllckNvbnRleHR8bnVsbDtcblxuICAvKipcbiAgICogVGhlIHN0eWxlIHNhbml0aXplciB0aGF0IGlzIHVzZWQgd2l0aGluIHRoaXMgY29udGV4dFxuICAgKi9cbiAgW1N0eWxpbmdJbmRleC5TdHlsZVNhbml0aXplclBvc2l0aW9uXTogU3R5bGVTYW5pdGl6ZUZufG51bGw7XG5cbiAgLyoqXG4gICAqIExvY2F0aW9uIG9mIGluaXRpYWwgZGF0YSBzaGFyZWQgYnkgYWxsIGluc3RhbmNlcyBvZiB0aGlzIHN0eWxlLlxuICAgKi9cbiAgW1N0eWxpbmdJbmRleC5Jbml0aWFsU3R5bGVzUG9zaXRpb25dOiBJbml0aWFsU3R5bGVzO1xuXG4gIC8qKlxuICAgKiBBIG51bWVyaWMgdmFsdWUgcmVwcmVzZW50aW5nIHRoZSBjb25maWd1cmF0aW9uIHN0YXR1cyAod2hldGhlciB0aGUgY29udGV4dCBpcyBkaXJ0eSBvciBub3QpXG4gICAqIG1peGVkIHRvZ2V0aGVyICh1c2luZyBiaXQgc2hpZnRpbmcpIHdpdGggYSBpbmRleCB2YWx1ZSB3aGljaCB0ZWxscyB0aGUgc3RhcnRpbmcgaW5kZXggdmFsdWVcbiAgICogb2Ygd2hlcmUgdGhlIG11bHRpIHN0eWxlIGVudHJpZXMgYmVnaW4uXG4gICAqL1xuICBbU3R5bGluZ0luZGV4Lk1hc3RlckZsYWdQb3NpdGlvbl06IG51bWJlcjtcblxuICAvKipcbiAgICogQSBudW1lcmljIHZhbHVlIHJlcHJlc2VudGluZyB0aGUgY2xhc3MgaW5kZXggb2Zmc2V0IHZhbHVlLiBXaGVuZXZlciBhIHNpbmdsZSBjbGFzcyBpc1xuICAgKiBhcHBsaWVkICh1c2luZyBgZWxlbWVudENsYXNzUHJvcGApIGl0IHNob3VsZCBoYXZlIGFuIHN0eWxpbmcgaW5kZXggdmFsdWUgdGhhdCBkb2Vzbid0XG4gICAqIG5lZWQgdG8gdGFrZSBpbnRvIGFjY291bnQgYW55IHN0eWxlIHZhbHVlcyB0aGF0IGV4aXN0IGluIHRoZSBjb250ZXh0LlxuICAgKi9cbiAgW1N0eWxpbmdJbmRleC5DbGFzc09mZnNldFBvc2l0aW9uXTogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBMb2NhdGlvbiBvZiBlbGVtZW50IHRoYXQgaXMgdXNlZCBhcyBhIHRhcmdldCBmb3IgdGhpcyBjb250ZXh0LlxuICAgKi9cbiAgW1N0eWxpbmdJbmRleC5FbGVtZW50UG9zaXRpb25dOiBSRWxlbWVudHxudWxsO1xuXG4gIC8qKlxuICAgKiBUaGUgbGFzdCBjbGFzcyB2YWx1ZSB0aGF0IHdhcyBpbnRlcnByZXRlZCBieSBlbGVtZW50U3R5bGluZ01hcC4gVGhpcyBpcyBjYWNoZWRcbiAgICogU28gdGhhdCB0aGUgYWxnb3JpdGhtIGNhbiBleGl0IGVhcmx5IGluY2FzZSB0aGUgdmFsdWUgaGFzIG5vdCBjaGFuZ2VkLlxuICAgKi9cbiAgW1N0eWxpbmdJbmRleC5QcmV2aW91c011bHRpQ2xhc3NWYWx1ZV06IHtba2V5OiBzdHJpbmddOiBhbnl9fHN0cmluZ3xudWxsO1xuXG4gIC8qKlxuICAgKiBUaGUgbGFzdCBzdHlsZSB2YWx1ZSB0aGF0IHdhcyBpbnRlcnByZXRlZCBieSBlbGVtZW50U3R5bGluZ01hcC4gVGhpcyBpcyBjYWNoZWRcbiAgICogU28gdGhhdCB0aGUgYWxnb3JpdGhtIGNhbiBleGl0IGVhcmx5IGluY2FzZSB0aGUgdmFsdWUgaGFzIG5vdCBjaGFuZ2VkLlxuICAgKi9cbiAgW1N0eWxpbmdJbmRleC5QcmV2aW91c011bHRpU3R5bGVWYWx1ZV06IHtba2V5OiBzdHJpbmddOiBhbnl9fG51bGw7XG59XG5cbi8qKlxuICogVGhlIGluaXRpYWwgc3R5bGVzIGlzIHBvcHVsYXRlZCB3aGV0aGVyIG9yIG5vdCB0aGVyZSBhcmUgYW55IGluaXRpYWwgc3R5bGVzIHBhc3NlZCBpbnRvXG4gKiB0aGUgY29udGV4dCBkdXJpbmcgYWxsb2NhdGlvbi4gVGhlIDB0aCB2YWx1ZSBtdXN0IGJlIG51bGwgc28gdGhhdCBpbmRleCB2YWx1ZXMgb2YgYDBgIHdpdGhpblxuICogdGhlIGNvbnRleHQgZmxhZ3MgY2FuIGFsd2F5cyBwb2ludCB0byBhIG51bGwgdmFsdWUgc2FmZWx5IHdoZW4gbm90aGluZyBpcyBzZXQuXG4gKlxuICogQWxsIG90aGVyIGVudHJpZXMgaW4gdGhpcyBhcnJheSBhcmUgb2YgYHN0cmluZ2AgdmFsdWUgYW5kIGNvcnJlc3BvbmQgdG8gdGhlIHZhbHVlcyB0aGF0XG4gKiB3ZXJlIGV4dHJhY3RlZCBmcm9tIHRoZSBgc3R5bGU9XCJcImAgYXR0cmlidXRlIGluIHRoZSBIVE1MIGNvZGUgZm9yIHRoZSBwcm92aWRlZCB0ZW1wbGF0ZS5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBJbml0aWFsU3R5bGVzIGV4dGVuZHMgQXJyYXk8c3RyaW5nfG51bGx8Ym9vbGVhbj4geyBbMF06IG51bGw7IH1cblxuLyoqXG4gKiBVc2VkIHRvIHNldCB0aGUgY29udGV4dCB0byBiZSBkaXJ0eSBvciBub3QgYm90aCBvbiB0aGUgbWFzdGVyIGZsYWcgKHBvc2l0aW9uIDEpXG4gKiBvciBmb3IgZWFjaCBzaW5nbGUvbXVsdGkgcHJvcGVydHkgdGhhdCBleGlzdHMgaW4gdGhlIGNvbnRleHQuXG4gKi9cbmV4cG9ydCBjb25zdCBlbnVtIFN0eWxpbmdGbGFncyB7XG4gIC8vIEltcGxpZXMgbm8gY29uZmlndXJhdGlvbnNcbiAgTm9uZSA9IDBiMDAwLFxuICAvLyBXaGV0aGVyIG9yIG5vdCB0aGUgZW50cnkgb3IgY29udGV4dCBpdHNlbGYgaXMgZGlydHlcbiAgRGlydHkgPSAwYjAwMSxcbiAgLy8gV2hldGhlciBvciBub3QgdGhpcyBpcyBhIGNsYXNzLWJhc2VkIGFzc2lnbm1lbnRcbiAgQ2xhc3MgPSAwYjAxMCxcbiAgLy8gV2hldGhlciBvciBub3QgYSBzYW5pdGl6ZXIgd2FzIGFwcGxpZWQgdG8gdGhpcyBwcm9wZXJ0eVxuICBTYW5pdGl6ZSA9IDBiMTAwLFxuICAvLyBUaGUgbWF4IGFtb3VudCBvZiBiaXRzIHVzZWQgdG8gcmVwcmVzZW50IHRoZXNlIGNvbmZpZ3VyYXRpb24gdmFsdWVzXG4gIEJpdENvdW50U2l6ZSA9IDMsXG4gIC8vIFRoZXJlIGFyZSBvbmx5IHRocmVlIGJpdHMgaGVyZVxuICBCaXRNYXNrID0gMGIxMTFcbn1cblxuLyoqIFVzZWQgYXMgbnVtZXJpYyBwb2ludGVyIHZhbHVlcyB0byBkZXRlcm1pbmUgd2hhdCBjZWxscyB0byB1cGRhdGUgaW4gdGhlIGBTdHlsaW5nQ29udGV4dGAgKi9cbmV4cG9ydCBjb25zdCBlbnVtIFN0eWxpbmdJbmRleCB7XG4gIC8vIFBvc2l0aW9uIG9mIHdoZXJlIHRoZSBpbml0aWFsIHN0eWxlcyBhcmUgc3RvcmVkIGluIHRoZSBzdHlsaW5nIGNvbnRleHRcbiAgUGxheWVyQ29udGV4dCA9IDAsXG4gIC8vIFBvc2l0aW9uIG9mIHdoZXJlIHRoZSBzdHlsZSBzYW5pdGl6ZXIgaXMgc3RvcmVkIHdpdGhpbiB0aGUgc3R5bGluZyBjb250ZXh0XG4gIFN0eWxlU2FuaXRpemVyUG9zaXRpb24gPSAxLFxuICAvLyBQb3NpdGlvbiBvZiB3aGVyZSB0aGUgaW5pdGlhbCBzdHlsZXMgYXJlIHN0b3JlZCBpbiB0aGUgc3R5bGluZyBjb250ZXh0XG4gIEluaXRpYWxTdHlsZXNQb3NpdGlvbiA9IDIsXG4gIC8vIEluZGV4IG9mIGxvY2F0aW9uIHdoZXJlIHRoZSBzdGFydCBvZiBzaW5nbGUgcHJvcGVydGllcyBhcmUgc3RvcmVkLiAoYHVwZGF0ZVN0eWxlUHJvcGApXG4gIE1hc3RlckZsYWdQb3NpdGlvbiA9IDMsXG4gIC8vIEluZGV4IG9mIGxvY2F0aW9uIHdoZXJlIHRoZSBjbGFzcyBpbmRleCBvZmZzZXQgdmFsdWUgaXMgbG9jYXRlZFxuICBDbGFzc09mZnNldFBvc2l0aW9uID0gNCxcbiAgLy8gUG9zaXRpb24gb2Ygd2hlcmUgdGhlIGluaXRpYWwgc3R5bGVzIGFyZSBzdG9yZWQgaW4gdGhlIHN0eWxpbmcgY29udGV4dFxuICAvLyBUaGlzIGluZGV4IG11c3QgYWxpZ24gd2l0aCBIT1NULCBzZWUgaW50ZXJmYWNlcy92aWV3LnRzXG4gIEVsZW1lbnRQb3NpdGlvbiA9IDUsXG4gIC8vIFBvc2l0aW9uIG9mIHdoZXJlIHRoZSBsYXN0IHN0cmluZy1iYXNlZCBDU1MgY2xhc3MgdmFsdWUgd2FzIHN0b3JlZFxuICBQcmV2aW91c011bHRpQ2xhc3NWYWx1ZSA9IDYsXG4gIC8vIFBvc2l0aW9uIG9mIHdoZXJlIHRoZSBsYXN0IHN0cmluZy1iYXNlZCBDU1MgY2xhc3MgdmFsdWUgd2FzIHN0b3JlZFxuICBQcmV2aW91c011bHRpU3R5bGVWYWx1ZSA9IDcsXG4gIC8vIExvY2F0aW9uIG9mIHNpbmdsZSAocHJvcCkgdmFsdWUgZW50cmllcyBhcmUgc3RvcmVkIHdpdGhpbiB0aGUgY29udGV4dFxuICBTaW5nbGVTdHlsZXNTdGFydFBvc2l0aW9uID0gOCxcbiAgLy8gTXVsdGkgYW5kIHNpbmdsZSBlbnRyaWVzIGFyZSBzdG9yZWQgaW4gYFN0eWxpbmdDb250ZXh0YCBhczogRmxhZzsgUHJvcGVydHlOYW1lOyAgUHJvcGVydHlWYWx1ZVxuICBGbGFnc09mZnNldCA9IDAsXG4gIFByb3BlcnR5T2Zmc2V0ID0gMSxcbiAgVmFsdWVPZmZzZXQgPSAyLFxuICAvLyBTaXplIG9mIGVhY2ggbXVsdGkgb3Igc2luZ2xlIGVudHJ5IChmbGFnICsgcHJvcCArIHZhbHVlKVxuICBTaXplID0gMyxcbiAgLy8gRWFjaCBmbGFnIGhhcyBhIGJpbmFyeSBkaWdpdCBsZW5ndGggb2YgdGhpcyB2YWx1ZVxuICBCaXRDb3VudFNpemUgPSAxNCwgIC8vICgzMiAtIDMpIC8gMiA9IH4xNFxuICAvLyBUaGUgYmluYXJ5IGRpZ2l0IHZhbHVlIGFzIGEgbWFza1xuICBCaXRNYXNrID0gMGIxMTExMTExMTExMTExMSAgLy8gMTQgYml0c1xufVxuIl19