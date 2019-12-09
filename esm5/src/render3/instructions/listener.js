/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { assertDataInRange } from '../../util/assert';
import { isObservable } from '../../util/lang';
import { EMPTY_OBJ } from '../empty';
import { isProceduralRenderer } from '../interfaces/renderer';
import { isDirectiveHost } from '../interfaces/type_checks';
import { CLEANUP, FLAGS, RENDERER, TVIEW } from '../interfaces/view';
import { assertNodeOfPossibleTypes } from '../node_assert';
import { getLView, getPreviousOrParentTNode } from '../state';
import { getComponentLViewByIndex, getNativeByTNode, unwrapRNode } from '../util/view_utils';
import { getCleanup, handleError, loadComponentRenderer, markViewDirty } from './shared';
/**
 * Adds an event listener to the current node.
 *
 * If an output exists on one of the node's directives, it also subscribes to the output
 * and saves the subscription for later cleanup.
 *
 * @param eventName Name of the event
 * @param listenerFn The function to be called when event emits
 * @param useCapture Whether or not to use capture in event listener
 * @param eventTargetResolver Function that returns global target information in case this listener
 * should be attached to a global object like window, document or body
 *
 * @codeGenApi
 */
export function ɵɵlistener(eventName, listenerFn, useCapture, eventTargetResolver) {
    if (useCapture === void 0) { useCapture = false; }
    var lView = getLView();
    var tNode = getPreviousOrParentTNode();
    listenerInternal(lView, lView[RENDERER], tNode, eventName, listenerFn, useCapture, eventTargetResolver);
}
/**
* Registers a synthetic host listener (e.g. `(@foo.start)`) on a component.
*
* This instruction is for compatibility purposes and is designed to ensure that a
* synthetic host listener (e.g. `@HostListener('@foo.start')`) properly gets rendered
* in the component's renderer. Normally all host listeners are evaluated with the
* parent component's renderer, but, in the case of animation @triggers, they need
* to be evaluated with the sub component's renderer (because that's where the
* animation triggers are defined).
*
* Do not use this instruction as a replacement for `listener`. This instruction
* only exists to ensure compatibility with the ViewEngine's host binding behavior.
*
* @param eventName Name of the event
* @param listenerFn The function to be called when event emits
* @param useCapture Whether or not to use capture in event listener
* @param eventTargetResolver Function that returns global target information in case this listener
* should be attached to a global object like window, document or body
 *
 * @codeGenApi
*/
export function ɵɵcomponentHostSyntheticListener(eventName, listenerFn, useCapture, eventTargetResolver) {
    if (useCapture === void 0) { useCapture = false; }
    var lView = getLView();
    var tNode = getPreviousOrParentTNode();
    var renderer = loadComponentRenderer(tNode, lView);
    listenerInternal(lView, renderer, tNode, eventName, listenerFn, useCapture, eventTargetResolver);
}
/**
 * A utility function that checks if a given element has already an event handler registered for an
 * event with a specified name. The TView.cleanup data structure is used to find out which events
 * are registered for a given element.
 */
function findExistingListener(lView, eventName, tNodeIdx) {
    var tView = lView[TVIEW];
    var tCleanup = tView.cleanup;
    if (tCleanup != null) {
        for (var i = 0; i < tCleanup.length - 1; i += 2) {
            var cleanupEventName = tCleanup[i];
            if (cleanupEventName === eventName && tCleanup[i + 1] === tNodeIdx) {
                // We have found a matching event name on the same node but it might not have been
                // registered yet, so we must explicitly verify entries in the LView cleanup data
                // structures.
                var lCleanup = lView[CLEANUP];
                var listenerIdxInLCleanup = tCleanup[i + 2];
                return lCleanup.length > listenerIdxInLCleanup ? lCleanup[listenerIdxInLCleanup] : null;
            }
            // TView.cleanup can have a mix of 4-elements entries (for event handler cleanups) or
            // 2-element entries (for directive and queries destroy hooks). As such we can encounter
            // blocks of 4 or 2 items in the tView.cleanup and this is why we iterate over 2 elements
            // first and jump another 2 elements if we detect listeners cleanup (4 elements). Also check
            // documentation of TView.cleanup for more details of this data structure layout.
            if (typeof cleanupEventName === 'string') {
                i += 2;
            }
        }
    }
    return null;
}
function listenerInternal(lView, renderer, tNode, eventName, listenerFn, useCapture, eventTargetResolver) {
    if (useCapture === void 0) { useCapture = false; }
    var tView = lView[TVIEW];
    var isTNodeDirectiveHost = isDirectiveHost(tNode);
    var firstCreatePass = tView.firstCreatePass;
    var tCleanup = firstCreatePass && (tView.cleanup || (tView.cleanup = []));
    // When the ɵɵlistener instruction was generated and is executed we know that there is either a
    // native listener or a directive output on this element. As such we we know that we will have to
    // register a listener and store its cleanup function on LView.
    var lCleanup = getCleanup(lView);
    ngDevMode && assertNodeOfPossibleTypes(tNode, 3 /* Element */, 0 /* Container */, 4 /* ElementContainer */);
    var processOutputs = true;
    // add native event listener - applicable to elements only
    if (tNode.type === 3 /* Element */) {
        var native = getNativeByTNode(tNode, lView);
        var resolved = eventTargetResolver ? eventTargetResolver(native) : EMPTY_OBJ;
        var target = resolved.target || native;
        var lCleanupIndex = lCleanup.length;
        var idxOrTargetGetter = eventTargetResolver ?
            function (_lView) { return eventTargetResolver(unwrapRNode(_lView[tNode.index])).target; } :
            tNode.index;
        // In order to match current behavior, native DOM event listeners must be added for all
        // events (including outputs).
        if (isProceduralRenderer(renderer)) {
            // There might be cases where multiple directives on the same element try to register an event
            // handler function for the same event. In this situation we want to avoid registration of
            // several native listeners as each registration would be intercepted by NgZone and
            // trigger change detection. This would mean that a single user action would result in several
            // change detections being invoked. To avoid this situation we want to have only one call to
            // native handler registration (for the same element and same type of event).
            //
            // In order to have just one native event handler in presence of multiple handler functions,
            // we just register a first handler function as a native event listener and then chain
            // (coalesce) other handler functions on top of the first native handler function.
            var existingListener = null;
            // Please note that the coalescing described here doesn't happen for events specifying an
            // alternative target (ex. (document:click)) - this is to keep backward compatibility with the
            // view engine.
            // Also, we don't have to search for existing listeners is there are no directives
            // matching on a given node as we can't register multiple event handlers for the same event in
            // a template (this would mean having duplicate attributes).
            if (!eventTargetResolver && isTNodeDirectiveHost) {
                existingListener = findExistingListener(lView, eventName, tNode.index);
            }
            if (existingListener !== null) {
                // Attach a new listener to coalesced listeners list, maintaining the order in which
                // listeners are registered. For performance reasons, we keep a reference to the last
                // listener in that list (in `__ngLastListenerFn__` field), so we can avoid going through
                // the entire set each time we need to add a new listener.
                var lastListenerFn = existingListener.__ngLastListenerFn__ || existingListener;
                lastListenerFn.__ngNextListenerFn__ = listenerFn;
                existingListener.__ngLastListenerFn__ = listenerFn;
                processOutputs = false;
            }
            else {
                // The first argument of `listen` function in Procedural Renderer is:
                // - either a target name (as a string) in case of global target (window, document, body)
                // - or element reference (in all other cases)
                listenerFn = wrapListener(tNode, lView, listenerFn, false /** preventDefault */);
                var cleanupFn = renderer.listen(resolved.name || target, eventName, listenerFn);
                ngDevMode && ngDevMode.rendererAddEventListener++;
                lCleanup.push(listenerFn, cleanupFn);
                tCleanup && tCleanup.push(eventName, idxOrTargetGetter, lCleanupIndex, lCleanupIndex + 1);
            }
        }
        else {
            listenerFn = wrapListener(tNode, lView, listenerFn, true /** preventDefault */);
            target.addEventListener(eventName, listenerFn, useCapture);
            ngDevMode && ngDevMode.rendererAddEventListener++;
            lCleanup.push(listenerFn);
            tCleanup && tCleanup.push(eventName, idxOrTargetGetter, lCleanupIndex, useCapture);
        }
    }
    // subscribe to directive outputs
    var outputs = tNode.outputs;
    var props;
    if (processOutputs && outputs !== null && (props = outputs[eventName])) {
        var propsLength = props.length;
        if (propsLength) {
            for (var i = 0; i < propsLength; i += 2) {
                var index = props[i];
                ngDevMode && assertDataInRange(lView, index);
                var minifiedName = props[i + 1];
                var directiveInstance = lView[index];
                var output = directiveInstance[minifiedName];
                if (ngDevMode && !isObservable(output)) {
                    throw new Error("@Output " + minifiedName + " not initialized in '" + directiveInstance.constructor.name + "'.");
                }
                var subscription = output.subscribe(listenerFn);
                var idx = lCleanup.length;
                lCleanup.push(listenerFn, subscription);
                tCleanup && tCleanup.push(eventName, tNode.index, idx, -(idx + 1));
            }
        }
    }
}
function executeListenerWithErrorHandling(lView, listenerFn, e) {
    try {
        // Only explicitly returning false from a listener should preventDefault
        return listenerFn(e) !== false;
    }
    catch (error) {
        handleError(lView, error);
        return false;
    }
}
/**
 * Wraps an event listener with a function that marks ancestors dirty and prevents default behavior,
 * if applicable.
 *
 * @param tNode The TNode associated with this listener
 * @param lView The LView that contains this listener
 * @param listenerFn The listener function to call
 * @param wrapWithPreventDefault Whether or not to prevent default behavior
 * (the procedural renderer does this already, so in those cases, we should skip)
 */
function wrapListener(tNode, lView, listenerFn, wrapWithPreventDefault) {
    // Note: we are performing most of the work in the listener function itself
    // to optimize listener registration.
    return function wrapListenerIn_markDirtyAndPreventDefault(e) {
        // Ivy uses `Function` as a special token that allows us to unwrap the function
        // so that it can be invoked programmatically by `DebugNode.triggerEventHandler`.
        if (e === Function) {
            return listenerFn;
        }
        // In order to be backwards compatible with View Engine, events on component host nodes
        // must also mark the component view itself dirty (i.e. the view that it owns).
        var startView = tNode.flags & 2 /* isComponentHost */ ?
            getComponentLViewByIndex(tNode.index, lView) :
            lView;
        // See interfaces/view.ts for more on LViewFlags.ManualOnPush
        if ((lView[FLAGS] & 32 /* ManualOnPush */) === 0) {
            markViewDirty(startView);
        }
        var result = executeListenerWithErrorHandling(lView, listenerFn, e);
        // A just-invoked listener function might have coalesced listeners so we need to check for
        // their presence and invoke as needed.
        var nextListenerFn = wrapListenerIn_markDirtyAndPreventDefault.__ngNextListenerFn__;
        while (nextListenerFn) {
            // We should prevent default if any of the listeners explicitly return false
            result = executeListenerWithErrorHandling(lView, nextListenerFn, e) && result;
            nextListenerFn = nextListenerFn.__ngNextListenerFn__;
        }
        if (wrapWithPreventDefault && result === false) {
            e.preventDefault();
            // Necessary for legacy browsers that don't support preventDefault (e.g. IE)
            e.returnValue = false;
        }
        return result;
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGlzdGVuZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2luc3RydWN0aW9ucy9saXN0ZW5lci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFHSCxPQUFPLEVBQUMsaUJBQWlCLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUNwRCxPQUFPLEVBQUMsWUFBWSxFQUFDLE1BQU0saUJBQWlCLENBQUM7QUFDN0MsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUVuQyxPQUFPLEVBQTRDLG9CQUFvQixFQUFDLE1BQU0sd0JBQXdCLENBQUM7QUFDdkcsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLDJCQUEyQixDQUFDO0FBQzFELE9BQU8sRUFBQyxPQUFPLEVBQUUsS0FBSyxFQUFxQixRQUFRLEVBQUUsS0FBSyxFQUFDLE1BQU0sb0JBQW9CLENBQUM7QUFDdEYsT0FBTyxFQUFDLHlCQUF5QixFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFDekQsT0FBTyxFQUFDLFFBQVEsRUFBRSx3QkFBd0IsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUM1RCxPQUFPLEVBQUMsd0JBQXdCLEVBQUUsZ0JBQWdCLEVBQUUsV0FBVyxFQUFDLE1BQU0sb0JBQW9CLENBQUM7QUFFM0YsT0FBTyxFQUFDLFVBQVUsRUFBRSxXQUFXLEVBQUUscUJBQXFCLEVBQUUsYUFBYSxFQUFDLE1BQU0sVUFBVSxDQUFDO0FBSXZGOzs7Ozs7Ozs7Ozs7O0dBYUc7QUFDSCxNQUFNLFVBQVUsVUFBVSxDQUN0QixTQUFpQixFQUFFLFVBQTRCLEVBQUUsVUFBa0IsRUFDbkUsbUJBQTBDO0lBRE8sMkJBQUEsRUFBQSxrQkFBa0I7SUFFckUsSUFBTSxLQUFLLEdBQUcsUUFBUSxFQUFFLENBQUM7SUFDekIsSUFBTSxLQUFLLEdBQUcsd0JBQXdCLEVBQUUsQ0FBQztJQUN6QyxnQkFBZ0IsQ0FDWixLQUFLLEVBQUUsS0FBSyxDQUFDLFFBQVEsQ0FBQyxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsVUFBVSxFQUFFLFVBQVUsRUFBRSxtQkFBbUIsQ0FBQyxDQUFDO0FBQzdGLENBQUM7QUFFRDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7RUFvQkU7QUFDRixNQUFNLFVBQVUsZ0NBQWdDLENBQzVDLFNBQWlCLEVBQUUsVUFBNEIsRUFBRSxVQUFrQixFQUNuRSxtQkFBMEM7SUFETywyQkFBQSxFQUFBLGtCQUFrQjtJQUVyRSxJQUFNLEtBQUssR0FBRyxRQUFRLEVBQUUsQ0FBQztJQUN6QixJQUFNLEtBQUssR0FBRyx3QkFBd0IsRUFBRSxDQUFDO0lBQ3pDLElBQU0sUUFBUSxHQUFHLHFCQUFxQixDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztJQUNyRCxnQkFBZ0IsQ0FBQyxLQUFLLEVBQUUsUUFBUSxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsVUFBVSxFQUFFLFVBQVUsRUFBRSxtQkFBbUIsQ0FBQyxDQUFDO0FBQ25HLENBQUM7QUFFRDs7OztHQUlHO0FBQ0gsU0FBUyxvQkFBb0IsQ0FDekIsS0FBWSxFQUFFLFNBQWlCLEVBQUUsUUFBZ0I7SUFDbkQsSUFBTSxLQUFLLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQzNCLElBQU0sUUFBUSxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUM7SUFDL0IsSUFBSSxRQUFRLElBQUksSUFBSSxFQUFFO1FBQ3BCLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxRQUFRLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFO1lBQy9DLElBQU0sZ0JBQWdCLEdBQUcsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3JDLElBQUksZ0JBQWdCLEtBQUssU0FBUyxJQUFJLFFBQVEsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEtBQUssUUFBUSxFQUFFO2dCQUNsRSxrRkFBa0Y7Z0JBQ2xGLGlGQUFpRjtnQkFDakYsY0FBYztnQkFDZCxJQUFNLFFBQVEsR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFHLENBQUM7Z0JBQ2xDLElBQU0scUJBQXFCLEdBQUcsUUFBUSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztnQkFDOUMsT0FBTyxRQUFRLENBQUMsTUFBTSxHQUFHLHFCQUFxQixDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMscUJBQXFCLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO2FBQ3pGO1lBQ0QscUZBQXFGO1lBQ3JGLHdGQUF3RjtZQUN4Rix5RkFBeUY7WUFDekYsNEZBQTRGO1lBQzVGLGlGQUFpRjtZQUNqRixJQUFJLE9BQU8sZ0JBQWdCLEtBQUssUUFBUSxFQUFFO2dCQUN4QyxDQUFDLElBQUksQ0FBQyxDQUFDO2FBQ1I7U0FDRjtLQUNGO0lBQ0QsT0FBTyxJQUFJLENBQUM7QUFDZCxDQUFDO0FBRUQsU0FBUyxnQkFBZ0IsQ0FDckIsS0FBWSxFQUFFLFFBQW1CLEVBQUUsS0FBWSxFQUFFLFNBQWlCLEVBQ2xFLFVBQTRCLEVBQUUsVUFBa0IsRUFDaEQsbUJBQTBDO0lBRFosMkJBQUEsRUFBQSxrQkFBa0I7SUFFbEQsSUFBTSxLQUFLLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQzNCLElBQU0sb0JBQW9CLEdBQUcsZUFBZSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ3BELElBQU0sZUFBZSxHQUFHLEtBQUssQ0FBQyxlQUFlLENBQUM7SUFDOUMsSUFBTSxRQUFRLEdBQWdCLGVBQWUsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFFekYsK0ZBQStGO0lBQy9GLGlHQUFpRztJQUNqRywrREFBK0Q7SUFDL0QsSUFBTSxRQUFRLEdBQUcsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBRW5DLFNBQVMsSUFBSSx5QkFBeUIsQ0FDckIsS0FBSywrREFBcUUsQ0FBQztJQUU1RixJQUFJLGNBQWMsR0FBRyxJQUFJLENBQUM7SUFFMUIsMERBQTBEO0lBQzFELElBQUksS0FBSyxDQUFDLElBQUksb0JBQXNCLEVBQUU7UUFDcEMsSUFBTSxNQUFNLEdBQUcsZ0JBQWdCLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBYSxDQUFDO1FBQzFELElBQU0sUUFBUSxHQUFHLG1CQUFtQixDQUFDLENBQUMsQ0FBQyxtQkFBbUIsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBZ0IsQ0FBQztRQUN0RixJQUFNLE1BQU0sR0FBRyxRQUFRLENBQUMsTUFBTSxJQUFJLE1BQU0sQ0FBQztRQUN6QyxJQUFNLGFBQWEsR0FBRyxRQUFRLENBQUMsTUFBTSxDQUFDO1FBQ3RDLElBQU0saUJBQWlCLEdBQUcsbUJBQW1CLENBQUMsQ0FBQztZQUMzQyxVQUFDLE1BQWEsSUFBSyxPQUFBLG1CQUFtQixDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLEVBQTVELENBQTRELENBQUMsQ0FBQztZQUNqRixLQUFLLENBQUMsS0FBSyxDQUFDO1FBRWhCLHVGQUF1RjtRQUN2Riw4QkFBOEI7UUFDOUIsSUFBSSxvQkFBb0IsQ0FBQyxRQUFRLENBQUMsRUFBRTtZQUNsQyw4RkFBOEY7WUFDOUYsMEZBQTBGO1lBQzFGLG1GQUFtRjtZQUNuRiw4RkFBOEY7WUFDOUYsNEZBQTRGO1lBQzVGLDZFQUE2RTtZQUM3RSxFQUFFO1lBQ0YsNEZBQTRGO1lBQzVGLHNGQUFzRjtZQUN0RixrRkFBa0Y7WUFDbEYsSUFBSSxnQkFBZ0IsR0FBRyxJQUFJLENBQUM7WUFDNUIseUZBQXlGO1lBQ3pGLDhGQUE4RjtZQUM5RixlQUFlO1lBQ2Ysa0ZBQWtGO1lBQ2xGLDhGQUE4RjtZQUM5Riw0REFBNEQ7WUFDNUQsSUFBSSxDQUFDLG1CQUFtQixJQUFJLG9CQUFvQixFQUFFO2dCQUNoRCxnQkFBZ0IsR0FBRyxvQkFBb0IsQ0FBQyxLQUFLLEVBQUUsU0FBUyxFQUFFLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQzthQUN4RTtZQUNELElBQUksZ0JBQWdCLEtBQUssSUFBSSxFQUFFO2dCQUM3QixvRkFBb0Y7Z0JBQ3BGLHFGQUFxRjtnQkFDckYseUZBQXlGO2dCQUN6RiwwREFBMEQ7Z0JBQzFELElBQU0sY0FBYyxHQUFTLGdCQUFpQixDQUFDLG9CQUFvQixJQUFJLGdCQUFnQixDQUFDO2dCQUN4RixjQUFjLENBQUMsb0JBQW9CLEdBQUcsVUFBVSxDQUFDO2dCQUMzQyxnQkFBaUIsQ0FBQyxvQkFBb0IsR0FBRyxVQUFVLENBQUM7Z0JBQzFELGNBQWMsR0FBRyxLQUFLLENBQUM7YUFDeEI7aUJBQU07Z0JBQ0wscUVBQXFFO2dCQUNyRSx5RkFBeUY7Z0JBQ3pGLDhDQUE4QztnQkFDOUMsVUFBVSxHQUFHLFlBQVksQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLFVBQVUsRUFBRSxLQUFLLENBQUMscUJBQXFCLENBQUMsQ0FBQztnQkFDakYsSUFBTSxTQUFTLEdBQUcsUUFBUSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxJQUFJLE1BQU0sRUFBRSxTQUFTLEVBQUUsVUFBVSxDQUFDLENBQUM7Z0JBQ2xGLFNBQVMsSUFBSSxTQUFTLENBQUMsd0JBQXdCLEVBQUUsQ0FBQztnQkFFbEQsUUFBUSxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsU0FBUyxDQUFDLENBQUM7Z0JBQ3JDLFFBQVEsSUFBSSxRQUFRLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxpQkFBaUIsRUFBRSxhQUFhLEVBQUUsYUFBYSxHQUFHLENBQUMsQ0FBQyxDQUFDO2FBQzNGO1NBRUY7YUFBTTtZQUNMLFVBQVUsR0FBRyxZQUFZLENBQUMsS0FBSyxFQUFFLEtBQUssRUFBRSxVQUFVLEVBQUUsSUFBSSxDQUFDLHFCQUFxQixDQUFDLENBQUM7WUFDaEYsTUFBTSxDQUFDLGdCQUFnQixDQUFDLFNBQVMsRUFBRSxVQUFVLEVBQUUsVUFBVSxDQUFDLENBQUM7WUFDM0QsU0FBUyxJQUFJLFNBQVMsQ0FBQyx3QkFBd0IsRUFBRSxDQUFDO1lBRWxELFFBQVEsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDMUIsUUFBUSxJQUFJLFFBQVEsQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLGlCQUFpQixFQUFFLGFBQWEsRUFBRSxVQUFVLENBQUMsQ0FBQztTQUNwRjtLQUNGO0lBRUQsaUNBQWlDO0lBQ2pDLElBQU0sT0FBTyxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUM7SUFDOUIsSUFBSSxLQUFtQyxDQUFDO0lBQ3hDLElBQUksY0FBYyxJQUFJLE9BQU8sS0FBSyxJQUFJLElBQUksQ0FBQyxLQUFLLEdBQUcsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUU7UUFDdEUsSUFBTSxXQUFXLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQztRQUNqQyxJQUFJLFdBQVcsRUFBRTtZQUNmLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxXQUFXLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRTtnQkFDdkMsSUFBTSxLQUFLLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBVyxDQUFDO2dCQUNqQyxTQUFTLElBQUksaUJBQWlCLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO2dCQUM3QyxJQUFNLFlBQVksR0FBRyxLQUFLLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO2dCQUNsQyxJQUFNLGlCQUFpQixHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDdkMsSUFBTSxNQUFNLEdBQUcsaUJBQWlCLENBQUMsWUFBWSxDQUFDLENBQUM7Z0JBRS9DLElBQUksU0FBUyxJQUFJLENBQUMsWUFBWSxDQUFDLE1BQU0sQ0FBQyxFQUFFO29CQUN0QyxNQUFNLElBQUksS0FBSyxDQUNYLGFBQVcsWUFBWSw2QkFBd0IsaUJBQWlCLENBQUMsV0FBVyxDQUFDLElBQUksT0FBSSxDQUFDLENBQUM7aUJBQzVGO2dCQUVELElBQU0sWUFBWSxHQUFHLE1BQU0sQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLENBQUM7Z0JBQ2xELElBQU0sR0FBRyxHQUFHLFFBQVEsQ0FBQyxNQUFNLENBQUM7Z0JBQzVCLFFBQVEsQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLFlBQVksQ0FBQyxDQUFDO2dCQUN4QyxRQUFRLElBQUksUUFBUSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsS0FBSyxDQUFDLEtBQUssRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO2FBQ3BFO1NBQ0Y7S0FDRjtBQUNILENBQUM7QUFFRCxTQUFTLGdDQUFnQyxDQUNyQyxLQUFZLEVBQUUsVUFBNEIsRUFBRSxDQUFNO0lBQ3BELElBQUk7UUFDRix3RUFBd0U7UUFDeEUsT0FBTyxVQUFVLENBQUMsQ0FBQyxDQUFDLEtBQUssS0FBSyxDQUFDO0tBQ2hDO0lBQUMsT0FBTyxLQUFLLEVBQUU7UUFDZCxXQUFXLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQzFCLE9BQU8sS0FBSyxDQUFDO0tBQ2Q7QUFDSCxDQUFDO0FBRUQ7Ozs7Ozs7OztHQVNHO0FBQ0gsU0FBUyxZQUFZLENBQ2pCLEtBQVksRUFBRSxLQUFZLEVBQUUsVUFBNEIsRUFDeEQsc0JBQStCO0lBQ2pDLDJFQUEyRTtJQUMzRSxxQ0FBcUM7SUFDckMsT0FBTyxTQUFTLHlDQUF5QyxDQUFDLENBQU07UUFDOUQsK0VBQStFO1FBQy9FLGlGQUFpRjtRQUNqRixJQUFJLENBQUMsS0FBSyxRQUFRLEVBQUU7WUFDbEIsT0FBTyxVQUFVLENBQUM7U0FDbkI7UUFFRCx1RkFBdUY7UUFDdkYsK0VBQStFO1FBQy9FLElBQU0sU0FBUyxHQUFHLEtBQUssQ0FBQyxLQUFLLDBCQUE2QixDQUFDLENBQUM7WUFDeEQsd0JBQXdCLENBQUMsS0FBSyxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDO1lBQzlDLEtBQUssQ0FBQztRQUVWLDZEQUE2RDtRQUM3RCxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyx3QkFBMEIsQ0FBQyxLQUFLLENBQUMsRUFBRTtZQUNsRCxhQUFhLENBQUMsU0FBUyxDQUFDLENBQUM7U0FDMUI7UUFFRCxJQUFJLE1BQU0sR0FBRyxnQ0FBZ0MsQ0FBQyxLQUFLLEVBQUUsVUFBVSxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ3BFLDBGQUEwRjtRQUMxRix1Q0FBdUM7UUFDdkMsSUFBSSxjQUFjLEdBQVMseUNBQTBDLENBQUMsb0JBQW9CLENBQUM7UUFDM0YsT0FBTyxjQUFjLEVBQUU7WUFDckIsNEVBQTRFO1lBQzVFLE1BQU0sR0FBRyxnQ0FBZ0MsQ0FBQyxLQUFLLEVBQUUsY0FBYyxFQUFFLENBQUMsQ0FBQyxJQUFJLE1BQU0sQ0FBQztZQUM5RSxjQUFjLEdBQVMsY0FBZSxDQUFDLG9CQUFvQixDQUFDO1NBQzdEO1FBRUQsSUFBSSxzQkFBc0IsSUFBSSxNQUFNLEtBQUssS0FBSyxFQUFFO1lBQzlDLENBQUMsQ0FBQyxjQUFjLEVBQUUsQ0FBQztZQUNuQiw0RUFBNEU7WUFDNUUsQ0FBQyxDQUFDLFdBQVcsR0FBRyxLQUFLLENBQUM7U0FDdkI7UUFFRCxPQUFPLE1BQU0sQ0FBQztJQUNoQixDQUFDLENBQUM7QUFDSixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5cbmltcG9ydCB7YXNzZXJ0RGF0YUluUmFuZ2V9IGZyb20gJy4uLy4uL3V0aWwvYXNzZXJ0JztcbmltcG9ydCB7aXNPYnNlcnZhYmxlfSBmcm9tICcuLi8uLi91dGlsL2xhbmcnO1xuaW1wb3J0IHtFTVBUWV9PQkp9IGZyb20gJy4uL2VtcHR5JztcbmltcG9ydCB7UHJvcGVydHlBbGlhc1ZhbHVlLCBUTm9kZSwgVE5vZGVGbGFncywgVE5vZGVUeXBlfSBmcm9tICcuLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtHbG9iYWxUYXJnZXRSZXNvbHZlciwgUkVsZW1lbnQsIFJlbmRlcmVyMywgaXNQcm9jZWR1cmFsUmVuZGVyZXJ9IGZyb20gJy4uL2ludGVyZmFjZXMvcmVuZGVyZXInO1xuaW1wb3J0IHtpc0RpcmVjdGl2ZUhvc3R9IGZyb20gJy4uL2ludGVyZmFjZXMvdHlwZV9jaGVja3MnO1xuaW1wb3J0IHtDTEVBTlVQLCBGTEFHUywgTFZpZXcsIExWaWV3RmxhZ3MsIFJFTkRFUkVSLCBUVklFV30gZnJvbSAnLi4vaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7YXNzZXJ0Tm9kZU9mUG9zc2libGVUeXBlc30gZnJvbSAnLi4vbm9kZV9hc3NlcnQnO1xuaW1wb3J0IHtnZXRMVmlldywgZ2V0UHJldmlvdXNPclBhcmVudFROb2RlfSBmcm9tICcuLi9zdGF0ZSc7XG5pbXBvcnQge2dldENvbXBvbmVudExWaWV3QnlJbmRleCwgZ2V0TmF0aXZlQnlUTm9kZSwgdW53cmFwUk5vZGV9IGZyb20gJy4uL3V0aWwvdmlld191dGlscyc7XG5cbmltcG9ydCB7Z2V0Q2xlYW51cCwgaGFuZGxlRXJyb3IsIGxvYWRDb21wb25lbnRSZW5kZXJlciwgbWFya1ZpZXdEaXJ0eX0gZnJvbSAnLi9zaGFyZWQnO1xuXG5cblxuLyoqXG4gKiBBZGRzIGFuIGV2ZW50IGxpc3RlbmVyIHRvIHRoZSBjdXJyZW50IG5vZGUuXG4gKlxuICogSWYgYW4gb3V0cHV0IGV4aXN0cyBvbiBvbmUgb2YgdGhlIG5vZGUncyBkaXJlY3RpdmVzLCBpdCBhbHNvIHN1YnNjcmliZXMgdG8gdGhlIG91dHB1dFxuICogYW5kIHNhdmVzIHRoZSBzdWJzY3JpcHRpb24gZm9yIGxhdGVyIGNsZWFudXAuXG4gKlxuICogQHBhcmFtIGV2ZW50TmFtZSBOYW1lIG9mIHRoZSBldmVudFxuICogQHBhcmFtIGxpc3RlbmVyRm4gVGhlIGZ1bmN0aW9uIHRvIGJlIGNhbGxlZCB3aGVuIGV2ZW50IGVtaXRzXG4gKiBAcGFyYW0gdXNlQ2FwdHVyZSBXaGV0aGVyIG9yIG5vdCB0byB1c2UgY2FwdHVyZSBpbiBldmVudCBsaXN0ZW5lclxuICogQHBhcmFtIGV2ZW50VGFyZ2V0UmVzb2x2ZXIgRnVuY3Rpb24gdGhhdCByZXR1cm5zIGdsb2JhbCB0YXJnZXQgaW5mb3JtYXRpb24gaW4gY2FzZSB0aGlzIGxpc3RlbmVyXG4gKiBzaG91bGQgYmUgYXR0YWNoZWQgdG8gYSBnbG9iYWwgb2JqZWN0IGxpa2Ugd2luZG93LCBkb2N1bWVudCBvciBib2R5XG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVsaXN0ZW5lcihcbiAgICBldmVudE5hbWU6IHN0cmluZywgbGlzdGVuZXJGbjogKGU/OiBhbnkpID0+IGFueSwgdXNlQ2FwdHVyZSA9IGZhbHNlLFxuICAgIGV2ZW50VGFyZ2V0UmVzb2x2ZXI/OiBHbG9iYWxUYXJnZXRSZXNvbHZlcik6IHZvaWQge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IHROb2RlID0gZ2V0UHJldmlvdXNPclBhcmVudFROb2RlKCk7XG4gIGxpc3RlbmVySW50ZXJuYWwoXG4gICAgICBsVmlldywgbFZpZXdbUkVOREVSRVJdLCB0Tm9kZSwgZXZlbnROYW1lLCBsaXN0ZW5lckZuLCB1c2VDYXB0dXJlLCBldmVudFRhcmdldFJlc29sdmVyKTtcbn1cblxuLyoqXG4qIFJlZ2lzdGVycyBhIHN5bnRoZXRpYyBob3N0IGxpc3RlbmVyIChlLmcuIGAoQGZvby5zdGFydClgKSBvbiBhIGNvbXBvbmVudC5cbipcbiogVGhpcyBpbnN0cnVjdGlvbiBpcyBmb3IgY29tcGF0aWJpbGl0eSBwdXJwb3NlcyBhbmQgaXMgZGVzaWduZWQgdG8gZW5zdXJlIHRoYXQgYVxuKiBzeW50aGV0aWMgaG9zdCBsaXN0ZW5lciAoZS5nLiBgQEhvc3RMaXN0ZW5lcignQGZvby5zdGFydCcpYCkgcHJvcGVybHkgZ2V0cyByZW5kZXJlZFxuKiBpbiB0aGUgY29tcG9uZW50J3MgcmVuZGVyZXIuIE5vcm1hbGx5IGFsbCBob3N0IGxpc3RlbmVycyBhcmUgZXZhbHVhdGVkIHdpdGggdGhlXG4qIHBhcmVudCBjb21wb25lbnQncyByZW5kZXJlciwgYnV0LCBpbiB0aGUgY2FzZSBvZiBhbmltYXRpb24gQHRyaWdnZXJzLCB0aGV5IG5lZWRcbiogdG8gYmUgZXZhbHVhdGVkIHdpdGggdGhlIHN1YiBjb21wb25lbnQncyByZW5kZXJlciAoYmVjYXVzZSB0aGF0J3Mgd2hlcmUgdGhlXG4qIGFuaW1hdGlvbiB0cmlnZ2VycyBhcmUgZGVmaW5lZCkuXG4qXG4qIERvIG5vdCB1c2UgdGhpcyBpbnN0cnVjdGlvbiBhcyBhIHJlcGxhY2VtZW50IGZvciBgbGlzdGVuZXJgLiBUaGlzIGluc3RydWN0aW9uXG4qIG9ubHkgZXhpc3RzIHRvIGVuc3VyZSBjb21wYXRpYmlsaXR5IHdpdGggdGhlIFZpZXdFbmdpbmUncyBob3N0IGJpbmRpbmcgYmVoYXZpb3IuXG4qXG4qIEBwYXJhbSBldmVudE5hbWUgTmFtZSBvZiB0aGUgZXZlbnRcbiogQHBhcmFtIGxpc3RlbmVyRm4gVGhlIGZ1bmN0aW9uIHRvIGJlIGNhbGxlZCB3aGVuIGV2ZW50IGVtaXRzXG4qIEBwYXJhbSB1c2VDYXB0dXJlIFdoZXRoZXIgb3Igbm90IHRvIHVzZSBjYXB0dXJlIGluIGV2ZW50IGxpc3RlbmVyXG4qIEBwYXJhbSBldmVudFRhcmdldFJlc29sdmVyIEZ1bmN0aW9uIHRoYXQgcmV0dXJucyBnbG9iYWwgdGFyZ2V0IGluZm9ybWF0aW9uIGluIGNhc2UgdGhpcyBsaXN0ZW5lclxuKiBzaG91bGQgYmUgYXR0YWNoZWQgdG8gYSBnbG9iYWwgb2JqZWN0IGxpa2Ugd2luZG93LCBkb2N1bWVudCBvciBib2R5XG4gKlxuICogQGNvZGVHZW5BcGlcbiovXG5leHBvcnQgZnVuY3Rpb24gybXJtWNvbXBvbmVudEhvc3RTeW50aGV0aWNMaXN0ZW5lcihcbiAgICBldmVudE5hbWU6IHN0cmluZywgbGlzdGVuZXJGbjogKGU/OiBhbnkpID0+IGFueSwgdXNlQ2FwdHVyZSA9IGZhbHNlLFxuICAgIGV2ZW50VGFyZ2V0UmVzb2x2ZXI/OiBHbG9iYWxUYXJnZXRSZXNvbHZlcik6IHZvaWQge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IHROb2RlID0gZ2V0UHJldmlvdXNPclBhcmVudFROb2RlKCk7XG4gIGNvbnN0IHJlbmRlcmVyID0gbG9hZENvbXBvbmVudFJlbmRlcmVyKHROb2RlLCBsVmlldyk7XG4gIGxpc3RlbmVySW50ZXJuYWwobFZpZXcsIHJlbmRlcmVyLCB0Tm9kZSwgZXZlbnROYW1lLCBsaXN0ZW5lckZuLCB1c2VDYXB0dXJlLCBldmVudFRhcmdldFJlc29sdmVyKTtcbn1cblxuLyoqXG4gKiBBIHV0aWxpdHkgZnVuY3Rpb24gdGhhdCBjaGVja3MgaWYgYSBnaXZlbiBlbGVtZW50IGhhcyBhbHJlYWR5IGFuIGV2ZW50IGhhbmRsZXIgcmVnaXN0ZXJlZCBmb3IgYW5cbiAqIGV2ZW50IHdpdGggYSBzcGVjaWZpZWQgbmFtZS4gVGhlIFRWaWV3LmNsZWFudXAgZGF0YSBzdHJ1Y3R1cmUgaXMgdXNlZCB0byBmaW5kIG91dCB3aGljaCBldmVudHNcbiAqIGFyZSByZWdpc3RlcmVkIGZvciBhIGdpdmVuIGVsZW1lbnQuXG4gKi9cbmZ1bmN0aW9uIGZpbmRFeGlzdGluZ0xpc3RlbmVyKFxuICAgIGxWaWV3OiBMVmlldywgZXZlbnROYW1lOiBzdHJpbmcsIHROb2RlSWR4OiBudW1iZXIpOiAoKGU/OiBhbnkpID0+IGFueSl8bnVsbCB7XG4gIGNvbnN0IHRWaWV3ID0gbFZpZXdbVFZJRVddO1xuICBjb25zdCB0Q2xlYW51cCA9IHRWaWV3LmNsZWFudXA7XG4gIGlmICh0Q2xlYW51cCAhPSBudWxsKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0Q2xlYW51cC5sZW5ndGggLSAxOyBpICs9IDIpIHtcbiAgICAgIGNvbnN0IGNsZWFudXBFdmVudE5hbWUgPSB0Q2xlYW51cFtpXTtcbiAgICAgIGlmIChjbGVhbnVwRXZlbnROYW1lID09PSBldmVudE5hbWUgJiYgdENsZWFudXBbaSArIDFdID09PSB0Tm9kZUlkeCkge1xuICAgICAgICAvLyBXZSBoYXZlIGZvdW5kIGEgbWF0Y2hpbmcgZXZlbnQgbmFtZSBvbiB0aGUgc2FtZSBub2RlIGJ1dCBpdCBtaWdodCBub3QgaGF2ZSBiZWVuXG4gICAgICAgIC8vIHJlZ2lzdGVyZWQgeWV0LCBzbyB3ZSBtdXN0IGV4cGxpY2l0bHkgdmVyaWZ5IGVudHJpZXMgaW4gdGhlIExWaWV3IGNsZWFudXAgZGF0YVxuICAgICAgICAvLyBzdHJ1Y3R1cmVzLlxuICAgICAgICBjb25zdCBsQ2xlYW51cCA9IGxWaWV3W0NMRUFOVVBdICE7XG4gICAgICAgIGNvbnN0IGxpc3RlbmVySWR4SW5MQ2xlYW51cCA9IHRDbGVhbnVwW2kgKyAyXTtcbiAgICAgICAgcmV0dXJuIGxDbGVhbnVwLmxlbmd0aCA+IGxpc3RlbmVySWR4SW5MQ2xlYW51cCA/IGxDbGVhbnVwW2xpc3RlbmVySWR4SW5MQ2xlYW51cF0gOiBudWxsO1xuICAgICAgfVxuICAgICAgLy8gVFZpZXcuY2xlYW51cCBjYW4gaGF2ZSBhIG1peCBvZiA0LWVsZW1lbnRzIGVudHJpZXMgKGZvciBldmVudCBoYW5kbGVyIGNsZWFudXBzKSBvclxuICAgICAgLy8gMi1lbGVtZW50IGVudHJpZXMgKGZvciBkaXJlY3RpdmUgYW5kIHF1ZXJpZXMgZGVzdHJveSBob29rcykuIEFzIHN1Y2ggd2UgY2FuIGVuY291bnRlclxuICAgICAgLy8gYmxvY2tzIG9mIDQgb3IgMiBpdGVtcyBpbiB0aGUgdFZpZXcuY2xlYW51cCBhbmQgdGhpcyBpcyB3aHkgd2UgaXRlcmF0ZSBvdmVyIDIgZWxlbWVudHNcbiAgICAgIC8vIGZpcnN0IGFuZCBqdW1wIGFub3RoZXIgMiBlbGVtZW50cyBpZiB3ZSBkZXRlY3QgbGlzdGVuZXJzIGNsZWFudXAgKDQgZWxlbWVudHMpLiBBbHNvIGNoZWNrXG4gICAgICAvLyBkb2N1bWVudGF0aW9uIG9mIFRWaWV3LmNsZWFudXAgZm9yIG1vcmUgZGV0YWlscyBvZiB0aGlzIGRhdGEgc3RydWN0dXJlIGxheW91dC5cbiAgICAgIGlmICh0eXBlb2YgY2xlYW51cEV2ZW50TmFtZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgaSArPSAyO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuZnVuY3Rpb24gbGlzdGVuZXJJbnRlcm5hbChcbiAgICBsVmlldzogTFZpZXcsIHJlbmRlcmVyOiBSZW5kZXJlcjMsIHROb2RlOiBUTm9kZSwgZXZlbnROYW1lOiBzdHJpbmcsXG4gICAgbGlzdGVuZXJGbjogKGU/OiBhbnkpID0+IGFueSwgdXNlQ2FwdHVyZSA9IGZhbHNlLFxuICAgIGV2ZW50VGFyZ2V0UmVzb2x2ZXI/OiBHbG9iYWxUYXJnZXRSZXNvbHZlcik6IHZvaWQge1xuICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgY29uc3QgaXNUTm9kZURpcmVjdGl2ZUhvc3QgPSBpc0RpcmVjdGl2ZUhvc3QodE5vZGUpO1xuICBjb25zdCBmaXJzdENyZWF0ZVBhc3MgPSB0Vmlldy5maXJzdENyZWF0ZVBhc3M7XG4gIGNvbnN0IHRDbGVhbnVwOiBmYWxzZXxhbnlbXSA9IGZpcnN0Q3JlYXRlUGFzcyAmJiAodFZpZXcuY2xlYW51cCB8fCAodFZpZXcuY2xlYW51cCA9IFtdKSk7XG5cbiAgLy8gV2hlbiB0aGUgybXJtWxpc3RlbmVyIGluc3RydWN0aW9uIHdhcyBnZW5lcmF0ZWQgYW5kIGlzIGV4ZWN1dGVkIHdlIGtub3cgdGhhdCB0aGVyZSBpcyBlaXRoZXIgYVxuICAvLyBuYXRpdmUgbGlzdGVuZXIgb3IgYSBkaXJlY3RpdmUgb3V0cHV0IG9uIHRoaXMgZWxlbWVudC4gQXMgc3VjaCB3ZSB3ZSBrbm93IHRoYXQgd2Ugd2lsbCBoYXZlIHRvXG4gIC8vIHJlZ2lzdGVyIGEgbGlzdGVuZXIgYW5kIHN0b3JlIGl0cyBjbGVhbnVwIGZ1bmN0aW9uIG9uIExWaWV3LlxuICBjb25zdCBsQ2xlYW51cCA9IGdldENsZWFudXAobFZpZXcpO1xuXG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlT2ZQb3NzaWJsZVR5cGVzKFxuICAgICAgICAgICAgICAgICAgIHROb2RlLCBUTm9kZVR5cGUuRWxlbWVudCwgVE5vZGVUeXBlLkNvbnRhaW5lciwgVE5vZGVUeXBlLkVsZW1lbnRDb250YWluZXIpO1xuXG4gIGxldCBwcm9jZXNzT3V0cHV0cyA9IHRydWU7XG5cbiAgLy8gYWRkIG5hdGl2ZSBldmVudCBsaXN0ZW5lciAtIGFwcGxpY2FibGUgdG8gZWxlbWVudHMgb25seVxuICBpZiAodE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkVsZW1lbnQpIHtcbiAgICBjb25zdCBuYXRpdmUgPSBnZXROYXRpdmVCeVROb2RlKHROb2RlLCBsVmlldykgYXMgUkVsZW1lbnQ7XG4gICAgY29uc3QgcmVzb2x2ZWQgPSBldmVudFRhcmdldFJlc29sdmVyID8gZXZlbnRUYXJnZXRSZXNvbHZlcihuYXRpdmUpIDogRU1QVFlfT0JKIGFzIGFueTtcbiAgICBjb25zdCB0YXJnZXQgPSByZXNvbHZlZC50YXJnZXQgfHwgbmF0aXZlO1xuICAgIGNvbnN0IGxDbGVhbnVwSW5kZXggPSBsQ2xlYW51cC5sZW5ndGg7XG4gICAgY29uc3QgaWR4T3JUYXJnZXRHZXR0ZXIgPSBldmVudFRhcmdldFJlc29sdmVyID9cbiAgICAgICAgKF9sVmlldzogTFZpZXcpID0+IGV2ZW50VGFyZ2V0UmVzb2x2ZXIodW53cmFwUk5vZGUoX2xWaWV3W3ROb2RlLmluZGV4XSkpLnRhcmdldCA6XG4gICAgICAgIHROb2RlLmluZGV4O1xuXG4gICAgLy8gSW4gb3JkZXIgdG8gbWF0Y2ggY3VycmVudCBiZWhhdmlvciwgbmF0aXZlIERPTSBldmVudCBsaXN0ZW5lcnMgbXVzdCBiZSBhZGRlZCBmb3IgYWxsXG4gICAgLy8gZXZlbnRzIChpbmNsdWRpbmcgb3V0cHV0cykuXG4gICAgaWYgKGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSkge1xuICAgICAgLy8gVGhlcmUgbWlnaHQgYmUgY2FzZXMgd2hlcmUgbXVsdGlwbGUgZGlyZWN0aXZlcyBvbiB0aGUgc2FtZSBlbGVtZW50IHRyeSB0byByZWdpc3RlciBhbiBldmVudFxuICAgICAgLy8gaGFuZGxlciBmdW5jdGlvbiBmb3IgdGhlIHNhbWUgZXZlbnQuIEluIHRoaXMgc2l0dWF0aW9uIHdlIHdhbnQgdG8gYXZvaWQgcmVnaXN0cmF0aW9uIG9mXG4gICAgICAvLyBzZXZlcmFsIG5hdGl2ZSBsaXN0ZW5lcnMgYXMgZWFjaCByZWdpc3RyYXRpb24gd291bGQgYmUgaW50ZXJjZXB0ZWQgYnkgTmdab25lIGFuZFxuICAgICAgLy8gdHJpZ2dlciBjaGFuZ2UgZGV0ZWN0aW9uLiBUaGlzIHdvdWxkIG1lYW4gdGhhdCBhIHNpbmdsZSB1c2VyIGFjdGlvbiB3b3VsZCByZXN1bHQgaW4gc2V2ZXJhbFxuICAgICAgLy8gY2hhbmdlIGRldGVjdGlvbnMgYmVpbmcgaW52b2tlZC4gVG8gYXZvaWQgdGhpcyBzaXR1YXRpb24gd2Ugd2FudCB0byBoYXZlIG9ubHkgb25lIGNhbGwgdG9cbiAgICAgIC8vIG5hdGl2ZSBoYW5kbGVyIHJlZ2lzdHJhdGlvbiAoZm9yIHRoZSBzYW1lIGVsZW1lbnQgYW5kIHNhbWUgdHlwZSBvZiBldmVudCkuXG4gICAgICAvL1xuICAgICAgLy8gSW4gb3JkZXIgdG8gaGF2ZSBqdXN0IG9uZSBuYXRpdmUgZXZlbnQgaGFuZGxlciBpbiBwcmVzZW5jZSBvZiBtdWx0aXBsZSBoYW5kbGVyIGZ1bmN0aW9ucyxcbiAgICAgIC8vIHdlIGp1c3QgcmVnaXN0ZXIgYSBmaXJzdCBoYW5kbGVyIGZ1bmN0aW9uIGFzIGEgbmF0aXZlIGV2ZW50IGxpc3RlbmVyIGFuZCB0aGVuIGNoYWluXG4gICAgICAvLyAoY29hbGVzY2UpIG90aGVyIGhhbmRsZXIgZnVuY3Rpb25zIG9uIHRvcCBvZiB0aGUgZmlyc3QgbmF0aXZlIGhhbmRsZXIgZnVuY3Rpb24uXG4gICAgICBsZXQgZXhpc3RpbmdMaXN0ZW5lciA9IG51bGw7XG4gICAgICAvLyBQbGVhc2Ugbm90ZSB0aGF0IHRoZSBjb2FsZXNjaW5nIGRlc2NyaWJlZCBoZXJlIGRvZXNuJ3QgaGFwcGVuIGZvciBldmVudHMgc3BlY2lmeWluZyBhblxuICAgICAgLy8gYWx0ZXJuYXRpdmUgdGFyZ2V0IChleC4gKGRvY3VtZW50OmNsaWNrKSkgLSB0aGlzIGlzIHRvIGtlZXAgYmFja3dhcmQgY29tcGF0aWJpbGl0eSB3aXRoIHRoZVxuICAgICAgLy8gdmlldyBlbmdpbmUuXG4gICAgICAvLyBBbHNvLCB3ZSBkb24ndCBoYXZlIHRvIHNlYXJjaCBmb3IgZXhpc3RpbmcgbGlzdGVuZXJzIGlzIHRoZXJlIGFyZSBubyBkaXJlY3RpdmVzXG4gICAgICAvLyBtYXRjaGluZyBvbiBhIGdpdmVuIG5vZGUgYXMgd2UgY2FuJ3QgcmVnaXN0ZXIgbXVsdGlwbGUgZXZlbnQgaGFuZGxlcnMgZm9yIHRoZSBzYW1lIGV2ZW50IGluXG4gICAgICAvLyBhIHRlbXBsYXRlICh0aGlzIHdvdWxkIG1lYW4gaGF2aW5nIGR1cGxpY2F0ZSBhdHRyaWJ1dGVzKS5cbiAgICAgIGlmICghZXZlbnRUYXJnZXRSZXNvbHZlciAmJiBpc1ROb2RlRGlyZWN0aXZlSG9zdCkge1xuICAgICAgICBleGlzdGluZ0xpc3RlbmVyID0gZmluZEV4aXN0aW5nTGlzdGVuZXIobFZpZXcsIGV2ZW50TmFtZSwgdE5vZGUuaW5kZXgpO1xuICAgICAgfVxuICAgICAgaWYgKGV4aXN0aW5nTGlzdGVuZXIgIT09IG51bGwpIHtcbiAgICAgICAgLy8gQXR0YWNoIGEgbmV3IGxpc3RlbmVyIHRvIGNvYWxlc2NlZCBsaXN0ZW5lcnMgbGlzdCwgbWFpbnRhaW5pbmcgdGhlIG9yZGVyIGluIHdoaWNoXG4gICAgICAgIC8vIGxpc3RlbmVycyBhcmUgcmVnaXN0ZXJlZC4gRm9yIHBlcmZvcm1hbmNlIHJlYXNvbnMsIHdlIGtlZXAgYSByZWZlcmVuY2UgdG8gdGhlIGxhc3RcbiAgICAgICAgLy8gbGlzdGVuZXIgaW4gdGhhdCBsaXN0IChpbiBgX19uZ0xhc3RMaXN0ZW5lckZuX19gIGZpZWxkKSwgc28gd2UgY2FuIGF2b2lkIGdvaW5nIHRocm91Z2hcbiAgICAgICAgLy8gdGhlIGVudGlyZSBzZXQgZWFjaCB0aW1lIHdlIG5lZWQgdG8gYWRkIGEgbmV3IGxpc3RlbmVyLlxuICAgICAgICBjb25zdCBsYXN0TGlzdGVuZXJGbiA9ICg8YW55PmV4aXN0aW5nTGlzdGVuZXIpLl9fbmdMYXN0TGlzdGVuZXJGbl9fIHx8IGV4aXN0aW5nTGlzdGVuZXI7XG4gICAgICAgIGxhc3RMaXN0ZW5lckZuLl9fbmdOZXh0TGlzdGVuZXJGbl9fID0gbGlzdGVuZXJGbjtcbiAgICAgICAgKDxhbnk+ZXhpc3RpbmdMaXN0ZW5lcikuX19uZ0xhc3RMaXN0ZW5lckZuX18gPSBsaXN0ZW5lckZuO1xuICAgICAgICBwcm9jZXNzT3V0cHV0cyA9IGZhbHNlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gVGhlIGZpcnN0IGFyZ3VtZW50IG9mIGBsaXN0ZW5gIGZ1bmN0aW9uIGluIFByb2NlZHVyYWwgUmVuZGVyZXIgaXM6XG4gICAgICAgIC8vIC0gZWl0aGVyIGEgdGFyZ2V0IG5hbWUgKGFzIGEgc3RyaW5nKSBpbiBjYXNlIG9mIGdsb2JhbCB0YXJnZXQgKHdpbmRvdywgZG9jdW1lbnQsIGJvZHkpXG4gICAgICAgIC8vIC0gb3IgZWxlbWVudCByZWZlcmVuY2UgKGluIGFsbCBvdGhlciBjYXNlcylcbiAgICAgICAgbGlzdGVuZXJGbiA9IHdyYXBMaXN0ZW5lcih0Tm9kZSwgbFZpZXcsIGxpc3RlbmVyRm4sIGZhbHNlIC8qKiBwcmV2ZW50RGVmYXVsdCAqLyk7XG4gICAgICAgIGNvbnN0IGNsZWFudXBGbiA9IHJlbmRlcmVyLmxpc3RlbihyZXNvbHZlZC5uYW1lIHx8IHRhcmdldCwgZXZlbnROYW1lLCBsaXN0ZW5lckZuKTtcbiAgICAgICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlckFkZEV2ZW50TGlzdGVuZXIrKztcblxuICAgICAgICBsQ2xlYW51cC5wdXNoKGxpc3RlbmVyRm4sIGNsZWFudXBGbik7XG4gICAgICAgIHRDbGVhbnVwICYmIHRDbGVhbnVwLnB1c2goZXZlbnROYW1lLCBpZHhPclRhcmdldEdldHRlciwgbENsZWFudXBJbmRleCwgbENsZWFudXBJbmRleCArIDEpO1xuICAgICAgfVxuXG4gICAgfSBlbHNlIHtcbiAgICAgIGxpc3RlbmVyRm4gPSB3cmFwTGlzdGVuZXIodE5vZGUsIGxWaWV3LCBsaXN0ZW5lckZuLCB0cnVlIC8qKiBwcmV2ZW50RGVmYXVsdCAqLyk7XG4gICAgICB0YXJnZXQuYWRkRXZlbnRMaXN0ZW5lcihldmVudE5hbWUsIGxpc3RlbmVyRm4sIHVzZUNhcHR1cmUpO1xuICAgICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlckFkZEV2ZW50TGlzdGVuZXIrKztcblxuICAgICAgbENsZWFudXAucHVzaChsaXN0ZW5lckZuKTtcbiAgICAgIHRDbGVhbnVwICYmIHRDbGVhbnVwLnB1c2goZXZlbnROYW1lLCBpZHhPclRhcmdldEdldHRlciwgbENsZWFudXBJbmRleCwgdXNlQ2FwdHVyZSk7XG4gICAgfVxuICB9XG5cbiAgLy8gc3Vic2NyaWJlIHRvIGRpcmVjdGl2ZSBvdXRwdXRzXG4gIGNvbnN0IG91dHB1dHMgPSB0Tm9kZS5vdXRwdXRzO1xuICBsZXQgcHJvcHM6IFByb3BlcnR5QWxpYXNWYWx1ZXx1bmRlZmluZWQ7XG4gIGlmIChwcm9jZXNzT3V0cHV0cyAmJiBvdXRwdXRzICE9PSBudWxsICYmIChwcm9wcyA9IG91dHB1dHNbZXZlbnROYW1lXSkpIHtcbiAgICBjb25zdCBwcm9wc0xlbmd0aCA9IHByb3BzLmxlbmd0aDtcbiAgICBpZiAocHJvcHNMZW5ndGgpIHtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcHJvcHNMZW5ndGg7IGkgKz0gMikge1xuICAgICAgICBjb25zdCBpbmRleCA9IHByb3BzW2ldIGFzIG51bWJlcjtcbiAgICAgICAgbmdEZXZNb2RlICYmIGFzc2VydERhdGFJblJhbmdlKGxWaWV3LCBpbmRleCk7XG4gICAgICAgIGNvbnN0IG1pbmlmaWVkTmFtZSA9IHByb3BzW2kgKyAxXTtcbiAgICAgICAgY29uc3QgZGlyZWN0aXZlSW5zdGFuY2UgPSBsVmlld1tpbmRleF07XG4gICAgICAgIGNvbnN0IG91dHB1dCA9IGRpcmVjdGl2ZUluc3RhbmNlW21pbmlmaWVkTmFtZV07XG5cbiAgICAgICAgaWYgKG5nRGV2TW9kZSAmJiAhaXNPYnNlcnZhYmxlKG91dHB1dCkpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgICAgIGBAT3V0cHV0ICR7bWluaWZpZWROYW1lfSBub3QgaW5pdGlhbGl6ZWQgaW4gJyR7ZGlyZWN0aXZlSW5zdGFuY2UuY29uc3RydWN0b3IubmFtZX0nLmApO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3Qgc3Vic2NyaXB0aW9uID0gb3V0cHV0LnN1YnNjcmliZShsaXN0ZW5lckZuKTtcbiAgICAgICAgY29uc3QgaWR4ID0gbENsZWFudXAubGVuZ3RoO1xuICAgICAgICBsQ2xlYW51cC5wdXNoKGxpc3RlbmVyRm4sIHN1YnNjcmlwdGlvbik7XG4gICAgICAgIHRDbGVhbnVwICYmIHRDbGVhbnVwLnB1c2goZXZlbnROYW1lLCB0Tm9kZS5pbmRleCwgaWR4LCAtKGlkeCArIDEpKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gZXhlY3V0ZUxpc3RlbmVyV2l0aEVycm9ySGFuZGxpbmcoXG4gICAgbFZpZXc6IExWaWV3LCBsaXN0ZW5lckZuOiAoZT86IGFueSkgPT4gYW55LCBlOiBhbnkpOiBib29sZWFuIHtcbiAgdHJ5IHtcbiAgICAvLyBPbmx5IGV4cGxpY2l0bHkgcmV0dXJuaW5nIGZhbHNlIGZyb20gYSBsaXN0ZW5lciBzaG91bGQgcHJldmVudERlZmF1bHRcbiAgICByZXR1cm4gbGlzdGVuZXJGbihlKSAhPT0gZmFsc2U7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgaGFuZGxlRXJyb3IobFZpZXcsIGVycm9yKTtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbn1cblxuLyoqXG4gKiBXcmFwcyBhbiBldmVudCBsaXN0ZW5lciB3aXRoIGEgZnVuY3Rpb24gdGhhdCBtYXJrcyBhbmNlc3RvcnMgZGlydHkgYW5kIHByZXZlbnRzIGRlZmF1bHQgYmVoYXZpb3IsXG4gKiBpZiBhcHBsaWNhYmxlLlxuICpcbiAqIEBwYXJhbSB0Tm9kZSBUaGUgVE5vZGUgYXNzb2NpYXRlZCB3aXRoIHRoaXMgbGlzdGVuZXJcbiAqIEBwYXJhbSBsVmlldyBUaGUgTFZpZXcgdGhhdCBjb250YWlucyB0aGlzIGxpc3RlbmVyXG4gKiBAcGFyYW0gbGlzdGVuZXJGbiBUaGUgbGlzdGVuZXIgZnVuY3Rpb24gdG8gY2FsbFxuICogQHBhcmFtIHdyYXBXaXRoUHJldmVudERlZmF1bHQgV2hldGhlciBvciBub3QgdG8gcHJldmVudCBkZWZhdWx0IGJlaGF2aW9yXG4gKiAodGhlIHByb2NlZHVyYWwgcmVuZGVyZXIgZG9lcyB0aGlzIGFscmVhZHksIHNvIGluIHRob3NlIGNhc2VzLCB3ZSBzaG91bGQgc2tpcClcbiAqL1xuZnVuY3Rpb24gd3JhcExpc3RlbmVyKFxuICAgIHROb2RlOiBUTm9kZSwgbFZpZXc6IExWaWV3LCBsaXN0ZW5lckZuOiAoZT86IGFueSkgPT4gYW55LFxuICAgIHdyYXBXaXRoUHJldmVudERlZmF1bHQ6IGJvb2xlYW4pOiBFdmVudExpc3RlbmVyIHtcbiAgLy8gTm90ZTogd2UgYXJlIHBlcmZvcm1pbmcgbW9zdCBvZiB0aGUgd29yayBpbiB0aGUgbGlzdGVuZXIgZnVuY3Rpb24gaXRzZWxmXG4gIC8vIHRvIG9wdGltaXplIGxpc3RlbmVyIHJlZ2lzdHJhdGlvbi5cbiAgcmV0dXJuIGZ1bmN0aW9uIHdyYXBMaXN0ZW5lckluX21hcmtEaXJ0eUFuZFByZXZlbnREZWZhdWx0KGU6IGFueSkge1xuICAgIC8vIEl2eSB1c2VzIGBGdW5jdGlvbmAgYXMgYSBzcGVjaWFsIHRva2VuIHRoYXQgYWxsb3dzIHVzIHRvIHVud3JhcCB0aGUgZnVuY3Rpb25cbiAgICAvLyBzbyB0aGF0IGl0IGNhbiBiZSBpbnZva2VkIHByb2dyYW1tYXRpY2FsbHkgYnkgYERlYnVnTm9kZS50cmlnZ2VyRXZlbnRIYW5kbGVyYC5cbiAgICBpZiAoZSA9PT0gRnVuY3Rpb24pIHtcbiAgICAgIHJldHVybiBsaXN0ZW5lckZuO1xuICAgIH1cblxuICAgIC8vIEluIG9yZGVyIHRvIGJlIGJhY2t3YXJkcyBjb21wYXRpYmxlIHdpdGggVmlldyBFbmdpbmUsIGV2ZW50cyBvbiBjb21wb25lbnQgaG9zdCBub2Rlc1xuICAgIC8vIG11c3QgYWxzbyBtYXJrIHRoZSBjb21wb25lbnQgdmlldyBpdHNlbGYgZGlydHkgKGkuZS4gdGhlIHZpZXcgdGhhdCBpdCBvd25zKS5cbiAgICBjb25zdCBzdGFydFZpZXcgPSB0Tm9kZS5mbGFncyAmIFROb2RlRmxhZ3MuaXNDb21wb25lbnRIb3N0ID9cbiAgICAgICAgZ2V0Q29tcG9uZW50TFZpZXdCeUluZGV4KHROb2RlLmluZGV4LCBsVmlldykgOlxuICAgICAgICBsVmlldztcblxuICAgIC8vIFNlZSBpbnRlcmZhY2VzL3ZpZXcudHMgZm9yIG1vcmUgb24gTFZpZXdGbGFncy5NYW51YWxPblB1c2hcbiAgICBpZiAoKGxWaWV3W0ZMQUdTXSAmIExWaWV3RmxhZ3MuTWFudWFsT25QdXNoKSA9PT0gMCkge1xuICAgICAgbWFya1ZpZXdEaXJ0eShzdGFydFZpZXcpO1xuICAgIH1cblxuICAgIGxldCByZXN1bHQgPSBleGVjdXRlTGlzdGVuZXJXaXRoRXJyb3JIYW5kbGluZyhsVmlldywgbGlzdGVuZXJGbiwgZSk7XG4gICAgLy8gQSBqdXN0LWludm9rZWQgbGlzdGVuZXIgZnVuY3Rpb24gbWlnaHQgaGF2ZSBjb2FsZXNjZWQgbGlzdGVuZXJzIHNvIHdlIG5lZWQgdG8gY2hlY2sgZm9yXG4gICAgLy8gdGhlaXIgcHJlc2VuY2UgYW5kIGludm9rZSBhcyBuZWVkZWQuXG4gICAgbGV0IG5leHRMaXN0ZW5lckZuID0gKDxhbnk+d3JhcExpc3RlbmVySW5fbWFya0RpcnR5QW5kUHJldmVudERlZmF1bHQpLl9fbmdOZXh0TGlzdGVuZXJGbl9fO1xuICAgIHdoaWxlIChuZXh0TGlzdGVuZXJGbikge1xuICAgICAgLy8gV2Ugc2hvdWxkIHByZXZlbnQgZGVmYXVsdCBpZiBhbnkgb2YgdGhlIGxpc3RlbmVycyBleHBsaWNpdGx5IHJldHVybiBmYWxzZVxuICAgICAgcmVzdWx0ID0gZXhlY3V0ZUxpc3RlbmVyV2l0aEVycm9ySGFuZGxpbmcobFZpZXcsIG5leHRMaXN0ZW5lckZuLCBlKSAmJiByZXN1bHQ7XG4gICAgICBuZXh0TGlzdGVuZXJGbiA9ICg8YW55Pm5leHRMaXN0ZW5lckZuKS5fX25nTmV4dExpc3RlbmVyRm5fXztcbiAgICB9XG5cbiAgICBpZiAod3JhcFdpdGhQcmV2ZW50RGVmYXVsdCAmJiByZXN1bHQgPT09IGZhbHNlKSB7XG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAvLyBOZWNlc3NhcnkgZm9yIGxlZ2FjeSBicm93c2VycyB0aGF0IGRvbid0IHN1cHBvcnQgcHJldmVudERlZmF1bHQgKGUuZy4gSUUpXG4gICAgICBlLnJldHVyblZhbHVlID0gZmFsc2U7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfTtcbn1cbiJdfQ==