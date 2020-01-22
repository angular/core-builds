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
    markDuplicates(tData, tStylingKey, index, (isClassBinding ? tNode.classes : tNode.styles), true, isClassBinding);
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
 * @param tData
 * @param tStylingKey
 * @param index
 * @param staticValues
 * @param isPrevDir
 */
function markDuplicates(tData, tStylingKey, index, staticValues, isPrevDir, isClassBinding) {
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
    if (staticValues !== '' && // If we have static values to search
        !foundDuplicate // If we have duplicate don't bother since we are already marked as
    // duplicate
    ) {
        if (isMap) {
            // if we are a Map (and we have statics) we must assume duplicate
            foundDuplicate = true;
        }
        else if (staticValues != null) {
            for (var i = isClassBinding ? parseClassName(staticValues) : parseStyle(staticValues); //
             i >= 0; //
             i = isClassBinding ? parseClassNameNext(staticValues, i) :
                parseStyleNext(staticValues, i)) {
                if (getLastParsedKey(staticValues) === key) {
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
    var text = lastUnchangedValueIndex === 0 ?
        (isClassBinding ? tNode.classes : tNode.styles) :
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3R5bGVfYmluZGluZ19saXN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9zdHlsaW5nL3N0eWxlX2JpbmRpbmdfbGlzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0VBTUU7QUFFRixPQUFPLEVBQUMsMEJBQTBCLEVBQUUsZUFBZSxFQUFDLE1BQU0saUNBQWlDLENBQUM7QUFDNUYsT0FBTyxFQUFDLFdBQVcsRUFBRSxVQUFVLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUcxRCxPQUFPLEVBQTZDLG9CQUFvQixFQUFFLG9CQUFvQixFQUFFLDZCQUE2QixFQUFFLG9CQUFvQixFQUFFLDZCQUE2QixFQUFFLG9CQUFvQixFQUFFLDZCQUE2QixFQUFFLGVBQWUsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQ3ZSLE9BQU8sRUFBZSxLQUFLLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUN2RCxPQUFPLEVBQUMsUUFBUSxFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQ2xDLE9BQU8sRUFBQyxjQUFjLEVBQUUsV0FBVyxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFDM0QsT0FBTyxFQUFrQixhQUFhLEVBQUUsV0FBVyxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFDM0UsT0FBTyxFQUFDLGdCQUFnQixFQUFFLGNBQWMsRUFBRSxrQkFBa0IsRUFBRSxVQUFVLEVBQUUsY0FBYyxFQUFDLE1BQU0sa0JBQWtCLENBQUM7QUFJbEg7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBd0pHO0FBR0g7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7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SUFBSSxFQUFFLEtBQUssQ0FBQyxFQUZBLENBRUEsQ0FBQyxDQUFDO1NBQ3ZCO2FBQU07WUFDTCxpQ0FBaUM7WUFDakMsSUFBSSxHQUFHLElBQUksS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsSUFBSSxHQUFHLElBQUksR0FBRyxLQUFLLENBQUM7U0FDbEQ7S0FDRjtTQUFNO1FBQ0wscUNBQXFDO1FBQ3JDLFNBQVMsSUFBSSxVQUFVLENBQUMsdUNBQXVDLEdBQUcsS0FBSyxDQUFDLENBQUM7S0FDMUU7SUFDRCxPQUFPLElBQUksQ0FBQztBQUNkLENBQUM7QUE3Q0g7Ozs7Ozs7Ozs7O0dBV0c7QUFDSCxNQUFNLENBQUMsSUFBTSxxQkFBcUIsR0FBbUI7SUFDbkQsR0FBRyxFQUFFLElBQUk7SUFDVCxLQUFLLElBK0JKO0NBQ0YsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuKiBAbGljZW5zZVxuKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbipcbiogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuKi9cblxuaW1wb3J0IHtzdHlsZVByb3BOZWVkc1Nhbml0aXphdGlvbiwgybXJtXNhbml0aXplU3R5bGV9IGZyb20gJy4uLy4uL3Nhbml0aXphdGlvbi9zYW5pdGl6YXRpb24nO1xuaW1wb3J0IHthc3NlcnRFcXVhbCwgdGhyb3dFcnJvcn0gZnJvbSAnLi4vLi4vdXRpbC9hc3NlcnQnO1xuaW1wb3J0IHtUTm9kZX0gZnJvbSAnLi4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7U2FuaXRpemVyRm59IGZyb20gJy4uL2ludGVyZmFjZXMvc2FuaXRpemF0aW9uJztcbmltcG9ydCB7VFN0eWxpbmdLZXksIFRTdHlsaW5nTWFwS2V5LCBUU3R5bGluZ1JhbmdlLCBnZXRUU3R5bGluZ1JhbmdlTmV4dCwgZ2V0VFN0eWxpbmdSYW5nZVByZXYsIGdldFRTdHlsaW5nUmFuZ2VQcmV2RHVwbGljYXRlLCBzZXRUU3R5bGluZ1JhbmdlTmV4dCwgc2V0VFN0eWxpbmdSYW5nZU5leHREdXBsaWNhdGUsIHNldFRTdHlsaW5nUmFuZ2VQcmV2LCBzZXRUU3R5bGluZ1JhbmdlUHJldkR1cGxpY2F0ZSwgdG9UU3R5bGluZ1JhbmdlfSBmcm9tICcuLi9pbnRlcmZhY2VzL3N0eWxpbmcnO1xuaW1wb3J0IHtMVmlldywgVERhdGEsIFRWSUVXfSBmcm9tICcuLi9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHtnZXRMVmlld30gZnJvbSAnLi4vc3RhdGUnO1xuaW1wb3J0IHtzcGxpdENsYXNzTGlzdCwgdG9nZ2xlQ2xhc3N9IGZyb20gJy4vY2xhc3NfZGlmZmVyJztcbmltcG9ydCB7U3R5bGVDaGFuZ2VzTWFwLCBwYXJzZUtleVZhbHVlLCByZW1vdmVTdHlsZX0gZnJvbSAnLi9zdHlsZV9kaWZmZXInO1xuaW1wb3J0IHtnZXRMYXN0UGFyc2VkS2V5LCBwYXJzZUNsYXNzTmFtZSwgcGFyc2VDbGFzc05hbWVOZXh0LCBwYXJzZVN0eWxlLCBwYXJzZVN0eWxlTmV4dH0gZnJvbSAnLi9zdHlsaW5nX3BhcnNlcic7XG5cblxuXG4vKipcbiAqIE5PVEU6IFRoZSB3b3JkIGBzdHlsaW5nYCBpcyB1c2VkIGludGVyY2hhbmdlYWJseSBhcyBzdHlsZSBvciBjbGFzcyBzdHlsaW5nLlxuICpcbiAqIFRoaXMgZmlsZSBjb250YWlucyBjb2RlIHRvIGxpbmsgc3R5bGluZyBpbnN0cnVjdGlvbnMgdG9nZXRoZXIgc28gdGhhdCB0aGV5IGNhbiBiZSByZXBsYXllZCBpblxuICogcHJpb3JpdHkgb3JkZXIuIFRoZSBmaWxlIGV4aXN0cyBiZWNhdXNlIEl2eSBzdHlsaW5nIGluc3RydWN0aW9uIGV4ZWN1dGlvbiBvcmRlciBkb2VzIG5vdCBtYXRjaFxuICogdGhhdCBvZiB0aGUgcHJpb3JpdHkgb3JkZXIuIFRoZSBwdXJwb3NlIG9mIHRoaXMgY29kZSBpcyB0byBjcmVhdGUgYSBsaW5rZWQgbGlzdCBzbyB0aGF0IHRoZVxuICogaW5zdHJ1Y3Rpb25zIGNhbiBiZSB0cmF2ZXJzZWQgaW4gcHJpb3JpdHkgb3JkZXIgd2hlbiBjb21wdXRpbmcgdGhlIHN0eWxlcy5cbiAqXG4gKiBBc3N1bWUgd2UgYXJlIGRlYWxpbmcgd2l0aCB0aGUgZm9sbG93aW5nIGNvZGU6XG4gKiBgYGBcbiAqIEBDb21wb25lbnQoe1xuICogICB0ZW1wbGF0ZTogYFxuICogICAgIDxteS1jbXAgW3N0eWxlXT1cIiB7Y29sb3I6ICcjMDAxJ30gXCJcbiAqICAgICAgICAgICAgIFtzdHlsZS5jb2xvcl09XCIgIzAwMiBcIlxuICogICAgICAgICAgICAgZGlyLXN0eWxlLWNvbG9yLTFcbiAqICAgICAgICAgICAgIGRpci1zdHlsZS1jb2xvci0yPiBgXG4gKiB9KVxuICogY2xhc3MgRXhhbXBsZUNvbXBvbmVudCB7XG4gKiAgIHN0YXRpYyBuZ0NvbXAgPSAuLi4ge1xuICogICAgIC4uLlxuICogICAgIC8vIENvbXBpbGVyIGVuc3VyZXMgdGhhdCBgybXJtXN0eWxlUHJvcGAgaXMgYWZ0ZXIgYMm1ybVzdHlsZU1hcGBcbiAqICAgICDJtcm1c3R5bGVNYXAoe2NvbG9yOiAnIzAwMSd9KTtcbiAqICAgICDJtcm1c3R5bGVQcm9wKCdjb2xvcicsICcjMDAyJyk7XG4gKiAgICAgLi4uXG4gKiAgIH1cbiAqIH1cbiAqXG4gKiBARGlyZWN0aXZlKHtcbiAqICAgc2VsZWN0b3I6IGBbZGlyLXN0eWxlLWNvbG9yLTFdJyxcbiAqIH0pXG4gKiBjbGFzcyBTdHlsZTFEaXJlY3RpdmUge1xuICogICBASG9zdEJpbmRpbmcoJ3N0eWxlJykgc3R5bGUgPSB7Y29sb3I6ICcjMDA1J307XG4gKiAgIEBIb3N0QmluZGluZygnc3R5bGUuY29sb3InKSBjb2xvciA9ICcjMDA2JztcbiAqXG4gKiAgIHN0YXRpYyBuZ0RpciA9IC4uLiB7XG4gKiAgICAgLi4uXG4gKiAgICAgLy8gQ29tcGlsZXIgZW5zdXJlcyB0aGF0IGDJtcm1c3R5bGVQcm9wYCBpcyBhZnRlciBgybXJtXN0eWxlTWFwYFxuICogICAgIMm1ybVzdHlsZU1hcCh7Y29sb3I6ICcjMDA1J30pO1xuICogICAgIMm1ybVzdHlsZVByb3AoJ2NvbG9yJywgJyMwMDYnKTtcbiAqICAgICAuLi5cbiAqICAgfVxuICogfVxuICpcbiAqIEBEaXJlY3RpdmUoe1xuICogICBzZWxlY3RvcjogYFtkaXItc3R5bGUtY29sb3ItMl0nLFxuICogfSlcbiAqIGNsYXNzIFN0eWxlMkRpcmVjdGl2ZSB7XG4gKiAgIEBIb3N0QmluZGluZygnc3R5bGUnKSBzdHlsZSA9IHtjb2xvcjogJyMwMDcnfTtcbiAqICAgQEhvc3RCaW5kaW5nKCdzdHlsZS5jb2xvcicpIGNvbG9yID0gJyMwMDgnO1xuICpcbiAqICAgc3RhdGljIG5nRGlyID0gLi4uIHtcbiAqICAgICAuLi5cbiAqICAgICAvLyBDb21waWxlciBlbnN1cmVzIHRoYXQgYMm1ybVzdHlsZVByb3BgIGlzIGFmdGVyIGDJtcm1c3R5bGVNYXBgXG4gKiAgICAgybXJtXN0eWxlTWFwKHtjb2xvcjogJyMwMDcnfSk7XG4gKiAgICAgybXJtXN0eWxlUHJvcCgnY29sb3InLCAnIzAwOCcpO1xuICogICAgIC4uLlxuICogICB9XG4gKiB9XG4gKlxuICogQERpcmVjdGl2ZSh7XG4gKiAgIHNlbGVjdG9yOiBgbXktY21wJyxcbiAqIH0pXG4gKiBjbGFzcyBNeUNvbXBvbmVudCB7XG4gKiAgIEBIb3N0QmluZGluZygnc3R5bGUnKSBzdHlsZSA9IHtjb2xvcjogJyMwMDMnfTtcbiAqICAgQEhvc3RCaW5kaW5nKCdzdHlsZS5jb2xvcicpIGNvbG9yID0gJyMwMDQnO1xuICpcbiAqICAgc3RhdGljIG5nQ29tcCA9IC4uLiB7XG4gKiAgICAgLi4uXG4gKiAgICAgLy8gQ29tcGlsZXIgZW5zdXJlcyB0aGF0IGDJtcm1c3R5bGVQcm9wYCBpcyBhZnRlciBgybXJtXN0eWxlTWFwYFxuICogICAgIMm1ybVzdHlsZU1hcCh7Y29sb3I6ICcjMDAzJ30pO1xuICogICAgIMm1ybVzdHlsZVByb3AoJ2NvbG9yJywgJyMwMDQnKTtcbiAqICAgICAuLi5cbiAqICAgfVxuICogfVxuICogYGBgXG4gKlxuICogVGhlIE9yZGVyIG9mIGluc3RydWN0aW9uIGV4ZWN1dGlvbiBpczpcbiAqXG4gKiBOT1RFOiB0aGUgY29tbWVudCBiaW5kaW5nIGxvY2F0aW9uIGlzIGZvciBpbGx1c3RyYXRpdmUgcHVycG9zZXMgb25seS5cbiAqXG4gKiBgYGBcbiAqIC8vIFRlbXBsYXRlOiAoRXhhbXBsZUNvbXBvbmVudClcbiAqICAgICDJtcm1c3R5bGVNYXAoe2NvbG9yOiAnIzAwMSd9KTsgICAvLyBCaW5kaW5nIGluZGV4OiAxMFxuICogICAgIMm1ybVzdHlsZVByb3AoJ2NvbG9yJywgJyMwMDInKTsgIC8vIEJpbmRpbmcgaW5kZXg6IDEyXG4gKiAvLyBNeUNvbXBvbmVudFxuICogICAgIMm1ybVzdHlsZU1hcCh7Y29sb3I6ICcjMDAzJ30pOyAgIC8vIEJpbmRpbmcgaW5kZXg6IDIwXG4gKiAgICAgybXJtXN0eWxlUHJvcCgnY29sb3InLCAnIzAwNCcpOyAgLy8gQmluZGluZyBpbmRleDogMjJcbiAqIC8vIFN0eWxlMURpcmVjdGl2ZVxuICogICAgIMm1ybVzdHlsZU1hcCh7Y29sb3I6ICcjMDA1J30pOyAgIC8vIEJpbmRpbmcgaW5kZXg6IDI0XG4gKiAgICAgybXJtXN0eWxlUHJvcCgnY29sb3InLCAnIzAwNicpOyAgLy8gQmluZGluZyBpbmRleDogMjZcbiAqIC8vIFN0eWxlMkRpcmVjdGl2ZVxuICogICAgIMm1ybVzdHlsZU1hcCh7Y29sb3I6ICcjMDA3J30pOyAgIC8vIEJpbmRpbmcgaW5kZXg6IDI4XG4gKiAgICAgybXJtXN0eWxlUHJvcCgnY29sb3InLCAnIzAwOCcpOyAgLy8gQmluZGluZyBpbmRleDogMzBcbiAqIGBgYFxuICpcbiAqIFRoZSBjb3JyZWN0IHByaW9yaXR5IG9yZGVyIG9mIGNvbmNhdGVuYXRpb24gaXM6XG4gKlxuICogYGBgXG4gKiAvLyBNeUNvbXBvbmVudFxuICogICAgIMm1ybVzdHlsZU1hcCh7Y29sb3I6ICcjMDAzJ30pOyAgIC8vIEJpbmRpbmcgaW5kZXg6IDIwXG4gKiAgICAgybXJtXN0eWxlUHJvcCgnY29sb3InLCAnIzAwNCcpOyAgLy8gQmluZGluZyBpbmRleDogMjJcbiAqIC8vIFN0eWxlMURpcmVjdGl2ZVxuICogICAgIMm1ybVzdHlsZU1hcCh7Y29sb3I6ICcjMDA1J30pOyAgIC8vIEJpbmRpbmcgaW5kZXg6IDI0XG4gKiAgICAgybXJtXN0eWxlUHJvcCgnY29sb3InLCAnIzAwNicpOyAgLy8gQmluZGluZyBpbmRleDogMjZcbiAqIC8vIFN0eWxlMkRpcmVjdGl2ZVxuICogICAgIMm1ybVzdHlsZU1hcCh7Y29sb3I6ICcjMDA3J30pOyAgIC8vIEJpbmRpbmcgaW5kZXg6IDI4XG4gKiAgICAgybXJtXN0eWxlUHJvcCgnY29sb3InLCAnIzAwOCcpOyAgLy8gQmluZGluZyBpbmRleDogMzBcbiAqIC8vIFRlbXBsYXRlOiAoRXhhbXBsZUNvbXBvbmVudClcbiAqICAgICDJtcm1c3R5bGVNYXAoe2NvbG9yOiAnIzAwMSd9KTsgICAvLyBCaW5kaW5nIGluZGV4OiAxMFxuICogICAgIMm1ybVzdHlsZVByb3AoJ2NvbG9yJywgJyMwMDInKTsgIC8vIEJpbmRpbmcgaW5kZXg6IDEyXG4gKiBgYGBcbiAqXG4gKiBXaGF0IGNvbG9yIHNob3VsZCBiZSByZW5kZXJlZD9cbiAqXG4gKiBPbmNlIHRoZSBpdGVtcyBhcmUgY29ycmVjdGx5IHNvcnRlZCBpbiB0aGUgbGlzdCwgdGhlIGFuc3dlciBpcyBzaW1wbHkgdGhlIGxhc3QgaXRlbSBpbiB0aGVcbiAqIGNvbmNhdGVuYXRpb24gbGlzdCB3aGljaCBpcyBgIzAwMmAuXG4gKlxuICogVG8gZG8gc28gd2Uga2VlcCBhIGxpbmtlZCBsaXN0IG9mIGFsbCBvZiB0aGUgYmluZGluZ3Mgd2hpY2ggcGVydGFpbiB0byB0aGlzIGVsZW1lbnQuXG4gKiBOb3RpY2UgdGhhdCB0aGUgYmluZGluZ3MgYXJlIGluc2VydGVkIGluIHRoZSBvcmRlciBvZiBleGVjdXRpb24sIGJ1dCB0aGUgYFRWaWV3LmRhdGFgIGFsbG93c1xuICogdXMgdG8gdHJhdmVyc2UgdGhlbSBpbiB0aGUgb3JkZXIgb2YgcHJpb3JpdHkuXG4gKlxuICogfElkeHxgVFZpZXcuZGF0YWB8YExWaWV3YCAgICAgICAgICB8IE5vdGVzXG4gKiB8LS0tfC0tLS0tLS0tLS0tLXwtLS0tLS0tLS0tLS0tLS0tLXwtLS0tLS0tLS0tLS0tLVxuICogfC4uLnwgICAgICAgICAgICB8ICAgICAgICAgICAgICAgICB8XG4gKiB8MTAgfGBudWxsYCAgICAgIHxge2NvbG9yOiAnIzAwMSd9YHwgYMm1ybVzdHlsZU1hcCgnY29sb3InLCB7Y29sb3I6ICcjMDAxJ30pYFxuICogfDExIHxgMzAgfCAxMmAgICB8IC4uLiAgICAgICAgICAgICB8XG4gKiB8MTIgfGBjb2xvcmAgICAgIHxgJyMwMDInYCAgICAgICAgIHwgYMm1ybVzdHlsZVByb3AoJ2NvbG9yJywgJyMwMDInKWBcbiAqIHwxMyB8YDEwIHwgMGAgICAgfCAuLi4gICAgICAgICAgICAgfFxuICogfC4uLnwgICAgICAgICAgICB8ICAgICAgICAgICAgICAgICB8XG4gKiB8MjAgfGBudWxsYCAgICAgIHxge2NvbG9yOiAnIzAwMyd9YHwgYMm1ybVzdHlsZU1hcCgnY29sb3InLCB7Y29sb3I6ICcjMDAzJ30pYFxuICogfDIxIHxgMCB8IDIyYCAgICB8IC4uLiAgICAgICAgICAgICB8XG4gKiB8MjIgfGBjb2xvcmAgICAgIHxgJyMwMDQnYCAgICAgICAgIHwgYMm1ybVzdHlsZVByb3AoJ2NvbG9yJywgJyMwMDQnKWBcbiAqIHwyMyB8YDIwIHwgMjRgICAgfCAuLi4gICAgICAgICAgICAgfFxuICogfDI0IHxgbnVsbGAgICAgICB8YHtjb2xvcjogJyMwMDUnfWB8IGDJtcm1c3R5bGVNYXAoJ2NvbG9yJywge2NvbG9yOiAnIzAwNSd9KWBcbiAqIHwyNSB8YDIyIHwgMjZgICAgfCAuLi4gICAgICAgICAgICAgfFxuICogfDI2IHxgY29sb3JgICAgICB8YCcjMDA2J2AgICAgICAgICB8IGDJtcm1c3R5bGVQcm9wKCdjb2xvcicsICcjMDA2JylgXG4gKiB8MjcgfGAyNCB8IDI4YCAgIHwgLi4uICAgICAgICAgICAgIHxcbiAqIHwyOCB8YG51bGxgICAgICAgfGB7Y29sb3I6ICcjMDA3J31gfCBgybXJtXN0eWxlTWFwKCdjb2xvcicsIHtjb2xvcjogJyMwMDcnfSlgXG4gKiB8MjkgfGAyNiB8IDMwYCAgIHwgLi4uICAgICAgICAgICAgIHxcbiAqIHwzMCB8YGNvbG9yYCAgICAgfGAnIzAwOCdgICAgICAgICAgfCBgybXJtXN0eWxlUHJvcCgnY29sb3InLCAnIzAwOCcpYFxuICogfDMxIHxgMjggfCAxMGAgICB8IC4uLiAgICAgICAgICAgICB8XG4gKlxuICogVGhlIGFib3ZlIGRhdGEgc3RydWN0dXJlIGFsbG93cyB1cyB0byByZS1jb25jYXRlbmF0ZSB0aGUgc3R5bGluZyBubyBtYXR0ZXIgd2hpY2ggZGF0YSBiaW5kaW5nXG4gKiBjaGFuZ2VzLlxuICpcbiAqIE5PVEU6IGluIGFkZGl0aW9uIHRvIGtlZXBpbmcgdHJhY2sgb2YgbmV4dC9wcmV2aW91cyBpbmRleCB0aGUgYFRWaWV3LmRhdGFgIGFsc28gc3RvcmVzIHByZXYvbmV4dFxuICogZHVwbGljYXRlIGJpdC4gVGhlIGR1cGxpY2F0ZSBiaXQgaWYgdHJ1ZSBzYXlzIHRoZXJlIGVpdGhlciBpcyBhIGJpbmRpbmcgd2l0aCB0aGUgc2FtZSBuYW1lIG9yXG4gKiB0aGVyZSBpcyBhIG1hcCAod2hpY2ggbWF5IGNvbnRhaW4gdGhlIG5hbWUpLiBUaGlzIGluZm9ybWF0aW9uIGlzIHVzZWZ1bCBpbiBrbm93aW5nIGlmIG90aGVyXG4gKiBzdHlsZXMgd2l0aCBoaWdoZXIgcHJpb3JpdHkgbmVlZCB0byBiZSBzZWFyY2hlZCBmb3Igb3ZlcndyaXRlcy5cbiAqXG4gKiBOT1RFOiBTZWUgYHNob3VsZCBzdXBwb3J0IGV4YW1wbGUgaW4gJ3Rub2RlX2xpbmtlZF9saXN0LnRzJyBkb2N1bWVudGF0aW9uYCBpblxuICogYHRub2RlX2xpbmtlZF9saXN0X3NwZWMudHNgIGZvciB3b3JraW5nIGV4YW1wbGUuXG4gKi9cblxuXG4vKipcbiAqIEluc2VydCBuZXcgYHRTdHlsZVZhbHVlYCBhdCBgVERhdGFgIGFuZCBsaW5rIGV4aXN0aW5nIHN0eWxlIGJpbmRpbmdzIHN1Y2ggdGhhdCB3ZSBtYWludGFpbiBsaW5rZWRcbiAqIGxpc3Qgb2Ygc3R5bGVzIGFuZCBjb21wdXRlIHRoZSBkdXBsaWNhdGUgZmxhZy5cbiAqXG4gKiBOb3RlOiB0aGlzIGZ1bmN0aW9uIGlzIGV4ZWN1dGVkIGR1cmluZyBgZmlyc3RVcGRhdGVQYXNzYCBvbmx5IHRvIHBvcHVsYXRlIHRoZSBgVFZpZXcuZGF0YWAuXG4gKlxuICogVGhlIGZ1bmN0aW9uIHdvcmtzIGJ5IGtlZXBpbmcgdHJhY2sgb2YgYHRTdHlsaW5nUmFuZ2VgIHdoaWNoIGNvbnRhaW5zIHR3byBwb2ludGVycyBwb2ludGluZyB0b1xuICogdGhlIGhlYWQvdGFpbCBvZiB0aGUgdGVtcGxhdGUgcG9ydGlvbiBvZiB0aGUgc3R5bGVzLlxuICogIC0gaWYgYGlzSG9zdCA9PT0gZmFsc2VgICh3ZSBhcmUgdGVtcGxhdGUpIHRoZW4gaW5zZXJ0aW9uIGlzIGF0IHRhaWwgb2YgYFRTdHlsaW5nUmFuZ2VgXG4gKiAgLSBpZiBgaXNIb3N0ID09PSB0cnVlYCAod2UgYXJlIGhvc3QgYmluZGluZykgdGhlbiBpbnNlcnRpb24gaXMgYXQgaGVhZCBvZiBgVFN0eWxpbmdSYW5nZWBcbiAqXG4gKiBAcGFyYW0gdERhdGEgVGhlIGBURGF0YWAgdG8gaW5zZXJ0IGludG8uXG4gKiBAcGFyYW0gdE5vZGUgYFROb2RlYCBhc3NvY2lhdGVkIHdpdGggdGhlIHN0eWxpbmcgZWxlbWVudC5cbiAqIEBwYXJhbSB0U3R5bGluZ0tleSBTZWUgYFRTdHlsaW5nS2V5YC5cbiAqIEBwYXJhbSBpbmRleCBsb2NhdGlvbiBvZiB3aGVyZSBgdFN0eWxlVmFsdWVgIHNob3VsZCBiZSBzdG9yZWQgKGFuZCBsaW5rZWQgaW50byBsaXN0LilcbiAqIEBwYXJhbSBpc0hvc3RCaW5kaW5nIGB0cnVlYCBpZiB0aGUgaW5zZXJ0aW9uIGlzIGZvciBhIGBob3N0QmluZGluZ2AuIChpbnNlcnRpb24gaXMgaW4gZnJvbnQgb2ZcbiAqICAgICAgICAgICAgICAgdGVtcGxhdGUuKVxuICogQHBhcmFtIGlzQ2xhc3NCaW5kaW5nIFRydWUgaWYgdGhlIGFzc29jaWF0ZWQgYHRTdHlsaW5nS2V5YCBhcyBhIGBjbGFzc2Agc3R5bGluZy5cbiAqICAgICAgICAgICAgICAgICAgICAgICBgdE5vZGUuY2xhc3NCaW5kaW5nc2Agc2hvdWxkIGJlIHVzZWQgKG9yIGB0Tm9kZS5zdHlsZUJpbmRpbmdzYCBvdGhlcndpc2UuKVxuICovXG5leHBvcnQgZnVuY3Rpb24gaW5zZXJ0VFN0eWxpbmdCaW5kaW5nKFxuICAgIHREYXRhOiBURGF0YSwgdE5vZGU6IFROb2RlLCB0U3R5bGluZ0tleTogVFN0eWxpbmdLZXksIGluZGV4OiBudW1iZXIsIGlzSG9zdEJpbmRpbmc6IGJvb2xlYW4sXG4gICAgaXNDbGFzc0JpbmRpbmc6IGJvb2xlYW4pOiB2b2lkIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEVxdWFsKFxuICAgICAgICAgICAgICAgICAgIGdldExWaWV3KClbVFZJRVddLmZpcnN0VXBkYXRlUGFzcywgdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAnU2hvdWxkIGJlIGNhbGxlZCBkdXJpbmcgXFwnZmlyc3RVcGRhdGVQYXNzYCBvbmx5LicpO1xuICBsZXQgdEJpbmRpbmdzID0gaXNDbGFzc0JpbmRpbmcgPyB0Tm9kZS5jbGFzc0JpbmRpbmdzIDogdE5vZGUuc3R5bGVCaW5kaW5ncztcbiAgbGV0IHRtcGxIZWFkID0gZ2V0VFN0eWxpbmdSYW5nZVByZXYodEJpbmRpbmdzKTtcbiAgbGV0IHRtcGxUYWlsID0gZ2V0VFN0eWxpbmdSYW5nZU5leHQodEJpbmRpbmdzKTtcblxuICB0RGF0YVtpbmRleF0gPSB0U3R5bGluZ0tleTtcbiAgaWYgKGlzSG9zdEJpbmRpbmcpIHtcbiAgICAvLyBXZSBhcmUgaW5zZXJ0aW5nIGhvc3QgYmluZGluZ3NcblxuICAgIC8vIElmIHdlIGRvbid0IGhhdmUgdGVtcGxhdGUgYmluZGluZ3MgdGhlbiBgdGFpbGAgaXMgMC5cbiAgICBjb25zdCBoYXNUZW1wbGF0ZUJpbmRpbmdzID0gdG1wbFRhaWwgIT09IDA7XG4gICAgLy8gVGhpcyBpcyBpbXBvcnRhbnQgdG8ga25vdyBiZWNhdXNlIHRoYXQgbWVhbnMgdGhhdCB0aGUgYGhlYWRgIGNhbid0IHBvaW50IHRvIHRoZSBmaXJzdFxuICAgIC8vIHRlbXBsYXRlIGJpbmRpbmdzICh0aGVyZSBhcmUgbm9uZS4pIEluc3RlYWQgdGhlIGhlYWQgcG9pbnRzIHRvIHRoZSB0YWlsIG9mIHRoZSB0ZW1wbGF0ZS5cbiAgICBpZiAoaGFzVGVtcGxhdGVCaW5kaW5ncykge1xuICAgICAgLy8gdGVtcGxhdGUgaGVhZCdzIFwicHJldlwiIHdpbGwgcG9pbnQgdG8gbGFzdCBob3N0IGJpbmRpbmcgb3IgdG8gMCBpZiBubyBob3N0IGJpbmRpbmdzIHlldFxuICAgICAgY29uc3QgcHJldmlvdXNOb2RlID0gZ2V0VFN0eWxpbmdSYW5nZVByZXYodERhdGFbdG1wbEhlYWQgKyAxXSBhcyBUU3R5bGluZ1JhbmdlKTtcbiAgICAgIHREYXRhW2luZGV4ICsgMV0gPSB0b1RTdHlsaW5nUmFuZ2UocHJldmlvdXNOb2RlLCB0bXBsSGVhZCk7XG4gICAgICAvLyBpZiBhIGhvc3QgYmluZGluZyBoYXMgYWxyZWFkeSBiZWVuIHJlZ2lzdGVyZWQsIHdlIG5lZWQgdG8gdXBkYXRlIHRoZSBuZXh0IG9mIHRoYXQgaG9zdFxuICAgICAgLy8gYmluZGluZyB0byBwb2ludCB0byB0aGlzIG9uZVxuICAgICAgaWYgKHByZXZpb3VzTm9kZSAhPT0gMCkge1xuICAgICAgICAvLyBXZSBuZWVkIHRvIHVwZGF0ZSB0aGUgdGVtcGxhdGUtdGFpbCB2YWx1ZSB0byBwb2ludCB0byB1cy5cbiAgICAgICAgdERhdGFbcHJldmlvdXNOb2RlICsgMV0gPVxuICAgICAgICAgICAgc2V0VFN0eWxpbmdSYW5nZU5leHQodERhdGFbcHJldmlvdXNOb2RlICsgMV0gYXMgVFN0eWxpbmdSYW5nZSwgaW5kZXgpO1xuICAgICAgfVxuICAgICAgLy8gVGhlIFwicHJldmlvdXNcIiBvZiB0aGUgdGVtcGxhdGUgYmluZGluZyBoZWFkIHNob3VsZCBwb2ludCB0byB0aGlzIGhvc3QgYmluZGluZ1xuICAgICAgdERhdGFbdG1wbEhlYWQgKyAxXSA9IHNldFRTdHlsaW5nUmFuZ2VQcmV2KHREYXRhW3RtcGxIZWFkICsgMV0gYXMgVFN0eWxpbmdSYW5nZSwgaW5kZXgpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0RGF0YVtpbmRleCArIDFdID0gdG9UU3R5bGluZ1JhbmdlKHRtcGxIZWFkLCAwKTtcbiAgICAgIC8vIGlmIGEgaG9zdCBiaW5kaW5nIGhhcyBhbHJlYWR5IGJlZW4gcmVnaXN0ZXJlZCwgd2UgbmVlZCB0byB1cGRhdGUgdGhlIG5leHQgb2YgdGhhdCBob3N0XG4gICAgICAvLyBiaW5kaW5nIHRvIHBvaW50IHRvIHRoaXMgb25lXG4gICAgICBpZiAodG1wbEhlYWQgIT09IDApIHtcbiAgICAgICAgLy8gV2UgbmVlZCB0byB1cGRhdGUgdGhlIHRlbXBsYXRlLXRhaWwgdmFsdWUgdG8gcG9pbnQgdG8gdXMuXG4gICAgICAgIHREYXRhW3RtcGxIZWFkICsgMV0gPSBzZXRUU3R5bGluZ1JhbmdlTmV4dCh0RGF0YVt0bXBsSGVhZCArIDFdIGFzIFRTdHlsaW5nUmFuZ2UsIGluZGV4KTtcbiAgICAgIH1cbiAgICAgIC8vIGlmIHdlIGRvbid0IGhhdmUgdGVtcGxhdGUsIHRoZSBoZWFkIHBvaW50cyB0byB0ZW1wbGF0ZS10YWlsLCBhbmQgbmVlZHMgdG8gYmUgYWR2YW5jZWQuXG4gICAgICB0bXBsSGVhZCA9IGluZGV4O1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICAvLyBXZSBhcmUgaW5zZXJ0aW5nIGluIHRlbXBsYXRlIHNlY3Rpb24uXG4gICAgLy8gV2UgbmVlZCB0byBzZXQgdGhpcyBiaW5kaW5nJ3MgXCJwcmV2aW91c1wiIHRvIHRoZSBjdXJyZW50IHRlbXBsYXRlIHRhaWxcbiAgICB0RGF0YVtpbmRleCArIDFdID0gdG9UU3R5bGluZ1JhbmdlKHRtcGxUYWlsLCAwKTtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RXF1YWwoXG4gICAgICAgICAgICAgICAgICAgICB0bXBsSGVhZCAhPT0gMCAmJiB0bXBsVGFpbCA9PT0gMCwgZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgICAnQWRkaW5nIHRlbXBsYXRlIGJpbmRpbmdzIGFmdGVyIGhvc3RCaW5kaW5ncyBpcyBub3QgYWxsb3dlZC4nKTtcbiAgICBpZiAodG1wbEhlYWQgPT09IDApIHtcbiAgICAgIHRtcGxIZWFkID0gaW5kZXg7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIFdlIG5lZWQgdG8gdXBkYXRlIHRoZSBwcmV2aW91cyB2YWx1ZSBcIm5leHRcIiB0byBwb2ludCB0byB0aGlzIGJpbmRpbmdcbiAgICAgIHREYXRhW3RtcGxUYWlsICsgMV0gPSBzZXRUU3R5bGluZ1JhbmdlTmV4dCh0RGF0YVt0bXBsVGFpbCArIDFdIGFzIFRTdHlsaW5nUmFuZ2UsIGluZGV4KTtcbiAgICB9XG4gICAgdG1wbFRhaWwgPSBpbmRleDtcbiAgfVxuXG4gIC8vIE5vdyB3ZSBuZWVkIHRvIHVwZGF0ZSAvIGNvbXB1dGUgdGhlIGR1cGxpY2F0ZXMuXG4gIC8vIFN0YXJ0aW5nIHdpdGggb3VyIGxvY2F0aW9uIHNlYXJjaCB0b3dhcmRzIGhlYWQgKGxlYXN0IHByaW9yaXR5KVxuICBtYXJrRHVwbGljYXRlcyhcbiAgICAgIHREYXRhLCB0U3R5bGluZ0tleSwgaW5kZXgsIChpc0NsYXNzQmluZGluZyA/IHROb2RlLmNsYXNzZXMgOiB0Tm9kZS5zdHlsZXMpIGFzIHN0cmluZywgdHJ1ZSxcbiAgICAgIGlzQ2xhc3NCaW5kaW5nKTtcbiAgbWFya0R1cGxpY2F0ZXModERhdGEsIHRTdHlsaW5nS2V5LCBpbmRleCwgJycsIGZhbHNlLCBpc0NsYXNzQmluZGluZyk7XG5cbiAgdEJpbmRpbmdzID0gdG9UU3R5bGluZ1JhbmdlKHRtcGxIZWFkLCB0bXBsVGFpbCk7XG4gIGlmIChpc0NsYXNzQmluZGluZykge1xuICAgIHROb2RlLmNsYXNzQmluZGluZ3MgPSB0QmluZGluZ3M7XG4gIH0gZWxzZSB7XG4gICAgdE5vZGUuc3R5bGVCaW5kaW5ncyA9IHRCaW5kaW5ncztcbiAgfVxufVxuXG4vKipcbiAqIE1hcmtzIGBUU3R5bGVWYWx1ZWBzIGFzIGR1cGxpY2F0ZXMgaWYgYW5vdGhlciBzdHlsZSBiaW5kaW5nIGluIHRoZSBsaXN0IGhhcyB0aGUgc2FtZVxuICogYFRTdHlsZVZhbHVlYC5cbiAqXG4gKiBOT1RFOiB0aGlzIGZ1bmN0aW9uIGlzIGludGVuZGVkIHRvIGJlIGNhbGxlZCB0d2ljZSBvbmNlIHdpdGggYGlzUHJldkRpcmAgc2V0IHRvIGB0cnVlYCBhbmQgb25jZVxuICogd2l0aCBpdCBzZXQgdG8gYGZhbHNlYCB0byBzZWFyY2ggYm90aCB0aGUgcHJldmlvdXMgYXMgd2VsbCBhcyBuZXh0IGl0ZW1zIGluIHRoZSBsaXN0LlxuICpcbiAqIE5vIGR1cGxpY2F0ZSBjYXNlXG4gKiBgYGBcbiAqICAgW3N0eWxlLmNvbG9yXVxuICogICBbc3R5bGUud2lkdGgucHhdIDw8LSBpbmRleFxuICogICBbc3R5bGUuaGVpZ2h0LnB4XVxuICogYGBgXG4gKlxuICogSW4gdGhlIGFib3ZlIGNhc2UgYWRkaW5nIGBbc3R5bGUud2lkdGgucHhdYCB0byB0aGUgZXhpc3RpbmcgYFtzdHlsZS5jb2xvcl1gIHByb2R1Y2VzIG5vXG4gKiBkdXBsaWNhdGVzIGJlY2F1c2UgYHdpZHRoYCBpcyBub3QgZm91bmQgaW4gYW55IG90aGVyIHBhcnQgb2YgdGhlIGxpbmtlZCBsaXN0LlxuICpcbiAqIER1cGxpY2F0ZSBjYXNlXG4gKiBgYGBcbiAqICAgW3N0eWxlLmNvbG9yXVxuICogICBbc3R5bGUud2lkdGguZW1dXG4gKiAgIFtzdHlsZS53aWR0aC5weF0gPDwtIGluZGV4XG4gKiBgYGBcbiAqIEluIHRoZSBhYm92ZSBjYXNlIGFkZGluZyBgW3N0eWxlLndpZHRoLnB4XWAgd2lsbCBwcm9kdWNlIGEgZHVwbGljYXRlIHdpdGggYFtzdHlsZS53aWR0aC5lbV1gXG4gKiBiZWNhdXNlIGB3aWR0aGAgaXMgZm91bmQgaW4gdGhlIGNoYWluLlxuICpcbiAqIE1hcCBjYXNlIDFcbiAqIGBgYFxuICogICBbc3R5bGUud2lkdGgucHhdXG4gKiAgIFtzdHlsZS5jb2xvcl1cbiAqICAgW3N0eWxlXSAgPDwtIGluZGV4XG4gKiBgYGBcbiAqIEluIHRoZSBhYm92ZSBjYXNlIGFkZGluZyBgW3N0eWxlXWAgd2lsbCBwcm9kdWNlIGEgZHVwbGljYXRlIHdpdGggYW55IG90aGVyIGJpbmRpbmdzIGJlY2F1c2VcbiAqIGBbc3R5bGVdYCBpcyBhIE1hcCBhbmQgYXMgc3VjaCBpcyBmdWxseSBkeW5hbWljIGFuZCBjb3VsZCBwcm9kdWNlIGBjb2xvcmAgb3IgYHdpZHRoYC5cbiAqXG4gKiBNYXAgY2FzZSAyXG4gKiBgYGBcbiAqICAgW3N0eWxlXVxuICogICBbc3R5bGUud2lkdGgucHhdXG4gKiAgIFtzdHlsZS5jb2xvcl0gIDw8LSBpbmRleFxuICogYGBgXG4gKiBJbiB0aGUgYWJvdmUgY2FzZSBhZGRpbmcgYFtzdHlsZS5jb2xvcl1gIHdpbGwgcHJvZHVjZSBhIGR1cGxpY2F0ZSBiZWNhdXNlIHRoZXJlIGlzIGFscmVhZHkgYVxuICogYFtzdHlsZV1gIGJpbmRpbmcgd2hpY2ggaXMgYSBNYXAgYW5kIGFzIHN1Y2ggaXMgZnVsbHkgZHluYW1pYyBhbmQgY291bGQgcHJvZHVjZSBgY29sb3JgIG9yXG4gKiBgd2lkdGhgLlxuICpcbiAqIE5PVEU6IE9uY2UgYFtzdHlsZV1gIChNYXApIGlzIGFkZGVkIGludG8gdGhlIHN5c3RlbSBhbGwgdGhpbmdzIGFyZSBtYXBwZWQgYXMgZHVwbGljYXRlcy5cbiAqIE5PVEU6IFdlIHVzZSBgc3R5bGVgIGFzIGV4YW1wbGUsIGJ1dCBzYW1lIGxvZ2ljIGlzIGFwcGxpZWQgdG8gYGNsYXNzYGVzIGFzIHdlbGwuXG4gKlxuICogQHBhcmFtIHREYXRhXG4gKiBAcGFyYW0gdFN0eWxpbmdLZXlcbiAqIEBwYXJhbSBpbmRleFxuICogQHBhcmFtIHN0YXRpY1ZhbHVlc1xuICogQHBhcmFtIGlzUHJldkRpclxuICovXG5mdW5jdGlvbiBtYXJrRHVwbGljYXRlcyhcbiAgICB0RGF0YTogVERhdGEsIHRTdHlsaW5nS2V5OiBUU3R5bGluZ0tleSwgaW5kZXg6IG51bWJlciwgc3RhdGljVmFsdWVzOiBzdHJpbmcsIGlzUHJldkRpcjogYm9vbGVhbixcbiAgICBpc0NsYXNzQmluZGluZzogYm9vbGVhbikge1xuICBjb25zdCB0U3R5bGluZ0F0SW5kZXggPSB0RGF0YVtpbmRleCArIDFdIGFzIFRTdHlsaW5nUmFuZ2U7XG4gIGNvbnN0IGtleTogc3RyaW5nfG51bGwgPSB0eXBlb2YgdFN0eWxpbmdLZXkgPT09ICdvYmplY3QnID8gdFN0eWxpbmdLZXkua2V5IDogdFN0eWxpbmdLZXk7XG4gIGNvbnN0IGlzTWFwID0ga2V5ID09PSBudWxsO1xuICBsZXQgY3Vyc29yID1cbiAgICAgIGlzUHJldkRpciA/IGdldFRTdHlsaW5nUmFuZ2VQcmV2KHRTdHlsaW5nQXRJbmRleCkgOiBnZXRUU3R5bGluZ1JhbmdlTmV4dCh0U3R5bGluZ0F0SW5kZXgpO1xuICBsZXQgZm91bmREdXBsaWNhdGUgPSBmYWxzZTtcbiAgLy8gV2Uga2VlcCBpdGVyYXRpbmcgYXMgbG9uZyBhcyB3ZSBoYXZlIGEgY3Vyc29yXG4gIC8vIEFORCBlaXRoZXI6IFdlIGZvdW5kIHdoYXQgd2UgYXJlIGxvb2tpbmcgZm9yLCBvciB3ZSBhcmUgYSBtYXAgaW4gd2hpY2ggY2FzZSB3ZSBoYXZlIHRvXG4gIC8vIGNvbnRpbnVlIHNlYXJjaGluZyBldmVuIGFmdGVyIHdlIGZpbmQgd2hhdCB3ZSB3ZXJlIGxvb2tpbmcgZm9yIHNpbmNlIHdlIGFyZSBhIHdpbGQgY2FyZFxuICAvLyBhbmQgZXZlcnl0aGluZyBuZWVkcyB0byBiZSBmbGlwcGVkIHRvIGR1cGxpY2F0ZS5cbiAgd2hpbGUgKGN1cnNvciAhPT0gMCAmJiAoZm91bmREdXBsaWNhdGUgPT09IGZhbHNlIHx8IGlzTWFwKSkge1xuICAgIGNvbnN0IHRTdHlsaW5nVmFsdWVBdEN1cnNvciA9IHREYXRhW2N1cnNvcl0gYXMgVFN0eWxpbmdLZXk7XG4gICAgY29uc3QgdFN0eWxlUmFuZ2VBdEN1cnNvciA9IHREYXRhW2N1cnNvciArIDFdIGFzIFRTdHlsaW5nUmFuZ2U7XG4gICAgY29uc3Qga2V5QXRDdXJzb3IgPSB0eXBlb2YgdFN0eWxpbmdWYWx1ZUF0Q3Vyc29yID09PSAnb2JqZWN0JyA/IHRTdHlsaW5nVmFsdWVBdEN1cnNvci5rZXkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0U3R5bGluZ1ZhbHVlQXRDdXJzb3I7XG4gICAgaWYgKGtleUF0Q3Vyc29yID09PSBudWxsIHx8IGtleSA9PSBudWxsIHx8IGtleUF0Q3Vyc29yID09PSBrZXkpIHtcbiAgICAgIGZvdW5kRHVwbGljYXRlID0gdHJ1ZTtcbiAgICAgIHREYXRhW2N1cnNvciArIDFdID0gaXNQcmV2RGlyID8gc2V0VFN0eWxpbmdSYW5nZU5leHREdXBsaWNhdGUodFN0eWxlUmFuZ2VBdEN1cnNvcikgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRUU3R5bGluZ1JhbmdlUHJldkR1cGxpY2F0ZSh0U3R5bGVSYW5nZUF0Q3Vyc29yKTtcbiAgICB9XG4gICAgY3Vyc29yID0gaXNQcmV2RGlyID8gZ2V0VFN0eWxpbmdSYW5nZVByZXYodFN0eWxlUmFuZ2VBdEN1cnNvcikgOlxuICAgICAgICAgICAgICAgICAgICAgICAgIGdldFRTdHlsaW5nUmFuZ2VOZXh0KHRTdHlsZVJhbmdlQXRDdXJzb3IpO1xuICB9XG4gIGlmIChzdGF0aWNWYWx1ZXMgIT09ICcnICYmICAvLyBJZiB3ZSBoYXZlIHN0YXRpYyB2YWx1ZXMgdG8gc2VhcmNoXG4gICAgICAhZm91bmREdXBsaWNhdGUgICAgICAgICAvLyBJZiB3ZSBoYXZlIGR1cGxpY2F0ZSBkb24ndCBib3RoZXIgc2luY2Ugd2UgYXJlIGFscmVhZHkgbWFya2VkIGFzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBkdXBsaWNhdGVcbiAgICAgICkge1xuICAgIGlmIChpc01hcCkge1xuICAgICAgLy8gaWYgd2UgYXJlIGEgTWFwIChhbmQgd2UgaGF2ZSBzdGF0aWNzKSB3ZSBtdXN0IGFzc3VtZSBkdXBsaWNhdGVcbiAgICAgIGZvdW5kRHVwbGljYXRlID0gdHJ1ZTtcbiAgICB9IGVsc2UgaWYgKHN0YXRpY1ZhbHVlcyAhPSBudWxsKSB7XG4gICAgICBmb3IgKGxldCBpID0gaXNDbGFzc0JpbmRpbmcgPyBwYXJzZUNsYXNzTmFtZShzdGF0aWNWYWx1ZXMpIDogcGFyc2VTdHlsZShzdGF0aWNWYWx1ZXMpOyAgLy9cbiAgICAgICAgICAgaSA+PSAwOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgICAgICBpID0gaXNDbGFzc0JpbmRpbmcgPyBwYXJzZUNsYXNzTmFtZU5leHQoc3RhdGljVmFsdWVzLCBpKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhcnNlU3R5bGVOZXh0KHN0YXRpY1ZhbHVlcywgaSkpIHtcbiAgICAgICAgaWYgKGdldExhc3RQYXJzZWRLZXkoc3RhdGljVmFsdWVzKSA9PT0ga2V5KSB7XG4gICAgICAgICAgZm91bmREdXBsaWNhdGUgPSB0cnVlO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG4gIGlmIChmb3VuZER1cGxpY2F0ZSkge1xuICAgIHREYXRhW2luZGV4ICsgMV0gPSBpc1ByZXZEaXIgPyBzZXRUU3R5bGluZ1JhbmdlUHJldkR1cGxpY2F0ZSh0U3R5bGluZ0F0SW5kZXgpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0VFN0eWxpbmdSYW5nZU5leHREdXBsaWNhdGUodFN0eWxpbmdBdEluZGV4KTtcbiAgfVxufVxuXG4vKipcbiAqIENvbXB1dGVzIHRoZSBuZXcgc3R5bGluZyB2YWx1ZSBzdGFydGluZyBhdCBgaW5kZXhgIHN0eWxpbmcgYmluZGluZy5cbiAqXG4gKiBAcGFyYW0gdERhdGEgYFREYXRhYCBjb250YWluaW5nIHRoZSBzdHlsaW5nIGJpbmRpbmcgbGlua2VkIGxpc3QuXG4gKiAgICAgICAgICAgICAgLSBgVERhdGFbaW5kZXhdYCBjb250YWlucyB0aGUgYmluZGluZyBuYW1lLlxuICogICAgICAgICAgICAgIC0gYFREYXRhW2luZGV4ICsgMV1gIGNvbnRhaW5zIHRoZSBgVFN0eWxpbmdSYW5nZWAgYSBsaW5rZWQgbGlzdCBvZiBvdGhlciBiaW5kaW5ncy5cbiAqIEBwYXJhbSB0Tm9kZSBgVE5vZGVgIGNvbnRhaW5pbmcgdGhlIGluaXRpYWwgc3R5bGluZyB2YWx1ZXMuXG4gKiBAcGFyYW0gbFZpZXcgYExWaWV3YCBjb250YWluaW5nIHRoZSBzdHlsaW5nIHZhbHVlcy5cbiAqICAgICAgICAgICAgICAtIGBMVmlld1tpbmRleF1gIGNvbnRhaW5zIHRoZSBiaW5kaW5nIHZhbHVlLlxuICogICAgICAgICAgICAgIC0gYExWaWV3W2luZGV4ICsgMV1gIGNvbnRhaW5zIHRoZSBjb25jYXRlbmF0ZWQgdmFsdWUgdXAgdG8gdGhpcyBwb2ludC5cbiAqIEBwYXJhbSBpbmRleCB0aGUgbG9jYXRpb24gaW4gYFREYXRhYC9gTFZpZXdgIHdoZXJlIHRoZSBzdHlsaW5nIHNlYXJjaCBzaG91bGQgc3RhcnQuXG4gKiBAcGFyYW0gaXNDbGFzc0JpbmRpbmcgYHRydWVgIGlmIGJpbmRpbmcgdG8gYGNsYXNzTmFtZWA7IGBmYWxzZWAgd2hlbiBiaW5kaW5nIHRvIGBzdHlsZWAuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBmbHVzaFN0eWxlQmluZGluZyhcbiAgICB0RGF0YTogVERhdGEsIHROb2RlOiBUTm9kZSwgbFZpZXc6IExWaWV3LCBpbmRleDogbnVtYmVyLCBpc0NsYXNzQmluZGluZzogYm9vbGVhbik6IHN0cmluZyB7XG4gIGNvbnN0IHRTdHlsaW5nUmFuZ2VBdEluZGV4ID0gdERhdGFbaW5kZXggKyAxXSBhcyBUU3R5bGluZ1JhbmdlO1xuICAvLyBXaGVuIHN0eWxpbmcgY2hhbmdlcyB3ZSBkb24ndCBoYXZlIHRvIHN0YXJ0IGF0IHRoZSBiZWdnaW5nLiBJbnN0ZWFkIHdlIHN0YXJ0IGF0IHRoZSBjaGFuZ2VcbiAgLy8gdmFsdWUgYW5kIGxvb2sgdXAgdGhlIHByZXZpb3VzIGNvbmNhdGVuYXRpb24gYXMgYSBzdGFydGluZyBwb2ludCBnb2luZyBmb3J3YXJkLlxuICBjb25zdCBsYXN0VW5jaGFuZ2VkVmFsdWVJbmRleCA9IGdldFRTdHlsaW5nUmFuZ2VQcmV2KHRTdHlsaW5nUmFuZ2VBdEluZGV4KTtcbiAgbGV0IHRleHQgPSBsYXN0VW5jaGFuZ2VkVmFsdWVJbmRleCA9PT0gMCA/XG4gICAgICAoKGlzQ2xhc3NCaW5kaW5nID8gdE5vZGUuY2xhc3NlcyA6IHROb2RlLnN0eWxlcykgYXMgc3RyaW5nKSA6XG4gICAgICBsVmlld1tsYXN0VW5jaGFuZ2VkVmFsdWVJbmRleCArIDFdIGFzIHN0cmluZztcbiAgbGV0IGN1cnNvciA9IGluZGV4O1xuICB3aGlsZSAoY3Vyc29yICE9PSAwKSB7XG4gICAgY29uc3QgdmFsdWUgPSBsVmlld1tjdXJzb3JdO1xuICAgIGNvbnN0IGtleSA9IHREYXRhW2N1cnNvcl0gYXMgVFN0eWxpbmdLZXk7XG4gICAgY29uc3Qgc3R5bGluZ1JhbmdlID0gdERhdGFbY3Vyc29yICsgMV0gYXMgVFN0eWxpbmdSYW5nZTtcbiAgICBsVmlld1tjdXJzb3IgKyAxXSA9IHRleHQgPSBhcHBlbmRTdHlsaW5nKFxuICAgICAgICB0ZXh0LCBrZXksIHZhbHVlLCBudWxsLCBnZXRUU3R5bGluZ1JhbmdlUHJldkR1cGxpY2F0ZShzdHlsaW5nUmFuZ2UpLCBpc0NsYXNzQmluZGluZyk7XG4gICAgY3Vyc29yID0gZ2V0VFN0eWxpbmdSYW5nZU5leHQoc3R5bGluZ1JhbmdlKTtcbiAgfVxuICByZXR1cm4gdGV4dDtcbn1cblxuXG4vKipcbiAqIEFwcGVuZCBuZXcgc3R5bGluZyB0byB0aGUgY3VycmVudGx5IGNvbmNhdGVuYXRlZCBzdHlsaW5nIHRleHQuXG4gKlxuICogVGhpcyBmdW5jdGlvbiBjb25jYXRlbmF0ZXMgdGhlIGV4aXN0aW5nIGBjbGFzc05hbWVgL2Bjc3NUZXh0YCB0ZXh0IHdpdGggdGhlIGJpbmRpbmcgdmFsdWUuXG4gKlxuICogQHBhcmFtIHRleHQgVGV4dCB0byBjb25jYXRlbmF0ZSB0by5cbiAqIEBwYXJhbSBzdHlsaW5nS2V5IGBUU3R5bGluZ0tleWAgaG9sZGluZyB0aGUga2V5IChjbGFzc05hbWUgb3Igc3R5bGUgcHJvcGVydHkgbmFtZSkuXG4gKiBAcGFyYW0gdmFsdWUgVGhlIHZhbHVlIGZvciB0aGUga2V5LlxuICogICAgICAgICAtIGBpc0NsYXNzQmluZGluZyA9PT0gdHJ1ZWBcbiAqICAgICAgICAgICAgICAtIGBib29sZWFuYCBpZiBgdHJ1ZWAgdGhlbiBhZGQgdGhlIGtleSB0byB0aGUgY2xhc3MgbGlzdCBzdHJpbmcuXG4gKiAgICAgICAgICAgICAgLSBgQXJyYXlgIGFkZCBlYWNoIHN0cmluZyB2YWx1ZSB0byB0aGUgY2xhc3MgbGlzdCBzdHJpbmcuXG4gKiAgICAgICAgICAgICAgLSBgT2JqZWN0YCBhZGQgb2JqZWN0IGtleSB0byB0aGUgY2xhc3MgbGlzdCBzdHJpbmcgaWYgdGhlIGtleSB2YWx1ZSBpcyB0cnV0aHkuXG4gKiAgICAgICAgIC0gYGlzQ2xhc3NCaW5kaW5nID09PSBmYWxzZWBcbiAqICAgICAgICAgICAgICAtIGBBcnJheWAgTm90IHN1cHBvcnRlZC5cbiAqICAgICAgICAgICAgICAtIGBPYmplY3RgIGFkZCBvYmplY3Qga2V5L3ZhbHVlIHRvIHRoZSBzdHlsZXMuXG4gKiBAcGFyYW0gc2FuaXRpemVyIE9wdGlvbmFsIHNhbml0aXplciB0byB1c2UuIElmIGBudWxsYCB0aGUgYHN0eWxpbmdLZXlgIHNhbml0aXplciB3aWxsIGJlIHVzZWQuXG4gKiAgICAgICAgVGhpcyBpcyBwcm92aWRlZCBzbyB0aGF0IGDJtcm1c3R5bGVNYXAoKWAvYMm1ybVjbGFzc01hcCgpYCBjYW4gcmVjdXJzaXZlbHkgY2FsbFxuICogICAgICAgIGBhcHBlbmRTdHlsaW5nYCB3aXRob3V0IGhhdmluZyB0YSBwYWNrYWdlIHRoZSBzYW5pdGl6ZXIgaW50byBgVFN0eWxpbmdTYW5pdGl6YXRpb25LZXlgLlxuICogQHBhcmFtIGhhc1ByZXZpb3VzRHVwbGljYXRlIGRldGVybWluZXMgaWYgdGhlcmUgaXMgYSBjaGFuY2Ugb2YgZHVwbGljYXRlLlxuICogICAgICAgICAtIGB0cnVlYCB0aGUgZXhpc3RpbmcgYHRleHRgIHNob3VsZCBiZSBzZWFyY2hlZCBmb3IgZHVwbGljYXRlcyBhbmQgaWYgYW55IGZvdW5kIHRoZXlcbiAqICAgICAgICAgICBzaG91bGQgYmUgcmVtb3ZlZC5cbiAqICAgICAgICAgLSBgZmFsc2VgIEZhc3QgcGF0aCwganVzdCBjb25jYXRlbmF0ZSB0aGUgc3RyaW5ncy5cbiAqIEBwYXJhbSBpc0NsYXNzQmluZGluZyBEZXRlcm1pbmVzIGlmIHRoZSBgdGV4dGAgaXMgYGNsYXNzTmFtZWAgb3IgYGNzc1RleHRgLlxuICogQHJldHVybnMgbmV3IHN0eWxpbmcgc3RyaW5nIHdpdGggdGhlIGNvbmNhdGVuYXRlZCB2YWx1ZXMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhcHBlbmRTdHlsaW5nKFxuICAgIHRleHQ6IHN0cmluZywgc3R5bGluZ0tleTogVFN0eWxpbmdLZXksIHZhbHVlOiBhbnksIHNhbml0aXplcjogU2FuaXRpemVyRm4gfCBudWxsLFxuICAgIGhhc1ByZXZpb3VzRHVwbGljYXRlOiBib29sZWFuLCBpc0NsYXNzQmluZGluZzogYm9vbGVhbik6IHN0cmluZyB7XG4gIGxldCBrZXk6IHN0cmluZztcbiAgbGV0IHN1ZmZpeE9yU2FuaXRpemVyOiBzdHJpbmd8U2FuaXRpemVyRm58dW5kZWZpbmVkfG51bGwgPSBzYW5pdGl6ZXI7XG4gIGlmICh0eXBlb2Ygc3R5bGluZ0tleSA9PT0gJ29iamVjdCcpIHtcbiAgICBpZiAoc3R5bGluZ0tleS5rZXkgPT09IG51bGwpIHtcbiAgICAgIHJldHVybiB2YWx1ZSAhPSBudWxsID8gc3R5bGluZ0tleS5leHRyYSh0ZXh0LCB2YWx1ZSwgaGFzUHJldmlvdXNEdXBsaWNhdGUpIDogdGV4dDtcbiAgICB9IGVsc2Uge1xuICAgICAgc3VmZml4T3JTYW5pdGl6ZXIgPSBzdHlsaW5nS2V5LmV4dHJhO1xuICAgICAga2V5ID0gc3R5bGluZ0tleS5rZXk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGtleSA9IHN0eWxpbmdLZXk7XG4gIH1cbiAgaWYgKGlzQ2xhc3NCaW5kaW5nKSB7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydEVxdWFsKHR5cGVvZiBzdHlsaW5nS2V5ID09PSAnc3RyaW5nJywgdHJ1ZSwgJ0V4cGVjdGluZyBrZXkgdG8gYmUgc3RyaW5nJyk7XG4gICAgaWYgKGhhc1ByZXZpb3VzRHVwbGljYXRlKSB7XG4gICAgICB0ZXh0ID0gdG9nZ2xlQ2xhc3ModGV4dCwgc3R5bGluZ0tleSBhcyBzdHJpbmcsICEhdmFsdWUpO1xuICAgIH0gZWxzZSBpZiAodmFsdWUpIHtcbiAgICAgIHRleHQgPSB0ZXh0ID09PSAnJyA/IHN0eWxpbmdLZXkgYXMgc3RyaW5nIDogdGV4dCArICcgJyArIHN0eWxpbmdLZXk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGlmIChoYXNQcmV2aW91c0R1cGxpY2F0ZSkge1xuICAgICAgdGV4dCA9IHJlbW92ZVN0eWxlKHRleHQsIGtleSk7XG4gICAgfVxuICAgIGNvbnN0IGtleVZhbHVlID1cbiAgICAgICAga2V5ICsgJzogJyArICh0eXBlb2Ygc3VmZml4T3JTYW5pdGl6ZXIgPT09ICdmdW5jdGlvbicgP1xuICAgICAgICAgICAgICAgICAgICAgICAgICBzdWZmaXhPclNhbml0aXplcih2YWx1ZSkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAoc3VmZml4T3JTYW5pdGl6ZXIgPT0gbnVsbCA/IHZhbHVlIDogdmFsdWUgKyBzdWZmaXhPclNhbml0aXplcikpO1xuICAgIHRleHQgPSB0ZXh0ID09PSAnJyA/IGtleVZhbHVlIDogdGV4dCArICc7ICcgKyBrZXlWYWx1ZTtcbiAgfVxuICByZXR1cm4gdGV4dDtcbn1cblxuLyoqXG4gKiBgybXJtWNsYXNzTWFwKClgIGluc2VydHMgYENMQVNTX01BUF9TVFlMSU5HX0tFWWAgYXMgYSBrZXkgdG8gdGhlIGBpbnNlcnRUU3R5bGluZ0JpbmRpbmcoKWAuXG4gKlxuICogVGhlIHB1cnBvc2Ugb2YgdGhpcyBrZXkgaXMgdG8gYWRkIGNsYXNzIG1hcCBhYmlsaXRpZXMgdG8gdGhlIGNvbmNhdGVuYXRpb24gaW4gYSB0cmVlIHNoYWthYmxlXG4gKiB3YXkuIElmIGDJtcm1Y2xhc3NNYXAoKWAgaXMgbm90IHJlZmVyZW5jZWQgdGhhbiBgQ0xBU1NfTUFQX1NUWUxJTkdfS0VZYCB3aWxsIGJlY29tZSBlbGlnaWJsZSBmb3JcbiAqIHRyZWUgc2hha2luZy5cbiAqXG4gKiBUaGlzIGtleSBzdXBwb3J0czogYHN0cmluZ3NgLCBgb2JqZWN0YCAoYXMgTWFwKSBhbmQgYEFycmF5YC4gSW4gZWFjaCBjYXNlIGl0IGlzIG5lY2Vzc2FyeSB0b1xuICogYnJlYWsgdGhlIGNsYXNzZXMgaW50byBwYXJ0cyBhbmQgY29uY2F0ZW5hdGUgdGhlIHBhcnRzIGludG8gdGhlIGB0ZXh0YC4gVGhlIGNvbmNhdGVuYXRpb24gbmVlZHNcbiAqIHRvIGJlIGRvbmUgaW4gcGFydHMgYXMgZWFjaCBrZXkgaXMgaW5kaXZpZHVhbGx5IHN1YmplY3QgdG8gb3ZlcndyaXRlcy5cbiAqL1xuZXhwb3J0IGNvbnN0IENMQVNTX01BUF9TVFlMSU5HX0tFWTogVFN0eWxpbmdNYXBLZXkgPSB7XG4gIGtleTogbnVsbCxcbiAgZXh0cmE6ICh0ZXh0OiBzdHJpbmcsIHZhbHVlOiBhbnksIGhhc1ByZXZpb3VzRHVwbGljYXRlOiBib29sZWFuKTogc3RyaW5nID0+IHtcbiAgICBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcbiAgICAgIC8vIFdlIHN1cHBvcnQgQXJyYXlzXG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHZhbHVlLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHRleHQgPSBhcHBlbmRTdHlsaW5nKHRleHQsIHZhbHVlW2ldLCB0cnVlLCBudWxsLCBoYXNQcmV2aW91c0R1cGxpY2F0ZSwgdHJ1ZSk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmICh0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnKSB7XG4gICAgICAvLyBXZSBzdXBwb3J0IG1hcHNcbiAgICAgIGZvciAobGV0IGtleSBpbiB2YWx1ZSkge1xuICAgICAgICB0ZXh0ID0gYXBwZW5kU3R5bGluZyh0ZXh0LCBrZXksIHZhbHVlW2tleV0sIG51bGwsIGhhc1ByZXZpb3VzRHVwbGljYXRlLCB0cnVlKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgIC8vIFdlIHN1cHBvcnQgc3RyaW5nc1xuICAgICAgaWYgKGhhc1ByZXZpb3VzRHVwbGljYXRlKSB7XG4gICAgICAgIC8vIFdlIG5lZWQgdG8gcGFyc2UgYW5kIHByb2Nlc3MgaXQuXG4gICAgICAgIGNvbnN0IGNoYW5nZXMgPSBuZXcgTWFwPHN0cmluZywgYm9vbGVhbnxudWxsPigpO1xuICAgICAgICBzcGxpdENsYXNzTGlzdCh2YWx1ZSwgY2hhbmdlcywgZmFsc2UpO1xuICAgICAgICBjaGFuZ2VzLmZvckVhY2goKF8sIGtleSkgPT4gdGV4dCA9IGFwcGVuZFN0eWxpbmcodGV4dCwga2V5LCB0cnVlLCBudWxsLCB0cnVlLCB0cnVlKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBObyBkdXBsaWNhdGVzLCBqdXN0IGFwcGVuZCBpdC5cbiAgICAgICAgdGV4dCA9IHRleHQgPT09ICcnID8gdmFsdWUgOiB0ZXh0ICsgJyAnICsgdmFsdWU7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIEFsbCBvdGhlciBjYXNlcyBhcmUgbm90IHN1cHBvcnRlZC5cbiAgICAgIG5nRGV2TW9kZSAmJiB0aHJvd0Vycm9yKCdVbnN1cHBvcnRlZCB2YWx1ZSBmb3IgY2xhc3MgYmluZGluZzogJyArIHZhbHVlKTtcbiAgICB9XG4gICAgcmV0dXJuIHRleHQ7XG4gIH1cbn07XG5cbi8qKlxuICogYMm1ybVzdHlsZU1hcCgpYCBpbnNlcnRzIGBTVFlMRV9NQVBfU1RZTElOR19LRVlgIGFzIGEga2V5IHRvIHRoZSBgaW5zZXJ0VFN0eWxpbmdCaW5kaW5nKClgLlxuICpcbiAqIFRoZSBwdXJwb3NlIG9mIHRoaXMga2V5IGlzIHRvIGFkZCBzdHlsZSBtYXAgYWJpbGl0aWVzIHRvIHRoZSBjb25jYXRlbmF0aW9uIGluIGEgdHJlZSBzaGFrYWJsZVxuICogd2F5LiBJZiBgybXJtXN0eWxlTWFwKClgIGlzIG5vdCByZWZlcmVuY2VkIHRoYW4gYFNUWUxFX01BUF9TVFlMSU5HX0tFWWAgd2lsbCBiZWNvbWUgZWxpZ2libGUgZm9yXG4gKiB0cmVlIHNoYWtpbmcuIChgU1RZTEVfTUFQX1NUWUxJTkdfS0VZYCBhbHNvIHB1bGxzIGluIHRoZSBzYW5pdGl6ZXIgYXMgYMm1ybVzdHlsZU1hcCgpYCBjb3VsZCBoYXZlXG4gKiBhIHNhbml0aXphYmxlIHByb3BlcnR5LilcbiAqXG4gKiBUaGlzIGtleSBzdXBwb3J0czogYHN0cmluZ3NgLCBhbmQgYG9iamVjdGAgKGFzIE1hcCkuIEluIGVhY2ggY2FzZSBpdCBpcyBuZWNlc3NhcnkgdG9cbiAqIGJyZWFrIHRoZSBzdHlsZSBpbnRvIHBhcnRzIGFuZCBjb25jYXRlbmF0ZSB0aGUgcGFydHMgaW50byB0aGUgYHRleHRgLiBUaGUgY29uY2F0ZW5hdGlvbiBuZWVkc1xuICogdG8gYmUgZG9uZSBpbiBwYXJ0cyBhcyBlYWNoIGtleSBpcyBpbmRpdmlkdWFsbHkgc3ViamVjdCB0byBvdmVyd3JpdGVzLlxuICovXG5leHBvcnQgY29uc3QgU1RZTEVfTUFQX1NUWUxJTkdfS0VZOiBUU3R5bGluZ01hcEtleSA9IHtcbiAga2V5OiBudWxsLFxuICBleHRyYTogKHRleHQ6IHN0cmluZywgdmFsdWU6IGFueSwgaGFzUHJldmlvdXNEdXBsaWNhdGU6IGJvb2xlYW4pOiBzdHJpbmcgPT4ge1xuICAgIGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSkge1xuICAgICAgLy8gV2UgZG9uJ3Qgc3VwcG9ydCBBcnJheXNcbiAgICAgIG5nRGV2TW9kZSAmJiB0aHJvd0Vycm9yKCdTdHlsZSBiaW5kaW5ncyBkbyBub3Qgc3VwcG9ydCBhcnJheSBiaW5kaW5nczogJyArIHZhbHVlKTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcpIHtcbiAgICAgIC8vIFdlIHN1cHBvcnQgbWFwc1xuICAgICAgZm9yIChsZXQga2V5IGluIHZhbHVlKSB7XG4gICAgICAgIHRleHQgPSBhcHBlbmRTdHlsaW5nKFxuICAgICAgICAgICAgdGV4dCwga2V5LCB2YWx1ZVtrZXldLCBzdHlsZVByb3BOZWVkc1Nhbml0aXphdGlvbihrZXkpID8gybXJtXNhbml0aXplU3R5bGUgOiBudWxsLFxuICAgICAgICAgICAgaGFzUHJldmlvdXNEdXBsaWNhdGUsIGZhbHNlKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgIC8vIFdlIHN1cHBvcnQgc3RyaW5nc1xuICAgICAgaWYgKGhhc1ByZXZpb3VzRHVwbGljYXRlKSB7XG4gICAgICAgIC8vIFdlIG5lZWQgdG8gcGFyc2UgYW5kIHByb2Nlc3MgaXQuXG4gICAgICAgIGNvbnN0IGNoYW5nZXM6IFN0eWxlQ2hhbmdlc01hcCA9XG4gICAgICAgICAgICBuZXcgTWFwPHN0cmluZywge29sZDogc3RyaW5nIHwgbnVsbCwgbmV3OiBzdHJpbmcgfCBudWxsfT4oKTtcbiAgICAgICAgcGFyc2VLZXlWYWx1ZSh2YWx1ZSwgY2hhbmdlcywgZmFsc2UpO1xuICAgICAgICBjaGFuZ2VzLmZvckVhY2goXG4gICAgICAgICAgICAodmFsdWUsIGtleSkgPT4gdGV4dCA9IGFwcGVuZFN0eWxpbmcoXG4gICAgICAgICAgICAgICAgdGV4dCwga2V5LCB2YWx1ZS5vbGQsIHN0eWxlUHJvcE5lZWRzU2FuaXRpemF0aW9uKGtleSkgPyDJtcm1c2FuaXRpemVTdHlsZSA6IG51bGwsXG4gICAgICAgICAgICAgICAgdHJ1ZSwgZmFsc2UpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIE5vIGR1cGxpY2F0ZXMsIGp1c3QgYXBwZW5kIGl0LlxuICAgICAgICB0ZXh0ID0gdGV4dCA9PT0gJycgPyB2YWx1ZSA6IHRleHQgKyAnOyAnICsgdmFsdWU7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIEFsbCBvdGhlciBjYXNlcyBhcmUgbm90IHN1cHBvcnRlZC5cbiAgICAgIG5nRGV2TW9kZSAmJiB0aHJvd0Vycm9yKCdVbnN1cHBvcnRlZCB2YWx1ZSBmb3Igc3R5bGUgYmluZGluZzogJyArIHZhbHVlKTtcbiAgICB9XG4gICAgcmV0dXJuIHRleHQ7XG4gIH1cbn07XG4iXX0=