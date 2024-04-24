/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Dispatcher, registerDispatcher } from '@angular/core/primitives/event-dispatch';
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
        }
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
        const parts = events.map(event => `${event}:`);
        if (parts.length > 0) {
            nativeElement.setAttribute('jsaction', parts.join(';'));
        }
    }
}
/**
 * Registers a function that should be invoked to replay events.
 */
function setEventReplayer(dispatcher) {
    dispatcher.setEventReplayer(queue => {
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
        while (parent = parent.parentNode) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXZlbnRfcmVwbGF5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvaHlkcmF0aW9uL2V2ZW50X3JlcGxheS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsVUFBVSxFQUFtQyxrQkFBa0IsRUFBQyxNQUFNLHlDQUF5QyxDQUFDO0FBRXhILE9BQU8sRUFBQyxzQkFBc0IsRUFBRSxjQUFjLEVBQUUsVUFBVSxFQUFDLE1BQU0sZ0NBQWdDLENBQUM7QUFDbEcsT0FBTyxFQUFDLE1BQU0sRUFBQyxNQUFNLG1DQUFtQyxDQUFDO0FBQ3pELE9BQU8sRUFBQyxRQUFRLEVBQUMsTUFBTSxPQUFPLENBQUM7QUFDL0IsT0FBTyxFQUFDLE1BQU0sRUFBQyxNQUFNLDhCQUE4QixDQUFDO0FBRXBELE9BQU8sRUFBQyxhQUFhLEVBQUUsU0FBUyxFQUFDLE1BQU0sOEJBQThCLENBQUM7QUFHdEUsT0FBTyxFQUFDLE9BQU8sRUFBUyxLQUFLLEVBQVEsTUFBTSw0QkFBNEIsQ0FBQztBQUN4RSxPQUFPLEVBQUMsaUJBQWlCLEVBQUMsTUFBTSw0QkFBNEIsQ0FBQztBQUM3RCxPQUFPLEVBQUMsV0FBVyxFQUFDLE1BQU0sNEJBQTRCLENBQUM7QUFFdkQsT0FBTyxFQUFDLHVCQUF1QixFQUFDLE1BQU0sVUFBVSxDQUFDO0FBRWpELE1BQU0sQ0FBQyxNQUFNLDRCQUE0QixHQUFHLEtBQUssQ0FBQztBQUNsRCxNQUFNLENBQUMsTUFBTSxpQkFBaUIsR0FBRyxhQUFhLENBQUM7QUFNL0M7OztHQUdHO0FBQ0gsTUFBTSxVQUFVLGVBQWU7SUFDN0IsT0FBTztRQUNMO1lBQ0UsT0FBTyxFQUFFLHVCQUF1QjtZQUNoQyxRQUFRLEVBQUUsSUFBSTtTQUNmO1FBQ0Q7WUFDRSxPQUFPLEVBQUUsc0JBQXNCO1lBQy9CLFVBQVUsRUFBRSxHQUFHLEVBQUU7Z0JBQ2YsSUFB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QixFQUFFLFNBQWlCO0lBQ3ZFLE1BQU0sU0FBUyxHQUFlLEVBQUUsQ0FBQztJQUNqQyxNQUFNLFFBQVEsR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDaEMsTUFBTSxRQUFRLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQztJQUMvQixJQUFJLFFBQVEsSUFBSSxRQUFRLEVBQUUsQ0FBQztRQUN6QixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsUUFBUSxDQUFDLE1BQU0sR0FBRyxDQUFDO1lBQ3JDLE1BQU0sZUFBZSxHQUFHLFFBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQ3RDLE1BQU0sa0JBQWtCLEdBQUcsUUFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDekMsSUFBSSxPQUFPLGVBQWUsS0FBSyxRQUFRLEVBQUUsQ0FBQztnQkFDeEMsTUFBTSxlQUFlLEdBQUcsV0FBVyxDQUFDLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxDQUFtQixDQUFDO2dCQUNqRixNQUFNLFFBQVEsR0FBYSxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDbkQsQ0FBQyxFQUFFLENBQUMsQ0FBRSxrQ0FBa0M7Z0JBQ3hDLElBQUksZUFBZSxLQUFLLGFBQWEsSUFBSSxTQUFTLEtBQUssZUFBZSxFQUFFLENBQUM7b0JBQ3ZFLFNBQVMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7Z0JBQzNCLENBQUM7WUFDSCxDQUFDO1FBQ0gsQ0FBQztJQUNILENBQUM7SUFDRCxPQUFPLFNBQVMsQ0FBQztBQUNuQixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7RGlzcGF0Y2hlciwgRXZlbnRDb250cmFjdCwgRXZlbnRJbmZvV3JhcHBlciwgcmVnaXN0ZXJEaXNwYXRjaGVyfSBmcm9tICdAYW5ndWxhci9jb3JlL3ByaW1pdGl2ZXMvZXZlbnQtZGlzcGF0Y2gnO1xuXG5pbXBvcnQge0FQUF9CT09UU1RSQVBfTElTVEVORVIsIEFwcGxpY2F0aW9uUmVmLCB3aGVuU3RhYmxlfSBmcm9tICcuLi9hcHBsaWNhdGlvbi9hcHBsaWNhdGlvbl9yZWYnO1xuaW1wb3J0IHtBUFBfSUR9IGZyb20gJy4uL2FwcGxpY2F0aW9uL2FwcGxpY2F0aW9uX3Rva2Vucyc7XG5pbXBvcnQge0luamVjdG9yfSBmcm9tICcuLi9kaSc7XG5pbXBvcnQge2luamVjdH0gZnJvbSAnLi4vZGkvaW5qZWN0b3JfY29tcGF0aWJpbGl0eSc7XG5pbXBvcnQge1Byb3ZpZGVyfSBmcm9tICcuLi9kaS9pbnRlcmZhY2UvcHJvdmlkZXInO1xuaW1wb3J0IHthdHRhY2hMVmlld0lkLCByZWFkTFZpZXd9IGZyb20gJy4uL3JlbmRlcjMvY29udGV4dF9kaXNjb3ZlcnknO1xuaW1wb3J0IHtUTm9kZSwgVE5vZGVUeXBlfSBmcm9tICcuLi9yZW5kZXIzL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge1JOb2RlfSBmcm9tICcuLi9yZW5kZXIzL2ludGVyZmFjZXMvcmVuZGVyZXJfZG9tJztcbmltcG9ydCB7Q0xFQU5VUCwgTFZpZXcsIFRWSUVXLCBUVmlld30gZnJvbSAnLi4vcmVuZGVyMy9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHtpc1BsYXRmb3JtQnJvd3Nlcn0gZnJvbSAnLi4vcmVuZGVyMy91dGlsL21pc2NfdXRpbHMnO1xuaW1wb3J0IHt1bndyYXBSTm9kZX0gZnJvbSAnLi4vcmVuZGVyMy91dGlsL3ZpZXdfdXRpbHMnO1xuXG5pbXBvcnQge0lTX0VWRU5UX1JFUExBWV9FTkFCTEVEfSBmcm9tICcuL3Rva2Vucyc7XG5cbmV4cG9ydCBjb25zdCBFVkVOVF9SRVBMQVlfRU5BQkxFRF9ERUZBVUxUID0gZmFsc2U7XG5leHBvcnQgY29uc3QgQ09OVFJBQ1RfUFJPUEVSVFkgPSAnbmdDb250cmFjdHMnO1xuXG5kZWNsYXJlIGdsb2JhbCB7XG4gIHZhciBuZ0NvbnRyYWN0czoge1trZXk6IHN0cmluZ106IEV2ZW50Q29udHJhY3R9O1xufVxuXG4vKipcbiAqIFJldHVybnMgYSBzZXQgb2YgcHJvdmlkZXJzIHJlcXVpcmVkIHRvIHNldHVwIHN1cHBvcnQgZm9yIGV2ZW50IHJlcGxheS5cbiAqIFJlcXVpcmVzIGh5ZHJhdGlvbiB0byBiZSBlbmFibGVkIHNlcGFyYXRlbHkuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB3aXRoRXZlbnRSZXBsYXkoKTogUHJvdmlkZXJbXSB7XG4gIHJldHVybiBbXG4gICAge1xuICAgICAgcHJvdmlkZTogSVNfRVZFTlRfUkVQTEFZX0VOQUJMRUQsXG4gICAgICB1c2VWYWx1ZTogdHJ1ZSxcbiAgICB9LFxuICAgIHtcbiAgICAgIHByb3ZpZGU6IEFQUF9CT09UU1RSQVBfTElTVEVORVIsXG4gICAgICB1c2VGYWN0b3J5OiAoKSA9PiB7XG4gICAgICAgIGlmIChpc1BsYXRmb3JtQnJvd3NlcigpKSB7XG4gICAgICAgICAgY29uc3QgaW5qZWN0b3IgPSBpbmplY3QoSW5qZWN0b3IpO1xuICAgICAgICAgIGNvbnN0IGFwcFJlZiA9IGluamVjdChBcHBsaWNhdGlvblJlZik7XG4gICAgICAgICAgcmV0dXJuICgpID0+IHtcbiAgICAgICAgICAgIC8vIEtpY2sgb2ZmIGV2ZW50IHJlcGxheSBsb2dpYyBvbmNlIGh5ZHJhdGlvbiBmb3IgdGhlIGluaXRpYWwgcGFydFxuICAgICAgICAgICAgLy8gb2YgdGhlIGFwcGxpY2F0aW9uIGlzIGNvbXBsZXRlZC4gVGhpcyB0aW1pbmcgaXMgc2ltaWxhciB0byB0aGUgdW5jbGFpbWVkXG4gICAgICAgICAgICAvLyBkZWh5ZHJhdGVkIHZpZXdzIGNsZWFudXAgdGltaW5nLlxuICAgICAgICAgICAgd2hlblN0YWJsZShhcHBSZWYpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICBjb25zdCBhcHBJZCA9IGluamVjdG9yLmdldChBUFBfSUQpO1xuICAgICAgICAgICAgICAvLyBUaGlzIGlzIHNldCBpbiBwYWNrYWdlcy9wbGF0Zm9ybS1zZXJ2ZXIvc3JjL3V0aWxzLnRzXG4gICAgICAgICAgICAgIC8vIE5vdGU6IGdsb2JhbFRoaXNbQ09OVFJBQ1RfUFJPUEVSVFldIG1heSBiZSB1bmRlZmluZWQgaW4gY2FzZSBFdmVudCBSZXBsYXkgZmVhdHVyZVxuICAgICAgICAgICAgICAvLyBpcyBlbmFibGVkLCBidXQgdGhlcmUgYXJlIG5vIGV2ZW50cyBjb25maWd1cmVkIGluIGFuIGFwcGxpY2F0aW9uLlxuICAgICAgICAgICAgICBjb25zdCBldmVudENvbnRyYWN0ID0gZ2xvYmFsVGhpc1tDT05UUkFDVF9QUk9QRVJUWV0/LlthcHBJZF0gYXMgRXZlbnRDb250cmFjdDtcbiAgICAgICAgICAgICAgaWYgKGV2ZW50Q29udHJhY3QpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBkaXNwYXRjaGVyID0gbmV3IERpc3BhdGNoZXIoKTtcbiAgICAgICAgICAgICAgICBzZXRFdmVudFJlcGxheWVyKGRpc3BhdGNoZXIpO1xuICAgICAgICAgICAgICAgIC8vIEV2ZW50IHJlcGxheSBpcyBraWNrZWQgb2ZmIGFzIGEgc2lkZS1lZmZlY3Qgb2YgZXhlY3V0aW5nIHRoaXMgZnVuY3Rpb24uXG4gICAgICAgICAgICAgICAgcmVnaXN0ZXJEaXNwYXRjaGVyKGV2ZW50Q29udHJhY3QsIGRpc3BhdGNoZXIpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAoKSA9PiB7fTsgIC8vIG5vb3AgZm9yIHRoZSBzZXJ2ZXIgY29kZVxuICAgICAgfSxcbiAgICAgIG11bHRpOiB0cnVlLFxuICAgIH1cbiAgXTtcbn1cblxuLyoqXG4gKiBFeHRyYWN0cyBpbmZvcm1hdGlvbiBhYm91dCBhbGwgRE9NIGV2ZW50cyAoYWRkZWQgaW4gYSB0ZW1wbGF0ZSkgcmVnaXN0ZXJlZCBvbiBlbGVtZW50cyBpbiBhIGdpdmVcbiAqIExWaWV3LiBNYXBzIGNvbGxlY3RlZCBldmVudHMgdG8gYSBjb3JyZXNwb25kaW5nIERPTSBlbGVtZW50IChhbiBlbGVtZW50IGlzIHVzZWQgYXMgYSBrZXkpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY29sbGVjdERvbUV2ZW50c0luZm8oXG4gICAgdFZpZXc6IFRWaWV3LCBsVmlldzogTFZpZXcsIGV2ZW50VHlwZXNUb1JlcGxheTogU2V0PHN0cmluZz4pOiBNYXA8RWxlbWVudCwgc3RyaW5nW10+IHtcbiAgY29uc3QgZXZlbnRzID0gbmV3IE1hcDxFbGVtZW50LCBzdHJpbmdbXT4oKTtcbiAgY29uc3QgbENsZWFudXAgPSBsVmlld1tDTEVBTlVQXTtcbiAgY29uc3QgdENsZWFudXAgPSB0Vmlldy5jbGVhbnVwO1xuICBpZiAoIXRDbGVhbnVwIHx8ICFsQ2xlYW51cCkge1xuICAgIHJldHVybiBldmVudHM7XG4gIH1cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCB0Q2xlYW51cC5sZW5ndGg7KSB7XG4gICAgY29uc3QgZmlyc3RQYXJhbSA9IHRDbGVhbnVwW2krK107XG4gICAgY29uc3Qgc2Vjb25kUGFyYW0gPSB0Q2xlYW51cFtpKytdO1xuICAgIGlmICh0eXBlb2YgZmlyc3RQYXJhbSAhPT0gJ3N0cmluZycpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICBjb25zdCBuYW1lOiBzdHJpbmcgPSBmaXJzdFBhcmFtO1xuICAgIGV2ZW50VHlwZXNUb1JlcGxheS5hZGQobmFtZSk7XG4gICAgY29uc3QgbGlzdGVuZXJFbGVtZW50ID0gdW53cmFwUk5vZGUobFZpZXdbc2Vjb25kUGFyYW1dKSBhcyBhbnkgYXMgRWxlbWVudDtcbiAgICBpKys7ICAvLyBtb3ZlIHRoZSBjdXJzb3IgdG8gdGhlIG5leHQgcG9zaXRpb24gKGxvY2F0aW9uIG9mIHRoZSBsaXN0ZW5lciBpZHgpXG4gICAgY29uc3QgdXNlQ2FwdHVyZU9ySW5keCA9IHRDbGVhbnVwW2krK107XG4gICAgLy8gaWYgdXNlQ2FwdHVyZU9ySW5keCBpcyBib29sZWFuIHRoZW4gcmVwb3J0IGl0IGFzIGlzLlxuICAgIC8vIGlmIHVzZUNhcHR1cmVPckluZHggaXMgcG9zaXRpdmUgbnVtYmVyIHRoZW4gaXQgaW4gdW5zdWJzY3JpYmUgbWV0aG9kXG4gICAgLy8gaWYgdXNlQ2FwdHVyZU9ySW5keCBpcyBuZWdhdGl2ZSBudW1iZXIgdGhlbiBpdCBpcyBhIFN1YnNjcmlwdGlvblxuICAgIGNvbnN0IGlzRG9tRXZlbnQgPSB0eXBlb2YgdXNlQ2FwdHVyZU9ySW5keCA9PT0gJ2Jvb2xlYW4nIHx8IHVzZUNhcHR1cmVPckluZHggPj0gMDtcbiAgICBpZiAoIWlzRG9tRXZlbnQpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICBpZiAoIWV2ZW50cy5oYXMobGlzdGVuZXJFbGVtZW50KSkge1xuICAgICAgZXZlbnRzLnNldChsaXN0ZW5lckVsZW1lbnQsIFtuYW1lXSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGV2ZW50cy5nZXQobGlzdGVuZXJFbGVtZW50KSEucHVzaChuYW1lKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGV2ZW50cztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNldEpTQWN0aW9uQXR0cmlidXRlKFxuICAgIHROb2RlOiBUTm9kZSwgck5vZGU6IFJOb2RlLCBuYXRpdmVFbGVtZW50VG9FdmVudHM6IE1hcDxFbGVtZW50LCBzdHJpbmdbXT4pIHtcbiAgaWYgKHROb2RlLnR5cGUgJiBUTm9kZVR5cGUuRWxlbWVudCkge1xuICAgIGNvbnN0IG5hdGl2ZUVsZW1lbnQgPSB1bndyYXBSTm9kZShyTm9kZSkgYXMgRWxlbWVudDtcbiAgICBjb25zdCBldmVudHMgPSBuYXRpdmVFbGVtZW50VG9FdmVudHMuZ2V0KG5hdGl2ZUVsZW1lbnQpID8/IFtdO1xuICAgIGNvbnN0IHBhcnRzID0gZXZlbnRzLm1hcChldmVudCA9PiBgJHtldmVudH06YCk7XG4gICAgaWYgKHBhcnRzLmxlbmd0aCA+IDApIHtcbiAgICAgIG5hdGl2ZUVsZW1lbnQuc2V0QXR0cmlidXRlKCdqc2FjdGlvbicsIHBhcnRzLmpvaW4oJzsnKSk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogUmVnaXN0ZXJzIGEgZnVuY3Rpb24gdGhhdCBzaG91bGQgYmUgaW52b2tlZCB0byByZXBsYXkgZXZlbnRzLlxuICovXG5mdW5jdGlvbiBzZXRFdmVudFJlcGxheWVyKGRpc3BhdGNoZXI6IERpc3BhdGNoZXIpIHtcbiAgZGlzcGF0Y2hlci5zZXRFdmVudFJlcGxheWVyKHF1ZXVlID0+IHtcbiAgICBmb3IgKGNvbnN0IGV2ZW50IG9mIHF1ZXVlKSB7XG4gICAgICBoYW5kbGVFdmVudChldmVudCk7XG4gICAgfVxuICB9KTtcbn1cblxuLyoqXG4gKiBGaW5kcyBhbiBMVmlldyB0aGF0IGEgZ2l2ZW4gRE9NIGVsZW1lbnQgYmVsb25ncyB0by5cbiAqL1xuZnVuY3Rpb24gZ2V0TFZpZXdCeUVsZW1lbnQodGFyZ2V0OiBIVE1MRWxlbWVudCk6IExWaWV3fG51bGwge1xuICBsZXQgbFZpZXcgPSByZWFkTFZpZXcodGFyZ2V0KTtcbiAgaWYgKGxWaWV3KSB7XG4gICAgcmV0dXJuIGxWaWV3O1xuICB9IGVsc2Uge1xuICAgIC8vIElmIHRoaXMgbm9kZSBkb2Vzbid0IGhhdmUgTFZpZXcgaW5mbyBhdHRhY2hlZCwgdGhlbiB3ZSBuZWVkIHRvXG4gICAgLy8gdHJhdmVyc2UgdXB3YXJkcyB1cCB0aGUgRE9NIHRvIGZpbmQgdGhlIG5lYXJlc3QgZWxlbWVudCB0aGF0XG4gICAgLy8gaGFzIGFscmVhZHkgYmVlbiBtb25rZXkgcGF0Y2hlZCB3aXRoIGRhdGEuXG4gICAgbGV0IHBhcmVudCA9IHRhcmdldCBhcyBIVE1MRWxlbWVudDtcbiAgICB3aGlsZSAocGFyZW50ID0gcGFyZW50LnBhcmVudE5vZGUgYXMgSFRNTEVsZW1lbnQpIHtcbiAgICAgIGxWaWV3ID0gcmVhZExWaWV3KHBhcmVudCk7XG4gICAgICBpZiAobFZpZXcpIHtcbiAgICAgICAgLy8gVG8gcHJldmVudCBhZGRpdGlvbmFsIGxvb2t1cHMsIG1vbmtleS1wYXRjaCBMVmlldyBpZCBvbnRvIHRoaXMgRE9NIG5vZGUuXG4gICAgICAgIC8vIFRPRE86IGNvbnNpZGVyIHBhdGNoaW5nIGFsbCBwYXJlbnQgbm9kZXMgdGhhdCBkaWRuJ3QgaGF2ZSBMVmlldyBpZCwgc28gdGhhdFxuICAgICAgICAvLyB3ZSBjYW4gYXZvaWQgbG9va3VwcyBmb3IgbW9yZSBub2Rlcy5cbiAgICAgICAgYXR0YWNoTFZpZXdJZCh0YXJnZXQsIGxWaWV3KTtcbiAgICAgICAgcmV0dXJuIGxWaWV3O1xuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuZnVuY3Rpb24gaGFuZGxlRXZlbnQoZXZlbnQ6IEV2ZW50SW5mb1dyYXBwZXIpIHtcbiAgY29uc3QgbmF0aXZlRWxlbWVudCA9IGV2ZW50LmdldEFjdGlvbigpIS5lbGVtZW50O1xuICAvLyBEaXNwYXRjaCBldmVudCB2aWEgQW5ndWxhcidzIGxvZ2ljXG4gIGlmIChuYXRpdmVFbGVtZW50KSB7XG4gICAgY29uc3QgbFZpZXcgPSBnZXRMVmlld0J5RWxlbWVudChuYXRpdmVFbGVtZW50IGFzIEhUTUxFbGVtZW50KTtcbiAgICBpZiAobFZpZXcgIT09IG51bGwpIHtcbiAgICAgIGNvbnN0IHRWaWV3ID0gbFZpZXdbVFZJRVddO1xuICAgICAgY29uc3QgZXZlbnROYW1lID0gZXZlbnQuZ2V0RXZlbnRUeXBlKCk7XG4gICAgICBjb25zdCBvcmlnRXZlbnQgPSBldmVudC5nZXRFdmVudCgpO1xuICAgICAgY29uc3QgbGlzdGVuZXJzID0gZ2V0RXZlbnRMaXN0ZW5lcnModFZpZXcsIGxWaWV3LCBuYXRpdmVFbGVtZW50LCBldmVudE5hbWUpO1xuICAgICAgZm9yIChjb25zdCBsaXN0ZW5lciBvZiBsaXN0ZW5lcnMpIHtcbiAgICAgICAgbGlzdGVuZXIob3JpZ0V2ZW50KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxudHlwZSBMaXN0ZW5lciA9ICgodmFsdWU6IEV2ZW50KSA9PiB1bmtub3duKXwoKCkgPT4gdW5rbm93bik7XG5cbmZ1bmN0aW9uIGdldEV2ZW50TGlzdGVuZXJzKFxuICAgIHRWaWV3OiBUVmlldywgbFZpZXc6IExWaWV3LCBuYXRpdmVFbGVtZW50OiBFbGVtZW50LCBldmVudE5hbWU6IHN0cmluZyk6IExpc3RlbmVyW10ge1xuICBjb25zdCBsaXN0ZW5lcnM6IExpc3RlbmVyW10gPSBbXTtcbiAgY29uc3QgbENsZWFudXAgPSBsVmlld1tDTEVBTlVQXTtcbiAgY29uc3QgdENsZWFudXAgPSB0Vmlldy5jbGVhbnVwO1xuICBpZiAodENsZWFudXAgJiYgbENsZWFudXApIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRDbGVhbnVwLmxlbmd0aDspIHtcbiAgICAgIGNvbnN0IHN0b3JlZEV2ZW50TmFtZSA9IHRDbGVhbnVwW2krK107XG4gICAgICBjb25zdCBuYXRpdmVFbGVtZW50SW5kZXggPSB0Q2xlYW51cFtpKytdO1xuICAgICAgaWYgKHR5cGVvZiBzdG9yZWRFdmVudE5hbWUgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIGNvbnN0IGxpc3RlbmVyRWxlbWVudCA9IHVud3JhcFJOb2RlKGxWaWV3W25hdGl2ZUVsZW1lbnRJbmRleF0pIGFzIGFueSBhcyBFbGVtZW50O1xuICAgICAgICBjb25zdCBsaXN0ZW5lcjogTGlzdGVuZXIgPSBsQ2xlYW51cFt0Q2xlYW51cFtpKytdXTtcbiAgICAgICAgaSsrOyAgLy8gaW5jcmVtZW50IHRvIHRoZSBuZXh0IHBvc2l0aW9uO1xuICAgICAgICBpZiAobGlzdGVuZXJFbGVtZW50ID09PSBuYXRpdmVFbGVtZW50ICYmIGV2ZW50TmFtZSA9PT0gc3RvcmVkRXZlbnROYW1lKSB7XG4gICAgICAgICAgbGlzdGVuZXJzLnB1c2gobGlzdGVuZXIpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBsaXN0ZW5lcnM7XG59XG4iXX0=