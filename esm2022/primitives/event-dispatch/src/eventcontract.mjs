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
        const action = eventInfoLib.getAction(eventInfo);
        if (action) {
            if (shouldPreventDefaultBeforeDispatching(eventInfoLib.getActionElement(action), eventInfo)) {
                eventLib.preventDefault(eventInfoLib.getEvent(eventInfo));
            }
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
/**
 * Returns true if the default action of this event should be prevented before
 * this event is dispatched.
 */
function shouldPreventDefaultBeforeDispatching(actionElement, eventInfo) {
    // Prevent browser from following <a> node links if a jsaction is present
    // and we are dispatching the action now. Note that the targetElement may be
    // a child of an anchor that has a jsaction attached. For that reason, we
    // need to check the actionElement rather than the targetElement.
    return (actionElement.tagName === 'A' &&
        (eventInfoLib.getEventType(eventInfo) === EventType.CLICK ||
            eventInfoLib.getEventType(eventInfo) === EventType.CLICKMOD));
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXZlbnRjb250cmFjdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvcHJpbWl0aXZlcy9ldmVudC1kaXNwYXRjaC9zcmMvZXZlbnRjb250cmFjdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQXNCRztBQUVILE9BQU8sS0FBSyxZQUFZLE1BQU0sY0FBYyxDQUFDO0FBQzdDLE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUVqRCxPQUFPLEtBQUssUUFBUSxNQUFNLFNBQVMsQ0FBQztBQUVwQyxPQUFPLEVBQUMsa0JBQWtCLEVBQUUscUJBQXFCLEVBQUMsTUFBTSwwQkFBMEIsQ0FBQztBQUNuRixPQUFPLEtBQUssWUFBWSxNQUFNLGNBQWMsQ0FBQztBQUM3QyxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sY0FBYyxDQUFDO0FBK0J2Qzs7Ozs7Ozs7Ozs7OztHQWFHO0FBQ0gsTUFBTSxPQUFPLGFBQWE7YUFDakIsdUJBQWtCLEdBQUcsa0JBQWtCLEFBQXJCLENBQXNCO2FBQ3hDLDBCQUFxQixHQUFHLHFCQUFxQixBQUF4QixDQUF5QjtJQTJDckQsWUFBWSxnQkFBK0M7UUF2QzFDLG1CQUFjLEdBQUcsSUFBSSxjQUFjLENBQUM7WUFDbkQsMEJBQTBCLEVBQUUsYUFBYSxDQUFDLHFCQUFxQjtTQUNoRSxDQUFDLENBQUM7UUFFSDs7Ozs7O1dBTUc7UUFDSyxrQkFBYSxHQUFrQyxFQUFFLENBQUM7UUFFbEQsc0NBQWlDLEdBQThCLEVBQUUsQ0FBQztRQUUxRTs7Ozs7O1dBTUc7UUFDSyxlQUFVLEdBQXNCLElBQUksQ0FBQztRQUU3Qzs7O1dBR0c7UUFDSyxxQkFBZ0IsR0FBb0MsRUFBRSxDQUFDO1FBRS9ELDZDQUE2QztRQUNyQyx5QkFBb0IsR0FBRyxLQUFLLENBQUM7UUFTbkMsSUFBSSxD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LFlBQVksQ0FBQyxZQUFZLENBQUMsU0FBUyxDQUFDLEtBQUssU0FBUyxDQUFDLEtBQUs7WUFDdkQsWUFBWSxDQUFDLFlBQVksQ0FBQyxTQUFTLENBQUMsS0FBSyxTQUFTLENBQUMsUUFBUSxDQUFDLENBQy9ELENBQUM7QUFDSixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbi8qKlxuICogQGZpbGVvdmVydmlldyBJbXBsZW1lbnRzIHRoZSBsb2NhbCBldmVudCBoYW5kbGluZyBjb250cmFjdC4gVGhpc1xuICogYWxsb3dzIERPTSBvYmplY3RzIGluIGEgY29udGFpbmVyIHRoYXQgZW50ZXJzIGludG8gdGhpcyBjb250cmFjdCB0b1xuICogZGVmaW5lIGV2ZW50IGhhbmRsZXJzIHdoaWNoIGFyZSBleGVjdXRlZCBpbiBhIGxvY2FsIGNvbnRleHQuXG4gKlxuICogT25lIEV2ZW50Q29udHJhY3QgaW5zdGFuY2UgY2FuIG1hbmFnZSB0aGUgY29udHJhY3QgZm9yIG11bHRpcGxlXG4gKiBjb250YWluZXJzLCB3aGljaCBhcmUgYWRkZWQgdXNpbmcgdGhlIGFkZENvbnRhaW5lcigpIG1ldGhvZC5cbiAqXG4gKiBFdmVudHMgY2FuIGJlIHJlZ2lzdGVyZWQgdXNpbmcgdGhlIGFkZEV2ZW50KCkgbWV0aG9kLlxuICpcbiAqIEEgRGlzcGF0Y2hlciBpcyBhZGRlZCB1c2luZyB0aGUgcmVnaXN0ZXJEaXNwYXRjaGVyKCkgbWV0aG9kLiBVbnRpbCB0aGVyZSBpc1xuICogYSBkaXNwYXRjaGVyLCBldmVudHMgYXJlIHF1ZXVlZC4gVGhlIGlkZWEgaXMgdGhhdCB0aGUgRXZlbnRDb250cmFjdFxuICogY2xhc3MgaXMgaW5saW5lZCBpbiB0aGUgSFRNTCBvZiB0aGUgdG9wIGxldmVsIHBhZ2UgYW5kIGluc3RhbnRpYXRlZFxuICogcmlnaHQgYWZ0ZXIgdGhlIHN0YXJ0IG9mIDxib2R5Pi4gVGhlIERpc3BhdGNoZXIgY2xhc3MgaXMgY29udGFpbmVkXG4gKiBpbiB0aGUgZXh0ZXJuYWwgZGVmZXJyZWQganMsIGFuZCBpbnN0YW50aWF0ZWQgYW5kIHJlZ2lzdGVyZWQgd2l0aFxuICogRXZlbnRDb250cmFjdCB3aGVuIHRoZSBleHRlcm5hbCBqYXZhc2NyaXB0IGluIHRoZSBwYWdlIGxvYWRzLiBUaGVcbiAqIGV4dGVybmFsIGphdmFzY3JpcHQgd2lsbCBhbHNvIHJlZ2lzdGVyIHRoZSBqc2FjdGlvbiBoYW5kbGVycywgd2hpY2hcbiAqIHRoZW4gcGljayB1cCB0aGUgcXVldWVkIGV2ZW50cyBhdCB0aGUgdGltZSBvZiByZWdpc3RyYXRpb24uXG4gKlxuICogU2luY2UgdGhpcyBjbGFzcyBpcyBtZWFudCB0byBiZSBpbmxpbmVkIGluIHRoZSBtYWluIHBhZ2UgSFRNTCwgdGhlXG4gKiBzaXplIG9mIHRoZSBiaW5hcnkgY29tcGlsZWQgZnJvbSB0aGlzIGZpbGUgTVVTVCBiZSBrZXB0IGFzIHNtYWxsIGFzXG4gKiBwb3NzaWJsZSBhbmQgdGh1cyBpdHMgZGVwZW5kZW5jaWVzIHRvIGEgbWluaW11bS5cbiAqL1xuXG5pbXBvcnQgKiBhcyBhMTF5Q2xpY2tMaWIgZnJvbSAnLi9hMTF5X2NsaWNrJztcbmltcG9ydCB7QWN0aW9uUmVzb2x2ZXJ9IGZyb20gJy4vYWN0aW9uX3Jlc29sdmVyJztcbmltcG9ydCB7RWFybHlKc2FjdGlvbkRhdGEsIEVhcmx5SnNhY3Rpb25EYXRhQ29udGFpbmVyfSBmcm9tICcuL2Vhcmx5ZXZlbnRjb250cmFjdCc7XG5pbXBvcnQgKiBhcyBldmVudExpYiBmcm9tICcuL2V2ZW50JztcbmltcG9ydCB7RXZlbnRDb250cmFjdENvbnRhaW5lck1hbmFnZXJ9IGZyb20gJy4vZXZlbnRfY29udHJhY3RfY29udGFpbmVyJztcbmltcG9ydCB7QTExWV9DTElDS19TVVBQT1JULCBNT1VTRV9TUEVDSUFMX1NVUFBPUlR9IGZyb20gJy4vZXZlbnRfY29udHJhY3RfZGVmaW5lcyc7XG5pbXBvcnQgKiBhcyBldmVudEluZm9MaWIgZnJvbSAnLi9ldmVudF9pbmZvJztcbmltcG9ydCB7RXZlbnRUeXBlfSBmcm9tICcuL2V2ZW50X3R5cGUnO1xuaW1wb3J0IHtSZXN0cmljdGlvbn0gZnJvbSAnLi9yZXN0cmljdGlvbic7XG5cbi8qKlxuICogVGhlIEFQSSBvZiBhbiBFdmVudENvbnRyYWN0IHRoYXQgaXMgc2FmZSB0byBjYWxsIGZyb20gYW55IGNvbXBpbGF0aW9uIHVuaXQuXG4gKi9cbmV4cG9ydCBkZWNsYXJlIGludGVyZmFjZSBVbnJlbmFtZWRFdmVudENvbnRyYWN0IHtcbiAgLy8gQWxpYXMgZm9yIEpzY3Rpb24gRXZlbnRDb250cmFjdCByZWdpc3RlckRpc3BhdGNoZXIuXG4gIGVjcmQoZGlzcGF0Y2hlcjogRGlzcGF0Y2hlciwgcmVzdHJpY3Rpb246IFJlc3RyaWN0aW9uKTogdm9pZDtcbiAgLy8gVW5yZW5hbWVkIGZ1bmN0aW9uLiBBYmJyZXZpYXRpb24gZm9yIGBldmVudENvbnRyYWN0LmFkZEExMXlDbGlja1N1cHBvcnRgLlxuICBlY2FhY3M/OiAoXG4gICAgdXBkYXRlRXZlbnRJbmZvRm9yQTExeUNsaWNrOiB0eXBlb2YgYTExeUNsaWNrTGliLnVwZGF0ZUV2ZW50SW5mb0ZvckExMXlDbGljayxcbiAgICBwcmV2ZW50RGVmYXVsdEZvckExMXlDbGljazogdHlwZW9mIGExMXlDbGlja0xpYi5wcmV2ZW50RGVmYXVsdEZvckExMXlDbGljayxcbiAgICBwb3B1bGF0ZUNsaWNrT25seUFjdGlvbjogdHlwZW9mIGExMXlDbGlja0xpYi5wb3B1bGF0ZUNsaWNrT25seUFjdGlvbixcbiAgKSA9PiB2b2lkO1xufVxuXG4vKiogQSBmdW5jdGlvbiB0aGF0IGlzIGNhbGxlZCB0byBoYW5kbGUgZXZlbnRzIGNhcHR1cmVkIGJ5IHRoZSBFdmVudENvbnRyYWN0LiAqL1xuZXhwb3J0IHR5cGUgRGlzcGF0Y2hlciA9IChldmVudEluZm86IGV2ZW50SW5mb0xpYi5FdmVudEluZm8sIGdsb2JhbERpc3BhdGNoPzogYm9vbGVhbikgPT4gdm9pZDtcblxuLyoqXG4gKiBBIGZ1bmN0aW9uIHRoYXQgaGFuZGxlcyBhbiBldmVudCBkaXNwYXRjaGVkIGZyb20gdGhlIGJyb3dzZXIuXG4gKlxuICogZXZlbnRUeXBlOiBNYXkgZGlmZmVyIGZyb20gYGV2ZW50LnR5cGVgIGlmIEpTQWN0aW9uIHVzZXMgYVxuICogc2hvcnQtaGFuZCBuYW1lIG9yIGlzIHBhdGNoaW5nIG92ZXIgYW4gbm9uLWJ1YmJsaW5nIGV2ZW50IHdpdGggYSBidWJibGluZ1xuICogdmFyaWFudC5cbiAqIGV2ZW50OiBUaGUgbmF0aXZlIGJyb3dzZXIgZXZlbnQuXG4gKiBjb250YWluZXI6IFRoZSBjb250YWluZXIgZm9yIHRoaXMgZGlzcGF0Y2guXG4gKi9cbnR5cGUgRXZlbnRIYW5kbGVyID0gKGV2ZW50VHlwZTogc3RyaW5nLCBldmVudDogRXZlbnQsIGNvbnRhaW5lcjogRWxlbWVudCkgPT4gdm9pZDtcblxuLyoqXG4gKiBFdmVudENvbnRyYWN0IGludGVyY2VwdHMgZXZlbnRzIGluIHRoZSBidWJibGluZyBwaGFzZSBhdCB0aGVcbiAqIGJvdW5kYXJ5IG9mIGEgY29udGFpbmVyIGVsZW1lbnQsIGFuZCBtYXBzIHRoZW0gdG8gZ2VuZXJpYyBhY3Rpb25zXG4gKiB3aGljaCBhcmUgc3BlY2lmaWVkIHVzaW5nIHRoZSBjdXN0b20ganNhY3Rpb24gYXR0cmlidXRlIGluXG4gKiBIVE1MLiBCZWhhdmlvciBvZiB0aGUgYXBwbGljYXRpb24gaXMgdGhlbiBzcGVjaWZpZWQgaW4gdGVybXMgb2ZcbiAqIGhhbmRsZXIgZm9yIHN1Y2ggYWN0aW9ucywgY2YuIGpzYWN0aW9uLkRpc3BhdGNoZXIgaW4gZGlzcGF0Y2hlci5qcy5cbiAqXG4gKiBUaGlzIGhhcyBzZXZlcmFsIGJlbmVmaXRzOiAoMSkgTm8gRE9NIGV2ZW50IGhhbmRsZXJzIG5lZWQgdG8gYmVcbiAqIHJlZ2lzdGVyZWQgb24gdGhlIHNwZWNpZmljIGVsZW1lbnRzIGluIHRoZSBVSS4gKDIpIFRoZSBzZXQgb2ZcbiAqIGV2ZW50cyB0aGF0IHRoZSBhcHBsaWNhdGlvbiBoYXMgdG8gaGFuZGxlIGNhbiBiZSBzcGVjaWZpZWQgaW4gdGVybXNcbiAqIG9mIHRoZSBzZW1hbnRpY3Mgb2YgdGhlIGFwcGxpY2F0aW9uLCByYXRoZXIgdGhhbiBpbiB0ZXJtcyBvZiBET01cbiAqIGV2ZW50cy4gKDMpIEludm9jYXRpb24gb2YgaGFuZGxlcnMgY2FuIGJlIGRlbGF5ZWQgYW5kIGhhbmRsZXJzIGNhblxuICogYmUgZGVsYXkgbG9hZGVkIGluIGEgZ2VuZXJpYyB3YXkuXG4gKi9cbmV4cG9ydCBjbGFzcyBFdmVudENvbnRyYWN0IGltcGxlbWVudHMgVW5yZW5hbWVkRXZlbnRDb250cmFjdCB7XG4gIHN0YXRpYyBBMTFZX0NMSUNLX1NVUFBPUlQgPSBBMTFZX0NMSUNLX1NVUFBPUlQ7XG4gIHN0YXRpYyBNT1VTRV9TUEVDSUFMX1NVUFBPUlQgPSBNT1VTRV9TUEVDSUFMX1NVUFBPUlQ7XG5cbiAgcHJpdmF0ZSBjb250YWluZXJNYW5hZ2VyOiBFdmVudENvbnRyYWN0Q29udGFpbmVyTWFuYWdlciB8IG51bGw7XG5cbiAgcHJpdmF0ZSByZWFkb25seSBhY3Rpb25SZXNvbHZlciA9IG5ldyBBY3Rpb25SZXNvbHZlcih7XG4gICAgc3ludGhldGljTW91c2VFdmVudFN1cHBvcnQ6IEV2ZW50Q29udHJhY3QuTU9VU0VfU1BFQ0lBTF9TVVBQT1JULFxuICB9KTtcblxuICAvKipcbiAgICogVGhlIERPTSBldmVudHMgd2hpY2ggdGhpcyBjb250cmFjdCBjb3ZlcnMuIFVzZWQgdG8gcHJldmVudCBkb3VibGVcbiAgICogcmVnaXN0cmF0aW9uIG9mIGV2ZW50IHR5cGVzLiBUaGUgdmFsdWUgb2YgdGhlIG1hcCBpcyB0aGVcbiAgICogaW50ZXJuYWxseSBjcmVhdGVkIERPTSBldmVudCBoYW5kbGVyIGZ1bmN0aW9uIHRoYXQgaGFuZGxlcyB0aGVcbiAgICogRE9NIGV2ZW50cy4gU2VlIGFkZEV2ZW50KCkuXG4gICAqXG4gICAqL1xuICBwcml2YXRlIGV2ZW50SGFuZGxlcnM6IHtba2V5OiBzdHJpbmddOiBFdmVudEhhbmRsZXJ9ID0ge307XG5cbiAgcHJpdmF0ZSBicm93c2VyRXZlbnRUeXBlVG9FeHRyYUV2ZW50VHlwZXM6IHtba2V5OiBzdHJpbmddOiBzdHJpbmdbXX0gPSB7fTtcblxuICAvKipcbiAgICogVGhlIGRpc3BhdGNoZXIgZnVuY3Rpb24uIEV2ZW50cyBhcmUgcGFzc2VkIHRvIHRoaXMgZnVuY3Rpb24gZm9yXG4gICAqIGhhbmRsaW5nIG9uY2UgaXQgd2FzIHNldCB1c2luZyB0aGUgcmVnaXN0ZXJEaXNwYXRjaGVyKCkgbWV0aG9kLiBUaGlzIGlzXG4gICAqIGRvbmUgYmVjYXVzZSB0aGUgZnVuY3Rpb24gaXMgcGFzc2VkIGZyb20gYW5vdGhlciBqc2JpbmFyeSwgc28gcGFzc2luZyB0aGVcbiAgICogaW5zdGFuY2UgYW5kIGludm9raW5nIHRoZSBtZXRob2QgaGVyZSB3b3VsZCByZXF1aXJlIHRvIGxlYXZlIHRoZSBtZXRob2RcbiAgICogdW5vYmZ1c2NhdGVkLlxuICAgKi9cbiAgcHJpdmF0ZSBkaXNwYXRjaGVyOiBEaXNwYXRjaGVyIHwgbnVsbCA9IG51bGw7XG5cbiAgLyoqXG4gICAqIFRoZSBsaXN0IG9mIHN1c3BlbmRlZCBgRXZlbnRJbmZvYCB0aGF0IHdpbGwgYmUgZGlzcGF0Y2hlZFxuICAgKiBhcyBzb29uIGFzIHRoZSBgRGlzcGF0Y2hlcmAgaXMgcmVnaXN0ZXJlZC5cbiAgICovXG4gIHByaXZhdGUgcXVldWVkRXZlbnRJbmZvczogZXZlbnRJbmZvTGliLkV2ZW50SW5mb1tdIHwgbnVsbCA9IFtdO1xuXG4gIC8qKiBXaGV0aGVyIHRvIGFkZCBhbiBhMTF5IGNsaWNrIGxpc3RlbmVyLiAqL1xuICBwcml2YXRlIGFkZEExMXlDbGlja0xpc3RlbmVyID0gZmFsc2U7XG5cbiAgZWNhYWNzPzogKFxuICAgIHVwZGF0ZUV2ZW50SW5mb0ZvckExMXlDbGljazogdHlwZW9mIGExMXlDbGlja0xpYi51cGRhdGVFdmVudEluZm9Gb3JBMTF5Q2xpY2ssXG4gICAgcHJldmVudERlZmF1bHRGb3JBMTF5Q2xpY2s6IHR5cGVvZiBhMTF5Q2xpY2tMaWIucHJldmVudERlZmF1bHRGb3JBMTF5Q2xpY2ssXG4gICAgcG9wdWxhdGVDbGlja09ubHlBY3Rpb246IHR5cGVvZiBhMTF5Q2xpY2tMaWIucG9wdWxhdGVDbGlja09ubHlBY3Rpb24sXG4gICkgPT4gdm9pZDtcblxuICBjb25zdHJ1Y3Rvcihjb250YWluZXJNYW5hZ2VyOiBFdmVudENvbnRyYWN0Q29udGFpbmVyTWFuYWdlcikge1xuICAgIHRoaXMuY29udGFpbmVyTWFuYWdlciA9IGNvbnRhaW5lck1hbmFnZXI7XG4gICAgaWYgKEV2ZW50Q29udHJhY3QuQTExWV9DTElDS19TVVBQT1JUKSB7XG4gICAgICAvLyBBZGQgYTExeSBjbGljayBzdXBwb3J0IHRvIHRoZSBgRXZlbnRDb250cmFjdGAuXG4gICAgICB0aGlzLmFkZEExMXlDbGlja1N1cHBvcnQoKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGhhbmRsZUV2ZW50KGV2ZW50VHlwZTogc3RyaW5nLCBldmVudDogRXZlbnQsIGNvbnRhaW5lcjogRWxlbWVudCkge1xuICAgIGNvbnN0IGV2ZW50SW5mbyA9IGV2ZW50SW5mb0xpYi5jcmVhdGVFdmVudEluZm9Gcm9tUGFyYW1ldGVycyhcbiAgICAgIC8qIGV2ZW50VHlwZT0gKi8gZXZlbnRUeXBlLFxuICAgICAgLyogZXZlbnQ9ICovIGV2ZW50LFxuICAgICAgLyogdGFyZ2V0RWxlbWVudD0gKi8gZXZlbnQudGFyZ2V0IGFzIEVsZW1lbnQsXG4gICAgICAvKiBjb250YWluZXI9ICovIGNvbnRhaW5lcixcbiAgICAgIC8qIHRpbWVzdGFtcD0gKi8gRGF0ZS5ub3coKSxcbiAgICApO1xuICAgIHRoaXMuaGFuZGxlRXZlbnRJbmZvKGV2ZW50SW5mbyk7XG4gIH1cblxuICAvKipcbiAgICogSGFuZGxlIGFuIGBFdmVudEluZm9gLlxuICAgKi9cbiAgcHJpdmF0ZSBoYW5kbGVFdmVudEluZm8oZXZlbnRJbmZvOiBldmVudEluZm9MaWIuRXZlbnRJbmZvKSB7XG4gICAgaWYgKCF0aGlzLmRpc3BhdGNoZXIpIHtcbiAgICAgIC8vIEFsbCBldmVudHMgYXJlIHF1ZXVlZCB3aGVuIHRoZSBkaXNwYXRjaGVyIGlzbid0IHlldCBsb2FkZWQuXG4gICAgICBldmVudEluZm9MaWIuc2V0SXNSZXBsYXkoZXZlbnRJbmZvLCB0cnVlKTtcbiAgICAgIHRoaXMucXVldWVkRXZlbnRJbmZvcz8ucHVzaChldmVudEluZm8pO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLmFjdGlvblJlc29sdmVyLnJlc29sdmUoZXZlbnRJbmZvKTtcbiAgICBjb25zdCBhY3Rpb24gPSBldmVudEluZm9MaWIuZ2V0QWN0aW9uKGV2ZW50SW5mbyk7XG4gICAgaWYgKGFjdGlvbikge1xuICAgICAgaWYgKHNob3VsZFByZXZlbnREZWZhdWx0QmVmb3JlRGlzcGF0Y2hpbmcoZXZlbnRJbmZvTGliLmdldEFjdGlvbkVsZW1lbnQoYWN0aW9uKSwgZXZlbnRJbmZvKSkge1xuICAgICAgICBldmVudExpYi5wcmV2ZW50RGVmYXVsdChldmVudEluZm9MaWIuZ2V0RXZlbnQoZXZlbnRJbmZvKSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5kaXNwYXRjaGVyKGV2ZW50SW5mbyk7XG4gIH1cblxuICAvKipcbiAgICogRW5hYmxlcyBqc2FjdGlvbiBoYW5kbGVycyB0byBiZSBjYWxsZWQgZm9yIHRoZSBldmVudCB0eXBlIGdpdmVuIGJ5XG4gICAqIG5hbWUuXG4gICAqXG4gICAqIElmIHRoZSBldmVudCBpcyBhbHJlYWR5IHJlZ2lzdGVyZWQsIHRoaXMgZG9lcyBub3RoaW5nLlxuICAgKlxuICAgKiBAcGFyYW0gcHJlZml4ZWRFdmVudFR5cGUgSWYgc3VwcGxpZWQsIHRoaXMgZXZlbnQgaXMgdXNlZCBpblxuICAgKiAgICAgdGhlIGFjdHVhbCBicm93c2VyIGV2ZW50IHJlZ2lzdHJhdGlvbiBpbnN0ZWFkIG9mIHRoZSBuYW1lIHRoYXQgaXNcbiAgICogICAgIGV4cG9zZWQgdG8ganNhY3Rpb24uIFVzZSB0aGlzIGlmIHlvdSBlLmcuIHdhbnQgdXNlcnMgdG8gYmUgYWJsZVxuICAgKiAgICAgdG8gc3Vic2NyaWJlIHRvIGpzYWN0aW9uPVwidHJhbnNpdGlvbkVuZDpmb29cIiB3aGlsZSB0aGUgdW5kZXJseWluZ1xuICAgKiAgICAgZXZlbnQgaXMgd2Via2l0VHJhbnNpdGlvbkVuZCBpbiBvbmUgYnJvd3NlciBhbmQgbW96VHJhbnNpdGlvbkVuZFxuICAgKiAgICAgaW4gYW5vdGhlci5cbiAgICovXG4gIGFkZEV2ZW50KGV2ZW50VHlwZTogc3RyaW5nLCBwcmVmaXhlZEV2ZW50VHlwZT86IHN0cmluZykge1xuICAgIGlmIChldmVudFR5cGUgaW4gdGhpcy5ldmVudEhhbmRsZXJzIHx8ICF0aGlzLmNvbnRhaW5lck1hbmFnZXIpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoXG4gICAgICAhRXZlbnRDb250cmFjdC5NT1VTRV9TUEVDSUFMX1NVUFBPUlQgJiZcbiAgICAgIChldmVudFR5cGUgPT09IEV2ZW50VHlwZS5NT1VTRUVOVEVSIHx8XG4gICAgICAgIGV2ZW50VHlwZSA9PT0gRXZlbnRUeXBlLk1PVVNFTEVBVkUgfHxcbiAgICAgICAgZXZlbnRUeXBlID09PSBFdmVudFR5cGUuUE9JTlRFUkVOVEVSIHx8XG4gICAgICAgIGV2ZW50VHlwZSA9PT0gRXZlbnRUeXBlLlBPSU5URVJMRUFWRSlcbiAgICApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBldmVudEhhbmRsZXIgPSAoZXZlbnRUeXBlOiBzdHJpbmcsIGV2ZW50OiBFdmVudCwgY29udGFpbmVyOiBFbGVtZW50KSA9PiB7XG4gICAgICB0aGlzLmhhbmRsZUV2ZW50KGV2ZW50VHlwZSwgZXZlbnQsIGNvbnRhaW5lcik7XG4gICAgfTtcblxuICAgIC8vIFN0b3JlIHRoZSBjYWxsYmFjayB0byBhbGxvdyB1cyB0byByZXBsYXkgZXZlbnRzLlxuICAgIHRoaXMuZXZlbnRIYW5kbGVyc1tldmVudFR5cGVdID0gZXZlbnRIYW5kbGVyO1xuXG4gICAgY29uc3QgYnJvd3NlckV2ZW50VHlwZSA9IGV2ZW50TGliLmdldEJyb3dzZXJFdmVudFR5cGUocHJlZml4ZWRFdmVudFR5cGUgfHwgZXZlbnRUeXBlKTtcblxuICAgIGlmIChicm93c2VyRXZlbnRUeXBlICE9PSBldmVudFR5cGUpIHtcbiAgICAgIGNvbnN0IGV2ZW50VHlwZXMgPSB0aGlzLmJyb3dzZXJFdmVudFR5cGVUb0V4dHJhRXZlbnRUeXBlc1ticm93c2VyRXZlbnRUeXBlXSB8fCBbXTtcbiAgICAgIGV2ZW50VHlwZXMucHVzaChldmVudFR5cGUpO1xuICAgICAgdGhpcy5icm93c2VyRXZlbnRUeXBlVG9FeHRyYUV2ZW50VHlwZXNbYnJvd3NlckV2ZW50VHlwZV0gPSBldmVudFR5cGVzO1xuICAgIH1cblxuICAgIHRoaXMuY29udGFpbmVyTWFuYWdlci5hZGRFdmVudExpc3RlbmVyKGJyb3dzZXJFdmVudFR5cGUsIChlbGVtZW50OiBFbGVtZW50KSA9PiB7XG4gICAgICByZXR1cm4gKGV2ZW50OiBFdmVudCkgPT4ge1xuICAgICAgICBldmVudEhhbmRsZXIoZXZlbnRUeXBlLCBldmVudCwgZWxlbWVudCk7XG4gICAgICB9O1xuICAgIH0pO1xuXG4gICAgLy8gQXV0b21hdGljYWxseSBpbnN0YWxsIGEga2V5cHJlc3Mva2V5ZG93biBldmVudCBoYW5kbGVyIGlmIHN1cHBvcnQgZm9yXG4gICAgLy8gYWNjZXNzaWJsZSBjbGlja3MgaXMgdHVybmVkIG9uLlxuICAgIGlmICh0aGlzLmFkZEExMXlDbGlja0xpc3RlbmVyICYmIGV2ZW50VHlwZSA9PT0gRXZlbnRUeXBlLkNMSUNLKSB7XG4gICAgICB0aGlzLmFkZEV2ZW50KEV2ZW50VHlwZS5LRVlET1dOKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgcXVldWVkIGVhcmx5IGV2ZW50cyBhbmQgcmVwbGF5IHRoZW0gdXNpbmcgdGhlIGFwcHJvcHJpYXRlIGhhbmRsZXJcbiAgICogaW4gdGhlIHByb3ZpZGVkIGV2ZW50IGNvbnRyYWN0LiBPbmNlIGFsbCB0aGUgZXZlbnRzIGFyZSByZXBsYXllZCwgaXQgY2xlYW5zXG4gICAqIHVwIHRoZSBlYXJseSBjb250cmFjdC5cbiAgICovXG4gIHJlcGxheUVhcmx5RXZlbnRzKFxuICAgIGVhcmx5SnNhY3Rpb25Db250YWluZXI6IEVhcmx5SnNhY3Rpb25EYXRhQ29udGFpbmVyID0gd2luZG93IGFzIEVhcmx5SnNhY3Rpb25EYXRhQ29udGFpbmVyLFxuICApIHtcbiAgICAvLyBDaGVjayBpZiB0aGUgZWFybHkgY29udHJhY3QgaXMgcHJlc2VudCBhbmQgcHJldmVudCBjYWxsaW5nIHRoaXMgZnVuY3Rpb25cbiAgICAvLyBtb3JlIHRoYW4gb25jZS5cbiAgICBjb25zdCBlYXJseUpzYWN0aW9uRGF0YTogRWFybHlKc2FjdGlvbkRhdGEgfCB1bmRlZmluZWQgPSBlYXJseUpzYWN0aW9uQ29udGFpbmVyLl9lanNhO1xuICAgIGlmICghZWFybHlKc2FjdGlvbkRhdGEpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBSZXBsYXkgdGhlIGVhcmx5IGNvbnRyYWN0IGV2ZW50cy5cbiAgICBjb25zdCBlYXJseUV2ZW50SW5mb3M6IGV2ZW50SW5mb0xpYi5FdmVudEluZm9bXSA9IGVhcmx5SnNhY3Rpb25EYXRhLnE7XG4gICAgZm9yIChsZXQgaWR4ID0gMDsgaWR4IDwgZWFybHlFdmVudEluZm9zLmxlbmd0aDsgaWR4KyspIHtcbiAgICAgIGNvbnN0IGVhcmx5RXZlbnRJbmZvOiBldmVudEluZm9MaWIuRXZlbnRJbmZvID0gZWFybHlFdmVudEluZm9zW2lkeF07XG4gICAgICBjb25zdCBldmVudFR5cGVzID0gdGhpcy5nZXRFdmVudFR5cGVzRm9yQnJvd3NlckV2ZW50VHlwZShlYXJseUV2ZW50SW5mby5ldmVudFR5cGUpO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBldmVudFR5cGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IGV2ZW50SW5mbyA9IGV2ZW50SW5mb0xpYi5jbG9uZUV2ZW50SW5mbyhlYXJseUV2ZW50SW5mbyk7XG4gICAgICAgIC8vIEV2ZW50SW5mbyBldmVudFR5cGUgbWFwcyB0byBKU0FjdGlvbidzIGludGVybmFsIGV2ZW50IHR5cGUsXG4gICAgICAgIC8vIHJhdGhlciB0aGFuIHRoZSBicm93c2VyIGV2ZW50IHR5cGUuXG4gICAgICAgIGV2ZW50SW5mb0xpYi5zZXRFdmVudFR5cGUoZXZlbnRJbmZvLCBldmVudFR5cGVzW2ldKTtcbiAgICAgICAgdGhpcy5oYW5kbGVFdmVudEluZm8oZXZlbnRJbmZvKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBDbGVhbiB1cCB0aGUgZWFybHkgY29udHJhY3QuXG4gICAgY29uc3QgZWFybHlFdmVudEhhbmRsZXI6IChldmVudDogRXZlbnQpID0+IHZvaWQgPSBlYXJseUpzYWN0aW9uRGF0YS5oO1xuICAgIHJlbW92ZUV2ZW50TGlzdGVuZXJzKGVhcmx5SnNhY3Rpb25EYXRhLmMsIGVhcmx5SnNhY3Rpb25EYXRhLmV0LCBlYXJseUV2ZW50SGFuZGxlcik7XG4gICAgcmVtb3ZlRXZlbnRMaXN0ZW5lcnMoZWFybHlKc2FjdGlvbkRhdGEuYywgZWFybHlKc2FjdGlvbkRhdGEuZXRjLCBlYXJseUV2ZW50SGFuZGxlciwgdHJ1ZSk7XG4gICAgZGVsZXRlIGVhcmx5SnNhY3Rpb25Db250YWluZXIuX2Vqc2E7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhbGwgSlNBY3Rpb24gZXZlbnQgdHlwZXMgdGhhdCBoYXZlIGJlZW4gcmVnaXN0ZXJlZCBmb3IgYSBnaXZlblxuICAgKiBicm93c2VyIGV2ZW50IHR5cGUuXG4gICAqL1xuICBwcml2YXRlIGdldEV2ZW50VHlwZXNGb3JCcm93c2VyRXZlbnRUeXBlKGJyb3dzZXJFdmVudFR5cGU6IHN0cmluZykge1xuICAgIGNvbnN0IGV2ZW50VHlwZXMgPSBbXTtcbiAgICBpZiAodGhpcy5ldmVudEhhbmRsZXJzW2Jyb3dzZXJFdmVudFR5cGVdKSB7XG4gICAgICBldmVudFR5cGVzLnB1c2goYnJvd3NlckV2ZW50VHlwZSk7XG4gICAgfVxuICAgIGlmICh0aGlzLmJyb3dzZXJFdmVudFR5cGVUb0V4dHJhRXZlbnRUeXBlc1ticm93c2VyRXZlbnRUeXBlXSkge1xuICAgICAgZXZlbnRUeXBlcy5wdXNoKC4uLnRoaXMuYnJvd3NlckV2ZW50VHlwZVRvRXh0cmFFdmVudFR5cGVzW2Jyb3dzZXJFdmVudFR5cGVdKTtcbiAgICB9XG4gICAgcmV0dXJuIGV2ZW50VHlwZXM7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgZXZlbnQgaGFuZGxlciBmdW5jdGlvbiBmb3IgYSBnaXZlbiBldmVudCB0eXBlLlxuICAgKi9cbiAgaGFuZGxlcihldmVudFR5cGU6IHN0cmluZyk6IEV2ZW50SGFuZGxlciB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMuZXZlbnRIYW5kbGVyc1tldmVudFR5cGVdO1xuICB9XG5cbiAgLyoqXG4gICAqIENsZWFucyB1cCB0aGUgZXZlbnQgY29udHJhY3QuIFRoaXMgcmVzZXRzIGFsbCBvZiB0aGUgYEV2ZW50Q29udHJhY3RgJ3NcbiAgICogaW50ZXJuYWwgc3RhdGUuIFVzZXJzIGFyZSByZXNwb25zaWJsZSBmb3Igbm90IHVzaW5nIHRoaXMgYEV2ZW50Q29udHJhY3RgXG4gICAqIGFmdGVyIGl0IGhhcyBiZWVuIGNsZWFuZWQgdXAuXG4gICAqL1xuICBjbGVhblVwKCkge1xuICAgIHRoaXMuY29udGFpbmVyTWFuYWdlciEuY2xlYW5VcCgpO1xuICAgIHRoaXMuY29udGFpbmVyTWFuYWdlciA9IG51bGw7XG4gICAgdGhpcy5ldmVudEhhbmRsZXJzID0ge307XG4gICAgdGhpcy5icm93c2VyRXZlbnRUeXBlVG9FeHRyYUV2ZW50VHlwZXMgPSB7fTtcbiAgICB0aGlzLmRpc3BhdGNoZXIgPSBudWxsO1xuICAgIHRoaXMucXVldWVkRXZlbnRJbmZvcyA9IFtdO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlZ2lzdGVyIGEgZGlzcGF0Y2hlciBmdW5jdGlvbi4gRXZlbnQgaW5mbyBvZiBlYWNoIGV2ZW50IG1hcHBlZCB0b1xuICAgKiBhIGpzYWN0aW9uIGlzIHBhc3NlZCBmb3IgaGFuZGxpbmcgdG8gdGhpcyBjYWxsYmFjay4gVGhlIHF1ZXVlZFxuICAgKiBldmVudHMgYXJlIHBhc3NlZCBhcyB3ZWxsIHRvIHRoZSBkaXNwYXRjaGVyIGZvciBsYXRlciByZXBsYXlpbmdcbiAgICogb25jZSB0aGUgZGlzcGF0Y2hlciBpcyByZWdpc3RlcmVkLiBDbGVhcnMgdGhlIGV2ZW50IHF1ZXVlIHRvIG51bGwuXG4gICAqXG4gICAqIEBwYXJhbSBkaXNwYXRjaGVyIFRoZSBkaXNwYXRjaGVyIGZ1bmN0aW9uLlxuICAgKiBAcGFyYW0gcmVzdHJpY3Rpb25cbiAgICovXG4gIHJlZ2lzdGVyRGlzcGF0Y2hlcihkaXNwYXRjaGVyOiBEaXNwYXRjaGVyLCByZXN0cmljdGlvbjogUmVzdHJpY3Rpb24pIHtcbiAgICB0aGlzLmVjcmQoZGlzcGF0Y2hlciwgcmVzdHJpY3Rpb24pO1xuICB9XG5cbiAgLyoqXG4gICAqIFVucmVuYW1lZCBhbGlhcyBmb3IgcmVnaXN0ZXJEaXNwYXRjaGVyLiBOZWNlc3NhcnkgZm9yIGFueSBjb2RlYmFzZXMgdGhhdFxuICAgKiBzcGxpdCB0aGUgYEV2ZW50Q29udHJhY3RgIGFuZCBgRGlzcGF0Y2hlcmAgY29kZSBpbnRvIGRpZmZlcmVudCBjb21waWxhdGlvblxuICAgKiB1bml0cy5cbiAgICovXG4gIGVjcmQoZGlzcGF0Y2hlcjogRGlzcGF0Y2hlciwgcmVzdHJpY3Rpb246IFJlc3RyaWN0aW9uKSB7XG4gICAgdGhpcy5kaXNwYXRjaGVyID0gZGlzcGF0Y2hlcjtcblxuICAgIGlmICh0aGlzLnF1ZXVlZEV2ZW50SW5mb3M/Lmxlbmd0aCkge1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLnF1ZXVlZEV2ZW50SW5mb3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdGhpcy5oYW5kbGVFdmVudEluZm8odGhpcy5xdWV1ZWRFdmVudEluZm9zW2ldKTtcbiAgICAgIH1cbiAgICAgIHRoaXMucXVldWVkRXZlbnRJbmZvcyA9IG51bGw7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEFkZHMgYTExeSBjbGljayBzdXBwb3J0IHRvIHRoZSBnaXZlbiBgRXZlbnRDb250cmFjdGAuIE1lYW50IHRvIGJlIGNhbGxlZCBpblxuICAgKiB0aGUgc2FtZSBjb21waWxhdGlvbiB1bml0IGFzIHRoZSBgRXZlbnRDb250cmFjdGAuXG4gICAqL1xuICBhZGRBMTF5Q2xpY2tTdXBwb3J0KCkge1xuICAgIHRoaXMuYWRkQTExeUNsaWNrU3VwcG9ydEltcGwoXG4gICAgICBhMTF5Q2xpY2tMaWIudXBkYXRlRXZlbnRJbmZvRm9yQTExeUNsaWNrLFxuICAgICAgYTExeUNsaWNrTGliLnByZXZlbnREZWZhdWx0Rm9yQTExeUNsaWNrLFxuICAgICAgYTExeUNsaWNrTGliLnBvcHVsYXRlQ2xpY2tPbmx5QWN0aW9uLFxuICAgICk7XG4gIH1cblxuICAvKipcbiAgICogRW5hYmxlcyBhMTF5IGNsaWNrIHN1cHBvcnQgdG8gYmUgZGVmZXJyZWQuIE1lYW50IHRvIGJlIGNhbGxlZCBpbiB0aGUgc2FtZVxuICAgKiBjb21waWxhdGlvbiB1bml0IGFzIHRoZSBgRXZlbnRDb250cmFjdGAuXG4gICAqL1xuICBleHBvcnRBZGRBMTF5Q2xpY2tTdXBwb3J0KCkge1xuICAgIHRoaXMuYWRkQTExeUNsaWNrTGlzdGVuZXIgPSB0cnVlO1xuICAgIHRoaXMuZWNhYWNzID0gdGhpcy5hZGRBMTF5Q2xpY2tTdXBwb3J0SW1wbC5iaW5kKHRoaXMpO1xuICB9XG5cbiAgLyoqXG4gICAqIFVucmVuYW1lZCBmdW5jdGlvbiB0aGF0IGxvYWRzIGExMXlDbGlja1N1cHBvcnQuXG4gICAqL1xuICBwcml2YXRlIGFkZEExMXlDbGlja1N1cHBvcnRJbXBsKFxuICAgIHVwZGF0ZUV2ZW50SW5mb0ZvckExMXlDbGljazogdHlwZW9mIGExMXlDbGlja0xpYi51cGRhdGVFdmVudEluZm9Gb3JBMTF5Q2xpY2ssXG4gICAgcHJldmVudERlZmF1bHRGb3JBMTF5Q2xpY2s6IHR5cGVvZiBhMTF5Q2xpY2tMaWIucHJldmVudERlZmF1bHRGb3JBMTF5Q2xpY2ssXG4gICAgcG9wdWxhdGVDbGlja09ubHlBY3Rpb246IHR5cGVvZiBhMTF5Q2xpY2tMaWIucG9wdWxhdGVDbGlja09ubHlBY3Rpb24sXG4gICkge1xuICAgIHRoaXMuYWRkQTExeUNsaWNrTGlzdGVuZXIgPSB0cnVlO1xuICAgIHRoaXMuYWN0aW9uUmVzb2x2ZXIuYWRkQTExeUNsaWNrU3VwcG9ydChcbiAgICAgIHVwZGF0ZUV2ZW50SW5mb0ZvckExMXlDbGljayxcbiAgICAgIHByZXZlbnREZWZhdWx0Rm9yQTExeUNsaWNrLFxuICAgICAgcG9wdWxhdGVDbGlja09ubHlBY3Rpb24sXG4gICAgKTtcbiAgfVxufVxuXG5mdW5jdGlvbiByZW1vdmVFdmVudExpc3RlbmVycyhcbiAgY29udGFpbmVyOiBIVE1MRWxlbWVudCxcbiAgZXZlbnRUeXBlczogc3RyaW5nW10sXG4gIGVhcmx5RXZlbnRIYW5kbGVyOiAoZTogRXZlbnQpID0+IHZvaWQsXG4gIGNhcHR1cmU/OiBib29sZWFuLFxuKSB7XG4gIGZvciAobGV0IGlkeCA9IDA7IGlkeCA8IGV2ZW50VHlwZXMubGVuZ3RoOyBpZHgrKykge1xuICAgIGNvbnRhaW5lci5yZW1vdmVFdmVudExpc3RlbmVyKGV2ZW50VHlwZXNbaWR4XSwgZWFybHlFdmVudEhhbmRsZXIsIC8qIHVzZUNhcHR1cmUgKi8gY2FwdHVyZSk7XG4gIH1cbn1cblxuLyoqXG4gKiBBZGRzIGExMXkgY2xpY2sgc3VwcG9ydCB0byB0aGUgZ2l2ZW4gYEV2ZW50Q29udHJhY3RgLiBNZWFudCB0byBiZSBjYWxsZWRcbiAqIGluIGEgZGlmZmVyZW50IGNvbXBpbGF0aW9uIHVuaXQgZnJvbSB0aGUgYEV2ZW50Q29udHJhY3RgLiBUaGUgYEV2ZW50Q29udHJhY3RgXG4gKiBtdXN0IGhhdmUgY2FsbGVkIGBleHBvcnRBZGRBMTF5Q2xpY2tTdXBwb3J0YCBpbiBpdHMgY29tcGlsYXRpb24gdW5pdCBmb3IgdGhpc1xuICogdG8gaGF2ZSBhbnkgZWZmZWN0LlxuICovXG5leHBvcnQgZnVuY3Rpb24gYWRkRGVmZXJyZWRBMTF5Q2xpY2tTdXBwb3J0KGV2ZW50Q29udHJhY3Q6IEV2ZW50Q29udHJhY3QpIHtcbiAgZXZlbnRDb250cmFjdC5lY2FhY3M/LihcbiAgICBhMTF5Q2xpY2tMaWIudXBkYXRlRXZlbnRJbmZvRm9yQTExeUNsaWNrLFxuICAgIGExMXlDbGlja0xpYi5wcmV2ZW50RGVmYXVsdEZvckExMXlDbGljayxcbiAgICBhMTF5Q2xpY2tMaWIucG9wdWxhdGVDbGlja09ubHlBY3Rpb24sXG4gICk7XG59XG5cbi8qKlxuICogUmV0dXJucyB0cnVlIGlmIHRoZSBkZWZhdWx0IGFjdGlvbiBvZiB0aGlzIGV2ZW50IHNob3VsZCBiZSBwcmV2ZW50ZWQgYmVmb3JlXG4gKiB0aGlzIGV2ZW50IGlzIGRpc3BhdGNoZWQuXG4gKi9cbmZ1bmN0aW9uIHNob3VsZFByZXZlbnREZWZhdWx0QmVmb3JlRGlzcGF0Y2hpbmcoXG4gIGFjdGlvbkVsZW1lbnQ6IEVsZW1lbnQsXG4gIGV2ZW50SW5mbzogZXZlbnRJbmZvTGliLkV2ZW50SW5mbyxcbik6IGJvb2xlYW4ge1xuICAvLyBQcmV2ZW50IGJyb3dzZXIgZnJvbSBmb2xsb3dpbmcgPGE+IG5vZGUgbGlua3MgaWYgYSBqc2FjdGlvbiBpcyBwcmVzZW50XG4gIC8vIGFuZCB3ZSBhcmUgZGlzcGF0Y2hpbmcgdGhlIGFjdGlvbiBub3cuIE5vdGUgdGhhdCB0aGUgdGFyZ2V0RWxlbWVudCBtYXkgYmVcbiAgLy8gYSBjaGlsZCBvZiBhbiBhbmNob3IgdGhhdCBoYXMgYSBqc2FjdGlvbiBhdHRhY2hlZC4gRm9yIHRoYXQgcmVhc29uLCB3ZVxuICAvLyBuZWVkIHRvIGNoZWNrIHRoZSBhY3Rpb25FbGVtZW50IHJhdGhlciB0aGFuIHRoZSB0YXJnZXRFbGVtZW50LlxuICByZXR1cm4gKFxuICAgIGFjdGlvbkVsZW1lbnQudGFnTmFtZSA9PT0gJ0EnICYmXG4gICAgKGV2ZW50SW5mb0xpYi5nZXRFdmVudFR5cGUoZXZlbnRJbmZvKSA9PT0gRXZlbnRUeXBlLkNMSUNLIHx8XG4gICAgICBldmVudEluZm9MaWIuZ2V0RXZlbnRUeXBlKGV2ZW50SW5mbykgPT09IEV2ZW50VHlwZS5DTElDS01PRClcbiAgKTtcbn1cbiJdfQ==