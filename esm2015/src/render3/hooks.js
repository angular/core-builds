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
import { assertEqual, assertNotEqual } from '../util/assert';
import { assertFirstTemplatePass } from './assert';
import { FLAGS, PREORDER_HOOK_FLAGS } from './interfaces/view';
import { getCheckNoChangesMode } from './state';
/**
 * Adds all directive lifecycle hooks from the given `DirectiveDef` to the given `TView`.
 *
 * Must be run *only* on the first template pass.
 *
 * Sets up the pre-order hooks on the provided `tView`,
 * see {\@link HookData} for details about the data structure.
 *
 * @param {?} directiveIndex The index of the directive in LView
 * @param {?} directiveDef The definition containing the hooks to setup in tView
 * @param {?} tView The current TView
 * @param {?} nodeIndex The index of the node to which the directive is attached
 * @param {?} initialPreOrderHooksLength the number of pre-order hooks already registered before the
 * current process, used to know if the node index has to be added to the array. If it is -1,
 * the node index is never added.
 * @param {?} initialPreOrderCheckHooksLength same as previous for pre-order check hooks
 * @return {?}
 */
export function registerPreOrderHooks(directiveIndex, directiveDef, tView, nodeIndex, initialPreOrderHooksLength, initialPreOrderCheckHooksLength) {
    ngDevMode && assertFirstTemplatePass(tView);
    const { onChanges, onInit, doCheck } = directiveDef;
    if (initialPreOrderHooksLength >= 0 &&
        (!tView.preOrderHooks || initialPreOrderHooksLength === tView.preOrderHooks.length) &&
        (onChanges || onInit || doCheck)) {
        (tView.preOrderHooks || (tView.preOrderHooks = [])).push(nodeIndex);
    }
    if (initialPreOrderCheckHooksLength >= 0 &&
        (!tView.preOrderCheckHooks ||
            initialPreOrderCheckHooksLength === tView.preOrderCheckHooks.length) &&
        (onChanges || doCheck)) {
        (tView.preOrderCheckHooks || (tView.preOrderCheckHooks = [])).push(nodeIndex);
    }
    if (onChanges) {
        (tView.preOrderHooks || (tView.preOrderHooks = [])).push(directiveIndex, onChanges);
        (tView.preOrderCheckHooks || (tView.preOrderCheckHooks = [])).push(directiveIndex, onChanges);
    }
    if (onInit) {
        (tView.preOrderHooks || (tView.preOrderHooks = [])).push(-directiveIndex, onInit);
    }
    if (doCheck) {
        (tView.preOrderHooks || (tView.preOrderHooks = [])).push(directiveIndex, doCheck);
        (tView.preOrderCheckHooks || (tView.preOrderCheckHooks = [])).push(directiveIndex, doCheck);
    }
}
/**
 *
 * Loops through the directives on the provided `tNode` and queues hooks to be
 * run that are not initialization hooks.
 *
 * Should be executed during `elementEnd()` and similar to
 * preserve hook execution order. Content, view, and destroy hooks for projected
 * components and directives must be called *before* their hosts.
 *
 * Sets up the content, view, and destroy hooks on the provided `tView`,
 * see {\@link HookData} for details about the data structure.
 *
 * NOTE: This does not set up `onChanges`, `onInit` or `doCheck`, those are set up
 * separately at `elementStart`.
 *
 * @param {?} tView The current TView
 * @param {?} tNode The TNode whose directives are to be searched for hooks to queue
 * @return {?}
 */
export function registerPostOrderHooks(tView, tNode) {
    ngDevMode && assertFirstTemplatePass(tView);
    // It's necessary to loop through the directives at elementEnd() (rather than processing in
    // directiveCreate) so we can preserve the current hook order. Content, view, and destroy
    // hooks for projected components and directives must be called *before* their hosts.
    for (let i = tNode.directiveStart, end = tNode.directiveEnd; i < end; i++) {
        /** @type {?} */
        const directiveDef = (/** @type {?} */ (tView.data[i]));
        if (directiveDef.afterContentInit) {
            (tView.contentHooks || (tView.contentHooks = [])).push(-i, directiveDef.afterContentInit);
        }
        if (directiveDef.afterContentChecked) {
            (tView.contentHooks || (tView.contentHooks = [])).push(i, directiveDef.afterContentChecked);
            (tView.contentCheckHooks || (tView.contentCheckHooks = [])).push(i, directiveDef.afterContentChecked);
        }
        if (directiveDef.afterViewInit) {
            (tView.viewHooks || (tView.viewHooks = [])).push(-i, directiveDef.afterViewInit);
        }
        if (directiveDef.afterViewChecked) {
            (tView.viewHooks || (tView.viewHooks = [])).push(i, directiveDef.afterViewChecked);
            (tView.viewCheckHooks || (tView.viewCheckHooks = [])).push(i, directiveDef.afterViewChecked);
        }
        if (directiveDef.onDestroy != null) {
            (tView.destroyHooks || (tView.destroyHooks = [])).push(i, directiveDef.onDestroy);
        }
    }
}
/**
 * Executing hooks requires complex logic as we need to deal with 2 constraints.
 *
 * 1. Init hooks (ngOnInit, ngAfterContentInit, ngAfterViewInit) must all be executed once and only
 * once, across many change detection cycles. This must be true even if some hooks throw, or if
 * some recursively trigger a change detection cycle.
 * To solve that, it is required to track the state of the execution of these init hooks.
 * This is done by storing and maintaining flags in the view: the {@link InitPhaseState},
 * and the index within that phase. They can be seen as a cursor in the following structure:
 * [[onInit1, onInit2], [afterContentInit1], [afterViewInit1, afterViewInit2, afterViewInit3]]
 * They are are stored as flags in LView[FLAGS].
 *
 * 2. Pre-order hooks can be executed in batches, because of the select instruction.
 * To be able to pause and resume their execution, we also need some state about the hook's array
 * that is being processed:
 * - the index of the next hook to be executed
 * - the number of init hooks already found in the processed part of the  array
 * They are are stored as flags in LView[PREORDER_HOOK_FLAGS].
 */
/**
 * Executes pre-order check hooks ( OnChanges, DoChanges) given a view where all the init hooks were
 * executed once. This is a light version of executeInitAndCheckPreOrderHooks where we can skip read
 * / write of the init-hooks related flags.
 * @param {?} lView The LView where hooks are defined
 * @param {?} hooks Hooks to be run
 * @param {?=} nodeIndex 3 cases depending on the value:
 * - undefined: all hooks from the array should be executed (post-order case)
 * - null: execute hooks only from the saved index until the end of the array (pre-order case, when
 * flushing the remaining hooks)
 * - number: execute hooks only from the saved index until that node index exclusive (pre-order
 * case, when executing select(number))
 * @return {?}
 */
export function executeCheckHooks(lView, hooks, nodeIndex) {
    callHooks(lView, hooks, 3 /* InitPhaseCompleted */, nodeIndex);
}
/**
 * Executes post-order init and check hooks (one of AfterContentInit, AfterContentChecked,
 * AfterViewInit, AfterViewChecked) given a view where there are pending init hooks to be executed.
 * @param {?} lView The LView where hooks are defined
 * @param {?} hooks Hooks to be run
 * @param {?} initPhase A phase for which hooks should be run
 * @param {?=} nodeIndex 3 cases depending on the value:
 * - undefined: all hooks from the array should be executed (post-order case)
 * - null: execute hooks only from the saved index until the end of the array (pre-order case, when
 * flushing the remaining hooks)
 * - number: execute hooks only from the saved index until that node index exclusive (pre-order
 * case, when executing select(number))
 * @return {?}
 */
export function executeInitAndCheckHooks(lView, hooks, initPhase, nodeIndex) {
    ngDevMode && assertNotEqual(initPhase, 3 /* InitPhaseCompleted */, 'Init pre-order hooks should not be called more than once');
    if ((lView[FLAGS] & 3 /* InitPhaseStateMask */) === initPhase) {
        callHooks(lView, hooks, initPhase, nodeIndex);
    }
}
/**
 * @param {?} lView
 * @param {?} initPhase
 * @return {?}
 */
export function incrementInitPhaseFlags(lView, initPhase) {
    ngDevMode &&
        assertNotEqual(initPhase, 3 /* InitPhaseCompleted */, 'Init hooks phase should not be incremented after all init hooks have been run.');
    /** @type {?} */
    let flags = lView[FLAGS];
    if ((flags & 3 /* InitPhaseStateMask */) === initPhase) {
        flags &= 1023 /* IndexWithinInitPhaseReset */;
        flags += 1 /* InitPhaseStateIncrementer */;
        lView[FLAGS] = flags;
    }
}
/**
 * Calls lifecycle hooks with their contexts, skipping init hooks if it's not
 * the first LView pass
 *
 * @param {?} currentView The current view
 * @param {?} arr The array in which the hooks are found
 * @param {?} initPhase
 * @param {?} currentNodeIndex 3 cases depending on the value:
 * - undefined: all hooks from the array should be executed (post-order case)
 * - null: execute hooks only from the saved index until the end of the array (pre-order case, when
 * flushing the remaining hooks)
 * - number: execute hooks only from the saved index until that node index exclusive (pre-order
 * case, when executing select(number))
 * @return {?}
 */
function callHooks(currentView, arr, initPhase, currentNodeIndex) {
    ngDevMode && assertEqual(getCheckNoChangesMode(), false, 'Hooks should never be run in the check no changes mode.');
    /** @type {?} */
    const startIndex = currentNodeIndex !== undefined ?
        (currentView[PREORDER_HOOK_FLAGS] & 65535 /* IndexOfTheNextPreOrderHookMaskMask */) :
        0;
    /** @type {?} */
    const nodeIndexLimit = currentNodeIndex != null ? currentNodeIndex : -1;
    /** @type {?} */
    let lastNodeIndexFound = 0;
    for (let i = startIndex; i < arr.length; i++) {
        /** @type {?} */
        const hook = (/** @type {?} */ (arr[i + 1]));
        if (typeof hook === 'number') {
            lastNodeIndexFound = (/** @type {?} */ (arr[i]));
            if (currentNodeIndex != null && lastNodeIndexFound >= currentNodeIndex) {
                break;
            }
        }
        else {
            /** @type {?} */
            const isInitHook = arr[i] < 0;
            if (isInitHook)
                currentView[PREORDER_HOOK_FLAGS] += 65536 /* NumberOfInitHooksCalledIncrementer */;
            if (lastNodeIndexFound < nodeIndexLimit || nodeIndexLimit == -1) {
                callHook(currentView, initPhase, arr, i);
                currentView[PREORDER_HOOK_FLAGS] =
                    (currentView[PREORDER_HOOK_FLAGS] & 4294901760 /* NumberOfInitHooksCalledMask */) + i +
                        2;
            }
            i++;
        }
    }
}
/**
 * Execute one hook against the current `LView`.
 *
 * @param {?} currentView The current view
 * @param {?} initPhase
 * @param {?} arr The array in which the hooks are found
 * @param {?} i The current index within the hook data array
 * @return {?}
 */
function callHook(currentView, initPhase, arr, i) {
    /** @type {?} */
    const isInitHook = arr[i] < 0;
    /** @type {?} */
    const hook = (/** @type {?} */ (arr[i + 1]));
    /** @type {?} */
    const directiveIndex = isInitHook ? -arr[i] : (/** @type {?} */ (arr[i]));
    /** @type {?} */
    const directive = currentView[directiveIndex];
    if (isInitHook) {
        /** @type {?} */
        const indexWithintInitPhase = currentView[FLAGS] >> 10 /* IndexWithinInitPhaseShift */;
        // The init phase state must be always checked here as it may have been recursively
        // updated
        if (indexWithintInitPhase <
            (currentView[PREORDER_HOOK_FLAGS] >> 16 /* NumberOfInitHooksCalledShift */) &&
            (currentView[FLAGS] & 3 /* InitPhaseStateMask */) === initPhase) {
            currentView[FLAGS] += 1024 /* IndexWithinInitPhaseIncrementer */;
            hook.call(directive);
        }
    }
    else {
        hook.call(directive);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaG9va3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2hvb2tzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUFDLFdBQVcsRUFBRSxjQUFjLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUUzRCxPQUFPLEVBQUMsdUJBQXVCLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFHakQsT0FBTyxFQUFDLEtBQUssRUFBK0MsbUJBQW1CLEVBQTJCLE1BQU0sbUJBQW1CLENBQUM7QUFDcEksT0FBTyxFQUFDLHFCQUFxQixFQUFDLE1BQU0sU0FBUyxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBcUI5QyxNQUFNLFVBQVUscUJBQXFCLENBQ2pDLGNBQXNCLEVBQUUsWUFBK0IsRUFBRSxLQUFZLEVBQUUsU0FBaUIsRUFDeEYsMEJBQWtDLEVBQUUsK0JBQXVDO0lBQzdFLFNBQVMsSUFBSSx1QkFBdUIsQ0FBQyxLQUFLLENBQUMsQ0FBQztVQUN0QyxFQUFDLFNBQVMsRUFBRSxNQUFNLEVBQUUsT0FBTyxFQUFDLEdBQUcsWUFBWTtJQUNqRCxJQUFJLDBCQUEwQixJQUFJLENBQUM7UUFDL0IsQ0FBQyxDQUFDLEtBQUssQ0FBQyxhQUFhLElBQUksMEJBQTBCLEtBQUssS0FBSyxDQUFDLGFBQWEsQ0FBQyxNQUFNLENBQUM7UUFDbkYsQ0FBQyxTQUFTLElBQUksTUFBTSxJQUFJLE9BQU8sQ0FBQyxFQUFFO1FBQ3BDLENBQUMsS0FBSyxDQUFDLGFBQWEsSUFBSSxDQUFDLEtBQUssQ0FBQyxhQUFhLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7S0FDckU7SUFFRCxJQUFJLCtCQUErQixJQUFJLENBQUM7UUFDcEMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxrQkFBa0I7WUFDekIsK0JBQStCLEtBQUssS0FBSyxDQUFDLGtC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RTtZQUN0RSxXQUFXLENBQUMsS0FBSyxDQUFDLDhDQUE4QyxDQUFDO1lBQ2pFLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7U0FDdEI7S0FDRjtTQUFNO1FBQ0wsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztLQUN0QjtBQUNILENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7YXNzZXJ0RXF1YWwsIGFzc2VydE5vdEVxdWFsfSBmcm9tICcuLi91dGlsL2Fzc2VydCc7XG5cbmltcG9ydCB7YXNzZXJ0Rmlyc3RUZW1wbGF0ZVBhc3N9IGZyb20gJy4vYXNzZXJ0JztcbmltcG9ydCB7RGlyZWN0aXZlRGVmfSBmcm9tICcuL2ludGVyZmFjZXMvZGVmaW5pdGlvbic7XG5pbXBvcnQge1ROb2RlfSBmcm9tICcuL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge0ZMQUdTLCBIb29rRGF0YSwgSW5pdFBoYXNlU3RhdGUsIExWaWV3LCBMVmlld0ZsYWdzLCBQUkVPUkRFUl9IT09LX0ZMQUdTLCBQcmVPcmRlckhvb2tGbGFncywgVFZpZXd9IGZyb20gJy4vaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7Z2V0Q2hlY2tOb0NoYW5nZXNNb2RlfSBmcm9tICcuL3N0YXRlJztcblxuXG5cbi8qKlxuICogQWRkcyBhbGwgZGlyZWN0aXZlIGxpZmVjeWNsZSBob29rcyBmcm9tIHRoZSBnaXZlbiBgRGlyZWN0aXZlRGVmYCB0byB0aGUgZ2l2ZW4gYFRWaWV3YC5cbiAqXG4gKiBNdXN0IGJlIHJ1biAqb25seSogb24gdGhlIGZpcnN0IHRlbXBsYXRlIHBhc3MuXG4gKlxuICogU2V0cyB1cCB0aGUgcHJlLW9yZGVyIGhvb2tzIG9uIHRoZSBwcm92aWRlZCBgdFZpZXdgLFxuICogc2VlIHtAbGluayBIb29rRGF0YX0gZm9yIGRldGFpbHMgYWJvdXQgdGhlIGRhdGEgc3RydWN0dXJlLlxuICpcbiAqIEBwYXJhbSBkaXJlY3RpdmVJbmRleCBUaGUgaW5kZXggb2YgdGhlIGRpcmVjdGl2ZSBpbiBMVmlld1xuICogQHBhcmFtIGRpcmVjdGl2ZURlZiBUaGUgZGVmaW5pdGlvbiBjb250YWluaW5nIHRoZSBob29rcyB0byBzZXR1cCBpbiB0Vmlld1xuICogQHBhcmFtIHRWaWV3IFRoZSBjdXJyZW50IFRWaWV3XG4gKiBAcGFyYW0gbm9kZUluZGV4IFRoZSBpbmRleCBvZiB0aGUgbm9kZSB0byB3aGljaCB0aGUgZGlyZWN0aXZlIGlzIGF0dGFjaGVkXG4gKiBAcGFyYW0gaW5pdGlhbFByZU9yZGVySG9va3NMZW5ndGggdGhlIG51bWJlciBvZiBwcmUtb3JkZXIgaG9va3MgYWxyZWFkeSByZWdpc3RlcmVkIGJlZm9yZSB0aGVcbiAqIGN1cnJlbnQgcHJvY2VzcywgdXNlZCB0byBrbm93IGlmIHRoZSBub2RlIGluZGV4IGhhcyB0byBiZSBhZGRlZCB0byB0aGUgYXJyYXkuIElmIGl0IGlzIC0xLFxuICogdGhlIG5vZGUgaW5kZXggaXMgbmV2ZXIgYWRkZWQuXG4gKiBAcGFyYW0gaW5pdGlhbFByZU9yZGVyQ2hlY2tIb29rc0xlbmd0aCBzYW1lIGFzIHByZXZpb3VzIGZvciBwcmUtb3JkZXIgY2hlY2sgaG9va3NcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlZ2lzdGVyUHJlT3JkZXJIb29rcyhcbiAgICBkaXJlY3RpdmVJbmRleDogbnVtYmVyLCBkaXJlY3RpdmVEZWY6IERpcmVjdGl2ZURlZjxhbnk+LCB0VmlldzogVFZpZXcsIG5vZGVJbmRleDogbnVtYmVyLFxuICAgIGluaXRpYWxQcmVPcmRlckhvb2tzTGVuZ3RoOiBudW1iZXIsIGluaXRpYWxQcmVPcmRlckNoZWNrSG9va3NMZW5ndGg6IG51bWJlcik6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Rmlyc3RUZW1wbGF0ZVBhc3ModFZpZXcpO1xuICBjb25zdCB7b25DaGFuZ2VzLCBvbkluaXQsIGRvQ2hlY2t9ID0gZGlyZWN0aXZlRGVmO1xuICBpZiAoaW5pdGlhbFByZU9yZGVySG9va3NMZW5ndGggPj0gMCAmJlxuICAgICAgKCF0Vmlldy5wcmVPcmRlckhvb2tzIHx8IGluaXRpYWxQcmVPcmRlckhvb2tzTGVuZ3RoID09PSB0Vmlldy5wcmVPcmRlckhvb2tzLmxlbmd0aCkgJiZcbiAgICAgIChvbkNoYW5nZXMgfHwgb25Jbml0IHx8IGRvQ2hlY2spKSB7XG4gICAgKHRWaWV3LnByZU9yZGVySG9va3MgfHwgKHRWaWV3LnByZU9yZGVySG9va3MgPSBbXSkpLnB1c2gobm9kZUluZGV4KTtcbiAgfVxuXG4gIGlmIChpbml0aWFsUHJlT3JkZXJDaGVja0hvb2tzTGVuZ3RoID49IDAgJiZcbiAgICAgICghdFZpZXcucHJlT3JkZXJDaGVja0hvb2tzIHx8XG4gICAgICAgaW5pdGlhbFByZU9yZGVyQ2hlY2tIb29rc0xlbmd0aCA9PT0gdFZpZXcucHJlT3JkZXJDaGVja0hvb2tzLmxlbmd0aCkgJiZcbiAgICAgIChvbkNoYW5nZXMgfHwgZG9DaGVjaykpIHtcbiAgICAodFZpZXcucHJlT3JkZXJDaGVja0hvb2tzIHx8ICh0Vmlldy5wcmVPcmRlckNoZWNrSG9va3MgPSBbXSkpLnB1c2gobm9kZUluZGV4KTtcbiAgfVxuXG4gIGlmIChvbkNoYW5nZXMpIHtcbiAgICAodFZpZXcucHJlT3JkZXJIb29rcyB8fCAodFZpZXcucHJlT3JkZXJIb29rcyA9IFtdKSkucHVzaChkaXJlY3RpdmVJbmRleCwgb25DaGFuZ2VzKTtcbiAgICAodFZpZXcucHJlT3JkZXJDaGVja0hvb2tzIHx8ICh0Vmlldy5wcmVPcmRlckNoZWNrSG9va3MgPSBbXSkpLnB1c2goZGlyZWN0aXZlSW5kZXgsIG9uQ2hhbmdlcyk7XG4gIH1cblxuICBpZiAob25Jbml0KSB7XG4gICAgKHRWaWV3LnByZU9yZGVySG9va3MgfHwgKHRWaWV3LnByZU9yZGVySG9va3MgPSBbXSkpLnB1c2goLWRpcmVjdGl2ZUluZGV4LCBvbkluaXQpO1xuICB9XG5cbiAgaWYgKGRvQ2hlY2spIHtcbiAgICAodFZpZXcucHJlT3JkZXJIb29rcyB8fCAodFZpZXcucHJlT3JkZXJIb29rcyA9IFtdKSkucHVzaChkaXJlY3RpdmVJbmRleCwgZG9DaGVjayk7XG4gICAgKHRWaWV3LnByZU9yZGVyQ2hlY2tIb29rcyB8fCAodFZpZXcucHJlT3JkZXJDaGVja0hvb2tzID0gW10pKS5wdXNoKGRpcmVjdGl2ZUluZGV4LCBkb0NoZWNrKTtcbiAgfVxufVxuXG4vKipcbiAqXG4gKiBMb29wcyB0aHJvdWdoIHRoZSBkaXJlY3RpdmVzIG9uIHRoZSBwcm92aWRlZCBgdE5vZGVgIGFuZCBxdWV1ZXMgaG9va3MgdG8gYmVcbiAqIHJ1biB0aGF0IGFyZSBub3QgaW5pdGlhbGl6YXRpb24gaG9va3MuXG4gKlxuICogU2hvdWxkIGJlIGV4ZWN1dGVkIGR1cmluZyBgZWxlbWVudEVuZCgpYCBhbmQgc2ltaWxhciB0b1xuICogcHJlc2VydmUgaG9vayBleGVjdXRpb24gb3JkZXIuIENvbnRlbnQsIHZpZXcsIGFuZCBkZXN0cm95IGhvb2tzIGZvciBwcm9qZWN0ZWRcbiAqIGNvbXBvbmVudHMgYW5kIGRpcmVjdGl2ZXMgbXVzdCBiZSBjYWxsZWQgKmJlZm9yZSogdGhlaXIgaG9zdHMuXG4gKlxuICogU2V0cyB1cCB0aGUgY29udGVudCwgdmlldywgYW5kIGRlc3Ryb3kgaG9va3Mgb24gdGhlIHByb3ZpZGVkIGB0Vmlld2AsXG4gKiBzZWUge0BsaW5rIEhvb2tEYXRhfSBmb3IgZGV0YWlscyBhYm91dCB0aGUgZGF0YSBzdHJ1Y3R1cmUuXG4gKlxuICogTk9URTogVGhpcyBkb2VzIG5vdCBzZXQgdXAgYG9uQ2hhbmdlc2AsIGBvbkluaXRgIG9yIGBkb0NoZWNrYCwgdGhvc2UgYXJlIHNldCB1cFxuICogc2VwYXJhdGVseSBhdCBgZWxlbWVudFN0YXJ0YC5cbiAqXG4gKiBAcGFyYW0gdFZpZXcgVGhlIGN1cnJlbnQgVFZpZXdcbiAqIEBwYXJhbSB0Tm9kZSBUaGUgVE5vZGUgd2hvc2UgZGlyZWN0aXZlcyBhcmUgdG8gYmUgc2VhcmNoZWQgZm9yIGhvb2tzIHRvIHF1ZXVlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZWdpc3RlclBvc3RPcmRlckhvb2tzKHRWaWV3OiBUVmlldywgdE5vZGU6IFROb2RlKTogdm9pZCB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRGaXJzdFRlbXBsYXRlUGFzcyh0Vmlldyk7XG4gIC8vIEl0J3MgbmVjZXNzYXJ5IHRvIGxvb3AgdGhyb3VnaCB0aGUgZGlyZWN0aXZlcyBhdCBlbGVtZW50RW5kKCkgKHJhdGhlciB0aGFuIHByb2Nlc3NpbmcgaW5cbiAgLy8gZGlyZWN0aXZlQ3JlYXRlKSBzbyB3ZSBjYW4gcHJlc2VydmUgdGhlIGN1cnJlbnQgaG9vayBvcmRlci4gQ29udGVudCwgdmlldywgYW5kIGRlc3Ryb3lcbiAgLy8gaG9va3MgZm9yIHByb2plY3RlZCBjb21wb25lbnRzIGFuZCBkaXJlY3RpdmVzIG11c3QgYmUgY2FsbGVkICpiZWZvcmUqIHRoZWlyIGhvc3RzLlxuICBmb3IgKGxldCBpID0gdE5vZGUuZGlyZWN0aXZlU3RhcnQsIGVuZCA9IHROb2RlLmRpcmVjdGl2ZUVuZDsgaSA8IGVuZDsgaSsrKSB7XG4gICAgY29uc3QgZGlyZWN0aXZlRGVmID0gdFZpZXcuZGF0YVtpXSBhcyBEaXJlY3RpdmVEZWY8YW55PjtcbiAgICBpZiAoZGlyZWN0aXZlRGVmLmFmdGVyQ29udGVudEluaXQpIHtcbiAgICAgICh0Vmlldy5jb250ZW50SG9va3MgfHwgKHRWaWV3LmNvbnRlbnRIb29rcyA9IFtdKSkucHVzaCgtaSwgZGlyZWN0aXZlRGVmLmFmdGVyQ29udGVudEluaXQpO1xuICAgIH1cblxuICAgIGlmIChkaXJlY3RpdmVEZWYuYWZ0ZXJDb250ZW50Q2hlY2tlZCkge1xuICAgICAgKHRWaWV3LmNvbnRlbnRIb29rcyB8fCAodFZpZXcuY29udGVudEhvb2tzID0gW10pKS5wdXNoKGksIGRpcmVjdGl2ZURlZi5hZnRlckNvbnRlbnRDaGVja2VkKTtcbiAgICAgICh0Vmlldy5jb250ZW50Q2hlY2tIb29rcyB8fCAodFZpZXcuY29udGVudENoZWNrSG9va3MgPSBbXG4gICAgICAgXSkpLnB1c2goaSwgZGlyZWN0aXZlRGVmLmFmdGVyQ29udGVudENoZWNrZWQpO1xuICAgIH1cblxuICAgIGlmIChkaXJlY3RpdmVEZWYuYWZ0ZXJWaWV3SW5pdCkge1xuICAgICAgKHRWaWV3LnZpZXdIb29rcyB8fCAodFZpZXcudmlld0hvb2tzID0gW10pKS5wdXNoKC1pLCBkaXJlY3RpdmVEZWYuYWZ0ZXJWaWV3SW5pdCk7XG4gICAgfVxuXG4gICAgaWYgKGRpcmVjdGl2ZURlZi5hZnRlclZpZXdDaGVja2VkKSB7XG4gICAgICAodFZpZXcudmlld0hvb2tzIHx8ICh0Vmlldy52aWV3SG9va3MgPSBbXSkpLnB1c2goaSwgZGlyZWN0aXZlRGVmLmFmdGVyVmlld0NoZWNrZWQpO1xuICAgICAgKHRWaWV3LnZpZXdDaGVja0hvb2tzIHx8ICh0Vmlldy52aWV3Q2hlY2tIb29rcyA9IFtdKSkucHVzaChpLCBkaXJlY3RpdmVEZWYuYWZ0ZXJWaWV3Q2hlY2tlZCk7XG4gICAgfVxuXG4gICAgaWYgKGRpcmVjdGl2ZURlZi5vbkRlc3Ryb3kgIT0gbnVsbCkge1xuICAgICAgKHRWaWV3LmRlc3Ryb3lIb29rcyB8fCAodFZpZXcuZGVzdHJveUhvb2tzID0gW10pKS5wdXNoKGksIGRpcmVjdGl2ZURlZi5vbkRlc3Ryb3kpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEV4ZWN1dGluZyBob29rcyByZXF1aXJlcyBjb21wbGV4IGxvZ2ljIGFzIHdlIG5lZWQgdG8gZGVhbCB3aXRoIDIgY29uc3RyYWludHMuXG4gKlxuICogMS4gSW5pdCBob29rcyAobmdPbkluaXQsIG5nQWZ0ZXJDb250ZW50SW5pdCwgbmdBZnRlclZpZXdJbml0KSBtdXN0IGFsbCBiZSBleGVjdXRlZCBvbmNlIGFuZCBvbmx5XG4gKiBvbmNlLCBhY3Jvc3MgbWFueSBjaGFuZ2UgZGV0ZWN0aW9uIGN5Y2xlcy4gVGhpcyBtdXN0IGJlIHRydWUgZXZlbiBpZiBzb21lIGhvb2tzIHRocm93LCBvciBpZlxuICogc29tZSByZWN1cnNpdmVseSB0cmlnZ2VyIGEgY2hhbmdlIGRldGVjdGlvbiBjeWNsZS5cbiAqIFRvIHNvbHZlIHRoYXQsIGl0IGlzIHJlcXVpcmVkIHRvIHRyYWNrIHRoZSBzdGF0ZSBvZiB0aGUgZXhlY3V0aW9uIG9mIHRoZXNlIGluaXQgaG9va3MuXG4gKiBUaGlzIGlzIGRvbmUgYnkgc3RvcmluZyBhbmQgbWFpbnRhaW5pbmcgZmxhZ3MgaW4gdGhlIHZpZXc6IHRoZSB7QGxpbmsgSW5pdFBoYXNlU3RhdGV9LFxuICogYW5kIHRoZSBpbmRleCB3aXRoaW4gdGhhdCBwaGFzZS4gVGhleSBjYW4gYmUgc2VlbiBhcyBhIGN1cnNvciBpbiB0aGUgZm9sbG93aW5nIHN0cnVjdHVyZTpcbiAqIFtbb25Jbml0MSwgb25Jbml0Ml0sIFthZnRlckNvbnRlbnRJbml0MV0sIFthZnRlclZpZXdJbml0MSwgYWZ0ZXJWaWV3SW5pdDIsIGFmdGVyVmlld0luaXQzXV1cbiAqIFRoZXkgYXJlIGFyZSBzdG9yZWQgYXMgZmxhZ3MgaW4gTFZpZXdbRkxBR1NdLlxuICpcbiAqIDIuIFByZS1vcmRlciBob29rcyBjYW4gYmUgZXhlY3V0ZWQgaW4gYmF0Y2hlcywgYmVjYXVzZSBvZiB0aGUgc2VsZWN0IGluc3RydWN0aW9uLlxuICogVG8gYmUgYWJsZSB0byBwYXVzZSBhbmQgcmVzdW1lIHRoZWlyIGV4ZWN1dGlvbiwgd2UgYWxzbyBuZWVkIHNvbWUgc3RhdGUgYWJvdXQgdGhlIGhvb2sncyBhcnJheVxuICogdGhhdCBpcyBiZWluZyBwcm9jZXNzZWQ6XG4gKiAtIHRoZSBpbmRleCBvZiB0aGUgbmV4dCBob29rIHRvIGJlIGV4ZWN1dGVkXG4gKiAtIHRoZSBudW1iZXIgb2YgaW5pdCBob29rcyBhbHJlYWR5IGZvdW5kIGluIHRoZSBwcm9jZXNzZWQgcGFydCBvZiB0aGUgIGFycmF5XG4gKiBUaGV5IGFyZSBhcmUgc3RvcmVkIGFzIGZsYWdzIGluIExWaWV3W1BSRU9SREVSX0hPT0tfRkxBR1NdLlxuICovXG5cblxuLyoqXG4gKiBFeGVjdXRlcyBwcmUtb3JkZXIgY2hlY2sgaG9va3MgKCBPbkNoYW5nZXMsIERvQ2hhbmdlcykgZ2l2ZW4gYSB2aWV3IHdoZXJlIGFsbCB0aGUgaW5pdCBob29rcyB3ZXJlXG4gKiBleGVjdXRlZCBvbmNlLiBUaGlzIGlzIGEgbGlnaHQgdmVyc2lvbiBvZiBleGVjdXRlSW5pdEFuZENoZWNrUHJlT3JkZXJIb29rcyB3aGVyZSB3ZSBjYW4gc2tpcCByZWFkXG4gKiAvIHdyaXRlIG9mIHRoZSBpbml0LWhvb2tzIHJlbGF0ZWQgZmxhZ3MuXG4gKiBAcGFyYW0gbFZpZXcgVGhlIExWaWV3IHdoZXJlIGhvb2tzIGFyZSBkZWZpbmVkXG4gKiBAcGFyYW0gaG9va3MgSG9va3MgdG8gYmUgcnVuXG4gKiBAcGFyYW0gbm9kZUluZGV4IDMgY2FzZXMgZGVwZW5kaW5nIG9uIHRoZSB2YWx1ZTpcbiAqIC0gdW5kZWZpbmVkOiBhbGwgaG9va3MgZnJvbSB0aGUgYXJyYXkgc2hvdWxkIGJlIGV4ZWN1dGVkIChwb3N0LW9yZGVyIGNhc2UpXG4gKiAtIG51bGw6IGV4ZWN1dGUgaG9va3Mgb25seSBmcm9tIHRoZSBzYXZlZCBpbmRleCB1bnRpbCB0aGUgZW5kIG9mIHRoZSBhcnJheSAocHJlLW9yZGVyIGNhc2UsIHdoZW5cbiAqIGZsdXNoaW5nIHRoZSByZW1haW5pbmcgaG9va3MpXG4gKiAtIG51bWJlcjogZXhlY3V0ZSBob29rcyBvbmx5IGZyb20gdGhlIHNhdmVkIGluZGV4IHVudGlsIHRoYXQgbm9kZSBpbmRleCBleGNsdXNpdmUgKHByZS1vcmRlclxuICogY2FzZSwgd2hlbiBleGVjdXRpbmcgc2VsZWN0KG51bWJlcikpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBleGVjdXRlQ2hlY2tIb29rcyhsVmlldzogTFZpZXcsIGhvb2tzOiBIb29rRGF0YSwgbm9kZUluZGV4PzogbnVtYmVyIHwgbnVsbCkge1xuICBjYWxsSG9va3MobFZpZXcsIGhvb2tzLCBJbml0UGhhc2VTdGF0ZS5Jbml0UGhhc2VDb21wbGV0ZWQsIG5vZGVJbmRleCk7XG59XG5cbi8qKlxuICogRXhlY3V0ZXMgcG9zdC1vcmRlciBpbml0IGFuZCBjaGVjayBob29rcyAob25lIG9mIEFmdGVyQ29udGVudEluaXQsIEFmdGVyQ29udGVudENoZWNrZWQsXG4gKiBBZnRlclZpZXdJbml0LCBBZnRlclZpZXdDaGVja2VkKSBnaXZlbiBhIHZpZXcgd2hlcmUgdGhlcmUgYXJlIHBlbmRpbmcgaW5pdCBob29rcyB0byBiZSBleGVjdXRlZC5cbiAqIEBwYXJhbSBsVmlldyBUaGUgTFZpZXcgd2hlcmUgaG9va3MgYXJlIGRlZmluZWRcbiAqIEBwYXJhbSBob29rcyBIb29rcyB0byBiZSBydW5cbiAqIEBwYXJhbSBpbml0UGhhc2UgQSBwaGFzZSBmb3Igd2hpY2ggaG9va3Mgc2hvdWxkIGJlIHJ1blxuICogQHBhcmFtIG5vZGVJbmRleCAzIGNhc2VzIGRlcGVuZGluZyBvbiB0aGUgdmFsdWU6XG4gKiAtIHVuZGVmaW5lZDogYWxsIGhvb2tzIGZyb20gdGhlIGFycmF5IHNob3VsZCBiZSBleGVjdXRlZCAocG9zdC1vcmRlciBjYXNlKVxuICogLSBudWxsOiBleGVjdXRlIGhvb2tzIG9ubHkgZnJvbSB0aGUgc2F2ZWQgaW5kZXggdW50aWwgdGhlIGVuZCBvZiB0aGUgYXJyYXkgKHByZS1vcmRlciBjYXNlLCB3aGVuXG4gKiBmbHVzaGluZyB0aGUgcmVtYWluaW5nIGhvb2tzKVxuICogLSBudW1iZXI6IGV4ZWN1dGUgaG9va3Mgb25seSBmcm9tIHRoZSBzYXZlZCBpbmRleCB1bnRpbCB0aGF0IG5vZGUgaW5kZXggZXhjbHVzaXZlIChwcmUtb3JkZXJcbiAqIGNhc2UsIHdoZW4gZXhlY3V0aW5nIHNlbGVjdChudW1iZXIpKVxuICovXG5leHBvcnQgZnVuY3Rpb24gZXhlY3V0ZUluaXRBbmRDaGVja0hvb2tzKFxuICAgIGxWaWV3OiBMVmlldywgaG9va3M6IEhvb2tEYXRhLCBpbml0UGhhc2U6IEluaXRQaGFzZVN0YXRlLCBub2RlSW5kZXg/OiBudW1iZXIgfCBudWxsKSB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb3RFcXVhbChcbiAgICAgICAgICAgICAgICAgICBpbml0UGhhc2UsIEluaXRQaGFzZVN0YXRlLkluaXRQaGFzZUNvbXBsZXRlZCxcbiAgICAgICAgICAgICAgICAgICAnSW5pdCBwcmUtb3JkZXIgaG9va3Mgc2hvdWxkIG5vdCBiZSBjYWxsZWQgbW9yZSB0aGFuIG9uY2UnKTtcbiAgaWYgKChsVmlld1tGTEFHU10gJiBMVmlld0ZsYWdzLkluaXRQaGFzZVN0YXRlTWFzaykgPT09IGluaXRQaGFzZSkge1xuICAgIGNhbGxIb29rcyhsVmlldywgaG9va3MsIGluaXRQaGFzZSwgbm9kZUluZGV4KTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gaW5jcmVtZW50SW5pdFBoYXNlRmxhZ3MobFZpZXc6IExWaWV3LCBpbml0UGhhc2U6IEluaXRQaGFzZVN0YXRlKTogdm9pZCB7XG4gIG5nRGV2TW9kZSAmJlxuICAgICAgYXNzZXJ0Tm90RXF1YWwoXG4gICAgICAgICAgaW5pdFBoYXNlLCBJbml0UGhhc2VTdGF0ZS5Jbml0UGhhc2VDb21wbGV0ZWQsXG4gICAgICAgICAgJ0luaXQgaG9va3MgcGhhc2Ugc2hvdWxkIG5vdCBiZSBpbmNyZW1lbnRlZCBhZnRlciBhbGwgaW5pdCBob29rcyBoYXZlIGJlZW4gcnVuLicpO1xuICBsZXQgZmxhZ3MgPSBsVmlld1tGTEFHU107XG4gIGlmICgoZmxhZ3MgJiBMVmlld0ZsYWdzLkluaXRQaGFzZVN0YXRlTWFzaykgPT09IGluaXRQaGFzZSkge1xuICAgIGZsYWdzICY9IExWaWV3RmxhZ3MuSW5kZXhXaXRoaW5Jbml0UGhhc2VSZXNldDtcbiAgICBmbGFncyArPSBMVmlld0ZsYWdzLkluaXRQaGFzZVN0YXRlSW5jcmVtZW50ZXI7XG4gICAgbFZpZXdbRkxBR1NdID0gZmxhZ3M7XG4gIH1cbn1cblxuLyoqXG4gKiBDYWxscyBsaWZlY3ljbGUgaG9va3Mgd2l0aCB0aGVpciBjb250ZXh0cywgc2tpcHBpbmcgaW5pdCBob29rcyBpZiBpdCdzIG5vdFxuICogdGhlIGZpcnN0IExWaWV3IHBhc3NcbiAqXG4gKiBAcGFyYW0gY3VycmVudFZpZXcgVGhlIGN1cnJlbnQgdmlld1xuICogQHBhcmFtIGFyciBUaGUgYXJyYXkgaW4gd2hpY2ggdGhlIGhvb2tzIGFyZSBmb3VuZFxuICogQHBhcmFtIGluaXRQaGFzZVN0YXRlIHRoZSBjdXJyZW50IHN0YXRlIG9mIHRoZSBpbml0IHBoYXNlXG4gKiBAcGFyYW0gY3VycmVudE5vZGVJbmRleCAzIGNhc2VzIGRlcGVuZGluZyBvbiB0aGUgdmFsdWU6XG4gKiAtIHVuZGVmaW5lZDogYWxsIGhvb2tzIGZyb20gdGhlIGFycmF5IHNob3VsZCBiZSBleGVjdXRlZCAocG9zdC1vcmRlciBjYXNlKVxuICogLSBudWxsOiBleGVjdXRlIGhvb2tzIG9ubHkgZnJvbSB0aGUgc2F2ZWQgaW5kZXggdW50aWwgdGhlIGVuZCBvZiB0aGUgYXJyYXkgKHByZS1vcmRlciBjYXNlLCB3aGVuXG4gKiBmbHVzaGluZyB0aGUgcmVtYWluaW5nIGhvb2tzKVxuICogLSBudW1iZXI6IGV4ZWN1dGUgaG9va3Mgb25seSBmcm9tIHRoZSBzYXZlZCBpbmRleCB1bnRpbCB0aGF0IG5vZGUgaW5kZXggZXhjbHVzaXZlIChwcmUtb3JkZXJcbiAqIGNhc2UsIHdoZW4gZXhlY3V0aW5nIHNlbGVjdChudW1iZXIpKVxuICovXG5mdW5jdGlvbiBjYWxsSG9va3MoXG4gICAgY3VycmVudFZpZXc6IExWaWV3LCBhcnI6IEhvb2tEYXRhLCBpbml0UGhhc2U6IEluaXRQaGFzZVN0YXRlLFxuICAgIGN1cnJlbnROb2RlSW5kZXg6IG51bWJlciB8IG51bGwgfCB1bmRlZmluZWQpOiB2b2lkIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEVxdWFsKFxuICAgICAgICAgICAgICAgICAgIGdldENoZWNrTm9DaGFuZ2VzTW9kZSgpLCBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAnSG9va3Mgc2hvdWxkIG5ldmVyIGJlIHJ1biBpbiB0aGUgY2hlY2sgbm8gY2hhbmdlcyBtb2RlLicpO1xuICBjb25zdCBzdGFydEluZGV4ID0gY3VycmVudE5vZGVJbmRleCAhPT0gdW5kZWZpbmVkID9cbiAgICAgIChjdXJyZW50Vmlld1tQUkVPUkRFUl9IT09LX0ZMQUdTXSAmIFByZU9yZGVySG9va0ZsYWdzLkluZGV4T2ZUaGVOZXh0UHJlT3JkZXJIb29rTWFza01hc2spIDpcbiAgICAgIDA7XG4gIGNvbnN0IG5vZGVJbmRleExpbWl0ID0gY3VycmVudE5vZGVJbmRleCAhPSBudWxsID8gY3VycmVudE5vZGVJbmRleCA6IC0xO1xuICBsZXQgbGFzdE5vZGVJbmRleEZvdW5kID0gMDtcbiAgZm9yIChsZXQgaSA9IHN0YXJ0SW5kZXg7IGkgPCBhcnIubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBob29rID0gYXJyW2kgKyAxXSBhcygpID0+IHZvaWQ7XG4gICAgaWYgKHR5cGVvZiBob29rID09PSAnbnVtYmVyJykge1xuICAgICAgbGFzdE5vZGVJbmRleEZvdW5kID0gYXJyW2ldIGFzIG51bWJlcjtcbiAgICAgIGlmIChjdXJyZW50Tm9kZUluZGV4ICE9IG51bGwgJiYgbGFzdE5vZGVJbmRleEZvdW5kID49IGN1cnJlbnROb2RlSW5kZXgpIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IGlzSW5pdEhvb2sgPSBhcnJbaV0gPCAwO1xuICAgICAgaWYgKGlzSW5pdEhvb2spXG4gICAgICAgIGN1cnJlbnRWaWV3W1BSRU9SREVSX0hPT0tfRkxBR1NdICs9IFByZU9yZGVySG9va0ZsYWdzLk51bWJlck9mSW5pdEhvb2tzQ2FsbGVkSW5jcmVtZW50ZXI7XG4gICAgICBpZiAobGFzdE5vZGVJbmRleEZvdW5kIDwgbm9kZUluZGV4TGltaXQgfHwgbm9kZUluZGV4TGltaXQgPT0gLTEpIHtcbiAgICAgICAgY2FsbEhvb2soY3VycmVudFZpZXcsIGluaXRQaGFzZSwgYXJyLCBpKTtcbiAgICAgICAgY3VycmVudFZpZXdbUFJFT1JERVJfSE9PS19GTEFHU10gPVxuICAgICAgICAgICAgKGN1cnJlbnRWaWV3W1BSRU9SREVSX0hPT0tfRkxBR1NdICYgUHJlT3JkZXJIb29rRmxhZ3MuTnVtYmVyT2ZJbml0SG9va3NDYWxsZWRNYXNrKSArIGkgK1xuICAgICAgICAgICAgMjtcbiAgICAgIH1cbiAgICAgIGkrKztcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBFeGVjdXRlIG9uZSBob29rIGFnYWluc3QgdGhlIGN1cnJlbnQgYExWaWV3YC5cbiAqXG4gKiBAcGFyYW0gY3VycmVudFZpZXcgVGhlIGN1cnJlbnQgdmlld1xuICogQHBhcmFtIGluaXRQaGFzZVN0YXRlIHRoZSBjdXJyZW50IHN0YXRlIG9mIHRoZSBpbml0IHBoYXNlXG4gKiBAcGFyYW0gYXJyIFRoZSBhcnJheSBpbiB3aGljaCB0aGUgaG9va3MgYXJlIGZvdW5kXG4gKiBAcGFyYW0gaSBUaGUgY3VycmVudCBpbmRleCB3aXRoaW4gdGhlIGhvb2sgZGF0YSBhcnJheVxuICovXG5mdW5jdGlvbiBjYWxsSG9vayhjdXJyZW50VmlldzogTFZpZXcsIGluaXRQaGFzZTogSW5pdFBoYXNlU3RhdGUsIGFycjogSG9va0RhdGEsIGk6IG51bWJlcikge1xuICBjb25zdCBpc0luaXRIb29rID0gYXJyW2ldIDwgMDtcbiAgY29uc3QgaG9vayA9IGFycltpICsgMV0gYXMoKSA9PiB2b2lkO1xuICBjb25zdCBkaXJlY3RpdmVJbmRleCA9IGlzSW5pdEhvb2sgPyAtYXJyW2ldIDogYXJyW2ldIGFzIG51bWJlcjtcbiAgY29uc3QgZGlyZWN0aXZlID0gY3VycmVudFZpZXdbZGlyZWN0aXZlSW5kZXhdO1xuICBpZiAoaXNJbml0SG9vaykge1xuICAgIGNvbnN0IGluZGV4V2l0aGludEluaXRQaGFzZSA9IGN1cnJlbnRWaWV3W0ZMQUdTXSA+PiBMVmlld0ZsYWdzLkluZGV4V2l0aGluSW5pdFBoYXNlU2hpZnQ7XG4gICAgLy8gVGhlIGluaXQgcGhhc2Ugc3RhdGUgbXVzdCBiZSBhbHdheXMgY2hlY2tlZCBoZXJlIGFzIGl0IG1heSBoYXZlIGJlZW4gcmVjdXJzaXZlbHlcbiAgICAvLyB1cGRhdGVkXG4gICAgaWYgKGluZGV4V2l0aGludEluaXRQaGFzZSA8XG4gICAgICAgICAgICAoY3VycmVudFZpZXdbUFJFT1JERVJfSE9PS19GTEFHU10gPj4gUHJlT3JkZXJIb29rRmxhZ3MuTnVtYmVyT2ZJbml0SG9va3NDYWxsZWRTaGlmdCkgJiZcbiAgICAgICAgKGN1cnJlbnRWaWV3W0ZMQUdTXSAmIExWaWV3RmxhZ3MuSW5pdFBoYXNlU3RhdGVNYXNrKSA9PT0gaW5pdFBoYXNlKSB7XG4gICAgICBjdXJyZW50Vmlld1tGTEFHU10gKz0gTFZpZXdGbGFncy5JbmRleFdpdGhpbkluaXRQaGFzZUluY3JlbWVudGVyO1xuICAgICAgaG9vay5jYWxsKGRpcmVjdGl2ZSk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGhvb2suY2FsbChkaXJlY3RpdmUpO1xuICB9XG59XG4iXX0=