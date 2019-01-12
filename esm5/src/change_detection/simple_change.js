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
 * {@link SimpleChanges} object to the `ngOnChanges` hook.
 *
 * @see `OnChanges`
 *
 * @publicApi
 */
var SimpleChange = /** @class */ (function () {
    function SimpleChange(previousValue, currentValue, firstChange) {
        this.previousValue = previousValue;
        this.currentValue = currentValue;
        this.firstChange = firstChange;
    }
    /**
     * Check whether the new value is the first value assigned.
     */
    SimpleChange.prototype.isFirstChange = function () { return this.firstChange; };
    return SimpleChange;
}());
export { SimpleChange };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2ltcGxlX2NoYW5nZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL2NoYW5nZV9kZXRlY3Rpb24vc2ltcGxlX2NoYW5nZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSDs7Ozs7Ozs7R0FRRztBQUNIO0lBQ0Usc0JBQW1CLGFBQWtCLEVBQVMsWUFBaUIsRUFBUyxXQUFvQjtRQUF6RSxrQkFBYSxHQUFiLGFBQWEsQ0FBSztRQUFTLGlCQUFZLEdBQVosWUFBWSxDQUFLO1FBQVMsZ0JBQVcsR0FBWCxXQUFXLENBQVM7SUFBRyxDQUFDO0lBQ2hHOztPQUVHO0lBQ0gsb0NBQWEsR0FBYixjQUEyQixPQUFPLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDO0lBQ3ZELG1CQUFDO0FBQUQsQ0FBQyxBQU5ELElBTUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbi8qKlxuICogUmVwcmVzZW50cyBhIGJhc2ljIGNoYW5nZSBmcm9tIGEgcHJldmlvdXMgdG8gYSBuZXcgdmFsdWUgZm9yIGEgc2luZ2xlXG4gKiBwcm9wZXJ0eSBvbiBhIGRpcmVjdGl2ZSBpbnN0YW5jZS4gUGFzc2VkIGFzIGEgdmFsdWUgaW4gYVxuICoge0BsaW5rIFNpbXBsZUNoYW5nZXN9IG9iamVjdCB0byB0aGUgYG5nT25DaGFuZ2VzYCBob29rLlxuICpcbiAqIEBzZWUgYE9uQ2hhbmdlc2BcbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBjbGFzcyBTaW1wbGVDaGFuZ2Uge1xuICBjb25zdHJ1Y3RvcihwdWJsaWMgcHJldmlvdXNWYWx1ZTogYW55LCBwdWJsaWMgY3VycmVudFZhbHVlOiBhbnksIHB1YmxpYyBmaXJzdENoYW5nZTogYm9vbGVhbikge31cbiAgLyoqXG4gICAqIENoZWNrIHdoZXRoZXIgdGhlIG5ldyB2YWx1ZSBpcyB0aGUgZmlyc3QgdmFsdWUgYXNzaWduZWQuXG4gICAqL1xuICBpc0ZpcnN0Q2hhbmdlKCk6IGJvb2xlYW4geyByZXR1cm4gdGhpcy5maXJzdENoYW5nZTsgfVxufVxuXG4vKipcbiAqIEEgaGFzaHRhYmxlIG9mIGNoYW5nZXMgcmVwcmVzZW50ZWQgYnkge0BsaW5rIFNpbXBsZUNoYW5nZX0gb2JqZWN0cyBzdG9yZWRcbiAqIGF0IHRoZSBkZWNsYXJlZCBwcm9wZXJ0eSBuYW1lIHRoZXkgYmVsb25nIHRvIG9uIGEgRGlyZWN0aXZlIG9yIENvbXBvbmVudC4gVGhpcyBpc1xuICogdGhlIHR5cGUgcGFzc2VkIHRvIHRoZSBgbmdPbkNoYW5nZXNgIGhvb2suXG4gKlxuICogQHNlZSBgT25DaGFuZ2VzYFxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBTaW1wbGVDaGFuZ2VzIHsgW3Byb3BOYW1lOiBzdHJpbmddOiBTaW1wbGVDaGFuZ2U7IH1cbiJdfQ==