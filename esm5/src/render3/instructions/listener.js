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
    ngDevMode && assertNodeOfPossibleTypes(tNode, 3 /* Element */, 0 /* Container */, 4 /* ElementContainer */);
    var processOutputs = true;
    // add native event listener - applicable to elements only
    if (tNode.type === 3 /* Element */) {
        var native = getNativeByTNode(tNode, lView);
        var resolved = eventTargetResolver ? eventTargetResolver(native) : EMPTY_OBJ;
        var target = resolved.target || native;
        var lCleanup = getCleanup(lView);
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
            var lCleanup = getCleanup(lView);
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
function executeListenerWithErrorHandling(lView, tNode, listenerFn, e) {
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
        var result = executeListenerWithErrorHandling(lView, tNode, listenerFn, e);
        // A just-invoked listener function might have coalesced listeners so we need to check for
        // their presence and invoke as needed.
        var nextListenerFn = wrapListenerIn_markDirtyAndPreventDefault.__ngNextListenerFn__;
        while (nextListenerFn) {
            // We should prevent default if any of the listeners explicitly return false
            result = executeListenerWithErrorHandling(lView, tNode, nextListenerFn, e) && result;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGlzdGVuZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2luc3RydWN0aW9ucy9saXN0ZW5lci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFHSCxPQUFPLEVBQUMsaUJBQWlCLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUNwRCxPQUFPLEVBQUMsWUFBWSxFQUFDLE1BQU0saUJBQWlCLENBQUM7QUFDN0MsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUVuQyxPQUFPLEVBQTRDLG9CQUFvQixFQUFDLE1BQU0sd0JBQXdCLENBQUM7QUFDdkcsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLDJCQUEyQixDQUFDO0FBQzFELE9BQU8sRUFBQyxPQUFPLEVBQUUsS0FBSyxFQUFxQixRQUFRLEVBQUUsS0FBSyxFQUFDLE1BQU0sb0JBQW9CLENBQUM7QUFDdEYsT0FBTyxFQUFDLHlCQUF5QixFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFDekQsT0FBTyxFQUFDLFFBQVEsRUFBRSx3QkFBd0IsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUM1RCxPQUFPLEVBQUMsd0JBQXdCLEVBQUUsZ0JBQWdCLEVBQUUsV0FBVyxFQUFDLE1BQU0sb0JBQW9CLENBQUM7QUFFM0YsT0FBTyxFQUFDLFVBQVUsRUFBRSxXQUFXLEVBQUUscUJBQXFCLEVBQUUsYUFBYSxFQUFDLE1BQU0sVUFBVSxDQUFDO0FBSXZGOzs7Ozs7Ozs7Ozs7O0dBYUc7QUFDSCxNQUFNLFVBQVUsVUFBVSxDQUN0QixTQUFpQixFQUFFLFVBQTRCLEVBQUUsVUFBa0IsRUFDbkUsbUJBQTBDO0lBRE8sMkJBQUEsRUFBQSxrQkFBa0I7SUFFckUsSUFBTSxLQUFLLEdBQUcsUUFBUSxFQUFFLENBQUM7SUFDekIsSUFBTSxLQUFLLEdBQUcsd0JBQXdCLEVBQUUsQ0FB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QixDQUFDLEtBQUssQ0FBQyxFQUFFO1lBQ2xELGFBQWEsQ0FBQyxTQUFTLENBQUMsQ0FBQztTQUMxQjtRQUVELElBQUksTUFBTSxHQUFHLGdDQUFnQyxDQUFDLEtBQUssRUFBRSxLQUFLLEVBQUUsVUFBVSxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQzNFLDBGQUEwRjtRQUMxRix1Q0FBdUM7UUFDdkMsSUFBSSxjQUFjLEdBQVMseUNBQTBDLENBQUMsb0JBQW9CLENBQUM7UUFDM0YsT0FBTyxjQUFjLEVBQUU7WUFDckIsNEVBQTRFO1lBQzVFLE1BQU0sR0FBRyxnQ0FBZ0MsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLGNBQWMsRUFBRSxDQUFDLENBQUMsSUFBSSxNQUFNLENBQUM7WUFDckYsY0FBYyxHQUFTLGNBQWUsQ0FBQyxvQkFBb0IsQ0FBQztTQUM3RDtRQUVELElBQUksc0JBQXNCLElBQUksTUFBTSxLQUFLLEtBQUssRUFBRTtZQUM5QyxDQUFDLENBQUMsY0FBYyxFQUFFLENBQUM7WUFDbkIsNEVBQTRFO1lBQzVFLENBQUMsQ0FBQyxXQUFXLEdBQUcsS0FBSyxDQUFDO1NBQ3ZCO1FBRUQsT0FBTyxNQUFNLENBQUM7SUFDaEIsQ0FBQyxDQUFDO0FBQ0osQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuXG5pbXBvcnQge2Fzc2VydERhdGFJblJhbmdlfSBmcm9tICcuLi8uLi91dGlsL2Fzc2VydCc7XG5pbXBvcnQge2lzT2JzZXJ2YWJsZX0gZnJvbSAnLi4vLi4vdXRpbC9sYW5nJztcbmltcG9ydCB7RU1QVFlfT0JKfSBmcm9tICcuLi9lbXB0eSc7XG5pbXBvcnQge1Byb3BlcnR5QWxpYXNWYWx1ZSwgVE5vZGUsIFROb2RlRmxhZ3MsIFROb2RlVHlwZX0gZnJvbSAnLi4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7R2xvYmFsVGFyZ2V0UmVzb2x2ZXIsIFJFbGVtZW50LCBSZW5kZXJlcjMsIGlzUHJvY2VkdXJhbFJlbmRlcmVyfSBmcm9tICcuLi9pbnRlcmZhY2VzL3JlbmRlcmVyJztcbmltcG9ydCB7aXNEaXJlY3RpdmVIb3N0fSBmcm9tICcuLi9pbnRlcmZhY2VzL3R5cGVfY2hlY2tzJztcbmltcG9ydCB7Q0xFQU5VUCwgRkxBR1MsIExWaWV3LCBMVmlld0ZsYWdzLCBSRU5ERVJFUiwgVFZJRVd9IGZyb20gJy4uL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2Fzc2VydE5vZGVPZlBvc3NpYmxlVHlwZXN9IGZyb20gJy4uL25vZGVfYXNzZXJ0JztcbmltcG9ydCB7Z2V0TFZpZXcsIGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZX0gZnJvbSAnLi4vc3RhdGUnO1xuaW1wb3J0IHtnZXRDb21wb25lbnRMVmlld0J5SW5kZXgsIGdldE5hdGl2ZUJ5VE5vZGUsIHVud3JhcFJOb2RlfSBmcm9tICcuLi91dGlsL3ZpZXdfdXRpbHMnO1xuXG5pbXBvcnQge2dldENsZWFudXAsIGhhbmRsZUVycm9yLCBsb2FkQ29tcG9uZW50UmVuZGVyZXIsIG1hcmtWaWV3RGlydHl9IGZyb20gJy4vc2hhcmVkJztcblxuXG5cbi8qKlxuICogQWRkcyBhbiBldmVudCBsaXN0ZW5lciB0byB0aGUgY3VycmVudCBub2RlLlxuICpcbiAqIElmIGFuIG91dHB1dCBleGlzdHMgb24gb25lIG9mIHRoZSBub2RlJ3MgZGlyZWN0aXZlcywgaXQgYWxzbyBzdWJzY3JpYmVzIHRvIHRoZSBvdXRwdXRcbiAqIGFuZCBzYXZlcyB0aGUgc3Vic2NyaXB0aW9uIGZvciBsYXRlciBjbGVhbnVwLlxuICpcbiAqIEBwYXJhbSBldmVudE5hbWUgTmFtZSBvZiB0aGUgZXZlbnRcbiAqIEBwYXJhbSBsaXN0ZW5lckZuIFRoZSBmdW5jdGlvbiB0byBiZSBjYWxsZWQgd2hlbiBldmVudCBlbWl0c1xuICogQHBhcmFtIHVzZUNhcHR1cmUgV2hldGhlciBvciBub3QgdG8gdXNlIGNhcHR1cmUgaW4gZXZlbnQgbGlzdGVuZXJcbiAqIEBwYXJhbSBldmVudFRhcmdldFJlc29sdmVyIEZ1bmN0aW9uIHRoYXQgcmV0dXJucyBnbG9iYWwgdGFyZ2V0IGluZm9ybWF0aW9uIGluIGNhc2UgdGhpcyBsaXN0ZW5lclxuICogc2hvdWxkIGJlIGF0dGFjaGVkIHRvIGEgZ2xvYmFsIG9iamVjdCBsaWtlIHdpbmRvdywgZG9jdW1lbnQgb3IgYm9keVxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1bGlzdGVuZXIoXG4gICAgZXZlbnROYW1lOiBzdHJpbmcsIGxpc3RlbmVyRm46IChlPzogYW55KSA9PiBhbnksIHVzZUNhcHR1cmUgPSBmYWxzZSxcbiAgICBldmVudFRhcmdldFJlc29sdmVyPzogR2xvYmFsVGFyZ2V0UmVzb2x2ZXIpOiB2b2lkIHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCB0Tm9kZSA9IGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSgpO1xuICBsaXN0ZW5lckludGVybmFsKFxuICAgICAgbFZpZXcsIGxWaWV3W1JFTkRFUkVSXSwgdE5vZGUsIGV2ZW50TmFtZSwgbGlzdGVuZXJGbiwgdXNlQ2FwdHVyZSwgZXZlbnRUYXJnZXRSZXNvbHZlcik7XG59XG5cbi8qKlxuKiBSZWdpc3RlcnMgYSBzeW50aGV0aWMgaG9zdCBsaXN0ZW5lciAoZS5nLiBgKEBmb28uc3RhcnQpYCkgb24gYSBjb21wb25lbnQuXG4qXG4qIFRoaXMgaW5zdHJ1Y3Rpb24gaXMgZm9yIGNvbXBhdGliaWxpdHkgcHVycG9zZXMgYW5kIGlzIGRlc2lnbmVkIHRvIGVuc3VyZSB0aGF0IGFcbiogc3ludGhldGljIGhvc3QgbGlzdGVuZXIgKGUuZy4gYEBIb3N0TGlzdGVuZXIoJ0Bmb28uc3RhcnQnKWApIHByb3Blcmx5IGdldHMgcmVuZGVyZWRcbiogaW4gdGhlIGNvbXBvbmVudCdzIHJlbmRlcmVyLiBOb3JtYWxseSBhbGwgaG9zdCBsaXN0ZW5lcnMgYXJlIGV2YWx1YXRlZCB3aXRoIHRoZVxuKiBwYXJlbnQgY29tcG9uZW50J3MgcmVuZGVyZXIsIGJ1dCwgaW4gdGhlIGNhc2Ugb2YgYW5pbWF0aW9uIEB0cmlnZ2VycywgdGhleSBuZWVkXG4qIHRvIGJlIGV2YWx1YXRlZCB3aXRoIHRoZSBzdWIgY29tcG9uZW50J3MgcmVuZGVyZXIgKGJlY2F1c2UgdGhhdCdzIHdoZXJlIHRoZVxuKiBhbmltYXRpb24gdHJpZ2dlcnMgYXJlIGRlZmluZWQpLlxuKlxuKiBEbyBub3QgdXNlIHRoaXMgaW5zdHJ1Y3Rpb24gYXMgYSByZXBsYWNlbWVudCBmb3IgYGxpc3RlbmVyYC4gVGhpcyBpbnN0cnVjdGlvblxuKiBvbmx5IGV4aXN0cyB0byBlbnN1cmUgY29tcGF0aWJpbGl0eSB3aXRoIHRoZSBWaWV3RW5naW5lJ3MgaG9zdCBiaW5kaW5nIGJlaGF2aW9yLlxuKlxuKiBAcGFyYW0gZXZlbnROYW1lIE5hbWUgb2YgdGhlIGV2ZW50XG4qIEBwYXJhbSBsaXN0ZW5lckZuIFRoZSBmdW5jdGlvbiB0byBiZSBjYWxsZWQgd2hlbiBldmVudCBlbWl0c1xuKiBAcGFyYW0gdXNlQ2FwdHVyZSBXaGV0aGVyIG9yIG5vdCB0byB1c2UgY2FwdHVyZSBpbiBldmVudCBsaXN0ZW5lclxuKiBAcGFyYW0gZXZlbnRUYXJnZXRSZXNvbHZlciBGdW5jdGlvbiB0aGF0IHJldHVybnMgZ2xvYmFsIHRhcmdldCBpbmZvcm1hdGlvbiBpbiBjYXNlIHRoaXMgbGlzdGVuZXJcbiogc2hvdWxkIGJlIGF0dGFjaGVkIHRvIGEgZ2xvYmFsIG9iamVjdCBsaWtlIHdpbmRvdywgZG9jdW1lbnQgb3IgYm9keVxuICpcbiAqIEBjb2RlR2VuQXBpXG4qL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVjb21wb25lbnRIb3N0U3ludGhldGljTGlzdGVuZXIoXG4gICAgZXZlbnROYW1lOiBzdHJpbmcsIGxpc3RlbmVyRm46IChlPzogYW55KSA9PiBhbnksIHVzZUNhcHR1cmUgPSBmYWxzZSxcbiAgICBldmVudFRhcmdldFJlc29sdmVyPzogR2xvYmFsVGFyZ2V0UmVzb2x2ZXIpOiB2b2lkIHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCB0Tm9kZSA9IGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSgpO1xuICBjb25zdCByZW5kZXJlciA9IGxvYWRDb21wb25lbnRSZW5kZXJlcih0Tm9kZSwgbFZpZXcpO1xuICBsaXN0ZW5lckludGVybmFsKGxWaWV3LCByZW5kZXJlciwgdE5vZGUsIGV2ZW50TmFtZSwgbGlzdGVuZXJGbiwgdXNlQ2FwdHVyZSwgZXZlbnRUYXJnZXRSZXNvbHZlcik7XG59XG5cbi8qKlxuICogQSB1dGlsaXR5IGZ1bmN0aW9uIHRoYXQgY2hlY2tzIGlmIGEgZ2l2ZW4gZWxlbWVudCBoYXMgYWxyZWFkeSBhbiBldmVudCBoYW5kbGVyIHJlZ2lzdGVyZWQgZm9yIGFuXG4gKiBldmVudCB3aXRoIGEgc3BlY2lmaWVkIG5hbWUuIFRoZSBUVmlldy5jbGVhbnVwIGRhdGEgc3RydWN0dXJlIGlzIHVzZWQgdG8gZmluZCBvdXQgd2hpY2ggZXZlbnRzXG4gKiBhcmUgcmVnaXN0ZXJlZCBmb3IgYSBnaXZlbiBlbGVtZW50LlxuICovXG5mdW5jdGlvbiBmaW5kRXhpc3RpbmdMaXN0ZW5lcihcbiAgICBsVmlldzogTFZpZXcsIGV2ZW50TmFtZTogc3RyaW5nLCB0Tm9kZUlkeDogbnVtYmVyKTogKChlPzogYW55KSA9PiBhbnkpfG51bGwge1xuICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgY29uc3QgdENsZWFudXAgPSB0Vmlldy5jbGVhbnVwO1xuICBpZiAodENsZWFudXAgIT0gbnVsbCkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdENsZWFudXAubGVuZ3RoIC0gMTsgaSArPSAyKSB7XG4gICAgICBjb25zdCBjbGVhbnVwRXZlbnROYW1lID0gdENsZWFudXBbaV07XG4gICAgICBpZiAoY2xlYW51cEV2ZW50TmFtZSA9PT0gZXZlbnROYW1lICYmIHRDbGVhbnVwW2kgKyAxXSA9PT0gdE5vZGVJZHgpIHtcbiAgICAgICAgLy8gV2UgaGF2ZSBmb3VuZCBhIG1hdGNoaW5nIGV2ZW50IG5hbWUgb24gdGhlIHNhbWUgbm9kZSBidXQgaXQgbWlnaHQgbm90IGhhdmUgYmVlblxuICAgICAgICAvLyByZWdpc3RlcmVkIHlldCwgc28gd2UgbXVzdCBleHBsaWNpdGx5IHZlcmlmeSBlbnRyaWVzIGluIHRoZSBMVmlldyBjbGVhbnVwIGRhdGFcbiAgICAgICAgLy8gc3RydWN0dXJlcy5cbiAgICAgICAgY29uc3QgbENsZWFudXAgPSBsVmlld1tDTEVBTlVQXSAhO1xuICAgICAgICBjb25zdCBsaXN0ZW5lcklkeEluTENsZWFudXAgPSB0Q2xlYW51cFtpICsgMl07XG4gICAgICAgIHJldHVybiBsQ2xlYW51cC5sZW5ndGggPiBsaXN0ZW5lcklkeEluTENsZWFudXAgPyBsQ2xlYW51cFtsaXN0ZW5lcklkeEluTENsZWFudXBdIDogbnVsbDtcbiAgICAgIH1cbiAgICAgIC8vIFRWaWV3LmNsZWFudXAgY2FuIGhhdmUgYSBtaXggb2YgNC1lbGVtZW50cyBlbnRyaWVzIChmb3IgZXZlbnQgaGFuZGxlciBjbGVhbnVwcykgb3JcbiAgICAgIC8vIDItZWxlbWVudCBlbnRyaWVzIChmb3IgZGlyZWN0aXZlIGFuZCBxdWVyaWVzIGRlc3Ryb3kgaG9va3MpLiBBcyBzdWNoIHdlIGNhbiBlbmNvdW50ZXJcbiAgICAgIC8vIGJsb2NrcyBvZiA0IG9yIDIgaXRlbXMgaW4gdGhlIHRWaWV3LmNsZWFudXAgYW5kIHRoaXMgaXMgd2h5IHdlIGl0ZXJhdGUgb3ZlciAyIGVsZW1lbnRzXG4gICAgICAvLyBmaXJzdCBhbmQganVtcCBhbm90aGVyIDIgZWxlbWVudHMgaWYgd2UgZGV0ZWN0IGxpc3RlbmVycyBjbGVhbnVwICg0IGVsZW1lbnRzKS4gQWxzbyBjaGVja1xuICAgICAgLy8gZG9jdW1lbnRhdGlvbiBvZiBUVmlldy5jbGVhbnVwIGZvciBtb3JlIGRldGFpbHMgb2YgdGhpcyBkYXRhIHN0cnVjdHVyZSBsYXlvdXQuXG4gICAgICBpZiAodHlwZW9mIGNsZWFudXBFdmVudE5hbWUgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIGkgKz0gMjtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbmZ1bmN0aW9uIGxpc3RlbmVySW50ZXJuYWwoXG4gICAgbFZpZXc6IExWaWV3LCByZW5kZXJlcjogUmVuZGVyZXIzLCB0Tm9kZTogVE5vZGUsIGV2ZW50TmFtZTogc3RyaW5nLFxuICAgIGxpc3RlbmVyRm46IChlPzogYW55KSA9PiBhbnksIHVzZUNhcHR1cmUgPSBmYWxzZSxcbiAgICBldmVudFRhcmdldFJlc29sdmVyPzogR2xvYmFsVGFyZ2V0UmVzb2x2ZXIpOiB2b2lkIHtcbiAgY29uc3QgdFZpZXcgPSBsVmlld1tUVklFV107XG4gIGNvbnN0IGlzVE5vZGVEaXJlY3RpdmVIb3N0ID0gaXNEaXJlY3RpdmVIb3N0KHROb2RlKTtcbiAgY29uc3QgZmlyc3RDcmVhdGVQYXNzID0gdFZpZXcuZmlyc3RDcmVhdGVQYXNzO1xuICBjb25zdCB0Q2xlYW51cDogZmFsc2V8YW55W10gPSBmaXJzdENyZWF0ZVBhc3MgJiYgKHRWaWV3LmNsZWFudXAgfHwgKHRWaWV3LmNsZWFudXAgPSBbXSkpO1xuXG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlT2ZQb3NzaWJsZVR5cGVzKFxuICAgICAgICAgICAgICAgICAgIHROb2RlLCBUTm9kZVR5cGUuRWxlbWVudCwgVE5vZGVUeXBlLkNvbnRhaW5lciwgVE5vZGVUeXBlLkVsZW1lbnRDb250YWluZXIpO1xuXG4gIGxldCBwcm9jZXNzT3V0cHV0cyA9IHRydWU7XG5cbiAgLy8gYWRkIG5hdGl2ZSBldmVudCBsaXN0ZW5lciAtIGFwcGxpY2FibGUgdG8gZWxlbWVudHMgb25seVxuICBpZiAodE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkVsZW1lbnQpIHtcbiAgICBjb25zdCBuYXRpdmUgPSBnZXROYXRpdmVCeVROb2RlKHROb2RlLCBsVmlldykgYXMgUkVsZW1lbnQ7XG4gICAgY29uc3QgcmVzb2x2ZWQgPSBldmVudFRhcmdldFJlc29sdmVyID8gZXZlbnRUYXJnZXRSZXNvbHZlcihuYXRpdmUpIDogRU1QVFlfT0JKIGFzIGFueTtcbiAgICBjb25zdCB0YXJnZXQgPSByZXNvbHZlZC50YXJnZXQgfHwgbmF0aXZlO1xuICAgIGNvbnN0IGxDbGVhbnVwID0gZ2V0Q2xlYW51cChsVmlldyk7XG4gICAgY29uc3QgbENsZWFudXBJbmRleCA9IGxDbGVhbnVwLmxlbmd0aDtcbiAgICBjb25zdCBpZHhPclRhcmdldEdldHRlciA9IGV2ZW50VGFyZ2V0UmVzb2x2ZXIgP1xuICAgICAgICAoX2xWaWV3OiBMVmlldykgPT4gZXZlbnRUYXJnZXRSZXNvbHZlcih1bndyYXBSTm9kZShfbFZpZXdbdE5vZGUuaW5kZXhdKSkudGFyZ2V0IDpcbiAgICAgICAgdE5vZGUuaW5kZXg7XG5cbiAgICAvLyBJbiBvcmRlciB0byBtYXRjaCBjdXJyZW50IGJlaGF2aW9yLCBuYXRpdmUgRE9NIGV2ZW50IGxpc3RlbmVycyBtdXN0IGJlIGFkZGVkIGZvciBhbGxcbiAgICAvLyBldmVudHMgKGluY2x1ZGluZyBvdXRwdXRzKS5cbiAgICBpZiAoaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpKSB7XG4gICAgICAvLyBUaGVyZSBtaWdodCBiZSBjYXNlcyB3aGVyZSBtdWx0aXBsZSBkaXJlY3RpdmVzIG9uIHRoZSBzYW1lIGVsZW1lbnQgdHJ5IHRvIHJlZ2lzdGVyIGFuIGV2ZW50XG4gICAgICAvLyBoYW5kbGVyIGZ1bmN0aW9uIGZvciB0aGUgc2FtZSBldmVudC4gSW4gdGhpcyBzaXR1YXRpb24gd2Ugd2FudCB0byBhdm9pZCByZWdpc3RyYXRpb24gb2ZcbiAgICAgIC8vIHNldmVyYWwgbmF0aXZlIGxpc3RlbmVycyBhcyBlYWNoIHJlZ2lzdHJhdGlvbiB3b3VsZCBiZSBpbnRlcmNlcHRlZCBieSBOZ1pvbmUgYW5kXG4gICAgICAvLyB0cmlnZ2VyIGNoYW5nZSBkZXRlY3Rpb24uIFRoaXMgd291bGQgbWVhbiB0aGF0IGEgc2luZ2xlIHVzZXIgYWN0aW9uIHdvdWxkIHJlc3VsdCBpbiBzZXZlcmFsXG4gICAgICAvLyBjaGFuZ2UgZGV0ZWN0aW9ucyBiZWluZyBpbnZva2VkLiBUbyBhdm9pZCB0aGlzIHNpdHVhdGlvbiB3ZSB3YW50IHRvIGhhdmUgb25seSBvbmUgY2FsbCB0b1xuICAgICAgLy8gbmF0aXZlIGhhbmRsZXIgcmVnaXN0cmF0aW9uIChmb3IgdGhlIHNhbWUgZWxlbWVudCBhbmQgc2FtZSB0eXBlIG9mIGV2ZW50KS5cbiAgICAgIC8vXG4gICAgICAvLyBJbiBvcmRlciB0byBoYXZlIGp1c3Qgb25lIG5hdGl2ZSBldmVudCBoYW5kbGVyIGluIHByZXNlbmNlIG9mIG11bHRpcGxlIGhhbmRsZXIgZnVuY3Rpb25zLFxuICAgICAgLy8gd2UganVzdCByZWdpc3RlciBhIGZpcnN0IGhhbmRsZXIgZnVuY3Rpb24gYXMgYSBuYXRpdmUgZXZlbnQgbGlzdGVuZXIgYW5kIHRoZW4gY2hhaW5cbiAgICAgIC8vIChjb2FsZXNjZSkgb3RoZXIgaGFuZGxlciBmdW5jdGlvbnMgb24gdG9wIG9mIHRoZSBmaXJzdCBuYXRpdmUgaGFuZGxlciBmdW5jdGlvbi5cbiAgICAgIGxldCBleGlzdGluZ0xpc3RlbmVyID0gbnVsbDtcbiAgICAgIC8vIFBsZWFzZSBub3RlIHRoYXQgdGhlIGNvYWxlc2NpbmcgZGVzY3JpYmVkIGhlcmUgZG9lc24ndCBoYXBwZW4gZm9yIGV2ZW50cyBzcGVjaWZ5aW5nIGFuXG4gICAgICAvLyBhbHRlcm5hdGl2ZSB0YXJnZXQgKGV4LiAoZG9jdW1lbnQ6Y2xpY2spKSAtIHRoaXMgaXMgdG8ga2VlcCBiYWNrd2FyZCBjb21wYXRpYmlsaXR5IHdpdGggdGhlXG4gICAgICAvLyB2aWV3IGVuZ2luZS5cbiAgICAgIC8vIEFsc28sIHdlIGRvbid0IGhhdmUgdG8gc2VhcmNoIGZvciBleGlzdGluZyBsaXN0ZW5lcnMgaXMgdGhlcmUgYXJlIG5vIGRpcmVjdGl2ZXNcbiAgICAgIC8vIG1hdGNoaW5nIG9uIGEgZ2l2ZW4gbm9kZSBhcyB3ZSBjYW4ndCByZWdpc3RlciBtdWx0aXBsZSBldmVudCBoYW5kbGVycyBmb3IgdGhlIHNhbWUgZXZlbnQgaW5cbiAgICAgIC8vIGEgdGVtcGxhdGUgKHRoaXMgd291bGQgbWVhbiBoYXZpbmcgZHVwbGljYXRlIGF0dHJpYnV0ZXMpLlxuICAgICAgaWYgKCFldmVudFRhcmdldFJlc29sdmVyICYmIGlzVE5vZGVEaXJlY3RpdmVIb3N0KSB7XG4gICAgICAgIGV4aXN0aW5nTGlzdGVuZXIgPSBmaW5kRXhpc3RpbmdMaXN0ZW5lcihsVmlldywgZXZlbnROYW1lLCB0Tm9kZS5pbmRleCk7XG4gICAgICB9XG4gICAgICBpZiAoZXhpc3RpbmdMaXN0ZW5lciAhPT0gbnVsbCkge1xuICAgICAgICAvLyBBdHRhY2ggYSBuZXcgbGlzdGVuZXIgdG8gY29hbGVzY2VkIGxpc3RlbmVycyBsaXN0LCBtYWludGFpbmluZyB0aGUgb3JkZXIgaW4gd2hpY2hcbiAgICAgICAgLy8gbGlzdGVuZXJzIGFyZSByZWdpc3RlcmVkLiBGb3IgcGVyZm9ybWFuY2UgcmVhc29ucywgd2Uga2VlcCBhIHJlZmVyZW5jZSB0byB0aGUgbGFzdFxuICAgICAgICAvLyBsaXN0ZW5lciBpbiB0aGF0IGxpc3QgKGluIGBfX25nTGFzdExpc3RlbmVyRm5fX2AgZmllbGQpLCBzbyB3ZSBjYW4gYXZvaWQgZ29pbmcgdGhyb3VnaFxuICAgICAgICAvLyB0aGUgZW50aXJlIHNldCBlYWNoIHRpbWUgd2UgbmVlZCB0byBhZGQgYSBuZXcgbGlzdGVuZXIuXG4gICAgICAgIGNvbnN0IGxhc3RMaXN0ZW5lckZuID0gKDxhbnk+ZXhpc3RpbmdMaXN0ZW5lcikuX19uZ0xhc3RMaXN0ZW5lckZuX18gfHwgZXhpc3RpbmdMaXN0ZW5lcjtcbiAgICAgICAgbGFzdExpc3RlbmVyRm4uX19uZ05leHRMaXN0ZW5lckZuX18gPSBsaXN0ZW5lckZuO1xuICAgICAgICAoPGFueT5leGlzdGluZ0xpc3RlbmVyKS5fX25nTGFzdExpc3RlbmVyRm5fXyA9IGxpc3RlbmVyRm47XG4gICAgICAgIHByb2Nlc3NPdXRwdXRzID0gZmFsc2U7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBUaGUgZmlyc3QgYXJndW1lbnQgb2YgYGxpc3RlbmAgZnVuY3Rpb24gaW4gUHJvY2VkdXJhbCBSZW5kZXJlciBpczpcbiAgICAgICAgLy8gLSBlaXRoZXIgYSB0YXJnZXQgbmFtZSAoYXMgYSBzdHJpbmcpIGluIGNhc2Ugb2YgZ2xvYmFsIHRhcmdldCAod2luZG93LCBkb2N1bWVudCwgYm9keSlcbiAgICAgICAgLy8gLSBvciBlbGVtZW50IHJlZmVyZW5jZSAoaW4gYWxsIG90aGVyIGNhc2VzKVxuICAgICAgICBsaXN0ZW5lckZuID0gd3JhcExpc3RlbmVyKHROb2RlLCBsVmlldywgbGlzdGVuZXJGbiwgZmFsc2UgLyoqIHByZXZlbnREZWZhdWx0ICovKTtcbiAgICAgICAgY29uc3QgY2xlYW51cEZuID0gcmVuZGVyZXIubGlzdGVuKHJlc29sdmVkLm5hbWUgfHwgdGFyZ2V0LCBldmVudE5hbWUsIGxpc3RlbmVyRm4pO1xuICAgICAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyQWRkRXZlbnRMaXN0ZW5lcisrO1xuXG4gICAgICAgIGxDbGVhbnVwLnB1c2gobGlzdGVuZXJGbiwgY2xlYW51cEZuKTtcbiAgICAgICAgdENsZWFudXAgJiYgdENsZWFudXAucHVzaChldmVudE5hbWUsIGlkeE9yVGFyZ2V0R2V0dGVyLCBsQ2xlYW51cEluZGV4LCBsQ2xlYW51cEluZGV4ICsgMSk7XG4gICAgICB9XG5cbiAgICB9IGVsc2Uge1xuICAgICAgbGlzdGVuZXJGbiA9IHdyYXBMaXN0ZW5lcih0Tm9kZSwgbFZpZXcsIGxpc3RlbmVyRm4sIHRydWUgLyoqIHByZXZlbnREZWZhdWx0ICovKTtcbiAgICAgIHRhcmdldC5hZGRFdmVudExpc3RlbmVyKGV2ZW50TmFtZSwgbGlzdGVuZXJGbiwgdXNlQ2FwdHVyZSk7XG4gICAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyQWRkRXZlbnRMaXN0ZW5lcisrO1xuXG4gICAgICBsQ2xlYW51cC5wdXNoKGxpc3RlbmVyRm4pO1xuICAgICAgdENsZWFudXAgJiYgdENsZWFudXAucHVzaChldmVudE5hbWUsIGlkeE9yVGFyZ2V0R2V0dGVyLCBsQ2xlYW51cEluZGV4LCB1c2VDYXB0dXJlKTtcbiAgICB9XG4gIH1cblxuICAvLyBzdWJzY3JpYmUgdG8gZGlyZWN0aXZlIG91dHB1dHNcbiAgY29uc3Qgb3V0cHV0cyA9IHROb2RlLm91dHB1dHM7XG4gIGxldCBwcm9wczogUHJvcGVydHlBbGlhc1ZhbHVlfHVuZGVmaW5lZDtcbiAgaWYgKHByb2Nlc3NPdXRwdXRzICYmIG91dHB1dHMgIT09IG51bGwgJiYgKHByb3BzID0gb3V0cHV0c1tldmVudE5hbWVdKSkge1xuICAgIGNvbnN0IHByb3BzTGVuZ3RoID0gcHJvcHMubGVuZ3RoO1xuICAgIGlmIChwcm9wc0xlbmd0aCkge1xuICAgICAgY29uc3QgbENsZWFudXAgPSBnZXRDbGVhbnVwKGxWaWV3KTtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcHJvcHNMZW5ndGg7IGkgKz0gMikge1xuICAgICAgICBjb25zdCBpbmRleCA9IHByb3BzW2ldIGFzIG51bWJlcjtcbiAgICAgICAgbmdEZXZNb2RlICYmIGFzc2VydERhdGFJblJhbmdlKGxWaWV3LCBpbmRleCk7XG4gICAgICAgIGNvbnN0IG1pbmlmaWVkTmFtZSA9IHByb3BzW2kgKyAxXTtcbiAgICAgICAgY29uc3QgZGlyZWN0aXZlSW5zdGFuY2UgPSBsVmlld1tpbmRleF07XG4gICAgICAgIGNvbnN0IG91dHB1dCA9IGRpcmVjdGl2ZUluc3RhbmNlW21pbmlmaWVkTmFtZV07XG5cbiAgICAgICAgaWYgKG5nRGV2TW9kZSAmJiAhaXNPYnNlcnZhYmxlKG91dHB1dCkpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgICAgIGBAT3V0cHV0ICR7bWluaWZpZWROYW1lfSBub3QgaW5pdGlhbGl6ZWQgaW4gJyR7ZGlyZWN0aXZlSW5zdGFuY2UuY29uc3RydWN0b3IubmFtZX0nLmApO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3Qgc3Vic2NyaXB0aW9uID0gb3V0cHV0LnN1YnNjcmliZShsaXN0ZW5lckZuKTtcbiAgICAgICAgY29uc3QgaWR4ID0gbENsZWFudXAubGVuZ3RoO1xuICAgICAgICBsQ2xlYW51cC5wdXNoKGxpc3RlbmVyRm4sIHN1YnNjcmlwdGlvbik7XG4gICAgICAgIHRDbGVhbnVwICYmIHRDbGVhbnVwLnB1c2goZXZlbnROYW1lLCB0Tm9kZS5pbmRleCwgaWR4LCAtKGlkeCArIDEpKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gZXhlY3V0ZUxpc3RlbmVyV2l0aEVycm9ySGFuZGxpbmcoXG4gICAgbFZpZXc6IExWaWV3LCB0Tm9kZTogVE5vZGUsIGxpc3RlbmVyRm46IChlPzogYW55KSA9PiBhbnksIGU6IGFueSk6IGJvb2xlYW4ge1xuICB0cnkge1xuICAgIC8vIE9ubHkgZXhwbGljaXRseSByZXR1cm5pbmcgZmFsc2UgZnJvbSBhIGxpc3RlbmVyIHNob3VsZCBwcmV2ZW50RGVmYXVsdFxuICAgIHJldHVybiBsaXN0ZW5lckZuKGUpICE9PSBmYWxzZTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBoYW5kbGVFcnJvcihsVmlldywgZXJyb3IpO1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxufVxuXG4vKipcbiAqIFdyYXBzIGFuIGV2ZW50IGxpc3RlbmVyIHdpdGggYSBmdW5jdGlvbiB0aGF0IG1hcmtzIGFuY2VzdG9ycyBkaXJ0eSBhbmQgcHJldmVudHMgZGVmYXVsdCBiZWhhdmlvcixcbiAqIGlmIGFwcGxpY2FibGUuXG4gKlxuICogQHBhcmFtIHROb2RlIFRoZSBUTm9kZSBhc3NvY2lhdGVkIHdpdGggdGhpcyBsaXN0ZW5lclxuICogQHBhcmFtIGxWaWV3IFRoZSBMVmlldyB0aGF0IGNvbnRhaW5zIHRoaXMgbGlzdGVuZXJcbiAqIEBwYXJhbSBsaXN0ZW5lckZuIFRoZSBsaXN0ZW5lciBmdW5jdGlvbiB0byBjYWxsXG4gKiBAcGFyYW0gd3JhcFdpdGhQcmV2ZW50RGVmYXVsdCBXaGV0aGVyIG9yIG5vdCB0byBwcmV2ZW50IGRlZmF1bHQgYmVoYXZpb3JcbiAqICh0aGUgcHJvY2VkdXJhbCByZW5kZXJlciBkb2VzIHRoaXMgYWxyZWFkeSwgc28gaW4gdGhvc2UgY2FzZXMsIHdlIHNob3VsZCBza2lwKVxuICovXG5mdW5jdGlvbiB3cmFwTGlzdGVuZXIoXG4gICAgdE5vZGU6IFROb2RlLCBsVmlldzogTFZpZXcsIGxpc3RlbmVyRm46IChlPzogYW55KSA9PiBhbnksXG4gICAgd3JhcFdpdGhQcmV2ZW50RGVmYXVsdDogYm9vbGVhbik6IEV2ZW50TGlzdGVuZXIge1xuICAvLyBOb3RlOiB3ZSBhcmUgcGVyZm9ybWluZyBtb3N0IG9mIHRoZSB3b3JrIGluIHRoZSBsaXN0ZW5lciBmdW5jdGlvbiBpdHNlbGZcbiAgLy8gdG8gb3B0aW1pemUgbGlzdGVuZXIgcmVnaXN0cmF0aW9uLlxuICByZXR1cm4gZnVuY3Rpb24gd3JhcExpc3RlbmVySW5fbWFya0RpcnR5QW5kUHJldmVudERlZmF1bHQoZTogYW55KSB7XG4gICAgLy8gSXZ5IHVzZXMgYEZ1bmN0aW9uYCBhcyBhIHNwZWNpYWwgdG9rZW4gdGhhdCBhbGxvd3MgdXMgdG8gdW53cmFwIHRoZSBmdW5jdGlvblxuICAgIC8vIHNvIHRoYXQgaXQgY2FuIGJlIGludm9rZWQgcHJvZ3JhbW1hdGljYWxseSBieSBgRGVidWdOb2RlLnRyaWdnZXJFdmVudEhhbmRsZXJgLlxuICAgIGlmIChlID09PSBGdW5jdGlvbikge1xuICAgICAgcmV0dXJuIGxpc3RlbmVyRm47XG4gICAgfVxuXG4gICAgLy8gSW4gb3JkZXIgdG8gYmUgYmFja3dhcmRzIGNvbXBhdGlibGUgd2l0aCBWaWV3IEVuZ2luZSwgZXZlbnRzIG9uIGNvbXBvbmVudCBob3N0IG5vZGVzXG4gICAgLy8gbXVzdCBhbHNvIG1hcmsgdGhlIGNvbXBvbmVudCB2aWV3IGl0c2VsZiBkaXJ0eSAoaS5lLiB0aGUgdmlldyB0aGF0IGl0IG93bnMpLlxuICAgIGNvbnN0IHN0YXJ0VmlldyA9IHROb2RlLmZsYWdzICYgVE5vZGVGbGFncy5pc0NvbXBvbmVudEhvc3QgP1xuICAgICAgICBnZXRDb21wb25lbnRMVmlld0J5SW5kZXgodE5vZGUuaW5kZXgsIGxWaWV3KSA6XG4gICAgICAgIGxWaWV3O1xuXG4gICAgLy8gU2VlIGludGVyZmFjZXMvdmlldy50cyBmb3IgbW9yZSBvbiBMVmlld0ZsYWdzLk1hbnVhbE9uUHVzaFxuICAgIGlmICgobFZpZXdbRkxBR1NdICYgTFZpZXdGbGFncy5NYW51YWxPblB1c2gpID09PSAwKSB7XG4gICAgICBtYXJrVmlld0RpcnR5KHN0YXJ0Vmlldyk7XG4gICAgfVxuXG4gICAgbGV0IHJlc3VsdCA9IGV4ZWN1dGVMaXN0ZW5lcldpdGhFcnJvckhhbmRsaW5nKGxWaWV3LCB0Tm9kZSwgbGlzdGVuZXJGbiwgZSk7XG4gICAgLy8gQSBqdXN0LWludm9rZWQgbGlzdGVuZXIgZnVuY3Rpb24gbWlnaHQgaGF2ZSBjb2FsZXNjZWQgbGlzdGVuZXJzIHNvIHdlIG5lZWQgdG8gY2hlY2sgZm9yXG4gICAgLy8gdGhlaXIgcHJlc2VuY2UgYW5kIGludm9rZSBhcyBuZWVkZWQuXG4gICAgbGV0IG5leHRMaXN0ZW5lckZuID0gKDxhbnk+d3JhcExpc3RlbmVySW5fbWFya0RpcnR5QW5kUHJldmVudERlZmF1bHQpLl9fbmdOZXh0TGlzdGVuZXJGbl9fO1xuICAgIHdoaWxlIChuZXh0TGlzdGVuZXJGbikge1xuICAgICAgLy8gV2Ugc2hvdWxkIHByZXZlbnQgZGVmYXVsdCBpZiBhbnkgb2YgdGhlIGxpc3RlbmVycyBleHBsaWNpdGx5IHJldHVybiBmYWxzZVxuICAgICAgcmVzdWx0ID0gZXhlY3V0ZUxpc3RlbmVyV2l0aEVycm9ySGFuZGxpbmcobFZpZXcsIHROb2RlLCBuZXh0TGlzdGVuZXJGbiwgZSkgJiYgcmVzdWx0O1xuICAgICAgbmV4dExpc3RlbmVyRm4gPSAoPGFueT5uZXh0TGlzdGVuZXJGbikuX19uZ05leHRMaXN0ZW5lckZuX187XG4gICAgfVxuXG4gICAgaWYgKHdyYXBXaXRoUHJldmVudERlZmF1bHQgJiYgcmVzdWx0ID09PSBmYWxzZSkge1xuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgLy8gTmVjZXNzYXJ5IGZvciBsZWdhY3kgYnJvd3NlcnMgdGhhdCBkb24ndCBzdXBwb3J0IHByZXZlbnREZWZhdWx0IChlLmcuIElFKVxuICAgICAgZS5yZXR1cm5WYWx1ZSA9IGZhbHNlO1xuICAgIH1cblxuICAgIHJldHVybiByZXN1bHQ7XG4gIH07XG59XG4iXX0=