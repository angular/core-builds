/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { first } from 'rxjs/operators';
import { APP_BOOTSTRAP_LISTENER, ApplicationRef } from '../application_ref';
import { PLATFORM_ID } from '../application_tokens';
import { Console } from '../console';
import { ENVIRONMENT_INITIALIZER, makeEnvironmentProviders } from '../di';
import { inject } from '../di/injector_compatibility';
import { InitialRenderPendingTasks } from '../initial_render_pending_tasks';
import { enableLocateOrCreateContainerRefImpl } from '../linker/view_container_ref';
import { enableLocateOrCreateElementNodeImpl } from '../render3/instructions/element';
import { enableLocateOrCreateElementContainerNodeImpl } from '../render3/instructions/element_container';
import { enableApplyRootElementTransformImpl } from '../render3/instructions/shared';
import { enableLocateOrCreateContainerAnchorImpl } from '../render3/instructions/template';
import { enableLocateOrCreateTextNodeImpl } from '../render3/instructions/text';
import { cleanupDehydratedViews } from './cleanup';
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
 * Outputs a message with hydration stats into a console.
 */
function printHydrationStats(console) {
    const message = `Angular hydrated ${ngDevMode.hydratedComponents} component(s) ` +
        `and ${ngDevMode.hydratedNodes} node(s), ` +
        `${ngDevMode.componentsSkippedHydration} component(s) were skipped. ` +
        `Learn more at https://angular.io/guides/hydration.`;
    // tslint:disable-next-line:no-console
    console.log(message);
}
/**
 * Returns a Promise that is resolved when an application becomes stable.
 */
function whenStable(appRef, pendingTasks) {
    const isStablePromise = appRef.isStable.pipe(first((isStable) => isStable)).toPromise();
    const pendingTasksPromise = pendingTasks.whenAllTasksComplete;
    return Promise.allSettled([isStablePromise, pendingTasksPromise]);
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
        },
        {
            provide: APP_BOOTSTRAP_LISTENER,
            useFactory: () => {
                if (isBrowser()) {
                    const appRef = inject(ApplicationRef);
                    const pendingTasks = inject(InitialRenderPendingTasks);
                    const console = inject(Console);
                    return () => {
                        whenStable(appRef, pendingTasks).then(() => {
                            // Wait until an app becomes stable and cleanup all views that
                            // were not claimed during the application bootstrap process.
                            // The timing is similar to when we start the serialization process
                            // on the server.
                            cleanupDehydratedViews(appRef);
                            if (typeof ngDevMode !== 'undefined' && ngDevMode) {
                                printHydrationStats(console);
                            }
                        });
                    };
                }
                return () => { }; // noop
            },
            multi: true,
        }
    ]);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBpLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvaHlkcmF0aW9uL2FwaS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsS0FBSyxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFFckMsT0FBTyxFQUFDLHNCQUFzQixFQUFFLGNBQWMsRUFBQyxNQUFNLG9CQUFvQixDQUFDO0FBQzFFLE9BQU8sRUFBQyxXQUFXLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUNsRCxPQUFPLEVBQUMsT0FBTyxFQUFDLE1BQU0sWUFBWSxDQUFDO0FBQ25DLE9BQU8sRUFBQyx1QkFBdUIsRUFBd0Isd0JBQXdCLEVBQUMsTUFBTSxPQUFPLENBQUM7QUFDOUYsT0FBTyxFQUFDLE1BQU0sRUFBQyxNQUFNLDhCQUE4QixDQUFDO0FBQ3BELE9BQU8sRUFBQyx5QkFBeUIsRUFBQyxNQUFNLGlDQUFpQyxDQUFDO0FBQzFFLE9BQU8sRUFBQyxvQ0FBb0MsRUFBQyxNQUFNLDhCQUE4QixDQUFDO0FBQ2xGLE9BQU8sRUFBQyxtQ0FBbUMsRUFBQyxNQUFNLGlDQUFpQyxDQUFDO0FBQ3BGLE9BQU8sRUFBQyw0Q0FBNEMsRUFBQyxNQUFNLDJDQUEyQyxDQUFDO0FBQ3ZHLE9BQU8sRUFBQyxtQ0FBbUMsRUFBQyxNQUFNLGdDQUFnQyxDQUFDO0FBQ25GLE9BQU8sRUFBQyx1Q0FBdUMsRUFBQyxNQUFNLGtDQUFrQyxDQUFDO0FBQ3pGLE9BQU8sRUFBQyxnQ0FBZ0MsRUFBQyxNQUFNLDhCQUE4QixDQUFDO0FBRTlFLE9BQU8sRUFBQyxzQkFBc0IsRUFBQyxNQUFNLFdBQVcsQ0FBQztBQUNqRCxPQUFPLEVBQUMsNEJBQTRCLEVBQUUscUJBQXFCLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDN0UsT0FBTyxFQUFDLCtCQUErQixFQUFDLE1BQU0sU0FBUyxDQUFDO0FBQ3hELE9BQU8s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RCxtRUFBbUU7NEJBQ25FLGlCQUFpQjs0QkFDakIsc0JBQXNCLENBQUMsTUFBTSxDQUFDLENBQUM7NEJBRS9CLElBQUksT0FBTyxTQUFTLEtBQUssV0FBVyxJQUFJLFNBQVMsRUFBRTtnQ0FDakQsbUJBQW1CLENBQUMsT0FBTyxDQUFDLENBQUM7NkJBQzlCO3dCQUNILENBQUMsQ0FBQyxDQUFDO29CQUNMLENBQUMsQ0FBQztpQkFDSDtnQkFDRCxPQUFPLEdBQUcsRUFBRSxHQUFFLENBQUMsQ0FBQyxDQUFFLE9BQU87WUFDM0IsQ0FBQztZQUNELEtBQUssRUFBRSxJQUFJO1NBQ1o7S0FDRixDQUFDLENBQUM7QUFDTCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7Zmlyc3R9IGZyb20gJ3J4anMvb3BlcmF0b3JzJztcblxuaW1wb3J0IHtBUFBfQk9PVFNUUkFQX0xJU1RFTkVSLCBBcHBsaWNhdGlvblJlZn0gZnJvbSAnLi4vYXBwbGljYXRpb25fcmVmJztcbmltcG9ydCB7UExBVEZPUk1fSUR9IGZyb20gJy4uL2FwcGxpY2F0aW9uX3Rva2Vucyc7XG5pbXBvcnQge0NvbnNvbGV9IGZyb20gJy4uL2NvbnNvbGUnO1xuaW1wb3J0IHtFTlZJUk9OTUVOVF9JTklUSUFMSVpFUiwgRW52aXJvbm1lbnRQcm92aWRlcnMsIG1ha2VFbnZpcm9ubWVudFByb3ZpZGVyc30gZnJvbSAnLi4vZGknO1xuaW1wb3J0IHtpbmplY3R9IGZyb20gJy4uL2RpL2luamVjdG9yX2NvbXBhdGliaWxpdHknO1xuaW1wb3J0IHtJbml0aWFsUmVuZGVyUGVuZGluZ1Rhc2tzfSBmcm9tICcuLi9pbml0aWFsX3JlbmRlcl9wZW5kaW5nX3Rhc2tzJztcbmltcG9ydCB7ZW5hYmxlTG9jYXRlT3JDcmVhdGVDb250YWluZXJSZWZJbXBsfSBmcm9tICcuLi9saW5rZXIvdmlld19jb250YWluZXJfcmVmJztcbmltcG9ydCB7ZW5hYmxlTG9jYXRlT3JDcmVhdGVFbGVtZW50Tm9kZUltcGx9IGZyb20gJy4uL3JlbmRlcjMvaW5zdHJ1Y3Rpb25zL2VsZW1lbnQnO1xuaW1wb3J0IHtlbmFibGVMb2NhdGVPckNyZWF0ZUVsZW1lbnRDb250YWluZXJOb2RlSW1wbH0gZnJvbSAnLi4vcmVuZGVyMy9pbnN0cnVjdGlvbnMvZWxlbWVudF9jb250YWluZXInO1xuaW1wb3J0IHtlbmFibGVBcHBseVJvb3RFbGVtZW50VHJhbnNmb3JtSW1wbH0gZnJvbSAnLi4vcmVuZGVyMy9pbnN0cnVjdGlvbnMvc2hhcmVkJztcbmltcG9ydCB7ZW5hYmxlTG9jYXRlT3JDcmVhdGVDb250YWluZXJBbmNob3JJbXBsfSBmcm9tICcuLi9yZW5kZXIzL2luc3RydWN0aW9ucy90ZW1wbGF0ZSc7XG5pbXBvcnQge2VuYWJsZUxvY2F0ZU9yQ3JlYXRlVGV4dE5vZGVJbXBsfSBmcm9tICcuLi9yZW5kZXIzL2luc3RydWN0aW9ucy90ZXh0JztcblxuaW1wb3J0IHtjbGVhbnVwRGVoeWRyYXRlZFZpZXdzfSBmcm9tICcuL2NsZWFudXAnO1xuaW1wb3J0IHtJU19IWURSQVRJT05fRkVBVFVSRV9FTkFCTEVELCBQUkVTRVJWRV9IT1NUX0NPTlRFTlR9IGZyb20gJy4vdG9rZW5zJztcbmltcG9ydCB7ZW5hYmxlUmV0cmlldmVIeWRyYXRpb25JbmZvSW1wbH0gZnJvbSAnLi91dGlscyc7XG5pbXBvcnQge2VuYWJsZUZpbmRNYXRjaGluZ0RlaHlkcmF0ZWRWaWV3SW1wbH0gZnJvbSAnLi92aWV3cyc7XG5cblxuLyoqXG4gKiBJbmRpY2F0ZXMgd2hldGhlciB0aGUgaHlkcmF0aW9uLXJlbGF0ZWQgY29kZSB3YXMgYWRkZWQsXG4gKiBwcmV2ZW50cyBhZGRpbmcgaXQgbXVsdGlwbGUgdGltZXMuXG4gKi9cbmxldCBpc0h5ZHJhdGlvblN1cHBvcnRFbmFibGVkID0gZmFsc2U7XG5cbi8qKlxuICogQnJpbmdzIHRoZSBuZWNlc3NhcnkgaHlkcmF0aW9uIGNvZGUgaW4gdHJlZS1zaGFrYWJsZSBtYW5uZXIuXG4gKiBUaGUgY29kZSBpcyBvbmx5IHByZXNlbnQgd2hlbiB0aGUgYHByb3ZpZGVIeWRyYXRpb25TdXBwb3J0YCBpc1xuICogaW52b2tlZC4gT3RoZXJ3aXNlLCB0aGlzIGNvZGUgaXMgdHJlZS1zaGFrZW4gYXdheSBkdXJpbmcgdGhlXG4gKiBidWlsZCBvcHRpbWl6YXRpb24gc3RlcC5cbiAqXG4gKiBUaGlzIHRlY2huaXF1ZSBhbGxvd3MgdXMgdG8gc3dhcCBpbXBsZW1lbnRhdGlvbnMgb2YgbWV0aG9kcyBzb1xuICogdHJlZSBzaGFraW5nIHdvcmtzIGFwcHJvcHJpYXRlbHkgd2hlbiBoeWRyYXRpb24gaXMgZGlzYWJsZWQgb3JcbiAqIGVuYWJsZWQuIEl0IGJyaW5ncyBpbiB0aGUgYXBwcm9wcmlhdGUgdmVyc2lvbiBvZiB0aGUgbWV0aG9kIHRoYXRcbiAqIHN1cHBvcnRzIGh5ZHJhdGlvbiBvbmx5IHdoZW4gZW5hYmxlZC5cbiAqL1xuZnVuY3Rpb24gZW5hYmxlSHlkcmF0aW9uUnVudGltZVN1cHBvcnQoKSB7XG4gIGlmICghaXNIeWRyYXRpb25TdXBwb3J0RW5hYmxlZCkge1xuICAgIGlzSHlkcmF0aW9uU3VwcG9ydEVuYWJsZWQgPSB0cnVlO1xuICAgIGVuYWJsZVJldHJpZXZlSHlkcmF0aW9uSW5mb0ltcGwoKTtcbiAgICBlbmFibGVMb2NhdGVPckNyZWF0ZUVsZW1lbnROb2RlSW1wbCgpO1xuICAgIGVuYWJsZUxvY2F0ZU9yQ3JlYXRlVGV4dE5vZGVJbXBsKCk7XG4gICAgZW5hYmxlTG9jYXRlT3JDcmVhdGVFbGVtZW50Q29udGFpbmVyTm9kZUltcGwoKTtcbiAgICBlbmFibGVMb2NhdGVPckNyZWF0ZUNvbnRhaW5lckFuY2hvckltcGwoKTtcbiAgICBlbmFibGVMb2NhdGVPckNyZWF0ZUNvbnRhaW5lclJlZkltcGwoKTtcbiAgICBlbmFibGVGaW5kTWF0Y2hpbmdEZWh5ZHJhdGVkVmlld0ltcGwoKTtcbiAgICBlbmFibGVBcHBseVJvb3RFbGVtZW50VHJhbnNmb3JtSW1wbCgpO1xuICB9XG59XG5cbi8qKlxuICogRGV0ZWN0cyB3aGV0aGVyIHRoZSBjb2RlIGlzIGludm9rZWQgaW4gYSBicm93c2VyLlxuICogTGF0ZXIgb24sIHRoaXMgY2hlY2sgc2hvdWxkIGJlIHJlcGxhY2VkIHdpdGggYSB0cmVlLXNoYWthYmxlXG4gKiBmbGFnIChlLmcuIGAhaXNTZXJ2ZXJgKS5cbiAqL1xuZnVuY3Rpb24gaXNCcm93c2VyKCk6IGJvb2xlYW4ge1xuICByZXR1cm4gaW5qZWN0KFBMQVRGT1JNX0lEKSA9PT0gJ2Jyb3dzZXInO1xufVxuXG4vKipcbiAqIE91dHB1dHMgYSBtZXNzYWdlIHdpdGggaHlkcmF0aW9uIHN0YXRzIGludG8gYSBjb25zb2xlLlxuICovXG5mdW5jdGlvbiBwcmludEh5ZHJhdGlvblN0YXRzKGNvbnNvbGU6IENvbnNvbGUpIHtcbiAgY29uc3QgbWVzc2FnZSA9IGBBbmd1bGFyIGh5ZHJhdGVkICR7bmdEZXZNb2RlIS5oeWRyYXRlZENvbXBvbmVudHN9IGNvbXBvbmVudChzKSBgICtcbiAgICAgIGBhbmQgJHtuZ0Rldk1vZGUhLmh5ZHJhdGVkTm9kZXN9IG5vZGUocyksIGAgK1xuICAgICAgYCR7bmdEZXZNb2RlIS5jb21wb25lbnRzU2tpcHBlZEh5ZHJhdGlvbn0gY29tcG9uZW50KHMpIHdlcmUgc2tpcHBlZC4gYCArXG4gICAgICBgTGVhcm4gbW9yZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vZ3VpZGVzL2h5ZHJhdGlvbi5gO1xuICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6bm8tY29uc29sZVxuICBjb25zb2xlLmxvZyhtZXNzYWdlKTtcbn1cblxuXG4vKipcbiAqIFJldHVybnMgYSBQcm9taXNlIHRoYXQgaXMgcmVzb2x2ZWQgd2hlbiBhbiBhcHBsaWNhdGlvbiBiZWNvbWVzIHN0YWJsZS5cbiAqL1xuZnVuY3Rpb24gd2hlblN0YWJsZShcbiAgICBhcHBSZWY6IEFwcGxpY2F0aW9uUmVmLCBwZW5kaW5nVGFza3M6IEluaXRpYWxSZW5kZXJQZW5kaW5nVGFza3MpOiBQcm9taXNlPHVua25vd24+IHtcbiAgY29uc3QgaXNTdGFibGVQcm9taXNlID0gYXBwUmVmLmlzU3RhYmxlLnBpcGUoZmlyc3QoKGlzU3RhYmxlOiBib29sZWFuKSA9PiBpc1N0YWJsZSkpLnRvUHJvbWlzZSgpO1xuICBjb25zdCBwZW5kaW5nVGFza3NQcm9taXNlID0gcGVuZGluZ1Rhc2tzLndoZW5BbGxUYXNrc0NvbXBsZXRlO1xuICByZXR1cm4gUHJvbWlzZS5hbGxTZXR0bGVkKFtpc1N0YWJsZVByb21pc2UsIHBlbmRpbmdUYXNrc1Byb21pc2VdKTtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIGEgc2V0IG9mIHByb3ZpZGVycyByZXF1aXJlZCB0byBzZXR1cCBoeWRyYXRpb24gc3VwcG9ydFxuICogZm9yIGFuIGFwcGxpY2F0aW9uIHRoYXQgaXMgc2VydmVyIHNpZGUgcmVuZGVyZWQuXG4gKlxuICogIyMgTmdNb2R1bGUtYmFzZWQgYm9vdHN0cmFwXG4gKlxuICogWW91IGNhbiBhZGQgdGhlIGZ1bmN0aW9uIGNhbGwgdG8gdGhlIHJvb3QgQXBwTW9kdWxlIG9mIGFuIGFwcGxpY2F0aW9uOlxuICogYGBgXG4gKiBpbXBvcnQge3Byb3ZpZGVIeWRyYXRpb25TdXBwb3J0fSBmcm9tICdAYW5ndWxhci9jb3JlJztcbiAqXG4gKiBATmdNb2R1bGUoe1xuICogICBwcm92aWRlcnM6IFtcbiAqICAgICAvLyAuLi4gb3RoZXIgcHJvdmlkZXJzIC4uLlxuICogICAgIHByb3ZpZGVIeWRyYXRpb25TdXBwb3J0KClcbiAqICAgXSxcbiAqICAgZGVjbGFyYXRpb25zOiBbQXBwQ29tcG9uZW50XSxcbiAqICAgYm9vdHN0cmFwOiBbQXBwQ29tcG9uZW50XVxuICogfSlcbiAqIGNsYXNzIEFwcE1vZHVsZSB7fVxuICogYGBgXG4gKlxuICogIyMgU3RhbmRhbG9uZS1iYXNlZCBib290c3RyYXBcbiAqXG4gKiBBZGQgdGhlIGZ1bmN0aW9uIHRvIHRoZSBgYm9vdHN0cmFwQXBwbGljYXRpb25gIGNhbGw6XG4gKiBgYGBcbiAqIGltcG9ydCB7cHJvdmlkZUh5ZHJhdGlvblN1cHBvcnR9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuICpcbiAqIGJvb3RzdHJhcEFwcGxpY2F0aW9uKFJvb3RDb21wb25lbnQsIHtcbiAqICAgcHJvdmlkZXJzOiBbXG4gKiAgICAgLy8gLi4uIG90aGVyIHByb3ZpZGVycyAuLi5cbiAqICAgICBwcm92aWRlSHlkcmF0aW9uU3VwcG9ydCgpXG4gKiAgIF1cbiAqIH0pO1xuICogYGBgXG4gKlxuICogVGhlIGZ1bmN0aW9uIHNldHMgdXAgYW4gaW50ZXJuYWwgZmxhZyB0aGF0IHdvdWxkIGJlIHJlY29nbml6ZWQgZHVyaW5nXG4gKiB0aGUgc2VydmVyIHNpZGUgcmVuZGVyaW5nIHRpbWUgYXMgd2VsbCwgc28gdGhlcmUgaXMgbm8gbmVlZCB0b1xuICogY29uZmlndXJlIG9yIGNoYW5nZSBhbnl0aGluZyBpbiBOZ1VuaXZlcnNhbCB0byBlbmFibGUgdGhlIGZlYXR1cmUuXG4gKlxuICogQHB1YmxpY0FwaVxuICogQGRldmVsb3BlclByZXZpZXdcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHByb3ZpZGVIeWRyYXRpb25TdXBwb3J0KCk6IEVudmlyb25tZW50UHJvdmlkZXJzIHtcbiAgcmV0dXJuIG1ha2VFbnZpcm9ubWVudFByb3ZpZGVycyhbXG4gICAge1xuICAgICAgcHJvdmlkZTogRU5WSVJPTk1FTlRfSU5JVElBTElaRVIsXG4gICAgICB1c2VWYWx1ZTogKCkgPT4ge1xuICAgICAgICAvLyBTaW5jZSB0aGlzIGZ1bmN0aW9uIGlzIHVzZWQgYWNyb3NzIGJvdGggc2VydmVyIGFuZCBjbGllbnQsXG4gICAgICAgIC8vIG1ha2Ugc3VyZSB0aGF0IHRoZSBydW50aW1lIGNvZGUgaXMgb25seSBhZGRlZCB3aGVuIGludm9rZWRcbiAgICAgICAgLy8gb24gdGhlIGNsaWVudC4gTW92aW5nIGZvcndhcmQsIHRoZSBgaXNCcm93c2VyYCBjaGVjayBzaG91bGRcbiAgICAgICAgLy8gYmUgcmVwbGFjZWQgd2l0aCBhIHRyZWUtc2hha2FibGUgYWx0ZXJuYXRpdmUgKGUuZy4gYGlzU2VydmVyYFxuICAgICAgICAvLyBmbGFnKS5cbiAgICAgICAgaWYgKGlzQnJvd3NlcigpKSB7XG4gICAgICAgICAgZW5hYmxlSHlkcmF0aW9uUnVudGltZVN1cHBvcnQoKTtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIG11bHRpOiB0cnVlLFxuICAgIH0sXG4gICAge1xuICAgICAgcHJvdmlkZTogSVNfSFlEUkFUSU9OX0ZFQVRVUkVfRU5BQkxFRCxcbiAgICAgIHVzZVZhbHVlOiB0cnVlLFxuICAgIH0sXG4gICAge1xuICAgICAgcHJvdmlkZTogUFJFU0VSVkVfSE9TVF9DT05URU5ULFxuICAgICAgLy8gUHJlc2VydmUgaG9zdCBlbGVtZW50IGNvbnRlbnQgb25seSBpbiBhIGJyb3dzZXJcbiAgICAgIC8vIGVudmlyb25tZW50LiBPbiBhIHNlcnZlciwgYW4gYXBwbGljYXRpb24gaXMgcmVuZGVyZWRcbiAgICAgIC8vIGZyb20gc2NyYXRjaCwgc28gdGhlIGhvc3QgY29udGVudCBuZWVkcyB0byBiZSBlbXB0eS5cbiAgICAgIHVzZUZhY3Rvcnk6ICgpID0+IGlzQnJvd3NlcigpLFxuICAgIH0sXG4gICAge1xuICAgICAgcHJvdmlkZTogQVBQX0JPT1RTVFJBUF9MSVNURU5FUixcbiAgICAgIHVzZUZhY3Rvcnk6ICgpID0+IHtcbiAgICAgICAgaWYgKGlzQnJvd3NlcigpKSB7XG4gICAgICAgICAgY29uc3QgYXBwUmVmID0gaW5qZWN0KEFwcGxpY2F0aW9uUmVmKTtcbiAgICAgICAgICBjb25zdCBwZW5kaW5nVGFza3MgPSBpbmplY3QoSW5pdGlhbFJlbmRlclBlbmRpbmdUYXNrcyk7XG4gICAgICAgICAgY29uc3QgY29uc29sZSA9IGluamVjdChDb25zb2xlKTtcbiAgICAgICAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgICAgICAgd2hlblN0YWJsZShhcHBSZWYsIHBlbmRpbmdUYXNrcykudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgIC8vIFdhaXQgdW50aWwgYW4gYXBwIGJlY29tZXMgc3RhYmxlIGFuZCBjbGVhbnVwIGFsbCB2aWV3cyB0aGF0XG4gICAgICAgICAgICAgIC8vIHdlcmUgbm90IGNsYWltZWQgZHVyaW5nIHRoZSBhcHBsaWNhdGlvbiBib290c3RyYXAgcHJvY2Vzcy5cbiAgICAgICAgICAgICAgLy8gVGhlIHRpbWluZyBpcyBzaW1pbGFyIHRvIHdoZW4gd2Ugc3RhcnQgdGhlIHNlcmlhbGl6YXRpb24gcHJvY2Vzc1xuICAgICAgICAgICAgICAvLyBvbiB0aGUgc2VydmVyLlxuICAgICAgICAgICAgICBjbGVhbnVwRGVoeWRyYXRlZFZpZXdzKGFwcFJlZik7XG5cbiAgICAgICAgICAgICAgaWYgKHR5cGVvZiBuZ0Rldk1vZGUgIT09ICd1bmRlZmluZWQnICYmIG5nRGV2TW9kZSkge1xuICAgICAgICAgICAgICAgIHByaW50SHlkcmF0aW9uU3RhdHMoY29uc29sZSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuICgpID0+IHt9OyAgLy8gbm9vcFxuICAgICAgfSxcbiAgICAgIG11bHRpOiB0cnVlLFxuICAgIH1cbiAgXSk7XG59XG4iXX0=