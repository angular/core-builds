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
 * If this is the first template pass, any ngOnInit or ngDoCheck hooks will be queued into
 * TView.initHooks during directiveCreate.
 *
 * The directive index and hook type are encoded into one number (1st bit: type, remaining bits:
 * directive index), then saved in the even indices of the initHooks array. The odd indices
 * hold the hook functions themselves.
 *
 * @param {?} index The index of the directive in LView
 * @param {?} onInit
 * @param {?} doCheck
 * @param {?} tView The current TView
 * @return {?}
 */
export function queueInitHooks(index, onInit, doCheck, tView) {
    ngDevMode &&
        assertEqual(tView.firstTemplatePass, true, 'Should only be called on first template pass');
    if (onInit) {
        (tView.initHooks || (tView.initHooks = [])).push(index, onInit);
    }
    if (doCheck) {
        (tView.initHooks || (tView.initHooks = [])).push(index, doCheck);
        (tView.checkHooks || (tView.checkHooks = [])).push(index, doCheck);
    }
}
/**
 * Loops through the directives on a node and queues all their hooks except ngOnInit
 * and ngDoCheck, which are queued separately in directiveCreate.
 * @param {?} tView
 * @param {?} tNode
 * @return {?}
 */
export function queueLifecycleHooks(tView, tNode) {
    if (tView.firstTemplatePass) {
        // It's necessary to loop through the directives at elementEnd() (rather than processing in
        // directiveCreate) so we can preserve the current hook order. Content, view, and destroy
        // hooks for projected components and directives must be called *before* their hosts.
        for (let i = tNode.directiveStart, end = tNode.directiveEnd; i < end; i++) {
            /** @type {?} */
            const def = (/** @type {?} */ (tView.data[i]));
            queueContentHooks(def, tView, i);
            queueViewHooks(def, tView, i);
            queueDestroyHooks(def, tView, i);
        }
    }
}
/**
 * Queues afterContentInit and afterContentChecked hooks on TView
 * @param {?} def
 * @param {?} tView
 * @param {?} i
 * @return {?}
 */
function queueContentHooks(def, tView, i) {
    if (def.afterContentInit) {
        (tView.contentHooks || (tView.contentHooks = [])).push(i, def.afterContentInit);
    }
    if (def.afterContentChecked) {
        (tView.contentHooks || (tView.contentHooks = [])).push(i, def.afterContentChecked);
        (tView.contentCheckHooks || (tView.contentCheckHooks = [])).push(i, def.afterContentChecked);
    }
}
/**
 * Queues afterViewInit and afterViewChecked hooks on TView
 * @param {?} def
 * @param {?} tView
 * @param {?} i
 * @return {?}
 */
function queueViewHooks(def, tView, i) {
    if (def.afterViewInit) {
        (tView.viewHooks || (tView.viewHooks = [])).push(i, def.afterViewInit);
    }
    if (def.afterViewChecked) {
        (tView.viewHooks || (tView.viewHooks = [])).push(i, def.afterViewChecked);
        (tView.viewCheckHooks || (tView.viewCheckHooks = [])).push(i, def.afterViewChecked);
    }
}
/**
 * Queues onDestroy hooks on TView
 * @param {?} def
 * @param {?} tView
 * @param {?} i
 * @return {?}
 */
function queueDestroyHooks(def, tView, i) {
    if (def.onDestroy != null) {
        (tView.destroyHooks || (tView.destroyHooks = [])).push(i, def.onDestroy);
    }
}
/**
 * Calls onInit and doCheck calls if they haven't already been called.
 *
 * @param {?} currentView The current view
 * @param {?} tView
 * @param {?} checkNoChangesMode
 * @return {?}
 */
export function executeInitHooks(currentView, tView, checkNoChangesMode) {
    if (!checkNoChangesMode && currentView[FLAGS] & 32 /* RunInit */) {
        executeHooks(currentView, tView.initHooks, tView.checkHooks, checkNoChangesMode);
        currentView[FLAGS] &= ~32 /* RunInit */;
    }
}
/**
 * Iterates over afterViewInit and afterViewChecked functions and calls them.
 *
 * @param {?} currentView The current view
 * @param {?} allHooks
 * @param {?} checkHooks
 * @param {?} checkNoChangesMode
 * @return {?}
 */
export function executeHooks(currentView, allHooks, checkHooks, checkNoChangesMode) {
    if (checkNoChangesMode)
        return;
    /** @type {?} */
    const hooksToCall = currentView[FLAGS] & 2 /* FirstLViewPass */ ? allHooks : checkHooks;
    if (hooksToCall) {
        callHooks(currentView, hooksToCall);
    }
}
/**
 * Calls lifecycle hooks with their contexts, skipping init hooks if it's not
 * the first LView pass.
 *
 * @param {?} currentView The current view
 * @param {?} arr The array in which the hooks are found
 * @return {?}
 */
export function callHooks(currentView, arr) {
    for (let i = 0; i < arr.length; i += 2) {
        ((/** @type {?} */ (arr[i + 1]))).call(currentView[(/** @type {?} */ (arr[i]))]);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaG9va3MuanMiLCJzb3VyY2VSb290IjoiLi4vLi4vIiwic291cmNlcyI6WyJwYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2hvb2tzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUFDLFdBQVcsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBRzNDLE9BQU8sRUFBQyxLQUFLLEVBQXFDLE1BQU0sbUJBQW1CLENBQUM7Ozs7Ozs7Ozs7Ozs7OztBQWdCNUUsTUFBTSxVQUFVLGNBQWMsQ0FDMUIsS0FBYSxFQUFFLE1BQTJCLEVBQUUsT0FBNEIsRUFBRSxLQUFZO0lBQ3hGLFNBQVM7UUFDTCxXQUFXLENBQUMsS0FBSyxDQUFDLGlCQUFpQixFQUFFLElBQUksRUFBRSw4Q0FBOEMsQ0FBQyxDQUFDO0lBQy9GLElBQUksTUFBTSxFQUFFO1FBQ1YsQ0FBQyxLQUFLLENBQUMsU0FBUyxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLENBQUM7S0FDakU7SUFFRCxJQUFJLE9BQU8sRUFBRTtRQUNYLENBQUMsS0FBSyxDQUFDLFNBQVMsSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBQ2pFLENBQUMsS0FBSyxDQUFDLFVBQVUsSUFBSSxDQUFDLEtBQUssQ0FBQyxVQUFVLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLE9BQU8sQ0FBQyxDQUFDO0tBQ3BFO0FBQ0gsQ0FBQzs7Ozs7Ozs7QUFNRCxNQUFNLFVBQVUsbUJBQW1CLENBQUMsS0FBWSxFQUFFLEtBQVk7SUFDNUQsSUFBSSxLQUFLLENBQUMsaUJBQWlCLEVBQUU7UUFDM0IsMkZBQTJGO1FBQzNGLHlGQUF5RjtRQUN6RixxRkFBcUY7UUFDckYsS0FB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UUFDakYsV0FBVyxDQUFDLEtBQUssQ0FBQyxJQUFJLGlCQUFtQixDQUFDO0tBQzNDO0FBQ0gsQ0FBQzs7Ozs7Ozs7OztBQU9ELE1BQU0sVUFBVSxZQUFZLENBQ3hCLFdBQWtCLEVBQUUsUUFBeUIsRUFBRSxVQUEyQixFQUMxRSxrQkFBMkI7SUFDN0IsSUFBSSxrQkFBa0I7UUFBRSxPQUFPOztVQUV6QixXQUFXLEdBQUcsV0FBVyxDQUFDLEtBQUssQ0FBQyx5QkFBNEIsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxVQUFVO0lBQzFGLElBQUksV0FBVyxFQUFFO1FBQ2YsU0FBUyxDQUFDLFdBQVcsRUFBRSxXQUFXLENBQUMsQ0FBQztLQUNyQztBQUNILENBQUM7Ozs7Ozs7OztBQVNELE1BQU0sVUFBVSxTQUFTLENBQUMsV0FBa0IsRUFBRSxHQUFhO0lBQ3pELEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxHQUFHLENBQUMsTUFBTSxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUU7UUFDdEMsQ0FBQyxtQkFBQSxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFhLENBQUMsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLG1CQUFBLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBVSxDQUFDLENBQUMsQ0FBQztLQUMvRDtBQUNILENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7YXNzZXJ0RXF1YWx9IGZyb20gJy4uL3V0aWwvYXNzZXJ0JztcbmltcG9ydCB7RGlyZWN0aXZlRGVmfSBmcm9tICcuL2ludGVyZmFjZXMvZGVmaW5pdGlvbic7XG5pbXBvcnQge1ROb2RlfSBmcm9tICcuL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge0ZMQUdTLCBIb29rRGF0YSwgTFZpZXcsIExWaWV3RmxhZ3MsIFRWaWV3fSBmcm9tICcuL2ludGVyZmFjZXMvdmlldyc7XG5cblxuXG4vKipcbiAqIElmIHRoaXMgaXMgdGhlIGZpcnN0IHRlbXBsYXRlIHBhc3MsIGFueSBuZ09uSW5pdCBvciBuZ0RvQ2hlY2sgaG9va3Mgd2lsbCBiZSBxdWV1ZWQgaW50b1xuICogVFZpZXcuaW5pdEhvb2tzIGR1cmluZyBkaXJlY3RpdmVDcmVhdGUuXG4gKlxuICogVGhlIGRpcmVjdGl2ZSBpbmRleCBhbmQgaG9vayB0eXBlIGFyZSBlbmNvZGVkIGludG8gb25lIG51bWJlciAoMXN0IGJpdDogdHlwZSwgcmVtYWluaW5nIGJpdHM6XG4gKiBkaXJlY3RpdmUgaW5kZXgpLCB0aGVuIHNhdmVkIGluIHRoZSBldmVuIGluZGljZXMgb2YgdGhlIGluaXRIb29rcyBhcnJheS4gVGhlIG9kZCBpbmRpY2VzXG4gKiBob2xkIHRoZSBob29rIGZ1bmN0aW9ucyB0aGVtc2VsdmVzLlxuICpcbiAqIEBwYXJhbSBpbmRleCBUaGUgaW5kZXggb2YgdGhlIGRpcmVjdGl2ZSBpbiBMVmlld1xuICogQHBhcmFtIGhvb2tzIFRoZSBzdGF0aWMgaG9va3MgbWFwIG9uIHRoZSBkaXJlY3RpdmUgZGVmXG4gKiBAcGFyYW0gdFZpZXcgVGhlIGN1cnJlbnQgVFZpZXdcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHF1ZXVlSW5pdEhvb2tzKFxuICAgIGluZGV4OiBudW1iZXIsIG9uSW5pdDogKCgpID0+IHZvaWQpIHwgbnVsbCwgZG9DaGVjazogKCgpID0+IHZvaWQpIHwgbnVsbCwgdFZpZXc6IFRWaWV3KTogdm9pZCB7XG4gIG5nRGV2TW9kZSAmJlxuICAgICAgYXNzZXJ0RXF1YWwodFZpZXcuZmlyc3RUZW1wbGF0ZVBhc3MsIHRydWUsICdTaG91bGQgb25seSBiZSBjYWxsZWQgb24gZmlyc3QgdGVtcGxhdGUgcGFzcycpO1xuICBpZiAob25Jbml0KSB7XG4gICAgKHRWaWV3LmluaXRIb29rcyB8fCAodFZpZXcuaW5pdEhvb2tzID0gW10pKS5wdXNoKGluZGV4LCBvbkluaXQpO1xuICB9XG5cbiAgaWYgKGRvQ2hlY2spIHtcbiAgICAodFZpZXcuaW5pdEhvb2tzIHx8ICh0Vmlldy5pbml0SG9va3MgPSBbXSkpLnB1c2goaW5kZXgsIGRvQ2hlY2spO1xuICAgICh0Vmlldy5jaGVja0hvb2tzIHx8ICh0Vmlldy5jaGVja0hvb2tzID0gW10pKS5wdXNoKGluZGV4LCBkb0NoZWNrKTtcbiAgfVxufVxuXG4vKipcbiAqIExvb3BzIHRocm91Z2ggdGhlIGRpcmVjdGl2ZXMgb24gYSBub2RlIGFuZCBxdWV1ZXMgYWxsIHRoZWlyIGhvb2tzIGV4Y2VwdCBuZ09uSW5pdFxuICogYW5kIG5nRG9DaGVjaywgd2hpY2ggYXJlIHF1ZXVlZCBzZXBhcmF0ZWx5IGluIGRpcmVjdGl2ZUNyZWF0ZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHF1ZXVlTGlmZWN5Y2xlSG9va3ModFZpZXc6IFRWaWV3LCB0Tm9kZTogVE5vZGUpOiB2b2lkIHtcbiAgaWYgKHRWaWV3LmZpcnN0VGVtcGxhdGVQYXNzKSB7XG4gICAgLy8gSXQncyBuZWNlc3NhcnkgdG8gbG9vcCB0aHJvdWdoIHRoZSBkaXJlY3RpdmVzIGF0IGVsZW1lbnRFbmQoKSAocmF0aGVyIHRoYW4gcHJvY2Vzc2luZyBpblxuICAgIC8vIGRpcmVjdGl2ZUNyZWF0ZSkgc28gd2UgY2FuIHByZXNlcnZlIHRoZSBjdXJyZW50IGhvb2sgb3JkZXIuIENvbnRlbnQsIHZpZXcsIGFuZCBkZXN0cm95XG4gICAgLy8gaG9va3MgZm9yIHByb2plY3RlZCBjb21wb25lbnRzIGFuZCBkaXJlY3RpdmVzIG11c3QgYmUgY2FsbGVkICpiZWZvcmUqIHRoZWlyIGhvc3RzLlxuICAgIGZvciAobGV0IGkgPSB0Tm9kZS5kaXJlY3RpdmVTdGFydCwgZW5kID0gdE5vZGUuZGlyZWN0aXZlRW5kOyBpIDwgZW5kOyBpKyspIHtcbiAgICAgIGNvbnN0IGRlZiA9IHRWaWV3LmRhdGFbaV0gYXMgRGlyZWN0aXZlRGVmPGFueT47XG4gICAgICBxdWV1ZUNvbnRlbnRIb29rcyhkZWYsIHRWaWV3LCBpKTtcbiAgICAgIHF1ZXVlVmlld0hvb2tzKGRlZiwgdFZpZXcsIGkpO1xuICAgICAgcXVldWVEZXN0cm95SG9va3MoZGVmLCB0VmlldywgaSk7XG4gICAgfVxuICB9XG59XG5cbi8qKiBRdWV1ZXMgYWZ0ZXJDb250ZW50SW5pdCBhbmQgYWZ0ZXJDb250ZW50Q2hlY2tlZCBob29rcyBvbiBUVmlldyAqL1xuZnVuY3Rpb24gcXVldWVDb250ZW50SG9va3MoZGVmOiBEaXJlY3RpdmVEZWY8YW55PiwgdFZpZXc6IFRWaWV3LCBpOiBudW1iZXIpOiB2b2lkIHtcbiAgaWYgKGRlZi5hZnRlckNvbnRlbnRJbml0KSB7XG4gICAgKHRWaWV3LmNvbnRlbnRIb29rcyB8fCAodFZpZXcuY29udGVudEhvb2tzID0gW10pKS5wdXNoKGksIGRlZi5hZnRlckNvbnRlbnRJbml0KTtcbiAgfVxuXG4gIGlmIChkZWYuYWZ0ZXJDb250ZW50Q2hlY2tlZCkge1xuICAgICh0Vmlldy5jb250ZW50SG9va3MgfHwgKHRWaWV3LmNvbnRlbnRIb29rcyA9IFtdKSkucHVzaChpLCBkZWYuYWZ0ZXJDb250ZW50Q2hlY2tlZCk7XG4gICAgKHRWaWV3LmNvbnRlbnRDaGVja0hvb2tzIHx8ICh0Vmlldy5jb250ZW50Q2hlY2tIb29rcyA9IFtdKSkucHVzaChpLCBkZWYuYWZ0ZXJDb250ZW50Q2hlY2tlZCk7XG4gIH1cbn1cblxuLyoqIFF1ZXVlcyBhZnRlclZpZXdJbml0IGFuZCBhZnRlclZpZXdDaGVja2VkIGhvb2tzIG9uIFRWaWV3ICovXG5mdW5jdGlvbiBxdWV1ZVZpZXdIb29rcyhkZWY6IERpcmVjdGl2ZURlZjxhbnk+LCB0VmlldzogVFZpZXcsIGk6IG51bWJlcik6IHZvaWQge1xuICBpZiAoZGVmLmFmdGVyVmlld0luaXQpIHtcbiAgICAodFZpZXcudmlld0hvb2tzIHx8ICh0Vmlldy52aWV3SG9va3MgPSBbXSkpLnB1c2goaSwgZGVmLmFmdGVyVmlld0luaXQpO1xuICB9XG5cbiAgaWYgKGRlZi5hZnRlclZpZXdDaGVja2VkKSB7XG4gICAgKHRWaWV3LnZpZXdIb29rcyB8fCAodFZpZXcudmlld0hvb2tzID0gW10pKS5wdXNoKGksIGRlZi5hZnRlclZpZXdDaGVja2VkKTtcbiAgICAodFZpZXcudmlld0NoZWNrSG9va3MgfHwgKHRWaWV3LnZpZXdDaGVja0hvb2tzID0gW10pKS5wdXNoKGksIGRlZi5hZnRlclZpZXdDaGVja2VkKTtcbiAgfVxufVxuXG4vKiogUXVldWVzIG9uRGVzdHJveSBob29rcyBvbiBUVmlldyAqL1xuZnVuY3Rpb24gcXVldWVEZXN0cm95SG9va3MoZGVmOiBEaXJlY3RpdmVEZWY8YW55PiwgdFZpZXc6IFRWaWV3LCBpOiBudW1iZXIpOiB2b2lkIHtcbiAgaWYgKGRlZi5vbkRlc3Ryb3kgIT0gbnVsbCkge1xuICAgICh0Vmlldy5kZXN0cm95SG9va3MgfHwgKHRWaWV3LmRlc3Ryb3lIb29rcyA9IFtdKSkucHVzaChpLCBkZWYub25EZXN0cm95KTtcbiAgfVxufVxuXG4vKipcbiAqIENhbGxzIG9uSW5pdCBhbmQgZG9DaGVjayBjYWxscyBpZiB0aGV5IGhhdmVuJ3QgYWxyZWFkeSBiZWVuIGNhbGxlZC5cbiAqXG4gKiBAcGFyYW0gY3VycmVudFZpZXcgVGhlIGN1cnJlbnQgdmlld1xuICovXG5leHBvcnQgZnVuY3Rpb24gZXhlY3V0ZUluaXRIb29rcyhcbiAgICBjdXJyZW50VmlldzogTFZpZXcsIHRWaWV3OiBUVmlldywgY2hlY2tOb0NoYW5nZXNNb2RlOiBib29sZWFuKTogdm9pZCB7XG4gIGlmICghY2hlY2tOb0NoYW5nZXNNb2RlICYmIGN1cnJlbnRWaWV3W0ZMQUdTXSAmIExWaWV3RmxhZ3MuUnVuSW5pdCkge1xuICAgIGV4ZWN1dGVIb29rcyhjdXJyZW50VmlldywgdFZpZXcuaW5pdEhvb2tzLCB0Vmlldy5jaGVja0hvb2tzLCBjaGVja05vQ2hhbmdlc01vZGUpO1xuICAgIGN1cnJlbnRWaWV3W0ZMQUdTXSAmPSB+TFZpZXdGbGFncy5SdW5Jbml0O1xuICB9XG59XG5cbi8qKlxuICogSXRlcmF0ZXMgb3ZlciBhZnRlclZpZXdJbml0IGFuZCBhZnRlclZpZXdDaGVja2VkIGZ1bmN0aW9ucyBhbmQgY2FsbHMgdGhlbS5cbiAqXG4gKiBAcGFyYW0gY3VycmVudFZpZXcgVGhlIGN1cnJlbnQgdmlld1xuICovXG5leHBvcnQgZnVuY3Rpb24gZXhlY3V0ZUhvb2tzKFxuICAgIGN1cnJlbnRWaWV3OiBMVmlldywgYWxsSG9va3M6IEhvb2tEYXRhIHwgbnVsbCwgY2hlY2tIb29rczogSG9va0RhdGEgfCBudWxsLFxuICAgIGNoZWNrTm9DaGFuZ2VzTW9kZTogYm9vbGVhbik6IHZvaWQge1xuICBpZiAoY2hlY2tOb0NoYW5nZXNNb2RlKSByZXR1cm47XG5cbiAgY29uc3QgaG9va3NUb0NhbGwgPSBjdXJyZW50Vmlld1tGTEFHU10gJiBMVmlld0ZsYWdzLkZpcnN0TFZpZXdQYXNzID8gYWxsSG9va3MgOiBjaGVja0hvb2tzO1xuICBpZiAoaG9va3NUb0NhbGwpIHtcbiAgICBjYWxsSG9va3MoY3VycmVudFZpZXcsIGhvb2tzVG9DYWxsKTtcbiAgfVxufVxuXG4vKipcbiAqIENhbGxzIGxpZmVjeWNsZSBob29rcyB3aXRoIHRoZWlyIGNvbnRleHRzLCBza2lwcGluZyBpbml0IGhvb2tzIGlmIGl0J3Mgbm90XG4gKiB0aGUgZmlyc3QgTFZpZXcgcGFzcy5cbiAqXG4gKiBAcGFyYW0gY3VycmVudFZpZXcgVGhlIGN1cnJlbnQgdmlld1xuICogQHBhcmFtIGFyciBUaGUgYXJyYXkgaW4gd2hpY2ggdGhlIGhvb2tzIGFyZSBmb3VuZFxuICovXG5leHBvcnQgZnVuY3Rpb24gY2FsbEhvb2tzKGN1cnJlbnRWaWV3OiBhbnlbXSwgYXJyOiBIb29rRGF0YSk6IHZvaWQge1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGFyci5sZW5ndGg7IGkgKz0gMikge1xuICAgIChhcnJbaSArIDFdIGFzKCkgPT4gdm9pZCkuY2FsbChjdXJyZW50Vmlld1thcnJbaV0gYXMgbnVtYmVyXSk7XG4gIH1cbn1cbiJdfQ==