/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Dispatcher, stopPropagation, } from './dispatcher';
import { Char } from './char';
import * as eventLib from './event';
import { EventType } from './event_type';
import { Restriction } from './restriction';
export { stopPropagation } from './dispatcher';
/**
 * Receives a DOM event, determines the jsaction associated with the source
 * element of the DOM event, and invokes the handler associated with the
 * jsaction.
 */
export class LegacyDispatcher {
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
        /** Whether event replay is scheduled. */
        this.eventReplayScheduled = false;
        this.eventReplayer = eventReplayer;
        this.dispatcher = new Dispatcher((eventInfoWrapper) => {
            this.dispatchToHandler(eventInfoWrapper);
        }, {
            eventReplayer: (eventInfoWrappers) => {
                this.eventInfoWrapperQueue = eventInfoWrappers;
                this.eventReplayer?.(this.eventInfoWrapperQueue, this);
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
        this.dispatcher.dispatch(eventInfo);
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
        this.eventInfoWrapperQueue?.push(eventInfoWrapper);
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
    /**
     * Replays queued events, if any. The replaying will happen in its own
     * stack once the current flow cedes control. This is done to mimic
     * browser event handling.
     */
    scheduleEventReplay() {
        if (this.eventReplayScheduled || !this.eventReplayer || !this.eventInfoWrapperQueue?.length) {
            return;
        }
        this.eventReplayScheduled = true;
        Promise.resolve().then(() => {
            this.eventReplayScheduled = false;
            this.eventReplayer(this.eventInfoWrapperQueue, this);
        });
    }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGVnYWN5X2Rpc3BhdGNoZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3ByaW1pdGl2ZXMvZXZlbnQtZGlzcGF0Y2gvc3JjL2xlZ2FjeV9kaXNwYXRjaGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFDTCxVQUFVLEVBR1YsZUFBZSxHQUNoQixNQUFNLGNBQWMsQ0FBQztBQUN0QixPQUFPLEVBQUMsSUFBSSxFQUFDLE1BQU0sUUFBUSxDQUFDO0FBQzVCLE9BQU8sS0FBSyxRQUFRLE1BQU0sU0FBUyxDQUFDO0FBRXBDLE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxjQUFjLENBQUM7QUFFdkMsT0FBTyxFQUFDLFdBQVcsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQVExQyxPQUFPLEVBQUMsZUFBZSxFQUFDLE1BQU0sY0FBYyxDQUFDO0FBVzdDOzs7O0dBSUc7QUFDSCxNQUFNLE9BQU8sZ0JBQWdCO0lBeUIzQjs7Ozs7OztPQU9HO0lBQ0gsWUFDbUIsVUFFa0IsRUFDbkMsRUFDRSxlQUFlLEdBQUcsS0FBSyxFQUN2QixhQUFhLEdBQUcsU0FBUyxNQUNnQyxFQUFFO1FBTjVDLGVBQVUsR0FBVixVQUFVLENBRVE7UUE5QnJDOzs7O1dBSUc7UUFDYyxZQUFPLEdBQTZDLEVBQUUsQ0FBQztRQUV4RSx1RUFBdUU7UUFDdEQsbUJBQWMsR0FBRyxJQUFJLEdBQUcsRUFBOEIsQ0FBQztRQVF4RSx5Q0FBeUM7UUFDakMseUJBQW9CLEdBQVksS0FBSyxDQUFDO1FBbUI1QyxJQUFJLENBQUMsYUFBYSxHQUFHLGFBQWEsQ0FBQztRQUNuQyxJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksVUFBVSxDQUM5QixDQUFDLGdCQUFrQyxFQUFFLEVBQUU7WUFDckMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLGdCQUFnQixDQUFDLENBQUM7UUFDM0MsQ0FBQyxFQUNE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QU8sRUFBRSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUU7WUFDMUIsSUFBSSxDQUFDLG9CQUFvQixHQUFHLEtBQUssQ0FBQztZQUNsQyxJQUFJLENBQUMsYUFBYyxDQUFDLElBQUksQ0FBQyxxQkFBc0IsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUN6RCxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUM7Q0FDRjtBQUVEOzs7R0FHRztBQUNILE1BQU0sVUFBVSxrQkFBa0IsQ0FDaEMsYUFBcUMsRUFDckMsVUFBNEI7SUFFNUIsYUFBYSxDQUFDLElBQUksQ0FBQyxDQUFDLFNBQW9CLEVBQUUsRUFBRTtRQUMxQyxVQUFVLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxDQUFDO0lBQ2pDLENBQUMsRUFBRSxXQUFXLENBQUMsMkJBQTJCLENBQUMsQ0FBQztBQUM5QyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7XG4gIERpc3BhdGNoZXIsXG4gIEV2ZW50SW5mb0hhbmRsZXIgYXMgRXZlbnRJbmZvV3JhcHBlckhhbmRsZXIsXG4gIEdsb2JhbEhhbmRsZXIsXG4gIHN0b3BQcm9wYWdhdGlvbixcbn0gZnJvbSAnLi9kaXNwYXRjaGVyJztcbmltcG9ydCB7Q2hhcn0gZnJvbSAnLi9jaGFyJztcbmltcG9ydCAqIGFzIGV2ZW50TGliIGZyb20gJy4vZXZlbnQnO1xuaW1wb3J0IHtFdmVudEluZm8sIEV2ZW50SW5mb1dyYXBwZXJ9IGZyb20gJy4vZXZlbnRfaW5mbyc7XG5pbXBvcnQge0V2ZW50VHlwZX0gZnJvbSAnLi9ldmVudF90eXBlJztcbmltcG9ydCB7VW5yZW5hbWVkRXZlbnRDb250cmFjdH0gZnJvbSAnLi9ldmVudGNvbnRyYWN0JztcbmltcG9ydCB7UmVzdHJpY3Rpb259IGZyb20gJy4vcmVzdHJpY3Rpb24nO1xuXG4vKiogUmUtZXhwb3J0cyB0aGF0IHNob3VsZCBldmVudHVhbGx5IGJlIG1vdmVkIGludG8gdGhpcyBmaWxlLiAqL1xuZXhwb3J0IHR5cGUge1xuICBFdmVudEluZm9IYW5kbGVyLFxuICBFdmVudEluZm9IYW5kbGVyIGFzIEV2ZW50SW5mb1dyYXBwZXJIYW5kbGVyLFxuICBHbG9iYWxIYW5kbGVyLFxufSBmcm9tICcuL2Rpc3BhdGNoZXInO1xuZXhwb3J0IHtzdG9wUHJvcGFnYXRpb259IGZyb20gJy4vZGlzcGF0Y2hlcic7XG5cbi8qKlxuICogQSByZXBsYXllciBpcyBhIGZ1bmN0aW9uIHRoYXQgaXMgY2FsbGVkIHdoZW4gdGhlcmUgYXJlIHF1ZXVlZCBldmVudHMsXG4gKiBlaXRoZXIgZnJvbSB0aGUgYEV2ZW50Q29udHJhY3RgIG9yIHdoZW4gdGhlcmUgYXJlIG5vIGRldGVjdGVkIGhhbmRsZXJzLlxuICovXG5leHBvcnQgdHlwZSBSZXBsYXllciA9IChcbiAgZXZlbnRJbmZvV3JhcHBlcnM6IEV2ZW50SW5mb1dyYXBwZXJbXSxcbiAgZGlzcGF0Y2hlcjogTGVnYWN5RGlzcGF0Y2hlcixcbikgPT4gdm9pZDtcblxuLyoqXG4gKiBSZWNlaXZlcyBhIERPTSBldmVudCwgZGV0ZXJtaW5lcyB0aGUganNhY3Rpb24gYXNzb2NpYXRlZCB3aXRoIHRoZSBzb3VyY2VcbiAqIGVsZW1lbnQgb2YgdGhlIERPTSBldmVudCwgYW5kIGludm9rZXMgdGhlIGhhbmRsZXIgYXNzb2NpYXRlZCB3aXRoIHRoZVxuICoganNhY3Rpb24uXG4gKi9cbmV4cG9ydCBjbGFzcyBMZWdhY3lEaXNwYXRjaGVyIHtcbiAgcHJpdmF0ZSByZWFkb25seSBkaXNwYXRjaGVyOiBEaXNwYXRjaGVyO1xuXG4gIC8qKiBXaGV0aGVyIHRvIHN0b3AgcHJvcGFnYXRpb24gZm9yIGFuIGBFdmVudEluZm9gLiAqL1xuICBwcml2YXRlIHJlYWRvbmx5IHN0b3BQcm9wYWdhdGlvbjogYm9vbGVhbjtcblxuICAvKipcbiAgICogVGhlIGFjdGlvbnMgdGhhdCBhcmUgcmVnaXN0ZXJlZCBmb3IgdGhpcyBEaXNwYXRjaGVyIGluc3RhbmNlLlxuICAgKiBUaGlzIHNob3VsZCBiZSB0aGUgcHJpbWFyeSBvbmUgdXNlZCBvbmNlIG1pZ3JhdGlvbiBvZmYgb2YgcmVnaXN0ZXJIYW5kbGVyc1xuICAgKiBpcyBkb25lLlxuICAgKi9cbiAgcHJpdmF0ZSByZWFkb25seSBhY3Rpb25zOiB7W2tleTogc3RyaW5nXTogRXZlbnRJbmZvV3JhcHBlckhhbmRsZXJ9ID0ge307XG5cbiAgLyoqIEEgbWFwIG9mIGdsb2JhbCBldmVudCBoYW5kbGVycywgd2hlcmUgZWFjaCBrZXkgaXMgYW4gZXZlbnQgdHlwZS4gKi9cbiAgcHJpdmF0ZSByZWFkb25seSBnbG9iYWxIYW5kbGVycyA9IG5ldyBNYXA8c3RyaW5nLCBTZXQ8R2xvYmFsSGFuZGxlcj4+KCk7XG5cbiAgLyoqIFRoZSBldmVudCByZXBsYXllci4gKi9cbiAgcHJpdmF0ZSBldmVudFJlcGxheWVyPzogUmVwbGF5ZXI7XG5cbiAgLyoqIFRoZSBldmVudCBpbmZvcyB0aGF0IGhhdmUgYmUgcmVwbGF5ZWQuICovXG4gIHByaXZhdGUgZXZlbnRJbmZvV3JhcHBlclF1ZXVlPzogRXZlbnRJbmZvV3JhcHBlcltdO1xuXG4gIC8qKiBXaGV0aGVyIGV2ZW50IHJlcGxheSBpcyBzY2hlZHVsZWQuICovXG4gIHByaXZhdGUgZXZlbnRSZXBsYXlTY2hlZHVsZWQ6IGJvb2xlYW4gPSBmYWxzZTtcblxuICAvKipcbiAgICogUmVjZWl2ZXMgYSBET00gZXZlbnQsIGRldGVybWluZXMgdGhlIGpzYWN0aW9uIGFzc29jaWF0ZWQgd2l0aCB0aGUgc291cmNlXG4gICAqIGVsZW1lbnQgb2YgdGhlIERPTSBldmVudCwgYW5kIGludm9rZXMgdGhlIGhhbmRsZXIgYXNzb2NpYXRlZCB3aXRoIHRoZVxuICAgKiBqc2FjdGlvbi5cbiAgICpcbiAgICogQHBhcmFtIGdldEhhbmRsZXIgQSBmdW5jdGlvbiB0aGF0IGtub3dzIGhvdyB0byBnZXQgdGhlIGhhbmRsZXIgZm9yIGFcbiAgICogICAgIGdpdmVuIGV2ZW50IGluZm8uXG4gICAqL1xuICBjb25zdHJ1Y3RvcihcbiAgICBwcml2YXRlIHJlYWRvbmx5IGdldEhhbmRsZXI/OiAoXG4gICAgICBldmVudEluZm9XcmFwcGVyOiBFdmVudEluZm9XcmFwcGVyLFxuICAgICkgPT4gRXZlbnRJbmZvV3JhcHBlckhhbmRsZXIgfCB2b2lkLFxuICAgIHtcbiAgICAgIHN0b3BQcm9wYWdhdGlvbiA9IGZhbHNlLFxuICAgICAgZXZlbnRSZXBsYXllciA9IHVuZGVmaW5lZCxcbiAgICB9OiB7c3RvcFByb3BhZ2F0aW9uPzogYm9vbGVhbjsgZXZlbnRSZXBsYXllcj86IFJlcGxheWVyfSA9IHt9LFxuICApIHtcbiAgICB0aGlzLmV2ZW50UmVwbGF5ZXIgPSBldmVudFJlcGxheWVyO1xuICAgIHRoaXMuZGlzcGF0Y2hlciA9IG5ldyBEaXNwYXRjaGVyKFxuICAgICAgKGV2ZW50SW5mb1dyYXBwZXI6IEV2ZW50SW5mb1dyYXBwZXIpID0+IHtcbiAgICAgICAgdGhpcy5kaXNwYXRjaFRvSGFuZGxlcihldmVudEluZm9XcmFwcGVyKTtcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIGV2ZW50UmVwbGF5ZXI6IChldmVudEluZm9XcmFwcGVycykgPT4ge1xuICAgICAgICAgIHRoaXMuZXZlbnRJbmZvV3JhcHBlclF1ZXVlID0gZXZlbnRJbmZvV3JhcHBlcnM7XG4gICAgICAgICAgdGhpcy5ldmVudFJlcGxheWVyPy4odGhpcy5ldmVudEluZm9XcmFwcGVyUXVldWUsIHRoaXMpO1xuICAgICAgICB9LFxuICAgICAgfSxcbiAgICApO1xuICAgIHRoaXMuc3RvcFByb3BhZ2F0aW9uID0gc3RvcFByb3BhZ2F0aW9uO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlY2VpdmVzIGFuIGV2ZW50IG9yIHRoZSBldmVudCBxdWV1ZSBmcm9tIHRoZSBFdmVudENvbnRyYWN0LiBUaGUgZXZlbnRcbiAgICogcXVldWUgaXMgY29waWVkIGFuZCBpdCBhdHRlbXB0cyB0byByZXBsYXkuXG4gICAqIElmIGV2ZW50IGluZm8gaXMgcGFzc2VkIGluIGl0IGxvb2tzIGZvciBhbiBhY3Rpb24gaGFuZGxlciB0aGF0IGNhbiBoYW5kbGVcbiAgICogdGhlIGdpdmVuIGV2ZW50LiAgSWYgdGhlcmUgaXMgbm8gaGFuZGxlciByZWdpc3RlcmVkIHF1ZXVlcyB0aGUgZXZlbnQgYW5kXG4gICAqIGNoZWNrcyBpZiBhIGxvYWRlciBpcyByZWdpc3RlcmVkIGZvciB0aGUgZ2l2ZW4gbmFtZXNwYWNlLiBJZiBzbywgY2FsbHMgaXQuXG4gICAqXG4gICAqIEFsdGVybmF0aXZlbHksIGlmIGluIGdsb2JhbCBkaXNwYXRjaCBtb2RlLCBjYWxscyBhbGwgcmVnaXN0ZXJlZCBnbG9iYWxcbiAgICogaGFuZGxlcnMgZm9yIHRoZSBhcHByb3ByaWF0ZSBldmVudCB0eXBlLlxuICAgKlxuICAgKiBUaGUgdGhyZWUgZnVuY3Rpb25hbGl0aWVzIG9mIHRoaXMgY2FsbCBhcmUgZGVsaWJlcmF0ZWx5IG5vdCBzcGxpdCBpbnRvXG4gICAqIHRocmVlIG1ldGhvZHMgKGFuZCB0aGVuIGRlY2xhcmVkIGFzIGFuIGFic3RyYWN0IGludGVyZmFjZSksIGJlY2F1c2UgdGhlXG4gICAqIGludGVyZmFjZSBpcyB1c2VkIGJ5IEV2ZW50Q29udHJhY3QsIHdoaWNoIGxpdmVzIGluIGEgZGlmZmVyZW50IGpzYmluYXJ5LlxuICAgKiBUaGVyZWZvcmUgdGhlIGludGVyZmFjZSBiZXR3ZWVuIHRoZSB0aHJlZSBpcyBkZWZpbmVkIGVudGlyZWx5IGluIHRlcm1zIHRoYXRcbiAgICogYXJlIGludmFyaWFudCB1bmRlciBqc2NvbXBpbGVyIHByb2Nlc3NpbmcgKEZ1bmN0aW9uIGFuZCBBcnJheSwgYXMgb3Bwb3NlZFxuICAgKiB0byBhIGN1c3RvbSB0eXBlIHdpdGggbWV0aG9kIG5hbWVzKS5cbiAgICpcbiAgICogQHBhcmFtIGV2ZW50SW5mbyBUaGUgaW5mbyBmb3IgdGhlIGV2ZW50IHRoYXQgdHJpZ2dlcmVkIHRoaXMgY2FsbCBvciB0aGVcbiAgICogICAgIHF1ZXVlIG9mIGV2ZW50cyBmcm9tIEV2ZW50Q29udHJhY3QuXG4gICAqL1xuICBkaXNwYXRjaChldmVudEluZm86IEV2ZW50SW5mbywgaXNHbG9iYWxEaXNwYXRjaD86IGJvb2xlYW4pOiB2b2lkIHtcbiAgICB0aGlzLmRpc3BhdGNoZXIuZGlzcGF0Y2goZXZlbnRJbmZvKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEaXNwYXRjaGVzIGFuIGBFdmVudEluZm9XcmFwcGVyYC5cbiAgICovXG4gIHByaXZhdGUgZGlzcGF0Y2hUb0hhbmRsZXIoZXZlbnRJbmZvV3JhcHBlcjogRXZlbnRJbmZvV3JhcHBlcikge1xuICAgIGlmICh0aGlzLmdsb2JhbEhhbmRsZXJzLnNpemUpIHtcbiAgICAgIGNvbnN0IGdsb2JhbEV2ZW50SW5mb1dyYXBwZXIgPSBldmVudEluZm9XcmFwcGVyLmNsb25lKCk7XG5cbiAgICAgIC8vIEluIHNvbWUgY2FzZXMsIGBwb3B1bGF0ZUFjdGlvbmAgd2lsbCByZXdyaXRlIGBjbGlja2AgZXZlbnRzIHRvXG4gICAgICAvLyBgY2xpY2tvbmx5YC4gUmV2ZXJ0IGJhY2sgdG8gYSByZWd1bGFyIGNsaWNrLCBvdGhlcndpc2Ugd2Ugd29uJ3QgYmUgYWJsZVxuICAgICAgLy8gdG8gZXhlY3V0ZSBnbG9iYWwgZXZlbnQgaGFuZGxlcnMgcmVnaXN0ZXJlZCBvbiBjbGljayBldmVudHMuXG4gICAgICBpZiAoZ2xvYmFsRXZlbnRJbmZvV3JhcHBlci5nZXRFdmVudFR5cGUoKSA9PT0gRXZlbnRUeXBlLkNMSUNLT05MWSkge1xuICAgICAgICBnbG9iYWxFdmVudEluZm9XcmFwcGVyLnNldEV2ZW50VHlwZShFdmVudFR5cGUuQ0xJQ0spO1xuICAgICAgfVxuICAgICAgLy8gU2tpcCBldmVyeXRoaW5nIHJlbGF0ZWQgdG8ganNhY3Rpb24gaGFuZGxlcnMsIGFuZCBleGVjdXRlIHRoZSBnbG9iYWxcbiAgICAgIC8vIGhhbmRsZXJzLlxuICAgICAgY29uc3QgZXZlbnQgPSBnbG9iYWxFdmVudEluZm9XcmFwcGVyLmdldEV2ZW50KCk7XG4gICAgICBjb25zdCBldmVudFR5cGVIYW5kbGVycyA9IHRoaXMuZ2xvYmFsSGFuZGxlcnMuZ2V0KGdsb2JhbEV2ZW50SW5mb1dyYXBwZXIuZ2V0RXZlbnRUeXBlKCkpO1xuICAgICAgbGV0IHNob3VsZFByZXZlbnREZWZhdWx0ID0gZmFsc2U7XG4gICAgICBpZiAoZXZlbnRUeXBlSGFuZGxlcnMpIHtcbiAgICAgICAgZm9yIChjb25zdCBoYW5kbGVyIG9mIGV2ZW50VHlwZUhhbmRsZXJzKSB7XG4gICAgICAgICAgaWYgKGhhbmRsZXIoZXZlbnQpID09PSBmYWxzZSkge1xuICAgICAgICAgICAgc2hvdWxkUHJldmVudERlZmF1bHQgPSB0cnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKHNob3VsZFByZXZlbnREZWZhdWx0KSB7XG4gICAgICAgIGV2ZW50TGliLnByZXZlbnREZWZhdWx0KGV2ZW50KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCBhY3Rpb24gPSBldmVudEluZm9XcmFwcGVyLmdldEFjdGlvbigpO1xuICAgIGlmICghYWN0aW9uKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuc3RvcFByb3BhZ2F0aW9uKSB7XG4gICAgICBzdG9wUHJvcGFnYXRpb24oZXZlbnRJbmZvV3JhcHBlcik7XG4gICAgfVxuXG4gICAgbGV0IGhhbmRsZXI6IEV2ZW50SW5mb1dyYXBwZXJIYW5kbGVyIHwgdm9pZCA9IHVuZGVmaW5lZDtcbiAgICBpZiAodGhpcy5nZXRIYW5kbGVyKSB7XG4gICAgICBoYW5kbGVyID0gdGhpcy5nZXRIYW5kbGVyKGV2ZW50SW5mb1dyYXBwZXIpO1xuICAgIH1cblxuICAgIGlmICghaGFuZGxlcikge1xuICAgICAgaGFuZGxlciA9IHRoaXMuYWN0aW9uc1thY3Rpb24ubmFtZV07XG4gICAgfVxuXG4gICAgaWYgKGhhbmRsZXIpIHtcbiAgICAgIGhhbmRsZXIoZXZlbnRJbmZvV3JhcHBlcik7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gTm8gaGFuZGxlciB3YXMgZm91bmQuXG4gICAgdGhpcy5ldmVudEluZm9XcmFwcGVyUXVldWU/LnB1c2goZXZlbnRJbmZvV3JhcHBlcik7XG4gIH1cblxuICAvKipcbiAgICogUmVnaXN0ZXJzIG11bHRpcGxlIG1ldGhvZHMgYWxsIGJvdW5kIHRvIHRoZSBzYW1lIG9iamVjdFxuICAgKiBpbnN0YW5jZS4gVGhpcyBpcyBhIGNvbW1vbiBjYXNlOiBhbiBhcHBsaWNhdGlvbiBtb2R1bGUgYmluZHNcbiAgICogbXVsdGlwbGUgb2YgaXRzIG1ldGhvZHMgdW5kZXIgcHVibGljIG5hbWVzIHRvIHRoZSBldmVudCBjb250cmFjdCBvZlxuICAgKiB0aGUgYXBwbGljYXRpb24uIFNvIHdlIHByb3ZpZGUgYSBzaG9ydGN1dCBmb3IgaXQuXG4gICAqIEF0dGVtcHRzIHRvIHJlcGxheSB0aGUgcXVldWVkIGV2ZW50cyBhZnRlciByZWdpc3RlcmluZyB0aGUgaGFuZGxlcnMuXG4gICAqXG4gICAqIEBwYXJhbSBuYW1lc3BhY2UgVGhlIG5hbWVzcGFjZSBvZiB0aGUganNhY3Rpb24gbmFtZS5cbiAgICpcbiAgICogQHBhcmFtIGluc3RhbmNlIFRoZSBvYmplY3QgdG8gYmluZCB0aGUgbWV0aG9kcyB0by4gSWYgdGhpcyBpcyBudWxsLCB0aGVuXG4gICAqICAgICB0aGUgZnVuY3Rpb25zIGFyZSBub3QgYm91bmQsIGJ1dCBkaXJlY3RseSBhZGRlZCB1bmRlciB0aGUgcHVibGljIG5hbWVzLlxuICAgKlxuICAgKiBAcGFyYW0gbWV0aG9kcyBBIG1hcCBmcm9tIHB1YmxpYyBuYW1lIHRvIGZ1bmN0aW9ucyB0aGF0IHdpbGwgYmUgYm91bmQgdG9cbiAgICogICAgIGluc3RhbmNlIGFuZCByZWdpc3RlcmVkIGFzIGFjdGlvbiB1bmRlciB0aGUgcHVibGljIG5hbWUuIEkuZS4gdGhlXG4gICAqICAgICBwcm9wZXJ0eSBuYW1lcyBhcmUgdGhlIHB1YmxpYyBuYW1lcy4gVGhlIHByb3BlcnR5IHZhbHVlcyBhcmUgdGhlXG4gICAqICAgICBtZXRob2RzIG9mIGluc3RhbmNlLlxuICAgKi9cbiAgcmVnaXN0ZXJFdmVudEluZm9IYW5kbGVyczxUPihcbiAgICBuYW1lc3BhY2U6IHN0cmluZyxcbiAgICBpbnN0YW5jZTogVCB8IG51bGwsXG4gICAgbWV0aG9kczoge1trZXk6IHN0cmluZ106IEV2ZW50SW5mb1dyYXBwZXJIYW5kbGVyfSxcbiAgKSB7XG4gICAgZm9yIChjb25zdCBbbmFtZSwgbWV0aG9kXSBvZiBPYmplY3QuZW50cmllcyhtZXRob2RzKSkge1xuICAgICAgY29uc3QgaGFuZGxlciA9IGluc3RhbmNlID8gbWV0aG9kLmJpbmQoaW5zdGFuY2UpIDogbWV0aG9kO1xuICAgICAgaWYgKG5hbWVzcGFjZSkge1xuICAgICAgICAvLyBJbmNsdWRlIGEgJy4nIHNlcGFyYXRvciBiZXR3ZWVuIG5hbWVzcGFjZSBuYW1lIGFuZCBhY3Rpb24gbmFtZS5cbiAgICAgICAgLy8gSW4gdGhlIGNhc2UgdGhhdCBubyBuYW1lc3BhY2UgbmFtZSBpcyBwcm92aWRlZCwgdGhlIGpzYWN0aW9uIG5hbWVcbiAgICAgICAgLy8gY29uc2lzdHMgb2YgdGhlIGFjdGlvbiBuYW1lIG9ubHkgKG5vIHBlcmlvZCkuXG4gICAgICAgIGNvbnN0IGZ1bGxOYW1lID0gbmFtZXNwYWNlICsgQ2hhci5OQU1FU1BBQ0VfQUNUSU9OX1NFUEFSQVRPUiArIG5hbWU7XG4gICAgICAgIHRoaXMuYWN0aW9uc1tmdWxsTmFtZV0gPSBoYW5kbGVyO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5hY3Rpb25zW25hbWVdID0gaGFuZGxlcjtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLnNjaGVkdWxlRXZlbnRSZXBsYXkoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVbnJlZ2lzdGVycyBhbiBhY3Rpb24uICBQcm92aWRlZCBhcyBhbiBlYXN5IHdheSB0byByZXZlcnNlIHRoZSBlZmZlY3RzIG9mXG4gICAqIHJlZ2lzdGVySGFuZGxlcnMuXG4gICAqIEBwYXJhbSBuYW1lc3BhY2UgVGhlIG5hbWVzcGFjZSBvZiB0aGUganNhY3Rpb24gbmFtZS5cbiAgICogQHBhcmFtIG5hbWUgVGhlIGFjdGlvbiBuYW1lIHRvIHVuYmluZC5cbiAgICovXG4gIHVucmVnaXN0ZXJIYW5kbGVyKG5hbWVzcGFjZTogc3RyaW5nLCBuYW1lOiBzdHJpbmcpIHtcbiAgICBjb25zdCBmdWxsTmFtZSA9IG5hbWVzcGFjZSA/IG5hbWVzcGFjZSArIENoYXIuTkFNRVNQQUNFX0FDVElPTl9TRVBBUkFUT1IgKyBuYW1lIDogbmFtZTtcbiAgICBkZWxldGUgdGhpcy5hY3Rpb25zW2Z1bGxOYW1lXTtcbiAgfVxuXG4gIC8qKiBSZWdpc3RlcnMgYSBnbG9iYWwgZXZlbnQgaGFuZGxlci4gKi9cbiAgcmVnaXN0ZXJHbG9iYWxIYW5kbGVyKGV2ZW50VHlwZTogc3RyaW5nLCBoYW5kbGVyOiBHbG9iYWxIYW5kbGVyKSB7XG4gICAgaWYgKCF0aGlzLmdsb2JhbEhhbmRsZXJzLmhhcyhldmVudFR5cGUpKSB7XG4gICAgICB0aGlzLmdsb2JhbEhhbmRsZXJzLnNldChldmVudFR5cGUsIG5ldyBTZXQ8R2xvYmFsSGFuZGxlcj4oW2hhbmRsZXJdKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuZ2xvYmFsSGFuZGxlcnMuZ2V0KGV2ZW50VHlwZSkhLmFkZChoYW5kbGVyKTtcbiAgICB9XG4gIH1cblxuICAvKiogVW5yZWdpc3RlcnMgYSBnbG9iYWwgZXZlbnQgaGFuZGxlci4gKi9cbiAgdW5yZWdpc3Rlckdsb2JhbEhhbmRsZXIoZXZlbnRUeXBlOiBzdHJpbmcsIGhhbmRsZXI6IEdsb2JhbEhhbmRsZXIpIHtcbiAgICBpZiAodGhpcy5nbG9iYWxIYW5kbGVycy5oYXMoZXZlbnRUeXBlKSkge1xuICAgICAgdGhpcy5nbG9iYWxIYW5kbGVycy5nZXQoZXZlbnRUeXBlKSEuZGVsZXRlKGhhbmRsZXIpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVja3Mgd2hldGhlciB0aGVyZSBpcyBhbiBhY3Rpb24gcmVnaXN0ZXJlZCB1bmRlciB0aGUgZ2l2ZW5cbiAgICogbmFtZS4gVGhpcyByZXR1cm5zIHRydWUgaWYgdGhlcmUgaXMgYSBuYW1lc3BhY2UgaGFuZGxlciwgZXZlblxuICAgKiBpZiBpdCBjYW4gbm90IHlldCBoYW5kbGUgdGhlIGV2ZW50LlxuICAgKlxuICAgKiBAcGFyYW0gbmFtZSBBY3Rpb24gbmFtZS5cbiAgICogQHJldHVybiBXaGV0aGVyIHRoZSBuYW1lIGlzIHJlZ2lzdGVyZWQuXG4gICAqIEBzZWUgI2NhbkRpc3BhdGNoXG4gICAqL1xuICBoYXNBY3Rpb24obmFtZTogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuYWN0aW9ucy5oYXNPd25Qcm9wZXJ0eShuYW1lKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBXaGV0aGVyIHRoaXMgZGlzcGF0Y2hlciBjYW4gZGlzcGF0Y2ggdGhlIGV2ZW50LiBUaGlzIGNhbiBiZSB1c2VkIGJ5XG4gICAqIGV2ZW50IHJlcGxheWVyIHRvIGNoZWNrIHdoZXRoZXIgdGhlIGRpc3BhdGNoZXIgY2FuIHJlcGxheSBhbiBldmVudC5cbiAgICovXG4gIGNhbkRpc3BhdGNoKGV2ZW50SW5mb1dyYXBwZXI6IEV2ZW50SW5mb1dyYXBwZXIpOiBib29sZWFuIHtcbiAgICBjb25zdCBhY3Rpb24gPSBldmVudEluZm9XcmFwcGVyLmdldEFjdGlvbigpO1xuICAgIGlmICghYWN0aW9uKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLmhhc0FjdGlvbihhY3Rpb24ubmFtZSk7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgZXZlbnQgcmVwbGF5ZXIsIGVuYWJsaW5nIHF1ZXVlZCBldmVudHMgdG8gYmUgcmVwbGF5ZWQgd2hlbiBhY3Rpb25zXG4gICAqIGFyZSBib3VuZC4gVG8gcmVwbGF5IGV2ZW50cywgeW91IG11c3QgcmVnaXN0ZXIgdGhlIGRpc3BhdGNoZXIgdG8gdGhlXG4gICAqIGNvbnRyYWN0IGFmdGVyIHNldHRpbmcgdGhlIGBFdmVudFJlcGxheWVyYC4gVGhlIGV2ZW50IHJlcGxheWVyIHRha2VzIGFzXG4gICAqIHBhcmFtZXRlcnMgdGhlIHF1ZXVlIG9mIGV2ZW50cyBhbmQgdGhlIGRpc3BhdGNoZXIgKHVzZWQgdG8gY2hlY2sgd2hldGhlclxuICAgKiBhY3Rpb25zIGhhdmUgaGFuZGxlcnMgcmVnaXN0ZXJlZCBhbmQgY2FuIGJlIHJlcGxheWVkKS4gVGhlIGV2ZW50IHJlcGxheWVyXG4gICAqIGlzIGFsc28gcmVzcG9uc2libGUgZm9yIGRlcXVldWluZyBldmVudHMuXG4gICAqXG4gICAqIEV4YW1wbGU6IEFuIGV2ZW50IHJlcGxheWVyIHRoYXQgcmVwbGF5cyBvbmx5IHRoZSBsYXN0IGV2ZW50LlxuICAgKlxuICAgKiAgIGNvbnN0IGRpc3BhdGNoZXIgPSBuZXcgRGlzcGF0Y2hlcigpO1xuICAgKiAgIC8vIC4uLlxuICAgKiAgIGRpc3BhdGNoZXIuc2V0RXZlbnRSZXBsYXllcigocXVldWUsIGRpc3BhdGNoZXIpID0+IHtcbiAgICogICAgIGNvbnN0IGxhc3RFdmVudEluZm9XcmFwcGVyID0gcXVldWVbcXVldWUubGVuZ3RoIC0xXTtcbiAgICogICAgIGlmIChkaXNwYXRjaGVyLmNhbkRpc3BhdGNoKGxhc3RFdmVudEluZm9XcmFwcGVyLmdldEFjdGlvbigpKSkge1xuICAgKiAgICAgICBqc2FjdGlvbi5yZXBsYXkucmVwbGF5RXZlbnQoXG4gICAqICAgICAgICAgICBsYXN0RXZlbnRJbmZvV3JhcHBlci5nZXRFdmVudCgpLFxuICAgKiAgICAgICAgICAgbGFzdEV2ZW50SW5mb1dyYXBwZXIuZ2V0VGFyZ2V0RWxlbWVudCgpLFxuICAgKiAgICAgICAgICAgbGFzdEV2ZW50SW5mb1dyYXBwZXIuZ2V0RXZlbnRUeXBlKCksXG4gICAqICAgICAgICk7XG4gICAqICAgICAgIHF1ZXVlLmxlbmd0aCA9IDA7XG4gICAqICAgICB9XG4gICAqICAgfSk7XG4gICAqXG4gICAqIEBwYXJhbSBldmVudFJlcGxheWVyIEl0IGFsbG93cyBlbGVtZW50cyB0byBiZSByZXBsYXllZCBhbmQgZGVxdWV1aW5nLlxuICAgKi9cbiAgc2V0RXZlbnRSZXBsYXllcihldmVudFJlcGxheWVyOiBSZXBsYXllcikge1xuICAgIHRoaXMuZXZlbnRSZXBsYXllciA9IGV2ZW50UmVwbGF5ZXI7XG4gIH1cblxuICAvKipcbiAgICogUmVwbGF5cyBxdWV1ZWQgZXZlbnRzLCBpZiBhbnkuIFRoZSByZXBsYXlpbmcgd2lsbCBoYXBwZW4gaW4gaXRzIG93blxuICAgKiBzdGFjayBvbmNlIHRoZSBjdXJyZW50IGZsb3cgY2VkZXMgY29udHJvbC4gVGhpcyBpcyBkb25lIHRvIG1pbWljXG4gICAqIGJyb3dzZXIgZXZlbnQgaGFuZGxpbmcuXG4gICAqL1xuICBwcml2YXRlIHNjaGVkdWxlRXZlbnRSZXBsYXkoKSB7XG4gICAgaWYgKHRoaXMuZXZlbnRSZXBsYXlTY2hlZHVsZWQgfHwgIXRoaXMuZXZlbnRSZXBsYXllciB8fCAhdGhpcy5ldmVudEluZm9XcmFwcGVyUXVldWU/Lmxlbmd0aCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLmV2ZW50UmVwbGF5U2NoZWR1bGVkID0gdHJ1ZTtcbiAgICBQcm9taXNlLnJlc29sdmUoKS50aGVuKCgpID0+IHtcbiAgICAgIHRoaXMuZXZlbnRSZXBsYXlTY2hlZHVsZWQgPSBmYWxzZTtcbiAgICAgIHRoaXMuZXZlbnRSZXBsYXllciEodGhpcy5ldmVudEluZm9XcmFwcGVyUXVldWUhLCB0aGlzKTtcbiAgICB9KTtcbiAgfVxufVxuXG4vKipcbiAqIFJlZ2lzdGVycyBkZWZlcnJlZCBmdW5jdGlvbmFsaXR5IGZvciBhbiBFdmVudENvbnRyYWN0IGFuZCBhIEpzYWN0aW9uXG4gKiBEaXNwYXRjaGVyLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVnaXN0ZXJEaXNwYXRjaGVyKFxuICBldmVudENvbnRyYWN0OiBVbnJlbmFtZWRFdmVudENvbnRyYWN0LFxuICBkaXNwYXRjaGVyOiBMZWdhY3lEaXNwYXRjaGVyLFxuKSB7XG4gIGV2ZW50Q29udHJhY3QuZWNyZCgoZXZlbnRJbmZvOiBFdmVudEluZm8pID0+IHtcbiAgICBkaXNwYXRjaGVyLmRpc3BhdGNoKGV2ZW50SW5mbyk7XG4gIH0sIFJlc3RyaWN0aW9uLklfQU1fVEhFX0pTQUNUSU9OX0ZSQU1FV09SSyk7XG59XG4iXX0=