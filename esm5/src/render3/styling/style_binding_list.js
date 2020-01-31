/**
* @license
* Copyright Google Inc. All Rights Reserved.
*
* Use of this source code is governed by an MIT-style license that can be
* found in the LICENSE file at https://angular.io/license
*/
import { keyValueArrayIndexOf } from '../../util/array_utils';
import { assertDataInRange, assertEqual, assertNotEqual } from '../../util/assert';
import { assertFirstUpdatePass } from '../assert';
import { getTStylingRangeNext, getTStylingRangePrev, setTStylingRangeNext, setTStylingRangeNextDuplicate, setTStylingRangePrev, setTStylingRangePrevDuplicate, toTStylingRange } from '../interfaces/styling';
import { TVIEW } from '../interfaces/view';
import { getLView } from '../state';
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
var __unused_const_as_closure_does_not_like_standalone_comment_blocks__;
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
    ngDevMode && assertFirstUpdatePass(getLView()[TVIEW]);
    var tBindings = isClassBinding ? tNode.classBindings : tNode.styleBindings;
    var tmplHead = getTStylingRangePrev(tBindings);
    var tmplTail = getTStylingRangeNext(tBindings);
    tData[index] = tStylingKeyWithStatic;
    var isKeyDuplicateOfStatic = false;
    var tStylingKey;
    if (Array.isArray(tStylingKeyWithStatic)) {
        // We are case when the `TStylingKey` contains static fields as well.
        var staticKeyValueArray = tStylingKeyWithStatic;
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
        var hasTemplateBindings = tmplTail !== 0;
        // This is important to know because that means that the `head` can't point to the first
        // template bindings (there are none.) Instead the head points to the tail of the template.
        if (hasTemplateBindings) {
            // template head's "prev" will point to last host binding or to 0 if no host bindings yet
            var previousNode = getTStylingRangePrev(tData[tmplHead + 1]);
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
        ngDevMode && assertEqual(tmplHead !== 0 && tmplTail === 0, false, 'Adding template bindings after hostBindings is not allowed.');
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
    markDuplicates(tData, tStylingKey, index, true, isClassBinding);
    markDuplicates(tData, tStylingKey, index, false, isClassBinding);
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
    var residual = isClassBinding ? tNode.residualClasses : tNode.residualStyles;
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
function markDuplicates(tData, tStylingKey, index, isPrevDir, isClassBinding) {
    var tStylingAtIndex = tData[index + 1];
    var isMap = tStylingKey === null;
    var cursor = isPrevDir ? getTStylingRangePrev(tStylingAtIndex) : getTStylingRangeNext(tStylingAtIndex);
    var foundDuplicate = false;
    // We keep iterating as long as we have a cursor
    // AND either:
    // - we found what we are looking for, OR
    // - we are a map in which case we have to continue searching even after we find what we were
    //   looking for since we are a wild card and everything needs to be flipped to duplicate.
    while (cursor !== 0 && (foundDuplicate === false || isMap)) {
        ngDevMode && assertDataInRange(tData, cursor);
        var tStylingValueAtCursor = tData[cursor];
        var tStyleRangeAtCursor = tData[cursor + 1];
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
 * When computing weather a binding contains a duplicate, we need to compare if the instruction
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3R5bGVfYmluZGluZ19saXN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9zdHlsaW5nL3N0eWxlX2JpbmRpbmdfbGlzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0VBTUU7QUFFRixPQUFPLEVBQWdCLG9CQUFvQixFQUFDLE1BQU0sd0JBQXdCLENBQUM7QUFDM0UsT0FBTyxFQUFDLGlCQUFpQixFQUFFLFdBQVcsRUFBRSxjQUFjLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUNqRixPQUFPLEVBQUMscUJBQXFCLEVBQUMsTUFBTSxXQUFXLENBQUM7QUFFaEQsT0FBTyxFQUFtRCxvQkFBb0IsRUFBRSxvQkFBb0IsRUFBRSxvQkFBb0IsRUFBRSw2QkFBNkIsRUFBRSxvQkFBb0IsRUFBRSw2QkFBNkIsRUFBRSxlQUFlLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUM5UCxPQUFPLEVBQVEsS0FBSyxFQUFDLE1BQU0sb0JBQW9CLENBQUM7QUFDaEQsT0FBTyxFQUFDLFFBQVEsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUlsQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0F3Skc7QUFDSCxJQUFJLG1FQUE4RSxDQUFDO0FBRW5GOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBbUJHO0FBQ0gsTUFBTSxVQUFVLHFCQUFxQixDQUNqQyxLQUFZLEVBQUUsS0FBWSxFQUFFLHFCQUFrQyxFQUFFLEtBQWEsRUFDN0UsYUFBc0IsRUFBRSxjQUF1QjtJQUNqRCxTQUFTLElBQUkscUJBQXFCLENBQUMsUUFBUSxFQUFFLENBQUMs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U0FBTSxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsaUJBQWlCLENBQUMsSUFBSSxPQUFPLFdBQVcsS0FBSyxRQUFRLEVBQUU7UUFDOUUsK0ZBQStGO1FBQy9GLDhDQUE4QztRQUM5QyxPQUFPLG9CQUFvQixDQUFDLGlCQUFpQixFQUFFLFdBQVcsQ0FBQztZQUN2RCxDQUFDLENBQUMsQ0FBRSxpQ0FBaUM7S0FDMUM7SUFDRCxPQUFPLEtBQUssQ0FBQztBQUNmLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiogQGxpY2Vuc2VcbiogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4qXG4qIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4qIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiovXG5cbmltcG9ydCB7S2V5VmFsdWVBcnJheSwga2V5VmFsdWVBcnJheUluZGV4T2Z9IGZyb20gJy4uLy4uL3V0aWwvYXJyYXlfdXRpbHMnO1xuaW1wb3J0IHthc3NlcnREYXRhSW5SYW5nZSwgYXNzZXJ0RXF1YWwsIGFzc2VydE5vdEVxdWFsfSBmcm9tICcuLi8uLi91dGlsL2Fzc2VydCc7XG5pbXBvcnQge2Fzc2VydEZpcnN0VXBkYXRlUGFzc30gZnJvbSAnLi4vYXNzZXJ0JztcbmltcG9ydCB7VE5vZGV9IGZyb20gJy4uL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge1RTdHlsaW5nS2V5LCBUU3R5bGluZ0tleVByaW1pdGl2ZSwgVFN0eWxpbmdSYW5nZSwgZ2V0VFN0eWxpbmdSYW5nZU5leHQsIGdldFRTdHlsaW5nUmFuZ2VQcmV2LCBzZXRUU3R5bGluZ1JhbmdlTmV4dCwgc2V0VFN0eWxpbmdSYW5nZU5leHREdXBsaWNhdGUsIHNldFRTdHlsaW5nUmFuZ2VQcmV2LCBzZXRUU3R5bGluZ1JhbmdlUHJldkR1cGxpY2F0ZSwgdG9UU3R5bGluZ1JhbmdlfSBmcm9tICcuLi9pbnRlcmZhY2VzL3N0eWxpbmcnO1xuaW1wb3J0IHtURGF0YSwgVFZJRVd9IGZyb20gJy4uL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2dldExWaWV3fSBmcm9tICcuLi9zdGF0ZSc7XG5cblxuXG4vKipcbiAqIE5PVEU6IFRoZSB3b3JkIGBzdHlsaW5nYCBpcyB1c2VkIGludGVyY2hhbmdlYWJseSBhcyBzdHlsZSBvciBjbGFzcyBzdHlsaW5nLlxuICpcbiAqIFRoaXMgZmlsZSBjb250YWlucyBjb2RlIHRvIGxpbmsgc3R5bGluZyBpbnN0cnVjdGlvbnMgdG9nZXRoZXIgc28gdGhhdCB0aGV5IGNhbiBiZSByZXBsYXllZCBpblxuICogcHJpb3JpdHkgb3JkZXIuIFRoZSBmaWxlIGV4aXN0cyBiZWNhdXNlIEl2eSBzdHlsaW5nIGluc3RydWN0aW9uIGV4ZWN1dGlvbiBvcmRlciBkb2VzIG5vdCBtYXRjaFxuICogdGhhdCBvZiB0aGUgcHJpb3JpdHkgb3JkZXIuIFRoZSBwdXJwb3NlIG9mIHRoaXMgY29kZSBpcyB0byBjcmVhdGUgYSBsaW5rZWQgbGlzdCBzbyB0aGF0IHRoZVxuICogaW5zdHJ1Y3Rpb25zIGNhbiBiZSB0cmF2ZXJzZWQgaW4gcHJpb3JpdHkgb3JkZXIgd2hlbiBjb21wdXRpbmcgdGhlIHN0eWxlcy5cbiAqXG4gKiBBc3N1bWUgd2UgYXJlIGRlYWxpbmcgd2l0aCB0aGUgZm9sbG93aW5nIGNvZGU6XG4gKiBgYGBcbiAqIEBDb21wb25lbnQoe1xuICogICB0ZW1wbGF0ZTogYFxuICogICAgIDxteS1jbXAgW3N0eWxlXT1cIiB7Y29sb3I6ICcjMDAxJ30gXCJcbiAqICAgICAgICAgICAgIFtzdHlsZS5jb2xvcl09XCIgIzAwMiBcIlxuICogICAgICAgICAgICAgZGlyLXN0eWxlLWNvbG9yLTFcbiAqICAgICAgICAgICAgIGRpci1zdHlsZS1jb2xvci0yPiBgXG4gKiB9KVxuICogY2xhc3MgRXhhbXBsZUNvbXBvbmVudCB7XG4gKiAgIHN0YXRpYyBuZ0NvbXAgPSAuLi4ge1xuICogICAgIC4uLlxuICogICAgIC8vIENvbXBpbGVyIGVuc3VyZXMgdGhhdCBgybXJtXN0eWxlUHJvcGAgaXMgYWZ0ZXIgYMm1ybVzdHlsZU1hcGBcbiAqICAgICDJtcm1c3R5bGVNYXAoe2NvbG9yOiAnIzAwMSd9KTtcbiAqICAgICDJtcm1c3R5bGVQcm9wKCdjb2xvcicsICcjMDAyJyk7XG4gKiAgICAgLi4uXG4gKiAgIH1cbiAqIH1cbiAqXG4gKiBARGlyZWN0aXZlKHtcbiAqICAgc2VsZWN0b3I6IGBbZGlyLXN0eWxlLWNvbG9yLTFdJyxcbiAqIH0pXG4gKiBjbGFzcyBTdHlsZTFEaXJlY3RpdmUge1xuICogICBASG9zdEJpbmRpbmcoJ3N0eWxlJykgc3R5bGUgPSB7Y29sb3I6ICcjMDA1J307XG4gKiAgIEBIb3N0QmluZGluZygnc3R5bGUuY29sb3InKSBjb2xvciA9ICcjMDA2JztcbiAqXG4gKiAgIHN0YXRpYyBuZ0RpciA9IC4uLiB7XG4gKiAgICAgLi4uXG4gKiAgICAgLy8gQ29tcGlsZXIgZW5zdXJlcyB0aGF0IGDJtcm1c3R5bGVQcm9wYCBpcyBhZnRlciBgybXJtXN0eWxlTWFwYFxuICogICAgIMm1ybVzdHlsZU1hcCh7Y29sb3I6ICcjMDA1J30pO1xuICogICAgIMm1ybVzdHlsZVByb3AoJ2NvbG9yJywgJyMwMDYnKTtcbiAqICAgICAuLi5cbiAqICAgfVxuICogfVxuICpcbiAqIEBEaXJlY3RpdmUoe1xuICogICBzZWxlY3RvcjogYFtkaXItc3R5bGUtY29sb3ItMl0nLFxuICogfSlcbiAqIGNsYXNzIFN0eWxlMkRpcmVjdGl2ZSB7XG4gKiAgIEBIb3N0QmluZGluZygnc3R5bGUnKSBzdHlsZSA9IHtjb2xvcjogJyMwMDcnfTtcbiAqICAgQEhvc3RCaW5kaW5nKCdzdHlsZS5jb2xvcicpIGNvbG9yID0gJyMwMDgnO1xuICpcbiAqICAgc3RhdGljIG5nRGlyID0gLi4uIHtcbiAqICAgICAuLi5cbiAqICAgICAvLyBDb21waWxlciBlbnN1cmVzIHRoYXQgYMm1ybVzdHlsZVByb3BgIGlzIGFmdGVyIGDJtcm1c3R5bGVNYXBgXG4gKiAgICAgybXJtXN0eWxlTWFwKHtjb2xvcjogJyMwMDcnfSk7XG4gKiAgICAgybXJtXN0eWxlUHJvcCgnY29sb3InLCAnIzAwOCcpO1xuICogICAgIC4uLlxuICogICB9XG4gKiB9XG4gKlxuICogQERpcmVjdGl2ZSh7XG4gKiAgIHNlbGVjdG9yOiBgbXktY21wJyxcbiAqIH0pXG4gKiBjbGFzcyBNeUNvbXBvbmVudCB7XG4gKiAgIEBIb3N0QmluZGluZygnc3R5bGUnKSBzdHlsZSA9IHtjb2xvcjogJyMwMDMnfTtcbiAqICAgQEhvc3RCaW5kaW5nKCdzdHlsZS5jb2xvcicpIGNvbG9yID0gJyMwMDQnO1xuICpcbiAqICAgc3RhdGljIG5nQ29tcCA9IC4uLiB7XG4gKiAgICAgLi4uXG4gKiAgICAgLy8gQ29tcGlsZXIgZW5zdXJlcyB0aGF0IGDJtcm1c3R5bGVQcm9wYCBpcyBhZnRlciBgybXJtXN0eWxlTWFwYFxuICogICAgIMm1ybVzdHlsZU1hcCh7Y29sb3I6ICcjMDAzJ30pO1xuICogICAgIMm1ybVzdHlsZVByb3AoJ2NvbG9yJywgJyMwMDQnKTtcbiAqICAgICAuLi5cbiAqICAgfVxuICogfVxuICogYGBgXG4gKlxuICogVGhlIE9yZGVyIG9mIGluc3RydWN0aW9uIGV4ZWN1dGlvbiBpczpcbiAqXG4gKiBOT1RFOiB0aGUgY29tbWVudCBiaW5kaW5nIGxvY2F0aW9uIGlzIGZvciBpbGx1c3RyYXRpdmUgcHVycG9zZXMgb25seS5cbiAqXG4gKiBgYGBcbiAqIC8vIFRlbXBsYXRlOiAoRXhhbXBsZUNvbXBvbmVudClcbiAqICAgICDJtcm1c3R5bGVNYXAoe2NvbG9yOiAnIzAwMSd9KTsgICAvLyBCaW5kaW5nIGluZGV4OiAxMFxuICogICAgIMm1ybVzdHlsZVByb3AoJ2NvbG9yJywgJyMwMDInKTsgIC8vIEJpbmRpbmcgaW5kZXg6IDEyXG4gKiAvLyBNeUNvbXBvbmVudFxuICogICAgIMm1ybVzdHlsZU1hcCh7Y29sb3I6ICcjMDAzJ30pOyAgIC8vIEJpbmRpbmcgaW5kZXg6IDIwXG4gKiAgICAgybXJtXN0eWxlUHJvcCgnY29sb3InLCAnIzAwNCcpOyAgLy8gQmluZGluZyBpbmRleDogMjJcbiAqIC8vIFN0eWxlMURpcmVjdGl2ZVxuICogICAgIMm1ybVzdHlsZU1hcCh7Y29sb3I6ICcjMDA1J30pOyAgIC8vIEJpbmRpbmcgaW5kZXg6IDI0XG4gKiAgICAgybXJtXN0eWxlUHJvcCgnY29sb3InLCAnIzAwNicpOyAgLy8gQmluZGluZyBpbmRleDogMjZcbiAqIC8vIFN0eWxlMkRpcmVjdGl2ZVxuICogICAgIMm1ybVzdHlsZU1hcCh7Y29sb3I6ICcjMDA3J30pOyAgIC8vIEJpbmRpbmcgaW5kZXg6IDI4XG4gKiAgICAgybXJtXN0eWxlUHJvcCgnY29sb3InLCAnIzAwOCcpOyAgLy8gQmluZGluZyBpbmRleDogMzBcbiAqIGBgYFxuICpcbiAqIFRoZSBjb3JyZWN0IHByaW9yaXR5IG9yZGVyIG9mIGNvbmNhdGVuYXRpb24gaXM6XG4gKlxuICogYGBgXG4gKiAvLyBNeUNvbXBvbmVudFxuICogICAgIMm1ybVzdHlsZU1hcCh7Y29sb3I6ICcjMDAzJ30pOyAgIC8vIEJpbmRpbmcgaW5kZXg6IDIwXG4gKiAgICAgybXJtXN0eWxlUHJvcCgnY29sb3InLCAnIzAwNCcpOyAgLy8gQmluZGluZyBpbmRleDogMjJcbiAqIC8vIFN0eWxlMURpcmVjdGl2ZVxuICogICAgIMm1ybVzdHlsZU1hcCh7Y29sb3I6ICcjMDA1J30pOyAgIC8vIEJpbmRpbmcgaW5kZXg6IDI0XG4gKiAgICAgybXJtXN0eWxlUHJvcCgnY29sb3InLCAnIzAwNicpOyAgLy8gQmluZGluZyBpbmRleDogMjZcbiAqIC8vIFN0eWxlMkRpcmVjdGl2ZVxuICogICAgIMm1ybVzdHlsZU1hcCh7Y29sb3I6ICcjMDA3J30pOyAgIC8vIEJpbmRpbmcgaW5kZXg6IDI4XG4gKiAgICAgybXJtXN0eWxlUHJvcCgnY29sb3InLCAnIzAwOCcpOyAgLy8gQmluZGluZyBpbmRleDogMzBcbiAqIC8vIFRlbXBsYXRlOiAoRXhhbXBsZUNvbXBvbmVudClcbiAqICAgICDJtcm1c3R5bGVNYXAoe2NvbG9yOiAnIzAwMSd9KTsgICAvLyBCaW5kaW5nIGluZGV4OiAxMFxuICogICAgIMm1ybVzdHlsZVByb3AoJ2NvbG9yJywgJyMwMDInKTsgIC8vIEJpbmRpbmcgaW5kZXg6IDEyXG4gKiBgYGBcbiAqXG4gKiBXaGF0IGNvbG9yIHNob3VsZCBiZSByZW5kZXJlZD9cbiAqXG4gKiBPbmNlIHRoZSBpdGVtcyBhcmUgY29ycmVjdGx5IHNvcnRlZCBpbiB0aGUgbGlzdCwgdGhlIGFuc3dlciBpcyBzaW1wbHkgdGhlIGxhc3QgaXRlbSBpbiB0aGVcbiAqIGNvbmNhdGVuYXRpb24gbGlzdCB3aGljaCBpcyBgIzAwMmAuXG4gKlxuICogVG8gZG8gc28gd2Uga2VlcCBhIGxpbmtlZCBsaXN0IG9mIGFsbCBvZiB0aGUgYmluZGluZ3Mgd2hpY2ggcGVydGFpbiB0byB0aGlzIGVsZW1lbnQuXG4gKiBOb3RpY2UgdGhhdCB0aGUgYmluZGluZ3MgYXJlIGluc2VydGVkIGluIHRoZSBvcmRlciBvZiBleGVjdXRpb24sIGJ1dCB0aGUgYFRWaWV3LmRhdGFgIGFsbG93c1xuICogdXMgdG8gdHJhdmVyc2UgdGhlbSBpbiB0aGUgb3JkZXIgb2YgcHJpb3JpdHkuXG4gKlxuICogfElkeHxgVFZpZXcuZGF0YWB8YExWaWV3YCAgICAgICAgICB8IE5vdGVzXG4gKiB8LS0tfC0tLS0tLS0tLS0tLXwtLS0tLS0tLS0tLS0tLS0tLXwtLS0tLS0tLS0tLS0tLVxuICogfC4uLnwgICAgICAgICAgICB8ICAgICAgICAgICAgICAgICB8XG4gKiB8MTAgfGBudWxsYCAgICAgIHxge2NvbG9yOiAnIzAwMSd9YHwgYMm1ybVzdHlsZU1hcCgnY29sb3InLCB7Y29sb3I6ICcjMDAxJ30pYFxuICogfDExIHxgMzAgfCAxMmAgICB8IC4uLiAgICAgICAgICAgICB8XG4gKiB8MTIgfGBjb2xvcmAgICAgIHxgJyMwMDInYCAgICAgICAgIHwgYMm1ybVzdHlsZVByb3AoJ2NvbG9yJywgJyMwMDInKWBcbiAqIHwxMyB8YDEwIHwgMGAgICAgfCAuLi4gICAgICAgICAgICAgfFxuICogfC4uLnwgICAgICAgICAgICB8ICAgICAgICAgICAgICAgICB8XG4gKiB8MjAgfGBudWxsYCAgICAgIHxge2NvbG9yOiAnIzAwMyd9YHwgYMm1ybVzdHlsZU1hcCgnY29sb3InLCB7Y29sb3I6ICcjMDAzJ30pYFxuICogfDIxIHxgMCB8IDIyYCAgICB8IC4uLiAgICAgICAgICAgICB8XG4gKiB8MjIgfGBjb2xvcmAgICAgIHxgJyMwMDQnYCAgICAgICAgIHwgYMm1ybVzdHlsZVByb3AoJ2NvbG9yJywgJyMwMDQnKWBcbiAqIHwyMyB8YDIwIHwgMjRgICAgfCAuLi4gICAgICAgICAgICAgfFxuICogfDI0IHxgbnVsbGAgICAgICB8YHtjb2xvcjogJyMwMDUnfWB8IGDJtcm1c3R5bGVNYXAoJ2NvbG9yJywge2NvbG9yOiAnIzAwNSd9KWBcbiAqIHwyNSB8YDIyIHwgMjZgICAgfCAuLi4gICAgICAgICAgICAgfFxuICogfDI2IHxgY29sb3JgICAgICB8YCcjMDA2J2AgICAgICAgICB8IGDJtcm1c3R5bGVQcm9wKCdjb2xvcicsICcjMDA2JylgXG4gKiB8MjcgfGAyNCB8IDI4YCAgIHwgLi4uICAgICAgICAgICAgIHxcbiAqIHwyOCB8YG51bGxgICAgICAgfGB7Y29sb3I6ICcjMDA3J31gfCBgybXJtXN0eWxlTWFwKCdjb2xvcicsIHtjb2xvcjogJyMwMDcnfSlgXG4gKiB8MjkgfGAyNiB8IDMwYCAgIHwgLi4uICAgICAgICAgICAgIHxcbiAqIHwzMCB8YGNvbG9yYCAgICAgfGAnIzAwOCdgICAgICAgICAgfCBgybXJtXN0eWxlUHJvcCgnY29sb3InLCAnIzAwOCcpYFxuICogfDMxIHxgMjggfCAxMGAgICB8IC4uLiAgICAgICAgICAgICB8XG4gKlxuICogVGhlIGFib3ZlIGRhdGEgc3RydWN0dXJlIGFsbG93cyB1cyB0byByZS1jb25jYXRlbmF0ZSB0aGUgc3R5bGluZyBubyBtYXR0ZXIgd2hpY2ggZGF0YSBiaW5kaW5nXG4gKiBjaGFuZ2VzLlxuICpcbiAqIE5PVEU6IGluIGFkZGl0aW9uIHRvIGtlZXBpbmcgdHJhY2sgb2YgbmV4dC9wcmV2aW91cyBpbmRleCB0aGUgYFRWaWV3LmRhdGFgIGFsc28gc3RvcmVzIHByZXYvbmV4dFxuICogZHVwbGljYXRlIGJpdC4gVGhlIGR1cGxpY2F0ZSBiaXQgaWYgdHJ1ZSBzYXlzIHRoZXJlIGVpdGhlciBpcyBhIGJpbmRpbmcgd2l0aCB0aGUgc2FtZSBuYW1lIG9yXG4gKiB0aGVyZSBpcyBhIG1hcCAod2hpY2ggbWF5IGNvbnRhaW4gdGhlIG5hbWUpLiBUaGlzIGluZm9ybWF0aW9uIGlzIHVzZWZ1bCBpbiBrbm93aW5nIGlmIG90aGVyXG4gKiBzdHlsZXMgd2l0aCBoaWdoZXIgcHJpb3JpdHkgbmVlZCB0byBiZSBzZWFyY2hlZCBmb3Igb3ZlcndyaXRlcy5cbiAqXG4gKiBOT1RFOiBTZWUgYHNob3VsZCBzdXBwb3J0IGV4YW1wbGUgaW4gJ3Rub2RlX2xpbmtlZF9saXN0LnRzJyBkb2N1bWVudGF0aW9uYCBpblxuICogYHRub2RlX2xpbmtlZF9saXN0X3NwZWMudHNgIGZvciB3b3JraW5nIGV4YW1wbGUuXG4gKi9cbmxldCBfX3VudXNlZF9jb25zdF9hc19jbG9zdXJlX2RvZXNfbm90X2xpa2Vfc3RhbmRhbG9uZV9jb21tZW50X2Jsb2Nrc19fOiB1bmRlZmluZWQ7XG5cbi8qKlxuICogSW5zZXJ0IG5ldyBgdFN0eWxlVmFsdWVgIGF0IGBURGF0YWAgYW5kIGxpbmsgZXhpc3Rpbmcgc3R5bGUgYmluZGluZ3Mgc3VjaCB0aGF0IHdlIG1haW50YWluIGxpbmtlZFxuICogbGlzdCBvZiBzdHlsZXMgYW5kIGNvbXB1dGUgdGhlIGR1cGxpY2F0ZSBmbGFnLlxuICpcbiAqIE5vdGU6IHRoaXMgZnVuY3Rpb24gaXMgZXhlY3V0ZWQgZHVyaW5nIGBmaXJzdFVwZGF0ZVBhc3NgIG9ubHkgdG8gcG9wdWxhdGUgdGhlIGBUVmlldy5kYXRhYC5cbiAqXG4gKiBUaGUgZnVuY3Rpb24gd29ya3MgYnkga2VlcGluZyB0cmFjayBvZiBgdFN0eWxpbmdSYW5nZWAgd2hpY2ggY29udGFpbnMgdHdvIHBvaW50ZXJzIHBvaW50aW5nIHRvXG4gKiB0aGUgaGVhZC90YWlsIG9mIHRoZSB0ZW1wbGF0ZSBwb3J0aW9uIG9mIHRoZSBzdHlsZXMuXG4gKiAgLSBpZiBgaXNIb3N0ID09PSBmYWxzZWAgKHdlIGFyZSB0ZW1wbGF0ZSkgdGhlbiBpbnNlcnRpb24gaXMgYXQgdGFpbCBvZiBgVFN0eWxpbmdSYW5nZWBcbiAqICAtIGlmIGBpc0hvc3QgPT09IHRydWVgICh3ZSBhcmUgaG9zdCBiaW5kaW5nKSB0aGVuIGluc2VydGlvbiBpcyBhdCBoZWFkIG9mIGBUU3R5bGluZ1JhbmdlYFxuICpcbiAqIEBwYXJhbSB0RGF0YSBUaGUgYFREYXRhYCB0byBpbnNlcnQgaW50by5cbiAqIEBwYXJhbSB0Tm9kZSBgVE5vZGVgIGFzc29jaWF0ZWQgd2l0aCB0aGUgc3R5bGluZyBlbGVtZW50LlxuICogQHBhcmFtIHRTdHlsaW5nS2V5IFNlZSBgVFN0eWxpbmdLZXlgLlxuICogQHBhcmFtIGluZGV4IGxvY2F0aW9uIG9mIHdoZXJlIGB0U3R5bGVWYWx1ZWAgc2hvdWxkIGJlIHN0b3JlZCAoYW5kIGxpbmtlZCBpbnRvIGxpc3QuKVxuICogQHBhcmFtIGlzSG9zdEJpbmRpbmcgYHRydWVgIGlmIHRoZSBpbnNlcnRpb24gaXMgZm9yIGEgYGhvc3RCaW5kaW5nYC4gKGluc2VydGlvbiBpcyBpbiBmcm9udCBvZlxuICogICAgICAgICAgICAgICB0ZW1wbGF0ZS4pXG4gKiBAcGFyYW0gaXNDbGFzc0JpbmRpbmcgVHJ1ZSBpZiB0aGUgYXNzb2NpYXRlZCBgdFN0eWxpbmdLZXlgIGFzIGEgYGNsYXNzYCBzdHlsaW5nLlxuICogICAgICAgICAgICAgICAgICAgICAgIGB0Tm9kZS5jbGFzc0JpbmRpbmdzYCBzaG91bGQgYmUgdXNlZCAob3IgYHROb2RlLnN0eWxlQmluZGluZ3NgIG90aGVyd2lzZS4pXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbnNlcnRUU3R5bGluZ0JpbmRpbmcoXG4gICAgdERhdGE6IFREYXRhLCB0Tm9kZTogVE5vZGUsIHRTdHlsaW5nS2V5V2l0aFN0YXRpYzogVFN0eWxpbmdLZXksIGluZGV4OiBudW1iZXIsXG4gICAgaXNIb3N0QmluZGluZzogYm9vbGVhbiwgaXNDbGFzc0JpbmRpbmc6IGJvb2xlYW4pOiB2b2lkIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEZpcnN0VXBkYXRlUGFzcyhnZXRMVmlldygpW1RWSUVXXSk7XG4gIGxldCB0QmluZGluZ3MgPSBpc0NsYXNzQmluZGluZyA/IHROb2RlLmNsYXNzQmluZGluZ3MgOiB0Tm9kZS5zdHlsZUJpbmRpbmdzO1xuICBsZXQgdG1wbEhlYWQgPSBnZXRUU3R5bGluZ1JhbmdlUHJldih0QmluZGluZ3MpO1xuICBsZXQgdG1wbFRhaWwgPSBnZXRUU3R5bGluZ1JhbmdlTmV4dCh0QmluZGluZ3MpO1xuXG4gIHREYXRhW2luZGV4XSA9IHRTdHlsaW5nS2V5V2l0aFN0YXRpYztcbiAgbGV0IGlzS2V5RHVwbGljYXRlT2ZTdGF0aWMgPSBmYWxzZTtcbiAgbGV0IHRTdHlsaW5nS2V5OiBUU3R5bGluZ0tleVByaW1pdGl2ZTtcbiAgaWYgKEFycmF5LmlzQXJyYXkodFN0eWxpbmdLZXlXaXRoU3RhdGljKSkge1xuICAgIC8vIFdlIGFyZSBjYXNlIHdoZW4gdGhlIGBUU3R5bGluZ0tleWAgY29udGFpbnMgc3RhdGljIGZpZWxkcyBhcyB3ZWxsLlxuICAgIGNvbnN0IHN0YXRpY0tleVZhbHVlQXJyYXkgPSB0U3R5bGluZ0tleVdpdGhTdGF0aWMgYXMgS2V5VmFsdWVBcnJheTxhbnk+O1xuICAgIHRTdHlsaW5nS2V5ID0gc3RhdGljS2V5VmFsdWVBcnJheVsxXTsgIC8vIHVud3JhcC5cbiAgICAvLyBXZSBuZWVkIHRvIGNoZWNrIGlmIG91ciBrZXkgaXMgcHJlc2VudCBpbiB0aGUgc3RhdGljIHNvIHRoYXQgd2UgY2FuIG1hcmsgaXQgYXMgZHVwbGljYXRlLlxuICAgIGlmICh0U3R5bGluZ0tleSA9PT0gbnVsbCB8fFxuICAgICAgICBrZXlWYWx1ZUFycmF5SW5kZXhPZihzdGF0aWNLZXlWYWx1ZUFycmF5LCB0U3R5bGluZ0tleSBhcyBzdHJpbmcpID4gMCkge1xuICAgICAgLy8gdFN0eWxpbmdLZXkgaXMgcHJlc2VudCBpbiB0aGUgc3RhdGljcywgbmVlZCB0byBtYXJrIGl0IGFzIGR1cGxpY2F0ZS5cbiAgICAgIGlzS2V5RHVwbGljYXRlT2ZTdGF0aWMgPSB0cnVlO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICB0U3R5bGluZ0tleSA9IHRTdHlsaW5nS2V5V2l0aFN0YXRpYztcbiAgfVxuICBpZiAoaXNIb3N0QmluZGluZykge1xuICAgIC8vIFdlIGFyZSBpbnNlcnRpbmcgaG9zdCBiaW5kaW5nc1xuXG4gICAgLy8gSWYgd2UgZG9uJ3QgaGF2ZSB0ZW1wbGF0ZSBiaW5kaW5ncyB0aGVuIGB0YWlsYCBpcyAwLlxuICAgIGNvbnN0IGhhc1RlbXBsYXRlQmluZGluZ3MgPSB0bXBsVGFpbCAhPT0gMDtcbiAgICAvLyBUaGlzIGlzIGltcG9ydGFudCB0byBrbm93IGJlY2F1c2UgdGhhdCBtZWFucyB0aGF0IHRoZSBgaGVhZGAgY2FuJ3QgcG9pbnQgdG8gdGhlIGZpcnN0XG4gICAgLy8gdGVtcGxhdGUgYmluZGluZ3MgKHRoZXJlIGFyZSBub25lLikgSW5zdGVhZCB0aGUgaGVhZCBwb2ludHMgdG8gdGhlIHRhaWwgb2YgdGhlIHRlbXBsYXRlLlxuICAgIGlmIChoYXNUZW1wbGF0ZUJpbmRpbmdzKSB7XG4gICAgICAvLyB0ZW1wbGF0ZSBoZWFkJ3MgXCJwcmV2XCIgd2lsbCBwb2ludCB0byBsYXN0IGhvc3QgYmluZGluZyBvciB0byAwIGlmIG5vIGhvc3QgYmluZGluZ3MgeWV0XG4gICAgICBjb25zdCBwcmV2aW91c05vZGUgPSBnZXRUU3R5bGluZ1JhbmdlUHJldih0RGF0YVt0bXBsSGVhZCArIDFdIGFzIFRTdHlsaW5nUmFuZ2UpO1xuICAgICAgdERhdGFbaW5kZXggKyAxXSA9IHRvVFN0eWxpbmdSYW5nZShwcmV2aW91c05vZGUsIHRtcGxIZWFkKTtcbiAgICAgIC8vIGlmIGEgaG9zdCBiaW5kaW5nIGhhcyBhbHJlYWR5IGJlZW4gcmVnaXN0ZXJlZCwgd2UgbmVlZCB0byB1cGRhdGUgdGhlIG5leHQgb2YgdGhhdCBob3N0XG4gICAgICAvLyBiaW5kaW5nIHRvIHBvaW50IHRvIHRoaXMgb25lXG4gICAgICBpZiAocHJldmlvdXNOb2RlICE9PSAwKSB7XG4gICAgICAgIC8vIFdlIG5lZWQgdG8gdXBkYXRlIHRoZSB0ZW1wbGF0ZS10YWlsIHZhbHVlIHRvIHBvaW50IHRvIHVzLlxuICAgICAgICB0RGF0YVtwcmV2aW91c05vZGUgKyAxXSA9XG4gICAgICAgICAgICBzZXRUU3R5bGluZ1JhbmdlTmV4dCh0RGF0YVtwcmV2aW91c05vZGUgKyAxXSBhcyBUU3R5bGluZ1JhbmdlLCBpbmRleCk7XG4gICAgICB9XG4gICAgICAvLyBUaGUgXCJwcmV2aW91c1wiIG9mIHRoZSB0ZW1wbGF0ZSBiaW5kaW5nIGhlYWQgc2hvdWxkIHBvaW50IHRvIHRoaXMgaG9zdCBiaW5kaW5nXG4gICAgICB0RGF0YVt0bXBsSGVhZCArIDFdID0gc2V0VFN0eWxpbmdSYW5nZVByZXYodERhdGFbdG1wbEhlYWQgKyAxXSBhcyBUU3R5bGluZ1JhbmdlLCBpbmRleCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHREYXRhW2luZGV4ICsgMV0gPSB0b1RTdHlsaW5nUmFuZ2UodG1wbEhlYWQsIDApO1xuICAgICAgLy8gaWYgYSBob3N0IGJpbmRpbmcgaGFzIGFscmVhZHkgYmVlbiByZWdpc3RlcmVkLCB3ZSBuZWVkIHRvIHVwZGF0ZSB0aGUgbmV4dCBvZiB0aGF0IGhvc3RcbiAgICAgIC8vIGJpbmRpbmcgdG8gcG9pbnQgdG8gdGhpcyBvbmVcbiAgICAgIGlmICh0bXBsSGVhZCAhPT0gMCkge1xuICAgICAgICAvLyBXZSBuZWVkIHRvIHVwZGF0ZSB0aGUgdGVtcGxhdGUtdGFpbCB2YWx1ZSB0byBwb2ludCB0byB1cy5cbiAgICAgICAgdERhdGFbdG1wbEhlYWQgKyAxXSA9IHNldFRTdHlsaW5nUmFuZ2VOZXh0KHREYXRhW3RtcGxIZWFkICsgMV0gYXMgVFN0eWxpbmdSYW5nZSwgaW5kZXgpO1xuICAgICAgfVxuICAgICAgLy8gaWYgd2UgZG9uJ3QgaGF2ZSB0ZW1wbGF0ZSwgdGhlIGhlYWQgcG9pbnRzIHRvIHRlbXBsYXRlLXRhaWwsIGFuZCBuZWVkcyB0byBiZSBhZHZhbmNlZC5cbiAgICAgIHRtcGxIZWFkID0gaW5kZXg7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIC8vIFdlIGFyZSBpbnNlcnRpbmcgaW4gdGVtcGxhdGUgc2VjdGlvbi5cbiAgICAvLyBXZSBuZWVkIHRvIHNldCB0aGlzIGJpbmRpbmcncyBcInByZXZpb3VzXCIgdG8gdGhlIGN1cnJlbnQgdGVtcGxhdGUgdGFpbFxuICAgIHREYXRhW2luZGV4ICsgMV0gPSB0b1RTdHlsaW5nUmFuZ2UodG1wbFRhaWwsIDApO1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnRFcXVhbChcbiAgICAgICAgICAgICAgICAgICAgIHRtcGxIZWFkICE9PSAwICYmIHRtcGxUYWlsID09PSAwLCBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgICdBZGRpbmcgdGVtcGxhdGUgYmluZGluZ3MgYWZ0ZXIgaG9zdEJpbmRpbmdzIGlzIG5vdCBhbGxvd2VkLicpO1xuICAgIGlmICh0bXBsSGVhZCA9PT0gMCkge1xuICAgICAgdG1wbEhlYWQgPSBpbmRleDtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gV2UgbmVlZCB0byB1cGRhdGUgdGhlIHByZXZpb3VzIHZhbHVlIFwibmV4dFwiIHRvIHBvaW50IHRvIHRoaXMgYmluZGluZ1xuICAgICAgdERhdGFbdG1wbFRhaWwgKyAxXSA9IHNldFRTdHlsaW5nUmFuZ2VOZXh0KHREYXRhW3RtcGxUYWlsICsgMV0gYXMgVFN0eWxpbmdSYW5nZSwgaW5kZXgpO1xuICAgIH1cbiAgICB0bXBsVGFpbCA9IGluZGV4O1xuICB9XG5cbiAgLy8gTm93IHdlIG5lZWQgdG8gdXBkYXRlIC8gY29tcHV0ZSB0aGUgZHVwbGljYXRlcy5cbiAgLy8gU3RhcnRpbmcgd2l0aCBvdXIgbG9jYXRpb24gc2VhcmNoIHRvd2FyZHMgaGVhZCAobGVhc3QgcHJpb3JpdHkpXG4gIGlmIChpc0tleUR1cGxpY2F0ZU9mU3RhdGljKSB7XG4gICAgdERhdGFbaW5kZXggKyAxXSA9IHNldFRTdHlsaW5nUmFuZ2VQcmV2RHVwbGljYXRlKHREYXRhW2luZGV4ICsgMV0gYXMgVFN0eWxpbmdSYW5nZSk7XG4gIH1cbiAgbWFya0R1cGxpY2F0ZXModERhdGEsIHRTdHlsaW5nS2V5LCBpbmRleCwgdHJ1ZSwgaXNDbGFzc0JpbmRpbmcpO1xuICBtYXJrRHVwbGljYXRlcyh0RGF0YSwgdFN0eWxpbmdLZXksIGluZGV4LCBmYWxzZSwgaXNDbGFzc0JpbmRpbmcpO1xuICBtYXJrRHVwbGljYXRlT2ZSZXNpZHVhbFN0eWxpbmcodE5vZGUsIHRTdHlsaW5nS2V5LCB0RGF0YSwgaW5kZXgsIGlzQ2xhc3NCaW5kaW5nKTtcblxuICB0QmluZGluZ3MgPSB0b1RTdHlsaW5nUmFuZ2UodG1wbEhlYWQsIHRtcGxUYWlsKTtcbiAgaWYgKGlzQ2xhc3NCaW5kaW5nKSB7XG4gICAgdE5vZGUuY2xhc3NCaW5kaW5ncyA9IHRCaW5kaW5ncztcbiAgfSBlbHNlIHtcbiAgICB0Tm9kZS5zdHlsZUJpbmRpbmdzID0gdEJpbmRpbmdzO1xuICB9XG59XG5cbi8qKlxuICogTG9vayBpbnRvIHRoZSByZXNpZHVhbCBzdHlsaW5nIHRvIHNlZSBpZiB0aGUgY3VycmVudCBgdFN0eWxpbmdLZXlgIGlzIGR1cGxpY2F0ZSBvZiByZXNpZHVhbC5cbiAqXG4gKiBAcGFyYW0gdE5vZGUgYFROb2RlYCB3aGVyZSB0aGUgcmVzaWR1YWwgaXMgc3RvcmVkLlxuICogQHBhcmFtIHRTdHlsaW5nS2V5IGBUU3R5bGluZ0tleWAgdG8gc3RvcmUuXG4gKiBAcGFyYW0gdERhdGEgYFREYXRhYCBhc3NvY2lhdGVkIHdpdGggdGhlIGN1cnJlbnQgYExWaWV3YC5cbiAqIEBwYXJhbSBpbmRleCBsb2NhdGlvbiBvZiB3aGVyZSBgdFN0eWxlVmFsdWVgIHNob3VsZCBiZSBzdG9yZWQgKGFuZCBsaW5rZWQgaW50byBsaXN0LilcbiAqIEBwYXJhbSBpc0NsYXNzQmluZGluZyBUcnVlIGlmIHRoZSBhc3NvY2lhdGVkIGB0U3R5bGluZ0tleWAgYXMgYSBgY2xhc3NgIHN0eWxpbmcuXG4gKiAgICAgICAgICAgICAgICAgICAgICAgYHROb2RlLmNsYXNzQmluZGluZ3NgIHNob3VsZCBiZSB1c2VkIChvciBgdE5vZGUuc3R5bGVCaW5kaW5nc2Agb3RoZXJ3aXNlLilcbiAqL1xuZnVuY3Rpb24gbWFya0R1cGxpY2F0ZU9mUmVzaWR1YWxTdHlsaW5nKFxuICAgIHROb2RlOiBUTm9kZSwgdFN0eWxpbmdLZXk6IFRTdHlsaW5nS2V5LCB0RGF0YTogVERhdGEsIGluZGV4OiBudW1iZXIsIGlzQ2xhc3NCaW5kaW5nOiBib29sZWFuKSB7XG4gIGNvbnN0IHJlc2lkdWFsID0gaXNDbGFzc0JpbmRpbmcgPyB0Tm9kZS5yZXNpZHVhbENsYXNzZXMgOiB0Tm9kZS5yZXNpZHVhbFN0eWxlcztcbiAgaWYgKHJlc2lkdWFsICE9IG51bGwgLyogb3IgdW5kZWZpbmVkICovICYmIHR5cGVvZiB0U3R5bGluZ0tleSA9PSAnc3RyaW5nJyAmJlxuICAgICAga2V5VmFsdWVBcnJheUluZGV4T2YocmVzaWR1YWwsIHRTdHlsaW5nS2V5KSA+PSAwKSB7XG4gICAgLy8gV2UgaGF2ZSBkdXBsaWNhdGUgaW4gdGhlIHJlc2lkdWFsIHNvIG1hcmsgb3Vyc2VsdmVzIGFzIGR1cGxpY2F0ZS5cbiAgICB0RGF0YVtpbmRleCArIDFdID0gc2V0VFN0eWxpbmdSYW5nZU5leHREdXBsaWNhdGUodERhdGFbaW5kZXggKyAxXSBhcyBUU3R5bGluZ1JhbmdlKTtcbiAgfVxufVxuXG5cbi8qKlxuICogTWFya3MgYFRTdHlsZVZhbHVlYHMgYXMgZHVwbGljYXRlcyBpZiBhbm90aGVyIHN0eWxlIGJpbmRpbmcgaW4gdGhlIGxpc3QgaGFzIHRoZSBzYW1lXG4gKiBgVFN0eWxlVmFsdWVgLlxuICpcbiAqIE5PVEU6IHRoaXMgZnVuY3Rpb24gaXMgaW50ZW5kZWQgdG8gYmUgY2FsbGVkIHR3aWNlIG9uY2Ugd2l0aCBgaXNQcmV2RGlyYCBzZXQgdG8gYHRydWVgIGFuZCBvbmNlXG4gKiB3aXRoIGl0IHNldCB0byBgZmFsc2VgIHRvIHNlYXJjaCBib3RoIHRoZSBwcmV2aW91cyBhcyB3ZWxsIGFzIG5leHQgaXRlbXMgaW4gdGhlIGxpc3QuXG4gKlxuICogTm8gZHVwbGljYXRlIGNhc2VcbiAqIGBgYFxuICogICBbc3R5bGUuY29sb3JdXG4gKiAgIFtzdHlsZS53aWR0aC5weF0gPDwtIGluZGV4XG4gKiAgIFtzdHlsZS5oZWlnaHQucHhdXG4gKiBgYGBcbiAqXG4gKiBJbiB0aGUgYWJvdmUgY2FzZSBhZGRpbmcgYFtzdHlsZS53aWR0aC5weF1gIHRvIHRoZSBleGlzdGluZyBgW3N0eWxlLmNvbG9yXWAgcHJvZHVjZXMgbm9cbiAqIGR1cGxpY2F0ZXMgYmVjYXVzZSBgd2lkdGhgIGlzIG5vdCBmb3VuZCBpbiBhbnkgb3RoZXIgcGFydCBvZiB0aGUgbGlua2VkIGxpc3QuXG4gKlxuICogRHVwbGljYXRlIGNhc2VcbiAqIGBgYFxuICogICBbc3R5bGUuY29sb3JdXG4gKiAgIFtzdHlsZS53aWR0aC5lbV1cbiAqICAgW3N0eWxlLndpZHRoLnB4XSA8PC0gaW5kZXhcbiAqIGBgYFxuICogSW4gdGhlIGFib3ZlIGNhc2UgYWRkaW5nIGBbc3R5bGUud2lkdGgucHhdYCB3aWxsIHByb2R1Y2UgYSBkdXBsaWNhdGUgd2l0aCBgW3N0eWxlLndpZHRoLmVtXWBcbiAqIGJlY2F1c2UgYHdpZHRoYCBpcyBmb3VuZCBpbiB0aGUgY2hhaW4uXG4gKlxuICogTWFwIGNhc2UgMVxuICogYGBgXG4gKiAgIFtzdHlsZS53aWR0aC5weF1cbiAqICAgW3N0eWxlLmNvbG9yXVxuICogICBbc3R5bGVdICA8PC0gaW5kZXhcbiAqIGBgYFxuICogSW4gdGhlIGFib3ZlIGNhc2UgYWRkaW5nIGBbc3R5bGVdYCB3aWxsIHByb2R1Y2UgYSBkdXBsaWNhdGUgd2l0aCBhbnkgb3RoZXIgYmluZGluZ3MgYmVjYXVzZVxuICogYFtzdHlsZV1gIGlzIGEgTWFwIGFuZCBhcyBzdWNoIGlzIGZ1bGx5IGR5bmFtaWMgYW5kIGNvdWxkIHByb2R1Y2UgYGNvbG9yYCBvciBgd2lkdGhgLlxuICpcbiAqIE1hcCBjYXNlIDJcbiAqIGBgYFxuICogICBbc3R5bGVdXG4gKiAgIFtzdHlsZS53aWR0aC5weF1cbiAqICAgW3N0eWxlLmNvbG9yXSAgPDwtIGluZGV4XG4gKiBgYGBcbiAqIEluIHRoZSBhYm92ZSBjYXNlIGFkZGluZyBgW3N0eWxlLmNvbG9yXWAgd2lsbCBwcm9kdWNlIGEgZHVwbGljYXRlIGJlY2F1c2UgdGhlcmUgaXMgYWxyZWFkeSBhXG4gKiBgW3N0eWxlXWAgYmluZGluZyB3aGljaCBpcyBhIE1hcCBhbmQgYXMgc3VjaCBpcyBmdWxseSBkeW5hbWljIGFuZCBjb3VsZCBwcm9kdWNlIGBjb2xvcmAgb3JcbiAqIGB3aWR0aGAuXG4gKlxuICogTk9URTogT25jZSBgW3N0eWxlXWAgKE1hcCkgaXMgYWRkZWQgaW50byB0aGUgc3lzdGVtIGFsbCB0aGluZ3MgYXJlIG1hcHBlZCBhcyBkdXBsaWNhdGVzLlxuICogTk9URTogV2UgdXNlIGBzdHlsZWAgYXMgZXhhbXBsZSwgYnV0IHNhbWUgbG9naWMgaXMgYXBwbGllZCB0byBgY2xhc3NgZXMgYXMgd2VsbC5cbiAqXG4gKiBAcGFyYW0gdERhdGEgYFREYXRhYCB3aGVyZSB0aGUgbGlua2VkIGxpc3QgaXMgc3RvcmVkLlxuICogQHBhcmFtIHRTdHlsaW5nS2V5IGBUU3R5bGluZ0tleVByaW1pdGl2ZWAgd2hpY2ggY29udGFpbnMgdGhlIHZhbHVlIHRvIGNvbXBhcmUgdG8gb3RoZXIga2V5cyBpblxuICogICAgICAgIHRoZSBsaW5rZWQgbGlzdC5cbiAqIEBwYXJhbSBpbmRleCBTdGFydGluZyBsb2NhdGlvbiBpbiB0aGUgbGlua2VkIGxpc3QgdG8gc2VhcmNoIGZyb21cbiAqIEBwYXJhbSBpc1ByZXZEaXIgRGlyZWN0aW9uLlxuICogICAgICAgIC0gYHRydWVgIGZvciBwcmV2aW91cyAobG93ZXIgcHJpb3JpdHkpO1xuICogICAgICAgIC0gYGZhbHNlYCBmb3IgbmV4dCAoaGlnaGVyIHByaW9yaXR5KS5cbiAqL1xuZnVuY3Rpb24gbWFya0R1cGxpY2F0ZXMoXG4gICAgdERhdGE6IFREYXRhLCB0U3R5bGluZ0tleTogVFN0eWxpbmdLZXlQcmltaXRpdmUsIGluZGV4OiBudW1iZXIsIGlzUHJldkRpcjogYm9vbGVhbixcbiAgICBpc0NsYXNzQmluZGluZzogYm9vbGVhbikge1xuICBjb25zdCB0U3R5bGluZ0F0SW5kZXggPSB0RGF0YVtpbmRleCArIDFdIGFzIFRTdHlsaW5nUmFuZ2U7XG4gIGNvbnN0IGlzTWFwID0gdFN0eWxpbmdLZXkgPT09IG51bGw7XG4gIGxldCBjdXJzb3IgPVxuICAgICAgaXNQcmV2RGlyID8gZ2V0VFN0eWxpbmdSYW5nZVByZXYodFN0eWxpbmdBdEluZGV4KSA6IGdldFRTdHlsaW5nUmFuZ2VOZXh0KHRTdHlsaW5nQXRJbmRleCk7XG4gIGxldCBmb3VuZER1cGxpY2F0ZSA9IGZhbHNlO1xuICAvLyBXZSBrZWVwIGl0ZXJhdGluZyBhcyBsb25nIGFzIHdlIGhhdmUgYSBjdXJzb3JcbiAgLy8gQU5EIGVpdGhlcjpcbiAgLy8gLSB3ZSBmb3VuZCB3aGF0IHdlIGFyZSBsb29raW5nIGZvciwgT1JcbiAgLy8gLSB3ZSBhcmUgYSBtYXAgaW4gd2hpY2ggY2FzZSB3ZSBoYXZlIHRvIGNvbnRpbnVlIHNlYXJjaGluZyBldmVuIGFmdGVyIHdlIGZpbmQgd2hhdCB3ZSB3ZXJlXG4gIC8vICAgbG9va2luZyBmb3Igc2luY2Ugd2UgYXJlIGEgd2lsZCBjYXJkIGFuZCBldmVyeXRoaW5nIG5lZWRzIHRvIGJlIGZsaXBwZWQgdG8gZHVwbGljYXRlLlxuICB3aGlsZSAoY3Vyc29yICE9PSAwICYmIChmb3VuZER1cGxpY2F0ZSA9PT0gZmFsc2UgfHwgaXNNYXApKSB7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydERhdGFJblJhbmdlKHREYXRhLCBjdXJzb3IpO1xuICAgIGNvbnN0IHRTdHlsaW5nVmFsdWVBdEN1cnNvciA9IHREYXRhW2N1cnNvcl0gYXMgVFN0eWxpbmdLZXk7XG4gICAgY29uc3QgdFN0eWxlUmFuZ2VBdEN1cnNvciA9IHREYXRhW2N1cnNvciArIDFdIGFzIFRTdHlsaW5nUmFuZ2U7XG4gICAgaWYgKGlzU3R5bGluZ01hdGNoKHRTdHlsaW5nVmFsdWVBdEN1cnNvciwgdFN0eWxpbmdLZXkpKSB7XG4gICAgICBmb3VuZER1cGxpY2F0ZSA9IHRydWU7XG4gICAgICB0RGF0YVtjdXJzb3IgKyAxXSA9IGlzUHJldkRpciA/IHNldFRTdHlsaW5nUmFuZ2VOZXh0RHVwbGljYXRlKHRTdHlsZVJhbmdlQXRDdXJzb3IpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0VFN0eWxpbmdSYW5nZVByZXZEdXBsaWNhdGUodFN0eWxlUmFuZ2VBdEN1cnNvcik7XG4gICAgfVxuICAgIGN1cnNvciA9IGlzUHJldkRpciA/IGdldFRTdHlsaW5nUmFuZ2VQcmV2KHRTdHlsZVJhbmdlQXRDdXJzb3IpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICBnZXRUU3R5bGluZ1JhbmdlTmV4dCh0U3R5bGVSYW5nZUF0Q3Vyc29yKTtcbiAgfVxuICBpZiAoZm91bmREdXBsaWNhdGUpIHtcbiAgICAvLyBpZiB3ZSBmb3VuZCBhIGR1cGxpY2F0ZSwgdGhhbiBtYXJrIG91cnNlbHZlcy5cbiAgICB0RGF0YVtpbmRleCArIDFdID0gaXNQcmV2RGlyID8gc2V0VFN0eWxpbmdSYW5nZVByZXZEdXBsaWNhdGUodFN0eWxpbmdBdEluZGV4KSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldFRTdHlsaW5nUmFuZ2VOZXh0RHVwbGljYXRlKHRTdHlsaW5nQXRJbmRleCk7XG4gIH1cbn1cblxuLyoqXG4gKiBEZXRlcm1pbmVzIGlmIHR3byBgVFN0eWxpbmdLZXlgcyBhcmUgYSBtYXRjaC5cbiAqXG4gKiBXaGVuIGNvbXB1dGluZyB3ZWF0aGVyIGEgYmluZGluZyBjb250YWlucyBhIGR1cGxpY2F0ZSwgd2UgbmVlZCB0byBjb21wYXJlIGlmIHRoZSBpbnN0cnVjdGlvblxuICogYFRTdHlsaW5nS2V5YCBoYXMgYSBtYXRjaC5cbiAqXG4gKiBIZXJlIGFyZSBleGFtcGxlcyBvZiBgVFN0eWxpbmdLZXlgcyB3aGljaCBtYXRjaCBnaXZlbiBgdFN0eWxpbmdLZXlDdXJzb3JgIGlzOlxuICogLSBgY29sb3JgXG4gKiAgICAtIGBjb2xvcmAgICAgLy8gTWF0Y2ggYW5vdGhlciBjb2xvclxuICogICAgLSBgbnVsbGAgICAgIC8vIFRoYXQgbWVhbnMgdGhhdCBgdFN0eWxpbmdLZXlgIGlzIGEgYGNsYXNzTWFwYC9gc3R5bGVNYXBgIGluc3RydWN0aW9uXG4gKiAgICAtIGBbJycsICdjb2xvcicsICdvdGhlcicsIHRydWVdYCAvLyB3cmFwcGVkIGBjb2xvcmAgc28gbWF0Y2hcbiAqICAgIC0gYFsnJywgbnVsbCwgJ290aGVyJywgdHJ1ZV1gICAgICAgIC8vIHdyYXBwZWQgYG51bGxgIHNvIG1hdGNoXG4gKiAgICAtIGBbJycsICd3aWR0aCcsICdjb2xvcicsICd2YWx1ZSddYCAvLyB3cmFwcGVkIHN0YXRpYyB2YWx1ZSBjb250YWlucyBhIG1hdGNoIG9uIGAnY29sb3InYFxuICogLSBgbnVsbGAgICAgICAgLy8gYHRTdHlsaW5nS2V5Q3Vyc29yYCBhbHdheXMgbWF0Y2ggYXMgaXQgaXMgYGNsYXNzTWFwYC9gc3R5bGVNYXBgIGluc3RydWN0aW9uXG4gKlxuICogQHBhcmFtIHRTdHlsaW5nS2V5Q3Vyc29yXG4gKiBAcGFyYW0gdFN0eWxpbmdLZXlcbiAqL1xuZnVuY3Rpb24gaXNTdHlsaW5nTWF0Y2godFN0eWxpbmdLZXlDdXJzb3I6IFRTdHlsaW5nS2V5LCB0U3R5bGluZ0tleTogVFN0eWxpbmdLZXlQcmltaXRpdmUpIHtcbiAgbmdEZXZNb2RlICYmXG4gICAgICBhc3NlcnROb3RFcXVhbChcbiAgICAgICAgICBBcnJheS5pc0FycmF5KHRTdHlsaW5nS2V5KSwgdHJ1ZSwgJ0V4cGVjdGVkIHRoYXQgXFwndFN0eWxpbmdLZXlcXCcgaGFzIGJlZW4gdW53cmFwcGVkJyk7XG4gIGlmICh0U3R5bGluZ0tleUN1cnNvciA9PT0gbnVsbCB8fCAgLy8gSWYgdGhlIGN1cnNvciBpcyBgbnVsbGAgaXQgbWVhbnMgdGhhdCB3ZSBoYXZlIG1hcCBhdCB0aGF0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gbG9jYXRpb24gc28gd2UgbXVzdCBhc3N1bWUgdGhhdCB3ZSBoYXZlIGEgbWF0Y2guXG4gICAgICB0U3R5bGluZ0tleSA9PSBudWxsIHx8ICAvLyBJZiBgdFN0eWxpbmdLZXlgIGlzIGBudWxsYCB0aGVuIGl0IGlzIGEgbWFwIHRoZXJlZm9yIGFzc3VtZSB0aGF0IGl0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBjb250YWlucyBhIG1hdGNoLlxuICAgICAgKEFycmF5LmlzQXJyYXkodFN0eWxpbmdLZXlDdXJzb3IpID8gdFN0eWxpbmdLZXlDdXJzb3JbMV0gOiB0U3R5bGluZ0tleUN1cnNvcikgPT09XG4gICAgICAgICAgdFN0eWxpbmdLZXkgIC8vIElmIHRoZSBrZXlzIG1hdGNoIGV4cGxpY2l0bHkgdGhhbiB3ZSBhcmUgYSBtYXRjaC5cbiAgICAgICkge1xuICAgIHJldHVybiB0cnVlO1xuICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkodFN0eWxpbmdLZXlDdXJzb3IpICYmIHR5cGVvZiB0U3R5bGluZ0tleSA9PT0gJ3N0cmluZycpIHtcbiAgICAvLyBpZiB3ZSBkaWQgbm90IGZpbmQgYSBtYXRjaCwgYnV0IGB0U3R5bGluZ0tleUN1cnNvcmAgaXMgYEtleVZhbHVlQXJyYXlgIHRoYXQgbWVhbnMgY3Vyc29yIGhhc1xuICAgIC8vIHN0YXRpY3MgYW5kIHdlIG5lZWQgdG8gY2hlY2sgdGhvc2UgYXMgd2VsbC5cbiAgICByZXR1cm4ga2V5VmFsdWVBcnJheUluZGV4T2YodFN0eWxpbmdLZXlDdXJzb3IsIHRTdHlsaW5nS2V5KSA+PVxuICAgICAgICAwOyAgLy8gc2VlIGlmIHdlIGFyZSBtYXRjaGluZyB0aGUga2V5XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuIl19