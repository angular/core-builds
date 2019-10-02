/**
 * @fileoverview added by tsickle
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
export class Console {
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
/** @nocollapse */ Console.ngFactoryDef = function Console_Factory(t) { return new (t || Console)(); };
/** @nocollapse */ Console.ngInjectableDef = i0.ɵɵdefineInjectable({ token: Console, factory: function (t) { return Console.ngFactoryDef(t); }, providedIn: null });
/*@__PURE__*/ i0.setClassMetadata(Console, [{
        type: Injectable
    }], null, null);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uc29sZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL2NvbnNvbGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7OztBQVFBLE9BQU8sRUFBQyxVQUFVLEVBQUMsTUFBTSxNQUFNLENBQUM7Ozs7Ozs7OztBQUdoQyxNQUFNLE9BQU8sT0FBTzs7Ozs7SUFDbEIsR0FBRyxDQUFDLE9BQWU7UUFDakIsc0NBQXNDO1FBQ3RDLE9BQU8sQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDdkIsQ0FBQzs7Ozs7O0lBRUQsSUFBSSxDQUFDLE9BQWU7UUFDbEIsc0NBQXNDO1FBQ3RDLE9BQU8sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDeEIsQ0FBQzs7O1lBVkYsVUFBVTs7c0VBQ0UsT0FBTzt5REFBUCxPQUFPLGlDQUFQLE9BQU87a0NBQVAsT0FBTztjQURuQixVQUFVIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0luamVjdGFibGV9IGZyb20gJy4vZGknO1xuXG5ASW5qZWN0YWJsZSgpXG5leHBvcnQgY2xhc3MgQ29uc29sZSB7XG4gIGxvZyhtZXNzYWdlOiBzdHJpbmcpOiB2b2lkIHtcbiAgICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6bm8tY29uc29sZVxuICAgIGNvbnNvbGUubG9nKG1lc3NhZ2UpO1xuICB9XG4gIC8vIE5vdGU6IGZvciByZXBvcnRpbmcgZXJyb3JzIHVzZSBgRE9NLmxvZ0Vycm9yKClgIGFzIGl0IGlzIHBsYXRmb3JtIHNwZWNpZmljXG4gIHdhcm4obWVzc2FnZTogc3RyaW5nKTogdm9pZCB7XG4gICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOm5vLWNvbnNvbGVcbiAgICBjb25zb2xlLndhcm4obWVzc2FnZSk7XG4gIH1cbn1cbiJdfQ==