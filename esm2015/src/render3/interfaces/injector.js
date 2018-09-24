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
 * @record
 */
export function LInjector() { }
/**
 * We need to store a reference to the injector's parent so DI can keep looking up
 * the injector tree until it finds the dependency it's looking for.
 * @type {?}
 */
LInjector.prototype.parent;
/**
 * Necessary to find directive indices for a particular node and look up the LNode.
 * @type {?}
 */
LInjector.prototype.tNode;
/**
 * The view where the node is stored. Necessary because as we traverse up the injector
 * tree the view where we search directives may change.
 * @type {?}
 */
LInjector.prototype.view;
/**
 * The following bloom filter determines whether a directive is available
 * on the associated node or not. This prevents us from searching the directives
 * array at this level unless it's probable the directive is in it.
 *
 * - bf0: Check directive IDs 0-31  (IDs are % 128)
 * - bf1: Check directive IDs 32-63
 * - bf2: Check directive IDs 64-95
 * - bf3: Check directive IDs 96-127
 * - bf4: Check directive IDs 128-159
 * - bf5: Check directive IDs 160 - 191
 * - bf6: Check directive IDs 192 - 223
 * - bf7: Check directive IDs 224 - 255
 *
 * See: https://en.wikipedia.org/wiki/Bloom_filter for more about bloom filters.
 * @type {?}
 */
LInjector.prototype.bf0;
/** @type {?} */
LInjector.prototype.bf1;
/** @type {?} */
LInjector.prototype.bf2;
/** @type {?} */
LInjector.prototype.bf3;
/** @type {?} */
LInjector.prototype.bf4;
/** @type {?} */
LInjector.prototype.bf5;
/** @type {?} */
LInjector.prototype.bf6;
/** @type {?} */
LInjector.prototype.bf7;
/**
 * cbf0 - cbf7 properties determine whether a directive is available through a
 * parent injector. They refer to the merged values of parent bloom filters. This
 * allows us to skip looking up the chain unless it's probable that directive exists
 * up the chain.
 * @type {?}
 */
LInjector.prototype.cbf0;
/** @type {?} */
LInjector.prototype.cbf1;
/** @type {?} */
LInjector.prototype.cbf2;
/** @type {?} */
LInjector.prototype.cbf3;
/** @type {?} */
LInjector.prototype.cbf4;
/** @type {?} */
LInjector.prototype.cbf5;
/** @type {?} */
LInjector.prototype.cbf6;
/** @type {?} */
LInjector.prototype.cbf7;
/** @type {?} */
export const unusedValueExportToPlacateAjd = 1;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5qZWN0b3IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2ludGVyZmFjZXMvaW5qZWN0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBNEVBLGFBQWEsNkJBQTZCLEdBQUcsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5cbmltcG9ydCB7Q2hhbmdlRGV0ZWN0b3JSZWZ9IGZyb20gJy4uLy4uL2NoYW5nZV9kZXRlY3Rpb24vY2hhbmdlX2RldGVjdG9yX3JlZic7XG5pbXBvcnQge0VsZW1lbnRSZWZ9IGZyb20gJy4uLy4uL2xpbmtlci9lbGVtZW50X3JlZic7XG5pbXBvcnQge1RlbXBsYXRlUmVmfSBmcm9tICcuLi8uLi9saW5rZXIvdGVtcGxhdGVfcmVmJztcbmltcG9ydCB7Vmlld0NvbnRhaW5lclJlZn0gZnJvbSAnLi4vLi4vbGlua2VyL3ZpZXdfY29udGFpbmVyX3JlZic7XG5cbmltcG9ydCB7VENvbnRhaW5lck5vZGUsIFRFbGVtZW50Q29udGFpbmVyTm9kZSwgVEVsZW1lbnROb2RlLH0gZnJvbSAnLi9ub2RlJztcbmltcG9ydCB7TFZpZXdEYXRhfSBmcm9tICcuL3ZpZXcnO1xuXG5leHBvcnQgaW50ZXJmYWNlIExJbmplY3RvciB7XG4gIC8qKlxuICAgKiBXZSBuZWVkIHRvIHN0b3JlIGEgcmVmZXJlbmNlIHRvIHRoZSBpbmplY3RvcidzIHBhcmVudCBzbyBESSBjYW4ga2VlcCBsb29raW5nIHVwXG4gICAqIHRoZSBpbmplY3RvciB0cmVlIHVudGlsIGl0IGZpbmRzIHRoZSBkZXBlbmRlbmN5IGl0J3MgbG9va2luZyBmb3IuXG4gICAqL1xuICByZWFkb25seSBwYXJlbnQ6IExJbmplY3RvcnxudWxsO1xuXG4gIC8qKiBOZWNlc3NhcnkgdG8gZmluZCBkaXJlY3RpdmUgaW5kaWNlcyBmb3IgYSBwYXJ0aWN1bGFyIG5vZGUgYW5kIGxvb2sgdXAgdGhlIExOb2RlLiAqL1xuICByZWFkb25seSB0Tm9kZTogVEVsZW1lbnROb2RlfFRFbGVtZW50Q29udGFpbmVyTm9kZXxUQ29udGFpbmVyTm9kZTtcblxuICAvKipcbiAgICogVGhlIHZpZXcgd2hlcmUgdGhlIG5vZGUgaXMgc3RvcmVkLiBOZWNlc3NhcnkgYmVjYXVzZSBhcyB3ZSB0cmF2ZXJzZSB1cCB0aGUgaW5qZWN0b3JcbiAgICogdHJlZSB0aGUgdmlldyB3aGVyZSB3ZSBzZWFyY2ggZGlyZWN0aXZlcyBtYXkgY2hhbmdlLlxuICAgKi9cbiAgcmVhZG9ubHkgdmlldzogTFZpZXdEYXRhO1xuXG4gIC8qKlxuICAgKiBUaGUgZm9sbG93aW5nIGJsb29tIGZpbHRlciBkZXRlcm1pbmVzIHdoZXRoZXIgYSBkaXJlY3RpdmUgaXMgYXZhaWxhYmxlXG4gICAqIG9uIHRoZSBhc3NvY2lhdGVkIG5vZGUgb3Igbm90LiBUaGlzIHByZXZlbnRzIHVzIGZyb20gc2VhcmNoaW5nIHRoZSBkaXJlY3RpdmVzXG4gICAqIGFycmF5IGF0IHRoaXMgbGV2ZWwgdW5sZXNzIGl0J3MgcHJvYmFibGUgdGhlIGRpcmVjdGl2ZSBpcyBpbiBpdC5cbiAgICpcbiAgICogLSBiZjA6IENoZWNrIGRpcmVjdGl2ZSBJRHMgMC0zMSAgKElEcyBhcmUgJSAxMjgpXG4gICAqIC0gYmYxOiBDaGVjayBkaXJlY3RpdmUgSURzIDMyLTYzXG4gICAqIC0gYmYyOiBDaGVjayBkaXJlY3RpdmUgSURzIDY0LTk1XG4gICAqIC0gYmYzOiBDaGVjayBkaXJlY3RpdmUgSURzIDk2LTEyN1xuICAgKiAtIGJmNDogQ2hlY2sgZGlyZWN0aXZlIElEcyAxMjgtMTU5XG4gICAqIC0gYmY1OiBDaGVjayBkaXJlY3RpdmUgSURzIDE2MCAtIDE5MVxuICAgKiAtIGJmNjogQ2hlY2sgZGlyZWN0aXZlIElEcyAxOTIgLSAyMjNcbiAgICogLSBiZjc6IENoZWNrIGRpcmVjdGl2ZSBJRHMgMjI0IC0gMjU1XG4gICAqXG4gICAqIFNlZTogaHR0cHM6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvQmxvb21fZmlsdGVyIGZvciBtb3JlIGFib3V0IGJsb29tIGZpbHRlcnMuXG4gICAqL1xuICBiZjA6IG51bWJlcjtcbiAgYmYxOiBudW1iZXI7XG4gIGJmMjogbnVtYmVyO1xuICBiZjM6IG51bWJlcjtcbiAgYmY0OiBudW1iZXI7XG4gIGJmNTogbnVtYmVyO1xuICBiZjY6IG51bWJlcjtcbiAgYmY3OiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIGNiZjAgLSBjYmY3IHByb3BlcnRpZXMgZGV0ZXJtaW5lIHdoZXRoZXIgYSBkaXJlY3RpdmUgaXMgYXZhaWxhYmxlIHRocm91Z2ggYVxuICAgKiBwYXJlbnQgaW5qZWN0b3IuIFRoZXkgcmVmZXIgdG8gdGhlIG1lcmdlZCB2YWx1ZXMgb2YgcGFyZW50IGJsb29tIGZpbHRlcnMuIFRoaXNcbiAgICogYWxsb3dzIHVzIHRvIHNraXAgbG9va2luZyB1cCB0aGUgY2hhaW4gdW5sZXNzIGl0J3MgcHJvYmFibGUgdGhhdCBkaXJlY3RpdmUgZXhpc3RzXG4gICAqIHVwIHRoZSBjaGFpbi5cbiAgICovXG4gIGNiZjA6IG51bWJlcjtcbiAgY2JmMTogbnVtYmVyO1xuICBjYmYyOiBudW1iZXI7XG4gIGNiZjM6IG51bWJlcjtcbiAgY2JmNDogbnVtYmVyO1xuICBjYmY1OiBudW1iZXI7XG4gIGNiZjY6IG51bWJlcjtcbiAgY2JmNzogbnVtYmVyO1xufVxuXG4vLyBOb3RlOiBUaGlzIGhhY2sgaXMgbmVjZXNzYXJ5IHNvIHdlIGRvbid0IGVycm9uZW91c2x5IGdldCBhIGNpcmN1bGFyIGRlcGVuZGVuY3lcbi8vIGZhaWx1cmUgYmFzZWQgb24gdHlwZXMuXG5leHBvcnQgY29uc3QgdW51c2VkVmFsdWVFeHBvcnRUb1BsYWNhdGVBamQgPSAxO1xuIl19