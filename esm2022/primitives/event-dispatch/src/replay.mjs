/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/**
 * @fileoverview Functions for replaying events by the jsaction
 * Dispatcher.
 * All ts-ignores in this file are due to APIs that are no longer in the browser.
 */
import { createCustomEvent } from './/custom_events';
import * as jsactionEvent from './/event';
import { EventType } from './/event_type';
/**
 * Replays an event.
 */
export function replayEvent(event, targetElement, eventType) {
    triggerEvent(targetElement, createEvent(event, eventType));
}
/**
 * Checks if a given event was triggered by the keyboard.
 * @param eventType The event type.
 * @return Whether it's a keyboard event.
 */
function isKeyboardEvent(eventType) {
    return (eventType === EventType.KEYPRESS ||
        eventType === EventType.KEYDOWN ||
        eventType === EventType.KEYUP);
}
/**
 * Checks if a given event was triggered by the mouse.
 * @param eventType The event type.
 * @return Whether it's a mouse event.
 */
function isMouseEvent(eventType) {
    // TODO: Verify if Drag events should be bound here.
    return (eventType === EventType.CLICK ||
        eventType === EventType.DBLCLICK ||
        eventType === EventType.MOUSEDOWN ||
        eventType === EventType.MOUSEOVER ||
        eventType === EventType.MOUSEOUT ||
        eventType === EventType.MOUSEMOVE);
}
/**
 * Checks if a given event is a general UI event.
 * @param eventType The event type.
 * @return Whether it's a focus event.
 */
function isUiEvent(eventType) {
    // Almost nobody supports the W3C method of creating FocusEvents.
    // For now, we're going to use the UIEvent as a super-interface.
    return (eventType === EventType.FOCUS ||
        eventType === EventType.BLUR ||
        eventType === EventType.FOCUSIN ||
        eventType === EventType.FOCUSOUT ||
        eventType === EventType.SCROLL);
}
/**
 * Create a whitespace-delineated list of modifier keys that should be
 * considered to be active on the event's key. See details at
 * https://developer.mozilla.org/en/DOM/KeyboardEvent.
 * @param alt Alt pressed.
 * @param ctrl Control pressed.
 * @param meta Command pressed (OSX only).
 * @param shift Shift pressed.
 * @return The constructed modifier keys string.
 */
function createKeyboardModifiersList(alt, ctrl, meta, shift) {
    const keys = [];
    if (alt) {
        keys.push('Alt');
    }
    if (ctrl) {
        keys.push('Control');
    }
    if (meta) {
        keys.push('Meta');
    }
    if (shift) {
        keys.push('Shift');
    }
    return keys.join(' ');
}
/**
 * Creates a UI event object for replaying through the DOM.
 * @param original The event to create a new event from.
 * @param opt_eventType The type this event is being handled as by jsaction.
 *     e.g. blur events are handled as focusout
 * @return The event object.
 */
export function createUiEvent(original, opt_eventType) {
    let event;
    if (document.createEvent) {
        const originalUiEvent = original;
        // Event creation as per W3C event model specification.  This codepath
        // is used by most non-IE browsers and also by IE 9 and later.
        event = document.createEvent('UIEvent');
        // On IE and Opera < 12, we must provide non-undefined values to
        // initEvent, otherwise it will fail.
        event.initUIEvent(opt_eventType || originalUiEvent.type, originalUiEvent.bubbles !== undefined ? originalUiEvent.bubbles : true, originalUiEvent.cancelable || false, originalUiEvent.view || window, original.detail || 0);
        // detail
    }
    else {
        // Older versions of IE (up to version 8) do not support the
        // W3C event model. Use the IE specific function instead.
        // Suppressing errors for ts-migration.
        //   TS2339: Property 'createEventObject' does not exist on type 'Document'.
        // @ts-ignore
        event = document.createEventObject();
        event.type = opt_eventType || original.type;
        event.bubbles = original.bubbles !== undefined ? original.bubbles : true;
        event.cancelable = original.cancelable || false;
        event.view = original.view || window;
        event.detail = original.detail || 0;
    }
    // Some focus events also have a nullable relatedTarget value which isn't
    // directly supported in the initUIEvent() method.
    event.relatedTarget = original.relatedTarget || null;
    event.originalTimestamp = original.timeStamp;
    return event;
}
/**
 * Creates a keyboard event object for replaying through the DOM.
 * @param original The event to create a new event from.
 * @param opt_eventType The type this event is being handled as by jsaction.
 *     E.g. a keypress is handled as click in some cases.
 * @return The event object.
 * @suppress {strictMissingProperties} Two definitions of initKeyboardEvent.
 */
export function createKeyboardEvent(original, opt_eventType) {
    let event;
    const keyboardEvent = original;
    if (document.createEvent) {
        // Event creation as per W3C event model specification.  This codepath
        // is used by most non-IE browsers and also by IE 9 and later.
        event = document.createEvent('KeyboardEvent');
        if (event.initKeyboardEvent) {
            if (jsactionEvent.isIe) {
                // IE9+
                // https://docs.microsoft.com/en-us/previous-versions/windows/internet-explorer/ie-developer/platform-apis/ff975945(v=vs.85)
                const modifiers = createKeyboardModifiersList(keyboardEvent.altKey, keyboardEvent.ctrlKey, keyboardEvent.metaKey, keyboardEvent.shiftKey);
                event.initKeyboardEvent(opt_eventType || keyboardEvent.type, true, true, window, keyboardEvent.key, keyboardEvent.location, 
                // Suppressing errors for ts-migration.
                //   TS2345: Argument of type 'string' is not assignable to
                //   parameter of type 'boolean | undefined'.
                // @ts-ignore
                modifiers, keyboardEvent.repeat, 
                // @ts-ignore This doesn't exist
                keyboardEvent.locale);
            }
            else {
                // W3C DOM Level 3 Events model.
                // https://www.w3.org/TR/uievents/#idl-interface-KeyboardEvent-initializers
                event.initKeyboardEvent(opt_eventType || original.type, true, true, window, keyboardEvent.key, keyboardEvent.location, keyboardEvent.ctrlKey, keyboardEvent.altKey, keyboardEvent.shiftKey, keyboardEvent.metaKey);
                Object.defineProperty(event, 'repeat', {
                    get: () => original.repeat,
                    enumerable: true,
                });
                // Add missing 'locale' which is not part of the spec.
                // https://bugs.chromium.org/p/chromium/issues/detail?id=168971
                Object.defineProperty(event, 'locale', {
                    // Suppressing errors for ts-migration.
                    //   TS2339: Property 'locale' does not exist on type 'Event'.
                    // @ts-ignore
                    get: () => original.locale,
                    enumerable: true,
                });
                // Apple WebKit has a non-standard altGraphKey that is not implemented
                // here.
                // https://developer.apple.com/documentation/webkitjs/keyboardevent/1633753-initkeyboardevent
            }
            // Blink and Webkit had a bug that causes the `charCode`, `keyCode`, and
            // `which` properties to always be unset when synthesizing a keyboard
            // event. Details at: https://bugs.webkit.org/show_bug.cgi?id=16735. With
            // these properties being deprecated, the bug has evolved into affecting
            // the `key` property. We work around it by redefining the `key` and
            // deprecated properties; a simple assignment here would fail because the
            // native properties are readonly.
            if (jsactionEvent.isWebKit) {
                if (keyboardEvent.key && event.key === '') {
                    Object.defineProperty(event, 'key', {
                        get: () => keyboardEvent.key,
                        enumerable: true,
                    });
                }
            }
            // Re-implement the deprecated `charCode`, `keyCode` and `which` which
            // are also an issue on IE9+.
            if (jsactionEvent.isWebKit || jsactionEvent.isIe || jsactionEvent.isGecko) {
                Object.defineProperty(event, 'charCode', {
                    get: () => original.charCode,
                    enumerable: true,
                });
                const keyCodeGetter = () => original.keyCode;
                Object.defineProperty(event, 'keyCode', {
                    get: keyCodeGetter,
                    enumerable: true,
                });
                Object.defineProperty(event, 'which', {
                    get: keyCodeGetter,
                    enumerable: true,
                });
            }
        }
        else {
            // Gecko only supports an older/deprecated version from DOM Level 2. See
            // https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/initKeyEvent
            // for details.
            // @ts-ignore ditto
            event.initKeyEvent(opt_eventType || original.type, true, true, window, 
            // Suppressing errors for ts-migration.
            //   TS2339: Property 'ctrlKey' does not exist on type 'Event'.
            // @ts-ignore
            original.ctrlKey, 
            // Suppressing errors for ts-migration.
            //   TS2339: Property 'altKey' does not exist on type 'Event'.
            // @ts-ignore
            original.altKey, 
            // Suppressing errors for ts-migration.
            //   TS2339: Property 'shiftKey' does not exist on type 'Event'.
            // @ts-ignore
            original.shiftKey, 
            // Suppressing errors for ts-migration.
            //   TS2339: Property 'metaKey' does not exist on type 'Event'.
            // @ts-ignore
            original.metaKey, 
            // Suppressing errors for ts-migration.
            //   TS2339: Property 'keyCode' does not exist on type 'Event'.
            // @ts-ignore
            original.keyCode, 
            // Suppressing errors for ts-migration.
            //   TS2339: Property 'charCode' does not exist on type 'Event'.
            // @ts-ignore
            original.charCode);
        }
    }
    else {
        // Older versions of IE (up to version 8) do not support the
        // W3C event model. Use the IE specific function instead.
        // Suppressing errors for ts-migration.
        // @ts-ignore
        event = document.createEventObject();
        event.type = opt_eventType || original.type;
        const originalKeyboardEvent = original;
        event.repeat = originalKeyboardEvent.repeat;
        event.ctrlKey = originalKeyboardEvent.ctrlKey;
        event.altKey = originalKeyboardEvent.altKey;
        event.shiftKey = originalKeyboardEvent.shiftKey;
        event.metaKey = originalKeyboardEvent.metaKey;
        event.key = originalKeyboardEvent.key;
        event.keyCode = originalKeyboardEvent.keyCode;
        event.charCode = originalKeyboardEvent.charCode;
    }
    event.originalTimestamp = original.timeStamp;
    return event;
}
/**
 * Creates a mouse event object for replaying through the DOM.
 * @param original The event to create a new event from.
 * @param opt_eventType The type this event is being handled as by jsaction.
 *     E.g. a keypress is handled as click in some cases.
 * @return The event object.
 */
export function createMouseEvent(original, opt_eventType) {
    let event;
    const originalMouseEvent = original;
    if (document.createEvent) {
        // Event creation as per W3C event model specification.  This codepath
        // is used by most non-IE browsers and also by IE 9 and later.
        event = document.createEvent('MouseEvent');
        // On IE and Opera < 12, we must provide non-undefined values to
        // initMouseEvent, otherwise it will fail.
        event.initMouseEvent(opt_eventType || original.type, true, // canBubble
        true, // cancelable
        window, original.detail || 1, originalMouseEvent.screenX || 0, originalMouseEvent.screenY || 0, originalMouseEvent.clientX || 0, originalMouseEvent.clientY || 0, originalMouseEvent.ctrlKey || false, originalMouseEvent.altKey || false, originalMouseEvent.shiftKey || false, originalMouseEvent.metaKey || false, originalMouseEvent.button || 0, originalMouseEvent.relatedTarget || null);
    }
    else {
        // Older versions of IE (up to version 8) do not support the
        // W3C event model. Use the IE specific function instead.
        // @ts-ignore
        event = document.createEventObject();
        event.type = opt_eventType || original.type;
        event.clientX = originalMouseEvent.clientX;
        event.clientY = originalMouseEvent.clientY;
        event.button = originalMouseEvent.button;
        event.detail = original.detail;
        event.ctrlKey = originalMouseEvent.ctrlKey;
        event.altKey = originalMouseEvent.altKey;
        event.shiftKey = originalMouseEvent.shiftKey;
        event.metaKey = originalMouseEvent.metaKey;
    }
    event.originalTimestamp = original.timeStamp;
    return event;
}
/**
 * Creates a generic event object for replaying through the DOM.
 * @param original The event to create a new event from.
 * @param opt_eventType The type this event is being handled as by jsaction.
 *     E.g. a keypress is handled as click in some cases.
 * @return The event object.
 */
function createGenericEvent(original, opt_eventType) {
    let event;
    if (document.createEvent) {
        // Event creation as per W3C event model specification.  This codepath
        // is used by most non-IE browsers and also by IE 9 and later.
        event = document.createEvent('Event');
        event.initEvent(opt_eventType || original.type, true, true);
    }
    else {
        // Older versions of IE (up to version 8) do not support the
        // W3C event model. Use the IE specific function instead.
        // Suppressing errors for ts-migration.
        //   TS2339: Property 'createEventObject' does not exist on type 'Document'.
        // @ts-ignore
        event = document.createEventObject();
        event.type = opt_eventType || original.type;
    }
    event.originalTimestamp = original.timeStamp;
    return event;
}
/**
 * Creates an event object for replaying through the DOM.
 * NOTE: This function is visible just for testing.  Please don't use
 * it outside JsAction internal testing.
 * TODO: Add support for FocusEvent and WheelEvent.
 * @param base The event to create a new event from.
 * @param opt_eventType The type this event is being handled as by jsaction.
 *     E.g. a keypress is handled as click in some cases.
 * @return The event object.
 */
export function createEvent(base, opt_eventType) {
    const original = base;
    let event;
    let eventType;
    if (original.type === EventType.CUSTOM) {
        eventType = EventType.CUSTOM;
    }
    else {
        eventType = opt_eventType || original.type;
    }
    if (isKeyboardEvent(eventType)) {
        event = createKeyboardEvent(original, opt_eventType);
    }
    else if (isMouseEvent(eventType)) {
        event = createMouseEvent(original, opt_eventType);
    }
    else if (isUiEvent(eventType)) {
        event = createUiEvent(original, opt_eventType);
    }
    else if (eventType === EventType.CUSTOM) {
        event = createCustomEvent(opt_eventType, original['detail']['data'], original['detail']['triggeringEvent']);
        event.originalTimestamp = original.timeStamp;
    }
    else {
        // This ensures we don't send an undefined event object to the replayer.
        event = createGenericEvent(original, opt_eventType);
    }
    return event;
}
/**
 * Sends an event for replay to the DOM.
 * @param target The target for the event.
 * @param event The event object.
 * @return The return value of the event replay, i.e., whether preventDefault()
 *     was called on it.
 */
export function triggerEvent(target, event) {
    if (target.dispatchEvent) {
        return target.dispatchEvent(event);
    }
    else {
        // Suppressing errors for ts-migration.
        //   TS2339: Property 'fireEvent' does not exist on type 'Element'.
        // @ts-ignore
        return target.fireEvent('on' + event.type, event);
    }
}
/** Do not use outiside of testing. */
export const testing = {
    createKeyboardModifiersList,
    createGenericEvent,
    isKeyboardEvent,
    isMouseEvent,
    isUiEvent,
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVwbGF5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9wcmltaXRpdmVzL2V2ZW50LWRpc3BhdGNoL3NyYy9yZXBsYXkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUg7Ozs7R0FJRztBQUVILE9BQU8sRUFBQyxpQkFBaUIsRUFBQyxNQUFNLGtCQUFrQixDQUFDO0FBQ25ELE9BQU8sS0FBSyxhQUFhLE1BQU0sVUFBVSxDQUFDO0FBQzFDLE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFNeEM7O0dBRUc7QUFDSCxNQUFNLFVBQVUsV0FBVyxDQUFDLEtBQVksRUFBRSxhQUFzQixFQUFFLFNBQWtCO0lBQ2xGLFlBQVksQ0FBQyxhQUFhLEVBQUUsV0FBVyxDQUFDLEtBQUssRUFBRSxTQUFTLENBQUMsQ0FBQyxDQUFDO0FBQzdELENBQUM7QUFFRDs7OztHQUlHO0FBQ0gsU0FBUyxlQUFlLENBQUMsU0FBaUI7SUFDeEMsT0FBTyxDQUNMLFNBQVMsS0FBSyxTQUFTLENBQUMsUUFBUTtRQUNoQyxTQUFTLEtBQUssU0FBUyxDQUFDLE9BQU87UUFDL0IsU0FBUyxLQUFLLFNBQVMsQ0FBQyxLQUFLLENBQzlCLENBQUM7QUFDSixDQUFDO0FBRUQ7Ozs7R0FJRztBQUNILFNBQVMsWUFBWSxDQUFDLFNBQWlCO0lBQ3JDLG9EQUFvRDtJQUNwRCxPQUFPLENBQ0wsU0FBUyxLQUFLLFNBQVMsQ0FBQyxLQUFLO1FBQzdCLFNBQVMsS0FBSyxTQUFTLENBQUMsUUFBUTtRQUNoQyxTQUFTLEtBQUssU0FBUyxDQUFDLFNBQVM7UUFDakMsU0FBUyxLQUFLLFNBQVMsQ0FBQyxTQUFTO1FBQ2pDLFNBQVMsS0FBSyxTQUFTLENBQUMsUUFBUTtRQUNoQyxTQUFTLEtBQUssU0FBUyxDQUFDLFNBQVMsQ0FDbEMsQ0FBQztBQUNKLENBQUM7QUFFRDs7OztHQUlHO0FB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QUNILE1BQU0sVUFBVSxZQUFZLENBQUMsTUFBbUIsRUFBRSxLQUFZO0lBQzVELElBQUksTUFBTSxDQUFDLGFBQWEsRUFBRSxDQUFDO1FBQ3pCLE9BQU8sTUFBTSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUNyQyxDQUFDO1NBQU0sQ0FBQztRQUNOLHVDQUF1QztRQUN2QyxtRUFBbUU7UUFDbkUsYUFBYTtRQUNiLE9BQVEsTUFBa0IsQ0FBQyxTQUFTLENBQUMsSUFBSSxHQUFHLEtBQUssQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDakUsQ0FBQztBQUNILENBQUM7QUFFRCxzQ0FBc0M7QUFDdEMsTUFBTSxDQUFDLE1BQU0sT0FBTyxHQUFHO0lBQ3JCLDJCQUEyQjtJQUMzQixrQkFBa0I7SUFDbEIsZUFBZTtJQUNmLFlBQVk7SUFDWixTQUFTO0NBQ1YsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG4vKipcbiAqIEBmaWxlb3ZlcnZpZXcgRnVuY3Rpb25zIGZvciByZXBsYXlpbmcgZXZlbnRzIGJ5IHRoZSBqc2FjdGlvblxuICogRGlzcGF0Y2hlci5cbiAqIEFsbCB0cy1pZ25vcmVzIGluIHRoaXMgZmlsZSBhcmUgZHVlIHRvIEFQSXMgdGhhdCBhcmUgbm8gbG9uZ2VyIGluIHRoZSBicm93c2VyLlxuICovXG5cbmltcG9ydCB7Y3JlYXRlQ3VzdG9tRXZlbnR9IGZyb20gJy4vL2N1c3RvbV9ldmVudHMnO1xuaW1wb3J0ICogYXMganNhY3Rpb25FdmVudCBmcm9tICcuLy9ldmVudCc7XG5pbXBvcnQge0V2ZW50VHlwZX0gZnJvbSAnLi8vZXZlbnRfdHlwZSc7XG5cbnR5cGUgV3JpdGVhYmxlPFQ+ID0ge1xuICAtcmVhZG9ubHkgW1AgaW4ga2V5b2YgVF06IFRbUF07XG59O1xuXG4vKipcbiAqIFJlcGxheXMgYW4gZXZlbnQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZXBsYXlFdmVudChldmVudDogRXZlbnQsIHRhcmdldEVsZW1lbnQ6IEVsZW1lbnQsIGV2ZW50VHlwZT86IHN0cmluZykge1xuICB0cmlnZ2VyRXZlbnQodGFyZ2V0RWxlbWVudCwgY3JlYXRlRXZlbnQoZXZlbnQsIGV2ZW50VHlwZSkpO1xufVxuXG4vKipcbiAqIENoZWNrcyBpZiBhIGdpdmVuIGV2ZW50IHdhcyB0cmlnZ2VyZWQgYnkgdGhlIGtleWJvYXJkLlxuICogQHBhcmFtIGV2ZW50VHlwZSBUaGUgZXZlbnQgdHlwZS5cbiAqIEByZXR1cm4gV2hldGhlciBpdCdzIGEga2V5Ym9hcmQgZXZlbnQuXG4gKi9cbmZ1bmN0aW9uIGlzS2V5Ym9hcmRFdmVudChldmVudFR5cGU6IHN0cmluZyk6IGJvb2xlYW4ge1xuICByZXR1cm4gKFxuICAgIGV2ZW50VHlwZSA9PT0gRXZlbnRUeXBlLktFWVBSRVNTIHx8XG4gICAgZXZlbnRUeXBlID09PSBFdmVudFR5cGUuS0VZRE9XTiB8fFxuICAgIGV2ZW50VHlwZSA9PT0gRXZlbnRUeXBlLktFWVVQXG4gICk7XG59XG5cbi8qKlxuICogQ2hlY2tzIGlmIGEgZ2l2ZW4gZXZlbnQgd2FzIHRyaWdnZXJlZCBieSB0aGUgbW91c2UuXG4gKiBAcGFyYW0gZXZlbnRUeXBlIFRoZSBldmVudCB0eXBlLlxuICogQHJldHVybiBXaGV0aGVyIGl0J3MgYSBtb3VzZSBldmVudC5cbiAqL1xuZnVuY3Rpb24gaXNNb3VzZUV2ZW50KGV2ZW50VHlwZTogc3RyaW5nKTogYm9vbGVhbiB7XG4gIC8vIFRPRE86IFZlcmlmeSBpZiBEcmFnIGV2ZW50cyBzaG91bGQgYmUgYm91bmQgaGVyZS5cbiAgcmV0dXJuIChcbiAgICBldmVudFR5cGUgPT09IEV2ZW50VHlwZS5DTElDSyB8fFxuICAgIGV2ZW50VHlwZSA9PT0gRXZlbnRUeXBlLkRCTENMSUNLIHx8XG4gICAgZXZlbnRUeXBlID09PSBFdmVudFR5cGUuTU9VU0VET1dOIHx8XG4gICAgZXZlbnRUeXBlID09PSBFdmVudFR5cGUuTU9VU0VPVkVSIHx8XG4gICAgZXZlbnRUeXBlID09PSBFdmVudFR5cGUuTU9VU0VPVVQgfHxcbiAgICBldmVudFR5cGUgPT09IEV2ZW50VHlwZS5NT1VTRU1PVkVcbiAgKTtcbn1cblxuLyoqXG4gKiBDaGVja3MgaWYgYSBnaXZlbiBldmVudCBpcyBhIGdlbmVyYWwgVUkgZXZlbnQuXG4gKiBAcGFyYW0gZXZlbnRUeXBlIFRoZSBldmVudCB0eXBlLlxuICogQHJldHVybiBXaGV0aGVyIGl0J3MgYSBmb2N1cyBldmVudC5cbiAqL1xuZnVuY3Rpb24gaXNVaUV2ZW50KGV2ZW50VHlwZTogc3RyaW5nKTogYm9vbGVhbiB7XG4gIC8vIEFsbW9zdCBub2JvZHkgc3VwcG9ydHMgdGhlIFczQyBtZXRob2Qgb2YgY3JlYXRpbmcgRm9jdXNFdmVudHMuXG4gIC8vIEZvciBub3csIHdlJ3JlIGdvaW5nIHRvIHVzZSB0aGUgVUlFdmVudCBhcyBhIHN1cGVyLWludGVyZmFjZS5cbiAgcmV0dXJuIChcbiAgICBldmVudFR5cGUgPT09IEV2ZW50VHlwZS5GT0NVUyB8fFxuICAgIGV2ZW50VHlwZSA9PT0gRXZlbnRUeXBlLkJMVVIgfHxcbiAgICBldmVudFR5cGUgPT09IEV2ZW50VHlwZS5GT0NVU0lOIHx8XG4gICAgZXZlbnRUeXBlID09PSBFdmVudFR5cGUuRk9DVVNPVVQgfHxcbiAgICBldmVudFR5cGUgPT09IEV2ZW50VHlwZS5TQ1JPTExcbiAgKTtcbn1cblxuLyoqXG4gKiBDcmVhdGUgYSB3aGl0ZXNwYWNlLWRlbGluZWF0ZWQgbGlzdCBvZiBtb2RpZmllciBrZXlzIHRoYXQgc2hvdWxkIGJlXG4gKiBjb25zaWRlcmVkIHRvIGJlIGFjdGl2ZSBvbiB0aGUgZXZlbnQncyBrZXkuIFNlZSBkZXRhaWxzIGF0XG4gKiBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi9ET00vS2V5Ym9hcmRFdmVudC5cbiAqIEBwYXJhbSBhbHQgQWx0IHByZXNzZWQuXG4gKiBAcGFyYW0gY3RybCBDb250cm9sIHByZXNzZWQuXG4gKiBAcGFyYW0gbWV0YSBDb21tYW5kIHByZXNzZWQgKE9TWCBvbmx5KS5cbiAqIEBwYXJhbSBzaGlmdCBTaGlmdCBwcmVzc2VkLlxuICogQHJldHVybiBUaGUgY29uc3RydWN0ZWQgbW9kaWZpZXIga2V5cyBzdHJpbmcuXG4gKi9cbmZ1bmN0aW9uIGNyZWF0ZUtleWJvYXJkTW9kaWZpZXJzTGlzdChcbiAgYWx0OiBib29sZWFuLFxuICBjdHJsOiBib29sZWFuLFxuICBtZXRhOiBib29sZWFuLFxuICBzaGlmdDogYm9vbGVhbixcbik6IHN0cmluZyB7XG4gIGNvbnN0IGtleXMgPSBbXTtcbiAgaWYgKGFsdCkge1xuICAgIGtleXMucHVzaCgnQWx0Jyk7XG4gIH1cbiAgaWYgKGN0cmwpIHtcbiAgICBrZXlzLnB1c2goJ0NvbnRyb2wnKTtcbiAgfVxuICBpZiAobWV0YSkge1xuICAgIGtleXMucHVzaCgnTWV0YScpO1xuICB9XG4gIGlmIChzaGlmdCkge1xuICAgIGtleXMucHVzaCgnU2hpZnQnKTtcbiAgfVxuICByZXR1cm4ga2V5cy5qb2luKCcgJyk7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIFVJIGV2ZW50IG9iamVjdCBmb3IgcmVwbGF5aW5nIHRocm91Z2ggdGhlIERPTS5cbiAqIEBwYXJhbSBvcmlnaW5hbCBUaGUgZXZlbnQgdG8gY3JlYXRlIGEgbmV3IGV2ZW50IGZyb20uXG4gKiBAcGFyYW0gb3B0X2V2ZW50VHlwZSBUaGUgdHlwZSB0aGlzIGV2ZW50IGlzIGJlaW5nIGhhbmRsZWQgYXMgYnkganNhY3Rpb24uXG4gKiAgICAgZS5nLiBibHVyIGV2ZW50cyBhcmUgaGFuZGxlZCBhcyBmb2N1c291dFxuICogQHJldHVybiBUaGUgZXZlbnQgb2JqZWN0LlxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlVWlFdmVudChvcmlnaW5hbDogRXZlbnQsIG9wdF9ldmVudFR5cGU/OiBzdHJpbmcpOiBFdmVudCB7XG4gIGxldCBldmVudDogV3JpdGVhYmxlPFVJRXZlbnQ+ICYge29yaWdpbmFsVGltZXN0YW1wPzogRE9NSGlnaFJlc1RpbWVTdGFtcH07XG4gIGlmIChkb2N1bWVudC5jcmVhdGVFdmVudCkge1xuICAgIGNvbnN0IG9yaWdpbmFsVWlFdmVudCA9IG9yaWdpbmFsIGFzIFVJRXZlbnQ7XG4gICAgLy8gRXZlbnQgY3JlYXRpb24gYXMgcGVyIFczQyBldmVudCBtb2RlbCBzcGVjaWZpY2F0aW9uLiAgVGhpcyBjb2RlcGF0aFxuICAgIC8vIGlzIHVzZWQgYnkgbW9zdCBub24tSUUgYnJvd3NlcnMgYW5kIGFsc28gYnkgSUUgOSBhbmQgbGF0ZXIuXG4gICAgZXZlbnQgPSBkb2N1bWVudC5jcmVhdGVFdmVudCgnVUlFdmVudCcpO1xuICAgIC8vIE9uIElFIGFuZCBPcGVyYSA8IDEyLCB3ZSBtdXN0IHByb3ZpZGUgbm9uLXVuZGVmaW5lZCB2YWx1ZXMgdG9cbiAgICAvLyBpbml0RXZlbnQsIG90aGVyd2lzZSBpdCB3aWxsIGZhaWwuXG4gICAgZXZlbnQuaW5pdFVJRXZlbnQoXG4gICAgICBvcHRfZXZlbnRUeXBlIHx8IG9yaWdpbmFsVWlFdmVudC50eXBlLFxuICAgICAgb3JpZ2luYWxVaUV2ZW50LmJ1YmJsZXMgIT09IHVuZGVmaW5lZCA/IG9yaWdpbmFsVWlFdmVudC5idWJibGVzIDogdHJ1ZSxcbiAgICAgIG9yaWdpbmFsVWlFdmVudC5jYW5jZWxhYmxlIHx8IGZhbHNlLFxuICAgICAgb3JpZ2luYWxVaUV2ZW50LnZpZXcgfHwgd2luZG93LFxuICAgICAgKG9yaWdpbmFsIGFzIEN1c3RvbUV2ZW50KS5kZXRhaWwgfHwgMCxcbiAgICApO1xuICAgIC8vIGRldGFpbFxuICB9IGVsc2Uge1xuICAgIC8vIE9sZGVyIHZlcnNpb25zIG9mIElFICh1cCB0byB2ZXJzaW9uIDgpIGRvIG5vdCBzdXBwb3J0IHRoZVxuICAgIC8vIFczQyBldmVudCBtb2RlbC4gVXNlIHRoZSBJRSBzcGVjaWZpYyBmdW5jdGlvbiBpbnN0ZWFkLlxuICAgIC8vIFN1cHByZXNzaW5nIGVycm9ycyBmb3IgdHMtbWlncmF0aW9uLlxuICAgIC8vICAgVFMyMzM5OiBQcm9wZXJ0eSAnY3JlYXRlRXZlbnRPYmplY3QnIGRvZXMgbm90IGV4aXN0IG9uIHR5cGUgJ0RvY3VtZW50Jy5cbiAgICAvLyBAdHMtaWdub3JlXG4gICAgZXZlbnQgPSBkb2N1bWVudC5jcmVhdGVFdmVudE9iamVjdCgpO1xuICAgIGV2ZW50LnR5cGUgPSBvcHRfZXZlbnRUeXBlIHx8IG9yaWdpbmFsLnR5cGU7XG4gICAgZXZlbnQuYnViYmxlcyA9IG9yaWdpbmFsLmJ1YmJsZXMgIT09IHVuZGVmaW5lZCA/IG9yaWdpbmFsLmJ1YmJsZXMgOiB0cnVlO1xuICAgIGV2ZW50LmNhbmNlbGFibGUgPSBvcmlnaW5hbC5jYW5jZWxhYmxlIHx8IGZhbHNlO1xuICAgIGV2ZW50LnZpZXcgPSAob3JpZ2luYWwgYXMgV3JpdGVhYmxlPFVJRXZlbnQ+KS52aWV3IHx8IHdpbmRvdztcbiAgICBldmVudC5kZXRhaWwgPSAob3JpZ2luYWwgYXMgQ3VzdG9tRXZlbnQpLmRldGFpbCB8fCAwO1xuICB9XG4gIC8vIFNvbWUgZm9jdXMgZXZlbnRzIGFsc28gaGF2ZSBhIG51bGxhYmxlIHJlbGF0ZWRUYXJnZXQgdmFsdWUgd2hpY2ggaXNuJ3RcbiAgLy8gZGlyZWN0bHkgc3VwcG9ydGVkIGluIHRoZSBpbml0VUlFdmVudCgpIG1ldGhvZC5cbiAgKGV2ZW50IGFzIFdyaXRlYWJsZTxGb2N1c0V2ZW50PikucmVsYXRlZFRhcmdldCA9IChvcmlnaW5hbCBhcyBGb2N1c0V2ZW50KS5yZWxhdGVkVGFyZ2V0IHx8IG51bGw7XG4gIGV2ZW50Lm9yaWdpbmFsVGltZXN0YW1wID0gb3JpZ2luYWwudGltZVN0YW1wO1xuICByZXR1cm4gZXZlbnQ7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIGtleWJvYXJkIGV2ZW50IG9iamVjdCBmb3IgcmVwbGF5aW5nIHRocm91Z2ggdGhlIERPTS5cbiAqIEBwYXJhbSBvcmlnaW5hbCBUaGUgZXZlbnQgdG8gY3JlYXRlIGEgbmV3IGV2ZW50IGZyb20uXG4gKiBAcGFyYW0gb3B0X2V2ZW50VHlwZSBUaGUgdHlwZSB0aGlzIGV2ZW50IGlzIGJlaW5nIGhhbmRsZWQgYXMgYnkganNhY3Rpb24uXG4gKiAgICAgRS5nLiBhIGtleXByZXNzIGlzIGhhbmRsZWQgYXMgY2xpY2sgaW4gc29tZSBjYXNlcy5cbiAqIEByZXR1cm4gVGhlIGV2ZW50IG9iamVjdC5cbiAqIEBzdXBwcmVzcyB7c3RyaWN0TWlzc2luZ1Byb3BlcnRpZXN9IFR3byBkZWZpbml0aW9ucyBvZiBpbml0S2V5Ym9hcmRFdmVudC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUtleWJvYXJkRXZlbnQob3JpZ2luYWw6IEV2ZW50LCBvcHRfZXZlbnRUeXBlPzogc3RyaW5nKTogRXZlbnQge1xuICBsZXQgZXZlbnQ7XG4gIGNvbnN0IGtleWJvYXJkRXZlbnQgPSBvcmlnaW5hbCBhcyBLZXlib2FyZEV2ZW50O1xuICBpZiAoZG9jdW1lbnQuY3JlYXRlRXZlbnQpIHtcbiAgICAvLyBFdmVudCBjcmVhdGlvbiBhcyBwZXIgVzNDIGV2ZW50IG1vZGVsIHNwZWNpZmljYXRpb24uICBUaGlzIGNvZGVwYXRoXG4gICAgLy8gaXMgdXNlZCBieSBtb3N0IG5vbi1JRSBicm93c2VycyBhbmQgYWxzbyBieSBJRSA5IGFuZCBsYXRlci5cbiAgICBldmVudCA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50KCdLZXlib2FyZEV2ZW50Jyk7XG4gICAgaWYgKGV2ZW50LmluaXRLZXlib2FyZEV2ZW50KSB7XG4gICAgICBpZiAoanNhY3Rpb25FdmVudC5pc0llKSB7XG4gICAgICAgIC8vIElFOStcbiAgICAgICAgLy8gaHR0cHM6Ly9kb2NzLm1pY3Jvc29mdC5jb20vZW4tdXMvcHJldmlvdXMtdmVyc2lvbnMvd2luZG93cy9pbnRlcm5ldC1leHBsb3Jlci9pZS1kZXZlbG9wZXIvcGxhdGZvcm0tYXBpcy9mZjk3NTk0NSh2PXZzLjg1KVxuICAgICAgICBjb25zdCBtb2RpZmllcnMgPSBjcmVhdGVLZXlib2FyZE1vZGlmaWVyc0xpc3QoXG4gICAgICAgICAga2V5Ym9hcmRFdmVudC5hbHRLZXksXG4gICAgICAgICAga2V5Ym9hcmRFdmVudC5jdHJsS2V5LFxuICAgICAgICAgIGtleWJvYXJkRXZlbnQubWV0YUtleSxcbiAgICAgICAgICBrZXlib2FyZEV2ZW50LnNoaWZ0S2V5LFxuICAgICAgICApO1xuICAgICAgICBldmVudC5pbml0S2V5Ym9hcmRFdmVudChcbiAgICAgICAgICBvcHRfZXZlbnRUeXBlIHx8IGtleWJvYXJkRXZlbnQudHlwZSxcbiAgICAgICAgICB0cnVlLFxuICAgICAgICAgIHRydWUsXG4gICAgICAgICAgd2luZG93LFxuICAgICAgICAgIGtleWJvYXJkRXZlbnQua2V5LFxuICAgICAgICAgIGtleWJvYXJkRXZlbnQubG9jYXRpb24sXG4gICAgICAgICAgLy8gU3VwcHJlc3NpbmcgZXJyb3JzIGZvciB0cy1taWdyYXRpb24uXG4gICAgICAgICAgLy8gICBUUzIzNDU6IEFyZ3VtZW50IG9mIHR5cGUgJ3N0cmluZycgaXMgbm90IGFzc2lnbmFibGUgdG9cbiAgICAgICAgICAvLyAgIHBhcmFtZXRlciBvZiB0eXBlICdib29sZWFuIHwgdW5kZWZpbmVkJy5cbiAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgbW9kaWZpZXJzLFxuICAgICAgICAgIGtleWJvYXJkRXZlbnQucmVwZWF0LFxuICAgICAgICAgIC8vIEB0cy1pZ25vcmUgVGhpcyBkb2Vzbid0IGV4aXN0XG4gICAgICAgICAga2V5Ym9hcmRFdmVudC5sb2NhbGUsXG4gICAgICAgICk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBXM0MgRE9NIExldmVsIDMgRXZlbnRzIG1vZGVsLlxuICAgICAgICAvLyBodHRwczovL3d3dy53My5vcmcvVFIvdWlldmVudHMvI2lkbC1pbnRlcmZhY2UtS2V5Ym9hcmRFdmVudC1pbml0aWFsaXplcnNcbiAgICAgICAgZXZlbnQuaW5pdEtleWJvYXJkRXZlbnQoXG4gICAgICAgICAgb3B0X2V2ZW50VHlwZSB8fCBvcmlnaW5hbC50eXBlLFxuICAgICAgICAgIHRydWUsXG4gICAgICAgICAgdHJ1ZSxcbiAgICAgICAgICB3aW5kb3csXG4gICAgICAgICAga2V5Ym9hcmRFdmVudC5rZXksXG4gICAgICAgICAga2V5Ym9hcmRFdmVudC5sb2NhdGlvbixcbiAgICAgICAgICBrZXlib2FyZEV2ZW50LmN0cmxLZXksXG4gICAgICAgICAga2V5Ym9hcmRFdmVudC5hbHRLZXksXG4gICAgICAgICAga2V5Ym9hcmRFdmVudC5zaGlmdEtleSxcbiAgICAgICAgICBrZXlib2FyZEV2ZW50Lm1ldGFLZXksXG4gICAgICAgICk7XG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShldmVudCwgJ3JlcGVhdCcsIHtcbiAgICAgICAgICBnZXQ6ICgpID0+IChvcmlnaW5hbCBhcyBLZXlib2FyZEV2ZW50KS5yZXBlYXQsXG4gICAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgfSk7XG4gICAgICAgIC8vIEFkZCBtaXNzaW5nICdsb2NhbGUnIHdoaWNoIGlzIG5vdCBwYXJ0IG9mIHRoZSBzcGVjLlxuICAgICAgICAvLyBodHRwczovL2J1Z3MuY2hyb21pdW0ub3JnL3AvY2hyb21pdW0vaXNzdWVzL2RldGFpbD9pZD0xNjg5NzFcbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGV2ZW50LCAnbG9jYWxlJywge1xuICAgICAgICAgIC8vIFN1cHByZXNzaW5nIGVycm9ycyBmb3IgdHMtbWlncmF0aW9uLlxuICAgICAgICAgIC8vICAgVFMyMzM5OiBQcm9wZXJ0eSAnbG9jYWxlJyBkb2VzIG5vdCBleGlzdCBvbiB0eXBlICdFdmVudCcuXG4gICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgIGdldDogKCkgPT4gb3JpZ2luYWwubG9jYWxlLFxuICAgICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIH0pO1xuICAgICAgICAvLyBBcHBsZSBXZWJLaXQgaGFzIGEgbm9uLXN0YW5kYXJkIGFsdEdyYXBoS2V5IHRoYXQgaXMgbm90IGltcGxlbWVudGVkXG4gICAgICAgIC8vIGhlcmUuXG4gICAgICAgIC8vIGh0dHBzOi8vZGV2ZWxvcGVyLmFwcGxlLmNvbS9kb2N1bWVudGF0aW9uL3dlYmtpdGpzL2tleWJvYXJkZXZlbnQvMTYzMzc1My1pbml0a2V5Ym9hcmRldmVudFxuICAgICAgfVxuICAgICAgLy8gQmxpbmsgYW5kIFdlYmtpdCBoYWQgYSBidWcgdGhhdCBjYXVzZXMgdGhlIGBjaGFyQ29kZWAsIGBrZXlDb2RlYCwgYW5kXG4gICAgICAvLyBgd2hpY2hgIHByb3BlcnRpZXMgdG8gYWx3YXlzIGJlIHVuc2V0IHdoZW4gc3ludGhlc2l6aW5nIGEga2V5Ym9hcmRcbiAgICAgIC8vIGV2ZW50LiBEZXRhaWxzIGF0OiBodHRwczovL2J1Z3Mud2Via2l0Lm9yZy9zaG93X2J1Zy5jZ2k/aWQ9MTY3MzUuIFdpdGhcbiAgICAgIC8vIHRoZXNlIHByb3BlcnRpZXMgYmVpbmcgZGVwcmVjYXRlZCwgdGhlIGJ1ZyBoYXMgZXZvbHZlZCBpbnRvIGFmZmVjdGluZ1xuICAgICAgLy8gdGhlIGBrZXlgIHByb3BlcnR5LiBXZSB3b3JrIGFyb3VuZCBpdCBieSByZWRlZmluaW5nIHRoZSBga2V5YCBhbmRcbiAgICAgIC8vIGRlcHJlY2F0ZWQgcHJvcGVydGllczsgYSBzaW1wbGUgYXNzaWdubWVudCBoZXJlIHdvdWxkIGZhaWwgYmVjYXVzZSB0aGVcbiAgICAgIC8vIG5hdGl2ZSBwcm9wZXJ0aWVzIGFyZSByZWFkb25seS5cbiAgICAgIGlmIChqc2FjdGlvbkV2ZW50LmlzV2ViS2l0KSB7XG4gICAgICAgIGlmIChrZXlib2FyZEV2ZW50LmtleSAmJiBldmVudC5rZXkgPT09ICcnKSB7XG4gICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGV2ZW50LCAna2V5Jywge1xuICAgICAgICAgICAgZ2V0OiAoKSA9PiBrZXlib2FyZEV2ZW50LmtleSxcbiAgICAgICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIC8vIFJlLWltcGxlbWVudCB0aGUgZGVwcmVjYXRlZCBgY2hhckNvZGVgLCBga2V5Q29kZWAgYW5kIGB3aGljaGAgd2hpY2hcbiAgICAgIC8vIGFyZSBhbHNvIGFuIGlzc3VlIG9uIElFOSsuXG4gICAgICBpZiAoanNhY3Rpb25FdmVudC5pc1dlYktpdCB8fCBqc2FjdGlvbkV2ZW50LmlzSWUgfHwganNhY3Rpb25FdmVudC5pc0dlY2tvKSB7XG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShldmVudCwgJ2NoYXJDb2RlJywge1xuICAgICAgICAgIGdldDogKCkgPT4gKG9yaWdpbmFsIGFzIEtleWJvYXJkRXZlbnQpLmNoYXJDb2RlLFxuICAgICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIH0pO1xuICAgICAgICBjb25zdCBrZXlDb2RlR2V0dGVyID0gKCkgPT4gKG9yaWdpbmFsIGFzIEtleWJvYXJkRXZlbnQpLmtleUNvZGU7XG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShldmVudCwgJ2tleUNvZGUnLCB7XG4gICAgICAgICAgZ2V0OiBrZXlDb2RlR2V0dGVyLFxuICAgICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIH0pO1xuICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoZXZlbnQsICd3aGljaCcsIHtcbiAgICAgICAgICBnZXQ6IGtleUNvZGVHZXR0ZXIsXG4gICAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIEdlY2tvIG9ubHkgc3VwcG9ydHMgYW4gb2xkZXIvZGVwcmVjYXRlZCB2ZXJzaW9uIGZyb20gRE9NIExldmVsIDIuIFNlZVxuICAgICAgLy8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL0tleWJvYXJkRXZlbnQvaW5pdEtleUV2ZW50XG4gICAgICAvLyBmb3IgZGV0YWlscy5cbiAgICAgIC8vIEB0cy1pZ25vcmUgZGl0dG9cbiAgICAgIGV2ZW50LmluaXRLZXlFdmVudChcbiAgICAgICAgb3B0X2V2ZW50VHlwZSB8fCBvcmlnaW5hbC50eXBlLFxuICAgICAgICB0cnVlLFxuICAgICAgICB0cnVlLFxuICAgICAgICB3aW5kb3csXG4gICAgICAgIC8vIFN1cHByZXNzaW5nIGVycm9ycyBmb3IgdHMtbWlncmF0aW9uLlxuICAgICAgICAvLyAgIFRTMjMzOTogUHJvcGVydHkgJ2N0cmxLZXknIGRvZXMgbm90IGV4aXN0IG9uIHR5cGUgJ0V2ZW50Jy5cbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICBvcmlnaW5hbC5jdHJsS2V5LFxuICAgICAgICAvLyBTdXBwcmVzc2luZyBlcnJvcnMgZm9yIHRzLW1pZ3JhdGlvbi5cbiAgICAgICAgLy8gICBUUzIzMzk6IFByb3BlcnR5ICdhbHRLZXknIGRvZXMgbm90IGV4aXN0IG9uIHR5cGUgJ0V2ZW50Jy5cbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICBvcmlnaW5hbC5hbHRLZXksXG4gICAgICAgIC8vIFN1cHByZXNzaW5nIGVycm9ycyBmb3IgdHMtbWlncmF0aW9uLlxuICAgICAgICAvLyAgIFRTMjMzOTogUHJvcGVydHkgJ3NoaWZ0S2V5JyBkb2VzIG5vdCBleGlzdCBvbiB0eXBlICdFdmVudCcuXG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgb3JpZ2luYWwuc2hpZnRLZXksXG4gICAgICAgIC8vIFN1cHByZXNzaW5nIGVycm9ycyBmb3IgdHMtbWlncmF0aW9uLlxuICAgICAgICAvLyAgIFRTMjMzOTogUHJvcGVydHkgJ21ldGFLZXknIGRvZXMgbm90IGV4aXN0IG9uIHR5cGUgJ0V2ZW50Jy5cbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICBvcmlnaW5hbC5tZXRhS2V5LFxuICAgICAgICAvLyBTdXBwcmVzc2luZyBlcnJvcnMgZm9yIHRzLW1pZ3JhdGlvbi5cbiAgICAgICAgLy8gICBUUzIzMzk6IFByb3BlcnR5ICdrZXlDb2RlJyBkb2VzIG5vdCBleGlzdCBvbiB0eXBlICdFdmVudCcuXG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgb3JpZ2luYWwua2V5Q29kZSxcbiAgICAgICAgLy8gU3VwcHJlc3NpbmcgZXJyb3JzIGZvciB0cy1taWdyYXRpb24uXG4gICAgICAgIC8vICAgVFMyMzM5OiBQcm9wZXJ0eSAnY2hhckNvZGUnIGRvZXMgbm90IGV4aXN0IG9uIHR5cGUgJ0V2ZW50Jy5cbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICBvcmlnaW5hbC5jaGFyQ29kZSxcbiAgICAgICk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIC8vIE9sZGVyIHZlcnNpb25zIG9mIElFICh1cCB0byB2ZXJzaW9uIDgpIGRvIG5vdCBzdXBwb3J0IHRoZVxuICAgIC8vIFczQyBldmVudCBtb2RlbC4gVXNlIHRoZSBJRSBzcGVjaWZpYyBmdW5jdGlvbiBpbnN0ZWFkLlxuICAgIC8vIFN1cHByZXNzaW5nIGVycm9ycyBmb3IgdHMtbWlncmF0aW9uLlxuICAgIC8vIEB0cy1pZ25vcmVcbiAgICBldmVudCA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50T2JqZWN0KCk7XG4gICAgZXZlbnQudHlwZSA9IG9wdF9ldmVudFR5cGUgfHwgb3JpZ2luYWwudHlwZTtcbiAgICBjb25zdCBvcmlnaW5hbEtleWJvYXJkRXZlbnQgPSBvcmlnaW5hbCBhcyBLZXlib2FyZEV2ZW50O1xuICAgIGV2ZW50LnJlcGVhdCA9IG9yaWdpbmFsS2V5Ym9hcmRFdmVudC5yZXBlYXQ7XG4gICAgZXZlbnQuY3RybEtleSA9IG9yaWdpbmFsS2V5Ym9hcmRFdmVudC5jdHJsS2V5O1xuICAgIGV2ZW50LmFsdEtleSA9IG9yaWdpbmFsS2V5Ym9hcmRFdmVudC5hbHRLZXk7XG4gICAgZXZlbnQuc2hpZnRLZXkgPSBvcmlnaW5hbEtleWJvYXJkRXZlbnQuc2hpZnRLZXk7XG4gICAgZXZlbnQubWV0YUtleSA9IG9yaWdpbmFsS2V5Ym9hcmRFdmVudC5tZXRhS2V5O1xuICAgIGV2ZW50LmtleSA9IG9yaWdpbmFsS2V5Ym9hcmRFdmVudC5rZXk7XG4gICAgZXZlbnQua2V5Q29kZSA9IG9yaWdpbmFsS2V5Ym9hcmRFdmVudC5rZXlDb2RlO1xuICAgIGV2ZW50LmNoYXJDb2RlID0gb3JpZ2luYWxLZXlib2FyZEV2ZW50LmNoYXJDb2RlO1xuICB9XG4gIGV2ZW50Lm9yaWdpbmFsVGltZXN0YW1wID0gb3JpZ2luYWwudGltZVN0YW1wO1xuICByZXR1cm4gZXZlbnQ7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIG1vdXNlIGV2ZW50IG9iamVjdCBmb3IgcmVwbGF5aW5nIHRocm91Z2ggdGhlIERPTS5cbiAqIEBwYXJhbSBvcmlnaW5hbCBUaGUgZXZlbnQgdG8gY3JlYXRlIGEgbmV3IGV2ZW50IGZyb20uXG4gKiBAcGFyYW0gb3B0X2V2ZW50VHlwZSBUaGUgdHlwZSB0aGlzIGV2ZW50IGlzIGJlaW5nIGhhbmRsZWQgYXMgYnkganNhY3Rpb24uXG4gKiAgICAgRS5nLiBhIGtleXByZXNzIGlzIGhhbmRsZWQgYXMgY2xpY2sgaW4gc29tZSBjYXNlcy5cbiAqIEByZXR1cm4gVGhlIGV2ZW50IG9iamVjdC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZU1vdXNlRXZlbnQob3JpZ2luYWw6IEV2ZW50LCBvcHRfZXZlbnRUeXBlPzogc3RyaW5nKTogTW91c2VFdmVudCB7XG4gIGxldCBldmVudDtcbiAgY29uc3Qgb3JpZ2luYWxNb3VzZUV2ZW50ID0gb3JpZ2luYWwgYXMgTW91c2VFdmVudDtcbiAgaWYgKGRvY3VtZW50LmNyZWF0ZUV2ZW50KSB7XG4gICAgLy8gRXZlbnQgY3JlYXRpb24gYXMgcGVyIFczQyBldmVudCBtb2RlbCBzcGVjaWZpY2F0aW9uLiAgVGhpcyBjb2RlcGF0aFxuICAgIC8vIGlzIHVzZWQgYnkgbW9zdCBub24tSUUgYnJvd3NlcnMgYW5kIGFsc28gYnkgSUUgOSBhbmQgbGF0ZXIuXG4gICAgZXZlbnQgPSBkb2N1bWVudC5jcmVhdGVFdmVudCgnTW91c2VFdmVudCcpO1xuICAgIC8vIE9uIElFIGFuZCBPcGVyYSA8IDEyLCB3ZSBtdXN0IHByb3ZpZGUgbm9uLXVuZGVmaW5lZCB2YWx1ZXMgdG9cbiAgICAvLyBpbml0TW91c2VFdmVudCwgb3RoZXJ3aXNlIGl0IHdpbGwgZmFpbC5cbiAgICBldmVudC5pbml0TW91c2VFdmVudChcbiAgICAgIG9wdF9ldmVudFR5cGUgfHwgb3JpZ2luYWwudHlwZSxcbiAgICAgIHRydWUsIC8vIGNhbkJ1YmJsZVxuICAgICAgdHJ1ZSwgLy8gY2FuY2VsYWJsZVxuICAgICAgd2luZG93LFxuICAgICAgKG9yaWdpbmFsIGFzIEN1c3RvbUV2ZW50KS5kZXRhaWwgfHwgMSxcbiAgICAgIG9yaWdpbmFsTW91c2VFdmVudC5zY3JlZW5YIHx8IDAsXG4gICAgICBvcmlnaW5hbE1vdXNlRXZlbnQuc2NyZWVuWSB8fCAwLFxuICAgICAgb3JpZ2luYWxNb3VzZUV2ZW50LmNsaWVudFggfHwgMCxcbiAgICAgIG9yaWdpbmFsTW91c2VFdmVudC5jbGllbnRZIHx8IDAsXG4gICAgICBvcmlnaW5hbE1vdXNlRXZlbnQuY3RybEtleSB8fCBmYWxzZSxcbiAgICAgIG9yaWdpbmFsTW91c2VFdmVudC5hbHRLZXkgfHwgZmFsc2UsXG4gICAgICBvcmlnaW5hbE1vdXNlRXZlbnQuc2hpZnRLZXkgfHwgZmFsc2UsXG4gICAgICBvcmlnaW5hbE1vdXNlRXZlbnQubWV0YUtleSB8fCBmYWxzZSxcbiAgICAgIG9yaWdpbmFsTW91c2VFdmVudC5idXR0b24gfHwgMCxcbiAgICAgIG9yaWdpbmFsTW91c2VFdmVudC5yZWxhdGVkVGFyZ2V0IHx8IG51bGwsXG4gICAgKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBPbGRlciB2ZXJzaW9ucyBvZiBJRSAodXAgdG8gdmVyc2lvbiA4KSBkbyBub3Qgc3VwcG9ydCB0aGVcbiAgICAvLyBXM0MgZXZlbnQgbW9kZWwuIFVzZSB0aGUgSUUgc3BlY2lmaWMgZnVuY3Rpb24gaW5zdGVhZC5cbiAgICAvLyBAdHMtaWdub3JlXG4gICAgZXZlbnQgPSBkb2N1bWVudC5jcmVhdGVFdmVudE9iamVjdCgpO1xuICAgIGV2ZW50LnR5cGUgPSBvcHRfZXZlbnRUeXBlIHx8IG9yaWdpbmFsLnR5cGU7XG4gICAgZXZlbnQuY2xpZW50WCA9IG9yaWdpbmFsTW91c2VFdmVudC5jbGllbnRYO1xuICAgIGV2ZW50LmNsaWVudFkgPSBvcmlnaW5hbE1vdXNlRXZlbnQuY2xpZW50WTtcbiAgICBldmVudC5idXR0b24gPSBvcmlnaW5hbE1vdXNlRXZlbnQuYnV0dG9uO1xuICAgIGV2ZW50LmRldGFpbCA9IChvcmlnaW5hbCBhcyBDdXN0b21FdmVudCkuZGV0YWlsO1xuICAgIGV2ZW50LmN0cmxLZXkgPSBvcmlnaW5hbE1vdXNlRXZlbnQuY3RybEtleTtcbiAgICBldmVudC5hbHRLZXkgPSBvcmlnaW5hbE1vdXNlRXZlbnQuYWx0S2V5O1xuICAgIGV2ZW50LnNoaWZ0S2V5ID0gb3JpZ2luYWxNb3VzZUV2ZW50LnNoaWZ0S2V5O1xuICAgIGV2ZW50Lm1ldGFLZXkgPSBvcmlnaW5hbE1vdXNlRXZlbnQubWV0YUtleTtcbiAgfVxuICBldmVudC5vcmlnaW5hbFRpbWVzdGFtcCA9IG9yaWdpbmFsLnRpbWVTdGFtcDtcbiAgcmV0dXJuIGV2ZW50O1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBnZW5lcmljIGV2ZW50IG9iamVjdCBmb3IgcmVwbGF5aW5nIHRocm91Z2ggdGhlIERPTS5cbiAqIEBwYXJhbSBvcmlnaW5hbCBUaGUgZXZlbnQgdG8gY3JlYXRlIGEgbmV3IGV2ZW50IGZyb20uXG4gKiBAcGFyYW0gb3B0X2V2ZW50VHlwZSBUaGUgdHlwZSB0aGlzIGV2ZW50IGlzIGJlaW5nIGhhbmRsZWQgYXMgYnkganNhY3Rpb24uXG4gKiAgICAgRS5nLiBhIGtleXByZXNzIGlzIGhhbmRsZWQgYXMgY2xpY2sgaW4gc29tZSBjYXNlcy5cbiAqIEByZXR1cm4gVGhlIGV2ZW50IG9iamVjdC5cbiAqL1xuZnVuY3Rpb24gY3JlYXRlR2VuZXJpY0V2ZW50KG9yaWdpbmFsOiBFdmVudCwgb3B0X2V2ZW50VHlwZT86IHN0cmluZyk6IEV2ZW50IHtcbiAgbGV0IGV2ZW50O1xuICBpZiAoZG9jdW1lbnQuY3JlYXRlRXZlbnQpIHtcbiAgICAvLyBFdmVudCBjcmVhdGlvbiBhcyBwZXIgVzNDIGV2ZW50IG1vZGVsIHNwZWNpZmljYXRpb24uICBUaGlzIGNvZGVwYXRoXG4gICAgLy8gaXMgdXNlZCBieSBtb3N0IG5vbi1JRSBicm93c2VycyBhbmQgYWxzbyBieSBJRSA5IGFuZCBsYXRlci5cbiAgICBldmVudCA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50KCdFdmVudCcpO1xuICAgIGV2ZW50LmluaXRFdmVudChvcHRfZXZlbnRUeXBlIHx8IG9yaWdpbmFsLnR5cGUsIHRydWUsIHRydWUpO1xuICB9IGVsc2Uge1xuICAgIC8vIE9sZGVyIHZlcnNpb25zIG9mIElFICh1cCB0byB2ZXJzaW9uIDgpIGRvIG5vdCBzdXBwb3J0IHRoZVxuICAgIC8vIFczQyBldmVudCBtb2RlbC4gVXNlIHRoZSBJRSBzcGVjaWZpYyBmdW5jdGlvbiBpbnN0ZWFkLlxuICAgIC8vIFN1cHByZXNzaW5nIGVycm9ycyBmb3IgdHMtbWlncmF0aW9uLlxuICAgIC8vICAgVFMyMzM5OiBQcm9wZXJ0eSAnY3JlYXRlRXZlbnRPYmplY3QnIGRvZXMgbm90IGV4aXN0IG9uIHR5cGUgJ0RvY3VtZW50Jy5cbiAgICAvLyBAdHMtaWdub3JlXG4gICAgZXZlbnQgPSBkb2N1bWVudC5jcmVhdGVFdmVudE9iamVjdCgpO1xuICAgIGV2ZW50LnR5cGUgPSBvcHRfZXZlbnRUeXBlIHx8IG9yaWdpbmFsLnR5cGU7XG4gIH1cbiAgZXZlbnQub3JpZ2luYWxUaW1lc3RhbXAgPSBvcmlnaW5hbC50aW1lU3RhbXA7XG4gIHJldHVybiBldmVudDtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGFuIGV2ZW50IG9iamVjdCBmb3IgcmVwbGF5aW5nIHRocm91Z2ggdGhlIERPTS5cbiAqIE5PVEU6IFRoaXMgZnVuY3Rpb24gaXMgdmlzaWJsZSBqdXN0IGZvciB0ZXN0aW5nLiAgUGxlYXNlIGRvbid0IHVzZVxuICogaXQgb3V0c2lkZSBKc0FjdGlvbiBpbnRlcm5hbCB0ZXN0aW5nLlxuICogVE9ETzogQWRkIHN1cHBvcnQgZm9yIEZvY3VzRXZlbnQgYW5kIFdoZWVsRXZlbnQuXG4gKiBAcGFyYW0gYmFzZSBUaGUgZXZlbnQgdG8gY3JlYXRlIGEgbmV3IGV2ZW50IGZyb20uXG4gKiBAcGFyYW0gb3B0X2V2ZW50VHlwZSBUaGUgdHlwZSB0aGlzIGV2ZW50IGlzIGJlaW5nIGhhbmRsZWQgYXMgYnkganNhY3Rpb24uXG4gKiAgICAgRS5nLiBhIGtleXByZXNzIGlzIGhhbmRsZWQgYXMgY2xpY2sgaW4gc29tZSBjYXNlcy5cbiAqIEByZXR1cm4gVGhlIGV2ZW50IG9iamVjdC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUV2ZW50KGJhc2U6IHVua25vd24sIG9wdF9ldmVudFR5cGU/OiBzdHJpbmcpOiBFdmVudCB7XG4gIGNvbnN0IG9yaWdpbmFsID0gYmFzZSBhcyBFdmVudDtcbiAgbGV0IGV2ZW50O1xuICBsZXQgZXZlbnRUeXBlO1xuICBpZiAob3JpZ2luYWwudHlwZSA9PT0gRXZlbnRUeXBlLkNVU1RPTSkge1xuICAgIGV2ZW50VHlwZSA9IEV2ZW50VHlwZS5DVVNUT007XG4gIH0gZWxzZSB7XG4gICAgZXZlbnRUeXBlID0gb3B0X2V2ZW50VHlwZSB8fCBvcmlnaW5hbC50eXBlO1xuICB9XG5cbiAgaWYgKGlzS2V5Ym9hcmRFdmVudChldmVudFR5cGUpKSB7XG4gICAgZXZlbnQgPSBjcmVhdGVLZXlib2FyZEV2ZW50KG9yaWdpbmFsLCBvcHRfZXZlbnRUeXBlKTtcbiAgfSBlbHNlIGlmIChpc01vdXNlRXZlbnQoZXZlbnRUeXBlKSkge1xuICAgIGV2ZW50ID0gY3JlYXRlTW91c2VFdmVudChvcmlnaW5hbCwgb3B0X2V2ZW50VHlwZSk7XG4gIH0gZWxzZSBpZiAoaXNVaUV2ZW50KGV2ZW50VHlwZSkpIHtcbiAgICBldmVudCA9IGNyZWF0ZVVpRXZlbnQob3JpZ2luYWwsIG9wdF9ldmVudFR5cGUpO1xuICB9IGVsc2UgaWYgKGV2ZW50VHlwZSA9PT0gRXZlbnRUeXBlLkNVU1RPTSkge1xuICAgIGV2ZW50ID0gY3JlYXRlQ3VzdG9tRXZlbnQoXG4gICAgICBvcHRfZXZlbnRUeXBlISxcbiAgICAgIChvcmlnaW5hbCBhcyBDdXN0b21FdmVudClbJ2RldGFpbCddWydkYXRhJ10sXG4gICAgICAob3JpZ2luYWwgYXMgQ3VzdG9tRXZlbnQpWydkZXRhaWwnXVsndHJpZ2dlcmluZ0V2ZW50J10sXG4gICAgKTtcbiAgICAoZXZlbnQgYXMge29yaWdpbmFsVGltZXN0YW1wPzogbnVtYmVyIHwgbnVsbH0gfCBudWxsKSEub3JpZ2luYWxUaW1lc3RhbXAgPSBvcmlnaW5hbC50aW1lU3RhbXA7XG4gIH0gZWxzZSB7XG4gICAgLy8gVGhpcyBlbnN1cmVzIHdlIGRvbid0IHNlbmQgYW4gdW5kZWZpbmVkIGV2ZW50IG9iamVjdCB0byB0aGUgcmVwbGF5ZXIuXG4gICAgZXZlbnQgPSBjcmVhdGVHZW5lcmljRXZlbnQob3JpZ2luYWwsIG9wdF9ldmVudFR5cGUpO1xuICB9XG4gIHJldHVybiBldmVudDtcbn1cblxuLyoqXG4gKiBTZW5kcyBhbiBldmVudCBmb3IgcmVwbGF5IHRvIHRoZSBET00uXG4gKiBAcGFyYW0gdGFyZ2V0IFRoZSB0YXJnZXQgZm9yIHRoZSBldmVudC5cbiAqIEBwYXJhbSBldmVudCBUaGUgZXZlbnQgb2JqZWN0LlxuICogQHJldHVybiBUaGUgcmV0dXJuIHZhbHVlIG9mIHRoZSBldmVudCByZXBsYXksIGkuZS4sIHdoZXRoZXIgcHJldmVudERlZmF1bHQoKVxuICogICAgIHdhcyBjYWxsZWQgb24gaXQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0cmlnZ2VyRXZlbnQodGFyZ2V0OiBFdmVudFRhcmdldCwgZXZlbnQ6IEV2ZW50KTogYm9vbGVhbiB7XG4gIGlmICh0YXJnZXQuZGlzcGF0Y2hFdmVudCkge1xuICAgIHJldHVybiB0YXJnZXQuZGlzcGF0Y2hFdmVudChldmVudCk7XG4gIH0gZWxzZSB7XG4gICAgLy8gU3VwcHJlc3NpbmcgZXJyb3JzIGZvciB0cy1taWdyYXRpb24uXG4gICAgLy8gICBUUzIzMzk6IFByb3BlcnR5ICdmaXJlRXZlbnQnIGRvZXMgbm90IGV4aXN0IG9uIHR5cGUgJ0VsZW1lbnQnLlxuICAgIC8vIEB0cy1pZ25vcmVcbiAgICByZXR1cm4gKHRhcmdldCBhcyBFbGVtZW50KS5maXJlRXZlbnQoJ29uJyArIGV2ZW50LnR5cGUsIGV2ZW50KTtcbiAgfVxufVxuXG4vKiogRG8gbm90IHVzZSBvdXRpc2lkZSBvZiB0ZXN0aW5nLiAqL1xuZXhwb3J0IGNvbnN0IHRlc3RpbmcgPSB7XG4gIGNyZWF0ZUtleWJvYXJkTW9kaWZpZXJzTGlzdCxcbiAgY3JlYXRlR2VuZXJpY0V2ZW50LFxuICBpc0tleWJvYXJkRXZlbnQsXG4gIGlzTW91c2VFdmVudCxcbiAgaXNVaUV2ZW50LFxufTtcbiJdfQ==