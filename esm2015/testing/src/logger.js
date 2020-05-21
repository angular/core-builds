/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9nZ2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS90ZXN0aW5nL3NyYy9sb2dnZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOztBQUVILE9BQU8sRUFBQyxVQUFVLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFHekM7SUFBQSxJQUFhLEdBQUcsR0FBaEIsTUFBYSxHQUFHO1FBR2Q7WUFDRSxJQUFJLENBQUMsUUFBUSxHQUFHLEVBQUUsQ0FBQztRQUNyQixDQUFDO1FBRUQsR0FBRyxDQUFDLEtBQVUsQ0FBQyxpQkFBaUI7WUFDOUIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDNUIsQ0FBQztRQUVELEVBQUUsQ0FBQyxLQUFVLENBQUMsaUJBQWlCO1lBQzdCLE9BQU8sQ0FBQyxLQUFVLElBQUksRUFBRSxLQUFVLElBQUksRUFBRSxLQUFVLElBQUksRUFBRSxLQUFVLElBQUksRUFBRSxLQUFVLElBQUksRUFBRSxFQUFFO2dCQUN4RixJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUM1QixDQUFDLENBQUM7UUFDSixDQUFDO1FBRUQsS0FBSztZQUNILElBQUksQ0FBQyxRQUFRLEdBQUcsRUFBRSxDQUFDO1FBQ3JCLENBQUM7UUFFRCxNQUFNO1lBQ0osT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNsQyxDQUFDO0tBQ0YsQ0FBQTtJQXhCWSxHQUFHO1FBRGYsVUFBVSxFQUFFOztPQUNBLEdBQUcsQ0F3QmY7SUFBRCxVQUFDO0tBQUE7U0F4QlksR0FBRyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtJbmplY3RhYmxlfSBmcm9tICdAYW5ndWxhci9jb3JlJztcblxuQEluamVjdGFibGUoKVxuZXhwb3J0IGNsYXNzIExvZyB7XG4gIGxvZ0l0ZW1zOiBhbnlbXTtcblxuICBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLmxvZ0l0ZW1zID0gW107XG4gIH1cblxuICBhZGQodmFsdWU6IGFueSAvKiogVE9ETyAjOTEwMCAqLyk6IHZvaWQge1xuICAgIHRoaXMubG9nSXRlbXMucHVzaCh2YWx1ZSk7XG4gIH1cblxuICBmbih2YWx1ZTogYW55IC8qKiBUT0RPICM5MTAwICovKSB7XG4gICAgcmV0dXJuIChhMTogYW55ID0gbnVsbCwgYTI6IGFueSA9IG51bGwsIGEzOiBhbnkgPSBudWxsLCBhNDogYW55ID0gbnVsbCwgYTU6IGFueSA9IG51bGwpID0+IHtcbiAgICAgIHRoaXMubG9nSXRlbXMucHVzaCh2YWx1ZSk7XG4gICAgfTtcbiAgfVxuXG4gIGNsZWFyKCk6IHZvaWQge1xuICAgIHRoaXMubG9nSXRlbXMgPSBbXTtcbiAgfVxuXG4gIHJlc3VsdCgpOiBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLmxvZ0l0ZW1zLmpvaW4oJzsgJyk7XG4gIH1cbn1cbiJdfQ==