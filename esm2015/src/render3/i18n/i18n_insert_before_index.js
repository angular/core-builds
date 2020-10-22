/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { assertEqual } from '../../util/assert';
/**
 * Add `tNode` to `previousTNodes` list and update relevant `TNode`s in `previousTNodes` list
 * `tNode.insertBeforeIndex`.
 *
 * Things to keep in mind:
 * 1. All i18n text nodes are encoded as `TNodeType.Element` and are created eagerly by the
 *    `ɵɵi18nStart` instruction.
 * 2. All `TNodeType.Placeholder` `TNodes` are elements which will be created later by
 *    `ɵɵelementStart` instruction.
 * 3. `ɵɵelementStart` instruction will create `TNode`s in the ascending `TNode.index` order. (So a
 *    smaller index `TNode` is guaranteed to be created before a larger one)
 *
 * We use the above three invariants to determine `TNode.insertBeforeIndex`.
 *
 * In an ideal world `TNode.insertBeforeIndex` would always be `TNode.next.index`. However,
 * this will not work because `TNode.next.index` may be larger than `TNode.index` which means that
 * the next node is not yet created and therefore we can't insert in front of it.
 *
 * Rule1: `TNode.insertBeforeIndex = null` if `TNode.next === null` (Initial condition, as we don't
 *        know if there will be further `TNode`s inserted after.)
 * Rule2: If `previousTNode` is created after the `tNode` being inserted, then
 *        `previousTNode.insertBeforeNode = tNode.index` (So when a new `tNode` is added we check
 *        previous to see if we can update its `insertBeforeTNode`)
 *
 * See `TNode.insertBeforeIndex` for more context.
 *
 * @param previousTNodes A list of previous TNodes so that we can easily traverse `TNode`s in
 *     reverse order. (If `TNode` would have `previous` this would not be necessary.)
 * @param newTNode A TNode to add to the `previousTNodes` list.
 */
export function addTNodeAndUpdateInsertBeforeIndex(previousTNodes, newTNode) {
    // Start with Rule1
    ngDevMode &&
        assertEqual(newTNode.insertBeforeIndex, null, 'We expect that insertBeforeIndex is not set');
    previousTNodes.push(newTNode);
    if (previousTNodes.length > 1) {
        for (let i = previousTNodes.length - 2; i >= 0; i--) {
            const existingTNode = previousTNodes[i];
            // Text nodes are created eagerly and so they don't need their `indexBeforeIndex` updated.
            // It is safe to ignore them.
            if (!isI18nText(existingTNode)) {
                if (isNewTNodeCreatedBefore(existingTNode, newTNode) &&
                    getInsertBeforeIndex(existingTNode) === null) {
                    // If it was created before us in time, (and it does not yet have `insertBeforeIndex`)
                    // then add the `insertBeforeIndex`.
                    setInsertBeforeIndex(existingTNode, newTNode.index);
                }
            }
        }
    }
}
function isI18nText(tNode) {
    return !(tNode.type & 64 /* Placeholder */);
}
function isNewTNodeCreatedBefore(existingTNode, newTNode) {
    return isI18nText(newTNode) || existingTNode.index > newTNode.index;
}
function getInsertBeforeIndex(tNode) {
    const index = tNode.insertBeforeIndex;
    return Array.isArray(index) ? index[0] : index;
}
function setInsertBeforeIndex(tNode, value) {
    const index = tNode.insertBeforeIndex;
    if (Array.isArray(index)) {
        // Array is stored if we have to insert child nodes. See `TNode.insertBeforeIndex`
        index[0] = value;
    }
    else {
        tNode.insertBeforeIndex = value;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaTE4bl9pbnNlcnRfYmVmb3JlX2luZGV4LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9pMThuL2kxOG5faW5zZXJ0X2JlZm9yZV9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsV0FBVyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFHOUM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBNkJHO0FBQ0gsTUFBTSxVQUFVLGtDQUFrQyxDQUFDLGNBQXVCLEVBQUUsUUFBZTtJQUN6RixtQkFBbUI7SUFDbkIsU0FBUztRQUNMLFdBQVcsQ0FBQyxRQUFRLENBQUMsaUJBQWlCLEVBQUUsSUFBSSxFQUFFLDZDQUE2QyxDQUFDLENBQUM7SUFFakcsY0FBYyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUM5QixJQUFJLGNBQWMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO1FBQzdCLEtBQUssSUFBSSxDQUFDLEdBQUcsY0FBYyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRTtZQUNuRCxNQUFNLGFBQWEsR0FBRyxjQUFjLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDeEMsMEZBQTBGO1lBQzFGLDZCQUE2QjtZQUM3QixJQUFJLENBQUMsVUFBVSxDQUFDLGFBQWEsQ0FBQyxFQUFFO2dCQUM5QixJQUFJLHVCQUF1QixDQUFDLGFBQWEsRUFBRSxRQUFRLENBQUM7b0JBQ2hELG9CQUFvQixDQUFDLGFBQWEsQ0FBQyxLQUFLLElBQUksRUFBRTtvQkFDaEQsc0ZBQXNGO29CQUN0RixvQ0FBb0M7b0JBQ3BDLG9CQUFvQixDQUFDLGFBQWEsRUFBRSxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUM7aUJBQ3JEO2FBQ0Y7U0FDRjtLQUNGO0FBQ0gsQ0FBQztBQUVELFNBQVMsVUFBVSxDQUFDLEtBQVk7SUFDOUIsT0FBTyxDQUFDLENBQUMsS0FBSyxDQUFDLElBQUksdUJBQXdCLENBQUMsQ0FBQztBQUMvQyxDQUFDO0FBRUQsU0FBUyx1QkFBdUIsQ0FBQyxhQUFvQixFQUFFLFFBQWU7SUFDcEUsT0FBTyxVQUFVLENBQUMsUUFBUSxDQUFDLElBQUksYUFBYSxDQUFDLEtBQUssR0FBRyxRQUFRLENBQUMsS0FBSyxDQUFDO0FBQ3RFLENBQUM7QUFFRCxTQUFTLG9CQUFvQixDQUFDLEtBQVk7SUFDeEMsTUFBTSxLQUFLLEdBQUcsS0FBSyxDQUFDLGlCQUFpQixDQUFDO0lBQ3RDLE9BQU8sS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUM7QUFDakQsQ0FBQztBQUVELFNBQVMsb0JBQW9CLENBQUMsS0FBWSxFQUFFLEtBQWE7SUFDdkQsTUFBTSxLQUFLLEdBQUcsS0FBSyxDQUFDLGlCQUFpQixDQUFDO0lBQ3RDLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsRUFBRTtRQUN4QixrRkFBa0Y7UUFDbEYsS0FBSyxDQUFDLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQztLQUNsQjtTQUFNO1FBQ0wsS0FBSyxDQUFDLGlCQUFpQixHQUFHLEtBQUssQ0FBQztLQUNqQztBQUNILENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHthc3NlcnRFcXVhbH0gZnJvbSAnLi4vLi4vdXRpbC9hc3NlcnQnO1xuaW1wb3J0IHtUTm9kZSwgVE5vZGVUeXBlfSBmcm9tICcuLi9pbnRlcmZhY2VzL25vZGUnO1xuXG4vKipcbiAqIEFkZCBgdE5vZGVgIHRvIGBwcmV2aW91c1ROb2Rlc2AgbGlzdCBhbmQgdXBkYXRlIHJlbGV2YW50IGBUTm9kZWBzIGluIGBwcmV2aW91c1ROb2Rlc2AgbGlzdFxuICogYHROb2RlLmluc2VydEJlZm9yZUluZGV4YC5cbiAqXG4gKiBUaGluZ3MgdG8ga2VlcCBpbiBtaW5kOlxuICogMS4gQWxsIGkxOG4gdGV4dCBub2RlcyBhcmUgZW5jb2RlZCBhcyBgVE5vZGVUeXBlLkVsZW1lbnRgIGFuZCBhcmUgY3JlYXRlZCBlYWdlcmx5IGJ5IHRoZVxuICogICAgYMm1ybVpMThuU3RhcnRgIGluc3RydWN0aW9uLlxuICogMi4gQWxsIGBUTm9kZVR5cGUuUGxhY2Vob2xkZXJgIGBUTm9kZXNgIGFyZSBlbGVtZW50cyB3aGljaCB3aWxsIGJlIGNyZWF0ZWQgbGF0ZXIgYnlcbiAqICAgIGDJtcm1ZWxlbWVudFN0YXJ0YCBpbnN0cnVjdGlvbi5cbiAqIDMuIGDJtcm1ZWxlbWVudFN0YXJ0YCBpbnN0cnVjdGlvbiB3aWxsIGNyZWF0ZSBgVE5vZGVgcyBpbiB0aGUgYXNjZW5kaW5nIGBUTm9kZS5pbmRleGAgb3JkZXIuIChTbyBhXG4gKiAgICBzbWFsbGVyIGluZGV4IGBUTm9kZWAgaXMgZ3VhcmFudGVlZCB0byBiZSBjcmVhdGVkIGJlZm9yZSBhIGxhcmdlciBvbmUpXG4gKlxuICogV2UgdXNlIHRoZSBhYm92ZSB0aHJlZSBpbnZhcmlhbnRzIHRvIGRldGVybWluZSBgVE5vZGUuaW5zZXJ0QmVmb3JlSW5kZXhgLlxuICpcbiAqIEluIGFuIGlkZWFsIHdvcmxkIGBUTm9kZS5pbnNlcnRCZWZvcmVJbmRleGAgd291bGQgYWx3YXlzIGJlIGBUTm9kZS5uZXh0LmluZGV4YC4gSG93ZXZlcixcbiAqIHRoaXMgd2lsbCBub3Qgd29yayBiZWNhdXNlIGBUTm9kZS5uZXh0LmluZGV4YCBtYXkgYmUgbGFyZ2VyIHRoYW4gYFROb2RlLmluZGV4YCB3aGljaCBtZWFucyB0aGF0XG4gKiB0aGUgbmV4dCBub2RlIGlzIG5vdCB5ZXQgY3JlYXRlZCBhbmQgdGhlcmVmb3JlIHdlIGNhbid0IGluc2VydCBpbiBmcm9udCBvZiBpdC5cbiAqXG4gKiBSdWxlMTogYFROb2RlLmluc2VydEJlZm9yZUluZGV4ID0gbnVsbGAgaWYgYFROb2RlLm5leHQgPT09IG51bGxgIChJbml0aWFsIGNvbmRpdGlvbiwgYXMgd2UgZG9uJ3RcbiAqICAgICAgICBrbm93IGlmIHRoZXJlIHdpbGwgYmUgZnVydGhlciBgVE5vZGVgcyBpbnNlcnRlZCBhZnRlci4pXG4gKiBSdWxlMjogSWYgYHByZXZpb3VzVE5vZGVgIGlzIGNyZWF0ZWQgYWZ0ZXIgdGhlIGB0Tm9kZWAgYmVpbmcgaW5zZXJ0ZWQsIHRoZW5cbiAqICAgICAgICBgcHJldmlvdXNUTm9kZS5pbnNlcnRCZWZvcmVOb2RlID0gdE5vZGUuaW5kZXhgIChTbyB3aGVuIGEgbmV3IGB0Tm9kZWAgaXMgYWRkZWQgd2UgY2hlY2tcbiAqICAgICAgICBwcmV2aW91cyB0byBzZWUgaWYgd2UgY2FuIHVwZGF0ZSBpdHMgYGluc2VydEJlZm9yZVROb2RlYClcbiAqXG4gKiBTZWUgYFROb2RlLmluc2VydEJlZm9yZUluZGV4YCBmb3IgbW9yZSBjb250ZXh0LlxuICpcbiAqIEBwYXJhbSBwcmV2aW91c1ROb2RlcyBBIGxpc3Qgb2YgcHJldmlvdXMgVE5vZGVzIHNvIHRoYXQgd2UgY2FuIGVhc2lseSB0cmF2ZXJzZSBgVE5vZGVgcyBpblxuICogICAgIHJldmVyc2Ugb3JkZXIuIChJZiBgVE5vZGVgIHdvdWxkIGhhdmUgYHByZXZpb3VzYCB0aGlzIHdvdWxkIG5vdCBiZSBuZWNlc3NhcnkuKVxuICogQHBhcmFtIG5ld1ROb2RlIEEgVE5vZGUgdG8gYWRkIHRvIHRoZSBgcHJldmlvdXNUTm9kZXNgIGxpc3QuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhZGRUTm9kZUFuZFVwZGF0ZUluc2VydEJlZm9yZUluZGV4KHByZXZpb3VzVE5vZGVzOiBUTm9kZVtdLCBuZXdUTm9kZTogVE5vZGUpIHtcbiAgLy8gU3RhcnQgd2l0aCBSdWxlMVxuICBuZ0Rldk1vZGUgJiZcbiAgICAgIGFzc2VydEVxdWFsKG5ld1ROb2RlLmluc2VydEJlZm9yZUluZGV4LCBudWxsLCAnV2UgZXhwZWN0IHRoYXQgaW5zZXJ0QmVmb3JlSW5kZXggaXMgbm90IHNldCcpO1xuXG4gIHByZXZpb3VzVE5vZGVzLnB1c2gobmV3VE5vZGUpO1xuICBpZiAocHJldmlvdXNUTm9kZXMubGVuZ3RoID4gMSkge1xuICAgIGZvciAobGV0IGkgPSBwcmV2aW91c1ROb2Rlcy5sZW5ndGggLSAyOyBpID49IDA7IGktLSkge1xuICAgICAgY29uc3QgZXhpc3RpbmdUTm9kZSA9IHByZXZpb3VzVE5vZGVzW2ldO1xuICAgICAgLy8gVGV4dCBub2RlcyBhcmUgY3JlYXRlZCBlYWdlcmx5IGFuZCBzbyB0aGV5IGRvbid0IG5lZWQgdGhlaXIgYGluZGV4QmVmb3JlSW5kZXhgIHVwZGF0ZWQuXG4gICAgICAvLyBJdCBpcyBzYWZlIHRvIGlnbm9yZSB0aGVtLlxuICAgICAgaWYgKCFpc0kxOG5UZXh0KGV4aXN0aW5nVE5vZGUpKSB7XG4gICAgICAgIGlmIChpc05ld1ROb2RlQ3JlYXRlZEJlZm9yZShleGlzdGluZ1ROb2RlLCBuZXdUTm9kZSkgJiZcbiAgICAgICAgICAgIGdldEluc2VydEJlZm9yZUluZGV4KGV4aXN0aW5nVE5vZGUpID09PSBudWxsKSB7XG4gICAgICAgICAgLy8gSWYgaXQgd2FzIGNyZWF0ZWQgYmVmb3JlIHVzIGluIHRpbWUsIChhbmQgaXQgZG9lcyBub3QgeWV0IGhhdmUgYGluc2VydEJlZm9yZUluZGV4YClcbiAgICAgICAgICAvLyB0aGVuIGFkZCB0aGUgYGluc2VydEJlZm9yZUluZGV4YC5cbiAgICAgICAgICBzZXRJbnNlcnRCZWZvcmVJbmRleChleGlzdGluZ1ROb2RlLCBuZXdUTm9kZS5pbmRleCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gaXNJMThuVGV4dCh0Tm9kZTogVE5vZGUpOiBib29sZWFuIHtcbiAgcmV0dXJuICEodE5vZGUudHlwZSAmIFROb2RlVHlwZS5QbGFjZWhvbGRlcik7XG59XG5cbmZ1bmN0aW9uIGlzTmV3VE5vZGVDcmVhdGVkQmVmb3JlKGV4aXN0aW5nVE5vZGU6IFROb2RlLCBuZXdUTm9kZTogVE5vZGUpOiBib29sZWFuIHtcbiAgcmV0dXJuIGlzSTE4blRleHQobmV3VE5vZGUpIHx8IGV4aXN0aW5nVE5vZGUuaW5kZXggPiBuZXdUTm9kZS5pbmRleDtcbn1cblxuZnVuY3Rpb24gZ2V0SW5zZXJ0QmVmb3JlSW5kZXgodE5vZGU6IFROb2RlKTogbnVtYmVyfG51bGwge1xuICBjb25zdCBpbmRleCA9IHROb2RlLmluc2VydEJlZm9yZUluZGV4O1xuICByZXR1cm4gQXJyYXkuaXNBcnJheShpbmRleCkgPyBpbmRleFswXSA6IGluZGV4O1xufVxuXG5mdW5jdGlvbiBzZXRJbnNlcnRCZWZvcmVJbmRleCh0Tm9kZTogVE5vZGUsIHZhbHVlOiBudW1iZXIpOiB2b2lkIHtcbiAgY29uc3QgaW5kZXggPSB0Tm9kZS5pbnNlcnRCZWZvcmVJbmRleDtcbiAgaWYgKEFycmF5LmlzQXJyYXkoaW5kZXgpKSB7XG4gICAgLy8gQXJyYXkgaXMgc3RvcmVkIGlmIHdlIGhhdmUgdG8gaW5zZXJ0IGNoaWxkIG5vZGVzLiBTZWUgYFROb2RlLmluc2VydEJlZm9yZUluZGV4YFxuICAgIGluZGV4WzBdID0gdmFsdWU7XG4gIH0gZWxzZSB7XG4gICAgdE5vZGUuaW5zZXJ0QmVmb3JlSW5kZXggPSB2YWx1ZTtcbiAgfVxufVxuIl19