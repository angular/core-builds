/**
 * @fileoverview added by tsickle
 * Generated from: packages/core/src/application_init.ts
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
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
    { type: Injectable }
];
/** @nocollapse */
ApplicationInitStatus.ctorParameters = () => [
    { type: Array, decorators: [{ type: Inject, args: [APP_INITIALIZER,] }, { type: Optional }] }
];
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwbGljYXRpb25faW5pdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL2FwcGxpY2F0aW9uX2luaXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLGtCQUFrQixDQUFDO0FBRTNDLE9BQU8sRUFBQyxNQUFNLEVBQUUsVUFBVSxFQUFFLGNBQWMsRUFBRSxRQUFRLEVBQUMsTUFBTSxNQUFNLENBQUM7Ozs7Ozs7QUFRbEUsTUFBTSxPQUFPLGVBQWUsR0FBRyxJQUFJLGNBQWMsQ0FBb0IseUJBQXlCLENBQUM7Ozs7OztBQVEvRixNQUFNLE9BQU8scUJBQXFCOzs7O0lBU2hDLFlBQXlELFFBQXVCO1FBQXZCLGFBQVEsR0FBUixRQUFRLENBQWU7UUFKeEUsZ0JBQVcsR0FBRyxLQUFLLENBQUM7UUFFWixTQUFJLEdBQUcsS0FBSyxDQUFDO1FBRzNCLElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxPQUFPOzs7OztRQUFDLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxFQUFFO1lBQzFDLElBQUksQ0FBQyxPQUFPLEdBQUcsR0FBRyxDQUFDO1lBQ25CLElBQUksQ0FBQyxNQUFNLEdBQUcsR0FBRyxDQUFDO1FBQ3BCLENBQUMsRUFBQyxDQUFDO0lBQ0wsQ0FBQzs7Ozs7SUFHRCxlQUFlO1FBQ2IsSUFBSSxJQUFJLENBQUMsV0FBVyxFQUFFO1lBQ3BCLE9BQU87U0FDUjs7Y0FFSyxpQkFBaUIsR0FBbUIsRUFBRTs7Y0FFdEMsUUFBUTs7O1FBQUcsR0FBRyxFQUFFO1lBQ3BCLENBQUMsbUJBQUEsSUFBSSxFQUFrQixDQUFDLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztZQUNyQyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDakIsQ0FBQyxDQUFBO1FBRUQsSUFBSSxJQUFJLENBQUMsUUFBUSxFQUFFO1lBQ2pCLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTs7c0JBQ3ZDLFVBQVUsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxFQUFFO2dCQUNyQyxJQUFJLFNBQVMsQ0FBQyxVQUFVLENBQUMsRUFBRTtvQkFDekIsaUJBQWlCLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO2lCQUNwQzthQUNGO1NBQ0Y7UUFFRCxPQUFPLENBQUMsR0FBRyxDQUFDLGlCQUFpQixDQUFDLENBQUMsSUFBSTs7O1FBQUMsR0FBRyxFQUFFLEdBQUcsUUFBUSxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxLQUFLOzs7O1FBQUMsQ0FBQyxDQUFDLEVBQUUsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUM7UUFFM0YsSUFBSSxpQkFBaUIsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFO1lBQ2xDLFFBQVEsRUFBRSxDQUFDO1NBQ1o7UUFDRCxJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQztJQUMxQixDQUFDOzs7WUE3Q0YsVUFBVTs7Ozt3Q0FVSSxNQUFNLFNBQUMsZUFBZSxjQUFHLFFBQVE7Ozs7Ozs7SUFQOUMsd0NBQTRCOzs7OztJQUU1Qix1Q0FBMkI7Ozs7O0lBQzNCLDRDQUE0Qjs7SUFDNUIsNENBQTBDOztJQUMxQyxxQ0FBNkI7Ozs7O0lBRWpCLHlDQUFvRSIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtpc1Byb21pc2V9IGZyb20gJy4uL3NyYy91dGlsL2xhbmcnO1xuXG5pbXBvcnQge0luamVjdCwgSW5qZWN0YWJsZSwgSW5qZWN0aW9uVG9rZW4sIE9wdGlvbmFsfSBmcm9tICcuL2RpJztcblxuXG4vKipcbiAqIEEgZnVuY3Rpb24gdGhhdCB3aWxsIGJlIGV4ZWN1dGVkIHdoZW4gYW4gYXBwbGljYXRpb24gaXMgaW5pdGlhbGl6ZWQuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgY29uc3QgQVBQX0lOSVRJQUxJWkVSID0gbmV3IEluamVjdGlvblRva2VuPEFycmF5PCgpID0+IHZvaWQ+PignQXBwbGljYXRpb24gSW5pdGlhbGl6ZXInKTtcblxuLyoqXG4gKiBBIGNsYXNzIHRoYXQgcmVmbGVjdHMgdGhlIHN0YXRlIG9mIHJ1bm5pbmcge0BsaW5rIEFQUF9JTklUSUFMSVpFUn1zLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuQEluamVjdGFibGUoKVxuZXhwb3J0IGNsYXNzIEFwcGxpY2F0aW9uSW5pdFN0YXR1cyB7XG4gIC8vIFRPRE8oaXNzdWUvMjQ1NzEpOiByZW1vdmUgJyEnLlxuICBwcml2YXRlIHJlc29sdmUgITogRnVuY3Rpb247XG4gIC8vIFRPRE8oaXNzdWUvMjQ1NzEpOiByZW1vdmUgJyEnLlxuICBwcml2YXRlIHJlamVjdCAhOiBGdW5jdGlvbjtcbiAgcHJpdmF0ZSBpbml0aWFsaXplZCA9IGZhbHNlO1xuICBwdWJsaWMgcmVhZG9ubHkgZG9uZVByb21pc2U6IFByb21pc2U8YW55PjtcbiAgcHVibGljIHJlYWRvbmx5IGRvbmUgPSBmYWxzZTtcblxuICBjb25zdHJ1Y3RvcihASW5qZWN0KEFQUF9JTklUSUFMSVpFUikgQE9wdGlvbmFsKCkgcHJpdmF0ZSBhcHBJbml0czogKCgpID0+IGFueSlbXSkge1xuICAgIHRoaXMuZG9uZVByb21pc2UgPSBuZXcgUHJvbWlzZSgocmVzLCByZWopID0+IHtcbiAgICAgIHRoaXMucmVzb2x2ZSA9IHJlcztcbiAgICAgIHRoaXMucmVqZWN0ID0gcmVqO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqIEBpbnRlcm5hbCAqL1xuICBydW5Jbml0aWFsaXplcnMoKSB7XG4gICAgaWYgKHRoaXMuaW5pdGlhbGl6ZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBhc3luY0luaXRQcm9taXNlczogUHJvbWlzZTxhbnk+W10gPSBbXTtcblxuICAgIGNvbnN0IGNvbXBsZXRlID0gKCkgPT4ge1xuICAgICAgKHRoaXMgYXN7ZG9uZTogYm9vbGVhbn0pLmRvbmUgPSB0cnVlO1xuICAgICAgdGhpcy5yZXNvbHZlKCk7XG4gICAgfTtcblxuICAgIGlmICh0aGlzLmFwcEluaXRzKSB7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuYXBwSW5pdHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3QgaW5pdFJlc3VsdCA9IHRoaXMuYXBwSW5pdHNbaV0oKTtcbiAgICAgICAgaWYgKGlzUHJvbWlzZShpbml0UmVzdWx0KSkge1xuICAgICAgICAgIGFzeW5jSW5pdFByb21pc2VzLnB1c2goaW5pdFJlc3VsdCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBQcm9taXNlLmFsbChhc3luY0luaXRQcm9taXNlcykudGhlbigoKSA9PiB7IGNvbXBsZXRlKCk7IH0pLmNhdGNoKGUgPT4geyB0aGlzLnJlamVjdChlKTsgfSk7XG5cbiAgICBpZiAoYXN5bmNJbml0UHJvbWlzZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICBjb21wbGV0ZSgpO1xuICAgIH1cbiAgICB0aGlzLmluaXRpYWxpemVkID0gdHJ1ZTtcbiAgfVxufVxuIl19