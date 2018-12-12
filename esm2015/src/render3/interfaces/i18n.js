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
/** @enum {number} */
var I18nMutateOpCode = {
    SHIFT_REF: 3,
    SHIFT_PARENT: 17,
    MASK_OPCODE: 7,
    MASK_REF: 136,
    Select: 0,
    AppendChild: 1,
    InsertBefore: 2,
    Remove: 3,
    Attr: 4,
    ElementEnd: 5,
    RemoveNestedIcu: 6,
};
export { I18nMutateOpCode };
/** *
 * Marks that the next string is for element.
 *
 * See `I18nMutateOpCodes` documentation.
  @type {?} */
export const ELEMENT_MARKER = {
    marker: 'element'
};
/** *
 * Marks that the next string is for comment.
 *
 * See `I18nMutateOpCodes` documentation.
  @type {?} */
export const COMMENT_MARKER = {
    marker: 'comment'
};
/**
 * Array storing OpCode for dynamically creating `i18n` blocks.
 *
 * Example:
 * ```
 * <I18nCreateOpCode>[
 *   // For adding text nodes
 *   // ---------------------
 *   // Equivalent to:
 *   //   const node = lView[index++] = document.createTextNode('abc');
 *   //   lView[1].insertBefore(node, lView[2]);
 *   'abc', 1 << SHIFT_PARENT | 2 << SHIFT_REF | InsertBefore,
 *
 *   // Equivalent to:
 *   //   const node = lView[index++] = document.createTextNode('xyz');
 *   //   lView[1].appendChild(node);
 *   'xyz', 1 << SHIFT_PARENT | AppendChild,
 *
 *   // For adding element nodes
 *   // ---------------------
 *   // Equivalent to:
 *   //   const node = lView[index++] = document.createElement('div');
 *   //   lView[1].insertBefore(node, lView[2]);
 *   ELEMENT_MARKER, 'div', 1 << SHIFT_PARENT | 2 << SHIFT_REF | InsertBefore,
 *
 *   // Equivalent to:
 *   //   const node = lView[index++] = document.createElement('div');
 *   //   lView[1].appendChild(node);
 *   ELEMENT_MARKER, 'div', 1 << SHIFT_PARENT | AppendChild,
 *
 *   // For adding comment nodes
 *   // ---------------------
 *   // Equivalent to:
 *   //   const node = lView[index++] = document.createComment('');
 *   //   lView[1].insertBefore(node, lView[2]);
 *   COMMENT_MARKER, '', 1 << SHIFT_PARENT | 2 << SHIFT_REF | InsertBefore,
 *
 *   // Equivalent to:
 *   //   const node = lView[index++] = document.createComment('');
 *   //   lView[1].appendChild(node);
 *   COMMENT_MARKER, '', 1 << SHIFT_PARENT | AppendChild,
 *
 *   // For moving existing nodes to a different location
 *   // --------------------------------------------------
 *   // Equivalent to:
 *   //   const node = lView[1];
 *   //   lView[2].insertBefore(node, lView[3]);
 *   1 << SHIFT_REF | Select, 2 << SHIFT_PARENT | 3 << SHIFT_REF | InsertBefore,
 *
 *   // Equivalent to:
 *   //   const node = lView[1];
 *   //   lView[2].appendChild(node);
 *   1 << SHIFT_REF | Select, 2 << SHIFT_PARENT | AppendChild,
 *
 *   // For removing existing nodes
 *   // --------------------------------------------------
 *   //   const node = lView[1];
 *   //   removeChild(tView.data(1), node, lView);
 *   1 << SHIFT_REF | Remove,
 *
 *   // For writing attributes
 *   // --------------------------------------------------
 *   //   const node = lView[1];
 *   //   node.setAttribute('attr', 'value');
 *   1 << SHIFT_REF | Select, 'attr', 'value'
 *            // NOTE: Select followed by two string (vs select followed by OpCode)
 * ];
 * ```
 * NOTE:
 *   - `index` is initial location where the extra nodes should be stored in the EXPANDO section of
 * `LVIewData`.
 *
 * See: `applyI18nCreateOpCodes`;
 * @record
 */
export function I18nMutateOpCodes() { }
/** @enum {number} */
var I18nUpdateOpCode = {
    SHIFT_REF: 2,
    SHIFT_ICU: 17,
    MASK_OPCODE: 3,
    MASK_REF: 68,
    Text: 0,
    Attr: 1,
    IcuSwitch: 2,
    IcuUpdate: 3,
};
export { I18nUpdateOpCode };
/**
 * Stores DOM operations which need to be applied to update DOM render tree due to changes in
 * expressions.
 *
 * The basic idea is that `i18nExp` OpCodes capture expression changes and update a change
 * mask bit. (Bit 1 for expression 1, bit 2 for expression 2 etc..., bit 32 for expression 32 and
 * higher.) The OpCodes then compare its own change mask against the expression change mask to
 * determine if the OpCodes should execute.
 *
 * These OpCodes can be used by both the i18n block as well as ICU sub-block.
 *
 * ## Example
 *
 * Assume
 * ```
 *   if (rf & RenderFlags.Update) {
 *    i18nExp(bind(ctx.exp1)); // If changed set mask bit 1
 *    i18nExp(bind(ctx.exp2)); // If changed set mask bit 2
 *    i18nExp(bind(ctx.exp3)); // If changed set mask bit 3
 *    i18nExp(bind(ctx.exp4)); // If changed set mask bit 4
 *    i18nApply(0);            // Apply all changes by executing the OpCodes.
 *  }
 * ```
 * We can assume that each call to `i18nExp` sets an internal `changeMask` bit depending on the
 * index of `i18nExp`.
 *
 * OpCodes
 * ```
 * <I18nUpdateOpCodes>[
 *   // The following OpCodes represent: `<div i18n-title="pre{{exp1}}in{{exp2}}post">`
 *   // If `changeMask & 0b11`
 *   //        has changed then execute update OpCodes.
 *   //        has NOT changed then skip `7` values and start processing next OpCodes.
 *   0b11, 7,
 *   // Concatenate `newValue = 'pre'+lView[bindIndex-4]+'in'+lView[bindIndex-3]+'post';`.
 *   'pre', -4, 'in', -3, 'post',
 *   // Update attribute: `elementAttribute(1, 'title', sanitizerFn(newValue));`
 *   1 << SHIFT_REF | Attr, 'title', sanitizerFn,
 *
 *   // The following OpCodes represent: `<div i18n>Hello {{exp3}}!">`
 *   // If `changeMask & 0b100`
 *   //        has changed then execute update OpCodes.
 *   //        has NOT changed then skip `4` values and start processing next OpCodes.
 *   0b100, 4,
 *   // Concatenate `newValue = 'Hello ' + lView[bindIndex -2] + '!';`.
 *   'Hello ', -2, '!',
 *   // Update text: `lView[1].textContent = newValue;`
 *   1 << SHIFT_REF | Text,
 *
 *   // The following OpCodes represent: `<div i18n>{exp4, plural, ... }">`
 *   // If `changeMask & 0b1000`
 *   //        has changed then execute update OpCodes.
 *   //        has NOT changed then skip `4` values and start processing next OpCodes.
 *   0b1000, 4,
 *   // Concatenate `newValue = lView[bindIndex -1];`.
 *   -1,
 *   // Switch ICU: `icuSwitchCase(lView[1], 0, newValue);`
 *   0 << SHIFT_ICU | 1 << SHIFT_REF | IcuSwitch,
 *
 *   // Note `changeMask & -1` is always true, so the IcuUpdate will always execute.
 *   -1, 1,
 *   // Update ICU: `icuUpdateCase(lView[1], 0);`
 *   0 << SHIFT_ICU | 1 << SHIFT_REF | IcuUpdate,
 *
 * ];
 * ```
 *
 * @record
 */
export function I18nUpdateOpCodes() { }
/**
 * Store information for the i18n translation block.
 * @record
 */
export function TI18n() { }
/**
 * Number of slots to allocate in expando.
 *
 * This is the max number of DOM elements which will be created by this i18n + ICU blocks. When
 * the DOM elements are being created they are stored in the EXPANDO, so that update OpCodes can
 * write into them.
 * @type {?}
 */
TI18n.prototype.vars;
/**
 * Index in EXPANDO where the i18n stores its DOM nodes.
 *
 * When the bindings are processed by the `i18nEnd` instruction it is necessary to know where the
 * newly created DOM nodes will be inserted.
 * @type {?}
 */
TI18n.prototype.expandoStartIndex;
/**
 * A set of OpCodes which will create the Text Nodes and ICU anchors for the translation blocks.
 *
 * NOTE: The ICU anchors are filled in with ICU Update OpCode.
 * @type {?}
 */
TI18n.prototype.create;
/**
 * A set of OpCodes which will be executed on each change detection to determine if any changes to
 * DOM are required.
 * @type {?}
 */
TI18n.prototype.update;
/**
 * A list of ICUs in a translation block (or `null` if block has no ICUs).
 *
 * Example:
 * Given: `<div i18n>You have {count, plural, ...} and {state, switch, ...}</div>`
 * There would be 2 ICUs in this array.
 *   1. `{count, plural, ...}`
 *   2. `{state, switch, ...}`
 * @type {?}
 */
TI18n.prototype.icus;
/** @enum {number} */
var IcuType = {
    select: 0,
    plural: 1,
};
export { IcuType };
/**
 * @record
 */
export function TIcu() { }
/**
 * Defines the ICU type of `select` or `plural`
 * @type {?}
 */
TIcu.prototype.type;
/**
 * Number of slots to allocate in expando for each case.
 *
 * This is the max number of DOM elements which will be created by this i18n + ICU blocks. When
 * the DOM elements are being created they are stored in the EXPANDO, so that update OpCodes can
 * write into them.
 * @type {?}
 */
TIcu.prototype.vars;
/**
 * An optional array of child/sub ICUs.
 *
 * In case of nested ICUs such as:
 * ```
 * {�0�, plural,
 *   =0 {zero}
 *   other {�0� {�1�, select,
 *                     cat {cats}
 *                     dog {dogs}
 *                     other {animals}
 *                   }!
 *   }
 * }
 * ```
 * When the parent ICU is changing it must clean up child ICUs as well. For this reason it needs
 * to know which child ICUs to run clean up for as well.
 *
 * In the above example this would be:
 * ```
 * [
 *   [],   // `=0` has no sub ICUs
 *   [1],  // `other` has one subICU at `1`st index.
 * ]
 * ```
 *
 * The reason why it is Array of Arrays is because first array represents the case, and second
 * represents the child ICUs to clean up. There may be more than one child ICUs per case.
 * @type {?}
 */
TIcu.prototype.childIcus;
/**
 * Index in EXPANDO where the i18n stores its DOM nodes.
 *
 * When the bindings are processed by the `i18nEnd` instruction it is necessary to know where the
 * newly created DOM nodes will be inserted.
 * @type {?}
 */
TIcu.prototype.expandoStartIndex;
/**
 * A list of case values which the current ICU will try to match.
 *
 * The last value is `other`
 * @type {?}
 */
TIcu.prototype.cases;
/**
 * A set of OpCodes to apply in order to build up the DOM render tree for the ICU
 * @type {?}
 */
TIcu.prototype.create;
/**
 * A set of OpCodes to apply in order to destroy the DOM render tree for the ICU.
 * @type {?}
 */
TIcu.prototype.remove;
/**
 * A set of OpCodes to apply in order to update the DOM render tree for the ICU bindings.
 * @type {?}
 */
TIcu.prototype.update;
/** @type {?} */
export const unusedValueExportToPlacateAjd = 1;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaTE4bi5qcyIsInNvdXJjZVJvb3QiOiIuLi8uLi8iLCJzb3VyY2VzIjpbInBhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaW50ZXJmYWNlcy9pMThuLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7SUFzQkUsWUFBYTtJQUViLGdCQUFpQjtJQUVqQixjQUFtQjtJQUVuQixhQUFzQztJQUd0QyxTQUFjO0lBRWQsY0FBbUI7SUFFbkIsZUFBb0I7SUFFcEIsU0FBYztJQUVkLE9BQVk7SUFFWixhQUFrQjtJQUVsQixrQkFBdUI7Ozs7Ozs7O0FBUXpCLGFBQWEsY0FBYyxHQUFtQjtJQUM1QyxNQUFNLEVBQUUsU0FBUztDQUNsQixDQUFDOzs7Ozs7QUFRRixhQUFhLGNBQWMsR0FBbUI7SUFDNUMsTUFBTSxFQUFFLFNBQVM7Q0FDbEIsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQW1GQSxZQUFhO0lBRWIsYUFBYztJQUVkLGNBQWtCO0lBRWxCLFlBQXNDO0lBR3RDLE9BQVc7SUFFWCxPQUFXO0lBRVgsWUFBZ0I7SUFFaEIsWUFBZ0I7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUEySGhCLFNBQVU7SUFDVixTQUFVOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQWtGWixhQUFhLDZCQUE2QixHQUFHLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuLyoqXG4gKiBgSTE4bk11dGF0ZU9wQ29kZWAgZGVmaW5lcyBPcENvZGVzIGZvciBgSTE4bk11dGF0ZU9wQ29kZXNgIGFycmF5LlxuICpcbiAqIE9wQ29kZXMgY29udGFpbiB0aHJlZSBwYXJ0czpcbiAqICAxKSBQYXJlbnQgbm9kZSBpbmRleCBvZmZzZXQuXG4gKiAgMikgUmVmZXJlbmNlIG5vZGUgaW5kZXggb2Zmc2V0LlxuICogIDMpIFRoZSBPcENvZGUgdG8gZXhlY3V0ZS5cbiAqXG4gKiBTZWU6IGBJMThuQ3JlYXRlT3BDb2Rlc2AgZm9yIGV4YW1wbGUgb2YgdXNhZ2UuXG4gKi9cbmltcG9ydCB7U2FuaXRpemVyRm59IGZyb20gJy4vc2FuaXRpemF0aW9uJztcblxuZXhwb3J0IGNvbnN0IGVudW0gSTE4bk11dGF0ZU9wQ29kZSB7XG4gIC8vLyBTdG9yZXMgc2hpZnQgYW1vdW50IGZvciBiaXRzIDE3LTMgdGhhdCBjb250YWluIHJlZmVyZW5jZSBpbmRleC5cbiAgU0hJRlRfUkVGID0gMyxcbiAgLy8vIFN0b3JlcyBzaGlmdCBhbW91bnQgZm9yIGJpdHMgMzEtMTcgdGhhdCBjb250YWluIHBhcmVudCBpbmRleC5cbiAgU0hJRlRfUEFSRU5UID0gMTcsXG4gIC8vLyBNYXNrIGZvciBPcENvZGVcbiAgTUFTS19PUENPREUgPSAwYjExMSxcbiAgLy8vIE1hc2sgZm9yIHJlZmVyZW5jZSBpbmRleC5cbiAgTUFTS19SRUYgPSAoKDIgXiAxNikgLSAxKSA8PCBTSElGVF9SRUYsXG5cbiAgLy8vIE9wQ29kZSB0byBzZWxlY3QgYSBub2RlLiAobmV4dCBPcENvZGUgd2lsbCBjb250YWluIHRoZSBvcGVyYXRpb24uKVxuICBTZWxlY3QgPSAwYjAwMCxcbiAgLy8vIE9wQ29kZSB0byBhcHBlbmQgdGhlIGN1cnJlbnQgbm9kZSB0byBgUEFSRU5UYC5cbiAgQXBwZW5kQ2hpbGQgPSAwYjAwMSxcbiAgLy8vIE9wQ29kZSB0byBpbnNlcnQgdGhlIGN1cnJlbnQgbm9kZSB0byBgUEFSRU5UYCBiZWZvcmUgYFJFRmAuXG4gIEluc2VydEJlZm9yZSA9IDBiMDEwLFxuICAvLy8gT3BDb2RlIHRvIHJlbW92ZSB0aGUgYFJFRmAgbm9kZSBmcm9tIGBQQVJFTlRgLlxuICBSZW1vdmUgPSAwYjAxMSxcbiAgLy8vIE9wQ29kZSB0byBzZXQgdGhlIGF0dHJpYnV0ZSBvZiBhIG5vZGUuXG4gIEF0dHIgPSAwYjEwMCxcbiAgLy8vIE9wQ29kZSB0byBzaW11bGF0ZSBlbGVtZW50RW5kKClcbiAgRWxlbWVudEVuZCA9IDBiMTAxLFxuICAvLy8gT3BDb2RlIHRvIHJlYWQgdGhlIHJlbW92ZSBPcENvZGVzIGZvciB0aGUgbmVzdGVkIElDVVxuICBSZW1vdmVOZXN0ZWRJY3UgPSAwYjExMCxcbn1cblxuLyoqXG4gKiBNYXJrcyB0aGF0IHRoZSBuZXh0IHN0cmluZyBpcyBmb3IgZWxlbWVudC5cbiAqXG4gKiBTZWUgYEkxOG5NdXRhdGVPcENvZGVzYCBkb2N1bWVudGF0aW9uLlxuICovXG5leHBvcnQgY29uc3QgRUxFTUVOVF9NQVJLRVI6IEVMRU1FTlRfTUFSS0VSID0ge1xuICBtYXJrZXI6ICdlbGVtZW50J1xufTtcbmV4cG9ydCBpbnRlcmZhY2UgRUxFTUVOVF9NQVJLRVIgeyBtYXJrZXI6ICdlbGVtZW50JzsgfVxuXG4vKipcbiAqIE1hcmtzIHRoYXQgdGhlIG5leHQgc3RyaW5nIGlzIGZvciBjb21tZW50LlxuICpcbiAqIFNlZSBgSTE4bk11dGF0ZU9wQ29kZXNgIGRvY3VtZW50YXRpb24uXG4gKi9cbmV4cG9ydCBjb25zdCBDT01NRU5UX01BUktFUjogQ09NTUVOVF9NQVJLRVIgPSB7XG4gIG1hcmtlcjogJ2NvbW1lbnQnXG59O1xuXG5leHBvcnQgaW50ZXJmYWNlIENPTU1FTlRfTUFSS0VSIHsgbWFya2VyOiAnY29tbWVudCc7IH1cblxuLyoqXG4gKiBBcnJheSBzdG9yaW5nIE9wQ29kZSBmb3IgZHluYW1pY2FsbHkgY3JlYXRpbmcgYGkxOG5gIGJsb2Nrcy5cbiAqXG4gKiBFeGFtcGxlOlxuICogYGBgXG4gKiA8STE4bkNyZWF0ZU9wQ29kZT5bXG4gKiAgIC8vIEZvciBhZGRpbmcgdGV4dCBub2Rlc1xuICogICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAqICAgLy8gRXF1aXZhbGVudCB0bzpcbiAqICAgLy8gICBjb25zdCBub2RlID0gbFZpZXdbaW5kZXgrK10gPSBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZSgnYWJjJyk7XG4gKiAgIC8vICAgbFZpZXdbMV0uaW5zZXJ0QmVmb3JlKG5vZGUsIGxWaWV3WzJdKTtcbiAqICAgJ2FiYycsIDEgPDwgU0hJRlRfUEFSRU5UIHwgMiA8PCBTSElGVF9SRUYgfCBJbnNlcnRCZWZvcmUsXG4gKlxuICogICAvLyBFcXVpdmFsZW50IHRvOlxuICogICAvLyAgIGNvbnN0IG5vZGUgPSBsVmlld1tpbmRleCsrXSA9IGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKCd4eXonKTtcbiAqICAgLy8gICBsVmlld1sxXS5hcHBlbmRDaGlsZChub2RlKTtcbiAqICAgJ3h5eicsIDEgPDwgU0hJRlRfUEFSRU5UIHwgQXBwZW5kQ2hpbGQsXG4gKlxuICogICAvLyBGb3IgYWRkaW5nIGVsZW1lbnQgbm9kZXNcbiAqICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gKiAgIC8vIEVxdWl2YWxlbnQgdG86XG4gKiAgIC8vICAgY29uc3Qgbm9kZSA9IGxWaWV3W2luZGV4KytdID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gKiAgIC8vICAgbFZpZXdbMV0uaW5zZXJ0QmVmb3JlKG5vZGUsIGxWaWV3WzJdKTtcbiAqICAgRUxFTUVOVF9NQVJLRVIsICdkaXYnLCAxIDw8IFNISUZUX1BBUkVOVCB8IDIgPDwgU0hJRlRfUkVGIHwgSW5zZXJ0QmVmb3JlLFxuICpcbiAqICAgLy8gRXF1aXZhbGVudCB0bzpcbiAqICAgLy8gICBjb25zdCBub2RlID0gbFZpZXdbaW5kZXgrK10gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAqICAgLy8gICBsVmlld1sxXS5hcHBlbmRDaGlsZChub2RlKTtcbiAqICAgRUxFTUVOVF9NQVJLRVIsICdkaXYnLCAxIDw8IFNISUZUX1BBUkVOVCB8IEFwcGVuZENoaWxkLFxuICpcbiAqICAgLy8gRm9yIGFkZGluZyBjb21tZW50IG5vZGVzXG4gKiAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICogICAvLyBFcXVpdmFsZW50IHRvOlxuICogICAvLyAgIGNvbnN0IG5vZGUgPSBsVmlld1tpbmRleCsrXSA9IGRvY3VtZW50LmNyZWF0ZUNvbW1lbnQoJycpO1xuICogICAvLyAgIGxWaWV3WzFdLmluc2VydEJlZm9yZShub2RlLCBsVmlld1syXSk7XG4gKiAgIENPTU1FTlRfTUFSS0VSLCAnJywgMSA8PCBTSElGVF9QQVJFTlQgfCAyIDw8IFNISUZUX1JFRiB8IEluc2VydEJlZm9yZSxcbiAqXG4gKiAgIC8vIEVxdWl2YWxlbnQgdG86XG4gKiAgIC8vICAgY29uc3Qgbm9kZSA9IGxWaWV3W2luZGV4KytdID0gZG9jdW1lbnQuY3JlYXRlQ29tbWVudCgnJyk7XG4gKiAgIC8vICAgbFZpZXdbMV0uYXBwZW5kQ2hpbGQobm9kZSk7XG4gKiAgIENPTU1FTlRfTUFSS0VSLCAnJywgMSA8PCBTSElGVF9QQVJFTlQgfCBBcHBlbmRDaGlsZCxcbiAqXG4gKiAgIC8vIEZvciBtb3ZpbmcgZXhpc3Rpbmcgbm9kZXMgdG8gYSBkaWZmZXJlbnQgbG9jYXRpb25cbiAqICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAqICAgLy8gRXF1aXZhbGVudCB0bzpcbiAqICAgLy8gICBjb25zdCBub2RlID0gbFZpZXdbMV07XG4gKiAgIC8vICAgbFZpZXdbMl0uaW5zZXJ0QmVmb3JlKG5vZGUsIGxWaWV3WzNdKTtcbiAqICAgMSA8PCBTSElGVF9SRUYgfCBTZWxlY3QsIDIgPDwgU0hJRlRfUEFSRU5UIHwgMyA8PCBTSElGVF9SRUYgfCBJbnNlcnRCZWZvcmUsXG4gKlxuICogICAvLyBFcXVpdmFsZW50IHRvOlxuICogICAvLyAgIGNvbnN0IG5vZGUgPSBsVmlld1sxXTtcbiAqICAgLy8gICBsVmlld1syXS5hcHBlbmRDaGlsZChub2RlKTtcbiAqICAgMSA8PCBTSElGVF9SRUYgfCBTZWxlY3QsIDIgPDwgU0hJRlRfUEFSRU5UIHwgQXBwZW5kQ2hpbGQsXG4gKlxuICogICAvLyBGb3IgcmVtb3ZpbmcgZXhpc3Rpbmcgbm9kZXNcbiAqICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAqICAgLy8gICBjb25zdCBub2RlID0gbFZpZXdbMV07XG4gKiAgIC8vICAgcmVtb3ZlQ2hpbGQodFZpZXcuZGF0YSgxKSwgbm9kZSwgbFZpZXcpO1xuICogICAxIDw8IFNISUZUX1JFRiB8IFJlbW92ZSxcbiAqXG4gKiAgIC8vIEZvciB3cml0aW5nIGF0dHJpYnV0ZXNcbiAqICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAqICAgLy8gICBjb25zdCBub2RlID0gbFZpZXdbMV07XG4gKiAgIC8vICAgbm9kZS5zZXRBdHRyaWJ1dGUoJ2F0dHInLCAndmFsdWUnKTtcbiAqICAgMSA8PCBTSElGVF9SRUYgfCBTZWxlY3QsICdhdHRyJywgJ3ZhbHVlJ1xuICogICAgICAgICAgICAvLyBOT1RFOiBTZWxlY3QgZm9sbG93ZWQgYnkgdHdvIHN0cmluZyAodnMgc2VsZWN0IGZvbGxvd2VkIGJ5IE9wQ29kZSlcbiAqIF07XG4gKiBgYGBcbiAqIE5PVEU6XG4gKiAgIC0gYGluZGV4YCBpcyBpbml0aWFsIGxvY2F0aW9uIHdoZXJlIHRoZSBleHRyYSBub2RlcyBzaG91bGQgYmUgc3RvcmVkIGluIHRoZSBFWFBBTkRPIHNlY3Rpb24gb2ZcbiAqIGBMVklld0RhdGFgLlxuICpcbiAqIFNlZTogYGFwcGx5STE4bkNyZWF0ZU9wQ29kZXNgO1xuICovXG5leHBvcnQgaW50ZXJmYWNlIEkxOG5NdXRhdGVPcENvZGVzIGV4dGVuZHMgQXJyYXk8bnVtYmVyfHN0cmluZ3xFTEVNRU5UX01BUktFUnxDT01NRU5UX01BUktFUnxudWxsPiB7XG59XG5cbmV4cG9ydCBjb25zdCBlbnVtIEkxOG5VcGRhdGVPcENvZGUge1xuICAvLy8gU3RvcmVzIHNoaWZ0IGFtb3VudCBmb3IgYml0cyAxNy0yIHRoYXQgY29udGFpbiByZWZlcmVuY2UgaW5kZXguXG4gIFNISUZUX1JFRiA9IDIsXG4gIC8vLyBTdG9yZXMgc2hpZnQgYW1vdW50IGZvciBiaXRzIDMxLTE3IHRoYXQgY29udGFpbiB3aGljaCBJQ1UgaW4gaTE4biBibG9jayBhcmUgd2UgcmVmZXJyaW5nIHRvLlxuICBTSElGVF9JQ1UgPSAxNyxcbiAgLy8vIE1hc2sgZm9yIE9wQ29kZVxuICBNQVNLX09QQ09ERSA9IDBiMTEsXG4gIC8vLyBNYXNrIGZvciByZWZlcmVuY2UgaW5kZXguXG4gIE1BU0tfUkVGID0gKCgyIF4gMTYpIC0gMSkgPDwgU0hJRlRfUkVGLFxuXG4gIC8vLyBPcENvZGUgdG8gdXBkYXRlIGEgdGV4dCBub2RlLlxuICBUZXh0ID0gMGIwMCxcbiAgLy8vIE9wQ29kZSB0byB1cGRhdGUgYSBhdHRyaWJ1dGUgb2YgYSBub2RlLlxuICBBdHRyID0gMGIwMSxcbiAgLy8vIE9wQ29kZSB0byBzd2l0Y2ggdGhlIGN1cnJlbnQgSUNVIGNhc2UuXG4gIEljdVN3aXRjaCA9IDBiMTAsXG4gIC8vLyBPcENvZGUgdG8gdXBkYXRlIHRoZSBjdXJyZW50IElDVSBjYXNlLlxuICBJY3VVcGRhdGUgPSAwYjExLFxufVxuXG4vKipcbiAqIFN0b3JlcyBET00gb3BlcmF0aW9ucyB3aGljaCBuZWVkIHRvIGJlIGFwcGxpZWQgdG8gdXBkYXRlIERPTSByZW5kZXIgdHJlZSBkdWUgdG8gY2hhbmdlcyBpblxuICogZXhwcmVzc2lvbnMuXG4gKlxuICogVGhlIGJhc2ljIGlkZWEgaXMgdGhhdCBgaTE4bkV4cGAgT3BDb2RlcyBjYXB0dXJlIGV4cHJlc3Npb24gY2hhbmdlcyBhbmQgdXBkYXRlIGEgY2hhbmdlXG4gKiBtYXNrIGJpdC4gKEJpdCAxIGZvciBleHByZXNzaW9uIDEsIGJpdCAyIGZvciBleHByZXNzaW9uIDIgZXRjLi4uLCBiaXQgMzIgZm9yIGV4cHJlc3Npb24gMzIgYW5kXG4gKiBoaWdoZXIuKSBUaGUgT3BDb2RlcyB0aGVuIGNvbXBhcmUgaXRzIG93biBjaGFuZ2UgbWFzayBhZ2FpbnN0IHRoZSBleHByZXNzaW9uIGNoYW5nZSBtYXNrIHRvXG4gKiBkZXRlcm1pbmUgaWYgdGhlIE9wQ29kZXMgc2hvdWxkIGV4ZWN1dGUuXG4gKlxuICogVGhlc2UgT3BDb2RlcyBjYW4gYmUgdXNlZCBieSBib3RoIHRoZSBpMThuIGJsb2NrIGFzIHdlbGwgYXMgSUNVIHN1Yi1ibG9jay5cbiAqXG4gKiAjIyBFeGFtcGxlXG4gKlxuICogQXNzdW1lXG4gKiBgYGBcbiAqICAgaWYgKHJmICYgUmVuZGVyRmxhZ3MuVXBkYXRlKSB7XG4gKiAgICBpMThuRXhwKGJpbmQoY3R4LmV4cDEpKTsgLy8gSWYgY2hhbmdlZCBzZXQgbWFzayBiaXQgMVxuICogICAgaTE4bkV4cChiaW5kKGN0eC5leHAyKSk7IC8vIElmIGNoYW5nZWQgc2V0IG1hc2sgYml0IDJcbiAqICAgIGkxOG5FeHAoYmluZChjdHguZXhwMykpOyAvLyBJZiBjaGFuZ2VkIHNldCBtYXNrIGJpdCAzXG4gKiAgICBpMThuRXhwKGJpbmQoY3R4LmV4cDQpKTsgLy8gSWYgY2hhbmdlZCBzZXQgbWFzayBiaXQgNFxuICogICAgaTE4bkFwcGx5KDApOyAgICAgICAgICAgIC8vIEFwcGx5IGFsbCBjaGFuZ2VzIGJ5IGV4ZWN1dGluZyB0aGUgT3BDb2Rlcy5cbiAqICB9XG4gKiBgYGBcbiAqIFdlIGNhbiBhc3N1bWUgdGhhdCBlYWNoIGNhbGwgdG8gYGkxOG5FeHBgIHNldHMgYW4gaW50ZXJuYWwgYGNoYW5nZU1hc2tgIGJpdCBkZXBlbmRpbmcgb24gdGhlXG4gKiBpbmRleCBvZiBgaTE4bkV4cGAuXG4gKlxuICogT3BDb2Rlc1xuICogYGBgXG4gKiA8STE4blVwZGF0ZU9wQ29kZXM+W1xuICogICAvLyBUaGUgZm9sbG93aW5nIE9wQ29kZXMgcmVwcmVzZW50OiBgPGRpdiBpMThuLXRpdGxlPVwicHJle3tleHAxfX1pbnt7ZXhwMn19cG9zdFwiPmBcbiAqICAgLy8gSWYgYGNoYW5nZU1hc2sgJiAwYjExYFxuICogICAvLyAgICAgICAgaGFzIGNoYW5nZWQgdGhlbiBleGVjdXRlIHVwZGF0ZSBPcENvZGVzLlxuICogICAvLyAgICAgICAgaGFzIE5PVCBjaGFuZ2VkIHRoZW4gc2tpcCBgN2AgdmFsdWVzIGFuZCBzdGFydCBwcm9jZXNzaW5nIG5leHQgT3BDb2Rlcy5cbiAqICAgMGIxMSwgNyxcbiAqICAgLy8gQ29uY2F0ZW5hdGUgYG5ld1ZhbHVlID0gJ3ByZScrbFZpZXdbYmluZEluZGV4LTRdKydpbicrbFZpZXdbYmluZEluZGV4LTNdKydwb3N0JztgLlxuICogICAncHJlJywgLTQsICdpbicsIC0zLCAncG9zdCcsXG4gKiAgIC8vIFVwZGF0ZSBhdHRyaWJ1dGU6IGBlbGVtZW50QXR0cmlidXRlKDEsICd0aXRsZScsIHNhbml0aXplckZuKG5ld1ZhbHVlKSk7YFxuICogICAxIDw8IFNISUZUX1JFRiB8IEF0dHIsICd0aXRsZScsIHNhbml0aXplckZuLFxuICpcbiAqICAgLy8gVGhlIGZvbGxvd2luZyBPcENvZGVzIHJlcHJlc2VudDogYDxkaXYgaTE4bj5IZWxsbyB7e2V4cDN9fSFcIj5gXG4gKiAgIC8vIElmIGBjaGFuZ2VNYXNrICYgMGIxMDBgXG4gKiAgIC8vICAgICAgICBoYXMgY2hhbmdlZCB0aGVuIGV4ZWN1dGUgdXBkYXRlIE9wQ29kZXMuXG4gKiAgIC8vICAgICAgICBoYXMgTk9UIGNoYW5nZWQgdGhlbiBza2lwIGA0YCB2YWx1ZXMgYW5kIHN0YXJ0IHByb2Nlc3NpbmcgbmV4dCBPcENvZGVzLlxuICogICAwYjEwMCwgNCxcbiAqICAgLy8gQ29uY2F0ZW5hdGUgYG5ld1ZhbHVlID0gJ0hlbGxvICcgKyBsVmlld1tiaW5kSW5kZXggLTJdICsgJyEnO2AuXG4gKiAgICdIZWxsbyAnLCAtMiwgJyEnLFxuICogICAvLyBVcGRhdGUgdGV4dDogYGxWaWV3WzFdLnRleHRDb250ZW50ID0gbmV3VmFsdWU7YFxuICogICAxIDw8IFNISUZUX1JFRiB8IFRleHQsXG4gKlxuICogICAvLyBUaGUgZm9sbG93aW5nIE9wQ29kZXMgcmVwcmVzZW50OiBgPGRpdiBpMThuPntleHA0LCBwbHVyYWwsIC4uLiB9XCI+YFxuICogICAvLyBJZiBgY2hhbmdlTWFzayAmIDBiMTAwMGBcbiAqICAgLy8gICAgICAgIGhhcyBjaGFuZ2VkIHRoZW4gZXhlY3V0ZSB1cGRhdGUgT3BDb2Rlcy5cbiAqICAgLy8gICAgICAgIGhhcyBOT1QgY2hhbmdlZCB0aGVuIHNraXAgYDRgIHZhbHVlcyBhbmQgc3RhcnQgcHJvY2Vzc2luZyBuZXh0IE9wQ29kZXMuXG4gKiAgIDBiMTAwMCwgNCxcbiAqICAgLy8gQ29uY2F0ZW5hdGUgYG5ld1ZhbHVlID0gbFZpZXdbYmluZEluZGV4IC0xXTtgLlxuICogICAtMSxcbiAqICAgLy8gU3dpdGNoIElDVTogYGljdVN3aXRjaENhc2UobFZpZXdbMV0sIDAsIG5ld1ZhbHVlKTtgXG4gKiAgIDAgPDwgU0hJRlRfSUNVIHwgMSA8PCBTSElGVF9SRUYgfCBJY3VTd2l0Y2gsXG4gKlxuICogICAvLyBOb3RlIGBjaGFuZ2VNYXNrICYgLTFgIGlzIGFsd2F5cyB0cnVlLCBzbyB0aGUgSWN1VXBkYXRlIHdpbGwgYWx3YXlzIGV4ZWN1dGUuXG4gKiAgIC0xLCAxLFxuICogICAvLyBVcGRhdGUgSUNVOiBgaWN1VXBkYXRlQ2FzZShsVmlld1sxXSwgMCk7YFxuICogICAwIDw8IFNISUZUX0lDVSB8IDEgPDwgU0hJRlRfUkVGIHwgSWN1VXBkYXRlLFxuICpcbiAqIF07XG4gKiBgYGBcbiAqXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgSTE4blVwZGF0ZU9wQ29kZXMgZXh0ZW5kcyBBcnJheTxzdHJpbmd8bnVtYmVyfFNhbml0aXplckZufG51bGw+IHt9XG5cbi8qKlxuICogU3RvcmUgaW5mb3JtYXRpb24gZm9yIHRoZSBpMThuIHRyYW5zbGF0aW9uIGJsb2NrLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIFRJMThuIHtcbiAgLyoqXG4gICAqIE51bWJlciBvZiBzbG90cyB0byBhbGxvY2F0ZSBpbiBleHBhbmRvLlxuICAgKlxuICAgKiBUaGlzIGlzIHRoZSBtYXggbnVtYmVyIG9mIERPTSBlbGVtZW50cyB3aGljaCB3aWxsIGJlIGNyZWF0ZWQgYnkgdGhpcyBpMThuICsgSUNVIGJsb2Nrcy4gV2hlblxuICAgKiB0aGUgRE9NIGVsZW1lbnRzIGFyZSBiZWluZyBjcmVhdGVkIHRoZXkgYXJlIHN0b3JlZCBpbiB0aGUgRVhQQU5ETywgc28gdGhhdCB1cGRhdGUgT3BDb2RlcyBjYW5cbiAgICogd3JpdGUgaW50byB0aGVtLlxuICAgKi9cbiAgdmFyczogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBJbmRleCBpbiBFWFBBTkRPIHdoZXJlIHRoZSBpMThuIHN0b3JlcyBpdHMgRE9NIG5vZGVzLlxuICAgKlxuICAgKiBXaGVuIHRoZSBiaW5kaW5ncyBhcmUgcHJvY2Vzc2VkIGJ5IHRoZSBgaTE4bkVuZGAgaW5zdHJ1Y3Rpb24gaXQgaXMgbmVjZXNzYXJ5IHRvIGtub3cgd2hlcmUgdGhlXG4gICAqIG5ld2x5IGNyZWF0ZWQgRE9NIG5vZGVzIHdpbGwgYmUgaW5zZXJ0ZWQuXG4gICAqL1xuICBleHBhbmRvU3RhcnRJbmRleDogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBBIHNldCBvZiBPcENvZGVzIHdoaWNoIHdpbGwgY3JlYXRlIHRoZSBUZXh0IE5vZGVzIGFuZCBJQ1UgYW5jaG9ycyBmb3IgdGhlIHRyYW5zbGF0aW9uIGJsb2Nrcy5cbiAgICpcbiAgICogTk9URTogVGhlIElDVSBhbmNob3JzIGFyZSBmaWxsZWQgaW4gd2l0aCBJQ1UgVXBkYXRlIE9wQ29kZS5cbiAgICovXG4gIGNyZWF0ZTogSTE4bk11dGF0ZU9wQ29kZXM7XG5cbiAgLyoqXG4gICAqIEEgc2V0IG9mIE9wQ29kZXMgd2hpY2ggd2lsbCBiZSBleGVjdXRlZCBvbiBlYWNoIGNoYW5nZSBkZXRlY3Rpb24gdG8gZGV0ZXJtaW5lIGlmIGFueSBjaGFuZ2VzIHRvXG4gICAqIERPTSBhcmUgcmVxdWlyZWQuXG4gICAqL1xuICB1cGRhdGU6IEkxOG5VcGRhdGVPcENvZGVzO1xuXG4gIC8qKlxuICAgKiBBIGxpc3Qgb2YgSUNVcyBpbiBhIHRyYW5zbGF0aW9uIGJsb2NrIChvciBgbnVsbGAgaWYgYmxvY2sgaGFzIG5vIElDVXMpLlxuICAgKlxuICAgKiBFeGFtcGxlOlxuICAgKiBHaXZlbjogYDxkaXYgaTE4bj5Zb3UgaGF2ZSB7Y291bnQsIHBsdXJhbCwgLi4ufSBhbmQge3N0YXRlLCBzd2l0Y2gsIC4uLn08L2Rpdj5gXG4gICAqIFRoZXJlIHdvdWxkIGJlIDIgSUNVcyBpbiB0aGlzIGFycmF5LlxuICAgKiAgIDEuIGB7Y291bnQsIHBsdXJhbCwgLi4ufWBcbiAgICogICAyLiBge3N0YXRlLCBzd2l0Y2gsIC4uLn1gXG4gICAqL1xuICBpY3VzOiBUSWN1W118bnVsbDtcbn1cblxuLyoqXG4gKiBEZWZpbmVzIHRoZSBJQ1UgdHlwZSBvZiBgc2VsZWN0YCBvciBgcGx1cmFsYFxuICovXG5leHBvcnQgY29uc3QgZW51bSBJY3VUeXBlIHtcbiAgc2VsZWN0ID0gMCxcbiAgcGx1cmFsID0gMSxcbn1cblxuZXhwb3J0IGludGVyZmFjZSBUSWN1IHtcbiAgLyoqXG4gICAqIERlZmluZXMgdGhlIElDVSB0eXBlIG9mIGBzZWxlY3RgIG9yIGBwbHVyYWxgXG4gICAqL1xuICB0eXBlOiBJY3VUeXBlO1xuXG4gIC8qKlxuICAgKiBOdW1iZXIgb2Ygc2xvdHMgdG8gYWxsb2NhdGUgaW4gZXhwYW5kbyBmb3IgZWFjaCBjYXNlLlxuICAgKlxuICAgKiBUaGlzIGlzIHRoZSBtYXggbnVtYmVyIG9mIERPTSBlbGVtZW50cyB3aGljaCB3aWxsIGJlIGNyZWF0ZWQgYnkgdGhpcyBpMThuICsgSUNVIGJsb2Nrcy4gV2hlblxuICAgKiB0aGUgRE9NIGVsZW1lbnRzIGFyZSBiZWluZyBjcmVhdGVkIHRoZXkgYXJlIHN0b3JlZCBpbiB0aGUgRVhQQU5ETywgc28gdGhhdCB1cGRhdGUgT3BDb2RlcyBjYW5cbiAgICogd3JpdGUgaW50byB0aGVtLlxuICAgKi9cbiAgdmFyczogbnVtYmVyW107XG5cbiAgLyoqXG4gICAqIEFuIG9wdGlvbmFsIGFycmF5IG9mIGNoaWxkL3N1YiBJQ1VzLlxuICAgKlxuICAgKiBJbiBjYXNlIG9mIG5lc3RlZCBJQ1VzIHN1Y2ggYXM6XG4gICAqIGBgYFxuICAgKiB777+9MO+/vSwgcGx1cmFsLFxuICAgKiAgID0wIHt6ZXJvfVxuICAgKiAgIG90aGVyIHvvv70w77+9IHvvv70x77+9LCBzZWxlY3QsXG4gICAqICAgICAgICAgICAgICAgICAgICAgY2F0IHtjYXRzfVxuICAgKiAgICAgICAgICAgICAgICAgICAgIGRvZyB7ZG9nc31cbiAgICogICAgICAgICAgICAgICAgICAgICBvdGhlciB7YW5pbWFsc31cbiAgICogICAgICAgICAgICAgICAgICAgfSFcbiAgICogICB9XG4gICAqIH1cbiAgICogYGBgXG4gICAqIFdoZW4gdGhlIHBhcmVudCBJQ1UgaXMgY2hhbmdpbmcgaXQgbXVzdCBjbGVhbiB1cCBjaGlsZCBJQ1VzIGFzIHdlbGwuIEZvciB0aGlzIHJlYXNvbiBpdCBuZWVkc1xuICAgKiB0byBrbm93IHdoaWNoIGNoaWxkIElDVXMgdG8gcnVuIGNsZWFuIHVwIGZvciBhcyB3ZWxsLlxuICAgKlxuICAgKiBJbiB0aGUgYWJvdmUgZXhhbXBsZSB0aGlzIHdvdWxkIGJlOlxuICAgKiBgYGBcbiAgICogW1xuICAgKiAgIFtdLCAgIC8vIGA9MGAgaGFzIG5vIHN1YiBJQ1VzXG4gICAqICAgWzFdLCAgLy8gYG90aGVyYCBoYXMgb25lIHN1YklDVSBhdCBgMWBzdCBpbmRleC5cbiAgICogXVxuICAgKiBgYGBcbiAgICpcbiAgICogVGhlIHJlYXNvbiB3aHkgaXQgaXMgQXJyYXkgb2YgQXJyYXlzIGlzIGJlY2F1c2UgZmlyc3QgYXJyYXkgcmVwcmVzZW50cyB0aGUgY2FzZSwgYW5kIHNlY29uZFxuICAgKiByZXByZXNlbnRzIHRoZSBjaGlsZCBJQ1VzIHRvIGNsZWFuIHVwLiBUaGVyZSBtYXkgYmUgbW9yZSB0aGFuIG9uZSBjaGlsZCBJQ1VzIHBlciBjYXNlLlxuICAgKi9cbiAgY2hpbGRJY3VzOiBudW1iZXJbXVtdO1xuXG4gIC8qKlxuICAgKiBJbmRleCBpbiBFWFBBTkRPIHdoZXJlIHRoZSBpMThuIHN0b3JlcyBpdHMgRE9NIG5vZGVzLlxuICAgKlxuICAgKiBXaGVuIHRoZSBiaW5kaW5ncyBhcmUgcHJvY2Vzc2VkIGJ5IHRoZSBgaTE4bkVuZGAgaW5zdHJ1Y3Rpb24gaXQgaXMgbmVjZXNzYXJ5IHRvIGtub3cgd2hlcmUgdGhlXG4gICAqIG5ld2x5IGNyZWF0ZWQgRE9NIG5vZGVzIHdpbGwgYmUgaW5zZXJ0ZWQuXG4gICAqL1xuICBleHBhbmRvU3RhcnRJbmRleDogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBBIGxpc3Qgb2YgY2FzZSB2YWx1ZXMgd2hpY2ggdGhlIGN1cnJlbnQgSUNVIHdpbGwgdHJ5IHRvIG1hdGNoLlxuICAgKlxuICAgKiBUaGUgbGFzdCB2YWx1ZSBpcyBgb3RoZXJgXG4gICAqL1xuICBjYXNlczogYW55W107XG5cbiAgLyoqXG4gICAqIEEgc2V0IG9mIE9wQ29kZXMgdG8gYXBwbHkgaW4gb3JkZXIgdG8gYnVpbGQgdXAgdGhlIERPTSByZW5kZXIgdHJlZSBmb3IgdGhlIElDVVxuICAgKi9cbiAgY3JlYXRlOiBJMThuTXV0YXRlT3BDb2Rlc1tdO1xuXG4gIC8qKlxuICAgKiBBIHNldCBvZiBPcENvZGVzIHRvIGFwcGx5IGluIG9yZGVyIHRvIGRlc3Ryb3kgdGhlIERPTSByZW5kZXIgdHJlZSBmb3IgdGhlIElDVS5cbiAgICovXG4gIHJlbW92ZTogSTE4bk11dGF0ZU9wQ29kZXNbXTtcblxuICAvKipcbiAgICogQSBzZXQgb2YgT3BDb2RlcyB0byBhcHBseSBpbiBvcmRlciB0byB1cGRhdGUgdGhlIERPTSByZW5kZXIgdHJlZSBmb3IgdGhlIElDVSBiaW5kaW5ncy5cbiAgICovXG4gIHVwZGF0ZTogSTE4blVwZGF0ZU9wQ29kZXNbXTtcbn1cblxuLy8gTm90ZTogVGhpcyBoYWNrIGlzIG5lY2Vzc2FyeSBzbyB3ZSBkb24ndCBlcnJvbmVvdXNseSBnZXQgYSBjaXJjdWxhciBkZXBlbmRlbmN5XG4vLyBmYWlsdXJlIGJhc2VkIG9uIHR5cGVzLlxuZXhwb3J0IGNvbnN0IHVudXNlZFZhbHVlRXhwb3J0VG9QbGFjYXRlQWpkID0gMTtcbiJdfQ==