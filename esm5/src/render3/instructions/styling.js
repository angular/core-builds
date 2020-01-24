/**
* @license
* Copyright Google Inc. All Rights Reserved.
*
* Use of this source code is governed by an MIT-style license that can be
* found in the LICENSE file at https://angular.io/license
*/
import { unwrapSafeValue } from '../../sanitization/bypass';
import { stylePropNeedsSanitization, ɵɵsanitizeStyle } from '../../sanitization/sanitization';
import { arrayMapGet, arrayMapSet } from '../../util/array_utils';
import { assertDefined, assertEqual, assertLessThan, throwError } from '../../util/assert';
import { EMPTY_ARRAY } from '../../util/empty';
import { concatStringsWithSpace, stringify } from '../../util/stringify';
import { assertFirstUpdatePass } from '../assert';
import { bindingUpdated } from '../bindings';
import { getTStylingRangeNext, getTStylingRangeNextDuplicate, getTStylingRangePrev, getTStylingRangePrevDuplicate } from '../interfaces/styling';
import { HEADER_OFFSET, RENDERER, TVIEW } from '../interfaces/view';
import { applyStyling } from '../node_manipulation';
import { getCurrentStyleSanitizer, getLView, getSelectedIndex, incrementBindingIndex, setCurrentStyleSanitizer } from '../state';
import { insertTStylingBinding } from '../styling/style_binding_list';
import { getLastParsedKey, getLastParsedValue, parseClassName, parseClassNameNext, parseStyle, parseStyleNext } from '../styling/styling_parser';
import { NO_CHANGE } from '../tokens';
import { getNativeByIndex } from '../util/view_utils';
import { setDirectiveInputsWhichShadowsStyling } from './property';
/**
 * Sets the current style sanitizer function which will then be used
 * within all follow-up prop and map-based style binding instructions
 * for the given element.
 *
 * Note that once styling has been applied to the element (i.e. once
 * `advance(n)` is executed or the hostBindings/template function exits)
 * then the active `sanitizerFn` will be set to `null`. This means that
 * once styling is applied to another element then a another call to
 * `styleSanitizer` will need to be made.
 *
 * @param sanitizerFn The sanitization function that will be used to
 *       process style prop/value entries.
 *
 * @codeGenApi
 */
export function ɵɵstyleSanitizer(sanitizer) {
    setCurrentStyleSanitizer(sanitizer);
}
/**
 * Update a style binding on an element with the provided value.
 *
 * If the style value is falsy then it will be removed from the element
 * (or assigned a different value depending if there are any styles placed
 * on the element with `styleMap` or any static styles that are
 * present from when the element was created with `styling`).
 *
 * Note that the styling element is updated as part of `stylingApply`.
 *
 * @param prop A valid CSS property.
 * @param value New value to write (`null` or an empty string to remove).
 * @param suffix Optional suffix. Used with scalar values to add unit such as `px`.
 *        Note that when a suffix is provided then the underlying sanitizer will
 *        be ignored.
 *
 * Note that this will apply the provided style value to the host element if this function is called
 * within a host binding function.
 *
 * @codeGenApi
 */
export function ɵɵstyleProp(prop, value, suffix) {
    checkStylingProperty(prop, value, suffix, false);
    return ɵɵstyleProp;
}
/**
 * Update a class binding on an element with the provided value.
 *
 * This instruction is meant to handle the `[class.foo]="exp"` case and,
 * therefore, the class binding itself must already be allocated using
 * `styling` within the creation block.
 *
 * @param prop A valid CSS class (only one).
 * @param value A true/false value which will turn the class on or off.
 *
 * Note that this will apply the provided class value to the host element if this function
 * is called within a host binding function.
 *
 * @codeGenApi
 */
export function ɵɵclassProp(className, value) {
    checkStylingProperty(className, value, null, true);
    return ɵɵclassProp;
}
/**
 * Update style bindings using an object literal on an element.
 *
 * This instruction is meant to apply styling via the `[style]="exp"` template bindings.
 * When styles are applied to the element they will then be updated with respect to
 * any styles/classes set via `styleProp`. If any styles are set to falsy
 * then they will be removed from the element.
 *
 * Note that the styling instruction will not be applied until `stylingApply` is called.
 *
 * @param styles A key/value style map of the styles that will be applied to the given element.
 *        Any missing styles (that have already been applied to the element beforehand) will be
 *        removed (unset) from the element's styling.
 *
 * Note that this will apply the provided styleMap value to the host element if this function
 * is called within a host binding.
 *
 * @codeGenApi
 */
export function ɵɵstyleMap(styles) {
    checkStylingMap(styleArrayMapSet, styleStringParser, styles, false);
}
/**
 * Parse text as style and add values to ArrayMap.
 *
 * This code is pulled out to a separate function so that it can be tree shaken away if it is not
 * needed. It is only reference from `ɵɵstyleMap`.
 *
 * @param arrayMap ArrayMap to add parsed values to.
 * @param text text to parse.
 */
export function styleStringParser(arrayMap, text) {
    for (var i = parseStyle(text); i >= 0; i = parseStyleNext(text, i)) {
        styleArrayMapSet(arrayMap, getLastParsedKey(text), getLastParsedValue(text));
    }
}
/**
 * Update class bindings using an object literal or class-string on an element.
 *
 * This instruction is meant to apply styling via the `[class]="exp"` template bindings.
 * When classes are applied to the element they will then be updated with
 * respect to any styles/classes set via `classProp`. If any
 * classes are set to falsy then they will be removed from the element.
 *
 * Note that the styling instruction will not be applied until `stylingApply` is called.
 * Note that this will the provided classMap value to the host element if this function is called
 * within a host binding.
 *
 * @param classes A key/value map or string of CSS classes that will be added to the
 *        given element. Any missing classes (that have already been applied to the element
 *        beforehand) will be removed (unset) from the element's list of CSS classes.
 *
 * @codeGenApi
 */
export function ɵɵclassMap(classes) {
    checkStylingMap(arrayMapSet, classStringParser, classes, true);
}
/**
 * Parse text as class and add values to ArrayMap.
 *
 * This code is pulled out to a separate function so that it can be tree shaken away if it is not
 * needed. It is only reference from `ɵɵclassMap`.
 *
 * @param arrayMap ArrayMap to add parsed values to.
 * @param text text to parse.
 */
export function classStringParser(arrayMap, text) {
    for (var i = parseClassName(text); i >= 0; i = parseClassNameNext(text, i)) {
        arrayMapSet(arrayMap, getLastParsedKey(text), true);
    }
}
/**
 * Common code between `ɵɵclassProp` and `ɵɵstyleProp`.
 *
 * @param prop property name.
 * @param value binding value.
 * @param suffixOrSanitizer suffix or sanitization function
 * @param isClassBased `true` if `class` change (`false` if `style`)
 */
export function checkStylingProperty(prop, value, suffixOrSanitizer, isClassBased) {
    var lView = getLView();
    var tView = lView[TVIEW];
    // Styling instructions use 2 slots per binding.
    // 1. one for the value / TStylingKey
    // 2. one for the intermittent-value / TStylingRange
    var bindingIndex = incrementBindingIndex(2);
    if (tView.firstUpdatePass) {
        stylingPropertyFirstUpdatePass(tView, prop, bindingIndex, isClassBased);
    }
    if (value !== NO_CHANGE && bindingUpdated(lView, bindingIndex, value)) {
        // This is a work around. Once PR#34480 lands the sanitizer is passed explicitly and this line
        // can be removed.
        var styleSanitizer = void 0;
        if (suffixOrSanitizer == null) {
            if (styleSanitizer = getCurrentStyleSanitizer()) {
                suffixOrSanitizer = styleSanitizer;
            }
        }
        var tNode = tView.data[getSelectedIndex() + HEADER_OFFSET];
        updateStyling(tView, tNode, lView, lView[RENDERER], prop, lView[bindingIndex + 1] = normalizeAndApplySuffixOrSanitizer(value, suffixOrSanitizer), isClassBased, bindingIndex);
    }
}
/**
* Common code between `ɵɵclassMap` and `ɵɵstyleMap`.
*
* @param tStylingMapKey See `STYLE_MAP_STYLING_KEY` and `CLASS_MAP_STYLING_KEY`.
* @param value binding value.
* @param isClassBased `true` if `class` change (`false` if `style`)
*/
export function checkStylingMap(arrayMapSet, stringParser, value, isClassBased) {
    var lView = getLView();
    var tView = lView[TVIEW];
    var bindingIndex = incrementBindingIndex(2);
    if (tView.firstUpdatePass) {
        stylingPropertyFirstUpdatePass(tView, null, bindingIndex, isClassBased);
    }
    if (value !== NO_CHANGE && bindingUpdated(lView, bindingIndex, value)) {
        // `getSelectedIndex()` should be here (rather than in instruction) so that it is guarded by the
        // if so as not to read unnecessarily.
        var tNode = tView.data[getSelectedIndex() + HEADER_OFFSET];
        if (hasStylingInputShadow(tNode, isClassBased) && !isInHostBindings(tView, bindingIndex)) {
            // VE does not concatenate the static portion like we are doing here.
            // Instead VE just ignores the static completely if dynamic binding is present.
            // Because of locality we have already set the static portion because we don't know if there
            // is a dynamic portion until later. If we would ignore the static portion it would look like
            // tha the binding has removed it. This would confuse `[ngStyle]`/`[ngClass]` to do the wrong
            // thing as it would think tha the static portion was removed. For this reason we
            // concatenate it so that `[ngStyle]`/`[ngClass]`  can continue to work on changed.
            var staticPrefix = isClassBased ? tNode.classes : tNode.styles;
            ngDevMode && isClassBased === false && staticPrefix !== null &&
                assertEqual(staticPrefix.endsWith(';'), true, 'Expecting static portion to end with \';\'');
            if (typeof value === 'string') {
                value = concatStringsWithSpace(staticPrefix, value);
            }
            // Given `<div [style] my-dir>` such that `my-dir` has `@Input('style')`.
            // This takes over the `[style]` binding. (Same for `[class]`)
            setDirectiveInputsWhichShadowsStyling(tNode, lView, value, isClassBased);
        }
        else {
            updateStylingMap(tView, tNode, lView, lView[RENDERER], lView[bindingIndex + 1], lView[bindingIndex + 1] = toStylingArrayMap(arrayMapSet, stringParser, value), isClassBased, bindingIndex);
        }
    }
}
/**
 * Determines when the binding is in `hostBindings` section
 *
 * @param tView Current `TView`
 * @param bindingIndex index of binding which we would like if it is in `hostBindings`
 */
function isInHostBindings(tView, bindingIndex) {
    // All host bindings are placed after the expando section.
    return bindingIndex >= tView.expandoStartIndex;
}
/**
* Collects the necessary information to insert the binding into a linked list of style bindings
* using `insertTStylingBinding`.
*
* @param tView `TView` where the binding linked list will be stored.
* @param prop Property/key of the binding.
* @param suffix Optional suffix or Sanitization function.
* @param bindingIndex Index of binding associated with the `prop`
* @param isClassBased `true` if `class` change (`false` if `style`)
*/
function stylingPropertyFirstUpdatePass(tView, tStylingKey, bindingIndex, isClassBased) {
    ngDevMode && assertFirstUpdatePass(tView);
    var tData = tView.data;
    if (tData[bindingIndex + 1] === null) {
        // The above check is necessary because we don't clear first update pass until first successful
        // (no exception) template execution. This prevents the styling instruction from double adding
        // itself to the list.
        // `getSelectedIndex()` should be here (rather than in instruction) so that it is guarded by the
        // if so as not to read unnecessarily.
        var tNode = tData[getSelectedIndex() + HEADER_OFFSET];
        var isHostBindings = isInHostBindings(tView, bindingIndex);
        if (hasStylingInputShadow(tNode, isClassBased) && tStylingKey === null && !isHostBindings) {
            // `tStylingKey === null` implies that we are either `[style]` or `[class]` binding.
            // If there is a directive which uses `@Input('style')` or `@Input('class')` than
            // we need to neutralize this binding since that directive is shadowing it.
            // We turn this into a noop by setting the key to `false`
            tStylingKey = false;
        }
        insertTStylingBinding(tData, tNode, tStylingKey, bindingIndex, isHostBindings, isClassBased);
    }
}
/**
 * Convert user input to `ArrayMap`.
 *
 * This function takes user input which could be `string`, Object literal, or iterable and converts
 * it into a consistent representation. The output of this is `ArrayMap` (which is an array where
 * even indexes contain keys and odd indexes contain values for those keys).
 *
 * The advantage of converting to `ArrayMap` is that we can perform diff in a input independent way.
 * (ie we can compare `foo bar` to `['bar', 'baz'] and determine a set of changes which need to be
 * applied)
 *
 * The fact that `ArrayMap` is sorted is very important because it allows us to compute the
 * difference in linear fashion without the need to allocate any additional data.
 *
 * For example if we kept this as a `Map` we would have to iterate over previous `Map` to determine
 * which values need to be delete, over the new `Map` to determine additions, and we would have to
 * keep additional `Map` to keep track of duplicates or items which have not yet been visited.
 *
 * @param stringParser The parser is passed in so that it will be tree shakable. See
 *        `styleStringParser` and `classStringParser`
 * @param value The value to parse/convert to `ArrayMap`
 */
export function toStylingArrayMap(arrayMapSet, stringParser, value) {
    if (value === null || value === undefined || value === '')
        return EMPTY_ARRAY;
    var styleArrayMap = [];
    if (Array.isArray(value)) {
        for (var i = 0; i < value.length; i++) {
            arrayMapSet(styleArrayMap, value[i], true);
        }
    }
    else if (typeof value === 'object') {
        if (value instanceof Map) {
            value.forEach(function (v, k) { return arrayMapSet(styleArrayMap, k, v); });
        }
        else if (value instanceof Set) {
            value.forEach(function (k) { return arrayMapSet(styleArrayMap, k, true); });
        }
        else {
            for (var key in value) {
                if (value.hasOwnProperty(key)) {
                    arrayMapSet(styleArrayMap, key, value[key]);
                }
            }
        }
    }
    else if (typeof value === 'string') {
        stringParser(styleArrayMap, value);
    }
    else {
        ngDevMode && throwError('Unsupported styling type ' + typeof value);
    }
    return styleArrayMap;
}
/**
 * Set a `value` for a `key` taking style sanitization into account.
 *
 * See: `arrayMapSet` for details
 *
 * @param arrayMap ArrayMap to add to.
 * @param key Style key to add. (This key will be checked if it needs sanitization)
 * @param value The value to set (If key needs sanitization it will be sanitized)
 */
function styleArrayMapSet(arrayMap, key, value) {
    if (stylePropNeedsSanitization(key)) {
        value = ɵɵsanitizeStyle(value);
    }
    arrayMapSet(arrayMap, key, value);
}
/**
 * Update map based styling.
 *
 * Map based styling could be anything which contains more than one binding. For example `string`,
 * `Map`, `Set` or object literal. Dealing with all of these types would complicate the logic so
 * instead this function expects that the complex input is first converted into normalized
 * `ArrayMap`. The advantage of normalization is that we get the values sorted, which makes it very
 * cheap to compute deltas between the previous and current value.
 *
 * @param tView Associated `TView.data` contains the linked list of binding priorities.
 * @param tNode `TNode` where the binding is located.
 * @param lView `LView` contains the values associated with other styling binding at this `TNode`.
 * @param renderer Renderer to use if any updates.
 * @param oldArrayMap Previous value represented as `ArrayMap`
 * @param newArrayMap Current value represented as `ArrayMap`
 * @param isClassBased `true` if `class` (`false` if `style`)
 * @param bindingIndex Binding index of the binding.
 */
function updateStylingMap(tView, tNode, lView, renderer, oldArrayMap, newArrayMap, isClassBased, bindingIndex) {
    if (oldArrayMap === NO_CHANGE) {
        // ON first execution the oldArrayMap is NO_CHANGE => treat is as empty ArrayMap.
        oldArrayMap = EMPTY_ARRAY;
    }
    var oldIndex = 0;
    var newIndex = 0;
    var oldKey = 0 < oldArrayMap.length ? oldArrayMap[0] : null;
    var newKey = 0 < newArrayMap.length ? newArrayMap[0] : null;
    while (oldKey !== null || newKey !== null) {
        ngDevMode && assertLessThan(oldIndex, 999, 'Are we stuck in infinite loop?');
        ngDevMode && assertLessThan(newIndex, 999, 'Are we stuck in infinite loop?');
        var oldValue = oldIndex < oldArrayMap.length ? oldArrayMap[oldIndex + 1] : undefined;
        var newValue = newIndex < newArrayMap.length ? newArrayMap[newIndex + 1] : undefined;
        var setKey = null;
        var setValue = undefined;
        if (oldKey === newKey) {
            // UPDATE: Keys are equal => new value is overwriting old value.
            oldIndex += 2;
            newIndex += 2;
            if (oldValue !== newValue) {
                setKey = newKey;
                setValue = newValue;
            }
        }
        else if (newKey === null || oldKey !== null && oldKey < newKey) {
            // DELETE: oldKey key is missing or we did not find the oldKey in the newValue.
            oldIndex += 2;
            setKey = oldKey;
        }
        else {
            // CREATE: newKey is less than oldKey (or no oldKey) => we have new key.
            ngDevMode && assertDefined(newKey, 'Expecting to have a valid key');
            newIndex += 2;
            setKey = newKey;
            setValue = newValue;
        }
        if (setKey !== null) {
            updateStyling(tView, tNode, lView, renderer, setKey, setValue, isClassBased, bindingIndex);
        }
        oldKey = oldIndex < oldArrayMap.length ? oldArrayMap[oldIndex] : null;
        newKey = newIndex < newArrayMap.length ? newArrayMap[newIndex] : null;
    }
}
/**
 * Update a simple (property name) styling.
 *
 * This function takes `prop` and updates the DOM to that value. The function takes the binding
 * value as well as binding priority into consideration to determine which value should be written
 * to DOM. (For example it may be determined that there is a higher priority overwrite which blocks
 * the DOM write, or if the value goes to `undefined` a lower priority overwrite may be consulted.)
 *
 * @param tView Associated `TView.data` contains the linked list of binding priorities.
 * @param tNode `TNode` where the binding is located.
 * @param lView `LView` contains the values associated with other styling binding at this `TNode`.
 * @param renderer Renderer to use if any updates.
 * @param prop Either style property name or a class name.
 * @param value Either style vale for `prop` or `true`/`false` if `prop` is class.
 * @param isClassBased `true` if `class` (`false` if `style`)
 * @param bindingIndex Binding index of the binding.
 */
function updateStyling(tView, tNode, lView, renderer, prop, value, isClassBased, bindingIndex) {
    if (tNode.type !== 3 /* Element */) {
        // It is possible to have styling on non-elements (such as ng-container).
        // This is rare, but it does happen. In such a case, just ignore the binding.
        return;
    }
    var tData = tView.data;
    var tRange = tData[bindingIndex + 1];
    var higherPriorityValue = getTStylingRangeNextDuplicate(tRange) ?
        findStylingValue(tData, null, lView, prop, getTStylingRangeNext(tRange), isClassBased) :
        undefined;
    if (!isStylingValuePresent(higherPriorityValue)) {
        // We don't have a next duplicate, or we did not find a duplicate value.
        if (!isStylingValuePresent(value)) {
            // We should delete current value or restore to lower priority value.
            if (getTStylingRangePrevDuplicate(tRange)) {
                // We have a possible prev duplicate, let's retrieve it.
                value =
                    findStylingValue(tData, tNode, lView, prop, getTStylingRangePrev(tRange), isClassBased);
            }
        }
        var rNode = getNativeByIndex(getSelectedIndex(), lView);
        applyStyling(renderer, isClassBased, rNode, prop, value);
    }
}
/**
 * Search for styling value with higher priority which is overwriting current value.
 *
 * When value is being applied at a location related values need to be consulted.
 * - If there is a higher priority binding, we should be using that one instead.
 *   For example `<div  [style]="{color:exp1}" [style.color]="exp2">` change to `exp1`
 *   requires that we check `exp2` to see if it is set to value other than `undefined`.
 * - If there is a lower priority binding and we are changing to `undefined`
 *   For example `<div  [style]="{color:exp1}" [style.color]="exp2">` change to `exp2` to
 *   `undefined` requires that we check `exp` (and static values) and use that as new value.
 *
 * NOTE: The styling stores two values.
 * 1. The raw value which came from the application is stored at `index + 0` location. (This value
 *    is used for dirty checking).
 * 2. The normalized value (converted to `ArrayMap` if map and sanitized) is stored at `index + 1`.
 *    The advantage of storing the sanitized value is that once the value is written we don't need
 *    to worry about sanitizing it later or keeping track of the sanitizer.
 *
 * @param tData `TData` used for traversing the priority.
 * @param tNode `TNode` to use for resolving static styling. Also controls search direction.
 *   - `TNode` search previous and quit as soon as `isStylingValuePresent(value)` is true.
 *      If no value found consult `tNode.styleMap`/`tNode.classMap` for default value.
 *   - `null` search next and go all the way to end. Return last value where
 *     `isStylingValuePresent(value)` is true.
 * @param lView `LView` used for retrieving the actual values.
 * @param prop Property which we are interested in.
 * @param index Starting index in the linked list of styling bindings where the search should start.
 * @param isClassBased `true` if `class` (`false` if `style`)
 */
function findStylingValue(tData, tNode, lView, prop, index, isClassBased) {
    var value = undefined;
    while (index > 0) {
        var key = tData[index];
        var currentValue = key === null ? arrayMapGet(lView[index + 1], prop) :
            key === prop ? lView[index + 1] : undefined;
        if (isStylingValuePresent(currentValue)) {
            value = currentValue;
            if (tNode !== null) {
                return value;
            }
        }
        var tRange = tData[index + 1];
        index = tNode !== null ? getTStylingRangePrev(tRange) : getTStylingRangeNext(tRange);
    }
    if (tNode !== null) {
        // in case where we are going in previous direction AND we did not find anything, we need to
        // consult static styling
        var staticArrayMap = isClassBased ? tNode.classesMap : tNode.stylesMap;
        if (staticArrayMap === undefined) {
            // This is the first time we are here, and we need to initialize it.
            initializeStylingStaticArrayMap(tNode);
            staticArrayMap = isClassBased ? tNode.classesMap : tNode.stylesMap;
        }
        if (staticArrayMap !== null) {
            value = arrayMapGet(staticArrayMap, prop);
        }
    }
    return value;
}
/**
 * Determines if the binding value should be used (or if the value is 'undefined' and hence priority
 * resolution should be used.)
 *
 * @param value Binding style value.
 */
function isStylingValuePresent(value) {
    // Currently only `undefined` value is considered non-binding. That is `undefined` says I don't
    // have an opinion as to what this binding should be and you should consult other bindings by
    // priority to determine the valid value.
    // This is extracted into a single function so that we have a single place to control this.
    return value !== undefined;
}
/**
 * Lazily computes `tNode.classesMap`/`tNode.stylesMap`.
 *
 * This code is here because we don't want to included it in `elementStart` as it would make hello
 * world bigger even if no styling would be present. Instead we initialize the values here so that
 * tree shaking will only bring it in if styling is present.
 *
 * @param tNode `TNode` to initialize.
 */
export function initializeStylingStaticArrayMap(tNode) {
    ngDevMode && assertEqual(tNode.classesMap, undefined, 'Already initialized!');
    ngDevMode && assertEqual(tNode.stylesMap, undefined, 'Already initialized!');
    var styleMap = null;
    var classMap = null;
    var mergeAttrs = tNode.mergedAttrs || EMPTY_ARRAY;
    var mode = -1 /* ImplicitAttributes */;
    for (var i = 0; i < mergeAttrs.length; i++) {
        var item = mergeAttrs[i];
        if (typeof item === 'number') {
            mode = item;
        }
        else if (mode === 1 /* Classes */) {
            classMap = classMap || [];
            arrayMapSet(classMap, item, true);
        }
        else if (mode === 2 /* Styles */) {
            styleMap = styleMap || [];
            arrayMapSet(styleMap, item, mergeAttrs[++i]);
        }
    }
    tNode.classesMap = classMap;
    tNode.stylesMap = styleMap;
}
/**
 * Sanitizes or adds suffix to the value.
 *
 * If value is `null`/`undefined` no suffix is added
 * @param value
 * @param suffixOrSanitizer
 */
function normalizeAndApplySuffixOrSanitizer(value, suffixOrSanitizer) {
    if (value === null || value === undefined) {
        // do nothing
    }
    else if (typeof suffixOrSanitizer === 'function') {
        // sanitize the value.
        value = suffixOrSanitizer(value);
    }
    else if (typeof suffixOrSanitizer === 'string') {
        value = value + suffixOrSanitizer;
    }
    else if (typeof value === 'object') {
        value = stringify(unwrapSafeValue(value));
    }
    return value;
}
/**
 * Tests if the `TNode` has input shadow.
 *
 * An input shadow is when a directive steals (shadows) the input by using `@Input('style')` or
 * `@Input('class')` as input.
 *
 * @param tNode `TNode` which we would like to see if it has shadow.
 * @param isClassBased `true` if `class` (`false` if `style`)
 */
export function hasStylingInputShadow(tNode, isClassBased) {
    return (tNode.flags & (isClassBased ? 16 /* hasClassInput */ : 32 /* hasStyleInput */)) !== 0;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3R5bGluZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaW5zdHJ1Y3Rpb25zL3N0eWxpbmcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztFQU1FO0FBRUYsT0FBTyxFQUFZLGVBQWUsRUFBQyxNQUFNLDJCQUEyQixDQUFDO0FBQ3JFLE9BQU8sRUFBQywwQkFBMEIsRUFBRSxlQUFlLEVBQUMsTUFBTSxpQ0FBaUMsQ0FBQztBQUU1RixPQUFPLEVBQVcsV0FBVyxFQUFFLFdBQVcsRUFBQyxNQUFNLHdCQUF3QixDQUFDO0FBQzFFLE9BQU8sRUFBQyxhQUFhLEVBQUUsV0FBVyxFQUFFLGNBQWMsRUFBRSxVQUFVLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUN6RixPQUFPLEVBQUMsV0FBVyxFQUFDLE1BQU0sa0JBQWtCLENBQUM7QUFDN0MsT0FBTyxFQUFDLHNCQUFzQixFQUFFLFNBQVMsRUFBQyxNQUFNLHNCQUFzQixDQUFDO0FBQ3ZFLE9BQU8sRUFBQyxxQkFBcUIsRUFBQyxNQUFNLFdBQVcsQ0FBQztBQUNoRCxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sYUFBYSxDQUFDO0FBSTNDLE9BQU8sRUFBNkIsb0JBQW9CLEVBQUUsNkJBQTZCLEVBQUUsb0JBQW9CLEVBQUUsNkJBQTZCLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUMzSyxPQUFPLEVBQUMsYUFBYSxFQUFTLFFBQVEsRUFBUyxLQUFLLEVBQVEsTUFBTSxvQkFBb0IsQ0FBQztBQUN2RixPQUFPLEVBQUMsWUFBWSxFQUFDLE1BQU0sc0JBQXNCLENBQUM7QUFDbEQsT0FBTyxFQUFDLHdCQUF3QixFQUFFLFFBQVEsRUFBRSxnQkFBZ0IsRUFBRSxxQkFBcUIsRUFBRSx3QkFBd0IsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUMvSCxPQUFPLEVBQUMscUJBQXFCLEVBQUMsTUFBTSwr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TSxJQUFJLE9BQU8saUJBQWlCLEtBQUssVUFBVSxFQUFFO1FBQ2xELHNCQUFzQjtRQUN0QixLQUFLLEdBQUcsaUJBQWlCLENBQUMsS0FBSyxDQUFDLENBQUM7S0FDbEM7U0FBTSxJQUFJLE9BQU8saUJBQWlCLEtBQUssUUFBUSxFQUFFO1FBQ2hELEtBQUssR0FBRyxLQUFLLEdBQUcsaUJBQWlCLENBQUM7S0FDbkM7U0FBTSxJQUFJLE9BQU8sS0FBSyxLQUFLLFFBQVEsRUFBRTtRQUNwQyxLQUFLLEdBQUcsU0FBUyxDQUFDLGVBQWUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO0tBQzNDO0lBQ0QsT0FBTyxLQUFLLENBQUM7QUFDZixDQUFDO0FBR0Q7Ozs7Ozs7O0dBUUc7QUFDSCxNQUFNLFVBQVUscUJBQXFCLENBQUMsS0FBWSxFQUFFLFlBQXFCO0lBQ3ZFLE9BQU8sQ0FBQyxLQUFLLENBQUMsS0FBSyxHQUFHLENBQUMsWUFBWSxDQUFDLENBQUMsd0JBQTBCLENBQUMsdUJBQXlCLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUNwRyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4qIEBsaWNlbnNlXG4qIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuKlxuKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4qL1xuXG5pbXBvcnQge1NhZmVWYWx1ZSwgdW53cmFwU2FmZVZhbHVlfSBmcm9tICcuLi8uLi9zYW5pdGl6YXRpb24vYnlwYXNzJztcbmltcG9ydCB7c3R5bGVQcm9wTmVlZHNTYW5pdGl6YXRpb24sIMm1ybVzYW5pdGl6ZVN0eWxlfSBmcm9tICcuLi8uLi9zYW5pdGl6YXRpb24vc2FuaXRpemF0aW9uJztcbmltcG9ydCB7U3R5bGVTYW5pdGl6ZUZufSBmcm9tICcuLi8uLi9zYW5pdGl6YXRpb24vc3R5bGVfc2FuaXRpemVyJztcbmltcG9ydCB7QXJyYXlNYXAsIGFycmF5TWFwR2V0LCBhcnJheU1hcFNldH0gZnJvbSAnLi4vLi4vdXRpbC9hcnJheV91dGlscyc7XG5pbXBvcnQge2Fzc2VydERlZmluZWQsIGFzc2VydEVxdWFsLCBhc3NlcnRMZXNzVGhhbiwgdGhyb3dFcnJvcn0gZnJvbSAnLi4vLi4vdXRpbC9hc3NlcnQnO1xuaW1wb3J0IHtFTVBUWV9BUlJBWX0gZnJvbSAnLi4vLi4vdXRpbC9lbXB0eSc7XG5pbXBvcnQge2NvbmNhdFN0cmluZ3NXaXRoU3BhY2UsIHN0cmluZ2lmeX0gZnJvbSAnLi4vLi4vdXRpbC9zdHJpbmdpZnknO1xuaW1wb3J0IHthc3NlcnRGaXJzdFVwZGF0ZVBhc3N9IGZyb20gJy4uL2Fzc2VydCc7XG5pbXBvcnQge2JpbmRpbmdVcGRhdGVkfSBmcm9tICcuLi9iaW5kaW5ncyc7XG5pbXBvcnQge0F0dHJpYnV0ZU1hcmtlciwgVEF0dHJpYnV0ZXMsIFROb2RlLCBUTm9kZUZsYWdzLCBUTm9kZVR5cGV9IGZyb20gJy4uL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge1JFbGVtZW50LCBSZW5kZXJlcjN9IGZyb20gJy4uL2ludGVyZmFjZXMvcmVuZGVyZXInO1xuaW1wb3J0IHtTYW5pdGl6ZXJGbn0gZnJvbSAnLi4vaW50ZXJmYWNlcy9zYW5pdGl6YXRpb24nO1xuaW1wb3J0IHtUU3R5bGluZ0tleSwgVFN0eWxpbmdSYW5nZSwgZ2V0VFN0eWxpbmdSYW5nZU5leHQsIGdldFRTdHlsaW5nUmFuZ2VOZXh0RHVwbGljYXRlLCBnZXRUU3R5bGluZ1JhbmdlUHJldiwgZ2V0VFN0eWxpbmdSYW5nZVByZXZEdXBsaWNhdGV9IGZyb20gJy4uL2ludGVyZmFjZXMvc3R5bGluZyc7XG5pbXBvcnQge0hFQURFUl9PRkZTRVQsIExWaWV3LCBSRU5ERVJFUiwgVERhdGEsIFRWSUVXLCBUVmlld30gZnJvbSAnLi4vaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7YXBwbHlTdHlsaW5nfSBmcm9tICcuLi9ub2RlX21hbmlwdWxhdGlvbic7XG5pbXBvcnQge2dldEN1cnJlbnRTdHlsZVNhbml0aXplciwgZ2V0TFZpZXcsIGdldFNlbGVjdGVkSW5kZXgsIGluY3JlbWVudEJpbmRpbmdJbmRleCwgc2V0Q3VycmVudFN0eWxlU2FuaXRpemVyfSBmcm9tICcuLi9zdGF0ZSc7XG5pbXBvcnQge2luc2VydFRTdHlsaW5nQmluZGluZ30gZnJvbSAnLi4vc3R5bGluZy9zdHlsZV9iaW5kaW5nX2xpc3QnO1xuaW1wb3J0IHtnZXRMYXN0UGFyc2VkS2V5LCBnZXRMYXN0UGFyc2VkVmFsdWUsIHBhcnNlQ2xhc3NOYW1lLCBwYXJzZUNsYXNzTmFtZU5leHQsIHBhcnNlU3R5bGUsIHBhcnNlU3R5bGVOZXh0fSBmcm9tICcuLi9zdHlsaW5nL3N0eWxpbmdfcGFyc2VyJztcbmltcG9ydCB7Tk9fQ0hBTkdFfSBmcm9tICcuLi90b2tlbnMnO1xuaW1wb3J0IHtnZXROYXRpdmVCeUluZGV4fSBmcm9tICcuLi91dGlsL3ZpZXdfdXRpbHMnO1xuaW1wb3J0IHtzZXREaXJlY3RpdmVJbnB1dHNXaGljaFNoYWRvd3NTdHlsaW5nfSBmcm9tICcuL3Byb3BlcnR5JztcblxuXG4vKipcbiAqIFNldHMgdGhlIGN1cnJlbnQgc3R5bGUgc2FuaXRpemVyIGZ1bmN0aW9uIHdoaWNoIHdpbGwgdGhlbiBiZSB1c2VkXG4gKiB3aXRoaW4gYWxsIGZvbGxvdy11cCBwcm9wIGFuZCBtYXAtYmFzZWQgc3R5bGUgYmluZGluZyBpbnN0cnVjdGlvbnNcbiAqIGZvciB0aGUgZ2l2ZW4gZWxlbWVudC5cbiAqXG4gKiBOb3RlIHRoYXQgb25jZSBzdHlsaW5nIGhhcyBiZWVuIGFwcGxpZWQgdG8gdGhlIGVsZW1lbnQgKGkuZS4gb25jZVxuICogYGFkdmFuY2UobilgIGlzIGV4ZWN1dGVkIG9yIHRoZSBob3N0QmluZGluZ3MvdGVtcGxhdGUgZnVuY3Rpb24gZXhpdHMpXG4gKiB0aGVuIHRoZSBhY3RpdmUgYHNhbml0aXplckZuYCB3aWxsIGJlIHNldCB0byBgbnVsbGAuIFRoaXMgbWVhbnMgdGhhdFxuICogb25jZSBzdHlsaW5nIGlzIGFwcGxpZWQgdG8gYW5vdGhlciBlbGVtZW50IHRoZW4gYSBhbm90aGVyIGNhbGwgdG9cbiAqIGBzdHlsZVNhbml0aXplcmAgd2lsbCBuZWVkIHRvIGJlIG1hZGUuXG4gKlxuICogQHBhcmFtIHNhbml0aXplckZuIFRoZSBzYW5pdGl6YXRpb24gZnVuY3Rpb24gdGhhdCB3aWxsIGJlIHVzZWQgdG9cbiAqICAgICAgIHByb2Nlc3Mgc3R5bGUgcHJvcC92YWx1ZSBlbnRyaWVzLlxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1c3R5bGVTYW5pdGl6ZXIoc2FuaXRpemVyOiBTdHlsZVNhbml0aXplRm4gfCBudWxsKTogdm9pZCB7XG4gIHNldEN1cnJlbnRTdHlsZVNhbml0aXplcihzYW5pdGl6ZXIpO1xufVxuXG4vKipcbiAqIFVwZGF0ZSBhIHN0eWxlIGJpbmRpbmcgb24gYW4gZWxlbWVudCB3aXRoIHRoZSBwcm92aWRlZCB2YWx1ZS5cbiAqXG4gKiBJZiB0aGUgc3R5bGUgdmFsdWUgaXMgZmFsc3kgdGhlbiBpdCB3aWxsIGJlIHJlbW92ZWQgZnJvbSB0aGUgZWxlbWVudFxuICogKG9yIGFzc2lnbmVkIGEgZGlmZmVyZW50IHZhbHVlIGRlcGVuZGluZyBpZiB0aGVyZSBhcmUgYW55IHN0eWxlcyBwbGFjZWRcbiAqIG9uIHRoZSBlbGVtZW50IHdpdGggYHN0eWxlTWFwYCBvciBhbnkgc3RhdGljIHN0eWxlcyB0aGF0IGFyZVxuICogcHJlc2VudCBmcm9tIHdoZW4gdGhlIGVsZW1lbnQgd2FzIGNyZWF0ZWQgd2l0aCBgc3R5bGluZ2ApLlxuICpcbiAqIE5vdGUgdGhhdCB0aGUgc3R5bGluZyBlbGVtZW50IGlzIHVwZGF0ZWQgYXMgcGFydCBvZiBgc3R5bGluZ0FwcGx5YC5cbiAqXG4gKiBAcGFyYW0gcHJvcCBBIHZhbGlkIENTUyBwcm9wZXJ0eS5cbiAqIEBwYXJhbSB2YWx1ZSBOZXcgdmFsdWUgdG8gd3JpdGUgKGBudWxsYCBvciBhbiBlbXB0eSBzdHJpbmcgdG8gcmVtb3ZlKS5cbiAqIEBwYXJhbSBzdWZmaXggT3B0aW9uYWwgc3VmZml4LiBVc2VkIHdpdGggc2NhbGFyIHZhbHVlcyB0byBhZGQgdW5pdCBzdWNoIGFzIGBweGAuXG4gKiAgICAgICAgTm90ZSB0aGF0IHdoZW4gYSBzdWZmaXggaXMgcHJvdmlkZWQgdGhlbiB0aGUgdW5kZXJseWluZyBzYW5pdGl6ZXIgd2lsbFxuICogICAgICAgIGJlIGlnbm9yZWQuXG4gKlxuICogTm90ZSB0aGF0IHRoaXMgd2lsbCBhcHBseSB0aGUgcHJvdmlkZWQgc3R5bGUgdmFsdWUgdG8gdGhlIGhvc3QgZWxlbWVudCBpZiB0aGlzIGZ1bmN0aW9uIGlzIGNhbGxlZFxuICogd2l0aGluIGEgaG9zdCBiaW5kaW5nIGZ1bmN0aW9uLlxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1c3R5bGVQcm9wKFxuICAgIHByb3A6IHN0cmluZywgdmFsdWU6IHN0cmluZyB8IG51bWJlciB8IFNhZmVWYWx1ZSB8IHVuZGVmaW5lZCB8IG51bGwsXG4gICAgc3VmZml4Pzogc3RyaW5nIHwgbnVsbCk6IHR5cGVvZiDJtcm1c3R5bGVQcm9wIHtcbiAgY2hlY2tTdHlsaW5nUHJvcGVydHkocHJvcCwgdmFsdWUsIHN1ZmZpeCwgZmFsc2UpO1xuICByZXR1cm4gybXJtXN0eWxlUHJvcDtcbn1cblxuLyoqXG4gKiBVcGRhdGUgYSBjbGFzcyBiaW5kaW5nIG9uIGFuIGVsZW1lbnQgd2l0aCB0aGUgcHJvdmlkZWQgdmFsdWUuXG4gKlxuICogVGhpcyBpbnN0cnVjdGlvbiBpcyBtZWFudCB0byBoYW5kbGUgdGhlIGBbY2xhc3MuZm9vXT1cImV4cFwiYCBjYXNlIGFuZCxcbiAqIHRoZXJlZm9yZSwgdGhlIGNsYXNzIGJpbmRpbmcgaXRzZWxmIG11c3QgYWxyZWFkeSBiZSBhbGxvY2F0ZWQgdXNpbmdcbiAqIGBzdHlsaW5nYCB3aXRoaW4gdGhlIGNyZWF0aW9uIGJsb2NrLlxuICpcbiAqIEBwYXJhbSBwcm9wIEEgdmFsaWQgQ1NTIGNsYXNzIChvbmx5IG9uZSkuXG4gKiBAcGFyYW0gdmFsdWUgQSB0cnVlL2ZhbHNlIHZhbHVlIHdoaWNoIHdpbGwgdHVybiB0aGUgY2xhc3Mgb24gb3Igb2ZmLlxuICpcbiAqIE5vdGUgdGhhdCB0aGlzIHdpbGwgYXBwbHkgdGhlIHByb3ZpZGVkIGNsYXNzIHZhbHVlIHRvIHRoZSBob3N0IGVsZW1lbnQgaWYgdGhpcyBmdW5jdGlvblxuICogaXMgY2FsbGVkIHdpdGhpbiBhIGhvc3QgYmluZGluZyBmdW5jdGlvbi5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWNsYXNzUHJvcChcbiAgICBjbGFzc05hbWU6IHN0cmluZywgdmFsdWU6IGJvb2xlYW4gfCB1bmRlZmluZWQgfCBudWxsKTogdHlwZW9mIMm1ybVjbGFzc1Byb3Age1xuICBjaGVja1N0eWxpbmdQcm9wZXJ0eShjbGFzc05hbWUsIHZhbHVlLCBudWxsLCB0cnVlKTtcbiAgcmV0dXJuIMm1ybVjbGFzc1Byb3A7XG59XG5cblxuLyoqXG4gKiBVcGRhdGUgc3R5bGUgYmluZGluZ3MgdXNpbmcgYW4gb2JqZWN0IGxpdGVyYWwgb24gYW4gZWxlbWVudC5cbiAqXG4gKiBUaGlzIGluc3RydWN0aW9uIGlzIG1lYW50IHRvIGFwcGx5IHN0eWxpbmcgdmlhIHRoZSBgW3N0eWxlXT1cImV4cFwiYCB0ZW1wbGF0ZSBiaW5kaW5ncy5cbiAqIFdoZW4gc3R5bGVzIGFyZSBhcHBsaWVkIHRvIHRoZSBlbGVtZW50IHRoZXkgd2lsbCB0aGVuIGJlIHVwZGF0ZWQgd2l0aCByZXNwZWN0IHRvXG4gKiBhbnkgc3R5bGVzL2NsYXNzZXMgc2V0IHZpYSBgc3R5bGVQcm9wYC4gSWYgYW55IHN0eWxlcyBhcmUgc2V0IHRvIGZhbHN5XG4gKiB0aGVuIHRoZXkgd2lsbCBiZSByZW1vdmVkIGZyb20gdGhlIGVsZW1lbnQuXG4gKlxuICogTm90ZSB0aGF0IHRoZSBzdHlsaW5nIGluc3RydWN0aW9uIHdpbGwgbm90IGJlIGFwcGxpZWQgdW50aWwgYHN0eWxpbmdBcHBseWAgaXMgY2FsbGVkLlxuICpcbiAqIEBwYXJhbSBzdHlsZXMgQSBrZXkvdmFsdWUgc3R5bGUgbWFwIG9mIHRoZSBzdHlsZXMgdGhhdCB3aWxsIGJlIGFwcGxpZWQgdG8gdGhlIGdpdmVuIGVsZW1lbnQuXG4gKiAgICAgICAgQW55IG1pc3Npbmcgc3R5bGVzICh0aGF0IGhhdmUgYWxyZWFkeSBiZWVuIGFwcGxpZWQgdG8gdGhlIGVsZW1lbnQgYmVmb3JlaGFuZCkgd2lsbCBiZVxuICogICAgICAgIHJlbW92ZWQgKHVuc2V0KSBmcm9tIHRoZSBlbGVtZW50J3Mgc3R5bGluZy5cbiAqXG4gKiBOb3RlIHRoYXQgdGhpcyB3aWxsIGFwcGx5IHRoZSBwcm92aWRlZCBzdHlsZU1hcCB2YWx1ZSB0byB0aGUgaG9zdCBlbGVtZW50IGlmIHRoaXMgZnVuY3Rpb25cbiAqIGlzIGNhbGxlZCB3aXRoaW4gYSBob3N0IGJpbmRpbmcuXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVzdHlsZU1hcChcbiAgICBzdHlsZXM6IHtbc3R5bGVOYW1lOiBzdHJpbmddOiBhbnl9IHwgTWFwPHN0cmluZywgc3RyaW5nfG51bWJlcnxudWxsfHVuZGVmaW5lZD58IHN0cmluZyB8XG4gICAgdW5kZWZpbmVkIHwgbnVsbCk6IHZvaWQge1xuICBjaGVja1N0eWxpbmdNYXAoc3R5bGVBcnJheU1hcFNldCwgc3R5bGVTdHJpbmdQYXJzZXIsIHN0eWxlcywgZmFsc2UpO1xufVxuXG5cbi8qKlxuICogUGFyc2UgdGV4dCBhcyBzdHlsZSBhbmQgYWRkIHZhbHVlcyB0byBBcnJheU1hcC5cbiAqXG4gKiBUaGlzIGNvZGUgaXMgcHVsbGVkIG91dCB0byBhIHNlcGFyYXRlIGZ1bmN0aW9uIHNvIHRoYXQgaXQgY2FuIGJlIHRyZWUgc2hha2VuIGF3YXkgaWYgaXQgaXMgbm90XG4gKiBuZWVkZWQuIEl0IGlzIG9ubHkgcmVmZXJlbmNlIGZyb20gYMm1ybVzdHlsZU1hcGAuXG4gKlxuICogQHBhcmFtIGFycmF5TWFwIEFycmF5TWFwIHRvIGFkZCBwYXJzZWQgdmFsdWVzIHRvLlxuICogQHBhcmFtIHRleHQgdGV4dCB0byBwYXJzZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHN0eWxlU3RyaW5nUGFyc2VyKGFycmF5TWFwOiBBcnJheU1hcDxhbnk+LCB0ZXh0OiBzdHJpbmcpOiB2b2lkIHtcbiAgZm9yIChsZXQgaSA9IHBhcnNlU3R5bGUodGV4dCk7IGkgPj0gMDsgaSA9IHBhcnNlU3R5bGVOZXh0KHRleHQsIGkpKSB7XG4gICAgc3R5bGVBcnJheU1hcFNldChhcnJheU1hcCwgZ2V0TGFzdFBhcnNlZEtleSh0ZXh0KSwgZ2V0TGFzdFBhcnNlZFZhbHVlKHRleHQpKTtcbiAgfVxufVxuXG5cbi8qKlxuICogVXBkYXRlIGNsYXNzIGJpbmRpbmdzIHVzaW5nIGFuIG9iamVjdCBsaXRlcmFsIG9yIGNsYXNzLXN0cmluZyBvbiBhbiBlbGVtZW50LlxuICpcbiAqIFRoaXMgaW5zdHJ1Y3Rpb24gaXMgbWVhbnQgdG8gYXBwbHkgc3R5bGluZyB2aWEgdGhlIGBbY2xhc3NdPVwiZXhwXCJgIHRlbXBsYXRlIGJpbmRpbmdzLlxuICogV2hlbiBjbGFzc2VzIGFyZSBhcHBsaWVkIHRvIHRoZSBlbGVtZW50IHRoZXkgd2lsbCB0aGVuIGJlIHVwZGF0ZWQgd2l0aFxuICogcmVzcGVjdCB0byBhbnkgc3R5bGVzL2NsYXNzZXMgc2V0IHZpYSBgY2xhc3NQcm9wYC4gSWYgYW55XG4gKiBjbGFzc2VzIGFyZSBzZXQgdG8gZmFsc3kgdGhlbiB0aGV5IHdpbGwgYmUgcmVtb3ZlZCBmcm9tIHRoZSBlbGVtZW50LlxuICpcbiAqIE5vdGUgdGhhdCB0aGUgc3R5bGluZyBpbnN0cnVjdGlvbiB3aWxsIG5vdCBiZSBhcHBsaWVkIHVudGlsIGBzdHlsaW5nQXBwbHlgIGlzIGNhbGxlZC5cbiAqIE5vdGUgdGhhdCB0aGlzIHdpbGwgdGhlIHByb3ZpZGVkIGNsYXNzTWFwIHZhbHVlIHRvIHRoZSBob3N0IGVsZW1lbnQgaWYgdGhpcyBmdW5jdGlvbiBpcyBjYWxsZWRcbiAqIHdpdGhpbiBhIGhvc3QgYmluZGluZy5cbiAqXG4gKiBAcGFyYW0gY2xhc3NlcyBBIGtleS92YWx1ZSBtYXAgb3Igc3RyaW5nIG9mIENTUyBjbGFzc2VzIHRoYXQgd2lsbCBiZSBhZGRlZCB0byB0aGVcbiAqICAgICAgICBnaXZlbiBlbGVtZW50LiBBbnkgbWlzc2luZyBjbGFzc2VzICh0aGF0IGhhdmUgYWxyZWFkeSBiZWVuIGFwcGxpZWQgdG8gdGhlIGVsZW1lbnRcbiAqICAgICAgICBiZWZvcmVoYW5kKSB3aWxsIGJlIHJlbW92ZWQgKHVuc2V0KSBmcm9tIHRoZSBlbGVtZW50J3MgbGlzdCBvZiBDU1MgY2xhc3Nlcy5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWNsYXNzTWFwKFxuICAgIGNsYXNzZXM6IHtbY2xhc3NOYW1lOiBzdHJpbmddOiBib29sZWFuIHwgdW5kZWZpbmVkIHwgbnVsbH0gfFxuICAgIE1hcDxzdHJpbmcsIGJvb2xlYW58dW5kZWZpbmVkfG51bGw+fCBTZXQ8c3RyaW5nPnwgc3RyaW5nW10gfCBzdHJpbmcgfCB1bmRlZmluZWQgfCBudWxsKTogdm9pZCB7XG4gIGNoZWNrU3R5bGluZ01hcChhcnJheU1hcFNldCwgY2xhc3NTdHJpbmdQYXJzZXIsIGNsYXNzZXMsIHRydWUpO1xufVxuXG4vKipcbiAqIFBhcnNlIHRleHQgYXMgY2xhc3MgYW5kIGFkZCB2YWx1ZXMgdG8gQXJyYXlNYXAuXG4gKlxuICogVGhpcyBjb2RlIGlzIHB1bGxlZCBvdXQgdG8gYSBzZXBhcmF0ZSBmdW5jdGlvbiBzbyB0aGF0IGl0IGNhbiBiZSB0cmVlIHNoYWtlbiBhd2F5IGlmIGl0IGlzIG5vdFxuICogbmVlZGVkLiBJdCBpcyBvbmx5IHJlZmVyZW5jZSBmcm9tIGDJtcm1Y2xhc3NNYXBgLlxuICpcbiAqIEBwYXJhbSBhcnJheU1hcCBBcnJheU1hcCB0byBhZGQgcGFyc2VkIHZhbHVlcyB0by5cbiAqIEBwYXJhbSB0ZXh0IHRleHQgdG8gcGFyc2UuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjbGFzc1N0cmluZ1BhcnNlcihhcnJheU1hcDogQXJyYXlNYXA8YW55PiwgdGV4dDogc3RyaW5nKTogdm9pZCB7XG4gIGZvciAobGV0IGkgPSBwYXJzZUNsYXNzTmFtZSh0ZXh0KTsgaSA+PSAwOyBpID0gcGFyc2VDbGFzc05hbWVOZXh0KHRleHQsIGkpKSB7XG4gICAgYXJyYXlNYXBTZXQoYXJyYXlNYXAsIGdldExhc3RQYXJzZWRLZXkodGV4dCksIHRydWUpO1xuICB9XG59XG5cbi8qKlxuICogQ29tbW9uIGNvZGUgYmV0d2VlbiBgybXJtWNsYXNzUHJvcGAgYW5kIGDJtcm1c3R5bGVQcm9wYC5cbiAqXG4gKiBAcGFyYW0gcHJvcCBwcm9wZXJ0eSBuYW1lLlxuICogQHBhcmFtIHZhbHVlIGJpbmRpbmcgdmFsdWUuXG4gKiBAcGFyYW0gc3VmZml4T3JTYW5pdGl6ZXIgc3VmZml4IG9yIHNhbml0aXphdGlvbiBmdW5jdGlvblxuICogQHBhcmFtIGlzQ2xhc3NCYXNlZCBgdHJ1ZWAgaWYgYGNsYXNzYCBjaGFuZ2UgKGBmYWxzZWAgaWYgYHN0eWxlYClcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNoZWNrU3R5bGluZ1Byb3BlcnR5KFxuICAgIHByb3A6IHN0cmluZywgdmFsdWU6IGFueSB8IE5PX0NIQU5HRSxcbiAgICBzdWZmaXhPclNhbml0aXplcjogU2FuaXRpemVyRm4gfCBzdHJpbmcgfCB1bmRlZmluZWQgfCBudWxsLCBpc0NsYXNzQmFzZWQ6IGJvb2xlYW4pOiB2b2lkIHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgLy8gU3R5bGluZyBpbnN0cnVjdGlvbnMgdXNlIDIgc2xvdHMgcGVyIGJpbmRpbmcuXG4gIC8vIDEuIG9uZSBmb3IgdGhlIHZhbHVlIC8gVFN0eWxpbmdLZXlcbiAgLy8gMi4gb25lIGZvciB0aGUgaW50ZXJtaXR0ZW50LXZhbHVlIC8gVFN0eWxpbmdSYW5nZVxuICBjb25zdCBiaW5kaW5nSW5kZXggPSBpbmNyZW1lbnRCaW5kaW5nSW5kZXgoMik7XG4gIGlmICh0Vmlldy5maXJzdFVwZGF0ZVBhc3MpIHtcbiAgICBzdHlsaW5nUHJvcGVydHlGaXJzdFVwZGF0ZVBhc3ModFZpZXcsIHByb3AsIGJpbmRpbmdJbmRleCwgaXNDbGFzc0Jhc2VkKTtcbiAgfVxuICBpZiAodmFsdWUgIT09IE5PX0NIQU5HRSAmJiBiaW5kaW5nVXBkYXRlZChsVmlldywgYmluZGluZ0luZGV4LCB2YWx1ZSkpIHtcbiAgICAvLyBUaGlzIGlzIGEgd29yayBhcm91bmQuIE9uY2UgUFIjMzQ0ODAgbGFuZHMgdGhlIHNhbml0aXplciBpcyBwYXNzZWQgZXhwbGljaXRseSBhbmQgdGhpcyBsaW5lXG4gICAgLy8gY2FuIGJlIHJlbW92ZWQuXG4gICAgbGV0IHN0eWxlU2FuaXRpemVyOiBTdHlsZVNhbml0aXplRm58bnVsbDtcbiAgICBpZiAoc3VmZml4T3JTYW5pdGl6ZXIgPT0gbnVsbCkge1xuICAgICAgaWYgKHN0eWxlU2FuaXRpemVyID0gZ2V0Q3VycmVudFN0eWxlU2FuaXRpemVyKCkpIHtcbiAgICAgICAgc3VmZml4T3JTYW5pdGl6ZXIgPSBzdHlsZVNhbml0aXplciBhcyBhbnk7XG4gICAgICB9XG4gICAgfVxuICAgIGNvbnN0IHROb2RlID0gdFZpZXcuZGF0YVtnZXRTZWxlY3RlZEluZGV4KCkgKyBIRUFERVJfT0ZGU0VUXSBhcyBUTm9kZTtcbiAgICB1cGRhdGVTdHlsaW5nKFxuICAgICAgICB0VmlldywgdE5vZGUsIGxWaWV3LCBsVmlld1tSRU5ERVJFUl0sIHByb3AsXG4gICAgICAgIGxWaWV3W2JpbmRpbmdJbmRleCArIDFdID0gbm9ybWFsaXplQW5kQXBwbHlTdWZmaXhPclNhbml0aXplcih2YWx1ZSwgc3VmZml4T3JTYW5pdGl6ZXIpLFxuICAgICAgICBpc0NsYXNzQmFzZWQsIGJpbmRpbmdJbmRleCk7XG4gIH1cbn1cblxuLyoqXG4qIENvbW1vbiBjb2RlIGJldHdlZW4gYMm1ybVjbGFzc01hcGAgYW5kIGDJtcm1c3R5bGVNYXBgLlxuKlxuKiBAcGFyYW0gdFN0eWxpbmdNYXBLZXkgU2VlIGBTVFlMRV9NQVBfU1RZTElOR19LRVlgIGFuZCBgQ0xBU1NfTUFQX1NUWUxJTkdfS0VZYC5cbiogQHBhcmFtIHZhbHVlIGJpbmRpbmcgdmFsdWUuXG4qIEBwYXJhbSBpc0NsYXNzQmFzZWQgYHRydWVgIGlmIGBjbGFzc2AgY2hhbmdlIChgZmFsc2VgIGlmIGBzdHlsZWApXG4qL1xuZXhwb3J0IGZ1bmN0aW9uIGNoZWNrU3R5bGluZ01hcChcbiAgICBhcnJheU1hcFNldDogKGFycmF5TWFwOiBBcnJheU1hcDxhbnk+LCBrZXk6IHN0cmluZywgdmFsdWU6IGFueSkgPT4gdm9pZCxcbiAgICBzdHJpbmdQYXJzZXI6IChzdHlsZUFycmF5TWFwOiBBcnJheU1hcDxhbnk+LCB0ZXh0OiBzdHJpbmcpID0+IHZvaWQsIHZhbHVlOiBhbnl8Tk9fQ0hBTkdFLFxuICAgIGlzQ2xhc3NCYXNlZDogYm9vbGVhbik6IHZvaWQge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IHRWaWV3ID0gbFZpZXdbVFZJRVddO1xuICBjb25zdCBiaW5kaW5nSW5kZXggPSBpbmNyZW1lbnRCaW5kaW5nSW5kZXgoMik7XG4gIGlmICh0Vmlldy5maXJzdFVwZGF0ZVBhc3MpIHtcbiAgICBzdHlsaW5nUHJvcGVydHlGaXJzdFVwZGF0ZVBhc3ModFZpZXcsIG51bGwsIGJpbmRpbmdJbmRleCwgaXNDbGFzc0Jhc2VkKTtcbiAgfVxuICBpZiAodmFsdWUgIT09IE5PX0NIQU5HRSAmJiBiaW5kaW5nVXBkYXRlZChsVmlldywgYmluZGluZ0luZGV4LCB2YWx1ZSkpIHtcbiAgICAvLyBgZ2V0U2VsZWN0ZWRJbmRleCgpYCBzaG91bGQgYmUgaGVyZSAocmF0aGVyIHRoYW4gaW4gaW5zdHJ1Y3Rpb24pIHNvIHRoYXQgaXQgaXMgZ3VhcmRlZCBieSB0aGVcbiAgICAvLyBpZiBzbyBhcyBub3QgdG8gcmVhZCB1bm5lY2Vzc2FyaWx5LlxuICAgIGNvbnN0IHROb2RlID0gdFZpZXcuZGF0YVtnZXRTZWxlY3RlZEluZGV4KCkgKyBIRUFERVJfT0ZGU0VUXSBhcyBUTm9kZTtcbiAgICBpZiAoaGFzU3R5bGluZ0lucHV0U2hhZG93KHROb2RlLCBpc0NsYXNzQmFzZWQpICYmICFpc0luSG9zdEJpbmRpbmdzKHRWaWV3LCBiaW5kaW5nSW5kZXgpKSB7XG4gICAgICAvLyBWRSBkb2VzIG5vdCBjb25jYXRlbmF0ZSB0aGUgc3RhdGljIHBvcnRpb24gbGlrZSB3ZSBhcmUgZG9pbmcgaGVyZS5cbiAgICAgIC8vIEluc3RlYWQgVkUganVzdCBpZ25vcmVzIHRoZSBzdGF0aWMgY29tcGxldGVseSBpZiBkeW5hbWljIGJpbmRpbmcgaXMgcHJlc2VudC5cbiAgICAgIC8vIEJlY2F1c2Ugb2YgbG9jYWxpdHkgd2UgaGF2ZSBhbHJlYWR5IHNldCB0aGUgc3RhdGljIHBvcnRpb24gYmVjYXVzZSB3ZSBkb24ndCBrbm93IGlmIHRoZXJlXG4gICAgICAvLyBpcyBhIGR5bmFtaWMgcG9ydGlvbiB1bnRpbCBsYXRlci4gSWYgd2Ugd291bGQgaWdub3JlIHRoZSBzdGF0aWMgcG9ydGlvbiBpdCB3b3VsZCBsb29rIGxpa2VcbiAgICAgIC8vIHRoYSB0aGUgYmluZGluZyBoYXMgcmVtb3ZlZCBpdC4gVGhpcyB3b3VsZCBjb25mdXNlIGBbbmdTdHlsZV1gL2BbbmdDbGFzc11gIHRvIGRvIHRoZSB3cm9uZ1xuICAgICAgLy8gdGhpbmcgYXMgaXQgd291bGQgdGhpbmsgdGhhIHRoZSBzdGF0aWMgcG9ydGlvbiB3YXMgcmVtb3ZlZC4gRm9yIHRoaXMgcmVhc29uIHdlXG4gICAgICAvLyBjb25jYXRlbmF0ZSBpdCBzbyB0aGF0IGBbbmdTdHlsZV1gL2BbbmdDbGFzc11gICBjYW4gY29udGludWUgdG8gd29yayBvbiBjaGFuZ2VkLlxuICAgICAgbGV0IHN0YXRpY1ByZWZpeCA9IGlzQ2xhc3NCYXNlZCA/IHROb2RlLmNsYXNzZXMgOiB0Tm9kZS5zdHlsZXM7XG4gICAgICBuZ0Rldk1vZGUgJiYgaXNDbGFzc0Jhc2VkID09PSBmYWxzZSAmJiBzdGF0aWNQcmVmaXggIT09IG51bGwgJiZcbiAgICAgICAgICBhc3NlcnRFcXVhbChcbiAgICAgICAgICAgICAgc3RhdGljUHJlZml4LmVuZHNXaXRoKCc7JyksIHRydWUsICdFeHBlY3Rpbmcgc3RhdGljIHBvcnRpb24gdG8gZW5kIHdpdGggXFwnO1xcJycpO1xuICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgdmFsdWUgPSBjb25jYXRTdHJpbmdzV2l0aFNwYWNlKHN0YXRpY1ByZWZpeCwgdmFsdWUgYXMgc3RyaW5nKTtcbiAgICAgIH1cbiAgICAgIC8vIEdpdmVuIGA8ZGl2IFtzdHlsZV0gbXktZGlyPmAgc3VjaCB0aGF0IGBteS1kaXJgIGhhcyBgQElucHV0KCdzdHlsZScpYC5cbiAgICAgIC8vIFRoaXMgdGFrZXMgb3ZlciB0aGUgYFtzdHlsZV1gIGJpbmRpbmcuIChTYW1lIGZvciBgW2NsYXNzXWApXG4gICAgICBzZXREaXJlY3RpdmVJbnB1dHNXaGljaFNoYWRvd3NTdHlsaW5nKHROb2RlLCBsVmlldywgdmFsdWUsIGlzQ2xhc3NCYXNlZCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHVwZGF0ZVN0eWxpbmdNYXAoXG4gICAgICAgICAgdFZpZXcsIHROb2RlLCBsVmlldywgbFZpZXdbUkVOREVSRVJdLCBsVmlld1tiaW5kaW5nSW5kZXggKyAxXSxcbiAgICAgICAgICBsVmlld1tiaW5kaW5nSW5kZXggKyAxXSA9IHRvU3R5bGluZ0FycmF5TWFwKGFycmF5TWFwU2V0LCBzdHJpbmdQYXJzZXIsIHZhbHVlKSxcbiAgICAgICAgICBpc0NsYXNzQmFzZWQsIGJpbmRpbmdJbmRleCk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogRGV0ZXJtaW5lcyB3aGVuIHRoZSBiaW5kaW5nIGlzIGluIGBob3N0QmluZGluZ3NgIHNlY3Rpb25cbiAqXG4gKiBAcGFyYW0gdFZpZXcgQ3VycmVudCBgVFZpZXdgXG4gKiBAcGFyYW0gYmluZGluZ0luZGV4IGluZGV4IG9mIGJpbmRpbmcgd2hpY2ggd2Ugd291bGQgbGlrZSBpZiBpdCBpcyBpbiBgaG9zdEJpbmRpbmdzYFxuICovXG5mdW5jdGlvbiBpc0luSG9zdEJpbmRpbmdzKHRWaWV3OiBUVmlldywgYmluZGluZ0luZGV4OiBudW1iZXIpOiBib29sZWFuIHtcbiAgLy8gQWxsIGhvc3QgYmluZGluZ3MgYXJlIHBsYWNlZCBhZnRlciB0aGUgZXhwYW5kbyBzZWN0aW9uLlxuICByZXR1cm4gYmluZGluZ0luZGV4ID49IHRWaWV3LmV4cGFuZG9TdGFydEluZGV4O1xufVxuXG4vKipcbiogQ29sbGVjdHMgdGhlIG5lY2Vzc2FyeSBpbmZvcm1hdGlvbiB0byBpbnNlcnQgdGhlIGJpbmRpbmcgaW50byBhIGxpbmtlZCBsaXN0IG9mIHN0eWxlIGJpbmRpbmdzXG4qIHVzaW5nIGBpbnNlcnRUU3R5bGluZ0JpbmRpbmdgLlxuKlxuKiBAcGFyYW0gdFZpZXcgYFRWaWV3YCB3aGVyZSB0aGUgYmluZGluZyBsaW5rZWQgbGlzdCB3aWxsIGJlIHN0b3JlZC5cbiogQHBhcmFtIHByb3AgUHJvcGVydHkva2V5IG9mIHRoZSBiaW5kaW5nLlxuKiBAcGFyYW0gc3VmZml4IE9wdGlvbmFsIHN1ZmZpeCBvciBTYW5pdGl6YXRpb24gZnVuY3Rpb24uXG4qIEBwYXJhbSBiaW5kaW5nSW5kZXggSW5kZXggb2YgYmluZGluZyBhc3NvY2lhdGVkIHdpdGggdGhlIGBwcm9wYFxuKiBAcGFyYW0gaXNDbGFzc0Jhc2VkIGB0cnVlYCBpZiBgY2xhc3NgIGNoYW5nZSAoYGZhbHNlYCBpZiBgc3R5bGVgKVxuKi9cbmZ1bmN0aW9uIHN0eWxpbmdQcm9wZXJ0eUZpcnN0VXBkYXRlUGFzcyhcbiAgICB0VmlldzogVFZpZXcsIHRTdHlsaW5nS2V5OiBUU3R5bGluZ0tleSwgYmluZGluZ0luZGV4OiBudW1iZXIsIGlzQ2xhc3NCYXNlZDogYm9vbGVhbik6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Rmlyc3RVcGRhdGVQYXNzKHRWaWV3KTtcbiAgY29uc3QgdERhdGEgPSB0Vmlldy5kYXRhO1xuICBpZiAodERhdGFbYmluZGluZ0luZGV4ICsgMV0gPT09IG51bGwpIHtcbiAgICAvLyBUaGUgYWJvdmUgY2hlY2sgaXMgbmVjZXNzYXJ5IGJlY2F1c2Ugd2UgZG9uJ3QgY2xlYXIgZmlyc3QgdXBkYXRlIHBhc3MgdW50aWwgZmlyc3Qgc3VjY2Vzc2Z1bFxuICAgIC8vIChubyBleGNlcHRpb24pIHRlbXBsYXRlIGV4ZWN1dGlvbi4gVGhpcyBwcmV2ZW50cyB0aGUgc3R5bGluZyBpbnN0cnVjdGlvbiBmcm9tIGRvdWJsZSBhZGRpbmdcbiAgICAvLyBpdHNlbGYgdG8gdGhlIGxpc3QuXG4gICAgLy8gYGdldFNlbGVjdGVkSW5kZXgoKWAgc2hvdWxkIGJlIGhlcmUgKHJhdGhlciB0aGFuIGluIGluc3RydWN0aW9uKSBzbyB0aGF0IGl0IGlzIGd1YXJkZWQgYnkgdGhlXG4gICAgLy8gaWYgc28gYXMgbm90IHRvIHJlYWQgdW5uZWNlc3NhcmlseS5cbiAgICBjb25zdCB0Tm9kZSA9IHREYXRhW2dldFNlbGVjdGVkSW5kZXgoKSArIEhFQURFUl9PRkZTRVRdIGFzIFROb2RlO1xuICAgIGNvbnN0IGlzSG9zdEJpbmRpbmdzID0gaXNJbkhvc3RCaW5kaW5ncyh0VmlldywgYmluZGluZ0luZGV4KTtcbiAgICBpZiAoaGFzU3R5bGluZ0lucHV0U2hhZG93KHROb2RlLCBpc0NsYXNzQmFzZWQpICYmIHRTdHlsaW5nS2V5ID09PSBudWxsICYmICFpc0hvc3RCaW5kaW5ncykge1xuICAgICAgLy8gYHRTdHlsaW5nS2V5ID09PSBudWxsYCBpbXBsaWVzIHRoYXQgd2UgYXJlIGVpdGhlciBgW3N0eWxlXWAgb3IgYFtjbGFzc11gIGJpbmRpbmcuXG4gICAgICAvLyBJZiB0aGVyZSBpcyBhIGRpcmVjdGl2ZSB3aGljaCB1c2VzIGBASW5wdXQoJ3N0eWxlJylgIG9yIGBASW5wdXQoJ2NsYXNzJylgIHRoYW5cbiAgICAgIC8vIHdlIG5lZWQgdG8gbmV1dHJhbGl6ZSB0aGlzIGJpbmRpbmcgc2luY2UgdGhhdCBkaXJlY3RpdmUgaXMgc2hhZG93aW5nIGl0LlxuICAgICAgLy8gV2UgdHVybiB0aGlzIGludG8gYSBub29wIGJ5IHNldHRpbmcgdGhlIGtleSB0byBgZmFsc2VgXG4gICAgICB0U3R5bGluZ0tleSA9IGZhbHNlO1xuICAgIH1cbiAgICBpbnNlcnRUU3R5bGluZ0JpbmRpbmcodERhdGEsIHROb2RlLCB0U3R5bGluZ0tleSwgYmluZGluZ0luZGV4LCBpc0hvc3RCaW5kaW5ncywgaXNDbGFzc0Jhc2VkKTtcbiAgfVxufVxuXG4vKipcbiAqIENvbnZlcnQgdXNlciBpbnB1dCB0byBgQXJyYXlNYXBgLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gdGFrZXMgdXNlciBpbnB1dCB3aGljaCBjb3VsZCBiZSBgc3RyaW5nYCwgT2JqZWN0IGxpdGVyYWwsIG9yIGl0ZXJhYmxlIGFuZCBjb252ZXJ0c1xuICogaXQgaW50byBhIGNvbnNpc3RlbnQgcmVwcmVzZW50YXRpb24uIFRoZSBvdXRwdXQgb2YgdGhpcyBpcyBgQXJyYXlNYXBgICh3aGljaCBpcyBhbiBhcnJheSB3aGVyZVxuICogZXZlbiBpbmRleGVzIGNvbnRhaW4ga2V5cyBhbmQgb2RkIGluZGV4ZXMgY29udGFpbiB2YWx1ZXMgZm9yIHRob3NlIGtleXMpLlxuICpcbiAqIFRoZSBhZHZhbnRhZ2Ugb2YgY29udmVydGluZyB0byBgQXJyYXlNYXBgIGlzIHRoYXQgd2UgY2FuIHBlcmZvcm0gZGlmZiBpbiBhIGlucHV0IGluZGVwZW5kZW50IHdheS5cbiAqIChpZSB3ZSBjYW4gY29tcGFyZSBgZm9vIGJhcmAgdG8gYFsnYmFyJywgJ2JheiddIGFuZCBkZXRlcm1pbmUgYSBzZXQgb2YgY2hhbmdlcyB3aGljaCBuZWVkIHRvIGJlXG4gKiBhcHBsaWVkKVxuICpcbiAqIFRoZSBmYWN0IHRoYXQgYEFycmF5TWFwYCBpcyBzb3J0ZWQgaXMgdmVyeSBpbXBvcnRhbnQgYmVjYXVzZSBpdCBhbGxvd3MgdXMgdG8gY29tcHV0ZSB0aGVcbiAqIGRpZmZlcmVuY2UgaW4gbGluZWFyIGZhc2hpb24gd2l0aG91dCB0aGUgbmVlZCB0byBhbGxvY2F0ZSBhbnkgYWRkaXRpb25hbCBkYXRhLlxuICpcbiAqIEZvciBleGFtcGxlIGlmIHdlIGtlcHQgdGhpcyBhcyBhIGBNYXBgIHdlIHdvdWxkIGhhdmUgdG8gaXRlcmF0ZSBvdmVyIHByZXZpb3VzIGBNYXBgIHRvIGRldGVybWluZVxuICogd2hpY2ggdmFsdWVzIG5lZWQgdG8gYmUgZGVsZXRlLCBvdmVyIHRoZSBuZXcgYE1hcGAgdG8gZGV0ZXJtaW5lIGFkZGl0aW9ucywgYW5kIHdlIHdvdWxkIGhhdmUgdG9cbiAqIGtlZXAgYWRkaXRpb25hbCBgTWFwYCB0byBrZWVwIHRyYWNrIG9mIGR1cGxpY2F0ZXMgb3IgaXRlbXMgd2hpY2ggaGF2ZSBub3QgeWV0IGJlZW4gdmlzaXRlZC5cbiAqXG4gKiBAcGFyYW0gc3RyaW5nUGFyc2VyIFRoZSBwYXJzZXIgaXMgcGFzc2VkIGluIHNvIHRoYXQgaXQgd2lsbCBiZSB0cmVlIHNoYWthYmxlLiBTZWVcbiAqICAgICAgICBgc3R5bGVTdHJpbmdQYXJzZXJgIGFuZCBgY2xhc3NTdHJpbmdQYXJzZXJgXG4gKiBAcGFyYW0gdmFsdWUgVGhlIHZhbHVlIHRvIHBhcnNlL2NvbnZlcnQgdG8gYEFycmF5TWFwYFxuICovXG5leHBvcnQgZnVuY3Rpb24gdG9TdHlsaW5nQXJyYXlNYXAoXG4gICAgYXJyYXlNYXBTZXQ6IChhcnJheU1hcDogQXJyYXlNYXA8YW55Piwga2V5OiBzdHJpbmcsIHZhbHVlOiBhbnkpID0+IHZvaWQsXG4gICAgc3RyaW5nUGFyc2VyOiAoc3R5bGVBcnJheU1hcDogQXJyYXlNYXA8YW55PiwgdGV4dDogc3RyaW5nKSA9PiB2b2lkLCB2YWx1ZTogc3RyaW5nfHN0cmluZ1tdfFxuICAgIHtba2V5OiBzdHJpbmddOiBhbnl9fE1hcDxhbnksIGFueT58U2V0PGFueT58bnVsbHx1bmRlZmluZWQpOiBBcnJheU1hcDxhbnk+IHtcbiAgaWYgKHZhbHVlID09PSBudWxsIHx8IHZhbHVlID09PSB1bmRlZmluZWQgfHwgdmFsdWUgPT09ICcnKSByZXR1cm4gRU1QVFlfQVJSQVkgYXMgYW55O1xuICBjb25zdCBzdHlsZUFycmF5TWFwOiBBcnJheU1hcDxhbnk+ID0gW10gYXMgYW55O1xuICBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHZhbHVlLmxlbmd0aDsgaSsrKSB7XG4gICAgICBhcnJheU1hcFNldChzdHlsZUFycmF5TWFwLCB2YWx1ZVtpXSwgdHJ1ZSk7XG4gICAgfVxuICB9IGVsc2UgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcpIHtcbiAgICBpZiAodmFsdWUgaW5zdGFuY2VvZiBNYXApIHtcbiAgICAgIHZhbHVlLmZvckVhY2goKHYsIGspID0+IGFycmF5TWFwU2V0KHN0eWxlQXJyYXlNYXAsIGssIHYpKTtcbiAgICB9IGVsc2UgaWYgKHZhbHVlIGluc3RhbmNlb2YgU2V0KSB7XG4gICAgICB2YWx1ZS5mb3JFYWNoKChrKSA9PiBhcnJheU1hcFNldChzdHlsZUFycmF5TWFwLCBrLCB0cnVlKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGZvciAoY29uc3Qga2V5IGluIHZhbHVlKSB7XG4gICAgICAgIGlmICh2YWx1ZS5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgICAgYXJyYXlNYXBTZXQoc3R5bGVBcnJheU1hcCwga2V5LCB2YWx1ZVtrZXldKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfSBlbHNlIGlmICh0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnKSB7XG4gICAgc3RyaW5nUGFyc2VyKHN0eWxlQXJyYXlNYXAsIHZhbHVlKTtcbiAgfSBlbHNlIHtcbiAgICBuZ0Rldk1vZGUgJiYgdGhyb3dFcnJvcignVW5zdXBwb3J0ZWQgc3R5bGluZyB0eXBlICcgKyB0eXBlb2YgdmFsdWUpO1xuICB9XG4gIHJldHVybiBzdHlsZUFycmF5TWFwO1xufVxuXG4vKipcbiAqIFNldCBhIGB2YWx1ZWAgZm9yIGEgYGtleWAgdGFraW5nIHN0eWxlIHNhbml0aXphdGlvbiBpbnRvIGFjY291bnQuXG4gKlxuICogU2VlOiBgYXJyYXlNYXBTZXRgIGZvciBkZXRhaWxzXG4gKlxuICogQHBhcmFtIGFycmF5TWFwIEFycmF5TWFwIHRvIGFkZCB0by5cbiAqIEBwYXJhbSBrZXkgU3R5bGUga2V5IHRvIGFkZC4gKFRoaXMga2V5IHdpbGwgYmUgY2hlY2tlZCBpZiBpdCBuZWVkcyBzYW5pdGl6YXRpb24pXG4gKiBAcGFyYW0gdmFsdWUgVGhlIHZhbHVlIHRvIHNldCAoSWYga2V5IG5lZWRzIHNhbml0aXphdGlvbiBpdCB3aWxsIGJlIHNhbml0aXplZClcbiAqL1xuZnVuY3Rpb24gc3R5bGVBcnJheU1hcFNldChhcnJheU1hcDogQXJyYXlNYXA8YW55Piwga2V5OiBzdHJpbmcsIHZhbHVlOiBhbnkpIHtcbiAgaWYgKHN0eWxlUHJvcE5lZWRzU2FuaXRpemF0aW9uKGtleSkpIHtcbiAgICB2YWx1ZSA9IMm1ybVzYW5pdGl6ZVN0eWxlKHZhbHVlKTtcbiAgfVxuICBhcnJheU1hcFNldChhcnJheU1hcCwga2V5LCB2YWx1ZSk7XG59XG5cbi8qKlxuICogVXBkYXRlIG1hcCBiYXNlZCBzdHlsaW5nLlxuICpcbiAqIE1hcCBiYXNlZCBzdHlsaW5nIGNvdWxkIGJlIGFueXRoaW5nIHdoaWNoIGNvbnRhaW5zIG1vcmUgdGhhbiBvbmUgYmluZGluZy4gRm9yIGV4YW1wbGUgYHN0cmluZ2AsXG4gKiBgTWFwYCwgYFNldGAgb3Igb2JqZWN0IGxpdGVyYWwuIERlYWxpbmcgd2l0aCBhbGwgb2YgdGhlc2UgdHlwZXMgd291bGQgY29tcGxpY2F0ZSB0aGUgbG9naWMgc29cbiAqIGluc3RlYWQgdGhpcyBmdW5jdGlvbiBleHBlY3RzIHRoYXQgdGhlIGNvbXBsZXggaW5wdXQgaXMgZmlyc3QgY29udmVydGVkIGludG8gbm9ybWFsaXplZFxuICogYEFycmF5TWFwYC4gVGhlIGFkdmFudGFnZSBvZiBub3JtYWxpemF0aW9uIGlzIHRoYXQgd2UgZ2V0IHRoZSB2YWx1ZXMgc29ydGVkLCB3aGljaCBtYWtlcyBpdCB2ZXJ5XG4gKiBjaGVhcCB0byBjb21wdXRlIGRlbHRhcyBiZXR3ZWVuIHRoZSBwcmV2aW91cyBhbmQgY3VycmVudCB2YWx1ZS5cbiAqXG4gKiBAcGFyYW0gdFZpZXcgQXNzb2NpYXRlZCBgVFZpZXcuZGF0YWAgY29udGFpbnMgdGhlIGxpbmtlZCBsaXN0IG9mIGJpbmRpbmcgcHJpb3JpdGllcy5cbiAqIEBwYXJhbSB0Tm9kZSBgVE5vZGVgIHdoZXJlIHRoZSBiaW5kaW5nIGlzIGxvY2F0ZWQuXG4gKiBAcGFyYW0gbFZpZXcgYExWaWV3YCBjb250YWlucyB0aGUgdmFsdWVzIGFzc29jaWF0ZWQgd2l0aCBvdGhlciBzdHlsaW5nIGJpbmRpbmcgYXQgdGhpcyBgVE5vZGVgLlxuICogQHBhcmFtIHJlbmRlcmVyIFJlbmRlcmVyIHRvIHVzZSBpZiBhbnkgdXBkYXRlcy5cbiAqIEBwYXJhbSBvbGRBcnJheU1hcCBQcmV2aW91cyB2YWx1ZSByZXByZXNlbnRlZCBhcyBgQXJyYXlNYXBgXG4gKiBAcGFyYW0gbmV3QXJyYXlNYXAgQ3VycmVudCB2YWx1ZSByZXByZXNlbnRlZCBhcyBgQXJyYXlNYXBgXG4gKiBAcGFyYW0gaXNDbGFzc0Jhc2VkIGB0cnVlYCBpZiBgY2xhc3NgIChgZmFsc2VgIGlmIGBzdHlsZWApXG4gKiBAcGFyYW0gYmluZGluZ0luZGV4IEJpbmRpbmcgaW5kZXggb2YgdGhlIGJpbmRpbmcuXG4gKi9cbmZ1bmN0aW9uIHVwZGF0ZVN0eWxpbmdNYXAoXG4gICAgdFZpZXc6IFRWaWV3LCB0Tm9kZTogVE5vZGUsIGxWaWV3OiBMVmlldywgcmVuZGVyZXI6IFJlbmRlcmVyMywgb2xkQXJyYXlNYXA6IEFycmF5TWFwPGFueT4sXG4gICAgbmV3QXJyYXlNYXA6IEFycmF5TWFwPGFueT4sIGlzQ2xhc3NCYXNlZDogYm9vbGVhbiwgYmluZGluZ0luZGV4OiBudW1iZXIpIHtcbiAgaWYgKG9sZEFycmF5TWFwIGFzIEFycmF5TWFwPGFueT58IE5PX0NIQU5HRSA9PT0gTk9fQ0hBTkdFKSB7XG4gICAgLy8gT04gZmlyc3QgZXhlY3V0aW9uIHRoZSBvbGRBcnJheU1hcCBpcyBOT19DSEFOR0UgPT4gdHJlYXQgaXMgYXMgZW1wdHkgQXJyYXlNYXAuXG4gICAgb2xkQXJyYXlNYXAgPSBFTVBUWV9BUlJBWSBhcyBhbnk7XG4gIH1cbiAgbGV0IG9sZEluZGV4ID0gMDtcbiAgbGV0IG5ld0luZGV4ID0gMDtcbiAgbGV0IG9sZEtleTogc3RyaW5nfG51bGwgPSAwIDwgb2xkQXJyYXlNYXAubGVuZ3RoID8gb2xkQXJyYXlNYXBbMF0gOiBudWxsO1xuICBsZXQgbmV3S2V5OiBzdHJpbmd8bnVsbCA9IDAgPCBuZXdBcnJheU1hcC5sZW5ndGggPyBuZXdBcnJheU1hcFswXSA6IG51bGw7XG4gIHdoaWxlIChvbGRLZXkgIT09IG51bGwgfHwgbmV3S2V5ICE9PSBudWxsKSB7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydExlc3NUaGFuKG9sZEluZGV4LCA5OTksICdBcmUgd2Ugc3R1Y2sgaW4gaW5maW5pdGUgbG9vcD8nKTtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0TGVzc1RoYW4obmV3SW5kZXgsIDk5OSwgJ0FyZSB3ZSBzdHVjayBpbiBpbmZpbml0ZSBsb29wPycpO1xuICAgIGNvbnN0IG9sZFZhbHVlID0gb2xkSW5kZXggPCBvbGRBcnJheU1hcC5sZW5ndGggPyBvbGRBcnJheU1hcFtvbGRJbmRleCArIDFdIDogdW5kZWZpbmVkO1xuICAgIGNvbnN0IG5ld1ZhbHVlID0gbmV3SW5kZXggPCBuZXdBcnJheU1hcC5sZW5ndGggPyBuZXdBcnJheU1hcFtuZXdJbmRleCArIDFdIDogdW5kZWZpbmVkO1xuICAgIGxldCBzZXRLZXk6IHN0cmluZ3xudWxsID0gbnVsbDtcbiAgICBsZXQgc2V0VmFsdWU6IGFueSA9IHVuZGVmaW5lZDtcbiAgICBpZiAob2xkS2V5ID09PSBuZXdLZXkpIHtcbiAgICAgIC8vIFVQREFURTogS2V5cyBhcmUgZXF1YWwgPT4gbmV3IHZhbHVlIGlzIG92ZXJ3cml0aW5nIG9sZCB2YWx1ZS5cbiAgICAgIG9sZEluZGV4ICs9IDI7XG4gICAgICBuZXdJbmRleCArPSAyO1xuICAgICAgaWYgKG9sZFZhbHVlICE9PSBuZXdWYWx1ZSkge1xuICAgICAgICBzZXRLZXkgPSBuZXdLZXk7XG4gICAgICAgIHNldFZhbHVlID0gbmV3VmFsdWU7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChuZXdLZXkgPT09IG51bGwgfHwgb2xkS2V5ICE9PSBudWxsICYmIG9sZEtleSA8IG5ld0tleSAhKSB7XG4gICAgICAvLyBERUxFVEU6IG9sZEtleSBrZXkgaXMgbWlzc2luZyBvciB3ZSBkaWQgbm90IGZpbmQgdGhlIG9sZEtleSBpbiB0aGUgbmV3VmFsdWUuXG4gICAgICBvbGRJbmRleCArPSAyO1xuICAgICAgc2V0S2V5ID0gb2xkS2V5O1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBDUkVBVEU6IG5ld0tleSBpcyBsZXNzIHRoYW4gb2xkS2V5IChvciBubyBvbGRLZXkpID0+IHdlIGhhdmUgbmV3IGtleS5cbiAgICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKG5ld0tleSwgJ0V4cGVjdGluZyB0byBoYXZlIGEgdmFsaWQga2V5Jyk7XG4gICAgICBuZXdJbmRleCArPSAyO1xuICAgICAgc2V0S2V5ID0gbmV3S2V5O1xuICAgICAgc2V0VmFsdWUgPSBuZXdWYWx1ZTtcbiAgICB9XG4gICAgaWYgKHNldEtleSAhPT0gbnVsbCkge1xuICAgICAgdXBkYXRlU3R5bGluZyh0VmlldywgdE5vZGUsIGxWaWV3LCByZW5kZXJlciwgc2V0S2V5LCBzZXRWYWx1ZSwgaXNDbGFzc0Jhc2VkLCBiaW5kaW5nSW5kZXgpO1xuICAgIH1cbiAgICBvbGRLZXkgPSBvbGRJbmRleCA8IG9sZEFycmF5TWFwLmxlbmd0aCA/IG9sZEFycmF5TWFwW29sZEluZGV4XSA6IG51bGw7XG4gICAgbmV3S2V5ID0gbmV3SW5kZXggPCBuZXdBcnJheU1hcC5sZW5ndGggPyBuZXdBcnJheU1hcFtuZXdJbmRleF0gOiBudWxsO1xuICB9XG59XG5cbi8qKlxuICogVXBkYXRlIGEgc2ltcGxlIChwcm9wZXJ0eSBuYW1lKSBzdHlsaW5nLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gdGFrZXMgYHByb3BgIGFuZCB1cGRhdGVzIHRoZSBET00gdG8gdGhhdCB2YWx1ZS4gVGhlIGZ1bmN0aW9uIHRha2VzIHRoZSBiaW5kaW5nXG4gKiB2YWx1ZSBhcyB3ZWxsIGFzIGJpbmRpbmcgcHJpb3JpdHkgaW50byBjb25zaWRlcmF0aW9uIHRvIGRldGVybWluZSB3aGljaCB2YWx1ZSBzaG91bGQgYmUgd3JpdHRlblxuICogdG8gRE9NLiAoRm9yIGV4YW1wbGUgaXQgbWF5IGJlIGRldGVybWluZWQgdGhhdCB0aGVyZSBpcyBhIGhpZ2hlciBwcmlvcml0eSBvdmVyd3JpdGUgd2hpY2ggYmxvY2tzXG4gKiB0aGUgRE9NIHdyaXRlLCBvciBpZiB0aGUgdmFsdWUgZ29lcyB0byBgdW5kZWZpbmVkYCBhIGxvd2VyIHByaW9yaXR5IG92ZXJ3cml0ZSBtYXkgYmUgY29uc3VsdGVkLilcbiAqXG4gKiBAcGFyYW0gdFZpZXcgQXNzb2NpYXRlZCBgVFZpZXcuZGF0YWAgY29udGFpbnMgdGhlIGxpbmtlZCBsaXN0IG9mIGJpbmRpbmcgcHJpb3JpdGllcy5cbiAqIEBwYXJhbSB0Tm9kZSBgVE5vZGVgIHdoZXJlIHRoZSBiaW5kaW5nIGlzIGxvY2F0ZWQuXG4gKiBAcGFyYW0gbFZpZXcgYExWaWV3YCBjb250YWlucyB0aGUgdmFsdWVzIGFzc29jaWF0ZWQgd2l0aCBvdGhlciBzdHlsaW5nIGJpbmRpbmcgYXQgdGhpcyBgVE5vZGVgLlxuICogQHBhcmFtIHJlbmRlcmVyIFJlbmRlcmVyIHRvIHVzZSBpZiBhbnkgdXBkYXRlcy5cbiAqIEBwYXJhbSBwcm9wIEVpdGhlciBzdHlsZSBwcm9wZXJ0eSBuYW1lIG9yIGEgY2xhc3MgbmFtZS5cbiAqIEBwYXJhbSB2YWx1ZSBFaXRoZXIgc3R5bGUgdmFsZSBmb3IgYHByb3BgIG9yIGB0cnVlYC9gZmFsc2VgIGlmIGBwcm9wYCBpcyBjbGFzcy5cbiAqIEBwYXJhbSBpc0NsYXNzQmFzZWQgYHRydWVgIGlmIGBjbGFzc2AgKGBmYWxzZWAgaWYgYHN0eWxlYClcbiAqIEBwYXJhbSBiaW5kaW5nSW5kZXggQmluZGluZyBpbmRleCBvZiB0aGUgYmluZGluZy5cbiAqL1xuZnVuY3Rpb24gdXBkYXRlU3R5bGluZyhcbiAgICB0VmlldzogVFZpZXcsIHROb2RlOiBUTm9kZSwgbFZpZXc6IExWaWV3LCByZW5kZXJlcjogUmVuZGVyZXIzLCBwcm9wOiBzdHJpbmcsXG4gICAgdmFsdWU6IHN0cmluZyB8IHVuZGVmaW5lZCB8IG51bGwgfCBib29sZWFuLCBpc0NsYXNzQmFzZWQ6IGJvb2xlYW4sIGJpbmRpbmdJbmRleDogbnVtYmVyKSB7XG4gIGlmICh0Tm9kZS50eXBlICE9PSBUTm9kZVR5cGUuRWxlbWVudCkge1xuICAgIC8vIEl0IGlzIHBvc3NpYmxlIHRvIGhhdmUgc3R5bGluZyBvbiBub24tZWxlbWVudHMgKHN1Y2ggYXMgbmctY29udGFpbmVyKS5cbiAgICAvLyBUaGlzIGlzIHJhcmUsIGJ1dCBpdCBkb2VzIGhhcHBlbi4gSW4gc3VjaCBhIGNhc2UsIGp1c3QgaWdub3JlIHRoZSBiaW5kaW5nLlxuICAgIHJldHVybjtcbiAgfVxuICBjb25zdCB0RGF0YSA9IHRWaWV3LmRhdGE7XG4gIGNvbnN0IHRSYW5nZSA9IHREYXRhW2JpbmRpbmdJbmRleCArIDFdIGFzIFRTdHlsaW5nUmFuZ2U7XG4gIGNvbnN0IGhpZ2hlclByaW9yaXR5VmFsdWUgPSBnZXRUU3R5bGluZ1JhbmdlTmV4dER1cGxpY2F0ZSh0UmFuZ2UpID9cbiAgICAgIGZpbmRTdHlsaW5nVmFsdWUodERhdGEsIG51bGwsIGxWaWV3LCBwcm9wLCBnZXRUU3R5bGluZ1JhbmdlTmV4dCh0UmFuZ2UpLCBpc0NsYXNzQmFzZWQpIDpcbiAgICAgIHVuZGVmaW5lZDtcbiAgaWYgKCFpc1N0eWxpbmdWYWx1ZVByZXNlbnQoaGlnaGVyUHJpb3JpdHlWYWx1ZSkpIHtcbiAgICAvLyBXZSBkb24ndCBoYXZlIGEgbmV4dCBkdXBsaWNhdGUsIG9yIHdlIGRpZCBub3QgZmluZCBhIGR1cGxpY2F0ZSB2YWx1ZS5cbiAgICBpZiAoIWlzU3R5bGluZ1ZhbHVlUHJlc2VudCh2YWx1ZSkpIHtcbiAgICAgIC8vIFdlIHNob3VsZCBkZWxldGUgY3VycmVudCB2YWx1ZSBvciByZXN0b3JlIHRvIGxvd2VyIHByaW9yaXR5IHZhbHVlLlxuICAgICAgaWYgKGdldFRTdHlsaW5nUmFuZ2VQcmV2RHVwbGljYXRlKHRSYW5nZSkpIHtcbiAgICAgICAgLy8gV2UgaGF2ZSBhIHBvc3NpYmxlIHByZXYgZHVwbGljYXRlLCBsZXQncyByZXRyaWV2ZSBpdC5cbiAgICAgICAgdmFsdWUgPVxuICAgICAgICAgICAgZmluZFN0eWxpbmdWYWx1ZSh0RGF0YSwgdE5vZGUsIGxWaWV3LCBwcm9wLCBnZXRUU3R5bGluZ1JhbmdlUHJldih0UmFuZ2UpLCBpc0NsYXNzQmFzZWQpO1xuICAgICAgfVxuICAgIH1cbiAgICBjb25zdCByTm9kZSA9IGdldE5hdGl2ZUJ5SW5kZXgoZ2V0U2VsZWN0ZWRJbmRleCgpLCBsVmlldykgYXMgUkVsZW1lbnQ7XG4gICAgYXBwbHlTdHlsaW5nKHJlbmRlcmVyLCBpc0NsYXNzQmFzZWQsIHJOb2RlLCBwcm9wLCB2YWx1ZSk7XG4gIH1cbn1cblxuLyoqXG4gKiBTZWFyY2ggZm9yIHN0eWxpbmcgdmFsdWUgd2l0aCBoaWdoZXIgcHJpb3JpdHkgd2hpY2ggaXMgb3ZlcndyaXRpbmcgY3VycmVudCB2YWx1ZS5cbiAqXG4gKiBXaGVuIHZhbHVlIGlzIGJlaW5nIGFwcGxpZWQgYXQgYSBsb2NhdGlvbiByZWxhdGVkIHZhbHVlcyBuZWVkIHRvIGJlIGNvbnN1bHRlZC5cbiAqIC0gSWYgdGhlcmUgaXMgYSBoaWdoZXIgcHJpb3JpdHkgYmluZGluZywgd2Ugc2hvdWxkIGJlIHVzaW5nIHRoYXQgb25lIGluc3RlYWQuXG4gKiAgIEZvciBleGFtcGxlIGA8ZGl2ICBbc3R5bGVdPVwie2NvbG9yOmV4cDF9XCIgW3N0eWxlLmNvbG9yXT1cImV4cDJcIj5gIGNoYW5nZSB0byBgZXhwMWBcbiAqICAgcmVxdWlyZXMgdGhhdCB3ZSBjaGVjayBgZXhwMmAgdG8gc2VlIGlmIGl0IGlzIHNldCB0byB2YWx1ZSBvdGhlciB0aGFuIGB1bmRlZmluZWRgLlxuICogLSBJZiB0aGVyZSBpcyBhIGxvd2VyIHByaW9yaXR5IGJpbmRpbmcgYW5kIHdlIGFyZSBjaGFuZ2luZyB0byBgdW5kZWZpbmVkYFxuICogICBGb3IgZXhhbXBsZSBgPGRpdiAgW3N0eWxlXT1cIntjb2xvcjpleHAxfVwiIFtzdHlsZS5jb2xvcl09XCJleHAyXCI+YCBjaGFuZ2UgdG8gYGV4cDJgIHRvXG4gKiAgIGB1bmRlZmluZWRgIHJlcXVpcmVzIHRoYXQgd2UgY2hlY2sgYGV4cGAgKGFuZCBzdGF0aWMgdmFsdWVzKSBhbmQgdXNlIHRoYXQgYXMgbmV3IHZhbHVlLlxuICpcbiAqIE5PVEU6IFRoZSBzdHlsaW5nIHN0b3JlcyB0d28gdmFsdWVzLlxuICogMS4gVGhlIHJhdyB2YWx1ZSB3aGljaCBjYW1lIGZyb20gdGhlIGFwcGxpY2F0aW9uIGlzIHN0b3JlZCBhdCBgaW5kZXggKyAwYCBsb2NhdGlvbi4gKFRoaXMgdmFsdWVcbiAqICAgIGlzIHVzZWQgZm9yIGRpcnR5IGNoZWNraW5nKS5cbiAqIDIuIFRoZSBub3JtYWxpemVkIHZhbHVlIChjb252ZXJ0ZWQgdG8gYEFycmF5TWFwYCBpZiBtYXAgYW5kIHNhbml0aXplZCkgaXMgc3RvcmVkIGF0IGBpbmRleCArIDFgLlxuICogICAgVGhlIGFkdmFudGFnZSBvZiBzdG9yaW5nIHRoZSBzYW5pdGl6ZWQgdmFsdWUgaXMgdGhhdCBvbmNlIHRoZSB2YWx1ZSBpcyB3cml0dGVuIHdlIGRvbid0IG5lZWRcbiAqICAgIHRvIHdvcnJ5IGFib3V0IHNhbml0aXppbmcgaXQgbGF0ZXIgb3Iga2VlcGluZyB0cmFjayBvZiB0aGUgc2FuaXRpemVyLlxuICpcbiAqIEBwYXJhbSB0RGF0YSBgVERhdGFgIHVzZWQgZm9yIHRyYXZlcnNpbmcgdGhlIHByaW9yaXR5LlxuICogQHBhcmFtIHROb2RlIGBUTm9kZWAgdG8gdXNlIGZvciByZXNvbHZpbmcgc3RhdGljIHN0eWxpbmcuIEFsc28gY29udHJvbHMgc2VhcmNoIGRpcmVjdGlvbi5cbiAqICAgLSBgVE5vZGVgIHNlYXJjaCBwcmV2aW91cyBhbmQgcXVpdCBhcyBzb29uIGFzIGBpc1N0eWxpbmdWYWx1ZVByZXNlbnQodmFsdWUpYCBpcyB0cnVlLlxuICogICAgICBJZiBubyB2YWx1ZSBmb3VuZCBjb25zdWx0IGB0Tm9kZS5zdHlsZU1hcGAvYHROb2RlLmNsYXNzTWFwYCBmb3IgZGVmYXVsdCB2YWx1ZS5cbiAqICAgLSBgbnVsbGAgc2VhcmNoIG5leHQgYW5kIGdvIGFsbCB0aGUgd2F5IHRvIGVuZC4gUmV0dXJuIGxhc3QgdmFsdWUgd2hlcmVcbiAqICAgICBgaXNTdHlsaW5nVmFsdWVQcmVzZW50KHZhbHVlKWAgaXMgdHJ1ZS5cbiAqIEBwYXJhbSBsVmlldyBgTFZpZXdgIHVzZWQgZm9yIHJldHJpZXZpbmcgdGhlIGFjdHVhbCB2YWx1ZXMuXG4gKiBAcGFyYW0gcHJvcCBQcm9wZXJ0eSB3aGljaCB3ZSBhcmUgaW50ZXJlc3RlZCBpbi5cbiAqIEBwYXJhbSBpbmRleCBTdGFydGluZyBpbmRleCBpbiB0aGUgbGlua2VkIGxpc3Qgb2Ygc3R5bGluZyBiaW5kaW5ncyB3aGVyZSB0aGUgc2VhcmNoIHNob3VsZCBzdGFydC5cbiAqIEBwYXJhbSBpc0NsYXNzQmFzZWQgYHRydWVgIGlmIGBjbGFzc2AgKGBmYWxzZWAgaWYgYHN0eWxlYClcbiAqL1xuZnVuY3Rpb24gZmluZFN0eWxpbmdWYWx1ZShcbiAgICB0RGF0YTogVERhdGEsIHROb2RlOiBUTm9kZSB8IG51bGwsIGxWaWV3OiBMVmlldywgcHJvcDogc3RyaW5nLCBpbmRleDogbnVtYmVyLFxuICAgIGlzQ2xhc3NCYXNlZDogYm9vbGVhbik6IGFueSB7XG4gIGxldCB2YWx1ZTogYW55ID0gdW5kZWZpbmVkO1xuICB3aGlsZSAoaW5kZXggPiAwKSB7XG4gICAgY29uc3Qga2V5ID0gdERhdGFbaW5kZXhdIGFzIFRTdHlsaW5nS2V5O1xuICAgIGNvbnN0IGN1cnJlbnRWYWx1ZSA9IGtleSA9PT0gbnVsbCA/IGFycmF5TWFwR2V0KGxWaWV3W2luZGV4ICsgMV0sIHByb3ApIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBrZXkgPT09IHByb3AgPyBsVmlld1tpbmRleCArIDFdIDogdW5kZWZpbmVkO1xuICAgIGlmIChpc1N0eWxpbmdWYWx1ZVByZXNlbnQoY3VycmVudFZhbHVlKSkge1xuICAgICAgdmFsdWUgPSBjdXJyZW50VmFsdWU7XG4gICAgICBpZiAodE5vZGUgIT09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgfVxuICAgIH1cbiAgICBjb25zdCB0UmFuZ2UgPSB0RGF0YVtpbmRleCArIDFdIGFzIFRTdHlsaW5nUmFuZ2U7XG4gICAgaW5kZXggPSB0Tm9kZSAhPT0gbnVsbCA/IGdldFRTdHlsaW5nUmFuZ2VQcmV2KHRSYW5nZSkgOiBnZXRUU3R5bGluZ1JhbmdlTmV4dCh0UmFuZ2UpO1xuICB9XG4gIGlmICh0Tm9kZSAhPT0gbnVsbCkge1xuICAgIC8vIGluIGNhc2Ugd2hlcmUgd2UgYXJlIGdvaW5nIGluIHByZXZpb3VzIGRpcmVjdGlvbiBBTkQgd2UgZGlkIG5vdCBmaW5kIGFueXRoaW5nLCB3ZSBuZWVkIHRvXG4gICAgLy8gY29uc3VsdCBzdGF0aWMgc3R5bGluZ1xuICAgIGxldCBzdGF0aWNBcnJheU1hcCA9IGlzQ2xhc3NCYXNlZCA/IHROb2RlLmNsYXNzZXNNYXAgOiB0Tm9kZS5zdHlsZXNNYXA7XG4gICAgaWYgKHN0YXRpY0FycmF5TWFwID09PSB1bmRlZmluZWQpIHtcbiAgICAgIC8vIFRoaXMgaXMgdGhlIGZpcnN0IHRpbWUgd2UgYXJlIGhlcmUsIGFuZCB3ZSBuZWVkIHRvIGluaXRpYWxpemUgaXQuXG4gICAgICBpbml0aWFsaXplU3R5bGluZ1N0YXRpY0FycmF5TWFwKHROb2RlKTtcbiAgICAgIHN0YXRpY0FycmF5TWFwID0gaXNDbGFzc0Jhc2VkID8gdE5vZGUuY2xhc3Nlc01hcCA6IHROb2RlLnN0eWxlc01hcDtcbiAgICB9XG4gICAgaWYgKHN0YXRpY0FycmF5TWFwICE9PSBudWxsKSB7XG4gICAgICB2YWx1ZSA9IGFycmF5TWFwR2V0KHN0YXRpY0FycmF5TWFwICEsIHByb3ApO1xuICAgIH1cbiAgfVxuICByZXR1cm4gdmFsdWU7XG59XG5cbi8qKlxuICogRGV0ZXJtaW5lcyBpZiB0aGUgYmluZGluZyB2YWx1ZSBzaG91bGQgYmUgdXNlZCAob3IgaWYgdGhlIHZhbHVlIGlzICd1bmRlZmluZWQnIGFuZCBoZW5jZSBwcmlvcml0eVxuICogcmVzb2x1dGlvbiBzaG91bGQgYmUgdXNlZC4pXG4gKlxuICogQHBhcmFtIHZhbHVlIEJpbmRpbmcgc3R5bGUgdmFsdWUuXG4gKi9cbmZ1bmN0aW9uIGlzU3R5bGluZ1ZhbHVlUHJlc2VudCh2YWx1ZTogYW55KTogYm9vbGVhbiB7XG4gIC8vIEN1cnJlbnRseSBvbmx5IGB1bmRlZmluZWRgIHZhbHVlIGlzIGNvbnNpZGVyZWQgbm9uLWJpbmRpbmcuIFRoYXQgaXMgYHVuZGVmaW5lZGAgc2F5cyBJIGRvbid0XG4gIC8vIGhhdmUgYW4gb3BpbmlvbiBhcyB0byB3aGF0IHRoaXMgYmluZGluZyBzaG91bGQgYmUgYW5kIHlvdSBzaG91bGQgY29uc3VsdCBvdGhlciBiaW5kaW5ncyBieVxuICAvLyBwcmlvcml0eSB0byBkZXRlcm1pbmUgdGhlIHZhbGlkIHZhbHVlLlxuICAvLyBUaGlzIGlzIGV4dHJhY3RlZCBpbnRvIGEgc2luZ2xlIGZ1bmN0aW9uIHNvIHRoYXQgd2UgaGF2ZSBhIHNpbmdsZSBwbGFjZSB0byBjb250cm9sIHRoaXMuXG4gIHJldHVybiB2YWx1ZSAhPT0gdW5kZWZpbmVkO1xufVxuXG4vKipcbiAqIExhemlseSBjb21wdXRlcyBgdE5vZGUuY2xhc3Nlc01hcGAvYHROb2RlLnN0eWxlc01hcGAuXG4gKlxuICogVGhpcyBjb2RlIGlzIGhlcmUgYmVjYXVzZSB3ZSBkb24ndCB3YW50IHRvIGluY2x1ZGVkIGl0IGluIGBlbGVtZW50U3RhcnRgIGFzIGl0IHdvdWxkIG1ha2UgaGVsbG9cbiAqIHdvcmxkIGJpZ2dlciBldmVuIGlmIG5vIHN0eWxpbmcgd291bGQgYmUgcHJlc2VudC4gSW5zdGVhZCB3ZSBpbml0aWFsaXplIHRoZSB2YWx1ZXMgaGVyZSBzbyB0aGF0XG4gKiB0cmVlIHNoYWtpbmcgd2lsbCBvbmx5IGJyaW5nIGl0IGluIGlmIHN0eWxpbmcgaXMgcHJlc2VudC5cbiAqXG4gKiBAcGFyYW0gdE5vZGUgYFROb2RlYCB0byBpbml0aWFsaXplLlxuICovXG5leHBvcnQgZnVuY3Rpb24gaW5pdGlhbGl6ZVN0eWxpbmdTdGF0aWNBcnJheU1hcCh0Tm9kZTogVE5vZGUpIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEVxdWFsKHROb2RlLmNsYXNzZXNNYXAsIHVuZGVmaW5lZCwgJ0FscmVhZHkgaW5pdGlhbGl6ZWQhJyk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRFcXVhbCh0Tm9kZS5zdHlsZXNNYXAsIHVuZGVmaW5lZCwgJ0FscmVhZHkgaW5pdGlhbGl6ZWQhJyk7XG4gIGxldCBzdHlsZU1hcDogQXJyYXlNYXA8YW55PnxudWxsID0gbnVsbDtcbiAgbGV0IGNsYXNzTWFwOiBBcnJheU1hcDxhbnk+fG51bGwgPSBudWxsO1xuICBjb25zdCBtZXJnZUF0dHJzID0gdE5vZGUubWVyZ2VkQXR0cnMgfHwgRU1QVFlfQVJSQVkgYXMgVEF0dHJpYnV0ZXM7XG4gIGxldCBtb2RlOiBBdHRyaWJ1dGVNYXJrZXIgPSBBdHRyaWJ1dGVNYXJrZXIuSW1wbGljaXRBdHRyaWJ1dGVzO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IG1lcmdlQXR0cnMubGVuZ3RoOyBpKyspIHtcbiAgICBsZXQgaXRlbSA9IG1lcmdlQXR0cnNbaV07XG4gICAgaWYgKHR5cGVvZiBpdGVtID09PSAnbnVtYmVyJykge1xuICAgICAgbW9kZSA9IGl0ZW07XG4gICAgfSBlbHNlIGlmIChtb2RlID09PSBBdHRyaWJ1dGVNYXJrZXIuQ2xhc3Nlcykge1xuICAgICAgY2xhc3NNYXAgPSBjbGFzc01hcCB8fCBbXSBhcyBhbnk7XG4gICAgICBhcnJheU1hcFNldChjbGFzc01hcCAhLCBpdGVtIGFzIHN0cmluZywgdHJ1ZSk7XG4gICAgfSBlbHNlIGlmIChtb2RlID09PSBBdHRyaWJ1dGVNYXJrZXIuU3R5bGVzKSB7XG4gICAgICBzdHlsZU1hcCA9IHN0eWxlTWFwIHx8IFtdIGFzIGFueTtcbiAgICAgIGFycmF5TWFwU2V0KHN0eWxlTWFwICEsIGl0ZW0gYXMgc3RyaW5nLCBtZXJnZUF0dHJzWysraV0gYXMgc3RyaW5nKTtcbiAgICB9XG4gIH1cbiAgdE5vZGUuY2xhc3Nlc01hcCA9IGNsYXNzTWFwO1xuICB0Tm9kZS5zdHlsZXNNYXAgPSBzdHlsZU1hcDtcbn1cblxuLyoqXG4gKiBTYW5pdGl6ZXMgb3IgYWRkcyBzdWZmaXggdG8gdGhlIHZhbHVlLlxuICpcbiAqIElmIHZhbHVlIGlzIGBudWxsYC9gdW5kZWZpbmVkYCBubyBzdWZmaXggaXMgYWRkZWRcbiAqIEBwYXJhbSB2YWx1ZVxuICogQHBhcmFtIHN1ZmZpeE9yU2FuaXRpemVyXG4gKi9cbmZ1bmN0aW9uIG5vcm1hbGl6ZUFuZEFwcGx5U3VmZml4T3JTYW5pdGl6ZXIoXG4gICAgdmFsdWU6IGFueSwgc3VmZml4T3JTYW5pdGl6ZXI6IFNhbml0aXplckZuIHwgc3RyaW5nIHwgdW5kZWZpbmVkIHwgbnVsbCk6IHN0cmluZ3xudWxsfHVuZGVmaW5lZHxcbiAgICBib29sZWFuIHtcbiAgaWYgKHZhbHVlID09PSBudWxsIHx8IHZhbHVlID09PSB1bmRlZmluZWQpIHtcbiAgICAvLyBkbyBub3RoaW5nXG4gIH0gZWxzZSBpZiAodHlwZW9mIHN1ZmZpeE9yU2FuaXRpemVyID09PSAnZnVuY3Rpb24nKSB7XG4gICAgLy8gc2FuaXRpemUgdGhlIHZhbHVlLlxuICAgIHZhbHVlID0gc3VmZml4T3JTYW5pdGl6ZXIodmFsdWUpO1xuICB9IGVsc2UgaWYgKHR5cGVvZiBzdWZmaXhPclNhbml0aXplciA9PT0gJ3N0cmluZycpIHtcbiAgICB2YWx1ZSA9IHZhbHVlICsgc3VmZml4T3JTYW5pdGl6ZXI7XG4gIH0gZWxzZSBpZiAodHlwZW9mIHZhbHVlID09PSAnb2JqZWN0Jykge1xuICAgIHZhbHVlID0gc3RyaW5naWZ5KHVud3JhcFNhZmVWYWx1ZSh2YWx1ZSkpO1xuICB9XG4gIHJldHVybiB2YWx1ZTtcbn1cblxuXG4vKipcbiAqIFRlc3RzIGlmIHRoZSBgVE5vZGVgIGhhcyBpbnB1dCBzaGFkb3cuXG4gKlxuICogQW4gaW5wdXQgc2hhZG93IGlzIHdoZW4gYSBkaXJlY3RpdmUgc3RlYWxzIChzaGFkb3dzKSB0aGUgaW5wdXQgYnkgdXNpbmcgYEBJbnB1dCgnc3R5bGUnKWAgb3JcbiAqIGBASW5wdXQoJ2NsYXNzJylgIGFzIGlucHV0LlxuICpcbiAqIEBwYXJhbSB0Tm9kZSBgVE5vZGVgIHdoaWNoIHdlIHdvdWxkIGxpa2UgdG8gc2VlIGlmIGl0IGhhcyBzaGFkb3cuXG4gKiBAcGFyYW0gaXNDbGFzc0Jhc2VkIGB0cnVlYCBpZiBgY2xhc3NgIChgZmFsc2VgIGlmIGBzdHlsZWApXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBoYXNTdHlsaW5nSW5wdXRTaGFkb3codE5vZGU6IFROb2RlLCBpc0NsYXNzQmFzZWQ6IGJvb2xlYW4pIHtcbiAgcmV0dXJuICh0Tm9kZS5mbGFncyAmIChpc0NsYXNzQmFzZWQgPyBUTm9kZUZsYWdzLmhhc0NsYXNzSW5wdXQgOiBUTm9kZUZsYWdzLmhhc1N0eWxlSW5wdXQpKSAhPT0gMDtcbn1cbiJdfQ==