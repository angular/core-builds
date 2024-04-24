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
     * @return An `EventInfo` for the `EventContract` to handle again if the
     *    `Dispatcher` tried to resolve an a11y event as a click but failed.
     */
    dispatch(eventInfo, isGlobalDispatch) {
        return this.baseDispatcher.dispatch(eventInfo, isGlobalDispatch);
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
        return dispatcher.dispatch(eventInfo, globalDispatch);
    }, Restriction.I_AM_THE_JSACTION_FRAMEWORK);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlzcGF0Y2hlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvcHJpbWl0aXZlcy9ldmVudC1kaXNwYXRjaC9zcmMvZGlzcGF0Y2hlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsY0FBYyxFQUEwQixNQUFNLG1CQUFtQixDQUFDO0FBQzFFLE9BQU8sRUFBQyxJQUFJLEVBQUMsTUFBTSxRQUFRLENBQUM7QUFDNUIsT0FBTyxLQUFLLFFBQVEsTUFBTSxTQUFTLENBQUM7QUFFcEMsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLGNBQWMsQ0FBQztBQUV2QyxPQUFPLEVBQUMsV0FBVyxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBZ0IxQzs7OztHQUlHO0FBQ0gsTUFBTSxPQUFPLFVBQVU7SUFtQnJCOzs7Ozs7O09BT0c7SUFDSCxZQUNtQixVQUVrQixFQUNuQyxFQUNFLGVBQWUsR0FBRyxLQUFLLEVBQ3ZCLGFBQWEsR0FBRyxTQUFTLE1BQ2dDLEVBQUU7UUFONUMsZUFBVSxHQUFWLFVBQVUsQ0FFUTtRQXhCckM7Ozs7V0FJRztRQUNjLFlBQU8sR0FBNkMsRUFBRSxDQUFDO1FBRXhFLHVFQUF1RTtRQUN0RCxtQkFBYyxHQUFHLElBQUksR0FBRyxFQUE4QixDQUFDO1FBc0J0RSxJQUFJLENBQUMsY0FBYyxHQUFHLElBQUksY0FBYyxDQUN0QyxDQUFDLGdCQUFrQyxFQUFFLGdCQUEwQixFQUFFLEVBQUU7WUFDakUsSUFBSSxDQUFDLGlCQUFpQixDQUFDLGdCQUFnQixFQUFFLGdCQUFnQixDQUFDLENBQUM7UUFDN0QsQ0FBQyxFQUNEO1lBQ0UsYUFBYSxFQUFFLENBQUMsaUJBQWlCLEVBQUUsRUFBRTtnQkFDbkMsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDLGlCQUFpQixFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ2hELENBQUM7U0FDRixDQUNG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QUFTLEVBQUUsY0FBYyxDQUFDLENBQUM7SUFDeEQsQ0FBQyxFQUFFLFdBQVcsQ0FBQywyQkFBMkIsQ0FBQyxDQUFDO0FBQzlDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtCYXNlRGlzcGF0Y2hlciwgRXZlbnRJbmZvV3JhcHBlckhhbmRsZXJ9IGZyb20gJy4vYmFzZV9kaXNwYXRjaGVyJztcbmltcG9ydCB7Q2hhcn0gZnJvbSAnLi9jaGFyJztcbmltcG9ydCAqIGFzIGV2ZW50TGliIGZyb20gJy4vZXZlbnQnO1xuaW1wb3J0IHtFdmVudEluZm8sIEV2ZW50SW5mb1dyYXBwZXJ9IGZyb20gJy4vZXZlbnRfaW5mbyc7XG5pbXBvcnQge0V2ZW50VHlwZX0gZnJvbSAnLi9ldmVudF90eXBlJztcbmltcG9ydCB7VW5yZW5hbWVkRXZlbnRDb250cmFjdH0gZnJvbSAnLi9ldmVudGNvbnRyYWN0JztcbmltcG9ydCB7UmVzdHJpY3Rpb259IGZyb20gJy4vcmVzdHJpY3Rpb24nO1xuXG5leHBvcnQgdHlwZSB7RXZlbnRJbmZvV3JhcHBlckhhbmRsZXIgYXMgRXZlbnRJbmZvSGFuZGxlcn0gZnJvbSAnLi9iYXNlX2Rpc3BhdGNoZXInO1xuXG4vKipcbiAqIEEgZ2xvYmFsIGhhbmRsZXIgaXMgZGlzcGF0Y2hlZCB0byBiZWZvcmUgbm9ybWFsIGhhbmRsZXIgZGlzcGF0Y2guIFJldHVybmluZ1xuICogZmFsc2Ugd2lsbCBgcHJldmVudERlZmF1bHRgIG9uIHRoZSBldmVudC5cbiAqL1xuZXhwb3J0IHR5cGUgR2xvYmFsSGFuZGxlciA9IChldmVudDogRXZlbnQpID0+IGJvb2xlYW4gfCB2b2lkO1xuXG4vKipcbiAqIEEgcmVwbGF5ZXIgaXMgYSBmdW5jdGlvbiB0aGF0IGlzIGNhbGxlZCB3aGVuIHRoZXJlIGFyZSBxdWV1ZWQgZXZlbnRzLFxuICogZWl0aGVyIGZyb20gdGhlIGBFdmVudENvbnRyYWN0YCBvciB3aGVuIHRoZXJlIGFyZSBubyBkZXRlY3RlZCBoYW5kbGVycy5cbiAqL1xuZXhwb3J0IHR5cGUgUmVwbGF5ZXIgPSAoZXZlbnRJbmZvV3JhcHBlcnM6IEV2ZW50SW5mb1dyYXBwZXJbXSwgZGlzcGF0Y2hlcjogRGlzcGF0Y2hlcikgPT4gdm9pZDtcblxuLyoqXG4gKiBSZWNlaXZlcyBhIERPTSBldmVudCwgZGV0ZXJtaW5lcyB0aGUganNhY3Rpb24gYXNzb2NpYXRlZCB3aXRoIHRoZSBzb3VyY2VcbiAqIGVsZW1lbnQgb2YgdGhlIERPTSBldmVudCwgYW5kIGludm9rZXMgdGhlIGhhbmRsZXIgYXNzb2NpYXRlZCB3aXRoIHRoZVxuICoganNhY3Rpb24uXG4gKi9cbmV4cG9ydCBjbGFzcyBEaXNwYXRjaGVyIHtcbiAgcHJpdmF0ZSByZWFkb25seSBiYXNlRGlzcGF0Y2hlcjogQmFzZURpc3BhdGNoZXI7XG5cbiAgLyoqIFdoZXRoZXIgdG8gc3RvcCBwcm9wYWdhdGlvbiBmb3IgYW4gYEV2ZW50SW5mb2AuICovXG4gIHByaXZhdGUgcmVhZG9ubHkgc3RvcFByb3BhZ2F0aW9uOiBib29sZWFuO1xuXG4gIC8qKlxuICAgKiBUaGUgYWN0aW9ucyB0aGF0IGFyZSByZWdpc3RlcmVkIGZvciB0aGlzIERpc3BhdGNoZXIgaW5zdGFuY2UuXG4gICAqIFRoaXMgc2hvdWxkIGJlIHRoZSBwcmltYXJ5IG9uZSB1c2VkIG9uY2UgbWlncmF0aW9uIG9mZiBvZiByZWdpc3RlckhhbmRsZXJzXG4gICAqIGlzIGRvbmUuXG4gICAqL1xuICBwcml2YXRlIHJlYWRvbmx5IGFjdGlvbnM6IHtba2V5OiBzdHJpbmddOiBFdmVudEluZm9XcmFwcGVySGFuZGxlcn0gPSB7fTtcblxuICAvKiogQSBtYXAgb2YgZ2xvYmFsIGV2ZW50IGhhbmRsZXJzLCB3aGVyZSBlYWNoIGtleSBpcyBhbiBldmVudCB0eXBlLiAqL1xuICBwcml2YXRlIHJlYWRvbmx5IGdsb2JhbEhhbmRsZXJzID0gbmV3IE1hcDxzdHJpbmcsIFNldDxHbG9iYWxIYW5kbGVyPj4oKTtcblxuICAvKiogVGhlIGV2ZW50IHJlcGxheWVyLiAqL1xuICBwcml2YXRlIGV2ZW50UmVwbGF5ZXI/OiBSZXBsYXllcjtcblxuICAvKipcbiAgICogUmVjZWl2ZXMgYSBET00gZXZlbnQsIGRldGVybWluZXMgdGhlIGpzYWN0aW9uIGFzc29jaWF0ZWQgd2l0aCB0aGUgc291cmNlXG4gICAqIGVsZW1lbnQgb2YgdGhlIERPTSBldmVudCwgYW5kIGludm9rZXMgdGhlIGhhbmRsZXIgYXNzb2NpYXRlZCB3aXRoIHRoZVxuICAgKiBqc2FjdGlvbi5cbiAgICpcbiAgICogQHBhcmFtIGdldEhhbmRsZXIgQSBmdW5jdGlvbiB0aGF0IGtub3dzIGhvdyB0byBnZXQgdGhlIGhhbmRsZXIgZm9yIGFcbiAgICogICAgIGdpdmVuIGV2ZW50IGluZm8uXG4gICAqL1xuICBjb25zdHJ1Y3RvcihcbiAgICBwcml2YXRlIHJlYWRvbmx5IGdldEhhbmRsZXI/OiAoXG4gICAgICBldmVudEluZm9XcmFwcGVyOiBFdmVudEluZm9XcmFwcGVyLFxuICAgICkgPT4gRXZlbnRJbmZvV3JhcHBlckhhbmRsZXIgfCB2b2lkLFxuICAgIHtcbiAgICAgIHN0b3BQcm9wYWdhdGlvbiA9IGZhbHNlLFxuICAgICAgZXZlbnRSZXBsYXllciA9IHVuZGVmaW5lZCxcbiAgICB9OiB7c3RvcFByb3BhZ2F0aW9uPzogYm9vbGVhbjsgZXZlbnRSZXBsYXllcj86IFJlcGxheWVyfSA9IHt9LFxuICApIHtcbiAgICB0aGlzLmJhc2VEaXNwYXRjaGVyID0gbmV3IEJhc2VEaXNwYXRjaGVyKFxuICAgICAgKGV2ZW50SW5mb1dyYXBwZXI6IEV2ZW50SW5mb1dyYXBwZXIsIGlzR2xvYmFsRGlzcGF0Y2g/OiBib29sZWFuKSA9PiB7XG4gICAgICAgIHRoaXMuZGlzcGF0Y2hUb0hhbmRsZXIoZXZlbnRJbmZvV3JhcHBlciwgaXNHbG9iYWxEaXNwYXRjaCk7XG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBldmVudFJlcGxheWVyOiAoZXZlbnRJbmZvV3JhcHBlcnMpID0+IHtcbiAgICAgICAgICB0aGlzLmV2ZW50UmVwbGF5ZXI/LihldmVudEluZm9XcmFwcGVycywgdGhpcyk7XG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICk7XG4gICAgdGhpcy5zdG9wUHJvcGFnYXRpb24gPSBzdG9wUHJvcGFnYXRpb247XG4gIH1cblxuICAvKipcbiAgICogUmVjZWl2ZXMgYW4gZXZlbnQgb3IgdGhlIGV2ZW50IHF1ZXVlIGZyb20gdGhlIEV2ZW50Q29udHJhY3QuIFRoZSBldmVudFxuICAgKiBxdWV1ZSBpcyBjb3BpZWQgYW5kIGl0IGF0dGVtcHRzIHRvIHJlcGxheS5cbiAgICogSWYgZXZlbnQgaW5mbyBpcyBwYXNzZWQgaW4gaXQgbG9va3MgZm9yIGFuIGFjdGlvbiBoYW5kbGVyIHRoYXQgY2FuIGhhbmRsZVxuICAgKiB0aGUgZ2l2ZW4gZXZlbnQuICBJZiB0aGVyZSBpcyBubyBoYW5kbGVyIHJlZ2lzdGVyZWQgcXVldWVzIHRoZSBldmVudCBhbmRcbiAgICogY2hlY2tzIGlmIGEgbG9hZGVyIGlzIHJlZ2lzdGVyZWQgZm9yIHRoZSBnaXZlbiBuYW1lc3BhY2UuIElmIHNvLCBjYWxscyBpdC5cbiAgICpcbiAgICogQWx0ZXJuYXRpdmVseSwgaWYgaW4gZ2xvYmFsIGRpc3BhdGNoIG1vZGUsIGNhbGxzIGFsbCByZWdpc3RlcmVkIGdsb2JhbFxuICAgKiBoYW5kbGVycyBmb3IgdGhlIGFwcHJvcHJpYXRlIGV2ZW50IHR5cGUuXG4gICAqXG4gICAqIFRoZSB0aHJlZSBmdW5jdGlvbmFsaXRpZXMgb2YgdGhpcyBjYWxsIGFyZSBkZWxpYmVyYXRlbHkgbm90IHNwbGl0IGludG9cbiAgICogdGhyZWUgbWV0aG9kcyAoYW5kIHRoZW4gZGVjbGFyZWQgYXMgYW4gYWJzdHJhY3QgaW50ZXJmYWNlKSwgYmVjYXVzZSB0aGVcbiAgICogaW50ZXJmYWNlIGlzIHVzZWQgYnkgRXZlbnRDb250cmFjdCwgd2hpY2ggbGl2ZXMgaW4gYSBkaWZmZXJlbnQganNiaW5hcnkuXG4gICAqIFRoZXJlZm9yZSB0aGUgaW50ZXJmYWNlIGJldHdlZW4gdGhlIHRocmVlIGlzIGRlZmluZWQgZW50aXJlbHkgaW4gdGVybXMgdGhhdFxuICAgKiBhcmUgaW52YXJpYW50IHVuZGVyIGpzY29tcGlsZXIgcHJvY2Vzc2luZyAoRnVuY3Rpb24gYW5kIEFycmF5LCBhcyBvcHBvc2VkXG4gICAqIHRvIGEgY3VzdG9tIHR5cGUgd2l0aCBtZXRob2QgbmFtZXMpLlxuICAgKlxuICAgKiBAcGFyYW0gZXZlbnRJbmZvIFRoZSBpbmZvIGZvciB0aGUgZXZlbnQgdGhhdCB0cmlnZ2VyZWQgdGhpcyBjYWxsIG9yIHRoZVxuICAgKiAgICAgcXVldWUgb2YgZXZlbnRzIGZyb20gRXZlbnRDb250cmFjdC5cbiAgICogQHBhcmFtIGlzR2xvYmFsRGlzcGF0Y2ggSWYgdHJ1ZSwgZGlzcGF0Y2hlcyBhIGdsb2JhbCBldmVudCBpbnN0ZWFkIG9mIGFcbiAgICogICAgIHJlZ3VsYXIganNhY3Rpb24gaGFuZGxlci5cbiAgICogQHJldHVybiBBbiBgRXZlbnRJbmZvYCBmb3IgdGhlIGBFdmVudENvbnRyYWN0YCB0byBoYW5kbGUgYWdhaW4gaWYgdGhlXG4gICAqICAgIGBEaXNwYXRjaGVyYCB0cmllZCB0byByZXNvbHZlIGFuIGExMXkgZXZlbnQgYXMgYSBjbGljayBidXQgZmFpbGVkLlxuICAgKi9cbiAgZGlzcGF0Y2goZXZlbnRJbmZvOiBFdmVudEluZm8sIGlzR2xvYmFsRGlzcGF0Y2g/OiBib29sZWFuKTogRXZlbnRJbmZvIHwgdm9pZCB7XG4gICAgcmV0dXJuIHRoaXMuYmFzZURpc3BhdGNoZXIuZGlzcGF0Y2goZXZlbnRJbmZvLCBpc0dsb2JhbERpc3BhdGNoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEaXNwYXRjaGVzIGFuIGBFdmVudEluZm9XcmFwcGVyYC5cbiAgICovXG4gIHByaXZhdGUgZGlzcGF0Y2hUb0hhbmRsZXIoZXZlbnRJbmZvV3JhcHBlcjogRXZlbnRJbmZvV3JhcHBlciwgaXNHbG9iYWxEaXNwYXRjaD86IGJvb2xlYW4pIHtcbiAgICBpZiAoaXNHbG9iYWxEaXNwYXRjaCkge1xuICAgICAgLy8gU2tpcCBldmVyeXRoaW5nIHJlbGF0ZWQgdG8ganNhY3Rpb24gaGFuZGxlcnMsIGFuZCBleGVjdXRlIHRoZSBnbG9iYWxcbiAgICAgIC8vIGhhbmRsZXJzLlxuICAgICAgY29uc3QgZXYgPSBldmVudEluZm9XcmFwcGVyLmdldEV2ZW50KCk7XG4gICAgICBjb25zdCBldmVudFR5cGVIYW5kbGVycyA9IHRoaXMuZ2xvYmFsSGFuZGxlcnMuZ2V0KGV2ZW50SW5mb1dyYXBwZXIuZ2V0RXZlbnRUeXBlKCkpO1xuICAgICAgbGV0IHNob3VsZFByZXZlbnREZWZhdWx0ID0gZmFsc2U7XG4gICAgICBpZiAoZXZlbnRUeXBlSGFuZGxlcnMpIHtcbiAgICAgICAgZm9yIChjb25zdCBoYW5kbGVyIG9mIGV2ZW50VHlwZUhhbmRsZXJzKSB7XG4gICAgICAgICAgaWYgKGhhbmRsZXIoZXYpID09PSBmYWxzZSkge1xuICAgICAgICAgICAgc2hvdWxkUHJldmVudERlZmF1bHQgPSB0cnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKHNob3VsZFByZXZlbnREZWZhdWx0KSB7XG4gICAgICAgIGV2ZW50TGliLnByZXZlbnREZWZhdWx0KGV2KTtcbiAgICAgIH1cbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5zdG9wUHJvcGFnYXRpb24pIHtcbiAgICAgIHN0b3BQcm9wYWdhdGlvbihldmVudEluZm9XcmFwcGVyKTtcbiAgICB9XG5cbiAgICBjb25zdCBhY3Rpb24gPSBldmVudEluZm9XcmFwcGVyLmdldEFjdGlvbigpITtcblxuICAgIGxldCBoYW5kbGVyOiBFdmVudEluZm9XcmFwcGVySGFuZGxlciB8IHZvaWQgPSB1bmRlZmluZWQ7XG4gICAgaWYgKHRoaXMuZ2V0SGFuZGxlcikge1xuICAgICAgaGFuZGxlciA9IHRoaXMuZ2V0SGFuZGxlcihldmVudEluZm9XcmFwcGVyKTtcbiAgICB9XG5cbiAgICBpZiAoIWhhbmRsZXIpIHtcbiAgICAgIGhhbmRsZXIgPSB0aGlzLmFjdGlvbnNbYWN0aW9uLm5hbWVdO1xuICAgIH1cblxuICAgIGlmIChoYW5kbGVyKSB7XG4gICAgICBoYW5kbGVyKGV2ZW50SW5mb1dyYXBwZXIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIE5vIGhhbmRsZXIgd2FzIGZvdW5kLlxuICAgIHRoaXMuYmFzZURpc3BhdGNoZXIucXVldWVFdmVudEluZm9XcmFwcGVyKGV2ZW50SW5mb1dyYXBwZXIpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlZ2lzdGVycyBtdWx0aXBsZSBtZXRob2RzIGFsbCBib3VuZCB0byB0aGUgc2FtZSBvYmplY3RcbiAgICogaW5zdGFuY2UuIFRoaXMgaXMgYSBjb21tb24gY2FzZTogYW4gYXBwbGljYXRpb24gbW9kdWxlIGJpbmRzXG4gICAqIG11bHRpcGxlIG9mIGl0cyBtZXRob2RzIHVuZGVyIHB1YmxpYyBuYW1lcyB0byB0aGUgZXZlbnQgY29udHJhY3Qgb2ZcbiAgICogdGhlIGFwcGxpY2F0aW9uLiBTbyB3ZSBwcm92aWRlIGEgc2hvcnRjdXQgZm9yIGl0LlxuICAgKiBBdHRlbXB0cyB0byByZXBsYXkgdGhlIHF1ZXVlZCBldmVudHMgYWZ0ZXIgcmVnaXN0ZXJpbmcgdGhlIGhhbmRsZXJzLlxuICAgKlxuICAgKiBAcGFyYW0gbmFtZXNwYWNlIFRoZSBuYW1lc3BhY2Ugb2YgdGhlIGpzYWN0aW9uIG5hbWUuXG4gICAqXG4gICAqIEBwYXJhbSBpbnN0YW5jZSBUaGUgb2JqZWN0IHRvIGJpbmQgdGhlIG1ldGhvZHMgdG8uIElmIHRoaXMgaXMgbnVsbCwgdGhlblxuICAgKiAgICAgdGhlIGZ1bmN0aW9ucyBhcmUgbm90IGJvdW5kLCBidXQgZGlyZWN0bHkgYWRkZWQgdW5kZXIgdGhlIHB1YmxpYyBuYW1lcy5cbiAgICpcbiAgICogQHBhcmFtIG1ldGhvZHMgQSBtYXAgZnJvbSBwdWJsaWMgbmFtZSB0byBmdW5jdGlvbnMgdGhhdCB3aWxsIGJlIGJvdW5kIHRvXG4gICAqICAgICBpbnN0YW5jZSBhbmQgcmVnaXN0ZXJlZCBhcyBhY3Rpb24gdW5kZXIgdGhlIHB1YmxpYyBuYW1lLiBJLmUuIHRoZVxuICAgKiAgICAgcHJvcGVydHkgbmFtZXMgYXJlIHRoZSBwdWJsaWMgbmFtZXMuIFRoZSBwcm9wZXJ0eSB2YWx1ZXMgYXJlIHRoZVxuICAgKiAgICAgbWV0aG9kcyBvZiBpbnN0YW5jZS5cbiAgICovXG4gIHJlZ2lzdGVyRXZlbnRJbmZvSGFuZGxlcnM8VD4oXG4gICAgbmFtZXNwYWNlOiBzdHJpbmcsXG4gICAgaW5zdGFuY2U6IFQgfCBudWxsLFxuICAgIG1ldGhvZHM6IHtba2V5OiBzdHJpbmddOiBFdmVudEluZm9XcmFwcGVySGFuZGxlcn0sXG4gICkge1xuICAgIGZvciAoY29uc3QgW25hbWUsIG1ldGhvZF0gb2YgT2JqZWN0LmVudHJpZXMobWV0aG9kcykpIHtcbiAgICAgIGNvbnN0IGhhbmRsZXIgPSBpbnN0YW5jZSA/IG1ldGhvZC5iaW5kKGluc3RhbmNlKSA6IG1ldGhvZDtcbiAgICAgIGlmIChuYW1lc3BhY2UpIHtcbiAgICAgICAgLy8gSW5jbHVkZSBhICcuJyBzZXBhcmF0b3IgYmV0d2VlbiBuYW1lc3BhY2UgbmFtZSBhbmQgYWN0aW9uIG5hbWUuXG4gICAgICAgIC8vIEluIHRoZSBjYXNlIHRoYXQgbm8gbmFtZXNwYWNlIG5hbWUgaXMgcHJvdmlkZWQsIHRoZSBqc2FjdGlvbiBuYW1lXG4gICAgICAgIC8vIGNvbnNpc3RzIG9mIHRoZSBhY3Rpb24gbmFtZSBvbmx5IChubyBwZXJpb2QpLlxuICAgICAgICBjb25zdCBmdWxsTmFtZSA9IG5hbWVzcGFjZSArIENoYXIuTkFNRVNQQUNFX0FDVElPTl9TRVBBUkFUT1IgKyBuYW1lO1xuICAgICAgICB0aGlzLmFjdGlvbnNbZnVsbE5hbWVdID0gaGFuZGxlcjtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuYWN0aW9uc1tuYW1lXSA9IGhhbmRsZXI7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5iYXNlRGlzcGF0Y2hlci5zY2hlZHVsZUV2ZW50UmVwbGF5KCk7XG4gIH1cblxuICAvKipcbiAgICogVW5yZWdpc3RlcnMgYW4gYWN0aW9uLiAgUHJvdmlkZWQgYXMgYW4gZWFzeSB3YXkgdG8gcmV2ZXJzZSB0aGUgZWZmZWN0cyBvZlxuICAgKiByZWdpc3RlckhhbmRsZXJzLlxuICAgKiBAcGFyYW0gbmFtZXNwYWNlIFRoZSBuYW1lc3BhY2Ugb2YgdGhlIGpzYWN0aW9uIG5hbWUuXG4gICAqIEBwYXJhbSBuYW1lIFRoZSBhY3Rpb24gbmFtZSB0byB1bmJpbmQuXG4gICAqL1xuICB1bnJlZ2lzdGVySGFuZGxlcihuYW1lc3BhY2U6IHN0cmluZywgbmFtZTogc3RyaW5nKSB7XG4gICAgY29uc3QgZnVsbE5hbWUgPSBuYW1lc3BhY2UgPyBuYW1lc3BhY2UgKyBDaGFyLk5BTUVTUEFDRV9BQ1RJT05fU0VQQVJBVE9SICsgbmFtZSA6IG5hbWU7XG4gICAgZGVsZXRlIHRoaXMuYWN0aW9uc1tmdWxsTmFtZV07XG4gIH1cblxuICAvKiogUmVnaXN0ZXJzIGEgZ2xvYmFsIGV2ZW50IGhhbmRsZXIuICovXG4gIHJlZ2lzdGVyR2xvYmFsSGFuZGxlcihldmVudFR5cGU6IHN0cmluZywgaGFuZGxlcjogR2xvYmFsSGFuZGxlcikge1xuICAgIGlmICghdGhpcy5nbG9iYWxIYW5kbGVycy5oYXMoZXZlbnRUeXBlKSkge1xuICAgICAgdGhpcy5nbG9iYWxIYW5kbGVycy5zZXQoZXZlbnRUeXBlLCBuZXcgU2V0PEdsb2JhbEhhbmRsZXI+KFtoYW5kbGVyXSkpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmdsb2JhbEhhbmRsZXJzLmdldChldmVudFR5cGUpIS5hZGQoaGFuZGxlcik7XG4gICAgfVxuICB9XG5cbiAgLyoqIFVucmVnaXN0ZXJzIGEgZ2xvYmFsIGV2ZW50IGhhbmRsZXIuICovXG4gIHVucmVnaXN0ZXJHbG9iYWxIYW5kbGVyKGV2ZW50VHlwZTogc3RyaW5nLCBoYW5kbGVyOiBHbG9iYWxIYW5kbGVyKSB7XG4gICAgaWYgKHRoaXMuZ2xvYmFsSGFuZGxlcnMuaGFzKGV2ZW50VHlwZSkpIHtcbiAgICAgIHRoaXMuZ2xvYmFsSGFuZGxlcnMuZ2V0KGV2ZW50VHlwZSkhLmRlbGV0ZShoYW5kbGVyKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2tzIHdoZXRoZXIgdGhlcmUgaXMgYW4gYWN0aW9uIHJlZ2lzdGVyZWQgdW5kZXIgdGhlIGdpdmVuXG4gICAqIG5hbWUuIFRoaXMgcmV0dXJucyB0cnVlIGlmIHRoZXJlIGlzIGEgbmFtZXNwYWNlIGhhbmRsZXIsIGV2ZW5cbiAgICogaWYgaXQgY2FuIG5vdCB5ZXQgaGFuZGxlIHRoZSBldmVudC5cbiAgICpcbiAgICogQHBhcmFtIG5hbWUgQWN0aW9uIG5hbWUuXG4gICAqIEByZXR1cm4gV2hldGhlciB0aGUgbmFtZSBpcyByZWdpc3RlcmVkLlxuICAgKiBAc2VlICNjYW5EaXNwYXRjaFxuICAgKi9cbiAgaGFzQWN0aW9uKG5hbWU6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLmFjdGlvbnMuaGFzT3duUHJvcGVydHkobmFtZSk7XG4gIH1cblxuICAvKipcbiAgICogV2hldGhlciB0aGlzIGRpc3BhdGNoZXIgY2FuIGRpc3BhdGNoIHRoZSBldmVudC4gVGhpcyBjYW4gYmUgdXNlZCBieVxuICAgKiBldmVudCByZXBsYXllciB0byBjaGVjayB3aGV0aGVyIHRoZSBkaXNwYXRjaGVyIGNhbiByZXBsYXkgYW4gZXZlbnQuXG4gICAqL1xuICBjYW5EaXNwYXRjaChldmVudEluZm9XcmFwcGVyOiBFdmVudEluZm9XcmFwcGVyKTogYm9vbGVhbiB7XG4gICAgY29uc3QgYWN0aW9uID0gZXZlbnRJbmZvV3JhcHBlci5nZXRBY3Rpb24oKTtcbiAgICBpZiAoIWFjdGlvbikge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5oYXNBY3Rpb24oYWN0aW9uLm5hbWUpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGV2ZW50IHJlcGxheWVyLCBlbmFibGluZyBxdWV1ZWQgZXZlbnRzIHRvIGJlIHJlcGxheWVkIHdoZW4gYWN0aW9uc1xuICAgKiBhcmUgYm91bmQuIFRvIHJlcGxheSBldmVudHMsIHlvdSBtdXN0IHJlZ2lzdGVyIHRoZSBkaXNwYXRjaGVyIHRvIHRoZVxuICAgKiBjb250cmFjdCBhZnRlciBzZXR0aW5nIHRoZSBgRXZlbnRSZXBsYXllcmAuIFRoZSBldmVudCByZXBsYXllciB0YWtlcyBhc1xuICAgKiBwYXJhbWV0ZXJzIHRoZSBxdWV1ZSBvZiBldmVudHMgYW5kIHRoZSBkaXNwYXRjaGVyICh1c2VkIHRvIGNoZWNrIHdoZXRoZXJcbiAgICogYWN0aW9ucyBoYXZlIGhhbmRsZXJzIHJlZ2lzdGVyZWQgYW5kIGNhbiBiZSByZXBsYXllZCkuIFRoZSBldmVudCByZXBsYXllclxuICAgKiBpcyBhbHNvIHJlc3BvbnNpYmxlIGZvciBkZXF1ZXVpbmcgZXZlbnRzLlxuICAgKlxuICAgKiBFeGFtcGxlOiBBbiBldmVudCByZXBsYXllciB0aGF0IHJlcGxheXMgb25seSB0aGUgbGFzdCBldmVudC5cbiAgICpcbiAgICogICBjb25zdCBkaXNwYXRjaGVyID0gbmV3IERpc3BhdGNoZXIoKTtcbiAgICogICAvLyAuLi5cbiAgICogICBkaXNwYXRjaGVyLnNldEV2ZW50UmVwbGF5ZXIoKHF1ZXVlLCBkaXNwYXRjaGVyKSA9PiB7XG4gICAqICAgICBjb25zdCBsYXN0RXZlbnRJbmZvV3JhcHBlciA9IHF1ZXVlW3F1ZXVlLmxlbmd0aCAtMV07XG4gICAqICAgICBpZiAoZGlzcGF0Y2hlci5jYW5EaXNwYXRjaChsYXN0RXZlbnRJbmZvV3JhcHBlci5nZXRBY3Rpb24oKSkpIHtcbiAgICogICAgICAganNhY3Rpb24ucmVwbGF5LnJlcGxheUV2ZW50KFxuICAgKiAgICAgICAgICAgbGFzdEV2ZW50SW5mb1dyYXBwZXIuZ2V0RXZlbnQoKSxcbiAgICogICAgICAgICAgIGxhc3RFdmVudEluZm9XcmFwcGVyLmdldFRhcmdldEVsZW1lbnQoKSxcbiAgICogICAgICAgICAgIGxhc3RFdmVudEluZm9XcmFwcGVyLmdldEV2ZW50VHlwZSgpLFxuICAgKiAgICAgICApO1xuICAgKiAgICAgICBxdWV1ZS5sZW5ndGggPSAwO1xuICAgKiAgICAgfVxuICAgKiAgIH0pO1xuICAgKlxuICAgKiBAcGFyYW0gZXZlbnRSZXBsYXllciBJdCBhbGxvd3MgZWxlbWVudHMgdG8gYmUgcmVwbGF5ZWQgYW5kIGRlcXVldWluZy5cbiAgICovXG4gIHNldEV2ZW50UmVwbGF5ZXIoZXZlbnRSZXBsYXllcjogUmVwbGF5ZXIpIHtcbiAgICB0aGlzLmV2ZW50UmVwbGF5ZXIgPSBldmVudFJlcGxheWVyO1xuICB9XG59XG5cbi8qKiBTdG9wIHByb3BhZ2F0aW9uIGZvciBhbiBgRXZlbnRJbmZvYC4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzdG9wUHJvcGFnYXRpb24oZXZlbnRJbmZvV3JhcHBlcjogRXZlbnRJbmZvV3JhcHBlcikge1xuICBpZiAoXG4gICAgZXZlbnRMaWIuaXNHZWNrbyAmJlxuICAgIChldmVudEluZm9XcmFwcGVyLmdldFRhcmdldEVsZW1lbnQoKS50YWdOYW1lID09PSAnSU5QVVQnIHx8XG4gICAgICBldmVudEluZm9XcmFwcGVyLmdldFRhcmdldEVsZW1lbnQoKS50YWdOYW1lID09PSAnVEVYVEFSRUEnKSAmJlxuICAgIGV2ZW50SW5mb1dyYXBwZXIuZ2V0RXZlbnRUeXBlKCkgPT09IEV2ZW50VHlwZS5GT0NVU1xuICApIHtcbiAgICAvKipcbiAgICAgKiBEbyBub3RoaW5nIHNpbmNlIHN0b3BwaW5nIHByb3BhZ2F0aW9uIG9uIGEgZm9jdXMgZXZlbnQgb24gYW4gaW5wdXRcbiAgICAgKiBlbGVtZW50IGluIEZpcmVmb3ggbWFrZXMgdGhlIHRleHQgY3Vyc29yIGRpc2FwcGVhcjpcbiAgICAgKiBodHRwczovL2J1Z3ppbGxhLm1vemlsbGEub3JnL3Nob3dfYnVnLmNnaT9pZD01MDk2ODRcbiAgICAgKi9cbiAgICByZXR1cm47XG4gIH1cblxuICBjb25zdCBldmVudCA9IGV2ZW50SW5mb1dyYXBwZXIuZ2V0RXZlbnQoKTtcbiAgLy8gVGhlcmUgYXJlIHNvbWUgY2FzZXMgd2hlcmUgdXNlcnMgb2YgdGhlIGBEaXNwYXRjaGVyYCB3aWxsIGNhbGwgZGlzcGF0Y2hcbiAgLy8gd2l0aCBhIGZha2UgZXZlbnQgdGhhdCBkb2VzIG5vdCBzdXBwb3J0IGBzdG9wUHJvcGFnYXRpb25gLlxuICBpZiAoIWV2ZW50LnN0b3BQcm9wYWdhdGlvbikge1xuICAgIHJldHVybjtcbiAgfVxuICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbn1cblxuLyoqXG4gKiBSZWdpc3RlcnMgZGVmZXJyZWQgZnVuY3Rpb25hbGl0eSBmb3IgYW4gRXZlbnRDb250cmFjdCBhbmQgYSBKc2FjdGlvblxuICogRGlzcGF0Y2hlci5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlZ2lzdGVyRGlzcGF0Y2hlcihldmVudENvbnRyYWN0OiBVbnJlbmFtZWRFdmVudENvbnRyYWN0LCBkaXNwYXRjaGVyOiBEaXNwYXRjaGVyKSB7XG4gIGV2ZW50Q29udHJhY3QuZWNyZCgoZXZlbnRJbmZvOiBFdmVudEluZm8sIGdsb2JhbERpc3BhdGNoPzogYm9vbGVhbikgPT4ge1xuICAgIHJldHVybiBkaXNwYXRjaGVyLmRpc3BhdGNoKGV2ZW50SW5mbywgZ2xvYmFsRGlzcGF0Y2gpO1xuICB9LCBSZXN0cmljdGlvbi5JX0FNX1RIRV9KU0FDVElPTl9GUkFNRVdPUkspO1xufVxuIl19