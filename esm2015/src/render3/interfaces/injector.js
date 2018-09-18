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
/**
 * Stores the TemplateRef so subsequent injections of the TemplateRef get the same instance.
 * @type {?}
 */
LInjector.prototype.templateRef;
/**
 * Stores the ViewContainerRef so subsequent injections of the ViewContainerRef get the same
 * instance.
 * @type {?}
 */
LInjector.prototype.viewContainerRef;
/**
 * Stores the ElementRef so subsequent injections of the ElementRef get the same instance.
 * @type {?}
 */
LInjector.prototype.elementRef;
/**
 * Stores the ChangeDetectorRef so subsequent injections of the ChangeDetectorRef get the
 * same instance.
 * @type {?}
 */
LInjector.prototype.changeDetectorRef;
/** @type {?} */
export const unusedValueExportToPlacateAjd = 1;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5qZWN0b3IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2ludGVyZmFjZXMvaW5qZWN0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQTRGQSxhQUFhLDZCQUE2QixHQUFHLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuXG5pbXBvcnQge0NoYW5nZURldGVjdG9yUmVmfSBmcm9tICcuLi8uLi9jaGFuZ2VfZGV0ZWN0aW9uL2NoYW5nZV9kZXRlY3Rvcl9yZWYnO1xuaW1wb3J0IHtFbGVtZW50UmVmfSBmcm9tICcuLi8uLi9saW5rZXIvZWxlbWVudF9yZWYnO1xuaW1wb3J0IHtUZW1wbGF0ZVJlZn0gZnJvbSAnLi4vLi4vbGlua2VyL3RlbXBsYXRlX3JlZic7XG5pbXBvcnQge1ZpZXdDb250YWluZXJSZWZ9IGZyb20gJy4uLy4uL2xpbmtlci92aWV3X2NvbnRhaW5lcl9yZWYnO1xuXG5pbXBvcnQge1RDb250YWluZXJOb2RlLCBURWxlbWVudENvbnRhaW5lck5vZGUsIFRFbGVtZW50Tm9kZSx9IGZyb20gJy4vbm9kZSc7XG5pbXBvcnQge0xWaWV3RGF0YX0gZnJvbSAnLi92aWV3JztcblxuZXhwb3J0IGludGVyZmFjZSBMSW5qZWN0b3Ige1xuICAvKipcbiAgICogV2UgbmVlZCB0byBzdG9yZSBhIHJlZmVyZW5jZSB0byB0aGUgaW5qZWN0b3IncyBwYXJlbnQgc28gREkgY2FuIGtlZXAgbG9va2luZyB1cFxuICAgKiB0aGUgaW5qZWN0b3IgdHJlZSB1bnRpbCBpdCBmaW5kcyB0aGUgZGVwZW5kZW5jeSBpdCdzIGxvb2tpbmcgZm9yLlxuICAgKi9cbiAgcmVhZG9ubHkgcGFyZW50OiBMSW5qZWN0b3J8bnVsbDtcblxuICAvKiogTmVjZXNzYXJ5IHRvIGZpbmQgZGlyZWN0aXZlIGluZGljZXMgZm9yIGEgcGFydGljdWxhciBub2RlIGFuZCBsb29rIHVwIHRoZSBMTm9kZS4gKi9cbiAgcmVhZG9ubHkgdE5vZGU6IFRFbGVtZW50Tm9kZXxURWxlbWVudENvbnRhaW5lck5vZGV8VENvbnRhaW5lck5vZGU7XG5cbiAgLyoqXG4gICAqIFRoZSB2aWV3IHdoZXJlIHRoZSBub2RlIGlzIHN0b3JlZC4gTmVjZXNzYXJ5IGJlY2F1c2UgYXMgd2UgdHJhdmVyc2UgdXAgdGhlIGluamVjdG9yXG4gICAqIHRyZWUgdGhlIHZpZXcgd2hlcmUgd2Ugc2VhcmNoIGRpcmVjdGl2ZXMgbWF5IGNoYW5nZS5cbiAgICovXG4gIHJlYWRvbmx5IHZpZXc6IExWaWV3RGF0YTtcblxuICAvKipcbiAgICogVGhlIGZvbGxvd2luZyBibG9vbSBmaWx0ZXIgZGV0ZXJtaW5lcyB3aGV0aGVyIGEgZGlyZWN0aXZlIGlzIGF2YWlsYWJsZVxuICAgKiBvbiB0aGUgYXNzb2NpYXRlZCBub2RlIG9yIG5vdC4gVGhpcyBwcmV2ZW50cyB1cyBmcm9tIHNlYXJjaGluZyB0aGUgZGlyZWN0aXZlc1xuICAgKiBhcnJheSBhdCB0aGlzIGxldmVsIHVubGVzcyBpdCdzIHByb2JhYmxlIHRoZSBkaXJlY3RpdmUgaXMgaW4gaXQuXG4gICAqXG4gICAqIC0gYmYwOiBDaGVjayBkaXJlY3RpdmUgSURzIDAtMzEgIChJRHMgYXJlICUgMTI4KVxuICAgKiAtIGJmMTogQ2hlY2sgZGlyZWN0aXZlIElEcyAzMi02M1xuICAgKiAtIGJmMjogQ2hlY2sgZGlyZWN0aXZlIElEcyA2NC05NVxuICAgKiAtIGJmMzogQ2hlY2sgZGlyZWN0aXZlIElEcyA5Ni0xMjdcbiAgICogLSBiZjQ6IENoZWNrIGRpcmVjdGl2ZSBJRHMgMTI4LTE1OVxuICAgKiAtIGJmNTogQ2hlY2sgZGlyZWN0aXZlIElEcyAxNjAgLSAxOTFcbiAgICogLSBiZjY6IENoZWNrIGRpcmVjdGl2ZSBJRHMgMTkyIC0gMjIzXG4gICAqIC0gYmY3OiBDaGVjayBkaXJlY3RpdmUgSURzIDIyNCAtIDI1NVxuICAgKlxuICAgKiBTZWU6IGh0dHBzOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0Jsb29tX2ZpbHRlciBmb3IgbW9yZSBhYm91dCBibG9vbSBmaWx0ZXJzLlxuICAgKi9cbiAgYmYwOiBudW1iZXI7XG4gIGJmMTogbnVtYmVyO1xuICBiZjI6IG51bWJlcjtcbiAgYmYzOiBudW1iZXI7XG4gIGJmNDogbnVtYmVyO1xuICBiZjU6IG51bWJlcjtcbiAgYmY2OiBudW1iZXI7XG4gIGJmNzogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBjYmYwIC0gY2JmNyBwcm9wZXJ0aWVzIGRldGVybWluZSB3aGV0aGVyIGEgZGlyZWN0aXZlIGlzIGF2YWlsYWJsZSB0aHJvdWdoIGFcbiAgICogcGFyZW50IGluamVjdG9yLiBUaGV5IHJlZmVyIHRvIHRoZSBtZXJnZWQgdmFsdWVzIG9mIHBhcmVudCBibG9vbSBmaWx0ZXJzLiBUaGlzXG4gICAqIGFsbG93cyB1cyB0byBza2lwIGxvb2tpbmcgdXAgdGhlIGNoYWluIHVubGVzcyBpdCdzIHByb2JhYmxlIHRoYXQgZGlyZWN0aXZlIGV4aXN0c1xuICAgKiB1cCB0aGUgY2hhaW4uXG4gICAqL1xuICBjYmYwOiBudW1iZXI7XG4gIGNiZjE6IG51bWJlcjtcbiAgY2JmMjogbnVtYmVyO1xuICBjYmYzOiBudW1iZXI7XG4gIGNiZjQ6IG51bWJlcjtcbiAgY2JmNTogbnVtYmVyO1xuICBjYmY2OiBudW1iZXI7XG4gIGNiZjc6IG51bWJlcjtcblxuICAvKiogU3RvcmVzIHRoZSBUZW1wbGF0ZVJlZiBzbyBzdWJzZXF1ZW50IGluamVjdGlvbnMgb2YgdGhlIFRlbXBsYXRlUmVmIGdldCB0aGUgc2FtZSBpbnN0YW5jZS4gKi9cbiAgdGVtcGxhdGVSZWY6IFRlbXBsYXRlUmVmPGFueT58bnVsbDtcblxuICAvKiogU3RvcmVzIHRoZSBWaWV3Q29udGFpbmVyUmVmIHNvIHN1YnNlcXVlbnQgaW5qZWN0aW9ucyBvZiB0aGUgVmlld0NvbnRhaW5lclJlZiBnZXQgdGhlIHNhbWVcbiAgICogaW5zdGFuY2UuICovXG4gIHZpZXdDb250YWluZXJSZWY6IFZpZXdDb250YWluZXJSZWZ8bnVsbDtcblxuICAvKiogU3RvcmVzIHRoZSBFbGVtZW50UmVmIHNvIHN1YnNlcXVlbnQgaW5qZWN0aW9ucyBvZiB0aGUgRWxlbWVudFJlZiBnZXQgdGhlIHNhbWUgaW5zdGFuY2UuICovXG4gIGVsZW1lbnRSZWY6IEVsZW1lbnRSZWZ8bnVsbDtcblxuICAvKipcbiAgICogU3RvcmVzIHRoZSBDaGFuZ2VEZXRlY3RvclJlZiBzbyBzdWJzZXF1ZW50IGluamVjdGlvbnMgb2YgdGhlIENoYW5nZURldGVjdG9yUmVmIGdldCB0aGVcbiAgICogc2FtZSBpbnN0YW5jZS5cbiAgICovXG4gIGNoYW5nZURldGVjdG9yUmVmOiBDaGFuZ2VEZXRlY3RvclJlZnxudWxsO1xufVxuXG4vLyBOb3RlOiBUaGlzIGhhY2sgaXMgbmVjZXNzYXJ5IHNvIHdlIGRvbid0IGVycm9uZW91c2x5IGdldCBhIGNpcmN1bGFyIGRlcGVuZGVuY3lcbi8vIGZhaWx1cmUgYmFzZWQgb24gdHlwZXMuXG5leHBvcnQgY29uc3QgdW51c2VkVmFsdWVFeHBvcnRUb1BsYWNhdGVBamQgPSAxO1xuIl19