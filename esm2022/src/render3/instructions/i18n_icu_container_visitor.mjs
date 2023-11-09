/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { assertDomNode, assertNumber, assertNumberInRange } from '../../util/assert';
import { EMPTY_ARRAY } from '../../util/empty';
import { assertTIcu, assertTNodeForLView } from '../assert';
import { getCurrentICUCaseIndex } from '../i18n/i18n_util';
import { TVIEW } from '../interfaces/view';
export function loadIcuContainerVisitor() {
    const _stack = [];
    let _index = -1;
    let _lView;
    let _removes;
    /**
     * Retrieves a set of root nodes from `TIcu.remove`. Used by `TNodeType.ICUContainer`
     * to determine which root belong to the ICU.
     *
     * Example of usage.
     * ```
     * const nextRNode = icuContainerIteratorStart(tIcuContainerNode, lView);
     * let rNode: RNode|null;
     * while(rNode = nextRNode()) {
     *   console.log(rNode);
     * }
     * ```
     *
     * @param tIcuContainerNode Current `TIcuContainerNode`
     * @param lView `LView` where the `RNode`s should be looked up.
     */
    function icuContainerIteratorStart(tIcuContainerNode, lView) {
        _lView = lView;
        while (_stack.length)
            _stack.pop();
        ngDevMode && assertTNodeForLView(tIcuContainerNode, lView);
        enterIcu(tIcuContainerNode.value, lView);
        return icuContainerIteratorNext;
    }
    function enterIcu(tIcu, lView) {
        _index = 0;
        const currentCase = getCurrentICUCaseIndex(tIcu, lView);
        if (currentCase !== null) {
            ngDevMode && assertNumberInRange(currentCase, 0, tIcu.cases.length - 1);
            _removes = tIcu.remove[currentCase];
        }
        else {
            _removes = EMPTY_ARRAY;
        }
    }
    function icuContainerIteratorNext() {
        if (_index < _removes.length) {
            const removeOpCode = _removes[_index++];
            ngDevMode && assertNumber(removeOpCode, 'Expecting OpCode number');
            if (removeOpCode > 0) {
                const rNode = _lView[removeOpCode];
                ngDevMode && assertDomNode(rNode);
                return rNode;
            }
            else {
                _stack.push(_index, _removes);
                // ICUs are represented by negative indices
                const tIcuIndex = ~removeOpCode;
                const tIcu = _lView[TVIEW].data[tIcuIndex];
                ngDevMode && assertTIcu(tIcu);
                enterIcu(tIcu, _lView);
                return icuContainerIteratorNext();
            }
        }
        else {
            if (_stack.length === 0) {
                return null;
            }
            else {
                _removes = _stack.pop();
                _index = _stack.pop();
                return icuContainerIteratorNext();
            }
        }
    }
    return icuContainerIteratorStart;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaTE4bl9pY3VfY29udGFpbmVyX3Zpc2l0b3IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2luc3RydWN0aW9ucy9pMThuX2ljdV9jb250YWluZXJfdmlzaXRvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsYUFBYSxFQUFFLFlBQVksRUFBRSxtQkFBbUIsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQ25GLE9BQU8sRUFBQyxXQUFXLEVBQUMsTUFBTSxrQkFBa0IsQ0FBQztBQUM3QyxPQUFPLEVBQUMsVUFBVSxFQUFFLG1CQUFtQixFQUFDLE1BQU0sV0FBVyxDQUFDO0FBQzFELE9BQU8sRUFBQyxzQkFBc0IsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBSXpELE9BQU8sRUFBUSxLQUFLLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUVoRCxNQUFNLFVBQVUsdUJBQXVCO0lBQ3JDLE1BQU0sTUFBTSxHQUFVLEVBQUUsQ0FBQztJQUN6QixJQUFJLE1BQU0sR0FBVyxDQUFDLENBQUMsQ0FBQztJQUN4QixJQUFJLE1BQWEsQ0FBQztJQUNsQixJQUFJLFFBQTJCLENBQUM7SUFFaEM7Ozs7Ozs7Ozs7Ozs7OztPQWVHO0lBQ0gsU0FBUyx5QkFBeUIsQ0FBQyxpQkFBb0MsRUFBRSxLQUFZO1FBRW5GLE1BQU0sR0FBRyxLQUFLLENBQUM7UUFDZixPQUFPLE1BQU0sQ0FBQyxNQUFNO1lBQUUsTUFBTSxDQUFDLEdBQUcsRUFBRSxDQUFDO1FBQ25DLFNBQVMsSUFBSSxtQkFBbUIsQ0FBQyxpQkFBaUIsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUMzRCxRQUFRLENBQUMsaUJBQWlCLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ3pDLE9BQU8sd0JBQXdCLENBQUM7SUFDbEMsQ0FBQztJQUVELFNBQVMsUUFBUSxDQUFDLElBQVUsRUFBRSxLQUFZO1FBQ3hDLE1BQU0sR0FBRyxDQUFDLENBQUM7UUFDWCxNQUFNLFdBQVcsR0FBRyxzQkFBc0IsQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDeEQsSUFBSSxXQUFXLEtBQUssSUFBSSxFQUFFLENBQUM7WUFDekIsU0FBUyxJQUFJLG1CQUFtQixDQUFDLFdBQVcsRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDeEUsUUFBUSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDdEMsQ0FBQzthQUFNLENBQUM7WUFDTixRQUFRLEdBQUcsV0FBa0IsQ0FBQztRQUNoQyxDQUFDO0lBQ0gsQ0FBQztJQUdELFNBQVMsd0JBQXdCO1FBQy9CLElBQUksTUFBTSxHQUFHLFFBQVEsQ0FBQyxNQUFNLEVBQUUsQ0FBQztZQUM3QixNQUFNLFlBQVksR0FBRyxRQUFRLENBQUMsTUFBTSxFQUFFLENBQVcsQ0FBQztZQUNsRCxTQUFTLElBQUksWUFBWSxDQUFDLFlBQVksRUFBRSx5QkFBeUIsQ0FBQyxDQUFDO1lBQ25FLElBQUksWUFBWSxHQUFHLENBQUMsRUFBRSxDQUFDO2dCQUNyQixNQUFNLEtBQUssR0FBRyxNQUFNLENBQUMsWUFBWSxDQUFDLENBQUM7Z0JBQ25DLFNBQVMsSUFBSSxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQ2xDLE9BQU8sS0FBSyxDQUFDO1lBQ2YsQ0FBQztpQkFBTSxDQUFDO2dCQUNOLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLFFBQVEsQ0FBQyxDQUFDO2dCQUM5QiwyQ0FBMkM7Z0JBQzNDLE1BQU0sU0FBUyxHQUFHLENBQUMsWUFBWSxDQUFDO2dCQUNoQyxNQUFNLElBQUksR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBUyxDQUFDO2dCQUNuRCxTQUFTLElBQUksVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUM5QixRQUFRLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxDQUFDO2dCQUN2QixPQUFPLHdCQUF3QixFQUFFLENBQUM7WUFDcEMsQ0FBQztRQUNILENBQUM7YUFBTSxDQUFDO1lBQ04sSUFBSSxNQUFNLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRSxDQUFDO2dCQUN4QixPQUFPLElBQUksQ0FBQztZQUNkLENBQUM7aUJBQU0sQ0FBQztnQkFDTixRQUFRLEdBQUcsTUFBTSxDQUFDLEdBQUcsRUFBRSxDQUFDO2dCQUN4QixNQUFNLEdBQUcsTUFBTSxDQUFDLEdBQUcsRUFBRSxDQUFDO2dCQUN0QixPQUFPLHdCQUF3QixFQUFFLENBQUM7WUFDcEMsQ0FBQztRQUNILENBQUM7SUFDSCxDQUFDO0lBRUQsT0FBTyx5QkFBeUIsQ0FBQztBQUNuQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7YXNzZXJ0RG9tTm9kZSwgYXNzZXJ0TnVtYmVyLCBhc3NlcnROdW1iZXJJblJhbmdlfSBmcm9tICcuLi8uLi91dGlsL2Fzc2VydCc7XG5pbXBvcnQge0VNUFRZX0FSUkFZfSBmcm9tICcuLi8uLi91dGlsL2VtcHR5JztcbmltcG9ydCB7YXNzZXJ0VEljdSwgYXNzZXJ0VE5vZGVGb3JMVmlld30gZnJvbSAnLi4vYXNzZXJ0JztcbmltcG9ydCB7Z2V0Q3VycmVudElDVUNhc2VJbmRleH0gZnJvbSAnLi4vaTE4bi9pMThuX3V0aWwnO1xuaW1wb3J0IHtJMThuUmVtb3ZlT3BDb2RlcywgVEljdX0gZnJvbSAnLi4vaW50ZXJmYWNlcy9pMThuJztcbmltcG9ydCB7VEljdUNvbnRhaW5lck5vZGV9IGZyb20gJy4uL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge1JOb2RlfSBmcm9tICcuLi9pbnRlcmZhY2VzL3JlbmRlcmVyX2RvbSc7XG5pbXBvcnQge0xWaWV3LCBUVklFV30gZnJvbSAnLi4vaW50ZXJmYWNlcy92aWV3JztcblxuZXhwb3J0IGZ1bmN0aW9uIGxvYWRJY3VDb250YWluZXJWaXNpdG9yKCkge1xuICBjb25zdCBfc3RhY2s6IGFueVtdID0gW107XG4gIGxldCBfaW5kZXg6IG51bWJlciA9IC0xO1xuICBsZXQgX2xWaWV3OiBMVmlldztcbiAgbGV0IF9yZW1vdmVzOiBJMThuUmVtb3ZlT3BDb2RlcztcblxuICAvKipcbiAgICogUmV0cmlldmVzIGEgc2V0IG9mIHJvb3Qgbm9kZXMgZnJvbSBgVEljdS5yZW1vdmVgLiBVc2VkIGJ5IGBUTm9kZVR5cGUuSUNVQ29udGFpbmVyYFxuICAgKiB0byBkZXRlcm1pbmUgd2hpY2ggcm9vdCBiZWxvbmcgdG8gdGhlIElDVS5cbiAgICpcbiAgICogRXhhbXBsZSBvZiB1c2FnZS5cbiAgICogYGBgXG4gICAqIGNvbnN0IG5leHRSTm9kZSA9IGljdUNvbnRhaW5lckl0ZXJhdG9yU3RhcnQodEljdUNvbnRhaW5lck5vZGUsIGxWaWV3KTtcbiAgICogbGV0IHJOb2RlOiBSTm9kZXxudWxsO1xuICAgKiB3aGlsZShyTm9kZSA9IG5leHRSTm9kZSgpKSB7XG4gICAqICAgY29uc29sZS5sb2cock5vZGUpO1xuICAgKiB9XG4gICAqIGBgYFxuICAgKlxuICAgKiBAcGFyYW0gdEljdUNvbnRhaW5lck5vZGUgQ3VycmVudCBgVEljdUNvbnRhaW5lck5vZGVgXG4gICAqIEBwYXJhbSBsVmlldyBgTFZpZXdgIHdoZXJlIHRoZSBgUk5vZGVgcyBzaG91bGQgYmUgbG9va2VkIHVwLlxuICAgKi9cbiAgZnVuY3Rpb24gaWN1Q29udGFpbmVySXRlcmF0b3JTdGFydCh0SWN1Q29udGFpbmVyTm9kZTogVEljdUNvbnRhaW5lck5vZGUsIGxWaWV3OiBMVmlldyk6ICgpID0+XG4gICAgICBSTm9kZSB8IG51bGwge1xuICAgIF9sVmlldyA9IGxWaWV3O1xuICAgIHdoaWxlIChfc3RhY2subGVuZ3RoKSBfc3RhY2sucG9wKCk7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydFROb2RlRm9yTFZpZXcodEljdUNvbnRhaW5lck5vZGUsIGxWaWV3KTtcbiAgICBlbnRlckljdSh0SWN1Q29udGFpbmVyTm9kZS52YWx1ZSwgbFZpZXcpO1xuICAgIHJldHVybiBpY3VDb250YWluZXJJdGVyYXRvck5leHQ7XG4gIH1cblxuICBmdW5jdGlvbiBlbnRlckljdSh0SWN1OiBUSWN1LCBsVmlldzogTFZpZXcpIHtcbiAgICBfaW5kZXggPSAwO1xuICAgIGNvbnN0IGN1cnJlbnRDYXNlID0gZ2V0Q3VycmVudElDVUNhc2VJbmRleCh0SWN1LCBsVmlldyk7XG4gICAgaWYgKGN1cnJlbnRDYXNlICE9PSBudWxsKSB7XG4gICAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0TnVtYmVySW5SYW5nZShjdXJyZW50Q2FzZSwgMCwgdEljdS5jYXNlcy5sZW5ndGggLSAxKTtcbiAgICAgIF9yZW1vdmVzID0gdEljdS5yZW1vdmVbY3VycmVudENhc2VdO1xuICAgIH0gZWxzZSB7XG4gICAgICBfcmVtb3ZlcyA9IEVNUFRZX0FSUkFZIGFzIGFueTtcbiAgICB9XG4gIH1cblxuXG4gIGZ1bmN0aW9uIGljdUNvbnRhaW5lckl0ZXJhdG9yTmV4dCgpOiBSTm9kZXxudWxsIHtcbiAgICBpZiAoX2luZGV4IDwgX3JlbW92ZXMubGVuZ3RoKSB7XG4gICAgICBjb25zdCByZW1vdmVPcENvZGUgPSBfcmVtb3Zlc1tfaW5kZXgrK10gYXMgbnVtYmVyO1xuICAgICAgbmdEZXZNb2RlICYmIGFzc2VydE51bWJlcihyZW1vdmVPcENvZGUsICdFeHBlY3RpbmcgT3BDb2RlIG51bWJlcicpO1xuICAgICAgaWYgKHJlbW92ZU9wQ29kZSA+IDApIHtcbiAgICAgICAgY29uc3Qgck5vZGUgPSBfbFZpZXdbcmVtb3ZlT3BDb2RlXTtcbiAgICAgICAgbmdEZXZNb2RlICYmIGFzc2VydERvbU5vZGUock5vZGUpO1xuICAgICAgICByZXR1cm4gck5vZGU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBfc3RhY2sucHVzaChfaW5kZXgsIF9yZW1vdmVzKTtcbiAgICAgICAgLy8gSUNVcyBhcmUgcmVwcmVzZW50ZWQgYnkgbmVnYXRpdmUgaW5kaWNlc1xuICAgICAgICBjb25zdCB0SWN1SW5kZXggPSB+cmVtb3ZlT3BDb2RlO1xuICAgICAgICBjb25zdCB0SWN1ID0gX2xWaWV3W1RWSUVXXS5kYXRhW3RJY3VJbmRleF0gYXMgVEljdTtcbiAgICAgICAgbmdEZXZNb2RlICYmIGFzc2VydFRJY3UodEljdSk7XG4gICAgICAgIGVudGVySWN1KHRJY3UsIF9sVmlldyk7XG4gICAgICAgIHJldHVybiBpY3VDb250YWluZXJJdGVyYXRvck5leHQoKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKF9zdGFjay5sZW5ndGggPT09IDApIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBfcmVtb3ZlcyA9IF9zdGFjay5wb3AoKTtcbiAgICAgICAgX2luZGV4ID0gX3N0YWNrLnBvcCgpO1xuICAgICAgICByZXR1cm4gaWN1Q29udGFpbmVySXRlcmF0b3JOZXh0KCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGljdUNvbnRhaW5lckl0ZXJhdG9yU3RhcnQ7XG59XG4iXX0=