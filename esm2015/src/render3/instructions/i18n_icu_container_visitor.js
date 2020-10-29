/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { assertDomNode, assertNumber, assertNumberInRange } from '../../util/assert';
import { assertTIcu, assertTNodeForLView } from '../assert';
import { EMPTY_ARRAY } from '../empty';
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaTE4bl9pY3VfY29udGFpbmVyX3Zpc2l0b3IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2luc3RydWN0aW9ucy9pMThuX2ljdV9jb250YWluZXJfdmlzaXRvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsYUFBYSxFQUFFLFlBQVksRUFBRSxtQkFBbUIsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQ25GLE9BQU8sRUFBQyxVQUFVLEVBQUUsbUJBQW1CLEVBQUMsTUFBTSxXQUFXLENBQUM7QUFDMUQsT0FBTyxFQUFDLFdBQVcsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUNyQyxPQUFPLEVBQUMsc0JBQXNCLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUl6RCxPQUFPLEVBQVEsS0FBSyxFQUFDLE1BQU0sb0JBQW9CLENBQUM7QUFFaEQsTUFBTSxVQUFVLHVCQUF1QjtJQUNyQyxNQUFNLE1BQU0sR0FBVSxFQUFFLENBQUM7SUFDekIsSUFBSSxNQUFNLEdBQVcsQ0FBQyxDQUFDLENBQUM7SUFDeEIsSUFBSSxNQUFhLENBQUM7SUFDbEIsSUFBSSxRQUEyQixDQUFDO0lBRWhDOzs7Ozs7Ozs7Ozs7Ozs7T0FlRztJQUNILFNBQVMseUJBQXlCLENBQUMsaUJBQW9DLEVBQUUsS0FBWTtRQUVuRixNQUFNLEdBQUcsS0FBSyxDQUFDO1FBQ2YsT0FBTyxNQUFNLENBQUMsTUFBTTtZQUFFLE1BQU0sQ0FBQyxHQUFHLEVBQUUsQ0FBQztRQUNuQyxTQUFTLElBQUksbUJBQW1CLENBQUMsaUJBQWlCLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDM0QsUUFBUSxDQUFDLGlCQUFpQixDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztRQUN6QyxPQUFPLHdCQUF3QixDQUFDO0lBQ2xDLENBQUM7SUFFRCxTQUFTLFFBQVEsQ0FBQyxJQUFVLEVBQUUsS0FBWTtRQUN4QyxNQUFNLEdBQUcsQ0FBQyxDQUFDO1FBQ1gsTUFBTSxXQUFXLEdBQUcsc0JBQXNCLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ3hELElBQUksV0FBVyxLQUFLLElBQUksRUFBRTtZQUN4QixTQUFTLElBQUksbUJBQW1CLENBQUMsV0FBVyxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQztZQUN4RSxRQUFRLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUMsQ0FBQztTQUNyQzthQUFNO1lBQ0wsUUFBUSxHQUFHLFdBQWtCLENBQUM7U0FDL0I7SUFDSCxDQUFDO0lBR0QsU0FBUyx3QkFBd0I7UUFDL0IsSUFBSSxNQUFNLEdBQUcsUUFBUSxDQUFDLE1BQU0sRUFBRTtZQUM1QixNQUFNLFlBQVksR0FBRyxRQUFRLENBQUMsTUFBTSxFQUFFLENBQVcsQ0FBQztZQUNsRCxTQUFTLElBQUksWUFBWSxDQUFDLFlBQVksRUFBRSx5QkFBeUIsQ0FBQyxDQUFDO1lBQ25FLElBQUksWUFBWSxHQUFHLENBQUMsRUFBRTtnQkFDcEIsTUFBTSxLQUFLLEdBQUcsTUFBTSxDQUFDLFlBQVksQ0FBQyxDQUFDO2dCQUNuQyxTQUFTLElBQUksYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUNsQyxPQUFPLEtBQUssQ0FBQzthQUNkO2lCQUFNO2dCQUNMLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLFFBQVEsQ0FBQyxDQUFDO2dCQUM5QiwyQ0FBMkM7Z0JBQzNDLE1BQU0sU0FBUyxHQUFHLENBQUMsWUFBWSxDQUFDO2dCQUNoQyxNQUFNLElBQUksR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBUyxDQUFDO2dCQUNuRCxTQUFTLElBQUksVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUM5QixRQUFRLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxDQUFDO2dCQUN2QixPQUFPLHdCQUF3QixFQUFFLENBQUM7YUFDbkM7U0FDRjthQUFNO1lBQ0wsSUFBSSxNQUFNLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRTtnQkFDdkIsT0FBTyxJQUFJLENBQUM7YUFDYjtpQkFBTTtnQkFDTCxRQUFRLEdBQUcsTUFBTSxDQUFDLEdBQUcsRUFBRSxDQUFDO2dCQUN4QixNQUFNLEdBQUcsTUFBTSxDQUFDLEdBQUcsRUFBRSxDQUFDO2dCQUN0QixPQUFPLHdCQUF3QixFQUFFLENBQUM7YUFDbkM7U0FDRjtJQUNILENBQUM7SUFFRCxPQUFPLHlCQUF5QixDQUFDO0FBQ25DLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHthc3NlcnREb21Ob2RlLCBhc3NlcnROdW1iZXIsIGFzc2VydE51bWJlckluUmFuZ2V9IGZyb20gJy4uLy4uL3V0aWwvYXNzZXJ0JztcbmltcG9ydCB7YXNzZXJ0VEljdSwgYXNzZXJ0VE5vZGVGb3JMVmlld30gZnJvbSAnLi4vYXNzZXJ0JztcbmltcG9ydCB7RU1QVFlfQVJSQVl9IGZyb20gJy4uL2VtcHR5JztcbmltcG9ydCB7Z2V0Q3VycmVudElDVUNhc2VJbmRleH0gZnJvbSAnLi4vaTE4bi9pMThuX3V0aWwnO1xuaW1wb3J0IHtJMThuUmVtb3ZlT3BDb2RlcywgVEljdX0gZnJvbSAnLi4vaW50ZXJmYWNlcy9pMThuJztcbmltcG9ydCB7VEljdUNvbnRhaW5lck5vZGV9IGZyb20gJy4uL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge1JOb2RlfSBmcm9tICcuLi9pbnRlcmZhY2VzL3JlbmRlcmVyJztcbmltcG9ydCB7TFZpZXcsIFRWSUVXfSBmcm9tICcuLi9pbnRlcmZhY2VzL3ZpZXcnO1xuXG5leHBvcnQgZnVuY3Rpb24gbG9hZEljdUNvbnRhaW5lclZpc2l0b3IoKSB7XG4gIGNvbnN0IF9zdGFjazogYW55W10gPSBbXTtcbiAgbGV0IF9pbmRleDogbnVtYmVyID0gLTE7XG4gIGxldCBfbFZpZXc6IExWaWV3O1xuICBsZXQgX3JlbW92ZXM6IEkxOG5SZW1vdmVPcENvZGVzO1xuXG4gIC8qKlxuICAgKiBSZXRyaWV2ZXMgYSBzZXQgb2Ygcm9vdCBub2RlcyBmcm9tIGBUSWN1LnJlbW92ZWAuIFVzZWQgYnkgYFROb2RlVHlwZS5JQ1VDb250YWluZXJgXG4gICAqIHRvIGRldGVybWluZSB3aGljaCByb290IGJlbG9uZyB0byB0aGUgSUNVLlxuICAgKlxuICAgKiBFeGFtcGxlIG9mIHVzYWdlLlxuICAgKiBgYGBcbiAgICogY29uc3QgbmV4dFJOb2RlID0gaWN1Q29udGFpbmVySXRlcmF0b3JTdGFydCh0SWN1Q29udGFpbmVyTm9kZSwgbFZpZXcpO1xuICAgKiBsZXQgck5vZGU6IFJOb2RlfG51bGw7XG4gICAqIHdoaWxlKHJOb2RlID0gbmV4dFJOb2RlKCkpIHtcbiAgICogICBjb25zb2xlLmxvZyhyTm9kZSk7XG4gICAqIH1cbiAgICogYGBgXG4gICAqXG4gICAqIEBwYXJhbSB0SWN1Q29udGFpbmVyTm9kZSBDdXJyZW50IGBUSWN1Q29udGFpbmVyTm9kZWBcbiAgICogQHBhcmFtIGxWaWV3IGBMVmlld2Agd2hlcmUgdGhlIGBSTm9kZWBzIHNob3VsZCBiZSBsb29rZWQgdXAuXG4gICAqL1xuICBmdW5jdGlvbiBpY3VDb250YWluZXJJdGVyYXRvclN0YXJ0KHRJY3VDb250YWluZXJOb2RlOiBUSWN1Q29udGFpbmVyTm9kZSwgbFZpZXc6IExWaWV3KTogKCkgPT5cbiAgICAgIFJOb2RlIHwgbnVsbCB7XG4gICAgX2xWaWV3ID0gbFZpZXc7XG4gICAgd2hpbGUgKF9zdGFjay5sZW5ndGgpIF9zdGFjay5wb3AoKTtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0VE5vZGVGb3JMVmlldyh0SWN1Q29udGFpbmVyTm9kZSwgbFZpZXcpO1xuICAgIGVudGVySWN1KHRJY3VDb250YWluZXJOb2RlLnZhbHVlLCBsVmlldyk7XG4gICAgcmV0dXJuIGljdUNvbnRhaW5lckl0ZXJhdG9yTmV4dDtcbiAgfVxuXG4gIGZ1bmN0aW9uIGVudGVySWN1KHRJY3U6IFRJY3UsIGxWaWV3OiBMVmlldykge1xuICAgIF9pbmRleCA9IDA7XG4gICAgY29uc3QgY3VycmVudENhc2UgPSBnZXRDdXJyZW50SUNVQ2FzZUluZGV4KHRJY3UsIGxWaWV3KTtcbiAgICBpZiAoY3VycmVudENhc2UgIT09IG51bGwpIHtcbiAgICAgIG5nRGV2TW9kZSAmJiBhc3NlcnROdW1iZXJJblJhbmdlKGN1cnJlbnRDYXNlLCAwLCB0SWN1LmNhc2VzLmxlbmd0aCAtIDEpO1xuICAgICAgX3JlbW92ZXMgPSB0SWN1LnJlbW92ZVtjdXJyZW50Q2FzZV07XG4gICAgfSBlbHNlIHtcbiAgICAgIF9yZW1vdmVzID0gRU1QVFlfQVJSQVkgYXMgYW55O1xuICAgIH1cbiAgfVxuXG5cbiAgZnVuY3Rpb24gaWN1Q29udGFpbmVySXRlcmF0b3JOZXh0KCk6IFJOb2RlfG51bGwge1xuICAgIGlmIChfaW5kZXggPCBfcmVtb3Zlcy5sZW5ndGgpIHtcbiAgICAgIGNvbnN0IHJlbW92ZU9wQ29kZSA9IF9yZW1vdmVzW19pbmRleCsrXSBhcyBudW1iZXI7XG4gICAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0TnVtYmVyKHJlbW92ZU9wQ29kZSwgJ0V4cGVjdGluZyBPcENvZGUgbnVtYmVyJyk7XG4gICAgICBpZiAocmVtb3ZlT3BDb2RlID4gMCkge1xuICAgICAgICBjb25zdCByTm9kZSA9IF9sVmlld1tyZW1vdmVPcENvZGVdO1xuICAgICAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RG9tTm9kZShyTm9kZSk7XG4gICAgICAgIHJldHVybiByTm9kZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIF9zdGFjay5wdXNoKF9pbmRleCwgX3JlbW92ZXMpO1xuICAgICAgICAvLyBJQ1VzIGFyZSByZXByZXNlbnRlZCBieSBuZWdhdGl2ZSBpbmRpY2VzXG4gICAgICAgIGNvbnN0IHRJY3VJbmRleCA9IH5yZW1vdmVPcENvZGU7XG4gICAgICAgIGNvbnN0IHRJY3UgPSBfbFZpZXdbVFZJRVddLmRhdGFbdEljdUluZGV4XSBhcyBUSWN1O1xuICAgICAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0VEljdSh0SWN1KTtcbiAgICAgICAgZW50ZXJJY3UodEljdSwgX2xWaWV3KTtcbiAgICAgICAgcmV0dXJuIGljdUNvbnRhaW5lckl0ZXJhdG9yTmV4dCgpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoX3N0YWNrLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIF9yZW1vdmVzID0gX3N0YWNrLnBvcCgpO1xuICAgICAgICBfaW5kZXggPSBfc3RhY2sucG9wKCk7XG4gICAgICAgIHJldHVybiBpY3VDb250YWluZXJJdGVyYXRvck5leHQoKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gaWN1Q29udGFpbmVySXRlcmF0b3JTdGFydDtcbn1cbiJdfQ==