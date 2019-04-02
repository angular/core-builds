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
 * Used in conjunction with instructions like {@link property} to act on elements with specified
 * indices, for example those created with {@link element} or {@link elementStart}.
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
  * @param index the index of the item to act on with the following instructions
  */
export function select(index) {
    ngDevMode && assertGreaterThan(index, -1, 'Invalid index');
    ngDevMode &&
        assertLessThan(index, getLView().length - HEADER_OFFSET, 'Should be within range for the view data');
    setSelectedIndex(index);
    var lView = getLView();
    executePreOrderHooks(lView, lView[TVIEW], getCheckNoChangesMode(), index);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VsZWN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9pbnN0cnVjdGlvbnMvc2VsZWN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUNILE9BQU8sRUFBQyxpQkFBaUIsRUFBRSxjQUFjLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUNwRSxPQUFPLEVBQUMsb0JBQW9CLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDOUMsT0FBTyxFQUFDLGFBQWEsRUFBRSxLQUFLLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUN4RCxPQUFPLEVBQUMscUJBQXFCLEVBQUUsUUFBUSxFQUFFLGdCQUFnQixFQUFDLE1BQU0sVUFBVSxDQUFDO0FBRTNFOzs7Ozs7Ozs7Ozs7Ozs7Ozs7SUFrQkk7QUFDSixNQUFNLFVBQVUsTUFBTSxDQUFDLEtBQWE7SUFDbEMsU0FBUyxJQUFJLGlCQUFpQixDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsRUFBRSxlQUFlLENBQUMsQ0FBQztJQUMzRCxTQUFTO1FBQ0wsY0FBYyxDQUNWLEtBQUssRUFBRSxRQUFRLEVBQUUsQ0FBQyxNQUFNLEdBQUcsYUFBYSxFQUFFLDBDQUEwQyxDQUFDLENBQUM7SUFDOUYsZ0JBQWdCLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDeEIsSUFBTSxLQUFLLEdBQUcsUUFBUSxFQUFFLENBQUM7SUFDekIsb0JBQW9CLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxLQUFLLENBQUMsRUFBRSxxQkFBcUIsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO0FBQzVFLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5pbXBvcnQge2Fzc2VydEdyZWF0ZXJUaGFuLCBhc3NlcnRMZXNzVGhhbn0gZnJvbSAnLi4vLi4vdXRpbC9hc3NlcnQnO1xuaW1wb3J0IHtleGVjdXRlUHJlT3JkZXJIb29rc30gZnJvbSAnLi4vaG9va3MnO1xuaW1wb3J0IHtIRUFERVJfT0ZGU0VULCBUVklFV30gZnJvbSAnLi4vaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7Z2V0Q2hlY2tOb0NoYW5nZXNNb2RlLCBnZXRMVmlldywgc2V0U2VsZWN0ZWRJbmRleH0gZnJvbSAnLi4vc3RhdGUnO1xuXG4vKipcbiAqIFNlbGVjdHMgYW4gaW5kZXggb2YgYW4gaXRlbSB0byBhY3Qgb24gYW5kIGZsdXNoZXMgbGlmZWN5Y2xlIGhvb2tzIHVwIHRvIHRoaXMgcG9pbnRcbiAqXG4gKiBVc2VkIGluIGNvbmp1bmN0aW9uIHdpdGggaW5zdHJ1Y3Rpb25zIGxpa2Uge0BsaW5rIHByb3BlcnR5fSB0byBhY3Qgb24gZWxlbWVudHMgd2l0aCBzcGVjaWZpZWRcbiAqIGluZGljZXMsIGZvciBleGFtcGxlIHRob3NlIGNyZWF0ZWQgd2l0aCB7QGxpbmsgZWxlbWVudH0gb3Ige0BsaW5rIGVsZW1lbnRTdGFydH0uXG4gKlxuICogYGBgdHNcbiAqIChyZjogUmVuZGVyRmxhZ3MsIGN0eDogYW55KSA9PiB7XG4gICogIGlmIChyZiAmIDEpIHtcbiAgKiAgICBlbGVtZW50KDAsICdkaXYnKTtcbiAgKiAgfVxuICAqICBpZiAocmYgJiAyKSB7XG4gICogICAgc2VsZWN0KDApOyAvLyBTZWxlY3QgdGhlIDxkaXYvPiBjcmVhdGVkIGFib3ZlLlxuICAqICAgIHByb3BlcnR5KCd0aXRsZScsICd0ZXN0Jyk7XG4gICogIH1cbiAgKiB9XG4gICogYGBgXG4gICogQHBhcmFtIGluZGV4IHRoZSBpbmRleCBvZiB0aGUgaXRlbSB0byBhY3Qgb24gd2l0aCB0aGUgZm9sbG93aW5nIGluc3RydWN0aW9uc1xuICAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNlbGVjdChpbmRleDogbnVtYmVyKTogdm9pZCB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRHcmVhdGVyVGhhbihpbmRleCwgLTEsICdJbnZhbGlkIGluZGV4Jyk7XG4gIG5nRGV2TW9kZSAmJlxuICAgICAgYXNzZXJ0TGVzc1RoYW4oXG4gICAgICAgICAgaW5kZXgsIGdldExWaWV3KCkubGVuZ3RoIC0gSEVBREVSX09GRlNFVCwgJ1Nob3VsZCBiZSB3aXRoaW4gcmFuZ2UgZm9yIHRoZSB2aWV3IGRhdGEnKTtcbiAgc2V0U2VsZWN0ZWRJbmRleChpbmRleCk7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgZXhlY3V0ZVByZU9yZGVySG9va3MobFZpZXcsIGxWaWV3W1RWSUVXXSwgZ2V0Q2hlY2tOb0NoYW5nZXNNb2RlKCksIGluZGV4KTtcbn1cbiJdfQ==