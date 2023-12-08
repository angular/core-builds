/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { provideZoneChangeDetection } from '../change_detection/scheduling';
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
        const allAppProviders = [
            provideZoneChangeDetection(),
            ...(appProviders || []),
        ];
        const adapter = new EnvironmentNgModuleRefAdapter({
            providers: allAppProviders,
            parent: platformInjector,
            debugName: (typeof ngDevMode === 'undefined' || ngDevMode) ? 'Environment Injector' : '',
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
                    }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3JlYXRlX2FwcGxpY2F0aW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvYXBwbGljYXRpb24vY3JlYXRlX2FwcGxpY2F0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUlILE9BQU8sRUFBQywwQkFBMEIsRUFBQyxNQUFNLGdDQUFnQyxDQUFDO0FBRzFFLE9BQU8sRUFBQyxZQUFZLEVBQUMsTUFBTSxrQkFBa0IsQ0FBQztBQUM5QyxPQUFPLEVBQUMsWUFBWSxFQUFtQixNQUFNLFdBQVcsQ0FBQztBQUN6RCxPQUFPLEVBQUMsaUJBQWlCLEVBQUMsTUFBTSxzQkFBc0IsQ0FBQztBQUN2RCxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFDekMsT0FBTyxFQUFDLHVCQUF1QixFQUFDLE1BQU0sOEJBQThCLENBQUM7QUFFckUsT0FBTyxFQUFDLDZCQUE2QixFQUFDLE1BQU0sc0JBQXNCLENBQUM7QUFDbkUsT0FBTyxFQUFDLDBCQUEwQixFQUFDLE1BQU0sMEJBQTBCLENBQUM7QUFDcEUsT0FBTyxFQUFDLDZCQUE2QixFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDaEUsT0FBTyxFQUFDLFdBQVcsRUFBQyxNQUFNLGdDQUFnQyxDQUFDO0FBQzNELE9BQU8sRUFBQyw2QkFBNkIsRUFBQyxNQUFNLDBCQUEwQixDQUFDO0FBQ3ZFLE9BQU8sRUFBQyxNQUFNLEVBQUMsTUFBTSxpQkFBaUIsQ0FBQztBQUV2QyxPQUFPLEVBQUMscUJBQXFCLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUN6RCxPQUFPLEVBQUMsNEJBQTRCLEVBQUUsY0FBYyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFFL0U7Ozs7Ozs7Ozs7R0FVRztBQUVILE1BQU0sVUFBVSx5QkFBeUIsQ0FBQyxNQUl6QztJQUNDLElBQUk7UUFDRixNQUFNLEVBQUMsYUFBYSxFQUFF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QUUzQyxNQUFNLE1BQU0sR0FBRyxXQUFXLENBQUMsR0FBRyxDQUFDLGNBQWMsQ0FBQyxDQUFDO29CQUMvQyxJQUFJLGFBQWEsS0FBSyxTQUFTLEVBQUU7d0JBQy9CLE1BQU0sQ0FBQyxTQUFTLENBQUMsYUFBYSxDQUFDLENBQUM7cUJBQ2pDO29CQUNELElBQUksT0FBTyxTQUFTLEtBQUssV0FBVyxJQUFJLFNBQVMsRUFBRTt3QkFDakQsTUFBTSx1QkFBdUIsR0FBRyxXQUFXLENBQUMsR0FBRyxDQUFDLHVCQUF1QixDQUFDLENBQUM7d0JBQ3pFLHVCQUF1QixDQUFDLEtBQUssRUFBRSxDQUFDO3FCQUNqQztvQkFDRCxPQUFPLE1BQU0sQ0FBQztnQkFDaEIsQ0FBQyxDQUFDLENBQUM7WUFDTCxDQUFDLENBQUMsQ0FBQztRQUNMLENBQUMsQ0FBQyxDQUFDO0tBQ0o7SUFBQyxPQUFPLENBQUMsRUFBRTtRQUNWLE9BQU8sT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztLQUMxQjtBQUNILENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtTdWJzY3JpcHRpb259IGZyb20gJ3J4anMnO1xuXG5pbXBvcnQge3Byb3ZpZGVab25lQ2hhbmdlRGV0ZWN0aW9ufSBmcm9tICcuLi9jaGFuZ2VfZGV0ZWN0aW9uL3NjaGVkdWxpbmcnO1xuaW1wb3J0IHtFbnZpcm9ubWVudFByb3ZpZGVycywgUHJvdmlkZXIsIFN0YXRpY1Byb3ZpZGVyfSBmcm9tICcuLi9kaS9pbnRlcmZhY2UvcHJvdmlkZXInO1xuaW1wb3J0IHtFbnZpcm9ubWVudEluamVjdG9yfSBmcm9tICcuLi9kaS9yM19pbmplY3Rvcic7XG5pbXBvcnQge0Vycm9ySGFuZGxlcn0gZnJvbSAnLi4vZXJyb3JfaGFuZGxlcic7XG5pbXBvcnQge1J1bnRpbWVFcnJvciwgUnVudGltZUVycm9yQ29kZX0gZnJvbSAnLi4vZXJyb3JzJztcbmltcG9ydCB7REVGQVVMVF9MT0NBTEVfSUR9IGZyb20gJy4uL2kxOG4vbG9jYWxpemF0aW9uJztcbmltcG9ydCB7TE9DQUxFX0lEfSBmcm9tICcuLi9pMThuL3Rva2Vucyc7XG5pbXBvcnQge0ltYWdlUGVyZm9ybWFuY2VXYXJuaW5nfSBmcm9tICcuLi9pbWFnZV9wZXJmb3JtYW5jZV93YXJuaW5nJztcbmltcG9ydCB7VHlwZX0gZnJvbSAnLi4vaW50ZXJmYWNlL3R5cGUnO1xuaW1wb3J0IHtjcmVhdGVPclJldXNlUGxhdGZvcm1JbmplY3Rvcn0gZnJvbSAnLi4vcGxhdGZvcm0vcGxhdGZvcm0nO1xuaW1wb3J0IHtQTEFURk9STV9ERVNUUk9ZX0xJU1RFTkVSU30gZnJvbSAnLi4vcGxhdGZvcm0vcGxhdGZvcm1fcmVmJztcbmltcG9ydCB7YXNzZXJ0U3RhbmRhbG9uZUNvbXBvbmVudFR5cGV9IGZyb20gJy4uL3JlbmRlcjMvZXJyb3JzJztcbmltcG9ydCB7c2V0TG9jYWxlSWR9IGZyb20gJy4uL3JlbmRlcjMvaTE4bi9pMThuX2xvY2FsZV9pZCc7XG5pbXBvcnQge0Vudmlyb25tZW50TmdNb2R1bGVSZWZBZGFwdGVyfSBmcm9tICcuLi9yZW5kZXIzL25nX21vZHVsZV9yZWYnO1xuaW1wb3J0IHtOZ1pvbmV9IGZyb20gJy4uL3pvbmUvbmdfem9uZSc7XG5cbmltcG9ydCB7QXBwbGljYXRpb25Jbml0U3RhdHVzfSBmcm9tICcuL2FwcGxpY2F0aW9uX2luaXQnO1xuaW1wb3J0IHtfY2FsbEFuZFJlcG9ydFRvRXJyb3JIYW5kbGVyLCBBcHBsaWNhdGlvblJlZn0gZnJvbSAnLi9hcHBsaWNhdGlvbl9yZWYnO1xuXG4vKipcbiAqIEludGVybmFsIGNyZWF0ZSBhcHBsaWNhdGlvbiBBUEkgdGhhdCBpbXBsZW1lbnRzIHRoZSBjb3JlIGFwcGxpY2F0aW9uIGNyZWF0aW9uIGxvZ2ljIGFuZCBvcHRpb25hbFxuICogYm9vdHN0cmFwIGxvZ2ljLlxuICpcbiAqIFBsYXRmb3JtcyAoc3VjaCBhcyBgcGxhdGZvcm0tYnJvd3NlcmApIG1heSByZXF1aXJlIGRpZmZlcmVudCBzZXQgb2YgYXBwbGljYXRpb24gYW5kIHBsYXRmb3JtXG4gKiBwcm92aWRlcnMgZm9yIGFuIGFwcGxpY2F0aW9uIHRvIGZ1bmN0aW9uIGNvcnJlY3RseS4gQXMgYSByZXN1bHQsIHBsYXRmb3JtcyBtYXkgdXNlIHRoaXMgZnVuY3Rpb25cbiAqIGludGVybmFsbHkgYW5kIHN1cHBseSB0aGUgbmVjZXNzYXJ5IHByb3ZpZGVycyBkdXJpbmcgdGhlIGJvb3RzdHJhcCwgd2hpbGUgZXhwb3NpbmdcbiAqIHBsYXRmb3JtLXNwZWNpZmljIEFQSXMgYXMgYSBwYXJ0IG9mIHRoZWlyIHB1YmxpYyBBUEkuXG4gKlxuICogQHJldHVybnMgQSBwcm9taXNlIHRoYXQgcmV0dXJucyBhbiBgQXBwbGljYXRpb25SZWZgIGluc3RhbmNlIG9uY2UgcmVzb2x2ZWQuXG4gKi9cblxuZXhwb3J0IGZ1bmN0aW9uIGludGVybmFsQ3JlYXRlQXBwbGljYXRpb24oY29uZmlnOiB7XG4gIHJvb3RDb21wb25lbnQ/OiBUeXBlPHVua25vd24+O1xuICBhcHBQcm92aWRlcnM/OiBBcnJheTxQcm92aWRlcnxFbnZpcm9ubWVudFByb3ZpZGVycz47XG4gIHBsYXRmb3JtUHJvdmlkZXJzPzogUHJvdmlkZXJbXTtcbn0pOiBQcm9taXNlPEFwcGxpY2F0aW9uUmVmPiB7XG4gIHRyeSB7XG4gICAgY29uc3Qge3Jvb3RDb21wb25lbnQsIGFwcFByb3ZpZGVycywgcGxhdGZvcm1Qcm92aWRlcnN9ID0gY29uZmlnO1xuXG4gICAgaWYgKCh0eXBlb2YgbmdEZXZNb2RlID09PSAndW5kZWZpbmVkJyB8fCBuZ0Rldk1vZGUpICYmIHJvb3RDb21wb25lbnQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgYXNzZXJ0U3RhbmRhbG9uZUNvbXBvbmVudFR5cGUocm9vdENvbXBvbmVudCk7XG4gICAgfVxuXG4gICAgY29uc3QgcGxhdGZvcm1JbmplY3RvciA9IGNyZWF0ZU9yUmV1c2VQbGF0Zm9ybUluamVjdG9yKHBsYXRmb3JtUHJvdmlkZXJzIGFzIFN0YXRpY1Byb3ZpZGVyW10pO1xuXG4gICAgLy8gQ3JlYXRlIHJvb3QgYXBwbGljYXRpb24gaW5qZWN0b3IgYmFzZWQgb24gYSBzZXQgb2YgcHJvdmlkZXJzIGNvbmZpZ3VyZWQgYXQgdGhlIHBsYXRmb3JtXG4gICAgLy8gYm9vdHN0cmFwIGxldmVsIGFzIHdlbGwgYXMgcHJvdmlkZXJzIHBhc3NlZCB0byB0aGUgYm9vdHN0cmFwIGNhbGwgYnkgYSB1c2VyLlxuICAgIGNvbnN0IGFsbEFwcFByb3ZpZGVycyA9IFtcbiAgICAgIHByb3ZpZGVab25lQ2hhbmdlRGV0ZWN0aW9uKCksXG4gICAgICAuLi4oYXBwUHJvdmlkZXJzIHx8IFtdKSxcbiAgICBdO1xuICAgIGNvbnN0IGFkYXB0ZXIgPSBuZXcgRW52aXJvbm1lbnROZ01vZHVsZVJlZkFkYXB0ZXIoe1xuICAgICAgcHJvdmlkZXJzOiBhbGxBcHBQcm92aWRlcnMsXG4gICAgICBwYXJlbnQ6IHBsYXRmb3JtSW5qZWN0b3IgYXMgRW52aXJvbm1lbnRJbmplY3RvcixcbiAgICAgIGRlYnVnTmFtZTogKHR5cGVvZiBuZ0Rldk1vZGUgPT09ICd1bmRlZmluZWQnIHx8IG5nRGV2TW9kZSkgPyAnRW52aXJvbm1lbnQgSW5qZWN0b3InIDogJycsXG4gICAgICAvLyBXZSBza2lwIGVudmlyb25tZW50IGluaXRpYWxpemVycyBiZWNhdXNlIHdlIG5lZWQgdG8gcnVuIHRoZW0gaW5zaWRlIHRoZSBOZ1pvbmUsIHdoaWNoXG4gICAgICAvLyBoYXBwZW5zIGFmdGVyIHdlIGdldCB0aGUgTmdab25lIGluc3RhbmNlIGZyb20gdGhlIEluamVjdG9yLlxuICAgICAgcnVuRW52aXJvbm1lbnRJbml0aWFsaXplcnM6IGZhbHNlLFxuICAgIH0pO1xuICAgIGNvbnN0IGVudkluamVjdG9yID0gYWRhcHRlci5pbmplY3RvcjtcbiAgICBjb25zdCBuZ1pvbmUgPSBlbnZJbmplY3Rvci5nZXQoTmdab25lKTtcblxuICAgIHJldHVybiBuZ1pvbmUucnVuKCgpID0+IHtcbiAgICAgIGVudkluamVjdG9yLnJlc29sdmVJbmplY3RvckluaXRpYWxpemVycygpO1xuICAgICAgY29uc3QgZXhjZXB0aW9uSGFuZGxlcjogRXJyb3JIYW5kbGVyfG51bGwgPSBlbnZJbmplY3Rvci5nZXQoRXJyb3JIYW5kbGVyLCBudWxsKTtcbiAgICAgIGlmICgodHlwZW9mIG5nRGV2TW9kZSA9PT0gJ3VuZGVmaW5lZCcgfHwgbmdEZXZNb2RlKSAmJiAhZXhjZXB0aW9uSGFuZGxlcikge1xuICAgICAgICB0aHJvdyBuZXcgUnVudGltZUVycm9yKFxuICAgICAgICAgICAgUnVudGltZUVycm9yQ29kZS5NSVNTSU5HX1JFUVVJUkVEX0lOSkVDVEFCTEVfSU5fQk9PVFNUUkFQLFxuICAgICAgICAgICAgJ05vIGBFcnJvckhhbmRsZXJgIGZvdW5kIGluIHRoZSBEZXBlbmRlbmN5IEluamVjdGlvbiB0cmVlLicpO1xuICAgICAgfVxuXG4gICAgICBsZXQgb25FcnJvclN1YnNjcmlwdGlvbjogU3Vic2NyaXB0aW9uO1xuICAgICAgbmdab25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+IHtcbiAgICAgICAgb25FcnJvclN1YnNjcmlwdGlvbiA9IG5nWm9uZS5vbkVycm9yLnN1YnNjcmliZSh7XG4gICAgICAgICAgbmV4dDogKGVycm9yOiBhbnkpID0+IHtcbiAgICAgICAgICAgIGV4Y2VwdGlvbkhhbmRsZXIhLmhhbmRsZUVycm9yKGVycm9yKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICAgIC8vIElmIHRoZSB3aG9sZSBwbGF0Zm9ybSBpcyBkZXN0cm95ZWQsIGludm9rZSB0aGUgYGRlc3Ryb3lgIG1ldGhvZFxuICAgICAgLy8gZm9yIGFsbCBib290c3RyYXBwZWQgYXBwbGljYXRpb25zIGFzIHdlbGwuXG4gICAgICBjb25zdCBkZXN0cm95TGlzdGVuZXIgPSAoKSA9PiBlbnZJbmplY3Rvci5kZXN0cm95KCk7XG4gICAgICBjb25zdCBvblBsYXRmb3JtRGVzdHJveUxpc3RlbmVycyA9IHBsYXRmb3JtSW5qZWN0b3IuZ2V0KFBMQVRGT1JNX0RFU1RST1lfTElTVEVORVJTKTtcbiAgICAgIG9uUGxhdGZvcm1EZXN0cm95TGlzdGVuZXJzLmFkZChkZXN0cm95TGlzdGVuZXIpO1xuXG4gICAgICBlbnZJbmplY3Rvci5vbkRlc3Ryb3koKCkgPT4ge1xuICAgICAgICBvbkVycm9yU3Vic2NyaXB0aW9uLnVuc3Vic2NyaWJlKCk7XG4gICAgICAgIG9uUGxhdGZvcm1EZXN0cm95TGlzdGVuZXJzLmRlbGV0ZShkZXN0cm95TGlzdGVuZXIpO1xuICAgICAgfSk7XG5cbiAgICAgIHJldHVybiBfY2FsbEFuZFJlcG9ydFRvRXJyb3JIYW5kbGVyKGV4Y2VwdGlvbkhhbmRsZXIhLCBuZ1pvbmUsICgpID0+IHtcbiAgICAgICAgY29uc3QgaW5pdFN0YXR1cyA9IGVudkluamVjdG9yLmdldChBcHBsaWNhdGlvbkluaXRTdGF0dXMpO1xuICAgICAgICBpbml0U3RhdHVzLnJ1bkluaXRpYWxpemVycygpO1xuXG4gICAgICAgIHJldHVybiBpbml0U3RhdHVzLmRvbmVQcm9taXNlLnRoZW4oKCkgPT4ge1xuICAgICAgICAgIGNvbnN0IGxvY2FsZUlkID0gZW52SW5qZWN0b3IuZ2V0KExPQ0FMRV9JRCwgREVGQVVMVF9MT0NBTEVfSUQpO1xuICAgICAgICAgIHNldExvY2FsZUlkKGxvY2FsZUlkIHx8IERFRkFVTFRfTE9DQUxFX0lEKTtcblxuICAgICAgICAgIGNvbnN0IGFwcFJlZiA9IGVudkluamVjdG9yLmdldChBcHBsaWNhdGlvblJlZik7XG4gICAgICAgICAgaWYgKHJvb3RDb21wb25lbnQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgYXBwUmVmLmJvb3RzdHJhcChyb290Q29tcG9uZW50KTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHR5cGVvZiBuZ0Rldk1vZGUgPT09ICd1bmRlZmluZWQnIHx8IG5nRGV2TW9kZSkge1xuICAgICAgICAgICAgY29uc3QgaW1hZ2VQZXJmb3JtYW5jZVNlcnZpY2UgPSBlbnZJbmplY3Rvci5nZXQoSW1hZ2VQZXJmb3JtYW5jZVdhcm5pbmcpO1xuICAgICAgICAgICAgaW1hZ2VQZXJmb3JtYW5jZVNlcnZpY2Uuc3RhcnQoKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIGFwcFJlZjtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlKTtcbiAgfVxufVxuIl19