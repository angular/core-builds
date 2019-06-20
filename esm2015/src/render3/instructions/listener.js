/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
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
    listenerInternal(eventName, listenerFn, useCapture, eventTargetResolver);
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
 * @template T
 * @param {?} eventName Name of the event
 * @param {?} listenerFn The function to be called when event emits
 * @param {?=} useCapture Whether or not to use capture in event listener
 * @param {?=} eventTargetResolver Function that returns global target information in case this listener
 * should be attached to a global object like window, document or body
 *
 * @return {?}
 */
export function ɵɵcomponentHostSyntheticListener(eventName, listenerFn, useCapture = false, eventTargetResolver) {
    listenerInternal(eventName, listenerFn, useCapture, eventTargetResolver, loadComponentRenderer);
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
 * @param {?} eventName
 * @param {?} listenerFn
 * @param {?=} useCapture
 * @param {?=} eventTargetResolver
 * @param {?=} loadRendererFn
 * @return {?}
 */
function listenerInternal(eventName, listenerFn, useCapture = false, eventTargetResolver, loadRendererFn) {
    /** @type {?} */
    const lView = getLView();
    /** @type {?} */
    const tNode = getPreviousOrParentTNode();
    /** @type {?} */
    const tView = lView[TVIEW];
    /** @type {?} */
    const firstTemplatePass = tView.firstTemplatePass;
    /** @type {?} */
    const tCleanup = firstTemplatePass && (tView.cleanup || (tView.cleanup = []));
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
        const renderer = loadRendererFn ? loadRendererFn(tNode, lView) : lView[RENDERER];
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
            if (!eventTargetResolver && hasDirectives(tNode)) {
                existingListener = findExistingListener(lView, eventName, tNode.index);
            }
            if (existingListener !== null) {
                // Attach a new listener at the head of the coalesced listeners list.
                ((/** @type {?} */ (listenerFn))).__ngNextListenerFn__ = ((/** @type {?} */ (existingListener))).__ngNextListenerFn__;
                ((/** @type {?} */ (existingListener))).__ngNextListenerFn__ = listenerFn;
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
    if (tNode.outputs === undefined) {
        // if we create TNode here, inputs must be undefined so we know they still need to be
        // checked
        tNode.outputs = generatePropertyAliases(tNode, 1 /* Output */);
    }
    /** @type {?} */
    const outputs = tNode.outputs;
    /** @type {?} */
    let props;
    if (processOutputs && outputs && (props = outputs[eventName])) {
        /** @type {?} */
        const propsLength = props.length;
        if (propsLength) {
            /** @type {?} */
            const lCleanup = getCleanup(lView);
            for (let i = 0; i < propsLength; i += 3) {
                /** @type {?} */
                const index = (/** @type {?} */ (props[i]));
                ngDevMode && assertDataInRange(lView, index);
                /** @type {?} */
                const minifiedName = props[i + 2];
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
        // In order to be backwards compatible with View Engine, events on component host nodes
        // must also mark the component view itself dirty (i.e. the view that it owns).
        /** @type {?} */
        const startView = tNode.flags & 1 /* isComponent */ ? getComponentViewByIndex(tNode.index, lView) : lView;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGlzdGVuZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2luc3RydWN0aW9ucy9saXN0ZW5lci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQVNBLE9BQU8sRUFBQyxpQkFBaUIsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQ3BELE9BQU8sRUFBQyxZQUFZLEVBQUMsTUFBTSxpQkFBaUIsQ0FBQztBQUM3QyxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sVUFBVSxDQUFDO0FBRW5DLE9BQU8sRUFBNEMsb0JBQW9CLEVBQUMsTUFBTSx3QkFBd0IsQ0FBQztBQUN2RyxPQUFPLEVBQUMsT0FBTyxFQUFFLEtBQUssRUFBcUIsUUFBUSxFQUFFLEtBQUssRUFBQyxNQUFNLG9CQUFvQixDQUFDO0FBQ3RGLE9BQU8sRUFBQyx5QkFBeUIsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBQ3pELE9BQU8sRUFBQyxRQUFRLEVBQUUsd0JBQXdCLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDNUQsT0FBTyxFQUFDLHVCQUF1QixFQUFFLGdCQUFnQixFQUFFLGFBQWEsRUFBRSxXQUFXLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUN6RyxPQUFPLEVBQW1CLHVCQUF1QixFQUFFLFVBQVUsRUFBRSxXQUFXLEVBQUUscUJBQXFCLEVBQUUsYUFBYSxFQUFDLE1BQU0sVUFBVSxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7O0FBZ0JsSSxNQUFNLFVBQVUsVUFBVSxDQUN0QixTQUFpQixFQUFFLFVBQTRCLEVBQUUsVUFBVSxHQUFHLEtBQUssRUFDbkUsbUJBQTBDO0lBQzVDLGdCQUFnQixDQUFDLFNBQVMsRUFBRSxVQUFVLEVBQUUsVUFBVSxFQUFFLG1CQUFtQixDQUFDLENBQUM7QUFDM0UsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBdUJELE1BQU0sVUFBVSxnQ0FBZ0MsQ0FD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LEVBQUUsS0FBWSxFQUFFLFVBQTRCLEVBQ3hELHNCQUErQjtJQUNqQywyRUFBMkU7SUFDM0UscUNBQXFDO0lBQ3JDOzs7O0lBQU8sU0FBUyx5Q0FBeUMsQ0FBQyxDQUFROzs7O2NBRzFELFNBQVMsR0FDWCxLQUFLLENBQUMsS0FBSyxzQkFBeUIsQ0FBQyxDQUFDLENBQUMsdUJBQXVCLENBQUMsS0FBSyxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSztRQUU5Riw2REFBNkQ7UUFDN0QsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsd0JBQTBCLENBQUMsS0FBSyxDQUFDLEVBQUU7WUFDbEQsYUFBYSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1NBQzFCOztZQUVHLE1BQU0sR0FBRyxnQ0FBZ0MsQ0FBQyxLQUFLLEVBQUUsVUFBVSxFQUFFLENBQUMsQ0FBQzs7OztZQUcvRCxjQUFjLEdBQUcsQ0FBQyxtQkFBSyx5Q0FBeUMsRUFBQSxDQUFDLENBQUMsb0JBQW9CO1FBQzFGLE9BQU8sY0FBYyxFQUFFO1lBQ3JCLDRFQUE0RTtZQUM1RSxNQUFNLEdBQUcsZ0NBQWdDLENBQUMsS0FBSyxFQUFFLGNBQWMsRUFBRSxDQUFDLENBQUMsSUFBSSxNQUFNLENBQUM7WUFDOUUsY0FBYyxHQUFHLENBQUMsbUJBQUssY0FBYyxFQUFBLENBQUMsQ0FBQyxvQkFBb0IsQ0FBQztTQUM3RDtRQUVELElBQUksc0JBQXNCLElBQUksTUFBTSxLQUFLLEtBQUssRUFBRTtZQUM5QyxDQUFDLENBQUMsY0FBYyxFQUFFLENBQUM7WUFDbkIsNEVBQTRFO1lBQzVFLENBQUMsQ0FBQyxXQUFXLEdBQUcsS0FBSyxDQUFDO1NBQ3ZCO1FBRUQsT0FBTyxNQUFNLENBQUM7SUFDaEIsQ0FBQyxFQUFDO0FBQ0osQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuXG5pbXBvcnQge2Fzc2VydERhdGFJblJhbmdlfSBmcm9tICcuLi8uLi91dGlsL2Fzc2VydCc7XG5pbXBvcnQge2lzT2JzZXJ2YWJsZX0gZnJvbSAnLi4vLi4vdXRpbC9sYW5nJztcbmltcG9ydCB7RU1QVFlfT0JKfSBmcm9tICcuLi9lbXB0eSc7XG5pbXBvcnQge1Byb3BlcnR5QWxpYXNWYWx1ZSwgVE5vZGUsIFROb2RlRmxhZ3MsIFROb2RlVHlwZX0gZnJvbSAnLi4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7R2xvYmFsVGFyZ2V0UmVzb2x2ZXIsIFJFbGVtZW50LCBSZW5kZXJlcjMsIGlzUHJvY2VkdXJhbFJlbmRlcmVyfSBmcm9tICcuLi9pbnRlcmZhY2VzL3JlbmRlcmVyJztcbmltcG9ydCB7Q0xFQU5VUCwgRkxBR1MsIExWaWV3LCBMVmlld0ZsYWdzLCBSRU5ERVJFUiwgVFZJRVd9IGZyb20gJy4uL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2Fzc2VydE5vZGVPZlBvc3NpYmxlVHlwZXN9IGZyb20gJy4uL25vZGVfYXNzZXJ0JztcbmltcG9ydCB7Z2V0TFZpZXcsIGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZX0gZnJvbSAnLi4vc3RhdGUnO1xuaW1wb3J0IHtnZXRDb21wb25lbnRWaWV3QnlJbmRleCwgZ2V0TmF0aXZlQnlUTm9kZSwgaGFzRGlyZWN0aXZlcywgdW53cmFwUk5vZGV9IGZyb20gJy4uL3V0aWwvdmlld191dGlscyc7XG5pbXBvcnQge0JpbmRpbmdEaXJlY3Rpb24sIGdlbmVyYXRlUHJvcGVydHlBbGlhc2VzLCBnZXRDbGVhbnVwLCBoYW5kbGVFcnJvciwgbG9hZENvbXBvbmVudFJlbmRlcmVyLCBtYXJrVmlld0RpcnR5fSBmcm9tICcuL3NoYXJlZCc7XG5cbi8qKlxuICogQWRkcyBhbiBldmVudCBsaXN0ZW5lciB0byB0aGUgY3VycmVudCBub2RlLlxuICpcbiAqIElmIGFuIG91dHB1dCBleGlzdHMgb24gb25lIG9mIHRoZSBub2RlJ3MgZGlyZWN0aXZlcywgaXQgYWxzbyBzdWJzY3JpYmVzIHRvIHRoZSBvdXRwdXRcbiAqIGFuZCBzYXZlcyB0aGUgc3Vic2NyaXB0aW9uIGZvciBsYXRlciBjbGVhbnVwLlxuICpcbiAqIEBwYXJhbSBldmVudE5hbWUgTmFtZSBvZiB0aGUgZXZlbnRcbiAqIEBwYXJhbSBsaXN0ZW5lckZuIFRoZSBmdW5jdGlvbiB0byBiZSBjYWxsZWQgd2hlbiBldmVudCBlbWl0c1xuICogQHBhcmFtIHVzZUNhcHR1cmUgV2hldGhlciBvciBub3QgdG8gdXNlIGNhcHR1cmUgaW4gZXZlbnQgbGlzdGVuZXJcbiAqIEBwYXJhbSBldmVudFRhcmdldFJlc29sdmVyIEZ1bmN0aW9uIHRoYXQgcmV0dXJucyBnbG9iYWwgdGFyZ2V0IGluZm9ybWF0aW9uIGluIGNhc2UgdGhpcyBsaXN0ZW5lclxuICogc2hvdWxkIGJlIGF0dGFjaGVkIHRvIGEgZ2xvYmFsIG9iamVjdCBsaWtlIHdpbmRvdywgZG9jdW1lbnQgb3IgYm9keVxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1bGlzdGVuZXIoXG4gICAgZXZlbnROYW1lOiBzdHJpbmcsIGxpc3RlbmVyRm46IChlPzogYW55KSA9PiBhbnksIHVzZUNhcHR1cmUgPSBmYWxzZSxcbiAgICBldmVudFRhcmdldFJlc29sdmVyPzogR2xvYmFsVGFyZ2V0UmVzb2x2ZXIpOiB2b2lkIHtcbiAgbGlzdGVuZXJJbnRlcm5hbChldmVudE5hbWUsIGxpc3RlbmVyRm4sIHVzZUNhcHR1cmUsIGV2ZW50VGFyZ2V0UmVzb2x2ZXIpO1xufVxuXG4vKipcbiogUmVnaXN0ZXJzIGEgc3ludGhldGljIGhvc3QgbGlzdGVuZXIgKGUuZy4gYChAZm9vLnN0YXJ0KWApIG9uIGEgY29tcG9uZW50LlxuKlxuKiBUaGlzIGluc3RydWN0aW9uIGlzIGZvciBjb21wYXRpYmlsaXR5IHB1cnBvc2VzIGFuZCBpcyBkZXNpZ25lZCB0byBlbnN1cmUgdGhhdCBhXG4qIHN5bnRoZXRpYyBob3N0IGxpc3RlbmVyIChlLmcuIGBASG9zdExpc3RlbmVyKCdAZm9vLnN0YXJ0JylgKSBwcm9wZXJseSBnZXRzIHJlbmRlcmVkXG4qIGluIHRoZSBjb21wb25lbnQncyByZW5kZXJlci4gTm9ybWFsbHkgYWxsIGhvc3QgbGlzdGVuZXJzIGFyZSBldmFsdWF0ZWQgd2l0aCB0aGVcbiogcGFyZW50IGNvbXBvbmVudCdzIHJlbmRlcmVyLCBidXQsIGluIHRoZSBjYXNlIG9mIGFuaW1hdGlvbiBAdHJpZ2dlcnMsIHRoZXkgbmVlZFxuKiB0byBiZSBldmFsdWF0ZWQgd2l0aCB0aGUgc3ViIGNvbXBvbmVudCdzIHJlbmRlcmVyIChiZWNhdXNlIHRoYXQncyB3aGVyZSB0aGVcbiogYW5pbWF0aW9uIHRyaWdnZXJzIGFyZSBkZWZpbmVkKS5cbipcbiogRG8gbm90IHVzZSB0aGlzIGluc3RydWN0aW9uIGFzIGEgcmVwbGFjZW1lbnQgZm9yIGBsaXN0ZW5lcmAuIFRoaXMgaW5zdHJ1Y3Rpb25cbiogb25seSBleGlzdHMgdG8gZW5zdXJlIGNvbXBhdGliaWxpdHkgd2l0aCB0aGUgVmlld0VuZ2luZSdzIGhvc3QgYmluZGluZyBiZWhhdmlvci5cbipcbiogQHBhcmFtIGV2ZW50TmFtZSBOYW1lIG9mIHRoZSBldmVudFxuKiBAcGFyYW0gbGlzdGVuZXJGbiBUaGUgZnVuY3Rpb24gdG8gYmUgY2FsbGVkIHdoZW4gZXZlbnQgZW1pdHNcbiogQHBhcmFtIHVzZUNhcHR1cmUgV2hldGhlciBvciBub3QgdG8gdXNlIGNhcHR1cmUgaW4gZXZlbnQgbGlzdGVuZXJcbiogQHBhcmFtIGV2ZW50VGFyZ2V0UmVzb2x2ZXIgRnVuY3Rpb24gdGhhdCByZXR1cm5zIGdsb2JhbCB0YXJnZXQgaW5mb3JtYXRpb24gaW4gY2FzZSB0aGlzIGxpc3RlbmVyXG4qIHNob3VsZCBiZSBhdHRhY2hlZCB0byBhIGdsb2JhbCBvYmplY3QgbGlrZSB3aW5kb3csIGRvY3VtZW50IG9yIGJvZHlcbiAqXG4gKiBAY29kZUdlbkFwaVxuKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1Y29tcG9uZW50SG9zdFN5bnRoZXRpY0xpc3RlbmVyPFQ+KFxuICAgIGV2ZW50TmFtZTogc3RyaW5nLCBsaXN0ZW5lckZuOiAoZT86IGFueSkgPT4gYW55LCB1c2VDYXB0dXJlID0gZmFsc2UsXG4gICAgZXZlbnRUYXJnZXRSZXNvbHZlcj86IEdsb2JhbFRhcmdldFJlc29sdmVyKTogdm9pZCB7XG4gIGxpc3RlbmVySW50ZXJuYWwoZXZlbnROYW1lLCBsaXN0ZW5lckZuLCB1c2VDYXB0dXJlLCBldmVudFRhcmdldFJlc29sdmVyLCBsb2FkQ29tcG9uZW50UmVuZGVyZXIpO1xufVxuXG4vKipcbiAqIEEgdXRpbGl0eSBmdW5jdGlvbiB0aGF0IGNoZWNrcyBpZiBhIGdpdmVuIGVsZW1lbnQgaGFzIGFscmVhZHkgYW4gZXZlbnQgaGFuZGxlciByZWdpc3RlcmVkIGZvciBhblxuICogZXZlbnQgd2l0aCBhIHNwZWNpZmllZCBuYW1lLiBUaGUgVFZpZXcuY2xlYW51cCBkYXRhIHN0cnVjdHVyZSBpcyB1c2VkIHRvIGZpbmQgb3V0IHdoaWNoIGV2ZW50c1xuICogYXJlIHJlZ2lzdGVyZWQgZm9yIGEgZ2l2ZW4gZWxlbWVudC5cbiAqL1xuZnVuY3Rpb24gZmluZEV4aXN0aW5nTGlzdGVuZXIoXG4gICAgbFZpZXc6IExWaWV3LCBldmVudE5hbWU6IHN0cmluZywgdE5vZGVJZHg6IG51bWJlcik6ICgoZT86IGFueSkgPT4gYW55KXxudWxsIHtcbiAgY29uc3QgdFZpZXcgPSBsVmlld1tUVklFV107XG4gIGNvbnN0IHRDbGVhbnVwID0gdFZpZXcuY2xlYW51cDtcbiAgaWYgKHRDbGVhbnVwICE9IG51bGwpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRDbGVhbnVwLmxlbmd0aCAtIDE7IGkgKz0gMikge1xuICAgICAgY29uc3QgY2xlYW51cEV2ZW50TmFtZSA9IHRDbGVhbnVwW2ldO1xuICAgICAgaWYgKGNsZWFudXBFdmVudE5hbWUgPT09IGV2ZW50TmFtZSAmJiB0Q2xlYW51cFtpICsgMV0gPT09IHROb2RlSWR4KSB7XG4gICAgICAgIC8vIFdlIGhhdmUgZm91bmQgYSBtYXRjaGluZyBldmVudCBuYW1lIG9uIHRoZSBzYW1lIG5vZGUgYnV0IGl0IG1pZ2h0IG5vdCBoYXZlIGJlZW5cbiAgICAgICAgLy8gcmVnaXN0ZXJlZCB5ZXQsIHNvIHdlIG11c3QgZXhwbGljaXRseSB2ZXJpZnkgZW50cmllcyBpbiB0aGUgTFZpZXcgY2xlYW51cCBkYXRhXG4gICAgICAgIC8vIHN0cnVjdHVyZXMuXG4gICAgICAgIGNvbnN0IGxDbGVhbnVwID0gbFZpZXdbQ0xFQU5VUF0gITtcbiAgICAgICAgY29uc3QgbGlzdGVuZXJJZHhJbkxDbGVhbnVwID0gdENsZWFudXBbaSArIDJdO1xuICAgICAgICByZXR1cm4gbENsZWFudXAubGVuZ3RoID4gbGlzdGVuZXJJZHhJbkxDbGVhbnVwID8gbENsZWFudXBbbGlzdGVuZXJJZHhJbkxDbGVhbnVwXSA6IG51bGw7XG4gICAgICB9XG4gICAgICAvLyBUVmlldy5jbGVhbnVwIGNhbiBoYXZlIGEgbWl4IG9mIDQtZWxlbWVudHMgZW50cmllcyAoZm9yIGV2ZW50IGhhbmRsZXIgY2xlYW51cHMpIG9yXG4gICAgICAvLyAyLWVsZW1lbnQgZW50cmllcyAoZm9yIGRpcmVjdGl2ZSBhbmQgcXVlcmllcyBkZXN0cm95IGhvb2tzKS4gQXMgc3VjaCB3ZSBjYW4gZW5jb3VudGVyXG4gICAgICAvLyBibG9ja3Mgb2YgNCBvciAyIGl0ZW1zIGluIHRoZSB0Vmlldy5jbGVhbnVwIGFuZCB0aGlzIGlzIHdoeSB3ZSBpdGVyYXRlIG92ZXIgMiBlbGVtZW50c1xuICAgICAgLy8gZmlyc3QgYW5kIGp1bXAgYW5vdGhlciAyIGVsZW1lbnRzIGlmIHdlIGRldGVjdCBsaXN0ZW5lcnMgY2xlYW51cCAoNCBlbGVtZW50cykuIEFsc28gY2hlY2tcbiAgICAgIC8vIGRvY3VtZW50YXRpb24gb2YgVFZpZXcuY2xlYW51cCBmb3IgbW9yZSBkZXRhaWxzIG9mIHRoaXMgZGF0YSBzdHJ1Y3R1cmUgbGF5b3V0LlxuICAgICAgaWYgKHR5cGVvZiBjbGVhbnVwRXZlbnROYW1lID09PSAnc3RyaW5nJykge1xuICAgICAgICBpICs9IDI7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG5mdW5jdGlvbiBsaXN0ZW5lckludGVybmFsKFxuICAgIGV2ZW50TmFtZTogc3RyaW5nLCBsaXN0ZW5lckZuOiAoZT86IGFueSkgPT4gYW55LCB1c2VDYXB0dXJlID0gZmFsc2UsXG4gICAgZXZlbnRUYXJnZXRSZXNvbHZlcj86IEdsb2JhbFRhcmdldFJlc29sdmVyLFxuICAgIGxvYWRSZW5kZXJlckZuPzogKCh0Tm9kZTogVE5vZGUsIGxWaWV3OiBMVmlldykgPT4gUmVuZGVyZXIzKSB8IG51bGwpOiB2b2lkIHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCB0Tm9kZSA9IGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSgpO1xuICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgY29uc3QgZmlyc3RUZW1wbGF0ZVBhc3MgPSB0Vmlldy5maXJzdFRlbXBsYXRlUGFzcztcbiAgY29uc3QgdENsZWFudXA6IGZhbHNlfGFueVtdID0gZmlyc3RUZW1wbGF0ZVBhc3MgJiYgKHRWaWV3LmNsZWFudXAgfHwgKHRWaWV3LmNsZWFudXAgPSBbXSkpO1xuXG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlT2ZQb3NzaWJsZVR5cGVzKFxuICAgICAgICAgICAgICAgICAgIHROb2RlLCBUTm9kZVR5cGUuRWxlbWVudCwgVE5vZGVUeXBlLkNvbnRhaW5lciwgVE5vZGVUeXBlLkVsZW1lbnRDb250YWluZXIpO1xuXG4gIGxldCBwcm9jZXNzT3V0cHV0cyA9IHRydWU7XG5cbiAgLy8gYWRkIG5hdGl2ZSBldmVudCBsaXN0ZW5lciAtIGFwcGxpY2FibGUgdG8gZWxlbWVudHMgb25seVxuICBpZiAodE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkVsZW1lbnQpIHtcbiAgICBjb25zdCBuYXRpdmUgPSBnZXROYXRpdmVCeVROb2RlKHROb2RlLCBsVmlldykgYXMgUkVsZW1lbnQ7XG4gICAgY29uc3QgcmVzb2x2ZWQgPSBldmVudFRhcmdldFJlc29sdmVyID8gZXZlbnRUYXJnZXRSZXNvbHZlcihuYXRpdmUpIDogRU1QVFlfT0JKIGFzIGFueTtcbiAgICBjb25zdCB0YXJnZXQgPSByZXNvbHZlZC50YXJnZXQgfHwgbmF0aXZlO1xuICAgIGNvbnN0IHJlbmRlcmVyID0gbG9hZFJlbmRlcmVyRm4gPyBsb2FkUmVuZGVyZXJGbih0Tm9kZSwgbFZpZXcpIDogbFZpZXdbUkVOREVSRVJdO1xuICAgIGNvbnN0IGxDbGVhbnVwID0gZ2V0Q2xlYW51cChsVmlldyk7XG4gICAgY29uc3QgbENsZWFudXBJbmRleCA9IGxDbGVhbnVwLmxlbmd0aDtcbiAgICBjb25zdCBpZHhPclRhcmdldEdldHRlciA9IGV2ZW50VGFyZ2V0UmVzb2x2ZXIgP1xuICAgICAgICAoX2xWaWV3OiBMVmlldykgPT4gZXZlbnRUYXJnZXRSZXNvbHZlcih1bndyYXBSTm9kZShfbFZpZXdbdE5vZGUuaW5kZXhdKSkudGFyZ2V0IDpcbiAgICAgICAgdE5vZGUuaW5kZXg7XG5cbiAgICAvLyBJbiBvcmRlciB0byBtYXRjaCBjdXJyZW50IGJlaGF2aW9yLCBuYXRpdmUgRE9NIGV2ZW50IGxpc3RlbmVycyBtdXN0IGJlIGFkZGVkIGZvciBhbGxcbiAgICAvLyBldmVudHMgKGluY2x1ZGluZyBvdXRwdXRzKS5cbiAgICBpZiAoaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpKSB7XG4gICAgICAvLyBUaGVyZSBtaWdodCBiZSBjYXNlcyB3aGVyZSBtdWx0aXBsZSBkaXJlY3RpdmVzIG9uIHRoZSBzYW1lIGVsZW1lbnQgdHJ5IHRvIHJlZ2lzdGVyIGFuIGV2ZW50XG4gICAgICAvLyBoYW5kbGVyIGZ1bmN0aW9uIGZvciB0aGUgc2FtZSBldmVudC4gSW4gdGhpcyBzaXR1YXRpb24gd2Ugd2FudCB0byBhdm9pZCByZWdpc3RyYXRpb24gb2ZcbiAgICAgIC8vIHNldmVyYWwgbmF0aXZlIGxpc3RlbmVycyBhcyBlYWNoIHJlZ2lzdHJhdGlvbiB3b3VsZCBiZSBpbnRlcmNlcHRlZCBieSBOZ1pvbmUgYW5kXG4gICAgICAvLyB0cmlnZ2VyIGNoYW5nZSBkZXRlY3Rpb24uIFRoaXMgd291bGQgbWVhbiB0aGF0IGEgc2luZ2xlIHVzZXIgYWN0aW9uIHdvdWxkIHJlc3VsdCBpbiBzZXZlcmFsXG4gICAgICAvLyBjaGFuZ2UgZGV0ZWN0aW9ucyBiZWluZyBpbnZva2VkLiBUbyBhdm9pZCB0aGlzIHNpdHVhdGlvbiB3ZSB3YW50IHRvIGhhdmUgb25seSBvbmUgY2FsbCB0b1xuICAgICAgLy8gbmF0aXZlIGhhbmRsZXIgcmVnaXN0cmF0aW9uIChmb3IgdGhlIHNhbWUgZWxlbWVudCBhbmQgc2FtZSB0eXBlIG9mIGV2ZW50KS5cbiAgICAgIC8vXG4gICAgICAvLyBJbiBvcmRlciB0byBoYXZlIGp1c3Qgb25lIG5hdGl2ZSBldmVudCBoYW5kbGVyIGluIHByZXNlbmNlIG9mIG11bHRpcGxlIGhhbmRsZXIgZnVuY3Rpb25zLFxuICAgICAgLy8gd2UganVzdCByZWdpc3RlciBhIGZpcnN0IGhhbmRsZXIgZnVuY3Rpb24gYXMgYSBuYXRpdmUgZXZlbnQgbGlzdGVuZXIgYW5kIHRoZW4gY2hhaW5cbiAgICAgIC8vIChjb2FsZXNjZSkgb3RoZXIgaGFuZGxlciBmdW5jdGlvbnMgb24gdG9wIG9mIHRoZSBmaXJzdCBuYXRpdmUgaGFuZGxlciBmdW5jdGlvbi5cbiAgICAgIGxldCBleGlzdGluZ0xpc3RlbmVyID0gbnVsbDtcbiAgICAgIC8vIFBsZWFzZSBub3RlIHRoYXQgdGhlIGNvYWxlc2NpbmcgZGVzY3JpYmVkIGhlcmUgZG9lc24ndCBoYXBwZW4gZm9yIGV2ZW50cyBzcGVjaWZ5aW5nIGFuXG4gICAgICAvLyBhbHRlcm5hdGl2ZSB0YXJnZXQgKGV4LiAoZG9jdW1lbnQ6Y2xpY2spKSAtIHRoaXMgaXMgdG8ga2VlcCBiYWNrd2FyZCBjb21wYXRpYmlsaXR5IHdpdGggdGhlXG4gICAgICAvLyB2aWV3IGVuZ2luZS5cbiAgICAgIC8vIEFsc28sIHdlIGRvbid0IGhhdmUgdG8gc2VhcmNoIGZvciBleGlzdGluZyBsaXN0ZW5lcnMgaXMgdGhlcmUgYXJlIG5vIGRpcmVjdGl2ZXNcbiAgICAgIC8vIG1hdGNoaW5nIG9uIGEgZ2l2ZW4gbm9kZSBhcyB3ZSBjYW4ndCByZWdpc3RlciBtdWx0aXBsZSBldmVudCBoYW5kbGVycyBmb3IgdGhlIHNhbWUgZXZlbnQgaW5cbiAgICAgIC8vIGEgdGVtcGxhdGUgKHRoaXMgd291bGQgbWVhbiBoYXZpbmcgZHVwbGljYXRlIGF0dHJpYnV0ZXMpLlxuICAgICAgaWYgKCFldmVudFRhcmdldFJlc29sdmVyICYmIGhhc0RpcmVjdGl2ZXModE5vZGUpKSB7XG4gICAgICAgIGV4aXN0aW5nTGlzdGVuZXIgPSBmaW5kRXhpc3RpbmdMaXN0ZW5lcihsVmlldywgZXZlbnROYW1lLCB0Tm9kZS5pbmRleCk7XG4gICAgICB9XG4gICAgICBpZiAoZXhpc3RpbmdMaXN0ZW5lciAhPT0gbnVsbCkge1xuICAgICAgICAvLyBBdHRhY2ggYSBuZXcgbGlzdGVuZXIgYXQgdGhlIGhlYWQgb2YgdGhlIGNvYWxlc2NlZCBsaXN0ZW5lcnMgbGlzdC5cbiAgICAgICAgKDxhbnk+bGlzdGVuZXJGbikuX19uZ05leHRMaXN0ZW5lckZuX18gPSAoPGFueT5leGlzdGluZ0xpc3RlbmVyKS5fX25nTmV4dExpc3RlbmVyRm5fXztcbiAgICAgICAgKDxhbnk+ZXhpc3RpbmdMaXN0ZW5lcikuX19uZ05leHRMaXN0ZW5lckZuX18gPSBsaXN0ZW5lckZuO1xuICAgICAgICBwcm9jZXNzT3V0cHV0cyA9IGZhbHNlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gVGhlIGZpcnN0IGFyZ3VtZW50IG9mIGBsaXN0ZW5gIGZ1bmN0aW9uIGluIFByb2NlZHVyYWwgUmVuZGVyZXIgaXM6XG4gICAgICAgIC8vIC0gZWl0aGVyIGEgdGFyZ2V0IG5hbWUgKGFzIGEgc3RyaW5nKSBpbiBjYXNlIG9mIGdsb2JhbCB0YXJnZXQgKHdpbmRvdywgZG9jdW1lbnQsIGJvZHkpXG4gICAgICAgIC8vIC0gb3IgZWxlbWVudCByZWZlcmVuY2UgKGluIGFsbCBvdGhlciBjYXNlcylcbiAgICAgICAgbGlzdGVuZXJGbiA9IHdyYXBMaXN0ZW5lcih0Tm9kZSwgbFZpZXcsIGxpc3RlbmVyRm4sIGZhbHNlIC8qKiBwcmV2ZW50RGVmYXVsdCAqLyk7XG4gICAgICAgIGNvbnN0IGNsZWFudXBGbiA9IHJlbmRlcmVyLmxpc3RlbihyZXNvbHZlZC5uYW1lIHx8IHRhcmdldCwgZXZlbnROYW1lLCBsaXN0ZW5lckZuKTtcbiAgICAgICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlckFkZEV2ZW50TGlzdGVuZXIrKztcblxuICAgICAgICBsQ2xlYW51cC5wdXNoKGxpc3RlbmVyRm4sIGNsZWFudXBGbik7XG4gICAgICAgIHRDbGVhbnVwICYmIHRDbGVhbnVwLnB1c2goZXZlbnROYW1lLCBpZHhPclRhcmdldEdldHRlciwgbENsZWFudXBJbmRleCwgbENsZWFudXBJbmRleCArIDEpO1xuICAgICAgfVxuXG4gICAgfSBlbHNlIHtcbiAgICAgIGxpc3RlbmVyRm4gPSB3cmFwTGlzdGVuZXIodE5vZGUsIGxWaWV3LCBsaXN0ZW5lckZuLCB0cnVlIC8qKiBwcmV2ZW50RGVmYXVsdCAqLyk7XG4gICAgICB0YXJnZXQuYWRkRXZlbnRMaXN0ZW5lcihldmVudE5hbWUsIGxpc3RlbmVyRm4sIHVzZUNhcHR1cmUpO1xuICAgICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlckFkZEV2ZW50TGlzdGVuZXIrKztcblxuICAgICAgbENsZWFudXAucHVzaChsaXN0ZW5lckZuKTtcbiAgICAgIHRDbGVhbnVwICYmIHRDbGVhbnVwLnB1c2goZXZlbnROYW1lLCBpZHhPclRhcmdldEdldHRlciwgbENsZWFudXBJbmRleCwgdXNlQ2FwdHVyZSk7XG4gICAgfVxuICB9XG5cbiAgLy8gc3Vic2NyaWJlIHRvIGRpcmVjdGl2ZSBvdXRwdXRzXG4gIGlmICh0Tm9kZS5vdXRwdXRzID09PSB1bmRlZmluZWQpIHtcbiAgICAvLyBpZiB3ZSBjcmVhdGUgVE5vZGUgaGVyZSwgaW5wdXRzIG11c3QgYmUgdW5kZWZpbmVkIHNvIHdlIGtub3cgdGhleSBzdGlsbCBuZWVkIHRvIGJlXG4gICAgLy8gY2hlY2tlZFxuICAgIHROb2RlLm91dHB1dHMgPSBnZW5lcmF0ZVByb3BlcnR5QWxpYXNlcyh0Tm9kZSwgQmluZGluZ0RpcmVjdGlvbi5PdXRwdXQpO1xuICB9XG5cbiAgY29uc3Qgb3V0cHV0cyA9IHROb2RlLm91dHB1dHM7XG4gIGxldCBwcm9wczogUHJvcGVydHlBbGlhc1ZhbHVlfHVuZGVmaW5lZDtcbiAgaWYgKHByb2Nlc3NPdXRwdXRzICYmIG91dHB1dHMgJiYgKHByb3BzID0gb3V0cHV0c1tldmVudE5hbWVdKSkge1xuICAgIGNvbnN0IHByb3BzTGVuZ3RoID0gcHJvcHMubGVuZ3RoO1xuICAgIGlmIChwcm9wc0xlbmd0aCkge1xuICAgICAgY29uc3QgbENsZWFudXAgPSBnZXRDbGVhbnVwKGxWaWV3KTtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcHJvcHNMZW5ndGg7IGkgKz0gMykge1xuICAgICAgICBjb25zdCBpbmRleCA9IHByb3BzW2ldIGFzIG51bWJlcjtcbiAgICAgICAgbmdEZXZNb2RlICYmIGFzc2VydERhdGFJblJhbmdlKGxWaWV3LCBpbmRleCk7XG4gICAgICAgIGNvbnN0IG1pbmlmaWVkTmFtZSA9IHByb3BzW2kgKyAyXTtcbiAgICAgICAgY29uc3QgZGlyZWN0aXZlSW5zdGFuY2UgPSBsVmlld1tpbmRleF07XG4gICAgICAgIGNvbnN0IG91dHB1dCA9IGRpcmVjdGl2ZUluc3RhbmNlW21pbmlmaWVkTmFtZV07XG5cbiAgICAgICAgaWYgKG5nRGV2TW9kZSAmJiAhaXNPYnNlcnZhYmxlKG91dHB1dCkpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgICAgIGBAT3V0cHV0ICR7bWluaWZpZWROYW1lfSBub3QgaW5pdGlhbGl6ZWQgaW4gJyR7ZGlyZWN0aXZlSW5zdGFuY2UuY29uc3RydWN0b3IubmFtZX0nLmApO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3Qgc3Vic2NyaXB0aW9uID0gb3V0cHV0LnN1YnNjcmliZShsaXN0ZW5lckZuKTtcbiAgICAgICAgY29uc3QgaWR4ID0gbENsZWFudXAubGVuZ3RoO1xuICAgICAgICBsQ2xlYW51cC5wdXNoKGxpc3RlbmVyRm4sIHN1YnNjcmlwdGlvbik7XG4gICAgICAgIHRDbGVhbnVwICYmIHRDbGVhbnVwLnB1c2goZXZlbnROYW1lLCB0Tm9kZS5pbmRleCwgaWR4LCAtKGlkeCArIDEpKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gZXhlY3V0ZUxpc3RlbmVyV2l0aEVycm9ySGFuZGxpbmcoXG4gICAgbFZpZXc6IExWaWV3LCBsaXN0ZW5lckZuOiAoZT86IGFueSkgPT4gYW55LCBlOiBhbnkpOiBib29sZWFuIHtcbiAgdHJ5IHtcbiAgICAvLyBPbmx5IGV4cGxpY2l0bHkgcmV0dXJuaW5nIGZhbHNlIGZyb20gYSBsaXN0ZW5lciBzaG91bGQgcHJldmVudERlZmF1bHRcbiAgICByZXR1cm4gbGlzdGVuZXJGbihlKSAhPT0gZmFsc2U7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgaGFuZGxlRXJyb3IobFZpZXcsIGVycm9yKTtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbn1cblxuLyoqXG4gKiBXcmFwcyBhbiBldmVudCBsaXN0ZW5lciB3aXRoIGEgZnVuY3Rpb24gdGhhdCBtYXJrcyBhbmNlc3RvcnMgZGlydHkgYW5kIHByZXZlbnRzIGRlZmF1bHQgYmVoYXZpb3IsXG4gKiBpZiBhcHBsaWNhYmxlLlxuICpcbiAqIEBwYXJhbSB0Tm9kZSBUaGUgVE5vZGUgYXNzb2NpYXRlZCB3aXRoIHRoaXMgbGlzdGVuZXJcbiAqIEBwYXJhbSBsVmlldyBUaGUgTFZpZXcgdGhhdCBjb250YWlucyB0aGlzIGxpc3RlbmVyXG4gKiBAcGFyYW0gbGlzdGVuZXJGbiBUaGUgbGlzdGVuZXIgZnVuY3Rpb24gdG8gY2FsbFxuICogQHBhcmFtIHdyYXBXaXRoUHJldmVudERlZmF1bHQgV2hldGhlciBvciBub3QgdG8gcHJldmVudCBkZWZhdWx0IGJlaGF2aW9yXG4gKiAodGhlIHByb2NlZHVyYWwgcmVuZGVyZXIgZG9lcyB0aGlzIGFscmVhZHksIHNvIGluIHRob3NlIGNhc2VzLCB3ZSBzaG91bGQgc2tpcClcbiAqL1xuZnVuY3Rpb24gd3JhcExpc3RlbmVyKFxuICAgIHROb2RlOiBUTm9kZSwgbFZpZXc6IExWaWV3LCBsaXN0ZW5lckZuOiAoZT86IGFueSkgPT4gYW55LFxuICAgIHdyYXBXaXRoUHJldmVudERlZmF1bHQ6IGJvb2xlYW4pOiBFdmVudExpc3RlbmVyIHtcbiAgLy8gTm90ZTogd2UgYXJlIHBlcmZvcm1pbmcgbW9zdCBvZiB0aGUgd29yayBpbiB0aGUgbGlzdGVuZXIgZnVuY3Rpb24gaXRzZWxmXG4gIC8vIHRvIG9wdGltaXplIGxpc3RlbmVyIHJlZ2lzdHJhdGlvbi5cbiAgcmV0dXJuIGZ1bmN0aW9uIHdyYXBMaXN0ZW5lckluX21hcmtEaXJ0eUFuZFByZXZlbnREZWZhdWx0KGU6IEV2ZW50KSB7XG4gICAgLy8gSW4gb3JkZXIgdG8gYmUgYmFja3dhcmRzIGNvbXBhdGlibGUgd2l0aCBWaWV3IEVuZ2luZSwgZXZlbnRzIG9uIGNvbXBvbmVudCBob3N0IG5vZGVzXG4gICAgLy8gbXVzdCBhbHNvIG1hcmsgdGhlIGNvbXBvbmVudCB2aWV3IGl0c2VsZiBkaXJ0eSAoaS5lLiB0aGUgdmlldyB0aGF0IGl0IG93bnMpLlxuICAgIGNvbnN0IHN0YXJ0VmlldyA9XG4gICAgICAgIHROb2RlLmZsYWdzICYgVE5vZGVGbGFncy5pc0NvbXBvbmVudCA/IGdldENvbXBvbmVudFZpZXdCeUluZGV4KHROb2RlLmluZGV4LCBsVmlldykgOiBsVmlldztcblxuICAgIC8vIFNlZSBpbnRlcmZhY2VzL3ZpZXcudHMgZm9yIG1vcmUgb24gTFZpZXdGbGFncy5NYW51YWxPblB1c2hcbiAgICBpZiAoKGxWaWV3W0ZMQUdTXSAmIExWaWV3RmxhZ3MuTWFudWFsT25QdXNoKSA9PT0gMCkge1xuICAgICAgbWFya1ZpZXdEaXJ0eShzdGFydFZpZXcpO1xuICAgIH1cblxuICAgIGxldCByZXN1bHQgPSBleGVjdXRlTGlzdGVuZXJXaXRoRXJyb3JIYW5kbGluZyhsVmlldywgbGlzdGVuZXJGbiwgZSk7XG4gICAgLy8gQSBqdXN0LWludm9rZWQgbGlzdGVuZXIgZnVuY3Rpb24gbWlnaHQgaGF2ZSBjb2FsZXNjZWQgbGlzdGVuZXJzIHNvIHdlIG5lZWQgdG8gY2hlY2sgZm9yXG4gICAgLy8gdGhlaXIgcHJlc2VuY2UgYW5kIGludm9rZSBhcyBuZWVkZWQuXG4gICAgbGV0IG5leHRMaXN0ZW5lckZuID0gKDxhbnk+d3JhcExpc3RlbmVySW5fbWFya0RpcnR5QW5kUHJldmVudERlZmF1bHQpLl9fbmdOZXh0TGlzdGVuZXJGbl9fO1xuICAgIHdoaWxlIChuZXh0TGlzdGVuZXJGbikge1xuICAgICAgLy8gV2Ugc2hvdWxkIHByZXZlbnQgZGVmYXVsdCBpZiBhbnkgb2YgdGhlIGxpc3RlbmVycyBleHBsaWNpdGx5IHJldHVybiBmYWxzZVxuICAgICAgcmVzdWx0ID0gZXhlY3V0ZUxpc3RlbmVyV2l0aEVycm9ySGFuZGxpbmcobFZpZXcsIG5leHRMaXN0ZW5lckZuLCBlKSAmJiByZXN1bHQ7XG4gICAgICBuZXh0TGlzdGVuZXJGbiA9ICg8YW55Pm5leHRMaXN0ZW5lckZuKS5fX25nTmV4dExpc3RlbmVyRm5fXztcbiAgICB9XG5cbiAgICBpZiAod3JhcFdpdGhQcmV2ZW50RGVmYXVsdCAmJiByZXN1bHQgPT09IGZhbHNlKSB7XG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAvLyBOZWNlc3NhcnkgZm9yIGxlZ2FjeSBicm93c2VycyB0aGF0IGRvbid0IHN1cHBvcnQgcHJldmVudERlZmF1bHQgKGUuZy4gSUUpXG4gICAgICBlLnJldHVyblZhbHVlID0gZmFsc2U7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfTtcbn1cbiJdfQ==