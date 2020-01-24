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
import { executeElementExitFn, getCheckNoChangesMode, getLView, getSelectedIndex, hasActiveElementFlag, setSelectedIndex } from '../state';
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
    if (hasActiveElementFlag(1 /* RunExitFn */)) {
        executeElementExitFn();
    }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWR2YW5jZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaW5zdHJ1Y3Rpb25zL2FkdmFuY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBT0EsT0FBTyxFQUFDLGlCQUFpQixFQUFFLGlCQUFpQixFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDdkUsT0FBTyxFQUFDLGlCQUFpQixFQUFFLHdCQUF3QixFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQ3JFLE9BQU8sRUFBQyxLQUFLLEVBQUUsYUFBYSxFQUFxQyxLQUFLLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUNsRyxPQUFPLEVBQXFCLG9CQUFvQixFQUFFLHFCQUFxQixFQUFFLFFBQVEsRUFBRSxnQkFBZ0IsRUFBRSxvQkFBb0IsRUFBRSxnQkFBZ0IsRUFBQyxNQUFNLFVBQVUsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQTJCN0osTUFBTSxVQUFVLFNBQVMsQ0FBQyxLQUFhO0lBQ3JDLFNBQVMsSUFBSSxpQkFBaUIsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxFQUFFLDBCQUEwQixDQUFDLENBQUM7SUFDckUsbUJBQW1CLENBQUMsUUFBUSxFQUFFLEVBQUUsZ0JBQWdCLEVBQUUsR0FBRyxLQUFLLEVBQUUscUJBQXFCLEVBQUUsQ0FBQyxDQUFDO0FBQ3ZGLENBQUM7Ozs7Ozs7O0FBT0QsTUFBTSxVQUFVLFFBQVEsQ0FBQyxLQUFhO0lBQ3BDLG1CQUFtQixDQUFDLFFBQVEsRUFBRSxFQUFFLEtBQUssRUFBRSxxQkFBcUIsRUFBRSxDQUFDLENBQUM7QUFDbEUsQ0FBQzs7Ozs7OztBQUVELE1BQU0sVUFBVSxtQkFBbUIsQ0FBQyxLQUFZLEVBQUUsS0FBYSxFQUFFLGtCQUEyQjtJQUMxRixTQUFTLElBQUksaUJBQWlCLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxFQUFFLGVBQWUsQ0FBQyxDQUFDO0lBQzNELFNBQVMsSUFBSSxpQkFBaUIsQ0FBQyxLQUFLLEVBQUUsS0FBSyxHQUFHLGFBQWEsQ0FBQyxDQUFDO0lBRTdELElBQUksb0JBQW9CLG1CQUE4QixFQUFFO1FBQ3RELG9CQUFvQixFQUFFLENBQUM7S0FDeEI7SUFFRCwwRkFBMEY7SUFDMUYsc0ZBQXNGO0lBQ3RGLElBQUksQ0FBQyxrQkFBa0IsRUFBRTs7Y0FDakIsdUJBQXVCLEdBQ3pCLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyw2QkFBZ0MsQ0FBQywrQkFBc0M7UUFDeEYsSUFBSSx1QkFBdUIsRUFBRTs7a0JBQ3JCLGtCQUFrQixHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxrQkFBa0I7WUFDMUQsSUFBSSxrQkFBa0IsS0FBSyxJQUFJLEVBQUU7Z0JBQy9CLGlCQUFpQixDQUFDLEtBQUssRUFBRSxrQkFBa0IsRUFBRSxLQUFLLENBQUMsQ0FBQzthQUNyRDtTQUNGO2FBQU07O2tCQUNDLGFBQWEsR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsYUFBYTtZQUNoRCxJQUFJLGFBQWEsS0FBSyxJQUFJLEVBQUU7Z0JBQzFCLHdCQUF3QixDQUFDLEtBQUssRUFBRSxhQUFhLDhCQUFxQyxLQUFLLENBQUMsQ0FBQzthQUMxRjtTQUNGO0tBQ0Y7SUFFRCxnR0FBZ0c7SUFDaEcsZ0dBQWdHO0lBQ2hHLGtHQUFrRztJQUNsRyxvRUFBb0U7SUFDcEUsZ0JBQWdCLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDMUIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCB7YXNzZXJ0RGF0YUluUmFuZ2UsIGFzc2VydEdyZWF0ZXJUaGFufSBmcm9tICcuLi8uLi91dGlsL2Fzc2VydCc7XG5pbXBvcnQge2V4ZWN1dGVDaGVja0hvb2tzLCBleGVjdXRlSW5pdEFuZENoZWNrSG9va3N9IGZyb20gJy4uL2hvb2tzJztcbmltcG9ydCB7RkxBR1MsIEhFQURFUl9PRkZTRVQsIEluaXRQaGFzZVN0YXRlLCBMVmlldywgTFZpZXdGbGFncywgVFZJRVd9IGZyb20gJy4uL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge0FjdGl2ZUVsZW1lbnRGbGFncywgZXhlY3V0ZUVsZW1lbnRFeGl0Rm4sIGdldENoZWNrTm9DaGFuZ2VzTW9kZSwgZ2V0TFZpZXcsIGdldFNlbGVjdGVkSW5kZXgsIGhhc0FjdGl2ZUVsZW1lbnRGbGFnLCBzZXRTZWxlY3RlZEluZGV4fSBmcm9tICcuLi9zdGF0ZSc7XG5cblxuXG4vKipcbiAqIEFkdmFuY2VzIHRvIGFuIGVsZW1lbnQgZm9yIGxhdGVyIGJpbmRpbmcgaW5zdHJ1Y3Rpb25zLlxuICpcbiAqIFVzZWQgaW4gY29uanVuY3Rpb24gd2l0aCBpbnN0cnVjdGlvbnMgbGlrZSB7QGxpbmsgcHJvcGVydHl9IHRvIGFjdCBvbiBlbGVtZW50cyB3aXRoIHNwZWNpZmllZFxuICogaW5kaWNlcywgZm9yIGV4YW1wbGUgdGhvc2UgY3JlYXRlZCB3aXRoIHtAbGluayBlbGVtZW50fSBvciB7QGxpbmsgZWxlbWVudFN0YXJ0fS5cbiAqXG4gKiBgYGB0c1xuICogKHJmOiBSZW5kZXJGbGFncywgY3R4OiBhbnkpID0+IHtcbiAgKiAgIGlmIChyZiAmIDEpIHtcbiAgKiAgICAgdGV4dCgwLCAnSGVsbG8nKTtcbiAgKiAgICAgdGV4dCgxLCAnR29vZGJ5ZScpXG4gICogICAgIGVsZW1lbnQoMiwgJ2RpdicpO1xuICAqICAgfVxuICAqICAgaWYgKHJmICYgMikge1xuICAqICAgICBhZHZhbmNlKDIpOyAvLyBBZHZhbmNlIHR3aWNlIHRvIHRoZSA8ZGl2Pi5cbiAgKiAgICAgcHJvcGVydHkoJ3RpdGxlJywgJ3Rlc3QnKTtcbiAgKiAgIH1cbiAgKiAgfVxuICAqIGBgYFxuICAqIEBwYXJhbSBkZWx0YSBOdW1iZXIgb2YgZWxlbWVudHMgdG8gYWR2YW5jZSBmb3J3YXJkcyBieS5cbiAgKlxuICAqIEBjb2RlR2VuQXBpXG4gICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWFkdmFuY2UoZGVsdGE6IG51bWJlcik6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0R3JlYXRlclRoYW4oZGVsdGEsIDAsICdDYW4gb25seSBhZHZhbmNlIGZvcndhcmQnKTtcbiAgc2VsZWN0SW5kZXhJbnRlcm5hbChnZXRMVmlldygpLCBnZXRTZWxlY3RlZEluZGV4KCkgKyBkZWx0YSwgZ2V0Q2hlY2tOb0NoYW5nZXNNb2RlKCkpO1xufVxuXG4vKipcbiAqIFNlbGVjdHMgYW4gZWxlbWVudCBmb3IgbGF0ZXIgYmluZGluZyBpbnN0cnVjdGlvbnMuXG4gKiBAZGVwcmVjYXRlZCBObyBsb25nZXIgYmVpbmcgZ2VuZXJhdGVkLCBidXQgc3RpbGwgdXNlZCBpbiB1bml0IHRlc3RzLlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVzZWxlY3QoaW5kZXg6IG51bWJlcik6IHZvaWQge1xuICBzZWxlY3RJbmRleEludGVybmFsKGdldExWaWV3KCksIGluZGV4LCBnZXRDaGVja05vQ2hhbmdlc01vZGUoKSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZWxlY3RJbmRleEludGVybmFsKGxWaWV3OiBMVmlldywgaW5kZXg6IG51bWJlciwgY2hlY2tOb0NoYW5nZXNNb2RlOiBib29sZWFuKSB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRHcmVhdGVyVGhhbihpbmRleCwgLTEsICdJbnZhbGlkIGluZGV4Jyk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREYXRhSW5SYW5nZShsVmlldywgaW5kZXggKyBIRUFERVJfT0ZGU0VUKTtcblxuICBpZiAoaGFzQWN0aXZlRWxlbWVudEZsYWcoQWN0aXZlRWxlbWVudEZsYWdzLlJ1bkV4aXRGbikpIHtcbiAgICBleGVjdXRlRWxlbWVudEV4aXRGbigpO1xuICB9XG5cbiAgLy8gRmx1c2ggdGhlIGluaXRpYWwgaG9va3MgZm9yIGVsZW1lbnRzIGluIHRoZSB2aWV3IHRoYXQgaGF2ZSBiZWVuIGFkZGVkIHVwIHRvIHRoaXMgcG9pbnQuXG4gIC8vIFBFUkYgV0FSTklORzogZG8gTk9UIGV4dHJhY3QgdGhpcyB0byBhIHNlcGFyYXRlIGZ1bmN0aW9uIHdpdGhvdXQgcnVubmluZyBiZW5jaG1hcmtzXG4gIGlmICghY2hlY2tOb0NoYW5nZXNNb2RlKSB7XG4gICAgY29uc3QgaG9va3NJbml0UGhhc2VDb21wbGV0ZWQgPVxuICAgICAgICAobFZpZXdbRkxBR1NdICYgTFZpZXdGbGFncy5Jbml0UGhhc2VTdGF0ZU1hc2spID09PSBJbml0UGhhc2VTdGF0ZS5Jbml0UGhhc2VDb21wbGV0ZWQ7XG4gICAgaWYgKGhvb2tzSW5pdFBoYXNlQ29tcGxldGVkKSB7XG4gICAgICBjb25zdCBwcmVPcmRlckNoZWNrSG9va3MgPSBsVmlld1tUVklFV10ucHJlT3JkZXJDaGVja0hvb2tzO1xuICAgICAgaWYgKHByZU9yZGVyQ2hlY2tIb29rcyAhPT0gbnVsbCkge1xuICAgICAgICBleGVjdXRlQ2hlY2tIb29rcyhsVmlldywgcHJlT3JkZXJDaGVja0hvb2tzLCBpbmRleCk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IHByZU9yZGVySG9va3MgPSBsVmlld1tUVklFV10ucHJlT3JkZXJIb29rcztcbiAgICAgIGlmIChwcmVPcmRlckhvb2tzICE9PSBudWxsKSB7XG4gICAgICAgIGV4ZWN1dGVJbml0QW5kQ2hlY2tIb29rcyhsVmlldywgcHJlT3JkZXJIb29rcywgSW5pdFBoYXNlU3RhdGUuT25Jbml0SG9va3NUb0JlUnVuLCBpbmRleCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8gV2UgbXVzdCBzZXQgdGhlIHNlbGVjdGVkIGluZGV4ICphZnRlciogcnVubmluZyB0aGUgaG9va3MsIGJlY2F1c2UgaG9va3MgbWF5IGhhdmUgc2lkZS1lZmZlY3RzXG4gIC8vIHRoYXQgY2F1c2Ugb3RoZXIgdGVtcGxhdGUgZnVuY3Rpb25zIHRvIHJ1biwgdGh1cyB1cGRhdGluZyB0aGUgc2VsZWN0ZWQgaW5kZXgsIHdoaWNoIGlzIGdsb2JhbFxuICAvLyBzdGF0ZS4gSWYgd2UgcnVuIGBzZXRTZWxlY3RlZEluZGV4YCAqYmVmb3JlKiB3ZSBydW4gdGhlIGhvb2tzLCBpbiBzb21lIGNhc2VzIHRoZSBzZWxlY3RlZCBpbmRleFxuICAvLyB3aWxsIGJlIGFsdGVyZWQgYnkgdGhlIHRpbWUgd2UgbGVhdmUgdGhlIGDJtcm1YWR2YW5jZWAgaW5zdHJ1Y3Rpb24uXG4gIHNldFNlbGVjdGVkSW5kZXgoaW5kZXgpO1xufVxuIl19