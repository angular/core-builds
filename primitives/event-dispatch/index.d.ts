/**
 * @license Angular v18.0.0-next.5+sha-e3d5607
 * (c) 2010-2024 Google LLC. https://angular.io/
 * License: MIT
 */


declare namespace a11yClickLib {
    export {
        updateEventInfoForA11yClick,
        preventDefaultForA11yClick,
        populateClickOnlyAction
    }
}


/**
 * Records information about the action that should handle a given `Event`.
 */
declare interface ActionInfo {
    name: string;
    element: Element;
}

declare type ActionInfoInternal = [name: string, element: Element];

/**
 * Provides a factory function for bootstrapping an event contract on a
 * window object.
 * @param field The property on the window that the event contract will be placed on.
 * @param container The container that listens to events
 * @param appId A given identifier for an application. If there are multiple apps on the page
 *              then this is how contracts can be initialized for each one.
 * @param events An array of event names that should be listened to.
 * @param anyWindow The global window object that should receive the event contract.
 * @returns The `event` contract. This is both assigned to `anyWindow` and returned for testing.
 */
export declare function bootstrapEventContract(field: string, container: Element, appId: string, events: string[], anyWindow?: any): EventContract;

/** Clones an `EventInfo` */
declare function cloneEventInfo(eventInfo: EventInfo): EventInfo;

/**
 * Utility function for creating an `EventInfo`.
 *
 * This should be used in compilation units that are less sensitive to code
 * size.
 */
declare function createEventInfo({ eventType, event, targetElement, container, timestamp, action, isReplay, a11yClickKey, }: {
    eventType: string;
    event: Event;
    targetElement: Element;
    container: Element;
    timestamp: number;
    action?: ActionInfo;
    isReplay?: boolean;
    a11yClickKey?: boolean;
}): EventInfo;

/**
 * Utility function for creating an `EventInfo`.
 *
 * This can be used from code-size sensitive compilation units, as taking
 * parameters vs. an `Object` literal reduces code size.
 */
declare function createEventInfoFromParameters(eventType: string, event: Event, targetElement: Element, container: Element, timestamp: number, action?: ActionInfoInternal, isReplay?: boolean, a11yClickKey?: boolean): EventInfo;

/**
 * Receives a DOM event, determines the jsaction associated with the source
 * element of the DOM event, and invokes the handler associated with the
 * jsaction.
 */
export declare class Dispatcher {
    private readonly getHandler?;
    private readonly baseDispatcher;
    /** Whether to stop propagation for an `EventInfo`. */
    private readonly stopPropagation;
    /**
     * The actions that are registered for this Dispatcher instance.
     * This should be the primary one used once migration off of registerHandlers
     * is done.
     */
    private readonly actions;
    /** A map of global event handlers, where each key is an event type. */
    private readonly globalHandlers;
    /** The event replayer. */
    private eventReplayer?;
    /**
     * Receives a DOM event, determines the jsaction associated with the source
     * element of the DOM event, and invokes the handler associated with the
     * jsaction.
     *
     * @param getHandler A function that knows how to get the handler for a
     *     given event info.
     */
    constructor(getHandler?: ((eventInfoWrapper: EventInfoWrapper) => EventInfoWrapperHandler | void) | undefined, { stopPropagation, eventReplayer, }?: {
        stopPropagation?: boolean;
        eventReplayer?: Replayer;
    });
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
    dispatch(eventInfo: EventInfo, isGlobalDispatch?: boolean): EventInfo | void;
    /**
     * Dispatches an `EventInfoWrapper`.
     */
    private dispatchToHandler;
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
    registerEventInfoHandlers<T>(namespace: string, instance: T | null, methods: {
        [key: string]: EventInfoWrapperHandler;
    }): void;
    /**
     * Unregisters an action.  Provided as an easy way to reverse the effects of
     * registerHandlers.
     * @param namespace The namespace of the jsaction name.
     * @param name The action name to unbind.
     */
    unregisterHandler(namespace: string, name: string): void;
    /** Registers a global event handler. */
    registerGlobalHandler(eventType: string, handler: GlobalHandler): void;
    /** Unregisters a global event handler. */
    unregisterGlobalHandler(eventType: string, handler: GlobalHandler): void;
    /**
     * Checks whether there is an action registered under the given
     * name. This returns true if there is a namespace handler, even
     * if it can not yet handle the event.
     *
     * @param name Action name.
     * @return Whether the name is registered.
     * @see #canDispatch
     */
    hasAction(name: string): boolean;
    /**
     * Whether this dispatcher can dispatch the event. This can be used by
     * event replayer to check whether the dispatcher can replay an event.
     */
    canDispatch(eventInfoWrapper: EventInfoWrapper): boolean;
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
    setEventReplayer(eventReplayer: Replayer): void;
}

/** A function that is called to handle events captured by the EventContract. */
declare type Dispatcher_2 = (eventInfo: eventInfoLib.EventInfo, globalDispatch?: boolean) => eventInfoLib.EventInfo | void;

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
export declare class EventContract implements UnrenamedEventContract {
    static CUSTOM_EVENT_SUPPORT: boolean;
    static STOP_PROPAGATION: boolean;
    static A11Y_SUPPORT_IN_DISPATCHER: boolean;
    static A11Y_CLICK_SUPPORT: boolean;
    static MOUSE_SPECIAL_SUPPORT: boolean;
    static JSNAMESPACE_SUPPORT: boolean;
    private containerManager;
    /**
     * The DOM events which this contract covers. Used to prevent double
     * registration of event types. The value of the map is the
     * internally created DOM event handler function that handles the
     * DOM events. See addEvent().
     *
     */
    private eventHandlers;
    private browserEventTypeToExtraEventTypes;
    /**
     * The dispatcher function. Events are passed to this function for
     * handling once it was set using the registerDispatcher() method. This is
     * done because the function is passed from another jsbinary, so passing the
     * instance and invoking the method here would require to leave the method
     * unobfuscated.
     */
    private dispatcher;
    /**
     * The list of suspended `EventInfo` that will be dispatched
     * as soon as the `Dispatcher` is registered.
     */
    private queuedEventInfos;
    /** Whether a11y click support has been loaded or not. */
    private hasA11yClickSupport;
    /** Whether to add an a11y click listener. */
    private addA11yClickListener;
    private updateEventInfoForA11yClick?;
    private preventDefaultForA11yClick?;
    private populateClickOnlyAction?;
    ecaacs?: (updateEventInfoForA11yClick: typeof a11yClickLib.updateEventInfoForA11yClick, preventDefaultForA11yClick: typeof a11yClickLib.preventDefaultForA11yClick, populateClickOnlyAction: typeof a11yClickLib.populateClickOnlyAction) => void;
    constructor(containerManager: EventContractContainerManager);
    private handleEvent;
    /**
     * Handle an `EventInfo`.
     * @param allowRehandling Used in the case of a11y click casting to prevent
     * us from trying to rehandle in an infinite loop.
     */
    private handleEventInfo;
    /**
     * Searches for a jsaction that the DOM event maps to and creates an
     * object containing event information used for dispatching by
     * jsaction.Dispatcher. This method populates the `action` and `actionElement`
     * fields of the EventInfo object passed in by finding the first
     * jsaction attribute above the target Node of the event, and below
     * the container Node, that specifies a jsaction for the event
     * type. If no such jsaction is found, then action is undefined.
     *
     * @param eventInfo `EventInfo` to set `action` and `actionElement` if an
     *    action is found on any `Element` in the path of the `Event`.
     */
    private populateAction;
    /**
     * Accesses the jsaction map on a node and retrieves the name of the
     * action the given event is mapped to, if any. It parses the
     * attribute value and stores it in a property on the node for
     * subsequent retrieval without re-parsing and re-accessing the
     * attribute. In order to fully qualify jsaction names using a
     * namespace, the DOM is searched starting at the current node and
     * going through ancestor nodes until a jsnamespace attribute is
     * found.
     *
     * @param actionElement The DOM node to retrieve the jsaction map from.
     * @param eventInfo `EventInfo` to set `action` and `actionElement` if an
     *    action is found on the `actionElement`.
     */
    private populateActionOnElement;
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
    addEvent(eventType: string, prefixedEventType?: string): void;
    /**
     * Gets the queued early events and replay them using the appropriate handler
     * in the provided event contract. Once all the events are replayed, it cleans
     * up the early contract.
     */
    replayEarlyEvents(): void;
    /**
     * Returns all JSAction event types that have been registered for a given
     * browser event type.
     */
    private getEventTypesForBrowserEventType;
    /**
     * Returns the event handler function for a given event type.
     */
    handler(eventType: string): EventHandler | undefined;
    /**
     * Cleans up the event contract. This resets all of the `EventContract`'s
     * internal state. Users are responsible for not using this `EventContract`
     * after it has been cleaned up.
     */
    cleanUp(): void;
    /**
     * Register a dispatcher function. Event info of each event mapped to
     * a jsaction is passed for handling to this callback. The queued
     * events are passed as well to the dispatcher for later replaying
     * once the dispatcher is registered. Clears the event queue to null.
     *
     * @param dispatcher The dispatcher function.
     * @param restriction
     */
    registerDispatcher(dispatcher: Dispatcher_2, restriction: Restriction): void;
    /**
     * Unrenamed alias for registerDispatcher. Necessary for any codebases that
     * split the `EventContract` and `Dispatcher` code into different compilation
     * units.
     */
    ecrd(dispatcher: Dispatcher_2, restriction: Restriction): void;
    /**
     * Adds a11y click support to the given `EventContract`. Meant to be called in
     * the same compilation unit as the `EventContract`.
     */
    addA11yClickSupport(): void;
    /**
     * Enables a11y click support to be deferred. Meant to be called in the same
     * compilation unit as the `EventContract`.
     */
    exportAddA11yClickSupport(): void;
    /**
     * Unrenamed function that loads a11yClickSupport.
     */
    private addA11yClickSupportImpl;
}

/**
 * A class representing a container node and all the event handlers
 * installed on it. Used so that handlers can be cleaned up if the
 * container is removed from the contract.
 */
export declare class EventContractContainer implements EventContractContainerManager {
    readonly element: Element;
    /**
     * Array of event handlers and their corresponding event types that are
     * installed on this container.
     *
     */
    private handlerInfos;
    /**
     * @param element The container Element.
     */
    constructor(element: Element);
    /**
     * Installs the provided installer on the element owned by this container,
     * and maintains a reference to resulting handler in order to remove it
     * later if desired.
     */
    addEventListener(eventType: string, getHandler: (element: Element) => (event: Event) => void): void;
    /**
     * Removes all the handlers installed on this container.
     */
    cleanUp(): void;
}


/**
 * An `EventContractContainerManager` provides the common interface for managing
 * containers.
 */
declare interface EventContractContainerManager {
    addEventListener(eventType: string, getHandler: (element: Element) => (event: Event) => void): void;
    cleanUp(): void;
}

/**
 * A function that handles an event dispatched from the browser.
 *
 * eventType: May differ from `event.type` if JSAction uses a
 * short-hand name or is patching over an non-bubbling event with a bubbling
 * variant.
 * event: The native browser event.
 * container: The container for this dispatch.
 */
declare type EventHandler = (eventType: string, event: Event, container: Element) => void;

/**
 * Records information for later handling of events. This type is
 * shared, and instances of it are passed, between the eventcontract
 * and the dispatcher jsbinary. Therefore, the fields of this type are
 * referenced by string literals rather than property literals
 * throughout the code.
 *
 * 'targetElement' is the element the action occurred on, 'actionElement'
 * is the element that has the jsaction handler.
 *
 * A null 'actionElement' identifies an EventInfo instance that didn't match a
 * jsaction attribute.  This allows us to execute global event handlers with the
 * appropriate event type (including a11y clicks and custom events).
 * The declare portion of this interface creates a set of externs that make sure
 * renaming doesn't happen for EventInfo. This is important since EventInfo
 * is shared across multiple binaries.
 */
declare interface EventInfo {
    eventType: string;
    event: Event;
    targetElement: Element;
    /** The element that is the container for this Event. */
    eic: Element;
    timeStamp: number;
    /**
     * The action parsed from the JSAction element.
     */
    eia?: ActionInfoInternal;
    /**
     * Whether this `Event` is a replay event, meaning no dispatcher was
     * installed when this `Event` was originally dispatched.
     */
    eirp?: boolean;
    /**
     * Whether this `Event` represents a `keydown` event that should be processed
     * as a `click`. Only used when a11y click events is on.
     */
    eiack?: boolean;
}

declare namespace eventInfoLib {
    export {
        getEventType,
        setEventType,
        getEvent,
        setEvent,
        getTargetElement,
        setTargetElement,
        getContainer,
        setContainer,
        getTimestamp,
        setTimestamp,
        getAction,
        setAction,
        unsetAction,
        getActionName,
        getActionElement,
        getIsReplay,
        setIsReplay,
        getA11yClickKey,
        setA11yClickKey,
        cloneEventInfo,
        createEventInfoFromParameters,
        createEventInfo,
        ActionInfo,
        EventInfo,
        EventInfoWrapper
    }
}

/**
 * Utility class around an `EventInfo`.
 *
 * This should be used in compilation units that are less sensitive to code
 * size.
 */
export declare class EventInfoWrapper {
    readonly eventInfo: EventInfo;
    constructor(eventInfo: EventInfo);
    getEventType(): string;
    setEventType(eventType: string): void;
    getEvent(): Event;
    setEvent(event: Event): void;
    getTargetElement(): Element;
    setTargetElement(targetElement: Element): void;
    getContainer(): Element;
    setContainer(container: Element): void;
    getTimestamp(): number;
    setTimestamp(timestamp: number): void;
    getAction(): {
        name: string;
        element: Element;
    } | undefined;
    setAction(action: ActionInfo | undefined): void;
    getIsReplay(): boolean | undefined;
    setIsReplay(replay: boolean): void;
    clone(): EventInfoWrapper;
}

/**
 * A handler is dispatched to during normal handling.
 */
declare type EventInfoWrapperHandler = (eventInfoWrapper: EventInfoWrapper) => void;

/** Added for readability when accessing stable property names. */
declare function getA11yClickKey(eventInfo: EventInfo): boolean | undefined;

/** Added for readability when accessing stable property names. */
declare function getAction(eventInfo: EventInfo): ActionInfoInternal | undefined;

/** Added for readability when accessing stable property names. */
declare function getActionElement(actionInfo: ActionInfoInternal): Element;

/** Added for readability when accessing stable property names. */
declare function getActionName(actionInfo: ActionInfoInternal): string;

/** Added for readability when accessing stable property names. */
declare function getContainer(eventInfo: EventInfo): Element;

/** Added for readability when accessing stable property names. */
declare function getEvent(eventInfo: EventInfo): Event;

/** Added for readability when accessing stable property names. */
declare function getEventType(eventInfo: EventInfo): string;

/** Added for readability when accessing stable property names. */
declare function getIsReplay(eventInfo: EventInfo): boolean | undefined;

/** Added for readability when accessing stable property names. */
declare function getTargetElement(eventInfo: EventInfo): Element;

/** Added for readability when accessing stable property names. */
declare function getTimestamp(eventInfo: EventInfo): number;

/**
 * A global handler is dispatched to before normal handler dispatch. Returning
 * false will `preventDefault` on the event.
 */
declare type GlobalHandler = (event: Event) => boolean | void;

/**
 * Sets the `action` to `clickonly` for a click event that is not an a11y click
 * and if there is not already a click action.
 */
declare function populateClickOnlyAction(actionElement: Element, eventInfo: eventInfoLib.EventInfo, actionMap: {
    [key: string]: string;
}): void;

/**
 * Call `preventDefault` on an a11y click if it is space key or to prevent the
 * browser's default action for native HTML controls.
 */
declare function preventDefaultForA11yClick(eventInfo: eventInfoLib.EventInfo): void;

/**
 * Registers deferred functionality for an EventContract and a Jsaction
 * Dispatcher.
 */
export declare function registerDispatcher(eventContract: UnrenamedEventContract, dispatcher: Dispatcher): void;

/**
 * A replayer is a function that is called when there are queued events,
 * either from the `EventContract` or when there are no detected handlers.
 */
declare type Replayer = (eventInfoWrappers: EventInfoWrapper[], dispatcher: Dispatcher) => void;


/**
 * @fileoverview An enum to control who can call certain jsaction APIs.
 */
declare enum Restriction {
    I_AM_THE_JSACTION_FRAMEWORK = 1
}

/** Added for readability when accessing stable property names. */
declare function setA11yClickKey(eventInfo: EventInfo, a11yClickKey: boolean): void;

/** Added for readability when accessing stable property names. */
declare function setAction(eventInfo: EventInfo, actionName: string, actionElement: Element): void;

/** Added for readability when accessing stable property names. */
declare function setContainer(eventInfo: EventInfo, container: Element): void;

/** Added for readability when accessing stable property names. */
declare function setEvent(eventInfo: EventInfo, event: Event): void;

/** Added for readability when accessing stable property names. */
declare function setEventType(eventInfo: EventInfo, eventType: string): void;

/** Added for readability when accessing stable property names. */
declare function setIsReplay(eventInfo: EventInfo, replay: boolean): void;

/** Added for readability when accessing stable property names. */
declare function setTargetElement(eventInfo: EventInfo, targetElement: Element): void;

/** Added for readability when accessing stable property names. */
declare function setTimestamp(eventInfo: EventInfo, timestamp: number): void;

/**
 * The API of an EventContract that is safe to call from any compilation unit.
 */
declare interface UnrenamedEventContract {
    ecrd(dispatcher: Dispatcher_2, restriction: Restriction): void;
    ecaacs?: (updateEventInfoForA11yClick: typeof a11yClickLib.updateEventInfoForA11yClick, preventDefaultForA11yClick: typeof a11yClickLib.preventDefaultForA11yClick, populateClickOnlyAction: typeof a11yClickLib.populateClickOnlyAction) => void;
}

/** Added for readability when accessing stable property names. */
declare function unsetAction(eventInfo: EventInfo): void;

/**
 * Update `EventInfo` to be `eventType = 'click'` and sets `a11yClickKey` if it
 * is a a11y click.
 */
declare function updateEventInfoForA11yClick(eventInfo: eventInfoLib.EventInfo): void;

export { }
