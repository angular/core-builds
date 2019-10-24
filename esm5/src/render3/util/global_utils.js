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
 * This file introduces series of globally accessible debug tools
 * to allow for the Angular debugging story to function.
 *
 * To see this in action run the following command:
 *
 *   bazel run --define=compile=aot
 *   //packages/core/test/bundling/todo:devserver
 *
 *  Then load `localhost:5432` and start using the console tools.
 */
/**
 * This value reflects the property on the window where the dev
 * tools are patched (window.ng).
 * */
export var GLOBAL_PUBLISH_EXPANDO_KEY = 'ng';
var _published = false;
/**
 * Publishes a collection of default debug tools onto`window.ng`.
 *
 * These functions are available globally when Angular is in development
 * mode and are automatically stripped away from prod mode is on.
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
 */
export function publishGlobalUtil(name, fn) {
    if (typeof COMPILED === 'undefined' || !COMPILED) {
        // Note: we can't export `ng` when using closure enhanced optimization as:
        // - closure declares globals itself for minified names, which sometimes clobber our `ng` global
        // - we can't declare a closure extern as the namespace `ng` is already used within Google
        //   for typings for AngularJS (via `goog.provide('ng....')`).
        var w = global;
        ngDevMode && assertDefined(fn, 'function not defined');
        if (w) {
            var container = w[GLOBAL_PUBLISH_EXPANDO_KEY];
            if (!container) {
                container = w[GLOBAL_PUBLISH_EXPANDO_KEY] = {};
            }
            container[name] = fn;
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2xvYmFsX3V0aWxzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy91dGlsL2dsb2JhbF91dGlscy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFDSCxPQUFPLEVBQUMsYUFBYSxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDaEQsT0FBTyxFQUFDLE1BQU0sRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQ3pDLE9BQU8sRUFBQyxZQUFZLEVBQUUsVUFBVSxFQUFFLFlBQVksRUFBRSxhQUFhLEVBQUUsY0FBYyxFQUFFLFdBQVcsRUFBRSxZQUFZLEVBQUUsaUJBQWlCLEVBQUUsZ0JBQWdCLEVBQUUsU0FBUyxFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFJckw7Ozs7Ozs7Ozs7R0FVRztBQUVIOzs7S0FHSztBQUNMLE1BQU0sQ0FBQyxJQUFNLDBCQUEwQixHQUFHLElBQUksQ0FBQztBQUUvQyxJQUFJLFVBQVUsR0FBRyxLQUFLLENBQUM7QUFDdkI7Ozs7O0dBS0c7QUFDSCxNQUFNLFVBQVUseUJBQXlCO0lBQ3ZDLElBQUksQ0FBQyxVQUFVLEVBQUU7UUFDZixVQUFVLEdBQUcsSUFBSSxDQUFDO1FBQ2xCLGlCQUFpQixDQUFDLGNBQWMsRUFBRSxZQUFZLENBQUMsQ0FBQztRQUNoRCxpQkFBaUIsQ0FBQyxZQUFZLEVBQUUsVUFBVSxDQUFDLENBQUM7UUFDNUMsaUJBQWlCLENBQUMsY0FBYyxFQUFFLFlBQVksQ0FBQyxDQUFDO1FBQ2hELGlCQUFpQixDQUFDLGtCQUFrQixFQUFFLGdCQUFnQixDQUFDLENBQUM7UUFDeEQsaUJBQWlCLENBQUMsZ0JBQWdCLEVBQUUsY0FBYyxDQUFDLENBQUM7UUFDcEQsaUJBQWlCLENBQUMsYUFBYSxFQUFFLFdBQVcsQ0FBQyxDQUFDO1FBQzlDLGlCQUFpQixDQUFDLG1CQUFtQixFQUFFLGlCQUFpQixDQUFDLENBQUM7UUFDMUQsaUJBQWlCLENBQUMsZUFBZSxFQUFFLGFBQWEsQ0FBQyxDQUFDO1FBQ2xELGlCQUFpQixDQUFDLGNBQWMsRUFBRSxZQUFZLENBQUMsQ0FBQztRQUNoRCxpQkFBaUIsQ0FBQyxXQUFXLEVBQUUsU0FBUyxDQUFDLENBQUM7S0FDM0M7QUFDSCxDQUFDO0FBTUQ7OztHQUdHO0FBQ0gsTUFBTSxVQUFVLGlCQUFpQixDQUFDLElBQVksRUFBRSxFQUFZO0lBQzFELElBQUksT0FBTyxRQUFRLEtBQUssV0FBVyxJQUFJLENBQUMsUUFBUSxFQUFFO1FBQ2hELDBFQUEwRTtRQUMxRSxnR0FBZ0c7UUFDaEcsMEZBQTBGO1FBQzFGLDhEQUE4RDtRQUM5RCxJQUFNLENBQUMsR0FBRyxNQUF1QyxDQUFDO1FBQ2xELFNBQVMsSUFBSSxhQUFhLENBQUMsRUFBRSxFQUFFLHNCQUFzQixDQUFDLENBQUM7UUFDdkQsSUFBSSxDQUFDLEVBQUU7WUFDTCxJQUFJLFNBQVMsR0FBRyxDQUFDLENBQUMsMEJBQTBCLENBQUMsQ0FBQztZQUM5QyxJQUFJLENBQUMsU0FBUyxFQUFFO2dCQUNkLFNBQVMsR0FBRyxDQUFDLENBQUMsMEJBQTBCLENBQUMsR0FBRyxFQUFFLENBQUM7YUFDaEQ7WUFDRCxTQUFTLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO1NBQ3RCO0tBQ0Y7QUFDSCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0IHthc3NlcnREZWZpbmVkfSBmcm9tICcuLi8uLi91dGlsL2Fzc2VydCc7XG5pbXBvcnQge2dsb2JhbH0gZnJvbSAnLi4vLi4vdXRpbC9nbG9iYWwnO1xuaW1wb3J0IHtnZXRDb21wb25lbnQsIGdldENvbnRleHQsIGdldERlYnVnTm9kZSwgZ2V0RGlyZWN0aXZlcywgZ2V0SG9zdEVsZW1lbnQsIGdldEluamVjdG9yLCBnZXRMaXN0ZW5lcnMsIGdldFJvb3RDb21wb25lbnRzLCBnZXRWaWV3Q29tcG9uZW50LCBtYXJrRGlydHl9IGZyb20gJy4uL2dsb2JhbF91dGlsc19hcGknO1xuXG5cblxuLyoqXG4gKiBUaGlzIGZpbGUgaW50cm9kdWNlcyBzZXJpZXMgb2YgZ2xvYmFsbHkgYWNjZXNzaWJsZSBkZWJ1ZyB0b29sc1xuICogdG8gYWxsb3cgZm9yIHRoZSBBbmd1bGFyIGRlYnVnZ2luZyBzdG9yeSB0byBmdW5jdGlvbi5cbiAqXG4gKiBUbyBzZWUgdGhpcyBpbiBhY3Rpb24gcnVuIHRoZSBmb2xsb3dpbmcgY29tbWFuZDpcbiAqXG4gKiAgIGJhemVsIHJ1biAtLWRlZmluZT1jb21waWxlPWFvdFxuICogICAvL3BhY2thZ2VzL2NvcmUvdGVzdC9idW5kbGluZy90b2RvOmRldnNlcnZlclxuICpcbiAqICBUaGVuIGxvYWQgYGxvY2FsaG9zdDo1NDMyYCBhbmQgc3RhcnQgdXNpbmcgdGhlIGNvbnNvbGUgdG9vbHMuXG4gKi9cblxuLyoqXG4gKiBUaGlzIHZhbHVlIHJlZmxlY3RzIHRoZSBwcm9wZXJ0eSBvbiB0aGUgd2luZG93IHdoZXJlIHRoZSBkZXZcbiAqIHRvb2xzIGFyZSBwYXRjaGVkICh3aW5kb3cubmcpLlxuICogKi9cbmV4cG9ydCBjb25zdCBHTE9CQUxfUFVCTElTSF9FWFBBTkRPX0tFWSA9ICduZyc7XG5cbmxldCBfcHVibGlzaGVkID0gZmFsc2U7XG4vKipcbiAqIFB1Ymxpc2hlcyBhIGNvbGxlY3Rpb24gb2YgZGVmYXVsdCBkZWJ1ZyB0b29scyBvbnRvYHdpbmRvdy5uZ2AuXG4gKlxuICogVGhlc2UgZnVuY3Rpb25zIGFyZSBhdmFpbGFibGUgZ2xvYmFsbHkgd2hlbiBBbmd1bGFyIGlzIGluIGRldmVsb3BtZW50XG4gKiBtb2RlIGFuZCBhcmUgYXV0b21hdGljYWxseSBzdHJpcHBlZCBhd2F5IGZyb20gcHJvZCBtb2RlIGlzIG9uLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcHVibGlzaERlZmF1bHRHbG9iYWxVdGlscygpIHtcbiAgaWYgKCFfcHVibGlzaGVkKSB7XG4gICAgX3B1Ymxpc2hlZCA9IHRydWU7XG4gICAgcHVibGlzaEdsb2JhbFV0aWwoJ2dldENvbXBvbmVudCcsIGdldENvbXBvbmVudCk7XG4gICAgcHVibGlzaEdsb2JhbFV0aWwoJ2dldENvbnRleHQnLCBnZXRDb250ZXh0KTtcbiAgICBwdWJsaXNoR2xvYmFsVXRpbCgnZ2V0TGlzdGVuZXJzJywgZ2V0TGlzdGVuZXJzKTtcbiAgICBwdWJsaXNoR2xvYmFsVXRpbCgnZ2V0Vmlld0NvbXBvbmVudCcsIGdldFZpZXdDb21wb25lbnQpO1xuICAgIHB1Ymxpc2hHbG9iYWxVdGlsKCdnZXRIb3N0RWxlbWVudCcsIGdldEhvc3RFbGVtZW50KTtcbiAgICBwdWJsaXNoR2xvYmFsVXRpbCgnZ2V0SW5qZWN0b3InLCBnZXRJbmplY3Rvcik7XG4gICAgcHVibGlzaEdsb2JhbFV0aWwoJ2dldFJvb3RDb21wb25lbnRzJywgZ2V0Um9vdENvbXBvbmVudHMpO1xuICAgIHB1Ymxpc2hHbG9iYWxVdGlsKCdnZXREaXJlY3RpdmVzJywgZ2V0RGlyZWN0aXZlcyk7XG4gICAgcHVibGlzaEdsb2JhbFV0aWwoJ2dldERlYnVnTm9kZScsIGdldERlYnVnTm9kZSk7XG4gICAgcHVibGlzaEdsb2JhbFV0aWwoJ21hcmtEaXJ0eScsIG1hcmtEaXJ0eSk7XG4gIH1cbn1cblxuZXhwb3J0IGRlY2xhcmUgdHlwZSBHbG9iYWxEZXZNb2RlQ29udGFpbmVyID0ge1xuICBbR0xPQkFMX1BVQkxJU0hfRVhQQU5ET19LRVldOiB7W2ZuTmFtZTogc3RyaW5nXTogRnVuY3Rpb259O1xufTtcblxuLyoqXG4gKiBQdWJsaXNoZXMgdGhlIGdpdmVuIGZ1bmN0aW9uIHRvIGB3aW5kb3cubmdgIHNvIHRoYXQgaXQgY2FuIGJlXG4gKiB1c2VkIGZyb20gdGhlIGJyb3dzZXIgY29uc29sZSB3aGVuIGFuIGFwcGxpY2F0aW9uIGlzIG5vdCBpbiBwcm9kdWN0aW9uLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcHVibGlzaEdsb2JhbFV0aWwobmFtZTogc3RyaW5nLCBmbjogRnVuY3Rpb24pOiB2b2lkIHtcbiAgaWYgKHR5cGVvZiBDT01QSUxFRCA9PT0gJ3VuZGVmaW5lZCcgfHwgIUNPTVBJTEVEKSB7XG4gICAgLy8gTm90ZTogd2UgY2FuJ3QgZXhwb3J0IGBuZ2Agd2hlbiB1c2luZyBjbG9zdXJlIGVuaGFuY2VkIG9wdGltaXphdGlvbiBhczpcbiAgICAvLyAtIGNsb3N1cmUgZGVjbGFyZXMgZ2xvYmFscyBpdHNlbGYgZm9yIG1pbmlmaWVkIG5hbWVzLCB3aGljaCBzb21ldGltZXMgY2xvYmJlciBvdXIgYG5nYCBnbG9iYWxcbiAgICAvLyAtIHdlIGNhbid0IGRlY2xhcmUgYSBjbG9zdXJlIGV4dGVybiBhcyB0aGUgbmFtZXNwYWNlIGBuZ2AgaXMgYWxyZWFkeSB1c2VkIHdpdGhpbiBHb29nbGVcbiAgICAvLyAgIGZvciB0eXBpbmdzIGZvciBBbmd1bGFySlMgKHZpYSBgZ29vZy5wcm92aWRlKCduZy4uLi4nKWApLlxuICAgIGNvbnN0IHcgPSBnbG9iYWwgYXMgYW55IGFzIEdsb2JhbERldk1vZGVDb250YWluZXI7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQoZm4sICdmdW5jdGlvbiBub3QgZGVmaW5lZCcpO1xuICAgIGlmICh3KSB7XG4gICAgICBsZXQgY29udGFpbmVyID0gd1tHTE9CQUxfUFVCTElTSF9FWFBBTkRPX0tFWV07XG4gICAgICBpZiAoIWNvbnRhaW5lcikge1xuICAgICAgICBjb250YWluZXIgPSB3W0dMT0JBTF9QVUJMSVNIX0VYUEFORE9fS0VZXSA9IHt9O1xuICAgICAgfVxuICAgICAgY29udGFpbmVyW25hbWVdID0gZm47XG4gICAgfVxuICB9XG59XG4iXX0=