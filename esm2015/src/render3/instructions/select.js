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
 * Selects an element for later binding instructions.
 *
 * Used in conjunction with instructions like {\@link property} to act on elements with specified
 * indices, for example those created with {\@link element} or {\@link elementStart}.
 *
 * ```ts
 * (rf: RenderFlags, ctx: any) => {
 *   if (rf & 1) {
 *     element(0, 'div');
 *   }
 *   if (rf & 2) {
 *     select(0); // Select the <div/> created above.
 *     property('title', 'test');
 *   }
 *  }
 * ```
 * \@codeGenApi
 * @param {?} index the index of the item to act on with the following instructions
 *
 * @return {?}
 */
export function Δselect(index) {
    ngDevMode && assertGreaterThan(index, -1, 'Invalid index');
    ngDevMode &&
        assertLessThan(index, getLView().length - HEADER_OFFSET, 'Should be within range for the view data');
    /** @type {?} */
    const lView = getLView();
    // Flush the initial hooks for elements in the view that have been added up to this point.
    executePreOrderHooks(lView, lView[TVIEW], getCheckNoChangesMode(), index);
    // We must set the selected index *after* running the hooks, because hooks may have side-effects
    // that cause other template functions to run, thus updating the selected index, which is global
    // state. If we run `setSelectedIndex` *before* we run the hooks, in some cases the selected index
    // will be altered by the time we leave the `Δselect` instruction.
    setSelectedIndex(index);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VsZWN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9pbnN0cnVjdGlvbnMvc2VsZWN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBT0EsT0FBTyxFQUFDLGlCQUFpQixFQUFFLGNBQWMsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQ3BFLE9BQU8sRUFBQyxvQkFBb0IsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUM5QyxPQUFPLEVBQUMsYUFBYSxFQUFFLEtBQUssRUFBQyxNQUFNLG9CQUFvQixDQUFDO0FBQ3hELE9BQU8sRUFBQyxxQkFBcUIsRUFBRSxRQUFRLEVBQUUsZ0JBQWdCLEVBQUMsTUFBTSxVQUFVLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBdUIzRSxNQUFNLFVBQVUsT0FBTyxDQUFDLEtBQWE7SUFDbkMsU0FBUyxJQUFJLGlCQUFpQixDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsRUFBRSxlQUFlLENBQUMsQ0FBQztJQUMzRCxTQUFTO1FBQ0wsY0FBYyxDQUNWLEtBQUssRUFBRSxRQUFRLEVBQUUsQ0FBQyxNQUFNLEdBQUcsYUFBYSxFQUFFLDBDQUEwQyxDQUFDLENBQUM7O1VBQ3hGLEtBQUssR0FBRyxRQUFRLEVBQUU7SUFFeEIsMEZBQTBGO0lBQzFGLG9CQUFvQixDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsS0FBSyxDQUFDLEVBQUUscUJBQXFCLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztJQUUxRSxnR0FBZ0c7SUFDaEcsZ0dBQWdHO0lBQ2hHLGtHQUFrRztJQUNsRyxrRUFBa0U7SUFDbEUsZ0JBQWdCLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDMUIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCB7YXNzZXJ0R3JlYXRlclRoYW4sIGFzc2VydExlc3NUaGFufSBmcm9tICcuLi8uLi91dGlsL2Fzc2VydCc7XG5pbXBvcnQge2V4ZWN1dGVQcmVPcmRlckhvb2tzfSBmcm9tICcuLi9ob29rcyc7XG5pbXBvcnQge0hFQURFUl9PRkZTRVQsIFRWSUVXfSBmcm9tICcuLi9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHtnZXRDaGVja05vQ2hhbmdlc01vZGUsIGdldExWaWV3LCBzZXRTZWxlY3RlZEluZGV4fSBmcm9tICcuLi9zdGF0ZSc7XG5cbi8qKlxuICogU2VsZWN0cyBhbiBlbGVtZW50IGZvciBsYXRlciBiaW5kaW5nIGluc3RydWN0aW9ucy5cbiAqXG4gKiBVc2VkIGluIGNvbmp1bmN0aW9uIHdpdGggaW5zdHJ1Y3Rpb25zIGxpa2Uge0BsaW5rIHByb3BlcnR5fSB0byBhY3Qgb24gZWxlbWVudHMgd2l0aCBzcGVjaWZpZWRcbiAqIGluZGljZXMsIGZvciBleGFtcGxlIHRob3NlIGNyZWF0ZWQgd2l0aCB7QGxpbmsgZWxlbWVudH0gb3Ige0BsaW5rIGVsZW1lbnRTdGFydH0uXG4gKlxuICogYGBgdHNcbiAqIChyZjogUmVuZGVyRmxhZ3MsIGN0eDogYW55KSA9PiB7XG4gKiAgIGlmIChyZiAmIDEpIHtcbiAqICAgICBlbGVtZW50KDAsICdkaXYnKTtcbiAqICAgfVxuICogICBpZiAocmYgJiAyKSB7XG4gKiAgICAgc2VsZWN0KDApOyAvLyBTZWxlY3QgdGhlIDxkaXYvPiBjcmVhdGVkIGFib3ZlLlxuICogICAgIHByb3BlcnR5KCd0aXRsZScsICd0ZXN0Jyk7XG4gKiAgIH1cbiAqICB9XG4gKiBgYGBcbiAqIEBwYXJhbSBpbmRleCB0aGUgaW5kZXggb2YgdGhlIGl0ZW0gdG8gYWN0IG9uIHdpdGggdGhlIGZvbGxvd2luZyBpbnN0cnVjdGlvbnNcbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gzpRzZWxlY3QoaW5kZXg6IG51bWJlcik6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0R3JlYXRlclRoYW4oaW5kZXgsIC0xLCAnSW52YWxpZCBpbmRleCcpO1xuICBuZ0Rldk1vZGUgJiZcbiAgICAgIGFzc2VydExlc3NUaGFuKFxuICAgICAgICAgIGluZGV4LCBnZXRMVmlldygpLmxlbmd0aCAtIEhFQURFUl9PRkZTRVQsICdTaG91bGQgYmUgd2l0aGluIHJhbmdlIGZvciB0aGUgdmlldyBkYXRhJyk7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcblxuICAvLyBGbHVzaCB0aGUgaW5pdGlhbCBob29rcyBmb3IgZWxlbWVudHMgaW4gdGhlIHZpZXcgdGhhdCBoYXZlIGJlZW4gYWRkZWQgdXAgdG8gdGhpcyBwb2ludC5cbiAgZXhlY3V0ZVByZU9yZGVySG9va3MobFZpZXcsIGxWaWV3W1RWSUVXXSwgZ2V0Q2hlY2tOb0NoYW5nZXNNb2RlKCksIGluZGV4KTtcblxuICAvLyBXZSBtdXN0IHNldCB0aGUgc2VsZWN0ZWQgaW5kZXggKmFmdGVyKiBydW5uaW5nIHRoZSBob29rcywgYmVjYXVzZSBob29rcyBtYXkgaGF2ZSBzaWRlLWVmZmVjdHNcbiAgLy8gdGhhdCBjYXVzZSBvdGhlciB0ZW1wbGF0ZSBmdW5jdGlvbnMgdG8gcnVuLCB0aHVzIHVwZGF0aW5nIHRoZSBzZWxlY3RlZCBpbmRleCwgd2hpY2ggaXMgZ2xvYmFsXG4gIC8vIHN0YXRlLiBJZiB3ZSBydW4gYHNldFNlbGVjdGVkSW5kZXhgICpiZWZvcmUqIHdlIHJ1biB0aGUgaG9va3MsIGluIHNvbWUgY2FzZXMgdGhlIHNlbGVjdGVkIGluZGV4XG4gIC8vIHdpbGwgYmUgYWx0ZXJlZCBieSB0aGUgdGltZSB3ZSBsZWF2ZSB0aGUgYM6Uc2VsZWN0YCBpbnN0cnVjdGlvbi5cbiAgc2V0U2VsZWN0ZWRJbmRleChpbmRleCk7XG59XG4iXX0=