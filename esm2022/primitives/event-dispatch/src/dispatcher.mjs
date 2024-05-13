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
 * Registers deferred functionality for an EventContract and a Jsaction
 * Dispatcher.
 */
export function registerDispatcher(eventContract, dispatcher) {
    eventContract.ecrd((eventInfo) => {
        dispatcher.dispatch(eventInfo);
    }, Restriction.I_AM_THE_JSACTION_FRAMEWORK);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlzcGF0Y2hlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvcHJpbWl0aXZlcy9ldmVudC1kaXNwYXRjaC9zcmMvZGlzcGF0Y2hlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQVksZ0JBQWdCLEVBQUMsTUFBTSxjQUFjLENBQUM7QUFDekQsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLGNBQWMsQ0FBQztBQUN2QyxPQUFPLEVBQUMsV0FBVyxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBRTFDLE9BQU8sS0FBSyxRQUFRLE1BQU0sU0FBUyxDQUFDO0FBbUJwQzs7OztHQUlHO0FBQ0gsTUFBTSxPQUFPLFVBQVU7SUFRckI7Ozs7OztPQU1HO0lBQ0gsWUFDbUIsZ0JBQThELEVBQy9FLEVBQUMsYUFBYSxHQUFHLFNBQVMsS0FBZ0MsRUFBRTtRQUQzQyxxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQThDO1FBZmpGLDJCQUEyQjtRQUNWLDRCQUF1QixHQUF1QixFQUFFLENBQUM7UUFHbEUsNkNBQTZDO1FBQ3JDLHlCQUFvQixHQUFHLEtBQUssQ0FBQztRQWFuQyxJQUFJLENBQUMsYUFBYSxHQUFHLGFBQWEsQ0FBQztJQUNyQyxDQUFDO0lBRUQ7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7T0FtQkc7SUFDSCxRQUFRLENBQUMsU0FBb0I7UUFDM0IsTUFBTSxnQkFBZ0IsR0FBRyxJQUFJLGdCQUFnQixDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQ3pELElBQUksZ0JBQWdCLENBQUMsV0FBVyxFQUFFLEVBQUUsQ0FBQztZQUNuQyxJQUFJLENBQUMsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO2dCQUN4QixPQUFPO1lBQ1QsQ0FBQztZQUNELElBQUksQ0FBQyw4QkFBOEIsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1lBQ3RELE9BQU87UUFDVCxDQUFDO1FBQ0QsSUFBSSxDQUFDLGdCQUFnQixDQUFDLGdCQUFnQixDQUFDLENBQUM7SUFDMUMsQ0FBQztJQUVEOzs7O09BSUc7SUFDSyw4QkFBOEIsQ0FBQyxnQkFBa0M7UUFDdkUsSUFBSSxDQUFDLHVCQUF1QixDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1FBQ3BELElBQUksSUFBSSxDQUFDLG9CQUFvQixJQUFJLENBQUMsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO1lBQ3JELE9BQU87UUFDVCxDQUFDO1FBQ0QsSUFBSSxDQUFDLG9CQUFvQixHQUFHLElBQUksQ0FBQztRQUNqQyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRTtZQUMxQixJQUFJLENBQUMsb0JBQW9CLEdBQUcsS0FBSyxDQUFDO1lBQ2xDLElBQUksQ0FBQyxhQUFjLENBQUMsSUFBSSxDQUFDLHVCQUF1QixDQUFDLENBQUM7UUFDcEQsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDO0NBQ0Y7QUFFRCwyQ0FBMkM7QUFDM0MsTUFBTSxVQUFVLGVBQWUsQ0FBQyxnQkFBa0M7SUFDaEUsSUFDRSxRQUFRLENBQUMsT0FBTztRQUNoQixDQUFDLGdCQUFnQixDQUFDLGdCQUFnQixFQUFFLENBQUMsT0FBTyxLQUFLLE9BQU87WUFDdEQsZ0JBQWdCLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQyxPQUFPLEtBQUssVUFBVSxDQUFDO1FBQzdELGdCQUFnQixDQUFDLFlBQVksRUFBRSxLQUFLLFNBQVMsQ0FBQyxLQUFLLEVBQ25ELENBQUM7UUFDRDs7OztXQUlHO1FBQ0gsT0FBTztJQUNULENBQUM7SUFFRCxNQUFNLEtBQUssR0FBRyxnQkFBZ0IsQ0FBQyxRQUFRLEVBQUUsQ0FBQztJQUMxQywwRUFBMEU7SUFDMUUsNkRBQTZEO0lBQzdELElBQUksQ0FBQyxLQUFLLENBQUMsZUFBZSxFQUFFLENBQUM7UUFDM0IsT0FBTztJQUNULENBQUM7SUFDRCxLQUFLLENBQUMsZUFBZSxFQUFFLENBQUM7QUFDMUIsQ0FBQztBQUVEOzs7R0FHRztBQUNILE1BQU0sVUFBVSxrQkFBa0IsQ0FBQyxhQUFxQyxFQUFFLFVBQXNCO0lBQzlGLGFBQWEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxTQUFvQixFQUFFLEVBQUU7UUFDMUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUNqQyxDQUFDLEVBQUUsV0FBVyxDQUFDLDJCQUEyQixDQUFDLENBQUM7QUFDOUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0V2ZW50SW5mbywgRXZlbnRJbmZvV3JhcHBlcn0gZnJvbSAnLi9ldmVudF9pbmZvJztcbmltcG9ydCB7RXZlbnRUeXBlfSBmcm9tICcuL2V2ZW50X3R5cGUnO1xuaW1wb3J0IHtSZXN0cmljdGlvbn0gZnJvbSAnLi9yZXN0cmljdGlvbic7XG5pbXBvcnQge1VucmVuYW1lZEV2ZW50Q29udHJhY3R9IGZyb20gJy4vZXZlbnRjb250cmFjdCc7XG5pbXBvcnQgKiBhcyBldmVudExpYiBmcm9tICcuL2V2ZW50JztcblxuLyoqXG4gKiBBIHJlcGxheWVyIGlzIGEgZnVuY3Rpb24gdGhhdCBpcyBjYWxsZWQgd2hlbiB0aGVyZSBhcmUgcXVldWVkIGV2ZW50cyxcbiAqIGVpdGhlciBmcm9tIHRoZSBgRXZlbnRDb250cmFjdGAgb3Igd2hlbiB0aGVyZSBhcmUgbm8gZGV0ZWN0ZWQgaGFuZGxlcnMuXG4gKi9cbmV4cG9ydCB0eXBlIFJlcGxheWVyID0gKGV2ZW50SW5mb1dyYXBwZXJzOiBFdmVudEluZm9XcmFwcGVyW10pID0+IHZvaWQ7XG5cbi8qKlxuICogQSBoYW5kbGVyIGlzIGRpc3BhdGNoZWQgdG8gZHVyaW5nIG5vcm1hbCBoYW5kbGluZy5cbiAqL1xuZXhwb3J0IHR5cGUgRXZlbnRJbmZvSGFuZGxlciA9IChldmVudEluZm9XcmFwcGVyOiBFdmVudEluZm9XcmFwcGVyKSA9PiB2b2lkO1xuXG4vKipcbiAqIEEgZ2xvYmFsIGhhbmRsZXIgaXMgZGlzcGF0Y2hlZCB0byBiZWZvcmUgbm9ybWFsIGhhbmRsZXIgZGlzcGF0Y2guIFJldHVybmluZ1xuICogZmFsc2Ugd2lsbCBgcHJldmVudERlZmF1bHRgIG9uIHRoZSBldmVudC5cbiAqL1xuZXhwb3J0IHR5cGUgR2xvYmFsSGFuZGxlciA9IChldmVudDogRXZlbnQpID0+IGJvb2xlYW4gfCB2b2lkO1xuXG4vKipcbiAqIFJlY2VpdmVzIGEgRE9NIGV2ZW50LCBkZXRlcm1pbmVzIHRoZSBqc2FjdGlvbiBhc3NvY2lhdGVkIHdpdGggdGhlIHNvdXJjZVxuICogZWxlbWVudCBvZiB0aGUgRE9NIGV2ZW50LCBhbmQgaW52b2tlcyB0aGUgaGFuZGxlciBhc3NvY2lhdGVkIHdpdGggdGhlXG4gKiBqc2FjdGlvbi5cbiAqL1xuZXhwb3J0IGNsYXNzIERpc3BhdGNoZXIge1xuICAvKiogVGhlIHF1ZXVlIG9mIGV2ZW50cy4gKi9cbiAgcHJpdmF0ZSByZWFkb25seSByZXBsYXlFdmVudEluZm9XcmFwcGVyczogRXZlbnRJbmZvV3JhcHBlcltdID0gW107XG4gIC8qKiBUaGUgcmVwbGF5ZXIgZnVuY3Rpb24gdG8gYmUgY2FsbGVkIHdoZW4gdGhlcmUgYXJlIHF1ZXVlZCBldmVudHMuICovXG4gIHByaXZhdGUgZXZlbnRSZXBsYXllcj86IFJlcGxheWVyO1xuICAvKiogV2hldGhlciB0aGUgZXZlbnQgcmVwbGF5IGlzIHNjaGVkdWxlZC4gKi9cbiAgcHJpdmF0ZSBldmVudFJlcGxheVNjaGVkdWxlZCA9IGZhbHNlO1xuXG4gIC8qKlxuICAgKiBPcHRpb25zIGFyZTpcbiAgICogICAxLiBgZXZlbnRSZXBsYXllcmA6IFdoZW4gdGhlIGV2ZW50IGNvbnRyYWN0IGRpc3BhdGNoZXMgcmVwbGF5IGV2ZW50c1xuICAgKiAgICAgIHRvIHRoZSBEaXNwYXRjaGVyLCB0aGUgRGlzcGF0Y2hlciBjb2xsZWN0cyB0aGVtIGFuZCBpbiB0aGUgbmV4dCB0aWNrXG4gICAqICAgICAgZGlzcGF0Y2hlcyB0aGVtIHRvIHRoZSBgZXZlbnRSZXBsYXllcmAuXG4gICAqIEBwYXJhbSBkaXNwYXRjaERlbGVnYXRlIEEgZnVuY3Rpb24gdGhhdCBzaG91bGQgaGFuZGxlIGRpc3BhdGNoaW5nIGFuIGBFdmVudEluZm9XcmFwcGVyYCB0byBoYW5kbGVycy5cbiAgICovXG4gIGNvbnN0cnVjdG9yKFxuICAgIHByaXZhdGUgcmVhZG9ubHkgZGlzcGF0Y2hEZWxlZ2F0ZTogKGV2ZW50SW5mb1dyYXBwZXI6IEV2ZW50SW5mb1dyYXBwZXIpID0+IHZvaWQsXG4gICAge2V2ZW50UmVwbGF5ZXIgPSB1bmRlZmluZWR9OiB7ZXZlbnRSZXBsYXllcj86IFJlcGxheWVyfSA9IHt9LFxuICApIHtcbiAgICB0aGlzLmV2ZW50UmVwbGF5ZXIgPSBldmVudFJlcGxheWVyO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlY2VpdmVzIGFuIGV2ZW50IG9yIHRoZSBldmVudCBxdWV1ZSBmcm9tIHRoZSBFdmVudENvbnRyYWN0LiBUaGUgZXZlbnRcbiAgICogcXVldWUgaXMgY29waWVkIGFuZCBpdCBhdHRlbXB0cyB0byByZXBsYXkuXG4gICAqIElmIGV2ZW50IGluZm8gaXMgcGFzc2VkIGluIGl0IGxvb2tzIGZvciBhbiBhY3Rpb24gaGFuZGxlciB0aGF0IGNhbiBoYW5kbGVcbiAgICogdGhlIGdpdmVuIGV2ZW50LiAgSWYgdGhlcmUgaXMgbm8gaGFuZGxlciByZWdpc3RlcmVkIHF1ZXVlcyB0aGUgZXZlbnQgYW5kXG4gICAqIGNoZWNrcyBpZiBhIGxvYWRlciBpcyByZWdpc3RlcmVkIGZvciB0aGUgZ2l2ZW4gbmFtZXNwYWNlLiBJZiBzbywgY2FsbHMgaXQuXG4gICAqXG4gICAqIEFsdGVybmF0aXZlbHksIGlmIGluIGdsb2JhbCBkaXNwYXRjaCBtb2RlLCBjYWxscyBhbGwgcmVnaXN0ZXJlZCBnbG9iYWxcbiAgICogaGFuZGxlcnMgZm9yIHRoZSBhcHByb3ByaWF0ZSBldmVudCB0eXBlLlxuICAgKlxuICAgKiBUaGUgdGhyZWUgZnVuY3Rpb25hbGl0aWVzIG9mIHRoaXMgY2FsbCBhcmUgZGVsaWJlcmF0ZWx5IG5vdCBzcGxpdCBpbnRvXG4gICAqIHRocmVlIG1ldGhvZHMgKGFuZCB0aGVuIGRlY2xhcmVkIGFzIGFuIGFic3RyYWN0IGludGVyZmFjZSksIGJlY2F1c2UgdGhlXG4gICAqIGludGVyZmFjZSBpcyB1c2VkIGJ5IEV2ZW50Q29udHJhY3QsIHdoaWNoIGxpdmVzIGluIGEgZGlmZmVyZW50IGpzYmluYXJ5LlxuICAgKiBUaGVyZWZvcmUgdGhlIGludGVyZmFjZSBiZXR3ZWVuIHRoZSB0aHJlZSBpcyBkZWZpbmVkIGVudGlyZWx5IGluIHRlcm1zIHRoYXRcbiAgICogYXJlIGludmFyaWFudCB1bmRlciBqc2NvbXBpbGVyIHByb2Nlc3NpbmcgKEZ1bmN0aW9uIGFuZCBBcnJheSwgYXMgb3Bwb3NlZFxuICAgKiB0byBhIGN1c3RvbSB0eXBlIHdpdGggbWV0aG9kIG5hbWVzKS5cbiAgICpcbiAgICogQHBhcmFtIGV2ZW50SW5mbyBUaGUgaW5mbyBmb3IgdGhlIGV2ZW50IHRoYXQgdHJpZ2dlcmVkIHRoaXMgY2FsbCBvciB0aGVcbiAgICogICAgIHF1ZXVlIG9mIGV2ZW50cyBmcm9tIEV2ZW50Q29udHJhY3QuXG4gICAqL1xuICBkaXNwYXRjaChldmVudEluZm86IEV2ZW50SW5mbyk6IHZvaWQge1xuICAgIGNvbnN0IGV2ZW50SW5mb1dyYXBwZXIgPSBuZXcgRXZlbnRJbmZvV3JhcHBlcihldmVudEluZm8pO1xuICAgIGlmIChldmVudEluZm9XcmFwcGVyLmdldElzUmVwbGF5KCkpIHtcbiAgICAgIGlmICghdGhpcy5ldmVudFJlcGxheWVyKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIHRoaXMuc2NoZWR1bGVFdmVudEluZm9XcmFwcGVyUmVwbGF5KGV2ZW50SW5mb1dyYXBwZXIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLmRpc3BhdGNoRGVsZWdhdGUoZXZlbnRJbmZvV3JhcHBlcik7XG4gIH1cblxuICAvKipcbiAgICogU2NoZWR1bGVzIGFuIGBFdmVudEluZm9XcmFwcGVyYCBmb3IgcmVwbGF5LiBUaGUgcmVwbGF5aW5nIHdpbGwgaGFwcGVuIGluIGl0cyBvd25cbiAgICogc3RhY2sgb25jZSB0aGUgY3VycmVudCBmbG93IGNlZGVzIGNvbnRyb2wuIFRoaXMgaXMgZG9uZSB0byBtaW1pY1xuICAgKiBicm93c2VyIGV2ZW50IGhhbmRsaW5nLlxuICAgKi9cbiAgcHJpdmF0ZSBzY2hlZHVsZUV2ZW50SW5mb1dyYXBwZXJSZXBsYXkoZXZlbnRJbmZvV3JhcHBlcjogRXZlbnRJbmZvV3JhcHBlcikge1xuICAgIHRoaXMucmVwbGF5RXZlbnRJbmZvV3JhcHBlcnMucHVzaChldmVudEluZm9XcmFwcGVyKTtcbiAgICBpZiAodGhpcy5ldmVudFJlcGxheVNjaGVkdWxlZCB8fCAhdGhpcy5ldmVudFJlcGxheWVyKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMuZXZlbnRSZXBsYXlTY2hlZHVsZWQgPSB0cnVlO1xuICAgIFByb21pc2UucmVzb2x2ZSgpLnRoZW4oKCkgPT4ge1xuICAgICAgdGhpcy5ldmVudFJlcGxheVNjaGVkdWxlZCA9IGZhbHNlO1xuICAgICAgdGhpcy5ldmVudFJlcGxheWVyISh0aGlzLnJlcGxheUV2ZW50SW5mb1dyYXBwZXJzKTtcbiAgICB9KTtcbiAgfVxufVxuXG4vKiogU3RvcCBwcm9wYWdhdGlvbiBmb3IgYW4gYEV2ZW50SW5mb2AuICovXG5leHBvcnQgZnVuY3Rpb24gc3RvcFByb3BhZ2F0aW9uKGV2ZW50SW5mb1dyYXBwZXI6IEV2ZW50SW5mb1dyYXBwZXIpIHtcbiAgaWYgKFxuICAgIGV2ZW50TGliLmlzR2Vja28gJiZcbiAgICAoZXZlbnRJbmZvV3JhcHBlci5nZXRUYXJnZXRFbGVtZW50KCkudGFnTmFtZSA9PT0gJ0lOUFVUJyB8fFxuICAgICAgZXZlbnRJbmZvV3JhcHBlci5nZXRUYXJnZXRFbGVtZW50KCkudGFnTmFtZSA9PT0gJ1RFWFRBUkVBJykgJiZcbiAgICBldmVudEluZm9XcmFwcGVyLmdldEV2ZW50VHlwZSgpID09PSBFdmVudFR5cGUuRk9DVVNcbiAgKSB7XG4gICAgLyoqXG4gICAgICogRG8gbm90aGluZyBzaW5jZSBzdG9wcGluZyBwcm9wYWdhdGlvbiBvbiBhIGZvY3VzIGV2ZW50IG9uIGFuIGlucHV0XG4gICAgICogZWxlbWVudCBpbiBGaXJlZm94IG1ha2VzIHRoZSB0ZXh0IGN1cnNvciBkaXNhcHBlYXI6XG4gICAgICogaHR0cHM6Ly9idWd6aWxsYS5tb3ppbGxhLm9yZy9zaG93X2J1Zy5jZ2k/aWQ9NTA5Njg0XG4gICAgICovXG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY29uc3QgZXZlbnQgPSBldmVudEluZm9XcmFwcGVyLmdldEV2ZW50KCk7XG4gIC8vIFRoZXJlIGFyZSBzb21lIGNhc2VzIHdoZXJlIHVzZXJzIG9mIHRoZSBgRGlzcGF0Y2hlcmAgd2lsbCBjYWxsIGRpc3BhdGNoXG4gIC8vIHdpdGggYSBmYWtlIGV2ZW50IHRoYXQgZG9lcyBub3Qgc3VwcG9ydCBgc3RvcFByb3BhZ2F0aW9uYC5cbiAgaWYgKCFldmVudC5zdG9wUHJvcGFnYXRpb24pIHtcbiAgICByZXR1cm47XG4gIH1cbiAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG59XG5cbi8qKlxuICogUmVnaXN0ZXJzIGRlZmVycmVkIGZ1bmN0aW9uYWxpdHkgZm9yIGFuIEV2ZW50Q29udHJhY3QgYW5kIGEgSnNhY3Rpb25cbiAqIERpc3BhdGNoZXIuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZWdpc3RlckRpc3BhdGNoZXIoZXZlbnRDb250cmFjdDogVW5yZW5hbWVkRXZlbnRDb250cmFjdCwgZGlzcGF0Y2hlcjogRGlzcGF0Y2hlcikge1xuICBldmVudENvbnRyYWN0LmVjcmQoKGV2ZW50SW5mbzogRXZlbnRJbmZvKSA9PiB7XG4gICAgZGlzcGF0Y2hlci5kaXNwYXRjaChldmVudEluZm8pO1xuICB9LCBSZXN0cmljdGlvbi5JX0FNX1RIRV9KU0FDVElPTl9GUkFNRVdPUkspO1xufVxuIl19