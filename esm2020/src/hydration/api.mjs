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
import { enableLocateOrCreateElementNodeImpl } from '../render3/instructions/element';
import { enableLocateOrCreateTextNodeImpl } from '../render3/instructions/text';
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
        enableLocateOrCreateElementNodeImpl();
        enableLocateOrCreateTextNodeImpl();
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBpLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvaHlkcmF0aW9uL2FwaS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsV0FBVyxFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDbEQsT0FBTyxFQUFDLHVCQUF1QixFQUF3Qix3QkFBd0IsRUFBQyxNQUFNLE9BQU8sQ0FBQztBQUM5RixPQUFPLEVBQUMsTUFBTSxFQUFDLE1BQU0sOEJBQThCLENBQUM7QUFDcEQsT0FBTyxFQUFDLG1DQUFtQyxFQUFDLE1BQU0saUNBQWlDLENBQUM7QUFDcEYsT0FBTyxFQUFDLGdDQUFnQyxFQUFDLE1BQU0sOEJBQThCLENBQUM7QUFFOUUsT0FBTyxFQUFDLDRCQUE0QixFQUFFLHFCQUFxQixFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQzdFLE9BQU8sRUFBQywrQkFBK0IsRUFBQyxNQUFNLFNBQVMsQ0FBQztBQUd4RDs7O0dBR0c7QUFDSCxJQUFJLHlCQUF5QixHQUFHLEtBQUssQ0FBQztBQUV0Qzs7Ozs7Ozs7OztHQVVHO0FBQ0gsU0FBUyw2QkFBNkI7SUFDcEMsSUFBSSxDQUFDLHlCQUF5QixFQUFFO1FBQzlCLHlCQUF5QixHQUFHLElBQUksQ0FBQztRQUNqQywrQkFBK0IsRUFBRSxDQUFDO1FBQ2xDLG1DQUFtQyxFQUFFLENBQUM7UUFDdEMsZ0NBQWdDLEVBQUUsQ0FBQztLQUNwQztBQUNILENBQUM7QUFFRDs7OztHQUlHO0FBQ0gsU0FBUyxTQUFTO0lBQ2hCLE9BQU8sTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLFNBQVMsQ0FBQztBQUMzQyxDQUFDO0FBRUQ7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBeUNHO0FBQ0gsTUFBTSxVQUFVLHVCQUF1QjtJQUNyQyxPQUFPLHdCQUF3QixDQUFDO1FBQzlCO1lBQ0UsT0FBTyxFQUFFLHVCQUF1QjtZQUNoQyxRQUFRLEVBQUUsR0FBRyxFQUFFO2dCQUNiLDZEQUE2RDtnQkFDN0QsNkRBQTZEO2dCQUM3RCw4REFBOEQ7Z0JBQzlELGdFQUFnRTtnQkFDaEUsU0FBUztnQkFDVCxJQUFJLFNBQVMsRUFBRSxFQUFFO29CQUNmLDZCQUE2QixFQUFFLENBQUM7aUJBQ2pDO1lBQ0gsQ0FBQztZQUNELEtBQUssRUFBRSxJQUFJO1NBQ1o7UUFDRDtZQUNFLE9BQU8sRUFBRSw0QkFBNEI7WUFDckMsUUFBUSxFQUFFLElBQUk7U0FDZjtRQUNEO1lBQ0UsT0FBTyxFQUFFLHFCQUFxQjtZQUM5QixrREFBa0Q7WUFDbEQsdURBQXVEO1lBQ3ZELHVEQUF1RDtZQUN2RCxVQUFVLEVBQUUsR0FBRyxFQUFFLENBQUMsU0FBUyxFQUFFO1NBQzlCO0tBQ0YsQ0FBQyxDQUFDO0FBQ0wsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1BMQVRGT1JNX0lEfSBmcm9tICcuLi9hcHBsaWNhdGlvbl90b2tlbnMnO1xuaW1wb3J0IHtFTlZJUk9OTUVOVF9JTklUSUFMSVpFUiwgRW52aXJvbm1lbnRQcm92aWRlcnMsIG1ha2VFbnZpcm9ubWVudFByb3ZpZGVyc30gZnJvbSAnLi4vZGknO1xuaW1wb3J0IHtpbmplY3R9IGZyb20gJy4uL2RpL2luamVjdG9yX2NvbXBhdGliaWxpdHknO1xuaW1wb3J0IHtlbmFibGVMb2NhdGVPckNyZWF0ZUVsZW1lbnROb2RlSW1wbH0gZnJvbSAnLi4vcmVuZGVyMy9pbnN0cnVjdGlvbnMvZWxlbWVudCc7XG5pbXBvcnQge2VuYWJsZUxvY2F0ZU9yQ3JlYXRlVGV4dE5vZGVJbXBsfSBmcm9tICcuLi9yZW5kZXIzL2luc3RydWN0aW9ucy90ZXh0JztcblxuaW1wb3J0IHtJU19IWURSQVRJT05fRkVBVFVSRV9FTkFCTEVELCBQUkVTRVJWRV9IT1NUX0NPTlRFTlR9IGZyb20gJy4vdG9rZW5zJztcbmltcG9ydCB7ZW5hYmxlUmV0cmlldmVIeWRyYXRpb25JbmZvSW1wbH0gZnJvbSAnLi91dGlscyc7XG5cblxuLyoqXG4gKiBJbmRpY2F0ZXMgd2hldGhlciB0aGUgaHlkcmF0aW9uLXJlbGF0ZWQgY29kZSB3YXMgYWRkZWQsXG4gKiBwcmV2ZW50cyBhZGRpbmcgaXQgbXVsdGlwbGUgdGltZXMuXG4gKi9cbmxldCBpc0h5ZHJhdGlvblN1cHBvcnRFbmFibGVkID0gZmFsc2U7XG5cbi8qKlxuICogQnJpbmdzIHRoZSBuZWNlc3NhcnkgaHlkcmF0aW9uIGNvZGUgaW4gdHJlZS1zaGFrYWJsZSBtYW5uZXIuXG4gKiBUaGUgY29kZSBpcyBvbmx5IHByZXNlbnQgd2hlbiB0aGUgYHByb3ZpZGVIeWRyYXRpb25TdXBwb3J0YCBpc1xuICogaW52b2tlZC4gT3RoZXJ3aXNlLCB0aGlzIGNvZGUgaXMgdHJlZS1zaGFrZW4gYXdheSBkdXJpbmcgdGhlXG4gKiBidWlsZCBvcHRpbWl6YXRpb24gc3RlcC5cbiAqXG4gKiBUaGlzIHRlY2huaXF1ZSBhbGxvd3MgdXMgdG8gc3dhcCBpbXBsZW1lbnRhdGlvbnMgb2YgbWV0aG9kcyBzb1xuICogdHJlZSBzaGFraW5nIHdvcmtzIGFwcHJvcHJpYXRlbHkgd2hlbiBoeWRyYXRpb24gaXMgZGlzYWJsZWQgb3JcbiAqIGVuYWJsZWQuIEl0IGJyaW5ncyBpbiB0aGUgYXBwcm9wcmlhdGUgdmVyc2lvbiBvZiB0aGUgbWV0aG9kIHRoYXRcbiAqIHN1cHBvcnRzIGh5ZHJhdGlvbiBvbmx5IHdoZW4gZW5hYmxlZC5cbiAqL1xuZnVuY3Rpb24gZW5hYmxlSHlkcmF0aW9uUnVudGltZVN1cHBvcnQoKSB7XG4gIGlmICghaXNIeWRyYXRpb25TdXBwb3J0RW5hYmxlZCkge1xuICAgIGlzSHlkcmF0aW9uU3VwcG9ydEVuYWJsZWQgPSB0cnVlO1xuICAgIGVuYWJsZVJldHJpZXZlSHlkcmF0aW9uSW5mb0ltcGwoKTtcbiAgICBlbmFibGVMb2NhdGVPckNyZWF0ZUVsZW1lbnROb2RlSW1wbCgpO1xuICAgIGVuYWJsZUxvY2F0ZU9yQ3JlYXRlVGV4dE5vZGVJbXBsKCk7XG4gIH1cbn1cblxuLyoqXG4gKiBEZXRlY3RzIHdoZXRoZXIgdGhlIGNvZGUgaXMgaW52b2tlZCBpbiBhIGJyb3dzZXIuXG4gKiBMYXRlciBvbiwgdGhpcyBjaGVjayBzaG91bGQgYmUgcmVwbGFjZWQgd2l0aCBhIHRyZWUtc2hha2FibGVcbiAqIGZsYWcgKGUuZy4gYCFpc1NlcnZlcmApLlxuICovXG5mdW5jdGlvbiBpc0Jyb3dzZXIoKTogYm9vbGVhbiB7XG4gIHJldHVybiBpbmplY3QoUExBVEZPUk1fSUQpID09PSAnYnJvd3Nlcic7XG59XG5cbi8qKlxuICogUmV0dXJucyBhIHNldCBvZiBwcm92aWRlcnMgcmVxdWlyZWQgdG8gc2V0dXAgaHlkcmF0aW9uIHN1cHBvcnRcbiAqIGZvciBhbiBhcHBsaWNhdGlvbiB0aGF0IGlzIHNlcnZlciBzaWRlIHJlbmRlcmVkLlxuICpcbiAqICMjIE5nTW9kdWxlLWJhc2VkIGJvb3RzdHJhcFxuICpcbiAqIFlvdSBjYW4gYWRkIHRoZSBmdW5jdGlvbiBjYWxsIHRvIHRoZSByb290IEFwcE1vZHVsZSBvZiBhbiBhcHBsaWNhdGlvbjpcbiAqIGBgYFxuICogaW1wb3J0IHtwcm92aWRlSHlkcmF0aW9uU3VwcG9ydH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG4gKlxuICogQE5nTW9kdWxlKHtcbiAqICAgcHJvdmlkZXJzOiBbXG4gKiAgICAgLy8gLi4uIG90aGVyIHByb3ZpZGVycyAuLi5cbiAqICAgICBwcm92aWRlSHlkcmF0aW9uU3VwcG9ydCgpXG4gKiAgIF0sXG4gKiAgIGRlY2xhcmF0aW9uczogW0FwcENvbXBvbmVudF0sXG4gKiAgIGJvb3RzdHJhcDogW0FwcENvbXBvbmVudF1cbiAqIH0pXG4gKiBjbGFzcyBBcHBNb2R1bGUge31cbiAqIGBgYFxuICpcbiAqICMjIFN0YW5kYWxvbmUtYmFzZWQgYm9vdHN0cmFwXG4gKlxuICogQWRkIHRoZSBmdW5jdGlvbiB0byB0aGUgYGJvb3RzdHJhcEFwcGxpY2F0aW9uYCBjYWxsOlxuICogYGBgXG4gKiBpbXBvcnQge3Byb3ZpZGVIeWRyYXRpb25TdXBwb3J0fSBmcm9tICdAYW5ndWxhci9jb3JlJztcbiAqXG4gKiBib290c3RyYXBBcHBsaWNhdGlvbihSb290Q29tcG9uZW50LCB7XG4gKiAgIHByb3ZpZGVyczogW1xuICogICAgIC8vIC4uLiBvdGhlciBwcm92aWRlcnMgLi4uXG4gKiAgICAgcHJvdmlkZUh5ZHJhdGlvblN1cHBvcnQoKVxuICogICBdXG4gKiB9KTtcbiAqIGBgYFxuICpcbiAqIFRoZSBmdW5jdGlvbiBzZXRzIHVwIGFuIGludGVybmFsIGZsYWcgdGhhdCB3b3VsZCBiZSByZWNvZ25pemVkIGR1cmluZ1xuICogdGhlIHNlcnZlciBzaWRlIHJlbmRlcmluZyB0aW1lIGFzIHdlbGwsIHNvIHRoZXJlIGlzIG5vIG5lZWQgdG9cbiAqIGNvbmZpZ3VyZSBvciBjaGFuZ2UgYW55dGhpbmcgaW4gTmdVbml2ZXJzYWwgdG8gZW5hYmxlIHRoZSBmZWF0dXJlLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqIEBkZXZlbG9wZXJQcmV2aWV3XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwcm92aWRlSHlkcmF0aW9uU3VwcG9ydCgpOiBFbnZpcm9ubWVudFByb3ZpZGVycyB7XG4gIHJldHVybiBtYWtlRW52aXJvbm1lbnRQcm92aWRlcnMoW1xuICAgIHtcbiAgICAgIHByb3ZpZGU6IEVOVklST05NRU5UX0lOSVRJQUxJWkVSLFxuICAgICAgdXNlVmFsdWU6ICgpID0+IHtcbiAgICAgICAgLy8gU2luY2UgdGhpcyBmdW5jdGlvbiBpcyB1c2VkIGFjcm9zcyBib3RoIHNlcnZlciBhbmQgY2xpZW50LFxuICAgICAgICAvLyBtYWtlIHN1cmUgdGhhdCB0aGUgcnVudGltZSBjb2RlIGlzIG9ubHkgYWRkZWQgd2hlbiBpbnZva2VkXG4gICAgICAgIC8vIG9uIHRoZSBjbGllbnQuIE1vdmluZyBmb3J3YXJkLCB0aGUgYGlzQnJvd3NlcmAgY2hlY2sgc2hvdWxkXG4gICAgICAgIC8vIGJlIHJlcGxhY2VkIHdpdGggYSB0cmVlLXNoYWthYmxlIGFsdGVybmF0aXZlIChlLmcuIGBpc1NlcnZlcmBcbiAgICAgICAgLy8gZmxhZykuXG4gICAgICAgIGlmIChpc0Jyb3dzZXIoKSkge1xuICAgICAgICAgIGVuYWJsZUh5ZHJhdGlvblJ1bnRpbWVTdXBwb3J0KCk7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBtdWx0aTogdHJ1ZSxcbiAgICB9LFxuICAgIHtcbiAgICAgIHByb3ZpZGU6IElTX0hZRFJBVElPTl9GRUFUVVJFX0VOQUJMRUQsXG4gICAgICB1c2VWYWx1ZTogdHJ1ZSxcbiAgICB9LFxuICAgIHtcbiAgICAgIHByb3ZpZGU6IFBSRVNFUlZFX0hPU1RfQ09OVEVOVCxcbiAgICAgIC8vIFByZXNlcnZlIGhvc3QgZWxlbWVudCBjb250ZW50IG9ubHkgaW4gYSBicm93c2VyXG4gICAgICAvLyBlbnZpcm9ubWVudC4gT24gYSBzZXJ2ZXIsIGFuIGFwcGxpY2F0aW9uIGlzIHJlbmRlcmVkXG4gICAgICAvLyBmcm9tIHNjcmF0Y2gsIHNvIHRoZSBob3N0IGNvbnRlbnQgbmVlZHMgdG8gYmUgZW1wdHkuXG4gICAgICB1c2VGYWN0b3J5OiAoKSA9PiBpc0Jyb3dzZXIoKSxcbiAgICB9XG4gIF0pO1xufVxuIl19