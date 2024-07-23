/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/*
 * Names of events that are special to jsaction. These are not all
 * event types that are legal to use in either HTML or the addEvent()
 * API, but these are the ones that are treated specially. All other
 * DOM events can be used in either addEvent() or in the value of the
 * jsaction attribute. Beware of browser specific events or events
 * that don't bubble though: If they are not mentioned here, then
 * event contract doesn't work around their peculiarities.
 */
export const EventType = {
    /**
     * Mouse middle click, introduced in Chrome 55 and not yet supported on
     * other browsers.
     */
    AUXCLICK: 'auxclick',
    /**
     * The change event fired by browsers when the `value` attribute of input,
     * select, and textarea elements are changed.
     */
    CHANGE: 'change',
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
     * Specifies the jsaction for a click-only event.  Click-only doesn't take
     * into account the case where an element with focus receives an Enter/Space
     * keypress.  This event isn't separately enabled in addEvent().
     */
    CLICKONLY: 'clickonly',
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
     * The mouseup event. Can either be used directly or used implicitly to
     * capture mouseup events. In addEvent(), it represents a regular DOM
     * mouseup event.
     */
    MOUSEUP: 'mouseup',
    /**
     * The mousedown event. Can either be used directly or used implicitly to
     * capture mouseenter events. In addEvent(), it represents a regular DOM
     * mouseover event.
     */
    MOUSEDOWN: 'mousedown',
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
     * The mousemove event.
     */
    MOUSEMOVE: 'mousemove',
    /**
     * The pointerup event. Can either be used directly or used implicitly to
     * capture pointerup events. In addEvent(), it represents a regular DOM
     * pointerup event.
     */
    POINTERUP: 'pointerup',
    /**
     * The pointerdown event. Can either be used directly or used implicitly to
     * capture pointerenter events. In addEvent(), it represents a regular DOM
     * mouseover event.
     */
    POINTERDOWN: 'pointerdown',
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
     * The pointermove event.
     */
    POINTERMOVE: 'pointermove',
    /**
     * The pointercancel event.
     */
    POINTERCANCEL: 'pointercancel',
    /**
     * The gotpointercapture event is fired when
     * Element.setPointerCapture(pointerId) is called on a mouse input, or
     * implicitly when a touch input begins.
     */
    GOTPOINTERCAPTURE: 'gotpointercapture',
    /**
     * The lostpointercapture event is fired when
     * Element.releasePointerCapture(pointerId) is called, or implicitly after a
     * touch input ends.
     */
    LOSTPOINTERCAPTURE: 'lostpointercapture',
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
     * The unload event.
     */
    UNLOAD: 'unload',
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
     * The input event.
     */
    INPUT: 'input',
    /**
     * The scroll event.
     */
    SCROLL: 'scroll',
    /**
     * The toggle event. The toggle event doesn't bubble, but you can use it in
     * addEvent() and jsaction anyway. EventContract does the right thing
     * under the hood.
     */
    TOGGLE: 'toggle',
    /**
     * A custom event. The actual custom event type is declared as the 'type'
     * field in the event details. Supported in Firefox 6+, IE 9+, and all Chrome
     * versions.
     *
     * This is an internal name. Users should use jsaction's fireCustomEvent to
     * fire custom events instead of relying on this type to create them.
     */
    CUSTOM: '_custom',
};
/** All event types that do not bubble or capture and need a polyfill. */
export const MOUSE_SPECIAL_EVENT_TYPES = [
    EventType.MOUSEENTER,
    EventType.MOUSELEAVE,
    'pointerenter',
    'pointerleave',
];
/** All event types that are registered in the bubble phase. */
export const BUBBLE_EVENT_TYPES = [
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
export const CAPTURE_EVENT_TYPES = [
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
export const isCaptureEventType = (eventType) => CAPTURE_EVENT_TYPES.indexOf(eventType) >= 0;
/** All event types that are registered early.  */
const EARLY_EVENT_TYPES = BUBBLE_EVENT_TYPES.concat(CAPTURE_EVENT_TYPES);
/**
 * Whether or not an event type is registered in the early contract.
 */
export const isEarlyEventType = (eventType) => EARLY_EVENT_TYPES.indexOf(eventType) >= 0;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXZlbnRfdHlwZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvcHJpbWl0aXZlcy9ldmVudC1kaXNwYXRjaC9zcmMvZXZlbnRfdHlwZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSDs7Ozs7Ozs7R0FRRztBQUNILE1BQU0sQ0FBQyxNQUFNLFNBQVMsR0FBRztJQUN2Qjs7O09BR0c7SUFDSCxRQUFRLEVBQUUsVUFBVTtJQUVwQjs7O09BR0c7SUFDSCxNQUFNLEVBQUUsUUFBUTtJQUVoQjs7Ozs7T0FLRztJQUNILEtBQUssRUFBRSxPQUFPO0lBRWQ7Ozs7O09BS0c7SUFDSCxRQUFRLEVBQUUsVUFBVTtJQUVwQjs7OztPQUlHO0lBQ0gsU0FBUyxFQUFFLFdBQVc7SUFFdEI7O09BRUc7SUFDSCxRQUFRLEVBQUUsVUFBVTtJQUVwQjs7OztPQUlHO0lBQ0gsS0FBSyxFQUFFLE9BQU87SUFFZDs7OztPQUlHO0lBQ0gsT0FBTyxFQUFFLFNBQVM7SUFFbEI7O09BRUc7SUFDSCxJQUFJLEVBQUUsTUFBTTtJQUVaOztPQUVHO0lBQ0gsUUFBUSxFQUFFLFVBQVU7SUFFcEI7Ozs7OztPQU1HO0lBQ0gsTUFBTSxFQUFFLFFBQVE7SUFFaEI7Ozs7T0FJRztJQUNILE9BQU8sRUFBRSxTQUFTO0lBRWxCOzs7T0FHRztJQUNILFFBQVEsRUFBRSxVQUFVO0lBRXBCOzs7O09BSUc7SUFDSCxLQUFLLEVBQUUsT0FBTztJQUVkOzs7O09BSUc7SUFDSCxPQUFPLEVBQUUsU0FBUztJQUVsQjs7OztPQUlHO0lBQ0gsU0FBUyxFQUFFLFdBQVc7SUFFdEI7Ozs7T0FJRztJQUNILFNBQVMsRUFBRSxXQUFXO0lBRXRCOzs7O09BSUc7SUFDSCxRQUFRLEVBQUUsVUFBVTtJQUVwQjs7O09BR0c7SUFDSCxVQUFVLEVBQUUsWUFBWTtJQUV4Qjs7O09BR0c7SUFDSCxVQUFVLEVBQUUsWUFBWTtJQUV4Qjs7T0FFRztJQUNILFNBQVMsRUFBRSxXQUFXO0lBRXRCOzs7O09BSUc7SUFDSCxTQUFTLEVBQUUsV0FBVztJQUV0Qjs7OztPQUlHO0lBQ0gsV0FBVyxFQUFFLGFBQWE7SUFFMUI7Ozs7T0FJRztJQUNILFdBQVcsRUFBRSxhQUFhO0lBRTFCOzs7O09BSUc7SUFDSCxVQUFVLEVBQUUsWUFBWTtJQUV4Qjs7O09BR0c7SUFDSCxZQUFZLEVBQUUsY0FBYztJQUU1Qjs7O09BR0c7SUFDSCxZQUFZLEVBQUUsY0FBYztJQUU1Qjs7T0FFRztJQUNILFdBQVcsRUFBRSxhQUFhO0lBRTFCOztPQUVHO0lBQ0gsYUFBYSxFQUFFLGVBQWU7SUFFOUI7Ozs7T0FJRztJQUNILGlCQUFpQixFQUFFLG1CQUFtQjtJQUV0Qzs7OztPQUlHO0lBQ0gsa0JBQWtCLEVBQUUsb0JBQW9CO0lBRXhDOzs7O09BSUc7SUFDSCxLQUFLLEVBQUUsT0FBTztJQUVkOzs7O09BSUc7SUFDSCxJQUFJLEVBQUUsTUFBTTtJQUVaOztPQUVHO0lBQ0gsTUFBTSxFQUFFLFFBQVE7SUFFaEI7OztPQUdHO0lBQ0gsVUFBVSxFQUFFLFlBQVk7SUFFeEI7OztPQUdHO0lBQ0gsUUFBUSxFQUFFLFVBQVU7SUFFcEI7OztPQUdHO0lBQ0gsU0FBUyxFQUFFLFdBQVc7SUFFdEI7O09BRUc7SUFDSCxLQUFLLEVBQUUsT0FBTztJQUVkOztPQUVHO0lBQ0gsTUFBTSxFQUFFLFFBQVE7SUFFaEI7Ozs7T0FJRztJQUNILE1BQU0sRUFBRSxRQUFRO0lBRWhCOzs7Ozs7O09BT0c7SUFDSCxNQUFNLEVBQUUsU0FBUztDQUNsQixDQUFDO0FBRUYseUVBQXlFO0FBQ3pFLE1BQU0sQ0FBQyxNQUFNLHlCQUF5QixHQUFHO0lBQ3ZDLFNBQVMsQ0FBQyxVQUFVO0lBQ3BCLFNBQVMsQ0FBQyxVQUFVO0lBQ3BCLGNBQWM7SUFDZCxjQUFjO0NBQ2YsQ0FBQztBQUVGLCtEQUErRDtBQUMvRCxNQUFNLENBQUMsTUFBTSxrQkFBa0IsR0FBRztJQUNoQyxTQUFTLENBQUMsS0FBSztJQUNmLFNBQVMsQ0FBQyxRQUFRO0lBQ2xCLFNBQVMsQ0FBQyxPQUFPO0lBQ2pCLFNBQVMsQ0FBQyxRQUFRO0lBQ2xCLFNBQVMsQ0FBQyxPQUFPO0lBQ2pCLFNBQVMsQ0FBQyxLQUFLO0lBQ2YsU0FBUyxDQUFDLFFBQVE7SUFDbEIsU0FBUyxDQUFDLFNBQVM7SUFDbkIsU0FBUyxDQUFDLFFBQVE7SUFDbEIsU0FBUyxDQUFDLE1BQU07SUFDaEIsU0FBUyxDQUFDLFVBQVU7SUFDcEIsU0FBUyxDQUFDLFFBQVE7SUFDbEIsU0FBUyxDQUFDLFNBQVM7SUFDbkIsYUFBYTtJQUViLFVBQVU7SUFDVixRQUFRO0lBQ1Isa0JBQWtCO0lBQ2xCLG1CQUFtQjtJQUNuQixnQkFBZ0I7SUFDaEIsYUFBYTtJQUNiLE9BQU87SUFDUCxRQUFRO0lBRVIsTUFBTTtJQUNOLEtBQUs7SUFDTCxPQUFPO0lBQ1AsV0FBVztJQUNYLFNBQVM7SUFDVCxPQUFPO0lBQ1AsYUFBYTtJQUViLFVBQVU7SUFDVixXQUFXO0lBQ1gsV0FBVztJQUNYLE1BQU07SUFDTixXQUFXO0lBQ1gsU0FBUztJQUVULGFBQWE7SUFDYixhQUFhO0lBQ2IsV0FBVztJQUNYLGVBQWU7SUFDZixhQUFhO0lBQ2IsWUFBWTtJQUNaLG1CQUFtQjtJQUNuQixvQkFBb0I7SUFFcEIsZ0JBQWdCO0lBQ2hCLE9BQU87SUFDUCxnQkFBZ0I7SUFFaEIsMEJBQTBCO0lBQzFCLFVBQVU7SUFDVixVQUFVO0lBQ1Ysa0JBQWtCO0lBRWxCLDZCQUE2QjtJQUM3QixhQUFhO0NBQ2QsQ0FBQztBQUVGLGdFQUFnRTtBQUNoRSxNQUFNLENBQUMsTUFBTSxtQkFBbUIsR0FBRztJQUNqQyxTQUFTLENBQUMsS0FBSztJQUNmLFNBQVMsQ0FBQyxJQUFJO0lBQ2QsU0FBUyxDQUFDLEtBQUs7SUFDZixTQUFTLENBQUMsSUFBSTtJQUNkLFNBQVMsQ0FBQyxNQUFNO0NBQ2pCLENBQUM7QUFFRjs7OztHQUlHO0FBQ0gsTUFBTSxDQUFDLE1BQU0sa0JBQWtCLEdBQUcsQ0FBQyxTQUFpQixFQUFFLEVBQUUsQ0FDdEQsbUJBQW1CLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUU5QyxrREFBa0Q7QUFDbEQsTUFBTSxpQkFBaUIsR0FBRyxrQkFBa0IsQ0FBQyxNQUFNLENBQUMsbUJBQW1CLENBQUMsQ0FBQztBQUV6RTs7R0FFRztBQUNILE1BQU0sQ0FBQyxNQUFNLGdCQUFnQixHQUFHLENBQUMsU0FBaUIsRUFBRSxFQUFFLENBQUMsaUJBQWlCLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG4vKlxuICogTmFtZXMgb2YgZXZlbnRzIHRoYXQgYXJlIHNwZWNpYWwgdG8ganNhY3Rpb24uIFRoZXNlIGFyZSBub3QgYWxsXG4gKiBldmVudCB0eXBlcyB0aGF0IGFyZSBsZWdhbCB0byB1c2UgaW4gZWl0aGVyIEhUTUwgb3IgdGhlIGFkZEV2ZW50KClcbiAqIEFQSSwgYnV0IHRoZXNlIGFyZSB0aGUgb25lcyB0aGF0IGFyZSB0cmVhdGVkIHNwZWNpYWxseS4gQWxsIG90aGVyXG4gKiBET00gZXZlbnRzIGNhbiBiZSB1c2VkIGluIGVpdGhlciBhZGRFdmVudCgpIG9yIGluIHRoZSB2YWx1ZSBvZiB0aGVcbiAqIGpzYWN0aW9uIGF0dHJpYnV0ZS4gQmV3YXJlIG9mIGJyb3dzZXIgc3BlY2lmaWMgZXZlbnRzIG9yIGV2ZW50c1xuICogdGhhdCBkb24ndCBidWJibGUgdGhvdWdoOiBJZiB0aGV5IGFyZSBub3QgbWVudGlvbmVkIGhlcmUsIHRoZW5cbiAqIGV2ZW50IGNvbnRyYWN0IGRvZXNuJ3Qgd29yayBhcm91bmQgdGhlaXIgcGVjdWxpYXJpdGllcy5cbiAqL1xuZXhwb3J0IGNvbnN0IEV2ZW50VHlwZSA9IHtcbiAgLyoqXG4gICAqIE1vdXNlIG1pZGRsZSBjbGljaywgaW50cm9kdWNlZCBpbiBDaHJvbWUgNTUgYW5kIG5vdCB5ZXQgc3VwcG9ydGVkIG9uXG4gICAqIG90aGVyIGJyb3dzZXJzLlxuICAgKi9cbiAgQVVYQ0xJQ0s6ICdhdXhjbGljaycsXG5cbiAgLyoqXG4gICAqIFRoZSBjaGFuZ2UgZXZlbnQgZmlyZWQgYnkgYnJvd3NlcnMgd2hlbiB0aGUgYHZhbHVlYCBhdHRyaWJ1dGUgb2YgaW5wdXQsXG4gICAqIHNlbGVjdCwgYW5kIHRleHRhcmVhIGVsZW1lbnRzIGFyZSBjaGFuZ2VkLlxuICAgKi9cbiAgQ0hBTkdFOiAnY2hhbmdlJyxcblxuICAvKipcbiAgICogVGhlIGNsaWNrIGV2ZW50LiBJbiBhZGRFdmVudCgpIHJlZmVycyB0byBhbGwgY2xpY2sgZXZlbnRzLCBpbiB0aGVcbiAgICoganNhY3Rpb24gYXR0cmlidXRlIGl0IHJlZmVycyB0byB0aGUgdW5tb2RpZmllZCBjbGljayBhbmQgRW50ZXIvU3BhY2VcbiAgICoga2V5cHJlc3MgZXZlbnRzLiAgSW4gdGhlIGxhdHRlciBjYXNlLCBhIGpzYWN0aW9uIGNsaWNrIHdpbGwgYmUgdHJpZ2dlcmVkLFxuICAgKiBmb3IgYWNjZXNzaWJpbGl0eSByZWFzb25zLiAgU2VlIGNsaWNrbW9kIGFuZCBjbGlja29ubHksIGJlbG93LlxuICAgKi9cbiAgQ0xJQ0s6ICdjbGljaycsXG5cbiAgLyoqXG4gICAqIFNwZWNpZmllcyB0aGUganNhY3Rpb24gZm9yIGEgbW9kaWZpZWQgY2xpY2sgZXZlbnQgKGkuZS4gYSBtb3VzZVxuICAgKiBjbGljayB3aXRoIHRoZSBtb2RpZmllciBrZXkgQ21kL0N0cmwgcHJlc3NlZCkuIFRoaXMgZXZlbnQgaXNuJ3RcbiAgICogc2VwYXJhdGVseSBlbmFibGVkIGluIGFkZEV2ZW50KCksIGJlY2F1c2UgaW4gdGhlIERPTSwgaXQncyBqdXN0IGFcbiAgICogY2xpY2sgZXZlbnQuXG4gICAqL1xuICBDTElDS01PRDogJ2NsaWNrbW9kJyxcblxuICAvKipcbiAgICogU3BlY2lmaWVzIHRoZSBqc2FjdGlvbiBmb3IgYSBjbGljay1vbmx5IGV2ZW50LiAgQ2xpY2stb25seSBkb2Vzbid0IHRha2VcbiAgICogaW50byBhY2NvdW50IHRoZSBjYXNlIHdoZXJlIGFuIGVsZW1lbnQgd2l0aCBmb2N1cyByZWNlaXZlcyBhbiBFbnRlci9TcGFjZVxuICAgKiBrZXlwcmVzcy4gIFRoaXMgZXZlbnQgaXNuJ3Qgc2VwYXJhdGVseSBlbmFibGVkIGluIGFkZEV2ZW50KCkuXG4gICAqL1xuICBDTElDS09OTFk6ICdjbGlja29ubHknLFxuXG4gIC8qKlxuICAgKiBUaGUgZGJsY2xpY2sgZXZlbnQuXG4gICAqL1xuICBEQkxDTElDSzogJ2RibGNsaWNrJyxcblxuICAvKipcbiAgICogRm9jdXMgZG9lc24ndCBidWJibGUsIGJ1dCB5b3UgY2FuIHVzZSBpdCBpbiBhZGRFdmVudCgpIGFuZFxuICAgKiBqc2FjdGlvbiBhbnl3YXkuIEV2ZW50Q29udHJhY3QgZG9lcyB0aGUgcmlnaHQgdGhpbmcgdW5kZXIgdGhlXG4gICAqIGhvb2QuXG4gICAqL1xuICBGT0NVUzogJ2ZvY3VzJyxcblxuICAvKipcbiAgICogVGhpcyBldmVudCBvbmx5IGV4aXN0cyBpbiBJRS4gRm9yIGFkZEV2ZW50KCkgYW5kIGpzYWN0aW9uLCB1c2VcbiAgICogZm9jdXMgaW5zdGVhZDsgRXZlbnRDb250cmFjdCBkb2VzIHRoZSByaWdodCB0aGluZyBldmVuIHRob3VnaFxuICAgKiBmb2N1cyBkb2Vzbid0IGJ1YmJsZS5cbiAgICovXG4gIEZPQ1VTSU46ICdmb2N1c2luJyxcblxuICAvKipcbiAgICogQW5hbG9nIHRvIGZvY3VzLlxuICAgKi9cbiAgQkxVUjogJ2JsdXInLFxuXG4gIC8qKlxuICAgKiBBbmFsb2cgdG8gZm9jdXNpbi5cbiAgICovXG4gIEZPQ1VTT1VUOiAnZm9jdXNvdXQnLFxuXG4gIC8qKlxuICAgKiBTdWJtaXQgZG9lc24ndCBidWJibGUsIHNvIGl0IGNhbm5vdCBiZSB1c2VkIHdpdGggZXZlbnRcbiAgICogY29udHJhY3QuIEhvd2V2ZXIsIHRoZSBicm93c2VyIGhlbHBmdWxseSBmaXJlcyBhIGNsaWNrIGV2ZW50IG9uXG4gICAqIHRoZSBzdWJtaXQgYnV0dG9uIG9mIGEgZm9ybSAoZXZlbiBpZiB0aGUgZm9ybSBpcyBub3Qgc3VibWl0dGVkIGJ5XG4gICAqIGEgY2xpY2sgb24gdGhlIHN1Ym1pdCBidXR0b24pLiBTbyB5b3Ugc2hvdWxkIGhhbmRsZSBjbGljayBvbiB0aGVcbiAgICogc3VibWl0IGJ1dHRvbiBpbnN0ZWFkLlxuICAgKi9cbiAgU1VCTUlUOiAnc3VibWl0JyxcblxuICAvKipcbiAgICogVGhlIGtleWRvd24gZXZlbnQuIEluIGFkZEV2ZW50KCkgYW5kIG5vbi1jbGljayBqc2FjdGlvbiBpdCByZXByZXNlbnRzIHRoZVxuICAgKiByZWd1bGFyIERPTSBrZXlkb3duIGV2ZW50LiBJdCByZXByZXNlbnRzIGNsaWNrIGFjdGlvbnMgaW4gbm9uLUdlY2tvXG4gICAqIGJyb3dzZXJzLlxuICAgKi9cbiAgS0VZRE9XTjogJ2tleWRvd24nLFxuXG4gIC8qKlxuICAgKiBUaGUga2V5cHJlc3MgZXZlbnQuIEluIGFkZEV2ZW50KCkgYW5kIG5vbi1jbGljayBqc2FjdGlvbiBpdCByZXByZXNlbnRzIHRoZVxuICAgKiByZWd1bGFyIERPTSBrZXlwcmVzcyBldmVudC4gSXQgcmVwcmVzZW50cyBjbGljayBhY3Rpb25zIGluIEdlY2tvIGJyb3dzZXJzLlxuICAgKi9cbiAgS0VZUFJFU1M6ICdrZXlwcmVzcycsXG5cbiAgLyoqXG4gICAqIFRoZSBrZXl1cCBldmVudC4gSW4gYWRkRXZlbnQoKSBhbmQgbm9uLWNsaWNrIGpzYWN0aW9uIGl0IHJlcHJlc2VudHMgdGhlXG4gICAqIHJlZ3VsYXIgRE9NIGtleXVwIGV2ZW50LiBJdCByZXByZXNlbnRzIGNsaWNrIGFjdGlvbnMgaW4gbm9uLUdlY2tvXG4gICAqIGJyb3dzZXJzLlxuICAgKi9cbiAgS0VZVVA6ICdrZXl1cCcsXG5cbiAgLyoqXG4gICAqIFRoZSBtb3VzZXVwIGV2ZW50LiBDYW4gZWl0aGVyIGJlIHVzZWQgZGlyZWN0bHkgb3IgdXNlZCBpbXBsaWNpdGx5IHRvXG4gICAqIGNhcHR1cmUgbW91c2V1cCBldmVudHMuIEluIGFkZEV2ZW50KCksIGl0IHJlcHJlc2VudHMgYSByZWd1bGFyIERPTVxuICAgKiBtb3VzZXVwIGV2ZW50LlxuICAgKi9cbiAgTU9VU0VVUDogJ21vdXNldXAnLFxuXG4gIC8qKlxuICAgKiBUaGUgbW91c2Vkb3duIGV2ZW50LiBDYW4gZWl0aGVyIGJlIHVzZWQgZGlyZWN0bHkgb3IgdXNlZCBpbXBsaWNpdGx5IHRvXG4gICAqIGNhcHR1cmUgbW91c2VlbnRlciBldmVudHMuIEluIGFkZEV2ZW50KCksIGl0IHJlcHJlc2VudHMgYSByZWd1bGFyIERPTVxuICAgKiBtb3VzZW92ZXIgZXZlbnQuXG4gICAqL1xuICBNT1VTRURPV046ICdtb3VzZWRvd24nLFxuXG4gIC8qKlxuICAgKiBUaGUgbW91c2VvdmVyIGV2ZW50LiBDYW4gZWl0aGVyIGJlIHVzZWQgZGlyZWN0bHkgb3IgdXNlZCBpbXBsaWNpdGx5IHRvXG4gICAqIGNhcHR1cmUgbW91c2VlbnRlciBldmVudHMuIEluIGFkZEV2ZW50KCksIGl0IHJlcHJlc2VudHMgYSByZWd1bGFyIERPTVxuICAgKiBtb3VzZW92ZXIgZXZlbnQuXG4gICAqL1xuICBNT1VTRU9WRVI6ICdtb3VzZW92ZXInLFxuXG4gIC8qKlxuICAgKiBUaGUgbW91c2VvdXQgZXZlbnQuIENhbiBlaXRoZXIgYmUgdXNlZCBkaXJlY3RseSBvciB1c2VkIGltcGxpY2l0bHkgdG9cbiAgICogY2FwdHVyZSBtb3VzZW92ZXIgZXZlbnRzLiBJbiBhZGRFdmVudCgpLCBpdCByZXByZXNlbnRzIGEgcmVndWxhciBET01cbiAgICogbW91c2VvdXQgZXZlbnQuXG4gICAqL1xuICBNT1VTRU9VVDogJ21vdXNlb3V0JyxcblxuICAvKipcbiAgICogVGhlIG1vdXNlZW50ZXIgZXZlbnQuIERvZXMgbm90IGJ1YmJsZSBhbmQgZmlyZXMgaW5kaXZpZHVhbGx5IG9uIGVhY2hcbiAgICogZWxlbWVudCBiZWluZyBlbnRlcmVkIHdpdGhpbiBhIERPTSB0cmVlLlxuICAgKi9cbiAgTU9VU0VFTlRFUjogJ21vdXNlZW50ZXInLFxuXG4gIC8qKlxuICAgKiBUaGUgbW91c2VsZWF2ZSBldmVudC4gRG9lcyBub3QgYnViYmxlIGFuZCBmaXJlcyBpbmRpdmlkdWFsbHkgb24gZWFjaFxuICAgKiBlbGVtZW50IGJlaW5nIGVudGVyZWQgd2l0aGluIGEgRE9NIHRyZWUuXG4gICAqL1xuICBNT1VTRUxFQVZFOiAnbW91c2VsZWF2ZScsXG5cbiAgLyoqXG4gICAqIFRoZSBtb3VzZW1vdmUgZXZlbnQuXG4gICAqL1xuICBNT1VTRU1PVkU6ICdtb3VzZW1vdmUnLFxuXG4gIC8qKlxuICAgKiBUaGUgcG9pbnRlcnVwIGV2ZW50LiBDYW4gZWl0aGVyIGJlIHVzZWQgZGlyZWN0bHkgb3IgdXNlZCBpbXBsaWNpdGx5IHRvXG4gICAqIGNhcHR1cmUgcG9pbnRlcnVwIGV2ZW50cy4gSW4gYWRkRXZlbnQoKSwgaXQgcmVwcmVzZW50cyBhIHJlZ3VsYXIgRE9NXG4gICAqIHBvaW50ZXJ1cCBldmVudC5cbiAgICovXG4gIFBPSU5URVJVUDogJ3BvaW50ZXJ1cCcsXG5cbiAgLyoqXG4gICAqIFRoZSBwb2ludGVyZG93biBldmVudC4gQ2FuIGVpdGhlciBiZSB1c2VkIGRpcmVjdGx5IG9yIHVzZWQgaW1wbGljaXRseSB0b1xuICAgKiBjYXB0dXJlIHBvaW50ZXJlbnRlciBldmVudHMuIEluIGFkZEV2ZW50KCksIGl0IHJlcHJlc2VudHMgYSByZWd1bGFyIERPTVxuICAgKiBtb3VzZW92ZXIgZXZlbnQuXG4gICAqL1xuICBQT0lOVEVSRE9XTjogJ3BvaW50ZXJkb3duJyxcblxuICAvKipcbiAgICogVGhlIHBvaW50ZXJvdmVyIGV2ZW50LiBDYW4gZWl0aGVyIGJlIHVzZWQgZGlyZWN0bHkgb3IgdXNlZCBpbXBsaWNpdGx5IHRvXG4gICAqIGNhcHR1cmUgcG9pbnRlcmVudGVyIGV2ZW50cy4gSW4gYWRkRXZlbnQoKSwgaXQgcmVwcmVzZW50cyBhIHJlZ3VsYXIgRE9NXG4gICAqIHBvaW50ZXJvdmVyIGV2ZW50LlxuICAgKi9cbiAgUE9JTlRFUk9WRVI6ICdwb2ludGVyb3ZlcicsXG5cbiAgLyoqXG4gICAqIFRoZSBwb2ludGVyb3V0IGV2ZW50LiBDYW4gZWl0aGVyIGJlIHVzZWQgZGlyZWN0bHkgb3IgdXNlZCBpbXBsaWNpdGx5IHRvXG4gICAqIGNhcHR1cmUgcG9pbnRlcm92ZXIgZXZlbnRzLiBJbiBhZGRFdmVudCgpLCBpdCByZXByZXNlbnRzIGEgcmVndWxhciBET01cbiAgICogcG9pbnRlcm91dCBldmVudC5cbiAgICovXG4gIFBPSU5URVJPVVQ6ICdwb2ludGVyb3V0JyxcblxuICAvKipcbiAgICogVGhlIHBvaW50ZXJlbnRlciBldmVudC4gRG9lcyBub3QgYnViYmxlIGFuZCBmaXJlcyBpbmRpdmlkdWFsbHkgb24gZWFjaFxuICAgKiBlbGVtZW50IGJlaW5nIGVudGVyZWQgd2l0aGluIGEgRE9NIHRyZWUuXG4gICAqL1xuICBQT0lOVEVSRU5URVI6ICdwb2ludGVyZW50ZXInLFxuXG4gIC8qKlxuICAgKiBUaGUgcG9pbnRlcmxlYXZlIGV2ZW50LiBEb2VzIG5vdCBidWJibGUgYW5kIGZpcmVzIGluZGl2aWR1YWxseSBvbiBlYWNoXG4gICAqIGVsZW1lbnQgYmVpbmcgZW50ZXJlZCB3aXRoaW4gYSBET00gdHJlZS5cbiAgICovXG4gIFBPSU5URVJMRUFWRTogJ3BvaW50ZXJsZWF2ZScsXG5cbiAgLyoqXG4gICAqIFRoZSBwb2ludGVybW92ZSBldmVudC5cbiAgICovXG4gIFBPSU5URVJNT1ZFOiAncG9pbnRlcm1vdmUnLFxuXG4gIC8qKlxuICAgKiBUaGUgcG9pbnRlcmNhbmNlbCBldmVudC5cbiAgICovXG4gIFBPSU5URVJDQU5DRUw6ICdwb2ludGVyY2FuY2VsJyxcblxuICAvKipcbiAgICogVGhlIGdvdHBvaW50ZXJjYXB0dXJlIGV2ZW50IGlzIGZpcmVkIHdoZW5cbiAgICogRWxlbWVudC5zZXRQb2ludGVyQ2FwdHVyZShwb2ludGVySWQpIGlzIGNhbGxlZCBvbiBhIG1vdXNlIGlucHV0LCBvclxuICAgKiBpbXBsaWNpdGx5IHdoZW4gYSB0b3VjaCBpbnB1dCBiZWdpbnMuXG4gICAqL1xuICBHT1RQT0lOVEVSQ0FQVFVSRTogJ2dvdHBvaW50ZXJjYXB0dXJlJyxcblxuICAvKipcbiAgICogVGhlIGxvc3Rwb2ludGVyY2FwdHVyZSBldmVudCBpcyBmaXJlZCB3aGVuXG4gICAqIEVsZW1lbnQucmVsZWFzZVBvaW50ZXJDYXB0dXJlKHBvaW50ZXJJZCkgaXMgY2FsbGVkLCBvciBpbXBsaWNpdGx5IGFmdGVyIGFcbiAgICogdG91Y2ggaW5wdXQgZW5kcy5cbiAgICovXG4gIExPU1RQT0lOVEVSQ0FQVFVSRTogJ2xvc3Rwb2ludGVyY2FwdHVyZScsXG5cbiAgLyoqXG4gICAqIFRoZSBlcnJvciBldmVudC4gVGhlIGVycm9yIGV2ZW50IGRvZXNuJ3QgYnViYmxlLCBidXQgeW91IGNhbiB1c2UgaXQgaW5cbiAgICogYWRkRXZlbnQoKSBhbmQganNhY3Rpb24gYW55d2F5LiBFdmVudENvbnRyYWN0IGRvZXMgdGhlIHJpZ2h0IHRoaW5nIHVuZGVyXG4gICAqIHRoZSBob29kIChleGNlcHQgaW4gSUU4IHdoaWNoIGRvZXMgbm90IHVzZSBlcnJvciBldmVudHMpLlxuICAgKi9cbiAgRVJST1I6ICdlcnJvcicsXG5cbiAgLyoqXG4gICAqIFRoZSBsb2FkIGV2ZW50LiBUaGUgbG9hZCBldmVudCBkb2Vzbid0IGJ1YmJsZSwgYnV0IHlvdSBjYW4gdXNlIGl0IGluXG4gICAqIGFkZEV2ZW50KCkgYW5kIGpzYWN0aW9uIGFueXdheS4gRXZlbnRDb250cmFjdCBkb2VzIHRoZSByaWdodCB0aGluZ1xuICAgKiB1bmRlciB0aGUgaG9vZC5cbiAgICovXG4gIExPQUQ6ICdsb2FkJyxcblxuICAvKipcbiAgICogVGhlIHVubG9hZCBldmVudC5cbiAgICovXG4gIFVOTE9BRDogJ3VubG9hZCcsXG5cbiAgLyoqXG4gICAqIFRoZSB0b3VjaHN0YXJ0IGV2ZW50LiBCdWJibGVzLCB3aWxsIG9ubHkgZXZlciBmaXJlIGluIGJyb3dzZXJzIHdpdGhcbiAgICogdG91Y2ggc3VwcG9ydC5cbiAgICovXG4gIFRPVUNIU1RBUlQ6ICd0b3VjaHN0YXJ0JyxcblxuICAvKipcbiAgICogVGhlIHRvdWNoZW5kIGV2ZW50LiBCdWJibGVzLCB3aWxsIG9ubHkgZXZlciBmaXJlIGluIGJyb3dzZXJzIHdpdGhcbiAgICogdG91Y2ggc3VwcG9ydC5cbiAgICovXG4gIFRPVUNIRU5EOiAndG91Y2hlbmQnLFxuXG4gIC8qKlxuICAgKiBUaGUgdG91Y2htb3ZlIGV2ZW50LiBCdWJibGVzLCB3aWxsIG9ubHkgZXZlciBmaXJlIGluIGJyb3dzZXJzIHdpdGhcbiAgICogdG91Y2ggc3VwcG9ydC5cbiAgICovXG4gIFRPVUNITU9WRTogJ3RvdWNobW92ZScsXG5cbiAgLyoqXG4gICAqIFRoZSBpbnB1dCBldmVudC5cbiAgICovXG4gIElOUFVUOiAnaW5wdXQnLFxuXG4gIC8qKlxuICAgKiBUaGUgc2Nyb2xsIGV2ZW50LlxuICAgKi9cbiAgU0NST0xMOiAnc2Nyb2xsJyxcblxuICAvKipcbiAgICogVGhlIHRvZ2dsZSBldmVudC4gVGhlIHRvZ2dsZSBldmVudCBkb2Vzbid0IGJ1YmJsZSwgYnV0IHlvdSBjYW4gdXNlIGl0IGluXG4gICAqIGFkZEV2ZW50KCkgYW5kIGpzYWN0aW9uIGFueXdheS4gRXZlbnRDb250cmFjdCBkb2VzIHRoZSByaWdodCB0aGluZ1xuICAgKiB1bmRlciB0aGUgaG9vZC5cbiAgICovXG4gIFRPR0dMRTogJ3RvZ2dsZScsXG5cbiAgLyoqXG4gICAqIEEgY3VzdG9tIGV2ZW50LiBUaGUgYWN0dWFsIGN1c3RvbSBldmVudCB0eXBlIGlzIGRlY2xhcmVkIGFzIHRoZSAndHlwZSdcbiAgICogZmllbGQgaW4gdGhlIGV2ZW50IGRldGFpbHMuIFN1cHBvcnRlZCBpbiBGaXJlZm94IDYrLCBJRSA5KywgYW5kIGFsbCBDaHJvbWVcbiAgICogdmVyc2lvbnMuXG4gICAqXG4gICAqIFRoaXMgaXMgYW4gaW50ZXJuYWwgbmFtZS4gVXNlcnMgc2hvdWxkIHVzZSBqc2FjdGlvbidzIGZpcmVDdXN0b21FdmVudCB0b1xuICAgKiBmaXJlIGN1c3RvbSBldmVudHMgaW5zdGVhZCBvZiByZWx5aW5nIG9uIHRoaXMgdHlwZSB0byBjcmVhdGUgdGhlbS5cbiAgICovXG4gIENVU1RPTTogJ19jdXN0b20nLFxufTtcblxuLyoqIEFsbCBldmVudCB0eXBlcyB0aGF0IGRvIG5vdCBidWJibGUgb3IgY2FwdHVyZSBhbmQgbmVlZCBhIHBvbHlmaWxsLiAqL1xuZXhwb3J0IGNvbnN0IE1PVVNFX1NQRUNJQUxfRVZFTlRfVFlQRVMgPSBbXG4gIEV2ZW50VHlwZS5NT1VTRUVOVEVSLFxuICBFdmVudFR5cGUuTU9VU0VMRUFWRSxcbiAgJ3BvaW50ZXJlbnRlcicsXG4gICdwb2ludGVybGVhdmUnLFxuXTtcblxuLyoqIEFsbCBldmVudCB0eXBlcyB0aGF0IGFyZSByZWdpc3RlcmVkIGluIHRoZSBidWJibGUgcGhhc2UuICovXG5leHBvcnQgY29uc3QgQlVCQkxFX0VWRU5UX1RZUEVTID0gW1xuICBFdmVudFR5cGUuQ0xJQ0ssXG4gIEV2ZW50VHlwZS5EQkxDTElDSyxcbiAgRXZlbnRUeXBlLkZPQ1VTSU4sXG4gIEV2ZW50VHlwZS5GT0NVU09VVCxcbiAgRXZlbnRUeXBlLktFWURPV04sXG4gIEV2ZW50VHlwZS5LRVlVUCxcbiAgRXZlbnRUeXBlLktFWVBSRVNTLFxuICBFdmVudFR5cGUuTU9VU0VPVkVSLFxuICBFdmVudFR5cGUuTU9VU0VPVVQsXG4gIEV2ZW50VHlwZS5TVUJNSVQsXG4gIEV2ZW50VHlwZS5UT1VDSFNUQVJULFxuICBFdmVudFR5cGUuVE9VQ0hFTkQsXG4gIEV2ZW50VHlwZS5UT1VDSE1PVkUsXG4gICd0b3VjaGNhbmNlbCcsXG5cbiAgJ2F1eGNsaWNrJyxcbiAgJ2NoYW5nZScsXG4gICdjb21wb3NpdGlvbnN0YXJ0JyxcbiAgJ2NvbXBvc2l0aW9udXBkYXRlJyxcbiAgJ2NvbXBvc2l0aW9uZW5kJyxcbiAgJ2JlZm9yZWlucHV0JyxcbiAgJ2lucHV0JyxcbiAgJ3NlbGVjdCcsXG5cbiAgJ2NvcHknLFxuICAnY3V0JyxcbiAgJ3Bhc3RlJyxcbiAgJ21vdXNlZG93bicsXG4gICdtb3VzZXVwJyxcbiAgJ3doZWVsJyxcbiAgJ2NvbnRleHRtZW51JyxcblxuICAnZHJhZ292ZXInLFxuICAnZHJhZ2VudGVyJyxcbiAgJ2RyYWdsZWF2ZScsXG4gICdkcm9wJyxcbiAgJ2RyYWdzdGFydCcsXG4gICdkcmFnZW5kJyxcblxuICAncG9pbnRlcmRvd24nLFxuICAncG9pbnRlcm1vdmUnLFxuICAncG9pbnRlcnVwJyxcbiAgJ3BvaW50ZXJjYW5jZWwnLFxuICAncG9pbnRlcm92ZXInLFxuICAncG9pbnRlcm91dCcsXG4gICdnb3Rwb2ludGVyY2FwdHVyZScsXG4gICdsb3N0cG9pbnRlcmNhcHR1cmUnLFxuXG4gIC8vIFZpZGVvIGV2ZW50cy5cbiAgJ2VuZGVkJyxcbiAgJ2xvYWRlZG1ldGFkYXRhJyxcblxuICAvLyBQYWdlIHZpc2liaWxpdHkgZXZlbnRzLlxuICAncGFnZWhpZGUnLFxuICAncGFnZXNob3cnLFxuICAndmlzaWJpbGl0eWNoYW5nZScsXG5cbiAgLy8gQ29udGVudCB2aXNpYmlsaXR5IGV2ZW50cy5cbiAgJ2JlZm9yZW1hdGNoJyxcbl07XG5cbi8qKiBBbGwgZXZlbnQgdHlwZXMgdGhhdCBhcmUgcmVnaXN0ZXJlZCBpbiB0aGUgY2FwdHVyZSBwaGFzZS4gKi9cbmV4cG9ydCBjb25zdCBDQVBUVVJFX0VWRU5UX1RZUEVTID0gW1xuICBFdmVudFR5cGUuRk9DVVMsXG4gIEV2ZW50VHlwZS5CTFVSLFxuICBFdmVudFR5cGUuRVJST1IsXG4gIEV2ZW50VHlwZS5MT0FELFxuICBFdmVudFR5cGUuVE9HR0xFLFxuXTtcblxuLyoqXG4gKiBXaGV0aGVyIG9yIG5vdCBhbiBldmVudCB0eXBlIHNob3VsZCBiZSByZWdpc3RlcmVkIGluIHRoZSBjYXB0dXJlIHBoYXNlLlxuICogQHBhcmFtIGV2ZW50VHlwZVxuICogQHJldHVybnMgYm9vbFxuICovXG5leHBvcnQgY29uc3QgaXNDYXB0dXJlRXZlbnRUeXBlID0gKGV2ZW50VHlwZTogc3RyaW5nKSA9PlxuICBDQVBUVVJFX0VWRU5UX1RZUEVTLmluZGV4T2YoZXZlbnRUeXBlKSA+PSAwO1xuXG4vKiogQWxsIGV2ZW50IHR5cGVzIHRoYXQgYXJlIHJlZ2lzdGVyZWQgZWFybHkuICAqL1xuY29uc3QgRUFSTFlfRVZFTlRfVFlQRVMgPSBCVUJCTEVfRVZFTlRfVFlQRVMuY29uY2F0KENBUFRVUkVfRVZFTlRfVFlQRVMpO1xuXG4vKipcbiAqIFdoZXRoZXIgb3Igbm90IGFuIGV2ZW50IHR5cGUgaXMgcmVnaXN0ZXJlZCBpbiB0aGUgZWFybHkgY29udHJhY3QuXG4gKi9cbmV4cG9ydCBjb25zdCBpc0Vhcmx5RXZlbnRUeXBlID0gKGV2ZW50VHlwZTogc3RyaW5nKSA9PiBFQVJMWV9FVkVOVF9UWVBFUy5pbmRleE9mKGV2ZW50VHlwZSkgPj0gMDtcbiJdfQ==