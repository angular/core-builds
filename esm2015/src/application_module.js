/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { APP_INITIALIZER, ApplicationInitStatus } from './application_init';
import { ApplicationRef } from './application_ref';
import { APP_ID_RANDOM_PROVIDER } from './application_tokens';
import { IterableDiffers, KeyValueDiffers, defaultIterableDiffers, defaultKeyValueDiffers } from './change_detection/change_detection';
import { Console } from './console';
import { Injector } from './di';
import { Inject, Optional, SkipSelf } from './di/metadata';
import { ErrorHandler } from './error_handler';
import { LOCALE_ID } from './i18n/tokens';
import { ComponentFactoryResolver } from './linker';
import { Compiler } from './linker/compiler';
import { NgModule } from './metadata';
import { SCHEDULER } from './render3/component_ref';
import { NgZone } from './zone';
/**
 * @return {?}
 */
export function _iterableDiffersFactory() {
    return defaultIterableDiffers;
}
/**
 * @return {?}
 */
export function _keyValueDiffersFactory() {
    return defaultKeyValueDiffers;
}
/**
 * @param {?=} locale
 * @return {?}
 */
export function _localeFactory(locale) {
    return locale || 'en-US';
}
/**
 * A built-in [dependency injection token](guide/glossary#di-token)
 * that is used to configure the root injector for bootstrapping.
 * @type {?}
 */
export const APPLICATION_MODULE_PROVIDERS = [
    {
        provide: ApplicationRef,
        useClass: ApplicationRef,
        deps: [NgZone, Console, Injector, ErrorHandler, ComponentFactoryResolver, ApplicationInitStatus]
    },
    { provide: SCHEDULER, deps: [NgZone], useFactory: zoneSchedulerFactory },
    {
        provide: ApplicationInitStatus,
        useClass: ApplicationInitStatus,
        deps: [[new Optional(), APP_INITIALIZER]]
    },
    { provide: Compiler, useClass: Compiler, deps: [] },
    APP_ID_RANDOM_PROVIDER,
    { provide: IterableDiffers, useFactory: _iterableDiffersFactory, deps: [] },
    { provide: KeyValueDiffers, useFactory: _keyValueDiffersFactory, deps: [] },
    {
        provide: LOCALE_ID,
        useFactory: _localeFactory,
        deps: [[new Inject(LOCALE_ID), new Optional(), new SkipSelf()]]
    },
];
/**
 * Schedule work at next available slot.
 *
 * In Ivy this is just `requestAnimationFrame`. For compatibility reasons when bootstrapped
 * using `platformRef.bootstrap` we need to use `NgZone.onStable` as the scheduling mechanism.
 * This overrides the scheduling mechanism in Ivy to `NgZone.onStable`.
 *
 * @param {?} ngZone NgZone to use for scheduling.
 * @return {?}
 */
export function zoneSchedulerFactory(ngZone) {
    /** @type {?} */
    let queue = [];
    ngZone.onStable.subscribe(() => {
        while (queue.length) {
            (/** @type {?} */ (queue.pop()))();
        }
    });
    return function (fn) { queue.push(fn); };
}
/**
 * Configures the root injector for an app with
 * providers of `\@angular/core` dependencies that `ApplicationRef` needs
 * to bootstrap components.
 *
 * Re-exported by `BrowserModule`, which is included automatically in the root
 * `AppModule` when you create a new app with the CLI `new` command.
 *
 * \@publicApi
 */
export class ApplicationModule {
    // Inject ApplicationRef to make it eager...
    /**
     * @param {?} appRef
     */
    constructor(appRef) { }
}
ApplicationModule.decorators = [
    { type: NgModule, args: [{ providers: APPLICATION_MODULE_PROVIDERS },] }
];
/** @nocollapse */
ApplicationModule.ctorParameters = () => [
    { type: ApplicationRef }
];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwbGljYXRpb25fbW9kdWxlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvYXBwbGljYXRpb25fbW9kdWxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUFDLGVBQWUsRUFBRSxxQkFBcUIsRUFBQyxNQUFNLG9CQUFvQixDQUFDO0FBQzFFLE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUNqRCxPQUFPLEVBQUMsc0JBQXNCLEVBQUMsTUFBTSxzQkFBc0IsQ0FBQztBQUM1RCxPQUFPLEVBQUMsZUFBZSxFQUFFLGVBQWUsRUFBRSxzQkFBc0IsRUFBRSxzQkFBc0IsRUFBQyxNQUFNLHFDQUFxQyxDQUFDO0FBQ3JJLE9BQU8sRUFBQyxPQUFPLEVBQUMsTUFBTSxXQUFXLENBQUM7QUFDbEMsT0FBTyxFQUFDLFFBQVEsRUFBaUIsTUFBTSxNQUFNLENBQUM7QUFDOUMsT0FBTyxFQUFDLE1BQU0sRUFBRSxRQUFRLEVBQUUsUUFBUSxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQ3pELE9BQU8sRUFBQyxZQUFZLEVBQUMsTUFBTSxpQkFBaUIsQ0FBQztBQUM3QyxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQ3hDLE9BQU8sRUFBQyx3QkFBd0IsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUNsRCxPQUFPLEVBQUMsUUFBUSxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDM0MsT0FBTyxFQUFDLFFBQVEsRUFBQyxNQUFNLFlBQVksQ0FBQztBQUNwQyxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0seUJBQXlCLENBQUM7QUFDbEQsT0FBTyxFQUFDLE1BQU0sRUFBQyxNQUFNLFFBQVEsQ0FBQzs7OztBQUU5QixNQUFNLFVBQVUsdUJBQXVCO0lBQ3JDLE9BQU8sc0JBQXNCLENBQUM7QUFDaEMsQ0FBQzs7OztBQUVELE1BQU0sVUFBVSx1QkFBdUI7SUFDckMsT0FBTyxzQkFBc0IsQ0FBQztBQUNoQyxDQUFDOzs7OztBQUVELE1BQU0sVUFBVSxjQUFjLENBQUMsTUFBZTtJQUM1QyxPQUFPLE1BQU0sSUFBSSxPQUFPLENBQUM7QUFDM0IsQ0FBQzs7Ozs7O0FBTUQsTUFBTSxPQUFPLDRCQUE0QixHQUFxQjtJQUM1RDtRQUNFLE9BQU8sRUFBRSxjQUFjO1FBQ3ZCLFFBQVEsRUFBRSxjQUFjO1FBQ3hCLElBQUksRUFDQSxDQUFDLE1BQU0sRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFFLFlBQVksRUFBRSx3QkFBd0IsRUFBRSxxQkFBcUIsQ0FBQztLQUMvRjtJQUNELEVBQUMsT0FBTyxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxNQUFNLENBQUMsRUFBRSxVQUFVLEVBQUUsb0JBQW9CLEVBQUM7SUFDdEU7UUFDRSxPQUFPLEVBQUUscUJBQXFCO1FBQzlCLFFBQVEsRUFBRSxxQkFBcUI7UUFDL0IsSUFBSSxFQUFFLENBQUMsQ0FBQyxJQUFJLFFBQVEsRUFBRSxFQUFFLGVBQWUsQ0FBQyxDQUFDO0tBQzFDO0lBQ0QsRUFBQyxPQUFPLEVBQUUsUUFBUSxFQUFFLFFBQVEsRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBQztJQUNqRCxzQkFBc0I7SUFDdEIsRUFBQyxPQUFPLEVBQUUsZUFBZSxFQUFFLFVBQVUsRUFBRSx1QkFBdUIsRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFDO0lBQ3pFLEVBQUMsT0FBTyxFQUFFLGVBQWUsRUFBRSxVQUFVLEVBQUUsdUJBQXVCLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBQztJQUN6RTtRQUNFLE9BQU8sRUFBRSxTQUFTO1FBQ2xCLFVBQVUsRUFBRSxjQUFjO1FBQzFCLElBQUksRUFBRSxDQUFDLENBQUMsSUFBSSxNQUFNLENBQUMsU0FBUyxDQUFDLEVBQUUsSUFBSSxRQUFRLEVBQUUsRUFBRSxJQUFJLFFBQVEsRUFBRSxDQUFDLENBQUM7S0FDaEU7Q0FDRjs7Ozs7Ozs7Ozs7QUFXRCxNQUFNLFVBQVUsb0JBQW9CLENBQUMsTUFBYzs7UUFDN0MsS0FBSyxHQUFtQixFQUFFO0lBQzlCLE1BQU0sQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLEdBQUcsRUFBRTtRQUM3QixPQUFPLEtBQUssQ0FBQyxNQUFNLEVBQUU7WUFDbkIsbUJBQUEsS0FBSyxDQUFDLEdBQUcsRUFBRSxFQUFFLEVBQUUsQ0FBQztTQUNqQjtJQUNILENBQUMsQ0FBQyxDQUFDO0lBQ0gsT0FBTyxVQUFTLEVBQWMsSUFBSSxLQUFLLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3RELENBQUM7Ozs7Ozs7Ozs7O0FBYUQsTUFBTSxPQUFPLGlCQUFpQjs7Ozs7SUFFNUIsWUFBWSxNQUFzQixJQUFHLENBQUM7OztZQUh2QyxRQUFRLFNBQUMsRUFBQyxTQUFTLEVBQUUsNEJBQTRCLEVBQUM7Ozs7WUFuRjNDLGNBQWMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7QVBQX0lOSVRJQUxJWkVSLCBBcHBsaWNhdGlvbkluaXRTdGF0dXN9IGZyb20gJy4vYXBwbGljYXRpb25faW5pdCc7XG5pbXBvcnQge0FwcGxpY2F0aW9uUmVmfSBmcm9tICcuL2FwcGxpY2F0aW9uX3JlZic7XG5pbXBvcnQge0FQUF9JRF9SQU5ET01fUFJPVklERVJ9IGZyb20gJy4vYXBwbGljYXRpb25fdG9rZW5zJztcbmltcG9ydCB7SXRlcmFibGVEaWZmZXJzLCBLZXlWYWx1ZURpZmZlcnMsIGRlZmF1bHRJdGVyYWJsZURpZmZlcnMsIGRlZmF1bHRLZXlWYWx1ZURpZmZlcnN9IGZyb20gJy4vY2hhbmdlX2RldGVjdGlvbi9jaGFuZ2VfZGV0ZWN0aW9uJztcbmltcG9ydCB7Q29uc29sZX0gZnJvbSAnLi9jb25zb2xlJztcbmltcG9ydCB7SW5qZWN0b3IsIFN0YXRpY1Byb3ZpZGVyfSBmcm9tICcuL2RpJztcbmltcG9ydCB7SW5qZWN0LCBPcHRpb25hbCwgU2tpcFNlbGZ9IGZyb20gJy4vZGkvbWV0YWRhdGEnO1xuaW1wb3J0IHtFcnJvckhhbmRsZXJ9IGZyb20gJy4vZXJyb3JfaGFuZGxlcic7XG5pbXBvcnQge0xPQ0FMRV9JRH0gZnJvbSAnLi9pMThuL3Rva2Vucyc7XG5pbXBvcnQge0NvbXBvbmVudEZhY3RvcnlSZXNvbHZlcn0gZnJvbSAnLi9saW5rZXInO1xuaW1wb3J0IHtDb21waWxlcn0gZnJvbSAnLi9saW5rZXIvY29tcGlsZXInO1xuaW1wb3J0IHtOZ01vZHVsZX0gZnJvbSAnLi9tZXRhZGF0YSc7XG5pbXBvcnQge1NDSEVEVUxFUn0gZnJvbSAnLi9yZW5kZXIzL2NvbXBvbmVudF9yZWYnO1xuaW1wb3J0IHtOZ1pvbmV9IGZyb20gJy4vem9uZSc7XG5cbmV4cG9ydCBmdW5jdGlvbiBfaXRlcmFibGVEaWZmZXJzRmFjdG9yeSgpIHtcbiAgcmV0dXJuIGRlZmF1bHRJdGVyYWJsZURpZmZlcnM7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBfa2V5VmFsdWVEaWZmZXJzRmFjdG9yeSgpIHtcbiAgcmV0dXJuIGRlZmF1bHRLZXlWYWx1ZURpZmZlcnM7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBfbG9jYWxlRmFjdG9yeShsb2NhbGU/OiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gbG9jYWxlIHx8ICdlbi1VUyc7XG59XG5cbi8qKlxuICogQSBidWlsdC1pbiBbZGVwZW5kZW5jeSBpbmplY3Rpb24gdG9rZW5dKGd1aWRlL2dsb3NzYXJ5I2RpLXRva2VuKVxuICogdGhhdCBpcyB1c2VkIHRvIGNvbmZpZ3VyZSB0aGUgcm9vdCBpbmplY3RvciBmb3IgYm9vdHN0cmFwcGluZy5cbiAqL1xuZXhwb3J0IGNvbnN0IEFQUExJQ0FUSU9OX01PRFVMRV9QUk9WSURFUlM6IFN0YXRpY1Byb3ZpZGVyW10gPSBbXG4gIHtcbiAgICBwcm92aWRlOiBBcHBsaWNhdGlvblJlZixcbiAgICB1c2VDbGFzczogQXBwbGljYXRpb25SZWYsXG4gICAgZGVwczpcbiAgICAgICAgW05nWm9uZSwgQ29uc29sZSwgSW5qZWN0b3IsIEVycm9ySGFuZGxlciwgQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyLCBBcHBsaWNhdGlvbkluaXRTdGF0dXNdXG4gIH0sXG4gIHtwcm92aWRlOiBTQ0hFRFVMRVIsIGRlcHM6IFtOZ1pvbmVdLCB1c2VGYWN0b3J5OiB6b25lU2NoZWR1bGVyRmFjdG9yeX0sXG4gIHtcbiAgICBwcm92aWRlOiBBcHBsaWNhdGlvbkluaXRTdGF0dXMsXG4gICAgdXNlQ2xhc3M6IEFwcGxpY2F0aW9uSW5pdFN0YXR1cyxcbiAgICBkZXBzOiBbW25ldyBPcHRpb25hbCgpLCBBUFBfSU5JVElBTElaRVJdXVxuICB9LFxuICB7cHJvdmlkZTogQ29tcGlsZXIsIHVzZUNsYXNzOiBDb21waWxlciwgZGVwczogW119LFxuICBBUFBfSURfUkFORE9NX1BST1ZJREVSLFxuICB7cHJvdmlkZTogSXRlcmFibGVEaWZmZXJzLCB1c2VGYWN0b3J5OiBfaXRlcmFibGVEaWZmZXJzRmFjdG9yeSwgZGVwczogW119LFxuICB7cHJvdmlkZTogS2V5VmFsdWVEaWZmZXJzLCB1c2VGYWN0b3J5OiBfa2V5VmFsdWVEaWZmZXJzRmFjdG9yeSwgZGVwczogW119LFxuICB7XG4gICAgcHJvdmlkZTogTE9DQUxFX0lELFxuICAgIHVzZUZhY3Rvcnk6IF9sb2NhbGVGYWN0b3J5LFxuICAgIGRlcHM6IFtbbmV3IEluamVjdChMT0NBTEVfSUQpLCBuZXcgT3B0aW9uYWwoKSwgbmV3IFNraXBTZWxmKCldXVxuICB9LFxuXTtcblxuLyoqXG4gKiBTY2hlZHVsZSB3b3JrIGF0IG5leHQgYXZhaWxhYmxlIHNsb3QuXG4gKlxuICogSW4gSXZ5IHRoaXMgaXMganVzdCBgcmVxdWVzdEFuaW1hdGlvbkZyYW1lYC4gRm9yIGNvbXBhdGliaWxpdHkgcmVhc29ucyB3aGVuIGJvb3RzdHJhcHBlZFxuICogdXNpbmcgYHBsYXRmb3JtUmVmLmJvb3RzdHJhcGAgd2UgbmVlZCB0byB1c2UgYE5nWm9uZS5vblN0YWJsZWAgYXMgdGhlIHNjaGVkdWxpbmcgbWVjaGFuaXNtLlxuICogVGhpcyBvdmVycmlkZXMgdGhlIHNjaGVkdWxpbmcgbWVjaGFuaXNtIGluIEl2eSB0byBgTmdab25lLm9uU3RhYmxlYC5cbiAqXG4gKiBAcGFyYW0gbmdab25lIE5nWm9uZSB0byB1c2UgZm9yIHNjaGVkdWxpbmcuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB6b25lU2NoZWR1bGVyRmFjdG9yeShuZ1pvbmU6IE5nWm9uZSk6IChmbjogKCkgPT4gdm9pZCkgPT4gdm9pZCB7XG4gIGxldCBxdWV1ZTogKCgpID0+IHZvaWQpW10gPSBbXTtcbiAgbmdab25lLm9uU3RhYmxlLnN1YnNjcmliZSgoKSA9PiB7XG4gICAgd2hpbGUgKHF1ZXVlLmxlbmd0aCkge1xuICAgICAgcXVldWUucG9wKCkgISgpO1xuICAgIH1cbiAgfSk7XG4gIHJldHVybiBmdW5jdGlvbihmbjogKCkgPT4gdm9pZCkgeyBxdWV1ZS5wdXNoKGZuKTsgfTtcbn1cblxuLyoqXG4gKiBDb25maWd1cmVzIHRoZSByb290IGluamVjdG9yIGZvciBhbiBhcHAgd2l0aFxuICogcHJvdmlkZXJzIG9mIGBAYW5ndWxhci9jb3JlYCBkZXBlbmRlbmNpZXMgdGhhdCBgQXBwbGljYXRpb25SZWZgIG5lZWRzXG4gKiB0byBib290c3RyYXAgY29tcG9uZW50cy5cbiAqXG4gKiBSZS1leHBvcnRlZCBieSBgQnJvd3Nlck1vZHVsZWAsIHdoaWNoIGlzIGluY2x1ZGVkIGF1dG9tYXRpY2FsbHkgaW4gdGhlIHJvb3RcbiAqIGBBcHBNb2R1bGVgIHdoZW4geW91IGNyZWF0ZSBhIG5ldyBhcHAgd2l0aCB0aGUgQ0xJIGBuZXdgIGNvbW1hbmQuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5ATmdNb2R1bGUoe3Byb3ZpZGVyczogQVBQTElDQVRJT05fTU9EVUxFX1BST1ZJREVSU30pXG5leHBvcnQgY2xhc3MgQXBwbGljYXRpb25Nb2R1bGUge1xuICAvLyBJbmplY3QgQXBwbGljYXRpb25SZWYgdG8gbWFrZSBpdCBlYWdlci4uLlxuICBjb25zdHJ1Y3RvcihhcHBSZWY6IEFwcGxpY2F0aW9uUmVmKSB7fVxufVxuIl19