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
import { unwrapOnChangesDirectiveWrapper } from './onchanges_util';
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
        (tView.initHooks || (tView.initHooks = [])).push(-directiveIndex, onChanges);
        (tView.checkHooks || (tView.checkHooks = [])).push(-directiveIndex, onChanges);
    }
    if (onInit) {
        (tView.initHooks || (tView.initHooks = [])).push(directiveIndex, onInit);
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
                (tView.contentHooks || (tView.contentHooks = [])).push(i, directiveDef.afterContentInit);
            }
            if (directiveDef.afterContentChecked) {
                (tView.contentHooks || (tView.contentHooks = [])).push(i, directiveDef.afterContentChecked);
                (tView.contentCheckHooks || (tView.contentCheckHooks = [])).push(i, directiveDef.afterContentChecked);
            }
            if (directiveDef.afterViewInit) {
                (tView.viewHooks || (tView.viewHooks = [])).push(i, directiveDef.afterViewInit);
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
    if (!checkNoChangesMode && currentView[FLAGS] & 32 /* RunInit */) {
        executeHooks(currentView, tView.initHooks, tView.checkHooks, checkNoChangesMode);
        currentView[FLAGS] &= ~32 /* RunInit */;
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
 * @return {?}
 */
export function executeHooks(currentView, firstPassHooks, checkHooks, checkNoChangesMode) {
    if (checkNoChangesMode)
        return;
    /** @type {?} */
    const hooksToCall = currentView[FLAGS] & 2 /* FirstLViewPass */ ? firstPassHooks : checkHooks;
    if (hooksToCall) {
        callHooks(currentView, hooksToCall);
    }
}
/**
 * Calls lifecycle hooks with their contexts, skipping init hooks if it's not
 * the first LView pass, and skipping onChanges hooks if there are no changes present.
 *
 * @param {?} currentView The current view
 * @param {?} arr The array in which the hooks are found
 * @return {?}
 */
export function callHooks(currentView, arr) {
    for (let i = 0; i < arr.length; i += 2) {
        /** @type {?} */
        const directiveIndex = (/** @type {?} */ (arr[i]));
        /** @type {?} */
        const hook = (/** @type {?} */ (arr[i + 1]));
        // Negative indices signal that we're dealing with an `onChanges` hook.
        /** @type {?} */
        const isOnChangesHook = directiveIndex < 0;
        /** @type {?} */
        const directiveOrWrappedDirective = currentView[isOnChangesHook ? -directiveIndex : directiveIndex];
        /** @type {?} */
        const directive = unwrapOnChangesDirectiveWrapper(directiveOrWrappedDirective);
        if (isOnChangesHook) {
            /** @type {?} */
            const onChanges = directiveOrWrappedDirective;
            /** @type {?} */
            const changes = onChanges.changes;
            if (changes) {
                onChanges.previous = changes;
                onChanges.changes = null;
                hook.call(onChanges.instance, changes);
            }
        }
        else {
            hook.call(directive);
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaG9va3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2hvb2tzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBU0EsT0FBTyxFQUFDLFdBQVcsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBSTNDLE9BQU8sRUFBQyxLQUFLLEVBQXFDLE1BQU0sbUJBQW1CLENBQUM7QUFDNUUsT0FBTyxFQUE0QiwrQkFBK0IsRUFBQyxNQUFNLGtCQUFrQixDQUFDOzs7Ozs7Ozs7Ozs7Ozs7O0FBa0I1RixNQUFNLFVBQVUscUJBQXFCLENBQ2pDLGNBQXNCLEVBQUUsWUFBK0IsRUFBRSxLQUFZO0lBQ3ZFLFNBQVM7UUFDTCxXQUFXLENBQUMsS0FBSyxDQUFDLGlCQUFpQixFQUFFLElBQUksRUFBRSw4Q0FBOEMsQ0FBQyxDQUFDO1VBRXpGLEVBQUMsU0FBUyxFQUFFLE1BQU0sRUFBRSxPQUFPLEVBQUMsR0FBRyxZQUFZO0lBRWpELElBQUksU0FBUyxFQUFFO1FBQ2IsQ0FBQyxLQUFLLENBQUMsU0FBUyxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLGNBQWMsRUFBRSxTQUFTLENBQUMsQ0FBQztRQUM3RSxDQUFDLEtBQUssQ0FBQyxVQUFVLElBQUksQ0FBQyxLQUFLLENBQUMsVUFBVSxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsY0FBYyxFQUFFLFNBQVMsQ0FBQyxDQUFDO0tBQ2hGO0lBRUQsSUFBSSxNQUFNLEVBQUU7UUFDVixDQUFDLEtBQUssQ0FBQyxTQUFTLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLGNBQWMsRUFBRSxNQUFNLENBQUMsQ0FBQztLQUMxRTtJQUVELElBQUksT0FBTyxFQUFFO1FBQ1gs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Z0JBQzdCLFNBQVMsQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDO2dCQUN6QixJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLEVBQUUsT0FBTyxDQUFDLENBQUM7YUFDeEM7U0FDRjthQUFNO1lBQ0wsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztTQUN0QjtLQUNGO0FBQ0gsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtTaW1wbGVDaGFuZ2VzfSBmcm9tICcuLi9jaGFuZ2VfZGV0ZWN0aW9uL3NpbXBsZV9jaGFuZ2UnO1xuaW1wb3J0IHthc3NlcnRFcXVhbH0gZnJvbSAnLi4vdXRpbC9hc3NlcnQnO1xuXG5pbXBvcnQge0RpcmVjdGl2ZURlZn0gZnJvbSAnLi9pbnRlcmZhY2VzL2RlZmluaXRpb24nO1xuaW1wb3J0IHtUTm9kZX0gZnJvbSAnLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtGTEFHUywgSG9va0RhdGEsIExWaWV3LCBMVmlld0ZsYWdzLCBUVmlld30gZnJvbSAnLi9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHtPbkNoYW5nZXNEaXJlY3RpdmVXcmFwcGVyLCB1bndyYXBPbkNoYW5nZXNEaXJlY3RpdmVXcmFwcGVyfSBmcm9tICcuL29uY2hhbmdlc191dGlsJztcblxuXG5cbi8qKlxuICogQWRkcyBhbGwgZGlyZWN0aXZlIGxpZmVjeWNsZSBob29rcyBmcm9tIHRoZSBnaXZlbiBgRGlyZWN0aXZlRGVmYCB0byB0aGUgZ2l2ZW4gYFRWaWV3YC5cbiAqXG4gKiBNdXN0IGJlIHJ1biAqb25seSogb24gdGhlIGZpcnN0IHRlbXBsYXRlIHBhc3MuXG4gKlxuICogVGhlIFRWaWV3J3MgaG9va3MgYXJyYXlzIGFyZSBhcnJhbmdlZCBpbiBhbHRlcm5hdGluZyBwYWlycyBvZiBkaXJlY3RpdmVJbmRleCBhbmQgaG9va0Z1bmN0aW9uLFxuICogaS5lLjogYFtkaXJlY3RpdmVJbmRleEEsIGhvb2tGdW5jdGlvbkEsIGRpcmVjdGl2ZUluZGV4QiwgaG9va0Z1bmN0aW9uQiwgLi4uXWAuIEZvciBgT25DaGFuZ2VzYFxuICogaG9va3MsIHRoZSBgZGlyZWN0aXZlSW5kZXhgIHdpbGwgYmUgKm5lZ2F0aXZlKiwgc2lnbmFsaW5nIHtAbGluayBjYWxsSG9va3N9IHRoYXQgdGhlXG4gKiBgaG9va0Z1bmN0aW9uYCBtdXN0IGJlIHBhc3NlZCB0aGUgdGhlIGFwcHJvcHJpYXRlIHtAbGluayBTaW1wbGVDaGFuZ2VzfSBvYmplY3QuXG4gKlxuICogQHBhcmFtIGRpcmVjdGl2ZUluZGV4IFRoZSBpbmRleCBvZiB0aGUgZGlyZWN0aXZlIGluIExWaWV3XG4gKiBAcGFyYW0gZGlyZWN0aXZlRGVmIFRoZSBkZWZpbml0aW9uIGNvbnRhaW5pbmcgdGhlIGhvb2tzIHRvIHNldHVwIGluIHRWaWV3XG4gKiBAcGFyYW0gdFZpZXcgVGhlIGN1cnJlbnQgVFZpZXdcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlZ2lzdGVyUHJlT3JkZXJIb29rcyhcbiAgICBkaXJlY3RpdmVJbmRleDogbnVtYmVyLCBkaXJlY3RpdmVEZWY6IERpcmVjdGl2ZURlZjxhbnk+LCB0VmlldzogVFZpZXcpOiB2b2lkIHtcbiAgbmdEZXZNb2RlICYmXG4gICAgICBhc3NlcnRFcXVhbCh0Vmlldy5maXJzdFRlbXBsYXRlUGFzcywgdHJ1ZSwgJ1Nob3VsZCBvbmx5IGJlIGNhbGxlZCBvbiBmaXJzdCB0ZW1wbGF0ZSBwYXNzJyk7XG5cbiAgY29uc3Qge29uQ2hhbmdlcywgb25Jbml0LCBkb0NoZWNrfSA9IGRpcmVjdGl2ZURlZjtcblxuICBpZiAob25DaGFuZ2VzKSB7XG4gICAgKHRWaWV3LmluaXRIb29rcyB8fCAodFZpZXcuaW5pdEhvb2tzID0gW10pKS5wdXNoKC1kaXJlY3RpdmVJbmRleCwgb25DaGFuZ2VzKTtcbiAgICAodFZpZXcuY2hlY2tIb29rcyB8fCAodFZpZXcuY2hlY2tIb29rcyA9IFtdKSkucHVzaCgtZGlyZWN0aXZlSW5kZXgsIG9uQ2hhbmdlcyk7XG4gIH1cblxuICBpZiAob25Jbml0KSB7XG4gICAgKHRWaWV3LmluaXRIb29rcyB8fCAodFZpZXcuaW5pdEhvb2tzID0gW10pKS5wdXNoKGRpcmVjdGl2ZUluZGV4LCBvbkluaXQpO1xuICB9XG5cbiAgaWYgKGRvQ2hlY2spIHtcbiAgICAodFZpZXcuaW5pdEhvb2tzIHx8ICh0Vmlldy5pbml0SG9va3MgPSBbXSkpLnB1c2goZGlyZWN0aXZlSW5kZXgsIGRvQ2hlY2spO1xuICAgICh0Vmlldy5jaGVja0hvb2tzIHx8ICh0Vmlldy5jaGVja0hvb2tzID0gW10pKS5wdXNoKGRpcmVjdGl2ZUluZGV4LCBkb0NoZWNrKTtcbiAgfVxufVxuXG4vKipcbiAqXG4gKiBMb29wcyB0aHJvdWdoIHRoZSBkaXJlY3RpdmVzIG9uIHRoZSBwcm92aWRlZCBgdE5vZGVgIGFuZCBxdWV1ZXMgaG9va3MgdG8gYmVcbiAqIHJ1biB0aGF0IGFyZSBub3QgaW5pdGlhbGl6YXRpb24gaG9va3MuXG4gKlxuICogU2hvdWxkIGJlIGV4ZWN1dGVkIGR1cmluZyBgZWxlbWVudEVuZCgpYCBhbmQgc2ltaWxhciB0b1xuICogcHJlc2VydmUgaG9vayBleGVjdXRpb24gb3JkZXIuIENvbnRlbnQsIHZpZXcsIGFuZCBkZXN0cm95IGhvb2tzIGZvciBwcm9qZWN0ZWRcbiAqIGNvbXBvbmVudHMgYW5kIGRpcmVjdGl2ZXMgbXVzdCBiZSBjYWxsZWQgKmJlZm9yZSogdGhlaXIgaG9zdHMuXG4gKlxuICogU2V0cyB1cCB0aGUgY29udGVudCwgdmlldywgYW5kIGRlc3Ryb3kgaG9va3Mgb24gdGhlIHByb3ZpZGVkIGB0Vmlld2Agc3VjaCB0aGF0XG4gKiB0aGV5J3JlIGFkZGVkIGluIGFsdGVybmF0aW5nIHBhaXJzIG9mIGRpcmVjdGl2ZUluZGV4IGFuZCBob29rRnVuY3Rpb24sXG4gKiBpLmUuOiBgW2RpcmVjdGl2ZUluZGV4QSwgaG9va0Z1bmN0aW9uQSwgZGlyZWN0aXZlSW5kZXhCLCBob29rRnVuY3Rpb25CLCAuLi5dYFxuICpcbiAqIE5PVEU6IFRoaXMgZG9lcyBub3Qgc2V0IHVwIGBvbkNoYW5nZXNgLCBgb25Jbml0YCBvciBgZG9DaGVja2AsIHRob3NlIGFyZSBzZXQgdXBcbiAqIHNlcGFyYXRlbHkgYXQgYGVsZW1lbnRTdGFydGAuXG4gKlxuICogQHBhcmFtIHRWaWV3IFRoZSBjdXJyZW50IFRWaWV3XG4gKiBAcGFyYW0gdE5vZGUgVGhlIFROb2RlIHdob3NlIGRpcmVjdGl2ZXMgYXJlIHRvIGJlIHNlYXJjaGVkIGZvciBob29rcyB0byBxdWV1ZVxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVnaXN0ZXJQb3N0T3JkZXJIb29rcyh0VmlldzogVFZpZXcsIHROb2RlOiBUTm9kZSk6IHZvaWQge1xuICBpZiAodFZpZXcuZmlyc3RUZW1wbGF0ZVBhc3MpIHtcbiAgICAvLyBJdCdzIG5lY2Vzc2FyeSB0byBsb29wIHRocm91Z2ggdGhlIGRpcmVjdGl2ZXMgYXQgZWxlbWVudEVuZCgpIChyYXRoZXIgdGhhbiBwcm9jZXNzaW5nIGluXG4gICAgLy8gZGlyZWN0aXZlQ3JlYXRlKSBzbyB3ZSBjYW4gcHJlc2VydmUgdGhlIGN1cnJlbnQgaG9vayBvcmRlci4gQ29udGVudCwgdmlldywgYW5kIGRlc3Ryb3lcbiAgICAvLyBob29rcyBmb3IgcHJvamVjdGVkIGNvbXBvbmVudHMgYW5kIGRpcmVjdGl2ZXMgbXVzdCBiZSBjYWxsZWQgKmJlZm9yZSogdGhlaXIgaG9zdHMuXG4gICAgZm9yIChsZXQgaSA9IHROb2RlLmRpcmVjdGl2ZVN0YXJ0LCBlbmQgPSB0Tm9kZS5kaXJlY3RpdmVFbmQ7IGkgPCBlbmQ7IGkrKykge1xuICAgICAgY29uc3QgZGlyZWN0aXZlRGVmID0gdFZpZXcuZGF0YVtpXSBhcyBEaXJlY3RpdmVEZWY8YW55PjtcbiAgICAgIGlmIChkaXJlY3RpdmVEZWYuYWZ0ZXJDb250ZW50SW5pdCkge1xuICAgICAgICAodFZpZXcuY29udGVudEhvb2tzIHx8ICh0Vmlldy5jb250ZW50SG9va3MgPSBbXSkpLnB1c2goaSwgZGlyZWN0aXZlRGVmLmFmdGVyQ29udGVudEluaXQpO1xuICAgICAgfVxuXG4gICAgICBpZiAoZGlyZWN0aXZlRGVmLmFmdGVyQ29udGVudENoZWNrZWQpIHtcbiAgICAgICAgKHRWaWV3LmNvbnRlbnRIb29rcyB8fCAodFZpZXcuY29udGVudEhvb2tzID0gW10pKS5wdXNoKGksIGRpcmVjdGl2ZURlZi5hZnRlckNvbnRlbnRDaGVja2VkKTtcbiAgICAgICAgKHRWaWV3LmNvbnRlbnRDaGVja0hvb2tzIHx8ICh0Vmlldy5jb250ZW50Q2hlY2tIb29rcyA9IFtcbiAgICAgICAgIF0pKS5wdXNoKGksIGRpcmVjdGl2ZURlZi5hZnRlckNvbnRlbnRDaGVja2VkKTtcbiAgICAgIH1cblxuICAgICAgaWYgKGRpcmVjdGl2ZURlZi5hZnRlclZpZXdJbml0KSB7XG4gICAgICAgICh0Vmlldy52aWV3SG9va3MgfHwgKHRWaWV3LnZpZXdIb29rcyA9IFtdKSkucHVzaChpLCBkaXJlY3RpdmVEZWYuYWZ0ZXJWaWV3SW5pdCk7XG4gICAgICB9XG5cbiAgICAgIGlmIChkaXJlY3RpdmVEZWYuYWZ0ZXJWaWV3Q2hlY2tlZCkge1xuICAgICAgICAodFZpZXcudmlld0hvb2tzIHx8ICh0Vmlldy52aWV3SG9va3MgPSBbXSkpLnB1c2goaSwgZGlyZWN0aXZlRGVmLmFmdGVyVmlld0NoZWNrZWQpO1xuICAgICAgICAodFZpZXcudmlld0NoZWNrSG9va3MgfHwgKHRWaWV3LnZpZXdDaGVja0hvb2tzID0gW1xuICAgICAgICAgXSkpLnB1c2goaSwgZGlyZWN0aXZlRGVmLmFmdGVyVmlld0NoZWNrZWQpO1xuICAgICAgfVxuXG4gICAgICBpZiAoZGlyZWN0aXZlRGVmLm9uRGVzdHJveSAhPSBudWxsKSB7XG4gICAgICAgICh0Vmlldy5kZXN0cm95SG9va3MgfHwgKHRWaWV3LmRlc3Ryb3lIb29rcyA9IFtdKSkucHVzaChpLCBkaXJlY3RpdmVEZWYub25EZXN0cm95KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBFeGVjdXRlcyBuZWNlc3NhcnkgaG9va3MgYXQgdGhlIHN0YXJ0IG9mIGV4ZWN1dGluZyBhIHRlbXBsYXRlLlxuICpcbiAqIEV4ZWN1dGVzIGhvb2tzIHRoYXQgYXJlIHRvIGJlIHJ1biBkdXJpbmcgdGhlIGluaXRpYWxpemF0aW9uIG9mIGEgZGlyZWN0aXZlIHN1Y2hcbiAqIGFzIGBvbkNoYW5nZXNgLCBgb25Jbml0YCwgYW5kIGBkb0NoZWNrYC5cbiAqXG4gKiBIYXMgdGhlIHNpZGUgZWZmZWN0IG9mIHVwZGF0aW5nIHRoZSBSdW5Jbml0IGZsYWcgaW4gYGxWaWV3YCB0byBiZSBgMGAsIHNvIHRoYXRcbiAqIHRoaXMgaXNuJ3QgcnVuIGEgc2Vjb25kIHRpbWUuXG4gKlxuICogQHBhcmFtIGxWaWV3IFRoZSBjdXJyZW50IHZpZXdcbiAqIEBwYXJhbSB0VmlldyBTdGF0aWMgZGF0YSBmb3IgdGhlIHZpZXcgY29udGFpbmluZyB0aGUgaG9va3MgdG8gYmUgZXhlY3V0ZWRcbiAqIEBwYXJhbSBjaGVja05vQ2hhbmdlc01vZGUgV2hldGhlciBvciBub3Qgd2UncmUgaW4gY2hlY2tOb0NoYW5nZXMgbW9kZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGV4ZWN1dGVJbml0SG9va3MoXG4gICAgY3VycmVudFZpZXc6IExWaWV3LCB0VmlldzogVFZpZXcsIGNoZWNrTm9DaGFuZ2VzTW9kZTogYm9vbGVhbik6IHZvaWQge1xuICBpZiAoIWNoZWNrTm9DaGFuZ2VzTW9kZSAmJiBjdXJyZW50Vmlld1tGTEFHU10gJiBMVmlld0ZsYWdzLlJ1bkluaXQpIHtcbiAgICBleGVjdXRlSG9va3MoY3VycmVudFZpZXcsIHRWaWV3LmluaXRIb29rcywgdFZpZXcuY2hlY2tIb29rcywgY2hlY2tOb0NoYW5nZXNNb2RlKTtcbiAgICBjdXJyZW50Vmlld1tGTEFHU10gJj0gfkxWaWV3RmxhZ3MuUnVuSW5pdDtcbiAgfVxufVxuXG4vKipcbiAqIEV4ZWN1dGVzIGhvb2tzIGFnYWluc3QgdGhlIGdpdmVuIGBMVmlld2AgYmFzZWQgb2ZmIG9mIHdoZXRoZXIgb3Igbm90XG4gKiBUaGlzIGlzIHRoZSBmaXJzdCBwYXNzLlxuICpcbiAqIEBwYXJhbSBsVmlldyBUaGUgdmlldyBpbnN0YW5jZSBkYXRhIHRvIHJ1biB0aGUgaG9va3MgYWdhaW5zdFxuICogQHBhcmFtIGZpcnN0UGFzc0hvb2tzIEFuIGFycmF5IG9mIGhvb2tzIHRvIHJ1biBpZiB3ZSdyZSBpbiB0aGUgZmlyc3QgdmlldyBwYXNzXG4gKiBAcGFyYW0gY2hlY2tIb29rcyBBbiBBcnJheSBvZiBob29rcyB0byBydW4gaWYgd2UncmUgbm90IGluIHRoZSBmaXJzdCB2aWV3IHBhc3MuXG4gKiBAcGFyYW0gY2hlY2tOb0NoYW5nZXNNb2RlIFdoZXRoZXIgb3Igbm90IHdlJ3JlIGluIG5vIGNoYW5nZXMgbW9kZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGV4ZWN1dGVIb29rcyhcbiAgICBjdXJyZW50VmlldzogTFZpZXcsIGZpcnN0UGFzc0hvb2tzOiBIb29rRGF0YSB8IG51bGwsIGNoZWNrSG9va3M6IEhvb2tEYXRhIHwgbnVsbCxcbiAgICBjaGVja05vQ2hhbmdlc01vZGU6IGJvb2xlYW4pOiB2b2lkIHtcbiAgaWYgKGNoZWNrTm9DaGFuZ2VzTW9kZSkgcmV0dXJuO1xuXG4gIGNvbnN0IGhvb2tzVG9DYWxsID0gY3VycmVudFZpZXdbRkxBR1NdICYgTFZpZXdGbGFncy5GaXJzdExWaWV3UGFzcyA/IGZpcnN0UGFzc0hvb2tzIDogY2hlY2tIb29rcztcbiAgaWYgKGhvb2tzVG9DYWxsKSB7XG4gICAgY2FsbEhvb2tzKGN1cnJlbnRWaWV3LCBob29rc1RvQ2FsbCk7XG4gIH1cbn1cblxuLyoqXG4gKiBDYWxscyBsaWZlY3ljbGUgaG9va3Mgd2l0aCB0aGVpciBjb250ZXh0cywgc2tpcHBpbmcgaW5pdCBob29rcyBpZiBpdCdzIG5vdFxuICogdGhlIGZpcnN0IExWaWV3IHBhc3MsIGFuZCBza2lwcGluZyBvbkNoYW5nZXMgaG9va3MgaWYgdGhlcmUgYXJlIG5vIGNoYW5nZXMgcHJlc2VudC5cbiAqXG4gKiBAcGFyYW0gY3VycmVudFZpZXcgVGhlIGN1cnJlbnQgdmlld1xuICogQHBhcmFtIGFyciBUaGUgYXJyYXkgaW4gd2hpY2ggdGhlIGhvb2tzIGFyZSBmb3VuZFxuICovXG5leHBvcnQgZnVuY3Rpb24gY2FsbEhvb2tzKGN1cnJlbnRWaWV3OiBMVmlldywgYXJyOiBIb29rRGF0YSk6IHZvaWQge1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGFyci5sZW5ndGg7IGkgKz0gMikge1xuICAgIGNvbnN0IGRpcmVjdGl2ZUluZGV4ID0gYXJyW2ldIGFzIG51bWJlcjtcbiAgICBjb25zdCBob29rID0gYXJyW2kgKyAxXSBhcygoKCkgPT4gdm9pZCkgfCAoKGNoYW5nZXM6IFNpbXBsZUNoYW5nZXMpID0+IHZvaWQpKTtcbiAgICAvLyBOZWdhdGl2ZSBpbmRpY2VzIHNpZ25hbCB0aGF0IHdlJ3JlIGRlYWxpbmcgd2l0aCBhbiBgb25DaGFuZ2VzYCBob29rLlxuICAgIGNvbnN0IGlzT25DaGFuZ2VzSG9vayA9IGRpcmVjdGl2ZUluZGV4IDwgMDtcbiAgICBjb25zdCBkaXJlY3RpdmVPcldyYXBwZWREaXJlY3RpdmUgPVxuICAgICAgICBjdXJyZW50Vmlld1tpc09uQ2hhbmdlc0hvb2sgPyAtZGlyZWN0aXZlSW5kZXggOiBkaXJlY3RpdmVJbmRleF07XG4gICAgY29uc3QgZGlyZWN0aXZlID0gdW53cmFwT25DaGFuZ2VzRGlyZWN0aXZlV3JhcHBlcihkaXJlY3RpdmVPcldyYXBwZWREaXJlY3RpdmUpO1xuXG4gICAgaWYgKGlzT25DaGFuZ2VzSG9vaykge1xuICAgICAgY29uc3Qgb25DaGFuZ2VzOiBPbkNoYW5nZXNEaXJlY3RpdmVXcmFwcGVyID0gZGlyZWN0aXZlT3JXcmFwcGVkRGlyZWN0aXZlO1xuICAgICAgY29uc3QgY2hhbmdlcyA9IG9uQ2hhbmdlcy5jaGFuZ2VzO1xuICAgICAgaWYgKGNoYW5nZXMpIHtcbiAgICAgICAgb25DaGFuZ2VzLnByZXZpb3VzID0gY2hhbmdlcztcbiAgICAgICAgb25DaGFuZ2VzLmNoYW5nZXMgPSBudWxsO1xuICAgICAgICBob29rLmNhbGwob25DaGFuZ2VzLmluc3RhbmNlLCBjaGFuZ2VzKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgaG9vay5jYWxsKGRpcmVjdGl2ZSk7XG4gICAgfVxuICB9XG59XG4iXX0=