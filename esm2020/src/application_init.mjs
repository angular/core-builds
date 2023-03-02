import { inject, Injectable, InjectionToken } from './di';
import { isObservable, isPromise } from './util/lang';
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
            else if (isObservable(initResult)) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwbGljYXRpb25faW5pdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL2FwcGxpY2F0aW9uX2luaXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBVUEsT0FBTyxFQUFDLE1BQU0sRUFBRSxVQUFVLEVBQUUsY0FBYyxFQUFDLE1BQU0sTUFBTSxDQUFDO0FBQ3hELE9BQU8sRUFBQyxZQUFZLEVBQUUsU0FBUyxFQUFDLE1BQU0sYUFBYSxDQUFDOztBQUVwRDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBcUVHO0FBQ0gsTUFBTSxDQUFDLE1BQU0sZUFBZSxHQUN4QixJQUFJLGNBQWMsQ0FDZCx5QkFBeUIsQ0FBQyxDQUFDO0FBRW5DOzs7O0dBSUc7QUFDSCxNQUNhLHFCQUFxQjtJQURsQztRQU9VLGdCQUFXLEdBQUcsS0FBSyxDQUFDO1FBQ1osU0FBSSxHQUFHLEtBQUssQ0FBQztRQUNiLGdCQUFXLEdBQWlCLElBQUksT0FBTyxDQUFDLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxFQUFFO1lBQ25FLElBQUksQ0FBQyxPQUFPLEdBQUcsR0FBRyxDQUFDO1lBQ25CLElBQUksQ0FBQyxNQUFNLEdBQUcsR0FBRyxDQUFDO1FBQ3BCLENBQUMsQ0FBQyxDQUFDO1FBRUgsa0ZBQWtGO1FBQ2pFLGFBQVEsR0FBRyxNQUFNLENBQUMsZUFBZSxFQUFFLEVBQUMsUUFBUSxFQUFFLElBQUksRUFBQyxDQUFDLElBQUksRUFBRSxDQUFDO0tBd0M3RTtJQXRDQyxnQkFBZ0I7SUFDaEIsZUFBZTtRQUNiLElBQUksSUFBSSxDQUFDLFdBQVcsRUFBRTtZQUNwQixPQUFPO1NBQ1I7UUFFRCxNQUFNLGlCQUFpQixHQUFHLEVBQUUsQ0FBQztRQUM3QixLQUFLLE1BQU0sUUFBUSxJQUFJLElBQUksQ0FBQyxRQUFRLEVBQUU7WUFDcEMsTUFBTSxVQUFVLEdBQUcsUUFBUSxFQUFFLENBQUM7WUFDOUIsSUFBSSxTQUFTLENBQUMsVUFBVSxDQUFDLEVBQUU7Z0JBQ3pCLGlCQUFpQixDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQzthQUNwQztpQkFBTSxJQUFJLFlBQVksQ0FBQyxVQUFVLENBQUMsRUFBRTtnQkFDbkMsTUFBTSxtQkFBbUIsR0FBRyxJQUFJLE9BQU8sQ0FBTyxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsRUFBRTtvQkFDaEUsVUFBVSxDQUFDLFNBQVMsQ0FBQyxFQUFDLFFBQVEsRUFBRSxPQUFPLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBQyxDQUFDLENBQUM7Z0JBQzNELENBQUMsQ0FBQyxDQUFDO2dCQUNILGlCQUFpQixDQUFDLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO2FBQzdDO1NBQ0Y7UUFFRCxNQUFNLFFBQVEsR0FBRyxHQUFHLEVBQUU7WUFDcEIsMENBQTBDO1lBQzFDLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO1lBQ2pCLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUNqQixDQUFDLENBQUM7UUFFRixPQUFPLENBQUMsR0FBRyxDQUFDLGlCQUFpQixDQUFDO2FBQ3pCLElBQUksQ0FBQyxHQUFHLEVBQUU7WUFDVCxRQUFRLEVBQUUsQ0FBQztRQUNiLENBQUMsQ0FBQzthQUNELEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRTtZQUNULElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDakIsQ0FBQyxDQUFDLENBQUM7UUFFUCxJQUFJLGlCQUFpQixDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUU7WUFDbEMsUUFBUSxFQUFFLENBQUM7U0FDWjtRQUNELElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDO0lBQzFCLENBQUM7OzBGQXJEVSxxQkFBcUI7MkVBQXJCLHFCQUFxQixXQUFyQixxQkFBcUIsbUJBRFQsTUFBTTtTQUNsQixxQkFBcUI7c0ZBQXJCLHFCQUFxQjtjQURqQyxVQUFVO2VBQUMsRUFBQyxVQUFVLEVBQUUsTUFBTSxFQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7T2JzZXJ2YWJsZX0gZnJvbSAncnhqcyc7XG5cbmltcG9ydCB7aW5qZWN0LCBJbmplY3RhYmxlLCBJbmplY3Rpb25Ub2tlbn0gZnJvbSAnLi9kaSc7XG5pbXBvcnQge2lzT2JzZXJ2YWJsZSwgaXNQcm9taXNlfSBmcm9tICcuL3V0aWwvbGFuZyc7XG5cbi8qKlxuICogQSBbREkgdG9rZW5dKGd1aWRlL2dsb3NzYXJ5I2RpLXRva2VuIFwiREkgdG9rZW4gZGVmaW5pdGlvblwiKSB0aGF0IHlvdSBjYW4gdXNlIHRvIHByb3ZpZGVcbiAqIG9uZSBvciBtb3JlIGluaXRpYWxpemF0aW9uIGZ1bmN0aW9ucy5cbiAqXG4gKiBUaGUgcHJvdmlkZWQgZnVuY3Rpb25zIGFyZSBpbmplY3RlZCBhdCBhcHBsaWNhdGlvbiBzdGFydHVwIGFuZCBleGVjdXRlZCBkdXJpbmdcbiAqIGFwcCBpbml0aWFsaXphdGlvbi4gSWYgYW55IG9mIHRoZXNlIGZ1bmN0aW9ucyByZXR1cm5zIGEgUHJvbWlzZSBvciBhbiBPYnNlcnZhYmxlLCBpbml0aWFsaXphdGlvblxuICogZG9lcyBub3QgY29tcGxldGUgdW50aWwgdGhlIFByb21pc2UgaXMgcmVzb2x2ZWQgb3IgdGhlIE9ic2VydmFibGUgaXMgY29tcGxldGVkLlxuICpcbiAqIFlvdSBjYW4sIGZvciBleGFtcGxlLCBjcmVhdGUgYSBmYWN0b3J5IGZ1bmN0aW9uIHRoYXQgbG9hZHMgbGFuZ3VhZ2UgZGF0YVxuICogb3IgYW4gZXh0ZXJuYWwgY29uZmlndXJhdGlvbiwgYW5kIHByb3ZpZGUgdGhhdCBmdW5jdGlvbiB0byB0aGUgYEFQUF9JTklUSUFMSVpFUmAgdG9rZW4uXG4gKiBUaGUgZnVuY3Rpb24gaXMgZXhlY3V0ZWQgZHVyaW5nIHRoZSBhcHBsaWNhdGlvbiBib290c3RyYXAgcHJvY2VzcyxcbiAqIGFuZCB0aGUgbmVlZGVkIGRhdGEgaXMgYXZhaWxhYmxlIG9uIHN0YXJ0dXAuXG4gKlxuICogQHNlZSBgQXBwbGljYXRpb25Jbml0U3RhdHVzYFxuICpcbiAqIEB1c2FnZU5vdGVzXG4gKlxuICogVGhlIGZvbGxvd2luZyBleGFtcGxlIGlsbHVzdHJhdGVzIGhvdyB0byBjb25maWd1cmUgYSBtdWx0aS1wcm92aWRlciB1c2luZyBgQVBQX0lOSVRJQUxJWkVSYCB0b2tlblxuICogYW5kIGEgZnVuY3Rpb24gcmV0dXJuaW5nIGEgcHJvbWlzZS5cbiAqXG4gKiBgYGBcbiAqICBmdW5jdGlvbiBpbml0aWFsaXplQXBwKCk6IFByb21pc2U8YW55PiB7XG4gKiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICogICAgICAvLyBEbyBzb21lIGFzeW5jaHJvbm91cyBzdHVmZlxuICogICAgICByZXNvbHZlKCk7XG4gKiAgICB9KTtcbiAqICB9XG4gKlxuICogIEBOZ01vZHVsZSh7XG4gKiAgIGltcG9ydHM6IFtCcm93c2VyTW9kdWxlXSxcbiAqICAgZGVjbGFyYXRpb25zOiBbQXBwQ29tcG9uZW50XSxcbiAqICAgYm9vdHN0cmFwOiBbQXBwQ29tcG9uZW50XSxcbiAqICAgcHJvdmlkZXJzOiBbe1xuICogICAgIHByb3ZpZGU6IEFQUF9JTklUSUFMSVpFUixcbiAqICAgICB1c2VGYWN0b3J5OiAoKSA9PiBpbml0aWFsaXplQXBwLFxuICogICAgIG11bHRpOiB0cnVlXG4gKiAgICB9XVxuICogICB9KVxuICogIGV4cG9ydCBjbGFzcyBBcHBNb2R1bGUge31cbiAqIGBgYFxuICpcbiAqIEl0J3MgYWxzbyBwb3NzaWJsZSB0byBjb25maWd1cmUgYSBtdWx0aS1wcm92aWRlciB1c2luZyBgQVBQX0lOSVRJQUxJWkVSYCB0b2tlbiBhbmQgYSBmdW5jdGlvblxuICogcmV0dXJuaW5nIGFuIG9ic2VydmFibGUsIHNlZSBhbiBleGFtcGxlIGJlbG93LiBOb3RlOiB0aGUgYEh0dHBDbGllbnRgIGluIHRoaXMgZXhhbXBsZSBpcyB1c2VkIGZvclxuICogZGVtbyBwdXJwb3NlcyB0byBpbGx1c3RyYXRlIGhvdyB0aGUgZmFjdG9yeSBmdW5jdGlvbiBjYW4gd29yayB3aXRoIG90aGVyIHByb3ZpZGVycyBhdmFpbGFibGVcbiAqIHRocm91Z2ggREkuXG4gKlxuICogYGBgXG4gKiAgZnVuY3Rpb24gaW5pdGlhbGl6ZUFwcEZhY3RvcnkoaHR0cENsaWVudDogSHR0cENsaWVudCk6ICgpID0+IE9ic2VydmFibGU8YW55PiB7XG4gKiAgIHJldHVybiAoKSA9PiBodHRwQ2xpZW50LmdldChcImh0dHBzOi8vc29tZVVybC5jb20vYXBpL3VzZXJcIilcbiAqICAgICAucGlwZShcbiAqICAgICAgICB0YXAodXNlciA9PiB7IC4uLiB9KVxuICogICAgICk7XG4gKiAgfVxuICpcbiAqICBATmdNb2R1bGUoe1xuICogICAgaW1wb3J0czogW0Jyb3dzZXJNb2R1bGUsIEh0dHBDbGllbnRNb2R1bGVdLFxuICogICAgZGVjbGFyYXRpb25zOiBbQXBwQ29tcG9uZW50XSxcbiAqICAgIGJvb3RzdHJhcDogW0FwcENvbXBvbmVudF0sXG4gKiAgICBwcm92aWRlcnM6IFt7XG4gKiAgICAgIHByb3ZpZGU6IEFQUF9JTklUSUFMSVpFUixcbiAqICAgICAgdXNlRmFjdG9yeTogaW5pdGlhbGl6ZUFwcEZhY3RvcnksXG4gKiAgICAgIGRlcHM6IFtIdHRwQ2xpZW50XSxcbiAqICAgICAgbXVsdGk6IHRydWVcbiAqICAgIH1dXG4gKiAgfSlcbiAqICBleHBvcnQgY2xhc3MgQXBwTW9kdWxlIHt9XG4gKiBgYGBcbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBjb25zdCBBUFBfSU5JVElBTElaRVIgPVxuICAgIG5ldyBJbmplY3Rpb25Ub2tlbjxSZWFkb25seUFycmF5PCgpID0+IE9ic2VydmFibGU8dW5rbm93bj58IFByb21pc2U8dW5rbm93bj58IHZvaWQ+PihcbiAgICAgICAgJ0FwcGxpY2F0aW9uIEluaXRpYWxpemVyJyk7XG5cbi8qKlxuICogQSBjbGFzcyB0aGF0IHJlZmxlY3RzIHRoZSBzdGF0ZSBvZiBydW5uaW5nIHtAbGluayBBUFBfSU5JVElBTElaRVJ9IGZ1bmN0aW9ucy5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbkBJbmplY3RhYmxlKHtwcm92aWRlZEluOiAncm9vdCd9KVxuZXhwb3J0IGNsYXNzIEFwcGxpY2F0aW9uSW5pdFN0YXR1cyB7XG4gIC8vIFVzaW5nIG5vbiBudWxsIGFzc2VydGlvbiwgdGhlc2UgZmllbGRzIGFyZSBkZWZpbmVkIGJlbG93XG4gIC8vIHdpdGhpbiB0aGUgYG5ldyBQcm9taXNlYCBjYWxsYmFjayAoc3luY2hyb25vdXNseSkuXG4gIHByaXZhdGUgcmVzb2x2ZSE6ICguLi5hcmdzOiBhbnlbXSkgPT4gdm9pZDtcbiAgcHJpdmF0ZSByZWplY3QhOiAoLi4uYXJnczogYW55W10pID0+IHZvaWQ7XG5cbiAgcHJpdmF0ZSBpbml0aWFsaXplZCA9IGZhbHNlO1xuICBwdWJsaWMgcmVhZG9ubHkgZG9uZSA9IGZhbHNlO1xuICBwdWJsaWMgcmVhZG9ubHkgZG9uZVByb21pc2U6IFByb21pc2U8YW55PiA9IG5ldyBQcm9taXNlKChyZXMsIHJlaikgPT4ge1xuICAgIHRoaXMucmVzb2x2ZSA9IHJlcztcbiAgICB0aGlzLnJlamVjdCA9IHJlajtcbiAgfSk7XG5cbiAgLy8gVE9ETzogVGhyb3cgUnVudGltZUVycm9yQ29kZS5JTlZBTElEX01VTFRJX1BST1ZJREVSIGlmIGFwcEluaXRzIGlzIG5vdCBhbiBhcnJheVxuICBwcml2YXRlIHJlYWRvbmx5IGFwcEluaXRzID0gaW5qZWN0KEFQUF9JTklUSUFMSVpFUiwge29wdGlvbmFsOiB0cnVlfSkgPz8gW107XG5cbiAgLyoqIEBpbnRlcm5hbCAqL1xuICBydW5Jbml0aWFsaXplcnMoKSB7XG4gICAgaWYgKHRoaXMuaW5pdGlhbGl6ZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBhc3luY0luaXRQcm9taXNlcyA9IFtdO1xuICAgIGZvciAoY29uc3QgYXBwSW5pdHMgb2YgdGhpcy5hcHBJbml0cykge1xuICAgICAgY29uc3QgaW5pdFJlc3VsdCA9IGFwcEluaXRzKCk7XG4gICAgICBpZiAoaXNQcm9taXNlKGluaXRSZXN1bHQpKSB7XG4gICAgICAgIGFzeW5jSW5pdFByb21pc2VzLnB1c2goaW5pdFJlc3VsdCk7XG4gICAgICB9IGVsc2UgaWYgKGlzT2JzZXJ2YWJsZShpbml0UmVzdWx0KSkge1xuICAgICAgICBjb25zdCBvYnNlcnZhYmxlQXNQcm9taXNlID0gbmV3IFByb21pc2U8dm9pZD4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgIGluaXRSZXN1bHQuc3Vic2NyaWJlKHtjb21wbGV0ZTogcmVzb2x2ZSwgZXJyb3I6IHJlamVjdH0pO1xuICAgICAgICB9KTtcbiAgICAgICAgYXN5bmNJbml0UHJvbWlzZXMucHVzaChvYnNlcnZhYmxlQXNQcm9taXNlKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCBjb21wbGV0ZSA9ICgpID0+IHtcbiAgICAgIC8vIEB0cy1leHBlY3QtZXJyb3Igb3ZlcndyaXRpbmcgYSByZWFkb25seVxuICAgICAgdGhpcy5kb25lID0gdHJ1ZTtcbiAgICAgIHRoaXMucmVzb2x2ZSgpO1xuICAgIH07XG5cbiAgICBQcm9taXNlLmFsbChhc3luY0luaXRQcm9taXNlcylcbiAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgIGNvbXBsZXRlKCk7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChlID0+IHtcbiAgICAgICAgICB0aGlzLnJlamVjdChlKTtcbiAgICAgICAgfSk7XG5cbiAgICBpZiAoYXN5bmNJbml0UHJvbWlzZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICBjb21wbGV0ZSgpO1xuICAgIH1cbiAgICB0aGlzLmluaXRpYWxpemVkID0gdHJ1ZTtcbiAgfVxufVxuIl19