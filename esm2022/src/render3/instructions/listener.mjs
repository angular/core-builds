/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { setActiveConsumer } from '@angular/core/primitives/signals';
import { assertIndexInRange } from '../../util/assert';
import { isDirectiveHost } from '../interfaces/type_checks';
import { CLEANUP, CONTEXT, RENDERER } from '../interfaces/view';
import { assertTNodeType } from '../node_assert';
import { profiler } from '../profiler';
import { getCurrentDirectiveDef, getCurrentTNode, getLView, getTView } from '../state';
import { getComponentLViewByIndex, getNativeByTNode, unwrapRNode } from '../util/view_utils';
import { markViewDirty } from './mark_view_dirty';
import { getOrCreateLViewCleanup, getOrCreateTViewCleanup, handleError, loadComponentRenderer, } from './shared';
/**
 * Adds an event listener to the current node.
 *
 * If an output exists on one of the node's directives, it also subscribes to the output
 * and saves the subscription for later cleanup.
 *
 * @param eventName Name of the event
 * @param listenerFn The function to be called when event emits
 * @param useCapture Whether or not to use capture in event listener - this argument is a reminder
 *     from the Renderer3 infrastructure and should be removed from the instruction arguments
 * @param eventTargetResolver Function that returns global target information in case this listener
 * should be attached to a global object like window, document or body
 *
 * @codeGenApi
 */
export function ɵɵlistener(eventName, listenerFn, useCapture, eventTargetResolver) {
    const lView = getLView();
    const tView = getTView();
    const tNode = getCurrentTNode();
    listenerInternal(tView, lView, lView[RENDERER], tNode, eventName, listenerFn, eventTargetResolver);
    return ɵɵlistener;
}
/**
 * Registers a synthetic host listener (e.g. `(@foo.start)`) on a component or directive.
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
export function ɵɵsyntheticHostListener(eventName, listenerFn) {
    const tNode = getCurrentTNode();
    const lView = getLView();
    const tView = getTView();
    const currentDef = getCurrentDirectiveDef(tView.data);
    const renderer = loadComponentRenderer(currentDef, tNode, lView);
    listenerInternal(tView, lView, renderer, tNode, eventName, listenerFn);
    return ɵɵsyntheticHostListener;
}
/**
 * A utility function that checks if a given element has already an event handler registered for an
 * event with a specified name. The TView.cleanup data structure is used to find out which events
 * are registered for a given element.
 */
function findExistingListener(tView, lView, eventName, tNodeIdx) {
    const tCleanup = tView.cleanup;
    if (tCleanup != null) {
        for (let i = 0; i < tCleanup.length - 1; i += 2) {
            const cleanupEventName = tCleanup[i];
            if (cleanupEventName === eventName && tCleanup[i + 1] === tNodeIdx) {
                // We have found a matching event name on the same node but it might not have been
                // registered yet, so we must explicitly verify entries in the LView cleanup data
                // structures.
                const lCleanup = lView[CLEANUP];
                const listenerIdxInLCleanup = tCleanup[i + 2];
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
export function listenerInternal(tView, lView, renderer, tNode, eventName, listenerFn, eventTargetResolver) {
    const isTNodeDirectiveHost = isDirectiveHost(tNode);
    const firstCreatePass = tView.firstCreatePass;
    const tCleanup = firstCreatePass && getOrCreateTViewCleanup(tView);
    const context = lView[CONTEXT];
    // When the ɵɵlistener instruction was generated and is executed we know that there is either a
    // native listener or a directive output on this element. As such we we know that we will have to
    // register a listener and store its cleanup function on LView.
    const lCleanup = getOrCreateLViewCleanup(lView);
    ngDevMode && assertTNodeType(tNode, 3 /* TNodeType.AnyRNode */ | 12 /* TNodeType.AnyContainer */);
    let processOutputs = true;
    // Adding a native event listener is applicable when:
    // - The corresponding TNode represents a DOM element.
    // - The event target has a resolver (usually resulting in a global object,
    //   such as `window` or `document`).
    if (tNode.type & 3 /* TNodeType.AnyRNode */ || eventTargetResolver) {
        const native = getNativeByTNode(tNode, lView);
        const target = eventTargetResolver ? eventTargetResolver(native) : native;
        const lCleanupIndex = lCleanup.length;
        const idxOrTargetGetter = eventTargetResolver
            ? (_lView) => eventTargetResolver(unwrapRNode(_lView[tNode.index]))
            : tNode.index;
        // In order to match current behavior, native DOM event listeners must be added for all
        // events (including outputs).
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
        let existingListener = null;
        // Please note that the coalescing described here doesn't happen for events specifying an
        // alternative target (ex. (document:click)) - this is to keep backward compatibility with the
        // view engine.
        // Also, we don't have to search for existing listeners is there are no directives
        // matching on a given node as we can't register multiple event handlers for the same event in
        // a template (this would mean having duplicate attributes).
        if (!eventTargetResolver && isTNodeDirectiveHost) {
            existingListener = findExistingListener(tView, lView, eventName, tNode.index);
        }
        if (existingListener !== null) {
            // Attach a new listener to coalesced listeners list, maintaining the order in which
            // listeners are registered. For performance reasons, we keep a reference to the last
            // listener in that list (in `__ngLastListenerFn__` field), so we can avoid going through
            // the entire set each time we need to add a new listener.
            const lastListenerFn = existingListener.__ngLastListenerFn__ || existingListener;
            lastListenerFn.__ngNextListenerFn__ = listenerFn;
            existingListener.__ngLastListenerFn__ = listenerFn;
            processOutputs = false;
        }
        else {
            listenerFn = wrapListener(tNode, lView, context, listenerFn, false /** preventDefault */);
            const cleanupFn = renderer.listen(target, eventName, listenerFn);
            ngDevMode && ngDevMode.rendererAddEventListener++;
            lCleanup.push(listenerFn, cleanupFn);
            tCleanup && tCleanup.push(eventName, idxOrTargetGetter, lCleanupIndex, lCleanupIndex + 1);
        }
    }
    else {
        // Even if there is no native listener to add, we still need to wrap the listener so that OnPush
        // ancestors are marked dirty when an event occurs.
        listenerFn = wrapListener(tNode, lView, context, listenerFn, false /** preventDefault */);
    }
    // subscribe to directive outputs
    const outputs = tNode.outputs;
    let props;
    if (processOutputs && outputs !== null && (props = outputs[eventName])) {
        const propsLength = props.length;
        if (propsLength) {
            for (let i = 0; i < propsLength; i += 2) {
                const index = props[i];
                ngDevMode && assertIndexInRange(lView, index);
                const minifiedName = props[i + 1];
                const directiveInstance = lView[index];
                const output = directiveInstance[minifiedName];
                if (ngDevMode && !isOutputSubscribable(output)) {
                    throw new Error(`@Output ${minifiedName} not initialized in '${directiveInstance.constructor.name}'.`);
                }
                const subscription = output.subscribe(listenerFn);
                const idx = lCleanup.length;
                lCleanup.push(listenerFn, subscription);
                tCleanup && tCleanup.push(eventName, tNode.index, idx, -(idx + 1));
            }
        }
    }
}
function executeListenerWithErrorHandling(lView, context, listenerFn, e) {
    const prevConsumer = setActiveConsumer(null);
    try {
        profiler(6 /* ProfilerEvent.OutputStart */, context, listenerFn);
        // Only explicitly returning false from a listener should preventDefault
        return listenerFn(e) !== false;
    }
    catch (error) {
        handleError(lView, error);
        return false;
    }
    finally {
        profiler(7 /* ProfilerEvent.OutputEnd */, context, listenerFn);
        setActiveConsumer(prevConsumer);
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
function wrapListener(tNode, lView, context, listenerFn, wrapWithPreventDefault) {
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
        const startView = tNode.componentOffset > -1 ? getComponentLViewByIndex(tNode.index, lView) : lView;
        markViewDirty(startView, 6 /* NotificationSource.Listener */);
        let result = executeListenerWithErrorHandling(lView, context, listenerFn, e);
        // A just-invoked listener function might have coalesced listeners so we need to check for
        // their presence and invoke as needed.
        let nextListenerFn = wrapListenerIn_markDirtyAndPreventDefault.__ngNextListenerFn__;
        while (nextListenerFn) {
            // We should prevent default if any of the listeners explicitly return false
            result = executeListenerWithErrorHandling(lView, context, nextListenerFn, e) && result;
            nextListenerFn = nextListenerFn.__ngNextListenerFn__;
        }
        if (wrapWithPreventDefault && result === false) {
            e.preventDefault();
        }
        return result;
    };
}
/**
 * Whether the given value represents a subscribable output.
 *
 * For example, an `EventEmitter, a `Subject`, an `Observable` or an
 * `OutputEmitter`.
 */
function isOutputSubscribable(value) {
    return (value != null && typeof value.subscribe === 'function');
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGlzdGVuZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2luc3RydWN0aW9ucy9saXN0ZW5lci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsaUJBQWlCLEVBQUMsTUFBTSxrQ0FBa0MsQ0FBQztBQUduRSxPQUFPLEVBQUMsa0JBQWtCLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUlyRCxPQUFPLEVBQUMsZUFBZSxFQUFDLE1BQU0sMkJBQTJCLENBQUM7QUFDMUQsT0FBTyxFQUFDLE9BQU8sRUFBRSxPQUFPLEVBQVMsUUFBUSxFQUFRLE1BQU0sb0JBQW9CLENBQUM7QUFDNUUsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBQy9DLE9BQU8sRUFBQyxRQUFRLEVBQWdCLE1BQU0sYUFBYSxDQUFDO0FBQ3BELE9BQU8sRUFBQyxzQkFBc0IsRUFBRSxlQUFlLEVBQUUsUUFBUSxFQUFFLFFBQVEsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUNyRixPQUFPLEVBQUMsd0JBQXdCLEVBQUUsZ0JBQWdCLEVBQUUsV0FBVyxFQUFDLE1BQU0sb0JBQW9CLENBQUM7QUFFM0YsT0FBTyxFQUFDLGFBQWEsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQ2hELE9BQU8sRUFDTCx1QkFBdUIsRUFDdkIsdUJBQXVCLEVBQ3ZCLFdBQVcsRUFDWCxxQkFBcUIsR0FDdEIsTUFBTSxVQUFVLENBQUM7QUFFbEI7Ozs7Ozs7Ozs7Ozs7O0dBY0c7QUFDSCxNQUFNLFVBQVUsVUFBVSxDQUN4QixTQUFpQixFQUNqQixVQUE0QixFQUM1QixVQUFvQixFQUNwQixtQkFBMEM7SUFFMUMsTUFBTSxLQUFLLEdBQUcsUUFBUSxFQUFhLENBQUM7SUFDcEMsTUFBTSxLQUFLLEdBQUcsUUFBUSxFQUFFLENBQUM7SUFDekIsTUFBTSxLQUFL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QUFDLENBQUMsQ0FBQyxLQUFLLENBQUM7UUFDcEYsYUFBYSxDQUFDLFNBQVMsc0NBQThCLENBQUM7UUFFdEQsSUFBSSxNQUFNLEdBQUcsZ0NBQWdDLENBQUMsS0FBSyxFQUFFLE9BQU8sRUFBRSxVQUFVLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDN0UsMEZBQTBGO1FBQzFGLHVDQUF1QztRQUN2QyxJQUFJLGNBQWMsR0FBUyx5Q0FBMEMsQ0FBQyxvQkFBb0IsQ0FBQztRQUMzRixPQUFPLGNBQWMsRUFBRSxDQUFDO1lBQ3RCLDRFQUE0RTtZQUM1RSxNQUFNLEdBQUcsZ0NBQWdDLENBQUMsS0FBSyxFQUFFLE9BQU8sRUFBRSxjQUFjLEVBQUUsQ0FBQyxDQUFDLElBQUksTUFBTSxDQUFDO1lBQ3ZGLGNBQWMsR0FBUyxjQUFlLENBQUMsb0JBQW9CLENBQUM7UUFDOUQsQ0FBQztRQUVELElBQUksc0JBQXNCLElBQUksTUFBTSxLQUFLLEtBQUssRUFBRSxDQUFDO1lBQy9DLENBQUMsQ0FBQyxjQUFjLEVBQUUsQ0FBQztRQUNyQixDQUFDO1FBRUQsT0FBTyxNQUFNLENBQUM7SUFDaEIsQ0FBQyxDQUFDO0FBQ0osQ0FBQztBQU9EOzs7OztHQUtHO0FBQ0gsU0FBUyxvQkFBb0IsQ0FBQyxLQUFjO0lBQzFDLE9BQU8sQ0FDTCxLQUFLLElBQUksSUFBSSxJQUFJLE9BQVEsS0FBOEMsQ0FBQyxTQUFTLEtBQUssVUFBVSxDQUNqRyxDQUFDO0FBQ0osQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge3NldEFjdGl2ZUNvbnN1bWVyfSBmcm9tICdAYW5ndWxhci9jb3JlL3ByaW1pdGl2ZXMvc2lnbmFscyc7XG5cbmltcG9ydCB7Tm90aWZpY2F0aW9uU291cmNlfSBmcm9tICcuLi8uLi9jaGFuZ2VfZGV0ZWN0aW9uL3NjaGVkdWxpbmcvem9uZWxlc3Nfc2NoZWR1bGluZyc7XG5pbXBvcnQge2Fzc2VydEluZGV4SW5SYW5nZX0gZnJvbSAnLi4vLi4vdXRpbC9hc3NlcnQnO1xuaW1wb3J0IHtOb2RlT3V0cHV0QmluZGluZ3MsIFROb2RlLCBUTm9kZVR5cGV9IGZyb20gJy4uL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge0dsb2JhbFRhcmdldFJlc29sdmVyLCBSZW5kZXJlcn0gZnJvbSAnLi4vaW50ZXJmYWNlcy9yZW5kZXJlcic7XG5pbXBvcnQge1JFbGVtZW50fSBmcm9tICcuLi9pbnRlcmZhY2VzL3JlbmRlcmVyX2RvbSc7XG5pbXBvcnQge2lzRGlyZWN0aXZlSG9zdH0gZnJvbSAnLi4vaW50ZXJmYWNlcy90eXBlX2NoZWNrcyc7XG5pbXBvcnQge0NMRUFOVVAsIENPTlRFWFQsIExWaWV3LCBSRU5ERVJFUiwgVFZpZXd9IGZyb20gJy4uL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2Fzc2VydFROb2RlVHlwZX0gZnJvbSAnLi4vbm9kZV9hc3NlcnQnO1xuaW1wb3J0IHtwcm9maWxlciwgUHJvZmlsZXJFdmVudH0gZnJvbSAnLi4vcHJvZmlsZXInO1xuaW1wb3J0IHtnZXRDdXJyZW50RGlyZWN0aXZlRGVmLCBnZXRDdXJyZW50VE5vZGUsIGdldExWaWV3LCBnZXRUVmlld30gZnJvbSAnLi4vc3RhdGUnO1xuaW1wb3J0IHtnZXRDb21wb25lbnRMVmlld0J5SW5kZXgsIGdldE5hdGl2ZUJ5VE5vZGUsIHVud3JhcFJOb2RlfSBmcm9tICcuLi91dGlsL3ZpZXdfdXRpbHMnO1xuXG5pbXBvcnQge21hcmtWaWV3RGlydHl9IGZyb20gJy4vbWFya192aWV3X2RpcnR5JztcbmltcG9ydCB7XG4gIGdldE9yQ3JlYXRlTFZpZXdDbGVhbnVwLFxuICBnZXRPckNyZWF0ZVRWaWV3Q2xlYW51cCxcbiAgaGFuZGxlRXJyb3IsXG4gIGxvYWRDb21wb25lbnRSZW5kZXJlcixcbn0gZnJvbSAnLi9zaGFyZWQnO1xuXG4vKipcbiAqIEFkZHMgYW4gZXZlbnQgbGlzdGVuZXIgdG8gdGhlIGN1cnJlbnQgbm9kZS5cbiAqXG4gKiBJZiBhbiBvdXRwdXQgZXhpc3RzIG9uIG9uZSBvZiB0aGUgbm9kZSdzIGRpcmVjdGl2ZXMsIGl0IGFsc28gc3Vic2NyaWJlcyB0byB0aGUgb3V0cHV0XG4gKiBhbmQgc2F2ZXMgdGhlIHN1YnNjcmlwdGlvbiBmb3IgbGF0ZXIgY2xlYW51cC5cbiAqXG4gKiBAcGFyYW0gZXZlbnROYW1lIE5hbWUgb2YgdGhlIGV2ZW50XG4gKiBAcGFyYW0gbGlzdGVuZXJGbiBUaGUgZnVuY3Rpb24gdG8gYmUgY2FsbGVkIHdoZW4gZXZlbnQgZW1pdHNcbiAqIEBwYXJhbSB1c2VDYXB0dXJlIFdoZXRoZXIgb3Igbm90IHRvIHVzZSBjYXB0dXJlIGluIGV2ZW50IGxpc3RlbmVyIC0gdGhpcyBhcmd1bWVudCBpcyBhIHJlbWluZGVyXG4gKiAgICAgZnJvbSB0aGUgUmVuZGVyZXIzIGluZnJhc3RydWN0dXJlIGFuZCBzaG91bGQgYmUgcmVtb3ZlZCBmcm9tIHRoZSBpbnN0cnVjdGlvbiBhcmd1bWVudHNcbiAqIEBwYXJhbSBldmVudFRhcmdldFJlc29sdmVyIEZ1bmN0aW9uIHRoYXQgcmV0dXJucyBnbG9iYWwgdGFyZ2V0IGluZm9ybWF0aW9uIGluIGNhc2UgdGhpcyBsaXN0ZW5lclxuICogc2hvdWxkIGJlIGF0dGFjaGVkIHRvIGEgZ2xvYmFsIG9iamVjdCBsaWtlIHdpbmRvdywgZG9jdW1lbnQgb3IgYm9keVxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1bGlzdGVuZXIoXG4gIGV2ZW50TmFtZTogc3RyaW5nLFxuICBsaXN0ZW5lckZuOiAoZT86IGFueSkgPT4gYW55LFxuICB1c2VDYXB0dXJlPzogYm9vbGVhbixcbiAgZXZlbnRUYXJnZXRSZXNvbHZlcj86IEdsb2JhbFRhcmdldFJlc29sdmVyLFxuKTogdHlwZW9mIMm1ybVsaXN0ZW5lciB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXc8e30gfCBudWxsPigpO1xuICBjb25zdCB0VmlldyA9IGdldFRWaWV3KCk7XG4gIGNvbnN0IHROb2RlID0gZ2V0Q3VycmVudFROb2RlKCkhO1xuICBsaXN0ZW5lckludGVybmFsKFxuICAgIHRWaWV3LFxuICAgIGxWaWV3LFxuICAgIGxWaWV3W1JFTkRFUkVSXSxcbiAgICB0Tm9kZSxcbiAgICBldmVudE5hbWUsXG4gICAgbGlzdGVuZXJGbixcbiAgICBldmVudFRhcmdldFJlc29sdmVyLFxuICApO1xuICByZXR1cm4gybXJtWxpc3RlbmVyO1xufVxuXG4vKipcbiAqIFJlZ2lzdGVycyBhIHN5bnRoZXRpYyBob3N0IGxpc3RlbmVyIChlLmcuIGAoQGZvby5zdGFydClgKSBvbiBhIGNvbXBvbmVudCBvciBkaXJlY3RpdmUuXG4gKlxuICogVGhpcyBpbnN0cnVjdGlvbiBpcyBmb3IgY29tcGF0aWJpbGl0eSBwdXJwb3NlcyBhbmQgaXMgZGVzaWduZWQgdG8gZW5zdXJlIHRoYXQgYVxuICogc3ludGhldGljIGhvc3QgbGlzdGVuZXIgKGUuZy4gYEBIb3N0TGlzdGVuZXIoJ0Bmb28uc3RhcnQnKWApIHByb3Blcmx5IGdldHMgcmVuZGVyZWRcbiAqIGluIHRoZSBjb21wb25lbnQncyByZW5kZXJlci4gTm9ybWFsbHkgYWxsIGhvc3QgbGlzdGVuZXJzIGFyZSBldmFsdWF0ZWQgd2l0aCB0aGVcbiAqIHBhcmVudCBjb21wb25lbnQncyByZW5kZXJlciwgYnV0LCBpbiB0aGUgY2FzZSBvZiBhbmltYXRpb24gQHRyaWdnZXJzLCB0aGV5IG5lZWRcbiAqIHRvIGJlIGV2YWx1YXRlZCB3aXRoIHRoZSBzdWIgY29tcG9uZW50J3MgcmVuZGVyZXIgKGJlY2F1c2UgdGhhdCdzIHdoZXJlIHRoZVxuICogYW5pbWF0aW9uIHRyaWdnZXJzIGFyZSBkZWZpbmVkKS5cbiAqXG4gKiBEbyBub3QgdXNlIHRoaXMgaW5zdHJ1Y3Rpb24gYXMgYSByZXBsYWNlbWVudCBmb3IgYGxpc3RlbmVyYC4gVGhpcyBpbnN0cnVjdGlvblxuICogb25seSBleGlzdHMgdG8gZW5zdXJlIGNvbXBhdGliaWxpdHkgd2l0aCB0aGUgVmlld0VuZ2luZSdzIGhvc3QgYmluZGluZyBiZWhhdmlvci5cbiAqXG4gKiBAcGFyYW0gZXZlbnROYW1lIE5hbWUgb2YgdGhlIGV2ZW50XG4gKiBAcGFyYW0gbGlzdGVuZXJGbiBUaGUgZnVuY3Rpb24gdG8gYmUgY2FsbGVkIHdoZW4gZXZlbnQgZW1pdHNcbiAqIEBwYXJhbSB1c2VDYXB0dXJlIFdoZXRoZXIgb3Igbm90IHRvIHVzZSBjYXB0dXJlIGluIGV2ZW50IGxpc3RlbmVyXG4gKiBAcGFyYW0gZXZlbnRUYXJnZXRSZXNvbHZlciBGdW5jdGlvbiB0aGF0IHJldHVybnMgZ2xvYmFsIHRhcmdldCBpbmZvcm1hdGlvbiBpbiBjYXNlIHRoaXMgbGlzdGVuZXJcbiAqIHNob3VsZCBiZSBhdHRhY2hlZCB0byBhIGdsb2JhbCBvYmplY3QgbGlrZSB3aW5kb3csIGRvY3VtZW50IG9yIGJvZHlcbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtXN5bnRoZXRpY0hvc3RMaXN0ZW5lcihcbiAgZXZlbnROYW1lOiBzdHJpbmcsXG4gIGxpc3RlbmVyRm46IChlPzogYW55KSA9PiBhbnksXG4pOiB0eXBlb2YgybXJtXN5bnRoZXRpY0hvc3RMaXN0ZW5lciB7XG4gIGNvbnN0IHROb2RlID0gZ2V0Q3VycmVudFROb2RlKCkhO1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3PHt9IHwgbnVsbD4oKTtcbiAgY29uc3QgdFZpZXcgPSBnZXRUVmlldygpO1xuICBjb25zdCBjdXJyZW50RGVmID0gZ2V0Q3VycmVudERpcmVjdGl2ZURlZih0Vmlldy5kYXRhKTtcbiAgY29uc3QgcmVuZGVyZXIgPSBsb2FkQ29tcG9uZW50UmVuZGVyZXIoY3VycmVudERlZiwgdE5vZGUsIGxWaWV3KTtcbiAgbGlzdGVuZXJJbnRlcm5hbCh0VmlldywgbFZpZXcsIHJlbmRlcmVyLCB0Tm9kZSwgZXZlbnROYW1lLCBsaXN0ZW5lckZuKTtcbiAgcmV0dXJuIMm1ybVzeW50aGV0aWNIb3N0TGlzdGVuZXI7XG59XG5cbi8qKlxuICogQSB1dGlsaXR5IGZ1bmN0aW9uIHRoYXQgY2hlY2tzIGlmIGEgZ2l2ZW4gZWxlbWVudCBoYXMgYWxyZWFkeSBhbiBldmVudCBoYW5kbGVyIHJlZ2lzdGVyZWQgZm9yIGFuXG4gKiBldmVudCB3aXRoIGEgc3BlY2lmaWVkIG5hbWUuIFRoZSBUVmlldy5jbGVhbnVwIGRhdGEgc3RydWN0dXJlIGlzIHVzZWQgdG8gZmluZCBvdXQgd2hpY2ggZXZlbnRzXG4gKiBhcmUgcmVnaXN0ZXJlZCBmb3IgYSBnaXZlbiBlbGVtZW50LlxuICovXG5mdW5jdGlvbiBmaW5kRXhpc3RpbmdMaXN0ZW5lcihcbiAgdFZpZXc6IFRWaWV3LFxuICBsVmlldzogTFZpZXcsXG4gIGV2ZW50TmFtZTogc3RyaW5nLFxuICB0Tm9kZUlkeDogbnVtYmVyLFxuKTogKChlPzogYW55KSA9PiBhbnkpIHwgbnVsbCB7XG4gIGNvbnN0IHRDbGVhbnVwID0gdFZpZXcuY2xlYW51cDtcbiAgaWYgKHRDbGVhbnVwICE9IG51bGwpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRDbGVhbnVwLmxlbmd0aCAtIDE7IGkgKz0gMikge1xuICAgICAgY29uc3QgY2xlYW51cEV2ZW50TmFtZSA9IHRDbGVhbnVwW2ldO1xuICAgICAgaWYgKGNsZWFudXBFdmVudE5hbWUgPT09IGV2ZW50TmFtZSAmJiB0Q2xlYW51cFtpICsgMV0gPT09IHROb2RlSWR4KSB7XG4gICAgICAgIC8vIFdlIGhhdmUgZm91bmQgYSBtYXRjaGluZyBldmVudCBuYW1lIG9uIHRoZSBzYW1lIG5vZGUgYnV0IGl0IG1pZ2h0IG5vdCBoYXZlIGJlZW5cbiAgICAgICAgLy8gcmVnaXN0ZXJlZCB5ZXQsIHNvIHdlIG11c3QgZXhwbGljaXRseSB2ZXJpZnkgZW50cmllcyBpbiB0aGUgTFZpZXcgY2xlYW51cCBkYXRhXG4gICAgICAgIC8vIHN0cnVjdHVyZXMuXG4gICAgICAgIGNvbnN0IGxDbGVhbnVwID0gbFZpZXdbQ0xFQU5VUF0hO1xuICAgICAgICBjb25zdCBsaXN0ZW5lcklkeEluTENsZWFudXAgPSB0Q2xlYW51cFtpICsgMl07XG4gICAgICAgIHJldHVybiBsQ2xlYW51cC5sZW5ndGggPiBsaXN0ZW5lcklkeEluTENsZWFudXAgPyBsQ2xlYW51cFtsaXN0ZW5lcklkeEluTENsZWFudXBdIDogbnVsbDtcbiAgICAgIH1cbiAgICAgIC8vIFRWaWV3LmNsZWFudXAgY2FuIGhhdmUgYSBtaXggb2YgNC1lbGVtZW50cyBlbnRyaWVzIChmb3IgZXZlbnQgaGFuZGxlciBjbGVhbnVwcykgb3JcbiAgICAgIC8vIDItZWxlbWVudCBlbnRyaWVzIChmb3IgZGlyZWN0aXZlIGFuZCBxdWVyaWVzIGRlc3Ryb3kgaG9va3MpLiBBcyBzdWNoIHdlIGNhbiBlbmNvdW50ZXJcbiAgICAgIC8vIGJsb2NrcyBvZiA0IG9yIDIgaXRlbXMgaW4gdGhlIHRWaWV3LmNsZWFudXAgYW5kIHRoaXMgaXMgd2h5IHdlIGl0ZXJhdGUgb3ZlciAyIGVsZW1lbnRzXG4gICAgICAvLyBmaXJzdCBhbmQganVtcCBhbm90aGVyIDIgZWxlbWVudHMgaWYgd2UgZGV0ZWN0IGxpc3RlbmVycyBjbGVhbnVwICg0IGVsZW1lbnRzKS4gQWxzbyBjaGVja1xuICAgICAgLy8gZG9jdW1lbnRhdGlvbiBvZiBUVmlldy5jbGVhbnVwIGZvciBtb3JlIGRldGFpbHMgb2YgdGhpcyBkYXRhIHN0cnVjdHVyZSBsYXlvdXQuXG4gICAgICBpZiAodHlwZW9mIGNsZWFudXBFdmVudE5hbWUgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIGkgKz0gMjtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBsaXN0ZW5lckludGVybmFsKFxuICB0VmlldzogVFZpZXcsXG4gIGxWaWV3OiBMVmlldzx7fSB8IG51bGw+LFxuICByZW5kZXJlcjogUmVuZGVyZXIsXG4gIHROb2RlOiBUTm9kZSxcbiAgZXZlbnROYW1lOiBzdHJpbmcsXG4gIGxpc3RlbmVyRm46IChlPzogYW55KSA9PiBhbnksXG4gIGV2ZW50VGFyZ2V0UmVzb2x2ZXI/OiBHbG9iYWxUYXJnZXRSZXNvbHZlcixcbik6IHZvaWQge1xuICBjb25zdCBpc1ROb2RlRGlyZWN0aXZlSG9zdCA9IGlzRGlyZWN0aXZlSG9zdCh0Tm9kZSk7XG4gIGNvbnN0IGZpcnN0Q3JlYXRlUGFzcyA9IHRWaWV3LmZpcnN0Q3JlYXRlUGFzcztcbiAgY29uc3QgdENsZWFudXA6IGZhbHNlIHwgYW55W10gPSBmaXJzdENyZWF0ZVBhc3MgJiYgZ2V0T3JDcmVhdGVUVmlld0NsZWFudXAodFZpZXcpO1xuICBjb25zdCBjb250ZXh0ID0gbFZpZXdbQ09OVEVYVF07XG5cbiAgLy8gV2hlbiB0aGUgybXJtWxpc3RlbmVyIGluc3RydWN0aW9uIHdhcyBnZW5lcmF0ZWQgYW5kIGlzIGV4ZWN1dGVkIHdlIGtub3cgdGhhdCB0aGVyZSBpcyBlaXRoZXIgYVxuICAvLyBuYXRpdmUgbGlzdGVuZXIgb3IgYSBkaXJlY3RpdmUgb3V0cHV0IG9uIHRoaXMgZWxlbWVudC4gQXMgc3VjaCB3ZSB3ZSBrbm93IHRoYXQgd2Ugd2lsbCBoYXZlIHRvXG4gIC8vIHJlZ2lzdGVyIGEgbGlzdGVuZXIgYW5kIHN0b3JlIGl0cyBjbGVhbnVwIGZ1bmN0aW9uIG9uIExWaWV3LlxuICBjb25zdCBsQ2xlYW51cCA9IGdldE9yQ3JlYXRlTFZpZXdDbGVhbnVwKGxWaWV3KTtcblxuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0VE5vZGVUeXBlKHROb2RlLCBUTm9kZVR5cGUuQW55Uk5vZGUgfCBUTm9kZVR5cGUuQW55Q29udGFpbmVyKTtcblxuICBsZXQgcHJvY2Vzc091dHB1dHMgPSB0cnVlO1xuXG4gIC8vIEFkZGluZyBhIG5hdGl2ZSBldmVudCBsaXN0ZW5lciBpcyBhcHBsaWNhYmxlIHdoZW46XG4gIC8vIC0gVGhlIGNvcnJlc3BvbmRpbmcgVE5vZGUgcmVwcmVzZW50cyBhIERPTSBlbGVtZW50LlxuICAvLyAtIFRoZSBldmVudCB0YXJnZXQgaGFzIGEgcmVzb2x2ZXIgKHVzdWFsbHkgcmVzdWx0aW5nIGluIGEgZ2xvYmFsIG9iamVjdCxcbiAgLy8gICBzdWNoIGFzIGB3aW5kb3dgIG9yIGBkb2N1bWVudGApLlxuICBpZiAodE5vZGUudHlwZSAmIFROb2RlVHlwZS5BbnlSTm9kZSB8fCBldmVudFRhcmdldFJlc29sdmVyKSB7XG4gICAgY29uc3QgbmF0aXZlID0gZ2V0TmF0aXZlQnlUTm9kZSh0Tm9kZSwgbFZpZXcpIGFzIFJFbGVtZW50O1xuICAgIGNvbnN0IHRhcmdldCA9IGV2ZW50VGFyZ2V0UmVzb2x2ZXIgPyBldmVudFRhcmdldFJlc29sdmVyKG5hdGl2ZSkgOiBuYXRpdmU7XG4gICAgY29uc3QgbENsZWFudXBJbmRleCA9IGxDbGVhbnVwLmxlbmd0aDtcbiAgICBjb25zdCBpZHhPclRhcmdldEdldHRlciA9IGV2ZW50VGFyZ2V0UmVzb2x2ZXJcbiAgICAgID8gKF9sVmlldzogTFZpZXcpID0+IGV2ZW50VGFyZ2V0UmVzb2x2ZXIodW53cmFwUk5vZGUoX2xWaWV3W3ROb2RlLmluZGV4XSkpXG4gICAgICA6IHROb2RlLmluZGV4O1xuXG4gICAgLy8gSW4gb3JkZXIgdG8gbWF0Y2ggY3VycmVudCBiZWhhdmlvciwgbmF0aXZlIERPTSBldmVudCBsaXN0ZW5lcnMgbXVzdCBiZSBhZGRlZCBmb3IgYWxsXG4gICAgLy8gZXZlbnRzIChpbmNsdWRpbmcgb3V0cHV0cykuXG5cbiAgICAvLyBUaGVyZSBtaWdodCBiZSBjYXNlcyB3aGVyZSBtdWx0aXBsZSBkaXJlY3RpdmVzIG9uIHRoZSBzYW1lIGVsZW1lbnQgdHJ5IHRvIHJlZ2lzdGVyIGFuIGV2ZW50XG4gICAgLy8gaGFuZGxlciBmdW5jdGlvbiBmb3IgdGhlIHNhbWUgZXZlbnQuIEluIHRoaXMgc2l0dWF0aW9uIHdlIHdhbnQgdG8gYXZvaWQgcmVnaXN0cmF0aW9uIG9mXG4gICAgLy8gc2V2ZXJhbCBuYXRpdmUgbGlzdGVuZXJzIGFzIGVhY2ggcmVnaXN0cmF0aW9uIHdvdWxkIGJlIGludGVyY2VwdGVkIGJ5IE5nWm9uZSBhbmRcbiAgICAvLyB0cmlnZ2VyIGNoYW5nZSBkZXRlY3Rpb24uIFRoaXMgd291bGQgbWVhbiB0aGF0IGEgc2luZ2xlIHVzZXIgYWN0aW9uIHdvdWxkIHJlc3VsdCBpbiBzZXZlcmFsXG4gICAgLy8gY2hhbmdlIGRldGVjdGlvbnMgYmVpbmcgaW52b2tlZC4gVG8gYXZvaWQgdGhpcyBzaXR1YXRpb24gd2Ugd2FudCB0byBoYXZlIG9ubHkgb25lIGNhbGwgdG9cbiAgICAvLyBuYXRpdmUgaGFuZGxlciByZWdpc3RyYXRpb24gKGZvciB0aGUgc2FtZSBlbGVtZW50IGFuZCBzYW1lIHR5cGUgb2YgZXZlbnQpLlxuICAgIC8vXG4gICAgLy8gSW4gb3JkZXIgdG8gaGF2ZSBqdXN0IG9uZSBuYXRpdmUgZXZlbnQgaGFuZGxlciBpbiBwcmVzZW5jZSBvZiBtdWx0aXBsZSBoYW5kbGVyIGZ1bmN0aW9ucyxcbiAgICAvLyB3ZSBqdXN0IHJlZ2lzdGVyIGEgZmlyc3QgaGFuZGxlciBmdW5jdGlvbiBhcyBhIG5hdGl2ZSBldmVudCBsaXN0ZW5lciBhbmQgdGhlbiBjaGFpblxuICAgIC8vIChjb2FsZXNjZSkgb3RoZXIgaGFuZGxlciBmdW5jdGlvbnMgb24gdG9wIG9mIHRoZSBmaXJzdCBuYXRpdmUgaGFuZGxlciBmdW5jdGlvbi5cbiAgICBsZXQgZXhpc3RpbmdMaXN0ZW5lciA9IG51bGw7XG4gICAgLy8gUGxlYXNlIG5vdGUgdGhhdCB0aGUgY29hbGVzY2luZyBkZXNjcmliZWQgaGVyZSBkb2Vzbid0IGhhcHBlbiBmb3IgZXZlbnRzIHNwZWNpZnlpbmcgYW5cbiAgICAvLyBhbHRlcm5hdGl2ZSB0YXJnZXQgKGV4LiAoZG9jdW1lbnQ6Y2xpY2spKSAtIHRoaXMgaXMgdG8ga2VlcCBiYWNrd2FyZCBjb21wYXRpYmlsaXR5IHdpdGggdGhlXG4gICAgLy8gdmlldyBlbmdpbmUuXG4gICAgLy8gQWxzbywgd2UgZG9uJ3QgaGF2ZSB0byBzZWFyY2ggZm9yIGV4aXN0aW5nIGxpc3RlbmVycyBpcyB0aGVyZSBhcmUgbm8gZGlyZWN0aXZlc1xuICAgIC8vIG1hdGNoaW5nIG9uIGEgZ2l2ZW4gbm9kZSBhcyB3ZSBjYW4ndCByZWdpc3RlciBtdWx0aXBsZSBldmVudCBoYW5kbGVycyBmb3IgdGhlIHNhbWUgZXZlbnQgaW5cbiAgICAvLyBhIHRlbXBsYXRlICh0aGlzIHdvdWxkIG1lYW4gaGF2aW5nIGR1cGxpY2F0ZSBhdHRyaWJ1dGVzKS5cbiAgICBpZiAoIWV2ZW50VGFyZ2V0UmVzb2x2ZXIgJiYgaXNUTm9kZURpcmVjdGl2ZUhvc3QpIHtcbiAgICAgIGV4aXN0aW5nTGlzdGVuZXIgPSBmaW5kRXhpc3RpbmdMaXN0ZW5lcih0VmlldywgbFZpZXcsIGV2ZW50TmFtZSwgdE5vZGUuaW5kZXgpO1xuICAgIH1cbiAgICBpZiAoZXhpc3RpbmdMaXN0ZW5lciAhPT0gbnVsbCkge1xuICAgICAgLy8gQXR0YWNoIGEgbmV3IGxpc3RlbmVyIHRvIGNvYWxlc2NlZCBsaXN0ZW5lcnMgbGlzdCwgbWFpbnRhaW5pbmcgdGhlIG9yZGVyIGluIHdoaWNoXG4gICAgICAvLyBsaXN0ZW5lcnMgYXJlIHJlZ2lzdGVyZWQuIEZvciBwZXJmb3JtYW5jZSByZWFzb25zLCB3ZSBrZWVwIGEgcmVmZXJlbmNlIHRvIHRoZSBsYXN0XG4gICAgICAvLyBsaXN0ZW5lciBpbiB0aGF0IGxpc3QgKGluIGBfX25nTGFzdExpc3RlbmVyRm5fX2AgZmllbGQpLCBzbyB3ZSBjYW4gYXZvaWQgZ29pbmcgdGhyb3VnaFxuICAgICAgLy8gdGhlIGVudGlyZSBzZXQgZWFjaCB0aW1lIHdlIG5lZWQgdG8gYWRkIGEgbmV3IGxpc3RlbmVyLlxuICAgICAgY29uc3QgbGFzdExpc3RlbmVyRm4gPSAoPGFueT5leGlzdGluZ0xpc3RlbmVyKS5fX25nTGFzdExpc3RlbmVyRm5fXyB8fCBleGlzdGluZ0xpc3RlbmVyO1xuICAgICAgbGFzdExpc3RlbmVyRm4uX19uZ05leHRMaXN0ZW5lckZuX18gPSBsaXN0ZW5lckZuO1xuICAgICAgKDxhbnk+ZXhpc3RpbmdMaXN0ZW5lcikuX19uZ0xhc3RMaXN0ZW5lckZuX18gPSBsaXN0ZW5lckZuO1xuICAgICAgcHJvY2Vzc091dHB1dHMgPSBmYWxzZTtcbiAgICB9IGVsc2Uge1xuICAgICAgbGlzdGVuZXJGbiA9IHdyYXBMaXN0ZW5lcih0Tm9kZSwgbFZpZXcsIGNvbnRleHQsIGxpc3RlbmVyRm4sIGZhbHNlIC8qKiBwcmV2ZW50RGVmYXVsdCAqLyk7XG4gICAgICBjb25zdCBjbGVhbnVwRm4gPSByZW5kZXJlci5saXN0ZW4odGFyZ2V0IGFzIFJFbGVtZW50LCBldmVudE5hbWUsIGxpc3RlbmVyRm4pO1xuICAgICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlckFkZEV2ZW50TGlzdGVuZXIrKztcblxuICAgICAgbENsZWFudXAucHVzaChsaXN0ZW5lckZuLCBjbGVhbnVwRm4pO1xuICAgICAgdENsZWFudXAgJiYgdENsZWFudXAucHVzaChldmVudE5hbWUsIGlkeE9yVGFyZ2V0R2V0dGVyLCBsQ2xlYW51cEluZGV4LCBsQ2xlYW51cEluZGV4ICsgMSk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIC8vIEV2ZW4gaWYgdGhlcmUgaXMgbm8gbmF0aXZlIGxpc3RlbmVyIHRvIGFkZCwgd2Ugc3RpbGwgbmVlZCB0byB3cmFwIHRoZSBsaXN0ZW5lciBzbyB0aGF0IE9uUHVzaFxuICAgIC8vIGFuY2VzdG9ycyBhcmUgbWFya2VkIGRpcnR5IHdoZW4gYW4gZXZlbnQgb2NjdXJzLlxuICAgIGxpc3RlbmVyRm4gPSB3cmFwTGlzdGVuZXIodE5vZGUsIGxWaWV3LCBjb250ZXh0LCBsaXN0ZW5lckZuLCBmYWxzZSAvKiogcHJldmVudERlZmF1bHQgKi8pO1xuICB9XG5cbiAgLy8gc3Vic2NyaWJlIHRvIGRpcmVjdGl2ZSBvdXRwdXRzXG4gIGNvbnN0IG91dHB1dHMgPSB0Tm9kZS5vdXRwdXRzO1xuICBsZXQgcHJvcHM6IE5vZGVPdXRwdXRCaW5kaW5nc1trZXlvZiBOb2RlT3V0cHV0QmluZGluZ3NdIHwgdW5kZWZpbmVkO1xuICBpZiAocHJvY2Vzc091dHB1dHMgJiYgb3V0cHV0cyAhPT0gbnVsbCAmJiAocHJvcHMgPSBvdXRwdXRzW2V2ZW50TmFtZV0pKSB7XG4gICAgY29uc3QgcHJvcHNMZW5ndGggPSBwcm9wcy5sZW5ndGg7XG4gICAgaWYgKHByb3BzTGVuZ3RoKSB7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHByb3BzTGVuZ3RoOyBpICs9IDIpIHtcbiAgICAgICAgY29uc3QgaW5kZXggPSBwcm9wc1tpXSBhcyBudW1iZXI7XG4gICAgICAgIG5nRGV2TW9kZSAmJiBhc3NlcnRJbmRleEluUmFuZ2UobFZpZXcsIGluZGV4KTtcbiAgICAgICAgY29uc3QgbWluaWZpZWROYW1lID0gcHJvcHNbaSArIDFdO1xuICAgICAgICBjb25zdCBkaXJlY3RpdmVJbnN0YW5jZSA9IGxWaWV3W2luZGV4XTtcbiAgICAgICAgY29uc3Qgb3V0cHV0ID0gZGlyZWN0aXZlSW5zdGFuY2VbbWluaWZpZWROYW1lXTtcblxuICAgICAgICBpZiAobmdEZXZNb2RlICYmICFpc091dHB1dFN1YnNjcmliYWJsZShvdXRwdXQpKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgICAgYEBPdXRwdXQgJHttaW5pZmllZE5hbWV9IG5vdCBpbml0aWFsaXplZCBpbiAnJHtkaXJlY3RpdmVJbnN0YW5jZS5jb25zdHJ1Y3Rvci5uYW1lfScuYCxcbiAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3Qgc3Vic2NyaXB0aW9uID0gKG91dHB1dCBhcyBTdWJzY3JpYmFibGVPdXRwdXQ8dW5rbm93bj4pLnN1YnNjcmliZShsaXN0ZW5lckZuKTtcbiAgICAgICAgY29uc3QgaWR4ID0gbENsZWFudXAubGVuZ3RoO1xuICAgICAgICBsQ2xlYW51cC5wdXNoKGxpc3RlbmVyRm4sIHN1YnNjcmlwdGlvbik7XG4gICAgICAgIHRDbGVhbnVwICYmIHRDbGVhbnVwLnB1c2goZXZlbnROYW1lLCB0Tm9kZS5pbmRleCwgaWR4LCAtKGlkeCArIDEpKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gZXhlY3V0ZUxpc3RlbmVyV2l0aEVycm9ySGFuZGxpbmcoXG4gIGxWaWV3OiBMVmlldyxcbiAgY29udGV4dDoge30gfCBudWxsLFxuICBsaXN0ZW5lckZuOiAoZT86IGFueSkgPT4gYW55LFxuICBlOiBhbnksXG4pOiBib29sZWFuIHtcbiAgY29uc3QgcHJldkNvbnN1bWVyID0gc2V0QWN0aXZlQ29uc3VtZXIobnVsbCk7XG4gIHRyeSB7XG4gICAgcHJvZmlsZXIoUHJvZmlsZXJFdmVudC5PdXRwdXRTdGFydCwgY29udGV4dCwgbGlzdGVuZXJGbik7XG4gICAgLy8gT25seSBleHBsaWNpdGx5IHJldHVybmluZyBmYWxzZSBmcm9tIGEgbGlzdGVuZXIgc2hvdWxkIHByZXZlbnREZWZhdWx0XG4gICAgcmV0dXJuIGxpc3RlbmVyRm4oZSkgIT09IGZhbHNlO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGhhbmRsZUVycm9yKGxWaWV3LCBlcnJvcik7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9IGZpbmFsbHkge1xuICAgIHByb2ZpbGVyKFByb2ZpbGVyRXZlbnQuT3V0cHV0RW5kLCBjb250ZXh0LCBsaXN0ZW5lckZuKTtcbiAgICBzZXRBY3RpdmVDb25zdW1lcihwcmV2Q29uc3VtZXIpO1xuICB9XG59XG5cbi8qKlxuICogV3JhcHMgYW4gZXZlbnQgbGlzdGVuZXIgd2l0aCBhIGZ1bmN0aW9uIHRoYXQgbWFya3MgYW5jZXN0b3JzIGRpcnR5IGFuZCBwcmV2ZW50cyBkZWZhdWx0IGJlaGF2aW9yLFxuICogaWYgYXBwbGljYWJsZS5cbiAqXG4gKiBAcGFyYW0gdE5vZGUgVGhlIFROb2RlIGFzc29jaWF0ZWQgd2l0aCB0aGlzIGxpc3RlbmVyXG4gKiBAcGFyYW0gbFZpZXcgVGhlIExWaWV3IHRoYXQgY29udGFpbnMgdGhpcyBsaXN0ZW5lclxuICogQHBhcmFtIGxpc3RlbmVyRm4gVGhlIGxpc3RlbmVyIGZ1bmN0aW9uIHRvIGNhbGxcbiAqIEBwYXJhbSB3cmFwV2l0aFByZXZlbnREZWZhdWx0IFdoZXRoZXIgb3Igbm90IHRvIHByZXZlbnQgZGVmYXVsdCBiZWhhdmlvclxuICogKHRoZSBwcm9jZWR1cmFsIHJlbmRlcmVyIGRvZXMgdGhpcyBhbHJlYWR5LCBzbyBpbiB0aG9zZSBjYXNlcywgd2Ugc2hvdWxkIHNraXApXG4gKi9cbmZ1bmN0aW9uIHdyYXBMaXN0ZW5lcihcbiAgdE5vZGU6IFROb2RlLFxuICBsVmlldzogTFZpZXc8e30gfCBudWxsPixcbiAgY29udGV4dDoge30gfCBudWxsLFxuICBsaXN0ZW5lckZuOiAoZT86IGFueSkgPT4gYW55LFxuICB3cmFwV2l0aFByZXZlbnREZWZhdWx0OiBib29sZWFuLFxuKTogRXZlbnRMaXN0ZW5lciB7XG4gIC8vIE5vdGU6IHdlIGFyZSBwZXJmb3JtaW5nIG1vc3Qgb2YgdGhlIHdvcmsgaW4gdGhlIGxpc3RlbmVyIGZ1bmN0aW9uIGl0c2VsZlxuICAvLyB0byBvcHRpbWl6ZSBsaXN0ZW5lciByZWdpc3RyYXRpb24uXG4gIHJldHVybiBmdW5jdGlvbiB3cmFwTGlzdGVuZXJJbl9tYXJrRGlydHlBbmRQcmV2ZW50RGVmYXVsdChlOiBhbnkpIHtcbiAgICAvLyBJdnkgdXNlcyBgRnVuY3Rpb25gIGFzIGEgc3BlY2lhbCB0b2tlbiB0aGF0IGFsbG93cyB1cyB0byB1bndyYXAgdGhlIGZ1bmN0aW9uXG4gICAgLy8gc28gdGhhdCBpdCBjYW4gYmUgaW52b2tlZCBwcm9ncmFtbWF0aWNhbGx5IGJ5IGBEZWJ1Z05vZGUudHJpZ2dlckV2ZW50SGFuZGxlcmAuXG4gICAgaWYgKGUgPT09IEZ1bmN0aW9uKSB7XG4gICAgICByZXR1cm4gbGlzdGVuZXJGbjtcbiAgICB9XG5cbiAgICAvLyBJbiBvcmRlciB0byBiZSBiYWNrd2FyZHMgY29tcGF0aWJsZSB3aXRoIFZpZXcgRW5naW5lLCBldmVudHMgb24gY29tcG9uZW50IGhvc3Qgbm9kZXNcbiAgICAvLyBtdXN0IGFsc28gbWFyayB0aGUgY29tcG9uZW50IHZpZXcgaXRzZWxmIGRpcnR5IChpLmUuIHRoZSB2aWV3IHRoYXQgaXQgb3ducykuXG4gICAgY29uc3Qgc3RhcnRWaWV3ID1cbiAgICAgIHROb2RlLmNvbXBvbmVudE9mZnNldCA+IC0xID8gZ2V0Q29tcG9uZW50TFZpZXdCeUluZGV4KHROb2RlLmluZGV4LCBsVmlldykgOiBsVmlldztcbiAgICBtYXJrVmlld0RpcnR5KHN0YXJ0VmlldywgTm90aWZpY2F0aW9uU291cmNlLkxpc3RlbmVyKTtcblxuICAgIGxldCByZXN1bHQgPSBleGVjdXRlTGlzdGVuZXJXaXRoRXJyb3JIYW5kbGluZyhsVmlldywgY29udGV4dCwgbGlzdGVuZXJGbiwgZSk7XG4gICAgLy8gQSBqdXN0LWludm9rZWQgbGlzdGVuZXIgZnVuY3Rpb24gbWlnaHQgaGF2ZSBjb2FsZXNjZWQgbGlzdGVuZXJzIHNvIHdlIG5lZWQgdG8gY2hlY2sgZm9yXG4gICAgLy8gdGhlaXIgcHJlc2VuY2UgYW5kIGludm9rZSBhcyBuZWVkZWQuXG4gICAgbGV0IG5leHRMaXN0ZW5lckZuID0gKDxhbnk+d3JhcExpc3RlbmVySW5fbWFya0RpcnR5QW5kUHJldmVudERlZmF1bHQpLl9fbmdOZXh0TGlzdGVuZXJGbl9fO1xuICAgIHdoaWxlIChuZXh0TGlzdGVuZXJGbikge1xuICAgICAgLy8gV2Ugc2hvdWxkIHByZXZlbnQgZGVmYXVsdCBpZiBhbnkgb2YgdGhlIGxpc3RlbmVycyBleHBsaWNpdGx5IHJldHVybiBmYWxzZVxuICAgICAgcmVzdWx0ID0gZXhlY3V0ZUxpc3RlbmVyV2l0aEVycm9ySGFuZGxpbmcobFZpZXcsIGNvbnRleHQsIG5leHRMaXN0ZW5lckZuLCBlKSAmJiByZXN1bHQ7XG4gICAgICBuZXh0TGlzdGVuZXJGbiA9ICg8YW55Pm5leHRMaXN0ZW5lckZuKS5fX25nTmV4dExpc3RlbmVyRm5fXztcbiAgICB9XG5cbiAgICBpZiAod3JhcFdpdGhQcmV2ZW50RGVmYXVsdCAmJiByZXN1bHQgPT09IGZhbHNlKSB7XG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfTtcbn1cblxuLyoqIERlc2NyaWJlcyBhIHN1YnNjcmliYWJsZSBvdXRwdXQgZmllbGQgdmFsdWUuICovXG5pbnRlcmZhY2UgU3Vic2NyaWJhYmxlT3V0cHV0PFQ+IHtcbiAgc3Vic2NyaWJlKGxpc3RlbmVyOiAodjogVCkgPT4gdm9pZCk6IHt1bnN1YnNjcmliZTogKCkgPT4gdm9pZH07XG59XG5cbi8qKlxuICogV2hldGhlciB0aGUgZ2l2ZW4gdmFsdWUgcmVwcmVzZW50cyBhIHN1YnNjcmliYWJsZSBvdXRwdXQuXG4gKlxuICogRm9yIGV4YW1wbGUsIGFuIGBFdmVudEVtaXR0ZXIsIGEgYFN1YmplY3RgLCBhbiBgT2JzZXJ2YWJsZWAgb3IgYW5cbiAqIGBPdXRwdXRFbWl0dGVyYC5cbiAqL1xuZnVuY3Rpb24gaXNPdXRwdXRTdWJzY3JpYmFibGUodmFsdWU6IHVua25vd24pOiB2YWx1ZSBpcyBTdWJzY3JpYmFibGVPdXRwdXQ8dW5rbm93bj4ge1xuICByZXR1cm4gKFxuICAgIHZhbHVlICE9IG51bGwgJiYgdHlwZW9mICh2YWx1ZSBhcyBQYXJ0aWFsPFN1YnNjcmliYWJsZU91dHB1dDx1bmtub3duPj4pLnN1YnNjcmliZSA9PT0gJ2Z1bmN0aW9uJ1xuICApO1xufVxuIl19