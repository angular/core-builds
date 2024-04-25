/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { BaseDispatcher } from './base_dispatcher';
import { Char } from './char';
import * as eventLib from './event';
import { EventType } from './event_type';
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
    constructor(getHandler, { stopPropagation = false, eventReplayer = undefined, } = {}) {
        this.getHandler = getHandler;
        /**
         * The actions that are registered for this Dispatcher instance.
         * This should be the primary one used once migration off of registerHandlers
         * is done.
         */
        this.actions = {};
        /** A map of global event handlers, where each key is an event type. */
        this.globalHandlers = new Map();
        this.eventReplayer = eventReplayer;
        this.baseDispatcher = new BaseDispatcher((eventInfoWrapper, isGlobalDispatch) => {
            this.dispatchToHandler(eventInfoWrapper, isGlobalDispatch);
        }, {
            eventReplayer: (eventInfoWrappers) => {
                this.eventReplayer?.(eventInfoWrappers, this);
            },
        });
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
     */
    dispatch(eventInfo, isGlobalDispatch) {
        this.baseDispatcher.dispatch(eventInfo, isGlobalDispatch);
    }
    /**
     * Dispatches an `EventInfoWrapper`.
     */
    dispatchToHandler(eventInfoWrapper, isGlobalDispatch) {
        if (isGlobalDispatch) {
            // Skip everything related to jsaction handlers, and execute the global
            // handlers.
            const ev = eventInfoWrapper.getEvent();
            const eventTypeHandlers = this.globalHandlers.get(eventInfoWrapper.getEventType());
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
        this.baseDispatcher.queueEventInfoWrapper(eventInfoWrapper);
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
        this.baseDispatcher.scheduleEventReplay();
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
        if (!this.globalHandlers.has(eventType)) {
            this.globalHandlers.set(eventType, new Set([handler]));
        }
        else {
            this.globalHandlers.get(eventType).add(handler);
        }
    }
    /** Unregisters a global event handler. */
    unregisterGlobalHandler(eventType, handler) {
        if (this.globalHandlers.has(eventType)) {
            this.globalHandlers.get(eventType).delete(handler);
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
    eventContract.ecrd((eventInfo, globalDispatch) => {
        dispatcher.dispatch(eventInfo, globalDispatch);
    }, Restriction.I_AM_THE_JSACTION_FRAMEWORK);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlzcGF0Y2hlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvcHJpbWl0aXZlcy9ldmVudC1kaXNwYXRjaC9zcmMvZGlzcGF0Y2hlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsY0FBYyxFQUEwQixNQUFNLG1CQUFtQixDQUFDO0FBQzFFLE9BQU8sRUFBQyxJQUFJLEVBQUMsTUFBTSxRQUFRLENBQUM7QUFDNUIsT0FBTyxLQUFLLFFBQVEsTUFBTSxTQUFTLENBQUM7QUFFcEMsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLGNBQWMsQ0FBQztBQUV2QyxPQUFPLEVBQUMsV0FBVyxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBZ0IxQzs7OztHQUlHO0FBQ0gsTUFBTSxPQUFPLFVBQVU7SUFtQnJCOzs7Ozs7O09BT0c7SUFDSCxZQUNtQixVQUVrQixFQUNuQyxFQUNFLGVBQWUsR0FBRyxLQUFLLEVBQ3ZCLGFBQWEsR0FBRyxTQUFTLE1BQ2dDLEVBQUU7UUFONUMsZUFBVSxHQUFWLFVBQVUsQ0FFUTtRQXhCckM7Ozs7V0FJRztRQUNjLFlBQU8sR0FBNkMsRUFBRSxDQUFDO1FBRXhFLHVFQUF1RTtRQUN0RCxtQkFBYyxHQUFHLElBQUksR0FBRyxFQUE4QixDQUFDO1FBc0J0RSxJQUFJLENBQUMsYUFBYSxHQUFHLGFBQWEsQ0FBQztRQUNuQyxJQUFJLENBQUMsY0FBYyxHQUFHLElBQUksY0FBYyxDQUN0QyxDQUFDLGdCQUFrQyxFQUFFLGdCQUEwQixFQUFFLEVBQUU7WUFDakUsSUFBSSxDQUFDLGlCQUFpQixDQUFDLGdCQUFnQixFQUFFLGdCQUFnQixDQUFDLENBQUM7UUFDN0QsQ0FBQyxFQUNEO1lBQ0UsYUFBYSxFQUFFLENBQUMsaUJBQWlCLEVBQUUsRUFBRTtnQkFDbkMsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDLGlCQUFpQixFQUFF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cEUsVUFBVSxDQUFDLFFBQVEsQ0FBQyxTQUFTLEVBQUUsY0FBYyxDQUFDLENBQUM7SUFDakQsQ0FBQyxFQUFFLFdBQVcsQ0FBQywyQkFBMkIsQ0FBQyxDQUFDO0FBQzlDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtCYXNlRGlzcGF0Y2hlciwgRXZlbnRJbmZvV3JhcHBlckhhbmRsZXJ9IGZyb20gJy4vYmFzZV9kaXNwYXRjaGVyJztcbmltcG9ydCB7Q2hhcn0gZnJvbSAnLi9jaGFyJztcbmltcG9ydCAqIGFzIGV2ZW50TGliIGZyb20gJy4vZXZlbnQnO1xuaW1wb3J0IHtFdmVudEluZm8sIEV2ZW50SW5mb1dyYXBwZXJ9IGZyb20gJy4vZXZlbnRfaW5mbyc7XG5pbXBvcnQge0V2ZW50VHlwZX0gZnJvbSAnLi9ldmVudF90eXBlJztcbmltcG9ydCB7VW5yZW5hbWVkRXZlbnRDb250cmFjdH0gZnJvbSAnLi9ldmVudGNvbnRyYWN0JztcbmltcG9ydCB7UmVzdHJpY3Rpb259IGZyb20gJy4vcmVzdHJpY3Rpb24nO1xuXG5leHBvcnQgdHlwZSB7RXZlbnRJbmZvV3JhcHBlckhhbmRsZXIgYXMgRXZlbnRJbmZvSGFuZGxlcn0gZnJvbSAnLi9iYXNlX2Rpc3BhdGNoZXInO1xuXG4vKipcbiAqIEEgZ2xvYmFsIGhhbmRsZXIgaXMgZGlzcGF0Y2hlZCB0byBiZWZvcmUgbm9ybWFsIGhhbmRsZXIgZGlzcGF0Y2guIFJldHVybmluZ1xuICogZmFsc2Ugd2lsbCBgcHJldmVudERlZmF1bHRgIG9uIHRoZSBldmVudC5cbiAqL1xuZXhwb3J0IHR5cGUgR2xvYmFsSGFuZGxlciA9IChldmVudDogRXZlbnQpID0+IGJvb2xlYW4gfCB2b2lkO1xuXG4vKipcbiAqIEEgcmVwbGF5ZXIgaXMgYSBmdW5jdGlvbiB0aGF0IGlzIGNhbGxlZCB3aGVuIHRoZXJlIGFyZSBxdWV1ZWQgZXZlbnRzLFxuICogZWl0aGVyIGZyb20gdGhlIGBFdmVudENvbnRyYWN0YCBvciB3aGVuIHRoZXJlIGFyZSBubyBkZXRlY3RlZCBoYW5kbGVycy5cbiAqL1xuZXhwb3J0IHR5cGUgUmVwbGF5ZXIgPSAoZXZlbnRJbmZvV3JhcHBlcnM6IEV2ZW50SW5mb1dyYXBwZXJbXSwgZGlzcGF0Y2hlcjogRGlzcGF0Y2hlcikgPT4gdm9pZDtcblxuLyoqXG4gKiBSZWNlaXZlcyBhIERPTSBldmVudCwgZGV0ZXJtaW5lcyB0aGUganNhY3Rpb24gYXNzb2NpYXRlZCB3aXRoIHRoZSBzb3VyY2VcbiAqIGVsZW1lbnQgb2YgdGhlIERPTSBldmVudCwgYW5kIGludm9rZXMgdGhlIGhhbmRsZXIgYXNzb2NpYXRlZCB3aXRoIHRoZVxuICoganNhY3Rpb24uXG4gKi9cbmV4cG9ydCBjbGFzcyBEaXNwYXRjaGVyIHtcbiAgcHJpdmF0ZSByZWFkb25seSBiYXNlRGlzcGF0Y2hlcjogQmFzZURpc3BhdGNoZXI7XG5cbiAgLyoqIFdoZXRoZXIgdG8gc3RvcCBwcm9wYWdhdGlvbiBmb3IgYW4gYEV2ZW50SW5mb2AuICovXG4gIHByaXZhdGUgcmVhZG9ubHkgc3RvcFByb3BhZ2F0aW9uOiBib29sZWFuO1xuXG4gIC8qKlxuICAgKiBUaGUgYWN0aW9ucyB0aGF0IGFyZSByZWdpc3RlcmVkIGZvciB0aGlzIERpc3BhdGNoZXIgaW5zdGFuY2UuXG4gICAqIFRoaXMgc2hvdWxkIGJlIHRoZSBwcmltYXJ5IG9uZSB1c2VkIG9uY2UgbWlncmF0aW9uIG9mZiBvZiByZWdpc3RlckhhbmRsZXJzXG4gICAqIGlzIGRvbmUuXG4gICAqL1xuICBwcml2YXRlIHJlYWRvbmx5IGFjdGlvbnM6IHtba2V5OiBzdHJpbmddOiBFdmVudEluZm9XcmFwcGVySGFuZGxlcn0gPSB7fTtcblxuICAvKiogQSBtYXAgb2YgZ2xvYmFsIGV2ZW50IGhhbmRsZXJzLCB3aGVyZSBlYWNoIGtleSBpcyBhbiBldmVudCB0eXBlLiAqL1xuICBwcml2YXRlIHJlYWRvbmx5IGdsb2JhbEhhbmRsZXJzID0gbmV3IE1hcDxzdHJpbmcsIFNldDxHbG9iYWxIYW5kbGVyPj4oKTtcblxuICAvKiogVGhlIGV2ZW50IHJlcGxheWVyLiAqL1xuICBwcml2YXRlIGV2ZW50UmVwbGF5ZXI/OiBSZXBsYXllcjtcblxuICAvKipcbiAgICogUmVjZWl2ZXMgYSBET00gZXZlbnQsIGRldGVybWluZXMgdGhlIGpzYWN0aW9uIGFzc29jaWF0ZWQgd2l0aCB0aGUgc291cmNlXG4gICAqIGVsZW1lbnQgb2YgdGhlIERPTSBldmVudCwgYW5kIGludm9rZXMgdGhlIGhhbmRsZXIgYXNzb2NpYXRlZCB3aXRoIHRoZVxuICAgKiBqc2FjdGlvbi5cbiAgICpcbiAgICogQHBhcmFtIGdldEhhbmRsZXIgQSBmdW5jdGlvbiB0aGF0IGtub3dzIGhvdyB0byBnZXQgdGhlIGhhbmRsZXIgZm9yIGFcbiAgICogICAgIGdpdmVuIGV2ZW50IGluZm8uXG4gICAqL1xuICBjb25zdHJ1Y3RvcihcbiAgICBwcml2YXRlIHJlYWRvbmx5IGdldEhhbmRsZXI/OiAoXG4gICAgICBldmVudEluZm9XcmFwcGVyOiBFdmVudEluZm9XcmFwcGVyLFxuICAgICkgPT4gRXZlbnRJbmZvV3JhcHBlckhhbmRsZXIgfCB2b2lkLFxuICAgIHtcbiAgICAgIHN0b3BQcm9wYWdhdGlvbiA9IGZhbHNlLFxuICAgICAgZXZlbnRSZXBsYXllciA9IHVuZGVmaW5lZCxcbiAgICB9OiB7c3RvcFByb3BhZ2F0aW9uPzogYm9vbGVhbjsgZXZlbnRSZXBsYXllcj86IFJlcGxheWVyfSA9IHt9LFxuICApIHtcbiAgICB0aGlzLmV2ZW50UmVwbGF5ZXIgPSBldmVudFJlcGxheWVyO1xuICAgIHRoaXMuYmFzZURpc3BhdGNoZXIgPSBuZXcgQmFzZURpc3BhdGNoZXIoXG4gICAgICAoZXZlbnRJbmZvV3JhcHBlcjogRXZlbnRJbmZvV3JhcHBlciwgaXNHbG9iYWxEaXNwYXRjaD86IGJvb2xlYW4pID0+IHtcbiAgICAgICAgdGhpcy5kaXNwYXRjaFRvSGFuZGxlcihldmVudEluZm9XcmFwcGVyLCBpc0dsb2JhbERpc3BhdGNoKTtcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIGV2ZW50UmVwbGF5ZXI6IChldmVudEluZm9XcmFwcGVycykgPT4ge1xuICAgICAgICAgIHRoaXMuZXZlbnRSZXBsYXllcj8uKGV2ZW50SW5mb1dyYXBwZXJzLCB0aGlzKTtcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgKTtcbiAgICB0aGlzLnN0b3BQcm9wYWdhdGlvbiA9IHN0b3BQcm9wYWdhdGlvbjtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZWNlaXZlcyBhbiBldmVudCBvciB0aGUgZXZlbnQgcXVldWUgZnJvbSB0aGUgRXZlbnRDb250cmFjdC4gVGhlIGV2ZW50XG4gICAqIHF1ZXVlIGlzIGNvcGllZCBhbmQgaXQgYXR0ZW1wdHMgdG8gcmVwbGF5LlxuICAgKiBJZiBldmVudCBpbmZvIGlzIHBhc3NlZCBpbiBpdCBsb29rcyBmb3IgYW4gYWN0aW9uIGhhbmRsZXIgdGhhdCBjYW4gaGFuZGxlXG4gICAqIHRoZSBnaXZlbiBldmVudC4gIElmIHRoZXJlIGlzIG5vIGhhbmRsZXIgcmVnaXN0ZXJlZCBxdWV1ZXMgdGhlIGV2ZW50IGFuZFxuICAgKiBjaGVja3MgaWYgYSBsb2FkZXIgaXMgcmVnaXN0ZXJlZCBmb3IgdGhlIGdpdmVuIG5hbWVzcGFjZS4gSWYgc28sIGNhbGxzIGl0LlxuICAgKlxuICAgKiBBbHRlcm5hdGl2ZWx5LCBpZiBpbiBnbG9iYWwgZGlzcGF0Y2ggbW9kZSwgY2FsbHMgYWxsIHJlZ2lzdGVyZWQgZ2xvYmFsXG4gICAqIGhhbmRsZXJzIGZvciB0aGUgYXBwcm9wcmlhdGUgZXZlbnQgdHlwZS5cbiAgICpcbiAgICogVGhlIHRocmVlIGZ1bmN0aW9uYWxpdGllcyBvZiB0aGlzIGNhbGwgYXJlIGRlbGliZXJhdGVseSBub3Qgc3BsaXQgaW50b1xuICAgKiB0aHJlZSBtZXRob2RzIChhbmQgdGhlbiBkZWNsYXJlZCBhcyBhbiBhYnN0cmFjdCBpbnRlcmZhY2UpLCBiZWNhdXNlIHRoZVxuICAgKiBpbnRlcmZhY2UgaXMgdXNlZCBieSBFdmVudENvbnRyYWN0LCB3aGljaCBsaXZlcyBpbiBhIGRpZmZlcmVudCBqc2JpbmFyeS5cbiAgICogVGhlcmVmb3JlIHRoZSBpbnRlcmZhY2UgYmV0d2VlbiB0aGUgdGhyZWUgaXMgZGVmaW5lZCBlbnRpcmVseSBpbiB0ZXJtcyB0aGF0XG4gICAqIGFyZSBpbnZhcmlhbnQgdW5kZXIganNjb21waWxlciBwcm9jZXNzaW5nIChGdW5jdGlvbiBhbmQgQXJyYXksIGFzIG9wcG9zZWRcbiAgICogdG8gYSBjdXN0b20gdHlwZSB3aXRoIG1ldGhvZCBuYW1lcykuXG4gICAqXG4gICAqIEBwYXJhbSBldmVudEluZm8gVGhlIGluZm8gZm9yIHRoZSBldmVudCB0aGF0IHRyaWdnZXJlZCB0aGlzIGNhbGwgb3IgdGhlXG4gICAqICAgICBxdWV1ZSBvZiBldmVudHMgZnJvbSBFdmVudENvbnRyYWN0LlxuICAgKiBAcGFyYW0gaXNHbG9iYWxEaXNwYXRjaCBJZiB0cnVlLCBkaXNwYXRjaGVzIGEgZ2xvYmFsIGV2ZW50IGluc3RlYWQgb2YgYVxuICAgKiAgICAgcmVndWxhciBqc2FjdGlvbiBoYW5kbGVyLlxuICAgKi9cbiAgZGlzcGF0Y2goZXZlbnRJbmZvOiBFdmVudEluZm8sIGlzR2xvYmFsRGlzcGF0Y2g/OiBib29sZWFuKTogdm9pZCB7XG4gICAgdGhpcy5iYXNlRGlzcGF0Y2hlci5kaXNwYXRjaChldmVudEluZm8sIGlzR2xvYmFsRGlzcGF0Y2gpO1xuICB9XG5cbiAgLyoqXG4gICAqIERpc3BhdGNoZXMgYW4gYEV2ZW50SW5mb1dyYXBwZXJgLlxuICAgKi9cbiAgcHJpdmF0ZSBkaXNwYXRjaFRvSGFuZGxlcihldmVudEluZm9XcmFwcGVyOiBFdmVudEluZm9XcmFwcGVyLCBpc0dsb2JhbERpc3BhdGNoPzogYm9vbGVhbikge1xuICAgIGlmIChpc0dsb2JhbERpc3BhdGNoKSB7XG4gICAgICAvLyBTa2lwIGV2ZXJ5dGhpbmcgcmVsYXRlZCB0byBqc2FjdGlvbiBoYW5kbGVycywgYW5kIGV4ZWN1dGUgdGhlIGdsb2JhbFxuICAgICAgLy8gaGFuZGxlcnMuXG4gICAgICBjb25zdCBldiA9IGV2ZW50SW5mb1dyYXBwZXIuZ2V0RXZlbnQoKTtcbiAgICAgIGNvbnN0IGV2ZW50VHlwZUhhbmRsZXJzID0gdGhpcy5nbG9iYWxIYW5kbGVycy5nZXQoZXZlbnRJbmZvV3JhcHBlci5nZXRFdmVudFR5cGUoKSk7XG4gICAgICBsZXQgc2hvdWxkUHJldmVudERlZmF1bHQgPSBmYWxzZTtcbiAgICAgIGlmIChldmVudFR5cGVIYW5kbGVycykge1xuICAgICAgICBmb3IgKGNvbnN0IGhhbmRsZXIgb2YgZXZlbnRUeXBlSGFuZGxlcnMpIHtcbiAgICAgICAgICBpZiAoaGFuZGxlcihldikgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICBzaG91bGRQcmV2ZW50RGVmYXVsdCA9IHRydWU7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAoc2hvdWxkUHJldmVudERlZmF1bHQpIHtcbiAgICAgICAgZXZlbnRMaWIucHJldmVudERlZmF1bHQoZXYpO1xuICAgICAgfVxuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICh0aGlzLnN0b3BQcm9wYWdhdGlvbikge1xuICAgICAgc3RvcFByb3BhZ2F0aW9uKGV2ZW50SW5mb1dyYXBwZXIpO1xuICAgIH1cblxuICAgIGNvbnN0IGFjdGlvbiA9IGV2ZW50SW5mb1dyYXBwZXIuZ2V0QWN0aW9uKCkhO1xuXG4gICAgbGV0IGhhbmRsZXI6IEV2ZW50SW5mb1dyYXBwZXJIYW5kbGVyIHwgdm9pZCA9IHVuZGVmaW5lZDtcbiAgICBpZiAodGhpcy5nZXRIYW5kbGVyKSB7XG4gICAgICBoYW5kbGVyID0gdGhpcy5nZXRIYW5kbGVyKGV2ZW50SW5mb1dyYXBwZXIpO1xuICAgIH1cblxuICAgIGlmICghaGFuZGxlcikge1xuICAgICAgaGFuZGxlciA9IHRoaXMuYWN0aW9uc1thY3Rpb24ubmFtZV07XG4gICAgfVxuXG4gICAgaWYgKGhhbmRsZXIpIHtcbiAgICAgIGhhbmRsZXIoZXZlbnRJbmZvV3JhcHBlcik7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gTm8gaGFuZGxlciB3YXMgZm91bmQuXG4gICAgdGhpcy5iYXNlRGlzcGF0Y2hlci5xdWV1ZUV2ZW50SW5mb1dyYXBwZXIoZXZlbnRJbmZvV3JhcHBlcik7XG4gIH1cblxuICAvKipcbiAgICogUmVnaXN0ZXJzIG11bHRpcGxlIG1ldGhvZHMgYWxsIGJvdW5kIHRvIHRoZSBzYW1lIG9iamVjdFxuICAgKiBpbnN0YW5jZS4gVGhpcyBpcyBhIGNvbW1vbiBjYXNlOiBhbiBhcHBsaWNhdGlvbiBtb2R1bGUgYmluZHNcbiAgICogbXVsdGlwbGUgb2YgaXRzIG1ldGhvZHMgdW5kZXIgcHVibGljIG5hbWVzIHRvIHRoZSBldmVudCBjb250cmFjdCBvZlxuICAgKiB0aGUgYXBwbGljYXRpb24uIFNvIHdlIHByb3ZpZGUgYSBzaG9ydGN1dCBmb3IgaXQuXG4gICAqIEF0dGVtcHRzIHRvIHJlcGxheSB0aGUgcXVldWVkIGV2ZW50cyBhZnRlciByZWdpc3RlcmluZyB0aGUgaGFuZGxlcnMuXG4gICAqXG4gICAqIEBwYXJhbSBuYW1lc3BhY2UgVGhlIG5hbWVzcGFjZSBvZiB0aGUganNhY3Rpb24gbmFtZS5cbiAgICpcbiAgICogQHBhcmFtIGluc3RhbmNlIFRoZSBvYmplY3QgdG8gYmluZCB0aGUgbWV0aG9kcyB0by4gSWYgdGhpcyBpcyBudWxsLCB0aGVuXG4gICAqICAgICB0aGUgZnVuY3Rpb25zIGFyZSBub3QgYm91bmQsIGJ1dCBkaXJlY3RseSBhZGRlZCB1bmRlciB0aGUgcHVibGljIG5hbWVzLlxuICAgKlxuICAgKiBAcGFyYW0gbWV0aG9kcyBBIG1hcCBmcm9tIHB1YmxpYyBuYW1lIHRvIGZ1bmN0aW9ucyB0aGF0IHdpbGwgYmUgYm91bmQgdG9cbiAgICogICAgIGluc3RhbmNlIGFuZCByZWdpc3RlcmVkIGFzIGFjdGlvbiB1bmRlciB0aGUgcHVibGljIG5hbWUuIEkuZS4gdGhlXG4gICAqICAgICBwcm9wZXJ0eSBuYW1lcyBhcmUgdGhlIHB1YmxpYyBuYW1lcy4gVGhlIHByb3BlcnR5IHZhbHVlcyBhcmUgdGhlXG4gICAqICAgICBtZXRob2RzIG9mIGluc3RhbmNlLlxuICAgKi9cbiAgcmVnaXN0ZXJFdmVudEluZm9IYW5kbGVyczxUPihcbiAgICBuYW1lc3BhY2U6IHN0cmluZyxcbiAgICBpbnN0YW5jZTogVCB8IG51bGwsXG4gICAgbWV0aG9kczoge1trZXk6IHN0cmluZ106IEV2ZW50SW5mb1dyYXBwZXJIYW5kbGVyfSxcbiAgKSB7XG4gICAgZm9yIChjb25zdCBbbmFtZSwgbWV0aG9kXSBvZiBPYmplY3QuZW50cmllcyhtZXRob2RzKSkge1xuICAgICAgY29uc3QgaGFuZGxlciA9IGluc3RhbmNlID8gbWV0aG9kLmJpbmQoaW5zdGFuY2UpIDogbWV0aG9kO1xuICAgICAgaWYgKG5hbWVzcGFjZSkge1xuICAgICAgICAvLyBJbmNsdWRlIGEgJy4nIHNlcGFyYXRvciBiZXR3ZWVuIG5hbWVzcGFjZSBuYW1lIGFuZCBhY3Rpb24gbmFtZS5cbiAgICAgICAgLy8gSW4gdGhlIGNhc2UgdGhhdCBubyBuYW1lc3BhY2UgbmFtZSBpcyBwcm92aWRlZCwgdGhlIGpzYWN0aW9uIG5hbWVcbiAgICAgICAgLy8gY29uc2lzdHMgb2YgdGhlIGFjdGlvbiBuYW1lIG9ubHkgKG5vIHBlcmlvZCkuXG4gICAgICAgIGNvbnN0IGZ1bGxOYW1lID0gbmFtZXNwYWNlICsgQ2hhci5OQU1FU1BBQ0VfQUNUSU9OX1NFUEFSQVRPUiArIG5hbWU7XG4gICAgICAgIHRoaXMuYWN0aW9uc1tmdWxsTmFtZV0gPSBoYW5kbGVyO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5hY3Rpb25zW25hbWVdID0gaGFuZGxlcjtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLmJhc2VEaXNwYXRjaGVyLnNjaGVkdWxlRXZlbnRSZXBsYXkoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVbnJlZ2lzdGVycyBhbiBhY3Rpb24uICBQcm92aWRlZCBhcyBhbiBlYXN5IHdheSB0byByZXZlcnNlIHRoZSBlZmZlY3RzIG9mXG4gICAqIHJlZ2lzdGVySGFuZGxlcnMuXG4gICAqIEBwYXJhbSBuYW1lc3BhY2UgVGhlIG5hbWVzcGFjZSBvZiB0aGUganNhY3Rpb24gbmFtZS5cbiAgICogQHBhcmFtIG5hbWUgVGhlIGFjdGlvbiBuYW1lIHRvIHVuYmluZC5cbiAgICovXG4gIHVucmVnaXN0ZXJIYW5kbGVyKG5hbWVzcGFjZTogc3RyaW5nLCBuYW1lOiBzdHJpbmcpIHtcbiAgICBjb25zdCBmdWxsTmFtZSA9IG5hbWVzcGFjZSA/IG5hbWVzcGFjZSArIENoYXIuTkFNRVNQQUNFX0FDVElPTl9TRVBBUkFUT1IgKyBuYW1lIDogbmFtZTtcbiAgICBkZWxldGUgdGhpcy5hY3Rpb25zW2Z1bGxOYW1lXTtcbiAgfVxuXG4gIC8qKiBSZWdpc3RlcnMgYSBnbG9iYWwgZXZlbnQgaGFuZGxlci4gKi9cbiAgcmVnaXN0ZXJHbG9iYWxIYW5kbGVyKGV2ZW50VHlwZTogc3RyaW5nLCBoYW5kbGVyOiBHbG9iYWxIYW5kbGVyKSB7XG4gICAgaWYgKCF0aGlzLmdsb2JhbEhhbmRsZXJzLmhhcyhldmVudFR5cGUpKSB7XG4gICAgICB0aGlzLmdsb2JhbEhhbmRsZXJzLnNldChldmVudFR5cGUsIG5ldyBTZXQ8R2xvYmFsSGFuZGxlcj4oW2hhbmRsZXJdKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuZ2xvYmFsSGFuZGxlcnMuZ2V0KGV2ZW50VHlwZSkhLmFkZChoYW5kbGVyKTtcbiAgICB9XG4gIH1cblxuICAvKiogVW5yZWdpc3RlcnMgYSBnbG9iYWwgZXZlbnQgaGFuZGxlci4gKi9cbiAgdW5yZWdpc3Rlckdsb2JhbEhhbmRsZXIoZXZlbnRUeXBlOiBzdHJpbmcsIGhhbmRsZXI6IEdsb2JhbEhhbmRsZXIpIHtcbiAgICBpZiAodGhpcy5nbG9iYWxIYW5kbGVycy5oYXMoZXZlbnRUeXBlKSkge1xuICAgICAgdGhpcy5nbG9iYWxIYW5kbGVycy5nZXQoZXZlbnRUeXBlKSEuZGVsZXRlKGhhbmRsZXIpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVja3Mgd2hldGhlciB0aGVyZSBpcyBhbiBhY3Rpb24gcmVnaXN0ZXJlZCB1bmRlciB0aGUgZ2l2ZW5cbiAgICogbmFtZS4gVGhpcyByZXR1cm5zIHRydWUgaWYgdGhlcmUgaXMgYSBuYW1lc3BhY2UgaGFuZGxlciwgZXZlblxuICAgKiBpZiBpdCBjYW4gbm90IHlldCBoYW5kbGUgdGhlIGV2ZW50LlxuICAgKlxuICAgKiBAcGFyYW0gbmFtZSBBY3Rpb24gbmFtZS5cbiAgICogQHJldHVybiBXaGV0aGVyIHRoZSBuYW1lIGlzIHJlZ2lzdGVyZWQuXG4gICAqIEBzZWUgI2NhbkRpc3BhdGNoXG4gICAqL1xuICBoYXNBY3Rpb24obmFtZTogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuYWN0aW9ucy5oYXNPd25Qcm9wZXJ0eShuYW1lKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBXaGV0aGVyIHRoaXMgZGlzcGF0Y2hlciBjYW4gZGlzcGF0Y2ggdGhlIGV2ZW50LiBUaGlzIGNhbiBiZSB1c2VkIGJ5XG4gICAqIGV2ZW50IHJlcGxheWVyIHRvIGNoZWNrIHdoZXRoZXIgdGhlIGRpc3BhdGNoZXIgY2FuIHJlcGxheSBhbiBldmVudC5cbiAgICovXG4gIGNhbkRpc3BhdGNoKGV2ZW50SW5mb1dyYXBwZXI6IEV2ZW50SW5mb1dyYXBwZXIpOiBib29sZWFuIHtcbiAgICBjb25zdCBhY3Rpb24gPSBldmVudEluZm9XcmFwcGVyLmdldEFjdGlvbigpO1xuICAgIGlmICghYWN0aW9uKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLmhhc0FjdGlvbihhY3Rpb24ubmFtZSk7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgZXZlbnQgcmVwbGF5ZXIsIGVuYWJsaW5nIHF1ZXVlZCBldmVudHMgdG8gYmUgcmVwbGF5ZWQgd2hlbiBhY3Rpb25zXG4gICAqIGFyZSBib3VuZC4gVG8gcmVwbGF5IGV2ZW50cywgeW91IG11c3QgcmVnaXN0ZXIgdGhlIGRpc3BhdGNoZXIgdG8gdGhlXG4gICAqIGNvbnRyYWN0IGFmdGVyIHNldHRpbmcgdGhlIGBFdmVudFJlcGxheWVyYC4gVGhlIGV2ZW50IHJlcGxheWVyIHRha2VzIGFzXG4gICAqIHBhcmFtZXRlcnMgdGhlIHF1ZXVlIG9mIGV2ZW50cyBhbmQgdGhlIGRpc3BhdGNoZXIgKHVzZWQgdG8gY2hlY2sgd2hldGhlclxuICAgKiBhY3Rpb25zIGhhdmUgaGFuZGxlcnMgcmVnaXN0ZXJlZCBhbmQgY2FuIGJlIHJlcGxheWVkKS4gVGhlIGV2ZW50IHJlcGxheWVyXG4gICAqIGlzIGFsc28gcmVzcG9uc2libGUgZm9yIGRlcXVldWluZyBldmVudHMuXG4gICAqXG4gICAqIEV4YW1wbGU6IEFuIGV2ZW50IHJlcGxheWVyIHRoYXQgcmVwbGF5cyBvbmx5IHRoZSBsYXN0IGV2ZW50LlxuICAgKlxuICAgKiAgIGNvbnN0IGRpc3BhdGNoZXIgPSBuZXcgRGlzcGF0Y2hlcigpO1xuICAgKiAgIC8vIC4uLlxuICAgKiAgIGRpc3BhdGNoZXIuc2V0RXZlbnRSZXBsYXllcigocXVldWUsIGRpc3BhdGNoZXIpID0+IHtcbiAgICogICAgIGNvbnN0IGxhc3RFdmVudEluZm9XcmFwcGVyID0gcXVldWVbcXVldWUubGVuZ3RoIC0xXTtcbiAgICogICAgIGlmIChkaXNwYXRjaGVyLmNhbkRpc3BhdGNoKGxhc3RFdmVudEluZm9XcmFwcGVyLmdldEFjdGlvbigpKSkge1xuICAgKiAgICAgICBqc2FjdGlvbi5yZXBsYXkucmVwbGF5RXZlbnQoXG4gICAqICAgICAgICAgICBsYXN0RXZlbnRJbmZvV3JhcHBlci5nZXRFdmVudCgpLFxuICAgKiAgICAgICAgICAgbGFzdEV2ZW50SW5mb1dyYXBwZXIuZ2V0VGFyZ2V0RWxlbWVudCgpLFxuICAgKiAgICAgICAgICAgbGFzdEV2ZW50SW5mb1dyYXBwZXIuZ2V0RXZlbnRUeXBlKCksXG4gICAqICAgICAgICk7XG4gICAqICAgICAgIHF1ZXVlLmxlbmd0aCA9IDA7XG4gICAqICAgICB9XG4gICAqICAgfSk7XG4gICAqXG4gICAqIEBwYXJhbSBldmVudFJlcGxheWVyIEl0IGFsbG93cyBlbGVtZW50cyB0byBiZSByZXBsYXllZCBhbmQgZGVxdWV1aW5nLlxuICAgKi9cbiAgc2V0RXZlbnRSZXBsYXllcihldmVudFJlcGxheWVyOiBSZXBsYXllcikge1xuICAgIHRoaXMuZXZlbnRSZXBsYXllciA9IGV2ZW50UmVwbGF5ZXI7XG4gIH1cbn1cblxuLyoqIFN0b3AgcHJvcGFnYXRpb24gZm9yIGFuIGBFdmVudEluZm9gLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHN0b3BQcm9wYWdhdGlvbihldmVudEluZm9XcmFwcGVyOiBFdmVudEluZm9XcmFwcGVyKSB7XG4gIGlmIChcbiAgICBldmVudExpYi5pc0dlY2tvICYmXG4gICAgKGV2ZW50SW5mb1dyYXBwZXIuZ2V0VGFyZ2V0RWxlbWVudCgpLnRhZ05hbWUgPT09ICdJTlBVVCcgfHxcbiAgICAgIGV2ZW50SW5mb1dyYXBwZXIuZ2V0VGFyZ2V0RWxlbWVudCgpLnRhZ05hbWUgPT09ICdURVhUQVJFQScpICYmXG4gICAgZXZlbnRJbmZvV3JhcHBlci5nZXRFdmVudFR5cGUoKSA9PT0gRXZlbnRUeXBlLkZPQ1VTXG4gICkge1xuICAgIC8qKlxuICAgICAqIERvIG5vdGhpbmcgc2luY2Ugc3RvcHBpbmcgcHJvcGFnYXRpb24gb24gYSBmb2N1cyBldmVudCBvbiBhbiBpbnB1dFxuICAgICAqIGVsZW1lbnQgaW4gRmlyZWZveCBtYWtlcyB0aGUgdGV4dCBjdXJzb3IgZGlzYXBwZWFyOlxuICAgICAqIGh0dHBzOi8vYnVnemlsbGEubW96aWxsYS5vcmcvc2hvd19idWcuY2dpP2lkPTUwOTY4NFxuICAgICAqL1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvbnN0IGV2ZW50ID0gZXZlbnRJbmZvV3JhcHBlci5nZXRFdmVudCgpO1xuICAvLyBUaGVyZSBhcmUgc29tZSBjYXNlcyB3aGVyZSB1c2VycyBvZiB0aGUgYERpc3BhdGNoZXJgIHdpbGwgY2FsbCBkaXNwYXRjaFxuICAvLyB3aXRoIGEgZmFrZSBldmVudCB0aGF0IGRvZXMgbm90IHN1cHBvcnQgYHN0b3BQcm9wYWdhdGlvbmAuXG4gIGlmICghZXZlbnQuc3RvcFByb3BhZ2F0aW9uKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xufVxuXG4vKipcbiAqIFJlZ2lzdGVycyBkZWZlcnJlZCBmdW5jdGlvbmFsaXR5IGZvciBhbiBFdmVudENvbnRyYWN0IGFuZCBhIEpzYWN0aW9uXG4gKiBEaXNwYXRjaGVyLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVnaXN0ZXJEaXNwYXRjaGVyKGV2ZW50Q29udHJhY3Q6IFVucmVuYW1lZEV2ZW50Q29udHJhY3QsIGRpc3BhdGNoZXI6IERpc3BhdGNoZXIpIHtcbiAgZXZlbnRDb250cmFjdC5lY3JkKChldmVudEluZm86IEV2ZW50SW5mbywgZ2xvYmFsRGlzcGF0Y2g/OiBib29sZWFuKSA9PiB7XG4gICAgZGlzcGF0Y2hlci5kaXNwYXRjaChldmVudEluZm8sIGdsb2JhbERpc3BhdGNoKTtcbiAgfSwgUmVzdHJpY3Rpb24uSV9BTV9USEVfSlNBQ1RJT05fRlJBTUVXT1JLKTtcbn1cbiJdfQ==