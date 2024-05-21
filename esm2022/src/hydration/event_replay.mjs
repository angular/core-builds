/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Dispatcher, EventContract, EventContractContainer, registerDispatcher, } from '@angular/core/primitives/event-dispatch';
import { APP_BOOTSTRAP_LISTENER, ApplicationRef, whenStable } from '../application/application_ref';
import { APP_ID } from '../application/application_tokens';
import { ENVIRONMENT_INITIALIZER, Injector } from '../di';
import { inject } from '../di/injector_compatibility';
import { setDisableEventReplayImpl } from '../render3/instructions/listener';
import { CLEANUP } from '../render3/interfaces/view';
import { isPlatformBrowser } from '../render3/util/misc_utils';
import { unwrapRNode } from '../render3/util/view_utils';
import { IS_EVENT_REPLAY_ENABLED } from './tokens';
export const EVENT_REPLAY_ENABLED_DEFAULT = false;
export const CONTRACT_PROPERTY = 'ngContracts';
// TODO: Upstream this back into event-dispatch.
function getJsactionData(container) {
    return container._ejsa;
}
const JSACTION_ATTRIBUTE = 'jsaction';
/**
 * Associates a DOM element with `jsaction` attribute to a map that contains info about all event
 * types (event names) and corresponding listeners.
 */
const jsactionMap = new Map();
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
                setDisableEventReplayImpl((rEl, eventName, listenerFn) => {
                    if (rEl.hasAttribute(JSACTION_ATTRIBUTE)) {
                        const el = rEl;
                        // We don't immediately remove the attribute here because
                        // we need it for replay that happens after hydration.
                        if (!jsactionMap.has(el)) {
                            jsactionMap.set(el, new Map());
                        }
                        const eventMap = jsactionMap.get(el);
                        if (!eventMap.has(eventName)) {
                            eventMap.set(eventName, []);
                        }
                        eventMap.get(eventName).push(listenerFn);
                    }
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
                            const appId = injector.get(APP_ID);
                            // This is set in packages/platform-server/src/utils.ts
                            // Note: globalThis[CONTRACT_PROPERTY] may be undefined in case Event Replay feature
                            // is enabled, but there are no events configured in an application.
                            const container = globalThis[CONTRACT_PROPERTY]?.[appId];
                            const earlyJsactionData = getJsactionData(container);
                            if (earlyJsactionData) {
                                const eventContract = new EventContract(new EventContractContainer(earlyJsactionData.c));
                                for (const et of earlyJsactionData.et) {
                                    eventContract.addEvent(et);
                                }
                                for (const et of earlyJsactionData.etc) {
                                    eventContract.addEvent(et);
                                }
                                eventContract.replayEarlyEvents(container);
                                const dispatcher = new Dispatcher(() => { }, {
                                    eventReplayer: (queue) => {
                                        for (const event of queue) {
                                            handleEvent(event);
                                        }
                                        jsactionMap.clear();
                                        queue.length = 0;
                                    },
                                });
                                registerDispatcher(eventContract, dispatcher);
                                for (const el of jsactionMap.keys()) {
                                    el.removeAttribute(JSACTION_ATTRIBUTE);
                                }
                            }
                        });
                    };
                }
                return () => { }; // noop for the server code
            },
            multi: true,
        },
    ];
}
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
        if (name === 'mouseenter' ||
            name === 'mouseleave' ||
            name === 'pointerenter' ||
            name === 'pointerleave') {
            continue;
        }
        eventTypesToReplay.add(name);
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
export function setJSActionAttribute(tNode, rNode, nativeElementToEvents) {
    if (tNode.type & 2 /* TNodeType.Element */) {
        const nativeElement = unwrapRNode(rNode);
        const events = nativeElementToEvents.get(nativeElement) ?? [];
        const parts = events.map((event) => `${event}:`);
        if (parts.length > 0) {
            nativeElement.setAttribute(JSACTION_ATTRIBUTE, parts.join(';'));
        }
    }
}
function handleEvent(event) {
    const nativeElement = event.getAction().element;
    const handlerFns = jsactionMap.get(nativeElement)?.get(event.getEventType());
    if (!handlerFns) {
        return;
    }
    for (const handler of handlerFns) {
        handler(event.getEvent());
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXZlbnRfcmVwbGF5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvaHlkcmF0aW9uL2V2ZW50X3JlcGxheS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQ0wsVUFBVSxFQUVWLGFBQWEsRUFDYixzQkFBc0IsRUFFdEIsa0JBQWtCLEdBQ25CLE1BQU0seUNBQXlDLENBQUM7QUFFakQsT0FBTyxFQUFDLHNCQUFzQixFQUFFLGNBQWMsRUFBRSxVQUFVLEVBQUMsTUFBTSxnQ0FBZ0MsQ0FBQztBQUNsRyxPQUFPLEVBQUMsTUFBTSxFQUFDLE1BQU0sbUNBQW1DLENBQUM7QUFDekQsT0FBTyxFQUFDLHVCQUF1QixFQUFFLFFBQVEsRUFBQyxNQUFNLE9BQU8sQ0FBQztBQUN4RCxPQUFPLEVBQUMsTUFBTSxFQUFDLE1BQU0sOEJBQThCLENBQUM7QUFFcEQsT0FBTyxFQUFDLHlCQUF5QixFQUFDLE1BQU0sa0NBQWtDLENBQUM7QUFHM0UsT0FBTyxFQUFDLE9BQU8sRUFBZSxNQUFNLDRCQUE0QixDQUFDO0FBQ2pFLE9BQU8sRUFBQyxpQkFBaUIsRUFBQyxNQUFNLDRCQUE0QixDQUFDO0FBQzdELE9BQU8sRUFBQyxXQUFXLEVBQUMsTUFBTSw0QkFBNEIsQ0FBQztBQUV2RCxPQUFPLEVBQUMsdUJBQXVCLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFFakQsTUFBTSxDQUFDLE1BQU0sNEJBQTRCLEdBQUcsS0FBSyxDQUFDO0FBQ2xELE1BQU0sQ0FBQyxNQUFNLGlCQUFpQixHQUFHLGFBQWEsQ0FBQztBQU0vQyxnREFBZ0Q7QUFDaEQsU0FBUyxlQUFlLENBQUMsU0FBcUM7SUFDNUQsT0FBTyxTQUFTLENBQUMsS0FBSyxDQUFDO0FBQ3pCLENBQUM7QUFFRCxNQUFNLGtCQUFrQixHQUFHLFVBQVUsQ0FBQztBQUV0Qzs7O0dBR0c7QUFDSCxNQUFNLFdBQVcs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N0MsSUFBSSxLQUFLLENBQUMsSUFBSSw0QkFBb0IsRUFBRSxDQUFDO1FBQ25DLE1BQU0sYUFBYSxHQUFHLFdBQVcsQ0FBQyxLQUFLLENBQVksQ0FBQztRQUNwRCxNQUFNLE1BQU0sR0FBRyxxQkFBcUIsQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUFDLElBQUksRUFBRSxDQUFDO1FBQzlELE1BQU0sS0FBSyxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLEdBQUcsS0FBSyxHQUFHLENBQUMsQ0FBQztRQUNqRCxJQUFJLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUM7WUFDckIsYUFBYSxDQUFDLFlBQVksQ0FBQyxrQkFBa0IsRUFBRSxLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDbEUsQ0FBQztJQUNILENBQUM7QUFDSCxDQUFDO0FBRUQsU0FBUyxXQUFXLENBQUMsS0FBdUI7SUFDMUMsTUFBTSxhQUFhLEdBQUcsS0FBSyxDQUFDLFNBQVMsRUFBRyxDQUFDLE9BQWtCLENBQUM7SUFDNUQsTUFBTSxVQUFVLEdBQUcsV0FBVyxDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUMsRUFBRSxHQUFHLENBQUMsS0FBSyxDQUFDLFlBQVksRUFBRSxDQUFDLENBQUM7SUFDN0UsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO1FBQ2hCLE9BQU87SUFDVCxDQUFDO0lBQ0QsS0FBSyxNQUFNLE9BQU8sSUFBSSxVQUFVLEVBQUUsQ0FBQztRQUNqQyxPQUFPLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7SUFDNUIsQ0FBQztBQUNILENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtcbiAgRGlzcGF0Y2hlcixcbiAgRWFybHlKc2FjdGlvbkRhdGFDb250YWluZXIsXG4gIEV2ZW50Q29udHJhY3QsXG4gIEV2ZW50Q29udHJhY3RDb250YWluZXIsXG4gIEV2ZW50SW5mb1dyYXBwZXIsXG4gIHJlZ2lzdGVyRGlzcGF0Y2hlcixcbn0gZnJvbSAnQGFuZ3VsYXIvY29yZS9wcmltaXRpdmVzL2V2ZW50LWRpc3BhdGNoJztcblxuaW1wb3J0IHtBUFBfQk9PVFNUUkFQX0xJU1RFTkVSLCBBcHBsaWNhdGlvblJlZiwgd2hlblN0YWJsZX0gZnJvbSAnLi4vYXBwbGljYXRpb24vYXBwbGljYXRpb25fcmVmJztcbmltcG9ydCB7QVBQX0lEfSBmcm9tICcuLi9hcHBsaWNhdGlvbi9hcHBsaWNhdGlvbl90b2tlbnMnO1xuaW1wb3J0IHtFTlZJUk9OTUVOVF9JTklUSUFMSVpFUiwgSW5qZWN0b3J9IGZyb20gJy4uL2RpJztcbmltcG9ydCB7aW5qZWN0fSBmcm9tICcuLi9kaS9pbmplY3Rvcl9jb21wYXRpYmlsaXR5JztcbmltcG9ydCB7UHJvdmlkZXJ9IGZyb20gJy4uL2RpL2ludGVyZmFjZS9wcm92aWRlcic7XG5pbXBvcnQge3NldERpc2FibGVFdmVudFJlcGxheUltcGx9IGZyb20gJy4uL3JlbmRlcjMvaW5zdHJ1Y3Rpb25zL2xpc3RlbmVyJztcbmltcG9ydCB7VE5vZGUsIFROb2RlVHlwZX0gZnJvbSAnLi4vcmVuZGVyMy9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtSRWxlbWVudCwgUk5vZGV9IGZyb20gJy4uL3JlbmRlcjMvaW50ZXJmYWNlcy9yZW5kZXJlcl9kb20nO1xuaW1wb3J0IHtDTEVBTlVQLCBMVmlldywgVFZpZXd9IGZyb20gJy4uL3JlbmRlcjMvaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7aXNQbGF0Zm9ybUJyb3dzZXJ9IGZyb20gJy4uL3JlbmRlcjMvdXRpbC9taXNjX3V0aWxzJztcbmltcG9ydCB7dW53cmFwUk5vZGV9IGZyb20gJy4uL3JlbmRlcjMvdXRpbC92aWV3X3V0aWxzJztcblxuaW1wb3J0IHtJU19FVkVOVF9SRVBMQVlfRU5BQkxFRH0gZnJvbSAnLi90b2tlbnMnO1xuXG5leHBvcnQgY29uc3QgRVZFTlRfUkVQTEFZX0VOQUJMRURfREVGQVVMVCA9IGZhbHNlO1xuZXhwb3J0IGNvbnN0IENPTlRSQUNUX1BST1BFUlRZID0gJ25nQ29udHJhY3RzJztcblxuZGVjbGFyZSBnbG9iYWwge1xuICB2YXIgbmdDb250cmFjdHM6IHtba2V5OiBzdHJpbmddOiBFYXJseUpzYWN0aW9uRGF0YUNvbnRhaW5lcn07XG59XG5cbi8vIFRPRE86IFVwc3RyZWFtIHRoaXMgYmFjayBpbnRvIGV2ZW50LWRpc3BhdGNoLlxuZnVuY3Rpb24gZ2V0SnNhY3Rpb25EYXRhKGNvbnRhaW5lcjogRWFybHlKc2FjdGlvbkRhdGFDb250YWluZXIpIHtcbiAgcmV0dXJuIGNvbnRhaW5lci5fZWpzYTtcbn1cblxuY29uc3QgSlNBQ1RJT05fQVRUUklCVVRFID0gJ2pzYWN0aW9uJztcblxuLyoqXG4gKiBBc3NvY2lhdGVzIGEgRE9NIGVsZW1lbnQgd2l0aCBganNhY3Rpb25gIGF0dHJpYnV0ZSB0byBhIG1hcCB0aGF0IGNvbnRhaW5zIGluZm8gYWJvdXQgYWxsIGV2ZW50XG4gKiB0eXBlcyAoZXZlbnQgbmFtZXMpIGFuZCBjb3JyZXNwb25kaW5nIGxpc3RlbmVycy5cbiAqL1xuY29uc3QganNhY3Rpb25NYXA6IE1hcDxFbGVtZW50LCBNYXA8c3RyaW5nLCBGdW5jdGlvbltdPj4gPSBuZXcgTWFwKCk7XG5cbi8qKlxuICogUmV0dXJucyBhIHNldCBvZiBwcm92aWRlcnMgcmVxdWlyZWQgdG8gc2V0dXAgc3VwcG9ydCBmb3IgZXZlbnQgcmVwbGF5LlxuICogUmVxdWlyZXMgaHlkcmF0aW9uIHRvIGJlIGVuYWJsZWQgc2VwYXJhdGVseS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHdpdGhFdmVudFJlcGxheSgpOiBQcm92aWRlcltdIHtcbiAgcmV0dXJuIFtcbiAgICB7XG4gICAgICBwcm92aWRlOiBJU19FVkVOVF9SRVBMQVlfRU5BQkxFRCxcbiAgICAgIHVzZVZhbHVlOiB0cnVlLFxuICAgIH0sXG4gICAge1xuICAgICAgcHJvdmlkZTogRU5WSVJPTk1FTlRfSU5JVElBTElaRVIsXG4gICAgICB1c2VWYWx1ZTogKCkgPT4ge1xuICAgICAgICBzZXREaXNhYmxlRXZlbnRSZXBsYXlJbXBsKChyRWw6IFJFbGVtZW50LCBldmVudE5hbWU6IHN0cmluZywgbGlzdGVuZXJGbjogVm9pZEZ1bmN0aW9uKSA9PiB7XG4gICAgICAgICAgaWYgKHJFbC5oYXNBdHRyaWJ1dGUoSlNBQ1RJT05fQVRUUklCVVRFKSkge1xuICAgICAgICAgICAgY29uc3QgZWwgPSByRWwgYXMgdW5rbm93biBhcyBFbGVtZW50O1xuICAgICAgICAgICAgLy8gV2UgZG9uJ3QgaW1tZWRpYXRlbHkgcmVtb3ZlIHRoZSBhdHRyaWJ1dGUgaGVyZSBiZWNhdXNlXG4gICAgICAgICAgICAvLyB3ZSBuZWVkIGl0IGZvciByZXBsYXkgdGhhdCBoYXBwZW5zIGFmdGVyIGh5ZHJhdGlvbi5cbiAgICAgICAgICAgIGlmICghanNhY3Rpb25NYXAuaGFzKGVsKSkge1xuICAgICAgICAgICAgICBqc2FjdGlvbk1hcC5zZXQoZWwsIG5ldyBNYXAoKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBldmVudE1hcCA9IGpzYWN0aW9uTWFwLmdldChlbCkhO1xuICAgICAgICAgICAgaWYgKCFldmVudE1hcC5oYXMoZXZlbnROYW1lKSkge1xuICAgICAgICAgICAgICBldmVudE1hcC5zZXQoZXZlbnROYW1lLCBbXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBldmVudE1hcC5nZXQoZXZlbnROYW1lKSEucHVzaChsaXN0ZW5lckZuKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSxcbiAgICAgIG11bHRpOiB0cnVlLFxuICAgIH0sXG4gICAge1xuICAgICAgcHJvdmlkZTogQVBQX0JPT1RTVFJBUF9MSVNURU5FUixcbiAgICAgIHVzZUZhY3Rvcnk6ICgpID0+IHtcbiAgICAgICAgaWYgKGlzUGxhdGZvcm1Ccm93c2VyKCkpIHtcbiAgICAgICAgICBjb25zdCBpbmplY3RvciA9IGluamVjdChJbmplY3Rvcik7XG4gICAgICAgICAgY29uc3QgYXBwUmVmID0gaW5qZWN0KEFwcGxpY2F0aW9uUmVmKTtcbiAgICAgICAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgICAgICAgLy8gS2ljayBvZmYgZXZlbnQgcmVwbGF5IGxvZ2ljIG9uY2UgaHlkcmF0aW9uIGZvciB0aGUgaW5pdGlhbCBwYXJ0XG4gICAgICAgICAgICAvLyBvZiB0aGUgYXBwbGljYXRpb24gaXMgY29tcGxldGVkLiBUaGlzIHRpbWluZyBpcyBzaW1pbGFyIHRvIHRoZSB1bmNsYWltZWRcbiAgICAgICAgICAgIC8vIGRlaHlkcmF0ZWQgdmlld3MgY2xlYW51cCB0aW1pbmcuXG4gICAgICAgICAgICB3aGVuU3RhYmxlKGFwcFJlZikudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgIGNvbnN0IGFwcElkID0gaW5qZWN0b3IuZ2V0KEFQUF9JRCk7XG4gICAgICAgICAgICAgIC8vIFRoaXMgaXMgc2V0IGluIHBhY2thZ2VzL3BsYXRmb3JtLXNlcnZlci9zcmMvdXRpbHMudHNcbiAgICAgICAgICAgICAgLy8gTm90ZTogZ2xvYmFsVGhpc1tDT05UUkFDVF9QUk9QRVJUWV0gbWF5IGJlIHVuZGVmaW5lZCBpbiBjYXNlIEV2ZW50IFJlcGxheSBmZWF0dXJlXG4gICAgICAgICAgICAgIC8vIGlzIGVuYWJsZWQsIGJ1dCB0aGVyZSBhcmUgbm8gZXZlbnRzIGNvbmZpZ3VyZWQgaW4gYW4gYXBwbGljYXRpb24uXG4gICAgICAgICAgICAgIGNvbnN0IGNvbnRhaW5lciA9IGdsb2JhbFRoaXNbQ09OVFJBQ1RfUFJPUEVSVFldPy5bYXBwSWRdO1xuICAgICAgICAgICAgICBjb25zdCBlYXJseUpzYWN0aW9uRGF0YSA9IGdldEpzYWN0aW9uRGF0YShjb250YWluZXIpO1xuICAgICAgICAgICAgICBpZiAoZWFybHlKc2FjdGlvbkRhdGEpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBldmVudENvbnRyYWN0ID0gbmV3IEV2ZW50Q29udHJhY3QoXG4gICAgICAgICAgICAgICAgICBuZXcgRXZlbnRDb250cmFjdENvbnRhaW5lcihlYXJseUpzYWN0aW9uRGF0YS5jKSxcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIGZvciAoY29uc3QgZXQgb2YgZWFybHlKc2FjdGlvbkRhdGEuZXQpIHtcbiAgICAgICAgICAgICAgICAgIGV2ZW50Q29udHJhY3QuYWRkRXZlbnQoZXQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IGV0IG9mIGVhcmx5SnNhY3Rpb25EYXRhLmV0Yykge1xuICAgICAgICAgICAgICAgICAgZXZlbnRDb250cmFjdC5hZGRFdmVudChldCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGV2ZW50Q29udHJhY3QucmVwbGF5RWFybHlFdmVudHMoY29udGFpbmVyKTtcbiAgICAgICAgICAgICAgICBjb25zdCBkaXNwYXRjaGVyID0gbmV3IERpc3BhdGNoZXIoKCkgPT4ge30sIHtcbiAgICAgICAgICAgICAgICAgIGV2ZW50UmVwbGF5ZXI6IChxdWV1ZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IGV2ZW50IG9mIHF1ZXVlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgaGFuZGxlRXZlbnQoZXZlbnQpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGpzYWN0aW9uTWFwLmNsZWFyKCk7XG4gICAgICAgICAgICAgICAgICAgIHF1ZXVlLmxlbmd0aCA9IDA7XG4gICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHJlZ2lzdGVyRGlzcGF0Y2hlcihldmVudENvbnRyYWN0LCBkaXNwYXRjaGVyKTtcbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IGVsIG9mIGpzYWN0aW9uTWFwLmtleXMoKSkge1xuICAgICAgICAgICAgICAgICAgZWwucmVtb3ZlQXR0cmlidXRlKEpTQUNUSU9OX0FUVFJJQlVURSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAoKSA9PiB7fTsgLy8gbm9vcCBmb3IgdGhlIHNlcnZlciBjb2RlXG4gICAgICB9LFxuICAgICAgbXVsdGk6IHRydWUsXG4gICAgfSxcbiAgXTtcbn1cblxuLyoqXG4gKiBFeHRyYWN0cyBpbmZvcm1hdGlvbiBhYm91dCBhbGwgRE9NIGV2ZW50cyAoYWRkZWQgaW4gYSB0ZW1wbGF0ZSkgcmVnaXN0ZXJlZCBvbiBlbGVtZW50cyBpbiBhIGdpdmVcbiAqIExWaWV3LiBNYXBzIGNvbGxlY3RlZCBldmVudHMgdG8gYSBjb3JyZXNwb25kaW5nIERPTSBlbGVtZW50IChhbiBlbGVtZW50IGlzIHVzZWQgYXMgYSBrZXkpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY29sbGVjdERvbUV2ZW50c0luZm8oXG4gIHRWaWV3OiBUVmlldyxcbiAgbFZpZXc6IExWaWV3LFxuICBldmVudFR5cGVzVG9SZXBsYXk6IFNldDxzdHJpbmc+LFxuKTogTWFwPEVsZW1lbnQsIHN0cmluZ1tdPiB7XG4gIGNvbnN0IGV2ZW50cyA9IG5ldyBNYXA8RWxlbWVudCwgc3RyaW5nW10+KCk7XG4gIGNvbnN0IGxDbGVhbnVwID0gbFZpZXdbQ0xFQU5VUF07XG4gIGNvbnN0IHRDbGVhbnVwID0gdFZpZXcuY2xlYW51cDtcbiAgaWYgKCF0Q2xlYW51cCB8fCAhbENsZWFudXApIHtcbiAgICByZXR1cm4gZXZlbnRzO1xuICB9XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgdENsZWFudXAubGVuZ3RoOyApIHtcbiAgICBjb25zdCBmaXJzdFBhcmFtID0gdENsZWFudXBbaSsrXTtcbiAgICBjb25zdCBzZWNvbmRQYXJhbSA9IHRDbGVhbnVwW2krK107XG4gICAgaWYgKHR5cGVvZiBmaXJzdFBhcmFtICE9PSAnc3RyaW5nJykge1xuICAgICAgY29udGludWU7XG4gICAgfVxuICAgIGNvbnN0IG5hbWU6IHN0cmluZyA9IGZpcnN0UGFyYW07XG4gICAgaWYgKFxuICAgICAgbmFtZSA9PT0gJ21vdXNlZW50ZXInIHx8XG4gICAgICBuYW1lID09PSAnbW91c2VsZWF2ZScgfHxcbiAgICAgIG5hbWUgPT09ICdwb2ludGVyZW50ZXInIHx8XG4gICAgICBuYW1lID09PSAncG9pbnRlcmxlYXZlJ1xuICAgICkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuICAgIGV2ZW50VHlwZXNUb1JlcGxheS5hZGQobmFtZSk7XG4gICAgY29uc3QgbGlzdGVuZXJFbGVtZW50ID0gdW53cmFwUk5vZGUobFZpZXdbc2Vjb25kUGFyYW1dKSBhcyBhbnkgYXMgRWxlbWVudDtcbiAgICBpKys7IC8vIG1vdmUgdGhlIGN1cnNvciB0byB0aGUgbmV4dCBwb3NpdGlvbiAobG9jYXRpb24gb2YgdGhlIGxpc3RlbmVyIGlkeClcbiAgICBjb25zdCB1c2VDYXB0dXJlT3JJbmR4ID0gdENsZWFudXBbaSsrXTtcbiAgICAvLyBpZiB1c2VDYXB0dXJlT3JJbmR4IGlzIGJvb2xlYW4gdGhlbiByZXBvcnQgaXQgYXMgaXMuXG4gICAgLy8gaWYgdXNlQ2FwdHVyZU9ySW5keCBpcyBwb3NpdGl2ZSBudW1iZXIgdGhlbiBpdCBpbiB1bnN1YnNjcmliZSBtZXRob2RcbiAgICAvLyBpZiB1c2VDYXB0dXJlT3JJbmR4IGlzIG5lZ2F0aXZlIG51bWJlciB0aGVuIGl0IGlzIGEgU3Vic2NyaXB0aW9uXG4gICAgY29uc3QgaXNEb21FdmVudCA9IHR5cGVvZiB1c2VDYXB0dXJlT3JJbmR4ID09PSAnYm9vbGVhbicgfHwgdXNlQ2FwdHVyZU9ySW5keCA+PSAwO1xuICAgIGlmICghaXNEb21FdmVudCkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuICAgIGlmICghZXZlbnRzLmhhcyhsaXN0ZW5lckVsZW1lbnQpKSB7XG4gICAgICBldmVudHMuc2V0KGxpc3RlbmVyRWxlbWVudCwgW25hbWVdKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZXZlbnRzLmdldChsaXN0ZW5lckVsZW1lbnQpIS5wdXNoKG5hbWUpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gZXZlbnRzO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2V0SlNBY3Rpb25BdHRyaWJ1dGUoXG4gIHROb2RlOiBUTm9kZSxcbiAgck5vZGU6IFJOb2RlLFxuICBuYXRpdmVFbGVtZW50VG9FdmVudHM6IE1hcDxFbGVtZW50LCBzdHJpbmdbXT4sXG4pIHtcbiAgaWYgKHROb2RlLnR5cGUgJiBUTm9kZVR5cGUuRWxlbWVudCkge1xuICAgIGNvbnN0IG5hdGl2ZUVsZW1lbnQgPSB1bndyYXBSTm9kZShyTm9kZSkgYXMgRWxlbWVudDtcbiAgICBjb25zdCBldmVudHMgPSBuYXRpdmVFbGVtZW50VG9FdmVudHMuZ2V0KG5hdGl2ZUVsZW1lbnQpID8/IFtdO1xuICAgIGNvbnN0IHBhcnRzID0gZXZlbnRzLm1hcCgoZXZlbnQpID0+IGAke2V2ZW50fTpgKTtcbiAgICBpZiAocGFydHMubGVuZ3RoID4gMCkge1xuICAgICAgbmF0aXZlRWxlbWVudC5zZXRBdHRyaWJ1dGUoSlNBQ1RJT05fQVRUUklCVVRFLCBwYXJ0cy5qb2luKCc7JykpO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBoYW5kbGVFdmVudChldmVudDogRXZlbnRJbmZvV3JhcHBlcikge1xuICBjb25zdCBuYXRpdmVFbGVtZW50ID0gZXZlbnQuZ2V0QWN0aW9uKCkhLmVsZW1lbnQgYXMgRWxlbWVudDtcbiAgY29uc3QgaGFuZGxlckZucyA9IGpzYWN0aW9uTWFwLmdldChuYXRpdmVFbGVtZW50KT8uZ2V0KGV2ZW50LmdldEV2ZW50VHlwZSgpKTtcbiAgaWYgKCFoYW5kbGVyRm5zKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIGZvciAoY29uc3QgaGFuZGxlciBvZiBoYW5kbGVyRm5zKSB7XG4gICAgaGFuZGxlcihldmVudC5nZXRFdmVudCgpKTtcbiAgfVxufVxuIl19