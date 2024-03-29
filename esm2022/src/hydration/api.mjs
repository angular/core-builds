/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { APP_BOOTSTRAP_LISTENER, ApplicationRef, whenStable } from '../application/application_ref';
import { Console } from '../console';
import { ENVIRONMENT_INITIALIZER, Injector, makeEnvironmentProviders } from '../di';
import { inject } from '../di/injector_compatibility';
import { formatRuntimeError, RuntimeError } from '../errors';
import { enableLocateOrCreateContainerRefImpl } from '../linker/view_container_ref';
import { enableLocateOrCreateI18nNodeImpl } from '../render3/i18n/i18n_apply';
import { enableLocateOrCreateElementNodeImpl } from '../render3/instructions/element';
import { enableLocateOrCreateElementContainerNodeImpl } from '../render3/instructions/element_container';
import { enableApplyRootElementTransformImpl } from '../render3/instructions/shared';
import { enableLocateOrCreateContainerAnchorImpl } from '../render3/instructions/template';
import { enableLocateOrCreateTextNodeImpl } from '../render3/instructions/text';
import { getDocument } from '../render3/interfaces/document';
import { isPlatformBrowser } from '../render3/util/misc_utils';
import { TransferState } from '../transfer_state';
import { performanceMarkFeature } from '../util/performance';
import { NgZone } from '../zone';
import { cleanupDehydratedViews } from './cleanup';
import { enableClaimDehydratedIcuCaseImpl, enablePrepareI18nBlockForHydrationImpl, isI18nHydrationEnabled, setIsI18nHydrationSupportEnabled } from './i18n';
import { IS_HYDRATION_DOM_REUSE_ENABLED, IS_I18N_HYDRATION_ENABLED, PRESERVE_HOST_CONTENT } from './tokens';
import { enableRetrieveHydrationInfoImpl, NGH_DATA_KEY, SSR_CONTENT_INTEGRITY_MARKER } from './utils';
import { enableFindMatchingDehydratedViewImpl } from './views';
/**
 * Indicates whether the hydration-related code was added,
 * prevents adding it multiple times.
 */
let isHydrationSupportEnabled = false;
/**
 * Indicates whether the i18n-related code was added,
 * prevents adding it multiple times.
 *
 * Note: This merely controls whether the code is loaded,
 * while `setIsI18nHydrationSupportEnabled` determines
 * whether i18n blocks are serialized or hydrated.
 */
let isI18nHydrationRuntimeSupportEnabled = false;
/**
 * Defines a period of time that Angular waits for the `ApplicationRef.isStable` to emit `true`.
 * If there was no event with the `true` value during this time, Angular reports a warning.
 */
const APPLICATION_IS_STABLE_TIMEOUT = 10_000;
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
 * Brings the necessary i18n hydration code in tree-shakable manner.
 * Similar to `enableHydrationRuntimeSupport`, the code is only
 * present when `withI18nHydration` is invoked.
 */
function enableI18nHydrationRuntimeSupport() {
    if (!isI18nHydrationRuntimeSupportEnabled) {
        isI18nHydrationRuntimeSupportEnabled = true;
        enableLocateOrCreateI18nNodeImpl();
        enablePrepareI18nBlockForHydrationImpl();
        enableClaimDehydratedIcuCaseImpl();
    }
}
/**
 * Outputs a message with hydration stats into a console.
 */
function printHydrationStats(injector) {
    const console = injector.get(Console);
    const message = `Angular hydrated ${ngDevMode.hydratedComponents} component(s) ` +
        `and ${ngDevMode.hydratedNodes} node(s), ` +
        `${ngDevMode.componentsSkippedHydration} component(s) were skipped. ` +
        `Learn more at https://angular.io/guide/hydration.`;
    // tslint:disable-next-line:no-console
    console.log(message);
}
/**
 * Returns a Promise that is resolved when an application becomes stable.
 */
function whenStableWithTimeout(appRef, injector) {
    const whenStablePromise = whenStable(appRef);
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
        whenStablePromise.finally(() => clearTimeout(timeoutId));
    }
    return whenStablePromise;
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
                if (isPlatformBrowser()) {
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
                    performanceMarkFeature('NgHydration');
                }
                return isEnabled;
            },
        },
        {
            provide: ENVIRONMENT_INITIALIZER,
            useValue: () => {
                setIsI18nHydrationSupportEnabled(isI18nHydrationEnabled());
                // Since this function is used across both server and client,
                // make sure that the runtime code is only added when invoked
                // on the client. Moving forward, the `isPlatformBrowser` check should
                // be replaced with a tree-shakable alternative (e.g. `isServer`
                // flag).
                if (isPlatformBrowser() && inject(IS_HYDRATION_DOM_REUSE_ENABLED)) {
                    verifySsrContentsIntegrity();
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
                return isPlatformBrowser() && inject(IS_HYDRATION_DOM_REUSE_ENABLED);
            }
        },
        {
            provide: APP_BOOTSTRAP_LISTENER,
            useFactory: () => {
                if (isPlatformBrowser() && inject(IS_HYDRATION_DOM_REUSE_ENABLED)) {
                    const appRef = inject(ApplicationRef);
                    const injector = inject(Injector);
                    return () => {
                        // Wait until an app becomes stable and cleanup all views that
                        // were not claimed during the application bootstrap process.
                        // The timing is similar to when we start the serialization process
                        // on the server.
                        //
                        // Note: the cleanup task *MUST* be scheduled within the Angular zone
                        // to ensure that change detection is properly run afterward.
                        whenStableWithTimeout(appRef, injector).then(() => {
                            NgZone.assertInAngularZone();
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
 * Returns a set of providers required to setup support for i18n hydration.
 * Requires hydration to be enabled separately.
 */
export function withI18nHydration() {
    return makeEnvironmentProviders([
        {
            provide: IS_I18N_HYDRATION_ENABLED,
            useValue: true,
        },
        {
            provide: ENVIRONMENT_INITIALIZER,
            useValue: () => {
                enableI18nHydrationRuntimeSupport();
            },
            multi: true,
        },
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
/**
 * Verifies whether the DOM contains a special marker added during SSR time to make sure
 * there is no SSR'ed contents transformations happen after SSR is completed. Typically that
 * happens either by CDN or during the build process as an optimization to remove comment nodes.
 * Hydration process requires comment nodes produced by Angular to locate correct DOM segments.
 * When this special marker is *not* present - throw an error and do not proceed with hydration,
 * since it will not be able to function correctly.
 *
 * Note: this function is invoked only on the client, so it's safe to use DOM APIs.
 */
function verifySsrContentsIntegrity() {
    const doc = getDocument();
    let hydrationMarker;
    for (const node of doc.body.childNodes) {
        if (node.nodeType === Node.COMMENT_NODE &&
            node.textContent?.trim() === SSR_CONTENT_INTEGRITY_MARKER) {
            hydrationMarker = node;
            break;
        }
    }
    if (!hydrationMarker) {
        throw new RuntimeError(-507 /* RuntimeErrorCode.MISSING_SSR_CONTENT_INTEGRITY_MARKER */, typeof ngDevMode !== 'undefined' && ngDevMode &&
            'Angular hydration logic detected that HTML content of this page was modified after it ' +
                'was produced during server side rendering. Make sure that there are no optimizations ' +
                'that remove comment nodes from HTML enabled on your CDN. Angular hydration ' +
                'relies on HTML produced by the server, including whitespaces and comment nodes.');
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBpLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvaHlkcmF0aW9uL2FwaS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsc0JBQXNCLEVBQUUsY0FBYyxFQUFFLFVBQVUsRUFBQyxNQUFNLGdDQUFnQyxDQUFDO0FBQ2xHLE9BQU8sRUFBQyxPQUFPLEVBQUMsTUFBTSxZQUFZLENBQUM7QUFDbkMsT0FBTyxFQUFDLHVCQUF1QixFQUF3QixRQUFRLEVBQUUsd0JBQXdCLEVBQUMsTUFBTSxPQUFPLENBQUM7QUFDeEcsT0FBTyxFQUFDLE1BQU0sRUFBQyxNQUFNLDhCQUE4QixDQUFDO0FBQ3BELE9BQU8sRUFBQyxrQkFBa0IsRUFBRSxZQUFZLEVBQW1CLE1BQU0sV0FBVyxDQUFDO0FBQzdFLE9BQU8sRUFBQyxvQ0FBb0MsRUFBQyxNQUFNLDhCQUE4QixDQUFDO0FBQ2xGLE9BQU8sRUFBQyxnQ0FBZ0MsRUFBQyxNQUFNLDRCQUE0QixDQUFDO0FBQzVFLE9BQU8sRUFBQyxtQ0FBbUMsRUFBQyxNQUFNLGlDQUFpQyxDQUFDO0FBQ3BGLE9BQU8sRUFBQyw0Q0FBNEMsRUFBQyxNQUFNLDJDQUEyQyxDQUFDO0FBQ3ZHLE9BQU8sRUFBQyxtQ0FBbUMsRUFBQyxNQUFNLGdDQUFnQyxDQUFDO0FBQ25GLE9BQU8sRUFBQyx1Q0FBdUMsRUFBQyxNQUFNLGtDQUFrQyxDQUFDO0FBQ3pGLE9BQU8sRUFBQyxnQ0FBZ0MsRUFBQyxNQUFNLDhCQUE4QixDQUFDO0FBQzlFLE9BQU8sRUFBQyxXQUFXLEVBQUMsTUFBTSxnQ0FBZ0MsQ0FBQztBQUMzRCxPQUFPLEVBQUMsaUJBQWlCLEVBQUMsTUFBTSw0QkFBNEIsQ0FBQztBQUM3RCxPQUFPLEVBQUMsYUFBYSxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDaEQsT0FBTyxFQUFDLHNCQUFzQixFQUFDLE1BQU0s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WTtZQUNuQyxJQUFJLENBQUMsV0FBVyxFQUFFLElBQUksRUFBRSxLQUFLLDRCQUE0QixFQUFFLENBQUM7WUFDOUQsZUFBZSxHQUFHLElBQUksQ0FBQztZQUN2QixNQUFNO1FBQ1IsQ0FBQztJQUNILENBQUM7SUFDRCxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7UUFDckIsTUFBTSxJQUFJLFlBQVksbUVBRWxCLE9BQU8sU0FBUyxLQUFLLFdBQVcsSUFBSSxTQUFTO1lBQ3pDLHdGQUF3RjtnQkFDcEYsdUZBQXVGO2dCQUN2Riw2RUFBNkU7Z0JBQzdFLGlGQUFpRixDQUFDLENBQUM7SUFDakcsQ0FBQztBQUNILENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtBUFBfQk9PVFNUUkFQX0xJU1RFTkVSLCBBcHBsaWNhdGlvblJlZiwgd2hlblN0YWJsZX0gZnJvbSAnLi4vYXBwbGljYXRpb24vYXBwbGljYXRpb25fcmVmJztcbmltcG9ydCB7Q29uc29sZX0gZnJvbSAnLi4vY29uc29sZSc7XG5pbXBvcnQge0VOVklST05NRU5UX0lOSVRJQUxJWkVSLCBFbnZpcm9ubWVudFByb3ZpZGVycywgSW5qZWN0b3IsIG1ha2VFbnZpcm9ubWVudFByb3ZpZGVyc30gZnJvbSAnLi4vZGknO1xuaW1wb3J0IHtpbmplY3R9IGZyb20gJy4uL2RpL2luamVjdG9yX2NvbXBhdGliaWxpdHknO1xuaW1wb3J0IHtmb3JtYXRSdW50aW1lRXJyb3IsIFJ1bnRpbWVFcnJvciwgUnVudGltZUVycm9yQ29kZX0gZnJvbSAnLi4vZXJyb3JzJztcbmltcG9ydCB7ZW5hYmxlTG9jYXRlT3JDcmVhdGVDb250YWluZXJSZWZJbXBsfSBmcm9tICcuLi9saW5rZXIvdmlld19jb250YWluZXJfcmVmJztcbmltcG9ydCB7ZW5hYmxlTG9jYXRlT3JDcmVhdGVJMThuTm9kZUltcGx9IGZyb20gJy4uL3JlbmRlcjMvaTE4bi9pMThuX2FwcGx5JztcbmltcG9ydCB7ZW5hYmxlTG9jYXRlT3JDcmVhdGVFbGVtZW50Tm9kZUltcGx9IGZyb20gJy4uL3JlbmRlcjMvaW5zdHJ1Y3Rpb25zL2VsZW1lbnQnO1xuaW1wb3J0IHtlbmFibGVMb2NhdGVPckNyZWF0ZUVsZW1lbnRDb250YWluZXJOb2RlSW1wbH0gZnJvbSAnLi4vcmVuZGVyMy9pbnN0cnVjdGlvbnMvZWxlbWVudF9jb250YWluZXInO1xuaW1wb3J0IHtlbmFibGVBcHBseVJvb3RFbGVtZW50VHJhbnNmb3JtSW1wbH0gZnJvbSAnLi4vcmVuZGVyMy9pbnN0cnVjdGlvbnMvc2hhcmVkJztcbmltcG9ydCB7ZW5hYmxlTG9jYXRlT3JDcmVhdGVDb250YWluZXJBbmNob3JJbXBsfSBmcm9tICcuLi9yZW5kZXIzL2luc3RydWN0aW9ucy90ZW1wbGF0ZSc7XG5pbXBvcnQge2VuYWJsZUxvY2F0ZU9yQ3JlYXRlVGV4dE5vZGVJbXBsfSBmcm9tICcuLi9yZW5kZXIzL2luc3RydWN0aW9ucy90ZXh0JztcbmltcG9ydCB7Z2V0RG9jdW1lbnR9IGZyb20gJy4uL3JlbmRlcjMvaW50ZXJmYWNlcy9kb2N1bWVudCc7XG5pbXBvcnQge2lzUGxhdGZvcm1Ccm93c2VyfSBmcm9tICcuLi9yZW5kZXIzL3V0aWwvbWlzY191dGlscyc7XG5pbXBvcnQge1RyYW5zZmVyU3RhdGV9IGZyb20gJy4uL3RyYW5zZmVyX3N0YXRlJztcbmltcG9ydCB7cGVyZm9ybWFuY2VNYXJrRmVhdHVyZX0gZnJvbSAnLi4vdXRpbC9wZXJmb3JtYW5jZSc7XG5pbXBvcnQge05nWm9uZX0gZnJvbSAnLi4vem9uZSc7XG5cbmltcG9ydCB7Y2xlYW51cERlaHlkcmF0ZWRWaWV3c30gZnJvbSAnLi9jbGVhbnVwJztcbmltcG9ydCB7ZW5hYmxlQ2xhaW1EZWh5ZHJhdGVkSWN1Q2FzZUltcGwsIGVuYWJsZVByZXBhcmVJMThuQmxvY2tGb3JIeWRyYXRpb25JbXBsLCBpc0kxOG5IeWRyYXRpb25FbmFibGVkLCBzZXRJc0kxOG5IeWRyYXRpb25TdXBwb3J0RW5hYmxlZH0gZnJvbSAnLi9pMThuJztcbmltcG9ydCB7SVNfSFlEUkFUSU9OX0RPTV9SRVVTRV9FTkFCTEVELCBJU19JMThOX0hZRFJBVElPTl9FTkFCTEVELCBQUkVTRVJWRV9IT1NUX0NPTlRFTlR9IGZyb20gJy4vdG9rZW5zJztcbmltcG9ydCB7ZW5hYmxlUmV0cmlldmVIeWRyYXRpb25JbmZvSW1wbCwgTkdIX0RBVEFfS0VZLCBTU1JfQ09OVEVOVF9JTlRFR1JJVFlfTUFSS0VSfSBmcm9tICcuL3V0aWxzJztcbmltcG9ydCB7ZW5hYmxlRmluZE1hdGNoaW5nRGVoeWRyYXRlZFZpZXdJbXBsfSBmcm9tICcuL3ZpZXdzJztcblxuLyoqXG4gKiBJbmRpY2F0ZXMgd2hldGhlciB0aGUgaHlkcmF0aW9uLXJlbGF0ZWQgY29kZSB3YXMgYWRkZWQsXG4gKiBwcmV2ZW50cyBhZGRpbmcgaXQgbXVsdGlwbGUgdGltZXMuXG4gKi9cbmxldCBpc0h5ZHJhdGlvblN1cHBvcnRFbmFibGVkID0gZmFsc2U7XG5cbi8qKlxuICogSW5kaWNhdGVzIHdoZXRoZXIgdGhlIGkxOG4tcmVsYXRlZCBjb2RlIHdhcyBhZGRlZCxcbiAqIHByZXZlbnRzIGFkZGluZyBpdCBtdWx0aXBsZSB0aW1lcy5cbiAqXG4gKiBOb3RlOiBUaGlzIG1lcmVseSBjb250cm9scyB3aGV0aGVyIHRoZSBjb2RlIGlzIGxvYWRlZCxcbiAqIHdoaWxlIGBzZXRJc0kxOG5IeWRyYXRpb25TdXBwb3J0RW5hYmxlZGAgZGV0ZXJtaW5lc1xuICogd2hldGhlciBpMThuIGJsb2NrcyBhcmUgc2VyaWFsaXplZCBvciBoeWRyYXRlZC5cbiAqL1xubGV0IGlzSTE4bkh5ZHJhdGlvblJ1bnRpbWVTdXBwb3J0RW5hYmxlZCA9IGZhbHNlO1xuXG4vKipcbiAqIERlZmluZXMgYSBwZXJpb2Qgb2YgdGltZSB0aGF0IEFuZ3VsYXIgd2FpdHMgZm9yIHRoZSBgQXBwbGljYXRpb25SZWYuaXNTdGFibGVgIHRvIGVtaXQgYHRydWVgLlxuICogSWYgdGhlcmUgd2FzIG5vIGV2ZW50IHdpdGggdGhlIGB0cnVlYCB2YWx1ZSBkdXJpbmcgdGhpcyB0aW1lLCBBbmd1bGFyIHJlcG9ydHMgYSB3YXJuaW5nLlxuICovXG5jb25zdCBBUFBMSUNBVElPTl9JU19TVEFCTEVfVElNRU9VVCA9IDEwXzAwMDtcblxuLyoqXG4gKiBCcmluZ3MgdGhlIG5lY2Vzc2FyeSBoeWRyYXRpb24gY29kZSBpbiB0cmVlLXNoYWthYmxlIG1hbm5lci5cbiAqIFRoZSBjb2RlIGlzIG9ubHkgcHJlc2VudCB3aGVuIHRoZSBgcHJvdmlkZUNsaWVudEh5ZHJhdGlvbmAgaXNcbiAqIGludm9rZWQuIE90aGVyd2lzZSwgdGhpcyBjb2RlIGlzIHRyZWUtc2hha2VuIGF3YXkgZHVyaW5nIHRoZVxuICogYnVpbGQgb3B0aW1pemF0aW9uIHN0ZXAuXG4gKlxuICogVGhpcyB0ZWNobmlxdWUgYWxsb3dzIHVzIHRvIHN3YXAgaW1wbGVtZW50YXRpb25zIG9mIG1ldGhvZHMgc29cbiAqIHRyZWUgc2hha2luZyB3b3JrcyBhcHByb3ByaWF0ZWx5IHdoZW4gaHlkcmF0aW9uIGlzIGRpc2FibGVkIG9yXG4gKiBlbmFibGVkLiBJdCBicmluZ3MgaW4gdGhlIGFwcHJvcHJpYXRlIHZlcnNpb24gb2YgdGhlIG1ldGhvZCB0aGF0XG4gKiBzdXBwb3J0cyBoeWRyYXRpb24gb25seSB3aGVuIGVuYWJsZWQuXG4gKi9cbmZ1bmN0aW9uIGVuYWJsZUh5ZHJhdGlvblJ1bnRpbWVTdXBwb3J0KCkge1xuICBpZiAoIWlzSHlkcmF0aW9uU3VwcG9ydEVuYWJsZWQpIHtcbiAgICBpc0h5ZHJhdGlvblN1cHBvcnRFbmFibGVkID0gdHJ1ZTtcbiAgICBlbmFibGVSZXRyaWV2ZUh5ZHJhdGlvbkluZm9JbXBsKCk7XG4gICAgZW5hYmxlTG9jYXRlT3JDcmVhdGVFbGVtZW50Tm9kZUltcGwoKTtcbiAgICBlbmFibGVMb2NhdGVPckNyZWF0ZVRleHROb2RlSW1wbCgpO1xuICAgIGVuYWJsZUxvY2F0ZU9yQ3JlYXRlRWxlbWVudENvbnRhaW5lck5vZGVJbXBsKCk7XG4gICAgZW5hYmxlTG9jYXRlT3JDcmVhdGVDb250YWluZXJBbmNob3JJbXBsKCk7XG4gICAgZW5hYmxlTG9jYXRlT3JDcmVhdGVDb250YWluZXJSZWZJbXBsKCk7XG4gICAgZW5hYmxlRmluZE1hdGNoaW5nRGVoeWRyYXRlZFZpZXdJbXBsKCk7XG4gICAgZW5hYmxlQXBwbHlSb290RWxlbWVudFRyYW5zZm9ybUltcGwoKTtcbiAgfVxufVxuXG4vKipcbiAqIEJyaW5ncyB0aGUgbmVjZXNzYXJ5IGkxOG4gaHlkcmF0aW9uIGNvZGUgaW4gdHJlZS1zaGFrYWJsZSBtYW5uZXIuXG4gKiBTaW1pbGFyIHRvIGBlbmFibGVIeWRyYXRpb25SdW50aW1lU3VwcG9ydGAsIHRoZSBjb2RlIGlzIG9ubHlcbiAqIHByZXNlbnQgd2hlbiBgd2l0aEkxOG5IeWRyYXRpb25gIGlzIGludm9rZWQuXG4gKi9cbmZ1bmN0aW9uIGVuYWJsZUkxOG5IeWRyYXRpb25SdW50aW1lU3VwcG9ydCgpIHtcbiAgaWYgKCFpc0kxOG5IeWRyYXRpb25SdW50aW1lU3VwcG9ydEVuYWJsZWQpIHtcbiAgICBpc0kxOG5IeWRyYXRpb25SdW50aW1lU3VwcG9ydEVuYWJsZWQgPSB0cnVlO1xuICAgIGVuYWJsZUxvY2F0ZU9yQ3JlYXRlSTE4bk5vZGVJbXBsKCk7XG4gICAgZW5hYmxlUHJlcGFyZUkxOG5CbG9ja0Zvckh5ZHJhdGlvbkltcGwoKTtcbiAgICBlbmFibGVDbGFpbURlaHlkcmF0ZWRJY3VDYXNlSW1wbCgpO1xuICB9XG59XG5cbi8qKlxuICogT3V0cHV0cyBhIG1lc3NhZ2Ugd2l0aCBoeWRyYXRpb24gc3RhdHMgaW50byBhIGNvbnNvbGUuXG4gKi9cbmZ1bmN0aW9uIHByaW50SHlkcmF0aW9uU3RhdHMoaW5qZWN0b3I6IEluamVjdG9yKSB7XG4gIGNvbnN0IGNvbnNvbGUgPSBpbmplY3Rvci5nZXQoQ29uc29sZSk7XG4gIGNvbnN0IG1lc3NhZ2UgPSBgQW5ndWxhciBoeWRyYXRlZCAke25nRGV2TW9kZSEuaHlkcmF0ZWRDb21wb25lbnRzfSBjb21wb25lbnQocykgYCArXG4gICAgICBgYW5kICR7bmdEZXZNb2RlIS5oeWRyYXRlZE5vZGVzfSBub2RlKHMpLCBgICtcbiAgICAgIGAke25nRGV2TW9kZSEuY29tcG9uZW50c1NraXBwZWRIeWRyYXRpb259IGNvbXBvbmVudChzKSB3ZXJlIHNraXBwZWQuIGAgK1xuICAgICAgYExlYXJuIG1vcmUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2d1aWRlL2h5ZHJhdGlvbi5gO1xuICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6bm8tY29uc29sZVxuICBjb25zb2xlLmxvZyhtZXNzYWdlKTtcbn1cblxuXG4vKipcbiAqIFJldHVybnMgYSBQcm9taXNlIHRoYXQgaXMgcmVzb2x2ZWQgd2hlbiBhbiBhcHBsaWNhdGlvbiBiZWNvbWVzIHN0YWJsZS5cbiAqL1xuZnVuY3Rpb24gd2hlblN0YWJsZVdpdGhUaW1lb3V0KGFwcFJlZjogQXBwbGljYXRpb25SZWYsIGluamVjdG9yOiBJbmplY3Rvcik6IFByb21pc2U8dm9pZD4ge1xuICBjb25zdCB3aGVuU3RhYmxlUHJvbWlzZSA9IHdoZW5TdGFibGUoYXBwUmVmKTtcbiAgaWYgKHR5cGVvZiBuZ0Rldk1vZGUgIT09ICd1bmRlZmluZWQnICYmIG5nRGV2TW9kZSkge1xuICAgIGNvbnN0IHRpbWVvdXRUaW1lID0gQVBQTElDQVRJT05fSVNfU1RBQkxFX1RJTUVPVVQ7XG4gICAgY29uc3QgY29uc29sZSA9IGluamVjdG9yLmdldChDb25zb2xlKTtcbiAgICBjb25zdCBuZ1pvbmUgPSBpbmplY3Rvci5nZXQoTmdab25lKTtcblxuICAgIC8vIFRoZSBmb2xsb3dpbmcgY2FsbCBzaG91bGQgbm90IGFuZCBkb2VzIG5vdCBwcmV2ZW50IHRoZSBhcHAgdG8gYmVjb21lIHN0YWJsZVxuICAgIC8vIFdlIGNhbm5vdCB1c2UgUnhKUyB0aW1lciBoZXJlIGJlY2F1c2UgdGhlIGFwcCB3b3VsZCByZW1haW4gdW5zdGFibGUuXG4gICAgLy8gVGhpcyBhbHNvIGF2b2lkcyBhbiBleHRyYSBjaGFuZ2UgZGV0ZWN0aW9uIGN5Y2xlLlxuICAgIGNvbnN0IHRpbWVvdXRJZCA9IG5nWm9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiB7XG4gICAgICByZXR1cm4gc2V0VGltZW91dCgoKSA9PiBsb2dXYXJuaW5nT25TdGFibGVUaW1lZG91dCh0aW1lb3V0VGltZSwgY29uc29sZSksIHRpbWVvdXRUaW1lKTtcbiAgICB9KTtcblxuICAgIHdoZW5TdGFibGVQcm9taXNlLmZpbmFsbHkoKCkgPT4gY2xlYXJUaW1lb3V0KHRpbWVvdXRJZCkpO1xuICB9XG5cbiAgcmV0dXJuIHdoZW5TdGFibGVQcm9taXNlO1xufVxuXG4vKipcbiAqIFJldHVybnMgYSBzZXQgb2YgcHJvdmlkZXJzIHJlcXVpcmVkIHRvIHNldHVwIGh5ZHJhdGlvbiBzdXBwb3J0XG4gKiBmb3IgYW4gYXBwbGljYXRpb24gdGhhdCBpcyBzZXJ2ZXIgc2lkZSByZW5kZXJlZC4gVGhpcyBmdW5jdGlvbiBpc1xuICogaW5jbHVkZWQgaW50byB0aGUgYHByb3ZpZGVDbGllbnRIeWRyYXRpb25gIHB1YmxpYyBBUEkgZnVuY3Rpb24gZnJvbVxuICogdGhlIGBwbGF0Zm9ybS1icm93c2VyYCBwYWNrYWdlLlxuICpcbiAqIFRoZSBmdW5jdGlvbiBzZXRzIHVwIGFuIGludGVybmFsIGZsYWcgdGhhdCB3b3VsZCBiZSByZWNvZ25pemVkIGR1cmluZ1xuICogdGhlIHNlcnZlciBzaWRlIHJlbmRlcmluZyB0aW1lIGFzIHdlbGwsIHNvIHRoZXJlIGlzIG5vIG5lZWQgdG9cbiAqIGNvbmZpZ3VyZSBvciBjaGFuZ2UgYW55dGhpbmcgaW4gTmdVbml2ZXJzYWwgdG8gZW5hYmxlIHRoZSBmZWF0dXJlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gd2l0aERvbUh5ZHJhdGlvbigpOiBFbnZpcm9ubWVudFByb3ZpZGVycyB7XG4gIHJldHVybiBtYWtlRW52aXJvbm1lbnRQcm92aWRlcnMoW1xuICAgIHtcbiAgICAgIHByb3ZpZGU6IElTX0hZRFJBVElPTl9ET01fUkVVU0VfRU5BQkxFRCxcbiAgICAgIHVzZUZhY3Rvcnk6ICgpID0+IHtcbiAgICAgICAgbGV0IGlzRW5hYmxlZCA9IHRydWU7XG4gICAgICAgIGlmIChpc1BsYXRmb3JtQnJvd3NlcigpKSB7XG4gICAgICAgICAgLy8gT24gdGhlIGNsaWVudCwgdmVyaWZ5IHRoYXQgdGhlIHNlcnZlciByZXNwb25zZSBjb250YWluc1xuICAgICAgICAgIC8vIGh5ZHJhdGlvbiBhbm5vdGF0aW9ucy4gT3RoZXJ3aXNlLCBrZWVwIGh5ZHJhdGlvbiBkaXNhYmxlZC5cbiAgICAgICAgICBjb25zdCB0cmFuc2ZlclN0YXRlID0gaW5qZWN0KFRyYW5zZmVyU3RhdGUsIHtvcHRpb25hbDogdHJ1ZX0pO1xuICAgICAgICAgIGlzRW5hYmxlZCA9ICEhdHJhbnNmZXJTdGF0ZT8uZ2V0KE5HSF9EQVRBX0tFWSwgbnVsbCk7XG4gICAgICAgICAgaWYgKCFpc0VuYWJsZWQgJiYgKHR5cGVvZiBuZ0Rldk1vZGUgIT09ICd1bmRlZmluZWQnICYmIG5nRGV2TW9kZSkpIHtcbiAgICAgICAgICAgIGNvbnN0IGNvbnNvbGUgPSBpbmplY3QoQ29uc29sZSk7XG4gICAgICAgICAgICBjb25zdCBtZXNzYWdlID0gZm9ybWF0UnVudGltZUVycm9yKFxuICAgICAgICAgICAgICAgIFJ1bnRpbWVFcnJvckNvZGUuTUlTU0lOR19IWURSQVRJT05fQU5OT1RBVElPTlMsXG4gICAgICAgICAgICAgICAgJ0FuZ3VsYXIgaHlkcmF0aW9uIHdhcyByZXF1ZXN0ZWQgb24gdGhlIGNsaWVudCwgYnV0IHRoZXJlIHdhcyBubyAnICtcbiAgICAgICAgICAgICAgICAgICAgJ3NlcmlhbGl6ZWQgaW5mb3JtYXRpb24gcHJlc2VudCBpbiB0aGUgc2VydmVyIHJlc3BvbnNlLCAnICtcbiAgICAgICAgICAgICAgICAgICAgJ3RodXMgaHlkcmF0aW9uIHdhcyBub3QgZW5hYmxlZC4gJyArXG4gICAgICAgICAgICAgICAgICAgICdNYWtlIHN1cmUgdGhlIGBwcm92aWRlQ2xpZW50SHlkcmF0aW9uKClgIGlzIGluY2x1ZGVkIGludG8gdGhlIGxpc3QgJyArXG4gICAgICAgICAgICAgICAgICAgICdvZiBwcm92aWRlcnMgaW4gdGhlIHNlcnZlciBwYXJ0IG9mIHRoZSBhcHBsaWNhdGlvbiBjb25maWd1cmF0aW9uLicpO1xuICAgICAgICAgICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOm5vLWNvbnNvbGVcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihtZXNzYWdlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGlzRW5hYmxlZCkge1xuICAgICAgICAgIHBlcmZvcm1hbmNlTWFya0ZlYXR1cmUoJ05nSHlkcmF0aW9uJyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGlzRW5hYmxlZDtcbiAgICAgIH0sXG4gICAgfSxcbiAgICB7XG4gICAgICBwcm92aWRlOiBFTlZJUk9OTUVOVF9JTklUSUFMSVpFUixcbiAgICAgIHVzZVZhbHVlOiAoKSA9PiB7XG4gICAgICAgIHNldElzSTE4bkh5ZHJhdGlvblN1cHBvcnRFbmFibGVkKGlzSTE4bkh5ZHJhdGlvbkVuYWJsZWQoKSk7XG5cbiAgICAgICAgLy8gU2luY2UgdGhpcyBmdW5jdGlvbiBpcyB1c2VkIGFjcm9zcyBib3RoIHNlcnZlciBhbmQgY2xpZW50LFxuICAgICAgICAvLyBtYWtlIHN1cmUgdGhhdCB0aGUgcnVudGltZSBjb2RlIGlzIG9ubHkgYWRkZWQgd2hlbiBpbnZva2VkXG4gICAgICAgIC8vIG9uIHRoZSBjbGllbnQuIE1vdmluZyBmb3J3YXJkLCB0aGUgYGlzUGxhdGZvcm1Ccm93c2VyYCBjaGVjayBzaG91bGRcbiAgICAgICAgLy8gYmUgcmVwbGFjZWQgd2l0aCBhIHRyZWUtc2hha2FibGUgYWx0ZXJuYXRpdmUgKGUuZy4gYGlzU2VydmVyYFxuICAgICAgICAvLyBmbGFnKS5cbiAgICAgICAgaWYgKGlzUGxhdGZvcm1Ccm93c2VyKCkgJiYgaW5qZWN0KElTX0hZRFJBVElPTl9ET01fUkVVU0VfRU5BQkxFRCkpIHtcbiAgICAgICAgICB2ZXJpZnlTc3JDb250ZW50c0ludGVncml0eSgpO1xuICAgICAgICAgIGVuYWJsZUh5ZHJhdGlvblJ1bnRpbWVTdXBwb3J0KCk7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBtdWx0aTogdHJ1ZSxcbiAgICB9LFxuICAgIHtcbiAgICAgIHByb3ZpZGU6IFBSRVNFUlZFX0hPU1RfQ09OVEVOVCxcbiAgICAgIHVzZUZhY3Rvcnk6ICgpID0+IHtcbiAgICAgICAgLy8gUHJlc2VydmUgaG9zdCBlbGVtZW50IGNvbnRlbnQgb25seSBpbiBhIGJyb3dzZXJcbiAgICAgICAgLy8gZW52aXJvbm1lbnQgYW5kIHdoZW4gaHlkcmF0aW9uIGlzIGNvbmZpZ3VyZWQgcHJvcGVybHkuXG4gICAgICAgIC8vIE9uIGEgc2VydmVyLCBhbiBhcHBsaWNhdGlvbiBpcyByZW5kZXJlZCBmcm9tIHNjcmF0Y2gsXG4gICAgICAgIC8vIHNvIHRoZSBob3N0IGNvbnRlbnQgbmVlZHMgdG8gYmUgZW1wdHkuXG4gICAgICAgIHJldHVybiBpc1BsYXRmb3JtQnJvd3NlcigpICYmIGluamVjdChJU19IWURSQVRJT05fRE9NX1JFVVNFX0VOQUJMRUQpO1xuICAgICAgfVxuICAgIH0sXG4gICAge1xuICAgICAgcHJvdmlkZTogQVBQX0JPT1RTVFJBUF9MSVNURU5FUixcbiAgICAgIHVzZUZhY3Rvcnk6ICgpID0+IHtcbiAgICAgICAgaWYgKGlzUGxhdGZvcm1Ccm93c2VyKCkgJiYgaW5qZWN0KElTX0hZRFJBVElPTl9ET01fUkVVU0VfRU5BQkxFRCkpIHtcbiAgICAgICAgICBjb25zdCBhcHBSZWYgPSBpbmplY3QoQXBwbGljYXRpb25SZWYpO1xuICAgICAgICAgIGNvbnN0IGluamVjdG9yID0gaW5qZWN0KEluamVjdG9yKTtcbiAgICAgICAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgICAgICAgLy8gV2FpdCB1bnRpbCBhbiBhcHAgYmVjb21lcyBzdGFibGUgYW5kIGNsZWFudXAgYWxsIHZpZXdzIHRoYXRcbiAgICAgICAgICAgIC8vIHdlcmUgbm90IGNsYWltZWQgZHVyaW5nIHRoZSBhcHBsaWNhdGlvbiBib290c3RyYXAgcHJvY2Vzcy5cbiAgICAgICAgICAgIC8vIFRoZSB0aW1pbmcgaXMgc2ltaWxhciB0byB3aGVuIHdlIHN0YXJ0IHRoZSBzZXJpYWxpemF0aW9uIHByb2Nlc3NcbiAgICAgICAgICAgIC8vIG9uIHRoZSBzZXJ2ZXIuXG4gICAgICAgICAgICAvL1xuICAgICAgICAgICAgLy8gTm90ZTogdGhlIGNsZWFudXAgdGFzayAqTVVTVCogYmUgc2NoZWR1bGVkIHdpdGhpbiB0aGUgQW5ndWxhciB6b25lXG4gICAgICAgICAgICAvLyB0byBlbnN1cmUgdGhhdCBjaGFuZ2UgZGV0ZWN0aW9uIGlzIHByb3Blcmx5IHJ1biBhZnRlcndhcmQuXG4gICAgICAgICAgICB3aGVuU3RhYmxlV2l0aFRpbWVvdXQoYXBwUmVmLCBpbmplY3RvcikudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgIE5nWm9uZS5hc3NlcnRJbkFuZ3VsYXJab25lKCk7XG4gICAgICAgICAgICAgIGNsZWFudXBEZWh5ZHJhdGVkVmlld3MoYXBwUmVmKTtcblxuICAgICAgICAgICAgICBpZiAodHlwZW9mIG5nRGV2TW9kZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbmdEZXZNb2RlKSB7XG4gICAgICAgICAgICAgICAgcHJpbnRIeWRyYXRpb25TdGF0cyhpbmplY3Rvcik7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuICgpID0+IHt9OyAgLy8gbm9vcFxuICAgICAgfSxcbiAgICAgIG11bHRpOiB0cnVlLFxuICAgIH1cbiAgXSk7XG59XG5cbi8qKlxuICogUmV0dXJucyBhIHNldCBvZiBwcm92aWRlcnMgcmVxdWlyZWQgdG8gc2V0dXAgc3VwcG9ydCBmb3IgaTE4biBoeWRyYXRpb24uXG4gKiBSZXF1aXJlcyBoeWRyYXRpb24gdG8gYmUgZW5hYmxlZCBzZXBhcmF0ZWx5LlxuICovXG5leHBvcnQgZnVuY3Rpb24gd2l0aEkxOG5IeWRyYXRpb24oKTogRW52aXJvbm1lbnRQcm92aWRlcnMge1xuICByZXR1cm4gbWFrZUVudmlyb25tZW50UHJvdmlkZXJzKFtcbiAgICB7XG4gICAgICBwcm92aWRlOiBJU19JMThOX0hZRFJBVElPTl9FTkFCTEVELFxuICAgICAgdXNlVmFsdWU6IHRydWUsXG4gICAgfSxcbiAgICB7XG4gICAgICBwcm92aWRlOiBFTlZJUk9OTUVOVF9JTklUSUFMSVpFUixcbiAgICAgIHVzZVZhbHVlOiAoKSA9PiB7XG4gICAgICAgIGVuYWJsZUkxOG5IeWRyYXRpb25SdW50aW1lU3VwcG9ydCgpO1xuICAgICAgfSxcbiAgICAgIG11bHRpOiB0cnVlLFxuICAgIH0sXG4gIF0pO1xufVxuXG4vKipcbiAqXG4gKiBAcGFyYW0gdGltZSBUaGUgdGltZSBpbiBtcyB1bnRpbCB0aGUgc3RhYmxlIHRpbWVkb3V0IHdhcm5pbmcgbWVzc2FnZSBpcyBsb2dnZWRcbiAqL1xuZnVuY3Rpb24gbG9nV2FybmluZ09uU3RhYmxlVGltZWRvdXQodGltZTogbnVtYmVyLCBjb25zb2xlOiBDb25zb2xlKTogdm9pZCB7XG4gIGNvbnN0IG1lc3NhZ2UgPVxuICAgICAgYEFuZ3VsYXIgaHlkcmF0aW9uIGV4cGVjdGVkIHRoZSBBcHBsaWNhdGlvblJlZi5pc1N0YWJsZSgpIHRvIGVtaXQgXFxgdHJ1ZVxcYCwgYnV0IGl0IGAgK1xuICAgICAgYGRpZG4ndCBoYXBwZW4gd2l0aGluICR7XG4gICAgICAgICAgdGltZX1tcy4gQW5ndWxhciBoeWRyYXRpb24gbG9naWMgZGVwZW5kcyBvbiB0aGUgYXBwbGljYXRpb24gYmVjb21pbmcgc3RhYmxlIGAgK1xuICAgICAgYGFzIGEgc2lnbmFsIHRvIGNvbXBsZXRlIGh5ZHJhdGlvbiBwcm9jZXNzLmA7XG5cbiAgY29uc29sZS53YXJuKGZvcm1hdFJ1bnRpbWVFcnJvcihSdW50aW1lRXJyb3JDb2RlLkhZRFJBVElPTl9TVEFCTEVfVElNRURPVVQsIG1lc3NhZ2UpKTtcbn1cblxuLyoqXG4gKiBWZXJpZmllcyB3aGV0aGVyIHRoZSBET00gY29udGFpbnMgYSBzcGVjaWFsIG1hcmtlciBhZGRlZCBkdXJpbmcgU1NSIHRpbWUgdG8gbWFrZSBzdXJlXG4gKiB0aGVyZSBpcyBubyBTU1InZWQgY29udGVudHMgdHJhbnNmb3JtYXRpb25zIGhhcHBlbiBhZnRlciBTU1IgaXMgY29tcGxldGVkLiBUeXBpY2FsbHkgdGhhdFxuICogaGFwcGVucyBlaXRoZXIgYnkgQ0ROIG9yIGR1cmluZyB0aGUgYnVpbGQgcHJvY2VzcyBhcyBhbiBvcHRpbWl6YXRpb24gdG8gcmVtb3ZlIGNvbW1lbnQgbm9kZXMuXG4gKiBIeWRyYXRpb24gcHJvY2VzcyByZXF1aXJlcyBjb21tZW50IG5vZGVzIHByb2R1Y2VkIGJ5IEFuZ3VsYXIgdG8gbG9jYXRlIGNvcnJlY3QgRE9NIHNlZ21lbnRzLlxuICogV2hlbiB0aGlzIHNwZWNpYWwgbWFya2VyIGlzICpub3QqIHByZXNlbnQgLSB0aHJvdyBhbiBlcnJvciBhbmQgZG8gbm90IHByb2NlZWQgd2l0aCBoeWRyYXRpb24sXG4gKiBzaW5jZSBpdCB3aWxsIG5vdCBiZSBhYmxlIHRvIGZ1bmN0aW9uIGNvcnJlY3RseS5cbiAqXG4gKiBOb3RlOiB0aGlzIGZ1bmN0aW9uIGlzIGludm9rZWQgb25seSBvbiB0aGUgY2xpZW50LCBzbyBpdCdzIHNhZmUgdG8gdXNlIERPTSBBUElzLlxuICovXG5mdW5jdGlvbiB2ZXJpZnlTc3JDb250ZW50c0ludGVncml0eSgpOiB2b2lkIHtcbiAgY29uc3QgZG9jID0gZ2V0RG9jdW1lbnQoKTtcbiAgbGV0IGh5ZHJhdGlvbk1hcmtlcjogTm9kZXx1bmRlZmluZWQ7XG4gIGZvciAoY29uc3Qgbm9kZSBvZiBkb2MuYm9keS5jaGlsZE5vZGVzKSB7XG4gICAgaWYgKG5vZGUubm9kZVR5cGUgPT09IE5vZGUuQ09NTUVOVF9OT0RFICYmXG4gICAgICAgIG5vZGUudGV4dENvbnRlbnQ/LnRyaW0oKSA9PT0gU1NSX0NPTlRFTlRfSU5URUdSSVRZX01BUktFUikge1xuICAgICAgaHlkcmF0aW9uTWFya2VyID0gbm9kZTtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuICBpZiAoIWh5ZHJhdGlvbk1hcmtlcikge1xuICAgIHRocm93IG5ldyBSdW50aW1lRXJyb3IoXG4gICAgICAgIFJ1bnRpbWVFcnJvckNvZGUuTUlTU0lOR19TU1JfQ09OVEVOVF9JTlRFR1JJVFlfTUFSS0VSLFxuICAgICAgICB0eXBlb2YgbmdEZXZNb2RlICE9PSAndW5kZWZpbmVkJyAmJiBuZ0Rldk1vZGUgJiZcbiAgICAgICAgICAgICdBbmd1bGFyIGh5ZHJhdGlvbiBsb2dpYyBkZXRlY3RlZCB0aGF0IEhUTUwgY29udGVudCBvZiB0aGlzIHBhZ2Ugd2FzIG1vZGlmaWVkIGFmdGVyIGl0ICcgK1xuICAgICAgICAgICAgICAgICd3YXMgcHJvZHVjZWQgZHVyaW5nIHNlcnZlciBzaWRlIHJlbmRlcmluZy4gTWFrZSBzdXJlIHRoYXQgdGhlcmUgYXJlIG5vIG9wdGltaXphdGlvbnMgJyArXG4gICAgICAgICAgICAgICAgJ3RoYXQgcmVtb3ZlIGNvbW1lbnQgbm9kZXMgZnJvbSBIVE1MIGVuYWJsZWQgb24geW91ciBDRE4uIEFuZ3VsYXIgaHlkcmF0aW9uICcgK1xuICAgICAgICAgICAgICAgICdyZWxpZXMgb24gSFRNTCBwcm9kdWNlZCBieSB0aGUgc2VydmVyLCBpbmNsdWRpbmcgd2hpdGVzcGFjZXMgYW5kIGNvbW1lbnQgbm9kZXMuJyk7XG4gIH1cbn1cbiJdfQ==