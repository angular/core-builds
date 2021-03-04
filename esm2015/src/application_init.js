import { Inject, Injectable, InjectionToken, Optional } from './di';
import { isObservable, isPromise } from './util/lang';
import { noop } from './util/noop';
import * as i0 from "./r3_symbols";
/**
 * A [DI token](guide/glossary#di-token "DI token definition") that you can use to provide
 * one or more initialization functions.
 *
 * The provided functions are injected at application startup and executed during
 * app initialization. If any of these functions returns a Promise or an Observable, initialization
 * does not complete until the Promise is resolved or the Observable is completed.
 *
 * You can, for example, create a factory function that loads language data
 * or an external configuration, and provide that function to the `APP_INITIALIZER` token.
 * The function is executed during the application bootstrap process,
 * and the needed data is available on startup.
 *
 * @see `ApplicationInitStatus`
 *
 * @publicApi
 */
export const APP_INITIALIZER = new InjectionToken('Application Initializer');
/**
 * A class that reflects the state of running {@link APP_INITIALIZER} functions.
 *
 * @publicApi
 */
export class ApplicationInitStatus {
    constructor(appInits) {
        this.appInits = appInits;
        this.resolve = noop;
        this.reject = noop;
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
                else if (isObservable(initResult)) {
                    const observableAsPromise = new Promise((resolve, reject) => {
                        initResult.subscribe({ complete: resolve, error: reject });
                    });
                    asyncInitPromises.push(observableAsPromise);
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
(function () { (typeof ngDevMode === "undefined" || ngDevMode) && i0.setClassMetadata(ApplicationInitStatus, [{
        type: Injectable
    }], function () { return [{ type: undefined, decorators: [{
                type: Inject,
                args: [APP_INITIALIZER]
            }, {
                type: Optional
            }] }]; }, null); })();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwbGljYXRpb25faW5pdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL2FwcGxpY2F0aW9uX2luaXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBU0EsT0FBTyxFQUFDLE1BQU0sRUFBRSxVQUFVLEVBQUUsY0FBYyxFQUFFLFFBQVEsRUFBQyxNQUFNLE1BQU0sQ0FBQztBQUNsRSxPQUFPLEVBQUMsWUFBWSxFQUFFLFNBQVMsRUFBQyxNQUFNLGFBQWEsQ0FBQztBQUNwRCxPQUFPLEVBQUMsSUFBSSxFQUFDLE1BQU0sYUFBYSxDQUFDOztBQUdqQzs7Ozs7Ozs7Ozs7Ozs7OztHQWdCRztBQUNILE1BQU0sQ0FBQyxNQUFNLGVBQWUsR0FDeEIsSUFBSSxjQUFjLENBQ2QseUJBQXlCLENBQUMsQ0FBQztBQUVuQzs7OztHQUlHO0FBRUgsTUFBTSxPQUFPLHFCQUFxQjtJQU9oQyxZQUFrRSxRQUNjO1FBRGQsYUFBUSxHQUFSLFFBQVEsQ0FDTTtRQVB4RSxZQUFPLEdBQUcsSUFBSSxDQUFDO1FBQ2YsV0FBTSxHQUFHLElBQUksQ0FBQztRQUNkLGdCQUFXLEdBQUcsS0FBSyxDQUFDO1FBRVosU0FBSSxHQUFHLEtBQUssQ0FBQztRQUkzQixJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksT0FBTyxDQUFDLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxFQUFFO1lBQzFDLElBQUksQ0FBQyxPQUFPLEdBQUcsR0FBRyxDQUFDO1lBQ25CLElBQUksQ0FBQyxNQUFNLEdBQUcsR0FBRyxDQUFDO1FBQ3BCLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQUVELGdCQUFnQjtJQUNoQixlQUFlO1FBQ2IsSUFBSSxJQUFJLENBQUMsV0FBVyxFQUFFO1lBQ3BCLE9BQU87U0FDUjtRQUVELE1BQU0saUJBQWlCLEdBQW1CLEVBQUUsQ0FBQztRQUU3QyxNQUFNLFFBQVEsR0FBRyxHQUFHLEVBQUU7WUFDbkIsSUFBd0IsQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO1lBQ3RDLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUNqQixDQUFDLENBQUM7UUFFRixJQUFJLElBQUksQ0FBQyxRQUFRLEVBQUU7WUFDakIsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO2dCQUM3QyxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7Z0JBQ3RDLElBQUksU0FBUyxDQUFDLFVBQVUsQ0FBQyxFQUFFO29CQUN6QixpQkFBaUIsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7aUJBQ3BDO3FCQUFNLElBQUksWUFBWSxDQUFDLFVBQVUsQ0FBQyxFQUFFO29CQUNuQyxNQUFNLG1CQUFtQixHQUFHLElBQUksT0FBTyxDQUFPLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxFQUFFO3dCQUNoRSxVQUFVLENBQUMsU0FBUyxDQUFDLEVBQUMsUUFBUSxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFDLENBQUMsQ0FBQztvQkFDM0QsQ0FBQyxDQUFDLENBQUM7b0JBQ0gsaUJBQWlCLENBQUMsSUFBSSxDQUFDLG1CQUFtQixDQUFDLENBQUM7aUJBQzdDO2FBQ0Y7U0FDRjtRQUVELE9BQU8sQ0FBQyxHQUFHLENBQUMsaUJBQWlCLENBQUM7YUFDekIsSUFBSSxDQUFDLEdBQUcsRUFBRTtZQUNULFFBQVEsRUFBRSxDQUFDO1FBQ2IsQ0FBQyxDQUFDO2FBQ0QsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFO1lBQ1QsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNqQixDQUFDLENBQUMsQ0FBQztRQUVQLElBQUksaUJBQWlCLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRTtZQUNsQyxRQUFRLEVBQUUsQ0FBQztTQUNaO1FBQ0QsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUM7SUFDMUIsQ0FBQzs7MEZBdERVLHFCQUFxQixjQU9aLGVBQWU7NkRBUHhCLHFCQUFxQixXQUFyQixxQkFBcUI7c0ZBQXJCLHFCQUFxQjtjQURqQyxVQUFVOztzQkFRSSxNQUFNO3VCQUFDLGVBQWU7O3NCQUFHLFFBQVEiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtPYnNlcnZhYmxlfSBmcm9tICdyeGpzJztcbmltcG9ydCB7SW5qZWN0LCBJbmplY3RhYmxlLCBJbmplY3Rpb25Ub2tlbiwgT3B0aW9uYWx9IGZyb20gJy4vZGknO1xuaW1wb3J0IHtpc09ic2VydmFibGUsIGlzUHJvbWlzZX0gZnJvbSAnLi91dGlsL2xhbmcnO1xuaW1wb3J0IHtub29wfSBmcm9tICcuL3V0aWwvbm9vcCc7XG5cblxuLyoqXG4gKiBBIFtESSB0b2tlbl0oZ3VpZGUvZ2xvc3NhcnkjZGktdG9rZW4gXCJESSB0b2tlbiBkZWZpbml0aW9uXCIpIHRoYXQgeW91IGNhbiB1c2UgdG8gcHJvdmlkZVxuICogb25lIG9yIG1vcmUgaW5pdGlhbGl6YXRpb24gZnVuY3Rpb25zLlxuICpcbiAqIFRoZSBwcm92aWRlZCBmdW5jdGlvbnMgYXJlIGluamVjdGVkIGF0IGFwcGxpY2F0aW9uIHN0YXJ0dXAgYW5kIGV4ZWN1dGVkIGR1cmluZ1xuICogYXBwIGluaXRpYWxpemF0aW9uLiBJZiBhbnkgb2YgdGhlc2UgZnVuY3Rpb25zIHJldHVybnMgYSBQcm9taXNlIG9yIGFuIE9ic2VydmFibGUsIGluaXRpYWxpemF0aW9uXG4gKiBkb2VzIG5vdCBjb21wbGV0ZSB1bnRpbCB0aGUgUHJvbWlzZSBpcyByZXNvbHZlZCBvciB0aGUgT2JzZXJ2YWJsZSBpcyBjb21wbGV0ZWQuXG4gKlxuICogWW91IGNhbiwgZm9yIGV4YW1wbGUsIGNyZWF0ZSBhIGZhY3RvcnkgZnVuY3Rpb24gdGhhdCBsb2FkcyBsYW5ndWFnZSBkYXRhXG4gKiBvciBhbiBleHRlcm5hbCBjb25maWd1cmF0aW9uLCBhbmQgcHJvdmlkZSB0aGF0IGZ1bmN0aW9uIHRvIHRoZSBgQVBQX0lOSVRJQUxJWkVSYCB0b2tlbi5cbiAqIFRoZSBmdW5jdGlvbiBpcyBleGVjdXRlZCBkdXJpbmcgdGhlIGFwcGxpY2F0aW9uIGJvb3RzdHJhcCBwcm9jZXNzLFxuICogYW5kIHRoZSBuZWVkZWQgZGF0YSBpcyBhdmFpbGFibGUgb24gc3RhcnR1cC5cbiAqXG4gKiBAc2VlIGBBcHBsaWNhdGlvbkluaXRTdGF0dXNgXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgY29uc3QgQVBQX0lOSVRJQUxJWkVSID1cbiAgICBuZXcgSW5qZWN0aW9uVG9rZW48UmVhZG9ubHlBcnJheTwoKSA9PiBPYnNlcnZhYmxlPHVua25vd24+fCBQcm9taXNlPHVua25vd24+fCB2b2lkPj4oXG4gICAgICAgICdBcHBsaWNhdGlvbiBJbml0aWFsaXplcicpO1xuXG4vKipcbiAqIEEgY2xhc3MgdGhhdCByZWZsZWN0cyB0aGUgc3RhdGUgb2YgcnVubmluZyB7QGxpbmsgQVBQX0lOSVRJQUxJWkVSfSBmdW5jdGlvbnMuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5ASW5qZWN0YWJsZSgpXG5leHBvcnQgY2xhc3MgQXBwbGljYXRpb25Jbml0U3RhdHVzIHtcbiAgcHJpdmF0ZSByZXNvbHZlID0gbm9vcDtcbiAgcHJpdmF0ZSByZWplY3QgPSBub29wO1xuICBwcml2YXRlIGluaXRpYWxpemVkID0gZmFsc2U7XG4gIHB1YmxpYyByZWFkb25seSBkb25lUHJvbWlzZTogUHJvbWlzZTxhbnk+O1xuICBwdWJsaWMgcmVhZG9ubHkgZG9uZSA9IGZhbHNlO1xuXG4gIGNvbnN0cnVjdG9yKEBJbmplY3QoQVBQX0lOSVRJQUxJWkVSKSBAT3B0aW9uYWwoKSBwcml2YXRlIHJlYWRvbmx5IGFwcEluaXRzOlxuICAgICAgICAgICAgICAgICAgUmVhZG9ubHlBcnJheTwoKSA9PiBPYnNlcnZhYmxlPHVua25vd24+fCBQcm9taXNlPHVua25vd24+fCB2b2lkPikge1xuICAgIHRoaXMuZG9uZVByb21pc2UgPSBuZXcgUHJvbWlzZSgocmVzLCByZWopID0+IHtcbiAgICAgIHRoaXMucmVzb2x2ZSA9IHJlcztcbiAgICAgIHRoaXMucmVqZWN0ID0gcmVqO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqIEBpbnRlcm5hbCAqL1xuICBydW5Jbml0aWFsaXplcnMoKSB7XG4gICAgaWYgKHRoaXMuaW5pdGlhbGl6ZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBhc3luY0luaXRQcm9taXNlczogUHJvbWlzZTxhbnk+W10gPSBbXTtcblxuICAgIGNvbnN0IGNvbXBsZXRlID0gKCkgPT4ge1xuICAgICAgKHRoaXMgYXMge2RvbmU6IGJvb2xlYW59KS5kb25lID0gdHJ1ZTtcbiAgICAgIHRoaXMucmVzb2x2ZSgpO1xuICAgIH07XG5cbiAgICBpZiAodGhpcy5hcHBJbml0cykge1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmFwcEluaXRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IGluaXRSZXN1bHQgPSB0aGlzLmFwcEluaXRzW2ldKCk7XG4gICAgICAgIGlmIChpc1Byb21pc2UoaW5pdFJlc3VsdCkpIHtcbiAgICAgICAgICBhc3luY0luaXRQcm9taXNlcy5wdXNoKGluaXRSZXN1bHQpO1xuICAgICAgICB9IGVsc2UgaWYgKGlzT2JzZXJ2YWJsZShpbml0UmVzdWx0KSkge1xuICAgICAgICAgIGNvbnN0IG9ic2VydmFibGVBc1Byb21pc2UgPSBuZXcgUHJvbWlzZTx2b2lkPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICBpbml0UmVzdWx0LnN1YnNjcmliZSh7Y29tcGxldGU6IHJlc29sdmUsIGVycm9yOiByZWplY3R9KTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgICBhc3luY0luaXRQcm9taXNlcy5wdXNoKG9ic2VydmFibGVBc1Byb21pc2UpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgUHJvbWlzZS5hbGwoYXN5bmNJbml0UHJvbWlzZXMpXG4gICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICBjb21wbGV0ZSgpO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZSA9PiB7XG4gICAgICAgICAgdGhpcy5yZWplY3QoZSk7XG4gICAgICAgIH0pO1xuXG4gICAgaWYgKGFzeW5jSW5pdFByb21pc2VzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgY29tcGxldGUoKTtcbiAgICB9XG4gICAgdGhpcy5pbml0aWFsaXplZCA9IHRydWU7XG4gIH1cbn1cbiJdfQ==