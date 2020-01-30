/**
 * @fileoverview added by tsickle
 * Generated from: packages/core/src/render3/interfaces/styling.ts
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
* @license
* Copyright Google Inc. All Rights Reserved.
*
* Use of this source code is governed by an MIT-style license that can be
* found in the LICENSE file at https://angular.io/license
*/
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
/**
 * @param {?} tStylingRange
 * @return {?}
 */
export function getTStylingRangeTail(tStylingRange) {
    /** @type {?} */
    const next = getTStylingRangeNext(tStylingRange);
    return next === 0 ? getTStylingRangePrev(tStylingRange) : next;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3R5bGluZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaW50ZXJmYWNlcy9zdHlsaW5nLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBK0NBLG1DQUE4RDs7O0lBQTdCLGtDQUEyQjs7O0FBSzVELE1BQWtCLFlBQVk7SUFDNUIsb0RBQW9EO0lBQ3BELFVBQVUsSUFBSztJQUNmLDBCQUEwQjtJQUMxQixTQUFTLFlBQWE7SUFFdEIsZ0RBQWdEO0lBQ2hELFVBQVUsR0FBSTtJQUNkLHNCQUFzQjtJQUN0QixTQUFTLE9BQVk7SUFFckI7Ozs7O09BS0c7SUFDSCxjQUFjLEdBQU87SUFFckI7Ozs7O09BS0c7SUFDSCxjQUFjLEdBQU87RUFDdEI7Ozs7Ozs7QUFHRCxNQUFNLFVBQVUsZUFBZSxDQUFDLElBQVksRUFBRSxJQUFZO0lBQ3hELE9BQU8sbUJBQUEsQ0FBQyxJQUFJLHVCQUEyQixHQUFHLElBQUksc0JBQTJCLENBQUMsRUFBTyxDQUFDO0FBQ3BGLENBQUM7Ozs7O0FBRUQsTUFBTSxVQUFVLG9CQUFvQixDQUFDLGFBQTRCO0lBQy9ELE9BQU8sQ0FBQyxtQkFBQSxtQkFBQSxhQUFhLEVBQU8sRUFBVSxDQUFDLHVCQUEyQixDQUFDO0FBQ3JFLENBQUM7Ozs7O0FBRUQsTUFBTSxVQUFVLDZCQUE2QixDQUFDLGFBQTRCO0lBQ3hFLE9BQU8sQ0FBQyxDQUFDLG1CQUFBLG1CQUFBLGFBQWEsRUFBTyxFQUFVLENBQUMseUJBQThCLENBQUM7OEJBQ3hDLENBQUM7QUFDbEMsQ0FBQzs7Ozs7O0FBRUQsTUFBTSxVQUFVLG9CQUFvQixDQUNoQyxhQUE0QixFQUFFLFFBQWdCO0lBQ2hELE9BQU8sbUJBQUEsQ0FDSCxDQUFDLENBQUMsbUJBQUEsbUJBQUEsYUFBYSxFQUFPLEVBQVUsQ0FBQyxHQUFHLDJCQUF1QixDQUFDO1FBQzVELENBQUMsUUFBUSx1QkFBMkIsQ0FBQyxDQUFDLEVBQU8sQ0FBQztBQUNwRCxDQUFDOzs7OztBQUVELE1BQU0sVUFBVSw2QkFBNkIsQ0FBQyxhQUE0QjtJQUN4RSxPQUFPLG1CQUFBLENBQUMsQ0FBQyxtQkFBQSxtQkFBQSxhQUFhLEVBQU8sRUFBVSxDQUFDLHlCQUE4QixDQUFDLEVBQU8sQ0FBQztBQUNqRixDQUFDOzs7OztBQUVELE1BQU0sVUFBVSxvQkFBb0IsQ0FBQyxhQUE0QjtJQUMvRCxPQUFPLENBQUMsQ0FBQyxtQkFBQSxtQkFBQSxhQUFhLEVBQU8sRUFBVSxDQUFDLHdCQUF5QixDQUFDLHNCQUEyQixDQUFDO0FBQ2hHLENBQUM7Ozs7OztBQUVELE1BQU0sVUFBVSxvQkFBb0IsQ0FBQyxhQUE0QixFQUFFLElBQVk7SUFDN0UsT0FBTyxtQkFBQSxDQUNILENBQUMsQ0FBQyxtQkFBQSxtQkFBQSxhQUFhLEVBQU8sRUFBVSxDQUFDLEdBQUcsc0JBQXVCLENBQUMsR0FBSSxFQUFFO1FBQ2xFLElBQUksc0JBQTJCLENBQUMsRUFBTyxDQUFDO0FBQzlDLENBQUM7Ozs7O0FBRUQsTUFBTSxVQUFVLDZCQUE2QixDQUFDLGFBQTRCO0lBQ3hFLE9BQU8sQ0FBQyxDQUFDLG1CQUFBLG1CQUFBLGFBQWEsRUFBTyxFQUFVLENBQUMseUJBQThCLENBQUM7OEJBQ3hDLENBQUM7QUFDbEMsQ0FBQzs7Ozs7QUFFRCxNQUFNLFVBQVUsNkJBQTZCLENBQUMsYUFBNEI7SUFDeEUsT0FBTyxtQkFBQSxDQUFDLENBQUMsbUJBQUEsbUJBQUEsYUFBYSxFQUFPLEVBQVUsQ0FBQyx5QkFBOEIsQ0FBQyxFQUFPLENBQUM7QUFDakYsQ0FBQzs7Ozs7QUFFRCxNQUFNLFVBQVUsb0JBQW9CLENBQUMsYUFBNEI7O1VBQ3pELElBQUksR0FBRyxvQkFBb0IsQ0FBQyxhQUFhLENBQUM7SUFDaEQsT0FBTyxJQUFJLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxvQkFBb0IsQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO0FBQ2pFLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiogQGxpY2Vuc2VcbiogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4qXG4qIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4qIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiovXG5cbi8qKlxuICogVmFsdWUgc3RvcmVkIGluIHRoZSBgVERhdGFgIHdoaWNoIGlzIG5lZWRlZCB0byByZS1jb25jYXRlbmF0ZSB0aGUgc3R5bGluZy5cbiAqXG4gKiAtIGBzdHJpbmdgOiBTdG9yZXMgdGhlIHByb3BlcnR5IG5hbWUuIFVzZWQgd2l0aCBgybXJtXN0eWxlUHJvcGAvYMm1ybVjbGFzc1Byb3BgIGluc3RydWN0aW9uLlxuICogLSBgbnVsbGA6IFJlcHJlc2VudHMgbWFwLCBzbyB0aGVyZSBpcyBubyBuYW1lLiBVc2VkIHdpdGggYMm1ybVzdHlsZU1hcGAvYMm1ybVjbGFzc01hcGAuXG4gKiAtIGBmYWxzZWA6IFJlcHJlc2VudHMgYW4gaWdub3JlIGNhc2UuIFRoaXMgaGFwcGVucyB3aGVuIGDJtcm1c3R5bGVQcm9wYC9gybXJtWNsYXNzUHJvcGAgaW5zdHJ1Y3Rpb25cbiAqICAgaXMgY29tYmluZWQgd2l0aCBkaXJlY3RpdmUgd2hpY2ggc2hhZG93cyBpdHMgaW5wdXQgYEBJbnB1dCgnY2xhc3MnKWAuIFRoYXQgd2F5IHRoZSBiaW5kaW5nXG4gKiAgIHNob3VsZCBub3QgcGFydGljaXBhdGUgaW4gdGhlIHN0eWxpbmcgcmVzb2x1dGlvbi5cbiAqL1xuZXhwb3J0IHR5cGUgVFN0eWxpbmdLZXkgPSBzdHJpbmcgfCBudWxsIHwgZmFsc2U7XG5cbi8qKlxuICogVGhpcyBpcyBhIGJyYW5kZWQgbnVtYmVyIHdoaWNoIGNvbnRhaW5zIHByZXZpb3VzIGFuZCBuZXh0IGluZGV4LlxuICpcbiAqIFdoZW4gd2UgY29tZSBhY3Jvc3Mgc3R5bGluZyBpbnN0cnVjdGlvbnMgd2UgbmVlZCB0byBzdG9yZSB0aGUgYFRTdHlsaW5nS2V5YCBpbiB0aGUgY29ycmVjdFxuICogb3JkZXIgc28gdGhhdCB3ZSBjYW4gcmUtY29uY2F0ZW5hdGUgdGhlIHN0eWxpbmcgdmFsdWUgaW4gdGhlIGRlc2lyZWQgcHJpb3JpdHkuXG4gKlxuICogVGhlIGluc2VydGlvbiBjYW4gaGFwcGVuIGVpdGhlciBhdCB0aGU6XG4gKiAtIGVuZCBvZiB0ZW1wbGF0ZSBhcyBpbiB0aGUgY2FzZSBvZiBjb21pbmcgYWNyb3NzIGFkZGl0aW9uYWwgc3R5bGluZyBpbnN0cnVjdGlvbiBpbiB0aGUgdGVtcGxhdGVcbiAqIC0gaW4gZnJvbnQgb2YgdGhlIHRlbXBsYXRlIGluIHRoZSBjYXNlIG9mIGNvbWluZyBhY3Jvc3MgYWRkaXRpb25hbCBpbnN0cnVjdGlvbiBpbiB0aGVcbiAqICAgYGhvc3RCaW5kaW5nc2AuXG4gKlxuICogV2UgdXNlIGBUU3R5bGluZ1JhbmdlYCB0byBzdG9yZSB0aGUgcHJldmlvdXMgYW5kIG5leHQgaW5kZXggaW50byB0aGUgYFREYXRhYCB3aGVyZSB0aGUgdGVtcGxhdGVcbiAqIGJpbmRpbmdzIGNhbiBiZSBmb3VuZC5cbiAqXG4gKiAtIGJpdCAwIGlzIHVzZWQgdG8gbWFyayB0aGF0IHRoZSBwcmV2aW91cyBpbmRleCBoYXMgYSBkdXBsaWNhdGUgZm9yIGN1cnJlbnQgdmFsdWUuXG4gKiAtIGJpdCAxIGlzIHVzZWQgdG8gbWFyayB0aGF0IHRoZSBuZXh0IGluZGV4IGhhcyBhIGR1cGxpY2F0ZSBmb3IgdGhlIGN1cnJlbnQgdmFsdWUuXG4gKiAtIGJpdHMgMi0xNiBhcmUgdXNlZCB0byBlbmNvZGUgdGhlIG5leHQvdGFpbCBvZiB0aGUgdGVtcGxhdGUuXG4gKiAtIGJpdHMgMTctMzIgYXJlIHVzZWQgdG8gZW5jb2RlIHRoZSBwcmV2aW91cy9oZWFkIG9mIHRlbXBsYXRlLlxuICpcbiAqIE5PREU6ICpkdXBsaWNhdGUqIGZhbHNlIGltcGxpZXMgdGhhdCBpdCBpcyBzdGF0aWNhbGx5IGtub3duIHRoYXQgdGhpcyBiaW5kaW5nIHdpbGwgbm90IGNvbGxpZGVcbiAqIHdpdGggb3RoZXIgYmluZGluZ3MgYW5kIHRoZXJlZm9yZSB0aGVyZSBpcyBubyBuZWVkIHRvIGNoZWNrIG90aGVyIGJpbmRpbmdzLiBGb3IgZXhhbXBsZSB0aGVcbiAqIGJpbmRpbmdzIGluIGA8ZGl2IFtzdHlsZS5jb2xvcl09XCJleHBcIiBbc3R5bGUud2lkdGhdPVwiZXhwXCI+YCB3aWxsIG5ldmVyIGNvbGxpZGUgYW5kIHdpbGwgaGF2ZVxuICogdGhlaXIgYml0cyBzZXQgYWNjb3JkaW5nbHkuIFByZXZpb3VzIGR1cGxpY2F0ZSBtZWFucyB0aGF0IHdlIG1heSBuZWVkIHRvIGNoZWNrIHByZXZpb3VzIGlmIHRoZVxuICogY3VycmVudCBiaW5kaW5nIGlzIGBudWxsYC4gTmV4dCBkdXBsaWNhdGUgbWVhbnMgdGhhdCB3ZSBtYXkgbmVlZCB0byBjaGVjayBuZXh0IGJpbmRpbmdzIGlmIHRoZVxuICogY3VycmVudCBiaW5kaW5nIGlzIG5vdCBgbnVsbGAuXG4gKlxuICogTk9URTogYDBgIGhhcyBzcGVjaWFsIHNpZ25pZmljYW5jZSBhbmQgcmVwcmVzZW50cyBgbnVsbGAgYXMgaW4gbm8gYWRkaXRpb25hbCBwb2ludGVyLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIFRTdHlsaW5nUmFuZ2UgeyBfX2JyYW5kX186ICdUU3R5bGluZ1JhbmdlJzsgfVxuXG4vKipcbiAqIFNoaWZ0IGFuZCBtYXNrcyBjb25zdGFudHMgZm9yIGVuY29kaW5nIHR3byBudW1iZXJzIGludG8gYW5kIGR1cGxpY2F0ZSBpbmZvIGludG8gYSBzaW5nbGUgbnVtYmVyLlxuICovXG5leHBvcnQgY29uc3QgZW51bSBTdHlsaW5nUmFuZ2Uge1xuICAvLy8gTnVtYmVyIG9mIGJpdHMgdG8gc2hpZnQgZm9yIHRoZSBwcmV2aW91cyBwb2ludGVyXG4gIFBSRVZfU0hJRlQgPSAxOCxcbiAgLy8vIFByZXZpb3VzIHBvaW50ZXIgbWFzay5cbiAgUFJFVl9NQVNLID0gMHhGRkZDMDAwMCxcblxuICAvLy8gTnVtYmVyIG9mIGJpdHMgdG8gc2hpZnQgZm9yIHRoZSBuZXh0IHBvaW50ZXJcbiAgTkVYVF9TSElGVCA9IDIsXG4gIC8vLyBOZXh0IHBvaW50ZXIgbWFzay5cbiAgTkVYVF9NQVNLID0gMHgwMDAzRkZDLFxuXG4gIC8qKlxuICAgKiBUaGlzIGJpdCBpcyBzZXQgaWYgdGhlIHByZXZpb3VzIGJpbmRpbmdzIGNvbnRhaW5zIGEgYmluZGluZyB3aGljaCBjb3VsZCBwb3NzaWJseSBjYXVzZSBhXG4gICAqIGR1cGxpY2F0ZS4gRm9yIGV4YW1wbGU6IGA8ZGl2IFtzdHlsZV09XCJtYXBcIiBbc3R5bGUud2lkdGhdPVwid2lkdGhcIj5gLCB0aGUgYHdpZHRoYCBiaW5kaW5nIHdpbGxcbiAgICogaGF2ZSBwcmV2aW91cyBkdXBsaWNhdGUgc2V0LiBUaGUgaW1wbGljYXRpb24gaXMgdGhhdCBpZiBgd2lkdGhgIGJpbmRpbmcgYmVjb21lcyBgbnVsbGAsIGl0IGlzXG4gICAqIG5lY2Vzc2FyeSB0byBkZWZlciB0aGUgdmFsdWUgdG8gYG1hcC53aWR0aGAuIChCZWNhdXNlIGB3aWR0aGAgb3ZlcndyaXRlcyBgbWFwLndpZHRoYC4pXG4gICAqL1xuICBQUkVWX0RVUExJQ0FURSA9IDB4MDIsXG5cbiAgLyoqXG4gICAqIFRoaXMgYml0IGlzIHNldCB0byBpZiB0aGUgbmV4dCBiaW5kaW5nIGNvbnRhaW5zIGEgYmluZGluZyB3aGljaCBjb3VsZCBwb3NzaWJseSBjYXVzZSBhXG4gICAqIGR1cGxpY2F0ZS4gRm9yIGV4YW1wbGU6IGA8ZGl2IFtzdHlsZV09XCJtYXBcIiBbc3R5bGUud2lkdGhdPVwid2lkdGhcIj5gLCB0aGUgYG1hcGAgYmluZGluZyB3aWxsXG4gICAqIGhhdmUgbmV4dCBkdXBsaWNhdGUgc2V0LiBUaGUgaW1wbGljYXRpb24gaXMgdGhhdCBpZiBgbWFwLndpZHRoYCBiaW5kaW5nIGJlY29tZXMgbm90IGBudWxsYCwgaXRcbiAgICogaXMgbmVjZXNzYXJ5IHRvIGRlZmVyIHRoZSB2YWx1ZSB0byBgd2lkdGhgLiAoQmVjYXVzZSBgd2lkdGhgIG92ZXJ3cml0ZXMgYG1hcC53aWR0aGAuKVxuICAgKi9cbiAgTkVYVF9EVVBMSUNBVEUgPSAweDAxLFxufVxuXG5cbmV4cG9ydCBmdW5jdGlvbiB0b1RTdHlsaW5nUmFuZ2UocHJldjogbnVtYmVyLCBuZXh0OiBudW1iZXIpOiBUU3R5bGluZ1JhbmdlIHtcbiAgcmV0dXJuIChwcmV2IDw8IFN0eWxpbmdSYW5nZS5QUkVWX1NISUZUIHwgbmV4dCA8PCBTdHlsaW5nUmFuZ2UuTkVYVF9TSElGVCkgYXMgYW55O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0VFN0eWxpbmdSYW5nZVByZXYodFN0eWxpbmdSYW5nZTogVFN0eWxpbmdSYW5nZSk6IG51bWJlciB7XG4gIHJldHVybiAodFN0eWxpbmdSYW5nZSBhcyBhbnkgYXMgbnVtYmVyKSA+PiBTdHlsaW5nUmFuZ2UuUFJFVl9TSElGVDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFRTdHlsaW5nUmFuZ2VQcmV2RHVwbGljYXRlKHRTdHlsaW5nUmFuZ2U6IFRTdHlsaW5nUmFuZ2UpOiBib29sZWFuIHtcbiAgcmV0dXJuICgodFN0eWxpbmdSYW5nZSBhcyBhbnkgYXMgbnVtYmVyKSAmIFN0eWxpbmdSYW5nZS5QUkVWX0RVUExJQ0FURSkgPT1cbiAgICAgIFN0eWxpbmdSYW5nZS5QUkVWX0RVUExJQ0FURTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNldFRTdHlsaW5nUmFuZ2VQcmV2KFxuICAgIHRTdHlsaW5nUmFuZ2U6IFRTdHlsaW5nUmFuZ2UsIHByZXZpb3VzOiBudW1iZXIpOiBUU3R5bGluZ1JhbmdlIHtcbiAgcmV0dXJuIChcbiAgICAgICgodFN0eWxpbmdSYW5nZSBhcyBhbnkgYXMgbnVtYmVyKSAmIH5TdHlsaW5nUmFuZ2UuUFJFVl9NQVNLKSB8XG4gICAgICAocHJldmlvdXMgPDwgU3R5bGluZ1JhbmdlLlBSRVZfU0hJRlQpKSBhcyBhbnk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRUU3R5bGluZ1JhbmdlUHJldkR1cGxpY2F0ZSh0U3R5bGluZ1JhbmdlOiBUU3R5bGluZ1JhbmdlKTogVFN0eWxpbmdSYW5nZSB7XG4gIHJldHVybiAoKHRTdHlsaW5nUmFuZ2UgYXMgYW55IGFzIG51bWJlcikgfCBTdHlsaW5nUmFuZ2UuUFJFVl9EVVBMSUNBVEUpIGFzIGFueTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFRTdHlsaW5nUmFuZ2VOZXh0KHRTdHlsaW5nUmFuZ2U6IFRTdHlsaW5nUmFuZ2UpOiBudW1iZXIge1xuICByZXR1cm4gKCh0U3R5bGluZ1JhbmdlIGFzIGFueSBhcyBudW1iZXIpICYgU3R5bGluZ1JhbmdlLk5FWFRfTUFTSykgPj4gU3R5bGluZ1JhbmdlLk5FWFRfU0hJRlQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRUU3R5bGluZ1JhbmdlTmV4dCh0U3R5bGluZ1JhbmdlOiBUU3R5bGluZ1JhbmdlLCBuZXh0OiBudW1iZXIpOiBUU3R5bGluZ1JhbmdlIHtcbiAgcmV0dXJuIChcbiAgICAgICgodFN0eWxpbmdSYW5nZSBhcyBhbnkgYXMgbnVtYmVyKSAmIH5TdHlsaW5nUmFuZ2UuTkVYVF9NQVNLKSB8ICAvL1xuICAgICAgbmV4dCA8PCBTdHlsaW5nUmFuZ2UuTkVYVF9TSElGVCkgYXMgYW55O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0VFN0eWxpbmdSYW5nZU5leHREdXBsaWNhdGUodFN0eWxpbmdSYW5nZTogVFN0eWxpbmdSYW5nZSk6IGJvb2xlYW4ge1xuICByZXR1cm4gKCh0U3R5bGluZ1JhbmdlIGFzIGFueSBhcyBudW1iZXIpICYgU3R5bGluZ1JhbmdlLk5FWFRfRFVQTElDQVRFKSA9PT1cbiAgICAgIFN0eWxpbmdSYW5nZS5ORVhUX0RVUExJQ0FURTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNldFRTdHlsaW5nUmFuZ2VOZXh0RHVwbGljYXRlKHRTdHlsaW5nUmFuZ2U6IFRTdHlsaW5nUmFuZ2UpOiBUU3R5bGluZ1JhbmdlIHtcbiAgcmV0dXJuICgodFN0eWxpbmdSYW5nZSBhcyBhbnkgYXMgbnVtYmVyKSB8IFN0eWxpbmdSYW5nZS5ORVhUX0RVUExJQ0FURSkgYXMgYW55O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0VFN0eWxpbmdSYW5nZVRhaWwodFN0eWxpbmdSYW5nZTogVFN0eWxpbmdSYW5nZSk6IG51bWJlciB7XG4gIGNvbnN0IG5leHQgPSBnZXRUU3R5bGluZ1JhbmdlTmV4dCh0U3R5bGluZ1JhbmdlKTtcbiAgcmV0dXJuIG5leHQgPT09IDAgPyBnZXRUU3R5bGluZ1JhbmdlUHJldih0U3R5bGluZ1JhbmdlKSA6IG5leHQ7XG59Il19