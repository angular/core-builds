/**
 * @fileoverview added by tsickle
 * Generated from: packages/core/src/render3/instructions/advance.ts
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { assertDataInRange, assertGreaterThan } from '../../util/assert';
import { executeCheckHooks, executeInitAndCheckHooks } from '../hooks';
import { FLAGS, HEADER_OFFSET, TVIEW } from '../interfaces/view';
import { getCheckNoChangesMode, getLView, getSelectedIndex, setSelectedIndex } from '../state';
/**
 * Advances to an element for later binding instructions.
 *
 * Used in conjunction with instructions like {\@link property} to act on elements with specified
 * indices, for example those created with {\@link element} or {\@link elementStart}.
 *
 * ```ts
 * (rf: RenderFlags, ctx: any) => {
 *   if (rf & 1) {
 *     text(0, 'Hello');
 *     text(1, 'Goodbye')
 *     element(2, 'div');
 *   }
 *   if (rf & 2) {
 *     advance(2); // Advance twice to the <div>.
 *     property('title', 'test');
 *   }
 *  }
 * ```
 * \@codeGenApi
 * @param {?} delta Number of elements to advance forwards by.
 *
 * @return {?}
 */
export function ɵɵadvance(delta) {
    ngDevMode && assertGreaterThan(delta, 0, 'Can only advance forward');
    selectIndexInternal(getLView(), getSelectedIndex() + delta, getCheckNoChangesMode());
}
/**
 * Selects an element for later binding instructions.
 * @deprecated No longer being generated, but still used in unit tests.
 * \@codeGenApi
 * @param {?} index
 * @return {?}
 */
export function ɵɵselect(index) {
    // TODO(misko): Remove this function as it is no longer being used.
    selectIndexInternal(getLView(), index, getCheckNoChangesMode());
}
/**
 * @param {?} lView
 * @param {?} index
 * @param {?} checkNoChangesMode
 * @return {?}
 */
export function selectIndexInternal(lView, index, checkNoChangesMode) {
    ngDevMode && assertGreaterThan(index, -1, 'Invalid index');
    ngDevMode && assertDataInRange(lView, index + HEADER_OFFSET);
    // Flush the initial hooks for elements in the view that have been added up to this point.
    // PERF WARNING: do NOT extract this to a separate function without running benchmarks
    if (!checkNoChangesMode) {
        /** @type {?} */
        const hooksInitPhaseCompleted = (lView[FLAGS] & 3 /* InitPhaseStateMask */) === 3 /* InitPhaseCompleted */;
        if (hooksInitPhaseCompleted) {
            /** @type {?} */
            const preOrderCheckHooks = lView[TVIEW].preOrderCheckHooks;
            if (preOrderCheckHooks !== null) {
                executeCheckHooks(lView, preOrderCheckHooks, index);
            }
        }
        else {
            /** @type {?} */
            const preOrderHooks = lView[TVIEW].preOrderHooks;
            if (preOrderHooks !== null) {
                executeInitAndCheckHooks(lView, preOrderHooks, 0 /* OnInitHooksToBeRun */, index);
            }
        }
    }
    // We must set the selected index *after* running the hooks, because hooks may have side-effects
    // that cause other template functions to run, thus updating the selected index, which is global
    // state. If we run `setSelectedIndex` *before* we run the hooks, in some cases the selected index
    // will be altered by the time we leave the `ɵɵadvance` instruction.
    setSelectedIndex(index);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWR2YW5jZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaW5zdHJ1Y3Rpb25zL2FkdmFuY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBT0EsT0FBTyxFQUFDLGlCQUFpQixFQUFFLGlCQUFpQixFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDdkUsT0FBTyxFQUFDLGlCQUFpQixFQUFFLHdCQUF3QixFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQ3JFLE9BQU8sRUFBQyxLQUFLLEVBQUUsYUFBYSxFQUFxQyxLQUFLLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUNsRyxPQUFPLEVBQUMscUJBQXFCLEVBQUUsUUFBUSxFQUFFLGdCQUFnQixFQUFFLGdCQUFnQixFQUFDLE1BQU0sVUFBVSxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBMkI3RixNQUFNLFVBQVUsU0FBUyxDQUFDLEtBQWE7SUFDckMsU0FBUyxJQUFJLGlCQUFpQixDQUFDLEtBQUssRUFBRSxDQUFDLEVBQUUsMEJBQTBCLENBQUMsQ0FBQztJQUNyRSxtQkFBbUIsQ0FBQyxRQUFRLEVBQUUsRUFBRSxnQkFBZ0IsRUFBRSxHQUFHLEtBQUssRUFBRSxxQkFBcUIsRUFBRSxDQUFDLENBQUM7QUFDdkYsQ0FBQzs7Ozs7Ozs7QUFPRCxNQUFNLFVBQVUsUUFBUSxDQUFDLEtBQWE7SUFDcEMsbUVBQW1FO0lBQ25FLG1CQUFtQixDQUFDLFFBQVEsRUFBRSxFQUFFLEtBQUssRUFBRSxxQkFBcUIsRUFBRSxDQUFDLENBQUM7QUFDbEUsQ0FBQzs7Ozs7OztBQUVELE1BQU0sVUFBVSxtQkFBbUIsQ0FBQyxLQUFZLEVBQUUsS0FBYSxFQUFFLGtCQUEyQjtJQUMxRixTQUFTLElBQUksaUJBQWlCLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxFQUFFLGVBQWUsQ0FBQyxDQUFDO0lBQzNELFNBQVMsSUFBSSxpQkFBaUIsQ0FBQyxLQUFLLEVBQUUsS0FBSyxHQUFHLGFBQWEsQ0FBQyxDQUFDO0lBRTdELDBGQUEwRjtJQUMxRixzRkFBc0Y7SUFDdEYsSUFBSSxDQUFDLGtCQUFrQixFQUFFOztjQUNqQix1QkFBdUIsR0FDekIsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLDZCQUFnQyxDQUFDLCtCQUFzQztRQUN4RixJQUFJLHVCQUF1QixFQUFFOztrQkFDckIsa0JBQWtCLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLGtCQUFrQjtZQUMxRCxJQUFJLGtCQUFrQixLQUFLLElBQUksRUFBRTtnQkFDL0IsaUJBQWlCLENBQUMsS0FBSyxFQUFFLGtCQUFrQixFQUFFLEtBQUssQ0FBQyxDQUFDO2FBQ3JEO1NBQ0Y7YUFBTTs7a0JBQ0MsYUFBYSxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxhQUFhO1lBQ2hELElBQUksYUFBYSxLQUFLLElBQUksRUFBRTtnQkFDMUIsd0JBQXdCLENBQUMsS0FBSyxFQUFFLGFBQWEsOEJBQXFDLEtBQUssQ0FBQyxDQUFDO2FBQzFGO1NBQ0Y7S0FDRjtJQUVELGdHQUFnRztJQUNoRyxnR0FBZ0c7SUFDaEcsa0dBQWtHO0lBQ2xHLG9FQUFvRTtJQUNwRSxnQkFBZ0IsQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUMxQixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0IHthc3NlcnREYXRhSW5SYW5nZSwgYXNzZXJ0R3JlYXRlclRoYW59IGZyb20gJy4uLy4uL3V0aWwvYXNzZXJ0JztcbmltcG9ydCB7ZXhlY3V0ZUNoZWNrSG9va3MsIGV4ZWN1dGVJbml0QW5kQ2hlY2tIb29rc30gZnJvbSAnLi4vaG9va3MnO1xuaW1wb3J0IHtGTEFHUywgSEVBREVSX09GRlNFVCwgSW5pdFBoYXNlU3RhdGUsIExWaWV3LCBMVmlld0ZsYWdzLCBUVklFV30gZnJvbSAnLi4vaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7Z2V0Q2hlY2tOb0NoYW5nZXNNb2RlLCBnZXRMVmlldywgZ2V0U2VsZWN0ZWRJbmRleCwgc2V0U2VsZWN0ZWRJbmRleH0gZnJvbSAnLi4vc3RhdGUnO1xuXG5cblxuLyoqXG4gKiBBZHZhbmNlcyB0byBhbiBlbGVtZW50IGZvciBsYXRlciBiaW5kaW5nIGluc3RydWN0aW9ucy5cbiAqXG4gKiBVc2VkIGluIGNvbmp1bmN0aW9uIHdpdGggaW5zdHJ1Y3Rpb25zIGxpa2Uge0BsaW5rIHByb3BlcnR5fSB0byBhY3Qgb24gZWxlbWVudHMgd2l0aCBzcGVjaWZpZWRcbiAqIGluZGljZXMsIGZvciBleGFtcGxlIHRob3NlIGNyZWF0ZWQgd2l0aCB7QGxpbmsgZWxlbWVudH0gb3Ige0BsaW5rIGVsZW1lbnRTdGFydH0uXG4gKlxuICogYGBgdHNcbiAqIChyZjogUmVuZGVyRmxhZ3MsIGN0eDogYW55KSA9PiB7XG4gICogICBpZiAocmYgJiAxKSB7XG4gICogICAgIHRleHQoMCwgJ0hlbGxvJyk7XG4gICogICAgIHRleHQoMSwgJ0dvb2RieWUnKVxuICAqICAgICBlbGVtZW50KDIsICdkaXYnKTtcbiAgKiAgIH1cbiAgKiAgIGlmIChyZiAmIDIpIHtcbiAgKiAgICAgYWR2YW5jZSgyKTsgLy8gQWR2YW5jZSB0d2ljZSB0byB0aGUgPGRpdj4uXG4gICogICAgIHByb3BlcnR5KCd0aXRsZScsICd0ZXN0Jyk7XG4gICogICB9XG4gICogIH1cbiAgKiBgYGBcbiAgKiBAcGFyYW0gZGVsdGEgTnVtYmVyIG9mIGVsZW1lbnRzIHRvIGFkdmFuY2UgZm9yd2FyZHMgYnkuXG4gICpcbiAgKiBAY29kZUdlbkFwaVxuICAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVhZHZhbmNlKGRlbHRhOiBudW1iZXIpOiB2b2lkIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEdyZWF0ZXJUaGFuKGRlbHRhLCAwLCAnQ2FuIG9ubHkgYWR2YW5jZSBmb3J3YXJkJyk7XG4gIHNlbGVjdEluZGV4SW50ZXJuYWwoZ2V0TFZpZXcoKSwgZ2V0U2VsZWN0ZWRJbmRleCgpICsgZGVsdGEsIGdldENoZWNrTm9DaGFuZ2VzTW9kZSgpKTtcbn1cblxuLyoqXG4gKiBTZWxlY3RzIGFuIGVsZW1lbnQgZm9yIGxhdGVyIGJpbmRpbmcgaW5zdHJ1Y3Rpb25zLlxuICogQGRlcHJlY2F0ZWQgTm8gbG9uZ2VyIGJlaW5nIGdlbmVyYXRlZCwgYnV0IHN0aWxsIHVzZWQgaW4gdW5pdCB0ZXN0cy5cbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1c2VsZWN0KGluZGV4OiBudW1iZXIpOiB2b2lkIHtcbiAgLy8gVE9ETyhtaXNrbyk6IFJlbW92ZSB0aGlzIGZ1bmN0aW9uIGFzIGl0IGlzIG5vIGxvbmdlciBiZWluZyB1c2VkLlxuICBzZWxlY3RJbmRleEludGVybmFsKGdldExWaWV3KCksIGluZGV4LCBnZXRDaGVja05vQ2hhbmdlc01vZGUoKSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZWxlY3RJbmRleEludGVybmFsKGxWaWV3OiBMVmlldywgaW5kZXg6IG51bWJlciwgY2hlY2tOb0NoYW5nZXNNb2RlOiBib29sZWFuKSB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRHcmVhdGVyVGhhbihpbmRleCwgLTEsICdJbnZhbGlkIGluZGV4Jyk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREYXRhSW5SYW5nZShsVmlldywgaW5kZXggKyBIRUFERVJfT0ZGU0VUKTtcblxuICAvLyBGbHVzaCB0aGUgaW5pdGlhbCBob29rcyBmb3IgZWxlbWVudHMgaW4gdGhlIHZpZXcgdGhhdCBoYXZlIGJlZW4gYWRkZWQgdXAgdG8gdGhpcyBwb2ludC5cbiAgLy8gUEVSRiBXQVJOSU5HOiBkbyBOT1QgZXh0cmFjdCB0aGlzIHRvIGEgc2VwYXJhdGUgZnVuY3Rpb24gd2l0aG91dCBydW5uaW5nIGJlbmNobWFya3NcbiAgaWYgKCFjaGVja05vQ2hhbmdlc01vZGUpIHtcbiAgICBjb25zdCBob29rc0luaXRQaGFzZUNvbXBsZXRlZCA9XG4gICAgICAgIChsVmlld1tGTEFHU10gJiBMVmlld0ZsYWdzLkluaXRQaGFzZVN0YXRlTWFzaykgPT09IEluaXRQaGFzZVN0YXRlLkluaXRQaGFzZUNvbXBsZXRlZDtcbiAgICBpZiAoaG9va3NJbml0UGhhc2VDb21wbGV0ZWQpIHtcbiAgICAgIGNvbnN0IHByZU9yZGVyQ2hlY2tIb29rcyA9IGxWaWV3W1RWSUVXXS5wcmVPcmRlckNoZWNrSG9va3M7XG4gICAgICBpZiAocHJlT3JkZXJDaGVja0hvb2tzICE9PSBudWxsKSB7XG4gICAgICAgIGV4ZWN1dGVDaGVja0hvb2tzKGxWaWV3LCBwcmVPcmRlckNoZWNrSG9va3MsIGluZGV4KTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgcHJlT3JkZXJIb29rcyA9IGxWaWV3W1RWSUVXXS5wcmVPcmRlckhvb2tzO1xuICAgICAgaWYgKHByZU9yZGVySG9va3MgIT09IG51bGwpIHtcbiAgICAgICAgZXhlY3V0ZUluaXRBbmRDaGVja0hvb2tzKGxWaWV3LCBwcmVPcmRlckhvb2tzLCBJbml0UGhhc2VTdGF0ZS5PbkluaXRIb29rc1RvQmVSdW4sIGluZGV4KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvLyBXZSBtdXN0IHNldCB0aGUgc2VsZWN0ZWQgaW5kZXggKmFmdGVyKiBydW5uaW5nIHRoZSBob29rcywgYmVjYXVzZSBob29rcyBtYXkgaGF2ZSBzaWRlLWVmZmVjdHNcbiAgLy8gdGhhdCBjYXVzZSBvdGhlciB0ZW1wbGF0ZSBmdW5jdGlvbnMgdG8gcnVuLCB0aHVzIHVwZGF0aW5nIHRoZSBzZWxlY3RlZCBpbmRleCwgd2hpY2ggaXMgZ2xvYmFsXG4gIC8vIHN0YXRlLiBJZiB3ZSBydW4gYHNldFNlbGVjdGVkSW5kZXhgICpiZWZvcmUqIHdlIHJ1biB0aGUgaG9va3MsIGluIHNvbWUgY2FzZXMgdGhlIHNlbGVjdGVkIGluZGV4XG4gIC8vIHdpbGwgYmUgYWx0ZXJlZCBieSB0aGUgdGltZSB3ZSBsZWF2ZSB0aGUgYMm1ybVhZHZhbmNlYCBpbnN0cnVjdGlvbi5cbiAgc2V0U2VsZWN0ZWRJbmRleChpbmRleCk7XG59XG4iXX0=