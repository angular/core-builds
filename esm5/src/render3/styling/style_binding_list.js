/**
* @license
* Copyright Google Inc. All Rights Reserved.
*
* Use of this source code is governed by an MIT-style license that can be
* found in the LICENSE file at https://angular.io/license
*/
import { stylePropNeedsSanitization, ɵɵsanitizeStyle } from '../../sanitization/sanitization';
import { assertEqual, throwError } from '../../util/assert';
import { getTStylingRangeNext, getTStylingRangePrev, getTStylingRangePrevDuplicate, setTStylingRangeNext, setTStylingRangeNextDuplicate, setTStylingRangePrev, setTStylingRangePrevDuplicate, toTStylingRange } from '../interfaces/styling';
import { TVIEW } from '../interfaces/view';
import { getLView } from '../state';
import { splitClassList, toggleClass } from './class_differ';
import { parseKeyValue, removeStyle } from './style_differ';
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
export function insertTStylingBinding(tData, tNode, tStylingKey, index, isHostBinding, isClassBinding) {
    ngDevMode && assertEqual(getLView()[TVIEW].firstUpdatePass, true, 'Should be called during \'firstUpdatePass` only.');
    var tBindings = isClassBinding ? tNode.classBindings : tNode.styleBindings;
    var tmplHead = getTStylingRangePrev(tBindings);
    var tmplTail = getTStylingRangeNext(tBindings);
    tData[index] = tStylingKey;
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
    markDuplicates(tData, tStylingKey, index, isClassBinding ? tNode.classes : tNode.styles, true);
    markDuplicates(tData, tStylingKey, index, null, false);
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
 * @param tData
 * @param tStylingKey
 * @param index
 * @param staticValues
 * @param isPrevDir
 */
function markDuplicates(tData, tStylingKey, index, staticValues, isPrevDir) {
    var tStylingAtIndex = tData[index + 1];
    var key = typeof tStylingKey === 'object' ? tStylingKey.key : tStylingKey;
    var isMap = key === null;
    var cursor = isPrevDir ? getTStylingRangePrev(tStylingAtIndex) : getTStylingRangeNext(tStylingAtIndex);
    var foundDuplicate = false;
    // We keep iterating as long as we have a cursor
    // AND either: We found what we are looking for, or we are a map in which case we have to
    // continue searching even after we find what we were looking for since we are a wild card
    // and everything needs to be flipped to duplicate.
    while (cursor !== 0 && (foundDuplicate === false || isMap)) {
        var tStylingValueAtCursor = tData[cursor];
        var tStyleRangeAtCursor = tData[cursor + 1];
        var keyAtCursor = typeof tStylingValueAtCursor === 'object' ? tStylingValueAtCursor.key :
            tStylingValueAtCursor;
        if (keyAtCursor === null || key == null || keyAtCursor === key) {
            foundDuplicate = true;
            tData[cursor + 1] = isPrevDir ? setTStylingRangeNextDuplicate(tStyleRangeAtCursor) :
                setTStylingRangePrevDuplicate(tStyleRangeAtCursor);
        }
        cursor = isPrevDir ? getTStylingRangePrev(tStyleRangeAtCursor) :
            getTStylingRangeNext(tStyleRangeAtCursor);
    }
    if (staticValues !== null && // If we have static values to search
        !foundDuplicate // If we have duplicate don't bother since we are already marked as
    // duplicate
    ) {
        if (isMap) {
            // if we are a Map (and we have statics) we must assume duplicate
            foundDuplicate = true;
        }
        else {
            for (var i = 1; foundDuplicate === false && i < staticValues.length; i = i + 2) {
                if (staticValues[i] === key) {
                    foundDuplicate = true;
                    break;
                }
            }
        }
    }
    if (foundDuplicate) {
        tData[index + 1] = isPrevDir ? setTStylingRangePrevDuplicate(tStylingAtIndex) :
            setTStylingRangeNextDuplicate(tStylingAtIndex);
    }
}
/**
 * Computes the new styling value starting at `index` styling binding.
 *
 * @param tData `TData` containing the styling binding linked list.
 *              - `TData[index]` contains the binding name.
 *              - `TData[index + 1]` contains the `TStylingRange` a linked list of other bindings.
 * @param tNode `TNode` containing the initial styling values.
 * @param lView `LView` containing the styling values.
 *              - `LView[index]` contains the binding value.
 *              - `LView[index + 1]` contains the concatenated value up to this point.
 * @param index the location in `TData`/`LView` where the styling search should start.
 * @param isClassBinding `true` if binding to `className`; `false` when binding to `style`.
 */
export function flushStyleBinding(tData, tNode, lView, index, isClassBinding) {
    var tStylingRangeAtIndex = tData[index + 1];
    // When styling changes we don't have to start at the begging. Instead we start at the change
    // value and look up the previous concatenation as a starting point going forward.
    var lastUnchangedValueIndex = getTStylingRangePrev(tStylingRangeAtIndex);
    var text = lastUnchangedValueIndex === 0 ? getStaticStylingValue(tNode, isClassBinding) :
        lView[lastUnchangedValueIndex + 1];
    var cursor = index;
    while (cursor !== 0) {
        var value = lView[cursor];
        var key = tData[cursor];
        var stylingRange = tData[cursor + 1];
        lView[cursor + 1] = text = appendStyling(text, key, value, null, getTStylingRangePrevDuplicate(stylingRange), isClassBinding);
        cursor = getTStylingRangeNext(stylingRange);
    }
    return text;
}
/**
 * Retrieves the static value for styling.
 *
 * @param tNode
 * @param isClassBinding
 */
function getStaticStylingValue(tNode, isClassBinding) {
    // TODO(misko): implement once we have more code integrated.
    return '';
}
/**
 * Append new styling to the currently concatenated styling text.
 *
 * This function concatenates the existing `className`/`cssText` text with the binding value.
 *
 * @param text Text to concatenate to.
 * @param stylingKey `TStylingKey` holding the key (className or style property name).
 * @param value The value for the key.
 *         - `isClassBinding === true`
 *              - `boolean` if `true` then add the key to the class list string.
 *              - `Array` add each string value to the class list string.
 *              - `Object` add object key to the class list string if the key value is truthy.
 *         - `isClassBinding === false`
 *              - `Array` Not supported.
 *              - `Object` add object key/value to the styles.
 * @param sanitizer Optional sanitizer to use. If `null` the `stylingKey` sanitizer will be used.
 *        This is provided so that `ɵɵstyleMap()`/`ɵɵclassMap()` can recursively call
 *        `appendStyling` without having ta package the sanitizer into `TStylingSanitizationKey`.
 * @param hasPreviousDuplicate determines if there is a chance of duplicate.
 *         - `true` the existing `text` should be searched for duplicates and if any found they
 *           should be removed.
 *         - `false` Fast path, just concatenate the strings.
 * @param isClassBinding Determines if the `text` is `className` or `cssText`.
 * @returns new styling string with the concatenated values.
 */
export function appendStyling(text, stylingKey, value, sanitizer, hasPreviousDuplicate, isClassBinding) {
    var key;
    var suffixOrSanitizer = sanitizer;
    if (typeof stylingKey === 'object') {
        if (stylingKey.key === null) {
            return value != null ? stylingKey.extra(text, value, hasPreviousDuplicate) : text;
        }
        else {
            suffixOrSanitizer = stylingKey.extra;
            key = stylingKey.key;
        }
    }
    else {
        key = stylingKey;
    }
    if (isClassBinding) {
        ngDevMode && assertEqual(typeof stylingKey === 'string', true, 'Expecting key to be string');
        if (hasPreviousDuplicate) {
            text = toggleClass(text, stylingKey, !!value);
        }
        else if (value) {
            text = text === '' ? stylingKey : text + ' ' + stylingKey;
        }
    }
    else {
        if (hasPreviousDuplicate) {
            text = removeStyle(text, key);
        }
        var keyValue = key + ': ' + (typeof suffixOrSanitizer === 'function' ?
            suffixOrSanitizer(value) :
            (suffixOrSanitizer == null ? value : value + suffixOrSanitizer));
        text = text === '' ? keyValue : text + '; ' + keyValue;
    }
    return text;
}
var ɵ0 = function (text, value, hasPreviousDuplicate) {
    if (Array.isArray(value)) {
        // We support Arrays
        for (var i = 0; i < value.length; i++) {
            text = appendStyling(text, value[i], true, null, hasPreviousDuplicate, true);
        }
    }
    else if (typeof value === 'object') {
        // We support maps
        for (var key in value) {
            text = appendStyling(text, key, value[key], null, hasPreviousDuplicate, true);
        }
    }
    else if (typeof value === 'string') {
        // We support strings
        if (hasPreviousDuplicate) {
            // We need to parse and process it.
            var changes = new Map();
            splitClassList(value, changes, false);
            changes.forEach(function (_, key) { return text = appendStyling(text, key, true, null, true, true); });
        }
        else {
            // No duplicates, just append it.
            text = text === '' ? value : text + ' ' + value;
        }
    }
    else {
        // All other cases are not supported.
        ngDevMode && throwError('Unsupported value for class binding: ' + value);
    }
    return text;
};
/**
 * `ɵɵclassMap()` inserts `CLASS_MAP_STYLING_KEY` as a key to the `insertTStylingBinding()`.
 *
 * The purpose of this key is to add class map abilities to the concatenation in a tree shakable
 * way. If `ɵɵclassMap()` is not referenced than `CLASS_MAP_STYLING_KEY` will become eligible for
 * tree shaking.
 *
 * This key supports: `strings`, `object` (as Map) and `Array`. In each case it is necessary to
 * break the classes into parts and concatenate the parts into the `text`. The concatenation needs
 * to be done in parts as each key is individually subject to overwrites.
 */
export var CLASS_MAP_STYLING_KEY = {
    key: null,
    extra: ɵ0
};
var ɵ1 = function (text, value, hasPreviousDuplicate) {
    if (Array.isArray(value)) {
        // We don't support Arrays
        ngDevMode && throwError('Style bindings do not support array bindings: ' + value);
    }
    else if (typeof value === 'object') {
        // We support maps
        for (var key in value) {
            text = appendStyling(text, key, value[key], stylePropNeedsSanitization(key) ? ɵɵsanitizeStyle : null, hasPreviousDuplicate, false);
        }
    }
    else if (typeof value === 'string') {
        // We support strings
        if (hasPreviousDuplicate) {
            // We need to parse and process it.
            var changes = new Map();
            parseKeyValue(value, changes, false);
            changes.forEach(function (value, key) { return text = appendStyling(text, key, value.old, stylePropNeedsSanitization(key) ? ɵɵsanitizeStyle : null, true, false); });
        }
        else {
            // No duplicates, just append it.
            text = text === '' ? value : text + '; ' + value;
        }
    }
    else {
        // All other cases are not supported.
        ngDevMode && throwError('Unsupported value for style binding: ' + value);
    }
    return text;
};
/**
 * `ɵɵstyleMap()` inserts `STYLE_MAP_STYLING_KEY` as a key to the `insertTStylingBinding()`.
 *
 * The purpose of this key is to add style map abilities to the concatenation in a tree shakable
 * way. If `ɵɵstyleMap()` is not referenced than `STYLE_MAP_STYLING_KEY` will become eligible for
 * tree shaking. (`STYLE_MAP_STYLING_KEY` also pulls in the sanitizer as `ɵɵstyleMap()` could have
 * a sanitizable property.)
 *
 * This key supports: `strings`, and `object` (as Map). In each case it is necessary to
 * break the style into parts and concatenate the parts into the `text`. The concatenation needs
 * to be done in parts as each key is individually subject to overwrites.
 */
export var STYLE_MAP_STYLING_KEY = {
    key: null,
    extra: ɵ1
};
export { ɵ0, ɵ1 };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3R5bGVfYmluZGluZ19saXN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9zdHlsaW5nL3N0eWxlX2JpbmRpbmdfbGlzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0VBTUU7QUFFRixPQUFPLEVBQUMsMEJBQTBCLEVBQUUsZUFBZSxFQUFDLE1BQU0saUNBQWlDLENBQUM7QUFDNUYsT0FBTyxFQUFDLFdBQVcsRUFBRSxVQUFVLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUcxRCxPQUFPLEVBQThELG9CQUFvQixFQUFFLG9CQUFvQixFQUFFLDZCQUE2QixFQUFFLG9CQUFvQixFQUFFLDZCQUE2QixFQUFFLG9CQUFvQixFQUFFLDZCQUE2QixFQUFFLGVBQWUsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQ3hTLE9BQU8sRUFBZSxLQUFLLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUN2RCxPQUFPLEVBQUMsUUFBUSxFQUFDLE1BQU0sVUFBVSxDQUFDO0FBRWxDLE9BQU8sRUFBQyxjQUFjLEVBQUUsV0FBVyxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFDM0QsT0FBTyxFQUFrQixhQUFhLEVBQUUsV0FBVyxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFJM0U7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBd0pHO0FBR0g7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0FtQkc7QUFDSCxNQUFNLFVBQVUscUJBQXFCLENBQ2pDLEtBQVksRUFBRSxLQUFZLEVBQUUsV0FBd0IsRUFBRSxLQUFhLEVBQUUsYUFBc0IsRUFDM0Ys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QUFPLElBQUksQ0FBQztBQUNkLENBQUM7QUE3Q0g7Ozs7Ozs7Ozs7O0dBV0c7QUFDSCxNQUFNLENBQUMsSUFBTSxxQkFBcUIsR0FBbUI7SUFDbkQsR0FBRyxFQUFFLElBQUk7SUFDVCxLQUFLLElBK0JKO0NBQ0YsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuKiBAbGljZW5zZVxuKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbipcbiogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuKi9cblxuaW1wb3J0IHtzdHlsZVByb3BOZWVkc1Nhbml0aXphdGlvbiwgybXJtXNhbml0aXplU3R5bGV9IGZyb20gJy4uLy4uL3Nhbml0aXphdGlvbi9zYW5pdGl6YXRpb24nO1xuaW1wb3J0IHthc3NlcnRFcXVhbCwgdGhyb3dFcnJvcn0gZnJvbSAnLi4vLi4vdXRpbC9hc3NlcnQnO1xuaW1wb3J0IHtUTm9kZX0gZnJvbSAnLi4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7U2FuaXRpemVyRm59IGZyb20gJy4uL2ludGVyZmFjZXMvc2FuaXRpemF0aW9uJztcbmltcG9ydCB7U3R5bGluZ01hcEFycmF5LCBUU3R5bGluZ0tleSwgVFN0eWxpbmdNYXBLZXksIFRTdHlsaW5nUmFuZ2UsIGdldFRTdHlsaW5nUmFuZ2VOZXh0LCBnZXRUU3R5bGluZ1JhbmdlUHJldiwgZ2V0VFN0eWxpbmdSYW5nZVByZXZEdXBsaWNhdGUsIHNldFRTdHlsaW5nUmFuZ2VOZXh0LCBzZXRUU3R5bGluZ1JhbmdlTmV4dER1cGxpY2F0ZSwgc2V0VFN0eWxpbmdSYW5nZVByZXYsIHNldFRTdHlsaW5nUmFuZ2VQcmV2RHVwbGljYXRlLCB0b1RTdHlsaW5nUmFuZ2V9IGZyb20gJy4uL2ludGVyZmFjZXMvc3R5bGluZyc7XG5pbXBvcnQge0xWaWV3LCBURGF0YSwgVFZJRVd9IGZyb20gJy4uL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2dldExWaWV3fSBmcm9tICcuLi9zdGF0ZSc7XG5cbmltcG9ydCB7c3BsaXRDbGFzc0xpc3QsIHRvZ2dsZUNsYXNzfSBmcm9tICcuL2NsYXNzX2RpZmZlcic7XG5pbXBvcnQge1N0eWxlQ2hhbmdlc01hcCwgcGFyc2VLZXlWYWx1ZSwgcmVtb3ZlU3R5bGV9IGZyb20gJy4vc3R5bGVfZGlmZmVyJztcblxuXG5cbi8qKlxuICogTk9URTogVGhlIHdvcmQgYHN0eWxpbmdgIGlzIHVzZWQgaW50ZXJjaGFuZ2VhYmx5IGFzIHN0eWxlIG9yIGNsYXNzIHN0eWxpbmcuXG4gKlxuICogVGhpcyBmaWxlIGNvbnRhaW5zIGNvZGUgdG8gbGluayBzdHlsaW5nIGluc3RydWN0aW9ucyB0b2dldGhlciBzbyB0aGF0IHRoZXkgY2FuIGJlIHJlcGxheWVkIGluXG4gKiBwcmlvcml0eSBvcmRlci4gVGhlIGZpbGUgZXhpc3RzIGJlY2F1c2UgSXZ5IHN0eWxpbmcgaW5zdHJ1Y3Rpb24gZXhlY3V0aW9uIG9yZGVyIGRvZXMgbm90IG1hdGNoXG4gKiB0aGF0IG9mIHRoZSBwcmlvcml0eSBvcmRlci4gVGhlIHB1cnBvc2Ugb2YgdGhpcyBjb2RlIGlzIHRvIGNyZWF0ZSBhIGxpbmtlZCBsaXN0IHNvIHRoYXQgdGhlXG4gKiBpbnN0cnVjdGlvbnMgY2FuIGJlIHRyYXZlcnNlZCBpbiBwcmlvcml0eSBvcmRlciB3aGVuIGNvbXB1dGluZyB0aGUgc3R5bGVzLlxuICpcbiAqIEFzc3VtZSB3ZSBhcmUgZGVhbGluZyB3aXRoIHRoZSBmb2xsb3dpbmcgY29kZTpcbiAqIGBgYFxuICogQENvbXBvbmVudCh7XG4gKiAgIHRlbXBsYXRlOiBgXG4gKiAgICAgPG15LWNtcCBbc3R5bGVdPVwiIHtjb2xvcjogJyMwMDEnfSBcIlxuICogICAgICAgICAgICAgW3N0eWxlLmNvbG9yXT1cIiAjMDAyIFwiXG4gKiAgICAgICAgICAgICBkaXItc3R5bGUtY29sb3ItMVxuICogICAgICAgICAgICAgZGlyLXN0eWxlLWNvbG9yLTI+IGBcbiAqIH0pXG4gKiBjbGFzcyBFeGFtcGxlQ29tcG9uZW50IHtcbiAqICAgc3RhdGljIG5nQ29tcCA9IC4uLiB7XG4gKiAgICAgLi4uXG4gKiAgICAgLy8gQ29tcGlsZXIgZW5zdXJlcyB0aGF0IGDJtcm1c3R5bGVQcm9wYCBpcyBhZnRlciBgybXJtXN0eWxlTWFwYFxuICogICAgIMm1ybVzdHlsZU1hcCh7Y29sb3I6ICcjMDAxJ30pO1xuICogICAgIMm1ybVzdHlsZVByb3AoJ2NvbG9yJywgJyMwMDInKTtcbiAqICAgICAuLi5cbiAqICAgfVxuICogfVxuICpcbiAqIEBEaXJlY3RpdmUoe1xuICogICBzZWxlY3RvcjogYFtkaXItc3R5bGUtY29sb3ItMV0nLFxuICogfSlcbiAqIGNsYXNzIFN0eWxlMURpcmVjdGl2ZSB7XG4gKiAgIEBIb3N0QmluZGluZygnc3R5bGUnKSBzdHlsZSA9IHtjb2xvcjogJyMwMDUnfTtcbiAqICAgQEhvc3RCaW5kaW5nKCdzdHlsZS5jb2xvcicpIGNvbG9yID0gJyMwMDYnO1xuICpcbiAqICAgc3RhdGljIG5nRGlyID0gLi4uIHtcbiAqICAgICAuLi5cbiAqICAgICAvLyBDb21waWxlciBlbnN1cmVzIHRoYXQgYMm1ybVzdHlsZVByb3BgIGlzIGFmdGVyIGDJtcm1c3R5bGVNYXBgXG4gKiAgICAgybXJtXN0eWxlTWFwKHtjb2xvcjogJyMwMDUnfSk7XG4gKiAgICAgybXJtXN0eWxlUHJvcCgnY29sb3InLCAnIzAwNicpO1xuICogICAgIC4uLlxuICogICB9XG4gKiB9XG4gKlxuICogQERpcmVjdGl2ZSh7XG4gKiAgIHNlbGVjdG9yOiBgW2Rpci1zdHlsZS1jb2xvci0yXScsXG4gKiB9KVxuICogY2xhc3MgU3R5bGUyRGlyZWN0aXZlIHtcbiAqICAgQEhvc3RCaW5kaW5nKCdzdHlsZScpIHN0eWxlID0ge2NvbG9yOiAnIzAwNyd9O1xuICogICBASG9zdEJpbmRpbmcoJ3N0eWxlLmNvbG9yJykgY29sb3IgPSAnIzAwOCc7XG4gKlxuICogICBzdGF0aWMgbmdEaXIgPSAuLi4ge1xuICogICAgIC4uLlxuICogICAgIC8vIENvbXBpbGVyIGVuc3VyZXMgdGhhdCBgybXJtXN0eWxlUHJvcGAgaXMgYWZ0ZXIgYMm1ybVzdHlsZU1hcGBcbiAqICAgICDJtcm1c3R5bGVNYXAoe2NvbG9yOiAnIzAwNyd9KTtcbiAqICAgICDJtcm1c3R5bGVQcm9wKCdjb2xvcicsICcjMDA4Jyk7XG4gKiAgICAgLi4uXG4gKiAgIH1cbiAqIH1cbiAqXG4gKiBARGlyZWN0aXZlKHtcbiAqICAgc2VsZWN0b3I6IGBteS1jbXAnLFxuICogfSlcbiAqIGNsYXNzIE15Q29tcG9uZW50IHtcbiAqICAgQEhvc3RCaW5kaW5nKCdzdHlsZScpIHN0eWxlID0ge2NvbG9yOiAnIzAwMyd9O1xuICogICBASG9zdEJpbmRpbmcoJ3N0eWxlLmNvbG9yJykgY29sb3IgPSAnIzAwNCc7XG4gKlxuICogICBzdGF0aWMgbmdDb21wID0gLi4uIHtcbiAqICAgICAuLi5cbiAqICAgICAvLyBDb21waWxlciBlbnN1cmVzIHRoYXQgYMm1ybVzdHlsZVByb3BgIGlzIGFmdGVyIGDJtcm1c3R5bGVNYXBgXG4gKiAgICAgybXJtXN0eWxlTWFwKHtjb2xvcjogJyMwMDMnfSk7XG4gKiAgICAgybXJtXN0eWxlUHJvcCgnY29sb3InLCAnIzAwNCcpO1xuICogICAgIC4uLlxuICogICB9XG4gKiB9XG4gKiBgYGBcbiAqXG4gKiBUaGUgT3JkZXIgb2YgaW5zdHJ1Y3Rpb24gZXhlY3V0aW9uIGlzOlxuICpcbiAqIE5PVEU6IHRoZSBjb21tZW50IGJpbmRpbmcgbG9jYXRpb24gaXMgZm9yIGlsbHVzdHJhdGl2ZSBwdXJwb3NlcyBvbmx5LlxuICpcbiAqIGBgYFxuICogLy8gVGVtcGxhdGU6IChFeGFtcGxlQ29tcG9uZW50KVxuICogICAgIMm1ybVzdHlsZU1hcCh7Y29sb3I6ICcjMDAxJ30pOyAgIC8vIEJpbmRpbmcgaW5kZXg6IDEwXG4gKiAgICAgybXJtXN0eWxlUHJvcCgnY29sb3InLCAnIzAwMicpOyAgLy8gQmluZGluZyBpbmRleDogMTJcbiAqIC8vIE15Q29tcG9uZW50XG4gKiAgICAgybXJtXN0eWxlTWFwKHtjb2xvcjogJyMwMDMnfSk7ICAgLy8gQmluZGluZyBpbmRleDogMjBcbiAqICAgICDJtcm1c3R5bGVQcm9wKCdjb2xvcicsICcjMDA0Jyk7ICAvLyBCaW5kaW5nIGluZGV4OiAyMlxuICogLy8gU3R5bGUxRGlyZWN0aXZlXG4gKiAgICAgybXJtXN0eWxlTWFwKHtjb2xvcjogJyMwMDUnfSk7ICAgLy8gQmluZGluZyBpbmRleDogMjRcbiAqICAgICDJtcm1c3R5bGVQcm9wKCdjb2xvcicsICcjMDA2Jyk7ICAvLyBCaW5kaW5nIGluZGV4OiAyNlxuICogLy8gU3R5bGUyRGlyZWN0aXZlXG4gKiAgICAgybXJtXN0eWxlTWFwKHtjb2xvcjogJyMwMDcnfSk7ICAgLy8gQmluZGluZyBpbmRleDogMjhcbiAqICAgICDJtcm1c3R5bGVQcm9wKCdjb2xvcicsICcjMDA4Jyk7ICAvLyBCaW5kaW5nIGluZGV4OiAzMFxuICogYGBgXG4gKlxuICogVGhlIGNvcnJlY3QgcHJpb3JpdHkgb3JkZXIgb2YgY29uY2F0ZW5hdGlvbiBpczpcbiAqXG4gKiBgYGBcbiAqIC8vIE15Q29tcG9uZW50XG4gKiAgICAgybXJtXN0eWxlTWFwKHtjb2xvcjogJyMwMDMnfSk7ICAgLy8gQmluZGluZyBpbmRleDogMjBcbiAqICAgICDJtcm1c3R5bGVQcm9wKCdjb2xvcicsICcjMDA0Jyk7ICAvLyBCaW5kaW5nIGluZGV4OiAyMlxuICogLy8gU3R5bGUxRGlyZWN0aXZlXG4gKiAgICAgybXJtXN0eWxlTWFwKHtjb2xvcjogJyMwMDUnfSk7ICAgLy8gQmluZGluZyBpbmRleDogMjRcbiAqICAgICDJtcm1c3R5bGVQcm9wKCdjb2xvcicsICcjMDA2Jyk7ICAvLyBCaW5kaW5nIGluZGV4OiAyNlxuICogLy8gU3R5bGUyRGlyZWN0aXZlXG4gKiAgICAgybXJtXN0eWxlTWFwKHtjb2xvcjogJyMwMDcnfSk7ICAgLy8gQmluZGluZyBpbmRleDogMjhcbiAqICAgICDJtcm1c3R5bGVQcm9wKCdjb2xvcicsICcjMDA4Jyk7ICAvLyBCaW5kaW5nIGluZGV4OiAzMFxuICogLy8gVGVtcGxhdGU6IChFeGFtcGxlQ29tcG9uZW50KVxuICogICAgIMm1ybVzdHlsZU1hcCh7Y29sb3I6ICcjMDAxJ30pOyAgIC8vIEJpbmRpbmcgaW5kZXg6IDEwXG4gKiAgICAgybXJtXN0eWxlUHJvcCgnY29sb3InLCAnIzAwMicpOyAgLy8gQmluZGluZyBpbmRleDogMTJcbiAqIGBgYFxuICpcbiAqIFdoYXQgY29sb3Igc2hvdWxkIGJlIHJlbmRlcmVkP1xuICpcbiAqIE9uY2UgdGhlIGl0ZW1zIGFyZSBjb3JyZWN0bHkgc29ydGVkIGluIHRoZSBsaXN0LCB0aGUgYW5zd2VyIGlzIHNpbXBseSB0aGUgbGFzdCBpdGVtIGluIHRoZVxuICogY29uY2F0ZW5hdGlvbiBsaXN0IHdoaWNoIGlzIGAjMDAyYC5cbiAqXG4gKiBUbyBkbyBzbyB3ZSBrZWVwIGEgbGlua2VkIGxpc3Qgb2YgYWxsIG9mIHRoZSBiaW5kaW5ncyB3aGljaCBwZXJ0YWluIHRvIHRoaXMgZWxlbWVudC5cbiAqIE5vdGljZSB0aGF0IHRoZSBiaW5kaW5ncyBhcmUgaW5zZXJ0ZWQgaW4gdGhlIG9yZGVyIG9mIGV4ZWN1dGlvbiwgYnV0IHRoZSBgVFZpZXcuZGF0YWAgYWxsb3dzXG4gKiB1cyB0byB0cmF2ZXJzZSB0aGVtIGluIHRoZSBvcmRlciBvZiBwcmlvcml0eS5cbiAqXG4gKiB8SWR4fGBUVmlldy5kYXRhYHxgTFZpZXdgICAgICAgICAgIHwgTm90ZXNcbiAqIHwtLS18LS0tLS0tLS0tLS0tfC0tLS0tLS0tLS0tLS0tLS0tfC0tLS0tLS0tLS0tLS0tXG4gKiB8Li4ufCAgICAgICAgICAgIHwgICAgICAgICAgICAgICAgIHxcbiAqIHwxMCB8YG51bGxgICAgICAgfGB7Y29sb3I6ICcjMDAxJ31gfCBgybXJtXN0eWxlTWFwKCdjb2xvcicsIHtjb2xvcjogJyMwMDEnfSlgXG4gKiB8MTEgfGAzMCB8IDEyYCAgIHwgLi4uICAgICAgICAgICAgIHxcbiAqIHwxMiB8YGNvbG9yYCAgICAgfGAnIzAwMidgICAgICAgICAgfCBgybXJtXN0eWxlUHJvcCgnY29sb3InLCAnIzAwMicpYFxuICogfDEzIHxgMTAgfCAwYCAgICB8IC4uLiAgICAgICAgICAgICB8XG4gKiB8Li4ufCAgICAgICAgICAgIHwgICAgICAgICAgICAgICAgIHxcbiAqIHwyMCB8YG51bGxgICAgICAgfGB7Y29sb3I6ICcjMDAzJ31gfCBgybXJtXN0eWxlTWFwKCdjb2xvcicsIHtjb2xvcjogJyMwMDMnfSlgXG4gKiB8MjEgfGAwIHwgMjJgICAgIHwgLi4uICAgICAgICAgICAgIHxcbiAqIHwyMiB8YGNvbG9yYCAgICAgfGAnIzAwNCdgICAgICAgICAgfCBgybXJtXN0eWxlUHJvcCgnY29sb3InLCAnIzAwNCcpYFxuICogfDIzIHxgMjAgfCAyNGAgICB8IC4uLiAgICAgICAgICAgICB8XG4gKiB8MjQgfGBudWxsYCAgICAgIHxge2NvbG9yOiAnIzAwNSd9YHwgYMm1ybVzdHlsZU1hcCgnY29sb3InLCB7Y29sb3I6ICcjMDA1J30pYFxuICogfDI1IHxgMjIgfCAyNmAgICB8IC4uLiAgICAgICAgICAgICB8XG4gKiB8MjYgfGBjb2xvcmAgICAgIHxgJyMwMDYnYCAgICAgICAgIHwgYMm1ybVzdHlsZVByb3AoJ2NvbG9yJywgJyMwMDYnKWBcbiAqIHwyNyB8YDI0IHwgMjhgICAgfCAuLi4gICAgICAgICAgICAgfFxuICogfDI4IHxgbnVsbGAgICAgICB8YHtjb2xvcjogJyMwMDcnfWB8IGDJtcm1c3R5bGVNYXAoJ2NvbG9yJywge2NvbG9yOiAnIzAwNyd9KWBcbiAqIHwyOSB8YDI2IHwgMzBgICAgfCAuLi4gICAgICAgICAgICAgfFxuICogfDMwIHxgY29sb3JgICAgICB8YCcjMDA4J2AgICAgICAgICB8IGDJtcm1c3R5bGVQcm9wKCdjb2xvcicsICcjMDA4JylgXG4gKiB8MzEgfGAyOCB8IDEwYCAgIHwgLi4uICAgICAgICAgICAgIHxcbiAqXG4gKiBUaGUgYWJvdmUgZGF0YSBzdHJ1Y3R1cmUgYWxsb3dzIHVzIHRvIHJlLWNvbmNhdGVuYXRlIHRoZSBzdHlsaW5nIG5vIG1hdHRlciB3aGljaCBkYXRhIGJpbmRpbmdcbiAqIGNoYW5nZXMuXG4gKlxuICogTk9URTogaW4gYWRkaXRpb24gdG8ga2VlcGluZyB0cmFjayBvZiBuZXh0L3ByZXZpb3VzIGluZGV4IHRoZSBgVFZpZXcuZGF0YWAgYWxzbyBzdG9yZXMgcHJldi9uZXh0XG4gKiBkdXBsaWNhdGUgYml0LiBUaGUgZHVwbGljYXRlIGJpdCBpZiB0cnVlIHNheXMgdGhlcmUgZWl0aGVyIGlzIGEgYmluZGluZyB3aXRoIHRoZSBzYW1lIG5hbWUgb3JcbiAqIHRoZXJlIGlzIGEgbWFwICh3aGljaCBtYXkgY29udGFpbiB0aGUgbmFtZSkuIFRoaXMgaW5mb3JtYXRpb24gaXMgdXNlZnVsIGluIGtub3dpbmcgaWYgb3RoZXJcbiAqIHN0eWxlcyB3aXRoIGhpZ2hlciBwcmlvcml0eSBuZWVkIHRvIGJlIHNlYXJjaGVkIGZvciBvdmVyd3JpdGVzLlxuICpcbiAqIE5PVEU6IFNlZSBgc2hvdWxkIHN1cHBvcnQgZXhhbXBsZSBpbiAndG5vZGVfbGlua2VkX2xpc3QudHMnIGRvY3VtZW50YXRpb25gIGluXG4gKiBgdG5vZGVfbGlua2VkX2xpc3Rfc3BlYy50c2AgZm9yIHdvcmtpbmcgZXhhbXBsZS5cbiAqL1xuXG5cbi8qKlxuICogSW5zZXJ0IG5ldyBgdFN0eWxlVmFsdWVgIGF0IGBURGF0YWAgYW5kIGxpbmsgZXhpc3Rpbmcgc3R5bGUgYmluZGluZ3Mgc3VjaCB0aGF0IHdlIG1haW50YWluIGxpbmtlZFxuICogbGlzdCBvZiBzdHlsZXMgYW5kIGNvbXB1dGUgdGhlIGR1cGxpY2F0ZSBmbGFnLlxuICpcbiAqIE5vdGU6IHRoaXMgZnVuY3Rpb24gaXMgZXhlY3V0ZWQgZHVyaW5nIGBmaXJzdFVwZGF0ZVBhc3NgIG9ubHkgdG8gcG9wdWxhdGUgdGhlIGBUVmlldy5kYXRhYC5cbiAqXG4gKiBUaGUgZnVuY3Rpb24gd29ya3MgYnkga2VlcGluZyB0cmFjayBvZiBgdFN0eWxpbmdSYW5nZWAgd2hpY2ggY29udGFpbnMgdHdvIHBvaW50ZXJzIHBvaW50aW5nIHRvXG4gKiB0aGUgaGVhZC90YWlsIG9mIHRoZSB0ZW1wbGF0ZSBwb3J0aW9uIG9mIHRoZSBzdHlsZXMuXG4gKiAgLSBpZiBgaXNIb3N0ID09PSBmYWxzZWAgKHdlIGFyZSB0ZW1wbGF0ZSkgdGhlbiBpbnNlcnRpb24gaXMgYXQgdGFpbCBvZiBgVFN0eWxpbmdSYW5nZWBcbiAqICAtIGlmIGBpc0hvc3QgPT09IHRydWVgICh3ZSBhcmUgaG9zdCBiaW5kaW5nKSB0aGVuIGluc2VydGlvbiBpcyBhdCBoZWFkIG9mIGBUU3R5bGluZ1JhbmdlYFxuICpcbiAqIEBwYXJhbSB0RGF0YSBUaGUgYFREYXRhYCB0byBpbnNlcnQgaW50by5cbiAqIEBwYXJhbSB0Tm9kZSBgVE5vZGVgIGFzc29jaWF0ZWQgd2l0aCB0aGUgc3R5bGluZyBlbGVtZW50LlxuICogQHBhcmFtIHRTdHlsaW5nS2V5IFNlZSBgVFN0eWxpbmdLZXlgLlxuICogQHBhcmFtIGluZGV4IGxvY2F0aW9uIG9mIHdoZXJlIGB0U3R5bGVWYWx1ZWAgc2hvdWxkIGJlIHN0b3JlZCAoYW5kIGxpbmtlZCBpbnRvIGxpc3QuKVxuICogQHBhcmFtIGlzSG9zdEJpbmRpbmcgYHRydWVgIGlmIHRoZSBpbnNlcnRpb24gaXMgZm9yIGEgYGhvc3RCaW5kaW5nYC4gKGluc2VydGlvbiBpcyBpbiBmcm9udCBvZlxuICogICAgICAgICAgICAgICB0ZW1wbGF0ZS4pXG4gKiBAcGFyYW0gaXNDbGFzc0JpbmRpbmcgVHJ1ZSBpZiB0aGUgYXNzb2NpYXRlZCBgdFN0eWxpbmdLZXlgIGFzIGEgYGNsYXNzYCBzdHlsaW5nLlxuICogICAgICAgICAgICAgICAgICAgICAgIGB0Tm9kZS5jbGFzc0JpbmRpbmdzYCBzaG91bGQgYmUgdXNlZCAob3IgYHROb2RlLnN0eWxlQmluZGluZ3NgIG90aGVyd2lzZS4pXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbnNlcnRUU3R5bGluZ0JpbmRpbmcoXG4gICAgdERhdGE6IFREYXRhLCB0Tm9kZTogVE5vZGUsIHRTdHlsaW5nS2V5OiBUU3R5bGluZ0tleSwgaW5kZXg6IG51bWJlciwgaXNIb3N0QmluZGluZzogYm9vbGVhbixcbiAgICBpc0NsYXNzQmluZGluZzogYm9vbGVhbik6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RXF1YWwoXG4gICAgICAgICAgICAgICAgICAgZ2V0TFZpZXcoKVtUVklFV10uZmlyc3RVcGRhdGVQYXNzLCB0cnVlLFxuICAgICAgICAgICAgICAgICAgICdTaG91bGQgYmUgY2FsbGVkIGR1cmluZyBcXCdmaXJzdFVwZGF0ZVBhc3NgIG9ubHkuJyk7XG4gIGxldCB0QmluZGluZ3MgPSBpc0NsYXNzQmluZGluZyA/IHROb2RlLmNsYXNzQmluZGluZ3MgOiB0Tm9kZS5zdHlsZUJpbmRpbmdzO1xuICBsZXQgdG1wbEhlYWQgPSBnZXRUU3R5bGluZ1JhbmdlUHJldih0QmluZGluZ3MpO1xuICBsZXQgdG1wbFRhaWwgPSBnZXRUU3R5bGluZ1JhbmdlTmV4dCh0QmluZGluZ3MpO1xuXG4gIHREYXRhW2luZGV4XSA9IHRTdHlsaW5nS2V5O1xuICBpZiAoaXNIb3N0QmluZGluZykge1xuICAgIC8vIFdlIGFyZSBpbnNlcnRpbmcgaG9zdCBiaW5kaW5nc1xuXG4gICAgLy8gSWYgd2UgZG9uJ3QgaGF2ZSB0ZW1wbGF0ZSBiaW5kaW5ncyB0aGVuIGB0YWlsYCBpcyAwLlxuICAgIGNvbnN0IGhhc1RlbXBsYXRlQmluZGluZ3MgPSB0bXBsVGFpbCAhPT0gMDtcbiAgICAvLyBUaGlzIGlzIGltcG9ydGFudCB0byBrbm93IGJlY2F1c2UgdGhhdCBtZWFucyB0aGF0IHRoZSBgaGVhZGAgY2FuJ3QgcG9pbnQgdG8gdGhlIGZpcnN0XG4gICAgLy8gdGVtcGxhdGUgYmluZGluZ3MgKHRoZXJlIGFyZSBub25lLikgSW5zdGVhZCB0aGUgaGVhZCBwb2ludHMgdG8gdGhlIHRhaWwgb2YgdGhlIHRlbXBsYXRlLlxuICAgIGlmIChoYXNUZW1wbGF0ZUJpbmRpbmdzKSB7XG4gICAgICAvLyB0ZW1wbGF0ZSBoZWFkJ3MgXCJwcmV2XCIgd2lsbCBwb2ludCB0byBsYXN0IGhvc3QgYmluZGluZyBvciB0byAwIGlmIG5vIGhvc3QgYmluZGluZ3MgeWV0XG4gICAgICBjb25zdCBwcmV2aW91c05vZGUgPSBnZXRUU3R5bGluZ1JhbmdlUHJldih0RGF0YVt0bXBsSGVhZCArIDFdIGFzIFRTdHlsaW5nUmFuZ2UpO1xuICAgICAgdERhdGFbaW5kZXggKyAxXSA9IHRvVFN0eWxpbmdSYW5nZShwcmV2aW91c05vZGUsIHRtcGxIZWFkKTtcbiAgICAgIC8vIGlmIGEgaG9zdCBiaW5kaW5nIGhhcyBhbHJlYWR5IGJlZW4gcmVnaXN0ZXJlZCwgd2UgbmVlZCB0byB1cGRhdGUgdGhlIG5leHQgb2YgdGhhdCBob3N0XG4gICAgICAvLyBiaW5kaW5nIHRvIHBvaW50IHRvIHRoaXMgb25lXG4gICAgICBpZiAocHJldmlvdXNOb2RlICE9PSAwKSB7XG4gICAgICAgIC8vIFdlIG5lZWQgdG8gdXBkYXRlIHRoZSB0ZW1wbGF0ZS10YWlsIHZhbHVlIHRvIHBvaW50IHRvIHVzLlxuICAgICAgICB0RGF0YVtwcmV2aW91c05vZGUgKyAxXSA9XG4gICAgICAgICAgICBzZXRUU3R5bGluZ1JhbmdlTmV4dCh0RGF0YVtwcmV2aW91c05vZGUgKyAxXSBhcyBUU3R5bGluZ1JhbmdlLCBpbmRleCk7XG4gICAgICB9XG4gICAgICAvLyBUaGUgXCJwcmV2aW91c1wiIG9mIHRoZSB0ZW1wbGF0ZSBiaW5kaW5nIGhlYWQgc2hvdWxkIHBvaW50IHRvIHRoaXMgaG9zdCBiaW5kaW5nXG4gICAgICB0RGF0YVt0bXBsSGVhZCArIDFdID0gc2V0VFN0eWxpbmdSYW5nZVByZXYodERhdGFbdG1wbEhlYWQgKyAxXSBhcyBUU3R5bGluZ1JhbmdlLCBpbmRleCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHREYXRhW2luZGV4ICsgMV0gPSB0b1RTdHlsaW5nUmFuZ2UodG1wbEhlYWQsIDApO1xuICAgICAgLy8gaWYgYSBob3N0IGJpbmRpbmcgaGFzIGFscmVhZHkgYmVlbiByZWdpc3RlcmVkLCB3ZSBuZWVkIHRvIHVwZGF0ZSB0aGUgbmV4dCBvZiB0aGF0IGhvc3RcbiAgICAgIC8vIGJpbmRpbmcgdG8gcG9pbnQgdG8gdGhpcyBvbmVcbiAgICAgIGlmICh0bXBsSGVhZCAhPT0gMCkge1xuICAgICAgICAvLyBXZSBuZWVkIHRvIHVwZGF0ZSB0aGUgdGVtcGxhdGUtdGFpbCB2YWx1ZSB0byBwb2ludCB0byB1cy5cbiAgICAgICAgdERhdGFbdG1wbEhlYWQgKyAxXSA9IHNldFRTdHlsaW5nUmFuZ2VOZXh0KHREYXRhW3RtcGxIZWFkICsgMV0gYXMgVFN0eWxpbmdSYW5nZSwgaW5kZXgpO1xuICAgICAgfVxuICAgICAgLy8gaWYgd2UgZG9uJ3QgaGF2ZSB0ZW1wbGF0ZSwgdGhlIGhlYWQgcG9pbnRzIHRvIHRlbXBsYXRlLXRhaWwsIGFuZCBuZWVkcyB0byBiZSBhZHZhbmNlZC5cbiAgICAgIHRtcGxIZWFkID0gaW5kZXg7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIC8vIFdlIGFyZSBpbnNlcnRpbmcgaW4gdGVtcGxhdGUgc2VjdGlvbi5cbiAgICAvLyBXZSBuZWVkIHRvIHNldCB0aGlzIGJpbmRpbmcncyBcInByZXZpb3VzXCIgdG8gdGhlIGN1cnJlbnQgdGVtcGxhdGUgdGFpbFxuICAgIHREYXRhW2luZGV4ICsgMV0gPSB0b1RTdHlsaW5nUmFuZ2UodG1wbFRhaWwsIDApO1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnRFcXVhbChcbiAgICAgICAgICAgICAgICAgICAgIHRtcGxIZWFkICE9PSAwICYmIHRtcGxUYWlsID09PSAwLCBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgICdBZGRpbmcgdGVtcGxhdGUgYmluZGluZ3MgYWZ0ZXIgaG9zdEJpbmRpbmdzIGlzIG5vdCBhbGxvd2VkLicpO1xuICAgIGlmICh0bXBsSGVhZCA9PT0gMCkge1xuICAgICAgdG1wbEhlYWQgPSBpbmRleDtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gV2UgbmVlZCB0byB1cGRhdGUgdGhlIHByZXZpb3VzIHZhbHVlIFwibmV4dFwiIHRvIHBvaW50IHRvIHRoaXMgYmluZGluZ1xuICAgICAgdERhdGFbdG1wbFRhaWwgKyAxXSA9IHNldFRTdHlsaW5nUmFuZ2VOZXh0KHREYXRhW3RtcGxUYWlsICsgMV0gYXMgVFN0eWxpbmdSYW5nZSwgaW5kZXgpO1xuICAgIH1cbiAgICB0bXBsVGFpbCA9IGluZGV4O1xuICB9XG5cbiAgLy8gTm93IHdlIG5lZWQgdG8gdXBkYXRlIC8gY29tcHV0ZSB0aGUgZHVwbGljYXRlcy5cbiAgLy8gU3RhcnRpbmcgd2l0aCBvdXIgbG9jYXRpb24gc2VhcmNoIHRvd2FyZHMgaGVhZCAobGVhc3QgcHJpb3JpdHkpXG4gIG1hcmtEdXBsaWNhdGVzKHREYXRhLCB0U3R5bGluZ0tleSwgaW5kZXgsIGlzQ2xhc3NCaW5kaW5nID8gdE5vZGUuY2xhc3NlcyA6IHROb2RlLnN0eWxlcywgdHJ1ZSk7XG4gIG1hcmtEdXBsaWNhdGVzKHREYXRhLCB0U3R5bGluZ0tleSwgaW5kZXgsIG51bGwsIGZhbHNlKTtcblxuICB0QmluZGluZ3MgPSB0b1RTdHlsaW5nUmFuZ2UodG1wbEhlYWQsIHRtcGxUYWlsKTtcbiAgaWYgKGlzQ2xhc3NCaW5kaW5nKSB7XG4gICAgdE5vZGUuY2xhc3NCaW5kaW5ncyA9IHRCaW5kaW5ncztcbiAgfSBlbHNlIHtcbiAgICB0Tm9kZS5zdHlsZUJpbmRpbmdzID0gdEJpbmRpbmdzO1xuICB9XG59XG5cbi8qKlxuICogTWFya3MgYFRTdHlsZVZhbHVlYHMgYXMgZHVwbGljYXRlcyBpZiBhbm90aGVyIHN0eWxlIGJpbmRpbmcgaW4gdGhlIGxpc3QgaGFzIHRoZSBzYW1lXG4gKiBgVFN0eWxlVmFsdWVgLlxuICpcbiAqIE5PVEU6IHRoaXMgZnVuY3Rpb24gaXMgaW50ZW5kZWQgdG8gYmUgY2FsbGVkIHR3aWNlIG9uY2Ugd2l0aCBgaXNQcmV2RGlyYCBzZXQgdG8gYHRydWVgIGFuZCBvbmNlXG4gKiB3aXRoIGl0IHNldCB0byBgZmFsc2VgIHRvIHNlYXJjaCBib3RoIHRoZSBwcmV2aW91cyBhcyB3ZWxsIGFzIG5leHQgaXRlbXMgaW4gdGhlIGxpc3QuXG4gKlxuICogTm8gZHVwbGljYXRlIGNhc2VcbiAqIGBgYFxuICogICBbc3R5bGUuY29sb3JdXG4gKiAgIFtzdHlsZS53aWR0aC5weF0gPDwtIGluZGV4XG4gKiAgIFtzdHlsZS5oZWlnaHQucHhdXG4gKiBgYGBcbiAqXG4gKiBJbiB0aGUgYWJvdmUgY2FzZSBhZGRpbmcgYFtzdHlsZS53aWR0aC5weF1gIHRvIHRoZSBleGlzdGluZyBgW3N0eWxlLmNvbG9yXWAgcHJvZHVjZXMgbm9cbiAqIGR1cGxpY2F0ZXMgYmVjYXVzZSBgd2lkdGhgIGlzIG5vdCBmb3VuZCBpbiBhbnkgb3RoZXIgcGFydCBvZiB0aGUgbGlua2VkIGxpc3QuXG4gKlxuICogRHVwbGljYXRlIGNhc2VcbiAqIGBgYFxuICogICBbc3R5bGUuY29sb3JdXG4gKiAgIFtzdHlsZS53aWR0aC5lbV1cbiAqICAgW3N0eWxlLndpZHRoLnB4XSA8PC0gaW5kZXhcbiAqIGBgYFxuICogSW4gdGhlIGFib3ZlIGNhc2UgYWRkaW5nIGBbc3R5bGUud2lkdGgucHhdYCB3aWxsIHByb2R1Y2UgYSBkdXBsaWNhdGUgd2l0aCBgW3N0eWxlLndpZHRoLmVtXWBcbiAqIGJlY2F1c2UgYHdpZHRoYCBpcyBmb3VuZCBpbiB0aGUgY2hhaW4uXG4gKlxuICogTWFwIGNhc2UgMVxuICogYGBgXG4gKiAgIFtzdHlsZS53aWR0aC5weF1cbiAqICAgW3N0eWxlLmNvbG9yXVxuICogICBbc3R5bGVdICA8PC0gaW5kZXhcbiAqIGBgYFxuICogSW4gdGhlIGFib3ZlIGNhc2UgYWRkaW5nIGBbc3R5bGVdYCB3aWxsIHByb2R1Y2UgYSBkdXBsaWNhdGUgd2l0aCBhbnkgb3RoZXIgYmluZGluZ3MgYmVjYXVzZVxuICogYFtzdHlsZV1gIGlzIGEgTWFwIGFuZCBhcyBzdWNoIGlzIGZ1bGx5IGR5bmFtaWMgYW5kIGNvdWxkIHByb2R1Y2UgYGNvbG9yYCBvciBgd2lkdGhgLlxuICpcbiAqIE1hcCBjYXNlIDJcbiAqIGBgYFxuICogICBbc3R5bGVdXG4gKiAgIFtzdHlsZS53aWR0aC5weF1cbiAqICAgW3N0eWxlLmNvbG9yXSAgPDwtIGluZGV4XG4gKiBgYGBcbiAqIEluIHRoZSBhYm92ZSBjYXNlIGFkZGluZyBgW3N0eWxlLmNvbG9yXWAgd2lsbCBwcm9kdWNlIGEgZHVwbGljYXRlIGJlY2F1c2UgdGhlcmUgaXMgYWxyZWFkeSBhXG4gKiBgW3N0eWxlXWAgYmluZGluZyB3aGljaCBpcyBhIE1hcCBhbmQgYXMgc3VjaCBpcyBmdWxseSBkeW5hbWljIGFuZCBjb3VsZCBwcm9kdWNlIGBjb2xvcmAgb3JcbiAqIGB3aWR0aGAuXG4gKlxuICogTk9URTogT25jZSBgW3N0eWxlXWAgKE1hcCkgaXMgYWRkZWQgaW50byB0aGUgc3lzdGVtIGFsbCB0aGluZ3MgYXJlIG1hcHBlZCBhcyBkdXBsaWNhdGVzLlxuICogTk9URTogV2UgdXNlIGBzdHlsZWAgYXMgZXhhbXBsZSwgYnV0IHNhbWUgbG9naWMgaXMgYXBwbGllZCB0byBgY2xhc3NgZXMgYXMgd2VsbC5cbiAqXG4gKiBAcGFyYW0gdERhdGFcbiAqIEBwYXJhbSB0U3R5bGluZ0tleVxuICogQHBhcmFtIGluZGV4XG4gKiBAcGFyYW0gc3RhdGljVmFsdWVzXG4gKiBAcGFyYW0gaXNQcmV2RGlyXG4gKi9cbmZ1bmN0aW9uIG1hcmtEdXBsaWNhdGVzKFxuICAgIHREYXRhOiBURGF0YSwgdFN0eWxpbmdLZXk6IFRTdHlsaW5nS2V5LCBpbmRleDogbnVtYmVyLCBzdGF0aWNWYWx1ZXM6IFN0eWxpbmdNYXBBcnJheSB8IG51bGwsXG4gICAgaXNQcmV2RGlyOiBib29sZWFuKSB7XG4gIGNvbnN0IHRTdHlsaW5nQXRJbmRleCA9IHREYXRhW2luZGV4ICsgMV0gYXMgVFN0eWxpbmdSYW5nZTtcbiAgY29uc3Qga2V5OiBzdHJpbmd8bnVsbCA9IHR5cGVvZiB0U3R5bGluZ0tleSA9PT0gJ29iamVjdCcgPyB0U3R5bGluZ0tleS5rZXkgOiB0U3R5bGluZ0tleTtcbiAgY29uc3QgaXNNYXAgPSBrZXkgPT09IG51bGw7XG4gIGxldCBjdXJzb3IgPVxuICAgICAgaXNQcmV2RGlyID8gZ2V0VFN0eWxpbmdSYW5nZVByZXYodFN0eWxpbmdBdEluZGV4KSA6IGdldFRTdHlsaW5nUmFuZ2VOZXh0KHRTdHlsaW5nQXRJbmRleCk7XG4gIGxldCBmb3VuZER1cGxpY2F0ZSA9IGZhbHNlO1xuICAvLyBXZSBrZWVwIGl0ZXJhdGluZyBhcyBsb25nIGFzIHdlIGhhdmUgYSBjdXJzb3JcbiAgLy8gQU5EIGVpdGhlcjogV2UgZm91bmQgd2hhdCB3ZSBhcmUgbG9va2luZyBmb3IsIG9yIHdlIGFyZSBhIG1hcCBpbiB3aGljaCBjYXNlIHdlIGhhdmUgdG9cbiAgLy8gY29udGludWUgc2VhcmNoaW5nIGV2ZW4gYWZ0ZXIgd2UgZmluZCB3aGF0IHdlIHdlcmUgbG9va2luZyBmb3Igc2luY2Ugd2UgYXJlIGEgd2lsZCBjYXJkXG4gIC8vIGFuZCBldmVyeXRoaW5nIG5lZWRzIHRvIGJlIGZsaXBwZWQgdG8gZHVwbGljYXRlLlxuICB3aGlsZSAoY3Vyc29yICE9PSAwICYmIChmb3VuZER1cGxpY2F0ZSA9PT0gZmFsc2UgfHwgaXNNYXApKSB7XG4gICAgY29uc3QgdFN0eWxpbmdWYWx1ZUF0Q3Vyc29yID0gdERhdGFbY3Vyc29yXSBhcyBUU3R5bGluZ0tleTtcbiAgICBjb25zdCB0U3R5bGVSYW5nZUF0Q3Vyc29yID0gdERhdGFbY3Vyc29yICsgMV0gYXMgVFN0eWxpbmdSYW5nZTtcbiAgICBjb25zdCBrZXlBdEN1cnNvciA9IHR5cGVvZiB0U3R5bGluZ1ZhbHVlQXRDdXJzb3IgPT09ICdvYmplY3QnID8gdFN0eWxpbmdWYWx1ZUF0Q3Vyc29yLmtleSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRTdHlsaW5nVmFsdWVBdEN1cnNvcjtcbiAgICBpZiAoa2V5QXRDdXJzb3IgPT09IG51bGwgfHwga2V5ID09IG51bGwgfHwga2V5QXRDdXJzb3IgPT09IGtleSkge1xuICAgICAgZm91bmREdXBsaWNhdGUgPSB0cnVlO1xuICAgICAgdERhdGFbY3Vyc29yICsgMV0gPSBpc1ByZXZEaXIgPyBzZXRUU3R5bGluZ1JhbmdlTmV4dER1cGxpY2F0ZSh0U3R5bGVSYW5nZUF0Q3Vyc29yKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldFRTdHlsaW5nUmFuZ2VQcmV2RHVwbGljYXRlKHRTdHlsZVJhbmdlQXRDdXJzb3IpO1xuICAgIH1cbiAgICBjdXJzb3IgPSBpc1ByZXZEaXIgPyBnZXRUU3R5bGluZ1JhbmdlUHJldih0U3R5bGVSYW5nZUF0Q3Vyc29yKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgZ2V0VFN0eWxpbmdSYW5nZU5leHQodFN0eWxlUmFuZ2VBdEN1cnNvcik7XG4gIH1cbiAgaWYgKHN0YXRpY1ZhbHVlcyAhPT0gbnVsbCAmJiAgLy8gSWYgd2UgaGF2ZSBzdGF0aWMgdmFsdWVzIHRvIHNlYXJjaFxuICAgICAgIWZvdW5kRHVwbGljYXRlICAgICAgICAgICAvLyBJZiB3ZSBoYXZlIGR1cGxpY2F0ZSBkb24ndCBib3RoZXIgc2luY2Ugd2UgYXJlIGFscmVhZHkgbWFya2VkIGFzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGR1cGxpY2F0ZVxuICAgICAgKSB7XG4gICAgaWYgKGlzTWFwKSB7XG4gICAgICAvLyBpZiB3ZSBhcmUgYSBNYXAgKGFuZCB3ZSBoYXZlIHN0YXRpY3MpIHdlIG11c3QgYXNzdW1lIGR1cGxpY2F0ZVxuICAgICAgZm91bmREdXBsaWNhdGUgPSB0cnVlO1xuICAgIH0gZWxzZSB7XG4gICAgICBmb3IgKGxldCBpID0gMTsgZm91bmREdXBsaWNhdGUgPT09IGZhbHNlICYmIGkgPCBzdGF0aWNWYWx1ZXMubGVuZ3RoOyBpID0gaSArIDIpIHtcbiAgICAgICAgaWYgKHN0YXRpY1ZhbHVlc1tpXSA9PT0ga2V5KSB7XG4gICAgICAgICAgZm91bmREdXBsaWNhdGUgPSB0cnVlO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG4gIGlmIChmb3VuZER1cGxpY2F0ZSkge1xuICAgIHREYXRhW2luZGV4ICsgMV0gPSBpc1ByZXZEaXIgPyBzZXRUU3R5bGluZ1JhbmdlUHJldkR1cGxpY2F0ZSh0U3R5bGluZ0F0SW5kZXgpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0VFN0eWxpbmdSYW5nZU5leHREdXBsaWNhdGUodFN0eWxpbmdBdEluZGV4KTtcbiAgfVxufVxuXG4vKipcbiAqIENvbXB1dGVzIHRoZSBuZXcgc3R5bGluZyB2YWx1ZSBzdGFydGluZyBhdCBgaW5kZXhgIHN0eWxpbmcgYmluZGluZy5cbiAqXG4gKiBAcGFyYW0gdERhdGEgYFREYXRhYCBjb250YWluaW5nIHRoZSBzdHlsaW5nIGJpbmRpbmcgbGlua2VkIGxpc3QuXG4gKiAgICAgICAgICAgICAgLSBgVERhdGFbaW5kZXhdYCBjb250YWlucyB0aGUgYmluZGluZyBuYW1lLlxuICogICAgICAgICAgICAgIC0gYFREYXRhW2luZGV4ICsgMV1gIGNvbnRhaW5zIHRoZSBgVFN0eWxpbmdSYW5nZWAgYSBsaW5rZWQgbGlzdCBvZiBvdGhlciBiaW5kaW5ncy5cbiAqIEBwYXJhbSB0Tm9kZSBgVE5vZGVgIGNvbnRhaW5pbmcgdGhlIGluaXRpYWwgc3R5bGluZyB2YWx1ZXMuXG4gKiBAcGFyYW0gbFZpZXcgYExWaWV3YCBjb250YWluaW5nIHRoZSBzdHlsaW5nIHZhbHVlcy5cbiAqICAgICAgICAgICAgICAtIGBMVmlld1tpbmRleF1gIGNvbnRhaW5zIHRoZSBiaW5kaW5nIHZhbHVlLlxuICogICAgICAgICAgICAgIC0gYExWaWV3W2luZGV4ICsgMV1gIGNvbnRhaW5zIHRoZSBjb25jYXRlbmF0ZWQgdmFsdWUgdXAgdG8gdGhpcyBwb2ludC5cbiAqIEBwYXJhbSBpbmRleCB0aGUgbG9jYXRpb24gaW4gYFREYXRhYC9gTFZpZXdgIHdoZXJlIHRoZSBzdHlsaW5nIHNlYXJjaCBzaG91bGQgc3RhcnQuXG4gKiBAcGFyYW0gaXNDbGFzc0JpbmRpbmcgYHRydWVgIGlmIGJpbmRpbmcgdG8gYGNsYXNzTmFtZWA7IGBmYWxzZWAgd2hlbiBiaW5kaW5nIHRvIGBzdHlsZWAuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBmbHVzaFN0eWxlQmluZGluZyhcbiAgICB0RGF0YTogVERhdGEsIHROb2RlOiBUTm9kZSwgbFZpZXc6IExWaWV3LCBpbmRleDogbnVtYmVyLCBpc0NsYXNzQmluZGluZzogYm9vbGVhbik6IHN0cmluZyB7XG4gIGNvbnN0IHRTdHlsaW5nUmFuZ2VBdEluZGV4ID0gdERhdGFbaW5kZXggKyAxXSBhcyBUU3R5bGluZ1JhbmdlO1xuICAvLyBXaGVuIHN0eWxpbmcgY2hhbmdlcyB3ZSBkb24ndCBoYXZlIHRvIHN0YXJ0IGF0IHRoZSBiZWdnaW5nLiBJbnN0ZWFkIHdlIHN0YXJ0IGF0IHRoZSBjaGFuZ2VcbiAgLy8gdmFsdWUgYW5kIGxvb2sgdXAgdGhlIHByZXZpb3VzIGNvbmNhdGVuYXRpb24gYXMgYSBzdGFydGluZyBwb2ludCBnb2luZyBmb3J3YXJkLlxuICBjb25zdCBsYXN0VW5jaGFuZ2VkVmFsdWVJbmRleCA9IGdldFRTdHlsaW5nUmFuZ2VQcmV2KHRTdHlsaW5nUmFuZ2VBdEluZGV4KTtcbiAgbGV0IHRleHQgPSBsYXN0VW5jaGFuZ2VkVmFsdWVJbmRleCA9PT0gMCA/IGdldFN0YXRpY1N0eWxpbmdWYWx1ZSh0Tm9kZSwgaXNDbGFzc0JpbmRpbmcpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxWaWV3W2xhc3RVbmNoYW5nZWRWYWx1ZUluZGV4ICsgMV0gYXMgc3RyaW5nO1xuICBsZXQgY3Vyc29yID0gaW5kZXg7XG4gIHdoaWxlIChjdXJzb3IgIT09IDApIHtcbiAgICBjb25zdCB2YWx1ZSA9IGxWaWV3W2N1cnNvcl07XG4gICAgY29uc3Qga2V5ID0gdERhdGFbY3Vyc29yXSBhcyBUU3R5bGluZ0tleTtcbiAgICBjb25zdCBzdHlsaW5nUmFuZ2UgPSB0RGF0YVtjdXJzb3IgKyAxXSBhcyBUU3R5bGluZ1JhbmdlO1xuICAgIGxWaWV3W2N1cnNvciArIDFdID0gdGV4dCA9IGFwcGVuZFN0eWxpbmcoXG4gICAgICAgIHRleHQsIGtleSwgdmFsdWUsIG51bGwsIGdldFRTdHlsaW5nUmFuZ2VQcmV2RHVwbGljYXRlKHN0eWxpbmdSYW5nZSksIGlzQ2xhc3NCaW5kaW5nKTtcbiAgICBjdXJzb3IgPSBnZXRUU3R5bGluZ1JhbmdlTmV4dChzdHlsaW5nUmFuZ2UpO1xuICB9XG4gIHJldHVybiB0ZXh0O1xufVxuXG4vKipcbiAqIFJldHJpZXZlcyB0aGUgc3RhdGljIHZhbHVlIGZvciBzdHlsaW5nLlxuICpcbiAqIEBwYXJhbSB0Tm9kZVxuICogQHBhcmFtIGlzQ2xhc3NCaW5kaW5nXG4gKi9cbmZ1bmN0aW9uIGdldFN0YXRpY1N0eWxpbmdWYWx1ZSh0Tm9kZTogVE5vZGUsIGlzQ2xhc3NCaW5kaW5nOiBCb29sZWFuKSB7XG4gIC8vIFRPRE8obWlza28pOiBpbXBsZW1lbnQgb25jZSB3ZSBoYXZlIG1vcmUgY29kZSBpbnRlZ3JhdGVkLlxuICByZXR1cm4gJyc7XG59XG5cbi8qKlxuICogQXBwZW5kIG5ldyBzdHlsaW5nIHRvIHRoZSBjdXJyZW50bHkgY29uY2F0ZW5hdGVkIHN0eWxpbmcgdGV4dC5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIGNvbmNhdGVuYXRlcyB0aGUgZXhpc3RpbmcgYGNsYXNzTmFtZWAvYGNzc1RleHRgIHRleHQgd2l0aCB0aGUgYmluZGluZyB2YWx1ZS5cbiAqXG4gKiBAcGFyYW0gdGV4dCBUZXh0IHRvIGNvbmNhdGVuYXRlIHRvLlxuICogQHBhcmFtIHN0eWxpbmdLZXkgYFRTdHlsaW5nS2V5YCBob2xkaW5nIHRoZSBrZXkgKGNsYXNzTmFtZSBvciBzdHlsZSBwcm9wZXJ0eSBuYW1lKS5cbiAqIEBwYXJhbSB2YWx1ZSBUaGUgdmFsdWUgZm9yIHRoZSBrZXkuXG4gKiAgICAgICAgIC0gYGlzQ2xhc3NCaW5kaW5nID09PSB0cnVlYFxuICogICAgICAgICAgICAgIC0gYGJvb2xlYW5gIGlmIGB0cnVlYCB0aGVuIGFkZCB0aGUga2V5IHRvIHRoZSBjbGFzcyBsaXN0IHN0cmluZy5cbiAqICAgICAgICAgICAgICAtIGBBcnJheWAgYWRkIGVhY2ggc3RyaW5nIHZhbHVlIHRvIHRoZSBjbGFzcyBsaXN0IHN0cmluZy5cbiAqICAgICAgICAgICAgICAtIGBPYmplY3RgIGFkZCBvYmplY3Qga2V5IHRvIHRoZSBjbGFzcyBsaXN0IHN0cmluZyBpZiB0aGUga2V5IHZhbHVlIGlzIHRydXRoeS5cbiAqICAgICAgICAgLSBgaXNDbGFzc0JpbmRpbmcgPT09IGZhbHNlYFxuICogICAgICAgICAgICAgIC0gYEFycmF5YCBOb3Qgc3VwcG9ydGVkLlxuICogICAgICAgICAgICAgIC0gYE9iamVjdGAgYWRkIG9iamVjdCBrZXkvdmFsdWUgdG8gdGhlIHN0eWxlcy5cbiAqIEBwYXJhbSBzYW5pdGl6ZXIgT3B0aW9uYWwgc2FuaXRpemVyIHRvIHVzZS4gSWYgYG51bGxgIHRoZSBgc3R5bGluZ0tleWAgc2FuaXRpemVyIHdpbGwgYmUgdXNlZC5cbiAqICAgICAgICBUaGlzIGlzIHByb3ZpZGVkIHNvIHRoYXQgYMm1ybVzdHlsZU1hcCgpYC9gybXJtWNsYXNzTWFwKClgIGNhbiByZWN1cnNpdmVseSBjYWxsXG4gKiAgICAgICAgYGFwcGVuZFN0eWxpbmdgIHdpdGhvdXQgaGF2aW5nIHRhIHBhY2thZ2UgdGhlIHNhbml0aXplciBpbnRvIGBUU3R5bGluZ1Nhbml0aXphdGlvbktleWAuXG4gKiBAcGFyYW0gaGFzUHJldmlvdXNEdXBsaWNhdGUgZGV0ZXJtaW5lcyBpZiB0aGVyZSBpcyBhIGNoYW5jZSBvZiBkdXBsaWNhdGUuXG4gKiAgICAgICAgIC0gYHRydWVgIHRoZSBleGlzdGluZyBgdGV4dGAgc2hvdWxkIGJlIHNlYXJjaGVkIGZvciBkdXBsaWNhdGVzIGFuZCBpZiBhbnkgZm91bmQgdGhleVxuICogICAgICAgICAgIHNob3VsZCBiZSByZW1vdmVkLlxuICogICAgICAgICAtIGBmYWxzZWAgRmFzdCBwYXRoLCBqdXN0IGNvbmNhdGVuYXRlIHRoZSBzdHJpbmdzLlxuICogQHBhcmFtIGlzQ2xhc3NCaW5kaW5nIERldGVybWluZXMgaWYgdGhlIGB0ZXh0YCBpcyBgY2xhc3NOYW1lYCBvciBgY3NzVGV4dGAuXG4gKiBAcmV0dXJucyBuZXcgc3R5bGluZyBzdHJpbmcgd2l0aCB0aGUgY29uY2F0ZW5hdGVkIHZhbHVlcy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFwcGVuZFN0eWxpbmcoXG4gICAgdGV4dDogc3RyaW5nLCBzdHlsaW5nS2V5OiBUU3R5bGluZ0tleSwgdmFsdWU6IGFueSwgc2FuaXRpemVyOiBTYW5pdGl6ZXJGbiB8IG51bGwsXG4gICAgaGFzUHJldmlvdXNEdXBsaWNhdGU6IGJvb2xlYW4sIGlzQ2xhc3NCaW5kaW5nOiBib29sZWFuKTogc3RyaW5nIHtcbiAgbGV0IGtleTogc3RyaW5nO1xuICBsZXQgc3VmZml4T3JTYW5pdGl6ZXI6IHN0cmluZ3xTYW5pdGl6ZXJGbnx1bmRlZmluZWR8bnVsbCA9IHNhbml0aXplcjtcbiAgaWYgKHR5cGVvZiBzdHlsaW5nS2V5ID09PSAnb2JqZWN0Jykge1xuICAgIGlmIChzdHlsaW5nS2V5LmtleSA9PT0gbnVsbCkge1xuICAgICAgcmV0dXJuIHZhbHVlICE9IG51bGwgPyBzdHlsaW5nS2V5LmV4dHJhKHRleHQsIHZhbHVlLCBoYXNQcmV2aW91c0R1cGxpY2F0ZSkgOiB0ZXh0O1xuICAgIH0gZWxzZSB7XG4gICAgICBzdWZmaXhPclNhbml0aXplciA9IHN0eWxpbmdLZXkuZXh0cmE7XG4gICAgICBrZXkgPSBzdHlsaW5nS2V5LmtleTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAga2V5ID0gc3R5bGluZ0tleTtcbiAgfVxuICBpZiAoaXNDbGFzc0JpbmRpbmcpIHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RXF1YWwodHlwZW9mIHN0eWxpbmdLZXkgPT09ICdzdHJpbmcnLCB0cnVlLCAnRXhwZWN0aW5nIGtleSB0byBiZSBzdHJpbmcnKTtcbiAgICBpZiAoaGFzUHJldmlvdXNEdXBsaWNhdGUpIHtcbiAgICAgIHRleHQgPSB0b2dnbGVDbGFzcyh0ZXh0LCBzdHlsaW5nS2V5IGFzIHN0cmluZywgISF2YWx1ZSk7XG4gICAgfSBlbHNlIGlmICh2YWx1ZSkge1xuICAgICAgdGV4dCA9IHRleHQgPT09ICcnID8gc3R5bGluZ0tleSBhcyBzdHJpbmcgOiB0ZXh0ICsgJyAnICsgc3R5bGluZ0tleTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgaWYgKGhhc1ByZXZpb3VzRHVwbGljYXRlKSB7XG4gICAgICB0ZXh0ID0gcmVtb3ZlU3R5bGUodGV4dCwga2V5KTtcbiAgICB9XG4gICAgY29uc3Qga2V5VmFsdWUgPVxuICAgICAgICBrZXkgKyAnOiAnICsgKHR5cGVvZiBzdWZmaXhPclNhbml0aXplciA9PT0gJ2Z1bmN0aW9uJyA/XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHN1ZmZpeE9yU2FuaXRpemVyKHZhbHVlKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgIChzdWZmaXhPclNhbml0aXplciA9PSBudWxsID8gdmFsdWUgOiB2YWx1ZSArIHN1ZmZpeE9yU2FuaXRpemVyKSk7XG4gICAgdGV4dCA9IHRleHQgPT09ICcnID8ga2V5VmFsdWUgOiB0ZXh0ICsgJzsgJyArIGtleVZhbHVlO1xuICB9XG4gIHJldHVybiB0ZXh0O1xufVxuXG4vKipcbiAqIGDJtcm1Y2xhc3NNYXAoKWAgaW5zZXJ0cyBgQ0xBU1NfTUFQX1NUWUxJTkdfS0VZYCBhcyBhIGtleSB0byB0aGUgYGluc2VydFRTdHlsaW5nQmluZGluZygpYC5cbiAqXG4gKiBUaGUgcHVycG9zZSBvZiB0aGlzIGtleSBpcyB0byBhZGQgY2xhc3MgbWFwIGFiaWxpdGllcyB0byB0aGUgY29uY2F0ZW5hdGlvbiBpbiBhIHRyZWUgc2hha2FibGVcbiAqIHdheS4gSWYgYMm1ybVjbGFzc01hcCgpYCBpcyBub3QgcmVmZXJlbmNlZCB0aGFuIGBDTEFTU19NQVBfU1RZTElOR19LRVlgIHdpbGwgYmVjb21lIGVsaWdpYmxlIGZvclxuICogdHJlZSBzaGFraW5nLlxuICpcbiAqIFRoaXMga2V5IHN1cHBvcnRzOiBgc3RyaW5nc2AsIGBvYmplY3RgIChhcyBNYXApIGFuZCBgQXJyYXlgLiBJbiBlYWNoIGNhc2UgaXQgaXMgbmVjZXNzYXJ5IHRvXG4gKiBicmVhayB0aGUgY2xhc3NlcyBpbnRvIHBhcnRzIGFuZCBjb25jYXRlbmF0ZSB0aGUgcGFydHMgaW50byB0aGUgYHRleHRgLiBUaGUgY29uY2F0ZW5hdGlvbiBuZWVkc1xuICogdG8gYmUgZG9uZSBpbiBwYXJ0cyBhcyBlYWNoIGtleSBpcyBpbmRpdmlkdWFsbHkgc3ViamVjdCB0byBvdmVyd3JpdGVzLlxuICovXG5leHBvcnQgY29uc3QgQ0xBU1NfTUFQX1NUWUxJTkdfS0VZOiBUU3R5bGluZ01hcEtleSA9IHtcbiAga2V5OiBudWxsLFxuICBleHRyYTogKHRleHQ6IHN0cmluZywgdmFsdWU6IGFueSwgaGFzUHJldmlvdXNEdXBsaWNhdGU6IGJvb2xlYW4pOiBzdHJpbmcgPT4ge1xuICAgIGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSkge1xuICAgICAgLy8gV2Ugc3VwcG9ydCBBcnJheXNcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdmFsdWUubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdGV4dCA9IGFwcGVuZFN0eWxpbmcodGV4dCwgdmFsdWVbaV0sIHRydWUsIG51bGwsIGhhc1ByZXZpb3VzRHVwbGljYXRlLCB0cnVlKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcpIHtcbiAgICAgIC8vIFdlIHN1cHBvcnQgbWFwc1xuICAgICAgZm9yIChsZXQga2V5IGluIHZhbHVlKSB7XG4gICAgICAgIHRleHQgPSBhcHBlbmRTdHlsaW5nKHRleHQsIGtleSwgdmFsdWVba2V5XSwgbnVsbCwgaGFzUHJldmlvdXNEdXBsaWNhdGUsIHRydWUpO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAodHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJykge1xuICAgICAgLy8gV2Ugc3VwcG9ydCBzdHJpbmdzXG4gICAgICBpZiAoaGFzUHJldmlvdXNEdXBsaWNhdGUpIHtcbiAgICAgICAgLy8gV2UgbmVlZCB0byBwYXJzZSBhbmQgcHJvY2VzcyBpdC5cbiAgICAgICAgY29uc3QgY2hhbmdlcyA9IG5ldyBNYXA8c3RyaW5nLCBib29sZWFufG51bGw+KCk7XG4gICAgICAgIHNwbGl0Q2xhc3NMaXN0KHZhbHVlLCBjaGFuZ2VzLCBmYWxzZSk7XG4gICAgICAgIGNoYW5nZXMuZm9yRWFjaCgoXywga2V5KSA9PiB0ZXh0ID0gYXBwZW5kU3R5bGluZyh0ZXh0LCBrZXksIHRydWUsIG51bGwsIHRydWUsIHRydWUpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIE5vIGR1cGxpY2F0ZXMsIGp1c3QgYXBwZW5kIGl0LlxuICAgICAgICB0ZXh0ID0gdGV4dCA9PT0gJycgPyB2YWx1ZSA6IHRleHQgKyAnICcgKyB2YWx1ZTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gQWxsIG90aGVyIGNhc2VzIGFyZSBub3Qgc3VwcG9ydGVkLlxuICAgICAgbmdEZXZNb2RlICYmIHRocm93RXJyb3IoJ1Vuc3VwcG9ydGVkIHZhbHVlIGZvciBjbGFzcyBiaW5kaW5nOiAnICsgdmFsdWUpO1xuICAgIH1cbiAgICByZXR1cm4gdGV4dDtcbiAgfVxufTtcblxuLyoqXG4gKiBgybXJtXN0eWxlTWFwKClgIGluc2VydHMgYFNUWUxFX01BUF9TVFlMSU5HX0tFWWAgYXMgYSBrZXkgdG8gdGhlIGBpbnNlcnRUU3R5bGluZ0JpbmRpbmcoKWAuXG4gKlxuICogVGhlIHB1cnBvc2Ugb2YgdGhpcyBrZXkgaXMgdG8gYWRkIHN0eWxlIG1hcCBhYmlsaXRpZXMgdG8gdGhlIGNvbmNhdGVuYXRpb24gaW4gYSB0cmVlIHNoYWthYmxlXG4gKiB3YXkuIElmIGDJtcm1c3R5bGVNYXAoKWAgaXMgbm90IHJlZmVyZW5jZWQgdGhhbiBgU1RZTEVfTUFQX1NUWUxJTkdfS0VZYCB3aWxsIGJlY29tZSBlbGlnaWJsZSBmb3JcbiAqIHRyZWUgc2hha2luZy4gKGBTVFlMRV9NQVBfU1RZTElOR19LRVlgIGFsc28gcHVsbHMgaW4gdGhlIHNhbml0aXplciBhcyBgybXJtXN0eWxlTWFwKClgIGNvdWxkIGhhdmVcbiAqIGEgc2FuaXRpemFibGUgcHJvcGVydHkuKVxuICpcbiAqIFRoaXMga2V5IHN1cHBvcnRzOiBgc3RyaW5nc2AsIGFuZCBgb2JqZWN0YCAoYXMgTWFwKS4gSW4gZWFjaCBjYXNlIGl0IGlzIG5lY2Vzc2FyeSB0b1xuICogYnJlYWsgdGhlIHN0eWxlIGludG8gcGFydHMgYW5kIGNvbmNhdGVuYXRlIHRoZSBwYXJ0cyBpbnRvIHRoZSBgdGV4dGAuIFRoZSBjb25jYXRlbmF0aW9uIG5lZWRzXG4gKiB0byBiZSBkb25lIGluIHBhcnRzIGFzIGVhY2gga2V5IGlzIGluZGl2aWR1YWxseSBzdWJqZWN0IHRvIG92ZXJ3cml0ZXMuXG4gKi9cbmV4cG9ydCBjb25zdCBTVFlMRV9NQVBfU1RZTElOR19LRVk6IFRTdHlsaW5nTWFwS2V5ID0ge1xuICBrZXk6IG51bGwsXG4gIGV4dHJhOiAodGV4dDogc3RyaW5nLCB2YWx1ZTogYW55LCBoYXNQcmV2aW91c0R1cGxpY2F0ZTogYm9vbGVhbik6IHN0cmluZyA9PiB7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG4gICAgICAvLyBXZSBkb24ndCBzdXBwb3J0IEFycmF5c1xuICAgICAgbmdEZXZNb2RlICYmIHRocm93RXJyb3IoJ1N0eWxlIGJpbmRpbmdzIGRvIG5vdCBzdXBwb3J0IGFycmF5IGJpbmRpbmdzOiAnICsgdmFsdWUpO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIHZhbHVlID09PSAnb2JqZWN0Jykge1xuICAgICAgLy8gV2Ugc3VwcG9ydCBtYXBzXG4gICAgICBmb3IgKGxldCBrZXkgaW4gdmFsdWUpIHtcbiAgICAgICAgdGV4dCA9IGFwcGVuZFN0eWxpbmcoXG4gICAgICAgICAgICB0ZXh0LCBrZXksIHZhbHVlW2tleV0sIHN0eWxlUHJvcE5lZWRzU2FuaXRpemF0aW9uKGtleSkgPyDJtcm1c2FuaXRpemVTdHlsZSA6IG51bGwsXG4gICAgICAgICAgICBoYXNQcmV2aW91c0R1cGxpY2F0ZSwgZmFsc2UpO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAodHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJykge1xuICAgICAgLy8gV2Ugc3VwcG9ydCBzdHJpbmdzXG4gICAgICBpZiAoaGFzUHJldmlvdXNEdXBsaWNhdGUpIHtcbiAgICAgICAgLy8gV2UgbmVlZCB0byBwYXJzZSBhbmQgcHJvY2VzcyBpdC5cbiAgICAgICAgY29uc3QgY2hhbmdlczogU3R5bGVDaGFuZ2VzTWFwID1cbiAgICAgICAgICAgIG5ldyBNYXA8c3RyaW5nLCB7b2xkOiBzdHJpbmcgfCBudWxsLCBuZXc6IHN0cmluZyB8IG51bGx9PigpO1xuICAgICAgICBwYXJzZUtleVZhbHVlKHZhbHVlLCBjaGFuZ2VzLCBmYWxzZSk7XG4gICAgICAgIGNoYW5nZXMuZm9yRWFjaChcbiAgICAgICAgICAgICh2YWx1ZSwga2V5KSA9PiB0ZXh0ID0gYXBwZW5kU3R5bGluZyhcbiAgICAgICAgICAgICAgICB0ZXh0LCBrZXksIHZhbHVlLm9sZCwgc3R5bGVQcm9wTmVlZHNTYW5pdGl6YXRpb24oa2V5KSA/IMm1ybVzYW5pdGl6ZVN0eWxlIDogbnVsbCxcbiAgICAgICAgICAgICAgICB0cnVlLCBmYWxzZSkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gTm8gZHVwbGljYXRlcywganVzdCBhcHBlbmQgaXQuXG4gICAgICAgIHRleHQgPSB0ZXh0ID09PSAnJyA/IHZhbHVlIDogdGV4dCArICc7ICcgKyB2YWx1ZTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gQWxsIG90aGVyIGNhc2VzIGFyZSBub3Qgc3VwcG9ydGVkLlxuICAgICAgbmdEZXZNb2RlICYmIHRocm93RXJyb3IoJ1Vuc3VwcG9ydGVkIHZhbHVlIGZvciBzdHlsZSBiaW5kaW5nOiAnICsgdmFsdWUpO1xuICAgIH1cbiAgICByZXR1cm4gdGV4dDtcbiAgfVxufTtcbiJdfQ==