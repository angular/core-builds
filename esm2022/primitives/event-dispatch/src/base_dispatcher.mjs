/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { EventInfoWrapper } from './event_info';
import { Restriction } from './restriction';
/**
 * Receives a DOM event, determines the jsaction associated with the source
 * element of the DOM event, and invokes the handler associated with the
 * jsaction.
 */
export class BaseDispatcher {
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
        this.queuedEventInfoWrappers = [];
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
     * @param isGlobalDispatch If true, dispatches a global event instead of a
     *     regular jsaction handler.
     */
    dispatch(eventInfo, isGlobalDispatch) {
        const eventInfoWrapper = new EventInfoWrapper(eventInfo);
        if (eventInfoWrapper.getIsReplay()) {
            if (isGlobalDispatch || !this.eventReplayer) {
                return;
            }
            this.queueEventInfoWrapper(eventInfoWrapper);
            this.scheduleEventReplay();
            return;
        }
        this.dispatchDelegate(eventInfoWrapper, isGlobalDispatch);
    }
    /** Queue an `EventInfoWrapper` for replay. */
    queueEventInfoWrapper(eventInfoWrapper) {
        this.queuedEventInfoWrappers.push(eventInfoWrapper);
    }
    /**
     * Replays queued events, if any. The replaying will happen in its own
     * stack once the current flow cedes control. This is done to mimic
     * browser event handling.
     */
    scheduleEventReplay() {
        if (this.eventReplayScheduled ||
            !this.eventReplayer ||
            this.queuedEventInfoWrappers.length === 0) {
            return;
        }
        this.eventReplayScheduled = true;
        Promise.resolve().then(() => {
            this.eventReplayScheduled = false;
            this.eventReplayer(this.queuedEventInfoWrappers);
        });
    }
}
/**
 * Registers deferred functionality for an EventContract and a Jsaction
 * Dispatcher.
 */
export function registerDispatcher(eventContract, dispatcher) {
    eventContract.ecrd((eventInfo, globalDispatch) => {
        dispatcher.dispatch(eventInfo, globalDispatch);
    }, Restriction.I_AM_THE_JSACTION_FRAMEWORK);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFzZV9kaXNwYXRjaGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9wcmltaXRpdmVzL2V2ZW50LWRpc3BhdGNoL3NyYy9iYXNlX2Rpc3BhdGNoZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFZLGdCQUFnQixFQUFDLE1BQU0sY0FBYyxDQUFDO0FBRXpELE9BQU8sRUFBQyxXQUFXLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFVMUM7Ozs7R0FJRztBQUNILE1BQU0sT0FBTyxjQUFjO0lBUXpCOzs7Ozs7T0FNRztJQUNILFlBQ21CLGdCQUdSLEVBQ1QsRUFBQyxhQUFhLEdBQUcsU0FBUyxLQUFnQyxFQUFFO1FBSjNDLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FHeEI7UUFsQlgsMkJBQTJCO1FBQ1YsNEJBQXVCLEdBQXVCLEVBQUUsQ0FBQztRQUdsRSw2Q0FBNkM7UUFDckMseUJBQW9CLEdBQUcsS0FBSyxDQUFDO1FBZ0JuQyxJQUFJLENBQUMsYUFBYSxHQUFHLGFBQWEsQ0FBQztJQUNyQyxDQUFDO0lBRUQ7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztPQXFCRztJQUNILFFBQVEsQ0FBQyxTQUFvQixFQUFFLGdCQUEwQjtRQUN2RCxNQUFNLGdCQUFnQixHQUFHLElBQUksZ0JBQWdCLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDekQsSUFBSSxnQkFBZ0IsQ0FBQyxXQUFXLEVBQUUsRUFBRSxDQUFDO1lBQ25DLElBQUksZ0JBQWdCLElBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7Z0JBQzVDLE9BQU87WUFDVCxDQUFDO1lBQ0QsSUFBSSxDQUFDLHFCQUFxQixDQUFDLGdCQUFnQixDQUFDLENBQUM7WUFDN0MsSUFBSSxDQUFDLG1CQUFtQixFQUFFLENBQUM7WUFDM0IsT0FBTztRQUNULENBQUM7UUFDRCxJQUFJLENBQUMsZ0JBQWdCLENBQUMsZ0JBQWdCLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztJQUM1RCxDQUFDO0lBRUQsOENBQThDO0lBQzlDLHFCQUFxQixDQUFDLGdCQUFrQztRQUN0RCxJQUFJLENBQUMsdUJBQXVCLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLENBQUM7SUFDdEQsQ0FBQztJQUVEOzs7O09BSUc7SUFDSCxtQkFBbUI7UUFDakIsSUFDRSxJQUFJLENBQUMsb0JBQW9CO1lBQ3pCLENBQUMsSUFBSSxDQUFDLGFBQWE7WUFDbkIsSUFBSSxDQUFDLHVCQUF1QixDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQ3pDLENBQUM7WUFDRCxPQUFPO1FBQ1QsQ0FBQztRQUNELElBQUksQ0FBQyxvQkFBb0IsR0FBRyxJQUFJLENBQUM7UUFDakMsT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUU7WUFDMUIsSUFBSSxDQUFDLG9CQUFvQixHQUFHLEtBQUssQ0FBQztZQUNsQyxJQUFJLENBQUMsYUFBYyxDQUFDLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDO1FBQ3BELENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBRUQ7OztHQUdHO0FBQ0gsTUFBTSxVQUFVLGtCQUFrQixDQUNoQyxhQUFxQyxFQUNyQyxVQUEwQjtJQUUxQixhQUFhLENBQUMsSUFBSSxDQUFDLENBQUMsU0FBb0IsRUFBRSxjQUF3QixFQUFFLEVBQUU7UUFDcEUsVUFBVSxDQUFDLFFBQVEsQ0FBQyxTQUFTLEVBQUUsY0FBYyxDQUFDLENBQUM7SUFDakQsQ0FBQyxFQUFFLFdBQVcsQ0FBQywyQkFBMkIsQ0FBQyxDQUFDO0FBQzlDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtFdmVudEluZm8sIEV2ZW50SW5mb1dyYXBwZXJ9IGZyb20gJy4vZXZlbnRfaW5mbyc7XG5pbXBvcnQge1VucmVuYW1lZEV2ZW50Q29udHJhY3R9IGZyb20gJy4vZXZlbnRjb250cmFjdCc7XG5pbXBvcnQge1Jlc3RyaWN0aW9ufSBmcm9tICcuL3Jlc3RyaWN0aW9uJztcbi8qKlxuICogQSByZXBsYXllciBpcyBhIGZ1bmN0aW9uIHRoYXQgaXMgY2FsbGVkIHdoZW4gdGhlcmUgYXJlIHF1ZXVlZCBldmVudHMsXG4gKiBlaXRoZXIgZnJvbSB0aGUgYEV2ZW50Q29udHJhY3RgIG9yIHdoZW4gdGhlcmUgYXJlIG5vIGRldGVjdGVkIGhhbmRsZXJzLlxuICovXG5leHBvcnQgdHlwZSBSZXBsYXllciA9IChldmVudEluZm9XcmFwcGVyczogRXZlbnRJbmZvV3JhcHBlcltdKSA9PiB2b2lkO1xuLyoqXG4gKiBBIGhhbmRsZXIgaXMgZGlzcGF0Y2hlZCB0byBkdXJpbmcgbm9ybWFsIGhhbmRsaW5nLlxuICovXG5leHBvcnQgdHlwZSBFdmVudEluZm9XcmFwcGVySGFuZGxlciA9IChldmVudEluZm9XcmFwcGVyOiBFdmVudEluZm9XcmFwcGVyKSA9PiB2b2lkO1xuLyoqXG4gKiBSZWNlaXZlcyBhIERPTSBldmVudCwgZGV0ZXJtaW5lcyB0aGUganNhY3Rpb24gYXNzb2NpYXRlZCB3aXRoIHRoZSBzb3VyY2VcbiAqIGVsZW1lbnQgb2YgdGhlIERPTSBldmVudCwgYW5kIGludm9rZXMgdGhlIGhhbmRsZXIgYXNzb2NpYXRlZCB3aXRoIHRoZVxuICoganNhY3Rpb24uXG4gKi9cbmV4cG9ydCBjbGFzcyBCYXNlRGlzcGF0Y2hlciB7XG4gIC8qKiBUaGUgcXVldWUgb2YgZXZlbnRzLiAqL1xuICBwcml2YXRlIHJlYWRvbmx5IHF1ZXVlZEV2ZW50SW5mb1dyYXBwZXJzOiBFdmVudEluZm9XcmFwcGVyW10gPSBbXTtcbiAgLyoqIFRoZSByZXBsYXllciBmdW5jdGlvbiB0byBiZSBjYWxsZWQgd2hlbiB0aGVyZSBhcmUgcXVldWVkIGV2ZW50cy4gKi9cbiAgcHJpdmF0ZSBldmVudFJlcGxheWVyPzogUmVwbGF5ZXI7XG4gIC8qKiBXaGV0aGVyIHRoZSBldmVudCByZXBsYXkgaXMgc2NoZWR1bGVkLiAqL1xuICBwcml2YXRlIGV2ZW50UmVwbGF5U2NoZWR1bGVkID0gZmFsc2U7XG5cbiAgLyoqXG4gICAqIE9wdGlvbnMgYXJlOlxuICAgKiAgIDEuIGBldmVudFJlcGxheWVyYDogV2hlbiB0aGUgZXZlbnQgY29udHJhY3QgZGlzcGF0Y2hlcyByZXBsYXkgZXZlbnRzXG4gICAqICAgICAgdG8gdGhlIERpc3BhdGNoZXIsIHRoZSBEaXNwYXRjaGVyIGNvbGxlY3RzIHRoZW0gYW5kIGluIHRoZSBuZXh0IHRpY2tcbiAgICogICAgICBkaXNwYXRjaGVzIHRoZW0gdG8gdGhlIGBldmVudFJlcGxheWVyYC5cbiAgICogQHBhcmFtIGRpc3BhdGNoRGVsZWdhdGUgQSBmdW5jdGlvbiB0aGF0IHNob3VsZCBoYW5kbGUgZGlzcGF0Y2hpbmcgYW4gYEV2ZW50SW5mb1dyYXBwZXJgIHRvIGhhbmRsZXJzLlxuICAgKi9cbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSByZWFkb25seSBkaXNwYXRjaERlbGVnYXRlOiAoXG4gICAgICBldmVudEluZm9XcmFwcGVyOiBFdmVudEluZm9XcmFwcGVyLFxuICAgICAgaXNHbG9iYWxEaXNwYXRjaD86IGJvb2xlYW4sXG4gICAgKSA9PiB2b2lkLFxuICAgIHtldmVudFJlcGxheWVyID0gdW5kZWZpbmVkfToge2V2ZW50UmVwbGF5ZXI/OiBSZXBsYXllcn0gPSB7fSxcbiAgKSB7XG4gICAgdGhpcy5ldmVudFJlcGxheWVyID0gZXZlbnRSZXBsYXllcjtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZWNlaXZlcyBhbiBldmVudCBvciB0aGUgZXZlbnQgcXVldWUgZnJvbSB0aGUgRXZlbnRDb250cmFjdC4gVGhlIGV2ZW50XG4gICAqIHF1ZXVlIGlzIGNvcGllZCBhbmQgaXQgYXR0ZW1wdHMgdG8gcmVwbGF5LlxuICAgKiBJZiBldmVudCBpbmZvIGlzIHBhc3NlZCBpbiBpdCBsb29rcyBmb3IgYW4gYWN0aW9uIGhhbmRsZXIgdGhhdCBjYW4gaGFuZGxlXG4gICAqIHRoZSBnaXZlbiBldmVudC4gIElmIHRoZXJlIGlzIG5vIGhhbmRsZXIgcmVnaXN0ZXJlZCBxdWV1ZXMgdGhlIGV2ZW50IGFuZFxuICAgKiBjaGVja3MgaWYgYSBsb2FkZXIgaXMgcmVnaXN0ZXJlZCBmb3IgdGhlIGdpdmVuIG5hbWVzcGFjZS4gSWYgc28sIGNhbGxzIGl0LlxuICAgKlxuICAgKiBBbHRlcm5hdGl2ZWx5LCBpZiBpbiBnbG9iYWwgZGlzcGF0Y2ggbW9kZSwgY2FsbHMgYWxsIHJlZ2lzdGVyZWQgZ2xvYmFsXG4gICAqIGhhbmRsZXJzIGZvciB0aGUgYXBwcm9wcmlhdGUgZXZlbnQgdHlwZS5cbiAgICpcbiAgICogVGhlIHRocmVlIGZ1bmN0aW9uYWxpdGllcyBvZiB0aGlzIGNhbGwgYXJlIGRlbGliZXJhdGVseSBub3Qgc3BsaXQgaW50b1xuICAgKiB0aHJlZSBtZXRob2RzIChhbmQgdGhlbiBkZWNsYXJlZCBhcyBhbiBhYnN0cmFjdCBpbnRlcmZhY2UpLCBiZWNhdXNlIHRoZVxuICAgKiBpbnRlcmZhY2UgaXMgdXNlZCBieSBFdmVudENvbnRyYWN0LCB3aGljaCBsaXZlcyBpbiBhIGRpZmZlcmVudCBqc2JpbmFyeS5cbiAgICogVGhlcmVmb3JlIHRoZSBpbnRlcmZhY2UgYmV0d2VlbiB0aGUgdGhyZWUgaXMgZGVmaW5lZCBlbnRpcmVseSBpbiB0ZXJtcyB0aGF0XG4gICAqIGFyZSBpbnZhcmlhbnQgdW5kZXIganNjb21waWxlciBwcm9jZXNzaW5nIChGdW5jdGlvbiBhbmQgQXJyYXksIGFzIG9wcG9zZWRcbiAgICogdG8gYSBjdXN0b20gdHlwZSB3aXRoIG1ldGhvZCBuYW1lcykuXG4gICAqXG4gICAqIEBwYXJhbSBldmVudEluZm8gVGhlIGluZm8gZm9yIHRoZSBldmVudCB0aGF0IHRyaWdnZXJlZCB0aGlzIGNhbGwgb3IgdGhlXG4gICAqICAgICBxdWV1ZSBvZiBldmVudHMgZnJvbSBFdmVudENvbnRyYWN0LlxuICAgKiBAcGFyYW0gaXNHbG9iYWxEaXNwYXRjaCBJZiB0cnVlLCBkaXNwYXRjaGVzIGEgZ2xvYmFsIGV2ZW50IGluc3RlYWQgb2YgYVxuICAgKiAgICAgcmVndWxhciBqc2FjdGlvbiBoYW5kbGVyLlxuICAgKi9cbiAgZGlzcGF0Y2goZXZlbnRJbmZvOiBFdmVudEluZm8sIGlzR2xvYmFsRGlzcGF0Y2g/OiBib29sZWFuKTogdm9pZCB7XG4gICAgY29uc3QgZXZlbnRJbmZvV3JhcHBlciA9IG5ldyBFdmVudEluZm9XcmFwcGVyKGV2ZW50SW5mbyk7XG4gICAgaWYgKGV2ZW50SW5mb1dyYXBwZXIuZ2V0SXNSZXBsYXkoKSkge1xuICAgICAgaWYgKGlzR2xvYmFsRGlzcGF0Y2ggfHwgIXRoaXMuZXZlbnRSZXBsYXllcikge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICB0aGlzLnF1ZXVlRXZlbnRJbmZvV3JhcHBlcihldmVudEluZm9XcmFwcGVyKTtcbiAgICAgIHRoaXMuc2NoZWR1bGVFdmVudFJlcGxheSgpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLmRpc3BhdGNoRGVsZWdhdGUoZXZlbnRJbmZvV3JhcHBlciwgaXNHbG9iYWxEaXNwYXRjaCk7XG4gIH1cblxuICAvKiogUXVldWUgYW4gYEV2ZW50SW5mb1dyYXBwZXJgIGZvciByZXBsYXkuICovXG4gIHF1ZXVlRXZlbnRJbmZvV3JhcHBlcihldmVudEluZm9XcmFwcGVyOiBFdmVudEluZm9XcmFwcGVyKSB7XG4gICAgdGhpcy5xdWV1ZWRFdmVudEluZm9XcmFwcGVycy5wdXNoKGV2ZW50SW5mb1dyYXBwZXIpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlcGxheXMgcXVldWVkIGV2ZW50cywgaWYgYW55LiBUaGUgcmVwbGF5aW5nIHdpbGwgaGFwcGVuIGluIGl0cyBvd25cbiAgICogc3RhY2sgb25jZSB0aGUgY3VycmVudCBmbG93IGNlZGVzIGNvbnRyb2wuIFRoaXMgaXMgZG9uZSB0byBtaW1pY1xuICAgKiBicm93c2VyIGV2ZW50IGhhbmRsaW5nLlxuICAgKi9cbiAgc2NoZWR1bGVFdmVudFJlcGxheSgpIHtcbiAgICBpZiAoXG4gICAgICB0aGlzLmV2ZW50UmVwbGF5U2NoZWR1bGVkIHx8XG4gICAgICAhdGhpcy5ldmVudFJlcGxheWVyIHx8XG4gICAgICB0aGlzLnF1ZXVlZEV2ZW50SW5mb1dyYXBwZXJzLmxlbmd0aCA9PT0gMFxuICAgICkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLmV2ZW50UmVwbGF5U2NoZWR1bGVkID0gdHJ1ZTtcbiAgICBQcm9taXNlLnJlc29sdmUoKS50aGVuKCgpID0+IHtcbiAgICAgIHRoaXMuZXZlbnRSZXBsYXlTY2hlZHVsZWQgPSBmYWxzZTtcbiAgICAgIHRoaXMuZXZlbnRSZXBsYXllciEodGhpcy5xdWV1ZWRFdmVudEluZm9XcmFwcGVycyk7XG4gICAgfSk7XG4gIH1cbn1cblxuLyoqXG4gKiBSZWdpc3RlcnMgZGVmZXJyZWQgZnVuY3Rpb25hbGl0eSBmb3IgYW4gRXZlbnRDb250cmFjdCBhbmQgYSBKc2FjdGlvblxuICogRGlzcGF0Y2hlci5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlZ2lzdGVyRGlzcGF0Y2hlcihcbiAgZXZlbnRDb250cmFjdDogVW5yZW5hbWVkRXZlbnRDb250cmFjdCxcbiAgZGlzcGF0Y2hlcjogQmFzZURpc3BhdGNoZXIsXG4pIHtcbiAgZXZlbnRDb250cmFjdC5lY3JkKChldmVudEluZm86IEV2ZW50SW5mbywgZ2xvYmFsRGlzcGF0Y2g/OiBib29sZWFuKSA9PiB7XG4gICAgZGlzcGF0Y2hlci5kaXNwYXRjaChldmVudEluZm8sIGdsb2JhbERpc3BhdGNoKTtcbiAgfSwgUmVzdHJpY3Rpb24uSV9BTV9USEVfSlNBQ1RJT05fRlJBTUVXT1JLKTtcbn1cbiJdfQ==