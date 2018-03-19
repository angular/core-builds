/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Injectable } from './di';
var Console = /** @class */ (function () {
    function Console() {
    }
    /**
     * @param {?} message
     * @return {?}
     */
    Console.prototype.log = /**
     * @param {?} message
     * @return {?}
     */
    function (message) {
        // tslint:disable-next-line:no-console
        console.log(message);
    };
    // Note: for reporting errors use `DOM.logError()` as it is platform specific
    /**
     * @param {?} message
     * @return {?}
     */
    Console.prototype.warn = /**
     * @param {?} message
     * @return {?}
     */
    function (message) {
        // tslint:disable-next-line:no-console
        console.warn(message);
    };
    Console.decorators = [
        { type: Injectable },
    ];
    /** @nocollapse */
    Console.ctorParameters = function () { return []; };
    return Console;
}());
export { Console };
function Console_tsickle_Closure_declarations() {
    /** @type {!Array<{type: !Function, args: (undefined|!Array<?>)}>} */
    Console.decorators;
    /**
     * @nocollapse
     * @type {function(): !Array<(null|{type: ?, decorators: (undefined|!Array<{type: !Function, args: (undefined|!Array<?>)}>)})>}
     */
    Console.ctorParameters;
}
//# sourceMappingURL=console.js.map