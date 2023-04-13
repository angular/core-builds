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
        `Learn more at https://next.angular.io/guide/hydration.`;
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
                    if (!isEnabled) {
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
                        whenStable(appRef, pendingTasks).then(() => {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBpLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvaHlkcmF0aW9uL2FwaS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsS0FBSyxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFFckMsT0FBTyxFQUFDLHNCQUFzQixFQUFFLGNBQWMsRUFBQyxNQUFNLG9CQUFvQixDQUFDO0FBQzFFLE9BQU8sRUFBQyxvQkFBb0IsRUFBRSxXQUFXLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUN4RSxPQUFPLEVBQUMsT0FBTyxFQUFDLE1BQU0sWUFBWSxDQUFDO0FBQ25DLE9BQU8sRUFBQyx1QkFBdUIsRUFBd0IsUUFBUSxFQUFFLHdCQUF3QixFQUFDLE1BQU0sT0FBTyxDQUFDO0FBQ3hHLE9BQU8sRUFBQyxNQUFNLEVBQUMsTUFBTSw4QkFBOEIsQ0FBQztBQUNwRCxPQUFPLEVBQUMsa0JBQWtCLEVBQW1CLE1BQU0sV0FBVyxDQUFDO0FBQy9ELE9BQU8sRUFBQyx5QkFBeUIsRUFBQyxNQUFNLGlDQUFpQyxDQUFDO0FBQzFFLE9BQU8sRUFBQyxvQ0FBb0MsRUFBQyxNQUFNLDhCQUE4QixDQUFDO0FBQ2xGLE9BQU8sRUFBQyxtQ0FBbUMsRUFBQyxNQUFNLGlDQUFpQyxDQUFDO0FBQ3BGLE9BQU8sRUFBQyw0Q0FBNEMsRUFBQyxNQUFNLDJDQUEyQyxDQUFDO0FBQ3ZHLE9BQU8sRUFBQyxtQ0FBbUMsRUFBQyxNQUFNLGdDQUFnQyxDQUFDO0FBQ25GLE9BQU8sRUFBQyx1Q0FBdUMsRUFBQyxNQUFNLGtDQUFrQyxDQUFDO0FBQ3pGLE9BQU8sRUFBQyxnQ0FBZ0MsRUFBQyxNQUFNLDhCQUE4QixDQUFDO0FBQzlFLE9BQU8sRUFBQyxhQUFhLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUVoRCxPQUFPLEVBQUMsc0JBQXNCLEVBQUMsTUFBTSxXQUFXLENBQUM7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aUJBQWlCOzRCQUNqQixzQkFBc0IsQ0FBQyxNQUFNLENBQUMsQ0FBQzs0QkFFL0IsSUFBSSxPQUFPLFNBQVMsS0FBSyxXQUFXLElBQUksU0FBUyxFQUFFO2dDQUNqRCxtQkFBbUIsQ0FBQyxRQUFRLENBQUMsQ0FBQzs2QkFDL0I7d0JBQ0gsQ0FBQyxDQUFDLENBQUM7b0JBQ0wsQ0FBQyxDQUFDO2lCQUNIO2dCQUNELE9BQU8sR0FBRyxFQUFFLEdBQUUsQ0FBQyxDQUFDLENBQUUsT0FBTztZQUMzQixDQUFDO1lBQ0QsS0FBSyxFQUFFLElBQUk7U0FDWjtLQUNGLENBQUMsQ0FBQztBQUNMLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtmaXJzdH0gZnJvbSAncnhqcy9vcGVyYXRvcnMnO1xuXG5pbXBvcnQge0FQUF9CT09UU1RSQVBfTElTVEVORVIsIEFwcGxpY2F0aW9uUmVmfSBmcm9tICcuLi9hcHBsaWNhdGlvbl9yZWYnO1xuaW1wb3J0IHtFTkFCTEVEX1NTUl9GRUFUVVJFUywgUExBVEZPUk1fSUR9IGZyb20gJy4uL2FwcGxpY2F0aW9uX3Rva2Vucyc7XG5pbXBvcnQge0NvbnNvbGV9IGZyb20gJy4uL2NvbnNvbGUnO1xuaW1wb3J0IHtFTlZJUk9OTUVOVF9JTklUSUFMSVpFUiwgRW52aXJvbm1lbnRQcm92aWRlcnMsIEluamVjdG9yLCBtYWtlRW52aXJvbm1lbnRQcm92aWRlcnN9IGZyb20gJy4uL2RpJztcbmltcG9ydCB7aW5qZWN0fSBmcm9tICcuLi9kaS9pbmplY3Rvcl9jb21wYXRpYmlsaXR5JztcbmltcG9ydCB7Zm9ybWF0UnVudGltZUVycm9yLCBSdW50aW1lRXJyb3JDb2RlfSBmcm9tICcuLi9lcnJvcnMnO1xuaW1wb3J0IHtJbml0aWFsUmVuZGVyUGVuZGluZ1Rhc2tzfSBmcm9tICcuLi9pbml0aWFsX3JlbmRlcl9wZW5kaW5nX3Rhc2tzJztcbmltcG9ydCB7ZW5hYmxlTG9jYXRlT3JDcmVhdGVDb250YWluZXJSZWZJbXBsfSBmcm9tICcuLi9saW5rZXIvdmlld19jb250YWluZXJfcmVmJztcbmltcG9ydCB7ZW5hYmxlTG9jYXRlT3JDcmVhdGVFbGVtZW50Tm9kZUltcGx9IGZyb20gJy4uL3JlbmRlcjMvaW5zdHJ1Y3Rpb25zL2VsZW1lbnQnO1xuaW1wb3J0IHtlbmFibGVMb2NhdGVPckNyZWF0ZUVsZW1lbnRDb250YWluZXJOb2RlSW1wbH0gZnJvbSAnLi4vcmVuZGVyMy9pbnN0cnVjdGlvbnMvZWxlbWVudF9jb250YWluZXInO1xuaW1wb3J0IHtlbmFibGVBcHBseVJvb3RFbGVtZW50VHJhbnNmb3JtSW1wbH0gZnJvbSAnLi4vcmVuZGVyMy9pbnN0cnVjdGlvbnMvc2hhcmVkJztcbmltcG9ydCB7ZW5hYmxlTG9jYXRlT3JDcmVhdGVDb250YWluZXJBbmNob3JJbXBsfSBmcm9tICcuLi9yZW5kZXIzL2luc3RydWN0aW9ucy90ZW1wbGF0ZSc7XG5pbXBvcnQge2VuYWJsZUxvY2F0ZU9yQ3JlYXRlVGV4dE5vZGVJbXBsfSBmcm9tICcuLi9yZW5kZXIzL2luc3RydWN0aW9ucy90ZXh0JztcbmltcG9ydCB7VHJhbnNmZXJTdGF0ZX0gZnJvbSAnLi4vdHJhbnNmZXJfc3RhdGUnO1xuXG5pbXBvcnQge2NsZWFudXBEZWh5ZHJhdGVkVmlld3N9IGZyb20gJy4vY2xlYW51cCc7XG5pbXBvcnQge0lTX0hZRFJBVElPTl9ET01fUkVVU0VfRU5BQkxFRCwgUFJFU0VSVkVfSE9TVF9DT05URU5UfSBmcm9tICcuL3Rva2Vucyc7XG5pbXBvcnQge2VuYWJsZVJldHJpZXZlSHlkcmF0aW9uSW5mb0ltcGwsIE5HSF9EQVRBX0tFWX0gZnJvbSAnLi91dGlscyc7XG5pbXBvcnQge2VuYWJsZUZpbmRNYXRjaGluZ0RlaHlkcmF0ZWRWaWV3SW1wbH0gZnJvbSAnLi92aWV3cyc7XG5cblxuLyoqXG4gKiBJbmRpY2F0ZXMgd2hldGhlciB0aGUgaHlkcmF0aW9uLXJlbGF0ZWQgY29kZSB3YXMgYWRkZWQsXG4gKiBwcmV2ZW50cyBhZGRpbmcgaXQgbXVsdGlwbGUgdGltZXMuXG4gKi9cbmxldCBpc0h5ZHJhdGlvblN1cHBvcnRFbmFibGVkID0gZmFsc2U7XG5cbi8qKlxuICogQnJpbmdzIHRoZSBuZWNlc3NhcnkgaHlkcmF0aW9uIGNvZGUgaW4gdHJlZS1zaGFrYWJsZSBtYW5uZXIuXG4gKiBUaGUgY29kZSBpcyBvbmx5IHByZXNlbnQgd2hlbiB0aGUgYHByb3ZpZGVDbGllbnRIeWRyYXRpb25gIGlzXG4gKiBpbnZva2VkLiBPdGhlcndpc2UsIHRoaXMgY29kZSBpcyB0cmVlLXNoYWtlbiBhd2F5IGR1cmluZyB0aGVcbiAqIGJ1aWxkIG9wdGltaXphdGlvbiBzdGVwLlxuICpcbiAqIFRoaXMgdGVjaG5pcXVlIGFsbG93cyB1cyB0byBzd2FwIGltcGxlbWVudGF0aW9ucyBvZiBtZXRob2RzIHNvXG4gKiB0cmVlIHNoYWtpbmcgd29ya3MgYXBwcm9wcmlhdGVseSB3aGVuIGh5ZHJhdGlvbiBpcyBkaXNhYmxlZCBvclxuICogZW5hYmxlZC4gSXQgYnJpbmdzIGluIHRoZSBhcHByb3ByaWF0ZSB2ZXJzaW9uIG9mIHRoZSBtZXRob2QgdGhhdFxuICogc3VwcG9ydHMgaHlkcmF0aW9uIG9ubHkgd2hlbiBlbmFibGVkLlxuICovXG5mdW5jdGlvbiBlbmFibGVIeWRyYXRpb25SdW50aW1lU3VwcG9ydCgpIHtcbiAgaWYgKCFpc0h5ZHJhdGlvblN1cHBvcnRFbmFibGVkKSB7XG4gICAgaXNIeWRyYXRpb25TdXBwb3J0RW5hYmxlZCA9IHRydWU7XG4gICAgZW5hYmxlUmV0cmlldmVIeWRyYXRpb25JbmZvSW1wbCgpO1xuICAgIGVuYWJsZUxvY2F0ZU9yQ3JlYXRlRWxlbWVudE5vZGVJbXBsKCk7XG4gICAgZW5hYmxlTG9jYXRlT3JDcmVhdGVUZXh0Tm9kZUltcGwoKTtcbiAgICBlbmFibGVMb2NhdGVPckNyZWF0ZUVsZW1lbnRDb250YWluZXJOb2RlSW1wbCgpO1xuICAgIGVuYWJsZUxvY2F0ZU9yQ3JlYXRlQ29udGFpbmVyQW5jaG9ySW1wbCgpO1xuICAgIGVuYWJsZUxvY2F0ZU9yQ3JlYXRlQ29udGFpbmVyUmVmSW1wbCgpO1xuICAgIGVuYWJsZUZpbmRNYXRjaGluZ0RlaHlkcmF0ZWRWaWV3SW1wbCgpO1xuICAgIGVuYWJsZUFwcGx5Um9vdEVsZW1lbnRUcmFuc2Zvcm1JbXBsKCk7XG4gIH1cbn1cblxuLyoqXG4gKiBEZXRlY3RzIHdoZXRoZXIgdGhlIGNvZGUgaXMgaW52b2tlZCBpbiBhIGJyb3dzZXIuXG4gKiBMYXRlciBvbiwgdGhpcyBjaGVjayBzaG91bGQgYmUgcmVwbGFjZWQgd2l0aCBhIHRyZWUtc2hha2FibGVcbiAqIGZsYWcgKGUuZy4gYCFpc1NlcnZlcmApLlxuICovXG5mdW5jdGlvbiBpc0Jyb3dzZXIoKTogYm9vbGVhbiB7XG4gIHJldHVybiBpbmplY3QoUExBVEZPUk1fSUQpID09PSAnYnJvd3Nlcic7XG59XG5cbi8qKlxuICogT3V0cHV0cyBhIG1lc3NhZ2Ugd2l0aCBoeWRyYXRpb24gc3RhdHMgaW50byBhIGNvbnNvbGUuXG4gKi9cbmZ1bmN0aW9uIHByaW50SHlkcmF0aW9uU3RhdHMoaW5qZWN0b3I6IEluamVjdG9yKSB7XG4gIGNvbnN0IGNvbnNvbGUgPSBpbmplY3Rvci5nZXQoQ29uc29sZSk7XG4gIGNvbnN0IG1lc3NhZ2UgPSBgQW5ndWxhciBoeWRyYXRlZCAke25nRGV2TW9kZSEuaHlkcmF0ZWRDb21wb25lbnRzfSBjb21wb25lbnQocykgYCArXG4gICAgICBgYW5kICR7bmdEZXZNb2RlIS5oeWRyYXRlZE5vZGVzfSBub2RlKHMpLCBgICtcbiAgICAgIGAke25nRGV2TW9kZSEuY29tcG9uZW50c1NraXBwZWRIeWRyYXRpb259IGNvbXBvbmVudChzKSB3ZXJlIHNraXBwZWQuIGAgK1xuICAgICAgYE5vdGU6IHRoaXMgZmVhdHVyZSBpcyBpbiBEZXZlbG9wZXIgUHJldmlldyBtb2RlLiBgICtcbiAgICAgIGBMZWFybiBtb3JlIGF0IGh0dHBzOi8vbmV4dC5hbmd1bGFyLmlvL2d1aWRlL2h5ZHJhdGlvbi5gO1xuICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6bm8tY29uc29sZVxuICBjb25zb2xlLmxvZyhtZXNzYWdlKTtcbn1cblxuXG4vKipcbiAqIFJldHVybnMgYSBQcm9taXNlIHRoYXQgaXMgcmVzb2x2ZWQgd2hlbiBhbiBhcHBsaWNhdGlvbiBiZWNvbWVzIHN0YWJsZS5cbiAqL1xuZnVuY3Rpb24gd2hlblN0YWJsZShcbiAgICBhcHBSZWY6IEFwcGxpY2F0aW9uUmVmLCBwZW5kaW5nVGFza3M6IEluaXRpYWxSZW5kZXJQZW5kaW5nVGFza3MpOiBQcm9taXNlPHVua25vd24+IHtcbiAgY29uc3QgaXNTdGFibGVQcm9taXNlID0gYXBwUmVmLmlzU3RhYmxlLnBpcGUoZmlyc3QoKGlzU3RhYmxlOiBib29sZWFuKSA9PiBpc1N0YWJsZSkpLnRvUHJvbWlzZSgpO1xuICBjb25zdCBwZW5kaW5nVGFza3NQcm9taXNlID0gcGVuZGluZ1Rhc2tzLndoZW5BbGxUYXNrc0NvbXBsZXRlO1xuICByZXR1cm4gUHJvbWlzZS5hbGxTZXR0bGVkKFtpc1N0YWJsZVByb21pc2UsIHBlbmRpbmdUYXNrc1Byb21pc2VdKTtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIGEgc2V0IG9mIHByb3ZpZGVycyByZXF1aXJlZCB0byBzZXR1cCBoeWRyYXRpb24gc3VwcG9ydFxuICogZm9yIGFuIGFwcGxpY2F0aW9uIHRoYXQgaXMgc2VydmVyIHNpZGUgcmVuZGVyZWQuIFRoaXMgZnVuY3Rpb24gaXNcbiAqIGluY2x1ZGVkIGludG8gdGhlIGBwcm92aWRlQ2xpZW50SHlkcmF0aW9uYCBwdWJsaWMgQVBJIGZ1bmN0aW9uIGZyb21cbiAqIHRoZSBgcGxhdGZvcm0tYnJvd3NlcmAgcGFja2FnZS5cbiAqXG4gKiBUaGUgZnVuY3Rpb24gc2V0cyB1cCBhbiBpbnRlcm5hbCBmbGFnIHRoYXQgd291bGQgYmUgcmVjb2duaXplZCBkdXJpbmdcbiAqIHRoZSBzZXJ2ZXIgc2lkZSByZW5kZXJpbmcgdGltZSBhcyB3ZWxsLCBzbyB0aGVyZSBpcyBubyBuZWVkIHRvXG4gKiBjb25maWd1cmUgb3IgY2hhbmdlIGFueXRoaW5nIGluIE5nVW5pdmVyc2FsIHRvIGVuYWJsZSB0aGUgZmVhdHVyZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHdpdGhEb21IeWRyYXRpb24oKTogRW52aXJvbm1lbnRQcm92aWRlcnMge1xuICByZXR1cm4gbWFrZUVudmlyb25tZW50UHJvdmlkZXJzKFtcbiAgICB7XG4gICAgICBwcm92aWRlOiBJU19IWURSQVRJT05fRE9NX1JFVVNFX0VOQUJMRUQsXG4gICAgICB1c2VGYWN0b3J5OiAoKSA9PiB7XG4gICAgICAgIGxldCBpc0VuYWJsZWQgPSB0cnVlO1xuICAgICAgICBpZiAoaXNCcm93c2VyKCkpIHtcbiAgICAgICAgICAvLyBPbiB0aGUgY2xpZW50LCB2ZXJpZnkgdGhhdCB0aGUgc2VydmVyIHJlc3BvbnNlIGNvbnRhaW5zXG4gICAgICAgICAgLy8gaHlkcmF0aW9uIGFubm90YXRpb25zLiBPdGhlcndpc2UsIGtlZXAgaHlkcmF0aW9uIGRpc2FibGVkLlxuICAgICAgICAgIGNvbnN0IHRyYW5zZmVyU3RhdGUgPSBpbmplY3QoVHJhbnNmZXJTdGF0ZSwge29wdGlvbmFsOiB0cnVlfSk7XG4gICAgICAgICAgaXNFbmFibGVkID0gISF0cmFuc2ZlclN0YXRlPy5nZXQoTkdIX0RBVEFfS0VZLCBudWxsKTtcbiAgICAgICAgICBpZiAoIWlzRW5hYmxlZCkge1xuICAgICAgICAgICAgY29uc3QgY29uc29sZSA9IGluamVjdChDb25zb2xlKTtcbiAgICAgICAgICAgIGNvbnN0IG1lc3NhZ2UgPSBmb3JtYXRSdW50aW1lRXJyb3IoXG4gICAgICAgICAgICAgICAgUnVudGltZUVycm9yQ29kZS5NSVNTSU5HX0hZRFJBVElPTl9BTk5PVEFUSU9OUyxcbiAgICAgICAgICAgICAgICAnQW5ndWxhciBoeWRyYXRpb24gd2FzIHJlcXVlc3RlZCBvbiB0aGUgY2xpZW50LCBidXQgdGhlcmUgd2FzIG5vICcgK1xuICAgICAgICAgICAgICAgICAgICAnc2VyaWFsaXplZCBpbmZvcm1hdGlvbiBwcmVzZW50IGluIHRoZSBzZXJ2ZXIgcmVzcG9uc2UsICcgK1xuICAgICAgICAgICAgICAgICAgICAndGh1cyBoeWRyYXRpb24gd2FzIG5vdCBlbmFibGVkLiAnICtcbiAgICAgICAgICAgICAgICAgICAgJ01ha2Ugc3VyZSB0aGUgYHByb3ZpZGVDbGllbnRIeWRyYXRpb24oKWAgaXMgaW5jbHVkZWQgaW50byB0aGUgbGlzdCAnICtcbiAgICAgICAgICAgICAgICAgICAgJ29mIHByb3ZpZGVycyBpbiB0aGUgc2VydmVyIHBhcnQgb2YgdGhlIGFwcGxpY2F0aW9uIGNvbmZpZ3VyYXRpb24uJyk7XG4gICAgICAgICAgICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6bm8tY29uc29sZVxuICAgICAgICAgICAgY29uc29sZS53YXJuKG1lc3NhZ2UpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoaXNFbmFibGVkKSB7XG4gICAgICAgICAgaW5qZWN0KEVOQUJMRURfU1NSX0ZFQVRVUkVTKS5hZGQoJ2h5ZHJhdGlvbicpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBpc0VuYWJsZWQ7XG4gICAgICB9LFxuICAgIH0sXG4gICAge1xuICAgICAgcHJvdmlkZTogRU5WSVJPTk1FTlRfSU5JVElBTElaRVIsXG4gICAgICB1c2VWYWx1ZTogKCkgPT4ge1xuICAgICAgICAvLyBTaW5jZSB0aGlzIGZ1bmN0aW9uIGlzIHVzZWQgYWNyb3NzIGJvdGggc2VydmVyIGFuZCBjbGllbnQsXG4gICAgICAgIC8vIG1ha2Ugc3VyZSB0aGF0IHRoZSBydW50aW1lIGNvZGUgaXMgb25seSBhZGRlZCB3aGVuIGludm9rZWRcbiAgICAgICAgLy8gb24gdGhlIGNsaWVudC4gTW92aW5nIGZvcndhcmQsIHRoZSBgaXNCcm93c2VyYCBjaGVjayBzaG91bGRcbiAgICAgICAgLy8gYmUgcmVwbGFjZWQgd2l0aCBhIHRyZWUtc2hha2FibGUgYWx0ZXJuYXRpdmUgKGUuZy4gYGlzU2VydmVyYFxuICAgICAgICAvLyBmbGFnKS5cbiAgICAgICAgaWYgKGlzQnJvd3NlcigpICYmIGluamVjdChJU19IWURSQVRJT05fRE9NX1JFVVNFX0VOQUJMRUQpKSB7XG4gICAgICAgICAgZW5hYmxlSHlkcmF0aW9uUnVudGltZVN1cHBvcnQoKTtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIG11bHRpOiB0cnVlLFxuICAgIH0sXG4gICAge1xuICAgICAgcHJvdmlkZTogUFJFU0VSVkVfSE9TVF9DT05URU5ULFxuICAgICAgdXNlRmFjdG9yeTogKCkgPT4ge1xuICAgICAgICAvLyBQcmVzZXJ2ZSBob3N0IGVsZW1lbnQgY29udGVudCBvbmx5IGluIGEgYnJvd3NlclxuICAgICAgICAvLyBlbnZpcm9ubWVudCBhbmQgd2hlbiBoeWRyYXRpb24gaXMgY29uZmlndXJlZCBwcm9wZXJseS5cbiAgICAgICAgLy8gT24gYSBzZXJ2ZXIsIGFuIGFwcGxpY2F0aW9uIGlzIHJlbmRlcmVkIGZyb20gc2NyYXRjaCxcbiAgICAgICAgLy8gc28gdGhlIGhvc3QgY29udGVudCBuZWVkcyB0byBiZSBlbXB0eS5cbiAgICAgICAgcmV0dXJuIGlzQnJvd3NlcigpICYmIGluamVjdChJU19IWURSQVRJT05fRE9NX1JFVVNFX0VOQUJMRUQpO1xuICAgICAgfVxuICAgIH0sXG4gICAge1xuICAgICAgcHJvdmlkZTogQVBQX0JPT1RTVFJBUF9MSVNURU5FUixcbiAgICAgIHVzZUZhY3Rvcnk6ICgpID0+IHtcbiAgICAgICAgaWYgKGlzQnJvd3NlcigpICYmIGluamVjdChJU19IWURSQVRJT05fRE9NX1JFVVNFX0VOQUJMRUQpKSB7XG4gICAgICAgICAgY29uc3QgYXBwUmVmID0gaW5qZWN0KEFwcGxpY2F0aW9uUmVmKTtcbiAgICAgICAgICBjb25zdCBwZW5kaW5nVGFza3MgPSBpbmplY3QoSW5pdGlhbFJlbmRlclBlbmRpbmdUYXNrcyk7XG4gICAgICAgICAgY29uc3QgaW5qZWN0b3IgPSBpbmplY3QoSW5qZWN0b3IpO1xuICAgICAgICAgIHJldHVybiAoKSA9PiB7XG4gICAgICAgICAgICB3aGVuU3RhYmxlKGFwcFJlZiwgcGVuZGluZ1Rhc2tzKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgLy8gV2FpdCB1bnRpbCBhbiBhcHAgYmVjb21lcyBzdGFibGUgYW5kIGNsZWFudXAgYWxsIHZpZXdzIHRoYXRcbiAgICAgICAgICAgICAgLy8gd2VyZSBub3QgY2xhaW1lZCBkdXJpbmcgdGhlIGFwcGxpY2F0aW9uIGJvb3RzdHJhcCBwcm9jZXNzLlxuICAgICAgICAgICAgICAvLyBUaGUgdGltaW5nIGlzIHNpbWlsYXIgdG8gd2hlbiB3ZSBzdGFydCB0aGUgc2VyaWFsaXphdGlvbiBwcm9jZXNzXG4gICAgICAgICAgICAgIC8vIG9uIHRoZSBzZXJ2ZXIuXG4gICAgICAgICAgICAgIGNsZWFudXBEZWh5ZHJhdGVkVmlld3MoYXBwUmVmKTtcblxuICAgICAgICAgICAgICBpZiAodHlwZW9mIG5nRGV2TW9kZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbmdEZXZNb2RlKSB7XG4gICAgICAgICAgICAgICAgcHJpbnRIeWRyYXRpb25TdGF0cyhpbmplY3Rvcik7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuICgpID0+IHt9OyAgLy8gbm9vcFxuICAgICAgfSxcbiAgICAgIG11bHRpOiB0cnVlLFxuICAgIH1cbiAgXSk7XG59XG4iXX0=