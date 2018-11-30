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
 * @param {?} flags
 * @param {?} tView
 * @return {?}
 */
export function queueLifecycleHooks(flags, tView) {
    if (tView.firstTemplatePass) {
        /** @type {?} */
        const start = flags >> 16 /* DirectiveStartingIndexShift */;
        /** @type {?} */
        const count = flags & 4095 /* DirectiveCountMask */;
        /** @type {?} */
        const end = start + count;
        // It's necessary to loop through the directives at elementEnd() (rather than processing in
        // directiveCreate) so we can preserve the current hook order. Content, view, and destroy
        // hooks for projected components and directives must be called *before* their hosts.
        for (let i = start; i < end; i++) {
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaG9va3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2hvb2tzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUFDLFdBQVcsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUdyQyxPQUFPLEVBQUMsS0FBSyxFQUFxQyxNQUFNLG1CQUFtQixDQUFDOzs7Ozs7Ozs7Ozs7Ozs7QUFlNUUsTUFBTSxVQUFVLGNBQWMsQ0FDMUIsS0FBYSxFQUFFLE1BQTJCLEVBQUUsT0FBNEIsRUFBRSxLQUFZO0lBQ3hGLFNBQVM7UUFDTCxXQUFXLENBQUMsS0FBSyxDQUFDLGlCQUFpQixFQUFFLElBQUksRUFBRSw4Q0FBOEMsQ0FBQyxDQUFDO0lBQy9GLElBQUksTUFBTSxFQUFFO1FBQ1YsQ0FBQyxLQUFLLENBQUMsU0FBUyxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLENBQUM7S0FDakU7SUFFRCxJQUFJLE9BQU8sRUFBRTtRQUNYLENBQUMsS0FBSyxDQUFDLFNBQVMsSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBQ2pFLENBQUMsS0FBSyxDQUFDLFVBQVUsSUFBSSxDQUFDLEtBQUssQ0FBQyxVQUFVLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLE9BQU8sQ0FBQyxDQUFDO0tBQ3BFO0NBQ0Y7Ozs7Ozs7O0FBTUQsTUFBTSxVQUFVLG1CQUFtQixDQUFDLEtBQWEsRUFBRSxLQUFZO0lBQzdELElBQUksS0FBSyxDQUFDLGlCQUFpQixFQUFFOztRQUMzQixNQUFNLEtBQUssR0FBRyxLQUFLLHdDQUEwQyxDQUFDOztR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QUFDLENBQUM7UUFDM0UsV0FBVyxDQUFDLEtBQUssQ0FBQyxJQUFJLGlCQUFtQixDQUFDO0tBQzNDO0NBQ0Y7Ozs7Ozs7Ozs7QUFPRCxNQUFNLFVBQVUsWUFBWSxDQUN4QixJQUFXLEVBQUUsUUFBeUIsRUFBRSxVQUEyQixFQUNuRSxZQUFxQjs7SUFDdkIsTUFBTSxXQUFXLEdBQUcsWUFBWSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQztJQUN6RCxJQUFJLFdBQVcsRUFBRTtRQUNmLFNBQVMsQ0FBQyxJQUFJLEVBQUUsV0FBVyxDQUFDLENBQUM7S0FDOUI7Q0FDRjs7Ozs7Ozs7O0FBU0QsTUFBTSxVQUFVLFNBQVMsQ0FBQyxXQUFrQixFQUFFLEdBQWE7SUFDekQsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRTtRQUN0QyxtQkFBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBYyxFQUFDLENBQUMsSUFBSSxDQUFDLFdBQVcsbUJBQUMsR0FBRyxDQUFDLENBQUMsQ0FBVyxFQUFDLENBQUMsQ0FBQztLQUMvRDtDQUNGIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge2Fzc2VydEVxdWFsfSBmcm9tICcuL2Fzc2VydCc7XG5pbXBvcnQge0RpcmVjdGl2ZURlZn0gZnJvbSAnLi9pbnRlcmZhY2VzL2RlZmluaXRpb24nO1xuaW1wb3J0IHtUTm9kZUZsYWdzfSBmcm9tICcuL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge0ZMQUdTLCBIb29rRGF0YSwgTFZpZXcsIExWaWV3RmxhZ3MsIFRWaWV3fSBmcm9tICcuL2ludGVyZmFjZXMvdmlldyc7XG5cblxuLyoqXG4gKiBJZiB0aGlzIGlzIHRoZSBmaXJzdCB0ZW1wbGF0ZSBwYXNzLCBhbnkgbmdPbkluaXQgb3IgbmdEb0NoZWNrIGhvb2tzIHdpbGwgYmUgcXVldWVkIGludG9cbiAqIFRWaWV3LmluaXRIb29rcyBkdXJpbmcgZGlyZWN0aXZlQ3JlYXRlLlxuICpcbiAqIFRoZSBkaXJlY3RpdmUgaW5kZXggYW5kIGhvb2sgdHlwZSBhcmUgZW5jb2RlZCBpbnRvIG9uZSBudW1iZXIgKDFzdCBiaXQ6IHR5cGUsIHJlbWFpbmluZyBiaXRzOlxuICogZGlyZWN0aXZlIGluZGV4KSwgdGhlbiBzYXZlZCBpbiB0aGUgZXZlbiBpbmRpY2VzIG9mIHRoZSBpbml0SG9va3MgYXJyYXkuIFRoZSBvZGQgaW5kaWNlc1xuICogaG9sZCB0aGUgaG9vayBmdW5jdGlvbnMgdGhlbXNlbHZlcy5cbiAqXG4gKiBAcGFyYW0gaW5kZXggVGhlIGluZGV4IG9mIHRoZSBkaXJlY3RpdmUgaW4gTFZpZXdcbiAqIEBwYXJhbSBob29rcyBUaGUgc3RhdGljIGhvb2tzIG1hcCBvbiB0aGUgZGlyZWN0aXZlIGRlZlxuICogQHBhcmFtIHRWaWV3IFRoZSBjdXJyZW50IFRWaWV3XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBxdWV1ZUluaXRIb29rcyhcbiAgICBpbmRleDogbnVtYmVyLCBvbkluaXQ6ICgoKSA9PiB2b2lkKSB8IG51bGwsIGRvQ2hlY2s6ICgoKSA9PiB2b2lkKSB8IG51bGwsIHRWaWV3OiBUVmlldyk6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiZcbiAgICAgIGFzc2VydEVxdWFsKHRWaWV3LmZpcnN0VGVtcGxhdGVQYXNzLCB0cnVlLCAnU2hvdWxkIG9ubHkgYmUgY2FsbGVkIG9uIGZpcnN0IHRlbXBsYXRlIHBhc3MnKTtcbiAgaWYgKG9uSW5pdCkge1xuICAgICh0Vmlldy5pbml0SG9va3MgfHwgKHRWaWV3LmluaXRIb29rcyA9IFtdKSkucHVzaChpbmRleCwgb25Jbml0KTtcbiAgfVxuXG4gIGlmIChkb0NoZWNrKSB7XG4gICAgKHRWaWV3LmluaXRIb29rcyB8fCAodFZpZXcuaW5pdEhvb2tzID0gW10pKS5wdXNoKGluZGV4LCBkb0NoZWNrKTtcbiAgICAodFZpZXcuY2hlY2tIb29rcyB8fCAodFZpZXcuY2hlY2tIb29rcyA9IFtdKSkucHVzaChpbmRleCwgZG9DaGVjayk7XG4gIH1cbn1cblxuLyoqXG4gKiBMb29wcyB0aHJvdWdoIHRoZSBkaXJlY3RpdmVzIG9uIGEgbm9kZSBhbmQgcXVldWVzIGFsbCB0aGVpciBob29rcyBleGNlcHQgbmdPbkluaXRcbiAqIGFuZCBuZ0RvQ2hlY2ssIHdoaWNoIGFyZSBxdWV1ZWQgc2VwYXJhdGVseSBpbiBkaXJlY3RpdmVDcmVhdGUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBxdWV1ZUxpZmVjeWNsZUhvb2tzKGZsYWdzOiBudW1iZXIsIHRWaWV3OiBUVmlldyk6IHZvaWQge1xuICBpZiAodFZpZXcuZmlyc3RUZW1wbGF0ZVBhc3MpIHtcbiAgICBjb25zdCBzdGFydCA9IGZsYWdzID4+IFROb2RlRmxhZ3MuRGlyZWN0aXZlU3RhcnRpbmdJbmRleFNoaWZ0O1xuICAgIGNvbnN0IGNvdW50ID0gZmxhZ3MgJiBUTm9kZUZsYWdzLkRpcmVjdGl2ZUNvdW50TWFzaztcbiAgICBjb25zdCBlbmQgPSBzdGFydCArIGNvdW50O1xuXG4gICAgLy8gSXQncyBuZWNlc3NhcnkgdG8gbG9vcCB0aHJvdWdoIHRoZSBkaXJlY3RpdmVzIGF0IGVsZW1lbnRFbmQoKSAocmF0aGVyIHRoYW4gcHJvY2Vzc2luZyBpblxuICAgIC8vIGRpcmVjdGl2ZUNyZWF0ZSkgc28gd2UgY2FuIHByZXNlcnZlIHRoZSBjdXJyZW50IGhvb2sgb3JkZXIuIENvbnRlbnQsIHZpZXcsIGFuZCBkZXN0cm95XG4gICAgLy8gaG9va3MgZm9yIHByb2plY3RlZCBjb21wb25lbnRzIGFuZCBkaXJlY3RpdmVzIG11c3QgYmUgY2FsbGVkICpiZWZvcmUqIHRoZWlyIGhvc3RzLlxuICAgIGZvciAobGV0IGkgPSBzdGFydDsgaSA8IGVuZDsgaSsrKSB7XG4gICAgICBjb25zdCBkZWYgPSB0Vmlldy5kYXRhW2ldIGFzIERpcmVjdGl2ZURlZjxhbnk+O1xuICAgICAgcXVldWVDb250ZW50SG9va3MoZGVmLCB0VmlldywgaSk7XG4gICAgICBxdWV1ZVZpZXdIb29rcyhkZWYsIHRWaWV3LCBpKTtcbiAgICAgIHF1ZXVlRGVzdHJveUhvb2tzKGRlZiwgdFZpZXcsIGkpO1xuICAgIH1cbiAgfVxufVxuXG4vKiogUXVldWVzIGFmdGVyQ29udGVudEluaXQgYW5kIGFmdGVyQ29udGVudENoZWNrZWQgaG9va3Mgb24gVFZpZXcgKi9cbmZ1bmN0aW9uIHF1ZXVlQ29udGVudEhvb2tzKGRlZjogRGlyZWN0aXZlRGVmPGFueT4sIHRWaWV3OiBUVmlldywgaTogbnVtYmVyKTogdm9pZCB7XG4gIGlmIChkZWYuYWZ0ZXJDb250ZW50SW5pdCkge1xuICAgICh0Vmlldy5jb250ZW50SG9va3MgfHwgKHRWaWV3LmNvbnRlbnRIb29rcyA9IFtdKSkucHVzaChpLCBkZWYuYWZ0ZXJDb250ZW50SW5pdCk7XG4gIH1cblxuICBpZiAoZGVmLmFmdGVyQ29udGVudENoZWNrZWQpIHtcbiAgICAodFZpZXcuY29udGVudEhvb2tzIHx8ICh0Vmlldy5jb250ZW50SG9va3MgPSBbXSkpLnB1c2goaSwgZGVmLmFmdGVyQ29udGVudENoZWNrZWQpO1xuICAgICh0Vmlldy5jb250ZW50Q2hlY2tIb29rcyB8fCAodFZpZXcuY29udGVudENoZWNrSG9va3MgPSBbXSkpLnB1c2goaSwgZGVmLmFmdGVyQ29udGVudENoZWNrZWQpO1xuICB9XG59XG5cbi8qKiBRdWV1ZXMgYWZ0ZXJWaWV3SW5pdCBhbmQgYWZ0ZXJWaWV3Q2hlY2tlZCBob29rcyBvbiBUVmlldyAqL1xuZnVuY3Rpb24gcXVldWVWaWV3SG9va3MoZGVmOiBEaXJlY3RpdmVEZWY8YW55PiwgdFZpZXc6IFRWaWV3LCBpOiBudW1iZXIpOiB2b2lkIHtcbiAgaWYgKGRlZi5hZnRlclZpZXdJbml0KSB7XG4gICAgKHRWaWV3LnZpZXdIb29rcyB8fCAodFZpZXcudmlld0hvb2tzID0gW10pKS5wdXNoKGksIGRlZi5hZnRlclZpZXdJbml0KTtcbiAgfVxuXG4gIGlmIChkZWYuYWZ0ZXJWaWV3Q2hlY2tlZCkge1xuICAgICh0Vmlldy52aWV3SG9va3MgfHwgKHRWaWV3LnZpZXdIb29rcyA9IFtdKSkucHVzaChpLCBkZWYuYWZ0ZXJWaWV3Q2hlY2tlZCk7XG4gICAgKHRWaWV3LnZpZXdDaGVja0hvb2tzIHx8ICh0Vmlldy52aWV3Q2hlY2tIb29rcyA9IFtdKSkucHVzaChpLCBkZWYuYWZ0ZXJWaWV3Q2hlY2tlZCk7XG4gIH1cbn1cblxuLyoqIFF1ZXVlcyBvbkRlc3Ryb3kgaG9va3Mgb24gVFZpZXcgKi9cbmZ1bmN0aW9uIHF1ZXVlRGVzdHJveUhvb2tzKGRlZjogRGlyZWN0aXZlRGVmPGFueT4sIHRWaWV3OiBUVmlldywgaTogbnVtYmVyKTogdm9pZCB7XG4gIGlmIChkZWYub25EZXN0cm95ICE9IG51bGwpIHtcbiAgICAodFZpZXcuZGVzdHJveUhvb2tzIHx8ICh0Vmlldy5kZXN0cm95SG9va3MgPSBbXSkpLnB1c2goaSwgZGVmLm9uRGVzdHJveSk7XG4gIH1cbn1cblxuLyoqXG4gKiBDYWxscyBvbkluaXQgYW5kIGRvQ2hlY2sgY2FsbHMgaWYgdGhleSBoYXZlbid0IGFscmVhZHkgYmVlbiBjYWxsZWQuXG4gKlxuICogQHBhcmFtIGN1cnJlbnRWaWV3IFRoZSBjdXJyZW50IHZpZXdcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGV4ZWN1dGVJbml0SG9va3MoY3VycmVudFZpZXc6IExWaWV3LCB0VmlldzogVFZpZXcsIGNyZWF0aW9uTW9kZTogYm9vbGVhbik6IHZvaWQge1xuICBpZiAoY3VycmVudFZpZXdbRkxBR1NdICYgTFZpZXdGbGFncy5SdW5Jbml0KSB7XG4gICAgZXhlY3V0ZUhvb2tzKGN1cnJlbnRWaWV3LCB0Vmlldy5pbml0SG9va3MsIHRWaWV3LmNoZWNrSG9va3MsIGNyZWF0aW9uTW9kZSk7XG4gICAgY3VycmVudFZpZXdbRkxBR1NdICY9IH5MVmlld0ZsYWdzLlJ1bkluaXQ7XG4gIH1cbn1cblxuLyoqXG4gKiBJdGVyYXRlcyBvdmVyIGFmdGVyVmlld0luaXQgYW5kIGFmdGVyVmlld0NoZWNrZWQgZnVuY3Rpb25zIGFuZCBjYWxscyB0aGVtLlxuICpcbiAqIEBwYXJhbSBjdXJyZW50VmlldyBUaGUgY3VycmVudCB2aWV3XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBleGVjdXRlSG9va3MoXG4gICAgZGF0YTogTFZpZXcsIGFsbEhvb2tzOiBIb29rRGF0YSB8IG51bGwsIGNoZWNrSG9va3M6IEhvb2tEYXRhIHwgbnVsbCxcbiAgICBjcmVhdGlvbk1vZGU6IGJvb2xlYW4pOiB2b2lkIHtcbiAgY29uc3QgaG9va3NUb0NhbGwgPSBjcmVhdGlvbk1vZGUgPyBhbGxIb29rcyA6IGNoZWNrSG9va3M7XG4gIGlmIChob29rc1RvQ2FsbCkge1xuICAgIGNhbGxIb29rcyhkYXRhLCBob29rc1RvQ2FsbCk7XG4gIH1cbn1cblxuLyoqXG4gKiBDYWxscyBsaWZlY3ljbGUgaG9va3Mgd2l0aCB0aGVpciBjb250ZXh0cywgc2tpcHBpbmcgaW5pdCBob29rcyBpZiBpdCdzIG5vdFxuICogY3JlYXRpb24gbW9kZS5cbiAqXG4gKiBAcGFyYW0gY3VycmVudFZpZXcgVGhlIGN1cnJlbnQgdmlld1xuICogQHBhcmFtIGFyciBUaGUgYXJyYXkgaW4gd2hpY2ggdGhlIGhvb2tzIGFyZSBmb3VuZFxuICovXG5leHBvcnQgZnVuY3Rpb24gY2FsbEhvb2tzKGN1cnJlbnRWaWV3OiBhbnlbXSwgYXJyOiBIb29rRGF0YSk6IHZvaWQge1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGFyci5sZW5ndGg7IGkgKz0gMikge1xuICAgIChhcnJbaSArIDFdIGFzKCkgPT4gdm9pZCkuY2FsbChjdXJyZW50Vmlld1thcnJbaV0gYXMgbnVtYmVyXSk7XG4gIH1cbn1cbiJdfQ==