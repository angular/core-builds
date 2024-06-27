/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { isCaptureEvent, EventType } from './event_type';
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
    if (isCaptureEvent(eventType)) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXZlbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3ByaW1pdGl2ZXMvZXZlbnQtZGlzcGF0Y2gvc3JjL2V2ZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUdILE9BQU8sRUFBQyxjQUFjLEVBQUUsU0FBUyxFQUFDLE1BQU0sY0FBYyxDQUFDO0FBQ3ZELE9BQU8sRUFBQyxPQUFPLEVBQUMsTUFBTSxZQUFZLENBQUM7QUFFbkM7O0dBRUc7QUFDSCxNQUFNLFVBQVUsbUJBQW1CLENBQUMsU0FBaUI7SUFDbkQseUVBQXlFO0lBQ3pFLDJFQUEyRTtJQUMzRSx5RUFBeUU7SUFDekUscUVBQXFFO0lBQ3JFLHVEQUF1RDtJQUN2RCxJQUFJLFNBQVMsS0FBSyxTQUFTLENBQUMsVUFBVSxFQUFFLENBQUM7UUFDdkMsT0FBTyxTQUFTLENBQUMsU0FBUyxDQUFDO0lBQzdCLENBQUM7U0FBTSxJQUFJLFNBQVMsS0FBSyxTQUFTLENBQUMsVUFBVSxFQUFFLENBQUM7UUFDOUMsT0FBTyxTQUFTLENBQUMsUUFBUSxDQUFDO0lBQzVCLENBQUM7U0FBTSxJQUFJLFNBQVMsS0FBSyxTQUFTLENBQUMsWUFBWSxFQUFFLENBQUM7UUFDaEQsT0FBTyxTQUFTLENBQUMsV0FBVyxDQUFDO0lBQy9CLENBQUM7U0FBTSxJQUFJLFNBQVMsS0FBSyxTQUFTLENBQUMsWUFBWSxFQUFFLENBQUM7UUFDaEQsT0FBTyxTQUFTLENBQUMsVUFBVSxDQUFDO0lBQzlCLENBQUM7SUFDRCxPQUFPLFNBQVMsQ0FBQztBQUNuQixDQUFDO0FBRUQ7Ozs7Ozs7O0dBUUc7QUFDSCxNQUFNLFVBQVUsZ0JBQWdCLENBQzlCLE9BQWdCLEVBQ2hCLFNBQWlCLEVBQ2pCLE9BQStCO0lBRS9CLG9EQUFvRDtJQUNwRCxTQUFTO0lBQ1QsRUFBRTtJQUNGLDRFQUE0RTtJQUM1RSx1RUFBdUU7SUFDdkUsWUFB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QVUsRUFBRSxJQUFJO0lBQ2hCLFFBQVEsRUFBRSxJQUFJO0lBQ2QsVUFBVSxFQUFFLElBQUk7SUFDaEIsUUFBUSxFQUFFLElBQUk7SUFDZCxVQUFVLEVBQUUsSUFBSTtDQUNqQixDQUFDO0FBRUYsNEJBQTRCO0FBQzVCLE1BQU0sQ0FBQyxNQUFNLE9BQU8sR0FBRztJQUNyQixRQUFRLENBQUMsS0FBYztRQUNyQixLQUFLLEdBQUcsS0FBSyxDQUFDO0lBQ2hCLENBQUM7Q0FDRixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7RXZlbnRIYW5kbGVySW5mb30gZnJvbSAnLi9ldmVudF9oYW5kbGVyJztcbmltcG9ydCB7aXNDYXB0dXJlRXZlbnQsIEV2ZW50VHlwZX0gZnJvbSAnLi9ldmVudF90eXBlJztcbmltcG9ydCB7S2V5Q29kZX0gZnJvbSAnLi9rZXlfY29kZSc7XG5cbi8qKlxuICogR2V0cyBhIGJyb3dzZXIgZXZlbnQgdHlwZSwgaWYgaXQgd291bGQgZGlmZmVyIGZyb20gdGhlIEpTQWN0aW9uIGV2ZW50IHR5cGUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRCcm93c2VyRXZlbnRUeXBlKGV2ZW50VHlwZTogc3RyaW5nKSB7XG4gIC8vIE1vdXNlZW50ZXIgYW5kIG1vdXNlbGVhdmUgZXZlbnRzIGFyZSBub3QgaGFuZGxlZCBkaXJlY3RseSBiZWNhdXNlIHRoZXlcbiAgLy8gYXJlIG5vdCBhdmFpbGFibGUgZXZlcnl3aGVyZS4gSW4gYnJvd3NlcnMgd2hlcmUgdGhleSBhcmUgYXZhaWxhYmxlLCB0aGV5XG4gIC8vIGRvbid0IGJ1YmJsZSBhbmQgYXJlbid0IHZpc2libGUgYXQgdGhlIGNvbnRhaW5lciBib3VuZGFyeS4gSW5zdGVhZCwgd2VcbiAgLy8gc3ludGhlc2l6ZSB0aGUgbW91c2VlbnRlciBhbmQgbW91c2VsZWF2ZSBldmVudHMgZnJvbSBtb3VzZW92ZXIgYW5kXG4gIC8vIG1vdXNlb3V0IGV2ZW50cywgcmVzcGVjdGl2ZWx5LiBDZi4gZXZlbnRjb250cmFjdC5qcy5cbiAgaWYgKGV2ZW50VHlwZSA9PT0gRXZlbnRUeXBlLk1PVVNFRU5URVIpIHtcbiAgICByZXR1cm4gRXZlbnRUeXBlLk1PVVNFT1ZFUjtcbiAgfSBlbHNlIGlmIChldmVudFR5cGUgPT09IEV2ZW50VHlwZS5NT1VTRUxFQVZFKSB7XG4gICAgcmV0dXJuIEV2ZW50VHlwZS5NT1VTRU9VVDtcbiAgfSBlbHNlIGlmIChldmVudFR5cGUgPT09IEV2ZW50VHlwZS5QT0lOVEVSRU5URVIpIHtcbiAgICByZXR1cm4gRXZlbnRUeXBlLlBPSU5URVJPVkVSO1xuICB9IGVsc2UgaWYgKGV2ZW50VHlwZSA9PT0gRXZlbnRUeXBlLlBPSU5URVJMRUFWRSkge1xuICAgIHJldHVybiBFdmVudFR5cGUuUE9JTlRFUk9VVDtcbiAgfVxuICByZXR1cm4gZXZlbnRUeXBlO1xufVxuXG4vKipcbiAqIFJlZ2lzdGVycyB0aGUgZXZlbnQgaGFuZGxlciBmdW5jdGlvbiB3aXRoIHRoZSBnaXZlbiBET00gZWxlbWVudCBmb3JcbiAqIHRoZSBnaXZlbiBldmVudCB0eXBlLlxuICpcbiAqIEBwYXJhbSBlbGVtZW50IFRoZSBlbGVtZW50LlxuICogQHBhcmFtIGV2ZW50VHlwZSBUaGUgZXZlbnQgdHlwZS5cbiAqIEBwYXJhbSBoYW5kbGVyIFRoZSBoYW5kbGVyIGZ1bmN0aW9uIHRvIGluc3RhbGwuXG4gKiBAcmV0dXJuIEluZm9ybWF0aW9uIG5lZWRlZCB0byB1bmluc3RhbGwgdGhlIGV2ZW50IGhhbmRsZXIgZXZlbnR1YWxseS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFkZEV2ZW50TGlzdGVuZXIoXG4gIGVsZW1lbnQ6IEVsZW1lbnQsXG4gIGV2ZW50VHlwZTogc3RyaW5nLFxuICBoYW5kbGVyOiAoZXZlbnQ6IEV2ZW50KSA9PiB2b2lkLFxuKTogRXZlbnRIYW5kbGVySW5mbyB7XG4gIC8vIEFsbCBldmVudCBoYW5kbGVycyBhcmUgcmVnaXN0ZXJlZCBpbiB0aGUgYnViYmxpbmdcbiAgLy8gcGhhc2UuXG4gIC8vXG4gIC8vIEFsbCBicm93c2VycyBzdXBwb3J0IGZvY3VzIGFuZCBibHVyLCBidXQgdGhlc2UgZXZlbnRzIG9ubHkgYXJlIHByb3BhZ2F0ZWRcbiAgLy8gaW4gdGhlIGNhcHR1cmUgcGhhc2UuIFZlcnkgbGVnYWN5IGJyb3dzZXJzIGRvIG5vdCBzdXBwb3J0IGZvY3VzaW4gb3JcbiAgLy8gZm9jdXNvdXQuXG4gIC8vXG4gIC8vIEl0IHdvdWxkIGJlIGEgYmFkIGlkZWEgdG8gcmVnaXN0ZXIgYWxsIGV2ZW50IGhhbmRsZXJzIGluIHRoZVxuICAvLyBjYXB0dXJlIHBoYXNlIGJlY2F1c2UgdGhlbiByZWd1bGFyIG9uY2xpY2sgaGFuZGxlcnMgd291bGQgbm90IGJlXG4gIC8vIGV4ZWN1dGVkIGF0IGFsbCBvbiBldmVudHMgdGhhdCB0cmlnZ2VyIGEganNhY3Rpb24uIFRoYXQncyBub3RcbiAgLy8gZW50aXJlbHkgd2hhdCB3ZSB3YW50LCBhdCBsZWFzdCBmb3Igbm93LlxuICAvL1xuICAvLyBFcnJvciBhbmQgbG9hZCBldmVudHMgKGkuZS4gb24gaW1hZ2VzKSBkbyBub3QgYnViYmxlIHNvIHRoZXkgYXJlIGFsc29cbiAgLy8gaGFuZGxlZCBpbiB0aGUgY2FwdHVyZSBwaGFzZS5cbiAgbGV0IGNhcHR1cmUgPSBmYWxzZTtcblxuICBpZiAoaXNDYXB0dXJlRXZlbnQoZXZlbnRUeXBlKSkge1xuICAgIGNhcHR1cmUgPSB0cnVlO1xuICB9XG4gIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihldmVudFR5cGUsIGhhbmRsZXIsIGNhcHR1cmUpO1xuXG4gIHJldHVybiB7ZXZlbnRUeXBlLCBoYW5kbGVyLCBjYXB0dXJlfTtcbn1cblxuLyoqXG4gKiBSZW1vdmVzIHRoZSBldmVudCBoYW5kbGVyIGZvciB0aGUgZ2l2ZW4gZXZlbnQgZnJvbSB0aGUgZWxlbWVudC5cbiAqIHRoZSBnaXZlbiBldmVudCB0eXBlLlxuICpcbiAqIEBwYXJhbSBlbGVtZW50IFRoZSBlbGVtZW50LlxuICogQHBhcmFtIGluZm8gVGhlIGluZm9ybWF0aW9uIG5lZWRlZCB0byBkZXJlZ2lzdGVyIHRoZSBoYW5kbGVyLCBhcyByZXR1cm5lZCBieVxuICogICAgIGFkZEV2ZW50TGlzdGVuZXIoKSwgYWJvdmUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZW1vdmVFdmVudExpc3RlbmVyKGVsZW1lbnQ6IEVsZW1lbnQsIGluZm86IEV2ZW50SGFuZGxlckluZm8pIHtcbiAgaWYgKGVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcikge1xuICAgIGVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihpbmZvLmV2ZW50VHlwZSwgaW5mby5oYW5kbGVyIGFzIEV2ZW50TGlzdGVuZXIsIGluZm8uY2FwdHVyZSk7XG4gICAgLy8gYGRldGFjaEV2ZW50YCBpcyBhbiBvbGQgRE9NIEFQSS5cbiAgICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6bm8tYW55XG4gIH0gZWxzZSBpZiAoKGVsZW1lbnQgYXMgYW55KS5kZXRhY2hFdmVudCkge1xuICAgIC8vIGBkZXRhY2hFdmVudGAgaXMgYW4gb2xkIERPTSBBUEkuXG4gICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOm5vLWFueVxuICAgIChlbGVtZW50IGFzIGFueSkuZGV0YWNoRXZlbnQoYG9uJHtpbmZvLmV2ZW50VHlwZX1gLCBpbmZvLmhhbmRsZXIpO1xuICB9XG59XG5cbi8qKlxuICogQ2FuY2VscyBwcm9wYWdhdGlvbiBvZiBhbiBldmVudC5cbiAqIEBwYXJhbSBlIFRoZSBldmVudCB0byBjYW5jZWwgcHJvcGFnYXRpb24gZm9yLlxuICovXG5leHBvcnQgZnVuY3Rpb24gc3RvcFByb3BhZ2F0aW9uKGU6IEV2ZW50KSB7XG4gIGUuc3RvcFByb3BhZ2F0aW9uID8gZS5zdG9wUHJvcGFnYXRpb24oKSA6IChlLmNhbmNlbEJ1YmJsZSA9IHRydWUpO1xufVxuXG4vKipcbiAqIFByZXZlbnRzIHRoZSBkZWZhdWx0IGFjdGlvbiBvZiBhbiBldmVudC5cbiAqIEBwYXJhbSBlIFRoZSBldmVudCB0byBwcmV2ZW50IHRoZSBkZWZhdWx0IGFjdGlvbiBmb3IuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwcmV2ZW50RGVmYXVsdChlOiBFdmVudCkge1xuICBlLnByZXZlbnREZWZhdWx0ID8gZS5wcmV2ZW50RGVmYXVsdCgpIDogKGUucmV0dXJuVmFsdWUgPSBmYWxzZSk7XG59XG5cbi8qKlxuICogR2V0cyB0aGUgdGFyZ2V0IEVsZW1lbnQgb2YgdGhlIGV2ZW50LiBJbiBGaXJlZm94LCBhIHRleHQgbm9kZSBtYXkgYXBwZWFyIGFzXG4gKiB0aGUgdGFyZ2V0IG9mIHRoZSBldmVudCwgaW4gd2hpY2ggY2FzZSB3ZSByZXR1cm4gdGhlIHBhcmVudCBlbGVtZW50IG9mIHRoZVxuICogdGV4dCBub2RlLlxuICogQHBhcmFtIGUgVGhlIGV2ZW50IHRvIGdldCB0aGUgdGFyZ2V0IG9mLlxuICogQHJldHVybiBUaGUgdGFyZ2V0IGVsZW1lbnQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRUYXJnZXQoZTogRXZlbnQpOiBFbGVtZW50IHtcbiAgbGV0IGVsID0gZS50YXJnZXQgYXMgRWxlbWVudDtcblxuICAvLyBJbiBGaXJlZm94LCB0aGUgZXZlbnQgbWF5IGhhdmUgYSB0ZXh0IG5vZGUgYXMgaXRzIHRhcmdldC4gV2UgYWx3YXlzXG4gIC8vIHdhbnQgdGhlIHBhcmVudCBFbGVtZW50IHRoZSB0ZXh0IG5vZGUgYmVsb25ncyB0bywgaG93ZXZlci5cbiAgaWYgKCFlbC5nZXRBdHRyaWJ1dGUgJiYgZWwucGFyZW50Tm9kZSkge1xuICAgIGVsID0gZWwucGFyZW50Tm9kZSBhcyBFbGVtZW50O1xuICB9XG5cbiAgcmV0dXJuIGVsO1xufVxuXG4vKipcbiAqIFdoZXRoZXIgd2UgYXJlIG9uIGEgTWFjLiBOb3QgcHVsbGluZyBpbiB1c2VyYWdlbnQganVzdCBmb3IgdGhpcy5cbiAqL1xubGV0IGlzTWFjOiBib29sZWFuID0gdHlwZW9mIG5hdmlnYXRvciAhPT0gJ3VuZGVmaW5lZCcgJiYgL01hY2ludG9zaC8udGVzdChuYXZpZ2F0b3IudXNlckFnZW50KTtcblxuLyoqXG4gKiBEZXRlcm1pbmVzIGFuZCByZXR1cm5zIHdoZXRoZXIgdGhlIGdpdmVuIGV2ZW50ICh3aGljaCBpcyBhc3N1bWVkIHRvIGJlIGFcbiAqIGNsaWNrIGV2ZW50KSBpcyBhIG1pZGRsZSBjbGljay5cbiAqIE5PVEU6IFRoZXJlIGlzIG5vdCBhIGNvbnNpc3RlbnQgd2F5IHRvIGlkZW50aWZ5IG1pZGRsZSBjbGlja1xuICogaHR0cDovL3d3dy51bml4cGFwYS5jb20vanMvbW91c2UuaHRtbFxuICovXG5mdW5jdGlvbiBpc01pZGRsZUNsaWNrKGU6IEV2ZW50KTogYm9vbGVhbiB7XG4gIHJldHVybiAoXG4gICAgLy8gYHdoaWNoYCBpcyBhbiBvbGQgRE9NIEFQSS5cbiAgICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6bm8tYW55XG4gICAgKGUgYXMgYW55KS53aGljaCA9PT0gMiB8fFxuICAgIC8vIGB3aGljaGAgaXMgYW4gb2xkIERPTSBBUEkuXG4gICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOm5vLWFueVxuICAgICgoZSBhcyBhbnkpLndoaWNoID09IG51bGwgJiZcbiAgICAgIC8vIGBidXR0b25gIGlzIGFuIG9sZCBET00gQVBJLlxuICAgICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOm5vLWFueVxuICAgICAgKGUgYXMgYW55KS5idXR0b24gPT09IDQpIC8vIG1pZGRsZSBjbGljayBmb3IgSUVcbiAgKTtcbn1cblxuLyoqXG4gKiBEZXRlcm1pbmVzIGFuZCByZXR1cm5zIHdoZXRoZXIgdGhlIGdpdmVuIGV2ZW50ICh3aGljaCBpcyBhc3N1bWVkXG4gKiB0byBiZSBhIGNsaWNrIGV2ZW50KSBpcyBtb2RpZmllZC4gQSBtaWRkbGUgY2xpY2sgaXMgY29uc2lkZXJlZCBhIG1vZGlmaWVkXG4gKiBjbGljayB0byByZXRhaW4gdGhlIGRlZmF1bHQgYnJvd3NlciBhY3Rpb24sIHdoaWNoIG9wZW5zIGEgbGluayBpbiBhIG5ldyB0YWIuXG4gKiBAcGFyYW0gZSBUaGUgZXZlbnQuXG4gKiBAcmV0dXJuIFdoZXRoZXIgdGhlIGdpdmVuIGV2ZW50IGlzIG1vZGlmaWVkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gaXNNb2RpZmllZENsaWNrRXZlbnQoZTogRXZlbnQpOiBib29sZWFuIHtcbiAgcmV0dXJuIChcbiAgICAvLyBgbWV0YUtleWAgaXMgYW4gb2xkIERPTSBBUEkuXG4gICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOm5vLWFueVxuICAgIChpc01hYyAmJiAoZSBhcyBhbnkpLm1ldGFLZXkpIHx8XG4gICAgLy8gYGN0cmxLZXlgIGlzIGFuIG9sZCBET00gQVBJLlxuICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTpuby1hbnlcbiAgICAoIWlzTWFjICYmIChlIGFzIGFueSkuY3RybEtleSkgfHxcbiAgICBpc01pZGRsZUNsaWNrKGUpIHx8XG4gICAgLy8gYHNoaWZ0S2V5YCBpcyBhbiBvbGQgRE9NIEFQSS5cbiAgICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6bm8tYW55XG4gICAgKGUgYXMgYW55KS5zaGlmdEtleVxuICApO1xufVxuXG4vKiogV2hldGhlciB3ZSBhcmUgb24gV2ViS2l0IChlLmcuLCBDaHJvbWUpLiAqL1xuZXhwb3J0IGNvbnN0IGlzV2ViS2l0OiBib29sZWFuID1cbiAgdHlwZW9mIG5hdmlnYXRvciAhPT0gJ3VuZGVmaW5lZCcgJiZcbiAgIS9PcGVyYS8udGVzdChuYXZpZ2F0b3IudXNlckFnZW50KSAmJlxuICAvV2ViS2l0Ly50ZXN0KG5hdmlnYXRvci51c2VyQWdlbnQpO1xuXG4vKiogV2hldGhlciB3ZSBhcmUgb24gSUUuICovXG5leHBvcnQgY29uc3QgaXNJZTogYm9vbGVhbiA9XG4gIHR5cGVvZiBuYXZpZ2F0b3IgIT09ICd1bmRlZmluZWQnICYmXG4gICgvTVNJRS8udGVzdChuYXZpZ2F0b3IudXNlckFnZW50KSB8fCAvVHJpZGVudC8udGVzdChuYXZpZ2F0b3IudXNlckFnZW50KSk7XG5cbi8qKiBXaGV0aGVyIHdlIGFyZSBvbiBHZWNrbyAoZS5nLiwgRmlyZWZveCkuICovXG5leHBvcnQgY29uc3QgaXNHZWNrbzogYm9vbGVhbiA9XG4gIHR5cGVvZiBuYXZpZ2F0b3IgIT09ICd1bmRlZmluZWQnICYmXG4gICEvT3BlcmF8V2ViS2l0Ly50ZXN0KG5hdmlnYXRvci51c2VyQWdlbnQpICYmXG4gIC9HZWNrby8udGVzdChuYXZpZ2F0b3IucHJvZHVjdCk7XG5cbi8qKlxuICogRGV0ZXJtaW5lcyBhbmQgcmV0dXJucyB3aGV0aGVyIHRoZSBnaXZlbiBlbGVtZW50IGlzIGEgdmFsaWQgdGFyZ2V0IGZvclxuICoga2V5cHJlc3Mva2V5ZG93biBET00gZXZlbnRzIHRoYXQgYWN0IGxpa2UgcmVndWxhciBET00gY2xpY2tzLlxuICogQHBhcmFtIGVsIFRoZSBlbGVtZW50LlxuICogQHJldHVybiBXaGV0aGVyIHRoZSBnaXZlbiBlbGVtZW50IGlzIGEgdmFsaWQgYWN0aW9uIGtleSB0YXJnZXQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc1ZhbGlkQWN0aW9uS2V5VGFyZ2V0KGVsOiBFbGVtZW50KTogYm9vbGVhbiB7XG4gIGlmICghKCdnZXRBdHRyaWJ1dGUnIGluIGVsKSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBpZiAoaXNUZXh0Q29udHJvbChlbCkpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgaWYgKGlzTmF0aXZlbHlBY3RpdmF0YWJsZShlbCkpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgLy8gYGlzQ29udGVudEVkaXRhYmxlYCBpcyBhbiBvbGQgRE9NIEFQSS5cbiAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOm5vLWFueVxuICBpZiAoKGVsIGFzIGFueSkuaXNDb250ZW50RWRpdGFibGUpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICByZXR1cm4gdHJ1ZTtcbn1cblxuLyoqXG4gKiBXaGV0aGVyIGFuIGV2ZW50IGhhcyBhIG1vZGlmaWVyIGtleSBhY3RpdmF0ZWQuXG4gKiBAcGFyYW0gZSBUaGUgZXZlbnQuXG4gKiBAcmV0dXJuIFRydWUsIGlmIGEgbW9kaWZpZXIga2V5IGlzIGFjdGl2YXRlZC5cbiAqL1xuZnVuY3Rpb24gaGFzTW9kaWZpZXJLZXkoZTogRXZlbnQpOiBib29sZWFuIHtcbiAgcmV0dXJuIChcbiAgICAvLyBgY3RybEtleWAgaXMgYW4gb2xkIERPTSBBUEkuXG4gICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOm5vLWFueVxuICAgIChlIGFzIGFueSkuY3RybEtleSB8fFxuICAgIC8vIGBzaGlmdEtleWAgaXMgYW4gb2xkIERPTSBBUEkuXG4gICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOm5vLWFueVxuICAgIChlIGFzIGFueSkuc2hpZnRLZXkgfHxcbiAgICAvLyBgYWx0S2V5YCBpcyBhbiBvbGQgRE9NIEFQSS5cbiAgICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6bm8tYW55XG4gICAgKGUgYXMgYW55KS5hbHRLZXkgfHxcbiAgICAvLyBgbWV0YUtleWAgaXMgYW4gb2xkIERPTSBBUEkuXG4gICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOm5vLWFueVxuICAgIChlIGFzIGFueSkubWV0YUtleVxuICApO1xufVxuXG4vKipcbiAqIERldGVybWluZXMgYW5kIHJldHVybnMgd2hldGhlciB0aGUgZ2l2ZW4gZXZlbnQgaGFzIGEgdGFyZ2V0IHRoYXQgYWxyZWFkeVxuICogaGFzIGV2ZW50IGhhbmRsZXJzIGF0dGFjaGVkIGJlY2F1c2UgaXQgaXMgYSBuYXRpdmUgSFRNTCBjb250cm9sLiBVc2VkIHRvXG4gKiBkZXRlcm1pbmUgaWYgcHJldmVudERlZmF1bHQgc2hvdWxkIGJlIGNhbGxlZCB3aGVuIGlzQWN0aW9uS2V5RXZlbnQgaXMgdHJ1ZS5cbiAqIEBwYXJhbSBlIFRoZSBldmVudC5cbiAqIEByZXR1cm4gSWYgcHJldmVudERlZmF1bHQgc2hvdWxkIGJlIGNhbGxlZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNob3VsZENhbGxQcmV2ZW50RGVmYXVsdE9uTmF0aXZlSHRtbENvbnRyb2woZTogRXZlbnQpOiBib29sZWFuIHtcbiAgY29uc3QgZWwgPSBnZXRUYXJnZXQoZSk7XG4gIGNvbnN0IHRhZ05hbWUgPSBlbC50YWdOYW1lLnRvVXBwZXJDYXNlKCk7XG4gIGNvbnN0IHJvbGUgPSAoZWwuZ2V0QXR0cmlidXRlKCdyb2xlJykgfHwgJycpLnRvVXBwZXJDYXNlKCk7XG5cbiAgaWYgKHRhZ05hbWUgPT09ICdCVVRUT04nIHx8IHJvbGUgPT09ICdCVVRUT04nKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgaWYgKCFpc05hdGl2ZUhUTUxDb250cm9sKGVsKSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBpZiAodGFnTmFtZSA9PT0gJ0EnKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIC8qKlxuICAgKiBGaXggZm9yIHBoeXNpY2FsIGQtcGFkcyBvbiBmZWF0dXJlIHBob25lIHBsYXRmb3JtczsgdGhlIG5hdGl2ZSBldmVudFxuICAgKiAoaWUuIGlzVHJ1c3RlZDogdHJ1ZSkgbmVlZHMgdG8gZmlyZSB0byBzaG93IHRoZSBPUFRJT04gbGlzdC4gU2VlXG4gICAqIGIvMTM1Mjg4NDY5IGZvciBtb3JlIGluZm8uXG4gICAqL1xuICBpZiAodGFnTmFtZSA9PT0gJ1NFTEVDVCcpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgaWYgKHByb2Nlc3NTcGFjZShlbCkpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgaWYgKGlzVGV4dENvbnRyb2woZWwpKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIHJldHVybiB0cnVlO1xufVxuXG4vKipcbiAqIERldGVybWluZXMgYW5kIHJldHVybnMgd2hldGhlciB0aGUgZ2l2ZW4gZXZlbnQgYWN0cyBsaWtlIGEgcmVndWxhciBET00gY2xpY2ssXG4gKiBhbmQgc2hvdWxkIGJlIGhhbmRsZWQgaW5zdGVhZCBvZiB0aGUgY2xpY2suICBJZiB0aGlzIHJldHVybnMgdHJ1ZSwgdGhlIGNhbGxlclxuICogd2lsbCBjYWxsIHByZXZlbnREZWZhdWx0KCkgdG8gcHJldmVudCBhIHBvc3NpYmxlIGR1cGxpY2F0ZSBldmVudC5cbiAqIFRoaXMgaXMgcmVwcmVzZW50ZWQgYnkgYSBrZXlwcmVzcyAoa2V5ZG93biBvbiBHZWNrbyBicm93c2Vycykgb24gRW50ZXIgb3JcbiAqIFNwYWNlIGtleS5cbiAqIEBwYXJhbSBlIFRoZSBldmVudC5cbiAqIEByZXR1cm4gVHJ1ZSwgaWYgdGhlIGV2ZW50IGVtdWxhdGVzIGEgRE9NIGNsaWNrLlxuICovXG5leHBvcnQgZnVuY3Rpb24gaXNBY3Rpb25LZXlFdmVudChlOiBFdmVudCk6IGJvb2xlYW4ge1xuICBsZXQga2V5ID1cbiAgICAvLyBgd2hpY2hgIGlzIGFuIG9sZCBET00gQVBJLlxuICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTpuby1hbnlcbiAgICAoZSBhcyBhbnkpLndoaWNoIHx8XG4gICAgLy8gYGtleUNvZGVgIGlzIGFuIG9sZCBET00gQVBJLlxuICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTpuby1hbnlcbiAgICAoZSBhcyBhbnkpLmtleUNvZGU7XG4gIGlmICgha2V5ICYmIChlIGFzIEtleWJvYXJkRXZlbnQpLmtleSkge1xuICAgIGtleSA9IEFDVElPTl9LRVlfVE9fS0VZQ09ERVsoZSBhcyBLZXlib2FyZEV2ZW50KS5rZXldO1xuICB9XG4gIGlmIChpc1dlYktpdCAmJiBrZXkgPT09IEtleUNvZGUuTUFDX0VOVEVSKSB7XG4gICAga2V5ID0gS2V5Q29kZS5FTlRFUjtcbiAgfVxuICBpZiAoa2V5ICE9PSBLZXlDb2RlLkVOVEVSICYmIGtleSAhPT0gS2V5Q29kZS5TUEFDRSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBjb25zdCBlbCA9IGdldFRhcmdldChlKTtcbiAgaWYgKGUudHlwZSAhPT0gRXZlbnRUeXBlLktFWURPV04gfHwgIWlzVmFsaWRBY3Rpb25LZXlUYXJnZXQoZWwpIHx8IGhhc01vZGlmaWVyS2V5KGUpKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgLy8gRm9yIDxpbnB1dCB0eXBlPVwiY2hlY2tib3hcIj4sIHdlIG11c3Qgb25seSBoYW5kbGUgdGhlIGJyb3dzZXIncyBuYXRpdmUgY2xpY2tcbiAgLy8gZXZlbnQsIHNvIHRoYXQgdGhlIGJyb3dzZXIgY2FuIHRvZ2dsZSB0aGUgY2hlY2tib3guXG4gIGlmIChwcm9jZXNzU3BhY2UoZWwpICYmIGtleSA9PT0gS2V5Q29kZS5TUEFDRSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIC8vIElmIHRoaXMgZWxlbWVudCBpcyBub24tZm9jdXNhYmxlLCBpZ25vcmUgc3RyYXkga2V5c3Ryb2tlcyAoYi8xODMzNzIwOSlcbiAgLy8gU3NjcmVlbiByZWFkZXJzIGNhbiBtb3ZlIHdpdGhvdXQgdGFiIGZvY3VzLCBzbyBhbnkgdGFiSW5kZXggaXMgZm9jdXNhYmxlLlxuICAvLyBTZWUgQi8yMTgwOTYwNFxuICBpZiAoIWlzRm9jdXNhYmxlKGVsKSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGNvbnN0IHR5cGUgPSAoXG4gICAgZWwuZ2V0QXR0cmlidXRlKCdyb2xlJykgfHxcbiAgICAoZWwgYXMgSFRNTElucHV0RWxlbWVudCkudHlwZSB8fFxuICAgIGVsLnRhZ05hbWVcbiAgKS50b1VwcGVyQ2FzZSgpO1xuICBjb25zdCBpc1NwZWNpZmljVHJpZ2dlcktleSA9IElERU5USUZJRVJfVE9fS0VZX1RSSUdHRVJfTUFQUElOR1t0eXBlXSAlIGtleSA9PT0gMDtcbiAgY29uc3QgaXNEZWZhdWx0VHJpZ2dlcktleSA9ICEodHlwZSBpbiBJREVOVElGSUVSX1RPX0tFWV9UUklHR0VSX01BUFBJTkcpICYmIGtleSA9PT0gS2V5Q29kZS5FTlRFUjtcbiAgY29uc3QgaGFzVHlwZSA9IGVsLnRhZ05hbWUudG9VcHBlckNhc2UoKSAhPT0gJ0lOUFVUJyB8fCAhIShlbCBhcyBIVE1MSW5wdXRFbGVtZW50KS50eXBlO1xuICByZXR1cm4gKGlzU3BlY2lmaWNUcmlnZ2VyS2V5IHx8IGlzRGVmYXVsdFRyaWdnZXJLZXkpICYmIGhhc1R5cGU7XG59XG5cbi8qKlxuICogQ2hlY2tzIHdoZXRoZXIgYSBET00gZWxlbWVudCBjYW4gcmVjZWl2ZSBrZXlib2FyZCBmb2N1cy5cbiAqIFRoaXMgY29kZSBpcyBiYXNlZCBvbiBnb29nLmRvbS5pc0ZvY3VzYWJsZSwgYnV0IHNpbXBsaWZpZWQgc2luY2Ugd2Ugc2hvdWxkbid0XG4gKiBjYXJlIGFib3V0IHZpc2liaWxpdHkgaWYgd2UncmUgYWxyZWFkeSBoYW5kbGluZyBhIGtleWJvYXJkIGV2ZW50LlxuICovXG5mdW5jdGlvbiBpc0ZvY3VzYWJsZShlbDogRWxlbWVudCk6IGJvb2xlYW4ge1xuICByZXR1cm4gKFxuICAgIChlbC50YWdOYW1lIGluIE5BVElWRUxZX0ZPQ1VTQUJMRV9FTEVNRU5UUyB8fCBoYXNTcGVjaWZpZWRUYWJJbmRleChlbCkpICYmXG4gICAgIShlbCBhcyBIVE1MSW5wdXRFbGVtZW50KS5kaXNhYmxlZFxuICApO1xufVxuXG4vKipcbiAqIEBwYXJhbSBlbGVtZW50IEVsZW1lbnQgdG8gY2hlY2suXG4gKiBAcmV0dXJuIFdoZXRoZXIgdGhlIGVsZW1lbnQgaGFzIGEgc3BlY2lmaWVkIHRhYiBpbmRleC5cbiAqL1xuZnVuY3Rpb24gaGFzU3BlY2lmaWVkVGFiSW5kZXgoZWxlbWVudDogRWxlbWVudCk6IGJvb2xlYW4ge1xuICAvLyBJRSByZXR1cm5zIDAgZm9yIGFuIHVuc2V0IHRhYkluZGV4LCBzbyB3ZSBtdXN0IHVzZSBnZXRBdHRyaWJ1dGVOb2RlKCksXG4gIC8vIHdoaWNoIHJldHVybnMgYW4gb2JqZWN0IHdpdGggYSAnc3BlY2lmaWVkJyBwcm9wZXJ0eSBpZiB0YWJJbmRleCBpc1xuICAvLyBzcGVjaWZpZWQuICBUaGlzIHdvcmtzIG9uIG90aGVyIGJyb3dzZXJzLCB0b28uXG4gIGNvbnN0IGF0dHJOb2RlID0gZWxlbWVudC5nZXRBdHRyaWJ1dGVOb2RlKCd0YWJpbmRleCcpOyAvLyBNdXN0IGJlIGxvd2VyY2FzZSFcbiAgcmV0dXJuIGF0dHJOb2RlICE9IG51bGwgJiYgYXR0ck5vZGUuc3BlY2lmaWVkO1xufVxuXG4vKiogRWxlbWVudCB0YWduYW1lcyB0aGF0IGFyZSBmb2N1c2FibGUgYnkgZGVmYXVsdC4gKi9cbmNvbnN0IE5BVElWRUxZX0ZPQ1VTQUJMRV9FTEVNRU5UUzoge1trZXk6IHN0cmluZ106IG51bWJlcn0gPSB7XG4gICdBJzogMSxcbiAgJ0lOUFVUJzogMSxcbiAgJ1RFWFRBUkVBJzogMSxcbiAgJ1NFTEVDVCc6IDEsXG4gICdCVVRUT04nOiAxLFxufTtcblxuLyoqIEByZXR1cm4gVHJ1ZSwgaWYgdGhlIFNwYWNlIGtleSB3YXMgcHJlc3NlZC4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc1NwYWNlS2V5RXZlbnQoZTogRXZlbnQpOiBib29sZWFuIHtcbiAgY29uc3Qga2V5ID1cbiAgICAvLyBgd2hpY2hgIGlzIGFuIG9sZCBET00gQVBJLlxuICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTpuby1hbnlcbiAgICAoZSBhcyBhbnkpLndoaWNoIHx8XG4gICAgLy8gYGtleUNvZGVgIGlzIGFuIG9sZCBET00gQVBJLlxuICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTpuby1hbnlcbiAgICAoZSBhcyBhbnkpLmtleUNvZGU7XG4gIGNvbnN0IGVsID0gZ2V0VGFyZ2V0KGUpO1xuICBjb25zdCBlbGVtZW50TmFtZSA9ICgoZWwgYXMgSFRNTElucHV0RWxlbWVudCkudHlwZSB8fCBlbC50YWdOYW1lKS50b1VwcGVyQ2FzZSgpO1xuICByZXR1cm4ga2V5ID09PSBLZXlDb2RlLlNQQUNFICYmIGVsZW1lbnROYW1lICE9PSAnQ0hFQ0tCT1gnO1xufVxuXG4vKipcbiAqIERldGVybWluZXMgd2hldGhlciB0aGUgZXZlbnQgY29ycmVzcG9uZHMgdG8gYSBub24tYnViYmxpbmcgbW91c2VcbiAqIGV2ZW50IHR5cGUgKG1vdXNlZW50ZXIsIG1vdXNlbGVhdmUsIHBvaW50ZXJlbnRlciwgYW5kIHBvaW50ZXJsZWF2ZSkuXG4gKlxuICogRHVyaW5nIG1vdXNlb3ZlciAobW91c2VlbnRlcikgYW5kIHBvaW50ZXJvdmVyIChwb2ludGVyZW50ZXIpLCB0aGVcbiAqIHJlbGF0ZWRUYXJnZXQgaXMgdGhlIGVsZW1lbnQgYmVpbmcgZW50ZXJlZCBmcm9tLiBEdXJpbmcgbW91c2VvdXQgKG1vdXNlbGVhdmUpXG4gKiBhbmQgcG9pbnRlcm91dCAocG9pbnRlcmxlYXZlKSwgdGhlIHJlbGF0ZWRUYXJnZXQgaXMgdGhlIGVsZW1lbnQgYmVpbmcgZXhpdGVkXG4gKiB0by5cbiAqXG4gKiBJbiBib3RoIGNhc2VzLCBpZiByZWxhdGVkVGFyZ2V0IGlzIG91dHNpZGUgdGFyZ2V0LCB0aGVuIHRoZSBjb3JyZXNwb25kaW5nXG4gKiBzcGVjaWFsIGV2ZW50IGhhcyBvY2N1cnJlZCwgb3RoZXJ3aXNlIGl0IGhhc24ndC5cbiAqXG4gKiBAcGFyYW0gZSBUaGUgbW91c2VvdmVyL21vdXNlb3V0IGV2ZW50LlxuICogQHBhcmFtIHR5cGUgVGhlIHR5cGUgb2YgdGhlIG1vdXNlIHNwZWNpYWwgZXZlbnQuXG4gKiBAcGFyYW0gZWxlbWVudCBUaGUgZWxlbWVudCBvbiB3aGljaCB0aGUganNhY3Rpb24gZm9yIHRoZVxuICogICAgIG1vdXNlZW50ZXIvbW91c2VsZWF2ZSBldmVudCBpcyBkZWZpbmVkLlxuICogQHJldHVybiBUcnVlIGlmIHRoZSBldmVudCBpcyBhIG1vdXNlZW50ZXIvbW91c2VsZWF2ZSBldmVudC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzTW91c2VTcGVjaWFsRXZlbnQoZTogRXZlbnQsIHR5cGU6IHN0cmluZywgZWxlbWVudDogRWxlbWVudCk6IGJvb2xlYW4ge1xuICAvLyBgcmVsYXRlZFRhcmdldGAgaXMgYW4gb2xkIERPTSBBUEkuXG4gIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTpuby1hbnlcbiAgY29uc3QgcmVsYXRlZCA9IChlIGFzIGFueSkucmVsYXRlZFRhcmdldCBhcyBOb2RlO1xuXG4gIHJldHVybiAoXG4gICAgKChlLnR5cGUgPT09IEV2ZW50VHlwZS5NT1VTRU9WRVIgJiYgdHlwZSA9PT0gRXZlbnRUeXBlLk1PVVNFRU5URVIpIHx8XG4gICAgICAoZS50eXBlID09PSBFdmVudFR5cGUuTU9VU0VPVVQgJiYgdHlwZSA9PT0gRXZlbnRUeXBlLk1PVVNFTEVBVkUpIHx8XG4gICAgICAoZS50eXBlID09PSBFdmVudFR5cGUuUE9JTlRFUk9WRVIgJiYgdHlwZSA9PT0gRXZlbnRUeXBlLlBPSU5URVJFTlRFUikgfHxcbiAgICAgIChlLnR5cGUgPT09IEV2ZW50VHlwZS5QT0lOVEVST1VUICYmIHR5cGUgPT09IEV2ZW50VHlwZS5QT0lOVEVSTEVBVkUpKSAmJlxuICAgICghcmVsYXRlZCB8fCAocmVsYXRlZCAhPT0gZWxlbWVudCAmJiAhZWxlbWVudC5jb250YWlucyhyZWxhdGVkKSkpXG4gICk7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIG5ldyBFdmVudExpa2Ugb2JqZWN0IGZvciBhIG1vdXNlZW50ZXIvbW91c2VsZWF2ZSBldmVudCB0aGF0J3NcbiAqIGRlcml2ZWQgZnJvbSB0aGUgb3JpZ2luYWwgY29ycmVzcG9uZGluZyBtb3VzZW92ZXIvbW91c2VvdXQgZXZlbnQuXG4gKiBAcGFyYW0gZSBUaGUgZXZlbnQuXG4gKiBAcGFyYW0gdGFyZ2V0IFRoZSBlbGVtZW50IG9uIHdoaWNoIHRoZSBqc2FjdGlvbiBmb3IgdGhlIG1vdXNlZW50ZXIvbW91c2VsZWF2ZVxuICogICAgIGV2ZW50IGlzIGRlZmluZWQuXG4gKiBAcmV0dXJuIEEgbW9kaWZpZWQgZXZlbnQtbGlrZSBvYmplY3QgY29waWVkIGZyb20gdGhlIGV2ZW50IG9iamVjdCBwYXNzZWQgaW50b1xuICogICAgIHRoaXMgZnVuY3Rpb24uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVNb3VzZVNwZWNpYWxFdmVudChlOiBFdmVudCwgdGFyZ2V0OiBFbGVtZW50KTogRXZlbnQge1xuICAvLyBXZSBoYXZlIHRvIGNyZWF0ZSBhIGNvcHkgb2YgdGhlIGV2ZW50IG9iamVjdCBiZWNhdXNlIHdlIG5lZWQgdG8gbXV0YXRlXG4gIC8vIGl0cyBmaWVsZHMuIFdlIGRvIHRoaXMgZm9yIHRoZSBzcGVjaWFsIG1vdXNlIGV2ZW50cyBiZWNhdXNlIHRoZSBldmVudFxuICAvLyB0YXJnZXQgbmVlZHMgdG8gYmUgcmV0YXJnZXRlZCB0byB0aGUgYWN0aW9uIGVsZW1lbnQgcmF0aGVyIHRoYW4gdGhlIHJlYWxcbiAgLy8gZWxlbWVudCAoc2luY2Ugd2UgYXJlIHNpbXVsYXRpbmcgdGhlIHNwZWNpYWwgbW91c2UgZXZlbnRzIHdpdGggbW91c2VvdmVyL1xuICAvLyBtb3VzZW91dCkuXG4gIC8vXG4gIC8vIFNpbmNlIHdlJ3JlIG1ha2luZyBhIGNvcHkgYW55d2F5cywgd2UgbWlnaHQgYXMgd2VsbCBhdHRlbXB0IHRvIGNvbnZlcnRcbiAgLy8gdGhpcyBldmVudCBpbnRvIGEgcHNldWRvLXJlYWwgbW91c2VlbnRlci9tb3VzZWxlYXZlIGV2ZW50IGJ5IGFkanVzdGluZ1xuICAvLyBpdHMgdHlwZS5cbiAgLy9cbiAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOm5vLWFueVxuICBjb25zdCBjb3B5OiB7LXJlYWRvbmx5IFtQIGluIGtleW9mIEV2ZW50XT86IEV2ZW50W1BdfSA9IHt9O1xuICBmb3IgKGNvbnN0IHByb3BlcnR5IGluIGUpIHtcbiAgICBpZiAocHJvcGVydHkgPT09ICdzcmNFbGVtZW50JyB8fCBwcm9wZXJ0eSA9PT0gJ3RhcmdldCcpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICBjb25zdCBrZXkgPSBwcm9wZXJ0eSBhcyBrZXlvZiBFdmVudDtcbiAgICAvLyBNYWtpbmcgYSBjb3B5IHJlcXVpcmVzIGl0ZXJhdGluZyB0aHJvdWdoIGFsbCBwcm9wZXJ0aWVzIG9mIGBFdmVudGAuXG4gICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOm5vLWRpY3QtYWNjZXNzLW9uLXN0cnVjdC10eXBlXG4gICAgY29uc3QgdmFsdWUgPSBlW2tleV07XG4gICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgY29udGludWU7XG4gICAgfVxuICAgIC8vIFZhbHVlIHNob3VsZCBiZSB0aGUgZXhwZWN0ZWQgdHlwZSwgYnV0IHRoZSB2YWx1ZSBvZiBga2V5YCBpcyBub3Qga25vd25cbiAgICAvLyBzdGF0aWNhbGx5LlxuICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTpuby1hbnlcbiAgICBjb3B5W2tleV0gPSB2YWx1ZSBhcyBhbnk7XG4gIH1cbiAgaWYgKGUudHlwZSA9PT0gRXZlbnRUeXBlLk1PVVNFT1ZFUikge1xuICAgIGNvcHlbJ3R5cGUnXSA9IEV2ZW50VHlwZS5NT1VTRUVOVEVSO1xuICB9IGVsc2UgaWYgKGUudHlwZSA9PT0gRXZlbnRUeXBlLk1PVVNFT1VUKSB7XG4gICAgY29weVsndHlwZSddID0gRXZlbnRUeXBlLk1PVVNFTEVBVkU7XG4gIH0gZWxzZSBpZiAoZS50eXBlID09PSBFdmVudFR5cGUuUE9JTlRFUk9WRVIpIHtcbiAgICBjb3B5Wyd0eXBlJ10gPSBFdmVudFR5cGUuUE9JTlRFUkVOVEVSO1xuICB9IGVsc2Uge1xuICAgIGNvcHlbJ3R5cGUnXSA9IEV2ZW50VHlwZS5QT0lOVEVSTEVBVkU7XG4gIH1cbiAgY29weVsndGFyZ2V0J10gPSBjb3B5WydzcmNFbGVtZW50J10gPSB0YXJnZXQ7XG4gIGNvcHlbJ2J1YmJsZXMnXSA9IGZhbHNlO1xuICByZXR1cm4gY29weSBhcyBFdmVudDtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIHRvdWNoIGRhdGEgZXh0cmFjdGVkIGZyb20gdGhlIHRvdWNoIGV2ZW50OiBjbGllbnRYLCBjbGllbnRZLCBzY3JlZW5YXG4gKiBhbmQgc2NyZWVuWS4gSWYgdGhlIGV2ZW50IGhhcyBubyB0b3VjaCBpbmZvcm1hdGlvbiBhdCBhbGwsIHRoZSByZXR1cm5lZFxuICogdmFsdWUgaXMgbnVsbC5cbiAqXG4gKiBUaGUgZmllbGRzIG9mIHRoaXMgT2JqZWN0IGFyZSB1bnF1b3RlZC5cbiAqXG4gKiBAcGFyYW0gZXZlbnQgQSB0b3VjaCBldmVudC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFRvdWNoRGF0YShcbiAgZXZlbnQ6IFRvdWNoRXZlbnQsXG4pOiB7Y2xpZW50WDogbnVtYmVyOyBjbGllbnRZOiBudW1iZXI7IHNjcmVlblg6IG51bWJlcjsgc2NyZWVuWTogbnVtYmVyfSB8IG51bGwge1xuICBjb25zdCB0b3VjaCA9XG4gICAgKGV2ZW50LmNoYW5nZWRUb3VjaGVzICYmIGV2ZW50LmNoYW5nZWRUb3VjaGVzWzBdKSB8fCAoZXZlbnQudG91Y2hlcyAmJiBldmVudC50b3VjaGVzWzBdKTtcbiAgaWYgKCF0b3VjaCkge1xuICAgIHJldHVybiBudWxsO1xuICB9XG4gIHJldHVybiB7XG4gICAgY2xpZW50WDogdG91Y2guY2xpZW50WCxcbiAgICBjbGllbnRZOiB0b3VjaC5jbGllbnRZLFxuICAgIHNjcmVlblg6IHRvdWNoLnNjcmVlblgsXG4gICAgc2NyZWVuWTogdG91Y2guc2NyZWVuWSxcbiAgfTtcbn1cblxuZGVjbGFyZSBpbnRlcmZhY2UgU3ludGhldGljTW91c2VFdmVudCBleHRlbmRzIEV2ZW50IHtcbiAgLy8gUmVkZWNsYXJlZCBmcm9tIEV2ZW50IHRvIGluZGljYXRlIHRoYXQgaXQgaXMgbm90IHJlYWRvbmx5LlxuICBkZWZhdWx0UHJldmVudGVkOiBib29sZWFuO1xuICBvcmlnaW5hbEV2ZW50VHlwZTogc3RyaW5nO1xuICBfcHJvcGFnYXRpb25TdG9wcGVkPzogYm9vbGVhbjtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgbmV3IEV2ZW50TGlrZSBvYmplY3QgZm9yIGEgXCJjbGlja1wiIGV2ZW50IHRoYXQncyBkZXJpdmVkIGZyb20gdGhlXG4gKiBvcmlnaW5hbCBjb3JyZXNwb25kaW5nIFwidG91Y2hlbmRcIiBldmVudCBmb3IgYSBmYXN0LWNsaWNrIGltcGxlbWVudGF0aW9uLlxuICpcbiAqIEl0IHRha2VzIGEgdG91Y2ggZXZlbnQsIGFkZHMgY29tbW9uIGZpZWxkcyBmb3VuZCBpbiBhIGNsaWNrIGV2ZW50IGFuZFxuICogY2hhbmdlcyB0aGUgdHlwZSB0byAnY2xpY2snLCBzbyB0aGF0IHRoZSByZXN1bHRpbmcgZXZlbnQgbG9va3MgbW9yZSBsaWtlXG4gKiBhIHJlYWwgY2xpY2sgZXZlbnQuXG4gKlxuICogQHBhcmFtIGV2ZW50IEEgdG91Y2ggZXZlbnQuXG4gKiBAcmV0dXJuIEEgbW9kaWZpZWQgZXZlbnQtbGlrZSBvYmplY3QgY29waWVkIGZyb20gdGhlIGV2ZW50IG9iamVjdCBwYXNzZWQgaW50b1xuICogICAgIHRoaXMgZnVuY3Rpb24uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZWNyZWF0ZVRvdWNoRXZlbnRBc0NsaWNrKGV2ZW50OiBUb3VjaEV2ZW50KTogTW91c2VFdmVudCB7XG4gIGNvbnN0IGNsaWNrOiB7LXJlYWRvbmx5IFtQIGluIGtleW9mIE1vdXNlRXZlbnRdPzogTW91c2VFdmVudFtQXX0gJiBQYXJ0aWFsPFN5bnRoZXRpY01vdXNlRXZlbnQ+ID1cbiAgICB7fTtcbiAgY2xpY2tbJ29yaWdpbmFsRXZlbnRUeXBlJ10gPSBldmVudC50eXBlO1xuICBjbGlja1sndHlwZSddID0gRXZlbnRUeXBlLkNMSUNLO1xuICBmb3IgKGNvbnN0IHByb3BlcnR5IGluIGV2ZW50KSB7XG4gICAgaWYgKHByb3BlcnR5ID09PSAndHlwZScgfHwgcHJvcGVydHkgPT09ICdzcmNFbGVtZW50Jykge1xuICAgICAgY29udGludWU7XG4gICAgfVxuICAgIGNvbnN0IGtleSA9IHByb3BlcnR5IGFzIGtleW9mIFRvdWNoRXZlbnQ7XG4gICAgLy8gTWFraW5nIGEgY29weSByZXF1aXJlcyBpdGVyYXRpbmcgdGhyb3VnaCBhbGwgcHJvcGVydGllcyBvZiBgVG91Y2hFdmVudGAuXG4gICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOm5vLWRpY3QtYWNjZXNzLW9uLXN0cnVjdC10eXBlXG4gICAgY29uc3QgdmFsdWUgPSBldmVudFtrZXldO1xuICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICAvLyBWYWx1ZSBzaG91bGQgYmUgdGhlIGV4cGVjdGVkIHR5cGUsIGJ1dCB0aGUgdmFsdWUgb2YgYGtleWAgaXMgbm90IGtub3duXG4gICAgLy8gc3RhdGljYWxseS5cbiAgICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6bm8tYW55XG4gICAgY2xpY2tba2V5IGFzIGtleW9mIE1vdXNlRXZlbnRdID0gdmFsdWUgYXMgYW55O1xuICB9XG5cbiAgLy8gRW5zdXJlIHRoYXQgdGhlIGV2ZW50IGhhcyB0aGUgbW9zdCByZWNlbnQgdGltZXN0YW1wLiBUaGlzIHRpbWVzdGFtcFxuICAvLyBtYXkgYmUgdXNlZCBpbiB0aGUgZnV0dXJlIHRvIHZhbGlkYXRlIG9yIGNhbmNlbCBzdWJzZXF1ZW50IGNsaWNrIGV2ZW50cy5cbiAgY2xpY2tbJ3RpbWVTdGFtcCddID0gRGF0ZS5ub3coKTtcblxuICAvLyBFbXVsYXRlIHByZXZlbnREZWZhdWx0IGFuZCBzdG9wUHJvcGFnYXRpb24gYmVoYXZpb3JcbiAgY2xpY2tbJ2RlZmF1bHRQcmV2ZW50ZWQnXSA9IGZhbHNlO1xuICBjbGlja1sncHJldmVudERlZmF1bHQnXSA9IHN5bnRoZXRpY1ByZXZlbnREZWZhdWx0O1xuICBjbGlja1snX3Byb3BhZ2F0aW9uU3RvcHBlZCddID0gZmFsc2U7XG4gIGNsaWNrWydzdG9wUHJvcGFnYXRpb24nXSA9IHN5bnRoZXRpY1N0b3BQcm9wYWdhdGlvbjtcblxuICAvLyBFbXVsYXRlIGNsaWNrIGNvb3JkaW5hdGVzIHVzaW5nIHRvdWNoIGluZm9cbiAgY29uc3QgdG91Y2ggPSBnZXRUb3VjaERhdGEoZXZlbnQpO1xuICBpZiAodG91Y2gpIHtcbiAgICBjbGlja1snY2xpZW50WCddID0gdG91Y2guY2xpZW50WDtcbiAgICBjbGlja1snY2xpZW50WSddID0gdG91Y2guY2xpZW50WTtcbiAgICBjbGlja1snc2NyZWVuWCddID0gdG91Y2guc2NyZWVuWDtcbiAgICBjbGlja1snc2NyZWVuWSddID0gdG91Y2guc2NyZWVuWTtcbiAgfVxuICByZXR1cm4gY2xpY2sgYXMgTW91c2VFdmVudDtcbn1cblxuLyoqXG4gKiBBbiBpbXBsZW1lbnRhdGlvbiBvZiBcInByZXZlbnREZWZhdWx0XCIgZm9yIGEgc3ludGhlc2l6ZWQgZXZlbnQuIFNpbXBseVxuICogc2V0cyBcImRlZmF1bHRQcmV2ZW50ZWRcIiBwcm9wZXJ0eSB0byB0cnVlLlxuICovXG5mdW5jdGlvbiBzeW50aGV0aWNQcmV2ZW50RGVmYXVsdCh0aGlzOiBFdmVudCkge1xuICAodGhpcyBhcyBTeW50aGV0aWNNb3VzZUV2ZW50KS5kZWZhdWx0UHJldmVudGVkID0gdHJ1ZTtcbn1cblxuLyoqXG4gKiBBbiBpbXBsZW1lbnRhdGlvbiBvZiBcInN0b3BQcm9wYWdhdGlvblwiIGZvciBhIHN5bnRoZXNpemVkIGV2ZW50LiBJdCBzaW1wbHlcbiAqIHNldHMgYSBzeW50aGV0aWMgbm9uLXN0YW5kYXJkIFwiX3Byb3BhZ2F0aW9uU3RvcHBlZFwiIHByb3BlcnR5IHRvIHRydWUuXG4gKi9cbmZ1bmN0aW9uIHN5bnRoZXRpY1N0b3BQcm9wYWdhdGlvbih0aGlzOiBFdmVudCkge1xuICAodGhpcyBhcyBTeW50aGV0aWNNb3VzZUV2ZW50KS5fcHJvcGFnYXRpb25TdG9wcGVkID0gdHJ1ZTtcbn1cblxuLyoqXG4gKiBNYXBwaW5nIG9mIEtleWJvYXJkRXZlbnQua2V5IHZhbHVlcyB0b1xuICogS2V5Q29kZSB2YWx1ZXMuXG4gKi9cbmNvbnN0IEFDVElPTl9LRVlfVE9fS0VZQ09ERToge1trZXk6IHN0cmluZ106IG51bWJlcn0gPSB7XG4gICdFbnRlcic6IEtleUNvZGUuRU5URVIsXG4gICcgJzogS2V5Q29kZS5TUEFDRSxcbn07XG5cbi8qKlxuICogTWFwcGluZyBvZiBIVE1MIGVsZW1lbnQgaWRlbnRpZmllcnMgKEFSSUEgcm9sZSwgdHlwZSwgb3IgdGFnTmFtZSkgdG8gdGhlXG4gKiBrZXlzIChlbnRlciBhbmQvb3Igc3BhY2UpIHRoYXQgc2hvdWxkIGFjdGl2YXRlIHRoZW0uIEEgdmFsdWUgb2YgemVybyBtZWFuc1xuICogdGhhdCBib3RoIHNob3VsZCBhY3RpdmF0ZSB0aGVtLlxuICovXG5leHBvcnQgY29uc3QgSURFTlRJRklFUl9UT19LRVlfVFJJR0dFUl9NQVBQSU5HOiB7W2tleTogc3RyaW5nXTogbnVtYmVyfSA9IHtcbiAgJ0EnOiBLZXlDb2RlLkVOVEVSLFxuICAnQlVUVE9OJzogMCxcbiAgJ0NIRUNLQk9YJzogS2V5Q29kZS5TUEFDRSxcbiAgJ0NPTUJPQk9YJzogS2V5Q29kZS5FTlRFUixcbiAgJ0ZJTEUnOiAwLFxuICAnR1JJRENFTEwnOiBLZXlDb2RlLkVOVEVSLFxuICAnTElOSyc6IEtleUNvZGUuRU5URVIsXG4gICdMSVNUQk9YJzogS2V5Q29kZS5FTlRFUixcbiAgJ01FTlUnOiAwLFxuICAnTUVOVUJBUic6IDAsXG4gICdNRU5VSVRFTSc6IDAsXG4gICdNRU5VSVRFTUNIRUNLQk9YJzogMCxcbiAgJ01FTlVJVEVNUkFESU8nOiAwLFxuICAnT1BUSU9OJzogMCxcbiAgJ1JBRElPJzogS2V5Q29kZS5TUEFDRSxcbiAgJ1JBRElPR1JPVVAnOiBLZXlDb2RlLlNQQUNFLFxuICAnUkVTRVQnOiAwLFxuICAnU1VCTUlUJzogMCxcbiAgJ1NXSVRDSCc6IEtleUNvZGUuU1BBQ0UsXG4gICdUQUInOiAwLFxuICAnVFJFRSc6IEtleUNvZGUuRU5URVIsXG4gICdUUkVFSVRFTSc6IEtleUNvZGUuRU5URVIsXG59O1xuXG4vKipcbiAqIFJldHVybnMgd2hldGhlciBvciBub3QgdG8gcHJvY2VzcyBzcGFjZSBiYXNlZCBvbiB0aGUgdHlwZSBvZiB0aGUgZWxlbWVudDtcbiAqIGNoZWNrcyB0byBtYWtlIHN1cmUgdGhhdCB0eXBlIGlzIG5vdCBudWxsLlxuICogQHBhcmFtIGVsZW1lbnQgVGhlIGVsZW1lbnQuXG4gKiBAcmV0dXJuIFdoZXRoZXIgb3Igbm90IHRvIHByb2Nlc3Mgc3BhY2UgYmFzZWQgb24gdHlwZS5cbiAqL1xuZnVuY3Rpb24gcHJvY2Vzc1NwYWNlKGVsZW1lbnQ6IEVsZW1lbnQpOiBib29sZWFuIHtcbiAgY29uc3QgdHlwZSA9IChlbGVtZW50LmdldEF0dHJpYnV0ZSgndHlwZScpIHx8IGVsZW1lbnQudGFnTmFtZSkudG9VcHBlckNhc2UoKTtcbiAgcmV0dXJuIHR5cGUgaW4gUFJPQ0VTU19TUEFDRTtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIHdoZXRoZXIgb3Igbm90IHRoZSBnaXZlbiBlbGVtZW50IGlzIGEgdGV4dCBjb250cm9sLlxuICogQHBhcmFtIGVsIFRoZSBlbGVtZW50LlxuICogQHJldHVybiBXaGV0aGVyIG9yIG5vdCB0aGUgZ2l2ZW4gZWxlbWVudCBpcyBhIHRleHQgY29udHJvbC5cbiAqL1xuZnVuY3Rpb24gaXNUZXh0Q29udHJvbChlbDogRWxlbWVudCk6IGJvb2xlYW4ge1xuICBjb25zdCB0eXBlID0gKGVsLmdldEF0dHJpYnV0ZSgndHlwZScpIHx8IGVsLnRhZ05hbWUpLnRvVXBwZXJDYXNlKCk7XG4gIHJldHVybiB0eXBlIGluIFRFWFRfQ09OVFJPTFM7XG59XG5cbi8qKlxuICogUmV0dXJucyBpZiB0aGUgZ2l2ZW4gZWxlbWVudCBpcyBhIG5hdGl2ZSBIVE1MIGNvbnRyb2wuXG4gKiBAcGFyYW0gZWwgVGhlIGVsZW1lbnQuXG4gKiBAcmV0dXJuIElmIHRoZSBnaXZlbiBlbGVtZW50IGlzIGEgbmF0aXZlIEhUTUwgY29udHJvbC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzTmF0aXZlSFRNTENvbnRyb2woZWw6IEVsZW1lbnQpOiBib29sZWFuIHtcbiAgcmV0dXJuIGVsLnRhZ05hbWUudG9VcHBlckNhc2UoKSBpbiBOQVRJVkVfSFRNTF9DT05UUk9MUztcbn1cblxuLyoqXG4gKiBSZXR1cm5zIGlmIHRoZSBnaXZlbiBlbGVtZW50IGlzIG5hdGl2ZWx5IGFjdGl2YXRhYmxlLiBCcm93c2VycyBlbWl0IGNsaWNrXG4gKiBldmVudHMgZm9yIG5hdGl2ZWx5IGFjdGl2YXRhYmxlIGVsZW1lbnRzLCBldmVuIHdoZW4gYWN0aXZhdGVkIHZpYSBrZXlib2FyZC5cbiAqIEZvciB0aGVzZSBlbGVtZW50cywgd2UgZG9uJ3QgbmVlZCB0byByYWlzZSBhMTF5IGNsaWNrIGV2ZW50cy5cbiAqIEBwYXJhbSBlbCBUaGUgZWxlbWVudC5cbiAqIEByZXR1cm4gSWYgdGhlIGdpdmVuIGVsZW1lbnQgaXMgYSBuYXRpdmUgSFRNTCBjb250cm9sLlxuICovXG5mdW5jdGlvbiBpc05hdGl2ZWx5QWN0aXZhdGFibGUoZWw6IEVsZW1lbnQpOiBib29sZWFuIHtcbiAgcmV0dXJuIChcbiAgICBlbC50YWdOYW1lLnRvVXBwZXJDYXNlKCkgPT09ICdCVVRUT04nIHx8XG4gICAgKCEhKGVsIGFzIEhUTUxJbnB1dEVsZW1lbnQpLnR5cGUgJiYgKGVsIGFzIEhUTUxJbnB1dEVsZW1lbnQpLnR5cGUudG9VcHBlckNhc2UoKSA9PT0gJ0ZJTEUnKVxuICApO1xufVxuXG4vKipcbiAqIEhUTUwgPGlucHV0PiB0eXBlcyAobm90IEFSSUEgcm9sZXMpIHdoaWNoIHdpbGwgYXV0by10cmlnZ2VyIGEgY2xpY2sgZXZlbnQgZm9yXG4gKiB0aGUgU3BhY2Uga2V5LCB3aXRoIHNpZGUtZWZmZWN0cy4gV2Ugd2lsbCBub3QgY2FsbCBwcmV2ZW50RGVmYXVsdCBpZiBzcGFjZSBpc1xuICogcHJlc3NlZCwgbm9yIHdpbGwgd2UgcmFpc2UgYTExeSBjbGljayBldmVudHMuICBGb3IgYWxsIG90aGVyIGVsZW1lbnRzLCB3ZSBjYW5cbiAqIHN1cHByZXNzIHRoZSBkZWZhdWx0IGV2ZW50ICh3aGljaCBoYXMgbm8gZGVzaXJlZCBzaWRlLWVmZmVjdHMpIGFuZCBoYW5kbGUgdGhlXG4gKiBrZXlkb3duIG91cnNlbHZlcy5cbiAqL1xuY29uc3QgUFJPQ0VTU19TUEFDRToge1trZXk6IHN0cmluZ106IGJvb2xlYW59ID0ge1xuICAnQ0hFQ0tCT1gnOiB0cnVlLFxuICAnRklMRSc6IHRydWUsXG4gICdPUFRJT04nOiB0cnVlLFxuICAnUkFESU8nOiB0cnVlLFxufTtcblxuLyoqIFRhZ05hbWVzIGFuZCBJbnB1dCB0eXBlcyBmb3Igd2hpY2ggdG8gbm90IHByb2Nlc3MgZW50ZXIvc3BhY2UgYXMgY2xpY2suICovXG5jb25zdCBURVhUX0NPTlRST0xTOiB7W2tleTogc3RyaW5nXTogYm9vbGVhbn0gPSB7XG4gICdDT0xPUic6IHRydWUsXG4gICdEQVRFJzogdHJ1ZSxcbiAgJ0RBVEVUSU1FJzogdHJ1ZSxcbiAgJ0RBVEVUSU1FLUxPQ0FMJzogdHJ1ZSxcbiAgJ0VNQUlMJzogdHJ1ZSxcbiAgJ01PTlRIJzogdHJ1ZSxcbiAgJ05VTUJFUic6IHRydWUsXG4gICdQQVNTV09SRCc6IHRydWUsXG4gICdSQU5HRSc6IHRydWUsXG4gICdTRUFSQ0gnOiB0cnVlLFxuICAnVEVMJzogdHJ1ZSxcbiAgJ1RFWFQnOiB0cnVlLFxuICAnVEVYVEFSRUEnOiB0cnVlLFxuICAnVElNRSc6IHRydWUsXG4gICdVUkwnOiB0cnVlLFxuICAnV0VFSyc6IHRydWUsXG59O1xuXG4vKiogVGFnTmFtZXMgdGhhdCBhcmUgbmF0aXZlIEhUTUwgY29udHJvbHMuICovXG5jb25zdCBOQVRJVkVfSFRNTF9DT05UUk9MUzoge1trZXk6IHN0cmluZ106IGJvb2xlYW59ID0ge1xuICAnQSc6IHRydWUsXG4gICdBUkVBJzogdHJ1ZSxcbiAgJ0JVVFRPTic6IHRydWUsXG4gICdESUFMT0cnOiB0cnVlLFxuICAnSU1HJzogdHJ1ZSxcbiAgJ0lOUFVUJzogdHJ1ZSxcbiAgJ0xJTksnOiB0cnVlLFxuICAnTUVOVSc6IHRydWUsXG4gICdPUFRHUk9VUCc6IHRydWUsXG4gICdPUFRJT04nOiB0cnVlLFxuICAnUFJPR1JFU1MnOiB0cnVlLFxuICAnU0VMRUNUJzogdHJ1ZSxcbiAgJ1RFWFRBUkVBJzogdHJ1ZSxcbn07XG5cbi8qKiBFeHBvcnRlZCBmb3IgdGVzdGluZy4gKi9cbmV4cG9ydCBjb25zdCB0ZXN0aW5nID0ge1xuICBzZXRJc01hYyh2YWx1ZTogYm9vbGVhbikge1xuICAgIGlzTWFjID0gdmFsdWU7XG4gIH0sXG59O1xuIl19