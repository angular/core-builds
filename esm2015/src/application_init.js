/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { isPromise } from '../src/util/lang';
import { Inject, Injectable, InjectionToken, Optional } from './di';
import * as i0 from "./r3_symbols";
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
 * @publicApi
 */
export const APP_INITIALIZER = new InjectionToken('Application Initializer');
/**
 * A class that reflects the state of running {@link APP_INITIALIZER}s.
 *
 * @publicApi
 */
let ApplicationInitStatus = /** @class */ (() => {
    class ApplicationInitStatus {
        constructor(appInits) {
            this.appInits = appInits;
            this.initialized = false;
            this.done = false;
            this.donePromise = new Promise((res, rej) => {
                this.resolve = res;
                this.reject = rej;
            });
        }
        /** @internal */
        runInitializers() {
            if (this.initialized) {
                return;
            }
            const asyncInitPromises = [];
            const complete = () => {
                this.done = true;
                this.resolve();
            };
            if (this.appInits) {
                for (let i = 0; i < this.appInits.length; i++) {
                    const initResult = this.appInits[i]();
                    if (isPromise(initResult)) {
                        asyncInitPromises.push(initResult);
                    }
                }
            }
            Promise.all(asyncInitPromises)
                .then(() => {
                complete();
            })
                .catch(e => {
                this.reject(e);
            });
            if (asyncInitPromises.length === 0) {
                complete();
            }
            this.initialized = true;
        }
    }
    ApplicationInitStatus.ɵfac = function ApplicationInitStatus_Factory(t) { return new (t || ApplicationInitStatus)(i0.ɵɵinject(APP_INITIALIZER, 8)); };
    ApplicationInitStatus.ɵprov = i0.ɵɵdefineInjectable({ token: ApplicationInitStatus, factory: ApplicationInitStatus.ɵfac });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwbGljYXRpb25faW5pdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL2FwcGxpY2F0aW9uX2luaXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLGtCQUFrQixDQUFDO0FBRTNDLE9BQU8sRUFBQyxNQUFNLEVBQUUsVUFBVSxFQUFFLGNBQWMsRUFBRSxRQUFRLEVBQUMsTUFBTSxNQUFNLENBQUM7O0FBR2xFOzs7Ozs7Ozs7Ozs7R0FZRztBQUNILE1BQU0sQ0FBQyxNQUFNLGVBQWUsR0FBRyxJQUFJLGNBQWMsQ0FBb0IseUJBQXlCLENBQUMsQ0FBQztBQUVoRzs7OztHQUlHO0FBQ0g7SUFBQSxNQUNhLHFCQUFxQjtRQVNoQyxZQUF5RCxRQUF1QjtZQUF2QixhQUFRLEdBQVIsUUFBUSxDQUFlO1lBSnhFLGdCQUFXLEdBQUcsS0FBSyxDQUFDO1lBRVosU0FBSSxHQUFHLEtBQUssQ0FBQztZQUczQixJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksT0FBTyxDQUFDLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxFQUFFO2dCQUMxQyxJQUFJLENBQUMsT0FBTyxHQUFHLEdBQUcsQ0FBQztnQkFDbkIsSUFBSSxDQUFDLE1BQU0sR0FBRyxHQUFHLENBQUM7WUFDcEIsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDO1FBRUQsZ0JBQWdCO1FBQ2hCLGVBQWU7WUFDYixJQUFJLElBQUksQ0FBQyxXQUFXLEVBQUU7Z0JBQ3BCLE9BQU87YUFDUjtZQUVELE1BQU0saUJBQWlCLEdBQW1CLEVBQUUsQ0FBQztZQUU3QyxNQUFNLFFBQVEsR0FBRyxHQUFHLEVBQUU7Z0JBQ25CLElBQXdCLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztnQkFDdEMsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ2pCLENBQUMsQ0FBQztZQUVGLElBQUksSUFBSSxDQUFDLFFBQVEsRUFBRTtnQkFDakIsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO29CQUM3QyxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7b0JBQ3RDLElBQUksU0FBUyxDQUFDLFVBQVUsQ0FBQyxFQUFFO3dCQUN6QixpQkFBaUIsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7cUJBQ3BDO2lCQUNGO2FBQ0Y7WUFFRCxPQUFPLENBQUMsR0FBRyxDQUFDLGlCQUFpQixDQUFDO2lCQUN6QixJQUFJLENBQUMsR0FBRyxFQUFFO2dCQUNULFFBQVEsRUFBRSxDQUFDO1lBQ2IsQ0FBQyxDQUFDO2lCQUNELEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRTtnQkFDVCxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2pCLENBQUMsQ0FBQyxDQUFDO1lBRVAsSUFBSSxpQkFBaUIsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFO2dCQUNsQyxRQUFRLEVBQUUsQ0FBQzthQUNaO1lBQ0QsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUM7UUFDMUIsQ0FBQzs7OEZBbERVLHFCQUFxQixjQVNaLGVBQWU7aUVBVHhCLHFCQUFxQixXQUFyQixxQkFBcUI7Z0NBbENsQztLQXFGQztTQW5EWSxxQkFBcUI7aURBQXJCLHFCQUFxQjtjQURqQyxVQUFVOztzQkFVSSxNQUFNO3VCQUFDLGVBQWU7O3NCQUFHLFFBQVEiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtpc1Byb21pc2V9IGZyb20gJy4uL3NyYy91dGlsL2xhbmcnO1xuXG5pbXBvcnQge0luamVjdCwgSW5qZWN0YWJsZSwgSW5qZWN0aW9uVG9rZW4sIE9wdGlvbmFsfSBmcm9tICcuL2RpJztcblxuXG4vKipcbiAqIEFuIGluamVjdGlvbiB0b2tlbiB0aGF0IGFsbG93cyB5b3UgdG8gcHJvdmlkZSBvbmUgb3IgbW9yZSBpbml0aWFsaXphdGlvbiBmdW5jdGlvbnMuXG4gKiBUaGVzZSBmdW5jdGlvbiBhcmUgaW5qZWN0ZWQgYXQgYXBwbGljYXRpb24gc3RhcnR1cCBhbmQgZXhlY3V0ZWQgZHVyaW5nXG4gKiBhcHAgaW5pdGlhbGl6YXRpb24uIElmIGFueSBvZiB0aGVzZSBmdW5jdGlvbnMgcmV0dXJucyBhIFByb21pc2UsIGluaXRpYWxpemF0aW9uXG4gKiBkb2VzIG5vdCBjb21wbGV0ZSB1bnRpbCB0aGUgUHJvbWlzZSBpcyByZXNvbHZlZC5cbiAqXG4gKiBZb3UgY2FuLCBmb3IgZXhhbXBsZSwgY3JlYXRlIGEgZmFjdG9yeSBmdW5jdGlvbiB0aGF0IGxvYWRzIGxhbmd1YWdlIGRhdGFcbiAqIG9yIGFuIGV4dGVybmFsIGNvbmZpZ3VyYXRpb24sIGFuZCBwcm92aWRlIHRoYXQgZnVuY3Rpb24gdG8gdGhlIGBBUFBfSU5JVElBTElaRVJgIHRva2VuLlxuICogVGhhdCB3YXksIHRoZSBmdW5jdGlvbiBpcyBleGVjdXRlZCBkdXJpbmcgdGhlIGFwcGxpY2F0aW9uIGJvb3RzdHJhcCBwcm9jZXNzLFxuICogYW5kIHRoZSBuZWVkZWQgZGF0YSBpcyBhdmFpbGFibGUgb24gc3RhcnR1cC5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBjb25zdCBBUFBfSU5JVElBTElaRVIgPSBuZXcgSW5qZWN0aW9uVG9rZW48QXJyYXk8KCkgPT4gdm9pZD4+KCdBcHBsaWNhdGlvbiBJbml0aWFsaXplcicpO1xuXG4vKipcbiAqIEEgY2xhc3MgdGhhdCByZWZsZWN0cyB0aGUgc3RhdGUgb2YgcnVubmluZyB7QGxpbmsgQVBQX0lOSVRJQUxJWkVSfXMuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5ASW5qZWN0YWJsZSgpXG5leHBvcnQgY2xhc3MgQXBwbGljYXRpb25Jbml0U3RhdHVzIHtcbiAgLy8gVE9ETyhpc3N1ZS8yNDU3MSk6IHJlbW92ZSAnIScuXG4gIHByaXZhdGUgcmVzb2x2ZSE6IEZ1bmN0aW9uO1xuICAvLyBUT0RPKGlzc3VlLzI0NTcxKTogcmVtb3ZlICchJy5cbiAgcHJpdmF0ZSByZWplY3QhOiBGdW5jdGlvbjtcbiAgcHJpdmF0ZSBpbml0aWFsaXplZCA9IGZhbHNlO1xuICBwdWJsaWMgcmVhZG9ubHkgZG9uZVByb21pc2U6IFByb21pc2U8YW55PjtcbiAgcHVibGljIHJlYWRvbmx5IGRvbmUgPSBmYWxzZTtcblxuICBjb25zdHJ1Y3RvcihASW5qZWN0KEFQUF9JTklUSUFMSVpFUikgQE9wdGlvbmFsKCkgcHJpdmF0ZSBhcHBJbml0czogKCgpID0+IGFueSlbXSkge1xuICAgIHRoaXMuZG9uZVByb21pc2UgPSBuZXcgUHJvbWlzZSgocmVzLCByZWopID0+IHtcbiAgICAgIHRoaXMucmVzb2x2ZSA9IHJlcztcbiAgICAgIHRoaXMucmVqZWN0ID0gcmVqO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqIEBpbnRlcm5hbCAqL1xuICBydW5Jbml0aWFsaXplcnMoKSB7XG4gICAgaWYgKHRoaXMuaW5pdGlhbGl6ZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBhc3luY0luaXRQcm9taXNlczogUHJvbWlzZTxhbnk+W10gPSBbXTtcblxuICAgIGNvbnN0IGNvbXBsZXRlID0gKCkgPT4ge1xuICAgICAgKHRoaXMgYXMge2RvbmU6IGJvb2xlYW59KS5kb25lID0gdHJ1ZTtcbiAgICAgIHRoaXMucmVzb2x2ZSgpO1xuICAgIH07XG5cbiAgICBpZiAodGhpcy5hcHBJbml0cykge1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmFwcEluaXRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IGluaXRSZXN1bHQgPSB0aGlzLmFwcEluaXRzW2ldKCk7XG4gICAgICAgIGlmIChpc1Byb21pc2UoaW5pdFJlc3VsdCkpIHtcbiAgICAgICAgICBhc3luY0luaXRQcm9taXNlcy5wdXNoKGluaXRSZXN1bHQpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgUHJvbWlzZS5hbGwoYXN5bmNJbml0UHJvbWlzZXMpXG4gICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICBjb21wbGV0ZSgpO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZSA9PiB7XG4gICAgICAgICAgdGhpcy5yZWplY3QoZSk7XG4gICAgICAgIH0pO1xuXG4gICAgaWYgKGFzeW5jSW5pdFByb21pc2VzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgY29tcGxldGUoKTtcbiAgICB9XG4gICAgdGhpcy5pbml0aWFsaXplZCA9IHRydWU7XG4gIH1cbn1cbiJdfQ==