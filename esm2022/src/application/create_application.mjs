/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { provideZoneChangeDetection } from '../change_detection/scheduling/ng_zone_scheduling';
import { ErrorHandler } from '../error_handler';
import { RuntimeError } from '../errors';
import { DEFAULT_LOCALE_ID } from '../i18n/localization';
import { LOCALE_ID } from '../i18n/tokens';
import { ImagePerformanceWarning } from '../image_performance_warning';
import { createOrReusePlatformInjector } from '../platform/platform';
import { PLATFORM_DESTROY_LISTENERS } from '../platform/platform_ref';
import { assertStandaloneComponentType } from '../render3/errors';
import { setLocaleId } from '../render3/i18n/i18n_locale_id';
import { EnvironmentNgModuleRefAdapter } from '../render3/ng_module_ref';
import { NgZone } from '../zone/ng_zone';
import { ApplicationInitStatus } from './application_init';
import { _callAndReportToErrorHandler, ApplicationRef } from './application_ref';
/**
 * Internal create application API that implements the core application creation logic and optional
 * bootstrap logic.
 *
 * Platforms (such as `platform-browser`) may require different set of application and platform
 * providers for an application to function correctly. As a result, platforms may use this function
 * internally and supply the necessary providers during the bootstrap, while exposing
 * platform-specific APIs as a part of their public API.
 *
 * @returns A promise that returns an `ApplicationRef` instance once resolved.
 */
export function internalCreateApplication(config) {
    try {
        const { rootComponent, appProviders, platformProviders } = config;
        if ((typeof ngDevMode === 'undefined' || ngDevMode) && rootComponent !== undefined) {
            assertStandaloneComponentType(rootComponent);
        }
        const platformInjector = createOrReusePlatformInjector(platformProviders);
        // Create root application injector based on a set of providers configured at the platform
        // bootstrap level as well as providers passed to the bootstrap call by a user.
        const allAppProviders = [provideZoneChangeDetection(), ...(appProviders || [])];
        const adapter = new EnvironmentNgModuleRefAdapter({
            providers: allAppProviders,
            parent: platformInjector,
            debugName: typeof ngDevMode === 'undefined' || ngDevMode ? 'Environment Injector' : '',
            // We skip environment initializers because we need to run them inside the NgZone, which
            // happens after we get the NgZone instance from the Injector.
            runEnvironmentInitializers: false,
        });
        const envInjector = adapter.injector;
        const ngZone = envInjector.get(NgZone);
        return ngZone.run(() => {
            envInjector.resolveInjectorInitializers();
            const exceptionHandler = envInjector.get(ErrorHandler, null);
            if ((typeof ngDevMode === 'undefined' || ngDevMode) && !exceptionHandler) {
                throw new RuntimeError(402 /* RuntimeErrorCode.MISSING_REQUIRED_INJECTABLE_IN_BOOTSTRAP */, 'No `ErrorHandler` found in the Dependency Injection tree.');
            }
            let onErrorSubscription;
            ngZone.runOutsideAngular(() => {
                onErrorSubscription = ngZone.onError.subscribe({
                    next: (error) => {
                        exceptionHandler.handleError(error);
                    },
                });
            });
            // If the whole platform is destroyed, invoke the `destroy` method
            // for all bootstrapped applications as well.
            const destroyListener = () => envInjector.destroy();
            const onPlatformDestroyListeners = platformInjector.get(PLATFORM_DESTROY_LISTENERS);
            onPlatformDestroyListeners.add(destroyListener);
            envInjector.onDestroy(() => {
                onErrorSubscription.unsubscribe();
                onPlatformDestroyListeners.delete(destroyListener);
            });
            return _callAndReportToErrorHandler(exceptionHandler, ngZone, () => {
                const initStatus = envInjector.get(ApplicationInitStatus);
                initStatus.runInitializers();
                return initStatus.donePromise.then(() => {
                    const localeId = envInjector.get(LOCALE_ID, DEFAULT_LOCALE_ID);
                    setLocaleId(localeId || DEFAULT_LOCALE_ID);
                    const appRef = envInjector.get(ApplicationRef);
                    if (rootComponent !== undefined) {
                        appRef.bootstrap(rootComponent);
                    }
                    if (typeof ngDevMode === 'undefined' || ngDevMode) {
                        const imagePerformanceService = envInjector.get(ImagePerformanceWarning);
                        imagePerformanceService.start();
                    }
                    return appRef;
                });
            });
        });
    }
    catch (e) {
        return Promise.reject(e);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3JlYXRlX2FwcGxpY2F0aW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvYXBwbGljYXRpb24vY3JlYXRlX2FwcGxpY2F0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUlILE9BQU8sRUFBQywwQkFBMEIsRUFBQyxNQUFNLG1EQUFtRCxDQUFDO0FBRzdGLE9BQU8sRUFBQyxZQUFZLEVBQUMsTUFBTSxrQkFBa0IsQ0FBQztBQUM5QyxPQUFPLEVBQUMsWUFBWSxFQUFtQixNQUFNLFdBQVcsQ0FBQztBQUN6RCxPQUFPLEVBQUMsaUJBQWlCLEVBQUMsTUFBTSxzQkFBc0IsQ0FBQztBQUN2RCxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFDekMsT0FBTyxFQUFDLHVCQUF1QixFQUFDLE1BQU0sOEJBQThCLENBQUM7QUFFckUsT0FBTyxFQUFDLDZCQUE2QixFQUFDLE1BQU0sc0JBQXNCLENBQUM7QUFDbkUsT0FBTyxFQUFDLDBCQUEwQixFQUFDLE1BQU0sMEJBQTBCLENBQUM7QUFDcEUsT0FBTyxFQUFDLDZCQUE2QixFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDaEUsT0FBTyxFQUFDLFdBQVcsRUFBQyxNQUFNLGdDQUFnQyxDQUFDO0FBQzNELE9BQU8sRUFBQyw2QkFBNkIsRUFBQyxNQUFNLDBCQUEwQixDQUFDO0FBQ3ZFLE9BQU8sRUFBQyxNQUFNLEVBQUMsTUFBTSxpQkFBaUIsQ0FBQztBQUV2QyxPQUFPLEVBQUMscUJBQXFCLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUN6RCxPQUFPLEVBQUMsNEJBQTRCLEVBQUUsY0FBYyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFFL0U7Ozs7Ozs7Ozs7R0FVRztBQUVILE1BQU0sVUFBVSx5QkFBeUIsQ0FBQyxNQUl6QztJQUNDLElBQUksQ0FBQztRQUNILE1BQU0sRUFBQyxhQUFh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LENBQUMsQ0FBQztvQkFFM0MsTUFBTSxNQUFNLEdBQUcsV0FBVyxDQUFDLEdBQUcsQ0FBQyxjQUFjLENBQUMsQ0FBQztvQkFDL0MsSUFBSSxhQUFhLEtBQUssU0FBUyxFQUFFLENBQUM7d0JBQ2hDLE1BQU0sQ0FBQyxTQUFTLENBQUMsYUFBYSxDQUFDLENBQUM7b0JBQ2xDLENBQUM7b0JBQ0QsSUFBSSxPQUFPLFNBQVMsS0FBSyxXQUFXLElBQUksU0FBUyxFQUFFLENBQUM7d0JBQ2xELE1BQU0sdUJBQXVCLEdBQUcsV0FBVyxDQUFDLEdBQUcsQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDO3dCQUN6RSx1QkFBdUIsQ0FBQyxLQUFLLEVBQUUsQ0FBQztvQkFDbEMsQ0FBQztvQkFDRCxPQUFPLE1BQU0sQ0FBQztnQkFDaEIsQ0FBQyxDQUFDLENBQUM7WUFDTCxDQUFDLENBQUMsQ0FBQztRQUNMLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7UUFDWCxPQUFPLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDM0IsQ0FBQztBQUNILENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtTdWJzY3JpcHRpb259IGZyb20gJ3J4anMnO1xuXG5pbXBvcnQge3Byb3ZpZGVab25lQ2hhbmdlRGV0ZWN0aW9ufSBmcm9tICcuLi9jaGFuZ2VfZGV0ZWN0aW9uL3NjaGVkdWxpbmcvbmdfem9uZV9zY2hlZHVsaW5nJztcbmltcG9ydCB7RW52aXJvbm1lbnRQcm92aWRlcnMsIFByb3ZpZGVyLCBTdGF0aWNQcm92aWRlcn0gZnJvbSAnLi4vZGkvaW50ZXJmYWNlL3Byb3ZpZGVyJztcbmltcG9ydCB7RW52aXJvbm1lbnRJbmplY3Rvcn0gZnJvbSAnLi4vZGkvcjNfaW5qZWN0b3InO1xuaW1wb3J0IHtFcnJvckhhbmRsZXJ9IGZyb20gJy4uL2Vycm9yX2hhbmRsZXInO1xuaW1wb3J0IHtSdW50aW1lRXJyb3IsIFJ1bnRpbWVFcnJvckNvZGV9IGZyb20gJy4uL2Vycm9ycyc7XG5pbXBvcnQge0RFRkFVTFRfTE9DQUxFX0lEfSBmcm9tICcuLi9pMThuL2xvY2FsaXphdGlvbic7XG5pbXBvcnQge0xPQ0FMRV9JRH0gZnJvbSAnLi4vaTE4bi90b2tlbnMnO1xuaW1wb3J0IHtJbWFnZVBlcmZvcm1hbmNlV2FybmluZ30gZnJvbSAnLi4vaW1hZ2VfcGVyZm9ybWFuY2Vfd2FybmluZyc7XG5pbXBvcnQge1R5cGV9IGZyb20gJy4uL2ludGVyZmFjZS90eXBlJztcbmltcG9ydCB7Y3JlYXRlT3JSZXVzZVBsYXRmb3JtSW5qZWN0b3J9IGZyb20gJy4uL3BsYXRmb3JtL3BsYXRmb3JtJztcbmltcG9ydCB7UExBVEZPUk1fREVTVFJPWV9MSVNURU5FUlN9IGZyb20gJy4uL3BsYXRmb3JtL3BsYXRmb3JtX3JlZic7XG5pbXBvcnQge2Fzc2VydFN0YW5kYWxvbmVDb21wb25lbnRUeXBlfSBmcm9tICcuLi9yZW5kZXIzL2Vycm9ycyc7XG5pbXBvcnQge3NldExvY2FsZUlkfSBmcm9tICcuLi9yZW5kZXIzL2kxOG4vaTE4bl9sb2NhbGVfaWQnO1xuaW1wb3J0IHtFbnZpcm9ubWVudE5nTW9kdWxlUmVmQWRhcHRlcn0gZnJvbSAnLi4vcmVuZGVyMy9uZ19tb2R1bGVfcmVmJztcbmltcG9ydCB7Tmdab25lfSBmcm9tICcuLi96b25lL25nX3pvbmUnO1xuXG5pbXBvcnQge0FwcGxpY2F0aW9uSW5pdFN0YXR1c30gZnJvbSAnLi9hcHBsaWNhdGlvbl9pbml0JztcbmltcG9ydCB7X2NhbGxBbmRSZXBvcnRUb0Vycm9ySGFuZGxlciwgQXBwbGljYXRpb25SZWZ9IGZyb20gJy4vYXBwbGljYXRpb25fcmVmJztcblxuLyoqXG4gKiBJbnRlcm5hbCBjcmVhdGUgYXBwbGljYXRpb24gQVBJIHRoYXQgaW1wbGVtZW50cyB0aGUgY29yZSBhcHBsaWNhdGlvbiBjcmVhdGlvbiBsb2dpYyBhbmQgb3B0aW9uYWxcbiAqIGJvb3RzdHJhcCBsb2dpYy5cbiAqXG4gKiBQbGF0Zm9ybXMgKHN1Y2ggYXMgYHBsYXRmb3JtLWJyb3dzZXJgKSBtYXkgcmVxdWlyZSBkaWZmZXJlbnQgc2V0IG9mIGFwcGxpY2F0aW9uIGFuZCBwbGF0Zm9ybVxuICogcHJvdmlkZXJzIGZvciBhbiBhcHBsaWNhdGlvbiB0byBmdW5jdGlvbiBjb3JyZWN0bHkuIEFzIGEgcmVzdWx0LCBwbGF0Zm9ybXMgbWF5IHVzZSB0aGlzIGZ1bmN0aW9uXG4gKiBpbnRlcm5hbGx5IGFuZCBzdXBwbHkgdGhlIG5lY2Vzc2FyeSBwcm92aWRlcnMgZHVyaW5nIHRoZSBib290c3RyYXAsIHdoaWxlIGV4cG9zaW5nXG4gKiBwbGF0Zm9ybS1zcGVjaWZpYyBBUElzIGFzIGEgcGFydCBvZiB0aGVpciBwdWJsaWMgQVBJLlxuICpcbiAqIEByZXR1cm5zIEEgcHJvbWlzZSB0aGF0IHJldHVybnMgYW4gYEFwcGxpY2F0aW9uUmVmYCBpbnN0YW5jZSBvbmNlIHJlc29sdmVkLlxuICovXG5cbmV4cG9ydCBmdW5jdGlvbiBpbnRlcm5hbENyZWF0ZUFwcGxpY2F0aW9uKGNvbmZpZzoge1xuICByb290Q29tcG9uZW50PzogVHlwZTx1bmtub3duPjtcbiAgYXBwUHJvdmlkZXJzPzogQXJyYXk8UHJvdmlkZXIgfCBFbnZpcm9ubWVudFByb3ZpZGVycz47XG4gIHBsYXRmb3JtUHJvdmlkZXJzPzogUHJvdmlkZXJbXTtcbn0pOiBQcm9taXNlPEFwcGxpY2F0aW9uUmVmPiB7XG4gIHRyeSB7XG4gICAgY29uc3Qge3Jvb3RDb21wb25lbnQsIGFwcFByb3ZpZGVycywgcGxhdGZvcm1Qcm92aWRlcnN9ID0gY29uZmlnO1xuXG4gICAgaWYgKCh0eXBlb2YgbmdEZXZNb2RlID09PSAndW5kZWZpbmVkJyB8fCBuZ0Rldk1vZGUpICYmIHJvb3RDb21wb25lbnQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgYXNzZXJ0U3RhbmRhbG9uZUNvbXBvbmVudFR5cGUocm9vdENvbXBvbmVudCk7XG4gICAgfVxuXG4gICAgY29uc3QgcGxhdGZvcm1JbmplY3RvciA9IGNyZWF0ZU9yUmV1c2VQbGF0Zm9ybUluamVjdG9yKHBsYXRmb3JtUHJvdmlkZXJzIGFzIFN0YXRpY1Byb3ZpZGVyW10pO1xuXG4gICAgLy8gQ3JlYXRlIHJvb3QgYXBwbGljYXRpb24gaW5qZWN0b3IgYmFzZWQgb24gYSBzZXQgb2YgcHJvdmlkZXJzIGNvbmZpZ3VyZWQgYXQgdGhlIHBsYXRmb3JtXG4gICAgLy8gYm9vdHN0cmFwIGxldmVsIGFzIHdlbGwgYXMgcHJvdmlkZXJzIHBhc3NlZCB0byB0aGUgYm9vdHN0cmFwIGNhbGwgYnkgYSB1c2VyLlxuICAgIGNvbnN0IGFsbEFwcFByb3ZpZGVycyA9IFtwcm92aWRlWm9uZUNoYW5nZURldGVjdGlvbigpLCAuLi4oYXBwUHJvdmlkZXJzIHx8IFtdKV07XG4gICAgY29uc3QgYWRhcHRlciA9IG5ldyBFbnZpcm9ubWVudE5nTW9kdWxlUmVmQWRhcHRlcih7XG4gICAgICBwcm92aWRlcnM6IGFsbEFwcFByb3ZpZGVycyxcbiAgICAgIHBhcmVudDogcGxhdGZvcm1JbmplY3RvciBhcyBFbnZpcm9ubWVudEluamVjdG9yLFxuICAgICAgZGVidWdOYW1lOiB0eXBlb2YgbmdEZXZNb2RlID09PSAndW5kZWZpbmVkJyB8fCBuZ0Rldk1vZGUgPyAnRW52aXJvbm1lbnQgSW5qZWN0b3InIDogJycsXG4gICAgICAvLyBXZSBza2lwIGVudmlyb25tZW50IGluaXRpYWxpemVycyBiZWNhdXNlIHdlIG5lZWQgdG8gcnVuIHRoZW0gaW5zaWRlIHRoZSBOZ1pvbmUsIHdoaWNoXG4gICAgICAvLyBoYXBwZW5zIGFmdGVyIHdlIGdldCB0aGUgTmdab25lIGluc3RhbmNlIGZyb20gdGhlIEluamVjdG9yLlxuICAgICAgcnVuRW52aXJvbm1lbnRJbml0aWFsaXplcnM6IGZhbHNlLFxuICAgIH0pO1xuICAgIGNvbnN0IGVudkluamVjdG9yID0gYWRhcHRlci5pbmplY3RvcjtcbiAgICBjb25zdCBuZ1pvbmUgPSBlbnZJbmplY3Rvci5nZXQoTmdab25lKTtcblxuICAgIHJldHVybiBuZ1pvbmUucnVuKCgpID0+IHtcbiAgICAgIGVudkluamVjdG9yLnJlc29sdmVJbmplY3RvckluaXRpYWxpemVycygpO1xuICAgICAgY29uc3QgZXhjZXB0aW9uSGFuZGxlcjogRXJyb3JIYW5kbGVyIHwgbnVsbCA9IGVudkluamVjdG9yLmdldChFcnJvckhhbmRsZXIsIG51bGwpO1xuICAgICAgaWYgKCh0eXBlb2YgbmdEZXZNb2RlID09PSAndW5kZWZpbmVkJyB8fCBuZ0Rldk1vZGUpICYmICFleGNlcHRpb25IYW5kbGVyKSB7XG4gICAgICAgIHRocm93IG5ldyBSdW50aW1lRXJyb3IoXG4gICAgICAgICAgUnVudGltZUVycm9yQ29kZS5NSVNTSU5HX1JFUVVJUkVEX0lOSkVDVEFCTEVfSU5fQk9PVFNUUkFQLFxuICAgICAgICAgICdObyBgRXJyb3JIYW5kbGVyYCBmb3VuZCBpbiB0aGUgRGVwZW5kZW5jeSBJbmplY3Rpb24gdHJlZS4nLFxuICAgICAgICApO1xuICAgICAgfVxuXG4gICAgICBsZXQgb25FcnJvclN1YnNjcmlwdGlvbjogU3Vic2NyaXB0aW9uO1xuICAgICAgbmdab25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+IHtcbiAgICAgICAgb25FcnJvclN1YnNjcmlwdGlvbiA9IG5nWm9uZS5vbkVycm9yLnN1YnNjcmliZSh7XG4gICAgICAgICAgbmV4dDogKGVycm9yOiBhbnkpID0+IHtcbiAgICAgICAgICAgIGV4Y2VwdGlvbkhhbmRsZXIhLmhhbmRsZUVycm9yKGVycm9yKTtcbiAgICAgICAgICB9LFxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgICAvLyBJZiB0aGUgd2hvbGUgcGxhdGZvcm0gaXMgZGVzdHJveWVkLCBpbnZva2UgdGhlIGBkZXN0cm95YCBtZXRob2RcbiAgICAgIC8vIGZvciBhbGwgYm9vdHN0cmFwcGVkIGFwcGxpY2F0aW9ucyBhcyB3ZWxsLlxuICAgICAgY29uc3QgZGVzdHJveUxpc3RlbmVyID0gKCkgPT4gZW52SW5qZWN0b3IuZGVzdHJveSgpO1xuICAgICAgY29uc3Qgb25QbGF0Zm9ybURlc3Ryb3lMaXN0ZW5lcnMgPSBwbGF0Zm9ybUluamVjdG9yLmdldChQTEFURk9STV9ERVNUUk9ZX0xJU1RFTkVSUyk7XG4gICAgICBvblBsYXRmb3JtRGVzdHJveUxpc3RlbmVycy5hZGQoZGVzdHJveUxpc3RlbmVyKTtcblxuICAgICAgZW52SW5qZWN0b3Iub25EZXN0cm95KCgpID0+IHtcbiAgICAgICAgb25FcnJvclN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICAgICAgICBvblBsYXRmb3JtRGVzdHJveUxpc3RlbmVycy5kZWxldGUoZGVzdHJveUxpc3RlbmVyKTtcbiAgICAgIH0pO1xuXG4gICAgICByZXR1cm4gX2NhbGxBbmRSZXBvcnRUb0Vycm9ySGFuZGxlcihleGNlcHRpb25IYW5kbGVyISwgbmdab25lLCAoKSA9PiB7XG4gICAgICAgIGNvbnN0IGluaXRTdGF0dXMgPSBlbnZJbmplY3Rvci5nZXQoQXBwbGljYXRpb25Jbml0U3RhdHVzKTtcbiAgICAgICAgaW5pdFN0YXR1cy5ydW5Jbml0aWFsaXplcnMoKTtcblxuICAgICAgICByZXR1cm4gaW5pdFN0YXR1cy5kb25lUHJvbWlzZS50aGVuKCgpID0+IHtcbiAgICAgICAgICBjb25zdCBsb2NhbGVJZCA9IGVudkluamVjdG9yLmdldChMT0NBTEVfSUQsIERFRkFVTFRfTE9DQUxFX0lEKTtcbiAgICAgICAgICBzZXRMb2NhbGVJZChsb2NhbGVJZCB8fCBERUZBVUxUX0xPQ0FMRV9JRCk7XG5cbiAgICAgICAgICBjb25zdCBhcHBSZWYgPSBlbnZJbmplY3Rvci5nZXQoQXBwbGljYXRpb25SZWYpO1xuICAgICAgICAgIGlmIChyb290Q29tcG9uZW50ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGFwcFJlZi5ib290c3RyYXAocm9vdENvbXBvbmVudCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmICh0eXBlb2YgbmdEZXZNb2RlID09PSAndW5kZWZpbmVkJyB8fCBuZ0Rldk1vZGUpIHtcbiAgICAgICAgICAgIGNvbnN0IGltYWdlUGVyZm9ybWFuY2VTZXJ2aWNlID0gZW52SW5qZWN0b3IuZ2V0KEltYWdlUGVyZm9ybWFuY2VXYXJuaW5nKTtcbiAgICAgICAgICAgIGltYWdlUGVyZm9ybWFuY2VTZXJ2aWNlLnN0YXJ0KCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBhcHBSZWY7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZSk7XG4gIH1cbn1cbiJdfQ==