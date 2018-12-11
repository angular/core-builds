/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { assertEqual } from './assert';
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
            const def = /** @type {?} */ (tView.data[i]);
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
 * @param {?} creationMode
 * @return {?}
 */
export function executeInitHooks(currentView, tView, creationMode) {
    if (currentView[FLAGS] & 16 /* RunInit */) {
        executeHooks(currentView, tView.initHooks, tView.checkHooks, creationMode);
        currentView[FLAGS] &= ~16 /* RunInit */;
    }
}
/**
 * Iterates over afterViewInit and afterViewChecked functions and calls them.
 *
 * @param {?} data
 * @param {?} allHooks
 * @param {?} checkHooks
 * @param {?} creationMode
 * @return {?}
 */
export function executeHooks(data, allHooks, checkHooks, creationMode) {
    /** @type {?} */
    const hooksToCall = creationMode ? allHooks : checkHooks;
    if (hooksToCall) {
        callHooks(data, hooksToCall);
    }
}
/**
 * Calls lifecycle hooks with their contexts, skipping init hooks if it's not
 * creation mode.
 *
 * @param {?} currentView The current view
 * @param {?} arr The array in which the hooks are found
 * @return {?}
 */
export function callHooks(currentView, arr) {
    for (let i = 0; i < arr.length; i += 2) {
        (/** @type {?} */ (arr[i + 1])).call(currentView[/** @type {?} */ (arr[i])]);
    }
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaG9va3MuanMiLCJzb3VyY2VSb290IjoiLi4vLi4vIiwic291cmNlcyI6WyJwYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2hvb2tzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUFDLFdBQVcsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUdyQyxPQUFPLEVBQUMsS0FBSyxFQUFxQyxNQUFNLG1CQUFtQixDQUFDOzs7Ozs7Ozs7Ozs7Ozs7QUFnQjVFLE1BQU0sVUFBVSxjQUFjLENBQzFCLEtBQWEsRUFBRSxNQUEyQixFQUFFLE9BQTRCLEVBQUUsS0FBWTtJQUN4RixTQUFTO1FBQ0wsV0FBVyxDQUFDLEtBQUssQ0FBQyxpQkFBaUIsRUFBRSxJQUFJLEVBQUUsOENBQThDLENBQUMsQ0FBQztJQUMvRixJQUFJLE1BQU0sRUFBRTtRQUNWLENBQUMsS0FBSyxDQUFDLFNBQVMsSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0tBQ2pFO0lBRUQsSUFBSSxPQUFPLEVBQUU7UUFDWCxDQUFDLEtBQUssQ0FBQyxTQUFTLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxPQUFPLENBQUMsQ0FBQztRQUNqRSxDQUFDLEtBQUssQ0FBQyxVQUFVLElBQUksQ0FBQyxLQUFLLENBQUMsVUFBVSxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxPQUFPLENBQUMsQ0FBQztLQUNwRTtDQUNGOzs7Ozs7OztBQU1ELE1BQU0sVUFBVSxtQkFBbUIsQ0FBQyxLQUFZLEVBQUUsS0FBWTtJQUM1RCxJQUFJLEtBQUssQ0FBQyxpQkFBaUIsRUFBRTs7OztRQUkzQixLQUFLLElBQUksQ0FBQyxHQUFHLEtBQUssQ0FBQyxjQUFjLEVBQUUsR0FBRyxH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Q3hCLElBQVcsRUFBRSxRQUF5QixFQUFFLFVBQTJCLEVBQ25FLFlBQXFCOztJQUN2QixNQUFNLFdBQVcsR0FBRyxZQUFZLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDO0lBQ3pELElBQUksV0FBVyxFQUFFO1FBQ2YsU0FBUyxDQUFDLElBQUksRUFBRSxXQUFXLENBQUMsQ0FBQztLQUM5QjtDQUNGOzs7Ozs7Ozs7QUFTRCxNQUFNLFVBQVUsU0FBUyxDQUFDLFdBQWtCLEVBQUUsR0FBYTtJQUN6RCxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsR0FBRyxDQUFDLE1BQU0sRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFO1FBQ3RDLG1CQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFjLEVBQUMsQ0FBQyxJQUFJLENBQUMsV0FBVyxtQkFBQyxHQUFHLENBQUMsQ0FBQyxDQUFXLEVBQUMsQ0FBQyxDQUFDO0tBQy9EO0NBQ0YiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7YXNzZXJ0RXF1YWx9IGZyb20gJy4vYXNzZXJ0JztcbmltcG9ydCB7RGlyZWN0aXZlRGVmfSBmcm9tICcuL2ludGVyZmFjZXMvZGVmaW5pdGlvbic7XG5pbXBvcnQge1ROb2RlfSBmcm9tICcuL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge0ZMQUdTLCBIb29rRGF0YSwgTFZpZXcsIExWaWV3RmxhZ3MsIFRWaWV3fSBmcm9tICcuL2ludGVyZmFjZXMvdmlldyc7XG5cblxuXG4vKipcbiAqIElmIHRoaXMgaXMgdGhlIGZpcnN0IHRlbXBsYXRlIHBhc3MsIGFueSBuZ09uSW5pdCBvciBuZ0RvQ2hlY2sgaG9va3Mgd2lsbCBiZSBxdWV1ZWQgaW50b1xuICogVFZpZXcuaW5pdEhvb2tzIGR1cmluZyBkaXJlY3RpdmVDcmVhdGUuXG4gKlxuICogVGhlIGRpcmVjdGl2ZSBpbmRleCBhbmQgaG9vayB0eXBlIGFyZSBlbmNvZGVkIGludG8gb25lIG51bWJlciAoMXN0IGJpdDogdHlwZSwgcmVtYWluaW5nIGJpdHM6XG4gKiBkaXJlY3RpdmUgaW5kZXgpLCB0aGVuIHNhdmVkIGluIHRoZSBldmVuIGluZGljZXMgb2YgdGhlIGluaXRIb29rcyBhcnJheS4gVGhlIG9kZCBpbmRpY2VzXG4gKiBob2xkIHRoZSBob29rIGZ1bmN0aW9ucyB0aGVtc2VsdmVzLlxuICpcbiAqIEBwYXJhbSBpbmRleCBUaGUgaW5kZXggb2YgdGhlIGRpcmVjdGl2ZSBpbiBMVmlld1xuICogQHBhcmFtIGhvb2tzIFRoZSBzdGF0aWMgaG9va3MgbWFwIG9uIHRoZSBkaXJlY3RpdmUgZGVmXG4gKiBAcGFyYW0gdFZpZXcgVGhlIGN1cnJlbnQgVFZpZXdcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHF1ZXVlSW5pdEhvb2tzKFxuICAgIGluZGV4OiBudW1iZXIsIG9uSW5pdDogKCgpID0+IHZvaWQpIHwgbnVsbCwgZG9DaGVjazogKCgpID0+IHZvaWQpIHwgbnVsbCwgdFZpZXc6IFRWaWV3KTogdm9pZCB7XG4gIG5nRGV2TW9kZSAmJlxuICAgICAgYXNzZXJ0RXF1YWwodFZpZXcuZmlyc3RUZW1wbGF0ZVBhc3MsIHRydWUsICdTaG91bGQgb25seSBiZSBjYWxsZWQgb24gZmlyc3QgdGVtcGxhdGUgcGFzcycpO1xuICBpZiAob25Jbml0KSB7XG4gICAgKHRWaWV3LmluaXRIb29rcyB8fCAodFZpZXcuaW5pdEhvb2tzID0gW10pKS5wdXNoKGluZGV4LCBvbkluaXQpO1xuICB9XG5cbiAgaWYgKGRvQ2hlY2spIHtcbiAgICAodFZpZXcuaW5pdEhvb2tzIHx8ICh0Vmlldy5pbml0SG9va3MgPSBbXSkpLnB1c2goaW5kZXgsIGRvQ2hlY2spO1xuICAgICh0Vmlldy5jaGVja0hvb2tzIHx8ICh0Vmlldy5jaGVja0hvb2tzID0gW10pKS5wdXNoKGluZGV4LCBkb0NoZWNrKTtcbiAgfVxufVxuXG4vKipcbiAqIExvb3BzIHRocm91Z2ggdGhlIGRpcmVjdGl2ZXMgb24gYSBub2RlIGFuZCBxdWV1ZXMgYWxsIHRoZWlyIGhvb2tzIGV4Y2VwdCBuZ09uSW5pdFxuICogYW5kIG5nRG9DaGVjaywgd2hpY2ggYXJlIHF1ZXVlZCBzZXBhcmF0ZWx5IGluIGRpcmVjdGl2ZUNyZWF0ZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHF1ZXVlTGlmZWN5Y2xlSG9va3ModFZpZXc6IFRWaWV3LCB0Tm9kZTogVE5vZGUpOiB2b2lkIHtcbiAgaWYgKHRWaWV3LmZpcnN0VGVtcGxhdGVQYXNzKSB7XG4gICAgLy8gSXQncyBuZWNlc3NhcnkgdG8gbG9vcCB0aHJvdWdoIHRoZSBkaXJlY3RpdmVzIGF0IGVsZW1lbnRFbmQoKSAocmF0aGVyIHRoYW4gcHJvY2Vzc2luZyBpblxuICAgIC8vIGRpcmVjdGl2ZUNyZWF0ZSkgc28gd2UgY2FuIHByZXNlcnZlIHRoZSBjdXJyZW50IGhvb2sgb3JkZXIuIENvbnRlbnQsIHZpZXcsIGFuZCBkZXN0cm95XG4gICAgLy8gaG9va3MgZm9yIHByb2plY3RlZCBjb21wb25lbnRzIGFuZCBkaXJlY3RpdmVzIG11c3QgYmUgY2FsbGVkICpiZWZvcmUqIHRoZWlyIGhvc3RzLlxuICAgIGZvciAobGV0IGkgPSB0Tm9kZS5kaXJlY3RpdmVTdGFydCwgZW5kID0gdE5vZGUuZGlyZWN0aXZlRW5kOyBpIDwgZW5kOyBpKyspIHtcbiAgICAgIGNvbnN0IGRlZiA9IHRWaWV3LmRhdGFbaV0gYXMgRGlyZWN0aXZlRGVmPGFueT47XG4gICAgICBxdWV1ZUNvbnRlbnRIb29rcyhkZWYsIHRWaWV3LCBpKTtcbiAgICAgIHF1ZXVlVmlld0hvb2tzKGRlZiwgdFZpZXcsIGkpO1xuICAgICAgcXVldWVEZXN0cm95SG9va3MoZGVmLCB0VmlldywgaSk7XG4gICAgfVxuICB9XG59XG5cbi8qKiBRdWV1ZXMgYWZ0ZXJDb250ZW50SW5pdCBhbmQgYWZ0ZXJDb250ZW50Q2hlY2tlZCBob29rcyBvbiBUVmlldyAqL1xuZnVuY3Rpb24gcXVldWVDb250ZW50SG9va3MoZGVmOiBEaXJlY3RpdmVEZWY8YW55PiwgdFZpZXc6IFRWaWV3LCBpOiBudW1iZXIpOiB2b2lkIHtcbiAgaWYgKGRlZi5hZnRlckNvbnRlbnRJbml0KSB7XG4gICAgKHRWaWV3LmNvbnRlbnRIb29rcyB8fCAodFZpZXcuY29udGVudEhvb2tzID0gW10pKS5wdXNoKGksIGRlZi5hZnRlckNvbnRlbnRJbml0KTtcbiAgfVxuXG4gIGlmIChkZWYuYWZ0ZXJDb250ZW50Q2hlY2tlZCkge1xuICAgICh0Vmlldy5jb250ZW50SG9va3MgfHwgKHRWaWV3LmNvbnRlbnRIb29rcyA9IFtdKSkucHVzaChpLCBkZWYuYWZ0ZXJDb250ZW50Q2hlY2tlZCk7XG4gICAgKHRWaWV3LmNvbnRlbnRDaGVja0hvb2tzIHx8ICh0Vmlldy5jb250ZW50Q2hlY2tIb29rcyA9IFtdKSkucHVzaChpLCBkZWYuYWZ0ZXJDb250ZW50Q2hlY2tlZCk7XG4gIH1cbn1cblxuLyoqIFF1ZXVlcyBhZnRlclZpZXdJbml0IGFuZCBhZnRlclZpZXdDaGVja2VkIGhvb2tzIG9uIFRWaWV3ICovXG5mdW5jdGlvbiBxdWV1ZVZpZXdIb29rcyhkZWY6IERpcmVjdGl2ZURlZjxhbnk+LCB0VmlldzogVFZpZXcsIGk6IG51bWJlcik6IHZvaWQge1xuICBpZiAoZGVmLmFmdGVyVmlld0luaXQpIHtcbiAgICAodFZpZXcudmlld0hvb2tzIHx8ICh0Vmlldy52aWV3SG9va3MgPSBbXSkpLnB1c2goaSwgZGVmLmFmdGVyVmlld0luaXQpO1xuICB9XG5cbiAgaWYgKGRlZi5hZnRlclZpZXdDaGVja2VkKSB7XG4gICAgKHRWaWV3LnZpZXdIb29rcyB8fCAodFZpZXcudmlld0hvb2tzID0gW10pKS5wdXNoKGksIGRlZi5hZnRlclZpZXdDaGVja2VkKTtcbiAgICAodFZpZXcudmlld0NoZWNrSG9va3MgfHwgKHRWaWV3LnZpZXdDaGVja0hvb2tzID0gW10pKS5wdXNoKGksIGRlZi5hZnRlclZpZXdDaGVja2VkKTtcbiAgfVxufVxuXG4vKiogUXVldWVzIG9uRGVzdHJveSBob29rcyBvbiBUVmlldyAqL1xuZnVuY3Rpb24gcXVldWVEZXN0cm95SG9va3MoZGVmOiBEaXJlY3RpdmVEZWY8YW55PiwgdFZpZXc6IFRWaWV3LCBpOiBudW1iZXIpOiB2b2lkIHtcbiAgaWYgKGRlZi5vbkRlc3Ryb3kgIT0gbnVsbCkge1xuICAgICh0Vmlldy5kZXN0cm95SG9va3MgfHwgKHRWaWV3LmRlc3Ryb3lIb29rcyA9IFtdKSkucHVzaChpLCBkZWYub25EZXN0cm95KTtcbiAgfVxufVxuXG4vKipcbiAqIENhbGxzIG9uSW5pdCBhbmQgZG9DaGVjayBjYWxscyBpZiB0aGV5IGhhdmVuJ3QgYWxyZWFkeSBiZWVuIGNhbGxlZC5cbiAqXG4gKiBAcGFyYW0gY3VycmVudFZpZXcgVGhlIGN1cnJlbnQgdmlld1xuICovXG5leHBvcnQgZnVuY3Rpb24gZXhlY3V0ZUluaXRIb29rcyhjdXJyZW50VmlldzogTFZpZXcsIHRWaWV3OiBUVmlldywgY3JlYXRpb25Nb2RlOiBib29sZWFuKTogdm9pZCB7XG4gIGlmIChjdXJyZW50Vmlld1tGTEFHU10gJiBMVmlld0ZsYWdzLlJ1bkluaXQpIHtcbiAgICBleGVjdXRlSG9va3MoY3VycmVudFZpZXcsIHRWaWV3LmluaXRIb29rcywgdFZpZXcuY2hlY2tIb29rcywgY3JlYXRpb25Nb2RlKTtcbiAgICBjdXJyZW50Vmlld1tGTEFHU10gJj0gfkxWaWV3RmxhZ3MuUnVuSW5pdDtcbiAgfVxufVxuXG4vKipcbiAqIEl0ZXJhdGVzIG92ZXIgYWZ0ZXJWaWV3SW5pdCBhbmQgYWZ0ZXJWaWV3Q2hlY2tlZCBmdW5jdGlvbnMgYW5kIGNhbGxzIHRoZW0uXG4gKlxuICogQHBhcmFtIGN1cnJlbnRWaWV3IFRoZSBjdXJyZW50IHZpZXdcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGV4ZWN1dGVIb29rcyhcbiAgICBkYXRhOiBMVmlldywgYWxsSG9va3M6IEhvb2tEYXRhIHwgbnVsbCwgY2hlY2tIb29rczogSG9va0RhdGEgfCBudWxsLFxuICAgIGNyZWF0aW9uTW9kZTogYm9vbGVhbik6IHZvaWQge1xuICBjb25zdCBob29rc1RvQ2FsbCA9IGNyZWF0aW9uTW9kZSA/IGFsbEhvb2tzIDogY2hlY2tIb29rcztcbiAgaWYgKGhvb2tzVG9DYWxsKSB7XG4gICAgY2FsbEhvb2tzKGRhdGEsIGhvb2tzVG9DYWxsKTtcbiAgfVxufVxuXG4vKipcbiAqIENhbGxzIGxpZmVjeWNsZSBob29rcyB3aXRoIHRoZWlyIGNvbnRleHRzLCBza2lwcGluZyBpbml0IGhvb2tzIGlmIGl0J3Mgbm90XG4gKiBjcmVhdGlvbiBtb2RlLlxuICpcbiAqIEBwYXJhbSBjdXJyZW50VmlldyBUaGUgY3VycmVudCB2aWV3XG4gKiBAcGFyYW0gYXJyIFRoZSBhcnJheSBpbiB3aGljaCB0aGUgaG9va3MgYXJlIGZvdW5kXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjYWxsSG9va3MoY3VycmVudFZpZXc6IGFueVtdLCBhcnI6IEhvb2tEYXRhKTogdm9pZCB7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgYXJyLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgKGFycltpICsgMV0gYXMoKSA9PiB2b2lkKS5jYWxsKGN1cnJlbnRWaWV3W2FycltpXSBhcyBudW1iZXJdKTtcbiAgfVxufVxuIl19