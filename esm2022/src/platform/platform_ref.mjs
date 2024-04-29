/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ApplicationInitStatus } from '../application/application_init';
import { compileNgModuleFactory } from '../application/application_ngmodule_factory_compiler';
import { _callAndReportToErrorHandler, ApplicationRef, optionsReducer, remove, } from '../application/application_ref';
import { getNgZoneOptions, internalProvideZoneChangeDetection, PROVIDED_NG_ZONE, } from '../change_detection/scheduling/ng_zone_scheduling';
import { Injectable, InjectionToken, Injector } from '../di';
import { ErrorHandler } from '../error_handler';
import { RuntimeError } from '../errors';
import { DEFAULT_LOCALE_ID } from '../i18n/localization';
import { LOCALE_ID } from '../i18n/tokens';
import { setLocaleId } from '../render3';
import { createNgModuleRefWithProviders } from '../render3/ng_module_ref';
import { stringify } from '../util/stringify';
import { getNgZone } from '../zone/ng_zone';
import * as i0 from "../r3_symbols";
import * as i1 from "../di";
/**
 * Internal token that allows to register extra callbacks that should be invoked during the
 * `PlatformRef.destroy` operation. This token is needed to avoid a direct reference to the
 * `PlatformRef` class (i.e. register the callback via `PlatformRef.onDestroy`), thus making the
 * entire class tree-shakeable.
 */
export const PLATFORM_DESTROY_LISTENERS = new InjectionToken(ngDevMode ? 'PlatformDestroyListeners' : '');
/**
 * The Angular platform is the entry point for Angular on a web page.
 * Each page has exactly one platform. Services (such as reflection) which are common
 * to every Angular application running on the page are bound in its scope.
 * A page's platform is initialized implicitly when a platform is created using a platform
 * factory such as `PlatformBrowser`, or explicitly by calling the `createPlatform()` function.
 *
 * @publicApi
 */
export class PlatformRef {
    /** @internal */
    constructor(_injector) {
        this._injector = _injector;
        this._modules = [];
        this._destroyListeners = [];
        this._destroyed = false;
    }
    /**
     * Creates an instance of an `@NgModule` for the given platform.
     *
     * @deprecated Passing NgModule factories as the `PlatformRef.bootstrapModuleFactory` function
     *     argument is deprecated. Use the `PlatformRef.bootstrapModule` API instead.
     */
    bootstrapModuleFactory(moduleFactory, options) {
        // Note: We need to create the NgZone _before_ we instantiate the module,
        // as instantiating the module creates some providers eagerly.
        // So we create a mini parent injector that just contains the new NgZone and
        // pass that as parent to the NgModuleFactory.
        const ngZone = getNgZone(options?.ngZone, getNgZoneOptions({
            eventCoalescing: options?.ngZoneEventCoalescing,
            runCoalescing: options?.ngZoneRunCoalescing,
        }));
        // Note: Create ngZoneInjector within ngZone.run so that all of the instantiated services are
        // created within the Angular zone
        // Do not try to replace ngZone.run with ApplicationRef#run because ApplicationRef would then be
        // created outside of the Angular zone.
        return ngZone.run(() => {
            const ignoreChangesOutsideZone = options?.ignoreChangesOutsideZone;
            const moduleRef = createNgModuleRefWithProviders(moduleFactory.moduleType, this.injector, internalProvideZoneChangeDetection({ ngZoneFactory: () => ngZone, ignoreChangesOutsideZone }));
            if ((typeof ngDevMode === 'undefined' || ngDevMode) &&
                moduleRef.injector.get(PROVIDED_NG_ZONE, null) !== null) {
                throw new RuntimeError(207 /* RuntimeErrorCode.PROVIDER_IN_WRONG_CONTEXT */, '`bootstrapModule` does not support `provideZoneChangeDetection`. Use `BootstrapOptions` instead.');
            }
            const exceptionHandler = moduleRef.injector.get(ErrorHandler, null);
            if ((typeof ngDevMode === 'undefined' || ngDevMode) && exceptionHandler === null) {
                throw new RuntimeError(402 /* RuntimeErrorCode.MISSING_REQUIRED_INJECTABLE_IN_BOOTSTRAP */, 'No ErrorHandler. Is platform module (BrowserModule) included?');
            }
            ngZone.runOutsideAngular(() => {
                const subscription = ngZone.onError.subscribe({
                    next: (error) => {
                        exceptionHandler.handleError(error);
                    },
                });
                moduleRef.onDestroy(() => {
                    remove(this._modules, moduleRef);
                    subscription.unsubscribe();
                });
            });
            return _callAndReportToErrorHandler(exceptionHandler, ngZone, () => {
                const initStatus = moduleRef.injector.get(ApplicationInitStatus);
                initStatus.runInitializers();
                return initStatus.donePromise.then(() => {
                    // If the `LOCALE_ID` provider is defined at bootstrap then we set the value for ivy
                    const localeId = moduleRef.injector.get(LOCALE_ID, DEFAULT_LOCALE_ID);
                    setLocaleId(localeId || DEFAULT_LOCALE_ID);
                    this._moduleDoBootstrap(moduleRef);
                    return moduleRef;
                });
            });
        });
    }
    /**
     * Creates an instance of an `@NgModule` for a given platform.
     *
     * @usageNotes
     * ### Simple Example
     *
     * ```typescript
     * @NgModule({
     *   imports: [BrowserModule]
     * })
     * class MyModule {}
     *
     * let moduleRef = platformBrowser().bootstrapModule(MyModule);
     * ```
     *
     */
    bootstrapModule(moduleType, compilerOptions = []) {
        const options = optionsReducer({}, compilerOptions);
        return compileNgModuleFactory(this.injector, options, moduleType).then((moduleFactory) => this.bootstrapModuleFactory(moduleFactory, options));
    }
    _moduleDoBootstrap(moduleRef) {
        const appRef = moduleRef.injector.get(ApplicationRef);
        if (moduleRef._bootstrapComponents.length > 0) {
            moduleRef._bootstrapComponents.forEach((f) => appRef.bootstrap(f));
        }
        else if (moduleRef.instance.ngDoBootstrap) {
            moduleRef.instance.ngDoBootstrap(appRef);
        }
        else {
            throw new RuntimeError(-403 /* RuntimeErrorCode.BOOTSTRAP_COMPONENTS_NOT_FOUND */, ngDevMode &&
                `The module ${stringify(moduleRef.instance.constructor)} was bootstrapped, ` +
                    `but it does not declare "@NgModule.bootstrap" components nor a "ngDoBootstrap" method. ` +
                    `Please define one of these.`);
        }
        this._modules.push(moduleRef);
    }
    /**
     * Registers a listener to be called when the platform is destroyed.
     */
    onDestroy(callback) {
        this._destroyListeners.push(callback);
    }
    /**
     * Retrieves the platform {@link Injector}, which is the parent injector for
     * every Angular application on the page and provides singleton providers.
     */
    get injector() {
        return this._injector;
    }
    /**
     * Destroys the current Angular platform and all Angular applications on the page.
     * Destroys all modules and listeners registered with the platform.
     */
    destroy() {
        if (this._destroyed) {
            throw new RuntimeError(404 /* RuntimeErrorCode.PLATFORM_ALREADY_DESTROYED */, ngDevMode && 'The platform has already been destroyed!');
        }
        this._modules.slice().forEach((module) => module.destroy());
        this._destroyListeners.forEach((listener) => listener());
        const destroyListeners = this._injector.get(PLATFORM_DESTROY_LISTENERS, null);
        if (destroyListeners) {
            destroyListeners.forEach((listener) => listener());
            destroyListeners.clear();
        }
        this._destroyed = true;
    }
    /**
     * Indicates whether this instance was destroyed.
     */
    get destroyed() {
        return this._destroyed;
    }
    static { this.ɵfac = function PlatformRef_Factory(t) { return new (t || PlatformRef)(i0.ɵɵinject(i1.Injector)); }; }
    static { this.ɵprov = /*@__PURE__*/ i0.ɵɵdefineInjectable({ token: PlatformRef, factory: PlatformRef.ɵfac, providedIn: 'platform' }); }
}
(() => { (typeof ngDevMode === "undefined" || ngDevMode) && i0.setClassMetadata(PlatformRef, [{
        type: Injectable,
        args: [{ providedIn: 'platform' }]
    }], () => [{ type: i1.Injector }], null); })();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGxhdGZvcm1fcmVmLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcGxhdGZvcm0vcGxhdGZvcm1fcmVmLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxxQkFBcUIsRUFBQyxNQUFNLGlDQUFpQyxDQUFDO0FBQ3RFLE9BQU8sRUFBQyxzQkFBc0IsRUFBQyxNQUFNLHNEQUFzRCxDQUFDO0FBQzVGLE9BQU8sRUFDTCw0QkFBNEIsRUFDNUIsY0FBYyxFQUVkLGNBQWMsRUFDZCxNQUFNLEdBQ1AsTUFBTSxnQ0FBZ0MsQ0FBQztBQUN4QyxPQUFPLEVBQ0wsZ0JBQWdCLEVBQ2hCLGtDQUFrQyxFQUNsQyxnQkFBZ0IsR0FDakIsTUFBTSxtREFBbUQsQ0FBQztBQUMzRCxPQUFPLEVBQUMsVUFBVSxFQUFFLGNBQWMsRUFBRSxRQUFRLEVBQUMsTUFBTSxPQUFPLENBQUM7QUFDM0QsT0FBTyxFQUFDLFlBQVksRUFBQyxNQUFNLGtCQUFrQixDQUFDO0FBQzlDLE9BQU8sRUFBQyxZQUFZLEVBQW1CLE1BQU0sV0FBVyxDQUFDO0FBQ3pELE9BQU8sRUFBQyxpQkFBaUIsRUFBQyxNQUFNLHNCQUFzQixDQUFDO0FBQ3ZELE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUl6QyxPQUFPLEVBQUMsV0FBVyxFQUFDLE1BQU0sWUFBWSxDQUFDO0FBQ3ZDLE9BQU8sRUFBQyw4QkFBOEIsRUFBQyxNQUFNLDBCQUEwQixDQUFDO0FBQ3hFLE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUM1QyxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0saUJBQWlCLENBQUM7OztBQUUxQzs7Ozs7R0FLRztBQUNILE1BQU0sQ0FBQyxNQUFNLDBCQUEwQixHQUFHLElBQUksY0FBYyxDQUMxRCxTQUFTLENBQUMsQ0FBQyxDQUFDLDBC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RyxJQUFJLENBQUM7SUFDekIsQ0FBQztJQUVEOztPQUVHO0lBQ0gsSUFBSSxTQUFTO1FBQ1gsT0FBTyxJQUFJLENBQUMsVUFBVSxDQUFDO0lBQ3pCLENBQUM7NEVBNUtVLFdBQVc7dUVBQVgsV0FBVyxXQUFYLFdBQVcsbUJBREMsVUFBVTs7Z0ZBQ3RCLFdBQVc7Y0FEdkIsVUFBVTtlQUFDLEVBQUMsVUFBVSxFQUFFLFVBQVUsRUFBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0FwcGxpY2F0aW9uSW5pdFN0YXR1c30gZnJvbSAnLi4vYXBwbGljYXRpb24vYXBwbGljYXRpb25faW5pdCc7XG5pbXBvcnQge2NvbXBpbGVOZ01vZHVsZUZhY3Rvcnl9IGZyb20gJy4uL2FwcGxpY2F0aW9uL2FwcGxpY2F0aW9uX25nbW9kdWxlX2ZhY3RvcnlfY29tcGlsZXInO1xuaW1wb3J0IHtcbiAgX2NhbGxBbmRSZXBvcnRUb0Vycm9ySGFuZGxlcixcbiAgQXBwbGljYXRpb25SZWYsXG4gIEJvb3RzdHJhcE9wdGlvbnMsXG4gIG9wdGlvbnNSZWR1Y2VyLFxuICByZW1vdmUsXG59IGZyb20gJy4uL2FwcGxpY2F0aW9uL2FwcGxpY2F0aW9uX3JlZic7XG5pbXBvcnQge1xuICBnZXROZ1pvbmVPcHRpb25zLFxuICBpbnRlcm5hbFByb3ZpZGVab25lQ2hhbmdlRGV0ZWN0aW9uLFxuICBQUk9WSURFRF9OR19aT05FLFxufSBmcm9tICcuLi9jaGFuZ2VfZGV0ZWN0aW9uL3NjaGVkdWxpbmcvbmdfem9uZV9zY2hlZHVsaW5nJztcbmltcG9ydCB7SW5qZWN0YWJsZSwgSW5qZWN0aW9uVG9rZW4sIEluamVjdG9yfSBmcm9tICcuLi9kaSc7XG5pbXBvcnQge0Vycm9ySGFuZGxlcn0gZnJvbSAnLi4vZXJyb3JfaGFuZGxlcic7XG5pbXBvcnQge1J1bnRpbWVFcnJvciwgUnVudGltZUVycm9yQ29kZX0gZnJvbSAnLi4vZXJyb3JzJztcbmltcG9ydCB7REVGQVVMVF9MT0NBTEVfSUR9IGZyb20gJy4uL2kxOG4vbG9jYWxpemF0aW9uJztcbmltcG9ydCB7TE9DQUxFX0lEfSBmcm9tICcuLi9pMThuL3Rva2Vucyc7XG5pbXBvcnQge1R5cGV9IGZyb20gJy4uL2ludGVyZmFjZS90eXBlJztcbmltcG9ydCB7Q29tcGlsZXJPcHRpb25zfSBmcm9tICcuLi9saW5rZXInO1xuaW1wb3J0IHtJbnRlcm5hbE5nTW9kdWxlUmVmLCBOZ01vZHVsZUZhY3RvcnksIE5nTW9kdWxlUmVmfSBmcm9tICcuLi9saW5rZXIvbmdfbW9kdWxlX2ZhY3RvcnknO1xuaW1wb3J0IHtzZXRMb2NhbGVJZH0gZnJvbSAnLi4vcmVuZGVyMyc7XG5pbXBvcnQge2NyZWF0ZU5nTW9kdWxlUmVmV2l0aFByb3ZpZGVyc30gZnJvbSAnLi4vcmVuZGVyMy9uZ19tb2R1bGVfcmVmJztcbmltcG9ydCB7c3RyaW5naWZ5fSBmcm9tICcuLi91dGlsL3N0cmluZ2lmeSc7XG5pbXBvcnQge2dldE5nWm9uZX0gZnJvbSAnLi4vem9uZS9uZ196b25lJztcblxuLyoqXG4gKiBJbnRlcm5hbCB0b2tlbiB0aGF0IGFsbG93cyB0byByZWdpc3RlciBleHRyYSBjYWxsYmFja3MgdGhhdCBzaG91bGQgYmUgaW52b2tlZCBkdXJpbmcgdGhlXG4gKiBgUGxhdGZvcm1SZWYuZGVzdHJveWAgb3BlcmF0aW9uLiBUaGlzIHRva2VuIGlzIG5lZWRlZCB0byBhdm9pZCBhIGRpcmVjdCByZWZlcmVuY2UgdG8gdGhlXG4gKiBgUGxhdGZvcm1SZWZgIGNsYXNzIChpLmUuIHJlZ2lzdGVyIHRoZSBjYWxsYmFjayB2aWEgYFBsYXRmb3JtUmVmLm9uRGVzdHJveWApLCB0aHVzIG1ha2luZyB0aGVcbiAqIGVudGlyZSBjbGFzcyB0cmVlLXNoYWtlYWJsZS5cbiAqL1xuZXhwb3J0IGNvbnN0IFBMQVRGT1JNX0RFU1RST1lfTElTVEVORVJTID0gbmV3IEluamVjdGlvblRva2VuPFNldDxWb2lkRnVuY3Rpb24+PihcbiAgbmdEZXZNb2RlID8gJ1BsYXRmb3JtRGVzdHJveUxpc3RlbmVycycgOiAnJyxcbik7XG5cbi8qKlxuICogVGhlIEFuZ3VsYXIgcGxhdGZvcm0gaXMgdGhlIGVudHJ5IHBvaW50IGZvciBBbmd1bGFyIG9uIGEgd2ViIHBhZ2UuXG4gKiBFYWNoIHBhZ2UgaGFzIGV4YWN0bHkgb25lIHBsYXRmb3JtLiBTZXJ2aWNlcyAoc3VjaCBhcyByZWZsZWN0aW9uKSB3aGljaCBhcmUgY29tbW9uXG4gKiB0byBldmVyeSBBbmd1bGFyIGFwcGxpY2F0aW9uIHJ1bm5pbmcgb24gdGhlIHBhZ2UgYXJlIGJvdW5kIGluIGl0cyBzY29wZS5cbiAqIEEgcGFnZSdzIHBsYXRmb3JtIGlzIGluaXRpYWxpemVkIGltcGxpY2l0bHkgd2hlbiBhIHBsYXRmb3JtIGlzIGNyZWF0ZWQgdXNpbmcgYSBwbGF0Zm9ybVxuICogZmFjdG9yeSBzdWNoIGFzIGBQbGF0Zm9ybUJyb3dzZXJgLCBvciBleHBsaWNpdGx5IGJ5IGNhbGxpbmcgdGhlIGBjcmVhdGVQbGF0Zm9ybSgpYCBmdW5jdGlvbi5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbkBJbmplY3RhYmxlKHtwcm92aWRlZEluOiAncGxhdGZvcm0nfSlcbmV4cG9ydCBjbGFzcyBQbGF0Zm9ybVJlZiB7XG4gIHByaXZhdGUgX21vZHVsZXM6IE5nTW9kdWxlUmVmPGFueT5bXSA9IFtdO1xuICBwcml2YXRlIF9kZXN0cm95TGlzdGVuZXJzOiBBcnJheTwoKSA9PiB2b2lkPiA9IFtdO1xuICBwcml2YXRlIF9kZXN0cm95ZWQ6IGJvb2xlYW4gPSBmYWxzZTtcblxuICAvKiogQGludGVybmFsICovXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgX2luamVjdG9yOiBJbmplY3Rvcikge31cblxuICAvKipcbiAgICogQ3JlYXRlcyBhbiBpbnN0YW5jZSBvZiBhbiBgQE5nTW9kdWxlYCBmb3IgdGhlIGdpdmVuIHBsYXRmb3JtLlxuICAgKlxuICAgKiBAZGVwcmVjYXRlZCBQYXNzaW5nIE5nTW9kdWxlIGZhY3RvcmllcyBhcyB0aGUgYFBsYXRmb3JtUmVmLmJvb3RzdHJhcE1vZHVsZUZhY3RvcnlgIGZ1bmN0aW9uXG4gICAqICAgICBhcmd1bWVudCBpcyBkZXByZWNhdGVkLiBVc2UgdGhlIGBQbGF0Zm9ybVJlZi5ib290c3RyYXBNb2R1bGVgIEFQSSBpbnN0ZWFkLlxuICAgKi9cbiAgYm9vdHN0cmFwTW9kdWxlRmFjdG9yeTxNPihcbiAgICBtb2R1bGVGYWN0b3J5OiBOZ01vZHVsZUZhY3Rvcnk8TT4sXG4gICAgb3B0aW9ucz86IEJvb3RzdHJhcE9wdGlvbnMsXG4gICk6IFByb21pc2U8TmdNb2R1bGVSZWY8TT4+IHtcbiAgICAvLyBOb3RlOiBXZSBuZWVkIHRvIGNyZWF0ZSB0aGUgTmdab25lIF9iZWZvcmVfIHdlIGluc3RhbnRpYXRlIHRoZSBtb2R1bGUsXG4gICAgLy8gYXMgaW5zdGFudGlhdGluZyB0aGUgbW9kdWxlIGNyZWF0ZXMgc29tZSBwcm92aWRlcnMgZWFnZXJseS5cbiAgICAvLyBTbyB3ZSBjcmVhdGUgYSBtaW5pIHBhcmVudCBpbmplY3RvciB0aGF0IGp1c3QgY29udGFpbnMgdGhlIG5ldyBOZ1pvbmUgYW5kXG4gICAgLy8gcGFzcyB0aGF0IGFzIHBhcmVudCB0byB0aGUgTmdNb2R1bGVGYWN0b3J5LlxuICAgIGNvbnN0IG5nWm9uZSA9IGdldE5nWm9uZShcbiAgICAgIG9wdGlvbnM/Lm5nWm9uZSxcbiAgICAgIGdldE5nWm9uZU9wdGlvbnMoe1xuICAgICAgICBldmVudENvYWxlc2Npbmc6IG9wdGlvbnM/Lm5nWm9uZUV2ZW50Q29hbGVzY2luZyxcbiAgICAgICAgcnVuQ29hbGVzY2luZzogb3B0aW9ucz8ubmdab25lUnVuQ29hbGVzY2luZyxcbiAgICAgIH0pLFxuICAgICk7XG4gICAgLy8gTm90ZTogQ3JlYXRlIG5nWm9uZUluamVjdG9yIHdpdGhpbiBuZ1pvbmUucnVuIHNvIHRoYXQgYWxsIG9mIHRoZSBpbnN0YW50aWF0ZWQgc2VydmljZXMgYXJlXG4gICAgLy8gY3JlYXRlZCB3aXRoaW4gdGhlIEFuZ3VsYXIgem9uZVxuICAgIC8vIERvIG5vdCB0cnkgdG8gcmVwbGFjZSBuZ1pvbmUucnVuIHdpdGggQXBwbGljYXRpb25SZWYjcnVuIGJlY2F1c2UgQXBwbGljYXRpb25SZWYgd291bGQgdGhlbiBiZVxuICAgIC8vIGNyZWF0ZWQgb3V0c2lkZSBvZiB0aGUgQW5ndWxhciB6b25lLlxuICAgIHJldHVybiBuZ1pvbmUucnVuKCgpID0+IHtcbiAgICAgIGNvbnN0IGlnbm9yZUNoYW5nZXNPdXRzaWRlWm9uZSA9IG9wdGlvbnM/Lmlnbm9yZUNoYW5nZXNPdXRzaWRlWm9uZTtcbiAgICAgIGNvbnN0IG1vZHVsZVJlZiA9IGNyZWF0ZU5nTW9kdWxlUmVmV2l0aFByb3ZpZGVycyhcbiAgICAgICAgbW9kdWxlRmFjdG9yeS5tb2R1bGVUeXBlLFxuICAgICAgICB0aGlzLmluamVjdG9yLFxuICAgICAgICBpbnRlcm5hbFByb3ZpZGVab25lQ2hhbmdlRGV0ZWN0aW9uKHtuZ1pvbmVGYWN0b3J5OiAoKSA9PiBuZ1pvbmUsIGlnbm9yZUNoYW5nZXNPdXRzaWRlWm9uZX0pLFxuICAgICAgKTtcblxuICAgICAgaWYgKFxuICAgICAgICAodHlwZW9mIG5nRGV2TW9kZSA9PT0gJ3VuZGVmaW5lZCcgfHwgbmdEZXZNb2RlKSAmJlxuICAgICAgICBtb2R1bGVSZWYuaW5qZWN0b3IuZ2V0KFBST1ZJREVEX05HX1pPTkUsIG51bGwpICE9PSBudWxsXG4gICAgICApIHtcbiAgICAgICAgdGhyb3cgbmV3IFJ1bnRpbWVFcnJvcihcbiAgICAgICAgICBSdW50aW1lRXJyb3JDb2RlLlBST1ZJREVSX0lOX1dST05HX0NPTlRFWFQsXG4gICAgICAgICAgJ2Bib290c3RyYXBNb2R1bGVgIGRvZXMgbm90IHN1cHBvcnQgYHByb3ZpZGVab25lQ2hhbmdlRGV0ZWN0aW9uYC4gVXNlIGBCb290c3RyYXBPcHRpb25zYCBpbnN0ZWFkLicsXG4gICAgICAgICk7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGV4Y2VwdGlvbkhhbmRsZXIgPSBtb2R1bGVSZWYuaW5qZWN0b3IuZ2V0KEVycm9ySGFuZGxlciwgbnVsbCk7XG4gICAgICBpZiAoKHR5cGVvZiBuZ0Rldk1vZGUgPT09ICd1bmRlZmluZWQnIHx8IG5nRGV2TW9kZSkgJiYgZXhjZXB0aW9uSGFuZGxlciA9PT0gbnVsbCkge1xuICAgICAgICB0aHJvdyBuZXcgUnVudGltZUVycm9yKFxuICAgICAgICAgIFJ1bnRpbWVFcnJvckNvZGUuTUlTU0lOR19SRVFVSVJFRF9JTkpFQ1RBQkxFX0lOX0JPT1RTVFJBUCxcbiAgICAgICAgICAnTm8gRXJyb3JIYW5kbGVyLiBJcyBwbGF0Zm9ybSBtb2R1bGUgKEJyb3dzZXJNb2R1bGUpIGluY2x1ZGVkPycsXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgICBuZ1pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4ge1xuICAgICAgICBjb25zdCBzdWJzY3JpcHRpb24gPSBuZ1pvbmUub25FcnJvci5zdWJzY3JpYmUoe1xuICAgICAgICAgIG5leHQ6IChlcnJvcjogYW55KSA9PiB7XG4gICAgICAgICAgICBleGNlcHRpb25IYW5kbGVyIS5oYW5kbGVFcnJvcihlcnJvcik7XG4gICAgICAgICAgfSxcbiAgICAgICAgfSk7XG4gICAgICAgIG1vZHVsZVJlZi5vbkRlc3Ryb3koKCkgPT4ge1xuICAgICAgICAgIHJlbW92ZSh0aGlzLl9tb2R1bGVzLCBtb2R1bGVSZWYpO1xuICAgICAgICAgIHN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIF9jYWxsQW5kUmVwb3J0VG9FcnJvckhhbmRsZXIoZXhjZXB0aW9uSGFuZGxlciEsIG5nWm9uZSwgKCkgPT4ge1xuICAgICAgICBjb25zdCBpbml0U3RhdHVzOiBBcHBsaWNhdGlvbkluaXRTdGF0dXMgPSBtb2R1bGVSZWYuaW5qZWN0b3IuZ2V0KEFwcGxpY2F0aW9uSW5pdFN0YXR1cyk7XG4gICAgICAgIGluaXRTdGF0dXMucnVuSW5pdGlhbGl6ZXJzKCk7XG4gICAgICAgIHJldHVybiBpbml0U3RhdHVzLmRvbmVQcm9taXNlLnRoZW4oKCkgPT4ge1xuICAgICAgICAgIC8vIElmIHRoZSBgTE9DQUxFX0lEYCBwcm92aWRlciBpcyBkZWZpbmVkIGF0IGJvb3RzdHJhcCB0aGVuIHdlIHNldCB0aGUgdmFsdWUgZm9yIGl2eVxuICAgICAgICAgIGNvbnN0IGxvY2FsZUlkID0gbW9kdWxlUmVmLmluamVjdG9yLmdldChMT0NBTEVfSUQsIERFRkFVTFRfTE9DQUxFX0lEKTtcbiAgICAgICAgICBzZXRMb2NhbGVJZChsb2NhbGVJZCB8fCBERUZBVUxUX0xPQ0FMRV9JRCk7XG4gICAgICAgICAgdGhpcy5fbW9kdWxlRG9Cb290c3RyYXAobW9kdWxlUmVmKTtcbiAgICAgICAgICByZXR1cm4gbW9kdWxlUmVmO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYW4gaW5zdGFuY2Ugb2YgYW4gYEBOZ01vZHVsZWAgZm9yIGEgZ2l2ZW4gcGxhdGZvcm0uXG4gICAqXG4gICAqIEB1c2FnZU5vdGVzXG4gICAqICMjIyBTaW1wbGUgRXhhbXBsZVxuICAgKlxuICAgKiBgYGB0eXBlc2NyaXB0XG4gICAqIEBOZ01vZHVsZSh7XG4gICAqICAgaW1wb3J0czogW0Jyb3dzZXJNb2R1bGVdXG4gICAqIH0pXG4gICAqIGNsYXNzIE15TW9kdWxlIHt9XG4gICAqXG4gICAqIGxldCBtb2R1bGVSZWYgPSBwbGF0Zm9ybUJyb3dzZXIoKS5ib290c3RyYXBNb2R1bGUoTXlNb2R1bGUpO1xuICAgKiBgYGBcbiAgICpcbiAgICovXG4gIGJvb3RzdHJhcE1vZHVsZTxNPihcbiAgICBtb2R1bGVUeXBlOiBUeXBlPE0+LFxuICAgIGNvbXBpbGVyT3B0aW9uczpcbiAgICAgIHwgKENvbXBpbGVyT3B0aW9ucyAmIEJvb3RzdHJhcE9wdGlvbnMpXG4gICAgICB8IEFycmF5PENvbXBpbGVyT3B0aW9ucyAmIEJvb3RzdHJhcE9wdGlvbnM+ID0gW10sXG4gICk6IFByb21pc2U8TmdNb2R1bGVSZWY8TT4+IHtcbiAgICBjb25zdCBvcHRpb25zID0gb3B0aW9uc1JlZHVjZXIoe30sIGNvbXBpbGVyT3B0aW9ucyk7XG4gICAgcmV0dXJuIGNvbXBpbGVOZ01vZHVsZUZhY3RvcnkodGhpcy5pbmplY3Rvciwgb3B0aW9ucywgbW9kdWxlVHlwZSkudGhlbigobW9kdWxlRmFjdG9yeSkgPT5cbiAgICAgIHRoaXMuYm9vdHN0cmFwTW9kdWxlRmFjdG9yeShtb2R1bGVGYWN0b3J5LCBvcHRpb25zKSxcbiAgICApO1xuICB9XG5cbiAgcHJpdmF0ZSBfbW9kdWxlRG9Cb290c3RyYXAobW9kdWxlUmVmOiBJbnRlcm5hbE5nTW9kdWxlUmVmPGFueT4pOiB2b2lkIHtcbiAgICBjb25zdCBhcHBSZWYgPSBtb2R1bGVSZWYuaW5qZWN0b3IuZ2V0KEFwcGxpY2F0aW9uUmVmKTtcbiAgICBpZiAobW9kdWxlUmVmLl9ib290c3RyYXBDb21wb25lbnRzLmxlbmd0aCA+IDApIHtcbiAgICAgIG1vZHVsZVJlZi5fYm9vdHN0cmFwQ29tcG9uZW50cy5mb3JFYWNoKChmKSA9PiBhcHBSZWYuYm9vdHN0cmFwKGYpKTtcbiAgICB9IGVsc2UgaWYgKG1vZHVsZVJlZi5pbnN0YW5jZS5uZ0RvQm9vdHN0cmFwKSB7XG4gICAgICBtb2R1bGVSZWYuaW5zdGFuY2UubmdEb0Jvb3RzdHJhcChhcHBSZWYpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBuZXcgUnVudGltZUVycm9yKFxuICAgICAgICBSdW50aW1lRXJyb3JDb2RlLkJPT1RTVFJBUF9DT01QT05FTlRTX05PVF9GT1VORCxcbiAgICAgICAgbmdEZXZNb2RlICYmXG4gICAgICAgICAgYFRoZSBtb2R1bGUgJHtzdHJpbmdpZnkobW9kdWxlUmVmLmluc3RhbmNlLmNvbnN0cnVjdG9yKX0gd2FzIGJvb3RzdHJhcHBlZCwgYCArXG4gICAgICAgICAgICBgYnV0IGl0IGRvZXMgbm90IGRlY2xhcmUgXCJATmdNb2R1bGUuYm9vdHN0cmFwXCIgY29tcG9uZW50cyBub3IgYSBcIm5nRG9Cb290c3RyYXBcIiBtZXRob2QuIGAgK1xuICAgICAgICAgICAgYFBsZWFzZSBkZWZpbmUgb25lIG9mIHRoZXNlLmAsXG4gICAgICApO1xuICAgIH1cbiAgICB0aGlzLl9tb2R1bGVzLnB1c2gobW9kdWxlUmVmKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZWdpc3RlcnMgYSBsaXN0ZW5lciB0byBiZSBjYWxsZWQgd2hlbiB0aGUgcGxhdGZvcm0gaXMgZGVzdHJveWVkLlxuICAgKi9cbiAgb25EZXN0cm95KGNhbGxiYWNrOiAoKSA9PiB2b2lkKTogdm9pZCB7XG4gICAgdGhpcy5fZGVzdHJveUxpc3RlbmVycy5wdXNoKGNhbGxiYWNrKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXRyaWV2ZXMgdGhlIHBsYXRmb3JtIHtAbGluayBJbmplY3Rvcn0sIHdoaWNoIGlzIHRoZSBwYXJlbnQgaW5qZWN0b3IgZm9yXG4gICAqIGV2ZXJ5IEFuZ3VsYXIgYXBwbGljYXRpb24gb24gdGhlIHBhZ2UgYW5kIHByb3ZpZGVzIHNpbmdsZXRvbiBwcm92aWRlcnMuXG4gICAqL1xuICBnZXQgaW5qZWN0b3IoKTogSW5qZWN0b3Ige1xuICAgIHJldHVybiB0aGlzLl9pbmplY3RvcjtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZXN0cm95cyB0aGUgY3VycmVudCBBbmd1bGFyIHBsYXRmb3JtIGFuZCBhbGwgQW5ndWxhciBhcHBsaWNhdGlvbnMgb24gdGhlIHBhZ2UuXG4gICAqIERlc3Ryb3lzIGFsbCBtb2R1bGVzIGFuZCBsaXN0ZW5lcnMgcmVnaXN0ZXJlZCB3aXRoIHRoZSBwbGF0Zm9ybS5cbiAgICovXG4gIGRlc3Ryb3koKSB7XG4gICAgaWYgKHRoaXMuX2Rlc3Ryb3llZCkge1xuICAgICAgdGhyb3cgbmV3IFJ1bnRpbWVFcnJvcihcbiAgICAgICAgUnVudGltZUVycm9yQ29kZS5QTEFURk9STV9BTFJFQURZX0RFU1RST1lFRCxcbiAgICAgICAgbmdEZXZNb2RlICYmICdUaGUgcGxhdGZvcm0gaGFzIGFscmVhZHkgYmVlbiBkZXN0cm95ZWQhJyxcbiAgICAgICk7XG4gICAgfVxuICAgIHRoaXMuX21vZHVsZXMuc2xpY2UoKS5mb3JFYWNoKChtb2R1bGUpID0+IG1vZHVsZS5kZXN0cm95KCkpO1xuICAgIHRoaXMuX2Rlc3Ryb3lMaXN0ZW5lcnMuZm9yRWFjaCgobGlzdGVuZXIpID0+IGxpc3RlbmVyKCkpO1xuXG4gICAgY29uc3QgZGVzdHJveUxpc3RlbmVycyA9IHRoaXMuX2luamVjdG9yLmdldChQTEFURk9STV9ERVNUUk9ZX0xJU1RFTkVSUywgbnVsbCk7XG4gICAgaWYgKGRlc3Ryb3lMaXN0ZW5lcnMpIHtcbiAgICAgIGRlc3Ryb3lMaXN0ZW5lcnMuZm9yRWFjaCgobGlzdGVuZXIpID0+IGxpc3RlbmVyKCkpO1xuICAgICAgZGVzdHJveUxpc3RlbmVycy5jbGVhcigpO1xuICAgIH1cblxuICAgIHRoaXMuX2Rlc3Ryb3llZCA9IHRydWU7XG4gIH1cblxuICAvKipcbiAgICogSW5kaWNhdGVzIHdoZXRoZXIgdGhpcyBpbnN0YW5jZSB3YXMgZGVzdHJveWVkLlxuICAgKi9cbiAgZ2V0IGRlc3Ryb3llZCgpIHtcbiAgICByZXR1cm4gdGhpcy5fZGVzdHJveWVkO1xuICB9XG59XG4iXX0=