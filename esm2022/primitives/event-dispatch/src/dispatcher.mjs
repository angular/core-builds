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
        this.baseDispatcher = new BaseDispatcher((eventInfoWrapper) => {
            this.dispatchToHandler(eventInfoWrapper);
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
     */
    dispatch(eventInfo, isGlobalDispatch) {
        this.baseDispatcher.dispatch(eventInfo);
    }
    /**
     * Dispatches an `EventInfoWrapper`.
     */
    dispatchToHandler(eventInfoWrapper) {
        if (this.globalHandlers.size) {
            const globalEventInfoWrapper = eventInfoWrapper.clone();
            // In some cases, `populateAction` will rewrite `click` events to
            // `clickonly`. Revert back to a regular click, otherwise we won't be able
            // to execute global event handlers registered on click events.
            if (globalEventInfoWrapper.getEventType() === EventType.CLICKONLY) {
                globalEventInfoWrapper.setEventType(EventType.CLICK);
            }
            // Skip everything related to jsaction handlers, and execute the global
            // handlers.
            const event = globalEventInfoWrapper.getEvent();
            const eventTypeHandlers = this.globalHandlers.get(globalEventInfoWrapper.getEventType());
            let shouldPreventDefault = false;
            if (eventTypeHandlers) {
                for (const handler of eventTypeHandlers) {
                    if (handler(event) === false) {
                        shouldPreventDefault = true;
                    }
                }
            }
            if (shouldPreventDefault) {
                eventLib.preventDefault(event);
            }
        }
        const action = eventInfoWrapper.getAction();
        if (!action) {
            return;
        }
        if (this.stopPropagation) {
            stopPropagation(eventInfoWrapper);
        }
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
    eventContract.ecrd((eventInfo) => {
        dispatcher.dispatch(eventInfo);
    }, Restriction.I_AM_THE_JSACTION_FRAMEWORK);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlzcGF0Y2hlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvcHJpbWl0aXZlcy9ldmVudC1kaXNwYXRjaC9zcmMvZGlzcGF0Y2hlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsY0FBYyxFQUEwQixNQUFNLG1CQUFtQixDQUFDO0FBQzFFLE9BQU8sRUFBQyxJQUFJLEVBQUMsTUFBTSxRQUFRLENBQUM7QUFDNUIsT0FBTyxLQUFLLFFBQVEsTUFBTSxTQUFTLENBQUM7QUFFcEMsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLGNBQWMsQ0FBQztBQUV2QyxPQUFPLEVBQUMsV0FBVyxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBZ0IxQzs7OztHQUlHO0FBQ0gsTUFBTSxPQUFPLFVBQVU7SUFtQnJCOzs7Ozs7O09BT0c7SUFDSCxZQUNtQixVQUVrQixFQUNuQyxFQUNFLGVBQWUsR0FBRyxLQUFLLEVBQ3ZCLGFBQWEsR0FBRyxTQUFTLE1BQ2dDLEVBQUU7UUFONUMsZUFBVSxHQUFWLFVBQVUsQ0FFUTtRQXhCckM7Ozs7V0FJRztRQUNjLFlBQU8sR0FBNkMsRUFBRSxDQUFDO1FBRXhFLHVFQUF1RTtRQUN0RCxtQkFBYyxHQUFHLElBQUksR0FBRyxFQUE4QixDQUFDO1FBc0J0RSxJQUFJLENBQUMsYUFBYSxHQUFHLGFBQWEsQ0FBQztRQUNuQyxJQUFJLENBQUMsY0FBYyxHQUFHLElBQUksY0FBYyxDQUN0QyxDQUFDLGdCQUFrQyxFQUFFLEVBQUU7WUFDckMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLGdCQUFnQixDQUFDLENBQUM7UUFDM0MsQ0FBQyxFQUNEO1lBQ0UsYUFBYSxFQUFFLENBQUMsaUJBQWlCLEVBQUUsRUFBRTtnQkFDbkMsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDLGlCQUFpQixFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ2hELENB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QTZEO0lBQzdELElBQUksQ0FBQyxLQUFLLENBQUMsZUFBZSxFQUFFLENBQUM7UUFDM0IsT0FBTztJQUNULENBQUM7SUFDRCxLQUFLLENBQUMsZUFBZSxFQUFFLENBQUM7QUFDMUIsQ0FBQztBQUVEOzs7R0FHRztBQUNILE1BQU0sVUFBVSxrQkFBa0IsQ0FBQyxhQUFxQyxFQUFFLFVBQXNCO0lBQzlGLGFBQWEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxTQUFvQixFQUFFLEVBQUU7UUFDMUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUNqQyxDQUFDLEVBQUUsV0FBVyxDQUFDLDJCQUEyQixDQUFDLENBQUM7QUFDOUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0Jhc2VEaXNwYXRjaGVyLCBFdmVudEluZm9XcmFwcGVySGFuZGxlcn0gZnJvbSAnLi9iYXNlX2Rpc3BhdGNoZXInO1xuaW1wb3J0IHtDaGFyfSBmcm9tICcuL2NoYXInO1xuaW1wb3J0ICogYXMgZXZlbnRMaWIgZnJvbSAnLi9ldmVudCc7XG5pbXBvcnQge0V2ZW50SW5mbywgRXZlbnRJbmZvV3JhcHBlcn0gZnJvbSAnLi9ldmVudF9pbmZvJztcbmltcG9ydCB7RXZlbnRUeXBlfSBmcm9tICcuL2V2ZW50X3R5cGUnO1xuaW1wb3J0IHtVbnJlbmFtZWRFdmVudENvbnRyYWN0fSBmcm9tICcuL2V2ZW50Y29udHJhY3QnO1xuaW1wb3J0IHtSZXN0cmljdGlvbn0gZnJvbSAnLi9yZXN0cmljdGlvbic7XG5cbmV4cG9ydCB0eXBlIHtFdmVudEluZm9XcmFwcGVySGFuZGxlciBhcyBFdmVudEluZm9IYW5kbGVyfSBmcm9tICcuL2Jhc2VfZGlzcGF0Y2hlcic7XG5cbi8qKlxuICogQSBnbG9iYWwgaGFuZGxlciBpcyBkaXNwYXRjaGVkIHRvIGJlZm9yZSBub3JtYWwgaGFuZGxlciBkaXNwYXRjaC4gUmV0dXJuaW5nXG4gKiBmYWxzZSB3aWxsIGBwcmV2ZW50RGVmYXVsdGAgb24gdGhlIGV2ZW50LlxuICovXG5leHBvcnQgdHlwZSBHbG9iYWxIYW5kbGVyID0gKGV2ZW50OiBFdmVudCkgPT4gYm9vbGVhbiB8IHZvaWQ7XG5cbi8qKlxuICogQSByZXBsYXllciBpcyBhIGZ1bmN0aW9uIHRoYXQgaXMgY2FsbGVkIHdoZW4gdGhlcmUgYXJlIHF1ZXVlZCBldmVudHMsXG4gKiBlaXRoZXIgZnJvbSB0aGUgYEV2ZW50Q29udHJhY3RgIG9yIHdoZW4gdGhlcmUgYXJlIG5vIGRldGVjdGVkIGhhbmRsZXJzLlxuICovXG5leHBvcnQgdHlwZSBSZXBsYXllciA9IChldmVudEluZm9XcmFwcGVyczogRXZlbnRJbmZvV3JhcHBlcltdLCBkaXNwYXRjaGVyOiBEaXNwYXRjaGVyKSA9PiB2b2lkO1xuXG4vKipcbiAqIFJlY2VpdmVzIGEgRE9NIGV2ZW50LCBkZXRlcm1pbmVzIHRoZSBqc2FjdGlvbiBhc3NvY2lhdGVkIHdpdGggdGhlIHNvdXJjZVxuICogZWxlbWVudCBvZiB0aGUgRE9NIGV2ZW50LCBhbmQgaW52b2tlcyB0aGUgaGFuZGxlciBhc3NvY2lhdGVkIHdpdGggdGhlXG4gKiBqc2FjdGlvbi5cbiAqL1xuZXhwb3J0IGNsYXNzIERpc3BhdGNoZXIge1xuICBwcml2YXRlIHJlYWRvbmx5IGJhc2VEaXNwYXRjaGVyOiBCYXNlRGlzcGF0Y2hlcjtcblxuICAvKiogV2hldGhlciB0byBzdG9wIHByb3BhZ2F0aW9uIGZvciBhbiBgRXZlbnRJbmZvYC4gKi9cbiAgcHJpdmF0ZSByZWFkb25seSBzdG9wUHJvcGFnYXRpb246IGJvb2xlYW47XG5cbiAgLyoqXG4gICAqIFRoZSBhY3Rpb25zIHRoYXQgYXJlIHJlZ2lzdGVyZWQgZm9yIHRoaXMgRGlzcGF0Y2hlciBpbnN0YW5jZS5cbiAgICogVGhpcyBzaG91bGQgYmUgdGhlIHByaW1hcnkgb25lIHVzZWQgb25jZSBtaWdyYXRpb24gb2ZmIG9mIHJlZ2lzdGVySGFuZGxlcnNcbiAgICogaXMgZG9uZS5cbiAgICovXG4gIHByaXZhdGUgcmVhZG9ubHkgYWN0aW9uczoge1trZXk6IHN0cmluZ106IEV2ZW50SW5mb1dyYXBwZXJIYW5kbGVyfSA9IHt9O1xuXG4gIC8qKiBBIG1hcCBvZiBnbG9iYWwgZXZlbnQgaGFuZGxlcnMsIHdoZXJlIGVhY2gga2V5IGlzIGFuIGV2ZW50IHR5cGUuICovXG4gIHByaXZhdGUgcmVhZG9ubHkgZ2xvYmFsSGFuZGxlcnMgPSBuZXcgTWFwPHN0cmluZywgU2V0PEdsb2JhbEhhbmRsZXI+PigpO1xuXG4gIC8qKiBUaGUgZXZlbnQgcmVwbGF5ZXIuICovXG4gIHByaXZhdGUgZXZlbnRSZXBsYXllcj86IFJlcGxheWVyO1xuXG4gIC8qKlxuICAgKiBSZWNlaXZlcyBhIERPTSBldmVudCwgZGV0ZXJtaW5lcyB0aGUganNhY3Rpb24gYXNzb2NpYXRlZCB3aXRoIHRoZSBzb3VyY2VcbiAgICogZWxlbWVudCBvZiB0aGUgRE9NIGV2ZW50LCBhbmQgaW52b2tlcyB0aGUgaGFuZGxlciBhc3NvY2lhdGVkIHdpdGggdGhlXG4gICAqIGpzYWN0aW9uLlxuICAgKlxuICAgKiBAcGFyYW0gZ2V0SGFuZGxlciBBIGZ1bmN0aW9uIHRoYXQga25vd3MgaG93IHRvIGdldCB0aGUgaGFuZGxlciBmb3IgYVxuICAgKiAgICAgZ2l2ZW4gZXZlbnQgaW5mby5cbiAgICovXG4gIGNvbnN0cnVjdG9yKFxuICAgIHByaXZhdGUgcmVhZG9ubHkgZ2V0SGFuZGxlcj86IChcbiAgICAgIGV2ZW50SW5mb1dyYXBwZXI6IEV2ZW50SW5mb1dyYXBwZXIsXG4gICAgKSA9PiBFdmVudEluZm9XcmFwcGVySGFuZGxlciB8IHZvaWQsXG4gICAge1xuICAgICAgc3RvcFByb3BhZ2F0aW9uID0gZmFsc2UsXG4gICAgICBldmVudFJlcGxheWVyID0gdW5kZWZpbmVkLFxuICAgIH06IHtzdG9wUHJvcGFnYXRpb24/OiBib29sZWFuOyBldmVudFJlcGxheWVyPzogUmVwbGF5ZXJ9ID0ge30sXG4gICkge1xuICAgIHRoaXMuZXZlbnRSZXBsYXllciA9IGV2ZW50UmVwbGF5ZXI7XG4gICAgdGhpcy5iYXNlRGlzcGF0Y2hlciA9IG5ldyBCYXNlRGlzcGF0Y2hlcihcbiAgICAgIChldmVudEluZm9XcmFwcGVyOiBFdmVudEluZm9XcmFwcGVyKSA9PiB7XG4gICAgICAgIHRoaXMuZGlzcGF0Y2hUb0hhbmRsZXIoZXZlbnRJbmZvV3JhcHBlcik7XG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBldmVudFJlcGxheWVyOiAoZXZlbnRJbmZvV3JhcHBlcnMpID0+IHtcbiAgICAgICAgICB0aGlzLmV2ZW50UmVwbGF5ZXI/LihldmVudEluZm9XcmFwcGVycywgdGhpcyk7XG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICk7XG4gICAgdGhpcy5zdG9wUHJvcGFnYXRpb24gPSBzdG9wUHJvcGFnYXRpb247XG4gIH1cblxuICAvKipcbiAgICogUmVjZWl2ZXMgYW4gZXZlbnQgb3IgdGhlIGV2ZW50IHF1ZXVlIGZyb20gdGhlIEV2ZW50Q29udHJhY3QuIFRoZSBldmVudFxuICAgKiBxdWV1ZSBpcyBjb3BpZWQgYW5kIGl0IGF0dGVtcHRzIHRvIHJlcGxheS5cbiAgICogSWYgZXZlbnQgaW5mbyBpcyBwYXNzZWQgaW4gaXQgbG9va3MgZm9yIGFuIGFjdGlvbiBoYW5kbGVyIHRoYXQgY2FuIGhhbmRsZVxuICAgKiB0aGUgZ2l2ZW4gZXZlbnQuICBJZiB0aGVyZSBpcyBubyBoYW5kbGVyIHJlZ2lzdGVyZWQgcXVldWVzIHRoZSBldmVudCBhbmRcbiAgICogY2hlY2tzIGlmIGEgbG9hZGVyIGlzIHJlZ2lzdGVyZWQgZm9yIHRoZSBnaXZlbiBuYW1lc3BhY2UuIElmIHNvLCBjYWxscyBpdC5cbiAgICpcbiAgICogQWx0ZXJuYXRpdmVseSwgaWYgaW4gZ2xvYmFsIGRpc3BhdGNoIG1vZGUsIGNhbGxzIGFsbCByZWdpc3RlcmVkIGdsb2JhbFxuICAgKiBoYW5kbGVycyBmb3IgdGhlIGFwcHJvcHJpYXRlIGV2ZW50IHR5cGUuXG4gICAqXG4gICAqIFRoZSB0aHJlZSBmdW5jdGlvbmFsaXRpZXMgb2YgdGhpcyBjYWxsIGFyZSBkZWxpYmVyYXRlbHkgbm90IHNwbGl0IGludG9cbiAgICogdGhyZWUgbWV0aG9kcyAoYW5kIHRoZW4gZGVjbGFyZWQgYXMgYW4gYWJzdHJhY3QgaW50ZXJmYWNlKSwgYmVjYXVzZSB0aGVcbiAgICogaW50ZXJmYWNlIGlzIHVzZWQgYnkgRXZlbnRDb250cmFjdCwgd2hpY2ggbGl2ZXMgaW4gYSBkaWZmZXJlbnQganNiaW5hcnkuXG4gICAqIFRoZXJlZm9yZSB0aGUgaW50ZXJmYWNlIGJldHdlZW4gdGhlIHRocmVlIGlzIGRlZmluZWQgZW50aXJlbHkgaW4gdGVybXMgdGhhdFxuICAgKiBhcmUgaW52YXJpYW50IHVuZGVyIGpzY29tcGlsZXIgcHJvY2Vzc2luZyAoRnVuY3Rpb24gYW5kIEFycmF5LCBhcyBvcHBvc2VkXG4gICAqIHRvIGEgY3VzdG9tIHR5cGUgd2l0aCBtZXRob2QgbmFtZXMpLlxuICAgKlxuICAgKiBAcGFyYW0gZXZlbnRJbmZvIFRoZSBpbmZvIGZvciB0aGUgZXZlbnQgdGhhdCB0cmlnZ2VyZWQgdGhpcyBjYWxsIG9yIHRoZVxuICAgKiAgICAgcXVldWUgb2YgZXZlbnRzIGZyb20gRXZlbnRDb250cmFjdC5cbiAgICovXG4gIGRpc3BhdGNoKGV2ZW50SW5mbzogRXZlbnRJbmZvLCBpc0dsb2JhbERpc3BhdGNoPzogYm9vbGVhbik6IHZvaWQge1xuICAgIHRoaXMuYmFzZURpc3BhdGNoZXIuZGlzcGF0Y2goZXZlbnRJbmZvKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEaXNwYXRjaGVzIGFuIGBFdmVudEluZm9XcmFwcGVyYC5cbiAgICovXG4gIHByaXZhdGUgZGlzcGF0Y2hUb0hhbmRsZXIoZXZlbnRJbmZvV3JhcHBlcjogRXZlbnRJbmZvV3JhcHBlcikge1xuICAgIGlmICh0aGlzLmdsb2JhbEhhbmRsZXJzLnNpemUpIHtcbiAgICAgIGNvbnN0IGdsb2JhbEV2ZW50SW5mb1dyYXBwZXIgPSBldmVudEluZm9XcmFwcGVyLmNsb25lKCk7XG5cbiAgICAgIC8vIEluIHNvbWUgY2FzZXMsIGBwb3B1bGF0ZUFjdGlvbmAgd2lsbCByZXdyaXRlIGBjbGlja2AgZXZlbnRzIHRvXG4gICAgICAvLyBgY2xpY2tvbmx5YC4gUmV2ZXJ0IGJhY2sgdG8gYSByZWd1bGFyIGNsaWNrLCBvdGhlcndpc2Ugd2Ugd29uJ3QgYmUgYWJsZVxuICAgICAgLy8gdG8gZXhlY3V0ZSBnbG9iYWwgZXZlbnQgaGFuZGxlcnMgcmVnaXN0ZXJlZCBvbiBjbGljayBldmVudHMuXG4gICAgICBpZiAoZ2xvYmFsRXZlbnRJbmZvV3JhcHBlci5nZXRFdmVudFR5cGUoKSA9PT0gRXZlbnRUeXBlLkNMSUNLT05MWSkge1xuICAgICAgICBnbG9iYWxFdmVudEluZm9XcmFwcGVyLnNldEV2ZW50VHlwZShFdmVudFR5cGUuQ0xJQ0spO1xuICAgICAgfVxuICAgICAgLy8gU2tpcCBldmVyeXRoaW5nIHJlbGF0ZWQgdG8ganNhY3Rpb24gaGFuZGxlcnMsIGFuZCBleGVjdXRlIHRoZSBnbG9iYWxcbiAgICAgIC8vIGhhbmRsZXJzLlxuICAgICAgY29uc3QgZXZlbnQgPSBnbG9iYWxFdmVudEluZm9XcmFwcGVyLmdldEV2ZW50KCk7XG4gICAgICBjb25zdCBldmVudFR5cGVIYW5kbGVycyA9IHRoaXMuZ2xvYmFsSGFuZGxlcnMuZ2V0KGdsb2JhbEV2ZW50SW5mb1dyYXBwZXIuZ2V0RXZlbnRUeXBlKCkpO1xuICAgICAgbGV0IHNob3VsZFByZXZlbnREZWZhdWx0ID0gZmFsc2U7XG4gICAgICBpZiAoZXZlbnRUeXBlSGFuZGxlcnMpIHtcbiAgICAgICAgZm9yIChjb25zdCBoYW5kbGVyIG9mIGV2ZW50VHlwZUhhbmRsZXJzKSB7XG4gICAgICAgICAgaWYgKGhhbmRsZXIoZXZlbnQpID09PSBmYWxzZSkge1xuICAgICAgICAgICAgc2hvdWxkUHJldmVudERlZmF1bHQgPSB0cnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKHNob3VsZFByZXZlbnREZWZhdWx0KSB7XG4gICAgICAgIGV2ZW50TGliLnByZXZlbnREZWZhdWx0KGV2ZW50KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCBhY3Rpb24gPSBldmVudEluZm9XcmFwcGVyLmdldEFjdGlvbigpO1xuICAgIGlmICghYWN0aW9uKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuc3RvcFByb3BhZ2F0aW9uKSB7XG4gICAgICBzdG9wUHJvcGFnYXRpb24oZXZlbnRJbmZvV3JhcHBlcik7XG4gICAgfVxuXG4gICAgbGV0IGhhbmRsZXI6IEV2ZW50SW5mb1dyYXBwZXJIYW5kbGVyIHwgdm9pZCA9IHVuZGVmaW5lZDtcbiAgICBpZiAodGhpcy5nZXRIYW5kbGVyKSB7XG4gICAgICBoYW5kbGVyID0gdGhpcy5nZXRIYW5kbGVyKGV2ZW50SW5mb1dyYXBwZXIpO1xuICAgIH1cblxuICAgIGlmICghaGFuZGxlcikge1xuICAgICAgaGFuZGxlciA9IHRoaXMuYWN0aW9uc1thY3Rpb24ubmFtZV07XG4gICAgfVxuXG4gICAgaWYgKGhhbmRsZXIpIHtcbiAgICAgIGhhbmRsZXIoZXZlbnRJbmZvV3JhcHBlcik7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gTm8gaGFuZGxlciB3YXMgZm91bmQuXG4gICAgdGhpcy5iYXNlRGlzcGF0Y2hlci5xdWV1ZUV2ZW50SW5mb1dyYXBwZXIoZXZlbnRJbmZvV3JhcHBlcik7XG4gIH1cblxuICAvKipcbiAgICogUmVnaXN0ZXJzIG11bHRpcGxlIG1ldGhvZHMgYWxsIGJvdW5kIHRvIHRoZSBzYW1lIG9iamVjdFxuICAgKiBpbnN0YW5jZS4gVGhpcyBpcyBhIGNvbW1vbiBjYXNlOiBhbiBhcHBsaWNhdGlvbiBtb2R1bGUgYmluZHNcbiAgICogbXVsdGlwbGUgb2YgaXRzIG1ldGhvZHMgdW5kZXIgcHVibGljIG5hbWVzIHRvIHRoZSBldmVudCBjb250cmFjdCBvZlxuICAgKiB0aGUgYXBwbGljYXRpb24uIFNvIHdlIHByb3ZpZGUgYSBzaG9ydGN1dCBmb3IgaXQuXG4gICAqIEF0dGVtcHRzIHRvIHJlcGxheSB0aGUgcXVldWVkIGV2ZW50cyBhZnRlciByZWdpc3RlcmluZyB0aGUgaGFuZGxlcnMuXG4gICAqXG4gICAqIEBwYXJhbSBuYW1lc3BhY2UgVGhlIG5hbWVzcGFjZSBvZiB0aGUganNhY3Rpb24gbmFtZS5cbiAgICpcbiAgICogQHBhcmFtIGluc3RhbmNlIFRoZSBvYmplY3QgdG8gYmluZCB0aGUgbWV0aG9kcyB0by4gSWYgdGhpcyBpcyBudWxsLCB0aGVuXG4gICAqICAgICB0aGUgZnVuY3Rpb25zIGFyZSBub3QgYm91bmQsIGJ1dCBkaXJlY3RseSBhZGRlZCB1bmRlciB0aGUgcHVibGljIG5hbWVzLlxuICAgKlxuICAgKiBAcGFyYW0gbWV0aG9kcyBBIG1hcCBmcm9tIHB1YmxpYyBuYW1lIHRvIGZ1bmN0aW9ucyB0aGF0IHdpbGwgYmUgYm91bmQgdG9cbiAgICogICAgIGluc3RhbmNlIGFuZCByZWdpc3RlcmVkIGFzIGFjdGlvbiB1bmRlciB0aGUgcHVibGljIG5hbWUuIEkuZS4gdGhlXG4gICAqICAgICBwcm9wZXJ0eSBuYW1lcyBhcmUgdGhlIHB1YmxpYyBuYW1lcy4gVGhlIHByb3BlcnR5IHZhbHVlcyBhcmUgdGhlXG4gICAqICAgICBtZXRob2RzIG9mIGluc3RhbmNlLlxuICAgKi9cbiAgcmVnaXN0ZXJFdmVudEluZm9IYW5kbGVyczxUPihcbiAgICBuYW1lc3BhY2U6IHN0cmluZyxcbiAgICBpbnN0YW5jZTogVCB8IG51bGwsXG4gICAgbWV0aG9kczoge1trZXk6IHN0cmluZ106IEV2ZW50SW5mb1dyYXBwZXJIYW5kbGVyfSxcbiAgKSB7XG4gICAgZm9yIChjb25zdCBbbmFtZSwgbWV0aG9kXSBvZiBPYmplY3QuZW50cmllcyhtZXRob2RzKSkge1xuICAgICAgY29uc3QgaGFuZGxlciA9IGluc3RhbmNlID8gbWV0aG9kLmJpbmQoaW5zdGFuY2UpIDogbWV0aG9kO1xuICAgICAgaWYgKG5hbWVzcGFjZSkge1xuICAgICAgICAvLyBJbmNsdWRlIGEgJy4nIHNlcGFyYXRvciBiZXR3ZWVuIG5hbWVzcGFjZSBuYW1lIGFuZCBhY3Rpb24gbmFtZS5cbiAgICAgICAgLy8gSW4gdGhlIGNhc2UgdGhhdCBubyBuYW1lc3BhY2UgbmFtZSBpcyBwcm92aWRlZCwgdGhlIGpzYWN0aW9uIG5hbWVcbiAgICAgICAgLy8gY29uc2lzdHMgb2YgdGhlIGFjdGlvbiBuYW1lIG9ubHkgKG5vIHBlcmlvZCkuXG4gICAgICAgIGNvbnN0IGZ1bGxOYW1lID0gbmFtZXNwYWNlICsgQ2hhci5OQU1FU1BBQ0VfQUNUSU9OX1NFUEFSQVRPUiArIG5hbWU7XG4gICAgICAgIHRoaXMuYWN0aW9uc1tmdWxsTmFtZV0gPSBoYW5kbGVyO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5hY3Rpb25zW25hbWVdID0gaGFuZGxlcjtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLmJhc2VEaXNwYXRjaGVyLnNjaGVkdWxlRXZlbnRSZXBsYXkoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVbnJlZ2lzdGVycyBhbiBhY3Rpb24uICBQcm92aWRlZCBhcyBhbiBlYXN5IHdheSB0byByZXZlcnNlIHRoZSBlZmZlY3RzIG9mXG4gICAqIHJlZ2lzdGVySGFuZGxlcnMuXG4gICAqIEBwYXJhbSBuYW1lc3BhY2UgVGhlIG5hbWVzcGFjZSBvZiB0aGUganNhY3Rpb24gbmFtZS5cbiAgICogQHBhcmFtIG5hbWUgVGhlIGFjdGlvbiBuYW1lIHRvIHVuYmluZC5cbiAgICovXG4gIHVucmVnaXN0ZXJIYW5kbGVyKG5hbWVzcGFjZTogc3RyaW5nLCBuYW1lOiBzdHJpbmcpIHtcbiAgICBjb25zdCBmdWxsTmFtZSA9IG5hbWVzcGFjZSA/IG5hbWVzcGFjZSArIENoYXIuTkFNRVNQQUNFX0FDVElPTl9TRVBBUkFUT1IgKyBuYW1lIDogbmFtZTtcbiAgICBkZWxldGUgdGhpcy5hY3Rpb25zW2Z1bGxOYW1lXTtcbiAgfVxuXG4gIC8qKiBSZWdpc3RlcnMgYSBnbG9iYWwgZXZlbnQgaGFuZGxlci4gKi9cbiAgcmVnaXN0ZXJHbG9iYWxIYW5kbGVyKGV2ZW50VHlwZTogc3RyaW5nLCBoYW5kbGVyOiBHbG9iYWxIYW5kbGVyKSB7XG4gICAgaWYgKCF0aGlzLmdsb2JhbEhhbmRsZXJzLmhhcyhldmVudFR5cGUpKSB7XG4gICAgICB0aGlzLmdsb2JhbEhhbmRsZXJzLnNldChldmVudFR5cGUsIG5ldyBTZXQ8R2xvYmFsSGFuZGxlcj4oW2hhbmRsZXJdKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuZ2xvYmFsSGFuZGxlcnMuZ2V0KGV2ZW50VHlwZSkhLmFkZChoYW5kbGVyKTtcbiAgICB9XG4gIH1cblxuICAvKiogVW5yZWdpc3RlcnMgYSBnbG9iYWwgZXZlbnQgaGFuZGxlci4gKi9cbiAgdW5yZWdpc3Rlckdsb2JhbEhhbmRsZXIoZXZlbnRUeXBlOiBzdHJpbmcsIGhhbmRsZXI6IEdsb2JhbEhhbmRsZXIpIHtcbiAgICBpZiAodGhpcy5nbG9iYWxIYW5kbGVycy5oYXMoZXZlbnRUeXBlKSkge1xuICAgICAgdGhpcy5nbG9iYWxIYW5kbGVycy5nZXQoZXZlbnRUeXBlKSEuZGVsZXRlKGhhbmRsZXIpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVja3Mgd2hldGhlciB0aGVyZSBpcyBhbiBhY3Rpb24gcmVnaXN0ZXJlZCB1bmRlciB0aGUgZ2l2ZW5cbiAgICogbmFtZS4gVGhpcyByZXR1cm5zIHRydWUgaWYgdGhlcmUgaXMgYSBuYW1lc3BhY2UgaGFuZGxlciwgZXZlblxuICAgKiBpZiBpdCBjYW4gbm90IHlldCBoYW5kbGUgdGhlIGV2ZW50LlxuICAgKlxuICAgKiBAcGFyYW0gbmFtZSBBY3Rpb24gbmFtZS5cbiAgICogQHJldHVybiBXaGV0aGVyIHRoZSBuYW1lIGlzIHJlZ2lzdGVyZWQuXG4gICAqIEBzZWUgI2NhbkRpc3BhdGNoXG4gICAqL1xuICBoYXNBY3Rpb24obmFtZTogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuYWN0aW9ucy5oYXNPd25Qcm9wZXJ0eShuYW1lKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBXaGV0aGVyIHRoaXMgZGlzcGF0Y2hlciBjYW4gZGlzcGF0Y2ggdGhlIGV2ZW50LiBUaGlzIGNhbiBiZSB1c2VkIGJ5XG4gICAqIGV2ZW50IHJlcGxheWVyIHRvIGNoZWNrIHdoZXRoZXIgdGhlIGRpc3BhdGNoZXIgY2FuIHJlcGxheSBhbiBldmVudC5cbiAgICovXG4gIGNhbkRpc3BhdGNoKGV2ZW50SW5mb1dyYXBwZXI6IEV2ZW50SW5mb1dyYXBwZXIpOiBib29sZWFuIHtcbiAgICBjb25zdCBhY3Rpb24gPSBldmVudEluZm9XcmFwcGVyLmdldEFjdGlvbigpO1xuICAgIGlmICghYWN0aW9uKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLmhhc0FjdGlvbihhY3Rpb24ubmFtZSk7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgZXZlbnQgcmVwbGF5ZXIsIGVuYWJsaW5nIHF1ZXVlZCBldmVudHMgdG8gYmUgcmVwbGF5ZWQgd2hlbiBhY3Rpb25zXG4gICAqIGFyZSBib3VuZC4gVG8gcmVwbGF5IGV2ZW50cywgeW91IG11c3QgcmVnaXN0ZXIgdGhlIGRpc3BhdGNoZXIgdG8gdGhlXG4gICAqIGNvbnRyYWN0IGFmdGVyIHNldHRpbmcgdGhlIGBFdmVudFJlcGxheWVyYC4gVGhlIGV2ZW50IHJlcGxheWVyIHRha2VzIGFzXG4gICAqIHBhcmFtZXRlcnMgdGhlIHF1ZXVlIG9mIGV2ZW50cyBhbmQgdGhlIGRpc3BhdGNoZXIgKHVzZWQgdG8gY2hlY2sgd2hldGhlclxuICAgKiBhY3Rpb25zIGhhdmUgaGFuZGxlcnMgcmVnaXN0ZXJlZCBhbmQgY2FuIGJlIHJlcGxheWVkKS4gVGhlIGV2ZW50IHJlcGxheWVyXG4gICAqIGlzIGFsc28gcmVzcG9uc2libGUgZm9yIGRlcXVldWluZyBldmVudHMuXG4gICAqXG4gICAqIEV4YW1wbGU6IEFuIGV2ZW50IHJlcGxheWVyIHRoYXQgcmVwbGF5cyBvbmx5IHRoZSBsYXN0IGV2ZW50LlxuICAgKlxuICAgKiAgIGNvbnN0IGRpc3BhdGNoZXIgPSBuZXcgRGlzcGF0Y2hlcigpO1xuICAgKiAgIC8vIC4uLlxuICAgKiAgIGRpc3BhdGNoZXIuc2V0RXZlbnRSZXBsYXllcigocXVldWUsIGRpc3BhdGNoZXIpID0+IHtcbiAgICogICAgIGNvbnN0IGxhc3RFdmVudEluZm9XcmFwcGVyID0gcXVldWVbcXVldWUubGVuZ3RoIC0xXTtcbiAgICogICAgIGlmIChkaXNwYXRjaGVyLmNhbkRpc3BhdGNoKGxhc3RFdmVudEluZm9XcmFwcGVyLmdldEFjdGlvbigpKSkge1xuICAgKiAgICAgICBqc2FjdGlvbi5yZXBsYXkucmVwbGF5RXZlbnQoXG4gICAqICAgICAgICAgICBsYXN0RXZlbnRJbmZvV3JhcHBlci5nZXRFdmVudCgpLFxuICAgKiAgICAgICAgICAgbGFzdEV2ZW50SW5mb1dyYXBwZXIuZ2V0VGFyZ2V0RWxlbWVudCgpLFxuICAgKiAgICAgICAgICAgbGFzdEV2ZW50SW5mb1dyYXBwZXIuZ2V0RXZlbnRUeXBlKCksXG4gICAqICAgICAgICk7XG4gICAqICAgICAgIHF1ZXVlLmxlbmd0aCA9IDA7XG4gICAqICAgICB9XG4gICAqICAgfSk7XG4gICAqXG4gICAqIEBwYXJhbSBldmVudFJlcGxheWVyIEl0IGFsbG93cyBlbGVtZW50cyB0byBiZSByZXBsYXllZCBhbmQgZGVxdWV1aW5nLlxuICAgKi9cbiAgc2V0RXZlbnRSZXBsYXllcihldmVudFJlcGxheWVyOiBSZXBsYXllcikge1xuICAgIHRoaXMuZXZlbnRSZXBsYXllciA9IGV2ZW50UmVwbGF5ZXI7XG4gIH1cbn1cblxuLyoqIFN0b3AgcHJvcGFnYXRpb24gZm9yIGFuIGBFdmVudEluZm9gLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHN0b3BQcm9wYWdhdGlvbihldmVudEluZm9XcmFwcGVyOiBFdmVudEluZm9XcmFwcGVyKSB7XG4gIGlmIChcbiAgICBldmVudExpYi5pc0dlY2tvICYmXG4gICAgKGV2ZW50SW5mb1dyYXBwZXIuZ2V0VGFyZ2V0RWxlbWVudCgpLnRhZ05hbWUgPT09ICdJTlBVVCcgfHxcbiAgICAgIGV2ZW50SW5mb1dyYXBwZXIuZ2V0VGFyZ2V0RWxlbWVudCgpLnRhZ05hbWUgPT09ICdURVhUQVJFQScpICYmXG4gICAgZXZlbnRJbmZvV3JhcHBlci5nZXRFdmVudFR5cGUoKSA9PT0gRXZlbnRUeXBlLkZPQ1VTXG4gICkge1xuICAgIC8qKlxuICAgICAqIERvIG5vdGhpbmcgc2luY2Ugc3RvcHBpbmcgcHJvcGFnYXRpb24gb24gYSBmb2N1cyBldmVudCBvbiBhbiBpbnB1dFxuICAgICAqIGVsZW1lbnQgaW4gRmlyZWZveCBtYWtlcyB0aGUgdGV4dCBjdXJzb3IgZGlzYXBwZWFyOlxuICAgICAqIGh0dHBzOi8vYnVnemlsbGEubW96aWxsYS5vcmcvc2hvd19idWcuY2dpP2lkPTUwOTY4NFxuICAgICAqL1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvbnN0IGV2ZW50ID0gZXZlbnRJbmZvV3JhcHBlci5nZXRFdmVudCgpO1xuICAvLyBUaGVyZSBhcmUgc29tZSBjYXNlcyB3aGVyZSB1c2VycyBvZiB0aGUgYERpc3BhdGNoZXJgIHdpbGwgY2FsbCBkaXNwYXRjaFxuICAvLyB3aXRoIGEgZmFrZSBldmVudCB0aGF0IGRvZXMgbm90IHN1cHBvcnQgYHN0b3BQcm9wYWdhdGlvbmAuXG4gIGlmICghZXZlbnQuc3RvcFByb3BhZ2F0aW9uKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xufVxuXG4vKipcbiAqIFJlZ2lzdGVycyBkZWZlcnJlZCBmdW5jdGlvbmFsaXR5IGZvciBhbiBFdmVudENvbnRyYWN0IGFuZCBhIEpzYWN0aW9uXG4gKiBEaXNwYXRjaGVyLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVnaXN0ZXJEaXNwYXRjaGVyKGV2ZW50Q29udHJhY3Q6IFVucmVuYW1lZEV2ZW50Q29udHJhY3QsIGRpc3BhdGNoZXI6IERpc3BhdGNoZXIpIHtcbiAgZXZlbnRDb250cmFjdC5lY3JkKChldmVudEluZm86IEV2ZW50SW5mbykgPT4ge1xuICAgIGRpc3BhdGNoZXIuZGlzcGF0Y2goZXZlbnRJbmZvKTtcbiAgfSwgUmVzdHJpY3Rpb24uSV9BTV9USEVfSlNBQ1RJT05fRlJBTUVXT1JLKTtcbn1cbiJdfQ==