/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Injectable } from '@angular/core';
let Log = /** @class */ (() => {
    class Log {
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
    }
    Log.decorators = [
        { type: Injectable }
    ];
    /** @nocollapse */
    Log.ctorParameters = () => [];
    return Log;
})();
export { Log };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9nZ2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS90ZXN0aW5nL3NyYy9sb2dnZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLFVBQVUsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUV6QztJQUFBLE1BQ2EsR0FBRztRQUdkO1lBQ0UsSUFBSSxDQUFDLFFBQVEsR0FBRyxFQUFFLENBQUM7UUFDckIsQ0FBQztRQUVELEdBQUcsQ0FBQyxLQUFVLENBQUMsaUJBQWlCO1lBQzlCLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQzVCLENBQUM7UUFFRCxFQUFFLENBQUMsS0FBVSxDQUFDLGlCQUFpQjtZQUM3QixPQUFPLENBQUMsS0FBVSxJQUFJLEVBQUUsS0FBVSxJQUFJLEVBQUUsS0FBVSxJQUFJLEVBQUUsS0FBVSxJQUFJLEVBQUUsS0FBVSxJQUFJLEVBQUUsRUFBRTtnQkFDeEYsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDNUIsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVELEtBQUs7WUFDSCxJQUFJLENBQUMsUUFBUSxHQUFHLEVBQUUsQ0FBQztRQUNyQixDQUFDO1FBRUQsTUFBTTtZQUNKLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDbEMsQ0FBQzs7O2dCQXhCRixVQUFVOzs7O0lBeUJYLFVBQUM7S0FBQTtTQXhCWSxHQUFHIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7SW5qZWN0YWJsZX0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5cbkBJbmplY3RhYmxlKClcbmV4cG9ydCBjbGFzcyBMb2cge1xuICBsb2dJdGVtczogYW55W107XG5cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgdGhpcy5sb2dJdGVtcyA9IFtdO1xuICB9XG5cbiAgYWRkKHZhbHVlOiBhbnkgLyoqIFRPRE8gIzkxMDAgKi8pOiB2b2lkIHtcbiAgICB0aGlzLmxvZ0l0ZW1zLnB1c2godmFsdWUpO1xuICB9XG5cbiAgZm4odmFsdWU6IGFueSAvKiogVE9ETyAjOTEwMCAqLykge1xuICAgIHJldHVybiAoYTE6IGFueSA9IG51bGwsIGEyOiBhbnkgPSBudWxsLCBhMzogYW55ID0gbnVsbCwgYTQ6IGFueSA9IG51bGwsIGE1OiBhbnkgPSBudWxsKSA9PiB7XG4gICAgICB0aGlzLmxvZ0l0ZW1zLnB1c2godmFsdWUpO1xuICAgIH07XG4gIH1cblxuICBjbGVhcigpOiB2b2lkIHtcbiAgICB0aGlzLmxvZ0l0ZW1zID0gW107XG4gIH1cblxuICByZXN1bHQoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy5sb2dJdGVtcy5qb2luKCc7ICcpO1xuICB9XG59XG4iXX0=