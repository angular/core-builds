/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as eventLib from './event';
import { A11Y_CLICK_SUPPORT, MOUSE_SPECIAL_SUPPORT } from './event_contract_defines';
import * as eventInfoLib from './event_info';
import { NON_BUBBLING_MOUSE_EVENTS } from './event_type';
/**
 * EventContract intercepts events in the bubbling phase at the
 * boundary of a container element, and maps them to generic actions
 * which are specified using the custom jsaction attribute in
 * HTML. Behavior of the application is then specified in terms of
 * handler for such actions, cf. jsaction.Dispatcher in dispatcher.js.
 *
 * This has several benefits: (1) No DOM event handlers need to be
 * registered on the specific elements in the UI. (2) The set of
 * events that the application has to handle can be specified in terms
 * of the semantics of the application, rather than in terms of DOM
 * events. (3) Invocation of handlers can be delayed and handlers can
 * be delay loaded in a generic way.
 */
export class EventContract {
    static { this.A11Y_CLICK_SUPPORT = A11Y_CLICK_SUPPORT; }
    static { this.MOUSE_SPECIAL_SUPPORT = MOUSE_SPECIAL_SUPPORT; }
    constructor(containerManager, useActionResolver) {
        this.useActionResolver = useActionResolver;
        /**
         * The DOM events which this contract covers. Used to prevent double
         * registration of event types. The value of the map is the
         * internally created DOM event handler function that handles the
         * DOM events. See addEvent().
         *
         */
        this.eventHandlers = {};
        this.browserEventTypeToExtraEventTypes = {};
        /**
         * The dispatcher function. Events are passed to this function for
         * handling once it was set using the registerDispatcher() method. This is
         * done because the function is passed from another jsbinary, so passing the
         * instance and invoking the method here would require to leave the method
         * unobfuscated.
         */
        this.dispatcher = null;
        /**
         * The list of suspended `EventInfo` that will be dispatched
         * as soon as the `Dispatcher` is registered.
         */
        this.queuedEventInfos = [];
        this.containerManager = containerManager;
    }
    handleEvent(eventType, event, container) {
        const eventInfo = eventInfoLib.createEventInfoFromParameters(
        /* eventType= */ eventType, 
        /* event= */ event, 
        /* targetElement= */ event.target, 
        /* container= */ container, 
        /* timestamp= */ Date.now());
        this.handleEventInfo(eventInfo);
    }
    /**
     * Handle an `EventInfo`.
     */
    handleEventInfo(eventInfo) {
        if (!this.dispatcher) {
            // All events are queued when the dispatcher isn't yet loaded.
            eventInfoLib.setIsReplay(eventInfo, true);
            this.queuedEventInfos?.push(eventInfo);
            return;
        }
        this.dispatcher(eventInfo);
    }
    /**
     * Enables jsaction handlers to be called for the event type given by
     * name.
     *
     * If the event is already registered, this does nothing.
     *
     * @param prefixedEventType If supplied, this event is used in
     *     the actual browser event registration instead of the name that is
     *     exposed to jsaction. Use this if you e.g. want users to be able
     *     to subscribe to jsaction="transitionEnd:foo" while the underlying
     *     event is webkitTransitionEnd in one browser and mozTransitionEnd
     *     in another.
     */
    addEvent(eventType, prefixedEventType) {
        if (eventType in this.eventHandlers || !this.containerManager) {
            return;
        }
        if (!EventContract.MOUSE_SPECIAL_SUPPORT && NON_BUBBLING_MOUSE_EVENTS.indexOf(eventType) >= 0) {
            return;
        }
        const eventHandler = (eventType, event, container) => {
            this.handleEvent(eventType, event, container);
        };
        // Store the callback to allow us to replay events.
        this.eventHandlers[eventType] = eventHandler;
        const browserEventType = eventLib.getBrowserEventType(prefixedEventType || eventType);
        if (browserEventType !== eventType) {
            const eventTypes = this.browserEventTypeToExtraEventTypes[browserEventType] || [];
            eventTypes.push(eventType);
            this.browserEventTypeToExtraEventTypes[browserEventType] = eventTypes;
        }
        this.containerManager.addEventListener(browserEventType, (element) => {
            return (event) => {
                eventHandler(eventType, event, element);
            };
        });
    }
    /**
     * Gets the queued early events and replay them using the appropriate handler
     * in the provided event contract. Once all the events are replayed, it cleans
     * up the early contract.
     */
    replayEarlyEvents(earlyJsactionContainer = window) {
        // Check if the early contract is present and prevent calling this function
        // more than once.
        const earlyJsactionData = earlyJsactionContainer._ejsa;
        if (!earlyJsactionData) {
            return;
        }
        // Replay the early contract events.
        const earlyEventInfos = earlyJsactionData.q;
        for (let idx = 0; idx < earlyEventInfos.length; idx++) {
            const earlyEventInfo = earlyEventInfos[idx];
            const eventTypes = this.getEventTypesForBrowserEventType(earlyEventInfo.eventType);
            for (let i = 0; i < eventTypes.length; i++) {
                const eventInfo = eventInfoLib.cloneEventInfo(earlyEventInfo);
                // EventInfo eventType maps to JSAction's internal event type,
                // rather than the browser event type.
                eventInfoLib.setEventType(eventInfo, eventTypes[i]);
                this.handleEventInfo(eventInfo);
            }
        }
        // Clean up the early contract.
        const earlyEventHandler = earlyJsactionData.h;
        removeEventListeners(earlyJsactionData.c, earlyJsactionData.et, earlyEventHandler);
        removeEventListeners(earlyJsactionData.c, earlyJsactionData.etc, earlyEventHandler, true);
        delete earlyJsactionContainer._ejsa;
    }
    /**
     * Returns all JSAction event types that have been registered for a given
     * browser event type.
     */
    getEventTypesForBrowserEventType(browserEventType) {
        const eventTypes = [];
        if (this.eventHandlers[browserEventType]) {
            eventTypes.push(browserEventType);
        }
        if (this.browserEventTypeToExtraEventTypes[browserEventType]) {
            eventTypes.push(...this.browserEventTypeToExtraEventTypes[browserEventType]);
        }
        return eventTypes;
    }
    /**
     * Returns the event handler function for a given event type.
     */
    handler(eventType) {
        return this.eventHandlers[eventType];
    }
    /**
     * Cleans up the event contract. This resets all of the `EventContract`'s
     * internal state. Users are responsible for not using this `EventContract`
     * after it has been cleaned up.
     */
    cleanUp() {
        this.containerManager.cleanUp();
        this.containerManager = null;
        this.eventHandlers = {};
        this.browserEventTypeToExtraEventTypes = {};
        this.dispatcher = null;
        this.queuedEventInfos = [];
    }
    /**
     * Register a dispatcher function. Event info of each event mapped to
     * a jsaction is passed for handling to this callback. The queued
     * events are passed as well to the dispatcher for later replaying
     * once the dispatcher is registered. Clears the event queue to null.
     *
     * @param dispatcher The dispatcher function.
     * @param restriction
     */
    registerDispatcher(dispatcher, restriction) {
        this.ecrd(dispatcher, restriction);
    }
    /**
     * Unrenamed alias for registerDispatcher. Necessary for any codebases that
     * split the `EventContract` and `Dispatcher` code into different compilation
     * units.
     */
    ecrd(dispatcher, restriction) {
        this.dispatcher = dispatcher;
        if (this.queuedEventInfos?.length) {
            for (let i = 0; i < this.queuedEventInfos.length; i++) {
                this.handleEventInfo(this.queuedEventInfos[i]);
            }
            this.queuedEventInfos = null;
        }
    }
    /**
     * Adds a11y click support to the given `EventContract`. Meant to be called in
     * the same compilation unit as the `EventContract`.
     */
    addA11yClickSupport() { }
    /**
     * Enables a11y click support to be deferred. Meant to be called in the same
     * compilation unit as the `EventContract`.
     */
    exportAddA11yClickSupport() { }
}
function removeEventListeners(container, eventTypes, earlyEventHandler, capture) {
    for (let idx = 0; idx < eventTypes.length; idx++) {
        container.removeEventListener(eventTypes[idx], earlyEventHandler, /* useCapture */ capture);
    }
}
/**
 * Adds a11y click support to the given `EventContract`. Meant to be called
 * in a different compilation unit from the `EventContract`. The `EventContract`
 * must have called `exportAddA11yClickSupport` in its compilation unit for this
 * to have any effect.
 */
export function addDeferredA11yClickSupport(eventContract) { }
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXZlbnRjb250cmFjdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvcHJpbWl0aXZlcy9ldmVudC1kaXNwYXRjaC9zcmMvZXZlbnRjb250cmFjdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUEyQkgsT0FBTyxLQUFLLFFBQVEsTUFBTSxTQUFTLENBQUM7QUFFcEMsT0FBTyxFQUFDLGtCQUFrQixFQUFFLHFCQUFxQixFQUFDLE1BQU0sMEJBQTBCLENBQUM7QUFDbkYsT0FBTyxLQUFLLFlBQVksTUFBTSxjQUFjLENBQUM7QUFDN0MsT0FBTyxFQUFZLHlCQUF5QixFQUFDLE1BQU0sY0FBYyxDQUFDO0FBeUJsRTs7Ozs7Ozs7Ozs7OztHQWFHO0FBQ0gsTUFBTSxPQUFPLGFBQWE7YUFDakIsdUJBQWtCLEdBQUcsa0JBQWtCLEFBQXJCLENBQXNCO2FBQ3hDLDBCQUFxQixHQUFHLHFCQUFxQixBQUF4QixDQUF5QjtJQThCckQsWUFDRSxnQkFBK0MsRUFDOUIsaUJBQXlCO1FBQXpCLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBUTtRQTVCNUM7Ozs7OztXQU1HO1FBQ0ssa0JBQWEsR0FBa0MsRUFBRSxDQUFDO1FBRWxELHNDQUFpQyxHQUE4QixFQUFFLENBQUM7UUFFMUU7Ozs7OztXQU1HO1FBQ0ssZUFBVSxHQUFzQixJQUFJLENBQUM7UUFFN0M7OztXQUdHO1FBQ0sscUJBQWdCLEdBQW9DLEVBQUUsQ0FBQztRQU03RCxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsZ0JBQWdCLENBQUM7SUFDM0MsQ0FBQztJQUVPLFdBQVcsQ0FBQyxTQUFpQixFQUFFLEtBQVksRUFBRSxTQUFrQjtRQUNyRSxNQUFNLFNBQVMsR0FBRyxZQUFZLENBQUMsNkJBQTZCO1FBQzFELGdCQUFnQixDQUFDLFNBQVM7UUFDMUIsWUFBWSxDQUFDLEtBQUs7UUFDbEIsb0JBQW9CLENBQUMsS0FBSyxD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QixDQUMzQixTQUFzQixFQUN0QixVQUFvQixFQUNwQixpQkFBcUMsRUFDckMsT0FBaUI7SUFFakIsS0FBSyxJQUFJLEdBQUcsR0FBRyxDQUFDLEVBQUUsR0FBRyxHQUFHLFVBQVUsQ0FBQyxNQUFNLEVBQUUsR0FBRyxFQUFFLEVBQUUsQ0FBQztRQUNqRCxTQUFTLENBQUMsbUJBQW1CLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxFQUFFLGlCQUFpQixFQUFFLGdCQUFnQixDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQzlGLENBQUM7QUFDSCxDQUFDO0FBRUQ7Ozs7O0dBS0c7QUFDSCxNQUFNLFVBQVUsMkJBQTJCLENBQUMsYUFBNEIsSUFBRyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbi8qKlxuICogQGZpbGVvdmVydmlldyBJbXBsZW1lbnRzIHRoZSBsb2NhbCBldmVudCBoYW5kbGluZyBjb250cmFjdC4gVGhpc1xuICogYWxsb3dzIERPTSBvYmplY3RzIGluIGEgY29udGFpbmVyIHRoYXQgZW50ZXJzIGludG8gdGhpcyBjb250cmFjdCB0b1xuICogZGVmaW5lIGV2ZW50IGhhbmRsZXJzIHdoaWNoIGFyZSBleGVjdXRlZCBpbiBhIGxvY2FsIGNvbnRleHQuXG4gKlxuICogT25lIEV2ZW50Q29udHJhY3QgaW5zdGFuY2UgY2FuIG1hbmFnZSB0aGUgY29udHJhY3QgZm9yIG11bHRpcGxlXG4gKiBjb250YWluZXJzLCB3aGljaCBhcmUgYWRkZWQgdXNpbmcgdGhlIGFkZENvbnRhaW5lcigpIG1ldGhvZC5cbiAqXG4gKiBFdmVudHMgY2FuIGJlIHJlZ2lzdGVyZWQgdXNpbmcgdGhlIGFkZEV2ZW50KCkgbWV0aG9kLlxuICpcbiAqIEEgRGlzcGF0Y2hlciBpcyBhZGRlZCB1c2luZyB0aGUgcmVnaXN0ZXJEaXNwYXRjaGVyKCkgbWV0aG9kLiBVbnRpbCB0aGVyZSBpc1xuICogYSBkaXNwYXRjaGVyLCBldmVudHMgYXJlIHF1ZXVlZC4gVGhlIGlkZWEgaXMgdGhhdCB0aGUgRXZlbnRDb250cmFjdFxuICogY2xhc3MgaXMgaW5saW5lZCBpbiB0aGUgSFRNTCBvZiB0aGUgdG9wIGxldmVsIHBhZ2UgYW5kIGluc3RhbnRpYXRlZFxuICogcmlnaHQgYWZ0ZXIgdGhlIHN0YXJ0IG9mIDxib2R5Pi4gVGhlIERpc3BhdGNoZXIgY2xhc3MgaXMgY29udGFpbmVkXG4gKiBpbiB0aGUgZXh0ZXJuYWwgZGVmZXJyZWQganMsIGFuZCBpbnN0YW50aWF0ZWQgYW5kIHJlZ2lzdGVyZWQgd2l0aFxuICogRXZlbnRDb250cmFjdCB3aGVuIHRoZSBleHRlcm5hbCBqYXZhc2NyaXB0IGluIHRoZSBwYWdlIGxvYWRzLiBUaGVcbiAqIGV4dGVybmFsIGphdmFzY3JpcHQgd2lsbCBhbHNvIHJlZ2lzdGVyIHRoZSBqc2FjdGlvbiBoYW5kbGVycywgd2hpY2hcbiAqIHRoZW4gcGljayB1cCB0aGUgcXVldWVkIGV2ZW50cyBhdCB0aGUgdGltZSBvZiByZWdpc3RyYXRpb24uXG4gKlxuICogU2luY2UgdGhpcyBjbGFzcyBpcyBtZWFudCB0byBiZSBpbmxpbmVkIGluIHRoZSBtYWluIHBhZ2UgSFRNTCwgdGhlXG4gKiBzaXplIG9mIHRoZSBiaW5hcnkgY29tcGlsZWQgZnJvbSB0aGlzIGZpbGUgTVVTVCBiZSBrZXB0IGFzIHNtYWxsIGFzXG4gKiBwb3NzaWJsZSBhbmQgdGh1cyBpdHMgZGVwZW5kZW5jaWVzIHRvIGEgbWluaW11bS5cbiAqL1xuXG5pbXBvcnQge0Vhcmx5SnNhY3Rpb25EYXRhLCBFYXJseUpzYWN0aW9uRGF0YUNvbnRhaW5lcn0gZnJvbSAnLi9lYXJseWV2ZW50Y29udHJhY3QnO1xuaW1wb3J0ICogYXMgZXZlbnRMaWIgZnJvbSAnLi9ldmVudCc7XG5pbXBvcnQge0V2ZW50Q29udHJhY3RDb250YWluZXJNYW5hZ2VyfSBmcm9tICcuL2V2ZW50X2NvbnRyYWN0X2NvbnRhaW5lcic7XG5pbXBvcnQge0ExMVlfQ0xJQ0tfU1VQUE9SVCwgTU9VU0VfU1BFQ0lBTF9TVVBQT1JUfSBmcm9tICcuL2V2ZW50X2NvbnRyYWN0X2RlZmluZXMnO1xuaW1wb3J0ICogYXMgZXZlbnRJbmZvTGliIGZyb20gJy4vZXZlbnRfaW5mbyc7XG5pbXBvcnQge0V2ZW50VHlwZSwgTk9OX0JVQkJMSU5HX01PVVNFX0VWRU5UU30gZnJvbSAnLi9ldmVudF90eXBlJztcbmltcG9ydCB7UmVzdHJpY3Rpb259IGZyb20gJy4vcmVzdHJpY3Rpb24nO1xuXG4vKipcbiAqIFRoZSBBUEkgb2YgYW4gRXZlbnRDb250cmFjdCB0aGF0IGlzIHNhZmUgdG8gY2FsbCBmcm9tIGFueSBjb21waWxhdGlvbiB1bml0LlxuICovXG5leHBvcnQgZGVjbGFyZSBpbnRlcmZhY2UgVW5yZW5hbWVkRXZlbnRDb250cmFjdCB7XG4gIC8vIEFsaWFzIGZvciBKc2N0aW9uIEV2ZW50Q29udHJhY3QgcmVnaXN0ZXJEaXNwYXRjaGVyLlxuICBlY3JkKGRpc3BhdGNoZXI6IERpc3BhdGNoZXIsIHJlc3RyaWN0aW9uOiBSZXN0cmljdGlvbik6IHZvaWQ7XG59XG5cbi8qKiBBIGZ1bmN0aW9uIHRoYXQgaXMgY2FsbGVkIHRvIGhhbmRsZSBldmVudHMgY2FwdHVyZWQgYnkgdGhlIEV2ZW50Q29udHJhY3QuICovXG5leHBvcnQgdHlwZSBEaXNwYXRjaGVyID0gKGV2ZW50SW5mbzogZXZlbnRJbmZvTGliLkV2ZW50SW5mbywgZ2xvYmFsRGlzcGF0Y2g/OiBib29sZWFuKSA9PiB2b2lkO1xuXG4vKipcbiAqIEEgZnVuY3Rpb24gdGhhdCBoYW5kbGVzIGFuIGV2ZW50IGRpc3BhdGNoZWQgZnJvbSB0aGUgYnJvd3Nlci5cbiAqXG4gKiBldmVudFR5cGU6IE1heSBkaWZmZXIgZnJvbSBgZXZlbnQudHlwZWAgaWYgSlNBY3Rpb24gdXNlcyBhXG4gKiBzaG9ydC1oYW5kIG5hbWUgb3IgaXMgcGF0Y2hpbmcgb3ZlciBhbiBub24tYnViYmxpbmcgZXZlbnQgd2l0aCBhIGJ1YmJsaW5nXG4gKiB2YXJpYW50LlxuICogZXZlbnQ6IFRoZSBuYXRpdmUgYnJvd3NlciBldmVudC5cbiAqIGNvbnRhaW5lcjogVGhlIGNvbnRhaW5lciBmb3IgdGhpcyBkaXNwYXRjaC5cbiAqL1xudHlwZSBFdmVudEhhbmRsZXIgPSAoZXZlbnRUeXBlOiBzdHJpbmcsIGV2ZW50OiBFdmVudCwgY29udGFpbmVyOiBFbGVtZW50KSA9PiB2b2lkO1xuXG4vKipcbiAqIEV2ZW50Q29udHJhY3QgaW50ZXJjZXB0cyBldmVudHMgaW4gdGhlIGJ1YmJsaW5nIHBoYXNlIGF0IHRoZVxuICogYm91bmRhcnkgb2YgYSBjb250YWluZXIgZWxlbWVudCwgYW5kIG1hcHMgdGhlbSB0byBnZW5lcmljIGFjdGlvbnNcbiAqIHdoaWNoIGFyZSBzcGVjaWZpZWQgdXNpbmcgdGhlIGN1c3RvbSBqc2FjdGlvbiBhdHRyaWJ1dGUgaW5cbiAqIEhUTUwuIEJlaGF2aW9yIG9mIHRoZSBhcHBsaWNhdGlvbiBpcyB0aGVuIHNwZWNpZmllZCBpbiB0ZXJtcyBvZlxuICogaGFuZGxlciBmb3Igc3VjaCBhY3Rpb25zLCBjZi4ganNhY3Rpb24uRGlzcGF0Y2hlciBpbiBkaXNwYXRjaGVyLmpzLlxuICpcbiAqIFRoaXMgaGFzIHNldmVyYWwgYmVuZWZpdHM6ICgxKSBObyBET00gZXZlbnQgaGFuZGxlcnMgbmVlZCB0byBiZVxuICogcmVnaXN0ZXJlZCBvbiB0aGUgc3BlY2lmaWMgZWxlbWVudHMgaW4gdGhlIFVJLiAoMikgVGhlIHNldCBvZlxuICogZXZlbnRzIHRoYXQgdGhlIGFwcGxpY2F0aW9uIGhhcyB0byBoYW5kbGUgY2FuIGJlIHNwZWNpZmllZCBpbiB0ZXJtc1xuICogb2YgdGhlIHNlbWFudGljcyBvZiB0aGUgYXBwbGljYXRpb24sIHJhdGhlciB0aGFuIGluIHRlcm1zIG9mIERPTVxuICogZXZlbnRzLiAoMykgSW52b2NhdGlvbiBvZiBoYW5kbGVycyBjYW4gYmUgZGVsYXllZCBhbmQgaGFuZGxlcnMgY2FuXG4gKiBiZSBkZWxheSBsb2FkZWQgaW4gYSBnZW5lcmljIHdheS5cbiAqL1xuZXhwb3J0IGNsYXNzIEV2ZW50Q29udHJhY3QgaW1wbGVtZW50cyBVbnJlbmFtZWRFdmVudENvbnRyYWN0IHtcbiAgc3RhdGljIEExMVlfQ0xJQ0tfU1VQUE9SVCA9IEExMVlfQ0xJQ0tfU1VQUE9SVDtcbiAgc3RhdGljIE1PVVNFX1NQRUNJQUxfU1VQUE9SVCA9IE1PVVNFX1NQRUNJQUxfU1VQUE9SVDtcblxuICBwcml2YXRlIGNvbnRhaW5lck1hbmFnZXI6IEV2ZW50Q29udHJhY3RDb250YWluZXJNYW5hZ2VyIHwgbnVsbDtcblxuICAvKipcbiAgICogVGhlIERPTSBldmVudHMgd2hpY2ggdGhpcyBjb250cmFjdCBjb3ZlcnMuIFVzZWQgdG8gcHJldmVudCBkb3VibGVcbiAgICogcmVnaXN0cmF0aW9uIG9mIGV2ZW50IHR5cGVzLiBUaGUgdmFsdWUgb2YgdGhlIG1hcCBpcyB0aGVcbiAgICogaW50ZXJuYWxseSBjcmVhdGVkIERPTSBldmVudCBoYW5kbGVyIGZ1bmN0aW9uIHRoYXQgaGFuZGxlcyB0aGVcbiAgICogRE9NIGV2ZW50cy4gU2VlIGFkZEV2ZW50KCkuXG4gICAqXG4gICAqL1xuICBwcml2YXRlIGV2ZW50SGFuZGxlcnM6IHtba2V5OiBzdHJpbmddOiBFdmVudEhhbmRsZXJ9ID0ge307XG5cbiAgcHJpdmF0ZSBicm93c2VyRXZlbnRUeXBlVG9FeHRyYUV2ZW50VHlwZXM6IHtba2V5OiBzdHJpbmddOiBzdHJpbmdbXX0gPSB7fTtcblxuICAvKipcbiAgICogVGhlIGRpc3BhdGNoZXIgZnVuY3Rpb24uIEV2ZW50cyBhcmUgcGFzc2VkIHRvIHRoaXMgZnVuY3Rpb24gZm9yXG4gICAqIGhhbmRsaW5nIG9uY2UgaXQgd2FzIHNldCB1c2luZyB0aGUgcmVnaXN0ZXJEaXNwYXRjaGVyKCkgbWV0aG9kLiBUaGlzIGlzXG4gICAqIGRvbmUgYmVjYXVzZSB0aGUgZnVuY3Rpb24gaXMgcGFzc2VkIGZyb20gYW5vdGhlciBqc2JpbmFyeSwgc28gcGFzc2luZyB0aGVcbiAgICogaW5zdGFuY2UgYW5kIGludm9raW5nIHRoZSBtZXRob2QgaGVyZSB3b3VsZCByZXF1aXJlIHRvIGxlYXZlIHRoZSBtZXRob2RcbiAgICogdW5vYmZ1c2NhdGVkLlxuICAgKi9cbiAgcHJpdmF0ZSBkaXNwYXRjaGVyOiBEaXNwYXRjaGVyIHwgbnVsbCA9IG51bGw7XG5cbiAgLyoqXG4gICAqIFRoZSBsaXN0IG9mIHN1c3BlbmRlZCBgRXZlbnRJbmZvYCB0aGF0IHdpbGwgYmUgZGlzcGF0Y2hlZFxuICAgKiBhcyBzb29uIGFzIHRoZSBgRGlzcGF0Y2hlcmAgaXMgcmVnaXN0ZXJlZC5cbiAgICovXG4gIHByaXZhdGUgcXVldWVkRXZlbnRJbmZvczogZXZlbnRJbmZvTGliLkV2ZW50SW5mb1tdIHwgbnVsbCA9IFtdO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIGNvbnRhaW5lck1hbmFnZXI6IEV2ZW50Q29udHJhY3RDb250YWluZXJNYW5hZ2VyLFxuICAgIHByaXZhdGUgcmVhZG9ubHkgdXNlQWN0aW9uUmVzb2x2ZXI/OiBmYWxzZSxcbiAgKSB7XG4gICAgdGhpcy5jb250YWluZXJNYW5hZ2VyID0gY29udGFpbmVyTWFuYWdlcjtcbiAgfVxuXG4gIHByaXZhdGUgaGFuZGxlRXZlbnQoZXZlbnRUeXBlOiBzdHJpbmcsIGV2ZW50OiBFdmVudCwgY29udGFpbmVyOiBFbGVtZW50KSB7XG4gICAgY29uc3QgZXZlbnRJbmZvID0gZXZlbnRJbmZvTGliLmNyZWF0ZUV2ZW50SW5mb0Zyb21QYXJhbWV0ZXJzKFxuICAgICAgLyogZXZlbnRUeXBlPSAqLyBldmVudFR5cGUsXG4gICAgICAvKiBldmVudD0gKi8gZXZlbnQsXG4gICAgICAvKiB0YXJnZXRFbGVtZW50PSAqLyBldmVudC50YXJnZXQgYXMgRWxlbWVudCxcbiAgICAgIC8qIGNvbnRhaW5lcj0gKi8gY29udGFpbmVyLFxuICAgICAgLyogdGltZXN0YW1wPSAqLyBEYXRlLm5vdygpLFxuICAgICk7XG4gICAgdGhpcy5oYW5kbGVFdmVudEluZm8oZXZlbnRJbmZvKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBIYW5kbGUgYW4gYEV2ZW50SW5mb2AuXG4gICAqL1xuICBwcml2YXRlIGhhbmRsZUV2ZW50SW5mbyhldmVudEluZm86IGV2ZW50SW5mb0xpYi5FdmVudEluZm8pIHtcbiAgICBpZiAoIXRoaXMuZGlzcGF0Y2hlcikge1xuICAgICAgLy8gQWxsIGV2ZW50cyBhcmUgcXVldWVkIHdoZW4gdGhlIGRpc3BhdGNoZXIgaXNuJ3QgeWV0IGxvYWRlZC5cbiAgICAgIGV2ZW50SW5mb0xpYi5zZXRJc1JlcGxheShldmVudEluZm8sIHRydWUpO1xuICAgICAgdGhpcy5xdWV1ZWRFdmVudEluZm9zPy5wdXNoKGV2ZW50SW5mbyk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMuZGlzcGF0Y2hlcihldmVudEluZm8pO1xuICB9XG5cbiAgLyoqXG4gICAqIEVuYWJsZXMganNhY3Rpb24gaGFuZGxlcnMgdG8gYmUgY2FsbGVkIGZvciB0aGUgZXZlbnQgdHlwZSBnaXZlbiBieVxuICAgKiBuYW1lLlxuICAgKlxuICAgKiBJZiB0aGUgZXZlbnQgaXMgYWxyZWFkeSByZWdpc3RlcmVkLCB0aGlzIGRvZXMgbm90aGluZy5cbiAgICpcbiAgICogQHBhcmFtIHByZWZpeGVkRXZlbnRUeXBlIElmIHN1cHBsaWVkLCB0aGlzIGV2ZW50IGlzIHVzZWQgaW5cbiAgICogICAgIHRoZSBhY3R1YWwgYnJvd3NlciBldmVudCByZWdpc3RyYXRpb24gaW5zdGVhZCBvZiB0aGUgbmFtZSB0aGF0IGlzXG4gICAqICAgICBleHBvc2VkIHRvIGpzYWN0aW9uLiBVc2UgdGhpcyBpZiB5b3UgZS5nLiB3YW50IHVzZXJzIHRvIGJlIGFibGVcbiAgICogICAgIHRvIHN1YnNjcmliZSB0byBqc2FjdGlvbj1cInRyYW5zaXRpb25FbmQ6Zm9vXCIgd2hpbGUgdGhlIHVuZGVybHlpbmdcbiAgICogICAgIGV2ZW50IGlzIHdlYmtpdFRyYW5zaXRpb25FbmQgaW4gb25lIGJyb3dzZXIgYW5kIG1velRyYW5zaXRpb25FbmRcbiAgICogICAgIGluIGFub3RoZXIuXG4gICAqL1xuICBhZGRFdmVudChldmVudFR5cGU6IHN0cmluZywgcHJlZml4ZWRFdmVudFR5cGU/OiBzdHJpbmcpIHtcbiAgICBpZiAoZXZlbnRUeXBlIGluIHRoaXMuZXZlbnRIYW5kbGVycyB8fCAhdGhpcy5jb250YWluZXJNYW5hZ2VyKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKCFFdmVudENvbnRyYWN0Lk1PVVNFX1NQRUNJQUxfU1VQUE9SVCAmJiBOT05fQlVCQkxJTkdfTU9VU0VfRVZFTlRTLmluZGV4T2YoZXZlbnRUeXBlKSA+PSAwKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgZXZlbnRIYW5kbGVyID0gKGV2ZW50VHlwZTogc3RyaW5nLCBldmVudDogRXZlbnQsIGNvbnRhaW5lcjogRWxlbWVudCkgPT4ge1xuICAgICAgdGhpcy5oYW5kbGVFdmVudChldmVudFR5cGUsIGV2ZW50LCBjb250YWluZXIpO1xuICAgIH07XG5cbiAgICAvLyBTdG9yZSB0aGUgY2FsbGJhY2sgdG8gYWxsb3cgdXMgdG8gcmVwbGF5IGV2ZW50cy5cbiAgICB0aGlzLmV2ZW50SGFuZGxlcnNbZXZlbnRUeXBlXSA9IGV2ZW50SGFuZGxlcjtcblxuICAgIGNvbnN0IGJyb3dzZXJFdmVudFR5cGUgPSBldmVudExpYi5nZXRCcm93c2VyRXZlbnRUeXBlKHByZWZpeGVkRXZlbnRUeXBlIHx8IGV2ZW50VHlwZSk7XG5cbiAgICBpZiAoYnJvd3NlckV2ZW50VHlwZSAhPT0gZXZlbnRUeXBlKSB7XG4gICAgICBjb25zdCBldmVudFR5cGVzID0gdGhpcy5icm93c2VyRXZlbnRUeXBlVG9FeHRyYUV2ZW50VHlwZXNbYnJvd3NlckV2ZW50VHlwZV0gfHwgW107XG4gICAgICBldmVudFR5cGVzLnB1c2goZXZlbnRUeXBlKTtcbiAgICAgIHRoaXMuYnJvd3NlckV2ZW50VHlwZVRvRXh0cmFFdmVudFR5cGVzW2Jyb3dzZXJFdmVudFR5cGVdID0gZXZlbnRUeXBlcztcbiAgICB9XG5cbiAgICB0aGlzLmNvbnRhaW5lck1hbmFnZXIuYWRkRXZlbnRMaXN0ZW5lcihicm93c2VyRXZlbnRUeXBlLCAoZWxlbWVudDogRWxlbWVudCkgPT4ge1xuICAgICAgcmV0dXJuIChldmVudDogRXZlbnQpID0+IHtcbiAgICAgICAgZXZlbnRIYW5kbGVyKGV2ZW50VHlwZSwgZXZlbnQsIGVsZW1lbnQpO1xuICAgICAgfTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBxdWV1ZWQgZWFybHkgZXZlbnRzIGFuZCByZXBsYXkgdGhlbSB1c2luZyB0aGUgYXBwcm9wcmlhdGUgaGFuZGxlclxuICAgKiBpbiB0aGUgcHJvdmlkZWQgZXZlbnQgY29udHJhY3QuIE9uY2UgYWxsIHRoZSBldmVudHMgYXJlIHJlcGxheWVkLCBpdCBjbGVhbnNcbiAgICogdXAgdGhlIGVhcmx5IGNvbnRyYWN0LlxuICAgKi9cbiAgcmVwbGF5RWFybHlFdmVudHMoXG4gICAgZWFybHlKc2FjdGlvbkNvbnRhaW5lcjogRWFybHlKc2FjdGlvbkRhdGFDb250YWluZXIgPSB3aW5kb3cgYXMgRWFybHlKc2FjdGlvbkRhdGFDb250YWluZXIsXG4gICkge1xuICAgIC8vIENoZWNrIGlmIHRoZSBlYXJseSBjb250cmFjdCBpcyBwcmVzZW50IGFuZCBwcmV2ZW50IGNhbGxpbmcgdGhpcyBmdW5jdGlvblxuICAgIC8vIG1vcmUgdGhhbiBvbmNlLlxuICAgIGNvbnN0IGVhcmx5SnNhY3Rpb25EYXRhOiBFYXJseUpzYWN0aW9uRGF0YSB8IHVuZGVmaW5lZCA9IGVhcmx5SnNhY3Rpb25Db250YWluZXIuX2Vqc2E7XG4gICAgaWYgKCFlYXJseUpzYWN0aW9uRGF0YSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIFJlcGxheSB0aGUgZWFybHkgY29udHJhY3QgZXZlbnRzLlxuICAgIGNvbnN0IGVhcmx5RXZlbnRJbmZvczogZXZlbnRJbmZvTGliLkV2ZW50SW5mb1tdID0gZWFybHlKc2FjdGlvbkRhdGEucTtcbiAgICBmb3IgKGxldCBpZHggPSAwOyBpZHggPCBlYXJseUV2ZW50SW5mb3MubGVuZ3RoOyBpZHgrKykge1xuICAgICAgY29uc3QgZWFybHlFdmVudEluZm86IGV2ZW50SW5mb0xpYi5FdmVudEluZm8gPSBlYXJseUV2ZW50SW5mb3NbaWR4XTtcbiAgICAgIGNvbnN0IGV2ZW50VHlwZXMgPSB0aGlzLmdldEV2ZW50VHlwZXNGb3JCcm93c2VyRXZlbnRUeXBlKGVhcmx5RXZlbnRJbmZvLmV2ZW50VHlwZSk7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGV2ZW50VHlwZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3QgZXZlbnRJbmZvID0gZXZlbnRJbmZvTGliLmNsb25lRXZlbnRJbmZvKGVhcmx5RXZlbnRJbmZvKTtcbiAgICAgICAgLy8gRXZlbnRJbmZvIGV2ZW50VHlwZSBtYXBzIHRvIEpTQWN0aW9uJ3MgaW50ZXJuYWwgZXZlbnQgdHlwZSxcbiAgICAgICAgLy8gcmF0aGVyIHRoYW4gdGhlIGJyb3dzZXIgZXZlbnQgdHlwZS5cbiAgICAgICAgZXZlbnRJbmZvTGliLnNldEV2ZW50VHlwZShldmVudEluZm8sIGV2ZW50VHlwZXNbaV0pO1xuICAgICAgICB0aGlzLmhhbmRsZUV2ZW50SW5mbyhldmVudEluZm8pO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIENsZWFuIHVwIHRoZSBlYXJseSBjb250cmFjdC5cbiAgICBjb25zdCBlYXJseUV2ZW50SGFuZGxlcjogKGV2ZW50OiBFdmVudCkgPT4gdm9pZCA9IGVhcmx5SnNhY3Rpb25EYXRhLmg7XG4gICAgcmVtb3ZlRXZlbnRMaXN0ZW5lcnMoZWFybHlKc2FjdGlvbkRhdGEuYywgZWFybHlKc2FjdGlvbkRhdGEuZXQsIGVhcmx5RXZlbnRIYW5kbGVyKTtcbiAgICByZW1vdmVFdmVudExpc3RlbmVycyhlYXJseUpzYWN0aW9uRGF0YS5jLCBlYXJseUpzYWN0aW9uRGF0YS5ldGMsIGVhcmx5RXZlbnRIYW5kbGVyLCB0cnVlKTtcbiAgICBkZWxldGUgZWFybHlKc2FjdGlvbkNvbnRhaW5lci5fZWpzYTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGFsbCBKU0FjdGlvbiBldmVudCB0eXBlcyB0aGF0IGhhdmUgYmVlbiByZWdpc3RlcmVkIGZvciBhIGdpdmVuXG4gICAqIGJyb3dzZXIgZXZlbnQgdHlwZS5cbiAgICovXG4gIHByaXZhdGUgZ2V0RXZlbnRUeXBlc0ZvckJyb3dzZXJFdmVudFR5cGUoYnJvd3NlckV2ZW50VHlwZTogc3RyaW5nKSB7XG4gICAgY29uc3QgZXZlbnRUeXBlcyA9IFtdO1xuICAgIGlmICh0aGlzLmV2ZW50SGFuZGxlcnNbYnJvd3NlckV2ZW50VHlwZV0pIHtcbiAgICAgIGV2ZW50VHlwZXMucHVzaChicm93c2VyRXZlbnRUeXBlKTtcbiAgICB9XG4gICAgaWYgKHRoaXMuYnJvd3NlckV2ZW50VHlwZVRvRXh0cmFFdmVudFR5cGVzW2Jyb3dzZXJFdmVudFR5cGVdKSB7XG4gICAgICBldmVudFR5cGVzLnB1c2goLi4udGhpcy5icm93c2VyRXZlbnRUeXBlVG9FeHRyYUV2ZW50VHlwZXNbYnJvd3NlckV2ZW50VHlwZV0pO1xuICAgIH1cbiAgICByZXR1cm4gZXZlbnRUeXBlcztcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBldmVudCBoYW5kbGVyIGZ1bmN0aW9uIGZvciBhIGdpdmVuIGV2ZW50IHR5cGUuXG4gICAqL1xuICBoYW5kbGVyKGV2ZW50VHlwZTogc3RyaW5nKTogRXZlbnRIYW5kbGVyIHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy5ldmVudEhhbmRsZXJzW2V2ZW50VHlwZV07XG4gIH1cblxuICAvKipcbiAgICogQ2xlYW5zIHVwIHRoZSBldmVudCBjb250cmFjdC4gVGhpcyByZXNldHMgYWxsIG9mIHRoZSBgRXZlbnRDb250cmFjdGAnc1xuICAgKiBpbnRlcm5hbCBzdGF0ZS4gVXNlcnMgYXJlIHJlc3BvbnNpYmxlIGZvciBub3QgdXNpbmcgdGhpcyBgRXZlbnRDb250cmFjdGBcbiAgICogYWZ0ZXIgaXQgaGFzIGJlZW4gY2xlYW5lZCB1cC5cbiAgICovXG4gIGNsZWFuVXAoKSB7XG4gICAgdGhpcy5jb250YWluZXJNYW5hZ2VyIS5jbGVhblVwKCk7XG4gICAgdGhpcy5jb250YWluZXJNYW5hZ2VyID0gbnVsbDtcbiAgICB0aGlzLmV2ZW50SGFuZGxlcnMgPSB7fTtcbiAgICB0aGlzLmJyb3dzZXJFdmVudFR5cGVUb0V4dHJhRXZlbnRUeXBlcyA9IHt9O1xuICAgIHRoaXMuZGlzcGF0Y2hlciA9IG51bGw7XG4gICAgdGhpcy5xdWV1ZWRFdmVudEluZm9zID0gW107XG4gIH1cblxuICAvKipcbiAgICogUmVnaXN0ZXIgYSBkaXNwYXRjaGVyIGZ1bmN0aW9uLiBFdmVudCBpbmZvIG9mIGVhY2ggZXZlbnQgbWFwcGVkIHRvXG4gICAqIGEganNhY3Rpb24gaXMgcGFzc2VkIGZvciBoYW5kbGluZyB0byB0aGlzIGNhbGxiYWNrLiBUaGUgcXVldWVkXG4gICAqIGV2ZW50cyBhcmUgcGFzc2VkIGFzIHdlbGwgdG8gdGhlIGRpc3BhdGNoZXIgZm9yIGxhdGVyIHJlcGxheWluZ1xuICAgKiBvbmNlIHRoZSBkaXNwYXRjaGVyIGlzIHJlZ2lzdGVyZWQuIENsZWFycyB0aGUgZXZlbnQgcXVldWUgdG8gbnVsbC5cbiAgICpcbiAgICogQHBhcmFtIGRpc3BhdGNoZXIgVGhlIGRpc3BhdGNoZXIgZnVuY3Rpb24uXG4gICAqIEBwYXJhbSByZXN0cmljdGlvblxuICAgKi9cbiAgcmVnaXN0ZXJEaXNwYXRjaGVyKGRpc3BhdGNoZXI6IERpc3BhdGNoZXIsIHJlc3RyaWN0aW9uOiBSZXN0cmljdGlvbikge1xuICAgIHRoaXMuZWNyZChkaXNwYXRjaGVyLCByZXN0cmljdGlvbik7XG4gIH1cblxuICAvKipcbiAgICogVW5yZW5hbWVkIGFsaWFzIGZvciByZWdpc3RlckRpc3BhdGNoZXIuIE5lY2Vzc2FyeSBmb3IgYW55IGNvZGViYXNlcyB0aGF0XG4gICAqIHNwbGl0IHRoZSBgRXZlbnRDb250cmFjdGAgYW5kIGBEaXNwYXRjaGVyYCBjb2RlIGludG8gZGlmZmVyZW50IGNvbXBpbGF0aW9uXG4gICAqIHVuaXRzLlxuICAgKi9cbiAgZWNyZChkaXNwYXRjaGVyOiBEaXNwYXRjaGVyLCByZXN0cmljdGlvbjogUmVzdHJpY3Rpb24pIHtcbiAgICB0aGlzLmRpc3BhdGNoZXIgPSBkaXNwYXRjaGVyO1xuXG4gICAgaWYgKHRoaXMucXVldWVkRXZlbnRJbmZvcz8ubGVuZ3RoKSB7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMucXVldWVkRXZlbnRJbmZvcy5sZW5ndGg7IGkrKykge1xuICAgICAgICB0aGlzLmhhbmRsZUV2ZW50SW5mbyh0aGlzLnF1ZXVlZEV2ZW50SW5mb3NbaV0pO1xuICAgICAgfVxuICAgICAgdGhpcy5xdWV1ZWRFdmVudEluZm9zID0gbnVsbDtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQWRkcyBhMTF5IGNsaWNrIHN1cHBvcnQgdG8gdGhlIGdpdmVuIGBFdmVudENvbnRyYWN0YC4gTWVhbnQgdG8gYmUgY2FsbGVkIGluXG4gICAqIHRoZSBzYW1lIGNvbXBpbGF0aW9uIHVuaXQgYXMgdGhlIGBFdmVudENvbnRyYWN0YC5cbiAgICovXG4gIGFkZEExMXlDbGlja1N1cHBvcnQoKSB7fVxuXG4gIC8qKlxuICAgKiBFbmFibGVzIGExMXkgY2xpY2sgc3VwcG9ydCB0byBiZSBkZWZlcnJlZC4gTWVhbnQgdG8gYmUgY2FsbGVkIGluIHRoZSBzYW1lXG4gICAqIGNvbXBpbGF0aW9uIHVuaXQgYXMgdGhlIGBFdmVudENvbnRyYWN0YC5cbiAgICovXG4gIGV4cG9ydEFkZEExMXlDbGlja1N1cHBvcnQoKSB7fVxufVxuXG5mdW5jdGlvbiByZW1vdmVFdmVudExpc3RlbmVycyhcbiAgY29udGFpbmVyOiBIVE1MRWxlbWVudCxcbiAgZXZlbnRUeXBlczogc3RyaW5nW10sXG4gIGVhcmx5RXZlbnRIYW5kbGVyOiAoZTogRXZlbnQpID0+IHZvaWQsXG4gIGNhcHR1cmU/OiBib29sZWFuLFxuKSB7XG4gIGZvciAobGV0IGlkeCA9IDA7IGlkeCA8IGV2ZW50VHlwZXMubGVuZ3RoOyBpZHgrKykge1xuICAgIGNvbnRhaW5lci5yZW1vdmVFdmVudExpc3RlbmVyKGV2ZW50VHlwZXNbaWR4XSwgZWFybHlFdmVudEhhbmRsZXIsIC8qIHVzZUNhcHR1cmUgKi8gY2FwdHVyZSk7XG4gIH1cbn1cblxuLyoqXG4gKiBBZGRzIGExMXkgY2xpY2sgc3VwcG9ydCB0byB0aGUgZ2l2ZW4gYEV2ZW50Q29udHJhY3RgLiBNZWFudCB0byBiZSBjYWxsZWRcbiAqIGluIGEgZGlmZmVyZW50IGNvbXBpbGF0aW9uIHVuaXQgZnJvbSB0aGUgYEV2ZW50Q29udHJhY3RgLiBUaGUgYEV2ZW50Q29udHJhY3RgXG4gKiBtdXN0IGhhdmUgY2FsbGVkIGBleHBvcnRBZGRBMTF5Q2xpY2tTdXBwb3J0YCBpbiBpdHMgY29tcGlsYXRpb24gdW5pdCBmb3IgdGhpc1xuICogdG8gaGF2ZSBhbnkgZWZmZWN0LlxuICovXG5leHBvcnQgZnVuY3Rpb24gYWRkRGVmZXJyZWRBMTF5Q2xpY2tTdXBwb3J0KGV2ZW50Q29udHJhY3Q6IEV2ZW50Q29udHJhY3QpIHt9XG4iXX0=