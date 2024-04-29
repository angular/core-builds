/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { APP_BOOTSTRAP_LISTENER, ApplicationRef, whenStable } from '../application/application_ref';
import { Console } from '../console';
import { ENVIRONMENT_INITIALIZER, Injector, makeEnvironmentProviders, } from '../di';
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
import { enableClaimDehydratedIcuCaseImpl, enablePrepareI18nBlockForHydrationImpl, setIsI18nHydrationSupportEnabled, } from './i18n';
import { IS_HYDRATION_DOM_REUSE_ENABLED, IS_I18N_HYDRATION_ENABLED, PRESERVE_HOST_CONTENT, } from './tokens';
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
                    if (!isEnabled && typeof ngDevMode !== 'undefined' && ngDevMode) {
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
            },
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
        },
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
        throw new RuntimeError(-507 /* RuntimeErrorCode.MISSING_SSR_CONTENT_INTEGRITY_MARKER */, typeof ngDevMode !== 'undefined' &&
            ngDevMode &&
            'Angular hydration logic detected that HTML content of this page was modified after it ' +
                'was produced during server side rendering. Make sure that there are no optimizations ' +
                'that remove comment nodes from HTML enabled on your CDN. Angular hydration ' +
                'relies on HTML produced by the server, including whitespaces and comment nodes.');
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBpLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvaHlkcmF0aW9uL2FwaS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsc0JBQXNCLEVBQUUsY0FBYyxFQUFFLFVBQVUsRUFBQyxNQUFNLGdDQUFnQyxDQUFDO0FBQ2xHLE9BQU8sRUFBQyxPQUFPLEVBQUMsTUFBTSxZQUFZLENBQUM7QUFDbkMsT0FBTyxFQUNMLHVCQUF1QixFQUV2QixRQUFRLEVBQ1Isd0JBQXdCLEdBRXpCLE1BQU0sT0FBTyxDQUFDO0FBQ2YsT0FBTyxFQUFDLE1BQU0sRUFBQyxNQUFNLDhCQUE4QixDQUFDO0FBQ3BELE9BQU8sRUFBQyxrQkFBa0IsRUFBRSxZQUFZLEVBQW1CLE1BQU0sV0FBVyxDQUFDO0FBQzdFLE9BQU8sRUFBQyxvQ0FBb0MsRUFBQyxNQUFNLDhCQUE4QixDQUFDO0FBQ2xGLE9BQU8sRUFBQyxnQ0FBZ0MsRUFBQyxNQUFNLDRCQUE0QixDQUFDO0FBQzVFLE9BQU8sRUFBQyxtQ0FBbUMsRUFBQyxNQUFNLGlDQUFpQyxDQUFDO0FBQ3BGLE9BQU8sRUFBQyw0Q0FBNEMsRUFBQyxNQUFNLDJDQUEyQyxDQUFDO0FBQ3ZHLE9BQU8sRUFBQyxtQ0FBbUMsRUFBQyxNQUFNLGdDQUFnQyxDQUFDO0FBQ25GLE9BQU8sRUFBQyx1Q0FBdUMsRUFBQyxNQUFNLGtDQUFrQyxDQUFDO0FBQ3pGLE9BQU8sRUFBQyxnQ0FBZ0MsRUFBQyxNQUFNLDhCQUE4QixDQUFDO0FBQzlFLE9BQU8sRUFBQyxXQUFXLEVBQUMsTUFBTSxnQ0FBZ0MsQ0FBQztBQUMzRCxPQUFPLEVBQUMsaUJBQWlCLEVBQUMsTUFBTSw0QkFBNEIsQ0FBQztBQUM3RCxPQUFPLEVBQUMsYUFBYSxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDaEQsT0FBTyxFQUFDLHNCQUFzQixFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDM0QsT0FBTyxFQUFDLE1BQU0sRUFBQyxNQUFNLFNBQVMsQ0FBQztBQUUvQixPQUFPLEVBQUMsc0JBQXNCLEVBQUMsTUFBTSxXQUFXLENBQUM7QUFDakQsT0FBTyxFQUNMLGdDQUFnQyxFQUNoQyxzQ0FBc0MsRUFFdEMsZ0NBQWdDLEdBQ2pDLE1BQU0sUUFBUSxDQUFDO0FBQ2hCLE9BQU8sRUFDTCw4QkFBOEIsRUFDOUIseUJBQXlCLEVBQ3pCLHFCQUFxQixHQUN0QixNQUFNLFVBQVUsQ0FBQztBQUNsQixPQUFPLEVBQUMsK0JBQStCLEVBQUUsWUFBWSxFQUFFLDRCQUE0QixFQUFDLE1BQU0sU0FBUyxDQUFDO0FBQ3BHLE9BQU8sRUFBQyxvQ0FBb0MsRUFBQyxNQUFNLFNBQVMsQ0FBQztBQUU3RDs7O0dBR0c7QUFDSCxJQUFJLHlCQUF5QixHQUFHLEtBQUssQ0FBQztBQUV0Qzs7Ozs7OztHQU9HO0FBQ0gsSUFBSSxvQ0FBb0MsR0FBRyxLQUFLLENBQUM7QUFFakQ7OztHQUdHO0FBQ0gsTUFBTSw2QkFBNkIsR0FBRyxNQUFNLENBQUM7QUFFN0M7Ozs7Ozs7Ozs7R0FVRztBQUNILFNBQVMsNkJBQTZCO0lBQ3BDLElBQUksQ0FBQyx5QkFBeUIsRUFBRSxDQUFDO1FBQy9CLHlCQUF5QixHQUFHLElBQUksQ0FBQztRQUNqQywrQkFBK0IsRUFBRSxDQUFDO1FBQ2xDLG1DQUFtQyxFQUFFLENBQUM7UUFDdEMsZ0NBQWdDLEVBQUUsQ0FBQztRQUNuQyw0Q0FBNEMsRUFBRSxDQUFDO1FBQy9DLHVDQUF1QyxFQUFFLENBQUM7UUFDMUMsb0NBQW9DLEVBQUUsQ0FBQztRQUN2QyxvQ0FBb0MsRUFBRSxDQUFDO1FBQ3ZDLG1DQUFtQyxFQUFFLENBQUM7SUFDeEMsQ0FBQztBQUNILENBQUM7QUFFRDs7OztHQUlHO0FBQ0gsU0FBUyxpQ0FBaUM7SUFDeEMsSUFBSSxDQUFDLG9DQUFvQyxFQUFFLENBQUM7UUFDMUMsb0NBQW9DLEdBQUcsSUFBSSxDQUFDO1FBQzVDLGdDQUFnQyxFQUFFLENBQUM7UUFDbkMsc0NBQXNDLEVBQUUsQ0FBQztRQUN6QyxnQ0FBZ0MsRUFBRSxDQUFDO0lBQ3JDLENBQUM7QUFDSCxDQUFDO0FBRUQ7O0dBRUc7QUFDSCxTQUFTLG1CQUFtQixDQUFDLFFBQWtCO0lBQzdDLE1BQU0sT0FBTyxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDdEMsTUFBTSxPQUFPLEdBQ1gsb0JBQW9CLFNBQVUsQ0FBQyxrQkFBa0IsZ0JBQWdCO1FBQ2pFLE9BQU8sU0FBVSxDQUFDLGFBQWEsWUFBWTtRQUMzQyxHQUFHLFNBQVUsQ0FBQywwQkFBMEIsOEJBQThCO1FBQ3RFLG1EQUFtRCxDQUFDO0lBQ3RELHNDQUFzQztJQUN0QyxPQUFPLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBQ3ZCLENBQUM7QUFFRDs7R0FFRztBQUNILFNBQVMscUJBQXFCLENBQUMsTUFBc0IsRUFBRSxRQUFrQjtJQUN2RSxNQUFNLGlCQUFpQixHQUFHLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUM3QyxJQUFJLE9BQU8sU0FBUyxLQUFLLFdBQVcsSUFBSSxTQUFTLEVBQUUsQ0FBQztRQUNsRCxNQUFNLFdBQVcsR0FBRyw2QkFBNkIsQ0FBQztRQUNsRCxNQUFNLE9BQU8sR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ3RDLE1BQU0sTUFBTSxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUM7UUFFcEMsOEVBQThFO1FBQzlFLHVFQUF1RTtRQUN2RSxvREFBb0Q7UUFDcEQsTUFBTSxTQUFTLEdBQUcsTUFBTSxDQUFDLGlCQUFpQixDQUFDLEdBQUcsRUFBRTtZQUM5QyxPQUFPLFVBQVUsQ0FBQyxHQUFHLEVBQUUsQ0FBQywwQkFBMEIsQ0FBQyxXQUFXLEVBQUUsT0FBTyxDQUFDLEVBQUUsV0FBVyxDQUFDLENBQUM7UUFDekYsQ0FBQyxDQUFDLENBQUM7UUFFSCxpQkFBaUIsQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLENBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7SUFDM0QsQ0FBQztJQUVELE9BQU8saUJBQWlCLENBQUM7QUFDM0IsQ0FBQztBQUVEOzs7Ozs7Ozs7R0FTRztBQUNILE1BQU0sVUFBVSxnQkFBZ0I7SUFDOUIsT0FBTyx3QkFBd0IsQ0FBQztRQUM5QjtZQUNFLE9BQU8sRUFBRSw4QkFBOEI7WUFDdkMsVUFBVSxFQUFFLEdBQUcsRUFBRTtnQkFDZixJQUFJLFNBQVMsR0FBRyxJQUFJLENBQUM7Z0JBQ3JCLElBQUksaUJBQWlCLEVBQUUsRUFBRSxDQUFDO29CQUN4QiwwREFBMEQ7b0JBQzFELDZEQUE2RDtvQkFDN0QsTUFBTSxhQUFhLEdBQUcsTUFBTSxDQUFDLGFBQWEsRUFBRSxFQUFDLFFBQVEsRUFBRSxJQUFJLEVBQUMsQ0FBQyxDQUFDO29CQUM5RCxTQUFTLEdBQUcsQ0FBQyxDQUFDLGFBQWEsRUFBRSxHQUFHLENBQUMsWUFBWSxFQUFFLElBQUksQ0FBQyxDQUFDO29CQUNyRCxJQUFJLENBQUMsU0FBUyxJQUFJLE9BQU8sU0FBUyxLQUFLLFdBQVcsSUFBSSxTQUFTLEVBQUUsQ0FBQzt3QkFDaEUsTUFBTSxPQUFPLEdBQUcsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDO3dCQUNoQyxNQUFNLE9BQU8sR0FBRyxrQkFBa0IsNERBRWhDLGtFQUFrRTs0QkFDaEUseURBQXlEOzRCQUN6RCxrQ0FBa0M7NEJBQ2xDLHFFQUFxRTs0QkFDckUsbUVBQW1FLENBQ3RFLENBQUM7d0JBQ0Ysc0NBQXNDO3dCQUN0QyxPQUFPLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO29CQUN4QixDQUFDO2dCQUNILENBQUM7Z0JBQ0QsSUFBSSxTQUFTLEVBQUUsQ0FBQztvQkFDZCxzQkFBc0IsQ0FBQyxhQUFhLENBQUMsQ0FBQztnQkFDeEMsQ0FBQztnQkFDRCxPQUFPLFNBQVMsQ0FBQztZQUNuQixDQUFDO1NBQ0Y7UUFDRDtZQUNFLE9BQU8sRUFBRSx1QkFBdUI7WUFDaEMsUUFBUSxFQUFFLEdBQUcsRUFBRTtnQkFDYixvRUFBb0U7Z0JBQ3BFLHdFQUF3RTtnQkFDeEUsZ0NBQWdDLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBRXhDLDZEQUE2RDtnQkFDN0QsNkRBQTZEO2dCQUM3RCxzRUFBc0U7Z0JBQ3RFLGdFQUFnRTtnQkFDaEUsU0FBUztnQkFDVCxJQUFJLGlCQUFpQixFQUFFLElBQUksTUFBTSxDQUFDLDhCQUE4QixDQUFDLEVBQUUsQ0FBQztvQkFDbEUsMEJBQTBCLEVBQUUsQ0FBQztvQkFDN0IsNkJBQTZCLEVBQUUsQ0FBQztnQkFDbEMsQ0FBQztZQUNILENBQUM7WUFDRCxLQUFLLEVBQUUsSUFBSTtTQUNaO1FBQ0Q7WUFDRSxPQUFPLEVBQUUscUJBQXFCO1lBQzlCLFVBQVUsRUFBRSxHQUFHLEVBQUU7Z0JBQ2Ysa0RBQWtEO2dCQUNsRCx5REFBeUQ7Z0JBQ3pELHdEQUF3RDtnQkFDeEQseUNBQXlDO2dCQUN6QyxPQUFPLGlCQUFpQixFQUFFLElBQUksTUFBTSxDQUFDLDhCQUE4QixDQUFDLENBQUM7WUFDdkUsQ0FBQztTQUNGO1FBQ0Q7WUFDRSxPQUFPLEVBQUUsc0JBQXNCO1lBQy9CLFVBQVUsRUFBRSxHQUFHLEVBQUU7Z0JBQ2YsSUFBSSxpQkFBaUIsRUFBRSxJQUFJLE1BQU0sQ0FBQyw4QkFBOEIsQ0FBQyxFQUFFLENBQUM7b0JBQ2xFLE1BQU0sTUFBTSxHQUFHLE1BQU0sQ0FBQyxjQUFjLENBQUMsQ0FBQztvQkFDdEMsTUFBTSxRQUFRLEdBQUcsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO29CQUNsQyxPQUFPLEdBQUcsRUFBRTt3QkFDViw4REFBOEQ7d0JBQzlELDZEQUE2RDt3QkFDN0QsbUVBQW1FO3dCQUNuRSxpQkFBaUI7d0JBQ2pCLEVBQUU7d0JBQ0Ysa0ZBQWtGO3dCQUNsRiw2REFBNkQ7d0JBQzdELHFCQUFxQixDQUFDLE1BQU0sRUFBRSxRQUFRLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFOzRCQUNoRCxzQkFBc0IsQ0FBQyxNQUFNLENBQUMsQ0FBQzs0QkFDL0IsSUFBSSxPQUFPLFNBQVMsS0FBSyxXQUFXLElBQUksU0FBUyxFQUFFLENBQUM7Z0NBQ2xELG1CQUFtQixDQUFDLFFBQVEsQ0FBQyxDQUFDOzRCQUNoQyxDQUFDO3dCQUNILENBQUMsQ0FBQyxDQUFDO29CQUNMLENBQUMsQ0FBQztnQkFDSixDQUFDO2dCQUNELE9BQU8sR0FBRyxFQUFFLEdBQUUsQ0FBQyxDQUFDLENBQUMsT0FBTztZQUMxQixDQUFDO1lBQ0QsS0FBSyxFQUFFLElBQUk7U0FDWjtLQUNGLENBQUMsQ0FBQztBQUNMLENBQUM7QUFFRDs7O0dBR0c7QUFDSCxNQUFNLFVBQVUsZUFBZTtJQUM3QixPQUFPO1FBQ0w7WUFDRSxPQUFPLEVBQUUseUJBQXlCO1lBQ2xDLFFBQVEsRUFBRSxJQUFJO1NBQ2Y7UUFDRDtZQUNFLE9BQU8sRUFBRSx1QkFBdUI7WUFDaEMsUUFBUSxFQUFFLEdBQUcsRUFBRTtnQkFDYixpQ0FBaUMsRUFBRSxDQUFDO2dCQUNwQyxnQ0FBZ0MsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDdkMsc0JBQXNCLENBQUMsaUJBQWlCLENBQUMsQ0FBQztZQUM1QyxDQUFDO1lBQ0QsS0FBSyxFQUFFLElBQUk7U0FDWjtLQUNGLENBQUM7QUFDSixDQUFDO0FBRUQ7OztHQUdHO0FBQ0gsU0FBUywwQkFBMEIsQ0FBQyxJQUFZLEVBQUUsT0FBZ0I7SUFDaEUsTUFBTSxPQUFPLEdBQ1gsb0ZBQW9GO1FBQ3BGLHdCQUF3QixJQUFJLHlFQUF5RTtRQUNyRyw0Q0FBNEMsQ0FBQztJQUUvQyxPQUFPLENBQUMsSUFBSSxDQUFDLGtCQUFrQix3REFBNkMsT0FBTyxDQUFDLENBQUMsQ0FBQztBQUN4RixDQUFDO0FBRUQ7Ozs7Ozs7OztHQVNHO0FBQ0gsU0FBUywwQkFBMEI7SUFDakMsTUFBTSxHQUFHLEdBQUcsV0FBVyxFQUFFLENBQUM7SUFDMUIsSUFBSSxlQUFpQyxDQUFDO0lBQ3RDLEtBQUssTUFBTSxJQUFJLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztRQUN2QyxJQUNFLElBQUksQ0FBQyxRQUFRLEtBQUssSUFBSSxDQUFDLFlBQVk7WUFDbkMsSUFBSSxDQUFDLFdBQVcsRUFBRSxJQUFJLEVBQUUsS0FBSyw0QkFBNEIsRUFDekQsQ0FBQztZQUNELGVBQWUsR0FBRyxJQUFJLENBQUM7WUFDdkIsTUFBTTtRQUNSLENBQUM7SUFDSCxDQUFDO0lBQ0QsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO1FBQ3JCLE1BQU0sSUFBSSxZQUFZLG1FQUVwQixPQUFPLFNBQVMsS0FBSyxXQUFXO1lBQzlCLFNBQVM7WUFDVCx3RkFBd0Y7Z0JBQ3RGLHVGQUF1RjtnQkFDdkYsNkVBQTZFO2dCQUM3RSxpRkFBaUYsQ0FDdEYsQ0FBQztJQUNKLENBQUM7QUFDSCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7QVBQX0JPT1RTVFJBUF9MSVNURU5FUiwgQXBwbGljYXRpb25SZWYsIHdoZW5TdGFibGV9IGZyb20gJy4uL2FwcGxpY2F0aW9uL2FwcGxpY2F0aW9uX3JlZic7XG5pbXBvcnQge0NvbnNvbGV9IGZyb20gJy4uL2NvbnNvbGUnO1xuaW1wb3J0IHtcbiAgRU5WSVJPTk1FTlRfSU5JVElBTElaRVIsXG4gIEVudmlyb25tZW50UHJvdmlkZXJzLFxuICBJbmplY3RvcixcbiAgbWFrZUVudmlyb25tZW50UHJvdmlkZXJzLFxuICBQcm92aWRlcixcbn0gZnJvbSAnLi4vZGknO1xuaW1wb3J0IHtpbmplY3R9IGZyb20gJy4uL2RpL2luamVjdG9yX2NvbXBhdGliaWxpdHknO1xuaW1wb3J0IHtmb3JtYXRSdW50aW1lRXJyb3IsIFJ1bnRpbWVFcnJvciwgUnVudGltZUVycm9yQ29kZX0gZnJvbSAnLi4vZXJyb3JzJztcbmltcG9ydCB7ZW5hYmxlTG9jYXRlT3JDcmVhdGVDb250YWluZXJSZWZJbXBsfSBmcm9tICcuLi9saW5rZXIvdmlld19jb250YWluZXJfcmVmJztcbmltcG9ydCB7ZW5hYmxlTG9jYXRlT3JDcmVhdGVJMThuTm9kZUltcGx9IGZyb20gJy4uL3JlbmRlcjMvaTE4bi9pMThuX2FwcGx5JztcbmltcG9ydCB7ZW5hYmxlTG9jYXRlT3JDcmVhdGVFbGVtZW50Tm9kZUltcGx9IGZyb20gJy4uL3JlbmRlcjMvaW5zdHJ1Y3Rpb25zL2VsZW1lbnQnO1xuaW1wb3J0IHtlbmFibGVMb2NhdGVPckNyZWF0ZUVsZW1lbnRDb250YWluZXJOb2RlSW1wbH0gZnJvbSAnLi4vcmVuZGVyMy9pbnN0cnVjdGlvbnMvZWxlbWVudF9jb250YWluZXInO1xuaW1wb3J0IHtlbmFibGVBcHBseVJvb3RFbGVtZW50VHJhbnNmb3JtSW1wbH0gZnJvbSAnLi4vcmVuZGVyMy9pbnN0cnVjdGlvbnMvc2hhcmVkJztcbmltcG9ydCB7ZW5hYmxlTG9jYXRlT3JDcmVhdGVDb250YWluZXJBbmNob3JJbXBsfSBmcm9tICcuLi9yZW5kZXIzL2luc3RydWN0aW9ucy90ZW1wbGF0ZSc7XG5pbXBvcnQge2VuYWJsZUxvY2F0ZU9yQ3JlYXRlVGV4dE5vZGVJbXBsfSBmcm9tICcuLi9yZW5kZXIzL2luc3RydWN0aW9ucy90ZXh0JztcbmltcG9ydCB7Z2V0RG9jdW1lbnR9IGZyb20gJy4uL3JlbmRlcjMvaW50ZXJmYWNlcy9kb2N1bWVudCc7XG5pbXBvcnQge2lzUGxhdGZvcm1Ccm93c2VyfSBmcm9tICcuLi9yZW5kZXIzL3V0aWwvbWlzY191dGlscyc7XG5pbXBvcnQge1RyYW5zZmVyU3RhdGV9IGZyb20gJy4uL3RyYW5zZmVyX3N0YXRlJztcbmltcG9ydCB7cGVyZm9ybWFuY2VNYXJrRmVhdHVyZX0gZnJvbSAnLi4vdXRpbC9wZXJmb3JtYW5jZSc7XG5pbXBvcnQge05nWm9uZX0gZnJvbSAnLi4vem9uZSc7XG5cbmltcG9ydCB7Y2xlYW51cERlaHlkcmF0ZWRWaWV3c30gZnJvbSAnLi9jbGVhbnVwJztcbmltcG9ydCB7XG4gIGVuYWJsZUNsYWltRGVoeWRyYXRlZEljdUNhc2VJbXBsLFxuICBlbmFibGVQcmVwYXJlSTE4bkJsb2NrRm9ySHlkcmF0aW9uSW1wbCxcbiAgaXNJMThuSHlkcmF0aW9uRW5hYmxlZCxcbiAgc2V0SXNJMThuSHlkcmF0aW9uU3VwcG9ydEVuYWJsZWQsXG59IGZyb20gJy4vaTE4bic7XG5pbXBvcnQge1xuICBJU19IWURSQVRJT05fRE9NX1JFVVNFX0VOQUJMRUQsXG4gIElTX0kxOE5fSFlEUkFUSU9OX0VOQUJMRUQsXG4gIFBSRVNFUlZFX0hPU1RfQ09OVEVOVCxcbn0gZnJvbSAnLi90b2tlbnMnO1xuaW1wb3J0IHtlbmFibGVSZXRyaWV2ZUh5ZHJhdGlvbkluZm9JbXBsLCBOR0hfREFUQV9LRVksIFNTUl9DT05URU5UX0lOVEVHUklUWV9NQVJLRVJ9IGZyb20gJy4vdXRpbHMnO1xuaW1wb3J0IHtlbmFibGVGaW5kTWF0Y2hpbmdEZWh5ZHJhdGVkVmlld0ltcGx9IGZyb20gJy4vdmlld3MnO1xuXG4vKipcbiAqIEluZGljYXRlcyB3aGV0aGVyIHRoZSBoeWRyYXRpb24tcmVsYXRlZCBjb2RlIHdhcyBhZGRlZCxcbiAqIHByZXZlbnRzIGFkZGluZyBpdCBtdWx0aXBsZSB0aW1lcy5cbiAqL1xubGV0IGlzSHlkcmF0aW9uU3VwcG9ydEVuYWJsZWQgPSBmYWxzZTtcblxuLyoqXG4gKiBJbmRpY2F0ZXMgd2hldGhlciB0aGUgaTE4bi1yZWxhdGVkIGNvZGUgd2FzIGFkZGVkLFxuICogcHJldmVudHMgYWRkaW5nIGl0IG11bHRpcGxlIHRpbWVzLlxuICpcbiAqIE5vdGU6IFRoaXMgbWVyZWx5IGNvbnRyb2xzIHdoZXRoZXIgdGhlIGNvZGUgaXMgbG9hZGVkLFxuICogd2hpbGUgYHNldElzSTE4bkh5ZHJhdGlvblN1cHBvcnRFbmFibGVkYCBkZXRlcm1pbmVzXG4gKiB3aGV0aGVyIGkxOG4gYmxvY2tzIGFyZSBzZXJpYWxpemVkIG9yIGh5ZHJhdGVkLlxuICovXG5sZXQgaXNJMThuSHlkcmF0aW9uUnVudGltZVN1cHBvcnRFbmFibGVkID0gZmFsc2U7XG5cbi8qKlxuICogRGVmaW5lcyBhIHBlcmlvZCBvZiB0aW1lIHRoYXQgQW5ndWxhciB3YWl0cyBmb3IgdGhlIGBBcHBsaWNhdGlvblJlZi5pc1N0YWJsZWAgdG8gZW1pdCBgdHJ1ZWAuXG4gKiBJZiB0aGVyZSB3YXMgbm8gZXZlbnQgd2l0aCB0aGUgYHRydWVgIHZhbHVlIGR1cmluZyB0aGlzIHRpbWUsIEFuZ3VsYXIgcmVwb3J0cyBhIHdhcm5pbmcuXG4gKi9cbmNvbnN0IEFQUExJQ0FUSU9OX0lTX1NUQUJMRV9USU1FT1VUID0gMTBfMDAwO1xuXG4vKipcbiAqIEJyaW5ncyB0aGUgbmVjZXNzYXJ5IGh5ZHJhdGlvbiBjb2RlIGluIHRyZWUtc2hha2FibGUgbWFubmVyLlxuICogVGhlIGNvZGUgaXMgb25seSBwcmVzZW50IHdoZW4gdGhlIGBwcm92aWRlQ2xpZW50SHlkcmF0aW9uYCBpc1xuICogaW52b2tlZC4gT3RoZXJ3aXNlLCB0aGlzIGNvZGUgaXMgdHJlZS1zaGFrZW4gYXdheSBkdXJpbmcgdGhlXG4gKiBidWlsZCBvcHRpbWl6YXRpb24gc3RlcC5cbiAqXG4gKiBUaGlzIHRlY2huaXF1ZSBhbGxvd3MgdXMgdG8gc3dhcCBpbXBsZW1lbnRhdGlvbnMgb2YgbWV0aG9kcyBzb1xuICogdHJlZSBzaGFraW5nIHdvcmtzIGFwcHJvcHJpYXRlbHkgd2hlbiBoeWRyYXRpb24gaXMgZGlzYWJsZWQgb3JcbiAqIGVuYWJsZWQuIEl0IGJyaW5ncyBpbiB0aGUgYXBwcm9wcmlhdGUgdmVyc2lvbiBvZiB0aGUgbWV0aG9kIHRoYXRcbiAqIHN1cHBvcnRzIGh5ZHJhdGlvbiBvbmx5IHdoZW4gZW5hYmxlZC5cbiAqL1xuZnVuY3Rpb24gZW5hYmxlSHlkcmF0aW9uUnVudGltZVN1cHBvcnQoKSB7XG4gIGlmICghaXNIeWRyYXRpb25TdXBwb3J0RW5hYmxlZCkge1xuICAgIGlzSHlkcmF0aW9uU3VwcG9ydEVuYWJsZWQgPSB0cnVlO1xuICAgIGVuYWJsZVJldHJpZXZlSHlkcmF0aW9uSW5mb0ltcGwoKTtcbiAgICBlbmFibGVMb2NhdGVPckNyZWF0ZUVsZW1lbnROb2RlSW1wbCgpO1xuICAgIGVuYWJsZUxvY2F0ZU9yQ3JlYXRlVGV4dE5vZGVJbXBsKCk7XG4gICAgZW5hYmxlTG9jYXRlT3JDcmVhdGVFbGVtZW50Q29udGFpbmVyTm9kZUltcGwoKTtcbiAgICBlbmFibGVMb2NhdGVPckNyZWF0ZUNvbnRhaW5lckFuY2hvckltcGwoKTtcbiAgICBlbmFibGVMb2NhdGVPckNyZWF0ZUNvbnRhaW5lclJlZkltcGwoKTtcbiAgICBlbmFibGVGaW5kTWF0Y2hpbmdEZWh5ZHJhdGVkVmlld0ltcGwoKTtcbiAgICBlbmFibGVBcHBseVJvb3RFbGVtZW50VHJhbnNmb3JtSW1wbCgpO1xuICB9XG59XG5cbi8qKlxuICogQnJpbmdzIHRoZSBuZWNlc3NhcnkgaTE4biBoeWRyYXRpb24gY29kZSBpbiB0cmVlLXNoYWthYmxlIG1hbm5lci5cbiAqIFNpbWlsYXIgdG8gYGVuYWJsZUh5ZHJhdGlvblJ1bnRpbWVTdXBwb3J0YCwgdGhlIGNvZGUgaXMgb25seVxuICogcHJlc2VudCB3aGVuIGB3aXRoSTE4blN1cHBvcnRgIGlzIGludm9rZWQuXG4gKi9cbmZ1bmN0aW9uIGVuYWJsZUkxOG5IeWRyYXRpb25SdW50aW1lU3VwcG9ydCgpIHtcbiAgaWYgKCFpc0kxOG5IeWRyYXRpb25SdW50aW1lU3VwcG9ydEVuYWJsZWQpIHtcbiAgICBpc0kxOG5IeWRyYXRpb25SdW50aW1lU3VwcG9ydEVuYWJsZWQgPSB0cnVlO1xuICAgIGVuYWJsZUxvY2F0ZU9yQ3JlYXRlSTE4bk5vZGVJbXBsKCk7XG4gICAgZW5hYmxlUHJlcGFyZUkxOG5CbG9ja0Zvckh5ZHJhdGlvbkltcGwoKTtcbiAgICBlbmFibGVDbGFpbURlaHlkcmF0ZWRJY3VDYXNlSW1wbCgpO1xuICB9XG59XG5cbi8qKlxuICogT3V0cHV0cyBhIG1lc3NhZ2Ugd2l0aCBoeWRyYXRpb24gc3RhdHMgaW50byBhIGNvbnNvbGUuXG4gKi9cbmZ1bmN0aW9uIHByaW50SHlkcmF0aW9uU3RhdHMoaW5qZWN0b3I6IEluamVjdG9yKSB7XG4gIGNvbnN0IGNvbnNvbGUgPSBpbmplY3Rvci5nZXQoQ29uc29sZSk7XG4gIGNvbnN0IG1lc3NhZ2UgPVxuICAgIGBBbmd1bGFyIGh5ZHJhdGVkICR7bmdEZXZNb2RlIS5oeWRyYXRlZENvbXBvbmVudHN9IGNvbXBvbmVudChzKSBgICtcbiAgICBgYW5kICR7bmdEZXZNb2RlIS5oeWRyYXRlZE5vZGVzfSBub2RlKHMpLCBgICtcbiAgICBgJHtuZ0Rldk1vZGUhLmNvbXBvbmVudHNTa2lwcGVkSHlkcmF0aW9ufSBjb21wb25lbnQocykgd2VyZSBza2lwcGVkLiBgICtcbiAgICBgTGVhcm4gbW9yZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vZ3VpZGUvaHlkcmF0aW9uLmA7XG4gIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTpuby1jb25zb2xlXG4gIGNvbnNvbGUubG9nKG1lc3NhZ2UpO1xufVxuXG4vKipcbiAqIFJldHVybnMgYSBQcm9taXNlIHRoYXQgaXMgcmVzb2x2ZWQgd2hlbiBhbiBhcHBsaWNhdGlvbiBiZWNvbWVzIHN0YWJsZS5cbiAqL1xuZnVuY3Rpb24gd2hlblN0YWJsZVdpdGhUaW1lb3V0KGFwcFJlZjogQXBwbGljYXRpb25SZWYsIGluamVjdG9yOiBJbmplY3Rvcik6IFByb21pc2U8dm9pZD4ge1xuICBjb25zdCB3aGVuU3RhYmxlUHJvbWlzZSA9IHdoZW5TdGFibGUoYXBwUmVmKTtcbiAgaWYgKHR5cGVvZiBuZ0Rldk1vZGUgIT09ICd1bmRlZmluZWQnICYmIG5nRGV2TW9kZSkge1xuICAgIGNvbnN0IHRpbWVvdXRUaW1lID0gQVBQTElDQVRJT05fSVNfU1RBQkxFX1RJTUVPVVQ7XG4gICAgY29uc3QgY29uc29sZSA9IGluamVjdG9yLmdldChDb25zb2xlKTtcbiAgICBjb25zdCBuZ1pvbmUgPSBpbmplY3Rvci5nZXQoTmdab25lKTtcblxuICAgIC8vIFRoZSBmb2xsb3dpbmcgY2FsbCBzaG91bGQgbm90IGFuZCBkb2VzIG5vdCBwcmV2ZW50IHRoZSBhcHAgdG8gYmVjb21lIHN0YWJsZVxuICAgIC8vIFdlIGNhbm5vdCB1c2UgUnhKUyB0aW1lciBoZXJlIGJlY2F1c2UgdGhlIGFwcCB3b3VsZCByZW1haW4gdW5zdGFibGUuXG4gICAgLy8gVGhpcyBhbHNvIGF2b2lkcyBhbiBleHRyYSBjaGFuZ2UgZGV0ZWN0aW9uIGN5Y2xlLlxuICAgIGNvbnN0IHRpbWVvdXRJZCA9IG5nWm9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiB7XG4gICAgICByZXR1cm4gc2V0VGltZW91dCgoKSA9PiBsb2dXYXJuaW5nT25TdGFibGVUaW1lZG91dCh0aW1lb3V0VGltZSwgY29uc29sZSksIHRpbWVvdXRUaW1lKTtcbiAgICB9KTtcblxuICAgIHdoZW5TdGFibGVQcm9taXNlLmZpbmFsbHkoKCkgPT4gY2xlYXJUaW1lb3V0KHRpbWVvdXRJZCkpO1xuICB9XG5cbiAgcmV0dXJuIHdoZW5TdGFibGVQcm9taXNlO1xufVxuXG4vKipcbiAqIFJldHVybnMgYSBzZXQgb2YgcHJvdmlkZXJzIHJlcXVpcmVkIHRvIHNldHVwIGh5ZHJhdGlvbiBzdXBwb3J0XG4gKiBmb3IgYW4gYXBwbGljYXRpb24gdGhhdCBpcyBzZXJ2ZXIgc2lkZSByZW5kZXJlZC4gVGhpcyBmdW5jdGlvbiBpc1xuICogaW5jbHVkZWQgaW50byB0aGUgYHByb3ZpZGVDbGllbnRIeWRyYXRpb25gIHB1YmxpYyBBUEkgZnVuY3Rpb24gZnJvbVxuICogdGhlIGBwbGF0Zm9ybS1icm93c2VyYCBwYWNrYWdlLlxuICpcbiAqIFRoZSBmdW5jdGlvbiBzZXRzIHVwIGFuIGludGVybmFsIGZsYWcgdGhhdCB3b3VsZCBiZSByZWNvZ25pemVkIGR1cmluZ1xuICogdGhlIHNlcnZlciBzaWRlIHJlbmRlcmluZyB0aW1lIGFzIHdlbGwsIHNvIHRoZXJlIGlzIG5vIG5lZWQgdG9cbiAqIGNvbmZpZ3VyZSBvciBjaGFuZ2UgYW55dGhpbmcgaW4gTmdVbml2ZXJzYWwgdG8gZW5hYmxlIHRoZSBmZWF0dXJlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gd2l0aERvbUh5ZHJhdGlvbigpOiBFbnZpcm9ubWVudFByb3ZpZGVycyB7XG4gIHJldHVybiBtYWtlRW52aXJvbm1lbnRQcm92aWRlcnMoW1xuICAgIHtcbiAgICAgIHByb3ZpZGU6IElTX0hZRFJBVElPTl9ET01fUkVVU0VfRU5BQkxFRCxcbiAgICAgIHVzZUZhY3Rvcnk6ICgpID0+IHtcbiAgICAgICAgbGV0IGlzRW5hYmxlZCA9IHRydWU7XG4gICAgICAgIGlmIChpc1BsYXRmb3JtQnJvd3NlcigpKSB7XG4gICAgICAgICAgLy8gT24gdGhlIGNsaWVudCwgdmVyaWZ5IHRoYXQgdGhlIHNlcnZlciByZXNwb25zZSBjb250YWluc1xuICAgICAgICAgIC8vIGh5ZHJhdGlvbiBhbm5vdGF0aW9ucy4gT3RoZXJ3aXNlLCBrZWVwIGh5ZHJhdGlvbiBkaXNhYmxlZC5cbiAgICAgICAgICBjb25zdCB0cmFuc2ZlclN0YXRlID0gaW5qZWN0KFRyYW5zZmVyU3RhdGUsIHtvcHRpb25hbDogdHJ1ZX0pO1xuICAgICAgICAgIGlzRW5hYmxlZCA9ICEhdHJhbnNmZXJTdGF0ZT8uZ2V0KE5HSF9EQVRBX0tFWSwgbnVsbCk7XG4gICAgICAgICAgaWYgKCFpc0VuYWJsZWQgJiYgdHlwZW9mIG5nRGV2TW9kZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbmdEZXZNb2RlKSB7XG4gICAgICAgICAgICBjb25zdCBjb25zb2xlID0gaW5qZWN0KENvbnNvbGUpO1xuICAgICAgICAgICAgY29uc3QgbWVzc2FnZSA9IGZvcm1hdFJ1bnRpbWVFcnJvcihcbiAgICAgICAgICAgICAgUnVudGltZUVycm9yQ29kZS5NSVNTSU5HX0hZRFJBVElPTl9BTk5PVEFUSU9OUyxcbiAgICAgICAgICAgICAgJ0FuZ3VsYXIgaHlkcmF0aW9uIHdhcyByZXF1ZXN0ZWQgb24gdGhlIGNsaWVudCwgYnV0IHRoZXJlIHdhcyBubyAnICtcbiAgICAgICAgICAgICAgICAnc2VyaWFsaXplZCBpbmZvcm1hdGlvbiBwcmVzZW50IGluIHRoZSBzZXJ2ZXIgcmVzcG9uc2UsICcgK1xuICAgICAgICAgICAgICAgICd0aHVzIGh5ZHJhdGlvbiB3YXMgbm90IGVuYWJsZWQuICcgK1xuICAgICAgICAgICAgICAgICdNYWtlIHN1cmUgdGhlIGBwcm92aWRlQ2xpZW50SHlkcmF0aW9uKClgIGlzIGluY2x1ZGVkIGludG8gdGhlIGxpc3QgJyArXG4gICAgICAgICAgICAgICAgJ29mIHByb3ZpZGVycyBpbiB0aGUgc2VydmVyIHBhcnQgb2YgdGhlIGFwcGxpY2F0aW9uIGNvbmZpZ3VyYXRpb24uJyxcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6bm8tY29uc29sZVxuICAgICAgICAgICAgY29uc29sZS53YXJuKG1lc3NhZ2UpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoaXNFbmFibGVkKSB7XG4gICAgICAgICAgcGVyZm9ybWFuY2VNYXJrRmVhdHVyZSgnTmdIeWRyYXRpb24nKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gaXNFbmFibGVkO1xuICAgICAgfSxcbiAgICB9LFxuICAgIHtcbiAgICAgIHByb3ZpZGU6IEVOVklST05NRU5UX0lOSVRJQUxJWkVSLFxuICAgICAgdXNlVmFsdWU6ICgpID0+IHtcbiAgICAgICAgLy8gaTE4biBzdXBwb3J0IGlzIGVuYWJsZWQgYnkgY2FsbGluZyB3aXRoSTE4blN1cHBvcnQoKSwgYnV0IHRoZXJlJ3NcbiAgICAgICAgLy8gbm8gd2F5IHRvIHR1cm4gaXQgb2ZmIChlLmcuIGZvciB0ZXN0cyksIHNvIHdlIHR1cm4gaXQgb2ZmIGJ5IGRlZmF1bHQuXG4gICAgICAgIHNldElzSTE4bkh5ZHJhdGlvblN1cHBvcnRFbmFibGVkKGZhbHNlKTtcblxuICAgICAgICAvLyBTaW5jZSB0aGlzIGZ1bmN0aW9uIGlzIHVzZWQgYWNyb3NzIGJvdGggc2VydmVyIGFuZCBjbGllbnQsXG4gICAgICAgIC8vIG1ha2Ugc3VyZSB0aGF0IHRoZSBydW50aW1lIGNvZGUgaXMgb25seSBhZGRlZCB3aGVuIGludm9rZWRcbiAgICAgICAgLy8gb24gdGhlIGNsaWVudC4gTW92aW5nIGZvcndhcmQsIHRoZSBgaXNQbGF0Zm9ybUJyb3dzZXJgIGNoZWNrIHNob3VsZFxuICAgICAgICAvLyBiZSByZXBsYWNlZCB3aXRoIGEgdHJlZS1zaGFrYWJsZSBhbHRlcm5hdGl2ZSAoZS5nLiBgaXNTZXJ2ZXJgXG4gICAgICAgIC8vIGZsYWcpLlxuICAgICAgICBpZiAoaXNQbGF0Zm9ybUJyb3dzZXIoKSAmJiBpbmplY3QoSVNfSFlEUkFUSU9OX0RPTV9SRVVTRV9FTkFCTEVEKSkge1xuICAgICAgICAgIHZlcmlmeVNzckNvbnRlbnRzSW50ZWdyaXR5KCk7XG4gICAgICAgICAgZW5hYmxlSHlkcmF0aW9uUnVudGltZVN1cHBvcnQoKTtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIG11bHRpOiB0cnVlLFxuICAgIH0sXG4gICAge1xuICAgICAgcHJvdmlkZTogUFJFU0VSVkVfSE9TVF9DT05URU5ULFxuICAgICAgdXNlRmFjdG9yeTogKCkgPT4ge1xuICAgICAgICAvLyBQcmVzZXJ2ZSBob3N0IGVsZW1lbnQgY29udGVudCBvbmx5IGluIGEgYnJvd3NlclxuICAgICAgICAvLyBlbnZpcm9ubWVudCBhbmQgd2hlbiBoeWRyYXRpb24gaXMgY29uZmlndXJlZCBwcm9wZXJseS5cbiAgICAgICAgLy8gT24gYSBzZXJ2ZXIsIGFuIGFwcGxpY2F0aW9uIGlzIHJlbmRlcmVkIGZyb20gc2NyYXRjaCxcbiAgICAgICAgLy8gc28gdGhlIGhvc3QgY29udGVudCBuZWVkcyB0byBiZSBlbXB0eS5cbiAgICAgICAgcmV0dXJuIGlzUGxhdGZvcm1Ccm93c2VyKCkgJiYgaW5qZWN0KElTX0hZRFJBVElPTl9ET01fUkVVU0VfRU5BQkxFRCk7XG4gICAgICB9LFxuICAgIH0sXG4gICAge1xuICAgICAgcHJvdmlkZTogQVBQX0JPT1RTVFJBUF9MSVNURU5FUixcbiAgICAgIHVzZUZhY3Rvcnk6ICgpID0+IHtcbiAgICAgICAgaWYgKGlzUGxhdGZvcm1Ccm93c2VyKCkgJiYgaW5qZWN0KElTX0hZRFJBVElPTl9ET01fUkVVU0VfRU5BQkxFRCkpIHtcbiAgICAgICAgICBjb25zdCBhcHBSZWYgPSBpbmplY3QoQXBwbGljYXRpb25SZWYpO1xuICAgICAgICAgIGNvbnN0IGluamVjdG9yID0gaW5qZWN0KEluamVjdG9yKTtcbiAgICAgICAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgICAgICAgLy8gV2FpdCB1bnRpbCBhbiBhcHAgYmVjb21lcyBzdGFibGUgYW5kIGNsZWFudXAgYWxsIHZpZXdzIHRoYXRcbiAgICAgICAgICAgIC8vIHdlcmUgbm90IGNsYWltZWQgZHVyaW5nIHRoZSBhcHBsaWNhdGlvbiBib290c3RyYXAgcHJvY2Vzcy5cbiAgICAgICAgICAgIC8vIFRoZSB0aW1pbmcgaXMgc2ltaWxhciB0byB3aGVuIHdlIHN0YXJ0IHRoZSBzZXJpYWxpemF0aW9uIHByb2Nlc3NcbiAgICAgICAgICAgIC8vIG9uIHRoZSBzZXJ2ZXIuXG4gICAgICAgICAgICAvL1xuICAgICAgICAgICAgLy8gTm90ZTogdGhlIGNsZWFudXAgdGFzayAqTVVTVCogYmUgc2NoZWR1bGVkIHdpdGhpbiB0aGUgQW5ndWxhciB6b25lIGluIFpvbmUgYXBwc1xuICAgICAgICAgICAgLy8gdG8gZW5zdXJlIHRoYXQgY2hhbmdlIGRldGVjdGlvbiBpcyBwcm9wZXJseSBydW4gYWZ0ZXJ3YXJkLlxuICAgICAgICAgICAgd2hlblN0YWJsZVdpdGhUaW1lb3V0KGFwcFJlZiwgaW5qZWN0b3IpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICBjbGVhbnVwRGVoeWRyYXRlZFZpZXdzKGFwcFJlZik7XG4gICAgICAgICAgICAgIGlmICh0eXBlb2YgbmdEZXZNb2RlICE9PSAndW5kZWZpbmVkJyAmJiBuZ0Rldk1vZGUpIHtcbiAgICAgICAgICAgICAgICBwcmludEh5ZHJhdGlvblN0YXRzKGluamVjdG9yKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gKCkgPT4ge307IC8vIG5vb3BcbiAgICAgIH0sXG4gICAgICBtdWx0aTogdHJ1ZSxcbiAgICB9LFxuICBdKTtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIGEgc2V0IG9mIHByb3ZpZGVycyByZXF1aXJlZCB0byBzZXR1cCBzdXBwb3J0IGZvciBpMThuIGh5ZHJhdGlvbi5cbiAqIFJlcXVpcmVzIGh5ZHJhdGlvbiB0byBiZSBlbmFibGVkIHNlcGFyYXRlbHkuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB3aXRoSTE4blN1cHBvcnQoKTogUHJvdmlkZXJbXSB7XG4gIHJldHVybiBbXG4gICAge1xuICAgICAgcHJvdmlkZTogSVNfSTE4Tl9IWURSQVRJT05fRU5BQkxFRCxcbiAgICAgIHVzZVZhbHVlOiB0cnVlLFxuICAgIH0sXG4gICAge1xuICAgICAgcHJvdmlkZTogRU5WSVJPTk1FTlRfSU5JVElBTElaRVIsXG4gICAgICB1c2VWYWx1ZTogKCkgPT4ge1xuICAgICAgICBlbmFibGVJMThuSHlkcmF0aW9uUnVudGltZVN1cHBvcnQoKTtcbiAgICAgICAgc2V0SXNJMThuSHlkcmF0aW9uU3VwcG9ydEVuYWJsZWQodHJ1ZSk7XG4gICAgICAgIHBlcmZvcm1hbmNlTWFya0ZlYXR1cmUoJ05nSTE4bkh5ZHJhdGlvbicpO1xuICAgICAgfSxcbiAgICAgIG11bHRpOiB0cnVlLFxuICAgIH0sXG4gIF07XG59XG5cbi8qKlxuICpcbiAqIEBwYXJhbSB0aW1lIFRoZSB0aW1lIGluIG1zIHVudGlsIHRoZSBzdGFibGUgdGltZWRvdXQgd2FybmluZyBtZXNzYWdlIGlzIGxvZ2dlZFxuICovXG5mdW5jdGlvbiBsb2dXYXJuaW5nT25TdGFibGVUaW1lZG91dCh0aW1lOiBudW1iZXIsIGNvbnNvbGU6IENvbnNvbGUpOiB2b2lkIHtcbiAgY29uc3QgbWVzc2FnZSA9XG4gICAgYEFuZ3VsYXIgaHlkcmF0aW9uIGV4cGVjdGVkIHRoZSBBcHBsaWNhdGlvblJlZi5pc1N0YWJsZSgpIHRvIGVtaXQgXFxgdHJ1ZVxcYCwgYnV0IGl0IGAgK1xuICAgIGBkaWRuJ3QgaGFwcGVuIHdpdGhpbiAke3RpbWV9bXMuIEFuZ3VsYXIgaHlkcmF0aW9uIGxvZ2ljIGRlcGVuZHMgb24gdGhlIGFwcGxpY2F0aW9uIGJlY29taW5nIHN0YWJsZSBgICtcbiAgICBgYXMgYSBzaWduYWwgdG8gY29tcGxldGUgaHlkcmF0aW9uIHByb2Nlc3MuYDtcblxuICBjb25zb2xlLndhcm4oZm9ybWF0UnVudGltZUVycm9yKFJ1bnRpbWVFcnJvckNvZGUuSFlEUkFUSU9OX1NUQUJMRV9USU1FRE9VVCwgbWVzc2FnZSkpO1xufVxuXG4vKipcbiAqIFZlcmlmaWVzIHdoZXRoZXIgdGhlIERPTSBjb250YWlucyBhIHNwZWNpYWwgbWFya2VyIGFkZGVkIGR1cmluZyBTU1IgdGltZSB0byBtYWtlIHN1cmVcbiAqIHRoZXJlIGlzIG5vIFNTUidlZCBjb250ZW50cyB0cmFuc2Zvcm1hdGlvbnMgaGFwcGVuIGFmdGVyIFNTUiBpcyBjb21wbGV0ZWQuIFR5cGljYWxseSB0aGF0XG4gKiBoYXBwZW5zIGVpdGhlciBieSBDRE4gb3IgZHVyaW5nIHRoZSBidWlsZCBwcm9jZXNzIGFzIGFuIG9wdGltaXphdGlvbiB0byByZW1vdmUgY29tbWVudCBub2Rlcy5cbiAqIEh5ZHJhdGlvbiBwcm9jZXNzIHJlcXVpcmVzIGNvbW1lbnQgbm9kZXMgcHJvZHVjZWQgYnkgQW5ndWxhciB0byBsb2NhdGUgY29ycmVjdCBET00gc2VnbWVudHMuXG4gKiBXaGVuIHRoaXMgc3BlY2lhbCBtYXJrZXIgaXMgKm5vdCogcHJlc2VudCAtIHRocm93IGFuIGVycm9yIGFuZCBkbyBub3QgcHJvY2VlZCB3aXRoIGh5ZHJhdGlvbixcbiAqIHNpbmNlIGl0IHdpbGwgbm90IGJlIGFibGUgdG8gZnVuY3Rpb24gY29ycmVjdGx5LlxuICpcbiAqIE5vdGU6IHRoaXMgZnVuY3Rpb24gaXMgaW52b2tlZCBvbmx5IG9uIHRoZSBjbGllbnQsIHNvIGl0J3Mgc2FmZSB0byB1c2UgRE9NIEFQSXMuXG4gKi9cbmZ1bmN0aW9uIHZlcmlmeVNzckNvbnRlbnRzSW50ZWdyaXR5KCk6IHZvaWQge1xuICBjb25zdCBkb2MgPSBnZXREb2N1bWVudCgpO1xuICBsZXQgaHlkcmF0aW9uTWFya2VyOiBOb2RlIHwgdW5kZWZpbmVkO1xuICBmb3IgKGNvbnN0IG5vZGUgb2YgZG9jLmJvZHkuY2hpbGROb2Rlcykge1xuICAgIGlmIChcbiAgICAgIG5vZGUubm9kZVR5cGUgPT09IE5vZGUuQ09NTUVOVF9OT0RFICYmXG4gICAgICBub2RlLnRleHRDb250ZW50Py50cmltKCkgPT09IFNTUl9DT05URU5UX0lOVEVHUklUWV9NQVJLRVJcbiAgICApIHtcbiAgICAgIGh5ZHJhdGlvbk1hcmtlciA9IG5vZGU7XG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cbiAgaWYgKCFoeWRyYXRpb25NYXJrZXIpIHtcbiAgICB0aHJvdyBuZXcgUnVudGltZUVycm9yKFxuICAgICAgUnVudGltZUVycm9yQ29kZS5NSVNTSU5HX1NTUl9DT05URU5UX0lOVEVHUklUWV9NQVJLRVIsXG4gICAgICB0eXBlb2YgbmdEZXZNb2RlICE9PSAndW5kZWZpbmVkJyAmJlxuICAgICAgICBuZ0Rldk1vZGUgJiZcbiAgICAgICAgJ0FuZ3VsYXIgaHlkcmF0aW9uIGxvZ2ljIGRldGVjdGVkIHRoYXQgSFRNTCBjb250ZW50IG9mIHRoaXMgcGFnZSB3YXMgbW9kaWZpZWQgYWZ0ZXIgaXQgJyArXG4gICAgICAgICAgJ3dhcyBwcm9kdWNlZCBkdXJpbmcgc2VydmVyIHNpZGUgcmVuZGVyaW5nLiBNYWtlIHN1cmUgdGhhdCB0aGVyZSBhcmUgbm8gb3B0aW1pemF0aW9ucyAnICtcbiAgICAgICAgICAndGhhdCByZW1vdmUgY29tbWVudCBub2RlcyBmcm9tIEhUTUwgZW5hYmxlZCBvbiB5b3VyIENETi4gQW5ndWxhciBoeWRyYXRpb24gJyArXG4gICAgICAgICAgJ3JlbGllcyBvbiBIVE1MIHByb2R1Y2VkIGJ5IHRoZSBzZXJ2ZXIsIGluY2x1ZGluZyB3aGl0ZXNwYWNlcyBhbmQgY29tbWVudCBub2Rlcy4nLFxuICAgICk7XG4gIH1cbn1cbiJdfQ==