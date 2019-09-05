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
import { CLEANUP, FLAGS, RENDERER, TVIEW } from '../interfaces/view';
import { assertNodeOfPossibleTypes } from '../node_assert';
import { getLView, getPreviousOrParentTNode } from '../state';
import { getComponentViewByIndex, getNativeByTNode, hasDirectives, unwrapRNode } from '../util/view_utils';
import { generatePropertyAliases, getCleanup, handleError, loadComponentRenderer, markViewDirty } from './shared';
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
    listenerInternal(eventName, listenerFn, useCapture, eventTargetResolver);
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
    listenerInternal(eventName, listenerFn, useCapture, eventTargetResolver, loadComponentRenderer);
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
function listenerInternal(eventName, listenerFn, useCapture, eventTargetResolver, loadRendererFn) {
    if (useCapture === void 0) { useCapture = false; }
    var lView = getLView();
    var tNode = getPreviousOrParentTNode();
    var tView = lView[TVIEW];
    var firstTemplatePass = tView.firstTemplatePass;
    var tCleanup = firstTemplatePass && (tView.cleanup || (tView.cleanup = []));
    ngDevMode && assertNodeOfPossibleTypes(tNode, 3 /* Element */, 0 /* Container */, 4 /* ElementContainer */);
    var processOutputs = true;
    // add native event listener - applicable to elements only
    if (tNode.type === 3 /* Element */) {
        var native = getNativeByTNode(tNode, lView);
        var resolved = eventTargetResolver ? eventTargetResolver(native) : EMPTY_OBJ;
        var target = resolved.target || native;
        var renderer = loadRendererFn ? loadRendererFn(tNode, lView) : lView[RENDERER];
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
            if (!eventTargetResolver && hasDirectives(tNode)) {
                existingListener = findExistingListener(lView, eventName, tNode.index);
            }
            if (existingListener !== null) {
                // Attach a new listener at the head of the coalesced listeners list.
                listenerFn.__ngNextListenerFn__ = existingListener.__ngNextListenerFn__;
                existingListener.__ngNextListenerFn__ = listenerFn;
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
    if (tNode.outputs === undefined) {
        // if we create TNode here, inputs must be undefined so we know they still need to be
        // checked
        tNode.outputs = generatePropertyAliases(tView, tNode, 1 /* Output */);
    }
    var outputs = tNode.outputs;
    var props;
    if (processOutputs && outputs && (props = outputs[eventName])) {
        var propsLength = props.length;
        if (propsLength) {
            var lCleanup = getCleanup(lView);
            for (var i = 0; i < propsLength; i += 3) {
                var index = props[i];
                ngDevMode && assertDataInRange(lView, index);
                var minifiedName = props[i + 2];
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
            getComponentViewByIndex(tNode.index, lView) :
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGlzdGVuZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2luc3RydWN0aW9ucy9saXN0ZW5lci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFHSCxPQUFPLEVBQUMsaUJBQWlCLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUNwRCxPQUFPLEVBQUMsWUFBWSxFQUFDLE1BQU0saUJBQWlCLENBQUM7QUFDN0MsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUVuQyxPQUFPLEVBQTRDLG9CQUFvQixFQUFDLE1BQU0sd0JBQXdCLENBQUM7QUFDdkcsT0FBTyxFQUFDLE9BQU8sRUFBRSxLQUFLLEVBQXFCLFFBQVEsRUFBRSxLQUFLLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUN0RixPQUFPLEVBQUMseUJBQXlCLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUN6RCxPQUFPLEVBQUMsUUFBUSxFQUFFLHdCQUF3QixFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQzVELE9BQU8sRUFBQyx1QkFBdUIsRUFBRSxnQkFBZ0IsRUFBRSxhQUFhLEVBQUUsV0FBVyxFQUFDLE1BQU0sb0JBQW9CLENBQUM7QUFDekcsT0FBTyxFQUFtQix1QkFBdUIsRUFBRSxVQUFVLEVBQUUsV0FBVyxFQUFFLHFCQUFxQixFQUFFLGFBQWEsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUVsSTs7Ozs7Ozs7Ozs7OztHQWFHO0FBQ0gsTUFBTSxVQUFVLFVBQVUsQ0FDdEIsU0FBaUIsRUFBRSxVQUE0QixFQUFFLFVBQWtCLEVBQ25FLG1CQUEwQztJQURPLDJCQUFBLEVBQUEsa0JBQWtCO0lBRXJFLGdCQUFnQixDQUFDLFNBQVMsRUFBRSxVQUFVLEVBQUUsVUFBVSxFQUFFLG1CQUFtQixDQUFDLENBQUM7QUFDM0UsQ0FBQztBQUVEOzs7Ozs7Ozs7Ozs7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QztRQUNwRSwwRkFBMEY7UUFDMUYsdUNBQXVDO1FBQ3ZDLElBQUksY0FBYyxHQUFTLHlDQUEwQyxDQUFDLG9CQUFvQixDQUFDO1FBQzNGLE9BQU8sY0FBYyxFQUFFO1lBQ3JCLDRFQUE0RTtZQUM1RSxNQUFNLEdBQUcsZ0NBQWdDLENBQUMsS0FBSyxFQUFFLGNBQWMsRUFBRSxDQUFDLENBQUMsSUFBSSxNQUFNLENBQUM7WUFDOUUsY0FBYyxHQUFTLGNBQWUsQ0FBQyxvQkFBb0IsQ0FBQztTQUM3RDtRQUVELElBQUksc0JBQXNCLElBQUksTUFBTSxLQUFLLEtBQUssRUFBRTtZQUM5QyxDQUFDLENBQUMsY0FBYyxFQUFFLENBQUM7WUFDbkIsNEVBQTRFO1lBQzVFLENBQUMsQ0FBQyxXQUFXLEdBQUcsS0FBSyxDQUFDO1NBQ3ZCO1FBRUQsT0FBTyxNQUFNLENBQUM7SUFDaEIsQ0FBQyxDQUFDO0FBQ0osQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuXG5pbXBvcnQge2Fzc2VydERhdGFJblJhbmdlfSBmcm9tICcuLi8uLi91dGlsL2Fzc2VydCc7XG5pbXBvcnQge2lzT2JzZXJ2YWJsZX0gZnJvbSAnLi4vLi4vdXRpbC9sYW5nJztcbmltcG9ydCB7RU1QVFlfT0JKfSBmcm9tICcuLi9lbXB0eSc7XG5pbXBvcnQge1Byb3BlcnR5QWxpYXNWYWx1ZSwgVE5vZGUsIFROb2RlRmxhZ3MsIFROb2RlVHlwZX0gZnJvbSAnLi4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7R2xvYmFsVGFyZ2V0UmVzb2x2ZXIsIFJFbGVtZW50LCBSZW5kZXJlcjMsIGlzUHJvY2VkdXJhbFJlbmRlcmVyfSBmcm9tICcuLi9pbnRlcmZhY2VzL3JlbmRlcmVyJztcbmltcG9ydCB7Q0xFQU5VUCwgRkxBR1MsIExWaWV3LCBMVmlld0ZsYWdzLCBSRU5ERVJFUiwgVFZJRVd9IGZyb20gJy4uL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2Fzc2VydE5vZGVPZlBvc3NpYmxlVHlwZXN9IGZyb20gJy4uL25vZGVfYXNzZXJ0JztcbmltcG9ydCB7Z2V0TFZpZXcsIGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZX0gZnJvbSAnLi4vc3RhdGUnO1xuaW1wb3J0IHtnZXRDb21wb25lbnRWaWV3QnlJbmRleCwgZ2V0TmF0aXZlQnlUTm9kZSwgaGFzRGlyZWN0aXZlcywgdW53cmFwUk5vZGV9IGZyb20gJy4uL3V0aWwvdmlld191dGlscyc7XG5pbXBvcnQge0JpbmRpbmdEaXJlY3Rpb24sIGdlbmVyYXRlUHJvcGVydHlBbGlhc2VzLCBnZXRDbGVhbnVwLCBoYW5kbGVFcnJvciwgbG9hZENvbXBvbmVudFJlbmRlcmVyLCBtYXJrVmlld0RpcnR5fSBmcm9tICcuL3NoYXJlZCc7XG5cbi8qKlxuICogQWRkcyBhbiBldmVudCBsaXN0ZW5lciB0byB0aGUgY3VycmVudCBub2RlLlxuICpcbiAqIElmIGFuIG91dHB1dCBleGlzdHMgb24gb25lIG9mIHRoZSBub2RlJ3MgZGlyZWN0aXZlcywgaXQgYWxzbyBzdWJzY3JpYmVzIHRvIHRoZSBvdXRwdXRcbiAqIGFuZCBzYXZlcyB0aGUgc3Vic2NyaXB0aW9uIGZvciBsYXRlciBjbGVhbnVwLlxuICpcbiAqIEBwYXJhbSBldmVudE5hbWUgTmFtZSBvZiB0aGUgZXZlbnRcbiAqIEBwYXJhbSBsaXN0ZW5lckZuIFRoZSBmdW5jdGlvbiB0byBiZSBjYWxsZWQgd2hlbiBldmVudCBlbWl0c1xuICogQHBhcmFtIHVzZUNhcHR1cmUgV2hldGhlciBvciBub3QgdG8gdXNlIGNhcHR1cmUgaW4gZXZlbnQgbGlzdGVuZXJcbiAqIEBwYXJhbSBldmVudFRhcmdldFJlc29sdmVyIEZ1bmN0aW9uIHRoYXQgcmV0dXJucyBnbG9iYWwgdGFyZ2V0IGluZm9ybWF0aW9uIGluIGNhc2UgdGhpcyBsaXN0ZW5lclxuICogc2hvdWxkIGJlIGF0dGFjaGVkIHRvIGEgZ2xvYmFsIG9iamVjdCBsaWtlIHdpbmRvdywgZG9jdW1lbnQgb3IgYm9keVxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1bGlzdGVuZXIoXG4gICAgZXZlbnROYW1lOiBzdHJpbmcsIGxpc3RlbmVyRm46IChlPzogYW55KSA9PiBhbnksIHVzZUNhcHR1cmUgPSBmYWxzZSxcbiAgICBldmVudFRhcmdldFJlc29sdmVyPzogR2xvYmFsVGFyZ2V0UmVzb2x2ZXIpOiB2b2lkIHtcbiAgbGlzdGVuZXJJbnRlcm5hbChldmVudE5hbWUsIGxpc3RlbmVyRm4sIHVzZUNhcHR1cmUsIGV2ZW50VGFyZ2V0UmVzb2x2ZXIpO1xufVxuXG4vKipcbiogUmVnaXN0ZXJzIGEgc3ludGhldGljIGhvc3QgbGlzdGVuZXIgKGUuZy4gYChAZm9vLnN0YXJ0KWApIG9uIGEgY29tcG9uZW50LlxuKlxuKiBUaGlzIGluc3RydWN0aW9uIGlzIGZvciBjb21wYXRpYmlsaXR5IHB1cnBvc2VzIGFuZCBpcyBkZXNpZ25lZCB0byBlbnN1cmUgdGhhdCBhXG4qIHN5bnRoZXRpYyBob3N0IGxpc3RlbmVyIChlLmcuIGBASG9zdExpc3RlbmVyKCdAZm9vLnN0YXJ0JylgKSBwcm9wZXJseSBnZXRzIHJlbmRlcmVkXG4qIGluIHRoZSBjb21wb25lbnQncyByZW5kZXJlci4gTm9ybWFsbHkgYWxsIGhvc3QgbGlzdGVuZXJzIGFyZSBldmFsdWF0ZWQgd2l0aCB0aGVcbiogcGFyZW50IGNvbXBvbmVudCdzIHJlbmRlcmVyLCBidXQsIGluIHRoZSBjYXNlIG9mIGFuaW1hdGlvbiBAdHJpZ2dlcnMsIHRoZXkgbmVlZFxuKiB0byBiZSBldmFsdWF0ZWQgd2l0aCB0aGUgc3ViIGNvbXBvbmVudCdzIHJlbmRlcmVyIChiZWNhdXNlIHRoYXQncyB3aGVyZSB0aGVcbiogYW5pbWF0aW9uIHRyaWdnZXJzIGFyZSBkZWZpbmVkKS5cbipcbiogRG8gbm90IHVzZSB0aGlzIGluc3RydWN0aW9uIGFzIGEgcmVwbGFjZW1lbnQgZm9yIGBsaXN0ZW5lcmAuIFRoaXMgaW5zdHJ1Y3Rpb25cbiogb25seSBleGlzdHMgdG8gZW5zdXJlIGNvbXBhdGliaWxpdHkgd2l0aCB0aGUgVmlld0VuZ2luZSdzIGhvc3QgYmluZGluZyBiZWhhdmlvci5cbipcbiogQHBhcmFtIGV2ZW50TmFtZSBOYW1lIG9mIHRoZSBldmVudFxuKiBAcGFyYW0gbGlzdGVuZXJGbiBUaGUgZnVuY3Rpb24gdG8gYmUgY2FsbGVkIHdoZW4gZXZlbnQgZW1pdHNcbiogQHBhcmFtIHVzZUNhcHR1cmUgV2hldGhlciBvciBub3QgdG8gdXNlIGNhcHR1cmUgaW4gZXZlbnQgbGlzdGVuZXJcbiogQHBhcmFtIGV2ZW50VGFyZ2V0UmVzb2x2ZXIgRnVuY3Rpb24gdGhhdCByZXR1cm5zIGdsb2JhbCB0YXJnZXQgaW5mb3JtYXRpb24gaW4gY2FzZSB0aGlzIGxpc3RlbmVyXG4qIHNob3VsZCBiZSBhdHRhY2hlZCB0byBhIGdsb2JhbCBvYmplY3QgbGlrZSB3aW5kb3csIGRvY3VtZW50IG9yIGJvZHlcbiAqXG4gKiBAY29kZUdlbkFwaVxuKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1Y29tcG9uZW50SG9zdFN5bnRoZXRpY0xpc3RlbmVyKFxuICAgIGV2ZW50TmFtZTogc3RyaW5nLCBsaXN0ZW5lckZuOiAoZT86IGFueSkgPT4gYW55LCB1c2VDYXB0dXJlID0gZmFsc2UsXG4gICAgZXZlbnRUYXJnZXRSZXNvbHZlcj86IEdsb2JhbFRhcmdldFJlc29sdmVyKTogdm9pZCB7XG4gIGxpc3RlbmVySW50ZXJuYWwoZXZlbnROYW1lLCBsaXN0ZW5lckZuLCB1c2VDYXB0dXJlLCBldmVudFRhcmdldFJlc29sdmVyLCBsb2FkQ29tcG9uZW50UmVuZGVyZXIpO1xufVxuXG4vKipcbiAqIEEgdXRpbGl0eSBmdW5jdGlvbiB0aGF0IGNoZWNrcyBpZiBhIGdpdmVuIGVsZW1lbnQgaGFzIGFscmVhZHkgYW4gZXZlbnQgaGFuZGxlciByZWdpc3RlcmVkIGZvciBhblxuICogZXZlbnQgd2l0aCBhIHNwZWNpZmllZCBuYW1lLiBUaGUgVFZpZXcuY2xlYW51cCBkYXRhIHN0cnVjdHVyZSBpcyB1c2VkIHRvIGZpbmQgb3V0IHdoaWNoIGV2ZW50c1xuICogYXJlIHJlZ2lzdGVyZWQgZm9yIGEgZ2l2ZW4gZWxlbWVudC5cbiAqL1xuZnVuY3Rpb24gZmluZEV4aXN0aW5nTGlzdGVuZXIoXG4gICAgbFZpZXc6IExWaWV3LCBldmVudE5hbWU6IHN0cmluZywgdE5vZGVJZHg6IG51bWJlcik6ICgoZT86IGFueSkgPT4gYW55KXxudWxsIHtcbiAgY29uc3QgdFZpZXcgPSBsVmlld1tUVklFV107XG4gIGNvbnN0IHRDbGVhbnVwID0gdFZpZXcuY2xlYW51cDtcbiAgaWYgKHRDbGVhbnVwICE9IG51bGwpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRDbGVhbnVwLmxlbmd0aCAtIDE7IGkgKz0gMikge1xuICAgICAgY29uc3QgY2xlYW51cEV2ZW50TmFtZSA9IHRDbGVhbnVwW2ldO1xuICAgICAgaWYgKGNsZWFudXBFdmVudE5hbWUgPT09IGV2ZW50TmFtZSAmJiB0Q2xlYW51cFtpICsgMV0gPT09IHROb2RlSWR4KSB7XG4gICAgICAgIC8vIFdlIGhhdmUgZm91bmQgYSBtYXRjaGluZyBldmVudCBuYW1lIG9uIHRoZSBzYW1lIG5vZGUgYnV0IGl0IG1pZ2h0IG5vdCBoYXZlIGJlZW5cbiAgICAgICAgLy8gcmVnaXN0ZXJlZCB5ZXQsIHNvIHdlIG11c3QgZXhwbGljaXRseSB2ZXJpZnkgZW50cmllcyBpbiB0aGUgTFZpZXcgY2xlYW51cCBkYXRhXG4gICAgICAgIC8vIHN0cnVjdHVyZXMuXG4gICAgICAgIGNvbnN0IGxDbGVhbnVwID0gbFZpZXdbQ0xFQU5VUF0gITtcbiAgICAgICAgY29uc3QgbGlzdGVuZXJJZHhJbkxDbGVhbnVwID0gdENsZWFudXBbaSArIDJdO1xuICAgICAgICByZXR1cm4gbENsZWFudXAubGVuZ3RoID4gbGlzdGVuZXJJZHhJbkxDbGVhbnVwID8gbENsZWFudXBbbGlzdGVuZXJJZHhJbkxDbGVhbnVwXSA6IG51bGw7XG4gICAgICB9XG4gICAgICAvLyBUVmlldy5jbGVhbnVwIGNhbiBoYXZlIGEgbWl4IG9mIDQtZWxlbWVudHMgZW50cmllcyAoZm9yIGV2ZW50IGhhbmRsZXIgY2xlYW51cHMpIG9yXG4gICAgICAvLyAyLWVsZW1lbnQgZW50cmllcyAoZm9yIGRpcmVjdGl2ZSBhbmQgcXVlcmllcyBkZXN0cm95IGhvb2tzKS4gQXMgc3VjaCB3ZSBjYW4gZW5jb3VudGVyXG4gICAgICAvLyBibG9ja3Mgb2YgNCBvciAyIGl0ZW1zIGluIHRoZSB0Vmlldy5jbGVhbnVwIGFuZCB0aGlzIGlzIHdoeSB3ZSBpdGVyYXRlIG92ZXIgMiBlbGVtZW50c1xuICAgICAgLy8gZmlyc3QgYW5kIGp1bXAgYW5vdGhlciAyIGVsZW1lbnRzIGlmIHdlIGRldGVjdCBsaXN0ZW5lcnMgY2xlYW51cCAoNCBlbGVtZW50cykuIEFsc28gY2hlY2tcbiAgICAgIC8vIGRvY3VtZW50YXRpb24gb2YgVFZpZXcuY2xlYW51cCBmb3IgbW9yZSBkZXRhaWxzIG9mIHRoaXMgZGF0YSBzdHJ1Y3R1cmUgbGF5b3V0LlxuICAgICAgaWYgKHR5cGVvZiBjbGVhbnVwRXZlbnROYW1lID09PSAnc3RyaW5nJykge1xuICAgICAgICBpICs9IDI7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG5mdW5jdGlvbiBsaXN0ZW5lckludGVybmFsKFxuICAgIGV2ZW50TmFtZTogc3RyaW5nLCBsaXN0ZW5lckZuOiAoZT86IGFueSkgPT4gYW55LCB1c2VDYXB0dXJlID0gZmFsc2UsXG4gICAgZXZlbnRUYXJnZXRSZXNvbHZlcj86IEdsb2JhbFRhcmdldFJlc29sdmVyLFxuICAgIGxvYWRSZW5kZXJlckZuPzogKCh0Tm9kZTogVE5vZGUsIGxWaWV3OiBMVmlldykgPT4gUmVuZGVyZXIzKSB8IG51bGwpOiB2b2lkIHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCB0Tm9kZSA9IGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSgpO1xuICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgY29uc3QgZmlyc3RUZW1wbGF0ZVBhc3MgPSB0Vmlldy5maXJzdFRlbXBsYXRlUGFzcztcbiAgY29uc3QgdENsZWFudXA6IGZhbHNlfGFueVtdID0gZmlyc3RUZW1wbGF0ZVBhc3MgJiYgKHRWaWV3LmNsZWFudXAgfHwgKHRWaWV3LmNsZWFudXAgPSBbXSkpO1xuXG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlT2ZQb3NzaWJsZVR5cGVzKFxuICAgICAgICAgICAgICAgICAgIHROb2RlLCBUTm9kZVR5cGUuRWxlbWVudCwgVE5vZGVUeXBlLkNvbnRhaW5lciwgVE5vZGVUeXBlLkVsZW1lbnRDb250YWluZXIpO1xuXG4gIGxldCBwcm9jZXNzT3V0cHV0cyA9IHRydWU7XG5cbiAgLy8gYWRkIG5hdGl2ZSBldmVudCBsaXN0ZW5lciAtIGFwcGxpY2FibGUgdG8gZWxlbWVudHMgb25seVxuICBpZiAodE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkVsZW1lbnQpIHtcbiAgICBjb25zdCBuYXRpdmUgPSBnZXROYXRpdmVCeVROb2RlKHROb2RlLCBsVmlldykgYXMgUkVsZW1lbnQ7XG4gICAgY29uc3QgcmVzb2x2ZWQgPSBldmVudFRhcmdldFJlc29sdmVyID8gZXZlbnRUYXJnZXRSZXNvbHZlcihuYXRpdmUpIDogRU1QVFlfT0JKIGFzIGFueTtcbiAgICBjb25zdCB0YXJnZXQgPSByZXNvbHZlZC50YXJnZXQgfHwgbmF0aXZlO1xuICAgIGNvbnN0IHJlbmRlcmVyID0gbG9hZFJlbmRlcmVyRm4gPyBsb2FkUmVuZGVyZXJGbih0Tm9kZSwgbFZpZXcpIDogbFZpZXdbUkVOREVSRVJdO1xuICAgIGNvbnN0IGxDbGVhbnVwID0gZ2V0Q2xlYW51cChsVmlldyk7XG4gICAgY29uc3QgbENsZWFudXBJbmRleCA9IGxDbGVhbnVwLmxlbmd0aDtcbiAgICBjb25zdCBpZHhPclRhcmdldEdldHRlciA9IGV2ZW50VGFyZ2V0UmVzb2x2ZXIgP1xuICAgICAgICAoX2xWaWV3OiBMVmlldykgPT4gZXZlbnRUYXJnZXRSZXNvbHZlcih1bndyYXBSTm9kZShfbFZpZXdbdE5vZGUuaW5kZXhdKSkudGFyZ2V0IDpcbiAgICAgICAgdE5vZGUuaW5kZXg7XG5cbiAgICAvLyBJbiBvcmRlciB0byBtYXRjaCBjdXJyZW50IGJlaGF2aW9yLCBuYXRpdmUgRE9NIGV2ZW50IGxpc3RlbmVycyBtdXN0IGJlIGFkZGVkIGZvciBhbGxcbiAgICAvLyBldmVudHMgKGluY2x1ZGluZyBvdXRwdXRzKS5cbiAgICBpZiAoaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpKSB7XG4gICAgICAvLyBUaGVyZSBtaWdodCBiZSBjYXNlcyB3aGVyZSBtdWx0aXBsZSBkaXJlY3RpdmVzIG9uIHRoZSBzYW1lIGVsZW1lbnQgdHJ5IHRvIHJlZ2lzdGVyIGFuIGV2ZW50XG4gICAgICAvLyBoYW5kbGVyIGZ1bmN0aW9uIGZvciB0aGUgc2FtZSBldmVudC4gSW4gdGhpcyBzaXR1YXRpb24gd2Ugd2FudCB0byBhdm9pZCByZWdpc3RyYXRpb24gb2ZcbiAgICAgIC8vIHNldmVyYWwgbmF0aXZlIGxpc3RlbmVycyBhcyBlYWNoIHJlZ2lzdHJhdGlvbiB3b3VsZCBiZSBpbnRlcmNlcHRlZCBieSBOZ1pvbmUgYW5kXG4gICAgICAvLyB0cmlnZ2VyIGNoYW5nZSBkZXRlY3Rpb24uIFRoaXMgd291bGQgbWVhbiB0aGF0IGEgc2luZ2xlIHVzZXIgYWN0aW9uIHdvdWxkIHJlc3VsdCBpbiBzZXZlcmFsXG4gICAgICAvLyBjaGFuZ2UgZGV0ZWN0aW9ucyBiZWluZyBpbnZva2VkLiBUbyBhdm9pZCB0aGlzIHNpdHVhdGlvbiB3ZSB3YW50IHRvIGhhdmUgb25seSBvbmUgY2FsbCB0b1xuICAgICAgLy8gbmF0aXZlIGhhbmRsZXIgcmVnaXN0cmF0aW9uIChmb3IgdGhlIHNhbWUgZWxlbWVudCBhbmQgc2FtZSB0eXBlIG9mIGV2ZW50KS5cbiAgICAgIC8vXG4gICAgICAvLyBJbiBvcmRlciB0byBoYXZlIGp1c3Qgb25lIG5hdGl2ZSBldmVudCBoYW5kbGVyIGluIHByZXNlbmNlIG9mIG11bHRpcGxlIGhhbmRsZXIgZnVuY3Rpb25zLFxuICAgICAgLy8gd2UganVzdCByZWdpc3RlciBhIGZpcnN0IGhhbmRsZXIgZnVuY3Rpb24gYXMgYSBuYXRpdmUgZXZlbnQgbGlzdGVuZXIgYW5kIHRoZW4gY2hhaW5cbiAgICAgIC8vIChjb2FsZXNjZSkgb3RoZXIgaGFuZGxlciBmdW5jdGlvbnMgb24gdG9wIG9mIHRoZSBmaXJzdCBuYXRpdmUgaGFuZGxlciBmdW5jdGlvbi5cbiAgICAgIGxldCBleGlzdGluZ0xpc3RlbmVyID0gbnVsbDtcbiAgICAgIC8vIFBsZWFzZSBub3RlIHRoYXQgdGhlIGNvYWxlc2NpbmcgZGVzY3JpYmVkIGhlcmUgZG9lc24ndCBoYXBwZW4gZm9yIGV2ZW50cyBzcGVjaWZ5aW5nIGFuXG4gICAgICAvLyBhbHRlcm5hdGl2ZSB0YXJnZXQgKGV4LiAoZG9jdW1lbnQ6Y2xpY2spKSAtIHRoaXMgaXMgdG8ga2VlcCBiYWNrd2FyZCBjb21wYXRpYmlsaXR5IHdpdGggdGhlXG4gICAgICAvLyB2aWV3IGVuZ2luZS5cbiAgICAgIC8vIEFsc28sIHdlIGRvbid0IGhhdmUgdG8gc2VhcmNoIGZvciBleGlzdGluZyBsaXN0ZW5lcnMgaXMgdGhlcmUgYXJlIG5vIGRpcmVjdGl2ZXNcbiAgICAgIC8vIG1hdGNoaW5nIG9uIGEgZ2l2ZW4gbm9kZSBhcyB3ZSBjYW4ndCByZWdpc3RlciBtdWx0aXBsZSBldmVudCBoYW5kbGVycyBmb3IgdGhlIHNhbWUgZXZlbnQgaW5cbiAgICAgIC8vIGEgdGVtcGxhdGUgKHRoaXMgd291bGQgbWVhbiBoYXZpbmcgZHVwbGljYXRlIGF0dHJpYnV0ZXMpLlxuICAgICAgaWYgKCFldmVudFRhcmdldFJlc29sdmVyICYmIGhhc0RpcmVjdGl2ZXModE5vZGUpKSB7XG4gICAgICAgIGV4aXN0aW5nTGlzdGVuZXIgPSBmaW5kRXhpc3RpbmdMaXN0ZW5lcihsVmlldywgZXZlbnROYW1lLCB0Tm9kZS5pbmRleCk7XG4gICAgICB9XG4gICAgICBpZiAoZXhpc3RpbmdMaXN0ZW5lciAhPT0gbnVsbCkge1xuICAgICAgICAvLyBBdHRhY2ggYSBuZXcgbGlzdGVuZXIgYXQgdGhlIGhlYWQgb2YgdGhlIGNvYWxlc2NlZCBsaXN0ZW5lcnMgbGlzdC5cbiAgICAgICAgKDxhbnk+bGlzdGVuZXJGbikuX19uZ05leHRMaXN0ZW5lckZuX18gPSAoPGFueT5leGlzdGluZ0xpc3RlbmVyKS5fX25nTmV4dExpc3RlbmVyRm5fXztcbiAgICAgICAgKDxhbnk+ZXhpc3RpbmdMaXN0ZW5lcikuX19uZ05leHRMaXN0ZW5lckZuX18gPSBsaXN0ZW5lckZuO1xuICAgICAgICBwcm9jZXNzT3V0cHV0cyA9IGZhbHNlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gVGhlIGZpcnN0IGFyZ3VtZW50IG9mIGBsaXN0ZW5gIGZ1bmN0aW9uIGluIFByb2NlZHVyYWwgUmVuZGVyZXIgaXM6XG4gICAgICAgIC8vIC0gZWl0aGVyIGEgdGFyZ2V0IG5hbWUgKGFzIGEgc3RyaW5nKSBpbiBjYXNlIG9mIGdsb2JhbCB0YXJnZXQgKHdpbmRvdywgZG9jdW1lbnQsIGJvZHkpXG4gICAgICAgIC8vIC0gb3IgZWxlbWVudCByZWZlcmVuY2UgKGluIGFsbCBvdGhlciBjYXNlcylcbiAgICAgICAgbGlzdGVuZXJGbiA9IHdyYXBMaXN0ZW5lcih0Tm9kZSwgbFZpZXcsIGxpc3RlbmVyRm4sIGZhbHNlIC8qKiBwcmV2ZW50RGVmYXVsdCAqLyk7XG4gICAgICAgIGNvbnN0IGNsZWFudXBGbiA9IHJlbmRlcmVyLmxpc3RlbihyZXNvbHZlZC5uYW1lIHx8IHRhcmdldCwgZXZlbnROYW1lLCBsaXN0ZW5lckZuKTtcbiAgICAgICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlckFkZEV2ZW50TGlzdGVuZXIrKztcblxuICAgICAgICBsQ2xlYW51cC5wdXNoKGxpc3RlbmVyRm4sIGNsZWFudXBGbik7XG4gICAgICAgIHRDbGVhbnVwICYmIHRDbGVhbnVwLnB1c2goZXZlbnROYW1lLCBpZHhPclRhcmdldEdldHRlciwgbENsZWFudXBJbmRleCwgbENsZWFudXBJbmRleCArIDEpO1xuICAgICAgfVxuXG4gICAgfSBlbHNlIHtcbiAgICAgIGxpc3RlbmVyRm4gPSB3cmFwTGlzdGVuZXIodE5vZGUsIGxWaWV3LCBsaXN0ZW5lckZuLCB0cnVlIC8qKiBwcmV2ZW50RGVmYXVsdCAqLyk7XG4gICAgICB0YXJnZXQuYWRkRXZlbnRMaXN0ZW5lcihldmVudE5hbWUsIGxpc3RlbmVyRm4sIHVzZUNhcHR1cmUpO1xuICAgICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlckFkZEV2ZW50TGlzdGVuZXIrKztcblxuICAgICAgbENsZWFudXAucHVzaChsaXN0ZW5lckZuKTtcbiAgICAgIHRDbGVhbnVwICYmIHRDbGVhbnVwLnB1c2goZXZlbnROYW1lLCBpZHhPclRhcmdldEdldHRlciwgbENsZWFudXBJbmRleCwgdXNlQ2FwdHVyZSk7XG4gICAgfVxuICB9XG5cbiAgLy8gc3Vic2NyaWJlIHRvIGRpcmVjdGl2ZSBvdXRwdXRzXG4gIGlmICh0Tm9kZS5vdXRwdXRzID09PSB1bmRlZmluZWQpIHtcbiAgICAvLyBpZiB3ZSBjcmVhdGUgVE5vZGUgaGVyZSwgaW5wdXRzIG11c3QgYmUgdW5kZWZpbmVkIHNvIHdlIGtub3cgdGhleSBzdGlsbCBuZWVkIHRvIGJlXG4gICAgLy8gY2hlY2tlZFxuICAgIHROb2RlLm91dHB1dHMgPSBnZW5lcmF0ZVByb3BlcnR5QWxpYXNlcyh0VmlldywgdE5vZGUsIEJpbmRpbmdEaXJlY3Rpb24uT3V0cHV0KTtcbiAgfVxuXG4gIGNvbnN0IG91dHB1dHMgPSB0Tm9kZS5vdXRwdXRzO1xuICBsZXQgcHJvcHM6IFByb3BlcnR5QWxpYXNWYWx1ZXx1bmRlZmluZWQ7XG4gIGlmIChwcm9jZXNzT3V0cHV0cyAmJiBvdXRwdXRzICYmIChwcm9wcyA9IG91dHB1dHNbZXZlbnROYW1lXSkpIHtcbiAgICBjb25zdCBwcm9wc0xlbmd0aCA9IHByb3BzLmxlbmd0aDtcbiAgICBpZiAocHJvcHNMZW5ndGgpIHtcbiAgICAgIGNvbnN0IGxDbGVhbnVwID0gZ2V0Q2xlYW51cChsVmlldyk7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHByb3BzTGVuZ3RoOyBpICs9IDMpIHtcbiAgICAgICAgY29uc3QgaW5kZXggPSBwcm9wc1tpXSBhcyBudW1iZXI7XG4gICAgICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREYXRhSW5SYW5nZShsVmlldywgaW5kZXgpO1xuICAgICAgICBjb25zdCBtaW5pZmllZE5hbWUgPSBwcm9wc1tpICsgMl07XG4gICAgICAgIGNvbnN0IGRpcmVjdGl2ZUluc3RhbmNlID0gbFZpZXdbaW5kZXhdO1xuICAgICAgICBjb25zdCBvdXRwdXQgPSBkaXJlY3RpdmVJbnN0YW5jZVttaW5pZmllZE5hbWVdO1xuXG4gICAgICAgIGlmIChuZ0Rldk1vZGUgJiYgIWlzT2JzZXJ2YWJsZShvdXRwdXQpKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgICAgICBgQE91dHB1dCAke21pbmlmaWVkTmFtZX0gbm90IGluaXRpYWxpemVkIGluICcke2RpcmVjdGl2ZUluc3RhbmNlLmNvbnN0cnVjdG9yLm5hbWV9Jy5gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHN1YnNjcmlwdGlvbiA9IG91dHB1dC5zdWJzY3JpYmUobGlzdGVuZXJGbik7XG4gICAgICAgIGNvbnN0IGlkeCA9IGxDbGVhbnVwLmxlbmd0aDtcbiAgICAgICAgbENsZWFudXAucHVzaChsaXN0ZW5lckZuLCBzdWJzY3JpcHRpb24pO1xuICAgICAgICB0Q2xlYW51cCAmJiB0Q2xlYW51cC5wdXNoKGV2ZW50TmFtZSwgdE5vZGUuaW5kZXgsIGlkeCwgLShpZHggKyAxKSk7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGV4ZWN1dGVMaXN0ZW5lcldpdGhFcnJvckhhbmRsaW5nKFxuICAgIGxWaWV3OiBMVmlldywgbGlzdGVuZXJGbjogKGU/OiBhbnkpID0+IGFueSwgZTogYW55KTogYm9vbGVhbiB7XG4gIHRyeSB7XG4gICAgLy8gT25seSBleHBsaWNpdGx5IHJldHVybmluZyBmYWxzZSBmcm9tIGEgbGlzdGVuZXIgc2hvdWxkIHByZXZlbnREZWZhdWx0XG4gICAgcmV0dXJuIGxpc3RlbmVyRm4oZSkgIT09IGZhbHNlO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGhhbmRsZUVycm9yKGxWaWV3LCBlcnJvcik7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG59XG5cbi8qKlxuICogV3JhcHMgYW4gZXZlbnQgbGlzdGVuZXIgd2l0aCBhIGZ1bmN0aW9uIHRoYXQgbWFya3MgYW5jZXN0b3JzIGRpcnR5IGFuZCBwcmV2ZW50cyBkZWZhdWx0IGJlaGF2aW9yLFxuICogaWYgYXBwbGljYWJsZS5cbiAqXG4gKiBAcGFyYW0gdE5vZGUgVGhlIFROb2RlIGFzc29jaWF0ZWQgd2l0aCB0aGlzIGxpc3RlbmVyXG4gKiBAcGFyYW0gbFZpZXcgVGhlIExWaWV3IHRoYXQgY29udGFpbnMgdGhpcyBsaXN0ZW5lclxuICogQHBhcmFtIGxpc3RlbmVyRm4gVGhlIGxpc3RlbmVyIGZ1bmN0aW9uIHRvIGNhbGxcbiAqIEBwYXJhbSB3cmFwV2l0aFByZXZlbnREZWZhdWx0IFdoZXRoZXIgb3Igbm90IHRvIHByZXZlbnQgZGVmYXVsdCBiZWhhdmlvclxuICogKHRoZSBwcm9jZWR1cmFsIHJlbmRlcmVyIGRvZXMgdGhpcyBhbHJlYWR5LCBzbyBpbiB0aG9zZSBjYXNlcywgd2Ugc2hvdWxkIHNraXApXG4gKi9cbmZ1bmN0aW9uIHdyYXBMaXN0ZW5lcihcbiAgICB0Tm9kZTogVE5vZGUsIGxWaWV3OiBMVmlldywgbGlzdGVuZXJGbjogKGU/OiBhbnkpID0+IGFueSxcbiAgICB3cmFwV2l0aFByZXZlbnREZWZhdWx0OiBib29sZWFuKTogRXZlbnRMaXN0ZW5lciB7XG4gIC8vIE5vdGU6IHdlIGFyZSBwZXJmb3JtaW5nIG1vc3Qgb2YgdGhlIHdvcmsgaW4gdGhlIGxpc3RlbmVyIGZ1bmN0aW9uIGl0c2VsZlxuICAvLyB0byBvcHRpbWl6ZSBsaXN0ZW5lciByZWdpc3RyYXRpb24uXG4gIHJldHVybiBmdW5jdGlvbiB3cmFwTGlzdGVuZXJJbl9tYXJrRGlydHlBbmRQcmV2ZW50RGVmYXVsdChlOiBhbnkpIHtcbiAgICAvLyBJdnkgdXNlcyBgRnVuY3Rpb25gIGFzIGEgc3BlY2lhbCB0b2tlbiB0aGF0IGFsbG93cyB1cyB0byB1bndyYXAgdGhlIGZ1bmN0aW9uXG4gICAgLy8gc28gdGhhdCBpdCBjYW4gYmUgaW52b2tlZCBwcm9ncmFtbWF0aWNhbGx5IGJ5IGBEZWJ1Z05vZGUudHJpZ2dlckV2ZW50SGFuZGxlcmAuXG4gICAgaWYgKGUgPT09IEZ1bmN0aW9uKSB7XG4gICAgICByZXR1cm4gbGlzdGVuZXJGbjtcbiAgICB9XG5cbiAgICAvLyBJbiBvcmRlciB0byBiZSBiYWNrd2FyZHMgY29tcGF0aWJsZSB3aXRoIFZpZXcgRW5naW5lLCBldmVudHMgb24gY29tcG9uZW50IGhvc3Qgbm9kZXNcbiAgICAvLyBtdXN0IGFsc28gbWFyayB0aGUgY29tcG9uZW50IHZpZXcgaXRzZWxmIGRpcnR5IChpLmUuIHRoZSB2aWV3IHRoYXQgaXQgb3ducykuXG4gICAgY29uc3Qgc3RhcnRWaWV3ID0gdE5vZGUuZmxhZ3MgJiBUTm9kZUZsYWdzLmlzQ29tcG9uZW50SG9zdCA/XG4gICAgICAgIGdldENvbXBvbmVudFZpZXdCeUluZGV4KHROb2RlLmluZGV4LCBsVmlldykgOlxuICAgICAgICBsVmlldztcblxuICAgIC8vIFNlZSBpbnRlcmZhY2VzL3ZpZXcudHMgZm9yIG1vcmUgb24gTFZpZXdGbGFncy5NYW51YWxPblB1c2hcbiAgICBpZiAoKGxWaWV3W0ZMQUdTXSAmIExWaWV3RmxhZ3MuTWFudWFsT25QdXNoKSA9PT0gMCkge1xuICAgICAgbWFya1ZpZXdEaXJ0eShzdGFydFZpZXcpO1xuICAgIH1cblxuICAgIGxldCByZXN1bHQgPSBleGVjdXRlTGlzdGVuZXJXaXRoRXJyb3JIYW5kbGluZyhsVmlldywgbGlzdGVuZXJGbiwgZSk7XG4gICAgLy8gQSBqdXN0LWludm9rZWQgbGlzdGVuZXIgZnVuY3Rpb24gbWlnaHQgaGF2ZSBjb2FsZXNjZWQgbGlzdGVuZXJzIHNvIHdlIG5lZWQgdG8gY2hlY2sgZm9yXG4gICAgLy8gdGhlaXIgcHJlc2VuY2UgYW5kIGludm9rZSBhcyBuZWVkZWQuXG4gICAgbGV0IG5leHRMaXN0ZW5lckZuID0gKDxhbnk+d3JhcExpc3RlbmVySW5fbWFya0RpcnR5QW5kUHJldmVudERlZmF1bHQpLl9fbmdOZXh0TGlzdGVuZXJGbl9fO1xuICAgIHdoaWxlIChuZXh0TGlzdGVuZXJGbikge1xuICAgICAgLy8gV2Ugc2hvdWxkIHByZXZlbnQgZGVmYXVsdCBpZiBhbnkgb2YgdGhlIGxpc3RlbmVycyBleHBsaWNpdGx5IHJldHVybiBmYWxzZVxuICAgICAgcmVzdWx0ID0gZXhlY3V0ZUxpc3RlbmVyV2l0aEVycm9ySGFuZGxpbmcobFZpZXcsIG5leHRMaXN0ZW5lckZuLCBlKSAmJiByZXN1bHQ7XG4gICAgICBuZXh0TGlzdGVuZXJGbiA9ICg8YW55Pm5leHRMaXN0ZW5lckZuKS5fX25nTmV4dExpc3RlbmVyRm5fXztcbiAgICB9XG5cbiAgICBpZiAod3JhcFdpdGhQcmV2ZW50RGVmYXVsdCAmJiByZXN1bHQgPT09IGZhbHNlKSB7XG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAvLyBOZWNlc3NhcnkgZm9yIGxlZ2FjeSBicm93c2VycyB0aGF0IGRvbid0IHN1cHBvcnQgcHJldmVudERlZmF1bHQgKGUuZy4gSUUpXG4gICAgICBlLnJldHVyblZhbHVlID0gZmFsc2U7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfTtcbn1cbiJdfQ==