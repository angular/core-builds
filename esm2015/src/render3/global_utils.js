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
import { assertDefined } from '../util/assert';
import { global } from '../util/global';
import { getComponent, getContext, getDirectives, getHostElement, getInjector, getListeners, getPlayers, getRootComponents, getViewComponent, markDirty } from './global_utils_api';
/**
 * This value reflects the property on the window where the dev
 * tools are patched (window.ng).
 *
 * @type {?}
 */
export const GLOBAL_PUBLISH_EXPANDO_KEY = 'ng';
/*
 * Publishes a collection of default debug tools onto `window._ng_`.
 *
 * These functions are available globally when Angular is in development
 * mode and are automatically stripped away from prod mode is on.
 */
/** @type {?} */
let _published = false;
/**
 * @return {?}
 */
export function publishDefaultGlobalUtils() {
    if (!_published) {
        _published = true;
        publishGlobalUtil('getComponent', getComponent);
        publishGlobalUtil('getContext', getContext);
        publishGlobalUtil('getListeners', getListeners);
        publishGlobalUtil('getViewComponent', getViewComponent);
        publishGlobalUtil('getHostElement', getHostElement);
        publishGlobalUtil('getInjector', getInjector);
        publishGlobalUtil('getRootComponents', getRootComponents);
        publishGlobalUtil('getDirectives', getDirectives);
        publishGlobalUtil('getPlayers', getPlayers);
        publishGlobalUtil('markDirty', markDirty);
    }
}
/**
 * Publishes the given function to `window.ngDevMode` so that it can be
 * used from the browser console when an application is not in production.
 * @param {?} name
 * @param {?} fn
 * @return {?}
 */
export function publishGlobalUtil(name, fn) {
    /** @type {?} */
    const w = (/** @type {?} */ ((/** @type {?} */ (global))));
    ngDevMode && assertDefined(fn, 'function not defined');
    if (w) {
        /** @type {?} */
        let container = w[GLOBAL_PUBLISH_EXPANDO_KEY];
        if (!container) {
            container = w[GLOBAL_PUBLISH_EXPANDO_KEY] = {};
        }
        container[name] = fn;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2xvYmFsX3V0aWxzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9nbG9iYWxfdXRpbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFPQSxPQUFPLEVBQUMsYUFBYSxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFDN0MsT0FBTyxFQUFDLE1BQU0sRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBRXRDLE9BQU8sRUFBQyxZQUFZLEVBQUUsVUFBVSxFQUFFLGFBQWEsRUFBRSxjQUFjLEVBQUUsV0FBVyxFQUFFLFlBQVksRUFBRSxVQUFVLEVBQUUsaUJBQWlCLEVBQUUsZ0JBQWdCLEVBQUUsU0FBUyxFQUFDLE1BQU0sb0JBQW9CLENBQUM7Ozs7Ozs7QUFvQmxMLE1BQU0sT0FBTywwQkFBMEIsR0FBRyxJQUFJOzs7Ozs7OztJQVExQyxVQUFVLEdBQUcsS0FBSzs7OztBQUN0QixNQUFNLFVBQVUseUJBQXlCO0lBQ3ZDLElBQUksQ0FBQyxVQUFVLEVBQUU7UUFDZixVQUFVLEdBQUcsSUFBSSxDQUFDO1FBQ2xCLGlCQUFpQixDQUFDLGNBQWMsRUFBRSxZQUFZLENBQUMsQ0FBQztRQUNoRCxpQkFBaUIsQ0FBQyxZQUFZLEVBQUUsVUFBVSxDQUFDLENBQUM7UUFDNUMsaUJBQWlCLENBQUMsY0FBYyxFQUFFLFlBQVksQ0FBQyxDQUFDO1FBQ2hELGlCQUFpQixDQUFDLGtCQUFrQixFQUFFLGdCQUFnQixDQUFDLENBQUM7UUFDeEQsaUJBQWlCLENBQUMsZ0JBQWdCLEVBQUUsY0FBYyxDQUFDLENBQUM7UUFDcEQsaUJBQWlCLENBQUMsYUFBYSxFQUFFLFdBQVcsQ0FBQyxDQUFDO1FBQzlDLGlCQUFpQixDQUFDLG1CQUFtQixFQUFFLGlCQUFpQixDQUFDLENBQUM7UUFDMUQsaUJBQWlCLENBQUMsZUFBZSxFQUFFLGFBQWEsQ0FBQyxDQUFDO1FBQ2xELGlCQUFpQixDQUFDLFlBQVksRUFBRSxVQUFVLENBQUMsQ0FBQztRQUM1QyxpQkFBaUIsQ0FBQyxXQUFXLEVBQUUsU0FBUyxDQUFDLENBQUM7S0FDM0M7QUFDSCxDQUFDOzs7Ozs7OztBQVVELE1BQU0sVUFBVSxpQkFBaUIsQ0FBQyxJQUFZLEVBQUUsRUFBWTs7VUFDcEQsQ0FBQyxHQUFHLG1CQUFBLG1CQUFBLE1BQU0sRUFBTyxFQUEwQjtJQUNqRCxTQUFTLElBQUksYUFBYSxDQUFDLEVBQUUsRUFBRSxzQkFBc0IsQ0FBQyxDQUFDO0lBQ3ZELElBQUksQ0FBQyxFQUFFOztZQUNELFNBQVMsR0FBRyxDQUFDLENBQUMsMEJBQTBCLENBQUM7UUFDN0MsSUFBSSxDQUFDLFNBQVMsRUFBRTtZQUNkLFNBQVMsR0FBRyxDQUFDLENBQUMsMEJBQTBCLENBQUMsR0FBRyxFQUFFLENBQUM7U0FDaEQ7UUFDRCxTQUFTLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO0tBQ3RCO0FBQ0gsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCB7YXNzZXJ0RGVmaW5lZH0gZnJvbSAnLi4vdXRpbC9hc3NlcnQnO1xuaW1wb3J0IHtnbG9iYWx9IGZyb20gJy4uL3V0aWwvZ2xvYmFsJztcblxuaW1wb3J0IHtnZXRDb21wb25lbnQsIGdldENvbnRleHQsIGdldERpcmVjdGl2ZXMsIGdldEhvc3RFbGVtZW50LCBnZXRJbmplY3RvciwgZ2V0TGlzdGVuZXJzLCBnZXRQbGF5ZXJzLCBnZXRSb290Q29tcG9uZW50cywgZ2V0Vmlld0NvbXBvbmVudCwgbWFya0RpcnR5fSBmcm9tICcuL2dsb2JhbF91dGlsc19hcGknO1xuXG5cblxuLyoqXG4gKiBUaGlzIGZpbGUgaW50cm9kdWNlcyBzZXJpZXMgb2YgZ2xvYmFsbHkgYWNjZXNzaWJsZSBkZWJ1ZyB0b29sc1xuICogdG8gYWxsb3cgZm9yIHRoZSBBbmd1bGFyIGRlYnVnZ2luZyBzdG9yeSB0byBmdW5jdGlvbi5cbiAqXG4gKiBUbyBzZWUgdGhpcyBpbiBhY3Rpb24gcnVuIHRoZSBmb2xsb3dpbmcgY29tbWFuZDpcbiAqXG4gKiAgIGJhemVsIHJ1biAtLWRlZmluZT1jb21waWxlPWFvdFxuICogICAvL3BhY2thZ2VzL2NvcmUvdGVzdC9idW5kbGluZy90b2RvOmRldnNlcnZlclxuICpcbiAqICBUaGVuIGxvYWQgYGxvY2FsaG9zdDo1NDMyYCBhbmQgc3RhcnQgdXNpbmcgdGhlIGNvbnNvbGUgdG9vbHMuXG4gKi9cblxuLyoqXG4gKiBUaGlzIHZhbHVlIHJlZmxlY3RzIHRoZSBwcm9wZXJ0eSBvbiB0aGUgd2luZG93IHdoZXJlIHRoZSBkZXZcbiAqIHRvb2xzIGFyZSBwYXRjaGVkICh3aW5kb3cubmcpLlxuICogKi9cbmV4cG9ydCBjb25zdCBHTE9CQUxfUFVCTElTSF9FWFBBTkRPX0tFWSA9ICduZyc7XG5cbi8qXG4gKiBQdWJsaXNoZXMgYSBjb2xsZWN0aW9uIG9mIGRlZmF1bHQgZGVidWcgdG9vbHMgb250byBgd2luZG93Ll9uZ19gLlxuICpcbiAqIFRoZXNlIGZ1bmN0aW9ucyBhcmUgYXZhaWxhYmxlIGdsb2JhbGx5IHdoZW4gQW5ndWxhciBpcyBpbiBkZXZlbG9wbWVudFxuICogbW9kZSBhbmQgYXJlIGF1dG9tYXRpY2FsbHkgc3RyaXBwZWQgYXdheSBmcm9tIHByb2QgbW9kZSBpcyBvbi5cbiAqL1xubGV0IF9wdWJsaXNoZWQgPSBmYWxzZTtcbmV4cG9ydCBmdW5jdGlvbiBwdWJsaXNoRGVmYXVsdEdsb2JhbFV0aWxzKCkge1xuICBpZiAoIV9wdWJsaXNoZWQpIHtcbiAgICBfcHVibGlzaGVkID0gdHJ1ZTtcbiAgICBwdWJsaXNoR2xvYmFsVXRpbCgnZ2V0Q29tcG9uZW50JywgZ2V0Q29tcG9uZW50KTtcbiAgICBwdWJsaXNoR2xvYmFsVXRpbCgnZ2V0Q29udGV4dCcsIGdldENvbnRleHQpO1xuICAgIHB1Ymxpc2hHbG9iYWxVdGlsKCdnZXRMaXN0ZW5lcnMnLCBnZXRMaXN0ZW5lcnMpO1xuICAgIHB1Ymxpc2hHbG9iYWxVdGlsKCdnZXRWaWV3Q29tcG9uZW50JywgZ2V0Vmlld0NvbXBvbmVudCk7XG4gICAgcHVibGlzaEdsb2JhbFV0aWwoJ2dldEhvc3RFbGVtZW50JywgZ2V0SG9zdEVsZW1lbnQpO1xuICAgIHB1Ymxpc2hHbG9iYWxVdGlsKCdnZXRJbmplY3RvcicsIGdldEluamVjdG9yKTtcbiAgICBwdWJsaXNoR2xvYmFsVXRpbCgnZ2V0Um9vdENvbXBvbmVudHMnLCBnZXRSb290Q29tcG9uZW50cyk7XG4gICAgcHVibGlzaEdsb2JhbFV0aWwoJ2dldERpcmVjdGl2ZXMnLCBnZXREaXJlY3RpdmVzKTtcbiAgICBwdWJsaXNoR2xvYmFsVXRpbCgnZ2V0UGxheWVycycsIGdldFBsYXllcnMpO1xuICAgIHB1Ymxpc2hHbG9iYWxVdGlsKCdtYXJrRGlydHknLCBtYXJrRGlydHkpO1xuICB9XG59XG5cbmV4cG9ydCBkZWNsYXJlIHR5cGUgR2xvYmFsRGV2TW9kZUNvbnRhaW5lciA9IHtcbiAgW0dMT0JBTF9QVUJMSVNIX0VYUEFORE9fS0VZXToge1tmbk5hbWU6IHN0cmluZ106IEZ1bmN0aW9ufTtcbn07XG5cbi8qKlxuICogUHVibGlzaGVzIHRoZSBnaXZlbiBmdW5jdGlvbiB0byBgd2luZG93Lm5nRGV2TW9kZWAgc28gdGhhdCBpdCBjYW4gYmVcbiAqIHVzZWQgZnJvbSB0aGUgYnJvd3NlciBjb25zb2xlIHdoZW4gYW4gYXBwbGljYXRpb24gaXMgbm90IGluIHByb2R1Y3Rpb24uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwdWJsaXNoR2xvYmFsVXRpbChuYW1lOiBzdHJpbmcsIGZuOiBGdW5jdGlvbik6IHZvaWQge1xuICBjb25zdCB3ID0gZ2xvYmFsIGFzIGFueSBhcyBHbG9iYWxEZXZNb2RlQ29udGFpbmVyO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChmbiwgJ2Z1bmN0aW9uIG5vdCBkZWZpbmVkJyk7XG4gIGlmICh3KSB7XG4gICAgbGV0IGNvbnRhaW5lciA9IHdbR0xPQkFMX1BVQkxJU0hfRVhQQU5ET19LRVldO1xuICAgIGlmICghY29udGFpbmVyKSB7XG4gICAgICBjb250YWluZXIgPSB3W0dMT0JBTF9QVUJMSVNIX0VYUEFORE9fS0VZXSA9IHt9O1xuICAgIH1cbiAgICBjb250YWluZXJbbmFtZV0gPSBmbjtcbiAgfVxufVxuIl19