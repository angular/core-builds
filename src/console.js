/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Injectable } from './di';
import { print, warn } from './facade/lang';
export class Console {
    /**
     * @param {?} message
     * @return {?}
     */
    log(message) { print(message); }
    /**
     * @param {?} message
     * @return {?}
     */
    warn(message) { warn(message); }
}
Console.decorators = [
    { type: Injectable },
];
/** @nocollapse */
Console.ctorParameters = () => [];
function Console_tsickle_Closure_declarations() {
    /** @type {?} */
    Console.decorators;
    /**
     * @nocollapse
     * @type {?}
     */
    Console.ctorParameters;
}
//# sourceMappingURL=console.js.map