/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { isPromise } from '../src/util/lang';
import { Inject, Injectable, InjectionToken, Optional } from './di';
/**
 * A function that will be executed when an application is initialized.
 * @experimental
 */
export const /** @type {?} */ APP_INITIALIZER = new InjectionToken('Application Initializer');
/**
 * A class that reflects the state of running {\@link APP_INITIALIZER}s.
 *
 * \@experimental
 */
export class ApplicationInitStatus {
    /**
     * @param {?} appInits
     */
    constructor(appInits) {
        this._done = false;
        const asyncInitPromises = [];
        if (appInits) {
            for (let i = 0; i < appInits.length; i++) {
                const initResult = appInits[i]();
                if (isPromise(initResult)) {
                    asyncInitPromises.push(initResult);
                }
            }
        }
        this._donePromise = Promise.all(asyncInitPromises).then(() => { this._done = true; });
        if (asyncInitPromises.length === 0) {
            this._done = true;
        }
    }
    /**
     * @return {?}
     */
    get done() { return this._done; }
    /**
     * @return {?}
     */
    get donePromise() { return this._donePromise; }
}
ApplicationInitStatus.decorators = [
    { type: Injectable },
];
/** @nocollapse */
ApplicationInitStatus.ctorParameters = () => [
    { type: Array, decorators: [{ type: Inject, args: [APP_INITIALIZER,] }, { type: Optional },] },
];
function ApplicationInitStatus_tsickle_Closure_declarations() {
    /** @type {?} */
    ApplicationInitStatus.decorators;
    /**
     * @nocollapse
     * @type {?}
     */
    ApplicationInitStatus.ctorParameters;
    /** @type {?} */
    ApplicationInitStatus.prototype._donePromise;
    /** @type {?} */
    ApplicationInitStatus.prototype._done;
}
//# sourceMappingURL=application_init.js.map