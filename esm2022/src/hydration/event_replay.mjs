/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { isSupportedEvent, isCaptureEvent, EventContractContainer, EventContract, EventDispatcher, registerDispatcher, } from '@angular/core/primitives/event-dispatch';
import { APP_BOOTSTRAP_LISTENER, ApplicationRef, whenStable } from '../application/application_ref';
import { ENVIRONMENT_INITIALIZER, Injector } from '../di';
import { inject } from '../di/injector_compatibility';
import { setStashFn } from '../render3/instructions/listener';
import { CLEANUP } from '../render3/interfaces/view';
import { isPlatformBrowser } from '../render3/util/misc_utils';
import { unwrapRNode } from '../render3/util/view_utils';
import { IS_EVENT_REPLAY_ENABLED, IS_GLOBAL_EVENT_DELEGATION_ENABLED } from './tokens';
import { GlobalEventDelegation, sharedStashFunction, removeListeners, invokeRegisteredListeners, } from '../event_delegation_utils';
import { APP_ID } from '../application/application_tokens';
export const CONTRACT_PROPERTY = 'ngContracts';
/**
 * A set of DOM elements with `jsaction` attributes.
 */
const jsactionSet = new Set();
function isGlobalEventDelegationEnabled(injector) {
    return injector.get(IS_GLOBAL_EVENT_DELEGATION_ENABLED, false);
}
/**
 * Returns a set of providers required to setup support for event replay.
 * Requires hydration to be enabled separately.
 */
export function withEventReplay() {
    return [
        {
            provide: IS_EVENT_REPLAY_ENABLED,
            useValue: true,
        },
        {
            provide: ENVIRONMENT_INITIALIZER,
            useValue: () => {
                const injector = inject(Injector);
                if (isGlobalEventDelegationEnabled(injector)) {
                    return;
                }
                setStashFn((rEl, eventName, listenerFn) => {
                    sharedStashFunction(rEl, eventName, listenerFn);
                    jsactionSet.add(rEl);
                });
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
                        // Kick off event replay logic once hydration for the initial part
                        // of the application is completed. This timing is similar to the unclaimed
                        // dehydrated views cleanup timing.
                        whenStable(appRef).then(() => {
                            if (isGlobalEventDelegationEnabled(injector)) {
                                return;
                            }
                            const globalEventDelegation = injector.get(GlobalEventDelegation);
                            initEventReplay(globalEventDelegation, injector);
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
// TODO: Upstream this back into event-dispatch.
function getJsactionData(container) {
    return container._ejsa;
}
const initEventReplay = (eventDelegation, injector) => {
    const appId = injector.get(APP_ID);
    // This is set in packages/platform-server/src/utils.ts
    // Note: globalThis[CONTRACT_PROPERTY] may be undefined in case Event Replay feature
    // is enabled, but there are no events configured in an application.
    const container = globalThis[CONTRACT_PROPERTY]?.[appId];
    const earlyJsactionData = getJsactionData(container);
    const eventContract = (eventDelegation.eventContract = new EventContract(new EventContractContainer(earlyJsactionData.c), 
    /* useActionResolver= */ false));
    for (const et of earlyJsactionData.et) {
        eventContract.addEvent(et);
    }
    for (const et of earlyJsactionData.etc) {
        eventContract.addEvent(et);
    }
    eventContract.replayEarlyEvents(container);
    const dispatcher = new EventDispatcher(invokeRegisteredListeners);
    registerDispatcher(eventContract, dispatcher);
};
/**
 * Extracts information about all DOM events (added in a template) registered on elements in a give
 * LView. Maps collected events to a corresponding DOM element (an element is used as a key).
 */
export function collectDomEventsInfo(tView, lView, eventTypesToReplay) {
    const events = new Map();
    const lCleanup = lView[CLEANUP];
    const tCleanup = tView.cleanup;
    if (!tCleanup || !lCleanup) {
        return events;
    }
    for (let i = 0; i < tCleanup.length;) {
        const firstParam = tCleanup[i++];
        const secondParam = tCleanup[i++];
        if (typeof firstParam !== 'string') {
            continue;
        }
        const name = firstParam;
        if (!isSupportedEvent(name)) {
            continue;
        }
        if (isCaptureEvent(name)) {
            eventTypesToReplay.capture.add(name);
        }
        else {
            eventTypesToReplay.regular.add(name);
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
        if (!events.has(listenerElement)) {
            events.set(listenerElement, [name]);
        }
        else {
            events.get(listenerElement).push(name);
        }
    }
    return events;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXZlbnRfcmVwbGF5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvaHlkcmF0aW9uL2V2ZW50X3JlcGxheS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQ0wsZ0JBQWdCLEVBQ2hCLGNBQWMsRUFDZCxzQkFBc0IsRUFDdEIsYUFBYSxFQUNiLGVBQWUsRUFDZixrQkFBa0IsR0FFbkIsTUFBTSx5Q0FBeUMsQ0FBQztBQUVqRCxPQUFPLEVBQUMsc0JBQXNCLEVBQUUsY0FBYyxFQUFFLFVBQVUsRUFBQyxNQUFNLGdDQUFnQyxDQUFDO0FBQ2xHLE9BQU8sRUFBQyx1QkFBdUIsRUFBRSxRQUFRLEVBQUMsTUFBTSxPQUFPLENBQUM7QUFDeEQsT0FBTyxFQUFDLE1BQU0sRUFBQyxNQUFNLDhCQUE4QixDQUFDO0FBRXBELE9BQU8sRUFBQyxVQUFVLEVBQUMsTUFBTSxrQ0FBa0MsQ0FBQztBQUU1RCxPQUFPLEVBQUMsT0FBTyxFQUFlLE1BQU0sNEJBQTRCLENBQUM7QUFDakUsT0FBTyxFQUFDLGlCQUFpQixFQUFDLE1BQU0sNEJBQTRCLENBQUM7QUFDN0QsT0FBTyxFQUFDLFdBQVcsRUFBQyxNQUFNLDRCQUE0QixDQUFDO0FBRXZELE9BQU8sRUFBQyx1QkFBdUIsRUFBRSxrQ0FBa0MsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUNyRixPQUFPLEVBQ0wscUJBQXFCLEVBQ3JCLG1CQUFtQixFQUNuQixlQUFlLEVBQ2YseUJBQXlCLEdBQzFCLE1BQU0sMkJBQTJCLENBQUM7QUFDbkMsT0FBTyxFQUFDLE1BQU0sRUFBQyxNQUFNLG1DQUFtQyxDQUFDO0FBTXpELE1BQU0sQ0FBQyxNQUFNLGlCQUFpQixHQUFHLGFBQWEsQ0FBQztBQUUvQzs7R0FFRztBQUNILE1BQU0sV0FBVyxHQUFHLElBQUksR0FBRyxFQUFXLENBQUM7QUFFdkMsU0FBUyw4QkFBOEIs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QyxJQUFJLENBQUMsRUFBRSxDQUFDO1lBQzVCLFNBQVM7UUFDWCxDQUFDO1FBQ0QsSUFBSSxjQUFjLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztZQUN6QixrQkFBa0IsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3ZDLENBQUM7YUFBTSxDQUFDO1lBQ04sa0JBQWtCLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUN2QyxDQUFDO1FBQ0QsTUFBTSxlQUFlLEdBQUcsV0FBVyxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsQ0FBbUIsQ0FBQztRQUMxRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLHNFQUFzRTtRQUMzRSxNQUFNLGdCQUFnQixHQUFHLFFBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQ3ZDLHVEQUF1RDtRQUN2RCx1RUFBdUU7UUFDdkUsbUVBQW1FO1FBQ25FLE1BQU0sVUFBVSxHQUFHLE9BQU8sZ0JBQWdCLEtBQUssU0FBUyxJQUFJLGdCQUFnQixJQUFJLENBQUMsQ0FBQztRQUNsRixJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7WUFDaEIsU0FBUztRQUNYLENBQUM7UUFDRCxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxlQUFlLENBQUMsRUFBRSxDQUFDO1lBQ2pDLE1BQU0sQ0FBQyxHQUFHLENBQUMsZUFBZSxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztRQUN0QyxDQUFDO2FBQU0sQ0FBQztZQUNOLE1BQU0sQ0FBQyxHQUFHLENBQUMsZUFBZSxDQUFFLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzFDLENBQUM7SUFDSCxDQUFDO0lBQ0QsT0FBTyxNQUFNLENBQUM7QUFDaEIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1xuICBpc1N1cHBvcnRlZEV2ZW50LFxuICBpc0NhcHR1cmVFdmVudCxcbiAgRXZlbnRDb250cmFjdENvbnRhaW5lcixcbiAgRXZlbnRDb250cmFjdCxcbiAgRXZlbnREaXNwYXRjaGVyLFxuICByZWdpc3RlckRpc3BhdGNoZXIsXG4gIEVhcmx5SnNhY3Rpb25EYXRhQ29udGFpbmVyLFxufSBmcm9tICdAYW5ndWxhci9jb3JlL3ByaW1pdGl2ZXMvZXZlbnQtZGlzcGF0Y2gnO1xuXG5pbXBvcnQge0FQUF9CT09UU1RSQVBfTElTVEVORVIsIEFwcGxpY2F0aW9uUmVmLCB3aGVuU3RhYmxlfSBmcm9tICcuLi9hcHBsaWNhdGlvbi9hcHBsaWNhdGlvbl9yZWYnO1xuaW1wb3J0IHtFTlZJUk9OTUVOVF9JTklUSUFMSVpFUiwgSW5qZWN0b3J9IGZyb20gJy4uL2RpJztcbmltcG9ydCB7aW5qZWN0fSBmcm9tICcuLi9kaS9pbmplY3Rvcl9jb21wYXRpYmlsaXR5JztcbmltcG9ydCB7UHJvdmlkZXJ9IGZyb20gJy4uL2RpL2ludGVyZmFjZS9wcm92aWRlcic7XG5pbXBvcnQge3NldFN0YXNoRm59IGZyb20gJy4uL3JlbmRlcjMvaW5zdHJ1Y3Rpb25zL2xpc3RlbmVyJztcbmltcG9ydCB7UkVsZW1lbnR9IGZyb20gJy4uL3JlbmRlcjMvaW50ZXJmYWNlcy9yZW5kZXJlcl9kb20nO1xuaW1wb3J0IHtDTEVBTlVQLCBMVmlldywgVFZpZXd9IGZyb20gJy4uL3JlbmRlcjMvaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7aXNQbGF0Zm9ybUJyb3dzZXJ9IGZyb20gJy4uL3JlbmRlcjMvdXRpbC9taXNjX3V0aWxzJztcbmltcG9ydCB7dW53cmFwUk5vZGV9IGZyb20gJy4uL3JlbmRlcjMvdXRpbC92aWV3X3V0aWxzJztcblxuaW1wb3J0IHtJU19FVkVOVF9SRVBMQVlfRU5BQkxFRCwgSVNfR0xPQkFMX0VWRU5UX0RFTEVHQVRJT05fRU5BQkxFRH0gZnJvbSAnLi90b2tlbnMnO1xuaW1wb3J0IHtcbiAgR2xvYmFsRXZlbnREZWxlZ2F0aW9uLFxuICBzaGFyZWRTdGFzaEZ1bmN0aW9uLFxuICByZW1vdmVMaXN0ZW5lcnMsXG4gIGludm9rZVJlZ2lzdGVyZWRMaXN0ZW5lcnMsXG59IGZyb20gJy4uL2V2ZW50X2RlbGVnYXRpb25fdXRpbHMnO1xuaW1wb3J0IHtBUFBfSUR9IGZyb20gJy4uL2FwcGxpY2F0aW9uL2FwcGxpY2F0aW9uX3Rva2Vucyc7XG5cbmRlY2xhcmUgZ2xvYmFsIHtcbiAgdmFyIG5nQ29udHJhY3RzOiB7W2tleTogc3RyaW5nXTogRWFybHlKc2FjdGlvbkRhdGFDb250YWluZXJ9O1xufVxuXG5leHBvcnQgY29uc3QgQ09OVFJBQ1RfUFJPUEVSVFkgPSAnbmdDb250cmFjdHMnO1xuXG4vKipcbiAqIEEgc2V0IG9mIERPTSBlbGVtZW50cyB3aXRoIGBqc2FjdGlvbmAgYXR0cmlidXRlcy5cbiAqL1xuY29uc3QganNhY3Rpb25TZXQgPSBuZXcgU2V0PEVsZW1lbnQ+KCk7XG5cbmZ1bmN0aW9uIGlzR2xvYmFsRXZlbnREZWxlZ2F0aW9uRW5hYmxlZChpbmplY3RvcjogSW5qZWN0b3IpIHtcbiAgcmV0dXJuIGluamVjdG9yLmdldChJU19HTE9CQUxfRVZFTlRfREVMRUdBVElPTl9FTkFCTEVELCBmYWxzZSk7XG59XG5cbi8qKlxuICogUmV0dXJucyBhIHNldCBvZiBwcm92aWRlcnMgcmVxdWlyZWQgdG8gc2V0dXAgc3VwcG9ydCBmb3IgZXZlbnQgcmVwbGF5LlxuICogUmVxdWlyZXMgaHlkcmF0aW9uIHRvIGJlIGVuYWJsZWQgc2VwYXJhdGVseS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHdpdGhFdmVudFJlcGxheSgpOiBQcm92aWRlcltdIHtcbiAgcmV0dXJuIFtcbiAgICB7XG4gICAgICBwcm92aWRlOiBJU19FVkVOVF9SRVBMQVlfRU5BQkxFRCxcbiAgICAgIHVzZVZhbHVlOiB0cnVlLFxuICAgIH0sXG4gICAge1xuICAgICAgcHJvdmlkZTogRU5WSVJPTk1FTlRfSU5JVElBTElaRVIsXG4gICAgICB1c2VWYWx1ZTogKCkgPT4ge1xuICAgICAgICBjb25zdCBpbmplY3RvciA9IGluamVjdChJbmplY3Rvcik7XG4gICAgICAgIGlmIChpc0dsb2JhbEV2ZW50RGVsZWdhdGlvbkVuYWJsZWQoaW5qZWN0b3IpKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHNldFN0YXNoRm4oKHJFbDogUkVsZW1lbnQsIGV2ZW50TmFtZTogc3RyaW5nLCBsaXN0ZW5lckZuOiBWb2lkRnVuY3Rpb24pID0+IHtcbiAgICAgICAgICBzaGFyZWRTdGFzaEZ1bmN0aW9uKHJFbCwgZXZlbnROYW1lLCBsaXN0ZW5lckZuKTtcbiAgICAgICAgICBqc2FjdGlvblNldC5hZGQockVsIGFzIHVua25vd24gYXMgRWxlbWVudCk7XG4gICAgICAgIH0pO1xuICAgICAgfSxcbiAgICAgIG11bHRpOiB0cnVlLFxuICAgIH0sXG4gICAge1xuICAgICAgcHJvdmlkZTogQVBQX0JPT1RTVFJBUF9MSVNURU5FUixcbiAgICAgIHVzZUZhY3Rvcnk6ICgpID0+IHtcbiAgICAgICAgaWYgKGlzUGxhdGZvcm1Ccm93c2VyKCkpIHtcbiAgICAgICAgICBjb25zdCBpbmplY3RvciA9IGluamVjdChJbmplY3Rvcik7XG4gICAgICAgICAgY29uc3QgYXBwUmVmID0gaW5qZWN0KEFwcGxpY2F0aW9uUmVmKTtcbiAgICAgICAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgICAgICAgLy8gS2ljayBvZmYgZXZlbnQgcmVwbGF5IGxvZ2ljIG9uY2UgaHlkcmF0aW9uIGZvciB0aGUgaW5pdGlhbCBwYXJ0XG4gICAgICAgICAgICAvLyBvZiB0aGUgYXBwbGljYXRpb24gaXMgY29tcGxldGVkLiBUaGlzIHRpbWluZyBpcyBzaW1pbGFyIHRvIHRoZSB1bmNsYWltZWRcbiAgICAgICAgICAgIC8vIGRlaHlkcmF0ZWQgdmlld3MgY2xlYW51cCB0aW1pbmcuXG4gICAgICAgICAgICB3aGVuU3RhYmxlKGFwcFJlZikudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgIGlmIChpc0dsb2JhbEV2ZW50RGVsZWdhdGlvbkVuYWJsZWQoaW5qZWN0b3IpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGNvbnN0IGdsb2JhbEV2ZW50RGVsZWdhdGlvbiA9IGluamVjdG9yLmdldChHbG9iYWxFdmVudERlbGVnYXRpb24pO1xuICAgICAgICAgICAgICBpbml0RXZlbnRSZXBsYXkoZ2xvYmFsRXZlbnREZWxlZ2F0aW9uLCBpbmplY3Rvcik7XG4gICAgICAgICAgICAgIGpzYWN0aW9uU2V0LmZvckVhY2gocmVtb3ZlTGlzdGVuZXJzKTtcbiAgICAgICAgICAgICAgLy8gQWZ0ZXIgaHlkcmF0aW9uLCB3ZSBzaG91bGRuJ3QgbmVlZCB0byBkbyBhbnltb3JlIHdvcmsgcmVsYXRlZCB0b1xuICAgICAgICAgICAgICAvLyBldmVudCByZXBsYXkgYW55bW9yZS5cbiAgICAgICAgICAgICAgc2V0U3Rhc2hGbigoKSA9PiB7fSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAoKSA9PiB7fTsgLy8gbm9vcCBmb3IgdGhlIHNlcnZlciBjb2RlXG4gICAgICB9LFxuICAgICAgbXVsdGk6IHRydWUsXG4gICAgfSxcbiAgXTtcbn1cblxuLy8gVE9ETzogVXBzdHJlYW0gdGhpcyBiYWNrIGludG8gZXZlbnQtZGlzcGF0Y2guXG5mdW5jdGlvbiBnZXRKc2FjdGlvbkRhdGEoY29udGFpbmVyOiBFYXJseUpzYWN0aW9uRGF0YUNvbnRhaW5lcikge1xuICByZXR1cm4gY29udGFpbmVyLl9lanNhO1xufVxuXG5jb25zdCBpbml0RXZlbnRSZXBsYXkgPSAoZXZlbnREZWxlZ2F0aW9uOiBHbG9iYWxFdmVudERlbGVnYXRpb24sIGluamVjdG9yOiBJbmplY3RvcikgPT4ge1xuICBjb25zdCBhcHBJZCA9IGluamVjdG9yLmdldChBUFBfSUQpO1xuICAvLyBUaGlzIGlzIHNldCBpbiBwYWNrYWdlcy9wbGF0Zm9ybS1zZXJ2ZXIvc3JjL3V0aWxzLnRzXG4gIC8vIE5vdGU6IGdsb2JhbFRoaXNbQ09OVFJBQ1RfUFJPUEVSVFldIG1heSBiZSB1bmRlZmluZWQgaW4gY2FzZSBFdmVudCBSZXBsYXkgZmVhdHVyZVxuICAvLyBpcyBlbmFibGVkLCBidXQgdGhlcmUgYXJlIG5vIGV2ZW50cyBjb25maWd1cmVkIGluIGFuIGFwcGxpY2F0aW9uLlxuICBjb25zdCBjb250YWluZXIgPSBnbG9iYWxUaGlzW0NPTlRSQUNUX1BST1BFUlRZXT8uW2FwcElkXTtcbiAgY29uc3QgZWFybHlKc2FjdGlvbkRhdGEgPSBnZXRKc2FjdGlvbkRhdGEoY29udGFpbmVyKSE7XG4gIGNvbnN0IGV2ZW50Q29udHJhY3QgPSAoZXZlbnREZWxlZ2F0aW9uLmV2ZW50Q29udHJhY3QgPSBuZXcgRXZlbnRDb250cmFjdChcbiAgICBuZXcgRXZlbnRDb250cmFjdENvbnRhaW5lcihlYXJseUpzYWN0aW9uRGF0YS5jKSxcbiAgICAvKiB1c2VBY3Rpb25SZXNvbHZlcj0gKi8gZmFsc2UsXG4gICkpO1xuICBmb3IgKGNvbnN0IGV0IG9mIGVhcmx5SnNhY3Rpb25EYXRhLmV0KSB7XG4gICAgZXZlbnRDb250cmFjdC5hZGRFdmVudChldCk7XG4gIH1cbiAgZm9yIChjb25zdCBldCBvZiBlYXJseUpzYWN0aW9uRGF0YS5ldGMpIHtcbiAgICBldmVudENvbnRyYWN0LmFkZEV2ZW50KGV0KTtcbiAgfVxuICBldmVudENvbnRyYWN0LnJlcGxheUVhcmx5RXZlbnRzKGNvbnRhaW5lcik7XG4gIGNvbnN0IGRpc3BhdGNoZXIgPSBuZXcgRXZlbnREaXNwYXRjaGVyKGludm9rZVJlZ2lzdGVyZWRMaXN0ZW5lcnMpO1xuICByZWdpc3RlckRpc3BhdGNoZXIoZXZlbnRDb250cmFjdCwgZGlzcGF0Y2hlcik7XG59O1xuXG4vKipcbiAqIEV4dHJhY3RzIGluZm9ybWF0aW9uIGFib3V0IGFsbCBET00gZXZlbnRzIChhZGRlZCBpbiBhIHRlbXBsYXRlKSByZWdpc3RlcmVkIG9uIGVsZW1lbnRzIGluIGEgZ2l2ZVxuICogTFZpZXcuIE1hcHMgY29sbGVjdGVkIGV2ZW50cyB0byBhIGNvcnJlc3BvbmRpbmcgRE9NIGVsZW1lbnQgKGFuIGVsZW1lbnQgaXMgdXNlZCBhcyBhIGtleSkuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb2xsZWN0RG9tRXZlbnRzSW5mbyhcbiAgdFZpZXc6IFRWaWV3LFxuICBsVmlldzogTFZpZXcsXG4gIGV2ZW50VHlwZXNUb1JlcGxheToge3JlZ3VsYXI6IFNldDxzdHJpbmc+OyBjYXB0dXJlOiBTZXQ8c3RyaW5nPn0sXG4pOiBNYXA8RWxlbWVudCwgc3RyaW5nW10+IHtcbiAgY29uc3QgZXZlbnRzID0gbmV3IE1hcDxFbGVtZW50LCBzdHJpbmdbXT4oKTtcbiAgY29uc3QgbENsZWFudXAgPSBsVmlld1tDTEVBTlVQXTtcbiAgY29uc3QgdENsZWFudXAgPSB0Vmlldy5jbGVhbnVwO1xuICBpZiAoIXRDbGVhbnVwIHx8ICFsQ2xlYW51cCkge1xuICAgIHJldHVybiBldmVudHM7XG4gIH1cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCB0Q2xlYW51cC5sZW5ndGg7ICkge1xuICAgIGNvbnN0IGZpcnN0UGFyYW0gPSB0Q2xlYW51cFtpKytdO1xuICAgIGNvbnN0IHNlY29uZFBhcmFtID0gdENsZWFudXBbaSsrXTtcbiAgICBpZiAodHlwZW9mIGZpcnN0UGFyYW0gIT09ICdzdHJpbmcnKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgY29uc3QgbmFtZTogc3RyaW5nID0gZmlyc3RQYXJhbTtcbiAgICBpZiAoIWlzU3VwcG9ydGVkRXZlbnQobmFtZSkpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICBpZiAoaXNDYXB0dXJlRXZlbnQobmFtZSkpIHtcbiAgICAgIGV2ZW50VHlwZXNUb1JlcGxheS5jYXB0dXJlLmFkZChuYW1lKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZXZlbnRUeXBlc1RvUmVwbGF5LnJlZ3VsYXIuYWRkKG5hbWUpO1xuICAgIH1cbiAgICBjb25zdCBsaXN0ZW5lckVsZW1lbnQgPSB1bndyYXBSTm9kZShsVmlld1tzZWNvbmRQYXJhbV0pIGFzIGFueSBhcyBFbGVtZW50O1xuICAgIGkrKzsgLy8gbW92ZSB0aGUgY3Vyc29yIHRvIHRoZSBuZXh0IHBvc2l0aW9uIChsb2NhdGlvbiBvZiB0aGUgbGlzdGVuZXIgaWR4KVxuICAgIGNvbnN0IHVzZUNhcHR1cmVPckluZHggPSB0Q2xlYW51cFtpKytdO1xuICAgIC8vIGlmIHVzZUNhcHR1cmVPckluZHggaXMgYm9vbGVhbiB0aGVuIHJlcG9ydCBpdCBhcyBpcy5cbiAgICAvLyBpZiB1c2VDYXB0dXJlT3JJbmR4IGlzIHBvc2l0aXZlIG51bWJlciB0aGVuIGl0IGluIHVuc3Vic2NyaWJlIG1ldGhvZFxuICAgIC8vIGlmIHVzZUNhcHR1cmVPckluZHggaXMgbmVnYXRpdmUgbnVtYmVyIHRoZW4gaXQgaXMgYSBTdWJzY3JpcHRpb25cbiAgICBjb25zdCBpc0RvbUV2ZW50ID0gdHlwZW9mIHVzZUNhcHR1cmVPckluZHggPT09ICdib29sZWFuJyB8fCB1c2VDYXB0dXJlT3JJbmR4ID49IDA7XG4gICAgaWYgKCFpc0RvbUV2ZW50KSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgaWYgKCFldmVudHMuaGFzKGxpc3RlbmVyRWxlbWVudCkpIHtcbiAgICAgIGV2ZW50cy5zZXQobGlzdGVuZXJFbGVtZW50LCBbbmFtZV0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBldmVudHMuZ2V0KGxpc3RlbmVyRWxlbWVudCkhLnB1c2gobmFtZSk7XG4gICAgfVxuICB9XG4gIHJldHVybiBldmVudHM7XG59XG4iXX0=