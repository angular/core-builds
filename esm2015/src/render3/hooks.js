/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { assertEqual } from '../util/assert';
import { FLAGS } from './interfaces/view';
/**
 * Adds all directive lifecycle hooks from the given `DirectiveDef` to the given `TView`.
 *
 * Must be run *only* on the first template pass.
 *
 * The TView's hooks arrays are arranged in alternating pairs of directiveIndex and hookFunction,
 * i.e.: `[directiveIndexA, hookFunctionA, directiveIndexB, hookFunctionB, ...]`. For `OnChanges`
 * hooks, the `directiveIndex` will be *negative*, signaling {\@link callHooks} that the
 * `hookFunction` must be passed the the appropriate {\@link SimpleChanges} object.
 *
 * @param {?} directiveIndex The index of the directive in LView
 * @param {?} directiveDef The definition containing the hooks to setup in tView
 * @param {?} tView The current TView
 * @return {?}
 */
export function registerPreOrderHooks(directiveIndex, directiveDef, tView) {
    ngDevMode &&
        assertEqual(tView.firstTemplatePass, true, 'Should only be called on first template pass');
    const { onChanges, onInit, doCheck } = directiveDef;
    if (onChanges) {
        (tView.initHooks || (tView.initHooks = [])).push(directiveIndex, onChanges);
        (tView.checkHooks || (tView.checkHooks = [])).push(directiveIndex, onChanges);
    }
    if (onInit) {
        (tView.initHooks || (tView.initHooks = [])).push(-directiveIndex, onInit);
    }
    if (doCheck) {
        (tView.initHooks || (tView.initHooks = [])).push(directiveIndex, doCheck);
        (tView.checkHooks || (tView.checkHooks = [])).push(directiveIndex, doCheck);
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
 * Sets up the content, view, and destroy hooks on the provided `tView` such that
 * they're added in alternating pairs of directiveIndex and hookFunction,
 * i.e.: `[directiveIndexA, hookFunctionA, directiveIndexB, hookFunctionB, ...]`
 *
 * NOTE: This does not set up `onChanges`, `onInit` or `doCheck`, those are set up
 * separately at `elementStart`.
 *
 * @param {?} tView The current TView
 * @param {?} tNode The TNode whose directives are to be searched for hooks to queue
 * @return {?}
 */
export function registerPostOrderHooks(tView, tNode) {
    if (tView.firstTemplatePass) {
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
}
/**
 * Executes necessary hooks at the start of executing a template.
 *
 * Executes hooks that are to be run during the initialization of a directive such
 * as `onChanges`, `onInit`, and `doCheck`.
 *
 * Has the side effect of updating the RunInit flag in `lView` to be `0`, so that
 * this isn't run a second time.
 *
 * @param {?} currentView
 * @param {?} tView Static data for the view containing the hooks to be executed
 * @param {?} checkNoChangesMode Whether or not we're in checkNoChanges mode.
 * @return {?}
 */
export function executeInitHooks(currentView, tView, checkNoChangesMode) {
    if (!checkNoChangesMode) {
        executeHooks(currentView, tView.initHooks, tView.checkHooks, checkNoChangesMode, 0 /* OnInitHooksToBeRun */);
    }
}
/**
 * Executes hooks against the given `LView` based off of whether or not
 * This is the first pass.
 *
 * @param {?} currentView
 * @param {?} firstPassHooks An array of hooks to run if we're in the first view pass
 * @param {?} checkHooks An Array of hooks to run if we're not in the first view pass.
 * @param {?} checkNoChangesMode Whether or not we're in no changes mode.
 * @param {?} initPhase
 * @return {?}
 */
export function executeHooks(currentView, firstPassHooks, checkHooks, checkNoChangesMode, initPhase) {
    if (checkNoChangesMode)
        return;
    /** @type {?} */
    const hooksToCall = (currentView[FLAGS] & 3 /* InitPhaseStateMask */) === initPhase ?
        firstPassHooks :
        checkHooks;
    if (hooksToCall) {
        callHooks(currentView, hooksToCall, initPhase);
    }
    // The init phase state must be always checked here as it may have been recursively updated
    if ((currentView[FLAGS] & 3 /* InitPhaseStateMask */) === initPhase &&
        initPhase !== 3 /* InitPhaseCompleted */) {
        currentView[FLAGS] &= 1023 /* IndexWithinInitPhaseReset */;
        currentView[FLAGS] += 1 /* InitPhaseStateIncrementer */;
    }
}
/**
 * Calls lifecycle hooks with their contexts, skipping init hooks if it's not
 * the first LView pass
 *
 * @param {?} currentView The current view
 * @param {?} arr The array in which the hooks are found
 * @param {?=} initPhase
 * @return {?}
 */
export function callHooks(currentView, arr, initPhase) {
    /** @type {?} */
    let initHooksCount = 0;
    for (let i = 0; i < arr.length; i += 2) {
        /** @type {?} */
        const isInitHook = arr[i] < 0;
        /** @type {?} */
        const directiveIndex = isInitHook ? -arr[i] : (/** @type {?} */ (arr[i]));
        /** @type {?} */
        const directive = currentView[directiveIndex];
        /** @type {?} */
        const hook = (/** @type {?} */ (arr[i + 1]));
        if (isInitHook) {
            initHooksCount++;
            /** @type {?} */
            const indexWithintInitPhase = currentView[FLAGS] >> 10 /* IndexWithinInitPhaseShift */;
            // The init phase state must be always checked here as it may have been recursively updated
            if (indexWithintInitPhase < initHooksCount &&
                (currentView[FLAGS] & 3 /* InitPhaseStateMask */) === initPhase) {
                currentView[FLAGS] += 1024 /* IndexWithinInitPhaseIncrementer */;
                hook.call(directive);
            }
        }
        else {
            hook.call(directive);
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaG9va3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2hvb2tzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUFDLFdBQVcsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBSTNDLE9BQU8sRUFBQyxLQUFLLEVBQXFELE1BQU0sbUJBQW1CLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7QUFrQjVGLE1BQU0sVUFBVSxxQkFBcUIsQ0FDakMsY0FBc0IsRUFBRSxZQUErQixFQUFFLEtBQVk7SUFDdkUsU0FBUztRQUNMLFdBQVcsQ0FBQyxLQUFLLENBQUMsaUJBQWlCLEVBQUUsSUFBSSxFQUFFLDhDQUE4QyxDQUFDLENBQUM7VUFFekYsRUFBQyxTQUFTLEVBQUUsTUFBTSxFQUFFLE9BQU8sRUFBQyxHQUFHLFlBQVk7SUFFakQsSUFBSSxTQUFTLEVBQUU7UUFDYixDQUFDLEtBQUssQ0FBQyxTQUFTLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLGNBQWMsRUFBRSxTQUFTLENBQUMsQ0FBQztRQUM1RSxDQUFDLEtBQUssQ0FBQyxVQUFVLElBQUksQ0FBQyxLQUFLLENBQUMsVUFBVSxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLGNBQWMsRUFBRSxTQUFTLENBQUMsQ0FBQztLQUMvRTtJQUVELElBQUksTUFBTSxFQUFFO1FBQ1YsQ0FBQyxLQUFLLENBQUMsU0FBUyxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLGNBQWMsRUFBRSxNQUFNLENBQUMsQ0FBQztLQUMzRTtJQUVELElBQUksT0FBTyxFQUFFO1FBQ1gsQ0FBQyxLQUFLLENBQUMsU0FBUyxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsR0FBRyxF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VSxFQUFFO1lBQ2QsY0FBYyxFQUFFLENBQUM7O2tCQUNYLHFCQUFxQixHQUFHLFdBQVcsQ0FBQyxLQUFLLENBQUMsc0NBQXdDO1lBQ3hGLDJGQUEyRjtZQUMzRixJQUFJLHFCQUFxQixHQUFHLGNBQWM7Z0JBQ3RDLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyw2QkFBZ0MsQ0FBQyxLQUFLLFNBQVMsRUFBRTtnQkFDdEUsV0FBVyxDQUFDLEtBQUssQ0FBQyw4Q0FBOEMsQ0FBQztnQkFDakUsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQzthQUN0QjtTQUNGO2FBQU07WUFDTCxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1NBQ3RCO0tBQ0Y7QUFDSCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge2Fzc2VydEVxdWFsfSBmcm9tICcuLi91dGlsL2Fzc2VydCc7XG5cbmltcG9ydCB7RGlyZWN0aXZlRGVmfSBmcm9tICcuL2ludGVyZmFjZXMvZGVmaW5pdGlvbic7XG5pbXBvcnQge1ROb2RlfSBmcm9tICcuL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge0ZMQUdTLCBIb29rRGF0YSwgSW5pdFBoYXNlU3RhdGUsIExWaWV3LCBMVmlld0ZsYWdzLCBUVmlld30gZnJvbSAnLi9pbnRlcmZhY2VzL3ZpZXcnO1xuXG5cblxuLyoqXG4gKiBBZGRzIGFsbCBkaXJlY3RpdmUgbGlmZWN5Y2xlIGhvb2tzIGZyb20gdGhlIGdpdmVuIGBEaXJlY3RpdmVEZWZgIHRvIHRoZSBnaXZlbiBgVFZpZXdgLlxuICpcbiAqIE11c3QgYmUgcnVuICpvbmx5KiBvbiB0aGUgZmlyc3QgdGVtcGxhdGUgcGFzcy5cbiAqXG4gKiBUaGUgVFZpZXcncyBob29rcyBhcnJheXMgYXJlIGFycmFuZ2VkIGluIGFsdGVybmF0aW5nIHBhaXJzIG9mIGRpcmVjdGl2ZUluZGV4IGFuZCBob29rRnVuY3Rpb24sXG4gKiBpLmUuOiBgW2RpcmVjdGl2ZUluZGV4QSwgaG9va0Z1bmN0aW9uQSwgZGlyZWN0aXZlSW5kZXhCLCBob29rRnVuY3Rpb25CLCAuLi5dYC4gRm9yIGBPbkNoYW5nZXNgXG4gKiBob29rcywgdGhlIGBkaXJlY3RpdmVJbmRleGAgd2lsbCBiZSAqbmVnYXRpdmUqLCBzaWduYWxpbmcge0BsaW5rIGNhbGxIb29rc30gdGhhdCB0aGVcbiAqIGBob29rRnVuY3Rpb25gIG11c3QgYmUgcGFzc2VkIHRoZSB0aGUgYXBwcm9wcmlhdGUge0BsaW5rIFNpbXBsZUNoYW5nZXN9IG9iamVjdC5cbiAqXG4gKiBAcGFyYW0gZGlyZWN0aXZlSW5kZXggVGhlIGluZGV4IG9mIHRoZSBkaXJlY3RpdmUgaW4gTFZpZXdcbiAqIEBwYXJhbSBkaXJlY3RpdmVEZWYgVGhlIGRlZmluaXRpb24gY29udGFpbmluZyB0aGUgaG9va3MgdG8gc2V0dXAgaW4gdFZpZXdcbiAqIEBwYXJhbSB0VmlldyBUaGUgY3VycmVudCBUVmlld1xuICovXG5leHBvcnQgZnVuY3Rpb24gcmVnaXN0ZXJQcmVPcmRlckhvb2tzKFxuICAgIGRpcmVjdGl2ZUluZGV4OiBudW1iZXIsIGRpcmVjdGl2ZURlZjogRGlyZWN0aXZlRGVmPGFueT4sIHRWaWV3OiBUVmlldyk6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiZcbiAgICAgIGFzc2VydEVxdWFsKHRWaWV3LmZpcnN0VGVtcGxhdGVQYXNzLCB0cnVlLCAnU2hvdWxkIG9ubHkgYmUgY2FsbGVkIG9uIGZpcnN0IHRlbXBsYXRlIHBhc3MnKTtcblxuICBjb25zdCB7b25DaGFuZ2VzLCBvbkluaXQsIGRvQ2hlY2t9ID0gZGlyZWN0aXZlRGVmO1xuXG4gIGlmIChvbkNoYW5nZXMpIHtcbiAgICAodFZpZXcuaW5pdEhvb2tzIHx8ICh0Vmlldy5pbml0SG9va3MgPSBbXSkpLnB1c2goZGlyZWN0aXZlSW5kZXgsIG9uQ2hhbmdlcyk7XG4gICAgKHRWaWV3LmNoZWNrSG9va3MgfHwgKHRWaWV3LmNoZWNrSG9va3MgPSBbXSkpLnB1c2goZGlyZWN0aXZlSW5kZXgsIG9uQ2hhbmdlcyk7XG4gIH1cblxuICBpZiAob25Jbml0KSB7XG4gICAgKHRWaWV3LmluaXRIb29rcyB8fCAodFZpZXcuaW5pdEhvb2tzID0gW10pKS5wdXNoKC1kaXJlY3RpdmVJbmRleCwgb25Jbml0KTtcbiAgfVxuXG4gIGlmIChkb0NoZWNrKSB7XG4gICAgKHRWaWV3LmluaXRIb29rcyB8fCAodFZpZXcuaW5pdEhvb2tzID0gW10pKS5wdXNoKGRpcmVjdGl2ZUluZGV4LCBkb0NoZWNrKTtcbiAgICAodFZpZXcuY2hlY2tIb29rcyB8fCAodFZpZXcuY2hlY2tIb29rcyA9IFtdKSkucHVzaChkaXJlY3RpdmVJbmRleCwgZG9DaGVjayk7XG4gIH1cbn1cblxuLyoqXG4gKlxuICogTG9vcHMgdGhyb3VnaCB0aGUgZGlyZWN0aXZlcyBvbiB0aGUgcHJvdmlkZWQgYHROb2RlYCBhbmQgcXVldWVzIGhvb2tzIHRvIGJlXG4gKiBydW4gdGhhdCBhcmUgbm90IGluaXRpYWxpemF0aW9uIGhvb2tzLlxuICpcbiAqIFNob3VsZCBiZSBleGVjdXRlZCBkdXJpbmcgYGVsZW1lbnRFbmQoKWAgYW5kIHNpbWlsYXIgdG9cbiAqIHByZXNlcnZlIGhvb2sgZXhlY3V0aW9uIG9yZGVyLiBDb250ZW50LCB2aWV3LCBhbmQgZGVzdHJveSBob29rcyBmb3IgcHJvamVjdGVkXG4gKiBjb21wb25lbnRzIGFuZCBkaXJlY3RpdmVzIG11c3QgYmUgY2FsbGVkICpiZWZvcmUqIHRoZWlyIGhvc3RzLlxuICpcbiAqIFNldHMgdXAgdGhlIGNvbnRlbnQsIHZpZXcsIGFuZCBkZXN0cm95IGhvb2tzIG9uIHRoZSBwcm92aWRlZCBgdFZpZXdgIHN1Y2ggdGhhdFxuICogdGhleSdyZSBhZGRlZCBpbiBhbHRlcm5hdGluZyBwYWlycyBvZiBkaXJlY3RpdmVJbmRleCBhbmQgaG9va0Z1bmN0aW9uLFxuICogaS5lLjogYFtkaXJlY3RpdmVJbmRleEEsIGhvb2tGdW5jdGlvbkEsIGRpcmVjdGl2ZUluZGV4QiwgaG9va0Z1bmN0aW9uQiwgLi4uXWBcbiAqXG4gKiBOT1RFOiBUaGlzIGRvZXMgbm90IHNldCB1cCBgb25DaGFuZ2VzYCwgYG9uSW5pdGAgb3IgYGRvQ2hlY2tgLCB0aG9zZSBhcmUgc2V0IHVwXG4gKiBzZXBhcmF0ZWx5IGF0IGBlbGVtZW50U3RhcnRgLlxuICpcbiAqIEBwYXJhbSB0VmlldyBUaGUgY3VycmVudCBUVmlld1xuICogQHBhcmFtIHROb2RlIFRoZSBUTm9kZSB3aG9zZSBkaXJlY3RpdmVzIGFyZSB0byBiZSBzZWFyY2hlZCBmb3IgaG9va3MgdG8gcXVldWVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlZ2lzdGVyUG9zdE9yZGVySG9va3ModFZpZXc6IFRWaWV3LCB0Tm9kZTogVE5vZGUpOiB2b2lkIHtcbiAgaWYgKHRWaWV3LmZpcnN0VGVtcGxhdGVQYXNzKSB7XG4gICAgLy8gSXQncyBuZWNlc3NhcnkgdG8gbG9vcCB0aHJvdWdoIHRoZSBkaXJlY3RpdmVzIGF0IGVsZW1lbnRFbmQoKSAocmF0aGVyIHRoYW4gcHJvY2Vzc2luZyBpblxuICAgIC8vIGRpcmVjdGl2ZUNyZWF0ZSkgc28gd2UgY2FuIHByZXNlcnZlIHRoZSBjdXJyZW50IGhvb2sgb3JkZXIuIENvbnRlbnQsIHZpZXcsIGFuZCBkZXN0cm95XG4gICAgLy8gaG9va3MgZm9yIHByb2plY3RlZCBjb21wb25lbnRzIGFuZCBkaXJlY3RpdmVzIG11c3QgYmUgY2FsbGVkICpiZWZvcmUqIHRoZWlyIGhvc3RzLlxuICAgIGZvciAobGV0IGkgPSB0Tm9kZS5kaXJlY3RpdmVTdGFydCwgZW5kID0gdE5vZGUuZGlyZWN0aXZlRW5kOyBpIDwgZW5kOyBpKyspIHtcbiAgICAgIGNvbnN0IGRpcmVjdGl2ZURlZiA9IHRWaWV3LmRhdGFbaV0gYXMgRGlyZWN0aXZlRGVmPGFueT47XG4gICAgICBpZiAoZGlyZWN0aXZlRGVmLmFmdGVyQ29udGVudEluaXQpIHtcbiAgICAgICAgKHRWaWV3LmNvbnRlbnRIb29rcyB8fCAodFZpZXcuY29udGVudEhvb2tzID0gW10pKS5wdXNoKC1pLCBkaXJlY3RpdmVEZWYuYWZ0ZXJDb250ZW50SW5pdCk7XG4gICAgICB9XG5cbiAgICAgIGlmIChkaXJlY3RpdmVEZWYuYWZ0ZXJDb250ZW50Q2hlY2tlZCkge1xuICAgICAgICAodFZpZXcuY29udGVudEhvb2tzIHx8ICh0Vmlldy5jb250ZW50SG9va3MgPSBbXSkpLnB1c2goaSwgZGlyZWN0aXZlRGVmLmFmdGVyQ29udGVudENoZWNrZWQpO1xuICAgICAgICAodFZpZXcuY29udGVudENoZWNrSG9va3MgfHwgKHRWaWV3LmNvbnRlbnRDaGVja0hvb2tzID0gW1xuICAgICAgICAgXSkpLnB1c2goaSwgZGlyZWN0aXZlRGVmLmFmdGVyQ29udGVudENoZWNrZWQpO1xuICAgICAgfVxuXG4gICAgICBpZiAoZGlyZWN0aXZlRGVmLmFmdGVyVmlld0luaXQpIHtcbiAgICAgICAgKHRWaWV3LnZpZXdIb29rcyB8fCAodFZpZXcudmlld0hvb2tzID0gW10pKS5wdXNoKC1pLCBkaXJlY3RpdmVEZWYuYWZ0ZXJWaWV3SW5pdCk7XG4gICAgICB9XG5cbiAgICAgIGlmIChkaXJlY3RpdmVEZWYuYWZ0ZXJWaWV3Q2hlY2tlZCkge1xuICAgICAgICAodFZpZXcudmlld0hvb2tzIHx8ICh0Vmlldy52aWV3SG9va3MgPSBbXSkpLnB1c2goaSwgZGlyZWN0aXZlRGVmLmFmdGVyVmlld0NoZWNrZWQpO1xuICAgICAgICAodFZpZXcudmlld0NoZWNrSG9va3MgfHwgKHRWaWV3LnZpZXdDaGVja0hvb2tzID0gW1xuICAgICAgICAgXSkpLnB1c2goaSwgZGlyZWN0aXZlRGVmLmFmdGVyVmlld0NoZWNrZWQpO1xuICAgICAgfVxuXG4gICAgICBpZiAoZGlyZWN0aXZlRGVmLm9uRGVzdHJveSAhPSBudWxsKSB7XG4gICAgICAgICh0Vmlldy5kZXN0cm95SG9va3MgfHwgKHRWaWV3LmRlc3Ryb3lIb29rcyA9IFtdKSkucHVzaChpLCBkaXJlY3RpdmVEZWYub25EZXN0cm95KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBFeGVjdXRlcyBuZWNlc3NhcnkgaG9va3MgYXQgdGhlIHN0YXJ0IG9mIGV4ZWN1dGluZyBhIHRlbXBsYXRlLlxuICpcbiAqIEV4ZWN1dGVzIGhvb2tzIHRoYXQgYXJlIHRvIGJlIHJ1biBkdXJpbmcgdGhlIGluaXRpYWxpemF0aW9uIG9mIGEgZGlyZWN0aXZlIHN1Y2hcbiAqIGFzIGBvbkNoYW5nZXNgLCBgb25Jbml0YCwgYW5kIGBkb0NoZWNrYC5cbiAqXG4gKiBIYXMgdGhlIHNpZGUgZWZmZWN0IG9mIHVwZGF0aW5nIHRoZSBSdW5Jbml0IGZsYWcgaW4gYGxWaWV3YCB0byBiZSBgMGAsIHNvIHRoYXRcbiAqIHRoaXMgaXNuJ3QgcnVuIGEgc2Vjb25kIHRpbWUuXG4gKlxuICogQHBhcmFtIGxWaWV3IFRoZSBjdXJyZW50IHZpZXdcbiAqIEBwYXJhbSB0VmlldyBTdGF0aWMgZGF0YSBmb3IgdGhlIHZpZXcgY29udGFpbmluZyB0aGUgaG9va3MgdG8gYmUgZXhlY3V0ZWRcbiAqIEBwYXJhbSBjaGVja05vQ2hhbmdlc01vZGUgV2hldGhlciBvciBub3Qgd2UncmUgaW4gY2hlY2tOb0NoYW5nZXMgbW9kZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGV4ZWN1dGVJbml0SG9va3MoXG4gICAgY3VycmVudFZpZXc6IExWaWV3LCB0VmlldzogVFZpZXcsIGNoZWNrTm9DaGFuZ2VzTW9kZTogYm9vbGVhbik6IHZvaWQge1xuICBpZiAoIWNoZWNrTm9DaGFuZ2VzTW9kZSkge1xuICAgIGV4ZWN1dGVIb29rcyhcbiAgICAgICAgY3VycmVudFZpZXcsIHRWaWV3LmluaXRIb29rcywgdFZpZXcuY2hlY2tIb29rcywgY2hlY2tOb0NoYW5nZXNNb2RlLFxuICAgICAgICBJbml0UGhhc2VTdGF0ZS5PbkluaXRIb29rc1RvQmVSdW4pO1xuICB9XG59XG5cbi8qKlxuICogRXhlY3V0ZXMgaG9va3MgYWdhaW5zdCB0aGUgZ2l2ZW4gYExWaWV3YCBiYXNlZCBvZmYgb2Ygd2hldGhlciBvciBub3RcbiAqIFRoaXMgaXMgdGhlIGZpcnN0IHBhc3MuXG4gKlxuICogQHBhcmFtIGxWaWV3IFRoZSB2aWV3IGluc3RhbmNlIGRhdGEgdG8gcnVuIHRoZSBob29rcyBhZ2FpbnN0XG4gKiBAcGFyYW0gZmlyc3RQYXNzSG9va3MgQW4gYXJyYXkgb2YgaG9va3MgdG8gcnVuIGlmIHdlJ3JlIGluIHRoZSBmaXJzdCB2aWV3IHBhc3NcbiAqIEBwYXJhbSBjaGVja0hvb2tzIEFuIEFycmF5IG9mIGhvb2tzIHRvIHJ1biBpZiB3ZSdyZSBub3QgaW4gdGhlIGZpcnN0IHZpZXcgcGFzcy5cbiAqIEBwYXJhbSBjaGVja05vQ2hhbmdlc01vZGUgV2hldGhlciBvciBub3Qgd2UncmUgaW4gbm8gY2hhbmdlcyBtb2RlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZXhlY3V0ZUhvb2tzKFxuICAgIGN1cnJlbnRWaWV3OiBMVmlldywgZmlyc3RQYXNzSG9va3M6IEhvb2tEYXRhIHwgbnVsbCwgY2hlY2tIb29rczogSG9va0RhdGEgfCBudWxsLFxuICAgIGNoZWNrTm9DaGFuZ2VzTW9kZTogYm9vbGVhbiwgaW5pdFBoYXNlOiBudW1iZXIpOiB2b2lkIHtcbiAgaWYgKGNoZWNrTm9DaGFuZ2VzTW9kZSkgcmV0dXJuO1xuICBjb25zdCBob29rc1RvQ2FsbCA9IChjdXJyZW50Vmlld1tGTEFHU10gJiBMVmlld0ZsYWdzLkluaXRQaGFzZVN0YXRlTWFzaykgPT09IGluaXRQaGFzZSA/XG4gICAgICBmaXJzdFBhc3NIb29rcyA6XG4gICAgICBjaGVja0hvb2tzO1xuICBpZiAoaG9va3NUb0NhbGwpIHtcbiAgICBjYWxsSG9va3MoY3VycmVudFZpZXcsIGhvb2tzVG9DYWxsLCBpbml0UGhhc2UpO1xuICB9XG4gIC8vIFRoZSBpbml0IHBoYXNlIHN0YXRlIG11c3QgYmUgYWx3YXlzIGNoZWNrZWQgaGVyZSBhcyBpdCBtYXkgaGF2ZSBiZWVuIHJlY3Vyc2l2ZWx5IHVwZGF0ZWRcbiAgaWYgKChjdXJyZW50Vmlld1tGTEFHU10gJiBMVmlld0ZsYWdzLkluaXRQaGFzZVN0YXRlTWFzaykgPT09IGluaXRQaGFzZSAmJlxuICAgICAgaW5pdFBoYXNlICE9PSBJbml0UGhhc2VTdGF0ZS5Jbml0UGhhc2VDb21wbGV0ZWQpIHtcbiAgICBjdXJyZW50Vmlld1tGTEFHU10gJj0gTFZpZXdGbGFncy5JbmRleFdpdGhpbkluaXRQaGFzZVJlc2V0O1xuICAgIGN1cnJlbnRWaWV3W0ZMQUdTXSArPSBMVmlld0ZsYWdzLkluaXRQaGFzZVN0YXRlSW5jcmVtZW50ZXI7XG4gIH1cbn1cblxuLyoqXG4gKiBDYWxscyBsaWZlY3ljbGUgaG9va3Mgd2l0aCB0aGVpciBjb250ZXh0cywgc2tpcHBpbmcgaW5pdCBob29rcyBpZiBpdCdzIG5vdFxuICogdGhlIGZpcnN0IExWaWV3IHBhc3NcbiAqXG4gKiBAcGFyYW0gY3VycmVudFZpZXcgVGhlIGN1cnJlbnQgdmlld1xuICogQHBhcmFtIGFyciBUaGUgYXJyYXkgaW4gd2hpY2ggdGhlIGhvb2tzIGFyZSBmb3VuZFxuICovXG5leHBvcnQgZnVuY3Rpb24gY2FsbEhvb2tzKGN1cnJlbnRWaWV3OiBMVmlldywgYXJyOiBIb29rRGF0YSwgaW5pdFBoYXNlPzogbnVtYmVyKTogdm9pZCB7XG4gIGxldCBpbml0SG9va3NDb3VudCA9IDA7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgYXJyLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgY29uc3QgaXNJbml0SG9vayA9IGFycltpXSA8IDA7XG4gICAgY29uc3QgZGlyZWN0aXZlSW5kZXggPSBpc0luaXRIb29rID8gLWFycltpXSA6IGFycltpXSBhcyBudW1iZXI7XG4gICAgY29uc3QgZGlyZWN0aXZlID0gY3VycmVudFZpZXdbZGlyZWN0aXZlSW5kZXhdO1xuICAgIGNvbnN0IGhvb2sgPSBhcnJbaSArIDFdIGFzKCkgPT4gdm9pZDtcbiAgICBpZiAoaXNJbml0SG9vaykge1xuICAgICAgaW5pdEhvb2tzQ291bnQrKztcbiAgICAgIGNvbnN0IGluZGV4V2l0aGludEluaXRQaGFzZSA9IGN1cnJlbnRWaWV3W0ZMQUdTXSA+PiBMVmlld0ZsYWdzLkluZGV4V2l0aGluSW5pdFBoYXNlU2hpZnQ7XG4gICAgICAvLyBUaGUgaW5pdCBwaGFzZSBzdGF0ZSBtdXN0IGJlIGFsd2F5cyBjaGVja2VkIGhlcmUgYXMgaXQgbWF5IGhhdmUgYmVlbiByZWN1cnNpdmVseSB1cGRhdGVkXG4gICAgICBpZiAoaW5kZXhXaXRoaW50SW5pdFBoYXNlIDwgaW5pdEhvb2tzQ291bnQgJiZcbiAgICAgICAgICAoY3VycmVudFZpZXdbRkxBR1NdICYgTFZpZXdGbGFncy5Jbml0UGhhc2VTdGF0ZU1hc2spID09PSBpbml0UGhhc2UpIHtcbiAgICAgICAgY3VycmVudFZpZXdbRkxBR1NdICs9IExWaWV3RmxhZ3MuSW5kZXhXaXRoaW5Jbml0UGhhc2VJbmNyZW1lbnRlcjtcbiAgICAgICAgaG9vay5jYWxsKGRpcmVjdGl2ZSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGhvb2suY2FsbChkaXJlY3RpdmUpO1xuICAgIH1cbiAgfVxufVxuIl19