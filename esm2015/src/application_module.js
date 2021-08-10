/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { APP_INITIALIZER, ApplicationInitStatus } from './application_init';
import { ApplicationRef } from './application_ref';
import { APP_ID_RANDOM_PROVIDER } from './application_tokens';
import { defaultIterableDiffers, defaultKeyValueDiffers, IterableDiffers, KeyValueDiffers } from './change_detection/change_detection';
import { Injector } from './di';
import { Inject, Optional, SkipSelf } from './di/metadata';
import { ErrorHandler } from './error_handler';
import { DEFAULT_LOCALE_ID, USD_CURRENCY_CODE } from './i18n/localization';
import { DEFAULT_CURRENCY_CODE, LOCALE_ID } from './i18n/tokens';
import { ivyEnabled } from './ivy_switch';
import { ComponentFactoryResolver } from './linker';
import { Compiler } from './linker/compiler';
import { NgModule } from './metadata';
import { SCHEDULER } from './render3/component_ref';
import { setLocaleId } from './render3/i18n/i18n_locale_id';
import { NgZone } from './zone';
import * as i0 from "./r3_symbols";
import * as i1 from "./application_ref";
export function _iterableDiffersFactory() {
    return defaultIterableDiffers;
}
export function _keyValueDiffersFactory() {
    return defaultKeyValueDiffers;
}
export function _localeFactory(locale) {
    locale = locale || getGlobalLocale();
    if (ivyEnabled) {
        setLocaleId(locale);
    }
    return locale;
}
/**
 * Work out the locale from the potential global properties.
 *
 * * Closure Compiler: use `goog.getLocale()`.
 * * Ivy enabled: use `$localize.locale`
 */
export function getGlobalLocale() {
    if (typeof ngI18nClosureMode !== 'undefined' && ngI18nClosureMode &&
        typeof goog !== 'undefined' && goog.getLocale() !== 'en') {
        // * The default `goog.getLocale()` value is `en`, while Angular used `en-US`.
        // * In order to preserve backwards compatibility, we use Angular default value over
        //   Closure Compiler's one.
        return goog.getLocale();
    }
    else {
        // KEEP `typeof $localize !== 'undefined' && $localize.locale` IN SYNC WITH THE LOCALIZE
        // COMPILE-TIME INLINER.
        //
        // * During compile time inlining of translations the expression will be replaced
        //   with a string literal that is the current locale. Other forms of this expression are not
        //   guaranteed to be replaced.
        //
        // * During runtime translation evaluation, the developer is required to set `$localize.locale`
        //   if required, or just to provide their own `LOCALE_ID` provider.
        return (ivyEnabled && typeof $localize !== 'undefined' && $localize.locale) ||
            DEFAULT_LOCALE_ID;
    }
}
/**
 * A built-in [dependency injection token](guide/glossary#di-token)
 * that is used to configure the root injector for bootstrapping.
 */
export const APPLICATION_MODULE_PROVIDERS = [
    {
        provide: ApplicationRef,
        useClass: ApplicationRef,
        deps: [NgZone, Injector, ErrorHandler, ComponentFactoryResolver, ApplicationInitStatus]
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
    { provide: DEFAULT_CURRENCY_CODE, useValue: USD_CURRENCY_CODE },
];
/**
 * Schedule work at next available slot.
 *
 * In Ivy this is just `requestAnimationFrame`. For compatibility reasons when bootstrapped
 * using `platformRef.bootstrap` we need to use `NgZone.onStable` as the scheduling mechanism.
 * This overrides the scheduling mechanism in Ivy to `NgZone.onStable`.
 *
 * @param ngZone NgZone to use for scheduling.
 */
export function zoneSchedulerFactory(ngZone) {
    let queue = [];
    ngZone.onStable.subscribe(() => {
        while (queue.length) {
            queue.pop()();
        }
    });
    return function (fn) {
        queue.push(fn);
    };
}
/**
 * Configures the root injector for an app with
 * providers of `@angular/core` dependencies that `ApplicationRef` needs
 * to bootstrap components.
 *
 * Re-exported by `BrowserModule`, which is included automatically in the root
 * `AppModule` when you create a new app with the CLI `new` command.
 *
 * @publicApi
 */
export class ApplicationModule {
    // Inject ApplicationRef to make it eager...
    constructor(appRef) { }
}
ApplicationModule.ɵfac = function ApplicationModule_Factory(t) { return new (t || ApplicationModule)(i0.ɵɵinject(i1.ApplicationRef)); };
ApplicationModule.ɵmod = /*@__PURE__*/ i0.ɵɵdefineNgModule({ type: ApplicationModule });
ApplicationModule.ɵinj = /*@__PURE__*/ i0.ɵɵdefineInjector({ providers: APPLICATION_MODULE_PROVIDERS });
(function () { (typeof ngDevMode === "undefined" || ngDevMode) && i0.setClassMetadata(ApplicationModule, [{
        type: NgModule,
        args: [{ providers: APPLICATION_MODULE_PROVIDERS }]
    }], function () { return [{ type: i1.ApplicationRef }]; }, null); })();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwbGljYXRpb25fbW9kdWxlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvYXBwbGljYXRpb25fbW9kdWxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxlQUFlLEVBQUUscUJBQXFCLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUMxRSxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDakQsT0FBTyxFQUFDLHNCQUFzQixFQUFDLE1BQU0sc0JBQXNCLENBQUM7QUFDNUQsT0FBTyxFQUFDLHNCQUFzQixFQUFFLHNCQUFzQixFQUFFLGVBQWUsRUFBRSxlQUFlLEVBQUMsTUFBTSxxQ0FBcUMsQ0FBQztBQUNySSxPQUFPLEVBQUMsUUFBUSxFQUFpQixNQUFNLE1BQU0sQ0FBQztBQUM5QyxPQUFPLEVBQUMsTUFBTSxFQUFFLFFBQVEsRUFBRSxRQUFRLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFDekQsT0FBTyxFQUFDLFlBQVksRUFBQyxNQUFNLGlCQUFpQixDQUFDO0FBQzdDLE9BQU8sRUFBQyxpQkFBaUIsRUFBRSxpQkFBaUIsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBQ3pFLE9BQU8sRUFBQyxxQkFBcUIsRUFBRSxTQUFTLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFDL0QsT0FBTyxFQUFDLFVBQVUsRUFBQyxNQUFNLGNBQWMsQ0FBQztBQUN4QyxPQUFPLEVBQUMsd0JBQXdCLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDbEQsT0FBTyxFQUFDLFFBQVEsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQzNDLE9BQU8sRUFBQyxRQUFRLEVBQUMsTUFBTSxZQUFZLENBQUM7QUFDcEMsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLHlCQUF5QixDQUFDO0FBQ2xELE9BQU8sRUFBQyxXQUFXLEVBQUMsTUFBTSwrQkFBK0IsQ0FBQztB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O0lBQ0gsT0FBTyxVQUFTLEVBQWM7UUFDNUIsS0FBSyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUNqQixDQUFDLENBQUM7QUFDSixDQUFDO0FBRUQ7Ozs7Ozs7OztHQVNHO0FBRUgsTUFBTSxPQUFPLGlCQUFpQjtJQUM1Qiw0Q0FBNEM7SUFDNUMsWUFBWSxNQUFzQixJQUFHLENBQUM7O2tGQUYzQixpQkFBaUI7bUVBQWpCLGlCQUFpQjt3RUFEUiw0QkFBNEI7c0ZBQ3JDLGlCQUFpQjtjQUQ3QixRQUFRO2VBQUMsRUFBQyxTQUFTLEVBQUUsNEJBQTRCLEVBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtBUFBfSU5JVElBTElaRVIsIEFwcGxpY2F0aW9uSW5pdFN0YXR1c30gZnJvbSAnLi9hcHBsaWNhdGlvbl9pbml0JztcbmltcG9ydCB7QXBwbGljYXRpb25SZWZ9IGZyb20gJy4vYXBwbGljYXRpb25fcmVmJztcbmltcG9ydCB7QVBQX0lEX1JBTkRPTV9QUk9WSURFUn0gZnJvbSAnLi9hcHBsaWNhdGlvbl90b2tlbnMnO1xuaW1wb3J0IHtkZWZhdWx0SXRlcmFibGVEaWZmZXJzLCBkZWZhdWx0S2V5VmFsdWVEaWZmZXJzLCBJdGVyYWJsZURpZmZlcnMsIEtleVZhbHVlRGlmZmVyc30gZnJvbSAnLi9jaGFuZ2VfZGV0ZWN0aW9uL2NoYW5nZV9kZXRlY3Rpb24nO1xuaW1wb3J0IHtJbmplY3RvciwgU3RhdGljUHJvdmlkZXJ9IGZyb20gJy4vZGknO1xuaW1wb3J0IHtJbmplY3QsIE9wdGlvbmFsLCBTa2lwU2VsZn0gZnJvbSAnLi9kaS9tZXRhZGF0YSc7XG5pbXBvcnQge0Vycm9ySGFuZGxlcn0gZnJvbSAnLi9lcnJvcl9oYW5kbGVyJztcbmltcG9ydCB7REVGQVVMVF9MT0NBTEVfSUQsIFVTRF9DVVJSRU5DWV9DT0RFfSBmcm9tICcuL2kxOG4vbG9jYWxpemF0aW9uJztcbmltcG9ydCB7REVGQVVMVF9DVVJSRU5DWV9DT0RFLCBMT0NBTEVfSUR9IGZyb20gJy4vaTE4bi90b2tlbnMnO1xuaW1wb3J0IHtpdnlFbmFibGVkfSBmcm9tICcuL2l2eV9zd2l0Y2gnO1xuaW1wb3J0IHtDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXJ9IGZyb20gJy4vbGlua2VyJztcbmltcG9ydCB7Q29tcGlsZXJ9IGZyb20gJy4vbGlua2VyL2NvbXBpbGVyJztcbmltcG9ydCB7TmdNb2R1bGV9IGZyb20gJy4vbWV0YWRhdGEnO1xuaW1wb3J0IHtTQ0hFRFVMRVJ9IGZyb20gJy4vcmVuZGVyMy9jb21wb25lbnRfcmVmJztcbmltcG9ydCB7c2V0TG9jYWxlSWR9IGZyb20gJy4vcmVuZGVyMy9pMThuL2kxOG5fbG9jYWxlX2lkJztcbmltcG9ydCB7Tmdab25lfSBmcm9tICcuL3pvbmUnO1xuXG5kZWNsYXJlIGNvbnN0ICRsb2NhbGl6ZToge2xvY2FsZT86IHN0cmluZ307XG5cbmV4cG9ydCBmdW5jdGlvbiBfaXRlcmFibGVEaWZmZXJzRmFjdG9yeSgpIHtcbiAgcmV0dXJuIGRlZmF1bHRJdGVyYWJsZURpZmZlcnM7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBfa2V5VmFsdWVEaWZmZXJzRmFjdG9yeSgpIHtcbiAgcmV0dXJuIGRlZmF1bHRLZXlWYWx1ZURpZmZlcnM7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBfbG9jYWxlRmFjdG9yeShsb2NhbGU/OiBzdHJpbmcpOiBzdHJpbmcge1xuICBsb2NhbGUgPSBsb2NhbGUgfHwgZ2V0R2xvYmFsTG9jYWxlKCk7XG4gIGlmIChpdnlFbmFibGVkKSB7XG4gICAgc2V0TG9jYWxlSWQobG9jYWxlKTtcbiAgfVxuICByZXR1cm4gbG9jYWxlO1xufVxuXG4vKipcbiAqIFdvcmsgb3V0IHRoZSBsb2NhbGUgZnJvbSB0aGUgcG90ZW50aWFsIGdsb2JhbCBwcm9wZXJ0aWVzLlxuICpcbiAqICogQ2xvc3VyZSBDb21waWxlcjogdXNlIGBnb29nLmdldExvY2FsZSgpYC5cbiAqICogSXZ5IGVuYWJsZWQ6IHVzZSBgJGxvY2FsaXplLmxvY2FsZWBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldEdsb2JhbExvY2FsZSgpOiBzdHJpbmcge1xuICBpZiAodHlwZW9mIG5nSTE4bkNsb3N1cmVNb2RlICE9PSAndW5kZWZpbmVkJyAmJiBuZ0kxOG5DbG9zdXJlTW9kZSAmJlxuICAgICAgdHlwZW9mIGdvb2cgIT09ICd1bmRlZmluZWQnICYmIGdvb2cuZ2V0TG9jYWxlKCkgIT09ICdlbicpIHtcbiAgICAvLyAqIFRoZSBkZWZhdWx0IGBnb29nLmdldExvY2FsZSgpYCB2YWx1ZSBpcyBgZW5gLCB3aGlsZSBBbmd1bGFyIHVzZWQgYGVuLVVTYC5cbiAgICAvLyAqIEluIG9yZGVyIHRvIHByZXNlcnZlIGJhY2t3YXJkcyBjb21wYXRpYmlsaXR5LCB3ZSB1c2UgQW5ndWxhciBkZWZhdWx0IHZhbHVlIG92ZXJcbiAgICAvLyAgIENsb3N1cmUgQ29tcGlsZXIncyBvbmUuXG4gICAgcmV0dXJuIGdvb2cuZ2V0TG9jYWxlKCk7XG4gIH0gZWxzZSB7XG4gICAgLy8gS0VFUCBgdHlwZW9mICRsb2NhbGl6ZSAhPT0gJ3VuZGVmaW5lZCcgJiYgJGxvY2FsaXplLmxvY2FsZWAgSU4gU1lOQyBXSVRIIFRIRSBMT0NBTElaRVxuICAgIC8vIENPTVBJTEUtVElNRSBJTkxJTkVSLlxuICAgIC8vXG4gICAgLy8gKiBEdXJpbmcgY29tcGlsZSB0aW1lIGlubGluaW5nIG9mIHRyYW5zbGF0aW9ucyB0aGUgZXhwcmVzc2lvbiB3aWxsIGJlIHJlcGxhY2VkXG4gICAgLy8gICB3aXRoIGEgc3RyaW5nIGxpdGVyYWwgdGhhdCBpcyB0aGUgY3VycmVudCBsb2NhbGUuIE90aGVyIGZvcm1zIG9mIHRoaXMgZXhwcmVzc2lvbiBhcmUgbm90XG4gICAgLy8gICBndWFyYW50ZWVkIHRvIGJlIHJlcGxhY2VkLlxuICAgIC8vXG4gICAgLy8gKiBEdXJpbmcgcnVudGltZSB0cmFuc2xhdGlvbiBldmFsdWF0aW9uLCB0aGUgZGV2ZWxvcGVyIGlzIHJlcXVpcmVkIHRvIHNldCBgJGxvY2FsaXplLmxvY2FsZWBcbiAgICAvLyAgIGlmIHJlcXVpcmVkLCBvciBqdXN0IHRvIHByb3ZpZGUgdGhlaXIgb3duIGBMT0NBTEVfSURgIHByb3ZpZGVyLlxuICAgIHJldHVybiAoaXZ5RW5hYmxlZCAmJiB0eXBlb2YgJGxvY2FsaXplICE9PSAndW5kZWZpbmVkJyAmJiAkbG9jYWxpemUubG9jYWxlKSB8fFxuICAgICAgICBERUZBVUxUX0xPQ0FMRV9JRDtcbiAgfVxufVxuXG4vKipcbiAqIEEgYnVpbHQtaW4gW2RlcGVuZGVuY3kgaW5qZWN0aW9uIHRva2VuXShndWlkZS9nbG9zc2FyeSNkaS10b2tlbilcbiAqIHRoYXQgaXMgdXNlZCB0byBjb25maWd1cmUgdGhlIHJvb3QgaW5qZWN0b3IgZm9yIGJvb3RzdHJhcHBpbmcuXG4gKi9cbmV4cG9ydCBjb25zdCBBUFBMSUNBVElPTl9NT0RVTEVfUFJPVklERVJTOiBTdGF0aWNQcm92aWRlcltdID0gW1xuICB7XG4gICAgcHJvdmlkZTogQXBwbGljYXRpb25SZWYsXG4gICAgdXNlQ2xhc3M6IEFwcGxpY2F0aW9uUmVmLFxuICAgIGRlcHM6IFtOZ1pvbmUsIEluamVjdG9yLCBFcnJvckhhbmRsZXIsIENvbXBvbmVudEZhY3RvcnlSZXNvbHZlciwgQXBwbGljYXRpb25Jbml0U3RhdHVzXVxuICB9LFxuICB7cHJvdmlkZTogU0NIRURVTEVSLCBkZXBzOiBbTmdab25lXSwgdXNlRmFjdG9yeTogem9uZVNjaGVkdWxlckZhY3Rvcnl9LFxuICB7XG4gICAgcHJvdmlkZTogQXBwbGljYXRpb25Jbml0U3RhdHVzLFxuICAgIHVzZUNsYXNzOiBBcHBsaWNhdGlvbkluaXRTdGF0dXMsXG4gICAgZGVwczogW1tuZXcgT3B0aW9uYWwoKSwgQVBQX0lOSVRJQUxJWkVSXV1cbiAgfSxcbiAge3Byb3ZpZGU6IENvbXBpbGVyLCB1c2VDbGFzczogQ29tcGlsZXIsIGRlcHM6IFtdfSxcbiAgQVBQX0lEX1JBTkRPTV9QUk9WSURFUixcbiAge3Byb3ZpZGU6IEl0ZXJhYmxlRGlmZmVycywgdXNlRmFjdG9yeTogX2l0ZXJhYmxlRGlmZmVyc0ZhY3RvcnksIGRlcHM6IFtdfSxcbiAge3Byb3ZpZGU6IEtleVZhbHVlRGlmZmVycywgdXNlRmFjdG9yeTogX2tleVZhbHVlRGlmZmVyc0ZhY3RvcnksIGRlcHM6IFtdfSxcbiAge1xuICAgIHByb3ZpZGU6IExPQ0FMRV9JRCxcbiAgICB1c2VGYWN0b3J5OiBfbG9jYWxlRmFjdG9yeSxcbiAgICBkZXBzOiBbW25ldyBJbmplY3QoTE9DQUxFX0lEKSwgbmV3IE9wdGlvbmFsKCksIG5ldyBTa2lwU2VsZigpXV1cbiAgfSxcbiAge3Byb3ZpZGU6IERFRkFVTFRfQ1VSUkVOQ1lfQ09ERSwgdXNlVmFsdWU6IFVTRF9DVVJSRU5DWV9DT0RFfSxcbl07XG5cbi8qKlxuICogU2NoZWR1bGUgd29yayBhdCBuZXh0IGF2YWlsYWJsZSBzbG90LlxuICpcbiAqIEluIEl2eSB0aGlzIGlzIGp1c3QgYHJlcXVlc3RBbmltYXRpb25GcmFtZWAuIEZvciBjb21wYXRpYmlsaXR5IHJlYXNvbnMgd2hlbiBib290c3RyYXBwZWRcbiAqIHVzaW5nIGBwbGF0Zm9ybVJlZi5ib290c3RyYXBgIHdlIG5lZWQgdG8gdXNlIGBOZ1pvbmUub25TdGFibGVgIGFzIHRoZSBzY2hlZHVsaW5nIG1lY2hhbmlzbS5cbiAqIFRoaXMgb3ZlcnJpZGVzIHRoZSBzY2hlZHVsaW5nIG1lY2hhbmlzbSBpbiBJdnkgdG8gYE5nWm9uZS5vblN0YWJsZWAuXG4gKlxuICogQHBhcmFtIG5nWm9uZSBOZ1pvbmUgdG8gdXNlIGZvciBzY2hlZHVsaW5nLlxuICovXG5leHBvcnQgZnVuY3Rpb24gem9uZVNjaGVkdWxlckZhY3Rvcnkobmdab25lOiBOZ1pvbmUpOiAoZm46ICgpID0+IHZvaWQpID0+IHZvaWQge1xuICBsZXQgcXVldWU6ICgoKSA9PiB2b2lkKVtdID0gW107XG4gIG5nWm9uZS5vblN0YWJsZS5zdWJzY3JpYmUoKCkgPT4ge1xuICAgIHdoaWxlIChxdWV1ZS5sZW5ndGgpIHtcbiAgICAgIHF1ZXVlLnBvcCgpISgpO1xuICAgIH1cbiAgfSk7XG4gIHJldHVybiBmdW5jdGlvbihmbjogKCkgPT4gdm9pZCkge1xuICAgIHF1ZXVlLnB1c2goZm4pO1xuICB9O1xufVxuXG4vKipcbiAqIENvbmZpZ3VyZXMgdGhlIHJvb3QgaW5qZWN0b3IgZm9yIGFuIGFwcCB3aXRoXG4gKiBwcm92aWRlcnMgb2YgYEBhbmd1bGFyL2NvcmVgIGRlcGVuZGVuY2llcyB0aGF0IGBBcHBsaWNhdGlvblJlZmAgbmVlZHNcbiAqIHRvIGJvb3RzdHJhcCBjb21wb25lbnRzLlxuICpcbiAqIFJlLWV4cG9ydGVkIGJ5IGBCcm93c2VyTW9kdWxlYCwgd2hpY2ggaXMgaW5jbHVkZWQgYXV0b21hdGljYWxseSBpbiB0aGUgcm9vdFxuICogYEFwcE1vZHVsZWAgd2hlbiB5b3UgY3JlYXRlIGEgbmV3IGFwcCB3aXRoIHRoZSBDTEkgYG5ld2AgY29tbWFuZC5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbkBOZ01vZHVsZSh7cHJvdmlkZXJzOiBBUFBMSUNBVElPTl9NT0RVTEVfUFJPVklERVJTfSlcbmV4cG9ydCBjbGFzcyBBcHBsaWNhdGlvbk1vZHVsZSB7XG4gIC8vIEluamVjdCBBcHBsaWNhdGlvblJlZiB0byBtYWtlIGl0IGVhZ2VyLi4uXG4gIGNvbnN0cnVjdG9yKGFwcFJlZjogQXBwbGljYXRpb25SZWYpIHt9XG59XG4iXX0=