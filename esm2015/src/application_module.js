/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
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
        return locale;
    }
    // Use `goog.LOCALE` as default value for `LOCALE_ID` token for Closure Compiler.
    // Note: default `goog.LOCALE` value is `en`, when Angular used `en-US`. In order to preserve
    // backwards compatibility, we use Angular default value over Closure Compiler's one.
    if (ngI18nClosureMode && typeof goog !== 'undefined' && goog.LOCALE !== 'en') {
        return goog.LOCALE;
    }
    return 'en-US';
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
/** @nocollapse */ ApplicationModule.ngModuleDef = i0.ɵɵdefineNgModule({ type: ApplicationModule });
/** @nocollapse */ ApplicationModule.ngInjectorDef = i0.ɵɵdefineInjector({ factory: function ApplicationModule_Factory(t) { return new (t || ApplicationModule)(i0.ɵɵinject(i1.ApplicationRef)); }, providers: APPLICATION_MODULE_PROVIDERS });
/*@__PURE__*/ i0.setClassMetadata(ApplicationModule, [{
        type: NgModule,
        args: [{ providers: APPLICATION_MODULE_PROVIDERS }]
    }], function () { return [{ type: i1.ApplicationRef }]; }, null);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwbGljYXRpb25fbW9kdWxlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvYXBwbGljYXRpb25fbW9kdWxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7QUFRQSxPQUFPLEVBQUMsZUFBZSxFQUFFLHFCQUFxQixFQUFDLE1BQU0sb0JBQW9CLENBQUM7QUFDMUUsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQ2pELE9BQU8sRUFBQyxzQkFBc0IsRUFBQyxNQUFNLHNCQUFzQixDQUFDO0FBQzVELE9BQU8sRUFBQyxlQUFlLEVBQUUsZUFBZSxFQUFFLHNCQUFzQixFQUFFLHNCQUFzQixFQUFDLE1BQU0scUNBQXFDLENBQUM7QUFDckksT0FBTyxFQUFDLE9BQU8sRUFBQyxNQUFNLFdBQVcsQ0FBQztBQUNsQyxPQUFPLEVBQUMsUUFBUSxFQUFpQixNQUFNLE1BQU0sQ0FBQztBQUM5QyxPQUFPLEVBQUMsTUFBTSxFQUFFLFFBQVEsRUFBRSxRQUFRLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFDekQsT0FBTyxFQUFDLFlBQVksRUFBQyxNQUFNLGlCQUFpQixDQUFDO0FBQzdDLE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFDeEMsT0FBTyxFQUFDLHdCQUF3QixFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQ2xELE9BQU8sRUFBQyxRQUFRLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUMzQyxPQUFPLEVBQUMsUUFBUSxFQUFDLE1BQU0sWUFBWSxDQUFDO0FBQ3BDLE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSx5QkFBeUIsQ0FBQztBQUNsRCxPQUFPLEVBQUMsTUFBTSxFQUFDLE1BQU0sUUFBUSxDQUFDOzs7Ozs7Ozs7Ozs7O0FBRTlCLE1BQU0sVUFBVSx1QkFBdUI7SUFDckMsT0FBTyxzQkFBc0IsQ0FBQztBQUNoQyxDQUFDOzs7O0FBRUQsTUFBTSxVQUFVLHVCQUF1QjtJQUNyQyxPQUFPLHNCQUFzQixDQUFDO0FBQ2hDLENBQUM7Ozs7O0FBRUQsTUFBTSxVQUFVLGNBQWMsQ0FBQyxNQUFlO0lBQzVDLElBQUksTUFBTSxFQUFFO1FBQ1YsT0FBTyxNQUFNLENBQUM7S0FDZjtJQUNELGlGQUFpRjtJQUNqRiw2RkFBNkY7SUFDN0YscUZBQXFGO0lBQ3JGLElBQUksaUJBQWlCLElBQUksT0FBTyxJQUFJLEtBQUssV0FBVyxJQUFJLElBQUksQ0FBQyxNQUFNLEtBQUssSUFBSSxFQUFFO1FBQzVFLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQztLQUNwQjtJQUNELE9BQU8sT0FBTyxDQUFDO0FBQ2pCLENBQUM7Ozs7OztBQU1ELE1BQU0sT0FBTyw0QkFBNEIsR0FBcUI7SUFDNUQ7UUFDRSxPQUFPLEVBQUUsY0FBYztRQUN2QixRQUFRLEVBQUUsY0FBYztRQUN4QixJQUFJLEVBQ0EsQ0FBQyxNQUFNLEVBQUUsT0FBTyxFQUFFLFFBQVEsRUFBRSxZQUFZLEVBQUUsd0JBQXdCLEVBQUUscUJBQXFCLENBQUM7S0FDL0Y7SUFDRCxFQUFDLE9BQU8sRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFLENBQUMsTUFBTSxDQUFDLEVBQUUsVUFBVSxFQUFFLG9CQUFvQixFQUFDO0lBQ3RFO1FBQ0UsT0FBTyxFQUFFLHFCQUFxQjtRQUM5QixRQUFRLEVBQUUscUJBQXFCO1FBQy9CLElBQUksRUFBRSxDQUFDLENBQUMsSUFBSSxRQUFRLEVBQUUsRUFBRSxlQUFlLENBQUMsQ0FBQztLQUMxQztJQUNELEVBQUMsT0FBTyxFQUFFLFFBQVEsRUFBRSxRQUFRLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUM7SUFDakQsc0JBQXNCO0lBQ3RCLEVBQUMsT0FBTyxFQUFFLGVBQWUsRUFBRSxVQUFVLEVBQUUsdUJBQXVCLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBQztJQUN6RSxFQUFDLE9BQU8sRUFBRSxlQUFlLEVBQUUsVUFBVSxFQUFFLHVCQUF1QixFQUFFLElBQUksRUFBRSxFQUFFLEVBQUM7SUFDekU7UUFDRSxPQUFPLEVBQUUsU0FBUztRQUNsQixVQUFVLEVBQUUsY0FBYztRQUMxQixJQUFJLEVBQUUsQ0FBQyxDQUFDLElBQUksTUFBTSxDQUFDLFNBQVMsQ0FBQyxFQUFFLElBQUksUUFBUSxFQUFFLEVBQUUsSUFBSSxRQUFRLEVBQUUsQ0FBQyxDQUFDO0tBQ2hFO0NBQ0Y7Ozs7Ozs7Ozs7O0FBV0QsTUFBTSxVQUFVLG9CQUFvQixDQUFDLE1BQWM7O1FBQzdDLEtBQUssR0FBbUIsRUFBRTtJQUM5QixNQUFNLENBQUMsUUFBUSxDQUFDLFNBQVM7OztJQUFDLEdBQUcsRUFBRTtRQUM3QixPQUFPLEtBQUssQ0FBQyxNQUFNLEVBQUU7WUFDbkIsbUJBQUEsS0FBSyxDQUFDLEdBQUcsRUFBRSxFQUFFLEVBQUUsQ0FBQztTQUNqQjtJQUNILENBQUMsRUFBQyxDQUFDO0lBQ0g7Ozs7SUFBTyxVQUFTLEVBQWMsSUFBSSxLQUFLLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFDO0FBQ3RELENBQUM7Ozs7Ozs7Ozs7O0FBYUQsTUFBTSxPQUFPLGlCQUFpQjs7Ozs7SUFFNUIsWUFBWSxNQUFzQixJQUFHLENBQUM7OztZQUh2QyxRQUFRLFNBQUMsRUFBQyxTQUFTLEVBQUUsNEJBQTRCLEVBQUM7Ozs7WUE1RjNDLGNBQWM7OzREQTZGVCxpQkFBaUI7MEhBQWpCLGlCQUFpQixpREFEUiw0QkFBNEI7a0NBQ3JDLGlCQUFpQjtjQUQ3QixRQUFRO2VBQUMsRUFBQyxTQUFTLEVBQUUsNEJBQTRCLEVBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7QVBQX0lOSVRJQUxJWkVSLCBBcHBsaWNhdGlvbkluaXRTdGF0dXN9IGZyb20gJy4vYXBwbGljYXRpb25faW5pdCc7XG5pbXBvcnQge0FwcGxpY2F0aW9uUmVmfSBmcm9tICcuL2FwcGxpY2F0aW9uX3JlZic7XG5pbXBvcnQge0FQUF9JRF9SQU5ET01fUFJPVklERVJ9IGZyb20gJy4vYXBwbGljYXRpb25fdG9rZW5zJztcbmltcG9ydCB7SXRlcmFibGVEaWZmZXJzLCBLZXlWYWx1ZURpZmZlcnMsIGRlZmF1bHRJdGVyYWJsZURpZmZlcnMsIGRlZmF1bHRLZXlWYWx1ZURpZmZlcnN9IGZyb20gJy4vY2hhbmdlX2RldGVjdGlvbi9jaGFuZ2VfZGV0ZWN0aW9uJztcbmltcG9ydCB7Q29uc29sZX0gZnJvbSAnLi9jb25zb2xlJztcbmltcG9ydCB7SW5qZWN0b3IsIFN0YXRpY1Byb3ZpZGVyfSBmcm9tICcuL2RpJztcbmltcG9ydCB7SW5qZWN0LCBPcHRpb25hbCwgU2tpcFNlbGZ9IGZyb20gJy4vZGkvbWV0YWRhdGEnO1xuaW1wb3J0IHtFcnJvckhhbmRsZXJ9IGZyb20gJy4vZXJyb3JfaGFuZGxlcic7XG5pbXBvcnQge0xPQ0FMRV9JRH0gZnJvbSAnLi9pMThuL3Rva2Vucyc7XG5pbXBvcnQge0NvbXBvbmVudEZhY3RvcnlSZXNvbHZlcn0gZnJvbSAnLi9saW5rZXInO1xuaW1wb3J0IHtDb21waWxlcn0gZnJvbSAnLi9saW5rZXIvY29tcGlsZXInO1xuaW1wb3J0IHtOZ01vZHVsZX0gZnJvbSAnLi9tZXRhZGF0YSc7XG5pbXBvcnQge1NDSEVEVUxFUn0gZnJvbSAnLi9yZW5kZXIzL2NvbXBvbmVudF9yZWYnO1xuaW1wb3J0IHtOZ1pvbmV9IGZyb20gJy4vem9uZSc7XG5cbmV4cG9ydCBmdW5jdGlvbiBfaXRlcmFibGVEaWZmZXJzRmFjdG9yeSgpIHtcbiAgcmV0dXJuIGRlZmF1bHRJdGVyYWJsZURpZmZlcnM7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBfa2V5VmFsdWVEaWZmZXJzRmFjdG9yeSgpIHtcbiAgcmV0dXJuIGRlZmF1bHRLZXlWYWx1ZURpZmZlcnM7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBfbG9jYWxlRmFjdG9yeShsb2NhbGU/OiBzdHJpbmcpOiBzdHJpbmcge1xuICBpZiAobG9jYWxlKSB7XG4gICAgcmV0dXJuIGxvY2FsZTtcbiAgfVxuICAvLyBVc2UgYGdvb2cuTE9DQUxFYCBhcyBkZWZhdWx0IHZhbHVlIGZvciBgTE9DQUxFX0lEYCB0b2tlbiBmb3IgQ2xvc3VyZSBDb21waWxlci5cbiAgLy8gTm90ZTogZGVmYXVsdCBgZ29vZy5MT0NBTEVgIHZhbHVlIGlzIGBlbmAsIHdoZW4gQW5ndWxhciB1c2VkIGBlbi1VU2AuIEluIG9yZGVyIHRvIHByZXNlcnZlXG4gIC8vIGJhY2t3YXJkcyBjb21wYXRpYmlsaXR5LCB3ZSB1c2UgQW5ndWxhciBkZWZhdWx0IHZhbHVlIG92ZXIgQ2xvc3VyZSBDb21waWxlcidzIG9uZS5cbiAgaWYgKG5nSTE4bkNsb3N1cmVNb2RlICYmIHR5cGVvZiBnb29nICE9PSAndW5kZWZpbmVkJyAmJiBnb29nLkxPQ0FMRSAhPT0gJ2VuJykge1xuICAgIHJldHVybiBnb29nLkxPQ0FMRTtcbiAgfVxuICByZXR1cm4gJ2VuLVVTJztcbn1cblxuLyoqXG4gKiBBIGJ1aWx0LWluIFtkZXBlbmRlbmN5IGluamVjdGlvbiB0b2tlbl0oZ3VpZGUvZ2xvc3NhcnkjZGktdG9rZW4pXG4gKiB0aGF0IGlzIHVzZWQgdG8gY29uZmlndXJlIHRoZSByb290IGluamVjdG9yIGZvciBib290c3RyYXBwaW5nLlxuICovXG5leHBvcnQgY29uc3QgQVBQTElDQVRJT05fTU9EVUxFX1BST1ZJREVSUzogU3RhdGljUHJvdmlkZXJbXSA9IFtcbiAge1xuICAgIHByb3ZpZGU6IEFwcGxpY2F0aW9uUmVmLFxuICAgIHVzZUNsYXNzOiBBcHBsaWNhdGlvblJlZixcbiAgICBkZXBzOlxuICAgICAgICBbTmdab25lLCBDb25zb2xlLCBJbmplY3RvciwgRXJyb3JIYW5kbGVyLCBDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXIsIEFwcGxpY2F0aW9uSW5pdFN0YXR1c11cbiAgfSxcbiAge3Byb3ZpZGU6IFNDSEVEVUxFUiwgZGVwczogW05nWm9uZV0sIHVzZUZhY3Rvcnk6IHpvbmVTY2hlZHVsZXJGYWN0b3J5fSxcbiAge1xuICAgIHByb3ZpZGU6IEFwcGxpY2F0aW9uSW5pdFN0YXR1cyxcbiAgICB1c2VDbGFzczogQXBwbGljYXRpb25Jbml0U3RhdHVzLFxuICAgIGRlcHM6IFtbbmV3IE9wdGlvbmFsKCksIEFQUF9JTklUSUFMSVpFUl1dXG4gIH0sXG4gIHtwcm92aWRlOiBDb21waWxlciwgdXNlQ2xhc3M6IENvbXBpbGVyLCBkZXBzOiBbXX0sXG4gIEFQUF9JRF9SQU5ET01fUFJPVklERVIsXG4gIHtwcm92aWRlOiBJdGVyYWJsZURpZmZlcnMsIHVzZUZhY3Rvcnk6IF9pdGVyYWJsZURpZmZlcnNGYWN0b3J5LCBkZXBzOiBbXX0sXG4gIHtwcm92aWRlOiBLZXlWYWx1ZURpZmZlcnMsIHVzZUZhY3Rvcnk6IF9rZXlWYWx1ZURpZmZlcnNGYWN0b3J5LCBkZXBzOiBbXX0sXG4gIHtcbiAgICBwcm92aWRlOiBMT0NBTEVfSUQsXG4gICAgdXNlRmFjdG9yeTogX2xvY2FsZUZhY3RvcnksXG4gICAgZGVwczogW1tuZXcgSW5qZWN0KExPQ0FMRV9JRCksIG5ldyBPcHRpb25hbCgpLCBuZXcgU2tpcFNlbGYoKV1dXG4gIH0sXG5dO1xuXG4vKipcbiAqIFNjaGVkdWxlIHdvcmsgYXQgbmV4dCBhdmFpbGFibGUgc2xvdC5cbiAqXG4gKiBJbiBJdnkgdGhpcyBpcyBqdXN0IGByZXF1ZXN0QW5pbWF0aW9uRnJhbWVgLiBGb3IgY29tcGF0aWJpbGl0eSByZWFzb25zIHdoZW4gYm9vdHN0cmFwcGVkXG4gKiB1c2luZyBgcGxhdGZvcm1SZWYuYm9vdHN0cmFwYCB3ZSBuZWVkIHRvIHVzZSBgTmdab25lLm9uU3RhYmxlYCBhcyB0aGUgc2NoZWR1bGluZyBtZWNoYW5pc20uXG4gKiBUaGlzIG92ZXJyaWRlcyB0aGUgc2NoZWR1bGluZyBtZWNoYW5pc20gaW4gSXZ5IHRvIGBOZ1pvbmUub25TdGFibGVgLlxuICpcbiAqIEBwYXJhbSBuZ1pvbmUgTmdab25lIHRvIHVzZSBmb3Igc2NoZWR1bGluZy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHpvbmVTY2hlZHVsZXJGYWN0b3J5KG5nWm9uZTogTmdab25lKTogKGZuOiAoKSA9PiB2b2lkKSA9PiB2b2lkIHtcbiAgbGV0IHF1ZXVlOiAoKCkgPT4gdm9pZClbXSA9IFtdO1xuICBuZ1pvbmUub25TdGFibGUuc3Vic2NyaWJlKCgpID0+IHtcbiAgICB3aGlsZSAocXVldWUubGVuZ3RoKSB7XG4gICAgICBxdWV1ZS5wb3AoKSAhKCk7XG4gICAgfVxuICB9KTtcbiAgcmV0dXJuIGZ1bmN0aW9uKGZuOiAoKSA9PiB2b2lkKSB7IHF1ZXVlLnB1c2goZm4pOyB9O1xufVxuXG4vKipcbiAqIENvbmZpZ3VyZXMgdGhlIHJvb3QgaW5qZWN0b3IgZm9yIGFuIGFwcCB3aXRoXG4gKiBwcm92aWRlcnMgb2YgYEBhbmd1bGFyL2NvcmVgIGRlcGVuZGVuY2llcyB0aGF0IGBBcHBsaWNhdGlvblJlZmAgbmVlZHNcbiAqIHRvIGJvb3RzdHJhcCBjb21wb25lbnRzLlxuICpcbiAqIFJlLWV4cG9ydGVkIGJ5IGBCcm93c2VyTW9kdWxlYCwgd2hpY2ggaXMgaW5jbHVkZWQgYXV0b21hdGljYWxseSBpbiB0aGUgcm9vdFxuICogYEFwcE1vZHVsZWAgd2hlbiB5b3UgY3JlYXRlIGEgbmV3IGFwcCB3aXRoIHRoZSBDTEkgYG5ld2AgY29tbWFuZC5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbkBOZ01vZHVsZSh7cHJvdmlkZXJzOiBBUFBMSUNBVElPTl9NT0RVTEVfUFJPVklERVJTfSlcbmV4cG9ydCBjbGFzcyBBcHBsaWNhdGlvbk1vZHVsZSB7XG4gIC8vIEluamVjdCBBcHBsaWNhdGlvblJlZiB0byBtYWtlIGl0IGVhZ2VyLi4uXG4gIGNvbnN0cnVjdG9yKGFwcFJlZjogQXBwbGljYXRpb25SZWYpIHt9XG59XG4iXX0=