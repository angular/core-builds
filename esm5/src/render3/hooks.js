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
 * see {@link HookData} for details about the data structure.
 *
 * @param directiveIndex The index of the directive in LView
 * @param directiveDef The definition containing the hooks to setup in tView
 * @param tView The current TView
 * @param nodeIndex The index of the node to which the directive is attached
 * @param initialPreOrderHooksLength the number of pre-order hooks already registered before the
 * current process, used to know if the node index has to be added to the array. If it is -1,
 * the node index is never added.
 * @param initialPreOrderCheckHooksLength same as previous for pre-order check hooks
 */
export function registerPreOrderHooks(directiveIndex, directiveDef, tView, nodeIndex, initialPreOrderHooksLength, initialPreOrderCheckHooksLength) {
    ngDevMode && assertFirstTemplatePass(tView);
    var onChanges = directiveDef.onChanges, onInit = directiveDef.onInit, doCheck = directiveDef.doCheck;
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
 * see {@link HookData} for details about the data structure.
 *
 * NOTE: This does not set up `onChanges`, `onInit` or `doCheck`, those are set up
 * separately at `elementStart`.
 *
 * @param tView The current TView
 * @param tNode The TNode whose directives are to be searched for hooks to queue
 */
export function registerPostOrderHooks(tView, tNode) {
    ngDevMode && assertFirstTemplatePass(tView);
    // It's necessary to loop through the directives at elementEnd() (rather than processing in
    // directiveCreate) so we can preserve the current hook order. Content, view, and destroy
    // hooks for projected components and directives must be called *before* their hosts.
    for (var i = tNode.directiveStart, end = tNode.directiveEnd; i < end; i++) {
        var directiveDef = tView.data[i];
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
 * @param lView The LView where hooks are defined
 * @param hooks Hooks to be run
 * @param nodeIndex 3 cases depending on the value:
 * - undefined: all hooks from the array should be executed (post-order case)
 * - null: execute hooks only from the saved index until the end of the array (pre-order case, when
 * flushing the remaining hooks)
 * - number: execute hooks only from the saved index until that node index exclusive (pre-order
 * case, when executing select(number))
 */
export function executeCheckHooks(lView, hooks, nodeIndex) {
    callHooks(lView, hooks, 3 /* InitPhaseCompleted */, nodeIndex);
}
/**
 * Executes post-order init and check hooks (one of AfterContentInit, AfterContentChecked,
 * AfterViewInit, AfterViewChecked) given a view where there are pending init hooks to be executed.
 * @param lView The LView where hooks are defined
 * @param hooks Hooks to be run
 * @param initPhase A phase for which hooks should be run
 * @param nodeIndex 3 cases depending on the value:
 * - undefined: all hooks from the array should be executed (post-order case)
 * - null: execute hooks only from the saved index until the end of the array (pre-order case, when
 * flushing the remaining hooks)
 * - number: execute hooks only from the saved index until that node index exclusive (pre-order
 * case, when executing select(number))
 */
export function executeInitAndCheckHooks(lView, hooks, initPhase, nodeIndex) {
    ngDevMode && assertNotEqual(initPhase, 3 /* InitPhaseCompleted */, 'Init pre-order hooks should not be called more than once');
    if ((lView[FLAGS] & 3 /* InitPhaseStateMask */) === initPhase) {
        callHooks(lView, hooks, initPhase, nodeIndex);
    }
}
export function incrementInitPhaseFlags(lView, initPhase) {
    ngDevMode &&
        assertNotEqual(initPhase, 3 /* InitPhaseCompleted */, 'Init hooks phase should not be incremented after all init hooks have been run.');
    var flags = lView[FLAGS];
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
 * @param currentView The current view
 * @param arr The array in which the hooks are found
 * @param initPhaseState the current state of the init phase
 * @param currentNodeIndex 3 cases depending on the value:
 * - undefined: all hooks from the array should be executed (post-order case)
 * - null: execute hooks only from the saved index until the end of the array (pre-order case, when
 * flushing the remaining hooks)
 * - number: execute hooks only from the saved index until that node index exclusive (pre-order
 * case, when executing select(number))
 */
function callHooks(currentView, arr, initPhase, currentNodeIndex) {
    ngDevMode && assertEqual(getCheckNoChangesMode(), false, 'Hooks should never be run in the check no changes mode.');
    var startIndex = currentNodeIndex !== undefined ?
        (currentView[PREORDER_HOOK_FLAGS] & 65535 /* IndexOfTheNextPreOrderHookMaskMask */) :
        0;
    var nodeIndexLimit = currentNodeIndex != null ? currentNodeIndex : -1;
    var lastNodeIndexFound = 0;
    for (var i = startIndex; i < arr.length; i++) {
        var hook = arr[i + 1];
        if (typeof hook === 'number') {
            lastNodeIndexFound = arr[i];
            if (currentNodeIndex != null && lastNodeIndexFound >= currentNodeIndex) {
                break;
            }
        }
        else {
            var isInitHook = arr[i] < 0;
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
 * @param currentView The current view
 * @param initPhaseState the current state of the init phase
 * @param arr The array in which the hooks are found
 * @param i The current index within the hook data array
 */
function callHook(currentView, initPhase, arr, i) {
    var isInitHook = arr[i] < 0;
    var hook = arr[i + 1];
    var directiveIndex = isInitHook ? -arr[i] : arr[i];
    var directive = currentView[directiveIndex];
    if (isInitHook) {
        var indexWithintInitPhase = currentView[FLAGS] >> 10 /* IndexWithinInitPhaseShift */;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaG9va3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2hvb2tzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxXQUFXLEVBQUUsY0FBYyxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFFM0QsT0FBTyxFQUFDLHVCQUF1QixFQUFDLE1BQU0sVUFBVSxDQUFDO0FBR2pELE9BQU8sRUFBQyxLQUFLLEVBQStDLG1CQUFtQixFQUEyQixNQUFNLG1CQUFtQixDQUFDO0FBQ3BJLE9BQU8sRUFBQyxxQkFBcUIsRUFBQyxNQUFNLFNBQVMsQ0FBQztBQUk5Qzs7Ozs7Ozs7Ozs7Ozs7OztHQWdCRztBQUNILE1BQU0sVUFBVSxxQkFBcUIsQ0FDakMsY0FBc0IsRUFBRSxZQUErQixFQUFFLEtBQVksRUFBRSxTQUFpQixFQUN4RiwwQkFBa0MsRUFBRSwrQkFBdUM7SUFDN0UsU0FBUyxJQUFJLHVCQUF1QixDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ3JDLElBQUEsa0NBQVMsRUFBRSw0QkFBTSxFQUFFLDhCQUFPLENBQWlCO0lBQ2xELElBQUksMEJBQTBCLElBQUksQ0FBQztRQUMvQixDQUFDLENBQUMsS0FBSyxDQUFDLGFBQWEsSUFBSSwwQkFBMEIsS0FBSyxLQUFLLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQztRQUNuRixDQUFDLFNBQVMsSUFBSSxNQUFNLElBQUksT0FBTyxDQUFDLEVBQUU7UUFDcEMsQ0FBQyxLQUFLLENBQUMsYUFBYSxJQUFJLENBQUMsS0FBSyxDQUFDLGFBQWEsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztLQUNyRTtJQUVELElBQUksK0JBQStCLElBQUksQ0FBQztRQUNwQyxDQUFDLENBQUMsS0FBSyxDQUFDLGtCQUFrQjtZQUN6QiwrQkFBK0IsS0FB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QjtZQUNqQixDQUFDLFdBQVcsQ0FBQyxtQkFBbUIsQ0FBQyx5Q0FBa0QsQ0FBQztZQUN4RixDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsNkJBQWdDLENBQUMsS0FBSyxTQUFTLEVBQUU7WUFDdEUsV0FBVyxDQUFDLEtBQUssQ0FBQyw4Q0FBOEMsQ0FBQztZQUNqRSxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1NBQ3RCO0tBQ0Y7U0FBTTtRQUNMLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7S0FDdEI7QUFDSCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge2Fzc2VydEVxdWFsLCBhc3NlcnROb3RFcXVhbH0gZnJvbSAnLi4vdXRpbC9hc3NlcnQnO1xuXG5pbXBvcnQge2Fzc2VydEZpcnN0VGVtcGxhdGVQYXNzfSBmcm9tICcuL2Fzc2VydCc7XG5pbXBvcnQge0RpcmVjdGl2ZURlZn0gZnJvbSAnLi9pbnRlcmZhY2VzL2RlZmluaXRpb24nO1xuaW1wb3J0IHtUTm9kZX0gZnJvbSAnLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtGTEFHUywgSG9va0RhdGEsIEluaXRQaGFzZVN0YXRlLCBMVmlldywgTFZpZXdGbGFncywgUFJFT1JERVJfSE9PS19GTEFHUywgUHJlT3JkZXJIb29rRmxhZ3MsIFRWaWV3fSBmcm9tICcuL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2dldENoZWNrTm9DaGFuZ2VzTW9kZX0gZnJvbSAnLi9zdGF0ZSc7XG5cblxuXG4vKipcbiAqIEFkZHMgYWxsIGRpcmVjdGl2ZSBsaWZlY3ljbGUgaG9va3MgZnJvbSB0aGUgZ2l2ZW4gYERpcmVjdGl2ZURlZmAgdG8gdGhlIGdpdmVuIGBUVmlld2AuXG4gKlxuICogTXVzdCBiZSBydW4gKm9ubHkqIG9uIHRoZSBmaXJzdCB0ZW1wbGF0ZSBwYXNzLlxuICpcbiAqIFNldHMgdXAgdGhlIHByZS1vcmRlciBob29rcyBvbiB0aGUgcHJvdmlkZWQgYHRWaWV3YCxcbiAqIHNlZSB7QGxpbmsgSG9va0RhdGF9IGZvciBkZXRhaWxzIGFib3V0IHRoZSBkYXRhIHN0cnVjdHVyZS5cbiAqXG4gKiBAcGFyYW0gZGlyZWN0aXZlSW5kZXggVGhlIGluZGV4IG9mIHRoZSBkaXJlY3RpdmUgaW4gTFZpZXdcbiAqIEBwYXJhbSBkaXJlY3RpdmVEZWYgVGhlIGRlZmluaXRpb24gY29udGFpbmluZyB0aGUgaG9va3MgdG8gc2V0dXAgaW4gdFZpZXdcbiAqIEBwYXJhbSB0VmlldyBUaGUgY3VycmVudCBUVmlld1xuICogQHBhcmFtIG5vZGVJbmRleCBUaGUgaW5kZXggb2YgdGhlIG5vZGUgdG8gd2hpY2ggdGhlIGRpcmVjdGl2ZSBpcyBhdHRhY2hlZFxuICogQHBhcmFtIGluaXRpYWxQcmVPcmRlckhvb2tzTGVuZ3RoIHRoZSBudW1iZXIgb2YgcHJlLW9yZGVyIGhvb2tzIGFscmVhZHkgcmVnaXN0ZXJlZCBiZWZvcmUgdGhlXG4gKiBjdXJyZW50IHByb2Nlc3MsIHVzZWQgdG8ga25vdyBpZiB0aGUgbm9kZSBpbmRleCBoYXMgdG8gYmUgYWRkZWQgdG8gdGhlIGFycmF5LiBJZiBpdCBpcyAtMSxcbiAqIHRoZSBub2RlIGluZGV4IGlzIG5ldmVyIGFkZGVkLlxuICogQHBhcmFtIGluaXRpYWxQcmVPcmRlckNoZWNrSG9va3NMZW5ndGggc2FtZSBhcyBwcmV2aW91cyBmb3IgcHJlLW9yZGVyIGNoZWNrIGhvb2tzXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZWdpc3RlclByZU9yZGVySG9va3MoXG4gICAgZGlyZWN0aXZlSW5kZXg6IG51bWJlciwgZGlyZWN0aXZlRGVmOiBEaXJlY3RpdmVEZWY8YW55PiwgdFZpZXc6IFRWaWV3LCBub2RlSW5kZXg6IG51bWJlcixcbiAgICBpbml0aWFsUHJlT3JkZXJIb29rc0xlbmd0aDogbnVtYmVyLCBpbml0aWFsUHJlT3JkZXJDaGVja0hvb2tzTGVuZ3RoOiBudW1iZXIpOiB2b2lkIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEZpcnN0VGVtcGxhdGVQYXNzKHRWaWV3KTtcbiAgY29uc3Qge29uQ2hhbmdlcywgb25Jbml0LCBkb0NoZWNrfSA9IGRpcmVjdGl2ZURlZjtcbiAgaWYgKGluaXRpYWxQcmVPcmRlckhvb2tzTGVuZ3RoID49IDAgJiZcbiAgICAgICghdFZpZXcucHJlT3JkZXJIb29rcyB8fCBpbml0aWFsUHJlT3JkZXJIb29rc0xlbmd0aCA9PT0gdFZpZXcucHJlT3JkZXJIb29rcy5sZW5ndGgpICYmXG4gICAgICAob25DaGFuZ2VzIHx8IG9uSW5pdCB8fCBkb0NoZWNrKSkge1xuICAgICh0Vmlldy5wcmVPcmRlckhvb2tzIHx8ICh0Vmlldy5wcmVPcmRlckhvb2tzID0gW10pKS5wdXNoKG5vZGVJbmRleCk7XG4gIH1cblxuICBpZiAoaW5pdGlhbFByZU9yZGVyQ2hlY2tIb29rc0xlbmd0aCA+PSAwICYmXG4gICAgICAoIXRWaWV3LnByZU9yZGVyQ2hlY2tIb29rcyB8fFxuICAgICAgIGluaXRpYWxQcmVPcmRlckNoZWNrSG9va3NMZW5ndGggPT09IHRWaWV3LnByZU9yZGVyQ2hlY2tIb29rcy5sZW5ndGgpICYmXG4gICAgICAob25DaGFuZ2VzIHx8IGRvQ2hlY2spKSB7XG4gICAgKHRWaWV3LnByZU9yZGVyQ2hlY2tIb29rcyB8fCAodFZpZXcucHJlT3JkZXJDaGVja0hvb2tzID0gW10pKS5wdXNoKG5vZGVJbmRleCk7XG4gIH1cblxuICBpZiAob25DaGFuZ2VzKSB7XG4gICAgKHRWaWV3LnByZU9yZGVySG9va3MgfHwgKHRWaWV3LnByZU9yZGVySG9va3MgPSBbXSkpLnB1c2goZGlyZWN0aXZlSW5kZXgsIG9uQ2hhbmdlcyk7XG4gICAgKHRWaWV3LnByZU9yZGVyQ2hlY2tIb29rcyB8fCAodFZpZXcucHJlT3JkZXJDaGVja0hvb2tzID0gW10pKS5wdXNoKGRpcmVjdGl2ZUluZGV4LCBvbkNoYW5nZXMpO1xuICB9XG5cbiAgaWYgKG9uSW5pdCkge1xuICAgICh0Vmlldy5wcmVPcmRlckhvb2tzIHx8ICh0Vmlldy5wcmVPcmRlckhvb2tzID0gW10pKS5wdXNoKC1kaXJlY3RpdmVJbmRleCwgb25Jbml0KTtcbiAgfVxuXG4gIGlmIChkb0NoZWNrKSB7XG4gICAgKHRWaWV3LnByZU9yZGVySG9va3MgfHwgKHRWaWV3LnByZU9yZGVySG9va3MgPSBbXSkpLnB1c2goZGlyZWN0aXZlSW5kZXgsIGRvQ2hlY2spO1xuICAgICh0Vmlldy5wcmVPcmRlckNoZWNrSG9va3MgfHwgKHRWaWV3LnByZU9yZGVyQ2hlY2tIb29rcyA9IFtdKSkucHVzaChkaXJlY3RpdmVJbmRleCwgZG9DaGVjayk7XG4gIH1cbn1cblxuLyoqXG4gKlxuICogTG9vcHMgdGhyb3VnaCB0aGUgZGlyZWN0aXZlcyBvbiB0aGUgcHJvdmlkZWQgYHROb2RlYCBhbmQgcXVldWVzIGhvb2tzIHRvIGJlXG4gKiBydW4gdGhhdCBhcmUgbm90IGluaXRpYWxpemF0aW9uIGhvb2tzLlxuICpcbiAqIFNob3VsZCBiZSBleGVjdXRlZCBkdXJpbmcgYGVsZW1lbnRFbmQoKWAgYW5kIHNpbWlsYXIgdG9cbiAqIHByZXNlcnZlIGhvb2sgZXhlY3V0aW9uIG9yZGVyLiBDb250ZW50LCB2aWV3LCBhbmQgZGVzdHJveSBob29rcyBmb3IgcHJvamVjdGVkXG4gKiBjb21wb25lbnRzIGFuZCBkaXJlY3RpdmVzIG11c3QgYmUgY2FsbGVkICpiZWZvcmUqIHRoZWlyIGhvc3RzLlxuICpcbiAqIFNldHMgdXAgdGhlIGNvbnRlbnQsIHZpZXcsIGFuZCBkZXN0cm95IGhvb2tzIG9uIHRoZSBwcm92aWRlZCBgdFZpZXdgLFxuICogc2VlIHtAbGluayBIb29rRGF0YX0gZm9yIGRldGFpbHMgYWJvdXQgdGhlIGRhdGEgc3RydWN0dXJlLlxuICpcbiAqIE5PVEU6IFRoaXMgZG9lcyBub3Qgc2V0IHVwIGBvbkNoYW5nZXNgLCBgb25Jbml0YCBvciBgZG9DaGVja2AsIHRob3NlIGFyZSBzZXQgdXBcbiAqIHNlcGFyYXRlbHkgYXQgYGVsZW1lbnRTdGFydGAuXG4gKlxuICogQHBhcmFtIHRWaWV3IFRoZSBjdXJyZW50IFRWaWV3XG4gKiBAcGFyYW0gdE5vZGUgVGhlIFROb2RlIHdob3NlIGRpcmVjdGl2ZXMgYXJlIHRvIGJlIHNlYXJjaGVkIGZvciBob29rcyB0byBxdWV1ZVxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVnaXN0ZXJQb3N0T3JkZXJIb29rcyh0VmlldzogVFZpZXcsIHROb2RlOiBUTm9kZSk6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Rmlyc3RUZW1wbGF0ZVBhc3ModFZpZXcpO1xuICAvLyBJdCdzIG5lY2Vzc2FyeSB0byBsb29wIHRocm91Z2ggdGhlIGRpcmVjdGl2ZXMgYXQgZWxlbWVudEVuZCgpIChyYXRoZXIgdGhhbiBwcm9jZXNzaW5nIGluXG4gIC8vIGRpcmVjdGl2ZUNyZWF0ZSkgc28gd2UgY2FuIHByZXNlcnZlIHRoZSBjdXJyZW50IGhvb2sgb3JkZXIuIENvbnRlbnQsIHZpZXcsIGFuZCBkZXN0cm95XG4gIC8vIGhvb2tzIGZvciBwcm9qZWN0ZWQgY29tcG9uZW50cyBhbmQgZGlyZWN0aXZlcyBtdXN0IGJlIGNhbGxlZCAqYmVmb3JlKiB0aGVpciBob3N0cy5cbiAgZm9yIChsZXQgaSA9IHROb2RlLmRpcmVjdGl2ZVN0YXJ0LCBlbmQgPSB0Tm9kZS5kaXJlY3RpdmVFbmQ7IGkgPCBlbmQ7IGkrKykge1xuICAgIGNvbnN0IGRpcmVjdGl2ZURlZiA9IHRWaWV3LmRhdGFbaV0gYXMgRGlyZWN0aXZlRGVmPGFueT47XG4gICAgaWYgKGRpcmVjdGl2ZURlZi5hZnRlckNvbnRlbnRJbml0KSB7XG4gICAgICAodFZpZXcuY29udGVudEhvb2tzIHx8ICh0Vmlldy5jb250ZW50SG9va3MgPSBbXSkpLnB1c2goLWksIGRpcmVjdGl2ZURlZi5hZnRlckNvbnRlbnRJbml0KTtcbiAgICB9XG5cbiAgICBpZiAoZGlyZWN0aXZlRGVmLmFmdGVyQ29udGVudENoZWNrZWQpIHtcbiAgICAgICh0Vmlldy5jb250ZW50SG9va3MgfHwgKHRWaWV3LmNvbnRlbnRIb29rcyA9IFtdKSkucHVzaChpLCBkaXJlY3RpdmVEZWYuYWZ0ZXJDb250ZW50Q2hlY2tlZCk7XG4gICAgICAodFZpZXcuY29udGVudENoZWNrSG9va3MgfHwgKHRWaWV3LmNvbnRlbnRDaGVja0hvb2tzID0gW1xuICAgICAgIF0pKS5wdXNoKGksIGRpcmVjdGl2ZURlZi5hZnRlckNvbnRlbnRDaGVja2VkKTtcbiAgICB9XG5cbiAgICBpZiAoZGlyZWN0aXZlRGVmLmFmdGVyVmlld0luaXQpIHtcbiAgICAgICh0Vmlldy52aWV3SG9va3MgfHwgKHRWaWV3LnZpZXdIb29rcyA9IFtdKSkucHVzaCgtaSwgZGlyZWN0aXZlRGVmLmFmdGVyVmlld0luaXQpO1xuICAgIH1cblxuICAgIGlmIChkaXJlY3RpdmVEZWYuYWZ0ZXJWaWV3Q2hlY2tlZCkge1xuICAgICAgKHRWaWV3LnZpZXdIb29rcyB8fCAodFZpZXcudmlld0hvb2tzID0gW10pKS5wdXNoKGksIGRpcmVjdGl2ZURlZi5hZnRlclZpZXdDaGVja2VkKTtcbiAgICAgICh0Vmlldy52aWV3Q2hlY2tIb29rcyB8fCAodFZpZXcudmlld0NoZWNrSG9va3MgPSBbXSkpLnB1c2goaSwgZGlyZWN0aXZlRGVmLmFmdGVyVmlld0NoZWNrZWQpO1xuICAgIH1cblxuICAgIGlmIChkaXJlY3RpdmVEZWYub25EZXN0cm95ICE9IG51bGwpIHtcbiAgICAgICh0Vmlldy5kZXN0cm95SG9va3MgfHwgKHRWaWV3LmRlc3Ryb3lIb29rcyA9IFtdKSkucHVzaChpLCBkaXJlY3RpdmVEZWYub25EZXN0cm95KTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBFeGVjdXRpbmcgaG9va3MgcmVxdWlyZXMgY29tcGxleCBsb2dpYyBhcyB3ZSBuZWVkIHRvIGRlYWwgd2l0aCAyIGNvbnN0cmFpbnRzLlxuICpcbiAqIDEuIEluaXQgaG9va3MgKG5nT25Jbml0LCBuZ0FmdGVyQ29udGVudEluaXQsIG5nQWZ0ZXJWaWV3SW5pdCkgbXVzdCBhbGwgYmUgZXhlY3V0ZWQgb25jZSBhbmQgb25seVxuICogb25jZSwgYWNyb3NzIG1hbnkgY2hhbmdlIGRldGVjdGlvbiBjeWNsZXMuIFRoaXMgbXVzdCBiZSB0cnVlIGV2ZW4gaWYgc29tZSBob29rcyB0aHJvdywgb3IgaWZcbiAqIHNvbWUgcmVjdXJzaXZlbHkgdHJpZ2dlciBhIGNoYW5nZSBkZXRlY3Rpb24gY3ljbGUuXG4gKiBUbyBzb2x2ZSB0aGF0LCBpdCBpcyByZXF1aXJlZCB0byB0cmFjayB0aGUgc3RhdGUgb2YgdGhlIGV4ZWN1dGlvbiBvZiB0aGVzZSBpbml0IGhvb2tzLlxuICogVGhpcyBpcyBkb25lIGJ5IHN0b3JpbmcgYW5kIG1haW50YWluaW5nIGZsYWdzIGluIHRoZSB2aWV3OiB0aGUge0BsaW5rIEluaXRQaGFzZVN0YXRlfSxcbiAqIGFuZCB0aGUgaW5kZXggd2l0aGluIHRoYXQgcGhhc2UuIFRoZXkgY2FuIGJlIHNlZW4gYXMgYSBjdXJzb3IgaW4gdGhlIGZvbGxvd2luZyBzdHJ1Y3R1cmU6XG4gKiBbW29uSW5pdDEsIG9uSW5pdDJdLCBbYWZ0ZXJDb250ZW50SW5pdDFdLCBbYWZ0ZXJWaWV3SW5pdDEsIGFmdGVyVmlld0luaXQyLCBhZnRlclZpZXdJbml0M11dXG4gKiBUaGV5IGFyZSBhcmUgc3RvcmVkIGFzIGZsYWdzIGluIExWaWV3W0ZMQUdTXS5cbiAqXG4gKiAyLiBQcmUtb3JkZXIgaG9va3MgY2FuIGJlIGV4ZWN1dGVkIGluIGJhdGNoZXMsIGJlY2F1c2Ugb2YgdGhlIHNlbGVjdCBpbnN0cnVjdGlvbi5cbiAqIFRvIGJlIGFibGUgdG8gcGF1c2UgYW5kIHJlc3VtZSB0aGVpciBleGVjdXRpb24sIHdlIGFsc28gbmVlZCBzb21lIHN0YXRlIGFib3V0IHRoZSBob29rJ3MgYXJyYXlcbiAqIHRoYXQgaXMgYmVpbmcgcHJvY2Vzc2VkOlxuICogLSB0aGUgaW5kZXggb2YgdGhlIG5leHQgaG9vayB0byBiZSBleGVjdXRlZFxuICogLSB0aGUgbnVtYmVyIG9mIGluaXQgaG9va3MgYWxyZWFkeSBmb3VuZCBpbiB0aGUgcHJvY2Vzc2VkIHBhcnQgb2YgdGhlICBhcnJheVxuICogVGhleSBhcmUgYXJlIHN0b3JlZCBhcyBmbGFncyBpbiBMVmlld1tQUkVPUkRFUl9IT09LX0ZMQUdTXS5cbiAqL1xuXG5cbi8qKlxuICogRXhlY3V0ZXMgcHJlLW9yZGVyIGNoZWNrIGhvb2tzICggT25DaGFuZ2VzLCBEb0NoYW5nZXMpIGdpdmVuIGEgdmlldyB3aGVyZSBhbGwgdGhlIGluaXQgaG9va3Mgd2VyZVxuICogZXhlY3V0ZWQgb25jZS4gVGhpcyBpcyBhIGxpZ2h0IHZlcnNpb24gb2YgZXhlY3V0ZUluaXRBbmRDaGVja1ByZU9yZGVySG9va3Mgd2hlcmUgd2UgY2FuIHNraXAgcmVhZFxuICogLyB3cml0ZSBvZiB0aGUgaW5pdC1ob29rcyByZWxhdGVkIGZsYWdzLlxuICogQHBhcmFtIGxWaWV3IFRoZSBMVmlldyB3aGVyZSBob29rcyBhcmUgZGVmaW5lZFxuICogQHBhcmFtIGhvb2tzIEhvb2tzIHRvIGJlIHJ1blxuICogQHBhcmFtIG5vZGVJbmRleCAzIGNhc2VzIGRlcGVuZGluZyBvbiB0aGUgdmFsdWU6XG4gKiAtIHVuZGVmaW5lZDogYWxsIGhvb2tzIGZyb20gdGhlIGFycmF5IHNob3VsZCBiZSBleGVjdXRlZCAocG9zdC1vcmRlciBjYXNlKVxuICogLSBudWxsOiBleGVjdXRlIGhvb2tzIG9ubHkgZnJvbSB0aGUgc2F2ZWQgaW5kZXggdW50aWwgdGhlIGVuZCBvZiB0aGUgYXJyYXkgKHByZS1vcmRlciBjYXNlLCB3aGVuXG4gKiBmbHVzaGluZyB0aGUgcmVtYWluaW5nIGhvb2tzKVxuICogLSBudW1iZXI6IGV4ZWN1dGUgaG9va3Mgb25seSBmcm9tIHRoZSBzYXZlZCBpbmRleCB1bnRpbCB0aGF0IG5vZGUgaW5kZXggZXhjbHVzaXZlIChwcmUtb3JkZXJcbiAqIGNhc2UsIHdoZW4gZXhlY3V0aW5nIHNlbGVjdChudW1iZXIpKVxuICovXG5leHBvcnQgZnVuY3Rpb24gZXhlY3V0ZUNoZWNrSG9va3MobFZpZXc6IExWaWV3LCBob29rczogSG9va0RhdGEsIG5vZGVJbmRleD86IG51bWJlciB8IG51bGwpIHtcbiAgY2FsbEhvb2tzKGxWaWV3LCBob29rcywgSW5pdFBoYXNlU3RhdGUuSW5pdFBoYXNlQ29tcGxldGVkLCBub2RlSW5kZXgpO1xufVxuXG4vKipcbiAqIEV4ZWN1dGVzIHBvc3Qtb3JkZXIgaW5pdCBhbmQgY2hlY2sgaG9va3MgKG9uZSBvZiBBZnRlckNvbnRlbnRJbml0LCBBZnRlckNvbnRlbnRDaGVja2VkLFxuICogQWZ0ZXJWaWV3SW5pdCwgQWZ0ZXJWaWV3Q2hlY2tlZCkgZ2l2ZW4gYSB2aWV3IHdoZXJlIHRoZXJlIGFyZSBwZW5kaW5nIGluaXQgaG9va3MgdG8gYmUgZXhlY3V0ZWQuXG4gKiBAcGFyYW0gbFZpZXcgVGhlIExWaWV3IHdoZXJlIGhvb2tzIGFyZSBkZWZpbmVkXG4gKiBAcGFyYW0gaG9va3MgSG9va3MgdG8gYmUgcnVuXG4gKiBAcGFyYW0gaW5pdFBoYXNlIEEgcGhhc2UgZm9yIHdoaWNoIGhvb2tzIHNob3VsZCBiZSBydW5cbiAqIEBwYXJhbSBub2RlSW5kZXggMyBjYXNlcyBkZXBlbmRpbmcgb24gdGhlIHZhbHVlOlxuICogLSB1bmRlZmluZWQ6IGFsbCBob29rcyBmcm9tIHRoZSBhcnJheSBzaG91bGQgYmUgZXhlY3V0ZWQgKHBvc3Qtb3JkZXIgY2FzZSlcbiAqIC0gbnVsbDogZXhlY3V0ZSBob29rcyBvbmx5IGZyb20gdGhlIHNhdmVkIGluZGV4IHVudGlsIHRoZSBlbmQgb2YgdGhlIGFycmF5IChwcmUtb3JkZXIgY2FzZSwgd2hlblxuICogZmx1c2hpbmcgdGhlIHJlbWFpbmluZyBob29rcylcbiAqIC0gbnVtYmVyOiBleGVjdXRlIGhvb2tzIG9ubHkgZnJvbSB0aGUgc2F2ZWQgaW5kZXggdW50aWwgdGhhdCBub2RlIGluZGV4IGV4Y2x1c2l2ZSAocHJlLW9yZGVyXG4gKiBjYXNlLCB3aGVuIGV4ZWN1dGluZyBzZWxlY3QobnVtYmVyKSlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGV4ZWN1dGVJbml0QW5kQ2hlY2tIb29rcyhcbiAgICBsVmlldzogTFZpZXcsIGhvb2tzOiBIb29rRGF0YSwgaW5pdFBoYXNlOiBJbml0UGhhc2VTdGF0ZSwgbm9kZUluZGV4PzogbnVtYmVyIHwgbnVsbCkge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm90RXF1YWwoXG4gICAgICAgICAgICAgICAgICAgaW5pdFBoYXNlLCBJbml0UGhhc2VTdGF0ZS5Jbml0UGhhc2VDb21wbGV0ZWQsXG4gICAgICAgICAgICAgICAgICAgJ0luaXQgcHJlLW9yZGVyIGhvb2tzIHNob3VsZCBub3QgYmUgY2FsbGVkIG1vcmUgdGhhbiBvbmNlJyk7XG4gIGlmICgobFZpZXdbRkxBR1NdICYgTFZpZXdGbGFncy5Jbml0UGhhc2VTdGF0ZU1hc2spID09PSBpbml0UGhhc2UpIHtcbiAgICBjYWxsSG9va3MobFZpZXcsIGhvb2tzLCBpbml0UGhhc2UsIG5vZGVJbmRleCk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGluY3JlbWVudEluaXRQaGFzZUZsYWdzKGxWaWV3OiBMVmlldywgaW5pdFBoYXNlOiBJbml0UGhhc2VTdGF0ZSk6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiZcbiAgICAgIGFzc2VydE5vdEVxdWFsKFxuICAgICAgICAgIGluaXRQaGFzZSwgSW5pdFBoYXNlU3RhdGUuSW5pdFBoYXNlQ29tcGxldGVkLFxuICAgICAgICAgICdJbml0IGhvb2tzIHBoYXNlIHNob3VsZCBub3QgYmUgaW5jcmVtZW50ZWQgYWZ0ZXIgYWxsIGluaXQgaG9va3MgaGF2ZSBiZWVuIHJ1bi4nKTtcbiAgbGV0IGZsYWdzID0gbFZpZXdbRkxBR1NdO1xuICBpZiAoKGZsYWdzICYgTFZpZXdGbGFncy5Jbml0UGhhc2VTdGF0ZU1hc2spID09PSBpbml0UGhhc2UpIHtcbiAgICBmbGFncyAmPSBMVmlld0ZsYWdzLkluZGV4V2l0aGluSW5pdFBoYXNlUmVzZXQ7XG4gICAgZmxhZ3MgKz0gTFZpZXdGbGFncy5Jbml0UGhhc2VTdGF0ZUluY3JlbWVudGVyO1xuICAgIGxWaWV3W0ZMQUdTXSA9IGZsYWdzO1xuICB9XG59XG5cbi8qKlxuICogQ2FsbHMgbGlmZWN5Y2xlIGhvb2tzIHdpdGggdGhlaXIgY29udGV4dHMsIHNraXBwaW5nIGluaXQgaG9va3MgaWYgaXQncyBub3RcbiAqIHRoZSBmaXJzdCBMVmlldyBwYXNzXG4gKlxuICogQHBhcmFtIGN1cnJlbnRWaWV3IFRoZSBjdXJyZW50IHZpZXdcbiAqIEBwYXJhbSBhcnIgVGhlIGFycmF5IGluIHdoaWNoIHRoZSBob29rcyBhcmUgZm91bmRcbiAqIEBwYXJhbSBpbml0UGhhc2VTdGF0ZSB0aGUgY3VycmVudCBzdGF0ZSBvZiB0aGUgaW5pdCBwaGFzZVxuICogQHBhcmFtIGN1cnJlbnROb2RlSW5kZXggMyBjYXNlcyBkZXBlbmRpbmcgb24gdGhlIHZhbHVlOlxuICogLSB1bmRlZmluZWQ6IGFsbCBob29rcyBmcm9tIHRoZSBhcnJheSBzaG91bGQgYmUgZXhlY3V0ZWQgKHBvc3Qtb3JkZXIgY2FzZSlcbiAqIC0gbnVsbDogZXhlY3V0ZSBob29rcyBvbmx5IGZyb20gdGhlIHNhdmVkIGluZGV4IHVudGlsIHRoZSBlbmQgb2YgdGhlIGFycmF5IChwcmUtb3JkZXIgY2FzZSwgd2hlblxuICogZmx1c2hpbmcgdGhlIHJlbWFpbmluZyBob29rcylcbiAqIC0gbnVtYmVyOiBleGVjdXRlIGhvb2tzIG9ubHkgZnJvbSB0aGUgc2F2ZWQgaW5kZXggdW50aWwgdGhhdCBub2RlIGluZGV4IGV4Y2x1c2l2ZSAocHJlLW9yZGVyXG4gKiBjYXNlLCB3aGVuIGV4ZWN1dGluZyBzZWxlY3QobnVtYmVyKSlcbiAqL1xuZnVuY3Rpb24gY2FsbEhvb2tzKFxuICAgIGN1cnJlbnRWaWV3OiBMVmlldywgYXJyOiBIb29rRGF0YSwgaW5pdFBoYXNlOiBJbml0UGhhc2VTdGF0ZSxcbiAgICBjdXJyZW50Tm9kZUluZGV4OiBudW1iZXIgfCBudWxsIHwgdW5kZWZpbmVkKTogdm9pZCB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRFcXVhbChcbiAgICAgICAgICAgICAgICAgICBnZXRDaGVja05vQ2hhbmdlc01vZGUoKSwgZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgJ0hvb2tzIHNob3VsZCBuZXZlciBiZSBydW4gaW4gdGhlIGNoZWNrIG5vIGNoYW5nZXMgbW9kZS4nKTtcbiAgY29uc3Qgc3RhcnRJbmRleCA9IGN1cnJlbnROb2RlSW5kZXggIT09IHVuZGVmaW5lZCA/XG4gICAgICAoY3VycmVudFZpZXdbUFJFT1JERVJfSE9PS19GTEFHU10gJiBQcmVPcmRlckhvb2tGbGFncy5JbmRleE9mVGhlTmV4dFByZU9yZGVySG9va01hc2tNYXNrKSA6XG4gICAgICAwO1xuICBjb25zdCBub2RlSW5kZXhMaW1pdCA9IGN1cnJlbnROb2RlSW5kZXggIT0gbnVsbCA/IGN1cnJlbnROb2RlSW5kZXggOiAtMTtcbiAgbGV0IGxhc3ROb2RlSW5kZXhGb3VuZCA9IDA7XG4gIGZvciAobGV0IGkgPSBzdGFydEluZGV4OyBpIDwgYXJyLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgaG9vayA9IGFycltpICsgMV0gYXMoKSA9PiB2b2lkO1xuICAgIGlmICh0eXBlb2YgaG9vayA9PT0gJ251bWJlcicpIHtcbiAgICAgIGxhc3ROb2RlSW5kZXhGb3VuZCA9IGFycltpXSBhcyBudW1iZXI7XG4gICAgICBpZiAoY3VycmVudE5vZGVJbmRleCAhPSBudWxsICYmIGxhc3ROb2RlSW5kZXhGb3VuZCA+PSBjdXJyZW50Tm9kZUluZGV4KSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBpc0luaXRIb29rID0gYXJyW2ldIDwgMDtcbiAgICAgIGlmIChpc0luaXRIb29rKVxuICAgICAgICBjdXJyZW50Vmlld1tQUkVPUkRFUl9IT09LX0ZMQUdTXSArPSBQcmVPcmRlckhvb2tGbGFncy5OdW1iZXJPZkluaXRIb29rc0NhbGxlZEluY3JlbWVudGVyO1xuICAgICAgaWYgKGxhc3ROb2RlSW5kZXhGb3VuZCA8IG5vZGVJbmRleExpbWl0IHx8IG5vZGVJbmRleExpbWl0ID09IC0xKSB7XG4gICAgICAgIGNhbGxIb29rKGN1cnJlbnRWaWV3LCBpbml0UGhhc2UsIGFyciwgaSk7XG4gICAgICAgIGN1cnJlbnRWaWV3W1BSRU9SREVSX0hPT0tfRkxBR1NdID1cbiAgICAgICAgICAgIChjdXJyZW50Vmlld1tQUkVPUkRFUl9IT09LX0ZMQUdTXSAmIFByZU9yZGVySG9va0ZsYWdzLk51bWJlck9mSW5pdEhvb2tzQ2FsbGVkTWFzaykgKyBpICtcbiAgICAgICAgICAgIDI7XG4gICAgICB9XG4gICAgICBpKys7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogRXhlY3V0ZSBvbmUgaG9vayBhZ2FpbnN0IHRoZSBjdXJyZW50IGBMVmlld2AuXG4gKlxuICogQHBhcmFtIGN1cnJlbnRWaWV3IFRoZSBjdXJyZW50IHZpZXdcbiAqIEBwYXJhbSBpbml0UGhhc2VTdGF0ZSB0aGUgY3VycmVudCBzdGF0ZSBvZiB0aGUgaW5pdCBwaGFzZVxuICogQHBhcmFtIGFyciBUaGUgYXJyYXkgaW4gd2hpY2ggdGhlIGhvb2tzIGFyZSBmb3VuZFxuICogQHBhcmFtIGkgVGhlIGN1cnJlbnQgaW5kZXggd2l0aGluIHRoZSBob29rIGRhdGEgYXJyYXlcbiAqL1xuZnVuY3Rpb24gY2FsbEhvb2soY3VycmVudFZpZXc6IExWaWV3LCBpbml0UGhhc2U6IEluaXRQaGFzZVN0YXRlLCBhcnI6IEhvb2tEYXRhLCBpOiBudW1iZXIpIHtcbiAgY29uc3QgaXNJbml0SG9vayA9IGFycltpXSA8IDA7XG4gIGNvbnN0IGhvb2sgPSBhcnJbaSArIDFdIGFzKCkgPT4gdm9pZDtcbiAgY29uc3QgZGlyZWN0aXZlSW5kZXggPSBpc0luaXRIb29rID8gLWFycltpXSA6IGFycltpXSBhcyBudW1iZXI7XG4gIGNvbnN0IGRpcmVjdGl2ZSA9IGN1cnJlbnRWaWV3W2RpcmVjdGl2ZUluZGV4XTtcbiAgaWYgKGlzSW5pdEhvb2spIHtcbiAgICBjb25zdCBpbmRleFdpdGhpbnRJbml0UGhhc2UgPSBjdXJyZW50Vmlld1tGTEFHU10gPj4gTFZpZXdGbGFncy5JbmRleFdpdGhpbkluaXRQaGFzZVNoaWZ0O1xuICAgIC8vIFRoZSBpbml0IHBoYXNlIHN0YXRlIG11c3QgYmUgYWx3YXlzIGNoZWNrZWQgaGVyZSBhcyBpdCBtYXkgaGF2ZSBiZWVuIHJlY3Vyc2l2ZWx5XG4gICAgLy8gdXBkYXRlZFxuICAgIGlmIChpbmRleFdpdGhpbnRJbml0UGhhc2UgPFxuICAgICAgICAgICAgKGN1cnJlbnRWaWV3W1BSRU9SREVSX0hPT0tfRkxBR1NdID4+IFByZU9yZGVySG9va0ZsYWdzLk51bWJlck9mSW5pdEhvb2tzQ2FsbGVkU2hpZnQpICYmXG4gICAgICAgIChjdXJyZW50Vmlld1tGTEFHU10gJiBMVmlld0ZsYWdzLkluaXRQaGFzZVN0YXRlTWFzaykgPT09IGluaXRQaGFzZSkge1xuICAgICAgY3VycmVudFZpZXdbRkxBR1NdICs9IExWaWV3RmxhZ3MuSW5kZXhXaXRoaW5Jbml0UGhhc2VJbmNyZW1lbnRlcjtcbiAgICAgIGhvb2suY2FsbChkaXJlY3RpdmUpO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBob29rLmNhbGwoZGlyZWN0aXZlKTtcbiAgfVxufVxuIl19