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
import { resetStylingState } from '../styling_next/state';
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
    if (hasActiveElementFlag(2 /* ResetStylesOnExit */)) {
        resetStylingState();
    }
    // We must set the selected index *after* running the hooks, because hooks may have side-effects
    // that cause other template functions to run, thus updating the selected index, which is global
    // state. If we run `setSelectedIndex` *before* we run the hooks, in some cases the selected index
    // will be altered by the time we leave the `ɵɵadvance` instruction.
    setSelectedIndex(index);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWR2YW5jZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaW5zdHJ1Y3Rpb25zL2FkdmFuY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBQ0gsT0FBTyxFQUFDLGlCQUFpQixFQUFFLGlCQUFpQixFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDdkUsT0FBTyxFQUFDLGlCQUFpQixFQUFFLHdCQUF3QixFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQ3JFLE9BQU8sRUFBQyxLQUFLLEVBQUUsYUFBYSxFQUFxQyxLQUFLLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUNsRyxPQUFPLEVBQXFCLG9CQUFvQixFQUFFLHFCQUFxQixFQUFFLFFBQVEsRUFBRSxnQkFBZ0IsRUFBRSxvQkFBb0IsRUFBRSxnQkFBZ0IsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUM3SixPQUFPLEVBQUMsaUJBQWlCLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUl4RDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQXNCSTtBQUNKLE1BQU0sVUFBVSxTQUFTLENBQUMsS0FBYTtJQUNyQyxTQUFTLElBQUksaUJBQWlCLENBQUMsS0FBSyxFQUFFLENBQUMsRUFBRSwwQkFBMEIsQ0FBQyxDQUFDO0lBQ3JFLG1CQUFtQixDQUFDLFFBQVEsRUFBRSxFQUFFLGdCQUFnQixFQUFFLEdBQUcsS0FBSyxFQUFFLHFCQUFxQixFQUFFLENBQUMsQ0FBQztBQUN2RixDQUFDO0FBRUQ7Ozs7R0FJRztBQUNILE1BQU0sVUFBVSxRQUFRLENBQUMsS0FBYTtJQUNwQyxtQkFBbUIsQ0FBQyxRQUFRLEVBQUUsRUFBRSxLQUFLLEVBQUUscUJBQXFCLEVBQUUsQ0FBQyxDQUFDO0FBQ2xFLENBQUM7QUFFRCxNQUFNLFVBQVUsbUJBQW1CLENBQUMsS0FBWSxFQUFFLEtBQWEsRUFBRSxrQkFBMkI7SUFDMUYsU0FBUyxJQUFJLGlCQUFpQixDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsRUFBRSxlQUFlLENBQUMsQ0FBQztJQUMzRCxTQUFTLElBQUksaUJBQWlCLENBQUMsS0FBSyxFQUFFLEtBQUssR0FBRyxhQUFhLENBQUMsQ0FBQztJQUU3RCxJQUFJLG9CQUFvQixtQkFBOEIsRUFBRTtRQUN0RCxvQkFBb0IsRUFBRSxDQUFDO0tBQ3hCO0lBRUQsMEZBQTBGO0lBQzFGLHNGQUFzRjtJQUN0RixJQUFJLENBQUMsa0JBQWtCLEVBQUU7UUFDdkIsSUFBTSx1QkFBdUIsR0FDekIsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLDZCQUFnQyxDQUFDLCtCQUFzQyxDQUFDO1FBQ3pGLElBQUksdUJBQXVCLEVBQUU7WUFDM0IsSUFBTSxrQkFBa0IsR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsa0JBQWtCLENBQUM7WUFDM0QsSUFBSSxrQkFBa0IsS0FBSyxJQUFJLEVBQUU7Z0JBQy9CLGlCQUFpQixDQUFDLEtBQUssRUFBRSxrQkFBa0IsRUFBRSxLQUFLLENBQUMsQ0FBQzthQUNyRDtTQUNGO2FBQU07WUFDTCxJQUFNLGFBQWEsR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsYUFBYSxDQUFDO1lBQ2pELElBQUksYUFBYSxLQUFLLElBQUksRUFBRTtnQkFDMUIsd0JBQXdCLENBQUMsS0FBSyxFQUFFLGFBQWEsOEJBQXFDLEtBQUssQ0FBQyxDQUFDO2FBQzFGO1NBQ0Y7S0FDRjtJQUVELElBQUksb0JBQW9CLDJCQUFzQyxFQUFFO1FBQzlELGlCQUFpQixFQUFFLENBQUM7S0FDckI7SUFFRCxnR0FBZ0c7SUFDaEcsZ0dBQWdHO0lBQ2hHLGtHQUFrRztJQUNsRyxvRUFBb0U7SUFDcEUsZ0JBQWdCLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDMUIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCB7YXNzZXJ0RGF0YUluUmFuZ2UsIGFzc2VydEdyZWF0ZXJUaGFufSBmcm9tICcuLi8uLi91dGlsL2Fzc2VydCc7XG5pbXBvcnQge2V4ZWN1dGVDaGVja0hvb2tzLCBleGVjdXRlSW5pdEFuZENoZWNrSG9va3N9IGZyb20gJy4uL2hvb2tzJztcbmltcG9ydCB7RkxBR1MsIEhFQURFUl9PRkZTRVQsIEluaXRQaGFzZVN0YXRlLCBMVmlldywgTFZpZXdGbGFncywgVFZJRVd9IGZyb20gJy4uL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge0FjdGl2ZUVsZW1lbnRGbGFncywgZXhlY3V0ZUVsZW1lbnRFeGl0Rm4sIGdldENoZWNrTm9DaGFuZ2VzTW9kZSwgZ2V0TFZpZXcsIGdldFNlbGVjdGVkSW5kZXgsIGhhc0FjdGl2ZUVsZW1lbnRGbGFnLCBzZXRTZWxlY3RlZEluZGV4fSBmcm9tICcuLi9zdGF0ZSc7XG5pbXBvcnQge3Jlc2V0U3R5bGluZ1N0YXRlfSBmcm9tICcuLi9zdHlsaW5nX25leHQvc3RhdGUnO1xuXG5cblxuLyoqXG4gKiBBZHZhbmNlcyB0byBhbiBlbGVtZW50IGZvciBsYXRlciBiaW5kaW5nIGluc3RydWN0aW9ucy5cbiAqXG4gKiBVc2VkIGluIGNvbmp1bmN0aW9uIHdpdGggaW5zdHJ1Y3Rpb25zIGxpa2Uge0BsaW5rIHByb3BlcnR5fSB0byBhY3Qgb24gZWxlbWVudHMgd2l0aCBzcGVjaWZpZWRcbiAqIGluZGljZXMsIGZvciBleGFtcGxlIHRob3NlIGNyZWF0ZWQgd2l0aCB7QGxpbmsgZWxlbWVudH0gb3Ige0BsaW5rIGVsZW1lbnRTdGFydH0uXG4gKlxuICogYGBgdHNcbiAqIChyZjogUmVuZGVyRmxhZ3MsIGN0eDogYW55KSA9PiB7XG4gICogICBpZiAocmYgJiAxKSB7XG4gICogICAgIHRleHQoMCwgJ0hlbGxvJyk7XG4gICogICAgIHRleHQoMSwgJ0dvb2RieWUnKVxuICAqICAgICBlbGVtZW50KDIsICdkaXYnKTtcbiAgKiAgIH1cbiAgKiAgIGlmIChyZiAmIDIpIHtcbiAgKiAgICAgYWR2YW5jZSgyKTsgLy8gQWR2YW5jZSB0d2ljZSB0byB0aGUgPGRpdj4uXG4gICogICAgIHByb3BlcnR5KCd0aXRsZScsICd0ZXN0Jyk7XG4gICogICB9XG4gICogIH1cbiAgKiBgYGBcbiAgKiBAcGFyYW0gZGVsdGEgTnVtYmVyIG9mIGVsZW1lbnRzIHRvIGFkdmFuY2UgZm9yd2FyZHMgYnkuXG4gICpcbiAgKiBAY29kZUdlbkFwaVxuICAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVhZHZhbmNlKGRlbHRhOiBudW1iZXIpOiB2b2lkIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEdyZWF0ZXJUaGFuKGRlbHRhLCAwLCAnQ2FuIG9ubHkgYWR2YW5jZSBmb3J3YXJkJyk7XG4gIHNlbGVjdEluZGV4SW50ZXJuYWwoZ2V0TFZpZXcoKSwgZ2V0U2VsZWN0ZWRJbmRleCgpICsgZGVsdGEsIGdldENoZWNrTm9DaGFuZ2VzTW9kZSgpKTtcbn1cblxuLyoqXG4gKiBTZWxlY3RzIGFuIGVsZW1lbnQgZm9yIGxhdGVyIGJpbmRpbmcgaW5zdHJ1Y3Rpb25zLlxuICogQGRlcHJlY2F0ZWQgTm8gbG9uZ2VyIGJlaW5nIGdlbmVyYXRlZCwgYnV0IHN0aWxsIHVzZWQgaW4gdW5pdCB0ZXN0cy5cbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1c2VsZWN0KGluZGV4OiBudW1iZXIpOiB2b2lkIHtcbiAgc2VsZWN0SW5kZXhJbnRlcm5hbChnZXRMVmlldygpLCBpbmRleCwgZ2V0Q2hlY2tOb0NoYW5nZXNNb2RlKCkpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2VsZWN0SW5kZXhJbnRlcm5hbChsVmlldzogTFZpZXcsIGluZGV4OiBudW1iZXIsIGNoZWNrTm9DaGFuZ2VzTW9kZTogYm9vbGVhbikge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0R3JlYXRlclRoYW4oaW5kZXgsIC0xLCAnSW52YWxpZCBpbmRleCcpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGF0YUluUmFuZ2UobFZpZXcsIGluZGV4ICsgSEVBREVSX09GRlNFVCk7XG5cbiAgaWYgKGhhc0FjdGl2ZUVsZW1lbnRGbGFnKEFjdGl2ZUVsZW1lbnRGbGFncy5SdW5FeGl0Rm4pKSB7XG4gICAgZXhlY3V0ZUVsZW1lbnRFeGl0Rm4oKTtcbiAgfVxuXG4gIC8vIEZsdXNoIHRoZSBpbml0aWFsIGhvb2tzIGZvciBlbGVtZW50cyBpbiB0aGUgdmlldyB0aGF0IGhhdmUgYmVlbiBhZGRlZCB1cCB0byB0aGlzIHBvaW50LlxuICAvLyBQRVJGIFdBUk5JTkc6IGRvIE5PVCBleHRyYWN0IHRoaXMgdG8gYSBzZXBhcmF0ZSBmdW5jdGlvbiB3aXRob3V0IHJ1bm5pbmcgYmVuY2htYXJrc1xuICBpZiAoIWNoZWNrTm9DaGFuZ2VzTW9kZSkge1xuICAgIGNvbnN0IGhvb2tzSW5pdFBoYXNlQ29tcGxldGVkID1cbiAgICAgICAgKGxWaWV3W0ZMQUdTXSAmIExWaWV3RmxhZ3MuSW5pdFBoYXNlU3RhdGVNYXNrKSA9PT0gSW5pdFBoYXNlU3RhdGUuSW5pdFBoYXNlQ29tcGxldGVkO1xuICAgIGlmIChob29rc0luaXRQaGFzZUNvbXBsZXRlZCkge1xuICAgICAgY29uc3QgcHJlT3JkZXJDaGVja0hvb2tzID0gbFZpZXdbVFZJRVddLnByZU9yZGVyQ2hlY2tIb29rcztcbiAgICAgIGlmIChwcmVPcmRlckNoZWNrSG9va3MgIT09IG51bGwpIHtcbiAgICAgICAgZXhlY3V0ZUNoZWNrSG9va3MobFZpZXcsIHByZU9yZGVyQ2hlY2tIb29rcywgaW5kZXgpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBwcmVPcmRlckhvb2tzID0gbFZpZXdbVFZJRVddLnByZU9yZGVySG9va3M7XG4gICAgICBpZiAocHJlT3JkZXJIb29rcyAhPT0gbnVsbCkge1xuICAgICAgICBleGVjdXRlSW5pdEFuZENoZWNrSG9va3MobFZpZXcsIHByZU9yZGVySG9va3MsIEluaXRQaGFzZVN0YXRlLk9uSW5pdEhvb2tzVG9CZVJ1biwgaW5kZXgpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGlmIChoYXNBY3RpdmVFbGVtZW50RmxhZyhBY3RpdmVFbGVtZW50RmxhZ3MuUmVzZXRTdHlsZXNPbkV4aXQpKSB7XG4gICAgcmVzZXRTdHlsaW5nU3RhdGUoKTtcbiAgfVxuXG4gIC8vIFdlIG11c3Qgc2V0IHRoZSBzZWxlY3RlZCBpbmRleCAqYWZ0ZXIqIHJ1bm5pbmcgdGhlIGhvb2tzLCBiZWNhdXNlIGhvb2tzIG1heSBoYXZlIHNpZGUtZWZmZWN0c1xuICAvLyB0aGF0IGNhdXNlIG90aGVyIHRlbXBsYXRlIGZ1bmN0aW9ucyB0byBydW4sIHRodXMgdXBkYXRpbmcgdGhlIHNlbGVjdGVkIGluZGV4LCB3aGljaCBpcyBnbG9iYWxcbiAgLy8gc3RhdGUuIElmIHdlIHJ1biBgc2V0U2VsZWN0ZWRJbmRleGAgKmJlZm9yZSogd2UgcnVuIHRoZSBob29rcywgaW4gc29tZSBjYXNlcyB0aGUgc2VsZWN0ZWQgaW5kZXhcbiAgLy8gd2lsbCBiZSBhbHRlcmVkIGJ5IHRoZSB0aW1lIHdlIGxlYXZlIHRoZSBgybXJtWFkdmFuY2VgIGluc3RydWN0aW9uLlxuICBzZXRTZWxlY3RlZEluZGV4KGluZGV4KTtcbn1cbiJdfQ==