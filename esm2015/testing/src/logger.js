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
export class Log {
    constructor() { this.logItems = []; }
    /**
     * @param {?} value
     * @return {?}
     */
    add(value /** TODO #9100 */) { this.logItems.push(value); }
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
    clear() { this.logItems = []; }
    /**
     * @return {?}
     */
    result() { return this.logItems.join('; '); }
}
Log.decorators = [
    { type: Injectable },
];
/** @nocollapse */
Log.ctorParameters = () => [];
/** @nocollapse */ Log.ɵfac = function Log_Factory(t) { return new (t || Log)(); };
/** @nocollapse */ Log.ɵprov = i0.ɵɵdefineInjectable({ token: Log, factory: Log.ɵfac });
/*@__PURE__*/ (function () { i0.ɵsetClassMetadata(Log, [{
        type: Injectable
    }], function () { return []; }, null); })();
if (false) {
    /** @type {?} */
    Log.prototype.logItems;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9nZ2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS90ZXN0aW5nL3NyYy9sb2dnZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFRQSxPQUFPLEVBQUMsVUFBVSxFQUFDLE1BQU0sZUFBZSxDQUFDOzs7Ozs7Ozs7QUFHekMsTUFBTSxPQUFPLEdBQUc7SUFHZCxnQkFBZ0IsSUFBSSxDQUFDLFFBQVEsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDOzs7OztJQUVyQyxHQUFHLENBQUMsS0FBVSxDQUFDLGlCQUFpQixJQUFVLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQzs7Ozs7SUFFdEUsRUFBRSxDQUFDLEtBQVUsQ0FBQyxpQkFBaUI7UUFDN0I7Ozs7Ozs7O1FBQU8sQ0FBQyxLQUFVLElBQUksRUFBRSxLQUFVLElBQUksRUFBRSxLQUFVLElBQUksRUFBRSxLQUFVLElBQUksRUFBRSxLQUFVLElBQUksRUFBRSxFQUFFO1lBQ3hGLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQzVCLENBQUMsRUFBQztJQUNKLENBQUM7Ozs7SUFFRCxLQUFLLEtBQVcsSUFBSSxDQUFDLFFBQVEsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDOzs7O0lBRXJDLE1BQU0sS0FBYSxPQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQzs7O1lBaEJ0RCxVQUFVOzs7O3NEQUNFLEdBQUc7MkNBQUgsR0FBRyxXQUFILEdBQUc7a0RBQUgsR0FBRztjQURmLFVBQVU7Ozs7SUFFVCx1QkFBZ0IiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7SW5qZWN0YWJsZX0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5cbkBJbmplY3RhYmxlKClcbmV4cG9ydCBjbGFzcyBMb2cge1xuICBsb2dJdGVtczogYW55W107XG5cbiAgY29uc3RydWN0b3IoKSB7IHRoaXMubG9nSXRlbXMgPSBbXTsgfVxuXG4gIGFkZCh2YWx1ZTogYW55IC8qKiBUT0RPICM5MTAwICovKTogdm9pZCB7IHRoaXMubG9nSXRlbXMucHVzaCh2YWx1ZSk7IH1cblxuICBmbih2YWx1ZTogYW55IC8qKiBUT0RPICM5MTAwICovKSB7XG4gICAgcmV0dXJuIChhMTogYW55ID0gbnVsbCwgYTI6IGFueSA9IG51bGwsIGEzOiBhbnkgPSBudWxsLCBhNDogYW55ID0gbnVsbCwgYTU6IGFueSA9IG51bGwpID0+IHtcbiAgICAgIHRoaXMubG9nSXRlbXMucHVzaCh2YWx1ZSk7XG4gICAgfTtcbiAgfVxuXG4gIGNsZWFyKCk6IHZvaWQgeyB0aGlzLmxvZ0l0ZW1zID0gW107IH1cblxuICByZXN1bHQoKTogc3RyaW5nIHsgcmV0dXJuIHRoaXMubG9nSXRlbXMuam9pbignOyAnKTsgfVxufVxuIl19