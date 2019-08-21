/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { assertEqual, assertNotEqual } from '../util/assert';
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
    ngDevMode &&
        assertEqual(tView.firstTemplatePass, true, 'Should only be called on first template pass');
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
    if (tView.firstTemplatePass) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaG9va3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2hvb2tzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxXQUFXLEVBQUUsY0FBYyxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFJM0QsT0FBTyxFQUFDLEtBQUssRUFBK0MsbUJBQW1CLEVBQTJCLE1BQU0sbUJBQW1CLENBQUM7QUFDcEksT0FBTyxFQUFDLHFCQUFxQixFQUFDLE1BQU0sU0FBUyxDQUFDO0FBSTlDOzs7Ozs7Ozs7Ozs7Ozs7O0dBZ0JHO0FBQ0gsTUFBTSxVQUFVLHFCQUFxQixDQUNqQyxjQUFzQixFQUFFLFlBQStCLEVBQUUsS0FBWSxFQUFFLFNBQWlCLEVBQ3hGLDBCQUFrQyxFQUFFLCtCQUF1QztJQUM3RSxTQUFTO1FBQ0wsV0FBVyxDQUFDLEtBQUssQ0FBQyxpQkFBaUIsRUFBRSxJQUFJLEVBQUUsOENBQThDLENBQUMsQ0FBQztJQUV4RixJQUFBLGtDQUFTLEVBQUUsNEJBQU0sRUFBRSw4QkFBTyxDQUFpQjtJQUNsRCxJQUFJLDBCQUEwQixJQUFJLENBQUM7UUFDL0IsQ0FBQyxDQUFDLEtBQUssQ0FBQyxhQUFhLElBQUksMEJBQTBCLEtBQUssS0FBSyxDQUFDLGFBQWEsQ0FBQyxNQUFNLENBQUM7UUFDbkYsQ0FBQyxTQUFTLElBQUksTUFBTSxJQUFJLE9BQU8sQ0FBQyxFQUFFO1FBQ3BDLENBQUMsS0FBSyxDQUFDLGFBQWEsSUFBSSxDQUFDLEtBQUssQ0FBQyxhQUFhLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7S0FDckU7SUFFRCxJQUFJLCtCQUErQixJQUFJLENBQUM7UUFDcEMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxrQkFBa0I7WUFDekIsK0JBQStCLEtBQUssS0FBSyxDQUFD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Q0FBQyxXQUFXLENBQUMsbUJBQW1CLENBQUMseUNBQWtELENBQUM7WUFDeEYsQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLDZCQUFnQyxDQUFDLEtBQUssU0FBUyxFQUFFO1lBQ3RFLFdBQVcsQ0FBQyxLQUFLLENBQUMsOENBQThDLENBQUM7WUFDakUsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztTQUN0QjtLQUNGO1NBQU07UUFDTCxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO0tBQ3RCO0FBQ0gsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHthc3NlcnRFcXVhbCwgYXNzZXJ0Tm90RXF1YWx9IGZyb20gJy4uL3V0aWwvYXNzZXJ0JztcblxuaW1wb3J0IHtEaXJlY3RpdmVEZWZ9IGZyb20gJy4vaW50ZXJmYWNlcy9kZWZpbml0aW9uJztcbmltcG9ydCB7VE5vZGV9IGZyb20gJy4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7RkxBR1MsIEhvb2tEYXRhLCBJbml0UGhhc2VTdGF0ZSwgTFZpZXcsIExWaWV3RmxhZ3MsIFBSRU9SREVSX0hPT0tfRkxBR1MsIFByZU9yZGVySG9va0ZsYWdzLCBUVmlld30gZnJvbSAnLi9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHtnZXRDaGVja05vQ2hhbmdlc01vZGV9IGZyb20gJy4vc3RhdGUnO1xuXG5cblxuLyoqXG4gKiBBZGRzIGFsbCBkaXJlY3RpdmUgbGlmZWN5Y2xlIGhvb2tzIGZyb20gdGhlIGdpdmVuIGBEaXJlY3RpdmVEZWZgIHRvIHRoZSBnaXZlbiBgVFZpZXdgLlxuICpcbiAqIE11c3QgYmUgcnVuICpvbmx5KiBvbiB0aGUgZmlyc3QgdGVtcGxhdGUgcGFzcy5cbiAqXG4gKiBTZXRzIHVwIHRoZSBwcmUtb3JkZXIgaG9va3Mgb24gdGhlIHByb3ZpZGVkIGB0Vmlld2AsXG4gKiBzZWUge0BsaW5rIEhvb2tEYXRhfSBmb3IgZGV0YWlscyBhYm91dCB0aGUgZGF0YSBzdHJ1Y3R1cmUuXG4gKlxuICogQHBhcmFtIGRpcmVjdGl2ZUluZGV4IFRoZSBpbmRleCBvZiB0aGUgZGlyZWN0aXZlIGluIExWaWV3XG4gKiBAcGFyYW0gZGlyZWN0aXZlRGVmIFRoZSBkZWZpbml0aW9uIGNvbnRhaW5pbmcgdGhlIGhvb2tzIHRvIHNldHVwIGluIHRWaWV3XG4gKiBAcGFyYW0gdFZpZXcgVGhlIGN1cnJlbnQgVFZpZXdcbiAqIEBwYXJhbSBub2RlSW5kZXggVGhlIGluZGV4IG9mIHRoZSBub2RlIHRvIHdoaWNoIHRoZSBkaXJlY3RpdmUgaXMgYXR0YWNoZWRcbiAqIEBwYXJhbSBpbml0aWFsUHJlT3JkZXJIb29rc0xlbmd0aCB0aGUgbnVtYmVyIG9mIHByZS1vcmRlciBob29rcyBhbHJlYWR5IHJlZ2lzdGVyZWQgYmVmb3JlIHRoZVxuICogY3VycmVudCBwcm9jZXNzLCB1c2VkIHRvIGtub3cgaWYgdGhlIG5vZGUgaW5kZXggaGFzIHRvIGJlIGFkZGVkIHRvIHRoZSBhcnJheS4gSWYgaXQgaXMgLTEsXG4gKiB0aGUgbm9kZSBpbmRleCBpcyBuZXZlciBhZGRlZC5cbiAqIEBwYXJhbSBpbml0aWFsUHJlT3JkZXJDaGVja0hvb2tzTGVuZ3RoIHNhbWUgYXMgcHJldmlvdXMgZm9yIHByZS1vcmRlciBjaGVjayBob29rc1xuICovXG5leHBvcnQgZnVuY3Rpb24gcmVnaXN0ZXJQcmVPcmRlckhvb2tzKFxuICAgIGRpcmVjdGl2ZUluZGV4OiBudW1iZXIsIGRpcmVjdGl2ZURlZjogRGlyZWN0aXZlRGVmPGFueT4sIHRWaWV3OiBUVmlldywgbm9kZUluZGV4OiBudW1iZXIsXG4gICAgaW5pdGlhbFByZU9yZGVySG9va3NMZW5ndGg6IG51bWJlciwgaW5pdGlhbFByZU9yZGVyQ2hlY2tIb29rc0xlbmd0aDogbnVtYmVyKTogdm9pZCB7XG4gIG5nRGV2TW9kZSAmJlxuICAgICAgYXNzZXJ0RXF1YWwodFZpZXcuZmlyc3RUZW1wbGF0ZVBhc3MsIHRydWUsICdTaG91bGQgb25seSBiZSBjYWxsZWQgb24gZmlyc3QgdGVtcGxhdGUgcGFzcycpO1xuXG4gIGNvbnN0IHtvbkNoYW5nZXMsIG9uSW5pdCwgZG9DaGVja30gPSBkaXJlY3RpdmVEZWY7XG4gIGlmIChpbml0aWFsUHJlT3JkZXJIb29rc0xlbmd0aCA+PSAwICYmXG4gICAgICAoIXRWaWV3LnByZU9yZGVySG9va3MgfHwgaW5pdGlhbFByZU9yZGVySG9va3NMZW5ndGggPT09IHRWaWV3LnByZU9yZGVySG9va3MubGVuZ3RoKSAmJlxuICAgICAgKG9uQ2hhbmdlcyB8fCBvbkluaXQgfHwgZG9DaGVjaykpIHtcbiAgICAodFZpZXcucHJlT3JkZXJIb29rcyB8fCAodFZpZXcucHJlT3JkZXJIb29rcyA9IFtdKSkucHVzaChub2RlSW5kZXgpO1xuICB9XG5cbiAgaWYgKGluaXRpYWxQcmVPcmRlckNoZWNrSG9va3NMZW5ndGggPj0gMCAmJlxuICAgICAgKCF0Vmlldy5wcmVPcmRlckNoZWNrSG9va3MgfHxcbiAgICAgICBpbml0aWFsUHJlT3JkZXJDaGVja0hvb2tzTGVuZ3RoID09PSB0Vmlldy5wcmVPcmRlckNoZWNrSG9va3MubGVuZ3RoKSAmJlxuICAgICAgKG9uQ2hhbmdlcyB8fCBkb0NoZWNrKSkge1xuICAgICh0Vmlldy5wcmVPcmRlckNoZWNrSG9va3MgfHwgKHRWaWV3LnByZU9yZGVyQ2hlY2tIb29rcyA9IFtdKSkucHVzaChub2RlSW5kZXgpO1xuICB9XG5cbiAgaWYgKG9uQ2hhbmdlcykge1xuICAgICh0Vmlldy5wcmVPcmRlckhvb2tzIHx8ICh0Vmlldy5wcmVPcmRlckhvb2tzID0gW10pKS5wdXNoKGRpcmVjdGl2ZUluZGV4LCBvbkNoYW5nZXMpO1xuICAgICh0Vmlldy5wcmVPcmRlckNoZWNrSG9va3MgfHwgKHRWaWV3LnByZU9yZGVyQ2hlY2tIb29rcyA9IFtdKSkucHVzaChkaXJlY3RpdmVJbmRleCwgb25DaGFuZ2VzKTtcbiAgfVxuXG4gIGlmIChvbkluaXQpIHtcbiAgICAodFZpZXcucHJlT3JkZXJIb29rcyB8fCAodFZpZXcucHJlT3JkZXJIb29rcyA9IFtdKSkucHVzaCgtZGlyZWN0aXZlSW5kZXgsIG9uSW5pdCk7XG4gIH1cblxuICBpZiAoZG9DaGVjaykge1xuICAgICh0Vmlldy5wcmVPcmRlckhvb2tzIHx8ICh0Vmlldy5wcmVPcmRlckhvb2tzID0gW10pKS5wdXNoKGRpcmVjdGl2ZUluZGV4LCBkb0NoZWNrKTtcbiAgICAodFZpZXcucHJlT3JkZXJDaGVja0hvb2tzIHx8ICh0Vmlldy5wcmVPcmRlckNoZWNrSG9va3MgPSBbXSkpLnB1c2goZGlyZWN0aXZlSW5kZXgsIGRvQ2hlY2spO1xuICB9XG59XG5cbi8qKlxuICpcbiAqIExvb3BzIHRocm91Z2ggdGhlIGRpcmVjdGl2ZXMgb24gdGhlIHByb3ZpZGVkIGB0Tm9kZWAgYW5kIHF1ZXVlcyBob29rcyB0byBiZVxuICogcnVuIHRoYXQgYXJlIG5vdCBpbml0aWFsaXphdGlvbiBob29rcy5cbiAqXG4gKiBTaG91bGQgYmUgZXhlY3V0ZWQgZHVyaW5nIGBlbGVtZW50RW5kKClgIGFuZCBzaW1pbGFyIHRvXG4gKiBwcmVzZXJ2ZSBob29rIGV4ZWN1dGlvbiBvcmRlci4gQ29udGVudCwgdmlldywgYW5kIGRlc3Ryb3kgaG9va3MgZm9yIHByb2plY3RlZFxuICogY29tcG9uZW50cyBhbmQgZGlyZWN0aXZlcyBtdXN0IGJlIGNhbGxlZCAqYmVmb3JlKiB0aGVpciBob3N0cy5cbiAqXG4gKiBTZXRzIHVwIHRoZSBjb250ZW50LCB2aWV3LCBhbmQgZGVzdHJveSBob29rcyBvbiB0aGUgcHJvdmlkZWQgYHRWaWV3YCxcbiAqIHNlZSB7QGxpbmsgSG9va0RhdGF9IGZvciBkZXRhaWxzIGFib3V0IHRoZSBkYXRhIHN0cnVjdHVyZS5cbiAqXG4gKiBOT1RFOiBUaGlzIGRvZXMgbm90IHNldCB1cCBgb25DaGFuZ2VzYCwgYG9uSW5pdGAgb3IgYGRvQ2hlY2tgLCB0aG9zZSBhcmUgc2V0IHVwXG4gKiBzZXBhcmF0ZWx5IGF0IGBlbGVtZW50U3RhcnRgLlxuICpcbiAqIEBwYXJhbSB0VmlldyBUaGUgY3VycmVudCBUVmlld1xuICogQHBhcmFtIHROb2RlIFRoZSBUTm9kZSB3aG9zZSBkaXJlY3RpdmVzIGFyZSB0byBiZSBzZWFyY2hlZCBmb3IgaG9va3MgdG8gcXVldWVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlZ2lzdGVyUG9zdE9yZGVySG9va3ModFZpZXc6IFRWaWV3LCB0Tm9kZTogVE5vZGUpOiB2b2lkIHtcbiAgaWYgKHRWaWV3LmZpcnN0VGVtcGxhdGVQYXNzKSB7XG4gICAgLy8gSXQncyBuZWNlc3NhcnkgdG8gbG9vcCB0aHJvdWdoIHRoZSBkaXJlY3RpdmVzIGF0IGVsZW1lbnRFbmQoKSAocmF0aGVyIHRoYW4gcHJvY2Vzc2luZyBpblxuICAgIC8vIGRpcmVjdGl2ZUNyZWF0ZSkgc28gd2UgY2FuIHByZXNlcnZlIHRoZSBjdXJyZW50IGhvb2sgb3JkZXIuIENvbnRlbnQsIHZpZXcsIGFuZCBkZXN0cm95XG4gICAgLy8gaG9va3MgZm9yIHByb2plY3RlZCBjb21wb25lbnRzIGFuZCBkaXJlY3RpdmVzIG11c3QgYmUgY2FsbGVkICpiZWZvcmUqIHRoZWlyIGhvc3RzLlxuICAgIGZvciAobGV0IGkgPSB0Tm9kZS5kaXJlY3RpdmVTdGFydCwgZW5kID0gdE5vZGUuZGlyZWN0aXZlRW5kOyBpIDwgZW5kOyBpKyspIHtcbiAgICAgIGNvbnN0IGRpcmVjdGl2ZURlZiA9IHRWaWV3LmRhdGFbaV0gYXMgRGlyZWN0aXZlRGVmPGFueT47XG4gICAgICBpZiAoZGlyZWN0aXZlRGVmLmFmdGVyQ29udGVudEluaXQpIHtcbiAgICAgICAgKHRWaWV3LmNvbnRlbnRIb29rcyB8fCAodFZpZXcuY29udGVudEhvb2tzID0gW10pKS5wdXNoKC1pLCBkaXJlY3RpdmVEZWYuYWZ0ZXJDb250ZW50SW5pdCk7XG4gICAgICB9XG5cbiAgICAgIGlmIChkaXJlY3RpdmVEZWYuYWZ0ZXJDb250ZW50Q2hlY2tlZCkge1xuICAgICAgICAodFZpZXcuY29udGVudEhvb2tzIHx8ICh0Vmlldy5jb250ZW50SG9va3MgPSBbXSkpLnB1c2goaSwgZGlyZWN0aXZlRGVmLmFmdGVyQ29udGVudENoZWNrZWQpO1xuICAgICAgICAodFZpZXcuY29udGVudENoZWNrSG9va3MgfHwgKHRWaWV3LmNvbnRlbnRDaGVja0hvb2tzID0gW1xuICAgICAgICAgXSkpLnB1c2goaSwgZGlyZWN0aXZlRGVmLmFmdGVyQ29udGVudENoZWNrZWQpO1xuICAgICAgfVxuXG4gICAgICBpZiAoZGlyZWN0aXZlRGVmLmFmdGVyVmlld0luaXQpIHtcbiAgICAgICAgKHRWaWV3LnZpZXdIb29rcyB8fCAodFZpZXcudmlld0hvb2tzID0gW10pKS5wdXNoKC1pLCBkaXJlY3RpdmVEZWYuYWZ0ZXJWaWV3SW5pdCk7XG4gICAgICB9XG5cbiAgICAgIGlmIChkaXJlY3RpdmVEZWYuYWZ0ZXJWaWV3Q2hlY2tlZCkge1xuICAgICAgICAodFZpZXcudmlld0hvb2tzIHx8ICh0Vmlldy52aWV3SG9va3MgPSBbXSkpLnB1c2goaSwgZGlyZWN0aXZlRGVmLmFmdGVyVmlld0NoZWNrZWQpO1xuICAgICAgICAodFZpZXcudmlld0NoZWNrSG9va3MgfHwgKHRWaWV3LnZpZXdDaGVja0hvb2tzID0gW1xuICAgICAgICAgXSkpLnB1c2goaSwgZGlyZWN0aXZlRGVmLmFmdGVyVmlld0NoZWNrZWQpO1xuICAgICAgfVxuXG4gICAgICBpZiAoZGlyZWN0aXZlRGVmLm9uRGVzdHJveSAhPSBudWxsKSB7XG4gICAgICAgICh0Vmlldy5kZXN0cm95SG9va3MgfHwgKHRWaWV3LmRlc3Ryb3lIb29rcyA9IFtdKSkucHVzaChpLCBkaXJlY3RpdmVEZWYub25EZXN0cm95KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBFeGVjdXRpbmcgaG9va3MgcmVxdWlyZXMgY29tcGxleCBsb2dpYyBhcyB3ZSBuZWVkIHRvIGRlYWwgd2l0aCAyIGNvbnN0cmFpbnRzLlxuICpcbiAqIDEuIEluaXQgaG9va3MgKG5nT25Jbml0LCBuZ0FmdGVyQ29udGVudEluaXQsIG5nQWZ0ZXJWaWV3SW5pdCkgbXVzdCBhbGwgYmUgZXhlY3V0ZWQgb25jZSBhbmQgb25seVxuICogb25jZSwgYWNyb3NzIG1hbnkgY2hhbmdlIGRldGVjdGlvbiBjeWNsZXMuIFRoaXMgbXVzdCBiZSB0cnVlIGV2ZW4gaWYgc29tZSBob29rcyB0aHJvdywgb3IgaWZcbiAqIHNvbWUgcmVjdXJzaXZlbHkgdHJpZ2dlciBhIGNoYW5nZSBkZXRlY3Rpb24gY3ljbGUuXG4gKiBUbyBzb2x2ZSB0aGF0LCBpdCBpcyByZXF1aXJlZCB0byB0cmFjayB0aGUgc3RhdGUgb2YgdGhlIGV4ZWN1dGlvbiBvZiB0aGVzZSBpbml0IGhvb2tzLlxuICogVGhpcyBpcyBkb25lIGJ5IHN0b3JpbmcgYW5kIG1haW50YWluaW5nIGZsYWdzIGluIHRoZSB2aWV3OiB0aGUge0BsaW5rIEluaXRQaGFzZVN0YXRlfSxcbiAqIGFuZCB0aGUgaW5kZXggd2l0aGluIHRoYXQgcGhhc2UuIFRoZXkgY2FuIGJlIHNlZW4gYXMgYSBjdXJzb3IgaW4gdGhlIGZvbGxvd2luZyBzdHJ1Y3R1cmU6XG4gKiBbW29uSW5pdDEsIG9uSW5pdDJdLCBbYWZ0ZXJDb250ZW50SW5pdDFdLCBbYWZ0ZXJWaWV3SW5pdDEsIGFmdGVyVmlld0luaXQyLCBhZnRlclZpZXdJbml0M11dXG4gKiBUaGV5IGFyZSBhcmUgc3RvcmVkIGFzIGZsYWdzIGluIExWaWV3W0ZMQUdTXS5cbiAqXG4gKiAyLiBQcmUtb3JkZXIgaG9va3MgY2FuIGJlIGV4ZWN1dGVkIGluIGJhdGNoZXMsIGJlY2F1c2Ugb2YgdGhlIHNlbGVjdCBpbnN0cnVjdGlvbi5cbiAqIFRvIGJlIGFibGUgdG8gcGF1c2UgYW5kIHJlc3VtZSB0aGVpciBleGVjdXRpb24sIHdlIGFsc28gbmVlZCBzb21lIHN0YXRlIGFib3V0IHRoZSBob29rJ3MgYXJyYXlcbiAqIHRoYXQgaXMgYmVpbmcgcHJvY2Vzc2VkOlxuICogLSB0aGUgaW5kZXggb2YgdGhlIG5leHQgaG9vayB0byBiZSBleGVjdXRlZFxuICogLSB0aGUgbnVtYmVyIG9mIGluaXQgaG9va3MgYWxyZWFkeSBmb3VuZCBpbiB0aGUgcHJvY2Vzc2VkIHBhcnQgb2YgdGhlICBhcnJheVxuICogVGhleSBhcmUgYXJlIHN0b3JlZCBhcyBmbGFncyBpbiBMVmlld1tQUkVPUkRFUl9IT09LX0ZMQUdTXS5cbiAqL1xuXG5cbi8qKlxuICogRXhlY3V0ZXMgcHJlLW9yZGVyIGNoZWNrIGhvb2tzICggT25DaGFuZ2VzLCBEb0NoYW5nZXMpIGdpdmVuIGEgdmlldyB3aGVyZSBhbGwgdGhlIGluaXQgaG9va3Mgd2VyZVxuICogZXhlY3V0ZWQgb25jZS4gVGhpcyBpcyBhIGxpZ2h0IHZlcnNpb24gb2YgZXhlY3V0ZUluaXRBbmRDaGVja1ByZU9yZGVySG9va3Mgd2hlcmUgd2UgY2FuIHNraXAgcmVhZFxuICogLyB3cml0ZSBvZiB0aGUgaW5pdC1ob29rcyByZWxhdGVkIGZsYWdzLlxuICogQHBhcmFtIGxWaWV3IFRoZSBMVmlldyB3aGVyZSBob29rcyBhcmUgZGVmaW5lZFxuICogQHBhcmFtIGhvb2tzIEhvb2tzIHRvIGJlIHJ1blxuICogQHBhcmFtIG5vZGVJbmRleCAzIGNhc2VzIGRlcGVuZGluZyBvbiB0aGUgdmFsdWU6XG4gKiAtIHVuZGVmaW5lZDogYWxsIGhvb2tzIGZyb20gdGhlIGFycmF5IHNob3VsZCBiZSBleGVjdXRlZCAocG9zdC1vcmRlciBjYXNlKVxuICogLSBudWxsOiBleGVjdXRlIGhvb2tzIG9ubHkgZnJvbSB0aGUgc2F2ZWQgaW5kZXggdW50aWwgdGhlIGVuZCBvZiB0aGUgYXJyYXkgKHByZS1vcmRlciBjYXNlLCB3aGVuXG4gKiBmbHVzaGluZyB0aGUgcmVtYWluaW5nIGhvb2tzKVxuICogLSBudW1iZXI6IGV4ZWN1dGUgaG9va3Mgb25seSBmcm9tIHRoZSBzYXZlZCBpbmRleCB1bnRpbCB0aGF0IG5vZGUgaW5kZXggZXhjbHVzaXZlIChwcmUtb3JkZXJcbiAqIGNhc2UsIHdoZW4gZXhlY3V0aW5nIHNlbGVjdChudW1iZXIpKVxuICovXG5leHBvcnQgZnVuY3Rpb24gZXhlY3V0ZUNoZWNrSG9va3MobFZpZXc6IExWaWV3LCBob29rczogSG9va0RhdGEsIG5vZGVJbmRleD86IG51bWJlciB8IG51bGwpIHtcbiAgY2FsbEhvb2tzKGxWaWV3LCBob29rcywgSW5pdFBoYXNlU3RhdGUuSW5pdFBoYXNlQ29tcGxldGVkLCBub2RlSW5kZXgpO1xufVxuXG4vKipcbiAqIEV4ZWN1dGVzIHBvc3Qtb3JkZXIgaW5pdCBhbmQgY2hlY2sgaG9va3MgKG9uZSBvZiBBZnRlckNvbnRlbnRJbml0LCBBZnRlckNvbnRlbnRDaGVja2VkLFxuICogQWZ0ZXJWaWV3SW5pdCwgQWZ0ZXJWaWV3Q2hlY2tlZCkgZ2l2ZW4gYSB2aWV3IHdoZXJlIHRoZXJlIGFyZSBwZW5kaW5nIGluaXQgaG9va3MgdG8gYmUgZXhlY3V0ZWQuXG4gKiBAcGFyYW0gbFZpZXcgVGhlIExWaWV3IHdoZXJlIGhvb2tzIGFyZSBkZWZpbmVkXG4gKiBAcGFyYW0gaG9va3MgSG9va3MgdG8gYmUgcnVuXG4gKiBAcGFyYW0gaW5pdFBoYXNlIEEgcGhhc2UgZm9yIHdoaWNoIGhvb2tzIHNob3VsZCBiZSBydW5cbiAqIEBwYXJhbSBub2RlSW5kZXggMyBjYXNlcyBkZXBlbmRpbmcgb24gdGhlIHZhbHVlOlxuICogLSB1bmRlZmluZWQ6IGFsbCBob29rcyBmcm9tIHRoZSBhcnJheSBzaG91bGQgYmUgZXhlY3V0ZWQgKHBvc3Qtb3JkZXIgY2FzZSlcbiAqIC0gbnVsbDogZXhlY3V0ZSBob29rcyBvbmx5IGZyb20gdGhlIHNhdmVkIGluZGV4IHVudGlsIHRoZSBlbmQgb2YgdGhlIGFycmF5IChwcmUtb3JkZXIgY2FzZSwgd2hlblxuICogZmx1c2hpbmcgdGhlIHJlbWFpbmluZyBob29rcylcbiAqIC0gbnVtYmVyOiBleGVjdXRlIGhvb2tzIG9ubHkgZnJvbSB0aGUgc2F2ZWQgaW5kZXggdW50aWwgdGhhdCBub2RlIGluZGV4IGV4Y2x1c2l2ZSAocHJlLW9yZGVyXG4gKiBjYXNlLCB3aGVuIGV4ZWN1dGluZyBzZWxlY3QobnVtYmVyKSlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGV4ZWN1dGVJbml0QW5kQ2hlY2tIb29rcyhcbiAgICBsVmlldzogTFZpZXcsIGhvb2tzOiBIb29rRGF0YSwgaW5pdFBoYXNlOiBJbml0UGhhc2VTdGF0ZSwgbm9kZUluZGV4PzogbnVtYmVyIHwgbnVsbCkge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm90RXF1YWwoXG4gICAgICAgICAgICAgICAgICAgaW5pdFBoYXNlLCBJbml0UGhhc2VTdGF0ZS5Jbml0UGhhc2VDb21wbGV0ZWQsXG4gICAgICAgICAgICAgICAgICAgJ0luaXQgcHJlLW9yZGVyIGhvb2tzIHNob3VsZCBub3QgYmUgY2FsbGVkIG1vcmUgdGhhbiBvbmNlJyk7XG4gIGlmICgobFZpZXdbRkxBR1NdICYgTFZpZXdGbGFncy5Jbml0UGhhc2VTdGF0ZU1hc2spID09PSBpbml0UGhhc2UpIHtcbiAgICBjYWxsSG9va3MobFZpZXcsIGhvb2tzLCBpbml0UGhhc2UsIG5vZGVJbmRleCk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGluY3JlbWVudEluaXRQaGFzZUZsYWdzKGxWaWV3OiBMVmlldywgaW5pdFBoYXNlOiBJbml0UGhhc2VTdGF0ZSk6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiZcbiAgICAgIGFzc2VydE5vdEVxdWFsKFxuICAgICAgICAgIGluaXRQaGFzZSwgSW5pdFBoYXNlU3RhdGUuSW5pdFBoYXNlQ29tcGxldGVkLFxuICAgICAgICAgICdJbml0IGhvb2tzIHBoYXNlIHNob3VsZCBub3QgYmUgaW5jcmVtZW50ZWQgYWZ0ZXIgYWxsIGluaXQgaG9va3MgaGF2ZSBiZWVuIHJ1bi4nKTtcbiAgbGV0IGZsYWdzID0gbFZpZXdbRkxBR1NdO1xuICBpZiAoKGZsYWdzICYgTFZpZXdGbGFncy5Jbml0UGhhc2VTdGF0ZU1hc2spID09PSBpbml0UGhhc2UpIHtcbiAgICBmbGFncyAmPSBMVmlld0ZsYWdzLkluZGV4V2l0aGluSW5pdFBoYXNlUmVzZXQ7XG4gICAgZmxhZ3MgKz0gTFZpZXdGbGFncy5Jbml0UGhhc2VTdGF0ZUluY3JlbWVudGVyO1xuICAgIGxWaWV3W0ZMQUdTXSA9IGZsYWdzO1xuICB9XG59XG5cbi8qKlxuICogQ2FsbHMgbGlmZWN5Y2xlIGhvb2tzIHdpdGggdGhlaXIgY29udGV4dHMsIHNraXBwaW5nIGluaXQgaG9va3MgaWYgaXQncyBub3RcbiAqIHRoZSBmaXJzdCBMVmlldyBwYXNzXG4gKlxuICogQHBhcmFtIGN1cnJlbnRWaWV3IFRoZSBjdXJyZW50IHZpZXdcbiAqIEBwYXJhbSBhcnIgVGhlIGFycmF5IGluIHdoaWNoIHRoZSBob29rcyBhcmUgZm91bmRcbiAqIEBwYXJhbSBpbml0UGhhc2VTdGF0ZSB0aGUgY3VycmVudCBzdGF0ZSBvZiB0aGUgaW5pdCBwaGFzZVxuICogQHBhcmFtIGN1cnJlbnROb2RlSW5kZXggMyBjYXNlcyBkZXBlbmRpbmcgb24gdGhlIHZhbHVlOlxuICogLSB1bmRlZmluZWQ6IGFsbCBob29rcyBmcm9tIHRoZSBhcnJheSBzaG91bGQgYmUgZXhlY3V0ZWQgKHBvc3Qtb3JkZXIgY2FzZSlcbiAqIC0gbnVsbDogZXhlY3V0ZSBob29rcyBvbmx5IGZyb20gdGhlIHNhdmVkIGluZGV4IHVudGlsIHRoZSBlbmQgb2YgdGhlIGFycmF5IChwcmUtb3JkZXIgY2FzZSwgd2hlblxuICogZmx1c2hpbmcgdGhlIHJlbWFpbmluZyBob29rcylcbiAqIC0gbnVtYmVyOiBleGVjdXRlIGhvb2tzIG9ubHkgZnJvbSB0aGUgc2F2ZWQgaW5kZXggdW50aWwgdGhhdCBub2RlIGluZGV4IGV4Y2x1c2l2ZSAocHJlLW9yZGVyXG4gKiBjYXNlLCB3aGVuIGV4ZWN1dGluZyBzZWxlY3QobnVtYmVyKSlcbiAqL1xuZnVuY3Rpb24gY2FsbEhvb2tzKFxuICAgIGN1cnJlbnRWaWV3OiBMVmlldywgYXJyOiBIb29rRGF0YSwgaW5pdFBoYXNlOiBJbml0UGhhc2VTdGF0ZSxcbiAgICBjdXJyZW50Tm9kZUluZGV4OiBudW1iZXIgfCBudWxsIHwgdW5kZWZpbmVkKTogdm9pZCB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRFcXVhbChcbiAgICAgICAgICAgICAgICAgICBnZXRDaGVja05vQ2hhbmdlc01vZGUoKSwgZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgJ0hvb2tzIHNob3VsZCBuZXZlciBiZSBydW4gaW4gdGhlIGNoZWNrIG5vIGNoYW5nZXMgbW9kZS4nKTtcbiAgY29uc3Qgc3RhcnRJbmRleCA9IGN1cnJlbnROb2RlSW5kZXggIT09IHVuZGVmaW5lZCA/XG4gICAgICAoY3VycmVudFZpZXdbUFJFT1JERVJfSE9PS19GTEFHU10gJiBQcmVPcmRlckhvb2tGbGFncy5JbmRleE9mVGhlTmV4dFByZU9yZGVySG9va01hc2tNYXNrKSA6XG4gICAgICAwO1xuICBjb25zdCBub2RlSW5kZXhMaW1pdCA9IGN1cnJlbnROb2RlSW5kZXggIT0gbnVsbCA/IGN1cnJlbnROb2RlSW5kZXggOiAtMTtcbiAgbGV0IGxhc3ROb2RlSW5kZXhGb3VuZCA9IDA7XG4gIGZvciAobGV0IGkgPSBzdGFydEluZGV4OyBpIDwgYXJyLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgaG9vayA9IGFycltpICsgMV0gYXMoKSA9PiB2b2lkO1xuICAgIGlmICh0eXBlb2YgaG9vayA9PT0gJ251bWJlcicpIHtcbiAgICAgIGxhc3ROb2RlSW5kZXhGb3VuZCA9IGFycltpXSBhcyBudW1iZXI7XG4gICAgICBpZiAoY3VycmVudE5vZGVJbmRleCAhPSBudWxsICYmIGxhc3ROb2RlSW5kZXhGb3VuZCA+PSBjdXJyZW50Tm9kZUluZGV4KSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBpc0luaXRIb29rID0gYXJyW2ldIDwgMDtcbiAgICAgIGlmIChpc0luaXRIb29rKVxuICAgICAgICBjdXJyZW50Vmlld1tQUkVPUkRFUl9IT09LX0ZMQUdTXSArPSBQcmVPcmRlckhvb2tGbGFncy5OdW1iZXJPZkluaXRIb29rc0NhbGxlZEluY3JlbWVudGVyO1xuICAgICAgaWYgKGxhc3ROb2RlSW5kZXhGb3VuZCA8IG5vZGVJbmRleExpbWl0IHx8IG5vZGVJbmRleExpbWl0ID09IC0xKSB7XG4gICAgICAgIGNhbGxIb29rKGN1cnJlbnRWaWV3LCBpbml0UGhhc2UsIGFyciwgaSk7XG4gICAgICAgIGN1cnJlbnRWaWV3W1BSRU9SREVSX0hPT0tfRkxBR1NdID1cbiAgICAgICAgICAgIChjdXJyZW50Vmlld1tQUkVPUkRFUl9IT09LX0ZMQUdTXSAmIFByZU9yZGVySG9va0ZsYWdzLk51bWJlck9mSW5pdEhvb2tzQ2FsbGVkTWFzaykgKyBpICtcbiAgICAgICAgICAgIDI7XG4gICAgICB9XG4gICAgICBpKys7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogRXhlY3V0ZSBvbmUgaG9vayBhZ2FpbnN0IHRoZSBjdXJyZW50IGBMVmlld2AuXG4gKlxuICogQHBhcmFtIGN1cnJlbnRWaWV3IFRoZSBjdXJyZW50IHZpZXdcbiAqIEBwYXJhbSBpbml0UGhhc2VTdGF0ZSB0aGUgY3VycmVudCBzdGF0ZSBvZiB0aGUgaW5pdCBwaGFzZVxuICogQHBhcmFtIGFyciBUaGUgYXJyYXkgaW4gd2hpY2ggdGhlIGhvb2tzIGFyZSBmb3VuZFxuICogQHBhcmFtIGkgVGhlIGN1cnJlbnQgaW5kZXggd2l0aGluIHRoZSBob29rIGRhdGEgYXJyYXlcbiAqL1xuZnVuY3Rpb24gY2FsbEhvb2soY3VycmVudFZpZXc6IExWaWV3LCBpbml0UGhhc2U6IEluaXRQaGFzZVN0YXRlLCBhcnI6IEhvb2tEYXRhLCBpOiBudW1iZXIpIHtcbiAgY29uc3QgaXNJbml0SG9vayA9IGFycltpXSA8IDA7XG4gIGNvbnN0IGhvb2sgPSBhcnJbaSArIDFdIGFzKCkgPT4gdm9pZDtcbiAgY29uc3QgZGlyZWN0aXZlSW5kZXggPSBpc0luaXRIb29rID8gLWFycltpXSA6IGFycltpXSBhcyBudW1iZXI7XG4gIGNvbnN0IGRpcmVjdGl2ZSA9IGN1cnJlbnRWaWV3W2RpcmVjdGl2ZUluZGV4XTtcbiAgaWYgKGlzSW5pdEhvb2spIHtcbiAgICBjb25zdCBpbmRleFdpdGhpbnRJbml0UGhhc2UgPSBjdXJyZW50Vmlld1tGTEFHU10gPj4gTFZpZXdGbGFncy5JbmRleFdpdGhpbkluaXRQaGFzZVNoaWZ0O1xuICAgIC8vIFRoZSBpbml0IHBoYXNlIHN0YXRlIG11c3QgYmUgYWx3YXlzIGNoZWNrZWQgaGVyZSBhcyBpdCBtYXkgaGF2ZSBiZWVuIHJlY3Vyc2l2ZWx5XG4gICAgLy8gdXBkYXRlZFxuICAgIGlmIChpbmRleFdpdGhpbnRJbml0UGhhc2UgPFxuICAgICAgICAgICAgKGN1cnJlbnRWaWV3W1BSRU9SREVSX0hPT0tfRkxBR1NdID4+IFByZU9yZGVySG9va0ZsYWdzLk51bWJlck9mSW5pdEhvb2tzQ2FsbGVkU2hpZnQpICYmXG4gICAgICAgIChjdXJyZW50Vmlld1tGTEFHU10gJiBMVmlld0ZsYWdzLkluaXRQaGFzZVN0YXRlTWFzaykgPT09IGluaXRQaGFzZSkge1xuICAgICAgY3VycmVudFZpZXdbRkxBR1NdICs9IExWaWV3RmxhZ3MuSW5kZXhXaXRoaW5Jbml0UGhhc2VJbmNyZW1lbnRlcjtcbiAgICAgIGhvb2suY2FsbChkaXJlY3RpdmUpO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBob29rLmNhbGwoZGlyZWN0aXZlKTtcbiAgfVxufVxuIl19