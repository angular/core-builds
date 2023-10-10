import { inject, Injectable, InjectionToken } from './di';
import { RuntimeError } from './errors';
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
 * @see {@link ApplicationInitStatus}
 *
 * @usageNotes
 *
 * The following example illustrates how to configure a multi-provider using `APP_INITIALIZER` token
 * and a function returning a promise.
 * ### Example with NgModule-based application
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
 * ### Example with standalone application
 * ```
 * export function initializeApp(http: HttpClient) {
 *   return (): Promise<any> =>
 *     firstValueFrom(
 *       http
 *         .get("https://someUrl.com/api/user")
 *         .pipe(tap(user => { ... }))
 *     );
 * }
 *
 * bootstrapApplication(App, {
 *   providers: [
 *     provideHttpClient(),
 *     {
 *       provide: APP_INITIALIZER,
 *       useFactory: initializeApp,
 *       multi: true,
 *       deps: [HttpClient],
 *     },
 *   ],
 * });

 * ```
 *
 *
 * It's also possible to configure a multi-provider using `APP_INITIALIZER` token and a function
 * returning an observable, see an example below. Note: the `HttpClient` in this example is used for
 * demo purposes to illustrate how the factory function can work with other providers available
 * through DI.
 *
 * ### Example with NgModule-based application
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
 * ### Example with standalone application
 *
 *  function initializeAppFactory(httpClient: HttpClient): () => Observable<any> {
 *   return () => httpClient.get("https://someUrl.com/api/user")
 *     .pipe(
 *        tap(user => { ... })
 *     );
 *  }
 *
 * bootstrapApplication(App, {
 *   providers: [
 *     provideHttpClient(),
 *     {
 *       provide: APP_INITIALIZER,
 *       useFactory: initializeApp,
 *       multi: true,
 *       deps: [HttpClient],
 *     },
 *   ],
 * });
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
    constructor() {
        this.initialized = false;
        this.done = false;
        this.donePromise = new Promise((res, rej) => {
            this.resolve = res;
            this.reject = rej;
        });
        this.appInits = inject(APP_INITIALIZER, { optional: true }) ?? [];
        if ((typeof ngDevMode === 'undefined' || ngDevMode) && !Array.isArray(this.appInits)) {
            throw new RuntimeError(-209 /* RuntimeErrorCode.INVALID_MULTI_PROVIDER */, 'Unexpected type of the `APP_INITIALIZER` token value ' +
                `(expected an array, but got ${typeof this.appInits}). ` +
                'Please check that the `APP_INITIALIZER` token is configured as a ' +
                '`multi: true` provider.');
        }
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
    static { this.ɵfac = function ApplicationInitStatus_Factory(t) { return new (t || ApplicationInitStatus)(); }; }
    static { this.ɵprov = /*@__PURE__*/ i0.ɵɵdefineInjectable({ token: ApplicationInitStatus, factory: ApplicationInitStatus.ɵfac, providedIn: 'root' }); }
}
(function () { (typeof ngDevMode === "undefined" || ngDevMode) && i0.setClassMetadata(ApplicationInitStatus, [{
        type: Injectable,
        args: [{ providedIn: 'root' }]
    }], function () { return []; }, null); })();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwbGljYXRpb25faW5pdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL2FwcGxpY2F0aW9uX2luaXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBVUEsT0FBTyxFQUFDLE1BQU0sRUFBRSxVQUFVLEVBQUUsY0FBYyxFQUFDLE1BQU0sTUFBTSxDQUFDO0FBQ3hELE9BQU8sRUFBQyxZQUFZLEVBQW1CLE1BQU0sVUFBVSxDQUFDO0FBQ3hELE9BQU8sRUFBQyxTQUFTLEVBQUUsY0FBYyxFQUFDLE1BQU0sYUFBYSxDQUFDOztBQUV0RDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBcUhHO0FBQ0gsTUFBTSxDQUFDLE1BQU0sZUFBZSxHQUN4QixJQUFJLGNBQWMsQ0FDZCx5QkFBeUIsQ0FBQyxDQUFDO0FBRW5DOzs7O0dBSUc7QUFFSCxNQUFNLE9BQU8scUJBQXFCO0lBZWhDO1FBVFEsZ0JBQVcsR0FBRyxLQUFLLENBQUM7UUFDWixTQUFJLEdBQUcsS0FBSyxDQUFDO1FBQ2IsZ0JBQVcsR0FBaUIsSUFBSSxPQUFPLENBQUMsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLEVBQUU7WUFDbkUsSUFBSSxDQUFDLE9BQU8sR0FBRyxHQUFHLENBQUM7WUFDbkIsSUFBSSxDQUFDLE1BQU0sR0FBRyxHQUFHLENBQUM7UUFDcEIsQ0FBQyxDQUFDLENBQUM7UUFFYyxhQUFRLEdBQUcsTUFBTSxDQUFDLGVBQWUsRUFBRSxFQUFDLFFBQVEsRUFBRSxJQUFJLEVBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUcxRSxJQUFJLENBQUMsT0FBTyxTQUFTLEtBQUssV0FBVyxJQUFJLFNBQVMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUU7WUFDcEYsTUFBTSxJQUFJLFlBQVkscURBRWxCLHVEQUF1RDtnQkFDbkQsK0JBQStCLE9BQU8sSUFBSSxDQUFDLFFBQVEsS0FBSztnQkFDeEQsbUVBQW1FO2dCQUNuRSx5QkFBeUIsQ0FBQyxDQUFDO1NBQ3BDO0lBQ0gsQ0FBQztJQUVELGdCQUFnQjtJQUNoQixlQUFlO1FBQ2IsSUFBSSxJQUFJLENBQUMsV0FBVyxFQUFFO1lBQ3BCLE9BQU87U0FDUjtRQUVELE1BQU0saUJBQWlCLEdBQUcsRUFBRSxDQUFDO1FBQzdCLEtBQUssTUFBTSxRQUFRLElBQUksSUFBSSxDQUFDLFFBQVEsRUFBRTtZQUNwQyxNQUFNLFVBQVUsR0FBRyxRQUFRLEVBQUUsQ0FBQztZQUM5QixJQUFJLFNBQVMsQ0FBQyxVQUFVLENBQUMsRUFBRTtnQkFDekIsaUJBQWlCLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO2FBQ3BDO2lCQUFNLElBQUksY0FBYyxDQUFDLFVBQVUsQ0FBQyxFQUFFO2dCQUNyQyxNQUFNLG1CQUFtQixHQUFHLElBQUksT0FBTyxDQUFPLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxFQUFFO29CQUNoRSxVQUFVLENBQUMsU0FBUyxDQUFDLEVBQUMsUUFBUSxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFDLENBQUMsQ0FBQztnQkFDM0QsQ0FBQyxDQUFDLENBQUM7Z0JBQ0gsaUJBQWlCLENBQUMsSUFBSSxDQUFDLG1CQUFtQixDQUFDLENBQUM7YUFDN0M7U0FDRjtRQUVELE1BQU0sUUFBUSxHQUFHLEdBQUcsRUFBRTtZQUNwQiwwQ0FBMEM7WUFDMUMsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7WUFDakIsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ2pCLENBQUMsQ0FBQztRQUVGLE9BQU8sQ0FBQyxHQUFHLENBQUMsaUJBQWlCLENBQUM7YUFDekIsSUFBSSxDQUFDLEdBQUcsRUFBRTtZQUNULFFBQVEsRUFBRSxDQUFDO1FBQ2IsQ0FBQyxDQUFDO2FBQ0QsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFO1lBQ1QsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNqQixDQUFDLENBQUMsQ0FBQztRQUVQLElBQUksaUJBQWlCLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRTtZQUNsQyxRQUFRLEVBQUUsQ0FBQztTQUNaO1FBQ0QsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUM7SUFDMUIsQ0FBQztzRkEvRFUscUJBQXFCO3VFQUFyQixxQkFBcUIsV0FBckIscUJBQXFCLG1CQURULE1BQU07O3NGQUNsQixxQkFBcUI7Y0FEakMsVUFBVTtlQUFDLEVBQUMsVUFBVSxFQUFFLE1BQU0sRUFBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge09ic2VydmFibGV9IGZyb20gJ3J4anMnO1xuXG5pbXBvcnQge2luamVjdCwgSW5qZWN0YWJsZSwgSW5qZWN0aW9uVG9rZW59IGZyb20gJy4vZGknO1xuaW1wb3J0IHtSdW50aW1lRXJyb3IsIFJ1bnRpbWVFcnJvckNvZGV9IGZyb20gJy4vZXJyb3JzJztcbmltcG9ydCB7aXNQcm9taXNlLCBpc1N1YnNjcmliYWJsZX0gZnJvbSAnLi91dGlsL2xhbmcnO1xuXG4vKipcbiAqIEEgW0RJIHRva2VuXShndWlkZS9nbG9zc2FyeSNkaS10b2tlbiBcIkRJIHRva2VuIGRlZmluaXRpb25cIikgdGhhdCB5b3UgY2FuIHVzZSB0byBwcm92aWRlXG4gKiBvbmUgb3IgbW9yZSBpbml0aWFsaXphdGlvbiBmdW5jdGlvbnMuXG4gKlxuICogVGhlIHByb3ZpZGVkIGZ1bmN0aW9ucyBhcmUgaW5qZWN0ZWQgYXQgYXBwbGljYXRpb24gc3RhcnR1cCBhbmQgZXhlY3V0ZWQgZHVyaW5nXG4gKiBhcHAgaW5pdGlhbGl6YXRpb24uIElmIGFueSBvZiB0aGVzZSBmdW5jdGlvbnMgcmV0dXJucyBhIFByb21pc2Ugb3IgYW4gT2JzZXJ2YWJsZSwgaW5pdGlhbGl6YXRpb25cbiAqIGRvZXMgbm90IGNvbXBsZXRlIHVudGlsIHRoZSBQcm9taXNlIGlzIHJlc29sdmVkIG9yIHRoZSBPYnNlcnZhYmxlIGlzIGNvbXBsZXRlZC5cbiAqXG4gKiBZb3UgY2FuLCBmb3IgZXhhbXBsZSwgY3JlYXRlIGEgZmFjdG9yeSBmdW5jdGlvbiB0aGF0IGxvYWRzIGxhbmd1YWdlIGRhdGFcbiAqIG9yIGFuIGV4dGVybmFsIGNvbmZpZ3VyYXRpb24sIGFuZCBwcm92aWRlIHRoYXQgZnVuY3Rpb24gdG8gdGhlIGBBUFBfSU5JVElBTElaRVJgIHRva2VuLlxuICogVGhlIGZ1bmN0aW9uIGlzIGV4ZWN1dGVkIGR1cmluZyB0aGUgYXBwbGljYXRpb24gYm9vdHN0cmFwIHByb2Nlc3MsXG4gKiBhbmQgdGhlIG5lZWRlZCBkYXRhIGlzIGF2YWlsYWJsZSBvbiBzdGFydHVwLlxuICpcbiAqIEBzZWUge0BsaW5rIEFwcGxpY2F0aW9uSW5pdFN0YXR1c31cbiAqXG4gKiBAdXNhZ2VOb3Rlc1xuICpcbiAqIFRoZSBmb2xsb3dpbmcgZXhhbXBsZSBpbGx1c3RyYXRlcyBob3cgdG8gY29uZmlndXJlIGEgbXVsdGktcHJvdmlkZXIgdXNpbmcgYEFQUF9JTklUSUFMSVpFUmAgdG9rZW5cbiAqIGFuZCBhIGZ1bmN0aW9uIHJldHVybmluZyBhIHByb21pc2UuXG4gKiAjIyMgRXhhbXBsZSB3aXRoIE5nTW9kdWxlLWJhc2VkIGFwcGxpY2F0aW9uXG4gKiBgYGBcbiAqICBmdW5jdGlvbiBpbml0aWFsaXplQXBwKCk6IFByb21pc2U8YW55PiB7XG4gKiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICogICAgICAvLyBEbyBzb21lIGFzeW5jaHJvbm91cyBzdHVmZlxuICogICAgICByZXNvbHZlKCk7XG4gKiAgICB9KTtcbiAqICB9XG4gKlxuICogIEBOZ01vZHVsZSh7XG4gKiAgIGltcG9ydHM6IFtCcm93c2VyTW9kdWxlXSxcbiAqICAgZGVjbGFyYXRpb25zOiBbQXBwQ29tcG9uZW50XSxcbiAqICAgYm9vdHN0cmFwOiBbQXBwQ29tcG9uZW50XSxcbiAqICAgcHJvdmlkZXJzOiBbe1xuICogICAgIHByb3ZpZGU6IEFQUF9JTklUSUFMSVpFUixcbiAqICAgICB1c2VGYWN0b3J5OiAoKSA9PiBpbml0aWFsaXplQXBwLFxuICogICAgIG11bHRpOiB0cnVlXG4gKiAgICB9XVxuICogICB9KVxuICogIGV4cG9ydCBjbGFzcyBBcHBNb2R1bGUge31cbiAqIGBgYFxuICpcbiAqICMjIyBFeGFtcGxlIHdpdGggc3RhbmRhbG9uZSBhcHBsaWNhdGlvblxuICogYGBgXG4gKiBleHBvcnQgZnVuY3Rpb24gaW5pdGlhbGl6ZUFwcChodHRwOiBIdHRwQ2xpZW50KSB7XG4gKiAgIHJldHVybiAoKTogUHJvbWlzZTxhbnk+ID0+XG4gKiAgICAgZmlyc3RWYWx1ZUZyb20oXG4gKiAgICAgICBodHRwXG4gKiAgICAgICAgIC5nZXQoXCJodHRwczovL3NvbWVVcmwuY29tL2FwaS91c2VyXCIpXG4gKiAgICAgICAgIC5waXBlKHRhcCh1c2VyID0+IHsgLi4uIH0pKVxuICogICAgICk7XG4gKiB9XG4gKlxuICogYm9vdHN0cmFwQXBwbGljYXRpb24oQXBwLCB7XG4gKiAgIHByb3ZpZGVyczogW1xuICogICAgIHByb3ZpZGVIdHRwQ2xpZW50KCksXG4gKiAgICAge1xuICogICAgICAgcHJvdmlkZTogQVBQX0lOSVRJQUxJWkVSLFxuICogICAgICAgdXNlRmFjdG9yeTogaW5pdGlhbGl6ZUFwcCxcbiAqICAgICAgIG11bHRpOiB0cnVlLFxuICogICAgICAgZGVwczogW0h0dHBDbGllbnRdLFxuICogICAgIH0sXG4gKiAgIF0sXG4gKiB9KTtcblxuICogYGBgXG4gKlxuICpcbiAqIEl0J3MgYWxzbyBwb3NzaWJsZSB0byBjb25maWd1cmUgYSBtdWx0aS1wcm92aWRlciB1c2luZyBgQVBQX0lOSVRJQUxJWkVSYCB0b2tlbiBhbmQgYSBmdW5jdGlvblxuICogcmV0dXJuaW5nIGFuIG9ic2VydmFibGUsIHNlZSBhbiBleGFtcGxlIGJlbG93LiBOb3RlOiB0aGUgYEh0dHBDbGllbnRgIGluIHRoaXMgZXhhbXBsZSBpcyB1c2VkIGZvclxuICogZGVtbyBwdXJwb3NlcyB0byBpbGx1c3RyYXRlIGhvdyB0aGUgZmFjdG9yeSBmdW5jdGlvbiBjYW4gd29yayB3aXRoIG90aGVyIHByb3ZpZGVycyBhdmFpbGFibGVcbiAqIHRocm91Z2ggREkuXG4gKlxuICogIyMjIEV4YW1wbGUgd2l0aCBOZ01vZHVsZS1iYXNlZCBhcHBsaWNhdGlvblxuICogYGBgXG4gKiAgZnVuY3Rpb24gaW5pdGlhbGl6ZUFwcEZhY3RvcnkoaHR0cENsaWVudDogSHR0cENsaWVudCk6ICgpID0+IE9ic2VydmFibGU8YW55PiB7XG4gKiAgIHJldHVybiAoKSA9PiBodHRwQ2xpZW50LmdldChcImh0dHBzOi8vc29tZVVybC5jb20vYXBpL3VzZXJcIilcbiAqICAgICAucGlwZShcbiAqICAgICAgICB0YXAodXNlciA9PiB7IC4uLiB9KVxuICogICAgICk7XG4gKiAgfVxuICpcbiAqICBATmdNb2R1bGUoe1xuICogICAgaW1wb3J0czogW0Jyb3dzZXJNb2R1bGUsIEh0dHBDbGllbnRNb2R1bGVdLFxuICogICAgZGVjbGFyYXRpb25zOiBbQXBwQ29tcG9uZW50XSxcbiAqICAgIGJvb3RzdHJhcDogW0FwcENvbXBvbmVudF0sXG4gKiAgICBwcm92aWRlcnM6IFt7XG4gKiAgICAgIHByb3ZpZGU6IEFQUF9JTklUSUFMSVpFUixcbiAqICAgICAgdXNlRmFjdG9yeTogaW5pdGlhbGl6ZUFwcEZhY3RvcnksXG4gKiAgICAgIGRlcHM6IFtIdHRwQ2xpZW50XSxcbiAqICAgICAgbXVsdGk6IHRydWVcbiAqICAgIH1dXG4gKiAgfSlcbiAqICBleHBvcnQgY2xhc3MgQXBwTW9kdWxlIHt9XG4gKiBgYGBcbiAqXG4gKiAjIyMgRXhhbXBsZSB3aXRoIHN0YW5kYWxvbmUgYXBwbGljYXRpb25cbiAqXG4gKiAgZnVuY3Rpb24gaW5pdGlhbGl6ZUFwcEZhY3RvcnkoaHR0cENsaWVudDogSHR0cENsaWVudCk6ICgpID0+IE9ic2VydmFibGU8YW55PiB7XG4gKiAgIHJldHVybiAoKSA9PiBodHRwQ2xpZW50LmdldChcImh0dHBzOi8vc29tZVVybC5jb20vYXBpL3VzZXJcIilcbiAqICAgICAucGlwZShcbiAqICAgICAgICB0YXAodXNlciA9PiB7IC4uLiB9KVxuICogICAgICk7XG4gKiAgfVxuICpcbiAqIGJvb3RzdHJhcEFwcGxpY2F0aW9uKEFwcCwge1xuICogICBwcm92aWRlcnM6IFtcbiAqICAgICBwcm92aWRlSHR0cENsaWVudCgpLFxuICogICAgIHtcbiAqICAgICAgIHByb3ZpZGU6IEFQUF9JTklUSUFMSVpFUixcbiAqICAgICAgIHVzZUZhY3Rvcnk6IGluaXRpYWxpemVBcHAsXG4gKiAgICAgICBtdWx0aTogdHJ1ZSxcbiAqICAgICAgIGRlcHM6IFtIdHRwQ2xpZW50XSxcbiAqICAgICB9LFxuICogICBdLFxuICogfSk7XG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgY29uc3QgQVBQX0lOSVRJQUxJWkVSID1cbiAgICBuZXcgSW5qZWN0aW9uVG9rZW48UmVhZG9ubHlBcnJheTwoKSA9PiBPYnNlcnZhYmxlPHVua25vd24+fCBQcm9taXNlPHVua25vd24+fCB2b2lkPj4oXG4gICAgICAgICdBcHBsaWNhdGlvbiBJbml0aWFsaXplcicpO1xuXG4vKipcbiAqIEEgY2xhc3MgdGhhdCByZWZsZWN0cyB0aGUgc3RhdGUgb2YgcnVubmluZyB7QGxpbmsgQVBQX0lOSVRJQUxJWkVSfSBmdW5jdGlvbnMuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5ASW5qZWN0YWJsZSh7cHJvdmlkZWRJbjogJ3Jvb3QnfSlcbmV4cG9ydCBjbGFzcyBBcHBsaWNhdGlvbkluaXRTdGF0dXMge1xuICAvLyBVc2luZyBub24gbnVsbCBhc3NlcnRpb24sIHRoZXNlIGZpZWxkcyBhcmUgZGVmaW5lZCBiZWxvd1xuICAvLyB3aXRoaW4gdGhlIGBuZXcgUHJvbWlzZWAgY2FsbGJhY2sgKHN5bmNocm9ub3VzbHkpLlxuICBwcml2YXRlIHJlc29sdmUhOiAoLi4uYXJnczogYW55W10pID0+IHZvaWQ7XG4gIHByaXZhdGUgcmVqZWN0ITogKC4uLmFyZ3M6IGFueVtdKSA9PiB2b2lkO1xuXG4gIHByaXZhdGUgaW5pdGlhbGl6ZWQgPSBmYWxzZTtcbiAgcHVibGljIHJlYWRvbmx5IGRvbmUgPSBmYWxzZTtcbiAgcHVibGljIHJlYWRvbmx5IGRvbmVQcm9taXNlOiBQcm9taXNlPGFueT4gPSBuZXcgUHJvbWlzZSgocmVzLCByZWopID0+IHtcbiAgICB0aGlzLnJlc29sdmUgPSByZXM7XG4gICAgdGhpcy5yZWplY3QgPSByZWo7XG4gIH0pO1xuXG4gIHByaXZhdGUgcmVhZG9ubHkgYXBwSW5pdHMgPSBpbmplY3QoQVBQX0lOSVRJQUxJWkVSLCB7b3B0aW9uYWw6IHRydWV9KSA/PyBbXTtcblxuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBpZiAoKHR5cGVvZiBuZ0Rldk1vZGUgPT09ICd1bmRlZmluZWQnIHx8IG5nRGV2TW9kZSkgJiYgIUFycmF5LmlzQXJyYXkodGhpcy5hcHBJbml0cykpIHtcbiAgICAgIHRocm93IG5ldyBSdW50aW1lRXJyb3IoXG4gICAgICAgICAgUnVudGltZUVycm9yQ29kZS5JTlZBTElEX01VTFRJX1BST1ZJREVSLFxuICAgICAgICAgICdVbmV4cGVjdGVkIHR5cGUgb2YgdGhlIGBBUFBfSU5JVElBTElaRVJgIHRva2VuIHZhbHVlICcgK1xuICAgICAgICAgICAgICBgKGV4cGVjdGVkIGFuIGFycmF5LCBidXQgZ290ICR7dHlwZW9mIHRoaXMuYXBwSW5pdHN9KS4gYCArXG4gICAgICAgICAgICAgICdQbGVhc2UgY2hlY2sgdGhhdCB0aGUgYEFQUF9JTklUSUFMSVpFUmAgdG9rZW4gaXMgY29uZmlndXJlZCBhcyBhICcgK1xuICAgICAgICAgICAgICAnYG11bHRpOiB0cnVlYCBwcm92aWRlci4nKTtcbiAgICB9XG4gIH1cblxuICAvKiogQGludGVybmFsICovXG4gIHJ1bkluaXRpYWxpemVycygpIHtcbiAgICBpZiAodGhpcy5pbml0aWFsaXplZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGFzeW5jSW5pdFByb21pc2VzID0gW107XG4gICAgZm9yIChjb25zdCBhcHBJbml0cyBvZiB0aGlzLmFwcEluaXRzKSB7XG4gICAgICBjb25zdCBpbml0UmVzdWx0ID0gYXBwSW5pdHMoKTtcbiAgICAgIGlmIChpc1Byb21pc2UoaW5pdFJlc3VsdCkpIHtcbiAgICAgICAgYXN5bmNJbml0UHJvbWlzZXMucHVzaChpbml0UmVzdWx0KTtcbiAgICAgIH0gZWxzZSBpZiAoaXNTdWJzY3JpYmFibGUoaW5pdFJlc3VsdCkpIHtcbiAgICAgICAgY29uc3Qgb2JzZXJ2YWJsZUFzUHJvbWlzZSA9IG5ldyBQcm9taXNlPHZvaWQ+KChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICBpbml0UmVzdWx0LnN1YnNjcmliZSh7Y29tcGxldGU6IHJlc29sdmUsIGVycm9yOiByZWplY3R9KTtcbiAgICAgICAgfSk7XG4gICAgICAgIGFzeW5jSW5pdFByb21pc2VzLnB1c2gob2JzZXJ2YWJsZUFzUHJvbWlzZSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgY29tcGxldGUgPSAoKSA9PiB7XG4gICAgICAvLyBAdHMtZXhwZWN0LWVycm9yIG92ZXJ3cml0aW5nIGEgcmVhZG9ubHlcbiAgICAgIHRoaXMuZG9uZSA9IHRydWU7XG4gICAgICB0aGlzLnJlc29sdmUoKTtcbiAgICB9O1xuXG4gICAgUHJvbWlzZS5hbGwoYXN5bmNJbml0UHJvbWlzZXMpXG4gICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICBjb21wbGV0ZSgpO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZSA9PiB7XG4gICAgICAgICAgdGhpcy5yZWplY3QoZSk7XG4gICAgICAgIH0pO1xuXG4gICAgaWYgKGFzeW5jSW5pdFByb21pc2VzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgY29tcGxldGUoKTtcbiAgICB9XG4gICAgdGhpcy5pbml0aWFsaXplZCA9IHRydWU7XG4gIH1cbn1cbiJdfQ==