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
    var onInit = directiveDef.onInit, doCheck = directiveDef.doCheck;
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
 * @param lView The current view
 * @param tView Static data for the view containing the hooks to be executed
 * @param checkNoChangesMode Whether or not we're in checkNoChanges mode.
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
 * @param lView The view instance data to run the hooks against
 * @param firstPassHooks An array of hooks to run if we're in the first view pass
 * @param checkHooks An Array of hooks to run if we're not in the first view pass.
 * @param checkNoChangesMode Whether or not we're in no changes mode.
 */
export function executeHooks(currentView, firstPassHooks, checkHooks, checkNoChangesMode) {
    if (checkNoChangesMode)
        return;
    var hooksToCall = currentView[FLAGS] & 2 /* FirstLViewPass */ ? firstPassHooks : checkHooks;
    if (hooksToCall) {
        callHooks(currentView, hooksToCall);
    }
}
/**
 * Calls lifecycle hooks with their contexts, skipping init hooks if it's not
 * the first LView pass
 *
 * @param currentView The current view
 * @param arr The array in which the hooks are found
 */
export function callHooks(currentView, arr) {
    for (var i = 0; i < arr.length; i += 2) {
        arr[i + 1].call(currentView[arr[i]]);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaG9va3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2hvb2tzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUdILE9BQU8sRUFBQyxXQUFXLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUkzQyxPQUFPLEVBQUMsS0FBSyxFQUFxQyxNQUFNLG1CQUFtQixDQUFDO0FBSTVFOzs7Ozs7Ozs7Ozs7O0dBYUc7QUFDSCxNQUFNLFVBQVUscUJBQXFCLENBQ2pDLGNBQXNCLEVBQUUsWUFBK0IsRUFBRSxLQUFZO0lBQ3ZFLFNBQVM7UUFDTCxXQUFXLENBQUMsS0FBSyxDQUFDLGlCQUFpQixFQUFFLElBQUksRUFBRSw4Q0FBOEMsQ0FBQyxDQUFDO0lBRXhGLElBQUEsNEJBQU0sRUFBRSw4QkFBTyxDQUFpQjtJQUV2QyxJQUFJLE1BQU0sRUFBRTtRQUNWLENBQUMsS0FBSyxDQUFDLFNBQVMsSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsY0FBYyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0tBQzFFO0lBRUQsSUFBSSxPQUFPLEVBQUU7UUFDWCxDQUFDLEtBQUssQ0FBQyxTQUFTLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLGNBQWMsRUFBRSxPQUFPLENBQUMsQ0FBQztRQUMxRSxDQUFDLEtBQUssQ0FBQyxVQUFVLElBQUksQ0FBQyxLQUFLLENBQUMsVUFBVSxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLGNBQWMsRUFBRSxPQUFPLENBQUMsQ0FBQztLQUM3RTtBQUNILENBQUM7QUFFRDs7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBa0JHO0FBQ0gsTUFBTSxVQUFVLHNCQUFzQixDQUFDLEtBQVksRUFBRSxLQUFZ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QyxVQUFVLENBQUM7SUFDakcsSUFBSSxXQUFXLEVBQUU7UUFDZixTQUFTLENBQUMsV0FBVyxFQUFFLFdBQVcsQ0FBQyxDQUFDO0tBQ3JDO0FBQ0gsQ0FBQztBQUVEOzs7Ozs7R0FNRztBQUNILE1BQU0sVUFBVSxTQUFTLENBQUMsV0FBa0IsRUFBRSxHQUFhO0lBQ3pELEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxHQUFHLENBQUMsTUFBTSxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUU7UUFDckMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQWUsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQVcsQ0FBQyxDQUFDLENBQUM7S0FDL0Q7QUFDSCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1NpbXBsZUNoYW5nZXN9IGZyb20gJy4uL2ludGVyZmFjZS9zaW1wbGVfY2hhbmdlJztcbmltcG9ydCB7YXNzZXJ0RXF1YWx9IGZyb20gJy4uL3V0aWwvYXNzZXJ0JztcblxuaW1wb3J0IHtEaXJlY3RpdmVEZWZ9IGZyb20gJy4vaW50ZXJmYWNlcy9kZWZpbml0aW9uJztcbmltcG9ydCB7VE5vZGV9IGZyb20gJy4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7RkxBR1MsIEhvb2tEYXRhLCBMVmlldywgTFZpZXdGbGFncywgVFZpZXd9IGZyb20gJy4vaW50ZXJmYWNlcy92aWV3JztcblxuXG5cbi8qKlxuICogQWRkcyBhbGwgZGlyZWN0aXZlIGxpZmVjeWNsZSBob29rcyBmcm9tIHRoZSBnaXZlbiBgRGlyZWN0aXZlRGVmYCB0byB0aGUgZ2l2ZW4gYFRWaWV3YC5cbiAqXG4gKiBNdXN0IGJlIHJ1biAqb25seSogb24gdGhlIGZpcnN0IHRlbXBsYXRlIHBhc3MuXG4gKlxuICogVGhlIFRWaWV3J3MgaG9va3MgYXJyYXlzIGFyZSBhcnJhbmdlZCBpbiBhbHRlcm5hdGluZyBwYWlycyBvZiBkaXJlY3RpdmVJbmRleCBhbmQgaG9va0Z1bmN0aW9uLFxuICogaS5lLjogYFtkaXJlY3RpdmVJbmRleEEsIGhvb2tGdW5jdGlvbkEsIGRpcmVjdGl2ZUluZGV4QiwgaG9va0Z1bmN0aW9uQiwgLi4uXWAuIEZvciBgT25DaGFuZ2VzYFxuICogaG9va3MsIHRoZSBgZGlyZWN0aXZlSW5kZXhgIHdpbGwgYmUgKm5lZ2F0aXZlKiwgc2lnbmFsaW5nIHtAbGluayBjYWxsSG9va3N9IHRoYXQgdGhlXG4gKiBgaG9va0Z1bmN0aW9uYCBtdXN0IGJlIHBhc3NlZCB0aGUgdGhlIGFwcHJvcHJpYXRlIHtAbGluayBTaW1wbGVDaGFuZ2VzfSBvYmplY3QuXG4gKlxuICogQHBhcmFtIGRpcmVjdGl2ZUluZGV4IFRoZSBpbmRleCBvZiB0aGUgZGlyZWN0aXZlIGluIExWaWV3XG4gKiBAcGFyYW0gZGlyZWN0aXZlRGVmIFRoZSBkZWZpbml0aW9uIGNvbnRhaW5pbmcgdGhlIGhvb2tzIHRvIHNldHVwIGluIHRWaWV3XG4gKiBAcGFyYW0gdFZpZXcgVGhlIGN1cnJlbnQgVFZpZXdcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlZ2lzdGVyUHJlT3JkZXJIb29rcyhcbiAgICBkaXJlY3RpdmVJbmRleDogbnVtYmVyLCBkaXJlY3RpdmVEZWY6IERpcmVjdGl2ZURlZjxhbnk+LCB0VmlldzogVFZpZXcpOiB2b2lkIHtcbiAgbmdEZXZNb2RlICYmXG4gICAgICBhc3NlcnRFcXVhbCh0Vmlldy5maXJzdFRlbXBsYXRlUGFzcywgdHJ1ZSwgJ1Nob3VsZCBvbmx5IGJlIGNhbGxlZCBvbiBmaXJzdCB0ZW1wbGF0ZSBwYXNzJyk7XG5cbiAgY29uc3Qge29uSW5pdCwgZG9DaGVja30gPSBkaXJlY3RpdmVEZWY7XG5cbiAgaWYgKG9uSW5pdCkge1xuICAgICh0Vmlldy5pbml0SG9va3MgfHwgKHRWaWV3LmluaXRIb29rcyA9IFtdKSkucHVzaChkaXJlY3RpdmVJbmRleCwgb25Jbml0KTtcbiAgfVxuXG4gIGlmIChkb0NoZWNrKSB7XG4gICAgKHRWaWV3LmluaXRIb29rcyB8fCAodFZpZXcuaW5pdEhvb2tzID0gW10pKS5wdXNoKGRpcmVjdGl2ZUluZGV4LCBkb0NoZWNrKTtcbiAgICAodFZpZXcuY2hlY2tIb29rcyB8fCAodFZpZXcuY2hlY2tIb29rcyA9IFtdKSkucHVzaChkaXJlY3RpdmVJbmRleCwgZG9DaGVjayk7XG4gIH1cbn1cblxuLyoqXG4gKlxuICogTG9vcHMgdGhyb3VnaCB0aGUgZGlyZWN0aXZlcyBvbiB0aGUgcHJvdmlkZWQgYHROb2RlYCBhbmQgcXVldWVzIGhvb2tzIHRvIGJlXG4gKiBydW4gdGhhdCBhcmUgbm90IGluaXRpYWxpemF0aW9uIGhvb2tzLlxuICpcbiAqIFNob3VsZCBiZSBleGVjdXRlZCBkdXJpbmcgYGVsZW1lbnRFbmQoKWAgYW5kIHNpbWlsYXIgdG9cbiAqIHByZXNlcnZlIGhvb2sgZXhlY3V0aW9uIG9yZGVyLiBDb250ZW50LCB2aWV3LCBhbmQgZGVzdHJveSBob29rcyBmb3IgcHJvamVjdGVkXG4gKiBjb21wb25lbnRzIGFuZCBkaXJlY3RpdmVzIG11c3QgYmUgY2FsbGVkICpiZWZvcmUqIHRoZWlyIGhvc3RzLlxuICpcbiAqIFNldHMgdXAgdGhlIGNvbnRlbnQsIHZpZXcsIGFuZCBkZXN0cm95IGhvb2tzIG9uIHRoZSBwcm92aWRlZCBgdFZpZXdgIHN1Y2ggdGhhdFxuICogdGhleSdyZSBhZGRlZCBpbiBhbHRlcm5hdGluZyBwYWlycyBvZiBkaXJlY3RpdmVJbmRleCBhbmQgaG9va0Z1bmN0aW9uLFxuICogaS5lLjogYFtkaXJlY3RpdmVJbmRleEEsIGhvb2tGdW5jdGlvbkEsIGRpcmVjdGl2ZUluZGV4QiwgaG9va0Z1bmN0aW9uQiwgLi4uXWBcbiAqXG4gKiBOT1RFOiBUaGlzIGRvZXMgbm90IHNldCB1cCBgb25DaGFuZ2VzYCwgYG9uSW5pdGAgb3IgYGRvQ2hlY2tgLCB0aG9zZSBhcmUgc2V0IHVwXG4gKiBzZXBhcmF0ZWx5IGF0IGBlbGVtZW50U3RhcnRgLlxuICpcbiAqIEBwYXJhbSB0VmlldyBUaGUgY3VycmVudCBUVmlld1xuICogQHBhcmFtIHROb2RlIFRoZSBUTm9kZSB3aG9zZSBkaXJlY3RpdmVzIGFyZSB0byBiZSBzZWFyY2hlZCBmb3IgaG9va3MgdG8gcXVldWVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlZ2lzdGVyUG9zdE9yZGVySG9va3ModFZpZXc6IFRWaWV3LCB0Tm9kZTogVE5vZGUpOiB2b2lkIHtcbiAgaWYgKHRWaWV3LmZpcnN0VGVtcGxhdGVQYXNzKSB7XG4gICAgLy8gSXQncyBuZWNlc3NhcnkgdG8gbG9vcCB0aHJvdWdoIHRoZSBkaXJlY3RpdmVzIGF0IGVsZW1lbnRFbmQoKSAocmF0aGVyIHRoYW4gcHJvY2Vzc2luZyBpblxuICAgIC8vIGRpcmVjdGl2ZUNyZWF0ZSkgc28gd2UgY2FuIHByZXNlcnZlIHRoZSBjdXJyZW50IGhvb2sgb3JkZXIuIENvbnRlbnQsIHZpZXcsIGFuZCBkZXN0cm95XG4gICAgLy8gaG9va3MgZm9yIHByb2plY3RlZCBjb21wb25lbnRzIGFuZCBkaXJlY3RpdmVzIG11c3QgYmUgY2FsbGVkICpiZWZvcmUqIHRoZWlyIGhvc3RzLlxuICAgIGZvciAobGV0IGkgPSB0Tm9kZS5kaXJlY3RpdmVTdGFydCwgZW5kID0gdE5vZGUuZGlyZWN0aXZlRW5kOyBpIDwgZW5kOyBpKyspIHtcbiAgICAgIGNvbnN0IGRpcmVjdGl2ZURlZiA9IHRWaWV3LmRhdGFbaV0gYXMgRGlyZWN0aXZlRGVmPGFueT47XG4gICAgICBpZiAoZGlyZWN0aXZlRGVmLmFmdGVyQ29udGVudEluaXQpIHtcbiAgICAgICAgKHRWaWV3LmNvbnRlbnRIb29rcyB8fCAodFZpZXcuY29udGVudEhvb2tzID0gW10pKS5wdXNoKGksIGRpcmVjdGl2ZURlZi5hZnRlckNvbnRlbnRJbml0KTtcbiAgICAgIH1cblxuICAgICAgaWYgKGRpcmVjdGl2ZURlZi5hZnRlckNvbnRlbnRDaGVja2VkKSB7XG4gICAgICAgICh0Vmlldy5jb250ZW50SG9va3MgfHwgKHRWaWV3LmNvbnRlbnRIb29rcyA9IFtdKSkucHVzaChpLCBkaXJlY3RpdmVEZWYuYWZ0ZXJDb250ZW50Q2hlY2tlZCk7XG4gICAgICAgICh0Vmlldy5jb250ZW50Q2hlY2tIb29rcyB8fCAodFZpZXcuY29udGVudENoZWNrSG9va3MgPSBbXG4gICAgICAgICBdKSkucHVzaChpLCBkaXJlY3RpdmVEZWYuYWZ0ZXJDb250ZW50Q2hlY2tlZCk7XG4gICAgICB9XG5cbiAgICAgIGlmIChkaXJlY3RpdmVEZWYuYWZ0ZXJWaWV3SW5pdCkge1xuICAgICAgICAodFZpZXcudmlld0hvb2tzIHx8ICh0Vmlldy52aWV3SG9va3MgPSBbXSkpLnB1c2goaSwgZGlyZWN0aXZlRGVmLmFmdGVyVmlld0luaXQpO1xuICAgICAgfVxuXG4gICAgICBpZiAoZGlyZWN0aXZlRGVmLmFmdGVyVmlld0NoZWNrZWQpIHtcbiAgICAgICAgKHRWaWV3LnZpZXdIb29rcyB8fCAodFZpZXcudmlld0hvb2tzID0gW10pKS5wdXNoKGksIGRpcmVjdGl2ZURlZi5hZnRlclZpZXdDaGVja2VkKTtcbiAgICAgICAgKHRWaWV3LnZpZXdDaGVja0hvb2tzIHx8ICh0Vmlldy52aWV3Q2hlY2tIb29rcyA9IFtcbiAgICAgICAgIF0pKS5wdXNoKGksIGRpcmVjdGl2ZURlZi5hZnRlclZpZXdDaGVja2VkKTtcbiAgICAgIH1cblxuICAgICAgaWYgKGRpcmVjdGl2ZURlZi5vbkRlc3Ryb3kgIT0gbnVsbCkge1xuICAgICAgICAodFZpZXcuZGVzdHJveUhvb2tzIHx8ICh0Vmlldy5kZXN0cm95SG9va3MgPSBbXSkpLnB1c2goaSwgZGlyZWN0aXZlRGVmLm9uRGVzdHJveSk7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogRXhlY3V0ZXMgbmVjZXNzYXJ5IGhvb2tzIGF0IHRoZSBzdGFydCBvZiBleGVjdXRpbmcgYSB0ZW1wbGF0ZS5cbiAqXG4gKiBFeGVjdXRlcyBob29rcyB0aGF0IGFyZSB0byBiZSBydW4gZHVyaW5nIHRoZSBpbml0aWFsaXphdGlvbiBvZiBhIGRpcmVjdGl2ZSBzdWNoXG4gKiBhcyBgb25DaGFuZ2VzYCwgYG9uSW5pdGAsIGFuZCBgZG9DaGVja2AuXG4gKlxuICogSGFzIHRoZSBzaWRlIGVmZmVjdCBvZiB1cGRhdGluZyB0aGUgUnVuSW5pdCBmbGFnIGluIGBsVmlld2AgdG8gYmUgYDBgLCBzbyB0aGF0XG4gKiB0aGlzIGlzbid0IHJ1biBhIHNlY29uZCB0aW1lLlxuICpcbiAqIEBwYXJhbSBsVmlldyBUaGUgY3VycmVudCB2aWV3XG4gKiBAcGFyYW0gdFZpZXcgU3RhdGljIGRhdGEgZm9yIHRoZSB2aWV3IGNvbnRhaW5pbmcgdGhlIGhvb2tzIHRvIGJlIGV4ZWN1dGVkXG4gKiBAcGFyYW0gY2hlY2tOb0NoYW5nZXNNb2RlIFdoZXRoZXIgb3Igbm90IHdlJ3JlIGluIGNoZWNrTm9DaGFuZ2VzIG1vZGUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBleGVjdXRlSW5pdEhvb2tzKFxuICAgIGN1cnJlbnRWaWV3OiBMVmlldywgdFZpZXc6IFRWaWV3LCBjaGVja05vQ2hhbmdlc01vZGU6IGJvb2xlYW4pOiB2b2lkIHtcbiAgaWYgKCFjaGVja05vQ2hhbmdlc01vZGUgJiYgY3VycmVudFZpZXdbRkxBR1NdICYgTFZpZXdGbGFncy5SdW5Jbml0KSB7XG4gICAgZXhlY3V0ZUhvb2tzKGN1cnJlbnRWaWV3LCB0Vmlldy5pbml0SG9va3MsIHRWaWV3LmNoZWNrSG9va3MsIGNoZWNrTm9DaGFuZ2VzTW9kZSk7XG4gICAgY3VycmVudFZpZXdbRkxBR1NdICY9IH5MVmlld0ZsYWdzLlJ1bkluaXQ7XG4gIH1cbn1cblxuLyoqXG4gKiBFeGVjdXRlcyBob29rcyBhZ2FpbnN0IHRoZSBnaXZlbiBgTFZpZXdgIGJhc2VkIG9mZiBvZiB3aGV0aGVyIG9yIG5vdFxuICogVGhpcyBpcyB0aGUgZmlyc3QgcGFzcy5cbiAqXG4gKiBAcGFyYW0gbFZpZXcgVGhlIHZpZXcgaW5zdGFuY2UgZGF0YSB0byBydW4gdGhlIGhvb2tzIGFnYWluc3RcbiAqIEBwYXJhbSBmaXJzdFBhc3NIb29rcyBBbiBhcnJheSBvZiBob29rcyB0byBydW4gaWYgd2UncmUgaW4gdGhlIGZpcnN0IHZpZXcgcGFzc1xuICogQHBhcmFtIGNoZWNrSG9va3MgQW4gQXJyYXkgb2YgaG9va3MgdG8gcnVuIGlmIHdlJ3JlIG5vdCBpbiB0aGUgZmlyc3QgdmlldyBwYXNzLlxuICogQHBhcmFtIGNoZWNrTm9DaGFuZ2VzTW9kZSBXaGV0aGVyIG9yIG5vdCB3ZSdyZSBpbiBubyBjaGFuZ2VzIG1vZGUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBleGVjdXRlSG9va3MoXG4gICAgY3VycmVudFZpZXc6IExWaWV3LCBmaXJzdFBhc3NIb29rczogSG9va0RhdGEgfCBudWxsLCBjaGVja0hvb2tzOiBIb29rRGF0YSB8IG51bGwsXG4gICAgY2hlY2tOb0NoYW5nZXNNb2RlOiBib29sZWFuKTogdm9pZCB7XG4gIGlmIChjaGVja05vQ2hhbmdlc01vZGUpIHJldHVybjtcblxuICBjb25zdCBob29rc1RvQ2FsbCA9IGN1cnJlbnRWaWV3W0ZMQUdTXSAmIExWaWV3RmxhZ3MuRmlyc3RMVmlld1Bhc3MgPyBmaXJzdFBhc3NIb29rcyA6IGNoZWNrSG9va3M7XG4gIGlmIChob29rc1RvQ2FsbCkge1xuICAgIGNhbGxIb29rcyhjdXJyZW50VmlldywgaG9va3NUb0NhbGwpO1xuICB9XG59XG5cbi8qKlxuICogQ2FsbHMgbGlmZWN5Y2xlIGhvb2tzIHdpdGggdGhlaXIgY29udGV4dHMsIHNraXBwaW5nIGluaXQgaG9va3MgaWYgaXQncyBub3RcbiAqIHRoZSBmaXJzdCBMVmlldyBwYXNzXG4gKlxuICogQHBhcmFtIGN1cnJlbnRWaWV3IFRoZSBjdXJyZW50IHZpZXdcbiAqIEBwYXJhbSBhcnIgVGhlIGFycmF5IGluIHdoaWNoIHRoZSBob29rcyBhcmUgZm91bmRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNhbGxIb29rcyhjdXJyZW50VmlldzogTFZpZXcsIGFycjogSG9va0RhdGEpOiB2b2lkIHtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBhcnIubGVuZ3RoOyBpICs9IDIpIHtcbiAgICAoYXJyW2kgKyAxXSBhcygpID0+IHZvaWQpLmNhbGwoY3VycmVudFZpZXdbYXJyW2ldIGFzIG51bWJlcl0pO1xuICB9XG59XG4iXX0=