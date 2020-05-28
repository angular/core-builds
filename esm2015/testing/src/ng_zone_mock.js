/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { __decorate, __metadata } from "tslib";
import { EventEmitter, Injectable, NgZone } from '@angular/core';
/**
 * A mock implementation of {@link NgZone}.
 */
let MockNgZone = /** @class */ (() => {
    let MockNgZone = class MockNgZone extends NgZone {
        constructor() {
            super({ enableLongStackTrace: false, shouldCoalesceEventChangeDetection: false });
            this.onStable = new EventEmitter(false);
        }
        run(fn) {
            return fn();
        }
        runOutsideAngular(fn) {
            return fn();
        }
        simulateZoneExit() {
            this.onStable.emit(null);
        }
    };
    MockNgZone = __decorate([
        Injectable(),
        __metadata("design:paramtypes", [])
    ], MockNgZone);
    return MockNgZone;
})();
export { MockNgZone };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmdfem9uZV9tb2NrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS90ZXN0aW5nL3NyYy9uZ196b25lX21vY2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOztBQUVILE9BQU8sRUFBQyxZQUFZLEVBQUUsVUFBVSxFQUFFLE1BQU0sRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUcvRDs7R0FFRztBQUVIO0lBQUEsSUFBYSxVQUFVLEdBQXZCLE1BQWEsVUFBVyxTQUFRLE1BQU07UUFHcEM7WUFDRSxLQUFLLENBQUMsRUFBQyxvQkFBb0IsRUFBRSxLQUFLLEVBQUUsa0NBQWtDLEVBQUUsS0FBSyxFQUFDLENBQUMsQ0FBQztZQUhsRixhQUFRLEdBQXNCLElBQUksWUFBWSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBSXRELENBQUM7UUFFRCxHQUFHLENBQUMsRUFBWTtZQUNkLE9BQU8sRUFBRSxFQUFFLENBQUM7UUFDZCxDQUFDO1FBRUQsaUJBQWlCLENBQUMsRUFBWTtZQUM1QixPQUFPLEVBQUUsRUFBRSxDQUFDO1FBQ2QsQ0FBQztRQUVELGdCQUFnQjtZQUNkLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzNCLENBQUM7S0FDRixDQUFBO0lBbEJZLFVBQVU7UUFEdEIsVUFBVSxFQUFFOztPQUNBLFVBQVUsQ0FrQnRCO0lBQUQsaUJBQUM7S0FBQTtTQWxCWSxVQUFVIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7RXZlbnRFbWl0dGVyLCBJbmplY3RhYmxlLCBOZ1pvbmV9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuXG5cbi8qKlxuICogQSBtb2NrIGltcGxlbWVudGF0aW9uIG9mIHtAbGluayBOZ1pvbmV9LlxuICovXG5ASW5qZWN0YWJsZSgpXG5leHBvcnQgY2xhc3MgTW9ja05nWm9uZSBleHRlbmRzIE5nWm9uZSB7XG4gIG9uU3RhYmxlOiBFdmVudEVtaXR0ZXI8YW55PiA9IG5ldyBFdmVudEVtaXR0ZXIoZmFsc2UpO1xuXG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKHtlbmFibGVMb25nU3RhY2tUcmFjZTogZmFsc2UsIHNob3VsZENvYWxlc2NlRXZlbnRDaGFuZ2VEZXRlY3Rpb246IGZhbHNlfSk7XG4gIH1cblxuICBydW4oZm46IEZ1bmN0aW9uKTogYW55IHtcbiAgICByZXR1cm4gZm4oKTtcbiAgfVxuXG4gIHJ1bk91dHNpZGVBbmd1bGFyKGZuOiBGdW5jdGlvbik6IGFueSB7XG4gICAgcmV0dXJuIGZuKCk7XG4gIH1cblxuICBzaW11bGF0ZVpvbmVFeGl0KCk6IHZvaWQge1xuICAgIHRoaXMub25TdGFibGUuZW1pdChudWxsKTtcbiAgfVxufVxuIl19