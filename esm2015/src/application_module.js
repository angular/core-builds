/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
import { APP_INITIALIZER, ApplicationInitStatus } from './application_init';
import { ApplicationRef } from './application_ref';
import { APP_ID_RANDOM_PROVIDER } from './application_tokens';
import { IterableDiffers, KeyValueDiffers, defaultIterableDiffers, defaultKeyValueDiffers } from './change_detection/change_detection';
import { Console } from './console';
import { Injector } from './di';
import { Inject, Optional, SkipSelf } from './di/metadata';
import { ErrorHandler } from './error_handler';
import { DEFAULT_LOCALE_ID } from './i18n/localization';
import { LOCALE_ID } from './i18n/tokens';
import { ivyEnabled } from './ivy_switch';
import { ComponentFactoryResolver } from './linker';
import { Compiler } from './linker/compiler';
import { NgModule } from './metadata';
import { SCHEDULER } from './render3/component_ref';
import { setLocaleId } from './render3/i18n';
import { NgZone } from './zone';
import * as i0 from "./r3_symbols";
import * as i1 from "./application_ref";
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
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
    if (locale) {
        if (ivyEnabled) {
            setLocaleId(locale);
        }
        return locale;
    }
    // Use `goog.LOCALE` as default value for `LOCALE_ID` token for Closure Compiler.
    // Note: default `goog.LOCALE` value is `en`, when Angular used `en-US`. In order to preserve
    // backwards compatibility, we use Angular default value over Closure Compiler's one.
    if (ngI18nClosureMode && typeof goog !== 'undefined' && goog.LOCALE !== 'en') {
        if (ivyEnabled) {
            setLocaleId(goog.LOCALE);
        }
        return goog.LOCALE;
    }
    return DEFAULT_LOCALE_ID;
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
    ngZone.onStable.subscribe((/**
     * @return {?}
     */
    () => {
        while (queue.length) {
            (/** @type {?} */ (queue.pop()))();
        }
    }));
    return (/**
     * @param {?} fn
     * @return {?}
     */
    function (fn) { queue.push(fn); });
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
    { type: NgModule, args: [{ providers: APPLICATION_MODULE_PROVIDERS },] },
];
/** @nocollapse */
ApplicationModule.ctorParameters = () => [
    { type: ApplicationRef }
];
/** @nocollapse */ ApplicationModule.ɵmod = i0.ɵɵdefineNgModule({ type: ApplicationModule });
/** @nocollapse */ ApplicationModule.ɵinj = i0.ɵɵdefineInjector({ factory: function ApplicationModule_Factory(t) { return new (t || ApplicationModule)(i0.ɵɵinject(i1.ApplicationRef)); }, providers: APPLICATION_MODULE_PROVIDERS });
/*@__PURE__*/ i0.setClassMetadata(ApplicationModule, [{
        type: NgModule,
        args: [{ providers: APPLICATION_MODULE_PROVIDERS }]
    }], function () { return [{ type: i1.ApplicationRef }]; }, null);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwbGljYXRpb25fbW9kdWxlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvYXBwbGljYXRpb25fbW9kdWxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7QUFRQSxPQUFPLEVBQUMsZUFBZSxFQUFFLHFCQUFxQixFQUFDLE1BQU0sb0JBQW9CLENBQUM7QUFDMUUsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQ2pELE9BQU8sRUFBQyxzQkFBc0IsRUFBQyxNQUFNLHNCQUFzQixDQUFDO0FBQzVELE9BQU8sRUFBQyxlQUFlLEVBQUUsZUFBZSxFQUFFLHNCQUFzQixFQUFFLHNCQUFzQixFQUFDLE1BQU0scUNBQXFDLENBQUM7QUFDckksT0FBTyxFQUFDLE9BQU8sRUFBQyxNQUFNLFdBQVcsQ0FBQztBQUNsQyxPQUFPLEVBQUMsUUFBUSxFQUFpQixNQUFNLE1BQU0sQ0FBQztBQUM5QyxPQUFPLEVBQUMsTUFBTSxFQUFFLFFBQVEsRUFBRSxRQUFRLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFDekQsT0FBTyxFQUFDLFlBQVksRUFBQyxNQUFNLGlCQUFpQixDQUFDO0FBQzdDLE9BQU8sRUFBQyxpQkFBaUIsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBQ3RELE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFDeEMsT0FBTyxFQUFDLFVBQVUsRUFBQyxNQUFNLGNBQWMsQ0FBQztBQUN4QyxPQUFPLEVBQUMsd0JBQXdCLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDbEQsT0FBTyxFQUFDLFFBQVEsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQzNDLE9BQU8sRUFBQyxRQUFRLEVBQUMsTUFBTSxZQUFZLENBQUM7QUFDcEMsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLHlCQUF5QixDQUFDO0FBQ2xELE9BQU8sRUFBQyxXQUFXLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUMzQyxPQUFPLEVBQUMsTUFBTSxFQUFDLE1BQU0sUUFBUSxDQUFDOzs7Ozs7Ozs7Ozs7O0FBRTlCLE1BQU0sVUFBVSx1QkFBdUI7SUFDckMsT0FBTyxzQkFBc0IsQ0FBQztBQUNoQyxDQUFDOzs7O0FBRUQsTUFBTSxVQUFVLHVCQUF1QjtJQUNyQyxPQUFPLHNCQUFzQixDQUFDO0FBQ2hDLENBQUM7Ozs7O0FBRUQsTUFBTSxVQUFVLGNBQWMsQ0FBQyxNQUFlO0lBQzVDLElBQUksTUFBTSxFQUFFO1FBQ1YsSUFBSSxVQUFVLEVBQUU7WUFDZCxXQUFXLENBQUMsTUFBTSxDQUFDLENBQUM7U0FDckI7UUFDRCxPQUFPLE1BQU0sQ0FBQztLQUNmO0lBQ0QsaUZBQWlGO0lBQ2pGLDZGQUE2RjtJQUM3RixxRkFBcUY7SUFDckYsSUFBSSxpQkFBaUIsSUFBSSxPQUFPLElBQUksS0FBSyxXQUFXLElBQUksSUFBSSxDQUFDLE1BQU0sS0FBSyxJQUFJLEVBQUU7UUFDNUUsSUFBSSxVQUFVLEVBQUU7WUFDZCxXQUFXLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1NBQzFCO1FBQ0QsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDO0tBQ3BCO0lBQ0QsT0FBTyxpQkFBaUIsQ0FBQztBQUMzQixDQUFDOzs7Ozs7QUFNRCxNQUFNLE9BQU8sNEJBQTRCLEdBQXFCO0lBQzVEO1FBQ0UsT0FBTyxFQUFFLGNBQWM7UUFDdkIsUUFBUSxFQUFFLGNBQWM7UUFDeEIsSUFBSSxFQUNBLENBQUMsTUFBTSxFQUFFLE9BQU8sRUFBRSxRQUFRLEVBQUUsWUFBWSxFQUFFLHdCQUF3QixFQUFFLHFCQUFxQixDQUFDO0tBQy9GO0lBQ0QsRUFBQyxPQUFPLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxDQUFDLE1BQU0sQ0FBQyxFQUFFLFVBQVUsRUFBRSxvQkFBb0IsRUFBQztJQUN0RTtRQUNFLE9BQU8sRUFBRSxxQkFBcUI7UUFDOUIsUUFBUSxFQUFFLHFCQUFxQjtRQUMvQixJQUFJLEVBQUUsQ0FBQyxDQUFDLElBQUksUUFBUSxFQUFFLEVBQUUsZUFBZSxDQUFDLENBQUM7S0FDMUM7SUFDRCxFQUFDLE9BQU8sRUFBRSxRQUFRLEVBQUUsUUFBUSxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFDO0lBQ2pELHNCQUFzQjtJQUN0QixFQUFDLE9BQU8sRUFBRSxlQUFlLEVBQUUsVUFBVSxFQUFFLHVCQUF1QixFQUFFLElBQUksRUFBRSxFQUFFLEVBQUM7SUFDekUsRUFBQyxPQUFPLEVBQUUsZUFBZSxFQUFFLFVBQVUsRUFBRSx1QkFBdUIsRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFDO0lBQ3pFO1FBQ0UsT0FBTyxFQUFFLFNBQVM7UUFDbEIsVUFBVSxFQUFFLGNBQWM7UUFDMUIsSUFBSSxFQUFFLENBQUMsQ0FBQyxJQUFJLE1BQU0sQ0FBQyxTQUFTLENBQUMsRUFBRSxJQUFJLFFBQVEsRUFBRSxFQUFFLElBQUksUUFBUSxFQUFFLENBQUMsQ0FBQztLQUNoRTtDQUNGOzs7Ozs7Ozs7OztBQVdELE1BQU0sVUFBVSxvQkFBb0IsQ0FBQyxNQUFjOztRQUM3QyxLQUFLLEdBQW1CLEVBQUU7SUFDOUIsTUFBTSxDQUFDLFFBQVEsQ0FBQyxTQUFTOzs7SUFBQyxHQUFHLEVBQUU7UUFDN0IsT0FBTyxLQUFLLENBQUMsTUFBTSxFQUFFO1lBQ25CLG1CQUFBLEtBQUssQ0FBQyxHQUFHLEVBQUUsRUFBRSxFQUFFLENBQUM7U0FDakI7SUFDSCxDQUFDLEVBQUMsQ0FBQztJQUNIOzs7O0lBQU8sVUFBUyxFQUFjLElBQUksS0FBSyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBQztBQUN0RCxDQUFDOzs7Ozs7Ozs7OztBQWFELE1BQU0sT0FBTyxpQkFBaUI7Ozs7O0lBRTVCLFlBQVksTUFBc0IsSUFBRyxDQUFDOzs7WUFIdkMsUUFBUSxTQUFDLEVBQUMsU0FBUyxFQUFFLDRCQUE0QixFQUFDOzs7O1lBckczQyxjQUFjOztxREFzR1QsaUJBQWlCO2lIQUFqQixpQkFBaUIsaURBRFIsNEJBQTRCO2tDQUNyQyxpQkFBaUI7Y0FEN0IsUUFBUTtlQUFDLEVBQUMsU0FBUyxFQUFFLDRCQUE0QixFQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0FQUF9JTklUSUFMSVpFUiwgQXBwbGljYXRpb25Jbml0U3RhdHVzfSBmcm9tICcuL2FwcGxpY2F0aW9uX2luaXQnO1xuaW1wb3J0IHtBcHBsaWNhdGlvblJlZn0gZnJvbSAnLi9hcHBsaWNhdGlvbl9yZWYnO1xuaW1wb3J0IHtBUFBfSURfUkFORE9NX1BST1ZJREVSfSBmcm9tICcuL2FwcGxpY2F0aW9uX3Rva2Vucyc7XG5pbXBvcnQge0l0ZXJhYmxlRGlmZmVycywgS2V5VmFsdWVEaWZmZXJzLCBkZWZhdWx0SXRlcmFibGVEaWZmZXJzLCBkZWZhdWx0S2V5VmFsdWVEaWZmZXJzfSBmcm9tICcuL2NoYW5nZV9kZXRlY3Rpb24vY2hhbmdlX2RldGVjdGlvbic7XG5pbXBvcnQge0NvbnNvbGV9IGZyb20gJy4vY29uc29sZSc7XG5pbXBvcnQge0luamVjdG9yLCBTdGF0aWNQcm92aWRlcn0gZnJvbSAnLi9kaSc7XG5pbXBvcnQge0luamVjdCwgT3B0aW9uYWwsIFNraXBTZWxmfSBmcm9tICcuL2RpL21ldGFkYXRhJztcbmltcG9ydCB7RXJyb3JIYW5kbGVyfSBmcm9tICcuL2Vycm9yX2hhbmRsZXInO1xuaW1wb3J0IHtERUZBVUxUX0xPQ0FMRV9JRH0gZnJvbSAnLi9pMThuL2xvY2FsaXphdGlvbic7XG5pbXBvcnQge0xPQ0FMRV9JRH0gZnJvbSAnLi9pMThuL3Rva2Vucyc7XG5pbXBvcnQge2l2eUVuYWJsZWR9IGZyb20gJy4vaXZ5X3N3aXRjaCc7XG5pbXBvcnQge0NvbXBvbmVudEZhY3RvcnlSZXNvbHZlcn0gZnJvbSAnLi9saW5rZXInO1xuaW1wb3J0IHtDb21waWxlcn0gZnJvbSAnLi9saW5rZXIvY29tcGlsZXInO1xuaW1wb3J0IHtOZ01vZHVsZX0gZnJvbSAnLi9tZXRhZGF0YSc7XG5pbXBvcnQge1NDSEVEVUxFUn0gZnJvbSAnLi9yZW5kZXIzL2NvbXBvbmVudF9yZWYnO1xuaW1wb3J0IHtzZXRMb2NhbGVJZH0gZnJvbSAnLi9yZW5kZXIzL2kxOG4nO1xuaW1wb3J0IHtOZ1pvbmV9IGZyb20gJy4vem9uZSc7XG5cbmV4cG9ydCBmdW5jdGlvbiBfaXRlcmFibGVEaWZmZXJzRmFjdG9yeSgpIHtcbiAgcmV0dXJuIGRlZmF1bHRJdGVyYWJsZURpZmZlcnM7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBfa2V5VmFsdWVEaWZmZXJzRmFjdG9yeSgpIHtcbiAgcmV0dXJuIGRlZmF1bHRLZXlWYWx1ZURpZmZlcnM7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBfbG9jYWxlRmFjdG9yeShsb2NhbGU/OiBzdHJpbmcpOiBzdHJpbmcge1xuICBpZiAobG9jYWxlKSB7XG4gICAgaWYgKGl2eUVuYWJsZWQpIHtcbiAgICAgIHNldExvY2FsZUlkKGxvY2FsZSk7XG4gICAgfVxuICAgIHJldHVybiBsb2NhbGU7XG4gIH1cbiAgLy8gVXNlIGBnb29nLkxPQ0FMRWAgYXMgZGVmYXVsdCB2YWx1ZSBmb3IgYExPQ0FMRV9JRGAgdG9rZW4gZm9yIENsb3N1cmUgQ29tcGlsZXIuXG4gIC8vIE5vdGU6IGRlZmF1bHQgYGdvb2cuTE9DQUxFYCB2YWx1ZSBpcyBgZW5gLCB3aGVuIEFuZ3VsYXIgdXNlZCBgZW4tVVNgLiBJbiBvcmRlciB0byBwcmVzZXJ2ZVxuICAvLyBiYWNrd2FyZHMgY29tcGF0aWJpbGl0eSwgd2UgdXNlIEFuZ3VsYXIgZGVmYXVsdCB2YWx1ZSBvdmVyIENsb3N1cmUgQ29tcGlsZXIncyBvbmUuXG4gIGlmIChuZ0kxOG5DbG9zdXJlTW9kZSAmJiB0eXBlb2YgZ29vZyAhPT0gJ3VuZGVmaW5lZCcgJiYgZ29vZy5MT0NBTEUgIT09ICdlbicpIHtcbiAgICBpZiAoaXZ5RW5hYmxlZCkge1xuICAgICAgc2V0TG9jYWxlSWQoZ29vZy5MT0NBTEUpO1xuICAgIH1cbiAgICByZXR1cm4gZ29vZy5MT0NBTEU7XG4gIH1cbiAgcmV0dXJuIERFRkFVTFRfTE9DQUxFX0lEO1xufVxuXG4vKipcbiAqIEEgYnVpbHQtaW4gW2RlcGVuZGVuY3kgaW5qZWN0aW9uIHRva2VuXShndWlkZS9nbG9zc2FyeSNkaS10b2tlbilcbiAqIHRoYXQgaXMgdXNlZCB0byBjb25maWd1cmUgdGhlIHJvb3QgaW5qZWN0b3IgZm9yIGJvb3RzdHJhcHBpbmcuXG4gKi9cbmV4cG9ydCBjb25zdCBBUFBMSUNBVElPTl9NT0RVTEVfUFJPVklERVJTOiBTdGF0aWNQcm92aWRlcltdID0gW1xuICB7XG4gICAgcHJvdmlkZTogQXBwbGljYXRpb25SZWYsXG4gICAgdXNlQ2xhc3M6IEFwcGxpY2F0aW9uUmVmLFxuICAgIGRlcHM6XG4gICAgICAgIFtOZ1pvbmUsIENvbnNvbGUsIEluamVjdG9yLCBFcnJvckhhbmRsZXIsIENvbXBvbmVudEZhY3RvcnlSZXNvbHZlciwgQXBwbGljYXRpb25Jbml0U3RhdHVzXVxuICB9LFxuICB7cHJvdmlkZTogU0NIRURVTEVSLCBkZXBzOiBbTmdab25lXSwgdXNlRmFjdG9yeTogem9uZVNjaGVkdWxlckZhY3Rvcnl9LFxuICB7XG4gICAgcHJvdmlkZTogQXBwbGljYXRpb25Jbml0U3RhdHVzLFxuICAgIHVzZUNsYXNzOiBBcHBsaWNhdGlvbkluaXRTdGF0dXMsXG4gICAgZGVwczogW1tuZXcgT3B0aW9uYWwoKSwgQVBQX0lOSVRJQUxJWkVSXV1cbiAgfSxcbiAge3Byb3ZpZGU6IENvbXBpbGVyLCB1c2VDbGFzczogQ29tcGlsZXIsIGRlcHM6IFtdfSxcbiAgQVBQX0lEX1JBTkRPTV9QUk9WSURFUixcbiAge3Byb3ZpZGU6IEl0ZXJhYmxlRGlmZmVycywgdXNlRmFjdG9yeTogX2l0ZXJhYmxlRGlmZmVyc0ZhY3RvcnksIGRlcHM6IFtdfSxcbiAge3Byb3ZpZGU6IEtleVZhbHVlRGlmZmVycywgdXNlRmFjdG9yeTogX2tleVZhbHVlRGlmZmVyc0ZhY3RvcnksIGRlcHM6IFtdfSxcbiAge1xuICAgIHByb3ZpZGU6IExPQ0FMRV9JRCxcbiAgICB1c2VGYWN0b3J5OiBfbG9jYWxlRmFjdG9yeSxcbiAgICBkZXBzOiBbW25ldyBJbmplY3QoTE9DQUxFX0lEKSwgbmV3IE9wdGlvbmFsKCksIG5ldyBTa2lwU2VsZigpXV1cbiAgfSxcbl07XG5cbi8qKlxuICogU2NoZWR1bGUgd29yayBhdCBuZXh0IGF2YWlsYWJsZSBzbG90LlxuICpcbiAqIEluIEl2eSB0aGlzIGlzIGp1c3QgYHJlcXVlc3RBbmltYXRpb25GcmFtZWAuIEZvciBjb21wYXRpYmlsaXR5IHJlYXNvbnMgd2hlbiBib290c3RyYXBwZWRcbiAqIHVzaW5nIGBwbGF0Zm9ybVJlZi5ib290c3RyYXBgIHdlIG5lZWQgdG8gdXNlIGBOZ1pvbmUub25TdGFibGVgIGFzIHRoZSBzY2hlZHVsaW5nIG1lY2hhbmlzbS5cbiAqIFRoaXMgb3ZlcnJpZGVzIHRoZSBzY2hlZHVsaW5nIG1lY2hhbmlzbSBpbiBJdnkgdG8gYE5nWm9uZS5vblN0YWJsZWAuXG4gKlxuICogQHBhcmFtIG5nWm9uZSBOZ1pvbmUgdG8gdXNlIGZvciBzY2hlZHVsaW5nLlxuICovXG5leHBvcnQgZnVuY3Rpb24gem9uZVNjaGVkdWxlckZhY3Rvcnkobmdab25lOiBOZ1pvbmUpOiAoZm46ICgpID0+IHZvaWQpID0+IHZvaWQge1xuICBsZXQgcXVldWU6ICgoKSA9PiB2b2lkKVtdID0gW107XG4gIG5nWm9uZS5vblN0YWJsZS5zdWJzY3JpYmUoKCkgPT4ge1xuICAgIHdoaWxlIChxdWV1ZS5sZW5ndGgpIHtcbiAgICAgIHF1ZXVlLnBvcCgpICEoKTtcbiAgICB9XG4gIH0pO1xuICByZXR1cm4gZnVuY3Rpb24oZm46ICgpID0+IHZvaWQpIHsgcXVldWUucHVzaChmbik7IH07XG59XG5cbi8qKlxuICogQ29uZmlndXJlcyB0aGUgcm9vdCBpbmplY3RvciBmb3IgYW4gYXBwIHdpdGhcbiAqIHByb3ZpZGVycyBvZiBgQGFuZ3VsYXIvY29yZWAgZGVwZW5kZW5jaWVzIHRoYXQgYEFwcGxpY2F0aW9uUmVmYCBuZWVkc1xuICogdG8gYm9vdHN0cmFwIGNvbXBvbmVudHMuXG4gKlxuICogUmUtZXhwb3J0ZWQgYnkgYEJyb3dzZXJNb2R1bGVgLCB3aGljaCBpcyBpbmNsdWRlZCBhdXRvbWF0aWNhbGx5IGluIHRoZSByb290XG4gKiBgQXBwTW9kdWxlYCB3aGVuIHlvdSBjcmVhdGUgYSBuZXcgYXBwIHdpdGggdGhlIENMSSBgbmV3YCBjb21tYW5kLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuQE5nTW9kdWxlKHtwcm92aWRlcnM6IEFQUExJQ0FUSU9OX01PRFVMRV9QUk9WSURFUlN9KVxuZXhwb3J0IGNsYXNzIEFwcGxpY2F0aW9uTW9kdWxlIHtcbiAgLy8gSW5qZWN0IEFwcGxpY2F0aW9uUmVmIHRvIG1ha2UgaXQgZWFnZXIuLi5cbiAgY29uc3RydWN0b3IoYXBwUmVmOiBBcHBsaWNhdGlvblJlZikge31cbn1cbiJdfQ==