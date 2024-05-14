/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { EventInfoWrapper } from './event_info';
import { EventType } from './event_type';
import { Restriction } from './restriction';
import * as eventLib from './event';
/**
 * Receives a DOM event, determines the jsaction associated with the source
 * element of the DOM event, and invokes the handler associated with the
 * jsaction.
 */
export class Dispatcher {
    /**
     * Options are:
     *   1. `eventReplayer`: When the event contract dispatches replay events
     *      to the Dispatcher, the Dispatcher collects them and in the next tick
     *      dispatches them to the `eventReplayer`.
     * @param dispatchDelegate A function that should handle dispatching an `EventInfoWrapper` to handlers.
     */
    constructor(dispatchDelegate, { eventReplayer = undefined } = {}) {
        this.dispatchDelegate = dispatchDelegate;
        /** The queue of events. */
        this.replayEventInfoWrappers = [];
        /** Whether the event replay is scheduled. */
        this.eventReplayScheduled = false;
        this.eventReplayer = eventReplayer;
    }
    /**
     * Receives an event or the event queue from the EventContract. The event
     * queue is copied and it attempts to replay.
     * If event info is passed in it looks for an action handler that can handle
     * the given event.  If there is no handler registered queues the event and
     * checks if a loader is registered for the given namespace. If so, calls it.
     *
     * Alternatively, if in global dispatch mode, calls all registered global
     * handlers for the appropriate event type.
     *
     * The three functionalities of this call are deliberately not split into
     * three methods (and then declared as an abstract interface), because the
     * interface is used by EventContract, which lives in a different jsbinary.
     * Therefore the interface between the three is defined entirely in terms that
     * are invariant under jscompiler processing (Function and Array, as opposed
     * to a custom type with method names).
     *
     * @param eventInfo The info for the event that triggered this call or the
     *     queue of events from EventContract.
     */
    dispatch(eventInfo) {
        const eventInfoWrapper = new EventInfoWrapper(eventInfo);
        const action = eventInfoWrapper.getAction();
        if (action && shouldPreventDefaultBeforeDispatching(action.element, eventInfoWrapper)) {
            eventLib.preventDefault(eventInfoWrapper.getEvent());
        }
        if (eventInfoWrapper.getIsReplay()) {
            if (!this.eventReplayer) {
                return;
            }
            this.scheduleEventInfoWrapperReplay(eventInfoWrapper);
            return;
        }
        this.dispatchDelegate(eventInfoWrapper);
    }
    /**
     * Schedules an `EventInfoWrapper` for replay. The replaying will happen in its own
     * stack once the current flow cedes control. This is done to mimic
     * browser event handling.
     */
    scheduleEventInfoWrapperReplay(eventInfoWrapper) {
        this.replayEventInfoWrappers.push(eventInfoWrapper);
        if (this.eventReplayScheduled || !this.eventReplayer) {
            return;
        }
        this.eventReplayScheduled = true;
        Promise.resolve().then(() => {
            this.eventReplayScheduled = false;
            this.eventReplayer(this.replayEventInfoWrappers);
        });
    }
}
/** Stop propagation for an `EventInfo`. */
export function stopPropagation(eventInfoWrapper) {
    if (eventLib.isGecko &&
        (eventInfoWrapper.getTargetElement().tagName === 'INPUT' ||
            eventInfoWrapper.getTargetElement().tagName === 'TEXTAREA') &&
        eventInfoWrapper.getEventType() === EventType.FOCUS) {
        /**
         * Do nothing since stopping propagation on a focus event on an input
         * element in Firefox makes the text cursor disappear:
         * https://bugzilla.mozilla.org/show_bug.cgi?id=509684
         */
        return;
    }
    const event = eventInfoWrapper.getEvent();
    // There are some cases where users of the `Dispatcher` will call dispatch
    // with a fake event that does not support `stopPropagation`.
    if (!event.stopPropagation) {
        return;
    }
    event.stopPropagation();
}
/**
 * Returns true if the default action of this event should be prevented before
 * this event is dispatched.
 */
function shouldPreventDefaultBeforeDispatching(actionElement, eventInfoWrapper) {
    // Prevent browser from following <a> node links if a jsaction is present
    // and we are dispatching the action now. Note that the targetElement may be
    // a child of an anchor that has a jsaction attached. For that reason, we
    // need to check the actionElement rather than the targetElement.
    return ((actionElement.tagName === 'A' && eventInfoWrapper.getEventType() === EventType.CLICK) ||
        eventInfoWrapper.getEventType() === EventType.CLICKMOD);
}
/**
 * Registers deferred functionality for an EventContract and a Jsaction
 * Dispatcher.
 */
export function registerDispatcher(eventContract, dispatcher) {
    eventContract.ecrd((eventInfo) => {
        dispatcher.dispatch(eventInfo);
    }, Restriction.I_AM_THE_JSACTION_FRAMEWORK);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlzcGF0Y2hlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvcHJpbWl0aXZlcy9ldmVudC1kaXNwYXRjaC9zcmMvZGlzcGF0Y2hlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQVksZ0JBQWdCLEVBQUMsTUFBTSxjQUFjLENBQUM7QUFDekQsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLGNBQWMsQ0FBQztBQUN2QyxPQUFPLEVBQUMsV0FBVyxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBRTFDLE9BQU8sS0FBSyxRQUFRLE1BQU0sU0FBUyxDQUFDO0FBbUJwQzs7OztHQUlHO0FBQ0gsTUFBTSxPQUFPLFVBQVU7SUFRckI7Ozs7OztPQU1HO0lBQ0gsWUFDbUIsZ0JBQThELEVBQy9FLEVBQUMsYUFBYSxHQUFHLFNBQVMsS0FBZ0MsRUFBRTtRQUQzQyxxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQThDO1FBZmpGLDJCQUEyQjtRQUNWLDRCQUF1QixHQUF1QixFQUFFLENBQUM7UUFHbEUsNkNBQTZDO1FBQ3JDLHlCQUFvQixHQUFHLEtBQUssQ0FBQztRQWFuQyxJQUFJLENBQUMsYUFBYSxHQUFHLGFBQWEsQ0FBQztJQUNyQyxDQUFDO0lBRUQ7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7T0FtQkc7SUFDSCxRQUFRLENBQUMsU0FBb0I7UUFDM0IsTUFBTSxnQkFBZ0IsR0FBRyxJQUFJLGdCQUFnQixDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQ3pELE1BQU0sTUFBTSxHQUFHLGdCQUFnQixDQUFDLFNBQVMsRUFBRSxDQUFDO1FBQzVDLElBQUksTUFBTSxJQUFJLHFDQUFxQyxDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUUsZ0JBQWdCLENBQUMsRUFBRSxDQUFDO1lBQ3RGLFFBQVEsQ0FBQyxjQUFjLENBQUMsZ0JBQWdCLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztRQUN2RCxDQUFDO1FBQ0QsSUFBSSxnQkFBZ0IsQ0FBQyxXQUFXLEVBQUUsRUFBRSxDQUFDO1lBQ25DLElBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7Z0JBQ3hCLE9BQU87WUFDVCxDQUFDO1lBQ0QsSUFBSSxDQUFDLDhCQUE4QixDQUFDLGdCQUFnQixDQUFDLENBQUM7WUFDdEQsT0FBTztRQUNULENBQUM7UUFDRCxJQUFJLENBQUMsZ0JBQWdCLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztJQUMxQyxDQUFDO0lBRUQ7Ozs7T0FJRztJQUNLLDhCQUE4QixDQUFDLGdCQUFrQztRQUN2RSxJQUFJLENBQUMsdUJBQXVCLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLENBQUM7UUFDcEQsSUFBSSxJQUFJLENBQUMsb0JBQW9CLElBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7WUFDckQsT0FBTztRQUNULENBQUM7UUFDRCxJQUFJLENBQUMsb0JBQW9CLEdBQUcsSUFBSSxDQUFDO1FBQ2pDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFO1lBQzFCLElBQUksQ0FBQyxvQkFBb0IsR0FBRyxLQUFLLENBQUM7WUFDbEMsSUFBSSxDQUFDLGFBQWMsQ0FBQyxJQUFJLENBQUMsdUJBQXVCLENBQUMsQ0FBQztRQUNwRCxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUM7Q0FDRjtBQUVELDJDQUEyQztBQUMzQyxNQUFNLFVBQVUsZUFBZSxDQUFDLGdCQUFrQztJQUNoRSxJQUNFLFFBQVEsQ0FBQyxPQUFPO1FBQ2hCLENBQUMsZ0JBQWdCLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQyxPQUFPLEtBQUssT0FBTztZQUN0RCxnQkFBZ0IsQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDLE9BQU8sS0FBSyxVQUFVLENBQUM7UUFDN0QsZ0JBQWdCLENBQUMsWUFBWSxFQUFFLEtBQUssU0FBUyxDQUFDLEtBQUssRUFDbkQsQ0FBQztRQUNEOzs7O1dBSUc7UUFDSCxPQUFPO0lBQ1QsQ0FBQztJQUVELE1BQU0sS0FBSyxHQUFHLGdCQUFnQixDQUFDLFFBQVEsRUFBRSxDQUFDO0lBQzFDLDBFQUEwRTtJQUMxRSw2REFBNkQ7SUFDN0QsSUFBSSxDQUFDLEtBQUssQ0FBQyxlQUFlLEVBQUUsQ0FBQztRQUMzQixPQUFPO0lBQ1QsQ0FBQztJQUNELEtBQUssQ0FBQyxlQUFlLEVBQUUsQ0FBQztBQUMxQixDQUFDO0FBRUQ7OztHQUdHO0FBQ0gsU0FBUyxxQ0FBcUMsQ0FDNUMsYUFBc0IsRUFDdEIsZ0JBQWtDO0lBRWxDLHlFQUF5RTtJQUN6RSw0RUFBNEU7SUFDNUUseUVBQXlFO0lBQ3pFLGlFQUFpRTtJQUNqRSxPQUFPLENBQ0wsQ0FBQyxhQUFhLENBQUMsT0FBTyxLQUFLLEdBQUcsSUFBSSxnQkFBZ0IsQ0FBQyxZQUFZLEVBQUUsS0FBSyxTQUFTLENBQUMsS0FBSyxDQUFDO1FBQ3RGLGdCQUFnQixDQUFDLFlBQVksRUFBRSxLQUFLLFNBQVMsQ0FBQyxRQUFRLENBQ3ZELENBQUM7QUFDSixDQUFDO0FBRUQ7OztHQUdHO0FBQ0gsTUFBTSxVQUFVLGtCQUFrQixDQUFDLGFBQXFDLEVBQUUsVUFBc0I7SUFDOUYsYUFBYSxDQUFDLElBQUksQ0FBQyxDQUFDLFNBQW9CLEVBQUUsRUFBRTtRQUMxQyxVQUFVLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxDQUFDO0lBQ2pDLENBQUMsRUFBRSxXQUFXLENBQUMsMkJBQTJCLENBQUMsQ0FBQztBQUM5QyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7RXZlbnRJbmZvLCBFdmVudEluZm9XcmFwcGVyfSBmcm9tICcuL2V2ZW50X2luZm8nO1xuaW1wb3J0IHtFdmVudFR5cGV9IGZyb20gJy4vZXZlbnRfdHlwZSc7XG5pbXBvcnQge1Jlc3RyaWN0aW9ufSBmcm9tICcuL3Jlc3RyaWN0aW9uJztcbmltcG9ydCB7VW5yZW5hbWVkRXZlbnRDb250cmFjdH0gZnJvbSAnLi9ldmVudGNvbnRyYWN0JztcbmltcG9ydCAqIGFzIGV2ZW50TGliIGZyb20gJy4vZXZlbnQnO1xuXG4vKipcbiAqIEEgcmVwbGF5ZXIgaXMgYSBmdW5jdGlvbiB0aGF0IGlzIGNhbGxlZCB3aGVuIHRoZXJlIGFyZSBxdWV1ZWQgZXZlbnRzLFxuICogZWl0aGVyIGZyb20gdGhlIGBFdmVudENvbnRyYWN0YCBvciB3aGVuIHRoZXJlIGFyZSBubyBkZXRlY3RlZCBoYW5kbGVycy5cbiAqL1xuZXhwb3J0IHR5cGUgUmVwbGF5ZXIgPSAoZXZlbnRJbmZvV3JhcHBlcnM6IEV2ZW50SW5mb1dyYXBwZXJbXSkgPT4gdm9pZDtcblxuLyoqXG4gKiBBIGhhbmRsZXIgaXMgZGlzcGF0Y2hlZCB0byBkdXJpbmcgbm9ybWFsIGhhbmRsaW5nLlxuICovXG5leHBvcnQgdHlwZSBFdmVudEluZm9IYW5kbGVyID0gKGV2ZW50SW5mb1dyYXBwZXI6IEV2ZW50SW5mb1dyYXBwZXIpID0+IHZvaWQ7XG5cbi8qKlxuICogQSBnbG9iYWwgaGFuZGxlciBpcyBkaXNwYXRjaGVkIHRvIGJlZm9yZSBub3JtYWwgaGFuZGxlciBkaXNwYXRjaC4gUmV0dXJuaW5nXG4gKiBmYWxzZSB3aWxsIGBwcmV2ZW50RGVmYXVsdGAgb24gdGhlIGV2ZW50LlxuICovXG5leHBvcnQgdHlwZSBHbG9iYWxIYW5kbGVyID0gKGV2ZW50OiBFdmVudCkgPT4gYm9vbGVhbiB8IHZvaWQ7XG5cbi8qKlxuICogUmVjZWl2ZXMgYSBET00gZXZlbnQsIGRldGVybWluZXMgdGhlIGpzYWN0aW9uIGFzc29jaWF0ZWQgd2l0aCB0aGUgc291cmNlXG4gKiBlbGVtZW50IG9mIHRoZSBET00gZXZlbnQsIGFuZCBpbnZva2VzIHRoZSBoYW5kbGVyIGFzc29jaWF0ZWQgd2l0aCB0aGVcbiAqIGpzYWN0aW9uLlxuICovXG5leHBvcnQgY2xhc3MgRGlzcGF0Y2hlciB7XG4gIC8qKiBUaGUgcXVldWUgb2YgZXZlbnRzLiAqL1xuICBwcml2YXRlIHJlYWRvbmx5IHJlcGxheUV2ZW50SW5mb1dyYXBwZXJzOiBFdmVudEluZm9XcmFwcGVyW10gPSBbXTtcbiAgLyoqIFRoZSByZXBsYXllciBmdW5jdGlvbiB0byBiZSBjYWxsZWQgd2hlbiB0aGVyZSBhcmUgcXVldWVkIGV2ZW50cy4gKi9cbiAgcHJpdmF0ZSBldmVudFJlcGxheWVyPzogUmVwbGF5ZXI7XG4gIC8qKiBXaGV0aGVyIHRoZSBldmVudCByZXBsYXkgaXMgc2NoZWR1bGVkLiAqL1xuICBwcml2YXRlIGV2ZW50UmVwbGF5U2NoZWR1bGVkID0gZmFsc2U7XG5cbiAgLyoqXG4gICAqIE9wdGlvbnMgYXJlOlxuICAgKiAgIDEuIGBldmVudFJlcGxheWVyYDogV2hlbiB0aGUgZXZlbnQgY29udHJhY3QgZGlzcGF0Y2hlcyByZXBsYXkgZXZlbnRzXG4gICAqICAgICAgdG8gdGhlIERpc3BhdGNoZXIsIHRoZSBEaXNwYXRjaGVyIGNvbGxlY3RzIHRoZW0gYW5kIGluIHRoZSBuZXh0IHRpY2tcbiAgICogICAgICBkaXNwYXRjaGVzIHRoZW0gdG8gdGhlIGBldmVudFJlcGxheWVyYC5cbiAgICogQHBhcmFtIGRpc3BhdGNoRGVsZWdhdGUgQSBmdW5jdGlvbiB0aGF0IHNob3VsZCBoYW5kbGUgZGlzcGF0Y2hpbmcgYW4gYEV2ZW50SW5mb1dyYXBwZXJgIHRvIGhhbmRsZXJzLlxuICAgKi9cbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSByZWFkb25seSBkaXNwYXRjaERlbGVnYXRlOiAoZXZlbnRJbmZvV3JhcHBlcjogRXZlbnRJbmZvV3JhcHBlcikgPT4gdm9pZCxcbiAgICB7ZXZlbnRSZXBsYXllciA9IHVuZGVmaW5lZH06IHtldmVudFJlcGxheWVyPzogUmVwbGF5ZXJ9ID0ge30sXG4gICkge1xuICAgIHRoaXMuZXZlbnRSZXBsYXllciA9IGV2ZW50UmVwbGF5ZXI7XG4gIH1cblxuICAvKipcbiAgICogUmVjZWl2ZXMgYW4gZXZlbnQgb3IgdGhlIGV2ZW50IHF1ZXVlIGZyb20gdGhlIEV2ZW50Q29udHJhY3QuIFRoZSBldmVudFxuICAgKiBxdWV1ZSBpcyBjb3BpZWQgYW5kIGl0IGF0dGVtcHRzIHRvIHJlcGxheS5cbiAgICogSWYgZXZlbnQgaW5mbyBpcyBwYXNzZWQgaW4gaXQgbG9va3MgZm9yIGFuIGFjdGlvbiBoYW5kbGVyIHRoYXQgY2FuIGhhbmRsZVxuICAgKiB0aGUgZ2l2ZW4gZXZlbnQuICBJZiB0aGVyZSBpcyBubyBoYW5kbGVyIHJlZ2lzdGVyZWQgcXVldWVzIHRoZSBldmVudCBhbmRcbiAgICogY2hlY2tzIGlmIGEgbG9hZGVyIGlzIHJlZ2lzdGVyZWQgZm9yIHRoZSBnaXZlbiBuYW1lc3BhY2UuIElmIHNvLCBjYWxscyBpdC5cbiAgICpcbiAgICogQWx0ZXJuYXRpdmVseSwgaWYgaW4gZ2xvYmFsIGRpc3BhdGNoIG1vZGUsIGNhbGxzIGFsbCByZWdpc3RlcmVkIGdsb2JhbFxuICAgKiBoYW5kbGVycyBmb3IgdGhlIGFwcHJvcHJpYXRlIGV2ZW50IHR5cGUuXG4gICAqXG4gICAqIFRoZSB0aHJlZSBmdW5jdGlvbmFsaXRpZXMgb2YgdGhpcyBjYWxsIGFyZSBkZWxpYmVyYXRlbHkgbm90IHNwbGl0IGludG9cbiAgICogdGhyZWUgbWV0aG9kcyAoYW5kIHRoZW4gZGVjbGFyZWQgYXMgYW4gYWJzdHJhY3QgaW50ZXJmYWNlKSwgYmVjYXVzZSB0aGVcbiAgICogaW50ZXJmYWNlIGlzIHVzZWQgYnkgRXZlbnRDb250cmFjdCwgd2hpY2ggbGl2ZXMgaW4gYSBkaWZmZXJlbnQganNiaW5hcnkuXG4gICAqIFRoZXJlZm9yZSB0aGUgaW50ZXJmYWNlIGJldHdlZW4gdGhlIHRocmVlIGlzIGRlZmluZWQgZW50aXJlbHkgaW4gdGVybXMgdGhhdFxuICAgKiBhcmUgaW52YXJpYW50IHVuZGVyIGpzY29tcGlsZXIgcHJvY2Vzc2luZyAoRnVuY3Rpb24gYW5kIEFycmF5LCBhcyBvcHBvc2VkXG4gICAqIHRvIGEgY3VzdG9tIHR5cGUgd2l0aCBtZXRob2QgbmFtZXMpLlxuICAgKlxuICAgKiBAcGFyYW0gZXZlbnRJbmZvIFRoZSBpbmZvIGZvciB0aGUgZXZlbnQgdGhhdCB0cmlnZ2VyZWQgdGhpcyBjYWxsIG9yIHRoZVxuICAgKiAgICAgcXVldWUgb2YgZXZlbnRzIGZyb20gRXZlbnRDb250cmFjdC5cbiAgICovXG4gIGRpc3BhdGNoKGV2ZW50SW5mbzogRXZlbnRJbmZvKTogdm9pZCB7XG4gICAgY29uc3QgZXZlbnRJbmZvV3JhcHBlciA9IG5ldyBFdmVudEluZm9XcmFwcGVyKGV2ZW50SW5mbyk7XG4gICAgY29uc3QgYWN0aW9uID0gZXZlbnRJbmZvV3JhcHBlci5nZXRBY3Rpb24oKTtcbiAgICBpZiAoYWN0aW9uICYmIHNob3VsZFByZXZlbnREZWZhdWx0QmVmb3JlRGlzcGF0Y2hpbmcoYWN0aW9uLmVsZW1lbnQsIGV2ZW50SW5mb1dyYXBwZXIpKSB7XG4gICAgICBldmVudExpYi5wcmV2ZW50RGVmYXVsdChldmVudEluZm9XcmFwcGVyLmdldEV2ZW50KCkpO1xuICAgIH1cbiAgICBpZiAoZXZlbnRJbmZvV3JhcHBlci5nZXRJc1JlcGxheSgpKSB7XG4gICAgICBpZiAoIXRoaXMuZXZlbnRSZXBsYXllcikge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICB0aGlzLnNjaGVkdWxlRXZlbnRJbmZvV3JhcHBlclJlcGxheShldmVudEluZm9XcmFwcGVyKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5kaXNwYXRjaERlbGVnYXRlKGV2ZW50SW5mb1dyYXBwZXIpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNjaGVkdWxlcyBhbiBgRXZlbnRJbmZvV3JhcHBlcmAgZm9yIHJlcGxheS4gVGhlIHJlcGxheWluZyB3aWxsIGhhcHBlbiBpbiBpdHMgb3duXG4gICAqIHN0YWNrIG9uY2UgdGhlIGN1cnJlbnQgZmxvdyBjZWRlcyBjb250cm9sLiBUaGlzIGlzIGRvbmUgdG8gbWltaWNcbiAgICogYnJvd3NlciBldmVudCBoYW5kbGluZy5cbiAgICovXG4gIHByaXZhdGUgc2NoZWR1bGVFdmVudEluZm9XcmFwcGVyUmVwbGF5KGV2ZW50SW5mb1dyYXBwZXI6IEV2ZW50SW5mb1dyYXBwZXIpIHtcbiAgICB0aGlzLnJlcGxheUV2ZW50SW5mb1dyYXBwZXJzLnB1c2goZXZlbnRJbmZvV3JhcHBlcik7XG4gICAgaWYgKHRoaXMuZXZlbnRSZXBsYXlTY2hlZHVsZWQgfHwgIXRoaXMuZXZlbnRSZXBsYXllcikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLmV2ZW50UmVwbGF5U2NoZWR1bGVkID0gdHJ1ZTtcbiAgICBQcm9taXNlLnJlc29sdmUoKS50aGVuKCgpID0+IHtcbiAgICAgIHRoaXMuZXZlbnRSZXBsYXlTY2hlZHVsZWQgPSBmYWxzZTtcbiAgICAgIHRoaXMuZXZlbnRSZXBsYXllciEodGhpcy5yZXBsYXlFdmVudEluZm9XcmFwcGVycyk7XG4gICAgfSk7XG4gIH1cbn1cblxuLyoqIFN0b3AgcHJvcGFnYXRpb24gZm9yIGFuIGBFdmVudEluZm9gLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHN0b3BQcm9wYWdhdGlvbihldmVudEluZm9XcmFwcGVyOiBFdmVudEluZm9XcmFwcGVyKSB7XG4gIGlmIChcbiAgICBldmVudExpYi5pc0dlY2tvICYmXG4gICAgKGV2ZW50SW5mb1dyYXBwZXIuZ2V0VGFyZ2V0RWxlbWVudCgpLnRhZ05hbWUgPT09ICdJTlBVVCcgfHxcbiAgICAgIGV2ZW50SW5mb1dyYXBwZXIuZ2V0VGFyZ2V0RWxlbWVudCgpLnRhZ05hbWUgPT09ICdURVhUQVJFQScpICYmXG4gICAgZXZlbnRJbmZvV3JhcHBlci5nZXRFdmVudFR5cGUoKSA9PT0gRXZlbnRUeXBlLkZPQ1VTXG4gICkge1xuICAgIC8qKlxuICAgICAqIERvIG5vdGhpbmcgc2luY2Ugc3RvcHBpbmcgcHJvcGFnYXRpb24gb24gYSBmb2N1cyBldmVudCBvbiBhbiBpbnB1dFxuICAgICAqIGVsZW1lbnQgaW4gRmlyZWZveCBtYWtlcyB0aGUgdGV4dCBjdXJzb3IgZGlzYXBwZWFyOlxuICAgICAqIGh0dHBzOi8vYnVnemlsbGEubW96aWxsYS5vcmcvc2hvd19idWcuY2dpP2lkPTUwOTY4NFxuICAgICAqL1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvbnN0IGV2ZW50ID0gZXZlbnRJbmZvV3JhcHBlci5nZXRFdmVudCgpO1xuICAvLyBUaGVyZSBhcmUgc29tZSBjYXNlcyB3aGVyZSB1c2VycyBvZiB0aGUgYERpc3BhdGNoZXJgIHdpbGwgY2FsbCBkaXNwYXRjaFxuICAvLyB3aXRoIGEgZmFrZSBldmVudCB0aGF0IGRvZXMgbm90IHN1cHBvcnQgYHN0b3BQcm9wYWdhdGlvbmAuXG4gIGlmICghZXZlbnQuc3RvcFByb3BhZ2F0aW9uKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xufVxuXG4vKipcbiAqIFJldHVybnMgdHJ1ZSBpZiB0aGUgZGVmYXVsdCBhY3Rpb24gb2YgdGhpcyBldmVudCBzaG91bGQgYmUgcHJldmVudGVkIGJlZm9yZVxuICogdGhpcyBldmVudCBpcyBkaXNwYXRjaGVkLlxuICovXG5mdW5jdGlvbiBzaG91bGRQcmV2ZW50RGVmYXVsdEJlZm9yZURpc3BhdGNoaW5nKFxuICBhY3Rpb25FbGVtZW50OiBFbGVtZW50LFxuICBldmVudEluZm9XcmFwcGVyOiBFdmVudEluZm9XcmFwcGVyLFxuKTogYm9vbGVhbiB7XG4gIC8vIFByZXZlbnQgYnJvd3NlciBmcm9tIGZvbGxvd2luZyA8YT4gbm9kZSBsaW5rcyBpZiBhIGpzYWN0aW9uIGlzIHByZXNlbnRcbiAgLy8gYW5kIHdlIGFyZSBkaXNwYXRjaGluZyB0aGUgYWN0aW9uIG5vdy4gTm90ZSB0aGF0IHRoZSB0YXJnZXRFbGVtZW50IG1heSBiZVxuICAvLyBhIGNoaWxkIG9mIGFuIGFuY2hvciB0aGF0IGhhcyBhIGpzYWN0aW9uIGF0dGFjaGVkLiBGb3IgdGhhdCByZWFzb24sIHdlXG4gIC8vIG5lZWQgdG8gY2hlY2sgdGhlIGFjdGlvbkVsZW1lbnQgcmF0aGVyIHRoYW4gdGhlIHRhcmdldEVsZW1lbnQuXG4gIHJldHVybiAoXG4gICAgKGFjdGlvbkVsZW1lbnQudGFnTmFtZSA9PT0gJ0EnICYmIGV2ZW50SW5mb1dyYXBwZXIuZ2V0RXZlbnRUeXBlKCkgPT09IEV2ZW50VHlwZS5DTElDSykgfHxcbiAgICBldmVudEluZm9XcmFwcGVyLmdldEV2ZW50VHlwZSgpID09PSBFdmVudFR5cGUuQ0xJQ0tNT0RcbiAgKTtcbn1cblxuLyoqXG4gKiBSZWdpc3RlcnMgZGVmZXJyZWQgZnVuY3Rpb25hbGl0eSBmb3IgYW4gRXZlbnRDb250cmFjdCBhbmQgYSBKc2FjdGlvblxuICogRGlzcGF0Y2hlci5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlZ2lzdGVyRGlzcGF0Y2hlcihldmVudENvbnRyYWN0OiBVbnJlbmFtZWRFdmVudENvbnRyYWN0LCBkaXNwYXRjaGVyOiBEaXNwYXRjaGVyKSB7XG4gIGV2ZW50Q29udHJhY3QuZWNyZCgoZXZlbnRJbmZvOiBFdmVudEluZm8pID0+IHtcbiAgICBkaXNwYXRjaGVyLmRpc3BhdGNoKGV2ZW50SW5mbyk7XG4gIH0sIFJlc3RyaWN0aW9uLklfQU1fVEhFX0pTQUNUSU9OX0ZSQU1FV09SSyk7XG59XG4iXX0=