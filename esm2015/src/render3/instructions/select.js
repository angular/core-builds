/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { assertGreaterThan, assertLessThan } from '../../util/assert';
import { executePreOrderHooks } from '../hooks';
import { HEADER_OFFSET, TVIEW } from '../interfaces/view';
import { getCheckNoChangesMode, getLView, setSelectedIndex } from '../state';
/**
 * Selects an index of an item to act on and flushes lifecycle hooks up to this point
 *
 * Used in conjunction with instructions like {\@link property} to act on elements with specified
 * indices, for example those created with {\@link element} or {\@link elementStart}.
 *
 * ```ts
 * (rf: RenderFlags, ctx: any) => {
 *  if (rf & 1) {
 *    element(0, 'div');
 *  }
 *  if (rf & 2) {
 *    select(0); // Select the <div/> created above.
 *    property('title', 'test');
 *  }
 * }
 * ```
 * @param {?} index the index of the item to act on with the following instructions
 * @return {?}
 */
export function select(index) {
    ngDevMode && assertGreaterThan(index, -1, 'Invalid index');
    ngDevMode &&
        assertLessThan(index, getLView().length - HEADER_OFFSET, 'Should be within range for the view data');
    setSelectedIndex(index);
    /** @type {?} */
    const lView = getLView();
    executePreOrderHooks(lView, lView[TVIEW], getCheckNoChangesMode(), index);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VsZWN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9pbnN0cnVjdGlvbnMvc2VsZWN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBT0EsT0FBTyxFQUFDLGlCQUFpQixFQUFFLGNBQWMsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQ3BFLE9BQU8sRUFBQyxvQkFBb0IsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUM5QyxPQUFPLEVBQUMsYUFBYSxFQUFFLEtBQUssRUFBQyxNQUFNLG9CQUFvQixDQUFDO0FBQ3hELE9BQU8sRUFBQyxxQkFBcUIsRUFBRSxRQUFRLEVBQUUsZ0JBQWdCLEVBQUMsTUFBTSxVQUFVLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQXFCM0UsTUFBTSxVQUFVLE1BQU0sQ0FBQyxLQUFhO0lBQ2xDLFNBQVMsSUFBSSxpQkFBaUIsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLEVBQUUsZUFBZSxDQUFDLENBQUM7SUFDM0QsU0FBUztRQUNMLGNBQWMsQ0FDVixLQUFLLEVBQUUsUUFBUSxFQUFFLENBQUMsTUFBTSxHQUFHLGFBQWEsRUFBRSwwQ0FBMEMsQ0FBQyxDQUFDO0lBQzlGLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxDQUFDOztVQUNsQixLQUFLLEdBQUcsUUFBUSxFQUFFO0lBQ3hCLG9CQUFvQixDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsS0FBSyxDQUFDLEVBQUUscUJBQXFCLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztBQUM1RSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0IHthc3NlcnRHcmVhdGVyVGhhbiwgYXNzZXJ0TGVzc1RoYW59IGZyb20gJy4uLy4uL3V0aWwvYXNzZXJ0JztcbmltcG9ydCB7ZXhlY3V0ZVByZU9yZGVySG9va3N9IGZyb20gJy4uL2hvb2tzJztcbmltcG9ydCB7SEVBREVSX09GRlNFVCwgVFZJRVd9IGZyb20gJy4uL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2dldENoZWNrTm9DaGFuZ2VzTW9kZSwgZ2V0TFZpZXcsIHNldFNlbGVjdGVkSW5kZXh9IGZyb20gJy4uL3N0YXRlJztcblxuLyoqXG4gKiBTZWxlY3RzIGFuIGluZGV4IG9mIGFuIGl0ZW0gdG8gYWN0IG9uIGFuZCBmbHVzaGVzIGxpZmVjeWNsZSBob29rcyB1cCB0byB0aGlzIHBvaW50XG4gKlxuICogVXNlZCBpbiBjb25qdW5jdGlvbiB3aXRoIGluc3RydWN0aW9ucyBsaWtlIHtAbGluayBwcm9wZXJ0eX0gdG8gYWN0IG9uIGVsZW1lbnRzIHdpdGggc3BlY2lmaWVkXG4gKiBpbmRpY2VzLCBmb3IgZXhhbXBsZSB0aG9zZSBjcmVhdGVkIHdpdGgge0BsaW5rIGVsZW1lbnR9IG9yIHtAbGluayBlbGVtZW50U3RhcnR9LlxuICpcbiAqIGBgYHRzXG4gKiAocmY6IFJlbmRlckZsYWdzLCBjdHg6IGFueSkgPT4ge1xuICAqICBpZiAocmYgJiAxKSB7XG4gICogICAgZWxlbWVudCgwLCAnZGl2Jyk7XG4gICogIH1cbiAgKiAgaWYgKHJmICYgMikge1xuICAqICAgIHNlbGVjdCgwKTsgLy8gU2VsZWN0IHRoZSA8ZGl2Lz4gY3JlYXRlZCBhYm92ZS5cbiAgKiAgICBwcm9wZXJ0eSgndGl0bGUnLCAndGVzdCcpO1xuICAqICB9XG4gICogfVxuICAqIGBgYFxuICAqIEBwYXJhbSBpbmRleCB0aGUgaW5kZXggb2YgdGhlIGl0ZW0gdG8gYWN0IG9uIHdpdGggdGhlIGZvbGxvd2luZyBpbnN0cnVjdGlvbnNcbiAgKi9cbmV4cG9ydCBmdW5jdGlvbiBzZWxlY3QoaW5kZXg6IG51bWJlcik6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0R3JlYXRlclRoYW4oaW5kZXgsIC0xLCAnSW52YWxpZCBpbmRleCcpO1xuICBuZ0Rldk1vZGUgJiZcbiAgICAgIGFzc2VydExlc3NUaGFuKFxuICAgICAgICAgIGluZGV4LCBnZXRMVmlldygpLmxlbmd0aCAtIEhFQURFUl9PRkZTRVQsICdTaG91bGQgYmUgd2l0aGluIHJhbmdlIGZvciB0aGUgdmlldyBkYXRhJyk7XG4gIHNldFNlbGVjdGVkSW5kZXgoaW5kZXgpO1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGV4ZWN1dGVQcmVPcmRlckhvb2tzKGxWaWV3LCBsVmlld1tUVklFV10sIGdldENoZWNrTm9DaGFuZ2VzTW9kZSgpLCBpbmRleCk7XG59XG4iXX0=