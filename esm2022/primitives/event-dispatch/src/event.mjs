/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as dom from './dom';
import { EventType } from './event_type';
import { KeyCode } from './key_code';
/**
 * Gets a browser event type, if it would differ from the JSAction event type.
 */
export function getBrowserEventType(eventType) {
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
 * @return Information needed to uninstall the event handler eventually.
 */
export function addEventListener(element, eventType, handler) {
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
    if (eventType === EventType.FOCUS ||
        eventType === EventType.BLUR ||
        eventType === EventType.ERROR ||
        eventType === EventType.LOAD ||
        eventType === EventType.TOGGLE) {
        capture = true;
    }
    element.addEventListener(eventType, handler, capture);
    return { eventType, handler, capture };
}
/**
 * Removes the event handler for the given event from the element.
 * the given event type.
 *
 * @param element The element.
 * @param info The information needed to deregister the handler, as returned by
 *     addEventListener(), above.
 */
export function removeEventListener(element, info) {
    if (element.removeEventListener) {
        element.removeEventListener(info.eventType, info.handler, info.capture);
        // `detachEvent` is an old DOM API.
        // tslint:disable-next-line:no-any
    }
    else if (element.detachEvent) {
        // `detachEvent` is an old DOM API.
        // tslint:disable-next-line:no-any
        element.detachEvent(`on${info.eventType}`, info.handler);
    }
}
/**
 * Cancels propagation of an event.
 * @param e The event to cancel propagation for.
 */
export function stopPropagation(e) {
    e.stopPropagation ? e.stopPropagation() : (e.cancelBubble = true);
}
/**
 * Prevents the default action of an event.
 * @param e The event to prevent the default action for.
 */
export function preventDefault(e) {
    e.preventDefault ? e.preventDefault() : (e.returnValue = false);
}
/**
 * Gets the target Element of the event. In Firefox, a text node may appear as
 * the target of the event, in which case we return the parent element of the
 * text node.
 * @param e The event to get the target of.
 * @return The target element.
 */
export function getTarget(e) {
    let el = e.target;
    // In Firefox, the event may have a text node as its target. We always
    // want the parent Element the text node belongs to, however.
    if (!el.getAttribute && el.parentNode) {
        el = el.parentNode;
    }
    return el;
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
    // tslint:disable-next-line:no-any
    e.which === 2 ||
        // `which` is an old DOM API.
        // tslint:disable-next-line:no-any
        (e.which == null &&
            // `button` is an old DOM API.
            // tslint:disable-next-line:no-any
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
export function isModifiedClickEvent(e) {
    return (
    // `metaKey` is an old DOM API.
    // tslint:disable-next-line:no-any
    (isMac && e.metaKey) ||
        // `ctrlKey` is an old DOM API.
        // tslint:disable-next-line:no-any
        (!isMac && e.ctrlKey) ||
        isMiddleClick(e) ||
        // `shiftKey` is an old DOM API.
        // tslint:disable-next-line:no-any
        e.shiftKey);
}
/** Whether we are on WebKit (e.g., Chrome). */
export const isWebKit = typeof navigator !== 'undefined' &&
    !/Opera/.test(navigator.userAgent) &&
    /WebKit/.test(navigator.userAgent);
/** Whether we are on IE. */
export const isIe = typeof navigator !== 'undefined' &&
    (/MSIE/.test(navigator.userAgent) || /Trident/.test(navigator.userAgent));
/** Whether we are on Gecko (e.g., Firefox). */
export const isGecko = typeof navigator !== 'undefined' &&
    !/Opera|WebKit/.test(navigator.userAgent) &&
    /Gecko/.test(navigator.product);
/**
 * Determines and returns whether the given element is a valid target for
 * keypress/keydown DOM events that act like regular DOM clicks.
 * @param el The element.
 * @return Whether the given element is a valid action key target.
 */
export function isValidActionKeyTarget(el) {
    if (!('getAttribute' in el)) {
        return false;
    }
    if (isTextControl(el)) {
        return false;
    }
    if (isNativelyActivatable(el)) {
        return false;
    }
    // `isContentEditable` is an old DOM API.
    // tslint:disable-next-line:no-any
    if (el.isContentEditable) {
        return false;
    }
    return true;
}
/**
 * Whether an event has a modifier key activated.
 * @param e The event.
 * @return True, if a modifier key is activated.
 */
function hasModifierKey(e) {
    return (
    // `ctrlKey` is an old DOM API.
    // tslint:disable-next-line:no-any
    e.ctrlKey ||
        // `shiftKey` is an old DOM API.
        // tslint:disable-next-line:no-any
        e.shiftKey ||
        // `altKey` is an old DOM API.
        // tslint:disable-next-line:no-any
        e.altKey ||
        // `metaKey` is an old DOM API.
        // tslint:disable-next-line:no-any
        e.metaKey);
}
/**
 * Determines and returns whether the given event has a target that already
 * has event handlers attached because it is a native HTML control. Used to
 * determine if preventDefault should be called when isActionKeyEvent is true.
 * @param e The event.
 * @return If preventDefault should be called.
 */
export function shouldCallPreventDefaultOnNativeHtmlControl(e) {
    const el = getTarget(e);
    const tagName = el.tagName.toUpperCase();
    const role = (el.getAttribute('role') || '').toUpperCase();
    if (tagName === 'BUTTON' || role === 'BUTTON') {
        return true;
    }
    if (!isNativeHTMLControl(el)) {
        return false;
    }
    if (tagName === 'A') {
        return false;
    }
    /**
     * Fix for physical d-pads on feature phone platforms; the native event
     * (ie. isTrusted: true) needs to fire to show the OPTION list. See
     * b/135288469 for more info.
     */
    if (tagName === 'SELECT') {
        return false;
    }
    if (processSpace(el)) {
        return false;
    }
    if (isTextControl(el)) {
        return false;
    }
    return true;
}
/**
 * Determines and returns whether the given event acts like a regular DOM click,
 * and should be handled instead of the click.  If this returns true, the caller
 * will call preventDefault() to prevent a possible duplicate event.
 * This is represented by a keypress (keydown on Gecko browsers) on Enter or
 * Space key.
 * @param e The event.
 * @return True, if the event emulates a DOM click.
 */
export function isActionKeyEvent(e) {
    let key = 
    // `which` is an old DOM API.
    // tslint:disable-next-line:no-any
    e.which ||
        // `keyCode` is an old DOM API.
        // tslint:disable-next-line:no-any
        e.keyCode;
    if (!key && e.key) {
        key = ACTION_KEY_TO_KEYCODE[e.key];
    }
    if (isWebKit && key === KeyCode.MAC_ENTER) {
        key = KeyCode.ENTER;
    }
    if (key !== KeyCode.ENTER && key !== KeyCode.SPACE) {
        return false;
    }
    const el = getTarget(e);
    if (e.type !== EventType.KEYDOWN || !isValidActionKeyTarget(el) || hasModifierKey(e)) {
        return false;
    }
    // For <input type="checkbox">, we must only handle the browser's native click
    // event, so that the browser can toggle the checkbox.
    if (processSpace(el) && key === KeyCode.SPACE) {
        return false;
    }
    // If this element is non-focusable, ignore stray keystrokes (b/18337209)
    // Sscreen readers can move without tab focus, so any tabIndex is focusable.
    // See B/21809604
    if (!isFocusable(el)) {
        return false;
    }
    const type = (el.getAttribute('role') ||
        el.type ||
        el.tagName).toUpperCase();
    const isSpecificTriggerKey = IDENTIFIER_TO_KEY_TRIGGER_MAPPING[type] % key === 0;
    const isDefaultTriggerKey = !(type in IDENTIFIER_TO_KEY_TRIGGER_MAPPING) && key === KeyCode.ENTER;
    const hasType = el.tagName.toUpperCase() !== 'INPUT' || !!el.type;
    return (isSpecificTriggerKey || isDefaultTriggerKey) && hasType;
}
/**
 * Checks whether a DOM element can receive keyboard focus.
 * This code is based on goog.dom.isFocusable, but simplified since we shouldn't
 * care about visibility if we're already handling a keyboard event.
 */
function isFocusable(el) {
    return ((el.tagName in NATIVELY_FOCUSABLE_ELEMENTS || hasSpecifiedTabIndex(el)) &&
        !el.disabled);
}
/**
 * @param element Element to check.
 * @return Whether the element has a specified tab index.
 */
function hasSpecifiedTabIndex(element) {
    // IE returns 0 for an unset tabIndex, so we must use getAttributeNode(),
    // which returns an object with a 'specified' property if tabIndex is
    // specified.  This works on other browsers, too.
    const attrNode = element.getAttributeNode('tabindex'); // Must be lowercase!
    return attrNode != null && attrNode.specified;
}
/** Element tagnames that are focusable by default. */
const NATIVELY_FOCUSABLE_ELEMENTS = {
    'A': 1,
    'INPUT': 1,
    'TEXTAREA': 1,
    'SELECT': 1,
    'BUTTON': 1,
};
/** @return True, if the Space key was pressed. */
export function isSpaceKeyEvent(e) {
    const key = 
    // `which` is an old DOM API.
    // tslint:disable-next-line:no-any
    e.which ||
        // `keyCode` is an old DOM API.
        // tslint:disable-next-line:no-any
        e.keyCode;
    const el = getTarget(e);
    const elementName = (el.type || el.tagName).toUpperCase();
    return key === KeyCode.SPACE && elementName !== 'CHECKBOX';
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
export function isMouseSpecialEvent(e, type, element) {
    // `relatedTarget` is an old DOM API.
    // tslint:disable-next-line:no-any
    const related = e.relatedTarget;
    return (((e.type === EventType.MOUSEOVER && type === EventType.MOUSEENTER) ||
        (e.type === EventType.MOUSEOUT && type === EventType.MOUSELEAVE) ||
        (e.type === EventType.POINTEROVER && type === EventType.POINTERENTER) ||
        (e.type === EventType.POINTEROUT && type === EventType.POINTERLEAVE)) &&
        (!related || (related !== element && !dom.contains(element, related))));
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
export function createMouseSpecialEvent(e, target) {
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
    // tslint:disable-next-line:no-any
    const copy = {};
    for (const property in e) {
        if (property === 'srcElement' || property === 'target') {
            continue;
        }
        const key = property;
        // Making a copy requires iterating through all properties of `Event`.
        // tslint:disable-next-line:no-dict-access-on-struct-type
        const value = e[key];
        if (typeof value === 'function') {
            continue;
        }
        // Value should be the expected type, but the value of `key` is not known
        // statically.
        // tslint:disable-next-line:no-any
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
    return copy;
}
/**
 * Returns touch data extracted from the touch event: clientX, clientY, screenX
 * and screenY. If the event has no touch information at all, the returned
 * value is null.
 *
 * The fields of this Object are unquoted.
 *
 * @param event A touch event.
 */
export function getTouchData(event) {
    const touch = (event.changedTouches && event.changedTouches[0]) || (event.touches && event.touches[0]);
    if (!touch) {
        return null;
    }
    return {
        clientX: touch.clientX,
        clientY: touch.clientY,
        screenX: touch.screenX,
        screenY: touch.screenY,
    };
}
/**
 * Creates a new EventLike object for a "click" event that's derived from the
 * original corresponding "touchend" event for a fast-click implementation.
 *
 * It takes a touch event, adds common fields found in a click event and
 * changes the type to 'click', so that the resulting event looks more like
 * a real click event.
 *
 * @param event A touch event.
 * @return A modified event-like object copied from the event object passed into
 *     this function.
 */
export function recreateTouchEventAsClick(event) {
    const click = {};
    click['originalEventType'] = event.type;
    click['type'] = EventType.CLICK;
    for (const property in event) {
        if (property === 'type' || property === 'srcElement') {
            continue;
        }
        const key = property;
        // Making a copy requires iterating through all properties of `TouchEvent`.
        // tslint:disable-next-line:no-dict-access-on-struct-type
        const value = event[key];
        if (typeof value === 'function') {
            continue;
        }
        // Value should be the expected type, but the value of `key` is not known
        // statically.
        // tslint:disable-next-line:no-any
        click[key] = value;
    }
    // Ensure that the event has the most recent timestamp. This timestamp
    // may be used in the future to validate or cancel subsequent click events.
    click['timeStamp'] = Date.now();
    // Emulate preventDefault and stopPropagation behavior
    click['defaultPrevented'] = false;
    click['preventDefault'] = syntheticPreventDefault;
    click['_propagationStopped'] = false;
    click['stopPropagation'] = syntheticStopPropagation;
    // Emulate click coordinates using touch info
    const touch = getTouchData(event);
    if (touch) {
        click['clientX'] = touch.clientX;
        click['clientY'] = touch.clientY;
        click['screenX'] = touch.screenX;
        click['screenY'] = touch.screenY;
    }
    return click;
}
/**
 * An implementation of "preventDefault" for a synthesized event. Simply
 * sets "defaultPrevented" property to true.
 */
function syntheticPreventDefault() {
    this.defaultPrevented = true;
}
/**
 * An implementation of "stopPropagation" for a synthesized event. It simply
 * sets a synthetic non-standard "_propagationStopped" property to true.
 */
function syntheticStopPropagation() {
    this._propagationStopped = true;
}
/**
 * Mapping of KeyboardEvent.key values to
 * KeyCode values.
 */
const ACTION_KEY_TO_KEYCODE = {
    'Enter': KeyCode.ENTER,
    ' ': KeyCode.SPACE,
};
/**
 * Mapping of HTML element identifiers (ARIA role, type, or tagName) to the
 * keys (enter and/or space) that should activate them. A value of zero means
 * that both should activate them.
 */
export const IDENTIFIER_TO_KEY_TRIGGER_MAPPING = {
    'A': KeyCode.ENTER,
    'BUTTON': 0,
    'CHECKBOX': KeyCode.SPACE,
    'COMBOBOX': KeyCode.ENTER,
    'FILE': 0,
    'GRIDCELL': KeyCode.ENTER,
    'LINK': KeyCode.ENTER,
    'LISTBOX': KeyCode.ENTER,
    'MENU': 0,
    'MENUBAR': 0,
    'MENUITEM': 0,
    'MENUITEMCHECKBOX': 0,
    'MENUITEMRADIO': 0,
    'OPTION': 0,
    'RADIO': KeyCode.SPACE,
    'RADIOGROUP': KeyCode.SPACE,
    'RESET': 0,
    'SUBMIT': 0,
    'SWITCH': KeyCode.SPACE,
    'TAB': 0,
    'TREE': KeyCode.ENTER,
    'TREEITEM': KeyCode.ENTER,
};
/**
 * Returns whether or not to process space based on the type of the element;
 * checks to make sure that type is not null.
 * @param element The element.
 * @return Whether or not to process space based on type.
 */
function processSpace(element) {
    const type = (element.getAttribute('type') || element.tagName).toUpperCase();
    return type in PROCESS_SPACE;
}
/**
 * Returns whether or not the given element is a text control.
 * @param el The element.
 * @return Whether or not the given element is a text control.
 */
function isTextControl(el) {
    const type = (el.getAttribute('type') || el.tagName).toUpperCase();
    return type in TEXT_CONTROLS;
}
/**
 * Returns if the given element is a native HTML control.
 * @param el The element.
 * @return If the given element is a native HTML control.
 */
export function isNativeHTMLControl(el) {
    return el.tagName.toUpperCase() in NATIVE_HTML_CONTROLS;
}
/**
 * Returns if the given element is natively activatable. Browsers emit click
 * events for natively activatable elements, even when activated via keyboard.
 * For these elements, we don't need to raise a11y click events.
 * @param el The element.
 * @return If the given element is a native HTML control.
 */
function isNativelyActivatable(el) {
    return (el.tagName.toUpperCase() === 'BUTTON' ||
        (!!el.type && el.type.toUpperCase() === 'FILE'));
}
/**
 * HTML <input> types (not ARIA roles) which will auto-trigger a click event for
 * the Space key, with side-effects. We will not call preventDefault if space is
 * pressed, nor will we raise a11y click events.  For all other elements, we can
 * suppress the default event (which has no desired side-effects) and handle the
 * keydown ourselves.
 */
const PROCESS_SPACE = {
    'CHECKBOX': true,
    'FILE': true,
    'OPTION': true,
    'RADIO': true,
};
/** TagNames and Input types for which to not process enter/space as click. */
const TEXT_CONTROLS = {
    'COLOR': true,
    'DATE': true,
    'DATETIME': true,
    'DATETIME-LOCAL': true,
    'EMAIL': true,
    'MONTH': true,
    'NUMBER': true,
    'PASSWORD': true,
    'RANGE': true,
    'SEARCH': true,
    'TEL': true,
    'TEXT': true,
    'TEXTAREA': true,
    'TIME': true,
    'URL': true,
    'WEEK': true,
};
/** TagNames that are native HTML controls. */
const NATIVE_HTML_CONTROLS = {
    'A': true,
    'AREA': true,
    'BUTTON': true,
    'DIALOG': true,
    'IMG': true,
    'INPUT': true,
    'LINK': true,
    'MENU': true,
    'OPTGROUP': true,
    'OPTION': true,
    'PROGRESS': true,
    'SELECT': true,
    'TEXTAREA': true,
};
/** Exported for testing. */
export const testing = {
    setIsMac(value) {
        isMac = value;
    },
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXZlbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3ByaW1pdGl2ZXMvZXZlbnQtZGlzcGF0Y2gvc3JjL2V2ZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sS0FBSyxHQUFHLE1BQU0sT0FBTyxDQUFDO0FBRTdCLE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxjQUFjLENBQUM7QUFDdkMsT0FBTyxFQUFDLE9BQU8sRUFBQyxNQUFNLFlBQVksQ0FBQztBQUVuQzs7R0FFRztBQUNILE1BQU0sVUFBVSxtQkFBbUIsQ0FBQyxTQUFpQjtJQUNuRCx5RUFBeUU7SUFDekUsMkVBQTJFO0lBQzNFLHlFQUF5RTtJQUN6RSxxRUFBcUU7SUFDckUsdURBQXVEO0lBQ3ZELElBQUksU0FBUyxLQUFLLFNBQVMsQ0FBQyxVQUFVLEVBQUUsQ0FBQztRQUN2QyxPQUFPLFNBQVMsQ0FBQyxTQUFTLENBQUM7SUFDN0IsQ0FBQztTQUFNLElBQUksU0FBUyxLQUFLLFNBQVMsQ0FBQyxVQUFVLEVBQUUsQ0FBQztRQUM5QyxPQUFPLFNBQVMsQ0FBQyxRQUFRLENBQUM7SUFDNUIsQ0FBQztTQUFNLElBQUksU0FBUyxLQUFLLFNBQVMsQ0FBQyxZQUFZLEVBQUUsQ0FBQztRQUNoRCxPQUFPLFNBQVMsQ0FBQyxXQUFXLENBQUM7SUFDL0IsQ0FBQztTQUFNLElBQUksU0FBUyxLQUFLLFNBQVMsQ0FBQyxZQUFZLEVBQUUsQ0FBQztRQUNoRCxPQUFPLFNBQVMsQ0FBQyxVQUFVLENBQUM7SUFDOUIsQ0FBQztJQUNELE9BQU8sU0FBUyxDQUFDO0FBQ25CLENBQUM7QUFFRDs7Ozs7Ozs7R0FRRztBQUNILE1BQU0sVUFBVSxnQkFBZ0IsQ0FDOUIsT0FBZ0IsRUFDaEIsU0FBaUIsRUFDakIsT0FBK0I7SUFFL0Isb0RBQW9EO0lBQ3BELFNBQVM7SUFDVCxFQUFFO0lBQ0YsNEVB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ckQsR0FBRyxFQUFFLElBQUk7SUFDVCxNQUFNLEVBQUUsSUFBSTtJQUNaLFFBQVEsRUFBRSxJQUFJO0lBQ2QsUUFBUSxFQUFFLElBQUk7SUFDZCxLQUFLLEVBQUUsSUFBSTtJQUNYLE9BQU8sRUFBRSxJQUFJO0lBQ2IsTUFBTSxFQUFFLElBQUk7SUFDWixNQUFNLEVBQUUsSUFBSTtJQUNaLFVBQVUsRUFBRSxJQUFJO0lBQ2hCLFFBQVEsRUFBRSxJQUFJO0lBQ2QsVUFBVSxFQUFFLElBQUk7SUFDaEIsUUFBUSxFQUFFLElBQUk7SUFDZCxVQUFVLEVBQUUsSUFBSTtDQUNqQixDQUFDO0FBRUYsNEJBQTRCO0FBQzVCLE1BQU0sQ0FBQyxNQUFNLE9BQU8sR0FBRztJQUNyQixRQUFRLENBQUMsS0FBYztRQUNyQixLQUFLLEdBQUcsS0FBSyxDQUFDO0lBQ2hCLENBQUM7Q0FDRixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCAqIGFzIGRvbSBmcm9tICcuL2RvbSc7XG5pbXBvcnQge0V2ZW50SGFuZGxlckluZm99IGZyb20gJy4vZXZlbnRfaGFuZGxlcic7XG5pbXBvcnQge0V2ZW50VHlwZX0gZnJvbSAnLi9ldmVudF90eXBlJztcbmltcG9ydCB7S2V5Q29kZX0gZnJvbSAnLi9rZXlfY29kZSc7XG5cbi8qKlxuICogR2V0cyBhIGJyb3dzZXIgZXZlbnQgdHlwZSwgaWYgaXQgd291bGQgZGlmZmVyIGZyb20gdGhlIEpTQWN0aW9uIGV2ZW50IHR5cGUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRCcm93c2VyRXZlbnRUeXBlKGV2ZW50VHlwZTogc3RyaW5nKSB7XG4gIC8vIE1vdXNlZW50ZXIgYW5kIG1vdXNlbGVhdmUgZXZlbnRzIGFyZSBub3QgaGFuZGxlZCBkaXJlY3RseSBiZWNhdXNlIHRoZXlcbiAgLy8gYXJlIG5vdCBhdmFpbGFibGUgZXZlcnl3aGVyZS4gSW4gYnJvd3NlcnMgd2hlcmUgdGhleSBhcmUgYXZhaWxhYmxlLCB0aGV5XG4gIC8vIGRvbid0IGJ1YmJsZSBhbmQgYXJlbid0IHZpc2libGUgYXQgdGhlIGNvbnRhaW5lciBib3VuZGFyeS4gSW5zdGVhZCwgd2VcbiAgLy8gc3ludGhlc2l6ZSB0aGUgbW91c2VlbnRlciBhbmQgbW91c2VsZWF2ZSBldmVudHMgZnJvbSBtb3VzZW92ZXIgYW5kXG4gIC8vIG1vdXNlb3V0IGV2ZW50cywgcmVzcGVjdGl2ZWx5LiBDZi4gZXZlbnRjb250cmFjdC5qcy5cbiAgaWYgKGV2ZW50VHlwZSA9PT0gRXZlbnRUeXBlLk1PVVNFRU5URVIpIHtcbiAgICByZXR1cm4gRXZlbnRUeXBlLk1PVVNFT1ZFUjtcbiAgfSBlbHNlIGlmIChldmVudFR5cGUgPT09IEV2ZW50VHlwZS5NT1VTRUxFQVZFKSB7XG4gICAgcmV0dXJuIEV2ZW50VHlwZS5NT1VTRU9VVDtcbiAgfSBlbHNlIGlmIChldmVudFR5cGUgPT09IEV2ZW50VHlwZS5QT0lOVEVSRU5URVIpIHtcbiAgICByZXR1cm4gRXZlbnRUeXBlLlBPSU5URVJPVkVSO1xuICB9IGVsc2UgaWYgKGV2ZW50VHlwZSA9PT0gRXZlbnRUeXBlLlBPSU5URVJMRUFWRSkge1xuICAgIHJldHVybiBFdmVudFR5cGUuUE9JTlRFUk9VVDtcbiAgfVxuICByZXR1cm4gZXZlbnRUeXBlO1xufVxuXG4vKipcbiAqIFJlZ2lzdGVycyB0aGUgZXZlbnQgaGFuZGxlciBmdW5jdGlvbiB3aXRoIHRoZSBnaXZlbiBET00gZWxlbWVudCBmb3JcbiAqIHRoZSBnaXZlbiBldmVudCB0eXBlLlxuICpcbiAqIEBwYXJhbSBlbGVtZW50IFRoZSBlbGVtZW50LlxuICogQHBhcmFtIGV2ZW50VHlwZSBUaGUgZXZlbnQgdHlwZS5cbiAqIEBwYXJhbSBoYW5kbGVyIFRoZSBoYW5kbGVyIGZ1bmN0aW9uIHRvIGluc3RhbGwuXG4gKiBAcmV0dXJuIEluZm9ybWF0aW9uIG5lZWRlZCB0byB1bmluc3RhbGwgdGhlIGV2ZW50IGhhbmRsZXIgZXZlbnR1YWxseS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFkZEV2ZW50TGlzdGVuZXIoXG4gIGVsZW1lbnQ6IEVsZW1lbnQsXG4gIGV2ZW50VHlwZTogc3RyaW5nLFxuICBoYW5kbGVyOiAoZXZlbnQ6IEV2ZW50KSA9PiB2b2lkLFxuKTogRXZlbnRIYW5kbGVySW5mbyB7XG4gIC8vIEFsbCBldmVudCBoYW5kbGVycyBhcmUgcmVnaXN0ZXJlZCBpbiB0aGUgYnViYmxpbmdcbiAgLy8gcGhhc2UuXG4gIC8vXG4gIC8vIEFsbCBicm93c2VycyBzdXBwb3J0IGZvY3VzIGFuZCBibHVyLCBidXQgdGhlc2UgZXZlbnRzIG9ubHkgYXJlIHByb3BhZ2F0ZWRcbiAgLy8gaW4gdGhlIGNhcHR1cmUgcGhhc2UuIFZlcnkgbGVnYWN5IGJyb3dzZXJzIGRvIG5vdCBzdXBwb3J0IGZvY3VzaW4gb3JcbiAgLy8gZm9jdXNvdXQuXG4gIC8vXG4gIC8vIEl0IHdvdWxkIGJlIGEgYmFkIGlkZWEgdG8gcmVnaXN0ZXIgYWxsIGV2ZW50IGhhbmRsZXJzIGluIHRoZVxuICAvLyBjYXB0dXJlIHBoYXNlIGJlY2F1c2UgdGhlbiByZWd1bGFyIG9uY2xpY2sgaGFuZGxlcnMgd291bGQgbm90IGJlXG4gIC8vIGV4ZWN1dGVkIGF0IGFsbCBvbiBldmVudHMgdGhhdCB0cmlnZ2VyIGEganNhY3Rpb24uIFRoYXQncyBub3RcbiAgLy8gZW50aXJlbHkgd2hhdCB3ZSB3YW50LCBhdCBsZWFzdCBmb3Igbm93LlxuICAvL1xuICAvLyBFcnJvciBhbmQgbG9hZCBldmVudHMgKGkuZS4gb24gaW1hZ2VzKSBkbyBub3QgYnViYmxlIHNvIHRoZXkgYXJlIGFsc29cbiAgLy8gaGFuZGxlZCBpbiB0aGUgY2FwdHVyZSBwaGFzZS5cbiAgbGV0IGNhcHR1cmUgPSBmYWxzZTtcblxuICBpZiAoXG4gICAgZXZlbnRUeXBlID09PSBFdmVudFR5cGUuRk9DVVMgfHxcbiAgICBldmVudFR5cGUgPT09IEV2ZW50VHlwZS5CTFVSIHx8XG4gICAgZXZlbnRUeXBlID09PSBFdmVudFR5cGUuRVJST1IgfHxcbiAgICBldmVudFR5cGUgPT09IEV2ZW50VHlwZS5MT0FEIHx8XG4gICAgZXZlbnRUeXBlID09PSBFdmVudFR5cGUuVE9HR0xFXG4gICkge1xuICAgIGNhcHR1cmUgPSB0cnVlO1xuICB9XG4gIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihldmVudFR5cGUsIGhhbmRsZXIsIGNhcHR1cmUpO1xuXG4gIHJldHVybiB7ZXZlbnRUeXBlLCBoYW5kbGVyLCBjYXB0dXJlfTtcbn1cblxuLyoqXG4gKiBSZW1vdmVzIHRoZSBldmVudCBoYW5kbGVyIGZvciB0aGUgZ2l2ZW4gZXZlbnQgZnJvbSB0aGUgZWxlbWVudC5cbiAqIHRoZSBnaXZlbiBldmVudCB0eXBlLlxuICpcbiAqIEBwYXJhbSBlbGVtZW50IFRoZSBlbGVtZW50LlxuICogQHBhcmFtIGluZm8gVGhlIGluZm9ybWF0aW9uIG5lZWRlZCB0byBkZXJlZ2lzdGVyIHRoZSBoYW5kbGVyLCBhcyByZXR1cm5lZCBieVxuICogICAgIGFkZEV2ZW50TGlzdGVuZXIoKSwgYWJvdmUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZW1vdmVFdmVudExpc3RlbmVyKGVsZW1lbnQ6IEVsZW1lbnQsIGluZm86IEV2ZW50SGFuZGxlckluZm8pIHtcbiAgaWYgKGVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcikge1xuICAgIGVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihpbmZvLmV2ZW50VHlwZSwgaW5mby5oYW5kbGVyIGFzIEV2ZW50TGlzdGVuZXIsIGluZm8uY2FwdHVyZSk7XG4gICAgLy8gYGRldGFjaEV2ZW50YCBpcyBhbiBvbGQgRE9NIEFQSS5cbiAgICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6bm8tYW55XG4gIH0gZWxzZSBpZiAoKGVsZW1lbnQgYXMgYW55KS5kZXRhY2hFdmVudCkge1xuICAgIC8vIGBkZXRhY2hFdmVudGAgaXMgYW4gb2xkIERPTSBBUEkuXG4gICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOm5vLWFueVxuICAgIChlbGVtZW50IGFzIGFueSkuZGV0YWNoRXZlbnQoYG9uJHtpbmZvLmV2ZW50VHlwZX1gLCBpbmZvLmhhbmRsZXIpO1xuICB9XG59XG5cbi8qKlxuICogQ2FuY2VscyBwcm9wYWdhdGlvbiBvZiBhbiBldmVudC5cbiAqIEBwYXJhbSBlIFRoZSBldmVudCB0byBjYW5jZWwgcHJvcGFnYXRpb24gZm9yLlxuICovXG5leHBvcnQgZnVuY3Rpb24gc3RvcFByb3BhZ2F0aW9uKGU6IEV2ZW50KSB7XG4gIGUuc3RvcFByb3BhZ2F0aW9uID8gZS5zdG9wUHJvcGFnYXRpb24oKSA6IChlLmNhbmNlbEJ1YmJsZSA9IHRydWUpO1xufVxuXG4vKipcbiAqIFByZXZlbnRzIHRoZSBkZWZhdWx0IGFjdGlvbiBvZiBhbiBldmVudC5cbiAqIEBwYXJhbSBlIFRoZSBldmVudCB0byBwcmV2ZW50IHRoZSBkZWZhdWx0IGFjdGlvbiBmb3IuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwcmV2ZW50RGVmYXVsdChlOiBFdmVudCkge1xuICBlLnByZXZlbnREZWZhdWx0ID8gZS5wcmV2ZW50RGVmYXVsdCgpIDogKGUucmV0dXJuVmFsdWUgPSBmYWxzZSk7XG59XG5cbi8qKlxuICogR2V0cyB0aGUgdGFyZ2V0IEVsZW1lbnQgb2YgdGhlIGV2ZW50LiBJbiBGaXJlZm94LCBhIHRleHQgbm9kZSBtYXkgYXBwZWFyIGFzXG4gKiB0aGUgdGFyZ2V0IG9mIHRoZSBldmVudCwgaW4gd2hpY2ggY2FzZSB3ZSByZXR1cm4gdGhlIHBhcmVudCBlbGVtZW50IG9mIHRoZVxuICogdGV4dCBub2RlLlxuICogQHBhcmFtIGUgVGhlIGV2ZW50IHRvIGdldCB0aGUgdGFyZ2V0IG9mLlxuICogQHJldHVybiBUaGUgdGFyZ2V0IGVsZW1lbnQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRUYXJnZXQoZTogRXZlbnQpOiBFbGVtZW50IHtcbiAgbGV0IGVsID0gZS50YXJnZXQgYXMgRWxlbWVudDtcblxuICAvLyBJbiBGaXJlZm94LCB0aGUgZXZlbnQgbWF5IGhhdmUgYSB0ZXh0IG5vZGUgYXMgaXRzIHRhcmdldC4gV2UgYWx3YXlzXG4gIC8vIHdhbnQgdGhlIHBhcmVudCBFbGVtZW50IHRoZSB0ZXh0IG5vZGUgYmVsb25ncyB0bywgaG93ZXZlci5cbiAgaWYgKCFlbC5nZXRBdHRyaWJ1dGUgJiYgZWwucGFyZW50Tm9kZSkge1xuICAgIGVsID0gZWwucGFyZW50Tm9kZSBhcyBFbGVtZW50O1xuICB9XG5cbiAgcmV0dXJuIGVsO1xufVxuXG4vKipcbiAqIFdoZXRoZXIgd2UgYXJlIG9uIGEgTWFjLiBOb3QgcHVsbGluZyBpbiB1c2VyYWdlbnQganVzdCBmb3IgdGhpcy5cbiAqL1xubGV0IGlzTWFjOiBib29sZWFuID0gdHlwZW9mIG5hdmlnYXRvciAhPT0gJ3VuZGVmaW5lZCcgJiYgL01hY2ludG9zaC8udGVzdChuYXZpZ2F0b3IudXNlckFnZW50KTtcblxuLyoqXG4gKiBEZXRlcm1pbmVzIGFuZCByZXR1cm5zIHdoZXRoZXIgdGhlIGdpdmVuIGV2ZW50ICh3aGljaCBpcyBhc3N1bWVkIHRvIGJlIGFcbiAqIGNsaWNrIGV2ZW50KSBpcyBhIG1pZGRsZSBjbGljay5cbiAqIE5PVEU6IFRoZXJlIGlzIG5vdCBhIGNvbnNpc3RlbnQgd2F5IHRvIGlkZW50aWZ5IG1pZGRsZSBjbGlja1xuICogaHR0cDovL3d3dy51bml4cGFwYS5jb20vanMvbW91c2UuaHRtbFxuICovXG5mdW5jdGlvbiBpc01pZGRsZUNsaWNrKGU6IEV2ZW50KTogYm9vbGVhbiB7XG4gIHJldHVybiAoXG4gICAgLy8gYHdoaWNoYCBpcyBhbiBvbGQgRE9NIEFQSS5cbiAgICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6bm8tYW55XG4gICAgKGUgYXMgYW55KS53aGljaCA9PT0gMiB8fFxuICAgIC8vIGB3aGljaGAgaXMgYW4gb2xkIERPTSBBUEkuXG4gICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOm5vLWFueVxuICAgICgoZSBhcyBhbnkpLndoaWNoID09IG51bGwgJiZcbiAgICAgIC8vIGBidXR0b25gIGlzIGFuIG9sZCBET00gQVBJLlxuICAgICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOm5vLWFueVxuICAgICAgKGUgYXMgYW55KS5idXR0b24gPT09IDQpIC8vIG1pZGRsZSBjbGljayBmb3IgSUVcbiAgKTtcbn1cblxuLyoqXG4gKiBEZXRlcm1pbmVzIGFuZCByZXR1cm5zIHdoZXRoZXIgdGhlIGdpdmVuIGV2ZW50ICh3aGljaCBpcyBhc3N1bWVkXG4gKiB0byBiZSBhIGNsaWNrIGV2ZW50KSBpcyBtb2RpZmllZC4gQSBtaWRkbGUgY2xpY2sgaXMgY29uc2lkZXJlZCBhIG1vZGlmaWVkXG4gKiBjbGljayB0byByZXRhaW4gdGhlIGRlZmF1bHQgYnJvd3NlciBhY3Rpb24sIHdoaWNoIG9wZW5zIGEgbGluayBpbiBhIG5ldyB0YWIuXG4gKiBAcGFyYW0gZSBUaGUgZXZlbnQuXG4gKiBAcmV0dXJuIFdoZXRoZXIgdGhlIGdpdmVuIGV2ZW50IGlzIG1vZGlmaWVkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gaXNNb2RpZmllZENsaWNrRXZlbnQoZTogRXZlbnQpOiBib29sZWFuIHtcbiAgcmV0dXJuIChcbiAgICAvLyBgbWV0YUtleWAgaXMgYW4gb2xkIERPTSBBUEkuXG4gICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOm5vLWFueVxuICAgIChpc01hYyAmJiAoZSBhcyBhbnkpLm1ldGFLZXkpIHx8XG4gICAgLy8gYGN0cmxLZXlgIGlzIGFuIG9sZCBET00gQVBJLlxuICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTpuby1hbnlcbiAgICAoIWlzTWFjICYmIChlIGFzIGFueSkuY3RybEtleSkgfHxcbiAgICBpc01pZGRsZUNsaWNrKGUpIHx8XG4gICAgLy8gYHNoaWZ0S2V5YCBpcyBhbiBvbGQgRE9NIEFQSS5cbiAgICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6bm8tYW55XG4gICAgKGUgYXMgYW55KS5zaGlmdEtleVxuICApO1xufVxuXG4vKiogV2hldGhlciB3ZSBhcmUgb24gV2ViS2l0IChlLmcuLCBDaHJvbWUpLiAqL1xuZXhwb3J0IGNvbnN0IGlzV2ViS2l0OiBib29sZWFuID1cbiAgdHlwZW9mIG5hdmlnYXRvciAhPT0gJ3VuZGVmaW5lZCcgJiZcbiAgIS9PcGVyYS8udGVzdChuYXZpZ2F0b3IudXNlckFnZW50KSAmJlxuICAvV2ViS2l0Ly50ZXN0KG5hdmlnYXRvci51c2VyQWdlbnQpO1xuXG4vKiogV2hldGhlciB3ZSBhcmUgb24gSUUuICovXG5leHBvcnQgY29uc3QgaXNJZTogYm9vbGVhbiA9XG4gIHR5cGVvZiBuYXZpZ2F0b3IgIT09ICd1bmRlZmluZWQnICYmXG4gICgvTVNJRS8udGVzdChuYXZpZ2F0b3IudXNlckFnZW50KSB8fCAvVHJpZGVudC8udGVzdChuYXZpZ2F0b3IudXNlckFnZW50KSk7XG5cbi8qKiBXaGV0aGVyIHdlIGFyZSBvbiBHZWNrbyAoZS5nLiwgRmlyZWZveCkuICovXG5leHBvcnQgY29uc3QgaXNHZWNrbzogYm9vbGVhbiA9XG4gIHR5cGVvZiBuYXZpZ2F0b3IgIT09ICd1bmRlZmluZWQnICYmXG4gICEvT3BlcmF8V2ViS2l0Ly50ZXN0KG5hdmlnYXRvci51c2VyQWdlbnQpICYmXG4gIC9HZWNrby8udGVzdChuYXZpZ2F0b3IucHJvZHVjdCk7XG5cbi8qKlxuICogRGV0ZXJtaW5lcyBhbmQgcmV0dXJucyB3aGV0aGVyIHRoZSBnaXZlbiBlbGVtZW50IGlzIGEgdmFsaWQgdGFyZ2V0IGZvclxuICoga2V5cHJlc3Mva2V5ZG93biBET00gZXZlbnRzIHRoYXQgYWN0IGxpa2UgcmVndWxhciBET00gY2xpY2tzLlxuICogQHBhcmFtIGVsIFRoZSBlbGVtZW50LlxuICogQHJldHVybiBXaGV0aGVyIHRoZSBnaXZlbiBlbGVtZW50IGlzIGEgdmFsaWQgYWN0aW9uIGtleSB0YXJnZXQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc1ZhbGlkQWN0aW9uS2V5VGFyZ2V0KGVsOiBFbGVtZW50KTogYm9vbGVhbiB7XG4gIGlmICghKCdnZXRBdHRyaWJ1dGUnIGluIGVsKSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBpZiAoaXNUZXh0Q29udHJvbChlbCkpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgaWYgKGlzTmF0aXZlbHlBY3RpdmF0YWJsZShlbCkpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgLy8gYGlzQ29udGVudEVkaXRhYmxlYCBpcyBhbiBvbGQgRE9NIEFQSS5cbiAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOm5vLWFueVxuICBpZiAoKGVsIGFzIGFueSkuaXNDb250ZW50RWRpdGFibGUpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICByZXR1cm4gdHJ1ZTtcbn1cblxuLyoqXG4gKiBXaGV0aGVyIGFuIGV2ZW50IGhhcyBhIG1vZGlmaWVyIGtleSBhY3RpdmF0ZWQuXG4gKiBAcGFyYW0gZSBUaGUgZXZlbnQuXG4gKiBAcmV0dXJuIFRydWUsIGlmIGEgbW9kaWZpZXIga2V5IGlzIGFjdGl2YXRlZC5cbiAqL1xuZnVuY3Rpb24gaGFzTW9kaWZpZXJLZXkoZTogRXZlbnQpOiBib29sZWFuIHtcbiAgcmV0dXJuIChcbiAgICAvLyBgY3RybEtleWAgaXMgYW4gb2xkIERPTSBBUEkuXG4gICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOm5vLWFueVxuICAgIChlIGFzIGFueSkuY3RybEtleSB8fFxuICAgIC8vIGBzaGlmdEtleWAgaXMgYW4gb2xkIERPTSBBUEkuXG4gICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOm5vLWFueVxuICAgIChlIGFzIGFueSkuc2hpZnRLZXkgfHxcbiAgICAvLyBgYWx0S2V5YCBpcyBhbiBvbGQgRE9NIEFQSS5cbiAgICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6bm8tYW55XG4gICAgKGUgYXMgYW55KS5hbHRLZXkgfHxcbiAgICAvLyBgbWV0YUtleWAgaXMgYW4gb2xkIERPTSBBUEkuXG4gICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOm5vLWFueVxuICAgIChlIGFzIGFueSkubWV0YUtleVxuICApO1xufVxuXG4vKipcbiAqIERldGVybWluZXMgYW5kIHJldHVybnMgd2hldGhlciB0aGUgZ2l2ZW4gZXZlbnQgaGFzIGEgdGFyZ2V0IHRoYXQgYWxyZWFkeVxuICogaGFzIGV2ZW50IGhhbmRsZXJzIGF0dGFjaGVkIGJlY2F1c2UgaXQgaXMgYSBuYXRpdmUgSFRNTCBjb250cm9sLiBVc2VkIHRvXG4gKiBkZXRlcm1pbmUgaWYgcHJldmVudERlZmF1bHQgc2hvdWxkIGJlIGNhbGxlZCB3aGVuIGlzQWN0aW9uS2V5RXZlbnQgaXMgdHJ1ZS5cbiAqIEBwYXJhbSBlIFRoZSBldmVudC5cbiAqIEByZXR1cm4gSWYgcHJldmVudERlZmF1bHQgc2hvdWxkIGJlIGNhbGxlZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNob3VsZENhbGxQcmV2ZW50RGVmYXVsdE9uTmF0aXZlSHRtbENvbnRyb2woZTogRXZlbnQpOiBib29sZWFuIHtcbiAgY29uc3QgZWwgPSBnZXRUYXJnZXQoZSk7XG4gIGNvbnN0IHRhZ05hbWUgPSBlbC50YWdOYW1lLnRvVXBwZXJDYXNlKCk7XG4gIGNvbnN0IHJvbGUgPSAoZWwuZ2V0QXR0cmlidXRlKCdyb2xlJykgfHwgJycpLnRvVXBwZXJDYXNlKCk7XG5cbiAgaWYgKHRhZ05hbWUgPT09ICdCVVRUT04nIHx8IHJvbGUgPT09ICdCVVRUT04nKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgaWYgKCFpc05hdGl2ZUhUTUxDb250cm9sKGVsKSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBpZiAodGFnTmFtZSA9PT0gJ0EnKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIC8qKlxuICAgKiBGaXggZm9yIHBoeXNpY2FsIGQtcGFkcyBvbiBmZWF0dXJlIHBob25lIHBsYXRmb3JtczsgdGhlIG5hdGl2ZSBldmVudFxuICAgKiAoaWUuIGlzVHJ1c3RlZDogdHJ1ZSkgbmVlZHMgdG8gZmlyZSB0byBzaG93IHRoZSBPUFRJT04gbGlzdC4gU2VlXG4gICAqIGIvMTM1Mjg4NDY5IGZvciBtb3JlIGluZm8uXG4gICAqL1xuICBpZiAodGFnTmFtZSA9PT0gJ1NFTEVDVCcpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgaWYgKHByb2Nlc3NTcGFjZShlbCkpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgaWYgKGlzVGV4dENvbnRyb2woZWwpKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIHJldHVybiB0cnVlO1xufVxuXG4vKipcbiAqIERldGVybWluZXMgYW5kIHJldHVybnMgd2hldGhlciB0aGUgZ2l2ZW4gZXZlbnQgYWN0cyBsaWtlIGEgcmVndWxhciBET00gY2xpY2ssXG4gKiBhbmQgc2hvdWxkIGJlIGhhbmRsZWQgaW5zdGVhZCBvZiB0aGUgY2xpY2suICBJZiB0aGlzIHJldHVybnMgdHJ1ZSwgdGhlIGNhbGxlclxuICogd2lsbCBjYWxsIHByZXZlbnREZWZhdWx0KCkgdG8gcHJldmVudCBhIHBvc3NpYmxlIGR1cGxpY2F0ZSBldmVudC5cbiAqIFRoaXMgaXMgcmVwcmVzZW50ZWQgYnkgYSBrZXlwcmVzcyAoa2V5ZG93biBvbiBHZWNrbyBicm93c2Vycykgb24gRW50ZXIgb3JcbiAqIFNwYWNlIGtleS5cbiAqIEBwYXJhbSBlIFRoZSBldmVudC5cbiAqIEByZXR1cm4gVHJ1ZSwgaWYgdGhlIGV2ZW50IGVtdWxhdGVzIGEgRE9NIGNsaWNrLlxuICovXG5leHBvcnQgZnVuY3Rpb24gaXNBY3Rpb25LZXlFdmVudChlOiBFdmVudCk6IGJvb2xlYW4ge1xuICBsZXQga2V5ID1cbiAgICAvLyBgd2hpY2hgIGlzIGFuIG9sZCBET00gQVBJLlxuICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTpuby1hbnlcbiAgICAoZSBhcyBhbnkpLndoaWNoIHx8XG4gICAgLy8gYGtleUNvZGVgIGlzIGFuIG9sZCBET00gQVBJLlxuICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTpuby1hbnlcbiAgICAoZSBhcyBhbnkpLmtleUNvZGU7XG4gIGlmICgha2V5ICYmIChlIGFzIEtleWJvYXJkRXZlbnQpLmtleSkge1xuICAgIGtleSA9IEFDVElPTl9LRVlfVE9fS0VZQ09ERVsoZSBhcyBLZXlib2FyZEV2ZW50KS5rZXldO1xuICB9XG4gIGlmIChpc1dlYktpdCAmJiBrZXkgPT09IEtleUNvZGUuTUFDX0VOVEVSKSB7XG4gICAga2V5ID0gS2V5Q29kZS5FTlRFUjtcbiAgfVxuICBpZiAoa2V5ICE9PSBLZXlDb2RlLkVOVEVSICYmIGtleSAhPT0gS2V5Q29kZS5TUEFDRSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBjb25zdCBlbCA9IGdldFRhcmdldChlKTtcbiAgaWYgKGUudHlwZSAhPT0gRXZlbnRUeXBlLktFWURPV04gfHwgIWlzVmFsaWRBY3Rpb25LZXlUYXJnZXQoZWwpIHx8IGhhc01vZGlmaWVyS2V5KGUpKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgLy8gRm9yIDxpbnB1dCB0eXBlPVwiY2hlY2tib3hcIj4sIHdlIG11c3Qgb25seSBoYW5kbGUgdGhlIGJyb3dzZXIncyBuYXRpdmUgY2xpY2tcbiAgLy8gZXZlbnQsIHNvIHRoYXQgdGhlIGJyb3dzZXIgY2FuIHRvZ2dsZSB0aGUgY2hlY2tib3guXG4gIGlmIChwcm9jZXNzU3BhY2UoZWwpICYmIGtleSA9PT0gS2V5Q29kZS5TUEFDRSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIC8vIElmIHRoaXMgZWxlbWVudCBpcyBub24tZm9jdXNhYmxlLCBpZ25vcmUgc3RyYXkga2V5c3Ryb2tlcyAoYi8xODMzNzIwOSlcbiAgLy8gU3NjcmVlbiByZWFkZXJzIGNhbiBtb3ZlIHdpdGhvdXQgdGFiIGZvY3VzLCBzbyBhbnkgdGFiSW5kZXggaXMgZm9jdXNhYmxlLlxuICAvLyBTZWUgQi8yMTgwOTYwNFxuICBpZiAoIWlzRm9jdXNhYmxlKGVsKSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGNvbnN0IHR5cGUgPSAoXG4gICAgZWwuZ2V0QXR0cmlidXRlKCdyb2xlJykgfHxcbiAgICAoZWwgYXMgSFRNTElucHV0RWxlbWVudCkudHlwZSB8fFxuICAgIGVsLnRhZ05hbWVcbiAgKS50b1VwcGVyQ2FzZSgpO1xuICBjb25zdCBpc1NwZWNpZmljVHJpZ2dlcktleSA9IElERU5USUZJRVJfVE9fS0VZX1RSSUdHRVJfTUFQUElOR1t0eXBlXSAlIGtleSA9PT0gMDtcbiAgY29uc3QgaXNEZWZhdWx0VHJpZ2dlcktleSA9ICEodHlwZSBpbiBJREVOVElGSUVSX1RPX0tFWV9UUklHR0VSX01BUFBJTkcpICYmIGtleSA9PT0gS2V5Q29kZS5FTlRFUjtcbiAgY29uc3QgaGFzVHlwZSA9IGVsLnRhZ05hbWUudG9VcHBlckNhc2UoKSAhPT0gJ0lOUFVUJyB8fCAhIShlbCBhcyBIVE1MSW5wdXRFbGVtZW50KS50eXBlO1xuICByZXR1cm4gKGlzU3BlY2lmaWNUcmlnZ2VyS2V5IHx8IGlzRGVmYXVsdFRyaWdnZXJLZXkpICYmIGhhc1R5cGU7XG59XG5cbi8qKlxuICogQ2hlY2tzIHdoZXRoZXIgYSBET00gZWxlbWVudCBjYW4gcmVjZWl2ZSBrZXlib2FyZCBmb2N1cy5cbiAqIFRoaXMgY29kZSBpcyBiYXNlZCBvbiBnb29nLmRvbS5pc0ZvY3VzYWJsZSwgYnV0IHNpbXBsaWZpZWQgc2luY2Ugd2Ugc2hvdWxkbid0XG4gKiBjYXJlIGFib3V0IHZpc2liaWxpdHkgaWYgd2UncmUgYWxyZWFkeSBoYW5kbGluZyBhIGtleWJvYXJkIGV2ZW50LlxuICovXG5mdW5jdGlvbiBpc0ZvY3VzYWJsZShlbDogRWxlbWVudCk6IGJvb2xlYW4ge1xuICByZXR1cm4gKFxuICAgIChlbC50YWdOYW1lIGluIE5BVElWRUxZX0ZPQ1VTQUJMRV9FTEVNRU5UUyB8fCBoYXNTcGVjaWZpZWRUYWJJbmRleChlbCkpICYmXG4gICAgIShlbCBhcyBIVE1MSW5wdXRFbGVtZW50KS5kaXNhYmxlZFxuICApO1xufVxuXG4vKipcbiAqIEBwYXJhbSBlbGVtZW50IEVsZW1lbnQgdG8gY2hlY2suXG4gKiBAcmV0dXJuIFdoZXRoZXIgdGhlIGVsZW1lbnQgaGFzIGEgc3BlY2lmaWVkIHRhYiBpbmRleC5cbiAqL1xuZnVuY3Rpb24gaGFzU3BlY2lmaWVkVGFiSW5kZXgoZWxlbWVudDogRWxlbWVudCk6IGJvb2xlYW4ge1xuICAvLyBJRSByZXR1cm5zIDAgZm9yIGFuIHVuc2V0IHRhYkluZGV4LCBzbyB3ZSBtdXN0IHVzZSBnZXRBdHRyaWJ1dGVOb2RlKCksXG4gIC8vIHdoaWNoIHJldHVybnMgYW4gb2JqZWN0IHdpdGggYSAnc3BlY2lmaWVkJyBwcm9wZXJ0eSBpZiB0YWJJbmRleCBpc1xuICAvLyBzcGVjaWZpZWQuICBUaGlzIHdvcmtzIG9uIG90aGVyIGJyb3dzZXJzLCB0b28uXG4gIGNvbnN0IGF0dHJOb2RlID0gZWxlbWVudC5nZXRBdHRyaWJ1dGVOb2RlKCd0YWJpbmRleCcpOyAvLyBNdXN0IGJlIGxvd2VyY2FzZSFcbiAgcmV0dXJuIGF0dHJOb2RlICE9IG51bGwgJiYgYXR0ck5vZGUuc3BlY2lmaWVkO1xufVxuXG4vKiogRWxlbWVudCB0YWduYW1lcyB0aGF0IGFyZSBmb2N1c2FibGUgYnkgZGVmYXVsdC4gKi9cbmNvbnN0IE5BVElWRUxZX0ZPQ1VTQUJMRV9FTEVNRU5UUzoge1trZXk6IHN0cmluZ106IG51bWJlcn0gPSB7XG4gICdBJzogMSxcbiAgJ0lOUFVUJzogMSxcbiAgJ1RFWFRBUkVBJzogMSxcbiAgJ1NFTEVDVCc6IDEsXG4gICdCVVRUT04nOiAxLFxufTtcblxuLyoqIEByZXR1cm4gVHJ1ZSwgaWYgdGhlIFNwYWNlIGtleSB3YXMgcHJlc3NlZC4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc1NwYWNlS2V5RXZlbnQoZTogRXZlbnQpOiBib29sZWFuIHtcbiAgY29uc3Qga2V5ID1cbiAgICAvLyBgd2hpY2hgIGlzIGFuIG9sZCBET00gQVBJLlxuICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTpuby1hbnlcbiAgICAoZSBhcyBhbnkpLndoaWNoIHx8XG4gICAgLy8gYGtleUNvZGVgIGlzIGFuIG9sZCBET00gQVBJLlxuICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTpuby1hbnlcbiAgICAoZSBhcyBhbnkpLmtleUNvZGU7XG4gIGNvbnN0IGVsID0gZ2V0VGFyZ2V0KGUpO1xuICBjb25zdCBlbGVtZW50TmFtZSA9ICgoZWwgYXMgSFRNTElucHV0RWxlbWVudCkudHlwZSB8fCBlbC50YWdOYW1lKS50b1VwcGVyQ2FzZSgpO1xuICByZXR1cm4ga2V5ID09PSBLZXlDb2RlLlNQQUNFICYmIGVsZW1lbnROYW1lICE9PSAnQ0hFQ0tCT1gnO1xufVxuXG4vKipcbiAqIERldGVybWluZXMgd2hldGhlciB0aGUgZXZlbnQgY29ycmVzcG9uZHMgdG8gYSBub24tYnViYmxpbmcgbW91c2VcbiAqIGV2ZW50IHR5cGUgKG1vdXNlZW50ZXIsIG1vdXNlbGVhdmUsIHBvaW50ZXJlbnRlciwgYW5kIHBvaW50ZXJsZWF2ZSkuXG4gKlxuICogRHVyaW5nIG1vdXNlb3ZlciAobW91c2VlbnRlcikgYW5kIHBvaW50ZXJvdmVyIChwb2ludGVyZW50ZXIpLCB0aGVcbiAqIHJlbGF0ZWRUYXJnZXQgaXMgdGhlIGVsZW1lbnQgYmVpbmcgZW50ZXJlZCBmcm9tLiBEdXJpbmcgbW91c2VvdXQgKG1vdXNlbGVhdmUpXG4gKiBhbmQgcG9pbnRlcm91dCAocG9pbnRlcmxlYXZlKSwgdGhlIHJlbGF0ZWRUYXJnZXQgaXMgdGhlIGVsZW1lbnQgYmVpbmcgZXhpdGVkXG4gKiB0by5cbiAqXG4gKiBJbiBib3RoIGNhc2VzLCBpZiByZWxhdGVkVGFyZ2V0IGlzIG91dHNpZGUgdGFyZ2V0LCB0aGVuIHRoZSBjb3JyZXNwb25kaW5nXG4gKiBzcGVjaWFsIGV2ZW50IGhhcyBvY2N1cnJlZCwgb3RoZXJ3aXNlIGl0IGhhc24ndC5cbiAqXG4gKiBAcGFyYW0gZSBUaGUgbW91c2VvdmVyL21vdXNlb3V0IGV2ZW50LlxuICogQHBhcmFtIHR5cGUgVGhlIHR5cGUgb2YgdGhlIG1vdXNlIHNwZWNpYWwgZXZlbnQuXG4gKiBAcGFyYW0gZWxlbWVudCBUaGUgZWxlbWVudCBvbiB3aGljaCB0aGUganNhY3Rpb24gZm9yIHRoZVxuICogICAgIG1vdXNlZW50ZXIvbW91c2VsZWF2ZSBldmVudCBpcyBkZWZpbmVkLlxuICogQHJldHVybiBUcnVlIGlmIHRoZSBldmVudCBpcyBhIG1vdXNlZW50ZXIvbW91c2VsZWF2ZSBldmVudC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzTW91c2VTcGVjaWFsRXZlbnQoZTogRXZlbnQsIHR5cGU6IHN0cmluZywgZWxlbWVudDogRWxlbWVudCk6IGJvb2xlYW4ge1xuICAvLyBgcmVsYXRlZFRhcmdldGAgaXMgYW4gb2xkIERPTSBBUEkuXG4gIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTpuby1hbnlcbiAgY29uc3QgcmVsYXRlZCA9IChlIGFzIGFueSkucmVsYXRlZFRhcmdldCBhcyBOb2RlO1xuXG4gIHJldHVybiAoXG4gICAgKChlLnR5cGUgPT09IEV2ZW50VHlwZS5NT1VTRU9WRVIgJiYgdHlwZSA9PT0gRXZlbnRUeXBlLk1PVVNFRU5URVIpIHx8XG4gICAgICAoZS50eXBlID09PSBFdmVudFR5cGUuTU9VU0VPVVQgJiYgdHlwZSA9PT0gRXZlbnRUeXBlLk1PVVNFTEVBVkUpIHx8XG4gICAgICAoZS50eXBlID09PSBFdmVudFR5cGUuUE9JTlRFUk9WRVIgJiYgdHlwZSA9PT0gRXZlbnRUeXBlLlBPSU5URVJFTlRFUikgfHxcbiAgICAgIChlLnR5cGUgPT09IEV2ZW50VHlwZS5QT0lOVEVST1VUICYmIHR5cGUgPT09IEV2ZW50VHlwZS5QT0lOVEVSTEVBVkUpKSAmJlxuICAgICghcmVsYXRlZCB8fCAocmVsYXRlZCAhPT0gZWxlbWVudCAmJiAhZG9tLmNvbnRhaW5zKGVsZW1lbnQsIHJlbGF0ZWQpKSlcbiAgKTtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgbmV3IEV2ZW50TGlrZSBvYmplY3QgZm9yIGEgbW91c2VlbnRlci9tb3VzZWxlYXZlIGV2ZW50IHRoYXQnc1xuICogZGVyaXZlZCBmcm9tIHRoZSBvcmlnaW5hbCBjb3JyZXNwb25kaW5nIG1vdXNlb3Zlci9tb3VzZW91dCBldmVudC5cbiAqIEBwYXJhbSBlIFRoZSBldmVudC5cbiAqIEBwYXJhbSB0YXJnZXQgVGhlIGVsZW1lbnQgb24gd2hpY2ggdGhlIGpzYWN0aW9uIGZvciB0aGUgbW91c2VlbnRlci9tb3VzZWxlYXZlXG4gKiAgICAgZXZlbnQgaXMgZGVmaW5lZC5cbiAqIEByZXR1cm4gQSBtb2RpZmllZCBldmVudC1saWtlIG9iamVjdCBjb3BpZWQgZnJvbSB0aGUgZXZlbnQgb2JqZWN0IHBhc3NlZCBpbnRvXG4gKiAgICAgdGhpcyBmdW5jdGlvbi5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZU1vdXNlU3BlY2lhbEV2ZW50KGU6IEV2ZW50LCB0YXJnZXQ6IEVsZW1lbnQpOiBFdmVudCB7XG4gIC8vIFdlIGhhdmUgdG8gY3JlYXRlIGEgY29weSBvZiB0aGUgZXZlbnQgb2JqZWN0IGJlY2F1c2Ugd2UgbmVlZCB0byBtdXRhdGVcbiAgLy8gaXRzIGZpZWxkcy4gV2UgZG8gdGhpcyBmb3IgdGhlIHNwZWNpYWwgbW91c2UgZXZlbnRzIGJlY2F1c2UgdGhlIGV2ZW50XG4gIC8vIHRhcmdldCBuZWVkcyB0byBiZSByZXRhcmdldGVkIHRvIHRoZSBhY3Rpb24gZWxlbWVudCByYXRoZXIgdGhhbiB0aGUgcmVhbFxuICAvLyBlbGVtZW50IChzaW5jZSB3ZSBhcmUgc2ltdWxhdGluZyB0aGUgc3BlY2lhbCBtb3VzZSBldmVudHMgd2l0aCBtb3VzZW92ZXIvXG4gIC8vIG1vdXNlb3V0KS5cbiAgLy9cbiAgLy8gU2luY2Ugd2UncmUgbWFraW5nIGEgY29weSBhbnl3YXlzLCB3ZSBtaWdodCBhcyB3ZWxsIGF0dGVtcHQgdG8gY29udmVydFxuICAvLyB0aGlzIGV2ZW50IGludG8gYSBwc2V1ZG8tcmVhbCBtb3VzZWVudGVyL21vdXNlbGVhdmUgZXZlbnQgYnkgYWRqdXN0aW5nXG4gIC8vIGl0cyB0eXBlLlxuICAvL1xuICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6bm8tYW55XG4gIGNvbnN0IGNvcHk6IHstcmVhZG9ubHkgW1AgaW4ga2V5b2YgRXZlbnRdPzogRXZlbnRbUF19ID0ge307XG4gIGZvciAoY29uc3QgcHJvcGVydHkgaW4gZSkge1xuICAgIGlmIChwcm9wZXJ0eSA9PT0gJ3NyY0VsZW1lbnQnIHx8IHByb3BlcnR5ID09PSAndGFyZ2V0Jykge1xuICAgICAgY29udGludWU7XG4gICAgfVxuICAgIGNvbnN0IGtleSA9IHByb3BlcnR5IGFzIGtleW9mIEV2ZW50O1xuICAgIC8vIE1ha2luZyBhIGNvcHkgcmVxdWlyZXMgaXRlcmF0aW5nIHRocm91Z2ggYWxsIHByb3BlcnRpZXMgb2YgYEV2ZW50YC5cbiAgICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6bm8tZGljdC1hY2Nlc3Mtb24tc3RydWN0LXR5cGVcbiAgICBjb25zdCB2YWx1ZSA9IGVba2V5XTtcbiAgICBpZiAodHlwZW9mIHZhbHVlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgLy8gVmFsdWUgc2hvdWxkIGJlIHRoZSBleHBlY3RlZCB0eXBlLCBidXQgdGhlIHZhbHVlIG9mIGBrZXlgIGlzIG5vdCBrbm93blxuICAgIC8vIHN0YXRpY2FsbHkuXG4gICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOm5vLWFueVxuICAgIGNvcHlba2V5XSA9IHZhbHVlIGFzIGFueTtcbiAgfVxuICBpZiAoZS50eXBlID09PSBFdmVudFR5cGUuTU9VU0VPVkVSKSB7XG4gICAgY29weVsndHlwZSddID0gRXZlbnRUeXBlLk1PVVNFRU5URVI7XG4gIH0gZWxzZSBpZiAoZS50eXBlID09PSBFdmVudFR5cGUuTU9VU0VPVVQpIHtcbiAgICBjb3B5Wyd0eXBlJ10gPSBFdmVudFR5cGUuTU9VU0VMRUFWRTtcbiAgfSBlbHNlIGlmIChlLnR5cGUgPT09IEV2ZW50VHlwZS5QT0lOVEVST1ZFUikge1xuICAgIGNvcHlbJ3R5cGUnXSA9IEV2ZW50VHlwZS5QT0lOVEVSRU5URVI7XG4gIH0gZWxzZSB7XG4gICAgY29weVsndHlwZSddID0gRXZlbnRUeXBlLlBPSU5URVJMRUFWRTtcbiAgfVxuICBjb3B5Wyd0YXJnZXQnXSA9IGNvcHlbJ3NyY0VsZW1lbnQnXSA9IHRhcmdldDtcbiAgY29weVsnYnViYmxlcyddID0gZmFsc2U7XG4gIHJldHVybiBjb3B5IGFzIEV2ZW50O1xufVxuXG4vKipcbiAqIFJldHVybnMgdG91Y2ggZGF0YSBleHRyYWN0ZWQgZnJvbSB0aGUgdG91Y2ggZXZlbnQ6IGNsaWVudFgsIGNsaWVudFksIHNjcmVlblhcbiAqIGFuZCBzY3JlZW5ZLiBJZiB0aGUgZXZlbnQgaGFzIG5vIHRvdWNoIGluZm9ybWF0aW9uIGF0IGFsbCwgdGhlIHJldHVybmVkXG4gKiB2YWx1ZSBpcyBudWxsLlxuICpcbiAqIFRoZSBmaWVsZHMgb2YgdGhpcyBPYmplY3QgYXJlIHVucXVvdGVkLlxuICpcbiAqIEBwYXJhbSBldmVudCBBIHRvdWNoIGV2ZW50LlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0VG91Y2hEYXRhKFxuICBldmVudDogVG91Y2hFdmVudCxcbik6IHtjbGllbnRYOiBudW1iZXI7IGNsaWVudFk6IG51bWJlcjsgc2NyZWVuWDogbnVtYmVyOyBzY3JlZW5ZOiBudW1iZXJ9IHwgbnVsbCB7XG4gIGNvbnN0IHRvdWNoID1cbiAgICAoZXZlbnQuY2hhbmdlZFRvdWNoZXMgJiYgZXZlbnQuY2hhbmdlZFRvdWNoZXNbMF0pIHx8IChldmVudC50b3VjaGVzICYmIGV2ZW50LnRvdWNoZXNbMF0pO1xuICBpZiAoIXRvdWNoKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbiAgcmV0dXJuIHtcbiAgICBjbGllbnRYOiB0b3VjaC5jbGllbnRYLFxuICAgIGNsaWVudFk6IHRvdWNoLmNsaWVudFksXG4gICAgc2NyZWVuWDogdG91Y2guc2NyZWVuWCxcbiAgICBzY3JlZW5ZOiB0b3VjaC5zY3JlZW5ZLFxuICB9O1xufVxuXG5kZWNsYXJlIGludGVyZmFjZSBTeW50aGV0aWNNb3VzZUV2ZW50IGV4dGVuZHMgRXZlbnQge1xuICAvLyBSZWRlY2xhcmVkIGZyb20gRXZlbnQgdG8gaW5kaWNhdGUgdGhhdCBpdCBpcyBub3QgcmVhZG9ubHkuXG4gIGRlZmF1bHRQcmV2ZW50ZWQ6IGJvb2xlYW47XG4gIG9yaWdpbmFsRXZlbnRUeXBlOiBzdHJpbmc7XG4gIF9wcm9wYWdhdGlvblN0b3BwZWQ/OiBib29sZWFuO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBuZXcgRXZlbnRMaWtlIG9iamVjdCBmb3IgYSBcImNsaWNrXCIgZXZlbnQgdGhhdCdzIGRlcml2ZWQgZnJvbSB0aGVcbiAqIG9yaWdpbmFsIGNvcnJlc3BvbmRpbmcgXCJ0b3VjaGVuZFwiIGV2ZW50IGZvciBhIGZhc3QtY2xpY2sgaW1wbGVtZW50YXRpb24uXG4gKlxuICogSXQgdGFrZXMgYSB0b3VjaCBldmVudCwgYWRkcyBjb21tb24gZmllbGRzIGZvdW5kIGluIGEgY2xpY2sgZXZlbnQgYW5kXG4gKiBjaGFuZ2VzIHRoZSB0eXBlIHRvICdjbGljaycsIHNvIHRoYXQgdGhlIHJlc3VsdGluZyBldmVudCBsb29rcyBtb3JlIGxpa2VcbiAqIGEgcmVhbCBjbGljayBldmVudC5cbiAqXG4gKiBAcGFyYW0gZXZlbnQgQSB0b3VjaCBldmVudC5cbiAqIEByZXR1cm4gQSBtb2RpZmllZCBldmVudC1saWtlIG9iamVjdCBjb3BpZWQgZnJvbSB0aGUgZXZlbnQgb2JqZWN0IHBhc3NlZCBpbnRvXG4gKiAgICAgdGhpcyBmdW5jdGlvbi5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlY3JlYXRlVG91Y2hFdmVudEFzQ2xpY2soZXZlbnQ6IFRvdWNoRXZlbnQpOiBNb3VzZUV2ZW50IHtcbiAgY29uc3QgY2xpY2s6IHstcmVhZG9ubHkgW1AgaW4ga2V5b2YgTW91c2VFdmVudF0/OiBNb3VzZUV2ZW50W1BdfSAmIFBhcnRpYWw8U3ludGhldGljTW91c2VFdmVudD4gPVxuICAgIHt9O1xuICBjbGlja1snb3JpZ2luYWxFdmVudFR5cGUnXSA9IGV2ZW50LnR5cGU7XG4gIGNsaWNrWyd0eXBlJ10gPSBFdmVudFR5cGUuQ0xJQ0s7XG4gIGZvciAoY29uc3QgcHJvcGVydHkgaW4gZXZlbnQpIHtcbiAgICBpZiAocHJvcGVydHkgPT09ICd0eXBlJyB8fCBwcm9wZXJ0eSA9PT0gJ3NyY0VsZW1lbnQnKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgY29uc3Qga2V5ID0gcHJvcGVydHkgYXMga2V5b2YgVG91Y2hFdmVudDtcbiAgICAvLyBNYWtpbmcgYSBjb3B5IHJlcXVpcmVzIGl0ZXJhdGluZyB0aHJvdWdoIGFsbCBwcm9wZXJ0aWVzIG9mIGBUb3VjaEV2ZW50YC5cbiAgICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6bm8tZGljdC1hY2Nlc3Mtb24tc3RydWN0LXR5cGVcbiAgICBjb25zdCB2YWx1ZSA9IGV2ZW50W2tleV07XG4gICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgY29udGludWU7XG4gICAgfVxuICAgIC8vIFZhbHVlIHNob3VsZCBiZSB0aGUgZXhwZWN0ZWQgdHlwZSwgYnV0IHRoZSB2YWx1ZSBvZiBga2V5YCBpcyBub3Qga25vd25cbiAgICAvLyBzdGF0aWNhbGx5LlxuICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTpuby1hbnlcbiAgICBjbGlja1trZXkgYXMga2V5b2YgTW91c2VFdmVudF0gPSB2YWx1ZSBhcyBhbnk7XG4gIH1cblxuICAvLyBFbnN1cmUgdGhhdCB0aGUgZXZlbnQgaGFzIHRoZSBtb3N0IHJlY2VudCB0aW1lc3RhbXAuIFRoaXMgdGltZXN0YW1wXG4gIC8vIG1heSBiZSB1c2VkIGluIHRoZSBmdXR1cmUgdG8gdmFsaWRhdGUgb3IgY2FuY2VsIHN1YnNlcXVlbnQgY2xpY2sgZXZlbnRzLlxuICBjbGlja1sndGltZVN0YW1wJ10gPSBEYXRlLm5vdygpO1xuXG4gIC8vIEVtdWxhdGUgcHJldmVudERlZmF1bHQgYW5kIHN0b3BQcm9wYWdhdGlvbiBiZWhhdmlvclxuICBjbGlja1snZGVmYXVsdFByZXZlbnRlZCddID0gZmFsc2U7XG4gIGNsaWNrWydwcmV2ZW50RGVmYXVsdCddID0gc3ludGhldGljUHJldmVudERlZmF1bHQ7XG4gIGNsaWNrWydfcHJvcGFnYXRpb25TdG9wcGVkJ10gPSBmYWxzZTtcbiAgY2xpY2tbJ3N0b3BQcm9wYWdhdGlvbiddID0gc3ludGhldGljU3RvcFByb3BhZ2F0aW9uO1xuXG4gIC8vIEVtdWxhdGUgY2xpY2sgY29vcmRpbmF0ZXMgdXNpbmcgdG91Y2ggaW5mb1xuICBjb25zdCB0b3VjaCA9IGdldFRvdWNoRGF0YShldmVudCk7XG4gIGlmICh0b3VjaCkge1xuICAgIGNsaWNrWydjbGllbnRYJ10gPSB0b3VjaC5jbGllbnRYO1xuICAgIGNsaWNrWydjbGllbnRZJ10gPSB0b3VjaC5jbGllbnRZO1xuICAgIGNsaWNrWydzY3JlZW5YJ10gPSB0b3VjaC5zY3JlZW5YO1xuICAgIGNsaWNrWydzY3JlZW5ZJ10gPSB0b3VjaC5zY3JlZW5ZO1xuICB9XG4gIHJldHVybiBjbGljayBhcyBNb3VzZUV2ZW50O1xufVxuXG4vKipcbiAqIEFuIGltcGxlbWVudGF0aW9uIG9mIFwicHJldmVudERlZmF1bHRcIiBmb3IgYSBzeW50aGVzaXplZCBldmVudC4gU2ltcGx5XG4gKiBzZXRzIFwiZGVmYXVsdFByZXZlbnRlZFwiIHByb3BlcnR5IHRvIHRydWUuXG4gKi9cbmZ1bmN0aW9uIHN5bnRoZXRpY1ByZXZlbnREZWZhdWx0KHRoaXM6IEV2ZW50KSB7XG4gICh0aGlzIGFzIFN5bnRoZXRpY01vdXNlRXZlbnQpLmRlZmF1bHRQcmV2ZW50ZWQgPSB0cnVlO1xufVxuXG4vKipcbiAqIEFuIGltcGxlbWVudGF0aW9uIG9mIFwic3RvcFByb3BhZ2F0aW9uXCIgZm9yIGEgc3ludGhlc2l6ZWQgZXZlbnQuIEl0IHNpbXBseVxuICogc2V0cyBhIHN5bnRoZXRpYyBub24tc3RhbmRhcmQgXCJfcHJvcGFnYXRpb25TdG9wcGVkXCIgcHJvcGVydHkgdG8gdHJ1ZS5cbiAqL1xuZnVuY3Rpb24gc3ludGhldGljU3RvcFByb3BhZ2F0aW9uKHRoaXM6IEV2ZW50KSB7XG4gICh0aGlzIGFzIFN5bnRoZXRpY01vdXNlRXZlbnQpLl9wcm9wYWdhdGlvblN0b3BwZWQgPSB0cnVlO1xufVxuXG4vKipcbiAqIE1hcHBpbmcgb2YgS2V5Ym9hcmRFdmVudC5rZXkgdmFsdWVzIHRvXG4gKiBLZXlDb2RlIHZhbHVlcy5cbiAqL1xuY29uc3QgQUNUSU9OX0tFWV9UT19LRVlDT0RFOiB7W2tleTogc3RyaW5nXTogbnVtYmVyfSA9IHtcbiAgJ0VudGVyJzogS2V5Q29kZS5FTlRFUixcbiAgJyAnOiBLZXlDb2RlLlNQQUNFLFxufTtcblxuLyoqXG4gKiBNYXBwaW5nIG9mIEhUTUwgZWxlbWVudCBpZGVudGlmaWVycyAoQVJJQSByb2xlLCB0eXBlLCBvciB0YWdOYW1lKSB0byB0aGVcbiAqIGtleXMgKGVudGVyIGFuZC9vciBzcGFjZSkgdGhhdCBzaG91bGQgYWN0aXZhdGUgdGhlbS4gQSB2YWx1ZSBvZiB6ZXJvIG1lYW5zXG4gKiB0aGF0IGJvdGggc2hvdWxkIGFjdGl2YXRlIHRoZW0uXG4gKi9cbmV4cG9ydCBjb25zdCBJREVOVElGSUVSX1RPX0tFWV9UUklHR0VSX01BUFBJTkc6IHtba2V5OiBzdHJpbmddOiBudW1iZXJ9ID0ge1xuICAnQSc6IEtleUNvZGUuRU5URVIsXG4gICdCVVRUT04nOiAwLFxuICAnQ0hFQ0tCT1gnOiBLZXlDb2RlLlNQQUNFLFxuICAnQ09NQk9CT1gnOiBLZXlDb2RlLkVOVEVSLFxuICAnRklMRSc6IDAsXG4gICdHUklEQ0VMTCc6IEtleUNvZGUuRU5URVIsXG4gICdMSU5LJzogS2V5Q29kZS5FTlRFUixcbiAgJ0xJU1RCT1gnOiBLZXlDb2RlLkVOVEVSLFxuICAnTUVOVSc6IDAsXG4gICdNRU5VQkFSJzogMCxcbiAgJ01FTlVJVEVNJzogMCxcbiAgJ01FTlVJVEVNQ0hFQ0tCT1gnOiAwLFxuICAnTUVOVUlURU1SQURJTyc6IDAsXG4gICdPUFRJT04nOiAwLFxuICAnUkFESU8nOiBLZXlDb2RlLlNQQUNFLFxuICAnUkFESU9HUk9VUCc6IEtleUNvZGUuU1BBQ0UsXG4gICdSRVNFVCc6IDAsXG4gICdTVUJNSVQnOiAwLFxuICAnU1dJVENIJzogS2V5Q29kZS5TUEFDRSxcbiAgJ1RBQic6IDAsXG4gICdUUkVFJzogS2V5Q29kZS5FTlRFUixcbiAgJ1RSRUVJVEVNJzogS2V5Q29kZS5FTlRFUixcbn07XG5cbi8qKlxuICogUmV0dXJucyB3aGV0aGVyIG9yIG5vdCB0byBwcm9jZXNzIHNwYWNlIGJhc2VkIG9uIHRoZSB0eXBlIG9mIHRoZSBlbGVtZW50O1xuICogY2hlY2tzIHRvIG1ha2Ugc3VyZSB0aGF0IHR5cGUgaXMgbm90IG51bGwuXG4gKiBAcGFyYW0gZWxlbWVudCBUaGUgZWxlbWVudC5cbiAqIEByZXR1cm4gV2hldGhlciBvciBub3QgdG8gcHJvY2VzcyBzcGFjZSBiYXNlZCBvbiB0eXBlLlxuICovXG5mdW5jdGlvbiBwcm9jZXNzU3BhY2UoZWxlbWVudDogRWxlbWVudCk6IGJvb2xlYW4ge1xuICBjb25zdCB0eXBlID0gKGVsZW1lbnQuZ2V0QXR0cmlidXRlKCd0eXBlJykgfHwgZWxlbWVudC50YWdOYW1lKS50b1VwcGVyQ2FzZSgpO1xuICByZXR1cm4gdHlwZSBpbiBQUk9DRVNTX1NQQUNFO1xufVxuXG4vKipcbiAqIFJldHVybnMgd2hldGhlciBvciBub3QgdGhlIGdpdmVuIGVsZW1lbnQgaXMgYSB0ZXh0IGNvbnRyb2wuXG4gKiBAcGFyYW0gZWwgVGhlIGVsZW1lbnQuXG4gKiBAcmV0dXJuIFdoZXRoZXIgb3Igbm90IHRoZSBnaXZlbiBlbGVtZW50IGlzIGEgdGV4dCBjb250cm9sLlxuICovXG5mdW5jdGlvbiBpc1RleHRDb250cm9sKGVsOiBFbGVtZW50KTogYm9vbGVhbiB7XG4gIGNvbnN0IHR5cGUgPSAoZWwuZ2V0QXR0cmlidXRlKCd0eXBlJykgfHwgZWwudGFnTmFtZSkudG9VcHBlckNhc2UoKTtcbiAgcmV0dXJuIHR5cGUgaW4gVEVYVF9DT05UUk9MUztcbn1cblxuLyoqXG4gKiBSZXR1cm5zIGlmIHRoZSBnaXZlbiBlbGVtZW50IGlzIGEgbmF0aXZlIEhUTUwgY29udHJvbC5cbiAqIEBwYXJhbSBlbCBUaGUgZWxlbWVudC5cbiAqIEByZXR1cm4gSWYgdGhlIGdpdmVuIGVsZW1lbnQgaXMgYSBuYXRpdmUgSFRNTCBjb250cm9sLlxuICovXG5leHBvcnQgZnVuY3Rpb24gaXNOYXRpdmVIVE1MQ29udHJvbChlbDogRWxlbWVudCk6IGJvb2xlYW4ge1xuICByZXR1cm4gZWwudGFnTmFtZS50b1VwcGVyQ2FzZSgpIGluIE5BVElWRV9IVE1MX0NPTlRST0xTO1xufVxuXG4vKipcbiAqIFJldHVybnMgaWYgdGhlIGdpdmVuIGVsZW1lbnQgaXMgbmF0aXZlbHkgYWN0aXZhdGFibGUuIEJyb3dzZXJzIGVtaXQgY2xpY2tcbiAqIGV2ZW50cyBmb3IgbmF0aXZlbHkgYWN0aXZhdGFibGUgZWxlbWVudHMsIGV2ZW4gd2hlbiBhY3RpdmF0ZWQgdmlhIGtleWJvYXJkLlxuICogRm9yIHRoZXNlIGVsZW1lbnRzLCB3ZSBkb24ndCBuZWVkIHRvIHJhaXNlIGExMXkgY2xpY2sgZXZlbnRzLlxuICogQHBhcmFtIGVsIFRoZSBlbGVtZW50LlxuICogQHJldHVybiBJZiB0aGUgZ2l2ZW4gZWxlbWVudCBpcyBhIG5hdGl2ZSBIVE1MIGNvbnRyb2wuXG4gKi9cbmZ1bmN0aW9uIGlzTmF0aXZlbHlBY3RpdmF0YWJsZShlbDogRWxlbWVudCk6IGJvb2xlYW4ge1xuICByZXR1cm4gKFxuICAgIGVsLnRhZ05hbWUudG9VcHBlckNhc2UoKSA9PT0gJ0JVVFRPTicgfHxcbiAgICAoISEoZWwgYXMgSFRNTElucHV0RWxlbWVudCkudHlwZSAmJiAoZWwgYXMgSFRNTElucHV0RWxlbWVudCkudHlwZS50b1VwcGVyQ2FzZSgpID09PSAnRklMRScpXG4gICk7XG59XG5cbi8qKlxuICogSFRNTCA8aW5wdXQ+IHR5cGVzIChub3QgQVJJQSByb2xlcykgd2hpY2ggd2lsbCBhdXRvLXRyaWdnZXIgYSBjbGljayBldmVudCBmb3JcbiAqIHRoZSBTcGFjZSBrZXksIHdpdGggc2lkZS1lZmZlY3RzLiBXZSB3aWxsIG5vdCBjYWxsIHByZXZlbnREZWZhdWx0IGlmIHNwYWNlIGlzXG4gKiBwcmVzc2VkLCBub3Igd2lsbCB3ZSByYWlzZSBhMTF5IGNsaWNrIGV2ZW50cy4gIEZvciBhbGwgb3RoZXIgZWxlbWVudHMsIHdlIGNhblxuICogc3VwcHJlc3MgdGhlIGRlZmF1bHQgZXZlbnQgKHdoaWNoIGhhcyBubyBkZXNpcmVkIHNpZGUtZWZmZWN0cykgYW5kIGhhbmRsZSB0aGVcbiAqIGtleWRvd24gb3Vyc2VsdmVzLlxuICovXG5jb25zdCBQUk9DRVNTX1NQQUNFOiB7W2tleTogc3RyaW5nXTogYm9vbGVhbn0gPSB7XG4gICdDSEVDS0JPWCc6IHRydWUsXG4gICdGSUxFJzogdHJ1ZSxcbiAgJ09QVElPTic6IHRydWUsXG4gICdSQURJTyc6IHRydWUsXG59O1xuXG4vKiogVGFnTmFtZXMgYW5kIElucHV0IHR5cGVzIGZvciB3aGljaCB0byBub3QgcHJvY2VzcyBlbnRlci9zcGFjZSBhcyBjbGljay4gKi9cbmNvbnN0IFRFWFRfQ09OVFJPTFM6IHtba2V5OiBzdHJpbmddOiBib29sZWFufSA9IHtcbiAgJ0NPTE9SJzogdHJ1ZSxcbiAgJ0RBVEUnOiB0cnVlLFxuICAnREFURVRJTUUnOiB0cnVlLFxuICAnREFURVRJTUUtTE9DQUwnOiB0cnVlLFxuICAnRU1BSUwnOiB0cnVlLFxuICAnTU9OVEgnOiB0cnVlLFxuICAnTlVNQkVSJzogdHJ1ZSxcbiAgJ1BBU1NXT1JEJzogdHJ1ZSxcbiAgJ1JBTkdFJzogdHJ1ZSxcbiAgJ1NFQVJDSCc6IHRydWUsXG4gICdURUwnOiB0cnVlLFxuICAnVEVYVCc6IHRydWUsXG4gICdURVhUQVJFQSc6IHRydWUsXG4gICdUSU1FJzogdHJ1ZSxcbiAgJ1VSTCc6IHRydWUsXG4gICdXRUVLJzogdHJ1ZSxcbn07XG5cbi8qKiBUYWdOYW1lcyB0aGF0IGFyZSBuYXRpdmUgSFRNTCBjb250cm9scy4gKi9cbmNvbnN0IE5BVElWRV9IVE1MX0NPTlRST0xTOiB7W2tleTogc3RyaW5nXTogYm9vbGVhbn0gPSB7XG4gICdBJzogdHJ1ZSxcbiAgJ0FSRUEnOiB0cnVlLFxuICAnQlVUVE9OJzogdHJ1ZSxcbiAgJ0RJQUxPRyc6IHRydWUsXG4gICdJTUcnOiB0cnVlLFxuICAnSU5QVVQnOiB0cnVlLFxuICAnTElOSyc6IHRydWUsXG4gICdNRU5VJzogdHJ1ZSxcbiAgJ09QVEdST1VQJzogdHJ1ZSxcbiAgJ09QVElPTic6IHRydWUsXG4gICdQUk9HUkVTUyc6IHRydWUsXG4gICdTRUxFQ1QnOiB0cnVlLFxuICAnVEVYVEFSRUEnOiB0cnVlLFxufTtcblxuLyoqIEV4cG9ydGVkIGZvciB0ZXN0aW5nLiAqL1xuZXhwb3J0IGNvbnN0IHRlc3RpbmcgPSB7XG4gIHNldElzTWFjKHZhbHVlOiBib29sZWFuKSB7XG4gICAgaXNNYWMgPSB2YWx1ZTtcbiAgfSxcbn07XG4iXX0=