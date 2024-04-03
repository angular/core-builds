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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBpLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvaHlkcmF0aW9uL2FwaS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsc0JBQXNCLEVBQUUsY0FBYyxFQUFFLFVBQVUsRUFBQyxNQUFNLGdDQUFnQyxDQUFDO0FBQ2xHLE9BQU8sRUFBQyxPQUFPLEVBQUMsTUFBTSxZQUFZLENBQUM7QUFDbkMsT0FBTyxFQUFDLHVCQUF1QixFQUF3QixRQUFRLEVBQUUsd0JBQXdCLEVBQVcsTUFBTSxPQUFPLENBQUM7QUFDbEgsT0FBTyxFQUFDLE1BQU0sRUFBQyxNQUFNLDhCQUE4QixDQUFDO0FBQ3BELE9BQU8sRUFBQyxrQkFBa0IsRUFBRSxZQUFZLEVBQW1CLE1BQU0sV0FBVyxDQUFDO0FBQzdFLE9BQU8sRUFBQyxvQ0FBb0MsRUFBQyxNQUFNLDhCQUE4QixDQUFDO0FBQ2xGLE9BQU8sRUFBQyxnQ0FBZ0MsRUFBQyxNQUFNLDRCQUE0QixDQUFDO0FBQzVFLE9BQU8sRUFBQyxtQ0FBbUMsRUFBQyxNQUFNLGlDQUFpQyxDQUFDO0FBQ3BGLE9BQU8sRUFBQyw0Q0FBNEMsRUFBQyxNQUFNLDJDQUEyQyxDQUFDO0FBQ3ZHLE9BQU8sRUFBQyxtQ0FBbUMsRUFBQyxNQUFNLGdDQUFnQyxDQUFDO0FBQ25GLE9BQU8sRUFBQyx1Q0FBdUMsRUFBQyxNQUFNLGtDQUFrQyxDQUFDO0FBQ3pGLE9BQU8sRUFBQyxnQ0FBZ0MsRUFBQyxNQUFNLDhCQUE4QixDQUFDO0FBQzlFLE9BQU8sRUFBQyxXQUFXLEVBQUMsTUFBTSxnQ0FBZ0MsQ0FBQztBQUMzRCxPQUFPLEVBQUMsaUJBQWlCLEVBQUMsTUFBTSw0QkFBNEIsQ0FBQztBQUM3RCxPQUFPLEVBQUMsYUFBYSxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDaEQsT0FBTyxFQUFDLHNCQUFzQixFQUFDLE1BQU0s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LFVBQVUsRUFBRSxDQUFDO1FBQ3ZDLElBQUksSUFBSSxDQUFDLFFBQVEsS0FBSyxJQUFJLENBQUMsWUFBWTtZQUNuQyxJQUFJLENBQUMsV0FBVyxFQUFFLElBQUksRUFBRSxLQUFLLDRCQUE0QixFQUFFLENBQUM7WUFDOUQsZUFBZSxHQUFHLElBQUksQ0FBQztZQUN2QixNQUFNO1FBQ1IsQ0FBQztJQUNILENBQUM7SUFDRCxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7UUFDckIsTUFBTSxJQUFJLFlBQVksbUVBRWxCLE9BQU8sU0FBUyxLQUFLLFdBQVcsSUFBSSxTQUFTO1lBQ3pDLHdGQUF3RjtnQkFDcEYsdUZBQXVGO2dCQUN2Riw2RUFBNkU7Z0JBQzdFLGlGQUFpRixDQUFDLENBQUM7SUFDakcsQ0FBQztBQUNILENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtBUFBfQk9PVFNUUkFQX0xJU1RFTkVSLCBBcHBsaWNhdGlvblJlZiwgd2hlblN0YWJsZX0gZnJvbSAnLi4vYXBwbGljYXRpb24vYXBwbGljYXRpb25fcmVmJztcbmltcG9ydCB7Q29uc29sZX0gZnJvbSAnLi4vY29uc29sZSc7XG5pbXBvcnQge0VOVklST05NRU5UX0lOSVRJQUxJWkVSLCBFbnZpcm9ubWVudFByb3ZpZGVycywgSW5qZWN0b3IsIG1ha2VFbnZpcm9ubWVudFByb3ZpZGVycywgUHJvdmlkZXJ9IGZyb20gJy4uL2RpJztcbmltcG9ydCB7aW5qZWN0fSBmcm9tICcuLi9kaS9pbmplY3Rvcl9jb21wYXRpYmlsaXR5JztcbmltcG9ydCB7Zm9ybWF0UnVudGltZUVycm9yLCBSdW50aW1lRXJyb3IsIFJ1bnRpbWVFcnJvckNvZGV9IGZyb20gJy4uL2Vycm9ycyc7XG5pbXBvcnQge2VuYWJsZUxvY2F0ZU9yQ3JlYXRlQ29udGFpbmVyUmVmSW1wbH0gZnJvbSAnLi4vbGlua2VyL3ZpZXdfY29udGFpbmVyX3JlZic7XG5pbXBvcnQge2VuYWJsZUxvY2F0ZU9yQ3JlYXRlSTE4bk5vZGVJbXBsfSBmcm9tICcuLi9yZW5kZXIzL2kxOG4vaTE4bl9hcHBseSc7XG5pbXBvcnQge2VuYWJsZUxvY2F0ZU9yQ3JlYXRlRWxlbWVudE5vZGVJbXBsfSBmcm9tICcuLi9yZW5kZXIzL2luc3RydWN0aW9ucy9lbGVtZW50JztcbmltcG9ydCB7ZW5hYmxlTG9jYXRlT3JDcmVhdGVFbGVtZW50Q29udGFpbmVyTm9kZUltcGx9IGZyb20gJy4uL3JlbmRlcjMvaW5zdHJ1Y3Rpb25zL2VsZW1lbnRfY29udGFpbmVyJztcbmltcG9ydCB7ZW5hYmxlQXBwbHlSb290RWxlbWVudFRyYW5zZm9ybUltcGx9IGZyb20gJy4uL3JlbmRlcjMvaW5zdHJ1Y3Rpb25zL3NoYXJlZCc7XG5pbXBvcnQge2VuYWJsZUxvY2F0ZU9yQ3JlYXRlQ29udGFpbmVyQW5jaG9ySW1wbH0gZnJvbSAnLi4vcmVuZGVyMy9pbnN0cnVjdGlvbnMvdGVtcGxhdGUnO1xuaW1wb3J0IHtlbmFibGVMb2NhdGVPckNyZWF0ZVRleHROb2RlSW1wbH0gZnJvbSAnLi4vcmVuZGVyMy9pbnN0cnVjdGlvbnMvdGV4dCc7XG5pbXBvcnQge2dldERvY3VtZW50fSBmcm9tICcuLi9yZW5kZXIzL2ludGVyZmFjZXMvZG9jdW1lbnQnO1xuaW1wb3J0IHtpc1BsYXRmb3JtQnJvd3Nlcn0gZnJvbSAnLi4vcmVuZGVyMy91dGlsL21pc2NfdXRpbHMnO1xuaW1wb3J0IHtUcmFuc2ZlclN0YXRlfSBmcm9tICcuLi90cmFuc2Zlcl9zdGF0ZSc7XG5pbXBvcnQge3BlcmZvcm1hbmNlTWFya0ZlYXR1cmV9IGZyb20gJy4uL3V0aWwvcGVyZm9ybWFuY2UnO1xuaW1wb3J0IHtOZ1pvbmV9IGZyb20gJy4uL3pvbmUnO1xuXG5pbXBvcnQge2NsZWFudXBEZWh5ZHJhdGVkVmlld3N9IGZyb20gJy4vY2xlYW51cCc7XG5pbXBvcnQge2VuYWJsZUNsYWltRGVoeWRyYXRlZEljdUNhc2VJbXBsLCBlbmFibGVQcmVwYXJlSTE4bkJsb2NrRm9ySHlkcmF0aW9uSW1wbCwgaXNJMThuSHlkcmF0aW9uRW5hYmxlZCwgc2V0SXNJMThuSHlkcmF0aW9uU3VwcG9ydEVuYWJsZWR9IGZyb20gJy4vaTE4bic7XG5pbXBvcnQge0lTX0hZRFJBVElPTl9ET01fUkVVU0VfRU5BQkxFRCwgSVNfSTE4Tl9IWURSQVRJT05fRU5BQkxFRCwgUFJFU0VSVkVfSE9TVF9DT05URU5UfSBmcm9tICcuL3Rva2Vucyc7XG5pbXBvcnQge2VuYWJsZVJldHJpZXZlSHlkcmF0aW9uSW5mb0ltcGwsIE5HSF9EQVRBX0tFWSwgU1NSX0NPTlRFTlRfSU5URUdSSVRZX01BUktFUn0gZnJvbSAnLi91dGlscyc7XG5pbXBvcnQge2VuYWJsZUZpbmRNYXRjaGluZ0RlaHlkcmF0ZWRWaWV3SW1wbH0gZnJvbSAnLi92aWV3cyc7XG5cbi8qKlxuICogSW5kaWNhdGVzIHdoZXRoZXIgdGhlIGh5ZHJhdGlvbi1yZWxhdGVkIGNvZGUgd2FzIGFkZGVkLFxuICogcHJldmVudHMgYWRkaW5nIGl0IG11bHRpcGxlIHRpbWVzLlxuICovXG5sZXQgaXNIeWRyYXRpb25TdXBwb3J0RW5hYmxlZCA9IGZhbHNlO1xuXG4vKipcbiAqIEluZGljYXRlcyB3aGV0aGVyIHRoZSBpMThuLXJlbGF0ZWQgY29kZSB3YXMgYWRkZWQsXG4gKiBwcmV2ZW50cyBhZGRpbmcgaXQgbXVsdGlwbGUgdGltZXMuXG4gKlxuICogTm90ZTogVGhpcyBtZXJlbHkgY29udHJvbHMgd2hldGhlciB0aGUgY29kZSBpcyBsb2FkZWQsXG4gKiB3aGlsZSBgc2V0SXNJMThuSHlkcmF0aW9uU3VwcG9ydEVuYWJsZWRgIGRldGVybWluZXNcbiAqIHdoZXRoZXIgaTE4biBibG9ja3MgYXJlIHNlcmlhbGl6ZWQgb3IgaHlkcmF0ZWQuXG4gKi9cbmxldCBpc0kxOG5IeWRyYXRpb25SdW50aW1lU3VwcG9ydEVuYWJsZWQgPSBmYWxzZTtcblxuLyoqXG4gKiBEZWZpbmVzIGEgcGVyaW9kIG9mIHRpbWUgdGhhdCBBbmd1bGFyIHdhaXRzIGZvciB0aGUgYEFwcGxpY2F0aW9uUmVmLmlzU3RhYmxlYCB0byBlbWl0IGB0cnVlYC5cbiAqIElmIHRoZXJlIHdhcyBubyBldmVudCB3aXRoIHRoZSBgdHJ1ZWAgdmFsdWUgZHVyaW5nIHRoaXMgdGltZSwgQW5ndWxhciByZXBvcnRzIGEgd2FybmluZy5cbiAqL1xuY29uc3QgQVBQTElDQVRJT05fSVNfU1RBQkxFX1RJTUVPVVQgPSAxMF8wMDA7XG5cbi8qKlxuICogQnJpbmdzIHRoZSBuZWNlc3NhcnkgaHlkcmF0aW9uIGNvZGUgaW4gdHJlZS1zaGFrYWJsZSBtYW5uZXIuXG4gKiBUaGUgY29kZSBpcyBvbmx5IHByZXNlbnQgd2hlbiB0aGUgYHByb3ZpZGVDbGllbnRIeWRyYXRpb25gIGlzXG4gKiBpbnZva2VkLiBPdGhlcndpc2UsIHRoaXMgY29kZSBpcyB0cmVlLXNoYWtlbiBhd2F5IGR1cmluZyB0aGVcbiAqIGJ1aWxkIG9wdGltaXphdGlvbiBzdGVwLlxuICpcbiAqIFRoaXMgdGVjaG5pcXVlIGFsbG93cyB1cyB0byBzd2FwIGltcGxlbWVudGF0aW9ucyBvZiBtZXRob2RzIHNvXG4gKiB0cmVlIHNoYWtpbmcgd29ya3MgYXBwcm9wcmlhdGVseSB3aGVuIGh5ZHJhdGlvbiBpcyBkaXNhYmxlZCBvclxuICogZW5hYmxlZC4gSXQgYnJpbmdzIGluIHRoZSBhcHByb3ByaWF0ZSB2ZXJzaW9uIG9mIHRoZSBtZXRob2QgdGhhdFxuICogc3VwcG9ydHMgaHlkcmF0aW9uIG9ubHkgd2hlbiBlbmFibGVkLlxuICovXG5mdW5jdGlvbiBlbmFibGVIeWRyYXRpb25SdW50aW1lU3VwcG9ydCgpIHtcbiAgaWYgKCFpc0h5ZHJhdGlvblN1cHBvcnRFbmFibGVkKSB7XG4gICAgaXNIeWRyYXRpb25TdXBwb3J0RW5hYmxlZCA9IHRydWU7XG4gICAgZW5hYmxlUmV0cmlldmVIeWRyYXRpb25JbmZvSW1wbCgpO1xuICAgIGVuYWJsZUxvY2F0ZU9yQ3JlYXRlRWxlbWVudE5vZGVJbXBsKCk7XG4gICAgZW5hYmxlTG9jYXRlT3JDcmVhdGVUZXh0Tm9kZUltcGwoKTtcbiAgICBlbmFibGVMb2NhdGVPckNyZWF0ZUVsZW1lbnRDb250YWluZXJOb2RlSW1wbCgpO1xuICAgIGVuYWJsZUxvY2F0ZU9yQ3JlYXRlQ29udGFpbmVyQW5jaG9ySW1wbCgpO1xuICAgIGVuYWJsZUxvY2F0ZU9yQ3JlYXRlQ29udGFpbmVyUmVmSW1wbCgpO1xuICAgIGVuYWJsZUZpbmRNYXRjaGluZ0RlaHlkcmF0ZWRWaWV3SW1wbCgpO1xuICAgIGVuYWJsZUFwcGx5Um9vdEVsZW1lbnRUcmFuc2Zvcm1JbXBsKCk7XG4gIH1cbn1cblxuLyoqXG4gKiBCcmluZ3MgdGhlIG5lY2Vzc2FyeSBpMThuIGh5ZHJhdGlvbiBjb2RlIGluIHRyZWUtc2hha2FibGUgbWFubmVyLlxuICogU2ltaWxhciB0byBgZW5hYmxlSHlkcmF0aW9uUnVudGltZVN1cHBvcnRgLCB0aGUgY29kZSBpcyBvbmx5XG4gKiBwcmVzZW50IHdoZW4gYHdpdGhJMThuU3VwcG9ydGAgaXMgaW52b2tlZC5cbiAqL1xuZnVuY3Rpb24gZW5hYmxlSTE4bkh5ZHJhdGlvblJ1bnRpbWVTdXBwb3J0KCkge1xuICBpZiAoIWlzSTE4bkh5ZHJhdGlvblJ1bnRpbWVTdXBwb3J0RW5hYmxlZCkge1xuICAgIGlzSTE4bkh5ZHJhdGlvblJ1bnRpbWVTdXBwb3J0RW5hYmxlZCA9IHRydWU7XG4gICAgZW5hYmxlTG9jYXRlT3JDcmVhdGVJMThuTm9kZUltcGwoKTtcbiAgICBlbmFibGVQcmVwYXJlSTE4bkJsb2NrRm9ySHlkcmF0aW9uSW1wbCgpO1xuICAgIGVuYWJsZUNsYWltRGVoeWRyYXRlZEljdUNhc2VJbXBsKCk7XG4gIH1cbn1cblxuLyoqXG4gKiBPdXRwdXRzIGEgbWVzc2FnZSB3aXRoIGh5ZHJhdGlvbiBzdGF0cyBpbnRvIGEgY29uc29sZS5cbiAqL1xuZnVuY3Rpb24gcHJpbnRIeWRyYXRpb25TdGF0cyhpbmplY3RvcjogSW5qZWN0b3IpIHtcbiAgY29uc3QgY29uc29sZSA9IGluamVjdG9yLmdldChDb25zb2xlKTtcbiAgY29uc3QgbWVzc2FnZSA9IGBBbmd1bGFyIGh5ZHJhdGVkICR7bmdEZXZNb2RlIS5oeWRyYXRlZENvbXBvbmVudHN9IGNvbXBvbmVudChzKSBgICtcbiAgICAgIGBhbmQgJHtuZ0Rldk1vZGUhLmh5ZHJhdGVkTm9kZXN9IG5vZGUocyksIGAgK1xuICAgICAgYCR7bmdEZXZNb2RlIS5jb21wb25lbnRzU2tpcHBlZEh5ZHJhdGlvbn0gY29tcG9uZW50KHMpIHdlcmUgc2tpcHBlZC4gYCArXG4gICAgICBgTGVhcm4gbW9yZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vZ3VpZGUvaHlkcmF0aW9uLmA7XG4gIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTpuby1jb25zb2xlXG4gIGNvbnNvbGUubG9nKG1lc3NhZ2UpO1xufVxuXG5cbi8qKlxuICogUmV0dXJucyBhIFByb21pc2UgdGhhdCBpcyByZXNvbHZlZCB3aGVuIGFuIGFwcGxpY2F0aW9uIGJlY29tZXMgc3RhYmxlLlxuICovXG5mdW5jdGlvbiB3aGVuU3RhYmxlV2l0aFRpbWVvdXQoYXBwUmVmOiBBcHBsaWNhdGlvblJlZiwgaW5qZWN0b3I6IEluamVjdG9yKTogUHJvbWlzZTx2b2lkPiB7XG4gIGNvbnN0IHdoZW5TdGFibGVQcm9taXNlID0gd2hlblN0YWJsZShhcHBSZWYpO1xuICBpZiAodHlwZW9mIG5nRGV2TW9kZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbmdEZXZNb2RlKSB7XG4gICAgY29uc3QgdGltZW91dFRpbWUgPSBBUFBMSUNBVElPTl9JU19TVEFCTEVfVElNRU9VVDtcbiAgICBjb25zdCBjb25zb2xlID0gaW5qZWN0b3IuZ2V0KENvbnNvbGUpO1xuICAgIGNvbnN0IG5nWm9uZSA9IGluamVjdG9yLmdldChOZ1pvbmUpO1xuXG4gICAgLy8gVGhlIGZvbGxvd2luZyBjYWxsIHNob3VsZCBub3QgYW5kIGRvZXMgbm90IHByZXZlbnQgdGhlIGFwcCB0byBiZWNvbWUgc3RhYmxlXG4gICAgLy8gV2UgY2Fubm90IHVzZSBSeEpTIHRpbWVyIGhlcmUgYmVjYXVzZSB0aGUgYXBwIHdvdWxkIHJlbWFpbiB1bnN0YWJsZS5cbiAgICAvLyBUaGlzIGFsc28gYXZvaWRzIGFuIGV4dHJhIGNoYW5nZSBkZXRlY3Rpb24gY3ljbGUuXG4gICAgY29uc3QgdGltZW91dElkID0gbmdab25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+IHtcbiAgICAgIHJldHVybiBzZXRUaW1lb3V0KCgpID0+IGxvZ1dhcm5pbmdPblN0YWJsZVRpbWVkb3V0KHRpbWVvdXRUaW1lLCBjb25zb2xlKSwgdGltZW91dFRpbWUpO1xuICAgIH0pO1xuXG4gICAgd2hlblN0YWJsZVByb21pc2UuZmluYWxseSgoKSA9PiBjbGVhclRpbWVvdXQodGltZW91dElkKSk7XG4gIH1cblxuICByZXR1cm4gd2hlblN0YWJsZVByb21pc2U7XG59XG5cbi8qKlxuICogUmV0dXJucyBhIHNldCBvZiBwcm92aWRlcnMgcmVxdWlyZWQgdG8gc2V0dXAgaHlkcmF0aW9uIHN1cHBvcnRcbiAqIGZvciBhbiBhcHBsaWNhdGlvbiB0aGF0IGlzIHNlcnZlciBzaWRlIHJlbmRlcmVkLiBUaGlzIGZ1bmN0aW9uIGlzXG4gKiBpbmNsdWRlZCBpbnRvIHRoZSBgcHJvdmlkZUNsaWVudEh5ZHJhdGlvbmAgcHVibGljIEFQSSBmdW5jdGlvbiBmcm9tXG4gKiB0aGUgYHBsYXRmb3JtLWJyb3dzZXJgIHBhY2thZ2UuXG4gKlxuICogVGhlIGZ1bmN0aW9uIHNldHMgdXAgYW4gaW50ZXJuYWwgZmxhZyB0aGF0IHdvdWxkIGJlIHJlY29nbml6ZWQgZHVyaW5nXG4gKiB0aGUgc2VydmVyIHNpZGUgcmVuZGVyaW5nIHRpbWUgYXMgd2VsbCwgc28gdGhlcmUgaXMgbm8gbmVlZCB0b1xuICogY29uZmlndXJlIG9yIGNoYW5nZSBhbnl0aGluZyBpbiBOZ1VuaXZlcnNhbCB0byBlbmFibGUgdGhlIGZlYXR1cmUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB3aXRoRG9tSHlkcmF0aW9uKCk6IEVudmlyb25tZW50UHJvdmlkZXJzIHtcbiAgcmV0dXJuIG1ha2VFbnZpcm9ubWVudFByb3ZpZGVycyhbXG4gICAge1xuICAgICAgcHJvdmlkZTogSVNfSFlEUkFUSU9OX0RPTV9SRVVTRV9FTkFCTEVELFxuICAgICAgdXNlRmFjdG9yeTogKCkgPT4ge1xuICAgICAgICBsZXQgaXNFbmFibGVkID0gdHJ1ZTtcbiAgICAgICAgaWYgKGlzUGxhdGZvcm1Ccm93c2VyKCkpIHtcbiAgICAgICAgICAvLyBPbiB0aGUgY2xpZW50LCB2ZXJpZnkgdGhhdCB0aGUgc2VydmVyIHJlc3BvbnNlIGNvbnRhaW5zXG4gICAgICAgICAgLy8gaHlkcmF0aW9uIGFubm90YXRpb25zLiBPdGhlcndpc2UsIGtlZXAgaHlkcmF0aW9uIGRpc2FibGVkLlxuICAgICAgICAgIGNvbnN0IHRyYW5zZmVyU3RhdGUgPSBpbmplY3QoVHJhbnNmZXJTdGF0ZSwge29wdGlvbmFsOiB0cnVlfSk7XG4gICAgICAgICAgaXNFbmFibGVkID0gISF0cmFuc2ZlclN0YXRlPy5nZXQoTkdIX0RBVEFfS0VZLCBudWxsKTtcbiAgICAgICAgICBpZiAoIWlzRW5hYmxlZCAmJiAodHlwZW9mIG5nRGV2TW9kZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbmdEZXZNb2RlKSkge1xuICAgICAgICAgICAgY29uc3QgY29uc29sZSA9IGluamVjdChDb25zb2xlKTtcbiAgICAgICAgICAgIGNvbnN0IG1lc3NhZ2UgPSBmb3JtYXRSdW50aW1lRXJyb3IoXG4gICAgICAgICAgICAgICAgUnVudGltZUVycm9yQ29kZS5NSVNTSU5HX0hZRFJBVElPTl9BTk5PVEFUSU9OUyxcbiAgICAgICAgICAgICAgICAnQW5ndWxhciBoeWRyYXRpb24gd2FzIHJlcXVlc3RlZCBvbiB0aGUgY2xpZW50LCBidXQgdGhlcmUgd2FzIG5vICcgK1xuICAgICAgICAgICAgICAgICAgICAnc2VyaWFsaXplZCBpbmZvcm1hdGlvbiBwcmVzZW50IGluIHRoZSBzZXJ2ZXIgcmVzcG9uc2UsICcgK1xuICAgICAgICAgICAgICAgICAgICAndGh1cyBoeWRyYXRpb24gd2FzIG5vdCBlbmFibGVkLiAnICtcbiAgICAgICAgICAgICAgICAgICAgJ01ha2Ugc3VyZSB0aGUgYHByb3ZpZGVDbGllbnRIeWRyYXRpb24oKWAgaXMgaW5jbHVkZWQgaW50byB0aGUgbGlzdCAnICtcbiAgICAgICAgICAgICAgICAgICAgJ29mIHByb3ZpZGVycyBpbiB0aGUgc2VydmVyIHBhcnQgb2YgdGhlIGFwcGxpY2F0aW9uIGNvbmZpZ3VyYXRpb24uJyk7XG4gICAgICAgICAgICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6bm8tY29uc29sZVxuICAgICAgICAgICAgY29uc29sZS53YXJuKG1lc3NhZ2UpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoaXNFbmFibGVkKSB7XG4gICAgICAgICAgcGVyZm9ybWFuY2VNYXJrRmVhdHVyZSgnTmdIeWRyYXRpb24nKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gaXNFbmFibGVkO1xuICAgICAgfSxcbiAgICB9LFxuICAgIHtcbiAgICAgIHByb3ZpZGU6IEVOVklST05NRU5UX0lOSVRJQUxJWkVSLFxuICAgICAgdXNlVmFsdWU6ICgpID0+IHtcbiAgICAgICAgLy8gaTE4biBzdXBwb3J0IGlzIGVuYWJsZWQgYnkgY2FsbGluZyB3aXRoSTE4blN1cHBvcnQoKSwgYnV0IHRoZXJlJ3NcbiAgICAgICAgLy8gbm8gd2F5IHRvIHR1cm4gaXQgb2ZmIChlLmcuIGZvciB0ZXN0cyksIHNvIHdlIHR1cm4gaXQgb2ZmIGJ5IGRlZmF1bHQuXG4gICAgICAgIHNldElzSTE4bkh5ZHJhdGlvblN1cHBvcnRFbmFibGVkKGZhbHNlKTtcblxuICAgICAgICAvLyBTaW5jZSB0aGlzIGZ1bmN0aW9uIGlzIHVzZWQgYWNyb3NzIGJvdGggc2VydmVyIGFuZCBjbGllbnQsXG4gICAgICAgIC8vIG1ha2Ugc3VyZSB0aGF0IHRoZSBydW50aW1lIGNvZGUgaXMgb25seSBhZGRlZCB3aGVuIGludm9rZWRcbiAgICAgICAgLy8gb24gdGhlIGNsaWVudC4gTW92aW5nIGZvcndhcmQsIHRoZSBgaXNQbGF0Zm9ybUJyb3dzZXJgIGNoZWNrIHNob3VsZFxuICAgICAgICAvLyBiZSByZXBsYWNlZCB3aXRoIGEgdHJlZS1zaGFrYWJsZSBhbHRlcm5hdGl2ZSAoZS5nLiBgaXNTZXJ2ZXJgXG4gICAgICAgIC8vIGZsYWcpLlxuICAgICAgICBpZiAoaXNQbGF0Zm9ybUJyb3dzZXIoKSAmJiBpbmplY3QoSVNfSFlEUkFUSU9OX0RPTV9SRVVTRV9FTkFCTEVEKSkge1xuICAgICAgICAgIHZlcmlmeVNzckNvbnRlbnRzSW50ZWdyaXR5KCk7XG4gICAgICAgICAgZW5hYmxlSHlkcmF0aW9uUnVudGltZVN1cHBvcnQoKTtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIG11bHRpOiB0cnVlLFxuICAgIH0sXG4gICAge1xuICAgICAgcHJvdmlkZTogUFJFU0VSVkVfSE9TVF9DT05URU5ULFxuICAgICAgdXNlRmFjdG9yeTogKCkgPT4ge1xuICAgICAgICAvLyBQcmVzZXJ2ZSBob3N0IGVsZW1lbnQgY29udGVudCBvbmx5IGluIGEgYnJvd3NlclxuICAgICAgICAvLyBlbnZpcm9ubWVudCBhbmQgd2hlbiBoeWRyYXRpb24gaXMgY29uZmlndXJlZCBwcm9wZXJseS5cbiAgICAgICAgLy8gT24gYSBzZXJ2ZXIsIGFuIGFwcGxpY2F0aW9uIGlzIHJlbmRlcmVkIGZyb20gc2NyYXRjaCxcbiAgICAgICAgLy8gc28gdGhlIGhvc3QgY29udGVudCBuZWVkcyB0byBiZSBlbXB0eS5cbiAgICAgICAgcmV0dXJuIGlzUGxhdGZvcm1Ccm93c2VyKCkgJiYgaW5qZWN0KElTX0hZRFJBVElPTl9ET01fUkVVU0VfRU5BQkxFRCk7XG4gICAgICB9XG4gICAgfSxcbiAgICB7XG4gICAgICBwcm92aWRlOiBBUFBfQk9PVFNUUkFQX0xJU1RFTkVSLFxuICAgICAgdXNlRmFjdG9yeTogKCkgPT4ge1xuICAgICAgICBpZiAoaXNQbGF0Zm9ybUJyb3dzZXIoKSAmJiBpbmplY3QoSVNfSFlEUkFUSU9OX0RPTV9SRVVTRV9FTkFCTEVEKSkge1xuICAgICAgICAgIGNvbnN0IGFwcFJlZiA9IGluamVjdChBcHBsaWNhdGlvblJlZik7XG4gICAgICAgICAgY29uc3QgaW5qZWN0b3IgPSBpbmplY3QoSW5qZWN0b3IpO1xuICAgICAgICAgIHJldHVybiAoKSA9PiB7XG4gICAgICAgICAgICAvLyBXYWl0IHVudGlsIGFuIGFwcCBiZWNvbWVzIHN0YWJsZSBhbmQgY2xlYW51cCBhbGwgdmlld3MgdGhhdFxuICAgICAgICAgICAgLy8gd2VyZSBub3QgY2xhaW1lZCBkdXJpbmcgdGhlIGFwcGxpY2F0aW9uIGJvb3RzdHJhcCBwcm9jZXNzLlxuICAgICAgICAgICAgLy8gVGhlIHRpbWluZyBpcyBzaW1pbGFyIHRvIHdoZW4gd2Ugc3RhcnQgdGhlIHNlcmlhbGl6YXRpb24gcHJvY2Vzc1xuICAgICAgICAgICAgLy8gb24gdGhlIHNlcnZlci5cbiAgICAgICAgICAgIC8vXG4gICAgICAgICAgICAvLyBOb3RlOiB0aGUgY2xlYW51cCB0YXNrICpNVVNUKiBiZSBzY2hlZHVsZWQgd2l0aGluIHRoZSBBbmd1bGFyIHpvbmVcbiAgICAgICAgICAgIC8vIHRvIGVuc3VyZSB0aGF0IGNoYW5nZSBkZXRlY3Rpb24gaXMgcHJvcGVybHkgcnVuIGFmdGVyd2FyZC5cbiAgICAgICAgICAgIHdoZW5TdGFibGVXaXRoVGltZW91dChhcHBSZWYsIGluamVjdG9yKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgTmdab25lLmFzc2VydEluQW5ndWxhclpvbmUoKTtcbiAgICAgICAgICAgICAgY2xlYW51cERlaHlkcmF0ZWRWaWV3cyhhcHBSZWYpO1xuXG4gICAgICAgICAgICAgIGlmICh0eXBlb2YgbmdEZXZNb2RlICE9PSAndW5kZWZpbmVkJyAmJiBuZ0Rldk1vZGUpIHtcbiAgICAgICAgICAgICAgICBwcmludEh5ZHJhdGlvblN0YXRzKGluamVjdG9yKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gKCkgPT4ge307ICAvLyBub29wXG4gICAgICB9LFxuICAgICAgbXVsdGk6IHRydWUsXG4gICAgfVxuICBdKTtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIGEgc2V0IG9mIHByb3ZpZGVycyByZXF1aXJlZCB0byBzZXR1cCBzdXBwb3J0IGZvciBpMThuIGh5ZHJhdGlvbi5cbiAqIFJlcXVpcmVzIGh5ZHJhdGlvbiB0byBiZSBlbmFibGVkIHNlcGFyYXRlbHkuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB3aXRoSTE4blN1cHBvcnQoKTogUHJvdmlkZXJbXSB7XG4gIHJldHVybiBbXG4gICAge1xuICAgICAgcHJvdmlkZTogSVNfSTE4Tl9IWURSQVRJT05fRU5BQkxFRCxcbiAgICAgIHVzZVZhbHVlOiB0cnVlLFxuICAgIH0sXG4gICAge1xuICAgICAgcHJvdmlkZTogRU5WSVJPTk1FTlRfSU5JVElBTElaRVIsXG4gICAgICB1c2VWYWx1ZTogKCkgPT4ge1xuICAgICAgICBlbmFibGVJMThuSHlkcmF0aW9uUnVudGltZVN1cHBvcnQoKTtcbiAgICAgICAgc2V0SXNJMThuSHlkcmF0aW9uU3VwcG9ydEVuYWJsZWQodHJ1ZSk7XG4gICAgICAgIHBlcmZvcm1hbmNlTWFya0ZlYXR1cmUoJ05nSTE4bkh5ZHJhdGlvbicpO1xuICAgICAgfSxcbiAgICAgIG11bHRpOiB0cnVlLFxuICAgIH0sXG4gIF07XG59XG5cbi8qKlxuICpcbiAqIEBwYXJhbSB0aW1lIFRoZSB0aW1lIGluIG1zIHVudGlsIHRoZSBzdGFibGUgdGltZWRvdXQgd2FybmluZyBtZXNzYWdlIGlzIGxvZ2dlZFxuICovXG5mdW5jdGlvbiBsb2dXYXJuaW5nT25TdGFibGVUaW1lZG91dCh0aW1lOiBudW1iZXIsIGNvbnNvbGU6IENvbnNvbGUpOiB2b2lkIHtcbiAgY29uc3QgbWVzc2FnZSA9XG4gICAgICBgQW5ndWxhciBoeWRyYXRpb24gZXhwZWN0ZWQgdGhlIEFwcGxpY2F0aW9uUmVmLmlzU3RhYmxlKCkgdG8gZW1pdCBcXGB0cnVlXFxgLCBidXQgaXQgYCArXG4gICAgICBgZGlkbid0IGhhcHBlbiB3aXRoaW4gJHtcbiAgICAgICAgICB0aW1lfW1zLiBBbmd1bGFyIGh5ZHJhdGlvbiBsb2dpYyBkZXBlbmRzIG9uIHRoZSBhcHBsaWNhdGlvbiBiZWNvbWluZyBzdGFibGUgYCArXG4gICAgICBgYXMgYSBzaWduYWwgdG8gY29tcGxldGUgaHlkcmF0aW9uIHByb2Nlc3MuYDtcblxuICBjb25zb2xlLndhcm4oZm9ybWF0UnVudGltZUVycm9yKFJ1bnRpbWVFcnJvckNvZGUuSFlEUkFUSU9OX1NUQUJMRV9USU1FRE9VVCwgbWVzc2FnZSkpO1xufVxuXG4vKipcbiAqIFZlcmlmaWVzIHdoZXRoZXIgdGhlIERPTSBjb250YWlucyBhIHNwZWNpYWwgbWFya2VyIGFkZGVkIGR1cmluZyBTU1IgdGltZSB0byBtYWtlIHN1cmVcbiAqIHRoZXJlIGlzIG5vIFNTUidlZCBjb250ZW50cyB0cmFuc2Zvcm1hdGlvbnMgaGFwcGVuIGFmdGVyIFNTUiBpcyBjb21wbGV0ZWQuIFR5cGljYWxseSB0aGF0XG4gKiBoYXBwZW5zIGVpdGhlciBieSBDRE4gb3IgZHVyaW5nIHRoZSBidWlsZCBwcm9jZXNzIGFzIGFuIG9wdGltaXphdGlvbiB0byByZW1vdmUgY29tbWVudCBub2Rlcy5cbiAqIEh5ZHJhdGlvbiBwcm9jZXNzIHJlcXVpcmVzIGNvbW1lbnQgbm9kZXMgcHJvZHVjZWQgYnkgQW5ndWxhciB0byBsb2NhdGUgY29ycmVjdCBET00gc2VnbWVudHMuXG4gKiBXaGVuIHRoaXMgc3BlY2lhbCBtYXJrZXIgaXMgKm5vdCogcHJlc2VudCAtIHRocm93IGFuIGVycm9yIGFuZCBkbyBub3QgcHJvY2VlZCB3aXRoIGh5ZHJhdGlvbixcbiAqIHNpbmNlIGl0IHdpbGwgbm90IGJlIGFibGUgdG8gZnVuY3Rpb24gY29ycmVjdGx5LlxuICpcbiAqIE5vdGU6IHRoaXMgZnVuY3Rpb24gaXMgaW52b2tlZCBvbmx5IG9uIHRoZSBjbGllbnQsIHNvIGl0J3Mgc2FmZSB0byB1c2UgRE9NIEFQSXMuXG4gKi9cbmZ1bmN0aW9uIHZlcmlmeVNzckNvbnRlbnRzSW50ZWdyaXR5KCk6IHZvaWQge1xuICBjb25zdCBkb2MgPSBnZXREb2N1bWVudCgpO1xuICBsZXQgaHlkcmF0aW9uTWFya2VyOiBOb2RlfHVuZGVmaW5lZDtcbiAgZm9yIChjb25zdCBub2RlIG9mIGRvYy5ib2R5LmNoaWxkTm9kZXMpIHtcbiAgICBpZiAobm9kZS5ub2RlVHlwZSA9PT0gTm9kZS5DT01NRU5UX05PREUgJiZcbiAgICAgICAgbm9kZS50ZXh0Q29udGVudD8udHJpbSgpID09PSBTU1JfQ09OVEVOVF9JTlRFR1JJVFlfTUFSS0VSKSB7XG4gICAgICBoeWRyYXRpb25NYXJrZXIgPSBub2RlO1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG4gIGlmICghaHlkcmF0aW9uTWFya2VyKSB7XG4gICAgdGhyb3cgbmV3IFJ1bnRpbWVFcnJvcihcbiAgICAgICAgUnVudGltZUVycm9yQ29kZS5NSVNTSU5HX1NTUl9DT05URU5UX0lOVEVHUklUWV9NQVJLRVIsXG4gICAgICAgIHR5cGVvZiBuZ0Rldk1vZGUgIT09ICd1bmRlZmluZWQnICYmIG5nRGV2TW9kZSAmJlxuICAgICAgICAgICAgJ0FuZ3VsYXIgaHlkcmF0aW9uIGxvZ2ljIGRldGVjdGVkIHRoYXQgSFRNTCBjb250ZW50IG9mIHRoaXMgcGFnZSB3YXMgbW9kaWZpZWQgYWZ0ZXIgaXQgJyArXG4gICAgICAgICAgICAgICAgJ3dhcyBwcm9kdWNlZCBkdXJpbmcgc2VydmVyIHNpZGUgcmVuZGVyaW5nLiBNYWtlIHN1cmUgdGhhdCB0aGVyZSBhcmUgbm8gb3B0aW1pemF0aW9ucyAnICtcbiAgICAgICAgICAgICAgICAndGhhdCByZW1vdmUgY29tbWVudCBub2RlcyBmcm9tIEhUTUwgZW5hYmxlZCBvbiB5b3VyIENETi4gQW5ndWxhciBoeWRyYXRpb24gJyArXG4gICAgICAgICAgICAgICAgJ3JlbGllcyBvbiBIVE1MIHByb2R1Y2VkIGJ5IHRoZSBzZXJ2ZXIsIGluY2x1ZGluZyB3aGl0ZXNwYWNlcyBhbmQgY29tbWVudCBub2Rlcy4nKTtcbiAgfVxufVxuIl19