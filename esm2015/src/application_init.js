/**
 * @fileoverview added by tsickle
 * Generated from: packages/core/src/application_init.ts
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
import { isPromise } from '../src/util/lang';
import { Inject, Injectable, InjectionToken, Optional } from './di';
import * as i0 from "./r3_symbols";
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/**
 * An injection token that allows you to provide one or more initialization functions.
 * These function are injected at application startup and executed during
 * app initialization. If any of these functions returns a Promise, initialization
 * does not complete until the Promise is resolved.
 *
 * You can, for example, create a factory function that loads language data
 * or an external configuration, and provide that function to the `APP_INITIALIZER` token.
 * That way, the function is executed during the application bootstrap process,
 * and the needed data is available on startup.
 *
 * \@publicApi
 * @type {?}
 */
export const APP_INITIALIZER = new InjectionToken('Application Initializer');
/**
 * A class that reflects the state of running {\@link APP_INITIALIZER}s.
 *
 * \@publicApi
 */
let ApplicationInitStatus = /** @class */ (() => {
    /**
     * A class that reflects the state of running {\@link APP_INITIALIZER}s.
     *
     * \@publicApi
     */
    class ApplicationInitStatus {
        /**
         * @param {?} appInits
         */
        constructor(appInits) {
            this.appInits = appInits;
            this.initialized = false;
            this.done = false;
            this.donePromise = new Promise((/**
             * @param {?} res
             * @param {?} rej
             * @return {?}
             */
            (res, rej) => {
                this.resolve = res;
                this.reject = rej;
            }));
        }
        /**
         * \@internal
         * @return {?}
         */
        runInitializers() {
            if (this.initialized) {
                return;
            }
            /** @type {?} */
            const asyncInitPromises = [];
            /** @type {?} */
            const complete = (/**
             * @return {?}
             */
            () => {
                ((/** @type {?} */ (this))).done = true;
                this.resolve();
            });
            if (this.appInits) {
                for (let i = 0; i < this.appInits.length; i++) {
                    /** @type {?} */
                    const initResult = this.appInits[i]();
                    if (isPromise(initResult)) {
                        asyncInitPromises.push(initResult);
                    }
                }
            }
            Promise.all(asyncInitPromises)
                .then((/**
             * @return {?}
             */
            () => {
                complete();
            }))
                .catch((/**
             * @param {?} e
             * @return {?}
             */
            e => {
                this.reject(e);
            }));
            if (asyncInitPromises.length === 0) {
                complete();
            }
            this.initialized = true;
        }
    }
    ApplicationInitStatus.decorators = [
        { type: Injectable },
    ];
    /** @nocollapse */
    ApplicationInitStatus.ctorParameters = () => [
        { type: Array, decorators: [{ type: Inject, args: [APP_INITIALIZER,] }, { type: Optional }] }
    ];
    /** @nocollapse */ ApplicationInitStatus.ɵfac = function ApplicationInitStatus_Factory(t) { return new (t || ApplicationInitStatus)(i0.ɵɵinject(APP_INITIALIZER, 8)); };
    /** @nocollapse */ ApplicationInitStatus.ɵprov = i0.ɵɵdefineInjectable({ token: ApplicationInitStatus, factory: ApplicationInitStatus.ɵfac });
    return ApplicationInitStatus;
})();
export { ApplicationInitStatus };
/*@__PURE__*/ (function () { i0.setClassMetadata(ApplicationInitStatus, [{
        type: Injectable
    }], function () { return [{ type: undefined, decorators: [{
                type: Inject,
                args: [APP_INITIALIZER]
            }, {
                type: Optional
            }] }]; }, null); })();
if (false) {
    /**
     * @type {?}
     * @private
     */
    ApplicationInitStatus.prototype.resolve;
    /**
     * @type {?}
     * @private
     */
    ApplicationInitStatus.prototype.reject;
    /**
     * @type {?}
     * @private
     */
    ApplicationInitStatus.prototype.initialized;
    /** @type {?} */
    ApplicationInitStatus.prototype.donePromise;
    /** @type {?} */
    ApplicationInitStatus.prototype.done;
    /**
     * @type {?}
     * @private
     */
    ApplicationInitStatus.prototype.appInits;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwbGljYXRpb25faW5pdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL2FwcGxpY2F0aW9uX2luaXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFRQSxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sa0JBQWtCLENBQUM7QUFFM0MsT0FBTyxFQUFDLE1BQU0sRUFBRSxVQUFVLEVBQUUsY0FBYyxFQUFFLFFBQVEsRUFBQyxNQUFNLE1BQU0sQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFnQmxFLE1BQU0sT0FBTyxlQUFlLEdBQUcsSUFBSSxjQUFjLENBQW9CLHlCQUF5QixDQUFDOzs7Ozs7QUFPL0Y7Ozs7OztJQUFBLE1BQ2EscUJBQXFCOzs7O1FBU2hDLFlBQXlELFFBQXVCO1lBQXZCLGFBQVEsR0FBUixRQUFRLENBQWU7WUFKeEUsZ0JBQVcsR0FBRyxLQUFLLENBQUM7WUFFWixTQUFJLEdBQUcsS0FBSyxDQUFDO1lBRzNCLElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxPQUFPOzs7OztZQUFDLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxFQUFFO2dCQUMxQyxJQUFJLENBQUMsT0FBTyxHQUFHLEdBQUcsQ0FBQztnQkFDbkIsSUFBSSxDQUFDLE1BQU0sR0FBRyxHQUFHLENBQUM7WUFDcEIsQ0FBQyxFQUFDLENBQUM7UUFDTCxDQUFDOzs7OztRQUdELGVBQWU7WUFDYixJQUFJLElBQUksQ0FBQyxXQUFXLEVBQUU7Z0JBQ3BCLE9BQU87YUFDUjs7a0JBRUssaUJBQWlCLEdBQW1CLEVBQUU7O2tCQUV0QyxRQUFROzs7WUFBRyxHQUFHLEVBQUU7Z0JBQ3BCLENBQUMsbUJBQUEsSUFBSSxFQUFtQixDQUFDLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztnQkFDdEMsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ2pCLENBQUMsQ0FBQTtZQUVELElBQUksSUFBSSxDQUFDLFFBQVEsRUFBRTtnQkFDakIsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFOzswQkFDdkMsVUFBVSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLEVBQUU7b0JBQ3JDLElBQUksU0FBUyxDQUFDLFVBQVUsQ0FBQyxFQUFFO3dCQUN6QixpQkFBaUIsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7cUJBQ3BDO2lCQUNGO2FBQ0Y7WUFFRCxPQUFPLENBQUMsR0FBRyxDQUFDLGlCQUFpQixDQUFDO2lCQUN6QixJQUFJOzs7WUFBQyxHQUFHLEVBQUU7Z0JBQ1QsUUFBUSxFQUFFLENBQUM7WUFDYixDQUFDLEVBQUM7aUJBQ0QsS0FBSzs7OztZQUFDLENBQUMsQ0FBQyxFQUFFO2dCQUNULElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDakIsQ0FBQyxFQUFDLENBQUM7WUFFUCxJQUFJLGlCQUFpQixDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUU7Z0JBQ2xDLFFBQVEsRUFBRSxDQUFDO2FBQ1o7WUFDRCxJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQztRQUMxQixDQUFDOzs7Z0JBbkRGLFVBQVU7Ozs7NENBVUksTUFBTSxTQUFDLGVBQWUsY0FBRyxRQUFROztpSEFUbkMscUJBQXFCLGNBU1osZUFBZTtvRkFUeEIscUJBQXFCLFdBQXJCLHFCQUFxQjtnQ0FsQ2xDO0tBcUZDO1NBbkRZLHFCQUFxQjtpREFBckIscUJBQXFCO2NBRGpDLFVBQVU7O3NCQVVJLE1BQU07dUJBQUMsZUFBZTs7c0JBQUcsUUFBUTs7Ozs7OztJQVA5Qyx3Q0FBMkI7Ozs7O0lBRTNCLHVDQUEwQjs7Ozs7SUFDMUIsNENBQTRCOztJQUM1Qiw0Q0FBMEM7O0lBQzFDLHFDQUE2Qjs7Ozs7SUFFakIseUNBQW9FIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge2lzUHJvbWlzZX0gZnJvbSAnLi4vc3JjL3V0aWwvbGFuZyc7XG5cbmltcG9ydCB7SW5qZWN0LCBJbmplY3RhYmxlLCBJbmplY3Rpb25Ub2tlbiwgT3B0aW9uYWx9IGZyb20gJy4vZGknO1xuXG5cbi8qKlxuICogQW4gaW5qZWN0aW9uIHRva2VuIHRoYXQgYWxsb3dzIHlvdSB0byBwcm92aWRlIG9uZSBvciBtb3JlIGluaXRpYWxpemF0aW9uIGZ1bmN0aW9ucy5cbiAqIFRoZXNlIGZ1bmN0aW9uIGFyZSBpbmplY3RlZCBhdCBhcHBsaWNhdGlvbiBzdGFydHVwIGFuZCBleGVjdXRlZCBkdXJpbmdcbiAqIGFwcCBpbml0aWFsaXphdGlvbi4gSWYgYW55IG9mIHRoZXNlIGZ1bmN0aW9ucyByZXR1cm5zIGEgUHJvbWlzZSwgaW5pdGlhbGl6YXRpb25cbiAqIGRvZXMgbm90IGNvbXBsZXRlIHVudGlsIHRoZSBQcm9taXNlIGlzIHJlc29sdmVkLlxuICpcbiAqIFlvdSBjYW4sIGZvciBleGFtcGxlLCBjcmVhdGUgYSBmYWN0b3J5IGZ1bmN0aW9uIHRoYXQgbG9hZHMgbGFuZ3VhZ2UgZGF0YVxuICogb3IgYW4gZXh0ZXJuYWwgY29uZmlndXJhdGlvbiwgYW5kIHByb3ZpZGUgdGhhdCBmdW5jdGlvbiB0byB0aGUgYEFQUF9JTklUSUFMSVpFUmAgdG9rZW4uXG4gKiBUaGF0IHdheSwgdGhlIGZ1bmN0aW9uIGlzIGV4ZWN1dGVkIGR1cmluZyB0aGUgYXBwbGljYXRpb24gYm9vdHN0cmFwIHByb2Nlc3MsXG4gKiBhbmQgdGhlIG5lZWRlZCBkYXRhIGlzIGF2YWlsYWJsZSBvbiBzdGFydHVwLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGNvbnN0IEFQUF9JTklUSUFMSVpFUiA9IG5ldyBJbmplY3Rpb25Ub2tlbjxBcnJheTwoKSA9PiB2b2lkPj4oJ0FwcGxpY2F0aW9uIEluaXRpYWxpemVyJyk7XG5cbi8qKlxuICogQSBjbGFzcyB0aGF0IHJlZmxlY3RzIHRoZSBzdGF0ZSBvZiBydW5uaW5nIHtAbGluayBBUFBfSU5JVElBTElaRVJ9cy5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbkBJbmplY3RhYmxlKClcbmV4cG9ydCBjbGFzcyBBcHBsaWNhdGlvbkluaXRTdGF0dXMge1xuICAvLyBUT0RPKGlzc3VlLzI0NTcxKTogcmVtb3ZlICchJy5cbiAgcHJpdmF0ZSByZXNvbHZlITogRnVuY3Rpb247XG4gIC8vIFRPRE8oaXNzdWUvMjQ1NzEpOiByZW1vdmUgJyEnLlxuICBwcml2YXRlIHJlamVjdCE6IEZ1bmN0aW9uO1xuICBwcml2YXRlIGluaXRpYWxpemVkID0gZmFsc2U7XG4gIHB1YmxpYyByZWFkb25seSBkb25lUHJvbWlzZTogUHJvbWlzZTxhbnk+O1xuICBwdWJsaWMgcmVhZG9ubHkgZG9uZSA9IGZhbHNlO1xuXG4gIGNvbnN0cnVjdG9yKEBJbmplY3QoQVBQX0lOSVRJQUxJWkVSKSBAT3B0aW9uYWwoKSBwcml2YXRlIGFwcEluaXRzOiAoKCkgPT4gYW55KVtdKSB7XG4gICAgdGhpcy5kb25lUHJvbWlzZSA9IG5ldyBQcm9taXNlKChyZXMsIHJlaikgPT4ge1xuICAgICAgdGhpcy5yZXNvbHZlID0gcmVzO1xuICAgICAgdGhpcy5yZWplY3QgPSByZWo7XG4gICAgfSk7XG4gIH1cblxuICAvKiogQGludGVybmFsICovXG4gIHJ1bkluaXRpYWxpemVycygpIHtcbiAgICBpZiAodGhpcy5pbml0aWFsaXplZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGFzeW5jSW5pdFByb21pc2VzOiBQcm9taXNlPGFueT5bXSA9IFtdO1xuXG4gICAgY29uc3QgY29tcGxldGUgPSAoKSA9PiB7XG4gICAgICAodGhpcyBhcyB7ZG9uZTogYm9vbGVhbn0pLmRvbmUgPSB0cnVlO1xuICAgICAgdGhpcy5yZXNvbHZlKCk7XG4gICAgfTtcblxuICAgIGlmICh0aGlzLmFwcEluaXRzKSB7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuYXBwSW5pdHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3QgaW5pdFJlc3VsdCA9IHRoaXMuYXBwSW5pdHNbaV0oKTtcbiAgICAgICAgaWYgKGlzUHJvbWlzZShpbml0UmVzdWx0KSkge1xuICAgICAgICAgIGFzeW5jSW5pdFByb21pc2VzLnB1c2goaW5pdFJlc3VsdCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBQcm9taXNlLmFsbChhc3luY0luaXRQcm9taXNlcylcbiAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgIGNvbXBsZXRlKCk7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChlID0+IHtcbiAgICAgICAgICB0aGlzLnJlamVjdChlKTtcbiAgICAgICAgfSk7XG5cbiAgICBpZiAoYXN5bmNJbml0UHJvbWlzZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICBjb21wbGV0ZSgpO1xuICAgIH1cbiAgICB0aGlzLmluaXRpYWxpemVkID0gdHJ1ZTtcbiAgfVxufVxuIl19