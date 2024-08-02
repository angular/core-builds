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
    constructor({ syntheticMouseEventSupport = false, clickModSupport = true, } = {}) {
        this.a11yClickSupport = false;
        this.clickModSupport = true;
        this.updateEventInfoForA11yClick = undefined;
        this.preventDefaultForA11yClick = undefined;
        this.populateClickOnlyAction = undefined;
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
            eventInfoLib.getEventType(eventInfo) === EventType.CLICK &&
            eventLib.isModifiedClickEvent(eventInfoLib.getEvent(eventInfo))) {
            eventInfoLib.setEventType(eventInfo, EventType.CLICKMOD);
        }
        else if (this.a11yClickSupport) {
            this.updateEventInfoForA11yClick(eventInfo);
        }
    }
    resolveAction(eventInfo) {
        if (eventInfoLib.getResolved(eventInfo)) {
            return;
        }
        this.populateAction(eventInfo, eventInfoLib.getTargetElement(eventInfo));
        eventInfoLib.setResolved(eventInfo, true);
    }
    resolveParentAction(eventInfo) {
        const action = eventInfoLib.getAction(eventInfo);
        const actionElement = action && eventInfoLib.getActionElement(action);
        eventInfoLib.unsetAction(eventInfo);
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
            actionElement = this.getParentNode(actionElement);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWN0aW9uX3Jlc29sdmVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9wcmltaXRpdmVzL2V2ZW50LWRpc3BhdGNoL3NyYy9hY3Rpb25fcmVzb2x2ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLGFBQWEsQ0FBQztBQUN0QyxPQUFPLEVBQUMsSUFBSSxFQUFDLE1BQU0sUUFBUSxDQUFDO0FBQzVCLE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxjQUFjLENBQUM7QUFDdkMsT0FBTyxFQUFDLFFBQVEsRUFBQyxNQUFNLFlBQVksQ0FBQztBQUVwQyxPQUFPLEtBQUssS0FBSyxNQUFNLFNBQVMsQ0FBQztBQUNqQyxPQUFPLEtBQUssWUFBWSxNQUFNLGNBQWMsQ0FBQztBQUM3QyxPQUFPLEtBQUssUUFBUSxNQUFNLFNBQVMsQ0FBQztBQUVwQzs7O0dBR0c7QUFDSCxNQUFNLGdCQUFnQixHQUE0QixFQUFFLENBQUM7QUFFckQ7O0dBRUc7QUFDSCxNQUFNLGdCQUFnQixHQUFHLFNBQVMsQ0FBQztBQUVuQyx3REFBd0Q7QUFDeEQsTUFBTSxrQkFBa0IsR0FBVyxTQUFTLENBQUMsS0FBSyxDQUFDO0FBRW5ELG1DQUFtQztBQUNuQyxNQUFNLE9BQU8sY0FBYztJQWV6QixZQUFZLEVBQ1YsMEJBQTBCLEdBQUcsS0FBSyxFQUNsQyxlQUFlLEdBQUcsSUFBSSxNQUlwQixFQUFFO1FBcEJFLHFCQUFnQixHQUFZLEtBQUssQ0FBQztRQUNsQyxvQkFBZSxHQUFZLElBQUksQ0FBQztRQUdoQyxnQ0FBMkIsR0FBaUQsU0FBUyxDQUFDO1FBRXRGLCtCQUEwQixHQUFpRCxTQUFTLENBQUM7UUFFckYsNEJBQXVCLEdBSW5CLFNBQVMsQ0FBQztRQVNwQixJQUFJLENBQUMsMEJBQTBCLEdBQUcsMEJBQTBCLENBQUM7UUFDN0Qs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SUFBSSxDQUFDLHNCQUFzQixDQUFDLENBQUM7d0JBQ3pELE1BQU0sUUFBUSxHQUFHLEtBQUssS0FBSyxDQUFDLENBQUMsQ0FBQzt3QkFDOUIsTUFBTSxJQUFJLEdBQUcsUUFBUSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsa0JBQWtCLENBQUM7d0JBQzNFLE1BQU0sTUFBTSxHQUFHLFFBQVEsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQzt3QkFDakUsU0FBUyxDQUFDLElBQUksQ0FBQyxHQUFHLE1BQU0sQ0FBQztvQkFDM0IsQ0FBQztvQkFDRCxLQUFLLENBQUMsU0FBUyxDQUFDLGlCQUFpQixFQUFFLFNBQVMsQ0FBQyxDQUFDO2dCQUNoRCxDQUFDO2dCQUNELEtBQUssQ0FBQyxHQUFHLENBQUMsYUFBYSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQ3RDLENBQUM7UUFDSCxDQUFDO1FBQ0QsT0FBTyxTQUFTLENBQUM7SUFDbkIsQ0FBQztJQUVELG1CQUFtQixDQUNqQiwyQkFBeUUsRUFDekUsMEJBQXVFLEVBQ3ZFLHVCQUFpRTtRQUVqRSxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsSUFBSSxDQUFDO1FBQzdCLElBQUksQ0FBQywyQkFBMkIsR0FBRywyQkFBMkIsQ0FBQztRQUMvRCxJQUFJLENBQUMsMEJBQTBCLEdBQUcsMEJBQTBCLENBQUM7UUFDN0QsSUFBSSxDQUFDLHVCQUF1QixHQUFHLHVCQUF1QixDQUFDO0lBQ3pELENBQUM7Q0FDRiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0F0dHJpYnV0ZX0gZnJvbSAnLi9hdHRyaWJ1dGUnO1xuaW1wb3J0IHtDaGFyfSBmcm9tICcuL2NoYXInO1xuaW1wb3J0IHtFdmVudFR5cGV9IGZyb20gJy4vZXZlbnRfdHlwZSc7XG5pbXBvcnQge1Byb3BlcnR5fSBmcm9tICcuL3Byb3BlcnR5JztcbmltcG9ydCAqIGFzIGExMXlDbGljayBmcm9tICcuL2ExMXlfY2xpY2snO1xuaW1wb3J0ICogYXMgY2FjaGUgZnJvbSAnLi9jYWNoZSc7XG5pbXBvcnQgKiBhcyBldmVudEluZm9MaWIgZnJvbSAnLi9ldmVudF9pbmZvJztcbmltcG9ydCAqIGFzIGV2ZW50TGliIGZyb20gJy4vZXZlbnQnO1xuXG4vKipcbiAqIFNpbmNlIG1hcHMgZnJvbSBldmVudCB0byBhY3Rpb24gYXJlIGltbXV0YWJsZSB3ZSBjYW4gdXNlIGEgc2luZ2xlIG1hcFxuICogdG8gcmVwcmVzZW50IHRoZSBlbXB0eSBtYXAuXG4gKi9cbmNvbnN0IEVNUFRZX0FDVElPTl9NQVA6IHtba2V5OiBzdHJpbmddOiBzdHJpbmd9ID0ge307XG5cbi8qKlxuICogVGhpcyByZWd1bGFyIGV4cHJlc3Npb24gbWF0Y2hlcyBhIHNlbWljb2xvbi5cbiAqL1xuY29uc3QgUkVHRVhQX1NFTUlDT0xPTiA9IC9cXHMqO1xccyovO1xuXG4vKiogSWYgbm8gZXZlbnQgdHlwZSBpcyBkZWZpbmVkLCBkZWZhdWx0cyB0byBgY2xpY2tgLiAqL1xuY29uc3QgREVGQVVMVF9FVkVOVF9UWVBFOiBzdHJpbmcgPSBFdmVudFR5cGUuQ0xJQ0s7XG5cbi8qKiBSZXNvbHZlcyBhY3Rpb25zIGZvciBFdmVudHMuICovXG5leHBvcnQgY2xhc3MgQWN0aW9uUmVzb2x2ZXIge1xuICBwcml2YXRlIGExMXlDbGlja1N1cHBvcnQ6IGJvb2xlYW4gPSBmYWxzZTtcbiAgcHJpdmF0ZSBjbGlja01vZFN1cHBvcnQ6IGJvb2xlYW4gPSB0cnVlO1xuICBwcml2YXRlIHJlYWRvbmx5IHN5bnRoZXRpY01vdXNlRXZlbnRTdXBwb3J0OiBib29sZWFuO1xuXG4gIHByaXZhdGUgdXBkYXRlRXZlbnRJbmZvRm9yQTExeUNsaWNrPzogKGV2ZW50SW5mbzogZXZlbnRJbmZvTGliLkV2ZW50SW5mbykgPT4gdm9pZCA9IHVuZGVmaW5lZDtcblxuICBwcml2YXRlIHByZXZlbnREZWZhdWx0Rm9yQTExeUNsaWNrPzogKGV2ZW50SW5mbzogZXZlbnRJbmZvTGliLkV2ZW50SW5mbykgPT4gdm9pZCA9IHVuZGVmaW5lZDtcblxuICBwcml2YXRlIHBvcHVsYXRlQ2xpY2tPbmx5QWN0aW9uPzogKFxuICAgIGFjdGlvbkVsZW1lbnQ6IEVsZW1lbnQsXG4gICAgZXZlbnRJbmZvOiBldmVudEluZm9MaWIuRXZlbnRJbmZvLFxuICAgIGFjdGlvbk1hcDoge1trZXk6IHN0cmluZ106IHN0cmluZyB8IHVuZGVmaW5lZH0sXG4gICkgPT4gdm9pZCA9IHVuZGVmaW5lZDtcblxuICBjb25zdHJ1Y3Rvcih7XG4gICAgc3ludGhldGljTW91c2VFdmVudFN1cHBvcnQgPSBmYWxzZSxcbiAgICBjbGlja01vZFN1cHBvcnQgPSB0cnVlLFxuICB9OiB7XG4gICAgc3ludGhldGljTW91c2VFdmVudFN1cHBvcnQ/OiBib29sZWFuO1xuICAgIGNsaWNrTW9kU3VwcG9ydD86IGJvb2xlYW47XG4gIH0gPSB7fSkge1xuICAgIHRoaXMuc3ludGhldGljTW91c2VFdmVudFN1cHBvcnQgPSBzeW50aGV0aWNNb3VzZUV2ZW50U3VwcG9ydDtcbiAgICB0aGlzLmNsaWNrTW9kU3VwcG9ydCA9IGNsaWNrTW9kU3VwcG9ydDtcbiAgfVxuXG4gIHJlc29sdmVFdmVudFR5cGUoZXZlbnRJbmZvOiBldmVudEluZm9MaWIuRXZlbnRJbmZvKSB7XG4gICAgLy8gV2UgZGlzdGluZ3Vpc2ggbW9kaWZpZWQgYW5kIHBsYWluIGNsaWNrcyBpbiBvcmRlciB0byBzdXBwb3J0IHRoZVxuICAgIC8vIGRlZmF1bHQgYnJvd3NlciBiZWhhdmlvciBvZiBtb2RpZmllZCBjbGlja3Mgb24gbGlua3M7IHVzdWFsbHkgdG9cbiAgICAvLyBvcGVuIHRoZSBVUkwgb2YgdGhlIGxpbmsgaW4gbmV3IHRhYiBvciBuZXcgd2luZG93IG9uIGN0cmwvY21kXG4gICAgLy8gY2xpY2suIEEgRE9NICdjbGljaycgZXZlbnQgaXMgbWFwcGVkIHRvIHRoZSBqc2FjdGlvbiAnY2xpY2snXG4gICAgLy8gZXZlbnQgaWZmIHRoZXJlIGlzIG5vIG1vZGlmaWVyIHByZXNlbnQgb24gdGhlIGV2ZW50LiBJZiB0aGVyZSBpc1xuICAgIC8vIGEgbW9kaWZpZXIsIGl0J3MgbWFwcGVkIHRvICdjbGlja21vZCcgaW5zdGVhZC5cbiAgICAvL1xuICAgIC8vIEl0J3MgYWxsb3dlZCB0byBvbWl0IHRoZSBldmVudCBpbiB0aGUganNhY3Rpb24gYXR0cmlidXRlLiBJbiB0aGF0XG4gICAgLy8gY2FzZSwgJ2NsaWNrJyBpcyBhc3N1bWVkLiBUaHVzIHRoZSBmb2xsb3dpbmcgdHdvIGFyZSBlcXVpdmFsZW50OlxuICAgIC8vXG4gICAgLy8gICA8YSBocmVmPVwic29tZXVybFwiIGpzYWN0aW9uPVwiZ25hLmZ1XCI+XG4gICAgLy8gICA8YSBocmVmPVwic29tZXVybFwiIGpzYWN0aW9uPVwiY2xpY2s6Z25hLmZ1XCI+XG4gICAgLy9cbiAgICAvLyBGb3IgdW5tb2RpZmllZCBjbGlja3MsIEV2ZW50Q29udHJhY3QgaW52b2tlcyB0aGUganNhY3Rpb25cbiAgICAvLyAnZ25hLmZ1Jy4gRm9yIG1vZGlmaWVkIGNsaWNrcywgRXZlbnRDb250cmFjdCB3b24ndCBmaW5kIGFcbiAgICAvLyBzdWl0YWJsZSBhY3Rpb24gYW5kIGxlYXZlIHRoZSBldmVudCB0byBiZSBoYW5kbGVkIGJ5IHRoZVxuICAgIC8vIGJyb3dzZXIuXG4gICAgLy9cbiAgICAvLyBJbiBvcmRlciB0byBhbHNvIGludm9rZSBhIGpzYWN0aW9uIGhhbmRsZXIgZm9yIGEgbW9kaWZpZXIgY2xpY2ssXG4gICAgLy8gJ2NsaWNrbW9kJyBuZWVkcyB0byBiZSB1c2VkOlxuICAgIC8vXG4gICAgLy8gICA8YSBocmVmPVwic29tZXVybFwiIGpzYWN0aW9uPVwiY2xpY2ttb2Q6Z25hLmZ1XCI+XG4gICAgLy9cbiAgICAvLyBFdmVudENvbnRyYWN0IGludm9rZXMgdGhlIGpzYWN0aW9uICdnbmEuZnUnIGZvciBtb2RpZmllZFxuICAgIC8vIGNsaWNrcy4gVW5tb2RpZmllZCBjbGlja3MgYXJlIGxlZnQgdG8gdGhlIGJyb3dzZXIuXG4gICAgLy9cbiAgICAvLyBJbiBvcmRlciB0byBzZXQgdXAgdGhlIGV2ZW50IGNvbnRyYWN0IHRvIGhhbmRsZSBib3RoIGNsaWNrb25seSBhbmRcbiAgICAvLyBjbGlja21vZCwgb25seSBhZGRFdmVudChFdmVudFR5cGUuQ0xJQ0spIGlzIG5lY2Vzc2FyeS5cbiAgICAvL1xuICAgIC8vIEluIG9yZGVyIHRvIHNldCB1cCB0aGUgZXZlbnQgY29udHJhY3QgdG8gaGFuZGxlIGNsaWNrLFxuICAgIC8vIGFkZEV2ZW50KCkgaXMgbmVjZXNzYXJ5IGZvciBDTElDSywgS0VZRE9XTiwgYW5kIEtFWVBSRVNTIGV2ZW50IHR5cGVzLiAgSWZcbiAgICAvLyBhMTF5IGNsaWNrIHN1cHBvcnQgaXMgZW5hYmxlZCwgYWRkRXZlbnQoKSB3aWxsIHNldCB1cCB0aGUgYXBwcm9wcmlhdGUga2V5XG4gICAgLy8gZXZlbnQgaGFuZGxlciBhdXRvbWF0aWNhbGx5LlxuICAgIGlmIChcbiAgICAgIHRoaXMuY2xpY2tNb2RTdXBwb3J0ICYmXG4gICAgICBldmVudEluZm9MaWIuZ2V0RXZlbnRUeXBlKGV2ZW50SW5mbykgPT09IEV2ZW50VHlwZS5DTElDSyAmJlxuICAgICAgZXZlbnRMaWIuaXNNb2RpZmllZENsaWNrRXZlbnQoZXZlbnRJbmZvTGliLmdldEV2ZW50KGV2ZW50SW5mbykpXG4gICAgKSB7XG4gICAgICBldmVudEluZm9MaWIuc2V0RXZlbnRUeXBlKGV2ZW50SW5mbywgRXZlbnRUeXBlLkNMSUNLTU9EKTtcbiAgICB9IGVsc2UgaWYgKHRoaXMuYTExeUNsaWNrU3VwcG9ydCkge1xuICAgICAgdGhpcy51cGRhdGVFdmVudEluZm9Gb3JBMTF5Q2xpY2shKGV2ZW50SW5mbyk7XG4gICAgfVxuICB9XG5cbiAgcmVzb2x2ZUFjdGlvbihldmVudEluZm86IGV2ZW50SW5mb0xpYi5FdmVudEluZm8pIHtcbiAgICBpZiAoZXZlbnRJbmZvTGliLmdldFJlc29sdmVkKGV2ZW50SW5mbykpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5wb3B1bGF0ZUFjdGlvbihldmVudEluZm8sIGV2ZW50SW5mb0xpYi5nZXRUYXJnZXRFbGVtZW50KGV2ZW50SW5mbykpO1xuICAgIGV2ZW50SW5mb0xpYi5zZXRSZXNvbHZlZChldmVudEluZm8sIHRydWUpO1xuICB9XG5cbiAgcmVzb2x2ZVBhcmVudEFjdGlvbihldmVudEluZm86IGV2ZW50SW5mb0xpYi5FdmVudEluZm8pIHtcbiAgICBjb25zdCBhY3Rpb24gPSBldmVudEluZm9MaWIuZ2V0QWN0aW9uKGV2ZW50SW5mbyk7XG4gICAgY29uc3QgYWN0aW9uRWxlbWVudCA9IGFjdGlvbiAmJiBldmVudEluZm9MaWIuZ2V0QWN0aW9uRWxlbWVudChhY3Rpb24pO1xuICAgIGV2ZW50SW5mb0xpYi51bnNldEFjdGlvbihldmVudEluZm8pO1xuICAgIGNvbnN0IHBhcmVudE5vZGUgPSBhY3Rpb25FbGVtZW50ICYmIHRoaXMuZ2V0UGFyZW50Tm9kZShhY3Rpb25FbGVtZW50KTtcbiAgICBpZiAoIXBhcmVudE5vZGUpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5wb3B1bGF0ZUFjdGlvbihldmVudEluZm8sIHBhcmVudE5vZGUpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNlYXJjaGVzIGZvciBhIGpzYWN0aW9uIHRoYXQgdGhlIERPTSBldmVudCBtYXBzIHRvIGFuZCBjcmVhdGVzIGFuXG4gICAqIG9iamVjdCBjb250YWluaW5nIGV2ZW50IGluZm9ybWF0aW9uIHVzZWQgZm9yIGRpc3BhdGNoaW5nIGJ5XG4gICAqIGpzYWN0aW9uLkRpc3BhdGNoZXIuIFRoaXMgbWV0aG9kIHBvcHVsYXRlcyB0aGUgYGFjdGlvbmAgYW5kIGBhY3Rpb25FbGVtZW50YFxuICAgKiBmaWVsZHMgb2YgdGhlIEV2ZW50SW5mbyBvYmplY3QgcGFzc2VkIGluIGJ5IGZpbmRpbmcgdGhlIGZpcnN0XG4gICAqIGpzYWN0aW9uIGF0dHJpYnV0ZSBhYm92ZSB0aGUgdGFyZ2V0IE5vZGUgb2YgdGhlIGV2ZW50LCBhbmQgYmVsb3dcbiAgICogdGhlIGNvbnRhaW5lciBOb2RlLCB0aGF0IHNwZWNpZmllcyBhIGpzYWN0aW9uIGZvciB0aGUgZXZlbnRcbiAgICogdHlwZS4gSWYgbm8gc3VjaCBqc2FjdGlvbiBpcyBmb3VuZCwgdGhlbiBhY3Rpb24gaXMgdW5kZWZpbmVkLlxuICAgKlxuICAgKiBAcGFyYW0gZXZlbnRJbmZvIGBFdmVudEluZm9gIHRvIHNldCBgYWN0aW9uYCBhbmQgYGFjdGlvbkVsZW1lbnRgIGlmIGFuXG4gICAqICAgIGFjdGlvbiBpcyBmb3VuZCBvbiBhbnkgYEVsZW1lbnRgIGluIHRoZSBwYXRoIG9mIHRoZSBgRXZlbnRgLlxuICAgKi9cbiAgcHJpdmF0ZSBwb3B1bGF0ZUFjdGlvbihldmVudEluZm86IGV2ZW50SW5mb0xpYi5FdmVudEluZm8sIGN1cnJlbnRUYXJnZXQ6IEVsZW1lbnQpIHtcbiAgICBsZXQgYWN0aW9uRWxlbWVudDogRWxlbWVudCB8IG51bGwgPSBjdXJyZW50VGFyZ2V0O1xuICAgIHdoaWxlIChhY3Rpb25FbGVtZW50ICYmIGFjdGlvbkVsZW1lbnQgIT09IGV2ZW50SW5mb0xpYi5nZXRDb250YWluZXIoZXZlbnRJbmZvKSkge1xuICAgICAgaWYgKGFjdGlvbkVsZW1lbnQubm9kZVR5cGUgPT09IE5vZGUuRUxFTUVOVF9OT0RFKSB7XG4gICAgICAgIHRoaXMucG9wdWxhdGVBY3Rpb25PbkVsZW1lbnQoYWN0aW9uRWxlbWVudCwgZXZlbnRJbmZvKTtcbiAgICAgIH1cblxuICAgICAgaWYgKGV2ZW50SW5mb0xpYi5nZXRBY3Rpb24oZXZlbnRJbmZvKSkge1xuICAgICAgICAvLyBBbiBldmVudCBpcyBoYW5kbGVkIGJ5IGF0IG1vc3Qgb25lIGpzYWN0aW9uLiBUaHVzIHdlIHN0b3AgYXQgdGhlXG4gICAgICAgIC8vIGZpcnN0IG1hdGNoaW5nIGpzYWN0aW9uIHNwZWNpZmllZCBpbiBhIGpzYWN0aW9uIGF0dHJpYnV0ZSB1cCB0aGVcbiAgICAgICAgLy8gYW5jZXN0b3IgY2hhaW4gb2YgdGhlIGV2ZW50IHRhcmdldCBub2RlLlxuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGFjdGlvbkVsZW1lbnQgPSB0aGlzLmdldFBhcmVudE5vZGUoYWN0aW9uRWxlbWVudCk7XG4gICAgfVxuXG4gICAgY29uc3QgYWN0aW9uID0gZXZlbnRJbmZvTGliLmdldEFjdGlvbihldmVudEluZm8pO1xuICAgIGlmICghYWN0aW9uKSB7XG4gICAgICAvLyBObyBhY3Rpb24gZm91bmQuXG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuYTExeUNsaWNrU3VwcG9ydCkge1xuICAgICAgdGhpcy5wcmV2ZW50RGVmYXVsdEZvckExMXlDbGljayEoZXZlbnRJbmZvKTtcbiAgICB9XG5cbiAgICAvLyBXZSBhdHRlbXB0IHRvIGhhbmRsZSB0aGUgbW91c2VlbnRlci9tb3VzZWxlYXZlIGV2ZW50cyBoZXJlIGJ5XG4gICAgLy8gZGV0ZWN0aW5nIHdoZXRoZXIgdGhlIG1vdXNlb3Zlci9tb3VzZW91dCBldmVudHMgY29ycmVzcG9uZCB0b1xuICAgIC8vIGVudGVyaW5nL2xlYXZpbmcgYW4gZWxlbWVudC5cbiAgICBpZiAodGhpcy5zeW50aGV0aWNNb3VzZUV2ZW50U3VwcG9ydCkge1xuICAgICAgaWYgKFxuICAgICAgICBldmVudEluZm9MaWIuZ2V0RXZlbnRUeXBlKGV2ZW50SW5mbykgPT09IEV2ZW50VHlwZS5NT1VTRUVOVEVSIHx8XG4gICAgICAgIGV2ZW50SW5mb0xpYi5nZXRFdmVudFR5cGUoZXZlbnRJbmZvKSA9PT0gRXZlbnRUeXBlLk1PVVNFTEVBVkUgfHxcbiAgICAgICAgZXZlbnRJbmZvTGliLmdldEV2ZW50VHlwZShldmVudEluZm8pID09PSBFdmVudFR5cGUuUE9JTlRFUkVOVEVSIHx8XG4gICAgICAgIGV2ZW50SW5mb0xpYi5nZXRFdmVudFR5cGUoZXZlbnRJbmZvKSA9PT0gRXZlbnRUeXBlLlBPSU5URVJMRUFWRVxuICAgICAgKSB7XG4gICAgICAgIC8vIFdlIGF0dGVtcHQgdG8gaGFuZGxlIHRoZSBtb3VzZWVudGVyL21vdXNlbGVhdmUgZXZlbnRzIGhlcmUgYnlcbiAgICAgICAgLy8gZGV0ZWN0aW5nIHdoZXRoZXIgdGhlIG1vdXNlb3Zlci9tb3VzZW91dCBldmVudHMgY29ycmVzcG9uZCB0b1xuICAgICAgICAvLyBlbnRlcmluZy9sZWF2aW5nIGFuIGVsZW1lbnQuXG4gICAgICAgIGlmIChcbiAgICAgICAgICBldmVudExpYi5pc01vdXNlU3BlY2lhbEV2ZW50KFxuICAgICAgICAgICAgZXZlbnRJbmZvTGliLmdldEV2ZW50KGV2ZW50SW5mbyksXG4gICAgICAgICAgICBldmVudEluZm9MaWIuZ2V0RXZlbnRUeXBlKGV2ZW50SW5mbyksXG4gICAgICAgICAgICBldmVudEluZm9MaWIuZ2V0QWN0aW9uRWxlbWVudChhY3Rpb24pLFxuICAgICAgICAgIClcbiAgICAgICAgKSB7XG4gICAgICAgICAgLy8gSWYgYm90aCBtb3VzZW92ZXIvbW91c2VvdXQgYW5kIG1vdXNlZW50ZXIvbW91c2VsZWF2ZSBldmVudHMgYXJlXG4gICAgICAgICAgLy8gZW5hYmxlZCwgdHdvIHNlcGFyYXRlIGhhbmRsZXJzIGZvciBtb3VzZW92ZXIvbW91c2VvdXQgYXJlXG4gICAgICAgICAgLy8gcmVnaXN0ZXJlZC4gQm90aCBoYW5kbGVycyB3aWxsIHNlZSB0aGUgc2FtZSBldmVudCBpbnN0YW5jZVxuICAgICAgICAgIC8vIHNvIHdlIGNyZWF0ZSBhIGNvcHkgdG8gYXZvaWQgaW50ZXJmZXJpbmcgd2l0aCB0aGUgZGlzcGF0Y2hpbmcgb2ZcbiAgICAgICAgICAvLyB0aGUgbW91c2VvdmVyL21vdXNlb3V0IGV2ZW50LlxuICAgICAgICAgIGNvbnN0IGNvcGllZEV2ZW50ID0gZXZlbnRMaWIuY3JlYXRlTW91c2VTcGVjaWFsRXZlbnQoXG4gICAgICAgICAgICBldmVudEluZm9MaWIuZ2V0RXZlbnQoZXZlbnRJbmZvKSxcbiAgICAgICAgICAgIGV2ZW50SW5mb0xpYi5nZXRBY3Rpb25FbGVtZW50KGFjdGlvbiksXG4gICAgICAgICAgKTtcbiAgICAgICAgICBldmVudEluZm9MaWIuc2V0RXZlbnQoZXZlbnRJbmZvLCBjb3BpZWRFdmVudCk7XG4gICAgICAgICAgLy8gU2luY2UgdGhlIG1vdXNlZW50ZXIvbW91c2VsZWF2ZSBldmVudHMgZG8gbm90IGJ1YmJsZSwgdGhlIHRhcmdldFxuICAgICAgICAgIC8vIG9mIHRoZSBldmVudCBpcyB0ZWNobmljYWxseSB0aGUgYGFjdGlvbkVsZW1lbnRgICh0aGUgbm9kZSB3aXRoIHRoZVxuICAgICAgICAgIC8vIGBqc2FjdGlvbmAgYXR0cmlidXRlKVxuICAgICAgICAgIGV2ZW50SW5mb0xpYi5zZXRUYXJnZXRFbGVtZW50KGV2ZW50SW5mbywgZXZlbnRJbmZvTGliLmdldEFjdGlvbkVsZW1lbnQoYWN0aW9uKSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZXZlbnRJbmZvTGliLnVuc2V0QWN0aW9uKGV2ZW50SW5mbyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogV2FsayB0byB0aGUgcGFyZW50IG5vZGUsIHVubGVzcyB0aGUgbm9kZSBoYXMgYSBkaWZmZXJlbnQgb3duZXIgaW5cbiAgICogd2hpY2ggY2FzZSB3ZSB3YWxrIHRvIHRoZSBvd25lci4gQXR0ZW1wdCB0byB3YWxrIHRvIGhvc3Qgb2YgYVxuICAgKiBzaGFkb3cgcm9vdCBpZiBuZWVkZWQuXG4gICAqL1xuICBwcml2YXRlIGdldFBhcmVudE5vZGUoZWxlbWVudDogRWxlbWVudCk6IEVsZW1lbnQgfCBudWxsIHtcbiAgICBjb25zdCBvd25lciA9IGVsZW1lbnRbUHJvcGVydHkuT1dORVJdO1xuICAgIGlmIChvd25lcikge1xuICAgICAgcmV0dXJuIG93bmVyIGFzIEVsZW1lbnQ7XG4gICAgfVxuICAgIGNvbnN0IHBhcmVudE5vZGUgPSBlbGVtZW50LnBhcmVudE5vZGU7XG4gICAgaWYgKHBhcmVudE5vZGU/Lm5vZGVOYW1lID09PSAnI2RvY3VtZW50LWZyYWdtZW50Jykge1xuICAgICAgcmV0dXJuIChwYXJlbnROb2RlIGFzIFNoYWRvd1Jvb3QgfCBudWxsKT8uaG9zdCA/PyBudWxsO1xuICAgIH1cbiAgICByZXR1cm4gcGFyZW50Tm9kZSBhcyBFbGVtZW50IHwgbnVsbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBBY2Nlc3NlcyB0aGUganNhY3Rpb24gbWFwIG9uIGEgbm9kZSBhbmQgcmV0cmlldmVzIHRoZSBuYW1lIG9mIHRoZVxuICAgKiBhY3Rpb24gdGhlIGdpdmVuIGV2ZW50IGlzIG1hcHBlZCB0bywgaWYgYW55LiBJdCBwYXJzZXMgdGhlXG4gICAqIGF0dHJpYnV0ZSB2YWx1ZSBhbmQgc3RvcmVzIGl0IGluIGEgcHJvcGVydHkgb24gdGhlIG5vZGUgZm9yXG4gICAqIHN1YnNlcXVlbnQgcmV0cmlldmFsIHdpdGhvdXQgcmUtcGFyc2luZyBhbmQgcmUtYWNjZXNzaW5nIHRoZVxuICAgKiBhdHRyaWJ1dGUuXG4gICAqXG4gICAqIEBwYXJhbSBhY3Rpb25FbGVtZW50IFRoZSBET00gbm9kZSB0byByZXRyaWV2ZSB0aGUganNhY3Rpb24gbWFwIGZyb20uXG4gICAqIEBwYXJhbSBldmVudEluZm8gYEV2ZW50SW5mb2AgdG8gc2V0IGBhY3Rpb25gIGFuZCBgYWN0aW9uRWxlbWVudGAgaWYgYW5cbiAgICogICAgYWN0aW9uIGlzIGZvdW5kIG9uIHRoZSBgYWN0aW9uRWxlbWVudGAuXG4gICAqL1xuICBwcml2YXRlIHBvcHVsYXRlQWN0aW9uT25FbGVtZW50KGFjdGlvbkVsZW1lbnQ6IEVsZW1lbnQsIGV2ZW50SW5mbzogZXZlbnRJbmZvTGliLkV2ZW50SW5mbykge1xuICAgIGNvbnN0IGFjdGlvbk1hcCA9IHRoaXMucGFyc2VBY3Rpb25zKGFjdGlvbkVsZW1lbnQpO1xuXG4gICAgY29uc3QgYWN0aW9uTmFtZSA9IGFjdGlvbk1hcFtldmVudEluZm9MaWIuZ2V0RXZlbnRUeXBlKGV2ZW50SW5mbyldO1xuICAgIGlmIChhY3Rpb25OYW1lICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGV2ZW50SW5mb0xpYi5zZXRBY3Rpb24oZXZlbnRJbmZvLCBhY3Rpb25OYW1lLCBhY3Rpb25FbGVtZW50KTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5hMTF5Q2xpY2tTdXBwb3J0KSB7XG4gICAgICB0aGlzLnBvcHVsYXRlQ2xpY2tPbmx5QWN0aW9uIShhY3Rpb25FbGVtZW50LCBldmVudEluZm8sIGFjdGlvbk1hcCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFBhcnNlcyBhbmQgY2FjaGVzIGFuIGVsZW1lbnQncyBqc2FjdGlvbiBlbGVtZW50IGludG8gYSBtYXAuXG4gICAqXG4gICAqIFRoaXMgaXMgcHJpbWFyaWx5IGZvciBpbnRlcm5hbCB1c2UuXG4gICAqXG4gICAqIEBwYXJhbSBhY3Rpb25FbGVtZW50IFRoZSBET00gbm9kZSB0byByZXRyaWV2ZSB0aGUganNhY3Rpb24gbWFwIGZyb20uXG4gICAqIEByZXR1cm4gTWFwIGZyb20gZXZlbnQgdG8gcXVhbGlmaWVkIG5hbWUgb2YgdGhlIGpzYWN0aW9uIGJvdW5kIHRvIGl0LlxuICAgKi9cbiAgcHJpdmF0ZSBwYXJzZUFjdGlvbnMoYWN0aW9uRWxlbWVudDogRWxlbWVudCk6IHtba2V5OiBzdHJpbmddOiBzdHJpbmcgfCB1bmRlZmluZWR9IHtcbiAgICBsZXQgYWN0aW9uTWFwOiB7W2tleTogc3RyaW5nXTogc3RyaW5nIHwgdW5kZWZpbmVkfSB8IHVuZGVmaW5lZCA9IGNhY2hlLmdldChhY3Rpb25FbGVtZW50KTtcbiAgICBpZiAoIWFjdGlvbk1hcCkge1xuICAgICAgY29uc3QganNhY3Rpb25BdHRyaWJ1dGUgPSBhY3Rpb25FbGVtZW50LmdldEF0dHJpYnV0ZShBdHRyaWJ1dGUuSlNBQ1RJT04pO1xuICAgICAgaWYgKCFqc2FjdGlvbkF0dHJpYnV0ZSkge1xuICAgICAgICBhY3Rpb25NYXAgPSBFTVBUWV9BQ1RJT05fTUFQO1xuICAgICAgICBjYWNoZS5zZXQoYWN0aW9uRWxlbWVudCwgYWN0aW9uTWFwKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGFjdGlvbk1hcCA9IGNhY2hlLmdldFBhcnNlZChqc2FjdGlvbkF0dHJpYnV0ZSk7XG4gICAgICAgIGlmICghYWN0aW9uTWFwKSB7XG4gICAgICAgICAgYWN0aW9uTWFwID0ge307XG4gICAgICAgICAgY29uc3QgdmFsdWVzID0ganNhY3Rpb25BdHRyaWJ1dGUuc3BsaXQoUkVHRVhQX1NFTUlDT0xPTik7XG4gICAgICAgICAgZm9yIChsZXQgaWR4ID0gMDsgaWR4IDwgdmFsdWVzLmxlbmd0aDsgaWR4KyspIHtcbiAgICAgICAgICAgIGNvbnN0IHZhbHVlID0gdmFsdWVzW2lkeF07XG4gICAgICAgICAgICBpZiAoIXZhbHVlKSB7XG4gICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgY29sb24gPSB2YWx1ZS5pbmRleE9mKENoYXIuRVZFTlRfQUNUSU9OX1NFUEFSQVRPUik7XG4gICAgICAgICAgICBjb25zdCBoYXNDb2xvbiA9IGNvbG9uICE9PSAtMTtcbiAgICAgICAgICAgIGNvbnN0IHR5cGUgPSBoYXNDb2xvbiA/IHZhbHVlLnN1YnN0cigwLCBjb2xvbikudHJpbSgpIDogREVGQVVMVF9FVkVOVF9UWVBFO1xuICAgICAgICAgICAgY29uc3QgYWN0aW9uID0gaGFzQ29sb24gPyB2YWx1ZS5zdWJzdHIoY29sb24gKyAxKS50cmltKCkgOiB2YWx1ZTtcbiAgICAgICAgICAgIGFjdGlvbk1hcFt0eXBlXSA9IGFjdGlvbjtcbiAgICAgICAgICB9XG4gICAgICAgICAgY2FjaGUuc2V0UGFyc2VkKGpzYWN0aW9uQXR0cmlidXRlLCBhY3Rpb25NYXApO1xuICAgICAgICB9XG4gICAgICAgIGNhY2hlLnNldChhY3Rpb25FbGVtZW50LCBhY3Rpb25NYXApO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gYWN0aW9uTWFwO1xuICB9XG5cbiAgYWRkQTExeUNsaWNrU3VwcG9ydChcbiAgICB1cGRhdGVFdmVudEluZm9Gb3JBMTF5Q2xpY2s6IHR5cGVvZiBhMTF5Q2xpY2sudXBkYXRlRXZlbnRJbmZvRm9yQTExeUNsaWNrLFxuICAgIHByZXZlbnREZWZhdWx0Rm9yQTExeUNsaWNrOiB0eXBlb2YgYTExeUNsaWNrLnByZXZlbnREZWZhdWx0Rm9yQTExeUNsaWNrLFxuICAgIHBvcHVsYXRlQ2xpY2tPbmx5QWN0aW9uOiB0eXBlb2YgYTExeUNsaWNrLnBvcHVsYXRlQ2xpY2tPbmx5QWN0aW9uLFxuICApIHtcbiAgICB0aGlzLmExMXlDbGlja1N1cHBvcnQgPSB0cnVlO1xuICAgIHRoaXMudXBkYXRlRXZlbnRJbmZvRm9yQTExeUNsaWNrID0gdXBkYXRlRXZlbnRJbmZvRm9yQTExeUNsaWNrO1xuICAgIHRoaXMucHJldmVudERlZmF1bHRGb3JBMTF5Q2xpY2sgPSBwcmV2ZW50RGVmYXVsdEZvckExMXlDbGljaztcbiAgICB0aGlzLnBvcHVsYXRlQ2xpY2tPbmx5QWN0aW9uID0gcG9wdWxhdGVDbGlja09ubHlBY3Rpb247XG4gIH1cbn1cbiJdfQ==