/**
 * @fileoverview added by tsickle
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
 * A function that will be executed when an application is initialized.
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
export class ApplicationInitStatus {
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
        Promise.all(asyncInitPromises).then((/**
         * @return {?}
         */
        () => { complete(); })).catch((/**
         * @param {?} e
         * @return {?}
         */
        e => { this.reject(e); }));
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
/** @nocollapse */ ApplicationInitStatus.ɵprov = i0.ɵɵdefineInjectable({ token: ApplicationInitStatus, factory: function (t) { return ApplicationInitStatus.ɵfac(t); }, providedIn: null });
/*@__PURE__*/ i0.setClassMetadata(ApplicationInitStatus, [{
        type: Injectable
    }], function () { return [{ type: undefined, decorators: [{
                type: Inject,
                args: [APP_INITIALIZER]
            }, {
                type: Optional
            }] }]; }, null);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwbGljYXRpb25faW5pdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL2FwcGxpY2F0aW9uX2luaXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7OztBQVFBLE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxrQkFBa0IsQ0FBQztBQUUzQyxPQUFPLEVBQUMsTUFBTSxFQUFFLFVBQVUsRUFBRSxjQUFjLEVBQUUsUUFBUSxFQUFDLE1BQU0sTUFBTSxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7QUFRbEUsTUFBTSxPQUFPLGVBQWUsR0FBRyxJQUFJLGNBQWMsQ0FBb0IseUJBQXlCLENBQUM7Ozs7OztBQVEvRixNQUFNLE9BQU8scUJBQXFCOzs7O0lBU2hDLFlBQXlELFFBQXVCO1FBQXZCLGFBQVEsR0FBUixRQUFRLENBQWU7UUFKeEUsZ0JBQVcsR0FBRyxLQUFLLENBQUM7UUFFWixTQUFJLEdBQUcsS0FBSyxDQUFDO1FBRzNCLElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxPQUFPOzs7OztRQUFDLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxFQUFFO1lBQzFDLElBQUksQ0FBQyxPQUFPLEdBQUcsR0FBRyxDQUFDO1lBQ25CLElBQUksQ0FBQyxNQUFNLEdBQUcsR0FBRyxDQUFDO1FBQ3BCLENBQUMsRUFBQyxDQUFDO0lBQ0wsQ0FBQzs7Ozs7SUFHRCxlQUFlO1FBQ2IsSUFBSSxJQUFJLENBQUMsV0FBVyxFQUFFO1lBQ3BCLE9BQU87U0FDUjs7Y0FFSyxpQkFBaUIsR0FBbUIsRUFBRTs7Y0FFdEMsUUFBUTs7O1FBQUcsR0FBRyxFQUFFO1lBQ3BCLENBQUMsbUJBQUEsSUFBSSxFQUFrQixDQUFDLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztZQUNyQyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDakIsQ0FBQyxDQUFBO1FBRUQsSUFBSSxJQUFJLENBQUMsUUFBUSxFQUFFO1lBQ2pCLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTs7c0JBQ3ZDLFVBQVUsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxFQUFFO2dCQUNyQyxJQUFJLFNBQVMsQ0FBQyxVQUFVLENBQUMsRUFBRTtvQkFDekIsaUJBQWlCLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO2lCQUNwQzthQUNGO1NBQ0Y7UUFFRCxPQUFPLENBQUMsR0FBRyxDQUFDLGlCQUFpQixDQUFDLENBQUMsSUFBSTs7O1FBQUMsR0FBRyxFQUFFLEdBQUcsUUFBUSxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxLQUFLOzs7O1FBQUMsQ0FBQyxDQUFDLEVBQUUsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUM7UUFFM0YsSUFBSSxpQkFBaUIsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFO1lBQ2xDLFFBQVEsRUFBRSxDQUFDO1NBQ1o7UUFDRCxJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQztJQUMxQixDQUFDOzs7WUE3Q0YsVUFBVTs7Ozt3Q0FVSSxNQUFNLFNBQUMsZUFBZSxjQUFHLFFBQVE7OzBGQVRuQyxxQkFBcUIsY0FTWixlQUFlOzZEQVR4QixxQkFBcUIsaUNBQXJCLHFCQUFxQjtrQ0FBckIscUJBQXFCO2NBRGpDLFVBQVU7O3NCQVVJLE1BQU07dUJBQUMsZUFBZTs7c0JBQUcsUUFBUTs7Ozs7OztJQVA5Qyx3Q0FBNEI7Ozs7O0lBRTVCLHVDQUEyQjs7Ozs7SUFDM0IsNENBQTRCOztJQUM1Qiw0Q0FBMEM7O0lBQzFDLHFDQUE2Qjs7Ozs7SUFFakIseUNBQW9FIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge2lzUHJvbWlzZX0gZnJvbSAnLi4vc3JjL3V0aWwvbGFuZyc7XG5cbmltcG9ydCB7SW5qZWN0LCBJbmplY3RhYmxlLCBJbmplY3Rpb25Ub2tlbiwgT3B0aW9uYWx9IGZyb20gJy4vZGknO1xuXG5cbi8qKlxuICogQSBmdW5jdGlvbiB0aGF0IHdpbGwgYmUgZXhlY3V0ZWQgd2hlbiBhbiBhcHBsaWNhdGlvbiBpcyBpbml0aWFsaXplZC5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBjb25zdCBBUFBfSU5JVElBTElaRVIgPSBuZXcgSW5qZWN0aW9uVG9rZW48QXJyYXk8KCkgPT4gdm9pZD4+KCdBcHBsaWNhdGlvbiBJbml0aWFsaXplcicpO1xuXG4vKipcbiAqIEEgY2xhc3MgdGhhdCByZWZsZWN0cyB0aGUgc3RhdGUgb2YgcnVubmluZyB7QGxpbmsgQVBQX0lOSVRJQUxJWkVSfXMuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5ASW5qZWN0YWJsZSgpXG5leHBvcnQgY2xhc3MgQXBwbGljYXRpb25Jbml0U3RhdHVzIHtcbiAgLy8gVE9ETyhpc3N1ZS8yNDU3MSk6IHJlbW92ZSAnIScuXG4gIHByaXZhdGUgcmVzb2x2ZSAhOiBGdW5jdGlvbjtcbiAgLy8gVE9ETyhpc3N1ZS8yNDU3MSk6IHJlbW92ZSAnIScuXG4gIHByaXZhdGUgcmVqZWN0ICE6IEZ1bmN0aW9uO1xuICBwcml2YXRlIGluaXRpYWxpemVkID0gZmFsc2U7XG4gIHB1YmxpYyByZWFkb25seSBkb25lUHJvbWlzZTogUHJvbWlzZTxhbnk+O1xuICBwdWJsaWMgcmVhZG9ubHkgZG9uZSA9IGZhbHNlO1xuXG4gIGNvbnN0cnVjdG9yKEBJbmplY3QoQVBQX0lOSVRJQUxJWkVSKSBAT3B0aW9uYWwoKSBwcml2YXRlIGFwcEluaXRzOiAoKCkgPT4gYW55KVtdKSB7XG4gICAgdGhpcy5kb25lUHJvbWlzZSA9IG5ldyBQcm9taXNlKChyZXMsIHJlaikgPT4ge1xuICAgICAgdGhpcy5yZXNvbHZlID0gcmVzO1xuICAgICAgdGhpcy5yZWplY3QgPSByZWo7XG4gICAgfSk7XG4gIH1cblxuICAvKiogQGludGVybmFsICovXG4gIHJ1bkluaXRpYWxpemVycygpIHtcbiAgICBpZiAodGhpcy5pbml0aWFsaXplZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGFzeW5jSW5pdFByb21pc2VzOiBQcm9taXNlPGFueT5bXSA9IFtdO1xuXG4gICAgY29uc3QgY29tcGxldGUgPSAoKSA9PiB7XG4gICAgICAodGhpcyBhc3tkb25lOiBib29sZWFufSkuZG9uZSA9IHRydWU7XG4gICAgICB0aGlzLnJlc29sdmUoKTtcbiAgICB9O1xuXG4gICAgaWYgKHRoaXMuYXBwSW5pdHMpIHtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5hcHBJbml0cy5sZW5ndGg7IGkrKykge1xuICAgICAgICBjb25zdCBpbml0UmVzdWx0ID0gdGhpcy5hcHBJbml0c1tpXSgpO1xuICAgICAgICBpZiAoaXNQcm9taXNlKGluaXRSZXN1bHQpKSB7XG4gICAgICAgICAgYXN5bmNJbml0UHJvbWlzZXMucHVzaChpbml0UmVzdWx0KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIFByb21pc2UuYWxsKGFzeW5jSW5pdFByb21pc2VzKS50aGVuKCgpID0+IHsgY29tcGxldGUoKTsgfSkuY2F0Y2goZSA9PiB7IHRoaXMucmVqZWN0KGUpOyB9KTtcblxuICAgIGlmIChhc3luY0luaXRQcm9taXNlcy5sZW5ndGggPT09IDApIHtcbiAgICAgIGNvbXBsZXRlKCk7XG4gICAgfVxuICAgIHRoaXMuaW5pdGlhbGl6ZWQgPSB0cnVlO1xuICB9XG59XG4iXX0=