/**
 * @fileoverview added by tsickle
 * Generated from: packages/core/src/render3/styling/style_binding_list.ts
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
* @license
* Copyright Google Inc. All Rights Reserved.
*
* Use of this source code is governed by an MIT-style license that can be
* found in the LICENSE file at https://angular.io/license
*/
import { assertEqual } from '../../util/assert';
import { assertFirstUpdatePass } from '../assert';
import { getTStylingRangeNext, getTStylingRangePrev, setTStylingRangeNext, setTStylingRangeNextDuplicate, setTStylingRangePrev, setTStylingRangePrevDuplicate, toTStylingRange } from '../interfaces/styling';
import { TVIEW } from '../interfaces/view';
import { getLView } from '../state';
import { getLastParsedKey, parseClassName, parseClassNameNext, parseStyle, parseStyleNext } from './styling_parser';
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
 * \@Component({
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
 * \@Directive({
 *   selector: `[dir-style-color-1]',
 * })
 * class Style1Directive {
 * \@HostBinding('style') style = {color: '#005'};
 * \@HostBinding('style.color') color = '#006';
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
 * \@Directive({
 *   selector: `[dir-style-color-2]',
 * })
 * class Style2Directive {
 * \@HostBinding('style') style = {color: '#007'};
 * \@HostBinding('style.color') color = '#008';
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
 * \@Directive({
 *   selector: `my-cmp',
 * })
 * class MyComponent {
 * \@HostBinding('style') style = {color: '#003'};
 * \@HostBinding('style.color') color = '#004';
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
 * @type {?}
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
 * @param {?} tData The `TData` to insert into.
 * @param {?} tNode `TNode` associated with the styling element.
 * @param {?} tStylingKey See `TStylingKey`.
 * @param {?} index location of where `tStyleValue` should be stored (and linked into list.)
 * @param {?} isHostBinding `true` if the insertion is for a `hostBinding`. (insertion is in front of
 *               template.)
 * @param {?} isClassBinding True if the associated `tStylingKey` as a `class` styling.
 *                       `tNode.classBindings` should be used (or `tNode.styleBindings` otherwise.)
 * @return {?}
 */
export function insertTStylingBinding(tData, tNode, tStylingKey, index, isHostBinding, isClassBinding) {
    ngDevMode && assertFirstUpdatePass(getLView()[TVIEW]);
    /** @type {?} */
    let tBindings = isClassBinding ? tNode.classBindings : tNode.styleBindings;
    /** @type {?} */
    let tmplHead = getTStylingRangePrev(tBindings);
    /** @type {?} */
    let tmplTail = getTStylingRangeNext(tBindings);
    tData[index] = tStylingKey;
    if (isHostBinding) {
        // We are inserting host bindings
        // If we don't have template bindings then `tail` is 0.
        /** @type {?} */
        const hasTemplateBindings = tmplTail !== 0;
        // This is important to know because that means that the `head` can't point to the first
        // template bindings (there are none.) Instead the head points to the tail of the template.
        if (hasTemplateBindings) {
            // template head's "prev" will point to last host binding or to 0 if no host bindings yet
            /** @type {?} */
            const previousNode = getTStylingRangePrev((/** @type {?} */ (tData[tmplHead + 1])));
            tData[index + 1] = toTStylingRange(previousNode, tmplHead);
            // if a host binding has already been registered, we need to update the next of that host
            // binding to point to this one
            if (previousNode !== 0) {
                // We need to update the template-tail value to point to us.
                tData[previousNode + 1] =
                    setTStylingRangeNext((/** @type {?} */ (tData[previousNode + 1])), index);
            }
            // The "previous" of the template binding head should point to this host binding
            tData[tmplHead + 1] = setTStylingRangePrev((/** @type {?} */ (tData[tmplHead + 1])), index);
        }
        else {
            tData[index + 1] = toTStylingRange(tmplHead, 0);
            // if a host binding has already been registered, we need to update the next of that host
            // binding to point to this one
            if (tmplHead !== 0) {
                // We need to update the template-tail value to point to us.
                tData[tmplHead + 1] = setTStylingRangeNext((/** @type {?} */ (tData[tmplHead + 1])), index);
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
            tData[tmplTail + 1] = setTStylingRangeNext((/** @type {?} */ (tData[tmplTail + 1])), index);
        }
        tmplTail = index;
    }
    // Now we need to update / compute the duplicates.
    // Starting with our location search towards head (least priority)
    markDuplicates(tData, tStylingKey, index, (isClassBinding ? tNode.classes : tNode.styles) || '', true, isClassBinding);
    markDuplicates(tData, tStylingKey, index, '', false, isClassBinding);
    tBindings = toTStylingRange(tmplHead, tmplTail);
    if (isClassBinding) {
        tNode.classBindings = tBindings;
    }
    else {
        tNode.styleBindings = tBindings;
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
 * @param {?} tData
 * @param {?} tStylingKey
 * @param {?} index
 * @param {?} staticValues
 * @param {?} isPrevDir
 * @param {?} isClassBinding
 * @return {?}
 */
function markDuplicates(tData, tStylingKey, index, staticValues, isPrevDir, isClassBinding) {
    /** @type {?} */
    const tStylingAtIndex = (/** @type {?} */ (tData[index + 1]));
    /** @type {?} */
    const isMap = tStylingKey === null;
    /** @type {?} */
    let cursor = isPrevDir ? getTStylingRangePrev(tStylingAtIndex) : getTStylingRangeNext(tStylingAtIndex);
    /** @type {?} */
    let foundDuplicate = false;
    // We keep iterating as long as we have a cursor
    // AND either: We found what we are looking for, or we are a map in which case we have to
    // continue searching even after we find what we were looking for since we are a wild card
    // and everything needs to be flipped to duplicate.
    while (cursor !== 0 && (foundDuplicate === false || isMap)) {
        /** @type {?} */
        const tStylingValueAtCursor = (/** @type {?} */ (tData[cursor]));
        /** @type {?} */
        const tStyleRangeAtCursor = (/** @type {?} */ (tData[cursor + 1]));
        if (tStylingValueAtCursor === null || tStylingKey == null ||
            tStylingValueAtCursor === tStylingKey) {
            foundDuplicate = true;
            tData[cursor + 1] = isPrevDir ? setTStylingRangeNextDuplicate(tStyleRangeAtCursor) :
                setTStylingRangePrevDuplicate(tStyleRangeAtCursor);
        }
        cursor = isPrevDir ? getTStylingRangePrev(tStyleRangeAtCursor) :
            getTStylingRangeNext(tStyleRangeAtCursor);
    }
    // We also need to process the static values.
    if (staticValues !== '' && // If we have static values to search
        !foundDuplicate // If we have duplicate don't bother since we are already marked as
    // duplicate
    ) {
        if (isMap) {
            // if we are a Map (and we have statics) we must assume duplicate
            foundDuplicate = true;
        }
        else if (staticValues != null) {
            // If we found non-map then we iterate over its keys to determine if any of them match ours
            // If we find a match than we mark it as duplicate.
            for (let i = isClassBinding ? parseClassName(staticValues) : parseStyle(staticValues); //
             i >= 0; //
             i = isClassBinding ? parseClassNameNext(staticValues, i) :
                parseStyleNext(staticValues, i)) {
                if (getLastParsedKey(staticValues) === tStylingKey) {
                    foundDuplicate = true;
                    break;
                }
            }
        }
    }
    if (foundDuplicate) {
        // if we found a duplicate, than mark ourselves.
        tData[index + 1] = isPrevDir ? setTStylingRangePrevDuplicate(tStylingAtIndex) :
            setTStylingRangeNextDuplicate(tStylingAtIndex);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3R5bGVfYmluZGluZ19saXN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9zdHlsaW5nL3N0eWxlX2JpbmRpbmdfbGlzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFRQSxPQUFPLEVBQUMsV0FBVyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDOUMsT0FBTyxFQUFDLHFCQUFxQixFQUFDLE1BQU0sV0FBVyxDQUFDO0FBRWhELE9BQU8sRUFBNkIsb0JBQW9CLEVBQUUsb0JBQW9CLEVBQUUsb0JBQW9CLEVBQUUsNkJBQTZCLEVBQUUsb0JBQW9CLEVBQUUsNkJBQTZCLEVBQUUsZUFBZSxFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDeE8sT0FBTyxFQUFRLEtBQUssRUFBQyxNQUFNLG9CQUFvQixDQUFDO0FBQ2hELE9BQU8sRUFBQyxRQUFRLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDbEMsT0FBTyxFQUFDLGdCQUFnQixFQUFFLGNBQWMsRUFBRSxrQkFBa0IsRUFBRSxVQUFVLEVBQUUsY0FBYyxFQUFDLE1BQU0sa0JBQWtCLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBNEo5RyxtRUFBOEU7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFzQmxGLE1BQU0sVUFBVSxxQkFBcUIsQ0FDakMsS0FBWSxFQUFFLEtBQVksRUFBRSxXQUF3QixFQUFFLEtBQWEsRUFBRSxhQUFzQixFQUMzRixjQUF1QjtJQUN6QixTQUFTLElBQUkscUJBQXFCLENBQUMsUUFBUSxFQUFFLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FB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Q0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDO1lBQ2hELDZCQUE2QixDQUFDLGVBQWUsQ0FBQyxDQUFDO0tBQy9FO0FBQ0gsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuKiBAbGljZW5zZVxuKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbipcbiogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuKi9cblxuaW1wb3J0IHthc3NlcnRFcXVhbH0gZnJvbSAnLi4vLi4vdXRpbC9hc3NlcnQnO1xuaW1wb3J0IHthc3NlcnRGaXJzdFVwZGF0ZVBhc3N9IGZyb20gJy4uL2Fzc2VydCc7XG5pbXBvcnQge1ROb2RlfSBmcm9tICcuLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtUU3R5bGluZ0tleSwgVFN0eWxpbmdSYW5nZSwgZ2V0VFN0eWxpbmdSYW5nZU5leHQsIGdldFRTdHlsaW5nUmFuZ2VQcmV2LCBzZXRUU3R5bGluZ1JhbmdlTmV4dCwgc2V0VFN0eWxpbmdSYW5nZU5leHREdXBsaWNhdGUsIHNldFRTdHlsaW5nUmFuZ2VQcmV2LCBzZXRUU3R5bGluZ1JhbmdlUHJldkR1cGxpY2F0ZSwgdG9UU3R5bGluZ1JhbmdlfSBmcm9tICcuLi9pbnRlcmZhY2VzL3N0eWxpbmcnO1xuaW1wb3J0IHtURGF0YSwgVFZJRVd9IGZyb20gJy4uL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2dldExWaWV3fSBmcm9tICcuLi9zdGF0ZSc7XG5pbXBvcnQge2dldExhc3RQYXJzZWRLZXksIHBhcnNlQ2xhc3NOYW1lLCBwYXJzZUNsYXNzTmFtZU5leHQsIHBhcnNlU3R5bGUsIHBhcnNlU3R5bGVOZXh0fSBmcm9tICcuL3N0eWxpbmdfcGFyc2VyJztcblxuXG4vKipcbiAqIE5PVEU6IFRoZSB3b3JkIGBzdHlsaW5nYCBpcyB1c2VkIGludGVyY2hhbmdlYWJseSBhcyBzdHlsZSBvciBjbGFzcyBzdHlsaW5nLlxuICpcbiAqIFRoaXMgZmlsZSBjb250YWlucyBjb2RlIHRvIGxpbmsgc3R5bGluZyBpbnN0cnVjdGlvbnMgdG9nZXRoZXIgc28gdGhhdCB0aGV5IGNhbiBiZSByZXBsYXllZCBpblxuICogcHJpb3JpdHkgb3JkZXIuIFRoZSBmaWxlIGV4aXN0cyBiZWNhdXNlIEl2eSBzdHlsaW5nIGluc3RydWN0aW9uIGV4ZWN1dGlvbiBvcmRlciBkb2VzIG5vdCBtYXRjaFxuICogdGhhdCBvZiB0aGUgcHJpb3JpdHkgb3JkZXIuIFRoZSBwdXJwb3NlIG9mIHRoaXMgY29kZSBpcyB0byBjcmVhdGUgYSBsaW5rZWQgbGlzdCBzbyB0aGF0IHRoZVxuICogaW5zdHJ1Y3Rpb25zIGNhbiBiZSB0cmF2ZXJzZWQgaW4gcHJpb3JpdHkgb3JkZXIgd2hlbiBjb21wdXRpbmcgdGhlIHN0eWxlcy5cbiAqXG4gKiBBc3N1bWUgd2UgYXJlIGRlYWxpbmcgd2l0aCB0aGUgZm9sbG93aW5nIGNvZGU6XG4gKiBgYGBcbiAqIEBDb21wb25lbnQoe1xuICogICB0ZW1wbGF0ZTogYFxuICogICAgIDxteS1jbXAgW3N0eWxlXT1cIiB7Y29sb3I6ICcjMDAxJ30gXCJcbiAqICAgICAgICAgICAgIFtzdHlsZS5jb2xvcl09XCIgIzAwMiBcIlxuICogICAgICAgICAgICAgZGlyLXN0eWxlLWNvbG9yLTFcbiAqICAgICAgICAgICAgIGRpci1zdHlsZS1jb2xvci0yPiBgXG4gKiB9KVxuICogY2xhc3MgRXhhbXBsZUNvbXBvbmVudCB7XG4gKiAgIHN0YXRpYyBuZ0NvbXAgPSAuLi4ge1xuICogICAgIC4uLlxuICogICAgIC8vIENvbXBpbGVyIGVuc3VyZXMgdGhhdCBgybXJtXN0eWxlUHJvcGAgaXMgYWZ0ZXIgYMm1ybVzdHlsZU1hcGBcbiAqICAgICDJtcm1c3R5bGVNYXAoe2NvbG9yOiAnIzAwMSd9KTtcbiAqICAgICDJtcm1c3R5bGVQcm9wKCdjb2xvcicsICcjMDAyJyk7XG4gKiAgICAgLi4uXG4gKiAgIH1cbiAqIH1cbiAqXG4gKiBARGlyZWN0aXZlKHtcbiAqICAgc2VsZWN0b3I6IGBbZGlyLXN0eWxlLWNvbG9yLTFdJyxcbiAqIH0pXG4gKiBjbGFzcyBTdHlsZTFEaXJlY3RpdmUge1xuICogICBASG9zdEJpbmRpbmcoJ3N0eWxlJykgc3R5bGUgPSB7Y29sb3I6ICcjMDA1J307XG4gKiAgIEBIb3N0QmluZGluZygnc3R5bGUuY29sb3InKSBjb2xvciA9ICcjMDA2JztcbiAqXG4gKiAgIHN0YXRpYyBuZ0RpciA9IC4uLiB7XG4gKiAgICAgLi4uXG4gKiAgICAgLy8gQ29tcGlsZXIgZW5zdXJlcyB0aGF0IGDJtcm1c3R5bGVQcm9wYCBpcyBhZnRlciBgybXJtXN0eWxlTWFwYFxuICogICAgIMm1ybVzdHlsZU1hcCh7Y29sb3I6ICcjMDA1J30pO1xuICogICAgIMm1ybVzdHlsZVByb3AoJ2NvbG9yJywgJyMwMDYnKTtcbiAqICAgICAuLi5cbiAqICAgfVxuICogfVxuICpcbiAqIEBEaXJlY3RpdmUoe1xuICogICBzZWxlY3RvcjogYFtkaXItc3R5bGUtY29sb3ItMl0nLFxuICogfSlcbiAqIGNsYXNzIFN0eWxlMkRpcmVjdGl2ZSB7XG4gKiAgIEBIb3N0QmluZGluZygnc3R5bGUnKSBzdHlsZSA9IHtjb2xvcjogJyMwMDcnfTtcbiAqICAgQEhvc3RCaW5kaW5nKCdzdHlsZS5jb2xvcicpIGNvbG9yID0gJyMwMDgnO1xuICpcbiAqICAgc3RhdGljIG5nRGlyID0gLi4uIHtcbiAqICAgICAuLi5cbiAqICAgICAvLyBDb21waWxlciBlbnN1cmVzIHRoYXQgYMm1ybVzdHlsZVByb3BgIGlzIGFmdGVyIGDJtcm1c3R5bGVNYXBgXG4gKiAgICAgybXJtXN0eWxlTWFwKHtjb2xvcjogJyMwMDcnfSk7XG4gKiAgICAgybXJtXN0eWxlUHJvcCgnY29sb3InLCAnIzAwOCcpO1xuICogICAgIC4uLlxuICogICB9XG4gKiB9XG4gKlxuICogQERpcmVjdGl2ZSh7XG4gKiAgIHNlbGVjdG9yOiBgbXktY21wJyxcbiAqIH0pXG4gKiBjbGFzcyBNeUNvbXBvbmVudCB7XG4gKiAgIEBIb3N0QmluZGluZygnc3R5bGUnKSBzdHlsZSA9IHtjb2xvcjogJyMwMDMnfTtcbiAqICAgQEhvc3RCaW5kaW5nKCdzdHlsZS5jb2xvcicpIGNvbG9yID0gJyMwMDQnO1xuICpcbiAqICAgc3RhdGljIG5nQ29tcCA9IC4uLiB7XG4gKiAgICAgLi4uXG4gKiAgICAgLy8gQ29tcGlsZXIgZW5zdXJlcyB0aGF0IGDJtcm1c3R5bGVQcm9wYCBpcyBhZnRlciBgybXJtXN0eWxlTWFwYFxuICogICAgIMm1ybVzdHlsZU1hcCh7Y29sb3I6ICcjMDAzJ30pO1xuICogICAgIMm1ybVzdHlsZVByb3AoJ2NvbG9yJywgJyMwMDQnKTtcbiAqICAgICAuLi5cbiAqICAgfVxuICogfVxuICogYGBgXG4gKlxuICogVGhlIE9yZGVyIG9mIGluc3RydWN0aW9uIGV4ZWN1dGlvbiBpczpcbiAqXG4gKiBOT1RFOiB0aGUgY29tbWVudCBiaW5kaW5nIGxvY2F0aW9uIGlzIGZvciBpbGx1c3RyYXRpdmUgcHVycG9zZXMgb25seS5cbiAqXG4gKiBgYGBcbiAqIC8vIFRlbXBsYXRlOiAoRXhhbXBsZUNvbXBvbmVudClcbiAqICAgICDJtcm1c3R5bGVNYXAoe2NvbG9yOiAnIzAwMSd9KTsgICAvLyBCaW5kaW5nIGluZGV4OiAxMFxuICogICAgIMm1ybVzdHlsZVByb3AoJ2NvbG9yJywgJyMwMDInKTsgIC8vIEJpbmRpbmcgaW5kZXg6IDEyXG4gKiAvLyBNeUNvbXBvbmVudFxuICogICAgIMm1ybVzdHlsZU1hcCh7Y29sb3I6ICcjMDAzJ30pOyAgIC8vIEJpbmRpbmcgaW5kZXg6IDIwXG4gKiAgICAgybXJtXN0eWxlUHJvcCgnY29sb3InLCAnIzAwNCcpOyAgLy8gQmluZGluZyBpbmRleDogMjJcbiAqIC8vIFN0eWxlMURpcmVjdGl2ZVxuICogICAgIMm1ybVzdHlsZU1hcCh7Y29sb3I6ICcjMDA1J30pOyAgIC8vIEJpbmRpbmcgaW5kZXg6IDI0XG4gKiAgICAgybXJtXN0eWxlUHJvcCgnY29sb3InLCAnIzAwNicpOyAgLy8gQmluZGluZyBpbmRleDogMjZcbiAqIC8vIFN0eWxlMkRpcmVjdGl2ZVxuICogICAgIMm1ybVzdHlsZU1hcCh7Y29sb3I6ICcjMDA3J30pOyAgIC8vIEJpbmRpbmcgaW5kZXg6IDI4XG4gKiAgICAgybXJtXN0eWxlUHJvcCgnY29sb3InLCAnIzAwOCcpOyAgLy8gQmluZGluZyBpbmRleDogMzBcbiAqIGBgYFxuICpcbiAqIFRoZSBjb3JyZWN0IHByaW9yaXR5IG9yZGVyIG9mIGNvbmNhdGVuYXRpb24gaXM6XG4gKlxuICogYGBgXG4gKiAvLyBNeUNvbXBvbmVudFxuICogICAgIMm1ybVzdHlsZU1hcCh7Y29sb3I6ICcjMDAzJ30pOyAgIC8vIEJpbmRpbmcgaW5kZXg6IDIwXG4gKiAgICAgybXJtXN0eWxlUHJvcCgnY29sb3InLCAnIzAwNCcpOyAgLy8gQmluZGluZyBpbmRleDogMjJcbiAqIC8vIFN0eWxlMURpcmVjdGl2ZVxuICogICAgIMm1ybVzdHlsZU1hcCh7Y29sb3I6ICcjMDA1J30pOyAgIC8vIEJpbmRpbmcgaW5kZXg6IDI0XG4gKiAgICAgybXJtXN0eWxlUHJvcCgnY29sb3InLCAnIzAwNicpOyAgLy8gQmluZGluZyBpbmRleDogMjZcbiAqIC8vIFN0eWxlMkRpcmVjdGl2ZVxuICogICAgIMm1ybVzdHlsZU1hcCh7Y29sb3I6ICcjMDA3J30pOyAgIC8vIEJpbmRpbmcgaW5kZXg6IDI4XG4gKiAgICAgybXJtXN0eWxlUHJvcCgnY29sb3InLCAnIzAwOCcpOyAgLy8gQmluZGluZyBpbmRleDogMzBcbiAqIC8vIFRlbXBsYXRlOiAoRXhhbXBsZUNvbXBvbmVudClcbiAqICAgICDJtcm1c3R5bGVNYXAoe2NvbG9yOiAnIzAwMSd9KTsgICAvLyBCaW5kaW5nIGluZGV4OiAxMFxuICogICAgIMm1ybVzdHlsZVByb3AoJ2NvbG9yJywgJyMwMDInKTsgIC8vIEJpbmRpbmcgaW5kZXg6IDEyXG4gKiBgYGBcbiAqXG4gKiBXaGF0IGNvbG9yIHNob3VsZCBiZSByZW5kZXJlZD9cbiAqXG4gKiBPbmNlIHRoZSBpdGVtcyBhcmUgY29ycmVjdGx5IHNvcnRlZCBpbiB0aGUgbGlzdCwgdGhlIGFuc3dlciBpcyBzaW1wbHkgdGhlIGxhc3QgaXRlbSBpbiB0aGVcbiAqIGNvbmNhdGVuYXRpb24gbGlzdCB3aGljaCBpcyBgIzAwMmAuXG4gKlxuICogVG8gZG8gc28gd2Uga2VlcCBhIGxpbmtlZCBsaXN0IG9mIGFsbCBvZiB0aGUgYmluZGluZ3Mgd2hpY2ggcGVydGFpbiB0byB0aGlzIGVsZW1lbnQuXG4gKiBOb3RpY2UgdGhhdCB0aGUgYmluZGluZ3MgYXJlIGluc2VydGVkIGluIHRoZSBvcmRlciBvZiBleGVjdXRpb24sIGJ1dCB0aGUgYFRWaWV3LmRhdGFgIGFsbG93c1xuICogdXMgdG8gdHJhdmVyc2UgdGhlbSBpbiB0aGUgb3JkZXIgb2YgcHJpb3JpdHkuXG4gKlxuICogfElkeHxgVFZpZXcuZGF0YWB8YExWaWV3YCAgICAgICAgICB8IE5vdGVzXG4gKiB8LS0tfC0tLS0tLS0tLS0tLXwtLS0tLS0tLS0tLS0tLS0tLXwtLS0tLS0tLS0tLS0tLVxuICogfC4uLnwgICAgICAgICAgICB8ICAgICAgICAgICAgICAgICB8XG4gKiB8MTAgfGBudWxsYCAgICAgIHxge2NvbG9yOiAnIzAwMSd9YHwgYMm1ybVzdHlsZU1hcCgnY29sb3InLCB7Y29sb3I6ICcjMDAxJ30pYFxuICogfDExIHxgMzAgfCAxMmAgICB8IC4uLiAgICAgICAgICAgICB8XG4gKiB8MTIgfGBjb2xvcmAgICAgIHxgJyMwMDInYCAgICAgICAgIHwgYMm1ybVzdHlsZVByb3AoJ2NvbG9yJywgJyMwMDInKWBcbiAqIHwxMyB8YDEwIHwgMGAgICAgfCAuLi4gICAgICAgICAgICAgfFxuICogfC4uLnwgICAgICAgICAgICB8ICAgICAgICAgICAgICAgICB8XG4gKiB8MjAgfGBudWxsYCAgICAgIHxge2NvbG9yOiAnIzAwMyd9YHwgYMm1ybVzdHlsZU1hcCgnY29sb3InLCB7Y29sb3I6ICcjMDAzJ30pYFxuICogfDIxIHxgMCB8IDIyYCAgICB8IC4uLiAgICAgICAgICAgICB8XG4gKiB8MjIgfGBjb2xvcmAgICAgIHxgJyMwMDQnYCAgICAgICAgIHwgYMm1ybVzdHlsZVByb3AoJ2NvbG9yJywgJyMwMDQnKWBcbiAqIHwyMyB8YDIwIHwgMjRgICAgfCAuLi4gICAgICAgICAgICAgfFxuICogfDI0IHxgbnVsbGAgICAgICB8YHtjb2xvcjogJyMwMDUnfWB8IGDJtcm1c3R5bGVNYXAoJ2NvbG9yJywge2NvbG9yOiAnIzAwNSd9KWBcbiAqIHwyNSB8YDIyIHwgMjZgICAgfCAuLi4gICAgICAgICAgICAgfFxuICogfDI2IHxgY29sb3JgICAgICB8YCcjMDA2J2AgICAgICAgICB8IGDJtcm1c3R5bGVQcm9wKCdjb2xvcicsICcjMDA2JylgXG4gKiB8MjcgfGAyNCB8IDI4YCAgIHwgLi4uICAgICAgICAgICAgIHxcbiAqIHwyOCB8YG51bGxgICAgICAgfGB7Y29sb3I6ICcjMDA3J31gfCBgybXJtXN0eWxlTWFwKCdjb2xvcicsIHtjb2xvcjogJyMwMDcnfSlgXG4gKiB8MjkgfGAyNiB8IDMwYCAgIHwgLi4uICAgICAgICAgICAgIHxcbiAqIHwzMCB8YGNvbG9yYCAgICAgfGAnIzAwOCdgICAgICAgICAgfCBgybXJtXN0eWxlUHJvcCgnY29sb3InLCAnIzAwOCcpYFxuICogfDMxIHxgMjggfCAxMGAgICB8IC4uLiAgICAgICAgICAgICB8XG4gKlxuICogVGhlIGFib3ZlIGRhdGEgc3RydWN0dXJlIGFsbG93cyB1cyB0byByZS1jb25jYXRlbmF0ZSB0aGUgc3R5bGluZyBubyBtYXR0ZXIgd2hpY2ggZGF0YSBiaW5kaW5nXG4gKiBjaGFuZ2VzLlxuICpcbiAqIE5PVEU6IGluIGFkZGl0aW9uIHRvIGtlZXBpbmcgdHJhY2sgb2YgbmV4dC9wcmV2aW91cyBpbmRleCB0aGUgYFRWaWV3LmRhdGFgIGFsc28gc3RvcmVzIHByZXYvbmV4dFxuICogZHVwbGljYXRlIGJpdC4gVGhlIGR1cGxpY2F0ZSBiaXQgaWYgdHJ1ZSBzYXlzIHRoZXJlIGVpdGhlciBpcyBhIGJpbmRpbmcgd2l0aCB0aGUgc2FtZSBuYW1lIG9yXG4gKiB0aGVyZSBpcyBhIG1hcCAod2hpY2ggbWF5IGNvbnRhaW4gdGhlIG5hbWUpLiBUaGlzIGluZm9ybWF0aW9uIGlzIHVzZWZ1bCBpbiBrbm93aW5nIGlmIG90aGVyXG4gKiBzdHlsZXMgd2l0aCBoaWdoZXIgcHJpb3JpdHkgbmVlZCB0byBiZSBzZWFyY2hlZCBmb3Igb3ZlcndyaXRlcy5cbiAqXG4gKiBOT1RFOiBTZWUgYHNob3VsZCBzdXBwb3J0IGV4YW1wbGUgaW4gJ3Rub2RlX2xpbmtlZF9saXN0LnRzJyBkb2N1bWVudGF0aW9uYCBpblxuICogYHRub2RlX2xpbmtlZF9saXN0X3NwZWMudHNgIGZvciB3b3JraW5nIGV4YW1wbGUuXG4gKi9cbmxldCBfX3VudXNlZF9jb25zdF9hc19jbG9zdXJlX2RvZXNfbm90X2xpa2Vfc3RhbmRhbG9uZV9jb21tZW50X2Jsb2Nrc19fOiB1bmRlZmluZWQ7XG5cbi8qKlxuICogSW5zZXJ0IG5ldyBgdFN0eWxlVmFsdWVgIGF0IGBURGF0YWAgYW5kIGxpbmsgZXhpc3Rpbmcgc3R5bGUgYmluZGluZ3Mgc3VjaCB0aGF0IHdlIG1haW50YWluIGxpbmtlZFxuICogbGlzdCBvZiBzdHlsZXMgYW5kIGNvbXB1dGUgdGhlIGR1cGxpY2F0ZSBmbGFnLlxuICpcbiAqIE5vdGU6IHRoaXMgZnVuY3Rpb24gaXMgZXhlY3V0ZWQgZHVyaW5nIGBmaXJzdFVwZGF0ZVBhc3NgIG9ubHkgdG8gcG9wdWxhdGUgdGhlIGBUVmlldy5kYXRhYC5cbiAqXG4gKiBUaGUgZnVuY3Rpb24gd29ya3MgYnkga2VlcGluZyB0cmFjayBvZiBgdFN0eWxpbmdSYW5nZWAgd2hpY2ggY29udGFpbnMgdHdvIHBvaW50ZXJzIHBvaW50aW5nIHRvXG4gKiB0aGUgaGVhZC90YWlsIG9mIHRoZSB0ZW1wbGF0ZSBwb3J0aW9uIG9mIHRoZSBzdHlsZXMuXG4gKiAgLSBpZiBgaXNIb3N0ID09PSBmYWxzZWAgKHdlIGFyZSB0ZW1wbGF0ZSkgdGhlbiBpbnNlcnRpb24gaXMgYXQgdGFpbCBvZiBgVFN0eWxpbmdSYW5nZWBcbiAqICAtIGlmIGBpc0hvc3QgPT09IHRydWVgICh3ZSBhcmUgaG9zdCBiaW5kaW5nKSB0aGVuIGluc2VydGlvbiBpcyBhdCBoZWFkIG9mIGBUU3R5bGluZ1JhbmdlYFxuICpcbiAqIEBwYXJhbSB0RGF0YSBUaGUgYFREYXRhYCB0byBpbnNlcnQgaW50by5cbiAqIEBwYXJhbSB0Tm9kZSBgVE5vZGVgIGFzc29jaWF0ZWQgd2l0aCB0aGUgc3R5bGluZyBlbGVtZW50LlxuICogQHBhcmFtIHRTdHlsaW5nS2V5IFNlZSBgVFN0eWxpbmdLZXlgLlxuICogQHBhcmFtIGluZGV4IGxvY2F0aW9uIG9mIHdoZXJlIGB0U3R5bGVWYWx1ZWAgc2hvdWxkIGJlIHN0b3JlZCAoYW5kIGxpbmtlZCBpbnRvIGxpc3QuKVxuICogQHBhcmFtIGlzSG9zdEJpbmRpbmcgYHRydWVgIGlmIHRoZSBpbnNlcnRpb24gaXMgZm9yIGEgYGhvc3RCaW5kaW5nYC4gKGluc2VydGlvbiBpcyBpbiBmcm9udCBvZlxuICogICAgICAgICAgICAgICB0ZW1wbGF0ZS4pXG4gKiBAcGFyYW0gaXNDbGFzc0JpbmRpbmcgVHJ1ZSBpZiB0aGUgYXNzb2NpYXRlZCBgdFN0eWxpbmdLZXlgIGFzIGEgYGNsYXNzYCBzdHlsaW5nLlxuICogICAgICAgICAgICAgICAgICAgICAgIGB0Tm9kZS5jbGFzc0JpbmRpbmdzYCBzaG91bGQgYmUgdXNlZCAob3IgYHROb2RlLnN0eWxlQmluZGluZ3NgIG90aGVyd2lzZS4pXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbnNlcnRUU3R5bGluZ0JpbmRpbmcoXG4gICAgdERhdGE6IFREYXRhLCB0Tm9kZTogVE5vZGUsIHRTdHlsaW5nS2V5OiBUU3R5bGluZ0tleSwgaW5kZXg6IG51bWJlciwgaXNIb3N0QmluZGluZzogYm9vbGVhbixcbiAgICBpc0NsYXNzQmluZGluZzogYm9vbGVhbik6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Rmlyc3RVcGRhdGVQYXNzKGdldExWaWV3KClbVFZJRVddKTtcbiAgbGV0IHRCaW5kaW5ncyA9IGlzQ2xhc3NCaW5kaW5nID8gdE5vZGUuY2xhc3NCaW5kaW5ncyA6IHROb2RlLnN0eWxlQmluZGluZ3M7XG4gIGxldCB0bXBsSGVhZCA9IGdldFRTdHlsaW5nUmFuZ2VQcmV2KHRCaW5kaW5ncyk7XG4gIGxldCB0bXBsVGFpbCA9IGdldFRTdHlsaW5nUmFuZ2VOZXh0KHRCaW5kaW5ncyk7XG5cbiAgdERhdGFbaW5kZXhdID0gdFN0eWxpbmdLZXk7XG4gIGlmIChpc0hvc3RCaW5kaW5nKSB7XG4gICAgLy8gV2UgYXJlIGluc2VydGluZyBob3N0IGJpbmRpbmdzXG5cbiAgICAvLyBJZiB3ZSBkb24ndCBoYXZlIHRlbXBsYXRlIGJpbmRpbmdzIHRoZW4gYHRhaWxgIGlzIDAuXG4gICAgY29uc3QgaGFzVGVtcGxhdGVCaW5kaW5ncyA9IHRtcGxUYWlsICE9PSAwO1xuICAgIC8vIFRoaXMgaXMgaW1wb3J0YW50IHRvIGtub3cgYmVjYXVzZSB0aGF0IG1lYW5zIHRoYXQgdGhlIGBoZWFkYCBjYW4ndCBwb2ludCB0byB0aGUgZmlyc3RcbiAgICAvLyB0ZW1wbGF0ZSBiaW5kaW5ncyAodGhlcmUgYXJlIG5vbmUuKSBJbnN0ZWFkIHRoZSBoZWFkIHBvaW50cyB0byB0aGUgdGFpbCBvZiB0aGUgdGVtcGxhdGUuXG4gICAgaWYgKGhhc1RlbXBsYXRlQmluZGluZ3MpIHtcbiAgICAgIC8vIHRlbXBsYXRlIGhlYWQncyBcInByZXZcIiB3aWxsIHBvaW50IHRvIGxhc3QgaG9zdCBiaW5kaW5nIG9yIHRvIDAgaWYgbm8gaG9zdCBiaW5kaW5ncyB5ZXRcbiAgICAgIGNvbnN0IHByZXZpb3VzTm9kZSA9IGdldFRTdHlsaW5nUmFuZ2VQcmV2KHREYXRhW3RtcGxIZWFkICsgMV0gYXMgVFN0eWxpbmdSYW5nZSk7XG4gICAgICB0RGF0YVtpbmRleCArIDFdID0gdG9UU3R5bGluZ1JhbmdlKHByZXZpb3VzTm9kZSwgdG1wbEhlYWQpO1xuICAgICAgLy8gaWYgYSBob3N0IGJpbmRpbmcgaGFzIGFscmVhZHkgYmVlbiByZWdpc3RlcmVkLCB3ZSBuZWVkIHRvIHVwZGF0ZSB0aGUgbmV4dCBvZiB0aGF0IGhvc3RcbiAgICAgIC8vIGJpbmRpbmcgdG8gcG9pbnQgdG8gdGhpcyBvbmVcbiAgICAgIGlmIChwcmV2aW91c05vZGUgIT09IDApIHtcbiAgICAgICAgLy8gV2UgbmVlZCB0byB1cGRhdGUgdGhlIHRlbXBsYXRlLXRhaWwgdmFsdWUgdG8gcG9pbnQgdG8gdXMuXG4gICAgICAgIHREYXRhW3ByZXZpb3VzTm9kZSArIDFdID1cbiAgICAgICAgICAgIHNldFRTdHlsaW5nUmFuZ2VOZXh0KHREYXRhW3ByZXZpb3VzTm9kZSArIDFdIGFzIFRTdHlsaW5nUmFuZ2UsIGluZGV4KTtcbiAgICAgIH1cbiAgICAgIC8vIFRoZSBcInByZXZpb3VzXCIgb2YgdGhlIHRlbXBsYXRlIGJpbmRpbmcgaGVhZCBzaG91bGQgcG9pbnQgdG8gdGhpcyBob3N0IGJpbmRpbmdcbiAgICAgIHREYXRhW3RtcGxIZWFkICsgMV0gPSBzZXRUU3R5bGluZ1JhbmdlUHJldih0RGF0YVt0bXBsSGVhZCArIDFdIGFzIFRTdHlsaW5nUmFuZ2UsIGluZGV4KTtcbiAgICB9IGVsc2Uge1xuICAgICAgdERhdGFbaW5kZXggKyAxXSA9IHRvVFN0eWxpbmdSYW5nZSh0bXBsSGVhZCwgMCk7XG4gICAgICAvLyBpZiBhIGhvc3QgYmluZGluZyBoYXMgYWxyZWFkeSBiZWVuIHJlZ2lzdGVyZWQsIHdlIG5lZWQgdG8gdXBkYXRlIHRoZSBuZXh0IG9mIHRoYXQgaG9zdFxuICAgICAgLy8gYmluZGluZyB0byBwb2ludCB0byB0aGlzIG9uZVxuICAgICAgaWYgKHRtcGxIZWFkICE9PSAwKSB7XG4gICAgICAgIC8vIFdlIG5lZWQgdG8gdXBkYXRlIHRoZSB0ZW1wbGF0ZS10YWlsIHZhbHVlIHRvIHBvaW50IHRvIHVzLlxuICAgICAgICB0RGF0YVt0bXBsSGVhZCArIDFdID0gc2V0VFN0eWxpbmdSYW5nZU5leHQodERhdGFbdG1wbEhlYWQgKyAxXSBhcyBUU3R5bGluZ1JhbmdlLCBpbmRleCk7XG4gICAgICB9XG4gICAgICAvLyBpZiB3ZSBkb24ndCBoYXZlIHRlbXBsYXRlLCB0aGUgaGVhZCBwb2ludHMgdG8gdGVtcGxhdGUtdGFpbCwgYW5kIG5lZWRzIHRvIGJlIGFkdmFuY2VkLlxuICAgICAgdG1wbEhlYWQgPSBpbmRleDtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgLy8gV2UgYXJlIGluc2VydGluZyBpbiB0ZW1wbGF0ZSBzZWN0aW9uLlxuICAgIC8vIFdlIG5lZWQgdG8gc2V0IHRoaXMgYmluZGluZydzIFwicHJldmlvdXNcIiB0byB0aGUgY3VycmVudCB0ZW1wbGF0ZSB0YWlsXG4gICAgdERhdGFbaW5kZXggKyAxXSA9IHRvVFN0eWxpbmdSYW5nZSh0bXBsVGFpbCwgMCk7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydEVxdWFsKFxuICAgICAgICAgICAgICAgICAgICAgdG1wbEhlYWQgIT09IDAgJiYgdG1wbFRhaWwgPT09IDAsIGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgJ0FkZGluZyB0ZW1wbGF0ZSBiaW5kaW5ncyBhZnRlciBob3N0QmluZGluZ3MgaXMgbm90IGFsbG93ZWQuJyk7XG4gICAgaWYgKHRtcGxIZWFkID09PSAwKSB7XG4gICAgICB0bXBsSGVhZCA9IGluZGV4O1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBXZSBuZWVkIHRvIHVwZGF0ZSB0aGUgcHJldmlvdXMgdmFsdWUgXCJuZXh0XCIgdG8gcG9pbnQgdG8gdGhpcyBiaW5kaW5nXG4gICAgICB0RGF0YVt0bXBsVGFpbCArIDFdID0gc2V0VFN0eWxpbmdSYW5nZU5leHQodERhdGFbdG1wbFRhaWwgKyAxXSBhcyBUU3R5bGluZ1JhbmdlLCBpbmRleCk7XG4gICAgfVxuICAgIHRtcGxUYWlsID0gaW5kZXg7XG4gIH1cblxuICAvLyBOb3cgd2UgbmVlZCB0byB1cGRhdGUgLyBjb21wdXRlIHRoZSBkdXBsaWNhdGVzLlxuICAvLyBTdGFydGluZyB3aXRoIG91ciBsb2NhdGlvbiBzZWFyY2ggdG93YXJkcyBoZWFkIChsZWFzdCBwcmlvcml0eSlcbiAgbWFya0R1cGxpY2F0ZXMoXG4gICAgICB0RGF0YSwgdFN0eWxpbmdLZXksIGluZGV4LCAoaXNDbGFzc0JpbmRpbmcgPyB0Tm9kZS5jbGFzc2VzIDogdE5vZGUuc3R5bGVzKSB8fCAnJywgdHJ1ZSxcbiAgICAgIGlzQ2xhc3NCaW5kaW5nKTtcbiAgbWFya0R1cGxpY2F0ZXModERhdGEsIHRTdHlsaW5nS2V5LCBpbmRleCwgJycsIGZhbHNlLCBpc0NsYXNzQmluZGluZyk7XG5cbiAgdEJpbmRpbmdzID0gdG9UU3R5bGluZ1JhbmdlKHRtcGxIZWFkLCB0bXBsVGFpbCk7XG4gIGlmIChpc0NsYXNzQmluZGluZykge1xuICAgIHROb2RlLmNsYXNzQmluZGluZ3MgPSB0QmluZGluZ3M7XG4gIH0gZWxzZSB7XG4gICAgdE5vZGUuc3R5bGVCaW5kaW5ncyA9IHRCaW5kaW5ncztcbiAgfVxufVxuXG4vKipcbiAqIE1hcmtzIGBUU3R5bGVWYWx1ZWBzIGFzIGR1cGxpY2F0ZXMgaWYgYW5vdGhlciBzdHlsZSBiaW5kaW5nIGluIHRoZSBsaXN0IGhhcyB0aGUgc2FtZVxuICogYFRTdHlsZVZhbHVlYC5cbiAqXG4gKiBOT1RFOiB0aGlzIGZ1bmN0aW9uIGlzIGludGVuZGVkIHRvIGJlIGNhbGxlZCB0d2ljZSBvbmNlIHdpdGggYGlzUHJldkRpcmAgc2V0IHRvIGB0cnVlYCBhbmQgb25jZVxuICogd2l0aCBpdCBzZXQgdG8gYGZhbHNlYCB0byBzZWFyY2ggYm90aCB0aGUgcHJldmlvdXMgYXMgd2VsbCBhcyBuZXh0IGl0ZW1zIGluIHRoZSBsaXN0LlxuICpcbiAqIE5vIGR1cGxpY2F0ZSBjYXNlXG4gKiBgYGBcbiAqICAgW3N0eWxlLmNvbG9yXVxuICogICBbc3R5bGUud2lkdGgucHhdIDw8LSBpbmRleFxuICogICBbc3R5bGUuaGVpZ2h0LnB4XVxuICogYGBgXG4gKlxuICogSW4gdGhlIGFib3ZlIGNhc2UgYWRkaW5nIGBbc3R5bGUud2lkdGgucHhdYCB0byB0aGUgZXhpc3RpbmcgYFtzdHlsZS5jb2xvcl1gIHByb2R1Y2VzIG5vXG4gKiBkdXBsaWNhdGVzIGJlY2F1c2UgYHdpZHRoYCBpcyBub3QgZm91bmQgaW4gYW55IG90aGVyIHBhcnQgb2YgdGhlIGxpbmtlZCBsaXN0LlxuICpcbiAqIER1cGxpY2F0ZSBjYXNlXG4gKiBgYGBcbiAqICAgW3N0eWxlLmNvbG9yXVxuICogICBbc3R5bGUud2lkdGguZW1dXG4gKiAgIFtzdHlsZS53aWR0aC5weF0gPDwtIGluZGV4XG4gKiBgYGBcbiAqIEluIHRoZSBhYm92ZSBjYXNlIGFkZGluZyBgW3N0eWxlLndpZHRoLnB4XWAgd2lsbCBwcm9kdWNlIGEgZHVwbGljYXRlIHdpdGggYFtzdHlsZS53aWR0aC5lbV1gXG4gKiBiZWNhdXNlIGB3aWR0aGAgaXMgZm91bmQgaW4gdGhlIGNoYWluLlxuICpcbiAqIE1hcCBjYXNlIDFcbiAqIGBgYFxuICogICBbc3R5bGUud2lkdGgucHhdXG4gKiAgIFtzdHlsZS5jb2xvcl1cbiAqICAgW3N0eWxlXSAgPDwtIGluZGV4XG4gKiBgYGBcbiAqIEluIHRoZSBhYm92ZSBjYXNlIGFkZGluZyBgW3N0eWxlXWAgd2lsbCBwcm9kdWNlIGEgZHVwbGljYXRlIHdpdGggYW55IG90aGVyIGJpbmRpbmdzIGJlY2F1c2VcbiAqIGBbc3R5bGVdYCBpcyBhIE1hcCBhbmQgYXMgc3VjaCBpcyBmdWxseSBkeW5hbWljIGFuZCBjb3VsZCBwcm9kdWNlIGBjb2xvcmAgb3IgYHdpZHRoYC5cbiAqXG4gKiBNYXAgY2FzZSAyXG4gKiBgYGBcbiAqICAgW3N0eWxlXVxuICogICBbc3R5bGUud2lkdGgucHhdXG4gKiAgIFtzdHlsZS5jb2xvcl0gIDw8LSBpbmRleFxuICogYGBgXG4gKiBJbiB0aGUgYWJvdmUgY2FzZSBhZGRpbmcgYFtzdHlsZS5jb2xvcl1gIHdpbGwgcHJvZHVjZSBhIGR1cGxpY2F0ZSBiZWNhdXNlIHRoZXJlIGlzIGFscmVhZHkgYVxuICogYFtzdHlsZV1gIGJpbmRpbmcgd2hpY2ggaXMgYSBNYXAgYW5kIGFzIHN1Y2ggaXMgZnVsbHkgZHluYW1pYyBhbmQgY291bGQgcHJvZHVjZSBgY29sb3JgIG9yXG4gKiBgd2lkdGhgLlxuICpcbiAqIE5PVEU6IE9uY2UgYFtzdHlsZV1gIChNYXApIGlzIGFkZGVkIGludG8gdGhlIHN5c3RlbSBhbGwgdGhpbmdzIGFyZSBtYXBwZWQgYXMgZHVwbGljYXRlcy5cbiAqIE5PVEU6IFdlIHVzZSBgc3R5bGVgIGFzIGV4YW1wbGUsIGJ1dCBzYW1lIGxvZ2ljIGlzIGFwcGxpZWQgdG8gYGNsYXNzYGVzIGFzIHdlbGwuXG4gKlxuICogQHBhcmFtIHREYXRhXG4gKiBAcGFyYW0gdFN0eWxpbmdLZXlcbiAqIEBwYXJhbSBpbmRleFxuICogQHBhcmFtIHN0YXRpY1ZhbHVlc1xuICogQHBhcmFtIGlzUHJldkRpclxuICovXG5mdW5jdGlvbiBtYXJrRHVwbGljYXRlcyhcbiAgICB0RGF0YTogVERhdGEsIHRTdHlsaW5nS2V5OiBUU3R5bGluZ0tleSwgaW5kZXg6IG51bWJlciwgc3RhdGljVmFsdWVzOiBzdHJpbmcsIGlzUHJldkRpcjogYm9vbGVhbixcbiAgICBpc0NsYXNzQmluZGluZzogYm9vbGVhbikge1xuICBjb25zdCB0U3R5bGluZ0F0SW5kZXggPSB0RGF0YVtpbmRleCArIDFdIGFzIFRTdHlsaW5nUmFuZ2U7XG4gIGNvbnN0IGlzTWFwID0gdFN0eWxpbmdLZXkgPT09IG51bGw7XG4gIGxldCBjdXJzb3IgPVxuICAgICAgaXNQcmV2RGlyID8gZ2V0VFN0eWxpbmdSYW5nZVByZXYodFN0eWxpbmdBdEluZGV4KSA6IGdldFRTdHlsaW5nUmFuZ2VOZXh0KHRTdHlsaW5nQXRJbmRleCk7XG4gIGxldCBmb3VuZER1cGxpY2F0ZSA9IGZhbHNlO1xuICAvLyBXZSBrZWVwIGl0ZXJhdGluZyBhcyBsb25nIGFzIHdlIGhhdmUgYSBjdXJzb3JcbiAgLy8gQU5EIGVpdGhlcjogV2UgZm91bmQgd2hhdCB3ZSBhcmUgbG9va2luZyBmb3IsIG9yIHdlIGFyZSBhIG1hcCBpbiB3aGljaCBjYXNlIHdlIGhhdmUgdG9cbiAgLy8gY29udGludWUgc2VhcmNoaW5nIGV2ZW4gYWZ0ZXIgd2UgZmluZCB3aGF0IHdlIHdlcmUgbG9va2luZyBmb3Igc2luY2Ugd2UgYXJlIGEgd2lsZCBjYXJkXG4gIC8vIGFuZCBldmVyeXRoaW5nIG5lZWRzIHRvIGJlIGZsaXBwZWQgdG8gZHVwbGljYXRlLlxuICB3aGlsZSAoY3Vyc29yICE9PSAwICYmIChmb3VuZER1cGxpY2F0ZSA9PT0gZmFsc2UgfHwgaXNNYXApKSB7XG4gICAgY29uc3QgdFN0eWxpbmdWYWx1ZUF0Q3Vyc29yID0gdERhdGFbY3Vyc29yXSBhcyBUU3R5bGluZ0tleTtcbiAgICBjb25zdCB0U3R5bGVSYW5nZUF0Q3Vyc29yID0gdERhdGFbY3Vyc29yICsgMV0gYXMgVFN0eWxpbmdSYW5nZTtcbiAgICBpZiAodFN0eWxpbmdWYWx1ZUF0Q3Vyc29yID09PSBudWxsIHx8IHRTdHlsaW5nS2V5ID09IG51bGwgfHxcbiAgICAgICAgdFN0eWxpbmdWYWx1ZUF0Q3Vyc29yID09PSB0U3R5bGluZ0tleSkge1xuICAgICAgZm91bmREdXBsaWNhdGUgPSB0cnVlO1xuICAgICAgdERhdGFbY3Vyc29yICsgMV0gPSBpc1ByZXZEaXIgPyBzZXRUU3R5bGluZ1JhbmdlTmV4dER1cGxpY2F0ZSh0U3R5bGVSYW5nZUF0Q3Vyc29yKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldFRTdHlsaW5nUmFuZ2VQcmV2RHVwbGljYXRlKHRTdHlsZVJhbmdlQXRDdXJzb3IpO1xuICAgIH1cbiAgICBjdXJzb3IgPSBpc1ByZXZEaXIgPyBnZXRUU3R5bGluZ1JhbmdlUHJldih0U3R5bGVSYW5nZUF0Q3Vyc29yKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgZ2V0VFN0eWxpbmdSYW5nZU5leHQodFN0eWxlUmFuZ2VBdEN1cnNvcik7XG4gIH1cbiAgLy8gV2UgYWxzbyBuZWVkIHRvIHByb2Nlc3MgdGhlIHN0YXRpYyB2YWx1ZXMuXG4gIGlmIChzdGF0aWNWYWx1ZXMgIT09ICcnICYmICAvLyBJZiB3ZSBoYXZlIHN0YXRpYyB2YWx1ZXMgdG8gc2VhcmNoXG4gICAgICAhZm91bmREdXBsaWNhdGUgICAgICAgICAvLyBJZiB3ZSBoYXZlIGR1cGxpY2F0ZSBkb24ndCBib3RoZXIgc2luY2Ugd2UgYXJlIGFscmVhZHkgbWFya2VkIGFzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBkdXBsaWNhdGVcbiAgICAgICkge1xuICAgIGlmIChpc01hcCkge1xuICAgICAgLy8gaWYgd2UgYXJlIGEgTWFwIChhbmQgd2UgaGF2ZSBzdGF0aWNzKSB3ZSBtdXN0IGFzc3VtZSBkdXBsaWNhdGVcbiAgICAgIGZvdW5kRHVwbGljYXRlID0gdHJ1ZTtcbiAgICB9IGVsc2UgaWYgKHN0YXRpY1ZhbHVlcyAhPSBudWxsKSB7XG4gICAgICAvLyBJZiB3ZSBmb3VuZCBub24tbWFwIHRoZW4gd2UgaXRlcmF0ZSBvdmVyIGl0cyBrZXlzIHRvIGRldGVybWluZSBpZiBhbnkgb2YgdGhlbSBtYXRjaCBvdXJzXG4gICAgICAvLyBJZiB3ZSBmaW5kIGEgbWF0Y2ggdGhhbiB3ZSBtYXJrIGl0IGFzIGR1cGxpY2F0ZS5cbiAgICAgIGZvciAobGV0IGkgPSBpc0NsYXNzQmluZGluZyA/IHBhcnNlQ2xhc3NOYW1lKHN0YXRpY1ZhbHVlcykgOiBwYXJzZVN0eWxlKHN0YXRpY1ZhbHVlcyk7ICAvL1xuICAgICAgICAgICBpID49IDA7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICAgICAgIGkgPSBpc0NsYXNzQmluZGluZyA/IHBhcnNlQ2xhc3NOYW1lTmV4dChzdGF0aWNWYWx1ZXMsIGkpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFyc2VTdHlsZU5leHQoc3RhdGljVmFsdWVzLCBpKSkge1xuICAgICAgICBpZiAoZ2V0TGFzdFBhcnNlZEtleShzdGF0aWNWYWx1ZXMpID09PSB0U3R5bGluZ0tleSkge1xuICAgICAgICAgIGZvdW5kRHVwbGljYXRlID0gdHJ1ZTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuICBpZiAoZm91bmREdXBsaWNhdGUpIHtcbiAgICAvLyBpZiB3ZSBmb3VuZCBhIGR1cGxpY2F0ZSwgdGhhbiBtYXJrIG91cnNlbHZlcy5cbiAgICB0RGF0YVtpbmRleCArIDFdID0gaXNQcmV2RGlyID8gc2V0VFN0eWxpbmdSYW5nZVByZXZEdXBsaWNhdGUodFN0eWxpbmdBdEluZGV4KSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldFRTdHlsaW5nUmFuZ2VOZXh0RHVwbGljYXRlKHRTdHlsaW5nQXRJbmRleCk7XG4gIH1cbn1cbiJdfQ==