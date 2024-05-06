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
import { A11Y_CLICK_SUPPORT, CUSTOM_EVENT_SUPPORT, JSNAMESPACE_SUPPORT, MOUSE_SPECIAL_SUPPORT, } from './event_contract_defines';
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
    static { this.CUSTOM_EVENT_SUPPORT = CUSTOM_EVENT_SUPPORT; }
    static { this.A11Y_CLICK_SUPPORT = A11Y_CLICK_SUPPORT; }
    static { this.MOUSE_SPECIAL_SUPPORT = MOUSE_SPECIAL_SUPPORT; }
    static { this.JSNAMESPACE_SUPPORT = JSNAMESPACE_SUPPORT; }
    constructor(containerManager) {
        this.actionResolver = new ActionResolver({
            customEventSupport: EventContract.CUSTOM_EVENT_SUPPORT,
            jsnamespaceSupport: EventContract.JSNAMESPACE_SUPPORT,
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
        if (EventContract.CUSTOM_EVENT_SUPPORT) {
            this.addEvent(EventType.CUSTOM);
        }
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
        }
        this.actionResolver.resolve(eventInfo);
        if (!this.dispatcher) {
            return;
        }
        const globalEventInfo = eventInfoLib.cloneEventInfo(eventInfo);
        // In some cases, `populateAction` will rewrite `click` events to
        // `clickonly`. Revert back to a regular click, otherwise we won't be able
        // to execute global event handlers registered on click events.
        if (eventInfoLib.getEventType(globalEventInfo) === EventType.CLICKONLY) {
            eventInfoLib.setEventType(globalEventInfo, EventType.CLICK);
        }
        this.dispatcher(globalEventInfo, /* dispatch global event */ true);
        const action = eventInfoLib.getAction(eventInfo);
        if (!action) {
            return;
        }
        if (shouldPreventDefaultBeforeDispatching(eventInfoLib.getActionElement(action), eventInfo)) {
            eventLib.preventDefault(eventInfoLib.getEvent(eventInfo));
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXZlbnRjb250cmFjdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvcHJpbWl0aXZlcy9ldmVudC1kaXNwYXRjaC9zcmMvZXZlbnRjb250cmFjdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQXNCRztBQUVILE9BQU8sS0FBSyxZQUFZLE1BQU0sY0FBYyxDQUFDO0FBQzdDLE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUVqRCxPQUFPLEtBQUssUUFBUSxNQUFNLFNBQVMsQ0FBQztBQUVwQyxPQUFPLEVBQ0wsa0JBQWtCLEVBQ2xCLG9CQUFvQixFQUNwQixtQkFBbUIsRUFDbkIscUJBQXFCLEdBQ3RCLE1BQU0sMEJBQTBCLENBQUM7QUFDbEMsT0FBTyxLQUFLLFlBQVksTUFBTSxjQUFjLENBQUM7QUFDN0MsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLGNBQWMsQ0FBQztBQStCdkM7Ozs7Ozs7Ozs7Ozs7R0FhRztBQUNILE1BQU0sT0FBTyxhQUFhO2FBQ2pCLHlCQUFvQixHQUFHLG9CQUFvQixBQUF2QixDQUF3QjthQUM1Qyx1QkFBa0IsR0FBRyxrQkFBa0IsQUFBckIsQ0FBc0I7YUFDeEMsMEJBQXFCLEdBQUcscUJBQXFCLEFBQXhCLENBQXlCO2FBQzlDLHdCQUFtQixHQUFHLG1CQUFtQixBQUF0QixDQUF1QjtJQTZDakQsWUFBWSxnQkFBK0M7UUF6QzFDLG1CQUFjLEdBQUcsSUFBSSxjQUFjLENBQUM7WUFDbkQsa0JBQWtCLEVBQUUsYUFBYSxDQUFDLG9CQUFvQjtZQUN0RCxrQkFBa0IsRUFBRSxhQUFhLENBQUMsbUJBQW1CO1lBQ3JELDBCQUEwQixFQUFFLGFBQWEsQ0FBQyxxQkFBcUI7U0FDaEUsQ0FBQyxDQUFDO1FBRUg7Ozs7OztXQU1HO1FBQ0ssa0JBQWEsR0FBa0MsRUFB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QUEyQixFQUMzQiwwQkFBMEIsRUFDMUIsdUJBQXVCLENBQ3hCLENBQUM7SUFDSixDQUFDOztBQUdILFNBQVMsb0JBQW9CLENBQzNCLFNBQXNCLEVBQ3RCLFVBQW9CLEVBQ3BCLGlCQUFxQyxFQUNyQyxPQUFpQjtJQUVqQixLQUFLLElBQUksR0FBRyxHQUFHLENBQUMsRUFBRSxHQUFHLEdBQUcsVUFBVSxDQUFDLE1BQU0sRUFBRSxHQUFHLEVBQUUsRUFBRSxDQUFDO1FBQ2pELFNBQVMsQ0FBQyxtQkFBbUIsQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLEVBQUUsaUJBQWlCLEVBQUUsZ0JBQWdCLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDOUYsQ0FBQztBQUNILENBQUM7QUFFRDs7Ozs7R0FLRztBQUNILE1BQU0sVUFBVSwyQkFBMkIsQ0FBQyxhQUE0QjtJQUN0RSxhQUFhLENBQUMsTUFBTSxFQUFFLENBQ3BCLFlBQVksQ0FBQywyQkFBMkIsRUFDeEMsWUFBWSxDQUFDLDBCQUEwQixFQUN2QyxZQUFZLENBQUMsdUJBQXVCLENBQ3JDLENBQUM7QUFDSixDQUFDO0FBRUQ7OztHQUdHO0FBQ0gsU0FBUyxxQ0FBcUMsQ0FDNUMsYUFBc0IsRUFDdEIsU0FBaUM7SUFFakMseUVBQXlFO0lBQ3pFLDRFQUE0RTtJQUM1RSx5RUFBeUU7SUFDekUsaUVBQWlFO0lBQ2pFLE9BQU8sQ0FDTCxhQUFhLENBQUMsT0FBTyxLQUFLLEdBQUc7UUFDN0IsQ0FBQyxZQUFZLENBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBQyxLQUFLLFNBQVMsQ0FBQyxLQUFLO1lBQ3ZELFlBQVksQ0FBQyxZQUFZLENBQUMsU0FBUyxDQUFDLEtBQUssU0FBUyxDQUFDLFFBQVEsQ0FBQyxDQUMvRCxDQUFDO0FBQ0osQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgSW1wbGVtZW50cyB0aGUgbG9jYWwgZXZlbnQgaGFuZGxpbmcgY29udHJhY3QuIFRoaXNcbiAqIGFsbG93cyBET00gb2JqZWN0cyBpbiBhIGNvbnRhaW5lciB0aGF0IGVudGVycyBpbnRvIHRoaXMgY29udHJhY3QgdG9cbiAqIGRlZmluZSBldmVudCBoYW5kbGVycyB3aGljaCBhcmUgZXhlY3V0ZWQgaW4gYSBsb2NhbCBjb250ZXh0LlxuICpcbiAqIE9uZSBFdmVudENvbnRyYWN0IGluc3RhbmNlIGNhbiBtYW5hZ2UgdGhlIGNvbnRyYWN0IGZvciBtdWx0aXBsZVxuICogY29udGFpbmVycywgd2hpY2ggYXJlIGFkZGVkIHVzaW5nIHRoZSBhZGRDb250YWluZXIoKSBtZXRob2QuXG4gKlxuICogRXZlbnRzIGNhbiBiZSByZWdpc3RlcmVkIHVzaW5nIHRoZSBhZGRFdmVudCgpIG1ldGhvZC5cbiAqXG4gKiBBIERpc3BhdGNoZXIgaXMgYWRkZWQgdXNpbmcgdGhlIHJlZ2lzdGVyRGlzcGF0Y2hlcigpIG1ldGhvZC4gVW50aWwgdGhlcmUgaXNcbiAqIGEgZGlzcGF0Y2hlciwgZXZlbnRzIGFyZSBxdWV1ZWQuIFRoZSBpZGVhIGlzIHRoYXQgdGhlIEV2ZW50Q29udHJhY3RcbiAqIGNsYXNzIGlzIGlubGluZWQgaW4gdGhlIEhUTUwgb2YgdGhlIHRvcCBsZXZlbCBwYWdlIGFuZCBpbnN0YW50aWF0ZWRcbiAqIHJpZ2h0IGFmdGVyIHRoZSBzdGFydCBvZiA8Ym9keT4uIFRoZSBEaXNwYXRjaGVyIGNsYXNzIGlzIGNvbnRhaW5lZFxuICogaW4gdGhlIGV4dGVybmFsIGRlZmVycmVkIGpzLCBhbmQgaW5zdGFudGlhdGVkIGFuZCByZWdpc3RlcmVkIHdpdGhcbiAqIEV2ZW50Q29udHJhY3Qgd2hlbiB0aGUgZXh0ZXJuYWwgamF2YXNjcmlwdCBpbiB0aGUgcGFnZSBsb2Fkcy4gVGhlXG4gKiBleHRlcm5hbCBqYXZhc2NyaXB0IHdpbGwgYWxzbyByZWdpc3RlciB0aGUganNhY3Rpb24gaGFuZGxlcnMsIHdoaWNoXG4gKiB0aGVuIHBpY2sgdXAgdGhlIHF1ZXVlZCBldmVudHMgYXQgdGhlIHRpbWUgb2YgcmVnaXN0cmF0aW9uLlxuICpcbiAqIFNpbmNlIHRoaXMgY2xhc3MgaXMgbWVhbnQgdG8gYmUgaW5saW5lZCBpbiB0aGUgbWFpbiBwYWdlIEhUTUwsIHRoZVxuICogc2l6ZSBvZiB0aGUgYmluYXJ5IGNvbXBpbGVkIGZyb20gdGhpcyBmaWxlIE1VU1QgYmUga2VwdCBhcyBzbWFsbCBhc1xuICogcG9zc2libGUgYW5kIHRodXMgaXRzIGRlcGVuZGVuY2llcyB0byBhIG1pbmltdW0uXG4gKi9cblxuaW1wb3J0ICogYXMgYTExeUNsaWNrTGliIGZyb20gJy4vYTExeV9jbGljayc7XG5pbXBvcnQge0FjdGlvblJlc29sdmVyfSBmcm9tICcuL2FjdGlvbl9yZXNvbHZlcic7XG5pbXBvcnQge0Vhcmx5SnNhY3Rpb25EYXRhLCBFYXJseUpzYWN0aW9uRGF0YUNvbnRhaW5lcn0gZnJvbSAnLi9lYXJseWV2ZW50Y29udHJhY3QnO1xuaW1wb3J0ICogYXMgZXZlbnRMaWIgZnJvbSAnLi9ldmVudCc7XG5pbXBvcnQge0V2ZW50Q29udHJhY3RDb250YWluZXJNYW5hZ2VyfSBmcm9tICcuL2V2ZW50X2NvbnRyYWN0X2NvbnRhaW5lcic7XG5pbXBvcnQge1xuICBBMTFZX0NMSUNLX1NVUFBPUlQsXG4gIENVU1RPTV9FVkVOVF9TVVBQT1JULFxuICBKU05BTUVTUEFDRV9TVVBQT1JULFxuICBNT1VTRV9TUEVDSUFMX1NVUFBPUlQsXG59IGZyb20gJy4vZXZlbnRfY29udHJhY3RfZGVmaW5lcyc7XG5pbXBvcnQgKiBhcyBldmVudEluZm9MaWIgZnJvbSAnLi9ldmVudF9pbmZvJztcbmltcG9ydCB7RXZlbnRUeXBlfSBmcm9tICcuL2V2ZW50X3R5cGUnO1xuaW1wb3J0IHtSZXN0cmljdGlvbn0gZnJvbSAnLi9yZXN0cmljdGlvbic7XG5cbi8qKlxuICogVGhlIEFQSSBvZiBhbiBFdmVudENvbnRyYWN0IHRoYXQgaXMgc2FmZSB0byBjYWxsIGZyb20gYW55IGNvbXBpbGF0aW9uIHVuaXQuXG4gKi9cbmV4cG9ydCBkZWNsYXJlIGludGVyZmFjZSBVbnJlbmFtZWRFdmVudENvbnRyYWN0IHtcbiAgLy8gQWxpYXMgZm9yIEpzY3Rpb24gRXZlbnRDb250cmFjdCByZWdpc3RlckRpc3BhdGNoZXIuXG4gIGVjcmQoZGlzcGF0Y2hlcjogRGlzcGF0Y2hlciwgcmVzdHJpY3Rpb246IFJlc3RyaWN0aW9uKTogdm9pZDtcbiAgLy8gVW5yZW5hbWVkIGZ1bmN0aW9uLiBBYmJyZXZpYXRpb24gZm9yIGBldmVudENvbnRyYWN0LmFkZEExMXlDbGlja1N1cHBvcnRgLlxuICBlY2FhY3M/OiAoXG4gICAgdXBkYXRlRXZlbnRJbmZvRm9yQTExeUNsaWNrOiB0eXBlb2YgYTExeUNsaWNrTGliLnVwZGF0ZUV2ZW50SW5mb0ZvckExMXlDbGljayxcbiAgICBwcmV2ZW50RGVmYXVsdEZvckExMXlDbGljazogdHlwZW9mIGExMXlDbGlja0xpYi5wcmV2ZW50RGVmYXVsdEZvckExMXlDbGljayxcbiAgICBwb3B1bGF0ZUNsaWNrT25seUFjdGlvbjogdHlwZW9mIGExMXlDbGlja0xpYi5wb3B1bGF0ZUNsaWNrT25seUFjdGlvbixcbiAgKSA9PiB2b2lkO1xufVxuXG4vKiogQSBmdW5jdGlvbiB0aGF0IGlzIGNhbGxlZCB0byBoYW5kbGUgZXZlbnRzIGNhcHR1cmVkIGJ5IHRoZSBFdmVudENvbnRyYWN0LiAqL1xuZXhwb3J0IHR5cGUgRGlzcGF0Y2hlciA9IChldmVudEluZm86IGV2ZW50SW5mb0xpYi5FdmVudEluZm8sIGdsb2JhbERpc3BhdGNoPzogYm9vbGVhbikgPT4gdm9pZDtcblxuLyoqXG4gKiBBIGZ1bmN0aW9uIHRoYXQgaGFuZGxlcyBhbiBldmVudCBkaXNwYXRjaGVkIGZyb20gdGhlIGJyb3dzZXIuXG4gKlxuICogZXZlbnRUeXBlOiBNYXkgZGlmZmVyIGZyb20gYGV2ZW50LnR5cGVgIGlmIEpTQWN0aW9uIHVzZXMgYVxuICogc2hvcnQtaGFuZCBuYW1lIG9yIGlzIHBhdGNoaW5nIG92ZXIgYW4gbm9uLWJ1YmJsaW5nIGV2ZW50IHdpdGggYSBidWJibGluZ1xuICogdmFyaWFudC5cbiAqIGV2ZW50OiBUaGUgbmF0aXZlIGJyb3dzZXIgZXZlbnQuXG4gKiBjb250YWluZXI6IFRoZSBjb250YWluZXIgZm9yIHRoaXMgZGlzcGF0Y2guXG4gKi9cbnR5cGUgRXZlbnRIYW5kbGVyID0gKGV2ZW50VHlwZTogc3RyaW5nLCBldmVudDogRXZlbnQsIGNvbnRhaW5lcjogRWxlbWVudCkgPT4gdm9pZDtcblxuLyoqXG4gKiBFdmVudENvbnRyYWN0IGludGVyY2VwdHMgZXZlbnRzIGluIHRoZSBidWJibGluZyBwaGFzZSBhdCB0aGVcbiAqIGJvdW5kYXJ5IG9mIGEgY29udGFpbmVyIGVsZW1lbnQsIGFuZCBtYXBzIHRoZW0gdG8gZ2VuZXJpYyBhY3Rpb25zXG4gKiB3aGljaCBhcmUgc3BlY2lmaWVkIHVzaW5nIHRoZSBjdXN0b20ganNhY3Rpb24gYXR0cmlidXRlIGluXG4gKiBIVE1MLiBCZWhhdmlvciBvZiB0aGUgYXBwbGljYXRpb24gaXMgdGhlbiBzcGVjaWZpZWQgaW4gdGVybXMgb2ZcbiAqIGhhbmRsZXIgZm9yIHN1Y2ggYWN0aW9ucywgY2YuIGpzYWN0aW9uLkRpc3BhdGNoZXIgaW4gZGlzcGF0Y2hlci5qcy5cbiAqXG4gKiBUaGlzIGhhcyBzZXZlcmFsIGJlbmVmaXRzOiAoMSkgTm8gRE9NIGV2ZW50IGhhbmRsZXJzIG5lZWQgdG8gYmVcbiAqIHJlZ2lzdGVyZWQgb24gdGhlIHNwZWNpZmljIGVsZW1lbnRzIGluIHRoZSBVSS4gKDIpIFRoZSBzZXQgb2ZcbiAqIGV2ZW50cyB0aGF0IHRoZSBhcHBsaWNhdGlvbiBoYXMgdG8gaGFuZGxlIGNhbiBiZSBzcGVjaWZpZWQgaW4gdGVybXNcbiAqIG9mIHRoZSBzZW1hbnRpY3Mgb2YgdGhlIGFwcGxpY2F0aW9uLCByYXRoZXIgdGhhbiBpbiB0ZXJtcyBvZiBET01cbiAqIGV2ZW50cy4gKDMpIEludm9jYXRpb24gb2YgaGFuZGxlcnMgY2FuIGJlIGRlbGF5ZWQgYW5kIGhhbmRsZXJzIGNhblxuICogYmUgZGVsYXkgbG9hZGVkIGluIGEgZ2VuZXJpYyB3YXkuXG4gKi9cbmV4cG9ydCBjbGFzcyBFdmVudENvbnRyYWN0IGltcGxlbWVudHMgVW5yZW5hbWVkRXZlbnRDb250cmFjdCB7XG4gIHN0YXRpYyBDVVNUT01fRVZFTlRfU1VQUE9SVCA9IENVU1RPTV9FVkVOVF9TVVBQT1JUO1xuICBzdGF0aWMgQTExWV9DTElDS19TVVBQT1JUID0gQTExWV9DTElDS19TVVBQT1JUO1xuICBzdGF0aWMgTU9VU0VfU1BFQ0lBTF9TVVBQT1JUID0gTU9VU0VfU1BFQ0lBTF9TVVBQT1JUO1xuICBzdGF0aWMgSlNOQU1FU1BBQ0VfU1VQUE9SVCA9IEpTTkFNRVNQQUNFX1NVUFBPUlQ7XG5cbiAgcHJpdmF0ZSBjb250YWluZXJNYW5hZ2VyOiBFdmVudENvbnRyYWN0Q29udGFpbmVyTWFuYWdlciB8IG51bGw7XG5cbiAgcHJpdmF0ZSByZWFkb25seSBhY3Rpb25SZXNvbHZlciA9IG5ldyBBY3Rpb25SZXNvbHZlcih7XG4gICAgY3VzdG9tRXZlbnRTdXBwb3J0OiBFdmVudENvbnRyYWN0LkNVU1RPTV9FVkVOVF9TVVBQT1JULFxuICAgIGpzbmFtZXNwYWNlU3VwcG9ydDogRXZlbnRDb250cmFjdC5KU05BTUVTUEFDRV9TVVBQT1JULFxuICAgIHN5bnRoZXRpY01vdXNlRXZlbnRTdXBwb3J0OiBFdmVudENvbnRyYWN0Lk1PVVNFX1NQRUNJQUxfU1VQUE9SVCxcbiAgfSk7XG5cbiAgLyoqXG4gICAqIFRoZSBET00gZXZlbnRzIHdoaWNoIHRoaXMgY29udHJhY3QgY292ZXJzLiBVc2VkIHRvIHByZXZlbnQgZG91YmxlXG4gICAqIHJlZ2lzdHJhdGlvbiBvZiBldmVudCB0eXBlcy4gVGhlIHZhbHVlIG9mIHRoZSBtYXAgaXMgdGhlXG4gICAqIGludGVybmFsbHkgY3JlYXRlZCBET00gZXZlbnQgaGFuZGxlciBmdW5jdGlvbiB0aGF0IGhhbmRsZXMgdGhlXG4gICAqIERPTSBldmVudHMuIFNlZSBhZGRFdmVudCgpLlxuICAgKlxuICAgKi9cbiAgcHJpdmF0ZSBldmVudEhhbmRsZXJzOiB7W2tleTogc3RyaW5nXTogRXZlbnRIYW5kbGVyfSA9IHt9O1xuXG4gIHByaXZhdGUgYnJvd3NlckV2ZW50VHlwZVRvRXh0cmFFdmVudFR5cGVzOiB7W2tleTogc3RyaW5nXTogc3RyaW5nW119ID0ge307XG5cbiAgLyoqXG4gICAqIFRoZSBkaXNwYXRjaGVyIGZ1bmN0aW9uLiBFdmVudHMgYXJlIHBhc3NlZCB0byB0aGlzIGZ1bmN0aW9uIGZvclxuICAgKiBoYW5kbGluZyBvbmNlIGl0IHdhcyBzZXQgdXNpbmcgdGhlIHJlZ2lzdGVyRGlzcGF0Y2hlcigpIG1ldGhvZC4gVGhpcyBpc1xuICAgKiBkb25lIGJlY2F1c2UgdGhlIGZ1bmN0aW9uIGlzIHBhc3NlZCBmcm9tIGFub3RoZXIganNiaW5hcnksIHNvIHBhc3NpbmcgdGhlXG4gICAqIGluc3RhbmNlIGFuZCBpbnZva2luZyB0aGUgbWV0aG9kIGhlcmUgd291bGQgcmVxdWlyZSB0byBsZWF2ZSB0aGUgbWV0aG9kXG4gICAqIHVub2JmdXNjYXRlZC5cbiAgICovXG4gIHByaXZhdGUgZGlzcGF0Y2hlcjogRGlzcGF0Y2hlciB8IG51bGwgPSBudWxsO1xuXG4gIC8qKlxuICAgKiBUaGUgbGlzdCBvZiBzdXNwZW5kZWQgYEV2ZW50SW5mb2AgdGhhdCB3aWxsIGJlIGRpc3BhdGNoZWRcbiAgICogYXMgc29vbiBhcyB0aGUgYERpc3BhdGNoZXJgIGlzIHJlZ2lzdGVyZWQuXG4gICAqL1xuICBwcml2YXRlIHF1ZXVlZEV2ZW50SW5mb3M6IGV2ZW50SW5mb0xpYi5FdmVudEluZm9bXSB8IG51bGwgPSBbXTtcblxuICAvKiogV2hldGhlciB0byBhZGQgYW4gYTExeSBjbGljayBsaXN0ZW5lci4gKi9cbiAgcHJpdmF0ZSBhZGRBMTF5Q2xpY2tMaXN0ZW5lciA9IGZhbHNlO1xuXG4gIGVjYWFjcz86IChcbiAgICB1cGRhdGVFdmVudEluZm9Gb3JBMTF5Q2xpY2s6IHR5cGVvZiBhMTF5Q2xpY2tMaWIudXBkYXRlRXZlbnRJbmZvRm9yQTExeUNsaWNrLFxuICAgIHByZXZlbnREZWZhdWx0Rm9yQTExeUNsaWNrOiB0eXBlb2YgYTExeUNsaWNrTGliLnByZXZlbnREZWZhdWx0Rm9yQTExeUNsaWNrLFxuICAgIHBvcHVsYXRlQ2xpY2tPbmx5QWN0aW9uOiB0eXBlb2YgYTExeUNsaWNrTGliLnBvcHVsYXRlQ2xpY2tPbmx5QWN0aW9uLFxuICApID0+IHZvaWQ7XG5cbiAgY29uc3RydWN0b3IoY29udGFpbmVyTWFuYWdlcjogRXZlbnRDb250cmFjdENvbnRhaW5lck1hbmFnZXIpIHtcbiAgICB0aGlzLmNvbnRhaW5lck1hbmFnZXIgPSBjb250YWluZXJNYW5hZ2VyO1xuICAgIGlmIChFdmVudENvbnRyYWN0LkNVU1RPTV9FVkVOVF9TVVBQT1JUKSB7XG4gICAgICB0aGlzLmFkZEV2ZW50KEV2ZW50VHlwZS5DVVNUT00pO1xuICAgIH1cbiAgICBpZiAoRXZlbnRDb250cmFjdC5BMTFZX0NMSUNLX1NVUFBPUlQpIHtcbiAgICAgIC8vIEFkZCBhMTF5IGNsaWNrIHN1cHBvcnQgdG8gdGhlIGBFdmVudENvbnRyYWN0YC5cbiAgICAgIHRoaXMuYWRkQTExeUNsaWNrU3VwcG9ydCgpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgaGFuZGxlRXZlbnQoZXZlbnRUeXBlOiBzdHJpbmcsIGV2ZW50OiBFdmVudCwgY29udGFpbmVyOiBFbGVtZW50KSB7XG4gICAgY29uc3QgZXZlbnRJbmZvID0gZXZlbnRJbmZvTGliLmNyZWF0ZUV2ZW50SW5mb0Zyb21QYXJhbWV0ZXJzKFxuICAgICAgLyogZXZlbnRUeXBlPSAqLyBldmVudFR5cGUsXG4gICAgICAvKiBldmVudD0gKi8gZXZlbnQsXG4gICAgICAvKiB0YXJnZXRFbGVtZW50PSAqLyBldmVudC50YXJnZXQgYXMgRWxlbWVudCxcbiAgICAgIC8qIGNvbnRhaW5lcj0gKi8gY29udGFpbmVyLFxuICAgICAgLyogdGltZXN0YW1wPSAqLyBEYXRlLm5vdygpLFxuICAgICk7XG4gICAgdGhpcy5oYW5kbGVFdmVudEluZm8oZXZlbnRJbmZvKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBIYW5kbGUgYW4gYEV2ZW50SW5mb2AuXG4gICAqL1xuICBwcml2YXRlIGhhbmRsZUV2ZW50SW5mbyhldmVudEluZm86IGV2ZW50SW5mb0xpYi5FdmVudEluZm8pIHtcbiAgICBpZiAoIXRoaXMuZGlzcGF0Y2hlcikge1xuICAgICAgLy8gQWxsIGV2ZW50cyBhcmUgcXVldWVkIHdoZW4gdGhlIGRpc3BhdGNoZXIgaXNuJ3QgeWV0IGxvYWRlZC5cbiAgICAgIGV2ZW50SW5mb0xpYi5zZXRJc1JlcGxheShldmVudEluZm8sIHRydWUpO1xuICAgICAgdGhpcy5xdWV1ZWRFdmVudEluZm9zPy5wdXNoKGV2ZW50SW5mbyk7XG4gICAgfVxuICAgIHRoaXMuYWN0aW9uUmVzb2x2ZXIucmVzb2x2ZShldmVudEluZm8pO1xuXG4gICAgaWYgKCF0aGlzLmRpc3BhdGNoZXIpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgZ2xvYmFsRXZlbnRJbmZvOiBldmVudEluZm9MaWIuRXZlbnRJbmZvID0gZXZlbnRJbmZvTGliLmNsb25lRXZlbnRJbmZvKGV2ZW50SW5mbyk7XG5cbiAgICAvLyBJbiBzb21lIGNhc2VzLCBgcG9wdWxhdGVBY3Rpb25gIHdpbGwgcmV3cml0ZSBgY2xpY2tgIGV2ZW50cyB0b1xuICAgIC8vIGBjbGlja29ubHlgLiBSZXZlcnQgYmFjayB0byBhIHJlZ3VsYXIgY2xpY2ssIG90aGVyd2lzZSB3ZSB3b24ndCBiZSBhYmxlXG4gICAgLy8gdG8gZXhlY3V0ZSBnbG9iYWwgZXZlbnQgaGFuZGxlcnMgcmVnaXN0ZXJlZCBvbiBjbGljayBldmVudHMuXG4gICAgaWYgKGV2ZW50SW5mb0xpYi5nZXRFdmVudFR5cGUoZ2xvYmFsRXZlbnRJbmZvKSA9PT0gRXZlbnRUeXBlLkNMSUNLT05MWSkge1xuICAgICAgZXZlbnRJbmZvTGliLnNldEV2ZW50VHlwZShnbG9iYWxFdmVudEluZm8sIEV2ZW50VHlwZS5DTElDSyk7XG4gICAgfVxuXG4gICAgdGhpcy5kaXNwYXRjaGVyKGdsb2JhbEV2ZW50SW5mbywgLyogZGlzcGF0Y2ggZ2xvYmFsIGV2ZW50ICovIHRydWUpO1xuXG4gICAgY29uc3QgYWN0aW9uID0gZXZlbnRJbmZvTGliLmdldEFjdGlvbihldmVudEluZm8pO1xuICAgIGlmICghYWN0aW9uKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmIChzaG91bGRQcmV2ZW50RGVmYXVsdEJlZm9yZURpc3BhdGNoaW5nKGV2ZW50SW5mb0xpYi5nZXRBY3Rpb25FbGVtZW50KGFjdGlvbiksIGV2ZW50SW5mbykpIHtcbiAgICAgIGV2ZW50TGliLnByZXZlbnREZWZhdWx0KGV2ZW50SW5mb0xpYi5nZXRFdmVudChldmVudEluZm8pKTtcbiAgICB9XG5cbiAgICB0aGlzLmRpc3BhdGNoZXIoZXZlbnRJbmZvKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBFbmFibGVzIGpzYWN0aW9uIGhhbmRsZXJzIHRvIGJlIGNhbGxlZCBmb3IgdGhlIGV2ZW50IHR5cGUgZ2l2ZW4gYnlcbiAgICogbmFtZS5cbiAgICpcbiAgICogSWYgdGhlIGV2ZW50IGlzIGFscmVhZHkgcmVnaXN0ZXJlZCwgdGhpcyBkb2VzIG5vdGhpbmcuXG4gICAqXG4gICAqIEBwYXJhbSBwcmVmaXhlZEV2ZW50VHlwZSBJZiBzdXBwbGllZCwgdGhpcyBldmVudCBpcyB1c2VkIGluXG4gICAqICAgICB0aGUgYWN0dWFsIGJyb3dzZXIgZXZlbnQgcmVnaXN0cmF0aW9uIGluc3RlYWQgb2YgdGhlIG5hbWUgdGhhdCBpc1xuICAgKiAgICAgZXhwb3NlZCB0byBqc2FjdGlvbi4gVXNlIHRoaXMgaWYgeW91IGUuZy4gd2FudCB1c2VycyB0byBiZSBhYmxlXG4gICAqICAgICB0byBzdWJzY3JpYmUgdG8ganNhY3Rpb249XCJ0cmFuc2l0aW9uRW5kOmZvb1wiIHdoaWxlIHRoZSB1bmRlcmx5aW5nXG4gICAqICAgICBldmVudCBpcyB3ZWJraXRUcmFuc2l0aW9uRW5kIGluIG9uZSBicm93c2VyIGFuZCBtb3pUcmFuc2l0aW9uRW5kXG4gICAqICAgICBpbiBhbm90aGVyLlxuICAgKi9cbiAgYWRkRXZlbnQoZXZlbnRUeXBlOiBzdHJpbmcsIHByZWZpeGVkRXZlbnRUeXBlPzogc3RyaW5nKSB7XG4gICAgaWYgKGV2ZW50VHlwZSBpbiB0aGlzLmV2ZW50SGFuZGxlcnMgfHwgIXRoaXMuY29udGFpbmVyTWFuYWdlcikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmIChcbiAgICAgICFFdmVudENvbnRyYWN0Lk1PVVNFX1NQRUNJQUxfU1VQUE9SVCAmJlxuICAgICAgKGV2ZW50VHlwZSA9PT0gRXZlbnRUeXBlLk1PVVNFRU5URVIgfHxcbiAgICAgICAgZXZlbnRUeXBlID09PSBFdmVudFR5cGUuTU9VU0VMRUFWRSB8fFxuICAgICAgICBldmVudFR5cGUgPT09IEV2ZW50VHlwZS5QT0lOVEVSRU5URVIgfHxcbiAgICAgICAgZXZlbnRUeXBlID09PSBFdmVudFR5cGUuUE9JTlRFUkxFQVZFKVxuICAgICkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGV2ZW50SGFuZGxlciA9IChldmVudFR5cGU6IHN0cmluZywgZXZlbnQ6IEV2ZW50LCBjb250YWluZXI6IEVsZW1lbnQpID0+IHtcbiAgICAgIHRoaXMuaGFuZGxlRXZlbnQoZXZlbnRUeXBlLCBldmVudCwgY29udGFpbmVyKTtcbiAgICB9O1xuXG4gICAgLy8gU3RvcmUgdGhlIGNhbGxiYWNrIHRvIGFsbG93IHVzIHRvIHJlcGxheSBldmVudHMuXG4gICAgdGhpcy5ldmVudEhhbmRsZXJzW2V2ZW50VHlwZV0gPSBldmVudEhhbmRsZXI7XG5cbiAgICBjb25zdCBicm93c2VyRXZlbnRUeXBlID0gZXZlbnRMaWIuZ2V0QnJvd3NlckV2ZW50VHlwZShwcmVmaXhlZEV2ZW50VHlwZSB8fCBldmVudFR5cGUpO1xuXG4gICAgaWYgKGJyb3dzZXJFdmVudFR5cGUgIT09IGV2ZW50VHlwZSkge1xuICAgICAgY29uc3QgZXZlbnRUeXBlcyA9IHRoaXMuYnJvd3NlckV2ZW50VHlwZVRvRXh0cmFFdmVudFR5cGVzW2Jyb3dzZXJFdmVudFR5cGVdIHx8IFtdO1xuICAgICAgZXZlbnRUeXBlcy5wdXNoKGV2ZW50VHlwZSk7XG4gICAgICB0aGlzLmJyb3dzZXJFdmVudFR5cGVUb0V4dHJhRXZlbnRUeXBlc1ticm93c2VyRXZlbnRUeXBlXSA9IGV2ZW50VHlwZXM7XG4gICAgfVxuXG4gICAgdGhpcy5jb250YWluZXJNYW5hZ2VyLmFkZEV2ZW50TGlzdGVuZXIoYnJvd3NlckV2ZW50VHlwZSwgKGVsZW1lbnQ6IEVsZW1lbnQpID0+IHtcbiAgICAgIHJldHVybiAoZXZlbnQ6IEV2ZW50KSA9PiB7XG4gICAgICAgIGV2ZW50SGFuZGxlcihldmVudFR5cGUsIGV2ZW50LCBlbGVtZW50KTtcbiAgICAgIH07XG4gICAgfSk7XG5cbiAgICAvLyBBdXRvbWF0aWNhbGx5IGluc3RhbGwgYSBrZXlwcmVzcy9rZXlkb3duIGV2ZW50IGhhbmRsZXIgaWYgc3VwcG9ydCBmb3JcbiAgICAvLyBhY2Nlc3NpYmxlIGNsaWNrcyBpcyB0dXJuZWQgb24uXG4gICAgaWYgKHRoaXMuYWRkQTExeUNsaWNrTGlzdGVuZXIgJiYgZXZlbnRUeXBlID09PSBFdmVudFR5cGUuQ0xJQ0spIHtcbiAgICAgIHRoaXMuYWRkRXZlbnQoRXZlbnRUeXBlLktFWURPV04pO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBxdWV1ZWQgZWFybHkgZXZlbnRzIGFuZCByZXBsYXkgdGhlbSB1c2luZyB0aGUgYXBwcm9wcmlhdGUgaGFuZGxlclxuICAgKiBpbiB0aGUgcHJvdmlkZWQgZXZlbnQgY29udHJhY3QuIE9uY2UgYWxsIHRoZSBldmVudHMgYXJlIHJlcGxheWVkLCBpdCBjbGVhbnNcbiAgICogdXAgdGhlIGVhcmx5IGNvbnRyYWN0LlxuICAgKi9cbiAgcmVwbGF5RWFybHlFdmVudHMoXG4gICAgZWFybHlKc2FjdGlvbkNvbnRhaW5lcjogRWFybHlKc2FjdGlvbkRhdGFDb250YWluZXIgPSB3aW5kb3cgYXMgRWFybHlKc2FjdGlvbkRhdGFDb250YWluZXIsXG4gICkge1xuICAgIC8vIENoZWNrIGlmIHRoZSBlYXJseSBjb250cmFjdCBpcyBwcmVzZW50IGFuZCBwcmV2ZW50IGNhbGxpbmcgdGhpcyBmdW5jdGlvblxuICAgIC8vIG1vcmUgdGhhbiBvbmNlLlxuICAgIGNvbnN0IGVhcmx5SnNhY3Rpb25EYXRhOiBFYXJseUpzYWN0aW9uRGF0YSB8IHVuZGVmaW5lZCA9IGVhcmx5SnNhY3Rpb25Db250YWluZXIuX2Vqc2E7XG4gICAgaWYgKCFlYXJseUpzYWN0aW9uRGF0YSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIFJlcGxheSB0aGUgZWFybHkgY29udHJhY3QgZXZlbnRzLlxuICAgIGNvbnN0IGVhcmx5RXZlbnRJbmZvczogZXZlbnRJbmZvTGliLkV2ZW50SW5mb1tdID0gZWFybHlKc2FjdGlvbkRhdGEucTtcbiAgICBmb3IgKGxldCBpZHggPSAwOyBpZHggPCBlYXJseUV2ZW50SW5mb3MubGVuZ3RoOyBpZHgrKykge1xuICAgICAgY29uc3QgZWFybHlFdmVudEluZm86IGV2ZW50SW5mb0xpYi5FdmVudEluZm8gPSBlYXJseUV2ZW50SW5mb3NbaWR4XTtcbiAgICAgIGNvbnN0IGV2ZW50VHlwZXMgPSB0aGlzLmdldEV2ZW50VHlwZXNGb3JCcm93c2VyRXZlbnRUeXBlKGVhcmx5RXZlbnRJbmZvLmV2ZW50VHlwZSk7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGV2ZW50VHlwZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3QgZXZlbnRJbmZvID0gZXZlbnRJbmZvTGliLmNsb25lRXZlbnRJbmZvKGVhcmx5RXZlbnRJbmZvKTtcbiAgICAgICAgLy8gRXZlbnRJbmZvIGV2ZW50VHlwZSBtYXBzIHRvIEpTQWN0aW9uJ3MgaW50ZXJuYWwgZXZlbnQgdHlwZSxcbiAgICAgICAgLy8gcmF0aGVyIHRoYW4gdGhlIGJyb3dzZXIgZXZlbnQgdHlwZS5cbiAgICAgICAgZXZlbnRJbmZvTGliLnNldEV2ZW50VHlwZShldmVudEluZm8sIGV2ZW50VHlwZXNbaV0pO1xuICAgICAgICB0aGlzLmhhbmRsZUV2ZW50SW5mbyhldmVudEluZm8pO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIENsZWFuIHVwIHRoZSBlYXJseSBjb250cmFjdC5cbiAgICBjb25zdCBlYXJseUV2ZW50SGFuZGxlcjogKGV2ZW50OiBFdmVudCkgPT4gdm9pZCA9IGVhcmx5SnNhY3Rpb25EYXRhLmg7XG4gICAgcmVtb3ZlRXZlbnRMaXN0ZW5lcnMoZWFybHlKc2FjdGlvbkRhdGEuYywgZWFybHlKc2FjdGlvbkRhdGEuZXQsIGVhcmx5RXZlbnRIYW5kbGVyKTtcbiAgICByZW1vdmVFdmVudExpc3RlbmVycyhlYXJseUpzYWN0aW9uRGF0YS5jLCBlYXJseUpzYWN0aW9uRGF0YS5ldGMsIGVhcmx5RXZlbnRIYW5kbGVyLCB0cnVlKTtcbiAgICBkZWxldGUgZWFybHlKc2FjdGlvbkNvbnRhaW5lci5fZWpzYTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGFsbCBKU0FjdGlvbiBldmVudCB0eXBlcyB0aGF0IGhhdmUgYmVlbiByZWdpc3RlcmVkIGZvciBhIGdpdmVuXG4gICAqIGJyb3dzZXIgZXZlbnQgdHlwZS5cbiAgICovXG4gIHByaXZhdGUgZ2V0RXZlbnRUeXBlc0ZvckJyb3dzZXJFdmVudFR5cGUoYnJvd3NlckV2ZW50VHlwZTogc3RyaW5nKSB7XG4gICAgY29uc3QgZXZlbnRUeXBlcyA9IFtdO1xuICAgIGlmICh0aGlzLmV2ZW50SGFuZGxlcnNbYnJvd3NlckV2ZW50VHlwZV0pIHtcbiAgICAgIGV2ZW50VHlwZXMucHVzaChicm93c2VyRXZlbnRUeXBlKTtcbiAgICB9XG4gICAgaWYgKHRoaXMuYnJvd3NlckV2ZW50VHlwZVRvRXh0cmFFdmVudFR5cGVzW2Jyb3dzZXJFdmVudFR5cGVdKSB7XG4gICAgICBldmVudFR5cGVzLnB1c2goLi4udGhpcy5icm93c2VyRXZlbnRUeXBlVG9FeHRyYUV2ZW50VHlwZXNbYnJvd3NlckV2ZW50VHlwZV0pO1xuICAgIH1cbiAgICByZXR1cm4gZXZlbnRUeXBlcztcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBldmVudCBoYW5kbGVyIGZ1bmN0aW9uIGZvciBhIGdpdmVuIGV2ZW50IHR5cGUuXG4gICAqL1xuICBoYW5kbGVyKGV2ZW50VHlwZTogc3RyaW5nKTogRXZlbnRIYW5kbGVyIHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy5ldmVudEhhbmRsZXJzW2V2ZW50VHlwZV07XG4gIH1cblxuICAvKipcbiAgICogQ2xlYW5zIHVwIHRoZSBldmVudCBjb250cmFjdC4gVGhpcyByZXNldHMgYWxsIG9mIHRoZSBgRXZlbnRDb250cmFjdGAnc1xuICAgKiBpbnRlcm5hbCBzdGF0ZS4gVXNlcnMgYXJlIHJlc3BvbnNpYmxlIGZvciBub3QgdXNpbmcgdGhpcyBgRXZlbnRDb250cmFjdGBcbiAgICogYWZ0ZXIgaXQgaGFzIGJlZW4gY2xlYW5lZCB1cC5cbiAgICovXG4gIGNsZWFuVXAoKSB7XG4gICAgdGhpcy5jb250YWluZXJNYW5hZ2VyIS5jbGVhblVwKCk7XG4gICAgdGhpcy5jb250YWluZXJNYW5hZ2VyID0gbnVsbDtcbiAgICB0aGlzLmV2ZW50SGFuZGxlcnMgPSB7fTtcbiAgICB0aGlzLmJyb3dzZXJFdmVudFR5cGVUb0V4dHJhRXZlbnRUeXBlcyA9IHt9O1xuICAgIHRoaXMuZGlzcGF0Y2hlciA9IG51bGw7XG4gICAgdGhpcy5xdWV1ZWRFdmVudEluZm9zID0gW107XG4gIH1cblxuICAvKipcbiAgICogUmVnaXN0ZXIgYSBkaXNwYXRjaGVyIGZ1bmN0aW9uLiBFdmVudCBpbmZvIG9mIGVhY2ggZXZlbnQgbWFwcGVkIHRvXG4gICAqIGEganNhY3Rpb24gaXMgcGFzc2VkIGZvciBoYW5kbGluZyB0byB0aGlzIGNhbGxiYWNrLiBUaGUgcXVldWVkXG4gICAqIGV2ZW50cyBhcmUgcGFzc2VkIGFzIHdlbGwgdG8gdGhlIGRpc3BhdGNoZXIgZm9yIGxhdGVyIHJlcGxheWluZ1xuICAgKiBvbmNlIHRoZSBkaXNwYXRjaGVyIGlzIHJlZ2lzdGVyZWQuIENsZWFycyB0aGUgZXZlbnQgcXVldWUgdG8gbnVsbC5cbiAgICpcbiAgICogQHBhcmFtIGRpc3BhdGNoZXIgVGhlIGRpc3BhdGNoZXIgZnVuY3Rpb24uXG4gICAqIEBwYXJhbSByZXN0cmljdGlvblxuICAgKi9cbiAgcmVnaXN0ZXJEaXNwYXRjaGVyKGRpc3BhdGNoZXI6IERpc3BhdGNoZXIsIHJlc3RyaWN0aW9uOiBSZXN0cmljdGlvbikge1xuICAgIHRoaXMuZWNyZChkaXNwYXRjaGVyLCByZXN0cmljdGlvbik7XG4gIH1cblxuICAvKipcbiAgICogVW5yZW5hbWVkIGFsaWFzIGZvciByZWdpc3RlckRpc3BhdGNoZXIuIE5lY2Vzc2FyeSBmb3IgYW55IGNvZGViYXNlcyB0aGF0XG4gICAqIHNwbGl0IHRoZSBgRXZlbnRDb250cmFjdGAgYW5kIGBEaXNwYXRjaGVyYCBjb2RlIGludG8gZGlmZmVyZW50IGNvbXBpbGF0aW9uXG4gICAqIHVuaXRzLlxuICAgKi9cbiAgZWNyZChkaXNwYXRjaGVyOiBEaXNwYXRjaGVyLCByZXN0cmljdGlvbjogUmVzdHJpY3Rpb24pIHtcbiAgICB0aGlzLmRpc3BhdGNoZXIgPSBkaXNwYXRjaGVyO1xuXG4gICAgaWYgKHRoaXMucXVldWVkRXZlbnRJbmZvcz8ubGVuZ3RoKSB7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMucXVldWVkRXZlbnRJbmZvcy5sZW5ndGg7IGkrKykge1xuICAgICAgICB0aGlzLmhhbmRsZUV2ZW50SW5mbyh0aGlzLnF1ZXVlZEV2ZW50SW5mb3NbaV0pO1xuICAgICAgfVxuICAgICAgdGhpcy5xdWV1ZWRFdmVudEluZm9zID0gbnVsbDtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQWRkcyBhMTF5IGNsaWNrIHN1cHBvcnQgdG8gdGhlIGdpdmVuIGBFdmVudENvbnRyYWN0YC4gTWVhbnQgdG8gYmUgY2FsbGVkIGluXG4gICAqIHRoZSBzYW1lIGNvbXBpbGF0aW9uIHVuaXQgYXMgdGhlIGBFdmVudENvbnRyYWN0YC5cbiAgICovXG4gIGFkZEExMXlDbGlja1N1cHBvcnQoKSB7XG4gICAgdGhpcy5hZGRBMTF5Q2xpY2tTdXBwb3J0SW1wbChcbiAgICAgIGExMXlDbGlja0xpYi51cGRhdGVFdmVudEluZm9Gb3JBMTF5Q2xpY2ssXG4gICAgICBhMTF5Q2xpY2tMaWIucHJldmVudERlZmF1bHRGb3JBMTF5Q2xpY2ssXG4gICAgICBhMTF5Q2xpY2tMaWIucG9wdWxhdGVDbGlja09ubHlBY3Rpb24sXG4gICAgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBFbmFibGVzIGExMXkgY2xpY2sgc3VwcG9ydCB0byBiZSBkZWZlcnJlZC4gTWVhbnQgdG8gYmUgY2FsbGVkIGluIHRoZSBzYW1lXG4gICAqIGNvbXBpbGF0aW9uIHVuaXQgYXMgdGhlIGBFdmVudENvbnRyYWN0YC5cbiAgICovXG4gIGV4cG9ydEFkZEExMXlDbGlja1N1cHBvcnQoKSB7XG4gICAgdGhpcy5hZGRBMTF5Q2xpY2tMaXN0ZW5lciA9IHRydWU7XG4gICAgdGhpcy5lY2FhY3MgPSB0aGlzLmFkZEExMXlDbGlja1N1cHBvcnRJbXBsLmJpbmQodGhpcyk7XG4gIH1cblxuICAvKipcbiAgICogVW5yZW5hbWVkIGZ1bmN0aW9uIHRoYXQgbG9hZHMgYTExeUNsaWNrU3VwcG9ydC5cbiAgICovXG4gIHByaXZhdGUgYWRkQTExeUNsaWNrU3VwcG9ydEltcGwoXG4gICAgdXBkYXRlRXZlbnRJbmZvRm9yQTExeUNsaWNrOiB0eXBlb2YgYTExeUNsaWNrTGliLnVwZGF0ZUV2ZW50SW5mb0ZvckExMXlDbGljayxcbiAgICBwcmV2ZW50RGVmYXVsdEZvckExMXlDbGljazogdHlwZW9mIGExMXlDbGlja0xpYi5wcmV2ZW50RGVmYXVsdEZvckExMXlDbGljayxcbiAgICBwb3B1bGF0ZUNsaWNrT25seUFjdGlvbjogdHlwZW9mIGExMXlDbGlja0xpYi5wb3B1bGF0ZUNsaWNrT25seUFjdGlvbixcbiAgKSB7XG4gICAgdGhpcy5hZGRBMTF5Q2xpY2tMaXN0ZW5lciA9IHRydWU7XG4gICAgdGhpcy5hY3Rpb25SZXNvbHZlci5hZGRBMTF5Q2xpY2tTdXBwb3J0KFxuICAgICAgdXBkYXRlRXZlbnRJbmZvRm9yQTExeUNsaWNrLFxuICAgICAgcHJldmVudERlZmF1bHRGb3JBMTF5Q2xpY2ssXG4gICAgICBwb3B1bGF0ZUNsaWNrT25seUFjdGlvbixcbiAgICApO1xuICB9XG59XG5cbmZ1bmN0aW9uIHJlbW92ZUV2ZW50TGlzdGVuZXJzKFxuICBjb250YWluZXI6IEhUTUxFbGVtZW50LFxuICBldmVudFR5cGVzOiBzdHJpbmdbXSxcbiAgZWFybHlFdmVudEhhbmRsZXI6IChlOiBFdmVudCkgPT4gdm9pZCxcbiAgY2FwdHVyZT86IGJvb2xlYW4sXG4pIHtcbiAgZm9yIChsZXQgaWR4ID0gMDsgaWR4IDwgZXZlbnRUeXBlcy5sZW5ndGg7IGlkeCsrKSB7XG4gICAgY29udGFpbmVyLnJlbW92ZUV2ZW50TGlzdGVuZXIoZXZlbnRUeXBlc1tpZHhdLCBlYXJseUV2ZW50SGFuZGxlciwgLyogdXNlQ2FwdHVyZSAqLyBjYXB0dXJlKTtcbiAgfVxufVxuXG4vKipcbiAqIEFkZHMgYTExeSBjbGljayBzdXBwb3J0IHRvIHRoZSBnaXZlbiBgRXZlbnRDb250cmFjdGAuIE1lYW50IHRvIGJlIGNhbGxlZFxuICogaW4gYSBkaWZmZXJlbnQgY29tcGlsYXRpb24gdW5pdCBmcm9tIHRoZSBgRXZlbnRDb250cmFjdGAuIFRoZSBgRXZlbnRDb250cmFjdGBcbiAqIG11c3QgaGF2ZSBjYWxsZWQgYGV4cG9ydEFkZEExMXlDbGlja1N1cHBvcnRgIGluIGl0cyBjb21waWxhdGlvbiB1bml0IGZvciB0aGlzXG4gKiB0byBoYXZlIGFueSBlZmZlY3QuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhZGREZWZlcnJlZEExMXlDbGlja1N1cHBvcnQoZXZlbnRDb250cmFjdDogRXZlbnRDb250cmFjdCkge1xuICBldmVudENvbnRyYWN0LmVjYWFjcz8uKFxuICAgIGExMXlDbGlja0xpYi51cGRhdGVFdmVudEluZm9Gb3JBMTF5Q2xpY2ssXG4gICAgYTExeUNsaWNrTGliLnByZXZlbnREZWZhdWx0Rm9yQTExeUNsaWNrLFxuICAgIGExMXlDbGlja0xpYi5wb3B1bGF0ZUNsaWNrT25seUFjdGlvbixcbiAgKTtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIHRydWUgaWYgdGhlIGRlZmF1bHQgYWN0aW9uIG9mIHRoaXMgZXZlbnQgc2hvdWxkIGJlIHByZXZlbnRlZCBiZWZvcmVcbiAqIHRoaXMgZXZlbnQgaXMgZGlzcGF0Y2hlZC5cbiAqL1xuZnVuY3Rpb24gc2hvdWxkUHJldmVudERlZmF1bHRCZWZvcmVEaXNwYXRjaGluZyhcbiAgYWN0aW9uRWxlbWVudDogRWxlbWVudCxcbiAgZXZlbnRJbmZvOiBldmVudEluZm9MaWIuRXZlbnRJbmZvLFxuKTogYm9vbGVhbiB7XG4gIC8vIFByZXZlbnQgYnJvd3NlciBmcm9tIGZvbGxvd2luZyA8YT4gbm9kZSBsaW5rcyBpZiBhIGpzYWN0aW9uIGlzIHByZXNlbnRcbiAgLy8gYW5kIHdlIGFyZSBkaXNwYXRjaGluZyB0aGUgYWN0aW9uIG5vdy4gTm90ZSB0aGF0IHRoZSB0YXJnZXRFbGVtZW50IG1heSBiZVxuICAvLyBhIGNoaWxkIG9mIGFuIGFuY2hvciB0aGF0IGhhcyBhIGpzYWN0aW9uIGF0dGFjaGVkLiBGb3IgdGhhdCByZWFzb24sIHdlXG4gIC8vIG5lZWQgdG8gY2hlY2sgdGhlIGFjdGlvbkVsZW1lbnQgcmF0aGVyIHRoYW4gdGhlIHRhcmdldEVsZW1lbnQuXG4gIHJldHVybiAoXG4gICAgYWN0aW9uRWxlbWVudC50YWdOYW1lID09PSAnQScgJiZcbiAgICAoZXZlbnRJbmZvTGliLmdldEV2ZW50VHlwZShldmVudEluZm8pID09PSBFdmVudFR5cGUuQ0xJQ0sgfHxcbiAgICAgIGV2ZW50SW5mb0xpYi5nZXRFdmVudFR5cGUoZXZlbnRJbmZvKSA9PT0gRXZlbnRUeXBlLkNMSUNLTU9EKVxuICApO1xufVxuIl19