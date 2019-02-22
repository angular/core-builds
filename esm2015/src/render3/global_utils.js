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
        publishGlobalUtil('getPlayers', getPlayers);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2xvYmFsX3V0aWxzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9nbG9iYWxfdXRpbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFPQSxPQUFPLEVBQUMsYUFBYSxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFDN0MsT0FBTyxFQUFDLE1BQU0sRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBRXRDLE9BQU8sRUFBQyxZQUFZLEVBQUUsVUFBVSxFQUFFLGFBQWEsRUFBRSxjQUFjLEVBQUUsV0FBVyxFQUFFLFlBQVksRUFBRSxVQUFVLEVBQUUsaUJBQWlCLEVBQUUsZ0JBQWdCLEVBQUUsU0FBUyxFQUFDLE1BQU0sb0JBQW9CLENBQUM7Ozs7Ozs7QUFvQmxMLE1BQU0sT0FBTywwQkFBMEIsR0FBRyxJQUFJOztJQUUxQyxVQUFVLEdBQUcsS0FBSzs7Ozs7Ozs7QUFPdEIsTUFBTSxVQUFVLHlCQUF5QjtJQUN2QyxJQUFJLENBQUMsVUFBVSxFQUFFO1FBQ2YsVUFBVSxHQUFHLElBQUksQ0FBQztRQUNsQixpQkFBaUIsQ0FBQyxjQUFjLEVBQUUsWUFBWSxDQUFDLENBQUM7UUFDaEQsaUJBQWlCLENBQUMsWUFBWSxFQUFFLFVBQVUsQ0FBQyxDQUFDO1FBQzVDLGlCQUFpQixDQUFDLGNBQWMsRUFBRSxZQUFZLENBQUMsQ0FBQztRQUNoRCxpQkFBaUIsQ0FBQyxrQkFBa0IsRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDO1FBQ3hELGlCQUFpQixDQUFDLGdCQUFnQixFQUFFLGNBQWMsQ0FBQyxDQUFDO1FBQ3BELGlCQUFpQixDQUFDLGFBQWEsRUFBRSxXQUFXLENBQUMsQ0FBQztRQUM5QyxpQkFBaUIsQ0FBQyxtQkFBbUIsRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO1FBQzFELGlCQUFpQixDQUFDLGVBQWUsRUFBRSxhQUFhLENBQUMsQ0FBQztRQUNsRCxpQkFBaUIsQ0FBQyxZQUFZLEVBQUUsVUFBVSxDQUFDLENBQUM7UUFDNUMsaUJBQWlCLENBQUMsV0FBVyxFQUFFLFNBQVMsQ0FBQyxDQUFDO0tBQzNDO0FBQ0gsQ0FBQzs7Ozs7Ozs7QUFVRCxNQUFNLFVBQVUsaUJBQWlCLENBQUMsSUFBWSxFQUFFLEVBQVk7O1VBQ3BELENBQUMsR0FBRyxtQkFBQSxtQkFBQSxNQUFNLEVBQU8sRUFBMEI7SUFDakQsU0FBUyxJQUFJLGFBQWEsQ0FBQyxFQUFFLEVBQUUsc0JBQXNCLENBQUMsQ0FBQztJQUN2RCxJQUFJLENBQUMsRUFBRTs7WUFDRCxTQUFTLEdBQUcsQ0FBQyxDQUFDLDBCQUEwQixDQUFDO1FBQzdDLElBQUksQ0FBQyxTQUFTLEVBQUU7WUFDZCxTQUFTLEdBQUcsQ0FBQyxDQUFDLDBCQUEwQixDQUFDLEdBQUcsRUFBRSxDQUFDO1NBQ2hEO1FBQ0QsU0FBUyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztLQUN0QjtBQUNILENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5pbXBvcnQge2Fzc2VydERlZmluZWR9IGZyb20gJy4uL3V0aWwvYXNzZXJ0JztcbmltcG9ydCB7Z2xvYmFsfSBmcm9tICcuLi91dGlsL2dsb2JhbCc7XG5cbmltcG9ydCB7Z2V0Q29tcG9uZW50LCBnZXRDb250ZXh0LCBnZXREaXJlY3RpdmVzLCBnZXRIb3N0RWxlbWVudCwgZ2V0SW5qZWN0b3IsIGdldExpc3RlbmVycywgZ2V0UGxheWVycywgZ2V0Um9vdENvbXBvbmVudHMsIGdldFZpZXdDb21wb25lbnQsIG1hcmtEaXJ0eX0gZnJvbSAnLi9nbG9iYWxfdXRpbHNfYXBpJztcblxuXG5cbi8qKlxuICogVGhpcyBmaWxlIGludHJvZHVjZXMgc2VyaWVzIG9mIGdsb2JhbGx5IGFjY2Vzc2libGUgZGVidWcgdG9vbHNcbiAqIHRvIGFsbG93IGZvciB0aGUgQW5ndWxhciBkZWJ1Z2dpbmcgc3RvcnkgdG8gZnVuY3Rpb24uXG4gKlxuICogVG8gc2VlIHRoaXMgaW4gYWN0aW9uIHJ1biB0aGUgZm9sbG93aW5nIGNvbW1hbmQ6XG4gKlxuICogICBiYXplbCBydW4gLS1kZWZpbmU9Y29tcGlsZT1hb3RcbiAqICAgLy9wYWNrYWdlcy9jb3JlL3Rlc3QvYnVuZGxpbmcvdG9kbzpkZXZzZXJ2ZXJcbiAqXG4gKiAgVGhlbiBsb2FkIGBsb2NhbGhvc3Q6NTQzMmAgYW5kIHN0YXJ0IHVzaW5nIHRoZSBjb25zb2xlIHRvb2xzLlxuICovXG5cbi8qKlxuICogVGhpcyB2YWx1ZSByZWZsZWN0cyB0aGUgcHJvcGVydHkgb24gdGhlIHdpbmRvdyB3aGVyZSB0aGUgZGV2XG4gKiB0b29scyBhcmUgcGF0Y2hlZCAod2luZG93Lm5nKS5cbiAqICovXG5leHBvcnQgY29uc3QgR0xPQkFMX1BVQkxJU0hfRVhQQU5ET19LRVkgPSAnbmcnO1xuXG5sZXQgX3B1Ymxpc2hlZCA9IGZhbHNlO1xuLyoqXG4gKiBQdWJsaXNoZXMgYSBjb2xsZWN0aW9uIG9mIGRlZmF1bHQgZGVidWcgdG9vbHMgb250b2B3aW5kb3cubmdgLlxuICpcbiAqIFRoZXNlIGZ1bmN0aW9ucyBhcmUgYXZhaWxhYmxlIGdsb2JhbGx5IHdoZW4gQW5ndWxhciBpcyBpbiBkZXZlbG9wbWVudFxuICogbW9kZSBhbmQgYXJlIGF1dG9tYXRpY2FsbHkgc3RyaXBwZWQgYXdheSBmcm9tIHByb2QgbW9kZSBpcyBvbi5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHB1Ymxpc2hEZWZhdWx0R2xvYmFsVXRpbHMoKSB7XG4gIGlmICghX3B1Ymxpc2hlZCkge1xuICAgIF9wdWJsaXNoZWQgPSB0cnVlO1xuICAgIHB1Ymxpc2hHbG9iYWxVdGlsKCdnZXRDb21wb25lbnQnLCBnZXRDb21wb25lbnQpO1xuICAgIHB1Ymxpc2hHbG9iYWxVdGlsKCdnZXRDb250ZXh0JywgZ2V0Q29udGV4dCk7XG4gICAgcHVibGlzaEdsb2JhbFV0aWwoJ2dldExpc3RlbmVycycsIGdldExpc3RlbmVycyk7XG4gICAgcHVibGlzaEdsb2JhbFV0aWwoJ2dldFZpZXdDb21wb25lbnQnLCBnZXRWaWV3Q29tcG9uZW50KTtcbiAgICBwdWJsaXNoR2xvYmFsVXRpbCgnZ2V0SG9zdEVsZW1lbnQnLCBnZXRIb3N0RWxlbWVudCk7XG4gICAgcHVibGlzaEdsb2JhbFV0aWwoJ2dldEluamVjdG9yJywgZ2V0SW5qZWN0b3IpO1xuICAgIHB1Ymxpc2hHbG9iYWxVdGlsKCdnZXRSb290Q29tcG9uZW50cycsIGdldFJvb3RDb21wb25lbnRzKTtcbiAgICBwdWJsaXNoR2xvYmFsVXRpbCgnZ2V0RGlyZWN0aXZlcycsIGdldERpcmVjdGl2ZXMpO1xuICAgIHB1Ymxpc2hHbG9iYWxVdGlsKCdnZXRQbGF5ZXJzJywgZ2V0UGxheWVycyk7XG4gICAgcHVibGlzaEdsb2JhbFV0aWwoJ21hcmtEaXJ0eScsIG1hcmtEaXJ0eSk7XG4gIH1cbn1cblxuZXhwb3J0IGRlY2xhcmUgdHlwZSBHbG9iYWxEZXZNb2RlQ29udGFpbmVyID0ge1xuICBbR0xPQkFMX1BVQkxJU0hfRVhQQU5ET19LRVldOiB7W2ZuTmFtZTogc3RyaW5nXTogRnVuY3Rpb259O1xufTtcblxuLyoqXG4gKiBQdWJsaXNoZXMgdGhlIGdpdmVuIGZ1bmN0aW9uIHRvIGB3aW5kb3cubmdgIHNvIHRoYXQgaXQgY2FuIGJlXG4gKiB1c2VkIGZyb20gdGhlIGJyb3dzZXIgY29uc29sZSB3aGVuIGFuIGFwcGxpY2F0aW9uIGlzIG5vdCBpbiBwcm9kdWN0aW9uLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcHVibGlzaEdsb2JhbFV0aWwobmFtZTogc3RyaW5nLCBmbjogRnVuY3Rpb24pOiB2b2lkIHtcbiAgY29uc3QgdyA9IGdsb2JhbCBhcyBhbnkgYXMgR2xvYmFsRGV2TW9kZUNvbnRhaW5lcjtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQoZm4sICdmdW5jdGlvbiBub3QgZGVmaW5lZCcpO1xuICBpZiAodykge1xuICAgIGxldCBjb250YWluZXIgPSB3W0dMT0JBTF9QVUJMSVNIX0VYUEFORE9fS0VZXTtcbiAgICBpZiAoIWNvbnRhaW5lcikge1xuICAgICAgY29udGFpbmVyID0gd1tHTE9CQUxfUFVCTElTSF9FWFBBTkRPX0tFWV0gPSB7fTtcbiAgICB9XG4gICAgY29udGFpbmVyW25hbWVdID0gZm47XG4gIH1cbn1cbiJdfQ==