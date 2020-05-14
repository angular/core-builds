/**
 * @fileoverview added by tsickle
 * Generated from: packages/core/testing/src/logger.ts
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
import { Injectable } from '@angular/core';
import * as i0 from "@angular/core";
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
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
        { type: Injectable },
    ];
    /** @nocollapse */
    Log.ctorParameters = () => [];
    /** @nocollapse */ Log.ɵfac = function Log_Factory(t) { return new (t || Log)(); };
    /** @nocollapse */ Log.ɵprov = i0.ɵɵdefineInjectable({ token: Log, factory: Log.ɵfac });
    return Log;
})();
export { Log };
/*@__PURE__*/ (function () { i0.ɵsetClassMetadata(Log, [{
        type: Injectable
    }], function () { return []; }, null); })();
if (false) {
    /** @type {?} */
    Log.prototype.logItems;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9nZ2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS90ZXN0aW5nL3NyYy9sb2dnZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFRQSxPQUFPLEVBQUMsVUFBVSxFQUFDLE1BQU0sZUFBZSxDQUFDOzs7Ozs7Ozs7QUFFekM7SUFBQSxNQUNhLEdBQUc7UUFHZDtZQUNFLElBQUksQ0FBQyxRQUFRLEdBQUcsRUFBRSxDQUFDO1FBQ3JCLENBQUM7Ozs7O1FBRUQsR0FBRyxDQUFDLEtBQVUsQ0FBQyxpQkFBaUI7WUFDOUIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDNUIsQ0FBQzs7Ozs7UUFFRCxFQUFFLENBQUMsS0FBVSxDQUFDLGlCQUFpQjtZQUM3Qjs7Ozs7Ozs7WUFBTyxDQUFDLEtBQVUsSUFBSSxFQUFFLEtBQVUsSUFBSSxFQUFFLEtBQVUsSUFBSSxFQUFFLEtBQVUsSUFBSSxFQUFFLEtBQVUsSUFBSSxFQUFFLEVBQUU7Z0JBQ3hGLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQzVCLENBQUMsRUFBQztRQUNKLENBQUM7Ozs7UUFFRCxLQUFLO1lBQ0gsSUFBSSxDQUFDLFFBQVEsR0FBRyxFQUFFLENBQUM7UUFDckIsQ0FBQzs7OztRQUVELE1BQU07WUFDSixPQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ2xDLENBQUM7OztnQkF4QkYsVUFBVTs7Ozs2RUFDRSxHQUFHO2tFQUFILEdBQUcsV0FBSCxHQUFHO2NBWGhCO0tBbUNDO1NBeEJZLEdBQUc7a0RBQUgsR0FBRztjQURmLFVBQVU7Ozs7SUFFVCx1QkFBZ0IiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7SW5qZWN0YWJsZX0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5cbkBJbmplY3RhYmxlKClcbmV4cG9ydCBjbGFzcyBMb2cge1xuICBsb2dJdGVtczogYW55W107XG5cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgdGhpcy5sb2dJdGVtcyA9IFtdO1xuICB9XG5cbiAgYWRkKHZhbHVlOiBhbnkgLyoqIFRPRE8gIzkxMDAgKi8pOiB2b2lkIHtcbiAgICB0aGlzLmxvZ0l0ZW1zLnB1c2godmFsdWUpO1xuICB9XG5cbiAgZm4odmFsdWU6IGFueSAvKiogVE9ETyAjOTEwMCAqLykge1xuICAgIHJldHVybiAoYTE6IGFueSA9IG51bGwsIGEyOiBhbnkgPSBudWxsLCBhMzogYW55ID0gbnVsbCwgYTQ6IGFueSA9IG51bGwsIGE1OiBhbnkgPSBudWxsKSA9PiB7XG4gICAgICB0aGlzLmxvZ0l0ZW1zLnB1c2godmFsdWUpO1xuICAgIH07XG4gIH1cblxuICBjbGVhcigpOiB2b2lkIHtcbiAgICB0aGlzLmxvZ0l0ZW1zID0gW107XG4gIH1cblxuICByZXN1bHQoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy5sb2dJdGVtcy5qb2luKCc7ICcpO1xuICB9XG59XG4iXX0=