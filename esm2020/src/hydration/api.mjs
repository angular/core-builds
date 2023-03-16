/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { PLATFORM_ID } from '../application_tokens';
import { ENVIRONMENT_INITIALIZER, makeEnvironmentProviders } from '../di';
import { inject } from '../di/injector_compatibility';
import { enableLocateOrCreateContainerRefImpl } from '../linker/view_container_ref';
import { enableLocateOrCreateElementNodeImpl } from '../render3/instructions/element';
import { enableLocateOrCreateElementContainerNodeImpl } from '../render3/instructions/element_container';
import { enableApplyRootElementTransformImpl } from '../render3/instructions/shared';
import { enableLocateOrCreateContainerAnchorImpl } from '../render3/instructions/template';
import { enableLocateOrCreateTextNodeImpl } from '../render3/instructions/text';
import { IS_HYDRATION_FEATURE_ENABLED, PRESERVE_HOST_CONTENT } from './tokens';
import { enableRetrieveHydrationInfoImpl } from './utils';
import { enableFindMatchingDehydratedViewImpl } from './views';
/**
 * Indicates whether the hydration-related code was added,
 * prevents adding it multiple times.
 */
let isHydrationSupportEnabled = false;
/**
 * Brings the necessary hydration code in tree-shakable manner.
 * The code is only present when the `provideHydrationSupport` is
 * invoked. Otherwise, this code is tree-shaken away during the
 * build optimization step.
 *
 * This technique allows us to swap implementations of methods so
 * tree shaking works appropriately when hydration is disabled or
 * enabled. It brings in the appropriate version of the method that
 * supports hydration only when enabled.
 */
function enableHydrationRuntimeSupport() {
    if (!isHydrationSupportEnabled) {
        isHydrationSupportEnabled = true;
        enableRetrieveHydrationInfoImpl();
        enableLocateOrCreateElementNodeImpl();
        enableLocateOrCreateTextNodeImpl();
        enableLocateOrCreateElementContainerNodeImpl();
        enableLocateOrCreateContainerAnchorImpl();
        enableLocateOrCreateContainerRefImpl();
        enableFindMatchingDehydratedViewImpl();
        enableApplyRootElementTransformImpl();
    }
}
/**
 * Detects whether the code is invoked in a browser.
 * Later on, this check should be replaced with a tree-shakable
 * flag (e.g. `!isServer`).
 */
function isBrowser() {
    return inject(PLATFORM_ID) === 'browser';
}
/**
 * Returns a set of providers required to setup hydration support
 * for an application that is server side rendered.
 *
 * ## NgModule-based bootstrap
 *
 * You can add the function call to the root AppModule of an application:
 * ```
 * import {provideHydrationSupport} from '@angular/core';
 *
 * @NgModule({
 *   providers: [
 *     // ... other providers ...
 *     provideHydrationSupport()
 *   ],
 *   declarations: [AppComponent],
 *   bootstrap: [AppComponent]
 * })
 * class AppModule {}
 * ```
 *
 * ## Standalone-based bootstrap
 *
 * Add the function to the `bootstrapApplication` call:
 * ```
 * import {provideHydrationSupport} from '@angular/core';
 *
 * bootstrapApplication(RootComponent, {
 *   providers: [
 *     // ... other providers ...
 *     provideHydrationSupport()
 *   ]
 * });
 * ```
 *
 * The function sets up an internal flag that would be recognized during
 * the server side rendering time as well, so there is no need to
 * configure or change anything in NgUniversal to enable the feature.
 *
 * @publicApi
 * @developerPreview
 */
export function provideHydrationSupport() {
    return makeEnvironmentProviders([
        {
            provide: ENVIRONMENT_INITIALIZER,
            useValue: () => {
                // Since this function is used across both server and client,
                // make sure that the runtime code is only added when invoked
                // on the client. Moving forward, the `isBrowser` check should
                // be replaced with a tree-shakable alternative (e.g. `isServer`
                // flag).
                if (isBrowser()) {
                    enableHydrationRuntimeSupport();
                }
            },
            multi: true,
        },
        {
            provide: IS_HYDRATION_FEATURE_ENABLED,
            useValue: true,
        },
        {
            provide: PRESERVE_HOST_CONTENT,
            // Preserve host element content only in a browser
            // environment. On a server, an application is rendered
            // from scratch, so the host content needs to be empty.
            useFactory: () => isBrowser(),
        }
    ]);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBpLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvaHlkcmF0aW9uL2FwaS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsV0FBVyxFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDbEQsT0FBTyxFQUFDLHVCQUF1QixFQUF3Qix3QkFBd0IsRUFBQyxNQUFNLE9BQU8sQ0FBQztBQUM5RixPQUFPLEVBQUMsTUFBTSxFQUFDLE1BQU0sOEJBQThCLENBQUM7QUFDcEQsT0FBTyxFQUFDLG9DQUFvQyxFQUFDLE1BQU0sOEJBQThCLENBQUM7QUFDbEYsT0FBTyxFQUFDLG1DQUFtQyxFQUFDLE1BQU0saUNBQWlDLENBQUM7QUFDcEYsT0FBTyxFQUFDLDRDQUE0QyxFQUFDLE1BQU0sMkNBQTJDLENBQUM7QUFDdkcsT0FBTyxFQUFDLG1DQUFtQyxFQUFDLE1BQU0sZ0NBQWdDLENBQUM7QUFDbkYsT0FBTyxFQUFDLHVDQUF1QyxFQUFDLE1BQU0sa0NBQWtDLENBQUM7QUFDekYsT0FBTyxFQUFDLGdDQUFnQyxFQUFDLE1BQU0sOEJBQThCLENBQUM7QUFFOUUsT0FBTyxFQUFDLDRCQUE0QixFQUFFLHFCQUFxQixFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQzdFLE9BQU8sRUFBQywrQkFBK0IsRUFBQyxNQUFNLFNBQVMsQ0FBQztBQUN4RCxPQUFPLEVBQUMsb0NBQW9DLEVBQUMsTUFBTSxTQUFTLENBQUM7QUFHN0Q7OztHQUdHO0FBQ0gsSUFBSSx5QkFBeUIsR0FBRyxLQUFLLENBQUM7QUFFdEM7Ozs7Ozs7Ozs7R0FVRztBQUNILFNBQVMsNkJBQTZCO0lBQ3BDLElBQUksQ0FBQyx5QkFBeUIsRUFBRTtRQUM5Qix5QkFBeUIsR0FBRyxJQUFJLENBQUM7UUFDakMsK0JBQStCLEVBQUUsQ0FBQztRQUNsQyxtQ0FBbUMsRUFBRSxDQUFDO1FBQ3RDLGdDQUFnQyxFQUFFLENBQUM7UUFDbkMsNENBQTRDLEVBQUUsQ0FBQztRQUMvQyx1Q0FBdUMsRUFBRSxDQUFDO1FBQzFDLG9DQUFvQyxFQUFFLENBQUM7UUFDdkMsb0NBQW9DLEVBQUUsQ0FBQztRQUN2QyxtQ0FBbUMsRUFBRSxDQUFDO0tBQ3ZDO0FBQ0gsQ0FBQztBQUVEOzs7O0dBSUc7QUFDSCxTQUFTLFNBQVM7SUFDaEIsT0FBTyxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssU0FBUyxDQUFDO0FBQzNDLENBQUM7QUFFRDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0F5Q0c7QUFDSCxNQUFNLFVBQVUsdUJBQXVCO0lBQ3JDLE9BQU8sd0JBQXdCLENBQUM7UUFDOUI7WUFDRSxPQUFPLEVBQUUsdUJBQXVCO1lBQ2hDLFFBQVEsRUFBRSxHQUFHLEVBQUU7Z0JBQ2IsNkRBQTZEO2dCQUM3RCw2REFBNkQ7Z0JBQzdELDhEQUE4RDtnQkFDOUQsZ0VBQWdFO2dCQUNoRSxTQUFTO2dCQUNULElBQUksU0FBUyxFQUFFLEVBQUU7b0JBQ2YsNkJBQTZCLEVBQUUsQ0FBQztpQkFDakM7WUFDSCxDQUFDO1lBQ0QsS0FBSyxFQUFFLElBQUk7U0FDWjtRQUNEO1lBQ0UsT0FBTyxFQUFFLDRCQUE0QjtZQUNyQyxRQUFRLEVBQUUsSUFBSTtTQUNmO1FBQ0Q7WUFDRSxPQUFPLEVBQUUscUJBQXFCO1lBQzlCLGtEQUFrRDtZQUNsRCx1REFBdUQ7WUFDdkQsdURBQXVEO1lBQ3ZELFVBQVUsRUFBRSxHQUFHLEVBQUUsQ0FBQyxTQUFTLEVBQUU7U0FDOUI7S0FDRixDQUFDLENBQUM7QUFDTCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7UExBVEZPUk1fSUR9IGZyb20gJy4uL2FwcGxpY2F0aW9uX3Rva2Vucyc7XG5pbXBvcnQge0VOVklST05NRU5UX0lOSVRJQUxJWkVSLCBFbnZpcm9ubWVudFByb3ZpZGVycywgbWFrZUVudmlyb25tZW50UHJvdmlkZXJzfSBmcm9tICcuLi9kaSc7XG5pbXBvcnQge2luamVjdH0gZnJvbSAnLi4vZGkvaW5qZWN0b3JfY29tcGF0aWJpbGl0eSc7XG5pbXBvcnQge2VuYWJsZUxvY2F0ZU9yQ3JlYXRlQ29udGFpbmVyUmVmSW1wbH0gZnJvbSAnLi4vbGlua2VyL3ZpZXdfY29udGFpbmVyX3JlZic7XG5pbXBvcnQge2VuYWJsZUxvY2F0ZU9yQ3JlYXRlRWxlbWVudE5vZGVJbXBsfSBmcm9tICcuLi9yZW5kZXIzL2luc3RydWN0aW9ucy9lbGVtZW50JztcbmltcG9ydCB7ZW5hYmxlTG9jYXRlT3JDcmVhdGVFbGVtZW50Q29udGFpbmVyTm9kZUltcGx9IGZyb20gJy4uL3JlbmRlcjMvaW5zdHJ1Y3Rpb25zL2VsZW1lbnRfY29udGFpbmVyJztcbmltcG9ydCB7ZW5hYmxlQXBwbHlSb290RWxlbWVudFRyYW5zZm9ybUltcGx9IGZyb20gJy4uL3JlbmRlcjMvaW5zdHJ1Y3Rpb25zL3NoYXJlZCc7XG5pbXBvcnQge2VuYWJsZUxvY2F0ZU9yQ3JlYXRlQ29udGFpbmVyQW5jaG9ySW1wbH0gZnJvbSAnLi4vcmVuZGVyMy9pbnN0cnVjdGlvbnMvdGVtcGxhdGUnO1xuaW1wb3J0IHtlbmFibGVMb2NhdGVPckNyZWF0ZVRleHROb2RlSW1wbH0gZnJvbSAnLi4vcmVuZGVyMy9pbnN0cnVjdGlvbnMvdGV4dCc7XG5cbmltcG9ydCB7SVNfSFlEUkFUSU9OX0ZFQVRVUkVfRU5BQkxFRCwgUFJFU0VSVkVfSE9TVF9DT05URU5UfSBmcm9tICcuL3Rva2Vucyc7XG5pbXBvcnQge2VuYWJsZVJldHJpZXZlSHlkcmF0aW9uSW5mb0ltcGx9IGZyb20gJy4vdXRpbHMnO1xuaW1wb3J0IHtlbmFibGVGaW5kTWF0Y2hpbmdEZWh5ZHJhdGVkVmlld0ltcGx9IGZyb20gJy4vdmlld3MnO1xuXG5cbi8qKlxuICogSW5kaWNhdGVzIHdoZXRoZXIgdGhlIGh5ZHJhdGlvbi1yZWxhdGVkIGNvZGUgd2FzIGFkZGVkLFxuICogcHJldmVudHMgYWRkaW5nIGl0IG11bHRpcGxlIHRpbWVzLlxuICovXG5sZXQgaXNIeWRyYXRpb25TdXBwb3J0RW5hYmxlZCA9IGZhbHNlO1xuXG4vKipcbiAqIEJyaW5ncyB0aGUgbmVjZXNzYXJ5IGh5ZHJhdGlvbiBjb2RlIGluIHRyZWUtc2hha2FibGUgbWFubmVyLlxuICogVGhlIGNvZGUgaXMgb25seSBwcmVzZW50IHdoZW4gdGhlIGBwcm92aWRlSHlkcmF0aW9uU3VwcG9ydGAgaXNcbiAqIGludm9rZWQuIE90aGVyd2lzZSwgdGhpcyBjb2RlIGlzIHRyZWUtc2hha2VuIGF3YXkgZHVyaW5nIHRoZVxuICogYnVpbGQgb3B0aW1pemF0aW9uIHN0ZXAuXG4gKlxuICogVGhpcyB0ZWNobmlxdWUgYWxsb3dzIHVzIHRvIHN3YXAgaW1wbGVtZW50YXRpb25zIG9mIG1ldGhvZHMgc29cbiAqIHRyZWUgc2hha2luZyB3b3JrcyBhcHByb3ByaWF0ZWx5IHdoZW4gaHlkcmF0aW9uIGlzIGRpc2FibGVkIG9yXG4gKiBlbmFibGVkLiBJdCBicmluZ3MgaW4gdGhlIGFwcHJvcHJpYXRlIHZlcnNpb24gb2YgdGhlIG1ldGhvZCB0aGF0XG4gKiBzdXBwb3J0cyBoeWRyYXRpb24gb25seSB3aGVuIGVuYWJsZWQuXG4gKi9cbmZ1bmN0aW9uIGVuYWJsZUh5ZHJhdGlvblJ1bnRpbWVTdXBwb3J0KCkge1xuICBpZiAoIWlzSHlkcmF0aW9uU3VwcG9ydEVuYWJsZWQpIHtcbiAgICBpc0h5ZHJhdGlvblN1cHBvcnRFbmFibGVkID0gdHJ1ZTtcbiAgICBlbmFibGVSZXRyaWV2ZUh5ZHJhdGlvbkluZm9JbXBsKCk7XG4gICAgZW5hYmxlTG9jYXRlT3JDcmVhdGVFbGVtZW50Tm9kZUltcGwoKTtcbiAgICBlbmFibGVMb2NhdGVPckNyZWF0ZVRleHROb2RlSW1wbCgpO1xuICAgIGVuYWJsZUxvY2F0ZU9yQ3JlYXRlRWxlbWVudENvbnRhaW5lck5vZGVJbXBsKCk7XG4gICAgZW5hYmxlTG9jYXRlT3JDcmVhdGVDb250YWluZXJBbmNob3JJbXBsKCk7XG4gICAgZW5hYmxlTG9jYXRlT3JDcmVhdGVDb250YWluZXJSZWZJbXBsKCk7XG4gICAgZW5hYmxlRmluZE1hdGNoaW5nRGVoeWRyYXRlZFZpZXdJbXBsKCk7XG4gICAgZW5hYmxlQXBwbHlSb290RWxlbWVudFRyYW5zZm9ybUltcGwoKTtcbiAgfVxufVxuXG4vKipcbiAqIERldGVjdHMgd2hldGhlciB0aGUgY29kZSBpcyBpbnZva2VkIGluIGEgYnJvd3Nlci5cbiAqIExhdGVyIG9uLCB0aGlzIGNoZWNrIHNob3VsZCBiZSByZXBsYWNlZCB3aXRoIGEgdHJlZS1zaGFrYWJsZVxuICogZmxhZyAoZS5nLiBgIWlzU2VydmVyYCkuXG4gKi9cbmZ1bmN0aW9uIGlzQnJvd3NlcigpOiBib29sZWFuIHtcbiAgcmV0dXJuIGluamVjdChQTEFURk9STV9JRCkgPT09ICdicm93c2VyJztcbn1cblxuLyoqXG4gKiBSZXR1cm5zIGEgc2V0IG9mIHByb3ZpZGVycyByZXF1aXJlZCB0byBzZXR1cCBoeWRyYXRpb24gc3VwcG9ydFxuICogZm9yIGFuIGFwcGxpY2F0aW9uIHRoYXQgaXMgc2VydmVyIHNpZGUgcmVuZGVyZWQuXG4gKlxuICogIyMgTmdNb2R1bGUtYmFzZWQgYm9vdHN0cmFwXG4gKlxuICogWW91IGNhbiBhZGQgdGhlIGZ1bmN0aW9uIGNhbGwgdG8gdGhlIHJvb3QgQXBwTW9kdWxlIG9mIGFuIGFwcGxpY2F0aW9uOlxuICogYGBgXG4gKiBpbXBvcnQge3Byb3ZpZGVIeWRyYXRpb25TdXBwb3J0fSBmcm9tICdAYW5ndWxhci9jb3JlJztcbiAqXG4gKiBATmdNb2R1bGUoe1xuICogICBwcm92aWRlcnM6IFtcbiAqICAgICAvLyAuLi4gb3RoZXIgcHJvdmlkZXJzIC4uLlxuICogICAgIHByb3ZpZGVIeWRyYXRpb25TdXBwb3J0KClcbiAqICAgXSxcbiAqICAgZGVjbGFyYXRpb25zOiBbQXBwQ29tcG9uZW50XSxcbiAqICAgYm9vdHN0cmFwOiBbQXBwQ29tcG9uZW50XVxuICogfSlcbiAqIGNsYXNzIEFwcE1vZHVsZSB7fVxuICogYGBgXG4gKlxuICogIyMgU3RhbmRhbG9uZS1iYXNlZCBib290c3RyYXBcbiAqXG4gKiBBZGQgdGhlIGZ1bmN0aW9uIHRvIHRoZSBgYm9vdHN0cmFwQXBwbGljYXRpb25gIGNhbGw6XG4gKiBgYGBcbiAqIGltcG9ydCB7cHJvdmlkZUh5ZHJhdGlvblN1cHBvcnR9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuICpcbiAqIGJvb3RzdHJhcEFwcGxpY2F0aW9uKFJvb3RDb21wb25lbnQsIHtcbiAqICAgcHJvdmlkZXJzOiBbXG4gKiAgICAgLy8gLi4uIG90aGVyIHByb3ZpZGVycyAuLi5cbiAqICAgICBwcm92aWRlSHlkcmF0aW9uU3VwcG9ydCgpXG4gKiAgIF1cbiAqIH0pO1xuICogYGBgXG4gKlxuICogVGhlIGZ1bmN0aW9uIHNldHMgdXAgYW4gaW50ZXJuYWwgZmxhZyB0aGF0IHdvdWxkIGJlIHJlY29nbml6ZWQgZHVyaW5nXG4gKiB0aGUgc2VydmVyIHNpZGUgcmVuZGVyaW5nIHRpbWUgYXMgd2VsbCwgc28gdGhlcmUgaXMgbm8gbmVlZCB0b1xuICogY29uZmlndXJlIG9yIGNoYW5nZSBhbnl0aGluZyBpbiBOZ1VuaXZlcnNhbCB0byBlbmFibGUgdGhlIGZlYXR1cmUuXG4gKlxuICogQHB1YmxpY0FwaVxuICogQGRldmVsb3BlclByZXZpZXdcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHByb3ZpZGVIeWRyYXRpb25TdXBwb3J0KCk6IEVudmlyb25tZW50UHJvdmlkZXJzIHtcbiAgcmV0dXJuIG1ha2VFbnZpcm9ubWVudFByb3ZpZGVycyhbXG4gICAge1xuICAgICAgcHJvdmlkZTogRU5WSVJPTk1FTlRfSU5JVElBTElaRVIsXG4gICAgICB1c2VWYWx1ZTogKCkgPT4ge1xuICAgICAgICAvLyBTaW5jZSB0aGlzIGZ1bmN0aW9uIGlzIHVzZWQgYWNyb3NzIGJvdGggc2VydmVyIGFuZCBjbGllbnQsXG4gICAgICAgIC8vIG1ha2Ugc3VyZSB0aGF0IHRoZSBydW50aW1lIGNvZGUgaXMgb25seSBhZGRlZCB3aGVuIGludm9rZWRcbiAgICAgICAgLy8gb24gdGhlIGNsaWVudC4gTW92aW5nIGZvcndhcmQsIHRoZSBgaXNCcm93c2VyYCBjaGVjayBzaG91bGRcbiAgICAgICAgLy8gYmUgcmVwbGFjZWQgd2l0aCBhIHRyZWUtc2hha2FibGUgYWx0ZXJuYXRpdmUgKGUuZy4gYGlzU2VydmVyYFxuICAgICAgICAvLyBmbGFnKS5cbiAgICAgICAgaWYgKGlzQnJvd3NlcigpKSB7XG4gICAgICAgICAgZW5hYmxlSHlkcmF0aW9uUnVudGltZVN1cHBvcnQoKTtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIG11bHRpOiB0cnVlLFxuICAgIH0sXG4gICAge1xuICAgICAgcHJvdmlkZTogSVNfSFlEUkFUSU9OX0ZFQVRVUkVfRU5BQkxFRCxcbiAgICAgIHVzZVZhbHVlOiB0cnVlLFxuICAgIH0sXG4gICAge1xuICAgICAgcHJvdmlkZTogUFJFU0VSVkVfSE9TVF9DT05URU5ULFxuICAgICAgLy8gUHJlc2VydmUgaG9zdCBlbGVtZW50IGNvbnRlbnQgb25seSBpbiBhIGJyb3dzZXJcbiAgICAgIC8vIGVudmlyb25tZW50LiBPbiBhIHNlcnZlciwgYW4gYXBwbGljYXRpb24gaXMgcmVuZGVyZWRcbiAgICAgIC8vIGZyb20gc2NyYXRjaCwgc28gdGhlIGhvc3QgY29udGVudCBuZWVkcyB0byBiZSBlbXB0eS5cbiAgICAgIHVzZUZhY3Rvcnk6ICgpID0+IGlzQnJvd3NlcigpLFxuICAgIH1cbiAgXSk7XG59XG4iXX0=