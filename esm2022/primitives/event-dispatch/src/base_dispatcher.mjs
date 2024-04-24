/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Attribute as AccessibilityAttribute } from './accessibility';
import * as eventLib from './event';
import { EventInfoWrapper } from './event_info';
import { EventType } from './event_type';
import { replayEvent } from './replay';
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
     * @return An `EventInfo` for the `EventContract` to handle again if the
     *    `Dispatcher` tried to resolve an a11y event as a click but failed.
     */
    dispatch(eventInfo, isGlobalDispatch) {
        const eventInfoWrapper = new EventInfoWrapper(eventInfo);
        if (eventInfoWrapper.getIsReplay()) {
            if (isGlobalDispatch || !this.eventReplayer) {
                return;
            }
            const resolved = resolveA11yEvent(eventInfoWrapper, isGlobalDispatch);
            if (!resolved) {
                // Send the event back through the `EventContract` by dispatching to
                // the browser.
                replayEvent(eventInfoWrapper.getEvent(), eventInfoWrapper.getTargetElement(), eventInfoWrapper.getEventType());
                return;
            }
            this.queueEventInfoWrapper(eventInfoWrapper);
            this.scheduleEventReplay();
            return;
        }
        const resolved = resolveA11yEvent(eventInfoWrapper, isGlobalDispatch);
        if (!resolved) {
            // Reset action information.
            eventInfoWrapper.setAction(undefined);
            return eventInfoWrapper.eventInfo;
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
 * If a 'MAYBE_CLICK_EVENT_TYPE' event was dispatched, updates the eventType
 * to either click or keydown based on whether the keydown action can be
 * treated as a click. For MAYBE_CLICK_EVENT_TYPE events that are just
 * keydowns, we set flags on the event object so that the event contract
 * does't try to dispatch it as a MAYBE_CLICK_EVENT_TYPE again.
 *
 * @param isGlobalDispatch Whether the eventInfo is meant to be dispatched to
 *     the global handlers.
 * @return Returns false if the a11y event could not be resolved and should
 *    be re-dispatched.
 */
function resolveA11yEvent(eventInfoWrapper, isGlobalDispatch = false) {
    if (eventInfoWrapper.getEventType() !== AccessibilityAttribute.MAYBE_CLICK_EVENT_TYPE) {
        return true;
    }
    if (isA11yClickEvent(eventInfoWrapper, isGlobalDispatch)) {
        if (shouldPreventDefault(eventInfoWrapper)) {
            eventLib.preventDefault(eventInfoWrapper.getEvent());
        }
        // If the keydown event can be treated as a click, we change the eventType
        // to 'click' so that the dispatcher can retrieve the right handler for
        // it. Even though EventInfo['action'] corresponds to the click action,
        // the global handler and any custom 'getHandler' implementations may rely
        // on the eventType instead.
        eventInfoWrapper.setEventType(EventType.CLICK);
    }
    else {
        // Otherwise, if the keydown can't be treated as a click, we need to
        // retrigger it because now we need to look for 'keydown' actions instead.
        eventInfoWrapper.setEventType(EventType.KEYDOWN);
        if (!isGlobalDispatch) {
            // This prevents the event contract from setting the
            // AccessibilityAttribute.MAYBE_CLICK_EVENT_TYPE type for Keydown
            // events.
            eventInfoWrapper.getEvent()[AccessibilityAttribute.SKIP_A11Y_CHECK] = true;
            // Since globally dispatched events will get handled by the dispatcher,
            // don't have the event contract dispatch it again.
            eventInfoWrapper.getEvent()[AccessibilityAttribute.SKIP_GLOBAL_DISPATCH] = true;
            return false;
        }
    }
    return true;
}
/**
 * Returns true if the default action for this event should be prevented
 * before the event handler is envoked.
 */
function shouldPreventDefault(eventInfoWrapper) {
    const actionElement = eventInfoWrapper.getAction()?.element;
    // For parity with no-a11y-support behavior.
    if (!actionElement) {
        return false;
    }
    // Prevent scrolling if the Space key was pressed
    if (eventLib.isSpaceKeyEvent(eventInfoWrapper.getEvent())) {
        return true;
    }
    // or prevent the browser's default action for native HTML controls.
    if (eventLib.shouldCallPreventDefaultOnNativeHtmlControl(eventInfoWrapper.getEvent())) {
        return true;
    }
    // Prevent browser from following <a> node links if a jsaction is present
    // and we are dispatching the action now. Note that the targetElement may be
    // a child of an anchor that has a jsaction attached. For that reason, we
    // need to check the actionElement rather than the targetElement.
    if (actionElement.tagName === 'A') {
        return true;
    }
    return false;
}
/**
 * Returns true if the given key event can be treated as a 'click'.
 *
 * @param isGlobalDispatch Whether the eventInfo is meant to be dispatched to
 *     the global handlers.
 */
function isA11yClickEvent(eventInfoWrapper, isGlobalDispatch) {
    return ((isGlobalDispatch || eventInfoWrapper.getAction() !== undefined) &&
        eventLib.isActionKeyEvent(eventInfoWrapper.getEvent()));
}
/**
 * Registers deferred functionality for an EventContract and a Jsaction
 * Dispatcher.
 */
export function registerDispatcher(eventContract, dispatcher) {
    eventContract.ecrd((eventInfo, globalDispatch) => {
        return dispatcher.dispatch(eventInfo, globalDispatch);
    }, Restriction.I_AM_THE_JSACTION_FRAMEWORK);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFzZV9kaXNwYXRjaGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9wcmltaXRpdmVzL2V2ZW50LWRpc3BhdGNoL3NyYy9iYXNlX2Rpc3BhdGNoZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLFNBQVMsSUFBSSxzQkFBc0IsRUFBQyxNQUFNLGlCQUFpQixDQUFDO0FBQ3BFLE9BQU8sS0FBSyxRQUFRLE1BQU0sU0FBUyxDQUFDO0FBQ3BDLE9BQU8sRUFBWSxnQkFBZ0IsRUFBQyxNQUFNLGNBQWMsQ0FBQztBQUN6RCxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sY0FBYyxDQUFDO0FBRXZDLE9BQU8sRUFBQyxXQUFXLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDckMsT0FBTyxFQUFDLFdBQVcsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQVUxQzs7OztHQUlHO0FBQ0gsTUFBTSxPQUFPLGNBQWM7SUFRekI7Ozs7OztPQU1HO0lBQ0gsWUFDbUIsZ0JBR1IsRUFDVCxFQUFDLGFBQWEsR0FBRyxTQUFTLEtBQWdDLEVBQUU7UUFKM0MscUJBQWdCLEdBQWhCLGdCQUFnQixDQUd4QjtRQWxCWCwyQkFBMkI7UUFDViw0QkFBdUIsR0FBdUIsRUFBRSxDQUFDO1FBR2xFLDZDQUE2QztRQUNyQyx5QkFBb0IsR0FBRyxLQUFLLENBQUM7UUFnQm5DLElBQUksQ0FBQyxhQUFhLEdBQUcsYUFBYSxDQUFDO0lBQ3JDLENBQUM7SUFFRDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7T0F1Qkc7SUFDSCxRQUFRLENBQUMsU0FBb0IsRUFBRSxnQkFBMEI7UUFDdkQsTUFBTSxnQkFBZ0IsR0FBRyxJQUFJLGdCQUFnQixDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQ3pELElBQUksZ0JBQWdCLENBQUMsV0FBVyxFQUFFLEVBQUUsQ0FBQztZQUNuQyxJQUFJLGdCQUFnQixJ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Z0JBQWdCLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FDdkQsQ0FBQztBQUNKLENBQUM7QUFFRDs7O0dBR0c7QUFDSCxNQUFNLFVBQVUsa0JBQWtCLENBQ2hDLGFBQXFDLEVBQ3JDLFVBQTBCO0lBRTFCLGFBQWEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxTQUFvQixFQUFFLGNBQXdCLEVBQUUsRUFBRTtRQUNwRSxPQUFPLFVBQVUsQ0FBQyxRQUFRLENBQUMsU0FBUyxFQUFFLGNBQWMsQ0FBQyxDQUFDO0lBQ3hELENBQUMsRUFBRSxXQUFXLENBQUMsMkJBQTJCLENBQUMsQ0FBQztBQUM5QyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7QXR0cmlidXRlIGFzIEFjY2Vzc2liaWxpdHlBdHRyaWJ1dGV9IGZyb20gJy4vYWNjZXNzaWJpbGl0eSc7XG5pbXBvcnQgKiBhcyBldmVudExpYiBmcm9tICcuL2V2ZW50JztcbmltcG9ydCB7RXZlbnRJbmZvLCBFdmVudEluZm9XcmFwcGVyfSBmcm9tICcuL2V2ZW50X2luZm8nO1xuaW1wb3J0IHtFdmVudFR5cGV9IGZyb20gJy4vZXZlbnRfdHlwZSc7XG5pbXBvcnQge1VucmVuYW1lZEV2ZW50Q29udHJhY3R9IGZyb20gJy4vZXZlbnRjb250cmFjdCc7XG5pbXBvcnQge3JlcGxheUV2ZW50fSBmcm9tICcuL3JlcGxheSc7XG5pbXBvcnQge1Jlc3RyaWN0aW9ufSBmcm9tICcuL3Jlc3RyaWN0aW9uJztcbi8qKlxuICogQSByZXBsYXllciBpcyBhIGZ1bmN0aW9uIHRoYXQgaXMgY2FsbGVkIHdoZW4gdGhlcmUgYXJlIHF1ZXVlZCBldmVudHMsXG4gKiBlaXRoZXIgZnJvbSB0aGUgYEV2ZW50Q29udHJhY3RgIG9yIHdoZW4gdGhlcmUgYXJlIG5vIGRldGVjdGVkIGhhbmRsZXJzLlxuICovXG5leHBvcnQgdHlwZSBSZXBsYXllciA9IChldmVudEluZm9XcmFwcGVyczogRXZlbnRJbmZvV3JhcHBlcltdKSA9PiB2b2lkO1xuLyoqXG4gKiBBIGhhbmRsZXIgaXMgZGlzcGF0Y2hlZCB0byBkdXJpbmcgbm9ybWFsIGhhbmRsaW5nLlxuICovXG5leHBvcnQgdHlwZSBFdmVudEluZm9XcmFwcGVySGFuZGxlciA9IChldmVudEluZm9XcmFwcGVyOiBFdmVudEluZm9XcmFwcGVyKSA9PiB2b2lkO1xuLyoqXG4gKiBSZWNlaXZlcyBhIERPTSBldmVudCwgZGV0ZXJtaW5lcyB0aGUganNhY3Rpb24gYXNzb2NpYXRlZCB3aXRoIHRoZSBzb3VyY2VcbiAqIGVsZW1lbnQgb2YgdGhlIERPTSBldmVudCwgYW5kIGludm9rZXMgdGhlIGhhbmRsZXIgYXNzb2NpYXRlZCB3aXRoIHRoZVxuICoganNhY3Rpb24uXG4gKi9cbmV4cG9ydCBjbGFzcyBCYXNlRGlzcGF0Y2hlciB7XG4gIC8qKiBUaGUgcXVldWUgb2YgZXZlbnRzLiAqL1xuICBwcml2YXRlIHJlYWRvbmx5IHF1ZXVlZEV2ZW50SW5mb1dyYXBwZXJzOiBFdmVudEluZm9XcmFwcGVyW10gPSBbXTtcbiAgLyoqIFRoZSByZXBsYXllciBmdW5jdGlvbiB0byBiZSBjYWxsZWQgd2hlbiB0aGVyZSBhcmUgcXVldWVkIGV2ZW50cy4gKi9cbiAgcHJpdmF0ZSBldmVudFJlcGxheWVyPzogUmVwbGF5ZXI7XG4gIC8qKiBXaGV0aGVyIHRoZSBldmVudCByZXBsYXkgaXMgc2NoZWR1bGVkLiAqL1xuICBwcml2YXRlIGV2ZW50UmVwbGF5U2NoZWR1bGVkID0gZmFsc2U7XG5cbiAgLyoqXG4gICAqIE9wdGlvbnMgYXJlOlxuICAgKiAgIDEuIGBldmVudFJlcGxheWVyYDogV2hlbiB0aGUgZXZlbnQgY29udHJhY3QgZGlzcGF0Y2hlcyByZXBsYXkgZXZlbnRzXG4gICAqICAgICAgdG8gdGhlIERpc3BhdGNoZXIsIHRoZSBEaXNwYXRjaGVyIGNvbGxlY3RzIHRoZW0gYW5kIGluIHRoZSBuZXh0IHRpY2tcbiAgICogICAgICBkaXNwYXRjaGVzIHRoZW0gdG8gdGhlIGBldmVudFJlcGxheWVyYC5cbiAgICogQHBhcmFtIGRpc3BhdGNoRGVsZWdhdGUgQSBmdW5jdGlvbiB0aGF0IHNob3VsZCBoYW5kbGUgZGlzcGF0Y2hpbmcgYW4gYEV2ZW50SW5mb1dyYXBwZXJgIHRvIGhhbmRsZXJzLlxuICAgKi9cbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSByZWFkb25seSBkaXNwYXRjaERlbGVnYXRlOiAoXG4gICAgICBldmVudEluZm9XcmFwcGVyOiBFdmVudEluZm9XcmFwcGVyLFxuICAgICAgaXNHbG9iYWxEaXNwYXRjaD86IGJvb2xlYW4sXG4gICAgKSA9PiB2b2lkLFxuICAgIHtldmVudFJlcGxheWVyID0gdW5kZWZpbmVkfToge2V2ZW50UmVwbGF5ZXI/OiBSZXBsYXllcn0gPSB7fSxcbiAgKSB7XG4gICAgdGhpcy5ldmVudFJlcGxheWVyID0gZXZlbnRSZXBsYXllcjtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZWNlaXZlcyBhbiBldmVudCBvciB0aGUgZXZlbnQgcXVldWUgZnJvbSB0aGUgRXZlbnRDb250cmFjdC4gVGhlIGV2ZW50XG4gICAqIHF1ZXVlIGlzIGNvcGllZCBhbmQgaXQgYXR0ZW1wdHMgdG8gcmVwbGF5LlxuICAgKiBJZiBldmVudCBpbmZvIGlzIHBhc3NlZCBpbiBpdCBsb29rcyBmb3IgYW4gYWN0aW9uIGhhbmRsZXIgdGhhdCBjYW4gaGFuZGxlXG4gICAqIHRoZSBnaXZlbiBldmVudC4gIElmIHRoZXJlIGlzIG5vIGhhbmRsZXIgcmVnaXN0ZXJlZCBxdWV1ZXMgdGhlIGV2ZW50IGFuZFxuICAgKiBjaGVja3MgaWYgYSBsb2FkZXIgaXMgcmVnaXN0ZXJlZCBmb3IgdGhlIGdpdmVuIG5hbWVzcGFjZS4gSWYgc28sIGNhbGxzIGl0LlxuICAgKlxuICAgKiBBbHRlcm5hdGl2ZWx5LCBpZiBpbiBnbG9iYWwgZGlzcGF0Y2ggbW9kZSwgY2FsbHMgYWxsIHJlZ2lzdGVyZWQgZ2xvYmFsXG4gICAqIGhhbmRsZXJzIGZvciB0aGUgYXBwcm9wcmlhdGUgZXZlbnQgdHlwZS5cbiAgICpcbiAgICogVGhlIHRocmVlIGZ1bmN0aW9uYWxpdGllcyBvZiB0aGlzIGNhbGwgYXJlIGRlbGliZXJhdGVseSBub3Qgc3BsaXQgaW50b1xuICAgKiB0aHJlZSBtZXRob2RzIChhbmQgdGhlbiBkZWNsYXJlZCBhcyBhbiBhYnN0cmFjdCBpbnRlcmZhY2UpLCBiZWNhdXNlIHRoZVxuICAgKiBpbnRlcmZhY2UgaXMgdXNlZCBieSBFdmVudENvbnRyYWN0LCB3aGljaCBsaXZlcyBpbiBhIGRpZmZlcmVudCBqc2JpbmFyeS5cbiAgICogVGhlcmVmb3JlIHRoZSBpbnRlcmZhY2UgYmV0d2VlbiB0aGUgdGhyZWUgaXMgZGVmaW5lZCBlbnRpcmVseSBpbiB0ZXJtcyB0aGF0XG4gICAqIGFyZSBpbnZhcmlhbnQgdW5kZXIganNjb21waWxlciBwcm9jZXNzaW5nIChGdW5jdGlvbiBhbmQgQXJyYXksIGFzIG9wcG9zZWRcbiAgICogdG8gYSBjdXN0b20gdHlwZSB3aXRoIG1ldGhvZCBuYW1lcykuXG4gICAqXG4gICAqIEBwYXJhbSBldmVudEluZm8gVGhlIGluZm8gZm9yIHRoZSBldmVudCB0aGF0IHRyaWdnZXJlZCB0aGlzIGNhbGwgb3IgdGhlXG4gICAqICAgICBxdWV1ZSBvZiBldmVudHMgZnJvbSBFdmVudENvbnRyYWN0LlxuICAgKiBAcGFyYW0gaXNHbG9iYWxEaXNwYXRjaCBJZiB0cnVlLCBkaXNwYXRjaGVzIGEgZ2xvYmFsIGV2ZW50IGluc3RlYWQgb2YgYVxuICAgKiAgICAgcmVndWxhciBqc2FjdGlvbiBoYW5kbGVyLlxuICAgKiBAcmV0dXJuIEFuIGBFdmVudEluZm9gIGZvciB0aGUgYEV2ZW50Q29udHJhY3RgIHRvIGhhbmRsZSBhZ2FpbiBpZiB0aGVcbiAgICogICAgYERpc3BhdGNoZXJgIHRyaWVkIHRvIHJlc29sdmUgYW4gYTExeSBldmVudCBhcyBhIGNsaWNrIGJ1dCBmYWlsZWQuXG4gICAqL1xuICBkaXNwYXRjaChldmVudEluZm86IEV2ZW50SW5mbywgaXNHbG9iYWxEaXNwYXRjaD86IGJvb2xlYW4pOiBFdmVudEluZm8gfCB2b2lkIHtcbiAgICBjb25zdCBldmVudEluZm9XcmFwcGVyID0gbmV3IEV2ZW50SW5mb1dyYXBwZXIoZXZlbnRJbmZvKTtcbiAgICBpZiAoZXZlbnRJbmZvV3JhcHBlci5nZXRJc1JlcGxheSgpKSB7XG4gICAgICBpZiAoaXNHbG9iYWxEaXNwYXRjaCB8fCAhdGhpcy5ldmVudFJlcGxheWVyKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHJlc29sdmVkID0gcmVzb2x2ZUExMXlFdmVudChldmVudEluZm9XcmFwcGVyLCBpc0dsb2JhbERpc3BhdGNoKTtcbiAgICAgIGlmICghcmVzb2x2ZWQpIHtcbiAgICAgICAgLy8gU2VuZCB0aGUgZXZlbnQgYmFjayB0aHJvdWdoIHRoZSBgRXZlbnRDb250cmFjdGAgYnkgZGlzcGF0Y2hpbmcgdG9cbiAgICAgICAgLy8gdGhlIGJyb3dzZXIuXG4gICAgICAgIHJlcGxheUV2ZW50KFxuICAgICAgICAgIGV2ZW50SW5mb1dyYXBwZXIuZ2V0RXZlbnQoKSxcbiAgICAgICAgICBldmVudEluZm9XcmFwcGVyLmdldFRhcmdldEVsZW1lbnQoKSxcbiAgICAgICAgICBldmVudEluZm9XcmFwcGVyLmdldEV2ZW50VHlwZSgpLFxuICAgICAgICApO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICB0aGlzLnF1ZXVlRXZlbnRJbmZvV3JhcHBlcihldmVudEluZm9XcmFwcGVyKTtcbiAgICAgIHRoaXMuc2NoZWR1bGVFdmVudFJlcGxheSgpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCByZXNvbHZlZCA9IHJlc29sdmVBMTF5RXZlbnQoZXZlbnRJbmZvV3JhcHBlciwgaXNHbG9iYWxEaXNwYXRjaCk7XG4gICAgaWYgKCFyZXNvbHZlZCkge1xuICAgICAgLy8gUmVzZXQgYWN0aW9uIGluZm9ybWF0aW9uLlxuICAgICAgZXZlbnRJbmZvV3JhcHBlci5zZXRBY3Rpb24odW5kZWZpbmVkKTtcbiAgICAgIHJldHVybiBldmVudEluZm9XcmFwcGVyLmV2ZW50SW5mbztcbiAgICB9XG4gICAgdGhpcy5kaXNwYXRjaERlbGVnYXRlKGV2ZW50SW5mb1dyYXBwZXIsIGlzR2xvYmFsRGlzcGF0Y2gpO1xuICB9XG5cbiAgLyoqIFF1ZXVlIGFuIGBFdmVudEluZm9XcmFwcGVyYCBmb3IgcmVwbGF5LiAqL1xuICBxdWV1ZUV2ZW50SW5mb1dyYXBwZXIoZXZlbnRJbmZvV3JhcHBlcjogRXZlbnRJbmZvV3JhcHBlcikge1xuICAgIHRoaXMucXVldWVkRXZlbnRJbmZvV3JhcHBlcnMucHVzaChldmVudEluZm9XcmFwcGVyKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXBsYXlzIHF1ZXVlZCBldmVudHMsIGlmIGFueS4gVGhlIHJlcGxheWluZyB3aWxsIGhhcHBlbiBpbiBpdHMgb3duXG4gICAqIHN0YWNrIG9uY2UgdGhlIGN1cnJlbnQgZmxvdyBjZWRlcyBjb250cm9sLiBUaGlzIGlzIGRvbmUgdG8gbWltaWNcbiAgICogYnJvd3NlciBldmVudCBoYW5kbGluZy5cbiAgICovXG4gIHNjaGVkdWxlRXZlbnRSZXBsYXkoKSB7XG4gICAgaWYgKFxuICAgICAgdGhpcy5ldmVudFJlcGxheVNjaGVkdWxlZCB8fFxuICAgICAgIXRoaXMuZXZlbnRSZXBsYXllciB8fFxuICAgICAgdGhpcy5xdWV1ZWRFdmVudEluZm9XcmFwcGVycy5sZW5ndGggPT09IDBcbiAgICApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5ldmVudFJlcGxheVNjaGVkdWxlZCA9IHRydWU7XG4gICAgUHJvbWlzZS5yZXNvbHZlKCkudGhlbigoKSA9PiB7XG4gICAgICB0aGlzLmV2ZW50UmVwbGF5U2NoZWR1bGVkID0gZmFsc2U7XG4gICAgICB0aGlzLmV2ZW50UmVwbGF5ZXIhKHRoaXMucXVldWVkRXZlbnRJbmZvV3JhcHBlcnMpO1xuICAgIH0pO1xuICB9XG59XG5cbi8qKlxuICogSWYgYSAnTUFZQkVfQ0xJQ0tfRVZFTlRfVFlQRScgZXZlbnQgd2FzIGRpc3BhdGNoZWQsIHVwZGF0ZXMgdGhlIGV2ZW50VHlwZVxuICogdG8gZWl0aGVyIGNsaWNrIG9yIGtleWRvd24gYmFzZWQgb24gd2hldGhlciB0aGUga2V5ZG93biBhY3Rpb24gY2FuIGJlXG4gKiB0cmVhdGVkIGFzIGEgY2xpY2suIEZvciBNQVlCRV9DTElDS19FVkVOVF9UWVBFIGV2ZW50cyB0aGF0IGFyZSBqdXN0XG4gKiBrZXlkb3ducywgd2Ugc2V0IGZsYWdzIG9uIHRoZSBldmVudCBvYmplY3Qgc28gdGhhdCB0aGUgZXZlbnQgY29udHJhY3RcbiAqIGRvZXMndCB0cnkgdG8gZGlzcGF0Y2ggaXQgYXMgYSBNQVlCRV9DTElDS19FVkVOVF9UWVBFIGFnYWluLlxuICpcbiAqIEBwYXJhbSBpc0dsb2JhbERpc3BhdGNoIFdoZXRoZXIgdGhlIGV2ZW50SW5mbyBpcyBtZWFudCB0byBiZSBkaXNwYXRjaGVkIHRvXG4gKiAgICAgdGhlIGdsb2JhbCBoYW5kbGVycy5cbiAqIEByZXR1cm4gUmV0dXJucyBmYWxzZSBpZiB0aGUgYTExeSBldmVudCBjb3VsZCBub3QgYmUgcmVzb2x2ZWQgYW5kIHNob3VsZFxuICogICAgYmUgcmUtZGlzcGF0Y2hlZC5cbiAqL1xuZnVuY3Rpb24gcmVzb2x2ZUExMXlFdmVudChldmVudEluZm9XcmFwcGVyOiBFdmVudEluZm9XcmFwcGVyLCBpc0dsb2JhbERpc3BhdGNoID0gZmFsc2UpOiBib29sZWFuIHtcbiAgaWYgKGV2ZW50SW5mb1dyYXBwZXIuZ2V0RXZlbnRUeXBlKCkgIT09IEFjY2Vzc2liaWxpdHlBdHRyaWJ1dGUuTUFZQkVfQ0xJQ0tfRVZFTlRfVFlQRSkge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG4gIGlmIChpc0ExMXlDbGlja0V2ZW50KGV2ZW50SW5mb1dyYXBwZXIsIGlzR2xvYmFsRGlzcGF0Y2gpKSB7XG4gICAgaWYgKHNob3VsZFByZXZlbnREZWZhdWx0KGV2ZW50SW5mb1dyYXBwZXIpKSB7XG4gICAgICBldmVudExpYi5wcmV2ZW50RGVmYXVsdChldmVudEluZm9XcmFwcGVyLmdldEV2ZW50KCkpO1xuICAgIH1cbiAgICAvLyBJZiB0aGUga2V5ZG93biBldmVudCBjYW4gYmUgdHJlYXRlZCBhcyBhIGNsaWNrLCB3ZSBjaGFuZ2UgdGhlIGV2ZW50VHlwZVxuICAgIC8vIHRvICdjbGljaycgc28gdGhhdCB0aGUgZGlzcGF0Y2hlciBjYW4gcmV0cmlldmUgdGhlIHJpZ2h0IGhhbmRsZXIgZm9yXG4gICAgLy8gaXQuIEV2ZW4gdGhvdWdoIEV2ZW50SW5mb1snYWN0aW9uJ10gY29ycmVzcG9uZHMgdG8gdGhlIGNsaWNrIGFjdGlvbixcbiAgICAvLyB0aGUgZ2xvYmFsIGhhbmRsZXIgYW5kIGFueSBjdXN0b20gJ2dldEhhbmRsZXInIGltcGxlbWVudGF0aW9ucyBtYXkgcmVseVxuICAgIC8vIG9uIHRoZSBldmVudFR5cGUgaW5zdGVhZC5cbiAgICBldmVudEluZm9XcmFwcGVyLnNldEV2ZW50VHlwZShFdmVudFR5cGUuQ0xJQ0spO1xuICB9IGVsc2Uge1xuICAgIC8vIE90aGVyd2lzZSwgaWYgdGhlIGtleWRvd24gY2FuJ3QgYmUgdHJlYXRlZCBhcyBhIGNsaWNrLCB3ZSBuZWVkIHRvXG4gICAgLy8gcmV0cmlnZ2VyIGl0IGJlY2F1c2Ugbm93IHdlIG5lZWQgdG8gbG9vayBmb3IgJ2tleWRvd24nIGFjdGlvbnMgaW5zdGVhZC5cbiAgICBldmVudEluZm9XcmFwcGVyLnNldEV2ZW50VHlwZShFdmVudFR5cGUuS0VZRE9XTik7XG4gICAgaWYgKCFpc0dsb2JhbERpc3BhdGNoKSB7XG4gICAgICAvLyBUaGlzIHByZXZlbnRzIHRoZSBldmVudCBjb250cmFjdCBmcm9tIHNldHRpbmcgdGhlXG4gICAgICAvLyBBY2Nlc3NpYmlsaXR5QXR0cmlidXRlLk1BWUJFX0NMSUNLX0VWRU5UX1RZUEUgdHlwZSBmb3IgS2V5ZG93blxuICAgICAgLy8gZXZlbnRzLlxuICAgICAgZXZlbnRJbmZvV3JhcHBlci5nZXRFdmVudCgpW0FjY2Vzc2liaWxpdHlBdHRyaWJ1dGUuU0tJUF9BMTFZX0NIRUNLXSA9IHRydWU7XG4gICAgICAvLyBTaW5jZSBnbG9iYWxseSBkaXNwYXRjaGVkIGV2ZW50cyB3aWxsIGdldCBoYW5kbGVkIGJ5IHRoZSBkaXNwYXRjaGVyLFxuICAgICAgLy8gZG9uJ3QgaGF2ZSB0aGUgZXZlbnQgY29udHJhY3QgZGlzcGF0Y2ggaXQgYWdhaW4uXG4gICAgICBldmVudEluZm9XcmFwcGVyLmdldEV2ZW50KClbQWNjZXNzaWJpbGl0eUF0dHJpYnV0ZS5TS0lQX0dMT0JBTF9ESVNQQVRDSF0gPSB0cnVlO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuICByZXR1cm4gdHJ1ZTtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIHRydWUgaWYgdGhlIGRlZmF1bHQgYWN0aW9uIGZvciB0aGlzIGV2ZW50IHNob3VsZCBiZSBwcmV2ZW50ZWRcbiAqIGJlZm9yZSB0aGUgZXZlbnQgaGFuZGxlciBpcyBlbnZva2VkLlxuICovXG5mdW5jdGlvbiBzaG91bGRQcmV2ZW50RGVmYXVsdChldmVudEluZm9XcmFwcGVyOiBFdmVudEluZm9XcmFwcGVyKTogYm9vbGVhbiB7XG4gIGNvbnN0IGFjdGlvbkVsZW1lbnQgPSBldmVudEluZm9XcmFwcGVyLmdldEFjdGlvbigpPy5lbGVtZW50O1xuICAvLyBGb3IgcGFyaXR5IHdpdGggbm8tYTExeS1zdXBwb3J0IGJlaGF2aW9yLlxuICBpZiAoIWFjdGlvbkVsZW1lbnQpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgLy8gUHJldmVudCBzY3JvbGxpbmcgaWYgdGhlIFNwYWNlIGtleSB3YXMgcHJlc3NlZFxuICBpZiAoZXZlbnRMaWIuaXNTcGFjZUtleUV2ZW50KGV2ZW50SW5mb1dyYXBwZXIuZ2V0RXZlbnQoKSkpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICAvLyBvciBwcmV2ZW50IHRoZSBicm93c2VyJ3MgZGVmYXVsdCBhY3Rpb24gZm9yIG5hdGl2ZSBIVE1MIGNvbnRyb2xzLlxuICBpZiAoZXZlbnRMaWIuc2hvdWxkQ2FsbFByZXZlbnREZWZhdWx0T25OYXRpdmVIdG1sQ29udHJvbChldmVudEluZm9XcmFwcGVyLmdldEV2ZW50KCkpKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgLy8gUHJldmVudCBicm93c2VyIGZyb20gZm9sbG93aW5nIDxhPiBub2RlIGxpbmtzIGlmIGEganNhY3Rpb24gaXMgcHJlc2VudFxuICAvLyBhbmQgd2UgYXJlIGRpc3BhdGNoaW5nIHRoZSBhY3Rpb24gbm93LiBOb3RlIHRoYXQgdGhlIHRhcmdldEVsZW1lbnQgbWF5IGJlXG4gIC8vIGEgY2hpbGQgb2YgYW4gYW5jaG9yIHRoYXQgaGFzIGEganNhY3Rpb24gYXR0YWNoZWQuIEZvciB0aGF0IHJlYXNvbiwgd2VcbiAgLy8gbmVlZCB0byBjaGVjayB0aGUgYWN0aW9uRWxlbWVudCByYXRoZXIgdGhhbiB0aGUgdGFyZ2V0RWxlbWVudC5cbiAgaWYgKGFjdGlvbkVsZW1lbnQudGFnTmFtZSA9PT0gJ0EnKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG4vKipcbiAqIFJldHVybnMgdHJ1ZSBpZiB0aGUgZ2l2ZW4ga2V5IGV2ZW50IGNhbiBiZSB0cmVhdGVkIGFzIGEgJ2NsaWNrJy5cbiAqXG4gKiBAcGFyYW0gaXNHbG9iYWxEaXNwYXRjaCBXaGV0aGVyIHRoZSBldmVudEluZm8gaXMgbWVhbnQgdG8gYmUgZGlzcGF0Y2hlZCB0b1xuICogICAgIHRoZSBnbG9iYWwgaGFuZGxlcnMuXG4gKi9cbmZ1bmN0aW9uIGlzQTExeUNsaWNrRXZlbnQoZXZlbnRJbmZvV3JhcHBlcjogRXZlbnRJbmZvV3JhcHBlciwgaXNHbG9iYWxEaXNwYXRjaD86IGJvb2xlYW4pOiBib29sZWFuIHtcbiAgcmV0dXJuIChcbiAgICAoaXNHbG9iYWxEaXNwYXRjaCB8fCBldmVudEluZm9XcmFwcGVyLmdldEFjdGlvbigpICE9PSB1bmRlZmluZWQpICYmXG4gICAgZXZlbnRMaWIuaXNBY3Rpb25LZXlFdmVudChldmVudEluZm9XcmFwcGVyLmdldEV2ZW50KCkpXG4gICk7XG59XG5cbi8qKlxuICogUmVnaXN0ZXJzIGRlZmVycmVkIGZ1bmN0aW9uYWxpdHkgZm9yIGFuIEV2ZW50Q29udHJhY3QgYW5kIGEgSnNhY3Rpb25cbiAqIERpc3BhdGNoZXIuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZWdpc3RlckRpc3BhdGNoZXIoXG4gIGV2ZW50Q29udHJhY3Q6IFVucmVuYW1lZEV2ZW50Q29udHJhY3QsXG4gIGRpc3BhdGNoZXI6IEJhc2VEaXNwYXRjaGVyLFxuKSB7XG4gIGV2ZW50Q29udHJhY3QuZWNyZCgoZXZlbnRJbmZvOiBFdmVudEluZm8sIGdsb2JhbERpc3BhdGNoPzogYm9vbGVhbikgPT4ge1xuICAgIHJldHVybiBkaXNwYXRjaGVyLmRpc3BhdGNoKGV2ZW50SW5mbywgZ2xvYmFsRGlzcGF0Y2gpO1xuICB9LCBSZXN0cmljdGlvbi5JX0FNX1RIRV9KU0FDVElPTl9GUkFNRVdPUkspO1xufVxuIl19