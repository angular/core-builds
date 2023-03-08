import { inject, Injectable, InjectionToken } from './di';
import { isPromise, isSubscribable } from './util/lang';
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
 * @usageNotes
 *
 * The following example illustrates how to configure a multi-provider using `APP_INITIALIZER` token
 * and a function returning a promise.
 *
 * ```
 *  function initializeApp(): Promise<any> {
 *    return new Promise((resolve, reject) => {
 *      // Do some asynchronous stuff
 *      resolve();
 *    });
 *  }
 *
 *  @NgModule({
 *   imports: [BrowserModule],
 *   declarations: [AppComponent],
 *   bootstrap: [AppComponent],
 *   providers: [{
 *     provide: APP_INITIALIZER,
 *     useFactory: () => initializeApp,
 *     multi: true
 *    }]
 *   })
 *  export class AppModule {}
 * ```
 *
 * It's also possible to configure a multi-provider using `APP_INITIALIZER` token and a function
 * returning an observable, see an example below. Note: the `HttpClient` in this example is used for
 * demo purposes to illustrate how the factory function can work with other providers available
 * through DI.
 *
 * ```
 *  function initializeAppFactory(httpClient: HttpClient): () => Observable<any> {
 *   return () => httpClient.get("https://someUrl.com/api/user")
 *     .pipe(
 *        tap(user => { ... })
 *     );
 *  }
 *
 *  @NgModule({
 *    imports: [BrowserModule, HttpClientModule],
 *    declarations: [AppComponent],
 *    bootstrap: [AppComponent],
 *    providers: [{
 *      provide: APP_INITIALIZER,
 *      useFactory: initializeAppFactory,
 *      deps: [HttpClient],
 *      multi: true
 *    }]
 *  })
 *  export class AppModule {}
 * ```
 *
 * @publicApi
 */
export const APP_INITIALIZER = new InjectionToken('Application Initializer');
/**
 * A class that reflects the state of running {@link APP_INITIALIZER} functions.
 *
 * @publicApi
 */
class ApplicationInitStatus {
    constructor() {
        this.initialized = false;
        this.done = false;
        this.donePromise = new Promise((res, rej) => {
            this.resolve = res;
            this.reject = rej;
        });
        // TODO: Throw RuntimeErrorCode.INVALID_MULTI_PROVIDER if appInits is not an array
        this.appInits = inject(APP_INITIALIZER, { optional: true }) ?? [];
    }
    /** @internal */
    runInitializers() {
        if (this.initialized) {
            return;
        }
        const asyncInitPromises = [];
        for (const appInits of this.appInits) {
            const initResult = appInits();
            if (isPromise(initResult)) {
                asyncInitPromises.push(initResult);
            }
            else if (isSubscribable(initResult)) {
                const observableAsPromise = new Promise((resolve, reject) => {
                    initResult.subscribe({ complete: resolve, error: reject });
                });
                asyncInitPromises.push(observableAsPromise);
            }
        }
        const complete = () => {
            // @ts-expect-error overwriting a readonly
            this.done = true;
            this.resolve();
        };
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
ApplicationInitStatus.ɵfac = function ApplicationInitStatus_Factory(t) { return new (t || ApplicationInitStatus)(); };
ApplicationInitStatus.ɵprov = /*@__PURE__*/ i0.ɵɵdefineInjectable({ token: ApplicationInitStatus, factory: ApplicationInitStatus.ɵfac, providedIn: 'root' });
export { ApplicationInitStatus };
(function () { (typeof ngDevMode === "undefined" || ngDevMode) && i0.setClassMetadata(ApplicationInitStatus, [{
        type: Injectable,
        args: [{ providedIn: 'root' }]
    }], null, null); })();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwbGljYXRpb25faW5pdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL2FwcGxpY2F0aW9uX2luaXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBVUEsT0FBTyxFQUFDLE1BQU0sRUFBRSxVQUFVLEVBQUUsY0FBYyxFQUFDLE1BQU0sTUFBTSxDQUFDO0FBQ3hELE9BQU8sRUFBQyxTQUFTLEVBQUUsY0FBYyxFQUFDLE1BQU0sYUFBYSxDQUFDOztBQUV0RDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBcUVHO0FBQ0gsTUFBTSxDQUFDLE1BQU0sZUFBZSxHQUN4QixJQUFJLGNBQWMsQ0FDZCx5QkFBeUIsQ0FBQyxDQUFDO0FBRW5DOzs7O0dBSUc7QUFDSCxNQUNhLHFCQUFxQjtJQURsQztRQU9VLGdCQUFXLEdBQUcsS0FBSyxDQUFDO1FBQ1osU0FBSSxHQUFHLEtBQUssQ0FBQztRQUNiLGdCQUFXLEdBQWlCLElBQUksT0FBTyxDQUFDLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxFQUFFO1lBQ25FLElBQUksQ0FBQyxPQUFPLEdBQUcsR0FBRyxDQUFDO1lBQ25CLElBQUksQ0FBQyxNQUFNLEdBQUcsR0FBRyxDQUFDO1FBQ3BCLENBQUMsQ0FBQyxDQUFDO1FBRUgsa0ZBQWtGO1FBQ2pFLGFBQVEsR0FBRyxNQUFNLENBQUMsZUFBZSxFQUFFLEVBQUMsUUFBUSxFQUFFLElBQUksRUFBQyxDQUFDLElBQUksRUFBRSxDQUFDO0tBd0M3RTtJQXRDQyxnQkFBZ0I7SUFDaEIsZUFBZTtRQUNiLElBQUksSUFBSSxDQUFDLFdBQVcsRUFBRTtZQUNwQixPQUFPO1NBQ1I7UUFFRCxNQUFNLGlCQUFpQixHQUFHLEVBQUUsQ0FBQztRQUM3QixLQUFLLE1BQU0sUUFBUSxJQUFJLElBQUksQ0FBQyxRQUFRLEVBQUU7WUFDcEMsTUFBTSxVQUFVLEdBQUcsUUFBUSxFQUFFLENBQUM7WUFDOUIsSUFBSSxTQUFTLENBQUMsVUFBVSxDQUFDLEVBQUU7Z0JBQ3pCLGlCQUFpQixDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQzthQUNwQztpQkFBTSxJQUFJLGNBQWMsQ0FBQyxVQUFVLENBQUMsRUFBRTtnQkFDckMsTUFBTSxtQkFBbUIsR0FBRyxJQUFJLE9BQU8sQ0FBTyxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsRUFBRTtvQkFDaEUsVUFBVSxDQUFDLFNBQVMsQ0FBQyxFQUFDLFFBQVEsRUFBRSxPQUFPLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBQyxDQUFDLENBQUM7Z0JBQzNELENBQUMsQ0FBQyxDQUFDO2dCQUNILGlCQUFpQixDQUFDLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO2FBQzdDO1NBQ0Y7UUFFRCxNQUFNLFFBQVEsR0FBRyxHQUFHLEVBQUU7WUFDcEIsMENBQTBDO1lBQzFDLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO1lBQ2pCLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUNqQixDQUFDLENBQUM7UUFFRixPQUFPLENBQUMsR0FBRyxDQUFDLGlCQUFpQixDQUFDO2FBQ3pCLElBQUksQ0FBQyxHQUFHLEVBQUU7WUFDVCxRQUFRLEVBQUUsQ0FBQztRQUNiLENBQUMsQ0FBQzthQUNELEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRTtZQUNULElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDakIsQ0FBQyxDQUFDLENBQUM7UUFFUCxJQUFJLGlCQUFpQixDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUU7WUFDbEMsUUFBUSxFQUFFLENBQUM7U0FDWjtRQUNELElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDO0lBQzFCLENBQUM7OzBGQXJEVSxxQkFBcUI7MkVBQXJCLHFCQUFxQixXQUFyQixxQkFBcUIsbUJBRFQsTUFBTTtTQUNsQixxQkFBcUI7c0ZBQXJCLHFCQUFxQjtjQURqQyxVQUFVO2VBQUMsRUFBQyxVQUFVLEVBQUUsTUFBTSxFQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7T2JzZXJ2YWJsZX0gZnJvbSAncnhqcyc7XG5cbmltcG9ydCB7aW5qZWN0LCBJbmplY3RhYmxlLCBJbmplY3Rpb25Ub2tlbn0gZnJvbSAnLi9kaSc7XG5pbXBvcnQge2lzUHJvbWlzZSwgaXNTdWJzY3JpYmFibGV9IGZyb20gJy4vdXRpbC9sYW5nJztcblxuLyoqXG4gKiBBIFtESSB0b2tlbl0oZ3VpZGUvZ2xvc3NhcnkjZGktdG9rZW4gXCJESSB0b2tlbiBkZWZpbml0aW9uXCIpIHRoYXQgeW91IGNhbiB1c2UgdG8gcHJvdmlkZVxuICogb25lIG9yIG1vcmUgaW5pdGlhbGl6YXRpb24gZnVuY3Rpb25zLlxuICpcbiAqIFRoZSBwcm92aWRlZCBmdW5jdGlvbnMgYXJlIGluamVjdGVkIGF0IGFwcGxpY2F0aW9uIHN0YXJ0dXAgYW5kIGV4ZWN1dGVkIGR1cmluZ1xuICogYXBwIGluaXRpYWxpemF0aW9uLiBJZiBhbnkgb2YgdGhlc2UgZnVuY3Rpb25zIHJldHVybnMgYSBQcm9taXNlIG9yIGFuIE9ic2VydmFibGUsIGluaXRpYWxpemF0aW9uXG4gKiBkb2VzIG5vdCBjb21wbGV0ZSB1bnRpbCB0aGUgUHJvbWlzZSBpcyByZXNvbHZlZCBvciB0aGUgT2JzZXJ2YWJsZSBpcyBjb21wbGV0ZWQuXG4gKlxuICogWW91IGNhbiwgZm9yIGV4YW1wbGUsIGNyZWF0ZSBhIGZhY3RvcnkgZnVuY3Rpb24gdGhhdCBsb2FkcyBsYW5ndWFnZSBkYXRhXG4gKiBvciBhbiBleHRlcm5hbCBjb25maWd1cmF0aW9uLCBhbmQgcHJvdmlkZSB0aGF0IGZ1bmN0aW9uIHRvIHRoZSBgQVBQX0lOSVRJQUxJWkVSYCB0b2tlbi5cbiAqIFRoZSBmdW5jdGlvbiBpcyBleGVjdXRlZCBkdXJpbmcgdGhlIGFwcGxpY2F0aW9uIGJvb3RzdHJhcCBwcm9jZXNzLFxuICogYW5kIHRoZSBuZWVkZWQgZGF0YSBpcyBhdmFpbGFibGUgb24gc3RhcnR1cC5cbiAqXG4gKiBAc2VlIGBBcHBsaWNhdGlvbkluaXRTdGF0dXNgXG4gKlxuICogQHVzYWdlTm90ZXNcbiAqXG4gKiBUaGUgZm9sbG93aW5nIGV4YW1wbGUgaWxsdXN0cmF0ZXMgaG93IHRvIGNvbmZpZ3VyZSBhIG11bHRpLXByb3ZpZGVyIHVzaW5nIGBBUFBfSU5JVElBTElaRVJgIHRva2VuXG4gKiBhbmQgYSBmdW5jdGlvbiByZXR1cm5pbmcgYSBwcm9taXNlLlxuICpcbiAqIGBgYFxuICogIGZ1bmN0aW9uIGluaXRpYWxpemVBcHAoKTogUHJvbWlzZTxhbnk+IHtcbiAqICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gKiAgICAgIC8vIERvIHNvbWUgYXN5bmNocm9ub3VzIHN0dWZmXG4gKiAgICAgIHJlc29sdmUoKTtcbiAqICAgIH0pO1xuICogIH1cbiAqXG4gKiAgQE5nTW9kdWxlKHtcbiAqICAgaW1wb3J0czogW0Jyb3dzZXJNb2R1bGVdLFxuICogICBkZWNsYXJhdGlvbnM6IFtBcHBDb21wb25lbnRdLFxuICogICBib290c3RyYXA6IFtBcHBDb21wb25lbnRdLFxuICogICBwcm92aWRlcnM6IFt7XG4gKiAgICAgcHJvdmlkZTogQVBQX0lOSVRJQUxJWkVSLFxuICogICAgIHVzZUZhY3Rvcnk6ICgpID0+IGluaXRpYWxpemVBcHAsXG4gKiAgICAgbXVsdGk6IHRydWVcbiAqICAgIH1dXG4gKiAgIH0pXG4gKiAgZXhwb3J0IGNsYXNzIEFwcE1vZHVsZSB7fVxuICogYGBgXG4gKlxuICogSXQncyBhbHNvIHBvc3NpYmxlIHRvIGNvbmZpZ3VyZSBhIG11bHRpLXByb3ZpZGVyIHVzaW5nIGBBUFBfSU5JVElBTElaRVJgIHRva2VuIGFuZCBhIGZ1bmN0aW9uXG4gKiByZXR1cm5pbmcgYW4gb2JzZXJ2YWJsZSwgc2VlIGFuIGV4YW1wbGUgYmVsb3cuIE5vdGU6IHRoZSBgSHR0cENsaWVudGAgaW4gdGhpcyBleGFtcGxlIGlzIHVzZWQgZm9yXG4gKiBkZW1vIHB1cnBvc2VzIHRvIGlsbHVzdHJhdGUgaG93IHRoZSBmYWN0b3J5IGZ1bmN0aW9uIGNhbiB3b3JrIHdpdGggb3RoZXIgcHJvdmlkZXJzIGF2YWlsYWJsZVxuICogdGhyb3VnaCBESS5cbiAqXG4gKiBgYGBcbiAqICBmdW5jdGlvbiBpbml0aWFsaXplQXBwRmFjdG9yeShodHRwQ2xpZW50OiBIdHRwQ2xpZW50KTogKCkgPT4gT2JzZXJ2YWJsZTxhbnk+IHtcbiAqICAgcmV0dXJuICgpID0+IGh0dHBDbGllbnQuZ2V0KFwiaHR0cHM6Ly9zb21lVXJsLmNvbS9hcGkvdXNlclwiKVxuICogICAgIC5waXBlKFxuICogICAgICAgIHRhcCh1c2VyID0+IHsgLi4uIH0pXG4gKiAgICAgKTtcbiAqICB9XG4gKlxuICogIEBOZ01vZHVsZSh7XG4gKiAgICBpbXBvcnRzOiBbQnJvd3Nlck1vZHVsZSwgSHR0cENsaWVudE1vZHVsZV0sXG4gKiAgICBkZWNsYXJhdGlvbnM6IFtBcHBDb21wb25lbnRdLFxuICogICAgYm9vdHN0cmFwOiBbQXBwQ29tcG9uZW50XSxcbiAqICAgIHByb3ZpZGVyczogW3tcbiAqICAgICAgcHJvdmlkZTogQVBQX0lOSVRJQUxJWkVSLFxuICogICAgICB1c2VGYWN0b3J5OiBpbml0aWFsaXplQXBwRmFjdG9yeSxcbiAqICAgICAgZGVwczogW0h0dHBDbGllbnRdLFxuICogICAgICBtdWx0aTogdHJ1ZVxuICogICAgfV1cbiAqICB9KVxuICogIGV4cG9ydCBjbGFzcyBBcHBNb2R1bGUge31cbiAqIGBgYFxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGNvbnN0IEFQUF9JTklUSUFMSVpFUiA9XG4gICAgbmV3IEluamVjdGlvblRva2VuPFJlYWRvbmx5QXJyYXk8KCkgPT4gT2JzZXJ2YWJsZTx1bmtub3duPnwgUHJvbWlzZTx1bmtub3duPnwgdm9pZD4+KFxuICAgICAgICAnQXBwbGljYXRpb24gSW5pdGlhbGl6ZXInKTtcblxuLyoqXG4gKiBBIGNsYXNzIHRoYXQgcmVmbGVjdHMgdGhlIHN0YXRlIG9mIHJ1bm5pbmcge0BsaW5rIEFQUF9JTklUSUFMSVpFUn0gZnVuY3Rpb25zLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuQEluamVjdGFibGUoe3Byb3ZpZGVkSW46ICdyb290J30pXG5leHBvcnQgY2xhc3MgQXBwbGljYXRpb25Jbml0U3RhdHVzIHtcbiAgLy8gVXNpbmcgbm9uIG51bGwgYXNzZXJ0aW9uLCB0aGVzZSBmaWVsZHMgYXJlIGRlZmluZWQgYmVsb3dcbiAgLy8gd2l0aGluIHRoZSBgbmV3IFByb21pc2VgIGNhbGxiYWNrIChzeW5jaHJvbm91c2x5KS5cbiAgcHJpdmF0ZSByZXNvbHZlITogKC4uLmFyZ3M6IGFueVtdKSA9PiB2b2lkO1xuICBwcml2YXRlIHJlamVjdCE6ICguLi5hcmdzOiBhbnlbXSkgPT4gdm9pZDtcblxuICBwcml2YXRlIGluaXRpYWxpemVkID0gZmFsc2U7XG4gIHB1YmxpYyByZWFkb25seSBkb25lID0gZmFsc2U7XG4gIHB1YmxpYyByZWFkb25seSBkb25lUHJvbWlzZTogUHJvbWlzZTxhbnk+ID0gbmV3IFByb21pc2UoKHJlcywgcmVqKSA9PiB7XG4gICAgdGhpcy5yZXNvbHZlID0gcmVzO1xuICAgIHRoaXMucmVqZWN0ID0gcmVqO1xuICB9KTtcblxuICAvLyBUT0RPOiBUaHJvdyBSdW50aW1lRXJyb3JDb2RlLklOVkFMSURfTVVMVElfUFJPVklERVIgaWYgYXBwSW5pdHMgaXMgbm90IGFuIGFycmF5XG4gIHByaXZhdGUgcmVhZG9ubHkgYXBwSW5pdHMgPSBpbmplY3QoQVBQX0lOSVRJQUxJWkVSLCB7b3B0aW9uYWw6IHRydWV9KSA/PyBbXTtcblxuICAvKiogQGludGVybmFsICovXG4gIHJ1bkluaXRpYWxpemVycygpIHtcbiAgICBpZiAodGhpcy5pbml0aWFsaXplZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGFzeW5jSW5pdFByb21pc2VzID0gW107XG4gICAgZm9yIChjb25zdCBhcHBJbml0cyBvZiB0aGlzLmFwcEluaXRzKSB7XG4gICAgICBjb25zdCBpbml0UmVzdWx0ID0gYXBwSW5pdHMoKTtcbiAgICAgIGlmIChpc1Byb21pc2UoaW5pdFJlc3VsdCkpIHtcbiAgICAgICAgYXN5bmNJbml0UHJvbWlzZXMucHVzaChpbml0UmVzdWx0KTtcbiAgICAgIH0gZWxzZSBpZiAoaXNTdWJzY3JpYmFibGUoaW5pdFJlc3VsdCkpIHtcbiAgICAgICAgY29uc3Qgb2JzZXJ2YWJsZUFzUHJvbWlzZSA9IG5ldyBQcm9taXNlPHZvaWQ+KChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICBpbml0UmVzdWx0LnN1YnNjcmliZSh7Y29tcGxldGU6IHJlc29sdmUsIGVycm9yOiByZWplY3R9KTtcbiAgICAgICAgfSk7XG4gICAgICAgIGFzeW5jSW5pdFByb21pc2VzLnB1c2gob2JzZXJ2YWJsZUFzUHJvbWlzZSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgY29tcGxldGUgPSAoKSA9PiB7XG4gICAgICAvLyBAdHMtZXhwZWN0LWVycm9yIG92ZXJ3cml0aW5nIGEgcmVhZG9ubHlcbiAgICAgIHRoaXMuZG9uZSA9IHRydWU7XG4gICAgICB0aGlzLnJlc29sdmUoKTtcbiAgICB9O1xuXG4gICAgUHJvbWlzZS5hbGwoYXN5bmNJbml0UHJvbWlzZXMpXG4gICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICBjb21wbGV0ZSgpO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZSA9PiB7XG4gICAgICAgICAgdGhpcy5yZWplY3QoZSk7XG4gICAgICAgIH0pO1xuXG4gICAgaWYgKGFzeW5jSW5pdFByb21pc2VzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgY29tcGxldGUoKTtcbiAgICB9XG4gICAgdGhpcy5pbml0aWFsaXplZCA9IHRydWU7XG4gIH1cbn1cbiJdfQ==