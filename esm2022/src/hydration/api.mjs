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
import { enableClaimDehydratedIcuCaseImpl, enablePrepareI18nBlockForHydrationImpl, setIsI18nHydrationSupportEnabled } from './i18n';
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
 * present when `withI18nSupport` is invoked.
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
                // i18n support is enabled by calling withI18nSupport(), but there's
                // no way to turn it off (e.g. for tests), so we turn it off by default.
                setIsI18nHydrationSupportEnabled(false);
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
                        // Note: the cleanup task *MUST* be scheduled within the Angular zone in Zone apps
                        // to ensure that change detection is properly run afterward.
                        whenStableWithTimeout(appRef, injector).then(() => {
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
export function withI18nSupport() {
    return [
        {
            provide: IS_I18N_HYDRATION_ENABLED,
            useValue: true,
        },
        {
            provide: ENVIRONMENT_INITIALIZER,
            useValue: () => {
                enableI18nHydrationRuntimeSupport();
                setIsI18nHydrationSupportEnabled(true);
                performanceMarkFeature('NgI18nHydration');
            },
            multi: true,
        },
    ];
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBpLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvaHlkcmF0aW9uL2FwaS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsc0JBQXNCLEVBQUUsY0FBYyxFQUFFLFVBQVUsRUFBQyxNQUFNLGdDQUFnQyxDQUFDO0FBQ2xHLE9BQU8sRUFBQyxPQUFPLEVBQUMsTUFBTSxZQUFZLENBQUM7QUFDbkMsT0FBTyxFQUFDLHVCQUF1QixFQUF3QixRQUFRLEVBQUUsd0JBQXdCLEVBQVcsTUFBTSxPQUFPLENBQUM7QUFDbEgsT0FBTyxFQUFDLE1BQU0sRUFBQyxNQUFNLDhCQUE4QixDQUFDO0FBQ3BELE9BQU8sRUFBQyxrQkFBa0IsRUFBRSxZQUFZLEVBQW1CLE1BQU0sV0FBVyxDQUFDO0FBQzdFLE9BQU8sRUFBQyxvQ0FBb0MsRUFBQyxNQUFNLDhCQUE4QixDQUFDO0FBQ2xGLE9BQU8sRUFBQyxnQ0FBZ0MsRUFBQyxNQUFNLDRCQUE0QixDQUFDO0FBQzVFLE9BQU8sRUFBQyxtQ0FBbUMsRUFBQyxNQUFNLGlDQUFpQyxDQUFDO0FBQ3BGLE9BQU8sRUFBQyw0Q0FBNEMsRUFBQyxNQUFNLDJDQUEyQyxDQUFDO0FBQ3ZHLE9BQU8sRUFBQyxtQ0FBbUMsRUFBQyxNQUFNLGdDQUFnQyxDQUFDO0FBQ25GLE9BQU8sRUFBQyx1Q0FBdUMsRUFBQyxNQUFNLGtDQUFrQyxDQUFDO0FBQ3pGLE9BQU8sRUFBQyxnQ0FBZ0MsRUFBQyxNQUFNLDhCQUE4QixDQUFDO0FBQzlFLE9BQU8sRUFBQyxXQUFXLEVBQUMsTUFBTSxnQ0FBZ0MsQ0FBQztBQUMzRCxPQUFPLEVBQUMsaUJBQWlCLEVBQUMsTUFBTSw0QkFBNEIsQ0FBQztBQUM3RCxPQUFPLEVBQUMsYUFBYSxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDaEQsT0FBTyxFQUFDLHNCQUFzQixFQUFDLE1BQU0s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QUMsUUFBUSxLQUFLLElBQUksQ0FBQyxZQUFZO1lBQ25DLElBQUksQ0FBQyxXQUFXLEVBQUUsSUFBSSxFQUFFLEtBQUssNEJBQTRCLEVBQUUsQ0FBQztZQUM5RCxlQUFlLEdBQUcsSUFBSSxDQUFDO1lBQ3ZCLE1BQU07UUFDUixDQUFDO0lBQ0gsQ0FBQztJQUNELElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztRQUNyQixNQUFNLElBQUksWUFBWSxtRUFFbEIsT0FBTyxTQUFTLEtBQUssV0FBVyxJQUFJLFNBQVM7WUFDekMsd0ZBQXdGO2dCQUNwRix1RkFBdUY7Z0JBQ3ZGLDZFQUE2RTtnQkFDN0UsaUZBQWlGLENBQUMsQ0FBQztJQUNqRyxDQUFDO0FBQ0gsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0FQUF9CT09UU1RSQVBfTElTVEVORVIsIEFwcGxpY2F0aW9uUmVmLCB3aGVuU3RhYmxlfSBmcm9tICcuLi9hcHBsaWNhdGlvbi9hcHBsaWNhdGlvbl9yZWYnO1xuaW1wb3J0IHtDb25zb2xlfSBmcm9tICcuLi9jb25zb2xlJztcbmltcG9ydCB7RU5WSVJPTk1FTlRfSU5JVElBTElaRVIsIEVudmlyb25tZW50UHJvdmlkZXJzLCBJbmplY3RvciwgbWFrZUVudmlyb25tZW50UHJvdmlkZXJzLCBQcm92aWRlcn0gZnJvbSAnLi4vZGknO1xuaW1wb3J0IHtpbmplY3R9IGZyb20gJy4uL2RpL2luamVjdG9yX2NvbXBhdGliaWxpdHknO1xuaW1wb3J0IHtmb3JtYXRSdW50aW1lRXJyb3IsIFJ1bnRpbWVFcnJvciwgUnVudGltZUVycm9yQ29kZX0gZnJvbSAnLi4vZXJyb3JzJztcbmltcG9ydCB7ZW5hYmxlTG9jYXRlT3JDcmVhdGVDb250YWluZXJSZWZJbXBsfSBmcm9tICcuLi9saW5rZXIvdmlld19jb250YWluZXJfcmVmJztcbmltcG9ydCB7ZW5hYmxlTG9jYXRlT3JDcmVhdGVJMThuTm9kZUltcGx9IGZyb20gJy4uL3JlbmRlcjMvaTE4bi9pMThuX2FwcGx5JztcbmltcG9ydCB7ZW5hYmxlTG9jYXRlT3JDcmVhdGVFbGVtZW50Tm9kZUltcGx9IGZyb20gJy4uL3JlbmRlcjMvaW5zdHJ1Y3Rpb25zL2VsZW1lbnQnO1xuaW1wb3J0IHtlbmFibGVMb2NhdGVPckNyZWF0ZUVsZW1lbnRDb250YWluZXJOb2RlSW1wbH0gZnJvbSAnLi4vcmVuZGVyMy9pbnN0cnVjdGlvbnMvZWxlbWVudF9jb250YWluZXInO1xuaW1wb3J0IHtlbmFibGVBcHBseVJvb3RFbGVtZW50VHJhbnNmb3JtSW1wbH0gZnJvbSAnLi4vcmVuZGVyMy9pbnN0cnVjdGlvbnMvc2hhcmVkJztcbmltcG9ydCB7ZW5hYmxlTG9jYXRlT3JDcmVhdGVDb250YWluZXJBbmNob3JJbXBsfSBmcm9tICcuLi9yZW5kZXIzL2luc3RydWN0aW9ucy90ZW1wbGF0ZSc7XG5pbXBvcnQge2VuYWJsZUxvY2F0ZU9yQ3JlYXRlVGV4dE5vZGVJbXBsfSBmcm9tICcuLi9yZW5kZXIzL2luc3RydWN0aW9ucy90ZXh0JztcbmltcG9ydCB7Z2V0RG9jdW1lbnR9IGZyb20gJy4uL3JlbmRlcjMvaW50ZXJmYWNlcy9kb2N1bWVudCc7XG5pbXBvcnQge2lzUGxhdGZvcm1Ccm93c2VyfSBmcm9tICcuLi9yZW5kZXIzL3V0aWwvbWlzY191dGlscyc7XG5pbXBvcnQge1RyYW5zZmVyU3RhdGV9IGZyb20gJy4uL3RyYW5zZmVyX3N0YXRlJztcbmltcG9ydCB7cGVyZm9ybWFuY2VNYXJrRmVhdHVyZX0gZnJvbSAnLi4vdXRpbC9wZXJmb3JtYW5jZSc7XG5pbXBvcnQge05nWm9uZX0gZnJvbSAnLi4vem9uZSc7XG5cbmltcG9ydCB7Y2xlYW51cERlaHlkcmF0ZWRWaWV3c30gZnJvbSAnLi9jbGVhbnVwJztcbmltcG9ydCB7ZW5hYmxlQ2xhaW1EZWh5ZHJhdGVkSWN1Q2FzZUltcGwsIGVuYWJsZVByZXBhcmVJMThuQmxvY2tGb3JIeWRyYXRpb25JbXBsLCBpc0kxOG5IeWRyYXRpb25FbmFibGVkLCBzZXRJc0kxOG5IeWRyYXRpb25TdXBwb3J0RW5hYmxlZH0gZnJvbSAnLi9pMThuJztcbmltcG9ydCB7SVNfSFlEUkFUSU9OX0RPTV9SRVVTRV9FTkFCTEVELCBJU19JMThOX0hZRFJBVElPTl9FTkFCTEVELCBQUkVTRVJWRV9IT1NUX0NPTlRFTlR9IGZyb20gJy4vdG9rZW5zJztcbmltcG9ydCB7ZW5hYmxlUmV0cmlldmVIeWRyYXRpb25JbmZvSW1wbCwgTkdIX0RBVEFfS0VZLCBTU1JfQ09OVEVOVF9JTlRFR1JJVFlfTUFSS0VSfSBmcm9tICcuL3V0aWxzJztcbmltcG9ydCB7ZW5hYmxlRmluZE1hdGNoaW5nRGVoeWRyYXRlZFZpZXdJbXBsfSBmcm9tICcuL3ZpZXdzJztcblxuLyoqXG4gKiBJbmRpY2F0ZXMgd2hldGhlciB0aGUgaHlkcmF0aW9uLXJlbGF0ZWQgY29kZSB3YXMgYWRkZWQsXG4gKiBwcmV2ZW50cyBhZGRpbmcgaXQgbXVsdGlwbGUgdGltZXMuXG4gKi9cbmxldCBpc0h5ZHJhdGlvblN1cHBvcnRFbmFibGVkID0gZmFsc2U7XG5cbi8qKlxuICogSW5kaWNhdGVzIHdoZXRoZXIgdGhlIGkxOG4tcmVsYXRlZCBjb2RlIHdhcyBhZGRlZCxcbiAqIHByZXZlbnRzIGFkZGluZyBpdCBtdWx0aXBsZSB0aW1lcy5cbiAqXG4gKiBOb3RlOiBUaGlzIG1lcmVseSBjb250cm9scyB3aGV0aGVyIHRoZSBjb2RlIGlzIGxvYWRlZCxcbiAqIHdoaWxlIGBzZXRJc0kxOG5IeWRyYXRpb25TdXBwb3J0RW5hYmxlZGAgZGV0ZXJtaW5lc1xuICogd2hldGhlciBpMThuIGJsb2NrcyBhcmUgc2VyaWFsaXplZCBvciBoeWRyYXRlZC5cbiAqL1xubGV0IGlzSTE4bkh5ZHJhdGlvblJ1bnRpbWVTdXBwb3J0RW5hYmxlZCA9IGZhbHNlO1xuXG4vKipcbiAqIERlZmluZXMgYSBwZXJpb2Qgb2YgdGltZSB0aGF0IEFuZ3VsYXIgd2FpdHMgZm9yIHRoZSBgQXBwbGljYXRpb25SZWYuaXNTdGFibGVgIHRvIGVtaXQgYHRydWVgLlxuICogSWYgdGhlcmUgd2FzIG5vIGV2ZW50IHdpdGggdGhlIGB0cnVlYCB2YWx1ZSBkdXJpbmcgdGhpcyB0aW1lLCBBbmd1bGFyIHJlcG9ydHMgYSB3YXJuaW5nLlxuICovXG5jb25zdCBBUFBMSUNBVElPTl9JU19TVEFCTEVfVElNRU9VVCA9IDEwXzAwMDtcblxuLyoqXG4gKiBCcmluZ3MgdGhlIG5lY2Vzc2FyeSBoeWRyYXRpb24gY29kZSBpbiB0cmVlLXNoYWthYmxlIG1hbm5lci5cbiAqIFRoZSBjb2RlIGlzIG9ubHkgcHJlc2VudCB3aGVuIHRoZSBgcHJvdmlkZUNsaWVudEh5ZHJhdGlvbmAgaXNcbiAqIGludm9rZWQuIE90aGVyd2lzZSwgdGhpcyBjb2RlIGlzIHRyZWUtc2hha2VuIGF3YXkgZHVyaW5nIHRoZVxuICogYnVpbGQgb3B0aW1pemF0aW9uIHN0ZXAuXG4gKlxuICogVGhpcyB0ZWNobmlxdWUgYWxsb3dzIHVzIHRvIHN3YXAgaW1wbGVtZW50YXRpb25zIG9mIG1ldGhvZHMgc29cbiAqIHRyZWUgc2hha2luZyB3b3JrcyBhcHByb3ByaWF0ZWx5IHdoZW4gaHlkcmF0aW9uIGlzIGRpc2FibGVkIG9yXG4gKiBlbmFibGVkLiBJdCBicmluZ3MgaW4gdGhlIGFwcHJvcHJpYXRlIHZlcnNpb24gb2YgdGhlIG1ldGhvZCB0aGF0XG4gKiBzdXBwb3J0cyBoeWRyYXRpb24gb25seSB3aGVuIGVuYWJsZWQuXG4gKi9cbmZ1bmN0aW9uIGVuYWJsZUh5ZHJhdGlvblJ1bnRpbWVTdXBwb3J0KCkge1xuICBpZiAoIWlzSHlkcmF0aW9uU3VwcG9ydEVuYWJsZWQpIHtcbiAgICBpc0h5ZHJhdGlvblN1cHBvcnRFbmFibGVkID0gdHJ1ZTtcbiAgICBlbmFibGVSZXRyaWV2ZUh5ZHJhdGlvbkluZm9JbXBsKCk7XG4gICAgZW5hYmxlTG9jYXRlT3JDcmVhdGVFbGVtZW50Tm9kZUltcGwoKTtcbiAgICBlbmFibGVMb2NhdGVPckNyZWF0ZVRleHROb2RlSW1wbCgpO1xuICAgIGVuYWJsZUxvY2F0ZU9yQ3JlYXRlRWxlbWVudENvbnRhaW5lck5vZGVJbXBsKCk7XG4gICAgZW5hYmxlTG9jYXRlT3JDcmVhdGVDb250YWluZXJBbmNob3JJbXBsKCk7XG4gICAgZW5hYmxlTG9jYXRlT3JDcmVhdGVDb250YWluZXJSZWZJbXBsKCk7XG4gICAgZW5hYmxlRmluZE1hdGNoaW5nRGVoeWRyYXRlZFZpZXdJbXBsKCk7XG4gICAgZW5hYmxlQXBwbHlSb290RWxlbWVudFRyYW5zZm9ybUltcGwoKTtcbiAgfVxufVxuXG4vKipcbiAqIEJyaW5ncyB0aGUgbmVjZXNzYXJ5IGkxOG4gaHlkcmF0aW9uIGNvZGUgaW4gdHJlZS1zaGFrYWJsZSBtYW5uZXIuXG4gKiBTaW1pbGFyIHRvIGBlbmFibGVIeWRyYXRpb25SdW50aW1lU3VwcG9ydGAsIHRoZSBjb2RlIGlzIG9ubHlcbiAqIHByZXNlbnQgd2hlbiBgd2l0aEkxOG5TdXBwb3J0YCBpcyBpbnZva2VkLlxuICovXG5mdW5jdGlvbiBlbmFibGVJMThuSHlkcmF0aW9uUnVudGltZVN1cHBvcnQoKSB7XG4gIGlmICghaXNJMThuSHlkcmF0aW9uUnVudGltZVN1cHBvcnRFbmFibGVkKSB7XG4gICAgaXNJMThuSHlkcmF0aW9uUnVudGltZVN1cHBvcnRFbmFibGVkID0gdHJ1ZTtcbiAgICBlbmFibGVMb2NhdGVPckNyZWF0ZUkxOG5Ob2RlSW1wbCgpO1xuICAgIGVuYWJsZVByZXBhcmVJMThuQmxvY2tGb3JIeWRyYXRpb25JbXBsKCk7XG4gICAgZW5hYmxlQ2xhaW1EZWh5ZHJhdGVkSWN1Q2FzZUltcGwoKTtcbiAgfVxufVxuXG4vKipcbiAqIE91dHB1dHMgYSBtZXNzYWdlIHdpdGggaHlkcmF0aW9uIHN0YXRzIGludG8gYSBjb25zb2xlLlxuICovXG5mdW5jdGlvbiBwcmludEh5ZHJhdGlvblN0YXRzKGluamVjdG9yOiBJbmplY3Rvcikge1xuICBjb25zdCBjb25zb2xlID0gaW5qZWN0b3IuZ2V0KENvbnNvbGUpO1xuICBjb25zdCBtZXNzYWdlID0gYEFuZ3VsYXIgaHlkcmF0ZWQgJHtuZ0Rldk1vZGUhLmh5ZHJhdGVkQ29tcG9uZW50c30gY29tcG9uZW50KHMpIGAgK1xuICAgICAgYGFuZCAke25nRGV2TW9kZSEuaHlkcmF0ZWROb2Rlc30gbm9kZShzKSwgYCArXG4gICAgICBgJHtuZ0Rldk1vZGUhLmNvbXBvbmVudHNTa2lwcGVkSHlkcmF0aW9ufSBjb21wb25lbnQocykgd2VyZSBza2lwcGVkLiBgICtcbiAgICAgIGBMZWFybiBtb3JlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9ndWlkZS9oeWRyYXRpb24uYDtcbiAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOm5vLWNvbnNvbGVcbiAgY29uc29sZS5sb2cobWVzc2FnZSk7XG59XG5cblxuLyoqXG4gKiBSZXR1cm5zIGEgUHJvbWlzZSB0aGF0IGlzIHJlc29sdmVkIHdoZW4gYW4gYXBwbGljYXRpb24gYmVjb21lcyBzdGFibGUuXG4gKi9cbmZ1bmN0aW9uIHdoZW5TdGFibGVXaXRoVGltZW91dChhcHBSZWY6IEFwcGxpY2F0aW9uUmVmLCBpbmplY3RvcjogSW5qZWN0b3IpOiBQcm9taXNlPHZvaWQ+IHtcbiAgY29uc3Qgd2hlblN0YWJsZVByb21pc2UgPSB3aGVuU3RhYmxlKGFwcFJlZik7XG4gIGlmICh0eXBlb2YgbmdEZXZNb2RlICE9PSAndW5kZWZpbmVkJyAmJiBuZ0Rldk1vZGUpIHtcbiAgICBjb25zdCB0aW1lb3V0VGltZSA9IEFQUExJQ0FUSU9OX0lTX1NUQUJMRV9USU1FT1VUO1xuICAgIGNvbnN0IGNvbnNvbGUgPSBpbmplY3Rvci5nZXQoQ29uc29sZSk7XG4gICAgY29uc3Qgbmdab25lID0gaW5qZWN0b3IuZ2V0KE5nWm9uZSk7XG5cbiAgICAvLyBUaGUgZm9sbG93aW5nIGNhbGwgc2hvdWxkIG5vdCBhbmQgZG9lcyBub3QgcHJldmVudCB0aGUgYXBwIHRvIGJlY29tZSBzdGFibGVcbiAgICAvLyBXZSBjYW5ub3QgdXNlIFJ4SlMgdGltZXIgaGVyZSBiZWNhdXNlIHRoZSBhcHAgd291bGQgcmVtYWluIHVuc3RhYmxlLlxuICAgIC8vIFRoaXMgYWxzbyBhdm9pZHMgYW4gZXh0cmEgY2hhbmdlIGRldGVjdGlvbiBjeWNsZS5cbiAgICBjb25zdCB0aW1lb3V0SWQgPSBuZ1pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4ge1xuICAgICAgcmV0dXJuIHNldFRpbWVvdXQoKCkgPT4gbG9nV2FybmluZ09uU3RhYmxlVGltZWRvdXQodGltZW91dFRpbWUsIGNvbnNvbGUpLCB0aW1lb3V0VGltZSk7XG4gICAgfSk7XG5cbiAgICB3aGVuU3RhYmxlUHJvbWlzZS5maW5hbGx5KCgpID0+IGNsZWFyVGltZW91dCh0aW1lb3V0SWQpKTtcbiAgfVxuXG4gIHJldHVybiB3aGVuU3RhYmxlUHJvbWlzZTtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIGEgc2V0IG9mIHByb3ZpZGVycyByZXF1aXJlZCB0byBzZXR1cCBoeWRyYXRpb24gc3VwcG9ydFxuICogZm9yIGFuIGFwcGxpY2F0aW9uIHRoYXQgaXMgc2VydmVyIHNpZGUgcmVuZGVyZWQuIFRoaXMgZnVuY3Rpb24gaXNcbiAqIGluY2x1ZGVkIGludG8gdGhlIGBwcm92aWRlQ2xpZW50SHlkcmF0aW9uYCBwdWJsaWMgQVBJIGZ1bmN0aW9uIGZyb21cbiAqIHRoZSBgcGxhdGZvcm0tYnJvd3NlcmAgcGFja2FnZS5cbiAqXG4gKiBUaGUgZnVuY3Rpb24gc2V0cyB1cCBhbiBpbnRlcm5hbCBmbGFnIHRoYXQgd291bGQgYmUgcmVjb2duaXplZCBkdXJpbmdcbiAqIHRoZSBzZXJ2ZXIgc2lkZSByZW5kZXJpbmcgdGltZSBhcyB3ZWxsLCBzbyB0aGVyZSBpcyBubyBuZWVkIHRvXG4gKiBjb25maWd1cmUgb3IgY2hhbmdlIGFueXRoaW5nIGluIE5nVW5pdmVyc2FsIHRvIGVuYWJsZSB0aGUgZmVhdHVyZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHdpdGhEb21IeWRyYXRpb24oKTogRW52aXJvbm1lbnRQcm92aWRlcnMge1xuICByZXR1cm4gbWFrZUVudmlyb25tZW50UHJvdmlkZXJzKFtcbiAgICB7XG4gICAgICBwcm92aWRlOiBJU19IWURSQVRJT05fRE9NX1JFVVNFX0VOQUJMRUQsXG4gICAgICB1c2VGYWN0b3J5OiAoKSA9PiB7XG4gICAgICAgIGxldCBpc0VuYWJsZWQgPSB0cnVlO1xuICAgICAgICBpZiAoaXNQbGF0Zm9ybUJyb3dzZXIoKSkge1xuICAgICAgICAgIC8vIE9uIHRoZSBjbGllbnQsIHZlcmlmeSB0aGF0IHRoZSBzZXJ2ZXIgcmVzcG9uc2UgY29udGFpbnNcbiAgICAgICAgICAvLyBoeWRyYXRpb24gYW5ub3RhdGlvbnMuIE90aGVyd2lzZSwga2VlcCBoeWRyYXRpb24gZGlzYWJsZWQuXG4gICAgICAgICAgY29uc3QgdHJhbnNmZXJTdGF0ZSA9IGluamVjdChUcmFuc2ZlclN0YXRlLCB7b3B0aW9uYWw6IHRydWV9KTtcbiAgICAgICAgICBpc0VuYWJsZWQgPSAhIXRyYW5zZmVyU3RhdGU/LmdldChOR0hfREFUQV9LRVksIG51bGwpO1xuICAgICAgICAgIGlmICghaXNFbmFibGVkICYmICh0eXBlb2YgbmdEZXZNb2RlICE9PSAndW5kZWZpbmVkJyAmJiBuZ0Rldk1vZGUpKSB7XG4gICAgICAgICAgICBjb25zdCBjb25zb2xlID0gaW5qZWN0KENvbnNvbGUpO1xuICAgICAgICAgICAgY29uc3QgbWVzc2FnZSA9IGZvcm1hdFJ1bnRpbWVFcnJvcihcbiAgICAgICAgICAgICAgICBSdW50aW1lRXJyb3JDb2RlLk1JU1NJTkdfSFlEUkFUSU9OX0FOTk9UQVRJT05TLFxuICAgICAgICAgICAgICAgICdBbmd1bGFyIGh5ZHJhdGlvbiB3YXMgcmVxdWVzdGVkIG9uIHRoZSBjbGllbnQsIGJ1dCB0aGVyZSB3YXMgbm8gJyArXG4gICAgICAgICAgICAgICAgICAgICdzZXJpYWxpemVkIGluZm9ybWF0aW9uIHByZXNlbnQgaW4gdGhlIHNlcnZlciByZXNwb25zZSwgJyArXG4gICAgICAgICAgICAgICAgICAgICd0aHVzIGh5ZHJhdGlvbiB3YXMgbm90IGVuYWJsZWQuICcgK1xuICAgICAgICAgICAgICAgICAgICAnTWFrZSBzdXJlIHRoZSBgcHJvdmlkZUNsaWVudEh5ZHJhdGlvbigpYCBpcyBpbmNsdWRlZCBpbnRvIHRoZSBsaXN0ICcgK1xuICAgICAgICAgICAgICAgICAgICAnb2YgcHJvdmlkZXJzIGluIHRoZSBzZXJ2ZXIgcGFydCBvZiB0aGUgYXBwbGljYXRpb24gY29uZmlndXJhdGlvbi4nKTtcbiAgICAgICAgICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTpuby1jb25zb2xlXG4gICAgICAgICAgICBjb25zb2xlLndhcm4obWVzc2FnZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChpc0VuYWJsZWQpIHtcbiAgICAgICAgICBwZXJmb3JtYW5jZU1hcmtGZWF0dXJlKCdOZ0h5ZHJhdGlvbicpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBpc0VuYWJsZWQ7XG4gICAgICB9LFxuICAgIH0sXG4gICAge1xuICAgICAgcHJvdmlkZTogRU5WSVJPTk1FTlRfSU5JVElBTElaRVIsXG4gICAgICB1c2VWYWx1ZTogKCkgPT4ge1xuICAgICAgICAvLyBpMThuIHN1cHBvcnQgaXMgZW5hYmxlZCBieSBjYWxsaW5nIHdpdGhJMThuU3VwcG9ydCgpLCBidXQgdGhlcmUnc1xuICAgICAgICAvLyBubyB3YXkgdG8gdHVybiBpdCBvZmYgKGUuZy4gZm9yIHRlc3RzKSwgc28gd2UgdHVybiBpdCBvZmYgYnkgZGVmYXVsdC5cbiAgICAgICAgc2V0SXNJMThuSHlkcmF0aW9uU3VwcG9ydEVuYWJsZWQoZmFsc2UpO1xuXG4gICAgICAgIC8vIFNpbmNlIHRoaXMgZnVuY3Rpb24gaXMgdXNlZCBhY3Jvc3MgYm90aCBzZXJ2ZXIgYW5kIGNsaWVudCxcbiAgICAgICAgLy8gbWFrZSBzdXJlIHRoYXQgdGhlIHJ1bnRpbWUgY29kZSBpcyBvbmx5IGFkZGVkIHdoZW4gaW52b2tlZFxuICAgICAgICAvLyBvbiB0aGUgY2xpZW50LiBNb3ZpbmcgZm9yd2FyZCwgdGhlIGBpc1BsYXRmb3JtQnJvd3NlcmAgY2hlY2sgc2hvdWxkXG4gICAgICAgIC8vIGJlIHJlcGxhY2VkIHdpdGggYSB0cmVlLXNoYWthYmxlIGFsdGVybmF0aXZlIChlLmcuIGBpc1NlcnZlcmBcbiAgICAgICAgLy8gZmxhZykuXG4gICAgICAgIGlmIChpc1BsYXRmb3JtQnJvd3NlcigpICYmIGluamVjdChJU19IWURSQVRJT05fRE9NX1JFVVNFX0VOQUJMRUQpKSB7XG4gICAgICAgICAgdmVyaWZ5U3NyQ29udGVudHNJbnRlZ3JpdHkoKTtcbiAgICAgICAgICBlbmFibGVIeWRyYXRpb25SdW50aW1lU3VwcG9ydCgpO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgbXVsdGk6IHRydWUsXG4gICAgfSxcbiAgICB7XG4gICAgICBwcm92aWRlOiBQUkVTRVJWRV9IT1NUX0NPTlRFTlQsXG4gICAgICB1c2VGYWN0b3J5OiAoKSA9PiB7XG4gICAgICAgIC8vIFByZXNlcnZlIGhvc3QgZWxlbWVudCBjb250ZW50IG9ubHkgaW4gYSBicm93c2VyXG4gICAgICAgIC8vIGVudmlyb25tZW50IGFuZCB3aGVuIGh5ZHJhdGlvbiBpcyBjb25maWd1cmVkIHByb3Blcmx5LlxuICAgICAgICAvLyBPbiBhIHNlcnZlciwgYW4gYXBwbGljYXRpb24gaXMgcmVuZGVyZWQgZnJvbSBzY3JhdGNoLFxuICAgICAgICAvLyBzbyB0aGUgaG9zdCBjb250ZW50IG5lZWRzIHRvIGJlIGVtcHR5LlxuICAgICAgICByZXR1cm4gaXNQbGF0Zm9ybUJyb3dzZXIoKSAmJiBpbmplY3QoSVNfSFlEUkFUSU9OX0RPTV9SRVVTRV9FTkFCTEVEKTtcbiAgICAgIH1cbiAgICB9LFxuICAgIHtcbiAgICAgIHByb3ZpZGU6IEFQUF9CT09UU1RSQVBfTElTVEVORVIsXG4gICAgICB1c2VGYWN0b3J5OiAoKSA9PiB7XG4gICAgICAgIGlmIChpc1BsYXRmb3JtQnJvd3NlcigpICYmIGluamVjdChJU19IWURSQVRJT05fRE9NX1JFVVNFX0VOQUJMRUQpKSB7XG4gICAgICAgICAgY29uc3QgYXBwUmVmID0gaW5qZWN0KEFwcGxpY2F0aW9uUmVmKTtcbiAgICAgICAgICBjb25zdCBpbmplY3RvciA9IGluamVjdChJbmplY3Rvcik7XG4gICAgICAgICAgcmV0dXJuICgpID0+IHtcbiAgICAgICAgICAgIC8vIFdhaXQgdW50aWwgYW4gYXBwIGJlY29tZXMgc3RhYmxlIGFuZCBjbGVhbnVwIGFsbCB2aWV3cyB0aGF0XG4gICAgICAgICAgICAvLyB3ZXJlIG5vdCBjbGFpbWVkIGR1cmluZyB0aGUgYXBwbGljYXRpb24gYm9vdHN0cmFwIHByb2Nlc3MuXG4gICAgICAgICAgICAvLyBUaGUgdGltaW5nIGlzIHNpbWlsYXIgdG8gd2hlbiB3ZSBzdGFydCB0aGUgc2VyaWFsaXphdGlvbiBwcm9jZXNzXG4gICAgICAgICAgICAvLyBvbiB0aGUgc2VydmVyLlxuICAgICAgICAgICAgLy9cbiAgICAgICAgICAgIC8vIE5vdGU6IHRoZSBjbGVhbnVwIHRhc2sgKk1VU1QqIGJlIHNjaGVkdWxlZCB3aXRoaW4gdGhlIEFuZ3VsYXIgem9uZSBpbiBab25lIGFwcHNcbiAgICAgICAgICAgIC8vIHRvIGVuc3VyZSB0aGF0IGNoYW5nZSBkZXRlY3Rpb24gaXMgcHJvcGVybHkgcnVuIGFmdGVyd2FyZC5cbiAgICAgICAgICAgIHdoZW5TdGFibGVXaXRoVGltZW91dChhcHBSZWYsIGluamVjdG9yKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgY2xlYW51cERlaHlkcmF0ZWRWaWV3cyhhcHBSZWYpO1xuICAgICAgICAgICAgICBpZiAodHlwZW9mIG5nRGV2TW9kZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbmdEZXZNb2RlKSB7XG4gICAgICAgICAgICAgICAgcHJpbnRIeWRyYXRpb25TdGF0cyhpbmplY3Rvcik7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuICgpID0+IHt9OyAgLy8gbm9vcFxuICAgICAgfSxcbiAgICAgIG11bHRpOiB0cnVlLFxuICAgIH1cbiAgXSk7XG59XG5cbi8qKlxuICogUmV0dXJucyBhIHNldCBvZiBwcm92aWRlcnMgcmVxdWlyZWQgdG8gc2V0dXAgc3VwcG9ydCBmb3IgaTE4biBoeWRyYXRpb24uXG4gKiBSZXF1aXJlcyBoeWRyYXRpb24gdG8gYmUgZW5hYmxlZCBzZXBhcmF0ZWx5LlxuICovXG5leHBvcnQgZnVuY3Rpb24gd2l0aEkxOG5TdXBwb3J0KCk6IFByb3ZpZGVyW10ge1xuICByZXR1cm4gW1xuICAgIHtcbiAgICAgIHByb3ZpZGU6IElTX0kxOE5fSFlEUkFUSU9OX0VOQUJMRUQsXG4gICAgICB1c2VWYWx1ZTogdHJ1ZSxcbiAgICB9LFxuICAgIHtcbiAgICAgIHByb3ZpZGU6IEVOVklST05NRU5UX0lOSVRJQUxJWkVSLFxuICAgICAgdXNlVmFsdWU6ICgpID0+IHtcbiAgICAgICAgZW5hYmxlSTE4bkh5ZHJhdGlvblJ1bnRpbWVTdXBwb3J0KCk7XG4gICAgICAgIHNldElzSTE4bkh5ZHJhdGlvblN1cHBvcnRFbmFibGVkKHRydWUpO1xuICAgICAgICBwZXJmb3JtYW5jZU1hcmtGZWF0dXJlKCdOZ0kxOG5IeWRyYXRpb24nKTtcbiAgICAgIH0sXG4gICAgICBtdWx0aTogdHJ1ZSxcbiAgICB9LFxuICBdO1xufVxuXG4vKipcbiAqXG4gKiBAcGFyYW0gdGltZSBUaGUgdGltZSBpbiBtcyB1bnRpbCB0aGUgc3RhYmxlIHRpbWVkb3V0IHdhcm5pbmcgbWVzc2FnZSBpcyBsb2dnZWRcbiAqL1xuZnVuY3Rpb24gbG9nV2FybmluZ09uU3RhYmxlVGltZWRvdXQodGltZTogbnVtYmVyLCBjb25zb2xlOiBDb25zb2xlKTogdm9pZCB7XG4gIGNvbnN0IG1lc3NhZ2UgPVxuICAgICAgYEFuZ3VsYXIgaHlkcmF0aW9uIGV4cGVjdGVkIHRoZSBBcHBsaWNhdGlvblJlZi5pc1N0YWJsZSgpIHRvIGVtaXQgXFxgdHJ1ZVxcYCwgYnV0IGl0IGAgK1xuICAgICAgYGRpZG4ndCBoYXBwZW4gd2l0aGluICR7XG4gICAgICAgICAgdGltZX1tcy4gQW5ndWxhciBoeWRyYXRpb24gbG9naWMgZGVwZW5kcyBvbiB0aGUgYXBwbGljYXRpb24gYmVjb21pbmcgc3RhYmxlIGAgK1xuICAgICAgYGFzIGEgc2lnbmFsIHRvIGNvbXBsZXRlIGh5ZHJhdGlvbiBwcm9jZXNzLmA7XG5cbiAgY29uc29sZS53YXJuKGZvcm1hdFJ1bnRpbWVFcnJvcihSdW50aW1lRXJyb3JDb2RlLkhZRFJBVElPTl9TVEFCTEVfVElNRURPVVQsIG1lc3NhZ2UpKTtcbn1cblxuLyoqXG4gKiBWZXJpZmllcyB3aGV0aGVyIHRoZSBET00gY29udGFpbnMgYSBzcGVjaWFsIG1hcmtlciBhZGRlZCBkdXJpbmcgU1NSIHRpbWUgdG8gbWFrZSBzdXJlXG4gKiB0aGVyZSBpcyBubyBTU1InZWQgY29udGVudHMgdHJhbnNmb3JtYXRpb25zIGhhcHBlbiBhZnRlciBTU1IgaXMgY29tcGxldGVkLiBUeXBpY2FsbHkgdGhhdFxuICogaGFwcGVucyBlaXRoZXIgYnkgQ0ROIG9yIGR1cmluZyB0aGUgYnVpbGQgcHJvY2VzcyBhcyBhbiBvcHRpbWl6YXRpb24gdG8gcmVtb3ZlIGNvbW1lbnQgbm9kZXMuXG4gKiBIeWRyYXRpb24gcHJvY2VzcyByZXF1aXJlcyBjb21tZW50IG5vZGVzIHByb2R1Y2VkIGJ5IEFuZ3VsYXIgdG8gbG9jYXRlIGNvcnJlY3QgRE9NIHNlZ21lbnRzLlxuICogV2hlbiB0aGlzIHNwZWNpYWwgbWFya2VyIGlzICpub3QqIHByZXNlbnQgLSB0aHJvdyBhbiBlcnJvciBhbmQgZG8gbm90IHByb2NlZWQgd2l0aCBoeWRyYXRpb24sXG4gKiBzaW5jZSBpdCB3aWxsIG5vdCBiZSBhYmxlIHRvIGZ1bmN0aW9uIGNvcnJlY3RseS5cbiAqXG4gKiBOb3RlOiB0aGlzIGZ1bmN0aW9uIGlzIGludm9rZWQgb25seSBvbiB0aGUgY2xpZW50LCBzbyBpdCdzIHNhZmUgdG8gdXNlIERPTSBBUElzLlxuICovXG5mdW5jdGlvbiB2ZXJpZnlTc3JDb250ZW50c0ludGVncml0eSgpOiB2b2lkIHtcbiAgY29uc3QgZG9jID0gZ2V0RG9jdW1lbnQoKTtcbiAgbGV0IGh5ZHJhdGlvbk1hcmtlcjogTm9kZXx1bmRlZmluZWQ7XG4gIGZvciAoY29uc3Qgbm9kZSBvZiBkb2MuYm9keS5jaGlsZE5vZGVzKSB7XG4gICAgaWYgKG5vZGUubm9kZVR5cGUgPT09IE5vZGUuQ09NTUVOVF9OT0RFICYmXG4gICAgICAgIG5vZGUudGV4dENvbnRlbnQ/LnRyaW0oKSA9PT0gU1NSX0NPTlRFTlRfSU5URUdSSVRZX01BUktFUikge1xuICAgICAgaHlkcmF0aW9uTWFya2VyID0gbm9kZTtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuICBpZiAoIWh5ZHJhdGlvbk1hcmtlcikge1xuICAgIHRocm93IG5ldyBSdW50aW1lRXJyb3IoXG4gICAgICAgIFJ1bnRpbWVFcnJvckNvZGUuTUlTU0lOR19TU1JfQ09OVEVOVF9JTlRFR1JJVFlfTUFSS0VSLFxuICAgICAgICB0eXBlb2YgbmdEZXZNb2RlICE9PSAndW5kZWZpbmVkJyAmJiBuZ0Rldk1vZGUgJiZcbiAgICAgICAgICAgICdBbmd1bGFyIGh5ZHJhdGlvbiBsb2dpYyBkZXRlY3RlZCB0aGF0IEhUTUwgY29udGVudCBvZiB0aGlzIHBhZ2Ugd2FzIG1vZGlmaWVkIGFmdGVyIGl0ICcgK1xuICAgICAgICAgICAgICAgICd3YXMgcHJvZHVjZWQgZHVyaW5nIHNlcnZlciBzaWRlIHJlbmRlcmluZy4gTWFrZSBzdXJlIHRoYXQgdGhlcmUgYXJlIG5vIG9wdGltaXphdGlvbnMgJyArXG4gICAgICAgICAgICAgICAgJ3RoYXQgcmVtb3ZlIGNvbW1lbnQgbm9kZXMgZnJvbSBIVE1MIGVuYWJsZWQgb24geW91ciBDRE4uIEFuZ3VsYXIgaHlkcmF0aW9uICcgK1xuICAgICAgICAgICAgICAgICdyZWxpZXMgb24gSFRNTCBwcm9kdWNlZCBieSB0aGUgc2VydmVyLCBpbmNsdWRpbmcgd2hpdGVzcGFjZXMgYW5kIGNvbW1lbnQgbm9kZXMuJyk7XG4gIH1cbn1cbiJdfQ==