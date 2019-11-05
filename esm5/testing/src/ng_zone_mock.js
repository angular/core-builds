import { __extends } from "tslib";
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { EventEmitter, Injectable, NgZone } from '@angular/core';
import * as i0 from "@angular/core";
/**
 * A mock implementation of {@link NgZone}.
 */
var MockNgZone = /** @class */ (function (_super) {
    __extends(MockNgZone, _super);
    function MockNgZone() {
        var _this = _super.call(this, { enableLongStackTrace: false, shouldCoalesceEventChangeDetection: false }) || this;
        _this.onStable = new EventEmitter(false);
        return _this;
    }
    MockNgZone.prototype.run = function (fn) { return fn(); };
    MockNgZone.prototype.runOutsideAngular = function (fn) { return fn(); };
    MockNgZone.prototype.simulateZoneExit = function () { this.onStable.emit(null); };
    MockNgZone.ɵfac = function MockNgZone_Factory(t) { return new (t || MockNgZone)(); };
    MockNgZone.ɵprov = i0.ɵɵdefineInjectable({ token: MockNgZone, factory: function (t) { return MockNgZone.ɵfac(t); }, providedIn: null });
    return MockNgZone;
}(NgZone));
export { MockNgZone };
/*@__PURE__*/ i0.ɵsetClassMetadata(MockNgZone, [{
        type: Injectable
    }], function () { return []; }, null);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmdfem9uZV9tb2NrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS90ZXN0aW5nL3NyYy9uZ196b25lX21vY2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxZQUFZLEVBQUUsVUFBVSxFQUFFLE1BQU0sRUFBQyxNQUFNLGVBQWUsQ0FBQzs7QUFHL0Q7O0dBRUc7QUFDSDtJQUNnQyw4QkFBTTtJQUdwQztRQUFBLFlBQWdCLGtCQUFNLEVBQUMsb0JBQW9CLEVBQUUsS0FBSyxFQUFFLGtDQUFrQyxFQUFFLEtBQUssRUFBQyxDQUFDLFNBQUc7UUFGbEcsY0FBUSxHQUFzQixJQUFJLFlBQVksQ0FBQyxLQUFLLENBQUMsQ0FBQzs7SUFFMkMsQ0FBQztJQUVsRyx3QkFBRyxHQUFILFVBQUksRUFBWSxJQUFTLE9BQU8sRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBRXZDLHNDQUFpQixHQUFqQixVQUFrQixFQUFZLElBQVMsT0FBTyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFFckQscUNBQWdCLEdBQWhCLGNBQTJCLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQzt3RUFUM0MsVUFBVTtzREFBVixVQUFVLGlDQUFWLFVBQVU7cUJBZnZCO0NBeUJDLEFBWEQsQ0FDZ0MsTUFBTSxHQVVyQztTQVZZLFVBQVU7bUNBQVYsVUFBVTtjQUR0QixVQUFVIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0V2ZW50RW1pdHRlciwgSW5qZWN0YWJsZSwgTmdab25lfSBmcm9tICdAYW5ndWxhci9jb3JlJztcblxuXG4vKipcbiAqIEEgbW9jayBpbXBsZW1lbnRhdGlvbiBvZiB7QGxpbmsgTmdab25lfS5cbiAqL1xuQEluamVjdGFibGUoKVxuZXhwb3J0IGNsYXNzIE1vY2tOZ1pvbmUgZXh0ZW5kcyBOZ1pvbmUge1xuICBvblN0YWJsZTogRXZlbnRFbWl0dGVyPGFueT4gPSBuZXcgRXZlbnRFbWl0dGVyKGZhbHNlKTtcblxuICBjb25zdHJ1Y3RvcigpIHsgc3VwZXIoe2VuYWJsZUxvbmdTdGFja1RyYWNlOiBmYWxzZSwgc2hvdWxkQ29hbGVzY2VFdmVudENoYW5nZURldGVjdGlvbjogZmFsc2V9KTsgfVxuXG4gIHJ1bihmbjogRnVuY3Rpb24pOiBhbnkgeyByZXR1cm4gZm4oKTsgfVxuXG4gIHJ1bk91dHNpZGVBbmd1bGFyKGZuOiBGdW5jdGlvbik6IGFueSB7IHJldHVybiBmbigpOyB9XG5cbiAgc2ltdWxhdGVab25lRXhpdCgpOiB2b2lkIHsgdGhpcy5vblN0YWJsZS5lbWl0KG51bGwpOyB9XG59XG4iXX0=