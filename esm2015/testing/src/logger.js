/**
 * @fileoverview added by tsickle
 * Generated from: packages/core/testing/src/logger.ts
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
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
        /**
         * @param {?} value
         * @return {?}
         */
        add(value /** TODO #9100 */) {
            this.logItems.push(value);
        }
        /**
         * @param {?} value
         * @return {?}
         */
        fn(value /** TODO #9100 */) {
            return (/**
             * @param {?=} a1
             * @param {?=} a2
             * @param {?=} a3
             * @param {?=} a4
             * @param {?=} a5
             * @return {?}
             */
            (a1 = null, a2 = null, a3 = null, a4 = null, a5 = null) => {
                this.logItems.push(value);
            });
        }
        /**
         * @return {?}
         */
        clear() {
            this.logItems = [];
        }
        /**
         * @return {?}
         */
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
if (false) {
    /** @type {?} */
    Log.prototype.logItems;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9nZ2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS90ZXN0aW5nL3NyYy9sb2dnZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUFDLFVBQVUsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUV6QztJQUFBLE1BQ2EsR0FBRztRQUdkO1lBQ0UsSUFBSSxDQUFDLFFBQVEsR0FBRyxFQUFFLENBQUM7UUFDckIsQ0FBQzs7Ozs7UUFFRCxHQUFHLENBQUMsS0FBVSxDQUFDLGlCQUFpQjtZQUM5QixJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUM1QixDQUFDOzs7OztRQUVELEVBQUUsQ0FBQyxLQUFVLENBQUMsaUJBQWlCO1lBQzdCOzs7Ozs7OztZQUFPLENBQUMsS0FBVSxJQUFJLEVBQUUsS0FBVSxJQUFJLEVBQUUsS0FBVSxJQUFJLEVBQUUsS0FBVSxJQUFJLEVBQUUsS0FBVSxJQUFJLEVBQUUsRUFBRTtnQkFDeEYsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDNUIsQ0FBQyxFQUFDO1FBQ0osQ0FBQzs7OztRQUVELEtBQUs7WUFDSCxJQUFJLENBQUMsUUFBUSxHQUFHLEVBQUUsQ0FBQztRQUNyQixDQUFDOzs7O1FBRUQsTUFBTTtZQUNKLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDbEMsQ0FBQzs7O2dCQXhCRixVQUFVOzs7O0lBeUJYLFVBQUM7S0FBQTtTQXhCWSxHQUFHOzs7SUFDZCx1QkFBZ0IiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7SW5qZWN0YWJsZX0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5cbkBJbmplY3RhYmxlKClcbmV4cG9ydCBjbGFzcyBMb2cge1xuICBsb2dJdGVtczogYW55W107XG5cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgdGhpcy5sb2dJdGVtcyA9IFtdO1xuICB9XG5cbiAgYWRkKHZhbHVlOiBhbnkgLyoqIFRPRE8gIzkxMDAgKi8pOiB2b2lkIHtcbiAgICB0aGlzLmxvZ0l0ZW1zLnB1c2godmFsdWUpO1xuICB9XG5cbiAgZm4odmFsdWU6IGFueSAvKiogVE9ETyAjOTEwMCAqLykge1xuICAgIHJldHVybiAoYTE6IGFueSA9IG51bGwsIGEyOiBhbnkgPSBudWxsLCBhMzogYW55ID0gbnVsbCwgYTQ6IGFueSA9IG51bGwsIGE1OiBhbnkgPSBudWxsKSA9PiB7XG4gICAgICB0aGlzLmxvZ0l0ZW1zLnB1c2godmFsdWUpO1xuICAgIH07XG4gIH1cblxuICBjbGVhcigpOiB2b2lkIHtcbiAgICB0aGlzLmxvZ0l0ZW1zID0gW107XG4gIH1cblxuICByZXN1bHQoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy5sb2dJdGVtcy5qb2luKCc7ICcpO1xuICB9XG59XG4iXX0=