/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Attribute } from './attribute';
import { Char } from './char';
import { EventType } from './event_type';
import { Property } from './property';
import * as cache from './cache';
import * as eventInfoLib from './event_info';
import * as eventLib from './event';
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
export class ActionResolver {
    constructor({ customEventSupport = false, syntheticMouseEventSupport = false, } = {}) {
        this.a11yClickSupport = false;
        this.updateEventInfoForA11yClick = undefined;
        this.preventDefaultForA11yClick = undefined;
        this.populateClickOnlyAction = undefined;
        this.customEventSupport = customEventSupport;
        this.syntheticMouseEventSupport = syntheticMouseEventSupport;
    }
    resolve(eventInfo) {
        if (this.customEventSupport) {
            if (eventInfoLib.getEventType(eventInfo) === EventType.CUSTOM) {
                const detail = eventInfoLib.getEvent(eventInfo).detail;
                // For custom events, use a secondary dispatch based on the internal
                // custom type of the event.
                if (!detail || !detail['_type']) {
                    // This should never happen.
                    return;
                }
                eventInfoLib.setEventType(eventInfo, detail['_type']);
            }
        }
        this.populateAction(eventInfo);
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
        else if (this.a11yClickSupport) {
            this.updateEventInfoForA11yClick(eventInfo);
        }
        // Walk to the parent node, unless the node has a different owner in
        // which case we walk to the owner. Attempt to walk to host of a
        // shadow root if needed.
        let actionElement = eventInfoLib.getTargetElement(eventInfo);
        while (actionElement && actionElement !== eventInfoLib.getContainer(eventInfo)) {
            if (actionElement.nodeType === Node.ELEMENT_NODE) {
                this.populateActionOnElement(actionElement, eventInfo);
            }
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
        if (this.a11yClickSupport) {
            this.preventDefaultForA11yClick(eventInfo);
        }
        // We attempt to handle the mouseenter/mouseleave events here by
        // detecting whether the mouseover/mouseout events correspond to
        // entering/leaving an element.
        if (this.syntheticMouseEventSupport) {
            if (eventInfoLib.getEventType(eventInfo) === EventType.MOUSEENTER ||
                eventInfoLib.getEventType(eventInfo) === EventType.MOUSELEAVE ||
                eventInfoLib.getEventType(eventInfo) === EventType.POINTERENTER ||
                eventInfoLib.getEventType(eventInfo) === EventType.POINTERLEAVE) {
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
        const actionName = actionMap[eventInfoLib.getEventType(eventInfo)];
        if (actionName !== undefined) {
            eventInfoLib.setAction(eventInfo, actionName, actionElement);
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
        let actionMap = cache.get(actionElement);
        if (!actionMap) {
            const jsactionAttribute = actionElement.getAttribute(Attribute.JSACTION);
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
                        const type = hasColon ? value.substr(0, colon).trim() : DEFAULT_EVENT_TYPE;
                        const action = hasColon ? value.substr(colon + 1).trim() : value;
                        actionMap[type] = action;
                    }
                    cache.setParsed(jsactionAttribute, actionMap);
                }
                cache.set(actionElement, actionMap);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWN0aW9uX3Jlc29sdmVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9wcmltaXRpdmVzL2V2ZW50LWRpc3BhdGNoL3NyYy9hY3Rpb25fcmVzb2x2ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLGFBQWEsQ0FBQztBQUN0QyxPQUFPLEVBQUMsSUFBSSxFQUFDLE1BQU0sUUFBUSxDQUFDO0FBQzVCLE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxjQUFjLENBQUM7QUFDdkMsT0FBTyxFQUFDLFFBQVEsRUFBQyxNQUFNLFlBQVksQ0FBQztBQUVwQyxPQUFPLEtBQUssS0FBSyxNQUFNLFNBQVMsQ0FBQztBQUNqQyxPQUFPLEtBQUssWUFBWSxNQUFNLGNBQWMsQ0FBQztBQUM3QyxPQUFPLEtBQUssUUFBUSxNQUFNLFNBQVMsQ0FBQztBQUVwQzs7O0dBR0c7QUFDSCxNQUFNLGdCQUFnQixHQUE0QixFQUFFLENBQUM7QUFFckQ7O0dBRUc7QUFDSCxNQUFNLGdCQUFnQixHQUFHLFNBQVMsQ0FBQztBQUVuQyx3REFBd0Q7QUFDeEQsTUFBTSxrQkFBa0IsR0FBVyxTQUFTLENBQUMsS0FBSyxDQUFDO0FBRW5ELG1DQUFtQztBQUNuQyxNQUFNLE9BQU8sY0FBYztJQWV6QixZQUFZLEVBQ1Ysa0JBQWtCLEdBQUcsS0FBSyxFQUMxQiwwQkFBMEIsR0FBRyxLQUFLLE1BSWhDLEVBQUU7UUFwQkUscUJBQWdCLEdBQVksS0FBSyxDQUFDO1FBSWxDLGdDQUEyQixHQUFpRCxTQUFTLENBQUM7UUFFdEYsK0JBQTBCLEdBQWlELFNBQVMsQ0FBQztRQUVyRiw0QkFBdUIsR0FJbkIsU0FBUyxDQUFDO1FBU3BCLElBQUksQ0FBQyxrQkFBa0IsR0FBRyxrQkFBa0IsQ0FBQztRQUM3QyxJQUFJLENBQUMsMEJBQTBCLEdBQUcsMEJB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UUFBUSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDO3dCQUNqRSxTQUFTLENBQUMsSUFBSSxDQUFDLEdBQUcsTUFBTSxDQUFDO29CQUMzQixDQUFDO29CQUNELEtBQUssQ0FBQyxTQUFTLENBQUMsaUJBQWlCLEVBQUUsU0FBUyxDQUFDLENBQUM7Z0JBQ2hELENBQUM7Z0JBQ0QsS0FBSyxDQUFDLEdBQUcsQ0FBQyxhQUFhLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDdEMsQ0FBQztRQUNILENBQUM7UUFDRCxPQUFPLFNBQVMsQ0FBQztJQUNuQixDQUFDO0lBRUQsbUJBQW1CLENBQ2pCLDJCQUF5RSxFQUN6RSwwQkFBdUUsRUFDdkUsdUJBQWlFO1FBRWpFLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxJQUFJLENBQUM7UUFDN0IsSUFBSSxDQUFDLDJCQUEyQixHQUFHLDJCQUEyQixDQUFDO1FBQy9ELElBQUksQ0FBQywwQkFBMEIsR0FBRywwQkFBMEIsQ0FBQztRQUM3RCxJQUFJLENBQUMsdUJBQXVCLEdBQUcsdUJBQXVCLENBQUM7SUFDekQsQ0FBQztDQUNGIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7QXR0cmlidXRlfSBmcm9tICcuL2F0dHJpYnV0ZSc7XG5pbXBvcnQge0NoYXJ9IGZyb20gJy4vY2hhcic7XG5pbXBvcnQge0V2ZW50VHlwZX0gZnJvbSAnLi9ldmVudF90eXBlJztcbmltcG9ydCB7UHJvcGVydHl9IGZyb20gJy4vcHJvcGVydHknO1xuaW1wb3J0ICogYXMgYTExeUNsaWNrIGZyb20gJy4vYTExeV9jbGljayc7XG5pbXBvcnQgKiBhcyBjYWNoZSBmcm9tICcuL2NhY2hlJztcbmltcG9ydCAqIGFzIGV2ZW50SW5mb0xpYiBmcm9tICcuL2V2ZW50X2luZm8nO1xuaW1wb3J0ICogYXMgZXZlbnRMaWIgZnJvbSAnLi9ldmVudCc7XG5cbi8qKlxuICogU2luY2UgbWFwcyBmcm9tIGV2ZW50IHRvIGFjdGlvbiBhcmUgaW1tdXRhYmxlIHdlIGNhbiB1c2UgYSBzaW5nbGUgbWFwXG4gKiB0byByZXByZXNlbnQgdGhlIGVtcHR5IG1hcC5cbiAqL1xuY29uc3QgRU1QVFlfQUNUSU9OX01BUDoge1trZXk6IHN0cmluZ106IHN0cmluZ30gPSB7fTtcblxuLyoqXG4gKiBUaGlzIHJlZ3VsYXIgZXhwcmVzc2lvbiBtYXRjaGVzIGEgc2VtaWNvbG9uLlxuICovXG5jb25zdCBSRUdFWFBfU0VNSUNPTE9OID0gL1xccyo7XFxzKi87XG5cbi8qKiBJZiBubyBldmVudCB0eXBlIGlzIGRlZmluZWQsIGRlZmF1bHRzIHRvIGBjbGlja2AuICovXG5jb25zdCBERUZBVUxUX0VWRU5UX1RZUEU6IHN0cmluZyA9IEV2ZW50VHlwZS5DTElDSztcblxuLyoqIFJlc29sdmVzIGFjdGlvbnMgZm9yIEV2ZW50cy4gKi9cbmV4cG9ydCBjbGFzcyBBY3Rpb25SZXNvbHZlciB7XG4gIHByaXZhdGUgYTExeUNsaWNrU3VwcG9ydDogYm9vbGVhbiA9IGZhbHNlO1xuICBwcml2YXRlIHJlYWRvbmx5IGN1c3RvbUV2ZW50U3VwcG9ydDogYm9vbGVhbjtcbiAgcHJpdmF0ZSByZWFkb25seSBzeW50aGV0aWNNb3VzZUV2ZW50U3VwcG9ydDogYm9vbGVhbjtcblxuICBwcml2YXRlIHVwZGF0ZUV2ZW50SW5mb0ZvckExMXlDbGljaz86IChldmVudEluZm86IGV2ZW50SW5mb0xpYi5FdmVudEluZm8pID0+IHZvaWQgPSB1bmRlZmluZWQ7XG5cbiAgcHJpdmF0ZSBwcmV2ZW50RGVmYXVsdEZvckExMXlDbGljaz86IChldmVudEluZm86IGV2ZW50SW5mb0xpYi5FdmVudEluZm8pID0+IHZvaWQgPSB1bmRlZmluZWQ7XG5cbiAgcHJpdmF0ZSBwb3B1bGF0ZUNsaWNrT25seUFjdGlvbj86IChcbiAgICBhY3Rpb25FbGVtZW50OiBFbGVtZW50LFxuICAgIGV2ZW50SW5mbzogZXZlbnRJbmZvTGliLkV2ZW50SW5mbyxcbiAgICBhY3Rpb25NYXA6IHtba2V5OiBzdHJpbmddOiBzdHJpbmd9LFxuICApID0+IHZvaWQgPSB1bmRlZmluZWQ7XG5cbiAgY29uc3RydWN0b3Ioe1xuICAgIGN1c3RvbUV2ZW50U3VwcG9ydCA9IGZhbHNlLFxuICAgIHN5bnRoZXRpY01vdXNlRXZlbnRTdXBwb3J0ID0gZmFsc2UsXG4gIH06IHtcbiAgICBjdXN0b21FdmVudFN1cHBvcnQ/OiBib29sZWFuO1xuICAgIHN5bnRoZXRpY01vdXNlRXZlbnRTdXBwb3J0PzogYm9vbGVhbjtcbiAgfSA9IHt9KSB7XG4gICAgdGhpcy5jdXN0b21FdmVudFN1cHBvcnQgPSBjdXN0b21FdmVudFN1cHBvcnQ7XG4gICAgdGhpcy5zeW50aGV0aWNNb3VzZUV2ZW50U3VwcG9ydCA9IHN5bnRoZXRpY01vdXNlRXZlbnRTdXBwb3J0O1xuICB9XG5cbiAgcmVzb2x2ZShldmVudEluZm86IGV2ZW50SW5mb0xpYi5FdmVudEluZm8pIHtcbiAgICBpZiAodGhpcy5jdXN0b21FdmVudFN1cHBvcnQpIHtcbiAgICAgIGlmIChldmVudEluZm9MaWIuZ2V0RXZlbnRUeXBlKGV2ZW50SW5mbykgPT09IEV2ZW50VHlwZS5DVVNUT00pIHtcbiAgICAgICAgY29uc3QgZGV0YWlsID0gKGV2ZW50SW5mb0xpYi5nZXRFdmVudChldmVudEluZm8pIGFzIEN1c3RvbUV2ZW50KS5kZXRhaWw7XG4gICAgICAgIC8vIEZvciBjdXN0b20gZXZlbnRzLCB1c2UgYSBzZWNvbmRhcnkgZGlzcGF0Y2ggYmFzZWQgb24gdGhlIGludGVybmFsXG4gICAgICAgIC8vIGN1c3RvbSB0eXBlIG9mIHRoZSBldmVudC5cbiAgICAgICAgaWYgKCFkZXRhaWwgfHwgIWRldGFpbFsnX3R5cGUnXSkge1xuICAgICAgICAgIC8vIFRoaXMgc2hvdWxkIG5ldmVyIGhhcHBlbi5cbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgZXZlbnRJbmZvTGliLnNldEV2ZW50VHlwZShldmVudEluZm8sIGRldGFpbFsnX3R5cGUnXSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5wb3B1bGF0ZUFjdGlvbihldmVudEluZm8pO1xuICB9XG5cbiAgLyoqXG4gICAqIFNlYXJjaGVzIGZvciBhIGpzYWN0aW9uIHRoYXQgdGhlIERPTSBldmVudCBtYXBzIHRvIGFuZCBjcmVhdGVzIGFuXG4gICAqIG9iamVjdCBjb250YWluaW5nIGV2ZW50IGluZm9ybWF0aW9uIHVzZWQgZm9yIGRpc3BhdGNoaW5nIGJ5XG4gICAqIGpzYWN0aW9uLkRpc3BhdGNoZXIuIFRoaXMgbWV0aG9kIHBvcHVsYXRlcyB0aGUgYGFjdGlvbmAgYW5kIGBhY3Rpb25FbGVtZW50YFxuICAgKiBmaWVsZHMgb2YgdGhlIEV2ZW50SW5mbyBvYmplY3QgcGFzc2VkIGluIGJ5IGZpbmRpbmcgdGhlIGZpcnN0XG4gICAqIGpzYWN0aW9uIGF0dHJpYnV0ZSBhYm92ZSB0aGUgdGFyZ2V0IE5vZGUgb2YgdGhlIGV2ZW50LCBhbmQgYmVsb3dcbiAgICogdGhlIGNvbnRhaW5lciBOb2RlLCB0aGF0IHNwZWNpZmllcyBhIGpzYWN0aW9uIGZvciB0aGUgZXZlbnRcbiAgICogdHlwZS4gSWYgbm8gc3VjaCBqc2FjdGlvbiBpcyBmb3VuZCwgdGhlbiBhY3Rpb24gaXMgdW5kZWZpbmVkLlxuICAgKlxuICAgKiBAcGFyYW0gZXZlbnRJbmZvIGBFdmVudEluZm9gIHRvIHNldCBgYWN0aW9uYCBhbmQgYGFjdGlvbkVsZW1lbnRgIGlmIGFuXG4gICAqICAgIGFjdGlvbiBpcyBmb3VuZCBvbiBhbnkgYEVsZW1lbnRgIGluIHRoZSBwYXRoIG9mIHRoZSBgRXZlbnRgLlxuICAgKi9cbiAgcHJpdmF0ZSBwb3B1bGF0ZUFjdGlvbihldmVudEluZm86IGV2ZW50SW5mb0xpYi5FdmVudEluZm8pIHtcbiAgICAvLyBXZSBkaXN0aW5ndWlzaCBtb2RpZmllZCBhbmQgcGxhaW4gY2xpY2tzIGluIG9yZGVyIHRvIHN1cHBvcnQgdGhlXG4gICAgLy8gZGVmYXVsdCBicm93c2VyIGJlaGF2aW9yIG9mIG1vZGlmaWVkIGNsaWNrcyBvbiBsaW5rczsgdXN1YWxseSB0b1xuICAgIC8vIG9wZW4gdGhlIFVSTCBvZiB0aGUgbGluayBpbiBuZXcgdGFiIG9yIG5ldyB3aW5kb3cgb24gY3RybC9jbWRcbiAgICAvLyBjbGljay4gQSBET00gJ2NsaWNrJyBldmVudCBpcyBtYXBwZWQgdG8gdGhlIGpzYWN0aW9uICdjbGljaydcbiAgICAvLyBldmVudCBpZmYgdGhlcmUgaXMgbm8gbW9kaWZpZXIgcHJlc2VudCBvbiB0aGUgZXZlbnQuIElmIHRoZXJlIGlzXG4gICAgLy8gYSBtb2RpZmllciwgaXQncyBtYXBwZWQgdG8gJ2NsaWNrbW9kJyBpbnN0ZWFkLlxuICAgIC8vXG4gICAgLy8gSXQncyBhbGxvd2VkIHRvIG9taXQgdGhlIGV2ZW50IGluIHRoZSBqc2FjdGlvbiBhdHRyaWJ1dGUuIEluIHRoYXRcbiAgICAvLyBjYXNlLCAnY2xpY2snIGlzIGFzc3VtZWQuIFRodXMgdGhlIGZvbGxvd2luZyB0d28gYXJlIGVxdWl2YWxlbnQ6XG4gICAgLy9cbiAgICAvLyAgIDxhIGhyZWY9XCJzb21ldXJsXCIganNhY3Rpb249XCJnbmEuZnVcIj5cbiAgICAvLyAgIDxhIGhyZWY9XCJzb21ldXJsXCIganNhY3Rpb249XCJjbGljazpnbmEuZnVcIj5cbiAgICAvL1xuICAgIC8vIEZvciB1bm1vZGlmaWVkIGNsaWNrcywgRXZlbnRDb250cmFjdCBpbnZva2VzIHRoZSBqc2FjdGlvblxuICAgIC8vICdnbmEuZnUnLiBGb3IgbW9kaWZpZWQgY2xpY2tzLCBFdmVudENvbnRyYWN0IHdvbid0IGZpbmQgYVxuICAgIC8vIHN1aXRhYmxlIGFjdGlvbiBhbmQgbGVhdmUgdGhlIGV2ZW50IHRvIGJlIGhhbmRsZWQgYnkgdGhlXG4gICAgLy8gYnJvd3Nlci5cbiAgICAvL1xuICAgIC8vIEluIG9yZGVyIHRvIGFsc28gaW52b2tlIGEganNhY3Rpb24gaGFuZGxlciBmb3IgYSBtb2RpZmllciBjbGljayxcbiAgICAvLyAnY2xpY2ttb2QnIG5lZWRzIHRvIGJlIHVzZWQ6XG4gICAgLy9cbiAgICAvLyAgIDxhIGhyZWY9XCJzb21ldXJsXCIganNhY3Rpb249XCJjbGlja21vZDpnbmEuZnVcIj5cbiAgICAvL1xuICAgIC8vIEV2ZW50Q29udHJhY3QgaW52b2tlcyB0aGUganNhY3Rpb24gJ2duYS5mdScgZm9yIG1vZGlmaWVkXG4gICAgLy8gY2xpY2tzLiBVbm1vZGlmaWVkIGNsaWNrcyBhcmUgbGVmdCB0byB0aGUgYnJvd3Nlci5cbiAgICAvL1xuICAgIC8vIEluIG9yZGVyIHRvIHNldCB1cCB0aGUgZXZlbnQgY29udHJhY3QgdG8gaGFuZGxlIGJvdGggY2xpY2tvbmx5IGFuZFxuICAgIC8vIGNsaWNrbW9kLCBvbmx5IGFkZEV2ZW50KEV2ZW50VHlwZS5DTElDSykgaXMgbmVjZXNzYXJ5LlxuICAgIC8vXG4gICAgLy8gSW4gb3JkZXIgdG8gc2V0IHVwIHRoZSBldmVudCBjb250cmFjdCB0byBoYW5kbGUgY2xpY2ssXG4gICAgLy8gYWRkRXZlbnQoKSBpcyBuZWNlc3NhcnkgZm9yIENMSUNLLCBLRVlET1dOLCBhbmQgS0VZUFJFU1MgZXZlbnQgdHlwZXMuICBJZlxuICAgIC8vIGExMXkgY2xpY2sgc3VwcG9ydCBpcyBlbmFibGVkLCBhZGRFdmVudCgpIHdpbGwgc2V0IHVwIHRoZSBhcHByb3ByaWF0ZSBrZXlcbiAgICAvLyBldmVudCBoYW5kbGVyIGF1dG9tYXRpY2FsbHkuXG4gICAgaWYgKFxuICAgICAgZXZlbnRJbmZvTGliLmdldEV2ZW50VHlwZShldmVudEluZm8pID09PSBFdmVudFR5cGUuQ0xJQ0sgJiZcbiAgICAgIGV2ZW50TGliLmlzTW9kaWZpZWRDbGlja0V2ZW50KGV2ZW50SW5mb0xpYi5nZXRFdmVudChldmVudEluZm8pKVxuICAgICkge1xuICAgICAgZXZlbnRJbmZvTGliLnNldEV2ZW50VHlwZShldmVudEluZm8sIEV2ZW50VHlwZS5DTElDS01PRCk7XG4gICAgfSBlbHNlIGlmICh0aGlzLmExMXlDbGlja1N1cHBvcnQpIHtcbiAgICAgIHRoaXMudXBkYXRlRXZlbnRJbmZvRm9yQTExeUNsaWNrIShldmVudEluZm8pO1xuICAgIH1cblxuICAgIC8vIFdhbGsgdG8gdGhlIHBhcmVudCBub2RlLCB1bmxlc3MgdGhlIG5vZGUgaGFzIGEgZGlmZmVyZW50IG93bmVyIGluXG4gICAgLy8gd2hpY2ggY2FzZSB3ZSB3YWxrIHRvIHRoZSBvd25lci4gQXR0ZW1wdCB0byB3YWxrIHRvIGhvc3Qgb2YgYVxuICAgIC8vIHNoYWRvdyByb290IGlmIG5lZWRlZC5cbiAgICBsZXQgYWN0aW9uRWxlbWVudDogRWxlbWVudCB8IG51bGwgPSBldmVudEluZm9MaWIuZ2V0VGFyZ2V0RWxlbWVudChldmVudEluZm8pO1xuICAgIHdoaWxlIChhY3Rpb25FbGVtZW50ICYmIGFjdGlvbkVsZW1lbnQgIT09IGV2ZW50SW5mb0xpYi5nZXRDb250YWluZXIoZXZlbnRJbmZvKSkge1xuICAgICAgaWYgKGFjdGlvbkVsZW1lbnQubm9kZVR5cGUgPT09IE5vZGUuRUxFTUVOVF9OT0RFKSB7XG4gICAgICAgIHRoaXMucG9wdWxhdGVBY3Rpb25PbkVsZW1lbnQoYWN0aW9uRWxlbWVudCwgZXZlbnRJbmZvKTtcbiAgICAgIH1cblxuICAgICAgaWYgKGV2ZW50SW5mb0xpYi5nZXRBY3Rpb24oZXZlbnRJbmZvKSkge1xuICAgICAgICAvLyBBbiBldmVudCBpcyBoYW5kbGVkIGJ5IGF0IG1vc3Qgb25lIGpzYWN0aW9uLiBUaHVzIHdlIHN0b3AgYXQgdGhlXG4gICAgICAgIC8vIGZpcnN0IG1hdGNoaW5nIGpzYWN0aW9uIHNwZWNpZmllZCBpbiBhIGpzYWN0aW9uIGF0dHJpYnV0ZSB1cCB0aGVcbiAgICAgICAgLy8gYW5jZXN0b3IgY2hhaW4gb2YgdGhlIGV2ZW50IHRhcmdldCBub2RlLlxuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGlmIChhY3Rpb25FbGVtZW50W1Byb3BlcnR5Lk9XTkVSXSkge1xuICAgICAgICBhY3Rpb25FbGVtZW50ID0gYWN0aW9uRWxlbWVudFtQcm9wZXJ0eS5PV05FUl0gYXMgRWxlbWVudDtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBpZiAoYWN0aW9uRWxlbWVudC5wYXJlbnROb2RlPy5ub2RlTmFtZSAhPT0gJyNkb2N1bWVudC1mcmFnbWVudCcpIHtcbiAgICAgICAgYWN0aW9uRWxlbWVudCA9IGFjdGlvbkVsZW1lbnQucGFyZW50Tm9kZSBhcyBFbGVtZW50IHwgbnVsbDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGFjdGlvbkVsZW1lbnQgPSAoYWN0aW9uRWxlbWVudC5wYXJlbnROb2RlIGFzIFNoYWRvd1Jvb3QgfCBudWxsKT8uaG9zdCA/PyBudWxsO1xuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IGFjdGlvbiA9IGV2ZW50SW5mb0xpYi5nZXRBY3Rpb24oZXZlbnRJbmZvKTtcbiAgICBpZiAoIWFjdGlvbikge1xuICAgICAgLy8gTm8gYWN0aW9uIGZvdW5kLlxuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICh0aGlzLmExMXlDbGlja1N1cHBvcnQpIHtcbiAgICAgIHRoaXMucHJldmVudERlZmF1bHRGb3JBMTF5Q2xpY2shKGV2ZW50SW5mbyk7XG4gICAgfVxuXG4gICAgLy8gV2UgYXR0ZW1wdCB0byBoYW5kbGUgdGhlIG1vdXNlZW50ZXIvbW91c2VsZWF2ZSBldmVudHMgaGVyZSBieVxuICAgIC8vIGRldGVjdGluZyB3aGV0aGVyIHRoZSBtb3VzZW92ZXIvbW91c2VvdXQgZXZlbnRzIGNvcnJlc3BvbmQgdG9cbiAgICAvLyBlbnRlcmluZy9sZWF2aW5nIGFuIGVsZW1lbnQuXG4gICAgaWYgKHRoaXMuc3ludGhldGljTW91c2VFdmVudFN1cHBvcnQpIHtcbiAgICAgIGlmIChcbiAgICAgICAgZXZlbnRJbmZvTGliLmdldEV2ZW50VHlwZShldmVudEluZm8pID09PSBFdmVudFR5cGUuTU9VU0VFTlRFUiB8fFxuICAgICAgICBldmVudEluZm9MaWIuZ2V0RXZlbnRUeXBlKGV2ZW50SW5mbykgPT09IEV2ZW50VHlwZS5NT1VTRUxFQVZFIHx8XG4gICAgICAgIGV2ZW50SW5mb0xpYi5nZXRFdmVudFR5cGUoZXZlbnRJbmZvKSA9PT0gRXZlbnRUeXBlLlBPSU5URVJFTlRFUiB8fFxuICAgICAgICBldmVudEluZm9MaWIuZ2V0RXZlbnRUeXBlKGV2ZW50SW5mbykgPT09IEV2ZW50VHlwZS5QT0lOVEVSTEVBVkVcbiAgICAgICkge1xuICAgICAgICAvLyBXZSBhdHRlbXB0IHRvIGhhbmRsZSB0aGUgbW91c2VlbnRlci9tb3VzZWxlYXZlIGV2ZW50cyBoZXJlIGJ5XG4gICAgICAgIC8vIGRldGVjdGluZyB3aGV0aGVyIHRoZSBtb3VzZW92ZXIvbW91c2VvdXQgZXZlbnRzIGNvcnJlc3BvbmQgdG9cbiAgICAgICAgLy8gZW50ZXJpbmcvbGVhdmluZyBhbiBlbGVtZW50LlxuICAgICAgICBpZiAoXG4gICAgICAgICAgZXZlbnRMaWIuaXNNb3VzZVNwZWNpYWxFdmVudChcbiAgICAgICAgICAgIGV2ZW50SW5mb0xpYi5nZXRFdmVudChldmVudEluZm8pLFxuICAgICAgICAgICAgZXZlbnRJbmZvTGliLmdldEV2ZW50VHlwZShldmVudEluZm8pLFxuICAgICAgICAgICAgZXZlbnRJbmZvTGliLmdldEFjdGlvbkVsZW1lbnQoYWN0aW9uKSxcbiAgICAgICAgICApXG4gICAgICAgICkge1xuICAgICAgICAgIC8vIElmIGJvdGggbW91c2VvdmVyL21vdXNlb3V0IGFuZCBtb3VzZWVudGVyL21vdXNlbGVhdmUgZXZlbnRzIGFyZVxuICAgICAgICAgIC8vIGVuYWJsZWQsIHR3byBzZXBhcmF0ZSBoYW5kbGVycyBmb3IgbW91c2VvdmVyL21vdXNlb3V0IGFyZVxuICAgICAgICAgIC8vIHJlZ2lzdGVyZWQuIEJvdGggaGFuZGxlcnMgd2lsbCBzZWUgdGhlIHNhbWUgZXZlbnQgaW5zdGFuY2VcbiAgICAgICAgICAvLyBzbyB3ZSBjcmVhdGUgYSBjb3B5IHRvIGF2b2lkIGludGVyZmVyaW5nIHdpdGggdGhlIGRpc3BhdGNoaW5nIG9mXG4gICAgICAgICAgLy8gdGhlIG1vdXNlb3Zlci9tb3VzZW91dCBldmVudC5cbiAgICAgICAgICBjb25zdCBjb3BpZWRFdmVudCA9IGV2ZW50TGliLmNyZWF0ZU1vdXNlU3BlY2lhbEV2ZW50KFxuICAgICAgICAgICAgZXZlbnRJbmZvTGliLmdldEV2ZW50KGV2ZW50SW5mbyksXG4gICAgICAgICAgICBldmVudEluZm9MaWIuZ2V0QWN0aW9uRWxlbWVudChhY3Rpb24pLFxuICAgICAgICAgICk7XG4gICAgICAgICAgZXZlbnRJbmZvTGliLnNldEV2ZW50KGV2ZW50SW5mbywgY29waWVkRXZlbnQpO1xuICAgICAgICAgIC8vIFNpbmNlIHRoZSBtb3VzZWVudGVyL21vdXNlbGVhdmUgZXZlbnRzIGRvIG5vdCBidWJibGUsIHRoZSB0YXJnZXRcbiAgICAgICAgICAvLyBvZiB0aGUgZXZlbnQgaXMgdGVjaG5pY2FsbHkgdGhlIGBhY3Rpb25FbGVtZW50YCAodGhlIG5vZGUgd2l0aCB0aGVcbiAgICAgICAgICAvLyBganNhY3Rpb25gIGF0dHJpYnV0ZSlcbiAgICAgICAgICBldmVudEluZm9MaWIuc2V0VGFyZ2V0RWxlbWVudChldmVudEluZm8sIGV2ZW50SW5mb0xpYi5nZXRBY3Rpb25FbGVtZW50KGFjdGlvbikpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGV2ZW50SW5mb0xpYi51bnNldEFjdGlvbihldmVudEluZm8pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEFjY2Vzc2VzIHRoZSBqc2FjdGlvbiBtYXAgb24gYSBub2RlIGFuZCByZXRyaWV2ZXMgdGhlIG5hbWUgb2YgdGhlXG4gICAqIGFjdGlvbiB0aGUgZ2l2ZW4gZXZlbnQgaXMgbWFwcGVkIHRvLCBpZiBhbnkuIEl0IHBhcnNlcyB0aGVcbiAgICogYXR0cmlidXRlIHZhbHVlIGFuZCBzdG9yZXMgaXQgaW4gYSBwcm9wZXJ0eSBvbiB0aGUgbm9kZSBmb3JcbiAgICogc3Vic2VxdWVudCByZXRyaWV2YWwgd2l0aG91dCByZS1wYXJzaW5nIGFuZCByZS1hY2Nlc3NpbmcgdGhlXG4gICAqIGF0dHJpYnV0ZS5cbiAgICpcbiAgICogQHBhcmFtIGFjdGlvbkVsZW1lbnQgVGhlIERPTSBub2RlIHRvIHJldHJpZXZlIHRoZSBqc2FjdGlvbiBtYXAgZnJvbS5cbiAgICogQHBhcmFtIGV2ZW50SW5mbyBgRXZlbnRJbmZvYCB0byBzZXQgYGFjdGlvbmAgYW5kIGBhY3Rpb25FbGVtZW50YCBpZiBhblxuICAgKiAgICBhY3Rpb24gaXMgZm91bmQgb24gdGhlIGBhY3Rpb25FbGVtZW50YC5cbiAgICovXG4gIHByaXZhdGUgcG9wdWxhdGVBY3Rpb25PbkVsZW1lbnQoYWN0aW9uRWxlbWVudDogRWxlbWVudCwgZXZlbnRJbmZvOiBldmVudEluZm9MaWIuRXZlbnRJbmZvKSB7XG4gICAgY29uc3QgYWN0aW9uTWFwID0gdGhpcy5wYXJzZUFjdGlvbnMoYWN0aW9uRWxlbWVudCk7XG5cbiAgICBjb25zdCBhY3Rpb25OYW1lID0gYWN0aW9uTWFwW2V2ZW50SW5mb0xpYi5nZXRFdmVudFR5cGUoZXZlbnRJbmZvKV07XG4gICAgaWYgKGFjdGlvbk5hbWUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgZXZlbnRJbmZvTGliLnNldEFjdGlvbihldmVudEluZm8sIGFjdGlvbk5hbWUsIGFjdGlvbkVsZW1lbnQpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLmExMXlDbGlja1N1cHBvcnQpIHtcbiAgICAgIHRoaXMucG9wdWxhdGVDbGlja09ubHlBY3Rpb24hKGFjdGlvbkVsZW1lbnQsIGV2ZW50SW5mbywgYWN0aW9uTWFwKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogUGFyc2VzIGFuZCBjYWNoZXMgYW4gZWxlbWVudCdzIGpzYWN0aW9uIGVsZW1lbnQgaW50byBhIG1hcC5cbiAgICpcbiAgICogVGhpcyBpcyBwcmltYXJpbHkgZm9yIGludGVybmFsIHVzZS5cbiAgICpcbiAgICogQHBhcmFtIGFjdGlvbkVsZW1lbnQgVGhlIERPTSBub2RlIHRvIHJldHJpZXZlIHRoZSBqc2FjdGlvbiBtYXAgZnJvbS5cbiAgICogQHJldHVybiBNYXAgZnJvbSBldmVudCB0byBxdWFsaWZpZWQgbmFtZSBvZiB0aGUganNhY3Rpb24gYm91bmQgdG8gaXQuXG4gICAqL1xuICBwcml2YXRlIHBhcnNlQWN0aW9ucyhhY3Rpb25FbGVtZW50OiBFbGVtZW50KToge1trZXk6IHN0cmluZ106IHN0cmluZ30ge1xuICAgIGxldCBhY3Rpb25NYXA6IHtba2V5OiBzdHJpbmddOiBzdHJpbmd9IHwgdW5kZWZpbmVkID0gY2FjaGUuZ2V0KGFjdGlvbkVsZW1lbnQpO1xuICAgIGlmICghYWN0aW9uTWFwKSB7XG4gICAgICBjb25zdCBqc2FjdGlvbkF0dHJpYnV0ZSA9IGFjdGlvbkVsZW1lbnQuZ2V0QXR0cmlidXRlKEF0dHJpYnV0ZS5KU0FDVElPTik7XG4gICAgICBpZiAoIWpzYWN0aW9uQXR0cmlidXRlKSB7XG4gICAgICAgIGFjdGlvbk1hcCA9IEVNUFRZX0FDVElPTl9NQVA7XG4gICAgICAgIGNhY2hlLnNldChhY3Rpb25FbGVtZW50LCBhY3Rpb25NYXApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYWN0aW9uTWFwID0gY2FjaGUuZ2V0UGFyc2VkKGpzYWN0aW9uQXR0cmlidXRlKTtcbiAgICAgICAgaWYgKCFhY3Rpb25NYXApIHtcbiAgICAgICAgICBhY3Rpb25NYXAgPSB7fTtcbiAgICAgICAgICBjb25zdCB2YWx1ZXMgPSBqc2FjdGlvbkF0dHJpYnV0ZS5zcGxpdChSRUdFWFBfU0VNSUNPTE9OKTtcbiAgICAgICAgICBmb3IgKGxldCBpZHggPSAwOyBpZHggPCB2YWx1ZXMubGVuZ3RoOyBpZHgrKykge1xuICAgICAgICAgICAgY29uc3QgdmFsdWUgPSB2YWx1ZXNbaWR4XTtcbiAgICAgICAgICAgIGlmICghdmFsdWUpIHtcbiAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBjb2xvbiA9IHZhbHVlLmluZGV4T2YoQ2hhci5FVkVOVF9BQ1RJT05fU0VQQVJBVE9SKTtcbiAgICAgICAgICAgIGNvbnN0IGhhc0NvbG9uID0gY29sb24gIT09IC0xO1xuICAgICAgICAgICAgY29uc3QgdHlwZSA9IGhhc0NvbG9uID8gdmFsdWUuc3Vic3RyKDAsIGNvbG9uKS50cmltKCkgOiBERUZBVUxUX0VWRU5UX1RZUEU7XG4gICAgICAgICAgICBjb25zdCBhY3Rpb24gPSBoYXNDb2xvbiA/IHZhbHVlLnN1YnN0cihjb2xvbiArIDEpLnRyaW0oKSA6IHZhbHVlO1xuICAgICAgICAgICAgYWN0aW9uTWFwW3R5cGVdID0gYWN0aW9uO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjYWNoZS5zZXRQYXJzZWQoanNhY3Rpb25BdHRyaWJ1dGUsIGFjdGlvbk1hcCk7XG4gICAgICAgIH1cbiAgICAgICAgY2FjaGUuc2V0KGFjdGlvbkVsZW1lbnQsIGFjdGlvbk1hcCk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBhY3Rpb25NYXA7XG4gIH1cblxuICBhZGRBMTF5Q2xpY2tTdXBwb3J0KFxuICAgIHVwZGF0ZUV2ZW50SW5mb0ZvckExMXlDbGljazogdHlwZW9mIGExMXlDbGljay51cGRhdGVFdmVudEluZm9Gb3JBMTF5Q2xpY2ssXG4gICAgcHJldmVudERlZmF1bHRGb3JBMTF5Q2xpY2s6IHR5cGVvZiBhMTF5Q2xpY2sucHJldmVudERlZmF1bHRGb3JBMTF5Q2xpY2ssXG4gICAgcG9wdWxhdGVDbGlja09ubHlBY3Rpb246IHR5cGVvZiBhMTF5Q2xpY2sucG9wdWxhdGVDbGlja09ubHlBY3Rpb24sXG4gICkge1xuICAgIHRoaXMuYTExeUNsaWNrU3VwcG9ydCA9IHRydWU7XG4gICAgdGhpcy51cGRhdGVFdmVudEluZm9Gb3JBMTF5Q2xpY2sgPSB1cGRhdGVFdmVudEluZm9Gb3JBMTF5Q2xpY2s7XG4gICAgdGhpcy5wcmV2ZW50RGVmYXVsdEZvckExMXlDbGljayA9IHByZXZlbnREZWZhdWx0Rm9yQTExeUNsaWNrO1xuICAgIHRoaXMucG9wdWxhdGVDbGlja09ubHlBY3Rpb24gPSBwb3B1bGF0ZUNsaWNrT25seUFjdGlvbjtcbiAgfVxufVxuIl19