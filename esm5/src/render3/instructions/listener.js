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
    return ɵɵlistener;
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
    return ɵɵcomponentHostSyntheticListener;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGlzdGVuZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2luc3RydWN0aW9ucy9saXN0ZW5lci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFHSCxPQUFPLEVBQUMsaUJBQWlCLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUNwRCxPQUFPLEVBQUMsWUFBWSxFQUFDLE1BQU0saUJBQWlCLENBQUM7QUFDN0MsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUVuQyxPQUFPLEVBQTRDLG9CQUFvQixFQUFDLE1BQU0sd0JBQXdCLENBQUM7QUFDdkcsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLDJCQUEyQixDQUFDO0FBQzFELE9BQU8sRUFBQyxPQUFPLEVBQUUsS0FBSyxFQUFxQixRQUFRLEVBQUUsS0FBSyxFQUFDLE1BQU0sb0JBQW9CLENBQUM7QUFDdEYsT0FBTyxFQUFDLHlCQUF5QixFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFDekQsT0FBTyxFQUFDLFFBQVEsRUFBRSx3QkFBd0IsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUM1RCxPQUFPLEVBQUMsd0JBQXdCLEVBQUUsZ0JBQWdCLEVBQUUsV0FBVyxFQUFDLE1BQU0sb0JBQW9CLENBQUM7QUFFM0YsT0FBTyxFQUFDLFVBQVUsRUFBRSxXQUFXLEVBQUUscUJBQXFCLEVBQUUsYUFBYSxFQUFDLE1BQU0sVUFBVSxDQUFDO0FBSXZGOzs7Ozs7Ozs7Ozs7O0dBYUc7QUFDSCxNQUFNLFVBQVUsVUFBVSxDQUN0QixTQUFpQixFQUFFLFVBQTRCLEVBQUUsVUFBa0IsRUFDbkUsbUJBQTBDO0lBRE8sMkJBQUEsRUFBQSxrQkFBa0I7SUFFckUsSUFBTSxLQUFLLEdBQUcsUUFBUSxFQUFFLENBQUM7SUFDekIsSUFBTSxLQUFLLEdBQUcsd0JBQXdCLEVBQUUsQ0FB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QyxLQUFLLENBQUMsS0FBSyxDQUFDLHdCQUEwQixDQUFDLEtBQUssQ0FBQyxFQUFFO1lBQ2xELGFBQWEsQ0FBQyxTQUFTLENBQUMsQ0FBQztTQUMxQjtRQUVELElBQUksTUFBTSxHQUFHLGdDQUFnQyxDQUFDLEtBQUssRUFBRSxVQUFVLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDcEUsMEZBQTBGO1FBQzFGLHVDQUF1QztRQUN2QyxJQUFJLGNBQWMsR0FBUyx5Q0FBMEMsQ0FBQyxvQkFBb0IsQ0FBQztRQUMzRixPQUFPLGNBQWMsRUFBRTtZQUNyQiw0RUFBNEU7WUFDNUUsTUFBTSxHQUFHLGdDQUFnQyxDQUFDLEtBQUssRUFBRSxjQUFjLEVBQUUsQ0FBQyxDQUFDLElBQUksTUFBTSxDQUFDO1lBQzlFLGNBQWMsR0FBUyxjQUFlLENBQUMsb0JBQW9CLENBQUM7U0FDN0Q7UUFFRCxJQUFJLHNCQUFzQixJQUFJLE1BQU0sS0FBSyxLQUFLLEVBQUU7WUFDOUMsQ0FBQyxDQUFDLGNBQWMsRUFBRSxDQUFDO1lBQ25CLDRFQUE0RTtZQUM1RSxDQUFDLENBQUMsV0FBVyxHQUFHLEtBQUssQ0FBQztTQUN2QjtRQUVELE9BQU8sTUFBTSxDQUFDO0lBQ2hCLENBQUMsQ0FBQztBQUNKLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cblxuaW1wb3J0IHthc3NlcnREYXRhSW5SYW5nZX0gZnJvbSAnLi4vLi4vdXRpbC9hc3NlcnQnO1xuaW1wb3J0IHtpc09ic2VydmFibGV9IGZyb20gJy4uLy4uL3V0aWwvbGFuZyc7XG5pbXBvcnQge0VNUFRZX09CSn0gZnJvbSAnLi4vZW1wdHknO1xuaW1wb3J0IHtQcm9wZXJ0eUFsaWFzVmFsdWUsIFROb2RlLCBUTm9kZUZsYWdzLCBUTm9kZVR5cGV9IGZyb20gJy4uL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge0dsb2JhbFRhcmdldFJlc29sdmVyLCBSRWxlbWVudCwgUmVuZGVyZXIzLCBpc1Byb2NlZHVyYWxSZW5kZXJlcn0gZnJvbSAnLi4vaW50ZXJmYWNlcy9yZW5kZXJlcic7XG5pbXBvcnQge2lzRGlyZWN0aXZlSG9zdH0gZnJvbSAnLi4vaW50ZXJmYWNlcy90eXBlX2NoZWNrcyc7XG5pbXBvcnQge0NMRUFOVVAsIEZMQUdTLCBMVmlldywgTFZpZXdGbGFncywgUkVOREVSRVIsIFRWSUVXfSBmcm9tICcuLi9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHthc3NlcnROb2RlT2ZQb3NzaWJsZVR5cGVzfSBmcm9tICcuLi9ub2RlX2Fzc2VydCc7XG5pbXBvcnQge2dldExWaWV3LCBnZXRQcmV2aW91c09yUGFyZW50VE5vZGV9IGZyb20gJy4uL3N0YXRlJztcbmltcG9ydCB7Z2V0Q29tcG9uZW50TFZpZXdCeUluZGV4LCBnZXROYXRpdmVCeVROb2RlLCB1bndyYXBSTm9kZX0gZnJvbSAnLi4vdXRpbC92aWV3X3V0aWxzJztcblxuaW1wb3J0IHtnZXRDbGVhbnVwLCBoYW5kbGVFcnJvciwgbG9hZENvbXBvbmVudFJlbmRlcmVyLCBtYXJrVmlld0RpcnR5fSBmcm9tICcuL3NoYXJlZCc7XG5cblxuXG4vKipcbiAqIEFkZHMgYW4gZXZlbnQgbGlzdGVuZXIgdG8gdGhlIGN1cnJlbnQgbm9kZS5cbiAqXG4gKiBJZiBhbiBvdXRwdXQgZXhpc3RzIG9uIG9uZSBvZiB0aGUgbm9kZSdzIGRpcmVjdGl2ZXMsIGl0IGFsc28gc3Vic2NyaWJlcyB0byB0aGUgb3V0cHV0XG4gKiBhbmQgc2F2ZXMgdGhlIHN1YnNjcmlwdGlvbiBmb3IgbGF0ZXIgY2xlYW51cC5cbiAqXG4gKiBAcGFyYW0gZXZlbnROYW1lIE5hbWUgb2YgdGhlIGV2ZW50XG4gKiBAcGFyYW0gbGlzdGVuZXJGbiBUaGUgZnVuY3Rpb24gdG8gYmUgY2FsbGVkIHdoZW4gZXZlbnQgZW1pdHNcbiAqIEBwYXJhbSB1c2VDYXB0dXJlIFdoZXRoZXIgb3Igbm90IHRvIHVzZSBjYXB0dXJlIGluIGV2ZW50IGxpc3RlbmVyXG4gKiBAcGFyYW0gZXZlbnRUYXJnZXRSZXNvbHZlciBGdW5jdGlvbiB0aGF0IHJldHVybnMgZ2xvYmFsIHRhcmdldCBpbmZvcm1hdGlvbiBpbiBjYXNlIHRoaXMgbGlzdGVuZXJcbiAqIHNob3VsZCBiZSBhdHRhY2hlZCB0byBhIGdsb2JhbCBvYmplY3QgbGlrZSB3aW5kb3csIGRvY3VtZW50IG9yIGJvZHlcbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWxpc3RlbmVyKFxuICAgIGV2ZW50TmFtZTogc3RyaW5nLCBsaXN0ZW5lckZuOiAoZT86IGFueSkgPT4gYW55LCB1c2VDYXB0dXJlID0gZmFsc2UsXG4gICAgZXZlbnRUYXJnZXRSZXNvbHZlcj86IEdsb2JhbFRhcmdldFJlc29sdmVyKTogdHlwZW9mIMm1ybVsaXN0ZW5lciB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgdE5vZGUgPSBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKTtcbiAgbGlzdGVuZXJJbnRlcm5hbChcbiAgICAgIGxWaWV3LCBsVmlld1tSRU5ERVJFUl0sIHROb2RlLCBldmVudE5hbWUsIGxpc3RlbmVyRm4sIHVzZUNhcHR1cmUsIGV2ZW50VGFyZ2V0UmVzb2x2ZXIpO1xuICByZXR1cm4gybXJtWxpc3RlbmVyO1xufVxuXG4vKipcbiogUmVnaXN0ZXJzIGEgc3ludGhldGljIGhvc3QgbGlzdGVuZXIgKGUuZy4gYChAZm9vLnN0YXJ0KWApIG9uIGEgY29tcG9uZW50LlxuKlxuKiBUaGlzIGluc3RydWN0aW9uIGlzIGZvciBjb21wYXRpYmlsaXR5IHB1cnBvc2VzIGFuZCBpcyBkZXNpZ25lZCB0byBlbnN1cmUgdGhhdCBhXG4qIHN5bnRoZXRpYyBob3N0IGxpc3RlbmVyIChlLmcuIGBASG9zdExpc3RlbmVyKCdAZm9vLnN0YXJ0JylgKSBwcm9wZXJseSBnZXRzIHJlbmRlcmVkXG4qIGluIHRoZSBjb21wb25lbnQncyByZW5kZXJlci4gTm9ybWFsbHkgYWxsIGhvc3QgbGlzdGVuZXJzIGFyZSBldmFsdWF0ZWQgd2l0aCB0aGVcbiogcGFyZW50IGNvbXBvbmVudCdzIHJlbmRlcmVyLCBidXQsIGluIHRoZSBjYXNlIG9mIGFuaW1hdGlvbiBAdHJpZ2dlcnMsIHRoZXkgbmVlZFxuKiB0byBiZSBldmFsdWF0ZWQgd2l0aCB0aGUgc3ViIGNvbXBvbmVudCdzIHJlbmRlcmVyIChiZWNhdXNlIHRoYXQncyB3aGVyZSB0aGVcbiogYW5pbWF0aW9uIHRyaWdnZXJzIGFyZSBkZWZpbmVkKS5cbipcbiogRG8gbm90IHVzZSB0aGlzIGluc3RydWN0aW9uIGFzIGEgcmVwbGFjZW1lbnQgZm9yIGBsaXN0ZW5lcmAuIFRoaXMgaW5zdHJ1Y3Rpb25cbiogb25seSBleGlzdHMgdG8gZW5zdXJlIGNvbXBhdGliaWxpdHkgd2l0aCB0aGUgVmlld0VuZ2luZSdzIGhvc3QgYmluZGluZyBiZWhhdmlvci5cbipcbiogQHBhcmFtIGV2ZW50TmFtZSBOYW1lIG9mIHRoZSBldmVudFxuKiBAcGFyYW0gbGlzdGVuZXJGbiBUaGUgZnVuY3Rpb24gdG8gYmUgY2FsbGVkIHdoZW4gZXZlbnQgZW1pdHNcbiogQHBhcmFtIHVzZUNhcHR1cmUgV2hldGhlciBvciBub3QgdG8gdXNlIGNhcHR1cmUgaW4gZXZlbnQgbGlzdGVuZXJcbiogQHBhcmFtIGV2ZW50VGFyZ2V0UmVzb2x2ZXIgRnVuY3Rpb24gdGhhdCByZXR1cm5zIGdsb2JhbCB0YXJnZXQgaW5mb3JtYXRpb24gaW4gY2FzZSB0aGlzIGxpc3RlbmVyXG4qIHNob3VsZCBiZSBhdHRhY2hlZCB0byBhIGdsb2JhbCBvYmplY3QgbGlrZSB3aW5kb3csIGRvY3VtZW50IG9yIGJvZHlcbiAqXG4gKiBAY29kZUdlbkFwaVxuKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1Y29tcG9uZW50SG9zdFN5bnRoZXRpY0xpc3RlbmVyKFxuICAgIGV2ZW50TmFtZTogc3RyaW5nLCBsaXN0ZW5lckZuOiAoZT86IGFueSkgPT4gYW55LCB1c2VDYXB0dXJlID0gZmFsc2UsXG4gICAgZXZlbnRUYXJnZXRSZXNvbHZlcj86IEdsb2JhbFRhcmdldFJlc29sdmVyKTogdHlwZW9mIMm1ybVjb21wb25lbnRIb3N0U3ludGhldGljTGlzdGVuZXIge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IHROb2RlID0gZ2V0UHJldmlvdXNPclBhcmVudFROb2RlKCk7XG4gIGNvbnN0IHJlbmRlcmVyID0gbG9hZENvbXBvbmVudFJlbmRlcmVyKHROb2RlLCBsVmlldyk7XG4gIGxpc3RlbmVySW50ZXJuYWwobFZpZXcsIHJlbmRlcmVyLCB0Tm9kZSwgZXZlbnROYW1lLCBsaXN0ZW5lckZuLCB1c2VDYXB0dXJlLCBldmVudFRhcmdldFJlc29sdmVyKTtcbiAgcmV0dXJuIMm1ybVjb21wb25lbnRIb3N0U3ludGhldGljTGlzdGVuZXI7XG59XG5cbi8qKlxuICogQSB1dGlsaXR5IGZ1bmN0aW9uIHRoYXQgY2hlY2tzIGlmIGEgZ2l2ZW4gZWxlbWVudCBoYXMgYWxyZWFkeSBhbiBldmVudCBoYW5kbGVyIHJlZ2lzdGVyZWQgZm9yIGFuXG4gKiBldmVudCB3aXRoIGEgc3BlY2lmaWVkIG5hbWUuIFRoZSBUVmlldy5jbGVhbnVwIGRhdGEgc3RydWN0dXJlIGlzIHVzZWQgdG8gZmluZCBvdXQgd2hpY2ggZXZlbnRzXG4gKiBhcmUgcmVnaXN0ZXJlZCBmb3IgYSBnaXZlbiBlbGVtZW50LlxuICovXG5mdW5jdGlvbiBmaW5kRXhpc3RpbmdMaXN0ZW5lcihcbiAgICBsVmlldzogTFZpZXcsIGV2ZW50TmFtZTogc3RyaW5nLCB0Tm9kZUlkeDogbnVtYmVyKTogKChlPzogYW55KSA9PiBhbnkpfG51bGwge1xuICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgY29uc3QgdENsZWFudXAgPSB0Vmlldy5jbGVhbnVwO1xuICBpZiAodENsZWFudXAgIT0gbnVsbCkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdENsZWFudXAubGVuZ3RoIC0gMTsgaSArPSAyKSB7XG4gICAgICBjb25zdCBjbGVhbnVwRXZlbnROYW1lID0gdENsZWFudXBbaV07XG4gICAgICBpZiAoY2xlYW51cEV2ZW50TmFtZSA9PT0gZXZlbnROYW1lICYmIHRDbGVhbnVwW2kgKyAxXSA9PT0gdE5vZGVJZHgpIHtcbiAgICAgICAgLy8gV2UgaGF2ZSBmb3VuZCBhIG1hdGNoaW5nIGV2ZW50IG5hbWUgb24gdGhlIHNhbWUgbm9kZSBidXQgaXQgbWlnaHQgbm90IGhhdmUgYmVlblxuICAgICAgICAvLyByZWdpc3RlcmVkIHlldCwgc28gd2UgbXVzdCBleHBsaWNpdGx5IHZlcmlmeSBlbnRyaWVzIGluIHRoZSBMVmlldyBjbGVhbnVwIGRhdGFcbiAgICAgICAgLy8gc3RydWN0dXJlcy5cbiAgICAgICAgY29uc3QgbENsZWFudXAgPSBsVmlld1tDTEVBTlVQXSAhO1xuICAgICAgICBjb25zdCBsaXN0ZW5lcklkeEluTENsZWFudXAgPSB0Q2xlYW51cFtpICsgMl07XG4gICAgICAgIHJldHVybiBsQ2xlYW51cC5sZW5ndGggPiBsaXN0ZW5lcklkeEluTENsZWFudXAgPyBsQ2xlYW51cFtsaXN0ZW5lcklkeEluTENsZWFudXBdIDogbnVsbDtcbiAgICAgIH1cbiAgICAgIC8vIFRWaWV3LmNsZWFudXAgY2FuIGhhdmUgYSBtaXggb2YgNC1lbGVtZW50cyBlbnRyaWVzIChmb3IgZXZlbnQgaGFuZGxlciBjbGVhbnVwcykgb3JcbiAgICAgIC8vIDItZWxlbWVudCBlbnRyaWVzIChmb3IgZGlyZWN0aXZlIGFuZCBxdWVyaWVzIGRlc3Ryb3kgaG9va3MpLiBBcyBzdWNoIHdlIGNhbiBlbmNvdW50ZXJcbiAgICAgIC8vIGJsb2NrcyBvZiA0IG9yIDIgaXRlbXMgaW4gdGhlIHRWaWV3LmNsZWFudXAgYW5kIHRoaXMgaXMgd2h5IHdlIGl0ZXJhdGUgb3ZlciAyIGVsZW1lbnRzXG4gICAgICAvLyBmaXJzdCBhbmQganVtcCBhbm90aGVyIDIgZWxlbWVudHMgaWYgd2UgZGV0ZWN0IGxpc3RlbmVycyBjbGVhbnVwICg0IGVsZW1lbnRzKS4gQWxzbyBjaGVja1xuICAgICAgLy8gZG9jdW1lbnRhdGlvbiBvZiBUVmlldy5jbGVhbnVwIGZvciBtb3JlIGRldGFpbHMgb2YgdGhpcyBkYXRhIHN0cnVjdHVyZSBsYXlvdXQuXG4gICAgICBpZiAodHlwZW9mIGNsZWFudXBFdmVudE5hbWUgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIGkgKz0gMjtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbmZ1bmN0aW9uIGxpc3RlbmVySW50ZXJuYWwoXG4gICAgbFZpZXc6IExWaWV3LCByZW5kZXJlcjogUmVuZGVyZXIzLCB0Tm9kZTogVE5vZGUsIGV2ZW50TmFtZTogc3RyaW5nLFxuICAgIGxpc3RlbmVyRm46IChlPzogYW55KSA9PiBhbnksIHVzZUNhcHR1cmUgPSBmYWxzZSxcbiAgICBldmVudFRhcmdldFJlc29sdmVyPzogR2xvYmFsVGFyZ2V0UmVzb2x2ZXIpOiB2b2lkIHtcbiAgY29uc3QgdFZpZXcgPSBsVmlld1tUVklFV107XG4gIGNvbnN0IGlzVE5vZGVEaXJlY3RpdmVIb3N0ID0gaXNEaXJlY3RpdmVIb3N0KHROb2RlKTtcbiAgY29uc3QgZmlyc3RDcmVhdGVQYXNzID0gdFZpZXcuZmlyc3RDcmVhdGVQYXNzO1xuICBjb25zdCB0Q2xlYW51cDogZmFsc2V8YW55W10gPSBmaXJzdENyZWF0ZVBhc3MgJiYgKHRWaWV3LmNsZWFudXAgfHwgKHRWaWV3LmNsZWFudXAgPSBbXSkpO1xuXG4gIC8vIFdoZW4gdGhlIMm1ybVsaXN0ZW5lciBpbnN0cnVjdGlvbiB3YXMgZ2VuZXJhdGVkIGFuZCBpcyBleGVjdXRlZCB3ZSBrbm93IHRoYXQgdGhlcmUgaXMgZWl0aGVyIGFcbiAgLy8gbmF0aXZlIGxpc3RlbmVyIG9yIGEgZGlyZWN0aXZlIG91dHB1dCBvbiB0aGlzIGVsZW1lbnQuIEFzIHN1Y2ggd2Ugd2Uga25vdyB0aGF0IHdlIHdpbGwgaGF2ZSB0b1xuICAvLyByZWdpc3RlciBhIGxpc3RlbmVyIGFuZCBzdG9yZSBpdHMgY2xlYW51cCBmdW5jdGlvbiBvbiBMVmlldy5cbiAgY29uc3QgbENsZWFudXAgPSBnZXRDbGVhbnVwKGxWaWV3KTtcblxuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZU9mUG9zc2libGVUeXBlcyhcbiAgICAgICAgICAgICAgICAgICB0Tm9kZSwgVE5vZGVUeXBlLkVsZW1lbnQsIFROb2RlVHlwZS5Db250YWluZXIsIFROb2RlVHlwZS5FbGVtZW50Q29udGFpbmVyKTtcblxuICBsZXQgcHJvY2Vzc091dHB1dHMgPSB0cnVlO1xuXG4gIC8vIGFkZCBuYXRpdmUgZXZlbnQgbGlzdGVuZXIgLSBhcHBsaWNhYmxlIHRvIGVsZW1lbnRzIG9ubHlcbiAgaWYgKHROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5FbGVtZW50KSB7XG4gICAgY29uc3QgbmF0aXZlID0gZ2V0TmF0aXZlQnlUTm9kZSh0Tm9kZSwgbFZpZXcpIGFzIFJFbGVtZW50O1xuICAgIGNvbnN0IHJlc29sdmVkID0gZXZlbnRUYXJnZXRSZXNvbHZlciA/IGV2ZW50VGFyZ2V0UmVzb2x2ZXIobmF0aXZlKSA6IEVNUFRZX09CSiBhcyBhbnk7XG4gICAgY29uc3QgdGFyZ2V0ID0gcmVzb2x2ZWQudGFyZ2V0IHx8IG5hdGl2ZTtcbiAgICBjb25zdCBsQ2xlYW51cEluZGV4ID0gbENsZWFudXAubGVuZ3RoO1xuICAgIGNvbnN0IGlkeE9yVGFyZ2V0R2V0dGVyID0gZXZlbnRUYXJnZXRSZXNvbHZlciA/XG4gICAgICAgIChfbFZpZXc6IExWaWV3KSA9PiBldmVudFRhcmdldFJlc29sdmVyKHVud3JhcFJOb2RlKF9sVmlld1t0Tm9kZS5pbmRleF0pKS50YXJnZXQgOlxuICAgICAgICB0Tm9kZS5pbmRleDtcblxuICAgIC8vIEluIG9yZGVyIHRvIG1hdGNoIGN1cnJlbnQgYmVoYXZpb3IsIG5hdGl2ZSBET00gZXZlbnQgbGlzdGVuZXJzIG11c3QgYmUgYWRkZWQgZm9yIGFsbFxuICAgIC8vIGV2ZW50cyAoaW5jbHVkaW5nIG91dHB1dHMpLlxuICAgIGlmIChpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikpIHtcbiAgICAgIC8vIFRoZXJlIG1pZ2h0IGJlIGNhc2VzIHdoZXJlIG11bHRpcGxlIGRpcmVjdGl2ZXMgb24gdGhlIHNhbWUgZWxlbWVudCB0cnkgdG8gcmVnaXN0ZXIgYW4gZXZlbnRcbiAgICAgIC8vIGhhbmRsZXIgZnVuY3Rpb24gZm9yIHRoZSBzYW1lIGV2ZW50LiBJbiB0aGlzIHNpdHVhdGlvbiB3ZSB3YW50IHRvIGF2b2lkIHJlZ2lzdHJhdGlvbiBvZlxuICAgICAgLy8gc2V2ZXJhbCBuYXRpdmUgbGlzdGVuZXJzIGFzIGVhY2ggcmVnaXN0cmF0aW9uIHdvdWxkIGJlIGludGVyY2VwdGVkIGJ5IE5nWm9uZSBhbmRcbiAgICAgIC8vIHRyaWdnZXIgY2hhbmdlIGRldGVjdGlvbi4gVGhpcyB3b3VsZCBtZWFuIHRoYXQgYSBzaW5nbGUgdXNlciBhY3Rpb24gd291bGQgcmVzdWx0IGluIHNldmVyYWxcbiAgICAgIC8vIGNoYW5nZSBkZXRlY3Rpb25zIGJlaW5nIGludm9rZWQuIFRvIGF2b2lkIHRoaXMgc2l0dWF0aW9uIHdlIHdhbnQgdG8gaGF2ZSBvbmx5IG9uZSBjYWxsIHRvXG4gICAgICAvLyBuYXRpdmUgaGFuZGxlciByZWdpc3RyYXRpb24gKGZvciB0aGUgc2FtZSBlbGVtZW50IGFuZCBzYW1lIHR5cGUgb2YgZXZlbnQpLlxuICAgICAgLy9cbiAgICAgIC8vIEluIG9yZGVyIHRvIGhhdmUganVzdCBvbmUgbmF0aXZlIGV2ZW50IGhhbmRsZXIgaW4gcHJlc2VuY2Ugb2YgbXVsdGlwbGUgaGFuZGxlciBmdW5jdGlvbnMsXG4gICAgICAvLyB3ZSBqdXN0IHJlZ2lzdGVyIGEgZmlyc3QgaGFuZGxlciBmdW5jdGlvbiBhcyBhIG5hdGl2ZSBldmVudCBsaXN0ZW5lciBhbmQgdGhlbiBjaGFpblxuICAgICAgLy8gKGNvYWxlc2NlKSBvdGhlciBoYW5kbGVyIGZ1bmN0aW9ucyBvbiB0b3Agb2YgdGhlIGZpcnN0IG5hdGl2ZSBoYW5kbGVyIGZ1bmN0aW9uLlxuICAgICAgbGV0IGV4aXN0aW5nTGlzdGVuZXIgPSBudWxsO1xuICAgICAgLy8gUGxlYXNlIG5vdGUgdGhhdCB0aGUgY29hbGVzY2luZyBkZXNjcmliZWQgaGVyZSBkb2Vzbid0IGhhcHBlbiBmb3IgZXZlbnRzIHNwZWNpZnlpbmcgYW5cbiAgICAgIC8vIGFsdGVybmF0aXZlIHRhcmdldCAoZXguIChkb2N1bWVudDpjbGljaykpIC0gdGhpcyBpcyB0byBrZWVwIGJhY2t3YXJkIGNvbXBhdGliaWxpdHkgd2l0aCB0aGVcbiAgICAgIC8vIHZpZXcgZW5naW5lLlxuICAgICAgLy8gQWxzbywgd2UgZG9uJ3QgaGF2ZSB0byBzZWFyY2ggZm9yIGV4aXN0aW5nIGxpc3RlbmVycyBpcyB0aGVyZSBhcmUgbm8gZGlyZWN0aXZlc1xuICAgICAgLy8gbWF0Y2hpbmcgb24gYSBnaXZlbiBub2RlIGFzIHdlIGNhbid0IHJlZ2lzdGVyIG11bHRpcGxlIGV2ZW50IGhhbmRsZXJzIGZvciB0aGUgc2FtZSBldmVudCBpblxuICAgICAgLy8gYSB0ZW1wbGF0ZSAodGhpcyB3b3VsZCBtZWFuIGhhdmluZyBkdXBsaWNhdGUgYXR0cmlidXRlcykuXG4gICAgICBpZiAoIWV2ZW50VGFyZ2V0UmVzb2x2ZXIgJiYgaXNUTm9kZURpcmVjdGl2ZUhvc3QpIHtcbiAgICAgICAgZXhpc3RpbmdMaXN0ZW5lciA9IGZpbmRFeGlzdGluZ0xpc3RlbmVyKGxWaWV3LCBldmVudE5hbWUsIHROb2RlLmluZGV4KTtcbiAgICAgIH1cbiAgICAgIGlmIChleGlzdGluZ0xpc3RlbmVyICE9PSBudWxsKSB7XG4gICAgICAgIC8vIEF0dGFjaCBhIG5ldyBsaXN0ZW5lciB0byBjb2FsZXNjZWQgbGlzdGVuZXJzIGxpc3QsIG1haW50YWluaW5nIHRoZSBvcmRlciBpbiB3aGljaFxuICAgICAgICAvLyBsaXN0ZW5lcnMgYXJlIHJlZ2lzdGVyZWQuIEZvciBwZXJmb3JtYW5jZSByZWFzb25zLCB3ZSBrZWVwIGEgcmVmZXJlbmNlIHRvIHRoZSBsYXN0XG4gICAgICAgIC8vIGxpc3RlbmVyIGluIHRoYXQgbGlzdCAoaW4gYF9fbmdMYXN0TGlzdGVuZXJGbl9fYCBmaWVsZCksIHNvIHdlIGNhbiBhdm9pZCBnb2luZyB0aHJvdWdoXG4gICAgICAgIC8vIHRoZSBlbnRpcmUgc2V0IGVhY2ggdGltZSB3ZSBuZWVkIHRvIGFkZCBhIG5ldyBsaXN0ZW5lci5cbiAgICAgICAgY29uc3QgbGFzdExpc3RlbmVyRm4gPSAoPGFueT5leGlzdGluZ0xpc3RlbmVyKS5fX25nTGFzdExpc3RlbmVyRm5fXyB8fCBleGlzdGluZ0xpc3RlbmVyO1xuICAgICAgICBsYXN0TGlzdGVuZXJGbi5fX25nTmV4dExpc3RlbmVyRm5fXyA9IGxpc3RlbmVyRm47XG4gICAgICAgICg8YW55PmV4aXN0aW5nTGlzdGVuZXIpLl9fbmdMYXN0TGlzdGVuZXJGbl9fID0gbGlzdGVuZXJGbjtcbiAgICAgICAgcHJvY2Vzc091dHB1dHMgPSBmYWxzZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIFRoZSBmaXJzdCBhcmd1bWVudCBvZiBgbGlzdGVuYCBmdW5jdGlvbiBpbiBQcm9jZWR1cmFsIFJlbmRlcmVyIGlzOlxuICAgICAgICAvLyAtIGVpdGhlciBhIHRhcmdldCBuYW1lIChhcyBhIHN0cmluZykgaW4gY2FzZSBvZiBnbG9iYWwgdGFyZ2V0ICh3aW5kb3csIGRvY3VtZW50LCBib2R5KVxuICAgICAgICAvLyAtIG9yIGVsZW1lbnQgcmVmZXJlbmNlIChpbiBhbGwgb3RoZXIgY2FzZXMpXG4gICAgICAgIGxpc3RlbmVyRm4gPSB3cmFwTGlzdGVuZXIodE5vZGUsIGxWaWV3LCBsaXN0ZW5lckZuLCBmYWxzZSAvKiogcHJldmVudERlZmF1bHQgKi8pO1xuICAgICAgICBjb25zdCBjbGVhbnVwRm4gPSByZW5kZXJlci5saXN0ZW4ocmVzb2x2ZWQubmFtZSB8fCB0YXJnZXQsIGV2ZW50TmFtZSwgbGlzdGVuZXJGbik7XG4gICAgICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJBZGRFdmVudExpc3RlbmVyKys7XG5cbiAgICAgICAgbENsZWFudXAucHVzaChsaXN0ZW5lckZuLCBjbGVhbnVwRm4pO1xuICAgICAgICB0Q2xlYW51cCAmJiB0Q2xlYW51cC5wdXNoKGV2ZW50TmFtZSwgaWR4T3JUYXJnZXRHZXR0ZXIsIGxDbGVhbnVwSW5kZXgsIGxDbGVhbnVwSW5kZXggKyAxKTtcbiAgICAgIH1cblxuICAgIH0gZWxzZSB7XG4gICAgICBsaXN0ZW5lckZuID0gd3JhcExpc3RlbmVyKHROb2RlLCBsVmlldywgbGlzdGVuZXJGbiwgdHJ1ZSAvKiogcHJldmVudERlZmF1bHQgKi8pO1xuICAgICAgdGFyZ2V0LmFkZEV2ZW50TGlzdGVuZXIoZXZlbnROYW1lLCBsaXN0ZW5lckZuLCB1c2VDYXB0dXJlKTtcbiAgICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJBZGRFdmVudExpc3RlbmVyKys7XG5cbiAgICAgIGxDbGVhbnVwLnB1c2gobGlzdGVuZXJGbik7XG4gICAgICB0Q2xlYW51cCAmJiB0Q2xlYW51cC5wdXNoKGV2ZW50TmFtZSwgaWR4T3JUYXJnZXRHZXR0ZXIsIGxDbGVhbnVwSW5kZXgsIHVzZUNhcHR1cmUpO1xuICAgIH1cbiAgfVxuXG4gIC8vIHN1YnNjcmliZSB0byBkaXJlY3RpdmUgb3V0cHV0c1xuICBjb25zdCBvdXRwdXRzID0gdE5vZGUub3V0cHV0cztcbiAgbGV0IHByb3BzOiBQcm9wZXJ0eUFsaWFzVmFsdWV8dW5kZWZpbmVkO1xuICBpZiAocHJvY2Vzc091dHB1dHMgJiYgb3V0cHV0cyAhPT0gbnVsbCAmJiAocHJvcHMgPSBvdXRwdXRzW2V2ZW50TmFtZV0pKSB7XG4gICAgY29uc3QgcHJvcHNMZW5ndGggPSBwcm9wcy5sZW5ndGg7XG4gICAgaWYgKHByb3BzTGVuZ3RoKSB7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHByb3BzTGVuZ3RoOyBpICs9IDIpIHtcbiAgICAgICAgY29uc3QgaW5kZXggPSBwcm9wc1tpXSBhcyBudW1iZXI7XG4gICAgICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREYXRhSW5SYW5nZShsVmlldywgaW5kZXgpO1xuICAgICAgICBjb25zdCBtaW5pZmllZE5hbWUgPSBwcm9wc1tpICsgMV07XG4gICAgICAgIGNvbnN0IGRpcmVjdGl2ZUluc3RhbmNlID0gbFZpZXdbaW5kZXhdO1xuICAgICAgICBjb25zdCBvdXRwdXQgPSBkaXJlY3RpdmVJbnN0YW5jZVttaW5pZmllZE5hbWVdO1xuXG4gICAgICAgIGlmIChuZ0Rldk1vZGUgJiYgIWlzT2JzZXJ2YWJsZShvdXRwdXQpKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgICAgICBgQE91dHB1dCAke21pbmlmaWVkTmFtZX0gbm90IGluaXRpYWxpemVkIGluICcke2RpcmVjdGl2ZUluc3RhbmNlLmNvbnN0cnVjdG9yLm5hbWV9Jy5gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHN1YnNjcmlwdGlvbiA9IG91dHB1dC5zdWJzY3JpYmUobGlzdGVuZXJGbik7XG4gICAgICAgIGNvbnN0IGlkeCA9IGxDbGVhbnVwLmxlbmd0aDtcbiAgICAgICAgbENsZWFudXAucHVzaChsaXN0ZW5lckZuLCBzdWJzY3JpcHRpb24pO1xuICAgICAgICB0Q2xlYW51cCAmJiB0Q2xlYW51cC5wdXNoKGV2ZW50TmFtZSwgdE5vZGUuaW5kZXgsIGlkeCwgLShpZHggKyAxKSk7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGV4ZWN1dGVMaXN0ZW5lcldpdGhFcnJvckhhbmRsaW5nKFxuICAgIGxWaWV3OiBMVmlldywgbGlzdGVuZXJGbjogKGU/OiBhbnkpID0+IGFueSwgZTogYW55KTogYm9vbGVhbiB7XG4gIHRyeSB7XG4gICAgLy8gT25seSBleHBsaWNpdGx5IHJldHVybmluZyBmYWxzZSBmcm9tIGEgbGlzdGVuZXIgc2hvdWxkIHByZXZlbnREZWZhdWx0XG4gICAgcmV0dXJuIGxpc3RlbmVyRm4oZSkgIT09IGZhbHNlO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGhhbmRsZUVycm9yKGxWaWV3LCBlcnJvcik7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG59XG5cbi8qKlxuICogV3JhcHMgYW4gZXZlbnQgbGlzdGVuZXIgd2l0aCBhIGZ1bmN0aW9uIHRoYXQgbWFya3MgYW5jZXN0b3JzIGRpcnR5IGFuZCBwcmV2ZW50cyBkZWZhdWx0IGJlaGF2aW9yLFxuICogaWYgYXBwbGljYWJsZS5cbiAqXG4gKiBAcGFyYW0gdE5vZGUgVGhlIFROb2RlIGFzc29jaWF0ZWQgd2l0aCB0aGlzIGxpc3RlbmVyXG4gKiBAcGFyYW0gbFZpZXcgVGhlIExWaWV3IHRoYXQgY29udGFpbnMgdGhpcyBsaXN0ZW5lclxuICogQHBhcmFtIGxpc3RlbmVyRm4gVGhlIGxpc3RlbmVyIGZ1bmN0aW9uIHRvIGNhbGxcbiAqIEBwYXJhbSB3cmFwV2l0aFByZXZlbnREZWZhdWx0IFdoZXRoZXIgb3Igbm90IHRvIHByZXZlbnQgZGVmYXVsdCBiZWhhdmlvclxuICogKHRoZSBwcm9jZWR1cmFsIHJlbmRlcmVyIGRvZXMgdGhpcyBhbHJlYWR5LCBzbyBpbiB0aG9zZSBjYXNlcywgd2Ugc2hvdWxkIHNraXApXG4gKi9cbmZ1bmN0aW9uIHdyYXBMaXN0ZW5lcihcbiAgICB0Tm9kZTogVE5vZGUsIGxWaWV3OiBMVmlldywgbGlzdGVuZXJGbjogKGU/OiBhbnkpID0+IGFueSxcbiAgICB3cmFwV2l0aFByZXZlbnREZWZhdWx0OiBib29sZWFuKTogRXZlbnRMaXN0ZW5lciB7XG4gIC8vIE5vdGU6IHdlIGFyZSBwZXJmb3JtaW5nIG1vc3Qgb2YgdGhlIHdvcmsgaW4gdGhlIGxpc3RlbmVyIGZ1bmN0aW9uIGl0c2VsZlxuICAvLyB0byBvcHRpbWl6ZSBsaXN0ZW5lciByZWdpc3RyYXRpb24uXG4gIHJldHVybiBmdW5jdGlvbiB3cmFwTGlzdGVuZXJJbl9tYXJrRGlydHlBbmRQcmV2ZW50RGVmYXVsdChlOiBhbnkpIHtcbiAgICAvLyBJdnkgdXNlcyBgRnVuY3Rpb25gIGFzIGEgc3BlY2lhbCB0b2tlbiB0aGF0IGFsbG93cyB1cyB0byB1bndyYXAgdGhlIGZ1bmN0aW9uXG4gICAgLy8gc28gdGhhdCBpdCBjYW4gYmUgaW52b2tlZCBwcm9ncmFtbWF0aWNhbGx5IGJ5IGBEZWJ1Z05vZGUudHJpZ2dlckV2ZW50SGFuZGxlcmAuXG4gICAgaWYgKGUgPT09IEZ1bmN0aW9uKSB7XG4gICAgICByZXR1cm4gbGlzdGVuZXJGbjtcbiAgICB9XG5cbiAgICAvLyBJbiBvcmRlciB0byBiZSBiYWNrd2FyZHMgY29tcGF0aWJsZSB3aXRoIFZpZXcgRW5naW5lLCBldmVudHMgb24gY29tcG9uZW50IGhvc3Qgbm9kZXNcbiAgICAvLyBtdXN0IGFsc28gbWFyayB0aGUgY29tcG9uZW50IHZpZXcgaXRzZWxmIGRpcnR5IChpLmUuIHRoZSB2aWV3IHRoYXQgaXQgb3ducykuXG4gICAgY29uc3Qgc3RhcnRWaWV3ID0gdE5vZGUuZmxhZ3MgJiBUTm9kZUZsYWdzLmlzQ29tcG9uZW50SG9zdCA/XG4gICAgICAgIGdldENvbXBvbmVudExWaWV3QnlJbmRleCh0Tm9kZS5pbmRleCwgbFZpZXcpIDpcbiAgICAgICAgbFZpZXc7XG5cbiAgICAvLyBTZWUgaW50ZXJmYWNlcy92aWV3LnRzIGZvciBtb3JlIG9uIExWaWV3RmxhZ3MuTWFudWFsT25QdXNoXG4gICAgaWYgKChsVmlld1tGTEFHU10gJiBMVmlld0ZsYWdzLk1hbnVhbE9uUHVzaCkgPT09IDApIHtcbiAgICAgIG1hcmtWaWV3RGlydHkoc3RhcnRWaWV3KTtcbiAgICB9XG5cbiAgICBsZXQgcmVzdWx0ID0gZXhlY3V0ZUxpc3RlbmVyV2l0aEVycm9ySGFuZGxpbmcobFZpZXcsIGxpc3RlbmVyRm4sIGUpO1xuICAgIC8vIEEganVzdC1pbnZva2VkIGxpc3RlbmVyIGZ1bmN0aW9uIG1pZ2h0IGhhdmUgY29hbGVzY2VkIGxpc3RlbmVycyBzbyB3ZSBuZWVkIHRvIGNoZWNrIGZvclxuICAgIC8vIHRoZWlyIHByZXNlbmNlIGFuZCBpbnZva2UgYXMgbmVlZGVkLlxuICAgIGxldCBuZXh0TGlzdGVuZXJGbiA9ICg8YW55PndyYXBMaXN0ZW5lckluX21hcmtEaXJ0eUFuZFByZXZlbnREZWZhdWx0KS5fX25nTmV4dExpc3RlbmVyRm5fXztcbiAgICB3aGlsZSAobmV4dExpc3RlbmVyRm4pIHtcbiAgICAgIC8vIFdlIHNob3VsZCBwcmV2ZW50IGRlZmF1bHQgaWYgYW55IG9mIHRoZSBsaXN0ZW5lcnMgZXhwbGljaXRseSByZXR1cm4gZmFsc2VcbiAgICAgIHJlc3VsdCA9IGV4ZWN1dGVMaXN0ZW5lcldpdGhFcnJvckhhbmRsaW5nKGxWaWV3LCBuZXh0TGlzdGVuZXJGbiwgZSkgJiYgcmVzdWx0O1xuICAgICAgbmV4dExpc3RlbmVyRm4gPSAoPGFueT5uZXh0TGlzdGVuZXJGbikuX19uZ05leHRMaXN0ZW5lckZuX187XG4gICAgfVxuXG4gICAgaWYgKHdyYXBXaXRoUHJldmVudERlZmF1bHQgJiYgcmVzdWx0ID09PSBmYWxzZSkge1xuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgLy8gTmVjZXNzYXJ5IGZvciBsZWdhY3kgYnJvd3NlcnMgdGhhdCBkb24ndCBzdXBwb3J0IHByZXZlbnREZWZhdWx0IChlLmcuIElFKVxuICAgICAgZS5yZXR1cm5WYWx1ZSA9IGZhbHNlO1xuICAgIH1cblxuICAgIHJldHVybiByZXN1bHQ7XG4gIH07XG59XG4iXX0=