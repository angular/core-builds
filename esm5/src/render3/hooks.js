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
 * the first LView pass, and skipping onChanges hooks if there are no changes present.
 *
 * @param currentView The current view
 * @param arr The array in which the hooks are found
 */
export function callHooks(currentView, arr) {
    for (var i = 0; i < arr.length; i += 2) {
        var directiveIndex = arr[i];
        var hook = arr[i + 1];
        // Negative indices signal that we're dealing with an `onChanges` hook.
        var isOnChangesHook = directiveIndex < 0;
        var directiveOrWrappedDirective = currentView[isOnChangesHook ? -directiveIndex : directiveIndex];
        var directive = unwrapOnChangesDirectiveWrapper(directiveOrWrappedDirective);
        if (isOnChangesHook) {
            var onChanges = directiveOrWrappedDirective;
            var changes = onChanges.changes;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaG9va3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2hvb2tzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUdILE9BQU8sRUFBQyxXQUFXLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUkzQyxPQUFPLEVBQUMsS0FBSyxFQUFxQyxNQUFNLG1CQUFtQixDQUFDO0FBQzVFLE9BQU8sRUFBNEIsK0JBQStCLEVBQUMsTUFBTSxrQkFBa0IsQ0FBQztBQUk1Rjs7Ozs7Ozs7Ozs7OztHQWFHO0FBQ0gsTUFBTSxVQUFVLHFCQUFxQixDQUNqQyxjQUFzQixFQUFFLFlBQStCLEVBQUUsS0FBWTtJQUN2RSxTQUFTO1FBQ0wsV0FBVyxDQUFDLEtBQUssQ0FBQyxpQkFBaUIsRUFBRSxJQUFJLEVBQUUsOENBQThDLENBQUMsQ0FBQztJQUV4RixJQUFBLGtDQUFTLEVBQUUsNEJBQU0sRUFBRSw4QkFBTyxDQUFpQjtJQUVsRCxJQUFJLFNBQVMsRUFBRTtRQUNiLENBQUMsS0FBSyxDQUFDLFNBQVMsSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxjQUFjLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFDN0UsQ0FBQyxLQUFLLENBQUMsVUFBVSxJQUFJLENBQUMsS0FBSyxDQUFDLFVBQVUsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLGNBQWMsRUFBRSxTQUFTLENBQUMsQ0FBQztLQUNoRjtJQUVELElBQUksTUFBTSxFQUFFO1FBQ1YsQ0FBQyxLQUFLLENBQUMsU0FBUyxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxjQUFjLEVBQUUsTUFBTSxDQUFDLENBQUM7S0FDMUU7SUFFRCxJQUFJLE9B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O1lBQ3pFLElBQU0sT0FBTyxHQUFHLFNBQVMsQ0FBQyxPQUFPLENBQUM7WUFDbEMsSUFBSSxPQUFPLEVBQUU7Z0JBQ1gsU0FBUyxDQUFDLFFBQVEsR0FBRyxPQUFPLENBQUM7Z0JBQzdCLFNBQVMsQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDO2dCQUN6QixJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLEVBQUUsT0FBTyxDQUFDLENBQUM7YUFDeEM7U0FDRjthQUFNO1lBQ0wsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztTQUN0QjtLQUNGO0FBQ0gsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtTaW1wbGVDaGFuZ2VzfSBmcm9tICcuLi9pbnRlcmZhY2Uvc2ltcGxlX2NoYW5nZSc7XG5pbXBvcnQge2Fzc2VydEVxdWFsfSBmcm9tICcuLi91dGlsL2Fzc2VydCc7XG5cbmltcG9ydCB7RGlyZWN0aXZlRGVmfSBmcm9tICcuL2ludGVyZmFjZXMvZGVmaW5pdGlvbic7XG5pbXBvcnQge1ROb2RlfSBmcm9tICcuL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge0ZMQUdTLCBIb29rRGF0YSwgTFZpZXcsIExWaWV3RmxhZ3MsIFRWaWV3fSBmcm9tICcuL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge09uQ2hhbmdlc0RpcmVjdGl2ZVdyYXBwZXIsIHVud3JhcE9uQ2hhbmdlc0RpcmVjdGl2ZVdyYXBwZXJ9IGZyb20gJy4vb25jaGFuZ2VzX3V0aWwnO1xuXG5cblxuLyoqXG4gKiBBZGRzIGFsbCBkaXJlY3RpdmUgbGlmZWN5Y2xlIGhvb2tzIGZyb20gdGhlIGdpdmVuIGBEaXJlY3RpdmVEZWZgIHRvIHRoZSBnaXZlbiBgVFZpZXdgLlxuICpcbiAqIE11c3QgYmUgcnVuICpvbmx5KiBvbiB0aGUgZmlyc3QgdGVtcGxhdGUgcGFzcy5cbiAqXG4gKiBUaGUgVFZpZXcncyBob29rcyBhcnJheXMgYXJlIGFycmFuZ2VkIGluIGFsdGVybmF0aW5nIHBhaXJzIG9mIGRpcmVjdGl2ZUluZGV4IGFuZCBob29rRnVuY3Rpb24sXG4gKiBpLmUuOiBgW2RpcmVjdGl2ZUluZGV4QSwgaG9va0Z1bmN0aW9uQSwgZGlyZWN0aXZlSW5kZXhCLCBob29rRnVuY3Rpb25CLCAuLi5dYC4gRm9yIGBPbkNoYW5nZXNgXG4gKiBob29rcywgdGhlIGBkaXJlY3RpdmVJbmRleGAgd2lsbCBiZSAqbmVnYXRpdmUqLCBzaWduYWxpbmcge0BsaW5rIGNhbGxIb29rc30gdGhhdCB0aGVcbiAqIGBob29rRnVuY3Rpb25gIG11c3QgYmUgcGFzc2VkIHRoZSB0aGUgYXBwcm9wcmlhdGUge0BsaW5rIFNpbXBsZUNoYW5nZXN9IG9iamVjdC5cbiAqXG4gKiBAcGFyYW0gZGlyZWN0aXZlSW5kZXggVGhlIGluZGV4IG9mIHRoZSBkaXJlY3RpdmUgaW4gTFZpZXdcbiAqIEBwYXJhbSBkaXJlY3RpdmVEZWYgVGhlIGRlZmluaXRpb24gY29udGFpbmluZyB0aGUgaG9va3MgdG8gc2V0dXAgaW4gdFZpZXdcbiAqIEBwYXJhbSB0VmlldyBUaGUgY3VycmVudCBUVmlld1xuICovXG5leHBvcnQgZnVuY3Rpb24gcmVnaXN0ZXJQcmVPcmRlckhvb2tzKFxuICAgIGRpcmVjdGl2ZUluZGV4OiBudW1iZXIsIGRpcmVjdGl2ZURlZjogRGlyZWN0aXZlRGVmPGFueT4sIHRWaWV3OiBUVmlldyk6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiZcbiAgICAgIGFzc2VydEVxdWFsKHRWaWV3LmZpcnN0VGVtcGxhdGVQYXNzLCB0cnVlLCAnU2hvdWxkIG9ubHkgYmUgY2FsbGVkIG9uIGZpcnN0IHRlbXBsYXRlIHBhc3MnKTtcblxuICBjb25zdCB7b25DaGFuZ2VzLCBvbkluaXQsIGRvQ2hlY2t9ID0gZGlyZWN0aXZlRGVmO1xuXG4gIGlmIChvbkNoYW5nZXMpIHtcbiAgICAodFZpZXcuaW5pdEhvb2tzIHx8ICh0Vmlldy5pbml0SG9va3MgPSBbXSkpLnB1c2goLWRpcmVjdGl2ZUluZGV4LCBvbkNoYW5nZXMpO1xuICAgICh0Vmlldy5jaGVja0hvb2tzIHx8ICh0Vmlldy5jaGVja0hvb2tzID0gW10pKS5wdXNoKC1kaXJlY3RpdmVJbmRleCwgb25DaGFuZ2VzKTtcbiAgfVxuXG4gIGlmIChvbkluaXQpIHtcbiAgICAodFZpZXcuaW5pdEhvb2tzIHx8ICh0Vmlldy5pbml0SG9va3MgPSBbXSkpLnB1c2goZGlyZWN0aXZlSW5kZXgsIG9uSW5pdCk7XG4gIH1cblxuICBpZiAoZG9DaGVjaykge1xuICAgICh0Vmlldy5pbml0SG9va3MgfHwgKHRWaWV3LmluaXRIb29rcyA9IFtdKSkucHVzaChkaXJlY3RpdmVJbmRleCwgZG9DaGVjayk7XG4gICAgKHRWaWV3LmNoZWNrSG9va3MgfHwgKHRWaWV3LmNoZWNrSG9va3MgPSBbXSkpLnB1c2goZGlyZWN0aXZlSW5kZXgsIGRvQ2hlY2spO1xuICB9XG59XG5cbi8qKlxuICpcbiAqIExvb3BzIHRocm91Z2ggdGhlIGRpcmVjdGl2ZXMgb24gdGhlIHByb3ZpZGVkIGB0Tm9kZWAgYW5kIHF1ZXVlcyBob29rcyB0byBiZVxuICogcnVuIHRoYXQgYXJlIG5vdCBpbml0aWFsaXphdGlvbiBob29rcy5cbiAqXG4gKiBTaG91bGQgYmUgZXhlY3V0ZWQgZHVyaW5nIGBlbGVtZW50RW5kKClgIGFuZCBzaW1pbGFyIHRvXG4gKiBwcmVzZXJ2ZSBob29rIGV4ZWN1dGlvbiBvcmRlci4gQ29udGVudCwgdmlldywgYW5kIGRlc3Ryb3kgaG9va3MgZm9yIHByb2plY3RlZFxuICogY29tcG9uZW50cyBhbmQgZGlyZWN0aXZlcyBtdXN0IGJlIGNhbGxlZCAqYmVmb3JlKiB0aGVpciBob3N0cy5cbiAqXG4gKiBTZXRzIHVwIHRoZSBjb250ZW50LCB2aWV3LCBhbmQgZGVzdHJveSBob29rcyBvbiB0aGUgcHJvdmlkZWQgYHRWaWV3YCBzdWNoIHRoYXRcbiAqIHRoZXkncmUgYWRkZWQgaW4gYWx0ZXJuYXRpbmcgcGFpcnMgb2YgZGlyZWN0aXZlSW5kZXggYW5kIGhvb2tGdW5jdGlvbixcbiAqIGkuZS46IGBbZGlyZWN0aXZlSW5kZXhBLCBob29rRnVuY3Rpb25BLCBkaXJlY3RpdmVJbmRleEIsIGhvb2tGdW5jdGlvbkIsIC4uLl1gXG4gKlxuICogTk9URTogVGhpcyBkb2VzIG5vdCBzZXQgdXAgYG9uQ2hhbmdlc2AsIGBvbkluaXRgIG9yIGBkb0NoZWNrYCwgdGhvc2UgYXJlIHNldCB1cFxuICogc2VwYXJhdGVseSBhdCBgZWxlbWVudFN0YXJ0YC5cbiAqXG4gKiBAcGFyYW0gdFZpZXcgVGhlIGN1cnJlbnQgVFZpZXdcbiAqIEBwYXJhbSB0Tm9kZSBUaGUgVE5vZGUgd2hvc2UgZGlyZWN0aXZlcyBhcmUgdG8gYmUgc2VhcmNoZWQgZm9yIGhvb2tzIHRvIHF1ZXVlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZWdpc3RlclBvc3RPcmRlckhvb2tzKHRWaWV3OiBUVmlldywgdE5vZGU6IFROb2RlKTogdm9pZCB7XG4gIGlmICh0Vmlldy5maXJzdFRlbXBsYXRlUGFzcykge1xuICAgIC8vIEl0J3MgbmVjZXNzYXJ5IHRvIGxvb3AgdGhyb3VnaCB0aGUgZGlyZWN0aXZlcyBhdCBlbGVtZW50RW5kKCkgKHJhdGhlciB0aGFuIHByb2Nlc3NpbmcgaW5cbiAgICAvLyBkaXJlY3RpdmVDcmVhdGUpIHNvIHdlIGNhbiBwcmVzZXJ2ZSB0aGUgY3VycmVudCBob29rIG9yZGVyLiBDb250ZW50LCB2aWV3LCBhbmQgZGVzdHJveVxuICAgIC8vIGhvb2tzIGZvciBwcm9qZWN0ZWQgY29tcG9uZW50cyBhbmQgZGlyZWN0aXZlcyBtdXN0IGJlIGNhbGxlZCAqYmVmb3JlKiB0aGVpciBob3N0cy5cbiAgICBmb3IgKGxldCBpID0gdE5vZGUuZGlyZWN0aXZlU3RhcnQsIGVuZCA9IHROb2RlLmRpcmVjdGl2ZUVuZDsgaSA8IGVuZDsgaSsrKSB7XG4gICAgICBjb25zdCBkaXJlY3RpdmVEZWYgPSB0Vmlldy5kYXRhW2ldIGFzIERpcmVjdGl2ZURlZjxhbnk+O1xuICAgICAgaWYgKGRpcmVjdGl2ZURlZi5hZnRlckNvbnRlbnRJbml0KSB7XG4gICAgICAgICh0Vmlldy5jb250ZW50SG9va3MgfHwgKHRWaWV3LmNvbnRlbnRIb29rcyA9IFtdKSkucHVzaChpLCBkaXJlY3RpdmVEZWYuYWZ0ZXJDb250ZW50SW5pdCk7XG4gICAgICB9XG5cbiAgICAgIGlmIChkaXJlY3RpdmVEZWYuYWZ0ZXJDb250ZW50Q2hlY2tlZCkge1xuICAgICAgICAodFZpZXcuY29udGVudEhvb2tzIHx8ICh0Vmlldy5jb250ZW50SG9va3MgPSBbXSkpLnB1c2goaSwgZGlyZWN0aXZlRGVmLmFmdGVyQ29udGVudENoZWNrZWQpO1xuICAgICAgICAodFZpZXcuY29udGVudENoZWNrSG9va3MgfHwgKHRWaWV3LmNvbnRlbnRDaGVja0hvb2tzID0gW1xuICAgICAgICAgXSkpLnB1c2goaSwgZGlyZWN0aXZlRGVmLmFmdGVyQ29udGVudENoZWNrZWQpO1xuICAgICAgfVxuXG4gICAgICBpZiAoZGlyZWN0aXZlRGVmLmFmdGVyVmlld0luaXQpIHtcbiAgICAgICAgKHRWaWV3LnZpZXdIb29rcyB8fCAodFZpZXcudmlld0hvb2tzID0gW10pKS5wdXNoKGksIGRpcmVjdGl2ZURlZi5hZnRlclZpZXdJbml0KTtcbiAgICAgIH1cblxuICAgICAgaWYgKGRpcmVjdGl2ZURlZi5hZnRlclZpZXdDaGVja2VkKSB7XG4gICAgICAgICh0Vmlldy52aWV3SG9va3MgfHwgKHRWaWV3LnZpZXdIb29rcyA9IFtdKSkucHVzaChpLCBkaXJlY3RpdmVEZWYuYWZ0ZXJWaWV3Q2hlY2tlZCk7XG4gICAgICAgICh0Vmlldy52aWV3Q2hlY2tIb29rcyB8fCAodFZpZXcudmlld0NoZWNrSG9va3MgPSBbXG4gICAgICAgICBdKSkucHVzaChpLCBkaXJlY3RpdmVEZWYuYWZ0ZXJWaWV3Q2hlY2tlZCk7XG4gICAgICB9XG5cbiAgICAgIGlmIChkaXJlY3RpdmVEZWYub25EZXN0cm95ICE9IG51bGwpIHtcbiAgICAgICAgKHRWaWV3LmRlc3Ryb3lIb29rcyB8fCAodFZpZXcuZGVzdHJveUhvb2tzID0gW10pKS5wdXNoKGksIGRpcmVjdGl2ZURlZi5vbkRlc3Ryb3kpO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEV4ZWN1dGVzIG5lY2Vzc2FyeSBob29rcyBhdCB0aGUgc3RhcnQgb2YgZXhlY3V0aW5nIGEgdGVtcGxhdGUuXG4gKlxuICogRXhlY3V0ZXMgaG9va3MgdGhhdCBhcmUgdG8gYmUgcnVuIGR1cmluZyB0aGUgaW5pdGlhbGl6YXRpb24gb2YgYSBkaXJlY3RpdmUgc3VjaFxuICogYXMgYG9uQ2hhbmdlc2AsIGBvbkluaXRgLCBhbmQgYGRvQ2hlY2tgLlxuICpcbiAqIEhhcyB0aGUgc2lkZSBlZmZlY3Qgb2YgdXBkYXRpbmcgdGhlIFJ1bkluaXQgZmxhZyBpbiBgbFZpZXdgIHRvIGJlIGAwYCwgc28gdGhhdFxuICogdGhpcyBpc24ndCBydW4gYSBzZWNvbmQgdGltZS5cbiAqXG4gKiBAcGFyYW0gbFZpZXcgVGhlIGN1cnJlbnQgdmlld1xuICogQHBhcmFtIHRWaWV3IFN0YXRpYyBkYXRhIGZvciB0aGUgdmlldyBjb250YWluaW5nIHRoZSBob29rcyB0byBiZSBleGVjdXRlZFxuICogQHBhcmFtIGNoZWNrTm9DaGFuZ2VzTW9kZSBXaGV0aGVyIG9yIG5vdCB3ZSdyZSBpbiBjaGVja05vQ2hhbmdlcyBtb2RlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZXhlY3V0ZUluaXRIb29rcyhcbiAgICBjdXJyZW50VmlldzogTFZpZXcsIHRWaWV3OiBUVmlldywgY2hlY2tOb0NoYW5nZXNNb2RlOiBib29sZWFuKTogdm9pZCB7XG4gIGlmICghY2hlY2tOb0NoYW5nZXNNb2RlICYmIGN1cnJlbnRWaWV3W0ZMQUdTXSAmIExWaWV3RmxhZ3MuUnVuSW5pdCkge1xuICAgIGV4ZWN1dGVIb29rcyhjdXJyZW50VmlldywgdFZpZXcuaW5pdEhvb2tzLCB0Vmlldy5jaGVja0hvb2tzLCBjaGVja05vQ2hhbmdlc01vZGUpO1xuICAgIGN1cnJlbnRWaWV3W0ZMQUdTXSAmPSB+TFZpZXdGbGFncy5SdW5Jbml0O1xuICB9XG59XG5cbi8qKlxuICogRXhlY3V0ZXMgaG9va3MgYWdhaW5zdCB0aGUgZ2l2ZW4gYExWaWV3YCBiYXNlZCBvZmYgb2Ygd2hldGhlciBvciBub3RcbiAqIFRoaXMgaXMgdGhlIGZpcnN0IHBhc3MuXG4gKlxuICogQHBhcmFtIGxWaWV3IFRoZSB2aWV3IGluc3RhbmNlIGRhdGEgdG8gcnVuIHRoZSBob29rcyBhZ2FpbnN0XG4gKiBAcGFyYW0gZmlyc3RQYXNzSG9va3MgQW4gYXJyYXkgb2YgaG9va3MgdG8gcnVuIGlmIHdlJ3JlIGluIHRoZSBmaXJzdCB2aWV3IHBhc3NcbiAqIEBwYXJhbSBjaGVja0hvb2tzIEFuIEFycmF5IG9mIGhvb2tzIHRvIHJ1biBpZiB3ZSdyZSBub3QgaW4gdGhlIGZpcnN0IHZpZXcgcGFzcy5cbiAqIEBwYXJhbSBjaGVja05vQ2hhbmdlc01vZGUgV2hldGhlciBvciBub3Qgd2UncmUgaW4gbm8gY2hhbmdlcyBtb2RlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZXhlY3V0ZUhvb2tzKFxuICAgIGN1cnJlbnRWaWV3OiBMVmlldywgZmlyc3RQYXNzSG9va3M6IEhvb2tEYXRhIHwgbnVsbCwgY2hlY2tIb29rczogSG9va0RhdGEgfCBudWxsLFxuICAgIGNoZWNrTm9DaGFuZ2VzTW9kZTogYm9vbGVhbik6IHZvaWQge1xuICBpZiAoY2hlY2tOb0NoYW5nZXNNb2RlKSByZXR1cm47XG5cbiAgY29uc3QgaG9va3NUb0NhbGwgPSBjdXJyZW50Vmlld1tGTEFHU10gJiBMVmlld0ZsYWdzLkZpcnN0TFZpZXdQYXNzID8gZmlyc3RQYXNzSG9va3MgOiBjaGVja0hvb2tzO1xuICBpZiAoaG9va3NUb0NhbGwpIHtcbiAgICBjYWxsSG9va3MoY3VycmVudFZpZXcsIGhvb2tzVG9DYWxsKTtcbiAgfVxufVxuXG4vKipcbiAqIENhbGxzIGxpZmVjeWNsZSBob29rcyB3aXRoIHRoZWlyIGNvbnRleHRzLCBza2lwcGluZyBpbml0IGhvb2tzIGlmIGl0J3Mgbm90XG4gKiB0aGUgZmlyc3QgTFZpZXcgcGFzcywgYW5kIHNraXBwaW5nIG9uQ2hhbmdlcyBob29rcyBpZiB0aGVyZSBhcmUgbm8gY2hhbmdlcyBwcmVzZW50LlxuICpcbiAqIEBwYXJhbSBjdXJyZW50VmlldyBUaGUgY3VycmVudCB2aWV3XG4gKiBAcGFyYW0gYXJyIFRoZSBhcnJheSBpbiB3aGljaCB0aGUgaG9va3MgYXJlIGZvdW5kXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjYWxsSG9va3MoY3VycmVudFZpZXc6IExWaWV3LCBhcnI6IEhvb2tEYXRhKTogdm9pZCB7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgYXJyLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgY29uc3QgZGlyZWN0aXZlSW5kZXggPSBhcnJbaV0gYXMgbnVtYmVyO1xuICAgIGNvbnN0IGhvb2sgPSBhcnJbaSArIDFdIGFzKCgoKSA9PiB2b2lkKSB8ICgoY2hhbmdlczogU2ltcGxlQ2hhbmdlcykgPT4gdm9pZCkpO1xuICAgIC8vIE5lZ2F0aXZlIGluZGljZXMgc2lnbmFsIHRoYXQgd2UncmUgZGVhbGluZyB3aXRoIGFuIGBvbkNoYW5nZXNgIGhvb2suXG4gICAgY29uc3QgaXNPbkNoYW5nZXNIb29rID0gZGlyZWN0aXZlSW5kZXggPCAwO1xuICAgIGNvbnN0IGRpcmVjdGl2ZU9yV3JhcHBlZERpcmVjdGl2ZSA9XG4gICAgICAgIGN1cnJlbnRWaWV3W2lzT25DaGFuZ2VzSG9vayA/IC1kaXJlY3RpdmVJbmRleCA6IGRpcmVjdGl2ZUluZGV4XTtcbiAgICBjb25zdCBkaXJlY3RpdmUgPSB1bndyYXBPbkNoYW5nZXNEaXJlY3RpdmVXcmFwcGVyKGRpcmVjdGl2ZU9yV3JhcHBlZERpcmVjdGl2ZSk7XG5cbiAgICBpZiAoaXNPbkNoYW5nZXNIb29rKSB7XG4gICAgICBjb25zdCBvbkNoYW5nZXM6IE9uQ2hhbmdlc0RpcmVjdGl2ZVdyYXBwZXIgPSBkaXJlY3RpdmVPcldyYXBwZWREaXJlY3RpdmU7XG4gICAgICBjb25zdCBjaGFuZ2VzID0gb25DaGFuZ2VzLmNoYW5nZXM7XG4gICAgICBpZiAoY2hhbmdlcykge1xuICAgICAgICBvbkNoYW5nZXMucHJldmlvdXMgPSBjaGFuZ2VzO1xuICAgICAgICBvbkNoYW5nZXMuY2hhbmdlcyA9IG51bGw7XG4gICAgICAgIGhvb2suY2FsbChvbkNoYW5nZXMuaW5zdGFuY2UsIGNoYW5nZXMpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBob29rLmNhbGwoZGlyZWN0aXZlKTtcbiAgICB9XG4gIH1cbn1cbiJdfQ==