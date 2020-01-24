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
import { executeElementExitFn, getCheckNoChangesMode, getLView, getSelectedIndex, hasActiveElementFlag, setSelectedIndex } from '../state';
/**
 * Advances to an element for later binding instructions.
 *
 * Used in conjunction with instructions like {@link property} to act on elements with specified
 * indices, for example those created with {@link element} or {@link elementStart}.
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
  * @param delta Number of elements to advance forwards by.
  *
  * @codeGenApi
  */
export function ɵɵadvance(delta) {
    ngDevMode && assertGreaterThan(delta, 0, 'Can only advance forward');
    selectIndexInternal(getLView(), getSelectedIndex() + delta, getCheckNoChangesMode());
}
/**
 * Selects an element for later binding instructions.
 * @deprecated No longer being generated, but still used in unit tests.
 * @codeGenApi
 */
export function ɵɵselect(index) {
    selectIndexInternal(getLView(), index, getCheckNoChangesMode());
}
export function selectIndexInternal(lView, index, checkNoChangesMode) {
    ngDevMode && assertGreaterThan(index, -1, 'Invalid index');
    ngDevMode && assertDataInRange(lView, index + HEADER_OFFSET);
    if (hasActiveElementFlag(1 /* RunExitFn */)) {
        executeElementExitFn();
    }
    // Flush the initial hooks for elements in the view that have been added up to this point.
    // PERF WARNING: do NOT extract this to a separate function without running benchmarks
    if (!checkNoChangesMode) {
        var hooksInitPhaseCompleted = (lView[FLAGS] & 3 /* InitPhaseStateMask */) === 3 /* InitPhaseCompleted */;
        if (hooksInitPhaseCompleted) {
            var preOrderCheckHooks = lView[TVIEW].preOrderCheckHooks;
            if (preOrderCheckHooks !== null) {
                executeCheckHooks(lView, preOrderCheckHooks, index);
            }
        }
        else {
            var preOrderHooks = lView[TVIEW].preOrderHooks;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWR2YW5jZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaW5zdHJ1Y3Rpb25zL2FkdmFuY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBQ0gsT0FBTyxFQUFDLGlCQUFpQixFQUFFLGlCQUFpQixFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDdkUsT0FBTyxFQUFDLGlCQUFpQixFQUFFLHdCQUF3QixFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQ3JFLE9BQU8sRUFBQyxLQUFLLEVBQUUsYUFBYSxFQUFxQyxLQUFLLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUNsRyxPQUFPLEVBQXFCLG9CQUFvQixFQUFFLHFCQUFxQixFQUFFLFFBQVEsRUFBRSxnQkFBZ0IsRUFBRSxvQkFBb0IsRUFBRSxnQkFBZ0IsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUk3Sjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQXNCSTtBQUNKLE1BQU0sVUFBVSxTQUFTLENBQUMsS0FBYTtJQUNyQyxTQUFTLElBQUksaUJBQWlCLENBQUMsS0FBSyxFQUFFLENBQUMsRUFBRSwwQkFBMEIsQ0FBQyxDQUFDO0lBQ3JFLG1CQUFtQixDQUFDLFFBQVEsRUFBRSxFQUFFLGdCQUFnQixFQUFFLEdBQUcsS0FBSyxFQUFFLHFCQUFxQixFQUFFLENBQUMsQ0FBQztBQUN2RixDQUFDO0FBRUQ7Ozs7R0FJRztBQUNILE1BQU0sVUFBVSxRQUFRLENBQUMsS0FBYTtJQUNwQyxtQkFBbUIsQ0FBQyxRQUFRLEVBQUUsRUFBRSxLQUFLLEVBQUUscUJBQXFCLEVBQUUsQ0FBQyxDQUFDO0FBQ2xFLENBQUM7QUFFRCxNQUFNLFVBQVUsbUJBQW1CLENBQUMsS0FBWSxFQUFFLEtBQWEsRUFBRSxrQkFBMkI7SUFDMUYsU0FBUyxJQUFJLGlCQUFpQixDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsRUFBRSxlQUFlLENBQUMsQ0FBQztJQUMzRCxTQUFTLElBQUksaUJBQWlCLENBQUMsS0FBSyxFQUFFLEtBQUssR0FBRyxhQUFhLENBQUMsQ0FBQztJQUU3RCxJQUFJLG9CQUFvQixtQkFBOEIsRUFBRTtRQUN0RCxvQkFBb0IsRUFBRSxDQUFDO0tBQ3hCO0lBRUQsMEZBQTBGO0lBQzFGLHNGQUFzRjtJQUN0RixJQUFJLENBQUMsa0JBQWtCLEVBQUU7UUFDdkIsSUFBTSx1QkFBdUIsR0FDekIsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLDZCQUFnQyxDQUFDLCtCQUFzQyxDQUFDO1FBQ3pGLElBQUksdUJBQXVCLEVBQUU7WUFDM0IsSUFBTSxrQkFBa0IsR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsa0JBQWtCLENBQUM7WUFDM0QsSUFBSSxrQkFBa0IsS0FBSyxJQUFJLEVBQUU7Z0JBQy9CLGlCQUFpQixDQUFDLEtBQUssRUFBRSxrQkFBa0IsRUFBRSxLQUFLLENBQUMsQ0FBQzthQUNyRDtTQUNGO2FBQU07WUFDTCxJQUFNLGFBQWEsR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsYUFBYSxDQUFDO1lBQ2pELElBQUksYUFBYSxLQUFLLElBQUksRUFBRTtnQkFDMUIsd0JBQXdCLENBQUMsS0FBSyxFQUFFLGFBQWEsOEJBQXFDLEtBQUssQ0FBQyxDQUFDO2FBQzFGO1NBQ0Y7S0FDRjtJQUVELGdHQUFnRztJQUNoRyxnR0FBZ0c7SUFDaEcsa0dBQWtHO0lBQ2xHLG9FQUFvRTtJQUNwRSxnQkFBZ0IsQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUMxQixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0IHthc3NlcnREYXRhSW5SYW5nZSwgYXNzZXJ0R3JlYXRlclRoYW59IGZyb20gJy4uLy4uL3V0aWwvYXNzZXJ0JztcbmltcG9ydCB7ZXhlY3V0ZUNoZWNrSG9va3MsIGV4ZWN1dGVJbml0QW5kQ2hlY2tIb29rc30gZnJvbSAnLi4vaG9va3MnO1xuaW1wb3J0IHtGTEFHUywgSEVBREVSX09GRlNFVCwgSW5pdFBoYXNlU3RhdGUsIExWaWV3LCBMVmlld0ZsYWdzLCBUVklFV30gZnJvbSAnLi4vaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7QWN0aXZlRWxlbWVudEZsYWdzLCBleGVjdXRlRWxlbWVudEV4aXRGbiwgZ2V0Q2hlY2tOb0NoYW5nZXNNb2RlLCBnZXRMVmlldywgZ2V0U2VsZWN0ZWRJbmRleCwgaGFzQWN0aXZlRWxlbWVudEZsYWcsIHNldFNlbGVjdGVkSW5kZXh9IGZyb20gJy4uL3N0YXRlJztcblxuXG5cbi8qKlxuICogQWR2YW5jZXMgdG8gYW4gZWxlbWVudCBmb3IgbGF0ZXIgYmluZGluZyBpbnN0cnVjdGlvbnMuXG4gKlxuICogVXNlZCBpbiBjb25qdW5jdGlvbiB3aXRoIGluc3RydWN0aW9ucyBsaWtlIHtAbGluayBwcm9wZXJ0eX0gdG8gYWN0IG9uIGVsZW1lbnRzIHdpdGggc3BlY2lmaWVkXG4gKiBpbmRpY2VzLCBmb3IgZXhhbXBsZSB0aG9zZSBjcmVhdGVkIHdpdGgge0BsaW5rIGVsZW1lbnR9IG9yIHtAbGluayBlbGVtZW50U3RhcnR9LlxuICpcbiAqIGBgYHRzXG4gKiAocmY6IFJlbmRlckZsYWdzLCBjdHg6IGFueSkgPT4ge1xuICAqICAgaWYgKHJmICYgMSkge1xuICAqICAgICB0ZXh0KDAsICdIZWxsbycpO1xuICAqICAgICB0ZXh0KDEsICdHb29kYnllJylcbiAgKiAgICAgZWxlbWVudCgyLCAnZGl2Jyk7XG4gICogICB9XG4gICogICBpZiAocmYgJiAyKSB7XG4gICogICAgIGFkdmFuY2UoMik7IC8vIEFkdmFuY2UgdHdpY2UgdG8gdGhlIDxkaXY+LlxuICAqICAgICBwcm9wZXJ0eSgndGl0bGUnLCAndGVzdCcpO1xuICAqICAgfVxuICAqICB9XG4gICogYGBgXG4gICogQHBhcmFtIGRlbHRhIE51bWJlciBvZiBlbGVtZW50cyB0byBhZHZhbmNlIGZvcndhcmRzIGJ5LlxuICAqXG4gICogQGNvZGVHZW5BcGlcbiAgKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1YWR2YW5jZShkZWx0YTogbnVtYmVyKTogdm9pZCB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRHcmVhdGVyVGhhbihkZWx0YSwgMCwgJ0NhbiBvbmx5IGFkdmFuY2UgZm9yd2FyZCcpO1xuICBzZWxlY3RJbmRleEludGVybmFsKGdldExWaWV3KCksIGdldFNlbGVjdGVkSW5kZXgoKSArIGRlbHRhLCBnZXRDaGVja05vQ2hhbmdlc01vZGUoKSk7XG59XG5cbi8qKlxuICogU2VsZWN0cyBhbiBlbGVtZW50IGZvciBsYXRlciBiaW5kaW5nIGluc3RydWN0aW9ucy5cbiAqIEBkZXByZWNhdGVkIE5vIGxvbmdlciBiZWluZyBnZW5lcmF0ZWQsIGJ1dCBzdGlsbCB1c2VkIGluIHVuaXQgdGVzdHMuXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtXNlbGVjdChpbmRleDogbnVtYmVyKTogdm9pZCB7XG4gIHNlbGVjdEluZGV4SW50ZXJuYWwoZ2V0TFZpZXcoKSwgaW5kZXgsIGdldENoZWNrTm9DaGFuZ2VzTW9kZSgpKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNlbGVjdEluZGV4SW50ZXJuYWwobFZpZXc6IExWaWV3LCBpbmRleDogbnVtYmVyLCBjaGVja05vQ2hhbmdlc01vZGU6IGJvb2xlYW4pIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEdyZWF0ZXJUaGFuKGluZGV4LCAtMSwgJ0ludmFsaWQgaW5kZXgnKTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERhdGFJblJhbmdlKGxWaWV3LCBpbmRleCArIEhFQURFUl9PRkZTRVQpO1xuXG4gIGlmIChoYXNBY3RpdmVFbGVtZW50RmxhZyhBY3RpdmVFbGVtZW50RmxhZ3MuUnVuRXhpdEZuKSkge1xuICAgIGV4ZWN1dGVFbGVtZW50RXhpdEZuKCk7XG4gIH1cblxuICAvLyBGbHVzaCB0aGUgaW5pdGlhbCBob29rcyBmb3IgZWxlbWVudHMgaW4gdGhlIHZpZXcgdGhhdCBoYXZlIGJlZW4gYWRkZWQgdXAgdG8gdGhpcyBwb2ludC5cbiAgLy8gUEVSRiBXQVJOSU5HOiBkbyBOT1QgZXh0cmFjdCB0aGlzIHRvIGEgc2VwYXJhdGUgZnVuY3Rpb24gd2l0aG91dCBydW5uaW5nIGJlbmNobWFya3NcbiAgaWYgKCFjaGVja05vQ2hhbmdlc01vZGUpIHtcbiAgICBjb25zdCBob29rc0luaXRQaGFzZUNvbXBsZXRlZCA9XG4gICAgICAgIChsVmlld1tGTEFHU10gJiBMVmlld0ZsYWdzLkluaXRQaGFzZVN0YXRlTWFzaykgPT09IEluaXRQaGFzZVN0YXRlLkluaXRQaGFzZUNvbXBsZXRlZDtcbiAgICBpZiAoaG9va3NJbml0UGhhc2VDb21wbGV0ZWQpIHtcbiAgICAgIGNvbnN0IHByZU9yZGVyQ2hlY2tIb29rcyA9IGxWaWV3W1RWSUVXXS5wcmVPcmRlckNoZWNrSG9va3M7XG4gICAgICBpZiAocHJlT3JkZXJDaGVja0hvb2tzICE9PSBudWxsKSB7XG4gICAgICAgIGV4ZWN1dGVDaGVja0hvb2tzKGxWaWV3LCBwcmVPcmRlckNoZWNrSG9va3MsIGluZGV4KTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgcHJlT3JkZXJIb29rcyA9IGxWaWV3W1RWSUVXXS5wcmVPcmRlckhvb2tzO1xuICAgICAgaWYgKHByZU9yZGVySG9va3MgIT09IG51bGwpIHtcbiAgICAgICAgZXhlY3V0ZUluaXRBbmRDaGVja0hvb2tzKGxWaWV3LCBwcmVPcmRlckhvb2tzLCBJbml0UGhhc2VTdGF0ZS5PbkluaXRIb29rc1RvQmVSdW4sIGluZGV4KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvLyBXZSBtdXN0IHNldCB0aGUgc2VsZWN0ZWQgaW5kZXggKmFmdGVyKiBydW5uaW5nIHRoZSBob29rcywgYmVjYXVzZSBob29rcyBtYXkgaGF2ZSBzaWRlLWVmZmVjdHNcbiAgLy8gdGhhdCBjYXVzZSBvdGhlciB0ZW1wbGF0ZSBmdW5jdGlvbnMgdG8gcnVuLCB0aHVzIHVwZGF0aW5nIHRoZSBzZWxlY3RlZCBpbmRleCwgd2hpY2ggaXMgZ2xvYmFsXG4gIC8vIHN0YXRlLiBJZiB3ZSBydW4gYHNldFNlbGVjdGVkSW5kZXhgICpiZWZvcmUqIHdlIHJ1biB0aGUgaG9va3MsIGluIHNvbWUgY2FzZXMgdGhlIHNlbGVjdGVkIGluZGV4XG4gIC8vIHdpbGwgYmUgYWx0ZXJlZCBieSB0aGUgdGltZSB3ZSBsZWF2ZSB0aGUgYMm1ybVhZHZhbmNlYCBpbnN0cnVjdGlvbi5cbiAgc2V0U2VsZWN0ZWRJbmRleChpbmRleCk7XG59XG4iXX0=