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
    constructor(containerManager) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXZlbnRjb250cmFjdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvcHJpbWl0aXZlcy9ldmVudC1kaXNwYXRjaC9zcmMvZXZlbnRjb250cmFjdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQXNCRztBQUVILE9BQU8sS0FBSyxZQUFZLE1BQU0sY0FBYyxDQUFDO0FBQzdDLE9BQU8sRUFBQyxTQUFTLElBQUksc0JBQXNCLEVBQUMsTUFBTSxpQkFBaUIsQ0FBQztBQUNwRSxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sYUFBYSxDQUFDO0FBQ3RDLE9BQU8sS0FBSyxLQUFLLE1BQU0sU0FBUyxDQUFDO0FBQ2pDLE9BQU8sRUFBQyxJQUFJLEVBQUMsTUFBTSxRQUFRLENBQUM7QUFFNUIsT0FBTyxLQUFLLFFBQVEsTUFBTSxTQUFTLENBQUM7QUFFcEMsT0FBTyxFQUNMLGtCQUFrQixFQUNsQiwwQkFBMEIsRUFDMUIsb0JBQW9CLEVBQ3BCLG1CQUFtQixFQUNuQixxQkFBcUIsRUFDckIsZ0JBQWdCLEdBQ2pCLE1BQU0sMEJBQTBCLENBQUM7QUFDbEMsT0FBTyxLQUFLLFlBQVksTUFBTSxjQUFjLENBQUM7QUFDN0MsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLGNBQWMsQ0FBQztBQUN2QyxPQUFPLEVBQUMsUUFBUSxFQUFDLE1BQU0sWUFBWSxDQUFDO0FBa0NwQyxNQUFNLGtCQUFrQixHQUFXLFNBQVMsQ0FBQyxLQUFLLENBQUM7QUFFbkQ7OztHQUdHO0FBQ0gsTUFBTSxnQkFBZ0IsR0FBNEIsRUFBRSxDQUFDO0FBRXJEOztHQUVHO0FBQ0gsTUFBTSxnQkFBZ0IsR0FBRyxTQUFTLENBQUM7QUFFbkM7Ozs7Ozs7Ozs7Ozs7R0FhRztBQUNILE1BQU0sT0FBTyxhQUFhO2FBQ2pCLHlCQUFvQixHQUFHLG9CQUFvQixBQUF2QixDQUF3QjthQUM1QyxxQkFBZ0IsR0FBRyxnQkFBZ0IsQUFBbkIsQ0FBb0I7YUFDcEMsK0JBQTBCLEdBQUcsMEJBQTBCLEFBQTdCLENBQThCO2FBQ3hELHVCQUFrQixHQUFHLGtCQUFrQixBQUFyQixDQUFzQjthQUN4QywwQkFBcUIsR0FBRyxxQkFBcUIsQUFBeEIsQ0FBeUI7YUFDOUMsd0JBQW1CLEdBQUcsbUJBQW1CLEFBQXRCLENBQXVCO0lBbURqRCxZQUFZLGdCQUErQztRQS9DM0Q7Ozs7OztXQU1HO1FBQ0ssa0JBQWEsR0FBa0MsRUFBRSxDQUFDO1FBRWxELHNDQUFpQyxHQUE4QixFQUFFLENBQUM7UUFFMUU7Ozs7OztXQU1HO1FBQ0ssZUFBVSxHQUFzQixJQUFJLENBQUM7UUFFN0M7OztXQUdHO1FBQ0sscUJBQWdCLEdBQW9DLEVBQUUsQ0FBQztRQUUvRCx5REFBeUQ7UUFDakQsd0JBQW1CLEdBQUcsS0FBSyxDQUFDO1FBQ3BDLDZDQUE2QztRQUNyQyx5QkFBb0IsR0FBRyxhQUFhLENBQUMsMEJBQTBCLENBQUM7UUFFaEUsZ0NBQTJCLEdBQWlELFNBQVMsQ0FBQztRQUV0RiwrQkFBMEIsR0FBaUQsU0FBUyxDQUFDO1FBRXJGLDRCQUF1QixHQUluQixTQUFTLENBQUM7UUFTcEIsSUFBSSxDQUFDLGdCQUFnQixHQUFHLGdCQUFnQixDQUFDO1FBQ3pDLElBQUksYUFBYSxDQUFDLG9CQUFvQixFQUFFLENBQUM7WUFDdkMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDbEMsQ0FBQztRQUNELElBQUksYUFBYSxDQUFDLGtCQUFrQixFQUFFLENBQUM7WUFDckMsaURBQWlEO1lBQ2pELElBQUksQ0FBQyxtQkFBbUIsRUFBRSxDQUFDO1FBQzdCLENBQUM7SUFDSCxDQUFDO0lBRU8sV0FBVyxDQUFDLFNBQWlCLEVBQUUsS0FBWSxFQUFFLFNBQWtCO1FBQ3JFLE1BQU0sU0FBUyxHQUFHLFlBQVksQ0FBQyw2QkFBNkI7UUFDMUQsZ0JBQWdCLENBQUMsU0FBUztRQUMxQixZQUFZLENBQUMsS0FBSztRQUNsQixvQkFBb0IsQ0FBQyxLQUFLLENBQUMsTUFBaUI7UUFDNUMsZ0JBQWdCLENBQUMsU0FBUztRQUMxQixnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQzVCLENBQUM7UUFDRixJQUFJLENBQUMsZUFBZSxDQUFDLFNBQVMsQ0FBQyxDQUFDO0lBQ2xDLENBQUM7SUFFRDs7OztPQUlHO0lBQ0ssZUFBZSxDQUFDLFNBQWlDLEVBQUUsZUFBZSxHQUFHLElBQUk7UUFDL0UsSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztZQUNyQiw4REFBOEQ7WUFDOUQsWUFBWSxDQUFDLFdBQVcsQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDMUMsSUFBSSxDQUFDLGdCQUFnQixFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUN6QyxDQUFDO1FBQ0QsSUFDRSxhQUFhLENBQUMsb0JBQW9CO1lBQ2xDLFlBQVksQ0FBQyxZQUFZLENBQUMsU0FBUyxDQUFDLEtBQUssU0FBUyxDQUFDLE1BQU0sRUFDekQsQ0FBQztZQUNELE1BQU0sTUFBTSxHQUFJLFlBQVksQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFpQixDQUFDLE1BQU0sQ0FBQztZQUN4RSxvRUFBb0U7WUFDcEUsNEJBQTRCO1lBQzVCLElBQUksQ0FBQyxNQUFNLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztnQkFDaEMsNEJBQTRCO2dCQUM1QixPQUFPO1lBQ1QsQ0FBQztZQUNELFlBQVksQ0FBQyxZQUFZLENBQUMsU0FBUyxFQUFFLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO1FBQ3hELENBQUM7UUFFRCxJQUFJLENBQUMsY0FBYyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBRS9CLElBQ0UsSUFBSSxDQUFDLFVBQVU7WUFDZixDQUFDLFlBQVksQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLENBQUMsc0JBQXNCLENBQUMsb0JBQW9CLENBQUMsRUFDOUUsQ0FBQztZQUNELE1BQU0sZUFBZSxHQUEyQixZQUFZLENBQUMsY0FBYyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBRXZGLGlFQUFpRTtZQUNqRSwwRUFBMEU7WUFDMUUsK0RBQStEO1lBQy9ELElBQUksWUFBWSxDQUFDLFlBQVksQ0FBQyxlQUFlLENBQUMsS0FBSyxTQUFTLENBQUMsU0FBUyxFQUFFLENBQUM7Z0JBQ3ZFLFlBQVksQ0FBQyxZQUFZLENBQUMsZUFBZSxFQUFFLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUM5RCxDQUFDO1lBRUQsSUFBSSxDQUFDLFVBQVUsQ0FBQyxlQUFlLEVBQUUsMkJBQTJCLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDckUsQ0FBQztRQUVELE1BQU0sTUFBTSxHQUFHLFlBQVksQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDakQsSUFBSSxDQUFDLE1BQU0sSUFBSSxDQUFDLDJCQUEyQixDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUM7WUFDdkQsT0FBTztRQUNULENBQUM7UUFFRCxJQUFJLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztZQUNwQixJQUNFLE1BQU07Z0JBQ04scUNBQXFDLENBQUMsWUFBWSxDQUFDLGdCQUFnQixDQUFDLE1BQU0sQ0FBQyxFQUFFLFNBQVMsQ0FBQyxFQUN2RixDQUFDO2dCQUNELFFBQVEsQ0FBQyxjQUFjLENBQUMsWUFBWSxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDO1lBQzVELENBQUM7WUFFRCxNQUFNLG1CQUFtQixHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDdkQsSUFBSSxtQkFBbUIsSUFBSSxlQUFlLEVBQUUsQ0FBQztnQkFDM0Msa0VBQWtFO2dCQUNsRSxnRUFBZ0U7Z0JBQ2hFLGdEQUFnRDtnQkFDaEQsSUFBSSxDQUFDLGVBQWUsQ0FBQyxtQkFBbUIsRUFBRSxzQkFBc0IsQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDeEUsT0FBTztZQUNULENBQUM7UUFDSCxDQUFDO0lBQ0gsQ0FBQztJQUVEOzs7Ozs7Ozs7OztPQVdHO0lBQ0ssY0FBYyxDQUFDLFNBQWlDO1FBQ3RELG1FQUFtRTtRQUNuRSxtRUFBbUU7UUFDbkUsZ0VBQWdFO1FBQ2hFLCtEQUErRDtRQUMvRCxtRUFBbUU7UUFDbkUsaURBQWlEO1FBQ2pELEVBQUU7UUFDRixvRUFBb0U7UUFDcEUsbUVBQW1FO1FBQ25FLEVBQUU7UUFDRix5Q0FBeUM7UUFDekMsK0NBQStDO1FBQy9DLEVBQUU7UUFDRiw0REFBNEQ7UUFDNUQsNERBQTREO1FBQzVELDJEQUEyRDtRQUMzRCxXQUFXO1FBQ1gsRUFBRTtRQUNGLG1FQUFtRTtRQUNuRSwrQkFBK0I7UUFDL0IsRUFBRTtRQUNGLGtEQUFrRDtRQUNsRCxFQUFFO1FBQ0YsMkRBQTJEO1FBQzNELHFEQUFxRDtRQUNyRCxFQUFFO1FBQ0YscUVBQXFFO1FBQ3JFLHlEQUF5RDtRQUN6RCxFQUFFO1FBQ0YseURBQXlEO1FBQ3pELDRFQUE0RTtRQUM1RSw0RUFBNEU7UUFDNUUsK0JBQStCO1FBQy9CLElBQ0UsWUFBWSxDQUFDLFlBQVksQ0FBQyxTQUFTLENBQUMsS0FBSyxTQUFTLENBQUMsS0FBSztZQUN4RCxRQUFRLENBQUMsb0JBQW9CLENBQUMsWUFBWSxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUMvRCxDQUFDO1lBQ0QsWUFBWSxDQUFDLFlBQVksQ0FBQyxTQUFTLEVBQUUsU0FBUyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQzNELENBQUM7YUFBTSxJQUFJLElBQUksQ0FBQyxtQkFBbUIsRUFBRSxDQUFDO1lBQ3BDLElBQUksQ0FBQywyQkFBNEIsQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUMvQyxDQUFDO2FBQU0sSUFDTCxhQUFhLENBQUMsMEJBQTBCO1lBQ3hDLFlBQVksQ0FBQyxZQUFZLENBQUMsU0FBUyxDQUFDLEtBQUssU0FBUyxDQUFDLE9BQU87WUFDMUQsQ0FBQyxZQUFZLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxDQUFDLHNCQUFzQixDQUFDLGVBQWUsQ0FBQyxFQUN6RSxDQUFDO1lBQ0Qsc0VBQXNFO1lBQ3RFLHVCQUF1QjtZQUN2QixZQUFZLENBQUMsWUFBWSxDQUFDLFNBQVMsRUFBRSxzQkFBc0IsQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDO1FBQ3RGLENBQUM7UUFFRCxvRUFBb0U7UUFDcEUsZ0VBQWdFO1FBQ2hFLHlCQUF5QjtRQUN6QixJQUFJLGFBQWEsR0FBbUIsWUFBWSxDQUFDLGdCQUFnQixDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQzdFLE9BQU8sYUFBYSxJQUFJLGFBQWEsS0FBSyxZQUFZLENBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUM7WUFDL0UsSUFBSSxDQUFDLHVCQUF1QixDQUFDLGFBQWEsRUFBRSxTQUFTLENBQUMsQ0FBQztZQUV2RCxJQUFJLFlBQVksQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQztnQkFDdEMsbUVBQW1FO2dCQUNuRSxtRUFBbUU7Z0JBQ25FLDJDQUEyQztnQkFDM0MsTUFBTTtZQUNSLENBQUM7WUFDRCxJQUFJLGFBQWEsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQztnQkFDbEMsYUFBYSxHQUFHLGFBQWEsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFZLENBQUM7Z0JBQ3pELFNBQVM7WUFDWCxDQUFDO1lBQ0QsSUFBSSxhQUFhLENBQUMsVUFBVSxFQUFFLFFBQVEsS0FBSyxvQkFBb0IsRUFBRSxDQUFDO2dCQUNoRSxhQUFhLEdBQUcsYUFBYSxDQUFDLFVBQTRCLENBQUM7WUFDN0QsQ0FBQztpQkFBTSxDQUFDO2dCQUNOLGFBQWEsR0FBSSxhQUFhLENBQUMsVUFBZ0MsRUFBRSxJQUFJLElBQUksSUFBSSxDQUFDO1lBQ2hGLENBQUM7UUFDSCxDQUFDO1FBRUQsTUFBTSxNQUFNLEdBQUcsWUFBWSxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUNqRCxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7WUFDWixtQkFBbUI7WUFDbkIsT0FBTztRQUNULENBQUM7UUFFRCxJQUFJLElBQUksQ0FBQyxtQkFBbUIsRUFBRSxDQUFDO1lBQzdCLElBQUksQ0FBQywwQkFBMkIsQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUM5QyxDQUFDO1FBRUQsZ0VBQWdFO1FBQ2hFLGdFQUFnRTtRQUNoRSwrQkFBK0I7UUFDL0IsSUFDRSxhQUFhLENBQUMscUJBQXFCO1lBQ25DLENBQUMsWUFBWSxDQUFDLFlBQVksQ0FBQyxTQUFTLENBQUMsS0FBSyxTQUFTLENBQUMsVUFBVTtnQkFDNUQsWUFBWSxDQUFDLFlBQVksQ0FBQyxTQUFTLENBQUMsS0FBSyxTQUFTLENBQUMsVUFBVTtnQkFDN0QsWUFBWSxDQUFDLFlBQVksQ0FBQyxTQUFTLENBQUMsS0FBSyxTQUFTLENBQUMsWUFBWTtnQkFDL0QsWUFBWSxDQUFDLFlBQVksQ0FBQyxTQUFTLENBQUMsS0FBSyxTQUFTLENBQUMsWUFBWSxDQUFDLEVBQ2xFLENBQUM7WUFDRCxnRUFBZ0U7WUFDaEUsZ0VBQWdFO1lBQ2hFLCtCQUErQjtZQUMvQixJQUNFLFFBQVEsQ0FBQyxtQkFBbUIsQ0FDMUIsWUFBWSxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsRUFDaEMsWUFBWSxDQUFDLFlBQVksQ0FBQyxTQUFTLENBQUMsRUFDcEMsWUFBWSxDQUFDLGdCQUFnQixDQUFDLE1BQU0sQ0FBQyxDQUN0QyxFQUNELENBQUM7Z0JBQ0Qsa0VBQWtFO2dCQUNsRSw0REFBNEQ7Z0JBQzVELDZEQUE2RDtnQkFDN0QsbUVBQW1FO2dCQUNuRSxnQ0FBZ0M7Z0JBQ2hDLE1BQU0sV0FBVyxHQUFHLFFBQVEsQ0FBQyx1QkFBdUIsQ0FDbEQsWUFBWSxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsRUFDaEMsWUFBWSxDQUFDLGdCQUFnQixDQUFDLE1BQU0sQ0FBQyxDQUN0QyxDQUFDO2dCQUNGLFlBQVksQ0FBQyxRQUFRLENBQUMsU0FBUyxFQUFFLFdBQVcsQ0FBQyxDQUFDO2dCQUM5QyxtRUFBbUU7Z0JBQ25FLHFFQUFxRTtnQkFDckUsd0JBQXdCO2dCQUN4QixZQUFZLENBQUMsZ0JBQWdCLENBQUMsU0FBUyxFQUFFLFlBQVksQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO1lBQ2xGLENBQUM7aUJBQU0sQ0FBQztnQkFDTixZQUFZLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQ3RDLENBQUM7UUFDSCxDQUFDO0lBQ0gsQ0FBQztJQUVEOzs7Ozs7Ozs7Ozs7O09BYUc7SUFDSyx1QkFBdUIsQ0FBQyxhQUFzQixFQUFFLFNBQWlDO1FBQ3ZGLE1BQU0sU0FBUyxHQUFHLFlBQVksQ0FBQyxhQUFhLEVBQUUsWUFBWSxDQUFDLFlBQVksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDO1FBRXBGLE1BQU0sVUFBVSxHQUFHLFNBQVMsQ0FBQyxZQUFZLENBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7UUFDbkUsSUFBSSxVQUFVLEtBQUssU0FBUyxFQUFFLENBQUM7WUFDN0IsWUFBWSxDQUFDLFNBQVMsQ0FBQyxTQUFTLEVBQUUsVUFBVSxFQUFFLGFBQWEsQ0FBQyxDQUFDO1FBQy9ELENBQUM7UUFFRCxJQUFJLElBQUksQ0FBQyxtQkFBbUIsRUFBRSxDQUFDO1lBQzdCLElBQUksQ0FBQyx1QkFBd0IsQ0FBQyxhQUFhLEVBQUUsU0FBUyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1FBQ3JFLENBQUM7UUFDRCxJQUFJLGFBQWEsQ0FBQywwQkFBMEIsRUFBRSxDQUFDO1lBQzdDLElBQ0UsWUFBWSxDQUFDLFlBQVksQ0FBQyxTQUFTLENBQUMsS0FBSyxzQkFBc0IsQ0FBQyxzQkFBc0I7Z0JBQ3RGLFNBQVMsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLEtBQUssU0FBUyxFQUN4QyxDQUFDO2dCQUNELG9FQUFvRTtnQkFDcEUsaUVBQWlFO2dCQUNqRSxvRUFBb0U7Z0JBQ3BFLGlCQUFpQjtnQkFDakIsaUVBQWlFO2dCQUNqRSxpRUFBaUU7Z0JBQ2pFLHdFQUF3RTtnQkFDeEUsb0VBQW9FO2dCQUNwRSwwQkFBMEI7Z0JBQzFCLFlBQVksQ0FBQyxTQUFTLENBQUMsU0FBUyxFQUFFLFNBQVMsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLEVBQUUsYUFBYSxDQUFDLENBQUM7WUFDL0UsQ0FBQztpQkFBTSxDQUFDO2dCQUNOLFlBQVksQ0FBQyx1QkFBdUIsQ0FBQyxhQUFhLEVBQUUsU0FBUyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQzVFLENBQUM7UUFDSCxDQUFDO0lBQ0gsQ0FBQztJQUVEOzs7Ozs7Ozs7Ozs7T0FZRztJQUNILFFBQVEsQ0FBQyxTQUFpQixFQUFFLGlCQUEwQjtRQUNwRCxJQUFJLFNBQVMsSUFBSSxJQUFJLENBQUMsYUFBYSxJQUFJLENBQUMsSUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUM7WUFDOUQsT0FBTztRQUNULENBQUM7UUFFRCxJQUNFLENBQUMsYUFBYSxDQUFDLHFCQUFxQjtZQUNwQyxDQUFDLFNBQVMsS0FBSyxTQUFTLENBQUMsVUFBVTtnQkFDakMsU0FBUyxLQUFLLFNBQVMsQ0FBQyxVQUFVO2dCQUNsQyxTQUFTLEtBQUssU0FBUyxDQUFDLFlBQVk7Z0JBQ3BDLFNBQVMsS0FBSyxTQUFTLENBQUMsWUFBWSxDQUFDLEVBQ3ZDLENBQUM7WUFDRCxPQUFPO1FBQ1QsQ0FBQztRQUVELE1BQU0sWUFBWSxHQUFHLENBQUMsU0FBaUIsRUFBRSxLQUFZLEVBQUUsU0FBa0IsRUFBRSxFQUFFO1lBQzNFLElBQUksQ0FBQyxXQUFXLENBQUMsU0FBUyxFQUFFLEtBQUssRUFBRSxTQUFTLENBQUMsQ0FBQztRQUNoRCxDQUFDLENBQUM7UUFFRixtREFBbUQ7UUFDbkQsSUFBSSxDQUFDLGFBQWEsQ0FBQyxTQUFTLENBQUMsR0FBRyxZQUFZLENBQUM7UUFFN0MsTUFBTSxnQkFBZ0IsR0FBRyxRQUFRLENBQUMsbUJBQW1CLENBQUMsaUJBQWlCLElBQUksU0FBUyxDQUFDLENBQUM7UUFFdEYsSUFBSSxnQkFBZ0IsS0FBSyxTQUFTLEVBQUUsQ0FBQztZQUNuQyxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsaUNBQWlDLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDbEYsVUFBVSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUMzQixJQUFJLENBQUMsaUNBQWlDLENBQUMsZ0JBQWdCLENBQUMsR0FBRyxVQUFVLENBQUM7UUFDeEUsQ0FBQztRQUVELElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxnQkFBZ0IsQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDLE9BQWdCLEVBQUUsRUFBRTtZQUM1RSxPQUFPLENBQUMsS0FBWSxFQUFFLEVBQUU7Z0JBQ3RCLFlBQVksQ0FBQyxTQUFTLEVBQUUsS0FBSyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBQzFDLENBQUMsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDO1FBRUgsd0VBQXdFO1FBQ3hFLGtDQUFrQztRQUNsQyxJQUFJLElBQUksQ0FBQyxvQkFBb0IsSUFBSSxTQUFTLEtBQUssU0FBUyxDQUFDLEtBQUssRUFBRSxDQUFDO1lBQy9ELElBQUksQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ25DLENBQUM7SUFDSCxDQUFDO0lBRUQ7Ozs7T0FJRztJQUNILGlCQUFpQjtRQUNmLDJFQUEyRTtRQUMzRSxrQkFBa0I7UUFDbEIsTUFBTSxpQkFBaUIsR0FBa0MsTUFBTSxDQUFDLEtBQUssQ0FBQztRQUN0RSxJQUFJLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztZQUN2QixPQUFPO1FBQ1QsQ0FBQztRQUVELG9DQUFvQztRQUNwQyxNQUFNLGVBQWUsR0FBNkIsaUJBQWlCLENBQUMsQ0FBQyxDQUFDO1FBQ3RFLEtBQUssSUFBSSxHQUFHLEdBQUcsQ0FBQyxFQUFFLEdBQUcsR0FBRyxlQUFlLENBQUMsTUFBTSxFQUFFLEdBQUcsRUFBRSxFQUFFLENBQUM7WUFDdEQsTUFBTSxjQUFjLEdBQTJCLGVBQWUsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNwRSxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsZ0NBQWdDLENBQUMsY0FBYyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQ25GLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxVQUFVLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQzNDLE1BQU0sU0FBUyxHQUFHLFlBQVksQ0FBQyxjQUFjLENBQUMsY0FBYyxDQUFDLENBQUM7Z0JBQzlELDhEQUE4RDtnQkFDOUQsc0NBQXNDO2dCQUN0QyxZQUFZLENBQUMsWUFBWSxDQUFDLFNBQVMsRUFBRSxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDcEQsSUFBSSxDQUFDLGVBQWUsQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUNsQyxDQUFDO1FBQ0gsQ0FBQztRQUVELCtCQUErQjtRQUMvQixNQUFNLGVBQWUsR0FBYSxpQkFBaUIsQ0FBQyxFQUFFLENBQUM7UUFDdkQsTUFBTSxpQkFBaUIsR0FBMkIsaUJBQWlCLENBQUMsQ0FBQyxDQUFDO1FBQ3RFLEtBQUssSUFBSSxHQUFHLEdBQUcsQ0FBQyxFQUFFLEdBQUcsR0FBRyxlQUFlLENBQUMsTUFBTSxFQUFFLEdBQUcsRUFBRSxFQUFFLENBQUM7WUFDdEQsTUFBTSxTQUFTLEdBQVcsZUFBZSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQy9DLE1BQU0sQ0FBQyxRQUFRLENBQUMsZUFBZSxDQUFDLG1CQUFtQixDQUFDLFNBQVMsRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO1FBQ3BGLENBQUM7UUFDRCxPQUFPLE1BQU0sQ0FBQyxLQUFLLENBQUM7SUFDdEIsQ0FBQztJQUVEOzs7T0FHRztJQUNLLGdDQUFnQyxDQUFDLGdCQUF3QjtRQUMvRCxNQUFNLFVBQVUsR0FBRyxFQUFFLENBQUM7UUFDdEIsSUFBSSxJQUFJLENBQUMsYUFBYSxDQUFDLGdCQUFnQixDQUFDLEVBQUUsQ0FBQztZQUN6QyxVQUFVLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLENBQUM7UUFDcEMsQ0FBQztRQUNELElBQUksSUFBSSxDQUFDLGlDQUFpQyxDQUFDLGdCQUFnQixDQUFDLEVBQUUsQ0FBQztZQUM3RCxVQUFVLENBQUMsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLGlDQUFpQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQztRQUMvRSxDQUFDO1FBQ0QsT0FBTyxVQUFVLENBQUM7SUFDcEIsQ0FBQztJQUVEOztPQUVHO0lBQ0gsT0FBTyxDQUFDLFNBQWlCO1FBQ3ZCLE9BQU8sSUFBSSxDQUFDLGFBQWEsQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUN2QyxDQUFDO0lBRUQ7Ozs7T0FJRztJQUNILE9BQU87UUFDTCxJQUFJLENBQUMsZ0JBQWlCLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDakMsSUFBSSxDQUFDLGdCQUFnQixHQUFHLElBQUksQ0FBQztRQUM3QixJQUFJLENBQUMsYUFBYSxHQUFHLEVBQUUsQ0FBQztRQUN4QixJQUFJLENBQUMsaUNBQWlDLEdBQUcsRUFBRSxDQUFDO1FBQzVDLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDO1FBQ3ZCLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxFQUFFLENBQUM7SUFDN0IsQ0FBQztJQUVEOzs7Ozs7OztPQVFHO0lBQ0gsa0JBQWtCLENBQUMsVUFBc0IsRUFBRSxXQUF3QjtRQUNqRSxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxXQUFXLENBQUMsQ0FBQztJQUNyQyxDQUFDO0lBRUQ7Ozs7T0FJRztJQUNILElBQUksQ0FBQyxVQUFzQixFQUFFLFdBQXdCO1FBQ25ELElBQUksQ0FBQyxVQUFVLEdBQUcsVUFBVSxDQUFDO1FBRTdCLElBQUksSUFBSSxDQUFDLGdCQUFnQixFQUFFLE1BQU0sRUFBRSxDQUFDO1lBQ2xDLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ3RELElBQUksQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDakQsQ0FBQztZQUNELElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxJQUFJLENBQUM7UUFDL0IsQ0FBQztJQUNILENBQUM7SUFFRDs7O09BR0c7SUFDSCxtQkFBbUI7UUFDakIsSUFBSSxDQUFDLHVCQUF1QixDQUMxQixZQUFZLENBQUMsMkJBQTJCLEVBQ3hDLFlBQVksQ0FBQywwQkFBMEIsRUFDdkMsWUFBWSxDQUFDLHVCQUF1QixDQUNyQyxDQUFDO0lBQ0osQ0FBQztJQUVEOzs7T0FHRztJQUNILHlCQUF5QjtRQUN2QixJQUFJLENBQUMsb0JBQW9CLEdBQUcsSUFBSSxDQUFDO1FBQ2pDLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLHVCQUF1QixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUN4RCxDQUFDO0lBRUQ7O09BRUc7SUFDSyx1QkFBdUIsQ0FDN0IsMkJBQTRFLEVBQzVFLDBCQUEwRSxFQUMxRSx1QkFBb0U7UUFFcEUsSUFBSSxDQUFDLG9CQUFvQixHQUFHLElBQUksQ0FBQztRQUNqQyxJQUFJLENBQUMsbUJBQW1CLEdBQUcsSUFBSSxDQUFDO1FBQ2hDLElBQUksQ0FBQywyQkFBMkIsR0FBRywyQkFBMkIsQ0FBQztRQUMvRCxJQUFJLENBQUMsMEJBQTBCLEdBQUcsMEJBQTBCLENBQUM7UUFDN0QsSUFBSSxDQUFDLHVCQUF1QixHQUFHLHVCQUF1QixDQUFDO0lBQ3pELENBQUM7O0FBR0g7Ozs7O0dBS0c7QUFDSCxNQUFNLFVBQVUsMkJBQTJCLENBQUMsYUFBNEI7SUFDdEUsYUFBYSxDQUFDLE1BQU0sRUFBRSxDQUNwQixZQUFZLENBQUMsMkJBQTJCLEVBQ3hDLFlBQVksQ0FBQywwQkFBMEIsRUFDdkMsWUFBWSxDQUFDLHVCQUF1QixDQUNyQyxDQUFDO0FBQ0osQ0FBQztBQUVEOzs7R0FHRztBQUNILFNBQVMsMkJBQTJCLENBQUMsU0FBaUM7SUFDcEUsT0FBTyxDQUNMLGFBQWEsQ0FBQywwQkFBMEI7UUFDeEMsWUFBWSxDQUFDLFlBQVksQ0FBQyxTQUFTLENBQUMsS0FBSyxzQkFBc0IsQ0FBQyxzQkFBc0IsQ0FDdkYsQ0FBQztBQUNKLENBQUM7QUFFRDs7O0dBR0c7QUFDSCxTQUFTLHFDQUFxQyxDQUM1QyxhQUFzQixFQUN0QixTQUFpQztJQUVqQyx5RUFBeUU7SUFDekUsNEVBQTRFO0lBQzVFLHlFQUF5RTtJQUN6RSxpRUFBaUU7SUFDakUsT0FBTyxDQUNMLGFBQWEsQ0FBQyxPQUFPLEtBQUssR0FBRztRQUM3QixDQUFDLFlBQVksQ0FBQyxZQUFZLENBQUMsU0FBUyxDQUFDLEtBQUssU0FBUyxDQUFDLEtBQUs7WUFDdkQsWUFBWSxDQUFDLFlBQVksQ0FBQyxTQUFTLENBQUMsS0FBSyxTQUFTLENBQUMsUUFBUSxDQUFDLENBQy9ELENBQUM7QUFDSixDQUFDO0FBRUQ7Ozs7Ozs7OztHQVNHO0FBQ0gsTUFBTSxVQUFVLFlBQVksQ0FBQyxhQUFzQixFQUFFLFNBQWU7SUFDbEUsSUFBSSxTQUFTLEdBQXdDLEtBQUssQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUFDLENBQUM7SUFDOUUsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO1FBQ2YsTUFBTSxpQkFBaUIsR0FBRyxPQUFPLENBQUMsYUFBYSxFQUFFLFNBQVMsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUNyRSxJQUFJLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztZQUN2QixTQUFTLEdBQUcsZ0JBQWdCLENBQUM7WUFDN0IsS0FBSyxDQUFDLEdBQUcsQ0FBQyxhQUFhLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFDdEMsQ0FBQzthQUFNLENBQUM7WUFDTixTQUFTLEdBQUcsS0FBSyxDQUFDLFNBQVMsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1lBQy9DLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztnQkFDZixTQUFTLEdBQUcsRUFBRSxDQUFDO2dCQUNmLE1BQU0sTUFBTSxHQUFHLGlCQUFpQixDQUFDLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO2dCQUN6RCxLQUFLLElBQUksR0FBRyxHQUFHLENBQUMsRUFBRSxHQUFHLEdBQUcsTUFBTSxDQUFDLE1BQU0sRUFBRSxHQUFHLEVBQUUsRUFBRSxDQUFDO29CQUM3QyxNQUFNLEtBQUssR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7b0JBQzFCLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQzt3QkFDWCxTQUFTO29CQUNYLENBQUM7b0JBQ0QsTUFBTSxLQUFLLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsc0JBQXNCLENBQUMsQ0FBQztvQkFDekQsTUFBTSxRQUFRLEdBQUcsS0FBSyxLQUFLLENBQUMsQ0FBQyxDQUFDO29CQUM5QixNQUFNLElBQUksR0FBRyxRQUFRLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxrQkFBa0IsQ0FBQztvQkFDaEYsTUFBTSxNQUFNLEdBQUcsUUFBUSxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDO29CQUN0RSxTQUFTLENBQUMsSUFBSSxDQUFDLEdBQUcsTUFBTSxDQUFDO2dCQUMzQixDQUFDO2dCQUNELEtBQUssQ0FBQyxTQUFTLENBQUMsaUJBQWlCLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDaEQsQ0FBQztZQUNELHFFQUFxRTtZQUNyRSwrQ0FBK0M7WUFDL0MsSUFBSSxhQUFhLENBQUMsbUJBQW1CLEVBQUUsQ0FBQztnQkFDdEMsTUFBTSxJQUFJLEdBQUcsU0FBUyxDQUFDO2dCQUN2QixTQUFTLEdBQUcsRUFBRSxDQUFDO2dCQUNmLEtBQUssTUFBTSxJQUFJLElBQUksSUFBSSxFQUFFLENBQUM7b0JBQ3hCLFNBQVMsQ0FBQyxJQUFJLENBQUMsR0FBRyx1QkFBdUIsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsYUFBYSxFQUFFLFNBQVMsQ0FBQyxDQUFDO2dCQUNsRixDQUFDO1lBQ0gsQ0FBQztZQUNELEtBQUssQ0FBQyxHQUFHLENBQUMsYUFBYSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1FBQ3RDLENBQUM7SUFDSCxDQUFDO0lBQ0QsT0FBTyxTQUFTLENBQUM7QUFDbkIsQ0FBQztBQUVEOzs7Ozs7Ozs7Ozs7O0dBYUc7QUFDSCxTQUFTLHVCQUF1QixDQUFDLE1BQWMsRUFBRSxLQUFjLEVBQUUsU0FBZTtJQUM5RSxJQUFJLGFBQWEsQ0FBQyxtQkFBbUIsRUFBRSxDQUFDO1FBQ3RDLElBQUksa0JBQWtCLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQztZQUMvQixPQUFPLE1BQU0sQ0FBQztRQUNoQixDQUFDO1FBRUQsSUFBSSxJQUFJLEdBQWdCLEtBQUssQ0FBQztRQUM5QixPQUFPLElBQUksRUFBRSxDQUFDO1lBQ1osTUFBTSxTQUFTLEdBQUcsdUJBQXVCLENBQUMsSUFBZSxDQUFDLENBQUM7WUFDM0QsSUFBSSxTQUFTLEVBQUUsQ0FBQztnQkFDZCxPQUFPLFNBQVMsR0FBRyxJQUFJLENBQUMsMEJBQTBCLEdBQUcsTUFBTSxDQUFDO1lBQzlELENBQUM7WUFFRCx1Q0FBdUM7WUFDdkMsSUFBSSxJQUFJLEtBQUssU0FBUyxFQUFFLENBQUM7Z0JBQ3ZCLE1BQU07WUFDUixDQUFDO1lBRUQsSUFBSSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUM7UUFDekIsQ0FBQztJQUNILENBQUM7SUFFRCxPQUFPLE1BQU0sQ0FBQztBQUNoQixDQUFDO0FBRUQ7O0dBRUc7QUFDSCxTQUFTLGtCQUFrQixDQUFDLE1BQWM7SUFDeEMsT0FBTyxNQUFNLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQywwQkFBMEIsQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUM5RCxDQUFDO0FBRUQ7Ozs7O0dBS0c7QUFDSCxTQUFTLHVCQUF1QixDQUFDLE9BQWdCO0lBQy9DLElBQUksU0FBUyxHQUFHLEtBQUssQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDNUMsOERBQThEO0lBQzlELHVFQUF1RTtJQUN2RSxtRUFBbUU7SUFDbkUsNkNBQTZDO0lBQzdDLElBQUksU0FBUyxLQUFLLFNBQVMsRUFBRSxDQUFDO1FBQzVCLFNBQVMsR0FBRyxPQUFPLENBQUMsT0FBTyxFQUFFLFNBQVMsQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUNwRCxLQUFLLENBQUMsWUFBWSxDQUFDLE9BQU8sRUFBRSxTQUFTLENBQUMsQ0FBQztJQUN6QyxDQUFDO0lBQ0QsT0FBTyxTQUFTLENBQUM7QUFDbkIsQ0FBQztBQUVEOzs7Ozs7O0dBT0c7QUFDSCxTQUFTLE9BQU8sQ0FBQyxPQUFnQixFQUFFLFNBQWlCO0lBQ2xELElBQUksS0FBSyxHQUFHLElBQUksQ0FBQztJQUNqQixzREFBc0Q7SUFDdEQsOERBQThEO0lBQzlELDZEQUE2RDtJQUM3RCwyREFBMkQ7SUFDM0QsV0FBVztJQUNYLGlFQUFpRTtJQUNqRSw0RUFBNEU7SUFDNUUsMEJBQTBCO0lBQzFCLElBQUksY0FBYyxJQUFJLE9BQU8sRUFBRSxDQUFDO1FBQzlCLEtBQUssR0FBRyxPQUFPLENBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBQyxDQUFDO0lBQzFDLENBQUM7SUFDRCxPQUFPLEtBQUssQ0FBQztBQUNmLENBQUM7QUFFRDs7Ozs7O0dBTUc7QUFDSCxTQUFTLFVBQVUsQ0FBQyxHQUFXO0lBQzdCLElBQUksT0FBTyxNQUFNLENBQUMsU0FBUyxDQUFDLElBQUksS0FBSyxVQUFVLEVBQUUsQ0FBQztRQUNoRCxPQUFPLEdBQUcsQ0FBQyxJQUFJLEVBQUUsQ0FBQztJQUNwQixDQUFDO0lBRUQsTUFBTSxXQUFXLEdBQUcsR0FBRyxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLENBQUM7SUFDNUMsT0FBTyxXQUFXLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsQ0FBQztBQUN6QyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbi8qKlxuICogQGZpbGVvdmVydmlldyBJbXBsZW1lbnRzIHRoZSBsb2NhbCBldmVudCBoYW5kbGluZyBjb250cmFjdC4gVGhpc1xuICogYWxsb3dzIERPTSBvYmplY3RzIGluIGEgY29udGFpbmVyIHRoYXQgZW50ZXJzIGludG8gdGhpcyBjb250cmFjdCB0b1xuICogZGVmaW5lIGV2ZW50IGhhbmRsZXJzIHdoaWNoIGFyZSBleGVjdXRlZCBpbiBhIGxvY2FsIGNvbnRleHQuXG4gKlxuICogT25lIEV2ZW50Q29udHJhY3QgaW5zdGFuY2UgY2FuIG1hbmFnZSB0aGUgY29udHJhY3QgZm9yIG11bHRpcGxlXG4gKiBjb250YWluZXJzLCB3aGljaCBhcmUgYWRkZWQgdXNpbmcgdGhlIGFkZENvbnRhaW5lcigpIG1ldGhvZC5cbiAqXG4gKiBFdmVudHMgY2FuIGJlIHJlZ2lzdGVyZWQgdXNpbmcgdGhlIGFkZEV2ZW50KCkgbWV0aG9kLlxuICpcbiAqIEEgRGlzcGF0Y2hlciBpcyBhZGRlZCB1c2luZyB0aGUgcmVnaXN0ZXJEaXNwYXRjaGVyKCkgbWV0aG9kLiBVbnRpbCB0aGVyZSBpc1xuICogYSBkaXNwYXRjaGVyLCBldmVudHMgYXJlIHF1ZXVlZC4gVGhlIGlkZWEgaXMgdGhhdCB0aGUgRXZlbnRDb250cmFjdFxuICogY2xhc3MgaXMgaW5saW5lZCBpbiB0aGUgSFRNTCBvZiB0aGUgdG9wIGxldmVsIHBhZ2UgYW5kIGluc3RhbnRpYXRlZFxuICogcmlnaHQgYWZ0ZXIgdGhlIHN0YXJ0IG9mIDxib2R5Pi4gVGhlIERpc3BhdGNoZXIgY2xhc3MgaXMgY29udGFpbmVkXG4gKiBpbiB0aGUgZXh0ZXJuYWwgZGVmZXJyZWQganMsIGFuZCBpbnN0YW50aWF0ZWQgYW5kIHJlZ2lzdGVyZWQgd2l0aFxuICogRXZlbnRDb250cmFjdCB3aGVuIHRoZSBleHRlcm5hbCBqYXZhc2NyaXB0IGluIHRoZSBwYWdlIGxvYWRzLiBUaGVcbiAqIGV4dGVybmFsIGphdmFzY3JpcHQgd2lsbCBhbHNvIHJlZ2lzdGVyIHRoZSBqc2FjdGlvbiBoYW5kbGVycywgd2hpY2hcbiAqIHRoZW4gcGljayB1cCB0aGUgcXVldWVkIGV2ZW50cyBhdCB0aGUgdGltZSBvZiByZWdpc3RyYXRpb24uXG4gKlxuICogU2luY2UgdGhpcyBjbGFzcyBpcyBtZWFudCB0byBiZSBpbmxpbmVkIGluIHRoZSBtYWluIHBhZ2UgSFRNTCwgdGhlXG4gKiBzaXplIG9mIHRoZSBiaW5hcnkgY29tcGlsZWQgZnJvbSB0aGlzIGZpbGUgTVVTVCBiZSBrZXB0IGFzIHNtYWxsIGFzXG4gKiBwb3NzaWJsZSBhbmQgdGh1cyBpdHMgZGVwZW5kZW5jaWVzIHRvIGEgbWluaW11bS5cbiAqL1xuXG5pbXBvcnQgKiBhcyBhMTF5Q2xpY2tMaWIgZnJvbSAnLi9hMTF5X2NsaWNrJztcbmltcG9ydCB7QXR0cmlidXRlIGFzIEFjY2Vzc2liaWxpdHlBdHRyaWJ1dGV9IGZyb20gJy4vYWNjZXNzaWJpbGl0eSc7XG5pbXBvcnQge0F0dHJpYnV0ZX0gZnJvbSAnLi9hdHRyaWJ1dGUnO1xuaW1wb3J0ICogYXMgY2FjaGUgZnJvbSAnLi9jYWNoZSc7XG5pbXBvcnQge0NoYXJ9IGZyb20gJy4vY2hhcic7XG5pbXBvcnQge0Vhcmx5SnNhY3Rpb25EYXRhfSBmcm9tICcuL2Vhcmx5ZXZlbnRjb250cmFjdCc7XG5pbXBvcnQgKiBhcyBldmVudExpYiBmcm9tICcuL2V2ZW50JztcbmltcG9ydCB7RXZlbnRDb250cmFjdENvbnRhaW5lck1hbmFnZXJ9IGZyb20gJy4vZXZlbnRfY29udHJhY3RfY29udGFpbmVyJztcbmltcG9ydCB7XG4gIEExMVlfQ0xJQ0tfU1VQUE9SVCxcbiAgQTExWV9TVVBQT1JUX0lOX0RJU1BBVENIRVIsXG4gIENVU1RPTV9FVkVOVF9TVVBQT1JULFxuICBKU05BTUVTUEFDRV9TVVBQT1JULFxuICBNT1VTRV9TUEVDSUFMX1NVUFBPUlQsXG4gIFNUT1BfUFJPUEFHQVRJT04sXG59IGZyb20gJy4vZXZlbnRfY29udHJhY3RfZGVmaW5lcyc7XG5pbXBvcnQgKiBhcyBldmVudEluZm9MaWIgZnJvbSAnLi9ldmVudF9pbmZvJztcbmltcG9ydCB7RXZlbnRUeXBlfSBmcm9tICcuL2V2ZW50X3R5cGUnO1xuaW1wb3J0IHtQcm9wZXJ0eX0gZnJvbSAnLi9wcm9wZXJ0eSc7XG5pbXBvcnQge1Jlc3RyaWN0aW9ufSBmcm9tICcuL3Jlc3RyaWN0aW9uJztcblxuLyoqXG4gKiBUaGUgQVBJIG9mIGFuIEV2ZW50Q29udHJhY3QgdGhhdCBpcyBzYWZlIHRvIGNhbGwgZnJvbSBhbnkgY29tcGlsYXRpb24gdW5pdC5cbiAqL1xuZXhwb3J0IGRlY2xhcmUgaW50ZXJmYWNlIFVucmVuYW1lZEV2ZW50Q29udHJhY3Qge1xuICAvLyBBbGlhcyBmb3IgSnNjdGlvbiBFdmVudENvbnRyYWN0IHJlZ2lzdGVyRGlzcGF0Y2hlci5cbiAgZWNyZChkaXNwYXRjaGVyOiBEaXNwYXRjaGVyLCByZXN0cmljdGlvbjogUmVzdHJpY3Rpb24pOiB2b2lkO1xuICAvLyBVbnJlbmFtZWQgZnVuY3Rpb24uIEFiYnJldmlhdGlvbiBmb3IgYGV2ZW50Q29udHJhY3QuYWRkQTExeUNsaWNrU3VwcG9ydGAuXG4gIGVjYWFjcz86IChcbiAgICB1cGRhdGVFdmVudEluZm9Gb3JBMTF5Q2xpY2s6IHR5cGVvZiBhMTF5Q2xpY2tMaWIudXBkYXRlRXZlbnRJbmZvRm9yQTExeUNsaWNrLFxuICAgIHByZXZlbnREZWZhdWx0Rm9yQTExeUNsaWNrOiB0eXBlb2YgYTExeUNsaWNrTGliLnByZXZlbnREZWZhdWx0Rm9yQTExeUNsaWNrLFxuICAgIHBvcHVsYXRlQ2xpY2tPbmx5QWN0aW9uOiB0eXBlb2YgYTExeUNsaWNrTGliLnBvcHVsYXRlQ2xpY2tPbmx5QWN0aW9uLFxuICApID0+IHZvaWQ7XG59XG5cbi8qKiBBIGZ1bmN0aW9uIHRoYXQgaXMgY2FsbGVkIHRvIGhhbmRsZSBldmVudHMgY2FwdHVyZWQgYnkgdGhlIEV2ZW50Q29udHJhY3QuICovXG5leHBvcnQgdHlwZSBEaXNwYXRjaGVyID0gKFxuICBldmVudEluZm86IGV2ZW50SW5mb0xpYi5FdmVudEluZm8sXG4gIGdsb2JhbERpc3BhdGNoPzogYm9vbGVhbixcbikgPT4gZXZlbnRJbmZvTGliLkV2ZW50SW5mbyB8IHZvaWQ7XG5cbi8qKlxuICogQSBmdW5jdGlvbiB0aGF0IGhhbmRsZXMgYW4gZXZlbnQgZGlzcGF0Y2hlZCBmcm9tIHRoZSBicm93c2VyLlxuICpcbiAqIGV2ZW50VHlwZTogTWF5IGRpZmZlciBmcm9tIGBldmVudC50eXBlYCBpZiBKU0FjdGlvbiB1c2VzIGFcbiAqIHNob3J0LWhhbmQgbmFtZSBvciBpcyBwYXRjaGluZyBvdmVyIGFuIG5vbi1idWJibGluZyBldmVudCB3aXRoIGEgYnViYmxpbmdcbiAqIHZhcmlhbnQuXG4gKiBldmVudDogVGhlIG5hdGl2ZSBicm93c2VyIGV2ZW50LlxuICogY29udGFpbmVyOiBUaGUgY29udGFpbmVyIGZvciB0aGlzIGRpc3BhdGNoLlxuICovXG50eXBlIEV2ZW50SGFuZGxlciA9IChldmVudFR5cGU6IHN0cmluZywgZXZlbnQ6IEV2ZW50LCBjb250YWluZXI6IEVsZW1lbnQpID0+IHZvaWQ7XG5cbmNvbnN0IERFRkFVTFRfRVZFTlRfVFlQRTogc3RyaW5nID0gRXZlbnRUeXBlLkNMSUNLO1xuXG4vKipcbiAqIFNpbmNlIG1hcHMgZnJvbSBldmVudCB0byBhY3Rpb24gYXJlIGltbXV0YWJsZSB3ZSBjYW4gdXNlIGEgc2luZ2xlIG1hcFxuICogdG8gcmVwcmVzZW50IHRoZSBlbXB0eSBtYXAuXG4gKi9cbmNvbnN0IEVNUFRZX0FDVElPTl9NQVA6IHtba2V5OiBzdHJpbmddOiBzdHJpbmd9ID0ge307XG5cbi8qKlxuICogVGhpcyByZWd1bGFyIGV4cHJlc3Npb24gbWF0Y2hlcyBhIHNlbWljb2xvbi5cbiAqL1xuY29uc3QgUkVHRVhQX1NFTUlDT0xPTiA9IC9cXHMqO1xccyovO1xuXG4vKipcbiAqIEV2ZW50Q29udHJhY3QgaW50ZXJjZXB0cyBldmVudHMgaW4gdGhlIGJ1YmJsaW5nIHBoYXNlIGF0IHRoZVxuICogYm91bmRhcnkgb2YgYSBjb250YWluZXIgZWxlbWVudCwgYW5kIG1hcHMgdGhlbSB0byBnZW5lcmljIGFjdGlvbnNcbiAqIHdoaWNoIGFyZSBzcGVjaWZpZWQgdXNpbmcgdGhlIGN1c3RvbSBqc2FjdGlvbiBhdHRyaWJ1dGUgaW5cbiAqIEhUTUwuIEJlaGF2aW9yIG9mIHRoZSBhcHBsaWNhdGlvbiBpcyB0aGVuIHNwZWNpZmllZCBpbiB0ZXJtcyBvZlxuICogaGFuZGxlciBmb3Igc3VjaCBhY3Rpb25zLCBjZi4ganNhY3Rpb24uRGlzcGF0Y2hlciBpbiBkaXNwYXRjaGVyLmpzLlxuICpcbiAqIFRoaXMgaGFzIHNldmVyYWwgYmVuZWZpdHM6ICgxKSBObyBET00gZXZlbnQgaGFuZGxlcnMgbmVlZCB0byBiZVxuICogcmVnaXN0ZXJlZCBvbiB0aGUgc3BlY2lmaWMgZWxlbWVudHMgaW4gdGhlIFVJLiAoMikgVGhlIHNldCBvZlxuICogZXZlbnRzIHRoYXQgdGhlIGFwcGxpY2F0aW9uIGhhcyB0byBoYW5kbGUgY2FuIGJlIHNwZWNpZmllZCBpbiB0ZXJtc1xuICogb2YgdGhlIHNlbWFudGljcyBvZiB0aGUgYXBwbGljYXRpb24sIHJhdGhlciB0aGFuIGluIHRlcm1zIG9mIERPTVxuICogZXZlbnRzLiAoMykgSW52b2NhdGlvbiBvZiBoYW5kbGVycyBjYW4gYmUgZGVsYXllZCBhbmQgaGFuZGxlcnMgY2FuXG4gKiBiZSBkZWxheSBsb2FkZWQgaW4gYSBnZW5lcmljIHdheS5cbiAqL1xuZXhwb3J0IGNsYXNzIEV2ZW50Q29udHJhY3QgaW1wbGVtZW50cyBVbnJlbmFtZWRFdmVudENvbnRyYWN0IHtcbiAgc3RhdGljIENVU1RPTV9FVkVOVF9TVVBQT1JUID0gQ1VTVE9NX0VWRU5UX1NVUFBPUlQ7XG4gIHN0YXRpYyBTVE9QX1BST1BBR0FUSU9OID0gU1RPUF9QUk9QQUdBVElPTjtcbiAgc3RhdGljIEExMVlfU1VQUE9SVF9JTl9ESVNQQVRDSEVSID0gQTExWV9TVVBQT1JUX0lOX0RJU1BBVENIRVI7XG4gIHN0YXRpYyBBMTFZX0NMSUNLX1NVUFBPUlQgPSBBMTFZX0NMSUNLX1NVUFBPUlQ7XG4gIHN0YXRpYyBNT1VTRV9TUEVDSUFMX1NVUFBPUlQgPSBNT1VTRV9TUEVDSUFMX1NVUFBPUlQ7XG4gIHN0YXRpYyBKU05BTUVTUEFDRV9TVVBQT1JUID0gSlNOQU1FU1BBQ0VfU1VQUE9SVDtcblxuICBwcml2YXRlIGNvbnRhaW5lck1hbmFnZXI6IEV2ZW50Q29udHJhY3RDb250YWluZXJNYW5hZ2VyIHwgbnVsbDtcblxuICAvKipcbiAgICogVGhlIERPTSBldmVudHMgd2hpY2ggdGhpcyBjb250cmFjdCBjb3ZlcnMuIFVzZWQgdG8gcHJldmVudCBkb3VibGVcbiAgICogcmVnaXN0cmF0aW9uIG9mIGV2ZW50IHR5cGVzLiBUaGUgdmFsdWUgb2YgdGhlIG1hcCBpcyB0aGVcbiAgICogaW50ZXJuYWxseSBjcmVhdGVkIERPTSBldmVudCBoYW5kbGVyIGZ1bmN0aW9uIHRoYXQgaGFuZGxlcyB0aGVcbiAgICogRE9NIGV2ZW50cy4gU2VlIGFkZEV2ZW50KCkuXG4gICAqXG4gICAqL1xuICBwcml2YXRlIGV2ZW50SGFuZGxlcnM6IHtba2V5OiBzdHJpbmddOiBFdmVudEhhbmRsZXJ9ID0ge307XG5cbiAgcHJpdmF0ZSBicm93c2VyRXZlbnRUeXBlVG9FeHRyYUV2ZW50VHlwZXM6IHtba2V5OiBzdHJpbmddOiBzdHJpbmdbXX0gPSB7fTtcblxuICAvKipcbiAgICogVGhlIGRpc3BhdGNoZXIgZnVuY3Rpb24uIEV2ZW50cyBhcmUgcGFzc2VkIHRvIHRoaXMgZnVuY3Rpb24gZm9yXG4gICAqIGhhbmRsaW5nIG9uY2UgaXQgd2FzIHNldCB1c2luZyB0aGUgcmVnaXN0ZXJEaXNwYXRjaGVyKCkgbWV0aG9kLiBUaGlzIGlzXG4gICAqIGRvbmUgYmVjYXVzZSB0aGUgZnVuY3Rpb24gaXMgcGFzc2VkIGZyb20gYW5vdGhlciBqc2JpbmFyeSwgc28gcGFzc2luZyB0aGVcbiAgICogaW5zdGFuY2UgYW5kIGludm9raW5nIHRoZSBtZXRob2QgaGVyZSB3b3VsZCByZXF1aXJlIHRvIGxlYXZlIHRoZSBtZXRob2RcbiAgICogdW5vYmZ1c2NhdGVkLlxuICAgKi9cbiAgcHJpdmF0ZSBkaXNwYXRjaGVyOiBEaXNwYXRjaGVyIHwgbnVsbCA9IG51bGw7XG5cbiAgLyoqXG4gICAqIFRoZSBsaXN0IG9mIHN1c3BlbmRlZCBgRXZlbnRJbmZvYCB0aGF0IHdpbGwgYmUgZGlzcGF0Y2hlZFxuICAgKiBhcyBzb29uIGFzIHRoZSBgRGlzcGF0Y2hlcmAgaXMgcmVnaXN0ZXJlZC5cbiAgICovXG4gIHByaXZhdGUgcXVldWVkRXZlbnRJbmZvczogZXZlbnRJbmZvTGliLkV2ZW50SW5mb1tdIHwgbnVsbCA9IFtdO1xuXG4gIC8qKiBXaGV0aGVyIGExMXkgY2xpY2sgc3VwcG9ydCBoYXMgYmVlbiBsb2FkZWQgb3Igbm90LiAqL1xuICBwcml2YXRlIGhhc0ExMXlDbGlja1N1cHBvcnQgPSBmYWxzZTtcbiAgLyoqIFdoZXRoZXIgdG8gYWRkIGFuIGExMXkgY2xpY2sgbGlzdGVuZXIuICovXG4gIHByaXZhdGUgYWRkQTExeUNsaWNrTGlzdGVuZXIgPSBFdmVudENvbnRyYWN0LkExMVlfU1VQUE9SVF9JTl9ESVNQQVRDSEVSO1xuXG4gIHByaXZhdGUgdXBkYXRlRXZlbnRJbmZvRm9yQTExeUNsaWNrPzogKGV2ZW50SW5mbzogZXZlbnRJbmZvTGliLkV2ZW50SW5mbykgPT4gdm9pZCA9IHVuZGVmaW5lZDtcblxuICBwcml2YXRlIHByZXZlbnREZWZhdWx0Rm9yQTExeUNsaWNrPzogKGV2ZW50SW5mbzogZXZlbnRJbmZvTGliLkV2ZW50SW5mbykgPT4gdm9pZCA9IHVuZGVmaW5lZDtcblxuICBwcml2YXRlIHBvcHVsYXRlQ2xpY2tPbmx5QWN0aW9uPzogKFxuICAgIGFjdGlvbkVsZW1lbnQ6IEVsZW1lbnQsXG4gICAgZXZlbnRJbmZvOiBldmVudEluZm9MaWIuRXZlbnRJbmZvLFxuICAgIGFjdGlvbk1hcDoge1trZXk6IHN0cmluZ106IHN0cmluZ30sXG4gICkgPT4gdm9pZCA9IHVuZGVmaW5lZDtcblxuICBlY2FhY3M/OiAoXG4gICAgdXBkYXRlRXZlbnRJbmZvRm9yQTExeUNsaWNrOiB0eXBlb2YgYTExeUNsaWNrTGliLnVwZGF0ZUV2ZW50SW5mb0ZvckExMXlDbGljayxcbiAgICBwcmV2ZW50RGVmYXVsdEZvckExMXlDbGljazogdHlwZW9mIGExMXlDbGlja0xpYi5wcmV2ZW50RGVmYXVsdEZvckExMXlDbGljayxcbiAgICBwb3B1bGF0ZUNsaWNrT25seUFjdGlvbjogdHlwZW9mIGExMXlDbGlja0xpYi5wb3B1bGF0ZUNsaWNrT25seUFjdGlvbixcbiAgKSA9PiB2b2lkO1xuXG4gIGNvbnN0cnVjdG9yKGNvbnRhaW5lck1hbmFnZXI6IEV2ZW50Q29udHJhY3RDb250YWluZXJNYW5hZ2VyKSB7XG4gICAgdGhpcy5jb250YWluZXJNYW5hZ2VyID0gY29udGFpbmVyTWFuYWdlcjtcbiAgICBpZiAoRXZlbnRDb250cmFjdC5DVVNUT01fRVZFTlRfU1VQUE9SVCkge1xuICAgICAgdGhpcy5hZGRFdmVudChFdmVudFR5cGUuQ1VTVE9NKTtcbiAgICB9XG4gICAgaWYgKEV2ZW50Q29udHJhY3QuQTExWV9DTElDS19TVVBQT1JUKSB7XG4gICAgICAvLyBBZGQgYTExeSBjbGljayBzdXBwb3J0IHRvIHRoZSBgRXZlbnRDb250cmFjdGAuXG4gICAgICB0aGlzLmFkZEExMXlDbGlja1N1cHBvcnQoKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGhhbmRsZUV2ZW50KGV2ZW50VHlwZTogc3RyaW5nLCBldmVudDogRXZlbnQsIGNvbnRhaW5lcjogRWxlbWVudCkge1xuICAgIGNvbnN0IGV2ZW50SW5mbyA9IGV2ZW50SW5mb0xpYi5jcmVhdGVFdmVudEluZm9Gcm9tUGFyYW1ldGVycyhcbiAgICAgIC8qIGV2ZW50VHlwZT0gKi8gZXZlbnRUeXBlLFxuICAgICAgLyogZXZlbnQ9ICovIGV2ZW50LFxuICAgICAgLyogdGFyZ2V0RWxlbWVudD0gKi8gZXZlbnQudGFyZ2V0IGFzIEVsZW1lbnQsXG4gICAgICAvKiBjb250YWluZXI9ICovIGNvbnRhaW5lcixcbiAgICAgIC8qIHRpbWVzdGFtcD0gKi8gRGF0ZS5ub3coKSxcbiAgICApO1xuICAgIHRoaXMuaGFuZGxlRXZlbnRJbmZvKGV2ZW50SW5mbyk7XG4gIH1cblxuICAvKipcbiAgICogSGFuZGxlIGFuIGBFdmVudEluZm9gLlxuICAgKiBAcGFyYW0gYWxsb3dSZWhhbmRsaW5nIFVzZWQgaW4gdGhlIGNhc2Ugb2YgYTExeSBjbGljayBjYXN0aW5nIHRvIHByZXZlbnRcbiAgICogdXMgZnJvbSB0cnlpbmcgdG8gcmVoYW5kbGUgaW4gYW4gaW5maW5pdGUgbG9vcC5cbiAgICovXG4gIHByaXZhdGUgaGFuZGxlRXZlbnRJbmZvKGV2ZW50SW5mbzogZXZlbnRJbmZvTGliLkV2ZW50SW5mbywgYWxsb3dSZWhhbmRsaW5nID0gdHJ1ZSkge1xuICAgIGlmICghdGhpcy5kaXNwYXRjaGVyKSB7XG4gICAgICAvLyBBbGwgZXZlbnRzIGFyZSBxdWV1ZWQgd2hlbiB0aGUgZGlzcGF0Y2hlciBpc24ndCB5ZXQgbG9hZGVkLlxuICAgICAgZXZlbnRJbmZvTGliLnNldElzUmVwbGF5KGV2ZW50SW5mbywgdHJ1ZSk7XG4gICAgICB0aGlzLnF1ZXVlZEV2ZW50SW5mb3M/LnB1c2goZXZlbnRJbmZvKTtcbiAgICB9XG4gICAgaWYgKFxuICAgICAgRXZlbnRDb250cmFjdC5DVVNUT01fRVZFTlRfU1VQUE9SVCAmJlxuICAgICAgZXZlbnRJbmZvTGliLmdldEV2ZW50VHlwZShldmVudEluZm8pID09PSBFdmVudFR5cGUuQ1VTVE9NXG4gICAgKSB7XG4gICAgICBjb25zdCBkZXRhaWwgPSAoZXZlbnRJbmZvTGliLmdldEV2ZW50KGV2ZW50SW5mbykgYXMgQ3VzdG9tRXZlbnQpLmRldGFpbDtcbiAgICAgIC8vIEZvciBjdXN0b20gZXZlbnRzLCB1c2UgYSBzZWNvbmRhcnkgZGlzcGF0Y2ggYmFzZWQgb24gdGhlIGludGVybmFsXG4gICAgICAvLyBjdXN0b20gdHlwZSBvZiB0aGUgZXZlbnQuXG4gICAgICBpZiAoIWRldGFpbCB8fCAhZGV0YWlsWydfdHlwZSddKSB7XG4gICAgICAgIC8vIFRoaXMgc2hvdWxkIG5ldmVyIGhhcHBlbi5cbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgZXZlbnRJbmZvTGliLnNldEV2ZW50VHlwZShldmVudEluZm8sIGRldGFpbFsnX3R5cGUnXSk7XG4gICAgfVxuXG4gICAgdGhpcy5wb3B1bGF0ZUFjdGlvbihldmVudEluZm8pO1xuXG4gICAgaWYgKFxuICAgICAgdGhpcy5kaXNwYXRjaGVyICYmXG4gICAgICAhZXZlbnRJbmZvTGliLmdldEV2ZW50KGV2ZW50SW5mbylbQWNjZXNzaWJpbGl0eUF0dHJpYnV0ZS5TS0lQX0dMT0JBTF9ESVNQQVRDSF1cbiAgICApIHtcbiAgICAgIGNvbnN0IGdsb2JhbEV2ZW50SW5mbzogZXZlbnRJbmZvTGliLkV2ZW50SW5mbyA9IGV2ZW50SW5mb0xpYi5jbG9uZUV2ZW50SW5mbyhldmVudEluZm8pO1xuXG4gICAgICAvLyBJbiBzb21lIGNhc2VzLCBgcG9wdWxhdGVBY3Rpb25gIHdpbGwgcmV3cml0ZSBgY2xpY2tgIGV2ZW50cyB0b1xuICAgICAgLy8gYGNsaWNrb25seWAuIFJldmVydCBiYWNrIHRvIGEgcmVndWxhciBjbGljaywgb3RoZXJ3aXNlIHdlIHdvbid0IGJlIGFibGVcbiAgICAgIC8vIHRvIGV4ZWN1dGUgZ2xvYmFsIGV2ZW50IGhhbmRsZXJzIHJlZ2lzdGVyZWQgb24gY2xpY2sgZXZlbnRzLlxuICAgICAgaWYgKGV2ZW50SW5mb0xpYi5nZXRFdmVudFR5cGUoZ2xvYmFsRXZlbnRJbmZvKSA9PT0gRXZlbnRUeXBlLkNMSUNLT05MWSkge1xuICAgICAgICBldmVudEluZm9MaWIuc2V0RXZlbnRUeXBlKGdsb2JhbEV2ZW50SW5mbywgRXZlbnRUeXBlLkNMSUNLKTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5kaXNwYXRjaGVyKGdsb2JhbEV2ZW50SW5mbywgLyogZGlzcGF0Y2ggZ2xvYmFsIGV2ZW50ICovIHRydWUpO1xuICAgIH1cblxuICAgIGNvbnN0IGFjdGlvbiA9IGV2ZW50SW5mb0xpYi5nZXRBY3Rpb24oZXZlbnRJbmZvKTtcbiAgICBpZiAoIWFjdGlvbiAmJiAhY2hlY2tEaXNwYXRjaGVyRm9yQTExeUNsaWNrKGV2ZW50SW5mbykpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5kaXNwYXRjaGVyKSB7XG4gICAgICBpZiAoXG4gICAgICAgIGFjdGlvbiAmJlxuICAgICAgICBzaG91bGRQcmV2ZW50RGVmYXVsdEJlZm9yZURpc3BhdGNoaW5nKGV2ZW50SW5mb0xpYi5nZXRBY3Rpb25FbGVtZW50KGFjdGlvbiksIGV2ZW50SW5mbylcbiAgICAgICkge1xuICAgICAgICBldmVudExpYi5wcmV2ZW50RGVmYXVsdChldmVudEluZm9MaWIuZ2V0RXZlbnQoZXZlbnRJbmZvKSk7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHVucmVzb2x2ZWRFdmVudEluZm8gPSB0aGlzLmRpc3BhdGNoZXIoZXZlbnRJbmZvKTtcbiAgICAgIGlmICh1bnJlc29sdmVkRXZlbnRJbmZvICYmIGFsbG93UmVoYW5kbGluZykge1xuICAgICAgICAvLyBUaGUgZGlzcGF0Y2hlciBvbmx5IHJldHVybnMgYW4gZXZlbnQgZm9yIE1BWUJFX0NMSUNLX0VWRU5UX1RZUEVcbiAgICAgICAgLy8gZXZlbnRzIHRoYXQgY2FuJ3QgYmUgY2FzdGVkIHRvIGEgY2xpY2suIFdlIHJ1biBpdCB0aHJvdWdoIHRoZVxuICAgICAgICAvLyBoYW5kbGVyIGFnYWluIHRvIGZpbmQga2V5ZG93biBhY3Rpb25zIGZvciBpdC5cbiAgICAgICAgdGhpcy5oYW5kbGVFdmVudEluZm8odW5yZXNvbHZlZEV2ZW50SW5mbywgLyogYWxsb3dSZWhhbmRsaW5nPSAqLyBmYWxzZSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogU2VhcmNoZXMgZm9yIGEganNhY3Rpb24gdGhhdCB0aGUgRE9NIGV2ZW50IG1hcHMgdG8gYW5kIGNyZWF0ZXMgYW5cbiAgICogb2JqZWN0IGNvbnRhaW5pbmcgZXZlbnQgaW5mb3JtYXRpb24gdXNlZCBmb3IgZGlzcGF0Y2hpbmcgYnlcbiAgICoganNhY3Rpb24uRGlzcGF0Y2hlci4gVGhpcyBtZXRob2QgcG9wdWxhdGVzIHRoZSBgYWN0aW9uYCBhbmQgYGFjdGlvbkVsZW1lbnRgXG4gICAqIGZpZWxkcyBvZiB0aGUgRXZlbnRJbmZvIG9iamVjdCBwYXNzZWQgaW4gYnkgZmluZGluZyB0aGUgZmlyc3RcbiAgICoganNhY3Rpb24gYXR0cmlidXRlIGFib3ZlIHRoZSB0YXJnZXQgTm9kZSBvZiB0aGUgZXZlbnQsIGFuZCBiZWxvd1xuICAgKiB0aGUgY29udGFpbmVyIE5vZGUsIHRoYXQgc3BlY2lmaWVzIGEganNhY3Rpb24gZm9yIHRoZSBldmVudFxuICAgKiB0eXBlLiBJZiBubyBzdWNoIGpzYWN0aW9uIGlzIGZvdW5kLCB0aGVuIGFjdGlvbiBpcyB1bmRlZmluZWQuXG4gICAqXG4gICAqIEBwYXJhbSBldmVudEluZm8gYEV2ZW50SW5mb2AgdG8gc2V0IGBhY3Rpb25gIGFuZCBgYWN0aW9uRWxlbWVudGAgaWYgYW5cbiAgICogICAgYWN0aW9uIGlzIGZvdW5kIG9uIGFueSBgRWxlbWVudGAgaW4gdGhlIHBhdGggb2YgdGhlIGBFdmVudGAuXG4gICAqL1xuICBwcml2YXRlIHBvcHVsYXRlQWN0aW9uKGV2ZW50SW5mbzogZXZlbnRJbmZvTGliLkV2ZW50SW5mbykge1xuICAgIC8vIFdlIGRpc3Rpbmd1aXNoIG1vZGlmaWVkIGFuZCBwbGFpbiBjbGlja3MgaW4gb3JkZXIgdG8gc3VwcG9ydCB0aGVcbiAgICAvLyBkZWZhdWx0IGJyb3dzZXIgYmVoYXZpb3Igb2YgbW9kaWZpZWQgY2xpY2tzIG9uIGxpbmtzOyB1c3VhbGx5IHRvXG4gICAgLy8gb3BlbiB0aGUgVVJMIG9mIHRoZSBsaW5rIGluIG5ldyB0YWIgb3IgbmV3IHdpbmRvdyBvbiBjdHJsL2NtZFxuICAgIC8vIGNsaWNrLiBBIERPTSAnY2xpY2snIGV2ZW50IGlzIG1hcHBlZCB0byB0aGUganNhY3Rpb24gJ2NsaWNrJ1xuICAgIC8vIGV2ZW50IGlmZiB0aGVyZSBpcyBubyBtb2RpZmllciBwcmVzZW50IG9uIHRoZSBldmVudC4gSWYgdGhlcmUgaXNcbiAgICAvLyBhIG1vZGlmaWVyLCBpdCdzIG1hcHBlZCB0byAnY2xpY2ttb2QnIGluc3RlYWQuXG4gICAgLy9cbiAgICAvLyBJdCdzIGFsbG93ZWQgdG8gb21pdCB0aGUgZXZlbnQgaW4gdGhlIGpzYWN0aW9uIGF0dHJpYnV0ZS4gSW4gdGhhdFxuICAgIC8vIGNhc2UsICdjbGljaycgaXMgYXNzdW1lZC4gVGh1cyB0aGUgZm9sbG93aW5nIHR3byBhcmUgZXF1aXZhbGVudDpcbiAgICAvL1xuICAgIC8vICAgPGEgaHJlZj1cInNvbWV1cmxcIiBqc2FjdGlvbj1cImduYS5mdVwiPlxuICAgIC8vICAgPGEgaHJlZj1cInNvbWV1cmxcIiBqc2FjdGlvbj1cImNsaWNrOmduYS5mdVwiPlxuICAgIC8vXG4gICAgLy8gRm9yIHVubW9kaWZpZWQgY2xpY2tzLCBFdmVudENvbnRyYWN0IGludm9rZXMgdGhlIGpzYWN0aW9uXG4gICAgLy8gJ2duYS5mdScuIEZvciBtb2RpZmllZCBjbGlja3MsIEV2ZW50Q29udHJhY3Qgd29uJ3QgZmluZCBhXG4gICAgLy8gc3VpdGFibGUgYWN0aW9uIGFuZCBsZWF2ZSB0aGUgZXZlbnQgdG8gYmUgaGFuZGxlZCBieSB0aGVcbiAgICAvLyBicm93c2VyLlxuICAgIC8vXG4gICAgLy8gSW4gb3JkZXIgdG8gYWxzbyBpbnZva2UgYSBqc2FjdGlvbiBoYW5kbGVyIGZvciBhIG1vZGlmaWVyIGNsaWNrLFxuICAgIC8vICdjbGlja21vZCcgbmVlZHMgdG8gYmUgdXNlZDpcbiAgICAvL1xuICAgIC8vICAgPGEgaHJlZj1cInNvbWV1cmxcIiBqc2FjdGlvbj1cImNsaWNrbW9kOmduYS5mdVwiPlxuICAgIC8vXG4gICAgLy8gRXZlbnRDb250cmFjdCBpbnZva2VzIHRoZSBqc2FjdGlvbiAnZ25hLmZ1JyBmb3IgbW9kaWZpZWRcbiAgICAvLyBjbGlja3MuIFVubW9kaWZpZWQgY2xpY2tzIGFyZSBsZWZ0IHRvIHRoZSBicm93c2VyLlxuICAgIC8vXG4gICAgLy8gSW4gb3JkZXIgdG8gc2V0IHVwIHRoZSBldmVudCBjb250cmFjdCB0byBoYW5kbGUgYm90aCBjbGlja29ubHkgYW5kXG4gICAgLy8gY2xpY2ttb2QsIG9ubHkgYWRkRXZlbnQoRXZlbnRUeXBlLkNMSUNLKSBpcyBuZWNlc3NhcnkuXG4gICAgLy9cbiAgICAvLyBJbiBvcmRlciB0byBzZXQgdXAgdGhlIGV2ZW50IGNvbnRyYWN0IHRvIGhhbmRsZSBjbGljayxcbiAgICAvLyBhZGRFdmVudCgpIGlzIG5lY2Vzc2FyeSBmb3IgQ0xJQ0ssIEtFWURPV04sIGFuZCBLRVlQUkVTUyBldmVudCB0eXBlcy4gIElmXG4gICAgLy8gYTExeSBjbGljayBzdXBwb3J0IGlzIGVuYWJsZWQsIGFkZEV2ZW50KCkgd2lsbCBzZXQgdXAgdGhlIGFwcHJvcHJpYXRlIGtleVxuICAgIC8vIGV2ZW50IGhhbmRsZXIgYXV0b21hdGljYWxseS5cbiAgICBpZiAoXG4gICAgICBldmVudEluZm9MaWIuZ2V0RXZlbnRUeXBlKGV2ZW50SW5mbykgPT09IEV2ZW50VHlwZS5DTElDSyAmJlxuICAgICAgZXZlbnRMaWIuaXNNb2RpZmllZENsaWNrRXZlbnQoZXZlbnRJbmZvTGliLmdldEV2ZW50KGV2ZW50SW5mbykpXG4gICAgKSB7XG4gICAgICBldmVudEluZm9MaWIuc2V0RXZlbnRUeXBlKGV2ZW50SW5mbywgRXZlbnRUeXBlLkNMSUNLTU9EKTtcbiAgICB9IGVsc2UgaWYgKHRoaXMuaGFzQTExeUNsaWNrU3VwcG9ydCkge1xuICAgICAgdGhpcy51cGRhdGVFdmVudEluZm9Gb3JBMTF5Q2xpY2shKGV2ZW50SW5mbyk7XG4gICAgfSBlbHNlIGlmIChcbiAgICAgIEV2ZW50Q29udHJhY3QuQTExWV9TVVBQT1JUX0lOX0RJU1BBVENIRVIgJiZcbiAgICAgIGV2ZW50SW5mb0xpYi5nZXRFdmVudFR5cGUoZXZlbnRJbmZvKSA9PT0gRXZlbnRUeXBlLktFWURPV04gJiZcbiAgICAgICFldmVudEluZm9MaWIuZ2V0RXZlbnQoZXZlbnRJbmZvKVtBY2Nlc3NpYmlsaXR5QXR0cmlidXRlLlNLSVBfQTExWV9DSEVDS11cbiAgICApIHtcbiAgICAgIC8vIFdlIHVzZSBhIHN0cmluZyBsaXRlcmFsIGFzIHRoaXMgdmFsdWUgbmVlZHMgdG8gYmUgcmVmZXJlbmNlZCBpbiB0aGVcbiAgICAgIC8vIGRpc3BhdGNoZXIncyBiaW5hcnkuXG4gICAgICBldmVudEluZm9MaWIuc2V0RXZlbnRUeXBlKGV2ZW50SW5mbywgQWNjZXNzaWJpbGl0eUF0dHJpYnV0ZS5NQVlCRV9DTElDS19FVkVOVF9UWVBFKTtcbiAgICB9XG5cbiAgICAvLyBXYWxrIHRvIHRoZSBwYXJlbnQgbm9kZSwgdW5sZXNzIHRoZSBub2RlIGhhcyBhIGRpZmZlcmVudCBvd25lciBpblxuICAgIC8vIHdoaWNoIGNhc2Ugd2Ugd2FsayB0byB0aGUgb3duZXIuIEF0dGVtcHQgdG8gd2FsayB0byBob3N0IG9mIGFcbiAgICAvLyBzaGFkb3cgcm9vdCBpZiBuZWVkZWQuXG4gICAgbGV0IGFjdGlvbkVsZW1lbnQ6IEVsZW1lbnQgfCBudWxsID0gZXZlbnRJbmZvTGliLmdldFRhcmdldEVsZW1lbnQoZXZlbnRJbmZvKTtcbiAgICB3aGlsZSAoYWN0aW9uRWxlbWVudCAmJiBhY3Rpb25FbGVtZW50ICE9PSBldmVudEluZm9MaWIuZ2V0Q29udGFpbmVyKGV2ZW50SW5mbykpIHtcbiAgICAgIHRoaXMucG9wdWxhdGVBY3Rpb25PbkVsZW1lbnQoYWN0aW9uRWxlbWVudCwgZXZlbnRJbmZvKTtcblxuICAgICAgaWYgKGV2ZW50SW5mb0xpYi5nZXRBY3Rpb24oZXZlbnRJbmZvKSkge1xuICAgICAgICAvLyBBbiBldmVudCBpcyBoYW5kbGVkIGJ5IGF0IG1vc3Qgb25lIGpzYWN0aW9uLiBUaHVzIHdlIHN0b3AgYXQgdGhlXG4gICAgICAgIC8vIGZpcnN0IG1hdGNoaW5nIGpzYWN0aW9uIHNwZWNpZmllZCBpbiBhIGpzYWN0aW9uIGF0dHJpYnV0ZSB1cCB0aGVcbiAgICAgICAgLy8gYW5jZXN0b3IgY2hhaW4gb2YgdGhlIGV2ZW50IHRhcmdldCBub2RlLlxuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGlmIChhY3Rpb25FbGVtZW50W1Byb3BlcnR5Lk9XTkVSXSkge1xuICAgICAgICBhY3Rpb25FbGVtZW50ID0gYWN0aW9uRWxlbWVudFtQcm9wZXJ0eS5PV05FUl0gYXMgRWxlbWVudDtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBpZiAoYWN0aW9uRWxlbWVudC5wYXJlbnROb2RlPy5ub2RlTmFtZSAhPT0gJyNkb2N1bWVudC1mcmFnbWVudCcpIHtcbiAgICAgICAgYWN0aW9uRWxlbWVudCA9IGFjdGlvbkVsZW1lbnQucGFyZW50Tm9kZSBhcyBFbGVtZW50IHwgbnVsbDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGFjdGlvbkVsZW1lbnQgPSAoYWN0aW9uRWxlbWVudC5wYXJlbnROb2RlIGFzIFNoYWRvd1Jvb3QgfCBudWxsKT8uaG9zdCA/PyBudWxsO1xuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IGFjdGlvbiA9IGV2ZW50SW5mb0xpYi5nZXRBY3Rpb24oZXZlbnRJbmZvKTtcbiAgICBpZiAoIWFjdGlvbikge1xuICAgICAgLy8gTm8gYWN0aW9uIGZvdW5kLlxuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICh0aGlzLmhhc0ExMXlDbGlja1N1cHBvcnQpIHtcbiAgICAgIHRoaXMucHJldmVudERlZmF1bHRGb3JBMTF5Q2xpY2shKGV2ZW50SW5mbyk7XG4gICAgfVxuXG4gICAgLy8gV2UgYXR0ZW1wdCB0byBoYW5kbGUgdGhlIG1vdXNlZW50ZXIvbW91c2VsZWF2ZSBldmVudHMgaGVyZSBieVxuICAgIC8vIGRldGVjdGluZyB3aGV0aGVyIHRoZSBtb3VzZW92ZXIvbW91c2VvdXQgZXZlbnRzIGNvcnJlc3BvbmQgdG9cbiAgICAvLyBlbnRlcmluZy9sZWF2aW5nIGFuIGVsZW1lbnQuXG4gICAgaWYgKFxuICAgICAgRXZlbnRDb250cmFjdC5NT1VTRV9TUEVDSUFMX1NVUFBPUlQgJiZcbiAgICAgIChldmVudEluZm9MaWIuZ2V0RXZlbnRUeXBlKGV2ZW50SW5mbykgPT09IEV2ZW50VHlwZS5NT1VTRUVOVEVSIHx8XG4gICAgICAgIGV2ZW50SW5mb0xpYi5nZXRFdmVudFR5cGUoZXZlbnRJbmZvKSA9PT0gRXZlbnRUeXBlLk1PVVNFTEVBVkUgfHxcbiAgICAgICAgZXZlbnRJbmZvTGliLmdldEV2ZW50VHlwZShldmVudEluZm8pID09PSBFdmVudFR5cGUuUE9JTlRFUkVOVEVSIHx8XG4gICAgICAgIGV2ZW50SW5mb0xpYi5nZXRFdmVudFR5cGUoZXZlbnRJbmZvKSA9PT0gRXZlbnRUeXBlLlBPSU5URVJMRUFWRSlcbiAgICApIHtcbiAgICAgIC8vIFdlIGF0dGVtcHQgdG8gaGFuZGxlIHRoZSBtb3VzZWVudGVyL21vdXNlbGVhdmUgZXZlbnRzIGhlcmUgYnlcbiAgICAgIC8vIGRldGVjdGluZyB3aGV0aGVyIHRoZSBtb3VzZW92ZXIvbW91c2VvdXQgZXZlbnRzIGNvcnJlc3BvbmQgdG9cbiAgICAgIC8vIGVudGVyaW5nL2xlYXZpbmcgYW4gZWxlbWVudC5cbiAgICAgIGlmIChcbiAgICAgICAgZXZlbnRMaWIuaXNNb3VzZVNwZWNpYWxFdmVudChcbiAgICAgICAgICBldmVudEluZm9MaWIuZ2V0RXZlbnQoZXZlbnRJbmZvKSxcbiAgICAgICAgICBldmVudEluZm9MaWIuZ2V0RXZlbnRUeXBlKGV2ZW50SW5mbyksXG4gICAgICAgICAgZXZlbnRJbmZvTGliLmdldEFjdGlvbkVsZW1lbnQoYWN0aW9uKSxcbiAgICAgICAgKVxuICAgICAgKSB7XG4gICAgICAgIC8vIElmIGJvdGggbW91c2VvdmVyL21vdXNlb3V0IGFuZCBtb3VzZWVudGVyL21vdXNlbGVhdmUgZXZlbnRzIGFyZVxuICAgICAgICAvLyBlbmFibGVkLCB0d28gc2VwYXJhdGUgaGFuZGxlcnMgZm9yIG1vdXNlb3Zlci9tb3VzZW91dCBhcmVcbiAgICAgICAgLy8gcmVnaXN0ZXJlZC4gQm90aCBoYW5kbGVycyB3aWxsIHNlZSB0aGUgc2FtZSBldmVudCBpbnN0YW5jZVxuICAgICAgICAvLyBzbyB3ZSBjcmVhdGUgYSBjb3B5IHRvIGF2b2lkIGludGVyZmVyaW5nIHdpdGggdGhlIGRpc3BhdGNoaW5nIG9mXG4gICAgICAgIC8vIHRoZSBtb3VzZW92ZXIvbW91c2VvdXQgZXZlbnQuXG4gICAgICAgIGNvbnN0IGNvcGllZEV2ZW50ID0gZXZlbnRMaWIuY3JlYXRlTW91c2VTcGVjaWFsRXZlbnQoXG4gICAgICAgICAgZXZlbnRJbmZvTGliLmdldEV2ZW50KGV2ZW50SW5mbyksXG4gICAgICAgICAgZXZlbnRJbmZvTGliLmdldEFjdGlvbkVsZW1lbnQoYWN0aW9uKSxcbiAgICAgICAgKTtcbiAgICAgICAgZXZlbnRJbmZvTGliLnNldEV2ZW50KGV2ZW50SW5mbywgY29waWVkRXZlbnQpO1xuICAgICAgICAvLyBTaW5jZSB0aGUgbW91c2VlbnRlci9tb3VzZWxlYXZlIGV2ZW50cyBkbyBub3QgYnViYmxlLCB0aGUgdGFyZ2V0XG4gICAgICAgIC8vIG9mIHRoZSBldmVudCBpcyB0ZWNobmljYWxseSB0aGUgYGFjdGlvbkVsZW1lbnRgICh0aGUgbm9kZSB3aXRoIHRoZVxuICAgICAgICAvLyBganNhY3Rpb25gIGF0dHJpYnV0ZSlcbiAgICAgICAgZXZlbnRJbmZvTGliLnNldFRhcmdldEVsZW1lbnQoZXZlbnRJbmZvLCBldmVudEluZm9MaWIuZ2V0QWN0aW9uRWxlbWVudChhY3Rpb24pKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGV2ZW50SW5mb0xpYi51bnNldEFjdGlvbihldmVudEluZm8pO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBBY2Nlc3NlcyB0aGUganNhY3Rpb24gbWFwIG9uIGEgbm9kZSBhbmQgcmV0cmlldmVzIHRoZSBuYW1lIG9mIHRoZVxuICAgKiBhY3Rpb24gdGhlIGdpdmVuIGV2ZW50IGlzIG1hcHBlZCB0bywgaWYgYW55LiBJdCBwYXJzZXMgdGhlXG4gICAqIGF0dHJpYnV0ZSB2YWx1ZSBhbmQgc3RvcmVzIGl0IGluIGEgcHJvcGVydHkgb24gdGhlIG5vZGUgZm9yXG4gICAqIHN1YnNlcXVlbnQgcmV0cmlldmFsIHdpdGhvdXQgcmUtcGFyc2luZyBhbmQgcmUtYWNjZXNzaW5nIHRoZVxuICAgKiBhdHRyaWJ1dGUuIEluIG9yZGVyIHRvIGZ1bGx5IHF1YWxpZnkganNhY3Rpb24gbmFtZXMgdXNpbmcgYVxuICAgKiBuYW1lc3BhY2UsIHRoZSBET00gaXMgc2VhcmNoZWQgc3RhcnRpbmcgYXQgdGhlIGN1cnJlbnQgbm9kZSBhbmRcbiAgICogZ29pbmcgdGhyb3VnaCBhbmNlc3RvciBub2RlcyB1bnRpbCBhIGpzbmFtZXNwYWNlIGF0dHJpYnV0ZSBpc1xuICAgKiBmb3VuZC5cbiAgICpcbiAgICogQHBhcmFtIGFjdGlvbkVsZW1lbnQgVGhlIERPTSBub2RlIHRvIHJldHJpZXZlIHRoZSBqc2FjdGlvbiBtYXAgZnJvbS5cbiAgICogQHBhcmFtIGV2ZW50SW5mbyBgRXZlbnRJbmZvYCB0byBzZXQgYGFjdGlvbmAgYW5kIGBhY3Rpb25FbGVtZW50YCBpZiBhblxuICAgKiAgICBhY3Rpb24gaXMgZm91bmQgb24gdGhlIGBhY3Rpb25FbGVtZW50YC5cbiAgICovXG4gIHByaXZhdGUgcG9wdWxhdGVBY3Rpb25PbkVsZW1lbnQoYWN0aW9uRWxlbWVudDogRWxlbWVudCwgZXZlbnRJbmZvOiBldmVudEluZm9MaWIuRXZlbnRJbmZvKSB7XG4gICAgY29uc3QgYWN0aW9uTWFwID0gcGFyc2VBY3Rpb25zKGFjdGlvbkVsZW1lbnQsIGV2ZW50SW5mb0xpYi5nZXRDb250YWluZXIoZXZlbnRJbmZvKSk7XG5cbiAgICBjb25zdCBhY3Rpb25OYW1lID0gYWN0aW9uTWFwW2V2ZW50SW5mb0xpYi5nZXRFdmVudFR5cGUoZXZlbnRJbmZvKV07XG4gICAgaWYgKGFjdGlvbk5hbWUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgZXZlbnRJbmZvTGliLnNldEFjdGlvbihldmVudEluZm8sIGFjdGlvbk5hbWUsIGFjdGlvbkVsZW1lbnQpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLmhhc0ExMXlDbGlja1N1cHBvcnQpIHtcbiAgICAgIHRoaXMucG9wdWxhdGVDbGlja09ubHlBY3Rpb24hKGFjdGlvbkVsZW1lbnQsIGV2ZW50SW5mbywgYWN0aW9uTWFwKTtcbiAgICB9XG4gICAgaWYgKEV2ZW50Q29udHJhY3QuQTExWV9TVVBQT1JUX0lOX0RJU1BBVENIRVIpIHtcbiAgICAgIGlmIChcbiAgICAgICAgZXZlbnRJbmZvTGliLmdldEV2ZW50VHlwZShldmVudEluZm8pID09PSBBY2Nlc3NpYmlsaXR5QXR0cmlidXRlLk1BWUJFX0NMSUNLX0VWRU5UX1RZUEUgJiZcbiAgICAgICAgYWN0aW9uTWFwW0V2ZW50VHlwZS5DTElDS10gIT09IHVuZGVmaW5lZFxuICAgICAgKSB7XG4gICAgICAgIC8vIFdlJ2xsIHRha2UgdGhlIGZpcnN0IENMSUNLIGFjdGlvbiB3ZSBmaW5kIGFuZCBoYXZlIHRoZSBkaXNwYXRjaGVyXG4gICAgICAgIC8vIGNoZWNrIGlmIHRoZSBrZXlkb3duIGV2ZW50IGNhbiBiZSB1c2VkIGFzIGEgQ0xJQ0suIElmIG5vdCwgdGhlXG4gICAgICAgIC8vIGRpc3BhdGNoZXIgd2lsbCByZXRyaWdnZXIgdGhlIGV2ZW50IHNvIHRoYXQgd2UgY2FuIGZpbmQgYSBrZXlkb3duXG4gICAgICAgIC8vIGV2ZW50IGluc3RlYWQuXG4gICAgICAgIC8vIFdoZW4gd2UgZ2V0IE1BWUJFX0NMSUNLX0VWRU5UX1RZUEUgYXMgYW4gZXZlbnRUeXBlLCB3ZSB3YW50IHRvXG4gICAgICAgIC8vIHJldHJpZXZlIHRoZSBhY3Rpb24gY29ycmVzcG9uZGluZyB0byBDTElDSywgYnV0IHN0aWxsIGtlZXAgdGhlXG4gICAgICAgIC8vIGV2ZW50SW5mb0xpYi5nZXRFdmVudFR5cGUoZXZlbnRJbmZvLCApIGFzIE1BWUJFX0NMSUNLX0VWRU5UX1RZUEUuIFRoZVxuICAgICAgICAvLyBkaXNwYXRjaGVyIHVzZXMgdGhpcyBldmVudCB0eXBlIHRvIGRldGVybWluZSBpZiBpdCBzaG91bGQgZ2V0IHRoZVxuICAgICAgICAvLyBoYW5kbGVyIGZvciB0aGUgYWN0aW9uLlxuICAgICAgICBldmVudEluZm9MaWIuc2V0QWN0aW9uKGV2ZW50SW5mbywgYWN0aW9uTWFwW0V2ZW50VHlwZS5DTElDS10sIGFjdGlvbkVsZW1lbnQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYTExeUNsaWNrTGliLnBvcHVsYXRlQ2xpY2tPbmx5QWN0aW9uKGFjdGlvbkVsZW1lbnQsIGV2ZW50SW5mbywgYWN0aW9uTWFwKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogRW5hYmxlcyBqc2FjdGlvbiBoYW5kbGVycyB0byBiZSBjYWxsZWQgZm9yIHRoZSBldmVudCB0eXBlIGdpdmVuIGJ5XG4gICAqIG5hbWUuXG4gICAqXG4gICAqIElmIHRoZSBldmVudCBpcyBhbHJlYWR5IHJlZ2lzdGVyZWQsIHRoaXMgZG9lcyBub3RoaW5nLlxuICAgKlxuICAgKiBAcGFyYW0gcHJlZml4ZWRFdmVudFR5cGUgSWYgc3VwcGxpZWQsIHRoaXMgZXZlbnQgaXMgdXNlZCBpblxuICAgKiAgICAgdGhlIGFjdHVhbCBicm93c2VyIGV2ZW50IHJlZ2lzdHJhdGlvbiBpbnN0ZWFkIG9mIHRoZSBuYW1lIHRoYXQgaXNcbiAgICogICAgIGV4cG9zZWQgdG8ganNhY3Rpb24uIFVzZSB0aGlzIGlmIHlvdSBlLmcuIHdhbnQgdXNlcnMgdG8gYmUgYWJsZVxuICAgKiAgICAgdG8gc3Vic2NyaWJlIHRvIGpzYWN0aW9uPVwidHJhbnNpdGlvbkVuZDpmb29cIiB3aGlsZSB0aGUgdW5kZXJseWluZ1xuICAgKiAgICAgZXZlbnQgaXMgd2Via2l0VHJhbnNpdGlvbkVuZCBpbiBvbmUgYnJvd3NlciBhbmQgbW96VHJhbnNpdGlvbkVuZFxuICAgKiAgICAgaW4gYW5vdGhlci5cbiAgICovXG4gIGFkZEV2ZW50KGV2ZW50VHlwZTogc3RyaW5nLCBwcmVmaXhlZEV2ZW50VHlwZT86IHN0cmluZykge1xuICAgIGlmIChldmVudFR5cGUgaW4gdGhpcy5ldmVudEhhbmRsZXJzIHx8ICF0aGlzLmNvbnRhaW5lck1hbmFnZXIpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoXG4gICAgICAhRXZlbnRDb250cmFjdC5NT1VTRV9TUEVDSUFMX1NVUFBPUlQgJiZcbiAgICAgIChldmVudFR5cGUgPT09IEV2ZW50VHlwZS5NT1VTRUVOVEVSIHx8XG4gICAgICAgIGV2ZW50VHlwZSA9PT0gRXZlbnRUeXBlLk1PVVNFTEVBVkUgfHxcbiAgICAgICAgZXZlbnRUeXBlID09PSBFdmVudFR5cGUuUE9JTlRFUkVOVEVSIHx8XG4gICAgICAgIGV2ZW50VHlwZSA9PT0gRXZlbnRUeXBlLlBPSU5URVJMRUFWRSlcbiAgICApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBldmVudEhhbmRsZXIgPSAoZXZlbnRUeXBlOiBzdHJpbmcsIGV2ZW50OiBFdmVudCwgY29udGFpbmVyOiBFbGVtZW50KSA9PiB7XG4gICAgICB0aGlzLmhhbmRsZUV2ZW50KGV2ZW50VHlwZSwgZXZlbnQsIGNvbnRhaW5lcik7XG4gICAgfTtcblxuICAgIC8vIFN0b3JlIHRoZSBjYWxsYmFjayB0byBhbGxvdyB1cyB0byByZXBsYXkgZXZlbnRzLlxuICAgIHRoaXMuZXZlbnRIYW5kbGVyc1tldmVudFR5cGVdID0gZXZlbnRIYW5kbGVyO1xuXG4gICAgY29uc3QgYnJvd3NlckV2ZW50VHlwZSA9IGV2ZW50TGliLmdldEJyb3dzZXJFdmVudFR5cGUocHJlZml4ZWRFdmVudFR5cGUgfHwgZXZlbnRUeXBlKTtcblxuICAgIGlmIChicm93c2VyRXZlbnRUeXBlICE9PSBldmVudFR5cGUpIHtcbiAgICAgIGNvbnN0IGV2ZW50VHlwZXMgPSB0aGlzLmJyb3dzZXJFdmVudFR5cGVUb0V4dHJhRXZlbnRUeXBlc1ticm93c2VyRXZlbnRUeXBlXSB8fCBbXTtcbiAgICAgIGV2ZW50VHlwZXMucHVzaChldmVudFR5cGUpO1xuICAgICAgdGhpcy5icm93c2VyRXZlbnRUeXBlVG9FeHRyYUV2ZW50VHlwZXNbYnJvd3NlckV2ZW50VHlwZV0gPSBldmVudFR5cGVzO1xuICAgIH1cblxuICAgIHRoaXMuY29udGFpbmVyTWFuYWdlci5hZGRFdmVudExpc3RlbmVyKGJyb3dzZXJFdmVudFR5cGUsIChlbGVtZW50OiBFbGVtZW50KSA9PiB7XG4gICAgICByZXR1cm4gKGV2ZW50OiBFdmVudCkgPT4ge1xuICAgICAgICBldmVudEhhbmRsZXIoZXZlbnRUeXBlLCBldmVudCwgZWxlbWVudCk7XG4gICAgICB9O1xuICAgIH0pO1xuXG4gICAgLy8gQXV0b21hdGljYWxseSBpbnN0YWxsIGEga2V5cHJlc3Mva2V5ZG93biBldmVudCBoYW5kbGVyIGlmIHN1cHBvcnQgZm9yXG4gICAgLy8gYWNjZXNzaWJsZSBjbGlja3MgaXMgdHVybmVkIG9uLlxuICAgIGlmICh0aGlzLmFkZEExMXlDbGlja0xpc3RlbmVyICYmIGV2ZW50VHlwZSA9PT0gRXZlbnRUeXBlLkNMSUNLKSB7XG4gICAgICB0aGlzLmFkZEV2ZW50KEV2ZW50VHlwZS5LRVlET1dOKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgcXVldWVkIGVhcmx5IGV2ZW50cyBhbmQgcmVwbGF5IHRoZW0gdXNpbmcgdGhlIGFwcHJvcHJpYXRlIGhhbmRsZXJcbiAgICogaW4gdGhlIHByb3ZpZGVkIGV2ZW50IGNvbnRyYWN0LiBPbmNlIGFsbCB0aGUgZXZlbnRzIGFyZSByZXBsYXllZCwgaXQgY2xlYW5zXG4gICAqIHVwIHRoZSBlYXJseSBjb250cmFjdC5cbiAgICovXG4gIHJlcGxheUVhcmx5RXZlbnRzKCkge1xuICAgIC8vIENoZWNrIGlmIHRoZSBlYXJseSBjb250cmFjdCBpcyBwcmVzZW50IGFuZCBwcmV2ZW50IGNhbGxpbmcgdGhpcyBmdW5jdGlvblxuICAgIC8vIG1vcmUgdGhhbiBvbmNlLlxuICAgIGNvbnN0IGVhcmx5SnNhY3Rpb25EYXRhOiBFYXJseUpzYWN0aW9uRGF0YSB8IHVuZGVmaW5lZCA9IHdpbmRvdy5fZWpzYTtcbiAgICBpZiAoIWVhcmx5SnNhY3Rpb25EYXRhKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gUmVwbGF5IHRoZSBlYXJseSBjb250cmFjdCBldmVudHMuXG4gICAgY29uc3QgZWFybHlFdmVudEluZm9zOiBldmVudEluZm9MaWIuRXZlbnRJbmZvW10gPSBlYXJseUpzYWN0aW9uRGF0YS5xO1xuICAgIGZvciAobGV0IGlkeCA9IDA7IGlkeCA8IGVhcmx5RXZlbnRJbmZvcy5sZW5ndGg7IGlkeCsrKSB7XG4gICAgICBjb25zdCBlYXJseUV2ZW50SW5mbzogZXZlbnRJbmZvTGliLkV2ZW50SW5mbyA9IGVhcmx5RXZlbnRJbmZvc1tpZHhdO1xuICAgICAgY29uc3QgZXZlbnRUeXBlcyA9IHRoaXMuZ2V0RXZlbnRUeXBlc0ZvckJyb3dzZXJFdmVudFR5cGUoZWFybHlFdmVudEluZm8uZXZlbnRUeXBlKTtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZXZlbnRUeXBlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBjb25zdCBldmVudEluZm8gPSBldmVudEluZm9MaWIuY2xvbmVFdmVudEluZm8oZWFybHlFdmVudEluZm8pO1xuICAgICAgICAvLyBFdmVudEluZm8gZXZlbnRUeXBlIG1hcHMgdG8gSlNBY3Rpb24ncyBpbnRlcm5hbCBldmVudCB0eXBlLFxuICAgICAgICAvLyByYXRoZXIgdGhhbiB0aGUgYnJvd3NlciBldmVudCB0eXBlLlxuICAgICAgICBldmVudEluZm9MaWIuc2V0RXZlbnRUeXBlKGV2ZW50SW5mbywgZXZlbnRUeXBlc1tpXSk7XG4gICAgICAgIHRoaXMuaGFuZGxlRXZlbnRJbmZvKGV2ZW50SW5mbyk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gQ2xlYW4gdXAgdGhlIGVhcmx5IGNvbnRyYWN0LlxuICAgIGNvbnN0IGVhcmx5RXZlbnRUeXBlczogc3RyaW5nW10gPSBlYXJseUpzYWN0aW9uRGF0YS5ldDtcbiAgICBjb25zdCBlYXJseUV2ZW50SGFuZGxlcjogKGV2ZW50OiBFdmVudCkgPT4gdm9pZCA9IGVhcmx5SnNhY3Rpb25EYXRhLmg7XG4gICAgZm9yIChsZXQgaWR4ID0gMDsgaWR4IDwgZWFybHlFdmVudFR5cGVzLmxlbmd0aDsgaWR4KyspIHtcbiAgICAgIGNvbnN0IGV2ZW50VHlwZTogc3RyaW5nID0gZWFybHlFdmVudFR5cGVzW2lkeF07XG4gICAgICB3aW5kb3cuZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoZXZlbnRUeXBlLCBlYXJseUV2ZW50SGFuZGxlcik7XG4gICAgfVxuICAgIGRlbGV0ZSB3aW5kb3cuX2Vqc2E7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhbGwgSlNBY3Rpb24gZXZlbnQgdHlwZXMgdGhhdCBoYXZlIGJlZW4gcmVnaXN0ZXJlZCBmb3IgYSBnaXZlblxuICAgKiBicm93c2VyIGV2ZW50IHR5cGUuXG4gICAqL1xuICBwcml2YXRlIGdldEV2ZW50VHlwZXNGb3JCcm93c2VyRXZlbnRUeXBlKGJyb3dzZXJFdmVudFR5cGU6IHN0cmluZykge1xuICAgIGNvbnN0IGV2ZW50VHlwZXMgPSBbXTtcbiAgICBpZiAodGhpcy5ldmVudEhhbmRsZXJzW2Jyb3dzZXJFdmVudFR5cGVdKSB7XG4gICAgICBldmVudFR5cGVzLnB1c2goYnJvd3NlckV2ZW50VHlwZSk7XG4gICAgfVxuICAgIGlmICh0aGlzLmJyb3dzZXJFdmVudFR5cGVUb0V4dHJhRXZlbnRUeXBlc1ticm93c2VyRXZlbnRUeXBlXSkge1xuICAgICAgZXZlbnRUeXBlcy5wdXNoKC4uLnRoaXMuYnJvd3NlckV2ZW50VHlwZVRvRXh0cmFFdmVudFR5cGVzW2Jyb3dzZXJFdmVudFR5cGVdKTtcbiAgICB9XG4gICAgcmV0dXJuIGV2ZW50VHlwZXM7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgZXZlbnQgaGFuZGxlciBmdW5jdGlvbiBmb3IgYSBnaXZlbiBldmVudCB0eXBlLlxuICAgKi9cbiAgaGFuZGxlcihldmVudFR5cGU6IHN0cmluZyk6IEV2ZW50SGFuZGxlciB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMuZXZlbnRIYW5kbGVyc1tldmVudFR5cGVdO1xuICB9XG5cbiAgLyoqXG4gICAqIENsZWFucyB1cCB0aGUgZXZlbnQgY29udHJhY3QuIFRoaXMgcmVzZXRzIGFsbCBvZiB0aGUgYEV2ZW50Q29udHJhY3RgJ3NcbiAgICogaW50ZXJuYWwgc3RhdGUuIFVzZXJzIGFyZSByZXNwb25zaWJsZSBmb3Igbm90IHVzaW5nIHRoaXMgYEV2ZW50Q29udHJhY3RgXG4gICAqIGFmdGVyIGl0IGhhcyBiZWVuIGNsZWFuZWQgdXAuXG4gICAqL1xuICBjbGVhblVwKCkge1xuICAgIHRoaXMuY29udGFpbmVyTWFuYWdlciEuY2xlYW5VcCgpO1xuICAgIHRoaXMuY29udGFpbmVyTWFuYWdlciA9IG51bGw7XG4gICAgdGhpcy5ldmVudEhhbmRsZXJzID0ge307XG4gICAgdGhpcy5icm93c2VyRXZlbnRUeXBlVG9FeHRyYUV2ZW50VHlwZXMgPSB7fTtcbiAgICB0aGlzLmRpc3BhdGNoZXIgPSBudWxsO1xuICAgIHRoaXMucXVldWVkRXZlbnRJbmZvcyA9IFtdO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlZ2lzdGVyIGEgZGlzcGF0Y2hlciBmdW5jdGlvbi4gRXZlbnQgaW5mbyBvZiBlYWNoIGV2ZW50IG1hcHBlZCB0b1xuICAgKiBhIGpzYWN0aW9uIGlzIHBhc3NlZCBmb3IgaGFuZGxpbmcgdG8gdGhpcyBjYWxsYmFjay4gVGhlIHF1ZXVlZFxuICAgKiBldmVudHMgYXJlIHBhc3NlZCBhcyB3ZWxsIHRvIHRoZSBkaXNwYXRjaGVyIGZvciBsYXRlciByZXBsYXlpbmdcbiAgICogb25jZSB0aGUgZGlzcGF0Y2hlciBpcyByZWdpc3RlcmVkLiBDbGVhcnMgdGhlIGV2ZW50IHF1ZXVlIHRvIG51bGwuXG4gICAqXG4gICAqIEBwYXJhbSBkaXNwYXRjaGVyIFRoZSBkaXNwYXRjaGVyIGZ1bmN0aW9uLlxuICAgKiBAcGFyYW0gcmVzdHJpY3Rpb25cbiAgICovXG4gIHJlZ2lzdGVyRGlzcGF0Y2hlcihkaXNwYXRjaGVyOiBEaXNwYXRjaGVyLCByZXN0cmljdGlvbjogUmVzdHJpY3Rpb24pIHtcbiAgICB0aGlzLmVjcmQoZGlzcGF0Y2hlciwgcmVzdHJpY3Rpb24pO1xuICB9XG5cbiAgLyoqXG4gICAqIFVucmVuYW1lZCBhbGlhcyBmb3IgcmVnaXN0ZXJEaXNwYXRjaGVyLiBOZWNlc3NhcnkgZm9yIGFueSBjb2RlYmFzZXMgdGhhdFxuICAgKiBzcGxpdCB0aGUgYEV2ZW50Q29udHJhY3RgIGFuZCBgRGlzcGF0Y2hlcmAgY29kZSBpbnRvIGRpZmZlcmVudCBjb21waWxhdGlvblxuICAgKiB1bml0cy5cbiAgICovXG4gIGVjcmQoZGlzcGF0Y2hlcjogRGlzcGF0Y2hlciwgcmVzdHJpY3Rpb246IFJlc3RyaWN0aW9uKSB7XG4gICAgdGhpcy5kaXNwYXRjaGVyID0gZGlzcGF0Y2hlcjtcblxuICAgIGlmICh0aGlzLnF1ZXVlZEV2ZW50SW5mb3M/Lmxlbmd0aCkge1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLnF1ZXVlZEV2ZW50SW5mb3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdGhpcy5oYW5kbGVFdmVudEluZm8odGhpcy5xdWV1ZWRFdmVudEluZm9zW2ldKTtcbiAgICAgIH1cbiAgICAgIHRoaXMucXVldWVkRXZlbnRJbmZvcyA9IG51bGw7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEFkZHMgYTExeSBjbGljayBzdXBwb3J0IHRvIHRoZSBnaXZlbiBgRXZlbnRDb250cmFjdGAuIE1lYW50IHRvIGJlIGNhbGxlZCBpblxuICAgKiB0aGUgc2FtZSBjb21waWxhdGlvbiB1bml0IGFzIHRoZSBgRXZlbnRDb250cmFjdGAuXG4gICAqL1xuICBhZGRBMTF5Q2xpY2tTdXBwb3J0KCkge1xuICAgIHRoaXMuYWRkQTExeUNsaWNrU3VwcG9ydEltcGwoXG4gICAgICBhMTF5Q2xpY2tMaWIudXBkYXRlRXZlbnRJbmZvRm9yQTExeUNsaWNrLFxuICAgICAgYTExeUNsaWNrTGliLnByZXZlbnREZWZhdWx0Rm9yQTExeUNsaWNrLFxuICAgICAgYTExeUNsaWNrTGliLnBvcHVsYXRlQ2xpY2tPbmx5QWN0aW9uLFxuICAgICk7XG4gIH1cblxuICAvKipcbiAgICogRW5hYmxlcyBhMTF5IGNsaWNrIHN1cHBvcnQgdG8gYmUgZGVmZXJyZWQuIE1lYW50IHRvIGJlIGNhbGxlZCBpbiB0aGUgc2FtZVxuICAgKiBjb21waWxhdGlvbiB1bml0IGFzIHRoZSBgRXZlbnRDb250cmFjdGAuXG4gICAqL1xuICBleHBvcnRBZGRBMTF5Q2xpY2tTdXBwb3J0KCkge1xuICAgIHRoaXMuYWRkQTExeUNsaWNrTGlzdGVuZXIgPSB0cnVlO1xuICAgIHRoaXMuZWNhYWNzID0gdGhpcy5hZGRBMTF5Q2xpY2tTdXBwb3J0SW1wbC5iaW5kKHRoaXMpO1xuICB9XG5cbiAgLyoqXG4gICAqIFVucmVuYW1lZCBmdW5jdGlvbiB0aGF0IGxvYWRzIGExMXlDbGlja1N1cHBvcnQuXG4gICAqL1xuICBwcml2YXRlIGFkZEExMXlDbGlja1N1cHBvcnRJbXBsKFxuICAgIHVwZGF0ZUV2ZW50SW5mb0ZvckExMXlDbGljazogdHlwZW9mIGExMXlDbGlja0xpYi51cGRhdGVFdmVudEluZm9Gb3JBMTF5Q2xpY2ssXG4gICAgcHJldmVudERlZmF1bHRGb3JBMTF5Q2xpY2s6IHR5cGVvZiBhMTF5Q2xpY2tMaWIucHJldmVudERlZmF1bHRGb3JBMTF5Q2xpY2ssXG4gICAgcG9wdWxhdGVDbGlja09ubHlBY3Rpb246IHR5cGVvZiBhMTF5Q2xpY2tMaWIucG9wdWxhdGVDbGlja09ubHlBY3Rpb24sXG4gICkge1xuICAgIHRoaXMuYWRkQTExeUNsaWNrTGlzdGVuZXIgPSB0cnVlO1xuICAgIHRoaXMuaGFzQTExeUNsaWNrU3VwcG9ydCA9IHRydWU7XG4gICAgdGhpcy51cGRhdGVFdmVudEluZm9Gb3JBMTF5Q2xpY2sgPSB1cGRhdGVFdmVudEluZm9Gb3JBMTF5Q2xpY2s7XG4gICAgdGhpcy5wcmV2ZW50RGVmYXVsdEZvckExMXlDbGljayA9IHByZXZlbnREZWZhdWx0Rm9yQTExeUNsaWNrO1xuICAgIHRoaXMucG9wdWxhdGVDbGlja09ubHlBY3Rpb24gPSBwb3B1bGF0ZUNsaWNrT25seUFjdGlvbjtcbiAgfVxufVxuXG4vKipcbiAqIEFkZHMgYTExeSBjbGljayBzdXBwb3J0IHRvIHRoZSBnaXZlbiBgRXZlbnRDb250cmFjdGAuIE1lYW50IHRvIGJlIGNhbGxlZFxuICogaW4gYSBkaWZmZXJlbnQgY29tcGlsYXRpb24gdW5pdCBmcm9tIHRoZSBgRXZlbnRDb250cmFjdGAuIFRoZSBgRXZlbnRDb250cmFjdGBcbiAqIG11c3QgaGF2ZSBjYWxsZWQgYGV4cG9ydEFkZEExMXlDbGlja1N1cHBvcnRgIGluIGl0cyBjb21waWxhdGlvbiB1bml0IGZvciB0aGlzXG4gKiB0byBoYXZlIGFueSBlZmZlY3QuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhZGREZWZlcnJlZEExMXlDbGlja1N1cHBvcnQoZXZlbnRDb250cmFjdDogRXZlbnRDb250cmFjdCkge1xuICBldmVudENvbnRyYWN0LmVjYWFjcz8uKFxuICAgIGExMXlDbGlja0xpYi51cGRhdGVFdmVudEluZm9Gb3JBMTF5Q2xpY2ssXG4gICAgYTExeUNsaWNrTGliLnByZXZlbnREZWZhdWx0Rm9yQTExeUNsaWNrLFxuICAgIGExMXlDbGlja0xpYi5wb3B1bGF0ZUNsaWNrT25seUFjdGlvbixcbiAgKTtcbn1cblxuLyoqXG4gKiBEZXRlcm1pbmVzIHdoZXRoZXIgb3Igbm90IHRoZSBgRXZlbnRDb250cmFjdGAgbmVlZHMgdG8gY2hlY2sgd2l0aCB0aGVcbiAqIGRpc3BhdGNoZXIgZXZlbiBpZiB0aGVyZSdzIG5vIGFjdGlvbi5cbiAqL1xuZnVuY3Rpb24gY2hlY2tEaXNwYXRjaGVyRm9yQTExeUNsaWNrKGV2ZW50SW5mbzogZXZlbnRJbmZvTGliLkV2ZW50SW5mbyk6IGJvb2xlYW4ge1xuICByZXR1cm4gKFxuICAgIEV2ZW50Q29udHJhY3QuQTExWV9TVVBQT1JUX0lOX0RJU1BBVENIRVIgJiZcbiAgICBldmVudEluZm9MaWIuZ2V0RXZlbnRUeXBlKGV2ZW50SW5mbykgPT09IEFjY2Vzc2liaWxpdHlBdHRyaWJ1dGUuTUFZQkVfQ0xJQ0tfRVZFTlRfVFlQRVxuICApO1xufVxuXG4vKipcbiAqIFJldHVybnMgdHJ1ZSBpZiB0aGUgZGVmYXVsdCBhY3Rpb24gb2YgdGhpcyBldmVudCBzaG91bGQgYmUgcHJldmVudGVkIGJlZm9yZVxuICogdGhpcyBldmVudCBpcyBkaXNwYXRjaGVkLlxuICovXG5mdW5jdGlvbiBzaG91bGRQcmV2ZW50RGVmYXVsdEJlZm9yZURpc3BhdGNoaW5nKFxuICBhY3Rpb25FbGVtZW50OiBFbGVtZW50LFxuICBldmVudEluZm86IGV2ZW50SW5mb0xpYi5FdmVudEluZm8sXG4pOiBib29sZWFuIHtcbiAgLy8gUHJldmVudCBicm93c2VyIGZyb20gZm9sbG93aW5nIDxhPiBub2RlIGxpbmtzIGlmIGEganNhY3Rpb24gaXMgcHJlc2VudFxuICAvLyBhbmQgd2UgYXJlIGRpc3BhdGNoaW5nIHRoZSBhY3Rpb24gbm93LiBOb3RlIHRoYXQgdGhlIHRhcmdldEVsZW1lbnQgbWF5IGJlXG4gIC8vIGEgY2hpbGQgb2YgYW4gYW5jaG9yIHRoYXQgaGFzIGEganNhY3Rpb24gYXR0YWNoZWQuIEZvciB0aGF0IHJlYXNvbiwgd2VcbiAgLy8gbmVlZCB0byBjaGVjayB0aGUgYWN0aW9uRWxlbWVudCByYXRoZXIgdGhhbiB0aGUgdGFyZ2V0RWxlbWVudC5cbiAgcmV0dXJuIChcbiAgICBhY3Rpb25FbGVtZW50LnRhZ05hbWUgPT09ICdBJyAmJlxuICAgIChldmVudEluZm9MaWIuZ2V0RXZlbnRUeXBlKGV2ZW50SW5mbykgPT09IEV2ZW50VHlwZS5DTElDSyB8fFxuICAgICAgZXZlbnRJbmZvTGliLmdldEV2ZW50VHlwZShldmVudEluZm8pID09PSBFdmVudFR5cGUuQ0xJQ0tNT0QpXG4gICk7XG59XG5cbi8qKlxuICogUGFyc2VzIGFuZCBjYWNoZXMgYW4gZWxlbWVudCdzIGpzYWN0aW9uIGVsZW1lbnQgaW50byBhIG1hcC5cbiAqXG4gKiBUaGlzIGlzIHByaW1hcmlseSBmb3IgaW50ZXJuYWwgdXNlLlxuICpcbiAqIEBwYXJhbSBhY3Rpb25FbGVtZW50IFRoZSBET00gbm9kZSB0byByZXRyaWV2ZSB0aGUganNhY3Rpb24gbWFwIGZyb20uXG4gKiBAcGFyYW0gY29udGFpbmVyIFRoZSBub2RlIHdoaWNoIGxpbWl0cyB0aGUgbmFtZXNwYWNlIGxvb2t1cCBmb3IgYSBqc2FjdGlvblxuICogbmFtZS4gVGhlIGNvbnRhaW5lciBub2RlIGl0c2VsZiB3aWxsIG5vdCBiZSBzZWFyY2hlZC5cbiAqIEByZXR1cm4gTWFwIGZyb20gZXZlbnQgdG8gcXVhbGlmaWVkIG5hbWUgb2YgdGhlIGpzYWN0aW9uIGJvdW5kIHRvIGl0LlxuICovXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VBY3Rpb25zKGFjdGlvbkVsZW1lbnQ6IEVsZW1lbnQsIGNvbnRhaW5lcjogTm9kZSk6IHtba2V5OiBzdHJpbmddOiBzdHJpbmd9IHtcbiAgbGV0IGFjdGlvbk1hcDoge1trZXk6IHN0cmluZ106IHN0cmluZ30gfCB1bmRlZmluZWQgPSBjYWNoZS5nZXQoYWN0aW9uRWxlbWVudCk7XG4gIGlmICghYWN0aW9uTWFwKSB7XG4gICAgY29uc3QganNhY3Rpb25BdHRyaWJ1dGUgPSBnZXRBdHRyKGFjdGlvbkVsZW1lbnQsIEF0dHJpYnV0ZS5KU0FDVElPTik7XG4gICAgaWYgKCFqc2FjdGlvbkF0dHJpYnV0ZSkge1xuICAgICAgYWN0aW9uTWFwID0gRU1QVFlfQUNUSU9OX01BUDtcbiAgICAgIGNhY2hlLnNldChhY3Rpb25FbGVtZW50LCBhY3Rpb25NYXApO1xuICAgIH0gZWxzZSB7XG4gICAgICBhY3Rpb25NYXAgPSBjYWNoZS5nZXRQYXJzZWQoanNhY3Rpb25BdHRyaWJ1dGUpO1xuICAgICAgaWYgKCFhY3Rpb25NYXApIHtcbiAgICAgICAgYWN0aW9uTWFwID0ge307XG4gICAgICAgIGNvbnN0IHZhbHVlcyA9IGpzYWN0aW9uQXR0cmlidXRlLnNwbGl0KFJFR0VYUF9TRU1JQ09MT04pO1xuICAgICAgICBmb3IgKGxldCBpZHggPSAwOyBpZHggPCB2YWx1ZXMubGVuZ3RoOyBpZHgrKykge1xuICAgICAgICAgIGNvbnN0IHZhbHVlID0gdmFsdWVzW2lkeF07XG4gICAgICAgICAgaWYgKCF2YWx1ZSkge1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgfVxuICAgICAgICAgIGNvbnN0IGNvbG9uID0gdmFsdWUuaW5kZXhPZihDaGFyLkVWRU5UX0FDVElPTl9TRVBBUkFUT1IpO1xuICAgICAgICAgIGNvbnN0IGhhc0NvbG9uID0gY29sb24gIT09IC0xO1xuICAgICAgICAgIGNvbnN0IHR5cGUgPSBoYXNDb2xvbiA/IHN0cmluZ1RyaW0odmFsdWUuc3Vic3RyKDAsIGNvbG9uKSkgOiBERUZBVUxUX0VWRU5UX1RZUEU7XG4gICAgICAgICAgY29uc3QgYWN0aW9uID0gaGFzQ29sb24gPyBzdHJpbmdUcmltKHZhbHVlLnN1YnN0cihjb2xvbiArIDEpKSA6IHZhbHVlO1xuICAgICAgICAgIGFjdGlvbk1hcFt0eXBlXSA9IGFjdGlvbjtcbiAgICAgICAgfVxuICAgICAgICBjYWNoZS5zZXRQYXJzZWQoanNhY3Rpb25BdHRyaWJ1dGUsIGFjdGlvbk1hcCk7XG4gICAgICB9XG4gICAgICAvLyBJZiBuYW1lc3BhY2Ugc3VwcG9ydCBpcyBhY3RpdmUgd2UgbmVlZCB0byBhdWdtZW50IHRoZSAocG90ZW50aWFsbHlcbiAgICAgIC8vIGNhY2hlZCkganNhY3Rpb24gbWFwcGluZyB3aXRoIHRoZSBuYW1lc3BhY2UuXG4gICAgICBpZiAoRXZlbnRDb250cmFjdC5KU05BTUVTUEFDRV9TVVBQT1JUKSB7XG4gICAgICAgIGNvbnN0IG5vTnMgPSBhY3Rpb25NYXA7XG4gICAgICAgIGFjdGlvbk1hcCA9IHt9O1xuICAgICAgICBmb3IgKGNvbnN0IHR5cGUgaW4gbm9Ocykge1xuICAgICAgICAgIGFjdGlvbk1hcFt0eXBlXSA9IGdldEZ1bGx5UXVhbGlmaWVkQWN0aW9uKG5vTnNbdHlwZV0sIGFjdGlvbkVsZW1lbnQsIGNvbnRhaW5lcik7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGNhY2hlLnNldChhY3Rpb25FbGVtZW50LCBhY3Rpb25NYXApO1xuICAgIH1cbiAgfVxuICByZXR1cm4gYWN0aW9uTWFwO1xufVxuXG4vKipcbiAqIFJldHVybnMgdGhlIGZ1bGx5IHF1YWxpZmllZCBqc2FjdGlvbiBhY3Rpb24uIElmIHRoZSBnaXZlbiBqc2FjdGlvblxuICogbmFtZSBkb2Vzbid0IGFscmVhZHkgY29udGFpbiB0aGUgbmFtZXNwYWNlLCB0aGUgZnVuY3Rpb24gaXRlcmF0ZXNcbiAqIG92ZXIgYW5jZXN0b3Igbm9kZXMgdW50aWwgYSBqc25hbWVzcGFjZSBhdHRyaWJ1dGUgaXMgZm91bmQsIGFuZFxuICogdXNlcyB0aGUgdmFsdWUgb2YgdGhhdCBhdHRyaWJ1dGUgYXMgdGhlIG5hbWVzcGFjZS5cbiAqXG4gKiBAcGFyYW0gYWN0aW9uIFRoZSBqc2FjdGlvbiBhY3Rpb24gdG8gcmVzb2x2ZS5cbiAqIEBwYXJhbSBzdGFydCBUaGUgbm9kZSBmcm9tIHdoaWNoIHRvIHN0YXJ0IHNlYXJjaGluZyBmb3IgYSBqc25hbWVzcGFjZVxuICogYXR0cmlidXRlLlxuICogQHBhcmFtIGNvbnRhaW5lciBUaGUgbm9kZSB3aGljaCBsaW1pdHMgdGhlIHNlYXJjaCBmb3IgYSBqc25hbWVzcGFjZVxuICogYXR0cmlidXRlLiBUaGlzIG5vZGUgd2lsbCBiZSBzZWFyY2hlZC5cbiAqIEByZXR1cm4gVGhlIGZ1bGx5IHF1YWxpZmllZCBuYW1lIG9mIHRoZSBqc2FjdGlvbi4gSWYgbm8gbmFtZXNwYWNlIGlzIGZvdW5kLFxuICogcmV0dXJucyB0aGUgdW5xdWFsaWZpZWQgbmFtZSBpbiBjYXNlIGl0IGV4aXN0cyBpbiB0aGUgZ2xvYmFsIG5hbWVzcGFjZS5cbiAqL1xuZnVuY3Rpb24gZ2V0RnVsbHlRdWFsaWZpZWRBY3Rpb24oYWN0aW9uOiBzdHJpbmcsIHN0YXJ0OiBFbGVtZW50LCBjb250YWluZXI6IE5vZGUpOiBzdHJpbmcge1xuICBpZiAoRXZlbnRDb250cmFjdC5KU05BTUVTUEFDRV9TVVBQT1JUKSB7XG4gICAgaWYgKGlzTmFtZXNwYWNlZEFjdGlvbihhY3Rpb24pKSB7XG4gICAgICByZXR1cm4gYWN0aW9uO1xuICAgIH1cblxuICAgIGxldCBub2RlOiBOb2RlIHwgbnVsbCA9IHN0YXJ0O1xuICAgIHdoaWxlIChub2RlKSB7XG4gICAgICBjb25zdCBuYW1lc3BhY2UgPSBnZXROYW1lc3BhY2VGcm9tRWxlbWVudChub2RlIGFzIEVsZW1lbnQpO1xuICAgICAgaWYgKG5hbWVzcGFjZSkge1xuICAgICAgICByZXR1cm4gbmFtZXNwYWNlICsgQ2hhci5OQU1FU1BBQ0VfQUNUSU9OX1NFUEFSQVRPUiArIGFjdGlvbjtcbiAgICAgIH1cblxuICAgICAgLy8gSWYgdGhpcyBub2RlIGlzIHRoZSBjb250YWluZXIsIHN0b3AuXG4gICAgICBpZiAobm9kZSA9PT0gY29udGFpbmVyKSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuXG4gICAgICBub2RlID0gbm9kZS5wYXJlbnROb2RlO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBhY3Rpb247XG59XG5cbi8qKlxuICogQ2hlY2tzIGlmIGEganNhY3Rpb24gYWN0aW9uIGNvbnRhaW5zIGEgbmFtZXNwYWNlIHBhcnQuXG4gKi9cbmZ1bmN0aW9uIGlzTmFtZXNwYWNlZEFjdGlvbihhY3Rpb246IHN0cmluZyk6IGJvb2xlYW4ge1xuICByZXR1cm4gYWN0aW9uLmluZGV4T2YoQ2hhci5OQU1FU1BBQ0VfQUNUSU9OX1NFUEFSQVRPUikgPj0gMDtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIHRoZSB2YWx1ZSBvZiB0aGUganNuYW1lc3BhY2UgYXR0cmlidXRlIG9mIHRoZSBnaXZlbiBub2RlLlxuICogQWxzbyBjYWNoZXMgdGhlIHZhbHVlIGZvciBzdWJzZXF1ZW50IGxvb2t1cHMuXG4gKiBAcGFyYW0gZWxlbWVudCBUaGUgbm9kZSB3aG9zZSBqc25hbWVzcGFjZSBhdHRyaWJ1dGUgaXMgYmVpbmcgYXNrZWQgZm9yLlxuICogQHJldHVybiBUaGUgdmFsdWUgb2YgdGhlIGpzbmFtZXNwYWNlIGF0dHJpYnV0ZSwgb3IgbnVsbCBpZiBub3QgZm91bmQuXG4gKi9cbmZ1bmN0aW9uIGdldE5hbWVzcGFjZUZyb21FbGVtZW50KGVsZW1lbnQ6IEVsZW1lbnQpOiBzdHJpbmcgfCBudWxsIHtcbiAgbGV0IG5hbWVzcGFjZSA9IGNhY2hlLmdldE5hbWVzcGFjZShlbGVtZW50KTtcbiAgLy8gT25seSBxdWVyeSBmb3IgdGhlIGF0dHJpYnV0ZSBpZiBpdCBoYXMgbm90IGJlZW4gcXVlcmllZCBmb3JcbiAgLy8gYmVmb3JlLiBnZXRBdHRyKCkgcmV0dXJucyBudWxsIGlmIGFuIGF0dHJpYnV0ZSBpcyBub3QgcHJlc2VudC4gVGh1cyxcbiAgLy8gbmFtZXNwYWNlIGlzIHN0cmluZ3xudWxsIGlmIHRoZSBxdWVyeSB0b29rIHBsYWNlIGluIHRoZSBwYXN0LCBvclxuICAvLyB1bmRlZmluZWQgaWYgdGhlIHF1ZXJ5IGRpZCBub3QgdGFrZSBwbGFjZS5cbiAgaWYgKG5hbWVzcGFjZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgbmFtZXNwYWNlID0gZ2V0QXR0cihlbGVtZW50LCBBdHRyaWJ1dGUuSlNOQU1FU1BBQ0UpO1xuICAgIGNhY2hlLnNldE5hbWVzcGFjZShlbGVtZW50LCBuYW1lc3BhY2UpO1xuICB9XG4gIHJldHVybiBuYW1lc3BhY2U7XG59XG5cbi8qKlxuICogQWNjZXNzZXMgdGhlIGV2ZW50IGhhbmRsZXIgYXR0cmlidXRlIHZhbHVlIG9mIGEgRE9NIG5vZGUuIEl0IGd1YXJkc1xuICogYWdhaW5zdCB3ZWlyZCBzaXR1YXRpb25zIChkZXNjcmliZWQgaW4gdGhlIGJvZHkpIHRoYXQgb2NjdXIgaW5cbiAqIGNvbm5lY3Rpb24gd2l0aCBub2RlcyB0aGF0IGFyZSByZW1vdmVkIGZyb20gdGhlaXIgZG9jdW1lbnQuXG4gKiBAcGFyYW0gZWxlbWVudCBUaGUgRE9NIGVsZW1lbnQuXG4gKiBAcGFyYW0gYXR0cmlidXRlIFRoZSBuYW1lIG9mIHRoZSBhdHRyaWJ1dGUgdG8gYWNjZXNzLlxuICogQHJldHVybiBUaGUgYXR0cmlidXRlIHZhbHVlIGlmIGl0IHdhcyBmb3VuZCwgbnVsbCBvdGhlcndpc2UuXG4gKi9cbmZ1bmN0aW9uIGdldEF0dHIoZWxlbWVudDogRWxlbWVudCwgYXR0cmlidXRlOiBzdHJpbmcpOiBzdHJpbmcgfCBudWxsIHtcbiAgbGV0IHZhbHVlID0gbnVsbDtcbiAgLy8gTk9URTogTm9kZXMgaW4gSUUgZG8gbm90IGFsd2F5cyBoYXZlIGEgZ2V0QXR0cmlidXRlXG4gIC8vIG1ldGhvZCBkZWZpbmVkLiBUaGlzIGlzIHRoZSBjYXNlIHdoZXJlIHNvdXJjZUVsZW1lbnQgaGFzIGluXG4gIC8vIGZhY3QgYmVlbiByZW1vdmVkIGZyb20gdGhlIERPTSBiZWZvcmUgZXZlbnRDb250cmFjdCBiZWdpbnNcbiAgLy8gaGFuZGxpbmcgLSB3aGVyZSBhIHBhcmVudE5vZGUgZG9lcyBub3QgaGF2ZSBnZXRBdHRyaWJ1dGVcbiAgLy8gZGVmaW5lZC5cbiAgLy8gTk9URTogV2UgbXVzdCB1c2UgdGhlICdpbicgb3BlcmF0b3IgaW5zdGVhZCBvZiB0aGUgcmVndWxhciBkb3RcbiAgLy8gbm90YXRpb24sIHNpbmNlIHRoZSBsYXR0ZXIgZmFpbHMgaW4gSUU4IGlmIHRoZSBnZXRBdHRyaWJ1dGUgbWV0aG9kIGlzIG5vdFxuICAvLyBkZWZpbmVkLiBTZWUgYi83MTM5MTA5LlxuICBpZiAoJ2dldEF0dHJpYnV0ZScgaW4gZWxlbWVudCkge1xuICAgIHZhbHVlID0gZWxlbWVudC5nZXRBdHRyaWJ1dGUoYXR0cmlidXRlKTtcbiAgfVxuICByZXR1cm4gdmFsdWU7XG59XG5cbi8qKlxuICogSGVscGVyIGZ1bmN0aW9uIHRvIHRyaW0gd2hpdGVzcGFjZSBmcm9tIHRoZSBiZWdpbm5pbmcgYW5kIHRoZSBlbmRcbiAqIG9mIHRoZSBzdHJpbmcuIFRoaXMgZGVsaWJlcmF0ZWx5IGRvZXNuJ3QgdXNlIHRoZSBjbG9zdXJlIGVxdWl2YWxlbnRcbiAqIHRvIGtlZXAgZGVwZW5kZW5jaWVzIHNtYWxsLlxuICogQHBhcmFtIHN0ciAgSW5wdXQgc3RyaW5nLlxuICogQHJldHVybiAgVHJpbW1lZCBzdHJpbmcuXG4gKi9cbmZ1bmN0aW9uIHN0cmluZ1RyaW0oc3RyOiBzdHJpbmcpOiBzdHJpbmcge1xuICBpZiAodHlwZW9mIFN0cmluZy5wcm90b3R5cGUudHJpbSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIHJldHVybiBzdHIudHJpbSgpO1xuICB9XG5cbiAgY29uc3QgdHJpbW1lZExlZnQgPSBzdHIucmVwbGFjZSgvXlxccysvLCAnJyk7XG4gIHJldHVybiB0cmltbWVkTGVmdC5yZXBsYWNlKC9cXHMrJC8sICcnKTtcbn1cbiJdfQ==