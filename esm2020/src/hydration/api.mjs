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
import { IS_HYDRATION_FEATURE_ENABLED, PRESERVE_HOST_CONTENT } from './tokens';
import { enableRetrieveHydrationInfoImpl } from './utils';
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBpLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvaHlkcmF0aW9uL2FwaS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsV0FBVyxFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDbEQsT0FBTyxFQUFDLHVCQUF1QixFQUF3Qix3QkFBd0IsRUFBQyxNQUFNLE9BQU8sQ0FBQztBQUM5RixPQUFPLEVBQUMsTUFBTSxFQUFDLE1BQU0sOEJBQThCLENBQUM7QUFFcEQsT0FBTyxFQUFDLDRCQUE0QixFQUFFLHFCQUFxQixFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQzdFLE9BQU8sRUFBQywrQkFBK0IsRUFBQyxNQUFNLFNBQVMsQ0FBQztBQUd4RDs7O0dBR0c7QUFDSCxJQUFJLHlCQUF5QixHQUFHLEtBQUssQ0FBQztBQUV0Qzs7Ozs7Ozs7OztHQVVHO0FBQ0gsU0FBUyw2QkFBNkI7SUFDcEMsSUFBSSxDQUFDLHlCQUF5QixFQUFFO1FBQzlCLHlCQUF5QixHQUFHLElBQUksQ0FBQztRQUNqQywrQkFBK0IsRUFBRSxDQUFDO0tBQ25DO0FBQ0gsQ0FBQztBQUVEOzs7O0dBSUc7QUFDSCxTQUFTLFNBQVM7SUFDaEIsT0FBTyxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssU0FBUyxDQUFDO0FBQzNDLENBQUM7QUFFRDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0F5Q0c7QUFDSCxNQUFNLFVBQVUsdUJBQXVCO0lBQ3JDLE9BQU8sd0JBQXdCLENBQUM7UUFDOUI7WUFDRSxPQUFPLEVBQUUsdUJBQXVCO1lBQ2hDLFFBQVEsRUFBRSxHQUFHLEVBQUU7Z0JBQ2IsNkRBQTZEO2dCQUM3RCw2REFBNkQ7Z0JBQzdELDhEQUE4RDtnQkFDOUQsZ0VBQWdFO2dCQUNoRSxTQUFTO2dCQUNULElBQUksU0FBUyxFQUFFLEVBQUU7b0JBQ2YsNkJBQTZCLEVBQUUsQ0FBQztpQkFDakM7WUFDSCxDQUFDO1lBQ0QsS0FBSyxFQUFFLElBQUk7U0FDWjtRQUNEO1lBQ0UsT0FBTyxFQUFFLDRCQUE0QjtZQUNyQyxRQUFRLEVBQUUsSUFBSTtTQUNmO1FBQ0Q7WUFDRSxPQUFPLEVBQUUscUJBQXFCO1lBQzlCLGtEQUFrRDtZQUNsRCx1REFBdUQ7WUFDdkQsdURBQXVEO1lBQ3ZELFVBQVUsRUFBRSxHQUFHLEVBQUUsQ0FBQyxTQUFTLEVBQUU7U0FDOUI7S0FDRixDQUFDLENBQUM7QUFDTCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7UExBVEZPUk1fSUR9IGZyb20gJy4uL2FwcGxpY2F0aW9uX3Rva2Vucyc7XG5pbXBvcnQge0VOVklST05NRU5UX0lOSVRJQUxJWkVSLCBFbnZpcm9ubWVudFByb3ZpZGVycywgbWFrZUVudmlyb25tZW50UHJvdmlkZXJzfSBmcm9tICcuLi9kaSc7XG5pbXBvcnQge2luamVjdH0gZnJvbSAnLi4vZGkvaW5qZWN0b3JfY29tcGF0aWJpbGl0eSc7XG5cbmltcG9ydCB7SVNfSFlEUkFUSU9OX0ZFQVRVUkVfRU5BQkxFRCwgUFJFU0VSVkVfSE9TVF9DT05URU5UfSBmcm9tICcuL3Rva2Vucyc7XG5pbXBvcnQge2VuYWJsZVJldHJpZXZlSHlkcmF0aW9uSW5mb0ltcGx9IGZyb20gJy4vdXRpbHMnO1xuXG5cbi8qKlxuICogSW5kaWNhdGVzIHdoZXRoZXIgdGhlIGh5ZHJhdGlvbi1yZWxhdGVkIGNvZGUgd2FzIGFkZGVkLFxuICogcHJldmVudHMgYWRkaW5nIGl0IG11bHRpcGxlIHRpbWVzLlxuICovXG5sZXQgaXNIeWRyYXRpb25TdXBwb3J0RW5hYmxlZCA9IGZhbHNlO1xuXG4vKipcbiAqIEJyaW5ncyB0aGUgbmVjZXNzYXJ5IGh5ZHJhdGlvbiBjb2RlIGluIHRyZWUtc2hha2FibGUgbWFubmVyLlxuICogVGhlIGNvZGUgaXMgb25seSBwcmVzZW50IHdoZW4gdGhlIGBwcm92aWRlSHlkcmF0aW9uU3VwcG9ydGAgaXNcbiAqIGludm9rZWQuIE90aGVyd2lzZSwgdGhpcyBjb2RlIGlzIHRyZWUtc2hha2VuIGF3YXkgZHVyaW5nIHRoZVxuICogYnVpbGQgb3B0aW1pemF0aW9uIHN0ZXAuXG4gKlxuICogVGhpcyB0ZWNobmlxdWUgYWxsb3dzIHVzIHRvIHN3YXAgaW1wbGVtZW50YXRpb25zIG9mIG1ldGhvZHMgc29cbiAqIHRyZWUgc2hha2luZyB3b3JrcyBhcHByb3ByaWF0ZWx5IHdoZW4gaHlkcmF0aW9uIGlzIGRpc2FibGVkIG9yXG4gKiBlbmFibGVkLiBJdCBicmluZ3MgaW4gdGhlIGFwcHJvcHJpYXRlIHZlcnNpb24gb2YgdGhlIG1ldGhvZCB0aGF0XG4gKiBzdXBwb3J0cyBoeWRyYXRpb24gb25seSB3aGVuIGVuYWJsZWQuXG4gKi9cbmZ1bmN0aW9uIGVuYWJsZUh5ZHJhdGlvblJ1bnRpbWVTdXBwb3J0KCkge1xuICBpZiAoIWlzSHlkcmF0aW9uU3VwcG9ydEVuYWJsZWQpIHtcbiAgICBpc0h5ZHJhdGlvblN1cHBvcnRFbmFibGVkID0gdHJ1ZTtcbiAgICBlbmFibGVSZXRyaWV2ZUh5ZHJhdGlvbkluZm9JbXBsKCk7XG4gIH1cbn1cblxuLyoqXG4gKiBEZXRlY3RzIHdoZXRoZXIgdGhlIGNvZGUgaXMgaW52b2tlZCBpbiBhIGJyb3dzZXIuXG4gKiBMYXRlciBvbiwgdGhpcyBjaGVjayBzaG91bGQgYmUgcmVwbGFjZWQgd2l0aCBhIHRyZWUtc2hha2FibGVcbiAqIGZsYWcgKGUuZy4gYCFpc1NlcnZlcmApLlxuICovXG5mdW5jdGlvbiBpc0Jyb3dzZXIoKTogYm9vbGVhbiB7XG4gIHJldHVybiBpbmplY3QoUExBVEZPUk1fSUQpID09PSAnYnJvd3Nlcic7XG59XG5cbi8qKlxuICogUmV0dXJucyBhIHNldCBvZiBwcm92aWRlcnMgcmVxdWlyZWQgdG8gc2V0dXAgaHlkcmF0aW9uIHN1cHBvcnRcbiAqIGZvciBhbiBhcHBsaWNhdGlvbiB0aGF0IGlzIHNlcnZlciBzaWRlIHJlbmRlcmVkLlxuICpcbiAqICMjIE5nTW9kdWxlLWJhc2VkIGJvb3RzdHJhcFxuICpcbiAqIFlvdSBjYW4gYWRkIHRoZSBmdW5jdGlvbiBjYWxsIHRvIHRoZSByb290IEFwcE1vZHVsZSBvZiBhbiBhcHBsaWNhdGlvbjpcbiAqIGBgYFxuICogaW1wb3J0IHtwcm92aWRlSHlkcmF0aW9uU3VwcG9ydH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG4gKlxuICogQE5nTW9kdWxlKHtcbiAqICAgcHJvdmlkZXJzOiBbXG4gKiAgICAgLy8gLi4uIG90aGVyIHByb3ZpZGVycyAuLi5cbiAqICAgICBwcm92aWRlSHlkcmF0aW9uU3VwcG9ydCgpXG4gKiAgIF0sXG4gKiAgIGRlY2xhcmF0aW9uczogW0FwcENvbXBvbmVudF0sXG4gKiAgIGJvb3RzdHJhcDogW0FwcENvbXBvbmVudF1cbiAqIH0pXG4gKiBjbGFzcyBBcHBNb2R1bGUge31cbiAqIGBgYFxuICpcbiAqICMjIFN0YW5kYWxvbmUtYmFzZWQgYm9vdHN0cmFwXG4gKlxuICogQWRkIHRoZSBmdW5jdGlvbiB0byB0aGUgYGJvb3RzdHJhcEFwcGxpY2F0aW9uYCBjYWxsOlxuICogYGBgXG4gKiBpbXBvcnQge3Byb3ZpZGVIeWRyYXRpb25TdXBwb3J0fSBmcm9tICdAYW5ndWxhci9jb3JlJztcbiAqXG4gKiBib290c3RyYXBBcHBsaWNhdGlvbihSb290Q29tcG9uZW50LCB7XG4gKiAgIHByb3ZpZGVyczogW1xuICogICAgIC8vIC4uLiBvdGhlciBwcm92aWRlcnMgLi4uXG4gKiAgICAgcHJvdmlkZUh5ZHJhdGlvblN1cHBvcnQoKVxuICogICBdXG4gKiB9KTtcbiAqIGBgYFxuICpcbiAqIFRoZSBmdW5jdGlvbiBzZXRzIHVwIGFuIGludGVybmFsIGZsYWcgdGhhdCB3b3VsZCBiZSByZWNvZ25pemVkIGR1cmluZ1xuICogdGhlIHNlcnZlciBzaWRlIHJlbmRlcmluZyB0aW1lIGFzIHdlbGwsIHNvIHRoZXJlIGlzIG5vIG5lZWQgdG9cbiAqIGNvbmZpZ3VyZSBvciBjaGFuZ2UgYW55dGhpbmcgaW4gTmdVbml2ZXJzYWwgdG8gZW5hYmxlIHRoZSBmZWF0dXJlLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqIEBkZXZlbG9wZXJQcmV2aWV3XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwcm92aWRlSHlkcmF0aW9uU3VwcG9ydCgpOiBFbnZpcm9ubWVudFByb3ZpZGVycyB7XG4gIHJldHVybiBtYWtlRW52aXJvbm1lbnRQcm92aWRlcnMoW1xuICAgIHtcbiAgICAgIHByb3ZpZGU6IEVOVklST05NRU5UX0lOSVRJQUxJWkVSLFxuICAgICAgdXNlVmFsdWU6ICgpID0+IHtcbiAgICAgICAgLy8gU2luY2UgdGhpcyBmdW5jdGlvbiBpcyB1c2VkIGFjcm9zcyBib3RoIHNlcnZlciBhbmQgY2xpZW50LFxuICAgICAgICAvLyBtYWtlIHN1cmUgdGhhdCB0aGUgcnVudGltZSBjb2RlIGlzIG9ubHkgYWRkZWQgd2hlbiBpbnZva2VkXG4gICAgICAgIC8vIG9uIHRoZSBjbGllbnQuIE1vdmluZyBmb3J3YXJkLCB0aGUgYGlzQnJvd3NlcmAgY2hlY2sgc2hvdWxkXG4gICAgICAgIC8vIGJlIHJlcGxhY2VkIHdpdGggYSB0cmVlLXNoYWthYmxlIGFsdGVybmF0aXZlIChlLmcuIGBpc1NlcnZlcmBcbiAgICAgICAgLy8gZmxhZykuXG4gICAgICAgIGlmIChpc0Jyb3dzZXIoKSkge1xuICAgICAgICAgIGVuYWJsZUh5ZHJhdGlvblJ1bnRpbWVTdXBwb3J0KCk7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBtdWx0aTogdHJ1ZSxcbiAgICB9LFxuICAgIHtcbiAgICAgIHByb3ZpZGU6IElTX0hZRFJBVElPTl9GRUFUVVJFX0VOQUJMRUQsXG4gICAgICB1c2VWYWx1ZTogdHJ1ZSxcbiAgICB9LFxuICAgIHtcbiAgICAgIHByb3ZpZGU6IFBSRVNFUlZFX0hPU1RfQ09OVEVOVCxcbiAgICAgIC8vIFByZXNlcnZlIGhvc3QgZWxlbWVudCBjb250ZW50IG9ubHkgaW4gYSBicm93c2VyXG4gICAgICAvLyBlbnZpcm9ubWVudC4gT24gYSBzZXJ2ZXIsIGFuIGFwcGxpY2F0aW9uIGlzIHJlbmRlcmVkXG4gICAgICAvLyBmcm9tIHNjcmF0Y2gsIHNvIHRoZSBob3N0IGNvbnRlbnQgbmVlZHMgdG8gYmUgZW1wdHkuXG4gICAgICB1c2VGYWN0b3J5OiAoKSA9PiBpc0Jyb3dzZXIoKSxcbiAgICB9XG4gIF0pO1xufVxuIl19