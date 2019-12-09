/**
 * @fileoverview added by tsickle
 * Generated from: packages/core/src/render3/instructions/listener.ts
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
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
 * \@codeGenApi
 * @param {?} eventName Name of the event
 * @param {?} listenerFn The function to be called when event emits
 * @param {?=} useCapture Whether or not to use capture in event listener
 * @param {?=} eventTargetResolver Function that returns global target information in case this listener
 * should be attached to a global object like window, document or body
 *
 * @return {?}
 */
export function ɵɵlistener(eventName, listenerFn, useCapture = false, eventTargetResolver) {
    /** @type {?} */
    const lView = getLView();
    /** @type {?} */
    const tNode = getPreviousOrParentTNode();
    listenerInternal(lView, lView[RENDERER], tNode, eventName, listenerFn, useCapture, eventTargetResolver);
}
/**
 * Registers a synthetic host listener (e.g. `(\@foo.start)`) on a component.
 *
 * This instruction is for compatibility purposes and is designed to ensure that a
 * synthetic host listener (e.g. `\@HostListener('\@foo.start')`) properly gets rendered
 * in the component's renderer. Normally all host listeners are evaluated with the
 * parent component's renderer, but, in the case of animation \@triggers, they need
 * to be evaluated with the sub component's renderer (because that's where the
 * animation triggers are defined).
 *
 * Do not use this instruction as a replacement for `listener`. This instruction
 * only exists to ensure compatibility with the ViewEngine's host binding behavior.
 *
 * \@codeGenApi
 * @param {?} eventName Name of the event
 * @param {?} listenerFn The function to be called when event emits
 * @param {?=} useCapture Whether or not to use capture in event listener
 * @param {?=} eventTargetResolver Function that returns global target information in case this listener
 * should be attached to a global object like window, document or body
 *
 * @return {?}
 */
export function ɵɵcomponentHostSyntheticListener(eventName, listenerFn, useCapture = false, eventTargetResolver) {
    /** @type {?} */
    const lView = getLView();
    /** @type {?} */
    const tNode = getPreviousOrParentTNode();
    /** @type {?} */
    const renderer = loadComponentRenderer(tNode, lView);
    listenerInternal(lView, renderer, tNode, eventName, listenerFn, useCapture, eventTargetResolver);
}
/**
 * A utility function that checks if a given element has already an event handler registered for an
 * event with a specified name. The TView.cleanup data structure is used to find out which events
 * are registered for a given element.
 * @param {?} lView
 * @param {?} eventName
 * @param {?} tNodeIdx
 * @return {?}
 */
function findExistingListener(lView, eventName, tNodeIdx) {
    /** @type {?} */
    const tView = lView[TVIEW];
    /** @type {?} */
    const tCleanup = tView.cleanup;
    if (tCleanup != null) {
        for (let i = 0; i < tCleanup.length - 1; i += 2) {
            /** @type {?} */
            const cleanupEventName = tCleanup[i];
            if (cleanupEventName === eventName && tCleanup[i + 1] === tNodeIdx) {
                // We have found a matching event name on the same node but it might not have been
                // registered yet, so we must explicitly verify entries in the LView cleanup data
                // structures.
                /** @type {?} */
                const lCleanup = (/** @type {?} */ (lView[CLEANUP]));
                /** @type {?} */
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
/**
 * @param {?} lView
 * @param {?} renderer
 * @param {?} tNode
 * @param {?} eventName
 * @param {?} listenerFn
 * @param {?=} useCapture
 * @param {?=} eventTargetResolver
 * @return {?}
 */
function listenerInternal(lView, renderer, tNode, eventName, listenerFn, useCapture = false, eventTargetResolver) {
    /** @type {?} */
    const tView = lView[TVIEW];
    /** @type {?} */
    const isTNodeDirectiveHost = isDirectiveHost(tNode);
    /** @type {?} */
    const firstCreatePass = tView.firstCreatePass;
    /** @type {?} */
    const tCleanup = firstCreatePass && (tView.cleanup || (tView.cleanup = []));
    // When the ɵɵlistener instruction was generated and is executed we know that there is either a
    // native listener or a directive output on this element. As such we we know that we will have to
    // register a listener and store its cleanup function on LView.
    /** @type {?} */
    const lCleanup = getCleanup(lView);
    ngDevMode && assertNodeOfPossibleTypes(tNode, 3 /* Element */, 0 /* Container */, 4 /* ElementContainer */);
    /** @type {?} */
    let processOutputs = true;
    // add native event listener - applicable to elements only
    if (tNode.type === 3 /* Element */) {
        /** @type {?} */
        const native = (/** @type {?} */ (getNativeByTNode(tNode, lView)));
        /** @type {?} */
        const resolved = eventTargetResolver ? eventTargetResolver(native) : (/** @type {?} */ (EMPTY_OBJ));
        /** @type {?} */
        const target = resolved.target || native;
        /** @type {?} */
        const lCleanupIndex = lCleanup.length;
        /** @type {?} */
        const idxOrTargetGetter = eventTargetResolver ?
            (/**
             * @param {?} _lView
             * @return {?}
             */
            (_lView) => eventTargetResolver(unwrapRNode(_lView[tNode.index])).target) :
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
            /** @type {?} */
            let existingListener = null;
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
                /** @type {?} */
                const lastListenerFn = ((/** @type {?} */ (existingListener))).__ngLastListenerFn__ || existingListener;
                lastListenerFn.__ngNextListenerFn__ = listenerFn;
                ((/** @type {?} */ (existingListener))).__ngLastListenerFn__ = listenerFn;
                processOutputs = false;
            }
            else {
                // The first argument of `listen` function in Procedural Renderer is:
                // - either a target name (as a string) in case of global target (window, document, body)
                // - or element reference (in all other cases)
                listenerFn = wrapListener(tNode, lView, listenerFn, false /** preventDefault */);
                /** @type {?} */
                const cleanupFn = renderer.listen(resolved.name || target, eventName, listenerFn);
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
    /** @type {?} */
    const outputs = tNode.outputs;
    /** @type {?} */
    let props;
    if (processOutputs && outputs !== null && (props = outputs[eventName])) {
        /** @type {?} */
        const propsLength = props.length;
        if (propsLength) {
            for (let i = 0; i < propsLength; i += 2) {
                /** @type {?} */
                const index = (/** @type {?} */ (props[i]));
                ngDevMode && assertDataInRange(lView, index);
                /** @type {?} */
                const minifiedName = props[i + 1];
                /** @type {?} */
                const directiveInstance = lView[index];
                /** @type {?} */
                const output = directiveInstance[minifiedName];
                if (ngDevMode && !isObservable(output)) {
                    throw new Error(`@Output ${minifiedName} not initialized in '${directiveInstance.constructor.name}'.`);
                }
                /** @type {?} */
                const subscription = output.subscribe(listenerFn);
                /** @type {?} */
                const idx = lCleanup.length;
                lCleanup.push(listenerFn, subscription);
                tCleanup && tCleanup.push(eventName, tNode.index, idx, -(idx + 1));
            }
        }
    }
}
/**
 * @param {?} lView
 * @param {?} listenerFn
 * @param {?} e
 * @return {?}
 */
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
 * @param {?} tNode The TNode associated with this listener
 * @param {?} lView The LView that contains this listener
 * @param {?} listenerFn The listener function to call
 * @param {?} wrapWithPreventDefault Whether or not to prevent default behavior
 * (the procedural renderer does this already, so in those cases, we should skip)
 * @return {?}
 */
function wrapListener(tNode, lView, listenerFn, wrapWithPreventDefault) {
    // Note: we are performing most of the work in the listener function itself
    // to optimize listener registration.
    return (/**
     * @param {?} e
     * @return {?}
     */
    function wrapListenerIn_markDirtyAndPreventDefault(e) {
        // Ivy uses `Function` as a special token that allows us to unwrap the function
        // so that it can be invoked programmatically by `DebugNode.triggerEventHandler`.
        if (e === Function) {
            return listenerFn;
        }
        // In order to be backwards compatible with View Engine, events on component host nodes
        // must also mark the component view itself dirty (i.e. the view that it owns).
        /** @type {?} */
        const startView = tNode.flags & 2 /* isComponentHost */ ?
            getComponentLViewByIndex(tNode.index, lView) :
            lView;
        // See interfaces/view.ts for more on LViewFlags.ManualOnPush
        if ((lView[FLAGS] & 32 /* ManualOnPush */) === 0) {
            markViewDirty(startView);
        }
        /** @type {?} */
        let result = executeListenerWithErrorHandling(lView, listenerFn, e);
        // A just-invoked listener function might have coalesced listeners so we need to check for
        // their presence and invoke as needed.
        /** @type {?} */
        let nextListenerFn = ((/** @type {?} */ (wrapListenerIn_markDirtyAndPreventDefault))).__ngNextListenerFn__;
        while (nextListenerFn) {
            // We should prevent default if any of the listeners explicitly return false
            result = executeListenerWithErrorHandling(lView, nextListenerFn, e) && result;
            nextListenerFn = ((/** @type {?} */ (nextListenerFn))).__ngNextListenerFn__;
        }
        if (wrapWithPreventDefault && result === false) {
            e.preventDefault();
            // Necessary for legacy browsers that don't support preventDefault (e.g. IE)
            e.returnValue = false;
        }
        return result;
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGlzdGVuZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2luc3RydWN0aW9ucy9saXN0ZW5lci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFTQSxPQUFPLEVBQUMsaUJBQWlCLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUNwRCxPQUFPLEVBQUMsWUFBWSxFQUFDLE1BQU0saUJBQWlCLENBQUM7QUFDN0MsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUVuQyxPQUFPLEVBQTRDLG9CQUFvQixFQUFDLE1BQU0sd0JBQXdCLENBQUM7QUFDdkcsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLDJCQUEyQixDQUFDO0FBQzFELE9BQU8sRUFBQyxPQUFPLEVBQUUsS0FBSyxFQUFxQixRQUFRLEVBQUUsS0FBSyxFQUFDLE1BQU0sb0JBQW9CLENBQUM7QUFDdEYsT0FBTyxFQUFDLHlCQUF5QixFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFDekQsT0FBTyxFQUFDLFFBQVEsRUFBRSx3QkFBd0IsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUM1RCxPQUFPLEVBQUMsd0JBQXdCLEVBQUUsZ0JBQWdCLEVBQUUsV0FBVyxFQUFDLE1BQU0sb0JBQW9CLENBQUM7QUFFM0YsT0FBTyxFQUFDLFVBQVUsRUFBRSxXQUFXLEVBQUUscUJBQXFCLEVBQUUsYUFBYSxFQUFDLE1BQU0sVUFBVSxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7O0FBa0J2RixNQUFNLFVBQVUsVUFBVSxDQUN0QixTQUFpQixFQUFFLFVBQTRCLEVBQUUsVUFBVSxHQUFHLEtBQUssRUFDbkUsbUJBQTBDOztVQUN0QyxLQUFLLEdBQUcsUUFBUSxFQUFFOztVQUNsQixLQUFLLEdBQUcsd0JBQXdCLEVBQUU7SUFDeEMsZ0JBQWdCLENBQ1osS0FBSyxFQUFFLEtBQUssQ0FBQyxRQUFRLENBQUMs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Z2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cblxuaW1wb3J0IHthc3NlcnREYXRhSW5SYW5nZX0gZnJvbSAnLi4vLi4vdXRpbC9hc3NlcnQnO1xuaW1wb3J0IHtpc09ic2VydmFibGV9IGZyb20gJy4uLy4uL3V0aWwvbGFuZyc7XG5pbXBvcnQge0VNUFRZX09CSn0gZnJvbSAnLi4vZW1wdHknO1xuaW1wb3J0IHtQcm9wZXJ0eUFsaWFzVmFsdWUsIFROb2RlLCBUTm9kZUZsYWdzLCBUTm9kZVR5cGV9IGZyb20gJy4uL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge0dsb2JhbFRhcmdldFJlc29sdmVyLCBSRWxlbWVudCwgUmVuZGVyZXIzLCBpc1Byb2NlZHVyYWxSZW5kZXJlcn0gZnJvbSAnLi4vaW50ZXJmYWNlcy9yZW5kZXJlcic7XG5pbXBvcnQge2lzRGlyZWN0aXZlSG9zdH0gZnJvbSAnLi4vaW50ZXJmYWNlcy90eXBlX2NoZWNrcyc7XG5pbXBvcnQge0NMRUFOVVAsIEZMQUdTLCBMVmlldywgTFZpZXdGbGFncywgUkVOREVSRVIsIFRWSUVXfSBmcm9tICcuLi9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHthc3NlcnROb2RlT2ZQb3NzaWJsZVR5cGVzfSBmcm9tICcuLi9ub2RlX2Fzc2VydCc7XG5pbXBvcnQge2dldExWaWV3LCBnZXRQcmV2aW91c09yUGFyZW50VE5vZGV9IGZyb20gJy4uL3N0YXRlJztcbmltcG9ydCB7Z2V0Q29tcG9uZW50TFZpZXdCeUluZGV4LCBnZXROYXRpdmVCeVROb2RlLCB1bndyYXBSTm9kZX0gZnJvbSAnLi4vdXRpbC92aWV3X3V0aWxzJztcblxuaW1wb3J0IHtnZXRDbGVhbnVwLCBoYW5kbGVFcnJvciwgbG9hZENvbXBvbmVudFJlbmRlcmVyLCBtYXJrVmlld0RpcnR5fSBmcm9tICcuL3NoYXJlZCc7XG5cblxuXG4vKipcbiAqIEFkZHMgYW4gZXZlbnQgbGlzdGVuZXIgdG8gdGhlIGN1cnJlbnQgbm9kZS5cbiAqXG4gKiBJZiBhbiBvdXRwdXQgZXhpc3RzIG9uIG9uZSBvZiB0aGUgbm9kZSdzIGRpcmVjdGl2ZXMsIGl0IGFsc28gc3Vic2NyaWJlcyB0byB0aGUgb3V0cHV0XG4gKiBhbmQgc2F2ZXMgdGhlIHN1YnNjcmlwdGlvbiBmb3IgbGF0ZXIgY2xlYW51cC5cbiAqXG4gKiBAcGFyYW0gZXZlbnROYW1lIE5hbWUgb2YgdGhlIGV2ZW50XG4gKiBAcGFyYW0gbGlzdGVuZXJGbiBUaGUgZnVuY3Rpb24gdG8gYmUgY2FsbGVkIHdoZW4gZXZlbnQgZW1pdHNcbiAqIEBwYXJhbSB1c2VDYXB0dXJlIFdoZXRoZXIgb3Igbm90IHRvIHVzZSBjYXB0dXJlIGluIGV2ZW50IGxpc3RlbmVyXG4gKiBAcGFyYW0gZXZlbnRUYXJnZXRSZXNvbHZlciBGdW5jdGlvbiB0aGF0IHJldHVybnMgZ2xvYmFsIHRhcmdldCBpbmZvcm1hdGlvbiBpbiBjYXNlIHRoaXMgbGlzdGVuZXJcbiAqIHNob3VsZCBiZSBhdHRhY2hlZCB0byBhIGdsb2JhbCBvYmplY3QgbGlrZSB3aW5kb3csIGRvY3VtZW50IG9yIGJvZHlcbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWxpc3RlbmVyKFxuICAgIGV2ZW50TmFtZTogc3RyaW5nLCBsaXN0ZW5lckZuOiAoZT86IGFueSkgPT4gYW55LCB1c2VDYXB0dXJlID0gZmFsc2UsXG4gICAgZXZlbnRUYXJnZXRSZXNvbHZlcj86IEdsb2JhbFRhcmdldFJlc29sdmVyKTogdm9pZCB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgdE5vZGUgPSBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKTtcbiAgbGlzdGVuZXJJbnRlcm5hbChcbiAgICAgIGxWaWV3LCBsVmlld1tSRU5ERVJFUl0sIHROb2RlLCBldmVudE5hbWUsIGxpc3RlbmVyRm4sIHVzZUNhcHR1cmUsIGV2ZW50VGFyZ2V0UmVzb2x2ZXIpO1xufVxuXG4vKipcbiogUmVnaXN0ZXJzIGEgc3ludGhldGljIGhvc3QgbGlzdGVuZXIgKGUuZy4gYChAZm9vLnN0YXJ0KWApIG9uIGEgY29tcG9uZW50LlxuKlxuKiBUaGlzIGluc3RydWN0aW9uIGlzIGZvciBjb21wYXRpYmlsaXR5IHB1cnBvc2VzIGFuZCBpcyBkZXNpZ25lZCB0byBlbnN1cmUgdGhhdCBhXG4qIHN5bnRoZXRpYyBob3N0IGxpc3RlbmVyIChlLmcuIGBASG9zdExpc3RlbmVyKCdAZm9vLnN0YXJ0JylgKSBwcm9wZXJseSBnZXRzIHJlbmRlcmVkXG4qIGluIHRoZSBjb21wb25lbnQncyByZW5kZXJlci4gTm9ybWFsbHkgYWxsIGhvc3QgbGlzdGVuZXJzIGFyZSBldmFsdWF0ZWQgd2l0aCB0aGVcbiogcGFyZW50IGNvbXBvbmVudCdzIHJlbmRlcmVyLCBidXQsIGluIHRoZSBjYXNlIG9mIGFuaW1hdGlvbiBAdHJpZ2dlcnMsIHRoZXkgbmVlZFxuKiB0byBiZSBldmFsdWF0ZWQgd2l0aCB0aGUgc3ViIGNvbXBvbmVudCdzIHJlbmRlcmVyIChiZWNhdXNlIHRoYXQncyB3aGVyZSB0aGVcbiogYW5pbWF0aW9uIHRyaWdnZXJzIGFyZSBkZWZpbmVkKS5cbipcbiogRG8gbm90IHVzZSB0aGlzIGluc3RydWN0aW9uIGFzIGEgcmVwbGFjZW1lbnQgZm9yIGBsaXN0ZW5lcmAuIFRoaXMgaW5zdHJ1Y3Rpb25cbiogb25seSBleGlzdHMgdG8gZW5zdXJlIGNvbXBhdGliaWxpdHkgd2l0aCB0aGUgVmlld0VuZ2luZSdzIGhvc3QgYmluZGluZyBiZWhhdmlvci5cbipcbiogQHBhcmFtIGV2ZW50TmFtZSBOYW1lIG9mIHRoZSBldmVudFxuKiBAcGFyYW0gbGlzdGVuZXJGbiBUaGUgZnVuY3Rpb24gdG8gYmUgY2FsbGVkIHdoZW4gZXZlbnQgZW1pdHNcbiogQHBhcmFtIHVzZUNhcHR1cmUgV2hldGhlciBvciBub3QgdG8gdXNlIGNhcHR1cmUgaW4gZXZlbnQgbGlzdGVuZXJcbiogQHBhcmFtIGV2ZW50VGFyZ2V0UmVzb2x2ZXIgRnVuY3Rpb24gdGhhdCByZXR1cm5zIGdsb2JhbCB0YXJnZXQgaW5mb3JtYXRpb24gaW4gY2FzZSB0aGlzIGxpc3RlbmVyXG4qIHNob3VsZCBiZSBhdHRhY2hlZCB0byBhIGdsb2JhbCBvYmplY3QgbGlrZSB3aW5kb3csIGRvY3VtZW50IG9yIGJvZHlcbiAqXG4gKiBAY29kZUdlbkFwaVxuKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1Y29tcG9uZW50SG9zdFN5bnRoZXRpY0xpc3RlbmVyKFxuICAgIGV2ZW50TmFtZTogc3RyaW5nLCBsaXN0ZW5lckZuOiAoZT86IGFueSkgPT4gYW55LCB1c2VDYXB0dXJlID0gZmFsc2UsXG4gICAgZXZlbnRUYXJnZXRSZXNvbHZlcj86IEdsb2JhbFRhcmdldFJlc29sdmVyKTogdm9pZCB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgdE5vZGUgPSBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKTtcbiAgY29uc3QgcmVuZGVyZXIgPSBsb2FkQ29tcG9uZW50UmVuZGVyZXIodE5vZGUsIGxWaWV3KTtcbiAgbGlzdGVuZXJJbnRlcm5hbChsVmlldywgcmVuZGVyZXIsIHROb2RlLCBldmVudE5hbWUsIGxpc3RlbmVyRm4sIHVzZUNhcHR1cmUsIGV2ZW50VGFyZ2V0UmVzb2x2ZXIpO1xufVxuXG4vKipcbiAqIEEgdXRpbGl0eSBmdW5jdGlvbiB0aGF0IGNoZWNrcyBpZiBhIGdpdmVuIGVsZW1lbnQgaGFzIGFscmVhZHkgYW4gZXZlbnQgaGFuZGxlciByZWdpc3RlcmVkIGZvciBhblxuICogZXZlbnQgd2l0aCBhIHNwZWNpZmllZCBuYW1lLiBUaGUgVFZpZXcuY2xlYW51cCBkYXRhIHN0cnVjdHVyZSBpcyB1c2VkIHRvIGZpbmQgb3V0IHdoaWNoIGV2ZW50c1xuICogYXJlIHJlZ2lzdGVyZWQgZm9yIGEgZ2l2ZW4gZWxlbWVudC5cbiAqL1xuZnVuY3Rpb24gZmluZEV4aXN0aW5nTGlzdGVuZXIoXG4gICAgbFZpZXc6IExWaWV3LCBldmVudE5hbWU6IHN0cmluZywgdE5vZGVJZHg6IG51bWJlcik6ICgoZT86IGFueSkgPT4gYW55KXxudWxsIHtcbiAgY29uc3QgdFZpZXcgPSBsVmlld1tUVklFV107XG4gIGNvbnN0IHRDbGVhbnVwID0gdFZpZXcuY2xlYW51cDtcbiAgaWYgKHRDbGVhbnVwICE9IG51bGwpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRDbGVhbnVwLmxlbmd0aCAtIDE7IGkgKz0gMikge1xuICAgICAgY29uc3QgY2xlYW51cEV2ZW50TmFtZSA9IHRDbGVhbnVwW2ldO1xuICAgICAgaWYgKGNsZWFudXBFdmVudE5hbWUgPT09IGV2ZW50TmFtZSAmJiB0Q2xlYW51cFtpICsgMV0gPT09IHROb2RlSWR4KSB7XG4gICAgICAgIC8vIFdlIGhhdmUgZm91bmQgYSBtYXRjaGluZyBldmVudCBuYW1lIG9uIHRoZSBzYW1lIG5vZGUgYnV0IGl0IG1pZ2h0IG5vdCBoYXZlIGJlZW5cbiAgICAgICAgLy8gcmVnaXN0ZXJlZCB5ZXQsIHNvIHdlIG11c3QgZXhwbGljaXRseSB2ZXJpZnkgZW50cmllcyBpbiB0aGUgTFZpZXcgY2xlYW51cCBkYXRhXG4gICAgICAgIC8vIHN0cnVjdHVyZXMuXG4gICAgICAgIGNvbnN0IGxDbGVhbnVwID0gbFZpZXdbQ0xFQU5VUF0gITtcbiAgICAgICAgY29uc3QgbGlzdGVuZXJJZHhJbkxDbGVhbnVwID0gdENsZWFudXBbaSArIDJdO1xuICAgICAgICByZXR1cm4gbENsZWFudXAubGVuZ3RoID4gbGlzdGVuZXJJZHhJbkxDbGVhbnVwID8gbENsZWFudXBbbGlzdGVuZXJJZHhJbkxDbGVhbnVwXSA6IG51bGw7XG4gICAgICB9XG4gICAgICAvLyBUVmlldy5jbGVhbnVwIGNhbiBoYXZlIGEgbWl4IG9mIDQtZWxlbWVudHMgZW50cmllcyAoZm9yIGV2ZW50IGhhbmRsZXIgY2xlYW51cHMpIG9yXG4gICAgICAvLyAyLWVsZW1lbnQgZW50cmllcyAoZm9yIGRpcmVjdGl2ZSBhbmQgcXVlcmllcyBkZXN0cm95IGhvb2tzKS4gQXMgc3VjaCB3ZSBjYW4gZW5jb3VudGVyXG4gICAgICAvLyBibG9ja3Mgb2YgNCBvciAyIGl0ZW1zIGluIHRoZSB0Vmlldy5jbGVhbnVwIGFuZCB0aGlzIGlzIHdoeSB3ZSBpdGVyYXRlIG92ZXIgMiBlbGVtZW50c1xuICAgICAgLy8gZmlyc3QgYW5kIGp1bXAgYW5vdGhlciAyIGVsZW1lbnRzIGlmIHdlIGRldGVjdCBsaXN0ZW5lcnMgY2xlYW51cCAoNCBlbGVtZW50cykuIEFsc28gY2hlY2tcbiAgICAgIC8vIGRvY3VtZW50YXRpb24gb2YgVFZpZXcuY2xlYW51cCBmb3IgbW9yZSBkZXRhaWxzIG9mIHRoaXMgZGF0YSBzdHJ1Y3R1cmUgbGF5b3V0LlxuICAgICAgaWYgKHR5cGVvZiBjbGVhbnVwRXZlbnROYW1lID09PSAnc3RyaW5nJykge1xuICAgICAgICBpICs9IDI7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG5mdW5jdGlvbiBsaXN0ZW5lckludGVybmFsKFxuICAgIGxWaWV3OiBMVmlldywgcmVuZGVyZXI6IFJlbmRlcmVyMywgdE5vZGU6IFROb2RlLCBldmVudE5hbWU6IHN0cmluZyxcbiAgICBsaXN0ZW5lckZuOiAoZT86IGFueSkgPT4gYW55LCB1c2VDYXB0dXJlID0gZmFsc2UsXG4gICAgZXZlbnRUYXJnZXRSZXNvbHZlcj86IEdsb2JhbFRhcmdldFJlc29sdmVyKTogdm9pZCB7XG4gIGNvbnN0IHRWaWV3ID0gbFZpZXdbVFZJRVddO1xuICBjb25zdCBpc1ROb2RlRGlyZWN0aXZlSG9zdCA9IGlzRGlyZWN0aXZlSG9zdCh0Tm9kZSk7XG4gIGNvbnN0IGZpcnN0Q3JlYXRlUGFzcyA9IHRWaWV3LmZpcnN0Q3JlYXRlUGFzcztcbiAgY29uc3QgdENsZWFudXA6IGZhbHNlfGFueVtdID0gZmlyc3RDcmVhdGVQYXNzICYmICh0Vmlldy5jbGVhbnVwIHx8ICh0Vmlldy5jbGVhbnVwID0gW10pKTtcblxuICAvLyBXaGVuIHRoZSDJtcm1bGlzdGVuZXIgaW5zdHJ1Y3Rpb24gd2FzIGdlbmVyYXRlZCBhbmQgaXMgZXhlY3V0ZWQgd2Uga25vdyB0aGF0IHRoZXJlIGlzIGVpdGhlciBhXG4gIC8vIG5hdGl2ZSBsaXN0ZW5lciBvciBhIGRpcmVjdGl2ZSBvdXRwdXQgb24gdGhpcyBlbGVtZW50LiBBcyBzdWNoIHdlIHdlIGtub3cgdGhhdCB3ZSB3aWxsIGhhdmUgdG9cbiAgLy8gcmVnaXN0ZXIgYSBsaXN0ZW5lciBhbmQgc3RvcmUgaXRzIGNsZWFudXAgZnVuY3Rpb24gb24gTFZpZXcuXG4gIGNvbnN0IGxDbGVhbnVwID0gZ2V0Q2xlYW51cChsVmlldyk7XG5cbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVPZlBvc3NpYmxlVHlwZXMoXG4gICAgICAgICAgICAgICAgICAgdE5vZGUsIFROb2RlVHlwZS5FbGVtZW50LCBUTm9kZVR5cGUuQ29udGFpbmVyLCBUTm9kZVR5cGUuRWxlbWVudENvbnRhaW5lcik7XG5cbiAgbGV0IHByb2Nlc3NPdXRwdXRzID0gdHJ1ZTtcblxuICAvLyBhZGQgbmF0aXZlIGV2ZW50IGxpc3RlbmVyIC0gYXBwbGljYWJsZSB0byBlbGVtZW50cyBvbmx5XG4gIGlmICh0Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuRWxlbWVudCkge1xuICAgIGNvbnN0IG5hdGl2ZSA9IGdldE5hdGl2ZUJ5VE5vZGUodE5vZGUsIGxWaWV3KSBhcyBSRWxlbWVudDtcbiAgICBjb25zdCByZXNvbHZlZCA9IGV2ZW50VGFyZ2V0UmVzb2x2ZXIgPyBldmVudFRhcmdldFJlc29sdmVyKG5hdGl2ZSkgOiBFTVBUWV9PQkogYXMgYW55O1xuICAgIGNvbnN0IHRhcmdldCA9IHJlc29sdmVkLnRhcmdldCB8fCBuYXRpdmU7XG4gICAgY29uc3QgbENsZWFudXBJbmRleCA9IGxDbGVhbnVwLmxlbmd0aDtcbiAgICBjb25zdCBpZHhPclRhcmdldEdldHRlciA9IGV2ZW50VGFyZ2V0UmVzb2x2ZXIgP1xuICAgICAgICAoX2xWaWV3OiBMVmlldykgPT4gZXZlbnRUYXJnZXRSZXNvbHZlcih1bndyYXBSTm9kZShfbFZpZXdbdE5vZGUuaW5kZXhdKSkudGFyZ2V0IDpcbiAgICAgICAgdE5vZGUuaW5kZXg7XG5cbiAgICAvLyBJbiBvcmRlciB0byBtYXRjaCBjdXJyZW50IGJlaGF2aW9yLCBuYXRpdmUgRE9NIGV2ZW50IGxpc3RlbmVycyBtdXN0IGJlIGFkZGVkIGZvciBhbGxcbiAgICAvLyBldmVudHMgKGluY2x1ZGluZyBvdXRwdXRzKS5cbiAgICBpZiAoaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpKSB7XG4gICAgICAvLyBUaGVyZSBtaWdodCBiZSBjYXNlcyB3aGVyZSBtdWx0aXBsZSBkaXJlY3RpdmVzIG9uIHRoZSBzYW1lIGVsZW1lbnQgdHJ5IHRvIHJlZ2lzdGVyIGFuIGV2ZW50XG4gICAgICAvLyBoYW5kbGVyIGZ1bmN0aW9uIGZvciB0aGUgc2FtZSBldmVudC4gSW4gdGhpcyBzaXR1YXRpb24gd2Ugd2FudCB0byBhdm9pZCByZWdpc3RyYXRpb24gb2ZcbiAgICAgIC8vIHNldmVyYWwgbmF0aXZlIGxpc3RlbmVycyBhcyBlYWNoIHJlZ2lzdHJhdGlvbiB3b3VsZCBiZSBpbnRlcmNlcHRlZCBieSBOZ1pvbmUgYW5kXG4gICAgICAvLyB0cmlnZ2VyIGNoYW5nZSBkZXRlY3Rpb24uIFRoaXMgd291bGQgbWVhbiB0aGF0IGEgc2luZ2xlIHVzZXIgYWN0aW9uIHdvdWxkIHJlc3VsdCBpbiBzZXZlcmFsXG4gICAgICAvLyBjaGFuZ2UgZGV0ZWN0aW9ucyBiZWluZyBpbnZva2VkLiBUbyBhdm9pZCB0aGlzIHNpdHVhdGlvbiB3ZSB3YW50IHRvIGhhdmUgb25seSBvbmUgY2FsbCB0b1xuICAgICAgLy8gbmF0aXZlIGhhbmRsZXIgcmVnaXN0cmF0aW9uIChmb3IgdGhlIHNhbWUgZWxlbWVudCBhbmQgc2FtZSB0eXBlIG9mIGV2ZW50KS5cbiAgICAgIC8vXG4gICAgICAvLyBJbiBvcmRlciB0byBoYXZlIGp1c3Qgb25lIG5hdGl2ZSBldmVudCBoYW5kbGVyIGluIHByZXNlbmNlIG9mIG11bHRpcGxlIGhhbmRsZXIgZnVuY3Rpb25zLFxuICAgICAgLy8gd2UganVzdCByZWdpc3RlciBhIGZpcnN0IGhhbmRsZXIgZnVuY3Rpb24gYXMgYSBuYXRpdmUgZXZlbnQgbGlzdGVuZXIgYW5kIHRoZW4gY2hhaW5cbiAgICAgIC8vIChjb2FsZXNjZSkgb3RoZXIgaGFuZGxlciBmdW5jdGlvbnMgb24gdG9wIG9mIHRoZSBmaXJzdCBuYXRpdmUgaGFuZGxlciBmdW5jdGlvbi5cbiAgICAgIGxldCBleGlzdGluZ0xpc3RlbmVyID0gbnVsbDtcbiAgICAgIC8vIFBsZWFzZSBub3RlIHRoYXQgdGhlIGNvYWxlc2NpbmcgZGVzY3JpYmVkIGhlcmUgZG9lc24ndCBoYXBwZW4gZm9yIGV2ZW50cyBzcGVjaWZ5aW5nIGFuXG4gICAgICAvLyBhbHRlcm5hdGl2ZSB0YXJnZXQgKGV4LiAoZG9jdW1lbnQ6Y2xpY2spKSAtIHRoaXMgaXMgdG8ga2VlcCBiYWNrd2FyZCBjb21wYXRpYmlsaXR5IHdpdGggdGhlXG4gICAgICAvLyB2aWV3IGVuZ2luZS5cbiAgICAgIC8vIEFsc28sIHdlIGRvbid0IGhhdmUgdG8gc2VhcmNoIGZvciBleGlzdGluZyBsaXN0ZW5lcnMgaXMgdGhlcmUgYXJlIG5vIGRpcmVjdGl2ZXNcbiAgICAgIC8vIG1hdGNoaW5nIG9uIGEgZ2l2ZW4gbm9kZSBhcyB3ZSBjYW4ndCByZWdpc3RlciBtdWx0aXBsZSBldmVudCBoYW5kbGVycyBmb3IgdGhlIHNhbWUgZXZlbnQgaW5cbiAgICAgIC8vIGEgdGVtcGxhdGUgKHRoaXMgd291bGQgbWVhbiBoYXZpbmcgZHVwbGljYXRlIGF0dHJpYnV0ZXMpLlxuICAgICAgaWYgKCFldmVudFRhcmdldFJlc29sdmVyICYmIGlzVE5vZGVEaXJlY3RpdmVIb3N0KSB7XG4gICAgICAgIGV4aXN0aW5nTGlzdGVuZXIgPSBmaW5kRXhpc3RpbmdMaXN0ZW5lcihsVmlldywgZXZlbnROYW1lLCB0Tm9kZS5pbmRleCk7XG4gICAgICB9XG4gICAgICBpZiAoZXhpc3RpbmdMaXN0ZW5lciAhPT0gbnVsbCkge1xuICAgICAgICAvLyBBdHRhY2ggYSBuZXcgbGlzdGVuZXIgdG8gY29hbGVzY2VkIGxpc3RlbmVycyBsaXN0LCBtYWludGFpbmluZyB0aGUgb3JkZXIgaW4gd2hpY2hcbiAgICAgICAgLy8gbGlzdGVuZXJzIGFyZSByZWdpc3RlcmVkLiBGb3IgcGVyZm9ybWFuY2UgcmVhc29ucywgd2Uga2VlcCBhIHJlZmVyZW5jZSB0byB0aGUgbGFzdFxuICAgICAgICAvLyBsaXN0ZW5lciBpbiB0aGF0IGxpc3QgKGluIGBfX25nTGFzdExpc3RlbmVyRm5fX2AgZmllbGQpLCBzbyB3ZSBjYW4gYXZvaWQgZ29pbmcgdGhyb3VnaFxuICAgICAgICAvLyB0aGUgZW50aXJlIHNldCBlYWNoIHRpbWUgd2UgbmVlZCB0byBhZGQgYSBuZXcgbGlzdGVuZXIuXG4gICAgICAgIGNvbnN0IGxhc3RMaXN0ZW5lckZuID0gKDxhbnk+ZXhpc3RpbmdMaXN0ZW5lcikuX19uZ0xhc3RMaXN0ZW5lckZuX18gfHwgZXhpc3RpbmdMaXN0ZW5lcjtcbiAgICAgICAgbGFzdExpc3RlbmVyRm4uX19uZ05leHRMaXN0ZW5lckZuX18gPSBsaXN0ZW5lckZuO1xuICAgICAgICAoPGFueT5leGlzdGluZ0xpc3RlbmVyKS5fX25nTGFzdExpc3RlbmVyRm5fXyA9IGxpc3RlbmVyRm47XG4gICAgICAgIHByb2Nlc3NPdXRwdXRzID0gZmFsc2U7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBUaGUgZmlyc3QgYXJndW1lbnQgb2YgYGxpc3RlbmAgZnVuY3Rpb24gaW4gUHJvY2VkdXJhbCBSZW5kZXJlciBpczpcbiAgICAgICAgLy8gLSBlaXRoZXIgYSB0YXJnZXQgbmFtZSAoYXMgYSBzdHJpbmcpIGluIGNhc2Ugb2YgZ2xvYmFsIHRhcmdldCAod2luZG93LCBkb2N1bWVudCwgYm9keSlcbiAgICAgICAgLy8gLSBvciBlbGVtZW50IHJlZmVyZW5jZSAoaW4gYWxsIG90aGVyIGNhc2VzKVxuICAgICAgICBsaXN0ZW5lckZuID0gd3JhcExpc3RlbmVyKHROb2RlLCBsVmlldywgbGlzdGVuZXJGbiwgZmFsc2UgLyoqIHByZXZlbnREZWZhdWx0ICovKTtcbiAgICAgICAgY29uc3QgY2xlYW51cEZuID0gcmVuZGVyZXIubGlzdGVuKHJlc29sdmVkLm5hbWUgfHwgdGFyZ2V0LCBldmVudE5hbWUsIGxpc3RlbmVyRm4pO1xuICAgICAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyQWRkRXZlbnRMaXN0ZW5lcisrO1xuXG4gICAgICAgIGxDbGVhbnVwLnB1c2gobGlzdGVuZXJGbiwgY2xlYW51cEZuKTtcbiAgICAgICAgdENsZWFudXAgJiYgdENsZWFudXAucHVzaChldmVudE5hbWUsIGlkeE9yVGFyZ2V0R2V0dGVyLCBsQ2xlYW51cEluZGV4LCBsQ2xlYW51cEluZGV4ICsgMSk7XG4gICAgICB9XG5cbiAgICB9IGVsc2Uge1xuICAgICAgbGlzdGVuZXJGbiA9IHdyYXBMaXN0ZW5lcih0Tm9kZSwgbFZpZXcsIGxpc3RlbmVyRm4sIHRydWUgLyoqIHByZXZlbnREZWZhdWx0ICovKTtcbiAgICAgIHRhcmdldC5hZGRFdmVudExpc3RlbmVyKGV2ZW50TmFtZSwgbGlzdGVuZXJGbiwgdXNlQ2FwdHVyZSk7XG4gICAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyQWRkRXZlbnRMaXN0ZW5lcisrO1xuXG4gICAgICBsQ2xlYW51cC5wdXNoKGxpc3RlbmVyRm4pO1xuICAgICAgdENsZWFudXAgJiYgdENsZWFudXAucHVzaChldmVudE5hbWUsIGlkeE9yVGFyZ2V0R2V0dGVyLCBsQ2xlYW51cEluZGV4LCB1c2VDYXB0dXJlKTtcbiAgICB9XG4gIH1cblxuICAvLyBzdWJzY3JpYmUgdG8gZGlyZWN0aXZlIG91dHB1dHNcbiAgY29uc3Qgb3V0cHV0cyA9IHROb2RlLm91dHB1dHM7XG4gIGxldCBwcm9wczogUHJvcGVydHlBbGlhc1ZhbHVlfHVuZGVmaW5lZDtcbiAgaWYgKHByb2Nlc3NPdXRwdXRzICYmIG91dHB1dHMgIT09IG51bGwgJiYgKHByb3BzID0gb3V0cHV0c1tldmVudE5hbWVdKSkge1xuICAgIGNvbnN0IHByb3BzTGVuZ3RoID0gcHJvcHMubGVuZ3RoO1xuICAgIGlmIChwcm9wc0xlbmd0aCkge1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwcm9wc0xlbmd0aDsgaSArPSAyKSB7XG4gICAgICAgIGNvbnN0IGluZGV4ID0gcHJvcHNbaV0gYXMgbnVtYmVyO1xuICAgICAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGF0YUluUmFuZ2UobFZpZXcsIGluZGV4KTtcbiAgICAgICAgY29uc3QgbWluaWZpZWROYW1lID0gcHJvcHNbaSArIDFdO1xuICAgICAgICBjb25zdCBkaXJlY3RpdmVJbnN0YW5jZSA9IGxWaWV3W2luZGV4XTtcbiAgICAgICAgY29uc3Qgb3V0cHV0ID0gZGlyZWN0aXZlSW5zdGFuY2VbbWluaWZpZWROYW1lXTtcblxuICAgICAgICBpZiAobmdEZXZNb2RlICYmICFpc09ic2VydmFibGUob3V0cHV0KSkge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICAgICAgYEBPdXRwdXQgJHttaW5pZmllZE5hbWV9IG5vdCBpbml0aWFsaXplZCBpbiAnJHtkaXJlY3RpdmVJbnN0YW5jZS5jb25zdHJ1Y3Rvci5uYW1lfScuYCk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBzdWJzY3JpcHRpb24gPSBvdXRwdXQuc3Vic2NyaWJlKGxpc3RlbmVyRm4pO1xuICAgICAgICBjb25zdCBpZHggPSBsQ2xlYW51cC5sZW5ndGg7XG4gICAgICAgIGxDbGVhbnVwLnB1c2gobGlzdGVuZXJGbiwgc3Vic2NyaXB0aW9uKTtcbiAgICAgICAgdENsZWFudXAgJiYgdENsZWFudXAucHVzaChldmVudE5hbWUsIHROb2RlLmluZGV4LCBpZHgsIC0oaWR4ICsgMSkpO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBleGVjdXRlTGlzdGVuZXJXaXRoRXJyb3JIYW5kbGluZyhcbiAgICBsVmlldzogTFZpZXcsIGxpc3RlbmVyRm46IChlPzogYW55KSA9PiBhbnksIGU6IGFueSk6IGJvb2xlYW4ge1xuICB0cnkge1xuICAgIC8vIE9ubHkgZXhwbGljaXRseSByZXR1cm5pbmcgZmFsc2UgZnJvbSBhIGxpc3RlbmVyIHNob3VsZCBwcmV2ZW50RGVmYXVsdFxuICAgIHJldHVybiBsaXN0ZW5lckZuKGUpICE9PSBmYWxzZTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBoYW5kbGVFcnJvcihsVmlldywgZXJyb3IpO1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxufVxuXG4vKipcbiAqIFdyYXBzIGFuIGV2ZW50IGxpc3RlbmVyIHdpdGggYSBmdW5jdGlvbiB0aGF0IG1hcmtzIGFuY2VzdG9ycyBkaXJ0eSBhbmQgcHJldmVudHMgZGVmYXVsdCBiZWhhdmlvcixcbiAqIGlmIGFwcGxpY2FibGUuXG4gKlxuICogQHBhcmFtIHROb2RlIFRoZSBUTm9kZSBhc3NvY2lhdGVkIHdpdGggdGhpcyBsaXN0ZW5lclxuICogQHBhcmFtIGxWaWV3IFRoZSBMVmlldyB0aGF0IGNvbnRhaW5zIHRoaXMgbGlzdGVuZXJcbiAqIEBwYXJhbSBsaXN0ZW5lckZuIFRoZSBsaXN0ZW5lciBmdW5jdGlvbiB0byBjYWxsXG4gKiBAcGFyYW0gd3JhcFdpdGhQcmV2ZW50RGVmYXVsdCBXaGV0aGVyIG9yIG5vdCB0byBwcmV2ZW50IGRlZmF1bHQgYmVoYXZpb3JcbiAqICh0aGUgcHJvY2VkdXJhbCByZW5kZXJlciBkb2VzIHRoaXMgYWxyZWFkeSwgc28gaW4gdGhvc2UgY2FzZXMsIHdlIHNob3VsZCBza2lwKVxuICovXG5mdW5jdGlvbiB3cmFwTGlzdGVuZXIoXG4gICAgdE5vZGU6IFROb2RlLCBsVmlldzogTFZpZXcsIGxpc3RlbmVyRm46IChlPzogYW55KSA9PiBhbnksXG4gICAgd3JhcFdpdGhQcmV2ZW50RGVmYXVsdDogYm9vbGVhbik6IEV2ZW50TGlzdGVuZXIge1xuICAvLyBOb3RlOiB3ZSBhcmUgcGVyZm9ybWluZyBtb3N0IG9mIHRoZSB3b3JrIGluIHRoZSBsaXN0ZW5lciBmdW5jdGlvbiBpdHNlbGZcbiAgLy8gdG8gb3B0aW1pemUgbGlzdGVuZXIgcmVnaXN0cmF0aW9uLlxuICByZXR1cm4gZnVuY3Rpb24gd3JhcExpc3RlbmVySW5fbWFya0RpcnR5QW5kUHJldmVudERlZmF1bHQoZTogYW55KSB7XG4gICAgLy8gSXZ5IHVzZXMgYEZ1bmN0aW9uYCBhcyBhIHNwZWNpYWwgdG9rZW4gdGhhdCBhbGxvd3MgdXMgdG8gdW53cmFwIHRoZSBmdW5jdGlvblxuICAgIC8vIHNvIHRoYXQgaXQgY2FuIGJlIGludm9rZWQgcHJvZ3JhbW1hdGljYWxseSBieSBgRGVidWdOb2RlLnRyaWdnZXJFdmVudEhhbmRsZXJgLlxuICAgIGlmIChlID09PSBGdW5jdGlvbikge1xuICAgICAgcmV0dXJuIGxpc3RlbmVyRm47XG4gICAgfVxuXG4gICAgLy8gSW4gb3JkZXIgdG8gYmUgYmFja3dhcmRzIGNvbXBhdGlibGUgd2l0aCBWaWV3IEVuZ2luZSwgZXZlbnRzIG9uIGNvbXBvbmVudCBob3N0IG5vZGVzXG4gICAgLy8gbXVzdCBhbHNvIG1hcmsgdGhlIGNvbXBvbmVudCB2aWV3IGl0c2VsZiBkaXJ0eSAoaS5lLiB0aGUgdmlldyB0aGF0IGl0IG93bnMpLlxuICAgIGNvbnN0IHN0YXJ0VmlldyA9IHROb2RlLmZsYWdzICYgVE5vZGVGbGFncy5pc0NvbXBvbmVudEhvc3QgP1xuICAgICAgICBnZXRDb21wb25lbnRMVmlld0J5SW5kZXgodE5vZGUuaW5kZXgsIGxWaWV3KSA6XG4gICAgICAgIGxWaWV3O1xuXG4gICAgLy8gU2VlIGludGVyZmFjZXMvdmlldy50cyBmb3IgbW9yZSBvbiBMVmlld0ZsYWdzLk1hbnVhbE9uUHVzaFxuICAgIGlmICgobFZpZXdbRkxBR1NdICYgTFZpZXdGbGFncy5NYW51YWxPblB1c2gpID09PSAwKSB7XG4gICAgICBtYXJrVmlld0RpcnR5KHN0YXJ0Vmlldyk7XG4gICAgfVxuXG4gICAgbGV0IHJlc3VsdCA9IGV4ZWN1dGVMaXN0ZW5lcldpdGhFcnJvckhhbmRsaW5nKGxWaWV3LCBsaXN0ZW5lckZuLCBlKTtcbiAgICAvLyBBIGp1c3QtaW52b2tlZCBsaXN0ZW5lciBmdW5jdGlvbiBtaWdodCBoYXZlIGNvYWxlc2NlZCBsaXN0ZW5lcnMgc28gd2UgbmVlZCB0byBjaGVjayBmb3JcbiAgICAvLyB0aGVpciBwcmVzZW5jZSBhbmQgaW52b2tlIGFzIG5lZWRlZC5cbiAgICBsZXQgbmV4dExpc3RlbmVyRm4gPSAoPGFueT53cmFwTGlzdGVuZXJJbl9tYXJrRGlydHlBbmRQcmV2ZW50RGVmYXVsdCkuX19uZ05leHRMaXN0ZW5lckZuX187XG4gICAgd2hpbGUgKG5leHRMaXN0ZW5lckZuKSB7XG4gICAgICAvLyBXZSBzaG91bGQgcHJldmVudCBkZWZhdWx0IGlmIGFueSBvZiB0aGUgbGlzdGVuZXJzIGV4cGxpY2l0bHkgcmV0dXJuIGZhbHNlXG4gICAgICByZXN1bHQgPSBleGVjdXRlTGlzdGVuZXJXaXRoRXJyb3JIYW5kbGluZyhsVmlldywgbmV4dExpc3RlbmVyRm4sIGUpICYmIHJlc3VsdDtcbiAgICAgIG5leHRMaXN0ZW5lckZuID0gKDxhbnk+bmV4dExpc3RlbmVyRm4pLl9fbmdOZXh0TGlzdGVuZXJGbl9fO1xuICAgIH1cblxuICAgIGlmICh3cmFwV2l0aFByZXZlbnREZWZhdWx0ICYmIHJlc3VsdCA9PT0gZmFsc2UpIHtcbiAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgIC8vIE5lY2Vzc2FyeSBmb3IgbGVnYWN5IGJyb3dzZXJzIHRoYXQgZG9uJ3Qgc3VwcG9ydCBwcmV2ZW50RGVmYXVsdCAoZS5nLiBJRSlcbiAgICAgIGUucmV0dXJuVmFsdWUgPSBmYWxzZTtcbiAgICB9XG5cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9O1xufVxuIl19