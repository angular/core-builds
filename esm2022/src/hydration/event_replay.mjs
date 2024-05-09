/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { BaseDispatcher, EventContract, EventContractContainer, registerDispatcher, } from '@angular/core/primitives/event-dispatch';
import { APP_BOOTSTRAP_LISTENER, ApplicationRef, whenStable } from '../application/application_ref';
import { APP_ID } from '../application/application_tokens';
import { ENVIRONMENT_INITIALIZER, Injector } from '../di';
import { inject } from '../di/injector_compatibility';
import { attachLViewId, readLView } from '../render3/context_discovery';
import { setDisableEventReplayImpl } from '../render3/instructions/listener';
import { CLEANUP, TVIEW } from '../render3/interfaces/view';
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
const removeJsactionQueue = [];
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
                setDisableEventReplayImpl((el) => {
                    if (el.hasAttribute(JSACTION_ATTRIBUTE)) {
                        // We don't immediately remove the attribute here because
                        // we need it for replay that happens after hydration.
                        removeJsactionQueue.push(el);
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
                                const dispatcher = new BaseDispatcher(() => { }, {
                                    eventReplayer: (queue) => {
                                        for (const event of queue) {
                                            handleEvent(event);
                                        }
                                        queue.length = 0;
                                    },
                                });
                                registerDispatcher(eventContract, dispatcher);
                                for (const el of removeJsactionQueue) {
                                    el.removeAttribute(JSACTION_ATTRIBUTE);
                                }
                                removeJsactionQueue.length = 0;
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
/**
 * Finds an LView that a given DOM element belongs to.
 */
function getLViewByElement(target) {
    let lView = readLView(target);
    if (lView) {
        return lView;
    }
    else {
        // If this node doesn't have LView info attached, then we need to
        // traverse upwards up the DOM to find the nearest element that
        // has already been monkey patched with data.
        let parent = target;
        while ((parent = parent.parentNode)) {
            lView = readLView(parent);
            if (lView) {
                // To prevent additional lookups, monkey-patch LView id onto this DOM node.
                // TODO: consider patching all parent nodes that didn't have LView id, so that
                // we can avoid lookups for more nodes.
                attachLViewId(target, lView);
                return lView;
            }
        }
    }
    return null;
}
function handleEvent(event) {
    const nativeElement = event.getAction().element;
    // Dispatch event via Angular's logic
    if (nativeElement) {
        const lView = getLViewByElement(nativeElement);
        if (lView !== null) {
            const tView = lView[TVIEW];
            const eventName = event.getEventType();
            const origEvent = event.getEvent();
            const listeners = getEventListeners(tView, lView, nativeElement, eventName);
            for (const listener of listeners) {
                listener(origEvent);
            }
        }
    }
}
function getEventListeners(tView, lView, nativeElement, eventName) {
    const listeners = [];
    const lCleanup = lView[CLEANUP];
    const tCleanup = tView.cleanup;
    if (tCleanup && lCleanup) {
        for (let i = 0; i < tCleanup.length;) {
            const storedEventName = tCleanup[i++];
            const nativeElementIndex = tCleanup[i++];
            if (typeof storedEventName === 'string') {
                const listenerElement = unwrapRNode(lView[nativeElementIndex]);
                const listener = lCleanup[tCleanup[i++]];
                i++; // increment to the next position;
                if (listenerElement === nativeElement && eventName === storedEventName) {
                    listeners.push(listener);
                }
            }
        }
    }
    return listeners;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXZlbnRfcmVwbGF5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvaHlkcmF0aW9uL2V2ZW50X3JlcGxheS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQ0wsY0FBYyxFQUVkLGFBQWEsRUFDYixzQkFBc0IsRUFFdEIsa0JBQWtCLEdBQ25CLE1BQU0seUNBQXlDLENBQUM7QUFFakQsT0FBTyxFQUFDLHNCQUFzQixFQUFFLGNBQWMsRUFBRSxVQUFVLEVBQUMsTUFBTSxnQ0FBZ0MsQ0FBQztBQUNsRyxPQUFPLEVBQUMsTUFBTSxFQUFDLE1BQU0sbUNBQW1DLENBQUM7QUFDekQsT0FBTyxFQUFDLHVCQUF1QixFQUFFLFFBQVEsRUFBQyxNQUFNLE9BQU8sQ0FBQztBQUN4RCxPQUFPLEVBQUMsTUFBTSxFQUFDLE1BQU0sOEJBQThCLENBQUM7QUFFcEQsT0FBTyxFQUFDLGFBQWEsRUFBRSxTQUFTLEVBQUMsTUFBTSw4QkFBOEIsQ0FBQztBQUN0RSxPQUFPLEVBQUMseUJBQXlCLEVBQUMsTUFBTSxrQ0FBa0MsQ0FBQztBQUczRSxPQUFPLEVBQUMsT0FBTyxFQUFTLEtBQUssRUFBUSxNQUFNLDRCQUE0QixDQUFDO0FBQ3hFLE9BQU8sRUFBQyxpQkFBaUIsRUFBQyxNQUFNLDRCQUE0QixDQUFDO0FBQzdELE9BQU8sRUFBQyxXQUFXLEVBQUMsTUFBTSw0QkFBNEIsQ0FBQztBQUV2RCxPQUFPLEVBQUMsdUJBQXVCLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFFakQsTUFBTSxDQUFDLE1BQU0sNEJBQTRCLEdBQUcsS0FBSyxDQUFDO0FBQ2xELE1BQU0sQ0FBQyxNQUFNLGlCQUFpQixHQUFHLGFBQWEsQ0FBQztBQU0vQyxnREFBZ0Q7QUFDaEQsU0FBUyxlQUFlLENBQUMsU0FBcUM7SUFDNUQsT0FBTyxTQUFTLENBQUMsS0FBSyxDQUFDO0FBQ3pCLENB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b2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7XG4gIEJhc2VEaXNwYXRjaGVyLFxuICBFYXJseUpzYWN0aW9uRGF0YUNvbnRhaW5lcixcbiAgRXZlbnRDb250cmFjdCxcbiAgRXZlbnRDb250cmFjdENvbnRhaW5lcixcbiAgRXZlbnRJbmZvV3JhcHBlcixcbiAgcmVnaXN0ZXJEaXNwYXRjaGVyLFxufSBmcm9tICdAYW5ndWxhci9jb3JlL3ByaW1pdGl2ZXMvZXZlbnQtZGlzcGF0Y2gnO1xuXG5pbXBvcnQge0FQUF9CT09UU1RSQVBfTElTVEVORVIsIEFwcGxpY2F0aW9uUmVmLCB3aGVuU3RhYmxlfSBmcm9tICcuLi9hcHBsaWNhdGlvbi9hcHBsaWNhdGlvbl9yZWYnO1xuaW1wb3J0IHtBUFBfSUR9IGZyb20gJy4uL2FwcGxpY2F0aW9uL2FwcGxpY2F0aW9uX3Rva2Vucyc7XG5pbXBvcnQge0VOVklST05NRU5UX0lOSVRJQUxJWkVSLCBJbmplY3Rvcn0gZnJvbSAnLi4vZGknO1xuaW1wb3J0IHtpbmplY3R9IGZyb20gJy4uL2RpL2luamVjdG9yX2NvbXBhdGliaWxpdHknO1xuaW1wb3J0IHtQcm92aWRlcn0gZnJvbSAnLi4vZGkvaW50ZXJmYWNlL3Byb3ZpZGVyJztcbmltcG9ydCB7YXR0YWNoTFZpZXdJZCwgcmVhZExWaWV3fSBmcm9tICcuLi9yZW5kZXIzL2NvbnRleHRfZGlzY292ZXJ5JztcbmltcG9ydCB7c2V0RGlzYWJsZUV2ZW50UmVwbGF5SW1wbH0gZnJvbSAnLi4vcmVuZGVyMy9pbnN0cnVjdGlvbnMvbGlzdGVuZXInO1xuaW1wb3J0IHtUTm9kZSwgVE5vZGVUeXBlfSBmcm9tICcuLi9yZW5kZXIzL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge1JFbGVtZW50LCBSTm9kZX0gZnJvbSAnLi4vcmVuZGVyMy9pbnRlcmZhY2VzL3JlbmRlcmVyX2RvbSc7XG5pbXBvcnQge0NMRUFOVVAsIExWaWV3LCBUVklFVywgVFZpZXd9IGZyb20gJy4uL3JlbmRlcjMvaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7aXNQbGF0Zm9ybUJyb3dzZXJ9IGZyb20gJy4uL3JlbmRlcjMvdXRpbC9taXNjX3V0aWxzJztcbmltcG9ydCB7dW53cmFwUk5vZGV9IGZyb20gJy4uL3JlbmRlcjMvdXRpbC92aWV3X3V0aWxzJztcblxuaW1wb3J0IHtJU19FVkVOVF9SRVBMQVlfRU5BQkxFRH0gZnJvbSAnLi90b2tlbnMnO1xuXG5leHBvcnQgY29uc3QgRVZFTlRfUkVQTEFZX0VOQUJMRURfREVGQVVMVCA9IGZhbHNlO1xuZXhwb3J0IGNvbnN0IENPTlRSQUNUX1BST1BFUlRZID0gJ25nQ29udHJhY3RzJztcblxuZGVjbGFyZSBnbG9iYWwge1xuICB2YXIgbmdDb250cmFjdHM6IHtba2V5OiBzdHJpbmddOiBFYXJseUpzYWN0aW9uRGF0YUNvbnRhaW5lcn07XG59XG5cbi8vIFRPRE86IFVwc3RyZWFtIHRoaXMgYmFjayBpbnRvIGV2ZW50LWRpc3BhdGNoLlxuZnVuY3Rpb24gZ2V0SnNhY3Rpb25EYXRhKGNvbnRhaW5lcjogRWFybHlKc2FjdGlvbkRhdGFDb250YWluZXIpIHtcbiAgcmV0dXJuIGNvbnRhaW5lci5fZWpzYTtcbn1cblxuY29uc3QgSlNBQ1RJT05fQVRUUklCVVRFID0gJ2pzYWN0aW9uJztcbmNvbnN0IHJlbW92ZUpzYWN0aW9uUXVldWU6IFJFbGVtZW50W10gPSBbXTtcblxuLyoqXG4gKiBSZXR1cm5zIGEgc2V0IG9mIHByb3ZpZGVycyByZXF1aXJlZCB0byBzZXR1cCBzdXBwb3J0IGZvciBldmVudCByZXBsYXkuXG4gKiBSZXF1aXJlcyBoeWRyYXRpb24gdG8gYmUgZW5hYmxlZCBzZXBhcmF0ZWx5LlxuICovXG5leHBvcnQgZnVuY3Rpb24gd2l0aEV2ZW50UmVwbGF5KCk6IFByb3ZpZGVyW10ge1xuICByZXR1cm4gW1xuICAgIHtcbiAgICAgIHByb3ZpZGU6IElTX0VWRU5UX1JFUExBWV9FTkFCTEVELFxuICAgICAgdXNlVmFsdWU6IHRydWUsXG4gICAgfSxcbiAgICB7XG4gICAgICBwcm92aWRlOiBFTlZJUk9OTUVOVF9JTklUSUFMSVpFUixcbiAgICAgIHVzZVZhbHVlOiAoKSA9PiB7XG4gICAgICAgIHNldERpc2FibGVFdmVudFJlcGxheUltcGwoKGVsOiBSRWxlbWVudCkgPT4ge1xuICAgICAgICAgIGlmIChlbC5oYXNBdHRyaWJ1dGUoSlNBQ1RJT05fQVRUUklCVVRFKSkge1xuICAgICAgICAgICAgLy8gV2UgZG9uJ3QgaW1tZWRpYXRlbHkgcmVtb3ZlIHRoZSBhdHRyaWJ1dGUgaGVyZSBiZWNhdXNlXG4gICAgICAgICAgICAvLyB3ZSBuZWVkIGl0IGZvciByZXBsYXkgdGhhdCBoYXBwZW5zIGFmdGVyIGh5ZHJhdGlvbi5cbiAgICAgICAgICAgIHJlbW92ZUpzYWN0aW9uUXVldWUucHVzaChlbCk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0sXG4gICAgICBtdWx0aTogdHJ1ZSxcbiAgICB9LFxuICAgIHtcbiAgICAgIHByb3ZpZGU6IEFQUF9CT09UU1RSQVBfTElTVEVORVIsXG4gICAgICB1c2VGYWN0b3J5OiAoKSA9PiB7XG4gICAgICAgIGlmIChpc1BsYXRmb3JtQnJvd3NlcigpKSB7XG4gICAgICAgICAgY29uc3QgaW5qZWN0b3IgPSBpbmplY3QoSW5qZWN0b3IpO1xuICAgICAgICAgIGNvbnN0IGFwcFJlZiA9IGluamVjdChBcHBsaWNhdGlvblJlZik7XG4gICAgICAgICAgcmV0dXJuICgpID0+IHtcbiAgICAgICAgICAgIC8vIEtpY2sgb2ZmIGV2ZW50IHJlcGxheSBsb2dpYyBvbmNlIGh5ZHJhdGlvbiBmb3IgdGhlIGluaXRpYWwgcGFydFxuICAgICAgICAgICAgLy8gb2YgdGhlIGFwcGxpY2F0aW9uIGlzIGNvbXBsZXRlZC4gVGhpcyB0aW1pbmcgaXMgc2ltaWxhciB0byB0aGUgdW5jbGFpbWVkXG4gICAgICAgICAgICAvLyBkZWh5ZHJhdGVkIHZpZXdzIGNsZWFudXAgdGltaW5nLlxuICAgICAgICAgICAgd2hlblN0YWJsZShhcHBSZWYpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICBjb25zdCBhcHBJZCA9IGluamVjdG9yLmdldChBUFBfSUQpO1xuICAgICAgICAgICAgICAvLyBUaGlzIGlzIHNldCBpbiBwYWNrYWdlcy9wbGF0Zm9ybS1zZXJ2ZXIvc3JjL3V0aWxzLnRzXG4gICAgICAgICAgICAgIC8vIE5vdGU6IGdsb2JhbFRoaXNbQ09OVFJBQ1RfUFJPUEVSVFldIG1heSBiZSB1bmRlZmluZWQgaW4gY2FzZSBFdmVudCBSZXBsYXkgZmVhdHVyZVxuICAgICAgICAgICAgICAvLyBpcyBlbmFibGVkLCBidXQgdGhlcmUgYXJlIG5vIGV2ZW50cyBjb25maWd1cmVkIGluIGFuIGFwcGxpY2F0aW9uLlxuICAgICAgICAgICAgICBjb25zdCBjb250YWluZXIgPSBnbG9iYWxUaGlzW0NPTlRSQUNUX1BST1BFUlRZXT8uW2FwcElkXTtcbiAgICAgICAgICAgICAgY29uc3QgZWFybHlKc2FjdGlvbkRhdGEgPSBnZXRKc2FjdGlvbkRhdGEoY29udGFpbmVyKTtcbiAgICAgICAgICAgICAgaWYgKGVhcmx5SnNhY3Rpb25EYXRhKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZXZlbnRDb250cmFjdCA9IG5ldyBFdmVudENvbnRyYWN0KFxuICAgICAgICAgICAgICAgICAgbmV3IEV2ZW50Q29udHJhY3RDb250YWluZXIoZWFybHlKc2FjdGlvbkRhdGEuYyksXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IGV0IG9mIGVhcmx5SnNhY3Rpb25EYXRhLmV0KSB7XG4gICAgICAgICAgICAgICAgICBldmVudENvbnRyYWN0LmFkZEV2ZW50KGV0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZm9yIChjb25zdCBldCBvZiBlYXJseUpzYWN0aW9uRGF0YS5ldGMpIHtcbiAgICAgICAgICAgICAgICAgIGV2ZW50Q29udHJhY3QuYWRkRXZlbnQoZXQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBldmVudENvbnRyYWN0LnJlcGxheUVhcmx5RXZlbnRzKGNvbnRhaW5lcik7XG4gICAgICAgICAgICAgICAgY29uc3QgZGlzcGF0Y2hlciA9IG5ldyBCYXNlRGlzcGF0Y2hlcigoKSA9PiB7fSwge1xuICAgICAgICAgICAgICAgICAgZXZlbnRSZXBsYXllcjogKHF1ZXVlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAoY29uc3QgZXZlbnQgb2YgcXVldWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICBoYW5kbGVFdmVudChldmVudCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcXVldWUubGVuZ3RoID0gMDtcbiAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgcmVnaXN0ZXJEaXNwYXRjaGVyKGV2ZW50Q29udHJhY3QsIGRpc3BhdGNoZXIpO1xuICAgICAgICAgICAgICAgIGZvciAoY29uc3QgZWwgb2YgcmVtb3ZlSnNhY3Rpb25RdWV1ZSkge1xuICAgICAgICAgICAgICAgICAgZWwucmVtb3ZlQXR0cmlidXRlKEpTQUNUSU9OX0FUVFJJQlVURSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJlbW92ZUpzYWN0aW9uUXVldWUubGVuZ3RoID0gMDtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gKCkgPT4ge307IC8vIG5vb3AgZm9yIHRoZSBzZXJ2ZXIgY29kZVxuICAgICAgfSxcbiAgICAgIG11bHRpOiB0cnVlLFxuICAgIH0sXG4gIF07XG59XG5cbi8qKlxuICogRXh0cmFjdHMgaW5mb3JtYXRpb24gYWJvdXQgYWxsIERPTSBldmVudHMgKGFkZGVkIGluIGEgdGVtcGxhdGUpIHJlZ2lzdGVyZWQgb24gZWxlbWVudHMgaW4gYSBnaXZlXG4gKiBMVmlldy4gTWFwcyBjb2xsZWN0ZWQgZXZlbnRzIHRvIGEgY29ycmVzcG9uZGluZyBET00gZWxlbWVudCAoYW4gZWxlbWVudCBpcyB1c2VkIGFzIGEga2V5KS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbGxlY3REb21FdmVudHNJbmZvKFxuICB0VmlldzogVFZpZXcsXG4gIGxWaWV3OiBMVmlldyxcbiAgZXZlbnRUeXBlc1RvUmVwbGF5OiBTZXQ8c3RyaW5nPixcbik6IE1hcDxFbGVtZW50LCBzdHJpbmdbXT4ge1xuICBjb25zdCBldmVudHMgPSBuZXcgTWFwPEVsZW1lbnQsIHN0cmluZ1tdPigpO1xuICBjb25zdCBsQ2xlYW51cCA9IGxWaWV3W0NMRUFOVVBdO1xuICBjb25zdCB0Q2xlYW51cCA9IHRWaWV3LmNsZWFudXA7XG4gIGlmICghdENsZWFudXAgfHwgIWxDbGVhbnVwKSB7XG4gICAgcmV0dXJuIGV2ZW50cztcbiAgfVxuICBmb3IgKGxldCBpID0gMDsgaSA8IHRDbGVhbnVwLmxlbmd0aDsgKSB7XG4gICAgY29uc3QgZmlyc3RQYXJhbSA9IHRDbGVhbnVwW2krK107XG4gICAgY29uc3Qgc2Vjb25kUGFyYW0gPSB0Q2xlYW51cFtpKytdO1xuICAgIGlmICh0eXBlb2YgZmlyc3RQYXJhbSAhPT0gJ3N0cmluZycpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICBjb25zdCBuYW1lOiBzdHJpbmcgPSBmaXJzdFBhcmFtO1xuICAgIGV2ZW50VHlwZXNUb1JlcGxheS5hZGQobmFtZSk7XG4gICAgY29uc3QgbGlzdGVuZXJFbGVtZW50ID0gdW53cmFwUk5vZGUobFZpZXdbc2Vjb25kUGFyYW1dKSBhcyBhbnkgYXMgRWxlbWVudDtcbiAgICBpKys7IC8vIG1vdmUgdGhlIGN1cnNvciB0byB0aGUgbmV4dCBwb3NpdGlvbiAobG9jYXRpb24gb2YgdGhlIGxpc3RlbmVyIGlkeClcbiAgICBjb25zdCB1c2VDYXB0dXJlT3JJbmR4ID0gdENsZWFudXBbaSsrXTtcbiAgICAvLyBpZiB1c2VDYXB0dXJlT3JJbmR4IGlzIGJvb2xlYW4gdGhlbiByZXBvcnQgaXQgYXMgaXMuXG4gICAgLy8gaWYgdXNlQ2FwdHVyZU9ySW5keCBpcyBwb3NpdGl2ZSBudW1iZXIgdGhlbiBpdCBpbiB1bnN1YnNjcmliZSBtZXRob2RcbiAgICAvLyBpZiB1c2VDYXB0dXJlT3JJbmR4IGlzIG5lZ2F0aXZlIG51bWJlciB0aGVuIGl0IGlzIGEgU3Vic2NyaXB0aW9uXG4gICAgY29uc3QgaXNEb21FdmVudCA9IHR5cGVvZiB1c2VDYXB0dXJlT3JJbmR4ID09PSAnYm9vbGVhbicgfHwgdXNlQ2FwdHVyZU9ySW5keCA+PSAwO1xuICAgIGlmICghaXNEb21FdmVudCkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuICAgIGlmICghZXZlbnRzLmhhcyhsaXN0ZW5lckVsZW1lbnQpKSB7XG4gICAgICBldmVudHMuc2V0KGxpc3RlbmVyRWxlbWVudCwgW25hbWVdKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZXZlbnRzLmdldChsaXN0ZW5lckVsZW1lbnQpIS5wdXNoKG5hbWUpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gZXZlbnRzO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2V0SlNBY3Rpb25BdHRyaWJ1dGUoXG4gIHROb2RlOiBUTm9kZSxcbiAgck5vZGU6IFJOb2RlLFxuICBuYXRpdmVFbGVtZW50VG9FdmVudHM6IE1hcDxFbGVtZW50LCBzdHJpbmdbXT4sXG4pIHtcbiAgaWYgKHROb2RlLnR5cGUgJiBUTm9kZVR5cGUuRWxlbWVudCkge1xuICAgIGNvbnN0IG5hdGl2ZUVsZW1lbnQgPSB1bndyYXBSTm9kZShyTm9kZSkgYXMgRWxlbWVudDtcbiAgICBjb25zdCBldmVudHMgPSBuYXRpdmVFbGVtZW50VG9FdmVudHMuZ2V0KG5hdGl2ZUVsZW1lbnQpID8/IFtdO1xuICAgIGNvbnN0IHBhcnRzID0gZXZlbnRzLm1hcCgoZXZlbnQpID0+IGAke2V2ZW50fTpgKTtcbiAgICBpZiAocGFydHMubGVuZ3RoID4gMCkge1xuICAgICAgbmF0aXZlRWxlbWVudC5zZXRBdHRyaWJ1dGUoSlNBQ1RJT05fQVRUUklCVVRFLCBwYXJ0cy5qb2luKCc7JykpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEZpbmRzIGFuIExWaWV3IHRoYXQgYSBnaXZlbiBET00gZWxlbWVudCBiZWxvbmdzIHRvLlxuICovXG5mdW5jdGlvbiBnZXRMVmlld0J5RWxlbWVudCh0YXJnZXQ6IEhUTUxFbGVtZW50KTogTFZpZXcgfCBudWxsIHtcbiAgbGV0IGxWaWV3ID0gcmVhZExWaWV3KHRhcmdldCk7XG4gIGlmIChsVmlldykge1xuICAgIHJldHVybiBsVmlldztcbiAgfSBlbHNlIHtcbiAgICAvLyBJZiB0aGlzIG5vZGUgZG9lc24ndCBoYXZlIExWaWV3IGluZm8gYXR0YWNoZWQsIHRoZW4gd2UgbmVlZCB0b1xuICAgIC8vIHRyYXZlcnNlIHVwd2FyZHMgdXAgdGhlIERPTSB0byBmaW5kIHRoZSBuZWFyZXN0IGVsZW1lbnQgdGhhdFxuICAgIC8vIGhhcyBhbHJlYWR5IGJlZW4gbW9ua2V5IHBhdGNoZWQgd2l0aCBkYXRhLlxuICAgIGxldCBwYXJlbnQgPSB0YXJnZXQgYXMgSFRNTEVsZW1lbnQ7XG4gICAgd2hpbGUgKChwYXJlbnQgPSBwYXJlbnQucGFyZW50Tm9kZSBhcyBIVE1MRWxlbWVudCkpIHtcbiAgICAgIGxWaWV3ID0gcmVhZExWaWV3KHBhcmVudCk7XG4gICAgICBpZiAobFZpZXcpIHtcbiAgICAgICAgLy8gVG8gcHJldmVudCBhZGRpdGlvbmFsIGxvb2t1cHMsIG1vbmtleS1wYXRjaCBMVmlldyBpZCBvbnRvIHRoaXMgRE9NIG5vZGUuXG4gICAgICAgIC8vIFRPRE86IGNvbnNpZGVyIHBhdGNoaW5nIGFsbCBwYXJlbnQgbm9kZXMgdGhhdCBkaWRuJ3QgaGF2ZSBMVmlldyBpZCwgc28gdGhhdFxuICAgICAgICAvLyB3ZSBjYW4gYXZvaWQgbG9va3VwcyBmb3IgbW9yZSBub2Rlcy5cbiAgICAgICAgYXR0YWNoTFZpZXdJZCh0YXJnZXQsIGxWaWV3KTtcbiAgICAgICAgcmV0dXJuIGxWaWV3O1xuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuZnVuY3Rpb24gaGFuZGxlRXZlbnQoZXZlbnQ6IEV2ZW50SW5mb1dyYXBwZXIpIHtcbiAgY29uc3QgbmF0aXZlRWxlbWVudCA9IGV2ZW50LmdldEFjdGlvbigpIS5lbGVtZW50O1xuICAvLyBEaXNwYXRjaCBldmVudCB2aWEgQW5ndWxhcidzIGxvZ2ljXG4gIGlmIChuYXRpdmVFbGVtZW50KSB7XG4gICAgY29uc3QgbFZpZXcgPSBnZXRMVmlld0J5RWxlbWVudChuYXRpdmVFbGVtZW50IGFzIEhUTUxFbGVtZW50KTtcbiAgICBpZiAobFZpZXcgIT09IG51bGwpIHtcbiAgICAgIGNvbnN0IHRWaWV3ID0gbFZpZXdbVFZJRVddO1xuICAgICAgY29uc3QgZXZlbnROYW1lID0gZXZlbnQuZ2V0RXZlbnRUeXBlKCk7XG4gICAgICBjb25zdCBvcmlnRXZlbnQgPSBldmVudC5nZXRFdmVudCgpO1xuICAgICAgY29uc3QgbGlzdGVuZXJzID0gZ2V0RXZlbnRMaXN0ZW5lcnModFZpZXcsIGxWaWV3LCBuYXRpdmVFbGVtZW50LCBldmVudE5hbWUpO1xuICAgICAgZm9yIChjb25zdCBsaXN0ZW5lciBvZiBsaXN0ZW5lcnMpIHtcbiAgICAgICAgbGlzdGVuZXIob3JpZ0V2ZW50KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxudHlwZSBMaXN0ZW5lciA9ICgodmFsdWU6IEV2ZW50KSA9PiB1bmtub3duKSB8ICgoKSA9PiB1bmtub3duKTtcblxuZnVuY3Rpb24gZ2V0RXZlbnRMaXN0ZW5lcnMoXG4gIHRWaWV3OiBUVmlldyxcbiAgbFZpZXc6IExWaWV3LFxuICBuYXRpdmVFbGVtZW50OiBFbGVtZW50LFxuICBldmVudE5hbWU6IHN0cmluZyxcbik6IExpc3RlbmVyW10ge1xuICBjb25zdCBsaXN0ZW5lcnM6IExpc3RlbmVyW10gPSBbXTtcbiAgY29uc3QgbENsZWFudXAgPSBsVmlld1tDTEVBTlVQXTtcbiAgY29uc3QgdENsZWFudXAgPSB0Vmlldy5jbGVhbnVwO1xuICBpZiAodENsZWFudXAgJiYgbENsZWFudXApIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRDbGVhbnVwLmxlbmd0aDsgKSB7XG4gICAgICBjb25zdCBzdG9yZWRFdmVudE5hbWUgPSB0Q2xlYW51cFtpKytdO1xuICAgICAgY29uc3QgbmF0aXZlRWxlbWVudEluZGV4ID0gdENsZWFudXBbaSsrXTtcbiAgICAgIGlmICh0eXBlb2Ygc3RvcmVkRXZlbnROYW1lID09PSAnc3RyaW5nJykge1xuICAgICAgICBjb25zdCBsaXN0ZW5lckVsZW1lbnQgPSB1bndyYXBSTm9kZShsVmlld1tuYXRpdmVFbGVtZW50SW5kZXhdKSBhcyBhbnkgYXMgRWxlbWVudDtcbiAgICAgICAgY29uc3QgbGlzdGVuZXI6IExpc3RlbmVyID0gbENsZWFudXBbdENsZWFudXBbaSsrXV07XG4gICAgICAgIGkrKzsgLy8gaW5jcmVtZW50IHRvIHRoZSBuZXh0IHBvc2l0aW9uO1xuICAgICAgICBpZiAobGlzdGVuZXJFbGVtZW50ID09PSBuYXRpdmVFbGVtZW50ICYmIGV2ZW50TmFtZSA9PT0gc3RvcmVkRXZlbnROYW1lKSB7XG4gICAgICAgICAgbGlzdGVuZXJzLnB1c2gobGlzdGVuZXIpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBsaXN0ZW5lcnM7XG59XG4iXX0=