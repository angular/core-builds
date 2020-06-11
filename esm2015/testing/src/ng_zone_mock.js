/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { EventEmitter, Injectable, NgZone } from '@angular/core';
import * as i0 from "@angular/core";
/**
 * A mock implementation of {@link NgZone}.
 */
export class MockNgZone extends NgZone {
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
}
MockNgZone.ɵfac = function MockNgZone_Factory(t) { return new (t || MockNgZone)(); };
MockNgZone.ɵprov = i0.ɵɵdefineInjectable({ token: MockNgZone, factory: MockNgZone.ɵfac });
/*@__PURE__*/ (function () { i0.ɵsetClassMetadata(MockNgZone, [{
        type: Injectable
    }], function () { return []; }, null); })();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmdfem9uZV9tb2NrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS90ZXN0aW5nL3NyYy9uZ196b25lX21vY2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLFlBQVksRUFBRSxVQUFVLEVBQUUsTUFBTSxFQUFDLE1BQU0sZUFBZSxDQUFDOztBQUcvRDs7R0FFRztBQUVILE1BQU0sT0FBTyxVQUFXLFNBQVEsTUFBTTtJQUdwQztRQUNFLEtBQUssQ0FBQyxFQUFDLG9CQUFvQixFQUFFLEtBQUssRUFBRSxrQ0FBa0MsRUFBRSxLQUFLLEVBQUMsQ0FBQyxDQUFDO1FBSGxGLGFBQVEsR0FBc0IsSUFBSSxZQUFZLENBQUMsS0FBSyxDQUFDLENBQUM7SUFJdEQsQ0FBQztJQUVELEdBQUcsQ0FBQyxFQUFZO1FBQ2QsT0FBTyxFQUFFLEVBQUUsQ0FBQztJQUNkLENBQUM7SUFFRCxpQkFBaUIsQ0FBQyxFQUFZO1FBQzVCLE9BQU8sRUFBRSxFQUFFLENBQUM7SUFDZCxDQUFDO0lBRUQsZ0JBQWdCO1FBQ2QsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDM0IsQ0FBQzs7b0VBakJVLFVBQVU7a0RBQVYsVUFBVSxXQUFWLFVBQVU7a0RBQVYsVUFBVTtjQUR0QixVQUFVIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7RXZlbnRFbWl0dGVyLCBJbmplY3RhYmxlLCBOZ1pvbmV9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuXG5cbi8qKlxuICogQSBtb2NrIGltcGxlbWVudGF0aW9uIG9mIHtAbGluayBOZ1pvbmV9LlxuICovXG5ASW5qZWN0YWJsZSgpXG5leHBvcnQgY2xhc3MgTW9ja05nWm9uZSBleHRlbmRzIE5nWm9uZSB7XG4gIG9uU3RhYmxlOiBFdmVudEVtaXR0ZXI8YW55PiA9IG5ldyBFdmVudEVtaXR0ZXIoZmFsc2UpO1xuXG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKHtlbmFibGVMb25nU3RhY2tUcmFjZTogZmFsc2UsIHNob3VsZENvYWxlc2NlRXZlbnRDaGFuZ2VEZXRlY3Rpb246IGZhbHNlfSk7XG4gIH1cblxuICBydW4oZm46IEZ1bmN0aW9uKTogYW55IHtcbiAgICByZXR1cm4gZm4oKTtcbiAgfVxuXG4gIHJ1bk91dHNpZGVBbmd1bGFyKGZuOiBGdW5jdGlvbik6IGFueSB7XG4gICAgcmV0dXJuIGZuKCk7XG4gIH1cblxuICBzaW11bGF0ZVpvbmVFeGl0KCk6IHZvaWQge1xuICAgIHRoaXMub25TdGFibGUuZW1pdChudWxsKTtcbiAgfVxufVxuIl19