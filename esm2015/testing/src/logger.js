/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as tslib_1 from "tslib";
import { Injectable } from '@angular/core';
let Log = class Log {
    constructor() { this.logItems = []; }
    add(value /** TODO #9100 */) { this.logItems.push(value); }
    fn(value /** TODO #9100 */) {
        return (a1 = null, a2 = null, a3 = null, a4 = null, a5 = null) => {
            this.logItems.push(value);
        };
    }
    clear() { this.logItems = []; }
    result() { return this.logItems.join('; '); }
};
Log = tslib_1.__decorate([
    Injectable(),
    tslib_1.__metadata("design:paramtypes", [])
], Log);
export { Log };

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9nZ2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS90ZXN0aW5nL3NyYy9sb2dnZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOztBQUVILE9BQU8sRUFBQyxVQUFVLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFHekMsSUFBYSxHQUFHLEdBQWhCO0lBR0UsZ0JBQWdCLElBQUksQ0FBQyxRQUFRLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQztJQUVyQyxHQUFHLENBQUMsS0FBVSxDQUFDLGlCQUFpQixJQUFVLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUV0RSxFQUFFLENBQUMsS0FBVSxDQUFDLGlCQUFpQjtRQUM3QixPQUFPLENBQUMsS0FBVSxJQUFJLEVBQUUsS0FBVSxJQUFJLEVBQUUsS0FBVSxJQUFJLEVBQUUsS0FBVSxJQUFJLEVBQUUsS0FBVSxJQUFJLEVBQUUsRUFBRTtZQUN4RixJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUM1QixDQUFDLENBQUM7SUFDSixDQUFDO0lBRUQsS0FBSyxLQUFXLElBQUksQ0FBQyxRQUFRLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQztJQUVyQyxNQUFNLEtBQWEsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7Q0FDdEQsQ0FBQTtBQWhCWSxHQUFHO0lBRGYsVUFBVSxFQUFFOztHQUNBLEdBQUcsQ0FnQmY7U0FoQlksR0FBRyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtJbmplY3RhYmxlfSBmcm9tICdAYW5ndWxhci9jb3JlJztcblxuQEluamVjdGFibGUoKVxuZXhwb3J0IGNsYXNzIExvZyB7XG4gIGxvZ0l0ZW1zOiBhbnlbXTtcblxuICBjb25zdHJ1Y3RvcigpIHsgdGhpcy5sb2dJdGVtcyA9IFtdOyB9XG5cbiAgYWRkKHZhbHVlOiBhbnkgLyoqIFRPRE8gIzkxMDAgKi8pOiB2b2lkIHsgdGhpcy5sb2dJdGVtcy5wdXNoKHZhbHVlKTsgfVxuXG4gIGZuKHZhbHVlOiBhbnkgLyoqIFRPRE8gIzkxMDAgKi8pIHtcbiAgICByZXR1cm4gKGExOiBhbnkgPSBudWxsLCBhMjogYW55ID0gbnVsbCwgYTM6IGFueSA9IG51bGwsIGE0OiBhbnkgPSBudWxsLCBhNTogYW55ID0gbnVsbCkgPT4ge1xuICAgICAgdGhpcy5sb2dJdGVtcy5wdXNoKHZhbHVlKTtcbiAgICB9O1xuICB9XG5cbiAgY2xlYXIoKTogdm9pZCB7IHRoaXMubG9nSXRlbXMgPSBbXTsgfVxuXG4gIHJlc3VsdCgpOiBzdHJpbmcgeyByZXR1cm4gdGhpcy5sb2dJdGVtcy5qb2luKCc7ICcpOyB9XG59XG4iXX0=