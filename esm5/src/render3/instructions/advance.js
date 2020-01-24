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
    // TODO(misko): Remove this function as it is no longer being used.
    selectIndexInternal(getLView(), index, getCheckNoChangesMode());
}
export function selectIndexInternal(lView, index, checkNoChangesMode) {
    ngDevMode && assertGreaterThan(index, -1, 'Invalid index');
    ngDevMode && assertDataInRange(lView, index + HEADER_OFFSET);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWR2YW5jZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaW5zdHJ1Y3Rpb25zL2FkdmFuY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBQ0gsT0FBTyxFQUFDLGlCQUFpQixFQUFFLGlCQUFpQixFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDdkUsT0FBTyxFQUFDLGlCQUFpQixFQUFFLHdCQUF3QixFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQ3JFLE9BQU8sRUFBQyxLQUFLLEVBQUUsYUFBYSxFQUFxQyxLQUFLLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUNsRyxPQUFPLEVBQUMscUJBQXFCLEVBQUUsUUFBUSxFQUFFLGdCQUFnQixFQUFFLGdCQUFnQixFQUFDLE1BQU0sVUFBVSxDQUFDO0FBSTdGOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBc0JJO0FBQ0osTUFBTSxVQUFVLFNBQVMsQ0FBQyxLQUFhO0lBQ3JDLFNBQVMsSUFBSSxpQkFBaUIsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxFQUFFLDBCQUEwQixDQUFDLENBQUM7SUFDckUsbUJBQW1CLENBQUMsUUFBUSxFQUFFLEVBQUUsZ0JBQWdCLEVBQUUsR0FBRyxLQUFLLEVBQUUscUJBQXFCLEVBQUUsQ0FBQyxDQUFDO0FBQ3ZGLENBQUM7QUFFRDs7OztHQUlHO0FBQ0gsTUFBTSxVQUFVLFFBQVEsQ0FBQyxLQUFhO0lBQ3BDLG1FQUFtRTtJQUNuRSxtQkFBbUIsQ0FBQyxRQUFRLEVBQUUsRUFBRSxLQUFLLEVBQUUscUJBQXFCLEVBQUUsQ0FBQyxDQUFDO0FBQ2xFLENBQUM7QUFFRCxNQUFNLFVBQVUsbUJBQW1CLENBQUMsS0FBWSxFQUFFLEtBQWEsRUFBRSxrQkFBMkI7SUFDMUYsU0FBUyxJQUFJLGlCQUFpQixDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsRUFBRSxlQUFlLENBQUMsQ0FBQztJQUMzRCxTQUFTLElBQUksaUJBQWlCLENBQUMsS0FBSyxFQUFFLEtBQUssR0FBRyxhQUFhLENBQUMsQ0FBQztJQUU3RCwwRkFBMEY7SUFDMUYsc0ZBQXNGO0lBQ3RGLElBQUksQ0FBQyxrQkFBa0IsRUFBRTtRQUN2QixJQUFNLHVCQUF1QixHQUN6QixDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsNkJBQWdDLENBQUMsK0JBQXNDLENBQUM7UUFDekYsSUFBSSx1QkFBdUIsRUFBRTtZQUMzQixJQUFNLGtCQUFrQixHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxrQkFBa0IsQ0FBQztZQUMzRCxJQUFJLGtCQUFrQixLQUFLLElBQUksRUFBRTtnQkFDL0IsaUJBQWlCLENBQUMsS0FBSyxFQUFFLGtCQUFrQixFQUFFLEtBQUssQ0FBQyxDQUFDO2FBQ3JEO1NBQ0Y7YUFBTTtZQUNMLElBQU0sYUFBYSxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxhQUFhLENBQUM7WUFDakQsSUFBSSxhQUFhLEtBQUssSUFBSSxFQUFFO2dCQUMxQix3QkFBd0IsQ0FBQyxLQUFLLEVBQUUsYUFBYSw4QkFBcUMsS0FBSyxDQUFDLENBQUM7YUFDMUY7U0FDRjtLQUNGO0lBRUQsZ0dBQWdHO0lBQ2hHLGdHQUFnRztJQUNoRyxrR0FBa0c7SUFDbEcsb0VBQW9FO0lBQ3BFLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQzFCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5pbXBvcnQge2Fzc2VydERhdGFJblJhbmdlLCBhc3NlcnRHcmVhdGVyVGhhbn0gZnJvbSAnLi4vLi4vdXRpbC9hc3NlcnQnO1xuaW1wb3J0IHtleGVjdXRlQ2hlY2tIb29rcywgZXhlY3V0ZUluaXRBbmRDaGVja0hvb2tzfSBmcm9tICcuLi9ob29rcyc7XG5pbXBvcnQge0ZMQUdTLCBIRUFERVJfT0ZGU0VULCBJbml0UGhhc2VTdGF0ZSwgTFZpZXcsIExWaWV3RmxhZ3MsIFRWSUVXfSBmcm9tICcuLi9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHtnZXRDaGVja05vQ2hhbmdlc01vZGUsIGdldExWaWV3LCBnZXRTZWxlY3RlZEluZGV4LCBzZXRTZWxlY3RlZEluZGV4fSBmcm9tICcuLi9zdGF0ZSc7XG5cblxuXG4vKipcbiAqIEFkdmFuY2VzIHRvIGFuIGVsZW1lbnQgZm9yIGxhdGVyIGJpbmRpbmcgaW5zdHJ1Y3Rpb25zLlxuICpcbiAqIFVzZWQgaW4gY29uanVuY3Rpb24gd2l0aCBpbnN0cnVjdGlvbnMgbGlrZSB7QGxpbmsgcHJvcGVydHl9IHRvIGFjdCBvbiBlbGVtZW50cyB3aXRoIHNwZWNpZmllZFxuICogaW5kaWNlcywgZm9yIGV4YW1wbGUgdGhvc2UgY3JlYXRlZCB3aXRoIHtAbGluayBlbGVtZW50fSBvciB7QGxpbmsgZWxlbWVudFN0YXJ0fS5cbiAqXG4gKiBgYGB0c1xuICogKHJmOiBSZW5kZXJGbGFncywgY3R4OiBhbnkpID0+IHtcbiAgKiAgIGlmIChyZiAmIDEpIHtcbiAgKiAgICAgdGV4dCgwLCAnSGVsbG8nKTtcbiAgKiAgICAgdGV4dCgxLCAnR29vZGJ5ZScpXG4gICogICAgIGVsZW1lbnQoMiwgJ2RpdicpO1xuICAqICAgfVxuICAqICAgaWYgKHJmICYgMikge1xuICAqICAgICBhZHZhbmNlKDIpOyAvLyBBZHZhbmNlIHR3aWNlIHRvIHRoZSA8ZGl2Pi5cbiAgKiAgICAgcHJvcGVydHkoJ3RpdGxlJywgJ3Rlc3QnKTtcbiAgKiAgIH1cbiAgKiAgfVxuICAqIGBgYFxuICAqIEBwYXJhbSBkZWx0YSBOdW1iZXIgb2YgZWxlbWVudHMgdG8gYWR2YW5jZSBmb3J3YXJkcyBieS5cbiAgKlxuICAqIEBjb2RlR2VuQXBpXG4gICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWFkdmFuY2UoZGVsdGE6IG51bWJlcik6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0R3JlYXRlclRoYW4oZGVsdGEsIDAsICdDYW4gb25seSBhZHZhbmNlIGZvcndhcmQnKTtcbiAgc2VsZWN0SW5kZXhJbnRlcm5hbChnZXRMVmlldygpLCBnZXRTZWxlY3RlZEluZGV4KCkgKyBkZWx0YSwgZ2V0Q2hlY2tOb0NoYW5nZXNNb2RlKCkpO1xufVxuXG4vKipcbiAqIFNlbGVjdHMgYW4gZWxlbWVudCBmb3IgbGF0ZXIgYmluZGluZyBpbnN0cnVjdGlvbnMuXG4gKiBAZGVwcmVjYXRlZCBObyBsb25nZXIgYmVpbmcgZ2VuZXJhdGVkLCBidXQgc3RpbGwgdXNlZCBpbiB1bml0IHRlc3RzLlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVzZWxlY3QoaW5kZXg6IG51bWJlcik6IHZvaWQge1xuICAvLyBUT0RPKG1pc2tvKTogUmVtb3ZlIHRoaXMgZnVuY3Rpb24gYXMgaXQgaXMgbm8gbG9uZ2VyIGJlaW5nIHVzZWQuXG4gIHNlbGVjdEluZGV4SW50ZXJuYWwoZ2V0TFZpZXcoKSwgaW5kZXgsIGdldENoZWNrTm9DaGFuZ2VzTW9kZSgpKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNlbGVjdEluZGV4SW50ZXJuYWwobFZpZXc6IExWaWV3LCBpbmRleDogbnVtYmVyLCBjaGVja05vQ2hhbmdlc01vZGU6IGJvb2xlYW4pIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEdyZWF0ZXJUaGFuKGluZGV4LCAtMSwgJ0ludmFsaWQgaW5kZXgnKTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERhdGFJblJhbmdlKGxWaWV3LCBpbmRleCArIEhFQURFUl9PRkZTRVQpO1xuXG4gIC8vIEZsdXNoIHRoZSBpbml0aWFsIGhvb2tzIGZvciBlbGVtZW50cyBpbiB0aGUgdmlldyB0aGF0IGhhdmUgYmVlbiBhZGRlZCB1cCB0byB0aGlzIHBvaW50LlxuICAvLyBQRVJGIFdBUk5JTkc6IGRvIE5PVCBleHRyYWN0IHRoaXMgdG8gYSBzZXBhcmF0ZSBmdW5jdGlvbiB3aXRob3V0IHJ1bm5pbmcgYmVuY2htYXJrc1xuICBpZiAoIWNoZWNrTm9DaGFuZ2VzTW9kZSkge1xuICAgIGNvbnN0IGhvb2tzSW5pdFBoYXNlQ29tcGxldGVkID1cbiAgICAgICAgKGxWaWV3W0ZMQUdTXSAmIExWaWV3RmxhZ3MuSW5pdFBoYXNlU3RhdGVNYXNrKSA9PT0gSW5pdFBoYXNlU3RhdGUuSW5pdFBoYXNlQ29tcGxldGVkO1xuICAgIGlmIChob29rc0luaXRQaGFzZUNvbXBsZXRlZCkge1xuICAgICAgY29uc3QgcHJlT3JkZXJDaGVja0hvb2tzID0gbFZpZXdbVFZJRVddLnByZU9yZGVyQ2hlY2tIb29rcztcbiAgICAgIGlmIChwcmVPcmRlckNoZWNrSG9va3MgIT09IG51bGwpIHtcbiAgICAgICAgZXhlY3V0ZUNoZWNrSG9va3MobFZpZXcsIHByZU9yZGVyQ2hlY2tIb29rcywgaW5kZXgpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBwcmVPcmRlckhvb2tzID0gbFZpZXdbVFZJRVddLnByZU9yZGVySG9va3M7XG4gICAgICBpZiAocHJlT3JkZXJIb29rcyAhPT0gbnVsbCkge1xuICAgICAgICBleGVjdXRlSW5pdEFuZENoZWNrSG9va3MobFZpZXcsIHByZU9yZGVySG9va3MsIEluaXRQaGFzZVN0YXRlLk9uSW5pdEhvb2tzVG9CZVJ1biwgaW5kZXgpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8vIFdlIG11c3Qgc2V0IHRoZSBzZWxlY3RlZCBpbmRleCAqYWZ0ZXIqIHJ1bm5pbmcgdGhlIGhvb2tzLCBiZWNhdXNlIGhvb2tzIG1heSBoYXZlIHNpZGUtZWZmZWN0c1xuICAvLyB0aGF0IGNhdXNlIG90aGVyIHRlbXBsYXRlIGZ1bmN0aW9ucyB0byBydW4sIHRodXMgdXBkYXRpbmcgdGhlIHNlbGVjdGVkIGluZGV4LCB3aGljaCBpcyBnbG9iYWxcbiAgLy8gc3RhdGUuIElmIHdlIHJ1biBgc2V0U2VsZWN0ZWRJbmRleGAgKmJlZm9yZSogd2UgcnVuIHRoZSBob29rcywgaW4gc29tZSBjYXNlcyB0aGUgc2VsZWN0ZWQgaW5kZXhcbiAgLy8gd2lsbCBiZSBhbHRlcmVkIGJ5IHRoZSB0aW1lIHdlIGxlYXZlIHRoZSBgybXJtWFkdmFuY2VgIGluc3RydWN0aW9uLlxuICBzZXRTZWxlY3RlZEluZGV4KGluZGV4KTtcbn1cbiJdfQ==