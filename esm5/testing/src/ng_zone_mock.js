import * as tslib_1 from "tslib";
import * as i0 from "@angular/core";
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { EventEmitter, Injectable, NgZone } from '@angular/core';
/**
 * A mock implementation of {@link NgZone}.
 */
var MockNgZone = /** @class */ (function (_super) {
    tslib_1.__extends(MockNgZone, _super);
    function MockNgZone() {
        var _this = _super.call(this, { enableLongStackTrace: false }) || this;
        _this.onStable = new EventEmitter(false);
        return _this;
    }
    MockNgZone.prototype.run = function (fn) { return fn(); };
    MockNgZone.prototype.runOutsideAngular = function (fn) { return fn(); };
    MockNgZone.prototype.simulateZoneExit = function () { this.onStable.emit(null); };
    MockNgZone.ngInjectableDef = i0.defineInjectable({ token: MockNgZone, factory: function MockNgZone_Factory() { return new MockNgZone(); }, providedIn: null });
    return MockNgZone;
}(NgZone));
export { MockNgZone };

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmdfem9uZV9tb2NrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS90ZXN0aW5nL3NyYy9uZ196b25lX21vY2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsWUFBWSxFQUFFLFVBQVUsRUFBRSxNQUFNLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFHL0Q7O0dBRUc7QUFDSDtJQUNnQyxzQ0FBTTtJQUdwQztRQUFBLFlBQWdCLGtCQUFNLEVBQUMsb0JBQW9CLEVBQUUsS0FBSyxFQUFDLENBQUMsU0FBRztRQUZ2RCxjQUFRLEdBQXNCLElBQUksWUFBWSxDQUFDLEtBQUssQ0FBQyxDQUFDOztJQUVBLENBQUM7SUFFdkQsd0JBQUcsR0FBSCxVQUFJLEVBQVksSUFBUyxPQUFPLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztJQUV2QyxzQ0FBaUIsR0FBakIsVUFBa0IsRUFBWSxJQUFTLE9BQU8sRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBRXJELHFDQUFnQixHQUFoQixjQUEyQixJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7OERBVDNDLFVBQVUsc0RBQVYsVUFBVTtxQkFmdkI7Q0F5QkMsQUFYRCxDQUNnQyxNQUFNLEdBVXJDO1NBVlksVUFBVSIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtFdmVudEVtaXR0ZXIsIEluamVjdGFibGUsIE5nWm9uZX0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5cblxuLyoqXG4gKiBBIG1vY2sgaW1wbGVtZW50YXRpb24gb2Yge0BsaW5rIE5nWm9uZX0uXG4gKi9cbkBJbmplY3RhYmxlKClcbmV4cG9ydCBjbGFzcyBNb2NrTmdab25lIGV4dGVuZHMgTmdab25lIHtcbiAgb25TdGFibGU6IEV2ZW50RW1pdHRlcjxhbnk+ID0gbmV3IEV2ZW50RW1pdHRlcihmYWxzZSk7XG5cbiAgY29uc3RydWN0b3IoKSB7IHN1cGVyKHtlbmFibGVMb25nU3RhY2tUcmFjZTogZmFsc2V9KTsgfVxuXG4gIHJ1bihmbjogRnVuY3Rpb24pOiBhbnkgeyByZXR1cm4gZm4oKTsgfVxuXG4gIHJ1bk91dHNpZGVBbmd1bGFyKGZuOiBGdW5jdGlvbik6IGFueSB7IHJldHVybiBmbigpOyB9XG5cbiAgc2ltdWxhdGVab25lRXhpdCgpOiB2b2lkIHsgdGhpcy5vblN0YWJsZS5lbWl0KG51bGwpOyB9XG59XG4iXX0=