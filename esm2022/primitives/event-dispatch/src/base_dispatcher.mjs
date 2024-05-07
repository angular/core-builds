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
     */
    dispatch(eventInfo) {
        const eventInfoWrapper = new EventInfoWrapper(eventInfo);
        if (eventInfoWrapper.getIsReplay()) {
            if (!this.eventReplayer) {
                return;
            }
            this.queueEventInfoWrapper(eventInfoWrapper);
            this.scheduleEventReplay();
            return;
        }
        this.dispatchDelegate(eventInfoWrapper);
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
    eventContract.ecrd((eventInfo) => {
        dispatcher.dispatch(eventInfo);
    }, Restriction.I_AM_THE_JSACTION_FRAMEWORK);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFzZV9kaXNwYXRjaGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9wcmltaXRpdmVzL2V2ZW50LWRpc3BhdGNoL3NyYy9iYXNlX2Rpc3BhdGNoZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFZLGdCQUFnQixFQUFDLE1BQU0sY0FBYyxDQUFDO0FBRXpELE9BQU8sRUFBQyxXQUFXLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFVMUM7Ozs7R0FJRztBQUNILE1BQU0sT0FBTyxjQUFjO0lBUXpCOzs7Ozs7T0FNRztJQUNILFlBQ21CLGdCQUE4RCxFQUMvRSxFQUFDLGFBQWEsR0FBRyxTQUFTLEtBQWdDLEVBQUU7UUFEM0MscUJBQWdCLEdBQWhCLGdCQUFnQixDQUE4QztRQWZqRiwyQkFBMkI7UUFDViw0QkFBdUIsR0FBdUIsRUFBRSxDQUFDO1FBR2xFLDZDQUE2QztRQUNyQyx5QkFBb0IsR0FBRyxLQUFLLENBQUM7UUFhbkMsSUFBSSxDQUFDLGFBQWEsR0FBRyxhQUFhLENBQUM7SUFDckMsQ0FBQztJQUVEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O09BbUJHO0lBQ0gsUUFBUSxDQUFDLFNBQW9CO1FBQzNCLE1BQU0sZ0JBQWdCLEdBQUcsSUFBSSxnQkFBZ0IsQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUN6RCxJQUFJLGdCQUFnQixDQUFDLFdBQVcsRUFBRSxFQUFFLENBQUM7WUFDbkMsSUFBSSxDQUFDLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztnQkFDeEIsT0FBTztZQUNULENBQUM7WUFDRCxJQUFJLENBQUMscUJBQXFCLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztZQUM3QyxJQUFJLENBQUMsbUJBQW1CLEVBQUUsQ0FBQztZQUMzQixPQUFPO1FBQ1QsQ0FBQztRQUNELElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO0lBQzFDLENBQUM7SUFFRCw4Q0FBOEM7SUFDOUMscUJBQXFCLENBQUMsZ0JBQWtDO1FBQ3RELElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztJQUN0RCxDQUFDO0lBRUQ7Ozs7T0FJRztJQUNILG1CQUFtQjtRQUNqQixJQUNFLElBQUksQ0FBQyxvQkFBb0I7WUFDekIsQ0FBQyxJQUFJLENBQUMsYUFBYTtZQUNuQixJQUFJLENBQUMsdUJBQXVCLENBQUMsTUFBTSxLQUFLLENBQUMsRUFDekMsQ0FBQztZQUNELE9BQU87UUFDVCxDQUFDO1FBQ0QsSUFBSSxDQUFDLG9CQUFvQixHQUFHLElBQUksQ0FBQztRQUNqQyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRTtZQUMxQixJQUFJLENBQUMsb0JBQW9CLEdBQUcsS0FBSyxDQUFDO1lBQ2xDLElBQUksQ0FBQyxhQUFjLENBQUMsSUFBSSxDQUFDLHVCQUF1QixDQUFDLENBQUM7UUFDcEQsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDO0NBQ0Y7QUFFRDs7O0dBR0c7QUFDSCxNQUFNLFVBQVUsa0JBQWtCLENBQ2hDLGFBQXFDLEVBQ3JDLFVBQTBCO0lBRTFCLGFBQWEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxTQUFvQixFQUFFLEVBQUU7UUFDMUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUNqQyxDQUFDLEVBQUUsV0FBVyxDQUFDLDJCQUEyQixDQUFDLENBQUM7QUFDOUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0V2ZW50SW5mbywgRXZlbnRJbmZvV3JhcHBlcn0gZnJvbSAnLi9ldmVudF9pbmZvJztcbmltcG9ydCB7VW5yZW5hbWVkRXZlbnRDb250cmFjdH0gZnJvbSAnLi9ldmVudGNvbnRyYWN0JztcbmltcG9ydCB7UmVzdHJpY3Rpb259IGZyb20gJy4vcmVzdHJpY3Rpb24nO1xuLyoqXG4gKiBBIHJlcGxheWVyIGlzIGEgZnVuY3Rpb24gdGhhdCBpcyBjYWxsZWQgd2hlbiB0aGVyZSBhcmUgcXVldWVkIGV2ZW50cyxcbiAqIGVpdGhlciBmcm9tIHRoZSBgRXZlbnRDb250cmFjdGAgb3Igd2hlbiB0aGVyZSBhcmUgbm8gZGV0ZWN0ZWQgaGFuZGxlcnMuXG4gKi9cbmV4cG9ydCB0eXBlIFJlcGxheWVyID0gKGV2ZW50SW5mb1dyYXBwZXJzOiBFdmVudEluZm9XcmFwcGVyW10pID0+IHZvaWQ7XG4vKipcbiAqIEEgaGFuZGxlciBpcyBkaXNwYXRjaGVkIHRvIGR1cmluZyBub3JtYWwgaGFuZGxpbmcuXG4gKi9cbmV4cG9ydCB0eXBlIEV2ZW50SW5mb1dyYXBwZXJIYW5kbGVyID0gKGV2ZW50SW5mb1dyYXBwZXI6IEV2ZW50SW5mb1dyYXBwZXIpID0+IHZvaWQ7XG4vKipcbiAqIFJlY2VpdmVzIGEgRE9NIGV2ZW50LCBkZXRlcm1pbmVzIHRoZSBqc2FjdGlvbiBhc3NvY2lhdGVkIHdpdGggdGhlIHNvdXJjZVxuICogZWxlbWVudCBvZiB0aGUgRE9NIGV2ZW50LCBhbmQgaW52b2tlcyB0aGUgaGFuZGxlciBhc3NvY2lhdGVkIHdpdGggdGhlXG4gKiBqc2FjdGlvbi5cbiAqL1xuZXhwb3J0IGNsYXNzIEJhc2VEaXNwYXRjaGVyIHtcbiAgLyoqIFRoZSBxdWV1ZSBvZiBldmVudHMuICovXG4gIHByaXZhdGUgcmVhZG9ubHkgcXVldWVkRXZlbnRJbmZvV3JhcHBlcnM6IEV2ZW50SW5mb1dyYXBwZXJbXSA9IFtdO1xuICAvKiogVGhlIHJlcGxheWVyIGZ1bmN0aW9uIHRvIGJlIGNhbGxlZCB3aGVuIHRoZXJlIGFyZSBxdWV1ZWQgZXZlbnRzLiAqL1xuICBwcml2YXRlIGV2ZW50UmVwbGF5ZXI/OiBSZXBsYXllcjtcbiAgLyoqIFdoZXRoZXIgdGhlIGV2ZW50IHJlcGxheSBpcyBzY2hlZHVsZWQuICovXG4gIHByaXZhdGUgZXZlbnRSZXBsYXlTY2hlZHVsZWQgPSBmYWxzZTtcblxuICAvKipcbiAgICogT3B0aW9ucyBhcmU6XG4gICAqICAgMS4gYGV2ZW50UmVwbGF5ZXJgOiBXaGVuIHRoZSBldmVudCBjb250cmFjdCBkaXNwYXRjaGVzIHJlcGxheSBldmVudHNcbiAgICogICAgICB0byB0aGUgRGlzcGF0Y2hlciwgdGhlIERpc3BhdGNoZXIgY29sbGVjdHMgdGhlbSBhbmQgaW4gdGhlIG5leHQgdGlja1xuICAgKiAgICAgIGRpc3BhdGNoZXMgdGhlbSB0byB0aGUgYGV2ZW50UmVwbGF5ZXJgLlxuICAgKiBAcGFyYW0gZGlzcGF0Y2hEZWxlZ2F0ZSBBIGZ1bmN0aW9uIHRoYXQgc2hvdWxkIGhhbmRsZSBkaXNwYXRjaGluZyBhbiBgRXZlbnRJbmZvV3JhcHBlcmAgdG8gaGFuZGxlcnMuXG4gICAqL1xuICBjb25zdHJ1Y3RvcihcbiAgICBwcml2YXRlIHJlYWRvbmx5IGRpc3BhdGNoRGVsZWdhdGU6IChldmVudEluZm9XcmFwcGVyOiBFdmVudEluZm9XcmFwcGVyKSA9PiB2b2lkLFxuICAgIHtldmVudFJlcGxheWVyID0gdW5kZWZpbmVkfToge2V2ZW50UmVwbGF5ZXI/OiBSZXBsYXllcn0gPSB7fSxcbiAgKSB7XG4gICAgdGhpcy5ldmVudFJlcGxheWVyID0gZXZlbnRSZXBsYXllcjtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZWNlaXZlcyBhbiBldmVudCBvciB0aGUgZXZlbnQgcXVldWUgZnJvbSB0aGUgRXZlbnRDb250cmFjdC4gVGhlIGV2ZW50XG4gICAqIHF1ZXVlIGlzIGNvcGllZCBhbmQgaXQgYXR0ZW1wdHMgdG8gcmVwbGF5LlxuICAgKiBJZiBldmVudCBpbmZvIGlzIHBhc3NlZCBpbiBpdCBsb29rcyBmb3IgYW4gYWN0aW9uIGhhbmRsZXIgdGhhdCBjYW4gaGFuZGxlXG4gICAqIHRoZSBnaXZlbiBldmVudC4gIElmIHRoZXJlIGlzIG5vIGhhbmRsZXIgcmVnaXN0ZXJlZCBxdWV1ZXMgdGhlIGV2ZW50IGFuZFxuICAgKiBjaGVja3MgaWYgYSBsb2FkZXIgaXMgcmVnaXN0ZXJlZCBmb3IgdGhlIGdpdmVuIG5hbWVzcGFjZS4gSWYgc28sIGNhbGxzIGl0LlxuICAgKlxuICAgKiBBbHRlcm5hdGl2ZWx5LCBpZiBpbiBnbG9iYWwgZGlzcGF0Y2ggbW9kZSwgY2FsbHMgYWxsIHJlZ2lzdGVyZWQgZ2xvYmFsXG4gICAqIGhhbmRsZXJzIGZvciB0aGUgYXBwcm9wcmlhdGUgZXZlbnQgdHlwZS5cbiAgICpcbiAgICogVGhlIHRocmVlIGZ1bmN0aW9uYWxpdGllcyBvZiB0aGlzIGNhbGwgYXJlIGRlbGliZXJhdGVseSBub3Qgc3BsaXQgaW50b1xuICAgKiB0aHJlZSBtZXRob2RzIChhbmQgdGhlbiBkZWNsYXJlZCBhcyBhbiBhYnN0cmFjdCBpbnRlcmZhY2UpLCBiZWNhdXNlIHRoZVxuICAgKiBpbnRlcmZhY2UgaXMgdXNlZCBieSBFdmVudENvbnRyYWN0LCB3aGljaCBsaXZlcyBpbiBhIGRpZmZlcmVudCBqc2JpbmFyeS5cbiAgICogVGhlcmVmb3JlIHRoZSBpbnRlcmZhY2UgYmV0d2VlbiB0aGUgdGhyZWUgaXMgZGVmaW5lZCBlbnRpcmVseSBpbiB0ZXJtcyB0aGF0XG4gICAqIGFyZSBpbnZhcmlhbnQgdW5kZXIganNjb21waWxlciBwcm9jZXNzaW5nIChGdW5jdGlvbiBhbmQgQXJyYXksIGFzIG9wcG9zZWRcbiAgICogdG8gYSBjdXN0b20gdHlwZSB3aXRoIG1ldGhvZCBuYW1lcykuXG4gICAqXG4gICAqIEBwYXJhbSBldmVudEluZm8gVGhlIGluZm8gZm9yIHRoZSBldmVudCB0aGF0IHRyaWdnZXJlZCB0aGlzIGNhbGwgb3IgdGhlXG4gICAqICAgICBxdWV1ZSBvZiBldmVudHMgZnJvbSBFdmVudENvbnRyYWN0LlxuICAgKi9cbiAgZGlzcGF0Y2goZXZlbnRJbmZvOiBFdmVudEluZm8pOiB2b2lkIHtcbiAgICBjb25zdCBldmVudEluZm9XcmFwcGVyID0gbmV3IEV2ZW50SW5mb1dyYXBwZXIoZXZlbnRJbmZvKTtcbiAgICBpZiAoZXZlbnRJbmZvV3JhcHBlci5nZXRJc1JlcGxheSgpKSB7XG4gICAgICBpZiAoIXRoaXMuZXZlbnRSZXBsYXllcikge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICB0aGlzLnF1ZXVlRXZlbnRJbmZvV3JhcHBlcihldmVudEluZm9XcmFwcGVyKTtcbiAgICAgIHRoaXMuc2NoZWR1bGVFdmVudFJlcGxheSgpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLmRpc3BhdGNoRGVsZWdhdGUoZXZlbnRJbmZvV3JhcHBlcik7XG4gIH1cblxuICAvKiogUXVldWUgYW4gYEV2ZW50SW5mb1dyYXBwZXJgIGZvciByZXBsYXkuICovXG4gIHF1ZXVlRXZlbnRJbmZvV3JhcHBlcihldmVudEluZm9XcmFwcGVyOiBFdmVudEluZm9XcmFwcGVyKSB7XG4gICAgdGhpcy5xdWV1ZWRFdmVudEluZm9XcmFwcGVycy5wdXNoKGV2ZW50SW5mb1dyYXBwZXIpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlcGxheXMgcXVldWVkIGV2ZW50cywgaWYgYW55LiBUaGUgcmVwbGF5aW5nIHdpbGwgaGFwcGVuIGluIGl0cyBvd25cbiAgICogc3RhY2sgb25jZSB0aGUgY3VycmVudCBmbG93IGNlZGVzIGNvbnRyb2wuIFRoaXMgaXMgZG9uZSB0byBtaW1pY1xuICAgKiBicm93c2VyIGV2ZW50IGhhbmRsaW5nLlxuICAgKi9cbiAgc2NoZWR1bGVFdmVudFJlcGxheSgpIHtcbiAgICBpZiAoXG4gICAgICB0aGlzLmV2ZW50UmVwbGF5U2NoZWR1bGVkIHx8XG4gICAgICAhdGhpcy5ldmVudFJlcGxheWVyIHx8XG4gICAgICB0aGlzLnF1ZXVlZEV2ZW50SW5mb1dyYXBwZXJzLmxlbmd0aCA9PT0gMFxuICAgICkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLmV2ZW50UmVwbGF5U2NoZWR1bGVkID0gdHJ1ZTtcbiAgICBQcm9taXNlLnJlc29sdmUoKS50aGVuKCgpID0+IHtcbiAgICAgIHRoaXMuZXZlbnRSZXBsYXlTY2hlZHVsZWQgPSBmYWxzZTtcbiAgICAgIHRoaXMuZXZlbnRSZXBsYXllciEodGhpcy5xdWV1ZWRFdmVudEluZm9XcmFwcGVycyk7XG4gICAgfSk7XG4gIH1cbn1cblxuLyoqXG4gKiBSZWdpc3RlcnMgZGVmZXJyZWQgZnVuY3Rpb25hbGl0eSBmb3IgYW4gRXZlbnRDb250cmFjdCBhbmQgYSBKc2FjdGlvblxuICogRGlzcGF0Y2hlci5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlZ2lzdGVyRGlzcGF0Y2hlcihcbiAgZXZlbnRDb250cmFjdDogVW5yZW5hbWVkRXZlbnRDb250cmFjdCxcbiAgZGlzcGF0Y2hlcjogQmFzZURpc3BhdGNoZXIsXG4pIHtcbiAgZXZlbnRDb250cmFjdC5lY3JkKChldmVudEluZm86IEV2ZW50SW5mbykgPT4ge1xuICAgIGRpc3BhdGNoZXIuZGlzcGF0Y2goZXZlbnRJbmZvKTtcbiAgfSwgUmVzdHJpY3Rpb24uSV9BTV9USEVfSlNBQ1RJT05fRlJBTUVXT1JLKTtcbn1cbiJdfQ==