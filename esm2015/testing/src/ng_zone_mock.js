import * as i0 from "@angular/core";
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
import { EventEmitter, Injectable, NgZone } from '@angular/core';
/**
 * A mock implementation of {\@link NgZone}.
 */
export class MockNgZone extends NgZone {
    constructor() {
        super({ enableLongStackTrace: false });
        this.onStable = new EventEmitter(false);
    }
    /**
     * @param {?} fn
     * @return {?}
     */
    run(fn) { return fn(); }
    /**
     * @param {?} fn
     * @return {?}
     */
    runOutsideAngular(fn) { return fn(); }
    /**
     * @return {?}
     */
    simulateZoneExit() { this.onStable.emit(null); }
}
MockNgZone.decorators = [
    { type: Injectable },
];
/** @nocollapse */
MockNgZone.ctorParameters = () => [];
MockNgZone.ngInjectableDef = i0.defineInjectable({ token: MockNgZone, factory: function MockNgZone_Factory() { return new MockNgZone(); }, providedIn: null });
if (false) {
    /** @type {?} */
    MockNgZone.prototype.onStable;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmdfem9uZV9tb2NrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS90ZXN0aW5nL3NyYy9uZ196b25lX21vY2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUFDLFlBQVksRUFBRSxVQUFVLEVBQUUsTUFBTSxFQUFDLE1BQU0sZUFBZSxDQUFDOzs7O0FBTy9ELE1BQU0saUJBQWtCLFNBQVEsTUFBTTtJQUdwQztRQUFnQixLQUFLLENBQUMsRUFBQyxvQkFBb0IsRUFBRSxLQUFLLEVBQUMsQ0FBQyxDQUFDO3dCQUZ2QixJQUFJLFlBQVksQ0FBQyxLQUFLLENBQUM7S0FFRTs7Ozs7SUFFdkQsR0FBRyxDQUFDLEVBQVksSUFBUyxPQUFPLEVBQUUsRUFBRSxDQUFDLEVBQUU7Ozs7O0lBRXZDLGlCQUFpQixDQUFDLEVBQVksSUFBUyxPQUFPLEVBQUUsRUFBRSxDQUFDLEVBQUU7Ozs7SUFFckQsZ0JBQWdCLEtBQVcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRTs7O1lBVnZELFVBQVU7Ozs7MERBQ0UsVUFBVSxzREFBVixVQUFVIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0V2ZW50RW1pdHRlciwgSW5qZWN0YWJsZSwgTmdab25lfSBmcm9tICdAYW5ndWxhci9jb3JlJztcblxuXG4vKipcbiAqIEEgbW9jayBpbXBsZW1lbnRhdGlvbiBvZiB7QGxpbmsgTmdab25lfS5cbiAqL1xuQEluamVjdGFibGUoKVxuZXhwb3J0IGNsYXNzIE1vY2tOZ1pvbmUgZXh0ZW5kcyBOZ1pvbmUge1xuICBvblN0YWJsZTogRXZlbnRFbWl0dGVyPGFueT4gPSBuZXcgRXZlbnRFbWl0dGVyKGZhbHNlKTtcblxuICBjb25zdHJ1Y3RvcigpIHsgc3VwZXIoe2VuYWJsZUxvbmdTdGFja1RyYWNlOiBmYWxzZX0pOyB9XG5cbiAgcnVuKGZuOiBGdW5jdGlvbik6IGFueSB7IHJldHVybiBmbigpOyB9XG5cbiAgcnVuT3V0c2lkZUFuZ3VsYXIoZm46IEZ1bmN0aW9uKTogYW55IHsgcmV0dXJuIGZuKCk7IH1cblxuICBzaW11bGF0ZVpvbmVFeGl0KCk6IHZvaWQgeyB0aGlzLm9uU3RhYmxlLmVtaXQobnVsbCk7IH1cbn1cbiJdfQ==