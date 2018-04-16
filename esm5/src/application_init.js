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
import { isPromise } from '../src/util/lang';
import { Inject, Injectable, InjectionToken, Optional } from './di';
/**
 * A function that will be executed when an application is initialized.
 * \@experimental
 */
export var /** @type {?} */ APP_INITIALIZER = new InjectionToken('Application Initializer');
/**
 * A class that reflects the state of running {\@link APP_INITIALIZER}s.
 *
 * \@experimental
 */
var ApplicationInitStatus = /** @class */ (function () {
    function ApplicationInitStatus(appInits) {
        var _this = this;
        this.appInits = appInits;
        this.initialized = false;
        this.done = false;
        this.donePromise = new Promise(function (res, rej) {
            _this.resolve = res;
            _this.reject = rej;
        });
    }
    /** @internal */
    /**
     * \@internal
     * @return {?}
     */
    ApplicationInitStatus.prototype.runInitializers = /**
     * \@internal
     * @return {?}
     */
    function () {
        var _this = this;
        if (this.initialized) {
            return;
        }
        var /** @type {?} */ asyncInitPromises = [];
        var /** @type {?} */ complete = function () {
            (/** @type {?} */ (_this)).done = true;
            _this.resolve();
        };
        if (this.appInits) {
            for (var /** @type {?} */ i = 0; i < this.appInits.length; i++) {
                var /** @type {?} */ initResult = this.appInits[i]();
                if (isPromise(initResult)) {
                    asyncInitPromises.push(initResult);
                }
            }
        }
        Promise.all(asyncInitPromises).then(function () { complete(); }).catch(function (e) { _this.reject(e); });
        if (asyncInitPromises.length === 0) {
            complete();
        }
        this.initialized = true;
    };
    ApplicationInitStatus.decorators = [
        { type: Injectable },
    ];
    /** @nocollapse */
    ApplicationInitStatus.ctorParameters = function () { return [
        { type: Array, decorators: [{ type: Inject, args: [APP_INITIALIZER,] }, { type: Optional },] },
    ]; };
    return ApplicationInitStatus;
}());
export { ApplicationInitStatus };
function ApplicationInitStatus_tsickle_Closure_declarations() {
    /** @type {!Array<{type: !Function, args: (undefined|!Array<?>)}>} */
    ApplicationInitStatus.decorators;
    /**
     * @nocollapse
     * @type {function(): !Array<(null|{type: ?, decorators: (undefined|!Array<{type: !Function, args: (undefined|!Array<?>)}>)})>}
     */
    ApplicationInitStatus.ctorParameters;
    /** @type {?} */
    ApplicationInitStatus.prototype.resolve;
    /** @type {?} */
    ApplicationInitStatus.prototype.reject;
    /** @type {?} */
    ApplicationInitStatus.prototype.initialized;
    /** @type {?} */
    ApplicationInitStatus.prototype.donePromise;
    /** @type {?} */
    ApplicationInitStatus.prototype.done;
    /** @type {?} */
    ApplicationInitStatus.prototype.appInits;
}
//# sourceMappingURL=application_init.js.map