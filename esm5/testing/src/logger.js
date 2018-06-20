import * as i0 from "@angular/core";
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Injectable } from '@angular/core';
var Log = /** @class */ (function () {
    function Log() {
        this.logItems = [];
    }
    Log.prototype.add = function (value /** TODO #9100 */) { this.logItems.push(value); };
    Log.prototype.fn = function (value /** TODO #9100 */) {
        var _this = this;
        return function (a1, a2, a3, a4, a5) {
            if (a1 === void 0) { a1 = null; }
            if (a2 === void 0) { a2 = null; }
            if (a3 === void 0) { a3 = null; }
            if (a4 === void 0) { a4 = null; }
            if (a5 === void 0) { a5 = null; }
            _this.logItems.push(value);
        };
    };
    Log.prototype.clear = function () { this.logItems = []; };
    Log.prototype.result = function () { return this.logItems.join('; '); };
    Log.ngInjectableDef = i0.defineInjectable({ token: Log, factory: function Log_Factory() { return new Log(); }, providedIn: null });
    return Log;
}());
export { Log };

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9nZ2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS90ZXN0aW5nL3NyYy9sb2dnZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxVQUFVLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFFekM7SUFJRTtRQUFnQixJQUFJLENBQUMsUUFBUSxHQUFHLEVBQUUsQ0FBQztJQUFDLENBQUM7SUFFckMsaUJBQUcsR0FBSCxVQUFJLEtBQVUsQ0FBQyxpQkFBaUIsSUFBVSxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFFdEUsZ0JBQUUsR0FBRixVQUFHLEtBQVUsQ0FBQyxpQkFBaUI7UUFBL0IsaUJBSUM7UUFIQyxPQUFPLFVBQUMsRUFBYyxFQUFFLEVBQWMsRUFBRSxFQUFjLEVBQUUsRUFBYyxFQUFFLEVBQWM7WUFBOUUsbUJBQUEsRUFBQSxTQUFjO1lBQUUsbUJBQUEsRUFBQSxTQUFjO1lBQUUsbUJBQUEsRUFBQSxTQUFjO1lBQUUsbUJBQUEsRUFBQSxTQUFjO1lBQUUsbUJBQUEsRUFBQSxTQUFjO1lBQ3BGLEtBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQzVCLENBQUMsQ0FBQztJQUNKLENBQUM7SUFFRCxtQkFBSyxHQUFMLGNBQWdCLElBQUksQ0FBQyxRQUFRLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQztJQUVyQyxvQkFBTSxHQUFOLGNBQW1CLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO3VEQWYxQyxHQUFHLCtDQUFILEdBQUc7Y0FYaEI7Q0EyQkMsQUFqQkQsSUFpQkM7U0FoQlksR0FBRyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtJbmplY3RhYmxlfSBmcm9tICdAYW5ndWxhci9jb3JlJztcblxuQEluamVjdGFibGUoKVxuZXhwb3J0IGNsYXNzIExvZyB7XG4gIGxvZ0l0ZW1zOiBhbnlbXTtcblxuICBjb25zdHJ1Y3RvcigpIHsgdGhpcy5sb2dJdGVtcyA9IFtdOyB9XG5cbiAgYWRkKHZhbHVlOiBhbnkgLyoqIFRPRE8gIzkxMDAgKi8pOiB2b2lkIHsgdGhpcy5sb2dJdGVtcy5wdXNoKHZhbHVlKTsgfVxuXG4gIGZuKHZhbHVlOiBhbnkgLyoqIFRPRE8gIzkxMDAgKi8pIHtcbiAgICByZXR1cm4gKGExOiBhbnkgPSBudWxsLCBhMjogYW55ID0gbnVsbCwgYTM6IGFueSA9IG51bGwsIGE0OiBhbnkgPSBudWxsLCBhNTogYW55ID0gbnVsbCkgPT4ge1xuICAgICAgdGhpcy5sb2dJdGVtcy5wdXNoKHZhbHVlKTtcbiAgICB9O1xuICB9XG5cbiAgY2xlYXIoKTogdm9pZCB7IHRoaXMubG9nSXRlbXMgPSBbXTsgfVxuXG4gIHJlc3VsdCgpOiBzdHJpbmcgeyByZXR1cm4gdGhpcy5sb2dJdGVtcy5qb2luKCc7ICcpOyB9XG59XG4iXX0=