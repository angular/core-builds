/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { assertIndexInRange } from '../../util/assert';
import { isObservable } from '../../util/lang';
import { isProceduralRenderer } from '../interfaces/renderer';
import { isDirectiveHost } from '../interfaces/type_checks';
import { CLEANUP, CONTEXT, RENDERER } from '../interfaces/view';
import { assertTNodeType } from '../node_assert';
import { profiler } from '../profiler';
import { getCurrentDirectiveDef, getCurrentTNode, getLView, getTView } from '../state';
import { getComponentLViewByIndex, getNativeByTNode, unwrapRNode } from '../util/view_utils';
import { getOrCreateLViewCleanup, getOrCreateTViewCleanup, handleError, loadComponentRenderer, markViewDirty } from './shared';
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
    const lView = getLView();
    const tView = getTView();
    const tNode = getCurrentTNode();
    listenerInternal(tView, lView, lView[RENDERER], tNode, eventName, listenerFn, !!useCapture, eventTargetResolver);
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
    listenerInternal(tView, lView, renderer, tNode, eventName, listenerFn, false);
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
function listenerInternal(tView, lView, renderer, tNode, eventName, listenerFn, useCapture, eventTargetResolver) {
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
    if ((tNode.type & 3 /* TNodeType.AnyRNode */) || eventTargetResolver) {
        const native = getNativeByTNode(tNode, lView);
        const target = eventTargetResolver ? eventTargetResolver(native) : native;
        const lCleanupIndex = lCleanup.length;
        const idxOrTargetGetter = eventTargetResolver ?
            (_lView) => eventTargetResolver(unwrapRNode(_lView[tNode.index])) :
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
            listenerFn = wrapListener(tNode, lView, context, listenerFn, true /** preventDefault */);
            target.addEventListener(eventName, listenerFn, useCapture);
            ngDevMode && ngDevMode.rendererAddEventListener++;
            lCleanup.push(listenerFn);
            tCleanup && tCleanup.push(eventName, idxOrTargetGetter, lCleanupIndex, useCapture);
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
                if (ngDevMode && !isObservable(output)) {
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
        const startView = tNode.flags & 2 /* TNodeFlags.isComponentHost */ ?
            getComponentLViewByIndex(tNode.index, lView) :
            lView;
        markViewDirty(startView);
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
            // Necessary for legacy browsers that don't support preventDefault (e.g. IE)
            e.returnValue = false;
        }
        return result;
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGlzdGVuZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2luc3RydWN0aW9ucy9saXN0ZW5lci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFHSCxPQUFPLEVBQUMsa0JBQWtCLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUNyRCxPQUFPLEVBQUMsWUFBWSxFQUFDLE1BQU0saUJBQWlCLENBQUM7QUFFN0MsT0FBTyxFQUF1QixvQkFBb0IsRUFBWSxNQUFNLHdCQUF3QixDQUFDO0FBRTdGLE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSwyQkFBMkIsQ0FBQztBQUMxRCxPQUFPLEVBQUMsT0FBTyxFQUFFLE9BQU8sRUFBUyxRQUFRLEVBQVEsTUFBTSxvQkFBb0IsQ0FBQztBQUM1RSxPQUFPLEVBQUMsZUFBZSxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFDL0MsT0FBTyxFQUFDLFFBQVEsRUFBZ0IsTUFBTSxhQUFhLENBQUM7QUFDcEQsT0FBTyxFQUFDLHNCQUFzQixFQUFFLGVBQWUsRUFBRSxRQUFRLEVBQUUsUUFBUSxFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQ3JGLE9BQU8sRUFBQyx3QkFBd0IsRUFBRSxnQkFBZ0IsRUFBRSxXQUFXLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUUzRixPQUFPLEVBQUMsdUJBQXVCLEVBQUUsdUJBQXVCLEVBQUUsV0FBVyxFQUFFLHFCQUFxQixFQUFFLGFBQWEsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUk3SDs7Ozs7Ozs7Ozs7OztHQWFHO0FBQ0gsTUFBTSxVQUFVLFVBQVUsQ0FDdEIsU0FBaUIsRUFBRSxVQUE0QixFQUFFLFVBQW9CLEVBQ3JFLG1CQUEwQztJQUM1QyxNQUFNLEtBQUssR0FBRyxRQUFRLEVBQVcsQ0FBQztJQUNsQyxNQUFNLEtBQUssR0FBRyxRQUFRLEVBQUUsQ0FBQztJQUN6QixNQUFN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Q0FBQyxLQUFLLFFBQVEsRUFBRTtZQUNsQixPQUFPLFVBQVUsQ0FBQztTQUNuQjtRQUVELHVGQUF1RjtRQUN2RiwrRUFBK0U7UUFDL0UsTUFBTSxTQUFTLEdBQUcsS0FBSyxDQUFDLEtBQUsscUNBQTZCLENBQUMsQ0FBQztZQUN4RCx3QkFBd0IsQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUM7WUFDOUMsS0FBSyxDQUFDO1FBQ1YsYUFBYSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBRXpCLElBQUksTUFBTSxHQUFHLGdDQUFnQyxDQUFDLEtBQUssRUFBRSxPQUFPLEVBQUUsVUFBVSxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQzdFLDBGQUEwRjtRQUMxRix1Q0FBdUM7UUFDdkMsSUFBSSxjQUFjLEdBQVMseUNBQTBDLENBQUMsb0JBQW9CLENBQUM7UUFDM0YsT0FBTyxjQUFjLEVBQUU7WUFDckIsNEVBQTRFO1lBQzVFLE1BQU0sR0FBRyxnQ0FBZ0MsQ0FBQyxLQUFLLEVBQUUsT0FBTyxFQUFFLGNBQWMsRUFBRSxDQUFDLENBQUMsSUFBSSxNQUFNLENBQUM7WUFDdkYsY0FBYyxHQUFTLGNBQWUsQ0FBQyxvQkFBb0IsQ0FBQztTQUM3RDtRQUVELElBQUksc0JBQXNCLElBQUksTUFBTSxLQUFLLEtBQUssRUFBRTtZQUM5QyxDQUFDLENBQUMsY0FBYyxFQUFFLENBQUM7WUFDbkIsNEVBQTRFO1lBQzVFLENBQUMsQ0FBQyxXQUFXLEdBQUcsS0FBSyxDQUFDO1NBQ3ZCO1FBRUQsT0FBTyxNQUFNLENBQUM7SUFDaEIsQ0FBQyxDQUFDO0FBQ0osQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5cbmltcG9ydCB7YXNzZXJ0SW5kZXhJblJhbmdlfSBmcm9tICcuLi8uLi91dGlsL2Fzc2VydCc7XG5pbXBvcnQge2lzT2JzZXJ2YWJsZX0gZnJvbSAnLi4vLi4vdXRpbC9sYW5nJztcbmltcG9ydCB7UHJvcGVydHlBbGlhc1ZhbHVlLCBUTm9kZSwgVE5vZGVGbGFncywgVE5vZGVUeXBlfSBmcm9tICcuLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtHbG9iYWxUYXJnZXRSZXNvbHZlciwgaXNQcm9jZWR1cmFsUmVuZGVyZXIsIFJlbmRlcmVyM30gZnJvbSAnLi4vaW50ZXJmYWNlcy9yZW5kZXJlcic7XG5pbXBvcnQge1JFbGVtZW50fSBmcm9tICcuLi9pbnRlcmZhY2VzL3JlbmRlcmVyX2RvbSc7XG5pbXBvcnQge2lzRGlyZWN0aXZlSG9zdH0gZnJvbSAnLi4vaW50ZXJmYWNlcy90eXBlX2NoZWNrcyc7XG5pbXBvcnQge0NMRUFOVVAsIENPTlRFWFQsIExWaWV3LCBSRU5ERVJFUiwgVFZpZXd9IGZyb20gJy4uL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2Fzc2VydFROb2RlVHlwZX0gZnJvbSAnLi4vbm9kZV9hc3NlcnQnO1xuaW1wb3J0IHtwcm9maWxlciwgUHJvZmlsZXJFdmVudH0gZnJvbSAnLi4vcHJvZmlsZXInO1xuaW1wb3J0IHtnZXRDdXJyZW50RGlyZWN0aXZlRGVmLCBnZXRDdXJyZW50VE5vZGUsIGdldExWaWV3LCBnZXRUVmlld30gZnJvbSAnLi4vc3RhdGUnO1xuaW1wb3J0IHtnZXRDb21wb25lbnRMVmlld0J5SW5kZXgsIGdldE5hdGl2ZUJ5VE5vZGUsIHVud3JhcFJOb2RlfSBmcm9tICcuLi91dGlsL3ZpZXdfdXRpbHMnO1xuXG5pbXBvcnQge2dldE9yQ3JlYXRlTFZpZXdDbGVhbnVwLCBnZXRPckNyZWF0ZVRWaWV3Q2xlYW51cCwgaGFuZGxlRXJyb3IsIGxvYWRDb21wb25lbnRSZW5kZXJlciwgbWFya1ZpZXdEaXJ0eX0gZnJvbSAnLi9zaGFyZWQnO1xuXG5cblxuLyoqXG4gKiBBZGRzIGFuIGV2ZW50IGxpc3RlbmVyIHRvIHRoZSBjdXJyZW50IG5vZGUuXG4gKlxuICogSWYgYW4gb3V0cHV0IGV4aXN0cyBvbiBvbmUgb2YgdGhlIG5vZGUncyBkaXJlY3RpdmVzLCBpdCBhbHNvIHN1YnNjcmliZXMgdG8gdGhlIG91dHB1dFxuICogYW5kIHNhdmVzIHRoZSBzdWJzY3JpcHRpb24gZm9yIGxhdGVyIGNsZWFudXAuXG4gKlxuICogQHBhcmFtIGV2ZW50TmFtZSBOYW1lIG9mIHRoZSBldmVudFxuICogQHBhcmFtIGxpc3RlbmVyRm4gVGhlIGZ1bmN0aW9uIHRvIGJlIGNhbGxlZCB3aGVuIGV2ZW50IGVtaXRzXG4gKiBAcGFyYW0gdXNlQ2FwdHVyZSBXaGV0aGVyIG9yIG5vdCB0byB1c2UgY2FwdHVyZSBpbiBldmVudCBsaXN0ZW5lclxuICogQHBhcmFtIGV2ZW50VGFyZ2V0UmVzb2x2ZXIgRnVuY3Rpb24gdGhhdCByZXR1cm5zIGdsb2JhbCB0YXJnZXQgaW5mb3JtYXRpb24gaW4gY2FzZSB0aGlzIGxpc3RlbmVyXG4gKiBzaG91bGQgYmUgYXR0YWNoZWQgdG8gYSBnbG9iYWwgb2JqZWN0IGxpa2Ugd2luZG93LCBkb2N1bWVudCBvciBib2R5XG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVsaXN0ZW5lcihcbiAgICBldmVudE5hbWU6IHN0cmluZywgbGlzdGVuZXJGbjogKGU/OiBhbnkpID0+IGFueSwgdXNlQ2FwdHVyZT86IGJvb2xlYW4sXG4gICAgZXZlbnRUYXJnZXRSZXNvbHZlcj86IEdsb2JhbFRhcmdldFJlc29sdmVyKTogdHlwZW9mIMm1ybVsaXN0ZW5lciB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXc8e318bnVsbD4oKTtcbiAgY29uc3QgdFZpZXcgPSBnZXRUVmlldygpO1xuICBjb25zdCB0Tm9kZSA9IGdldEN1cnJlbnRUTm9kZSgpITtcbiAgbGlzdGVuZXJJbnRlcm5hbChcbiAgICAgIHRWaWV3LCBsVmlldywgbFZpZXdbUkVOREVSRVJdLCB0Tm9kZSwgZXZlbnROYW1lLCBsaXN0ZW5lckZuLCAhIXVzZUNhcHR1cmUsXG4gICAgICBldmVudFRhcmdldFJlc29sdmVyKTtcbiAgcmV0dXJuIMm1ybVsaXN0ZW5lcjtcbn1cblxuLyoqXG4gKiBSZWdpc3RlcnMgYSBzeW50aGV0aWMgaG9zdCBsaXN0ZW5lciAoZS5nLiBgKEBmb28uc3RhcnQpYCkgb24gYSBjb21wb25lbnQgb3IgZGlyZWN0aXZlLlxuICpcbiAqIFRoaXMgaW5zdHJ1Y3Rpb24gaXMgZm9yIGNvbXBhdGliaWxpdHkgcHVycG9zZXMgYW5kIGlzIGRlc2lnbmVkIHRvIGVuc3VyZSB0aGF0IGFcbiAqIHN5bnRoZXRpYyBob3N0IGxpc3RlbmVyIChlLmcuIGBASG9zdExpc3RlbmVyKCdAZm9vLnN0YXJ0JylgKSBwcm9wZXJseSBnZXRzIHJlbmRlcmVkXG4gKiBpbiB0aGUgY29tcG9uZW50J3MgcmVuZGVyZXIuIE5vcm1hbGx5IGFsbCBob3N0IGxpc3RlbmVycyBhcmUgZXZhbHVhdGVkIHdpdGggdGhlXG4gKiBwYXJlbnQgY29tcG9uZW50J3MgcmVuZGVyZXIsIGJ1dCwgaW4gdGhlIGNhc2Ugb2YgYW5pbWF0aW9uIEB0cmlnZ2VycywgdGhleSBuZWVkXG4gKiB0byBiZSBldmFsdWF0ZWQgd2l0aCB0aGUgc3ViIGNvbXBvbmVudCdzIHJlbmRlcmVyIChiZWNhdXNlIHRoYXQncyB3aGVyZSB0aGVcbiAqIGFuaW1hdGlvbiB0cmlnZ2VycyBhcmUgZGVmaW5lZCkuXG4gKlxuICogRG8gbm90IHVzZSB0aGlzIGluc3RydWN0aW9uIGFzIGEgcmVwbGFjZW1lbnQgZm9yIGBsaXN0ZW5lcmAuIFRoaXMgaW5zdHJ1Y3Rpb25cbiAqIG9ubHkgZXhpc3RzIHRvIGVuc3VyZSBjb21wYXRpYmlsaXR5IHdpdGggdGhlIFZpZXdFbmdpbmUncyBob3N0IGJpbmRpbmcgYmVoYXZpb3IuXG4gKlxuICogQHBhcmFtIGV2ZW50TmFtZSBOYW1lIG9mIHRoZSBldmVudFxuICogQHBhcmFtIGxpc3RlbmVyRm4gVGhlIGZ1bmN0aW9uIHRvIGJlIGNhbGxlZCB3aGVuIGV2ZW50IGVtaXRzXG4gKiBAcGFyYW0gdXNlQ2FwdHVyZSBXaGV0aGVyIG9yIG5vdCB0byB1c2UgY2FwdHVyZSBpbiBldmVudCBsaXN0ZW5lclxuICogQHBhcmFtIGV2ZW50VGFyZ2V0UmVzb2x2ZXIgRnVuY3Rpb24gdGhhdCByZXR1cm5zIGdsb2JhbCB0YXJnZXQgaW5mb3JtYXRpb24gaW4gY2FzZSB0aGlzIGxpc3RlbmVyXG4gKiBzaG91bGQgYmUgYXR0YWNoZWQgdG8gYSBnbG9iYWwgb2JqZWN0IGxpa2Ugd2luZG93LCBkb2N1bWVudCBvciBib2R5XG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVzeW50aGV0aWNIb3N0TGlzdGVuZXIoXG4gICAgZXZlbnROYW1lOiBzdHJpbmcsIGxpc3RlbmVyRm46IChlPzogYW55KSA9PiBhbnkpOiB0eXBlb2YgybXJtXN5bnRoZXRpY0hvc3RMaXN0ZW5lciB7XG4gIGNvbnN0IHROb2RlID0gZ2V0Q3VycmVudFROb2RlKCkhO1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3PHt9fG51bGw+KCk7XG4gIGNvbnN0IHRWaWV3ID0gZ2V0VFZpZXcoKTtcbiAgY29uc3QgY3VycmVudERlZiA9IGdldEN1cnJlbnREaXJlY3RpdmVEZWYodFZpZXcuZGF0YSk7XG4gIGNvbnN0IHJlbmRlcmVyID0gbG9hZENvbXBvbmVudFJlbmRlcmVyKGN1cnJlbnREZWYsIHROb2RlLCBsVmlldyk7XG4gIGxpc3RlbmVySW50ZXJuYWwodFZpZXcsIGxWaWV3LCByZW5kZXJlciwgdE5vZGUsIGV2ZW50TmFtZSwgbGlzdGVuZXJGbiwgZmFsc2UpO1xuICByZXR1cm4gybXJtXN5bnRoZXRpY0hvc3RMaXN0ZW5lcjtcbn1cblxuLyoqXG4gKiBBIHV0aWxpdHkgZnVuY3Rpb24gdGhhdCBjaGVja3MgaWYgYSBnaXZlbiBlbGVtZW50IGhhcyBhbHJlYWR5IGFuIGV2ZW50IGhhbmRsZXIgcmVnaXN0ZXJlZCBmb3IgYW5cbiAqIGV2ZW50IHdpdGggYSBzcGVjaWZpZWQgbmFtZS4gVGhlIFRWaWV3LmNsZWFudXAgZGF0YSBzdHJ1Y3R1cmUgaXMgdXNlZCB0byBmaW5kIG91dCB3aGljaCBldmVudHNcbiAqIGFyZSByZWdpc3RlcmVkIGZvciBhIGdpdmVuIGVsZW1lbnQuXG4gKi9cbmZ1bmN0aW9uIGZpbmRFeGlzdGluZ0xpc3RlbmVyKFxuICAgIHRWaWV3OiBUVmlldywgbFZpZXc6IExWaWV3LCBldmVudE5hbWU6IHN0cmluZywgdE5vZGVJZHg6IG51bWJlcik6ICgoZT86IGFueSkgPT4gYW55KXxudWxsIHtcbiAgY29uc3QgdENsZWFudXAgPSB0Vmlldy5jbGVhbnVwO1xuICBpZiAodENsZWFudXAgIT0gbnVsbCkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdENsZWFudXAubGVuZ3RoIC0gMTsgaSArPSAyKSB7XG4gICAgICBjb25zdCBjbGVhbnVwRXZlbnROYW1lID0gdENsZWFudXBbaV07XG4gICAgICBpZiAoY2xlYW51cEV2ZW50TmFtZSA9PT0gZXZlbnROYW1lICYmIHRDbGVhbnVwW2kgKyAxXSA9PT0gdE5vZGVJZHgpIHtcbiAgICAgICAgLy8gV2UgaGF2ZSBmb3VuZCBhIG1hdGNoaW5nIGV2ZW50IG5hbWUgb24gdGhlIHNhbWUgbm9kZSBidXQgaXQgbWlnaHQgbm90IGhhdmUgYmVlblxuICAgICAgICAvLyByZWdpc3RlcmVkIHlldCwgc28gd2UgbXVzdCBleHBsaWNpdGx5IHZlcmlmeSBlbnRyaWVzIGluIHRoZSBMVmlldyBjbGVhbnVwIGRhdGFcbiAgICAgICAgLy8gc3RydWN0dXJlcy5cbiAgICAgICAgY29uc3QgbENsZWFudXAgPSBsVmlld1tDTEVBTlVQXSE7XG4gICAgICAgIGNvbnN0IGxpc3RlbmVySWR4SW5MQ2xlYW51cCA9IHRDbGVhbnVwW2kgKyAyXTtcbiAgICAgICAgcmV0dXJuIGxDbGVhbnVwLmxlbmd0aCA+IGxpc3RlbmVySWR4SW5MQ2xlYW51cCA/IGxDbGVhbnVwW2xpc3RlbmVySWR4SW5MQ2xlYW51cF0gOiBudWxsO1xuICAgICAgfVxuICAgICAgLy8gVFZpZXcuY2xlYW51cCBjYW4gaGF2ZSBhIG1peCBvZiA0LWVsZW1lbnRzIGVudHJpZXMgKGZvciBldmVudCBoYW5kbGVyIGNsZWFudXBzKSBvclxuICAgICAgLy8gMi1lbGVtZW50IGVudHJpZXMgKGZvciBkaXJlY3RpdmUgYW5kIHF1ZXJpZXMgZGVzdHJveSBob29rcykuIEFzIHN1Y2ggd2UgY2FuIGVuY291bnRlclxuICAgICAgLy8gYmxvY2tzIG9mIDQgb3IgMiBpdGVtcyBpbiB0aGUgdFZpZXcuY2xlYW51cCBhbmQgdGhpcyBpcyB3aHkgd2UgaXRlcmF0ZSBvdmVyIDIgZWxlbWVudHNcbiAgICAgIC8vIGZpcnN0IGFuZCBqdW1wIGFub3RoZXIgMiBlbGVtZW50cyBpZiB3ZSBkZXRlY3QgbGlzdGVuZXJzIGNsZWFudXAgKDQgZWxlbWVudHMpLiBBbHNvIGNoZWNrXG4gICAgICAvLyBkb2N1bWVudGF0aW9uIG9mIFRWaWV3LmNsZWFudXAgZm9yIG1vcmUgZGV0YWlscyBvZiB0aGlzIGRhdGEgc3RydWN0dXJlIGxheW91dC5cbiAgICAgIGlmICh0eXBlb2YgY2xlYW51cEV2ZW50TmFtZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgaSArPSAyO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuZnVuY3Rpb24gbGlzdGVuZXJJbnRlcm5hbChcbiAgICB0VmlldzogVFZpZXcsIGxWaWV3OiBMVmlldzx7fXxudWxsPiwgcmVuZGVyZXI6IFJlbmRlcmVyMywgdE5vZGU6IFROb2RlLCBldmVudE5hbWU6IHN0cmluZyxcbiAgICBsaXN0ZW5lckZuOiAoZT86IGFueSkgPT4gYW55LCB1c2VDYXB0dXJlOiBib29sZWFuLFxuICAgIGV2ZW50VGFyZ2V0UmVzb2x2ZXI/OiBHbG9iYWxUYXJnZXRSZXNvbHZlcik6IHZvaWQge1xuICBjb25zdCBpc1ROb2RlRGlyZWN0aXZlSG9zdCA9IGlzRGlyZWN0aXZlSG9zdCh0Tm9kZSk7XG4gIGNvbnN0IGZpcnN0Q3JlYXRlUGFzcyA9IHRWaWV3LmZpcnN0Q3JlYXRlUGFzcztcbiAgY29uc3QgdENsZWFudXA6IGZhbHNlfGFueVtdID0gZmlyc3RDcmVhdGVQYXNzICYmIGdldE9yQ3JlYXRlVFZpZXdDbGVhbnVwKHRWaWV3KTtcbiAgY29uc3QgY29udGV4dCA9IGxWaWV3W0NPTlRFWFRdO1xuXG4gIC8vIFdoZW4gdGhlIMm1ybVsaXN0ZW5lciBpbnN0cnVjdGlvbiB3YXMgZ2VuZXJhdGVkIGFuZCBpcyBleGVjdXRlZCB3ZSBrbm93IHRoYXQgdGhlcmUgaXMgZWl0aGVyIGFcbiAgLy8gbmF0aXZlIGxpc3RlbmVyIG9yIGEgZGlyZWN0aXZlIG91dHB1dCBvbiB0aGlzIGVsZW1lbnQuIEFzIHN1Y2ggd2Ugd2Uga25vdyB0aGF0IHdlIHdpbGwgaGF2ZSB0b1xuICAvLyByZWdpc3RlciBhIGxpc3RlbmVyIGFuZCBzdG9yZSBpdHMgY2xlYW51cCBmdW5jdGlvbiBvbiBMVmlldy5cbiAgY29uc3QgbENsZWFudXAgPSBnZXRPckNyZWF0ZUxWaWV3Q2xlYW51cChsVmlldyk7XG5cbiAgbmdEZXZNb2RlICYmIGFzc2VydFROb2RlVHlwZSh0Tm9kZSwgVE5vZGVUeXBlLkFueVJOb2RlIHwgVE5vZGVUeXBlLkFueUNvbnRhaW5lcik7XG5cbiAgbGV0IHByb2Nlc3NPdXRwdXRzID0gdHJ1ZTtcblxuICAvLyBBZGRpbmcgYSBuYXRpdmUgZXZlbnQgbGlzdGVuZXIgaXMgYXBwbGljYWJsZSB3aGVuOlxuICAvLyAtIFRoZSBjb3JyZXNwb25kaW5nIFROb2RlIHJlcHJlc2VudHMgYSBET00gZWxlbWVudC5cbiAgLy8gLSBUaGUgZXZlbnQgdGFyZ2V0IGhhcyBhIHJlc29sdmVyICh1c3VhbGx5IHJlc3VsdGluZyBpbiBhIGdsb2JhbCBvYmplY3QsXG4gIC8vICAgc3VjaCBhcyBgd2luZG93YCBvciBgZG9jdW1lbnRgKS5cbiAgaWYgKCh0Tm9kZS50eXBlICYgVE5vZGVUeXBlLkFueVJOb2RlKSB8fCBldmVudFRhcmdldFJlc29sdmVyKSB7XG4gICAgY29uc3QgbmF0aXZlID0gZ2V0TmF0aXZlQnlUTm9kZSh0Tm9kZSwgbFZpZXcpIGFzIFJFbGVtZW50O1xuICAgIGNvbnN0IHRhcmdldCA9IGV2ZW50VGFyZ2V0UmVzb2x2ZXIgPyBldmVudFRhcmdldFJlc29sdmVyKG5hdGl2ZSkgOiBuYXRpdmU7XG4gICAgY29uc3QgbENsZWFudXBJbmRleCA9IGxDbGVhbnVwLmxlbmd0aDtcbiAgICBjb25zdCBpZHhPclRhcmdldEdldHRlciA9IGV2ZW50VGFyZ2V0UmVzb2x2ZXIgP1xuICAgICAgICAoX2xWaWV3OiBMVmlldykgPT4gZXZlbnRUYXJnZXRSZXNvbHZlcih1bndyYXBSTm9kZShfbFZpZXdbdE5vZGUuaW5kZXhdKSkgOlxuICAgICAgICB0Tm9kZS5pbmRleDtcblxuICAgIC8vIEluIG9yZGVyIHRvIG1hdGNoIGN1cnJlbnQgYmVoYXZpb3IsIG5hdGl2ZSBET00gZXZlbnQgbGlzdGVuZXJzIG11c3QgYmUgYWRkZWQgZm9yIGFsbFxuICAgIC8vIGV2ZW50cyAoaW5jbHVkaW5nIG91dHB1dHMpLlxuICAgIGlmIChpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikpIHtcbiAgICAgIC8vIFRoZXJlIG1pZ2h0IGJlIGNhc2VzIHdoZXJlIG11bHRpcGxlIGRpcmVjdGl2ZXMgb24gdGhlIHNhbWUgZWxlbWVudCB0cnkgdG8gcmVnaXN0ZXIgYW4gZXZlbnRcbiAgICAgIC8vIGhhbmRsZXIgZnVuY3Rpb24gZm9yIHRoZSBzYW1lIGV2ZW50LiBJbiB0aGlzIHNpdHVhdGlvbiB3ZSB3YW50IHRvIGF2b2lkIHJlZ2lzdHJhdGlvbiBvZlxuICAgICAgLy8gc2V2ZXJhbCBuYXRpdmUgbGlzdGVuZXJzIGFzIGVhY2ggcmVnaXN0cmF0aW9uIHdvdWxkIGJlIGludGVyY2VwdGVkIGJ5IE5nWm9uZSBhbmRcbiAgICAgIC8vIHRyaWdnZXIgY2hhbmdlIGRldGVjdGlvbi4gVGhpcyB3b3VsZCBtZWFuIHRoYXQgYSBzaW5nbGUgdXNlciBhY3Rpb24gd291bGQgcmVzdWx0IGluIHNldmVyYWxcbiAgICAgIC8vIGNoYW5nZSBkZXRlY3Rpb25zIGJlaW5nIGludm9rZWQuIFRvIGF2b2lkIHRoaXMgc2l0dWF0aW9uIHdlIHdhbnQgdG8gaGF2ZSBvbmx5IG9uZSBjYWxsIHRvXG4gICAgICAvLyBuYXRpdmUgaGFuZGxlciByZWdpc3RyYXRpb24gKGZvciB0aGUgc2FtZSBlbGVtZW50IGFuZCBzYW1lIHR5cGUgb2YgZXZlbnQpLlxuICAgICAgLy9cbiAgICAgIC8vIEluIG9yZGVyIHRvIGhhdmUganVzdCBvbmUgbmF0aXZlIGV2ZW50IGhhbmRsZXIgaW4gcHJlc2VuY2Ugb2YgbXVsdGlwbGUgaGFuZGxlciBmdW5jdGlvbnMsXG4gICAgICAvLyB3ZSBqdXN0IHJlZ2lzdGVyIGEgZmlyc3QgaGFuZGxlciBmdW5jdGlvbiBhcyBhIG5hdGl2ZSBldmVudCBsaXN0ZW5lciBhbmQgdGhlbiBjaGFpblxuICAgICAgLy8gKGNvYWxlc2NlKSBvdGhlciBoYW5kbGVyIGZ1bmN0aW9ucyBvbiB0b3Agb2YgdGhlIGZpcnN0IG5hdGl2ZSBoYW5kbGVyIGZ1bmN0aW9uLlxuICAgICAgbGV0IGV4aXN0aW5nTGlzdGVuZXIgPSBudWxsO1xuICAgICAgLy8gUGxlYXNlIG5vdGUgdGhhdCB0aGUgY29hbGVzY2luZyBkZXNjcmliZWQgaGVyZSBkb2Vzbid0IGhhcHBlbiBmb3IgZXZlbnRzIHNwZWNpZnlpbmcgYW5cbiAgICAgIC8vIGFsdGVybmF0aXZlIHRhcmdldCAoZXguIChkb2N1bWVudDpjbGljaykpIC0gdGhpcyBpcyB0byBrZWVwIGJhY2t3YXJkIGNvbXBhdGliaWxpdHkgd2l0aCB0aGVcbiAgICAgIC8vIHZpZXcgZW5naW5lLlxuICAgICAgLy8gQWxzbywgd2UgZG9uJ3QgaGF2ZSB0byBzZWFyY2ggZm9yIGV4aXN0aW5nIGxpc3RlbmVycyBpcyB0aGVyZSBhcmUgbm8gZGlyZWN0aXZlc1xuICAgICAgLy8gbWF0Y2hpbmcgb24gYSBnaXZlbiBub2RlIGFzIHdlIGNhbid0IHJlZ2lzdGVyIG11bHRpcGxlIGV2ZW50IGhhbmRsZXJzIGZvciB0aGUgc2FtZSBldmVudCBpblxuICAgICAgLy8gYSB0ZW1wbGF0ZSAodGhpcyB3b3VsZCBtZWFuIGhhdmluZyBkdXBsaWNhdGUgYXR0cmlidXRlcykuXG4gICAgICBpZiAoIWV2ZW50VGFyZ2V0UmVzb2x2ZXIgJiYgaXNUTm9kZURpcmVjdGl2ZUhvc3QpIHtcbiAgICAgICAgZXhpc3RpbmdMaXN0ZW5lciA9IGZpbmRFeGlzdGluZ0xpc3RlbmVyKHRWaWV3LCBsVmlldywgZXZlbnROYW1lLCB0Tm9kZS5pbmRleCk7XG4gICAgICB9XG4gICAgICBpZiAoZXhpc3RpbmdMaXN0ZW5lciAhPT0gbnVsbCkge1xuICAgICAgICAvLyBBdHRhY2ggYSBuZXcgbGlzdGVuZXIgdG8gY29hbGVzY2VkIGxpc3RlbmVycyBsaXN0LCBtYWludGFpbmluZyB0aGUgb3JkZXIgaW4gd2hpY2hcbiAgICAgICAgLy8gbGlzdGVuZXJzIGFyZSByZWdpc3RlcmVkLiBGb3IgcGVyZm9ybWFuY2UgcmVhc29ucywgd2Uga2VlcCBhIHJlZmVyZW5jZSB0byB0aGUgbGFzdFxuICAgICAgICAvLyBsaXN0ZW5lciBpbiB0aGF0IGxpc3QgKGluIGBfX25nTGFzdExpc3RlbmVyRm5fX2AgZmllbGQpLCBzbyB3ZSBjYW4gYXZvaWQgZ29pbmcgdGhyb3VnaFxuICAgICAgICAvLyB0aGUgZW50aXJlIHNldCBlYWNoIHRpbWUgd2UgbmVlZCB0byBhZGQgYSBuZXcgbGlzdGVuZXIuXG4gICAgICAgIGNvbnN0IGxhc3RMaXN0ZW5lckZuID0gKDxhbnk+ZXhpc3RpbmdMaXN0ZW5lcikuX19uZ0xhc3RMaXN0ZW5lckZuX18gfHwgZXhpc3RpbmdMaXN0ZW5lcjtcbiAgICAgICAgbGFzdExpc3RlbmVyRm4uX19uZ05leHRMaXN0ZW5lckZuX18gPSBsaXN0ZW5lckZuO1xuICAgICAgICAoPGFueT5leGlzdGluZ0xpc3RlbmVyKS5fX25nTGFzdExpc3RlbmVyRm5fXyA9IGxpc3RlbmVyRm47XG4gICAgICAgIHByb2Nlc3NPdXRwdXRzID0gZmFsc2U7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBsaXN0ZW5lckZuID0gd3JhcExpc3RlbmVyKHROb2RlLCBsVmlldywgY29udGV4dCwgbGlzdGVuZXJGbiwgZmFsc2UgLyoqIHByZXZlbnREZWZhdWx0ICovKTtcbiAgICAgICAgY29uc3QgY2xlYW51cEZuID0gcmVuZGVyZXIubGlzdGVuKHRhcmdldCBhcyBSRWxlbWVudCwgZXZlbnROYW1lLCBsaXN0ZW5lckZuKTtcbiAgICAgICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlckFkZEV2ZW50TGlzdGVuZXIrKztcblxuICAgICAgICBsQ2xlYW51cC5wdXNoKGxpc3RlbmVyRm4sIGNsZWFudXBGbik7XG4gICAgICAgIHRDbGVhbnVwICYmIHRDbGVhbnVwLnB1c2goZXZlbnROYW1lLCBpZHhPclRhcmdldEdldHRlciwgbENsZWFudXBJbmRleCwgbENsZWFudXBJbmRleCArIDEpO1xuICAgICAgfVxuXG4gICAgfSBlbHNlIHtcbiAgICAgIGxpc3RlbmVyRm4gPSB3cmFwTGlzdGVuZXIodE5vZGUsIGxWaWV3LCBjb250ZXh0LCBsaXN0ZW5lckZuLCB0cnVlIC8qKiBwcmV2ZW50RGVmYXVsdCAqLyk7XG4gICAgICB0YXJnZXQuYWRkRXZlbnRMaXN0ZW5lcihldmVudE5hbWUsIGxpc3RlbmVyRm4sIHVzZUNhcHR1cmUpO1xuICAgICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlckFkZEV2ZW50TGlzdGVuZXIrKztcblxuICAgICAgbENsZWFudXAucHVzaChsaXN0ZW5lckZuKTtcbiAgICAgIHRDbGVhbnVwICYmIHRDbGVhbnVwLnB1c2goZXZlbnROYW1lLCBpZHhPclRhcmdldEdldHRlciwgbENsZWFudXBJbmRleCwgdXNlQ2FwdHVyZSk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIC8vIEV2ZW4gaWYgdGhlcmUgaXMgbm8gbmF0aXZlIGxpc3RlbmVyIHRvIGFkZCwgd2Ugc3RpbGwgbmVlZCB0byB3cmFwIHRoZSBsaXN0ZW5lciBzbyB0aGF0IE9uUHVzaFxuICAgIC8vIGFuY2VzdG9ycyBhcmUgbWFya2VkIGRpcnR5IHdoZW4gYW4gZXZlbnQgb2NjdXJzLlxuICAgIGxpc3RlbmVyRm4gPSB3cmFwTGlzdGVuZXIodE5vZGUsIGxWaWV3LCBjb250ZXh0LCBsaXN0ZW5lckZuLCBmYWxzZSAvKiogcHJldmVudERlZmF1bHQgKi8pO1xuICB9XG5cbiAgLy8gc3Vic2NyaWJlIHRvIGRpcmVjdGl2ZSBvdXRwdXRzXG4gIGNvbnN0IG91dHB1dHMgPSB0Tm9kZS5vdXRwdXRzO1xuICBsZXQgcHJvcHM6IFByb3BlcnR5QWxpYXNWYWx1ZXx1bmRlZmluZWQ7XG4gIGlmIChwcm9jZXNzT3V0cHV0cyAmJiBvdXRwdXRzICE9PSBudWxsICYmIChwcm9wcyA9IG91dHB1dHNbZXZlbnROYW1lXSkpIHtcbiAgICBjb25zdCBwcm9wc0xlbmd0aCA9IHByb3BzLmxlbmd0aDtcbiAgICBpZiAocHJvcHNMZW5ndGgpIHtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcHJvcHNMZW5ndGg7IGkgKz0gMikge1xuICAgICAgICBjb25zdCBpbmRleCA9IHByb3BzW2ldIGFzIG51bWJlcjtcbiAgICAgICAgbmdEZXZNb2RlICYmIGFzc2VydEluZGV4SW5SYW5nZShsVmlldywgaW5kZXgpO1xuICAgICAgICBjb25zdCBtaW5pZmllZE5hbWUgPSBwcm9wc1tpICsgMV07XG4gICAgICAgIGNvbnN0IGRpcmVjdGl2ZUluc3RhbmNlID0gbFZpZXdbaW5kZXhdO1xuICAgICAgICBjb25zdCBvdXRwdXQgPSBkaXJlY3RpdmVJbnN0YW5jZVttaW5pZmllZE5hbWVdO1xuXG4gICAgICAgIGlmIChuZ0Rldk1vZGUgJiYgIWlzT2JzZXJ2YWJsZShvdXRwdXQpKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBAT3V0cHV0ICR7bWluaWZpZWROYW1lfSBub3QgaW5pdGlhbGl6ZWQgaW4gJyR7XG4gICAgICAgICAgICAgIGRpcmVjdGl2ZUluc3RhbmNlLmNvbnN0cnVjdG9yLm5hbWV9Jy5gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHN1YnNjcmlwdGlvbiA9IG91dHB1dC5zdWJzY3JpYmUobGlzdGVuZXJGbik7XG4gICAgICAgIGNvbnN0IGlkeCA9IGxDbGVhbnVwLmxlbmd0aDtcbiAgICAgICAgbENsZWFudXAucHVzaChsaXN0ZW5lckZuLCBzdWJzY3JpcHRpb24pO1xuICAgICAgICB0Q2xlYW51cCAmJiB0Q2xlYW51cC5wdXNoKGV2ZW50TmFtZSwgdE5vZGUuaW5kZXgsIGlkeCwgLShpZHggKyAxKSk7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGV4ZWN1dGVMaXN0ZW5lcldpdGhFcnJvckhhbmRsaW5nKFxuICAgIGxWaWV3OiBMVmlldywgY29udGV4dDoge318bnVsbCwgbGlzdGVuZXJGbjogKGU/OiBhbnkpID0+IGFueSwgZTogYW55KTogYm9vbGVhbiB7XG4gIHRyeSB7XG4gICAgcHJvZmlsZXIoUHJvZmlsZXJFdmVudC5PdXRwdXRTdGFydCwgY29udGV4dCwgbGlzdGVuZXJGbik7XG4gICAgLy8gT25seSBleHBsaWNpdGx5IHJldHVybmluZyBmYWxzZSBmcm9tIGEgbGlzdGVuZXIgc2hvdWxkIHByZXZlbnREZWZhdWx0XG4gICAgcmV0dXJuIGxpc3RlbmVyRm4oZSkgIT09IGZhbHNlO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGhhbmRsZUVycm9yKGxWaWV3LCBlcnJvcik7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9IGZpbmFsbHkge1xuICAgIHByb2ZpbGVyKFByb2ZpbGVyRXZlbnQuT3V0cHV0RW5kLCBjb250ZXh0LCBsaXN0ZW5lckZuKTtcbiAgfVxufVxuXG4vKipcbiAqIFdyYXBzIGFuIGV2ZW50IGxpc3RlbmVyIHdpdGggYSBmdW5jdGlvbiB0aGF0IG1hcmtzIGFuY2VzdG9ycyBkaXJ0eSBhbmQgcHJldmVudHMgZGVmYXVsdCBiZWhhdmlvcixcbiAqIGlmIGFwcGxpY2FibGUuXG4gKlxuICogQHBhcmFtIHROb2RlIFRoZSBUTm9kZSBhc3NvY2lhdGVkIHdpdGggdGhpcyBsaXN0ZW5lclxuICogQHBhcmFtIGxWaWV3IFRoZSBMVmlldyB0aGF0IGNvbnRhaW5zIHRoaXMgbGlzdGVuZXJcbiAqIEBwYXJhbSBsaXN0ZW5lckZuIFRoZSBsaXN0ZW5lciBmdW5jdGlvbiB0byBjYWxsXG4gKiBAcGFyYW0gd3JhcFdpdGhQcmV2ZW50RGVmYXVsdCBXaGV0aGVyIG9yIG5vdCB0byBwcmV2ZW50IGRlZmF1bHQgYmVoYXZpb3JcbiAqICh0aGUgcHJvY2VkdXJhbCByZW5kZXJlciBkb2VzIHRoaXMgYWxyZWFkeSwgc28gaW4gdGhvc2UgY2FzZXMsIHdlIHNob3VsZCBza2lwKVxuICovXG5mdW5jdGlvbiB3cmFwTGlzdGVuZXIoXG4gICAgdE5vZGU6IFROb2RlLCBsVmlldzogTFZpZXc8e318bnVsbD4sIGNvbnRleHQ6IHt9fG51bGwsIGxpc3RlbmVyRm46IChlPzogYW55KSA9PiBhbnksXG4gICAgd3JhcFdpdGhQcmV2ZW50RGVmYXVsdDogYm9vbGVhbik6IEV2ZW50TGlzdGVuZXIge1xuICAvLyBOb3RlOiB3ZSBhcmUgcGVyZm9ybWluZyBtb3N0IG9mIHRoZSB3b3JrIGluIHRoZSBsaXN0ZW5lciBmdW5jdGlvbiBpdHNlbGZcbiAgLy8gdG8gb3B0aW1pemUgbGlzdGVuZXIgcmVnaXN0cmF0aW9uLlxuICByZXR1cm4gZnVuY3Rpb24gd3JhcExpc3RlbmVySW5fbWFya0RpcnR5QW5kUHJldmVudERlZmF1bHQoZTogYW55KSB7XG4gICAgLy8gSXZ5IHVzZXMgYEZ1bmN0aW9uYCBhcyBhIHNwZWNpYWwgdG9rZW4gdGhhdCBhbGxvd3MgdXMgdG8gdW53cmFwIHRoZSBmdW5jdGlvblxuICAgIC8vIHNvIHRoYXQgaXQgY2FuIGJlIGludm9rZWQgcHJvZ3JhbW1hdGljYWxseSBieSBgRGVidWdOb2RlLnRyaWdnZXJFdmVudEhhbmRsZXJgLlxuICAgIGlmIChlID09PSBGdW5jdGlvbikge1xuICAgICAgcmV0dXJuIGxpc3RlbmVyRm47XG4gICAgfVxuXG4gICAgLy8gSW4gb3JkZXIgdG8gYmUgYmFja3dhcmRzIGNvbXBhdGlibGUgd2l0aCBWaWV3IEVuZ2luZSwgZXZlbnRzIG9uIGNvbXBvbmVudCBob3N0IG5vZGVzXG4gICAgLy8gbXVzdCBhbHNvIG1hcmsgdGhlIGNvbXBvbmVudCB2aWV3IGl0c2VsZiBkaXJ0eSAoaS5lLiB0aGUgdmlldyB0aGF0IGl0IG93bnMpLlxuICAgIGNvbnN0IHN0YXJ0VmlldyA9IHROb2RlLmZsYWdzICYgVE5vZGVGbGFncy5pc0NvbXBvbmVudEhvc3QgP1xuICAgICAgICBnZXRDb21wb25lbnRMVmlld0J5SW5kZXgodE5vZGUuaW5kZXgsIGxWaWV3KSA6XG4gICAgICAgIGxWaWV3O1xuICAgIG1hcmtWaWV3RGlydHkoc3RhcnRWaWV3KTtcblxuICAgIGxldCByZXN1bHQgPSBleGVjdXRlTGlzdGVuZXJXaXRoRXJyb3JIYW5kbGluZyhsVmlldywgY29udGV4dCwgbGlzdGVuZXJGbiwgZSk7XG4gICAgLy8gQSBqdXN0LWludm9rZWQgbGlzdGVuZXIgZnVuY3Rpb24gbWlnaHQgaGF2ZSBjb2FsZXNjZWQgbGlzdGVuZXJzIHNvIHdlIG5lZWQgdG8gY2hlY2sgZm9yXG4gICAgLy8gdGhlaXIgcHJlc2VuY2UgYW5kIGludm9rZSBhcyBuZWVkZWQuXG4gICAgbGV0IG5leHRMaXN0ZW5lckZuID0gKDxhbnk+d3JhcExpc3RlbmVySW5fbWFya0RpcnR5QW5kUHJldmVudERlZmF1bHQpLl9fbmdOZXh0TGlzdGVuZXJGbl9fO1xuICAgIHdoaWxlIChuZXh0TGlzdGVuZXJGbikge1xuICAgICAgLy8gV2Ugc2hvdWxkIHByZXZlbnQgZGVmYXVsdCBpZiBhbnkgb2YgdGhlIGxpc3RlbmVycyBleHBsaWNpdGx5IHJldHVybiBmYWxzZVxuICAgICAgcmVzdWx0ID0gZXhlY3V0ZUxpc3RlbmVyV2l0aEVycm9ySGFuZGxpbmcobFZpZXcsIGNvbnRleHQsIG5leHRMaXN0ZW5lckZuLCBlKSAmJiByZXN1bHQ7XG4gICAgICBuZXh0TGlzdGVuZXJGbiA9ICg8YW55Pm5leHRMaXN0ZW5lckZuKS5fX25nTmV4dExpc3RlbmVyRm5fXztcbiAgICB9XG5cbiAgICBpZiAod3JhcFdpdGhQcmV2ZW50RGVmYXVsdCAmJiByZXN1bHQgPT09IGZhbHNlKSB7XG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAvLyBOZWNlc3NhcnkgZm9yIGxlZ2FjeSBicm93c2VycyB0aGF0IGRvbid0IHN1cHBvcnQgcHJldmVudERlZmF1bHQgKGUuZy4gSUUpXG4gICAgICBlLnJldHVyblZhbHVlID0gZmFsc2U7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfTtcbn1cbiJdfQ==