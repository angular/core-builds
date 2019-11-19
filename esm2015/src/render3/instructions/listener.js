/**
 * @fileoverview added by tsickle
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
    return ɵɵlistener;
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
    return ɵɵcomponentHostSyntheticListener;
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
        const lCleanup = getCleanup(lView);
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
            /** @type {?} */
            const lCleanup = getCleanup(lView);
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
 * @param {?} tNode
 * @param {?} listenerFn
 * @param {?} e
 * @return {?}
 */
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
        let result = executeListenerWithErrorHandling(lView, tNode, listenerFn, e);
        // A just-invoked listener function might have coalesced listeners so we need to check for
        // their presence and invoke as needed.
        /** @type {?} */
        let nextListenerFn = ((/** @type {?} */ (wrapListenerIn_markDirtyAndPreventDefault))).__ngNextListenerFn__;
        while (nextListenerFn) {
            // We should prevent default if any of the listeners explicitly return false
            result = executeListenerWithErrorHandling(lView, tNode, nextListenerFn, e) && result;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGlzdGVuZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2luc3RydWN0aW9ucy9saXN0ZW5lci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQVNBLE9BQU8sRUFBQyxpQkFBaUIsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQ3BELE9BQU8sRUFBQyxZQUFZLEVBQUMsTUFBTSxpQkFBaUIsQ0FBQztBQUM3QyxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sVUFBVSxDQUFDO0FBRW5DLE9BQU8sRUFBNEMsb0JBQW9CLEVBQUMsTUFBTSx3QkFBd0IsQ0FBQztBQUN2RyxPQUFPLEVBQUMsZUFBZSxFQUFDLE1BQU0sMkJBQTJCLENBQUM7QUFDMUQsT0FBTyxFQUFDLE9BQU8sRUFBRSxLQUFLLEVBQXFCLFFBQVEsRUFBRSxLQUFLLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUN0RixPQUFPLEVBQUMseUJBQXlCLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUN6RCxPQUFPLEVBQUMsUUFBUSxFQUFFLHdCQUF3QixFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQzVELE9BQU8sRUFBQyx3QkFBd0IsRUFBRSxnQkFBZ0IsRUFBRSxXQUFXLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUUzRixPQUFPLEVBQW1CLFVBQVUsRUFBRSxXQUFXLEVBQUUscUJBQXFCLEVBQUUsYUFBYSxFQUFDLE1BQU0sVUFBVSxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7O0FBa0J6RyxNQUFNLFVBQVUsVUFBVSxDQUN0QixTQUFpQixFQUFFLFVBQTRCLEVBQUUsVUFBVSxHQUFHLEtBQUssRUFDbkUsbUJBQTBDOztVQUN0QyxLQUFLLEdBQUcsUUFBUSxFQUFFOztVQUNsQixLQUFLLEdBQUcsd0JBQXdCLEVBQUU7SUFDeEMsZ0JBQWdCLENBQ1osS0FBSyxFQUFFLEtBQUssQ0FBQyxRQUFRLENBQUMsRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLFVBQVUsRUFBRSxVQUFVLEVBQUUsbUJBQW1CLENBQUMsQ0FBQztJQUMzRixPQUFPLFVBQVUsQ0FBQztBQUNwQixDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQXVCRCxNQUFNLFVBQVUsZ0NBQWdDLENBQzVDLFNBQWlCLEVBQUUsVUFBNEIsRUFBRSxVQUFVLEdBQUcsS0FBSyxFQUNuRSxtQkFBMEM7O1VBQ3RDLEtBQUssR0FBRyxRQUFRLEVBQUU7O1VBQ2xCLEtBQUssR0FBRyx3QkFBd0IsRUFBRTs7VUFDbEMsUUFBUSxHQUFHLHFCQUFxQixDQUFDLEtBQUssRUFBRSxLQUFLLENBQUM7SUFDcEQsZ0JBQWdCLENBQUMsS0FBSyxFQUFFLFFBQVEsRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLFVBQVUsRUFBRSxVQUFVLEVBQUUsbUJBQW1CLENBQUMsQ0FBQztJQUNqRyxPQUFPLGdDQUFnQyxDQUFDO0FBQzFDLENBQUM7Ozs7Ozs7Ozs7QUFPRCxTQUFTLG9CQUFvQixDQUN6QixLQUFZLEVBQUUsU0FBaUIsRUFBRSxRQUFnQjs7VUFDN0MsS0FBSyxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUM7O1VBQ3BCLFFBQVEsR0FBRyxLQUFLLENBQUMsT0FBTztJQUM5QixJQUFJLFFBQVEsSUFBSSxJQUFJLEVBQUU7UUFDcEIsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUU7O2tCQUN6QyxnQkFBZ0IsR0FBRyxRQUFRLENBQUMsQ0FBQyxDQUFDO1lBQ3BDLElBQUksZ0JBQWdCLEtBQUssU0FBUyxJQUFJLFFBQVEsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEtBQUssUUFBUSxFQUFFOzs7OztzQkFJNUQsUUFBUSxHQUFHLG1CQUFBLEtBQUssQ0FBQyxPQUFPLENBQUMsRUFBRTs7c0JBQzNCLHFCQUFxQixHQUFHLFFBQVEsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUM3QyxPQUFPLFFBQVEsQ0FBQyxNQUFNLEdBQUcscUJBQXFCLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7YUFDekY7WUFDRCxxRkFBcUY7WUFDckYsd0ZBQXdGO1lBQ3hGLHlGQUF5RjtZQUN6Riw0RkFBNEY7WUFDNUYsaUZBQWlGO1lBQ2pGLElBQUksT0FBTyxnQkFBZ0IsS0FBSyxRQUFRLEVBQUU7Z0JBQ3hDLENBQUMsSUFBSSxDQUFDLENBQUM7YUFDUjtTQUNGO0tBQ0Y7SUFDRCxPQUFPLElBQUksQ0FBQztBQUNkLENBQUM7Ozs7Ozs7Ozs7O0FBRUQsU0FBUyxnQkFBZ0IsQ0FDckIsS0FBWSxFQUFFLFFBQW1CLEVBQUUsS0FBWSxFQUFFLFNBQWlCLEVBQ2xFLFVBQTRCLEVBQUUsVUFBVSxHQUFHLEtBQUssRUFDaEQsbUJBQTBDOztVQUN0QyxLQUFLLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQzs7VUFDcEIsb0JBQW9CLEdBQUcsZUFBZSxDQUFDLEtBQUssQ0FBQzs7VUFDN0MsZUFBZSxHQUFHLEtBQUssQ0FBQyxlQUFlOztVQUN2QyxRQUFRLEdBQWdCLGVBQWUsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQyxDQUFDO0lBRXhGLFNBQVMsSUFBSSx5QkFBeUIsQ0FDckIsS0FBSywrREFBcUUsQ0FBQzs7UUFFeEYsY0FBYyxHQUFHLElBQUk7SUFFekIsMERBQTBEO0lBQzFELElBQUksS0FBSyxDQUFDLElBQUksb0JBQXNCLEVBQUU7O2NBQzlCLE1BQU0sR0FBRyxtQkFBQSxnQkFBZ0IsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLEVBQVk7O2NBQ25ELFFBQVEsR0FBRyxtQkFBbUIsQ0FBQyxDQUFDLENBQUMsbUJBQW1CLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLG1CQUFBLFNBQVMsRUFBTzs7Y0FDL0UsTUFBTSxHQUFHLFFBQVEsQ0FBQyxNQUFNLElBQUksTUFBTTs7Y0FDbEMsUUFBUSxHQUFHLFVBQVUsQ0FBQyxLQUFLLENBQUM7O2NBQzVCLGFBQWEsR0FBRyxRQUFRLENBQUMsTUFBTTs7Y0FDL0IsaUJBQWlCLEdBQUcsbUJBQW1CLENBQUMsQ0FBQzs7Ozs7WUFDM0MsQ0FBQyxNQUFhLEVBQUUsRUFBRSxDQUFDLG1CQUFtQixDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLEVBQUMsQ0FBQztZQUNqRixLQUFLLENBQUMsS0FBSztRQUVmLHVGQUF1RjtRQUN2Riw4QkFBOEI7UUFDOUIsSUFBSSxvQkFBb0IsQ0FBQyxRQUFRLENBQUMsRUFBRTs7Ozs7Ozs7Ozs7O2dCQVc5QixnQkFBZ0IsR0FBRyxJQUFJO1lBQzNCLHlGQUF5RjtZQUN6Riw4RkFBOEY7WUFDOUYsZUFBZTtZQUNmLGtGQUFrRjtZQUNsRiw4RkFBOEY7WUFDOUYsNERBQTREO1lBQzVELElBQUksQ0FBQyxtQkFBbUIsSUFBSSxvQkFBb0IsRUFBRTtnQkFDaEQsZ0JBQWdCLEdBQUcsb0JBQW9CLENBQUMsS0FBSyxFQUFFLFNBQVMsRUFBRSxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7YUFDeEU7WUFDRCxJQUFJLGdCQUFnQixLQUFLLElBQUksRUFBRTs7Ozs7O3NCQUt2QixjQUFjLEdBQUcsQ0FBQyxtQkFBSyxnQkFBZ0IsRUFBQSxDQUFDLENBQUMsb0JBQW9CLElBQUksZ0JBQWdCO2dCQUN2RixjQUFjLENBQUMsb0JBQW9CLEdBQUcsVUFBVSxDQUFDO2dCQUNqRCxDQUFDLG1CQUFLLGdCQUFnQixFQUFBLENBQUMsQ0FBQyxvQkFBb0IsR0FBRyxVQUFVLENBQUM7Z0JBQzFELGNBQWMsR0FBRyxLQUFLLENBQUM7YUFDeEI7aUJBQU07Z0JBQ0wscUVBQXFFO2dCQUNyRSx5RkFBeUY7Z0JBQ3pGLDhDQUE4QztnQkFDOUMsVUFBVSxHQUFHLFlBQVksQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLFVBQVUsRUFBRSxLQUFLLENBQUMscUJBQXFCLENBQUMsQ0FBQzs7c0JBQzNFLFNBQVMsR0FBRyxRQUFRLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLElBQUksTUFBTSxFQUFFLFNBQVMsRUFBRSxVQUFVLENBQUM7Z0JBQ2pGLFNBQVMsSUFBSSxTQUFTLENBQUMsd0JBQXdCLEVBQUUsQ0FBQztnQkFFbEQsUUFBUSxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsU0FBUyxDQUFDLENBQUM7Z0JBQ3JDLFFBQVEsSUFBSSxRQUFRLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxpQkFBaUIsRUFBRSxhQUFhLEVBQUUsYUFBYSxHQUFHLENBQUMsQ0FBQyxDQUFDO2FBQzNGO1NBRUY7YUFBTTtZQUNMLFVBQVUsR0FBRyxZQUFZLENBQUMsS0FBSyxFQUFFLEtBQUssRUFBRSxVQUFVLEVBQUUsSUFBSSxDQUFDLHFCQUFxQixDQUFDLENBQUM7WUFDaEYsTUFBTSxDQUFDLGdCQUFnQixDQUFDLFNBQVMsRUFBRSxVQUFVLEVBQUUsVUFBVSxDQUFDLENBQUM7WUFDM0QsU0FBUyxJQUFJLFNBQVMsQ0FBQyx3QkFBd0IsRUFBRSxDQUFDO1lBRWxELFFBQVEsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDMUIsUUFBUSxJQUFJLFFBQVEsQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLGlCQUFpQixFQUFFLGFBQWEsRUFBRSxVQUFVLENBQUMsQ0FBQztTQUNwRjtLQUNGOzs7VUFHSyxPQUFPLEdBQUcsS0FBSyxDQUFDLE9BQU87O1FBQ3pCLEtBQW1DO0lBQ3ZDLElBQUksY0FBYyxJQUFJLE9BQU8sS0FBSyxJQUFJLElBQUksQ0FBQyxLQUFLLEdBQUcsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUU7O2NBQ2hFLFdBQVcsR0FBRyxLQUFLLENBQUMsTUFBTTtRQUNoQyxJQUFJLFdBQVcsRUFBRTs7a0JBQ1QsUUFBUSxHQUFHLFVBQVUsQ0FBQyxLQUFLLENBQUM7WUFDbEMsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFdBQVcsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFOztzQkFDakMsS0FBSyxHQUFHLG1CQUFBLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBVTtnQkFDaEMsU0FBUyxJQUFJLGlCQUFpQixDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQzs7c0JBQ3ZDLFlBQVksR0FBRyxLQUFLLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQzs7c0JBQzNCLGlCQUFpQixHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUM7O3NCQUNoQyxNQUFNLEdBQUcsaUJBQWlCLENBQUMsWUFBWSxDQUFDO2dCQUU5QyxJQUFJLFNBQVMsSUFBSSxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsRUFBRTtvQkFDdEMsTUFBTSxJQUFJLEtBQUssQ0FDWCxXQUFXLFlBQVksd0JBQXdCLGlCQUFpQixDQUFDLFdBQVcsQ0FBQyxJQUFJLElBQUksQ0FBQyxDQUFDO2lCQUM1Rjs7c0JBRUssWUFBWSxHQUFHLE1BQU0sQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDOztzQkFDM0MsR0FBRyxHQUFHLFFBQVEsQ0FBQyxNQUFNO2dCQUMzQixRQUFRLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxZQUFZLENBQUMsQ0FBQztnQkFDeEMsUUFBUSxJQUFJLFFBQVEsQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLEtBQUssQ0FBQyxLQUFLLEVBQUUsR0FBRyxFQUFFLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQzthQUNwRTtTQUNGO0tBQ0Y7QUFDSCxDQUFDOzs7Ozs7OztBQUVELFNBQVMsZ0NBQWdDLENBQ3JDLEtBQVksRUFBRSxLQUFZLEVBQUUsVUFBNEIsRUFBRSxDQUFNO0lBQ2xFLElBQUk7UUFDRix3RUFBd0U7UUFDeEUsT0FBTyxVQUFVLENBQUMsQ0FBQyxDQUFDLEtBQUssS0FBSyxDQUFDO0tBQ2hDO0lBQUMsT0FBTyxLQUFLLEVBQUU7UUFDZCxXQUFXLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQzFCLE9BQU8sS0FBSyxDQUFDO0tBQ2Q7QUFDSCxDQUFDOzs7Ozs7Ozs7Ozs7QUFZRCxTQUFTLFlBQVksQ0FDakIsS0FBWSxFQUFFLEtBQVksRUFBRSxVQUE0QixFQUN4RCxzQkFBK0I7SUFDakMsMkVBQTJFO0lBQzNFLHFDQUFxQztJQUNyQzs7OztJQUFPLFNBQVMseUNBQXlDLENBQUMsQ0FBTTtRQUM5RCwrRUFBK0U7UUFDL0UsaUZBQWlGO1FBQ2pGLElBQUksQ0FBQyxLQUFLLFFBQVEsRUFBRTtZQUNsQixPQUFPLFVBQVUsQ0FBQztTQUNuQjs7OztjQUlLLFNBQVMsR0FBRyxLQUFLLENBQUMsS0FBSywwQkFBNkIsQ0FBQyxDQUFDO1lBQ3hELHdCQUF3QixDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQztZQUM5QyxLQUFLO1FBRVQsNkRBQTZEO1FBQzdELElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLHdCQUEwQixDQUFDLEtBQUssQ0FBQyxFQUFFO1lBQ2xELGFBQWEsQ0FBQyxTQUFTLENBQUMsQ0FBQztTQUMxQjs7WUFFRyxNQUFNLEdBQUcsZ0NBQWdDLENBQUMsS0FBSyxFQUFFLEtBQUssRUFBRSxVQUFVLEVBQUUsQ0FBQyxDQUFDOzs7O1lBR3RFLGNBQWMsR0FBRyxDQUFDLG1CQUFLLHlDQUF5QyxFQUFBLENBQUMsQ0FBQyxvQkFBb0I7UUFDMUYsT0FBTyxjQUFjLEVBQUU7WUFDckIsNEVBQTRFO1lBQzVFLE1BQU0sR0FBRyxnQ0FBZ0MsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLGNBQWMsRUFBRSxDQUFDLENBQUMsSUFBSSxNQUFNLENBQUM7WUFDckYsY0FBYyxHQUFHLENBQUMsbUJBQUssY0FBYyxFQUFBLENBQUMsQ0FBQyxvQkFBb0IsQ0FBQztTQUM3RDtRQUVELElBQUksc0JBQXNCLElBQUksTUFBTSxLQUFLLEtBQUssRUFBRTtZQUM5QyxDQUFDLENBQUMsY0FBYyxFQUFFLENBQUM7WUFDbkIsNEVBQTRFO1lBQzVFLENBQUMsQ0FBQyxXQUFXLEdBQUcsS0FBSyxDQUFDO1NBQ3ZCO1FBRUQsT0FBTyxNQUFNLENBQUM7SUFDaEIsQ0FBQyxFQUFDO0FBQ0osQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuXG5pbXBvcnQge2Fzc2VydERhdGFJblJhbmdlfSBmcm9tICcuLi8uLi91dGlsL2Fzc2VydCc7XG5pbXBvcnQge2lzT2JzZXJ2YWJsZX0gZnJvbSAnLi4vLi4vdXRpbC9sYW5nJztcbmltcG9ydCB7RU1QVFlfT0JKfSBmcm9tICcuLi9lbXB0eSc7XG5pbXBvcnQge1Byb3BlcnR5QWxpYXNWYWx1ZSwgVE5vZGUsIFROb2RlRmxhZ3MsIFROb2RlVHlwZX0gZnJvbSAnLi4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7R2xvYmFsVGFyZ2V0UmVzb2x2ZXIsIFJFbGVtZW50LCBSZW5kZXJlcjMsIGlzUHJvY2VkdXJhbFJlbmRlcmVyfSBmcm9tICcuLi9pbnRlcmZhY2VzL3JlbmRlcmVyJztcbmltcG9ydCB7aXNEaXJlY3RpdmVIb3N0fSBmcm9tICcuLi9pbnRlcmZhY2VzL3R5cGVfY2hlY2tzJztcbmltcG9ydCB7Q0xFQU5VUCwgRkxBR1MsIExWaWV3LCBMVmlld0ZsYWdzLCBSRU5ERVJFUiwgVFZJRVd9IGZyb20gJy4uL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2Fzc2VydE5vZGVPZlBvc3NpYmxlVHlwZXN9IGZyb20gJy4uL25vZGVfYXNzZXJ0JztcbmltcG9ydCB7Z2V0TFZpZXcsIGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZX0gZnJvbSAnLi4vc3RhdGUnO1xuaW1wb3J0IHtnZXRDb21wb25lbnRMVmlld0J5SW5kZXgsIGdldE5hdGl2ZUJ5VE5vZGUsIHVud3JhcFJOb2RlfSBmcm9tICcuLi91dGlsL3ZpZXdfdXRpbHMnO1xuXG5pbXBvcnQge1RzaWNrbGVJc3N1ZTEwMDksIGdldENsZWFudXAsIGhhbmRsZUVycm9yLCBsb2FkQ29tcG9uZW50UmVuZGVyZXIsIG1hcmtWaWV3RGlydHl9IGZyb20gJy4vc2hhcmVkJztcblxuXG5cbi8qKlxuICogQWRkcyBhbiBldmVudCBsaXN0ZW5lciB0byB0aGUgY3VycmVudCBub2RlLlxuICpcbiAqIElmIGFuIG91dHB1dCBleGlzdHMgb24gb25lIG9mIHRoZSBub2RlJ3MgZGlyZWN0aXZlcywgaXQgYWxzbyBzdWJzY3JpYmVzIHRvIHRoZSBvdXRwdXRcbiAqIGFuZCBzYXZlcyB0aGUgc3Vic2NyaXB0aW9uIGZvciBsYXRlciBjbGVhbnVwLlxuICpcbiAqIEBwYXJhbSBldmVudE5hbWUgTmFtZSBvZiB0aGUgZXZlbnRcbiAqIEBwYXJhbSBsaXN0ZW5lckZuIFRoZSBmdW5jdGlvbiB0byBiZSBjYWxsZWQgd2hlbiBldmVudCBlbWl0c1xuICogQHBhcmFtIHVzZUNhcHR1cmUgV2hldGhlciBvciBub3QgdG8gdXNlIGNhcHR1cmUgaW4gZXZlbnQgbGlzdGVuZXJcbiAqIEBwYXJhbSBldmVudFRhcmdldFJlc29sdmVyIEZ1bmN0aW9uIHRoYXQgcmV0dXJucyBnbG9iYWwgdGFyZ2V0IGluZm9ybWF0aW9uIGluIGNhc2UgdGhpcyBsaXN0ZW5lclxuICogc2hvdWxkIGJlIGF0dGFjaGVkIHRvIGEgZ2xvYmFsIG9iamVjdCBsaWtlIHdpbmRvdywgZG9jdW1lbnQgb3IgYm9keVxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1bGlzdGVuZXIoXG4gICAgZXZlbnROYW1lOiBzdHJpbmcsIGxpc3RlbmVyRm46IChlPzogYW55KSA9PiBhbnksIHVzZUNhcHR1cmUgPSBmYWxzZSxcbiAgICBldmVudFRhcmdldFJlc29sdmVyPzogR2xvYmFsVGFyZ2V0UmVzb2x2ZXIpOiBUc2lja2xlSXNzdWUxMDA5IHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCB0Tm9kZSA9IGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSgpO1xuICBsaXN0ZW5lckludGVybmFsKFxuICAgICAgbFZpZXcsIGxWaWV3W1JFTkRFUkVSXSwgdE5vZGUsIGV2ZW50TmFtZSwgbGlzdGVuZXJGbiwgdXNlQ2FwdHVyZSwgZXZlbnRUYXJnZXRSZXNvbHZlcik7XG4gIHJldHVybiDJtcm1bGlzdGVuZXI7XG59XG5cbi8qKlxuKiBSZWdpc3RlcnMgYSBzeW50aGV0aWMgaG9zdCBsaXN0ZW5lciAoZS5nLiBgKEBmb28uc3RhcnQpYCkgb24gYSBjb21wb25lbnQuXG4qXG4qIFRoaXMgaW5zdHJ1Y3Rpb24gaXMgZm9yIGNvbXBhdGliaWxpdHkgcHVycG9zZXMgYW5kIGlzIGRlc2lnbmVkIHRvIGVuc3VyZSB0aGF0IGFcbiogc3ludGhldGljIGhvc3QgbGlzdGVuZXIgKGUuZy4gYEBIb3N0TGlzdGVuZXIoJ0Bmb28uc3RhcnQnKWApIHByb3Blcmx5IGdldHMgcmVuZGVyZWRcbiogaW4gdGhlIGNvbXBvbmVudCdzIHJlbmRlcmVyLiBOb3JtYWxseSBhbGwgaG9zdCBsaXN0ZW5lcnMgYXJlIGV2YWx1YXRlZCB3aXRoIHRoZVxuKiBwYXJlbnQgY29tcG9uZW50J3MgcmVuZGVyZXIsIGJ1dCwgaW4gdGhlIGNhc2Ugb2YgYW5pbWF0aW9uIEB0cmlnZ2VycywgdGhleSBuZWVkXG4qIHRvIGJlIGV2YWx1YXRlZCB3aXRoIHRoZSBzdWIgY29tcG9uZW50J3MgcmVuZGVyZXIgKGJlY2F1c2UgdGhhdCdzIHdoZXJlIHRoZVxuKiBhbmltYXRpb24gdHJpZ2dlcnMgYXJlIGRlZmluZWQpLlxuKlxuKiBEbyBub3QgdXNlIHRoaXMgaW5zdHJ1Y3Rpb24gYXMgYSByZXBsYWNlbWVudCBmb3IgYGxpc3RlbmVyYC4gVGhpcyBpbnN0cnVjdGlvblxuKiBvbmx5IGV4aXN0cyB0byBlbnN1cmUgY29tcGF0aWJpbGl0eSB3aXRoIHRoZSBWaWV3RW5naW5lJ3MgaG9zdCBiaW5kaW5nIGJlaGF2aW9yLlxuKlxuKiBAcGFyYW0gZXZlbnROYW1lIE5hbWUgb2YgdGhlIGV2ZW50XG4qIEBwYXJhbSBsaXN0ZW5lckZuIFRoZSBmdW5jdGlvbiB0byBiZSBjYWxsZWQgd2hlbiBldmVudCBlbWl0c1xuKiBAcGFyYW0gdXNlQ2FwdHVyZSBXaGV0aGVyIG9yIG5vdCB0byB1c2UgY2FwdHVyZSBpbiBldmVudCBsaXN0ZW5lclxuKiBAcGFyYW0gZXZlbnRUYXJnZXRSZXNvbHZlciBGdW5jdGlvbiB0aGF0IHJldHVybnMgZ2xvYmFsIHRhcmdldCBpbmZvcm1hdGlvbiBpbiBjYXNlIHRoaXMgbGlzdGVuZXJcbiogc2hvdWxkIGJlIGF0dGFjaGVkIHRvIGEgZ2xvYmFsIG9iamVjdCBsaWtlIHdpbmRvdywgZG9jdW1lbnQgb3IgYm9keVxuICpcbiAqIEBjb2RlR2VuQXBpXG4qL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVjb21wb25lbnRIb3N0U3ludGhldGljTGlzdGVuZXIoXG4gICAgZXZlbnROYW1lOiBzdHJpbmcsIGxpc3RlbmVyRm46IChlPzogYW55KSA9PiBhbnksIHVzZUNhcHR1cmUgPSBmYWxzZSxcbiAgICBldmVudFRhcmdldFJlc29sdmVyPzogR2xvYmFsVGFyZ2V0UmVzb2x2ZXIpOiBUc2lja2xlSXNzdWUxMDA5IHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCB0Tm9kZSA9IGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSgpO1xuICBjb25zdCByZW5kZXJlciA9IGxvYWRDb21wb25lbnRSZW5kZXJlcih0Tm9kZSwgbFZpZXcpO1xuICBsaXN0ZW5lckludGVybmFsKGxWaWV3LCByZW5kZXJlciwgdE5vZGUsIGV2ZW50TmFtZSwgbGlzdGVuZXJGbiwgdXNlQ2FwdHVyZSwgZXZlbnRUYXJnZXRSZXNvbHZlcik7XG4gIHJldHVybiDJtcm1Y29tcG9uZW50SG9zdFN5bnRoZXRpY0xpc3RlbmVyO1xufVxuXG4vKipcbiAqIEEgdXRpbGl0eSBmdW5jdGlvbiB0aGF0IGNoZWNrcyBpZiBhIGdpdmVuIGVsZW1lbnQgaGFzIGFscmVhZHkgYW4gZXZlbnQgaGFuZGxlciByZWdpc3RlcmVkIGZvciBhblxuICogZXZlbnQgd2l0aCBhIHNwZWNpZmllZCBuYW1lLiBUaGUgVFZpZXcuY2xlYW51cCBkYXRhIHN0cnVjdHVyZSBpcyB1c2VkIHRvIGZpbmQgb3V0IHdoaWNoIGV2ZW50c1xuICogYXJlIHJlZ2lzdGVyZWQgZm9yIGEgZ2l2ZW4gZWxlbWVudC5cbiAqL1xuZnVuY3Rpb24gZmluZEV4aXN0aW5nTGlzdGVuZXIoXG4gICAgbFZpZXc6IExWaWV3LCBldmVudE5hbWU6IHN0cmluZywgdE5vZGVJZHg6IG51bWJlcik6ICgoZT86IGFueSkgPT4gYW55KXxudWxsIHtcbiAgY29uc3QgdFZpZXcgPSBsVmlld1tUVklFV107XG4gIGNvbnN0IHRDbGVhbnVwID0gdFZpZXcuY2xlYW51cDtcbiAgaWYgKHRDbGVhbnVwICE9IG51bGwpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRDbGVhbnVwLmxlbmd0aCAtIDE7IGkgKz0gMikge1xuICAgICAgY29uc3QgY2xlYW51cEV2ZW50TmFtZSA9IHRDbGVhbnVwW2ldO1xuICAgICAgaWYgKGNsZWFudXBFdmVudE5hbWUgPT09IGV2ZW50TmFtZSAmJiB0Q2xlYW51cFtpICsgMV0gPT09IHROb2RlSWR4KSB7XG4gICAgICAgIC8vIFdlIGhhdmUgZm91bmQgYSBtYXRjaGluZyBldmVudCBuYW1lIG9uIHRoZSBzYW1lIG5vZGUgYnV0IGl0IG1pZ2h0IG5vdCBoYXZlIGJlZW5cbiAgICAgICAgLy8gcmVnaXN0ZXJlZCB5ZXQsIHNvIHdlIG11c3QgZXhwbGljaXRseSB2ZXJpZnkgZW50cmllcyBpbiB0aGUgTFZpZXcgY2xlYW51cCBkYXRhXG4gICAgICAgIC8vIHN0cnVjdHVyZXMuXG4gICAgICAgIGNvbnN0IGxDbGVhbnVwID0gbFZpZXdbQ0xFQU5VUF0gITtcbiAgICAgICAgY29uc3QgbGlzdGVuZXJJZHhJbkxDbGVhbnVwID0gdENsZWFudXBbaSArIDJdO1xuICAgICAgICByZXR1cm4gbENsZWFudXAubGVuZ3RoID4gbGlzdGVuZXJJZHhJbkxDbGVhbnVwID8gbENsZWFudXBbbGlzdGVuZXJJZHhJbkxDbGVhbnVwXSA6IG51bGw7XG4gICAgICB9XG4gICAgICAvLyBUVmlldy5jbGVhbnVwIGNhbiBoYXZlIGEgbWl4IG9mIDQtZWxlbWVudHMgZW50cmllcyAoZm9yIGV2ZW50IGhhbmRsZXIgY2xlYW51cHMpIG9yXG4gICAgICAvLyAyLWVsZW1lbnQgZW50cmllcyAoZm9yIGRpcmVjdGl2ZSBhbmQgcXVlcmllcyBkZXN0cm95IGhvb2tzKS4gQXMgc3VjaCB3ZSBjYW4gZW5jb3VudGVyXG4gICAgICAvLyBibG9ja3Mgb2YgNCBvciAyIGl0ZW1zIGluIHRoZSB0Vmlldy5jbGVhbnVwIGFuZCB0aGlzIGlzIHdoeSB3ZSBpdGVyYXRlIG92ZXIgMiBlbGVtZW50c1xuICAgICAgLy8gZmlyc3QgYW5kIGp1bXAgYW5vdGhlciAyIGVsZW1lbnRzIGlmIHdlIGRldGVjdCBsaXN0ZW5lcnMgY2xlYW51cCAoNCBlbGVtZW50cykuIEFsc28gY2hlY2tcbiAgICAgIC8vIGRvY3VtZW50YXRpb24gb2YgVFZpZXcuY2xlYW51cCBmb3IgbW9yZSBkZXRhaWxzIG9mIHRoaXMgZGF0YSBzdHJ1Y3R1cmUgbGF5b3V0LlxuICAgICAgaWYgKHR5cGVvZiBjbGVhbnVwRXZlbnROYW1lID09PSAnc3RyaW5nJykge1xuICAgICAgICBpICs9IDI7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG5mdW5jdGlvbiBsaXN0ZW5lckludGVybmFsKFxuICAgIGxWaWV3OiBMVmlldywgcmVuZGVyZXI6IFJlbmRlcmVyMywgdE5vZGU6IFROb2RlLCBldmVudE5hbWU6IHN0cmluZyxcbiAgICBsaXN0ZW5lckZuOiAoZT86IGFueSkgPT4gYW55LCB1c2VDYXB0dXJlID0gZmFsc2UsXG4gICAgZXZlbnRUYXJnZXRSZXNvbHZlcj86IEdsb2JhbFRhcmdldFJlc29sdmVyKTogdm9pZCB7XG4gIGNvbnN0IHRWaWV3ID0gbFZpZXdbVFZJRVddO1xuICBjb25zdCBpc1ROb2RlRGlyZWN0aXZlSG9zdCA9IGlzRGlyZWN0aXZlSG9zdCh0Tm9kZSk7XG4gIGNvbnN0IGZpcnN0Q3JlYXRlUGFzcyA9IHRWaWV3LmZpcnN0Q3JlYXRlUGFzcztcbiAgY29uc3QgdENsZWFudXA6IGZhbHNlfGFueVtdID0gZmlyc3RDcmVhdGVQYXNzICYmICh0Vmlldy5jbGVhbnVwIHx8ICh0Vmlldy5jbGVhbnVwID0gW10pKTtcblxuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZU9mUG9zc2libGVUeXBlcyhcbiAgICAgICAgICAgICAgICAgICB0Tm9kZSwgVE5vZGVUeXBlLkVsZW1lbnQsIFROb2RlVHlwZS5Db250YWluZXIsIFROb2RlVHlwZS5FbGVtZW50Q29udGFpbmVyKTtcblxuICBsZXQgcHJvY2Vzc091dHB1dHMgPSB0cnVlO1xuXG4gIC8vIGFkZCBuYXRpdmUgZXZlbnQgbGlzdGVuZXIgLSBhcHBsaWNhYmxlIHRvIGVsZW1lbnRzIG9ubHlcbiAgaWYgKHROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5FbGVtZW50KSB7XG4gICAgY29uc3QgbmF0aXZlID0gZ2V0TmF0aXZlQnlUTm9kZSh0Tm9kZSwgbFZpZXcpIGFzIFJFbGVtZW50O1xuICAgIGNvbnN0IHJlc29sdmVkID0gZXZlbnRUYXJnZXRSZXNvbHZlciA/IGV2ZW50VGFyZ2V0UmVzb2x2ZXIobmF0aXZlKSA6IEVNUFRZX09CSiBhcyBhbnk7XG4gICAgY29uc3QgdGFyZ2V0ID0gcmVzb2x2ZWQudGFyZ2V0IHx8IG5hdGl2ZTtcbiAgICBjb25zdCBsQ2xlYW51cCA9IGdldENsZWFudXAobFZpZXcpO1xuICAgIGNvbnN0IGxDbGVhbnVwSW5kZXggPSBsQ2xlYW51cC5sZW5ndGg7XG4gICAgY29uc3QgaWR4T3JUYXJnZXRHZXR0ZXIgPSBldmVudFRhcmdldFJlc29sdmVyID9cbiAgICAgICAgKF9sVmlldzogTFZpZXcpID0+IGV2ZW50VGFyZ2V0UmVzb2x2ZXIodW53cmFwUk5vZGUoX2xWaWV3W3ROb2RlLmluZGV4XSkpLnRhcmdldCA6XG4gICAgICAgIHROb2RlLmluZGV4O1xuXG4gICAgLy8gSW4gb3JkZXIgdG8gbWF0Y2ggY3VycmVudCBiZWhhdmlvciwgbmF0aXZlIERPTSBldmVudCBsaXN0ZW5lcnMgbXVzdCBiZSBhZGRlZCBmb3IgYWxsXG4gICAgLy8gZXZlbnRzIChpbmNsdWRpbmcgb3V0cHV0cykuXG4gICAgaWYgKGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSkge1xuICAgICAgLy8gVGhlcmUgbWlnaHQgYmUgY2FzZXMgd2hlcmUgbXVsdGlwbGUgZGlyZWN0aXZlcyBvbiB0aGUgc2FtZSBlbGVtZW50IHRyeSB0byByZWdpc3RlciBhbiBldmVudFxuICAgICAgLy8gaGFuZGxlciBmdW5jdGlvbiBmb3IgdGhlIHNhbWUgZXZlbnQuIEluIHRoaXMgc2l0dWF0aW9uIHdlIHdhbnQgdG8gYXZvaWQgcmVnaXN0cmF0aW9uIG9mXG4gICAgICAvLyBzZXZlcmFsIG5hdGl2ZSBsaXN0ZW5lcnMgYXMgZWFjaCByZWdpc3RyYXRpb24gd291bGQgYmUgaW50ZXJjZXB0ZWQgYnkgTmdab25lIGFuZFxuICAgICAgLy8gdHJpZ2dlciBjaGFuZ2UgZGV0ZWN0aW9uLiBUaGlzIHdvdWxkIG1lYW4gdGhhdCBhIHNpbmdsZSB1c2VyIGFjdGlvbiB3b3VsZCByZXN1bHQgaW4gc2V2ZXJhbFxuICAgICAgLy8gY2hhbmdlIGRldGVjdGlvbnMgYmVpbmcgaW52b2tlZC4gVG8gYXZvaWQgdGhpcyBzaXR1YXRpb24gd2Ugd2FudCB0byBoYXZlIG9ubHkgb25lIGNhbGwgdG9cbiAgICAgIC8vIG5hdGl2ZSBoYW5kbGVyIHJlZ2lzdHJhdGlvbiAoZm9yIHRoZSBzYW1lIGVsZW1lbnQgYW5kIHNhbWUgdHlwZSBvZiBldmVudCkuXG4gICAgICAvL1xuICAgICAgLy8gSW4gb3JkZXIgdG8gaGF2ZSBqdXN0IG9uZSBuYXRpdmUgZXZlbnQgaGFuZGxlciBpbiBwcmVzZW5jZSBvZiBtdWx0aXBsZSBoYW5kbGVyIGZ1bmN0aW9ucyxcbiAgICAgIC8vIHdlIGp1c3QgcmVnaXN0ZXIgYSBmaXJzdCBoYW5kbGVyIGZ1bmN0aW9uIGFzIGEgbmF0aXZlIGV2ZW50IGxpc3RlbmVyIGFuZCB0aGVuIGNoYWluXG4gICAgICAvLyAoY29hbGVzY2UpIG90aGVyIGhhbmRsZXIgZnVuY3Rpb25zIG9uIHRvcCBvZiB0aGUgZmlyc3QgbmF0aXZlIGhhbmRsZXIgZnVuY3Rpb24uXG4gICAgICBsZXQgZXhpc3RpbmdMaXN0ZW5lciA9IG51bGw7XG4gICAgICAvLyBQbGVhc2Ugbm90ZSB0aGF0IHRoZSBjb2FsZXNjaW5nIGRlc2NyaWJlZCBoZXJlIGRvZXNuJ3QgaGFwcGVuIGZvciBldmVudHMgc3BlY2lmeWluZyBhblxuICAgICAgLy8gYWx0ZXJuYXRpdmUgdGFyZ2V0IChleC4gKGRvY3VtZW50OmNsaWNrKSkgLSB0aGlzIGlzIHRvIGtlZXAgYmFja3dhcmQgY29tcGF0aWJpbGl0eSB3aXRoIHRoZVxuICAgICAgLy8gdmlldyBlbmdpbmUuXG4gICAgICAvLyBBbHNvLCB3ZSBkb24ndCBoYXZlIHRvIHNlYXJjaCBmb3IgZXhpc3RpbmcgbGlzdGVuZXJzIGlzIHRoZXJlIGFyZSBubyBkaXJlY3RpdmVzXG4gICAgICAvLyBtYXRjaGluZyBvbiBhIGdpdmVuIG5vZGUgYXMgd2UgY2FuJ3QgcmVnaXN0ZXIgbXVsdGlwbGUgZXZlbnQgaGFuZGxlcnMgZm9yIHRoZSBzYW1lIGV2ZW50IGluXG4gICAgICAvLyBhIHRlbXBsYXRlICh0aGlzIHdvdWxkIG1lYW4gaGF2aW5nIGR1cGxpY2F0ZSBhdHRyaWJ1dGVzKS5cbiAgICAgIGlmICghZXZlbnRUYXJnZXRSZXNvbHZlciAmJiBpc1ROb2RlRGlyZWN0aXZlSG9zdCkge1xuICAgICAgICBleGlzdGluZ0xpc3RlbmVyID0gZmluZEV4aXN0aW5nTGlzdGVuZXIobFZpZXcsIGV2ZW50TmFtZSwgdE5vZGUuaW5kZXgpO1xuICAgICAgfVxuICAgICAgaWYgKGV4aXN0aW5nTGlzdGVuZXIgIT09IG51bGwpIHtcbiAgICAgICAgLy8gQXR0YWNoIGEgbmV3IGxpc3RlbmVyIHRvIGNvYWxlc2NlZCBsaXN0ZW5lcnMgbGlzdCwgbWFpbnRhaW5pbmcgdGhlIG9yZGVyIGluIHdoaWNoXG4gICAgICAgIC8vIGxpc3RlbmVycyBhcmUgcmVnaXN0ZXJlZC4gRm9yIHBlcmZvcm1hbmNlIHJlYXNvbnMsIHdlIGtlZXAgYSByZWZlcmVuY2UgdG8gdGhlIGxhc3RcbiAgICAgICAgLy8gbGlzdGVuZXIgaW4gdGhhdCBsaXN0IChpbiBgX19uZ0xhc3RMaXN0ZW5lckZuX19gIGZpZWxkKSwgc28gd2UgY2FuIGF2b2lkIGdvaW5nIHRocm91Z2hcbiAgICAgICAgLy8gdGhlIGVudGlyZSBzZXQgZWFjaCB0aW1lIHdlIG5lZWQgdG8gYWRkIGEgbmV3IGxpc3RlbmVyLlxuICAgICAgICBjb25zdCBsYXN0TGlzdGVuZXJGbiA9ICg8YW55PmV4aXN0aW5nTGlzdGVuZXIpLl9fbmdMYXN0TGlzdGVuZXJGbl9fIHx8IGV4aXN0aW5nTGlzdGVuZXI7XG4gICAgICAgIGxhc3RMaXN0ZW5lckZuLl9fbmdOZXh0TGlzdGVuZXJGbl9fID0gbGlzdGVuZXJGbjtcbiAgICAgICAgKDxhbnk+ZXhpc3RpbmdMaXN0ZW5lcikuX19uZ0xhc3RMaXN0ZW5lckZuX18gPSBsaXN0ZW5lckZuO1xuICAgICAgICBwcm9jZXNzT3V0cHV0cyA9IGZhbHNlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gVGhlIGZpcnN0IGFyZ3VtZW50IG9mIGBsaXN0ZW5gIGZ1bmN0aW9uIGluIFByb2NlZHVyYWwgUmVuZGVyZXIgaXM6XG4gICAgICAgIC8vIC0gZWl0aGVyIGEgdGFyZ2V0IG5hbWUgKGFzIGEgc3RyaW5nKSBpbiBjYXNlIG9mIGdsb2JhbCB0YXJnZXQgKHdpbmRvdywgZG9jdW1lbnQsIGJvZHkpXG4gICAgICAgIC8vIC0gb3IgZWxlbWVudCByZWZlcmVuY2UgKGluIGFsbCBvdGhlciBjYXNlcylcbiAgICAgICAgbGlzdGVuZXJGbiA9IHdyYXBMaXN0ZW5lcih0Tm9kZSwgbFZpZXcsIGxpc3RlbmVyRm4sIGZhbHNlIC8qKiBwcmV2ZW50RGVmYXVsdCAqLyk7XG4gICAgICAgIGNvbnN0IGNsZWFudXBGbiA9IHJlbmRlcmVyLmxpc3RlbihyZXNvbHZlZC5uYW1lIHx8IHRhcmdldCwgZXZlbnROYW1lLCBsaXN0ZW5lckZuKTtcbiAgICAgICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlckFkZEV2ZW50TGlzdGVuZXIrKztcblxuICAgICAgICBsQ2xlYW51cC5wdXNoKGxpc3RlbmVyRm4sIGNsZWFudXBGbik7XG4gICAgICAgIHRDbGVhbnVwICYmIHRDbGVhbnVwLnB1c2goZXZlbnROYW1lLCBpZHhPclRhcmdldEdldHRlciwgbENsZWFudXBJbmRleCwgbENsZWFudXBJbmRleCArIDEpO1xuICAgICAgfVxuXG4gICAgfSBlbHNlIHtcbiAgICAgIGxpc3RlbmVyRm4gPSB3cmFwTGlzdGVuZXIodE5vZGUsIGxWaWV3LCBsaXN0ZW5lckZuLCB0cnVlIC8qKiBwcmV2ZW50RGVmYXVsdCAqLyk7XG4gICAgICB0YXJnZXQuYWRkRXZlbnRMaXN0ZW5lcihldmVudE5hbWUsIGxpc3RlbmVyRm4sIHVzZUNhcHR1cmUpO1xuICAgICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlckFkZEV2ZW50TGlzdGVuZXIrKztcblxuICAgICAgbENsZWFudXAucHVzaChsaXN0ZW5lckZuKTtcbiAgICAgIHRDbGVhbnVwICYmIHRDbGVhbnVwLnB1c2goZXZlbnROYW1lLCBpZHhPclRhcmdldEdldHRlciwgbENsZWFudXBJbmRleCwgdXNlQ2FwdHVyZSk7XG4gICAgfVxuICB9XG5cbiAgLy8gc3Vic2NyaWJlIHRvIGRpcmVjdGl2ZSBvdXRwdXRzXG4gIGNvbnN0IG91dHB1dHMgPSB0Tm9kZS5vdXRwdXRzO1xuICBsZXQgcHJvcHM6IFByb3BlcnR5QWxpYXNWYWx1ZXx1bmRlZmluZWQ7XG4gIGlmIChwcm9jZXNzT3V0cHV0cyAmJiBvdXRwdXRzICE9PSBudWxsICYmIChwcm9wcyA9IG91dHB1dHNbZXZlbnROYW1lXSkpIHtcbiAgICBjb25zdCBwcm9wc0xlbmd0aCA9IHByb3BzLmxlbmd0aDtcbiAgICBpZiAocHJvcHNMZW5ndGgpIHtcbiAgICAgIGNvbnN0IGxDbGVhbnVwID0gZ2V0Q2xlYW51cChsVmlldyk7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHByb3BzTGVuZ3RoOyBpICs9IDIpIHtcbiAgICAgICAgY29uc3QgaW5kZXggPSBwcm9wc1tpXSBhcyBudW1iZXI7XG4gICAgICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREYXRhSW5SYW5nZShsVmlldywgaW5kZXgpO1xuICAgICAgICBjb25zdCBtaW5pZmllZE5hbWUgPSBwcm9wc1tpICsgMV07XG4gICAgICAgIGNvbnN0IGRpcmVjdGl2ZUluc3RhbmNlID0gbFZpZXdbaW5kZXhdO1xuICAgICAgICBjb25zdCBvdXRwdXQgPSBkaXJlY3RpdmVJbnN0YW5jZVttaW5pZmllZE5hbWVdO1xuXG4gICAgICAgIGlmIChuZ0Rldk1vZGUgJiYgIWlzT2JzZXJ2YWJsZShvdXRwdXQpKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgICAgICBgQE91dHB1dCAke21pbmlmaWVkTmFtZX0gbm90IGluaXRpYWxpemVkIGluICcke2RpcmVjdGl2ZUluc3RhbmNlLmNvbnN0cnVjdG9yLm5hbWV9Jy5gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHN1YnNjcmlwdGlvbiA9IG91dHB1dC5zdWJzY3JpYmUobGlzdGVuZXJGbik7XG4gICAgICAgIGNvbnN0IGlkeCA9IGxDbGVhbnVwLmxlbmd0aDtcbiAgICAgICAgbENsZWFudXAucHVzaChsaXN0ZW5lckZuLCBzdWJzY3JpcHRpb24pO1xuICAgICAgICB0Q2xlYW51cCAmJiB0Q2xlYW51cC5wdXNoKGV2ZW50TmFtZSwgdE5vZGUuaW5kZXgsIGlkeCwgLShpZHggKyAxKSk7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGV4ZWN1dGVMaXN0ZW5lcldpdGhFcnJvckhhbmRsaW5nKFxuICAgIGxWaWV3OiBMVmlldywgdE5vZGU6IFROb2RlLCBsaXN0ZW5lckZuOiAoZT86IGFueSkgPT4gYW55LCBlOiBhbnkpOiBib29sZWFuIHtcbiAgdHJ5IHtcbiAgICAvLyBPbmx5IGV4cGxpY2l0bHkgcmV0dXJuaW5nIGZhbHNlIGZyb20gYSBsaXN0ZW5lciBzaG91bGQgcHJldmVudERlZmF1bHRcbiAgICByZXR1cm4gbGlzdGVuZXJGbihlKSAhPT0gZmFsc2U7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgaGFuZGxlRXJyb3IobFZpZXcsIGVycm9yKTtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbn1cblxuLyoqXG4gKiBXcmFwcyBhbiBldmVudCBsaXN0ZW5lciB3aXRoIGEgZnVuY3Rpb24gdGhhdCBtYXJrcyBhbmNlc3RvcnMgZGlydHkgYW5kIHByZXZlbnRzIGRlZmF1bHQgYmVoYXZpb3IsXG4gKiBpZiBhcHBsaWNhYmxlLlxuICpcbiAqIEBwYXJhbSB0Tm9kZSBUaGUgVE5vZGUgYXNzb2NpYXRlZCB3aXRoIHRoaXMgbGlzdGVuZXJcbiAqIEBwYXJhbSBsVmlldyBUaGUgTFZpZXcgdGhhdCBjb250YWlucyB0aGlzIGxpc3RlbmVyXG4gKiBAcGFyYW0gbGlzdGVuZXJGbiBUaGUgbGlzdGVuZXIgZnVuY3Rpb24gdG8gY2FsbFxuICogQHBhcmFtIHdyYXBXaXRoUHJldmVudERlZmF1bHQgV2hldGhlciBvciBub3QgdG8gcHJldmVudCBkZWZhdWx0IGJlaGF2aW9yXG4gKiAodGhlIHByb2NlZHVyYWwgcmVuZGVyZXIgZG9lcyB0aGlzIGFscmVhZHksIHNvIGluIHRob3NlIGNhc2VzLCB3ZSBzaG91bGQgc2tpcClcbiAqL1xuZnVuY3Rpb24gd3JhcExpc3RlbmVyKFxuICAgIHROb2RlOiBUTm9kZSwgbFZpZXc6IExWaWV3LCBsaXN0ZW5lckZuOiAoZT86IGFueSkgPT4gYW55LFxuICAgIHdyYXBXaXRoUHJldmVudERlZmF1bHQ6IGJvb2xlYW4pOiBFdmVudExpc3RlbmVyIHtcbiAgLy8gTm90ZTogd2UgYXJlIHBlcmZvcm1pbmcgbW9zdCBvZiB0aGUgd29yayBpbiB0aGUgbGlzdGVuZXIgZnVuY3Rpb24gaXRzZWxmXG4gIC8vIHRvIG9wdGltaXplIGxpc3RlbmVyIHJlZ2lzdHJhdGlvbi5cbiAgcmV0dXJuIGZ1bmN0aW9uIHdyYXBMaXN0ZW5lckluX21hcmtEaXJ0eUFuZFByZXZlbnREZWZhdWx0KGU6IGFueSkge1xuICAgIC8vIEl2eSB1c2VzIGBGdW5jdGlvbmAgYXMgYSBzcGVjaWFsIHRva2VuIHRoYXQgYWxsb3dzIHVzIHRvIHVud3JhcCB0aGUgZnVuY3Rpb25cbiAgICAvLyBzbyB0aGF0IGl0IGNhbiBiZSBpbnZva2VkIHByb2dyYW1tYXRpY2FsbHkgYnkgYERlYnVnTm9kZS50cmlnZ2VyRXZlbnRIYW5kbGVyYC5cbiAgICBpZiAoZSA9PT0gRnVuY3Rpb24pIHtcbiAgICAgIHJldHVybiBsaXN0ZW5lckZuO1xuICAgIH1cblxuICAgIC8vIEluIG9yZGVyIHRvIGJlIGJhY2t3YXJkcyBjb21wYXRpYmxlIHdpdGggVmlldyBFbmdpbmUsIGV2ZW50cyBvbiBjb21wb25lbnQgaG9zdCBub2Rlc1xuICAgIC8vIG11c3QgYWxzbyBtYXJrIHRoZSBjb21wb25lbnQgdmlldyBpdHNlbGYgZGlydHkgKGkuZS4gdGhlIHZpZXcgdGhhdCBpdCBvd25zKS5cbiAgICBjb25zdCBzdGFydFZpZXcgPSB0Tm9kZS5mbGFncyAmIFROb2RlRmxhZ3MuaXNDb21wb25lbnRIb3N0ID9cbiAgICAgICAgZ2V0Q29tcG9uZW50TFZpZXdCeUluZGV4KHROb2RlLmluZGV4LCBsVmlldykgOlxuICAgICAgICBsVmlldztcblxuICAgIC8vIFNlZSBpbnRlcmZhY2VzL3ZpZXcudHMgZm9yIG1vcmUgb24gTFZpZXdGbGFncy5NYW51YWxPblB1c2hcbiAgICBpZiAoKGxWaWV3W0ZMQUdTXSAmIExWaWV3RmxhZ3MuTWFudWFsT25QdXNoKSA9PT0gMCkge1xuICAgICAgbWFya1ZpZXdEaXJ0eShzdGFydFZpZXcpO1xuICAgIH1cblxuICAgIGxldCByZXN1bHQgPSBleGVjdXRlTGlzdGVuZXJXaXRoRXJyb3JIYW5kbGluZyhsVmlldywgdE5vZGUsIGxpc3RlbmVyRm4sIGUpO1xuICAgIC8vIEEganVzdC1pbnZva2VkIGxpc3RlbmVyIGZ1bmN0aW9uIG1pZ2h0IGhhdmUgY29hbGVzY2VkIGxpc3RlbmVycyBzbyB3ZSBuZWVkIHRvIGNoZWNrIGZvclxuICAgIC8vIHRoZWlyIHByZXNlbmNlIGFuZCBpbnZva2UgYXMgbmVlZGVkLlxuICAgIGxldCBuZXh0TGlzdGVuZXJGbiA9ICg8YW55PndyYXBMaXN0ZW5lckluX21hcmtEaXJ0eUFuZFByZXZlbnREZWZhdWx0KS5fX25nTmV4dExpc3RlbmVyRm5fXztcbiAgICB3aGlsZSAobmV4dExpc3RlbmVyRm4pIHtcbiAgICAgIC8vIFdlIHNob3VsZCBwcmV2ZW50IGRlZmF1bHQgaWYgYW55IG9mIHRoZSBsaXN0ZW5lcnMgZXhwbGljaXRseSByZXR1cm4gZmFsc2VcbiAgICAgIHJlc3VsdCA9IGV4ZWN1dGVMaXN0ZW5lcldpdGhFcnJvckhhbmRsaW5nKGxWaWV3LCB0Tm9kZSwgbmV4dExpc3RlbmVyRm4sIGUpICYmIHJlc3VsdDtcbiAgICAgIG5leHRMaXN0ZW5lckZuID0gKDxhbnk+bmV4dExpc3RlbmVyRm4pLl9fbmdOZXh0TGlzdGVuZXJGbl9fO1xuICAgIH1cblxuICAgIGlmICh3cmFwV2l0aFByZXZlbnREZWZhdWx0ICYmIHJlc3VsdCA9PT0gZmFsc2UpIHtcbiAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgIC8vIE5lY2Vzc2FyeSBmb3IgbGVnYWN5IGJyb3dzZXJzIHRoYXQgZG9uJ3Qgc3VwcG9ydCBwcmV2ZW50RGVmYXVsdCAoZS5nLiBJRSlcbiAgICAgIGUucmV0dXJuVmFsdWUgPSBmYWxzZTtcbiAgICB9XG5cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9O1xufVxuIl19