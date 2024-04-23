/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Attribute as AccessibilityAttribute } from './accessibility';
import { Char } from './char';
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
export class Dispatcher {
    /**
     * Receives a DOM event, determines the jsaction associated with the source
     * element of the DOM event, and invokes the handler associated with the
     * jsaction.
     *
     * @param getHandler A function that knows how to get the handler for a
     *     given event info.
     */
    constructor(getHandler, { stopPropagation = false } = {}) {
        this.getHandler = getHandler;
        /**
         * The actions that are registered for this Dispatcher instance.
         * This should be the primary one used once migration off of registerHandlers
         * is done.
         */
        this.actions = {};
        /** The queue of events. */
        this.queuedEventInfos = [];
        /** A map of global event handlers, where each key is an event type. */
        this.globalHandlers_ = new Map();
        this.eventReplayer = null;
        this.eventReplayScheduled = false;
        this.stopPropagation = stopPropagation;
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
            this.queuedEventInfos.push(eventInfoWrapper);
            this.scheduleEventReplay();
            return;
        }
        const resolved = resolveA11yEvent(eventInfoWrapper, isGlobalDispatch);
        if (!resolved) {
            // Reset action information.
            eventInfoWrapper.setAction(undefined);
            return eventInfoWrapper.eventInfo;
        }
        if (isGlobalDispatch) {
            // Skip everything related to jsaction handlers, and execute the global
            // handlers.
            const ev = eventInfoWrapper.getEvent();
            const eventTypeHandlers = this.globalHandlers_.get(eventInfoWrapper.getEventType());
            let shouldPreventDefault = false;
            if (eventTypeHandlers) {
                for (const handler of eventTypeHandlers) {
                    if (handler(ev) === false) {
                        shouldPreventDefault = true;
                    }
                }
            }
            if (shouldPreventDefault) {
                eventLib.preventDefault(ev);
            }
            return;
        }
        // Stop propagation if there's an action.
        if (this.stopPropagation) {
            stopPropagation(eventInfoWrapper);
        }
        const action = eventInfoWrapper.getAction();
        let handler = undefined;
        if (this.getHandler) {
            handler = this.getHandler(eventInfoWrapper);
        }
        if (!handler) {
            handler = this.actions[action.name];
        }
        if (handler) {
            handler(eventInfoWrapper);
            return;
        }
        // No handler was found.
        this.queuedEventInfos.push(eventInfoWrapper);
        return;
    }
    /**
     * Registers multiple methods all bound to the same object
     * instance. This is a common case: an application module binds
     * multiple of its methods under public names to the event contract of
     * the application. So we provide a shortcut for it.
     * Attempts to replay the queued events after registering the handlers.
     *
     * @param namespace The namespace of the jsaction name.
     *
     * @param instance The object to bind the methods to. If this is null, then
     *     the functions are not bound, but directly added under the public names.
     *
     * @param methods A map from public name to functions that will be bound to
     *     instance and registered as action under the public name. I.e. the
     *     property names are the public names. The property values are the
     *     methods of instance.
     */
    registerEventInfoHandlers(namespace, instance, methods) {
        for (const [name, method] of Object.entries(methods)) {
            const handler = instance ? method.bind(instance) : method;
            if (namespace) {
                // Include a '.' separator between namespace name and action name.
                // In the case that no namespace name is provided, the jsaction name
                // consists of the action name only (no period).
                const fullName = namespace + Char.NAMESPACE_ACTION_SEPARATOR + name;
                this.actions[fullName] = handler;
            }
            else {
                this.actions[name] = handler;
            }
        }
        this.scheduleEventReplay();
    }
    /**
     * Unregisters an action.  Provided as an easy way to reverse the effects of
     * registerHandlers.
     * @param namespace The namespace of the jsaction name.
     * @param name The action name to unbind.
     */
    unregisterHandler(namespace, name) {
        const fullName = namespace ? namespace + Char.NAMESPACE_ACTION_SEPARATOR + name : name;
        delete this.actions[fullName];
    }
    /** Registers a global event handler. */
    registerGlobalHandler(eventType, handler) {
        if (!this.globalHandlers_.has(eventType)) {
            this.globalHandlers_.set(eventType, new Set([handler]));
        }
        else {
            this.globalHandlers_.get(eventType).add(handler);
        }
    }
    /** Unregisters a global event handler. */
    unregisterGlobalHandler(eventType, handler) {
        if (this.globalHandlers_.has(eventType)) {
            this.globalHandlers_.get(eventType).delete(handler);
        }
    }
    /**
     * Checks whether there is an action registered under the given
     * name. This returns true if there is a namespace handler, even
     * if it can not yet handle the event.
     *
     * @param name Action name.
     * @return Whether the name is registered.
     * @see #canDispatch
     */
    hasAction(name) {
        return this.actions.hasOwnProperty(name);
    }
    /**
     * Whether this dispatcher can dispatch the event. This can be used by
     * event replayer to check whether the dispatcher can replay an event.
     */
    canDispatch(eventInfoWrapper) {
        const action = eventInfoWrapper.getAction();
        if (!action) {
            return false;
        }
        return this.hasAction(action.name);
    }
    /**
     * Replays queued events, if any. The replaying will happen in its own
     * stack once the current flow cedes control. This is done to mimic
     * browser event handling.
     */
    scheduleEventReplay() {
        if (this.eventReplayScheduled || !this.eventReplayer || this.queuedEventInfos.length === 0) {
            return;
        }
        this.eventReplayScheduled = true;
        Promise.resolve().then(() => {
            this.eventReplayScheduled = false;
            this.eventReplayer(this.queuedEventInfos, this);
        });
    }
    /**
     * Sets the event replayer, enabling queued events to be replayed when actions
     * are bound. To replay events, you must register the dispatcher to the
     * contract after setting the `EventReplayer`. The event replayer takes as
     * parameters the queue of events and the dispatcher (used to check whether
     * actions have handlers registered and can be replayed). The event replayer
     * is also responsible for dequeuing events.
     *
     * Example: An event replayer that replays only the last event.
     *
     *   const dispatcher = new Dispatcher();
     *   // ...
     *   dispatcher.setEventReplayer((queue, dispatcher) => {
     *     const lastEventInfoWrapper = queue[queue.length -1];
     *     if (dispatcher.canDispatch(lastEventInfoWrapper.getAction())) {
     *       jsaction.replay.replayEvent(
     *           lastEventInfoWrapper.getEvent(),
     *           lastEventInfoWrapper.getTargetElement(),
     *           lastEventInfoWrapper.getEventType(),
     *       );
     *       queue.length = 0;
     *     }
     *   });
     *
     * @param eventReplayer It allows elements to be replayed and dequeuing.
     */
    setEventReplayer(eventReplayer) {
        this.eventReplayer = eventReplayer;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlzcGF0Y2hlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvcHJpbWl0aXZlcy9ldmVudC1kaXNwYXRjaC9zcmMvZGlzcGF0Y2hlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsU0FBUyxJQUFJLHNCQUFzQixFQUFDLE1BQU0saUJBQWlCLENBQUM7QUFDcEUsT0FBTyxFQUFDLElBQUksRUFBQyxNQUFNLFFBQVEsQ0FBQztBQUM1QixPQUFPLEtBQUssUUFBUSxNQUFNLFNBQVMsQ0FBQztBQUNwQyxPQUFPLEVBQVksZ0JBQWdCLEVBQUMsTUFBTSxjQUFjLENBQUM7QUFDekQsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLGNBQWMsQ0FBQztBQUV2QyxPQUFPLEVBQUMsV0FBVyxFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQ3JDLE9BQU8sRUFBQyxXQUFXLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFtQjFDOzs7O0dBSUc7QUFDSCxNQUFNLE9BQU8sVUFBVTtJQW9CckI7Ozs7Ozs7T0FPRztJQUNILFlBQ21CLFVBQTRFLEVBQzdGLEVBQUMsZUFBZSxHQUFHLEtBQUssS0FBaUMsRUFBRTtRQUQxQyxlQUFVLEdBQVYsVUFBVSxDQUFrRTtRQTVCL0Y7Ozs7V0FJRztRQUNjLFlBQU8sR0FBc0MsRUFBRSxDQUFDO1FBRWpFLDJCQUEyQjtRQUNWLHFCQUFnQixHQUF1QixFQUFFLENBQUM7UUFFM0QsdUVBQXVFO1FBQ3RELG9CQUFlLEdBQUcsSUFBSSxHQUFHLEVBQThCLENBQUM7UUFFakUsa0JBQWEsR0FBb0IsSUFBSSxDQUFDO1FBRXRDLHlCQUFvQixHQUFHLEtBQUssQ0FBQztRQWdCbkMsSUFBSSxDQUFDLGVBQWUsR0FBRyxlQUFlLENBQUM7SUFDekMsQ0FBQztJQUVEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztPQXVCRztJQUNILFFBQVEsQ0FB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U0FBUyxFQUFFLEtBQUssU0FBUyxDQUFDO1FBQ2hFLFFBQVEsQ0FBQyxnQkFBZ0IsQ0FBQyxnQkFBZ0IsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUN2RCxDQUFDO0FBQ0osQ0FBQztBQUVEOzs7R0FHRztBQUNILE1BQU0sVUFBVSxrQkFBa0IsQ0FBQyxhQUFxQyxFQUFFLFVBQXNCO0lBQzlGLGFBQWEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxTQUFvQixFQUFFLGNBQXdCLEVBQUUsRUFBRTtRQUNwRSxPQUFPLFVBQVUsQ0FBQyxRQUFRLENBQUMsU0FBUyxFQUFFLGNBQWMsQ0FBQyxDQUFDO0lBQ3hELENBQUMsRUFBRSxXQUFXLENBQUMsMkJBQTJCLENBQUMsQ0FBQztBQUM5QyxDQUFDO0FBRUQsMkNBQTJDO0FBQzNDLE1BQU0sVUFBVSxlQUFlLENBQUMsZ0JBQWtDO0lBQ2hFLElBQ0UsUUFBUSxDQUFDLE9BQU87UUFDaEIsQ0FBQyxnQkFBZ0IsQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDLE9BQU8sS0FBSyxPQUFPO1lBQ3RELGdCQUFnQixDQUFDLGdCQUFnQixFQUFFLENBQUMsT0FBTyxLQUFLLFVBQVUsQ0FBQztRQUM3RCxnQkFBZ0IsQ0FBQyxZQUFZLEVBQUUsS0FBSyxTQUFTLENBQUMsS0FBSyxFQUNuRCxDQUFDO1FBQ0Q7Ozs7V0FJRztRQUNILE9BQU87SUFDVCxDQUFDO0lBRUQsTUFBTSxLQUFLLEdBQUcsZ0JBQWdCLENBQUMsUUFBUSxFQUFFLENBQUM7SUFDMUMsMEVBQTBFO0lBQzFFLDZEQUE2RDtJQUM3RCxJQUFJLENBQUMsS0FBSyxDQUFDLGVBQWUsRUFBRSxDQUFDO1FBQzNCLE9BQU87SUFDVCxDQUFDO0lBQ0QsS0FBSyxDQUFDLGVBQWUsRUFBRSxDQUFDO0FBQzFCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtBdHRyaWJ1dGUgYXMgQWNjZXNzaWJpbGl0eUF0dHJpYnV0ZX0gZnJvbSAnLi9hY2Nlc3NpYmlsaXR5JztcbmltcG9ydCB7Q2hhcn0gZnJvbSAnLi9jaGFyJztcbmltcG9ydCAqIGFzIGV2ZW50TGliIGZyb20gJy4vZXZlbnQnO1xuaW1wb3J0IHtFdmVudEluZm8sIEV2ZW50SW5mb1dyYXBwZXJ9IGZyb20gJy4vZXZlbnRfaW5mbyc7XG5pbXBvcnQge0V2ZW50VHlwZX0gZnJvbSAnLi9ldmVudF90eXBlJztcbmltcG9ydCB7VW5yZW5hbWVkRXZlbnRDb250cmFjdH0gZnJvbSAnLi9ldmVudGNvbnRyYWN0JztcbmltcG9ydCB7cmVwbGF5RXZlbnR9IGZyb20gJy4vcmVwbGF5JztcbmltcG9ydCB7UmVzdHJpY3Rpb259IGZyb20gJy4vcmVzdHJpY3Rpb24nO1xuXG4vKipcbiAqIEEgcmVwbGF5ZXIgaXMgYSBmdW5jdGlvbiB0aGF0IGlzIGNhbGxlZCB3aGVuIHRoZXJlIGFyZSBxdWV1ZWQgZXZlbnRzLFxuICogZWl0aGVyIGZyb20gdGhlIGBFdmVudENvbnRyYWN0YCBvciB3aGVuIHRoZXJlIGFyZSBubyBkZXRlY3RlZCBoYW5kbGVycy5cbiAqL1xuZXhwb3J0IHR5cGUgUmVwbGF5ZXIgPSAoZXZlbnRJbmZvV3JhcHBlcnM6IEV2ZW50SW5mb1dyYXBwZXJbXSwgZGlzcGF0Y2hlcjogRGlzcGF0Y2hlcikgPT4gdm9pZDtcblxuLyoqXG4gKiBBIGdsb2JhbCBoYW5kbGVyIGlzIGRpc3BhdGNoZWQgdG8gYmVmb3JlIG5vcm1hbCBoYW5kbGVyIGRpc3BhdGNoLiBSZXR1cm5pbmdcbiAqIGZhbHNlIHdpbGwgYHByZXZlbnREZWZhdWx0YCBvbiB0aGUgZXZlbnQuXG4gKi9cbmV4cG9ydCB0eXBlIEdsb2JhbEhhbmRsZXIgPSAoZXZlbnQ6IEV2ZW50KSA9PiBib29sZWFuIHwgdm9pZDtcblxuLyoqXG4gKiBBIGhhbmRsZXIgaXMgZGlzcGF0Y2hlZCB0byBkdXJpbmcgbm9ybWFsIGhhbmRsaW5nLlxuICovXG5leHBvcnQgdHlwZSBFdmVudEluZm9IYW5kbGVyID0gKGV2ZW50SW5mb1dyYXBwZXI6IEV2ZW50SW5mb1dyYXBwZXIpID0+IHZvaWQ7XG5cbi8qKlxuICogUmVjZWl2ZXMgYSBET00gZXZlbnQsIGRldGVybWluZXMgdGhlIGpzYWN0aW9uIGFzc29jaWF0ZWQgd2l0aCB0aGUgc291cmNlXG4gKiBlbGVtZW50IG9mIHRoZSBET00gZXZlbnQsIGFuZCBpbnZva2VzIHRoZSBoYW5kbGVyIGFzc29jaWF0ZWQgd2l0aCB0aGVcbiAqIGpzYWN0aW9uLlxuICovXG5leHBvcnQgY2xhc3MgRGlzcGF0Y2hlciB7XG4gIC8qKlxuICAgKiBUaGUgYWN0aW9ucyB0aGF0IGFyZSByZWdpc3RlcmVkIGZvciB0aGlzIERpc3BhdGNoZXIgaW5zdGFuY2UuXG4gICAqIFRoaXMgc2hvdWxkIGJlIHRoZSBwcmltYXJ5IG9uZSB1c2VkIG9uY2UgbWlncmF0aW9uIG9mZiBvZiByZWdpc3RlckhhbmRsZXJzXG4gICAqIGlzIGRvbmUuXG4gICAqL1xuICBwcml2YXRlIHJlYWRvbmx5IGFjdGlvbnM6IHtba2V5OiBzdHJpbmddOiBFdmVudEluZm9IYW5kbGVyfSA9IHt9O1xuXG4gIC8qKiBUaGUgcXVldWUgb2YgZXZlbnRzLiAqL1xuICBwcml2YXRlIHJlYWRvbmx5IHF1ZXVlZEV2ZW50SW5mb3M6IEV2ZW50SW5mb1dyYXBwZXJbXSA9IFtdO1xuXG4gIC8qKiBBIG1hcCBvZiBnbG9iYWwgZXZlbnQgaGFuZGxlcnMsIHdoZXJlIGVhY2gga2V5IGlzIGFuIGV2ZW50IHR5cGUuICovXG4gIHByaXZhdGUgcmVhZG9ubHkgZ2xvYmFsSGFuZGxlcnNfID0gbmV3IE1hcDxzdHJpbmcsIFNldDxHbG9iYWxIYW5kbGVyPj4oKTtcblxuICBwcml2YXRlIGV2ZW50UmVwbGF5ZXI6IFJlcGxheWVyIHwgbnVsbCA9IG51bGw7XG5cbiAgcHJpdmF0ZSBldmVudFJlcGxheVNjaGVkdWxlZCA9IGZhbHNlO1xuXG4gIHByaXZhdGUgcmVhZG9ubHkgc3RvcFByb3BhZ2F0aW9uOiBib29sZWFuO1xuXG4gIC8qKlxuICAgKiBSZWNlaXZlcyBhIERPTSBldmVudCwgZGV0ZXJtaW5lcyB0aGUganNhY3Rpb24gYXNzb2NpYXRlZCB3aXRoIHRoZSBzb3VyY2VcbiAgICogZWxlbWVudCBvZiB0aGUgRE9NIGV2ZW50LCBhbmQgaW52b2tlcyB0aGUgaGFuZGxlciBhc3NvY2lhdGVkIHdpdGggdGhlXG4gICAqIGpzYWN0aW9uLlxuICAgKlxuICAgKiBAcGFyYW0gZ2V0SGFuZGxlciBBIGZ1bmN0aW9uIHRoYXQga25vd3MgaG93IHRvIGdldCB0aGUgaGFuZGxlciBmb3IgYVxuICAgKiAgICAgZ2l2ZW4gZXZlbnQgaW5mby5cbiAgICovXG4gIGNvbnN0cnVjdG9yKFxuICAgIHByaXZhdGUgcmVhZG9ubHkgZ2V0SGFuZGxlcj86IChldmVudEluZm9XcmFwcGVyOiBFdmVudEluZm9XcmFwcGVyKSA9PiBFdmVudEluZm9IYW5kbGVyIHwgdm9pZCxcbiAgICB7c3RvcFByb3BhZ2F0aW9uID0gZmFsc2V9OiB7c3RvcFByb3BhZ2F0aW9uPzogYm9vbGVhbn0gPSB7fSxcbiAgKSB7XG4gICAgdGhpcy5zdG9wUHJvcGFnYXRpb24gPSBzdG9wUHJvcGFnYXRpb247XG4gIH1cblxuICAvKipcbiAgICogUmVjZWl2ZXMgYW4gZXZlbnQgb3IgdGhlIGV2ZW50IHF1ZXVlIGZyb20gdGhlIEV2ZW50Q29udHJhY3QuIFRoZSBldmVudFxuICAgKiBxdWV1ZSBpcyBjb3BpZWQgYW5kIGl0IGF0dGVtcHRzIHRvIHJlcGxheS5cbiAgICogSWYgZXZlbnQgaW5mbyBpcyBwYXNzZWQgaW4gaXQgbG9va3MgZm9yIGFuIGFjdGlvbiBoYW5kbGVyIHRoYXQgY2FuIGhhbmRsZVxuICAgKiB0aGUgZ2l2ZW4gZXZlbnQuICBJZiB0aGVyZSBpcyBubyBoYW5kbGVyIHJlZ2lzdGVyZWQgcXVldWVzIHRoZSBldmVudCBhbmRcbiAgICogY2hlY2tzIGlmIGEgbG9hZGVyIGlzIHJlZ2lzdGVyZWQgZm9yIHRoZSBnaXZlbiBuYW1lc3BhY2UuIElmIHNvLCBjYWxscyBpdC5cbiAgICpcbiAgICogQWx0ZXJuYXRpdmVseSwgaWYgaW4gZ2xvYmFsIGRpc3BhdGNoIG1vZGUsIGNhbGxzIGFsbCByZWdpc3RlcmVkIGdsb2JhbFxuICAgKiBoYW5kbGVycyBmb3IgdGhlIGFwcHJvcHJpYXRlIGV2ZW50IHR5cGUuXG4gICAqXG4gICAqIFRoZSB0aHJlZSBmdW5jdGlvbmFsaXRpZXMgb2YgdGhpcyBjYWxsIGFyZSBkZWxpYmVyYXRlbHkgbm90IHNwbGl0IGludG9cbiAgICogdGhyZWUgbWV0aG9kcyAoYW5kIHRoZW4gZGVjbGFyZWQgYXMgYW4gYWJzdHJhY3QgaW50ZXJmYWNlKSwgYmVjYXVzZSB0aGVcbiAgICogaW50ZXJmYWNlIGlzIHVzZWQgYnkgRXZlbnRDb250cmFjdCwgd2hpY2ggbGl2ZXMgaW4gYSBkaWZmZXJlbnQganNiaW5hcnkuXG4gICAqIFRoZXJlZm9yZSB0aGUgaW50ZXJmYWNlIGJldHdlZW4gdGhlIHRocmVlIGlzIGRlZmluZWQgZW50aXJlbHkgaW4gdGVybXMgdGhhdFxuICAgKiBhcmUgaW52YXJpYW50IHVuZGVyIGpzY29tcGlsZXIgcHJvY2Vzc2luZyAoRnVuY3Rpb24gYW5kIEFycmF5LCBhcyBvcHBvc2VkXG4gICAqIHRvIGEgY3VzdG9tIHR5cGUgd2l0aCBtZXRob2QgbmFtZXMpLlxuICAgKlxuICAgKiBAcGFyYW0gZXZlbnRJbmZvIFRoZSBpbmZvIGZvciB0aGUgZXZlbnQgdGhhdCB0cmlnZ2VyZWQgdGhpcyBjYWxsIG9yIHRoZVxuICAgKiAgICAgcXVldWUgb2YgZXZlbnRzIGZyb20gRXZlbnRDb250cmFjdC5cbiAgICogQHBhcmFtIGlzR2xvYmFsRGlzcGF0Y2ggSWYgdHJ1ZSwgZGlzcGF0Y2hlcyBhIGdsb2JhbCBldmVudCBpbnN0ZWFkIG9mIGFcbiAgICogICAgIHJlZ3VsYXIganNhY3Rpb24gaGFuZGxlci5cbiAgICogQHJldHVybiBBbiBgRXZlbnRJbmZvYCBmb3IgdGhlIGBFdmVudENvbnRyYWN0YCB0byBoYW5kbGUgYWdhaW4gaWYgdGhlXG4gICAqICAgIGBEaXNwYXRjaGVyYCB0cmllZCB0byByZXNvbHZlIGFuIGExMXkgZXZlbnQgYXMgYSBjbGljayBidXQgZmFpbGVkLlxuICAgKi9cbiAgZGlzcGF0Y2goZXZlbnRJbmZvOiBFdmVudEluZm8sIGlzR2xvYmFsRGlzcGF0Y2g/OiBib29sZWFuKTogRXZlbnRJbmZvIHwgdm9pZCB7XG4gICAgY29uc3QgZXZlbnRJbmZvV3JhcHBlciA9IG5ldyBFdmVudEluZm9XcmFwcGVyKGV2ZW50SW5mbyk7XG4gICAgaWYgKGV2ZW50SW5mb1dyYXBwZXIuZ2V0SXNSZXBsYXkoKSkge1xuICAgICAgaWYgKGlzR2xvYmFsRGlzcGF0Y2ggfHwgIXRoaXMuZXZlbnRSZXBsYXllcikge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBjb25zdCByZXNvbHZlZCA9IHJlc29sdmVBMTF5RXZlbnQoZXZlbnRJbmZvV3JhcHBlciwgaXNHbG9iYWxEaXNwYXRjaCk7XG4gICAgICBpZiAoIXJlc29sdmVkKSB7XG4gICAgICAgIC8vIFNlbmQgdGhlIGV2ZW50IGJhY2sgdGhyb3VnaCB0aGUgYEV2ZW50Q29udHJhY3RgIGJ5IGRpc3BhdGNoaW5nIHRvXG4gICAgICAgIC8vIHRoZSBicm93c2VyLlxuICAgICAgICByZXBsYXlFdmVudChcbiAgICAgICAgICBldmVudEluZm9XcmFwcGVyLmdldEV2ZW50KCksXG4gICAgICAgICAgZXZlbnRJbmZvV3JhcHBlci5nZXRUYXJnZXRFbGVtZW50KCksXG4gICAgICAgICAgZXZlbnRJbmZvV3JhcHBlci5nZXRFdmVudFR5cGUoKSxcbiAgICAgICAgKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgdGhpcy5xdWV1ZWRFdmVudEluZm9zLnB1c2goZXZlbnRJbmZvV3JhcHBlcik7XG4gICAgICB0aGlzLnNjaGVkdWxlRXZlbnRSZXBsYXkoKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCByZXNvbHZlZCA9IHJlc29sdmVBMTF5RXZlbnQoZXZlbnRJbmZvV3JhcHBlciwgaXNHbG9iYWxEaXNwYXRjaCk7XG4gICAgaWYgKCFyZXNvbHZlZCkge1xuICAgICAgLy8gUmVzZXQgYWN0aW9uIGluZm9ybWF0aW9uLlxuICAgICAgZXZlbnRJbmZvV3JhcHBlci5zZXRBY3Rpb24odW5kZWZpbmVkKTtcbiAgICAgIHJldHVybiBldmVudEluZm9XcmFwcGVyLmV2ZW50SW5mbztcbiAgICB9XG5cbiAgICBpZiAoaXNHbG9iYWxEaXNwYXRjaCkge1xuICAgICAgLy8gU2tpcCBldmVyeXRoaW5nIHJlbGF0ZWQgdG8ganNhY3Rpb24gaGFuZGxlcnMsIGFuZCBleGVjdXRlIHRoZSBnbG9iYWxcbiAgICAgIC8vIGhhbmRsZXJzLlxuICAgICAgY29uc3QgZXYgPSBldmVudEluZm9XcmFwcGVyLmdldEV2ZW50KCk7XG4gICAgICBjb25zdCBldmVudFR5cGVIYW5kbGVycyA9IHRoaXMuZ2xvYmFsSGFuZGxlcnNfLmdldChldmVudEluZm9XcmFwcGVyLmdldEV2ZW50VHlwZSgpKTtcbiAgICAgIGxldCBzaG91bGRQcmV2ZW50RGVmYXVsdCA9IGZhbHNlO1xuICAgICAgaWYgKGV2ZW50VHlwZUhhbmRsZXJzKSB7XG4gICAgICAgIGZvciAoY29uc3QgaGFuZGxlciBvZiBldmVudFR5cGVIYW5kbGVycykge1xuICAgICAgICAgIGlmIChoYW5kbGVyKGV2KSA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgIHNob3VsZFByZXZlbnREZWZhdWx0ID0gdHJ1ZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmIChzaG91bGRQcmV2ZW50RGVmYXVsdCkge1xuICAgICAgICBldmVudExpYi5wcmV2ZW50RGVmYXVsdChldik7XG4gICAgICB9XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gU3RvcCBwcm9wYWdhdGlvbiBpZiB0aGVyZSdzIGFuIGFjdGlvbi5cbiAgICBpZiAodGhpcy5zdG9wUHJvcGFnYXRpb24pIHtcbiAgICAgIHN0b3BQcm9wYWdhdGlvbihldmVudEluZm9XcmFwcGVyKTtcbiAgICB9XG5cbiAgICBjb25zdCBhY3Rpb24gPSBldmVudEluZm9XcmFwcGVyLmdldEFjdGlvbigpITtcblxuICAgIGxldCBoYW5kbGVyOiBFdmVudEluZm9IYW5kbGVyIHwgdm9pZCA9IHVuZGVmaW5lZDtcbiAgICBpZiAodGhpcy5nZXRIYW5kbGVyKSB7XG4gICAgICBoYW5kbGVyID0gdGhpcy5nZXRIYW5kbGVyKGV2ZW50SW5mb1dyYXBwZXIpO1xuICAgIH1cblxuICAgIGlmICghaGFuZGxlcikge1xuICAgICAgaGFuZGxlciA9IHRoaXMuYWN0aW9uc1thY3Rpb24ubmFtZV07XG4gICAgfVxuXG4gICAgaWYgKGhhbmRsZXIpIHtcbiAgICAgIGhhbmRsZXIoZXZlbnRJbmZvV3JhcHBlcik7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gTm8gaGFuZGxlciB3YXMgZm91bmQuXG4gICAgdGhpcy5xdWV1ZWRFdmVudEluZm9zLnB1c2goZXZlbnRJbmZvV3JhcHBlcik7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlZ2lzdGVycyBtdWx0aXBsZSBtZXRob2RzIGFsbCBib3VuZCB0byB0aGUgc2FtZSBvYmplY3RcbiAgICogaW5zdGFuY2UuIFRoaXMgaXMgYSBjb21tb24gY2FzZTogYW4gYXBwbGljYXRpb24gbW9kdWxlIGJpbmRzXG4gICAqIG11bHRpcGxlIG9mIGl0cyBtZXRob2RzIHVuZGVyIHB1YmxpYyBuYW1lcyB0byB0aGUgZXZlbnQgY29udHJhY3Qgb2ZcbiAgICogdGhlIGFwcGxpY2F0aW9uLiBTbyB3ZSBwcm92aWRlIGEgc2hvcnRjdXQgZm9yIGl0LlxuICAgKiBBdHRlbXB0cyB0byByZXBsYXkgdGhlIHF1ZXVlZCBldmVudHMgYWZ0ZXIgcmVnaXN0ZXJpbmcgdGhlIGhhbmRsZXJzLlxuICAgKlxuICAgKiBAcGFyYW0gbmFtZXNwYWNlIFRoZSBuYW1lc3BhY2Ugb2YgdGhlIGpzYWN0aW9uIG5hbWUuXG4gICAqXG4gICAqIEBwYXJhbSBpbnN0YW5jZSBUaGUgb2JqZWN0IHRvIGJpbmQgdGhlIG1ldGhvZHMgdG8uIElmIHRoaXMgaXMgbnVsbCwgdGhlblxuICAgKiAgICAgdGhlIGZ1bmN0aW9ucyBhcmUgbm90IGJvdW5kLCBidXQgZGlyZWN0bHkgYWRkZWQgdW5kZXIgdGhlIHB1YmxpYyBuYW1lcy5cbiAgICpcbiAgICogQHBhcmFtIG1ldGhvZHMgQSBtYXAgZnJvbSBwdWJsaWMgbmFtZSB0byBmdW5jdGlvbnMgdGhhdCB3aWxsIGJlIGJvdW5kIHRvXG4gICAqICAgICBpbnN0YW5jZSBhbmQgcmVnaXN0ZXJlZCBhcyBhY3Rpb24gdW5kZXIgdGhlIHB1YmxpYyBuYW1lLiBJLmUuIHRoZVxuICAgKiAgICAgcHJvcGVydHkgbmFtZXMgYXJlIHRoZSBwdWJsaWMgbmFtZXMuIFRoZSBwcm9wZXJ0eSB2YWx1ZXMgYXJlIHRoZVxuICAgKiAgICAgbWV0aG9kcyBvZiBpbnN0YW5jZS5cbiAgICovXG4gIHJlZ2lzdGVyRXZlbnRJbmZvSGFuZGxlcnM8VD4oXG4gICAgbmFtZXNwYWNlOiBzdHJpbmcsXG4gICAgaW5zdGFuY2U6IFQgfCBudWxsLFxuICAgIG1ldGhvZHM6IHtba2V5OiBzdHJpbmddOiBFdmVudEluZm9IYW5kbGVyfSxcbiAgKSB7XG4gICAgZm9yIChjb25zdCBbbmFtZSwgbWV0aG9kXSBvZiBPYmplY3QuZW50cmllcyhtZXRob2RzKSkge1xuICAgICAgY29uc3QgaGFuZGxlciA9IGluc3RhbmNlID8gbWV0aG9kLmJpbmQoaW5zdGFuY2UpIDogbWV0aG9kO1xuICAgICAgaWYgKG5hbWVzcGFjZSkge1xuICAgICAgICAvLyBJbmNsdWRlIGEgJy4nIHNlcGFyYXRvciBiZXR3ZWVuIG5hbWVzcGFjZSBuYW1lIGFuZCBhY3Rpb24gbmFtZS5cbiAgICAgICAgLy8gSW4gdGhlIGNhc2UgdGhhdCBubyBuYW1lc3BhY2UgbmFtZSBpcyBwcm92aWRlZCwgdGhlIGpzYWN0aW9uIG5hbWVcbiAgICAgICAgLy8gY29uc2lzdHMgb2YgdGhlIGFjdGlvbiBuYW1lIG9ubHkgKG5vIHBlcmlvZCkuXG4gICAgICAgIGNvbnN0IGZ1bGxOYW1lID0gbmFtZXNwYWNlICsgQ2hhci5OQU1FU1BBQ0VfQUNUSU9OX1NFUEFSQVRPUiArIG5hbWU7XG4gICAgICAgIHRoaXMuYWN0aW9uc1tmdWxsTmFtZV0gPSBoYW5kbGVyO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5hY3Rpb25zW25hbWVdID0gaGFuZGxlcjtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLnNjaGVkdWxlRXZlbnRSZXBsYXkoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVbnJlZ2lzdGVycyBhbiBhY3Rpb24uICBQcm92aWRlZCBhcyBhbiBlYXN5IHdheSB0byByZXZlcnNlIHRoZSBlZmZlY3RzIG9mXG4gICAqIHJlZ2lzdGVySGFuZGxlcnMuXG4gICAqIEBwYXJhbSBuYW1lc3BhY2UgVGhlIG5hbWVzcGFjZSBvZiB0aGUganNhY3Rpb24gbmFtZS5cbiAgICogQHBhcmFtIG5hbWUgVGhlIGFjdGlvbiBuYW1lIHRvIHVuYmluZC5cbiAgICovXG4gIHVucmVnaXN0ZXJIYW5kbGVyKG5hbWVzcGFjZTogc3RyaW5nLCBuYW1lOiBzdHJpbmcpIHtcbiAgICBjb25zdCBmdWxsTmFtZSA9IG5hbWVzcGFjZSA/IG5hbWVzcGFjZSArIENoYXIuTkFNRVNQQUNFX0FDVElPTl9TRVBBUkFUT1IgKyBuYW1lIDogbmFtZTtcbiAgICBkZWxldGUgdGhpcy5hY3Rpb25zW2Z1bGxOYW1lXTtcbiAgfVxuXG4gIC8qKiBSZWdpc3RlcnMgYSBnbG9iYWwgZXZlbnQgaGFuZGxlci4gKi9cbiAgcmVnaXN0ZXJHbG9iYWxIYW5kbGVyKGV2ZW50VHlwZTogc3RyaW5nLCBoYW5kbGVyOiBHbG9iYWxIYW5kbGVyKSB7XG4gICAgaWYgKCF0aGlzLmdsb2JhbEhhbmRsZXJzXy5oYXMoZXZlbnRUeXBlKSkge1xuICAgICAgdGhpcy5nbG9iYWxIYW5kbGVyc18uc2V0KGV2ZW50VHlwZSwgbmV3IFNldDxHbG9iYWxIYW5kbGVyPihbaGFuZGxlcl0pKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5nbG9iYWxIYW5kbGVyc18uZ2V0KGV2ZW50VHlwZSkhLmFkZChoYW5kbGVyKTtcbiAgICB9XG4gIH1cblxuICAvKiogVW5yZWdpc3RlcnMgYSBnbG9iYWwgZXZlbnQgaGFuZGxlci4gKi9cbiAgdW5yZWdpc3Rlckdsb2JhbEhhbmRsZXIoZXZlbnRUeXBlOiBzdHJpbmcsIGhhbmRsZXI6IEdsb2JhbEhhbmRsZXIpIHtcbiAgICBpZiAodGhpcy5nbG9iYWxIYW5kbGVyc18uaGFzKGV2ZW50VHlwZSkpIHtcbiAgICAgIHRoaXMuZ2xvYmFsSGFuZGxlcnNfLmdldChldmVudFR5cGUpIS5kZWxldGUoaGFuZGxlcik7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrcyB3aGV0aGVyIHRoZXJlIGlzIGFuIGFjdGlvbiByZWdpc3RlcmVkIHVuZGVyIHRoZSBnaXZlblxuICAgKiBuYW1lLiBUaGlzIHJldHVybnMgdHJ1ZSBpZiB0aGVyZSBpcyBhIG5hbWVzcGFjZSBoYW5kbGVyLCBldmVuXG4gICAqIGlmIGl0IGNhbiBub3QgeWV0IGhhbmRsZSB0aGUgZXZlbnQuXG4gICAqXG4gICAqIEBwYXJhbSBuYW1lIEFjdGlvbiBuYW1lLlxuICAgKiBAcmV0dXJuIFdoZXRoZXIgdGhlIG5hbWUgaXMgcmVnaXN0ZXJlZC5cbiAgICogQHNlZSAjY2FuRGlzcGF0Y2hcbiAgICovXG4gIGhhc0FjdGlvbihuYW1lOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5hY3Rpb25zLmhhc093blByb3BlcnR5KG5hbWUpO1xuICB9XG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgdGhpcyBkaXNwYXRjaGVyIGNhbiBkaXNwYXRjaCB0aGUgZXZlbnQuIFRoaXMgY2FuIGJlIHVzZWQgYnlcbiAgICogZXZlbnQgcmVwbGF5ZXIgdG8gY2hlY2sgd2hldGhlciB0aGUgZGlzcGF0Y2hlciBjYW4gcmVwbGF5IGFuIGV2ZW50LlxuICAgKi9cbiAgY2FuRGlzcGF0Y2goZXZlbnRJbmZvV3JhcHBlcjogRXZlbnRJbmZvV3JhcHBlcik6IGJvb2xlYW4ge1xuICAgIGNvbnN0IGFjdGlvbiA9IGV2ZW50SW5mb1dyYXBwZXIuZ2V0QWN0aW9uKCk7XG4gICAgaWYgKCFhY3Rpb24pIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuaGFzQWN0aW9uKGFjdGlvbi5uYW1lKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXBsYXlzIHF1ZXVlZCBldmVudHMsIGlmIGFueS4gVGhlIHJlcGxheWluZyB3aWxsIGhhcHBlbiBpbiBpdHMgb3duXG4gICAqIHN0YWNrIG9uY2UgdGhlIGN1cnJlbnQgZmxvdyBjZWRlcyBjb250cm9sLiBUaGlzIGlzIGRvbmUgdG8gbWltaWNcbiAgICogYnJvd3NlciBldmVudCBoYW5kbGluZy5cbiAgICovXG4gIHByaXZhdGUgc2NoZWR1bGVFdmVudFJlcGxheSgpIHtcbiAgICBpZiAodGhpcy5ldmVudFJlcGxheVNjaGVkdWxlZCB8fCAhdGhpcy5ldmVudFJlcGxheWVyIHx8IHRoaXMucXVldWVkRXZlbnRJbmZvcy5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLmV2ZW50UmVwbGF5U2NoZWR1bGVkID0gdHJ1ZTtcbiAgICBQcm9taXNlLnJlc29sdmUoKS50aGVuKCgpID0+IHtcbiAgICAgIHRoaXMuZXZlbnRSZXBsYXlTY2hlZHVsZWQgPSBmYWxzZTtcbiAgICAgIHRoaXMuZXZlbnRSZXBsYXllciEodGhpcy5xdWV1ZWRFdmVudEluZm9zLCB0aGlzKTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBldmVudCByZXBsYXllciwgZW5hYmxpbmcgcXVldWVkIGV2ZW50cyB0byBiZSByZXBsYXllZCB3aGVuIGFjdGlvbnNcbiAgICogYXJlIGJvdW5kLiBUbyByZXBsYXkgZXZlbnRzLCB5b3UgbXVzdCByZWdpc3RlciB0aGUgZGlzcGF0Y2hlciB0byB0aGVcbiAgICogY29udHJhY3QgYWZ0ZXIgc2V0dGluZyB0aGUgYEV2ZW50UmVwbGF5ZXJgLiBUaGUgZXZlbnQgcmVwbGF5ZXIgdGFrZXMgYXNcbiAgICogcGFyYW1ldGVycyB0aGUgcXVldWUgb2YgZXZlbnRzIGFuZCB0aGUgZGlzcGF0Y2hlciAodXNlZCB0byBjaGVjayB3aGV0aGVyXG4gICAqIGFjdGlvbnMgaGF2ZSBoYW5kbGVycyByZWdpc3RlcmVkIGFuZCBjYW4gYmUgcmVwbGF5ZWQpLiBUaGUgZXZlbnQgcmVwbGF5ZXJcbiAgICogaXMgYWxzbyByZXNwb25zaWJsZSBmb3IgZGVxdWV1aW5nIGV2ZW50cy5cbiAgICpcbiAgICogRXhhbXBsZTogQW4gZXZlbnQgcmVwbGF5ZXIgdGhhdCByZXBsYXlzIG9ubHkgdGhlIGxhc3QgZXZlbnQuXG4gICAqXG4gICAqICAgY29uc3QgZGlzcGF0Y2hlciA9IG5ldyBEaXNwYXRjaGVyKCk7XG4gICAqICAgLy8gLi4uXG4gICAqICAgZGlzcGF0Y2hlci5zZXRFdmVudFJlcGxheWVyKChxdWV1ZSwgZGlzcGF0Y2hlcikgPT4ge1xuICAgKiAgICAgY29uc3QgbGFzdEV2ZW50SW5mb1dyYXBwZXIgPSBxdWV1ZVtxdWV1ZS5sZW5ndGggLTFdO1xuICAgKiAgICAgaWYgKGRpc3BhdGNoZXIuY2FuRGlzcGF0Y2gobGFzdEV2ZW50SW5mb1dyYXBwZXIuZ2V0QWN0aW9uKCkpKSB7XG4gICAqICAgICAgIGpzYWN0aW9uLnJlcGxheS5yZXBsYXlFdmVudChcbiAgICogICAgICAgICAgIGxhc3RFdmVudEluZm9XcmFwcGVyLmdldEV2ZW50KCksXG4gICAqICAgICAgICAgICBsYXN0RXZlbnRJbmZvV3JhcHBlci5nZXRUYXJnZXRFbGVtZW50KCksXG4gICAqICAgICAgICAgICBsYXN0RXZlbnRJbmZvV3JhcHBlci5nZXRFdmVudFR5cGUoKSxcbiAgICogICAgICAgKTtcbiAgICogICAgICAgcXVldWUubGVuZ3RoID0gMDtcbiAgICogICAgIH1cbiAgICogICB9KTtcbiAgICpcbiAgICogQHBhcmFtIGV2ZW50UmVwbGF5ZXIgSXQgYWxsb3dzIGVsZW1lbnRzIHRvIGJlIHJlcGxheWVkIGFuZCBkZXF1ZXVpbmcuXG4gICAqL1xuICBzZXRFdmVudFJlcGxheWVyKGV2ZW50UmVwbGF5ZXI6IFJlcGxheWVyKSB7XG4gICAgdGhpcy5ldmVudFJlcGxheWVyID0gZXZlbnRSZXBsYXllcjtcbiAgfVxufVxuXG4vKipcbiAqIElmIGEgJ01BWUJFX0NMSUNLX0VWRU5UX1RZUEUnIGV2ZW50IHdhcyBkaXNwYXRjaGVkLCB1cGRhdGVzIHRoZSBldmVudFR5cGVcbiAqIHRvIGVpdGhlciBjbGljayBvciBrZXlkb3duIGJhc2VkIG9uIHdoZXRoZXIgdGhlIGtleWRvd24gYWN0aW9uIGNhbiBiZVxuICogdHJlYXRlZCBhcyBhIGNsaWNrLiBGb3IgTUFZQkVfQ0xJQ0tfRVZFTlRfVFlQRSBldmVudHMgdGhhdCBhcmUganVzdFxuICoga2V5ZG93bnMsIHdlIHNldCBmbGFncyBvbiB0aGUgZXZlbnQgb2JqZWN0IHNvIHRoYXQgdGhlIGV2ZW50IGNvbnRyYWN0XG4gKiBkb2VzJ3QgdHJ5IHRvIGRpc3BhdGNoIGl0IGFzIGEgTUFZQkVfQ0xJQ0tfRVZFTlRfVFlQRSBhZ2Fpbi5cbiAqXG4gKiBAcGFyYW0gaXNHbG9iYWxEaXNwYXRjaCBXaGV0aGVyIHRoZSBldmVudEluZm8gaXMgbWVhbnQgdG8gYmUgZGlzcGF0Y2hlZCB0b1xuICogICAgIHRoZSBnbG9iYWwgaGFuZGxlcnMuXG4gKiBAcmV0dXJuIFJldHVybnMgZmFsc2UgaWYgdGhlIGExMXkgZXZlbnQgY291bGQgbm90IGJlIHJlc29sdmVkIGFuZCBzaG91bGRcbiAqICAgIGJlIHJlLWRpc3BhdGNoZWQuXG4gKi9cbmZ1bmN0aW9uIHJlc29sdmVBMTF5RXZlbnQoZXZlbnRJbmZvV3JhcHBlcjogRXZlbnRJbmZvV3JhcHBlciwgaXNHbG9iYWxEaXNwYXRjaCA9IGZhbHNlKTogYm9vbGVhbiB7XG4gIGlmIChldmVudEluZm9XcmFwcGVyLmdldEV2ZW50VHlwZSgpICE9PSBBY2Nlc3NpYmlsaXR5QXR0cmlidXRlLk1BWUJFX0NMSUNLX0VWRU5UX1RZUEUpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIGlmIChpc0ExMXlDbGlja0V2ZW50KGV2ZW50SW5mb1dyYXBwZXIsIGlzR2xvYmFsRGlzcGF0Y2gpKSB7XG4gICAgaWYgKHNob3VsZFByZXZlbnREZWZhdWx0KGV2ZW50SW5mb1dyYXBwZXIpKSB7XG4gICAgICBldmVudExpYi5wcmV2ZW50RGVmYXVsdChldmVudEluZm9XcmFwcGVyLmdldEV2ZW50KCkpO1xuICAgIH1cbiAgICAvLyBJZiB0aGUga2V5ZG93biBldmVudCBjYW4gYmUgdHJlYXRlZCBhcyBhIGNsaWNrLCB3ZSBjaGFuZ2UgdGhlIGV2ZW50VHlwZVxuICAgIC8vIHRvICdjbGljaycgc28gdGhhdCB0aGUgZGlzcGF0Y2hlciBjYW4gcmV0cmlldmUgdGhlIHJpZ2h0IGhhbmRsZXIgZm9yXG4gICAgLy8gaXQuIEV2ZW4gdGhvdWdoIEV2ZW50SW5mb1snYWN0aW9uJ10gY29ycmVzcG9uZHMgdG8gdGhlIGNsaWNrIGFjdGlvbixcbiAgICAvLyB0aGUgZ2xvYmFsIGhhbmRsZXIgYW5kIGFueSBjdXN0b20gJ2dldEhhbmRsZXInIGltcGxlbWVudGF0aW9ucyBtYXkgcmVseVxuICAgIC8vIG9uIHRoZSBldmVudFR5cGUgaW5zdGVhZC5cbiAgICBldmVudEluZm9XcmFwcGVyLnNldEV2ZW50VHlwZShFdmVudFR5cGUuQ0xJQ0spO1xuICB9IGVsc2Uge1xuICAgIC8vIE90aGVyd2lzZSwgaWYgdGhlIGtleWRvd24gY2FuJ3QgYmUgdHJlYXRlZCBhcyBhIGNsaWNrLCB3ZSBuZWVkIHRvXG4gICAgLy8gcmV0cmlnZ2VyIGl0IGJlY2F1c2Ugbm93IHdlIG5lZWQgdG8gbG9vayBmb3IgJ2tleWRvd24nIGFjdGlvbnMgaW5zdGVhZC5cbiAgICBldmVudEluZm9XcmFwcGVyLnNldEV2ZW50VHlwZShFdmVudFR5cGUuS0VZRE9XTik7XG4gICAgaWYgKCFpc0dsb2JhbERpc3BhdGNoKSB7XG4gICAgICAvLyBUaGlzIHByZXZlbnRzIHRoZSBldmVudCBjb250cmFjdCBmcm9tIHNldHRpbmcgdGhlXG4gICAgICAvLyBBY2Nlc3NpYmlsaXR5QXR0cmlidXRlLk1BWUJFX0NMSUNLX0VWRU5UX1RZUEUgdHlwZSBmb3IgS2V5ZG93blxuICAgICAgLy8gZXZlbnRzLlxuICAgICAgZXZlbnRJbmZvV3JhcHBlci5nZXRFdmVudCgpW0FjY2Vzc2liaWxpdHlBdHRyaWJ1dGUuU0tJUF9BMTFZX0NIRUNLXSA9IHRydWU7XG4gICAgICAvLyBTaW5jZSBnbG9iYWxseSBkaXNwYXRjaGVkIGV2ZW50cyB3aWxsIGdldCBoYW5kbGVkIGJ5IHRoZSBkaXNwYXRjaGVyLFxuICAgICAgLy8gZG9uJ3QgaGF2ZSB0aGUgZXZlbnQgY29udHJhY3QgZGlzcGF0Y2ggaXQgYWdhaW4uXG4gICAgICBldmVudEluZm9XcmFwcGVyLmdldEV2ZW50KClbQWNjZXNzaWJpbGl0eUF0dHJpYnV0ZS5TS0lQX0dMT0JBTF9ESVNQQVRDSF0gPSB0cnVlO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuICByZXR1cm4gdHJ1ZTtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIHRydWUgaWYgdGhlIGRlZmF1bHQgYWN0aW9uIGZvciB0aGlzIGV2ZW50IHNob3VsZCBiZSBwcmV2ZW50ZWRcbiAqIGJlZm9yZSB0aGUgZXZlbnQgaGFuZGxlciBpcyBlbnZva2VkLlxuICovXG5mdW5jdGlvbiBzaG91bGRQcmV2ZW50RGVmYXVsdChldmVudEluZm9XcmFwcGVyOiBFdmVudEluZm9XcmFwcGVyKTogYm9vbGVhbiB7XG4gIGNvbnN0IGFjdGlvbkVsZW1lbnQgPSBldmVudEluZm9XcmFwcGVyLmdldEFjdGlvbigpPy5lbGVtZW50O1xuICAvLyBGb3IgcGFyaXR5IHdpdGggbm8tYTExeS1zdXBwb3J0IGJlaGF2aW9yLlxuICBpZiAoIWFjdGlvbkVsZW1lbnQpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgLy8gUHJldmVudCBzY3JvbGxpbmcgaWYgdGhlIFNwYWNlIGtleSB3YXMgcHJlc3NlZFxuICBpZiAoZXZlbnRMaWIuaXNTcGFjZUtleUV2ZW50KGV2ZW50SW5mb1dyYXBwZXIuZ2V0RXZlbnQoKSkpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICAvLyBvciBwcmV2ZW50IHRoZSBicm93c2VyJ3MgZGVmYXVsdCBhY3Rpb24gZm9yIG5hdGl2ZSBIVE1MIGNvbnRyb2xzLlxuICBpZiAoZXZlbnRMaWIuc2hvdWxkQ2FsbFByZXZlbnREZWZhdWx0T25OYXRpdmVIdG1sQ29udHJvbChldmVudEluZm9XcmFwcGVyLmdldEV2ZW50KCkpKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgLy8gUHJldmVudCBicm93c2VyIGZyb20gZm9sbG93aW5nIDxhPiBub2RlIGxpbmtzIGlmIGEganNhY3Rpb24gaXMgcHJlc2VudFxuICAvLyBhbmQgd2UgYXJlIGRpc3BhdGNoaW5nIHRoZSBhY3Rpb24gbm93LiBOb3RlIHRoYXQgdGhlIHRhcmdldEVsZW1lbnQgbWF5IGJlXG4gIC8vIGEgY2hpbGQgb2YgYW4gYW5jaG9yIHRoYXQgaGFzIGEganNhY3Rpb24gYXR0YWNoZWQuIEZvciB0aGF0IHJlYXNvbiwgd2VcbiAgLy8gbmVlZCB0byBjaGVjayB0aGUgYWN0aW9uRWxlbWVudCByYXRoZXIgdGhhbiB0aGUgdGFyZ2V0RWxlbWVudC5cbiAgaWYgKGFjdGlvbkVsZW1lbnQudGFnTmFtZSA9PT0gJ0EnKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG4vKipcbiAqIFJldHVybnMgdHJ1ZSBpZiB0aGUgZ2l2ZW4ga2V5IGV2ZW50IGNhbiBiZSB0cmVhdGVkIGFzIGEgJ2NsaWNrJy5cbiAqXG4gKiBAcGFyYW0gaXNHbG9iYWxEaXNwYXRjaCBXaGV0aGVyIHRoZSBldmVudEluZm8gaXMgbWVhbnQgdG8gYmUgZGlzcGF0Y2hlZCB0b1xuICogICAgIHRoZSBnbG9iYWwgaGFuZGxlcnMuXG4gKi9cbmZ1bmN0aW9uIGlzQTExeUNsaWNrRXZlbnQoZXZlbnRJbmZvV3JhcHBlcjogRXZlbnRJbmZvV3JhcHBlciwgaXNHbG9iYWxEaXNwYXRjaD86IGJvb2xlYW4pOiBib29sZWFuIHtcbiAgcmV0dXJuIChcbiAgICAoaXNHbG9iYWxEaXNwYXRjaCB8fCBldmVudEluZm9XcmFwcGVyLmdldEFjdGlvbigpICE9PSB1bmRlZmluZWQpICYmXG4gICAgZXZlbnRMaWIuaXNBY3Rpb25LZXlFdmVudChldmVudEluZm9XcmFwcGVyLmdldEV2ZW50KCkpXG4gICk7XG59XG5cbi8qKlxuICogUmVnaXN0ZXJzIGRlZmVycmVkIGZ1bmN0aW9uYWxpdHkgZm9yIGFuIEV2ZW50Q29udHJhY3QgYW5kIGEgSnNhY3Rpb25cbiAqIERpc3BhdGNoZXIuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZWdpc3RlckRpc3BhdGNoZXIoZXZlbnRDb250cmFjdDogVW5yZW5hbWVkRXZlbnRDb250cmFjdCwgZGlzcGF0Y2hlcjogRGlzcGF0Y2hlcikge1xuICBldmVudENvbnRyYWN0LmVjcmQoKGV2ZW50SW5mbzogRXZlbnRJbmZvLCBnbG9iYWxEaXNwYXRjaD86IGJvb2xlYW4pID0+IHtcbiAgICByZXR1cm4gZGlzcGF0Y2hlci5kaXNwYXRjaChldmVudEluZm8sIGdsb2JhbERpc3BhdGNoKTtcbiAgfSwgUmVzdHJpY3Rpb24uSV9BTV9USEVfSlNBQ1RJT05fRlJBTUVXT1JLKTtcbn1cblxuLyoqIFN0b3AgcHJvcGFnYXRpb24gZm9yIGFuIGBFdmVudEluZm9gLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHN0b3BQcm9wYWdhdGlvbihldmVudEluZm9XcmFwcGVyOiBFdmVudEluZm9XcmFwcGVyKSB7XG4gIGlmIChcbiAgICBldmVudExpYi5pc0dlY2tvICYmXG4gICAgKGV2ZW50SW5mb1dyYXBwZXIuZ2V0VGFyZ2V0RWxlbWVudCgpLnRhZ05hbWUgPT09ICdJTlBVVCcgfHxcbiAgICAgIGV2ZW50SW5mb1dyYXBwZXIuZ2V0VGFyZ2V0RWxlbWVudCgpLnRhZ05hbWUgPT09ICdURVhUQVJFQScpICYmXG4gICAgZXZlbnRJbmZvV3JhcHBlci5nZXRFdmVudFR5cGUoKSA9PT0gRXZlbnRUeXBlLkZPQ1VTXG4gICkge1xuICAgIC8qKlxuICAgICAqIERvIG5vdGhpbmcgc2luY2Ugc3RvcHBpbmcgcHJvcGFnYXRpb24gb24gYSBmb2N1cyBldmVudCBvbiBhbiBpbnB1dFxuICAgICAqIGVsZW1lbnQgaW4gRmlyZWZveCBtYWtlcyB0aGUgdGV4dCBjdXJzb3IgZGlzYXBwZWFyOlxuICAgICAqIGh0dHBzOi8vYnVnemlsbGEubW96aWxsYS5vcmcvc2hvd19idWcuY2dpP2lkPTUwOTY4NFxuICAgICAqL1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvbnN0IGV2ZW50ID0gZXZlbnRJbmZvV3JhcHBlci5nZXRFdmVudCgpO1xuICAvLyBUaGVyZSBhcmUgc29tZSBjYXNlcyB3aGVyZSB1c2VycyBvZiB0aGUgYERpc3BhdGNoZXJgIHdpbGwgY2FsbCBkaXNwYXRjaFxuICAvLyB3aXRoIGEgZmFrZSBldmVudCB0aGF0IGRvZXMgbm90IHN1cHBvcnQgYHN0b3BQcm9wYWdhdGlvbmAuXG4gIGlmICghZXZlbnQuc3RvcFByb3BhZ2F0aW9uKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xufVxuIl19