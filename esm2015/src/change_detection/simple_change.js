/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/**
 * Represents a basic change from a previous to a new value for a single
 * property on a directive instance. Passed as a value in a
 * {\@link SimpleChanges} object to the `ngOnChanges` hook.
 *
 * @see `OnChanges`
 *
 * \@publicApi
 */
export class SimpleChange {
    /**
     * @param {?} previousValue
     * @param {?} currentValue
     * @param {?} firstChange
     */
    constructor(previousValue, currentValue, firstChange) {
        this.previousValue = previousValue;
        this.currentValue = currentValue;
        this.firstChange = firstChange;
    }
    /**
     * Check whether the new value is the first value assigned.
     * @return {?}
     */
    isFirstChange() { return this.firstChange; }
}
if (false) {
    /** @type {?} */
    SimpleChange.prototype.previousValue;
    /** @type {?} */
    SimpleChange.prototype.currentValue;
    /** @type {?} */
    SimpleChange.prototype.firstChange;
}
/**
 * A hashtable of changes represented by {\@link SimpleChange} objects stored
 * at the declared property name they belong to on a Directive or Component. This is
 * the type passed to the `ngOnChanges` hook.
 *
 * @see `OnChanges`
 *
 * \@publicApi
 * @record
 */
export function SimpleChanges() { }
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2ltcGxlX2NoYW5nZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL2NoYW5nZV9kZXRlY3Rpb24vc2ltcGxlX2NoYW5nZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQWlCQSxNQUFNLE9BQU8sWUFBWTs7Ozs7O0lBQ3ZCLFlBQW1CLGFBQWtCLEVBQVMsWUFBaUIsRUFBUyxXQUFvQjtRQUF6RSxrQkFBYSxHQUFiLGFBQWEsQ0FBSztRQUFTLGlCQUFZLEdBQVosWUFBWSxDQUFLO1FBQVMsZ0JBQVcsR0FBWCxXQUFXLENBQVM7SUFBRyxDQUFDOzs7OztJQUloRyxhQUFhLEtBQWMsT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQztDQUN0RDs7O0lBTGEscUNBQXlCOztJQUFFLG9DQUF3Qjs7SUFBRSxtQ0FBMkI7Ozs7Ozs7Ozs7OztBQWdCOUYsbUNBQW9FIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG4vKipcbiAqIFJlcHJlc2VudHMgYSBiYXNpYyBjaGFuZ2UgZnJvbSBhIHByZXZpb3VzIHRvIGEgbmV3IHZhbHVlIGZvciBhIHNpbmdsZVxuICogcHJvcGVydHkgb24gYSBkaXJlY3RpdmUgaW5zdGFuY2UuIFBhc3NlZCBhcyBhIHZhbHVlIGluIGFcbiAqIHtAbGluayBTaW1wbGVDaGFuZ2VzfSBvYmplY3QgdG8gdGhlIGBuZ09uQ2hhbmdlc2AgaG9vay5cbiAqXG4gKiBAc2VlIGBPbkNoYW5nZXNgXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgY2xhc3MgU2ltcGxlQ2hhbmdlIHtcbiAgY29uc3RydWN0b3IocHVibGljIHByZXZpb3VzVmFsdWU6IGFueSwgcHVibGljIGN1cnJlbnRWYWx1ZTogYW55LCBwdWJsaWMgZmlyc3RDaGFuZ2U6IGJvb2xlYW4pIHt9XG4gIC8qKlxuICAgKiBDaGVjayB3aGV0aGVyIHRoZSBuZXcgdmFsdWUgaXMgdGhlIGZpcnN0IHZhbHVlIGFzc2lnbmVkLlxuICAgKi9cbiAgaXNGaXJzdENoYW5nZSgpOiBib29sZWFuIHsgcmV0dXJuIHRoaXMuZmlyc3RDaGFuZ2U7IH1cbn1cblxuLyoqXG4gKiBBIGhhc2h0YWJsZSBvZiBjaGFuZ2VzIHJlcHJlc2VudGVkIGJ5IHtAbGluayBTaW1wbGVDaGFuZ2V9IG9iamVjdHMgc3RvcmVkXG4gKiBhdCB0aGUgZGVjbGFyZWQgcHJvcGVydHkgbmFtZSB0aGV5IGJlbG9uZyB0byBvbiBhIERpcmVjdGl2ZSBvciBDb21wb25lbnQuIFRoaXMgaXNcbiAqIHRoZSB0eXBlIHBhc3NlZCB0byB0aGUgYG5nT25DaGFuZ2VzYCBob29rLlxuICpcbiAqIEBzZWUgYE9uQ2hhbmdlc2BcbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgU2ltcGxlQ2hhbmdlcyB7IFtwcm9wTmFtZTogc3RyaW5nXTogU2ltcGxlQ2hhbmdlOyB9XG4iXX0=