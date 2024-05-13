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
import { OWNER } from './property';
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
            if (actionElement[OWNER]) {
                actionElement = actionElement[OWNER];
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWN0aW9uX3Jlc29sdmVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9wcmltaXRpdmVzL2V2ZW50LWRpc3BhdGNoL3NyYy9hY3Rpb25fcmVzb2x2ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLGFBQWEsQ0FBQztBQUN0QyxPQUFPLEVBQUMsSUFBSSxFQUFDLE1BQU0sUUFBUSxDQUFDO0FBQzVCLE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxjQUFjLENBQUM7QUFDdkMsT0FBTyxFQUFDLEtBQUssRUFBQyxNQUFNLFlBQVksQ0FBQztBQUVqQyxPQUFPLEtBQUssS0FBSyxNQUFNLFNBQVMsQ0FBQztBQUNqQyxPQUFPLEtBQUssWUFBWSxNQUFNLGNBQWMsQ0FBQztBQUM3QyxPQUFPLEtBQUssUUFBUSxNQUFNLFNBQVMsQ0FBQztBQUVwQzs7O0dBR0c7QUFDSCxNQUFNLGdCQUFnQixHQUE0QixFQUFFLENBQUM7QUFFckQ7O0dBRUc7QUFDSCxNQUFNLGdCQUFnQixHQUFHLFNBQVMsQ0FBQztBQUVuQyx3REFBd0Q7QUFDeEQsTUFBTSxrQkFBa0IsR0FBVyxTQUFTLENBQUMsS0FBSyxDQUFDO0FBRW5ELG1DQUFtQztBQUNuQyxNQUFNLE9BQU8sY0FBYztJQWV6QixZQUFZLEVBQ1Ysa0JBQWtCLEdBQUcsS0FBSyxFQUMxQiwwQkFBMEIsR0FBRyxLQUFLLE1BSWhDLEVBQUU7UUFwQkUscUJBQWdCLEdBQVksS0FBSyxDQUFDO1FBSWxDLGdDQUEyQixHQUFpRCxTQUFTLENBQUM7UUFFdEYsK0JBQTBCLEdBQWlELFNBQVMsQ0FBQztRQUVyRiw0QkFBdUIsR0FJbkIsU0FBUyxDQUFDO1FBU3BCLElBQUksQ0FBQyxrQkFBa0IsR0FBRyxrQkFBa0IsQ0FBQztRQUM3QyxJQUFJLENBQUMsMEJBQTBCLEdBQUcsMEJBQTBCLENBQUM7SUFDL0QsQ0FBQztJQUVELE9BQU8sQ0FBQyxTQUFpQztRQUN2QyxJQUFJLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO1lBQzVCLElBQUksWUFBWSxDQUFDLFlBQVksQ0FBQyxTQUFTLENBQUMsS0FBSyxTQUFTLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBQzlELE1BQU0sTUFBTSxHQUFJLFlBQVksQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFpQixDQUFDLE1BQU0sQ0FBQztnQkFDeEUsb0VBQW9FO2dCQUNwRSw0QkFBNEI7Z0JBQzVCLElBQUksQ0FBQyxNQUFNLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztvQkFDaEMsNEJBQTRCO29CQUM1QixPQUFPO2dCQUNULENBQUM7Z0JBQ0QsWUFBWSxDQUFDLFlBQVksQ0FBQyxTQUFTLEVBQUUsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7WUFDeEQsQ0FBQztRQUNILENBQUM7UUFFRCxJQUFJLENBQUMsY0FBYyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0lBQ2pDLENBQUM7SUFFRDs7Ozs7Ozs7Ozs7T0FXRztJQUNLLGNBQWMsQ0FBQyxTQUFpQztRQUN0RCxtRUFBbUU7UUFDbkUsbUVBQW1FO1FBQ25FLGdFQUFnRTtRQUNoRSwrREFBK0Q7UUFDL0QsbUVBQW1FO1FBQ25FLGlEQUFpRDtRQUNqRCxFQUFFO1FBQ0Ysb0VBQW9FO1FBQ3BFLG1FQUFtRTtRQUNuRSxFQUFFO1FBQ0YseUNBQXlDO1FBQ3pDLCtDQUErQztRQUMvQyxFQUFFO1FBQ0YsNERBQTREO1FBQzVELDREQUE0RDtRQUM1RCwyREFBMkQ7UUFDM0QsV0FBVztRQUNYLEVBQUU7UUFDRixtRUFBbUU7UUFDbkUsK0JBQStCO1FBQy9CLEVBQUU7UUFDRixrREFBa0Q7UUFDbEQsRUFBRTtRQUNGLDJEQUEyRDtRQUMzRCxxREFBcUQ7UUFDckQsRUFBRTtRQUNGLHFFQUFxRTtRQUNyRSx5REFBeUQ7UUFDekQsRUFBRTtRQUNGLHlEQUF5RDtRQUN6RCw0RUFBNEU7UUFDNUUsNEVBQTRFO1FBQzVFLCtCQUErQjtRQUMvQixJQUNFLFlBQVksQ0FBQyxZQUFZLENBQUMsU0FBUyxDQUFDLEtBQUssU0FBUyxDQUFDLEtBQUs7WUFDeEQsUUFBUSxDQUFDLG9CQUFvQixDQUFDLFlBQVksQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLENBQUMsRUFDL0QsQ0FBQztZQUNELFlBQVksQ0FBQyxZQUFZLENBQUMsU0FBUyxFQUFFLFNBQVMsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUMzRCxDQUFDO2FBQU0sSUFBSSxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztZQUNqQyxJQUFJLENBQUMsMkJBQTRCLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDL0MsQ0FBQztRQUVELG9FQUFvRTtRQUNwRSxnRUFBZ0U7UUFDaEUseUJBQXlCO1FBQ3pCLElBQUksYUFBYSxHQUFtQixZQUFZLENBQUMsZ0JBQWdCLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDN0UsT0FBTyxhQUFhLElBQUksYUFBYSxLQUFLLFlBQVksQ0FBQyxZQUFZLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQztZQUMvRSxJQUFJLGFBQWEsQ0FBQyxRQUFRLEtBQUssSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO2dCQUNqRCxJQUFJLENBQUMsdUJBQXVCLENBQUMsYUFBYSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQ3pELENBQUM7WUFFRCxJQUFJLFlBQVksQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQztnQkFDdEMsbUVBQW1FO2dCQUNuRSxtRUFBbUU7Z0JBQ25FLDJDQUEyQztnQkFDM0MsTUFBTTtZQUNSLENBQUM7WUFDRCxJQUFJLGFBQWEsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDO2dCQUN6QixhQUFhLEdBQUcsYUFBYSxDQUFDLEtBQUssQ0FBWSxDQUFDO2dCQUNoRCxTQUFTO1lBQ1gsQ0FBQztZQUNELElBQUksYUFBYSxDQUFDLFVBQVUsRUFBRSxRQUFRLEtBQUssb0JBQW9CLEVBQUUsQ0FBQztnQkFDaEUsYUFBYSxHQUFHLGFBQWEsQ0FBQyxVQUE0QixDQUFDO1lBQzdELENBQUM7aUJBQU0sQ0FBQztnQkFDTixhQUFhLEdBQUksYUFBYSxDQUFDLFVBQWdDLEVBQUUsSUFBSSxJQUFJLElBQUksQ0FBQztZQUNoRixDQUFDO1FBQ0gsQ0FBQztRQUVELE1BQU0sTUFBTSxHQUFHLFlBQVksQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDakQsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO1lBQ1osbUJBQW1CO1lBQ25CLE9BQU87UUFDVCxDQUFDO1FBRUQsSUFBSSxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztZQUMxQixJQUFJLENBQUMsMEJBQTJCLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDOUMsQ0FBQztRQUVELGdFQUFnRTtRQUNoRSxnRUFBZ0U7UUFDaEUsK0JBQStCO1FBQy9CLElBQUksSUFBSSxDQUFDLDBCQUEwQixFQUFFLENBQUM7WUFDcEMsSUFDRSxZQUFZLENBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBQyxLQUFLLFNBQVMsQ0FBQyxVQUFVO2dCQUM3RCxZQUFZLENBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBQyxLQUFLLFNBQVMsQ0FBQyxVQUFVO2dCQUM3RCxZQUFZLENBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBQyxLQUFLLFNBQVMsQ0FBQyxZQUFZO2dCQUMvRCxZQUFZLENBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBQyxLQUFLLFNBQVMsQ0FBQyxZQUFZLEVBQy9ELENBQUM7Z0JBQ0QsZ0VBQWdFO2dCQUNoRSxnRUFBZ0U7Z0JBQ2hFLCtCQUErQjtnQkFDL0IsSUFDRSxRQUFRLENBQUMsbUJBQW1CLENBQzFCLFlBQVksQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLEVBQ2hDLFlBQVksQ0FBQyxZQUFZLENBQUMsU0FBUyxDQUFDLEVBQ3BDLFlBQVksQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsQ0FDdEMsRUFDRCxDQUFDO29CQUNELGtFQUFrRTtvQkFDbEUsNERBQTREO29CQUM1RCw2REFBNkQ7b0JBQzdELG1FQUFtRTtvQkFDbkUsZ0NBQWdDO29CQUNoQyxNQUFNLFdBQVcsR0FBRyxRQUFRLENBQUMsdUJBQXVCLENBQ2xELFlBQVksQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLEVBQ2hDLFlBQVksQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsQ0FDdEMsQ0FBQztvQkFDRixZQUFZLENBQUMsUUFBUSxDQUFDLFNBQVMsRUFBRSxXQUFXLENBQUMsQ0FBQztvQkFDOUMsbUVBQW1FO29CQUNuRSxxRUFBcUU7b0JBQ3JFLHdCQUF3QjtvQkFDeEIsWUFBWSxDQUFDLGdCQUFnQixDQUFDLFNBQVMsRUFBRSxZQUFZLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztnQkFDbEYsQ0FBQztxQkFBTSxDQUFDO29CQUNOLFlBQVksQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLENBQUM7Z0JBQ3RDLENBQUM7WUFDSCxDQUFDO1FBQ0gsQ0FBQztJQUNILENBQUM7SUFFRDs7Ozs7Ozs7OztPQVVHO0lBQ0ssdUJBQXVCLENBQUMsYUFBc0IsRUFBRSxTQUFpQztRQUN2RixNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLGFBQWEsQ0FBQyxDQUFDO1FBRW5ELE1BQU0sVUFBVSxHQUFHLFNBQVMsQ0FBQyxZQUFZLENBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7UUFDbkUsSUFBSSxVQUFVLEtBQUssU0FBUyxFQUFFLENBQUM7WUFDN0IsWUFBWSxDQUFDLFNBQVMsQ0FBQyxTQUFTLEVBQUUsVUFBVSxFQUFFLGFBQWEsQ0FBQyxDQUFDO1FBQy9ELENBQUM7UUFFRCxJQUFJLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO1lBQzFCLElBQUksQ0FBQyx1QkFBd0IsQ0FBQyxhQUFhLEVBQUUsU0FBUyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1FBQ3JFLENBQUM7SUFDSCxDQUFDO0lBRUQ7Ozs7Ozs7T0FPRztJQUNLLFlBQVksQ0FBQyxhQUFzQjtRQUN6QyxJQUFJLFNBQVMsR0FBd0MsS0FBSyxDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUMsQ0FBQztRQUM5RSxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7WUFDZixNQUFNLGlCQUFpQixHQUFHLGFBQWEsQ0FBQyxZQUFZLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ3pFLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO2dCQUN2QixTQUFTLEdBQUcsZ0JBQWdCLENBQUM7Z0JBQzdCLEtBQUssQ0FBQyxHQUFHLENBQUMsYUFBYSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQ3RDLENBQUM7aUJBQU0sQ0FBQztnQkFDTixTQUFTLEdBQUcsS0FBSyxDQUFDLFNBQVMsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO2dCQUMvQyxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7b0JBQ2YsU0FBUyxHQUFHLEVBQUUsQ0FBQztvQkFDZixNQUFNLE1BQU0sR0FBRyxpQkFBaUIsQ0FBQyxLQUFLLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztvQkFDekQsS0FBSyxJQUFJLEdBQUcsR0FBRyxDQUFDLEVBQUUsR0FBRyxHQUFHLE1BQU0sQ0FBQyxNQUFNLEVBQUUsR0FBRyxFQUFFLEVBQUUsQ0FBQzt3QkFDN0MsTUFBTSxLQUFLLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO3dCQUMxQixJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7NEJBQ1gsU0FBUzt3QkFDWCxDQUFDO3dCQUNELE1BQU0sS0FBSyxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLHNCQUFzQixDQUFDLENBQUM7d0JBQ3pELE1BQU0sUUFBUSxHQUFHLEtBQUssS0FBSyxDQUFDLENBQUMsQ0FBQzt3QkFDOUIsTUFBTSxJQUFJLEdBQUcsUUFBUSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsa0JBQWtCLENBQUM7d0JBQzNFLE1BQU0sTUFBTSxHQUFHLFFBQVEsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQzt3QkFDakUsU0FBUyxDQUFDLElBQUksQ0FBQyxHQUFHLE1BQU0sQ0FBQztvQkFDM0IsQ0FBQztvQkFDRCxLQUFLLENBQUMsU0FBUyxDQUFDLGlCQUFpQixFQUFFLFNBQVMsQ0FBQyxDQUFDO2dCQUNoRCxDQUFDO2dCQUNELEtBQUssQ0FBQyxHQUFHLENBQUMsYUFBYSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQ3RDLENBQUM7UUFDSCxDQUFDO1FBQ0QsT0FBTyxTQUFTLENBQUM7SUFDbkIsQ0FBQztJQUVELG1CQUFtQixDQUNqQiwyQkFBeUUsRUFDekUsMEJBQXVFLEVBQ3ZFLHVCQUFpRTtRQUVqRSxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsSUFBSSxDQUFDO1FBQzdCLElBQUksQ0FBQywyQkFBMkIsR0FBRywyQkFBMkIsQ0FBQztRQUMvRCxJQUFJLENBQUMsMEJBQTBCLEdBQUcsMEJBQTBCLENBQUM7UUFDN0QsSUFBSSxDQUFDLHVCQUF1QixHQUFHLHVCQUF1QixDQUFDO0lBQ3pELENBQUM7Q0FDRiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0F0dHJpYnV0ZX0gZnJvbSAnLi9hdHRyaWJ1dGUnO1xuaW1wb3J0IHtDaGFyfSBmcm9tICcuL2NoYXInO1xuaW1wb3J0IHtFdmVudFR5cGV9IGZyb20gJy4vZXZlbnRfdHlwZSc7XG5pbXBvcnQge09XTkVSfSBmcm9tICcuL3Byb3BlcnR5JztcbmltcG9ydCAqIGFzIGExMXlDbGljayBmcm9tICcuL2ExMXlfY2xpY2snO1xuaW1wb3J0ICogYXMgY2FjaGUgZnJvbSAnLi9jYWNoZSc7XG5pbXBvcnQgKiBhcyBldmVudEluZm9MaWIgZnJvbSAnLi9ldmVudF9pbmZvJztcbmltcG9ydCAqIGFzIGV2ZW50TGliIGZyb20gJy4vZXZlbnQnO1xuXG4vKipcbiAqIFNpbmNlIG1hcHMgZnJvbSBldmVudCB0byBhY3Rpb24gYXJlIGltbXV0YWJsZSB3ZSBjYW4gdXNlIGEgc2luZ2xlIG1hcFxuICogdG8gcmVwcmVzZW50IHRoZSBlbXB0eSBtYXAuXG4gKi9cbmNvbnN0IEVNUFRZX0FDVElPTl9NQVA6IHtba2V5OiBzdHJpbmddOiBzdHJpbmd9ID0ge307XG5cbi8qKlxuICogVGhpcyByZWd1bGFyIGV4cHJlc3Npb24gbWF0Y2hlcyBhIHNlbWljb2xvbi5cbiAqL1xuY29uc3QgUkVHRVhQX1NFTUlDT0xPTiA9IC9cXHMqO1xccyovO1xuXG4vKiogSWYgbm8gZXZlbnQgdHlwZSBpcyBkZWZpbmVkLCBkZWZhdWx0cyB0byBgY2xpY2tgLiAqL1xuY29uc3QgREVGQVVMVF9FVkVOVF9UWVBFOiBzdHJpbmcgPSBFdmVudFR5cGUuQ0xJQ0s7XG5cbi8qKiBSZXNvbHZlcyBhY3Rpb25zIGZvciBFdmVudHMuICovXG5leHBvcnQgY2xhc3MgQWN0aW9uUmVzb2x2ZXIge1xuICBwcml2YXRlIGExMXlDbGlja1N1cHBvcnQ6IGJvb2xlYW4gPSBmYWxzZTtcbiAgcHJpdmF0ZSByZWFkb25seSBjdXN0b21FdmVudFN1cHBvcnQ6IGJvb2xlYW47XG4gIHByaXZhdGUgcmVhZG9ubHkgc3ludGhldGljTW91c2VFdmVudFN1cHBvcnQ6IGJvb2xlYW47XG5cbiAgcHJpdmF0ZSB1cGRhdGVFdmVudEluZm9Gb3JBMTF5Q2xpY2s/OiAoZXZlbnRJbmZvOiBldmVudEluZm9MaWIuRXZlbnRJbmZvKSA9PiB2b2lkID0gdW5kZWZpbmVkO1xuXG4gIHByaXZhdGUgcHJldmVudERlZmF1bHRGb3JBMTF5Q2xpY2s/OiAoZXZlbnRJbmZvOiBldmVudEluZm9MaWIuRXZlbnRJbmZvKSA9PiB2b2lkID0gdW5kZWZpbmVkO1xuXG4gIHByaXZhdGUgcG9wdWxhdGVDbGlja09ubHlBY3Rpb24/OiAoXG4gICAgYWN0aW9uRWxlbWVudDogRWxlbWVudCxcbiAgICBldmVudEluZm86IGV2ZW50SW5mb0xpYi5FdmVudEluZm8sXG4gICAgYWN0aW9uTWFwOiB7W2tleTogc3RyaW5nXTogc3RyaW5nfSxcbiAgKSA9PiB2b2lkID0gdW5kZWZpbmVkO1xuXG4gIGNvbnN0cnVjdG9yKHtcbiAgICBjdXN0b21FdmVudFN1cHBvcnQgPSBmYWxzZSxcbiAgICBzeW50aGV0aWNNb3VzZUV2ZW50U3VwcG9ydCA9IGZhbHNlLFxuICB9OiB7XG4gICAgY3VzdG9tRXZlbnRTdXBwb3J0PzogYm9vbGVhbjtcbiAgICBzeW50aGV0aWNNb3VzZUV2ZW50U3VwcG9ydD86IGJvb2xlYW47XG4gIH0gPSB7fSkge1xuICAgIHRoaXMuY3VzdG9tRXZlbnRTdXBwb3J0ID0gY3VzdG9tRXZlbnRTdXBwb3J0O1xuICAgIHRoaXMuc3ludGhldGljTW91c2VFdmVudFN1cHBvcnQgPSBzeW50aGV0aWNNb3VzZUV2ZW50U3VwcG9ydDtcbiAgfVxuXG4gIHJlc29sdmUoZXZlbnRJbmZvOiBldmVudEluZm9MaWIuRXZlbnRJbmZvKSB7XG4gICAgaWYgKHRoaXMuY3VzdG9tRXZlbnRTdXBwb3J0KSB7XG4gICAgICBpZiAoZXZlbnRJbmZvTGliLmdldEV2ZW50VHlwZShldmVudEluZm8pID09PSBFdmVudFR5cGUuQ1VTVE9NKSB7XG4gICAgICAgIGNvbnN0IGRldGFpbCA9IChldmVudEluZm9MaWIuZ2V0RXZlbnQoZXZlbnRJbmZvKSBhcyBDdXN0b21FdmVudCkuZGV0YWlsO1xuICAgICAgICAvLyBGb3IgY3VzdG9tIGV2ZW50cywgdXNlIGEgc2Vjb25kYXJ5IGRpc3BhdGNoIGJhc2VkIG9uIHRoZSBpbnRlcm5hbFxuICAgICAgICAvLyBjdXN0b20gdHlwZSBvZiB0aGUgZXZlbnQuXG4gICAgICAgIGlmICghZGV0YWlsIHx8ICFkZXRhaWxbJ190eXBlJ10pIHtcbiAgICAgICAgICAvLyBUaGlzIHNob3VsZCBuZXZlciBoYXBwZW4uXG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGV2ZW50SW5mb0xpYi5zZXRFdmVudFR5cGUoZXZlbnRJbmZvLCBkZXRhaWxbJ190eXBlJ10pO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMucG9wdWxhdGVBY3Rpb24oZXZlbnRJbmZvKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZWFyY2hlcyBmb3IgYSBqc2FjdGlvbiB0aGF0IHRoZSBET00gZXZlbnQgbWFwcyB0byBhbmQgY3JlYXRlcyBhblxuICAgKiBvYmplY3QgY29udGFpbmluZyBldmVudCBpbmZvcm1hdGlvbiB1c2VkIGZvciBkaXNwYXRjaGluZyBieVxuICAgKiBqc2FjdGlvbi5EaXNwYXRjaGVyLiBUaGlzIG1ldGhvZCBwb3B1bGF0ZXMgdGhlIGBhY3Rpb25gIGFuZCBgYWN0aW9uRWxlbWVudGBcbiAgICogZmllbGRzIG9mIHRoZSBFdmVudEluZm8gb2JqZWN0IHBhc3NlZCBpbiBieSBmaW5kaW5nIHRoZSBmaXJzdFxuICAgKiBqc2FjdGlvbiBhdHRyaWJ1dGUgYWJvdmUgdGhlIHRhcmdldCBOb2RlIG9mIHRoZSBldmVudCwgYW5kIGJlbG93XG4gICAqIHRoZSBjb250YWluZXIgTm9kZSwgdGhhdCBzcGVjaWZpZXMgYSBqc2FjdGlvbiBmb3IgdGhlIGV2ZW50XG4gICAqIHR5cGUuIElmIG5vIHN1Y2gganNhY3Rpb24gaXMgZm91bmQsIHRoZW4gYWN0aW9uIGlzIHVuZGVmaW5lZC5cbiAgICpcbiAgICogQHBhcmFtIGV2ZW50SW5mbyBgRXZlbnRJbmZvYCB0byBzZXQgYGFjdGlvbmAgYW5kIGBhY3Rpb25FbGVtZW50YCBpZiBhblxuICAgKiAgICBhY3Rpb24gaXMgZm91bmQgb24gYW55IGBFbGVtZW50YCBpbiB0aGUgcGF0aCBvZiB0aGUgYEV2ZW50YC5cbiAgICovXG4gIHByaXZhdGUgcG9wdWxhdGVBY3Rpb24oZXZlbnRJbmZvOiBldmVudEluZm9MaWIuRXZlbnRJbmZvKSB7XG4gICAgLy8gV2UgZGlzdGluZ3Vpc2ggbW9kaWZpZWQgYW5kIHBsYWluIGNsaWNrcyBpbiBvcmRlciB0byBzdXBwb3J0IHRoZVxuICAgIC8vIGRlZmF1bHQgYnJvd3NlciBiZWhhdmlvciBvZiBtb2RpZmllZCBjbGlja3Mgb24gbGlua3M7IHVzdWFsbHkgdG9cbiAgICAvLyBvcGVuIHRoZSBVUkwgb2YgdGhlIGxpbmsgaW4gbmV3IHRhYiBvciBuZXcgd2luZG93IG9uIGN0cmwvY21kXG4gICAgLy8gY2xpY2suIEEgRE9NICdjbGljaycgZXZlbnQgaXMgbWFwcGVkIHRvIHRoZSBqc2FjdGlvbiAnY2xpY2snXG4gICAgLy8gZXZlbnQgaWZmIHRoZXJlIGlzIG5vIG1vZGlmaWVyIHByZXNlbnQgb24gdGhlIGV2ZW50LiBJZiB0aGVyZSBpc1xuICAgIC8vIGEgbW9kaWZpZXIsIGl0J3MgbWFwcGVkIHRvICdjbGlja21vZCcgaW5zdGVhZC5cbiAgICAvL1xuICAgIC8vIEl0J3MgYWxsb3dlZCB0byBvbWl0IHRoZSBldmVudCBpbiB0aGUganNhY3Rpb24gYXR0cmlidXRlLiBJbiB0aGF0XG4gICAgLy8gY2FzZSwgJ2NsaWNrJyBpcyBhc3N1bWVkLiBUaHVzIHRoZSBmb2xsb3dpbmcgdHdvIGFyZSBlcXVpdmFsZW50OlxuICAgIC8vXG4gICAgLy8gICA8YSBocmVmPVwic29tZXVybFwiIGpzYWN0aW9uPVwiZ25hLmZ1XCI+XG4gICAgLy8gICA8YSBocmVmPVwic29tZXVybFwiIGpzYWN0aW9uPVwiY2xpY2s6Z25hLmZ1XCI+XG4gICAgLy9cbiAgICAvLyBGb3IgdW5tb2RpZmllZCBjbGlja3MsIEV2ZW50Q29udHJhY3QgaW52b2tlcyB0aGUganNhY3Rpb25cbiAgICAvLyAnZ25hLmZ1Jy4gRm9yIG1vZGlmaWVkIGNsaWNrcywgRXZlbnRDb250cmFjdCB3b24ndCBmaW5kIGFcbiAgICAvLyBzdWl0YWJsZSBhY3Rpb24gYW5kIGxlYXZlIHRoZSBldmVudCB0byBiZSBoYW5kbGVkIGJ5IHRoZVxuICAgIC8vIGJyb3dzZXIuXG4gICAgLy9cbiAgICAvLyBJbiBvcmRlciB0byBhbHNvIGludm9rZSBhIGpzYWN0aW9uIGhhbmRsZXIgZm9yIGEgbW9kaWZpZXIgY2xpY2ssXG4gICAgLy8gJ2NsaWNrbW9kJyBuZWVkcyB0byBiZSB1c2VkOlxuICAgIC8vXG4gICAgLy8gICA8YSBocmVmPVwic29tZXVybFwiIGpzYWN0aW9uPVwiY2xpY2ttb2Q6Z25hLmZ1XCI+XG4gICAgLy9cbiAgICAvLyBFdmVudENvbnRyYWN0IGludm9rZXMgdGhlIGpzYWN0aW9uICdnbmEuZnUnIGZvciBtb2RpZmllZFxuICAgIC8vIGNsaWNrcy4gVW5tb2RpZmllZCBjbGlja3MgYXJlIGxlZnQgdG8gdGhlIGJyb3dzZXIuXG4gICAgLy9cbiAgICAvLyBJbiBvcmRlciB0byBzZXQgdXAgdGhlIGV2ZW50IGNvbnRyYWN0IHRvIGhhbmRsZSBib3RoIGNsaWNrb25seSBhbmRcbiAgICAvLyBjbGlja21vZCwgb25seSBhZGRFdmVudChFdmVudFR5cGUuQ0xJQ0spIGlzIG5lY2Vzc2FyeS5cbiAgICAvL1xuICAgIC8vIEluIG9yZGVyIHRvIHNldCB1cCB0aGUgZXZlbnQgY29udHJhY3QgdG8gaGFuZGxlIGNsaWNrLFxuICAgIC8vIGFkZEV2ZW50KCkgaXMgbmVjZXNzYXJ5IGZvciBDTElDSywgS0VZRE9XTiwgYW5kIEtFWVBSRVNTIGV2ZW50IHR5cGVzLiAgSWZcbiAgICAvLyBhMTF5IGNsaWNrIHN1cHBvcnQgaXMgZW5hYmxlZCwgYWRkRXZlbnQoKSB3aWxsIHNldCB1cCB0aGUgYXBwcm9wcmlhdGUga2V5XG4gICAgLy8gZXZlbnQgaGFuZGxlciBhdXRvbWF0aWNhbGx5LlxuICAgIGlmIChcbiAgICAgIGV2ZW50SW5mb0xpYi5nZXRFdmVudFR5cGUoZXZlbnRJbmZvKSA9PT0gRXZlbnRUeXBlLkNMSUNLICYmXG4gICAgICBldmVudExpYi5pc01vZGlmaWVkQ2xpY2tFdmVudChldmVudEluZm9MaWIuZ2V0RXZlbnQoZXZlbnRJbmZvKSlcbiAgICApIHtcbiAgICAgIGV2ZW50SW5mb0xpYi5zZXRFdmVudFR5cGUoZXZlbnRJbmZvLCBFdmVudFR5cGUuQ0xJQ0tNT0QpO1xuICAgIH0gZWxzZSBpZiAodGhpcy5hMTF5Q2xpY2tTdXBwb3J0KSB7XG4gICAgICB0aGlzLnVwZGF0ZUV2ZW50SW5mb0ZvckExMXlDbGljayEoZXZlbnRJbmZvKTtcbiAgICB9XG5cbiAgICAvLyBXYWxrIHRvIHRoZSBwYXJlbnQgbm9kZSwgdW5sZXNzIHRoZSBub2RlIGhhcyBhIGRpZmZlcmVudCBvd25lciBpblxuICAgIC8vIHdoaWNoIGNhc2Ugd2Ugd2FsayB0byB0aGUgb3duZXIuIEF0dGVtcHQgdG8gd2FsayB0byBob3N0IG9mIGFcbiAgICAvLyBzaGFkb3cgcm9vdCBpZiBuZWVkZWQuXG4gICAgbGV0IGFjdGlvbkVsZW1lbnQ6IEVsZW1lbnQgfCBudWxsID0gZXZlbnRJbmZvTGliLmdldFRhcmdldEVsZW1lbnQoZXZlbnRJbmZvKTtcbiAgICB3aGlsZSAoYWN0aW9uRWxlbWVudCAmJiBhY3Rpb25FbGVtZW50ICE9PSBldmVudEluZm9MaWIuZ2V0Q29udGFpbmVyKGV2ZW50SW5mbykpIHtcbiAgICAgIGlmIChhY3Rpb25FbGVtZW50Lm5vZGVUeXBlID09PSBOb2RlLkVMRU1FTlRfTk9ERSkge1xuICAgICAgICB0aGlzLnBvcHVsYXRlQWN0aW9uT25FbGVtZW50KGFjdGlvbkVsZW1lbnQsIGV2ZW50SW5mbyk7XG4gICAgICB9XG5cbiAgICAgIGlmIChldmVudEluZm9MaWIuZ2V0QWN0aW9uKGV2ZW50SW5mbykpIHtcbiAgICAgICAgLy8gQW4gZXZlbnQgaXMgaGFuZGxlZCBieSBhdCBtb3N0IG9uZSBqc2FjdGlvbi4gVGh1cyB3ZSBzdG9wIGF0IHRoZVxuICAgICAgICAvLyBmaXJzdCBtYXRjaGluZyBqc2FjdGlvbiBzcGVjaWZpZWQgaW4gYSBqc2FjdGlvbiBhdHRyaWJ1dGUgdXAgdGhlXG4gICAgICAgIC8vIGFuY2VzdG9yIGNoYWluIG9mIHRoZSBldmVudCB0YXJnZXQgbm9kZS5cbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBpZiAoYWN0aW9uRWxlbWVudFtPV05FUl0pIHtcbiAgICAgICAgYWN0aW9uRWxlbWVudCA9IGFjdGlvbkVsZW1lbnRbT1dORVJdIGFzIEVsZW1lbnQ7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgaWYgKGFjdGlvbkVsZW1lbnQucGFyZW50Tm9kZT8ubm9kZU5hbWUgIT09ICcjZG9jdW1lbnQtZnJhZ21lbnQnKSB7XG4gICAgICAgIGFjdGlvbkVsZW1lbnQgPSBhY3Rpb25FbGVtZW50LnBhcmVudE5vZGUgYXMgRWxlbWVudCB8IG51bGw7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBhY3Rpb25FbGVtZW50ID0gKGFjdGlvbkVsZW1lbnQucGFyZW50Tm9kZSBhcyBTaGFkb3dSb290IHwgbnVsbCk/Lmhvc3QgPz8gbnVsbDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCBhY3Rpb24gPSBldmVudEluZm9MaWIuZ2V0QWN0aW9uKGV2ZW50SW5mbyk7XG4gICAgaWYgKCFhY3Rpb24pIHtcbiAgICAgIC8vIE5vIGFjdGlvbiBmb3VuZC5cbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5hMTF5Q2xpY2tTdXBwb3J0KSB7XG4gICAgICB0aGlzLnByZXZlbnREZWZhdWx0Rm9yQTExeUNsaWNrIShldmVudEluZm8pO1xuICAgIH1cblxuICAgIC8vIFdlIGF0dGVtcHQgdG8gaGFuZGxlIHRoZSBtb3VzZWVudGVyL21vdXNlbGVhdmUgZXZlbnRzIGhlcmUgYnlcbiAgICAvLyBkZXRlY3Rpbmcgd2hldGhlciB0aGUgbW91c2VvdmVyL21vdXNlb3V0IGV2ZW50cyBjb3JyZXNwb25kIHRvXG4gICAgLy8gZW50ZXJpbmcvbGVhdmluZyBhbiBlbGVtZW50LlxuICAgIGlmICh0aGlzLnN5bnRoZXRpY01vdXNlRXZlbnRTdXBwb3J0KSB7XG4gICAgICBpZiAoXG4gICAgICAgIGV2ZW50SW5mb0xpYi5nZXRFdmVudFR5cGUoZXZlbnRJbmZvKSA9PT0gRXZlbnRUeXBlLk1PVVNFRU5URVIgfHxcbiAgICAgICAgZXZlbnRJbmZvTGliLmdldEV2ZW50VHlwZShldmVudEluZm8pID09PSBFdmVudFR5cGUuTU9VU0VMRUFWRSB8fFxuICAgICAgICBldmVudEluZm9MaWIuZ2V0RXZlbnRUeXBlKGV2ZW50SW5mbykgPT09IEV2ZW50VHlwZS5QT0lOVEVSRU5URVIgfHxcbiAgICAgICAgZXZlbnRJbmZvTGliLmdldEV2ZW50VHlwZShldmVudEluZm8pID09PSBFdmVudFR5cGUuUE9JTlRFUkxFQVZFXG4gICAgICApIHtcbiAgICAgICAgLy8gV2UgYXR0ZW1wdCB0byBoYW5kbGUgdGhlIG1vdXNlZW50ZXIvbW91c2VsZWF2ZSBldmVudHMgaGVyZSBieVxuICAgICAgICAvLyBkZXRlY3Rpbmcgd2hldGhlciB0aGUgbW91c2VvdmVyL21vdXNlb3V0IGV2ZW50cyBjb3JyZXNwb25kIHRvXG4gICAgICAgIC8vIGVudGVyaW5nL2xlYXZpbmcgYW4gZWxlbWVudC5cbiAgICAgICAgaWYgKFxuICAgICAgICAgIGV2ZW50TGliLmlzTW91c2VTcGVjaWFsRXZlbnQoXG4gICAgICAgICAgICBldmVudEluZm9MaWIuZ2V0RXZlbnQoZXZlbnRJbmZvKSxcbiAgICAgICAgICAgIGV2ZW50SW5mb0xpYi5nZXRFdmVudFR5cGUoZXZlbnRJbmZvKSxcbiAgICAgICAgICAgIGV2ZW50SW5mb0xpYi5nZXRBY3Rpb25FbGVtZW50KGFjdGlvbiksXG4gICAgICAgICAgKVxuICAgICAgICApIHtcbiAgICAgICAgICAvLyBJZiBib3RoIG1vdXNlb3Zlci9tb3VzZW91dCBhbmQgbW91c2VlbnRlci9tb3VzZWxlYXZlIGV2ZW50cyBhcmVcbiAgICAgICAgICAvLyBlbmFibGVkLCB0d28gc2VwYXJhdGUgaGFuZGxlcnMgZm9yIG1vdXNlb3Zlci9tb3VzZW91dCBhcmVcbiAgICAgICAgICAvLyByZWdpc3RlcmVkLiBCb3RoIGhhbmRsZXJzIHdpbGwgc2VlIHRoZSBzYW1lIGV2ZW50IGluc3RhbmNlXG4gICAgICAgICAgLy8gc28gd2UgY3JlYXRlIGEgY29weSB0byBhdm9pZCBpbnRlcmZlcmluZyB3aXRoIHRoZSBkaXNwYXRjaGluZyBvZlxuICAgICAgICAgIC8vIHRoZSBtb3VzZW92ZXIvbW91c2VvdXQgZXZlbnQuXG4gICAgICAgICAgY29uc3QgY29waWVkRXZlbnQgPSBldmVudExpYi5jcmVhdGVNb3VzZVNwZWNpYWxFdmVudChcbiAgICAgICAgICAgIGV2ZW50SW5mb0xpYi5nZXRFdmVudChldmVudEluZm8pLFxuICAgICAgICAgICAgZXZlbnRJbmZvTGliLmdldEFjdGlvbkVsZW1lbnQoYWN0aW9uKSxcbiAgICAgICAgICApO1xuICAgICAgICAgIGV2ZW50SW5mb0xpYi5zZXRFdmVudChldmVudEluZm8sIGNvcGllZEV2ZW50KTtcbiAgICAgICAgICAvLyBTaW5jZSB0aGUgbW91c2VlbnRlci9tb3VzZWxlYXZlIGV2ZW50cyBkbyBub3QgYnViYmxlLCB0aGUgdGFyZ2V0XG4gICAgICAgICAgLy8gb2YgdGhlIGV2ZW50IGlzIHRlY2huaWNhbGx5IHRoZSBgYWN0aW9uRWxlbWVudGAgKHRoZSBub2RlIHdpdGggdGhlXG4gICAgICAgICAgLy8gYGpzYWN0aW9uYCBhdHRyaWJ1dGUpXG4gICAgICAgICAgZXZlbnRJbmZvTGliLnNldFRhcmdldEVsZW1lbnQoZXZlbnRJbmZvLCBldmVudEluZm9MaWIuZ2V0QWN0aW9uRWxlbWVudChhY3Rpb24pKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBldmVudEluZm9MaWIudW5zZXRBY3Rpb24oZXZlbnRJbmZvKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBBY2Nlc3NlcyB0aGUganNhY3Rpb24gbWFwIG9uIGEgbm9kZSBhbmQgcmV0cmlldmVzIHRoZSBuYW1lIG9mIHRoZVxuICAgKiBhY3Rpb24gdGhlIGdpdmVuIGV2ZW50IGlzIG1hcHBlZCB0bywgaWYgYW55LiBJdCBwYXJzZXMgdGhlXG4gICAqIGF0dHJpYnV0ZSB2YWx1ZSBhbmQgc3RvcmVzIGl0IGluIGEgcHJvcGVydHkgb24gdGhlIG5vZGUgZm9yXG4gICAqIHN1YnNlcXVlbnQgcmV0cmlldmFsIHdpdGhvdXQgcmUtcGFyc2luZyBhbmQgcmUtYWNjZXNzaW5nIHRoZVxuICAgKiBhdHRyaWJ1dGUuXG4gICAqXG4gICAqIEBwYXJhbSBhY3Rpb25FbGVtZW50IFRoZSBET00gbm9kZSB0byByZXRyaWV2ZSB0aGUganNhY3Rpb24gbWFwIGZyb20uXG4gICAqIEBwYXJhbSBldmVudEluZm8gYEV2ZW50SW5mb2AgdG8gc2V0IGBhY3Rpb25gIGFuZCBgYWN0aW9uRWxlbWVudGAgaWYgYW5cbiAgICogICAgYWN0aW9uIGlzIGZvdW5kIG9uIHRoZSBgYWN0aW9uRWxlbWVudGAuXG4gICAqL1xuICBwcml2YXRlIHBvcHVsYXRlQWN0aW9uT25FbGVtZW50KGFjdGlvbkVsZW1lbnQ6IEVsZW1lbnQsIGV2ZW50SW5mbzogZXZlbnRJbmZvTGliLkV2ZW50SW5mbykge1xuICAgIGNvbnN0IGFjdGlvbk1hcCA9IHRoaXMucGFyc2VBY3Rpb25zKGFjdGlvbkVsZW1lbnQpO1xuXG4gICAgY29uc3QgYWN0aW9uTmFtZSA9IGFjdGlvbk1hcFtldmVudEluZm9MaWIuZ2V0RXZlbnRUeXBlKGV2ZW50SW5mbyldO1xuICAgIGlmIChhY3Rpb25OYW1lICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGV2ZW50SW5mb0xpYi5zZXRBY3Rpb24oZXZlbnRJbmZvLCBhY3Rpb25OYW1lLCBhY3Rpb25FbGVtZW50KTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5hMTF5Q2xpY2tTdXBwb3J0KSB7XG4gICAgICB0aGlzLnBvcHVsYXRlQ2xpY2tPbmx5QWN0aW9uIShhY3Rpb25FbGVtZW50LCBldmVudEluZm8sIGFjdGlvbk1hcCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFBhcnNlcyBhbmQgY2FjaGVzIGFuIGVsZW1lbnQncyBqc2FjdGlvbiBlbGVtZW50IGludG8gYSBtYXAuXG4gICAqXG4gICAqIFRoaXMgaXMgcHJpbWFyaWx5IGZvciBpbnRlcm5hbCB1c2UuXG4gICAqXG4gICAqIEBwYXJhbSBhY3Rpb25FbGVtZW50IFRoZSBET00gbm9kZSB0byByZXRyaWV2ZSB0aGUganNhY3Rpb24gbWFwIGZyb20uXG4gICAqIEByZXR1cm4gTWFwIGZyb20gZXZlbnQgdG8gcXVhbGlmaWVkIG5hbWUgb2YgdGhlIGpzYWN0aW9uIGJvdW5kIHRvIGl0LlxuICAgKi9cbiAgcHJpdmF0ZSBwYXJzZUFjdGlvbnMoYWN0aW9uRWxlbWVudDogRWxlbWVudCk6IHtba2V5OiBzdHJpbmddOiBzdHJpbmd9IHtcbiAgICBsZXQgYWN0aW9uTWFwOiB7W2tleTogc3RyaW5nXTogc3RyaW5nfSB8IHVuZGVmaW5lZCA9IGNhY2hlLmdldChhY3Rpb25FbGVtZW50KTtcbiAgICBpZiAoIWFjdGlvbk1hcCkge1xuICAgICAgY29uc3QganNhY3Rpb25BdHRyaWJ1dGUgPSBhY3Rpb25FbGVtZW50LmdldEF0dHJpYnV0ZShBdHRyaWJ1dGUuSlNBQ1RJT04pO1xuICAgICAgaWYgKCFqc2FjdGlvbkF0dHJpYnV0ZSkge1xuICAgICAgICBhY3Rpb25NYXAgPSBFTVBUWV9BQ1RJT05fTUFQO1xuICAgICAgICBjYWNoZS5zZXQoYWN0aW9uRWxlbWVudCwgYWN0aW9uTWFwKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGFjdGlvbk1hcCA9IGNhY2hlLmdldFBhcnNlZChqc2FjdGlvbkF0dHJpYnV0ZSk7XG4gICAgICAgIGlmICghYWN0aW9uTWFwKSB7XG4gICAgICAgICAgYWN0aW9uTWFwID0ge307XG4gICAgICAgICAgY29uc3QgdmFsdWVzID0ganNhY3Rpb25BdHRyaWJ1dGUuc3BsaXQoUkVHRVhQX1NFTUlDT0xPTik7XG4gICAgICAgICAgZm9yIChsZXQgaWR4ID0gMDsgaWR4IDwgdmFsdWVzLmxlbmd0aDsgaWR4KyspIHtcbiAgICAgICAgICAgIGNvbnN0IHZhbHVlID0gdmFsdWVzW2lkeF07XG4gICAgICAgICAgICBpZiAoIXZhbHVlKSB7XG4gICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgY29sb24gPSB2YWx1ZS5pbmRleE9mKENoYXIuRVZFTlRfQUNUSU9OX1NFUEFSQVRPUik7XG4gICAgICAgICAgICBjb25zdCBoYXNDb2xvbiA9IGNvbG9uICE9PSAtMTtcbiAgICAgICAgICAgIGNvbnN0IHR5cGUgPSBoYXNDb2xvbiA/IHZhbHVlLnN1YnN0cigwLCBjb2xvbikudHJpbSgpIDogREVGQVVMVF9FVkVOVF9UWVBFO1xuICAgICAgICAgICAgY29uc3QgYWN0aW9uID0gaGFzQ29sb24gPyB2YWx1ZS5zdWJzdHIoY29sb24gKyAxKS50cmltKCkgOiB2YWx1ZTtcbiAgICAgICAgICAgIGFjdGlvbk1hcFt0eXBlXSA9IGFjdGlvbjtcbiAgICAgICAgICB9XG4gICAgICAgICAgY2FjaGUuc2V0UGFyc2VkKGpzYWN0aW9uQXR0cmlidXRlLCBhY3Rpb25NYXApO1xuICAgICAgICB9XG4gICAgICAgIGNhY2hlLnNldChhY3Rpb25FbGVtZW50LCBhY3Rpb25NYXApO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gYWN0aW9uTWFwO1xuICB9XG5cbiAgYWRkQTExeUNsaWNrU3VwcG9ydChcbiAgICB1cGRhdGVFdmVudEluZm9Gb3JBMTF5Q2xpY2s6IHR5cGVvZiBhMTF5Q2xpY2sudXBkYXRlRXZlbnRJbmZvRm9yQTExeUNsaWNrLFxuICAgIHByZXZlbnREZWZhdWx0Rm9yQTExeUNsaWNrOiB0eXBlb2YgYTExeUNsaWNrLnByZXZlbnREZWZhdWx0Rm9yQTExeUNsaWNrLFxuICAgIHBvcHVsYXRlQ2xpY2tPbmx5QWN0aW9uOiB0eXBlb2YgYTExeUNsaWNrLnBvcHVsYXRlQ2xpY2tPbmx5QWN0aW9uLFxuICApIHtcbiAgICB0aGlzLmExMXlDbGlja1N1cHBvcnQgPSB0cnVlO1xuICAgIHRoaXMudXBkYXRlRXZlbnRJbmZvRm9yQTExeUNsaWNrID0gdXBkYXRlRXZlbnRJbmZvRm9yQTExeUNsaWNrO1xuICAgIHRoaXMucHJldmVudERlZmF1bHRGb3JBMTF5Q2xpY2sgPSBwcmV2ZW50RGVmYXVsdEZvckExMXlDbGljaztcbiAgICB0aGlzLnBvcHVsYXRlQ2xpY2tPbmx5QWN0aW9uID0gcG9wdWxhdGVDbGlja09ubHlBY3Rpb247XG4gIH1cbn1cbiJdfQ==