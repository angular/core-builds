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
import { ENVIRONMENT_INITIALIZER, Injector, makeEnvironmentProviders } from '../di';
import { inject } from '../di/injector_compatibility';
import { formatRuntimeError } from '../errors';
import { InitialRenderPendingTasks } from '../initial_render_pending_tasks';
import { enableLocateOrCreateContainerRefImpl } from '../linker/view_container_ref';
import { enableLocateOrCreateElementNodeImpl } from '../render3/instructions/element';
import { enableLocateOrCreateElementContainerNodeImpl } from '../render3/instructions/element_container';
import { enableApplyRootElementTransformImpl } from '../render3/instructions/shared';
import { enableLocateOrCreateContainerAnchorImpl } from '../render3/instructions/template';
import { enableLocateOrCreateTextNodeImpl } from '../render3/instructions/text';
import { TransferState } from '../transfer_state';
import { cleanupDehydratedViews } from './cleanup';
import { IS_HYDRATION_FEATURE_ENABLED, PRESERVE_HOST_CONTENT } from './tokens';
import { enableRetrieveHydrationInfoImpl, NGH_DATA_KEY } from './utils';
import { enableFindMatchingDehydratedViewImpl } from './views';
/**
 * Indicates whether the hydration-related code was added,
 * prevents adding it multiple times.
 */
let isHydrationSupportEnabled = false;
/**
 * Brings the necessary hydration code in tree-shakable manner.
 * The code is only present when the `provideClientHydration` is
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
function printHydrationInfo(injector) {
    const console = injector.get(Console);
    const transferState = injector.get(TransferState, null, { optional: true });
    if (transferState && transferState.get(NGH_DATA_KEY, null)) {
        const message = `Angular hydrated ${ngDevMode.hydratedComponents} component(s) ` +
            `and ${ngDevMode.hydratedNodes} node(s), ` +
            `${ngDevMode.componentsSkippedHydration} component(s) were skipped. ` +
            `Note: this feature is in Developer Preview mode. ` +
            `Learn more at https://next.angular.io/guide/hydration.`;
        // tslint:disable-next-line:no-console
        console.log(message);
    }
    else {
        const message = formatRuntimeError(-505 /* RuntimeErrorCode.MISSING_HYDRATION_ANNOTATIONS */, 'Angular hydration was enabled on the client, but there was no ' +
            'serialized information present in the server response. ' +
            'Make sure the `provideClientHydration()` is included into the list ' +
            'of providers in the server part of the application configuration.');
        // tslint:disable-next-line:no-console
        console.warn(message);
    }
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
 * for an application that is server side rendered. This function is
 * included into the `provideClientHydration` public API function from
 * the `platform-browser` package.
 *
 * The function sets up an internal flag that would be recognized during
 * the server side rendering time as well, so there is no need to
 * configure or change anything in NgUniversal to enable the feature.
 */
export function withDomHydration() {
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
                    const injector = inject(Injector);
                    return () => {
                        whenStable(appRef, pendingTasks).then(() => {
                            // Wait until an app becomes stable and cleanup all views that
                            // were not claimed during the application bootstrap process.
                            // The timing is similar to when we start the serialization process
                            // on the server.
                            cleanupDehydratedViews(appRef);
                            if (typeof ngDevMode !== 'undefined' && ngDevMode) {
                                printHydrationInfo(injector);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBpLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvaHlkcmF0aW9uL2FwaS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsS0FBSyxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFFckMsT0FBTyxFQUFDLHNCQUFzQixFQUFFLGNBQWMsRUFBQyxNQUFNLG9CQUFvQixDQUFDO0FBQzFFLE9BQU8sRUFBQyxXQUFXLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUNsRCxPQUFPLEVBQUMsT0FBTyxFQUFDLE1BQU0sWUFBWSxDQUFDO0FBQ25DLE9BQU8sRUFBQyx1QkFBdUIsRUFBd0IsUUFBUSxFQUFFLHdCQUF3QixFQUFDLE1BQU0sT0FBTyxDQUFDO0FBQ3hHLE9BQU8sRUFBQyxNQUFNLEVBQUMsTUFBTSw4QkFBOEIsQ0FBQztBQUNwRCxPQUFPLEVBQUMsa0JBQWtCLEVBQW1CLE1BQU0sV0FBVyxDQUFDO0FBQy9ELE9BQU8sRUFBQyx5QkFBeUIsRUFBQyxNQUFNLGlDQUFpQyxDQUFDO0FBQzFFLE9BQU8sRUFBQyxvQ0FBb0MsRUFBQyxNQUFNLDhCQUE4QixDQUFDO0FBQ2xGLE9BQU8sRUFBQyxtQ0FBbUMsRUFBQyxNQUFNLGlDQUFpQyxDQUFDO0FBQ3BGLE9BQU8sRUFBQyw0Q0FBNEMsRUFBQyxNQUFNLDJDQUEyQyxDQUFDO0FBQ3ZHLE9BQU8sRUFBQyxtQ0FBbUMsRUFBQyxNQUFNLGdDQUFnQyxDQUFDO0FBQ25GLE9BQU8sRUFBQyx1Q0FBdUMsRUFBQyxNQUFNLGtDQUFrQyxDQUFDO0FBQ3pGLE9BQU8sRUFBQyxnQ0FBZ0MsRUFBQyxNQUFNLDhCQUE4QixDQUFDO0FBQzlFLE9BQU8sRUFBQyxhQUFhLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUVoRCxPQUFPLEVBQUMsc0JBQXNCLEVBQUMsTUFBTSxXQUFXLENBQUM7QUFDakQsT0FBTyxF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RUFBRSxJQUFJO1NBQ2Y7UUFDRDtZQUNFLE9BQU8sRUFBRSxxQkFBcUI7WUFDOUIsa0RBQWtEO1lBQ2xELHVEQUF1RDtZQUN2RCx1REFBdUQ7WUFDdkQsVUFBVSxFQUFFLEdBQUcsRUFBRSxDQUFDLFNBQVMsRUFBRTtTQUM5QjtRQUNEO1lBQ0UsT0FBTyxFQUFFLHNCQUFzQjtZQUMvQixVQUFVLEVBQUUsR0FBRyxFQUFFO2dCQUNmLElBQUksU0FBUyxFQUFFLEVBQUU7b0JBQ2YsTUFBTSxNQUFNLEdBQUcsTUFBTSxDQUFDLGNBQWMsQ0FBQyxDQUFDO29CQUN0QyxNQUFNLFlBQVksR0FBRyxNQUFNLENBQUMseUJBQXlCLENBQUMsQ0FBQztvQkFDdkQsTUFBTSxRQUFRLEdBQUcsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO29CQUNsQyxPQUFPLEdBQUcsRUFBRTt3QkFDVixVQUFVLENBQUMsTUFBTSxFQUFFLFlBQVksQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUU7NEJBQ3pDLDhEQUE4RDs0QkFDOUQsNkRBQTZEOzRCQUM3RCxtRUFBbUU7NEJBQ25FLGlCQUFpQjs0QkFDakIsc0JBQXNCLENBQUMsTUFBTSxDQUFDLENBQUM7NEJBRS9CLElBQUksT0FBTyxTQUFTLEtBQUssV0FBVyxJQUFJLFNBQVMsRUFBRTtnQ0FDakQsa0JBQWtCLENBQUMsUUFBUSxDQUFDLENBQUM7NkJBQzlCO3dCQUNILENBQUMsQ0FBQyxDQUFDO29CQUNMLENBQUMsQ0FBQztpQkFDSDtnQkFDRCxPQUFPLEdBQUcsRUFBRSxHQUFFLENBQUMsQ0FBQyxDQUFFLE9BQU87WUFDM0IsQ0FBQztZQUNELEtBQUssRUFBRSxJQUFJO1NBQ1o7S0FDRixDQUFDLENBQUM7QUFDTCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7Zmlyc3R9IGZyb20gJ3J4anMvb3BlcmF0b3JzJztcblxuaW1wb3J0IHtBUFBfQk9PVFNUUkFQX0xJU1RFTkVSLCBBcHBsaWNhdGlvblJlZn0gZnJvbSAnLi4vYXBwbGljYXRpb25fcmVmJztcbmltcG9ydCB7UExBVEZPUk1fSUR9IGZyb20gJy4uL2FwcGxpY2F0aW9uX3Rva2Vucyc7XG5pbXBvcnQge0NvbnNvbGV9IGZyb20gJy4uL2NvbnNvbGUnO1xuaW1wb3J0IHtFTlZJUk9OTUVOVF9JTklUSUFMSVpFUiwgRW52aXJvbm1lbnRQcm92aWRlcnMsIEluamVjdG9yLCBtYWtlRW52aXJvbm1lbnRQcm92aWRlcnN9IGZyb20gJy4uL2RpJztcbmltcG9ydCB7aW5qZWN0fSBmcm9tICcuLi9kaS9pbmplY3Rvcl9jb21wYXRpYmlsaXR5JztcbmltcG9ydCB7Zm9ybWF0UnVudGltZUVycm9yLCBSdW50aW1lRXJyb3JDb2RlfSBmcm9tICcuLi9lcnJvcnMnO1xuaW1wb3J0IHtJbml0aWFsUmVuZGVyUGVuZGluZ1Rhc2tzfSBmcm9tICcuLi9pbml0aWFsX3JlbmRlcl9wZW5kaW5nX3Rhc2tzJztcbmltcG9ydCB7ZW5hYmxlTG9jYXRlT3JDcmVhdGVDb250YWluZXJSZWZJbXBsfSBmcm9tICcuLi9saW5rZXIvdmlld19jb250YWluZXJfcmVmJztcbmltcG9ydCB7ZW5hYmxlTG9jYXRlT3JDcmVhdGVFbGVtZW50Tm9kZUltcGx9IGZyb20gJy4uL3JlbmRlcjMvaW5zdHJ1Y3Rpb25zL2VsZW1lbnQnO1xuaW1wb3J0IHtlbmFibGVMb2NhdGVPckNyZWF0ZUVsZW1lbnRDb250YWluZXJOb2RlSW1wbH0gZnJvbSAnLi4vcmVuZGVyMy9pbnN0cnVjdGlvbnMvZWxlbWVudF9jb250YWluZXInO1xuaW1wb3J0IHtlbmFibGVBcHBseVJvb3RFbGVtZW50VHJhbnNmb3JtSW1wbH0gZnJvbSAnLi4vcmVuZGVyMy9pbnN0cnVjdGlvbnMvc2hhcmVkJztcbmltcG9ydCB7ZW5hYmxlTG9jYXRlT3JDcmVhdGVDb250YWluZXJBbmNob3JJbXBsfSBmcm9tICcuLi9yZW5kZXIzL2luc3RydWN0aW9ucy90ZW1wbGF0ZSc7XG5pbXBvcnQge2VuYWJsZUxvY2F0ZU9yQ3JlYXRlVGV4dE5vZGVJbXBsfSBmcm9tICcuLi9yZW5kZXIzL2luc3RydWN0aW9ucy90ZXh0JztcbmltcG9ydCB7VHJhbnNmZXJTdGF0ZX0gZnJvbSAnLi4vdHJhbnNmZXJfc3RhdGUnO1xuXG5pbXBvcnQge2NsZWFudXBEZWh5ZHJhdGVkVmlld3N9IGZyb20gJy4vY2xlYW51cCc7XG5pbXBvcnQge0lTX0hZRFJBVElPTl9GRUFUVVJFX0VOQUJMRUQsIFBSRVNFUlZFX0hPU1RfQ09OVEVOVH0gZnJvbSAnLi90b2tlbnMnO1xuaW1wb3J0IHtlbmFibGVSZXRyaWV2ZUh5ZHJhdGlvbkluZm9JbXBsLCBOR0hfREFUQV9LRVl9IGZyb20gJy4vdXRpbHMnO1xuaW1wb3J0IHtlbmFibGVGaW5kTWF0Y2hpbmdEZWh5ZHJhdGVkVmlld0ltcGx9IGZyb20gJy4vdmlld3MnO1xuXG5cbi8qKlxuICogSW5kaWNhdGVzIHdoZXRoZXIgdGhlIGh5ZHJhdGlvbi1yZWxhdGVkIGNvZGUgd2FzIGFkZGVkLFxuICogcHJldmVudHMgYWRkaW5nIGl0IG11bHRpcGxlIHRpbWVzLlxuICovXG5sZXQgaXNIeWRyYXRpb25TdXBwb3J0RW5hYmxlZCA9IGZhbHNlO1xuXG4vKipcbiAqIEJyaW5ncyB0aGUgbmVjZXNzYXJ5IGh5ZHJhdGlvbiBjb2RlIGluIHRyZWUtc2hha2FibGUgbWFubmVyLlxuICogVGhlIGNvZGUgaXMgb25seSBwcmVzZW50IHdoZW4gdGhlIGBwcm92aWRlQ2xpZW50SHlkcmF0aW9uYCBpc1xuICogaW52b2tlZC4gT3RoZXJ3aXNlLCB0aGlzIGNvZGUgaXMgdHJlZS1zaGFrZW4gYXdheSBkdXJpbmcgdGhlXG4gKiBidWlsZCBvcHRpbWl6YXRpb24gc3RlcC5cbiAqXG4gKiBUaGlzIHRlY2huaXF1ZSBhbGxvd3MgdXMgdG8gc3dhcCBpbXBsZW1lbnRhdGlvbnMgb2YgbWV0aG9kcyBzb1xuICogdHJlZSBzaGFraW5nIHdvcmtzIGFwcHJvcHJpYXRlbHkgd2hlbiBoeWRyYXRpb24gaXMgZGlzYWJsZWQgb3JcbiAqIGVuYWJsZWQuIEl0IGJyaW5ncyBpbiB0aGUgYXBwcm9wcmlhdGUgdmVyc2lvbiBvZiB0aGUgbWV0aG9kIHRoYXRcbiAqIHN1cHBvcnRzIGh5ZHJhdGlvbiBvbmx5IHdoZW4gZW5hYmxlZC5cbiAqL1xuZnVuY3Rpb24gZW5hYmxlSHlkcmF0aW9uUnVudGltZVN1cHBvcnQoKSB7XG4gIGlmICghaXNIeWRyYXRpb25TdXBwb3J0RW5hYmxlZCkge1xuICAgIGlzSHlkcmF0aW9uU3VwcG9ydEVuYWJsZWQgPSB0cnVlO1xuICAgIGVuYWJsZVJldHJpZXZlSHlkcmF0aW9uSW5mb0ltcGwoKTtcbiAgICBlbmFibGVMb2NhdGVPckNyZWF0ZUVsZW1lbnROb2RlSW1wbCgpO1xuICAgIGVuYWJsZUxvY2F0ZU9yQ3JlYXRlVGV4dE5vZGVJbXBsKCk7XG4gICAgZW5hYmxlTG9jYXRlT3JDcmVhdGVFbGVtZW50Q29udGFpbmVyTm9kZUltcGwoKTtcbiAgICBlbmFibGVMb2NhdGVPckNyZWF0ZUNvbnRhaW5lckFuY2hvckltcGwoKTtcbiAgICBlbmFibGVMb2NhdGVPckNyZWF0ZUNvbnRhaW5lclJlZkltcGwoKTtcbiAgICBlbmFibGVGaW5kTWF0Y2hpbmdEZWh5ZHJhdGVkVmlld0ltcGwoKTtcbiAgICBlbmFibGVBcHBseVJvb3RFbGVtZW50VHJhbnNmb3JtSW1wbCgpO1xuICB9XG59XG5cbi8qKlxuICogRGV0ZWN0cyB3aGV0aGVyIHRoZSBjb2RlIGlzIGludm9rZWQgaW4gYSBicm93c2VyLlxuICogTGF0ZXIgb24sIHRoaXMgY2hlY2sgc2hvdWxkIGJlIHJlcGxhY2VkIHdpdGggYSB0cmVlLXNoYWthYmxlXG4gKiBmbGFnIChlLmcuIGAhaXNTZXJ2ZXJgKS5cbiAqL1xuZnVuY3Rpb24gaXNCcm93c2VyKCk6IGJvb2xlYW4ge1xuICByZXR1cm4gaW5qZWN0KFBMQVRGT1JNX0lEKSA9PT0gJ2Jyb3dzZXInO1xufVxuXG4vKipcbiAqIE91dHB1dHMgYSBtZXNzYWdlIHdpdGggaHlkcmF0aW9uIHN0YXRzIGludG8gYSBjb25zb2xlLlxuICovXG5mdW5jdGlvbiBwcmludEh5ZHJhdGlvbkluZm8oaW5qZWN0b3I6IEluamVjdG9yKSB7XG4gIGNvbnN0IGNvbnNvbGUgPSBpbmplY3Rvci5nZXQoQ29uc29sZSk7XG4gIGNvbnN0IHRyYW5zZmVyU3RhdGUgPSBpbmplY3Rvci5nZXQoVHJhbnNmZXJTdGF0ZSwgbnVsbCwge29wdGlvbmFsOiB0cnVlfSk7XG4gIGlmICh0cmFuc2ZlclN0YXRlICYmIHRyYW5zZmVyU3RhdGUuZ2V0KE5HSF9EQVRBX0tFWSwgbnVsbCkpIHtcbiAgICBjb25zdCBtZXNzYWdlID0gYEFuZ3VsYXIgaHlkcmF0ZWQgJHtuZ0Rldk1vZGUhLmh5ZHJhdGVkQ29tcG9uZW50c30gY29tcG9uZW50KHMpIGAgK1xuICAgICAgICBgYW5kICR7bmdEZXZNb2RlIS5oeWRyYXRlZE5vZGVzfSBub2RlKHMpLCBgICtcbiAgICAgICAgYCR7bmdEZXZNb2RlIS5jb21wb25lbnRzU2tpcHBlZEh5ZHJhdGlvbn0gY29tcG9uZW50KHMpIHdlcmUgc2tpcHBlZC4gYCArXG4gICAgICAgIGBOb3RlOiB0aGlzIGZlYXR1cmUgaXMgaW4gRGV2ZWxvcGVyIFByZXZpZXcgbW9kZS4gYCArXG4gICAgICAgIGBMZWFybiBtb3JlIGF0IGh0dHBzOi8vbmV4dC5hbmd1bGFyLmlvL2d1aWRlL2h5ZHJhdGlvbi5gO1xuICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTpuby1jb25zb2xlXG4gICAgY29uc29sZS5sb2cobWVzc2FnZSk7XG4gIH0gZWxzZSB7XG4gICAgY29uc3QgbWVzc2FnZSA9IGZvcm1hdFJ1bnRpbWVFcnJvcihcbiAgICAgICAgUnVudGltZUVycm9yQ29kZS5NSVNTSU5HX0hZRFJBVElPTl9BTk5PVEFUSU9OUyxcbiAgICAgICAgJ0FuZ3VsYXIgaHlkcmF0aW9uIHdhcyBlbmFibGVkIG9uIHRoZSBjbGllbnQsIGJ1dCB0aGVyZSB3YXMgbm8gJyArXG4gICAgICAgICAgICAnc2VyaWFsaXplZCBpbmZvcm1hdGlvbiBwcmVzZW50IGluIHRoZSBzZXJ2ZXIgcmVzcG9uc2UuICcgK1xuICAgICAgICAgICAgJ01ha2Ugc3VyZSB0aGUgYHByb3ZpZGVDbGllbnRIeWRyYXRpb24oKWAgaXMgaW5jbHVkZWQgaW50byB0aGUgbGlzdCAnICtcbiAgICAgICAgICAgICdvZiBwcm92aWRlcnMgaW4gdGhlIHNlcnZlciBwYXJ0IG9mIHRoZSBhcHBsaWNhdGlvbiBjb25maWd1cmF0aW9uLicpO1xuICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTpuby1jb25zb2xlXG4gICAgY29uc29sZS53YXJuKG1lc3NhZ2UpO1xuICB9XG59XG5cblxuLyoqXG4gKiBSZXR1cm5zIGEgUHJvbWlzZSB0aGF0IGlzIHJlc29sdmVkIHdoZW4gYW4gYXBwbGljYXRpb24gYmVjb21lcyBzdGFibGUuXG4gKi9cbmZ1bmN0aW9uIHdoZW5TdGFibGUoXG4gICAgYXBwUmVmOiBBcHBsaWNhdGlvblJlZiwgcGVuZGluZ1Rhc2tzOiBJbml0aWFsUmVuZGVyUGVuZGluZ1Rhc2tzKTogUHJvbWlzZTx1bmtub3duPiB7XG4gIGNvbnN0IGlzU3RhYmxlUHJvbWlzZSA9IGFwcFJlZi5pc1N0YWJsZS5waXBlKGZpcnN0KChpc1N0YWJsZTogYm9vbGVhbikgPT4gaXNTdGFibGUpKS50b1Byb21pc2UoKTtcbiAgY29uc3QgcGVuZGluZ1Rhc2tzUHJvbWlzZSA9IHBlbmRpbmdUYXNrcy53aGVuQWxsVGFza3NDb21wbGV0ZTtcbiAgcmV0dXJuIFByb21pc2UuYWxsU2V0dGxlZChbaXNTdGFibGVQcm9taXNlLCBwZW5kaW5nVGFza3NQcm9taXNlXSk7XG59XG5cbi8qKlxuICogUmV0dXJucyBhIHNldCBvZiBwcm92aWRlcnMgcmVxdWlyZWQgdG8gc2V0dXAgaHlkcmF0aW9uIHN1cHBvcnRcbiAqIGZvciBhbiBhcHBsaWNhdGlvbiB0aGF0IGlzIHNlcnZlciBzaWRlIHJlbmRlcmVkLiBUaGlzIGZ1bmN0aW9uIGlzXG4gKiBpbmNsdWRlZCBpbnRvIHRoZSBgcHJvdmlkZUNsaWVudEh5ZHJhdGlvbmAgcHVibGljIEFQSSBmdW5jdGlvbiBmcm9tXG4gKiB0aGUgYHBsYXRmb3JtLWJyb3dzZXJgIHBhY2thZ2UuXG4gKlxuICogVGhlIGZ1bmN0aW9uIHNldHMgdXAgYW4gaW50ZXJuYWwgZmxhZyB0aGF0IHdvdWxkIGJlIHJlY29nbml6ZWQgZHVyaW5nXG4gKiB0aGUgc2VydmVyIHNpZGUgcmVuZGVyaW5nIHRpbWUgYXMgd2VsbCwgc28gdGhlcmUgaXMgbm8gbmVlZCB0b1xuICogY29uZmlndXJlIG9yIGNoYW5nZSBhbnl0aGluZyBpbiBOZ1VuaXZlcnNhbCB0byBlbmFibGUgdGhlIGZlYXR1cmUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB3aXRoRG9tSHlkcmF0aW9uKCk6IEVudmlyb25tZW50UHJvdmlkZXJzIHtcbiAgcmV0dXJuIG1ha2VFbnZpcm9ubWVudFByb3ZpZGVycyhbXG4gICAge1xuICAgICAgcHJvdmlkZTogRU5WSVJPTk1FTlRfSU5JVElBTElaRVIsXG4gICAgICB1c2VWYWx1ZTogKCkgPT4ge1xuICAgICAgICAvLyBTaW5jZSB0aGlzIGZ1bmN0aW9uIGlzIHVzZWQgYWNyb3NzIGJvdGggc2VydmVyIGFuZCBjbGllbnQsXG4gICAgICAgIC8vIG1ha2Ugc3VyZSB0aGF0IHRoZSBydW50aW1lIGNvZGUgaXMgb25seSBhZGRlZCB3aGVuIGludm9rZWRcbiAgICAgICAgLy8gb24gdGhlIGNsaWVudC4gTW92aW5nIGZvcndhcmQsIHRoZSBgaXNCcm93c2VyYCBjaGVjayBzaG91bGRcbiAgICAgICAgLy8gYmUgcmVwbGFjZWQgd2l0aCBhIHRyZWUtc2hha2FibGUgYWx0ZXJuYXRpdmUgKGUuZy4gYGlzU2VydmVyYFxuICAgICAgICAvLyBmbGFnKS5cbiAgICAgICAgaWYgKGlzQnJvd3NlcigpKSB7XG4gICAgICAgICAgZW5hYmxlSHlkcmF0aW9uUnVudGltZVN1cHBvcnQoKTtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIG11bHRpOiB0cnVlLFxuICAgIH0sXG4gICAge1xuICAgICAgcHJvdmlkZTogSVNfSFlEUkFUSU9OX0ZFQVRVUkVfRU5BQkxFRCxcbiAgICAgIHVzZVZhbHVlOiB0cnVlLFxuICAgIH0sXG4gICAge1xuICAgICAgcHJvdmlkZTogUFJFU0VSVkVfSE9TVF9DT05URU5ULFxuICAgICAgLy8gUHJlc2VydmUgaG9zdCBlbGVtZW50IGNvbnRlbnQgb25seSBpbiBhIGJyb3dzZXJcbiAgICAgIC8vIGVudmlyb25tZW50LiBPbiBhIHNlcnZlciwgYW4gYXBwbGljYXRpb24gaXMgcmVuZGVyZWRcbiAgICAgIC8vIGZyb20gc2NyYXRjaCwgc28gdGhlIGhvc3QgY29udGVudCBuZWVkcyB0byBiZSBlbXB0eS5cbiAgICAgIHVzZUZhY3Rvcnk6ICgpID0+IGlzQnJvd3NlcigpLFxuICAgIH0sXG4gICAge1xuICAgICAgcHJvdmlkZTogQVBQX0JPT1RTVFJBUF9MSVNURU5FUixcbiAgICAgIHVzZUZhY3Rvcnk6ICgpID0+IHtcbiAgICAgICAgaWYgKGlzQnJvd3NlcigpKSB7XG4gICAgICAgICAgY29uc3QgYXBwUmVmID0gaW5qZWN0KEFwcGxpY2F0aW9uUmVmKTtcbiAgICAgICAgICBjb25zdCBwZW5kaW5nVGFza3MgPSBpbmplY3QoSW5pdGlhbFJlbmRlclBlbmRpbmdUYXNrcyk7XG4gICAgICAgICAgY29uc3QgaW5qZWN0b3IgPSBpbmplY3QoSW5qZWN0b3IpO1xuICAgICAgICAgIHJldHVybiAoKSA9PiB7XG4gICAgICAgICAgICB3aGVuU3RhYmxlKGFwcFJlZiwgcGVuZGluZ1Rhc2tzKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgLy8gV2FpdCB1bnRpbCBhbiBhcHAgYmVjb21lcyBzdGFibGUgYW5kIGNsZWFudXAgYWxsIHZpZXdzIHRoYXRcbiAgICAgICAgICAgICAgLy8gd2VyZSBub3QgY2xhaW1lZCBkdXJpbmcgdGhlIGFwcGxpY2F0aW9uIGJvb3RzdHJhcCBwcm9jZXNzLlxuICAgICAgICAgICAgICAvLyBUaGUgdGltaW5nIGlzIHNpbWlsYXIgdG8gd2hlbiB3ZSBzdGFydCB0aGUgc2VyaWFsaXphdGlvbiBwcm9jZXNzXG4gICAgICAgICAgICAgIC8vIG9uIHRoZSBzZXJ2ZXIuXG4gICAgICAgICAgICAgIGNsZWFudXBEZWh5ZHJhdGVkVmlld3MoYXBwUmVmKTtcblxuICAgICAgICAgICAgICBpZiAodHlwZW9mIG5nRGV2TW9kZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbmdEZXZNb2RlKSB7XG4gICAgICAgICAgICAgICAgcHJpbnRIeWRyYXRpb25JbmZvKGluamVjdG9yKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gKCkgPT4ge307ICAvLyBub29wXG4gICAgICB9LFxuICAgICAgbXVsdGk6IHRydWUsXG4gICAgfVxuICBdKTtcbn1cbiJdfQ==