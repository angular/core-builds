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
 *   bazel run --config=ivy
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2xvYmFsX3V0aWxzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy91dGlsL2dsb2JhbF91dGlscy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFDSCxPQUFPLEVBQUMsYUFBYSxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDaEQsT0FBTyxFQUFDLE1BQU0sRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQ3pDLE9BQU8sRUFBQyxZQUFZLEVBQUUsVUFBVSxFQUFFLFlBQVksRUFBRSxhQUFhLEVBQUUsY0FBYyxFQUFFLFdBQVcsRUFBRSxZQUFZLEVBQUUsaUJBQWlCLEVBQUUsZ0JBQWdCLEVBQUUsU0FBUyxFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFJckw7Ozs7Ozs7Ozs7R0FVRztBQUVIOzs7S0FHSztBQUNMLE1BQU0sQ0FBQyxJQUFNLDBCQUEwQixHQUFHLElBQUksQ0FBQztBQUUvQyxJQUFJLFVBQVUsR0FBRyxLQUFLLENBQUM7QUFDdkI7Ozs7O0dBS0c7QUFDSCxNQUFNLFVBQVUseUJBQXlCO0lBQ3ZDLElBQUksQ0FBQyxVQUFVLEVBQUU7UUFDZixVQUFVLEdBQUcsSUFBSSxDQUFDO1FBQ2xCLGlCQUFpQixDQUFDLGNBQWMsRUFBRSxZQUFZLENBQUMsQ0FBQztRQUNoRCxpQkFBaUIsQ0FBQyxZQUFZLEVBQUUsVUFBVSxDQUFDLENBQUM7UUFDNUMsaUJBQWlCLENBQUMsY0FBYyxFQUFFLFlBQVksQ0FBQyxDQUFDO1FBQ2hELGlCQUFpQixDQUFDLGtCQUFrQixFQUFFLGdCQUFnQixDQUFDLENBQUM7UUFDeEQsaUJBQWlCLENBQUMsZ0JBQWdCLEVBQUUsY0FBYyxDQUFDLENBQUM7UUFDcEQsaUJBQWlCLENBQUMsYUFBYSxFQUFFLFdBQVcsQ0FBQyxDQUFDO1FBQzlDLGlCQUFpQixDQUFDLG1CQUFtQixFQUFFLGlCQUFpQixDQUFDLENBQUM7UUFDMUQsaUJBQWlCLENBQUMsZUFBZSxFQUFFLGFBQWEsQ0FBQyxDQUFDO1FBQ2xELGlCQUFpQixDQUFDLGNBQWMsRUFBRSxZQUFZLENBQUMsQ0FBQztRQUNoRCxpQkFBaUIsQ0FBQyxXQUFXLEVBQUUsU0FBUyxDQUFDLENBQUM7S0FDM0M7QUFDSCxDQUFDO0FBTUQ7OztHQUdHO0FBQ0gsTUFBTSxVQUFVLGlCQUFpQixDQUFDLElBQVksRUFBRSxFQUFZO0lBQzFELElBQUksT0FBTyxRQUFRLEtBQUssV0FBVyxJQUFJLENBQUMsUUFBUSxFQUFFO1FBQ2hELDBFQUEwRTtRQUMxRSxnR0FBZ0c7UUFDaEcsMEZBQTBGO1FBQzFGLDhEQUE4RDtRQUM5RCxJQUFNLENBQUMsR0FBRyxNQUF1QyxDQUFDO1FBQ2xELFNBQVMsSUFBSSxhQUFhLENBQUMsRUFBRSxFQUFFLHNCQUFzQixDQUFDLENBQUM7UUFDdkQsSUFBSSxDQUFDLEVBQUU7WUFDTCxJQUFJLFNBQVMsR0FBRyxDQUFDLENBQUMsMEJBQTBCLENBQUMsQ0FBQztZQUM5QyxJQUFJLENBQUMsU0FBUyxFQUFFO2dCQUNkLFNBQVMsR0FBRyxDQUFDLENBQUMsMEJBQTBCLENBQUMsR0FBRyxFQUFFLENBQUM7YUFDaEQ7WUFDRCxTQUFTLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO1NBQ3RCO0tBQ0Y7QUFDSCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0IHthc3NlcnREZWZpbmVkfSBmcm9tICcuLi8uLi91dGlsL2Fzc2VydCc7XG5pbXBvcnQge2dsb2JhbH0gZnJvbSAnLi4vLi4vdXRpbC9nbG9iYWwnO1xuaW1wb3J0IHtnZXRDb21wb25lbnQsIGdldENvbnRleHQsIGdldERlYnVnTm9kZSwgZ2V0RGlyZWN0aXZlcywgZ2V0SG9zdEVsZW1lbnQsIGdldEluamVjdG9yLCBnZXRMaXN0ZW5lcnMsIGdldFJvb3RDb21wb25lbnRzLCBnZXRWaWV3Q29tcG9uZW50LCBtYXJrRGlydHl9IGZyb20gJy4uL2dsb2JhbF91dGlsc19hcGknO1xuXG5cblxuLyoqXG4gKiBUaGlzIGZpbGUgaW50cm9kdWNlcyBzZXJpZXMgb2YgZ2xvYmFsbHkgYWNjZXNzaWJsZSBkZWJ1ZyB0b29sc1xuICogdG8gYWxsb3cgZm9yIHRoZSBBbmd1bGFyIGRlYnVnZ2luZyBzdG9yeSB0byBmdW5jdGlvbi5cbiAqXG4gKiBUbyBzZWUgdGhpcyBpbiBhY3Rpb24gcnVuIHRoZSBmb2xsb3dpbmcgY29tbWFuZDpcbiAqXG4gKiAgIGJhemVsIHJ1biAtLWNvbmZpZz1pdnlcbiAqICAgLy9wYWNrYWdlcy9jb3JlL3Rlc3QvYnVuZGxpbmcvdG9kbzpkZXZzZXJ2ZXJcbiAqXG4gKiAgVGhlbiBsb2FkIGBsb2NhbGhvc3Q6NTQzMmAgYW5kIHN0YXJ0IHVzaW5nIHRoZSBjb25zb2xlIHRvb2xzLlxuICovXG5cbi8qKlxuICogVGhpcyB2YWx1ZSByZWZsZWN0cyB0aGUgcHJvcGVydHkgb24gdGhlIHdpbmRvdyB3aGVyZSB0aGUgZGV2XG4gKiB0b29scyBhcmUgcGF0Y2hlZCAod2luZG93Lm5nKS5cbiAqICovXG5leHBvcnQgY29uc3QgR0xPQkFMX1BVQkxJU0hfRVhQQU5ET19LRVkgPSAnbmcnO1xuXG5sZXQgX3B1Ymxpc2hlZCA9IGZhbHNlO1xuLyoqXG4gKiBQdWJsaXNoZXMgYSBjb2xsZWN0aW9uIG9mIGRlZmF1bHQgZGVidWcgdG9vbHMgb250b2B3aW5kb3cubmdgLlxuICpcbiAqIFRoZXNlIGZ1bmN0aW9ucyBhcmUgYXZhaWxhYmxlIGdsb2JhbGx5IHdoZW4gQW5ndWxhciBpcyBpbiBkZXZlbG9wbWVudFxuICogbW9kZSBhbmQgYXJlIGF1dG9tYXRpY2FsbHkgc3RyaXBwZWQgYXdheSBmcm9tIHByb2QgbW9kZSBpcyBvbi5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHB1Ymxpc2hEZWZhdWx0R2xvYmFsVXRpbHMoKSB7XG4gIGlmICghX3B1Ymxpc2hlZCkge1xuICAgIF9wdWJsaXNoZWQgPSB0cnVlO1xuICAgIHB1Ymxpc2hHbG9iYWxVdGlsKCdnZXRDb21wb25lbnQnLCBnZXRDb21wb25lbnQpO1xuICAgIHB1Ymxpc2hHbG9iYWxVdGlsKCdnZXRDb250ZXh0JywgZ2V0Q29udGV4dCk7XG4gICAgcHVibGlzaEdsb2JhbFV0aWwoJ2dldExpc3RlbmVycycsIGdldExpc3RlbmVycyk7XG4gICAgcHVibGlzaEdsb2JhbFV0aWwoJ2dldFZpZXdDb21wb25lbnQnLCBnZXRWaWV3Q29tcG9uZW50KTtcbiAgICBwdWJsaXNoR2xvYmFsVXRpbCgnZ2V0SG9zdEVsZW1lbnQnLCBnZXRIb3N0RWxlbWVudCk7XG4gICAgcHVibGlzaEdsb2JhbFV0aWwoJ2dldEluamVjdG9yJywgZ2V0SW5qZWN0b3IpO1xuICAgIHB1Ymxpc2hHbG9iYWxVdGlsKCdnZXRSb290Q29tcG9uZW50cycsIGdldFJvb3RDb21wb25lbnRzKTtcbiAgICBwdWJsaXNoR2xvYmFsVXRpbCgnZ2V0RGlyZWN0aXZlcycsIGdldERpcmVjdGl2ZXMpO1xuICAgIHB1Ymxpc2hHbG9iYWxVdGlsKCdnZXREZWJ1Z05vZGUnLCBnZXREZWJ1Z05vZGUpO1xuICAgIHB1Ymxpc2hHbG9iYWxVdGlsKCdtYXJrRGlydHknLCBtYXJrRGlydHkpO1xuICB9XG59XG5cbmV4cG9ydCBkZWNsYXJlIHR5cGUgR2xvYmFsRGV2TW9kZUNvbnRhaW5lciA9IHtcbiAgW0dMT0JBTF9QVUJMSVNIX0VYUEFORE9fS0VZXToge1tmbk5hbWU6IHN0cmluZ106IEZ1bmN0aW9ufTtcbn07XG5cbi8qKlxuICogUHVibGlzaGVzIHRoZSBnaXZlbiBmdW5jdGlvbiB0byBgd2luZG93Lm5nYCBzbyB0aGF0IGl0IGNhbiBiZVxuICogdXNlZCBmcm9tIHRoZSBicm93c2VyIGNvbnNvbGUgd2hlbiBhbiBhcHBsaWNhdGlvbiBpcyBub3QgaW4gcHJvZHVjdGlvbi5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHB1Ymxpc2hHbG9iYWxVdGlsKG5hbWU6IHN0cmluZywgZm46IEZ1bmN0aW9uKTogdm9pZCB7XG4gIGlmICh0eXBlb2YgQ09NUElMRUQgPT09ICd1bmRlZmluZWQnIHx8ICFDT01QSUxFRCkge1xuICAgIC8vIE5vdGU6IHdlIGNhbid0IGV4cG9ydCBgbmdgIHdoZW4gdXNpbmcgY2xvc3VyZSBlbmhhbmNlZCBvcHRpbWl6YXRpb24gYXM6XG4gICAgLy8gLSBjbG9zdXJlIGRlY2xhcmVzIGdsb2JhbHMgaXRzZWxmIGZvciBtaW5pZmllZCBuYW1lcywgd2hpY2ggc29tZXRpbWVzIGNsb2JiZXIgb3VyIGBuZ2AgZ2xvYmFsXG4gICAgLy8gLSB3ZSBjYW4ndCBkZWNsYXJlIGEgY2xvc3VyZSBleHRlcm4gYXMgdGhlIG5hbWVzcGFjZSBgbmdgIGlzIGFscmVhZHkgdXNlZCB3aXRoaW4gR29vZ2xlXG4gICAgLy8gICBmb3IgdHlwaW5ncyBmb3IgQW5ndWxhckpTICh2aWEgYGdvb2cucHJvdmlkZSgnbmcuLi4uJylgKS5cbiAgICBjb25zdCB3ID0gZ2xvYmFsIGFzIGFueSBhcyBHbG9iYWxEZXZNb2RlQ29udGFpbmVyO1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKGZuLCAnZnVuY3Rpb24gbm90IGRlZmluZWQnKTtcbiAgICBpZiAodykge1xuICAgICAgbGV0IGNvbnRhaW5lciA9IHdbR0xPQkFMX1BVQkxJU0hfRVhQQU5ET19LRVldO1xuICAgICAgaWYgKCFjb250YWluZXIpIHtcbiAgICAgICAgY29udGFpbmVyID0gd1tHTE9CQUxfUFVCTElTSF9FWFBBTkRPX0tFWV0gPSB7fTtcbiAgICAgIH1cbiAgICAgIGNvbnRhaW5lcltuYW1lXSA9IGZuO1xuICAgIH1cbiAgfVxufVxuIl19