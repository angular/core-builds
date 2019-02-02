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
 * hooks, the `directiveIndex` will be *negative*, signaling {@link callHooks} that the
 * `hookFunction` must be passed the the appropriate {@link SimpleChanges} object.
 *
 * @param directiveIndex The index of the directive in LView
 * @param directiveDef The definition containing the hooks to setup in tView
 * @param tView The current TView
 */
export function registerPreOrderHooks(directiveIndex, directiveDef, tView) {
    ngDevMode &&
        assertEqual(tView.firstTemplatePass, true, 'Should only be called on first template pass');
    var onChanges = directiveDef.onChanges, onInit = directiveDef.onInit, doCheck = directiveDef.doCheck;
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
 * Executes necessary hooks at the start of executing a template.
 *
 * Executes hooks that are to be run during the initialization of a directive such
 * as `onChanges`, `onInit`, and `doCheck`.
 *
 * Has the side effect of updating the RunInit flag in `lView` to be `0`, so that
 * this isn't run a second time.
 *
 * @param lView The current view
 * @param tView Static data for the view containing the hooks to be executed
 * @param checkNoChangesMode Whether or not we're in checkNoChanges mode.
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
 * @param lView The view instance data to run the hooks against
 * @param firstPassHooks An array of hooks to run if we're in the first view pass
 * @param checkHooks An Array of hooks to run if we're not in the first view pass.
 * @param checkNoChangesMode Whether or not we're in no changes mode.
 */
export function executeHooks(currentView, firstPassHooks, checkHooks, checkNoChangesMode, initPhase) {
    if (checkNoChangesMode)
        return;
    var hooksToCall = (currentView[FLAGS] & 3 /* InitPhaseStateMask */) === initPhase ?
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
 * @param currentView The current view
 * @param arr The array in which the hooks are found
 */
export function callHooks(currentView, arr, initPhase) {
    var initHooksCount = 0;
    for (var i = 0; i < arr.length; i += 2) {
        var isInitHook = arr[i] < 0;
        var directiveIndex = isInitHook ? -arr[i] : arr[i];
        var directive = currentView[directiveIndex];
        var hook = arr[i + 1];
        if (isInitHook) {
            initHooksCount++;
            var indexWithintInitPhase = currentView[FLAGS] >> 10 /* IndexWithinInitPhaseShift */;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaG9va3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2hvb2tzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxXQUFXLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUkzQyxPQUFPLEVBQUMsS0FBSyxFQUFxRCxNQUFNLG1CQUFtQixDQUFDO0FBSTVGOzs7Ozs7Ozs7Ozs7O0dBYUc7QUFDSCxNQUFNLFVBQVUscUJBQXFCLENBQ2pDLGNBQXNCLEVBQUUsWUFBK0IsRUFBRSxLQUFZO0lBQ3ZFLFNBQVM7UUFDTCxXQUFXLENBQUMsS0FBSyxDQUFDLGlCQUFpQixFQUFFLElBQUksRUFBRSw4Q0FBOEMsQ0FBQyxDQUFDO0lBRXhGLElBQUEsa0NBQVMsRUFBRSw0QkFBTSxFQUFFLDhCQUFPLENBQWlCO0lBRWxELElBQUksU0FBUyxFQUFFO1FBQ2IsQ0FBQyxLQUFLLENBQUMsU0FBUyxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxjQUFjLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFDNUUsQ0FBQyxLQUFLLENBQUMsVUFBVSxJQUFJLENBQUMsS0FBSyxDQUFDLFVBQVUsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxjQUFjLEVBQUUsU0FBUyxDQUFDLENBQUM7S0FDL0U7SUFFRCxJQUFJLE1BQU0sRUFBRTtRQUNWLENBQUMsS0FBSyxDQUFDLFNBQVMsSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxjQUFjLEVBQUUsTUFBTSxDQUFDLENBQUM7S0FDM0U7SUFFRCxJQUFJLE9BQU8sRUFBRTtRQUNYLENBQUMsS0FBSyxDQUFDLFNBQVMsSUFBSSxDQUFDLEtBQUssQ0FB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QzlDLElBQU0sSUFBSSxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFjLENBQUM7UUFDckMsSUFBSSxVQUFVLEVBQUU7WUFDZCxjQUFjLEVBQUUsQ0FBQztZQUNqQixJQUFNLHFCQUFxQixHQUFHLFdBQVcsQ0FBQyxLQUFLLENBQUMsc0NBQXdDLENBQUM7WUFDekYsMkZBQTJGO1lBQzNGLElBQUkscUJBQXFCLEdBQUcsY0FBYztnQkFDdEMsQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLDZCQUFnQyxDQUFDLEtBQUssU0FBUyxFQUFFO2dCQUN0RSxXQUFXLENBQUMsS0FBSyxDQUFDLDhDQUE4QyxDQUFDO2dCQUNqRSxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO2FBQ3RCO1NBQ0Y7YUFBTTtZQUNMLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7U0FDdEI7S0FDRjtBQUNILENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7YXNzZXJ0RXF1YWx9IGZyb20gJy4uL3V0aWwvYXNzZXJ0JztcblxuaW1wb3J0IHtEaXJlY3RpdmVEZWZ9IGZyb20gJy4vaW50ZXJmYWNlcy9kZWZpbml0aW9uJztcbmltcG9ydCB7VE5vZGV9IGZyb20gJy4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7RkxBR1MsIEhvb2tEYXRhLCBJbml0UGhhc2VTdGF0ZSwgTFZpZXcsIExWaWV3RmxhZ3MsIFRWaWV3fSBmcm9tICcuL2ludGVyZmFjZXMvdmlldyc7XG5cblxuXG4vKipcbiAqIEFkZHMgYWxsIGRpcmVjdGl2ZSBsaWZlY3ljbGUgaG9va3MgZnJvbSB0aGUgZ2l2ZW4gYERpcmVjdGl2ZURlZmAgdG8gdGhlIGdpdmVuIGBUVmlld2AuXG4gKlxuICogTXVzdCBiZSBydW4gKm9ubHkqIG9uIHRoZSBmaXJzdCB0ZW1wbGF0ZSBwYXNzLlxuICpcbiAqIFRoZSBUVmlldydzIGhvb2tzIGFycmF5cyBhcmUgYXJyYW5nZWQgaW4gYWx0ZXJuYXRpbmcgcGFpcnMgb2YgZGlyZWN0aXZlSW5kZXggYW5kIGhvb2tGdW5jdGlvbixcbiAqIGkuZS46IGBbZGlyZWN0aXZlSW5kZXhBLCBob29rRnVuY3Rpb25BLCBkaXJlY3RpdmVJbmRleEIsIGhvb2tGdW5jdGlvbkIsIC4uLl1gLiBGb3IgYE9uQ2hhbmdlc2BcbiAqIGhvb2tzLCB0aGUgYGRpcmVjdGl2ZUluZGV4YCB3aWxsIGJlICpuZWdhdGl2ZSosIHNpZ25hbGluZyB7QGxpbmsgY2FsbEhvb2tzfSB0aGF0IHRoZVxuICogYGhvb2tGdW5jdGlvbmAgbXVzdCBiZSBwYXNzZWQgdGhlIHRoZSBhcHByb3ByaWF0ZSB7QGxpbmsgU2ltcGxlQ2hhbmdlc30gb2JqZWN0LlxuICpcbiAqIEBwYXJhbSBkaXJlY3RpdmVJbmRleCBUaGUgaW5kZXggb2YgdGhlIGRpcmVjdGl2ZSBpbiBMVmlld1xuICogQHBhcmFtIGRpcmVjdGl2ZURlZiBUaGUgZGVmaW5pdGlvbiBjb250YWluaW5nIHRoZSBob29rcyB0byBzZXR1cCBpbiB0Vmlld1xuICogQHBhcmFtIHRWaWV3IFRoZSBjdXJyZW50IFRWaWV3XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZWdpc3RlclByZU9yZGVySG9va3MoXG4gICAgZGlyZWN0aXZlSW5kZXg6IG51bWJlciwgZGlyZWN0aXZlRGVmOiBEaXJlY3RpdmVEZWY8YW55PiwgdFZpZXc6IFRWaWV3KTogdm9pZCB7XG4gIG5nRGV2TW9kZSAmJlxuICAgICAgYXNzZXJ0RXF1YWwodFZpZXcuZmlyc3RUZW1wbGF0ZVBhc3MsIHRydWUsICdTaG91bGQgb25seSBiZSBjYWxsZWQgb24gZmlyc3QgdGVtcGxhdGUgcGFzcycpO1xuXG4gIGNvbnN0IHtvbkNoYW5nZXMsIG9uSW5pdCwgZG9DaGVja30gPSBkaXJlY3RpdmVEZWY7XG5cbiAgaWYgKG9uQ2hhbmdlcykge1xuICAgICh0Vmlldy5pbml0SG9va3MgfHwgKHRWaWV3LmluaXRIb29rcyA9IFtdKSkucHVzaChkaXJlY3RpdmVJbmRleCwgb25DaGFuZ2VzKTtcbiAgICAodFZpZXcuY2hlY2tIb29rcyB8fCAodFZpZXcuY2hlY2tIb29rcyA9IFtdKSkucHVzaChkaXJlY3RpdmVJbmRleCwgb25DaGFuZ2VzKTtcbiAgfVxuXG4gIGlmIChvbkluaXQpIHtcbiAgICAodFZpZXcuaW5pdEhvb2tzIHx8ICh0Vmlldy5pbml0SG9va3MgPSBbXSkpLnB1c2goLWRpcmVjdGl2ZUluZGV4LCBvbkluaXQpO1xuICB9XG5cbiAgaWYgKGRvQ2hlY2spIHtcbiAgICAodFZpZXcuaW5pdEhvb2tzIHx8ICh0Vmlldy5pbml0SG9va3MgPSBbXSkpLnB1c2goZGlyZWN0aXZlSW5kZXgsIGRvQ2hlY2spO1xuICAgICh0Vmlldy5jaGVja0hvb2tzIHx8ICh0Vmlldy5jaGVja0hvb2tzID0gW10pKS5wdXNoKGRpcmVjdGl2ZUluZGV4LCBkb0NoZWNrKTtcbiAgfVxufVxuXG4vKipcbiAqXG4gKiBMb29wcyB0aHJvdWdoIHRoZSBkaXJlY3RpdmVzIG9uIHRoZSBwcm92aWRlZCBgdE5vZGVgIGFuZCBxdWV1ZXMgaG9va3MgdG8gYmVcbiAqIHJ1biB0aGF0IGFyZSBub3QgaW5pdGlhbGl6YXRpb24gaG9va3MuXG4gKlxuICogU2hvdWxkIGJlIGV4ZWN1dGVkIGR1cmluZyBgZWxlbWVudEVuZCgpYCBhbmQgc2ltaWxhciB0b1xuICogcHJlc2VydmUgaG9vayBleGVjdXRpb24gb3JkZXIuIENvbnRlbnQsIHZpZXcsIGFuZCBkZXN0cm95IGhvb2tzIGZvciBwcm9qZWN0ZWRcbiAqIGNvbXBvbmVudHMgYW5kIGRpcmVjdGl2ZXMgbXVzdCBiZSBjYWxsZWQgKmJlZm9yZSogdGhlaXIgaG9zdHMuXG4gKlxuICogU2V0cyB1cCB0aGUgY29udGVudCwgdmlldywgYW5kIGRlc3Ryb3kgaG9va3Mgb24gdGhlIHByb3ZpZGVkIGB0Vmlld2Agc3VjaCB0aGF0XG4gKiB0aGV5J3JlIGFkZGVkIGluIGFsdGVybmF0aW5nIHBhaXJzIG9mIGRpcmVjdGl2ZUluZGV4IGFuZCBob29rRnVuY3Rpb24sXG4gKiBpLmUuOiBgW2RpcmVjdGl2ZUluZGV4QSwgaG9va0Z1bmN0aW9uQSwgZGlyZWN0aXZlSW5kZXhCLCBob29rRnVuY3Rpb25CLCAuLi5dYFxuICpcbiAqIE5PVEU6IFRoaXMgZG9lcyBub3Qgc2V0IHVwIGBvbkNoYW5nZXNgLCBgb25Jbml0YCBvciBgZG9DaGVja2AsIHRob3NlIGFyZSBzZXQgdXBcbiAqIHNlcGFyYXRlbHkgYXQgYGVsZW1lbnRTdGFydGAuXG4gKlxuICogQHBhcmFtIHRWaWV3IFRoZSBjdXJyZW50IFRWaWV3XG4gKiBAcGFyYW0gdE5vZGUgVGhlIFROb2RlIHdob3NlIGRpcmVjdGl2ZXMgYXJlIHRvIGJlIHNlYXJjaGVkIGZvciBob29rcyB0byBxdWV1ZVxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVnaXN0ZXJQb3N0T3JkZXJIb29rcyh0VmlldzogVFZpZXcsIHROb2RlOiBUTm9kZSk6IHZvaWQge1xuICBpZiAodFZpZXcuZmlyc3RUZW1wbGF0ZVBhc3MpIHtcbiAgICAvLyBJdCdzIG5lY2Vzc2FyeSB0byBsb29wIHRocm91Z2ggdGhlIGRpcmVjdGl2ZXMgYXQgZWxlbWVudEVuZCgpIChyYXRoZXIgdGhhbiBwcm9jZXNzaW5nIGluXG4gICAgLy8gZGlyZWN0aXZlQ3JlYXRlKSBzbyB3ZSBjYW4gcHJlc2VydmUgdGhlIGN1cnJlbnQgaG9vayBvcmRlci4gQ29udGVudCwgdmlldywgYW5kIGRlc3Ryb3lcbiAgICAvLyBob29rcyBmb3IgcHJvamVjdGVkIGNvbXBvbmVudHMgYW5kIGRpcmVjdGl2ZXMgbXVzdCBiZSBjYWxsZWQgKmJlZm9yZSogdGhlaXIgaG9zdHMuXG4gICAgZm9yIChsZXQgaSA9IHROb2RlLmRpcmVjdGl2ZVN0YXJ0LCBlbmQgPSB0Tm9kZS5kaXJlY3RpdmVFbmQ7IGkgPCBlbmQ7IGkrKykge1xuICAgICAgY29uc3QgZGlyZWN0aXZlRGVmID0gdFZpZXcuZGF0YVtpXSBhcyBEaXJlY3RpdmVEZWY8YW55PjtcbiAgICAgIGlmIChkaXJlY3RpdmVEZWYuYWZ0ZXJDb250ZW50SW5pdCkge1xuICAgICAgICAodFZpZXcuY29udGVudEhvb2tzIHx8ICh0Vmlldy5jb250ZW50SG9va3MgPSBbXSkpLnB1c2goLWksIGRpcmVjdGl2ZURlZi5hZnRlckNvbnRlbnRJbml0KTtcbiAgICAgIH1cblxuICAgICAgaWYgKGRpcmVjdGl2ZURlZi5hZnRlckNvbnRlbnRDaGVja2VkKSB7XG4gICAgICAgICh0Vmlldy5jb250ZW50SG9va3MgfHwgKHRWaWV3LmNvbnRlbnRIb29rcyA9IFtdKSkucHVzaChpLCBkaXJlY3RpdmVEZWYuYWZ0ZXJDb250ZW50Q2hlY2tlZCk7XG4gICAgICAgICh0Vmlldy5jb250ZW50Q2hlY2tIb29rcyB8fCAodFZpZXcuY29udGVudENoZWNrSG9va3MgPSBbXG4gICAgICAgICBdKSkucHVzaChpLCBkaXJlY3RpdmVEZWYuYWZ0ZXJDb250ZW50Q2hlY2tlZCk7XG4gICAgICB9XG5cbiAgICAgIGlmIChkaXJlY3RpdmVEZWYuYWZ0ZXJWaWV3SW5pdCkge1xuICAgICAgICAodFZpZXcudmlld0hvb2tzIHx8ICh0Vmlldy52aWV3SG9va3MgPSBbXSkpLnB1c2goLWksIGRpcmVjdGl2ZURlZi5hZnRlclZpZXdJbml0KTtcbiAgICAgIH1cblxuICAgICAgaWYgKGRpcmVjdGl2ZURlZi5hZnRlclZpZXdDaGVja2VkKSB7XG4gICAgICAgICh0Vmlldy52aWV3SG9va3MgfHwgKHRWaWV3LnZpZXdIb29rcyA9IFtdKSkucHVzaChpLCBkaXJlY3RpdmVEZWYuYWZ0ZXJWaWV3Q2hlY2tlZCk7XG4gICAgICAgICh0Vmlldy52aWV3Q2hlY2tIb29rcyB8fCAodFZpZXcudmlld0NoZWNrSG9va3MgPSBbXG4gICAgICAgICBdKSkucHVzaChpLCBkaXJlY3RpdmVEZWYuYWZ0ZXJWaWV3Q2hlY2tlZCk7XG4gICAgICB9XG5cbiAgICAgIGlmIChkaXJlY3RpdmVEZWYub25EZXN0cm95ICE9IG51bGwpIHtcbiAgICAgICAgKHRWaWV3LmRlc3Ryb3lIb29rcyB8fCAodFZpZXcuZGVzdHJveUhvb2tzID0gW10pKS5wdXNoKGksIGRpcmVjdGl2ZURlZi5vbkRlc3Ryb3kpO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEV4ZWN1dGVzIG5lY2Vzc2FyeSBob29rcyBhdCB0aGUgc3RhcnQgb2YgZXhlY3V0aW5nIGEgdGVtcGxhdGUuXG4gKlxuICogRXhlY3V0ZXMgaG9va3MgdGhhdCBhcmUgdG8gYmUgcnVuIGR1cmluZyB0aGUgaW5pdGlhbGl6YXRpb24gb2YgYSBkaXJlY3RpdmUgc3VjaFxuICogYXMgYG9uQ2hhbmdlc2AsIGBvbkluaXRgLCBhbmQgYGRvQ2hlY2tgLlxuICpcbiAqIEhhcyB0aGUgc2lkZSBlZmZlY3Qgb2YgdXBkYXRpbmcgdGhlIFJ1bkluaXQgZmxhZyBpbiBgbFZpZXdgIHRvIGJlIGAwYCwgc28gdGhhdFxuICogdGhpcyBpc24ndCBydW4gYSBzZWNvbmQgdGltZS5cbiAqXG4gKiBAcGFyYW0gbFZpZXcgVGhlIGN1cnJlbnQgdmlld1xuICogQHBhcmFtIHRWaWV3IFN0YXRpYyBkYXRhIGZvciB0aGUgdmlldyBjb250YWluaW5nIHRoZSBob29rcyB0byBiZSBleGVjdXRlZFxuICogQHBhcmFtIGNoZWNrTm9DaGFuZ2VzTW9kZSBXaGV0aGVyIG9yIG5vdCB3ZSdyZSBpbiBjaGVja05vQ2hhbmdlcyBtb2RlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZXhlY3V0ZUluaXRIb29rcyhcbiAgICBjdXJyZW50VmlldzogTFZpZXcsIHRWaWV3OiBUVmlldywgY2hlY2tOb0NoYW5nZXNNb2RlOiBib29sZWFuKTogdm9pZCB7XG4gIGlmICghY2hlY2tOb0NoYW5nZXNNb2RlKSB7XG4gICAgZXhlY3V0ZUhvb2tzKFxuICAgICAgICBjdXJyZW50VmlldywgdFZpZXcuaW5pdEhvb2tzLCB0Vmlldy5jaGVja0hvb2tzLCBjaGVja05vQ2hhbmdlc01vZGUsXG4gICAgICAgIEluaXRQaGFzZVN0YXRlLk9uSW5pdEhvb2tzVG9CZVJ1bik7XG4gIH1cbn1cblxuLyoqXG4gKiBFeGVjdXRlcyBob29rcyBhZ2FpbnN0IHRoZSBnaXZlbiBgTFZpZXdgIGJhc2VkIG9mZiBvZiB3aGV0aGVyIG9yIG5vdFxuICogVGhpcyBpcyB0aGUgZmlyc3QgcGFzcy5cbiAqXG4gKiBAcGFyYW0gbFZpZXcgVGhlIHZpZXcgaW5zdGFuY2UgZGF0YSB0byBydW4gdGhlIGhvb2tzIGFnYWluc3RcbiAqIEBwYXJhbSBmaXJzdFBhc3NIb29rcyBBbiBhcnJheSBvZiBob29rcyB0byBydW4gaWYgd2UncmUgaW4gdGhlIGZpcnN0IHZpZXcgcGFzc1xuICogQHBhcmFtIGNoZWNrSG9va3MgQW4gQXJyYXkgb2YgaG9va3MgdG8gcnVuIGlmIHdlJ3JlIG5vdCBpbiB0aGUgZmlyc3QgdmlldyBwYXNzLlxuICogQHBhcmFtIGNoZWNrTm9DaGFuZ2VzTW9kZSBXaGV0aGVyIG9yIG5vdCB3ZSdyZSBpbiBubyBjaGFuZ2VzIG1vZGUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBleGVjdXRlSG9va3MoXG4gICAgY3VycmVudFZpZXc6IExWaWV3LCBmaXJzdFBhc3NIb29rczogSG9va0RhdGEgfCBudWxsLCBjaGVja0hvb2tzOiBIb29rRGF0YSB8IG51bGwsXG4gICAgY2hlY2tOb0NoYW5nZXNNb2RlOiBib29sZWFuLCBpbml0UGhhc2U6IG51bWJlcik6IHZvaWQge1xuICBpZiAoY2hlY2tOb0NoYW5nZXNNb2RlKSByZXR1cm47XG4gIGNvbnN0IGhvb2tzVG9DYWxsID0gKGN1cnJlbnRWaWV3W0ZMQUdTXSAmIExWaWV3RmxhZ3MuSW5pdFBoYXNlU3RhdGVNYXNrKSA9PT0gaW5pdFBoYXNlID9cbiAgICAgIGZpcnN0UGFzc0hvb2tzIDpcbiAgICAgIGNoZWNrSG9va3M7XG4gIGlmIChob29rc1RvQ2FsbCkge1xuICAgIGNhbGxIb29rcyhjdXJyZW50VmlldywgaG9va3NUb0NhbGwsIGluaXRQaGFzZSk7XG4gIH1cbiAgLy8gVGhlIGluaXQgcGhhc2Ugc3RhdGUgbXVzdCBiZSBhbHdheXMgY2hlY2tlZCBoZXJlIGFzIGl0IG1heSBoYXZlIGJlZW4gcmVjdXJzaXZlbHkgdXBkYXRlZFxuICBpZiAoKGN1cnJlbnRWaWV3W0ZMQUdTXSAmIExWaWV3RmxhZ3MuSW5pdFBoYXNlU3RhdGVNYXNrKSA9PT0gaW5pdFBoYXNlICYmXG4gICAgICBpbml0UGhhc2UgIT09IEluaXRQaGFzZVN0YXRlLkluaXRQaGFzZUNvbXBsZXRlZCkge1xuICAgIGN1cnJlbnRWaWV3W0ZMQUdTXSAmPSBMVmlld0ZsYWdzLkluZGV4V2l0aGluSW5pdFBoYXNlUmVzZXQ7XG4gICAgY3VycmVudFZpZXdbRkxBR1NdICs9IExWaWV3RmxhZ3MuSW5pdFBoYXNlU3RhdGVJbmNyZW1lbnRlcjtcbiAgfVxufVxuXG4vKipcbiAqIENhbGxzIGxpZmVjeWNsZSBob29rcyB3aXRoIHRoZWlyIGNvbnRleHRzLCBza2lwcGluZyBpbml0IGhvb2tzIGlmIGl0J3Mgbm90XG4gKiB0aGUgZmlyc3QgTFZpZXcgcGFzc1xuICpcbiAqIEBwYXJhbSBjdXJyZW50VmlldyBUaGUgY3VycmVudCB2aWV3XG4gKiBAcGFyYW0gYXJyIFRoZSBhcnJheSBpbiB3aGljaCB0aGUgaG9va3MgYXJlIGZvdW5kXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjYWxsSG9va3MoY3VycmVudFZpZXc6IExWaWV3LCBhcnI6IEhvb2tEYXRhLCBpbml0UGhhc2U/OiBudW1iZXIpOiB2b2lkIHtcbiAgbGV0IGluaXRIb29rc0NvdW50ID0gMDtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBhcnIubGVuZ3RoOyBpICs9IDIpIHtcbiAgICBjb25zdCBpc0luaXRIb29rID0gYXJyW2ldIDwgMDtcbiAgICBjb25zdCBkaXJlY3RpdmVJbmRleCA9IGlzSW5pdEhvb2sgPyAtYXJyW2ldIDogYXJyW2ldIGFzIG51bWJlcjtcbiAgICBjb25zdCBkaXJlY3RpdmUgPSBjdXJyZW50Vmlld1tkaXJlY3RpdmVJbmRleF07XG4gICAgY29uc3QgaG9vayA9IGFycltpICsgMV0gYXMoKSA9PiB2b2lkO1xuICAgIGlmIChpc0luaXRIb29rKSB7XG4gICAgICBpbml0SG9va3NDb3VudCsrO1xuICAgICAgY29uc3QgaW5kZXhXaXRoaW50SW5pdFBoYXNlID0gY3VycmVudFZpZXdbRkxBR1NdID4+IExWaWV3RmxhZ3MuSW5kZXhXaXRoaW5Jbml0UGhhc2VTaGlmdDtcbiAgICAgIC8vIFRoZSBpbml0IHBoYXNlIHN0YXRlIG11c3QgYmUgYWx3YXlzIGNoZWNrZWQgaGVyZSBhcyBpdCBtYXkgaGF2ZSBiZWVuIHJlY3Vyc2l2ZWx5IHVwZGF0ZWRcbiAgICAgIGlmIChpbmRleFdpdGhpbnRJbml0UGhhc2UgPCBpbml0SG9va3NDb3VudCAmJlxuICAgICAgICAgIChjdXJyZW50Vmlld1tGTEFHU10gJiBMVmlld0ZsYWdzLkluaXRQaGFzZVN0YXRlTWFzaykgPT09IGluaXRQaGFzZSkge1xuICAgICAgICBjdXJyZW50Vmlld1tGTEFHU10gKz0gTFZpZXdGbGFncy5JbmRleFdpdGhpbkluaXRQaGFzZUluY3JlbWVudGVyO1xuICAgICAgICBob29rLmNhbGwoZGlyZWN0aXZlKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgaG9vay5jYWxsKGRpcmVjdGl2ZSk7XG4gICAgfVxuICB9XG59XG4iXX0=