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
 * Used in conjunction with instructions like {@link property} to act on elements with specified
 * indices, for example those created with {@link element} or {@link elementStart}.
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
 * @param index the index of the item to act on with the following instructions
 *
 * @codeGenApi
 */
export function ɵɵselect(index) {
    ngDevMode && assertGreaterThan(index, -1, 'Invalid index');
    ngDevMode &&
        assertLessThan(index, getLView().length - HEADER_OFFSET, 'Should be within range for the view data');
    setSelectedIndex(index);
    var lView = getLView();
    executePreOrderHooks(lView, lView[TVIEW], getCheckNoChangesMode(), index);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VsZWN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9pbnN0cnVjdGlvbnMvc2VsZWN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUNILE9BQU8sRUFBQyxpQkFBaUIsRUFBRSxjQUFjLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUNwRSxPQUFPLEVBQUMsb0JBQW9CLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDOUMsT0FBTyxFQUFDLGFBQWEsRUFBRSxLQUFLLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUN4RCxPQUFPLEVBQUMscUJBQXFCLEVBQUUsUUFBUSxFQUFFLGdCQUFnQixFQUFDLE1BQU0sVUFBVSxDQUFDO0FBRTNFOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQW9CRztBQUNILE1BQU0sVUFBVSxRQUFRLENBQUMsS0FBYTtJQUNwQyxTQUFTLElBQUksaUJBQWlCLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxFQUFFLGVBQWUsQ0FBQyxDQUFDO0lBQzNELFNBQVM7UUFDTCxjQUFjLENBQ1YsS0FBSyxFQUFFLFFBQVEsRUFBRSxDQUFDLE1BQU0sR0FBRyxhQUFhLEVBQUUsMENBQTBDLENBQUMsQ0FBQztJQUM5RixnQkFBZ0IsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUN4QixJQUFNLEtBQUssR0FBRyxRQUFRLEVBQUUsQ0FBQztJQUN6QixvQkFBb0IsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLEtBQUssQ0FBQyxFQUFFLHFCQUFxQixFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7QUFDNUUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCB7YXNzZXJ0R3JlYXRlclRoYW4sIGFzc2VydExlc3NUaGFufSBmcm9tICcuLi8uLi91dGlsL2Fzc2VydCc7XG5pbXBvcnQge2V4ZWN1dGVQcmVPcmRlckhvb2tzfSBmcm9tICcuLi9ob29rcyc7XG5pbXBvcnQge0hFQURFUl9PRkZTRVQsIFRWSUVXfSBmcm9tICcuLi9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHtnZXRDaGVja05vQ2hhbmdlc01vZGUsIGdldExWaWV3LCBzZXRTZWxlY3RlZEluZGV4fSBmcm9tICcuLi9zdGF0ZSc7XG5cbi8qKlxuICogU2VsZWN0cyBhbiBlbGVtZW50IGZvciBsYXRlciBiaW5kaW5nIGluc3RydWN0aW9ucy5cbiAqXG4gKiBVc2VkIGluIGNvbmp1bmN0aW9uIHdpdGggaW5zdHJ1Y3Rpb25zIGxpa2Uge0BsaW5rIHByb3BlcnR5fSB0byBhY3Qgb24gZWxlbWVudHMgd2l0aCBzcGVjaWZpZWRcbiAqIGluZGljZXMsIGZvciBleGFtcGxlIHRob3NlIGNyZWF0ZWQgd2l0aCB7QGxpbmsgZWxlbWVudH0gb3Ige0BsaW5rIGVsZW1lbnRTdGFydH0uXG4gKlxuICogYGBgdHNcbiAqIChyZjogUmVuZGVyRmxhZ3MsIGN0eDogYW55KSA9PiB7XG4gKiAgIGlmIChyZiAmIDEpIHtcbiAqICAgICBlbGVtZW50KDAsICdkaXYnKTtcbiAqICAgfVxuICogICBpZiAocmYgJiAyKSB7XG4gKiAgICAgc2VsZWN0KDApOyAvLyBTZWxlY3QgdGhlIDxkaXYvPiBjcmVhdGVkIGFib3ZlLlxuICogICAgIHByb3BlcnR5KCd0aXRsZScsICd0ZXN0Jyk7XG4gKiAgIH1cbiAqICB9XG4gKiBgYGBcbiAqIEBwYXJhbSBpbmRleCB0aGUgaW5kZXggb2YgdGhlIGl0ZW0gdG8gYWN0IG9uIHdpdGggdGhlIGZvbGxvd2luZyBpbnN0cnVjdGlvbnNcbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtXNlbGVjdChpbmRleDogbnVtYmVyKTogdm9pZCB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRHcmVhdGVyVGhhbihpbmRleCwgLTEsICdJbnZhbGlkIGluZGV4Jyk7XG4gIG5nRGV2TW9kZSAmJlxuICAgICAgYXNzZXJ0TGVzc1RoYW4oXG4gICAgICAgICAgaW5kZXgsIGdldExWaWV3KCkubGVuZ3RoIC0gSEVBREVSX09GRlNFVCwgJ1Nob3VsZCBiZSB3aXRoaW4gcmFuZ2UgZm9yIHRoZSB2aWV3IGRhdGEnKTtcbiAgc2V0U2VsZWN0ZWRJbmRleChpbmRleCk7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgZXhlY3V0ZVByZU9yZGVySG9va3MobFZpZXcsIGxWaWV3W1RWSUVXXSwgZ2V0Q2hlY2tOb0NoYW5nZXNNb2RlKCksIGluZGV4KTtcbn1cbiJdfQ==