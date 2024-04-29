/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Dispatcher, registerDispatcher, } from '@angular/core/primitives/event-dispatch';
import { APP_BOOTSTRAP_LISTENER, ApplicationRef, whenStable } from '../application/application_ref';
import { APP_ID } from '../application/application_tokens';
import { Injector } from '../di';
import { inject } from '../di/injector_compatibility';
import { attachLViewId, readLView } from '../render3/context_discovery';
import { CLEANUP, TVIEW } from '../render3/interfaces/view';
import { isPlatformBrowser } from '../render3/util/misc_utils';
import { unwrapRNode } from '../render3/util/view_utils';
import { IS_EVENT_REPLAY_ENABLED } from './tokens';
export const EVENT_REPLAY_ENABLED_DEFAULT = false;
export const CONTRACT_PROPERTY = 'ngContracts';
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
                            const eventContract = globalThis[CONTRACT_PROPERTY]?.[appId];
                            if (eventContract) {
                                const dispatcher = new Dispatcher();
                                setEventReplayer(dispatcher);
                                // Event replay is kicked off as a side-effect of executing this function.
                                registerDispatcher(eventContract, dispatcher);
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
            nativeElement.setAttribute('jsaction', parts.join(';'));
        }
    }
}
/**
 * Registers a function that should be invoked to replay events.
 */
function setEventReplayer(dispatcher) {
    dispatcher.setEventReplayer((queue) => {
        for (const event of queue) {
            handleEvent(event);
        }
    });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXZlbnRfcmVwbGF5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvaHlkcmF0aW9uL2V2ZW50X3JlcGxheS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQ0wsVUFBVSxFQUdWLGtCQUFrQixHQUNuQixNQUFNLHlDQUF5QyxDQUFDO0FBRWpELE9BQU8sRUFBQyxzQkFBc0IsRUFBRSxjQUFjLEVBQUUsVUFBVSxFQUFDLE1BQU0sZ0NBQWdDLENBQUM7QUFDbEcsT0FBTyxFQUFDLE1BQU0sRUFBQyxNQUFNLG1DQUFtQyxDQUFDO0FBQ3pELE9BQU8sRUFBQyxRQUFRLEVBQUMsTUFBTSxPQUFPLENBQUM7QUFDL0IsT0FBTyxFQUFDLE1BQU0sRUFBQyxNQUFNLDhCQUE4QixDQUFDO0FBRXBELE9BQU8sRUFBQyxhQUFhLEVBQUUsU0FBUyxFQUFDLE1BQU0sOEJBQThCLENBQUM7QUFHdEUsT0FBTyxFQUFDLE9BQU8sRUFBUyxLQUFLLEVBQVEsTUFBTSw0QkFBNEIsQ0FBQztBQUN4RSxPQUFPLEVBQUMsaUJBQWlCLEVBQUMsTUFBTSw0QkFBNEIsQ0FBQztBQUM3RCxPQUFPLEVBQUMsV0FBVyxFQUFDLE1BQU0sNEJBQTRCLENBQUM7QUFFdkQsT0FBTyxFQUFDLHVCQUF1QixFQUFDLE1BQU0sVUFBVSxDQUFDO0FBRWpELE1BQU0sQ0FBQyxNQUFNLDRCQUE0QixHQUFHLEtBQUssQ0FBQztBQUNsRCxNQUFNLENBQUMsTUFBTSxpQkFBaUIsR0FBRyxhQUFhLENBQUM7QUFNL0M7OztHQUdHO0FBQ0gsTUFBTSxVQUFVLGVBQWU7SUFDN0IsT0FBTztRQUNMO1lBQ0UsT0FBTyxFQUFFLHVCQUF1QjtZQUNoQyxRQUFRLEVBQUUsSUFBSTtTQUNmO1FBQ0Q7WUFDRSxPQUFPLEVBQUUsc0JBQXNCO1lBQy9CLFVBQVUsRUFBRSxHQUFHLEVBQUU7Z0JBQ2YsSUFB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LEVBQ1osS0FBWSxFQUNaLGFBQXNCLEVBQ3RCLFNBQWlCO0lBRWpCLE1BQU0sU0FBUyxHQUFlLEVBQUUsQ0FBQztJQUNqQyxNQUFNLFFBQVEsR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDaEMsTUFBTSxRQUFRLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQztJQUMvQixJQUFJLFFBQVEsSUFBSSxRQUFRLEVBQUUsQ0FBQztRQUN6QixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsUUFBUSxDQUFDLE1BQU0sR0FBSSxDQUFDO1lBQ3RDLE1BQU0sZUFBZSxHQUFHLFFBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQ3RDLE1BQU0sa0JBQWtCLEdBQUcsUUFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDekMsSUFBSSxPQUFPLGVBQWUsS0FBSyxRQUFRLEVBQUUsQ0FBQztnQkFDeEMsTUFBTSxlQUFlLEdBQUcsV0FBVyxDQUFDLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxDQUFtQixDQUFDO2dCQUNqRixNQUFNLFFBQVEsR0FBYSxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDbkQsQ0FBQyxFQUFFLENBQUMsQ0FBQyxrQ0FBa0M7Z0JBQ3ZDLElBQUksZUFBZSxLQUFLLGFBQWEsSUFBSSxTQUFTLEtBQUssZUFBZSxFQUFFLENBQUM7b0JBQ3ZFLFNBQVMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7Z0JBQzNCLENBQUM7WUFDSCxDQUFDO1FBQ0gsQ0FBQztJQUNILENBQUM7SUFDRCxPQUFPLFNBQVMsQ0FBQztBQUNuQixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7XG4gIERpc3BhdGNoZXIsXG4gIEV2ZW50Q29udHJhY3QsXG4gIEV2ZW50SW5mb1dyYXBwZXIsXG4gIHJlZ2lzdGVyRGlzcGF0Y2hlcixcbn0gZnJvbSAnQGFuZ3VsYXIvY29yZS9wcmltaXRpdmVzL2V2ZW50LWRpc3BhdGNoJztcblxuaW1wb3J0IHtBUFBfQk9PVFNUUkFQX0xJU1RFTkVSLCBBcHBsaWNhdGlvblJlZiwgd2hlblN0YWJsZX0gZnJvbSAnLi4vYXBwbGljYXRpb24vYXBwbGljYXRpb25fcmVmJztcbmltcG9ydCB7QVBQX0lEfSBmcm9tICcuLi9hcHBsaWNhdGlvbi9hcHBsaWNhdGlvbl90b2tlbnMnO1xuaW1wb3J0IHtJbmplY3Rvcn0gZnJvbSAnLi4vZGknO1xuaW1wb3J0IHtpbmplY3R9IGZyb20gJy4uL2RpL2luamVjdG9yX2NvbXBhdGliaWxpdHknO1xuaW1wb3J0IHtQcm92aWRlcn0gZnJvbSAnLi4vZGkvaW50ZXJmYWNlL3Byb3ZpZGVyJztcbmltcG9ydCB7YXR0YWNoTFZpZXdJZCwgcmVhZExWaWV3fSBmcm9tICcuLi9yZW5kZXIzL2NvbnRleHRfZGlzY292ZXJ5JztcbmltcG9ydCB7VE5vZGUsIFROb2RlVHlwZX0gZnJvbSAnLi4vcmVuZGVyMy9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtSTm9kZX0gZnJvbSAnLi4vcmVuZGVyMy9pbnRlcmZhY2VzL3JlbmRlcmVyX2RvbSc7XG5pbXBvcnQge0NMRUFOVVAsIExWaWV3LCBUVklFVywgVFZpZXd9IGZyb20gJy4uL3JlbmRlcjMvaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7aXNQbGF0Zm9ybUJyb3dzZXJ9IGZyb20gJy4uL3JlbmRlcjMvdXRpbC9taXNjX3V0aWxzJztcbmltcG9ydCB7dW53cmFwUk5vZGV9IGZyb20gJy4uL3JlbmRlcjMvdXRpbC92aWV3X3V0aWxzJztcblxuaW1wb3J0IHtJU19FVkVOVF9SRVBMQVlfRU5BQkxFRH0gZnJvbSAnLi90b2tlbnMnO1xuXG5leHBvcnQgY29uc3QgRVZFTlRfUkVQTEFZX0VOQUJMRURfREVGQVVMVCA9IGZhbHNlO1xuZXhwb3J0IGNvbnN0IENPTlRSQUNUX1BST1BFUlRZID0gJ25nQ29udHJhY3RzJztcblxuZGVjbGFyZSBnbG9iYWwge1xuICB2YXIgbmdDb250cmFjdHM6IHtba2V5OiBzdHJpbmddOiBFdmVudENvbnRyYWN0fTtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIGEgc2V0IG9mIHByb3ZpZGVycyByZXF1aXJlZCB0byBzZXR1cCBzdXBwb3J0IGZvciBldmVudCByZXBsYXkuXG4gKiBSZXF1aXJlcyBoeWRyYXRpb24gdG8gYmUgZW5hYmxlZCBzZXBhcmF0ZWx5LlxuICovXG5leHBvcnQgZnVuY3Rpb24gd2l0aEV2ZW50UmVwbGF5KCk6IFByb3ZpZGVyW10ge1xuICByZXR1cm4gW1xuICAgIHtcbiAgICAgIHByb3ZpZGU6IElTX0VWRU5UX1JFUExBWV9FTkFCTEVELFxuICAgICAgdXNlVmFsdWU6IHRydWUsXG4gICAgfSxcbiAgICB7XG4gICAgICBwcm92aWRlOiBBUFBfQk9PVFNUUkFQX0xJU1RFTkVSLFxuICAgICAgdXNlRmFjdG9yeTogKCkgPT4ge1xuICAgICAgICBpZiAoaXNQbGF0Zm9ybUJyb3dzZXIoKSkge1xuICAgICAgICAgIGNvbnN0IGluamVjdG9yID0gaW5qZWN0KEluamVjdG9yKTtcbiAgICAgICAgICBjb25zdCBhcHBSZWYgPSBpbmplY3QoQXBwbGljYXRpb25SZWYpO1xuICAgICAgICAgIHJldHVybiAoKSA9PiB7XG4gICAgICAgICAgICAvLyBLaWNrIG9mZiBldmVudCByZXBsYXkgbG9naWMgb25jZSBoeWRyYXRpb24gZm9yIHRoZSBpbml0aWFsIHBhcnRcbiAgICAgICAgICAgIC8vIG9mIHRoZSBhcHBsaWNhdGlvbiBpcyBjb21wbGV0ZWQuIFRoaXMgdGltaW5nIGlzIHNpbWlsYXIgdG8gdGhlIHVuY2xhaW1lZFxuICAgICAgICAgICAgLy8gZGVoeWRyYXRlZCB2aWV3cyBjbGVhbnVwIHRpbWluZy5cbiAgICAgICAgICAgIHdoZW5TdGFibGUoYXBwUmVmKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgY29uc3QgYXBwSWQgPSBpbmplY3Rvci5nZXQoQVBQX0lEKTtcbiAgICAgICAgICAgICAgLy8gVGhpcyBpcyBzZXQgaW4gcGFja2FnZXMvcGxhdGZvcm0tc2VydmVyL3NyYy91dGlscy50c1xuICAgICAgICAgICAgICAvLyBOb3RlOiBnbG9iYWxUaGlzW0NPTlRSQUNUX1BST1BFUlRZXSBtYXkgYmUgdW5kZWZpbmVkIGluIGNhc2UgRXZlbnQgUmVwbGF5IGZlYXR1cmVcbiAgICAgICAgICAgICAgLy8gaXMgZW5hYmxlZCwgYnV0IHRoZXJlIGFyZSBubyBldmVudHMgY29uZmlndXJlZCBpbiBhbiBhcHBsaWNhdGlvbi5cbiAgICAgICAgICAgICAgY29uc3QgZXZlbnRDb250cmFjdCA9IGdsb2JhbFRoaXNbQ09OVFJBQ1RfUFJPUEVSVFldPy5bYXBwSWRdIGFzIEV2ZW50Q29udHJhY3Q7XG4gICAgICAgICAgICAgIGlmIChldmVudENvbnRyYWN0KSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZGlzcGF0Y2hlciA9IG5ldyBEaXNwYXRjaGVyKCk7XG4gICAgICAgICAgICAgICAgc2V0RXZlbnRSZXBsYXllcihkaXNwYXRjaGVyKTtcbiAgICAgICAgICAgICAgICAvLyBFdmVudCByZXBsYXkgaXMga2lja2VkIG9mZiBhcyBhIHNpZGUtZWZmZWN0IG9mIGV4ZWN1dGluZyB0aGlzIGZ1bmN0aW9uLlxuICAgICAgICAgICAgICAgIHJlZ2lzdGVyRGlzcGF0Y2hlcihldmVudENvbnRyYWN0LCBkaXNwYXRjaGVyKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gKCkgPT4ge307IC8vIG5vb3AgZm9yIHRoZSBzZXJ2ZXIgY29kZVxuICAgICAgfSxcbiAgICAgIG11bHRpOiB0cnVlLFxuICAgIH0sXG4gIF07XG59XG5cbi8qKlxuICogRXh0cmFjdHMgaW5mb3JtYXRpb24gYWJvdXQgYWxsIERPTSBldmVudHMgKGFkZGVkIGluIGEgdGVtcGxhdGUpIHJlZ2lzdGVyZWQgb24gZWxlbWVudHMgaW4gYSBnaXZlXG4gKiBMVmlldy4gTWFwcyBjb2xsZWN0ZWQgZXZlbnRzIHRvIGEgY29ycmVzcG9uZGluZyBET00gZWxlbWVudCAoYW4gZWxlbWVudCBpcyB1c2VkIGFzIGEga2V5KS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbGxlY3REb21FdmVudHNJbmZvKFxuICB0VmlldzogVFZpZXcsXG4gIGxWaWV3OiBMVmlldyxcbiAgZXZlbnRUeXBlc1RvUmVwbGF5OiBTZXQ8c3RyaW5nPixcbik6IE1hcDxFbGVtZW50LCBzdHJpbmdbXT4ge1xuICBjb25zdCBldmVudHMgPSBuZXcgTWFwPEVsZW1lbnQsIHN0cmluZ1tdPigpO1xuICBjb25zdCBsQ2xlYW51cCA9IGxWaWV3W0NMRUFOVVBdO1xuICBjb25zdCB0Q2xlYW51cCA9IHRWaWV3LmNsZWFudXA7XG4gIGlmICghdENsZWFudXAgfHwgIWxDbGVhbnVwKSB7XG4gICAgcmV0dXJuIGV2ZW50cztcbiAgfVxuICBmb3IgKGxldCBpID0gMDsgaSA8IHRDbGVhbnVwLmxlbmd0aDsgKSB7XG4gICAgY29uc3QgZmlyc3RQYXJhbSA9IHRDbGVhbnVwW2krK107XG4gICAgY29uc3Qgc2Vjb25kUGFyYW0gPSB0Q2xlYW51cFtpKytdO1xuICAgIGlmICh0eXBlb2YgZmlyc3RQYXJhbSAhPT0gJ3N0cmluZycpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICBjb25zdCBuYW1lOiBzdHJpbmcgPSBmaXJzdFBhcmFtO1xuICAgIGV2ZW50VHlwZXNUb1JlcGxheS5hZGQobmFtZSk7XG4gICAgY29uc3QgbGlzdGVuZXJFbGVtZW50ID0gdW53cmFwUk5vZGUobFZpZXdbc2Vjb25kUGFyYW1dKSBhcyBhbnkgYXMgRWxlbWVudDtcbiAgICBpKys7IC8vIG1vdmUgdGhlIGN1cnNvciB0byB0aGUgbmV4dCBwb3NpdGlvbiAobG9jYXRpb24gb2YgdGhlIGxpc3RlbmVyIGlkeClcbiAgICBjb25zdCB1c2VDYXB0dXJlT3JJbmR4ID0gdENsZWFudXBbaSsrXTtcbiAgICAvLyBpZiB1c2VDYXB0dXJlT3JJbmR4IGlzIGJvb2xlYW4gdGhlbiByZXBvcnQgaXQgYXMgaXMuXG4gICAgLy8gaWYgdXNlQ2FwdHVyZU9ySW5keCBpcyBwb3NpdGl2ZSBudW1iZXIgdGhlbiBpdCBpbiB1bnN1YnNjcmliZSBtZXRob2RcbiAgICAvLyBpZiB1c2VDYXB0dXJlT3JJbmR4IGlzIG5lZ2F0aXZlIG51bWJlciB0aGVuIGl0IGlzIGEgU3Vic2NyaXB0aW9uXG4gICAgY29uc3QgaXNEb21FdmVudCA9IHR5cGVvZiB1c2VDYXB0dXJlT3JJbmR4ID09PSAnYm9vbGVhbicgfHwgdXNlQ2FwdHVyZU9ySW5keCA+PSAwO1xuICAgIGlmICghaXNEb21FdmVudCkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuICAgIGlmICghZXZlbnRzLmhhcyhsaXN0ZW5lckVsZW1lbnQpKSB7XG4gICAgICBldmVudHMuc2V0KGxpc3RlbmVyRWxlbWVudCwgW25hbWVdKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZXZlbnRzLmdldChsaXN0ZW5lckVsZW1lbnQpIS5wdXNoKG5hbWUpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gZXZlbnRzO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2V0SlNBY3Rpb25BdHRyaWJ1dGUoXG4gIHROb2RlOiBUTm9kZSxcbiAgck5vZGU6IFJOb2RlLFxuICBuYXRpdmVFbGVtZW50VG9FdmVudHM6IE1hcDxFbGVtZW50LCBzdHJpbmdbXT4sXG4pIHtcbiAgaWYgKHROb2RlLnR5cGUgJiBUTm9kZVR5cGUuRWxlbWVudCkge1xuICAgIGNvbnN0IG5hdGl2ZUVsZW1lbnQgPSB1bndyYXBSTm9kZShyTm9kZSkgYXMgRWxlbWVudDtcbiAgICBjb25zdCBldmVudHMgPSBuYXRpdmVFbGVtZW50VG9FdmVudHMuZ2V0KG5hdGl2ZUVsZW1lbnQpID8/IFtdO1xuICAgIGNvbnN0IHBhcnRzID0gZXZlbnRzLm1hcCgoZXZlbnQpID0+IGAke2V2ZW50fTpgKTtcbiAgICBpZiAocGFydHMubGVuZ3RoID4gMCkge1xuICAgICAgbmF0aXZlRWxlbWVudC5zZXRBdHRyaWJ1dGUoJ2pzYWN0aW9uJywgcGFydHMuam9pbignOycpKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBSZWdpc3RlcnMgYSBmdW5jdGlvbiB0aGF0IHNob3VsZCBiZSBpbnZva2VkIHRvIHJlcGxheSBldmVudHMuXG4gKi9cbmZ1bmN0aW9uIHNldEV2ZW50UmVwbGF5ZXIoZGlzcGF0Y2hlcjogRGlzcGF0Y2hlcikge1xuICBkaXNwYXRjaGVyLnNldEV2ZW50UmVwbGF5ZXIoKHF1ZXVlKSA9PiB7XG4gICAgZm9yIChjb25zdCBldmVudCBvZiBxdWV1ZSkge1xuICAgICAgaGFuZGxlRXZlbnQoZXZlbnQpO1xuICAgIH1cbiAgfSk7XG59XG5cbi8qKlxuICogRmluZHMgYW4gTFZpZXcgdGhhdCBhIGdpdmVuIERPTSBlbGVtZW50IGJlbG9uZ3MgdG8uXG4gKi9cbmZ1bmN0aW9uIGdldExWaWV3QnlFbGVtZW50KHRhcmdldDogSFRNTEVsZW1lbnQpOiBMVmlldyB8IG51bGwge1xuICBsZXQgbFZpZXcgPSByZWFkTFZpZXcodGFyZ2V0KTtcbiAgaWYgKGxWaWV3KSB7XG4gICAgcmV0dXJuIGxWaWV3O1xuICB9IGVsc2Uge1xuICAgIC8vIElmIHRoaXMgbm9kZSBkb2Vzbid0IGhhdmUgTFZpZXcgaW5mbyBhdHRhY2hlZCwgdGhlbiB3ZSBuZWVkIHRvXG4gICAgLy8gdHJhdmVyc2UgdXB3YXJkcyB1cCB0aGUgRE9NIHRvIGZpbmQgdGhlIG5lYXJlc3QgZWxlbWVudCB0aGF0XG4gICAgLy8gaGFzIGFscmVhZHkgYmVlbiBtb25rZXkgcGF0Y2hlZCB3aXRoIGRhdGEuXG4gICAgbGV0IHBhcmVudCA9IHRhcmdldCBhcyBIVE1MRWxlbWVudDtcbiAgICB3aGlsZSAoKHBhcmVudCA9IHBhcmVudC5wYXJlbnROb2RlIGFzIEhUTUxFbGVtZW50KSkge1xuICAgICAgbFZpZXcgPSByZWFkTFZpZXcocGFyZW50KTtcbiAgICAgIGlmIChsVmlldykge1xuICAgICAgICAvLyBUbyBwcmV2ZW50IGFkZGl0aW9uYWwgbG9va3VwcywgbW9ua2V5LXBhdGNoIExWaWV3IGlkIG9udG8gdGhpcyBET00gbm9kZS5cbiAgICAgICAgLy8gVE9ETzogY29uc2lkZXIgcGF0Y2hpbmcgYWxsIHBhcmVudCBub2RlcyB0aGF0IGRpZG4ndCBoYXZlIExWaWV3IGlkLCBzbyB0aGF0XG4gICAgICAgIC8vIHdlIGNhbiBhdm9pZCBsb29rdXBzIGZvciBtb3JlIG5vZGVzLlxuICAgICAgICBhdHRhY2hMVmlld0lkKHRhcmdldCwgbFZpZXcpO1xuICAgICAgICByZXR1cm4gbFZpZXc7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG5mdW5jdGlvbiBoYW5kbGVFdmVudChldmVudDogRXZlbnRJbmZvV3JhcHBlcikge1xuICBjb25zdCBuYXRpdmVFbGVtZW50ID0gZXZlbnQuZ2V0QWN0aW9uKCkhLmVsZW1lbnQ7XG4gIC8vIERpc3BhdGNoIGV2ZW50IHZpYSBBbmd1bGFyJ3MgbG9naWNcbiAgaWYgKG5hdGl2ZUVsZW1lbnQpIHtcbiAgICBjb25zdCBsVmlldyA9IGdldExWaWV3QnlFbGVtZW50KG5hdGl2ZUVsZW1lbnQgYXMgSFRNTEVsZW1lbnQpO1xuICAgIGlmIChsVmlldyAhPT0gbnVsbCkge1xuICAgICAgY29uc3QgdFZpZXcgPSBsVmlld1tUVklFV107XG4gICAgICBjb25zdCBldmVudE5hbWUgPSBldmVudC5nZXRFdmVudFR5cGUoKTtcbiAgICAgIGNvbnN0IG9yaWdFdmVudCA9IGV2ZW50LmdldEV2ZW50KCk7XG4gICAgICBjb25zdCBsaXN0ZW5lcnMgPSBnZXRFdmVudExpc3RlbmVycyh0VmlldywgbFZpZXcsIG5hdGl2ZUVsZW1lbnQsIGV2ZW50TmFtZSk7XG4gICAgICBmb3IgKGNvbnN0IGxpc3RlbmVyIG9mIGxpc3RlbmVycykge1xuICAgICAgICBsaXN0ZW5lcihvcmlnRXZlbnQpO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG50eXBlIExpc3RlbmVyID0gKCh2YWx1ZTogRXZlbnQpID0+IHVua25vd24pIHwgKCgpID0+IHVua25vd24pO1xuXG5mdW5jdGlvbiBnZXRFdmVudExpc3RlbmVycyhcbiAgdFZpZXc6IFRWaWV3LFxuICBsVmlldzogTFZpZXcsXG4gIG5hdGl2ZUVsZW1lbnQ6IEVsZW1lbnQsXG4gIGV2ZW50TmFtZTogc3RyaW5nLFxuKTogTGlzdGVuZXJbXSB7XG4gIGNvbnN0IGxpc3RlbmVyczogTGlzdGVuZXJbXSA9IFtdO1xuICBjb25zdCBsQ2xlYW51cCA9IGxWaWV3W0NMRUFOVVBdO1xuICBjb25zdCB0Q2xlYW51cCA9IHRWaWV3LmNsZWFudXA7XG4gIGlmICh0Q2xlYW51cCAmJiBsQ2xlYW51cCkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdENsZWFudXAubGVuZ3RoOyApIHtcbiAgICAgIGNvbnN0IHN0b3JlZEV2ZW50TmFtZSA9IHRDbGVhbnVwW2krK107XG4gICAgICBjb25zdCBuYXRpdmVFbGVtZW50SW5kZXggPSB0Q2xlYW51cFtpKytdO1xuICAgICAgaWYgKHR5cGVvZiBzdG9yZWRFdmVudE5hbWUgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIGNvbnN0IGxpc3RlbmVyRWxlbWVudCA9IHVud3JhcFJOb2RlKGxWaWV3W25hdGl2ZUVsZW1lbnRJbmRleF0pIGFzIGFueSBhcyBFbGVtZW50O1xuICAgICAgICBjb25zdCBsaXN0ZW5lcjogTGlzdGVuZXIgPSBsQ2xlYW51cFt0Q2xlYW51cFtpKytdXTtcbiAgICAgICAgaSsrOyAvLyBpbmNyZW1lbnQgdG8gdGhlIG5leHQgcG9zaXRpb247XG4gICAgICAgIGlmIChsaXN0ZW5lckVsZW1lbnQgPT09IG5hdGl2ZUVsZW1lbnQgJiYgZXZlbnROYW1lID09PSBzdG9yZWRFdmVudE5hbWUpIHtcbiAgICAgICAgICBsaXN0ZW5lcnMucHVzaChsaXN0ZW5lcik7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIGxpc3RlbmVycztcbn1cbiJdfQ==