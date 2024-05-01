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
    replayEarlyEvents() {
        // Check if the early contract is present and prevent calling this function
        // more than once.
        const earlyJsactionData = window._ejsa;
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
        const earlyEventTypes = earlyJsactionData.et;
        const earlyEventHandler = earlyJsactionData.h;
        for (let idx = 0; idx < earlyEventTypes.length; idx++) {
            const eventType = earlyEventTypes[idx];
            window.document.documentElement.removeEventListener(eventType, earlyEventHandler);
        }
        delete window._ejsa;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXZlbnRjb250cmFjdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvcHJpbWl0aXZlcy9ldmVudC1kaXNwYXRjaC9zcmMvZXZlbnRjb250cmFjdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQXNCRztBQUVILE9BQU8sS0FBSyxZQUFZLE1BQU0sY0FBYyxDQUFDO0FBQzdDLE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUVqRCxPQUFPLEtBQUssUUFBUSxNQUFNLFNBQVMsQ0FBQztBQUVwQyxPQUFPLEVBQ0wsa0JBQWtCLEVBQ2xCLG9CQUFvQixFQUNwQixtQkFBbUIsRUFDbkIscUJBQXFCLEdBQ3RCLE1BQU0sMEJBQTBCLENBQUM7QUFDbEMsT0FBTyxLQUFLLFlBQVksTUFBTSxjQUFjLENBQUM7QUFDN0MsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLGNBQWMsQ0FBQztBQStCdkM7Ozs7Ozs7Ozs7Ozs7R0FhRztBQUNILE1BQU0sT0FBTyxhQUFhO2FBQ2pCLHlCQUFvQixHQUFHLG9CQUFvQixBQUF2QixDQUF3QjthQUM1Qyx1QkFBa0IsR0FBRyxrQkFBa0IsQUFBckIsQ0FBc0I7YUFDeEMsMEJBQXFCLEdBQUcscUJBQXFCLEFBQXhCLENBQXlCO2FBQzlDLHdCQUFtQixHQUFHLG1CQUFtQixBQUF0QixDQUF1QjtJQTZDakQsWUFBWSxnQkFBK0M7UUF6QzFDLG1CQUFjLEdBQUcsSUFBSSxjQUFjLENBQUM7WUFDbkQsa0JBQWtCLEVBQUUsYUFBYSxDQUFDLG9CQUFvQjtZQUN0RCxrQkFBa0IsRUFBRSxhQUFhLENBQUMsbUJBQW1CO1lBQ3JELDBCQUEwQixFQUFFLGFBQWEsQ0FBQyxxQkFBcUI7U0FDaEUsQ0FBQyxDQUFDO1FBRUg7Ozs7OztXQU1HO1FBQ0ssa0JBQWEsR0FBa0MsRUFB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LENBQUMsb0JBQW9CLEdBQUcsSUFBSSxDQUFDO1FBQ2pDLElBQUksQ0FBQyxjQUFjLENBQUMsbUJBQW1CLENBQ3JDLDJCQUEyQixFQUMzQiwwQkFBMEIsRUFDMUIsdUJBQXVCLENBQ3hCLENBQUM7SUFDSixDQUFDOztBQUdIOzs7OztHQUtHO0FBQ0gsTUFBTSxVQUFVLDJCQUEyQixDQUFDLGFBQTRCO0lBQ3RFLGFBQWEsQ0FBQyxNQUFNLEVBQUUsQ0FDcEIsWUFBWSxDQUFDLDJCQUEyQixFQUN4QyxZQUFZLENBQUMsMEJBQTBCLEVBQ3ZDLFlBQVksQ0FBQyx1QkFBdUIsQ0FDckMsQ0FBQztBQUNKLENBQUM7QUFFRDs7O0dBR0c7QUFDSCxTQUFTLHFDQUFxQyxDQUM1QyxhQUFzQixFQUN0QixTQUFpQztJQUVqQyx5RUFBeUU7SUFDekUsNEVBQTRFO0lBQzVFLHlFQUF5RTtJQUN6RSxpRUFBaUU7SUFDakUsT0FBTyxDQUNMLGFBQWEsQ0FBQyxPQUFPLEtBQUssR0FBRztRQUM3QixDQUFDLFlBQVksQ0FBQyxZQUFZLENBQUMsU0FBUyxDQUFDLEtBQUssU0FBUyxDQUFDLEtBQUs7WUFDdkQsWUFBWSxDQUFDLFlBQVksQ0FBQyxTQUFTLENBQUMsS0FBSyxTQUFTLENBQUMsUUFBUSxDQUFDLENBQy9ELENBQUM7QUFDSixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbi8qKlxuICogQGZpbGVvdmVydmlldyBJbXBsZW1lbnRzIHRoZSBsb2NhbCBldmVudCBoYW5kbGluZyBjb250cmFjdC4gVGhpc1xuICogYWxsb3dzIERPTSBvYmplY3RzIGluIGEgY29udGFpbmVyIHRoYXQgZW50ZXJzIGludG8gdGhpcyBjb250cmFjdCB0b1xuICogZGVmaW5lIGV2ZW50IGhhbmRsZXJzIHdoaWNoIGFyZSBleGVjdXRlZCBpbiBhIGxvY2FsIGNvbnRleHQuXG4gKlxuICogT25lIEV2ZW50Q29udHJhY3QgaW5zdGFuY2UgY2FuIG1hbmFnZSB0aGUgY29udHJhY3QgZm9yIG11bHRpcGxlXG4gKiBjb250YWluZXJzLCB3aGljaCBhcmUgYWRkZWQgdXNpbmcgdGhlIGFkZENvbnRhaW5lcigpIG1ldGhvZC5cbiAqXG4gKiBFdmVudHMgY2FuIGJlIHJlZ2lzdGVyZWQgdXNpbmcgdGhlIGFkZEV2ZW50KCkgbWV0aG9kLlxuICpcbiAqIEEgRGlzcGF0Y2hlciBpcyBhZGRlZCB1c2luZyB0aGUgcmVnaXN0ZXJEaXNwYXRjaGVyKCkgbWV0aG9kLiBVbnRpbCB0aGVyZSBpc1xuICogYSBkaXNwYXRjaGVyLCBldmVudHMgYXJlIHF1ZXVlZC4gVGhlIGlkZWEgaXMgdGhhdCB0aGUgRXZlbnRDb250cmFjdFxuICogY2xhc3MgaXMgaW5saW5lZCBpbiB0aGUgSFRNTCBvZiB0aGUgdG9wIGxldmVsIHBhZ2UgYW5kIGluc3RhbnRpYXRlZFxuICogcmlnaHQgYWZ0ZXIgdGhlIHN0YXJ0IG9mIDxib2R5Pi4gVGhlIERpc3BhdGNoZXIgY2xhc3MgaXMgY29udGFpbmVkXG4gKiBpbiB0aGUgZXh0ZXJuYWwgZGVmZXJyZWQganMsIGFuZCBpbnN0YW50aWF0ZWQgYW5kIHJlZ2lzdGVyZWQgd2l0aFxuICogRXZlbnRDb250cmFjdCB3aGVuIHRoZSBleHRlcm5hbCBqYXZhc2NyaXB0IGluIHRoZSBwYWdlIGxvYWRzLiBUaGVcbiAqIGV4dGVybmFsIGphdmFzY3JpcHQgd2lsbCBhbHNvIHJlZ2lzdGVyIHRoZSBqc2FjdGlvbiBoYW5kbGVycywgd2hpY2hcbiAqIHRoZW4gcGljayB1cCB0aGUgcXVldWVkIGV2ZW50cyBhdCB0aGUgdGltZSBvZiByZWdpc3RyYXRpb24uXG4gKlxuICogU2luY2UgdGhpcyBjbGFzcyBpcyBtZWFudCB0byBiZSBpbmxpbmVkIGluIHRoZSBtYWluIHBhZ2UgSFRNTCwgdGhlXG4gKiBzaXplIG9mIHRoZSBiaW5hcnkgY29tcGlsZWQgZnJvbSB0aGlzIGZpbGUgTVVTVCBiZSBrZXB0IGFzIHNtYWxsIGFzXG4gKiBwb3NzaWJsZSBhbmQgdGh1cyBpdHMgZGVwZW5kZW5jaWVzIHRvIGEgbWluaW11bS5cbiAqL1xuXG5pbXBvcnQgKiBhcyBhMTF5Q2xpY2tMaWIgZnJvbSAnLi9hMTF5X2NsaWNrJztcbmltcG9ydCB7QWN0aW9uUmVzb2x2ZXJ9IGZyb20gJy4vYWN0aW9uX3Jlc29sdmVyJztcbmltcG9ydCB7RWFybHlKc2FjdGlvbkRhdGF9IGZyb20gJy4vZWFybHlldmVudGNvbnRyYWN0JztcbmltcG9ydCAqIGFzIGV2ZW50TGliIGZyb20gJy4vZXZlbnQnO1xuaW1wb3J0IHtFdmVudENvbnRyYWN0Q29udGFpbmVyTWFuYWdlcn0gZnJvbSAnLi9ldmVudF9jb250cmFjdF9jb250YWluZXInO1xuaW1wb3J0IHtcbiAgQTExWV9DTElDS19TVVBQT1JULFxuICBDVVNUT01fRVZFTlRfU1VQUE9SVCxcbiAgSlNOQU1FU1BBQ0VfU1VQUE9SVCxcbiAgTU9VU0VfU1BFQ0lBTF9TVVBQT1JULFxufSBmcm9tICcuL2V2ZW50X2NvbnRyYWN0X2RlZmluZXMnO1xuaW1wb3J0ICogYXMgZXZlbnRJbmZvTGliIGZyb20gJy4vZXZlbnRfaW5mbyc7XG5pbXBvcnQge0V2ZW50VHlwZX0gZnJvbSAnLi9ldmVudF90eXBlJztcbmltcG9ydCB7UmVzdHJpY3Rpb259IGZyb20gJy4vcmVzdHJpY3Rpb24nO1xuXG4vKipcbiAqIFRoZSBBUEkgb2YgYW4gRXZlbnRDb250cmFjdCB0aGF0IGlzIHNhZmUgdG8gY2FsbCBmcm9tIGFueSBjb21waWxhdGlvbiB1bml0LlxuICovXG5leHBvcnQgZGVjbGFyZSBpbnRlcmZhY2UgVW5yZW5hbWVkRXZlbnRDb250cmFjdCB7XG4gIC8vIEFsaWFzIGZvciBKc2N0aW9uIEV2ZW50Q29udHJhY3QgcmVnaXN0ZXJEaXNwYXRjaGVyLlxuICBlY3JkKGRpc3BhdGNoZXI6IERpc3BhdGNoZXIsIHJlc3RyaWN0aW9uOiBSZXN0cmljdGlvbik6IHZvaWQ7XG4gIC8vIFVucmVuYW1lZCBmdW5jdGlvbi4gQWJicmV2aWF0aW9uIGZvciBgZXZlbnRDb250cmFjdC5hZGRBMTF5Q2xpY2tTdXBwb3J0YC5cbiAgZWNhYWNzPzogKFxuICAgIHVwZGF0ZUV2ZW50SW5mb0ZvckExMXlDbGljazogdHlwZW9mIGExMXlDbGlja0xpYi51cGRhdGVFdmVudEluZm9Gb3JBMTF5Q2xpY2ssXG4gICAgcHJldmVudERlZmF1bHRGb3JBMTF5Q2xpY2s6IHR5cGVvZiBhMTF5Q2xpY2tMaWIucHJldmVudERlZmF1bHRGb3JBMTF5Q2xpY2ssXG4gICAgcG9wdWxhdGVDbGlja09ubHlBY3Rpb246IHR5cGVvZiBhMTF5Q2xpY2tMaWIucG9wdWxhdGVDbGlja09ubHlBY3Rpb24sXG4gICkgPT4gdm9pZDtcbn1cblxuLyoqIEEgZnVuY3Rpb24gdGhhdCBpcyBjYWxsZWQgdG8gaGFuZGxlIGV2ZW50cyBjYXB0dXJlZCBieSB0aGUgRXZlbnRDb250cmFjdC4gKi9cbmV4cG9ydCB0eXBlIERpc3BhdGNoZXIgPSAoZXZlbnRJbmZvOiBldmVudEluZm9MaWIuRXZlbnRJbmZvLCBnbG9iYWxEaXNwYXRjaD86IGJvb2xlYW4pID0+IHZvaWQ7XG5cbi8qKlxuICogQSBmdW5jdGlvbiB0aGF0IGhhbmRsZXMgYW4gZXZlbnQgZGlzcGF0Y2hlZCBmcm9tIHRoZSBicm93c2VyLlxuICpcbiAqIGV2ZW50VHlwZTogTWF5IGRpZmZlciBmcm9tIGBldmVudC50eXBlYCBpZiBKU0FjdGlvbiB1c2VzIGFcbiAqIHNob3J0LWhhbmQgbmFtZSBvciBpcyBwYXRjaGluZyBvdmVyIGFuIG5vbi1idWJibGluZyBldmVudCB3aXRoIGEgYnViYmxpbmdcbiAqIHZhcmlhbnQuXG4gKiBldmVudDogVGhlIG5hdGl2ZSBicm93c2VyIGV2ZW50LlxuICogY29udGFpbmVyOiBUaGUgY29udGFpbmVyIGZvciB0aGlzIGRpc3BhdGNoLlxuICovXG50eXBlIEV2ZW50SGFuZGxlciA9IChldmVudFR5cGU6IHN0cmluZywgZXZlbnQ6IEV2ZW50LCBjb250YWluZXI6IEVsZW1lbnQpID0+IHZvaWQ7XG5cbi8qKlxuICogRXZlbnRDb250cmFjdCBpbnRlcmNlcHRzIGV2ZW50cyBpbiB0aGUgYnViYmxpbmcgcGhhc2UgYXQgdGhlXG4gKiBib3VuZGFyeSBvZiBhIGNvbnRhaW5lciBlbGVtZW50LCBhbmQgbWFwcyB0aGVtIHRvIGdlbmVyaWMgYWN0aW9uc1xuICogd2hpY2ggYXJlIHNwZWNpZmllZCB1c2luZyB0aGUgY3VzdG9tIGpzYWN0aW9uIGF0dHJpYnV0ZSBpblxuICogSFRNTC4gQmVoYXZpb3Igb2YgdGhlIGFwcGxpY2F0aW9uIGlzIHRoZW4gc3BlY2lmaWVkIGluIHRlcm1zIG9mXG4gKiBoYW5kbGVyIGZvciBzdWNoIGFjdGlvbnMsIGNmLiBqc2FjdGlvbi5EaXNwYXRjaGVyIGluIGRpc3BhdGNoZXIuanMuXG4gKlxuICogVGhpcyBoYXMgc2V2ZXJhbCBiZW5lZml0czogKDEpIE5vIERPTSBldmVudCBoYW5kbGVycyBuZWVkIHRvIGJlXG4gKiByZWdpc3RlcmVkIG9uIHRoZSBzcGVjaWZpYyBlbGVtZW50cyBpbiB0aGUgVUkuICgyKSBUaGUgc2V0IG9mXG4gKiBldmVudHMgdGhhdCB0aGUgYXBwbGljYXRpb24gaGFzIHRvIGhhbmRsZSBjYW4gYmUgc3BlY2lmaWVkIGluIHRlcm1zXG4gKiBvZiB0aGUgc2VtYW50aWNzIG9mIHRoZSBhcHBsaWNhdGlvbiwgcmF0aGVyIHRoYW4gaW4gdGVybXMgb2YgRE9NXG4gKiBldmVudHMuICgzKSBJbnZvY2F0aW9uIG9mIGhhbmRsZXJzIGNhbiBiZSBkZWxheWVkIGFuZCBoYW5kbGVycyBjYW5cbiAqIGJlIGRlbGF5IGxvYWRlZCBpbiBhIGdlbmVyaWMgd2F5LlxuICovXG5leHBvcnQgY2xhc3MgRXZlbnRDb250cmFjdCBpbXBsZW1lbnRzIFVucmVuYW1lZEV2ZW50Q29udHJhY3Qge1xuICBzdGF0aWMgQ1VTVE9NX0VWRU5UX1NVUFBPUlQgPSBDVVNUT01fRVZFTlRfU1VQUE9SVDtcbiAgc3RhdGljIEExMVlfQ0xJQ0tfU1VQUE9SVCA9IEExMVlfQ0xJQ0tfU1VQUE9SVDtcbiAgc3RhdGljIE1PVVNFX1NQRUNJQUxfU1VQUE9SVCA9IE1PVVNFX1NQRUNJQUxfU1VQUE9SVDtcbiAgc3RhdGljIEpTTkFNRVNQQUNFX1NVUFBPUlQgPSBKU05BTUVTUEFDRV9TVVBQT1JUO1xuXG4gIHByaXZhdGUgY29udGFpbmVyTWFuYWdlcjogRXZlbnRDb250cmFjdENvbnRhaW5lck1hbmFnZXIgfCBudWxsO1xuXG4gIHByaXZhdGUgcmVhZG9ubHkgYWN0aW9uUmVzb2x2ZXIgPSBuZXcgQWN0aW9uUmVzb2x2ZXIoe1xuICAgIGN1c3RvbUV2ZW50U3VwcG9ydDogRXZlbnRDb250cmFjdC5DVVNUT01fRVZFTlRfU1VQUE9SVCxcbiAgICBqc25hbWVzcGFjZVN1cHBvcnQ6IEV2ZW50Q29udHJhY3QuSlNOQU1FU1BBQ0VfU1VQUE9SVCxcbiAgICBzeW50aGV0aWNNb3VzZUV2ZW50U3VwcG9ydDogRXZlbnRDb250cmFjdC5NT1VTRV9TUEVDSUFMX1NVUFBPUlQsXG4gIH0pO1xuXG4gIC8qKlxuICAgKiBUaGUgRE9NIGV2ZW50cyB3aGljaCB0aGlzIGNvbnRyYWN0IGNvdmVycy4gVXNlZCB0byBwcmV2ZW50IGRvdWJsZVxuICAgKiByZWdpc3RyYXRpb24gb2YgZXZlbnQgdHlwZXMuIFRoZSB2YWx1ZSBvZiB0aGUgbWFwIGlzIHRoZVxuICAgKiBpbnRlcm5hbGx5IGNyZWF0ZWQgRE9NIGV2ZW50IGhhbmRsZXIgZnVuY3Rpb24gdGhhdCBoYW5kbGVzIHRoZVxuICAgKiBET00gZXZlbnRzLiBTZWUgYWRkRXZlbnQoKS5cbiAgICpcbiAgICovXG4gIHByaXZhdGUgZXZlbnRIYW5kbGVyczoge1trZXk6IHN0cmluZ106IEV2ZW50SGFuZGxlcn0gPSB7fTtcblxuICBwcml2YXRlIGJyb3dzZXJFdmVudFR5cGVUb0V4dHJhRXZlbnRUeXBlczoge1trZXk6IHN0cmluZ106IHN0cmluZ1tdfSA9IHt9O1xuXG4gIC8qKlxuICAgKiBUaGUgZGlzcGF0Y2hlciBmdW5jdGlvbi4gRXZlbnRzIGFyZSBwYXNzZWQgdG8gdGhpcyBmdW5jdGlvbiBmb3JcbiAgICogaGFuZGxpbmcgb25jZSBpdCB3YXMgc2V0IHVzaW5nIHRoZSByZWdpc3RlckRpc3BhdGNoZXIoKSBtZXRob2QuIFRoaXMgaXNcbiAgICogZG9uZSBiZWNhdXNlIHRoZSBmdW5jdGlvbiBpcyBwYXNzZWQgZnJvbSBhbm90aGVyIGpzYmluYXJ5LCBzbyBwYXNzaW5nIHRoZVxuICAgKiBpbnN0YW5jZSBhbmQgaW52b2tpbmcgdGhlIG1ldGhvZCBoZXJlIHdvdWxkIHJlcXVpcmUgdG8gbGVhdmUgdGhlIG1ldGhvZFxuICAgKiB1bm9iZnVzY2F0ZWQuXG4gICAqL1xuICBwcml2YXRlIGRpc3BhdGNoZXI6IERpc3BhdGNoZXIgfCBudWxsID0gbnVsbDtcblxuICAvKipcbiAgICogVGhlIGxpc3Qgb2Ygc3VzcGVuZGVkIGBFdmVudEluZm9gIHRoYXQgd2lsbCBiZSBkaXNwYXRjaGVkXG4gICAqIGFzIHNvb24gYXMgdGhlIGBEaXNwYXRjaGVyYCBpcyByZWdpc3RlcmVkLlxuICAgKi9cbiAgcHJpdmF0ZSBxdWV1ZWRFdmVudEluZm9zOiBldmVudEluZm9MaWIuRXZlbnRJbmZvW10gfCBudWxsID0gW107XG5cbiAgLyoqIFdoZXRoZXIgdG8gYWRkIGFuIGExMXkgY2xpY2sgbGlzdGVuZXIuICovXG4gIHByaXZhdGUgYWRkQTExeUNsaWNrTGlzdGVuZXIgPSBmYWxzZTtcblxuICBlY2FhY3M/OiAoXG4gICAgdXBkYXRlRXZlbnRJbmZvRm9yQTExeUNsaWNrOiB0eXBlb2YgYTExeUNsaWNrTGliLnVwZGF0ZUV2ZW50SW5mb0ZvckExMXlDbGljayxcbiAgICBwcmV2ZW50RGVmYXVsdEZvckExMXlDbGljazogdHlwZW9mIGExMXlDbGlja0xpYi5wcmV2ZW50RGVmYXVsdEZvckExMXlDbGljayxcbiAgICBwb3B1bGF0ZUNsaWNrT25seUFjdGlvbjogdHlwZW9mIGExMXlDbGlja0xpYi5wb3B1bGF0ZUNsaWNrT25seUFjdGlvbixcbiAgKSA9PiB2b2lkO1xuXG4gIGNvbnN0cnVjdG9yKGNvbnRhaW5lck1hbmFnZXI6IEV2ZW50Q29udHJhY3RDb250YWluZXJNYW5hZ2VyKSB7XG4gICAgdGhpcy5jb250YWluZXJNYW5hZ2VyID0gY29udGFpbmVyTWFuYWdlcjtcbiAgICBpZiAoRXZlbnRDb250cmFjdC5DVVNUT01fRVZFTlRfU1VQUE9SVCkge1xuICAgICAgdGhpcy5hZGRFdmVudChFdmVudFR5cGUuQ1VTVE9NKTtcbiAgICB9XG4gICAgaWYgKEV2ZW50Q29udHJhY3QuQTExWV9DTElDS19TVVBQT1JUKSB7XG4gICAgICAvLyBBZGQgYTExeSBjbGljayBzdXBwb3J0IHRvIHRoZSBgRXZlbnRDb250cmFjdGAuXG4gICAgICB0aGlzLmFkZEExMXlDbGlja1N1cHBvcnQoKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGhhbmRsZUV2ZW50KGV2ZW50VHlwZTogc3RyaW5nLCBldmVudDogRXZlbnQsIGNvbnRhaW5lcjogRWxlbWVudCkge1xuICAgIGNvbnN0IGV2ZW50SW5mbyA9IGV2ZW50SW5mb0xpYi5jcmVhdGVFdmVudEluZm9Gcm9tUGFyYW1ldGVycyhcbiAgICAgIC8qIGV2ZW50VHlwZT0gKi8gZXZlbnRUeXBlLFxuICAgICAgLyogZXZlbnQ9ICovIGV2ZW50LFxuICAgICAgLyogdGFyZ2V0RWxlbWVudD0gKi8gZXZlbnQudGFyZ2V0IGFzIEVsZW1lbnQsXG4gICAgICAvKiBjb250YWluZXI9ICovIGNvbnRhaW5lcixcbiAgICAgIC8qIHRpbWVzdGFtcD0gKi8gRGF0ZS5ub3coKSxcbiAgICApO1xuICAgIHRoaXMuaGFuZGxlRXZlbnRJbmZvKGV2ZW50SW5mbyk7XG4gIH1cblxuICAvKipcbiAgICogSGFuZGxlIGFuIGBFdmVudEluZm9gLlxuICAgKi9cbiAgcHJpdmF0ZSBoYW5kbGVFdmVudEluZm8oZXZlbnRJbmZvOiBldmVudEluZm9MaWIuRXZlbnRJbmZvKSB7XG4gICAgaWYgKCF0aGlzLmRpc3BhdGNoZXIpIHtcbiAgICAgIC8vIEFsbCBldmVudHMgYXJlIHF1ZXVlZCB3aGVuIHRoZSBkaXNwYXRjaGVyIGlzbid0IHlldCBsb2FkZWQuXG4gICAgICBldmVudEluZm9MaWIuc2V0SXNSZXBsYXkoZXZlbnRJbmZvLCB0cnVlKTtcbiAgICAgIHRoaXMucXVldWVkRXZlbnRJbmZvcz8ucHVzaChldmVudEluZm8pO1xuICAgIH1cbiAgICB0aGlzLmFjdGlvblJlc29sdmVyLnJlc29sdmUoZXZlbnRJbmZvKTtcblxuICAgIGlmICghdGhpcy5kaXNwYXRjaGVyKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IGdsb2JhbEV2ZW50SW5mbzogZXZlbnRJbmZvTGliLkV2ZW50SW5mbyA9IGV2ZW50SW5mb0xpYi5jbG9uZUV2ZW50SW5mbyhldmVudEluZm8pO1xuXG4gICAgLy8gSW4gc29tZSBjYXNlcywgYHBvcHVsYXRlQWN0aW9uYCB3aWxsIHJld3JpdGUgYGNsaWNrYCBldmVudHMgdG9cbiAgICAvLyBgY2xpY2tvbmx5YC4gUmV2ZXJ0IGJhY2sgdG8gYSByZWd1bGFyIGNsaWNrLCBvdGhlcndpc2Ugd2Ugd29uJ3QgYmUgYWJsZVxuICAgIC8vIHRvIGV4ZWN1dGUgZ2xvYmFsIGV2ZW50IGhhbmRsZXJzIHJlZ2lzdGVyZWQgb24gY2xpY2sgZXZlbnRzLlxuICAgIGlmIChldmVudEluZm9MaWIuZ2V0RXZlbnRUeXBlKGdsb2JhbEV2ZW50SW5mbykgPT09IEV2ZW50VHlwZS5DTElDS09OTFkpIHtcbiAgICAgIGV2ZW50SW5mb0xpYi5zZXRFdmVudFR5cGUoZ2xvYmFsRXZlbnRJbmZvLCBFdmVudFR5cGUuQ0xJQ0spO1xuICAgIH1cblxuICAgIHRoaXMuZGlzcGF0Y2hlcihnbG9iYWxFdmVudEluZm8sIC8qIGRpc3BhdGNoIGdsb2JhbCBldmVudCAqLyB0cnVlKTtcblxuICAgIGNvbnN0IGFjdGlvbiA9IGV2ZW50SW5mb0xpYi5nZXRBY3Rpb24oZXZlbnRJbmZvKTtcbiAgICBpZiAoIWFjdGlvbikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAoc2hvdWxkUHJldmVudERlZmF1bHRCZWZvcmVEaXNwYXRjaGluZyhldmVudEluZm9MaWIuZ2V0QWN0aW9uRWxlbWVudChhY3Rpb24pLCBldmVudEluZm8pKSB7XG4gICAgICBldmVudExpYi5wcmV2ZW50RGVmYXVsdChldmVudEluZm9MaWIuZ2V0RXZlbnQoZXZlbnRJbmZvKSk7XG4gICAgfVxuXG4gICAgdGhpcy5kaXNwYXRjaGVyKGV2ZW50SW5mbyk7XG4gIH1cblxuICAvKipcbiAgICogRW5hYmxlcyBqc2FjdGlvbiBoYW5kbGVycyB0byBiZSBjYWxsZWQgZm9yIHRoZSBldmVudCB0eXBlIGdpdmVuIGJ5XG4gICAqIG5hbWUuXG4gICAqXG4gICAqIElmIHRoZSBldmVudCBpcyBhbHJlYWR5IHJlZ2lzdGVyZWQsIHRoaXMgZG9lcyBub3RoaW5nLlxuICAgKlxuICAgKiBAcGFyYW0gcHJlZml4ZWRFdmVudFR5cGUgSWYgc3VwcGxpZWQsIHRoaXMgZXZlbnQgaXMgdXNlZCBpblxuICAgKiAgICAgdGhlIGFjdHVhbCBicm93c2VyIGV2ZW50IHJlZ2lzdHJhdGlvbiBpbnN0ZWFkIG9mIHRoZSBuYW1lIHRoYXQgaXNcbiAgICogICAgIGV4cG9zZWQgdG8ganNhY3Rpb24uIFVzZSB0aGlzIGlmIHlvdSBlLmcuIHdhbnQgdXNlcnMgdG8gYmUgYWJsZVxuICAgKiAgICAgdG8gc3Vic2NyaWJlIHRvIGpzYWN0aW9uPVwidHJhbnNpdGlvbkVuZDpmb29cIiB3aGlsZSB0aGUgdW5kZXJseWluZ1xuICAgKiAgICAgZXZlbnQgaXMgd2Via2l0VHJhbnNpdGlvbkVuZCBpbiBvbmUgYnJvd3NlciBhbmQgbW96VHJhbnNpdGlvbkVuZFxuICAgKiAgICAgaW4gYW5vdGhlci5cbiAgICovXG4gIGFkZEV2ZW50KGV2ZW50VHlwZTogc3RyaW5nLCBwcmVmaXhlZEV2ZW50VHlwZT86IHN0cmluZykge1xuICAgIGlmIChldmVudFR5cGUgaW4gdGhpcy5ldmVudEhhbmRsZXJzIHx8ICF0aGlzLmNvbnRhaW5lck1hbmFnZXIpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoXG4gICAgICAhRXZlbnRDb250cmFjdC5NT1VTRV9TUEVDSUFMX1NVUFBPUlQgJiZcbiAgICAgIChldmVudFR5cGUgPT09IEV2ZW50VHlwZS5NT1VTRUVOVEVSIHx8XG4gICAgICAgIGV2ZW50VHlwZSA9PT0gRXZlbnRUeXBlLk1PVVNFTEVBVkUgfHxcbiAgICAgICAgZXZlbnRUeXBlID09PSBFdmVudFR5cGUuUE9JTlRFUkVOVEVSIHx8XG4gICAgICAgIGV2ZW50VHlwZSA9PT0gRXZlbnRUeXBlLlBPSU5URVJMRUFWRSlcbiAgICApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBldmVudEhhbmRsZXIgPSAoZXZlbnRUeXBlOiBzdHJpbmcsIGV2ZW50OiBFdmVudCwgY29udGFpbmVyOiBFbGVtZW50KSA9PiB7XG4gICAgICB0aGlzLmhhbmRsZUV2ZW50KGV2ZW50VHlwZSwgZXZlbnQsIGNvbnRhaW5lcik7XG4gICAgfTtcblxuICAgIC8vIFN0b3JlIHRoZSBjYWxsYmFjayB0byBhbGxvdyB1cyB0byByZXBsYXkgZXZlbnRzLlxuICAgIHRoaXMuZXZlbnRIYW5kbGVyc1tldmVudFR5cGVdID0gZXZlbnRIYW5kbGVyO1xuXG4gICAgY29uc3QgYnJvd3NlckV2ZW50VHlwZSA9IGV2ZW50TGliLmdldEJyb3dzZXJFdmVudFR5cGUocHJlZml4ZWRFdmVudFR5cGUgfHwgZXZlbnRUeXBlKTtcblxuICAgIGlmIChicm93c2VyRXZlbnRUeXBlICE9PSBldmVudFR5cGUpIHtcbiAgICAgIGNvbnN0IGV2ZW50VHlwZXMgPSB0aGlzLmJyb3dzZXJFdmVudFR5cGVUb0V4dHJhRXZlbnRUeXBlc1ticm93c2VyRXZlbnRUeXBlXSB8fCBbXTtcbiAgICAgIGV2ZW50VHlwZXMucHVzaChldmVudFR5cGUpO1xuICAgICAgdGhpcy5icm93c2VyRXZlbnRUeXBlVG9FeHRyYUV2ZW50VHlwZXNbYnJvd3NlckV2ZW50VHlwZV0gPSBldmVudFR5cGVzO1xuICAgIH1cblxuICAgIHRoaXMuY29udGFpbmVyTWFuYWdlci5hZGRFdmVudExpc3RlbmVyKGJyb3dzZXJFdmVudFR5cGUsIChlbGVtZW50OiBFbGVtZW50KSA9PiB7XG4gICAgICByZXR1cm4gKGV2ZW50OiBFdmVudCkgPT4ge1xuICAgICAgICBldmVudEhhbmRsZXIoZXZlbnRUeXBlLCBldmVudCwgZWxlbWVudCk7XG4gICAgICB9O1xuICAgIH0pO1xuXG4gICAgLy8gQXV0b21hdGljYWxseSBpbnN0YWxsIGEga2V5cHJlc3Mva2V5ZG93biBldmVudCBoYW5kbGVyIGlmIHN1cHBvcnQgZm9yXG4gICAgLy8gYWNjZXNzaWJsZSBjbGlja3MgaXMgdHVybmVkIG9uLlxuICAgIGlmICh0aGlzLmFkZEExMXlDbGlja0xpc3RlbmVyICYmIGV2ZW50VHlwZSA9PT0gRXZlbnRUeXBlLkNMSUNLKSB7XG4gICAgICB0aGlzLmFkZEV2ZW50KEV2ZW50VHlwZS5LRVlET1dOKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgcXVldWVkIGVhcmx5IGV2ZW50cyBhbmQgcmVwbGF5IHRoZW0gdXNpbmcgdGhlIGFwcHJvcHJpYXRlIGhhbmRsZXJcbiAgICogaW4gdGhlIHByb3ZpZGVkIGV2ZW50IGNvbnRyYWN0LiBPbmNlIGFsbCB0aGUgZXZlbnRzIGFyZSByZXBsYXllZCwgaXQgY2xlYW5zXG4gICAqIHVwIHRoZSBlYXJseSBjb250cmFjdC5cbiAgICovXG4gIHJlcGxheUVhcmx5RXZlbnRzKCkge1xuICAgIC8vIENoZWNrIGlmIHRoZSBlYXJseSBjb250cmFjdCBpcyBwcmVzZW50IGFuZCBwcmV2ZW50IGNhbGxpbmcgdGhpcyBmdW5jdGlvblxuICAgIC8vIG1vcmUgdGhhbiBvbmNlLlxuICAgIGNvbnN0IGVhcmx5SnNhY3Rpb25EYXRhOiBFYXJseUpzYWN0aW9uRGF0YSB8IHVuZGVmaW5lZCA9IHdpbmRvdy5fZWpzYTtcbiAgICBpZiAoIWVhcmx5SnNhY3Rpb25EYXRhKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gUmVwbGF5IHRoZSBlYXJseSBjb250cmFjdCBldmVudHMuXG4gICAgY29uc3QgZWFybHlFdmVudEluZm9zOiBldmVudEluZm9MaWIuRXZlbnRJbmZvW10gPSBlYXJseUpzYWN0aW9uRGF0YS5xO1xuICAgIGZvciAobGV0IGlkeCA9IDA7IGlkeCA8IGVhcmx5RXZlbnRJbmZvcy5sZW5ndGg7IGlkeCsrKSB7XG4gICAgICBjb25zdCBlYXJseUV2ZW50SW5mbzogZXZlbnRJbmZvTGliLkV2ZW50SW5mbyA9IGVhcmx5RXZlbnRJbmZvc1tpZHhdO1xuICAgICAgY29uc3QgZXZlbnRUeXBlcyA9IHRoaXMuZ2V0RXZlbnRUeXBlc0ZvckJyb3dzZXJFdmVudFR5cGUoZWFybHlFdmVudEluZm8uZXZlbnRUeXBlKTtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZXZlbnRUeXBlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBjb25zdCBldmVudEluZm8gPSBldmVudEluZm9MaWIuY2xvbmVFdmVudEluZm8oZWFybHlFdmVudEluZm8pO1xuICAgICAgICAvLyBFdmVudEluZm8gZXZlbnRUeXBlIG1hcHMgdG8gSlNBY3Rpb24ncyBpbnRlcm5hbCBldmVudCB0eXBlLFxuICAgICAgICAvLyByYXRoZXIgdGhhbiB0aGUgYnJvd3NlciBldmVudCB0eXBlLlxuICAgICAgICBldmVudEluZm9MaWIuc2V0RXZlbnRUeXBlKGV2ZW50SW5mbywgZXZlbnRUeXBlc1tpXSk7XG4gICAgICAgIHRoaXMuaGFuZGxlRXZlbnRJbmZvKGV2ZW50SW5mbyk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gQ2xlYW4gdXAgdGhlIGVhcmx5IGNvbnRyYWN0LlxuICAgIGNvbnN0IGVhcmx5RXZlbnRUeXBlczogc3RyaW5nW10gPSBlYXJseUpzYWN0aW9uRGF0YS5ldDtcbiAgICBjb25zdCBlYXJseUV2ZW50SGFuZGxlcjogKGV2ZW50OiBFdmVudCkgPT4gdm9pZCA9IGVhcmx5SnNhY3Rpb25EYXRhLmg7XG4gICAgZm9yIChsZXQgaWR4ID0gMDsgaWR4IDwgZWFybHlFdmVudFR5cGVzLmxlbmd0aDsgaWR4KyspIHtcbiAgICAgIGNvbnN0IGV2ZW50VHlwZTogc3RyaW5nID0gZWFybHlFdmVudFR5cGVzW2lkeF07XG4gICAgICB3aW5kb3cuZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoZXZlbnRUeXBlLCBlYXJseUV2ZW50SGFuZGxlcik7XG4gICAgfVxuICAgIGRlbGV0ZSB3aW5kb3cuX2Vqc2E7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhbGwgSlNBY3Rpb24gZXZlbnQgdHlwZXMgdGhhdCBoYXZlIGJlZW4gcmVnaXN0ZXJlZCBmb3IgYSBnaXZlblxuICAgKiBicm93c2VyIGV2ZW50IHR5cGUuXG4gICAqL1xuICBwcml2YXRlIGdldEV2ZW50VHlwZXNGb3JCcm93c2VyRXZlbnRUeXBlKGJyb3dzZXJFdmVudFR5cGU6IHN0cmluZykge1xuICAgIGNvbnN0IGV2ZW50VHlwZXMgPSBbXTtcbiAgICBpZiAodGhpcy5ldmVudEhhbmRsZXJzW2Jyb3dzZXJFdmVudFR5cGVdKSB7XG4gICAgICBldmVudFR5cGVzLnB1c2goYnJvd3NlckV2ZW50VHlwZSk7XG4gICAgfVxuICAgIGlmICh0aGlzLmJyb3dzZXJFdmVudFR5cGVUb0V4dHJhRXZlbnRUeXBlc1ticm93c2VyRXZlbnRUeXBlXSkge1xuICAgICAgZXZlbnRUeXBlcy5wdXNoKC4uLnRoaXMuYnJvd3NlckV2ZW50VHlwZVRvRXh0cmFFdmVudFR5cGVzW2Jyb3dzZXJFdmVudFR5cGVdKTtcbiAgICB9XG4gICAgcmV0dXJuIGV2ZW50VHlwZXM7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgZXZlbnQgaGFuZGxlciBmdW5jdGlvbiBmb3IgYSBnaXZlbiBldmVudCB0eXBlLlxuICAgKi9cbiAgaGFuZGxlcihldmVudFR5cGU6IHN0cmluZyk6IEV2ZW50SGFuZGxlciB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMuZXZlbnRIYW5kbGVyc1tldmVudFR5cGVdO1xuICB9XG5cbiAgLyoqXG4gICAqIENsZWFucyB1cCB0aGUgZXZlbnQgY29udHJhY3QuIFRoaXMgcmVzZXRzIGFsbCBvZiB0aGUgYEV2ZW50Q29udHJhY3RgJ3NcbiAgICogaW50ZXJuYWwgc3RhdGUuIFVzZXJzIGFyZSByZXNwb25zaWJsZSBmb3Igbm90IHVzaW5nIHRoaXMgYEV2ZW50Q29udHJhY3RgXG4gICAqIGFmdGVyIGl0IGhhcyBiZWVuIGNsZWFuZWQgdXAuXG4gICAqL1xuICBjbGVhblVwKCkge1xuICAgIHRoaXMuY29udGFpbmVyTWFuYWdlciEuY2xlYW5VcCgpO1xuICAgIHRoaXMuY29udGFpbmVyTWFuYWdlciA9IG51bGw7XG4gICAgdGhpcy5ldmVudEhhbmRsZXJzID0ge307XG4gICAgdGhpcy5icm93c2VyRXZlbnRUeXBlVG9FeHRyYUV2ZW50VHlwZXMgPSB7fTtcbiAgICB0aGlzLmRpc3BhdGNoZXIgPSBudWxsO1xuICAgIHRoaXMucXVldWVkRXZlbnRJbmZvcyA9IFtdO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlZ2lzdGVyIGEgZGlzcGF0Y2hlciBmdW5jdGlvbi4gRXZlbnQgaW5mbyBvZiBlYWNoIGV2ZW50IG1hcHBlZCB0b1xuICAgKiBhIGpzYWN0aW9uIGlzIHBhc3NlZCBmb3IgaGFuZGxpbmcgdG8gdGhpcyBjYWxsYmFjay4gVGhlIHF1ZXVlZFxuICAgKiBldmVudHMgYXJlIHBhc3NlZCBhcyB3ZWxsIHRvIHRoZSBkaXNwYXRjaGVyIGZvciBsYXRlciByZXBsYXlpbmdcbiAgICogb25jZSB0aGUgZGlzcGF0Y2hlciBpcyByZWdpc3RlcmVkLiBDbGVhcnMgdGhlIGV2ZW50IHF1ZXVlIHRvIG51bGwuXG4gICAqXG4gICAqIEBwYXJhbSBkaXNwYXRjaGVyIFRoZSBkaXNwYXRjaGVyIGZ1bmN0aW9uLlxuICAgKiBAcGFyYW0gcmVzdHJpY3Rpb25cbiAgICovXG4gIHJlZ2lzdGVyRGlzcGF0Y2hlcihkaXNwYXRjaGVyOiBEaXNwYXRjaGVyLCByZXN0cmljdGlvbjogUmVzdHJpY3Rpb24pIHtcbiAgICB0aGlzLmVjcmQoZGlzcGF0Y2hlciwgcmVzdHJpY3Rpb24pO1xuICB9XG5cbiAgLyoqXG4gICAqIFVucmVuYW1lZCBhbGlhcyBmb3IgcmVnaXN0ZXJEaXNwYXRjaGVyLiBOZWNlc3NhcnkgZm9yIGFueSBjb2RlYmFzZXMgdGhhdFxuICAgKiBzcGxpdCB0aGUgYEV2ZW50Q29udHJhY3RgIGFuZCBgRGlzcGF0Y2hlcmAgY29kZSBpbnRvIGRpZmZlcmVudCBjb21waWxhdGlvblxuICAgKiB1bml0cy5cbiAgICovXG4gIGVjcmQoZGlzcGF0Y2hlcjogRGlzcGF0Y2hlciwgcmVzdHJpY3Rpb246IFJlc3RyaWN0aW9uKSB7XG4gICAgdGhpcy5kaXNwYXRjaGVyID0gZGlzcGF0Y2hlcjtcblxuICAgIGlmICh0aGlzLnF1ZXVlZEV2ZW50SW5mb3M/Lmxlbmd0aCkge1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLnF1ZXVlZEV2ZW50SW5mb3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdGhpcy5oYW5kbGVFdmVudEluZm8odGhpcy5xdWV1ZWRFdmVudEluZm9zW2ldKTtcbiAgICAgIH1cbiAgICAgIHRoaXMucXVldWVkRXZlbnRJbmZvcyA9IG51bGw7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEFkZHMgYTExeSBjbGljayBzdXBwb3J0IHRvIHRoZSBnaXZlbiBgRXZlbnRDb250cmFjdGAuIE1lYW50IHRvIGJlIGNhbGxlZCBpblxuICAgKiB0aGUgc2FtZSBjb21waWxhdGlvbiB1bml0IGFzIHRoZSBgRXZlbnRDb250cmFjdGAuXG4gICAqL1xuICBhZGRBMTF5Q2xpY2tTdXBwb3J0KCkge1xuICAgIHRoaXMuYWRkQTExeUNsaWNrU3VwcG9ydEltcGwoXG4gICAgICBhMTF5Q2xpY2tMaWIudXBkYXRlRXZlbnRJbmZvRm9yQTExeUNsaWNrLFxuICAgICAgYTExeUNsaWNrTGliLnByZXZlbnREZWZhdWx0Rm9yQTExeUNsaWNrLFxuICAgICAgYTExeUNsaWNrTGliLnBvcHVsYXRlQ2xpY2tPbmx5QWN0aW9uLFxuICAgICk7XG4gIH1cblxuICAvKipcbiAgICogRW5hYmxlcyBhMTF5IGNsaWNrIHN1cHBvcnQgdG8gYmUgZGVmZXJyZWQuIE1lYW50IHRvIGJlIGNhbGxlZCBpbiB0aGUgc2FtZVxuICAgKiBjb21waWxhdGlvbiB1bml0IGFzIHRoZSBgRXZlbnRDb250cmFjdGAuXG4gICAqL1xuICBleHBvcnRBZGRBMTF5Q2xpY2tTdXBwb3J0KCkge1xuICAgIHRoaXMuYWRkQTExeUNsaWNrTGlzdGVuZXIgPSB0cnVlO1xuICAgIHRoaXMuZWNhYWNzID0gdGhpcy5hZGRBMTF5Q2xpY2tTdXBwb3J0SW1wbC5iaW5kKHRoaXMpO1xuICB9XG5cbiAgLyoqXG4gICAqIFVucmVuYW1lZCBmdW5jdGlvbiB0aGF0IGxvYWRzIGExMXlDbGlja1N1cHBvcnQuXG4gICAqL1xuICBwcml2YXRlIGFkZEExMXlDbGlja1N1cHBvcnRJbXBsKFxuICAgIHVwZGF0ZUV2ZW50SW5mb0ZvckExMXlDbGljazogdHlwZW9mIGExMXlDbGlja0xpYi51cGRhdGVFdmVudEluZm9Gb3JBMTF5Q2xpY2ssXG4gICAgcHJldmVudERlZmF1bHRGb3JBMTF5Q2xpY2s6IHR5cGVvZiBhMTF5Q2xpY2tMaWIucHJldmVudERlZmF1bHRGb3JBMTF5Q2xpY2ssXG4gICAgcG9wdWxhdGVDbGlja09ubHlBY3Rpb246IHR5cGVvZiBhMTF5Q2xpY2tMaWIucG9wdWxhdGVDbGlja09ubHlBY3Rpb24sXG4gICkge1xuICAgIHRoaXMuYWRkQTExeUNsaWNrTGlzdGVuZXIgPSB0cnVlO1xuICAgIHRoaXMuYWN0aW9uUmVzb2x2ZXIuYWRkQTExeUNsaWNrU3VwcG9ydChcbiAgICAgIHVwZGF0ZUV2ZW50SW5mb0ZvckExMXlDbGljayxcbiAgICAgIHByZXZlbnREZWZhdWx0Rm9yQTExeUNsaWNrLFxuICAgICAgcG9wdWxhdGVDbGlja09ubHlBY3Rpb24sXG4gICAgKTtcbiAgfVxufVxuXG4vKipcbiAqIEFkZHMgYTExeSBjbGljayBzdXBwb3J0IHRvIHRoZSBnaXZlbiBgRXZlbnRDb250cmFjdGAuIE1lYW50IHRvIGJlIGNhbGxlZFxuICogaW4gYSBkaWZmZXJlbnQgY29tcGlsYXRpb24gdW5pdCBmcm9tIHRoZSBgRXZlbnRDb250cmFjdGAuIFRoZSBgRXZlbnRDb250cmFjdGBcbiAqIG11c3QgaGF2ZSBjYWxsZWQgYGV4cG9ydEFkZEExMXlDbGlja1N1cHBvcnRgIGluIGl0cyBjb21waWxhdGlvbiB1bml0IGZvciB0aGlzXG4gKiB0byBoYXZlIGFueSBlZmZlY3QuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhZGREZWZlcnJlZEExMXlDbGlja1N1cHBvcnQoZXZlbnRDb250cmFjdDogRXZlbnRDb250cmFjdCkge1xuICBldmVudENvbnRyYWN0LmVjYWFjcz8uKFxuICAgIGExMXlDbGlja0xpYi51cGRhdGVFdmVudEluZm9Gb3JBMTF5Q2xpY2ssXG4gICAgYTExeUNsaWNrTGliLnByZXZlbnREZWZhdWx0Rm9yQTExeUNsaWNrLFxuICAgIGExMXlDbGlja0xpYi5wb3B1bGF0ZUNsaWNrT25seUFjdGlvbixcbiAgKTtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIHRydWUgaWYgdGhlIGRlZmF1bHQgYWN0aW9uIG9mIHRoaXMgZXZlbnQgc2hvdWxkIGJlIHByZXZlbnRlZCBiZWZvcmVcbiAqIHRoaXMgZXZlbnQgaXMgZGlzcGF0Y2hlZC5cbiAqL1xuZnVuY3Rpb24gc2hvdWxkUHJldmVudERlZmF1bHRCZWZvcmVEaXNwYXRjaGluZyhcbiAgYWN0aW9uRWxlbWVudDogRWxlbWVudCxcbiAgZXZlbnRJbmZvOiBldmVudEluZm9MaWIuRXZlbnRJbmZvLFxuKTogYm9vbGVhbiB7XG4gIC8vIFByZXZlbnQgYnJvd3NlciBmcm9tIGZvbGxvd2luZyA8YT4gbm9kZSBsaW5rcyBpZiBhIGpzYWN0aW9uIGlzIHByZXNlbnRcbiAgLy8gYW5kIHdlIGFyZSBkaXNwYXRjaGluZyB0aGUgYWN0aW9uIG5vdy4gTm90ZSB0aGF0IHRoZSB0YXJnZXRFbGVtZW50IG1heSBiZVxuICAvLyBhIGNoaWxkIG9mIGFuIGFuY2hvciB0aGF0IGhhcyBhIGpzYWN0aW9uIGF0dGFjaGVkLiBGb3IgdGhhdCByZWFzb24sIHdlXG4gIC8vIG5lZWQgdG8gY2hlY2sgdGhlIGFjdGlvbkVsZW1lbnQgcmF0aGVyIHRoYW4gdGhlIHRhcmdldEVsZW1lbnQuXG4gIHJldHVybiAoXG4gICAgYWN0aW9uRWxlbWVudC50YWdOYW1lID09PSAnQScgJiZcbiAgICAoZXZlbnRJbmZvTGliLmdldEV2ZW50VHlwZShldmVudEluZm8pID09PSBFdmVudFR5cGUuQ0xJQ0sgfHxcbiAgICAgIGV2ZW50SW5mb0xpYi5nZXRFdmVudFR5cGUoZXZlbnRJbmZvKSA9PT0gRXZlbnRUeXBlLkNMSUNLTU9EKVxuICApO1xufVxuIl19