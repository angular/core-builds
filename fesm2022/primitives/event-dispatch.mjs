/**
 * @license Angular v20.1.0-next.0+sha-d8532bc
 * (c) 2010-2025 Google LLC. https://angular.io/
 * License: MIT
 */

import { Attribute } from '../attribute-BWp59EjE.mjs';

/** All properties that are used by jsaction. */
const Property = {
    /**
     * The parsed value of the jsaction attribute is stored in this
     * property on the DOM node. The parsed value is an Object. The
     * property names of the object are the events; the values are the
     * names of the actions. This property is attached even on nodes
     * that don't have a jsaction attribute as an optimization, because
     * property lookup is faster than attribute access.
     */
    JSACTION: '__jsaction',
    /**
     * The owner property references an a logical owner for a DOM node. JSAction
     * will follow this reference instead of parentNode when traversing the DOM
     * to find jsaction attributes. This allows overlaying a logical structure
     * over a document where the DOM structure can't reflect that structure.
     */
    OWNER: '__owner',
};

/**
 * Map from jsaction annotation to a parsed map from event name to action name.
 */
const parseCache = {};
/**
 * Reads the jsaction parser cache from the given DOM Element.
 */
function get(element) {
    return element[Property.JSACTION];
}
/**
 * Reads the jsaction parser cache for the given DOM element. If no cache is yet present,
 * creates an empty one.
 */
function getDefaulted(element) {
    const cache = get(element) ?? {};
    set(element, cache);
    return cache;
}
/**
 * Writes the jsaction parser cache to the given DOM Element.
 */
function set(element, actionMap) {
    element[Property.JSACTION] = actionMap;
}
/**
 * Looks up the parsed action map from the source jsaction attribute value.
 *
 * @param text Unparsed jsaction attribute value.
 * @return Parsed jsaction attribute value, if already present in the cache.
 */
function getParsed(text) {
    return parseCache[text];
}
/**
 * Inserts the parse result for the given source jsaction value into the cache.
 *
 * @param text Unparsed jsaction attribute value.
 * @param parsed Attribute value parsed into the action map.
 */
function setParsed(text, parsed) {
    parseCache[text] = parsed;
}

/*
 * Names of events that are special to jsaction. These are not all
 * event types that are legal to use in either HTML or the addEvent()
 * API, but these are the ones that are treated specially. All other
 * DOM events can be used in either addEvent() or in the value of the
 * jsaction attribute. Beware of browser specific events or events
 * that don't bubble though: If they are not mentioned here, then
 * event contract doesn't work around their peculiarities.
 */
const EventType = {
    /**
     * The click event. In addEvent() refers to all click events, in the
     * jsaction attribute it refers to the unmodified click and Enter/Space
     * keypress events.  In the latter case, a jsaction click will be triggered,
     * for accessibility reasons.  See clickmod and clickonly, below.
     */
    CLICK: 'click',
    /**
     * Specifies the jsaction for a modified click event (i.e. a mouse
     * click with the modifier key Cmd/Ctrl pressed). This event isn't
     * separately enabled in addEvent(), because in the DOM, it's just a
     * click event.
     */
    CLICKMOD: 'clickmod',
    /**
     * The dblclick event.
     */
    DBLCLICK: 'dblclick',
    /**
     * Focus doesn't bubble, but you can use it in addEvent() and
     * jsaction anyway. EventContract does the right thing under the
     * hood.
     */
    FOCUS: 'focus',
    /**
     * This event only exists in IE. For addEvent() and jsaction, use
     * focus instead; EventContract does the right thing even though
     * focus doesn't bubble.
     */
    FOCUSIN: 'focusin',
    /**
     * Analog to focus.
     */
    BLUR: 'blur',
    /**
     * Analog to focusin.
     */
    FOCUSOUT: 'focusout',
    /**
     * Submit doesn't bubble, so it cannot be used with event
     * contract. However, the browser helpfully fires a click event on
     * the submit button of a form (even if the form is not submitted by
     * a click on the submit button). So you should handle click on the
     * submit button instead.
     */
    SUBMIT: 'submit',
    /**
     * The keydown event. In addEvent() and non-click jsaction it represents the
     * regular DOM keydown event. It represents click actions in non-Gecko
     * browsers.
     */
    KEYDOWN: 'keydown',
    /**
     * The keypress event. In addEvent() and non-click jsaction it represents the
     * regular DOM keypress event. It represents click actions in Gecko browsers.
     */
    KEYPRESS: 'keypress',
    /**
     * The keyup event. In addEvent() and non-click jsaction it represents the
     * regular DOM keyup event. It represents click actions in non-Gecko
     * browsers.
     */
    KEYUP: 'keyup',
    /**
     * The mouseover event. Can either be used directly or used implicitly to
     * capture mouseenter events. In addEvent(), it represents a regular DOM
     * mouseover event.
     */
    MOUSEOVER: 'mouseover',
    /**
     * The mouseout event. Can either be used directly or used implicitly to
     * capture mouseover events. In addEvent(), it represents a regular DOM
     * mouseout event.
     */
    MOUSEOUT: 'mouseout',
    /**
     * The mouseenter event. Does not bubble and fires individually on each
     * element being entered within a DOM tree.
     */
    MOUSEENTER: 'mouseenter',
    /**
     * The mouseleave event. Does not bubble and fires individually on each
     * element being entered within a DOM tree.
     */
    MOUSELEAVE: 'mouseleave',
    /**
     * The pointerover event. Can either be used directly or used implicitly to
     * capture pointerenter events. In addEvent(), it represents a regular DOM
     * pointerover event.
     */
    POINTEROVER: 'pointerover',
    /**
     * The pointerout event. Can either be used directly or used implicitly to
     * capture pointerover events. In addEvent(), it represents a regular DOM
     * pointerout event.
     */
    POINTEROUT: 'pointerout',
    /**
     * The pointerenter event. Does not bubble and fires individually on each
     * element being entered within a DOM tree.
     */
    POINTERENTER: 'pointerenter',
    /**
     * The pointerleave event. Does not bubble and fires individually on each
     * element being entered within a DOM tree.
     */
    POINTERLEAVE: 'pointerleave',
    /**
     * The error event. The error event doesn't bubble, but you can use it in
     * addEvent() and jsaction anyway. EventContract does the right thing under
     * the hood (except in IE8 which does not use error events).
     */
    ERROR: 'error',
    /**
     * The load event. The load event doesn't bubble, but you can use it in
     * addEvent() and jsaction anyway. EventContract does the right thing
     * under the hood.
     */
    LOAD: 'load',
    /**
     * The touchstart event. Bubbles, will only ever fire in browsers with
     * touch support.
     */
    TOUCHSTART: 'touchstart',
    /**
     * The touchend event. Bubbles, will only ever fire in browsers with
     * touch support.
     */
    TOUCHEND: 'touchend',
    /**
     * The touchmove event. Bubbles, will only ever fire in browsers with
     * touch support.
     */
    TOUCHMOVE: 'touchmove',
    /**
     * The toggle event. The toggle event doesn't bubble, but you can use it in
     * addEvent() and jsaction anyway. EventContract does the right thing
     * under the hood.
     */
    TOGGLE: 'toggle'};
/** All event types that do not bubble or capture and need a polyfill. */
const MOUSE_SPECIAL_EVENT_TYPES = [
    EventType.MOUSEENTER,
    EventType.MOUSELEAVE,
    'pointerenter',
    'pointerleave',
];
/** All event types that are registered in the bubble phase. */
const BUBBLE_EVENT_TYPES = [
    EventType.CLICK,
    EventType.DBLCLICK,
    EventType.FOCUSIN,
    EventType.FOCUSOUT,
    EventType.KEYDOWN,
    EventType.KEYUP,
    EventType.KEYPRESS,
    EventType.MOUSEOVER,
    EventType.MOUSEOUT,
    EventType.SUBMIT,
    EventType.TOUCHSTART,
    EventType.TOUCHEND,
    EventType.TOUCHMOVE,
    'touchcancel',
    'auxclick',
    'change',
    'compositionstart',
    'compositionupdate',
    'compositionend',
    'beforeinput',
    'input',
    'select',
    'copy',
    'cut',
    'paste',
    'mousedown',
    'mouseup',
    'wheel',
    'contextmenu',
    'dragover',
    'dragenter',
    'dragleave',
    'drop',
    'dragstart',
    'dragend',
    'pointerdown',
    'pointermove',
    'pointerup',
    'pointercancel',
    'pointerover',
    'pointerout',
    'gotpointercapture',
    'lostpointercapture',
    // Video events.
    'ended',
    'loadedmetadata',
    // Page visibility events.
    'pagehide',
    'pageshow',
    'visibilitychange',
    // Content visibility events.
    'beforematch',
];
/** All event types that are registered in the capture phase. */
const CAPTURE_EVENT_TYPES = [
    EventType.FOCUS,
    EventType.BLUR,
    EventType.ERROR,
    EventType.LOAD,
    EventType.TOGGLE,
];
/**
 * Whether or not an event type should be registered in the capture phase.
 * @param eventType
 * @returns bool
 */
const isCaptureEventType = (eventType) => CAPTURE_EVENT_TYPES.indexOf(eventType) >= 0;
/** All event types that are registered early.  */
const EARLY_EVENT_TYPES = BUBBLE_EVENT_TYPES.concat(CAPTURE_EVENT_TYPES);
/**
 * Whether or not an event type is registered in the early contract.
 */
const isEarlyEventType = (eventType) => EARLY_EVENT_TYPES.indexOf(eventType) >= 0;

/**
 * Gets a browser event type, if it would differ from the JSAction event type.
 */
function getBrowserEventType(eventType) {
    // Mouseenter and mouseleave events are not handled directly because they
    // are not available everywhere. In browsers where they are available, they
    // don't bubble and aren't visible at the container boundary. Instead, we
    // synthesize the mouseenter and mouseleave events from mouseover and
    // mouseout events, respectively. Cf. eventcontract.js.
    if (eventType === EventType.MOUSEENTER) {
        return EventType.MOUSEOVER;
    }
    else if (eventType === EventType.MOUSELEAVE) {
        return EventType.MOUSEOUT;
    }
    else if (eventType === EventType.POINTERENTER) {
        return EventType.POINTEROVER;
    }
    else if (eventType === EventType.POINTERLEAVE) {
        return EventType.POINTEROUT;
    }
    return eventType;
}
/**
 * Registers the event handler function with the given DOM element for
 * the given event type.
 *
 * @param element The element.
 * @param eventType The event type.
 * @param handler The handler function to install.
 * @param passive A boolean value that, if `true`, indicates that the function
 *     specified by `handler` will never call `preventDefault()`.
 * @return Information needed to uninstall the event handler eventually.
 */
function addEventListener(element, eventType, handler, passive) {
    // All event handlers are registered in the bubbling
    // phase.
    //
    // All browsers support focus and blur, but these events only are propagated
    // in the capture phase. Very legacy browsers do not support focusin or
    // focusout.
    //
    // It would be a bad idea to register all event handlers in the
    // capture phase because then regular onclick handlers would not be
    // executed at all on events that trigger a jsaction. That's not
    // entirely what we want, at least for now.
    //
    // Error and load events (i.e. on images) do not bubble so they are also
    // handled in the capture phase.
    let capture = false;
    if (isCaptureEventType(eventType)) {
        capture = true;
    }
    const options = typeof passive === 'boolean' ? { capture, passive } : capture;
    element.addEventListener(eventType, handler, options);
    return { eventType, handler, capture, passive };
}
/**
 * Removes the event handler for the given event from the element.
 * the given event type.
 *
 * @param element The element.
 * @param info The information needed to deregister the handler, as returned by
 *     addEventListener(), above.
 */
function removeEventListener(element, info) {
    if (element.removeEventListener) {
        // It's worth noting that some browser releases have been inconsistent on this, and unless
        // you have specific reasons otherwise, it's probably wise to use the same values used for
        // the call to addEventListener() when calling removeEventListener().
        const options = typeof info.passive === 'boolean' ? { capture: info.capture } : info.capture;
        element.removeEventListener(info.eventType, info.handler, options);
        // `detachEvent` is an old DOM API.
    }
    else if (element.detachEvent) {
        // `detachEvent` is an old DOM API.
        element.detachEvent(`on${info.eventType}`, info.handler);
    }
}
/**
 * Prevents the default action of an event.
 * @param e The event to prevent the default action for.
 */
function preventDefault(e) {
    e.preventDefault ? e.preventDefault() : (e.returnValue = false);
}
/**
 * Whether we are on a Mac. Not pulling in useragent just for this.
 */
let isMac = typeof navigator !== 'undefined' && /Macintosh/.test(navigator.userAgent);
/**
 * Determines and returns whether the given event (which is assumed to be a
 * click event) is a middle click.
 * NOTE: There is not a consistent way to identify middle click
 * http://www.unixpapa.com/js/mouse.html
 */
function isMiddleClick(e) {
    return (
    // `which` is an old DOM API.
    e.which === 2 ||
        // `which` is an old DOM API.
        (e.which == null &&
            // `button` is an old DOM API.
            e.button === 4) // middle click for IE
    );
}
/**
 * Determines and returns whether the given event (which is assumed
 * to be a click event) is modified. A middle click is considered a modified
 * click to retain the default browser action, which opens a link in a new tab.
 * @param e The event.
 * @return Whether the given event is modified.
 */
function isModifiedClickEvent(e) {
    return (
    // `metaKey` is an old DOM API.
    (isMac && e.metaKey) ||
        // `ctrlKey` is an old DOM API.
        (!isMac && e.ctrlKey) ||
        isMiddleClick(e) ||
        // `shiftKey` is an old DOM API.
        e.shiftKey);
}
/**
 * Determines whether the event corresponds to a non-bubbling mouse
 * event type (mouseenter, mouseleave, pointerenter, and pointerleave).
 *
 * During mouseover (mouseenter) and pointerover (pointerenter), the
 * relatedTarget is the element being entered from. During mouseout (mouseleave)
 * and pointerout (pointerleave), the relatedTarget is the element being exited
 * to.
 *
 * In both cases, if relatedTarget is outside target, then the corresponding
 * special event has occurred, otherwise it hasn't.
 *
 * @param e The mouseover/mouseout event.
 * @param type The type of the mouse special event.
 * @param element The element on which the jsaction for the
 *     mouseenter/mouseleave event is defined.
 * @return True if the event is a mouseenter/mouseleave event.
 */
function isMouseSpecialEvent(e, type, element) {
    // `relatedTarget` is an old DOM API.
    const related = e.relatedTarget;
    return (((e.type === EventType.MOUSEOVER && type === EventType.MOUSEENTER) ||
        (e.type === EventType.MOUSEOUT && type === EventType.MOUSELEAVE) ||
        (e.type === EventType.POINTEROVER && type === EventType.POINTERENTER) ||
        (e.type === EventType.POINTEROUT && type === EventType.POINTERLEAVE)) &&
        (!related || (related !== element && !element.contains(related))));
}
/**
 * Creates a new EventLike object for a mouseenter/mouseleave event that's
 * derived from the original corresponding mouseover/mouseout event.
 * @param e The event.
 * @param target The element on which the jsaction for the mouseenter/mouseleave
 *     event is defined.
 * @return A modified event-like object copied from the event object passed into
 *     this function.
 */
function createMouseSpecialEvent(e, target) {
    // We have to create a copy of the event object because we need to mutate
    // its fields. We do this for the special mouse events because the event
    // target needs to be retargeted to the action element rather than the real
    // element (since we are simulating the special mouse events with mouseover/
    // mouseout).
    //
    // Since we're making a copy anyways, we might as well attempt to convert
    // this event into a pseudo-real mouseenter/mouseleave event by adjusting
    // its type.
    //
    const copy = {};
    for (const property in e) {
        if (property === 'srcElement' || property === 'target') {
            continue;
        }
        const key = property;
        // Making a copy requires iterating through all properties of `Event`.
        const value = e[key];
        if (typeof value === 'function') {
            continue;
        }
        // Value should be the expected type, but the value of `key` is not known
        // statically.
        copy[key] = value;
    }
    if (e.type === EventType.MOUSEOVER) {
        copy['type'] = EventType.MOUSEENTER;
    }
    else if (e.type === EventType.MOUSEOUT) {
        copy['type'] = EventType.MOUSELEAVE;
    }
    else if (e.type === EventType.POINTEROVER) {
        copy['type'] = EventType.POINTERENTER;
    }
    else {
        copy['type'] = EventType.POINTERLEAVE;
    }
    copy['target'] = copy['srcElement'] = target;
    copy['bubbles'] = false;
    copy['_originalEvent'] = e;
    return copy;
}

/**
 * Whether the user agent is running on iOS.
 */
const isIos = typeof navigator !== 'undefined' && /iPhone|iPad|iPod/.test(navigator.userAgent);
/**
 * A class representing a container node and all the event handlers
 * installed on it. Used so that handlers can be cleaned up if the
 * container is removed from the contract.
 */
class EventContractContainer {
    element;
    /**
     * Array of event handlers and their corresponding event types that are
     * installed on this container.
     *
     */
    handlerInfos = [];
    /**
     * @param element The container Element.
     */
    constructor(element) {
        this.element = element;
    }
    /**
     * Installs the provided installer on the element owned by this container,
     * and maintains a reference to resulting handler in order to remove it
     * later if desired.
     */
    addEventListener(eventType, getHandler, passive) {
        // In iOS, event bubbling doesn't happen automatically in any DOM element,
        // unless it has an onclick attribute or DOM event handler attached to it.
        // This breaks JsAction in some cases. See "Making Elements Clickable"
        // section at http://goo.gl/2VoGnB.
        //
        // A workaround for this issue is to change the CSS cursor style to 'pointer'
        // for the container element, which magically turns on event bubbling. This
        // solution is described in the comments section at http://goo.gl/6pEO1z.
        //
        // We use a navigator.userAgent check here as this problem is present both
        // on Mobile Safari and thin WebKit wrappers, such as Chrome for iOS.
        if (isIos) {
            this.element.style.cursor = 'pointer';
        }
        this.handlerInfos.push(addEventListener(this.element, eventType, getHandler(this.element), passive));
    }
    /**
     * Removes all the handlers installed on this container.
     */
    cleanUp() {
        for (let i = 0; i < this.handlerInfos.length; i++) {
            removeEventListener(this.element, this.handlerInfos[i]);
        }
        this.handlerInfos = [];
    }
}

const Char = {
    /**
     * The separator between the event name and action in the jsaction
     * attribute value.
     */
    EVENT_ACTION_SEPARATOR: ':',
};

/** Added for readability when accessing stable property names. */
function getEventType(eventInfo) {
    return eventInfo.eventType;
}
/** Added for readability when accessing stable property names. */
function setEventType(eventInfo, eventType) {
    eventInfo.eventType = eventType;
}
/** Added for readability when accessing stable property names. */
function getEvent(eventInfo) {
    return eventInfo.event;
}
/** Added for readability when accessing stable property names. */
function setEvent(eventInfo, event) {
    eventInfo.event = event;
}
/** Added for readability when accessing stable property names. */
function getTargetElement(eventInfo) {
    return eventInfo.targetElement;
}
/** Added for readability when accessing stable property names. */
function setTargetElement(eventInfo, targetElement) {
    eventInfo.targetElement = targetElement;
}
/** Added for readability when accessing stable property names. */
function getContainer(eventInfo) {
    return eventInfo.eic;
}
/** Added for readability when accessing stable property names. */
function setContainer(eventInfo, container) {
    eventInfo.eic = container;
}
/** Added for readability when accessing stable property names. */
function getTimestamp(eventInfo) {
    return eventInfo.timeStamp;
}
/** Added for readability when accessing stable property names. */
function setTimestamp(eventInfo, timestamp) {
    eventInfo.timeStamp = timestamp;
}
/** Added for readability when accessing stable property names. */
function getAction(eventInfo) {
    return eventInfo.eia;
}
/** Added for readability when accessing stable property names. */
function setAction(eventInfo, actionName, actionElement) {
    eventInfo.eia = [actionName, actionElement];
}
/** Added for readability when accessing stable property names. */
function unsetAction(eventInfo) {
    eventInfo.eia = undefined;
}
/** Added for readability when accessing stable property names. */
function getActionElement(actionInfo) {
    return actionInfo[1];
}
/** Added for readability when accessing stable property names. */
function getIsReplay(eventInfo) {
    return eventInfo.eirp;
}
/** Added for readability when accessing stable property names. */
function setIsReplay(eventInfo, replay) {
    eventInfo.eirp = replay;
}
/** Added for readability when accessing stable property names. */
function getResolved(eventInfo) {
    return eventInfo.eir;
}
/** Added for readability when accessing stable property names. */
function setResolved(eventInfo, resolved) {
    eventInfo.eir = resolved;
}
/** Clones an `EventInfo` */
function cloneEventInfo(eventInfo) {
    return {
        eventType: eventInfo.eventType,
        event: eventInfo.event,
        targetElement: eventInfo.targetElement,
        eic: eventInfo.eic,
        eia: eventInfo.eia,
        timeStamp: eventInfo.timeStamp,
        eirp: eventInfo.eirp,
        eiack: eventInfo.eiack,
        eir: eventInfo.eir,
    };
}
/**
 * Utility function for creating an `EventInfo`.
 *
 * This can be used from code-size sensitive compilation units, as taking
 * parameters vs. an `Object` literal reduces code size.
 */
function createEventInfoFromParameters(eventType, event, targetElement, container, timestamp, action, isReplay, a11yClickKey) {
    return {
        eventType,
        event,
        targetElement,
        eic: container,
        timeStamp: timestamp,
        eia: action,
        eirp: isReplay,
        eiack: a11yClickKey,
    };
}
/**
 * Utility class around an `EventInfo`.
 *
 * This should be used in compilation units that are less sensitive to code
 * size.
 */
class EventInfoWrapper {
    eventInfo;
    constructor(eventInfo) {
        this.eventInfo = eventInfo;
    }
    getEventType() {
        return getEventType(this.eventInfo);
    }
    setEventType(eventType) {
        setEventType(this.eventInfo, eventType);
    }
    getEvent() {
        return getEvent(this.eventInfo);
    }
    setEvent(event) {
        setEvent(this.eventInfo, event);
    }
    getTargetElement() {
        return getTargetElement(this.eventInfo);
    }
    setTargetElement(targetElement) {
        setTargetElement(this.eventInfo, targetElement);
    }
    getContainer() {
        return getContainer(this.eventInfo);
    }
    setContainer(container) {
        setContainer(this.eventInfo, container);
    }
    getTimestamp() {
        return getTimestamp(this.eventInfo);
    }
    setTimestamp(timestamp) {
        setTimestamp(this.eventInfo, timestamp);
    }
    getAction() {
        const action = getAction(this.eventInfo);
        if (!action)
            return undefined;
        return {
            name: action[0],
            element: action[1],
        };
    }
    setAction(action) {
        if (!action) {
            unsetAction(this.eventInfo);
            return;
        }
        setAction(this.eventInfo, action.name, action.element);
    }
    getIsReplay() {
        return getIsReplay(this.eventInfo);
    }
    setIsReplay(replay) {
        setIsReplay(this.eventInfo, replay);
    }
    getResolved() {
        return getResolved(this.eventInfo);
    }
    setResolved(resolved) {
        setResolved(this.eventInfo, resolved);
    }
    clone() {
        return new EventInfoWrapper(cloneEventInfo(this.eventInfo));
    }
}

/**
 * Since maps from event to action are immutable we can use a single map
 * to represent the empty map.
 */
const EMPTY_ACTION_MAP = {};
/**
 * This regular expression matches a semicolon.
 */
const REGEXP_SEMICOLON = /\s*;\s*/;
/** If no event type is defined, defaults to `click`. */
const DEFAULT_EVENT_TYPE = EventType.CLICK;
/** Resolves actions for Events. */
class ActionResolver {
    a11yClickSupport = false;
    clickModSupport = true;
    syntheticMouseEventSupport;
    updateEventInfoForA11yClick = undefined;
    preventDefaultForA11yClick = undefined;
    populateClickOnlyAction = undefined;
    constructor({ syntheticMouseEventSupport = false, clickModSupport = true, } = {}) {
        this.syntheticMouseEventSupport = syntheticMouseEventSupport;
        this.clickModSupport = clickModSupport;
    }
    resolveEventType(eventInfo) {
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
        if (this.clickModSupport &&
            getEventType(eventInfo) === EventType.CLICK &&
            isModifiedClickEvent(getEvent(eventInfo))) {
            setEventType(eventInfo, EventType.CLICKMOD);
        }
        else if (this.a11yClickSupport) {
            this.updateEventInfoForA11yClick(eventInfo);
        }
    }
    resolveAction(eventInfo) {
        if (getResolved(eventInfo)) {
            return;
        }
        this.populateAction(eventInfo, getTargetElement(eventInfo));
        setResolved(eventInfo, true);
    }
    resolveParentAction(eventInfo) {
        const action = getAction(eventInfo);
        const actionElement = action && getActionElement(action);
        unsetAction(eventInfo);
        const parentNode = actionElement && this.getParentNode(actionElement);
        if (!parentNode) {
            return;
        }
        this.populateAction(eventInfo, parentNode);
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
    populateAction(eventInfo, currentTarget) {
        let actionElement = currentTarget;
        while (actionElement && actionElement !== getContainer(eventInfo)) {
            if (actionElement.nodeType === Node.ELEMENT_NODE) {
                this.populateActionOnElement(actionElement, eventInfo);
            }
            if (getAction(eventInfo)) {
                // An event is handled by at most one jsaction. Thus we stop at the
                // first matching jsaction specified in a jsaction attribute up the
                // ancestor chain of the event target node.
                break;
            }
            actionElement = this.getParentNode(actionElement);
        }
        const action = getAction(eventInfo);
        if (!action) {
            // No action found.
            return;
        }
        if (this.a11yClickSupport) {
            this.preventDefaultForA11yClick(eventInfo);
        }
        // We attempt to handle the mouseenter/mouseleave events here by
        // detecting whether the mouseover/mouseout events correspond to
        // entering/leaving an element.
        if (this.syntheticMouseEventSupport) {
            if (getEventType(eventInfo) === EventType.MOUSEENTER ||
                getEventType(eventInfo) === EventType.MOUSELEAVE ||
                getEventType(eventInfo) === EventType.POINTERENTER ||
                getEventType(eventInfo) === EventType.POINTERLEAVE) {
                // We attempt to handle the mouseenter/mouseleave events here by
                // detecting whether the mouseover/mouseout events correspond to
                // entering/leaving an element.
                if (isMouseSpecialEvent(getEvent(eventInfo), getEventType(eventInfo), getActionElement(action))) {
                    // If both mouseover/mouseout and mouseenter/mouseleave events are
                    // enabled, two separate handlers for mouseover/mouseout are
                    // registered. Both handlers will see the same event instance
                    // so we create a copy to avoid interfering with the dispatching of
                    // the mouseover/mouseout event.
                    const copiedEvent = createMouseSpecialEvent(getEvent(eventInfo), getActionElement(action));
                    setEvent(eventInfo, copiedEvent);
                    // Since the mouseenter/mouseleave events do not bubble, the target
                    // of the event is technically the `actionElement` (the node with the
                    // `jsaction` attribute)
                    setTargetElement(eventInfo, getActionElement(action));
                }
                else {
                    unsetAction(eventInfo);
                }
            }
        }
    }
    /**
     * Walk to the parent node, unless the node has a different owner in
     * which case we walk to the owner. Attempt to walk to host of a
     * shadow root if needed.
     */
    getParentNode(element) {
        const owner = element[Property.OWNER];
        if (owner) {
            return owner;
        }
        const parentNode = element.parentNode;
        if (parentNode?.nodeName === '#document-fragment') {
            return parentNode?.host ?? null;
        }
        return parentNode;
    }
    /**
     * Accesses the jsaction map on a node and retrieves the name of the
     * action the given event is mapped to, if any. It parses the
     * attribute value and stores it in a property on the node for
     * subsequent retrieval without re-parsing and re-accessing the
     * attribute.
     *
     * @param actionElement The DOM node to retrieve the jsaction map from.
     * @param eventInfo `EventInfo` to set `action` and `actionElement` if an
     *    action is found on the `actionElement`.
     */
    populateActionOnElement(actionElement, eventInfo) {
        const actionMap = this.parseActions(actionElement);
        const actionName = actionMap[getEventType(eventInfo)];
        if (actionName !== undefined) {
            setAction(eventInfo, actionName, actionElement);
        }
        if (this.a11yClickSupport) {
            this.populateClickOnlyAction(actionElement, eventInfo, actionMap);
        }
    }
    /**
     * Parses and caches an element's jsaction element into a map.
     *
     * This is primarily for internal use.
     *
     * @param actionElement The DOM node to retrieve the jsaction map from.
     * @return Map from event to qualified name of the jsaction bound to it.
     */
    parseActions(actionElement) {
        let actionMap = get(actionElement);
        if (!actionMap) {
            const jsactionAttribute = actionElement.getAttribute(Attribute.JSACTION);
            if (!jsactionAttribute) {
                actionMap = EMPTY_ACTION_MAP;
                set(actionElement, actionMap);
            }
            else {
                actionMap = getParsed(jsactionAttribute);
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
                        const type = hasColon ? value.substr(0, colon).trim() : DEFAULT_EVENT_TYPE;
                        const action = hasColon ? value.substr(colon + 1).trim() : value;
                        actionMap[type] = action;
                    }
                    setParsed(jsactionAttribute, actionMap);
                }
                set(actionElement, actionMap);
            }
        }
        return actionMap;
    }
    addA11yClickSupport(updateEventInfoForA11yClick, preventDefaultForA11yClick, populateClickOnlyAction) {
        this.a11yClickSupport = true;
        this.updateEventInfoForA11yClick = updateEventInfoForA11yClick;
        this.preventDefaultForA11yClick = preventDefaultForA11yClick;
        this.populateClickOnlyAction = populateClickOnlyAction;
    }
}

/**
 * @fileoverview An enum to control who can call certain jsaction APIs.
 */
var Restriction;
(function (Restriction) {
    Restriction[Restriction["I_AM_THE_JSACTION_FRAMEWORK"] = 0] = "I_AM_THE_JSACTION_FRAMEWORK";
})(Restriction || (Restriction = {}));

/**
 * Receives a DOM event, determines the jsaction associated with the source
 * element of the DOM event, and invokes the handler associated with the
 * jsaction.
 */
class Dispatcher {
    dispatchDelegate;
    // The ActionResolver to use to resolve actions.
    actionResolver;
    /** The replayer function to be called when there are queued events. */
    eventReplayer;
    /** Whether the event replay is scheduled. */
    eventReplayScheduled = false;
    /** The queue of events. */
    replayEventInfoWrappers = [];
    /**
     * Options are:
     *   - `eventReplayer`: When the event contract dispatches replay events
     *      to the Dispatcher, the Dispatcher collects them and in the next tick
     *      dispatches them to the `eventReplayer`. Defaults to dispatching to `dispatchDelegate`.
     * @param dispatchDelegate A function that should handle dispatching an `EventInfoWrapper` to handlers.
     */
    constructor(dispatchDelegate, { actionResolver, eventReplayer, } = {}) {
        this.dispatchDelegate = dispatchDelegate;
        this.actionResolver = actionResolver;
        this.eventReplayer = eventReplayer;
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
    dispatch(eventInfo) {
        const eventInfoWrapper = new EventInfoWrapper(eventInfo);
        this.actionResolver?.resolveEventType(eventInfo);
        this.actionResolver?.resolveAction(eventInfo);
        const action = eventInfoWrapper.getAction();
        if (action && shouldPreventDefaultBeforeDispatching(action.element, eventInfoWrapper)) {
            preventDefault(eventInfoWrapper.getEvent());
        }
        if (this.eventReplayer && eventInfoWrapper.getIsReplay()) {
            this.scheduleEventInfoWrapperReplay(eventInfoWrapper);
            return;
        }
        this.dispatchDelegate(eventInfoWrapper);
    }
    /**
     * Schedules an `EventInfoWrapper` for replay. The replaying will happen in its own
     * stack once the current flow cedes control. This is done to mimic
     * browser event handling.
     */
    scheduleEventInfoWrapperReplay(eventInfoWrapper) {
        this.replayEventInfoWrappers.push(eventInfoWrapper);
        if (this.eventReplayScheduled) {
            return;
        }
        this.eventReplayScheduled = true;
        Promise.resolve().then(() => {
            this.eventReplayScheduled = false;
            this.eventReplayer(this.replayEventInfoWrappers);
        });
    }
}
/**
 * Returns true if the default action of this event should be prevented before
 * this event is dispatched.
 */
function shouldPreventDefaultBeforeDispatching(actionElement, eventInfoWrapper) {
    // Prevent browser from following <a> node links if a jsaction is present
    // and we are dispatching the action now. Note that the targetElement may be
    // a child of an anchor that has a jsaction attached. For that reason, we
    // need to check the actionElement rather than the targetElement.
    return (actionElement.tagName === 'A' &&
        (eventInfoWrapper.getEventType() === EventType.CLICK ||
            eventInfoWrapper.getEventType() === EventType.CLICKMOD));
}

/** An internal symbol used to indicate whether propagation should be stopped or not. */
const PROPAGATION_STOPPED_SYMBOL = /* @__PURE__ */ Symbol.for('propagationStopped');
/** Extra event phases beyond what the browser provides. */
const EventPhase = {
    REPLAY: 101,
};
const PREVENT_DEFAULT_ERROR_MESSAGE_DETAILS = ' Because event replay occurs after browser dispatch, `preventDefault` would have no ' +
    'effect. You can check whether an event is being replayed by accessing the event phase: ' +
    '`event.eventPhase === EventPhase.REPLAY`.';
const PREVENT_DEFAULT_ERROR_MESSAGE = `\`preventDefault\` called during event replay.`;
const COMPOSED_PATH_ERROR_MESSAGE_DETAILS = ' Because event replay occurs after browser ' +
    'dispatch, `composedPath()` will be empty. Iterate parent nodes from `event.target` or ' +
    '`event.currentTarget` if you need to check elements in the event path.';
const COMPOSED_PATH_ERROR_MESSAGE = `\`composedPath\` called during event replay.`;
/**
 * A dispatcher that uses browser-based `Event` semantics, for example bubbling, `stopPropagation`,
 * `currentTarget`, etc.
 */
class EventDispatcher {
    dispatchDelegate;
    clickModSupport;
    actionResolver;
    dispatcher;
    constructor(dispatchDelegate, clickModSupport = true) {
        this.dispatchDelegate = dispatchDelegate;
        this.clickModSupport = clickModSupport;
        this.actionResolver = new ActionResolver({ clickModSupport });
        this.dispatcher = new Dispatcher((eventInfoWrapper) => {
            this.dispatchToDelegate(eventInfoWrapper);
        }, {
            actionResolver: this.actionResolver,
        });
    }
    /**
     * The entrypoint for the `EventContract` dispatch.
     */
    dispatch(eventInfo) {
        this.dispatcher.dispatch(eventInfo);
    }
    /** Internal method that does basic disaptching. */
    dispatchToDelegate(eventInfoWrapper) {
        if (eventInfoWrapper.getIsReplay()) {
            prepareEventForReplay(eventInfoWrapper);
        }
        prepareEventForBubbling(eventInfoWrapper);
        while (eventInfoWrapper.getAction()) {
            prepareEventForDispatch(eventInfoWrapper);
            // If this is a capture event, ONLY dispatch if the action element is the target.
            if (isCaptureEventType(eventInfoWrapper.getEventType()) &&
                eventInfoWrapper.getAction().element !== eventInfoWrapper.getTargetElement()) {
                return;
            }
            this.dispatchDelegate(eventInfoWrapper.getEvent(), eventInfoWrapper.getAction().name);
            if (propagationStopped(eventInfoWrapper)) {
                return;
            }
            this.actionResolver.resolveParentAction(eventInfoWrapper.eventInfo);
        }
    }
}
function prepareEventForBubbling(eventInfoWrapper) {
    const event = eventInfoWrapper.getEvent();
    const originalStopPropagation = eventInfoWrapper.getEvent().stopPropagation.bind(event);
    const stopPropagation = () => {
        event[PROPAGATION_STOPPED_SYMBOL] = true;
        originalStopPropagation();
    };
    patchEventInstance(event, 'stopPropagation', stopPropagation);
    patchEventInstance(event, 'stopImmediatePropagation', stopPropagation);
}
function propagationStopped(eventInfoWrapper) {
    const event = eventInfoWrapper.getEvent();
    return !!event[PROPAGATION_STOPPED_SYMBOL];
}
function prepareEventForReplay(eventInfoWrapper) {
    const event = eventInfoWrapper.getEvent();
    const target = eventInfoWrapper.getTargetElement();
    const originalPreventDefault = event.preventDefault.bind(event);
    patchEventInstance(event, 'target', target);
    patchEventInstance(event, 'eventPhase', EventPhase.REPLAY);
    patchEventInstance(event, 'preventDefault', () => {
        originalPreventDefault();
        throw new Error(PREVENT_DEFAULT_ERROR_MESSAGE + (ngDevMode ? PREVENT_DEFAULT_ERROR_MESSAGE_DETAILS : ''));
    });
    patchEventInstance(event, 'composedPath', () => {
        throw new Error(COMPOSED_PATH_ERROR_MESSAGE + (ngDevMode ? COMPOSED_PATH_ERROR_MESSAGE_DETAILS : ''));
    });
}
function prepareEventForDispatch(eventInfoWrapper) {
    const event = eventInfoWrapper.getEvent();
    const currentTarget = eventInfoWrapper.getAction()?.element;
    if (currentTarget) {
        patchEventInstance(event, 'currentTarget', currentTarget, {
            // `currentTarget` is going to get reassigned every dispatch.
            configurable: true,
        });
    }
}
/**
 * Patch `Event` instance during non-standard `Event` dispatch. This patches just the `Event`
 * instance that the browser created, it does not patch global properties or methods.
 *
 * This is necessary because dispatching an `Event` outside of browser dispatch results in
 * incorrect properties and methods that need to be polyfilled or do not work.
 *
 * JSAction dispatch adds two extra "phases" to event dispatch:
 * 1. Event delegation - the event is being dispatched by a delegating event handler on a container
 *    (typically `window.document.documentElement`), to a delegated event handler on some child
 *    element. Certain `Event` properties will be unintuitive, such as `currentTarget`, which would
 *    be the container rather than the child element. Bubbling would also not work. In order to
 *    emulate the browser, these properties and methods on the `Event` are patched.
 * 2. Event replay - the event is being dispatched by the framework once the handlers have been
 *    loaded (during hydration, or late-loaded). Certain `Event` properties can be unset by the
 *    browser because the `Event` is no longer actively being dispatched, such as `target`. Other
 *    methods have no effect because the `Event` has already been dispatched, such as
 *    `preventDefault`. Bubbling would also not work. These properties and methods are patched,
 *    either to fill in information that the browser may have removed, or to throw errors in methods
 *    that no longer behave as expected.
 */
function patchEventInstance(event, property, value, { configurable = false } = {}) {
    Object.defineProperty(event, property, { value, configurable });
}
/**
 * Registers deferred functionality for an EventContract and a Jsaction
 * Dispatcher.
 */
function registerDispatcher$1(eventContract, dispatcher) {
    eventContract.ecrd((eventInfo) => {
        dispatcher.dispatch(eventInfo);
    }, Restriction.I_AM_THE_JSACTION_FRAMEWORK);
}

/** Creates an `EarlyJsactionData` object. */
function createEarlyJsactionData(container) {
    const q = [];
    const d = (eventInfo) => {
        q.push(eventInfo);
    };
    const h = (event) => {
        d(createEventInfoFromParameters(event.type, event, event.target, container, Date.now()));
    };
    return {
        c: container,
        q,
        et: [],
        etc: [],
        d,
        h,
    };
}
/** Add all the events to the container stored in the `EarlyJsactionData`. */
function addEvents(earlyJsactionData, types, capture) {
    for (let i = 0; i < types.length; i++) {
        const eventType = types[i];
        const eventTypes = capture ? earlyJsactionData.etc : earlyJsactionData.et;
        eventTypes.push(eventType);
        earlyJsactionData.c.addEventListener(eventType, earlyJsactionData.h, capture);
    }
}
/** Get the queued `EventInfo` objects that were dispatched before a dispatcher was registered. */
function getQueuedEventInfos(earlyJsactionData) {
    return earlyJsactionData?.q ?? [];
}
/** Register a different dispatcher function on the `EarlyJsactionData`. */
function registerDispatcher(earlyJsactionData, dispatcher) {
    if (!earlyJsactionData) {
        return;
    }
    earlyJsactionData.d = dispatcher;
}
/** Removes all event listener handlers. */
function removeAllEventListeners(earlyJsactionData) {
    if (!earlyJsactionData) {
        return;
    }
    removeEventListeners(earlyJsactionData.c, earlyJsactionData.et, earlyJsactionData.h);
    removeEventListeners(earlyJsactionData.c, earlyJsactionData.etc, earlyJsactionData.h, true);
}
function removeEventListeners(container, eventTypes, earlyEventHandler, capture) {
    for (let i = 0; i < eventTypes.length; i++) {
        container.removeEventListener(eventTypes[i], earlyEventHandler, /* useCapture */ capture);
    }
}

/**
 * @define Support for the non-bubbling mouseenter and mouseleave events.  This
 * flag can be overridden in a build rule.
 */
const MOUSE_SPECIAL_SUPPORT = false;

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
class EventContract {
    static MOUSE_SPECIAL_SUPPORT = MOUSE_SPECIAL_SUPPORT;
    containerManager;
    /**
     * The DOM events which this contract covers. Used to prevent double
     * registration of event types. The value of the map is the
     * internally created DOM event handler function that handles the
     * DOM events. See addEvent().
     *
     */
    eventHandlers = {};
    browserEventTypeToExtraEventTypes = {};
    /**
     * The dispatcher function. Events are passed to this function for
     * handling once it was set using the registerDispatcher() method. This is
     * done because the function is passed from another jsbinary, so passing the
     * instance and invoking the method here would require to leave the method
     * unobfuscated.
     */
    dispatcher = null;
    /**
     * The list of suspended `EventInfo` that will be dispatched
     * as soon as the `Dispatcher` is registered.
     */
    queuedEventInfos = [];
    constructor(containerManager) {
        this.containerManager = containerManager;
    }
    handleEvent(eventType, event, container) {
        const eventInfo = createEventInfoFromParameters(
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
            setIsReplay(eventInfo, true);
            this.queuedEventInfos?.push(eventInfo);
            return;
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
     *
     * @param passive A boolean value that, if `true`, indicates that the event
     *     handler will never call `preventDefault()`.
     */
    addEvent(eventType, prefixedEventType, passive) {
        if (eventType in this.eventHandlers || !this.containerManager) {
            return;
        }
        if (!EventContract.MOUSE_SPECIAL_SUPPORT && MOUSE_SPECIAL_EVENT_TYPES.indexOf(eventType) >= 0) {
            return;
        }
        const eventHandler = (eventType, event, container) => {
            this.handleEvent(eventType, event, container);
        };
        // Store the callback to allow us to replay events.
        this.eventHandlers[eventType] = eventHandler;
        const browserEventType = getBrowserEventType(prefixedEventType || eventType);
        if (browserEventType !== eventType) {
            const eventTypes = this.browserEventTypeToExtraEventTypes[browserEventType] || [];
            eventTypes.push(eventType);
            this.browserEventTypeToExtraEventTypes[browserEventType] = eventTypes;
        }
        this.containerManager.addEventListener(browserEventType, (element) => {
            return (event) => {
                eventHandler(eventType, event, element);
            };
        }, passive);
    }
    /**
     * Gets the queued early events and replay them using the appropriate handler
     * in the provided event contract. Once all the events are replayed, it cleans
     * up the early contract.
     */
    replayEarlyEvents(earlyJsactionData = window._ejsa) {
        // Check if the early contract is present and prevent calling this function
        // more than once.
        if (!earlyJsactionData) {
            return;
        }
        // Replay the early contract events.
        this.replayEarlyEventInfos(earlyJsactionData.q);
        // Clean up the early contract.
        removeAllEventListeners(earlyJsactionData);
        delete window._ejsa;
    }
    /**
     * Replays all the early `EventInfo` objects, dispatching them through the normal
     * `EventContract` flow.
     */
    replayEarlyEventInfos(earlyEventInfos) {
        for (let i = 0; i < earlyEventInfos.length; i++) {
            const earlyEventInfo = earlyEventInfos[i];
            const eventTypes = this.getEventTypesForBrowserEventType(earlyEventInfo.eventType);
            for (let j = 0; j < eventTypes.length; j++) {
                const eventInfo = cloneEventInfo(earlyEventInfo);
                // EventInfo eventType maps to JSAction's internal event type,
                // rather than the browser event type.
                setEventType(eventInfo, eventTypes[j]);
                this.handleEventInfo(eventInfo);
            }
        }
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
        this.containerManager?.cleanUp();
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
}

/**
 * Creates an `EarlyJsactionData`, adds events to it, and populates it on a nested object on
 * the window.
 */
function bootstrapAppScopedEarlyEventContract(container, appId, bubbleEventTypes, captureEventTypes, dataContainer = window) {
    const earlyJsactionData = createEarlyJsactionData(container);
    if (!dataContainer._ejsas) {
        dataContainer._ejsas = {};
    }
    dataContainer._ejsas[appId] = earlyJsactionData;
    addEvents(earlyJsactionData, bubbleEventTypes);
    addEvents(earlyJsactionData, captureEventTypes, /* capture= */ true);
}
/** Get the queued `EventInfo` objects that were dispatched before a dispatcher was registered. */
function getAppScopedQueuedEventInfos(appId, dataContainer = window) {
    return getQueuedEventInfos(dataContainer._ejsas?.[appId]);
}
/**
 * Registers a dispatcher function on the `EarlyJsactionData` present on the nested object on the
 * window.
 */
function registerAppScopedDispatcher(restriction, appId, dispatcher, dataContainer = window) {
    registerDispatcher(dataContainer._ejsas?.[appId], dispatcher);
}
/** Removes all event listener handlers. */
function removeAllAppScopedEventListeners(appId, dataContainer = window) {
    removeAllEventListeners(dataContainer._ejsas?.[appId]);
}
/** Clear the early event contract. */
function clearAppScopedEarlyEventContract(appId, dataContainer = window) {
    if (!dataContainer._ejsas) {
        return;
    }
    dataContainer._ejsas[appId] = undefined;
}

export { Attribute, EventContract, EventContractContainer, EventDispatcher, EventInfoWrapper, EventPhase, bootstrapAppScopedEarlyEventContract, clearAppScopedEarlyEventContract, getDefaulted as getActionCache, getAppScopedQueuedEventInfos, isCaptureEventType, isEarlyEventType, registerAppScopedDispatcher, registerDispatcher$1 as registerDispatcher, removeAllAppScopedEventListeners };
//# sourceMappingURL=event-dispatch.mjs.map
