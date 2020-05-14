/**
 * @fileoverview added by tsickle
 * Generated from: packages/core/testing/src/ng_zone_mock.ts
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
import { EventEmitter, Injectable, NgZone } from '@angular/core';
import * as i0 from "@angular/core";
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
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
        { type: Injectable },
    ];
    /** @nocollapse */
    MockNgZone.ctorParameters = () => [];
    /** @nocollapse */ MockNgZone.ɵfac = function MockNgZone_Factory(t) { return new (t || MockNgZone)(); };
    /** @nocollapse */ MockNgZone.ɵprov = i0.ɵɵdefineInjectable({ token: MockNgZone, factory: MockNgZone.ɵfac });
    return MockNgZone;
})();
export { MockNgZone };
/*@__PURE__*/ (function () { i0.ɵsetClassMetadata(MockNgZone, [{
        type: Injectable
    }], function () { return []; }, null); })();
if (false) {
    /** @type {?} */
    MockNgZone.prototype.onStable;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmdfem9uZV9tb2NrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS90ZXN0aW5nL3NyYy9uZ196b25lX21vY2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFRQSxPQUFPLEVBQUMsWUFBWSxFQUFFLFVBQVUsRUFBRSxNQUFNLEVBQUMsTUFBTSxlQUFlLENBQUM7Ozs7Ozs7Ozs7OztBQU0vRDs7OztJQUFBLE1BQ2EsVUFBVyxTQUFRLE1BQU07UUFHcEM7WUFDRSxLQUFLLENBQUMsRUFBQyxvQkFBb0IsRUFBRSxLQUFLLEVBQUUsa0NBQWtDLEVBQUUsS0FBSyxFQUFDLENBQUMsQ0FBQztZQUhsRixhQUFRLEdBQXNCLElBQUksWUFBWSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBSXRELENBQUM7Ozs7O1FBRUQsR0FBRyxDQUFDLEVBQVk7WUFDZCxPQUFPLEVBQUUsRUFBRSxDQUFDO1FBQ2QsQ0FBQzs7Ozs7UUFFRCxpQkFBaUIsQ0FBQyxFQUFZO1lBQzVCLE9BQU8sRUFBRSxFQUFFLENBQUM7UUFDZCxDQUFDOzs7O1FBRUQsZ0JBQWdCO1lBQ2QsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDM0IsQ0FBQzs7O2dCQWxCRixVQUFVOzs7OzJGQUNFLFVBQVU7eUVBQVYsVUFBVSxXQUFWLFVBQVU7cUJBZnZCO0tBaUNDO1NBbEJZLFVBQVU7a0RBQVYsVUFBVTtjQUR0QixVQUFVOzs7O0lBRVQsOEJBQXNEIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0V2ZW50RW1pdHRlciwgSW5qZWN0YWJsZSwgTmdab25lfSBmcm9tICdAYW5ndWxhci9jb3JlJztcblxuXG4vKipcbiAqIEEgbW9jayBpbXBsZW1lbnRhdGlvbiBvZiB7QGxpbmsgTmdab25lfS5cbiAqL1xuQEluamVjdGFibGUoKVxuZXhwb3J0IGNsYXNzIE1vY2tOZ1pvbmUgZXh0ZW5kcyBOZ1pvbmUge1xuICBvblN0YWJsZTogRXZlbnRFbWl0dGVyPGFueT4gPSBuZXcgRXZlbnRFbWl0dGVyKGZhbHNlKTtcblxuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcih7ZW5hYmxlTG9uZ1N0YWNrVHJhY2U6IGZhbHNlLCBzaG91bGRDb2FsZXNjZUV2ZW50Q2hhbmdlRGV0ZWN0aW9uOiBmYWxzZX0pO1xuICB9XG5cbiAgcnVuKGZuOiBGdW5jdGlvbik6IGFueSB7XG4gICAgcmV0dXJuIGZuKCk7XG4gIH1cblxuICBydW5PdXRzaWRlQW5ndWxhcihmbjogRnVuY3Rpb24pOiBhbnkge1xuICAgIHJldHVybiBmbigpO1xuICB9XG5cbiAgc2ltdWxhdGVab25lRXhpdCgpOiB2b2lkIHtcbiAgICB0aGlzLm9uU3RhYmxlLmVtaXQobnVsbCk7XG4gIH1cbn1cbiJdfQ==