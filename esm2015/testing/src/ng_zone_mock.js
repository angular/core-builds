/**
 * @fileoverview added by tsickle
 * Generated from: packages/core/testing/src/ng_zone_mock.ts
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { EventEmitter, Injectable, NgZone } from '@angular/core';
/**
 * A mock implementation of {\@link NgZone}.
 */
let MockNgZone = /** @class */ (() => {
    /**
     * A mock implementation of {\@link NgZone}.
     */
    class MockNgZone extends NgZone {
        constructor() {
            super({ enableLongStackTrace: false, shouldCoalesceEventChangeDetection: false });
            this.onStable = new EventEmitter(false);
        }
        /**
         * @param {?} fn
         * @return {?}
         */
        run(fn) {
            return fn();
        }
        /**
         * @param {?} fn
         * @return {?}
         */
        runOutsideAngular(fn) {
            return fn();
        }
        /**
         * @return {?}
         */
        simulateZoneExit() {
            this.onStable.emit(null);
        }
    }
    MockNgZone.decorators = [
        { type: Injectable }
    ];
    /** @nocollapse */
    MockNgZone.ctorParameters = () => [];
    return MockNgZone;
})();
export { MockNgZone };
if (false) {
    /** @type {?} */
    MockNgZone.prototype.onStable;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmdfem9uZV9tb2NrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS90ZXN0aW5nL3NyYy9uZ196b25lX21vY2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUFDLFlBQVksRUFBRSxVQUFVLEVBQUUsTUFBTSxFQUFDLE1BQU0sZUFBZSxDQUFDOzs7O0FBTS9EOzs7O0lBQUEsTUFDYSxVQUFXLFNBQVEsTUFBTTtRQUdwQztZQUNFLEtBQUssQ0FBQyxFQUFDLG9CQUFvQixFQUFFLEtBQUssRUFBRSxrQ0FBa0MsRUFBRSxLQUFLLEVBQUMsQ0FBQyxDQUFDO1lBSGxGLGFBQVEsR0FBc0IsSUFBSSxZQUFZLENBQUMsS0FBSyxDQUFDLENBQUM7UUFJdEQsQ0FBQzs7Ozs7UUFFRCxHQUFHLENBQUMsRUFBWTtZQUNkLE9BQU8sRUFBRSxFQUFFLENBQUM7UUFDZCxDQUFDOzs7OztRQUVELGlCQUFpQixDQUFDLEVBQVk7WUFDNUIsT0FBTyxFQUFFLEVBQUUsQ0FBQztRQUNkLENBQUM7Ozs7UUFFRCxnQkFBZ0I7WUFDZCxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUMzQixDQUFDOzs7Z0JBbEJGLFVBQVU7Ozs7SUFtQlgsaUJBQUM7S0FBQTtTQWxCWSxVQUFVOzs7SUFDckIsOEJBQXNEIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0V2ZW50RW1pdHRlciwgSW5qZWN0YWJsZSwgTmdab25lfSBmcm9tICdAYW5ndWxhci9jb3JlJztcblxuXG4vKipcbiAqIEEgbW9jayBpbXBsZW1lbnRhdGlvbiBvZiB7QGxpbmsgTmdab25lfS5cbiAqL1xuQEluamVjdGFibGUoKVxuZXhwb3J0IGNsYXNzIE1vY2tOZ1pvbmUgZXh0ZW5kcyBOZ1pvbmUge1xuICBvblN0YWJsZTogRXZlbnRFbWl0dGVyPGFueT4gPSBuZXcgRXZlbnRFbWl0dGVyKGZhbHNlKTtcblxuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcih7ZW5hYmxlTG9uZ1N0YWNrVHJhY2U6IGZhbHNlLCBzaG91bGRDb2FsZXNjZUV2ZW50Q2hhbmdlRGV0ZWN0aW9uOiBmYWxzZX0pO1xuICB9XG5cbiAgcnVuKGZuOiBGdW5jdGlvbik6IGFueSB7XG4gICAgcmV0dXJuIGZuKCk7XG4gIH1cblxuICBydW5PdXRzaWRlQW5ndWxhcihmbjogRnVuY3Rpb24pOiBhbnkge1xuICAgIHJldHVybiBmbigpO1xuICB9XG5cbiAgc2ltdWxhdGVab25lRXhpdCgpOiB2b2lkIHtcbiAgICB0aGlzLm9uU3RhYmxlLmVtaXQobnVsbCk7XG4gIH1cbn1cbiJdfQ==