/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */
import { isEarlyEventType, isCaptureEventType, EventContractContainer, EventContract, EventDispatcher, registerDispatcher, getAppScopedQueuedEventInfos, clearAppScopedEarlyEventContract, } from '@angular/core/primitives/event-dispatch';
import { APP_BOOTSTRAP_LISTENER, ApplicationRef, whenStable } from '../application/application_ref';
import { ENVIRONMENT_INITIALIZER, Injector } from '../di';
import { inject } from '../di/injector_compatibility';
import { setStashFn } from '../render3/instructions/listener';
import { CLEANUP } from '../render3/interfaces/view';
import { isPlatformBrowser } from '../render3/util/misc_utils';
import { unwrapRNode } from '../render3/util/view_utils';
import { EVENT_REPLAY_ENABLED_DEFAULT, IS_EVENT_REPLAY_ENABLED, IS_GLOBAL_EVENT_DELEGATION_ENABLED, } from './tokens';
import { sharedStashFunction, removeListeners, invokeRegisteredListeners, JSACTION_EVENT_CONTRACT, } from '../event_delegation_utils';
import { APP_ID } from '../application/application_tokens';
import { performanceMarkFeature } from '../util/performance';
/**
 * A set of DOM elements with `jsaction` attributes.
 */
const jsactionSet = new Set();
function isGlobalEventDelegationEnabled(injector) {
    return injector.get(IS_GLOBAL_EVENT_DELEGATION_ENABLED, false);
}
/**
 * Determines whether Event Replay feature should be activated on the client.
 */
function shouldEnableEventReplay(injector) {
    return (injector.get(IS_EVENT_REPLAY_ENABLED, EVENT_REPLAY_ENABLED_DEFAULT) &&
        !isGlobalEventDelegationEnabled(injector));
}
/**
 * Returns a set of providers required to setup support for event replay.
 * Requires hydration to be enabled separately.
 */
export function withEventReplay() {
    return [
        {
            provide: IS_EVENT_REPLAY_ENABLED,
            useFactory: () => {
                let isEnabled = true;
                if (isPlatformBrowser()) {
                    // Note: globalThis[CONTRACT_PROPERTY] may be undefined in case Event Replay feature
                    // is enabled, but there are no events configured in this application, in which case
                    // we don't activate this feature, since there are no events to replay.
                    const appId = inject(APP_ID);
                    isEnabled = !!window._ejsas?.[appId];
                }
                if (isEnabled) {
                    performanceMarkFeature('NgEventReplay');
                }
                return isEnabled;
            },
        },
        {
            provide: ENVIRONMENT_INITIALIZER,
            useValue: () => {
                const injector = inject(Injector);
                if (isPlatformBrowser(injector) && shouldEnableEventReplay(injector)) {
                    setStashFn((rEl, eventName, listenerFn) => {
                        sharedStashFunction(rEl, eventName, listenerFn);
                        jsactionSet.add(rEl);
                    });
                }
            },
            multi: true,
        },
        {
            provide: APP_BOOTSTRAP_LISTENER,
            useFactory: () => {
                if (isPlatformBrowser()) {
                    const injector = inject(Injector);
                    const appRef = inject(ApplicationRef);
                    return () => {
                        if (!shouldEnableEventReplay(injector)) {
                            return;
                        }
                        // Kick off event replay logic once hydration for the initial part
                        // of the application is completed. This timing is similar to the unclaimed
                        // dehydrated views cleanup timing.
                        whenStable(appRef).then(() => {
                            const eventContractDetails = injector.get(JSACTION_EVENT_CONTRACT);
                            initEventReplay(eventContractDetails, injector);
                            jsactionSet.forEach(removeListeners);
                            // After hydration, we shouldn't need to do anymore work related to
                            // event replay anymore.
                            setStashFn(() => { });
                        });
                    };
                }
                return () => { }; // noop for the server code
            },
            multi: true,
        },
    ];
}
const initEventReplay = (eventDelegation, injector) => {
    const appId = injector.get(APP_ID);
    // This is set in packages/platform-server/src/utils.ts
    const earlyJsactionData = window._ejsas[appId];
    const eventContract = (eventDelegation.instance = new EventContract(new EventContractContainer(earlyJsactionData.c)));
    for (const et of earlyJsactionData.et) {
        eventContract.addEvent(et);
    }
    for (const et of earlyJsactionData.etc) {
        eventContract.addEvent(et);
    }
    const eventInfos = getAppScopedQueuedEventInfos(appId);
    eventContract.replayEarlyEventInfos(eventInfos);
    clearAppScopedEarlyEventContract(appId);
    const dispatcher = new EventDispatcher(invokeRegisteredListeners);
    registerDispatcher(eventContract, dispatcher);
};
/**
 * Extracts information about all DOM events (added in a template) registered on elements in a give
 * LView. Maps collected events to a corresponding DOM element (an element is used as a key).
 */
export function collectDomEventsInfo(tView, lView, eventTypesToReplay) {
    const domEventsInfo = new Map();
    const lCleanup = lView[CLEANUP];
    const tCleanup = tView.cleanup;
    if (!tCleanup || !lCleanup) {
        return domEventsInfo;
    }
    for (let i = 0; i < tCleanup.length;) {
        const firstParam = tCleanup[i++];
        const secondParam = tCleanup[i++];
        if (typeof firstParam !== 'string') {
            continue;
        }
        const eventType = firstParam;
        if (!isEarlyEventType(eventType)) {
            continue;
        }
        if (isCaptureEventType(eventType)) {
            eventTypesToReplay.capture.add(eventType);
        }
        else {
            eventTypesToReplay.regular.add(eventType);
        }
        const listenerElement = unwrapRNode(lView[secondParam]);
        i++; // move the cursor to the next position (location of the listener idx)
        const useCaptureOrIndx = tCleanup[i++];
        // if useCaptureOrIndx is boolean then report it as is.
        // if useCaptureOrIndx is positive number then it in unsubscribe method
        // if useCaptureOrIndx is negative number then it is a Subscription
        const isDomEvent = typeof useCaptureOrIndx === 'boolean' || useCaptureOrIndx >= 0;
        if (!isDomEvent) {
            continue;
        }
        if (!domEventsInfo.has(listenerElement)) {
            domEventsInfo.set(listenerElement, [eventType]);
        }
        else {
            domEventsInfo.get(listenerElement).push(eventType);
        }
    }
    return domEventsInfo;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXZlbnRfcmVwbGF5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvaHlkcmF0aW9uL2V2ZW50X3JlcGxheS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQ0wsZ0JBQWdCLEVBQ2hCLGtCQUFrQixFQUNsQixzQkFBc0IsRUFDdEIsYUFBYSxFQUNiLGVBQWUsRUFDZixrQkFBa0IsRUFDbEIsNEJBQTRCLEVBQzVCLGdDQUFnQyxHQUNqQyxNQUFNLHlDQUF5QyxDQUFDO0FBRWpELE9BQU8sRUFBQyxzQkFBc0IsRUFBRSxjQUFjLEVBQUUsVUFBVSxFQUFDLE1BQU0sZ0NBQWdDLENBQUM7QUFDbEcsT0FBTyxFQUFDLHVCQUF1QixFQUFFLFFBQVEsRUFBQyxNQUFNLE9BQU8sQ0FBQztBQUN4RCxPQUFPLEVBQUMsTUFBTSxFQUFDLE1BQU0sOEJBQThCLENBQUM7QUFFcEQsT0FBTyxFQUFDLFVBQVUsRUFBQyxNQUFNLGtDQUFrQyxDQUFDO0FBRTVELE9BQU8sRUFBQyxPQUFPLEVBQWUsTUFBTSw0QkFBNEIsQ0FBQztBQUNqRSxPQUFPLEVBQUMsaUJBQWlCLEVBQUMsTUFBTSw0QkFBNEIsQ0FBQztBQUM3RCxPQUFPLEVBQUMsV0FBVyxFQUFDLE1BQU0sNEJBQTRCLENBQUM7QUFFdkQsT0FBTyxFQUNMLDRCQUE0QixFQUM1Qix1QkFBdUIsRUFDdkIsa0NBQWtDLEdBQ25DLE1BQU0sVUFBVSxDQUFDO0FBQ2xCLE9BQU8sRUFDTCxtQkFBbUIsRUFDbkIsZUFBZSxFQUNmLHlCQUF5QixFQUV6Qix1QkFBdUIsR0FDeEIsTUFBTSwyQkFBMkIsQ0FBQztBQUNuQyxPQUFPLEVBQUMsTUFBTSxFQUFDLE1BQU0sbUNBQW1DLENBQUM7QUFDekQsT0FBTyxFQUFDLHNCQUFzQixFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFFM0Q7O0dBRUc7QUFDSCxNQUFNLFdB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U0FBUyxJQUFJLGdCQUFnQixJQUFJLENBQUMsQ0FBQztRQUNsRixJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7WUFDaEIsU0FBUztRQUNYLENBQUM7UUFDRCxJQUFJLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxlQUFlLENBQUMsRUFBRSxDQUFDO1lBQ3hDLGFBQWEsQ0FBQyxHQUFHLENBQUMsZUFBZSxFQUFFLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQztRQUNsRCxDQUFDO2FBQU0sQ0FBQztZQUNOLGFBQWEsQ0FBQyxHQUFHLENBQUMsZUFBZSxDQUFFLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQ3RELENBQUM7SUFDSCxDQUFDO0lBQ0QsT0FBTyxhQUFhLENBQUM7QUFDdkIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmRldi9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtcbiAgaXNFYXJseUV2ZW50VHlwZSxcbiAgaXNDYXB0dXJlRXZlbnRUeXBlLFxuICBFdmVudENvbnRyYWN0Q29udGFpbmVyLFxuICBFdmVudENvbnRyYWN0LFxuICBFdmVudERpc3BhdGNoZXIsXG4gIHJlZ2lzdGVyRGlzcGF0Y2hlcixcbiAgZ2V0QXBwU2NvcGVkUXVldWVkRXZlbnRJbmZvcyxcbiAgY2xlYXJBcHBTY29wZWRFYXJseUV2ZW50Q29udHJhY3QsXG59IGZyb20gJ0Bhbmd1bGFyL2NvcmUvcHJpbWl0aXZlcy9ldmVudC1kaXNwYXRjaCc7XG5cbmltcG9ydCB7QVBQX0JPT1RTVFJBUF9MSVNURU5FUiwgQXBwbGljYXRpb25SZWYsIHdoZW5TdGFibGV9IGZyb20gJy4uL2FwcGxpY2F0aW9uL2FwcGxpY2F0aW9uX3JlZic7XG5pbXBvcnQge0VOVklST05NRU5UX0lOSVRJQUxJWkVSLCBJbmplY3Rvcn0gZnJvbSAnLi4vZGknO1xuaW1wb3J0IHtpbmplY3R9IGZyb20gJy4uL2RpL2luamVjdG9yX2NvbXBhdGliaWxpdHknO1xuaW1wb3J0IHtQcm92aWRlcn0gZnJvbSAnLi4vZGkvaW50ZXJmYWNlL3Byb3ZpZGVyJztcbmltcG9ydCB7c2V0U3Rhc2hGbn0gZnJvbSAnLi4vcmVuZGVyMy9pbnN0cnVjdGlvbnMvbGlzdGVuZXInO1xuaW1wb3J0IHtSRWxlbWVudH0gZnJvbSAnLi4vcmVuZGVyMy9pbnRlcmZhY2VzL3JlbmRlcmVyX2RvbSc7XG5pbXBvcnQge0NMRUFOVVAsIExWaWV3LCBUVmlld30gZnJvbSAnLi4vcmVuZGVyMy9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHtpc1BsYXRmb3JtQnJvd3Nlcn0gZnJvbSAnLi4vcmVuZGVyMy91dGlsL21pc2NfdXRpbHMnO1xuaW1wb3J0IHt1bndyYXBSTm9kZX0gZnJvbSAnLi4vcmVuZGVyMy91dGlsL3ZpZXdfdXRpbHMnO1xuXG5pbXBvcnQge1xuICBFVkVOVF9SRVBMQVlfRU5BQkxFRF9ERUZBVUxULFxuICBJU19FVkVOVF9SRVBMQVlfRU5BQkxFRCxcbiAgSVNfR0xPQkFMX0VWRU5UX0RFTEVHQVRJT05fRU5BQkxFRCxcbn0gZnJvbSAnLi90b2tlbnMnO1xuaW1wb3J0IHtcbiAgc2hhcmVkU3Rhc2hGdW5jdGlvbixcbiAgcmVtb3ZlTGlzdGVuZXJzLFxuICBpbnZva2VSZWdpc3RlcmVkTGlzdGVuZXJzLFxuICBFdmVudENvbnRyYWN0RGV0YWlscyxcbiAgSlNBQ1RJT05fRVZFTlRfQ09OVFJBQ1QsXG59IGZyb20gJy4uL2V2ZW50X2RlbGVnYXRpb25fdXRpbHMnO1xuaW1wb3J0IHtBUFBfSUR9IGZyb20gJy4uL2FwcGxpY2F0aW9uL2FwcGxpY2F0aW9uX3Rva2Vucyc7XG5pbXBvcnQge3BlcmZvcm1hbmNlTWFya0ZlYXR1cmV9IGZyb20gJy4uL3V0aWwvcGVyZm9ybWFuY2UnO1xuXG4vKipcbiAqIEEgc2V0IG9mIERPTSBlbGVtZW50cyB3aXRoIGBqc2FjdGlvbmAgYXR0cmlidXRlcy5cbiAqL1xuY29uc3QganNhY3Rpb25TZXQgPSBuZXcgU2V0PEVsZW1lbnQ+KCk7XG5cbmZ1bmN0aW9uIGlzR2xvYmFsRXZlbnREZWxlZ2F0aW9uRW5hYmxlZChpbmplY3RvcjogSW5qZWN0b3IpIHtcbiAgcmV0dXJuIGluamVjdG9yLmdldChJU19HTE9CQUxfRVZFTlRfREVMRUdBVElPTl9FTkFCTEVELCBmYWxzZSk7XG59XG5cbi8qKlxuICogRGV0ZXJtaW5lcyB3aGV0aGVyIEV2ZW50IFJlcGxheSBmZWF0dXJlIHNob3VsZCBiZSBhY3RpdmF0ZWQgb24gdGhlIGNsaWVudC5cbiAqL1xuZnVuY3Rpb24gc2hvdWxkRW5hYmxlRXZlbnRSZXBsYXkoaW5qZWN0b3I6IEluamVjdG9yKSB7XG4gIHJldHVybiAoXG4gICAgaW5qZWN0b3IuZ2V0KElTX0VWRU5UX1JFUExBWV9FTkFCTEVELCBFVkVOVF9SRVBMQVlfRU5BQkxFRF9ERUZBVUxUKSAmJlxuICAgICFpc0dsb2JhbEV2ZW50RGVsZWdhdGlvbkVuYWJsZWQoaW5qZWN0b3IpXG4gICk7XG59XG5cbi8qKlxuICogUmV0dXJucyBhIHNldCBvZiBwcm92aWRlcnMgcmVxdWlyZWQgdG8gc2V0dXAgc3VwcG9ydCBmb3IgZXZlbnQgcmVwbGF5LlxuICogUmVxdWlyZXMgaHlkcmF0aW9uIHRvIGJlIGVuYWJsZWQgc2VwYXJhdGVseS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHdpdGhFdmVudFJlcGxheSgpOiBQcm92aWRlcltdIHtcbiAgcmV0dXJuIFtcbiAgICB7XG4gICAgICBwcm92aWRlOiBJU19FVkVOVF9SRVBMQVlfRU5BQkxFRCxcbiAgICAgIHVzZUZhY3Rvcnk6ICgpID0+IHtcbiAgICAgICAgbGV0IGlzRW5hYmxlZCA9IHRydWU7XG4gICAgICAgIGlmIChpc1BsYXRmb3JtQnJvd3NlcigpKSB7XG4gICAgICAgICAgLy8gTm90ZTogZ2xvYmFsVGhpc1tDT05UUkFDVF9QUk9QRVJUWV0gbWF5IGJlIHVuZGVmaW5lZCBpbiBjYXNlIEV2ZW50IFJlcGxheSBmZWF0dXJlXG4gICAgICAgICAgLy8gaXMgZW5hYmxlZCwgYnV0IHRoZXJlIGFyZSBubyBldmVudHMgY29uZmlndXJlZCBpbiB0aGlzIGFwcGxpY2F0aW9uLCBpbiB3aGljaCBjYXNlXG4gICAgICAgICAgLy8gd2UgZG9uJ3QgYWN0aXZhdGUgdGhpcyBmZWF0dXJlLCBzaW5jZSB0aGVyZSBhcmUgbm8gZXZlbnRzIHRvIHJlcGxheS5cbiAgICAgICAgICBjb25zdCBhcHBJZCA9IGluamVjdChBUFBfSUQpO1xuICAgICAgICAgIGlzRW5hYmxlZCA9ICEhd2luZG93Ll9lanNhcz8uW2FwcElkXTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoaXNFbmFibGVkKSB7XG4gICAgICAgICAgcGVyZm9ybWFuY2VNYXJrRmVhdHVyZSgnTmdFdmVudFJlcGxheScpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBpc0VuYWJsZWQ7XG4gICAgICB9LFxuICAgIH0sXG4gICAge1xuICAgICAgcHJvdmlkZTogRU5WSVJPTk1FTlRfSU5JVElBTElaRVIsXG4gICAgICB1c2VWYWx1ZTogKCkgPT4ge1xuICAgICAgICBjb25zdCBpbmplY3RvciA9IGluamVjdChJbmplY3Rvcik7XG4gICAgICAgIGlmIChpc1BsYXRmb3JtQnJvd3NlcihpbmplY3RvcikgJiYgc2hvdWxkRW5hYmxlRXZlbnRSZXBsYXkoaW5qZWN0b3IpKSB7XG4gICAgICAgICAgc2V0U3Rhc2hGbigockVsOiBSRWxlbWVudCwgZXZlbnROYW1lOiBzdHJpbmcsIGxpc3RlbmVyRm46IFZvaWRGdW5jdGlvbikgPT4ge1xuICAgICAgICAgICAgc2hhcmVkU3Rhc2hGdW5jdGlvbihyRWwsIGV2ZW50TmFtZSwgbGlzdGVuZXJGbik7XG4gICAgICAgICAgICBqc2FjdGlvblNldC5hZGQockVsIGFzIHVua25vd24gYXMgRWxlbWVudCk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBtdWx0aTogdHJ1ZSxcbiAgICB9LFxuICAgIHtcbiAgICAgIHByb3ZpZGU6IEFQUF9CT09UU1RSQVBfTElTVEVORVIsXG4gICAgICB1c2VGYWN0b3J5OiAoKSA9PiB7XG4gICAgICAgIGlmIChpc1BsYXRmb3JtQnJvd3NlcigpKSB7XG4gICAgICAgICAgY29uc3QgaW5qZWN0b3IgPSBpbmplY3QoSW5qZWN0b3IpO1xuICAgICAgICAgIGNvbnN0IGFwcFJlZiA9IGluamVjdChBcHBsaWNhdGlvblJlZik7XG4gICAgICAgICAgcmV0dXJuICgpID0+IHtcbiAgICAgICAgICAgIGlmICghc2hvdWxkRW5hYmxlRXZlbnRSZXBsYXkoaW5qZWN0b3IpKSB7XG4gICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gS2ljayBvZmYgZXZlbnQgcmVwbGF5IGxvZ2ljIG9uY2UgaHlkcmF0aW9uIGZvciB0aGUgaW5pdGlhbCBwYXJ0XG4gICAgICAgICAgICAvLyBvZiB0aGUgYXBwbGljYXRpb24gaXMgY29tcGxldGVkLiBUaGlzIHRpbWluZyBpcyBzaW1pbGFyIHRvIHRoZSB1bmNsYWltZWRcbiAgICAgICAgICAgIC8vIGRlaHlkcmF0ZWQgdmlld3MgY2xlYW51cCB0aW1pbmcuXG4gICAgICAgICAgICB3aGVuU3RhYmxlKGFwcFJlZikudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgIGNvbnN0IGV2ZW50Q29udHJhY3REZXRhaWxzID0gaW5qZWN0b3IuZ2V0KEpTQUNUSU9OX0VWRU5UX0NPTlRSQUNUKTtcbiAgICAgICAgICAgICAgaW5pdEV2ZW50UmVwbGF5KGV2ZW50Q29udHJhY3REZXRhaWxzLCBpbmplY3Rvcik7XG4gICAgICAgICAgICAgIGpzYWN0aW9uU2V0LmZvckVhY2gocmVtb3ZlTGlzdGVuZXJzKTtcbiAgICAgICAgICAgICAgLy8gQWZ0ZXIgaHlkcmF0aW9uLCB3ZSBzaG91bGRuJ3QgbmVlZCB0byBkbyBhbnltb3JlIHdvcmsgcmVsYXRlZCB0b1xuICAgICAgICAgICAgICAvLyBldmVudCByZXBsYXkgYW55bW9yZS5cbiAgICAgICAgICAgICAgc2V0U3Rhc2hGbigoKSA9PiB7fSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAoKSA9PiB7fTsgLy8gbm9vcCBmb3IgdGhlIHNlcnZlciBjb2RlXG4gICAgICB9LFxuICAgICAgbXVsdGk6IHRydWUsXG4gICAgfSxcbiAgXTtcbn1cblxuY29uc3QgaW5pdEV2ZW50UmVwbGF5ID0gKGV2ZW50RGVsZWdhdGlvbjogRXZlbnRDb250cmFjdERldGFpbHMsIGluamVjdG9yOiBJbmplY3RvcikgPT4ge1xuICBjb25zdCBhcHBJZCA9IGluamVjdG9yLmdldChBUFBfSUQpO1xuICAvLyBUaGlzIGlzIHNldCBpbiBwYWNrYWdlcy9wbGF0Zm9ybS1zZXJ2ZXIvc3JjL3V0aWxzLnRzXG4gIGNvbnN0IGVhcmx5SnNhY3Rpb25EYXRhID0gd2luZG93Ll9lanNhcyFbYXBwSWRdITtcbiAgY29uc3QgZXZlbnRDb250cmFjdCA9IChldmVudERlbGVnYXRpb24uaW5zdGFuY2UgPSBuZXcgRXZlbnRDb250cmFjdChcbiAgICBuZXcgRXZlbnRDb250cmFjdENvbnRhaW5lcihlYXJseUpzYWN0aW9uRGF0YS5jKSxcbiAgKSk7XG4gIGZvciAoY29uc3QgZXQgb2YgZWFybHlKc2FjdGlvbkRhdGEuZXQpIHtcbiAgICBldmVudENvbnRyYWN0LmFkZEV2ZW50KGV0KTtcbiAgfVxuICBmb3IgKGNvbnN0IGV0IG9mIGVhcmx5SnNhY3Rpb25EYXRhLmV0Yykge1xuICAgIGV2ZW50Q29udHJhY3QuYWRkRXZlbnQoZXQpO1xuICB9XG4gIGNvbnN0IGV2ZW50SW5mb3MgPSBnZXRBcHBTY29wZWRRdWV1ZWRFdmVudEluZm9zKGFwcElkKTtcbiAgZXZlbnRDb250cmFjdC5yZXBsYXlFYXJseUV2ZW50SW5mb3MoZXZlbnRJbmZvcyk7XG4gIGNsZWFyQXBwU2NvcGVkRWFybHlFdmVudENvbnRyYWN0KGFwcElkKTtcbiAgY29uc3QgZGlzcGF0Y2hlciA9IG5ldyBFdmVudERpc3BhdGNoZXIoaW52b2tlUmVnaXN0ZXJlZExpc3RlbmVycyk7XG4gIHJlZ2lzdGVyRGlzcGF0Y2hlcihldmVudENvbnRyYWN0LCBkaXNwYXRjaGVyKTtcbn07XG5cbi8qKlxuICogRXh0cmFjdHMgaW5mb3JtYXRpb24gYWJvdXQgYWxsIERPTSBldmVudHMgKGFkZGVkIGluIGEgdGVtcGxhdGUpIHJlZ2lzdGVyZWQgb24gZWxlbWVudHMgaW4gYSBnaXZlXG4gKiBMVmlldy4gTWFwcyBjb2xsZWN0ZWQgZXZlbnRzIHRvIGEgY29ycmVzcG9uZGluZyBET00gZWxlbWVudCAoYW4gZWxlbWVudCBpcyB1c2VkIGFzIGEga2V5KS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbGxlY3REb21FdmVudHNJbmZvKFxuICB0VmlldzogVFZpZXcsXG4gIGxWaWV3OiBMVmlldyxcbiAgZXZlbnRUeXBlc1RvUmVwbGF5OiB7cmVndWxhcjogU2V0PHN0cmluZz47IGNhcHR1cmU6IFNldDxzdHJpbmc+fSxcbik6IE1hcDxFbGVtZW50LCBzdHJpbmdbXT4ge1xuICBjb25zdCBkb21FdmVudHNJbmZvID0gbmV3IE1hcDxFbGVtZW50LCBzdHJpbmdbXT4oKTtcbiAgY29uc3QgbENsZWFudXAgPSBsVmlld1tDTEVBTlVQXTtcbiAgY29uc3QgdENsZWFudXAgPSB0Vmlldy5jbGVhbnVwO1xuICBpZiAoIXRDbGVhbnVwIHx8ICFsQ2xlYW51cCkge1xuICAgIHJldHVybiBkb21FdmVudHNJbmZvO1xuICB9XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgdENsZWFudXAubGVuZ3RoOyApIHtcbiAgICBjb25zdCBmaXJzdFBhcmFtID0gdENsZWFudXBbaSsrXTtcbiAgICBjb25zdCBzZWNvbmRQYXJhbSA9IHRDbGVhbnVwW2krK107XG4gICAgaWYgKHR5cGVvZiBmaXJzdFBhcmFtICE9PSAnc3RyaW5nJykge1xuICAgICAgY29udGludWU7XG4gICAgfVxuICAgIGNvbnN0IGV2ZW50VHlwZSA9IGZpcnN0UGFyYW07XG4gICAgaWYgKCFpc0Vhcmx5RXZlbnRUeXBlKGV2ZW50VHlwZSkpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICBpZiAoaXNDYXB0dXJlRXZlbnRUeXBlKGV2ZW50VHlwZSkpIHtcbiAgICAgIGV2ZW50VHlwZXNUb1JlcGxheS5jYXB0dXJlLmFkZChldmVudFR5cGUpO1xuICAgIH0gZWxzZSB7XG4gICAgICBldmVudFR5cGVzVG9SZXBsYXkucmVndWxhci5hZGQoZXZlbnRUeXBlKTtcbiAgICB9XG4gICAgY29uc3QgbGlzdGVuZXJFbGVtZW50ID0gdW53cmFwUk5vZGUobFZpZXdbc2Vjb25kUGFyYW1dKSBhcyBhbnkgYXMgRWxlbWVudDtcbiAgICBpKys7IC8vIG1vdmUgdGhlIGN1cnNvciB0byB0aGUgbmV4dCBwb3NpdGlvbiAobG9jYXRpb24gb2YgdGhlIGxpc3RlbmVyIGlkeClcbiAgICBjb25zdCB1c2VDYXB0dXJlT3JJbmR4ID0gdENsZWFudXBbaSsrXTtcbiAgICAvLyBpZiB1c2VDYXB0dXJlT3JJbmR4IGlzIGJvb2xlYW4gdGhlbiByZXBvcnQgaXQgYXMgaXMuXG4gICAgLy8gaWYgdXNlQ2FwdHVyZU9ySW5keCBpcyBwb3NpdGl2ZSBudW1iZXIgdGhlbiBpdCBpbiB1bnN1YnNjcmliZSBtZXRob2RcbiAgICAvLyBpZiB1c2VDYXB0dXJlT3JJbmR4IGlzIG5lZ2F0aXZlIG51bWJlciB0aGVuIGl0IGlzIGEgU3Vic2NyaXB0aW9uXG4gICAgY29uc3QgaXNEb21FdmVudCA9IHR5cGVvZiB1c2VDYXB0dXJlT3JJbmR4ID09PSAnYm9vbGVhbicgfHwgdXNlQ2FwdHVyZU9ySW5keCA+PSAwO1xuICAgIGlmICghaXNEb21FdmVudCkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuICAgIGlmICghZG9tRXZlbnRzSW5mby5oYXMobGlzdGVuZXJFbGVtZW50KSkge1xuICAgICAgZG9tRXZlbnRzSW5mby5zZXQobGlzdGVuZXJFbGVtZW50LCBbZXZlbnRUeXBlXSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGRvbUV2ZW50c0luZm8uZ2V0KGxpc3RlbmVyRWxlbWVudCkhLnB1c2goZXZlbnRUeXBlKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGRvbUV2ZW50c0luZm87XG59XG4iXX0=