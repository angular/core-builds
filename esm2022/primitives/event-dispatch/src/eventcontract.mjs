/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/**
 * @fileoverview Implements the local event handling contract. This
 * allows DOM objects in a container that enters into this contract to
 * define event handlers which are executed in a local context.
 *
 * One EventContract instance can manage the contract for multiple
 * containers, which are added using the addContainer() method.
 *
 * Events can be registered using the addEvent() method.
 *
 * A Dispatcher is added using the registerDispatcher() method. Until there is
 * a dispatcher, events are queued. The idea is that the EventContract
 * class is inlined in the HTML of the top level page and instantiated
 * right after the start of <body>. The Dispatcher class is contained
 * in the external deferred js, and instantiated and registered with
 * EventContract when the external javascript in the page loads. The
 * external javascript will also register the jsaction handlers, which
 * then pick up the queued events at the time of registration.
 *
 * Since this class is meant to be inlined in the main page HTML, the
 * size of the binary compiled from this file MUST be kept as small as
 * possible and thus its dependencies to a minimum.
 */
import * as a11yClickLib from './a11y_click';
import { ActionResolver } from './action_resolver';
import * as eventLib from './event';
import { A11Y_CLICK_SUPPORT, MOUSE_SPECIAL_SUPPORT } from './event_contract_defines';
import * as eventInfoLib from './event_info';
import { EventType } from './event_type';
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
    constructor(containerManager) {
        this.actionResolver = new ActionResolver({
            syntheticMouseEventSupport: EventContract.MOUSE_SPECIAL_SUPPORT,
        });
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
        /** Whether to add an a11y click listener. */
        this.addA11yClickListener = false;
        this.containerManager = containerManager;
        if (EventContract.A11Y_CLICK_SUPPORT) {
            // Add a11y click support to the `EventContract`.
            this.addA11yClickSupport();
        }
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
        this.actionResolver.resolve(eventInfo);
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
        if (!EventContract.MOUSE_SPECIAL_SUPPORT &&
            (eventType === EventType.MOUSEENTER ||
                eventType === EventType.MOUSELEAVE ||
                eventType === EventType.POINTERENTER ||
                eventType === EventType.POINTERLEAVE)) {
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
        // Automatically install a keypress/keydown event handler if support for
        // accessible clicks is turned on.
        if (this.addA11yClickListener && eventType === EventType.CLICK) {
            this.addEvent(EventType.KEYDOWN);
        }
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
    addA11yClickSupport() {
        this.addA11yClickSupportImpl(a11yClickLib.updateEventInfoForA11yClick, a11yClickLib.preventDefaultForA11yClick, a11yClickLib.populateClickOnlyAction);
    }
    /**
     * Enables a11y click support to be deferred. Meant to be called in the same
     * compilation unit as the `EventContract`.
     */
    exportAddA11yClickSupport() {
        this.addA11yClickListener = true;
        this.ecaacs = this.addA11yClickSupportImpl.bind(this);
    }
    /**
     * Unrenamed function that loads a11yClickSupport.
     */
    addA11yClickSupportImpl(updateEventInfoForA11yClick, preventDefaultForA11yClick, populateClickOnlyAction) {
        this.addA11yClickListener = true;
        this.actionResolver.addA11yClickSupport(updateEventInfoForA11yClick, preventDefaultForA11yClick, populateClickOnlyAction);
    }
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
export function addDeferredA11yClickSupport(eventContract) {
    eventContract.ecaacs?.(a11yClickLib.updateEventInfoForA11yClick, a11yClickLib.preventDefaultForA11yClick, a11yClickLib.populateClickOnlyAction);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXZlbnRjb250cmFjdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvcHJpbWl0aXZlcy9ldmVudC1kaXNwYXRjaC9zcmMvZXZlbnRjb250cmFjdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQXNCRztBQUVILE9BQU8sS0FBSyxZQUFZLE1BQU0sY0FBYyxDQUFDO0FBQzdDLE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUVqRCxPQUFPLEtBQUssUUFBUSxNQUFNLFNBQVMsQ0FBQztBQUVwQyxPQUFPLEVBQUMsa0JBQWtCLEVBQUUscUJBQXFCLEVBQUMsTUFBTSwwQkFBMEIsQ0FBQztBQUNuRixPQUFPLEtBQUssWUFBWSxNQUFNLGNBQWMsQ0FBQztBQUM3QyxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sY0FBYyxDQUFDO0FBK0J2Qzs7Ozs7Ozs7Ozs7OztHQWFHO0FBQ0gsTUFBTSxPQUFPLGFBQWE7YUFDakIsdUJBQWtCLEdBQUcsa0JBQWtCLEFBQXJCLENBQXNCO2FBQ3hDLDBCQUFxQixHQUFHLHFCQUFxQixBQUF4QixDQUF5QjtJQTJDckQsWUFBWSxnQkFBK0M7UUF2QzFDLG1CQUFjLEdBQUcsSUFBSSxjQUFjLENBQUM7WUFDbkQsMEJBQTBCLEVBQUUsYUFBYSxDQUFDLHFCQUFxQjtTQUNoRSxDQUFDLENBQUM7UUFFSDs7Ozs7O1dBTUc7UUFDSyxrQkFBYSxHQUFrQyxFQUFFLENBQUM7UUFFbEQsc0NBQWlDLEdBQThCLEVBQUUsQ0FBQztRQUUxRTs7Ozs7O1dBTUc7UUFDSyxlQUFVLEdBQXNCLElBQUksQ0FBQztRQUU3Qzs7O1dBR0c7UUFDSyxxQkFBZ0IsR0FBb0MsRUFBRSxDQUFDO1FBRS9ELDZDQUE2QztRQUNyQyx5QkFBb0IsR0FBRyxLQUFLLENBQUM7UUFTbkMsSUFBSSxD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bUJBQW1CLENBQ3JDLDJCQUEyQixFQUMzQiwwQkFBMEIsRUFDMUIsdUJBQXVCLENBQ3hCLENBQUM7SUFDSixDQUFDOztBQUdILFNBQVMsb0JBQW9CLENBQzNCLFNBQXNCLEVBQ3RCLFVBQW9CLEVBQ3BCLGlCQUFxQyxFQUNyQyxPQUFpQjtJQUVqQixLQUFLLElBQUksR0FBRyxHQUFHLENBQUMsRUFBRSxHQUFHLEdBQUcsVUFBVSxDQUFDLE1BQU0sRUFBRSxHQUFHLEVBQUUsRUFBRSxDQUFDO1FBQ2pELFNBQVMsQ0FBQyxtQkFBbUIsQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLEVBQUUsaUJBQWlCLEVBQUUsZ0JBQWdCLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDOUYsQ0FBQztBQUNILENBQUM7QUFFRDs7Ozs7R0FLRztBQUNILE1BQU0sVUFBVSwyQkFBMkIsQ0FBQyxhQUE0QjtJQUN0RSxhQUFhLENBQUMsTUFBTSxFQUFFLENBQ3BCLFlBQVksQ0FBQywyQkFBMkIsRUFDeEMsWUFBWSxDQUFDLDBCQUEwQixFQUN2QyxZQUFZLENBQUMsdUJBQXVCLENBQ3JDLENBQUM7QUFDSixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbi8qKlxuICogQGZpbGVvdmVydmlldyBJbXBsZW1lbnRzIHRoZSBsb2NhbCBldmVudCBoYW5kbGluZyBjb250cmFjdC4gVGhpc1xuICogYWxsb3dzIERPTSBvYmplY3RzIGluIGEgY29udGFpbmVyIHRoYXQgZW50ZXJzIGludG8gdGhpcyBjb250cmFjdCB0b1xuICogZGVmaW5lIGV2ZW50IGhhbmRsZXJzIHdoaWNoIGFyZSBleGVjdXRlZCBpbiBhIGxvY2FsIGNvbnRleHQuXG4gKlxuICogT25lIEV2ZW50Q29udHJhY3QgaW5zdGFuY2UgY2FuIG1hbmFnZSB0aGUgY29udHJhY3QgZm9yIG11bHRpcGxlXG4gKiBjb250YWluZXJzLCB3aGljaCBhcmUgYWRkZWQgdXNpbmcgdGhlIGFkZENvbnRhaW5lcigpIG1ldGhvZC5cbiAqXG4gKiBFdmVudHMgY2FuIGJlIHJlZ2lzdGVyZWQgdXNpbmcgdGhlIGFkZEV2ZW50KCkgbWV0aG9kLlxuICpcbiAqIEEgRGlzcGF0Y2hlciBpcyBhZGRlZCB1c2luZyB0aGUgcmVnaXN0ZXJEaXNwYXRjaGVyKCkgbWV0aG9kLiBVbnRpbCB0aGVyZSBpc1xuICogYSBkaXNwYXRjaGVyLCBldmVudHMgYXJlIHF1ZXVlZC4gVGhlIGlkZWEgaXMgdGhhdCB0aGUgRXZlbnRDb250cmFjdFxuICogY2xhc3MgaXMgaW5saW5lZCBpbiB0aGUgSFRNTCBvZiB0aGUgdG9wIGxldmVsIHBhZ2UgYW5kIGluc3RhbnRpYXRlZFxuICogcmlnaHQgYWZ0ZXIgdGhlIHN0YXJ0IG9mIDxib2R5Pi4gVGhlIERpc3BhdGNoZXIgY2xhc3MgaXMgY29udGFpbmVkXG4gKiBpbiB0aGUgZXh0ZXJuYWwgZGVmZXJyZWQganMsIGFuZCBpbnN0YW50aWF0ZWQgYW5kIHJlZ2lzdGVyZWQgd2l0aFxuICogRXZlbnRDb250cmFjdCB3aGVuIHRoZSBleHRlcm5hbCBqYXZhc2NyaXB0IGluIHRoZSBwYWdlIGxvYWRzLiBUaGVcbiAqIGV4dGVybmFsIGphdmFzY3JpcHQgd2lsbCBhbHNvIHJlZ2lzdGVyIHRoZSBqc2FjdGlvbiBoYW5kbGVycywgd2hpY2hcbiAqIHRoZW4gcGljayB1cCB0aGUgcXVldWVkIGV2ZW50cyBhdCB0aGUgdGltZSBvZiByZWdpc3RyYXRpb24uXG4gKlxuICogU2luY2UgdGhpcyBjbGFzcyBpcyBtZWFudCB0byBiZSBpbmxpbmVkIGluIHRoZSBtYWluIHBhZ2UgSFRNTCwgdGhlXG4gKiBzaXplIG9mIHRoZSBiaW5hcnkgY29tcGlsZWQgZnJvbSB0aGlzIGZpbGUgTVVTVCBiZSBrZXB0IGFzIHNtYWxsIGFzXG4gKiBwb3NzaWJsZSBhbmQgdGh1cyBpdHMgZGVwZW5kZW5jaWVzIHRvIGEgbWluaW11bS5cbiAqL1xuXG5pbXBvcnQgKiBhcyBhMTF5Q2xpY2tMaWIgZnJvbSAnLi9hMTF5X2NsaWNrJztcbmltcG9ydCB7QWN0aW9uUmVzb2x2ZXJ9IGZyb20gJy4vYWN0aW9uX3Jlc29sdmVyJztcbmltcG9ydCB7RWFybHlKc2FjdGlvbkRhdGEsIEVhcmx5SnNhY3Rpb25EYXRhQ29udGFpbmVyfSBmcm9tICcuL2Vhcmx5ZXZlbnRjb250cmFjdCc7XG5pbXBvcnQgKiBhcyBldmVudExpYiBmcm9tICcuL2V2ZW50JztcbmltcG9ydCB7RXZlbnRDb250cmFjdENvbnRhaW5lck1hbmFnZXJ9IGZyb20gJy4vZXZlbnRfY29udHJhY3RfY29udGFpbmVyJztcbmltcG9ydCB7QTExWV9DTElDS19TVVBQT1JULCBNT1VTRV9TUEVDSUFMX1NVUFBPUlR9IGZyb20gJy4vZXZlbnRfY29udHJhY3RfZGVmaW5lcyc7XG5pbXBvcnQgKiBhcyBldmVudEluZm9MaWIgZnJvbSAnLi9ldmVudF9pbmZvJztcbmltcG9ydCB7RXZlbnRUeXBlfSBmcm9tICcuL2V2ZW50X3R5cGUnO1xuaW1wb3J0IHtSZXN0cmljdGlvbn0gZnJvbSAnLi9yZXN0cmljdGlvbic7XG5cbi8qKlxuICogVGhlIEFQSSBvZiBhbiBFdmVudENvbnRyYWN0IHRoYXQgaXMgc2FmZSB0byBjYWxsIGZyb20gYW55IGNvbXBpbGF0aW9uIHVuaXQuXG4gKi9cbmV4cG9ydCBkZWNsYXJlIGludGVyZmFjZSBVbnJlbmFtZWRFdmVudENvbnRyYWN0IHtcbiAgLy8gQWxpYXMgZm9yIEpzY3Rpb24gRXZlbnRDb250cmFjdCByZWdpc3RlckRpc3BhdGNoZXIuXG4gIGVjcmQoZGlzcGF0Y2hlcjogRGlzcGF0Y2hlciwgcmVzdHJpY3Rpb246IFJlc3RyaWN0aW9uKTogdm9pZDtcbiAgLy8gVW5yZW5hbWVkIGZ1bmN0aW9uLiBBYmJyZXZpYXRpb24gZm9yIGBldmVudENvbnRyYWN0LmFkZEExMXlDbGlja1N1cHBvcnRgLlxuICBlY2FhY3M/OiAoXG4gICAgdXBkYXRlRXZlbnRJbmZvRm9yQTExeUNsaWNrOiB0eXBlb2YgYTExeUNsaWNrTGliLnVwZGF0ZUV2ZW50SW5mb0ZvckExMXlDbGljayxcbiAgICBwcmV2ZW50RGVmYXVsdEZvckExMXlDbGljazogdHlwZW9mIGExMXlDbGlja0xpYi5wcmV2ZW50RGVmYXVsdEZvckExMXlDbGljayxcbiAgICBwb3B1bGF0ZUNsaWNrT25seUFjdGlvbjogdHlwZW9mIGExMXlDbGlja0xpYi5wb3B1bGF0ZUNsaWNrT25seUFjdGlvbixcbiAgKSA9PiB2b2lkO1xufVxuXG4vKiogQSBmdW5jdGlvbiB0aGF0IGlzIGNhbGxlZCB0byBoYW5kbGUgZXZlbnRzIGNhcHR1cmVkIGJ5IHRoZSBFdmVudENvbnRyYWN0LiAqL1xuZXhwb3J0IHR5cGUgRGlzcGF0Y2hlciA9IChldmVudEluZm86IGV2ZW50SW5mb0xpYi5FdmVudEluZm8sIGdsb2JhbERpc3BhdGNoPzogYm9vbGVhbikgPT4gdm9pZDtcblxuLyoqXG4gKiBBIGZ1bmN0aW9uIHRoYXQgaGFuZGxlcyBhbiBldmVudCBkaXNwYXRjaGVkIGZyb20gdGhlIGJyb3dzZXIuXG4gKlxuICogZXZlbnRUeXBlOiBNYXkgZGlmZmVyIGZyb20gYGV2ZW50LnR5cGVgIGlmIEpTQWN0aW9uIHVzZXMgYVxuICogc2hvcnQtaGFuZCBuYW1lIG9yIGlzIHBhdGNoaW5nIG92ZXIgYW4gbm9uLWJ1YmJsaW5nIGV2ZW50IHdpdGggYSBidWJibGluZ1xuICogdmFyaWFudC5cbiAqIGV2ZW50OiBUaGUgbmF0aXZlIGJyb3dzZXIgZXZlbnQuXG4gKiBjb250YWluZXI6IFRoZSBjb250YWluZXIgZm9yIHRoaXMgZGlzcGF0Y2guXG4gKi9cbnR5cGUgRXZlbnRIYW5kbGVyID0gKGV2ZW50VHlwZTogc3RyaW5nLCBldmVudDogRXZlbnQsIGNvbnRhaW5lcjogRWxlbWVudCkgPT4gdm9pZDtcblxuLyoqXG4gKiBFdmVudENvbnRyYWN0IGludGVyY2VwdHMgZXZlbnRzIGluIHRoZSBidWJibGluZyBwaGFzZSBhdCB0aGVcbiAqIGJvdW5kYXJ5IG9mIGEgY29udGFpbmVyIGVsZW1lbnQsIGFuZCBtYXBzIHRoZW0gdG8gZ2VuZXJpYyBhY3Rpb25zXG4gKiB3aGljaCBhcmUgc3BlY2lmaWVkIHVzaW5nIHRoZSBjdXN0b20ganNhY3Rpb24gYXR0cmlidXRlIGluXG4gKiBIVE1MLiBCZWhhdmlvciBvZiB0aGUgYXBwbGljYXRpb24gaXMgdGhlbiBzcGVjaWZpZWQgaW4gdGVybXMgb2ZcbiAqIGhhbmRsZXIgZm9yIHN1Y2ggYWN0aW9ucywgY2YuIGpzYWN0aW9uLkRpc3BhdGNoZXIgaW4gZGlzcGF0Y2hlci5qcy5cbiAqXG4gKiBUaGlzIGhhcyBzZXZlcmFsIGJlbmVmaXRzOiAoMSkgTm8gRE9NIGV2ZW50IGhhbmRsZXJzIG5lZWQgdG8gYmVcbiAqIHJlZ2lzdGVyZWQgb24gdGhlIHNwZWNpZmljIGVsZW1lbnRzIGluIHRoZSBVSS4gKDIpIFRoZSBzZXQgb2ZcbiAqIGV2ZW50cyB0aGF0IHRoZSBhcHBsaWNhdGlvbiBoYXMgdG8gaGFuZGxlIGNhbiBiZSBzcGVjaWZpZWQgaW4gdGVybXNcbiAqIG9mIHRoZSBzZW1hbnRpY3Mgb2YgdGhlIGFwcGxpY2F0aW9uLCByYXRoZXIgdGhhbiBpbiB0ZXJtcyBvZiBET01cbiAqIGV2ZW50cy4gKDMpIEludm9jYXRpb24gb2YgaGFuZGxlcnMgY2FuIGJlIGRlbGF5ZWQgYW5kIGhhbmRsZXJzIGNhblxuICogYmUgZGVsYXkgbG9hZGVkIGluIGEgZ2VuZXJpYyB3YXkuXG4gKi9cbmV4cG9ydCBjbGFzcyBFdmVudENvbnRyYWN0IGltcGxlbWVudHMgVW5yZW5hbWVkRXZlbnRDb250cmFjdCB7XG4gIHN0YXRpYyBBMTFZX0NMSUNLX1NVUFBPUlQgPSBBMTFZX0NMSUNLX1NVUFBPUlQ7XG4gIHN0YXRpYyBNT1VTRV9TUEVDSUFMX1NVUFBPUlQgPSBNT1VTRV9TUEVDSUFMX1NVUFBPUlQ7XG5cbiAgcHJpdmF0ZSBjb250YWluZXJNYW5hZ2VyOiBFdmVudENvbnRyYWN0Q29udGFpbmVyTWFuYWdlciB8IG51bGw7XG5cbiAgcHJpdmF0ZSByZWFkb25seSBhY3Rpb25SZXNvbHZlciA9IG5ldyBBY3Rpb25SZXNvbHZlcih7XG4gICAgc3ludGhldGljTW91c2VFdmVudFN1cHBvcnQ6IEV2ZW50Q29udHJhY3QuTU9VU0VfU1BFQ0lBTF9TVVBQT1JULFxuICB9KTtcblxuICAvKipcbiAgICogVGhlIERPTSBldmVudHMgd2hpY2ggdGhpcyBjb250cmFjdCBjb3ZlcnMuIFVzZWQgdG8gcHJldmVudCBkb3VibGVcbiAgICogcmVnaXN0cmF0aW9uIG9mIGV2ZW50IHR5cGVzLiBUaGUgdmFsdWUgb2YgdGhlIG1hcCBpcyB0aGVcbiAgICogaW50ZXJuYWxseSBjcmVhdGVkIERPTSBldmVudCBoYW5kbGVyIGZ1bmN0aW9uIHRoYXQgaGFuZGxlcyB0aGVcbiAgICogRE9NIGV2ZW50cy4gU2VlIGFkZEV2ZW50KCkuXG4gICAqXG4gICAqL1xuICBwcml2YXRlIGV2ZW50SGFuZGxlcnM6IHtba2V5OiBzdHJpbmddOiBFdmVudEhhbmRsZXJ9ID0ge307XG5cbiAgcHJpdmF0ZSBicm93c2VyRXZlbnRUeXBlVG9FeHRyYUV2ZW50VHlwZXM6IHtba2V5OiBzdHJpbmddOiBzdHJpbmdbXX0gPSB7fTtcblxuICAvKipcbiAgICogVGhlIGRpc3BhdGNoZXIgZnVuY3Rpb24uIEV2ZW50cyBhcmUgcGFzc2VkIHRvIHRoaXMgZnVuY3Rpb24gZm9yXG4gICAqIGhhbmRsaW5nIG9uY2UgaXQgd2FzIHNldCB1c2luZyB0aGUgcmVnaXN0ZXJEaXNwYXRjaGVyKCkgbWV0aG9kLiBUaGlzIGlzXG4gICAqIGRvbmUgYmVjYXVzZSB0aGUgZnVuY3Rpb24gaXMgcGFzc2VkIGZyb20gYW5vdGhlciBqc2JpbmFyeSwgc28gcGFzc2luZyB0aGVcbiAgICogaW5zdGFuY2UgYW5kIGludm9raW5nIHRoZSBtZXRob2QgaGVyZSB3b3VsZCByZXF1aXJlIHRvIGxlYXZlIHRoZSBtZXRob2RcbiAgICogdW5vYmZ1c2NhdGVkLlxuICAgKi9cbiAgcHJpdmF0ZSBkaXNwYXRjaGVyOiBEaXNwYXRjaGVyIHwgbnVsbCA9IG51bGw7XG5cbiAgLyoqXG4gICAqIFRoZSBsaXN0IG9mIHN1c3BlbmRlZCBgRXZlbnRJbmZvYCB0aGF0IHdpbGwgYmUgZGlzcGF0Y2hlZFxuICAgKiBhcyBzb29uIGFzIHRoZSBgRGlzcGF0Y2hlcmAgaXMgcmVnaXN0ZXJlZC5cbiAgICovXG4gIHByaXZhdGUgcXVldWVkRXZlbnRJbmZvczogZXZlbnRJbmZvTGliLkV2ZW50SW5mb1tdIHwgbnVsbCA9IFtdO1xuXG4gIC8qKiBXaGV0aGVyIHRvIGFkZCBhbiBhMTF5IGNsaWNrIGxpc3RlbmVyLiAqL1xuICBwcml2YXRlIGFkZEExMXlDbGlja0xpc3RlbmVyID0gZmFsc2U7XG5cbiAgZWNhYWNzPzogKFxuICAgIHVwZGF0ZUV2ZW50SW5mb0ZvckExMXlDbGljazogdHlwZW9mIGExMXlDbGlja0xpYi51cGRhdGVFdmVudEluZm9Gb3JBMTF5Q2xpY2ssXG4gICAgcHJldmVudERlZmF1bHRGb3JBMTF5Q2xpY2s6IHR5cGVvZiBhMTF5Q2xpY2tMaWIucHJldmVudERlZmF1bHRGb3JBMTF5Q2xpY2ssXG4gICAgcG9wdWxhdGVDbGlja09ubHlBY3Rpb246IHR5cGVvZiBhMTF5Q2xpY2tMaWIucG9wdWxhdGVDbGlja09ubHlBY3Rpb24sXG4gICkgPT4gdm9pZDtcblxuICBjb25zdHJ1Y3Rvcihjb250YWluZXJNYW5hZ2VyOiBFdmVudENvbnRyYWN0Q29udGFpbmVyTWFuYWdlcikge1xuICAgIHRoaXMuY29udGFpbmVyTWFuYWdlciA9IGNvbnRhaW5lck1hbmFnZXI7XG4gICAgaWYgKEV2ZW50Q29udHJhY3QuQTExWV9DTElDS19TVVBQT1JUKSB7XG4gICAgICAvLyBBZGQgYTExeSBjbGljayBzdXBwb3J0IHRvIHRoZSBgRXZlbnRDb250cmFjdGAuXG4gICAgICB0aGlzLmFkZEExMXlDbGlja1N1cHBvcnQoKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGhhbmRsZUV2ZW50KGV2ZW50VHlwZTogc3RyaW5nLCBldmVudDogRXZlbnQsIGNvbnRhaW5lcjogRWxlbWVudCkge1xuICAgIGNvbnN0IGV2ZW50SW5mbyA9IGV2ZW50SW5mb0xpYi5jcmVhdGVFdmVudEluZm9Gcm9tUGFyYW1ldGVycyhcbiAgICAgIC8qIGV2ZW50VHlwZT0gKi8gZXZlbnRUeXBlLFxuICAgICAgLyogZXZlbnQ9ICovIGV2ZW50LFxuICAgICAgLyogdGFyZ2V0RWxlbWVudD0gKi8gZXZlbnQudGFyZ2V0IGFzIEVsZW1lbnQsXG4gICAgICAvKiBjb250YWluZXI9ICovIGNvbnRhaW5lcixcbiAgICAgIC8qIHRpbWVzdGFtcD0gKi8gRGF0ZS5ub3coKSxcbiAgICApO1xuICAgIHRoaXMuaGFuZGxlRXZlbnRJbmZvKGV2ZW50SW5mbyk7XG4gIH1cblxuICAvKipcbiAgICogSGFuZGxlIGFuIGBFdmVudEluZm9gLlxuICAgKi9cbiAgcHJpdmF0ZSBoYW5kbGVFdmVudEluZm8oZXZlbnRJbmZvOiBldmVudEluZm9MaWIuRXZlbnRJbmZvKSB7XG4gICAgaWYgKCF0aGlzLmRpc3BhdGNoZXIpIHtcbiAgICAgIC8vIEFsbCBldmVudHMgYXJlIHF1ZXVlZCB3aGVuIHRoZSBkaXNwYXRjaGVyIGlzbid0IHlldCBsb2FkZWQuXG4gICAgICBldmVudEluZm9MaWIuc2V0SXNSZXBsYXkoZXZlbnRJbmZvLCB0cnVlKTtcbiAgICAgIHRoaXMucXVldWVkRXZlbnRJbmZvcz8ucHVzaChldmVudEluZm8pO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLmFjdGlvblJlc29sdmVyLnJlc29sdmUoZXZlbnRJbmZvKTtcbiAgICB0aGlzLmRpc3BhdGNoZXIoZXZlbnRJbmZvKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBFbmFibGVzIGpzYWN0aW9uIGhhbmRsZXJzIHRvIGJlIGNhbGxlZCBmb3IgdGhlIGV2ZW50IHR5cGUgZ2l2ZW4gYnlcbiAgICogbmFtZS5cbiAgICpcbiAgICogSWYgdGhlIGV2ZW50IGlzIGFscmVhZHkgcmVnaXN0ZXJlZCwgdGhpcyBkb2VzIG5vdGhpbmcuXG4gICAqXG4gICAqIEBwYXJhbSBwcmVmaXhlZEV2ZW50VHlwZSBJZiBzdXBwbGllZCwgdGhpcyBldmVudCBpcyB1c2VkIGluXG4gICAqICAgICB0aGUgYWN0dWFsIGJyb3dzZXIgZXZlbnQgcmVnaXN0cmF0aW9uIGluc3RlYWQgb2YgdGhlIG5hbWUgdGhhdCBpc1xuICAgKiAgICAgZXhwb3NlZCB0byBqc2FjdGlvbi4gVXNlIHRoaXMgaWYgeW91IGUuZy4gd2FudCB1c2VycyB0byBiZSBhYmxlXG4gICAqICAgICB0byBzdWJzY3JpYmUgdG8ganNhY3Rpb249XCJ0cmFuc2l0aW9uRW5kOmZvb1wiIHdoaWxlIHRoZSB1bmRlcmx5aW5nXG4gICAqICAgICBldmVudCBpcyB3ZWJraXRUcmFuc2l0aW9uRW5kIGluIG9uZSBicm93c2VyIGFuZCBtb3pUcmFuc2l0aW9uRW5kXG4gICAqICAgICBpbiBhbm90aGVyLlxuICAgKi9cbiAgYWRkRXZlbnQoZXZlbnRUeXBlOiBzdHJpbmcsIHByZWZpeGVkRXZlbnRUeXBlPzogc3RyaW5nKSB7XG4gICAgaWYgKGV2ZW50VHlwZSBpbiB0aGlzLmV2ZW50SGFuZGxlcnMgfHwgIXRoaXMuY29udGFpbmVyTWFuYWdlcikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmIChcbiAgICAgICFFdmVudENvbnRyYWN0Lk1PVVNFX1NQRUNJQUxfU1VQUE9SVCAmJlxuICAgICAgKGV2ZW50VHlwZSA9PT0gRXZlbnRUeXBlLk1PVVNFRU5URVIgfHxcbiAgICAgICAgZXZlbnRUeXBlID09PSBFdmVudFR5cGUuTU9VU0VMRUFWRSB8fFxuICAgICAgICBldmVudFR5cGUgPT09IEV2ZW50VHlwZS5QT0lOVEVSRU5URVIgfHxcbiAgICAgICAgZXZlbnRUeXBlID09PSBFdmVudFR5cGUuUE9JTlRFUkxFQVZFKVxuICAgICkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGV2ZW50SGFuZGxlciA9IChldmVudFR5cGU6IHN0cmluZywgZXZlbnQ6IEV2ZW50LCBjb250YWluZXI6IEVsZW1lbnQpID0+IHtcbiAgICAgIHRoaXMuaGFuZGxlRXZlbnQoZXZlbnRUeXBlLCBldmVudCwgY29udGFpbmVyKTtcbiAgICB9O1xuXG4gICAgLy8gU3RvcmUgdGhlIGNhbGxiYWNrIHRvIGFsbG93IHVzIHRvIHJlcGxheSBldmVudHMuXG4gICAgdGhpcy5ldmVudEhhbmRsZXJzW2V2ZW50VHlwZV0gPSBldmVudEhhbmRsZXI7XG5cbiAgICBjb25zdCBicm93c2VyRXZlbnRUeXBlID0gZXZlbnRMaWIuZ2V0QnJvd3NlckV2ZW50VHlwZShwcmVmaXhlZEV2ZW50VHlwZSB8fCBldmVudFR5cGUpO1xuXG4gICAgaWYgKGJyb3dzZXJFdmVudFR5cGUgIT09IGV2ZW50VHlwZSkge1xuICAgICAgY29uc3QgZXZlbnRUeXBlcyA9IHRoaXMuYnJvd3NlckV2ZW50VHlwZVRvRXh0cmFFdmVudFR5cGVzW2Jyb3dzZXJFdmVudFR5cGVdIHx8IFtdO1xuICAgICAgZXZlbnRUeXBlcy5wdXNoKGV2ZW50VHlwZSk7XG4gICAgICB0aGlzLmJyb3dzZXJFdmVudFR5cGVUb0V4dHJhRXZlbnRUeXBlc1ticm93c2VyRXZlbnRUeXBlXSA9IGV2ZW50VHlwZXM7XG4gICAgfVxuXG4gICAgdGhpcy5jb250YWluZXJNYW5hZ2VyLmFkZEV2ZW50TGlzdGVuZXIoYnJvd3NlckV2ZW50VHlwZSwgKGVsZW1lbnQ6IEVsZW1lbnQpID0+IHtcbiAgICAgIHJldHVybiAoZXZlbnQ6IEV2ZW50KSA9PiB7XG4gICAgICAgIGV2ZW50SGFuZGxlcihldmVudFR5cGUsIGV2ZW50LCBlbGVtZW50KTtcbiAgICAgIH07XG4gICAgfSk7XG5cbiAgICAvLyBBdXRvbWF0aWNhbGx5IGluc3RhbGwgYSBrZXlwcmVzcy9rZXlkb3duIGV2ZW50IGhhbmRsZXIgaWYgc3VwcG9ydCBmb3JcbiAgICAvLyBhY2Nlc3NpYmxlIGNsaWNrcyBpcyB0dXJuZWQgb24uXG4gICAgaWYgKHRoaXMuYWRkQTExeUNsaWNrTGlzdGVuZXIgJiYgZXZlbnRUeXBlID09PSBFdmVudFR5cGUuQ0xJQ0spIHtcbiAgICAgIHRoaXMuYWRkRXZlbnQoRXZlbnRUeXBlLktFWURPV04pO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBxdWV1ZWQgZWFybHkgZXZlbnRzIGFuZCByZXBsYXkgdGhlbSB1c2luZyB0aGUgYXBwcm9wcmlhdGUgaGFuZGxlclxuICAgKiBpbiB0aGUgcHJvdmlkZWQgZXZlbnQgY29udHJhY3QuIE9uY2UgYWxsIHRoZSBldmVudHMgYXJlIHJlcGxheWVkLCBpdCBjbGVhbnNcbiAgICogdXAgdGhlIGVhcmx5IGNvbnRyYWN0LlxuICAgKi9cbiAgcmVwbGF5RWFybHlFdmVudHMoXG4gICAgZWFybHlKc2FjdGlvbkNvbnRhaW5lcjogRWFybHlKc2FjdGlvbkRhdGFDb250YWluZXIgPSB3aW5kb3cgYXMgRWFybHlKc2FjdGlvbkRhdGFDb250YWluZXIsXG4gICkge1xuICAgIC8vIENoZWNrIGlmIHRoZSBlYXJseSBjb250cmFjdCBpcyBwcmVzZW50IGFuZCBwcmV2ZW50IGNhbGxpbmcgdGhpcyBmdW5jdGlvblxuICAgIC8vIG1vcmUgdGhhbiBvbmNlLlxuICAgIGNvbnN0IGVhcmx5SnNhY3Rpb25EYXRhOiBFYXJseUpzYWN0aW9uRGF0YSB8IHVuZGVmaW5lZCA9IGVhcmx5SnNhY3Rpb25Db250YWluZXIuX2Vqc2E7XG4gICAgaWYgKCFlYXJseUpzYWN0aW9uRGF0YSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIFJlcGxheSB0aGUgZWFybHkgY29udHJhY3QgZXZlbnRzLlxuICAgIGNvbnN0IGVhcmx5RXZlbnRJbmZvczogZXZlbnRJbmZvTGliLkV2ZW50SW5mb1tdID0gZWFybHlKc2FjdGlvbkRhdGEucTtcbiAgICBmb3IgKGxldCBpZHggPSAwOyBpZHggPCBlYXJseUV2ZW50SW5mb3MubGVuZ3RoOyBpZHgrKykge1xuICAgICAgY29uc3QgZWFybHlFdmVudEluZm86IGV2ZW50SW5mb0xpYi5FdmVudEluZm8gPSBlYXJseUV2ZW50SW5mb3NbaWR4XTtcbiAgICAgIGNvbnN0IGV2ZW50VHlwZXMgPSB0aGlzLmdldEV2ZW50VHlwZXNGb3JCcm93c2VyRXZlbnRUeXBlKGVhcmx5RXZlbnRJbmZvLmV2ZW50VHlwZSk7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGV2ZW50VHlwZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3QgZXZlbnRJbmZvID0gZXZlbnRJbmZvTGliLmNsb25lRXZlbnRJbmZvKGVhcmx5RXZlbnRJbmZvKTtcbiAgICAgICAgLy8gRXZlbnRJbmZvIGV2ZW50VHlwZSBtYXBzIHRvIEpTQWN0aW9uJ3MgaW50ZXJuYWwgZXZlbnQgdHlwZSxcbiAgICAgICAgLy8gcmF0aGVyIHRoYW4gdGhlIGJyb3dzZXIgZXZlbnQgdHlwZS5cbiAgICAgICAgZXZlbnRJbmZvTGliLnNldEV2ZW50VHlwZShldmVudEluZm8sIGV2ZW50VHlwZXNbaV0pO1xuICAgICAgICB0aGlzLmhhbmRsZUV2ZW50SW5mbyhldmVudEluZm8pO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIENsZWFuIHVwIHRoZSBlYXJseSBjb250cmFjdC5cbiAgICBjb25zdCBlYXJseUV2ZW50SGFuZGxlcjogKGV2ZW50OiBFdmVudCkgPT4gdm9pZCA9IGVhcmx5SnNhY3Rpb25EYXRhLmg7XG4gICAgcmVtb3ZlRXZlbnRMaXN0ZW5lcnMoZWFybHlKc2FjdGlvbkRhdGEuYywgZWFybHlKc2FjdGlvbkRhdGEuZXQsIGVhcmx5RXZlbnRIYW5kbGVyKTtcbiAgICByZW1vdmVFdmVudExpc3RlbmVycyhlYXJseUpzYWN0aW9uRGF0YS5jLCBlYXJseUpzYWN0aW9uRGF0YS5ldGMsIGVhcmx5RXZlbnRIYW5kbGVyLCB0cnVlKTtcbiAgICBkZWxldGUgZWFybHlKc2FjdGlvbkNvbnRhaW5lci5fZWpzYTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGFsbCBKU0FjdGlvbiBldmVudCB0eXBlcyB0aGF0IGhhdmUgYmVlbiByZWdpc3RlcmVkIGZvciBhIGdpdmVuXG4gICAqIGJyb3dzZXIgZXZlbnQgdHlwZS5cbiAgICovXG4gIHByaXZhdGUgZ2V0RXZlbnRUeXBlc0ZvckJyb3dzZXJFdmVudFR5cGUoYnJvd3NlckV2ZW50VHlwZTogc3RyaW5nKSB7XG4gICAgY29uc3QgZXZlbnRUeXBlcyA9IFtdO1xuICAgIGlmICh0aGlzLmV2ZW50SGFuZGxlcnNbYnJvd3NlckV2ZW50VHlwZV0pIHtcbiAgICAgIGV2ZW50VHlwZXMucHVzaChicm93c2VyRXZlbnRUeXBlKTtcbiAgICB9XG4gICAgaWYgKHRoaXMuYnJvd3NlckV2ZW50VHlwZVRvRXh0cmFFdmVudFR5cGVzW2Jyb3dzZXJFdmVudFR5cGVdKSB7XG4gICAgICBldmVudFR5cGVzLnB1c2goLi4udGhpcy5icm93c2VyRXZlbnRUeXBlVG9FeHRyYUV2ZW50VHlwZXNbYnJvd3NlckV2ZW50VHlwZV0pO1xuICAgIH1cbiAgICByZXR1cm4gZXZlbnRUeXBlcztcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBldmVudCBoYW5kbGVyIGZ1bmN0aW9uIGZvciBhIGdpdmVuIGV2ZW50IHR5cGUuXG4gICAqL1xuICBoYW5kbGVyKGV2ZW50VHlwZTogc3RyaW5nKTogRXZlbnRIYW5kbGVyIHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy5ldmVudEhhbmRsZXJzW2V2ZW50VHlwZV07XG4gIH1cblxuICAvKipcbiAgICogQ2xlYW5zIHVwIHRoZSBldmVudCBjb250cmFjdC4gVGhpcyByZXNldHMgYWxsIG9mIHRoZSBgRXZlbnRDb250cmFjdGAnc1xuICAgKiBpbnRlcm5hbCBzdGF0ZS4gVXNlcnMgYXJlIHJlc3BvbnNpYmxlIGZvciBub3QgdXNpbmcgdGhpcyBgRXZlbnRDb250cmFjdGBcbiAgICogYWZ0ZXIgaXQgaGFzIGJlZW4gY2xlYW5lZCB1cC5cbiAgICovXG4gIGNsZWFuVXAoKSB7XG4gICAgdGhpcy5jb250YWluZXJNYW5hZ2VyIS5jbGVhblVwKCk7XG4gICAgdGhpcy5jb250YWluZXJNYW5hZ2VyID0gbnVsbDtcbiAgICB0aGlzLmV2ZW50SGFuZGxlcnMgPSB7fTtcbiAgICB0aGlzLmJyb3dzZXJFdmVudFR5cGVUb0V4dHJhRXZlbnRUeXBlcyA9IHt9O1xuICAgIHRoaXMuZGlzcGF0Y2hlciA9IG51bGw7XG4gICAgdGhpcy5xdWV1ZWRFdmVudEluZm9zID0gW107XG4gIH1cblxuICAvKipcbiAgICogUmVnaXN0ZXIgYSBkaXNwYXRjaGVyIGZ1bmN0aW9uLiBFdmVudCBpbmZvIG9mIGVhY2ggZXZlbnQgbWFwcGVkIHRvXG4gICAqIGEganNhY3Rpb24gaXMgcGFzc2VkIGZvciBoYW5kbGluZyB0byB0aGlzIGNhbGxiYWNrLiBUaGUgcXVldWVkXG4gICAqIGV2ZW50cyBhcmUgcGFzc2VkIGFzIHdlbGwgdG8gdGhlIGRpc3BhdGNoZXIgZm9yIGxhdGVyIHJlcGxheWluZ1xuICAgKiBvbmNlIHRoZSBkaXNwYXRjaGVyIGlzIHJlZ2lzdGVyZWQuIENsZWFycyB0aGUgZXZlbnQgcXVldWUgdG8gbnVsbC5cbiAgICpcbiAgICogQHBhcmFtIGRpc3BhdGNoZXIgVGhlIGRpc3BhdGNoZXIgZnVuY3Rpb24uXG4gICAqIEBwYXJhbSByZXN0cmljdGlvblxuICAgKi9cbiAgcmVnaXN0ZXJEaXNwYXRjaGVyKGRpc3BhdGNoZXI6IERpc3BhdGNoZXIsIHJlc3RyaWN0aW9uOiBSZXN0cmljdGlvbikge1xuICAgIHRoaXMuZWNyZChkaXNwYXRjaGVyLCByZXN0cmljdGlvbik7XG4gIH1cblxuICAvKipcbiAgICogVW5yZW5hbWVkIGFsaWFzIGZvciByZWdpc3RlckRpc3BhdGNoZXIuIE5lY2Vzc2FyeSBmb3IgYW55IGNvZGViYXNlcyB0aGF0XG4gICAqIHNwbGl0IHRoZSBgRXZlbnRDb250cmFjdGAgYW5kIGBEaXNwYXRjaGVyYCBjb2RlIGludG8gZGlmZmVyZW50IGNvbXBpbGF0aW9uXG4gICAqIHVuaXRzLlxuICAgKi9cbiAgZWNyZChkaXNwYXRjaGVyOiBEaXNwYXRjaGVyLCByZXN0cmljdGlvbjogUmVzdHJpY3Rpb24pIHtcbiAgICB0aGlzLmRpc3BhdGNoZXIgPSBkaXNwYXRjaGVyO1xuXG4gICAgaWYgKHRoaXMucXVldWVkRXZlbnRJbmZvcz8ubGVuZ3RoKSB7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMucXVldWVkRXZlbnRJbmZvcy5sZW5ndGg7IGkrKykge1xuICAgICAgICB0aGlzLmhhbmRsZUV2ZW50SW5mbyh0aGlzLnF1ZXVlZEV2ZW50SW5mb3NbaV0pO1xuICAgICAgfVxuICAgICAgdGhpcy5xdWV1ZWRFdmVudEluZm9zID0gbnVsbDtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQWRkcyBhMTF5IGNsaWNrIHN1cHBvcnQgdG8gdGhlIGdpdmVuIGBFdmVudENvbnRyYWN0YC4gTWVhbnQgdG8gYmUgY2FsbGVkIGluXG4gICAqIHRoZSBzYW1lIGNvbXBpbGF0aW9uIHVuaXQgYXMgdGhlIGBFdmVudENvbnRyYWN0YC5cbiAgICovXG4gIGFkZEExMXlDbGlja1N1cHBvcnQoKSB7XG4gICAgdGhpcy5hZGRBMTF5Q2xpY2tTdXBwb3J0SW1wbChcbiAgICAgIGExMXlDbGlja0xpYi51cGRhdGVFdmVudEluZm9Gb3JBMTF5Q2xpY2ssXG4gICAgICBhMTF5Q2xpY2tMaWIucHJldmVudERlZmF1bHRGb3JBMTF5Q2xpY2ssXG4gICAgICBhMTF5Q2xpY2tMaWIucG9wdWxhdGVDbGlja09ubHlBY3Rpb24sXG4gICAgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBFbmFibGVzIGExMXkgY2xpY2sgc3VwcG9ydCB0byBiZSBkZWZlcnJlZC4gTWVhbnQgdG8gYmUgY2FsbGVkIGluIHRoZSBzYW1lXG4gICAqIGNvbXBpbGF0aW9uIHVuaXQgYXMgdGhlIGBFdmVudENvbnRyYWN0YC5cbiAgICovXG4gIGV4cG9ydEFkZEExMXlDbGlja1N1cHBvcnQoKSB7XG4gICAgdGhpcy5hZGRBMTF5Q2xpY2tMaXN0ZW5lciA9IHRydWU7XG4gICAgdGhpcy5lY2FhY3MgPSB0aGlzLmFkZEExMXlDbGlja1N1cHBvcnRJbXBsLmJpbmQodGhpcyk7XG4gIH1cblxuICAvKipcbiAgICogVW5yZW5hbWVkIGZ1bmN0aW9uIHRoYXQgbG9hZHMgYTExeUNsaWNrU3VwcG9ydC5cbiAgICovXG4gIHByaXZhdGUgYWRkQTExeUNsaWNrU3VwcG9ydEltcGwoXG4gICAgdXBkYXRlRXZlbnRJbmZvRm9yQTExeUNsaWNrOiB0eXBlb2YgYTExeUNsaWNrTGliLnVwZGF0ZUV2ZW50SW5mb0ZvckExMXlDbGljayxcbiAgICBwcmV2ZW50RGVmYXVsdEZvckExMXlDbGljazogdHlwZW9mIGExMXlDbGlja0xpYi5wcmV2ZW50RGVmYXVsdEZvckExMXlDbGljayxcbiAgICBwb3B1bGF0ZUNsaWNrT25seUFjdGlvbjogdHlwZW9mIGExMXlDbGlja0xpYi5wb3B1bGF0ZUNsaWNrT25seUFjdGlvbixcbiAgKSB7XG4gICAgdGhpcy5hZGRBMTF5Q2xpY2tMaXN0ZW5lciA9IHRydWU7XG4gICAgdGhpcy5hY3Rpb25SZXNvbHZlci5hZGRBMTF5Q2xpY2tTdXBwb3J0KFxuICAgICAgdXBkYXRlRXZlbnRJbmZvRm9yQTExeUNsaWNrLFxuICAgICAgcHJldmVudERlZmF1bHRGb3JBMTF5Q2xpY2ssXG4gICAgICBwb3B1bGF0ZUNsaWNrT25seUFjdGlvbixcbiAgICApO1xuICB9XG59XG5cbmZ1bmN0aW9uIHJlbW92ZUV2ZW50TGlzdGVuZXJzKFxuICBjb250YWluZXI6IEhUTUxFbGVtZW50LFxuICBldmVudFR5cGVzOiBzdHJpbmdbXSxcbiAgZWFybHlFdmVudEhhbmRsZXI6IChlOiBFdmVudCkgPT4gdm9pZCxcbiAgY2FwdHVyZT86IGJvb2xlYW4sXG4pIHtcbiAgZm9yIChsZXQgaWR4ID0gMDsgaWR4IDwgZXZlbnRUeXBlcy5sZW5ndGg7IGlkeCsrKSB7XG4gICAgY29udGFpbmVyLnJlbW92ZUV2ZW50TGlzdGVuZXIoZXZlbnRUeXBlc1tpZHhdLCBlYXJseUV2ZW50SGFuZGxlciwgLyogdXNlQ2FwdHVyZSAqLyBjYXB0dXJlKTtcbiAgfVxufVxuXG4vKipcbiAqIEFkZHMgYTExeSBjbGljayBzdXBwb3J0IHRvIHRoZSBnaXZlbiBgRXZlbnRDb250cmFjdGAuIE1lYW50IHRvIGJlIGNhbGxlZFxuICogaW4gYSBkaWZmZXJlbnQgY29tcGlsYXRpb24gdW5pdCBmcm9tIHRoZSBgRXZlbnRDb250cmFjdGAuIFRoZSBgRXZlbnRDb250cmFjdGBcbiAqIG11c3QgaGF2ZSBjYWxsZWQgYGV4cG9ydEFkZEExMXlDbGlja1N1cHBvcnRgIGluIGl0cyBjb21waWxhdGlvbiB1bml0IGZvciB0aGlzXG4gKiB0byBoYXZlIGFueSBlZmZlY3QuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhZGREZWZlcnJlZEExMXlDbGlja1N1cHBvcnQoZXZlbnRDb250cmFjdDogRXZlbnRDb250cmFjdCkge1xuICBldmVudENvbnRyYWN0LmVjYWFjcz8uKFxuICAgIGExMXlDbGlja0xpYi51cGRhdGVFdmVudEluZm9Gb3JBMTF5Q2xpY2ssXG4gICAgYTExeUNsaWNrTGliLnByZXZlbnREZWZhdWx0Rm9yQTExeUNsaWNrLFxuICAgIGExMXlDbGlja0xpYi5wb3B1bGF0ZUNsaWNrT25seUFjdGlvbixcbiAgKTtcbn1cbiJdfQ==