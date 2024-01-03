/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { keyValueArrayIndexOf } from '../../util/array_utils';
import { assertEqual, assertIndexInRange, assertNotEqual } from '../../util/assert';
import { assertFirstUpdatePass } from '../assert';
import { getTStylingRangeNext, getTStylingRangePrev, setTStylingRangeNext, setTStylingRangeNextDuplicate, setTStylingRangePrev, setTStylingRangePrevDuplicate, toTStylingRange } from '../interfaces/styling';
import { getTView } from '../state';
/**
 * NOTE: The word `styling` is used interchangeably as style or class styling.
 *
 * This file contains code to link styling instructions together so that they can be replayed in
 * priority order. The file exists because Ivy styling instruction execution order does not match
 * that of the priority order. The purpose of this code is to create a linked list so that the
 * instructions can be traversed in priority order when computing the styles.
 *
 * Assume we are dealing with the following code:
 * ```
 * @Component({
 *   template: `
 *     <my-cmp [style]=" {color: '#001'} "
 *             [style.color]=" #002 "
 *             dir-style-color-1
 *             dir-style-color-2> `
 * })
 * class ExampleComponent {
 *   static ngComp = ... {
 *     ...
 *     // Compiler ensures that `ɵɵstyleProp` is after `ɵɵstyleMap`
 *     ɵɵstyleMap({color: '#001'});
 *     ɵɵstyleProp('color', '#002');
 *     ...
 *   }
 * }
 *
 * @Directive({
 *   selector: `[dir-style-color-1]',
 * })
 * class Style1Directive {
 *   @HostBinding('style') style = {color: '#005'};
 *   @HostBinding('style.color') color = '#006';
 *
 *   static ngDir = ... {
 *     ...
 *     // Compiler ensures that `ɵɵstyleProp` is after `ɵɵstyleMap`
 *     ɵɵstyleMap({color: '#005'});
 *     ɵɵstyleProp('color', '#006');
 *     ...
 *   }
 * }
 *
 * @Directive({
 *   selector: `[dir-style-color-2]',
 * })
 * class Style2Directive {
 *   @HostBinding('style') style = {color: '#007'};
 *   @HostBinding('style.color') color = '#008';
 *
 *   static ngDir = ... {
 *     ...
 *     // Compiler ensures that `ɵɵstyleProp` is after `ɵɵstyleMap`
 *     ɵɵstyleMap({color: '#007'});
 *     ɵɵstyleProp('color', '#008');
 *     ...
 *   }
 * }
 *
 * @Directive({
 *   selector: `my-cmp',
 * })
 * class MyComponent {
 *   @HostBinding('style') style = {color: '#003'};
 *   @HostBinding('style.color') color = '#004';
 *
 *   static ngComp = ... {
 *     ...
 *     // Compiler ensures that `ɵɵstyleProp` is after `ɵɵstyleMap`
 *     ɵɵstyleMap({color: '#003'});
 *     ɵɵstyleProp('color', '#004');
 *     ...
 *   }
 * }
 * ```
 *
 * The Order of instruction execution is:
 *
 * NOTE: the comment binding location is for illustrative purposes only.
 *
 * ```
 * // Template: (ExampleComponent)
 *     ɵɵstyleMap({color: '#001'});   // Binding index: 10
 *     ɵɵstyleProp('color', '#002');  // Binding index: 12
 * // MyComponent
 *     ɵɵstyleMap({color: '#003'});   // Binding index: 20
 *     ɵɵstyleProp('color', '#004');  // Binding index: 22
 * // Style1Directive
 *     ɵɵstyleMap({color: '#005'});   // Binding index: 24
 *     ɵɵstyleProp('color', '#006');  // Binding index: 26
 * // Style2Directive
 *     ɵɵstyleMap({color: '#007'});   // Binding index: 28
 *     ɵɵstyleProp('color', '#008');  // Binding index: 30
 * ```
 *
 * The correct priority order of concatenation is:
 *
 * ```
 * // MyComponent
 *     ɵɵstyleMap({color: '#003'});   // Binding index: 20
 *     ɵɵstyleProp('color', '#004');  // Binding index: 22
 * // Style1Directive
 *     ɵɵstyleMap({color: '#005'});   // Binding index: 24
 *     ɵɵstyleProp('color', '#006');  // Binding index: 26
 * // Style2Directive
 *     ɵɵstyleMap({color: '#007'});   // Binding index: 28
 *     ɵɵstyleProp('color', '#008');  // Binding index: 30
 * // Template: (ExampleComponent)
 *     ɵɵstyleMap({color: '#001'});   // Binding index: 10
 *     ɵɵstyleProp('color', '#002');  // Binding index: 12
 * ```
 *
 * What color should be rendered?
 *
 * Once the items are correctly sorted in the list, the answer is simply the last item in the
 * concatenation list which is `#002`.
 *
 * To do so we keep a linked list of all of the bindings which pertain to this element.
 * Notice that the bindings are inserted in the order of execution, but the `TView.data` allows
 * us to traverse them in the order of priority.
 *
 * |Idx|`TView.data`|`LView`          | Notes
 * |---|------------|-----------------|--------------
 * |...|            |                 |
 * |10 |`null`      |`{color: '#001'}`| `ɵɵstyleMap('color', {color: '#001'})`
 * |11 |`30 | 12`   | ...             |
 * |12 |`color`     |`'#002'`         | `ɵɵstyleProp('color', '#002')`
 * |13 |`10 | 0`    | ...             |
 * |...|            |                 |
 * |20 |`null`      |`{color: '#003'}`| `ɵɵstyleMap('color', {color: '#003'})`
 * |21 |`0 | 22`    | ...             |
 * |22 |`color`     |`'#004'`         | `ɵɵstyleProp('color', '#004')`
 * |23 |`20 | 24`   | ...             |
 * |24 |`null`      |`{color: '#005'}`| `ɵɵstyleMap('color', {color: '#005'})`
 * |25 |`22 | 26`   | ...             |
 * |26 |`color`     |`'#006'`         | `ɵɵstyleProp('color', '#006')`
 * |27 |`24 | 28`   | ...             |
 * |28 |`null`      |`{color: '#007'}`| `ɵɵstyleMap('color', {color: '#007'})`
 * |29 |`26 | 30`   | ...             |
 * |30 |`color`     |`'#008'`         | `ɵɵstyleProp('color', '#008')`
 * |31 |`28 | 10`   | ...             |
 *
 * The above data structure allows us to re-concatenate the styling no matter which data binding
 * changes.
 *
 * NOTE: in addition to keeping track of next/previous index the `TView.data` also stores prev/next
 * duplicate bit. The duplicate bit if true says there either is a binding with the same name or
 * there is a map (which may contain the name). This information is useful in knowing if other
 * styles with higher priority need to be searched for overwrites.
 *
 * NOTE: See `should support example in 'tnode_linked_list.ts' documentation` in
 * `tnode_linked_list_spec.ts` for working example.
 */
let __unused_const_as_closure_does_not_like_standalone_comment_blocks__;
/**
 * Insert new `tStyleValue` at `TData` and link existing style bindings such that we maintain linked
 * list of styles and compute the duplicate flag.
 *
 * Note: this function is executed during `firstUpdatePass` only to populate the `TView.data`.
 *
 * The function works by keeping track of `tStylingRange` which contains two pointers pointing to
 * the head/tail of the template portion of the styles.
 *  - if `isHost === false` (we are template) then insertion is at tail of `TStylingRange`
 *  - if `isHost === true` (we are host binding) then insertion is at head of `TStylingRange`
 *
 * @param tData The `TData` to insert into.
 * @param tNode `TNode` associated with the styling element.
 * @param tStylingKey See `TStylingKey`.
 * @param index location of where `tStyleValue` should be stored (and linked into list.)
 * @param isHostBinding `true` if the insertion is for a `hostBinding`. (insertion is in front of
 *               template.)
 * @param isClassBinding True if the associated `tStylingKey` as a `class` styling.
 *                       `tNode.classBindings` should be used (or `tNode.styleBindings` otherwise.)
 */
export function insertTStylingBinding(tData, tNode, tStylingKeyWithStatic, index, isHostBinding, isClassBinding) {
    ngDevMode && assertFirstUpdatePass(getTView());
    let tBindings = isClassBinding ? tNode.classBindings : tNode.styleBindings;
    let tmplHead = getTStylingRangePrev(tBindings);
    let tmplTail = getTStylingRangeNext(tBindings);
    tData[index] = tStylingKeyWithStatic;
    let isKeyDuplicateOfStatic = false;
    let tStylingKey;
    if (Array.isArray(tStylingKeyWithStatic)) {
        // We are case when the `TStylingKey` contains static fields as well.
        const staticKeyValueArray = tStylingKeyWithStatic;
        tStylingKey = staticKeyValueArray[1]; // unwrap.
        // We need to check if our key is present in the static so that we can mark it as duplicate.
        if (tStylingKey === null ||
            keyValueArrayIndexOf(staticKeyValueArray, tStylingKey) > 0) {
            // tStylingKey is present in the statics, need to mark it as duplicate.
            isKeyDuplicateOfStatic = true;
        }
    }
    else {
        tStylingKey = tStylingKeyWithStatic;
    }
    if (isHostBinding) {
        // We are inserting host bindings
        // If we don't have template bindings then `tail` is 0.
        const hasTemplateBindings = tmplTail !== 0;
        // This is important to know because that means that the `head` can't point to the first
        // template bindings (there are none.) Instead the head points to the tail of the template.
        if (hasTemplateBindings) {
            // template head's "prev" will point to last host binding or to 0 if no host bindings yet
            const previousNode = getTStylingRangePrev(tData[tmplHead + 1]);
            tData[index + 1] = toTStylingRange(previousNode, tmplHead);
            // if a host binding has already been registered, we need to update the next of that host
            // binding to point to this one
            if (previousNode !== 0) {
                // We need to update the template-tail value to point to us.
                tData[previousNode + 1] =
                    setTStylingRangeNext(tData[previousNode + 1], index);
            }
            // The "previous" of the template binding head should point to this host binding
            tData[tmplHead + 1] = setTStylingRangePrev(tData[tmplHead + 1], index);
        }
        else {
            tData[index + 1] = toTStylingRange(tmplHead, 0);
            // if a host binding has already been registered, we need to update the next of that host
            // binding to point to this one
            if (tmplHead !== 0) {
                // We need to update the template-tail value to point to us.
                tData[tmplHead + 1] = setTStylingRangeNext(tData[tmplHead + 1], index);
            }
            // if we don't have template, the head points to template-tail, and needs to be advanced.
            tmplHead = index;
        }
    }
    else {
        // We are inserting in template section.
        // We need to set this binding's "previous" to the current template tail
        tData[index + 1] = toTStylingRange(tmplTail, 0);
        ngDevMode &&
            assertEqual(tmplHead !== 0 && tmplTail === 0, false, 'Adding template bindings after hostBindings is not allowed.');
        if (tmplHead === 0) {
            tmplHead = index;
        }
        else {
            // We need to update the previous value "next" to point to this binding
            tData[tmplTail + 1] = setTStylingRangeNext(tData[tmplTail + 1], index);
        }
        tmplTail = index;
    }
    // Now we need to update / compute the duplicates.
    // Starting with our location search towards head (least priority)
    if (isKeyDuplicateOfStatic) {
        tData[index + 1] = setTStylingRangePrevDuplicate(tData[index + 1]);
    }
    markDuplicates(tData, tStylingKey, index, true);
    markDuplicates(tData, tStylingKey, index, false);
    markDuplicateOfResidualStyling(tNode, tStylingKey, tData, index, isClassBinding);
    tBindings = toTStylingRange(tmplHead, tmplTail);
    if (isClassBinding) {
        tNode.classBindings = tBindings;
    }
    else {
        tNode.styleBindings = tBindings;
    }
}
/**
 * Look into the residual styling to see if the current `tStylingKey` is duplicate of residual.
 *
 * @param tNode `TNode` where the residual is stored.
 * @param tStylingKey `TStylingKey` to store.
 * @param tData `TData` associated with the current `LView`.
 * @param index location of where `tStyleValue` should be stored (and linked into list.)
 * @param isClassBinding True if the associated `tStylingKey` as a `class` styling.
 *                       `tNode.classBindings` should be used (or `tNode.styleBindings` otherwise.)
 */
function markDuplicateOfResidualStyling(tNode, tStylingKey, tData, index, isClassBinding) {
    const residual = isClassBinding ? tNode.residualClasses : tNode.residualStyles;
    if (residual != null /* or undefined */ && typeof tStylingKey == 'string' &&
        keyValueArrayIndexOf(residual, tStylingKey) >= 0) {
        // We have duplicate in the residual so mark ourselves as duplicate.
        tData[index + 1] = setTStylingRangeNextDuplicate(tData[index + 1]);
    }
}
/**
 * Marks `TStyleValue`s as duplicates if another style binding in the list has the same
 * `TStyleValue`.
 *
 * NOTE: this function is intended to be called twice once with `isPrevDir` set to `true` and once
 * with it set to `false` to search both the previous as well as next items in the list.
 *
 * No duplicate case
 * ```
 *   [style.color]
 *   [style.width.px] <<- index
 *   [style.height.px]
 * ```
 *
 * In the above case adding `[style.width.px]` to the existing `[style.color]` produces no
 * duplicates because `width` is not found in any other part of the linked list.
 *
 * Duplicate case
 * ```
 *   [style.color]
 *   [style.width.em]
 *   [style.width.px] <<- index
 * ```
 * In the above case adding `[style.width.px]` will produce a duplicate with `[style.width.em]`
 * because `width` is found in the chain.
 *
 * Map case 1
 * ```
 *   [style.width.px]
 *   [style.color]
 *   [style]  <<- index
 * ```
 * In the above case adding `[style]` will produce a duplicate with any other bindings because
 * `[style]` is a Map and as such is fully dynamic and could produce `color` or `width`.
 *
 * Map case 2
 * ```
 *   [style]
 *   [style.width.px]
 *   [style.color]  <<- index
 * ```
 * In the above case adding `[style.color]` will produce a duplicate because there is already a
 * `[style]` binding which is a Map and as such is fully dynamic and could produce `color` or
 * `width`.
 *
 * NOTE: Once `[style]` (Map) is added into the system all things are mapped as duplicates.
 * NOTE: We use `style` as example, but same logic is applied to `class`es as well.
 *
 * @param tData `TData` where the linked list is stored.
 * @param tStylingKey `TStylingKeyPrimitive` which contains the value to compare to other keys in
 *        the linked list.
 * @param index Starting location in the linked list to search from
 * @param isPrevDir Direction.
 *        - `true` for previous (lower priority);
 *        - `false` for next (higher priority).
 */
function markDuplicates(tData, tStylingKey, index, isPrevDir) {
    const tStylingAtIndex = tData[index + 1];
    const isMap = tStylingKey === null;
    let cursor = isPrevDir ? getTStylingRangePrev(tStylingAtIndex) : getTStylingRangeNext(tStylingAtIndex);
    let foundDuplicate = false;
    // We keep iterating as long as we have a cursor
    // AND either:
    // - we found what we are looking for, OR
    // - we are a map in which case we have to continue searching even after we find what we were
    //   looking for since we are a wild card and everything needs to be flipped to duplicate.
    while (cursor !== 0 && (foundDuplicate === false || isMap)) {
        ngDevMode && assertIndexInRange(tData, cursor);
        const tStylingValueAtCursor = tData[cursor];
        const tStyleRangeAtCursor = tData[cursor + 1];
        if (isStylingMatch(tStylingValueAtCursor, tStylingKey)) {
            foundDuplicate = true;
            tData[cursor + 1] = isPrevDir ? setTStylingRangeNextDuplicate(tStyleRangeAtCursor) :
                setTStylingRangePrevDuplicate(tStyleRangeAtCursor);
        }
        cursor = isPrevDir ? getTStylingRangePrev(tStyleRangeAtCursor) :
            getTStylingRangeNext(tStyleRangeAtCursor);
    }
    if (foundDuplicate) {
        // if we found a duplicate, than mark ourselves.
        tData[index + 1] = isPrevDir ? setTStylingRangePrevDuplicate(tStylingAtIndex) :
            setTStylingRangeNextDuplicate(tStylingAtIndex);
    }
}
/**
 * Determines if two `TStylingKey`s are a match.
 *
 * When computing whether a binding contains a duplicate, we need to compare if the instruction
 * `TStylingKey` has a match.
 *
 * Here are examples of `TStylingKey`s which match given `tStylingKeyCursor` is:
 * - `color`
 *    - `color`    // Match another color
 *    - `null`     // That means that `tStylingKey` is a `classMap`/`styleMap` instruction
 *    - `['', 'color', 'other', true]` // wrapped `color` so match
 *    - `['', null, 'other', true]`       // wrapped `null` so match
 *    - `['', 'width', 'color', 'value']` // wrapped static value contains a match on `'color'`
 * - `null`       // `tStylingKeyCursor` always match as it is `classMap`/`styleMap` instruction
 *
 * @param tStylingKeyCursor
 * @param tStylingKey
 */
function isStylingMatch(tStylingKeyCursor, tStylingKey) {
    ngDevMode &&
        assertNotEqual(Array.isArray(tStylingKey), true, 'Expected that \'tStylingKey\' has been unwrapped');
    if (tStylingKeyCursor === null || // If the cursor is `null` it means that we have map at that
        // location so we must assume that we have a match.
        tStylingKey == null || // If `tStylingKey` is `null` then it is a map therefor assume that it
        // contains a match.
        (Array.isArray(tStylingKeyCursor) ? tStylingKeyCursor[1] : tStylingKeyCursor) ===
            tStylingKey // If the keys match explicitly than we are a match.
    ) {
        return true;
    }
    else if (Array.isArray(tStylingKeyCursor) && typeof tStylingKey === 'string') {
        // if we did not find a match, but `tStylingKeyCursor` is `KeyValueArray` that means cursor has
        // statics and we need to check those as well.
        return keyValueArrayIndexOf(tStylingKeyCursor, tStylingKey) >=
            0; // see if we are matching the key
    }
    return false;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3R5bGVfYmluZGluZ19saXN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9zdHlsaW5nL3N0eWxlX2JpbmRpbmdfbGlzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQWdCLG9CQUFvQixFQUFDLE1BQU0sd0JBQXdCLENBQUM7QUFDM0UsT0FBTyxFQUFDLFdBQVcsRUFBRSxrQkFBa0IsRUFBRSxjQUFjLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUNsRixPQUFPLEVBQUMscUJBQXFCLEVBQUMsTUFBTSxXQUFXLENBQUM7QUFFaEQsT0FBTyxFQUFDLG9CQUFvQixFQUFFLG9CQUFvQixFQUFFLG9CQUFvQixFQUFFLDZCQUE2QixFQUFFLG9CQUFvQixFQUFFLDZCQUE2QixFQUFFLGVBQWUsRUFBbUQsTUFBTSx1QkFBdUIsQ0FBQztBQUU5UCxPQUFPLEVBQUMsUUFBUSxFQUFDLE1BQU0sVUFBVSxDQUFDO0FBR2xDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQXdKRztBQUNILElBQUksbUVBQThFLENBQUM7QUFFbkY7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0FtQkc7QUFDSCxNQUFNLFVBQVUscUJBQXFCLENBQ2pDLEtBQVksRUFBRSxLQUFZLEVBQUUscUJBQWtDLEVBQUUsS0FBYSxFQUM3RSxhQUFzQixFQUFFLGNBQXVCO0lBQ2pELFNBQVMsSUFBSSxxQkFBcUIsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO0lBQy9DLElBQUksU0FBUyxHQUFHLGNBQWMsQ0FBQyxDQUFDLENBQUMsS0FBSyxD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UUFDOUMsT0FBTyxvQkFBb0IsQ0FBQyxpQkFBaUIsRUFBRSxXQUFXLENBQUM7WUFDdkQsQ0FBQyxDQUFDLENBQUUsaUNBQWlDO0tBQzFDO0lBQ0QsT0FBTyxLQUFLLENBQUM7QUFDZixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7S2V5VmFsdWVBcnJheSwga2V5VmFsdWVBcnJheUluZGV4T2Z9IGZyb20gJy4uLy4uL3V0aWwvYXJyYXlfdXRpbHMnO1xuaW1wb3J0IHthc3NlcnRFcXVhbCwgYXNzZXJ0SW5kZXhJblJhbmdlLCBhc3NlcnROb3RFcXVhbH0gZnJvbSAnLi4vLi4vdXRpbC9hc3NlcnQnO1xuaW1wb3J0IHthc3NlcnRGaXJzdFVwZGF0ZVBhc3N9IGZyb20gJy4uL2Fzc2VydCc7XG5pbXBvcnQge1ROb2RlfSBmcm9tICcuLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtnZXRUU3R5bGluZ1JhbmdlTmV4dCwgZ2V0VFN0eWxpbmdSYW5nZVByZXYsIHNldFRTdHlsaW5nUmFuZ2VOZXh0LCBzZXRUU3R5bGluZ1JhbmdlTmV4dER1cGxpY2F0ZSwgc2V0VFN0eWxpbmdSYW5nZVByZXYsIHNldFRTdHlsaW5nUmFuZ2VQcmV2RHVwbGljYXRlLCB0b1RTdHlsaW5nUmFuZ2UsIFRTdHlsaW5nS2V5LCBUU3R5bGluZ0tleVByaW1pdGl2ZSwgVFN0eWxpbmdSYW5nZX0gZnJvbSAnLi4vaW50ZXJmYWNlcy9zdHlsaW5nJztcbmltcG9ydCB7VERhdGF9IGZyb20gJy4uL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2dldFRWaWV3fSBmcm9tICcuLi9zdGF0ZSc7XG5cblxuLyoqXG4gKiBOT1RFOiBUaGUgd29yZCBgc3R5bGluZ2AgaXMgdXNlZCBpbnRlcmNoYW5nZWFibHkgYXMgc3R5bGUgb3IgY2xhc3Mgc3R5bGluZy5cbiAqXG4gKiBUaGlzIGZpbGUgY29udGFpbnMgY29kZSB0byBsaW5rIHN0eWxpbmcgaW5zdHJ1Y3Rpb25zIHRvZ2V0aGVyIHNvIHRoYXQgdGhleSBjYW4gYmUgcmVwbGF5ZWQgaW5cbiAqIHByaW9yaXR5IG9yZGVyLiBUaGUgZmlsZSBleGlzdHMgYmVjYXVzZSBJdnkgc3R5bGluZyBpbnN0cnVjdGlvbiBleGVjdXRpb24gb3JkZXIgZG9lcyBub3QgbWF0Y2hcbiAqIHRoYXQgb2YgdGhlIHByaW9yaXR5IG9yZGVyLiBUaGUgcHVycG9zZSBvZiB0aGlzIGNvZGUgaXMgdG8gY3JlYXRlIGEgbGlua2VkIGxpc3Qgc28gdGhhdCB0aGVcbiAqIGluc3RydWN0aW9ucyBjYW4gYmUgdHJhdmVyc2VkIGluIHByaW9yaXR5IG9yZGVyIHdoZW4gY29tcHV0aW5nIHRoZSBzdHlsZXMuXG4gKlxuICogQXNzdW1lIHdlIGFyZSBkZWFsaW5nIHdpdGggdGhlIGZvbGxvd2luZyBjb2RlOlxuICogYGBgXG4gKiBAQ29tcG9uZW50KHtcbiAqICAgdGVtcGxhdGU6IGBcbiAqICAgICA8bXktY21wIFtzdHlsZV09XCIge2NvbG9yOiAnIzAwMSd9IFwiXG4gKiAgICAgICAgICAgICBbc3R5bGUuY29sb3JdPVwiICMwMDIgXCJcbiAqICAgICAgICAgICAgIGRpci1zdHlsZS1jb2xvci0xXG4gKiAgICAgICAgICAgICBkaXItc3R5bGUtY29sb3ItMj4gYFxuICogfSlcbiAqIGNsYXNzIEV4YW1wbGVDb21wb25lbnQge1xuICogICBzdGF0aWMgbmdDb21wID0gLi4uIHtcbiAqICAgICAuLi5cbiAqICAgICAvLyBDb21waWxlciBlbnN1cmVzIHRoYXQgYMm1ybVzdHlsZVByb3BgIGlzIGFmdGVyIGDJtcm1c3R5bGVNYXBgXG4gKiAgICAgybXJtXN0eWxlTWFwKHtjb2xvcjogJyMwMDEnfSk7XG4gKiAgICAgybXJtXN0eWxlUHJvcCgnY29sb3InLCAnIzAwMicpO1xuICogICAgIC4uLlxuICogICB9XG4gKiB9XG4gKlxuICogQERpcmVjdGl2ZSh7XG4gKiAgIHNlbGVjdG9yOiBgW2Rpci1zdHlsZS1jb2xvci0xXScsXG4gKiB9KVxuICogY2xhc3MgU3R5bGUxRGlyZWN0aXZlIHtcbiAqICAgQEhvc3RCaW5kaW5nKCdzdHlsZScpIHN0eWxlID0ge2NvbG9yOiAnIzAwNSd9O1xuICogICBASG9zdEJpbmRpbmcoJ3N0eWxlLmNvbG9yJykgY29sb3IgPSAnIzAwNic7XG4gKlxuICogICBzdGF0aWMgbmdEaXIgPSAuLi4ge1xuICogICAgIC4uLlxuICogICAgIC8vIENvbXBpbGVyIGVuc3VyZXMgdGhhdCBgybXJtXN0eWxlUHJvcGAgaXMgYWZ0ZXIgYMm1ybVzdHlsZU1hcGBcbiAqICAgICDJtcm1c3R5bGVNYXAoe2NvbG9yOiAnIzAwNSd9KTtcbiAqICAgICDJtcm1c3R5bGVQcm9wKCdjb2xvcicsICcjMDA2Jyk7XG4gKiAgICAgLi4uXG4gKiAgIH1cbiAqIH1cbiAqXG4gKiBARGlyZWN0aXZlKHtcbiAqICAgc2VsZWN0b3I6IGBbZGlyLXN0eWxlLWNvbG9yLTJdJyxcbiAqIH0pXG4gKiBjbGFzcyBTdHlsZTJEaXJlY3RpdmUge1xuICogICBASG9zdEJpbmRpbmcoJ3N0eWxlJykgc3R5bGUgPSB7Y29sb3I6ICcjMDA3J307XG4gKiAgIEBIb3N0QmluZGluZygnc3R5bGUuY29sb3InKSBjb2xvciA9ICcjMDA4JztcbiAqXG4gKiAgIHN0YXRpYyBuZ0RpciA9IC4uLiB7XG4gKiAgICAgLi4uXG4gKiAgICAgLy8gQ29tcGlsZXIgZW5zdXJlcyB0aGF0IGDJtcm1c3R5bGVQcm9wYCBpcyBhZnRlciBgybXJtXN0eWxlTWFwYFxuICogICAgIMm1ybVzdHlsZU1hcCh7Y29sb3I6ICcjMDA3J30pO1xuICogICAgIMm1ybVzdHlsZVByb3AoJ2NvbG9yJywgJyMwMDgnKTtcbiAqICAgICAuLi5cbiAqICAgfVxuICogfVxuICpcbiAqIEBEaXJlY3RpdmUoe1xuICogICBzZWxlY3RvcjogYG15LWNtcCcsXG4gKiB9KVxuICogY2xhc3MgTXlDb21wb25lbnQge1xuICogICBASG9zdEJpbmRpbmcoJ3N0eWxlJykgc3R5bGUgPSB7Y29sb3I6ICcjMDAzJ307XG4gKiAgIEBIb3N0QmluZGluZygnc3R5bGUuY29sb3InKSBjb2xvciA9ICcjMDA0JztcbiAqXG4gKiAgIHN0YXRpYyBuZ0NvbXAgPSAuLi4ge1xuICogICAgIC4uLlxuICogICAgIC8vIENvbXBpbGVyIGVuc3VyZXMgdGhhdCBgybXJtXN0eWxlUHJvcGAgaXMgYWZ0ZXIgYMm1ybVzdHlsZU1hcGBcbiAqICAgICDJtcm1c3R5bGVNYXAoe2NvbG9yOiAnIzAwMyd9KTtcbiAqICAgICDJtcm1c3R5bGVQcm9wKCdjb2xvcicsICcjMDA0Jyk7XG4gKiAgICAgLi4uXG4gKiAgIH1cbiAqIH1cbiAqIGBgYFxuICpcbiAqIFRoZSBPcmRlciBvZiBpbnN0cnVjdGlvbiBleGVjdXRpb24gaXM6XG4gKlxuICogTk9URTogdGhlIGNvbW1lbnQgYmluZGluZyBsb2NhdGlvbiBpcyBmb3IgaWxsdXN0cmF0aXZlIHB1cnBvc2VzIG9ubHkuXG4gKlxuICogYGBgXG4gKiAvLyBUZW1wbGF0ZTogKEV4YW1wbGVDb21wb25lbnQpXG4gKiAgICAgybXJtXN0eWxlTWFwKHtjb2xvcjogJyMwMDEnfSk7ICAgLy8gQmluZGluZyBpbmRleDogMTBcbiAqICAgICDJtcm1c3R5bGVQcm9wKCdjb2xvcicsICcjMDAyJyk7ICAvLyBCaW5kaW5nIGluZGV4OiAxMlxuICogLy8gTXlDb21wb25lbnRcbiAqICAgICDJtcm1c3R5bGVNYXAoe2NvbG9yOiAnIzAwMyd9KTsgICAvLyBCaW5kaW5nIGluZGV4OiAyMFxuICogICAgIMm1ybVzdHlsZVByb3AoJ2NvbG9yJywgJyMwMDQnKTsgIC8vIEJpbmRpbmcgaW5kZXg6IDIyXG4gKiAvLyBTdHlsZTFEaXJlY3RpdmVcbiAqICAgICDJtcm1c3R5bGVNYXAoe2NvbG9yOiAnIzAwNSd9KTsgICAvLyBCaW5kaW5nIGluZGV4OiAyNFxuICogICAgIMm1ybVzdHlsZVByb3AoJ2NvbG9yJywgJyMwMDYnKTsgIC8vIEJpbmRpbmcgaW5kZXg6IDI2XG4gKiAvLyBTdHlsZTJEaXJlY3RpdmVcbiAqICAgICDJtcm1c3R5bGVNYXAoe2NvbG9yOiAnIzAwNyd9KTsgICAvLyBCaW5kaW5nIGluZGV4OiAyOFxuICogICAgIMm1ybVzdHlsZVByb3AoJ2NvbG9yJywgJyMwMDgnKTsgIC8vIEJpbmRpbmcgaW5kZXg6IDMwXG4gKiBgYGBcbiAqXG4gKiBUaGUgY29ycmVjdCBwcmlvcml0eSBvcmRlciBvZiBjb25jYXRlbmF0aW9uIGlzOlxuICpcbiAqIGBgYFxuICogLy8gTXlDb21wb25lbnRcbiAqICAgICDJtcm1c3R5bGVNYXAoe2NvbG9yOiAnIzAwMyd9KTsgICAvLyBCaW5kaW5nIGluZGV4OiAyMFxuICogICAgIMm1ybVzdHlsZVByb3AoJ2NvbG9yJywgJyMwMDQnKTsgIC8vIEJpbmRpbmcgaW5kZXg6IDIyXG4gKiAvLyBTdHlsZTFEaXJlY3RpdmVcbiAqICAgICDJtcm1c3R5bGVNYXAoe2NvbG9yOiAnIzAwNSd9KTsgICAvLyBCaW5kaW5nIGluZGV4OiAyNFxuICogICAgIMm1ybVzdHlsZVByb3AoJ2NvbG9yJywgJyMwMDYnKTsgIC8vIEJpbmRpbmcgaW5kZXg6IDI2XG4gKiAvLyBTdHlsZTJEaXJlY3RpdmVcbiAqICAgICDJtcm1c3R5bGVNYXAoe2NvbG9yOiAnIzAwNyd9KTsgICAvLyBCaW5kaW5nIGluZGV4OiAyOFxuICogICAgIMm1ybVzdHlsZVByb3AoJ2NvbG9yJywgJyMwMDgnKTsgIC8vIEJpbmRpbmcgaW5kZXg6IDMwXG4gKiAvLyBUZW1wbGF0ZTogKEV4YW1wbGVDb21wb25lbnQpXG4gKiAgICAgybXJtXN0eWxlTWFwKHtjb2xvcjogJyMwMDEnfSk7ICAgLy8gQmluZGluZyBpbmRleDogMTBcbiAqICAgICDJtcm1c3R5bGVQcm9wKCdjb2xvcicsICcjMDAyJyk7ICAvLyBCaW5kaW5nIGluZGV4OiAxMlxuICogYGBgXG4gKlxuICogV2hhdCBjb2xvciBzaG91bGQgYmUgcmVuZGVyZWQ/XG4gKlxuICogT25jZSB0aGUgaXRlbXMgYXJlIGNvcnJlY3RseSBzb3J0ZWQgaW4gdGhlIGxpc3QsIHRoZSBhbnN3ZXIgaXMgc2ltcGx5IHRoZSBsYXN0IGl0ZW0gaW4gdGhlXG4gKiBjb25jYXRlbmF0aW9uIGxpc3Qgd2hpY2ggaXMgYCMwMDJgLlxuICpcbiAqIFRvIGRvIHNvIHdlIGtlZXAgYSBsaW5rZWQgbGlzdCBvZiBhbGwgb2YgdGhlIGJpbmRpbmdzIHdoaWNoIHBlcnRhaW4gdG8gdGhpcyBlbGVtZW50LlxuICogTm90aWNlIHRoYXQgdGhlIGJpbmRpbmdzIGFyZSBpbnNlcnRlZCBpbiB0aGUgb3JkZXIgb2YgZXhlY3V0aW9uLCBidXQgdGhlIGBUVmlldy5kYXRhYCBhbGxvd3NcbiAqIHVzIHRvIHRyYXZlcnNlIHRoZW0gaW4gdGhlIG9yZGVyIG9mIHByaW9yaXR5LlxuICpcbiAqIHxJZHh8YFRWaWV3LmRhdGFgfGBMVmlld2AgICAgICAgICAgfCBOb3Rlc1xuICogfC0tLXwtLS0tLS0tLS0tLS18LS0tLS0tLS0tLS0tLS0tLS18LS0tLS0tLS0tLS0tLS1cbiAqIHwuLi58ICAgICAgICAgICAgfCAgICAgICAgICAgICAgICAgfFxuICogfDEwIHxgbnVsbGAgICAgICB8YHtjb2xvcjogJyMwMDEnfWB8IGDJtcm1c3R5bGVNYXAoJ2NvbG9yJywge2NvbG9yOiAnIzAwMSd9KWBcbiAqIHwxMSB8YDMwIHwgMTJgICAgfCAuLi4gICAgICAgICAgICAgfFxuICogfDEyIHxgY29sb3JgICAgICB8YCcjMDAyJ2AgICAgICAgICB8IGDJtcm1c3R5bGVQcm9wKCdjb2xvcicsICcjMDAyJylgXG4gKiB8MTMgfGAxMCB8IDBgICAgIHwgLi4uICAgICAgICAgICAgIHxcbiAqIHwuLi58ICAgICAgICAgICAgfCAgICAgICAgICAgICAgICAgfFxuICogfDIwIHxgbnVsbGAgICAgICB8YHtjb2xvcjogJyMwMDMnfWB8IGDJtcm1c3R5bGVNYXAoJ2NvbG9yJywge2NvbG9yOiAnIzAwMyd9KWBcbiAqIHwyMSB8YDAgfCAyMmAgICAgfCAuLi4gICAgICAgICAgICAgfFxuICogfDIyIHxgY29sb3JgICAgICB8YCcjMDA0J2AgICAgICAgICB8IGDJtcm1c3R5bGVQcm9wKCdjb2xvcicsICcjMDA0JylgXG4gKiB8MjMgfGAyMCB8IDI0YCAgIHwgLi4uICAgICAgICAgICAgIHxcbiAqIHwyNCB8YG51bGxgICAgICAgfGB7Y29sb3I6ICcjMDA1J31gfCBgybXJtXN0eWxlTWFwKCdjb2xvcicsIHtjb2xvcjogJyMwMDUnfSlgXG4gKiB8MjUgfGAyMiB8IDI2YCAgIHwgLi4uICAgICAgICAgICAgIHxcbiAqIHwyNiB8YGNvbG9yYCAgICAgfGAnIzAwNidgICAgICAgICAgfCBgybXJtXN0eWxlUHJvcCgnY29sb3InLCAnIzAwNicpYFxuICogfDI3IHxgMjQgfCAyOGAgICB8IC4uLiAgICAgICAgICAgICB8XG4gKiB8MjggfGBudWxsYCAgICAgIHxge2NvbG9yOiAnIzAwNyd9YHwgYMm1ybVzdHlsZU1hcCgnY29sb3InLCB7Y29sb3I6ICcjMDA3J30pYFxuICogfDI5IHxgMjYgfCAzMGAgICB8IC4uLiAgICAgICAgICAgICB8XG4gKiB8MzAgfGBjb2xvcmAgICAgIHxgJyMwMDgnYCAgICAgICAgIHwgYMm1ybVzdHlsZVByb3AoJ2NvbG9yJywgJyMwMDgnKWBcbiAqIHwzMSB8YDI4IHwgMTBgICAgfCAuLi4gICAgICAgICAgICAgfFxuICpcbiAqIFRoZSBhYm92ZSBkYXRhIHN0cnVjdHVyZSBhbGxvd3MgdXMgdG8gcmUtY29uY2F0ZW5hdGUgdGhlIHN0eWxpbmcgbm8gbWF0dGVyIHdoaWNoIGRhdGEgYmluZGluZ1xuICogY2hhbmdlcy5cbiAqXG4gKiBOT1RFOiBpbiBhZGRpdGlvbiB0byBrZWVwaW5nIHRyYWNrIG9mIG5leHQvcHJldmlvdXMgaW5kZXggdGhlIGBUVmlldy5kYXRhYCBhbHNvIHN0b3JlcyBwcmV2L25leHRcbiAqIGR1cGxpY2F0ZSBiaXQuIFRoZSBkdXBsaWNhdGUgYml0IGlmIHRydWUgc2F5cyB0aGVyZSBlaXRoZXIgaXMgYSBiaW5kaW5nIHdpdGggdGhlIHNhbWUgbmFtZSBvclxuICogdGhlcmUgaXMgYSBtYXAgKHdoaWNoIG1heSBjb250YWluIHRoZSBuYW1lKS4gVGhpcyBpbmZvcm1hdGlvbiBpcyB1c2VmdWwgaW4ga25vd2luZyBpZiBvdGhlclxuICogc3R5bGVzIHdpdGggaGlnaGVyIHByaW9yaXR5IG5lZWQgdG8gYmUgc2VhcmNoZWQgZm9yIG92ZXJ3cml0ZXMuXG4gKlxuICogTk9URTogU2VlIGBzaG91bGQgc3VwcG9ydCBleGFtcGxlIGluICd0bm9kZV9saW5rZWRfbGlzdC50cycgZG9jdW1lbnRhdGlvbmAgaW5cbiAqIGB0bm9kZV9saW5rZWRfbGlzdF9zcGVjLnRzYCBmb3Igd29ya2luZyBleGFtcGxlLlxuICovXG5sZXQgX191bnVzZWRfY29uc3RfYXNfY2xvc3VyZV9kb2VzX25vdF9saWtlX3N0YW5kYWxvbmVfY29tbWVudF9ibG9ja3NfXzogdW5kZWZpbmVkO1xuXG4vKipcbiAqIEluc2VydCBuZXcgYHRTdHlsZVZhbHVlYCBhdCBgVERhdGFgIGFuZCBsaW5rIGV4aXN0aW5nIHN0eWxlIGJpbmRpbmdzIHN1Y2ggdGhhdCB3ZSBtYWludGFpbiBsaW5rZWRcbiAqIGxpc3Qgb2Ygc3R5bGVzIGFuZCBjb21wdXRlIHRoZSBkdXBsaWNhdGUgZmxhZy5cbiAqXG4gKiBOb3RlOiB0aGlzIGZ1bmN0aW9uIGlzIGV4ZWN1dGVkIGR1cmluZyBgZmlyc3RVcGRhdGVQYXNzYCBvbmx5IHRvIHBvcHVsYXRlIHRoZSBgVFZpZXcuZGF0YWAuXG4gKlxuICogVGhlIGZ1bmN0aW9uIHdvcmtzIGJ5IGtlZXBpbmcgdHJhY2sgb2YgYHRTdHlsaW5nUmFuZ2VgIHdoaWNoIGNvbnRhaW5zIHR3byBwb2ludGVycyBwb2ludGluZyB0b1xuICogdGhlIGhlYWQvdGFpbCBvZiB0aGUgdGVtcGxhdGUgcG9ydGlvbiBvZiB0aGUgc3R5bGVzLlxuICogIC0gaWYgYGlzSG9zdCA9PT0gZmFsc2VgICh3ZSBhcmUgdGVtcGxhdGUpIHRoZW4gaW5zZXJ0aW9uIGlzIGF0IHRhaWwgb2YgYFRTdHlsaW5nUmFuZ2VgXG4gKiAgLSBpZiBgaXNIb3N0ID09PSB0cnVlYCAod2UgYXJlIGhvc3QgYmluZGluZykgdGhlbiBpbnNlcnRpb24gaXMgYXQgaGVhZCBvZiBgVFN0eWxpbmdSYW5nZWBcbiAqXG4gKiBAcGFyYW0gdERhdGEgVGhlIGBURGF0YWAgdG8gaW5zZXJ0IGludG8uXG4gKiBAcGFyYW0gdE5vZGUgYFROb2RlYCBhc3NvY2lhdGVkIHdpdGggdGhlIHN0eWxpbmcgZWxlbWVudC5cbiAqIEBwYXJhbSB0U3R5bGluZ0tleSBTZWUgYFRTdHlsaW5nS2V5YC5cbiAqIEBwYXJhbSBpbmRleCBsb2NhdGlvbiBvZiB3aGVyZSBgdFN0eWxlVmFsdWVgIHNob3VsZCBiZSBzdG9yZWQgKGFuZCBsaW5rZWQgaW50byBsaXN0LilcbiAqIEBwYXJhbSBpc0hvc3RCaW5kaW5nIGB0cnVlYCBpZiB0aGUgaW5zZXJ0aW9uIGlzIGZvciBhIGBob3N0QmluZGluZ2AuIChpbnNlcnRpb24gaXMgaW4gZnJvbnQgb2ZcbiAqICAgICAgICAgICAgICAgdGVtcGxhdGUuKVxuICogQHBhcmFtIGlzQ2xhc3NCaW5kaW5nIFRydWUgaWYgdGhlIGFzc29jaWF0ZWQgYHRTdHlsaW5nS2V5YCBhcyBhIGBjbGFzc2Agc3R5bGluZy5cbiAqICAgICAgICAgICAgICAgICAgICAgICBgdE5vZGUuY2xhc3NCaW5kaW5nc2Agc2hvdWxkIGJlIHVzZWQgKG9yIGB0Tm9kZS5zdHlsZUJpbmRpbmdzYCBvdGhlcndpc2UuKVxuICovXG5leHBvcnQgZnVuY3Rpb24gaW5zZXJ0VFN0eWxpbmdCaW5kaW5nKFxuICAgIHREYXRhOiBURGF0YSwgdE5vZGU6IFROb2RlLCB0U3R5bGluZ0tleVdpdGhTdGF0aWM6IFRTdHlsaW5nS2V5LCBpbmRleDogbnVtYmVyLFxuICAgIGlzSG9zdEJpbmRpbmc6IGJvb2xlYW4sIGlzQ2xhc3NCaW5kaW5nOiBib29sZWFuKTogdm9pZCB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRGaXJzdFVwZGF0ZVBhc3MoZ2V0VFZpZXcoKSk7XG4gIGxldCB0QmluZGluZ3MgPSBpc0NsYXNzQmluZGluZyA/IHROb2RlLmNsYXNzQmluZGluZ3MgOiB0Tm9kZS5zdHlsZUJpbmRpbmdzO1xuICBsZXQgdG1wbEhlYWQgPSBnZXRUU3R5bGluZ1JhbmdlUHJldih0QmluZGluZ3MpO1xuICBsZXQgdG1wbFRhaWwgPSBnZXRUU3R5bGluZ1JhbmdlTmV4dCh0QmluZGluZ3MpO1xuXG4gIHREYXRhW2luZGV4XSA9IHRTdHlsaW5nS2V5V2l0aFN0YXRpYztcbiAgbGV0IGlzS2V5RHVwbGljYXRlT2ZTdGF0aWMgPSBmYWxzZTtcbiAgbGV0IHRTdHlsaW5nS2V5OiBUU3R5bGluZ0tleVByaW1pdGl2ZTtcbiAgaWYgKEFycmF5LmlzQXJyYXkodFN0eWxpbmdLZXlXaXRoU3RhdGljKSkge1xuICAgIC8vIFdlIGFyZSBjYXNlIHdoZW4gdGhlIGBUU3R5bGluZ0tleWAgY29udGFpbnMgc3RhdGljIGZpZWxkcyBhcyB3ZWxsLlxuICAgIGNvbnN0IHN0YXRpY0tleVZhbHVlQXJyYXkgPSB0U3R5bGluZ0tleVdpdGhTdGF0aWMgYXMgS2V5VmFsdWVBcnJheTxhbnk+O1xuICAgIHRTdHlsaW5nS2V5ID0gc3RhdGljS2V5VmFsdWVBcnJheVsxXTsgIC8vIHVud3JhcC5cbiAgICAvLyBXZSBuZWVkIHRvIGNoZWNrIGlmIG91ciBrZXkgaXMgcHJlc2VudCBpbiB0aGUgc3RhdGljIHNvIHRoYXQgd2UgY2FuIG1hcmsgaXQgYXMgZHVwbGljYXRlLlxuICAgIGlmICh0U3R5bGluZ0tleSA9PT0gbnVsbCB8fFxuICAgICAgICBrZXlWYWx1ZUFycmF5SW5kZXhPZihzdGF0aWNLZXlWYWx1ZUFycmF5LCB0U3R5bGluZ0tleSBhcyBzdHJpbmcpID4gMCkge1xuICAgICAgLy8gdFN0eWxpbmdLZXkgaXMgcHJlc2VudCBpbiB0aGUgc3RhdGljcywgbmVlZCB0byBtYXJrIGl0IGFzIGR1cGxpY2F0ZS5cbiAgICAgIGlzS2V5RHVwbGljYXRlT2ZTdGF0aWMgPSB0cnVlO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICB0U3R5bGluZ0tleSA9IHRTdHlsaW5nS2V5V2l0aFN0YXRpYztcbiAgfVxuICBpZiAoaXNIb3N0QmluZGluZykge1xuICAgIC8vIFdlIGFyZSBpbnNlcnRpbmcgaG9zdCBiaW5kaW5nc1xuXG4gICAgLy8gSWYgd2UgZG9uJ3QgaGF2ZSB0ZW1wbGF0ZSBiaW5kaW5ncyB0aGVuIGB0YWlsYCBpcyAwLlxuICAgIGNvbnN0IGhhc1RlbXBsYXRlQmluZGluZ3MgPSB0bXBsVGFpbCAhPT0gMDtcbiAgICAvLyBUaGlzIGlzIGltcG9ydGFudCB0byBrbm93IGJlY2F1c2UgdGhhdCBtZWFucyB0aGF0IHRoZSBgaGVhZGAgY2FuJ3QgcG9pbnQgdG8gdGhlIGZpcnN0XG4gICAgLy8gdGVtcGxhdGUgYmluZGluZ3MgKHRoZXJlIGFyZSBub25lLikgSW5zdGVhZCB0aGUgaGVhZCBwb2ludHMgdG8gdGhlIHRhaWwgb2YgdGhlIHRlbXBsYXRlLlxuICAgIGlmIChoYXNUZW1wbGF0ZUJpbmRpbmdzKSB7XG4gICAgICAvLyB0ZW1wbGF0ZSBoZWFkJ3MgXCJwcmV2XCIgd2lsbCBwb2ludCB0byBsYXN0IGhvc3QgYmluZGluZyBvciB0byAwIGlmIG5vIGhvc3QgYmluZGluZ3MgeWV0XG4gICAgICBjb25zdCBwcmV2aW91c05vZGUgPSBnZXRUU3R5bGluZ1JhbmdlUHJldih0RGF0YVt0bXBsSGVhZCArIDFdIGFzIFRTdHlsaW5nUmFuZ2UpO1xuICAgICAgdERhdGFbaW5kZXggKyAxXSA9IHRvVFN0eWxpbmdSYW5nZShwcmV2aW91c05vZGUsIHRtcGxIZWFkKTtcbiAgICAgIC8vIGlmIGEgaG9zdCBiaW5kaW5nIGhhcyBhbHJlYWR5IGJlZW4gcmVnaXN0ZXJlZCwgd2UgbmVlZCB0byB1cGRhdGUgdGhlIG5leHQgb2YgdGhhdCBob3N0XG4gICAgICAvLyBiaW5kaW5nIHRvIHBvaW50IHRvIHRoaXMgb25lXG4gICAgICBpZiAocHJldmlvdXNOb2RlICE9PSAwKSB7XG4gICAgICAgIC8vIFdlIG5lZWQgdG8gdXBkYXRlIHRoZSB0ZW1wbGF0ZS10YWlsIHZhbHVlIHRvIHBvaW50IHRvIHVzLlxuICAgICAgICB0RGF0YVtwcmV2aW91c05vZGUgKyAxXSA9XG4gICAgICAgICAgICBzZXRUU3R5bGluZ1JhbmdlTmV4dCh0RGF0YVtwcmV2aW91c05vZGUgKyAxXSBhcyBUU3R5bGluZ1JhbmdlLCBpbmRleCk7XG4gICAgICB9XG4gICAgICAvLyBUaGUgXCJwcmV2aW91c1wiIG9mIHRoZSB0ZW1wbGF0ZSBiaW5kaW5nIGhlYWQgc2hvdWxkIHBvaW50IHRvIHRoaXMgaG9zdCBiaW5kaW5nXG4gICAgICB0RGF0YVt0bXBsSGVhZCArIDFdID0gc2V0VFN0eWxpbmdSYW5nZVByZXYodERhdGFbdG1wbEhlYWQgKyAxXSBhcyBUU3R5bGluZ1JhbmdlLCBpbmRleCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHREYXRhW2luZGV4ICsgMV0gPSB0b1RTdHlsaW5nUmFuZ2UodG1wbEhlYWQsIDApO1xuICAgICAgLy8gaWYgYSBob3N0IGJpbmRpbmcgaGFzIGFscmVhZHkgYmVlbiByZWdpc3RlcmVkLCB3ZSBuZWVkIHRvIHVwZGF0ZSB0aGUgbmV4dCBvZiB0aGF0IGhvc3RcbiAgICAgIC8vIGJpbmRpbmcgdG8gcG9pbnQgdG8gdGhpcyBvbmVcbiAgICAgIGlmICh0bXBsSGVhZCAhPT0gMCkge1xuICAgICAgICAvLyBXZSBuZWVkIHRvIHVwZGF0ZSB0aGUgdGVtcGxhdGUtdGFpbCB2YWx1ZSB0byBwb2ludCB0byB1cy5cbiAgICAgICAgdERhdGFbdG1wbEhlYWQgKyAxXSA9IHNldFRTdHlsaW5nUmFuZ2VOZXh0KHREYXRhW3RtcGxIZWFkICsgMV0gYXMgVFN0eWxpbmdSYW5nZSwgaW5kZXgpO1xuICAgICAgfVxuICAgICAgLy8gaWYgd2UgZG9uJ3QgaGF2ZSB0ZW1wbGF0ZSwgdGhlIGhlYWQgcG9pbnRzIHRvIHRlbXBsYXRlLXRhaWwsIGFuZCBuZWVkcyB0byBiZSBhZHZhbmNlZC5cbiAgICAgIHRtcGxIZWFkID0gaW5kZXg7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIC8vIFdlIGFyZSBpbnNlcnRpbmcgaW4gdGVtcGxhdGUgc2VjdGlvbi5cbiAgICAvLyBXZSBuZWVkIHRvIHNldCB0aGlzIGJpbmRpbmcncyBcInByZXZpb3VzXCIgdG8gdGhlIGN1cnJlbnQgdGVtcGxhdGUgdGFpbFxuICAgIHREYXRhW2luZGV4ICsgMV0gPSB0b1RTdHlsaW5nUmFuZ2UodG1wbFRhaWwsIDApO1xuICAgIG5nRGV2TW9kZSAmJlxuICAgICAgICBhc3NlcnRFcXVhbChcbiAgICAgICAgICAgIHRtcGxIZWFkICE9PSAwICYmIHRtcGxUYWlsID09PSAwLCBmYWxzZSxcbiAgICAgICAgICAgICdBZGRpbmcgdGVtcGxhdGUgYmluZGluZ3MgYWZ0ZXIgaG9zdEJpbmRpbmdzIGlzIG5vdCBhbGxvd2VkLicpO1xuICAgIGlmICh0bXBsSGVhZCA9PT0gMCkge1xuICAgICAgdG1wbEhlYWQgPSBpbmRleDtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gV2UgbmVlZCB0byB1cGRhdGUgdGhlIHByZXZpb3VzIHZhbHVlIFwibmV4dFwiIHRvIHBvaW50IHRvIHRoaXMgYmluZGluZ1xuICAgICAgdERhdGFbdG1wbFRhaWwgKyAxXSA9IHNldFRTdHlsaW5nUmFuZ2VOZXh0KHREYXRhW3RtcGxUYWlsICsgMV0gYXMgVFN0eWxpbmdSYW5nZSwgaW5kZXgpO1xuICAgIH1cbiAgICB0bXBsVGFpbCA9IGluZGV4O1xuICB9XG5cbiAgLy8gTm93IHdlIG5lZWQgdG8gdXBkYXRlIC8gY29tcHV0ZSB0aGUgZHVwbGljYXRlcy5cbiAgLy8gU3RhcnRpbmcgd2l0aCBvdXIgbG9jYXRpb24gc2VhcmNoIHRvd2FyZHMgaGVhZCAobGVhc3QgcHJpb3JpdHkpXG4gIGlmIChpc0tleUR1cGxpY2F0ZU9mU3RhdGljKSB7XG4gICAgdERhdGFbaW5kZXggKyAxXSA9IHNldFRTdHlsaW5nUmFuZ2VQcmV2RHVwbGljYXRlKHREYXRhW2luZGV4ICsgMV0gYXMgVFN0eWxpbmdSYW5nZSk7XG4gIH1cbiAgbWFya0R1cGxpY2F0ZXModERhdGEsIHRTdHlsaW5nS2V5LCBpbmRleCwgdHJ1ZSk7XG4gIG1hcmtEdXBsaWNhdGVzKHREYXRhLCB0U3R5bGluZ0tleSwgaW5kZXgsIGZhbHNlKTtcbiAgbWFya0R1cGxpY2F0ZU9mUmVzaWR1YWxTdHlsaW5nKHROb2RlLCB0U3R5bGluZ0tleSwgdERhdGEsIGluZGV4LCBpc0NsYXNzQmluZGluZyk7XG5cbiAgdEJpbmRpbmdzID0gdG9UU3R5bGluZ1JhbmdlKHRtcGxIZWFkLCB0bXBsVGFpbCk7XG4gIGlmIChpc0NsYXNzQmluZGluZykge1xuICAgIHROb2RlLmNsYXNzQmluZGluZ3MgPSB0QmluZGluZ3M7XG4gIH0gZWxzZSB7XG4gICAgdE5vZGUuc3R5bGVCaW5kaW5ncyA9IHRCaW5kaW5ncztcbiAgfVxufVxuXG4vKipcbiAqIExvb2sgaW50byB0aGUgcmVzaWR1YWwgc3R5bGluZyB0byBzZWUgaWYgdGhlIGN1cnJlbnQgYHRTdHlsaW5nS2V5YCBpcyBkdXBsaWNhdGUgb2YgcmVzaWR1YWwuXG4gKlxuICogQHBhcmFtIHROb2RlIGBUTm9kZWAgd2hlcmUgdGhlIHJlc2lkdWFsIGlzIHN0b3JlZC5cbiAqIEBwYXJhbSB0U3R5bGluZ0tleSBgVFN0eWxpbmdLZXlgIHRvIHN0b3JlLlxuICogQHBhcmFtIHREYXRhIGBURGF0YWAgYXNzb2NpYXRlZCB3aXRoIHRoZSBjdXJyZW50IGBMVmlld2AuXG4gKiBAcGFyYW0gaW5kZXggbG9jYXRpb24gb2Ygd2hlcmUgYHRTdHlsZVZhbHVlYCBzaG91bGQgYmUgc3RvcmVkIChhbmQgbGlua2VkIGludG8gbGlzdC4pXG4gKiBAcGFyYW0gaXNDbGFzc0JpbmRpbmcgVHJ1ZSBpZiB0aGUgYXNzb2NpYXRlZCBgdFN0eWxpbmdLZXlgIGFzIGEgYGNsYXNzYCBzdHlsaW5nLlxuICogICAgICAgICAgICAgICAgICAgICAgIGB0Tm9kZS5jbGFzc0JpbmRpbmdzYCBzaG91bGQgYmUgdXNlZCAob3IgYHROb2RlLnN0eWxlQmluZGluZ3NgIG90aGVyd2lzZS4pXG4gKi9cbmZ1bmN0aW9uIG1hcmtEdXBsaWNhdGVPZlJlc2lkdWFsU3R5bGluZyhcbiAgICB0Tm9kZTogVE5vZGUsIHRTdHlsaW5nS2V5OiBUU3R5bGluZ0tleSwgdERhdGE6IFREYXRhLCBpbmRleDogbnVtYmVyLCBpc0NsYXNzQmluZGluZzogYm9vbGVhbikge1xuICBjb25zdCByZXNpZHVhbCA9IGlzQ2xhc3NCaW5kaW5nID8gdE5vZGUucmVzaWR1YWxDbGFzc2VzIDogdE5vZGUucmVzaWR1YWxTdHlsZXM7XG4gIGlmIChyZXNpZHVhbCAhPSBudWxsIC8qIG9yIHVuZGVmaW5lZCAqLyAmJiB0eXBlb2YgdFN0eWxpbmdLZXkgPT0gJ3N0cmluZycgJiZcbiAgICAgIGtleVZhbHVlQXJyYXlJbmRleE9mKHJlc2lkdWFsLCB0U3R5bGluZ0tleSkgPj0gMCkge1xuICAgIC8vIFdlIGhhdmUgZHVwbGljYXRlIGluIHRoZSByZXNpZHVhbCBzbyBtYXJrIG91cnNlbHZlcyBhcyBkdXBsaWNhdGUuXG4gICAgdERhdGFbaW5kZXggKyAxXSA9IHNldFRTdHlsaW5nUmFuZ2VOZXh0RHVwbGljYXRlKHREYXRhW2luZGV4ICsgMV0gYXMgVFN0eWxpbmdSYW5nZSk7XG4gIH1cbn1cblxuXG4vKipcbiAqIE1hcmtzIGBUU3R5bGVWYWx1ZWBzIGFzIGR1cGxpY2F0ZXMgaWYgYW5vdGhlciBzdHlsZSBiaW5kaW5nIGluIHRoZSBsaXN0IGhhcyB0aGUgc2FtZVxuICogYFRTdHlsZVZhbHVlYC5cbiAqXG4gKiBOT1RFOiB0aGlzIGZ1bmN0aW9uIGlzIGludGVuZGVkIHRvIGJlIGNhbGxlZCB0d2ljZSBvbmNlIHdpdGggYGlzUHJldkRpcmAgc2V0IHRvIGB0cnVlYCBhbmQgb25jZVxuICogd2l0aCBpdCBzZXQgdG8gYGZhbHNlYCB0byBzZWFyY2ggYm90aCB0aGUgcHJldmlvdXMgYXMgd2VsbCBhcyBuZXh0IGl0ZW1zIGluIHRoZSBsaXN0LlxuICpcbiAqIE5vIGR1cGxpY2F0ZSBjYXNlXG4gKiBgYGBcbiAqICAgW3N0eWxlLmNvbG9yXVxuICogICBbc3R5bGUud2lkdGgucHhdIDw8LSBpbmRleFxuICogICBbc3R5bGUuaGVpZ2h0LnB4XVxuICogYGBgXG4gKlxuICogSW4gdGhlIGFib3ZlIGNhc2UgYWRkaW5nIGBbc3R5bGUud2lkdGgucHhdYCB0byB0aGUgZXhpc3RpbmcgYFtzdHlsZS5jb2xvcl1gIHByb2R1Y2VzIG5vXG4gKiBkdXBsaWNhdGVzIGJlY2F1c2UgYHdpZHRoYCBpcyBub3QgZm91bmQgaW4gYW55IG90aGVyIHBhcnQgb2YgdGhlIGxpbmtlZCBsaXN0LlxuICpcbiAqIER1cGxpY2F0ZSBjYXNlXG4gKiBgYGBcbiAqICAgW3N0eWxlLmNvbG9yXVxuICogICBbc3R5bGUud2lkdGguZW1dXG4gKiAgIFtzdHlsZS53aWR0aC5weF0gPDwtIGluZGV4XG4gKiBgYGBcbiAqIEluIHRoZSBhYm92ZSBjYXNlIGFkZGluZyBgW3N0eWxlLndpZHRoLnB4XWAgd2lsbCBwcm9kdWNlIGEgZHVwbGljYXRlIHdpdGggYFtzdHlsZS53aWR0aC5lbV1gXG4gKiBiZWNhdXNlIGB3aWR0aGAgaXMgZm91bmQgaW4gdGhlIGNoYWluLlxuICpcbiAqIE1hcCBjYXNlIDFcbiAqIGBgYFxuICogICBbc3R5bGUud2lkdGgucHhdXG4gKiAgIFtzdHlsZS5jb2xvcl1cbiAqICAgW3N0eWxlXSAgPDwtIGluZGV4XG4gKiBgYGBcbiAqIEluIHRoZSBhYm92ZSBjYXNlIGFkZGluZyBgW3N0eWxlXWAgd2lsbCBwcm9kdWNlIGEgZHVwbGljYXRlIHdpdGggYW55IG90aGVyIGJpbmRpbmdzIGJlY2F1c2VcbiAqIGBbc3R5bGVdYCBpcyBhIE1hcCBhbmQgYXMgc3VjaCBpcyBmdWxseSBkeW5hbWljIGFuZCBjb3VsZCBwcm9kdWNlIGBjb2xvcmAgb3IgYHdpZHRoYC5cbiAqXG4gKiBNYXAgY2FzZSAyXG4gKiBgYGBcbiAqICAgW3N0eWxlXVxuICogICBbc3R5bGUud2lkdGgucHhdXG4gKiAgIFtzdHlsZS5jb2xvcl0gIDw8LSBpbmRleFxuICogYGBgXG4gKiBJbiB0aGUgYWJvdmUgY2FzZSBhZGRpbmcgYFtzdHlsZS5jb2xvcl1gIHdpbGwgcHJvZHVjZSBhIGR1cGxpY2F0ZSBiZWNhdXNlIHRoZXJlIGlzIGFscmVhZHkgYVxuICogYFtzdHlsZV1gIGJpbmRpbmcgd2hpY2ggaXMgYSBNYXAgYW5kIGFzIHN1Y2ggaXMgZnVsbHkgZHluYW1pYyBhbmQgY291bGQgcHJvZHVjZSBgY29sb3JgIG9yXG4gKiBgd2lkdGhgLlxuICpcbiAqIE5PVEU6IE9uY2UgYFtzdHlsZV1gIChNYXApIGlzIGFkZGVkIGludG8gdGhlIHN5c3RlbSBhbGwgdGhpbmdzIGFyZSBtYXBwZWQgYXMgZHVwbGljYXRlcy5cbiAqIE5PVEU6IFdlIHVzZSBgc3R5bGVgIGFzIGV4YW1wbGUsIGJ1dCBzYW1lIGxvZ2ljIGlzIGFwcGxpZWQgdG8gYGNsYXNzYGVzIGFzIHdlbGwuXG4gKlxuICogQHBhcmFtIHREYXRhIGBURGF0YWAgd2hlcmUgdGhlIGxpbmtlZCBsaXN0IGlzIHN0b3JlZC5cbiAqIEBwYXJhbSB0U3R5bGluZ0tleSBgVFN0eWxpbmdLZXlQcmltaXRpdmVgIHdoaWNoIGNvbnRhaW5zIHRoZSB2YWx1ZSB0byBjb21wYXJlIHRvIG90aGVyIGtleXMgaW5cbiAqICAgICAgICB0aGUgbGlua2VkIGxpc3QuXG4gKiBAcGFyYW0gaW5kZXggU3RhcnRpbmcgbG9jYXRpb24gaW4gdGhlIGxpbmtlZCBsaXN0IHRvIHNlYXJjaCBmcm9tXG4gKiBAcGFyYW0gaXNQcmV2RGlyIERpcmVjdGlvbi5cbiAqICAgICAgICAtIGB0cnVlYCBmb3IgcHJldmlvdXMgKGxvd2VyIHByaW9yaXR5KTtcbiAqICAgICAgICAtIGBmYWxzZWAgZm9yIG5leHQgKGhpZ2hlciBwcmlvcml0eSkuXG4gKi9cbmZ1bmN0aW9uIG1hcmtEdXBsaWNhdGVzKFxuICAgIHREYXRhOiBURGF0YSxcbiAgICB0U3R5bGluZ0tleTogVFN0eWxpbmdLZXlQcmltaXRpdmUsXG4gICAgaW5kZXg6IG51bWJlcixcbiAgICBpc1ByZXZEaXI6IGJvb2xlYW4sXG4pIHtcbiAgY29uc3QgdFN0eWxpbmdBdEluZGV4ID0gdERhdGFbaW5kZXggKyAxXSBhcyBUU3R5bGluZ1JhbmdlO1xuICBjb25zdCBpc01hcCA9IHRTdHlsaW5nS2V5ID09PSBudWxsO1xuICBsZXQgY3Vyc29yID1cbiAgICAgIGlzUHJldkRpciA/IGdldFRTdHlsaW5nUmFuZ2VQcmV2KHRTdHlsaW5nQXRJbmRleCkgOiBnZXRUU3R5bGluZ1JhbmdlTmV4dCh0U3R5bGluZ0F0SW5kZXgpO1xuICBsZXQgZm91bmREdXBsaWNhdGUgPSBmYWxzZTtcbiAgLy8gV2Uga2VlcCBpdGVyYXRpbmcgYXMgbG9uZyBhcyB3ZSBoYXZlIGEgY3Vyc29yXG4gIC8vIEFORCBlaXRoZXI6XG4gIC8vIC0gd2UgZm91bmQgd2hhdCB3ZSBhcmUgbG9va2luZyBmb3IsIE9SXG4gIC8vIC0gd2UgYXJlIGEgbWFwIGluIHdoaWNoIGNhc2Ugd2UgaGF2ZSB0byBjb250aW51ZSBzZWFyY2hpbmcgZXZlbiBhZnRlciB3ZSBmaW5kIHdoYXQgd2Ugd2VyZVxuICAvLyAgIGxvb2tpbmcgZm9yIHNpbmNlIHdlIGFyZSBhIHdpbGQgY2FyZCBhbmQgZXZlcnl0aGluZyBuZWVkcyB0byBiZSBmbGlwcGVkIHRvIGR1cGxpY2F0ZS5cbiAgd2hpbGUgKGN1cnNvciAhPT0gMCAmJiAoZm91bmREdXBsaWNhdGUgPT09IGZhbHNlIHx8IGlzTWFwKSkge1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnRJbmRleEluUmFuZ2UodERhdGEsIGN1cnNvcik7XG4gICAgY29uc3QgdFN0eWxpbmdWYWx1ZUF0Q3Vyc29yID0gdERhdGFbY3Vyc29yXSBhcyBUU3R5bGluZ0tleTtcbiAgICBjb25zdCB0U3R5bGVSYW5nZUF0Q3Vyc29yID0gdERhdGFbY3Vyc29yICsgMV0gYXMgVFN0eWxpbmdSYW5nZTtcbiAgICBpZiAoaXNTdHlsaW5nTWF0Y2godFN0eWxpbmdWYWx1ZUF0Q3Vyc29yLCB0U3R5bGluZ0tleSkpIHtcbiAgICAgIGZvdW5kRHVwbGljYXRlID0gdHJ1ZTtcbiAgICAgIHREYXRhW2N1cnNvciArIDFdID0gaXNQcmV2RGlyID8gc2V0VFN0eWxpbmdSYW5nZU5leHREdXBsaWNhdGUodFN0eWxlUmFuZ2VBdEN1cnNvcikgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRUU3R5bGluZ1JhbmdlUHJldkR1cGxpY2F0ZSh0U3R5bGVSYW5nZUF0Q3Vyc29yKTtcbiAgICB9XG4gICAgY3Vyc29yID0gaXNQcmV2RGlyID8gZ2V0VFN0eWxpbmdSYW5nZVByZXYodFN0eWxlUmFuZ2VBdEN1cnNvcikgOlxuICAgICAgICAgICAgICAgICAgICAgICAgIGdldFRTdHlsaW5nUmFuZ2VOZXh0KHRTdHlsZVJhbmdlQXRDdXJzb3IpO1xuICB9XG4gIGlmIChmb3VuZER1cGxpY2F0ZSkge1xuICAgIC8vIGlmIHdlIGZvdW5kIGEgZHVwbGljYXRlLCB0aGFuIG1hcmsgb3Vyc2VsdmVzLlxuICAgIHREYXRhW2luZGV4ICsgMV0gPSBpc1ByZXZEaXIgPyBzZXRUU3R5bGluZ1JhbmdlUHJldkR1cGxpY2F0ZSh0U3R5bGluZ0F0SW5kZXgpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0VFN0eWxpbmdSYW5nZU5leHREdXBsaWNhdGUodFN0eWxpbmdBdEluZGV4KTtcbiAgfVxufVxuXG4vKipcbiAqIERldGVybWluZXMgaWYgdHdvIGBUU3R5bGluZ0tleWBzIGFyZSBhIG1hdGNoLlxuICpcbiAqIFdoZW4gY29tcHV0aW5nIHdoZXRoZXIgYSBiaW5kaW5nIGNvbnRhaW5zIGEgZHVwbGljYXRlLCB3ZSBuZWVkIHRvIGNvbXBhcmUgaWYgdGhlIGluc3RydWN0aW9uXG4gKiBgVFN0eWxpbmdLZXlgIGhhcyBhIG1hdGNoLlxuICpcbiAqIEhlcmUgYXJlIGV4YW1wbGVzIG9mIGBUU3R5bGluZ0tleWBzIHdoaWNoIG1hdGNoIGdpdmVuIGB0U3R5bGluZ0tleUN1cnNvcmAgaXM6XG4gKiAtIGBjb2xvcmBcbiAqICAgIC0gYGNvbG9yYCAgICAvLyBNYXRjaCBhbm90aGVyIGNvbG9yXG4gKiAgICAtIGBudWxsYCAgICAgLy8gVGhhdCBtZWFucyB0aGF0IGB0U3R5bGluZ0tleWAgaXMgYSBgY2xhc3NNYXBgL2BzdHlsZU1hcGAgaW5zdHJ1Y3Rpb25cbiAqICAgIC0gYFsnJywgJ2NvbG9yJywgJ290aGVyJywgdHJ1ZV1gIC8vIHdyYXBwZWQgYGNvbG9yYCBzbyBtYXRjaFxuICogICAgLSBgWycnLCBudWxsLCAnb3RoZXInLCB0cnVlXWAgICAgICAgLy8gd3JhcHBlZCBgbnVsbGAgc28gbWF0Y2hcbiAqICAgIC0gYFsnJywgJ3dpZHRoJywgJ2NvbG9yJywgJ3ZhbHVlJ11gIC8vIHdyYXBwZWQgc3RhdGljIHZhbHVlIGNvbnRhaW5zIGEgbWF0Y2ggb24gYCdjb2xvcidgXG4gKiAtIGBudWxsYCAgICAgICAvLyBgdFN0eWxpbmdLZXlDdXJzb3JgIGFsd2F5cyBtYXRjaCBhcyBpdCBpcyBgY2xhc3NNYXBgL2BzdHlsZU1hcGAgaW5zdHJ1Y3Rpb25cbiAqXG4gKiBAcGFyYW0gdFN0eWxpbmdLZXlDdXJzb3JcbiAqIEBwYXJhbSB0U3R5bGluZ0tleVxuICovXG5mdW5jdGlvbiBpc1N0eWxpbmdNYXRjaCh0U3R5bGluZ0tleUN1cnNvcjogVFN0eWxpbmdLZXksIHRTdHlsaW5nS2V5OiBUU3R5bGluZ0tleVByaW1pdGl2ZSkge1xuICBuZ0Rldk1vZGUgJiZcbiAgICAgIGFzc2VydE5vdEVxdWFsKFxuICAgICAgICAgIEFycmF5LmlzQXJyYXkodFN0eWxpbmdLZXkpLCB0cnVlLCAnRXhwZWN0ZWQgdGhhdCBcXCd0U3R5bGluZ0tleVxcJyBoYXMgYmVlbiB1bndyYXBwZWQnKTtcbiAgaWYgKFxuICAgICAgdFN0eWxpbmdLZXlDdXJzb3IgPT09IG51bGwgfHwgIC8vIElmIHRoZSBjdXJzb3IgaXMgYG51bGxgIGl0IG1lYW5zIHRoYXQgd2UgaGF2ZSBtYXAgYXQgdGhhdFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGxvY2F0aW9uIHNvIHdlIG11c3QgYXNzdW1lIHRoYXQgd2UgaGF2ZSBhIG1hdGNoLlxuICAgICAgdFN0eWxpbmdLZXkgPT0gbnVsbCB8fCAgLy8gSWYgYHRTdHlsaW5nS2V5YCBpcyBgbnVsbGAgdGhlbiBpdCBpcyBhIG1hcCB0aGVyZWZvciBhc3N1bWUgdGhhdCBpdFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gY29udGFpbnMgYSBtYXRjaC5cbiAgICAgIChBcnJheS5pc0FycmF5KHRTdHlsaW5nS2V5Q3Vyc29yKSA/IHRTdHlsaW5nS2V5Q3Vyc29yWzFdIDogdFN0eWxpbmdLZXlDdXJzb3IpID09PVxuICAgICAgICAgIHRTdHlsaW5nS2V5ICAvLyBJZiB0aGUga2V5cyBtYXRjaCBleHBsaWNpdGx5IHRoYW4gd2UgYXJlIGEgbWF0Y2guXG4gICkge1xuICAgIHJldHVybiB0cnVlO1xuICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkodFN0eWxpbmdLZXlDdXJzb3IpICYmIHR5cGVvZiB0U3R5bGluZ0tleSA9PT0gJ3N0cmluZycpIHtcbiAgICAvLyBpZiB3ZSBkaWQgbm90IGZpbmQgYSBtYXRjaCwgYnV0IGB0U3R5bGluZ0tleUN1cnNvcmAgaXMgYEtleVZhbHVlQXJyYXlgIHRoYXQgbWVhbnMgY3Vyc29yIGhhc1xuICAgIC8vIHN0YXRpY3MgYW5kIHdlIG5lZWQgdG8gY2hlY2sgdGhvc2UgYXMgd2VsbC5cbiAgICByZXR1cm4ga2V5VmFsdWVBcnJheUluZGV4T2YodFN0eWxpbmdLZXlDdXJzb3IsIHRTdHlsaW5nS2V5KSA+PVxuICAgICAgICAwOyAgLy8gc2VlIGlmIHdlIGFyZSBtYXRjaGluZyB0aGUga2V5XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuIl19