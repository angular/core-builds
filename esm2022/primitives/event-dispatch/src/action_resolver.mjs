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
    constructor({ customEventSupport = false, jsnamespaceSupport = false, syntheticMouseEventSupport = false, } = {}) {
        this.a11yClickSupport = false;
        this.updateEventInfoForA11yClick = undefined;
        this.preventDefaultForA11yClick = undefined;
        this.populateClickOnlyAction = undefined;
        this.customEventSupport = customEventSupport;
        this.jsnamespaceSupport = jsnamespaceSupport;
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
        const actionMap = this.parseActions(actionElement, eventInfoLib.getContainer(eventInfo));
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
     * @param container The node which limits the namespace lookup for a jsaction
     * name. The container node itself will not be searched.
     * @return Map from event to qualified name of the jsaction bound to it.
     */
    parseActions(actionElement, container) {
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
                // If namespace support is active we need to augment the (potentially
                // cached) jsaction mapping with the namespace.
                if (this.jsnamespaceSupport) {
                    const noNs = actionMap;
                    actionMap = {};
                    for (const type in noNs) {
                        actionMap[type] = this.getFullyQualifiedAction(noNs[type], actionElement, container);
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
    getFullyQualifiedAction(action, start, container) {
        if (isNamespacedAction(action)) {
            return action;
        }
        let node = start;
        while (node && node.nodeType === Node.ELEMENT_NODE) {
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
        return action;
    }
    addA11yClickSupport(updateEventInfoForA11yClick, preventDefaultForA11yClick, populateClickOnlyAction) {
        this.a11yClickSupport = true;
        this.updateEventInfoForA11yClick = updateEventInfoForA11yClick;
        this.preventDefaultForA11yClick = preventDefaultForA11yClick;
        this.populateClickOnlyAction = populateClickOnlyAction;
    }
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
    // before. getAttribute() returns null if an attribute is not present. Thus,
    // namespace is string|null if the query took place in the past, or
    // undefined if the query did not take place.
    if (namespace === undefined) {
        namespace = element.getAttribute(Attribute.JSNAMESPACE);
        cache.setNamespace(element, namespace);
    }
    return namespace;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWN0aW9uX3Jlc29sdmVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9wcmltaXRpdmVzL2V2ZW50LWRpc3BhdGNoL3NyYy9hY3Rpb25fcmVzb2x2ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLGFBQWEsQ0FBQztBQUN0QyxPQUFPLEVBQUMsSUFBSSxFQUFDLE1BQU0sUUFBUSxDQUFDO0FBQzVCLE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxjQUFjLENBQUM7QUFDdkMsT0FBTyxFQUFDLFFBQVEsRUFBQyxNQUFNLFlBQVksQ0FBQztBQUVwQyxPQUFPLEtBQUssS0FBSyxNQUFNLFNBQVMsQ0FBQztBQUNqQyxPQUFPLEtBQUssWUFBWSxNQUFNLGNBQWMsQ0FBQztBQUM3QyxPQUFPLEtBQUssUUFBUSxNQUFNLFNBQVMsQ0FBQztBQUVwQzs7O0dBR0c7QUFDSCxNQUFNLGdCQUFnQixHQUE0QixFQUFFLENBQUM7QUFFckQ7O0dBRUc7QUFDSCxNQUFNLGdCQUFnQixHQUFHLFNBQVMsQ0FBQztBQUVuQyx3REFBd0Q7QUFDeEQsTUFBTSxrQkFBa0IsR0FBVyxTQUFTLENBQUMsS0FBSyxDQUFDO0FBRW5ELG1DQUFtQztBQUNuQyxNQUFNLE9BQU8sY0FBYztJQWdCekIsWUFBWSxFQUNWLGtCQUFrQixHQUFHLEtBQUssRUFDMUIsa0JBQWtCLEdBQUcsS0FBSyxFQUMxQiwwQkFBMEIsR0FBRyxLQUFLLE1BS2hDLEVBQUU7UUF2QkUscUJBQWdCLEdBQVksS0FBSyxDQUFDO1FBS2xDLGdDQUEyQixHQUFpRCxTQUFTLENBQUM7UUFFdEYsK0JBQTBCLEdBQWlELFNBQVMsQ0FBQztRQUVyRiw0QkFBdUIsR0FJbkIsU0FBUyxDQUFDO1FBV3BCLElBQUksQ0FBQyxrQkFBa0IsR0FBRyxrQkFBa0IsQ0FBQztRQUM3QyxJ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QUFDLFlBQVksQ0FBQyxTQUFTLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDeEQsS0FBSyxDQUFDLFlBQVksQ0FBQyxPQUFPLEVBQUUsU0FBUyxDQUFDLENBQUM7SUFDekMsQ0FBQztJQUNELE9BQU8sU0FBUyxDQUFDO0FBQ25CLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtBdHRyaWJ1dGV9IGZyb20gJy4vYXR0cmlidXRlJztcbmltcG9ydCB7Q2hhcn0gZnJvbSAnLi9jaGFyJztcbmltcG9ydCB7RXZlbnRUeXBlfSBmcm9tICcuL2V2ZW50X3R5cGUnO1xuaW1wb3J0IHtQcm9wZXJ0eX0gZnJvbSAnLi9wcm9wZXJ0eSc7XG5pbXBvcnQgKiBhcyBhMTF5Q2xpY2sgZnJvbSAnLi9hMTF5X2NsaWNrJztcbmltcG9ydCAqIGFzIGNhY2hlIGZyb20gJy4vY2FjaGUnO1xuaW1wb3J0ICogYXMgZXZlbnRJbmZvTGliIGZyb20gJy4vZXZlbnRfaW5mbyc7XG5pbXBvcnQgKiBhcyBldmVudExpYiBmcm9tICcuL2V2ZW50JztcblxuLyoqXG4gKiBTaW5jZSBtYXBzIGZyb20gZXZlbnQgdG8gYWN0aW9uIGFyZSBpbW11dGFibGUgd2UgY2FuIHVzZSBhIHNpbmdsZSBtYXBcbiAqIHRvIHJlcHJlc2VudCB0aGUgZW1wdHkgbWFwLlxuICovXG5jb25zdCBFTVBUWV9BQ1RJT05fTUFQOiB7W2tleTogc3RyaW5nXTogc3RyaW5nfSA9IHt9O1xuXG4vKipcbiAqIFRoaXMgcmVndWxhciBleHByZXNzaW9uIG1hdGNoZXMgYSBzZW1pY29sb24uXG4gKi9cbmNvbnN0IFJFR0VYUF9TRU1JQ09MT04gPSAvXFxzKjtcXHMqLztcblxuLyoqIElmIG5vIGV2ZW50IHR5cGUgaXMgZGVmaW5lZCwgZGVmYXVsdHMgdG8gYGNsaWNrYC4gKi9cbmNvbnN0IERFRkFVTFRfRVZFTlRfVFlQRTogc3RyaW5nID0gRXZlbnRUeXBlLkNMSUNLO1xuXG4vKiogUmVzb2x2ZXMgYWN0aW9ucyBmb3IgRXZlbnRzLiAqL1xuZXhwb3J0IGNsYXNzIEFjdGlvblJlc29sdmVyIHtcbiAgcHJpdmF0ZSBhMTF5Q2xpY2tTdXBwb3J0OiBib29sZWFuID0gZmFsc2U7XG4gIHByaXZhdGUgcmVhZG9ubHkgY3VzdG9tRXZlbnRTdXBwb3J0OiBib29sZWFuO1xuICBwcml2YXRlIHJlYWRvbmx5IGpzbmFtZXNwYWNlU3VwcG9ydDogYm9vbGVhbjtcbiAgcHJpdmF0ZSByZWFkb25seSBzeW50aGV0aWNNb3VzZUV2ZW50U3VwcG9ydDogYm9vbGVhbjtcblxuICBwcml2YXRlIHVwZGF0ZUV2ZW50SW5mb0ZvckExMXlDbGljaz86IChldmVudEluZm86IGV2ZW50SW5mb0xpYi5FdmVudEluZm8pID0+IHZvaWQgPSB1bmRlZmluZWQ7XG5cbiAgcHJpdmF0ZSBwcmV2ZW50RGVmYXVsdEZvckExMXlDbGljaz86IChldmVudEluZm86IGV2ZW50SW5mb0xpYi5FdmVudEluZm8pID0+IHZvaWQgPSB1bmRlZmluZWQ7XG5cbiAgcHJpdmF0ZSBwb3B1bGF0ZUNsaWNrT25seUFjdGlvbj86IChcbiAgICBhY3Rpb25FbGVtZW50OiBFbGVtZW50LFxuICAgIGV2ZW50SW5mbzogZXZlbnRJbmZvTGliLkV2ZW50SW5mbyxcbiAgICBhY3Rpb25NYXA6IHtba2V5OiBzdHJpbmddOiBzdHJpbmd9LFxuICApID0+IHZvaWQgPSB1bmRlZmluZWQ7XG5cbiAgY29uc3RydWN0b3Ioe1xuICAgIGN1c3RvbUV2ZW50U3VwcG9ydCA9IGZhbHNlLFxuICAgIGpzbmFtZXNwYWNlU3VwcG9ydCA9IGZhbHNlLFxuICAgIHN5bnRoZXRpY01vdXNlRXZlbnRTdXBwb3J0ID0gZmFsc2UsXG4gIH06IHtcbiAgICBjdXN0b21FdmVudFN1cHBvcnQ/OiBib29sZWFuO1xuICAgIGpzbmFtZXNwYWNlU3VwcG9ydD86IGJvb2xlYW47XG4gICAgc3ludGhldGljTW91c2VFdmVudFN1cHBvcnQ/OiBib29sZWFuO1xuICB9ID0ge30pIHtcbiAgICB0aGlzLmN1c3RvbUV2ZW50U3VwcG9ydCA9IGN1c3RvbUV2ZW50U3VwcG9ydDtcbiAgICB0aGlzLmpzbmFtZXNwYWNlU3VwcG9ydCA9IGpzbmFtZXNwYWNlU3VwcG9ydDtcbiAgICB0aGlzLnN5bnRoZXRpY01vdXNlRXZlbnRTdXBwb3J0ID0gc3ludGhldGljTW91c2VFdmVudFN1cHBvcnQ7XG4gIH1cblxuICByZXNvbHZlKGV2ZW50SW5mbzogZXZlbnRJbmZvTGliLkV2ZW50SW5mbykge1xuICAgIGlmICh0aGlzLmN1c3RvbUV2ZW50U3VwcG9ydCkge1xuICAgICAgaWYgKGV2ZW50SW5mb0xpYi5nZXRFdmVudFR5cGUoZXZlbnRJbmZvKSA9PT0gRXZlbnRUeXBlLkNVU1RPTSkge1xuICAgICAgICBjb25zdCBkZXRhaWwgPSAoZXZlbnRJbmZvTGliLmdldEV2ZW50KGV2ZW50SW5mbykgYXMgQ3VzdG9tRXZlbnQpLmRldGFpbDtcbiAgICAgICAgLy8gRm9yIGN1c3RvbSBldmVudHMsIHVzZSBhIHNlY29uZGFyeSBkaXNwYXRjaCBiYXNlZCBvbiB0aGUgaW50ZXJuYWxcbiAgICAgICAgLy8gY3VzdG9tIHR5cGUgb2YgdGhlIGV2ZW50LlxuICAgICAgICBpZiAoIWRldGFpbCB8fCAhZGV0YWlsWydfdHlwZSddKSB7XG4gICAgICAgICAgLy8gVGhpcyBzaG91bGQgbmV2ZXIgaGFwcGVuLlxuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBldmVudEluZm9MaWIuc2V0RXZlbnRUeXBlKGV2ZW50SW5mbywgZGV0YWlsWydfdHlwZSddKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLnBvcHVsYXRlQWN0aW9uKGV2ZW50SW5mbyk7XG4gIH1cblxuICAvKipcbiAgICogU2VhcmNoZXMgZm9yIGEganNhY3Rpb24gdGhhdCB0aGUgRE9NIGV2ZW50IG1hcHMgdG8gYW5kIGNyZWF0ZXMgYW5cbiAgICogb2JqZWN0IGNvbnRhaW5pbmcgZXZlbnQgaW5mb3JtYXRpb24gdXNlZCBmb3IgZGlzcGF0Y2hpbmcgYnlcbiAgICoganNhY3Rpb24uRGlzcGF0Y2hlci4gVGhpcyBtZXRob2QgcG9wdWxhdGVzIHRoZSBgYWN0aW9uYCBhbmQgYGFjdGlvbkVsZW1lbnRgXG4gICAqIGZpZWxkcyBvZiB0aGUgRXZlbnRJbmZvIG9iamVjdCBwYXNzZWQgaW4gYnkgZmluZGluZyB0aGUgZmlyc3RcbiAgICoganNhY3Rpb24gYXR0cmlidXRlIGFib3ZlIHRoZSB0YXJnZXQgTm9kZSBvZiB0aGUgZXZlbnQsIGFuZCBiZWxvd1xuICAgKiB0aGUgY29udGFpbmVyIE5vZGUsIHRoYXQgc3BlY2lmaWVzIGEganNhY3Rpb24gZm9yIHRoZSBldmVudFxuICAgKiB0eXBlLiBJZiBubyBzdWNoIGpzYWN0aW9uIGlzIGZvdW5kLCB0aGVuIGFjdGlvbiBpcyB1bmRlZmluZWQuXG4gICAqXG4gICAqIEBwYXJhbSBldmVudEluZm8gYEV2ZW50SW5mb2AgdG8gc2V0IGBhY3Rpb25gIGFuZCBgYWN0aW9uRWxlbWVudGAgaWYgYW5cbiAgICogICAgYWN0aW9uIGlzIGZvdW5kIG9uIGFueSBgRWxlbWVudGAgaW4gdGhlIHBhdGggb2YgdGhlIGBFdmVudGAuXG4gICAqL1xuICBwcml2YXRlIHBvcHVsYXRlQWN0aW9uKGV2ZW50SW5mbzogZXZlbnRJbmZvTGliLkV2ZW50SW5mbykge1xuICAgIC8vIFdlIGRpc3Rpbmd1aXNoIG1vZGlmaWVkIGFuZCBwbGFpbiBjbGlja3MgaW4gb3JkZXIgdG8gc3VwcG9ydCB0aGVcbiAgICAvLyBkZWZhdWx0IGJyb3dzZXIgYmVoYXZpb3Igb2YgbW9kaWZpZWQgY2xpY2tzIG9uIGxpbmtzOyB1c3VhbGx5IHRvXG4gICAgLy8gb3BlbiB0aGUgVVJMIG9mIHRoZSBsaW5rIGluIG5ldyB0YWIgb3IgbmV3IHdpbmRvdyBvbiBjdHJsL2NtZFxuICAgIC8vIGNsaWNrLiBBIERPTSAnY2xpY2snIGV2ZW50IGlzIG1hcHBlZCB0byB0aGUganNhY3Rpb24gJ2NsaWNrJ1xuICAgIC8vIGV2ZW50IGlmZiB0aGVyZSBpcyBubyBtb2RpZmllciBwcmVzZW50IG9uIHRoZSBldmVudC4gSWYgdGhlcmUgaXNcbiAgICAvLyBhIG1vZGlmaWVyLCBpdCdzIG1hcHBlZCB0byAnY2xpY2ttb2QnIGluc3RlYWQuXG4gICAgLy9cbiAgICAvLyBJdCdzIGFsbG93ZWQgdG8gb21pdCB0aGUgZXZlbnQgaW4gdGhlIGpzYWN0aW9uIGF0dHJpYnV0ZS4gSW4gdGhhdFxuICAgIC8vIGNhc2UsICdjbGljaycgaXMgYXNzdW1lZC4gVGh1cyB0aGUgZm9sbG93aW5nIHR3byBhcmUgZXF1aXZhbGVudDpcbiAgICAvL1xuICAgIC8vICAgPGEgaHJlZj1cInNvbWV1cmxcIiBqc2FjdGlvbj1cImduYS5mdVwiPlxuICAgIC8vICAgPGEgaHJlZj1cInNvbWV1cmxcIiBqc2FjdGlvbj1cImNsaWNrOmduYS5mdVwiPlxuICAgIC8vXG4gICAgLy8gRm9yIHVubW9kaWZpZWQgY2xpY2tzLCBFdmVudENvbnRyYWN0IGludm9rZXMgdGhlIGpzYWN0aW9uXG4gICAgLy8gJ2duYS5mdScuIEZvciBtb2RpZmllZCBjbGlja3MsIEV2ZW50Q29udHJhY3Qgd29uJ3QgZmluZCBhXG4gICAgLy8gc3VpdGFibGUgYWN0aW9uIGFuZCBsZWF2ZSB0aGUgZXZlbnQgdG8gYmUgaGFuZGxlZCBieSB0aGVcbiAgICAvLyBicm93c2VyLlxuICAgIC8vXG4gICAgLy8gSW4gb3JkZXIgdG8gYWxzbyBpbnZva2UgYSBqc2FjdGlvbiBoYW5kbGVyIGZvciBhIG1vZGlmaWVyIGNsaWNrLFxuICAgIC8vICdjbGlja21vZCcgbmVlZHMgdG8gYmUgdXNlZDpcbiAgICAvL1xuICAgIC8vICAgPGEgaHJlZj1cInNvbWV1cmxcIiBqc2FjdGlvbj1cImNsaWNrbW9kOmduYS5mdVwiPlxuICAgIC8vXG4gICAgLy8gRXZlbnRDb250cmFjdCBpbnZva2VzIHRoZSBqc2FjdGlvbiAnZ25hLmZ1JyBmb3IgbW9kaWZpZWRcbiAgICAvLyBjbGlja3MuIFVubW9kaWZpZWQgY2xpY2tzIGFyZSBsZWZ0IHRvIHRoZSBicm93c2VyLlxuICAgIC8vXG4gICAgLy8gSW4gb3JkZXIgdG8gc2V0IHVwIHRoZSBldmVudCBjb250cmFjdCB0byBoYW5kbGUgYm90aCBjbGlja29ubHkgYW5kXG4gICAgLy8gY2xpY2ttb2QsIG9ubHkgYWRkRXZlbnQoRXZlbnRUeXBlLkNMSUNLKSBpcyBuZWNlc3NhcnkuXG4gICAgLy9cbiAgICAvLyBJbiBvcmRlciB0byBzZXQgdXAgdGhlIGV2ZW50IGNvbnRyYWN0IHRvIGhhbmRsZSBjbGljayxcbiAgICAvLyBhZGRFdmVudCgpIGlzIG5lY2Vzc2FyeSBmb3IgQ0xJQ0ssIEtFWURPV04sIGFuZCBLRVlQUkVTUyBldmVudCB0eXBlcy4gIElmXG4gICAgLy8gYTExeSBjbGljayBzdXBwb3J0IGlzIGVuYWJsZWQsIGFkZEV2ZW50KCkgd2lsbCBzZXQgdXAgdGhlIGFwcHJvcHJpYXRlIGtleVxuICAgIC8vIGV2ZW50IGhhbmRsZXIgYXV0b21hdGljYWxseS5cbiAgICBpZiAoXG4gICAgICBldmVudEluZm9MaWIuZ2V0RXZlbnRUeXBlKGV2ZW50SW5mbykgPT09IEV2ZW50VHlwZS5DTElDSyAmJlxuICAgICAgZXZlbnRMaWIuaXNNb2RpZmllZENsaWNrRXZlbnQoZXZlbnRJbmZvTGliLmdldEV2ZW50KGV2ZW50SW5mbykpXG4gICAgKSB7XG4gICAgICBldmVudEluZm9MaWIuc2V0RXZlbnRUeXBlKGV2ZW50SW5mbywgRXZlbnRUeXBlLkNMSUNLTU9EKTtcbiAgICB9IGVsc2UgaWYgKHRoaXMuYTExeUNsaWNrU3VwcG9ydCkge1xuICAgICAgdGhpcy51cGRhdGVFdmVudEluZm9Gb3JBMTF5Q2xpY2shKGV2ZW50SW5mbyk7XG4gICAgfVxuXG4gICAgLy8gV2FsayB0byB0aGUgcGFyZW50IG5vZGUsIHVubGVzcyB0aGUgbm9kZSBoYXMgYSBkaWZmZXJlbnQgb3duZXIgaW5cbiAgICAvLyB3aGljaCBjYXNlIHdlIHdhbGsgdG8gdGhlIG93bmVyLiBBdHRlbXB0IHRvIHdhbGsgdG8gaG9zdCBvZiBhXG4gICAgLy8gc2hhZG93IHJvb3QgaWYgbmVlZGVkLlxuICAgIGxldCBhY3Rpb25FbGVtZW50OiBFbGVtZW50IHwgbnVsbCA9IGV2ZW50SW5mb0xpYi5nZXRUYXJnZXRFbGVtZW50KGV2ZW50SW5mbyk7XG4gICAgd2hpbGUgKGFjdGlvbkVsZW1lbnQgJiYgYWN0aW9uRWxlbWVudCAhPT0gZXZlbnRJbmZvTGliLmdldENvbnRhaW5lcihldmVudEluZm8pKSB7XG4gICAgICBpZiAoYWN0aW9uRWxlbWVudC5ub2RlVHlwZSA9PT0gTm9kZS5FTEVNRU5UX05PREUpIHtcbiAgICAgICAgdGhpcy5wb3B1bGF0ZUFjdGlvbk9uRWxlbWVudChhY3Rpb25FbGVtZW50LCBldmVudEluZm8pO1xuICAgICAgfVxuXG4gICAgICBpZiAoZXZlbnRJbmZvTGliLmdldEFjdGlvbihldmVudEluZm8pKSB7XG4gICAgICAgIC8vIEFuIGV2ZW50IGlzIGhhbmRsZWQgYnkgYXQgbW9zdCBvbmUganNhY3Rpb24uIFRodXMgd2Ugc3RvcCBhdCB0aGVcbiAgICAgICAgLy8gZmlyc3QgbWF0Y2hpbmcganNhY3Rpb24gc3BlY2lmaWVkIGluIGEganNhY3Rpb24gYXR0cmlidXRlIHVwIHRoZVxuICAgICAgICAvLyBhbmNlc3RvciBjaGFpbiBvZiB0aGUgZXZlbnQgdGFyZ2V0IG5vZGUuXG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgaWYgKGFjdGlvbkVsZW1lbnRbUHJvcGVydHkuT1dORVJdKSB7XG4gICAgICAgIGFjdGlvbkVsZW1lbnQgPSBhY3Rpb25FbGVtZW50W1Byb3BlcnR5Lk9XTkVSXSBhcyBFbGVtZW50O1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGlmIChhY3Rpb25FbGVtZW50LnBhcmVudE5vZGU/Lm5vZGVOYW1lICE9PSAnI2RvY3VtZW50LWZyYWdtZW50Jykge1xuICAgICAgICBhY3Rpb25FbGVtZW50ID0gYWN0aW9uRWxlbWVudC5wYXJlbnROb2RlIGFzIEVsZW1lbnQgfCBudWxsO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYWN0aW9uRWxlbWVudCA9IChhY3Rpb25FbGVtZW50LnBhcmVudE5vZGUgYXMgU2hhZG93Um9vdCB8IG51bGwpPy5ob3N0ID8/IG51bGw7XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgYWN0aW9uID0gZXZlbnRJbmZvTGliLmdldEFjdGlvbihldmVudEluZm8pO1xuICAgIGlmICghYWN0aW9uKSB7XG4gICAgICAvLyBObyBhY3Rpb24gZm91bmQuXG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuYTExeUNsaWNrU3VwcG9ydCkge1xuICAgICAgdGhpcy5wcmV2ZW50RGVmYXVsdEZvckExMXlDbGljayEoZXZlbnRJbmZvKTtcbiAgICB9XG5cbiAgICAvLyBXZSBhdHRlbXB0IHRvIGhhbmRsZSB0aGUgbW91c2VlbnRlci9tb3VzZWxlYXZlIGV2ZW50cyBoZXJlIGJ5XG4gICAgLy8gZGV0ZWN0aW5nIHdoZXRoZXIgdGhlIG1vdXNlb3Zlci9tb3VzZW91dCBldmVudHMgY29ycmVzcG9uZCB0b1xuICAgIC8vIGVudGVyaW5nL2xlYXZpbmcgYW4gZWxlbWVudC5cbiAgICBpZiAodGhpcy5zeW50aGV0aWNNb3VzZUV2ZW50U3VwcG9ydCkge1xuICAgICAgaWYgKFxuICAgICAgICBldmVudEluZm9MaWIuZ2V0RXZlbnRUeXBlKGV2ZW50SW5mbykgPT09IEV2ZW50VHlwZS5NT1VTRUVOVEVSIHx8XG4gICAgICAgIGV2ZW50SW5mb0xpYi5nZXRFdmVudFR5cGUoZXZlbnRJbmZvKSA9PT0gRXZlbnRUeXBlLk1PVVNFTEVBVkUgfHxcbiAgICAgICAgZXZlbnRJbmZvTGliLmdldEV2ZW50VHlwZShldmVudEluZm8pID09PSBFdmVudFR5cGUuUE9JTlRFUkVOVEVSIHx8XG4gICAgICAgIGV2ZW50SW5mb0xpYi5nZXRFdmVudFR5cGUoZXZlbnRJbmZvKSA9PT0gRXZlbnRUeXBlLlBPSU5URVJMRUFWRVxuICAgICAgKSB7XG4gICAgICAgIC8vIFdlIGF0dGVtcHQgdG8gaGFuZGxlIHRoZSBtb3VzZWVudGVyL21vdXNlbGVhdmUgZXZlbnRzIGhlcmUgYnlcbiAgICAgICAgLy8gZGV0ZWN0aW5nIHdoZXRoZXIgdGhlIG1vdXNlb3Zlci9tb3VzZW91dCBldmVudHMgY29ycmVzcG9uZCB0b1xuICAgICAgICAvLyBlbnRlcmluZy9sZWF2aW5nIGFuIGVsZW1lbnQuXG4gICAgICAgIGlmIChcbiAgICAgICAgICBldmVudExpYi5pc01vdXNlU3BlY2lhbEV2ZW50KFxuICAgICAgICAgICAgZXZlbnRJbmZvTGliLmdldEV2ZW50KGV2ZW50SW5mbyksXG4gICAgICAgICAgICBldmVudEluZm9MaWIuZ2V0RXZlbnRUeXBlKGV2ZW50SW5mbyksXG4gICAgICAgICAgICBldmVudEluZm9MaWIuZ2V0QWN0aW9uRWxlbWVudChhY3Rpb24pLFxuICAgICAgICAgIClcbiAgICAgICAgKSB7XG4gICAgICAgICAgLy8gSWYgYm90aCBtb3VzZW92ZXIvbW91c2VvdXQgYW5kIG1vdXNlZW50ZXIvbW91c2VsZWF2ZSBldmVudHMgYXJlXG4gICAgICAgICAgLy8gZW5hYmxlZCwgdHdvIHNlcGFyYXRlIGhhbmRsZXJzIGZvciBtb3VzZW92ZXIvbW91c2VvdXQgYXJlXG4gICAgICAgICAgLy8gcmVnaXN0ZXJlZC4gQm90aCBoYW5kbGVycyB3aWxsIHNlZSB0aGUgc2FtZSBldmVudCBpbnN0YW5jZVxuICAgICAgICAgIC8vIHNvIHdlIGNyZWF0ZSBhIGNvcHkgdG8gYXZvaWQgaW50ZXJmZXJpbmcgd2l0aCB0aGUgZGlzcGF0Y2hpbmcgb2ZcbiAgICAgICAgICAvLyB0aGUgbW91c2VvdmVyL21vdXNlb3V0IGV2ZW50LlxuICAgICAgICAgIGNvbnN0IGNvcGllZEV2ZW50ID0gZXZlbnRMaWIuY3JlYXRlTW91c2VTcGVjaWFsRXZlbnQoXG4gICAgICAgICAgICBldmVudEluZm9MaWIuZ2V0RXZlbnQoZXZlbnRJbmZvKSxcbiAgICAgICAgICAgIGV2ZW50SW5mb0xpYi5nZXRBY3Rpb25FbGVtZW50KGFjdGlvbiksXG4gICAgICAgICAgKTtcbiAgICAgICAgICBldmVudEluZm9MaWIuc2V0RXZlbnQoZXZlbnRJbmZvLCBjb3BpZWRFdmVudCk7XG4gICAgICAgICAgLy8gU2luY2UgdGhlIG1vdXNlZW50ZXIvbW91c2VsZWF2ZSBldmVudHMgZG8gbm90IGJ1YmJsZSwgdGhlIHRhcmdldFxuICAgICAgICAgIC8vIG9mIHRoZSBldmVudCBpcyB0ZWNobmljYWxseSB0aGUgYGFjdGlvbkVsZW1lbnRgICh0aGUgbm9kZSB3aXRoIHRoZVxuICAgICAgICAgIC8vIGBqc2FjdGlvbmAgYXR0cmlidXRlKVxuICAgICAgICAgIGV2ZW50SW5mb0xpYi5zZXRUYXJnZXRFbGVtZW50KGV2ZW50SW5mbywgZXZlbnRJbmZvTGliLmdldEFjdGlvbkVsZW1lbnQoYWN0aW9uKSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZXZlbnRJbmZvTGliLnVuc2V0QWN0aW9uKGV2ZW50SW5mbyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQWNjZXNzZXMgdGhlIGpzYWN0aW9uIG1hcCBvbiBhIG5vZGUgYW5kIHJldHJpZXZlcyB0aGUgbmFtZSBvZiB0aGVcbiAgICogYWN0aW9uIHRoZSBnaXZlbiBldmVudCBpcyBtYXBwZWQgdG8sIGlmIGFueS4gSXQgcGFyc2VzIHRoZVxuICAgKiBhdHRyaWJ1dGUgdmFsdWUgYW5kIHN0b3JlcyBpdCBpbiBhIHByb3BlcnR5IG9uIHRoZSBub2RlIGZvclxuICAgKiBzdWJzZXF1ZW50IHJldHJpZXZhbCB3aXRob3V0IHJlLXBhcnNpbmcgYW5kIHJlLWFjY2Vzc2luZyB0aGVcbiAgICogYXR0cmlidXRlLiBJbiBvcmRlciB0byBmdWxseSBxdWFsaWZ5IGpzYWN0aW9uIG5hbWVzIHVzaW5nIGFcbiAgICogbmFtZXNwYWNlLCB0aGUgRE9NIGlzIHNlYXJjaGVkIHN0YXJ0aW5nIGF0IHRoZSBjdXJyZW50IG5vZGUgYW5kXG4gICAqIGdvaW5nIHRocm91Z2ggYW5jZXN0b3Igbm9kZXMgdW50aWwgYSBqc25hbWVzcGFjZSBhdHRyaWJ1dGUgaXNcbiAgICogZm91bmQuXG4gICAqXG4gICAqIEBwYXJhbSBhY3Rpb25FbGVtZW50IFRoZSBET00gbm9kZSB0byByZXRyaWV2ZSB0aGUganNhY3Rpb24gbWFwIGZyb20uXG4gICAqIEBwYXJhbSBldmVudEluZm8gYEV2ZW50SW5mb2AgdG8gc2V0IGBhY3Rpb25gIGFuZCBgYWN0aW9uRWxlbWVudGAgaWYgYW5cbiAgICogICAgYWN0aW9uIGlzIGZvdW5kIG9uIHRoZSBgYWN0aW9uRWxlbWVudGAuXG4gICAqL1xuICBwcml2YXRlIHBvcHVsYXRlQWN0aW9uT25FbGVtZW50KGFjdGlvbkVsZW1lbnQ6IEVsZW1lbnQsIGV2ZW50SW5mbzogZXZlbnRJbmZvTGliLkV2ZW50SW5mbykge1xuICAgIGNvbnN0IGFjdGlvbk1hcCA9IHRoaXMucGFyc2VBY3Rpb25zKGFjdGlvbkVsZW1lbnQsIGV2ZW50SW5mb0xpYi5nZXRDb250YWluZXIoZXZlbnRJbmZvKSk7XG5cbiAgICBjb25zdCBhY3Rpb25OYW1lID0gYWN0aW9uTWFwW2V2ZW50SW5mb0xpYi5nZXRFdmVudFR5cGUoZXZlbnRJbmZvKV07XG4gICAgaWYgKGFjdGlvbk5hbWUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgZXZlbnRJbmZvTGliLnNldEFjdGlvbihldmVudEluZm8sIGFjdGlvbk5hbWUsIGFjdGlvbkVsZW1lbnQpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLmExMXlDbGlja1N1cHBvcnQpIHtcbiAgICAgIHRoaXMucG9wdWxhdGVDbGlja09ubHlBY3Rpb24hKGFjdGlvbkVsZW1lbnQsIGV2ZW50SW5mbywgYWN0aW9uTWFwKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogUGFyc2VzIGFuZCBjYWNoZXMgYW4gZWxlbWVudCdzIGpzYWN0aW9uIGVsZW1lbnQgaW50byBhIG1hcC5cbiAgICpcbiAgICogVGhpcyBpcyBwcmltYXJpbHkgZm9yIGludGVybmFsIHVzZS5cbiAgICpcbiAgICogQHBhcmFtIGFjdGlvbkVsZW1lbnQgVGhlIERPTSBub2RlIHRvIHJldHJpZXZlIHRoZSBqc2FjdGlvbiBtYXAgZnJvbS5cbiAgICogQHBhcmFtIGNvbnRhaW5lciBUaGUgbm9kZSB3aGljaCBsaW1pdHMgdGhlIG5hbWVzcGFjZSBsb29rdXAgZm9yIGEganNhY3Rpb25cbiAgICogbmFtZS4gVGhlIGNvbnRhaW5lciBub2RlIGl0c2VsZiB3aWxsIG5vdCBiZSBzZWFyY2hlZC5cbiAgICogQHJldHVybiBNYXAgZnJvbSBldmVudCB0byBxdWFsaWZpZWQgbmFtZSBvZiB0aGUganNhY3Rpb24gYm91bmQgdG8gaXQuXG4gICAqL1xuICBwcml2YXRlIHBhcnNlQWN0aW9ucyhhY3Rpb25FbGVtZW50OiBFbGVtZW50LCBjb250YWluZXI6IE5vZGUpOiB7W2tleTogc3RyaW5nXTogc3RyaW5nfSB7XG4gICAgbGV0IGFjdGlvbk1hcDoge1trZXk6IHN0cmluZ106IHN0cmluZ30gfCB1bmRlZmluZWQgPSBjYWNoZS5nZXQoYWN0aW9uRWxlbWVudCk7XG4gICAgaWYgKCFhY3Rpb25NYXApIHtcbiAgICAgIGNvbnN0IGpzYWN0aW9uQXR0cmlidXRlID0gYWN0aW9uRWxlbWVudC5nZXRBdHRyaWJ1dGUoQXR0cmlidXRlLkpTQUNUSU9OKTtcbiAgICAgIGlmICghanNhY3Rpb25BdHRyaWJ1dGUpIHtcbiAgICAgICAgYWN0aW9uTWFwID0gRU1QVFlfQUNUSU9OX01BUDtcbiAgICAgICAgY2FjaGUuc2V0KGFjdGlvbkVsZW1lbnQsIGFjdGlvbk1hcCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBhY3Rpb25NYXAgPSBjYWNoZS5nZXRQYXJzZWQoanNhY3Rpb25BdHRyaWJ1dGUpO1xuICAgICAgICBpZiAoIWFjdGlvbk1hcCkge1xuICAgICAgICAgIGFjdGlvbk1hcCA9IHt9O1xuICAgICAgICAgIGNvbnN0IHZhbHVlcyA9IGpzYWN0aW9uQXR0cmlidXRlLnNwbGl0KFJFR0VYUF9TRU1JQ09MT04pO1xuICAgICAgICAgIGZvciAobGV0IGlkeCA9IDA7IGlkeCA8IHZhbHVlcy5sZW5ndGg7IGlkeCsrKSB7XG4gICAgICAgICAgICBjb25zdCB2YWx1ZSA9IHZhbHVlc1tpZHhdO1xuICAgICAgICAgICAgaWYgKCF2YWx1ZSkge1xuICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IGNvbG9uID0gdmFsdWUuaW5kZXhPZihDaGFyLkVWRU5UX0FDVElPTl9TRVBBUkFUT1IpO1xuICAgICAgICAgICAgY29uc3QgaGFzQ29sb24gPSBjb2xvbiAhPT0gLTE7XG4gICAgICAgICAgICBjb25zdCB0eXBlID0gaGFzQ29sb24gPyB2YWx1ZS5zdWJzdHIoMCwgY29sb24pLnRyaW0oKSA6IERFRkFVTFRfRVZFTlRfVFlQRTtcbiAgICAgICAgICAgIGNvbnN0IGFjdGlvbiA9IGhhc0NvbG9uID8gdmFsdWUuc3Vic3RyKGNvbG9uICsgMSkudHJpbSgpIDogdmFsdWU7XG4gICAgICAgICAgICBhY3Rpb25NYXBbdHlwZV0gPSBhY3Rpb247XG4gICAgICAgICAgfVxuICAgICAgICAgIGNhY2hlLnNldFBhcnNlZChqc2FjdGlvbkF0dHJpYnV0ZSwgYWN0aW9uTWFwKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBJZiBuYW1lc3BhY2Ugc3VwcG9ydCBpcyBhY3RpdmUgd2UgbmVlZCB0byBhdWdtZW50IHRoZSAocG90ZW50aWFsbHlcbiAgICAgICAgLy8gY2FjaGVkKSBqc2FjdGlvbiBtYXBwaW5nIHdpdGggdGhlIG5hbWVzcGFjZS5cbiAgICAgICAgaWYgKHRoaXMuanNuYW1lc3BhY2VTdXBwb3J0KSB7XG4gICAgICAgICAgY29uc3Qgbm9OcyA9IGFjdGlvbk1hcDtcbiAgICAgICAgICBhY3Rpb25NYXAgPSB7fTtcbiAgICAgICAgICBmb3IgKGNvbnN0IHR5cGUgaW4gbm9Ocykge1xuICAgICAgICAgICAgYWN0aW9uTWFwW3R5cGVdID0gdGhpcy5nZXRGdWxseVF1YWxpZmllZEFjdGlvbihub05zW3R5cGVdLCBhY3Rpb25FbGVtZW50LCBjb250YWluZXIpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjYWNoZS5zZXQoYWN0aW9uRWxlbWVudCwgYWN0aW9uTWFwKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGFjdGlvbk1hcDtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBmdWxseSBxdWFsaWZpZWQganNhY3Rpb24gYWN0aW9uLiBJZiB0aGUgZ2l2ZW4ganNhY3Rpb25cbiAgICogbmFtZSBkb2Vzbid0IGFscmVhZHkgY29udGFpbiB0aGUgbmFtZXNwYWNlLCB0aGUgZnVuY3Rpb24gaXRlcmF0ZXNcbiAgICogb3ZlciBhbmNlc3RvciBub2RlcyB1bnRpbCBhIGpzbmFtZXNwYWNlIGF0dHJpYnV0ZSBpcyBmb3VuZCwgYW5kXG4gICAqIHVzZXMgdGhlIHZhbHVlIG9mIHRoYXQgYXR0cmlidXRlIGFzIHRoZSBuYW1lc3BhY2UuXG4gICAqXG4gICAqIEBwYXJhbSBhY3Rpb24gVGhlIGpzYWN0aW9uIGFjdGlvbiB0byByZXNvbHZlLlxuICAgKiBAcGFyYW0gc3RhcnQgVGhlIG5vZGUgZnJvbSB3aGljaCB0byBzdGFydCBzZWFyY2hpbmcgZm9yIGEganNuYW1lc3BhY2VcbiAgICogYXR0cmlidXRlLlxuICAgKiBAcGFyYW0gY29udGFpbmVyIFRoZSBub2RlIHdoaWNoIGxpbWl0cyB0aGUgc2VhcmNoIGZvciBhIGpzbmFtZXNwYWNlXG4gICAqIGF0dHJpYnV0ZS4gVGhpcyBub2RlIHdpbGwgYmUgc2VhcmNoZWQuXG4gICAqIEByZXR1cm4gVGhlIGZ1bGx5IHF1YWxpZmllZCBuYW1lIG9mIHRoZSBqc2FjdGlvbi4gSWYgbm8gbmFtZXNwYWNlIGlzIGZvdW5kLFxuICAgKiByZXR1cm5zIHRoZSB1bnF1YWxpZmllZCBuYW1lIGluIGNhc2UgaXQgZXhpc3RzIGluIHRoZSBnbG9iYWwgbmFtZXNwYWNlLlxuICAgKi9cbiAgcHJpdmF0ZSBnZXRGdWxseVF1YWxpZmllZEFjdGlvbihhY3Rpb246IHN0cmluZywgc3RhcnQ6IEVsZW1lbnQsIGNvbnRhaW5lcjogTm9kZSk6IHN0cmluZyB7XG4gICAgaWYgKGlzTmFtZXNwYWNlZEFjdGlvbihhY3Rpb24pKSB7XG4gICAgICByZXR1cm4gYWN0aW9uO1xuICAgIH1cblxuICAgIGxldCBub2RlOiBOb2RlIHwgbnVsbCA9IHN0YXJ0O1xuICAgIHdoaWxlIChub2RlICYmIG5vZGUubm9kZVR5cGUgPT09IE5vZGUuRUxFTUVOVF9OT0RFKSB7XG4gICAgICBjb25zdCBuYW1lc3BhY2UgPSBnZXROYW1lc3BhY2VGcm9tRWxlbWVudChub2RlIGFzIEVsZW1lbnQpO1xuICAgICAgaWYgKG5hbWVzcGFjZSkge1xuICAgICAgICByZXR1cm4gbmFtZXNwYWNlICsgQ2hhci5OQU1FU1BBQ0VfQUNUSU9OX1NFUEFSQVRPUiArIGFjdGlvbjtcbiAgICAgIH1cblxuICAgICAgLy8gSWYgdGhpcyBub2RlIGlzIHRoZSBjb250YWluZXIsIHN0b3AuXG4gICAgICBpZiAobm9kZSA9PT0gY29udGFpbmVyKSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuXG4gICAgICBub2RlID0gbm9kZS5wYXJlbnROb2RlO1xuICAgIH1cblxuICAgIHJldHVybiBhY3Rpb247XG4gIH1cblxuICBhZGRBMTF5Q2xpY2tTdXBwb3J0KFxuICAgIHVwZGF0ZUV2ZW50SW5mb0ZvckExMXlDbGljazogdHlwZW9mIGExMXlDbGljay51cGRhdGVFdmVudEluZm9Gb3JBMTF5Q2xpY2ssXG4gICAgcHJldmVudERlZmF1bHRGb3JBMTF5Q2xpY2s6IHR5cGVvZiBhMTF5Q2xpY2sucHJldmVudERlZmF1bHRGb3JBMTF5Q2xpY2ssXG4gICAgcG9wdWxhdGVDbGlja09ubHlBY3Rpb246IHR5cGVvZiBhMTF5Q2xpY2sucG9wdWxhdGVDbGlja09ubHlBY3Rpb24sXG4gICkge1xuICAgIHRoaXMuYTExeUNsaWNrU3VwcG9ydCA9IHRydWU7XG4gICAgdGhpcy51cGRhdGVFdmVudEluZm9Gb3JBMTF5Q2xpY2sgPSB1cGRhdGVFdmVudEluZm9Gb3JBMTF5Q2xpY2s7XG4gICAgdGhpcy5wcmV2ZW50RGVmYXVsdEZvckExMXlDbGljayA9IHByZXZlbnREZWZhdWx0Rm9yQTExeUNsaWNrO1xuICAgIHRoaXMucG9wdWxhdGVDbGlja09ubHlBY3Rpb24gPSBwb3B1bGF0ZUNsaWNrT25seUFjdGlvbjtcbiAgfVxufVxuXG4vKipcbiAqIENoZWNrcyBpZiBhIGpzYWN0aW9uIGFjdGlvbiBjb250YWlucyBhIG5hbWVzcGFjZSBwYXJ0LlxuICovXG5mdW5jdGlvbiBpc05hbWVzcGFjZWRBY3Rpb24oYWN0aW9uOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgcmV0dXJuIGFjdGlvbi5pbmRleE9mKENoYXIuTkFNRVNQQUNFX0FDVElPTl9TRVBBUkFUT1IpID49IDA7XG59XG5cbi8qKlxuICogUmV0dXJucyB0aGUgdmFsdWUgb2YgdGhlIGpzbmFtZXNwYWNlIGF0dHJpYnV0ZSBvZiB0aGUgZ2l2ZW4gbm9kZS5cbiAqIEFsc28gY2FjaGVzIHRoZSB2YWx1ZSBmb3Igc3Vic2VxdWVudCBsb29rdXBzLlxuICogQHBhcmFtIGVsZW1lbnQgVGhlIG5vZGUgd2hvc2UganNuYW1lc3BhY2UgYXR0cmlidXRlIGlzIGJlaW5nIGFza2VkIGZvci5cbiAqIEByZXR1cm4gVGhlIHZhbHVlIG9mIHRoZSBqc25hbWVzcGFjZSBhdHRyaWJ1dGUsIG9yIG51bGwgaWYgbm90IGZvdW5kLlxuICovXG5mdW5jdGlvbiBnZXROYW1lc3BhY2VGcm9tRWxlbWVudChlbGVtZW50OiBFbGVtZW50KTogc3RyaW5nIHwgbnVsbCB7XG4gIGxldCBuYW1lc3BhY2UgPSBjYWNoZS5nZXROYW1lc3BhY2UoZWxlbWVudCk7XG4gIC8vIE9ubHkgcXVlcnkgZm9yIHRoZSBhdHRyaWJ1dGUgaWYgaXQgaGFzIG5vdCBiZWVuIHF1ZXJpZWQgZm9yXG4gIC8vIGJlZm9yZS4gZ2V0QXR0cmlidXRlKCkgcmV0dXJucyBudWxsIGlmIGFuIGF0dHJpYnV0ZSBpcyBub3QgcHJlc2VudC4gVGh1cyxcbiAgLy8gbmFtZXNwYWNlIGlzIHN0cmluZ3xudWxsIGlmIHRoZSBxdWVyeSB0b29rIHBsYWNlIGluIHRoZSBwYXN0LCBvclxuICAvLyB1bmRlZmluZWQgaWYgdGhlIHF1ZXJ5IGRpZCBub3QgdGFrZSBwbGFjZS5cbiAgaWYgKG5hbWVzcGFjZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgbmFtZXNwYWNlID0gZWxlbWVudC5nZXRBdHRyaWJ1dGUoQXR0cmlidXRlLkpTTkFNRVNQQUNFKTtcbiAgICBjYWNoZS5zZXROYW1lc3BhY2UoZWxlbWVudCwgbmFtZXNwYWNlKTtcbiAgfVxuICByZXR1cm4gbmFtZXNwYWNlO1xufVxuIl19