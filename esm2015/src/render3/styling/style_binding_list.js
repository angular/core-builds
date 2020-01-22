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
    ngDevMode && assertEqual(getLView()[TVIEW].firstUpdatePass, true, 'Should be called during \'firstUpdatePass` only.');
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
    markDuplicates(tData, tStylingKey, index, (/** @type {?} */ ((isClassBinding ? tNode.classes : tNode.styles))), true, isClassBinding);
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
    const key = typeof tStylingKey === 'object' ? tStylingKey.key : tStylingKey;
    /** @type {?} */
    const isMap = key === null;
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
        /** @type {?} */
        const keyAtCursor = typeof tStylingValueAtCursor === 'object' ? tStylingValueAtCursor.key :
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
            for (let i = isClassBinding ? parseClassName(staticValues) : parseStyle(staticValues); //
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
 * @param {?} tData `TData` containing the styling binding linked list.
 *              - `TData[index]` contains the binding name.
 *              - `TData[index + 1]` contains the `TStylingRange` a linked list of other bindings.
 * @param {?} tNode `TNode` containing the initial styling values.
 * @param {?} lView `LView` containing the styling values.
 *              - `LView[index]` contains the binding value.
 *              - `LView[index + 1]` contains the concatenated value up to this point.
 * @param {?} index the location in `TData`/`LView` where the styling search should start.
 * @param {?} isClassBinding `true` if binding to `className`; `false` when binding to `style`.
 * @return {?}
 */
export function flushStyleBinding(tData, tNode, lView, index, isClassBinding) {
    /** @type {?} */
    const tStylingRangeAtIndex = (/** @type {?} */ (tData[index + 1]));
    // When styling changes we don't have to start at the begging. Instead we start at the change
    // value and look up the previous concatenation as a starting point going forward.
    /** @type {?} */
    const lastUnchangedValueIndex = getTStylingRangePrev(tStylingRangeAtIndex);
    /** @type {?} */
    let text = lastUnchangedValueIndex === 0 ?
        ((/** @type {?} */ ((isClassBinding ? tNode.classes : tNode.styles)))) :
        (/** @type {?} */ (lView[lastUnchangedValueIndex + 1]));
    /** @type {?} */
    let cursor = index;
    while (cursor !== 0) {
        /** @type {?} */
        const value = lView[cursor];
        /** @type {?} */
        const key = (/** @type {?} */ (tData[cursor]));
        /** @type {?} */
        const stylingRange = (/** @type {?} */ (tData[cursor + 1]));
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
 * @param {?} text Text to concatenate to.
 * @param {?} stylingKey `TStylingKey` holding the key (className or style property name).
 * @param {?} value The value for the key.
 *         - `isClassBinding === true`
 *              - `boolean` if `true` then add the key to the class list string.
 *              - `Array` add each string value to the class list string.
 *              - `Object` add object key to the class list string if the key value is truthy.
 *         - `isClassBinding === false`
 *              - `Array` Not supported.
 *              - `Object` add object key/value to the styles.
 * @param {?} sanitizer Optional sanitizer to use. If `null` the `stylingKey` sanitizer will be used.
 *        This is provided so that `ɵɵstyleMap()`/`ɵɵclassMap()` can recursively call
 *        `appendStyling` without having ta package the sanitizer into `TStylingSanitizationKey`.
 * @param {?} hasPreviousDuplicate determines if there is a chance of duplicate.
 *         - `true` the existing `text` should be searched for duplicates and if any found they
 *           should be removed.
 *         - `false` Fast path, just concatenate the strings.
 * @param {?} isClassBinding Determines if the `text` is `className` or `cssText`.
 * @return {?} new styling string with the concatenated values.
 */
export function appendStyling(text, stylingKey, value, sanitizer, hasPreviousDuplicate, isClassBinding) {
    /** @type {?} */
    let key;
    /** @type {?} */
    let suffixOrSanitizer = sanitizer;
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
            text = toggleClass(text, (/** @type {?} */ (stylingKey)), !!value);
        }
        else if (value) {
            text = text === '' ? (/** @type {?} */ (stylingKey)) : text + ' ' + stylingKey;
        }
    }
    else {
        if (hasPreviousDuplicate) {
            text = removeStyle(text, key);
        }
        /** @type {?} */
        const keyValue = key + ': ' + (typeof suffixOrSanitizer === 'function' ?
            suffixOrSanitizer(value) :
            (suffixOrSanitizer == null ? value : value + suffixOrSanitizer));
        text = text === '' ? keyValue : text + '; ' + keyValue;
    }
    return text;
}
const ɵ0 = /**
 * @param {?} text
 * @param {?} value
 * @param {?} hasPreviousDuplicate
 * @return {?}
 */
(text, value, hasPreviousDuplicate) => {
    if (Array.isArray(value)) {
        // We support Arrays
        for (let i = 0; i < value.length; i++) {
            text = appendStyling(text, value[i], true, null, hasPreviousDuplicate, true);
        }
    }
    else if (typeof value === 'object') {
        // We support maps
        for (let key in value) {
            text = appendStyling(text, key, value[key], null, hasPreviousDuplicate, true);
        }
    }
    else if (typeof value === 'string') {
        // We support strings
        if (hasPreviousDuplicate) {
            // We need to parse and process it.
            /** @type {?} */
            const changes = new Map();
            splitClassList(value, changes, false);
            changes.forEach((/**
             * @param {?} _
             * @param {?} key
             * @return {?}
             */
            (_, key) => text = appendStyling(text, key, true, null, true, true)));
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
 * @type {?}
 */
export const CLASS_MAP_STYLING_KEY = {
    key: null,
    extra: (ɵ0)
};
const ɵ1 = /**
 * @param {?} text
 * @param {?} value
 * @param {?} hasPreviousDuplicate
 * @return {?}
 */
(text, value, hasPreviousDuplicate) => {
    if (Array.isArray(value)) {
        // We don't support Arrays
        ngDevMode && throwError('Style bindings do not support array bindings: ' + value);
    }
    else if (typeof value === 'object') {
        // We support maps
        for (let key in value) {
            text = appendStyling(text, key, value[key], stylePropNeedsSanitization(key) ? ɵɵsanitizeStyle : null, hasPreviousDuplicate, false);
        }
    }
    else if (typeof value === 'string') {
        // We support strings
        if (hasPreviousDuplicate) {
            // We need to parse and process it.
            /** @type {?} */
            const changes = new Map();
            parseKeyValue(value, changes, false);
            changes.forEach((/**
             * @param {?} value
             * @param {?} key
             * @return {?}
             */
            (value, key) => text = appendStyling(text, key, value.old, stylePropNeedsSanitization(key) ? ɵɵsanitizeStyle : null, true, false)));
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
 * @type {?}
 */
export const STYLE_MAP_STYLING_KEY = {
    key: null,
    extra: (ɵ1)
};
export { ɵ0, ɵ1 };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3R5bGVfYmluZGluZ19saXN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9zdHlsaW5nL3N0eWxlX2JpbmRpbmdfbGlzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFRQSxPQUFPLEVBQUMsMEJBQTBCLEVBQUUsZUFBZSxFQUFDLE1BQU0saUNBQWlDLENBQUM7QUFDNUYsT0FBTyxFQUFDLFdBQVcsRUFBRSxVQUFVLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUcxRCxPQUFPLEVBQTZDLG9CQUFvQixFQUFFLG9CQUFvQixFQUFFLDZCQUE2QixFQUFFLG9CQUFvQixFQUFFLDZCQUE2QixFQUFFLG9CQUFvQixFQUFFLDZCQUE2QixFQUFFLGVBQWUsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQ3ZSLE9BQU8sRUFBZSxLQUFLLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUN2RCxPQUFPLEVBQUMsUUFBUSxFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQ2xDLE9BQU8sRUFBQyxjQUFjLEVBQUUsV0FBVyxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFDM0QsT0FBTyxFQUFrQixhQUFhLEVBQUUsV0FBVyxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFDM0UsT0FBTyxFQUFDLGdCQUFnQixFQUFFLGNBQWMsRUFBRSxrQkFBa0IsRUFBRSxVQUFVLEVBQUUsY0FBYyxFQUFDLE1BQU0sa0JBQWtCLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFtTGxILE1BQU0sVUFBVSxxQkFBcUIsQ0FDakMsS0FBWSxFQUFFLEtBQVksRUFBRSxXQUF3QixFQUFFLEtBQWEsRUFBRSxhQUFzQixFQUMzRixjQUF1QjtJQUN6QixTQUFTLElBQUksV0FBVyxDQUNQLFFBQVEsRUFBRSxDQUFDLEtBQUssQ0FBQyxDQUFDLGVBQWUsRUFBRSxJQUFJLEVBQ3ZDLGtEQUFrRCxDQUFDLENBQUM7O1FBQ2pFLFNBQVMsR0FBRyxjQUFjLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxhQUFhOztRQUN0RSxRQUFRLEdBQUcsb0JBQW9CLENBQUMsU0FBUyxDQUFDOztRQUMxQyxRQUFRLEdBQUcsb0JBQW9CLENBQUMsU0FBUyxDQUFDO0lBRTlDLEtBQUssQ0FBQyxLQUFLLENBQUMsR0FBRyxXQUFXLENBQUM7SUFDM0IsSUFBSSxhQUFhLEVBQUU7Ozs7Y0FJWCxtQkFBbUIsR0FBRyxRQUFRLEtBQUssQ0FBQztRQUMxQyx3RkFBd0Y7UUFDeEYsMkZBQTJGO1FBQzNGLElBQUksbUJBQW1CLEVBQUU7OztrQkFFakIsWUFBWSxHQUFHLG9CQUFvQixDQUFDLG1CQUFBLEtBQUssQ0FBQyxRQUFRLEdBQUcsQ0FBQyxDQUFDLEVBQWlCLENBQUM7WUFDL0UsS0FBSyxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsR0FBRyxlQUFlLENBQUMsWUFBWSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBQzNELHlGQUF5RjtZQUN6RiwrQkFBK0I7WUFDL0IsSUFBSSxZQUFZLEtBQUssQ0FBQyxFQUFFO2dCQUN0Qiw0REFBNEQ7Z0JBQzVELEtBQUssQ0FBQyxZQUFZLEdBQUcsQ0FBQyxDQUFDO29CQUNuQixvQkFBb0IsQ0FBQyxtQkFBQSxLQUFLLENBQUMsWUFBWSxHQUFHLENBQUMsQ0FBQyxFQUFpQixFQUFFLEtBQUssQ0FBQyxDQUFDO2FBQzNFO1lBQ0QsZ0ZBQWdGO1lBQ2hGLEtBQUssQ0FBQyxRQUFRLEdBQUcsQ0FBQyxDQUFDLEdBQUcsb0JBQW9CLENBQUMsbUJBQUEsS0FBSyxDQUFDLFFBQVEsR0FBRyxDQUFDLENBQUMsRUFBaUIsRUFBRSxLQUFLLENBQUMsQ0FBQztTQUN6RjthQUFNO1lBQ0wsS0FBSyxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsR0FBRyxlQUFlLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2hELHlGQUF5RjtZQUN6RiwrQkFBK0I7WUFDL0IsSUFBSSxRQUFRLEtBQUssQ0FBQyxFQUFFO2dCQUNsQiw0REFBNEQ7Z0JBQzVELEtBQUssQ0FBQyxRQUFRLEdBQUcsQ0FBQyxDQUFDLEdBQUcsb0JBQW9CLENBQUMsbUJBQUEsS0FBSyxDQUFDLFFBQVEsR0FBRyxDQUFDLENBQUMsRUFBaUIsRUFBRSxLQUFLLENBQUMsQ0FBQzthQUN6RjtZQUNELHlGQUF5RjtZQUN6RixRQUFRLEdBQUcsS0FBSyxDQUFDO1NBQ2xCO0tBQ0Y7U0FBTTtRQUNMLHdDQUF3QztRQUN4Qyx3RUFBd0U7UUFDeEUsS0FBSyxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsR0FBRyxlQUFlLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ2hELFNBQVMsSUFBSSxXQUFXLENBQ1AsUUFBUSxLQUFLLENBQUMsSUFBSSxRQUFRLEtBQUssQ0FBQyxFQUFFLEtBQUssRUFDdkMsNkRBQTZELENBQUMsQ0FBQztRQUNoRixJQUFJLFFBQVEsS0FBSyxDQUFDLEVBQUU7WUFDbEIsUUFBUSxHQUFHLEtBQUssQ0FBQztTQUNsQjthQUFNO1lBQ0wsdUVBQXVFO1lBQ3ZFLEtBQUssQ0FBQyxRQUFRLEdBQUcsQ0FBQyxDQUFDLEdBQUcsb0JBQW9CLENBQUMsbUJBQUEsS0FBSyxDQUFDLFFBQVEsR0FBRyxDQUFDLENBQUMsRUFBaUIsRUFBRSxLQUFLLENBQUMsQ0FBQztTQUN6RjtRQUNELFFBQVEsR0FBRyxLQUFLLENBQUM7S0FDbEI7SUFFRCxrREFBa0Q7SUFDbEQsa0VBQWtFO0lBQ2xFLGNBQWMsQ0FDVixLQUFLLEVBQUUsV0FBVyxFQUFFLEtBQUssRUFBRSxtQkFBQSxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxFQUFVLEVBQUUsSUFBSSxFQUMxRixjQUFjLENBQUMsQ0FBQztJQUNwQixjQUFjLENBQUMsS0FBSyxFQUFFLFdBQVcsRUFBRSxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssRUFBRSxjQUFjLENBQUMsQ0FBQztJQUVyRSxTQUFTLEdBQUcsZUFBZSxDQUFDLFFBQVEsRUFBRSxRQUFRLENBQUMsQ0FBQztJQUNoRCxJQUFJLGNBQWMsRUFBRTtRQUNsQixLQUFLLENBQUMsYUFBYSxHQUFHLFNBQVMsQ0FBQztLQUNqQztTQUFNO1FBQ0wsS0FBSyxDQUFDLGFBQWEsR0FBRyxTQUFTLENBQUM7S0FDakM7QUFDSCxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUF3REQsU0FBUyxjQUFjLENBQ25CLEtBQVksRUFBRSxXQUF3QixFQUFFLEtBQWEsRUFBRSxZQUFvQixFQUFFLFNBQWtCLEVBQy9GLGNBQXVCOztVQUNuQixlQUFlLEdBQUcsbUJBQUEsS0FBSyxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsRUFBaUI7O1VBQ25ELEdBQUcsR0FBZ0IsT0FBTyxXQUFXLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxXQUFXOztVQUNsRixLQUFLLEdBQUcsR0FBRyxLQUFLLElBQUk7O1FBQ3RCLE1BQU0sR0FDTixTQUFTLENBQUMsQ0FBQyxDQUFDLG9CQUFvQixDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxvQkFBb0IsQ0FBQyxlQUFlLENBQUM7O1FBQ3pGLGNBQWMsR0FBRyxLQUFLO0lBQzFCLGdEQUFnRDtJQUNoRCx5RkFBeUY7SUFDekYsMEZBQTBGO0lBQzFGLG1EQUFtRDtJQUNuRCxPQUFPLE1BQU0sS0FBSyxDQUFDLElBQUksQ0FBQyxjQUFjLEtBQUssS0FBSyxJQUFJLEtBQUssQ0FBQyxFQUFFOztjQUNwRCxxQkFBcUIsR0FBRyxtQkFBQSxLQUFLLENBQUMsTUFBTSxDQUFDLEVBQWU7O2NBQ3BELG1CQUFtQixHQUFHLG1CQUFBLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLEVBQWlCOztjQUN4RCxXQUFXLEdBQUcsT0FBTyxxQkFBcUIsS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDLHFCQUFxQixDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQzNCLHFCQUFxQjtRQUNyRixJQUFJLFdBQVcsS0FBSyxJQUFJLElBQUksR0FBRyxJQUFJLElBQUksSUFBSSxXQUFXLEtBQUssR0FBRyxFQUFFO1lBQzlELGNBQWMsR0FBRyxJQUFJLENBQUM7WUFDdEIsS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsR0FBRyxTQUFTLENBQUMsQ0FBQyxDQUFDLDZCQUE2QixDQUFDLG1CQUFtQixDQUFDLENBQUMsQ0FBQztnQkFDcEQsNkJBQTZCLENBQUMsbUJBQW1CLENBQUMsQ0FBQztTQUNwRjtRQUNELE1BQU0sR0FBRyxTQUFTLENBQUMsQ0FBQyxDQUFDLG9CQUFvQixDQUFDLG1CQUFtQixDQUFDLENBQUMsQ0FBQztZQUMzQyxvQkFBb0IsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO0tBQ2hFO0lBQ0QsSUFBSSxZQUFZLEtBQUssRUFBRSxJQUFLLHFDQUFxQztRQUM3RCxDQUFDLGNBQWMsQ0FBUyxtRUFBbUU7SUFDbkUsWUFBWTtNQUNsQztRQUNKLElBQUksS0FBSyxFQUFFO1lBQ1QsaUVBQWlFO1lBQ2pFLGNBQWMsR0FBRyxJQUFJLENBQUM7U0FDdkI7YUFBTSxJQUFJLFlBQVksSUFBSSxJQUFJLEVBQUU7WUFDL0IsS0FBSyxJQUFJLENBQUMsR0FBRyxjQUFjLENBQUMsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLFlBQVksQ0FBQyxFQUFHLEVBQUU7YUFDckYsQ0FBQyxJQUFJLENBQUMsRUFBNkUsRUFBRTthQUNyRixDQUFDLEdBQUcsY0FBYyxDQUFDLENBQUMsQ0FBQyxrQkFBa0IsQ0FBQyxZQUFZLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDckMsY0FBYyxDQUFDLFlBQVksRUFBRSxDQUFDLENBQUMsRUFBRTtnQkFDekQsSUFBSSxnQkFBZ0IsQ0FBQyxZQUFZLENBQUMsS0FBSyxHQUFHLEVBQUU7b0JBQzFDLGNBQWMsR0FBRyxJQUFJLENBQUM7b0JBQ3RCLE1BQU07aUJBQ1A7YUFDRjtTQUNGO0tBQ0Y7SUFDRCxJQUFJLGNBQWMsRUFBRTtRQUNsQixLQUFLLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxHQUFHLFNBQVMsQ0FBQyxDQUFDLENBQUMsNkJBQTZCLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQztZQUNoRCw2QkFBNkIsQ0FBQyxlQUFlLENBQUMsQ0FBQztLQUMvRTtBQUNILENBQUM7Ozs7Ozs7Ozs7Ozs7OztBQWVELE1BQU0sVUFBVSxpQkFBaUIsQ0FDN0IsS0FBWSxFQUFFLEtBQVksRUFBRSxLQUFZLEVBQUUsS0FBYSxFQUFFLGNBQXVCOztVQUM1RSxvQkFBb0IsR0FBRyxtQkFBQSxLQUFLLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxFQUFpQjs7OztVQUd4RCx1QkFBdUIsR0FBRyxvQkFBb0IsQ0FBQyxvQkFBb0IsQ0FBQzs7UUFDdEUsSUFBSSxHQUFHLHVCQUF1QixLQUFLLENBQUMsQ0FBQyxDQUFDO1FBQ3RDLENBQUMsbUJBQUEsQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsRUFBVSxDQUFDLENBQUMsQ0FBQztRQUM3RCxtQkFBQSxLQUFLLENBQUMsdUJBQXVCLEdBQUcsQ0FBQyxDQUFDLEVBQVU7O1FBQzVDLE1BQU0sR0FBRyxLQUFLO0lBQ2xCLE9BQU8sTUFBTSxLQUFLLENBQUMsRUFBRTs7Y0FDYixLQUFLLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQzs7Y0FDckIsR0FBRyxHQUFHLG1CQUFBLEtBQUssQ0FBQyxNQUFNLENBQUMsRUFBZTs7Y0FDbEMsWUFBWSxHQUFHLG1CQUFBLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLEVBQWlCO1FBQ3ZELEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxHQUFHLGFBQWEsQ0FDcEMsSUFBSSxFQUFFLEdBQUcsRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLDZCQUE2QixDQUFDLFlBQVksQ0FBQyxFQUFFLGNBQWMsQ0FBQyxDQUFDO1FBQ3pGLE1BQU0sR0FBRyxvQkFBb0IsQ0FBQyxZQUFZLENBQUMsQ0FBQztLQUM3QztJQUNELE9BQU8sSUFBSSxDQUFDO0FBQ2QsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUE0QkQsTUFBTSxVQUFVLGFBQWEsQ0FDekIsSUFBWSxFQUFFLFVBQXVCLEVBQUUsS0FBVSxFQUFFLFNBQTZCLEVBQ2hGLG9CQUE2QixFQUFFLGNBQXVCOztRQUNwRCxHQUFXOztRQUNYLGlCQUFpQixHQUFzQyxTQUFTO0lBQ3BFLElBQUksT0FBTyxVQUFVLEtBQUssUUFBUSxFQUFFO1FBQ2xDLElBQUksVUFBVSxDQUFDLEdBQUcsS0FBSyxJQUFJLEVBQUU7WUFDM0IsT0FBTyxLQUFLLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxLQUFLLEVBQUUsb0JBQW9CLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO1NBQ25GO2FBQU07WUFDTCxpQkFBaUIsR0FBRyxVQUFVLENBQUMsS0FBSyxDQUFDO1lBQ3JDLEdBQUcsR0FBRyxVQUFVLENBQUMsR0FBRyxDQUFDO1NBQ3RCO0tBQ0Y7U0FBTTtRQUNMLEdBQUcsR0FBRyxVQUFVLENBQUM7S0FDbEI7SUFDRCxJQUFJLGNBQWMsRUFBRTtRQUNsQixTQUFTLElBQUksV0FBVyxDQUFDLE9BQU8sVUFBVSxLQUFLLFFBQVEsRUFBRSxJQUFJLEVBQUUsNEJBQTRCLENBQUMsQ0FBQztRQUM3RixJQUFJLG9CQUFvQixFQUFFO1lBQ3hCLElBQUksR0FBRyxXQUFXLENBQUMsSUFBSSxFQUFFLG1CQUFBLFVBQVUsRUFBVSxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQztTQUN6RDthQUFNLElBQUksS0FBSyxFQUFFO1lBQ2hCLElBQUksR0FBRyxJQUFJLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQyxtQkFBQSxVQUFVLEVBQVUsQ0FBQyxDQUFDLENBQUMsSUFBSSxHQUFHLEdBQUcsR0FBRyxVQUFVLENBQUM7U0FDckU7S0FDRjtTQUFNO1FBQ0wsSUFBSSxvQkFBb0IsRUFBRTtZQUN4QixJQUFJLEdBQUcsV0FBVyxDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsQ0FBQztTQUMvQjs7Y0FDSyxRQUFRLEdBQ1YsR0FBRyxHQUFHLElBQUksR0FBRyxDQUFDLE9BQU8saUJBQWlCLEtBQUssVUFBVSxDQUFDLENBQUM7WUFDckMsaUJBQWlCLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztZQUMxQixDQUFDLGlCQUFpQixJQUFJLElBQUksQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsaUJBQWlCLENBQUMsQ0FBQztRQUN0RixJQUFJLEdBQUcsSUFBSSxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxJQUFJLEdBQUcsSUFBSSxHQUFHLFFBQVEsQ0FBQztLQUN4RDtJQUNELE9BQU8sSUFBSSxDQUFDO0FBQ2QsQ0FBQzs7Ozs7OztBQWVRLENBQUMsSUFBWSxFQUFFLEtBQVUsRUFBRSxvQkFBNkIsRUFBVSxFQUFFO0lBQ3pFLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsRUFBRTtRQUN4QixvQkFBb0I7UUFDcEIsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7WUFDckMsSUFBSSxHQUFHLGFBQWEsQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsb0JBQW9CLEVBQUUsSUFBSSxDQUFDLENBQUM7U0FDOUU7S0FDRjtTQUFNLElBQUksT0FBTyxLQUFLLEtBQUssUUFBUSxFQUFFO1FBQ3BDLGtCQUFrQjtRQUNsQixLQUFLLElBQUksR0FBRyxJQUFJLEtBQUssRUFBRTtZQUNyQixJQUFJLEdBQUcsYUFBYSxDQUFDLElBQUksRUFBRSxHQUFHLEVBQUUsS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFLElBQUksRUFBRSxvQkFBb0IsRUFBRSxJQUFJLENBQUMsQ0FBQztTQUMvRTtLQUNGO1NBQU0sSUFBSSxPQUFPLEtBQUssS0FBSyxRQUFRLEVBQUU7UUFDcEMscUJBQXFCO1FBQ3JCLElBQUksb0JBQW9CLEVBQUU7OztrQkFFbEIsT0FBTyxHQUFHLElBQUksR0FBRyxFQUF3QjtZQUMvQyxjQUFjLENBQUMsS0FBSyxFQUFFLE9BQU8sRUFBRSxLQUFLLENBQUMsQ0FBQztZQUN0QyxPQUFPLENBQUMsT0FBTzs7Ozs7WUFBQyxDQUFDLENBQUMsRUFBRSxHQUFHLEVBQUUsRUFBRSxDQUFDLElBQUksR0FBRyxhQUFhLENBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsRUFBQyxDQUFDO1NBQ3RGO2FBQU07WUFDTCxpQ0FBaUM7WUFDakMsSUFBSSxHQUFHLElBQUksS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsSUFBSSxHQUFHLEdBQUcsR0FBRyxLQUFLLENBQUM7U0FDakQ7S0FDRjtTQUFNO1FBQ0wscUNBQXFDO1FBQ3JDLFNBQVMsSUFBSSxVQUFVLENBQUMsdUNBQXVDLEdBQUcsS0FBSyxDQUFDLENBQUM7S0FDMUU7SUFDRCxPQUFPLElBQUksQ0FBQztBQUNkLENBQUM7Ozs7Ozs7Ozs7Ozs7QUE3QkgsTUFBTSxPQUFPLHFCQUFxQixHQUFtQjtJQUNuRCxHQUFHLEVBQUUsSUFBSTtJQUNULEtBQUssTUEyQko7Q0FDRjs7Ozs7OztBQWdCUSxDQUFDLElBQVksRUFBRSxLQUFVLEVBQUUsb0JBQTZCLEVBQVUsRUFBRTtJQUN6RSxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEVBQUU7UUFDeEIsMEJBQTBCO1FBQzFCLFNBQVMsSUFBSSxVQUFVLENBQUMsZ0RBQWdELEdBQUcsS0FBSyxDQUFDLENBQUM7S0FDbkY7U0FBTSxJQUFJLE9BQU8sS0FBSyxLQUFLLFFBQVEsRUFBRTtRQUNwQyxrQkFBa0I7UUFDbEIsS0FBSyxJQUFJLEdBQUcsSUFBSSxLQUFLLEVBQUU7WUFDckIsSUFBSSxHQUFHLGFBQWEsQ0FDaEIsSUFBSSxFQUFFLEdBQUcsRUFBRSxLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUUsMEJBQTBCLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUMvRSxvQkFBb0IsRUFBRSxLQUFLLENBQUMsQ0FBQztTQUNsQztLQUNGO1NBQU0sSUFBSSxPQUFPLEtBQUssS0FBSyxRQUFRLEVBQUU7UUFDcEMscUJBQXFCO1FBQ3JCLElBQUksb0JBQW9CLEVBQUU7OztrQkFFbEIsT0FBTyxHQUNULElBQUksR0FBRyxFQUFvRDtZQUMvRCxhQUFhLENBQUMsS0FBSyxFQUFFLE9BQU8sRUFBRSxLQUFLLENBQUMsQ0FBQztZQUNyQyxPQUFPLENBQUMsT0FBTzs7Ozs7WUFDWCxDQUFDLEtBQUssRUFBRSxHQUFHLEVBQUUsRUFBRSxDQUFDLElBQUksR0FBRyxhQUFhLENBQ2hDLElBQUksRUFBRSxHQUFHLEVBQUUsS0FBSyxDQUFDLEdBQUcsRUFBRSwwQkFBMEIsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQzlFLElBQUksRUFBRSxLQUFLLENBQUMsRUFBQyxDQUFDO1NBQ3ZCO2FBQU07WUFDTCxpQ0FBaUM7WUFDakMsSUFBSSxHQUFHLElBQUksS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsSUFBSSxHQUFHLElBQUksR0FBRyxLQUFLLENBQUM7U0FDbEQ7S0FDRjtTQUFNO1FBQ0wscUNBQXFDO1FBQ3JDLFNBQVMsSUFBSSxVQUFVLENBQUMsdUNBQXVDLEdBQUcsS0FBSyxDQUFDLENBQUM7S0FDMUU7SUFDRCxPQUFPLElBQUksQ0FBQztBQUNkLENBQUM7Ozs7Ozs7Ozs7Ozs7O0FBakNILE1BQU0sT0FBTyxxQkFBcUIsR0FBbUI7SUFDbkQsR0FBRyxFQUFFLElBQUk7SUFDVCxLQUFLLE1BK0JKO0NBQ0YiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiogQGxpY2Vuc2VcbiogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4qXG4qIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4qIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiovXG5cbmltcG9ydCB7c3R5bGVQcm9wTmVlZHNTYW5pdGl6YXRpb24sIMm1ybVzYW5pdGl6ZVN0eWxlfSBmcm9tICcuLi8uLi9zYW5pdGl6YXRpb24vc2FuaXRpemF0aW9uJztcbmltcG9ydCB7YXNzZXJ0RXF1YWwsIHRocm93RXJyb3J9IGZyb20gJy4uLy4uL3V0aWwvYXNzZXJ0JztcbmltcG9ydCB7VE5vZGV9IGZyb20gJy4uL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge1Nhbml0aXplckZufSBmcm9tICcuLi9pbnRlcmZhY2VzL3Nhbml0aXphdGlvbic7XG5pbXBvcnQge1RTdHlsaW5nS2V5LCBUU3R5bGluZ01hcEtleSwgVFN0eWxpbmdSYW5nZSwgZ2V0VFN0eWxpbmdSYW5nZU5leHQsIGdldFRTdHlsaW5nUmFuZ2VQcmV2LCBnZXRUU3R5bGluZ1JhbmdlUHJldkR1cGxpY2F0ZSwgc2V0VFN0eWxpbmdSYW5nZU5leHQsIHNldFRTdHlsaW5nUmFuZ2VOZXh0RHVwbGljYXRlLCBzZXRUU3R5bGluZ1JhbmdlUHJldiwgc2V0VFN0eWxpbmdSYW5nZVByZXZEdXBsaWNhdGUsIHRvVFN0eWxpbmdSYW5nZX0gZnJvbSAnLi4vaW50ZXJmYWNlcy9zdHlsaW5nJztcbmltcG9ydCB7TFZpZXcsIFREYXRhLCBUVklFV30gZnJvbSAnLi4vaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7Z2V0TFZpZXd9IGZyb20gJy4uL3N0YXRlJztcbmltcG9ydCB7c3BsaXRDbGFzc0xpc3QsIHRvZ2dsZUNsYXNzfSBmcm9tICcuL2NsYXNzX2RpZmZlcic7XG5pbXBvcnQge1N0eWxlQ2hhbmdlc01hcCwgcGFyc2VLZXlWYWx1ZSwgcmVtb3ZlU3R5bGV9IGZyb20gJy4vc3R5bGVfZGlmZmVyJztcbmltcG9ydCB7Z2V0TGFzdFBhcnNlZEtleSwgcGFyc2VDbGFzc05hbWUsIHBhcnNlQ2xhc3NOYW1lTmV4dCwgcGFyc2VTdHlsZSwgcGFyc2VTdHlsZU5leHR9IGZyb20gJy4vc3R5bGluZ19wYXJzZXInO1xuXG5cblxuLyoqXG4gKiBOT1RFOiBUaGUgd29yZCBgc3R5bGluZ2AgaXMgdXNlZCBpbnRlcmNoYW5nZWFibHkgYXMgc3R5bGUgb3IgY2xhc3Mgc3R5bGluZy5cbiAqXG4gKiBUaGlzIGZpbGUgY29udGFpbnMgY29kZSB0byBsaW5rIHN0eWxpbmcgaW5zdHJ1Y3Rpb25zIHRvZ2V0aGVyIHNvIHRoYXQgdGhleSBjYW4gYmUgcmVwbGF5ZWQgaW5cbiAqIHByaW9yaXR5IG9yZGVyLiBUaGUgZmlsZSBleGlzdHMgYmVjYXVzZSBJdnkgc3R5bGluZyBpbnN0cnVjdGlvbiBleGVjdXRpb24gb3JkZXIgZG9lcyBub3QgbWF0Y2hcbiAqIHRoYXQgb2YgdGhlIHByaW9yaXR5IG9yZGVyLiBUaGUgcHVycG9zZSBvZiB0aGlzIGNvZGUgaXMgdG8gY3JlYXRlIGEgbGlua2VkIGxpc3Qgc28gdGhhdCB0aGVcbiAqIGluc3RydWN0aW9ucyBjYW4gYmUgdHJhdmVyc2VkIGluIHByaW9yaXR5IG9yZGVyIHdoZW4gY29tcHV0aW5nIHRoZSBzdHlsZXMuXG4gKlxuICogQXNzdW1lIHdlIGFyZSBkZWFsaW5nIHdpdGggdGhlIGZvbGxvd2luZyBjb2RlOlxuICogYGBgXG4gKiBAQ29tcG9uZW50KHtcbiAqICAgdGVtcGxhdGU6IGBcbiAqICAgICA8bXktY21wIFtzdHlsZV09XCIge2NvbG9yOiAnIzAwMSd9IFwiXG4gKiAgICAgICAgICAgICBbc3R5bGUuY29sb3JdPVwiICMwMDIgXCJcbiAqICAgICAgICAgICAgIGRpci1zdHlsZS1jb2xvci0xXG4gKiAgICAgICAgICAgICBkaXItc3R5bGUtY29sb3ItMj4gYFxuICogfSlcbiAqIGNsYXNzIEV4YW1wbGVDb21wb25lbnQge1xuICogICBzdGF0aWMgbmdDb21wID0gLi4uIHtcbiAqICAgICAuLi5cbiAqICAgICAvLyBDb21waWxlciBlbnN1cmVzIHRoYXQgYMm1ybVzdHlsZVByb3BgIGlzIGFmdGVyIGDJtcm1c3R5bGVNYXBgXG4gKiAgICAgybXJtXN0eWxlTWFwKHtjb2xvcjogJyMwMDEnfSk7XG4gKiAgICAgybXJtXN0eWxlUHJvcCgnY29sb3InLCAnIzAwMicpO1xuICogICAgIC4uLlxuICogICB9XG4gKiB9XG4gKlxuICogQERpcmVjdGl2ZSh7XG4gKiAgIHNlbGVjdG9yOiBgW2Rpci1zdHlsZS1jb2xvci0xXScsXG4gKiB9KVxuICogY2xhc3MgU3R5bGUxRGlyZWN0aXZlIHtcbiAqICAgQEhvc3RCaW5kaW5nKCdzdHlsZScpIHN0eWxlID0ge2NvbG9yOiAnIzAwNSd9O1xuICogICBASG9zdEJpbmRpbmcoJ3N0eWxlLmNvbG9yJykgY29sb3IgPSAnIzAwNic7XG4gKlxuICogICBzdGF0aWMgbmdEaXIgPSAuLi4ge1xuICogICAgIC4uLlxuICogICAgIC8vIENvbXBpbGVyIGVuc3VyZXMgdGhhdCBgybXJtXN0eWxlUHJvcGAgaXMgYWZ0ZXIgYMm1ybVzdHlsZU1hcGBcbiAqICAgICDJtcm1c3R5bGVNYXAoe2NvbG9yOiAnIzAwNSd9KTtcbiAqICAgICDJtcm1c3R5bGVQcm9wKCdjb2xvcicsICcjMDA2Jyk7XG4gKiAgICAgLi4uXG4gKiAgIH1cbiAqIH1cbiAqXG4gKiBARGlyZWN0aXZlKHtcbiAqICAgc2VsZWN0b3I6IGBbZGlyLXN0eWxlLWNvbG9yLTJdJyxcbiAqIH0pXG4gKiBjbGFzcyBTdHlsZTJEaXJlY3RpdmUge1xuICogICBASG9zdEJpbmRpbmcoJ3N0eWxlJykgc3R5bGUgPSB7Y29sb3I6ICcjMDA3J307XG4gKiAgIEBIb3N0QmluZGluZygnc3R5bGUuY29sb3InKSBjb2xvciA9ICcjMDA4JztcbiAqXG4gKiAgIHN0YXRpYyBuZ0RpciA9IC4uLiB7XG4gKiAgICAgLi4uXG4gKiAgICAgLy8gQ29tcGlsZXIgZW5zdXJlcyB0aGF0IGDJtcm1c3R5bGVQcm9wYCBpcyBhZnRlciBgybXJtXN0eWxlTWFwYFxuICogICAgIMm1ybVzdHlsZU1hcCh7Y29sb3I6ICcjMDA3J30pO1xuICogICAgIMm1ybVzdHlsZVByb3AoJ2NvbG9yJywgJyMwMDgnKTtcbiAqICAgICAuLi5cbiAqICAgfVxuICogfVxuICpcbiAqIEBEaXJlY3RpdmUoe1xuICogICBzZWxlY3RvcjogYG15LWNtcCcsXG4gKiB9KVxuICogY2xhc3MgTXlDb21wb25lbnQge1xuICogICBASG9zdEJpbmRpbmcoJ3N0eWxlJykgc3R5bGUgPSB7Y29sb3I6ICcjMDAzJ307XG4gKiAgIEBIb3N0QmluZGluZygnc3R5bGUuY29sb3InKSBjb2xvciA9ICcjMDA0JztcbiAqXG4gKiAgIHN0YXRpYyBuZ0NvbXAgPSAuLi4ge1xuICogICAgIC4uLlxuICogICAgIC8vIENvbXBpbGVyIGVuc3VyZXMgdGhhdCBgybXJtXN0eWxlUHJvcGAgaXMgYWZ0ZXIgYMm1ybVzdHlsZU1hcGBcbiAqICAgICDJtcm1c3R5bGVNYXAoe2NvbG9yOiAnIzAwMyd9KTtcbiAqICAgICDJtcm1c3R5bGVQcm9wKCdjb2xvcicsICcjMDA0Jyk7XG4gKiAgICAgLi4uXG4gKiAgIH1cbiAqIH1cbiAqIGBgYFxuICpcbiAqIFRoZSBPcmRlciBvZiBpbnN0cnVjdGlvbiBleGVjdXRpb24gaXM6XG4gKlxuICogTk9URTogdGhlIGNvbW1lbnQgYmluZGluZyBsb2NhdGlvbiBpcyBmb3IgaWxsdXN0cmF0aXZlIHB1cnBvc2VzIG9ubHkuXG4gKlxuICogYGBgXG4gKiAvLyBUZW1wbGF0ZTogKEV4YW1wbGVDb21wb25lbnQpXG4gKiAgICAgybXJtXN0eWxlTWFwKHtjb2xvcjogJyMwMDEnfSk7ICAgLy8gQmluZGluZyBpbmRleDogMTBcbiAqICAgICDJtcm1c3R5bGVQcm9wKCdjb2xvcicsICcjMDAyJyk7ICAvLyBCaW5kaW5nIGluZGV4OiAxMlxuICogLy8gTXlDb21wb25lbnRcbiAqICAgICDJtcm1c3R5bGVNYXAoe2NvbG9yOiAnIzAwMyd9KTsgICAvLyBCaW5kaW5nIGluZGV4OiAyMFxuICogICAgIMm1ybVzdHlsZVByb3AoJ2NvbG9yJywgJyMwMDQnKTsgIC8vIEJpbmRpbmcgaW5kZXg6IDIyXG4gKiAvLyBTdHlsZTFEaXJlY3RpdmVcbiAqICAgICDJtcm1c3R5bGVNYXAoe2NvbG9yOiAnIzAwNSd9KTsgICAvLyBCaW5kaW5nIGluZGV4OiAyNFxuICogICAgIMm1ybVzdHlsZVByb3AoJ2NvbG9yJywgJyMwMDYnKTsgIC8vIEJpbmRpbmcgaW5kZXg6IDI2XG4gKiAvLyBTdHlsZTJEaXJlY3RpdmVcbiAqICAgICDJtcm1c3R5bGVNYXAoe2NvbG9yOiAnIzAwNyd9KTsgICAvLyBCaW5kaW5nIGluZGV4OiAyOFxuICogICAgIMm1ybVzdHlsZVByb3AoJ2NvbG9yJywgJyMwMDgnKTsgIC8vIEJpbmRpbmcgaW5kZXg6IDMwXG4gKiBgYGBcbiAqXG4gKiBUaGUgY29ycmVjdCBwcmlvcml0eSBvcmRlciBvZiBjb25jYXRlbmF0aW9uIGlzOlxuICpcbiAqIGBgYFxuICogLy8gTXlDb21wb25lbnRcbiAqICAgICDJtcm1c3R5bGVNYXAoe2NvbG9yOiAnIzAwMyd9KTsgICAvLyBCaW5kaW5nIGluZGV4OiAyMFxuICogICAgIMm1ybVzdHlsZVByb3AoJ2NvbG9yJywgJyMwMDQnKTsgIC8vIEJpbmRpbmcgaW5kZXg6IDIyXG4gKiAvLyBTdHlsZTFEaXJlY3RpdmVcbiAqICAgICDJtcm1c3R5bGVNYXAoe2NvbG9yOiAnIzAwNSd9KTsgICAvLyBCaW5kaW5nIGluZGV4OiAyNFxuICogICAgIMm1ybVzdHlsZVByb3AoJ2NvbG9yJywgJyMwMDYnKTsgIC8vIEJpbmRpbmcgaW5kZXg6IDI2XG4gKiAvLyBTdHlsZTJEaXJlY3RpdmVcbiAqICAgICDJtcm1c3R5bGVNYXAoe2NvbG9yOiAnIzAwNyd9KTsgICAvLyBCaW5kaW5nIGluZGV4OiAyOFxuICogICAgIMm1ybVzdHlsZVByb3AoJ2NvbG9yJywgJyMwMDgnKTsgIC8vIEJpbmRpbmcgaW5kZXg6IDMwXG4gKiAvLyBUZW1wbGF0ZTogKEV4YW1wbGVDb21wb25lbnQpXG4gKiAgICAgybXJtXN0eWxlTWFwKHtjb2xvcjogJyMwMDEnfSk7ICAgLy8gQmluZGluZyBpbmRleDogMTBcbiAqICAgICDJtcm1c3R5bGVQcm9wKCdjb2xvcicsICcjMDAyJyk7ICAvLyBCaW5kaW5nIGluZGV4OiAxMlxuICogYGBgXG4gKlxuICogV2hhdCBjb2xvciBzaG91bGQgYmUgcmVuZGVyZWQ/XG4gKlxuICogT25jZSB0aGUgaXRlbXMgYXJlIGNvcnJlY3RseSBzb3J0ZWQgaW4gdGhlIGxpc3QsIHRoZSBhbnN3ZXIgaXMgc2ltcGx5IHRoZSBsYXN0IGl0ZW0gaW4gdGhlXG4gKiBjb25jYXRlbmF0aW9uIGxpc3Qgd2hpY2ggaXMgYCMwMDJgLlxuICpcbiAqIFRvIGRvIHNvIHdlIGtlZXAgYSBsaW5rZWQgbGlzdCBvZiBhbGwgb2YgdGhlIGJpbmRpbmdzIHdoaWNoIHBlcnRhaW4gdG8gdGhpcyBlbGVtZW50LlxuICogTm90aWNlIHRoYXQgdGhlIGJpbmRpbmdzIGFyZSBpbnNlcnRlZCBpbiB0aGUgb3JkZXIgb2YgZXhlY3V0aW9uLCBidXQgdGhlIGBUVmlldy5kYXRhYCBhbGxvd3NcbiAqIHVzIHRvIHRyYXZlcnNlIHRoZW0gaW4gdGhlIG9yZGVyIG9mIHByaW9yaXR5LlxuICpcbiAqIHxJZHh8YFRWaWV3LmRhdGFgfGBMVmlld2AgICAgICAgICAgfCBOb3Rlc1xuICogfC0tLXwtLS0tLS0tLS0tLS18LS0tLS0tLS0tLS0tLS0tLS18LS0tLS0tLS0tLS0tLS1cbiAqIHwuLi58ICAgICAgICAgICAgfCAgICAgICAgICAgICAgICAgfFxuICogfDEwIHxgbnVsbGAgICAgICB8YHtjb2xvcjogJyMwMDEnfWB8IGDJtcm1c3R5bGVNYXAoJ2NvbG9yJywge2NvbG9yOiAnIzAwMSd9KWBcbiAqIHwxMSB8YDMwIHwgMTJgICAgfCAuLi4gICAgICAgICAgICAgfFxuICogfDEyIHxgY29sb3JgICAgICB8YCcjMDAyJ2AgICAgICAgICB8IGDJtcm1c3R5bGVQcm9wKCdjb2xvcicsICcjMDAyJylgXG4gKiB8MTMgfGAxMCB8IDBgICAgIHwgLi4uICAgICAgICAgICAgIHxcbiAqIHwuLi58ICAgICAgICAgICAgfCAgICAgICAgICAgICAgICAgfFxuICogfDIwIHxgbnVsbGAgICAgICB8YHtjb2xvcjogJyMwMDMnfWB8IGDJtcm1c3R5bGVNYXAoJ2NvbG9yJywge2NvbG9yOiAnIzAwMyd9KWBcbiAqIHwyMSB8YDAgfCAyMmAgICAgfCAuLi4gICAgICAgICAgICAgfFxuICogfDIyIHxgY29sb3JgICAgICB8YCcjMDA0J2AgICAgICAgICB8IGDJtcm1c3R5bGVQcm9wKCdjb2xvcicsICcjMDA0JylgXG4gKiB8MjMgfGAyMCB8IDI0YCAgIHwgLi4uICAgICAgICAgICAgIHxcbiAqIHwyNCB8YG51bGxgICAgICAgfGB7Y29sb3I6ICcjMDA1J31gfCBgybXJtXN0eWxlTWFwKCdjb2xvcicsIHtjb2xvcjogJyMwMDUnfSlgXG4gKiB8MjUgfGAyMiB8IDI2YCAgIHwgLi4uICAgICAgICAgICAgIHxcbiAqIHwyNiB8YGNvbG9yYCAgICAgfGAnIzAwNidgICAgICAgICAgfCBgybXJtXN0eWxlUHJvcCgnY29sb3InLCAnIzAwNicpYFxuICogfDI3IHxgMjQgfCAyOGAgICB8IC4uLiAgICAgICAgICAgICB8XG4gKiB8MjggfGBudWxsYCAgICAgIHxge2NvbG9yOiAnIzAwNyd9YHwgYMm1ybVzdHlsZU1hcCgnY29sb3InLCB7Y29sb3I6ICcjMDA3J30pYFxuICogfDI5IHxgMjYgfCAzMGAgICB8IC4uLiAgICAgICAgICAgICB8XG4gKiB8MzAgfGBjb2xvcmAgICAgIHxgJyMwMDgnYCAgICAgICAgIHwgYMm1ybVzdHlsZVByb3AoJ2NvbG9yJywgJyMwMDgnKWBcbiAqIHwzMSB8YDI4IHwgMTBgICAgfCAuLi4gICAgICAgICAgICAgfFxuICpcbiAqIFRoZSBhYm92ZSBkYXRhIHN0cnVjdHVyZSBhbGxvd3MgdXMgdG8gcmUtY29uY2F0ZW5hdGUgdGhlIHN0eWxpbmcgbm8gbWF0dGVyIHdoaWNoIGRhdGEgYmluZGluZ1xuICogY2hhbmdlcy5cbiAqXG4gKiBOT1RFOiBpbiBhZGRpdGlvbiB0byBrZWVwaW5nIHRyYWNrIG9mIG5leHQvcHJldmlvdXMgaW5kZXggdGhlIGBUVmlldy5kYXRhYCBhbHNvIHN0b3JlcyBwcmV2L25leHRcbiAqIGR1cGxpY2F0ZSBiaXQuIFRoZSBkdXBsaWNhdGUgYml0IGlmIHRydWUgc2F5cyB0aGVyZSBlaXRoZXIgaXMgYSBiaW5kaW5nIHdpdGggdGhlIHNhbWUgbmFtZSBvclxuICogdGhlcmUgaXMgYSBtYXAgKHdoaWNoIG1heSBjb250YWluIHRoZSBuYW1lKS4gVGhpcyBpbmZvcm1hdGlvbiBpcyB1c2VmdWwgaW4ga25vd2luZyBpZiBvdGhlclxuICogc3R5bGVzIHdpdGggaGlnaGVyIHByaW9yaXR5IG5lZWQgdG8gYmUgc2VhcmNoZWQgZm9yIG92ZXJ3cml0ZXMuXG4gKlxuICogTk9URTogU2VlIGBzaG91bGQgc3VwcG9ydCBleGFtcGxlIGluICd0bm9kZV9saW5rZWRfbGlzdC50cycgZG9jdW1lbnRhdGlvbmAgaW5cbiAqIGB0bm9kZV9saW5rZWRfbGlzdF9zcGVjLnRzYCBmb3Igd29ya2luZyBleGFtcGxlLlxuICovXG5cblxuLyoqXG4gKiBJbnNlcnQgbmV3IGB0U3R5bGVWYWx1ZWAgYXQgYFREYXRhYCBhbmQgbGluayBleGlzdGluZyBzdHlsZSBiaW5kaW5ncyBzdWNoIHRoYXQgd2UgbWFpbnRhaW4gbGlua2VkXG4gKiBsaXN0IG9mIHN0eWxlcyBhbmQgY29tcHV0ZSB0aGUgZHVwbGljYXRlIGZsYWcuXG4gKlxuICogTm90ZTogdGhpcyBmdW5jdGlvbiBpcyBleGVjdXRlZCBkdXJpbmcgYGZpcnN0VXBkYXRlUGFzc2Agb25seSB0byBwb3B1bGF0ZSB0aGUgYFRWaWV3LmRhdGFgLlxuICpcbiAqIFRoZSBmdW5jdGlvbiB3b3JrcyBieSBrZWVwaW5nIHRyYWNrIG9mIGB0U3R5bGluZ1JhbmdlYCB3aGljaCBjb250YWlucyB0d28gcG9pbnRlcnMgcG9pbnRpbmcgdG9cbiAqIHRoZSBoZWFkL3RhaWwgb2YgdGhlIHRlbXBsYXRlIHBvcnRpb24gb2YgdGhlIHN0eWxlcy5cbiAqICAtIGlmIGBpc0hvc3QgPT09IGZhbHNlYCAod2UgYXJlIHRlbXBsYXRlKSB0aGVuIGluc2VydGlvbiBpcyBhdCB0YWlsIG9mIGBUU3R5bGluZ1JhbmdlYFxuICogIC0gaWYgYGlzSG9zdCA9PT0gdHJ1ZWAgKHdlIGFyZSBob3N0IGJpbmRpbmcpIHRoZW4gaW5zZXJ0aW9uIGlzIGF0IGhlYWQgb2YgYFRTdHlsaW5nUmFuZ2VgXG4gKlxuICogQHBhcmFtIHREYXRhIFRoZSBgVERhdGFgIHRvIGluc2VydCBpbnRvLlxuICogQHBhcmFtIHROb2RlIGBUTm9kZWAgYXNzb2NpYXRlZCB3aXRoIHRoZSBzdHlsaW5nIGVsZW1lbnQuXG4gKiBAcGFyYW0gdFN0eWxpbmdLZXkgU2VlIGBUU3R5bGluZ0tleWAuXG4gKiBAcGFyYW0gaW5kZXggbG9jYXRpb24gb2Ygd2hlcmUgYHRTdHlsZVZhbHVlYCBzaG91bGQgYmUgc3RvcmVkIChhbmQgbGlua2VkIGludG8gbGlzdC4pXG4gKiBAcGFyYW0gaXNIb3N0QmluZGluZyBgdHJ1ZWAgaWYgdGhlIGluc2VydGlvbiBpcyBmb3IgYSBgaG9zdEJpbmRpbmdgLiAoaW5zZXJ0aW9uIGlzIGluIGZyb250IG9mXG4gKiAgICAgICAgICAgICAgIHRlbXBsYXRlLilcbiAqIEBwYXJhbSBpc0NsYXNzQmluZGluZyBUcnVlIGlmIHRoZSBhc3NvY2lhdGVkIGB0U3R5bGluZ0tleWAgYXMgYSBgY2xhc3NgIHN0eWxpbmcuXG4gKiAgICAgICAgICAgICAgICAgICAgICAgYHROb2RlLmNsYXNzQmluZGluZ3NgIHNob3VsZCBiZSB1c2VkIChvciBgdE5vZGUuc3R5bGVCaW5kaW5nc2Agb3RoZXJ3aXNlLilcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluc2VydFRTdHlsaW5nQmluZGluZyhcbiAgICB0RGF0YTogVERhdGEsIHROb2RlOiBUTm9kZSwgdFN0eWxpbmdLZXk6IFRTdHlsaW5nS2V5LCBpbmRleDogbnVtYmVyLCBpc0hvc3RCaW5kaW5nOiBib29sZWFuLFxuICAgIGlzQ2xhc3NCaW5kaW5nOiBib29sZWFuKTogdm9pZCB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRFcXVhbChcbiAgICAgICAgICAgICAgICAgICBnZXRMVmlldygpW1RWSUVXXS5maXJzdFVwZGF0ZVBhc3MsIHRydWUsXG4gICAgICAgICAgICAgICAgICAgJ1Nob3VsZCBiZSBjYWxsZWQgZHVyaW5nIFxcJ2ZpcnN0VXBkYXRlUGFzc2Agb25seS4nKTtcbiAgbGV0IHRCaW5kaW5ncyA9IGlzQ2xhc3NCaW5kaW5nID8gdE5vZGUuY2xhc3NCaW5kaW5ncyA6IHROb2RlLnN0eWxlQmluZGluZ3M7XG4gIGxldCB0bXBsSGVhZCA9IGdldFRTdHlsaW5nUmFuZ2VQcmV2KHRCaW5kaW5ncyk7XG4gIGxldCB0bXBsVGFpbCA9IGdldFRTdHlsaW5nUmFuZ2VOZXh0KHRCaW5kaW5ncyk7XG5cbiAgdERhdGFbaW5kZXhdID0gdFN0eWxpbmdLZXk7XG4gIGlmIChpc0hvc3RCaW5kaW5nKSB7XG4gICAgLy8gV2UgYXJlIGluc2VydGluZyBob3N0IGJpbmRpbmdzXG5cbiAgICAvLyBJZiB3ZSBkb24ndCBoYXZlIHRlbXBsYXRlIGJpbmRpbmdzIHRoZW4gYHRhaWxgIGlzIDAuXG4gICAgY29uc3QgaGFzVGVtcGxhdGVCaW5kaW5ncyA9IHRtcGxUYWlsICE9PSAwO1xuICAgIC8vIFRoaXMgaXMgaW1wb3J0YW50IHRvIGtub3cgYmVjYXVzZSB0aGF0IG1lYW5zIHRoYXQgdGhlIGBoZWFkYCBjYW4ndCBwb2ludCB0byB0aGUgZmlyc3RcbiAgICAvLyB0ZW1wbGF0ZSBiaW5kaW5ncyAodGhlcmUgYXJlIG5vbmUuKSBJbnN0ZWFkIHRoZSBoZWFkIHBvaW50cyB0byB0aGUgdGFpbCBvZiB0aGUgdGVtcGxhdGUuXG4gICAgaWYgKGhhc1RlbXBsYXRlQmluZGluZ3MpIHtcbiAgICAgIC8vIHRlbXBsYXRlIGhlYWQncyBcInByZXZcIiB3aWxsIHBvaW50IHRvIGxhc3QgaG9zdCBiaW5kaW5nIG9yIHRvIDAgaWYgbm8gaG9zdCBiaW5kaW5ncyB5ZXRcbiAgICAgIGNvbnN0IHByZXZpb3VzTm9kZSA9IGdldFRTdHlsaW5nUmFuZ2VQcmV2KHREYXRhW3RtcGxIZWFkICsgMV0gYXMgVFN0eWxpbmdSYW5nZSk7XG4gICAgICB0RGF0YVtpbmRleCArIDFdID0gdG9UU3R5bGluZ1JhbmdlKHByZXZpb3VzTm9kZSwgdG1wbEhlYWQpO1xuICAgICAgLy8gaWYgYSBob3N0IGJpbmRpbmcgaGFzIGFscmVhZHkgYmVlbiByZWdpc3RlcmVkLCB3ZSBuZWVkIHRvIHVwZGF0ZSB0aGUgbmV4dCBvZiB0aGF0IGhvc3RcbiAgICAgIC8vIGJpbmRpbmcgdG8gcG9pbnQgdG8gdGhpcyBvbmVcbiAgICAgIGlmIChwcmV2aW91c05vZGUgIT09IDApIHtcbiAgICAgICAgLy8gV2UgbmVlZCB0byB1cGRhdGUgdGhlIHRlbXBsYXRlLXRhaWwgdmFsdWUgdG8gcG9pbnQgdG8gdXMuXG4gICAgICAgIHREYXRhW3ByZXZpb3VzTm9kZSArIDFdID1cbiAgICAgICAgICAgIHNldFRTdHlsaW5nUmFuZ2VOZXh0KHREYXRhW3ByZXZpb3VzTm9kZSArIDFdIGFzIFRTdHlsaW5nUmFuZ2UsIGluZGV4KTtcbiAgICAgIH1cbiAgICAgIC8vIFRoZSBcInByZXZpb3VzXCIgb2YgdGhlIHRlbXBsYXRlIGJpbmRpbmcgaGVhZCBzaG91bGQgcG9pbnQgdG8gdGhpcyBob3N0IGJpbmRpbmdcbiAgICAgIHREYXRhW3RtcGxIZWFkICsgMV0gPSBzZXRUU3R5bGluZ1JhbmdlUHJldih0RGF0YVt0bXBsSGVhZCArIDFdIGFzIFRTdHlsaW5nUmFuZ2UsIGluZGV4KTtcbiAgICB9IGVsc2Uge1xuICAgICAgdERhdGFbaW5kZXggKyAxXSA9IHRvVFN0eWxpbmdSYW5nZSh0bXBsSGVhZCwgMCk7XG4gICAgICAvLyBpZiBhIGhvc3QgYmluZGluZyBoYXMgYWxyZWFkeSBiZWVuIHJlZ2lzdGVyZWQsIHdlIG5lZWQgdG8gdXBkYXRlIHRoZSBuZXh0IG9mIHRoYXQgaG9zdFxuICAgICAgLy8gYmluZGluZyB0byBwb2ludCB0byB0aGlzIG9uZVxuICAgICAgaWYgKHRtcGxIZWFkICE9PSAwKSB7XG4gICAgICAgIC8vIFdlIG5lZWQgdG8gdXBkYXRlIHRoZSB0ZW1wbGF0ZS10YWlsIHZhbHVlIHRvIHBvaW50IHRvIHVzLlxuICAgICAgICB0RGF0YVt0bXBsSGVhZCArIDFdID0gc2V0VFN0eWxpbmdSYW5nZU5leHQodERhdGFbdG1wbEhlYWQgKyAxXSBhcyBUU3R5bGluZ1JhbmdlLCBpbmRleCk7XG4gICAgICB9XG4gICAgICAvLyBpZiB3ZSBkb24ndCBoYXZlIHRlbXBsYXRlLCB0aGUgaGVhZCBwb2ludHMgdG8gdGVtcGxhdGUtdGFpbCwgYW5kIG5lZWRzIHRvIGJlIGFkdmFuY2VkLlxuICAgICAgdG1wbEhlYWQgPSBpbmRleDtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgLy8gV2UgYXJlIGluc2VydGluZyBpbiB0ZW1wbGF0ZSBzZWN0aW9uLlxuICAgIC8vIFdlIG5lZWQgdG8gc2V0IHRoaXMgYmluZGluZydzIFwicHJldmlvdXNcIiB0byB0aGUgY3VycmVudCB0ZW1wbGF0ZSB0YWlsXG4gICAgdERhdGFbaW5kZXggKyAxXSA9IHRvVFN0eWxpbmdSYW5nZSh0bXBsVGFpbCwgMCk7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydEVxdWFsKFxuICAgICAgICAgICAgICAgICAgICAgdG1wbEhlYWQgIT09IDAgJiYgdG1wbFRhaWwgPT09IDAsIGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgJ0FkZGluZyB0ZW1wbGF0ZSBiaW5kaW5ncyBhZnRlciBob3N0QmluZGluZ3MgaXMgbm90IGFsbG93ZWQuJyk7XG4gICAgaWYgKHRtcGxIZWFkID09PSAwKSB7XG4gICAgICB0bXBsSGVhZCA9IGluZGV4O1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBXZSBuZWVkIHRvIHVwZGF0ZSB0aGUgcHJldmlvdXMgdmFsdWUgXCJuZXh0XCIgdG8gcG9pbnQgdG8gdGhpcyBiaW5kaW5nXG4gICAgICB0RGF0YVt0bXBsVGFpbCArIDFdID0gc2V0VFN0eWxpbmdSYW5nZU5leHQodERhdGFbdG1wbFRhaWwgKyAxXSBhcyBUU3R5bGluZ1JhbmdlLCBpbmRleCk7XG4gICAgfVxuICAgIHRtcGxUYWlsID0gaW5kZXg7XG4gIH1cblxuICAvLyBOb3cgd2UgbmVlZCB0byB1cGRhdGUgLyBjb21wdXRlIHRoZSBkdXBsaWNhdGVzLlxuICAvLyBTdGFydGluZyB3aXRoIG91ciBsb2NhdGlvbiBzZWFyY2ggdG93YXJkcyBoZWFkIChsZWFzdCBwcmlvcml0eSlcbiAgbWFya0R1cGxpY2F0ZXMoXG4gICAgICB0RGF0YSwgdFN0eWxpbmdLZXksIGluZGV4LCAoaXNDbGFzc0JpbmRpbmcgPyB0Tm9kZS5jbGFzc2VzIDogdE5vZGUuc3R5bGVzKSBhcyBzdHJpbmcsIHRydWUsXG4gICAgICBpc0NsYXNzQmluZGluZyk7XG4gIG1hcmtEdXBsaWNhdGVzKHREYXRhLCB0U3R5bGluZ0tleSwgaW5kZXgsICcnLCBmYWxzZSwgaXNDbGFzc0JpbmRpbmcpO1xuXG4gIHRCaW5kaW5ncyA9IHRvVFN0eWxpbmdSYW5nZSh0bXBsSGVhZCwgdG1wbFRhaWwpO1xuICBpZiAoaXNDbGFzc0JpbmRpbmcpIHtcbiAgICB0Tm9kZS5jbGFzc0JpbmRpbmdzID0gdEJpbmRpbmdzO1xuICB9IGVsc2Uge1xuICAgIHROb2RlLnN0eWxlQmluZGluZ3MgPSB0QmluZGluZ3M7XG4gIH1cbn1cblxuLyoqXG4gKiBNYXJrcyBgVFN0eWxlVmFsdWVgcyBhcyBkdXBsaWNhdGVzIGlmIGFub3RoZXIgc3R5bGUgYmluZGluZyBpbiB0aGUgbGlzdCBoYXMgdGhlIHNhbWVcbiAqIGBUU3R5bGVWYWx1ZWAuXG4gKlxuICogTk9URTogdGhpcyBmdW5jdGlvbiBpcyBpbnRlbmRlZCB0byBiZSBjYWxsZWQgdHdpY2Ugb25jZSB3aXRoIGBpc1ByZXZEaXJgIHNldCB0byBgdHJ1ZWAgYW5kIG9uY2VcbiAqIHdpdGggaXQgc2V0IHRvIGBmYWxzZWAgdG8gc2VhcmNoIGJvdGggdGhlIHByZXZpb3VzIGFzIHdlbGwgYXMgbmV4dCBpdGVtcyBpbiB0aGUgbGlzdC5cbiAqXG4gKiBObyBkdXBsaWNhdGUgY2FzZVxuICogYGBgXG4gKiAgIFtzdHlsZS5jb2xvcl1cbiAqICAgW3N0eWxlLndpZHRoLnB4XSA8PC0gaW5kZXhcbiAqICAgW3N0eWxlLmhlaWdodC5weF1cbiAqIGBgYFxuICpcbiAqIEluIHRoZSBhYm92ZSBjYXNlIGFkZGluZyBgW3N0eWxlLndpZHRoLnB4XWAgdG8gdGhlIGV4aXN0aW5nIGBbc3R5bGUuY29sb3JdYCBwcm9kdWNlcyBub1xuICogZHVwbGljYXRlcyBiZWNhdXNlIGB3aWR0aGAgaXMgbm90IGZvdW5kIGluIGFueSBvdGhlciBwYXJ0IG9mIHRoZSBsaW5rZWQgbGlzdC5cbiAqXG4gKiBEdXBsaWNhdGUgY2FzZVxuICogYGBgXG4gKiAgIFtzdHlsZS5jb2xvcl1cbiAqICAgW3N0eWxlLndpZHRoLmVtXVxuICogICBbc3R5bGUud2lkdGgucHhdIDw8LSBpbmRleFxuICogYGBgXG4gKiBJbiB0aGUgYWJvdmUgY2FzZSBhZGRpbmcgYFtzdHlsZS53aWR0aC5weF1gIHdpbGwgcHJvZHVjZSBhIGR1cGxpY2F0ZSB3aXRoIGBbc3R5bGUud2lkdGguZW1dYFxuICogYmVjYXVzZSBgd2lkdGhgIGlzIGZvdW5kIGluIHRoZSBjaGFpbi5cbiAqXG4gKiBNYXAgY2FzZSAxXG4gKiBgYGBcbiAqICAgW3N0eWxlLndpZHRoLnB4XVxuICogICBbc3R5bGUuY29sb3JdXG4gKiAgIFtzdHlsZV0gIDw8LSBpbmRleFxuICogYGBgXG4gKiBJbiB0aGUgYWJvdmUgY2FzZSBhZGRpbmcgYFtzdHlsZV1gIHdpbGwgcHJvZHVjZSBhIGR1cGxpY2F0ZSB3aXRoIGFueSBvdGhlciBiaW5kaW5ncyBiZWNhdXNlXG4gKiBgW3N0eWxlXWAgaXMgYSBNYXAgYW5kIGFzIHN1Y2ggaXMgZnVsbHkgZHluYW1pYyBhbmQgY291bGQgcHJvZHVjZSBgY29sb3JgIG9yIGB3aWR0aGAuXG4gKlxuICogTWFwIGNhc2UgMlxuICogYGBgXG4gKiAgIFtzdHlsZV1cbiAqICAgW3N0eWxlLndpZHRoLnB4XVxuICogICBbc3R5bGUuY29sb3JdICA8PC0gaW5kZXhcbiAqIGBgYFxuICogSW4gdGhlIGFib3ZlIGNhc2UgYWRkaW5nIGBbc3R5bGUuY29sb3JdYCB3aWxsIHByb2R1Y2UgYSBkdXBsaWNhdGUgYmVjYXVzZSB0aGVyZSBpcyBhbHJlYWR5IGFcbiAqIGBbc3R5bGVdYCBiaW5kaW5nIHdoaWNoIGlzIGEgTWFwIGFuZCBhcyBzdWNoIGlzIGZ1bGx5IGR5bmFtaWMgYW5kIGNvdWxkIHByb2R1Y2UgYGNvbG9yYCBvclxuICogYHdpZHRoYC5cbiAqXG4gKiBOT1RFOiBPbmNlIGBbc3R5bGVdYCAoTWFwKSBpcyBhZGRlZCBpbnRvIHRoZSBzeXN0ZW0gYWxsIHRoaW5ncyBhcmUgbWFwcGVkIGFzIGR1cGxpY2F0ZXMuXG4gKiBOT1RFOiBXZSB1c2UgYHN0eWxlYCBhcyBleGFtcGxlLCBidXQgc2FtZSBsb2dpYyBpcyBhcHBsaWVkIHRvIGBjbGFzc2BlcyBhcyB3ZWxsLlxuICpcbiAqIEBwYXJhbSB0RGF0YVxuICogQHBhcmFtIHRTdHlsaW5nS2V5XG4gKiBAcGFyYW0gaW5kZXhcbiAqIEBwYXJhbSBzdGF0aWNWYWx1ZXNcbiAqIEBwYXJhbSBpc1ByZXZEaXJcbiAqL1xuZnVuY3Rpb24gbWFya0R1cGxpY2F0ZXMoXG4gICAgdERhdGE6IFREYXRhLCB0U3R5bGluZ0tleTogVFN0eWxpbmdLZXksIGluZGV4OiBudW1iZXIsIHN0YXRpY1ZhbHVlczogc3RyaW5nLCBpc1ByZXZEaXI6IGJvb2xlYW4sXG4gICAgaXNDbGFzc0JpbmRpbmc6IGJvb2xlYW4pIHtcbiAgY29uc3QgdFN0eWxpbmdBdEluZGV4ID0gdERhdGFbaW5kZXggKyAxXSBhcyBUU3R5bGluZ1JhbmdlO1xuICBjb25zdCBrZXk6IHN0cmluZ3xudWxsID0gdHlwZW9mIHRTdHlsaW5nS2V5ID09PSAnb2JqZWN0JyA/IHRTdHlsaW5nS2V5LmtleSA6IHRTdHlsaW5nS2V5O1xuICBjb25zdCBpc01hcCA9IGtleSA9PT0gbnVsbDtcbiAgbGV0IGN1cnNvciA9XG4gICAgICBpc1ByZXZEaXIgPyBnZXRUU3R5bGluZ1JhbmdlUHJldih0U3R5bGluZ0F0SW5kZXgpIDogZ2V0VFN0eWxpbmdSYW5nZU5leHQodFN0eWxpbmdBdEluZGV4KTtcbiAgbGV0IGZvdW5kRHVwbGljYXRlID0gZmFsc2U7XG4gIC8vIFdlIGtlZXAgaXRlcmF0aW5nIGFzIGxvbmcgYXMgd2UgaGF2ZSBhIGN1cnNvclxuICAvLyBBTkQgZWl0aGVyOiBXZSBmb3VuZCB3aGF0IHdlIGFyZSBsb29raW5nIGZvciwgb3Igd2UgYXJlIGEgbWFwIGluIHdoaWNoIGNhc2Ugd2UgaGF2ZSB0b1xuICAvLyBjb250aW51ZSBzZWFyY2hpbmcgZXZlbiBhZnRlciB3ZSBmaW5kIHdoYXQgd2Ugd2VyZSBsb29raW5nIGZvciBzaW5jZSB3ZSBhcmUgYSB3aWxkIGNhcmRcbiAgLy8gYW5kIGV2ZXJ5dGhpbmcgbmVlZHMgdG8gYmUgZmxpcHBlZCB0byBkdXBsaWNhdGUuXG4gIHdoaWxlIChjdXJzb3IgIT09IDAgJiYgKGZvdW5kRHVwbGljYXRlID09PSBmYWxzZSB8fCBpc01hcCkpIHtcbiAgICBjb25zdCB0U3R5bGluZ1ZhbHVlQXRDdXJzb3IgPSB0RGF0YVtjdXJzb3JdIGFzIFRTdHlsaW5nS2V5O1xuICAgIGNvbnN0IHRTdHlsZVJhbmdlQXRDdXJzb3IgPSB0RGF0YVtjdXJzb3IgKyAxXSBhcyBUU3R5bGluZ1JhbmdlO1xuICAgIGNvbnN0IGtleUF0Q3Vyc29yID0gdHlwZW9mIHRTdHlsaW5nVmFsdWVBdEN1cnNvciA9PT0gJ29iamVjdCcgPyB0U3R5bGluZ1ZhbHVlQXRDdXJzb3Iua2V5IDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdFN0eWxpbmdWYWx1ZUF0Q3Vyc29yO1xuICAgIGlmIChrZXlBdEN1cnNvciA9PT0gbnVsbCB8fCBrZXkgPT0gbnVsbCB8fCBrZXlBdEN1cnNvciA9PT0ga2V5KSB7XG4gICAgICBmb3VuZER1cGxpY2F0ZSA9IHRydWU7XG4gICAgICB0RGF0YVtjdXJzb3IgKyAxXSA9IGlzUHJldkRpciA/IHNldFRTdHlsaW5nUmFuZ2VOZXh0RHVwbGljYXRlKHRTdHlsZVJhbmdlQXRDdXJzb3IpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0VFN0eWxpbmdSYW5nZVByZXZEdXBsaWNhdGUodFN0eWxlUmFuZ2VBdEN1cnNvcik7XG4gICAgfVxuICAgIGN1cnNvciA9IGlzUHJldkRpciA/IGdldFRTdHlsaW5nUmFuZ2VQcmV2KHRTdHlsZVJhbmdlQXRDdXJzb3IpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICBnZXRUU3R5bGluZ1JhbmdlTmV4dCh0U3R5bGVSYW5nZUF0Q3Vyc29yKTtcbiAgfVxuICBpZiAoc3RhdGljVmFsdWVzICE9PSAnJyAmJiAgLy8gSWYgd2UgaGF2ZSBzdGF0aWMgdmFsdWVzIHRvIHNlYXJjaFxuICAgICAgIWZvdW5kRHVwbGljYXRlICAgICAgICAgLy8gSWYgd2UgaGF2ZSBkdXBsaWNhdGUgZG9uJ3QgYm90aGVyIHNpbmNlIHdlIGFyZSBhbHJlYWR5IG1hcmtlZCBhc1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gZHVwbGljYXRlXG4gICAgICApIHtcbiAgICBpZiAoaXNNYXApIHtcbiAgICAgIC8vIGlmIHdlIGFyZSBhIE1hcCAoYW5kIHdlIGhhdmUgc3RhdGljcykgd2UgbXVzdCBhc3N1bWUgZHVwbGljYXRlXG4gICAgICBmb3VuZER1cGxpY2F0ZSA9IHRydWU7XG4gICAgfSBlbHNlIGlmIChzdGF0aWNWYWx1ZXMgIT0gbnVsbCkge1xuICAgICAgZm9yIChsZXQgaSA9IGlzQ2xhc3NCaW5kaW5nID8gcGFyc2VDbGFzc05hbWUoc3RhdGljVmFsdWVzKSA6IHBhcnNlU3R5bGUoc3RhdGljVmFsdWVzKTsgIC8vXG4gICAgICAgICAgIGkgPj0gMDsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgICAgICAgaSA9IGlzQ2xhc3NCaW5kaW5nID8gcGFyc2VDbGFzc05hbWVOZXh0KHN0YXRpY1ZhbHVlcywgaSkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXJzZVN0eWxlTmV4dChzdGF0aWNWYWx1ZXMsIGkpKSB7XG4gICAgICAgIGlmIChnZXRMYXN0UGFyc2VkS2V5KHN0YXRpY1ZhbHVlcykgPT09IGtleSkge1xuICAgICAgICAgIGZvdW5kRHVwbGljYXRlID0gdHJ1ZTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuICBpZiAoZm91bmREdXBsaWNhdGUpIHtcbiAgICB0RGF0YVtpbmRleCArIDFdID0gaXNQcmV2RGlyID8gc2V0VFN0eWxpbmdSYW5nZVByZXZEdXBsaWNhdGUodFN0eWxpbmdBdEluZGV4KSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldFRTdHlsaW5nUmFuZ2VOZXh0RHVwbGljYXRlKHRTdHlsaW5nQXRJbmRleCk7XG4gIH1cbn1cblxuLyoqXG4gKiBDb21wdXRlcyB0aGUgbmV3IHN0eWxpbmcgdmFsdWUgc3RhcnRpbmcgYXQgYGluZGV4YCBzdHlsaW5nIGJpbmRpbmcuXG4gKlxuICogQHBhcmFtIHREYXRhIGBURGF0YWAgY29udGFpbmluZyB0aGUgc3R5bGluZyBiaW5kaW5nIGxpbmtlZCBsaXN0LlxuICogICAgICAgICAgICAgIC0gYFREYXRhW2luZGV4XWAgY29udGFpbnMgdGhlIGJpbmRpbmcgbmFtZS5cbiAqICAgICAgICAgICAgICAtIGBURGF0YVtpbmRleCArIDFdYCBjb250YWlucyB0aGUgYFRTdHlsaW5nUmFuZ2VgIGEgbGlua2VkIGxpc3Qgb2Ygb3RoZXIgYmluZGluZ3MuXG4gKiBAcGFyYW0gdE5vZGUgYFROb2RlYCBjb250YWluaW5nIHRoZSBpbml0aWFsIHN0eWxpbmcgdmFsdWVzLlxuICogQHBhcmFtIGxWaWV3IGBMVmlld2AgY29udGFpbmluZyB0aGUgc3R5bGluZyB2YWx1ZXMuXG4gKiAgICAgICAgICAgICAgLSBgTFZpZXdbaW5kZXhdYCBjb250YWlucyB0aGUgYmluZGluZyB2YWx1ZS5cbiAqICAgICAgICAgICAgICAtIGBMVmlld1tpbmRleCArIDFdYCBjb250YWlucyB0aGUgY29uY2F0ZW5hdGVkIHZhbHVlIHVwIHRvIHRoaXMgcG9pbnQuXG4gKiBAcGFyYW0gaW5kZXggdGhlIGxvY2F0aW9uIGluIGBURGF0YWAvYExWaWV3YCB3aGVyZSB0aGUgc3R5bGluZyBzZWFyY2ggc2hvdWxkIHN0YXJ0LlxuICogQHBhcmFtIGlzQ2xhc3NCaW5kaW5nIGB0cnVlYCBpZiBiaW5kaW5nIHRvIGBjbGFzc05hbWVgOyBgZmFsc2VgIHdoZW4gYmluZGluZyB0byBgc3R5bGVgLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZmx1c2hTdHlsZUJpbmRpbmcoXG4gICAgdERhdGE6IFREYXRhLCB0Tm9kZTogVE5vZGUsIGxWaWV3OiBMVmlldywgaW5kZXg6IG51bWJlciwgaXNDbGFzc0JpbmRpbmc6IGJvb2xlYW4pOiBzdHJpbmcge1xuICBjb25zdCB0U3R5bGluZ1JhbmdlQXRJbmRleCA9IHREYXRhW2luZGV4ICsgMV0gYXMgVFN0eWxpbmdSYW5nZTtcbiAgLy8gV2hlbiBzdHlsaW5nIGNoYW5nZXMgd2UgZG9uJ3QgaGF2ZSB0byBzdGFydCBhdCB0aGUgYmVnZ2luZy4gSW5zdGVhZCB3ZSBzdGFydCBhdCB0aGUgY2hhbmdlXG4gIC8vIHZhbHVlIGFuZCBsb29rIHVwIHRoZSBwcmV2aW91cyBjb25jYXRlbmF0aW9uIGFzIGEgc3RhcnRpbmcgcG9pbnQgZ29pbmcgZm9yd2FyZC5cbiAgY29uc3QgbGFzdFVuY2hhbmdlZFZhbHVlSW5kZXggPSBnZXRUU3R5bGluZ1JhbmdlUHJldih0U3R5bGluZ1JhbmdlQXRJbmRleCk7XG4gIGxldCB0ZXh0ID0gbGFzdFVuY2hhbmdlZFZhbHVlSW5kZXggPT09IDAgP1xuICAgICAgKChpc0NsYXNzQmluZGluZyA/IHROb2RlLmNsYXNzZXMgOiB0Tm9kZS5zdHlsZXMpIGFzIHN0cmluZykgOlxuICAgICAgbFZpZXdbbGFzdFVuY2hhbmdlZFZhbHVlSW5kZXggKyAxXSBhcyBzdHJpbmc7XG4gIGxldCBjdXJzb3IgPSBpbmRleDtcbiAgd2hpbGUgKGN1cnNvciAhPT0gMCkge1xuICAgIGNvbnN0IHZhbHVlID0gbFZpZXdbY3Vyc29yXTtcbiAgICBjb25zdCBrZXkgPSB0RGF0YVtjdXJzb3JdIGFzIFRTdHlsaW5nS2V5O1xuICAgIGNvbnN0IHN0eWxpbmdSYW5nZSA9IHREYXRhW2N1cnNvciArIDFdIGFzIFRTdHlsaW5nUmFuZ2U7XG4gICAgbFZpZXdbY3Vyc29yICsgMV0gPSB0ZXh0ID0gYXBwZW5kU3R5bGluZyhcbiAgICAgICAgdGV4dCwga2V5LCB2YWx1ZSwgbnVsbCwgZ2V0VFN0eWxpbmdSYW5nZVByZXZEdXBsaWNhdGUoc3R5bGluZ1JhbmdlKSwgaXNDbGFzc0JpbmRpbmcpO1xuICAgIGN1cnNvciA9IGdldFRTdHlsaW5nUmFuZ2VOZXh0KHN0eWxpbmdSYW5nZSk7XG4gIH1cbiAgcmV0dXJuIHRleHQ7XG59XG5cblxuLyoqXG4gKiBBcHBlbmQgbmV3IHN0eWxpbmcgdG8gdGhlIGN1cnJlbnRseSBjb25jYXRlbmF0ZWQgc3R5bGluZyB0ZXh0LlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gY29uY2F0ZW5hdGVzIHRoZSBleGlzdGluZyBgY2xhc3NOYW1lYC9gY3NzVGV4dGAgdGV4dCB3aXRoIHRoZSBiaW5kaW5nIHZhbHVlLlxuICpcbiAqIEBwYXJhbSB0ZXh0IFRleHQgdG8gY29uY2F0ZW5hdGUgdG8uXG4gKiBAcGFyYW0gc3R5bGluZ0tleSBgVFN0eWxpbmdLZXlgIGhvbGRpbmcgdGhlIGtleSAoY2xhc3NOYW1lIG9yIHN0eWxlIHByb3BlcnR5IG5hbWUpLlxuICogQHBhcmFtIHZhbHVlIFRoZSB2YWx1ZSBmb3IgdGhlIGtleS5cbiAqICAgICAgICAgLSBgaXNDbGFzc0JpbmRpbmcgPT09IHRydWVgXG4gKiAgICAgICAgICAgICAgLSBgYm9vbGVhbmAgaWYgYHRydWVgIHRoZW4gYWRkIHRoZSBrZXkgdG8gdGhlIGNsYXNzIGxpc3Qgc3RyaW5nLlxuICogICAgICAgICAgICAgIC0gYEFycmF5YCBhZGQgZWFjaCBzdHJpbmcgdmFsdWUgdG8gdGhlIGNsYXNzIGxpc3Qgc3RyaW5nLlxuICogICAgICAgICAgICAgIC0gYE9iamVjdGAgYWRkIG9iamVjdCBrZXkgdG8gdGhlIGNsYXNzIGxpc3Qgc3RyaW5nIGlmIHRoZSBrZXkgdmFsdWUgaXMgdHJ1dGh5LlxuICogICAgICAgICAtIGBpc0NsYXNzQmluZGluZyA9PT0gZmFsc2VgXG4gKiAgICAgICAgICAgICAgLSBgQXJyYXlgIE5vdCBzdXBwb3J0ZWQuXG4gKiAgICAgICAgICAgICAgLSBgT2JqZWN0YCBhZGQgb2JqZWN0IGtleS92YWx1ZSB0byB0aGUgc3R5bGVzLlxuICogQHBhcmFtIHNhbml0aXplciBPcHRpb25hbCBzYW5pdGl6ZXIgdG8gdXNlLiBJZiBgbnVsbGAgdGhlIGBzdHlsaW5nS2V5YCBzYW5pdGl6ZXIgd2lsbCBiZSB1c2VkLlxuICogICAgICAgIFRoaXMgaXMgcHJvdmlkZWQgc28gdGhhdCBgybXJtXN0eWxlTWFwKClgL2DJtcm1Y2xhc3NNYXAoKWAgY2FuIHJlY3Vyc2l2ZWx5IGNhbGxcbiAqICAgICAgICBgYXBwZW5kU3R5bGluZ2Agd2l0aG91dCBoYXZpbmcgdGEgcGFja2FnZSB0aGUgc2FuaXRpemVyIGludG8gYFRTdHlsaW5nU2FuaXRpemF0aW9uS2V5YC5cbiAqIEBwYXJhbSBoYXNQcmV2aW91c0R1cGxpY2F0ZSBkZXRlcm1pbmVzIGlmIHRoZXJlIGlzIGEgY2hhbmNlIG9mIGR1cGxpY2F0ZS5cbiAqICAgICAgICAgLSBgdHJ1ZWAgdGhlIGV4aXN0aW5nIGB0ZXh0YCBzaG91bGQgYmUgc2VhcmNoZWQgZm9yIGR1cGxpY2F0ZXMgYW5kIGlmIGFueSBmb3VuZCB0aGV5XG4gKiAgICAgICAgICAgc2hvdWxkIGJlIHJlbW92ZWQuXG4gKiAgICAgICAgIC0gYGZhbHNlYCBGYXN0IHBhdGgsIGp1c3QgY29uY2F0ZW5hdGUgdGhlIHN0cmluZ3MuXG4gKiBAcGFyYW0gaXNDbGFzc0JpbmRpbmcgRGV0ZXJtaW5lcyBpZiB0aGUgYHRleHRgIGlzIGBjbGFzc05hbWVgIG9yIGBjc3NUZXh0YC5cbiAqIEByZXR1cm5zIG5ldyBzdHlsaW5nIHN0cmluZyB3aXRoIHRoZSBjb25jYXRlbmF0ZWQgdmFsdWVzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gYXBwZW5kU3R5bGluZyhcbiAgICB0ZXh0OiBzdHJpbmcsIHN0eWxpbmdLZXk6IFRTdHlsaW5nS2V5LCB2YWx1ZTogYW55LCBzYW5pdGl6ZXI6IFNhbml0aXplckZuIHwgbnVsbCxcbiAgICBoYXNQcmV2aW91c0R1cGxpY2F0ZTogYm9vbGVhbiwgaXNDbGFzc0JpbmRpbmc6IGJvb2xlYW4pOiBzdHJpbmcge1xuICBsZXQga2V5OiBzdHJpbmc7XG4gIGxldCBzdWZmaXhPclNhbml0aXplcjogc3RyaW5nfFNhbml0aXplckZufHVuZGVmaW5lZHxudWxsID0gc2FuaXRpemVyO1xuICBpZiAodHlwZW9mIHN0eWxpbmdLZXkgPT09ICdvYmplY3QnKSB7XG4gICAgaWYgKHN0eWxpbmdLZXkua2V5ID09PSBudWxsKSB7XG4gICAgICByZXR1cm4gdmFsdWUgIT0gbnVsbCA/IHN0eWxpbmdLZXkuZXh0cmEodGV4dCwgdmFsdWUsIGhhc1ByZXZpb3VzRHVwbGljYXRlKSA6IHRleHQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIHN1ZmZpeE9yU2FuaXRpemVyID0gc3R5bGluZ0tleS5leHRyYTtcbiAgICAgIGtleSA9IHN0eWxpbmdLZXkua2V5O1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBrZXkgPSBzdHlsaW5nS2V5O1xuICB9XG4gIGlmIChpc0NsYXNzQmluZGluZykge1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnRFcXVhbCh0eXBlb2Ygc3R5bGluZ0tleSA9PT0gJ3N0cmluZycsIHRydWUsICdFeHBlY3Rpbmcga2V5IHRvIGJlIHN0cmluZycpO1xuICAgIGlmIChoYXNQcmV2aW91c0R1cGxpY2F0ZSkge1xuICAgICAgdGV4dCA9IHRvZ2dsZUNsYXNzKHRleHQsIHN0eWxpbmdLZXkgYXMgc3RyaW5nLCAhIXZhbHVlKTtcbiAgICB9IGVsc2UgaWYgKHZhbHVlKSB7XG4gICAgICB0ZXh0ID0gdGV4dCA9PT0gJycgPyBzdHlsaW5nS2V5IGFzIHN0cmluZyA6IHRleHQgKyAnICcgKyBzdHlsaW5nS2V5O1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBpZiAoaGFzUHJldmlvdXNEdXBsaWNhdGUpIHtcbiAgICAgIHRleHQgPSByZW1vdmVTdHlsZSh0ZXh0LCBrZXkpO1xuICAgIH1cbiAgICBjb25zdCBrZXlWYWx1ZSA9XG4gICAgICAgIGtleSArICc6ICcgKyAodHlwZW9mIHN1ZmZpeE9yU2FuaXRpemVyID09PSAnZnVuY3Rpb24nID9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgc3VmZml4T3JTYW5pdGl6ZXIodmFsdWUpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgKHN1ZmZpeE9yU2FuaXRpemVyID09IG51bGwgPyB2YWx1ZSA6IHZhbHVlICsgc3VmZml4T3JTYW5pdGl6ZXIpKTtcbiAgICB0ZXh0ID0gdGV4dCA9PT0gJycgPyBrZXlWYWx1ZSA6IHRleHQgKyAnOyAnICsga2V5VmFsdWU7XG4gIH1cbiAgcmV0dXJuIHRleHQ7XG59XG5cbi8qKlxuICogYMm1ybVjbGFzc01hcCgpYCBpbnNlcnRzIGBDTEFTU19NQVBfU1RZTElOR19LRVlgIGFzIGEga2V5IHRvIHRoZSBgaW5zZXJ0VFN0eWxpbmdCaW5kaW5nKClgLlxuICpcbiAqIFRoZSBwdXJwb3NlIG9mIHRoaXMga2V5IGlzIHRvIGFkZCBjbGFzcyBtYXAgYWJpbGl0aWVzIHRvIHRoZSBjb25jYXRlbmF0aW9uIGluIGEgdHJlZSBzaGFrYWJsZVxuICogd2F5LiBJZiBgybXJtWNsYXNzTWFwKClgIGlzIG5vdCByZWZlcmVuY2VkIHRoYW4gYENMQVNTX01BUF9TVFlMSU5HX0tFWWAgd2lsbCBiZWNvbWUgZWxpZ2libGUgZm9yXG4gKiB0cmVlIHNoYWtpbmcuXG4gKlxuICogVGhpcyBrZXkgc3VwcG9ydHM6IGBzdHJpbmdzYCwgYG9iamVjdGAgKGFzIE1hcCkgYW5kIGBBcnJheWAuIEluIGVhY2ggY2FzZSBpdCBpcyBuZWNlc3NhcnkgdG9cbiAqIGJyZWFrIHRoZSBjbGFzc2VzIGludG8gcGFydHMgYW5kIGNvbmNhdGVuYXRlIHRoZSBwYXJ0cyBpbnRvIHRoZSBgdGV4dGAuIFRoZSBjb25jYXRlbmF0aW9uIG5lZWRzXG4gKiB0byBiZSBkb25lIGluIHBhcnRzIGFzIGVhY2gga2V5IGlzIGluZGl2aWR1YWxseSBzdWJqZWN0IHRvIG92ZXJ3cml0ZXMuXG4gKi9cbmV4cG9ydCBjb25zdCBDTEFTU19NQVBfU1RZTElOR19LRVk6IFRTdHlsaW5nTWFwS2V5ID0ge1xuICBrZXk6IG51bGwsXG4gIGV4dHJhOiAodGV4dDogc3RyaW5nLCB2YWx1ZTogYW55LCBoYXNQcmV2aW91c0R1cGxpY2F0ZTogYm9vbGVhbik6IHN0cmluZyA9PiB7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG4gICAgICAvLyBXZSBzdXBwb3J0IEFycmF5c1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB2YWx1ZS5sZW5ndGg7IGkrKykge1xuICAgICAgICB0ZXh0ID0gYXBwZW5kU3R5bGluZyh0ZXh0LCB2YWx1ZVtpXSwgdHJ1ZSwgbnVsbCwgaGFzUHJldmlvdXNEdXBsaWNhdGUsIHRydWUpO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAodHlwZW9mIHZhbHVlID09PSAnb2JqZWN0Jykge1xuICAgICAgLy8gV2Ugc3VwcG9ydCBtYXBzXG4gICAgICBmb3IgKGxldCBrZXkgaW4gdmFsdWUpIHtcbiAgICAgICAgdGV4dCA9IGFwcGVuZFN0eWxpbmcodGV4dCwga2V5LCB2YWx1ZVtrZXldLCBudWxsLCBoYXNQcmV2aW91c0R1cGxpY2F0ZSwgdHJ1ZSk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmICh0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnKSB7XG4gICAgICAvLyBXZSBzdXBwb3J0IHN0cmluZ3NcbiAgICAgIGlmIChoYXNQcmV2aW91c0R1cGxpY2F0ZSkge1xuICAgICAgICAvLyBXZSBuZWVkIHRvIHBhcnNlIGFuZCBwcm9jZXNzIGl0LlxuICAgICAgICBjb25zdCBjaGFuZ2VzID0gbmV3IE1hcDxzdHJpbmcsIGJvb2xlYW58bnVsbD4oKTtcbiAgICAgICAgc3BsaXRDbGFzc0xpc3QodmFsdWUsIGNoYW5nZXMsIGZhbHNlKTtcbiAgICAgICAgY2hhbmdlcy5mb3JFYWNoKChfLCBrZXkpID0+IHRleHQgPSBhcHBlbmRTdHlsaW5nKHRleHQsIGtleSwgdHJ1ZSwgbnVsbCwgdHJ1ZSwgdHJ1ZSkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gTm8gZHVwbGljYXRlcywganVzdCBhcHBlbmQgaXQuXG4gICAgICAgIHRleHQgPSB0ZXh0ID09PSAnJyA/IHZhbHVlIDogdGV4dCArICcgJyArIHZhbHVlO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAvLyBBbGwgb3RoZXIgY2FzZXMgYXJlIG5vdCBzdXBwb3J0ZWQuXG4gICAgICBuZ0Rldk1vZGUgJiYgdGhyb3dFcnJvcignVW5zdXBwb3J0ZWQgdmFsdWUgZm9yIGNsYXNzIGJpbmRpbmc6ICcgKyB2YWx1ZSk7XG4gICAgfVxuICAgIHJldHVybiB0ZXh0O1xuICB9XG59O1xuXG4vKipcbiAqIGDJtcm1c3R5bGVNYXAoKWAgaW5zZXJ0cyBgU1RZTEVfTUFQX1NUWUxJTkdfS0VZYCBhcyBhIGtleSB0byB0aGUgYGluc2VydFRTdHlsaW5nQmluZGluZygpYC5cbiAqXG4gKiBUaGUgcHVycG9zZSBvZiB0aGlzIGtleSBpcyB0byBhZGQgc3R5bGUgbWFwIGFiaWxpdGllcyB0byB0aGUgY29uY2F0ZW5hdGlvbiBpbiBhIHRyZWUgc2hha2FibGVcbiAqIHdheS4gSWYgYMm1ybVzdHlsZU1hcCgpYCBpcyBub3QgcmVmZXJlbmNlZCB0aGFuIGBTVFlMRV9NQVBfU1RZTElOR19LRVlgIHdpbGwgYmVjb21lIGVsaWdpYmxlIGZvclxuICogdHJlZSBzaGFraW5nLiAoYFNUWUxFX01BUF9TVFlMSU5HX0tFWWAgYWxzbyBwdWxscyBpbiB0aGUgc2FuaXRpemVyIGFzIGDJtcm1c3R5bGVNYXAoKWAgY291bGQgaGF2ZVxuICogYSBzYW5pdGl6YWJsZSBwcm9wZXJ0eS4pXG4gKlxuICogVGhpcyBrZXkgc3VwcG9ydHM6IGBzdHJpbmdzYCwgYW5kIGBvYmplY3RgIChhcyBNYXApLiBJbiBlYWNoIGNhc2UgaXQgaXMgbmVjZXNzYXJ5IHRvXG4gKiBicmVhayB0aGUgc3R5bGUgaW50byBwYXJ0cyBhbmQgY29uY2F0ZW5hdGUgdGhlIHBhcnRzIGludG8gdGhlIGB0ZXh0YC4gVGhlIGNvbmNhdGVuYXRpb24gbmVlZHNcbiAqIHRvIGJlIGRvbmUgaW4gcGFydHMgYXMgZWFjaCBrZXkgaXMgaW5kaXZpZHVhbGx5IHN1YmplY3QgdG8gb3ZlcndyaXRlcy5cbiAqL1xuZXhwb3J0IGNvbnN0IFNUWUxFX01BUF9TVFlMSU5HX0tFWTogVFN0eWxpbmdNYXBLZXkgPSB7XG4gIGtleTogbnVsbCxcbiAgZXh0cmE6ICh0ZXh0OiBzdHJpbmcsIHZhbHVlOiBhbnksIGhhc1ByZXZpb3VzRHVwbGljYXRlOiBib29sZWFuKTogc3RyaW5nID0+IHtcbiAgICBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcbiAgICAgIC8vIFdlIGRvbid0IHN1cHBvcnQgQXJyYXlzXG4gICAgICBuZ0Rldk1vZGUgJiYgdGhyb3dFcnJvcignU3R5bGUgYmluZGluZ3MgZG8gbm90IHN1cHBvcnQgYXJyYXkgYmluZGluZ3M6ICcgKyB2YWx1ZSk7XG4gICAgfSBlbHNlIGlmICh0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnKSB7XG4gICAgICAvLyBXZSBzdXBwb3J0IG1hcHNcbiAgICAgIGZvciAobGV0IGtleSBpbiB2YWx1ZSkge1xuICAgICAgICB0ZXh0ID0gYXBwZW5kU3R5bGluZyhcbiAgICAgICAgICAgIHRleHQsIGtleSwgdmFsdWVba2V5XSwgc3R5bGVQcm9wTmVlZHNTYW5pdGl6YXRpb24oa2V5KSA/IMm1ybVzYW5pdGl6ZVN0eWxlIDogbnVsbCxcbiAgICAgICAgICAgIGhhc1ByZXZpb3VzRHVwbGljYXRlLCBmYWxzZSk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmICh0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnKSB7XG4gICAgICAvLyBXZSBzdXBwb3J0IHN0cmluZ3NcbiAgICAgIGlmIChoYXNQcmV2aW91c0R1cGxpY2F0ZSkge1xuICAgICAgICAvLyBXZSBuZWVkIHRvIHBhcnNlIGFuZCBwcm9jZXNzIGl0LlxuICAgICAgICBjb25zdCBjaGFuZ2VzOiBTdHlsZUNoYW5nZXNNYXAgPVxuICAgICAgICAgICAgbmV3IE1hcDxzdHJpbmcsIHtvbGQ6IHN0cmluZyB8IG51bGwsIG5ldzogc3RyaW5nIHwgbnVsbH0+KCk7XG4gICAgICAgIHBhcnNlS2V5VmFsdWUodmFsdWUsIGNoYW5nZXMsIGZhbHNlKTtcbiAgICAgICAgY2hhbmdlcy5mb3JFYWNoKFxuICAgICAgICAgICAgKHZhbHVlLCBrZXkpID0+IHRleHQgPSBhcHBlbmRTdHlsaW5nKFxuICAgICAgICAgICAgICAgIHRleHQsIGtleSwgdmFsdWUub2xkLCBzdHlsZVByb3BOZWVkc1Nhbml0aXphdGlvbihrZXkpID8gybXJtXNhbml0aXplU3R5bGUgOiBudWxsLFxuICAgICAgICAgICAgICAgIHRydWUsIGZhbHNlKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBObyBkdXBsaWNhdGVzLCBqdXN0IGFwcGVuZCBpdC5cbiAgICAgICAgdGV4dCA9IHRleHQgPT09ICcnID8gdmFsdWUgOiB0ZXh0ICsgJzsgJyArIHZhbHVlO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAvLyBBbGwgb3RoZXIgY2FzZXMgYXJlIG5vdCBzdXBwb3J0ZWQuXG4gICAgICBuZ0Rldk1vZGUgJiYgdGhyb3dFcnJvcignVW5zdXBwb3J0ZWQgdmFsdWUgZm9yIHN0eWxlIGJpbmRpbmc6ICcgKyB2YWx1ZSk7XG4gICAgfVxuICAgIHJldHVybiB0ZXh0O1xuICB9XG59O1xuIl19