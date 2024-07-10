/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as eventLib from './event';
import { MOUSE_SPECIAL_SUPPORT } from './event_contract_defines';
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXZlbnRjb250cmFjdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvcHJpbWl0aXZlcy9ldmVudC1kaXNwYXRjaC9zcmMvZXZlbnRjb250cmFjdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUEyQkgsT0FBTyxLQUFLLFFBQVEsTUFBTSxTQUFTLENBQUM7QUFFcEMsT0FBTyxFQUFDLHFCQUFxQixFQUFDLE1BQU0sMEJBQTBCLENBQUM7QUFDL0QsT0FBTyxLQUFLLFlBQVksTUFBTSxjQUFjLENBQUM7QUFDN0MsT0FBTyxFQUFZLHlCQUF5QixFQUFDLE1BQU0sY0FBYyxDQUFDO0FBeUJsRTs7Ozs7Ozs7Ozs7OztHQWFHO0FBQ0gsTUFBTSxPQUFPLGFBQWE7YUFDakIsMEJBQXFCLEdBQUcscUJBQXFCLEFBQXhCLENBQXlCO0lBOEJyRCxZQUNFLGdCQUErQyxFQUM5QixpQkFBeUI7UUFBekIsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFRO1FBNUI1Qzs7Ozs7O1dBTUc7UUFDSyxrQkFBYSxHQUFrQyxFQUFFLENBQUM7UUFFbEQsc0NBQWlDLEdBQThCLEVBQUUsQ0FBQztRQUUxRTs7Ozs7O1dBTUc7UUFDSyxlQUFVLEdBQXNCLElBQUksQ0FBQztRQUU3Qzs7O1dBR0c7UUFDSyxxQkFBZ0IsR0FBb0MsRUFBRSxDQUFDO1FBTTdELElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxnQkFBZ0IsQ0FBQztJQUMzQyxDQUFDO0lBRU8sV0FBVyxDQUFDLFNBQWlCLEVBQUUsS0FBWSxFQUFFLFNBQWtCO1FBQ3JFLE1BQU0sU0FBUyxHQUFHLFlBQVksQ0FBQyw2QkFBNkI7UUFDMUQsZ0JBQWdCLENBQUMsU0FBUztRQUMxQixZQUFZLENBQUMsS0FBSztRQUNsQixvQkFBb0IsQ0FBQyxLQUFLLENBQUMsTUFBaUI7UUFDNUMsZ0JBQWdCLENBQUMsU0FBUztRQUMxQixnQkFBZ0IsQ0FB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QjtJQUVqQixLQUFLLElBQUksR0FBRyxHQUFHLENBQUMsRUFBRSxHQUFHLEdBQUcsVUFBVSxDQUFDLE1BQU0sRUFBRSxHQUFHLEVBQUUsRUFBRSxDQUFDO1FBQ2pELFNBQVMsQ0FBQyxtQkFBbUIsQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLEVBQUUsaUJBQWlCLEVBQUUsZ0JBQWdCLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDOUYsQ0FBQztBQUNILENBQUM7QUFFRDs7Ozs7R0FLRztBQUNILE1BQU0sVUFBVSwyQkFBMkIsQ0FBQyxhQUE0QixJQUFHLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IEltcGxlbWVudHMgdGhlIGxvY2FsIGV2ZW50IGhhbmRsaW5nIGNvbnRyYWN0LiBUaGlzXG4gKiBhbGxvd3MgRE9NIG9iamVjdHMgaW4gYSBjb250YWluZXIgdGhhdCBlbnRlcnMgaW50byB0aGlzIGNvbnRyYWN0IHRvXG4gKiBkZWZpbmUgZXZlbnQgaGFuZGxlcnMgd2hpY2ggYXJlIGV4ZWN1dGVkIGluIGEgbG9jYWwgY29udGV4dC5cbiAqXG4gKiBPbmUgRXZlbnRDb250cmFjdCBpbnN0YW5jZSBjYW4gbWFuYWdlIHRoZSBjb250cmFjdCBmb3IgbXVsdGlwbGVcbiAqIGNvbnRhaW5lcnMsIHdoaWNoIGFyZSBhZGRlZCB1c2luZyB0aGUgYWRkQ29udGFpbmVyKCkgbWV0aG9kLlxuICpcbiAqIEV2ZW50cyBjYW4gYmUgcmVnaXN0ZXJlZCB1c2luZyB0aGUgYWRkRXZlbnQoKSBtZXRob2QuXG4gKlxuICogQSBEaXNwYXRjaGVyIGlzIGFkZGVkIHVzaW5nIHRoZSByZWdpc3RlckRpc3BhdGNoZXIoKSBtZXRob2QuIFVudGlsIHRoZXJlIGlzXG4gKiBhIGRpc3BhdGNoZXIsIGV2ZW50cyBhcmUgcXVldWVkLiBUaGUgaWRlYSBpcyB0aGF0IHRoZSBFdmVudENvbnRyYWN0XG4gKiBjbGFzcyBpcyBpbmxpbmVkIGluIHRoZSBIVE1MIG9mIHRoZSB0b3AgbGV2ZWwgcGFnZSBhbmQgaW5zdGFudGlhdGVkXG4gKiByaWdodCBhZnRlciB0aGUgc3RhcnQgb2YgPGJvZHk+LiBUaGUgRGlzcGF0Y2hlciBjbGFzcyBpcyBjb250YWluZWRcbiAqIGluIHRoZSBleHRlcm5hbCBkZWZlcnJlZCBqcywgYW5kIGluc3RhbnRpYXRlZCBhbmQgcmVnaXN0ZXJlZCB3aXRoXG4gKiBFdmVudENvbnRyYWN0IHdoZW4gdGhlIGV4dGVybmFsIGphdmFzY3JpcHQgaW4gdGhlIHBhZ2UgbG9hZHMuIFRoZVxuICogZXh0ZXJuYWwgamF2YXNjcmlwdCB3aWxsIGFsc28gcmVnaXN0ZXIgdGhlIGpzYWN0aW9uIGhhbmRsZXJzLCB3aGljaFxuICogdGhlbiBwaWNrIHVwIHRoZSBxdWV1ZWQgZXZlbnRzIGF0IHRoZSB0aW1lIG9mIHJlZ2lzdHJhdGlvbi5cbiAqXG4gKiBTaW5jZSB0aGlzIGNsYXNzIGlzIG1lYW50IHRvIGJlIGlubGluZWQgaW4gdGhlIG1haW4gcGFnZSBIVE1MLCB0aGVcbiAqIHNpemUgb2YgdGhlIGJpbmFyeSBjb21waWxlZCBmcm9tIHRoaXMgZmlsZSBNVVNUIGJlIGtlcHQgYXMgc21hbGwgYXNcbiAqIHBvc3NpYmxlIGFuZCB0aHVzIGl0cyBkZXBlbmRlbmNpZXMgdG8gYSBtaW5pbXVtLlxuICovXG5cbmltcG9ydCB7RWFybHlKc2FjdGlvbkRhdGEsIEVhcmx5SnNhY3Rpb25EYXRhQ29udGFpbmVyfSBmcm9tICcuL2Vhcmx5ZXZlbnRjb250cmFjdCc7XG5pbXBvcnQgKiBhcyBldmVudExpYiBmcm9tICcuL2V2ZW50JztcbmltcG9ydCB7RXZlbnRDb250cmFjdENvbnRhaW5lck1hbmFnZXJ9IGZyb20gJy4vZXZlbnRfY29udHJhY3RfY29udGFpbmVyJztcbmltcG9ydCB7TU9VU0VfU1BFQ0lBTF9TVVBQT1JUfSBmcm9tICcuL2V2ZW50X2NvbnRyYWN0X2RlZmluZXMnO1xuaW1wb3J0ICogYXMgZXZlbnRJbmZvTGliIGZyb20gJy4vZXZlbnRfaW5mbyc7XG5pbXBvcnQge0V2ZW50VHlwZSwgTk9OX0JVQkJMSU5HX01PVVNFX0VWRU5UU30gZnJvbSAnLi9ldmVudF90eXBlJztcbmltcG9ydCB7UmVzdHJpY3Rpb259IGZyb20gJy4vcmVzdHJpY3Rpb24nO1xuXG4vKipcbiAqIFRoZSBBUEkgb2YgYW4gRXZlbnRDb250cmFjdCB0aGF0IGlzIHNhZmUgdG8gY2FsbCBmcm9tIGFueSBjb21waWxhdGlvbiB1bml0LlxuICovXG5leHBvcnQgZGVjbGFyZSBpbnRlcmZhY2UgVW5yZW5hbWVkRXZlbnRDb250cmFjdCB7XG4gIC8vIEFsaWFzIGZvciBKc2N0aW9uIEV2ZW50Q29udHJhY3QgcmVnaXN0ZXJEaXNwYXRjaGVyLlxuICBlY3JkKGRpc3BhdGNoZXI6IERpc3BhdGNoZXIsIHJlc3RyaWN0aW9uOiBSZXN0cmljdGlvbik6IHZvaWQ7XG59XG5cbi8qKiBBIGZ1bmN0aW9uIHRoYXQgaXMgY2FsbGVkIHRvIGhhbmRsZSBldmVudHMgY2FwdHVyZWQgYnkgdGhlIEV2ZW50Q29udHJhY3QuICovXG5leHBvcnQgdHlwZSBEaXNwYXRjaGVyID0gKGV2ZW50SW5mbzogZXZlbnRJbmZvTGliLkV2ZW50SW5mbywgZ2xvYmFsRGlzcGF0Y2g/OiBib29sZWFuKSA9PiB2b2lkO1xuXG4vKipcbiAqIEEgZnVuY3Rpb24gdGhhdCBoYW5kbGVzIGFuIGV2ZW50IGRpc3BhdGNoZWQgZnJvbSB0aGUgYnJvd3Nlci5cbiAqXG4gKiBldmVudFR5cGU6IE1heSBkaWZmZXIgZnJvbSBgZXZlbnQudHlwZWAgaWYgSlNBY3Rpb24gdXNlcyBhXG4gKiBzaG9ydC1oYW5kIG5hbWUgb3IgaXMgcGF0Y2hpbmcgb3ZlciBhbiBub24tYnViYmxpbmcgZXZlbnQgd2l0aCBhIGJ1YmJsaW5nXG4gKiB2YXJpYW50LlxuICogZXZlbnQ6IFRoZSBuYXRpdmUgYnJvd3NlciBldmVudC5cbiAqIGNvbnRhaW5lcjogVGhlIGNvbnRhaW5lciBmb3IgdGhpcyBkaXNwYXRjaC5cbiAqL1xudHlwZSBFdmVudEhhbmRsZXIgPSAoZXZlbnRUeXBlOiBzdHJpbmcsIGV2ZW50OiBFdmVudCwgY29udGFpbmVyOiBFbGVtZW50KSA9PiB2b2lkO1xuXG4vKipcbiAqIEV2ZW50Q29udHJhY3QgaW50ZXJjZXB0cyBldmVudHMgaW4gdGhlIGJ1YmJsaW5nIHBoYXNlIGF0IHRoZVxuICogYm91bmRhcnkgb2YgYSBjb250YWluZXIgZWxlbWVudCwgYW5kIG1hcHMgdGhlbSB0byBnZW5lcmljIGFjdGlvbnNcbiAqIHdoaWNoIGFyZSBzcGVjaWZpZWQgdXNpbmcgdGhlIGN1c3RvbSBqc2FjdGlvbiBhdHRyaWJ1dGUgaW5cbiAqIEhUTUwuIEJlaGF2aW9yIG9mIHRoZSBhcHBsaWNhdGlvbiBpcyB0aGVuIHNwZWNpZmllZCBpbiB0ZXJtcyBvZlxuICogaGFuZGxlciBmb3Igc3VjaCBhY3Rpb25zLCBjZi4ganNhY3Rpb24uRGlzcGF0Y2hlciBpbiBkaXNwYXRjaGVyLmpzLlxuICpcbiAqIFRoaXMgaGFzIHNldmVyYWwgYmVuZWZpdHM6ICgxKSBObyBET00gZXZlbnQgaGFuZGxlcnMgbmVlZCB0byBiZVxuICogcmVnaXN0ZXJlZCBvbiB0aGUgc3BlY2lmaWMgZWxlbWVudHMgaW4gdGhlIFVJLiAoMikgVGhlIHNldCBvZlxuICogZXZlbnRzIHRoYXQgdGhlIGFwcGxpY2F0aW9uIGhhcyB0byBoYW5kbGUgY2FuIGJlIHNwZWNpZmllZCBpbiB0ZXJtc1xuICogb2YgdGhlIHNlbWFudGljcyBvZiB0aGUgYXBwbGljYXRpb24sIHJhdGhlciB0aGFuIGluIHRlcm1zIG9mIERPTVxuICogZXZlbnRzLiAoMykgSW52b2NhdGlvbiBvZiBoYW5kbGVycyBjYW4gYmUgZGVsYXllZCBhbmQgaGFuZGxlcnMgY2FuXG4gKiBiZSBkZWxheSBsb2FkZWQgaW4gYSBnZW5lcmljIHdheS5cbiAqL1xuZXhwb3J0IGNsYXNzIEV2ZW50Q29udHJhY3QgaW1wbGVtZW50cyBVbnJlbmFtZWRFdmVudENvbnRyYWN0IHtcbiAgc3RhdGljIE1PVVNFX1NQRUNJQUxfU1VQUE9SVCA9IE1PVVNFX1NQRUNJQUxfU1VQUE9SVDtcblxuICBwcml2YXRlIGNvbnRhaW5lck1hbmFnZXI6IEV2ZW50Q29udHJhY3RDb250YWluZXJNYW5hZ2VyIHwgbnVsbDtcblxuICAvKipcbiAgICogVGhlIERPTSBldmVudHMgd2hpY2ggdGhpcyBjb250cmFjdCBjb3ZlcnMuIFVzZWQgdG8gcHJldmVudCBkb3VibGVcbiAgICogcmVnaXN0cmF0aW9uIG9mIGV2ZW50IHR5cGVzLiBUaGUgdmFsdWUgb2YgdGhlIG1hcCBpcyB0aGVcbiAgICogaW50ZXJuYWxseSBjcmVhdGVkIERPTSBldmVudCBoYW5kbGVyIGZ1bmN0aW9uIHRoYXQgaGFuZGxlcyB0aGVcbiAgICogRE9NIGV2ZW50cy4gU2VlIGFkZEV2ZW50KCkuXG4gICAqXG4gICAqL1xuICBwcml2YXRlIGV2ZW50SGFuZGxlcnM6IHtba2V5OiBzdHJpbmddOiBFdmVudEhhbmRsZXJ9ID0ge307XG5cbiAgcHJpdmF0ZSBicm93c2VyRXZlbnRUeXBlVG9FeHRyYUV2ZW50VHlwZXM6IHtba2V5OiBzdHJpbmddOiBzdHJpbmdbXX0gPSB7fTtcblxuICAvKipcbiAgICogVGhlIGRpc3BhdGNoZXIgZnVuY3Rpb24uIEV2ZW50cyBhcmUgcGFzc2VkIHRvIHRoaXMgZnVuY3Rpb24gZm9yXG4gICAqIGhhbmRsaW5nIG9uY2UgaXQgd2FzIHNldCB1c2luZyB0aGUgcmVnaXN0ZXJEaXNwYXRjaGVyKCkgbWV0aG9kLiBUaGlzIGlzXG4gICAqIGRvbmUgYmVjYXVzZSB0aGUgZnVuY3Rpb24gaXMgcGFzc2VkIGZyb20gYW5vdGhlciBqc2JpbmFyeSwgc28gcGFzc2luZyB0aGVcbiAgICogaW5zdGFuY2UgYW5kIGludm9raW5nIHRoZSBtZXRob2QgaGVyZSB3b3VsZCByZXF1aXJlIHRvIGxlYXZlIHRoZSBtZXRob2RcbiAgICogdW5vYmZ1c2NhdGVkLlxuICAgKi9cbiAgcHJpdmF0ZSBkaXNwYXRjaGVyOiBEaXNwYXRjaGVyIHwgbnVsbCA9IG51bGw7XG5cbiAgLyoqXG4gICAqIFRoZSBsaXN0IG9mIHN1c3BlbmRlZCBgRXZlbnRJbmZvYCB0aGF0IHdpbGwgYmUgZGlzcGF0Y2hlZFxuICAgKiBhcyBzb29uIGFzIHRoZSBgRGlzcGF0Y2hlcmAgaXMgcmVnaXN0ZXJlZC5cbiAgICovXG4gIHByaXZhdGUgcXVldWVkRXZlbnRJbmZvczogZXZlbnRJbmZvTGliLkV2ZW50SW5mb1tdIHwgbnVsbCA9IFtdO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIGNvbnRhaW5lck1hbmFnZXI6IEV2ZW50Q29udHJhY3RDb250YWluZXJNYW5hZ2VyLFxuICAgIHByaXZhdGUgcmVhZG9ubHkgdXNlQWN0aW9uUmVzb2x2ZXI/OiBmYWxzZSxcbiAgKSB7XG4gICAgdGhpcy5jb250YWluZXJNYW5hZ2VyID0gY29udGFpbmVyTWFuYWdlcjtcbiAgfVxuXG4gIHByaXZhdGUgaGFuZGxlRXZlbnQoZXZlbnRUeXBlOiBzdHJpbmcsIGV2ZW50OiBFdmVudCwgY29udGFpbmVyOiBFbGVtZW50KSB7XG4gICAgY29uc3QgZXZlbnRJbmZvID0gZXZlbnRJbmZvTGliLmNyZWF0ZUV2ZW50SW5mb0Zyb21QYXJhbWV0ZXJzKFxuICAgICAgLyogZXZlbnRUeXBlPSAqLyBldmVudFR5cGUsXG4gICAgICAvKiBldmVudD0gKi8gZXZlbnQsXG4gICAgICAvKiB0YXJnZXRFbGVtZW50PSAqLyBldmVudC50YXJnZXQgYXMgRWxlbWVudCxcbiAgICAgIC8qIGNvbnRhaW5lcj0gKi8gY29udGFpbmVyLFxuICAgICAgLyogdGltZXN0YW1wPSAqLyBEYXRlLm5vdygpLFxuICAgICk7XG4gICAgdGhpcy5oYW5kbGVFdmVudEluZm8oZXZlbnRJbmZvKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBIYW5kbGUgYW4gYEV2ZW50SW5mb2AuXG4gICAqL1xuICBwcml2YXRlIGhhbmRsZUV2ZW50SW5mbyhldmVudEluZm86IGV2ZW50SW5mb0xpYi5FdmVudEluZm8pIHtcbiAgICBpZiAoIXRoaXMuZGlzcGF0Y2hlcikge1xuICAgICAgLy8gQWxsIGV2ZW50cyBhcmUgcXVldWVkIHdoZW4gdGhlIGRpc3BhdGNoZXIgaXNuJ3QgeWV0IGxvYWRlZC5cbiAgICAgIGV2ZW50SW5mb0xpYi5zZXRJc1JlcGxheShldmVudEluZm8sIHRydWUpO1xuICAgICAgdGhpcy5xdWV1ZWRFdmVudEluZm9zPy5wdXNoKGV2ZW50SW5mbyk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMuZGlzcGF0Y2hlcihldmVudEluZm8pO1xuICB9XG5cbiAgLyoqXG4gICAqIEVuYWJsZXMganNhY3Rpb24gaGFuZGxlcnMgdG8gYmUgY2FsbGVkIGZvciB0aGUgZXZlbnQgdHlwZSBnaXZlbiBieVxuICAgKiBuYW1lLlxuICAgKlxuICAgKiBJZiB0aGUgZXZlbnQgaXMgYWxyZWFkeSByZWdpc3RlcmVkLCB0aGlzIGRvZXMgbm90aGluZy5cbiAgICpcbiAgICogQHBhcmFtIHByZWZpeGVkRXZlbnRUeXBlIElmIHN1cHBsaWVkLCB0aGlzIGV2ZW50IGlzIHVzZWQgaW5cbiAgICogICAgIHRoZSBhY3R1YWwgYnJvd3NlciBldmVudCByZWdpc3RyYXRpb24gaW5zdGVhZCBvZiB0aGUgbmFtZSB0aGF0IGlzXG4gICAqICAgICBleHBvc2VkIHRvIGpzYWN0aW9uLiBVc2UgdGhpcyBpZiB5b3UgZS5nLiB3YW50IHVzZXJzIHRvIGJlIGFibGVcbiAgICogICAgIHRvIHN1YnNjcmliZSB0byBqc2FjdGlvbj1cInRyYW5zaXRpb25FbmQ6Zm9vXCIgd2hpbGUgdGhlIHVuZGVybHlpbmdcbiAgICogICAgIGV2ZW50IGlzIHdlYmtpdFRyYW5zaXRpb25FbmQgaW4gb25lIGJyb3dzZXIgYW5kIG1velRyYW5zaXRpb25FbmRcbiAgICogICAgIGluIGFub3RoZXIuXG4gICAqL1xuICBhZGRFdmVudChldmVudFR5cGU6IHN0cmluZywgcHJlZml4ZWRFdmVudFR5cGU/OiBzdHJpbmcpIHtcbiAgICBpZiAoZXZlbnRUeXBlIGluIHRoaXMuZXZlbnRIYW5kbGVycyB8fCAhdGhpcy5jb250YWluZXJNYW5hZ2VyKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKCFFdmVudENvbnRyYWN0Lk1PVVNFX1NQRUNJQUxfU1VQUE9SVCAmJiBOT05fQlVCQkxJTkdfTU9VU0VfRVZFTlRTLmluZGV4T2YoZXZlbnRUeXBlKSA+PSAwKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgZXZlbnRIYW5kbGVyID0gKGV2ZW50VHlwZTogc3RyaW5nLCBldmVudDogRXZlbnQsIGNvbnRhaW5lcjogRWxlbWVudCkgPT4ge1xuICAgICAgdGhpcy5oYW5kbGVFdmVudChldmVudFR5cGUsIGV2ZW50LCBjb250YWluZXIpO1xuICAgIH07XG5cbiAgICAvLyBTdG9yZSB0aGUgY2FsbGJhY2sgdG8gYWxsb3cgdXMgdG8gcmVwbGF5IGV2ZW50cy5cbiAgICB0aGlzLmV2ZW50SGFuZGxlcnNbZXZlbnRUeXBlXSA9IGV2ZW50SGFuZGxlcjtcblxuICAgIGNvbnN0IGJyb3dzZXJFdmVudFR5cGUgPSBldmVudExpYi5nZXRCcm93c2VyRXZlbnRUeXBlKHByZWZpeGVkRXZlbnRUeXBlIHx8IGV2ZW50VHlwZSk7XG5cbiAgICBpZiAoYnJvd3NlckV2ZW50VHlwZSAhPT0gZXZlbnRUeXBlKSB7XG4gICAgICBjb25zdCBldmVudFR5cGVzID0gdGhpcy5icm93c2VyRXZlbnRUeXBlVG9FeHRyYUV2ZW50VHlwZXNbYnJvd3NlckV2ZW50VHlwZV0gfHwgW107XG4gICAgICBldmVudFR5cGVzLnB1c2goZXZlbnRUeXBlKTtcbiAgICAgIHRoaXMuYnJvd3NlckV2ZW50VHlwZVRvRXh0cmFFdmVudFR5cGVzW2Jyb3dzZXJFdmVudFR5cGVdID0gZXZlbnRUeXBlcztcbiAgICB9XG5cbiAgICB0aGlzLmNvbnRhaW5lck1hbmFnZXIuYWRkRXZlbnRMaXN0ZW5lcihicm93c2VyRXZlbnRUeXBlLCAoZWxlbWVudDogRWxlbWVudCkgPT4ge1xuICAgICAgcmV0dXJuIChldmVudDogRXZlbnQpID0+IHtcbiAgICAgICAgZXZlbnRIYW5kbGVyKGV2ZW50VHlwZSwgZXZlbnQsIGVsZW1lbnQpO1xuICAgICAgfTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBxdWV1ZWQgZWFybHkgZXZlbnRzIGFuZCByZXBsYXkgdGhlbSB1c2luZyB0aGUgYXBwcm9wcmlhdGUgaGFuZGxlclxuICAgKiBpbiB0aGUgcHJvdmlkZWQgZXZlbnQgY29udHJhY3QuIE9uY2UgYWxsIHRoZSBldmVudHMgYXJlIHJlcGxheWVkLCBpdCBjbGVhbnNcbiAgICogdXAgdGhlIGVhcmx5IGNvbnRyYWN0LlxuICAgKi9cbiAgcmVwbGF5RWFybHlFdmVudHMoXG4gICAgZWFybHlKc2FjdGlvbkNvbnRhaW5lcjogRWFybHlKc2FjdGlvbkRhdGFDb250YWluZXIgPSB3aW5kb3cgYXMgRWFybHlKc2FjdGlvbkRhdGFDb250YWluZXIsXG4gICkge1xuICAgIC8vIENoZWNrIGlmIHRoZSBlYXJseSBjb250cmFjdCBpcyBwcmVzZW50IGFuZCBwcmV2ZW50IGNhbGxpbmcgdGhpcyBmdW5jdGlvblxuICAgIC8vIG1vcmUgdGhhbiBvbmNlLlxuICAgIGNvbnN0IGVhcmx5SnNhY3Rpb25EYXRhOiBFYXJseUpzYWN0aW9uRGF0YSB8IHVuZGVmaW5lZCA9IGVhcmx5SnNhY3Rpb25Db250YWluZXIuX2Vqc2E7XG4gICAgaWYgKCFlYXJseUpzYWN0aW9uRGF0YSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIFJlcGxheSB0aGUgZWFybHkgY29udHJhY3QgZXZlbnRzLlxuICAgIGNvbnN0IGVhcmx5RXZlbnRJbmZvczogZXZlbnRJbmZvTGliLkV2ZW50SW5mb1tdID0gZWFybHlKc2FjdGlvbkRhdGEucTtcbiAgICBmb3IgKGxldCBpZHggPSAwOyBpZHggPCBlYXJseUV2ZW50SW5mb3MubGVuZ3RoOyBpZHgrKykge1xuICAgICAgY29uc3QgZWFybHlFdmVudEluZm86IGV2ZW50SW5mb0xpYi5FdmVudEluZm8gPSBlYXJseUV2ZW50SW5mb3NbaWR4XTtcbiAgICAgIGNvbnN0IGV2ZW50VHlwZXMgPSB0aGlzLmdldEV2ZW50VHlwZXNGb3JCcm93c2VyRXZlbnRUeXBlKGVhcmx5RXZlbnRJbmZvLmV2ZW50VHlwZSk7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGV2ZW50VHlwZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3QgZXZlbnRJbmZvID0gZXZlbnRJbmZvTGliLmNsb25lRXZlbnRJbmZvKGVhcmx5RXZlbnRJbmZvKTtcbiAgICAgICAgLy8gRXZlbnRJbmZvIGV2ZW50VHlwZSBtYXBzIHRvIEpTQWN0aW9uJ3MgaW50ZXJuYWwgZXZlbnQgdHlwZSxcbiAgICAgICAgLy8gcmF0aGVyIHRoYW4gdGhlIGJyb3dzZXIgZXZlbnQgdHlwZS5cbiAgICAgICAgZXZlbnRJbmZvTGliLnNldEV2ZW50VHlwZShldmVudEluZm8sIGV2ZW50VHlwZXNbaV0pO1xuICAgICAgICB0aGlzLmhhbmRsZUV2ZW50SW5mbyhldmVudEluZm8pO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIENsZWFuIHVwIHRoZSBlYXJseSBjb250cmFjdC5cbiAgICBjb25zdCBlYXJseUV2ZW50SGFuZGxlcjogKGV2ZW50OiBFdmVudCkgPT4gdm9pZCA9IGVhcmx5SnNhY3Rpb25EYXRhLmg7XG4gICAgcmVtb3ZlRXZlbnRMaXN0ZW5lcnMoZWFybHlKc2FjdGlvbkRhdGEuYywgZWFybHlKc2FjdGlvbkRhdGEuZXQsIGVhcmx5RXZlbnRIYW5kbGVyKTtcbiAgICByZW1vdmVFdmVudExpc3RlbmVycyhlYXJseUpzYWN0aW9uRGF0YS5jLCBlYXJseUpzYWN0aW9uRGF0YS5ldGMsIGVhcmx5RXZlbnRIYW5kbGVyLCB0cnVlKTtcbiAgICBkZWxldGUgZWFybHlKc2FjdGlvbkNvbnRhaW5lci5fZWpzYTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGFsbCBKU0FjdGlvbiBldmVudCB0eXBlcyB0aGF0IGhhdmUgYmVlbiByZWdpc3RlcmVkIGZvciBhIGdpdmVuXG4gICAqIGJyb3dzZXIgZXZlbnQgdHlwZS5cbiAgICovXG4gIHByaXZhdGUgZ2V0RXZlbnRUeXBlc0ZvckJyb3dzZXJFdmVudFR5cGUoYnJvd3NlckV2ZW50VHlwZTogc3RyaW5nKSB7XG4gICAgY29uc3QgZXZlbnRUeXBlcyA9IFtdO1xuICAgIGlmICh0aGlzLmV2ZW50SGFuZGxlcnNbYnJvd3NlckV2ZW50VHlwZV0pIHtcbiAgICAgIGV2ZW50VHlwZXMucHVzaChicm93c2VyRXZlbnRUeXBlKTtcbiAgICB9XG4gICAgaWYgKHRoaXMuYnJvd3NlckV2ZW50VHlwZVRvRXh0cmFFdmVudFR5cGVzW2Jyb3dzZXJFdmVudFR5cGVdKSB7XG4gICAgICBldmVudFR5cGVzLnB1c2goLi4udGhpcy5icm93c2VyRXZlbnRUeXBlVG9FeHRyYUV2ZW50VHlwZXNbYnJvd3NlckV2ZW50VHlwZV0pO1xuICAgIH1cbiAgICByZXR1cm4gZXZlbnRUeXBlcztcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBldmVudCBoYW5kbGVyIGZ1bmN0aW9uIGZvciBhIGdpdmVuIGV2ZW50IHR5cGUuXG4gICAqL1xuICBoYW5kbGVyKGV2ZW50VHlwZTogc3RyaW5nKTogRXZlbnRIYW5kbGVyIHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy5ldmVudEhhbmRsZXJzW2V2ZW50VHlwZV07XG4gIH1cblxuICAvKipcbiAgICogQ2xlYW5zIHVwIHRoZSBldmVudCBjb250cmFjdC4gVGhpcyByZXNldHMgYWxsIG9mIHRoZSBgRXZlbnRDb250cmFjdGAnc1xuICAgKiBpbnRlcm5hbCBzdGF0ZS4gVXNlcnMgYXJlIHJlc3BvbnNpYmxlIGZvciBub3QgdXNpbmcgdGhpcyBgRXZlbnRDb250cmFjdGBcbiAgICogYWZ0ZXIgaXQgaGFzIGJlZW4gY2xlYW5lZCB1cC5cbiAgICovXG4gIGNsZWFuVXAoKSB7XG4gICAgdGhpcy5jb250YWluZXJNYW5hZ2VyIS5jbGVhblVwKCk7XG4gICAgdGhpcy5jb250YWluZXJNYW5hZ2VyID0gbnVsbDtcbiAgICB0aGlzLmV2ZW50SGFuZGxlcnMgPSB7fTtcbiAgICB0aGlzLmJyb3dzZXJFdmVudFR5cGVUb0V4dHJhRXZlbnRUeXBlcyA9IHt9O1xuICAgIHRoaXMuZGlzcGF0Y2hlciA9IG51bGw7XG4gICAgdGhpcy5xdWV1ZWRFdmVudEluZm9zID0gW107XG4gIH1cblxuICAvKipcbiAgICogUmVnaXN0ZXIgYSBkaXNwYXRjaGVyIGZ1bmN0aW9uLiBFdmVudCBpbmZvIG9mIGVhY2ggZXZlbnQgbWFwcGVkIHRvXG4gICAqIGEganNhY3Rpb24gaXMgcGFzc2VkIGZvciBoYW5kbGluZyB0byB0aGlzIGNhbGxiYWNrLiBUaGUgcXVldWVkXG4gICAqIGV2ZW50cyBhcmUgcGFzc2VkIGFzIHdlbGwgdG8gdGhlIGRpc3BhdGNoZXIgZm9yIGxhdGVyIHJlcGxheWluZ1xuICAgKiBvbmNlIHRoZSBkaXNwYXRjaGVyIGlzIHJlZ2lzdGVyZWQuIENsZWFycyB0aGUgZXZlbnQgcXVldWUgdG8gbnVsbC5cbiAgICpcbiAgICogQHBhcmFtIGRpc3BhdGNoZXIgVGhlIGRpc3BhdGNoZXIgZnVuY3Rpb24uXG4gICAqIEBwYXJhbSByZXN0cmljdGlvblxuICAgKi9cbiAgcmVnaXN0ZXJEaXNwYXRjaGVyKGRpc3BhdGNoZXI6IERpc3BhdGNoZXIsIHJlc3RyaWN0aW9uOiBSZXN0cmljdGlvbikge1xuICAgIHRoaXMuZWNyZChkaXNwYXRjaGVyLCByZXN0cmljdGlvbik7XG4gIH1cblxuICAvKipcbiAgICogVW5yZW5hbWVkIGFsaWFzIGZvciByZWdpc3RlckRpc3BhdGNoZXIuIE5lY2Vzc2FyeSBmb3IgYW55IGNvZGViYXNlcyB0aGF0XG4gICAqIHNwbGl0IHRoZSBgRXZlbnRDb250cmFjdGAgYW5kIGBEaXNwYXRjaGVyYCBjb2RlIGludG8gZGlmZmVyZW50IGNvbXBpbGF0aW9uXG4gICAqIHVuaXRzLlxuICAgKi9cbiAgZWNyZChkaXNwYXRjaGVyOiBEaXNwYXRjaGVyLCByZXN0cmljdGlvbjogUmVzdHJpY3Rpb24pIHtcbiAgICB0aGlzLmRpc3BhdGNoZXIgPSBkaXNwYXRjaGVyO1xuXG4gICAgaWYgKHRoaXMucXVldWVkRXZlbnRJbmZvcz8ubGVuZ3RoKSB7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMucXVldWVkRXZlbnRJbmZvcy5sZW5ndGg7IGkrKykge1xuICAgICAgICB0aGlzLmhhbmRsZUV2ZW50SW5mbyh0aGlzLnF1ZXVlZEV2ZW50SW5mb3NbaV0pO1xuICAgICAgfVxuICAgICAgdGhpcy5xdWV1ZWRFdmVudEluZm9zID0gbnVsbDtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQWRkcyBhMTF5IGNsaWNrIHN1cHBvcnQgdG8gdGhlIGdpdmVuIGBFdmVudENvbnRyYWN0YC4gTWVhbnQgdG8gYmUgY2FsbGVkIGluXG4gICAqIHRoZSBzYW1lIGNvbXBpbGF0aW9uIHVuaXQgYXMgdGhlIGBFdmVudENvbnRyYWN0YC5cbiAgICovXG4gIGFkZEExMXlDbGlja1N1cHBvcnQoKSB7fVxuXG4gIC8qKlxuICAgKiBFbmFibGVzIGExMXkgY2xpY2sgc3VwcG9ydCB0byBiZSBkZWZlcnJlZC4gTWVhbnQgdG8gYmUgY2FsbGVkIGluIHRoZSBzYW1lXG4gICAqIGNvbXBpbGF0aW9uIHVuaXQgYXMgdGhlIGBFdmVudENvbnRyYWN0YC5cbiAgICovXG4gIGV4cG9ydEFkZEExMXlDbGlja1N1cHBvcnQoKSB7fVxufVxuXG5mdW5jdGlvbiByZW1vdmVFdmVudExpc3RlbmVycyhcbiAgY29udGFpbmVyOiBIVE1MRWxlbWVudCxcbiAgZXZlbnRUeXBlczogc3RyaW5nW10sXG4gIGVhcmx5RXZlbnRIYW5kbGVyOiAoZTogRXZlbnQpID0+IHZvaWQsXG4gIGNhcHR1cmU/OiBib29sZWFuLFxuKSB7XG4gIGZvciAobGV0IGlkeCA9IDA7IGlkeCA8IGV2ZW50VHlwZXMubGVuZ3RoOyBpZHgrKykge1xuICAgIGNvbnRhaW5lci5yZW1vdmVFdmVudExpc3RlbmVyKGV2ZW50VHlwZXNbaWR4XSwgZWFybHlFdmVudEhhbmRsZXIsIC8qIHVzZUNhcHR1cmUgKi8gY2FwdHVyZSk7XG4gIH1cbn1cblxuLyoqXG4gKiBBZGRzIGExMXkgY2xpY2sgc3VwcG9ydCB0byB0aGUgZ2l2ZW4gYEV2ZW50Q29udHJhY3RgLiBNZWFudCB0byBiZSBjYWxsZWRcbiAqIGluIGEgZGlmZmVyZW50IGNvbXBpbGF0aW9uIHVuaXQgZnJvbSB0aGUgYEV2ZW50Q29udHJhY3RgLiBUaGUgYEV2ZW50Q29udHJhY3RgXG4gKiBtdXN0IGhhdmUgY2FsbGVkIGBleHBvcnRBZGRBMTF5Q2xpY2tTdXBwb3J0YCBpbiBpdHMgY29tcGlsYXRpb24gdW5pdCBmb3IgdGhpc1xuICogdG8gaGF2ZSBhbnkgZWZmZWN0LlxuICovXG5leHBvcnQgZnVuY3Rpb24gYWRkRGVmZXJyZWRBMTF5Q2xpY2tTdXBwb3J0KGV2ZW50Q29udHJhY3Q6IEV2ZW50Q29udHJhY3QpIHt9XG4iXX0=