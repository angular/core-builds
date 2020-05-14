/**
 * @fileoverview added by tsickle
 * Generated from: packages/core/src/console.ts
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
import { Injectable } from './di';
import * as i0 from "./r3_symbols";
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
let Console = /** @class */ (() => {
    class Console {
        /**
         * @param {?} message
         * @return {?}
         */
        log(message) {
            // tslint:disable-next-line:no-console
            console.log(message);
        }
        // Note: for reporting errors use `DOM.logError()` as it is platform specific
        /**
         * @param {?} message
         * @return {?}
         */
        warn(message) {
            // tslint:disable-next-line:no-console
            console.warn(message);
        }
    }
    Console.decorators = [
        { type: Injectable },
    ];
    /** @nocollapse */ Console.ɵfac = function Console_Factory(t) { return new (t || Console)(); };
    /** @nocollapse */ Console.ɵprov = i0.ɵɵdefineInjectable({ token: Console, factory: Console.ɵfac });
    return Console;
})();
export { Console };
/*@__PURE__*/ (function () { i0.setClassMetadata(Console, [{
        type: Injectable
    }], null, null); })();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uc29sZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL2NvbnNvbGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFRQSxPQUFPLEVBQUMsVUFBVSxFQUFDLE1BQU0sTUFBTSxDQUFDOzs7Ozs7Ozs7QUFFaEM7SUFBQSxNQUNhLE9BQU87Ozs7O1FBQ2xCLEdBQUcsQ0FBQyxPQUFlO1lBQ2pCLHNDQUFzQztZQUN0QyxPQUFPLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ3ZCLENBQUM7Ozs7OztRQUVELElBQUksQ0FBQyxPQUFlO1lBQ2xCLHNDQUFzQztZQUN0QyxPQUFPLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ3hCLENBQUM7OztnQkFWRixVQUFVOztxRkFDRSxPQUFPO3NFQUFQLE9BQU8sV0FBUCxPQUFPO2tCQVhwQjtLQXFCQztTQVZZLE9BQU87aURBQVAsT0FBTztjQURuQixVQUFVIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0luamVjdGFibGV9IGZyb20gJy4vZGknO1xuXG5ASW5qZWN0YWJsZSgpXG5leHBvcnQgY2xhc3MgQ29uc29sZSB7XG4gIGxvZyhtZXNzYWdlOiBzdHJpbmcpOiB2b2lkIHtcbiAgICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6bm8tY29uc29sZVxuICAgIGNvbnNvbGUubG9nKG1lc3NhZ2UpO1xuICB9XG4gIC8vIE5vdGU6IGZvciByZXBvcnRpbmcgZXJyb3JzIHVzZSBgRE9NLmxvZ0Vycm9yKClgIGFzIGl0IGlzIHBsYXRmb3JtIHNwZWNpZmljXG4gIHdhcm4obWVzc2FnZTogc3RyaW5nKTogdm9pZCB7XG4gICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOm5vLWNvbnNvbGVcbiAgICBjb25zb2xlLndhcm4obWVzc2FnZSk7XG4gIH1cbn1cbiJdfQ==