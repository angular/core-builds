/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { __decorate, __metadata } from "tslib";
import { Injectable } from '@angular/core';
let Log = /** @class */ (() => {
    let Log = class Log {
        constructor() {
            this.logItems = [];
        }
        add(value /** TODO #9100 */) {
            this.logItems.push(value);
        }
        fn(value /** TODO #9100 */) {
            return (a1 = null, a2 = null, a3 = null, a4 = null, a5 = null) => {
                this.logItems.push(value);
            };
        }
        clear() {
            this.logItems = [];
        }
        result() {
            return this.logItems.join('; ');
        }
    };
    Log = __decorate([
        Injectable(),
        __metadata("design:paramtypes", [])
    ], Log);
    return Log;
})();
export { Log };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9nZ2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS90ZXN0aW5nL3NyYy9sb2dnZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOztBQUVILE9BQU8sRUFBQyxVQUFVLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFHekM7SUFBQSxJQUFhLEdBQUcsR0FBaEIsTUFBYSxHQUFHO1FBR2Q7WUFDRSxJQUFJLENBQUMsUUFBUSxHQUFHLEVBQUUsQ0FBQztRQUNyQixDQUFDO1FBRUQsR0FBRyxDQUFDLEtBQVUsQ0FBQyxpQkFBaUI7WUFDOUIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDNUIsQ0FBQztRQUVELEVBQUUsQ0FBQyxLQUFVLENBQUMsaUJBQWlCO1lBQzdCLE9BQU8sQ0FBQyxLQUFVLElBQUksRUFBRSxLQUFVLElBQUksRUFBRSxLQUFVLElBQUksRUFBRSxLQUFVLElBQUksRUFBRSxLQUFVLElBQUksRUFBRSxFQUFFO2dCQUN4RixJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUM1QixDQUFDLENBQUM7UUFDSixDQUFDO1FBRUQsS0FBSztZQUNILElBQUksQ0FBQyxRQUFRLEdBQUcsRUFBRSxDQUFDO1FBQ3JCLENBQUM7UUFFRCxNQUFNO1lBQ0osT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNsQyxDQUFDO0tBQ0YsQ0FBQTtJQXhCWSxHQUFHO1FBRGYsVUFBVSxFQUFFOztPQUNBLEdBQUcsQ0F3QmY7SUFBRCxVQUFDO0tBQUE7U0F4QlksR0FBRyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0luamVjdGFibGV9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuXG5ASW5qZWN0YWJsZSgpXG5leHBvcnQgY2xhc3MgTG9nIHtcbiAgbG9nSXRlbXM6IGFueVtdO1xuXG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHRoaXMubG9nSXRlbXMgPSBbXTtcbiAgfVxuXG4gIGFkZCh2YWx1ZTogYW55IC8qKiBUT0RPICM5MTAwICovKTogdm9pZCB7XG4gICAgdGhpcy5sb2dJdGVtcy5wdXNoKHZhbHVlKTtcbiAgfVxuXG4gIGZuKHZhbHVlOiBhbnkgLyoqIFRPRE8gIzkxMDAgKi8pIHtcbiAgICByZXR1cm4gKGExOiBhbnkgPSBudWxsLCBhMjogYW55ID0gbnVsbCwgYTM6IGFueSA9IG51bGwsIGE0OiBhbnkgPSBudWxsLCBhNTogYW55ID0gbnVsbCkgPT4ge1xuICAgICAgdGhpcy5sb2dJdGVtcy5wdXNoKHZhbHVlKTtcbiAgICB9O1xuICB9XG5cbiAgY2xlYXIoKTogdm9pZCB7XG4gICAgdGhpcy5sb2dJdGVtcyA9IFtdO1xuICB9XG5cbiAgcmVzdWx0KCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMubG9nSXRlbXMuam9pbignOyAnKTtcbiAgfVxufVxuIl19