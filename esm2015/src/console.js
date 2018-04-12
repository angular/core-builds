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
export class Console {
    /**
     * @param {?} message
     * @return {?}
     */
    log(message) {
        // tslint:disable-next-line:no-console
        console.log(message);
    }
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
/** @nocollapse */
Console.ctorParameters = () => [];
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