/**
 * @fileoverview added by tsickle
 * Generated from: packages/core/src/render3/util/global_utils.ts
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { assertDefined } from '../../util/assert';
import { global } from '../../util/global';
import { getComponent, getContext, getDebugNode, getDirectives, getHostElement, getInjector, getListeners, getRootComponents, getViewComponent, markDirty } from '../global_utils_api';
/**
 * This value reflects the property on the window where the dev
 * tools are patched (window.ng).
 *
 * @type {?}
 */
export const GLOBAL_PUBLISH_EXPANDO_KEY = 'ng';
/** @type {?} */
let _published = false;
/**
 * Publishes a collection of default debug tools onto`window.ng`.
 *
 * These functions are available globally when Angular is in development
 * mode and are automatically stripped away from prod mode is on.
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
        publishGlobalUtil('getDebugNode', getDebugNode);
        publishGlobalUtil('markDirty', markDirty);
    }
}
/**
 * Publishes the given function to `window.ng` so that it can be
 * used from the browser console when an application is not in production.
 * @param {?} name
 * @param {?} fn
 * @return {?}
 */
export function publishGlobalUtil(name, fn) {
    if (typeof COMPILED === 'undefined' || !COMPILED) {
        // Note: we can't export `ng` when using closure enhanced optimization as:
        // - closure declares globals itself for minified names, which sometimes clobber our `ng` global
        // - we can't declare a closure extern as the namespace `ng` is already used within Google
        //   for typings for AngularJS (via `goog.provide('ng....')`).
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
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2xvYmFsX3V0aWxzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy91dGlsL2dsb2JhbF91dGlscy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFPQSxPQUFPLEVBQUMsYUFBYSxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDaEQsT0FBTyxFQUFDLE1BQU0sRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQ3pDLE9BQU8sRUFBQyxZQUFZLEVBQUUsVUFBVSxFQUFFLFlBQVksRUFBRSxhQUFhLEVBQUUsY0FBYyxFQUFFLFdBQVcsRUFBRSxZQUFZLEVBQUUsaUJBQWlCLEVBQUUsZ0JBQWdCLEVBQUUsU0FBUyxFQUFDLE1BQU0scUJBQXFCLENBQUM7Ozs7Ozs7QUFvQnJMLE1BQU0sT0FBTywwQkFBMEIsR0FBRyxJQUFJOztJQUUxQyxVQUFVLEdBQUcsS0FBSzs7Ozs7Ozs7QUFPdEIsTUFBTSxVQUFVLHlCQUF5QjtJQUN2QyxJQUFJLENBQUMsVUFBVSxFQUFFO1FBQ2YsVUFBVSxHQUFHLElBQUksQ0FBQztRQUNsQixpQkFBaUIsQ0FBQyxjQUFjLEVBQUUsWUFBWSxDQUFDLENBQUM7UUFDaEQsaUJBQWlCLENBQUMsWUFBWSxFQUFFLFVBQVUsQ0FBQyxDQUFDO1FBQzVDLGlCQUFpQixDQUFDLGNBQWMsRUFBRSxZQUFZLENBQUMsQ0FBQztRQUNoRCxpQkFBaUIsQ0FBQyxrQkFBa0IsRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDO1FBQ3hELGlCQUFpQixDQUFDLGdCQUFnQixFQUFFLGNBQWMsQ0FBQyxDQUFDO1FBQ3BELGlCQUFpQixDQUFDLGFBQWEsRUFBRSxXQUFXLENBQUMsQ0FBQztRQUM5QyxpQkFBaUIsQ0FBQyxtQkFBbUIsRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO1FBQzFELGlCQUFpQixDQUFDLGVBQWUsRUFBRSxhQUFhLENBQUMsQ0FBQztRQUNsRCxpQkFBaUIsQ0FBQyxjQUFjLEVBQUUsWUFBWSxDQUFDLENBQUM7UUFDaEQsaUJBQWlCLENBQUMsV0FBVyxFQUFFLFNBQVMsQ0FBQyxDQUFDO0tBQzNDO0FBQ0gsQ0FBQzs7Ozs7Ozs7QUFVRCxNQUFNLFVBQVUsaUJBQWlCLENBQUMsSUFBWSxFQUFFLEVBQVk7SUFDMUQsSUFBSSxPQUFPLFFBQVEsS0FBSyxXQUFXLElBQUksQ0FBQyxRQUFRLEVBQUU7Ozs7OztjQUsxQyxDQUFDLEdBQUcsbUJBQUEsbUJBQUEsTUFBTSxFQUFPLEVBQTBCO1FBQ2pELFNBQVMsSUFBSSxhQUFhLENBQUMsRUFBRSxFQUFFLHNCQUFzQixDQUFDLENBQUM7UUFDdkQsSUFBSSxDQUFDLEVBQUU7O2dCQUNELFNBQVMsR0FBRyxDQUFDLENBQUMsMEJBQTBCLENBQUM7WUFDN0MsSUFBSSxDQUFDLFNBQVMsRUFBRTtnQkFDZCxTQUFTLEdBQUcsQ0FBQyxDQUFDLDBCQUEwQixDQUFDLEdBQUcsRUFBRSxDQUFDO2FBQ2hEO1lBQ0QsU0FBUyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztTQUN0QjtLQUNGO0FBQ0gsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCB7YXNzZXJ0RGVmaW5lZH0gZnJvbSAnLi4vLi4vdXRpbC9hc3NlcnQnO1xuaW1wb3J0IHtnbG9iYWx9IGZyb20gJy4uLy4uL3V0aWwvZ2xvYmFsJztcbmltcG9ydCB7Z2V0Q29tcG9uZW50LCBnZXRDb250ZXh0LCBnZXREZWJ1Z05vZGUsIGdldERpcmVjdGl2ZXMsIGdldEhvc3RFbGVtZW50LCBnZXRJbmplY3RvciwgZ2V0TGlzdGVuZXJzLCBnZXRSb290Q29tcG9uZW50cywgZ2V0Vmlld0NvbXBvbmVudCwgbWFya0RpcnR5fSBmcm9tICcuLi9nbG9iYWxfdXRpbHNfYXBpJztcblxuXG5cbi8qKlxuICogVGhpcyBmaWxlIGludHJvZHVjZXMgc2VyaWVzIG9mIGdsb2JhbGx5IGFjY2Vzc2libGUgZGVidWcgdG9vbHNcbiAqIHRvIGFsbG93IGZvciB0aGUgQW5ndWxhciBkZWJ1Z2dpbmcgc3RvcnkgdG8gZnVuY3Rpb24uXG4gKlxuICogVG8gc2VlIHRoaXMgaW4gYWN0aW9uIHJ1biB0aGUgZm9sbG93aW5nIGNvbW1hbmQ6XG4gKlxuICogICBiYXplbCBydW4gLS1jb25maWc9aXZ5XG4gKiAgIC8vcGFja2FnZXMvY29yZS90ZXN0L2J1bmRsaW5nL3RvZG86ZGV2c2VydmVyXG4gKlxuICogIFRoZW4gbG9hZCBgbG9jYWxob3N0OjU0MzJgIGFuZCBzdGFydCB1c2luZyB0aGUgY29uc29sZSB0b29scy5cbiAqL1xuXG4vKipcbiAqIFRoaXMgdmFsdWUgcmVmbGVjdHMgdGhlIHByb3BlcnR5IG9uIHRoZSB3aW5kb3cgd2hlcmUgdGhlIGRldlxuICogdG9vbHMgYXJlIHBhdGNoZWQgKHdpbmRvdy5uZykuXG4gKiAqL1xuZXhwb3J0IGNvbnN0IEdMT0JBTF9QVUJMSVNIX0VYUEFORE9fS0VZID0gJ25nJztcblxubGV0IF9wdWJsaXNoZWQgPSBmYWxzZTtcbi8qKlxuICogUHVibGlzaGVzIGEgY29sbGVjdGlvbiBvZiBkZWZhdWx0IGRlYnVnIHRvb2xzIG9udG9gd2luZG93Lm5nYC5cbiAqXG4gKiBUaGVzZSBmdW5jdGlvbnMgYXJlIGF2YWlsYWJsZSBnbG9iYWxseSB3aGVuIEFuZ3VsYXIgaXMgaW4gZGV2ZWxvcG1lbnRcbiAqIG1vZGUgYW5kIGFyZSBhdXRvbWF0aWNhbGx5IHN0cmlwcGVkIGF3YXkgZnJvbSBwcm9kIG1vZGUgaXMgb24uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwdWJsaXNoRGVmYXVsdEdsb2JhbFV0aWxzKCkge1xuICBpZiAoIV9wdWJsaXNoZWQpIHtcbiAgICBfcHVibGlzaGVkID0gdHJ1ZTtcbiAgICBwdWJsaXNoR2xvYmFsVXRpbCgnZ2V0Q29tcG9uZW50JywgZ2V0Q29tcG9uZW50KTtcbiAgICBwdWJsaXNoR2xvYmFsVXRpbCgnZ2V0Q29udGV4dCcsIGdldENvbnRleHQpO1xuICAgIHB1Ymxpc2hHbG9iYWxVdGlsKCdnZXRMaXN0ZW5lcnMnLCBnZXRMaXN0ZW5lcnMpO1xuICAgIHB1Ymxpc2hHbG9iYWxVdGlsKCdnZXRWaWV3Q29tcG9uZW50JywgZ2V0Vmlld0NvbXBvbmVudCk7XG4gICAgcHVibGlzaEdsb2JhbFV0aWwoJ2dldEhvc3RFbGVtZW50JywgZ2V0SG9zdEVsZW1lbnQpO1xuICAgIHB1Ymxpc2hHbG9iYWxVdGlsKCdnZXRJbmplY3RvcicsIGdldEluamVjdG9yKTtcbiAgICBwdWJsaXNoR2xvYmFsVXRpbCgnZ2V0Um9vdENvbXBvbmVudHMnLCBnZXRSb290Q29tcG9uZW50cyk7XG4gICAgcHVibGlzaEdsb2JhbFV0aWwoJ2dldERpcmVjdGl2ZXMnLCBnZXREaXJlY3RpdmVzKTtcbiAgICBwdWJsaXNoR2xvYmFsVXRpbCgnZ2V0RGVidWdOb2RlJywgZ2V0RGVidWdOb2RlKTtcbiAgICBwdWJsaXNoR2xvYmFsVXRpbCgnbWFya0RpcnR5JywgbWFya0RpcnR5KTtcbiAgfVxufVxuXG5leHBvcnQgZGVjbGFyZSB0eXBlIEdsb2JhbERldk1vZGVDb250YWluZXIgPSB7XG4gIFtHTE9CQUxfUFVCTElTSF9FWFBBTkRPX0tFWV06IHtbZm5OYW1lOiBzdHJpbmddOiBGdW5jdGlvbn07XG59O1xuXG4vKipcbiAqIFB1Ymxpc2hlcyB0aGUgZ2l2ZW4gZnVuY3Rpb24gdG8gYHdpbmRvdy5uZ2Agc28gdGhhdCBpdCBjYW4gYmVcbiAqIHVzZWQgZnJvbSB0aGUgYnJvd3NlciBjb25zb2xlIHdoZW4gYW4gYXBwbGljYXRpb24gaXMgbm90IGluIHByb2R1Y3Rpb24uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwdWJsaXNoR2xvYmFsVXRpbChuYW1lOiBzdHJpbmcsIGZuOiBGdW5jdGlvbik6IHZvaWQge1xuICBpZiAodHlwZW9mIENPTVBJTEVEID09PSAndW5kZWZpbmVkJyB8fCAhQ09NUElMRUQpIHtcbiAgICAvLyBOb3RlOiB3ZSBjYW4ndCBleHBvcnQgYG5nYCB3aGVuIHVzaW5nIGNsb3N1cmUgZW5oYW5jZWQgb3B0aW1pemF0aW9uIGFzOlxuICAgIC8vIC0gY2xvc3VyZSBkZWNsYXJlcyBnbG9iYWxzIGl0c2VsZiBmb3IgbWluaWZpZWQgbmFtZXMsIHdoaWNoIHNvbWV0aW1lcyBjbG9iYmVyIG91ciBgbmdgIGdsb2JhbFxuICAgIC8vIC0gd2UgY2FuJ3QgZGVjbGFyZSBhIGNsb3N1cmUgZXh0ZXJuIGFzIHRoZSBuYW1lc3BhY2UgYG5nYCBpcyBhbHJlYWR5IHVzZWQgd2l0aGluIEdvb2dsZVxuICAgIC8vICAgZm9yIHR5cGluZ3MgZm9yIEFuZ3VsYXJKUyAodmlhIGBnb29nLnByb3ZpZGUoJ25nLi4uLicpYCkuXG4gICAgY29uc3QgdyA9IGdsb2JhbCBhcyBhbnkgYXMgR2xvYmFsRGV2TW9kZUNvbnRhaW5lcjtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChmbiwgJ2Z1bmN0aW9uIG5vdCBkZWZpbmVkJyk7XG4gICAgaWYgKHcpIHtcbiAgICAgIGxldCBjb250YWluZXIgPSB3W0dMT0JBTF9QVUJMSVNIX0VYUEFORE9fS0VZXTtcbiAgICAgIGlmICghY29udGFpbmVyKSB7XG4gICAgICAgIGNvbnRhaW5lciA9IHdbR0xPQkFMX1BVQkxJU0hfRVhQQU5ET19LRVldID0ge307XG4gICAgICB9XG4gICAgICBjb250YWluZXJbbmFtZV0gPSBmbjtcbiAgICB9XG4gIH1cbn1cbiJdfQ==