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
import { Attribute as AccessibilityAttribute } from './accessibility';
import { Attribute } from './attribute';
import * as cache from './cache';
import { Char } from './char';
import * as eventLib from './event';
import { A11Y_CLICK_SUPPORT, A11Y_SUPPORT_IN_DISPATCHER, CUSTOM_EVENT_SUPPORT, JSNAMESPACE_SUPPORT, MOUSE_SPECIAL_SUPPORT, STOP_PROPAGATION, } from './event_contract_defines';
import * as eventInfoLib from './event_info';
import { EventType } from './event_type';
import { Property } from './property';
const DEFAULT_EVENT_TYPE = EventType.CLICK;
/**
 * Since maps from event to action are immutable we can use a single map
 * to represent the empty map.
 */
const EMPTY_ACTION_MAP = {};
/**
 * This regular expression matches a semicolon.
 */
const REGEXP_SEMICOLON = /\s*;\s*/;
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
    static { this.STOP_PROPAGATION = STOP_PROPAGATION; }
    static { this.A11Y_SUPPORT_IN_DISPATCHER = A11Y_SUPPORT_IN_DISPATCHER; }
    static { this.A11Y_CLICK_SUPPORT = A11Y_CLICK_SUPPORT; }
    static { this.MOUSE_SPECIAL_SUPPORT = MOUSE_SPECIAL_SUPPORT; }
    static { this.JSNAMESPACE_SUPPORT = JSNAMESPACE_SUPPORT; }
    constructor(containerManager, stopPropagation = false) {
        this.stopPropagation = stopPropagation;
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
        /** Whether a11y click support has been loaded or not. */
        this.hasA11yClickSupport = false;
        /** Whether to add an a11y click listener. */
        this.addA11yClickListener = EventContract.A11Y_SUPPORT_IN_DISPATCHER;
        this.updateEventInfoForA11yClick = undefined;
        this.preventDefaultForA11yClick = undefined;
        this.populateClickOnlyAction = undefined;
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
     * @param allowRehandling Used in the case of a11y click casting to prevent
     * us from trying to rehandle in an infinite loop.
     */
    handleEventInfo(eventInfo, allowRehandling = true) {
        if (!this.dispatcher) {
            // All events are queued when the dispatcher isn't yet loaded.
            eventInfoLib.setIsReplay(eventInfo, true);
            this.queuedEventInfos?.push(eventInfo);
        }
        if (EventContract.CUSTOM_EVENT_SUPPORT &&
            eventInfoLib.getEventType(eventInfo) === EventType.CUSTOM) {
            const detail = eventInfoLib.getEvent(eventInfo).detail;
            // For custom events, use a secondary dispatch based on the internal
            // custom type of the event.
            if (!detail || !detail['_type']) {
                // This should never happen.
                return;
            }
            eventInfoLib.setEventType(eventInfo, detail['_type']);
        }
        this.populateAction(eventInfo);
        if (this.dispatcher &&
            !eventInfoLib.getEvent(eventInfo)[AccessibilityAttribute.SKIP_GLOBAL_DISPATCH]) {
            const globalEventInfo = eventInfoLib.cloneEventInfo(eventInfo);
            // In some cases, `populateAction` will rewrite `click` events to
            // `clickonly`. Revert back to a regular click, otherwise we won't be able
            // to execute global event handlers registered on click events.
            if (eventInfoLib.getEventType(globalEventInfo) === EventType.CLICKONLY) {
                eventInfoLib.setEventType(globalEventInfo, EventType.CLICK);
            }
            this.dispatcher(globalEventInfo, /* dispatch global event */ true);
        }
        const action = eventInfoLib.getAction(eventInfo);
        if (!action && !checkDispatcherForA11yClick(eventInfo)) {
            return;
        }
        let stopPropagationAfterDispatch = false;
        if (this.stopPropagation &&
            eventInfoLib.getEventType(eventInfo) !== AccessibilityAttribute.MAYBE_CLICK_EVENT_TYPE) {
            if (eventLib.isGecko &&
                (eventInfoLib.getTargetElement(eventInfo).tagName === 'INPUT' ||
                    eventInfoLib.getTargetElement(eventInfo).tagName === 'TEXTAREA') &&
                eventInfoLib.getEventType(eventInfo) === EventType.FOCUS) {
                // Do nothing since stopping propagation a focus event on an input
                // element in Firefox makes the text cursor disappear:
                // https://bugzilla.mozilla.org/show_bug.cgi?id=509684
            }
            else {
                // Since we found a jsaction, prevent other handlers from seeing
                // this event.
                eventLib.stopPropagation(eventInfoLib.getEvent(eventInfo));
            }
        }
        else if (this.stopPropagation &&
            eventInfoLib.getEventType(eventInfo) === AccessibilityAttribute.MAYBE_CLICK_EVENT_TYPE) {
            // We first need to let the dispatcher determine whether we can treat
            // this event as a click event.
            stopPropagationAfterDispatch = true;
        }
        if (this.dispatcher) {
            if (action &&
                shouldPreventDefaultBeforeDispatching(eventInfoLib.getActionElement(action), eventInfo)) {
                eventLib.preventDefault(eventInfoLib.getEvent(eventInfo));
            }
            const unresolvedEventInfo = this.dispatcher(eventInfo);
            if (unresolvedEventInfo && allowRehandling) {
                // The dispatcher only returns an event for MAYBE_CLICK_EVENT_TYPE
                // events that can't be casted to a click. We run it through the
                // handler again to find keydown actions for it.
                this.handleEventInfo(unresolvedEventInfo, /* allowRehandling= */ false);
                return;
            }
            if (stopPropagationAfterDispatch) {
                eventLib.stopPropagation(eventInfoLib.getEvent(eventInfo));
            }
        }
    }
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
    populateAction(eventInfo) {
        // We distinguish modified and plain clicks in order to support the
        // default browser behavior of modified clicks on links; usually to
        // open the URL of the link in new tab or new window on ctrl/cmd
        // click. A DOM 'click' event is mapped to the jsaction 'click'
        // event iff there is no modifier present on the event. If there is
        // a modifier, it's mapped to 'clickmod' instead.
        //
        // It's allowed to omit the event in the jsaction attribute. In that
        // case, 'click' is assumed. Thus the following two are equivalent:
        //
        //   <a href="someurl" jsaction="gna.fu">
        //   <a href="someurl" jsaction="click:gna.fu">
        //
        // For unmodified clicks, EventContract invokes the jsaction
        // 'gna.fu'. For modified clicks, EventContract won't find a
        // suitable action and leave the event to be handled by the
        // browser.
        //
        // In order to also invoke a jsaction handler for a modifier click,
        // 'clickmod' needs to be used:
        //
        //   <a href="someurl" jsaction="clickmod:gna.fu">
        //
        // EventContract invokes the jsaction 'gna.fu' for modified
        // clicks. Unmodified clicks are left to the browser.
        //
        // In order to set up the event contract to handle both clickonly and
        // clickmod, only addEvent(EventType.CLICK) is necessary.
        //
        // In order to set up the event contract to handle click,
        // addEvent() is necessary for CLICK, KEYDOWN, and KEYPRESS event types.  If
        // a11y click support is enabled, addEvent() will set up the appropriate key
        // event handler automatically.
        if (eventInfoLib.getEventType(eventInfo) === EventType.CLICK &&
            eventLib.isModifiedClickEvent(eventInfoLib.getEvent(eventInfo))) {
            eventInfoLib.setEventType(eventInfo, EventType.CLICKMOD);
        }
        else if (this.hasA11yClickSupport) {
            this.updateEventInfoForA11yClick(eventInfo);
        }
        else if (EventContract.A11Y_SUPPORT_IN_DISPATCHER &&
            eventInfoLib.getEventType(eventInfo) === EventType.KEYDOWN &&
            !eventInfoLib.getEvent(eventInfo)[AccessibilityAttribute.SKIP_A11Y_CHECK]) {
            // We use a string literal as this value needs to be referenced in the
            // dispatcher's binary.
            eventInfoLib.setEventType(eventInfo, AccessibilityAttribute.MAYBE_CLICK_EVENT_TYPE);
        }
        // Walk to the parent node, unless the node has a different owner in
        // which case we walk to the owner. Attempt to walk to host of a
        // shadow root if needed.
        let actionElement = eventInfoLib.getTargetElement(eventInfo);
        while (actionElement && actionElement !== eventInfoLib.getContainer(eventInfo)) {
            this.populateActionOnElement(actionElement, eventInfo);
            if (eventInfoLib.getAction(eventInfo)) {
                // An event is handled by at most one jsaction. Thus we stop at the
                // first matching jsaction specified in a jsaction attribute up the
                // ancestor chain of the event target node.
                break;
            }
            if (actionElement[Property.OWNER]) {
                actionElement = actionElement[Property.OWNER];
                continue;
            }
            if (actionElement.parentNode?.nodeName !== '#document-fragment') {
                actionElement = actionElement.parentNode;
            }
            else {
                actionElement = actionElement.parentNode?.host ?? null;
            }
        }
        const action = eventInfoLib.getAction(eventInfo);
        if (!action) {
            // No action found.
            return;
        }
        if (this.hasA11yClickSupport) {
            this.preventDefaultForA11yClick(eventInfo);
        }
        // We attempt to handle the mouseenter/mouseleave events here by
        // detecting whether the mouseover/mouseout events correspond to
        // entering/leaving an element.
        if (EventContract.MOUSE_SPECIAL_SUPPORT &&
            (eventInfoLib.getEventType(eventInfo) === EventType.MOUSEENTER ||
                eventInfoLib.getEventType(eventInfo) === EventType.MOUSELEAVE ||
                eventInfoLib.getEventType(eventInfo) === EventType.POINTERENTER ||
                eventInfoLib.getEventType(eventInfo) === EventType.POINTERLEAVE)) {
            // We attempt to handle the mouseenter/mouseleave events here by
            // detecting whether the mouseover/mouseout events correspond to
            // entering/leaving an element.
            if (eventLib.isMouseSpecialEvent(eventInfoLib.getEvent(eventInfo), eventInfoLib.getEventType(eventInfo), eventInfoLib.getActionElement(action))) {
                // If both mouseover/mouseout and mouseenter/mouseleave events are
                // enabled, two separate handlers for mouseover/mouseout are
                // registered. Both handlers will see the same event instance
                // so we create a copy to avoid interfering with the dispatching of
                // the mouseover/mouseout event.
                const copiedEvent = eventLib.createMouseSpecialEvent(eventInfoLib.getEvent(eventInfo), eventInfoLib.getActionElement(action));
                eventInfoLib.setEvent(eventInfo, copiedEvent);
                // Since the mouseenter/mouseleave events do not bubble, the target
                // of the event is technically the `actionElement` (the node with the
                // `jsaction` attribute)
                eventInfoLib.setTargetElement(eventInfo, eventInfoLib.getActionElement(action));
            }
            else {
                eventInfoLib.unsetAction(eventInfo);
            }
        }
    }
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
    populateActionOnElement(actionElement, eventInfo) {
        const actionMap = parseActions(actionElement, eventInfoLib.getContainer(eventInfo));
        const actionName = actionMap[eventInfoLib.getEventType(eventInfo)];
        if (actionName !== undefined) {
            eventInfoLib.setAction(eventInfo, actionName, actionElement);
        }
        if (this.hasA11yClickSupport) {
            this.populateClickOnlyAction(actionElement, eventInfo, actionMap);
        }
        if (EventContract.A11Y_SUPPORT_IN_DISPATCHER) {
            if (eventInfoLib.getEventType(eventInfo) === AccessibilityAttribute.MAYBE_CLICK_EVENT_TYPE &&
                actionMap[EventType.CLICK] !== undefined) {
                // We'll take the first CLICK action we find and have the dispatcher
                // check if the keydown event can be used as a CLICK. If not, the
                // dispatcher will retrigger the event so that we can find a keydown
                // event instead.
                // When we get MAYBE_CLICK_EVENT_TYPE as an eventType, we want to
                // retrieve the action corresponding to CLICK, but still keep the
                // eventInfoLib.getEventType(eventInfo, ) as MAYBE_CLICK_EVENT_TYPE. The
                // dispatcher uses this event type to determine if it should get the
                // handler for the action.
                eventInfoLib.setAction(eventInfo, actionMap[EventType.CLICK], actionElement);
            }
            else {
                a11yClickLib.populateClickOnlyAction(actionElement, eventInfo, actionMap);
            }
        }
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
        this.hasA11yClickSupport = true;
        this.updateEventInfoForA11yClick = updateEventInfoForA11yClick;
        this.preventDefaultForA11yClick = preventDefaultForA11yClick;
        this.populateClickOnlyAction = populateClickOnlyAction;
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
 * Determines whether or not the `EventContract` needs to check with the
 * dispatcher even if there's no action.
 */
function checkDispatcherForA11yClick(eventInfo) {
    return (EventContract.A11Y_SUPPORT_IN_DISPATCHER &&
        eventInfoLib.getEventType(eventInfo) === AccessibilityAttribute.MAYBE_CLICK_EVENT_TYPE);
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
/**
 * Parses and caches an element's jsaction element into a map.
 *
 * This is primarily for internal use.
 *
 * @param actionElement The DOM node to retrieve the jsaction map from.
 * @param container The node which limits the namespace lookup for a jsaction
 * name. The container node itself will not be searched.
 * @return Map from event to qualified name of the jsaction bound to it.
 */
export function parseActions(actionElement, container) {
    let actionMap = cache.get(actionElement);
    if (!actionMap) {
        const jsactionAttribute = getAttr(actionElement, Attribute.JSACTION);
        if (!jsactionAttribute) {
            actionMap = EMPTY_ACTION_MAP;
            cache.set(actionElement, actionMap);
        }
        else {
            actionMap = cache.getParsed(jsactionAttribute);
            if (!actionMap) {
                actionMap = {};
                const values = jsactionAttribute.split(REGEXP_SEMICOLON);
                for (let idx = 0; idx < values.length; idx++) {
                    const value = values[idx];
                    if (!value) {
                        continue;
                    }
                    const colon = value.indexOf(Char.EVENT_ACTION_SEPARATOR);
                    const hasColon = colon !== -1;
                    const type = hasColon ? stringTrim(value.substr(0, colon)) : DEFAULT_EVENT_TYPE;
                    const action = hasColon ? stringTrim(value.substr(colon + 1)) : value;
                    actionMap[type] = action;
                }
                cache.setParsed(jsactionAttribute, actionMap);
            }
            // If namespace support is active we need to augment the (potentially
            // cached) jsaction mapping with the namespace.
            if (EventContract.JSNAMESPACE_SUPPORT) {
                const noNs = actionMap;
                actionMap = {};
                for (const type in noNs) {
                    actionMap[type] = getFullyQualifiedAction(noNs[type], actionElement, container);
                }
            }
            cache.set(actionElement, actionMap);
        }
    }
    return actionMap;
}
/**
 * Returns the fully qualified jsaction action. If the given jsaction
 * name doesn't already contain the namespace, the function iterates
 * over ancestor nodes until a jsnamespace attribute is found, and
 * uses the value of that attribute as the namespace.
 *
 * @param action The jsaction action to resolve.
 * @param start The node from which to start searching for a jsnamespace
 * attribute.
 * @param container The node which limits the search for a jsnamespace
 * attribute. This node will be searched.
 * @return The fully qualified name of the jsaction. If no namespace is found,
 * returns the unqualified name in case it exists in the global namespace.
 */
function getFullyQualifiedAction(action, start, container) {
    if (EventContract.JSNAMESPACE_SUPPORT) {
        if (isNamespacedAction(action)) {
            return action;
        }
        let node = start;
        while (node) {
            const namespace = getNamespaceFromElement(node);
            if (namespace) {
                return namespace + Char.NAMESPACE_ACTION_SEPARATOR + action;
            }
            // If this node is the container, stop.
            if (node === container) {
                break;
            }
            node = node.parentNode;
        }
    }
    return action;
}
/**
 * Checks if a jsaction action contains a namespace part.
 */
function isNamespacedAction(action) {
    return action.indexOf(Char.NAMESPACE_ACTION_SEPARATOR) >= 0;
}
/**
 * Returns the value of the jsnamespace attribute of the given node.
 * Also caches the value for subsequent lookups.
 * @param element The node whose jsnamespace attribute is being asked for.
 * @return The value of the jsnamespace attribute, or null if not found.
 */
function getNamespaceFromElement(element) {
    let namespace = cache.getNamespace(element);
    // Only query for the attribute if it has not been queried for
    // before. getAttr() returns null if an attribute is not present. Thus,
    // namespace is string|null if the query took place in the past, or
    // undefined if the query did not take place.
    if (namespace === undefined) {
        namespace = getAttr(element, Attribute.JSNAMESPACE);
        cache.setNamespace(element, namespace);
    }
    return namespace;
}
/**
 * Accesses the event handler attribute value of a DOM node. It guards
 * against weird situations (described in the body) that occur in
 * connection with nodes that are removed from their document.
 * @param element The DOM element.
 * @param attribute The name of the attribute to access.
 * @return The attribute value if it was found, null otherwise.
 */
function getAttr(element, attribute) {
    let value = null;
    // NOTE: Nodes in IE do not always have a getAttribute
    // method defined. This is the case where sourceElement has in
    // fact been removed from the DOM before eventContract begins
    // handling - where a parentNode does not have getAttribute
    // defined.
    // NOTE: We must use the 'in' operator instead of the regular dot
    // notation, since the latter fails in IE8 if the getAttribute method is not
    // defined. See b/7139109.
    if ('getAttribute' in element) {
        value = element.getAttribute(attribute);
    }
    return value;
}
/**
 * Helper function to trim whitespace from the beginning and the end
 * of the string. This deliberately doesn't use the closure equivalent
 * to keep dependencies small.
 * @param str  Input string.
 * @return  Trimmed string.
 */
function stringTrim(str) {
    if (typeof String.prototype.trim === 'function') {
        return str.trim();
    }
    const trimmedLeft = str.replace(/^\s+/, '');
    return trimmedLeft.replace(/\s+$/, '');
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXZlbnRjb250cmFjdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvcHJpbWl0aXZlcy9ldmVudC1kaXNwYXRjaC9zcmMvZXZlbnRjb250cmFjdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQXNCRztBQUVILE9BQU8sS0FBSyxZQUFZLE1BQU0sY0FBYyxDQUFDO0FBQzdDLE9BQU8sRUFBQyxTQUFTLElBQUksc0JBQXNCLEVBQUMsTUFBTSxpQkFBaUIsQ0FBQztBQUNwRSxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sYUFBYSxDQUFDO0FBQ3RDLE9BQU8sS0FBSyxLQUFLLE1BQU0sU0FBUyxDQUFDO0FBQ2pDLE9BQU8sRUFBQyxJQUFJLEVBQUMsTUFBTSxRQUFRLENBQUM7QUFFNUIsT0FBTyxLQUFLLFFBQVEsTUFBTSxTQUFTLENBQUM7QUFFcEMsT0FBTyxFQUNMLGtCQUFrQixFQUNsQiwwQkFBMEIsRUFDMUIsb0JBQW9CLEVBQ3BCLG1CQUFtQixFQUNuQixxQkFBcUIsRUFDckIsZ0JBQWdCLEdBQ2pCLE1BQU0sMEJBQTBCLENBQUM7QUFDbEMsT0FBTyxLQUFLLFlBQVksTUFBTSxjQUFjLENBQUM7QUFDN0MsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLGNBQWMsQ0FBQztBQUN2QyxPQUFPLEVBQUMsUUFBUSxFQUFDLE1BQU0sWUFBWSxDQUFDO0FBa0NwQyxNQUFNLGtCQUFrQixHQUFXLFNBQVMsQ0FBQyxLQUFLLENBQUM7QUFFbkQ7OztHQUdHO0FBQ0gsTUFBTSxnQkFBZ0IsR0FBNEIsRUFBRSxDQUFDO0FBRXJEOztHQUVHO0FBQ0gsTUFBTSxnQkFBZ0IsR0FBRyxTQUFTLENBQUM7QUFFbkM7Ozs7Ozs7Ozs7Ozs7R0FhRztBQUNILE1BQU0sT0FBTyxhQUFhO2FBQ2pCLHlCQUFvQixHQUFHLG9CQUFvQixB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Q0FBQztJQUNELE9BQU8sU0FBUyxDQUFDO0FBQ25CLENBQUM7QUFFRDs7Ozs7OztHQU9HO0FBQ0gsU0FBUyxPQUFPLENBQUMsT0FBZ0IsRUFBRSxTQUFpQjtJQUNsRCxJQUFJLEtBQUssR0FBRyxJQUFJLENBQUM7SUFDakIsc0RBQXNEO0lBQ3RELDhEQUE4RDtJQUM5RCw2REFBNkQ7SUFDN0QsMkRBQTJEO0lBQzNELFdBQVc7SUFDWCxpRUFBaUU7SUFDakUsNEVBQTRFO0lBQzVFLDBCQUEwQjtJQUMxQixJQUFJLGNBQWMsSUFBSSxPQUFPLEVBQUUsQ0FBQztRQUM5QixLQUFLLEdBQUcsT0FBTyxDQUFDLFlBQVksQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUMxQyxDQUFDO0lBQ0QsT0FBTyxLQUFLLENBQUM7QUFDZixDQUFDO0FBRUQ7Ozs7OztHQU1HO0FBQ0gsU0FBUyxVQUFVLENBQUMsR0FBVztJQUM3QixJQUFJLE9BQU8sTUFBTSxDQUFDLFNBQVMsQ0FBQyxJQUFJLEtBQUssVUFBVSxFQUFFLENBQUM7UUFDaEQsT0FBTyxHQUFHLENBQUMsSUFBSSxFQUFFLENBQUM7SUFDcEIsQ0FBQztJQUVELE1BQU0sV0FBVyxHQUFHLEdBQUcsQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBQzVDLE9BQU8sV0FBVyxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLENBQUM7QUFDekMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgSW1wbGVtZW50cyB0aGUgbG9jYWwgZXZlbnQgaGFuZGxpbmcgY29udHJhY3QuIFRoaXNcbiAqIGFsbG93cyBET00gb2JqZWN0cyBpbiBhIGNvbnRhaW5lciB0aGF0IGVudGVycyBpbnRvIHRoaXMgY29udHJhY3QgdG9cbiAqIGRlZmluZSBldmVudCBoYW5kbGVycyB3aGljaCBhcmUgZXhlY3V0ZWQgaW4gYSBsb2NhbCBjb250ZXh0LlxuICpcbiAqIE9uZSBFdmVudENvbnRyYWN0IGluc3RhbmNlIGNhbiBtYW5hZ2UgdGhlIGNvbnRyYWN0IGZvciBtdWx0aXBsZVxuICogY29udGFpbmVycywgd2hpY2ggYXJlIGFkZGVkIHVzaW5nIHRoZSBhZGRDb250YWluZXIoKSBtZXRob2QuXG4gKlxuICogRXZlbnRzIGNhbiBiZSByZWdpc3RlcmVkIHVzaW5nIHRoZSBhZGRFdmVudCgpIG1ldGhvZC5cbiAqXG4gKiBBIERpc3BhdGNoZXIgaXMgYWRkZWQgdXNpbmcgdGhlIHJlZ2lzdGVyRGlzcGF0Y2hlcigpIG1ldGhvZC4gVW50aWwgdGhlcmUgaXNcbiAqIGEgZGlzcGF0Y2hlciwgZXZlbnRzIGFyZSBxdWV1ZWQuIFRoZSBpZGVhIGlzIHRoYXQgdGhlIEV2ZW50Q29udHJhY3RcbiAqIGNsYXNzIGlzIGlubGluZWQgaW4gdGhlIEhUTUwgb2YgdGhlIHRvcCBsZXZlbCBwYWdlIGFuZCBpbnN0YW50aWF0ZWRcbiAqIHJpZ2h0IGFmdGVyIHRoZSBzdGFydCBvZiA8Ym9keT4uIFRoZSBEaXNwYXRjaGVyIGNsYXNzIGlzIGNvbnRhaW5lZFxuICogaW4gdGhlIGV4dGVybmFsIGRlZmVycmVkIGpzLCBhbmQgaW5zdGFudGlhdGVkIGFuZCByZWdpc3RlcmVkIHdpdGhcbiAqIEV2ZW50Q29udHJhY3Qgd2hlbiB0aGUgZXh0ZXJuYWwgamF2YXNjcmlwdCBpbiB0aGUgcGFnZSBsb2Fkcy4gVGhlXG4gKiBleHRlcm5hbCBqYXZhc2NyaXB0IHdpbGwgYWxzbyByZWdpc3RlciB0aGUganNhY3Rpb24gaGFuZGxlcnMsIHdoaWNoXG4gKiB0aGVuIHBpY2sgdXAgdGhlIHF1ZXVlZCBldmVudHMgYXQgdGhlIHRpbWUgb2YgcmVnaXN0cmF0aW9uLlxuICpcbiAqIFNpbmNlIHRoaXMgY2xhc3MgaXMgbWVhbnQgdG8gYmUgaW5saW5lZCBpbiB0aGUgbWFpbiBwYWdlIEhUTUwsIHRoZVxuICogc2l6ZSBvZiB0aGUgYmluYXJ5IGNvbXBpbGVkIGZyb20gdGhpcyBmaWxlIE1VU1QgYmUga2VwdCBhcyBzbWFsbCBhc1xuICogcG9zc2libGUgYW5kIHRodXMgaXRzIGRlcGVuZGVuY2llcyB0byBhIG1pbmltdW0uXG4gKi9cblxuaW1wb3J0ICogYXMgYTExeUNsaWNrTGliIGZyb20gJy4vYTExeV9jbGljayc7XG5pbXBvcnQge0F0dHJpYnV0ZSBhcyBBY2Nlc3NpYmlsaXR5QXR0cmlidXRlfSBmcm9tICcuL2FjY2Vzc2liaWxpdHknO1xuaW1wb3J0IHtBdHRyaWJ1dGV9IGZyb20gJy4vYXR0cmlidXRlJztcbmltcG9ydCAqIGFzIGNhY2hlIGZyb20gJy4vY2FjaGUnO1xuaW1wb3J0IHtDaGFyfSBmcm9tICcuL2NoYXInO1xuaW1wb3J0IHtFYXJseUpzYWN0aW9uRGF0YX0gZnJvbSAnLi9lYXJseWV2ZW50Y29udHJhY3QnO1xuaW1wb3J0ICogYXMgZXZlbnRMaWIgZnJvbSAnLi9ldmVudCc7XG5pbXBvcnQge0V2ZW50Q29udHJhY3RDb250YWluZXJNYW5hZ2VyfSBmcm9tICcuL2V2ZW50X2NvbnRyYWN0X2NvbnRhaW5lcic7XG5pbXBvcnQge1xuICBBMTFZX0NMSUNLX1NVUFBPUlQsXG4gIEExMVlfU1VQUE9SVF9JTl9ESVNQQVRDSEVSLFxuICBDVVNUT01fRVZFTlRfU1VQUE9SVCxcbiAgSlNOQU1FU1BBQ0VfU1VQUE9SVCxcbiAgTU9VU0VfU1BFQ0lBTF9TVVBQT1JULFxuICBTVE9QX1BST1BBR0FUSU9OLFxufSBmcm9tICcuL2V2ZW50X2NvbnRyYWN0X2RlZmluZXMnO1xuaW1wb3J0ICogYXMgZXZlbnRJbmZvTGliIGZyb20gJy4vZXZlbnRfaW5mbyc7XG5pbXBvcnQge0V2ZW50VHlwZX0gZnJvbSAnLi9ldmVudF90eXBlJztcbmltcG9ydCB7UHJvcGVydHl9IGZyb20gJy4vcHJvcGVydHknO1xuaW1wb3J0IHtSZXN0cmljdGlvbn0gZnJvbSAnLi9yZXN0cmljdGlvbic7XG5cbi8qKlxuICogVGhlIEFQSSBvZiBhbiBFdmVudENvbnRyYWN0IHRoYXQgaXMgc2FmZSB0byBjYWxsIGZyb20gYW55IGNvbXBpbGF0aW9uIHVuaXQuXG4gKi9cbmV4cG9ydCBkZWNsYXJlIGludGVyZmFjZSBVbnJlbmFtZWRFdmVudENvbnRyYWN0IHtcbiAgLy8gQWxpYXMgZm9yIEpzY3Rpb24gRXZlbnRDb250cmFjdCByZWdpc3RlckRpc3BhdGNoZXIuXG4gIGVjcmQoZGlzcGF0Y2hlcjogRGlzcGF0Y2hlciwgcmVzdHJpY3Rpb246IFJlc3RyaWN0aW9uKTogdm9pZDtcbiAgLy8gVW5yZW5hbWVkIGZ1bmN0aW9uLiBBYmJyZXZpYXRpb24gZm9yIGBldmVudENvbnRyYWN0LmFkZEExMXlDbGlja1N1cHBvcnRgLlxuICBlY2FhY3M/OiAoXG4gICAgdXBkYXRlRXZlbnRJbmZvRm9yQTExeUNsaWNrOiB0eXBlb2YgYTExeUNsaWNrTGliLnVwZGF0ZUV2ZW50SW5mb0ZvckExMXlDbGljayxcbiAgICBwcmV2ZW50RGVmYXVsdEZvckExMXlDbGljazogdHlwZW9mIGExMXlDbGlja0xpYi5wcmV2ZW50RGVmYXVsdEZvckExMXlDbGljayxcbiAgICBwb3B1bGF0ZUNsaWNrT25seUFjdGlvbjogdHlwZW9mIGExMXlDbGlja0xpYi5wb3B1bGF0ZUNsaWNrT25seUFjdGlvbixcbiAgKSA9PiB2b2lkO1xufVxuXG4vKiogQSBmdW5jdGlvbiB0aGF0IGlzIGNhbGxlZCB0byBoYW5kbGUgZXZlbnRzIGNhcHR1cmVkIGJ5IHRoZSBFdmVudENvbnRyYWN0LiAqL1xuZXhwb3J0IHR5cGUgRGlzcGF0Y2hlciA9IChcbiAgZXZlbnRJbmZvOiBldmVudEluZm9MaWIuRXZlbnRJbmZvLFxuICBnbG9iYWxEaXNwYXRjaD86IGJvb2xlYW4sXG4pID0+IGV2ZW50SW5mb0xpYi5FdmVudEluZm8gfCB2b2lkO1xuXG4vKipcbiAqIEEgZnVuY3Rpb24gdGhhdCBoYW5kbGVzIGFuIGV2ZW50IGRpc3BhdGNoZWQgZnJvbSB0aGUgYnJvd3Nlci5cbiAqXG4gKiBldmVudFR5cGU6IE1heSBkaWZmZXIgZnJvbSBgZXZlbnQudHlwZWAgaWYgSlNBY3Rpb24gdXNlcyBhXG4gKiBzaG9ydC1oYW5kIG5hbWUgb3IgaXMgcGF0Y2hpbmcgb3ZlciBhbiBub24tYnViYmxpbmcgZXZlbnQgd2l0aCBhIGJ1YmJsaW5nXG4gKiB2YXJpYW50LlxuICogZXZlbnQ6IFRoZSBuYXRpdmUgYnJvd3NlciBldmVudC5cbiAqIGNvbnRhaW5lcjogVGhlIGNvbnRhaW5lciBmb3IgdGhpcyBkaXNwYXRjaC5cbiAqL1xudHlwZSBFdmVudEhhbmRsZXIgPSAoZXZlbnRUeXBlOiBzdHJpbmcsIGV2ZW50OiBFdmVudCwgY29udGFpbmVyOiBFbGVtZW50KSA9PiB2b2lkO1xuXG5jb25zdCBERUZBVUxUX0VWRU5UX1RZUEU6IHN0cmluZyA9IEV2ZW50VHlwZS5DTElDSztcblxuLyoqXG4gKiBTaW5jZSBtYXBzIGZyb20gZXZlbnQgdG8gYWN0aW9uIGFyZSBpbW11dGFibGUgd2UgY2FuIHVzZSBhIHNpbmdsZSBtYXBcbiAqIHRvIHJlcHJlc2VudCB0aGUgZW1wdHkgbWFwLlxuICovXG5jb25zdCBFTVBUWV9BQ1RJT05fTUFQOiB7W2tleTogc3RyaW5nXTogc3RyaW5nfSA9IHt9O1xuXG4vKipcbiAqIFRoaXMgcmVndWxhciBleHByZXNzaW9uIG1hdGNoZXMgYSBzZW1pY29sb24uXG4gKi9cbmNvbnN0IFJFR0VYUF9TRU1JQ09MT04gPSAvXFxzKjtcXHMqLztcblxuLyoqXG4gKiBFdmVudENvbnRyYWN0IGludGVyY2VwdHMgZXZlbnRzIGluIHRoZSBidWJibGluZyBwaGFzZSBhdCB0aGVcbiAqIGJvdW5kYXJ5IG9mIGEgY29udGFpbmVyIGVsZW1lbnQsIGFuZCBtYXBzIHRoZW0gdG8gZ2VuZXJpYyBhY3Rpb25zXG4gKiB3aGljaCBhcmUgc3BlY2lmaWVkIHVzaW5nIHRoZSBjdXN0b20ganNhY3Rpb24gYXR0cmlidXRlIGluXG4gKiBIVE1MLiBCZWhhdmlvciBvZiB0aGUgYXBwbGljYXRpb24gaXMgdGhlbiBzcGVjaWZpZWQgaW4gdGVybXMgb2ZcbiAqIGhhbmRsZXIgZm9yIHN1Y2ggYWN0aW9ucywgY2YuIGpzYWN0aW9uLkRpc3BhdGNoZXIgaW4gZGlzcGF0Y2hlci5qcy5cbiAqXG4gKiBUaGlzIGhhcyBzZXZlcmFsIGJlbmVmaXRzOiAoMSkgTm8gRE9NIGV2ZW50IGhhbmRsZXJzIG5lZWQgdG8gYmVcbiAqIHJlZ2lzdGVyZWQgb24gdGhlIHNwZWNpZmljIGVsZW1lbnRzIGluIHRoZSBVSS4gKDIpIFRoZSBzZXQgb2ZcbiAqIGV2ZW50cyB0aGF0IHRoZSBhcHBsaWNhdGlvbiBoYXMgdG8gaGFuZGxlIGNhbiBiZSBzcGVjaWZpZWQgaW4gdGVybXNcbiAqIG9mIHRoZSBzZW1hbnRpY3Mgb2YgdGhlIGFwcGxpY2F0aW9uLCByYXRoZXIgdGhhbiBpbiB0ZXJtcyBvZiBET01cbiAqIGV2ZW50cy4gKDMpIEludm9jYXRpb24gb2YgaGFuZGxlcnMgY2FuIGJlIGRlbGF5ZWQgYW5kIGhhbmRsZXJzIGNhblxuICogYmUgZGVsYXkgbG9hZGVkIGluIGEgZ2VuZXJpYyB3YXkuXG4gKi9cbmV4cG9ydCBjbGFzcyBFdmVudENvbnRyYWN0IGltcGxlbWVudHMgVW5yZW5hbWVkRXZlbnRDb250cmFjdCB7XG4gIHN0YXRpYyBDVVNUT01fRVZFTlRfU1VQUE9SVCA9IENVU1RPTV9FVkVOVF9TVVBQT1JUO1xuICBzdGF0aWMgU1RPUF9QUk9QQUdBVElPTiA9IFNUT1BfUFJPUEFHQVRJT047XG4gIHN0YXRpYyBBMTFZX1NVUFBPUlRfSU5fRElTUEFUQ0hFUiA9IEExMVlfU1VQUE9SVF9JTl9ESVNQQVRDSEVSO1xuICBzdGF0aWMgQTExWV9DTElDS19TVVBQT1JUID0gQTExWV9DTElDS19TVVBQT1JUO1xuICBzdGF0aWMgTU9VU0VfU1BFQ0lBTF9TVVBQT1JUID0gTU9VU0VfU1BFQ0lBTF9TVVBQT1JUO1xuICBzdGF0aWMgSlNOQU1FU1BBQ0VfU1VQUE9SVCA9IEpTTkFNRVNQQUNFX1NVUFBPUlQ7XG5cbiAgcHJpdmF0ZSBjb250YWluZXJNYW5hZ2VyOiBFdmVudENvbnRyYWN0Q29udGFpbmVyTWFuYWdlciB8IG51bGw7XG5cbiAgLyoqXG4gICAqIFRoZSBET00gZXZlbnRzIHdoaWNoIHRoaXMgY29udHJhY3QgY292ZXJzLiBVc2VkIHRvIHByZXZlbnQgZG91YmxlXG4gICAqIHJlZ2lzdHJhdGlvbiBvZiBldmVudCB0eXBlcy4gVGhlIHZhbHVlIG9mIHRoZSBtYXAgaXMgdGhlXG4gICAqIGludGVybmFsbHkgY3JlYXRlZCBET00gZXZlbnQgaGFuZGxlciBmdW5jdGlvbiB0aGF0IGhhbmRsZXMgdGhlXG4gICAqIERPTSBldmVudHMuIFNlZSBhZGRFdmVudCgpLlxuICAgKlxuICAgKi9cbiAgcHJpdmF0ZSBldmVudEhhbmRsZXJzOiB7W2tleTogc3RyaW5nXTogRXZlbnRIYW5kbGVyfSA9IHt9O1xuXG4gIHByaXZhdGUgYnJvd3NlckV2ZW50VHlwZVRvRXh0cmFFdmVudFR5cGVzOiB7W2tleTogc3RyaW5nXTogc3RyaW5nW119ID0ge307XG5cbiAgLyoqXG4gICAqIFRoZSBkaXNwYXRjaGVyIGZ1bmN0aW9uLiBFdmVudHMgYXJlIHBhc3NlZCB0byB0aGlzIGZ1bmN0aW9uIGZvclxuICAgKiBoYW5kbGluZyBvbmNlIGl0IHdhcyBzZXQgdXNpbmcgdGhlIHJlZ2lzdGVyRGlzcGF0Y2hlcigpIG1ldGhvZC4gVGhpcyBpc1xuICAgKiBkb25lIGJlY2F1c2UgdGhlIGZ1bmN0aW9uIGlzIHBhc3NlZCBmcm9tIGFub3RoZXIganNiaW5hcnksIHNvIHBhc3NpbmcgdGhlXG4gICAqIGluc3RhbmNlIGFuZCBpbnZva2luZyB0aGUgbWV0aG9kIGhlcmUgd291bGQgcmVxdWlyZSB0byBsZWF2ZSB0aGUgbWV0aG9kXG4gICAqIHVub2JmdXNjYXRlZC5cbiAgICovXG4gIHByaXZhdGUgZGlzcGF0Y2hlcjogRGlzcGF0Y2hlciB8IG51bGwgPSBudWxsO1xuXG4gIC8qKlxuICAgKiBUaGUgbGlzdCBvZiBzdXNwZW5kZWQgYEV2ZW50SW5mb2AgdGhhdCB3aWxsIGJlIGRpc3BhdGNoZWRcbiAgICogYXMgc29vbiBhcyB0aGUgYERpc3BhdGNoZXJgIGlzIHJlZ2lzdGVyZWQuXG4gICAqL1xuICBwcml2YXRlIHF1ZXVlZEV2ZW50SW5mb3M6IGV2ZW50SW5mb0xpYi5FdmVudEluZm9bXSB8IG51bGwgPSBbXTtcblxuICAvKiogV2hldGhlciBhMTF5IGNsaWNrIHN1cHBvcnQgaGFzIGJlZW4gbG9hZGVkIG9yIG5vdC4gKi9cbiAgcHJpdmF0ZSBoYXNBMTF5Q2xpY2tTdXBwb3J0ID0gZmFsc2U7XG4gIC8qKiBXaGV0aGVyIHRvIGFkZCBhbiBhMTF5IGNsaWNrIGxpc3RlbmVyLiAqL1xuICBwcml2YXRlIGFkZEExMXlDbGlja0xpc3RlbmVyID0gRXZlbnRDb250cmFjdC5BMTFZX1NVUFBPUlRfSU5fRElTUEFUQ0hFUjtcblxuICBwcml2YXRlIHVwZGF0ZUV2ZW50SW5mb0ZvckExMXlDbGljaz86IChldmVudEluZm86IGV2ZW50SW5mb0xpYi5FdmVudEluZm8pID0+IHZvaWQgPSB1bmRlZmluZWQ7XG5cbiAgcHJpdmF0ZSBwcmV2ZW50RGVmYXVsdEZvckExMXlDbGljaz86IChldmVudEluZm86IGV2ZW50SW5mb0xpYi5FdmVudEluZm8pID0+IHZvaWQgPSB1bmRlZmluZWQ7XG5cbiAgcHJpdmF0ZSBwb3B1bGF0ZUNsaWNrT25seUFjdGlvbj86IChcbiAgICBhY3Rpb25FbGVtZW50OiBFbGVtZW50LFxuICAgIGV2ZW50SW5mbzogZXZlbnRJbmZvTGliLkV2ZW50SW5mbyxcbiAgICBhY3Rpb25NYXA6IHtba2V5OiBzdHJpbmddOiBzdHJpbmd9LFxuICApID0+IHZvaWQgPSB1bmRlZmluZWQ7XG5cbiAgZWNhYWNzPzogKFxuICAgIHVwZGF0ZUV2ZW50SW5mb0ZvckExMXlDbGljazogdHlwZW9mIGExMXlDbGlja0xpYi51cGRhdGVFdmVudEluZm9Gb3JBMTF5Q2xpY2ssXG4gICAgcHJldmVudERlZmF1bHRGb3JBMTF5Q2xpY2s6IHR5cGVvZiBhMTF5Q2xpY2tMaWIucHJldmVudERlZmF1bHRGb3JBMTF5Q2xpY2ssXG4gICAgcG9wdWxhdGVDbGlja09ubHlBY3Rpb246IHR5cGVvZiBhMTF5Q2xpY2tMaWIucG9wdWxhdGVDbGlja09ubHlBY3Rpb24sXG4gICkgPT4gdm9pZDtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBjb250YWluZXJNYW5hZ2VyOiBFdmVudENvbnRyYWN0Q29udGFpbmVyTWFuYWdlcixcbiAgICBwcml2YXRlIHJlYWRvbmx5IHN0b3BQcm9wYWdhdGlvbjogZmFsc2UgPSBmYWxzZSxcbiAgKSB7XG4gICAgdGhpcy5jb250YWluZXJNYW5hZ2VyID0gY29udGFpbmVyTWFuYWdlcjtcbiAgICBpZiAoRXZlbnRDb250cmFjdC5DVVNUT01fRVZFTlRfU1VQUE9SVCkge1xuICAgICAgdGhpcy5hZGRFdmVudChFdmVudFR5cGUuQ1VTVE9NKTtcbiAgICB9XG4gICAgaWYgKEV2ZW50Q29udHJhY3QuQTExWV9DTElDS19TVVBQT1JUKSB7XG4gICAgICAvLyBBZGQgYTExeSBjbGljayBzdXBwb3J0IHRvIHRoZSBgRXZlbnRDb250cmFjdGAuXG4gICAgICB0aGlzLmFkZEExMXlDbGlja1N1cHBvcnQoKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGhhbmRsZUV2ZW50KGV2ZW50VHlwZTogc3RyaW5nLCBldmVudDogRXZlbnQsIGNvbnRhaW5lcjogRWxlbWVudCkge1xuICAgIGNvbnN0IGV2ZW50SW5mbyA9IGV2ZW50SW5mb0xpYi5jcmVhdGVFdmVudEluZm9Gcm9tUGFyYW1ldGVycyhcbiAgICAgIC8qIGV2ZW50VHlwZT0gKi8gZXZlbnRUeXBlLFxuICAgICAgLyogZXZlbnQ9ICovIGV2ZW50LFxuICAgICAgLyogdGFyZ2V0RWxlbWVudD0gKi8gZXZlbnQudGFyZ2V0IGFzIEVsZW1lbnQsXG4gICAgICAvKiBjb250YWluZXI9ICovIGNvbnRhaW5lcixcbiAgICAgIC8qIHRpbWVzdGFtcD0gKi8gRGF0ZS5ub3coKSxcbiAgICApO1xuICAgIHRoaXMuaGFuZGxlRXZlbnRJbmZvKGV2ZW50SW5mbyk7XG4gIH1cblxuICAvKipcbiAgICogSGFuZGxlIGFuIGBFdmVudEluZm9gLlxuICAgKiBAcGFyYW0gYWxsb3dSZWhhbmRsaW5nIFVzZWQgaW4gdGhlIGNhc2Ugb2YgYTExeSBjbGljayBjYXN0aW5nIHRvIHByZXZlbnRcbiAgICogdXMgZnJvbSB0cnlpbmcgdG8gcmVoYW5kbGUgaW4gYW4gaW5maW5pdGUgbG9vcC5cbiAgICovXG4gIHByaXZhdGUgaGFuZGxlRXZlbnRJbmZvKGV2ZW50SW5mbzogZXZlbnRJbmZvTGliLkV2ZW50SW5mbywgYWxsb3dSZWhhbmRsaW5nID0gdHJ1ZSkge1xuICAgIGlmICghdGhpcy5kaXNwYXRjaGVyKSB7XG4gICAgICAvLyBBbGwgZXZlbnRzIGFyZSBxdWV1ZWQgd2hlbiB0aGUgZGlzcGF0Y2hlciBpc24ndCB5ZXQgbG9hZGVkLlxuICAgICAgZXZlbnRJbmZvTGliLnNldElzUmVwbGF5KGV2ZW50SW5mbywgdHJ1ZSk7XG4gICAgICB0aGlzLnF1ZXVlZEV2ZW50SW5mb3M/LnB1c2goZXZlbnRJbmZvKTtcbiAgICB9XG4gICAgaWYgKFxuICAgICAgRXZlbnRDb250cmFjdC5DVVNUT01fRVZFTlRfU1VQUE9SVCAmJlxuICAgICAgZXZlbnRJbmZvTGliLmdldEV2ZW50VHlwZShldmVudEluZm8pID09PSBFdmVudFR5cGUuQ1VTVE9NXG4gICAgKSB7XG4gICAgICBjb25zdCBkZXRhaWwgPSAoZXZlbnRJbmZvTGliLmdldEV2ZW50KGV2ZW50SW5mbykgYXMgQ3VzdG9tRXZlbnQpLmRldGFpbDtcbiAgICAgIC8vIEZvciBjdXN0b20gZXZlbnRzLCB1c2UgYSBzZWNvbmRhcnkgZGlzcGF0Y2ggYmFzZWQgb24gdGhlIGludGVybmFsXG4gICAgICAvLyBjdXN0b20gdHlwZSBvZiB0aGUgZXZlbnQuXG4gICAgICBpZiAoIWRldGFpbCB8fCAhZGV0YWlsWydfdHlwZSddKSB7XG4gICAgICAgIC8vIFRoaXMgc2hvdWxkIG5ldmVyIGhhcHBlbi5cbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgZXZlbnRJbmZvTGliLnNldEV2ZW50VHlwZShldmVudEluZm8sIGRldGFpbFsnX3R5cGUnXSk7XG4gICAgfVxuXG4gICAgdGhpcy5wb3B1bGF0ZUFjdGlvbihldmVudEluZm8pO1xuXG4gICAgaWYgKFxuICAgICAgdGhpcy5kaXNwYXRjaGVyICYmXG4gICAgICAhZXZlbnRJbmZvTGliLmdldEV2ZW50KGV2ZW50SW5mbylbQWNjZXNzaWJpbGl0eUF0dHJpYnV0ZS5TS0lQX0dMT0JBTF9ESVNQQVRDSF1cbiAgICApIHtcbiAgICAgIGNvbnN0IGdsb2JhbEV2ZW50SW5mbzogZXZlbnRJbmZvTGliLkV2ZW50SW5mbyA9IGV2ZW50SW5mb0xpYi5jbG9uZUV2ZW50SW5mbyhldmVudEluZm8pO1xuXG4gICAgICAvLyBJbiBzb21lIGNhc2VzLCBgcG9wdWxhdGVBY3Rpb25gIHdpbGwgcmV3cml0ZSBgY2xpY2tgIGV2ZW50cyB0b1xuICAgICAgLy8gYGNsaWNrb25seWAuIFJldmVydCBiYWNrIHRvIGEgcmVndWxhciBjbGljaywgb3RoZXJ3aXNlIHdlIHdvbid0IGJlIGFibGVcbiAgICAgIC8vIHRvIGV4ZWN1dGUgZ2xvYmFsIGV2ZW50IGhhbmRsZXJzIHJlZ2lzdGVyZWQgb24gY2xpY2sgZXZlbnRzLlxuICAgICAgaWYgKGV2ZW50SW5mb0xpYi5nZXRFdmVudFR5cGUoZ2xvYmFsRXZlbnRJbmZvKSA9PT0gRXZlbnRUeXBlLkNMSUNLT05MWSkge1xuICAgICAgICBldmVudEluZm9MaWIuc2V0RXZlbnRUeXBlKGdsb2JhbEV2ZW50SW5mbywgRXZlbnRUeXBlLkNMSUNLKTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5kaXNwYXRjaGVyKGdsb2JhbEV2ZW50SW5mbywgLyogZGlzcGF0Y2ggZ2xvYmFsIGV2ZW50ICovIHRydWUpO1xuICAgIH1cblxuICAgIGNvbnN0IGFjdGlvbiA9IGV2ZW50SW5mb0xpYi5nZXRBY3Rpb24oZXZlbnRJbmZvKTtcbiAgICBpZiAoIWFjdGlvbiAmJiAhY2hlY2tEaXNwYXRjaGVyRm9yQTExeUNsaWNrKGV2ZW50SW5mbykpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBsZXQgc3RvcFByb3BhZ2F0aW9uQWZ0ZXJEaXNwYXRjaCA9IGZhbHNlO1xuICAgIGlmIChcbiAgICAgIHRoaXMuc3RvcFByb3BhZ2F0aW9uICYmXG4gICAgICBldmVudEluZm9MaWIuZ2V0RXZlbnRUeXBlKGV2ZW50SW5mbykgIT09IEFjY2Vzc2liaWxpdHlBdHRyaWJ1dGUuTUFZQkVfQ0xJQ0tfRVZFTlRfVFlQRVxuICAgICkge1xuICAgICAgaWYgKFxuICAgICAgICBldmVudExpYi5pc0dlY2tvICYmXG4gICAgICAgIChldmVudEluZm9MaWIuZ2V0VGFyZ2V0RWxlbWVudChldmVudEluZm8pLnRhZ05hbWUgPT09ICdJTlBVVCcgfHxcbiAgICAgICAgICBldmVudEluZm9MaWIuZ2V0VGFyZ2V0RWxlbWVudChldmVudEluZm8pLnRhZ05hbWUgPT09ICdURVhUQVJFQScpICYmXG4gICAgICAgIGV2ZW50SW5mb0xpYi5nZXRFdmVudFR5cGUoZXZlbnRJbmZvKSA9PT0gRXZlbnRUeXBlLkZPQ1VTXG4gICAgICApIHtcbiAgICAgICAgLy8gRG8gbm90aGluZyBzaW5jZSBzdG9wcGluZyBwcm9wYWdhdGlvbiBhIGZvY3VzIGV2ZW50IG9uIGFuIGlucHV0XG4gICAgICAgIC8vIGVsZW1lbnQgaW4gRmlyZWZveCBtYWtlcyB0aGUgdGV4dCBjdXJzb3IgZGlzYXBwZWFyOlxuICAgICAgICAvLyBodHRwczovL2J1Z3ppbGxhLm1vemlsbGEub3JnL3Nob3dfYnVnLmNnaT9pZD01MDk2ODRcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIFNpbmNlIHdlIGZvdW5kIGEganNhY3Rpb24sIHByZXZlbnQgb3RoZXIgaGFuZGxlcnMgZnJvbSBzZWVpbmdcbiAgICAgICAgLy8gdGhpcyBldmVudC5cbiAgICAgICAgZXZlbnRMaWIuc3RvcFByb3BhZ2F0aW9uKGV2ZW50SW5mb0xpYi5nZXRFdmVudChldmVudEluZm8pKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKFxuICAgICAgdGhpcy5zdG9wUHJvcGFnYXRpb24gJiZcbiAgICAgIGV2ZW50SW5mb0xpYi5nZXRFdmVudFR5cGUoZXZlbnRJbmZvKSA9PT0gQWNjZXNzaWJpbGl0eUF0dHJpYnV0ZS5NQVlCRV9DTElDS19FVkVOVF9UWVBFXG4gICAgKSB7XG4gICAgICAvLyBXZSBmaXJzdCBuZWVkIHRvIGxldCB0aGUgZGlzcGF0Y2hlciBkZXRlcm1pbmUgd2hldGhlciB3ZSBjYW4gdHJlYXRcbiAgICAgIC8vIHRoaXMgZXZlbnQgYXMgYSBjbGljayBldmVudC5cbiAgICAgIHN0b3BQcm9wYWdhdGlvbkFmdGVyRGlzcGF0Y2ggPSB0cnVlO1xuICAgIH1cblxuICAgIGlmICh0aGlzLmRpc3BhdGNoZXIpIHtcbiAgICAgIGlmIChcbiAgICAgICAgYWN0aW9uICYmXG4gICAgICAgIHNob3VsZFByZXZlbnREZWZhdWx0QmVmb3JlRGlzcGF0Y2hpbmcoZXZlbnRJbmZvTGliLmdldEFjdGlvbkVsZW1lbnQoYWN0aW9uKSwgZXZlbnRJbmZvKVxuICAgICAgKSB7XG4gICAgICAgIGV2ZW50TGliLnByZXZlbnREZWZhdWx0KGV2ZW50SW5mb0xpYi5nZXRFdmVudChldmVudEluZm8pKTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgdW5yZXNvbHZlZEV2ZW50SW5mbyA9IHRoaXMuZGlzcGF0Y2hlcihldmVudEluZm8pO1xuICAgICAgaWYgKHVucmVzb2x2ZWRFdmVudEluZm8gJiYgYWxsb3dSZWhhbmRsaW5nKSB7XG4gICAgICAgIC8vIFRoZSBkaXNwYXRjaGVyIG9ubHkgcmV0dXJucyBhbiBldmVudCBmb3IgTUFZQkVfQ0xJQ0tfRVZFTlRfVFlQRVxuICAgICAgICAvLyBldmVudHMgdGhhdCBjYW4ndCBiZSBjYXN0ZWQgdG8gYSBjbGljay4gV2UgcnVuIGl0IHRocm91Z2ggdGhlXG4gICAgICAgIC8vIGhhbmRsZXIgYWdhaW4gdG8gZmluZCBrZXlkb3duIGFjdGlvbnMgZm9yIGl0LlxuICAgICAgICB0aGlzLmhhbmRsZUV2ZW50SW5mbyh1bnJlc29sdmVkRXZlbnRJbmZvLCAvKiBhbGxvd1JlaGFuZGxpbmc9ICovIGZhbHNlKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgaWYgKHN0b3BQcm9wYWdhdGlvbkFmdGVyRGlzcGF0Y2gpIHtcbiAgICAgICAgZXZlbnRMaWIuc3RvcFByb3BhZ2F0aW9uKGV2ZW50SW5mb0xpYi5nZXRFdmVudChldmVudEluZm8pKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogU2VhcmNoZXMgZm9yIGEganNhY3Rpb24gdGhhdCB0aGUgRE9NIGV2ZW50IG1hcHMgdG8gYW5kIGNyZWF0ZXMgYW5cbiAgICogb2JqZWN0IGNvbnRhaW5pbmcgZXZlbnQgaW5mb3JtYXRpb24gdXNlZCBmb3IgZGlzcGF0Y2hpbmcgYnlcbiAgICoganNhY3Rpb24uRGlzcGF0Y2hlci4gVGhpcyBtZXRob2QgcG9wdWxhdGVzIHRoZSBgYWN0aW9uYCBhbmQgYGFjdGlvbkVsZW1lbnRgXG4gICAqIGZpZWxkcyBvZiB0aGUgRXZlbnRJbmZvIG9iamVjdCBwYXNzZWQgaW4gYnkgZmluZGluZyB0aGUgZmlyc3RcbiAgICoganNhY3Rpb24gYXR0cmlidXRlIGFib3ZlIHRoZSB0YXJnZXQgTm9kZSBvZiB0aGUgZXZlbnQsIGFuZCBiZWxvd1xuICAgKiB0aGUgY29udGFpbmVyIE5vZGUsIHRoYXQgc3BlY2lmaWVzIGEganNhY3Rpb24gZm9yIHRoZSBldmVudFxuICAgKiB0eXBlLiBJZiBubyBzdWNoIGpzYWN0aW9uIGlzIGZvdW5kLCB0aGVuIGFjdGlvbiBpcyB1bmRlZmluZWQuXG4gICAqXG4gICAqIEBwYXJhbSBldmVudEluZm8gYEV2ZW50SW5mb2AgdG8gc2V0IGBhY3Rpb25gIGFuZCBgYWN0aW9uRWxlbWVudGAgaWYgYW5cbiAgICogICAgYWN0aW9uIGlzIGZvdW5kIG9uIGFueSBgRWxlbWVudGAgaW4gdGhlIHBhdGggb2YgdGhlIGBFdmVudGAuXG4gICAqL1xuICBwcml2YXRlIHBvcHVsYXRlQWN0aW9uKGV2ZW50SW5mbzogZXZlbnRJbmZvTGliLkV2ZW50SW5mbykge1xuICAgIC8vIFdlIGRpc3Rpbmd1aXNoIG1vZGlmaWVkIGFuZCBwbGFpbiBjbGlja3MgaW4gb3JkZXIgdG8gc3VwcG9ydCB0aGVcbiAgICAvLyBkZWZhdWx0IGJyb3dzZXIgYmVoYXZpb3Igb2YgbW9kaWZpZWQgY2xpY2tzIG9uIGxpbmtzOyB1c3VhbGx5IHRvXG4gICAgLy8gb3BlbiB0aGUgVVJMIG9mIHRoZSBsaW5rIGluIG5ldyB0YWIgb3IgbmV3IHdpbmRvdyBvbiBjdHJsL2NtZFxuICAgIC8vIGNsaWNrLiBBIERPTSAnY2xpY2snIGV2ZW50IGlzIG1hcHBlZCB0byB0aGUganNhY3Rpb24gJ2NsaWNrJ1xuICAgIC8vIGV2ZW50IGlmZiB0aGVyZSBpcyBubyBtb2RpZmllciBwcmVzZW50IG9uIHRoZSBldmVudC4gSWYgdGhlcmUgaXNcbiAgICAvLyBhIG1vZGlmaWVyLCBpdCdzIG1hcHBlZCB0byAnY2xpY2ttb2QnIGluc3RlYWQuXG4gICAgLy9cbiAgICAvLyBJdCdzIGFsbG93ZWQgdG8gb21pdCB0aGUgZXZlbnQgaW4gdGhlIGpzYWN0aW9uIGF0dHJpYnV0ZS4gSW4gdGhhdFxuICAgIC8vIGNhc2UsICdjbGljaycgaXMgYXNzdW1lZC4gVGh1cyB0aGUgZm9sbG93aW5nIHR3byBhcmUgZXF1aXZhbGVudDpcbiAgICAvL1xuICAgIC8vICAgPGEgaHJlZj1cInNvbWV1cmxcIiBqc2FjdGlvbj1cImduYS5mdVwiPlxuICAgIC8vICAgPGEgaHJlZj1cInNvbWV1cmxcIiBqc2FjdGlvbj1cImNsaWNrOmduYS5mdVwiPlxuICAgIC8vXG4gICAgLy8gRm9yIHVubW9kaWZpZWQgY2xpY2tzLCBFdmVudENvbnRyYWN0IGludm9rZXMgdGhlIGpzYWN0aW9uXG4gICAgLy8gJ2duYS5mdScuIEZvciBtb2RpZmllZCBjbGlja3MsIEV2ZW50Q29udHJhY3Qgd29uJ3QgZmluZCBhXG4gICAgLy8gc3VpdGFibGUgYWN0aW9uIGFuZCBsZWF2ZSB0aGUgZXZlbnQgdG8gYmUgaGFuZGxlZCBieSB0aGVcbiAgICAvLyBicm93c2VyLlxuICAgIC8vXG4gICAgLy8gSW4gb3JkZXIgdG8gYWxzbyBpbnZva2UgYSBqc2FjdGlvbiBoYW5kbGVyIGZvciBhIG1vZGlmaWVyIGNsaWNrLFxuICAgIC8vICdjbGlja21vZCcgbmVlZHMgdG8gYmUgdXNlZDpcbiAgICAvL1xuICAgIC8vICAgPGEgaHJlZj1cInNvbWV1cmxcIiBqc2FjdGlvbj1cImNsaWNrbW9kOmduYS5mdVwiPlxuICAgIC8vXG4gICAgLy8gRXZlbnRDb250cmFjdCBpbnZva2VzIHRoZSBqc2FjdGlvbiAnZ25hLmZ1JyBmb3IgbW9kaWZpZWRcbiAgICAvLyBjbGlja3MuIFVubW9kaWZpZWQgY2xpY2tzIGFyZSBsZWZ0IHRvIHRoZSBicm93c2VyLlxuICAgIC8vXG4gICAgLy8gSW4gb3JkZXIgdG8gc2V0IHVwIHRoZSBldmVudCBjb250cmFjdCB0byBoYW5kbGUgYm90aCBjbGlja29ubHkgYW5kXG4gICAgLy8gY2xpY2ttb2QsIG9ubHkgYWRkRXZlbnQoRXZlbnRUeXBlLkNMSUNLKSBpcyBuZWNlc3NhcnkuXG4gICAgLy9cbiAgICAvLyBJbiBvcmRlciB0byBzZXQgdXAgdGhlIGV2ZW50IGNvbnRyYWN0IHRvIGhhbmRsZSBjbGljayxcbiAgICAvLyBhZGRFdmVudCgpIGlzIG5lY2Vzc2FyeSBmb3IgQ0xJQ0ssIEtFWURPV04sIGFuZCBLRVlQUkVTUyBldmVudCB0eXBlcy4gIElmXG4gICAgLy8gYTExeSBjbGljayBzdXBwb3J0IGlzIGVuYWJsZWQsIGFkZEV2ZW50KCkgd2lsbCBzZXQgdXAgdGhlIGFwcHJvcHJpYXRlIGtleVxuICAgIC8vIGV2ZW50IGhhbmRsZXIgYXV0b21hdGljYWxseS5cbiAgICBpZiAoXG4gICAgICBldmVudEluZm9MaWIuZ2V0RXZlbnRUeXBlKGV2ZW50SW5mbykgPT09IEV2ZW50VHlwZS5DTElDSyAmJlxuICAgICAgZXZlbnRMaWIuaXNNb2RpZmllZENsaWNrRXZlbnQoZXZlbnRJbmZvTGliLmdldEV2ZW50KGV2ZW50SW5mbykpXG4gICAgKSB7XG4gICAgICBldmVudEluZm9MaWIuc2V0RXZlbnRUeXBlKGV2ZW50SW5mbywgRXZlbnRUeXBlLkNMSUNLTU9EKTtcbiAgICB9IGVsc2UgaWYgKHRoaXMuaGFzQTExeUNsaWNrU3VwcG9ydCkge1xuICAgICAgdGhpcy51cGRhdGVFdmVudEluZm9Gb3JBMTF5Q2xpY2shKGV2ZW50SW5mbyk7XG4gICAgfSBlbHNlIGlmIChcbiAgICAgIEV2ZW50Q29udHJhY3QuQTExWV9TVVBQT1JUX0lOX0RJU1BBVENIRVIgJiZcbiAgICAgIGV2ZW50SW5mb0xpYi5nZXRFdmVudFR5cGUoZXZlbnRJbmZvKSA9PT0gRXZlbnRUeXBlLktFWURPV04gJiZcbiAgICAgICFldmVudEluZm9MaWIuZ2V0RXZlbnQoZXZlbnRJbmZvKVtBY2Nlc3NpYmlsaXR5QXR0cmlidXRlLlNLSVBfQTExWV9DSEVDS11cbiAgICApIHtcbiAgICAgIC8vIFdlIHVzZSBhIHN0cmluZyBsaXRlcmFsIGFzIHRoaXMgdmFsdWUgbmVlZHMgdG8gYmUgcmVmZXJlbmNlZCBpbiB0aGVcbiAgICAgIC8vIGRpc3BhdGNoZXIncyBiaW5hcnkuXG4gICAgICBldmVudEluZm9MaWIuc2V0RXZlbnRUeXBlKGV2ZW50SW5mbywgQWNjZXNzaWJpbGl0eUF0dHJpYnV0ZS5NQVlCRV9DTElDS19FVkVOVF9UWVBFKTtcbiAgICB9XG5cbiAgICAvLyBXYWxrIHRvIHRoZSBwYXJlbnQgbm9kZSwgdW5sZXNzIHRoZSBub2RlIGhhcyBhIGRpZmZlcmVudCBvd25lciBpblxuICAgIC8vIHdoaWNoIGNhc2Ugd2Ugd2FsayB0byB0aGUgb3duZXIuIEF0dGVtcHQgdG8gd2FsayB0byBob3N0IG9mIGFcbiAgICAvLyBzaGFkb3cgcm9vdCBpZiBuZWVkZWQuXG4gICAgbGV0IGFjdGlvbkVsZW1lbnQ6IEVsZW1lbnQgfCBudWxsID0gZXZlbnRJbmZvTGliLmdldFRhcmdldEVsZW1lbnQoZXZlbnRJbmZvKTtcbiAgICB3aGlsZSAoYWN0aW9uRWxlbWVudCAmJiBhY3Rpb25FbGVtZW50ICE9PSBldmVudEluZm9MaWIuZ2V0Q29udGFpbmVyKGV2ZW50SW5mbykpIHtcbiAgICAgIHRoaXMucG9wdWxhdGVBY3Rpb25PbkVsZW1lbnQoYWN0aW9uRWxlbWVudCwgZXZlbnRJbmZvKTtcblxuICAgICAgaWYgKGV2ZW50SW5mb0xpYi5nZXRBY3Rpb24oZXZlbnRJbmZvKSkge1xuICAgICAgICAvLyBBbiBldmVudCBpcyBoYW5kbGVkIGJ5IGF0IG1vc3Qgb25lIGpzYWN0aW9uLiBUaHVzIHdlIHN0b3AgYXQgdGhlXG4gICAgICAgIC8vIGZpcnN0IG1hdGNoaW5nIGpzYWN0aW9uIHNwZWNpZmllZCBpbiBhIGpzYWN0aW9uIGF0dHJpYnV0ZSB1cCB0aGVcbiAgICAgICAgLy8gYW5jZXN0b3IgY2hhaW4gb2YgdGhlIGV2ZW50IHRhcmdldCBub2RlLlxuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGlmIChhY3Rpb25FbGVtZW50W1Byb3BlcnR5Lk9XTkVSXSkge1xuICAgICAgICBhY3Rpb25FbGVtZW50ID0gYWN0aW9uRWxlbWVudFtQcm9wZXJ0eS5PV05FUl0gYXMgRWxlbWVudDtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBpZiAoYWN0aW9uRWxlbWVudC5wYXJlbnROb2RlPy5ub2RlTmFtZSAhPT0gJyNkb2N1bWVudC1mcmFnbWVudCcpIHtcbiAgICAgICAgYWN0aW9uRWxlbWVudCA9IGFjdGlvbkVsZW1lbnQucGFyZW50Tm9kZSBhcyBFbGVtZW50IHwgbnVsbDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGFjdGlvbkVsZW1lbnQgPSAoYWN0aW9uRWxlbWVudC5wYXJlbnROb2RlIGFzIFNoYWRvd1Jvb3QgfCBudWxsKT8uaG9zdCA/PyBudWxsO1xuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IGFjdGlvbiA9IGV2ZW50SW5mb0xpYi5nZXRBY3Rpb24oZXZlbnRJbmZvKTtcbiAgICBpZiAoIWFjdGlvbikge1xuICAgICAgLy8gTm8gYWN0aW9uIGZvdW5kLlxuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICh0aGlzLmhhc0ExMXlDbGlja1N1cHBvcnQpIHtcbiAgICAgIHRoaXMucHJldmVudERlZmF1bHRGb3JBMTF5Q2xpY2shKGV2ZW50SW5mbyk7XG4gICAgfVxuXG4gICAgLy8gV2UgYXR0ZW1wdCB0byBoYW5kbGUgdGhlIG1vdXNlZW50ZXIvbW91c2VsZWF2ZSBldmVudHMgaGVyZSBieVxuICAgIC8vIGRldGVjdGluZyB3aGV0aGVyIHRoZSBtb3VzZW92ZXIvbW91c2VvdXQgZXZlbnRzIGNvcnJlc3BvbmQgdG9cbiAgICAvLyBlbnRlcmluZy9sZWF2aW5nIGFuIGVsZW1lbnQuXG4gICAgaWYgKFxuICAgICAgRXZlbnRDb250cmFjdC5NT1VTRV9TUEVDSUFMX1NVUFBPUlQgJiZcbiAgICAgIChldmVudEluZm9MaWIuZ2V0RXZlbnRUeXBlKGV2ZW50SW5mbykgPT09IEV2ZW50VHlwZS5NT1VTRUVOVEVSIHx8XG4gICAgICAgIGV2ZW50SW5mb0xpYi5nZXRFdmVudFR5cGUoZXZlbnRJbmZvKSA9PT0gRXZlbnRUeXBlLk1PVVNFTEVBVkUgfHxcbiAgICAgICAgZXZlbnRJbmZvTGliLmdldEV2ZW50VHlwZShldmVudEluZm8pID09PSBFdmVudFR5cGUuUE9JTlRFUkVOVEVSIHx8XG4gICAgICAgIGV2ZW50SW5mb0xpYi5nZXRFdmVudFR5cGUoZXZlbnRJbmZvKSA9PT0gRXZlbnRUeXBlLlBPSU5URVJMRUFWRSlcbiAgICApIHtcbiAgICAgIC8vIFdlIGF0dGVtcHQgdG8gaGFuZGxlIHRoZSBtb3VzZWVudGVyL21vdXNlbGVhdmUgZXZlbnRzIGhlcmUgYnlcbiAgICAgIC8vIGRldGVjdGluZyB3aGV0aGVyIHRoZSBtb3VzZW92ZXIvbW91c2VvdXQgZXZlbnRzIGNvcnJlc3BvbmQgdG9cbiAgICAgIC8vIGVudGVyaW5nL2xlYXZpbmcgYW4gZWxlbWVudC5cbiAgICAgIGlmIChcbiAgICAgICAgZXZlbnRMaWIuaXNNb3VzZVNwZWNpYWxFdmVudChcbiAgICAgICAgICBldmVudEluZm9MaWIuZ2V0RXZlbnQoZXZlbnRJbmZvKSxcbiAgICAgICAgICBldmVudEluZm9MaWIuZ2V0RXZlbnRUeXBlKGV2ZW50SW5mbyksXG4gICAgICAgICAgZXZlbnRJbmZvTGliLmdldEFjdGlvbkVsZW1lbnQoYWN0aW9uKSxcbiAgICAgICAgKVxuICAgICAgKSB7XG4gICAgICAgIC8vIElmIGJvdGggbW91c2VvdmVyL21vdXNlb3V0IGFuZCBtb3VzZWVudGVyL21vdXNlbGVhdmUgZXZlbnRzIGFyZVxuICAgICAgICAvLyBlbmFibGVkLCB0d28gc2VwYXJhdGUgaGFuZGxlcnMgZm9yIG1vdXNlb3Zlci9tb3VzZW91dCBhcmVcbiAgICAgICAgLy8gcmVnaXN0ZXJlZC4gQm90aCBoYW5kbGVycyB3aWxsIHNlZSB0aGUgc2FtZSBldmVudCBpbnN0YW5jZVxuICAgICAgICAvLyBzbyB3ZSBjcmVhdGUgYSBjb3B5IHRvIGF2b2lkIGludGVyZmVyaW5nIHdpdGggdGhlIGRpc3BhdGNoaW5nIG9mXG4gICAgICAgIC8vIHRoZSBtb3VzZW92ZXIvbW91c2VvdXQgZXZlbnQuXG4gICAgICAgIGNvbnN0IGNvcGllZEV2ZW50ID0gZXZlbnRMaWIuY3JlYXRlTW91c2VTcGVjaWFsRXZlbnQoXG4gICAgICAgICAgZXZlbnRJbmZvTGliLmdldEV2ZW50KGV2ZW50SW5mbyksXG4gICAgICAgICAgZXZlbnRJbmZvTGliLmdldEFjdGlvbkVsZW1lbnQoYWN0aW9uKSxcbiAgICAgICAgKTtcbiAgICAgICAgZXZlbnRJbmZvTGliLnNldEV2ZW50KGV2ZW50SW5mbywgY29waWVkRXZlbnQpO1xuICAgICAgICAvLyBTaW5jZSB0aGUgbW91c2VlbnRlci9tb3VzZWxlYXZlIGV2ZW50cyBkbyBub3QgYnViYmxlLCB0aGUgdGFyZ2V0XG4gICAgICAgIC8vIG9mIHRoZSBldmVudCBpcyB0ZWNobmljYWxseSB0aGUgYGFjdGlvbkVsZW1lbnRgICh0aGUgbm9kZSB3aXRoIHRoZVxuICAgICAgICAvLyBganNhY3Rpb25gIGF0dHJpYnV0ZSlcbiAgICAgICAgZXZlbnRJbmZvTGliLnNldFRhcmdldEVsZW1lbnQoZXZlbnRJbmZvLCBldmVudEluZm9MaWIuZ2V0QWN0aW9uRWxlbWVudChhY3Rpb24pKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGV2ZW50SW5mb0xpYi51bnNldEFjdGlvbihldmVudEluZm8pO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBBY2Nlc3NlcyB0aGUganNhY3Rpb24gbWFwIG9uIGEgbm9kZSBhbmQgcmV0cmlldmVzIHRoZSBuYW1lIG9mIHRoZVxuICAgKiBhY3Rpb24gdGhlIGdpdmVuIGV2ZW50IGlzIG1hcHBlZCB0bywgaWYgYW55LiBJdCBwYXJzZXMgdGhlXG4gICAqIGF0dHJpYnV0ZSB2YWx1ZSBhbmQgc3RvcmVzIGl0IGluIGEgcHJvcGVydHkgb24gdGhlIG5vZGUgZm9yXG4gICAqIHN1YnNlcXVlbnQgcmV0cmlldmFsIHdpdGhvdXQgcmUtcGFyc2luZyBhbmQgcmUtYWNjZXNzaW5nIHRoZVxuICAgKiBhdHRyaWJ1dGUuIEluIG9yZGVyIHRvIGZ1bGx5IHF1YWxpZnkganNhY3Rpb24gbmFtZXMgdXNpbmcgYVxuICAgKiBuYW1lc3BhY2UsIHRoZSBET00gaXMgc2VhcmNoZWQgc3RhcnRpbmcgYXQgdGhlIGN1cnJlbnQgbm9kZSBhbmRcbiAgICogZ29pbmcgdGhyb3VnaCBhbmNlc3RvciBub2RlcyB1bnRpbCBhIGpzbmFtZXNwYWNlIGF0dHJpYnV0ZSBpc1xuICAgKiBmb3VuZC5cbiAgICpcbiAgICogQHBhcmFtIGFjdGlvbkVsZW1lbnQgVGhlIERPTSBub2RlIHRvIHJldHJpZXZlIHRoZSBqc2FjdGlvbiBtYXAgZnJvbS5cbiAgICogQHBhcmFtIGV2ZW50SW5mbyBgRXZlbnRJbmZvYCB0byBzZXQgYGFjdGlvbmAgYW5kIGBhY3Rpb25FbGVtZW50YCBpZiBhblxuICAgKiAgICBhY3Rpb24gaXMgZm91bmQgb24gdGhlIGBhY3Rpb25FbGVtZW50YC5cbiAgICovXG4gIHByaXZhdGUgcG9wdWxhdGVBY3Rpb25PbkVsZW1lbnQoYWN0aW9uRWxlbWVudDogRWxlbWVudCwgZXZlbnRJbmZvOiBldmVudEluZm9MaWIuRXZlbnRJbmZvKSB7XG4gICAgY29uc3QgYWN0aW9uTWFwID0gcGFyc2VBY3Rpb25zKGFjdGlvbkVsZW1lbnQsIGV2ZW50SW5mb0xpYi5nZXRDb250YWluZXIoZXZlbnRJbmZvKSk7XG5cbiAgICBjb25zdCBhY3Rpb25OYW1lID0gYWN0aW9uTWFwW2V2ZW50SW5mb0xpYi5nZXRFdmVudFR5cGUoZXZlbnRJbmZvKV07XG4gICAgaWYgKGFjdGlvbk5hbWUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgZXZlbnRJbmZvTGliLnNldEFjdGlvbihldmVudEluZm8sIGFjdGlvbk5hbWUsIGFjdGlvbkVsZW1lbnQpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLmhhc0ExMXlDbGlja1N1cHBvcnQpIHtcbiAgICAgIHRoaXMucG9wdWxhdGVDbGlja09ubHlBY3Rpb24hKGFjdGlvbkVsZW1lbnQsIGV2ZW50SW5mbywgYWN0aW9uTWFwKTtcbiAgICB9XG4gICAgaWYgKEV2ZW50Q29udHJhY3QuQTExWV9TVVBQT1JUX0lOX0RJU1BBVENIRVIpIHtcbiAgICAgIGlmIChcbiAgICAgICAgZXZlbnRJbmZvTGliLmdldEV2ZW50VHlwZShldmVudEluZm8pID09PSBBY2Nlc3NpYmlsaXR5QXR0cmlidXRlLk1BWUJFX0NMSUNLX0VWRU5UX1RZUEUgJiZcbiAgICAgICAgYWN0aW9uTWFwW0V2ZW50VHlwZS5DTElDS10gIT09IHVuZGVmaW5lZFxuICAgICAgKSB7XG4gICAgICAgIC8vIFdlJ2xsIHRha2UgdGhlIGZpcnN0IENMSUNLIGFjdGlvbiB3ZSBmaW5kIGFuZCBoYXZlIHRoZSBkaXNwYXRjaGVyXG4gICAgICAgIC8vIGNoZWNrIGlmIHRoZSBrZXlkb3duIGV2ZW50IGNhbiBiZSB1c2VkIGFzIGEgQ0xJQ0suIElmIG5vdCwgdGhlXG4gICAgICAgIC8vIGRpc3BhdGNoZXIgd2lsbCByZXRyaWdnZXIgdGhlIGV2ZW50IHNvIHRoYXQgd2UgY2FuIGZpbmQgYSBrZXlkb3duXG4gICAgICAgIC8vIGV2ZW50IGluc3RlYWQuXG4gICAgICAgIC8vIFdoZW4gd2UgZ2V0IE1BWUJFX0NMSUNLX0VWRU5UX1RZUEUgYXMgYW4gZXZlbnRUeXBlLCB3ZSB3YW50IHRvXG4gICAgICAgIC8vIHJldHJpZXZlIHRoZSBhY3Rpb24gY29ycmVzcG9uZGluZyB0byBDTElDSywgYnV0IHN0aWxsIGtlZXAgdGhlXG4gICAgICAgIC8vIGV2ZW50SW5mb0xpYi5nZXRFdmVudFR5cGUoZXZlbnRJbmZvLCApIGFzIE1BWUJFX0NMSUNLX0VWRU5UX1RZUEUuIFRoZVxuICAgICAgICAvLyBkaXNwYXRjaGVyIHVzZXMgdGhpcyBldmVudCB0eXBlIHRvIGRldGVybWluZSBpZiBpdCBzaG91bGQgZ2V0IHRoZVxuICAgICAgICAvLyBoYW5kbGVyIGZvciB0aGUgYWN0aW9uLlxuICAgICAgICBldmVudEluZm9MaWIuc2V0QWN0aW9uKGV2ZW50SW5mbywgYWN0aW9uTWFwW0V2ZW50VHlwZS5DTElDS10sIGFjdGlvbkVsZW1lbnQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYTExeUNsaWNrTGliLnBvcHVsYXRlQ2xpY2tPbmx5QWN0aW9uKGFjdGlvbkVsZW1lbnQsIGV2ZW50SW5mbywgYWN0aW9uTWFwKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogRW5hYmxlcyBqc2FjdGlvbiBoYW5kbGVycyB0byBiZSBjYWxsZWQgZm9yIHRoZSBldmVudCB0eXBlIGdpdmVuIGJ5XG4gICAqIG5hbWUuXG4gICAqXG4gICAqIElmIHRoZSBldmVudCBpcyBhbHJlYWR5IHJlZ2lzdGVyZWQsIHRoaXMgZG9lcyBub3RoaW5nLlxuICAgKlxuICAgKiBAcGFyYW0gcHJlZml4ZWRFdmVudFR5cGUgSWYgc3VwcGxpZWQsIHRoaXMgZXZlbnQgaXMgdXNlZCBpblxuICAgKiAgICAgdGhlIGFjdHVhbCBicm93c2VyIGV2ZW50IHJlZ2lzdHJhdGlvbiBpbnN0ZWFkIG9mIHRoZSBuYW1lIHRoYXQgaXNcbiAgICogICAgIGV4cG9zZWQgdG8ganNhY3Rpb24uIFVzZSB0aGlzIGlmIHlvdSBlLmcuIHdhbnQgdXNlcnMgdG8gYmUgYWJsZVxuICAgKiAgICAgdG8gc3Vic2NyaWJlIHRvIGpzYWN0aW9uPVwidHJhbnNpdGlvbkVuZDpmb29cIiB3aGlsZSB0aGUgdW5kZXJseWluZ1xuICAgKiAgICAgZXZlbnQgaXMgd2Via2l0VHJhbnNpdGlvbkVuZCBpbiBvbmUgYnJvd3NlciBhbmQgbW96VHJhbnNpdGlvbkVuZFxuICAgKiAgICAgaW4gYW5vdGhlci5cbiAgICovXG4gIGFkZEV2ZW50KGV2ZW50VHlwZTogc3RyaW5nLCBwcmVmaXhlZEV2ZW50VHlwZT86IHN0cmluZykge1xuICAgIGlmIChldmVudFR5cGUgaW4gdGhpcy5ldmVudEhhbmRsZXJzIHx8ICF0aGlzLmNvbnRhaW5lck1hbmFnZXIpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoXG4gICAgICAhRXZlbnRDb250cmFjdC5NT1VTRV9TUEVDSUFMX1NVUFBPUlQgJiZcbiAgICAgIChldmVudFR5cGUgPT09IEV2ZW50VHlwZS5NT1VTRUVOVEVSIHx8XG4gICAgICAgIGV2ZW50VHlwZSA9PT0gRXZlbnRUeXBlLk1PVVNFTEVBVkUgfHxcbiAgICAgICAgZXZlbnRUeXBlID09PSBFdmVudFR5cGUuUE9JTlRFUkVOVEVSIHx8XG4gICAgICAgIGV2ZW50VHlwZSA9PT0gRXZlbnRUeXBlLlBPSU5URVJMRUFWRSlcbiAgICApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBldmVudEhhbmRsZXIgPSAoZXZlbnRUeXBlOiBzdHJpbmcsIGV2ZW50OiBFdmVudCwgY29udGFpbmVyOiBFbGVtZW50KSA9PiB7XG4gICAgICB0aGlzLmhhbmRsZUV2ZW50KGV2ZW50VHlwZSwgZXZlbnQsIGNvbnRhaW5lcik7XG4gICAgfTtcblxuICAgIC8vIFN0b3JlIHRoZSBjYWxsYmFjayB0byBhbGxvdyB1cyB0byByZXBsYXkgZXZlbnRzLlxuICAgIHRoaXMuZXZlbnRIYW5kbGVyc1tldmVudFR5cGVdID0gZXZlbnRIYW5kbGVyO1xuXG4gICAgY29uc3QgYnJvd3NlckV2ZW50VHlwZSA9IGV2ZW50TGliLmdldEJyb3dzZXJFdmVudFR5cGUocHJlZml4ZWRFdmVudFR5cGUgfHwgZXZlbnRUeXBlKTtcblxuICAgIGlmIChicm93c2VyRXZlbnRUeXBlICE9PSBldmVudFR5cGUpIHtcbiAgICAgIGNvbnN0IGV2ZW50VHlwZXMgPSB0aGlzLmJyb3dzZXJFdmVudFR5cGVUb0V4dHJhRXZlbnRUeXBlc1ticm93c2VyRXZlbnRUeXBlXSB8fCBbXTtcbiAgICAgIGV2ZW50VHlwZXMucHVzaChldmVudFR5cGUpO1xuICAgICAgdGhpcy5icm93c2VyRXZlbnRUeXBlVG9FeHRyYUV2ZW50VHlwZXNbYnJvd3NlckV2ZW50VHlwZV0gPSBldmVudFR5cGVzO1xuICAgIH1cblxuICAgIHRoaXMuY29udGFpbmVyTWFuYWdlci5hZGRFdmVudExpc3RlbmVyKGJyb3dzZXJFdmVudFR5cGUsIChlbGVtZW50OiBFbGVtZW50KSA9PiB7XG4gICAgICByZXR1cm4gKGV2ZW50OiBFdmVudCkgPT4ge1xuICAgICAgICBldmVudEhhbmRsZXIoZXZlbnRUeXBlLCBldmVudCwgZWxlbWVudCk7XG4gICAgICB9O1xuICAgIH0pO1xuXG4gICAgLy8gQXV0b21hdGljYWxseSBpbnN0YWxsIGEga2V5cHJlc3Mva2V5ZG93biBldmVudCBoYW5kbGVyIGlmIHN1cHBvcnQgZm9yXG4gICAgLy8gYWNjZXNzaWJsZSBjbGlja3MgaXMgdHVybmVkIG9uLlxuICAgIGlmICh0aGlzLmFkZEExMXlDbGlja0xpc3RlbmVyICYmIGV2ZW50VHlwZSA9PT0gRXZlbnRUeXBlLkNMSUNLKSB7XG4gICAgICB0aGlzLmFkZEV2ZW50KEV2ZW50VHlwZS5LRVlET1dOKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgcXVldWVkIGVhcmx5IGV2ZW50cyBhbmQgcmVwbGF5IHRoZW0gdXNpbmcgdGhlIGFwcHJvcHJpYXRlIGhhbmRsZXJcbiAgICogaW4gdGhlIHByb3ZpZGVkIGV2ZW50IGNvbnRyYWN0LiBPbmNlIGFsbCB0aGUgZXZlbnRzIGFyZSByZXBsYXllZCwgaXQgY2xlYW5zXG4gICAqIHVwIHRoZSBlYXJseSBjb250cmFjdC5cbiAgICovXG4gIHJlcGxheUVhcmx5RXZlbnRzKCkge1xuICAgIC8vIENoZWNrIGlmIHRoZSBlYXJseSBjb250cmFjdCBpcyBwcmVzZW50IGFuZCBwcmV2ZW50IGNhbGxpbmcgdGhpcyBmdW5jdGlvblxuICAgIC8vIG1vcmUgdGhhbiBvbmNlLlxuICAgIGNvbnN0IGVhcmx5SnNhY3Rpb25EYXRhOiBFYXJseUpzYWN0aW9uRGF0YSB8IHVuZGVmaW5lZCA9IHdpbmRvdy5fZWpzYTtcbiAgICBpZiAoIWVhcmx5SnNhY3Rpb25EYXRhKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gUmVwbGF5IHRoZSBlYXJseSBjb250cmFjdCBldmVudHMuXG4gICAgY29uc3QgZWFybHlFdmVudEluZm9zOiBldmVudEluZm9MaWIuRXZlbnRJbmZvW10gPSBlYXJseUpzYWN0aW9uRGF0YS5xO1xuICAgIGZvciAobGV0IGlkeCA9IDA7IGlkeCA8IGVhcmx5RXZlbnRJbmZvcy5sZW5ndGg7IGlkeCsrKSB7XG4gICAgICBjb25zdCBlYXJseUV2ZW50SW5mbzogZXZlbnRJbmZvTGliLkV2ZW50SW5mbyA9IGVhcmx5RXZlbnRJbmZvc1tpZHhdO1xuICAgICAgY29uc3QgZXZlbnRUeXBlcyA9IHRoaXMuZ2V0RXZlbnRUeXBlc0ZvckJyb3dzZXJFdmVudFR5cGUoZWFybHlFdmVudEluZm8uZXZlbnRUeXBlKTtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZXZlbnRUeXBlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBjb25zdCBldmVudEluZm8gPSBldmVudEluZm9MaWIuY2xvbmVFdmVudEluZm8oZWFybHlFdmVudEluZm8pO1xuICAgICAgICAvLyBFdmVudEluZm8gZXZlbnRUeXBlIG1hcHMgdG8gSlNBY3Rpb24ncyBpbnRlcm5hbCBldmVudCB0eXBlLFxuICAgICAgICAvLyByYXRoZXIgdGhhbiB0aGUgYnJvd3NlciBldmVudCB0eXBlLlxuICAgICAgICBldmVudEluZm9MaWIuc2V0RXZlbnRUeXBlKGV2ZW50SW5mbywgZXZlbnRUeXBlc1tpXSk7XG4gICAgICAgIHRoaXMuaGFuZGxlRXZlbnRJbmZvKGV2ZW50SW5mbyk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gQ2xlYW4gdXAgdGhlIGVhcmx5IGNvbnRyYWN0LlxuICAgIGNvbnN0IGVhcmx5RXZlbnRUeXBlczogc3RyaW5nW10gPSBlYXJseUpzYWN0aW9uRGF0YS5ldDtcbiAgICBjb25zdCBlYXJseUV2ZW50SGFuZGxlcjogKGV2ZW50OiBFdmVudCkgPT4gdm9pZCA9IGVhcmx5SnNhY3Rpb25EYXRhLmg7XG4gICAgZm9yIChsZXQgaWR4ID0gMDsgaWR4IDwgZWFybHlFdmVudFR5cGVzLmxlbmd0aDsgaWR4KyspIHtcbiAgICAgIGNvbnN0IGV2ZW50VHlwZTogc3RyaW5nID0gZWFybHlFdmVudFR5cGVzW2lkeF07XG4gICAgICB3aW5kb3cuZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoZXZlbnRUeXBlLCBlYXJseUV2ZW50SGFuZGxlcik7XG4gICAgfVxuICAgIGRlbGV0ZSB3aW5kb3cuX2Vqc2E7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhbGwgSlNBY3Rpb24gZXZlbnQgdHlwZXMgdGhhdCBoYXZlIGJlZW4gcmVnaXN0ZXJlZCBmb3IgYSBnaXZlblxuICAgKiBicm93c2VyIGV2ZW50IHR5cGUuXG4gICAqL1xuICBwcml2YXRlIGdldEV2ZW50VHlwZXNGb3JCcm93c2VyRXZlbnRUeXBlKGJyb3dzZXJFdmVudFR5cGU6IHN0cmluZykge1xuICAgIGNvbnN0IGV2ZW50VHlwZXMgPSBbXTtcbiAgICBpZiAodGhpcy5ldmVudEhhbmRsZXJzW2Jyb3dzZXJFdmVudFR5cGVdKSB7XG4gICAgICBldmVudFR5cGVzLnB1c2goYnJvd3NlckV2ZW50VHlwZSk7XG4gICAgfVxuICAgIGlmICh0aGlzLmJyb3dzZXJFdmVudFR5cGVUb0V4dHJhRXZlbnRUeXBlc1ticm93c2VyRXZlbnRUeXBlXSkge1xuICAgICAgZXZlbnRUeXBlcy5wdXNoKC4uLnRoaXMuYnJvd3NlckV2ZW50VHlwZVRvRXh0cmFFdmVudFR5cGVzW2Jyb3dzZXJFdmVudFR5cGVdKTtcbiAgICB9XG4gICAgcmV0dXJuIGV2ZW50VHlwZXM7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgZXZlbnQgaGFuZGxlciBmdW5jdGlvbiBmb3IgYSBnaXZlbiBldmVudCB0eXBlLlxuICAgKi9cbiAgaGFuZGxlcihldmVudFR5cGU6IHN0cmluZyk6IEV2ZW50SGFuZGxlciB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMuZXZlbnRIYW5kbGVyc1tldmVudFR5cGVdO1xuICB9XG5cbiAgLyoqXG4gICAqIENsZWFucyB1cCB0aGUgZXZlbnQgY29udHJhY3QuIFRoaXMgcmVzZXRzIGFsbCBvZiB0aGUgYEV2ZW50Q29udHJhY3RgJ3NcbiAgICogaW50ZXJuYWwgc3RhdGUuIFVzZXJzIGFyZSByZXNwb25zaWJsZSBmb3Igbm90IHVzaW5nIHRoaXMgYEV2ZW50Q29udHJhY3RgXG4gICAqIGFmdGVyIGl0IGhhcyBiZWVuIGNsZWFuZWQgdXAuXG4gICAqL1xuICBjbGVhblVwKCkge1xuICAgIHRoaXMuY29udGFpbmVyTWFuYWdlciEuY2xlYW5VcCgpO1xuICAgIHRoaXMuY29udGFpbmVyTWFuYWdlciA9IG51bGw7XG4gICAgdGhpcy5ldmVudEhhbmRsZXJzID0ge307XG4gICAgdGhpcy5icm93c2VyRXZlbnRUeXBlVG9FeHRyYUV2ZW50VHlwZXMgPSB7fTtcbiAgICB0aGlzLmRpc3BhdGNoZXIgPSBudWxsO1xuICAgIHRoaXMucXVldWVkRXZlbnRJbmZvcyA9IFtdO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlZ2lzdGVyIGEgZGlzcGF0Y2hlciBmdW5jdGlvbi4gRXZlbnQgaW5mbyBvZiBlYWNoIGV2ZW50IG1hcHBlZCB0b1xuICAgKiBhIGpzYWN0aW9uIGlzIHBhc3NlZCBmb3IgaGFuZGxpbmcgdG8gdGhpcyBjYWxsYmFjay4gVGhlIHF1ZXVlZFxuICAgKiBldmVudHMgYXJlIHBhc3NlZCBhcyB3ZWxsIHRvIHRoZSBkaXNwYXRjaGVyIGZvciBsYXRlciByZXBsYXlpbmdcbiAgICogb25jZSB0aGUgZGlzcGF0Y2hlciBpcyByZWdpc3RlcmVkLiBDbGVhcnMgdGhlIGV2ZW50IHF1ZXVlIHRvIG51bGwuXG4gICAqXG4gICAqIEBwYXJhbSBkaXNwYXRjaGVyIFRoZSBkaXNwYXRjaGVyIGZ1bmN0aW9uLlxuICAgKiBAcGFyYW0gcmVzdHJpY3Rpb25cbiAgICovXG4gIHJlZ2lzdGVyRGlzcGF0Y2hlcihkaXNwYXRjaGVyOiBEaXNwYXRjaGVyLCByZXN0cmljdGlvbjogUmVzdHJpY3Rpb24pIHtcbiAgICB0aGlzLmVjcmQoZGlzcGF0Y2hlciwgcmVzdHJpY3Rpb24pO1xuICB9XG5cbiAgLyoqXG4gICAqIFVucmVuYW1lZCBhbGlhcyBmb3IgcmVnaXN0ZXJEaXNwYXRjaGVyLiBOZWNlc3NhcnkgZm9yIGFueSBjb2RlYmFzZXMgdGhhdFxuICAgKiBzcGxpdCB0aGUgYEV2ZW50Q29udHJhY3RgIGFuZCBgRGlzcGF0Y2hlcmAgY29kZSBpbnRvIGRpZmZlcmVudCBjb21waWxhdGlvblxuICAgKiB1bml0cy5cbiAgICovXG4gIGVjcmQoZGlzcGF0Y2hlcjogRGlzcGF0Y2hlciwgcmVzdHJpY3Rpb246IFJlc3RyaWN0aW9uKSB7XG4gICAgdGhpcy5kaXNwYXRjaGVyID0gZGlzcGF0Y2hlcjtcblxuICAgIGlmICh0aGlzLnF1ZXVlZEV2ZW50SW5mb3M/Lmxlbmd0aCkge1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLnF1ZXVlZEV2ZW50SW5mb3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdGhpcy5oYW5kbGVFdmVudEluZm8odGhpcy5xdWV1ZWRFdmVudEluZm9zW2ldKTtcbiAgICAgIH1cbiAgICAgIHRoaXMucXVldWVkRXZlbnRJbmZvcyA9IG51bGw7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEFkZHMgYTExeSBjbGljayBzdXBwb3J0IHRvIHRoZSBnaXZlbiBgRXZlbnRDb250cmFjdGAuIE1lYW50IHRvIGJlIGNhbGxlZCBpblxuICAgKiB0aGUgc2FtZSBjb21waWxhdGlvbiB1bml0IGFzIHRoZSBgRXZlbnRDb250cmFjdGAuXG4gICAqL1xuICBhZGRBMTF5Q2xpY2tTdXBwb3J0KCkge1xuICAgIHRoaXMuYWRkQTExeUNsaWNrU3VwcG9ydEltcGwoXG4gICAgICBhMTF5Q2xpY2tMaWIudXBkYXRlRXZlbnRJbmZvRm9yQTExeUNsaWNrLFxuICAgICAgYTExeUNsaWNrTGliLnByZXZlbnREZWZhdWx0Rm9yQTExeUNsaWNrLFxuICAgICAgYTExeUNsaWNrTGliLnBvcHVsYXRlQ2xpY2tPbmx5QWN0aW9uLFxuICAgICk7XG4gIH1cblxuICAvKipcbiAgICogRW5hYmxlcyBhMTF5IGNsaWNrIHN1cHBvcnQgdG8gYmUgZGVmZXJyZWQuIE1lYW50IHRvIGJlIGNhbGxlZCBpbiB0aGUgc2FtZVxuICAgKiBjb21waWxhdGlvbiB1bml0IGFzIHRoZSBgRXZlbnRDb250cmFjdGAuXG4gICAqL1xuICBleHBvcnRBZGRBMTF5Q2xpY2tTdXBwb3J0KCkge1xuICAgIHRoaXMuYWRkQTExeUNsaWNrTGlzdGVuZXIgPSB0cnVlO1xuICAgIHRoaXMuZWNhYWNzID0gdGhpcy5hZGRBMTF5Q2xpY2tTdXBwb3J0SW1wbC5iaW5kKHRoaXMpO1xuICB9XG5cbiAgLyoqXG4gICAqIFVucmVuYW1lZCBmdW5jdGlvbiB0aGF0IGxvYWRzIGExMXlDbGlja1N1cHBvcnQuXG4gICAqL1xuICBwcml2YXRlIGFkZEExMXlDbGlja1N1cHBvcnRJbXBsKFxuICAgIHVwZGF0ZUV2ZW50SW5mb0ZvckExMXlDbGljazogdHlwZW9mIGExMXlDbGlja0xpYi51cGRhdGVFdmVudEluZm9Gb3JBMTF5Q2xpY2ssXG4gICAgcHJldmVudERlZmF1bHRGb3JBMTF5Q2xpY2s6IHR5cGVvZiBhMTF5Q2xpY2tMaWIucHJldmVudERlZmF1bHRGb3JBMTF5Q2xpY2ssXG4gICAgcG9wdWxhdGVDbGlja09ubHlBY3Rpb246IHR5cGVvZiBhMTF5Q2xpY2tMaWIucG9wdWxhdGVDbGlja09ubHlBY3Rpb24sXG4gICkge1xuICAgIHRoaXMuYWRkQTExeUNsaWNrTGlzdGVuZXIgPSB0cnVlO1xuICAgIHRoaXMuaGFzQTExeUNsaWNrU3VwcG9ydCA9IHRydWU7XG4gICAgdGhpcy51cGRhdGVFdmVudEluZm9Gb3JBMTF5Q2xpY2sgPSB1cGRhdGVFdmVudEluZm9Gb3JBMTF5Q2xpY2s7XG4gICAgdGhpcy5wcmV2ZW50RGVmYXVsdEZvckExMXlDbGljayA9IHByZXZlbnREZWZhdWx0Rm9yQTExeUNsaWNrO1xuICAgIHRoaXMucG9wdWxhdGVDbGlja09ubHlBY3Rpb24gPSBwb3B1bGF0ZUNsaWNrT25seUFjdGlvbjtcbiAgfVxufVxuXG4vKipcbiAqIEFkZHMgYTExeSBjbGljayBzdXBwb3J0IHRvIHRoZSBnaXZlbiBgRXZlbnRDb250cmFjdGAuIE1lYW50IHRvIGJlIGNhbGxlZFxuICogaW4gYSBkaWZmZXJlbnQgY29tcGlsYXRpb24gdW5pdCBmcm9tIHRoZSBgRXZlbnRDb250cmFjdGAuIFRoZSBgRXZlbnRDb250cmFjdGBcbiAqIG11c3QgaGF2ZSBjYWxsZWQgYGV4cG9ydEFkZEExMXlDbGlja1N1cHBvcnRgIGluIGl0cyBjb21waWxhdGlvbiB1bml0IGZvciB0aGlzXG4gKiB0byBoYXZlIGFueSBlZmZlY3QuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhZGREZWZlcnJlZEExMXlDbGlja1N1cHBvcnQoZXZlbnRDb250cmFjdDogRXZlbnRDb250cmFjdCkge1xuICBldmVudENvbnRyYWN0LmVjYWFjcz8uKFxuICAgIGExMXlDbGlja0xpYi51cGRhdGVFdmVudEluZm9Gb3JBMTF5Q2xpY2ssXG4gICAgYTExeUNsaWNrTGliLnByZXZlbnREZWZhdWx0Rm9yQTExeUNsaWNrLFxuICAgIGExMXlDbGlja0xpYi5wb3B1bGF0ZUNsaWNrT25seUFjdGlvbixcbiAgKTtcbn1cblxuLyoqXG4gKiBEZXRlcm1pbmVzIHdoZXRoZXIgb3Igbm90IHRoZSBgRXZlbnRDb250cmFjdGAgbmVlZHMgdG8gY2hlY2sgd2l0aCB0aGVcbiAqIGRpc3BhdGNoZXIgZXZlbiBpZiB0aGVyZSdzIG5vIGFjdGlvbi5cbiAqL1xuZnVuY3Rpb24gY2hlY2tEaXNwYXRjaGVyRm9yQTExeUNsaWNrKGV2ZW50SW5mbzogZXZlbnRJbmZvTGliLkV2ZW50SW5mbyk6IGJvb2xlYW4ge1xuICByZXR1cm4gKFxuICAgIEV2ZW50Q29udHJhY3QuQTExWV9TVVBQT1JUX0lOX0RJU1BBVENIRVIgJiZcbiAgICBldmVudEluZm9MaWIuZ2V0RXZlbnRUeXBlKGV2ZW50SW5mbykgPT09IEFjY2Vzc2liaWxpdHlBdHRyaWJ1dGUuTUFZQkVfQ0xJQ0tfRVZFTlRfVFlQRVxuICApO1xufVxuXG4vKipcbiAqIFJldHVybnMgdHJ1ZSBpZiB0aGUgZGVmYXVsdCBhY3Rpb24gb2YgdGhpcyBldmVudCBzaG91bGQgYmUgcHJldmVudGVkIGJlZm9yZVxuICogdGhpcyBldmVudCBpcyBkaXNwYXRjaGVkLlxuICovXG5mdW5jdGlvbiBzaG91bGRQcmV2ZW50RGVmYXVsdEJlZm9yZURpc3BhdGNoaW5nKFxuICBhY3Rpb25FbGVtZW50OiBFbGVtZW50LFxuICBldmVudEluZm86IGV2ZW50SW5mb0xpYi5FdmVudEluZm8sXG4pOiBib29sZWFuIHtcbiAgLy8gUHJldmVudCBicm93c2VyIGZyb20gZm9sbG93aW5nIDxhPiBub2RlIGxpbmtzIGlmIGEganNhY3Rpb24gaXMgcHJlc2VudFxuICAvLyBhbmQgd2UgYXJlIGRpc3BhdGNoaW5nIHRoZSBhY3Rpb24gbm93LiBOb3RlIHRoYXQgdGhlIHRhcmdldEVsZW1lbnQgbWF5IGJlXG4gIC8vIGEgY2hpbGQgb2YgYW4gYW5jaG9yIHRoYXQgaGFzIGEganNhY3Rpb24gYXR0YWNoZWQuIEZvciB0aGF0IHJlYXNvbiwgd2VcbiAgLy8gbmVlZCB0byBjaGVjayB0aGUgYWN0aW9uRWxlbWVudCByYXRoZXIgdGhhbiB0aGUgdGFyZ2V0RWxlbWVudC5cbiAgcmV0dXJuIChcbiAgICBhY3Rpb25FbGVtZW50LnRhZ05hbWUgPT09ICdBJyAmJlxuICAgIChldmVudEluZm9MaWIuZ2V0RXZlbnRUeXBlKGV2ZW50SW5mbykgPT09IEV2ZW50VHlwZS5DTElDSyB8fFxuICAgICAgZXZlbnRJbmZvTGliLmdldEV2ZW50VHlwZShldmVudEluZm8pID09PSBFdmVudFR5cGUuQ0xJQ0tNT0QpXG4gICk7XG59XG5cbi8qKlxuICogUGFyc2VzIGFuZCBjYWNoZXMgYW4gZWxlbWVudCdzIGpzYWN0aW9uIGVsZW1lbnQgaW50byBhIG1hcC5cbiAqXG4gKiBUaGlzIGlzIHByaW1hcmlseSBmb3IgaW50ZXJuYWwgdXNlLlxuICpcbiAqIEBwYXJhbSBhY3Rpb25FbGVtZW50IFRoZSBET00gbm9kZSB0byByZXRyaWV2ZSB0aGUganNhY3Rpb24gbWFwIGZyb20uXG4gKiBAcGFyYW0gY29udGFpbmVyIFRoZSBub2RlIHdoaWNoIGxpbWl0cyB0aGUgbmFtZXNwYWNlIGxvb2t1cCBmb3IgYSBqc2FjdGlvblxuICogbmFtZS4gVGhlIGNvbnRhaW5lciBub2RlIGl0c2VsZiB3aWxsIG5vdCBiZSBzZWFyY2hlZC5cbiAqIEByZXR1cm4gTWFwIGZyb20gZXZlbnQgdG8gcXVhbGlmaWVkIG5hbWUgb2YgdGhlIGpzYWN0aW9uIGJvdW5kIHRvIGl0LlxuICovXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VBY3Rpb25zKGFjdGlvbkVsZW1lbnQ6IEVsZW1lbnQsIGNvbnRhaW5lcjogTm9kZSk6IHtba2V5OiBzdHJpbmddOiBzdHJpbmd9IHtcbiAgbGV0IGFjdGlvbk1hcDoge1trZXk6IHN0cmluZ106IHN0cmluZ30gfCB1bmRlZmluZWQgPSBjYWNoZS5nZXQoYWN0aW9uRWxlbWVudCk7XG4gIGlmICghYWN0aW9uTWFwKSB7XG4gICAgY29uc3QganNhY3Rpb25BdHRyaWJ1dGUgPSBnZXRBdHRyKGFjdGlvbkVsZW1lbnQsIEF0dHJpYnV0ZS5KU0FDVElPTik7XG4gICAgaWYgKCFqc2FjdGlvbkF0dHJpYnV0ZSkge1xuICAgICAgYWN0aW9uTWFwID0gRU1QVFlfQUNUSU9OX01BUDtcbiAgICAgIGNhY2hlLnNldChhY3Rpb25FbGVtZW50LCBhY3Rpb25NYXApO1xuICAgIH0gZWxzZSB7XG4gICAgICBhY3Rpb25NYXAgPSBjYWNoZS5nZXRQYXJzZWQoanNhY3Rpb25BdHRyaWJ1dGUpO1xuICAgICAgaWYgKCFhY3Rpb25NYXApIHtcbiAgICAgICAgYWN0aW9uTWFwID0ge307XG4gICAgICAgIGNvbnN0IHZhbHVlcyA9IGpzYWN0aW9uQXR0cmlidXRlLnNwbGl0KFJFR0VYUF9TRU1JQ09MT04pO1xuICAgICAgICBmb3IgKGxldCBpZHggPSAwOyBpZHggPCB2YWx1ZXMubGVuZ3RoOyBpZHgrKykge1xuICAgICAgICAgIGNvbnN0IHZhbHVlID0gdmFsdWVzW2lkeF07XG4gICAgICAgICAgaWYgKCF2YWx1ZSkge1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgfVxuICAgICAgICAgIGNvbnN0IGNvbG9uID0gdmFsdWUuaW5kZXhPZihDaGFyLkVWRU5UX0FDVElPTl9TRVBBUkFUT1IpO1xuICAgICAgICAgIGNvbnN0IGhhc0NvbG9uID0gY29sb24gIT09IC0xO1xuICAgICAgICAgIGNvbnN0IHR5cGUgPSBoYXNDb2xvbiA/IHN0cmluZ1RyaW0odmFsdWUuc3Vic3RyKDAsIGNvbG9uKSkgOiBERUZBVUxUX0VWRU5UX1RZUEU7XG4gICAgICAgICAgY29uc3QgYWN0aW9uID0gaGFzQ29sb24gPyBzdHJpbmdUcmltKHZhbHVlLnN1YnN0cihjb2xvbiArIDEpKSA6IHZhbHVlO1xuICAgICAgICAgIGFjdGlvbk1hcFt0eXBlXSA9IGFjdGlvbjtcbiAgICAgICAgfVxuICAgICAgICBjYWNoZS5zZXRQYXJzZWQoanNhY3Rpb25BdHRyaWJ1dGUsIGFjdGlvbk1hcCk7XG4gICAgICB9XG4gICAgICAvLyBJZiBuYW1lc3BhY2Ugc3VwcG9ydCBpcyBhY3RpdmUgd2UgbmVlZCB0byBhdWdtZW50IHRoZSAocG90ZW50aWFsbHlcbiAgICAgIC8vIGNhY2hlZCkganNhY3Rpb24gbWFwcGluZyB3aXRoIHRoZSBuYW1lc3BhY2UuXG4gICAgICBpZiAoRXZlbnRDb250cmFjdC5KU05BTUVTUEFDRV9TVVBQT1JUKSB7XG4gICAgICAgIGNvbnN0IG5vTnMgPSBhY3Rpb25NYXA7XG4gICAgICAgIGFjdGlvbk1hcCA9IHt9O1xuICAgICAgICBmb3IgKGNvbnN0IHR5cGUgaW4gbm9Ocykge1xuICAgICAgICAgIGFjdGlvbk1hcFt0eXBlXSA9IGdldEZ1bGx5UXVhbGlmaWVkQWN0aW9uKG5vTnNbdHlwZV0sIGFjdGlvbkVsZW1lbnQsIGNvbnRhaW5lcik7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGNhY2hlLnNldChhY3Rpb25FbGVtZW50LCBhY3Rpb25NYXApO1xuICAgIH1cbiAgfVxuICByZXR1cm4gYWN0aW9uTWFwO1xufVxuXG4vKipcbiAqIFJldHVybnMgdGhlIGZ1bGx5IHF1YWxpZmllZCBqc2FjdGlvbiBhY3Rpb24uIElmIHRoZSBnaXZlbiBqc2FjdGlvblxuICogbmFtZSBkb2Vzbid0IGFscmVhZHkgY29udGFpbiB0aGUgbmFtZXNwYWNlLCB0aGUgZnVuY3Rpb24gaXRlcmF0ZXNcbiAqIG92ZXIgYW5jZXN0b3Igbm9kZXMgdW50aWwgYSBqc25hbWVzcGFjZSBhdHRyaWJ1dGUgaXMgZm91bmQsIGFuZFxuICogdXNlcyB0aGUgdmFsdWUgb2YgdGhhdCBhdHRyaWJ1dGUgYXMgdGhlIG5hbWVzcGFjZS5cbiAqXG4gKiBAcGFyYW0gYWN0aW9uIFRoZSBqc2FjdGlvbiBhY3Rpb24gdG8gcmVzb2x2ZS5cbiAqIEBwYXJhbSBzdGFydCBUaGUgbm9kZSBmcm9tIHdoaWNoIHRvIHN0YXJ0IHNlYXJjaGluZyBmb3IgYSBqc25hbWVzcGFjZVxuICogYXR0cmlidXRlLlxuICogQHBhcmFtIGNvbnRhaW5lciBUaGUgbm9kZSB3aGljaCBsaW1pdHMgdGhlIHNlYXJjaCBmb3IgYSBqc25hbWVzcGFjZVxuICogYXR0cmlidXRlLiBUaGlzIG5vZGUgd2lsbCBiZSBzZWFyY2hlZC5cbiAqIEByZXR1cm4gVGhlIGZ1bGx5IHF1YWxpZmllZCBuYW1lIG9mIHRoZSBqc2FjdGlvbi4gSWYgbm8gbmFtZXNwYWNlIGlzIGZvdW5kLFxuICogcmV0dXJucyB0aGUgdW5xdWFsaWZpZWQgbmFtZSBpbiBjYXNlIGl0IGV4aXN0cyBpbiB0aGUgZ2xvYmFsIG5hbWVzcGFjZS5cbiAqL1xuZnVuY3Rpb24gZ2V0RnVsbHlRdWFsaWZpZWRBY3Rpb24oYWN0aW9uOiBzdHJpbmcsIHN0YXJ0OiBFbGVtZW50LCBjb250YWluZXI6IE5vZGUpOiBzdHJpbmcge1xuICBpZiAoRXZlbnRDb250cmFjdC5KU05BTUVTUEFDRV9TVVBQT1JUKSB7XG4gICAgaWYgKGlzTmFtZXNwYWNlZEFjdGlvbihhY3Rpb24pKSB7XG4gICAgICByZXR1cm4gYWN0aW9uO1xuICAgIH1cblxuICAgIGxldCBub2RlOiBOb2RlIHwgbnVsbCA9IHN0YXJ0O1xuICAgIHdoaWxlIChub2RlKSB7XG4gICAgICBjb25zdCBuYW1lc3BhY2UgPSBnZXROYW1lc3BhY2VGcm9tRWxlbWVudChub2RlIGFzIEVsZW1lbnQpO1xuICAgICAgaWYgKG5hbWVzcGFjZSkge1xuICAgICAgICByZXR1cm4gbmFtZXNwYWNlICsgQ2hhci5OQU1FU1BBQ0VfQUNUSU9OX1NFUEFSQVRPUiArIGFjdGlvbjtcbiAgICAgIH1cblxuICAgICAgLy8gSWYgdGhpcyBub2RlIGlzIHRoZSBjb250YWluZXIsIHN0b3AuXG4gICAgICBpZiAobm9kZSA9PT0gY29udGFpbmVyKSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuXG4gICAgICBub2RlID0gbm9kZS5wYXJlbnROb2RlO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBhY3Rpb247XG59XG5cbi8qKlxuICogQ2hlY2tzIGlmIGEganNhY3Rpb24gYWN0aW9uIGNvbnRhaW5zIGEgbmFtZXNwYWNlIHBhcnQuXG4gKi9cbmZ1bmN0aW9uIGlzTmFtZXNwYWNlZEFjdGlvbihhY3Rpb246IHN0cmluZyk6IGJvb2xlYW4ge1xuICByZXR1cm4gYWN0aW9uLmluZGV4T2YoQ2hhci5OQU1FU1BBQ0VfQUNUSU9OX1NFUEFSQVRPUikgPj0gMDtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIHRoZSB2YWx1ZSBvZiB0aGUganNuYW1lc3BhY2UgYXR0cmlidXRlIG9mIHRoZSBnaXZlbiBub2RlLlxuICogQWxzbyBjYWNoZXMgdGhlIHZhbHVlIGZvciBzdWJzZXF1ZW50IGxvb2t1cHMuXG4gKiBAcGFyYW0gZWxlbWVudCBUaGUgbm9kZSB3aG9zZSBqc25hbWVzcGFjZSBhdHRyaWJ1dGUgaXMgYmVpbmcgYXNrZWQgZm9yLlxuICogQHJldHVybiBUaGUgdmFsdWUgb2YgdGhlIGpzbmFtZXNwYWNlIGF0dHJpYnV0ZSwgb3IgbnVsbCBpZiBub3QgZm91bmQuXG4gKi9cbmZ1bmN0aW9uIGdldE5hbWVzcGFjZUZyb21FbGVtZW50KGVsZW1lbnQ6IEVsZW1lbnQpOiBzdHJpbmcgfCBudWxsIHtcbiAgbGV0IG5hbWVzcGFjZSA9IGNhY2hlLmdldE5hbWVzcGFjZShlbGVtZW50KTtcbiAgLy8gT25seSBxdWVyeSBmb3IgdGhlIGF0dHJpYnV0ZSBpZiBpdCBoYXMgbm90IGJlZW4gcXVlcmllZCBmb3JcbiAgLy8gYmVmb3JlLiBnZXRBdHRyKCkgcmV0dXJucyBudWxsIGlmIGFuIGF0dHJpYnV0ZSBpcyBub3QgcHJlc2VudC4gVGh1cyxcbiAgLy8gbmFtZXNwYWNlIGlzIHN0cmluZ3xudWxsIGlmIHRoZSBxdWVyeSB0b29rIHBsYWNlIGluIHRoZSBwYXN0LCBvclxuICAvLyB1bmRlZmluZWQgaWYgdGhlIHF1ZXJ5IGRpZCBub3QgdGFrZSBwbGFjZS5cbiAgaWYgKG5hbWVzcGFjZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgbmFtZXNwYWNlID0gZ2V0QXR0cihlbGVtZW50LCBBdHRyaWJ1dGUuSlNOQU1FU1BBQ0UpO1xuICAgIGNhY2hlLnNldE5hbWVzcGFjZShlbGVtZW50LCBuYW1lc3BhY2UpO1xuICB9XG4gIHJldHVybiBuYW1lc3BhY2U7XG59XG5cbi8qKlxuICogQWNjZXNzZXMgdGhlIGV2ZW50IGhhbmRsZXIgYXR0cmlidXRlIHZhbHVlIG9mIGEgRE9NIG5vZGUuIEl0IGd1YXJkc1xuICogYWdhaW5zdCB3ZWlyZCBzaXR1YXRpb25zIChkZXNjcmliZWQgaW4gdGhlIGJvZHkpIHRoYXQgb2NjdXIgaW5cbiAqIGNvbm5lY3Rpb24gd2l0aCBub2RlcyB0aGF0IGFyZSByZW1vdmVkIGZyb20gdGhlaXIgZG9jdW1lbnQuXG4gKiBAcGFyYW0gZWxlbWVudCBUaGUgRE9NIGVsZW1lbnQuXG4gKiBAcGFyYW0gYXR0cmlidXRlIFRoZSBuYW1lIG9mIHRoZSBhdHRyaWJ1dGUgdG8gYWNjZXNzLlxuICogQHJldHVybiBUaGUgYXR0cmlidXRlIHZhbHVlIGlmIGl0IHdhcyBmb3VuZCwgbnVsbCBvdGhlcndpc2UuXG4gKi9cbmZ1bmN0aW9uIGdldEF0dHIoZWxlbWVudDogRWxlbWVudCwgYXR0cmlidXRlOiBzdHJpbmcpOiBzdHJpbmcgfCBudWxsIHtcbiAgbGV0IHZhbHVlID0gbnVsbDtcbiAgLy8gTk9URTogTm9kZXMgaW4gSUUgZG8gbm90IGFsd2F5cyBoYXZlIGEgZ2V0QXR0cmlidXRlXG4gIC8vIG1ldGhvZCBkZWZpbmVkLiBUaGlzIGlzIHRoZSBjYXNlIHdoZXJlIHNvdXJjZUVsZW1lbnQgaGFzIGluXG4gIC8vIGZhY3QgYmVlbiByZW1vdmVkIGZyb20gdGhlIERPTSBiZWZvcmUgZXZlbnRDb250cmFjdCBiZWdpbnNcbiAgLy8gaGFuZGxpbmcgLSB3aGVyZSBhIHBhcmVudE5vZGUgZG9lcyBub3QgaGF2ZSBnZXRBdHRyaWJ1dGVcbiAgLy8gZGVmaW5lZC5cbiAgLy8gTk9URTogV2UgbXVzdCB1c2UgdGhlICdpbicgb3BlcmF0b3IgaW5zdGVhZCBvZiB0aGUgcmVndWxhciBkb3RcbiAgLy8gbm90YXRpb24sIHNpbmNlIHRoZSBsYXR0ZXIgZmFpbHMgaW4gSUU4IGlmIHRoZSBnZXRBdHRyaWJ1dGUgbWV0aG9kIGlzIG5vdFxuICAvLyBkZWZpbmVkLiBTZWUgYi83MTM5MTA5LlxuICBpZiAoJ2dldEF0dHJpYnV0ZScgaW4gZWxlbWVudCkge1xuICAgIHZhbHVlID0gZWxlbWVudC5nZXRBdHRyaWJ1dGUoYXR0cmlidXRlKTtcbiAgfVxuICByZXR1cm4gdmFsdWU7XG59XG5cbi8qKlxuICogSGVscGVyIGZ1bmN0aW9uIHRvIHRyaW0gd2hpdGVzcGFjZSBmcm9tIHRoZSBiZWdpbm5pbmcgYW5kIHRoZSBlbmRcbiAqIG9mIHRoZSBzdHJpbmcuIFRoaXMgZGVsaWJlcmF0ZWx5IGRvZXNuJ3QgdXNlIHRoZSBjbG9zdXJlIGVxdWl2YWxlbnRcbiAqIHRvIGtlZXAgZGVwZW5kZW5jaWVzIHNtYWxsLlxuICogQHBhcmFtIHN0ciAgSW5wdXQgc3RyaW5nLlxuICogQHJldHVybiAgVHJpbW1lZCBzdHJpbmcuXG4gKi9cbmZ1bmN0aW9uIHN0cmluZ1RyaW0oc3RyOiBzdHJpbmcpOiBzdHJpbmcge1xuICBpZiAodHlwZW9mIFN0cmluZy5wcm90b3R5cGUudHJpbSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIHJldHVybiBzdHIudHJpbSgpO1xuICB9XG5cbiAgY29uc3QgdHJpbW1lZExlZnQgPSBzdHIucmVwbGFjZSgvXlxccysvLCAnJyk7XG4gIHJldHVybiB0cmltbWVkTGVmdC5yZXBsYWNlKC9cXHMrJC8sICcnKTtcbn1cbiJdfQ==