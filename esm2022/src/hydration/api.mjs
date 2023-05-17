/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { first } from 'rxjs/operators';
import { APP_BOOTSTRAP_LISTENER, ApplicationRef } from '../application_ref';
import { ENABLED_SSR_FEATURES, PLATFORM_ID } from '../application_tokens';
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
import { NgZone } from '../zone';
import { cleanupDehydratedViews } from './cleanup';
import { IS_HYDRATION_DOM_REUSE_ENABLED, PRESERVE_HOST_CONTENT } from './tokens';
import { enableRetrieveHydrationInfoImpl, NGH_DATA_KEY } from './utils';
import { enableFindMatchingDehydratedViewImpl } from './views';
/**
 * Indicates whether the hydration-related code was added,
 * prevents adding it multiple times.
 */
let isHydrationSupportEnabled = false;
/**
 * Defines a period of time that Angular waits for the `ApplicationRef.isStable` to emit `true`.
 * If there was no event with the `true` value during this time, Angular reports a warning.
 */
const APPLICATION_IS_STABLE_TIMEOUT = 10000;
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
function printHydrationStats(injector) {
    const console = injector.get(Console);
    const message = `Angular hydrated ${ngDevMode.hydratedComponents} component(s) ` +
        `and ${ngDevMode.hydratedNodes} node(s), ` +
        `${ngDevMode.componentsSkippedHydration} component(s) were skipped. ` +
        `Note: this feature is in Developer Preview mode. ` +
        `Learn more at https://angular.io/guide/hydration.`;
    // tslint:disable-next-line:no-console
    console.log(message);
}
/**
 * Returns a Promise that is resolved when an application becomes stable.
 */
function whenStable(appRef, pendingTasks, injector) {
    const isStablePromise = appRef.isStable.pipe(first((isStable) => isStable)).toPromise();
    if (typeof ngDevMode !== 'undefined' && ngDevMode) {
        const timeoutTime = APPLICATION_IS_STABLE_TIMEOUT;
        const console = injector.get(Console);
        const ngZone = injector.get(NgZone);
        // The following call should not and does not prevent the app to become stable
        // We cannot use RxJS timer here because the app would remain unstable.
        // This also avoids an extra change detection cycle.
        const timeoutId = ngZone.runOutsideAngular(() => {
            return setTimeout(() => logWarningOnStableTimedout(timeoutTime, console), timeoutTime);
        });
        isStablePromise.finally(() => clearTimeout(timeoutId));
    }
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
            provide: IS_HYDRATION_DOM_REUSE_ENABLED,
            useFactory: () => {
                let isEnabled = true;
                if (isBrowser()) {
                    // On the client, verify that the server response contains
                    // hydration annotations. Otherwise, keep hydration disabled.
                    const transferState = inject(TransferState, { optional: true });
                    isEnabled = !!transferState?.get(NGH_DATA_KEY, null);
                    if (!isEnabled && (typeof ngDevMode !== 'undefined' && ngDevMode)) {
                        const console = inject(Console);
                        const message = formatRuntimeError(-505 /* RuntimeErrorCode.MISSING_HYDRATION_ANNOTATIONS */, 'Angular hydration was requested on the client, but there was no ' +
                            'serialized information present in the server response, ' +
                            'thus hydration was not enabled. ' +
                            'Make sure the `provideClientHydration()` is included into the list ' +
                            'of providers in the server part of the application configuration.');
                        // tslint:disable-next-line:no-console
                        console.warn(message);
                    }
                }
                if (isEnabled) {
                    inject(ENABLED_SSR_FEATURES).add('hydration');
                }
                return isEnabled;
            },
        },
        {
            provide: ENVIRONMENT_INITIALIZER,
            useValue: () => {
                // Since this function is used across both server and client,
                // make sure that the runtime code is only added when invoked
                // on the client. Moving forward, the `isBrowser` check should
                // be replaced with a tree-shakable alternative (e.g. `isServer`
                // flag).
                if (isBrowser() && inject(IS_HYDRATION_DOM_REUSE_ENABLED)) {
                    enableHydrationRuntimeSupport();
                }
            },
            multi: true,
        },
        {
            provide: PRESERVE_HOST_CONTENT,
            useFactory: () => {
                // Preserve host element content only in a browser
                // environment and when hydration is configured properly.
                // On a server, an application is rendered from scratch,
                // so the host content needs to be empty.
                return isBrowser() && inject(IS_HYDRATION_DOM_REUSE_ENABLED);
            }
        },
        {
            provide: APP_BOOTSTRAP_LISTENER,
            useFactory: () => {
                if (isBrowser() && inject(IS_HYDRATION_DOM_REUSE_ENABLED)) {
                    const appRef = inject(ApplicationRef);
                    const pendingTasks = inject(InitialRenderPendingTasks);
                    const injector = inject(Injector);
                    return () => {
                        whenStable(appRef, pendingTasks, injector).then(() => {
                            // Wait until an app becomes stable and cleanup all views that
                            // were not claimed during the application bootstrap process.
                            // The timing is similar to when we start the serialization process
                            // on the server.
                            cleanupDehydratedViews(appRef);
                            if (typeof ngDevMode !== 'undefined' && ngDevMode) {
                                printHydrationStats(injector);
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
/**
 *
 * @param time The time in ms until the stable timedout warning message is logged
 */
function logWarningOnStableTimedout(time, console) {
    const message = `Angular hydration expected the ApplicationRef.isStable() to emit \`true\`, but it ` +
        `didn't happen within ${time}ms. Angular hydration logic depends on the application becoming stable ` +
        `as a signal to complete hydration process.`;
    console.warn(formatRuntimeError(-506 /* RuntimeErrorCode.HYDRATION_STABLE_TIMEDOUT */, message));
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBpLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvaHlkcmF0aW9uL2FwaS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsS0FBSyxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFFckMsT0FBTyxFQUFDLHNCQUFzQixFQUFFLGNBQWMsRUFBQyxNQUFNLG9CQUFvQixDQUFDO0FBQzFFLE9BQU8sRUFBQyxvQkFBb0IsRUFBRSxXQUFXLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUN4RSxPQUFPLEVBQUMsT0FBTyxFQUFDLE1BQU0sWUFBWSxDQUFDO0FBQ25DLE9BQU8sRUFBQyx1QkFBdUIsRUFBd0IsUUFBUSxFQUFFLHdCQUF3QixFQUFDLE1BQU0sT0FBTyxDQUFDO0FBQ3hHLE9BQU8sRUFBQyxNQUFNLEVBQUMsTUFBTSw4QkFBOEIsQ0FBQztBQUNwRCxPQUFPLEVBQUMsa0JBQWtCLEVBQW1CLE1BQU0sV0FBVyxDQUFDO0FBQy9ELE9BQU8sRUFBQyx5QkFBeUIsRUFBQyxNQUFNLGlDQUFpQyxDQUFDO0FBQzFFLE9BQU8sRUFBQyxvQ0FBb0MsRUFBQyxNQUFNLDhCQUE4QixDQUFDO0FBQ2xGLE9BQU8sRUFBQyxtQ0FBbUMsRUFBQyxNQUFNLGlDQUFpQyxDQUFDO0FBQ3BGLE9BQU8sRUFBQyw0Q0FBNEMsRUFBQyxNQUFNLDJDQUEyQyxDQUFDO0FBQ3ZHLE9BQU8sRUFBQyxtQ0FBbUMsRUFBQyxNQUFNLGdDQUFnQyxDQUFDO0FBQ25GLE9BQU8sRUFBQyx1Q0FBdUMsRUFBQyxNQUFNLGtDQUFrQyxDQUFDO0FBQ3pGLE9BQU8sRUFBQyxnQ0FBZ0MsRUFBQyxNQUFNLDhCQUE4QixDQUFDO0FBQzlFLE9BQU8sRUFBQyxhQUFhLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUNoRCxPQUFPLEVBQUMsTUFBTSxFQUFDLE1BQU0sU0FBUyxDQUFDO0FB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QUFFRDs7O0dBR0c7QUFDSCxTQUFTLDBCQUEwQixDQUFDLElBQVksRUFBRSxPQUFnQjtJQUNoRSxNQUFNLE9BQU8sR0FDVCxvRkFBb0Y7UUFDcEYsd0JBQ0ksSUFBSSx5RUFBeUU7UUFDakYsNENBQTRDLENBQUM7SUFFakQsT0FBTyxDQUFDLElBQUksQ0FBQyxrQkFBa0Isd0RBQTZDLE9BQU8sQ0FBQyxDQUFDLENBQUM7QUFDeEYsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge2ZpcnN0fSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5cbmltcG9ydCB7QVBQX0JPT1RTVFJBUF9MSVNURU5FUiwgQXBwbGljYXRpb25SZWZ9IGZyb20gJy4uL2FwcGxpY2F0aW9uX3JlZic7XG5pbXBvcnQge0VOQUJMRURfU1NSX0ZFQVRVUkVTLCBQTEFURk9STV9JRH0gZnJvbSAnLi4vYXBwbGljYXRpb25fdG9rZW5zJztcbmltcG9ydCB7Q29uc29sZX0gZnJvbSAnLi4vY29uc29sZSc7XG5pbXBvcnQge0VOVklST05NRU5UX0lOSVRJQUxJWkVSLCBFbnZpcm9ubWVudFByb3ZpZGVycywgSW5qZWN0b3IsIG1ha2VFbnZpcm9ubWVudFByb3ZpZGVyc30gZnJvbSAnLi4vZGknO1xuaW1wb3J0IHtpbmplY3R9IGZyb20gJy4uL2RpL2luamVjdG9yX2NvbXBhdGliaWxpdHknO1xuaW1wb3J0IHtmb3JtYXRSdW50aW1lRXJyb3IsIFJ1bnRpbWVFcnJvckNvZGV9IGZyb20gJy4uL2Vycm9ycyc7XG5pbXBvcnQge0luaXRpYWxSZW5kZXJQZW5kaW5nVGFza3N9IGZyb20gJy4uL2luaXRpYWxfcmVuZGVyX3BlbmRpbmdfdGFza3MnO1xuaW1wb3J0IHtlbmFibGVMb2NhdGVPckNyZWF0ZUNvbnRhaW5lclJlZkltcGx9IGZyb20gJy4uL2xpbmtlci92aWV3X2NvbnRhaW5lcl9yZWYnO1xuaW1wb3J0IHtlbmFibGVMb2NhdGVPckNyZWF0ZUVsZW1lbnROb2RlSW1wbH0gZnJvbSAnLi4vcmVuZGVyMy9pbnN0cnVjdGlvbnMvZWxlbWVudCc7XG5pbXBvcnQge2VuYWJsZUxvY2F0ZU9yQ3JlYXRlRWxlbWVudENvbnRhaW5lck5vZGVJbXBsfSBmcm9tICcuLi9yZW5kZXIzL2luc3RydWN0aW9ucy9lbGVtZW50X2NvbnRhaW5lcic7XG5pbXBvcnQge2VuYWJsZUFwcGx5Um9vdEVsZW1lbnRUcmFuc2Zvcm1JbXBsfSBmcm9tICcuLi9yZW5kZXIzL2luc3RydWN0aW9ucy9zaGFyZWQnO1xuaW1wb3J0IHtlbmFibGVMb2NhdGVPckNyZWF0ZUNvbnRhaW5lckFuY2hvckltcGx9IGZyb20gJy4uL3JlbmRlcjMvaW5zdHJ1Y3Rpb25zL3RlbXBsYXRlJztcbmltcG9ydCB7ZW5hYmxlTG9jYXRlT3JDcmVhdGVUZXh0Tm9kZUltcGx9IGZyb20gJy4uL3JlbmRlcjMvaW5zdHJ1Y3Rpb25zL3RleHQnO1xuaW1wb3J0IHtUcmFuc2ZlclN0YXRlfSBmcm9tICcuLi90cmFuc2Zlcl9zdGF0ZSc7XG5pbXBvcnQge05nWm9uZX0gZnJvbSAnLi4vem9uZSc7XG5cbmltcG9ydCB7Y2xlYW51cERlaHlkcmF0ZWRWaWV3c30gZnJvbSAnLi9jbGVhbnVwJztcbmltcG9ydCB7SVNfSFlEUkFUSU9OX0RPTV9SRVVTRV9FTkFCTEVELCBQUkVTRVJWRV9IT1NUX0NPTlRFTlR9IGZyb20gJy4vdG9rZW5zJztcbmltcG9ydCB7ZW5hYmxlUmV0cmlldmVIeWRyYXRpb25JbmZvSW1wbCwgTkdIX0RBVEFfS0VZfSBmcm9tICcuL3V0aWxzJztcbmltcG9ydCB7ZW5hYmxlRmluZE1hdGNoaW5nRGVoeWRyYXRlZFZpZXdJbXBsfSBmcm9tICcuL3ZpZXdzJztcblxuXG4vKipcbiAqIEluZGljYXRlcyB3aGV0aGVyIHRoZSBoeWRyYXRpb24tcmVsYXRlZCBjb2RlIHdhcyBhZGRlZCxcbiAqIHByZXZlbnRzIGFkZGluZyBpdCBtdWx0aXBsZSB0aW1lcy5cbiAqL1xubGV0IGlzSHlkcmF0aW9uU3VwcG9ydEVuYWJsZWQgPSBmYWxzZTtcblxuLyoqXG4gKiBEZWZpbmVzIGEgcGVyaW9kIG9mIHRpbWUgdGhhdCBBbmd1bGFyIHdhaXRzIGZvciB0aGUgYEFwcGxpY2F0aW9uUmVmLmlzU3RhYmxlYCB0byBlbWl0IGB0cnVlYC5cbiAqIElmIHRoZXJlIHdhcyBubyBldmVudCB3aXRoIHRoZSBgdHJ1ZWAgdmFsdWUgZHVyaW5nIHRoaXMgdGltZSwgQW5ndWxhciByZXBvcnRzIGEgd2FybmluZy5cbiAqL1xuY29uc3QgQVBQTElDQVRJT05fSVNfU1RBQkxFX1RJTUVPVVQgPSAxMF8wMDA7XG5cbi8qKlxuICogQnJpbmdzIHRoZSBuZWNlc3NhcnkgaHlkcmF0aW9uIGNvZGUgaW4gdHJlZS1zaGFrYWJsZSBtYW5uZXIuXG4gKiBUaGUgY29kZSBpcyBvbmx5IHByZXNlbnQgd2hlbiB0aGUgYHByb3ZpZGVDbGllbnRIeWRyYXRpb25gIGlzXG4gKiBpbnZva2VkLiBPdGhlcndpc2UsIHRoaXMgY29kZSBpcyB0cmVlLXNoYWtlbiBhd2F5IGR1cmluZyB0aGVcbiAqIGJ1aWxkIG9wdGltaXphdGlvbiBzdGVwLlxuICpcbiAqIFRoaXMgdGVjaG5pcXVlIGFsbG93cyB1cyB0byBzd2FwIGltcGxlbWVudGF0aW9ucyBvZiBtZXRob2RzIHNvXG4gKiB0cmVlIHNoYWtpbmcgd29ya3MgYXBwcm9wcmlhdGVseSB3aGVuIGh5ZHJhdGlvbiBpcyBkaXNhYmxlZCBvclxuICogZW5hYmxlZC4gSXQgYnJpbmdzIGluIHRoZSBhcHByb3ByaWF0ZSB2ZXJzaW9uIG9mIHRoZSBtZXRob2QgdGhhdFxuICogc3VwcG9ydHMgaHlkcmF0aW9uIG9ubHkgd2hlbiBlbmFibGVkLlxuICovXG5mdW5jdGlvbiBlbmFibGVIeWRyYXRpb25SdW50aW1lU3VwcG9ydCgpIHtcbiAgaWYgKCFpc0h5ZHJhdGlvblN1cHBvcnRFbmFibGVkKSB7XG4gICAgaXNIeWRyYXRpb25TdXBwb3J0RW5hYmxlZCA9IHRydWU7XG4gICAgZW5hYmxlUmV0cmlldmVIeWRyYXRpb25JbmZvSW1wbCgpO1xuICAgIGVuYWJsZUxvY2F0ZU9yQ3JlYXRlRWxlbWVudE5vZGVJbXBsKCk7XG4gICAgZW5hYmxlTG9jYXRlT3JDcmVhdGVUZXh0Tm9kZUltcGwoKTtcbiAgICBlbmFibGVMb2NhdGVPckNyZWF0ZUVsZW1lbnRDb250YWluZXJOb2RlSW1wbCgpO1xuICAgIGVuYWJsZUxvY2F0ZU9yQ3JlYXRlQ29udGFpbmVyQW5jaG9ySW1wbCgpO1xuICAgIGVuYWJsZUxvY2F0ZU9yQ3JlYXRlQ29udGFpbmVyUmVmSW1wbCgpO1xuICAgIGVuYWJsZUZpbmRNYXRjaGluZ0RlaHlkcmF0ZWRWaWV3SW1wbCgpO1xuICAgIGVuYWJsZUFwcGx5Um9vdEVsZW1lbnRUcmFuc2Zvcm1JbXBsKCk7XG4gIH1cbn1cblxuLyoqXG4gKiBEZXRlY3RzIHdoZXRoZXIgdGhlIGNvZGUgaXMgaW52b2tlZCBpbiBhIGJyb3dzZXIuXG4gKiBMYXRlciBvbiwgdGhpcyBjaGVjayBzaG91bGQgYmUgcmVwbGFjZWQgd2l0aCBhIHRyZWUtc2hha2FibGVcbiAqIGZsYWcgKGUuZy4gYCFpc1NlcnZlcmApLlxuICovXG5mdW5jdGlvbiBpc0Jyb3dzZXIoKTogYm9vbGVhbiB7XG4gIHJldHVybiBpbmplY3QoUExBVEZPUk1fSUQpID09PSAnYnJvd3Nlcic7XG59XG5cbi8qKlxuICogT3V0cHV0cyBhIG1lc3NhZ2Ugd2l0aCBoeWRyYXRpb24gc3RhdHMgaW50byBhIGNvbnNvbGUuXG4gKi9cbmZ1bmN0aW9uIHByaW50SHlkcmF0aW9uU3RhdHMoaW5qZWN0b3I6IEluamVjdG9yKSB7XG4gIGNvbnN0IGNvbnNvbGUgPSBpbmplY3Rvci5nZXQoQ29uc29sZSk7XG4gIGNvbnN0IG1lc3NhZ2UgPSBgQW5ndWxhciBoeWRyYXRlZCAke25nRGV2TW9kZSEuaHlkcmF0ZWRDb21wb25lbnRzfSBjb21wb25lbnQocykgYCArXG4gICAgICBgYW5kICR7bmdEZXZNb2RlIS5oeWRyYXRlZE5vZGVzfSBub2RlKHMpLCBgICtcbiAgICAgIGAke25nRGV2TW9kZSEuY29tcG9uZW50c1NraXBwZWRIeWRyYXRpb259IGNvbXBvbmVudChzKSB3ZXJlIHNraXBwZWQuIGAgK1xuICAgICAgYE5vdGU6IHRoaXMgZmVhdHVyZSBpcyBpbiBEZXZlbG9wZXIgUHJldmlldyBtb2RlLiBgICtcbiAgICAgIGBMZWFybiBtb3JlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9ndWlkZS9oeWRyYXRpb24uYDtcbiAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOm5vLWNvbnNvbGVcbiAgY29uc29sZS5sb2cobWVzc2FnZSk7XG59XG5cblxuLyoqXG4gKiBSZXR1cm5zIGEgUHJvbWlzZSB0aGF0IGlzIHJlc29sdmVkIHdoZW4gYW4gYXBwbGljYXRpb24gYmVjb21lcyBzdGFibGUuXG4gKi9cbmZ1bmN0aW9uIHdoZW5TdGFibGUoXG4gICAgYXBwUmVmOiBBcHBsaWNhdGlvblJlZiwgcGVuZGluZ1Rhc2tzOiBJbml0aWFsUmVuZGVyUGVuZGluZ1Rhc2tzLFxuICAgIGluamVjdG9yOiBJbmplY3Rvcik6IFByb21pc2U8dW5rbm93bj4ge1xuICBjb25zdCBpc1N0YWJsZVByb21pc2UgPSBhcHBSZWYuaXNTdGFibGUucGlwZShmaXJzdCgoaXNTdGFibGU6IGJvb2xlYW4pID0+IGlzU3RhYmxlKSkudG9Qcm9taXNlKCk7XG4gIGlmICh0eXBlb2YgbmdEZXZNb2RlICE9PSAndW5kZWZpbmVkJyAmJiBuZ0Rldk1vZGUpIHtcbiAgICBjb25zdCB0aW1lb3V0VGltZSA9IEFQUExJQ0FUSU9OX0lTX1NUQUJMRV9USU1FT1VUO1xuICAgIGNvbnN0IGNvbnNvbGUgPSBpbmplY3Rvci5nZXQoQ29uc29sZSk7XG4gICAgY29uc3Qgbmdab25lID0gaW5qZWN0b3IuZ2V0KE5nWm9uZSk7XG5cbiAgICAvLyBUaGUgZm9sbG93aW5nIGNhbGwgc2hvdWxkIG5vdCBhbmQgZG9lcyBub3QgcHJldmVudCB0aGUgYXBwIHRvIGJlY29tZSBzdGFibGVcbiAgICAvLyBXZSBjYW5ub3QgdXNlIFJ4SlMgdGltZXIgaGVyZSBiZWNhdXNlIHRoZSBhcHAgd291bGQgcmVtYWluIHVuc3RhYmxlLlxuICAgIC8vIFRoaXMgYWxzbyBhdm9pZHMgYW4gZXh0cmEgY2hhbmdlIGRldGVjdGlvbiBjeWNsZS5cbiAgICBjb25zdCB0aW1lb3V0SWQgPSBuZ1pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4ge1xuICAgICAgcmV0dXJuIHNldFRpbWVvdXQoKCkgPT4gbG9nV2FybmluZ09uU3RhYmxlVGltZWRvdXQodGltZW91dFRpbWUsIGNvbnNvbGUpLCB0aW1lb3V0VGltZSk7XG4gICAgfSk7XG5cbiAgICBpc1N0YWJsZVByb21pc2UuZmluYWxseSgoKSA9PiBjbGVhclRpbWVvdXQodGltZW91dElkKSk7XG4gIH1cblxuICBjb25zdCBwZW5kaW5nVGFza3NQcm9taXNlID0gcGVuZGluZ1Rhc2tzLndoZW5BbGxUYXNrc0NvbXBsZXRlO1xuICByZXR1cm4gUHJvbWlzZS5hbGxTZXR0bGVkKFtpc1N0YWJsZVByb21pc2UsIHBlbmRpbmdUYXNrc1Byb21pc2VdKTtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIGEgc2V0IG9mIHByb3ZpZGVycyByZXF1aXJlZCB0byBzZXR1cCBoeWRyYXRpb24gc3VwcG9ydFxuICogZm9yIGFuIGFwcGxpY2F0aW9uIHRoYXQgaXMgc2VydmVyIHNpZGUgcmVuZGVyZWQuIFRoaXMgZnVuY3Rpb24gaXNcbiAqIGluY2x1ZGVkIGludG8gdGhlIGBwcm92aWRlQ2xpZW50SHlkcmF0aW9uYCBwdWJsaWMgQVBJIGZ1bmN0aW9uIGZyb21cbiAqIHRoZSBgcGxhdGZvcm0tYnJvd3NlcmAgcGFja2FnZS5cbiAqXG4gKiBUaGUgZnVuY3Rpb24gc2V0cyB1cCBhbiBpbnRlcm5hbCBmbGFnIHRoYXQgd291bGQgYmUgcmVjb2duaXplZCBkdXJpbmdcbiAqIHRoZSBzZXJ2ZXIgc2lkZSByZW5kZXJpbmcgdGltZSBhcyB3ZWxsLCBzbyB0aGVyZSBpcyBubyBuZWVkIHRvXG4gKiBjb25maWd1cmUgb3IgY2hhbmdlIGFueXRoaW5nIGluIE5nVW5pdmVyc2FsIHRvIGVuYWJsZSB0aGUgZmVhdHVyZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHdpdGhEb21IeWRyYXRpb24oKTogRW52aXJvbm1lbnRQcm92aWRlcnMge1xuICByZXR1cm4gbWFrZUVudmlyb25tZW50UHJvdmlkZXJzKFtcbiAgICB7XG4gICAgICBwcm92aWRlOiBJU19IWURSQVRJT05fRE9NX1JFVVNFX0VOQUJMRUQsXG4gICAgICB1c2VGYWN0b3J5OiAoKSA9PiB7XG4gICAgICAgIGxldCBpc0VuYWJsZWQgPSB0cnVlO1xuICAgICAgICBpZiAoaXNCcm93c2VyKCkpIHtcbiAgICAgICAgICAvLyBPbiB0aGUgY2xpZW50LCB2ZXJpZnkgdGhhdCB0aGUgc2VydmVyIHJlc3BvbnNlIGNvbnRhaW5zXG4gICAgICAgICAgLy8gaHlkcmF0aW9uIGFubm90YXRpb25zLiBPdGhlcndpc2UsIGtlZXAgaHlkcmF0aW9uIGRpc2FibGVkLlxuICAgICAgICAgIGNvbnN0IHRyYW5zZmVyU3RhdGUgPSBpbmplY3QoVHJhbnNmZXJTdGF0ZSwge29wdGlvbmFsOiB0cnVlfSk7XG4gICAgICAgICAgaXNFbmFibGVkID0gISF0cmFuc2ZlclN0YXRlPy5nZXQoTkdIX0RBVEFfS0VZLCBudWxsKTtcbiAgICAgICAgICBpZiAoIWlzRW5hYmxlZCAmJiAodHlwZW9mIG5nRGV2TW9kZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbmdEZXZNb2RlKSkge1xuICAgICAgICAgICAgY29uc3QgY29uc29sZSA9IGluamVjdChDb25zb2xlKTtcbiAgICAgICAgICAgIGNvbnN0IG1lc3NhZ2UgPSBmb3JtYXRSdW50aW1lRXJyb3IoXG4gICAgICAgICAgICAgICAgUnVudGltZUVycm9yQ29kZS5NSVNTSU5HX0hZRFJBVElPTl9BTk5PVEFUSU9OUyxcbiAgICAgICAgICAgICAgICAnQW5ndWxhciBoeWRyYXRpb24gd2FzIHJlcXVlc3RlZCBvbiB0aGUgY2xpZW50LCBidXQgdGhlcmUgd2FzIG5vICcgK1xuICAgICAgICAgICAgICAgICAgICAnc2VyaWFsaXplZCBpbmZvcm1hdGlvbiBwcmVzZW50IGluIHRoZSBzZXJ2ZXIgcmVzcG9uc2UsICcgK1xuICAgICAgICAgICAgICAgICAgICAndGh1cyBoeWRyYXRpb24gd2FzIG5vdCBlbmFibGVkLiAnICtcbiAgICAgICAgICAgICAgICAgICAgJ01ha2Ugc3VyZSB0aGUgYHByb3ZpZGVDbGllbnRIeWRyYXRpb24oKWAgaXMgaW5jbHVkZWQgaW50byB0aGUgbGlzdCAnICtcbiAgICAgICAgICAgICAgICAgICAgJ29mIHByb3ZpZGVycyBpbiB0aGUgc2VydmVyIHBhcnQgb2YgdGhlIGFwcGxpY2F0aW9uIGNvbmZpZ3VyYXRpb24uJyk7XG4gICAgICAgICAgICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6bm8tY29uc29sZVxuICAgICAgICAgICAgY29uc29sZS53YXJuKG1lc3NhZ2UpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoaXNFbmFibGVkKSB7XG4gICAgICAgICAgaW5qZWN0KEVOQUJMRURfU1NSX0ZFQVRVUkVTKS5hZGQoJ2h5ZHJhdGlvbicpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBpc0VuYWJsZWQ7XG4gICAgICB9LFxuICAgIH0sXG4gICAge1xuICAgICAgcHJvdmlkZTogRU5WSVJPTk1FTlRfSU5JVElBTElaRVIsXG4gICAgICB1c2VWYWx1ZTogKCkgPT4ge1xuICAgICAgICAvLyBTaW5jZSB0aGlzIGZ1bmN0aW9uIGlzIHVzZWQgYWNyb3NzIGJvdGggc2VydmVyIGFuZCBjbGllbnQsXG4gICAgICAgIC8vIG1ha2Ugc3VyZSB0aGF0IHRoZSBydW50aW1lIGNvZGUgaXMgb25seSBhZGRlZCB3aGVuIGludm9rZWRcbiAgICAgICAgLy8gb24gdGhlIGNsaWVudC4gTW92aW5nIGZvcndhcmQsIHRoZSBgaXNCcm93c2VyYCBjaGVjayBzaG91bGRcbiAgICAgICAgLy8gYmUgcmVwbGFjZWQgd2l0aCBhIHRyZWUtc2hha2FibGUgYWx0ZXJuYXRpdmUgKGUuZy4gYGlzU2VydmVyYFxuICAgICAgICAvLyBmbGFnKS5cbiAgICAgICAgaWYgKGlzQnJvd3NlcigpICYmIGluamVjdChJU19IWURSQVRJT05fRE9NX1JFVVNFX0VOQUJMRUQpKSB7XG4gICAgICAgICAgZW5hYmxlSHlkcmF0aW9uUnVudGltZVN1cHBvcnQoKTtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIG11bHRpOiB0cnVlLFxuICAgIH0sXG4gICAge1xuICAgICAgcHJvdmlkZTogUFJFU0VSVkVfSE9TVF9DT05URU5ULFxuICAgICAgdXNlRmFjdG9yeTogKCkgPT4ge1xuICAgICAgICAvLyBQcmVzZXJ2ZSBob3N0IGVsZW1lbnQgY29udGVudCBvbmx5IGluIGEgYnJvd3NlclxuICAgICAgICAvLyBlbnZpcm9ubWVudCBhbmQgd2hlbiBoeWRyYXRpb24gaXMgY29uZmlndXJlZCBwcm9wZXJseS5cbiAgICAgICAgLy8gT24gYSBzZXJ2ZXIsIGFuIGFwcGxpY2F0aW9uIGlzIHJlbmRlcmVkIGZyb20gc2NyYXRjaCxcbiAgICAgICAgLy8gc28gdGhlIGhvc3QgY29udGVudCBuZWVkcyB0byBiZSBlbXB0eS5cbiAgICAgICAgcmV0dXJuIGlzQnJvd3NlcigpICYmIGluamVjdChJU19IWURSQVRJT05fRE9NX1JFVVNFX0VOQUJMRUQpO1xuICAgICAgfVxuICAgIH0sXG4gICAge1xuICAgICAgcHJvdmlkZTogQVBQX0JPT1RTVFJBUF9MSVNURU5FUixcbiAgICAgIHVzZUZhY3Rvcnk6ICgpID0+IHtcbiAgICAgICAgaWYgKGlzQnJvd3NlcigpICYmIGluamVjdChJU19IWURSQVRJT05fRE9NX1JFVVNFX0VOQUJMRUQpKSB7XG4gICAgICAgICAgY29uc3QgYXBwUmVmID0gaW5qZWN0KEFwcGxpY2F0aW9uUmVmKTtcbiAgICAgICAgICBjb25zdCBwZW5kaW5nVGFza3MgPSBpbmplY3QoSW5pdGlhbFJlbmRlclBlbmRpbmdUYXNrcyk7XG4gICAgICAgICAgY29uc3QgaW5qZWN0b3IgPSBpbmplY3QoSW5qZWN0b3IpO1xuICAgICAgICAgIHJldHVybiAoKSA9PiB7XG4gICAgICAgICAgICB3aGVuU3RhYmxlKGFwcFJlZiwgcGVuZGluZ1Rhc2tzLCBpbmplY3RvcikudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgIC8vIFdhaXQgdW50aWwgYW4gYXBwIGJlY29tZXMgc3RhYmxlIGFuZCBjbGVhbnVwIGFsbCB2aWV3cyB0aGF0XG4gICAgICAgICAgICAgIC8vIHdlcmUgbm90IGNsYWltZWQgZHVyaW5nIHRoZSBhcHBsaWNhdGlvbiBib290c3RyYXAgcHJvY2Vzcy5cbiAgICAgICAgICAgICAgLy8gVGhlIHRpbWluZyBpcyBzaW1pbGFyIHRvIHdoZW4gd2Ugc3RhcnQgdGhlIHNlcmlhbGl6YXRpb24gcHJvY2Vzc1xuICAgICAgICAgICAgICAvLyBvbiB0aGUgc2VydmVyLlxuICAgICAgICAgICAgICBjbGVhbnVwRGVoeWRyYXRlZFZpZXdzKGFwcFJlZik7XG5cbiAgICAgICAgICAgICAgaWYgKHR5cGVvZiBuZ0Rldk1vZGUgIT09ICd1bmRlZmluZWQnICYmIG5nRGV2TW9kZSkge1xuICAgICAgICAgICAgICAgIHByaW50SHlkcmF0aW9uU3RhdHMoaW5qZWN0b3IpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAoKSA9PiB7fTsgIC8vIG5vb3BcbiAgICAgIH0sXG4gICAgICBtdWx0aTogdHJ1ZSxcbiAgICB9XG4gIF0pO1xufVxuXG4vKipcbiAqXG4gKiBAcGFyYW0gdGltZSBUaGUgdGltZSBpbiBtcyB1bnRpbCB0aGUgc3RhYmxlIHRpbWVkb3V0IHdhcm5pbmcgbWVzc2FnZSBpcyBsb2dnZWRcbiAqL1xuZnVuY3Rpb24gbG9nV2FybmluZ09uU3RhYmxlVGltZWRvdXQodGltZTogbnVtYmVyLCBjb25zb2xlOiBDb25zb2xlKTogdm9pZCB7XG4gIGNvbnN0IG1lc3NhZ2UgPVxuICAgICAgYEFuZ3VsYXIgaHlkcmF0aW9uIGV4cGVjdGVkIHRoZSBBcHBsaWNhdGlvblJlZi5pc1N0YWJsZSgpIHRvIGVtaXQgXFxgdHJ1ZVxcYCwgYnV0IGl0IGAgK1xuICAgICAgYGRpZG4ndCBoYXBwZW4gd2l0aGluICR7XG4gICAgICAgICAgdGltZX1tcy4gQW5ndWxhciBoeWRyYXRpb24gbG9naWMgZGVwZW5kcyBvbiB0aGUgYXBwbGljYXRpb24gYmVjb21pbmcgc3RhYmxlIGAgK1xuICAgICAgYGFzIGEgc2lnbmFsIHRvIGNvbXBsZXRlIGh5ZHJhdGlvbiBwcm9jZXNzLmA7XG5cbiAgY29uc29sZS53YXJuKGZvcm1hdFJ1bnRpbWVFcnJvcihSdW50aW1lRXJyb3JDb2RlLkhZRFJBVElPTl9TVEFCTEVfVElNRURPVVQsIG1lc3NhZ2UpKTtcbn1cbiJdfQ==