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
    constructor({ syntheticMouseEventSupport = false, } = {}) {
        this.a11yClickSupport = false;
        this.updateEventInfoForA11yClick = undefined;
        this.preventDefaultForA11yClick = undefined;
        this.populateClickOnlyAction = undefined;
        this.syntheticMouseEventSupport = syntheticMouseEventSupport;
    }
    resolve(eventInfo) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWN0aW9uX3Jlc29sdmVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9wcmltaXRpdmVzL2V2ZW50LWRpc3BhdGNoL3NyYy9hY3Rpb25fcmVzb2x2ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLGFBQWEsQ0FBQztBQUN0QyxPQUFPLEVBQUMsSUFBSSxFQUFDLE1BQU0sUUFBUSxDQUFDO0FBQzVCLE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxjQUFjLENBQUM7QUFDdkMsT0FBTyxFQUFDLEtBQUssRUFBQyxNQUFNLFlBQVksQ0FBQztBQUVqQyxPQUFPLEtBQUssS0FBSyxNQUFNLFNBQVMsQ0FBQztBQUNqQyxPQUFPLEtBQUssWUFBWSxNQUFNLGNBQWMsQ0FBQztBQUM3QyxPQUFPLEtBQUssUUFBUSxNQUFNLFNBQVMsQ0FBQztBQUVwQzs7O0dBR0c7QUFDSCxNQUFNLGdCQUFnQixHQUE0QixFQUFFLENBQUM7QUFFckQ7O0dBRUc7QUFDSCxNQUFNLGdCQUFnQixHQUFHLFNBQVMsQ0FBQztBQUVuQyx3REFBd0Q7QUFDeEQsTUFBTSxrQkFBa0IsR0FBVyxTQUFTLENBQUMsS0FBSyxDQUFDO0FBRW5ELG1DQUFtQztBQUNuQyxNQUFNLE9BQU8sY0FBYztJQWN6QixZQUFZLEVBQ1YsMEJBQTBCLEdBQUcsS0FBSyxNQUdoQyxFQUFFO1FBakJFLHFCQUFnQixHQUFZLEtBQUssQ0FBQztRQUdsQyxnQ0FBMkIsR0FBaUQsU0FBUyxDQUFDO1FBRXRGLCtCQUEwQixHQUFpRCxTQUFTLENBQUM7UUFFckYsNEJBQXVCLEdBSW5CLFNBQVMsQ0FBQztRQU9wQixJQUFJLENBQUMsMEJBQTBCLEdBQUcsMEJBQTBCLENBQUM7SUFDL0QsQ0FBQztJQUVELE9BQU8sQ0FBQyxTQUFpQztRQUN2QyxJQUFJLENBQUMsY0FBYyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0lBQ2pDLENBQUM7SUFFRDs7Ozs7Ozs7Ozs7T0FXRztJQUNLLGNBQWMsQ0FBQyxTQUFpQztRQUN0RCxtRUFBbUU7UUFDbkUsbUVBQW1FO1FBQ25FLGdFQUFnRTtRQUNoRSwrREFBK0Q7UUFDL0QsbUVBQW1FO1FBQ25FLGlEQUFpRDtRQUNqRCxFQUFFO1FBQ0Ysb0VBQW9FO1FBQ3BFLG1FQUFtRTtRQUNuRSxFQUFFO1FBQ0YseUNBQXlDO1FBQ3pDLCtDQUErQztRQUMvQyxFQUFFO1FBQ0YsNERBQTREO1FBQzVELDREQUE0RDtRQUM1RCwyREFBMkQ7UUFDM0QsV0FBVztRQUNYLEVBQUU7UUFDRixtRUFBbUU7UUFDbkUsK0JBQStCO1FBQy9CLEVBQUU7UUFDRixrREFBa0Q7UUFDbEQsRUFBRTtRQUNGLDJEQUEyRDtRQUMzRCxxREFBcUQ7UUFDckQsRUFBRTtRQUNGLHFFQUFxRTtRQUNyRSx5REFBeUQ7UUFDekQsRUFBRTtRQUNGLHlEQUF5RDtRQUN6RCw0RUFBNEU7UUFDNUUsNEVBQTRFO1FBQzVFLCtCQUErQjtRQUMvQixJQUNFLFlBQVksQ0FBQyxZQUFZLENBQUMsU0FBUyxDQUFDLEtBQUssU0FBUyxDQUFDLEtBQUs7WUFDeEQsUUFBUSxDQUFDLG9CQUFvQixDQUFDLFlBQVksQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLENBQUMsRUFDL0QsQ0FBQztZQUNELFlBQVksQ0FBQyxZQUFZLENBQUMsU0FBUyxFQUFFLFNBQVMsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUMzRCxDQUFDO2FBQU0sSUFBSSxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztZQUNqQyxJQUFJLENBQUMsMkJBQTRCLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDL0MsQ0FBQztRQUVELG9FQUFvRTtRQUNwRSxnRUFBZ0U7UUFDaEUseUJBQXlCO1FBQ3pCLElBQUksYUFBYSxHQUFtQixZQUFZLENBQUMsZ0JBQWdCLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDN0UsT0FBTyxhQUFhLElBQUksYUFBYSxLQUFLLFlBQVksQ0FBQyxZQUFZLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQztZQUMvRSxJQUFJLGFBQWEsQ0FBQyxRQUFRLEtBQUssSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO2dCQUNqRCxJQUFJLENBQUMsdUJBQXVCLENBQUMsYUFBYSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQ3pELENBQUM7WUFFRCxJQUFJLFlBQVksQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQztnQkFDdEMsbUVBQW1FO2dCQUNuRSxtRUFBbUU7Z0JBQ25FLDJDQUEyQztnQkFDM0MsTUFBTTtZQUNSLENBQUM7WUFDRCxJQUFJLGFBQWEsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDO2dCQUN6QixhQUFhLEdBQUcsYUFBYSxDQUFDLEtBQUssQ0FBWSxDQUFDO2dCQUNoRCxTQUFTO1lBQ1gsQ0FBQztZQUNELElBQUksYUFBYSxDQUFDLFVBQVUsRUFBRSxRQUFRLEtBQUssb0JBQW9CLEVBQUUsQ0FBQztnQkFDaEUsYUFBYSxHQUFHLGFBQWEsQ0FBQyxVQUE0QixDQUFDO1lBQzdELENBQUM7aUJBQU0sQ0FBQztnQkFDTixhQUFhLEdBQUksYUFBYSxDQUFDLFVBQWdDLEVBQUUsSUFBSSxJQUFJLElBQUksQ0FBQztZQUNoRixDQUFDO1FBQ0gsQ0FBQztRQUVELE1BQU0sTUFBTSxHQUFHLFlBQVksQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDakQsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO1lBQ1osbUJBQW1CO1lBQ25CLE9BQU87UUFDVCxDQUFDO1FBRUQsSUFBSSxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztZQUMxQixJQUFJLENBQUMsMEJBQTJCLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDOUMsQ0FBQztRQUVELGdFQUFnRTtRQUNoRSxnRUFBZ0U7UUFDaEUsK0JBQStCO1FBQy9CLElBQUksSUFBSSxDQUFDLDBCQUEwQixFQUFFLENBQUM7WUFDcEMsSUFDRSxZQUFZLENBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBQyxLQUFLLFNBQVMsQ0FBQyxVQUFVO2dCQUM3RCxZQUFZLENBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBQyxLQUFLLFNBQVMsQ0FBQyxVQUFVO2dCQUM3RCxZQUFZLENBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBQyxLQUFLLFNBQVMsQ0FBQyxZQUFZO2dCQUMvRCxZQUFZLENBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBQyxLQUFLLFNBQVMsQ0FBQyxZQUFZLEVBQy9ELENBQUM7Z0JBQ0QsZ0VBQWdFO2dCQUNoRSxnRUFBZ0U7Z0JBQ2hFLCtCQUErQjtnQkFDL0IsSUFDRSxRQUFRLENBQUMsbUJBQW1CLENBQzFCLFlBQVksQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLEVBQ2hDLFlBQVksQ0FBQyxZQUFZLENBQUMsU0FBUyxDQUFDLEVBQ3BDLFlBQVksQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsQ0FDdEMsRUFDRCxDQUFDO29CQUNELGtFQUFrRTtvQkFDbEUsNERBQTREO29CQUM1RCw2REFBNkQ7b0JBQzdELG1FQUFtRTtvQkFDbkUsZ0NBQWdDO29CQUNoQyxNQUFNLFdBQVcsR0FBRyxRQUFRLENBQUMsdUJBQXVCLENBQ2xELFlBQVksQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLEVBQ2hDLFlBQVksQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsQ0FDdEMsQ0FBQztvQkFDRixZQUFZLENBQUMsUUFBUSxDQUFDLFNBQVMsRUFBRSxXQUFXLENBQUMsQ0FBQztvQkFDOUMsbUVBQW1FO29CQUNuRSxxRUFBcUU7b0JBQ3JFLHdCQUF3QjtvQkFDeEIsWUFBWSxDQUFDLGdCQUFnQixDQUFDLFNBQVMsRUFBRSxZQUFZLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztnQkFDbEYsQ0FBQztxQkFBTSxDQUFDO29CQUNOLFlBQVksQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLENBQUM7Z0JBQ3RDLENBQUM7WUFDSCxDQUFDO1FBQ0gsQ0FBQztJQUNILENBQUM7SUFFRDs7Ozs7Ozs7OztPQVVHO0lBQ0ssdUJBQXVCLENBQUMsYUFBc0IsRUFBRSxTQUFpQztRQUN2RixNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLGFBQWEsQ0FBQyxDQUFDO1FBRW5ELE1BQU0sVUFBVSxHQUFHLFNBQVMsQ0FBQyxZQUFZLENBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7UUFDbkUsSUFBSSxVQUFVLEtBQUssU0FBUyxFQUFFLENBQUM7WUFDN0IsWUFBWSxDQUFDLFNBQVMsQ0FBQyxTQUFTLEVBQUUsVUFBVSxFQUFFLGFBQWEsQ0FBQyxDQUFDO1FBQy9ELENBQUM7UUFFRCxJQUFJLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO1lBQzFCLElBQUksQ0FBQyx1QkFBd0IsQ0FBQyxhQUFhLEVBQUUsU0FBUyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1FBQ3JFLENBQUM7SUFDSCxDQUFDO0lBRUQ7Ozs7Ozs7T0FPRztJQUNLLFlBQVksQ0FBQyxhQUFzQjtRQUN6QyxJQUFJLFNBQVMsR0FBd0MsS0FBSyxDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUMsQ0FBQztRQUM5RSxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7WUFDZixNQUFNLGlCQUFpQixHQUFHLGFBQWEsQ0FBQyxZQUFZLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ3pFLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO2dCQUN2QixTQUFTLEdBQUcsZ0JBQWdCLENBQUM7Z0JBQzdCLEtBQUssQ0FBQyxHQUFHLENBQUMsYUFBYSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQ3RDLENBQUM7aUJBQU0sQ0FBQztnQkFDTixTQUFTLEdBQUcsS0FBSyxDQUFDLFNBQVMsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO2dCQUMvQyxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7b0JBQ2YsU0FBUyxHQUFHLEVBQUUsQ0FBQztvQkFDZixNQUFNLE1BQU0sR0FBRyxpQkFBaUIsQ0FBQyxLQUFLLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztvQkFDekQsS0FBSyxJQUFJLEdBQUcsR0FBRyxDQUFDLEVBQUUsR0FBRyxHQUFHLE1BQU0sQ0FBQyxNQUFNLEVBQUUsR0FBRyxFQUFFLEVBQUUsQ0FBQzt3QkFDN0MsTUFBTSxLQUFLLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO3dCQUMxQixJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7NEJBQ1gsU0FBUzt3QkFDWCxDQUFDO3dCQUNELE1BQU0sS0FBSyxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLHNCQUFzQixDQUFDLENBQUM7d0JBQ3pELE1BQU0sUUFBUSxHQUFHLEtBQUssS0FBSyxDQUFDLENBQUMsQ0FBQzt3QkFDOUIsTUFBTSxJQUFJLEdBQUcsUUFBUSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsa0JBQWtCLENBQUM7d0JBQzNFLE1BQU0sTUFBTSxHQUFHLFFBQVEsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQzt3QkFDakUsU0FBUyxDQUFDLElBQUksQ0FBQyxHQUFHLE1BQU0sQ0FBQztvQkFDM0IsQ0FBQztvQkFDRCxLQUFLLENBQUMsU0FBUyxDQUFDLGlCQUFpQixFQUFFLFNBQVMsQ0FBQyxDQUFDO2dCQUNoRCxDQUFDO2dCQUNELEtBQUssQ0FBQyxHQUFHLENBQUMsYUFBYSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQ3RDLENBQUM7UUFDSCxDQUFDO1FBQ0QsT0FBTyxTQUFTLENBQUM7SUFDbkIsQ0FBQztJQUVELG1CQUFtQixDQUNqQiwyQkFBeUUsRUFDekUsMEJBQXVFLEVBQ3ZFLHVCQUFpRTtRQUVqRSxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsSUFBSSxDQUFDO1FBQzdCLElBQUksQ0FBQywyQkFBMkIsR0FBRywyQkFBMkIsQ0FBQztRQUMvRCxJQUFJLENBQUMsMEJBQTBCLEdBQUcsMEJBQTBCLENBQUM7UUFDN0QsSUFBSSxDQUFDLHVCQUF1QixHQUFHLHVCQUF1QixDQUFDO0lBQ3pELENBQUM7Q0FDRiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0F0dHJpYnV0ZX0gZnJvbSAnLi9hdHRyaWJ1dGUnO1xuaW1wb3J0IHtDaGFyfSBmcm9tICcuL2NoYXInO1xuaW1wb3J0IHtFdmVudFR5cGV9IGZyb20gJy4vZXZlbnRfdHlwZSc7XG5pbXBvcnQge09XTkVSfSBmcm9tICcuL3Byb3BlcnR5JztcbmltcG9ydCAqIGFzIGExMXlDbGljayBmcm9tICcuL2ExMXlfY2xpY2snO1xuaW1wb3J0ICogYXMgY2FjaGUgZnJvbSAnLi9jYWNoZSc7XG5pbXBvcnQgKiBhcyBldmVudEluZm9MaWIgZnJvbSAnLi9ldmVudF9pbmZvJztcbmltcG9ydCAqIGFzIGV2ZW50TGliIGZyb20gJy4vZXZlbnQnO1xuXG4vKipcbiAqIFNpbmNlIG1hcHMgZnJvbSBldmVudCB0byBhY3Rpb24gYXJlIGltbXV0YWJsZSB3ZSBjYW4gdXNlIGEgc2luZ2xlIG1hcFxuICogdG8gcmVwcmVzZW50IHRoZSBlbXB0eSBtYXAuXG4gKi9cbmNvbnN0IEVNUFRZX0FDVElPTl9NQVA6IHtba2V5OiBzdHJpbmddOiBzdHJpbmd9ID0ge307XG5cbi8qKlxuICogVGhpcyByZWd1bGFyIGV4cHJlc3Npb24gbWF0Y2hlcyBhIHNlbWljb2xvbi5cbiAqL1xuY29uc3QgUkVHRVhQX1NFTUlDT0xPTiA9IC9cXHMqO1xccyovO1xuXG4vKiogSWYgbm8gZXZlbnQgdHlwZSBpcyBkZWZpbmVkLCBkZWZhdWx0cyB0byBgY2xpY2tgLiAqL1xuY29uc3QgREVGQVVMVF9FVkVOVF9UWVBFOiBzdHJpbmcgPSBFdmVudFR5cGUuQ0xJQ0s7XG5cbi8qKiBSZXNvbHZlcyBhY3Rpb25zIGZvciBFdmVudHMuICovXG5leHBvcnQgY2xhc3MgQWN0aW9uUmVzb2x2ZXIge1xuICBwcml2YXRlIGExMXlDbGlja1N1cHBvcnQ6IGJvb2xlYW4gPSBmYWxzZTtcbiAgcHJpdmF0ZSByZWFkb25seSBzeW50aGV0aWNNb3VzZUV2ZW50U3VwcG9ydDogYm9vbGVhbjtcblxuICBwcml2YXRlIHVwZGF0ZUV2ZW50SW5mb0ZvckExMXlDbGljaz86IChldmVudEluZm86IGV2ZW50SW5mb0xpYi5FdmVudEluZm8pID0+IHZvaWQgPSB1bmRlZmluZWQ7XG5cbiAgcHJpdmF0ZSBwcmV2ZW50RGVmYXVsdEZvckExMXlDbGljaz86IChldmVudEluZm86IGV2ZW50SW5mb0xpYi5FdmVudEluZm8pID0+IHZvaWQgPSB1bmRlZmluZWQ7XG5cbiAgcHJpdmF0ZSBwb3B1bGF0ZUNsaWNrT25seUFjdGlvbj86IChcbiAgICBhY3Rpb25FbGVtZW50OiBFbGVtZW50LFxuICAgIGV2ZW50SW5mbzogZXZlbnRJbmZvTGliLkV2ZW50SW5mbyxcbiAgICBhY3Rpb25NYXA6IHtba2V5OiBzdHJpbmddOiBzdHJpbmd9LFxuICApID0+IHZvaWQgPSB1bmRlZmluZWQ7XG5cbiAgY29uc3RydWN0b3Ioe1xuICAgIHN5bnRoZXRpY01vdXNlRXZlbnRTdXBwb3J0ID0gZmFsc2UsXG4gIH06IHtcbiAgICBzeW50aGV0aWNNb3VzZUV2ZW50U3VwcG9ydD86IGJvb2xlYW47XG4gIH0gPSB7fSkge1xuICAgIHRoaXMuc3ludGhldGljTW91c2VFdmVudFN1cHBvcnQgPSBzeW50aGV0aWNNb3VzZUV2ZW50U3VwcG9ydDtcbiAgfVxuXG4gIHJlc29sdmUoZXZlbnRJbmZvOiBldmVudEluZm9MaWIuRXZlbnRJbmZvKSB7XG4gICAgdGhpcy5wb3B1bGF0ZUFjdGlvbihldmVudEluZm8pO1xuICB9XG5cbiAgLyoqXG4gICAqIFNlYXJjaGVzIGZvciBhIGpzYWN0aW9uIHRoYXQgdGhlIERPTSBldmVudCBtYXBzIHRvIGFuZCBjcmVhdGVzIGFuXG4gICAqIG9iamVjdCBjb250YWluaW5nIGV2ZW50IGluZm9ybWF0aW9uIHVzZWQgZm9yIGRpc3BhdGNoaW5nIGJ5XG4gICAqIGpzYWN0aW9uLkRpc3BhdGNoZXIuIFRoaXMgbWV0aG9kIHBvcHVsYXRlcyB0aGUgYGFjdGlvbmAgYW5kIGBhY3Rpb25FbGVtZW50YFxuICAgKiBmaWVsZHMgb2YgdGhlIEV2ZW50SW5mbyBvYmplY3QgcGFzc2VkIGluIGJ5IGZpbmRpbmcgdGhlIGZpcnN0XG4gICAqIGpzYWN0aW9uIGF0dHJpYnV0ZSBhYm92ZSB0aGUgdGFyZ2V0IE5vZGUgb2YgdGhlIGV2ZW50LCBhbmQgYmVsb3dcbiAgICogdGhlIGNvbnRhaW5lciBOb2RlLCB0aGF0IHNwZWNpZmllcyBhIGpzYWN0aW9uIGZvciB0aGUgZXZlbnRcbiAgICogdHlwZS4gSWYgbm8gc3VjaCBqc2FjdGlvbiBpcyBmb3VuZCwgdGhlbiBhY3Rpb24gaXMgdW5kZWZpbmVkLlxuICAgKlxuICAgKiBAcGFyYW0gZXZlbnRJbmZvIGBFdmVudEluZm9gIHRvIHNldCBgYWN0aW9uYCBhbmQgYGFjdGlvbkVsZW1lbnRgIGlmIGFuXG4gICAqICAgIGFjdGlvbiBpcyBmb3VuZCBvbiBhbnkgYEVsZW1lbnRgIGluIHRoZSBwYXRoIG9mIHRoZSBgRXZlbnRgLlxuICAgKi9cbiAgcHJpdmF0ZSBwb3B1bGF0ZUFjdGlvbihldmVudEluZm86IGV2ZW50SW5mb0xpYi5FdmVudEluZm8pIHtcbiAgICAvLyBXZSBkaXN0aW5ndWlzaCBtb2RpZmllZCBhbmQgcGxhaW4gY2xpY2tzIGluIG9yZGVyIHRvIHN1cHBvcnQgdGhlXG4gICAgLy8gZGVmYXVsdCBicm93c2VyIGJlaGF2aW9yIG9mIG1vZGlmaWVkIGNsaWNrcyBvbiBsaW5rczsgdXN1YWxseSB0b1xuICAgIC8vIG9wZW4gdGhlIFVSTCBvZiB0aGUgbGluayBpbiBuZXcgdGFiIG9yIG5ldyB3aW5kb3cgb24gY3RybC9jbWRcbiAgICAvLyBjbGljay4gQSBET00gJ2NsaWNrJyBldmVudCBpcyBtYXBwZWQgdG8gdGhlIGpzYWN0aW9uICdjbGljaydcbiAgICAvLyBldmVudCBpZmYgdGhlcmUgaXMgbm8gbW9kaWZpZXIgcHJlc2VudCBvbiB0aGUgZXZlbnQuIElmIHRoZXJlIGlzXG4gICAgLy8gYSBtb2RpZmllciwgaXQncyBtYXBwZWQgdG8gJ2NsaWNrbW9kJyBpbnN0ZWFkLlxuICAgIC8vXG4gICAgLy8gSXQncyBhbGxvd2VkIHRvIG9taXQgdGhlIGV2ZW50IGluIHRoZSBqc2FjdGlvbiBhdHRyaWJ1dGUuIEluIHRoYXRcbiAgICAvLyBjYXNlLCAnY2xpY2snIGlzIGFzc3VtZWQuIFRodXMgdGhlIGZvbGxvd2luZyB0d28gYXJlIGVxdWl2YWxlbnQ6XG4gICAgLy9cbiAgICAvLyAgIDxhIGhyZWY9XCJzb21ldXJsXCIganNhY3Rpb249XCJnbmEuZnVcIj5cbiAgICAvLyAgIDxhIGhyZWY9XCJzb21ldXJsXCIganNhY3Rpb249XCJjbGljazpnbmEuZnVcIj5cbiAgICAvL1xuICAgIC8vIEZvciB1bm1vZGlmaWVkIGNsaWNrcywgRXZlbnRDb250cmFjdCBpbnZva2VzIHRoZSBqc2FjdGlvblxuICAgIC8vICdnbmEuZnUnLiBGb3IgbW9kaWZpZWQgY2xpY2tzLCBFdmVudENvbnRyYWN0IHdvbid0IGZpbmQgYVxuICAgIC8vIHN1aXRhYmxlIGFjdGlvbiBhbmQgbGVhdmUgdGhlIGV2ZW50IHRvIGJlIGhhbmRsZWQgYnkgdGhlXG4gICAgLy8gYnJvd3Nlci5cbiAgICAvL1xuICAgIC8vIEluIG9yZGVyIHRvIGFsc28gaW52b2tlIGEganNhY3Rpb24gaGFuZGxlciBmb3IgYSBtb2RpZmllciBjbGljayxcbiAgICAvLyAnY2xpY2ttb2QnIG5lZWRzIHRvIGJlIHVzZWQ6XG4gICAgLy9cbiAgICAvLyAgIDxhIGhyZWY9XCJzb21ldXJsXCIganNhY3Rpb249XCJjbGlja21vZDpnbmEuZnVcIj5cbiAgICAvL1xuICAgIC8vIEV2ZW50Q29udHJhY3QgaW52b2tlcyB0aGUganNhY3Rpb24gJ2duYS5mdScgZm9yIG1vZGlmaWVkXG4gICAgLy8gY2xpY2tzLiBVbm1vZGlmaWVkIGNsaWNrcyBhcmUgbGVmdCB0byB0aGUgYnJvd3Nlci5cbiAgICAvL1xuICAgIC8vIEluIG9yZGVyIHRvIHNldCB1cCB0aGUgZXZlbnQgY29udHJhY3QgdG8gaGFuZGxlIGJvdGggY2xpY2tvbmx5IGFuZFxuICAgIC8vIGNsaWNrbW9kLCBvbmx5IGFkZEV2ZW50KEV2ZW50VHlwZS5DTElDSykgaXMgbmVjZXNzYXJ5LlxuICAgIC8vXG4gICAgLy8gSW4gb3JkZXIgdG8gc2V0IHVwIHRoZSBldmVudCBjb250cmFjdCB0byBoYW5kbGUgY2xpY2ssXG4gICAgLy8gYWRkRXZlbnQoKSBpcyBuZWNlc3NhcnkgZm9yIENMSUNLLCBLRVlET1dOLCBhbmQgS0VZUFJFU1MgZXZlbnQgdHlwZXMuICBJZlxuICAgIC8vIGExMXkgY2xpY2sgc3VwcG9ydCBpcyBlbmFibGVkLCBhZGRFdmVudCgpIHdpbGwgc2V0IHVwIHRoZSBhcHByb3ByaWF0ZSBrZXlcbiAgICAvLyBldmVudCBoYW5kbGVyIGF1dG9tYXRpY2FsbHkuXG4gICAgaWYgKFxuICAgICAgZXZlbnRJbmZvTGliLmdldEV2ZW50VHlwZShldmVudEluZm8pID09PSBFdmVudFR5cGUuQ0xJQ0sgJiZcbiAgICAgIGV2ZW50TGliLmlzTW9kaWZpZWRDbGlja0V2ZW50KGV2ZW50SW5mb0xpYi5nZXRFdmVudChldmVudEluZm8pKVxuICAgICkge1xuICAgICAgZXZlbnRJbmZvTGliLnNldEV2ZW50VHlwZShldmVudEluZm8sIEV2ZW50VHlwZS5DTElDS01PRCk7XG4gICAgfSBlbHNlIGlmICh0aGlzLmExMXlDbGlja1N1cHBvcnQpIHtcbiAgICAgIHRoaXMudXBkYXRlRXZlbnRJbmZvRm9yQTExeUNsaWNrIShldmVudEluZm8pO1xuICAgIH1cblxuICAgIC8vIFdhbGsgdG8gdGhlIHBhcmVudCBub2RlLCB1bmxlc3MgdGhlIG5vZGUgaGFzIGEgZGlmZmVyZW50IG93bmVyIGluXG4gICAgLy8gd2hpY2ggY2FzZSB3ZSB3YWxrIHRvIHRoZSBvd25lci4gQXR0ZW1wdCB0byB3YWxrIHRvIGhvc3Qgb2YgYVxuICAgIC8vIHNoYWRvdyByb290IGlmIG5lZWRlZC5cbiAgICBsZXQgYWN0aW9uRWxlbWVudDogRWxlbWVudCB8IG51bGwgPSBldmVudEluZm9MaWIuZ2V0VGFyZ2V0RWxlbWVudChldmVudEluZm8pO1xuICAgIHdoaWxlIChhY3Rpb25FbGVtZW50ICYmIGFjdGlvbkVsZW1lbnQgIT09IGV2ZW50SW5mb0xpYi5nZXRDb250YWluZXIoZXZlbnRJbmZvKSkge1xuICAgICAgaWYgKGFjdGlvbkVsZW1lbnQubm9kZVR5cGUgPT09IE5vZGUuRUxFTUVOVF9OT0RFKSB7XG4gICAgICAgIHRoaXMucG9wdWxhdGVBY3Rpb25PbkVsZW1lbnQoYWN0aW9uRWxlbWVudCwgZXZlbnRJbmZvKTtcbiAgICAgIH1cblxuICAgICAgaWYgKGV2ZW50SW5mb0xpYi5nZXRBY3Rpb24oZXZlbnRJbmZvKSkge1xuICAgICAgICAvLyBBbiBldmVudCBpcyBoYW5kbGVkIGJ5IGF0IG1vc3Qgb25lIGpzYWN0aW9uLiBUaHVzIHdlIHN0b3AgYXQgdGhlXG4gICAgICAgIC8vIGZpcnN0IG1hdGNoaW5nIGpzYWN0aW9uIHNwZWNpZmllZCBpbiBhIGpzYWN0aW9uIGF0dHJpYnV0ZSB1cCB0aGVcbiAgICAgICAgLy8gYW5jZXN0b3IgY2hhaW4gb2YgdGhlIGV2ZW50IHRhcmdldCBub2RlLlxuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGlmIChhY3Rpb25FbGVtZW50W09XTkVSXSkge1xuICAgICAgICBhY3Rpb25FbGVtZW50ID0gYWN0aW9uRWxlbWVudFtPV05FUl0gYXMgRWxlbWVudDtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBpZiAoYWN0aW9uRWxlbWVudC5wYXJlbnROb2RlPy5ub2RlTmFtZSAhPT0gJyNkb2N1bWVudC1mcmFnbWVudCcpIHtcbiAgICAgICAgYWN0aW9uRWxlbWVudCA9IGFjdGlvbkVsZW1lbnQucGFyZW50Tm9kZSBhcyBFbGVtZW50IHwgbnVsbDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGFjdGlvbkVsZW1lbnQgPSAoYWN0aW9uRWxlbWVudC5wYXJlbnROb2RlIGFzIFNoYWRvd1Jvb3QgfCBudWxsKT8uaG9zdCA/PyBudWxsO1xuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IGFjdGlvbiA9IGV2ZW50SW5mb0xpYi5nZXRBY3Rpb24oZXZlbnRJbmZvKTtcbiAgICBpZiAoIWFjdGlvbikge1xuICAgICAgLy8gTm8gYWN0aW9uIGZvdW5kLlxuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICh0aGlzLmExMXlDbGlja1N1cHBvcnQpIHtcbiAgICAgIHRoaXMucHJldmVudERlZmF1bHRGb3JBMTF5Q2xpY2shKGV2ZW50SW5mbyk7XG4gICAgfVxuXG4gICAgLy8gV2UgYXR0ZW1wdCB0byBoYW5kbGUgdGhlIG1vdXNlZW50ZXIvbW91c2VsZWF2ZSBldmVudHMgaGVyZSBieVxuICAgIC8vIGRldGVjdGluZyB3aGV0aGVyIHRoZSBtb3VzZW92ZXIvbW91c2VvdXQgZXZlbnRzIGNvcnJlc3BvbmQgdG9cbiAgICAvLyBlbnRlcmluZy9sZWF2aW5nIGFuIGVsZW1lbnQuXG4gICAgaWYgKHRoaXMuc3ludGhldGljTW91c2VFdmVudFN1cHBvcnQpIHtcbiAgICAgIGlmIChcbiAgICAgICAgZXZlbnRJbmZvTGliLmdldEV2ZW50VHlwZShldmVudEluZm8pID09PSBFdmVudFR5cGUuTU9VU0VFTlRFUiB8fFxuICAgICAgICBldmVudEluZm9MaWIuZ2V0RXZlbnRUeXBlKGV2ZW50SW5mbykgPT09IEV2ZW50VHlwZS5NT1VTRUxFQVZFIHx8XG4gICAgICAgIGV2ZW50SW5mb0xpYi5nZXRFdmVudFR5cGUoZXZlbnRJbmZvKSA9PT0gRXZlbnRUeXBlLlBPSU5URVJFTlRFUiB8fFxuICAgICAgICBldmVudEluZm9MaWIuZ2V0RXZlbnRUeXBlKGV2ZW50SW5mbykgPT09IEV2ZW50VHlwZS5QT0lOVEVSTEVBVkVcbiAgICAgICkge1xuICAgICAgICAvLyBXZSBhdHRlbXB0IHRvIGhhbmRsZSB0aGUgbW91c2VlbnRlci9tb3VzZWxlYXZlIGV2ZW50cyBoZXJlIGJ5XG4gICAgICAgIC8vIGRldGVjdGluZyB3aGV0aGVyIHRoZSBtb3VzZW92ZXIvbW91c2VvdXQgZXZlbnRzIGNvcnJlc3BvbmQgdG9cbiAgICAgICAgLy8gZW50ZXJpbmcvbGVhdmluZyBhbiBlbGVtZW50LlxuICAgICAgICBpZiAoXG4gICAgICAgICAgZXZlbnRMaWIuaXNNb3VzZVNwZWNpYWxFdmVudChcbiAgICAgICAgICAgIGV2ZW50SW5mb0xpYi5nZXRFdmVudChldmVudEluZm8pLFxuICAgICAgICAgICAgZXZlbnRJbmZvTGliLmdldEV2ZW50VHlwZShldmVudEluZm8pLFxuICAgICAgICAgICAgZXZlbnRJbmZvTGliLmdldEFjdGlvbkVsZW1lbnQoYWN0aW9uKSxcbiAgICAgICAgICApXG4gICAgICAgICkge1xuICAgICAgICAgIC8vIElmIGJvdGggbW91c2VvdmVyL21vdXNlb3V0IGFuZCBtb3VzZWVudGVyL21vdXNlbGVhdmUgZXZlbnRzIGFyZVxuICAgICAgICAgIC8vIGVuYWJsZWQsIHR3byBzZXBhcmF0ZSBoYW5kbGVycyBmb3IgbW91c2VvdmVyL21vdXNlb3V0IGFyZVxuICAgICAgICAgIC8vIHJlZ2lzdGVyZWQuIEJvdGggaGFuZGxlcnMgd2lsbCBzZWUgdGhlIHNhbWUgZXZlbnQgaW5zdGFuY2VcbiAgICAgICAgICAvLyBzbyB3ZSBjcmVhdGUgYSBjb3B5IHRvIGF2b2lkIGludGVyZmVyaW5nIHdpdGggdGhlIGRpc3BhdGNoaW5nIG9mXG4gICAgICAgICAgLy8gdGhlIG1vdXNlb3Zlci9tb3VzZW91dCBldmVudC5cbiAgICAgICAgICBjb25zdCBjb3BpZWRFdmVudCA9IGV2ZW50TGliLmNyZWF0ZU1vdXNlU3BlY2lhbEV2ZW50KFxuICAgICAgICAgICAgZXZlbnRJbmZvTGliLmdldEV2ZW50KGV2ZW50SW5mbyksXG4gICAgICAgICAgICBldmVudEluZm9MaWIuZ2V0QWN0aW9uRWxlbWVudChhY3Rpb24pLFxuICAgICAgICAgICk7XG4gICAgICAgICAgZXZlbnRJbmZvTGliLnNldEV2ZW50KGV2ZW50SW5mbywgY29waWVkRXZlbnQpO1xuICAgICAgICAgIC8vIFNpbmNlIHRoZSBtb3VzZWVudGVyL21vdXNlbGVhdmUgZXZlbnRzIGRvIG5vdCBidWJibGUsIHRoZSB0YXJnZXRcbiAgICAgICAgICAvLyBvZiB0aGUgZXZlbnQgaXMgdGVjaG5pY2FsbHkgdGhlIGBhY3Rpb25FbGVtZW50YCAodGhlIG5vZGUgd2l0aCB0aGVcbiAgICAgICAgICAvLyBganNhY3Rpb25gIGF0dHJpYnV0ZSlcbiAgICAgICAgICBldmVudEluZm9MaWIuc2V0VGFyZ2V0RWxlbWVudChldmVudEluZm8sIGV2ZW50SW5mb0xpYi5nZXRBY3Rpb25FbGVtZW50KGFjdGlvbikpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGV2ZW50SW5mb0xpYi51bnNldEFjdGlvbihldmVudEluZm8pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEFjY2Vzc2VzIHRoZSBqc2FjdGlvbiBtYXAgb24gYSBub2RlIGFuZCByZXRyaWV2ZXMgdGhlIG5hbWUgb2YgdGhlXG4gICAqIGFjdGlvbiB0aGUgZ2l2ZW4gZXZlbnQgaXMgbWFwcGVkIHRvLCBpZiBhbnkuIEl0IHBhcnNlcyB0aGVcbiAgICogYXR0cmlidXRlIHZhbHVlIGFuZCBzdG9yZXMgaXQgaW4gYSBwcm9wZXJ0eSBvbiB0aGUgbm9kZSBmb3JcbiAgICogc3Vic2VxdWVudCByZXRyaWV2YWwgd2l0aG91dCByZS1wYXJzaW5nIGFuZCByZS1hY2Nlc3NpbmcgdGhlXG4gICAqIGF0dHJpYnV0ZS5cbiAgICpcbiAgICogQHBhcmFtIGFjdGlvbkVsZW1lbnQgVGhlIERPTSBub2RlIHRvIHJldHJpZXZlIHRoZSBqc2FjdGlvbiBtYXAgZnJvbS5cbiAgICogQHBhcmFtIGV2ZW50SW5mbyBgRXZlbnRJbmZvYCB0byBzZXQgYGFjdGlvbmAgYW5kIGBhY3Rpb25FbGVtZW50YCBpZiBhblxuICAgKiAgICBhY3Rpb24gaXMgZm91bmQgb24gdGhlIGBhY3Rpb25FbGVtZW50YC5cbiAgICovXG4gIHByaXZhdGUgcG9wdWxhdGVBY3Rpb25PbkVsZW1lbnQoYWN0aW9uRWxlbWVudDogRWxlbWVudCwgZXZlbnRJbmZvOiBldmVudEluZm9MaWIuRXZlbnRJbmZvKSB7XG4gICAgY29uc3QgYWN0aW9uTWFwID0gdGhpcy5wYXJzZUFjdGlvbnMoYWN0aW9uRWxlbWVudCk7XG5cbiAgICBjb25zdCBhY3Rpb25OYW1lID0gYWN0aW9uTWFwW2V2ZW50SW5mb0xpYi5nZXRFdmVudFR5cGUoZXZlbnRJbmZvKV07XG4gICAgaWYgKGFjdGlvbk5hbWUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgZXZlbnRJbmZvTGliLnNldEFjdGlvbihldmVudEluZm8sIGFjdGlvbk5hbWUsIGFjdGlvbkVsZW1lbnQpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLmExMXlDbGlja1N1cHBvcnQpIHtcbiAgICAgIHRoaXMucG9wdWxhdGVDbGlja09ubHlBY3Rpb24hKGFjdGlvbkVsZW1lbnQsIGV2ZW50SW5mbywgYWN0aW9uTWFwKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogUGFyc2VzIGFuZCBjYWNoZXMgYW4gZWxlbWVudCdzIGpzYWN0aW9uIGVsZW1lbnQgaW50byBhIG1hcC5cbiAgICpcbiAgICogVGhpcyBpcyBwcmltYXJpbHkgZm9yIGludGVybmFsIHVzZS5cbiAgICpcbiAgICogQHBhcmFtIGFjdGlvbkVsZW1lbnQgVGhlIERPTSBub2RlIHRvIHJldHJpZXZlIHRoZSBqc2FjdGlvbiBtYXAgZnJvbS5cbiAgICogQHJldHVybiBNYXAgZnJvbSBldmVudCB0byBxdWFsaWZpZWQgbmFtZSBvZiB0aGUganNhY3Rpb24gYm91bmQgdG8gaXQuXG4gICAqL1xuICBwcml2YXRlIHBhcnNlQWN0aW9ucyhhY3Rpb25FbGVtZW50OiBFbGVtZW50KToge1trZXk6IHN0cmluZ106IHN0cmluZ30ge1xuICAgIGxldCBhY3Rpb25NYXA6IHtba2V5OiBzdHJpbmddOiBzdHJpbmd9IHwgdW5kZWZpbmVkID0gY2FjaGUuZ2V0KGFjdGlvbkVsZW1lbnQpO1xuICAgIGlmICghYWN0aW9uTWFwKSB7XG4gICAgICBjb25zdCBqc2FjdGlvbkF0dHJpYnV0ZSA9IGFjdGlvbkVsZW1lbnQuZ2V0QXR0cmlidXRlKEF0dHJpYnV0ZS5KU0FDVElPTik7XG4gICAgICBpZiAoIWpzYWN0aW9uQXR0cmlidXRlKSB7XG4gICAgICAgIGFjdGlvbk1hcCA9IEVNUFRZX0FDVElPTl9NQVA7XG4gICAgICAgIGNhY2hlLnNldChhY3Rpb25FbGVtZW50LCBhY3Rpb25NYXApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYWN0aW9uTWFwID0gY2FjaGUuZ2V0UGFyc2VkKGpzYWN0aW9uQXR0cmlidXRlKTtcbiAgICAgICAgaWYgKCFhY3Rpb25NYXApIHtcbiAgICAgICAgICBhY3Rpb25NYXAgPSB7fTtcbiAgICAgICAgICBjb25zdCB2YWx1ZXMgPSBqc2FjdGlvbkF0dHJpYnV0ZS5zcGxpdChSRUdFWFBfU0VNSUNPTE9OKTtcbiAgICAgICAgICBmb3IgKGxldCBpZHggPSAwOyBpZHggPCB2YWx1ZXMubGVuZ3RoOyBpZHgrKykge1xuICAgICAgICAgICAgY29uc3QgdmFsdWUgPSB2YWx1ZXNbaWR4XTtcbiAgICAgICAgICAgIGlmICghdmFsdWUpIHtcbiAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBjb2xvbiA9IHZhbHVlLmluZGV4T2YoQ2hhci5FVkVOVF9BQ1RJT05fU0VQQVJBVE9SKTtcbiAgICAgICAgICAgIGNvbnN0IGhhc0NvbG9uID0gY29sb24gIT09IC0xO1xuICAgICAgICAgICAgY29uc3QgdHlwZSA9IGhhc0NvbG9uID8gdmFsdWUuc3Vic3RyKDAsIGNvbG9uKS50cmltKCkgOiBERUZBVUxUX0VWRU5UX1RZUEU7XG4gICAgICAgICAgICBjb25zdCBhY3Rpb24gPSBoYXNDb2xvbiA/IHZhbHVlLnN1YnN0cihjb2xvbiArIDEpLnRyaW0oKSA6IHZhbHVlO1xuICAgICAgICAgICAgYWN0aW9uTWFwW3R5cGVdID0gYWN0aW9uO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjYWNoZS5zZXRQYXJzZWQoanNhY3Rpb25BdHRyaWJ1dGUsIGFjdGlvbk1hcCk7XG4gICAgICAgIH1cbiAgICAgICAgY2FjaGUuc2V0KGFjdGlvbkVsZW1lbnQsIGFjdGlvbk1hcCk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBhY3Rpb25NYXA7XG4gIH1cblxuICBhZGRBMTF5Q2xpY2tTdXBwb3J0KFxuICAgIHVwZGF0ZUV2ZW50SW5mb0ZvckExMXlDbGljazogdHlwZW9mIGExMXlDbGljay51cGRhdGVFdmVudEluZm9Gb3JBMTF5Q2xpY2ssXG4gICAgcHJldmVudERlZmF1bHRGb3JBMTF5Q2xpY2s6IHR5cGVvZiBhMTF5Q2xpY2sucHJldmVudERlZmF1bHRGb3JBMTF5Q2xpY2ssXG4gICAgcG9wdWxhdGVDbGlja09ubHlBY3Rpb246IHR5cGVvZiBhMTF5Q2xpY2sucG9wdWxhdGVDbGlja09ubHlBY3Rpb24sXG4gICkge1xuICAgIHRoaXMuYTExeUNsaWNrU3VwcG9ydCA9IHRydWU7XG4gICAgdGhpcy51cGRhdGVFdmVudEluZm9Gb3JBMTF5Q2xpY2sgPSB1cGRhdGVFdmVudEluZm9Gb3JBMTF5Q2xpY2s7XG4gICAgdGhpcy5wcmV2ZW50RGVmYXVsdEZvckExMXlDbGljayA9IHByZXZlbnREZWZhdWx0Rm9yQTExeUNsaWNrO1xuICAgIHRoaXMucG9wdWxhdGVDbGlja09ubHlBY3Rpb24gPSBwb3B1bGF0ZUNsaWNrT25seUFjdGlvbjtcbiAgfVxufVxuIl19