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
import { Attribute } from './attribute';
import * as cache from './cache';
import { Char } from './char';
import * as eventLib from './event';
import { A11Y_CLICK_SUPPORT, CUSTOM_EVENT_SUPPORT, JSNAMESPACE_SUPPORT, MOUSE_SPECIAL_SUPPORT, STOP_PROPAGATION, } from './event_contract_defines';
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
        this.addA11yClickListener = false;
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
     */
    handleEventInfo(eventInfo) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXZlbnRjb250cmFjdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvcHJpbWl0aXZlcy9ldmVudC1kaXNwYXRjaC9zcmMvZXZlbnRjb250cmFjdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQXNCRztBQUVILE9BQU8sS0FBSyxZQUFZLE1BQU0sY0FBYyxDQUFDO0FBQzdDLE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxhQUFhLENBQUM7QUFDdEMsT0FBTyxLQUFLLEtBQUssTUFBTSxTQUFTLENBQUM7QUFDakMsT0FBTyxFQUFDLElBQUksRUFBQyxNQUFNLFFBQVEsQ0FBQztBQUU1QixPQUFPLEtBQUssUUFBUSxNQUFNLFNBQVMsQ0FBQztBQUVwQyxPQUFPLEVBQ0wsa0JBQWtCLEVBQ2xCLG9CQUFvQixFQUNwQixtQkFBbUIsRUFDbkIscUJBQXFCLEVBQ3JCLGdCQUFnQixHQUNqQixNQUFNLDBCQUEwQixDQUFDO0FBQ2xDLE9BQU8sS0FBSyxZQUFZLE1BQU0sY0FBYyxDQUFDO0FBQzdDLE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxjQUFjLENBQUM7QUFDdkMsT0FBTyxFQUFDLFFBQVEsRUFBQyxNQUFNLFlBQVksQ0FBQztBQStCcEMsTUFBTSxrQkFBa0IsR0FBVyxTQUFTLENBQUMsS0FBSyxDQUFDO0FBRW5EOzs7R0FHRztBQUNILE1BQU0sZ0JBQWdCLEdBQTRCLEVBQUUsQ0FBQztBQUVyRDs7R0FFRztBQUNILE1BQU0sZ0JBQWdCLEdBQUcsU0FBUyxDQUFDO0FBRW5DOzs7Ozs7Ozs7Ozs7O0dBYUc7QUFDSCxNQUFNLE9BQU8sYUFBYTthQUNqQix5QkFBb0IsR0FBRyxvQkFBb0IsQUFBdkIsQ0FBd0I7YUFDNUMscUJBQWdCLEdBQUcsZ0JBQWdCLEFBQW5CLENBQW9CO2FBQ3BDLHVCQUFrQixHQUFHLGtC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LE9BQU8sTUFBTSxDQUFDLFNBQVMsQ0FBQyxJQUFJLEtBQUssVUFBVSxFQUFFLENBQUM7UUFDaEQsT0FBTyxHQUFHLENBQUMsSUFBSSxFQUFFLENBQUM7SUFDcEIsQ0FBQztJQUVELE1BQU0sV0FBVyxHQUFHLEdBQUcsQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBQzVDLE9BQU8sV0FBVyxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLENBQUM7QUFDekMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgSW1wbGVtZW50cyB0aGUgbG9jYWwgZXZlbnQgaGFuZGxpbmcgY29udHJhY3QuIFRoaXNcbiAqIGFsbG93cyBET00gb2JqZWN0cyBpbiBhIGNvbnRhaW5lciB0aGF0IGVudGVycyBpbnRvIHRoaXMgY29udHJhY3QgdG9cbiAqIGRlZmluZSBldmVudCBoYW5kbGVycyB3aGljaCBhcmUgZXhlY3V0ZWQgaW4gYSBsb2NhbCBjb250ZXh0LlxuICpcbiAqIE9uZSBFdmVudENvbnRyYWN0IGluc3RhbmNlIGNhbiBtYW5hZ2UgdGhlIGNvbnRyYWN0IGZvciBtdWx0aXBsZVxuICogY29udGFpbmVycywgd2hpY2ggYXJlIGFkZGVkIHVzaW5nIHRoZSBhZGRDb250YWluZXIoKSBtZXRob2QuXG4gKlxuICogRXZlbnRzIGNhbiBiZSByZWdpc3RlcmVkIHVzaW5nIHRoZSBhZGRFdmVudCgpIG1ldGhvZC5cbiAqXG4gKiBBIERpc3BhdGNoZXIgaXMgYWRkZWQgdXNpbmcgdGhlIHJlZ2lzdGVyRGlzcGF0Y2hlcigpIG1ldGhvZC4gVW50aWwgdGhlcmUgaXNcbiAqIGEgZGlzcGF0Y2hlciwgZXZlbnRzIGFyZSBxdWV1ZWQuIFRoZSBpZGVhIGlzIHRoYXQgdGhlIEV2ZW50Q29udHJhY3RcbiAqIGNsYXNzIGlzIGlubGluZWQgaW4gdGhlIEhUTUwgb2YgdGhlIHRvcCBsZXZlbCBwYWdlIGFuZCBpbnN0YW50aWF0ZWRcbiAqIHJpZ2h0IGFmdGVyIHRoZSBzdGFydCBvZiA8Ym9keT4uIFRoZSBEaXNwYXRjaGVyIGNsYXNzIGlzIGNvbnRhaW5lZFxuICogaW4gdGhlIGV4dGVybmFsIGRlZmVycmVkIGpzLCBhbmQgaW5zdGFudGlhdGVkIGFuZCByZWdpc3RlcmVkIHdpdGhcbiAqIEV2ZW50Q29udHJhY3Qgd2hlbiB0aGUgZXh0ZXJuYWwgamF2YXNjcmlwdCBpbiB0aGUgcGFnZSBsb2Fkcy4gVGhlXG4gKiBleHRlcm5hbCBqYXZhc2NyaXB0IHdpbGwgYWxzbyByZWdpc3RlciB0aGUganNhY3Rpb24gaGFuZGxlcnMsIHdoaWNoXG4gKiB0aGVuIHBpY2sgdXAgdGhlIHF1ZXVlZCBldmVudHMgYXQgdGhlIHRpbWUgb2YgcmVnaXN0cmF0aW9uLlxuICpcbiAqIFNpbmNlIHRoaXMgY2xhc3MgaXMgbWVhbnQgdG8gYmUgaW5saW5lZCBpbiB0aGUgbWFpbiBwYWdlIEhUTUwsIHRoZVxuICogc2l6ZSBvZiB0aGUgYmluYXJ5IGNvbXBpbGVkIGZyb20gdGhpcyBmaWxlIE1VU1QgYmUga2VwdCBhcyBzbWFsbCBhc1xuICogcG9zc2libGUgYW5kIHRodXMgaXRzIGRlcGVuZGVuY2llcyB0byBhIG1pbmltdW0uXG4gKi9cblxuaW1wb3J0ICogYXMgYTExeUNsaWNrTGliIGZyb20gJy4vYTExeV9jbGljayc7XG5pbXBvcnQge0F0dHJpYnV0ZX0gZnJvbSAnLi9hdHRyaWJ1dGUnO1xuaW1wb3J0ICogYXMgY2FjaGUgZnJvbSAnLi9jYWNoZSc7XG5pbXBvcnQge0NoYXJ9IGZyb20gJy4vY2hhcic7XG5pbXBvcnQge0Vhcmx5SnNhY3Rpb25EYXRhfSBmcm9tICcuL2Vhcmx5ZXZlbnRjb250cmFjdCc7XG5pbXBvcnQgKiBhcyBldmVudExpYiBmcm9tICcuL2V2ZW50JztcbmltcG9ydCB7RXZlbnRDb250cmFjdENvbnRhaW5lck1hbmFnZXJ9IGZyb20gJy4vZXZlbnRfY29udHJhY3RfY29udGFpbmVyJztcbmltcG9ydCB7XG4gIEExMVlfQ0xJQ0tfU1VQUE9SVCxcbiAgQ1VTVE9NX0VWRU5UX1NVUFBPUlQsXG4gIEpTTkFNRVNQQUNFX1NVUFBPUlQsXG4gIE1PVVNFX1NQRUNJQUxfU1VQUE9SVCxcbiAgU1RPUF9QUk9QQUdBVElPTixcbn0gZnJvbSAnLi9ldmVudF9jb250cmFjdF9kZWZpbmVzJztcbmltcG9ydCAqIGFzIGV2ZW50SW5mb0xpYiBmcm9tICcuL2V2ZW50X2luZm8nO1xuaW1wb3J0IHtFdmVudFR5cGV9IGZyb20gJy4vZXZlbnRfdHlwZSc7XG5pbXBvcnQge1Byb3BlcnR5fSBmcm9tICcuL3Byb3BlcnR5JztcbmltcG9ydCB7UmVzdHJpY3Rpb259IGZyb20gJy4vcmVzdHJpY3Rpb24nO1xuXG4vKipcbiAqIFRoZSBBUEkgb2YgYW4gRXZlbnRDb250cmFjdCB0aGF0IGlzIHNhZmUgdG8gY2FsbCBmcm9tIGFueSBjb21waWxhdGlvbiB1bml0LlxuICovXG5leHBvcnQgZGVjbGFyZSBpbnRlcmZhY2UgVW5yZW5hbWVkRXZlbnRDb250cmFjdCB7XG4gIC8vIEFsaWFzIGZvciBKc2N0aW9uIEV2ZW50Q29udHJhY3QgcmVnaXN0ZXJEaXNwYXRjaGVyLlxuICBlY3JkKGRpc3BhdGNoZXI6IERpc3BhdGNoZXIsIHJlc3RyaWN0aW9uOiBSZXN0cmljdGlvbik6IHZvaWQ7XG4gIC8vIFVucmVuYW1lZCBmdW5jdGlvbi4gQWJicmV2aWF0aW9uIGZvciBgZXZlbnRDb250cmFjdC5hZGRBMTF5Q2xpY2tTdXBwb3J0YC5cbiAgZWNhYWNzPzogKFxuICAgIHVwZGF0ZUV2ZW50SW5mb0ZvckExMXlDbGljazogdHlwZW9mIGExMXlDbGlja0xpYi51cGRhdGVFdmVudEluZm9Gb3JBMTF5Q2xpY2ssXG4gICAgcHJldmVudERlZmF1bHRGb3JBMTF5Q2xpY2s6IHR5cGVvZiBhMTF5Q2xpY2tMaWIucHJldmVudERlZmF1bHRGb3JBMTF5Q2xpY2ssXG4gICAgcG9wdWxhdGVDbGlja09ubHlBY3Rpb246IHR5cGVvZiBhMTF5Q2xpY2tMaWIucG9wdWxhdGVDbGlja09ubHlBY3Rpb24sXG4gICkgPT4gdm9pZDtcbn1cblxuLyoqIEEgZnVuY3Rpb24gdGhhdCBpcyBjYWxsZWQgdG8gaGFuZGxlIGV2ZW50cyBjYXB0dXJlZCBieSB0aGUgRXZlbnRDb250cmFjdC4gKi9cbmV4cG9ydCB0eXBlIERpc3BhdGNoZXIgPSAoZXZlbnRJbmZvOiBldmVudEluZm9MaWIuRXZlbnRJbmZvLCBnbG9iYWxEaXNwYXRjaD86IGJvb2xlYW4pID0+IHZvaWQ7XG5cbi8qKlxuICogQSBmdW5jdGlvbiB0aGF0IGhhbmRsZXMgYW4gZXZlbnQgZGlzcGF0Y2hlZCBmcm9tIHRoZSBicm93c2VyLlxuICpcbiAqIGV2ZW50VHlwZTogTWF5IGRpZmZlciBmcm9tIGBldmVudC50eXBlYCBpZiBKU0FjdGlvbiB1c2VzIGFcbiAqIHNob3J0LWhhbmQgbmFtZSBvciBpcyBwYXRjaGluZyBvdmVyIGFuIG5vbi1idWJibGluZyBldmVudCB3aXRoIGEgYnViYmxpbmdcbiAqIHZhcmlhbnQuXG4gKiBldmVudDogVGhlIG5hdGl2ZSBicm93c2VyIGV2ZW50LlxuICogY29udGFpbmVyOiBUaGUgY29udGFpbmVyIGZvciB0aGlzIGRpc3BhdGNoLlxuICovXG50eXBlIEV2ZW50SGFuZGxlciA9IChldmVudFR5cGU6IHN0cmluZywgZXZlbnQ6IEV2ZW50LCBjb250YWluZXI6IEVsZW1lbnQpID0+IHZvaWQ7XG5cbmNvbnN0IERFRkFVTFRfRVZFTlRfVFlQRTogc3RyaW5nID0gRXZlbnRUeXBlLkNMSUNLO1xuXG4vKipcbiAqIFNpbmNlIG1hcHMgZnJvbSBldmVudCB0byBhY3Rpb24gYXJlIGltbXV0YWJsZSB3ZSBjYW4gdXNlIGEgc2luZ2xlIG1hcFxuICogdG8gcmVwcmVzZW50IHRoZSBlbXB0eSBtYXAuXG4gKi9cbmNvbnN0IEVNUFRZX0FDVElPTl9NQVA6IHtba2V5OiBzdHJpbmddOiBzdHJpbmd9ID0ge307XG5cbi8qKlxuICogVGhpcyByZWd1bGFyIGV4cHJlc3Npb24gbWF0Y2hlcyBhIHNlbWljb2xvbi5cbiAqL1xuY29uc3QgUkVHRVhQX1NFTUlDT0xPTiA9IC9cXHMqO1xccyovO1xuXG4vKipcbiAqIEV2ZW50Q29udHJhY3QgaW50ZXJjZXB0cyBldmVudHMgaW4gdGhlIGJ1YmJsaW5nIHBoYXNlIGF0IHRoZVxuICogYm91bmRhcnkgb2YgYSBjb250YWluZXIgZWxlbWVudCwgYW5kIG1hcHMgdGhlbSB0byBnZW5lcmljIGFjdGlvbnNcbiAqIHdoaWNoIGFyZSBzcGVjaWZpZWQgdXNpbmcgdGhlIGN1c3RvbSBqc2FjdGlvbiBhdHRyaWJ1dGUgaW5cbiAqIEhUTUwuIEJlaGF2aW9yIG9mIHRoZSBhcHBsaWNhdGlvbiBpcyB0aGVuIHNwZWNpZmllZCBpbiB0ZXJtcyBvZlxuICogaGFuZGxlciBmb3Igc3VjaCBhY3Rpb25zLCBjZi4ganNhY3Rpb24uRGlzcGF0Y2hlciBpbiBkaXNwYXRjaGVyLmpzLlxuICpcbiAqIFRoaXMgaGFzIHNldmVyYWwgYmVuZWZpdHM6ICgxKSBObyBET00gZXZlbnQgaGFuZGxlcnMgbmVlZCB0byBiZVxuICogcmVnaXN0ZXJlZCBvbiB0aGUgc3BlY2lmaWMgZWxlbWVudHMgaW4gdGhlIFVJLiAoMikgVGhlIHNldCBvZlxuICogZXZlbnRzIHRoYXQgdGhlIGFwcGxpY2F0aW9uIGhhcyB0byBoYW5kbGUgY2FuIGJlIHNwZWNpZmllZCBpbiB0ZXJtc1xuICogb2YgdGhlIHNlbWFudGljcyBvZiB0aGUgYXBwbGljYXRpb24sIHJhdGhlciB0aGFuIGluIHRlcm1zIG9mIERPTVxuICogZXZlbnRzLiAoMykgSW52b2NhdGlvbiBvZiBoYW5kbGVycyBjYW4gYmUgZGVsYXllZCBhbmQgaGFuZGxlcnMgY2FuXG4gKiBiZSBkZWxheSBsb2FkZWQgaW4gYSBnZW5lcmljIHdheS5cbiAqL1xuZXhwb3J0IGNsYXNzIEV2ZW50Q29udHJhY3QgaW1wbGVtZW50cyBVbnJlbmFtZWRFdmVudENvbnRyYWN0IHtcbiAgc3RhdGljIENVU1RPTV9FVkVOVF9TVVBQT1JUID0gQ1VTVE9NX0VWRU5UX1NVUFBPUlQ7XG4gIHN0YXRpYyBTVE9QX1BST1BBR0FUSU9OID0gU1RPUF9QUk9QQUdBVElPTjtcbiAgc3RhdGljIEExMVlfQ0xJQ0tfU1VQUE9SVCA9IEExMVlfQ0xJQ0tfU1VQUE9SVDtcbiAgc3RhdGljIE1PVVNFX1NQRUNJQUxfU1VQUE9SVCA9IE1PVVNFX1NQRUNJQUxfU1VQUE9SVDtcbiAgc3RhdGljIEpTTkFNRVNQQUNFX1NVUFBPUlQgPSBKU05BTUVTUEFDRV9TVVBQT1JUO1xuXG4gIHByaXZhdGUgY29udGFpbmVyTWFuYWdlcjogRXZlbnRDb250cmFjdENvbnRhaW5lck1hbmFnZXIgfCBudWxsO1xuXG4gIC8qKlxuICAgKiBUaGUgRE9NIGV2ZW50cyB3aGljaCB0aGlzIGNvbnRyYWN0IGNvdmVycy4gVXNlZCB0byBwcmV2ZW50IGRvdWJsZVxuICAgKiByZWdpc3RyYXRpb24gb2YgZXZlbnQgdHlwZXMuIFRoZSB2YWx1ZSBvZiB0aGUgbWFwIGlzIHRoZVxuICAgKiBpbnRlcm5hbGx5IGNyZWF0ZWQgRE9NIGV2ZW50IGhhbmRsZXIgZnVuY3Rpb24gdGhhdCBoYW5kbGVzIHRoZVxuICAgKiBET00gZXZlbnRzLiBTZWUgYWRkRXZlbnQoKS5cbiAgICpcbiAgICovXG4gIHByaXZhdGUgZXZlbnRIYW5kbGVyczoge1trZXk6IHN0cmluZ106IEV2ZW50SGFuZGxlcn0gPSB7fTtcblxuICBwcml2YXRlIGJyb3dzZXJFdmVudFR5cGVUb0V4dHJhRXZlbnRUeXBlczoge1trZXk6IHN0cmluZ106IHN0cmluZ1tdfSA9IHt9O1xuXG4gIC8qKlxuICAgKiBUaGUgZGlzcGF0Y2hlciBmdW5jdGlvbi4gRXZlbnRzIGFyZSBwYXNzZWQgdG8gdGhpcyBmdW5jdGlvbiBmb3JcbiAgICogaGFuZGxpbmcgb25jZSBpdCB3YXMgc2V0IHVzaW5nIHRoZSByZWdpc3RlckRpc3BhdGNoZXIoKSBtZXRob2QuIFRoaXMgaXNcbiAgICogZG9uZSBiZWNhdXNlIHRoZSBmdW5jdGlvbiBpcyBwYXNzZWQgZnJvbSBhbm90aGVyIGpzYmluYXJ5LCBzbyBwYXNzaW5nIHRoZVxuICAgKiBpbnN0YW5jZSBhbmQgaW52b2tpbmcgdGhlIG1ldGhvZCBoZXJlIHdvdWxkIHJlcXVpcmUgdG8gbGVhdmUgdGhlIG1ldGhvZFxuICAgKiB1bm9iZnVzY2F0ZWQuXG4gICAqL1xuICBwcml2YXRlIGRpc3BhdGNoZXI6IERpc3BhdGNoZXIgfCBudWxsID0gbnVsbDtcblxuICAvKipcbiAgICogVGhlIGxpc3Qgb2Ygc3VzcGVuZGVkIGBFdmVudEluZm9gIHRoYXQgd2lsbCBiZSBkaXNwYXRjaGVkXG4gICAqIGFzIHNvb24gYXMgdGhlIGBEaXNwYXRjaGVyYCBpcyByZWdpc3RlcmVkLlxuICAgKi9cbiAgcHJpdmF0ZSBxdWV1ZWRFdmVudEluZm9zOiBldmVudEluZm9MaWIuRXZlbnRJbmZvW10gfCBudWxsID0gW107XG5cbiAgLyoqIFdoZXRoZXIgYTExeSBjbGljayBzdXBwb3J0IGhhcyBiZWVuIGxvYWRlZCBvciBub3QuICovXG4gIHByaXZhdGUgaGFzQTExeUNsaWNrU3VwcG9ydCA9IGZhbHNlO1xuICAvKiogV2hldGhlciB0byBhZGQgYW4gYTExeSBjbGljayBsaXN0ZW5lci4gKi9cbiAgcHJpdmF0ZSBhZGRBMTF5Q2xpY2tMaXN0ZW5lciA9IGZhbHNlO1xuXG4gIHByaXZhdGUgdXBkYXRlRXZlbnRJbmZvRm9yQTExeUNsaWNrPzogKGV2ZW50SW5mbzogZXZlbnRJbmZvTGliLkV2ZW50SW5mbykgPT4gdm9pZCA9IHVuZGVmaW5lZDtcblxuICBwcml2YXRlIHByZXZlbnREZWZhdWx0Rm9yQTExeUNsaWNrPzogKGV2ZW50SW5mbzogZXZlbnRJbmZvTGliLkV2ZW50SW5mbykgPT4gdm9pZCA9IHVuZGVmaW5lZDtcblxuICBwcml2YXRlIHBvcHVsYXRlQ2xpY2tPbmx5QWN0aW9uPzogKFxuICAgIGFjdGlvbkVsZW1lbnQ6IEVsZW1lbnQsXG4gICAgZXZlbnRJbmZvOiBldmVudEluZm9MaWIuRXZlbnRJbmZvLFxuICAgIGFjdGlvbk1hcDoge1trZXk6IHN0cmluZ106IHN0cmluZ30sXG4gICkgPT4gdm9pZCA9IHVuZGVmaW5lZDtcblxuICBlY2FhY3M/OiAoXG4gICAgdXBkYXRlRXZlbnRJbmZvRm9yQTExeUNsaWNrOiB0eXBlb2YgYTExeUNsaWNrTGliLnVwZGF0ZUV2ZW50SW5mb0ZvckExMXlDbGljayxcbiAgICBwcmV2ZW50RGVmYXVsdEZvckExMXlDbGljazogdHlwZW9mIGExMXlDbGlja0xpYi5wcmV2ZW50RGVmYXVsdEZvckExMXlDbGljayxcbiAgICBwb3B1bGF0ZUNsaWNrT25seUFjdGlvbjogdHlwZW9mIGExMXlDbGlja0xpYi5wb3B1bGF0ZUNsaWNrT25seUFjdGlvbixcbiAgKSA9PiB2b2lkO1xuXG4gIGNvbnN0cnVjdG9yKGNvbnRhaW5lck1hbmFnZXI6IEV2ZW50Q29udHJhY3RDb250YWluZXJNYW5hZ2VyKSB7XG4gICAgdGhpcy5jb250YWluZXJNYW5hZ2VyID0gY29udGFpbmVyTWFuYWdlcjtcbiAgICBpZiAoRXZlbnRDb250cmFjdC5DVVNUT01fRVZFTlRfU1VQUE9SVCkge1xuICAgICAgdGhpcy5hZGRFdmVudChFdmVudFR5cGUuQ1VTVE9NKTtcbiAgICB9XG4gICAgaWYgKEV2ZW50Q29udHJhY3QuQTExWV9DTElDS19TVVBQT1JUKSB7XG4gICAgICAvLyBBZGQgYTExeSBjbGljayBzdXBwb3J0IHRvIHRoZSBgRXZlbnRDb250cmFjdGAuXG4gICAgICB0aGlzLmFkZEExMXlDbGlja1N1cHBvcnQoKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGhhbmRsZUV2ZW50KGV2ZW50VHlwZTogc3RyaW5nLCBldmVudDogRXZlbnQsIGNvbnRhaW5lcjogRWxlbWVudCkge1xuICAgIGNvbnN0IGV2ZW50SW5mbyA9IGV2ZW50SW5mb0xpYi5jcmVhdGVFdmVudEluZm9Gcm9tUGFyYW1ldGVycyhcbiAgICAgIC8qIGV2ZW50VHlwZT0gKi8gZXZlbnRUeXBlLFxuICAgICAgLyogZXZlbnQ9ICovIGV2ZW50LFxuICAgICAgLyogdGFyZ2V0RWxlbWVudD0gKi8gZXZlbnQudGFyZ2V0IGFzIEVsZW1lbnQsXG4gICAgICAvKiBjb250YWluZXI9ICovIGNvbnRhaW5lcixcbiAgICAgIC8qIHRpbWVzdGFtcD0gKi8gRGF0ZS5ub3coKSxcbiAgICApO1xuICAgIHRoaXMuaGFuZGxlRXZlbnRJbmZvKGV2ZW50SW5mbyk7XG4gIH1cblxuICAvKipcbiAgICogSGFuZGxlIGFuIGBFdmVudEluZm9gLlxuICAgKi9cbiAgcHJpdmF0ZSBoYW5kbGVFdmVudEluZm8oZXZlbnRJbmZvOiBldmVudEluZm9MaWIuRXZlbnRJbmZvKSB7XG4gICAgaWYgKCF0aGlzLmRpc3BhdGNoZXIpIHtcbiAgICAgIC8vIEFsbCBldmVudHMgYXJlIHF1ZXVlZCB3aGVuIHRoZSBkaXNwYXRjaGVyIGlzbid0IHlldCBsb2FkZWQuXG4gICAgICBldmVudEluZm9MaWIuc2V0SXNSZXBsYXkoZXZlbnRJbmZvLCB0cnVlKTtcbiAgICAgIHRoaXMucXVldWVkRXZlbnRJbmZvcz8ucHVzaChldmVudEluZm8pO1xuICAgIH1cbiAgICBpZiAoXG4gICAgICBFdmVudENvbnRyYWN0LkNVU1RPTV9FVkVOVF9TVVBQT1JUICYmXG4gICAgICBldmVudEluZm9MaWIuZ2V0RXZlbnRUeXBlKGV2ZW50SW5mbykgPT09IEV2ZW50VHlwZS5DVVNUT01cbiAgICApIHtcbiAgICAgIGNvbnN0IGRldGFpbCA9IChldmVudEluZm9MaWIuZ2V0RXZlbnQoZXZlbnRJbmZvKSBhcyBDdXN0b21FdmVudCkuZGV0YWlsO1xuICAgICAgLy8gRm9yIGN1c3RvbSBldmVudHMsIHVzZSBhIHNlY29uZGFyeSBkaXNwYXRjaCBiYXNlZCBvbiB0aGUgaW50ZXJuYWxcbiAgICAgIC8vIGN1c3RvbSB0eXBlIG9mIHRoZSBldmVudC5cbiAgICAgIGlmICghZGV0YWlsIHx8ICFkZXRhaWxbJ190eXBlJ10pIHtcbiAgICAgICAgLy8gVGhpcyBzaG91bGQgbmV2ZXIgaGFwcGVuLlxuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBldmVudEluZm9MaWIuc2V0RXZlbnRUeXBlKGV2ZW50SW5mbywgZGV0YWlsWydfdHlwZSddKTtcbiAgICB9XG5cbiAgICB0aGlzLnBvcHVsYXRlQWN0aW9uKGV2ZW50SW5mbyk7XG5cbiAgICBpZiAoIXRoaXMuZGlzcGF0Y2hlcikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCBnbG9iYWxFdmVudEluZm86IGV2ZW50SW5mb0xpYi5FdmVudEluZm8gPSBldmVudEluZm9MaWIuY2xvbmVFdmVudEluZm8oZXZlbnRJbmZvKTtcblxuICAgIC8vIEluIHNvbWUgY2FzZXMsIGBwb3B1bGF0ZUFjdGlvbmAgd2lsbCByZXdyaXRlIGBjbGlja2AgZXZlbnRzIHRvXG4gICAgLy8gYGNsaWNrb25seWAuIFJldmVydCBiYWNrIHRvIGEgcmVndWxhciBjbGljaywgb3RoZXJ3aXNlIHdlIHdvbid0IGJlIGFibGVcbiAgICAvLyB0byBleGVjdXRlIGdsb2JhbCBldmVudCBoYW5kbGVycyByZWdpc3RlcmVkIG9uIGNsaWNrIGV2ZW50cy5cbiAgICBpZiAoZXZlbnRJbmZvTGliLmdldEV2ZW50VHlwZShnbG9iYWxFdmVudEluZm8pID09PSBFdmVudFR5cGUuQ0xJQ0tPTkxZKSB7XG4gICAgICBldmVudEluZm9MaWIuc2V0RXZlbnRUeXBlKGdsb2JhbEV2ZW50SW5mbywgRXZlbnRUeXBlLkNMSUNLKTtcbiAgICB9XG5cbiAgICB0aGlzLmRpc3BhdGNoZXIoZ2xvYmFsRXZlbnRJbmZvLCAvKiBkaXNwYXRjaCBnbG9iYWwgZXZlbnQgKi8gdHJ1ZSk7XG5cbiAgICBjb25zdCBhY3Rpb24gPSBldmVudEluZm9MaWIuZ2V0QWN0aW9uKGV2ZW50SW5mbyk7XG4gICAgaWYgKCFhY3Rpb24pIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKHNob3VsZFByZXZlbnREZWZhdWx0QmVmb3JlRGlzcGF0Y2hpbmcoZXZlbnRJbmZvTGliLmdldEFjdGlvbkVsZW1lbnQoYWN0aW9uKSwgZXZlbnRJbmZvKSkge1xuICAgICAgZXZlbnRMaWIucHJldmVudERlZmF1bHQoZXZlbnRJbmZvTGliLmdldEV2ZW50KGV2ZW50SW5mbykpO1xuICAgIH1cblxuICAgIHRoaXMuZGlzcGF0Y2hlcihldmVudEluZm8pO1xuICB9XG5cbiAgLyoqXG4gICAqIFNlYXJjaGVzIGZvciBhIGpzYWN0aW9uIHRoYXQgdGhlIERPTSBldmVudCBtYXBzIHRvIGFuZCBjcmVhdGVzIGFuXG4gICAqIG9iamVjdCBjb250YWluaW5nIGV2ZW50IGluZm9ybWF0aW9uIHVzZWQgZm9yIGRpc3BhdGNoaW5nIGJ5XG4gICAqIGpzYWN0aW9uLkRpc3BhdGNoZXIuIFRoaXMgbWV0aG9kIHBvcHVsYXRlcyB0aGUgYGFjdGlvbmAgYW5kIGBhY3Rpb25FbGVtZW50YFxuICAgKiBmaWVsZHMgb2YgdGhlIEV2ZW50SW5mbyBvYmplY3QgcGFzc2VkIGluIGJ5IGZpbmRpbmcgdGhlIGZpcnN0XG4gICAqIGpzYWN0aW9uIGF0dHJpYnV0ZSBhYm92ZSB0aGUgdGFyZ2V0IE5vZGUgb2YgdGhlIGV2ZW50LCBhbmQgYmVsb3dcbiAgICogdGhlIGNvbnRhaW5lciBOb2RlLCB0aGF0IHNwZWNpZmllcyBhIGpzYWN0aW9uIGZvciB0aGUgZXZlbnRcbiAgICogdHlwZS4gSWYgbm8gc3VjaCBqc2FjdGlvbiBpcyBmb3VuZCwgdGhlbiBhY3Rpb24gaXMgdW5kZWZpbmVkLlxuICAgKlxuICAgKiBAcGFyYW0gZXZlbnRJbmZvIGBFdmVudEluZm9gIHRvIHNldCBgYWN0aW9uYCBhbmQgYGFjdGlvbkVsZW1lbnRgIGlmIGFuXG4gICAqICAgIGFjdGlvbiBpcyBmb3VuZCBvbiBhbnkgYEVsZW1lbnRgIGluIHRoZSBwYXRoIG9mIHRoZSBgRXZlbnRgLlxuICAgKi9cbiAgcHJpdmF0ZSBwb3B1bGF0ZUFjdGlvbihldmVudEluZm86IGV2ZW50SW5mb0xpYi5FdmVudEluZm8pIHtcbiAgICAvLyBXZSBkaXN0aW5ndWlzaCBtb2RpZmllZCBhbmQgcGxhaW4gY2xpY2tzIGluIG9yZGVyIHRvIHN1cHBvcnQgdGhlXG4gICAgLy8gZGVmYXVsdCBicm93c2VyIGJlaGF2aW9yIG9mIG1vZGlmaWVkIGNsaWNrcyBvbiBsaW5rczsgdXN1YWxseSB0b1xuICAgIC8vIG9wZW4gdGhlIFVSTCBvZiB0aGUgbGluayBpbiBuZXcgdGFiIG9yIG5ldyB3aW5kb3cgb24gY3RybC9jbWRcbiAgICAvLyBjbGljay4gQSBET00gJ2NsaWNrJyBldmVudCBpcyBtYXBwZWQgdG8gdGhlIGpzYWN0aW9uICdjbGljaydcbiAgICAvLyBldmVudCBpZmYgdGhlcmUgaXMgbm8gbW9kaWZpZXIgcHJlc2VudCBvbiB0aGUgZXZlbnQuIElmIHRoZXJlIGlzXG4gICAgLy8gYSBtb2RpZmllciwgaXQncyBtYXBwZWQgdG8gJ2NsaWNrbW9kJyBpbnN0ZWFkLlxuICAgIC8vXG4gICAgLy8gSXQncyBhbGxvd2VkIHRvIG9taXQgdGhlIGV2ZW50IGluIHRoZSBqc2FjdGlvbiBhdHRyaWJ1dGUuIEluIHRoYXRcbiAgICAvLyBjYXNlLCAnY2xpY2snIGlzIGFzc3VtZWQuIFRodXMgdGhlIGZvbGxvd2luZyB0d28gYXJlIGVxdWl2YWxlbnQ6XG4gICAgLy9cbiAgICAvLyAgIDxhIGhyZWY9XCJzb21ldXJsXCIganNhY3Rpb249XCJnbmEuZnVcIj5cbiAgICAvLyAgIDxhIGhyZWY9XCJzb21ldXJsXCIganNhY3Rpb249XCJjbGljazpnbmEuZnVcIj5cbiAgICAvL1xuICAgIC8vIEZvciB1bm1vZGlmaWVkIGNsaWNrcywgRXZlbnRDb250cmFjdCBpbnZva2VzIHRoZSBqc2FjdGlvblxuICAgIC8vICdnbmEuZnUnLiBGb3IgbW9kaWZpZWQgY2xpY2tzLCBFdmVudENvbnRyYWN0IHdvbid0IGZpbmQgYVxuICAgIC8vIHN1aXRhYmxlIGFjdGlvbiBhbmQgbGVhdmUgdGhlIGV2ZW50IHRvIGJlIGhhbmRsZWQgYnkgdGhlXG4gICAgLy8gYnJvd3Nlci5cbiAgICAvL1xuICAgIC8vIEluIG9yZGVyIHRvIGFsc28gaW52b2tlIGEganNhY3Rpb24gaGFuZGxlciBmb3IgYSBtb2RpZmllciBjbGljayxcbiAgICAvLyAnY2xpY2ttb2QnIG5lZWRzIHRvIGJlIHVzZWQ6XG4gICAgLy9cbiAgICAvLyAgIDxhIGhyZWY9XCJzb21ldXJsXCIganNhY3Rpb249XCJjbGlja21vZDpnbmEuZnVcIj5cbiAgICAvL1xuICAgIC8vIEV2ZW50Q29udHJhY3QgaW52b2tlcyB0aGUganNhY3Rpb24gJ2duYS5mdScgZm9yIG1vZGlmaWVkXG4gICAgLy8gY2xpY2tzLiBVbm1vZGlmaWVkIGNsaWNrcyBhcmUgbGVmdCB0byB0aGUgYnJvd3Nlci5cbiAgICAvL1xuICAgIC8vIEluIG9yZGVyIHRvIHNldCB1cCB0aGUgZXZlbnQgY29udHJhY3QgdG8gaGFuZGxlIGJvdGggY2xpY2tvbmx5IGFuZFxuICAgIC8vIGNsaWNrbW9kLCBvbmx5IGFkZEV2ZW50KEV2ZW50VHlwZS5DTElDSykgaXMgbmVjZXNzYXJ5LlxuICAgIC8vXG4gICAgLy8gSW4gb3JkZXIgdG8gc2V0IHVwIHRoZSBldmVudCBjb250cmFjdCB0byBoYW5kbGUgY2xpY2ssXG4gICAgLy8gYWRkRXZlbnQoKSBpcyBuZWNlc3NhcnkgZm9yIENMSUNLLCBLRVlET1dOLCBhbmQgS0VZUFJFU1MgZXZlbnQgdHlwZXMuICBJZlxuICAgIC8vIGExMXkgY2xpY2sgc3VwcG9ydCBpcyBlbmFibGVkLCBhZGRFdmVudCgpIHdpbGwgc2V0IHVwIHRoZSBhcHByb3ByaWF0ZSBrZXlcbiAgICAvLyBldmVudCBoYW5kbGVyIGF1dG9tYXRpY2FsbHkuXG4gICAgaWYgKFxuICAgICAgZXZlbnRJbmZvTGliLmdldEV2ZW50VHlwZShldmVudEluZm8pID09PSBFdmVudFR5cGUuQ0xJQ0sgJiZcbiAgICAgIGV2ZW50TGliLmlzTW9kaWZpZWRDbGlja0V2ZW50KGV2ZW50SW5mb0xpYi5nZXRFdmVudChldmVudEluZm8pKVxuICAgICkge1xuICAgICAgZXZlbnRJbmZvTGliLnNldEV2ZW50VHlwZShldmVudEluZm8sIEV2ZW50VHlwZS5DTElDS01PRCk7XG4gICAgfSBlbHNlIGlmICh0aGlzLmhhc0ExMXlDbGlja1N1cHBvcnQpIHtcbiAgICAgIHRoaXMudXBkYXRlRXZlbnRJbmZvRm9yQTExeUNsaWNrIShldmVudEluZm8pO1xuICAgIH1cblxuICAgIC8vIFdhbGsgdG8gdGhlIHBhcmVudCBub2RlLCB1bmxlc3MgdGhlIG5vZGUgaGFzIGEgZGlmZmVyZW50IG93bmVyIGluXG4gICAgLy8gd2hpY2ggY2FzZSB3ZSB3YWxrIHRvIHRoZSBvd25lci4gQXR0ZW1wdCB0byB3YWxrIHRvIGhvc3Qgb2YgYVxuICAgIC8vIHNoYWRvdyByb290IGlmIG5lZWRlZC5cbiAgICBsZXQgYWN0aW9uRWxlbWVudDogRWxlbWVudCB8IG51bGwgPSBldmVudEluZm9MaWIuZ2V0VGFyZ2V0RWxlbWVudChldmVudEluZm8pO1xuICAgIHdoaWxlIChhY3Rpb25FbGVtZW50ICYmIGFjdGlvbkVsZW1lbnQgIT09IGV2ZW50SW5mb0xpYi5nZXRDb250YWluZXIoZXZlbnRJbmZvKSkge1xuICAgICAgdGhpcy5wb3B1bGF0ZUFjdGlvbk9uRWxlbWVudChhY3Rpb25FbGVtZW50LCBldmVudEluZm8pO1xuXG4gICAgICBpZiAoZXZlbnRJbmZvTGliLmdldEFjdGlvbihldmVudEluZm8pKSB7XG4gICAgICAgIC8vIEFuIGV2ZW50IGlzIGhhbmRsZWQgYnkgYXQgbW9zdCBvbmUganNhY3Rpb24uIFRodXMgd2Ugc3RvcCBhdCB0aGVcbiAgICAgICAgLy8gZmlyc3QgbWF0Y2hpbmcganNhY3Rpb24gc3BlY2lmaWVkIGluIGEganNhY3Rpb24gYXR0cmlidXRlIHVwIHRoZVxuICAgICAgICAvLyBhbmNlc3RvciBjaGFpbiBvZiB0aGUgZXZlbnQgdGFyZ2V0IG5vZGUuXG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgaWYgKGFjdGlvbkVsZW1lbnRbUHJvcGVydHkuT1dORVJdKSB7XG4gICAgICAgIGFjdGlvbkVsZW1lbnQgPSBhY3Rpb25FbGVtZW50W1Byb3BlcnR5Lk9XTkVSXSBhcyBFbGVtZW50O1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGlmIChhY3Rpb25FbGVtZW50LnBhcmVudE5vZGU/Lm5vZGVOYW1lICE9PSAnI2RvY3VtZW50LWZyYWdtZW50Jykge1xuICAgICAgICBhY3Rpb25FbGVtZW50ID0gYWN0aW9uRWxlbWVudC5wYXJlbnROb2RlIGFzIEVsZW1lbnQgfCBudWxsO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYWN0aW9uRWxlbWVudCA9IChhY3Rpb25FbGVtZW50LnBhcmVudE5vZGUgYXMgU2hhZG93Um9vdCB8IG51bGwpPy5ob3N0ID8/IG51bGw7XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgYWN0aW9uID0gZXZlbnRJbmZvTGliLmdldEFjdGlvbihldmVudEluZm8pO1xuICAgIGlmICghYWN0aW9uKSB7XG4gICAgICAvLyBObyBhY3Rpb24gZm91bmQuXG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuaGFzQTExeUNsaWNrU3VwcG9ydCkge1xuICAgICAgdGhpcy5wcmV2ZW50RGVmYXVsdEZvckExMXlDbGljayEoZXZlbnRJbmZvKTtcbiAgICB9XG5cbiAgICAvLyBXZSBhdHRlbXB0IHRvIGhhbmRsZSB0aGUgbW91c2VlbnRlci9tb3VzZWxlYXZlIGV2ZW50cyBoZXJlIGJ5XG4gICAgLy8gZGV0ZWN0aW5nIHdoZXRoZXIgdGhlIG1vdXNlb3Zlci9tb3VzZW91dCBldmVudHMgY29ycmVzcG9uZCB0b1xuICAgIC8vIGVudGVyaW5nL2xlYXZpbmcgYW4gZWxlbWVudC5cbiAgICBpZiAoXG4gICAgICBFdmVudENvbnRyYWN0Lk1PVVNFX1NQRUNJQUxfU1VQUE9SVCAmJlxuICAgICAgKGV2ZW50SW5mb0xpYi5nZXRFdmVudFR5cGUoZXZlbnRJbmZvKSA9PT0gRXZlbnRUeXBlLk1PVVNFRU5URVIgfHxcbiAgICAgICAgZXZlbnRJbmZvTGliLmdldEV2ZW50VHlwZShldmVudEluZm8pID09PSBFdmVudFR5cGUuTU9VU0VMRUFWRSB8fFxuICAgICAgICBldmVudEluZm9MaWIuZ2V0RXZlbnRUeXBlKGV2ZW50SW5mbykgPT09IEV2ZW50VHlwZS5QT0lOVEVSRU5URVIgfHxcbiAgICAgICAgZXZlbnRJbmZvTGliLmdldEV2ZW50VHlwZShldmVudEluZm8pID09PSBFdmVudFR5cGUuUE9JTlRFUkxFQVZFKVxuICAgICkge1xuICAgICAgLy8gV2UgYXR0ZW1wdCB0byBoYW5kbGUgdGhlIG1vdXNlZW50ZXIvbW91c2VsZWF2ZSBldmVudHMgaGVyZSBieVxuICAgICAgLy8gZGV0ZWN0aW5nIHdoZXRoZXIgdGhlIG1vdXNlb3Zlci9tb3VzZW91dCBldmVudHMgY29ycmVzcG9uZCB0b1xuICAgICAgLy8gZW50ZXJpbmcvbGVhdmluZyBhbiBlbGVtZW50LlxuICAgICAgaWYgKFxuICAgICAgICBldmVudExpYi5pc01vdXNlU3BlY2lhbEV2ZW50KFxuICAgICAgICAgIGV2ZW50SW5mb0xpYi5nZXRFdmVudChldmVudEluZm8pLFxuICAgICAgICAgIGV2ZW50SW5mb0xpYi5nZXRFdmVudFR5cGUoZXZlbnRJbmZvKSxcbiAgICAgICAgICBldmVudEluZm9MaWIuZ2V0QWN0aW9uRWxlbWVudChhY3Rpb24pLFxuICAgICAgICApXG4gICAgICApIHtcbiAgICAgICAgLy8gSWYgYm90aCBtb3VzZW92ZXIvbW91c2VvdXQgYW5kIG1vdXNlZW50ZXIvbW91c2VsZWF2ZSBldmVudHMgYXJlXG4gICAgICAgIC8vIGVuYWJsZWQsIHR3byBzZXBhcmF0ZSBoYW5kbGVycyBmb3IgbW91c2VvdmVyL21vdXNlb3V0IGFyZVxuICAgICAgICAvLyByZWdpc3RlcmVkLiBCb3RoIGhhbmRsZXJzIHdpbGwgc2VlIHRoZSBzYW1lIGV2ZW50IGluc3RhbmNlXG4gICAgICAgIC8vIHNvIHdlIGNyZWF0ZSBhIGNvcHkgdG8gYXZvaWQgaW50ZXJmZXJpbmcgd2l0aCB0aGUgZGlzcGF0Y2hpbmcgb2ZcbiAgICAgICAgLy8gdGhlIG1vdXNlb3Zlci9tb3VzZW91dCBldmVudC5cbiAgICAgICAgY29uc3QgY29waWVkRXZlbnQgPSBldmVudExpYi5jcmVhdGVNb3VzZVNwZWNpYWxFdmVudChcbiAgICAgICAgICBldmVudEluZm9MaWIuZ2V0RXZlbnQoZXZlbnRJbmZvKSxcbiAgICAgICAgICBldmVudEluZm9MaWIuZ2V0QWN0aW9uRWxlbWVudChhY3Rpb24pLFxuICAgICAgICApO1xuICAgICAgICBldmVudEluZm9MaWIuc2V0RXZlbnQoZXZlbnRJbmZvLCBjb3BpZWRFdmVudCk7XG4gICAgICAgIC8vIFNpbmNlIHRoZSBtb3VzZWVudGVyL21vdXNlbGVhdmUgZXZlbnRzIGRvIG5vdCBidWJibGUsIHRoZSB0YXJnZXRcbiAgICAgICAgLy8gb2YgdGhlIGV2ZW50IGlzIHRlY2huaWNhbGx5IHRoZSBgYWN0aW9uRWxlbWVudGAgKHRoZSBub2RlIHdpdGggdGhlXG4gICAgICAgIC8vIGBqc2FjdGlvbmAgYXR0cmlidXRlKVxuICAgICAgICBldmVudEluZm9MaWIuc2V0VGFyZ2V0RWxlbWVudChldmVudEluZm8sIGV2ZW50SW5mb0xpYi5nZXRBY3Rpb25FbGVtZW50KGFjdGlvbikpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZXZlbnRJbmZvTGliLnVuc2V0QWN0aW9uKGV2ZW50SW5mbyk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEFjY2Vzc2VzIHRoZSBqc2FjdGlvbiBtYXAgb24gYSBub2RlIGFuZCByZXRyaWV2ZXMgdGhlIG5hbWUgb2YgdGhlXG4gICAqIGFjdGlvbiB0aGUgZ2l2ZW4gZXZlbnQgaXMgbWFwcGVkIHRvLCBpZiBhbnkuIEl0IHBhcnNlcyB0aGVcbiAgICogYXR0cmlidXRlIHZhbHVlIGFuZCBzdG9yZXMgaXQgaW4gYSBwcm9wZXJ0eSBvbiB0aGUgbm9kZSBmb3JcbiAgICogc3Vic2VxdWVudCByZXRyaWV2YWwgd2l0aG91dCByZS1wYXJzaW5nIGFuZCByZS1hY2Nlc3NpbmcgdGhlXG4gICAqIGF0dHJpYnV0ZS4gSW4gb3JkZXIgdG8gZnVsbHkgcXVhbGlmeSBqc2FjdGlvbiBuYW1lcyB1c2luZyBhXG4gICAqIG5hbWVzcGFjZSwgdGhlIERPTSBpcyBzZWFyY2hlZCBzdGFydGluZyBhdCB0aGUgY3VycmVudCBub2RlIGFuZFxuICAgKiBnb2luZyB0aHJvdWdoIGFuY2VzdG9yIG5vZGVzIHVudGlsIGEganNuYW1lc3BhY2UgYXR0cmlidXRlIGlzXG4gICAqIGZvdW5kLlxuICAgKlxuICAgKiBAcGFyYW0gYWN0aW9uRWxlbWVudCBUaGUgRE9NIG5vZGUgdG8gcmV0cmlldmUgdGhlIGpzYWN0aW9uIG1hcCBmcm9tLlxuICAgKiBAcGFyYW0gZXZlbnRJbmZvIGBFdmVudEluZm9gIHRvIHNldCBgYWN0aW9uYCBhbmQgYGFjdGlvbkVsZW1lbnRgIGlmIGFuXG4gICAqICAgIGFjdGlvbiBpcyBmb3VuZCBvbiB0aGUgYGFjdGlvbkVsZW1lbnRgLlxuICAgKi9cbiAgcHJpdmF0ZSBwb3B1bGF0ZUFjdGlvbk9uRWxlbWVudChhY3Rpb25FbGVtZW50OiBFbGVtZW50LCBldmVudEluZm86IGV2ZW50SW5mb0xpYi5FdmVudEluZm8pIHtcbiAgICBjb25zdCBhY3Rpb25NYXAgPSBwYXJzZUFjdGlvbnMoYWN0aW9uRWxlbWVudCwgZXZlbnRJbmZvTGliLmdldENvbnRhaW5lcihldmVudEluZm8pKTtcblxuICAgIGNvbnN0IGFjdGlvbk5hbWUgPSBhY3Rpb25NYXBbZXZlbnRJbmZvTGliLmdldEV2ZW50VHlwZShldmVudEluZm8pXTtcbiAgICBpZiAoYWN0aW9uTmFtZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBldmVudEluZm9MaWIuc2V0QWN0aW9uKGV2ZW50SW5mbywgYWN0aW9uTmFtZSwgYWN0aW9uRWxlbWVudCk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuaGFzQTExeUNsaWNrU3VwcG9ydCkge1xuICAgICAgdGhpcy5wb3B1bGF0ZUNsaWNrT25seUFjdGlvbiEoYWN0aW9uRWxlbWVudCwgZXZlbnRJbmZvLCBhY3Rpb25NYXApO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBFbmFibGVzIGpzYWN0aW9uIGhhbmRsZXJzIHRvIGJlIGNhbGxlZCBmb3IgdGhlIGV2ZW50IHR5cGUgZ2l2ZW4gYnlcbiAgICogbmFtZS5cbiAgICpcbiAgICogSWYgdGhlIGV2ZW50IGlzIGFscmVhZHkgcmVnaXN0ZXJlZCwgdGhpcyBkb2VzIG5vdGhpbmcuXG4gICAqXG4gICAqIEBwYXJhbSBwcmVmaXhlZEV2ZW50VHlwZSBJZiBzdXBwbGllZCwgdGhpcyBldmVudCBpcyB1c2VkIGluXG4gICAqICAgICB0aGUgYWN0dWFsIGJyb3dzZXIgZXZlbnQgcmVnaXN0cmF0aW9uIGluc3RlYWQgb2YgdGhlIG5hbWUgdGhhdCBpc1xuICAgKiAgICAgZXhwb3NlZCB0byBqc2FjdGlvbi4gVXNlIHRoaXMgaWYgeW91IGUuZy4gd2FudCB1c2VycyB0byBiZSBhYmxlXG4gICAqICAgICB0byBzdWJzY3JpYmUgdG8ganNhY3Rpb249XCJ0cmFuc2l0aW9uRW5kOmZvb1wiIHdoaWxlIHRoZSB1bmRlcmx5aW5nXG4gICAqICAgICBldmVudCBpcyB3ZWJraXRUcmFuc2l0aW9uRW5kIGluIG9uZSBicm93c2VyIGFuZCBtb3pUcmFuc2l0aW9uRW5kXG4gICAqICAgICBpbiBhbm90aGVyLlxuICAgKi9cbiAgYWRkRXZlbnQoZXZlbnRUeXBlOiBzdHJpbmcsIHByZWZpeGVkRXZlbnRUeXBlPzogc3RyaW5nKSB7XG4gICAgaWYgKGV2ZW50VHlwZSBpbiB0aGlzLmV2ZW50SGFuZGxlcnMgfHwgIXRoaXMuY29udGFpbmVyTWFuYWdlcikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmIChcbiAgICAgICFFdmVudENvbnRyYWN0Lk1PVVNFX1NQRUNJQUxfU1VQUE9SVCAmJlxuICAgICAgKGV2ZW50VHlwZSA9PT0gRXZlbnRUeXBlLk1PVVNFRU5URVIgfHxcbiAgICAgICAgZXZlbnRUeXBlID09PSBFdmVudFR5cGUuTU9VU0VMRUFWRSB8fFxuICAgICAgICBldmVudFR5cGUgPT09IEV2ZW50VHlwZS5QT0lOVEVSRU5URVIgfHxcbiAgICAgICAgZXZlbnRUeXBlID09PSBFdmVudFR5cGUuUE9JTlRFUkxFQVZFKVxuICAgICkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGV2ZW50SGFuZGxlciA9IChldmVudFR5cGU6IHN0cmluZywgZXZlbnQ6IEV2ZW50LCBjb250YWluZXI6IEVsZW1lbnQpID0+IHtcbiAgICAgIHRoaXMuaGFuZGxlRXZlbnQoZXZlbnRUeXBlLCBldmVudCwgY29udGFpbmVyKTtcbiAgICB9O1xuXG4gICAgLy8gU3RvcmUgdGhlIGNhbGxiYWNrIHRvIGFsbG93IHVzIHRvIHJlcGxheSBldmVudHMuXG4gICAgdGhpcy5ldmVudEhhbmRsZXJzW2V2ZW50VHlwZV0gPSBldmVudEhhbmRsZXI7XG5cbiAgICBjb25zdCBicm93c2VyRXZlbnRUeXBlID0gZXZlbnRMaWIuZ2V0QnJvd3NlckV2ZW50VHlwZShwcmVmaXhlZEV2ZW50VHlwZSB8fCBldmVudFR5cGUpO1xuXG4gICAgaWYgKGJyb3dzZXJFdmVudFR5cGUgIT09IGV2ZW50VHlwZSkge1xuICAgICAgY29uc3QgZXZlbnRUeXBlcyA9IHRoaXMuYnJvd3NlckV2ZW50VHlwZVRvRXh0cmFFdmVudFR5cGVzW2Jyb3dzZXJFdmVudFR5cGVdIHx8IFtdO1xuICAgICAgZXZlbnRUeXBlcy5wdXNoKGV2ZW50VHlwZSk7XG4gICAgICB0aGlzLmJyb3dzZXJFdmVudFR5cGVUb0V4dHJhRXZlbnRUeXBlc1ticm93c2VyRXZlbnRUeXBlXSA9IGV2ZW50VHlwZXM7XG4gICAgfVxuXG4gICAgdGhpcy5jb250YWluZXJNYW5hZ2VyLmFkZEV2ZW50TGlzdGVuZXIoYnJvd3NlckV2ZW50VHlwZSwgKGVsZW1lbnQ6IEVsZW1lbnQpID0+IHtcbiAgICAgIHJldHVybiAoZXZlbnQ6IEV2ZW50KSA9PiB7XG4gICAgICAgIGV2ZW50SGFuZGxlcihldmVudFR5cGUsIGV2ZW50LCBlbGVtZW50KTtcbiAgICAgIH07XG4gICAgfSk7XG5cbiAgICAvLyBBdXRvbWF0aWNhbGx5IGluc3RhbGwgYSBrZXlwcmVzcy9rZXlkb3duIGV2ZW50IGhhbmRsZXIgaWYgc3VwcG9ydCBmb3JcbiAgICAvLyBhY2Nlc3NpYmxlIGNsaWNrcyBpcyB0dXJuZWQgb24uXG4gICAgaWYgKHRoaXMuYWRkQTExeUNsaWNrTGlzdGVuZXIgJiYgZXZlbnRUeXBlID09PSBFdmVudFR5cGUuQ0xJQ0spIHtcbiAgICAgIHRoaXMuYWRkRXZlbnQoRXZlbnRUeXBlLktFWURPV04pO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBxdWV1ZWQgZWFybHkgZXZlbnRzIGFuZCByZXBsYXkgdGhlbSB1c2luZyB0aGUgYXBwcm9wcmlhdGUgaGFuZGxlclxuICAgKiBpbiB0aGUgcHJvdmlkZWQgZXZlbnQgY29udHJhY3QuIE9uY2UgYWxsIHRoZSBldmVudHMgYXJlIHJlcGxheWVkLCBpdCBjbGVhbnNcbiAgICogdXAgdGhlIGVhcmx5IGNvbnRyYWN0LlxuICAgKi9cbiAgcmVwbGF5RWFybHlFdmVudHMoKSB7XG4gICAgLy8gQ2hlY2sgaWYgdGhlIGVhcmx5IGNvbnRyYWN0IGlzIHByZXNlbnQgYW5kIHByZXZlbnQgY2FsbGluZyB0aGlzIGZ1bmN0aW9uXG4gICAgLy8gbW9yZSB0aGFuIG9uY2UuXG4gICAgY29uc3QgZWFybHlKc2FjdGlvbkRhdGE6IEVhcmx5SnNhY3Rpb25EYXRhIHwgdW5kZWZpbmVkID0gd2luZG93Ll9lanNhO1xuICAgIGlmICghZWFybHlKc2FjdGlvbkRhdGEpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBSZXBsYXkgdGhlIGVhcmx5IGNvbnRyYWN0IGV2ZW50cy5cbiAgICBjb25zdCBlYXJseUV2ZW50SW5mb3M6IGV2ZW50SW5mb0xpYi5FdmVudEluZm9bXSA9IGVhcmx5SnNhY3Rpb25EYXRhLnE7XG4gICAgZm9yIChsZXQgaWR4ID0gMDsgaWR4IDwgZWFybHlFdmVudEluZm9zLmxlbmd0aDsgaWR4KyspIHtcbiAgICAgIGNvbnN0IGVhcmx5RXZlbnRJbmZvOiBldmVudEluZm9MaWIuRXZlbnRJbmZvID0gZWFybHlFdmVudEluZm9zW2lkeF07XG4gICAgICBjb25zdCBldmVudFR5cGVzID0gdGhpcy5nZXRFdmVudFR5cGVzRm9yQnJvd3NlckV2ZW50VHlwZShlYXJseUV2ZW50SW5mby5ldmVudFR5cGUpO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBldmVudFR5cGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IGV2ZW50SW5mbyA9IGV2ZW50SW5mb0xpYi5jbG9uZUV2ZW50SW5mbyhlYXJseUV2ZW50SW5mbyk7XG4gICAgICAgIC8vIEV2ZW50SW5mbyBldmVudFR5cGUgbWFwcyB0byBKU0FjdGlvbidzIGludGVybmFsIGV2ZW50IHR5cGUsXG4gICAgICAgIC8vIHJhdGhlciB0aGFuIHRoZSBicm93c2VyIGV2ZW50IHR5cGUuXG4gICAgICAgIGV2ZW50SW5mb0xpYi5zZXRFdmVudFR5cGUoZXZlbnRJbmZvLCBldmVudFR5cGVzW2ldKTtcbiAgICAgICAgdGhpcy5oYW5kbGVFdmVudEluZm8oZXZlbnRJbmZvKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBDbGVhbiB1cCB0aGUgZWFybHkgY29udHJhY3QuXG4gICAgY29uc3QgZWFybHlFdmVudFR5cGVzOiBzdHJpbmdbXSA9IGVhcmx5SnNhY3Rpb25EYXRhLmV0O1xuICAgIGNvbnN0IGVhcmx5RXZlbnRIYW5kbGVyOiAoZXZlbnQ6IEV2ZW50KSA9PiB2b2lkID0gZWFybHlKc2FjdGlvbkRhdGEuaDtcbiAgICBmb3IgKGxldCBpZHggPSAwOyBpZHggPCBlYXJseUV2ZW50VHlwZXMubGVuZ3RoOyBpZHgrKykge1xuICAgICAgY29uc3QgZXZlbnRUeXBlOiBzdHJpbmcgPSBlYXJseUV2ZW50VHlwZXNbaWR4XTtcbiAgICAgIHdpbmRvdy5kb2N1bWVudC5kb2N1bWVudEVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihldmVudFR5cGUsIGVhcmx5RXZlbnRIYW5kbGVyKTtcbiAgICB9XG4gICAgZGVsZXRlIHdpbmRvdy5fZWpzYTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGFsbCBKU0FjdGlvbiBldmVudCB0eXBlcyB0aGF0IGhhdmUgYmVlbiByZWdpc3RlcmVkIGZvciBhIGdpdmVuXG4gICAqIGJyb3dzZXIgZXZlbnQgdHlwZS5cbiAgICovXG4gIHByaXZhdGUgZ2V0RXZlbnRUeXBlc0ZvckJyb3dzZXJFdmVudFR5cGUoYnJvd3NlckV2ZW50VHlwZTogc3RyaW5nKSB7XG4gICAgY29uc3QgZXZlbnRUeXBlcyA9IFtdO1xuICAgIGlmICh0aGlzLmV2ZW50SGFuZGxlcnNbYnJvd3NlckV2ZW50VHlwZV0pIHtcbiAgICAgIGV2ZW50VHlwZXMucHVzaChicm93c2VyRXZlbnRUeXBlKTtcbiAgICB9XG4gICAgaWYgKHRoaXMuYnJvd3NlckV2ZW50VHlwZVRvRXh0cmFFdmVudFR5cGVzW2Jyb3dzZXJFdmVudFR5cGVdKSB7XG4gICAgICBldmVudFR5cGVzLnB1c2goLi4udGhpcy5icm93c2VyRXZlbnRUeXBlVG9FeHRyYUV2ZW50VHlwZXNbYnJvd3NlckV2ZW50VHlwZV0pO1xuICAgIH1cbiAgICByZXR1cm4gZXZlbnRUeXBlcztcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBldmVudCBoYW5kbGVyIGZ1bmN0aW9uIGZvciBhIGdpdmVuIGV2ZW50IHR5cGUuXG4gICAqL1xuICBoYW5kbGVyKGV2ZW50VHlwZTogc3RyaW5nKTogRXZlbnRIYW5kbGVyIHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy5ldmVudEhhbmRsZXJzW2V2ZW50VHlwZV07XG4gIH1cblxuICAvKipcbiAgICogQ2xlYW5zIHVwIHRoZSBldmVudCBjb250cmFjdC4gVGhpcyByZXNldHMgYWxsIG9mIHRoZSBgRXZlbnRDb250cmFjdGAnc1xuICAgKiBpbnRlcm5hbCBzdGF0ZS4gVXNlcnMgYXJlIHJlc3BvbnNpYmxlIGZvciBub3QgdXNpbmcgdGhpcyBgRXZlbnRDb250cmFjdGBcbiAgICogYWZ0ZXIgaXQgaGFzIGJlZW4gY2xlYW5lZCB1cC5cbiAgICovXG4gIGNsZWFuVXAoKSB7XG4gICAgdGhpcy5jb250YWluZXJNYW5hZ2VyIS5jbGVhblVwKCk7XG4gICAgdGhpcy5jb250YWluZXJNYW5hZ2VyID0gbnVsbDtcbiAgICB0aGlzLmV2ZW50SGFuZGxlcnMgPSB7fTtcbiAgICB0aGlzLmJyb3dzZXJFdmVudFR5cGVUb0V4dHJhRXZlbnRUeXBlcyA9IHt9O1xuICAgIHRoaXMuZGlzcGF0Y2hlciA9IG51bGw7XG4gICAgdGhpcy5xdWV1ZWRFdmVudEluZm9zID0gW107XG4gIH1cblxuICAvKipcbiAgICogUmVnaXN0ZXIgYSBkaXNwYXRjaGVyIGZ1bmN0aW9uLiBFdmVudCBpbmZvIG9mIGVhY2ggZXZlbnQgbWFwcGVkIHRvXG4gICAqIGEganNhY3Rpb24gaXMgcGFzc2VkIGZvciBoYW5kbGluZyB0byB0aGlzIGNhbGxiYWNrLiBUaGUgcXVldWVkXG4gICAqIGV2ZW50cyBhcmUgcGFzc2VkIGFzIHdlbGwgdG8gdGhlIGRpc3BhdGNoZXIgZm9yIGxhdGVyIHJlcGxheWluZ1xuICAgKiBvbmNlIHRoZSBkaXNwYXRjaGVyIGlzIHJlZ2lzdGVyZWQuIENsZWFycyB0aGUgZXZlbnQgcXVldWUgdG8gbnVsbC5cbiAgICpcbiAgICogQHBhcmFtIGRpc3BhdGNoZXIgVGhlIGRpc3BhdGNoZXIgZnVuY3Rpb24uXG4gICAqIEBwYXJhbSByZXN0cmljdGlvblxuICAgKi9cbiAgcmVnaXN0ZXJEaXNwYXRjaGVyKGRpc3BhdGNoZXI6IERpc3BhdGNoZXIsIHJlc3RyaWN0aW9uOiBSZXN0cmljdGlvbikge1xuICAgIHRoaXMuZWNyZChkaXNwYXRjaGVyLCByZXN0cmljdGlvbik7XG4gIH1cblxuICAvKipcbiAgICogVW5yZW5hbWVkIGFsaWFzIGZvciByZWdpc3RlckRpc3BhdGNoZXIuIE5lY2Vzc2FyeSBmb3IgYW55IGNvZGViYXNlcyB0aGF0XG4gICAqIHNwbGl0IHRoZSBgRXZlbnRDb250cmFjdGAgYW5kIGBEaXNwYXRjaGVyYCBjb2RlIGludG8gZGlmZmVyZW50IGNvbXBpbGF0aW9uXG4gICAqIHVuaXRzLlxuICAgKi9cbiAgZWNyZChkaXNwYXRjaGVyOiBEaXNwYXRjaGVyLCByZXN0cmljdGlvbjogUmVzdHJpY3Rpb24pIHtcbiAgICB0aGlzLmRpc3BhdGNoZXIgPSBkaXNwYXRjaGVyO1xuXG4gICAgaWYgKHRoaXMucXVldWVkRXZlbnRJbmZvcz8ubGVuZ3RoKSB7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMucXVldWVkRXZlbnRJbmZvcy5sZW5ndGg7IGkrKykge1xuICAgICAgICB0aGlzLmhhbmRsZUV2ZW50SW5mbyh0aGlzLnF1ZXVlZEV2ZW50SW5mb3NbaV0pO1xuICAgICAgfVxuICAgICAgdGhpcy5xdWV1ZWRFdmVudEluZm9zID0gbnVsbDtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQWRkcyBhMTF5IGNsaWNrIHN1cHBvcnQgdG8gdGhlIGdpdmVuIGBFdmVudENvbnRyYWN0YC4gTWVhbnQgdG8gYmUgY2FsbGVkIGluXG4gICAqIHRoZSBzYW1lIGNvbXBpbGF0aW9uIHVuaXQgYXMgdGhlIGBFdmVudENvbnRyYWN0YC5cbiAgICovXG4gIGFkZEExMXlDbGlja1N1cHBvcnQoKSB7XG4gICAgdGhpcy5hZGRBMTF5Q2xpY2tTdXBwb3J0SW1wbChcbiAgICAgIGExMXlDbGlja0xpYi51cGRhdGVFdmVudEluZm9Gb3JBMTF5Q2xpY2ssXG4gICAgICBhMTF5Q2xpY2tMaWIucHJldmVudERlZmF1bHRGb3JBMTF5Q2xpY2ssXG4gICAgICBhMTF5Q2xpY2tMaWIucG9wdWxhdGVDbGlja09ubHlBY3Rpb24sXG4gICAgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBFbmFibGVzIGExMXkgY2xpY2sgc3VwcG9ydCB0byBiZSBkZWZlcnJlZC4gTWVhbnQgdG8gYmUgY2FsbGVkIGluIHRoZSBzYW1lXG4gICAqIGNvbXBpbGF0aW9uIHVuaXQgYXMgdGhlIGBFdmVudENvbnRyYWN0YC5cbiAgICovXG4gIGV4cG9ydEFkZEExMXlDbGlja1N1cHBvcnQoKSB7XG4gICAgdGhpcy5hZGRBMTF5Q2xpY2tMaXN0ZW5lciA9IHRydWU7XG4gICAgdGhpcy5lY2FhY3MgPSB0aGlzLmFkZEExMXlDbGlja1N1cHBvcnRJbXBsLmJpbmQodGhpcyk7XG4gIH1cblxuICAvKipcbiAgICogVW5yZW5hbWVkIGZ1bmN0aW9uIHRoYXQgbG9hZHMgYTExeUNsaWNrU3VwcG9ydC5cbiAgICovXG4gIHByaXZhdGUgYWRkQTExeUNsaWNrU3VwcG9ydEltcGwoXG4gICAgdXBkYXRlRXZlbnRJbmZvRm9yQTExeUNsaWNrOiB0eXBlb2YgYTExeUNsaWNrTGliLnVwZGF0ZUV2ZW50SW5mb0ZvckExMXlDbGljayxcbiAgICBwcmV2ZW50RGVmYXVsdEZvckExMXlDbGljazogdHlwZW9mIGExMXlDbGlja0xpYi5wcmV2ZW50RGVmYXVsdEZvckExMXlDbGljayxcbiAgICBwb3B1bGF0ZUNsaWNrT25seUFjdGlvbjogdHlwZW9mIGExMXlDbGlja0xpYi5wb3B1bGF0ZUNsaWNrT25seUFjdGlvbixcbiAgKSB7XG4gICAgdGhpcy5hZGRBMTF5Q2xpY2tMaXN0ZW5lciA9IHRydWU7XG4gICAgdGhpcy5oYXNBMTF5Q2xpY2tTdXBwb3J0ID0gdHJ1ZTtcbiAgICB0aGlzLnVwZGF0ZUV2ZW50SW5mb0ZvckExMXlDbGljayA9IHVwZGF0ZUV2ZW50SW5mb0ZvckExMXlDbGljaztcbiAgICB0aGlzLnByZXZlbnREZWZhdWx0Rm9yQTExeUNsaWNrID0gcHJldmVudERlZmF1bHRGb3JBMTF5Q2xpY2s7XG4gICAgdGhpcy5wb3B1bGF0ZUNsaWNrT25seUFjdGlvbiA9IHBvcHVsYXRlQ2xpY2tPbmx5QWN0aW9uO1xuICB9XG59XG5cbi8qKlxuICogQWRkcyBhMTF5IGNsaWNrIHN1cHBvcnQgdG8gdGhlIGdpdmVuIGBFdmVudENvbnRyYWN0YC4gTWVhbnQgdG8gYmUgY2FsbGVkXG4gKiBpbiBhIGRpZmZlcmVudCBjb21waWxhdGlvbiB1bml0IGZyb20gdGhlIGBFdmVudENvbnRyYWN0YC4gVGhlIGBFdmVudENvbnRyYWN0YFxuICogbXVzdCBoYXZlIGNhbGxlZCBgZXhwb3J0QWRkQTExeUNsaWNrU3VwcG9ydGAgaW4gaXRzIGNvbXBpbGF0aW9uIHVuaXQgZm9yIHRoaXNcbiAqIHRvIGhhdmUgYW55IGVmZmVjdC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFkZERlZmVycmVkQTExeUNsaWNrU3VwcG9ydChldmVudENvbnRyYWN0OiBFdmVudENvbnRyYWN0KSB7XG4gIGV2ZW50Q29udHJhY3QuZWNhYWNzPy4oXG4gICAgYTExeUNsaWNrTGliLnVwZGF0ZUV2ZW50SW5mb0ZvckExMXlDbGljayxcbiAgICBhMTF5Q2xpY2tMaWIucHJldmVudERlZmF1bHRGb3JBMTF5Q2xpY2ssXG4gICAgYTExeUNsaWNrTGliLnBvcHVsYXRlQ2xpY2tPbmx5QWN0aW9uLFxuICApO1xufVxuXG4vKipcbiAqIFJldHVybnMgdHJ1ZSBpZiB0aGUgZGVmYXVsdCBhY3Rpb24gb2YgdGhpcyBldmVudCBzaG91bGQgYmUgcHJldmVudGVkIGJlZm9yZVxuICogdGhpcyBldmVudCBpcyBkaXNwYXRjaGVkLlxuICovXG5mdW5jdGlvbiBzaG91bGRQcmV2ZW50RGVmYXVsdEJlZm9yZURpc3BhdGNoaW5nKFxuICBhY3Rpb25FbGVtZW50OiBFbGVtZW50LFxuICBldmVudEluZm86IGV2ZW50SW5mb0xpYi5FdmVudEluZm8sXG4pOiBib29sZWFuIHtcbiAgLy8gUHJldmVudCBicm93c2VyIGZyb20gZm9sbG93aW5nIDxhPiBub2RlIGxpbmtzIGlmIGEganNhY3Rpb24gaXMgcHJlc2VudFxuICAvLyBhbmQgd2UgYXJlIGRpc3BhdGNoaW5nIHRoZSBhY3Rpb24gbm93LiBOb3RlIHRoYXQgdGhlIHRhcmdldEVsZW1lbnQgbWF5IGJlXG4gIC8vIGEgY2hpbGQgb2YgYW4gYW5jaG9yIHRoYXQgaGFzIGEganNhY3Rpb24gYXR0YWNoZWQuIEZvciB0aGF0IHJlYXNvbiwgd2VcbiAgLy8gbmVlZCB0byBjaGVjayB0aGUgYWN0aW9uRWxlbWVudCByYXRoZXIgdGhhbiB0aGUgdGFyZ2V0RWxlbWVudC5cbiAgcmV0dXJuIChcbiAgICBhY3Rpb25FbGVtZW50LnRhZ05hbWUgPT09ICdBJyAmJlxuICAgIChldmVudEluZm9MaWIuZ2V0RXZlbnRUeXBlKGV2ZW50SW5mbykgPT09IEV2ZW50VHlwZS5DTElDSyB8fFxuICAgICAgZXZlbnRJbmZvTGliLmdldEV2ZW50VHlwZShldmVudEluZm8pID09PSBFdmVudFR5cGUuQ0xJQ0tNT0QpXG4gICk7XG59XG5cbi8qKlxuICogUGFyc2VzIGFuZCBjYWNoZXMgYW4gZWxlbWVudCdzIGpzYWN0aW9uIGVsZW1lbnQgaW50byBhIG1hcC5cbiAqXG4gKiBUaGlzIGlzIHByaW1hcmlseSBmb3IgaW50ZXJuYWwgdXNlLlxuICpcbiAqIEBwYXJhbSBhY3Rpb25FbGVtZW50IFRoZSBET00gbm9kZSB0byByZXRyaWV2ZSB0aGUganNhY3Rpb24gbWFwIGZyb20uXG4gKiBAcGFyYW0gY29udGFpbmVyIFRoZSBub2RlIHdoaWNoIGxpbWl0cyB0aGUgbmFtZXNwYWNlIGxvb2t1cCBmb3IgYSBqc2FjdGlvblxuICogbmFtZS4gVGhlIGNvbnRhaW5lciBub2RlIGl0c2VsZiB3aWxsIG5vdCBiZSBzZWFyY2hlZC5cbiAqIEByZXR1cm4gTWFwIGZyb20gZXZlbnQgdG8gcXVhbGlmaWVkIG5hbWUgb2YgdGhlIGpzYWN0aW9uIGJvdW5kIHRvIGl0LlxuICovXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VBY3Rpb25zKGFjdGlvbkVsZW1lbnQ6IEVsZW1lbnQsIGNvbnRhaW5lcjogTm9kZSk6IHtba2V5OiBzdHJpbmddOiBzdHJpbmd9IHtcbiAgbGV0IGFjdGlvbk1hcDoge1trZXk6IHN0cmluZ106IHN0cmluZ30gfCB1bmRlZmluZWQgPSBjYWNoZS5nZXQoYWN0aW9uRWxlbWVudCk7XG4gIGlmICghYWN0aW9uTWFwKSB7XG4gICAgY29uc3QganNhY3Rpb25BdHRyaWJ1dGUgPSBnZXRBdHRyKGFjdGlvbkVsZW1lbnQsIEF0dHJpYnV0ZS5KU0FDVElPTik7XG4gICAgaWYgKCFqc2FjdGlvbkF0dHJpYnV0ZSkge1xuICAgICAgYWN0aW9uTWFwID0gRU1QVFlfQUNUSU9OX01BUDtcbiAgICAgIGNhY2hlLnNldChhY3Rpb25FbGVtZW50LCBhY3Rpb25NYXApO1xuICAgIH0gZWxzZSB7XG4gICAgICBhY3Rpb25NYXAgPSBjYWNoZS5nZXRQYXJzZWQoanNhY3Rpb25BdHRyaWJ1dGUpO1xuICAgICAgaWYgKCFhY3Rpb25NYXApIHtcbiAgICAgICAgYWN0aW9uTWFwID0ge307XG4gICAgICAgIGNvbnN0IHZhbHVlcyA9IGpzYWN0aW9uQXR0cmlidXRlLnNwbGl0KFJFR0VYUF9TRU1JQ09MT04pO1xuICAgICAgICBmb3IgKGxldCBpZHggPSAwOyBpZHggPCB2YWx1ZXMubGVuZ3RoOyBpZHgrKykge1xuICAgICAgICAgIGNvbnN0IHZhbHVlID0gdmFsdWVzW2lkeF07XG4gICAgICAgICAgaWYgKCF2YWx1ZSkge1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgfVxuICAgICAgICAgIGNvbnN0IGNvbG9uID0gdmFsdWUuaW5kZXhPZihDaGFyLkVWRU5UX0FDVElPTl9TRVBBUkFUT1IpO1xuICAgICAgICAgIGNvbnN0IGhhc0NvbG9uID0gY29sb24gIT09IC0xO1xuICAgICAgICAgIGNvbnN0IHR5cGUgPSBoYXNDb2xvbiA/IHN0cmluZ1RyaW0odmFsdWUuc3Vic3RyKDAsIGNvbG9uKSkgOiBERUZBVUxUX0VWRU5UX1RZUEU7XG4gICAgICAgICAgY29uc3QgYWN0aW9uID0gaGFzQ29sb24gPyBzdHJpbmdUcmltKHZhbHVlLnN1YnN0cihjb2xvbiArIDEpKSA6IHZhbHVlO1xuICAgICAgICAgIGFjdGlvbk1hcFt0eXBlXSA9IGFjdGlvbjtcbiAgICAgICAgfVxuICAgICAgICBjYWNoZS5zZXRQYXJzZWQoanNhY3Rpb25BdHRyaWJ1dGUsIGFjdGlvbk1hcCk7XG4gICAgICB9XG4gICAgICAvLyBJZiBuYW1lc3BhY2Ugc3VwcG9ydCBpcyBhY3RpdmUgd2UgbmVlZCB0byBhdWdtZW50IHRoZSAocG90ZW50aWFsbHlcbiAgICAgIC8vIGNhY2hlZCkganNhY3Rpb24gbWFwcGluZyB3aXRoIHRoZSBuYW1lc3BhY2UuXG4gICAgICBpZiAoRXZlbnRDb250cmFjdC5KU05BTUVTUEFDRV9TVVBQT1JUKSB7XG4gICAgICAgIGNvbnN0IG5vTnMgPSBhY3Rpb25NYXA7XG4gICAgICAgIGFjdGlvbk1hcCA9IHt9O1xuICAgICAgICBmb3IgKGNvbnN0IHR5cGUgaW4gbm9Ocykge1xuICAgICAgICAgIGFjdGlvbk1hcFt0eXBlXSA9IGdldEZ1bGx5UXVhbGlmaWVkQWN0aW9uKG5vTnNbdHlwZV0sIGFjdGlvbkVsZW1lbnQsIGNvbnRhaW5lcik7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGNhY2hlLnNldChhY3Rpb25FbGVtZW50LCBhY3Rpb25NYXApO1xuICAgIH1cbiAgfVxuICByZXR1cm4gYWN0aW9uTWFwO1xufVxuXG4vKipcbiAqIFJldHVybnMgdGhlIGZ1bGx5IHF1YWxpZmllZCBqc2FjdGlvbiBhY3Rpb24uIElmIHRoZSBnaXZlbiBqc2FjdGlvblxuICogbmFtZSBkb2Vzbid0IGFscmVhZHkgY29udGFpbiB0aGUgbmFtZXNwYWNlLCB0aGUgZnVuY3Rpb24gaXRlcmF0ZXNcbiAqIG92ZXIgYW5jZXN0b3Igbm9kZXMgdW50aWwgYSBqc25hbWVzcGFjZSBhdHRyaWJ1dGUgaXMgZm91bmQsIGFuZFxuICogdXNlcyB0aGUgdmFsdWUgb2YgdGhhdCBhdHRyaWJ1dGUgYXMgdGhlIG5hbWVzcGFjZS5cbiAqXG4gKiBAcGFyYW0gYWN0aW9uIFRoZSBqc2FjdGlvbiBhY3Rpb24gdG8gcmVzb2x2ZS5cbiAqIEBwYXJhbSBzdGFydCBUaGUgbm9kZSBmcm9tIHdoaWNoIHRvIHN0YXJ0IHNlYXJjaGluZyBmb3IgYSBqc25hbWVzcGFjZVxuICogYXR0cmlidXRlLlxuICogQHBhcmFtIGNvbnRhaW5lciBUaGUgbm9kZSB3aGljaCBsaW1pdHMgdGhlIHNlYXJjaCBmb3IgYSBqc25hbWVzcGFjZVxuICogYXR0cmlidXRlLiBUaGlzIG5vZGUgd2lsbCBiZSBzZWFyY2hlZC5cbiAqIEByZXR1cm4gVGhlIGZ1bGx5IHF1YWxpZmllZCBuYW1lIG9mIHRoZSBqc2FjdGlvbi4gSWYgbm8gbmFtZXNwYWNlIGlzIGZvdW5kLFxuICogcmV0dXJucyB0aGUgdW5xdWFsaWZpZWQgbmFtZSBpbiBjYXNlIGl0IGV4aXN0cyBpbiB0aGUgZ2xvYmFsIG5hbWVzcGFjZS5cbiAqL1xuZnVuY3Rpb24gZ2V0RnVsbHlRdWFsaWZpZWRBY3Rpb24oYWN0aW9uOiBzdHJpbmcsIHN0YXJ0OiBFbGVtZW50LCBjb250YWluZXI6IE5vZGUpOiBzdHJpbmcge1xuICBpZiAoRXZlbnRDb250cmFjdC5KU05BTUVTUEFDRV9TVVBQT1JUKSB7XG4gICAgaWYgKGlzTmFtZXNwYWNlZEFjdGlvbihhY3Rpb24pKSB7XG4gICAgICByZXR1cm4gYWN0aW9uO1xuICAgIH1cblxuICAgIGxldCBub2RlOiBOb2RlIHwgbnVsbCA9IHN0YXJ0O1xuICAgIHdoaWxlIChub2RlKSB7XG4gICAgICBjb25zdCBuYW1lc3BhY2UgPSBnZXROYW1lc3BhY2VGcm9tRWxlbWVudChub2RlIGFzIEVsZW1lbnQpO1xuICAgICAgaWYgKG5hbWVzcGFjZSkge1xuICAgICAgICByZXR1cm4gbmFtZXNwYWNlICsgQ2hhci5OQU1FU1BBQ0VfQUNUSU9OX1NFUEFSQVRPUiArIGFjdGlvbjtcbiAgICAgIH1cblxuICAgICAgLy8gSWYgdGhpcyBub2RlIGlzIHRoZSBjb250YWluZXIsIHN0b3AuXG4gICAgICBpZiAobm9kZSA9PT0gY29udGFpbmVyKSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuXG4gICAgICBub2RlID0gbm9kZS5wYXJlbnROb2RlO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBhY3Rpb247XG59XG5cbi8qKlxuICogQ2hlY2tzIGlmIGEganNhY3Rpb24gYWN0aW9uIGNvbnRhaW5zIGEgbmFtZXNwYWNlIHBhcnQuXG4gKi9cbmZ1bmN0aW9uIGlzTmFtZXNwYWNlZEFjdGlvbihhY3Rpb246IHN0cmluZyk6IGJvb2xlYW4ge1xuICByZXR1cm4gYWN0aW9uLmluZGV4T2YoQ2hhci5OQU1FU1BBQ0VfQUNUSU9OX1NFUEFSQVRPUikgPj0gMDtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIHRoZSB2YWx1ZSBvZiB0aGUganNuYW1lc3BhY2UgYXR0cmlidXRlIG9mIHRoZSBnaXZlbiBub2RlLlxuICogQWxzbyBjYWNoZXMgdGhlIHZhbHVlIGZvciBzdWJzZXF1ZW50IGxvb2t1cHMuXG4gKiBAcGFyYW0gZWxlbWVudCBUaGUgbm9kZSB3aG9zZSBqc25hbWVzcGFjZSBhdHRyaWJ1dGUgaXMgYmVpbmcgYXNrZWQgZm9yLlxuICogQHJldHVybiBUaGUgdmFsdWUgb2YgdGhlIGpzbmFtZXNwYWNlIGF0dHJpYnV0ZSwgb3IgbnVsbCBpZiBub3QgZm91bmQuXG4gKi9cbmZ1bmN0aW9uIGdldE5hbWVzcGFjZUZyb21FbGVtZW50KGVsZW1lbnQ6IEVsZW1lbnQpOiBzdHJpbmcgfCBudWxsIHtcbiAgbGV0IG5hbWVzcGFjZSA9IGNhY2hlLmdldE5hbWVzcGFjZShlbGVtZW50KTtcbiAgLy8gT25seSBxdWVyeSBmb3IgdGhlIGF0dHJpYnV0ZSBpZiBpdCBoYXMgbm90IGJlZW4gcXVlcmllZCBmb3JcbiAgLy8gYmVmb3JlLiBnZXRBdHRyKCkgcmV0dXJucyBudWxsIGlmIGFuIGF0dHJpYnV0ZSBpcyBub3QgcHJlc2VudC4gVGh1cyxcbiAgLy8gbmFtZXNwYWNlIGlzIHN0cmluZ3xudWxsIGlmIHRoZSBxdWVyeSB0b29rIHBsYWNlIGluIHRoZSBwYXN0LCBvclxuICAvLyB1bmRlZmluZWQgaWYgdGhlIHF1ZXJ5IGRpZCBub3QgdGFrZSBwbGFjZS5cbiAgaWYgKG5hbWVzcGFjZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgbmFtZXNwYWNlID0gZ2V0QXR0cihlbGVtZW50LCBBdHRyaWJ1dGUuSlNOQU1FU1BBQ0UpO1xuICAgIGNhY2hlLnNldE5hbWVzcGFjZShlbGVtZW50LCBuYW1lc3BhY2UpO1xuICB9XG4gIHJldHVybiBuYW1lc3BhY2U7XG59XG5cbi8qKlxuICogQWNjZXNzZXMgdGhlIGV2ZW50IGhhbmRsZXIgYXR0cmlidXRlIHZhbHVlIG9mIGEgRE9NIG5vZGUuIEl0IGd1YXJkc1xuICogYWdhaW5zdCB3ZWlyZCBzaXR1YXRpb25zIChkZXNjcmliZWQgaW4gdGhlIGJvZHkpIHRoYXQgb2NjdXIgaW5cbiAqIGNvbm5lY3Rpb24gd2l0aCBub2RlcyB0aGF0IGFyZSByZW1vdmVkIGZyb20gdGhlaXIgZG9jdW1lbnQuXG4gKiBAcGFyYW0gZWxlbWVudCBUaGUgRE9NIGVsZW1lbnQuXG4gKiBAcGFyYW0gYXR0cmlidXRlIFRoZSBuYW1lIG9mIHRoZSBhdHRyaWJ1dGUgdG8gYWNjZXNzLlxuICogQHJldHVybiBUaGUgYXR0cmlidXRlIHZhbHVlIGlmIGl0IHdhcyBmb3VuZCwgbnVsbCBvdGhlcndpc2UuXG4gKi9cbmZ1bmN0aW9uIGdldEF0dHIoZWxlbWVudDogRWxlbWVudCwgYXR0cmlidXRlOiBzdHJpbmcpOiBzdHJpbmcgfCBudWxsIHtcbiAgbGV0IHZhbHVlID0gbnVsbDtcbiAgLy8gTk9URTogTm9kZXMgaW4gSUUgZG8gbm90IGFsd2F5cyBoYXZlIGEgZ2V0QXR0cmlidXRlXG4gIC8vIG1ldGhvZCBkZWZpbmVkLiBUaGlzIGlzIHRoZSBjYXNlIHdoZXJlIHNvdXJjZUVsZW1lbnQgaGFzIGluXG4gIC8vIGZhY3QgYmVlbiByZW1vdmVkIGZyb20gdGhlIERPTSBiZWZvcmUgZXZlbnRDb250cmFjdCBiZWdpbnNcbiAgLy8gaGFuZGxpbmcgLSB3aGVyZSBhIHBhcmVudE5vZGUgZG9lcyBub3QgaGF2ZSBnZXRBdHRyaWJ1dGVcbiAgLy8gZGVmaW5lZC5cbiAgLy8gTk9URTogV2UgbXVzdCB1c2UgdGhlICdpbicgb3BlcmF0b3IgaW5zdGVhZCBvZiB0aGUgcmVndWxhciBkb3RcbiAgLy8gbm90YXRpb24sIHNpbmNlIHRoZSBsYXR0ZXIgZmFpbHMgaW4gSUU4IGlmIHRoZSBnZXRBdHRyaWJ1dGUgbWV0aG9kIGlzIG5vdFxuICAvLyBkZWZpbmVkLiBTZWUgYi83MTM5MTA5LlxuICBpZiAoJ2dldEF0dHJpYnV0ZScgaW4gZWxlbWVudCkge1xuICAgIHZhbHVlID0gZWxlbWVudC5nZXRBdHRyaWJ1dGUoYXR0cmlidXRlKTtcbiAgfVxuICByZXR1cm4gdmFsdWU7XG59XG5cbi8qKlxuICogSGVscGVyIGZ1bmN0aW9uIHRvIHRyaW0gd2hpdGVzcGFjZSBmcm9tIHRoZSBiZWdpbm5pbmcgYW5kIHRoZSBlbmRcbiAqIG9mIHRoZSBzdHJpbmcuIFRoaXMgZGVsaWJlcmF0ZWx5IGRvZXNuJ3QgdXNlIHRoZSBjbG9zdXJlIGVxdWl2YWxlbnRcbiAqIHRvIGtlZXAgZGVwZW5kZW5jaWVzIHNtYWxsLlxuICogQHBhcmFtIHN0ciAgSW5wdXQgc3RyaW5nLlxuICogQHJldHVybiAgVHJpbW1lZCBzdHJpbmcuXG4gKi9cbmZ1bmN0aW9uIHN0cmluZ1RyaW0oc3RyOiBzdHJpbmcpOiBzdHJpbmcge1xuICBpZiAodHlwZW9mIFN0cmluZy5wcm90b3R5cGUudHJpbSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIHJldHVybiBzdHIudHJpbSgpO1xuICB9XG5cbiAgY29uc3QgdHJpbW1lZExlZnQgPSBzdHIucmVwbGFjZSgvXlxccysvLCAnJyk7XG4gIHJldHVybiB0cmltbWVkTGVmdC5yZXBsYWNlKC9cXHMrJC8sICcnKTtcbn1cbiJdfQ==