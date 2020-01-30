/**
* @license
* Copyright Google Inc. All Rights Reserved.
*
* Use of this source code is governed by an MIT-style license that can be
* found in the LICENSE file at https://angular.io/license
*/
import { unwrapSafeValue } from '../../sanitization/bypass';
import { stylePropNeedsSanitization, ɵɵsanitizeStyle } from '../../sanitization/sanitization';
import { keyValueArrayGet, keyValueArraySet } from '../../util/array_utils';
import { assertDefined, assertEqual, assertGreaterThanOrEqual, assertLessThan, assertNotEqual, throwError } from '../../util/assert';
import { EMPTY_ARRAY } from '../../util/empty';
import { concatStringsWithSpace, stringify } from '../../util/stringify';
import { assertFirstUpdatePass } from '../assert';
import { bindingUpdated } from '../bindings';
import { getTStylingRangeNext, getTStylingRangeNextDuplicate, getTStylingRangePrev, getTStylingRangePrevDuplicate } from '../interfaces/styling';
import { HEADER_OFFSET, RENDERER, TVIEW } from '../interfaces/view';
import { applyStyling } from '../node_manipulation';
import { getCurrentDirectiveIndex, getCurrentStyleSanitizer, getLView, getSelectedIndex, incrementBindingIndex, setCurrentStyleSanitizer } from '../state';
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
    checkStylingMap(styleKeyValueArraySet, styleStringParser, styles, false);
}
/**
 * Parse text as style and add values to KeyValueArray.
 *
 * This code is pulled out to a separate function so that it can be tree shaken away if it is not
 * needed. It is only referenced from `ɵɵstyleMap`.
 *
 * @param keyValueArray KeyValueArray to add parsed values to.
 * @param text text to parse.
 */
export function styleStringParser(keyValueArray, text) {
    for (var i = parseStyle(text); i >= 0; i = parseStyleNext(text, i)) {
        styleKeyValueArraySet(keyValueArray, getLastParsedKey(text), getLastParsedValue(text));
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
    checkStylingMap(keyValueArraySet, classStringParser, classes, true);
}
/**
 * Parse text as class and add values to KeyValueArray.
 *
 * This code is pulled out to a separate function so that it can be tree shaken away if it is not
 * needed. It is only referenced from `ɵɵclassMap`.
 *
 * @param keyValueArray KeyValueArray to add parsed values to.
 * @param text text to parse.
 */
export function classStringParser(keyValueArray, text) {
    for (var i = parseClassName(text); i >= 0; i = parseClassNameNext(text, i)) {
        keyValueArraySet(keyValueArray, getLastParsedKey(text), true);
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
        stylingFirstUpdatePass(tView, prop, bindingIndex, isClassBased);
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
 * @param keyValueArraySet (See `keyValueArraySet` in "util/array_utils") Gets passed in as a
 * function so that
 *        `style` can pass in version which does sanitization. This is done for tree shaking
 *        purposes.
 * @param stringParser Parser used to parse `value` if `string`. (Passed in as `style` and `class`
 *        have different parsers.)
 * @param value bound value from application
 * @param isClassBased `true` if `class` change (`false` if `style`)
 */
export function checkStylingMap(keyValueArraySet, stringParser, value, isClassBased) {
    var lView = getLView();
    var tView = lView[TVIEW];
    var bindingIndex = incrementBindingIndex(2);
    if (tView.firstUpdatePass) {
        stylingFirstUpdatePass(tView, null, bindingIndex, isClassBased);
    }
    if (value !== NO_CHANGE && bindingUpdated(lView, bindingIndex, value)) {
        // `getSelectedIndex()` should be here (rather than in instruction) so that it is guarded by the
        // if so as not to read unnecessarily.
        var tNode = tView.data[getSelectedIndex() + HEADER_OFFSET];
        if (hasStylingInputShadow(tNode, isClassBased) && !isInHostBindings(tView, bindingIndex)) {
            if (ngDevMode) {
                // verify that if we are shadowing then `TData` is appropriately marked so that we skip
                // processing this binding in styling resolution.
                var tStylingKey = tView.data[bindingIndex];
                assertEqual(Array.isArray(tStylingKey) ? tStylingKey[1] : tStylingKey, false, 'Styling linked list shadow input should be marked as \'false\'');
            }
            // VE does not concatenate the static portion like we are doing here.
            // Instead VE just ignores the static completely if dynamic binding is present.
            // Because of locality we have already set the static portion because we don't know if there
            // is a dynamic portion until later. If we would ignore the static portion it would look like
            // the binding has removed it. This would confuse `[ngStyle]`/`[ngClass]` to do the wrong
            // thing as it would think that the static portion was removed. For this reason we
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
            updateStylingMap(tView, tNode, lView, lView[RENDERER], lView[bindingIndex + 1], lView[bindingIndex + 1] = toStylingKeyValueArray(keyValueArraySet, stringParser, value), isClassBased, bindingIndex);
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
* @param tStylingKey Property/key of the binding.
* @param bindingIndex Index of binding associated with the `prop`
* @param isClassBased `true` if `class` change (`false` if `style`)
*/
function stylingFirstUpdatePass(tView, tStylingKey, bindingIndex, isClassBased) {
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
        tStylingKey = wrapInStaticStylingKey(tData, tNode, tStylingKey, isClassBased);
        insertTStylingBinding(tData, tNode, tStylingKey, bindingIndex, isHostBindings, isClassBased);
    }
}
/**
 * Adds static styling information to the binding if applicable.
 *
 * The linked list of styles not only stores the list and keys, but also stores static styling
 * information on some of the keys. This function determines if the key should contain the styling
 * information and computes it.
 *
 * See `TStylingStatic` for more details.
 *
 * @param tData `TData` where the linked list is stored.
 * @param tNode `TNode` for which the styling is being computed.
 * @param stylingKey `TStylingKeyPrimitive` which may need to be wrapped into `TStylingKey`
 * @param isClassBased `true` if `class` (`false` if `style`)
 */
export function wrapInStaticStylingKey(tData, tNode, stylingKey, isClassBased) {
    var hostDirectiveDef = getHostDirectiveDef(tData);
    var residual = isClassBased ? tNode.residualClasses : tNode.residualStyles;
    if (hostDirectiveDef === null) {
        // We are in template node.
        // If template node already had styling instruction then it has already collected the static
        // styling and there is no need to collect them again. We know that we are the first styling
        // instruction because the `TNode.*Bindings` points to 0 (nothing has been inserted yet).
        var isFirstStylingInstructionInTemplate = (isClassBased ? tNode.classBindings : tNode.styleBindings) === 0;
        if (isFirstStylingInstructionInTemplate) {
            // It would be nice to be able to get the statics from `mergeAttrs`, however, at this point
            // they are already merged and it would not be possible to figure which property belongs where
            // in the priority.
            stylingKey = collectStylingFromDirectives(null, tData, tNode, stylingKey, isClassBased);
            stylingKey = collectStylingFromTAttrs(stylingKey, tNode.attrs, isClassBased);
            // We know that if we have styling binding in template we can't have residual.
            residual = null;
        }
    }
    else {
        // We are in host binding node and there was no binding instruction in template node.
        // This means that we need to compute the residual.
        var directives = tNode.directives;
        var isFirstStylingInstructionInHostBinding = directives !== null &&
            directives[directives[0 /* STYLING_CURSOR */]] !== hostDirectiveDef;
        if (isFirstStylingInstructionInHostBinding) {
            stylingKey =
                collectStylingFromDirectives(hostDirectiveDef, tData, tNode, stylingKey, isClassBased);
            if (residual === null) {
                // - If `null` than either:
                //    - Template styling instruction already ran and it has consumed the static
                //      styling into its `TStylingKey` and so there is no need to update residual. Instead
                //      we need to update the `TStylingKey` associated with the first template node
                //      instruction. OR
                //    - Some other styling instruction ran and determined that there are no residuals
                var templateStylingKey = getTemplateHeadTStylingKey(tData, tNode, isClassBased);
                if (templateStylingKey !== undefined && Array.isArray(templateStylingKey)) {
                    // Only recompute if `templateStylingKey` had static values. (If no static value found
                    // then there is nothing to do since this operation can only produce less static keys, not
                    // more.)
                    templateStylingKey = collectStylingFromDirectives(null, tData, tNode, templateStylingKey[1] /* unwrap previous statics */, isClassBased);
                    templateStylingKey =
                        collectStylingFromTAttrs(templateStylingKey, tNode.attrs, isClassBased);
                    setTemplateHeadTStylingKey(tData, tNode, isClassBased, templateStylingKey);
                }
            }
            else {
                // We only need to recompute residual if it is not `null`.
                // - If existing residual (implies there was no template styling). This means that some of
                //   the statics may have moved from the residual to the `stylingKey` and so we have to
                //   recompute.
                // - If `undefined` this is the first time we are running.
                residual = collectResidual(tNode, isClassBased);
            }
        }
    }
    if (residual !== undefined) {
        isClassBased ? (tNode.residualClasses = residual) : (tNode.residualStyles = residual);
    }
    return stylingKey;
}
/**
 * Retrieve the `TStylingKey` for the template styling instruction.
 *
 * This is needed since `hostBinding` styling instructions are inserted after the template
 * instruction. While the template instruction needs to update the residual in `TNode` the
 * `hostBinding` instructions need to update the `TStylingKey` of the template instruction because
 * the template instruction is downstream from the `hostBindings` instructions.
 *
 * @param tData `TData` where the linked list is stored.
 * @param tNode `TNode` for which the styling is being computed.
 * @param isClassBased `true` if `class` (`false` if `style`)
 * @return `TStylingKey` if found or `undefined` if not found.
 */
function getTemplateHeadTStylingKey(tData, tNode, isClassBased) {
    var bindings = isClassBased ? tNode.classBindings : tNode.styleBindings;
    if (getTStylingRangeNext(bindings) === 0) {
        // There does not seem to be a styling instruction in the `template`.
        return undefined;
    }
    return tData[getTStylingRangePrev(bindings)];
}
function setTemplateHeadTStylingKey(tData, tNode, isClassBased, tStylingKey) {
    var bindings = isClassBased ? tNode.classBindings : tNode.styleBindings;
    ngDevMode && assertNotEqual(getTStylingRangeNext(bindings), 0, 'Expecting to have at least one template styling binding.');
    tData[getTStylingRangePrev(bindings)] = tStylingKey;
}
function collectResidual(tNode, isClassBased) {
    var residual = undefined;
    var directives = tNode.directives;
    if (directives) {
        for (var i = directives[0 /* STYLING_CURSOR */] + 1; i < directives.length; i++) {
            var attrs = directives[i].hostAttrs;
            residual =
                collectStylingFromTAttrs(residual, attrs, isClassBased);
        }
    }
    return collectStylingFromTAttrs(residual, tNode.attrs, isClassBased);
}
/**
 * Collect the static styling information with lower priority than `hostDirectiveDef`.
 *
 * (This is opposite of residual styling.)
 *
 * @param hostDirectiveDef `DirectiveDef` for which we want to collect lower priority static
 *        styling. (Or `null` if template styling)
 * @param tData `TData` where the linked list is stored.
 * @param tNode `TNode` for which the styling is being computed.
 * @param stylingKey Existing `TStylingKey` to update or wrap.
 * @param isClassBased `true` if `class` (`false` if `style`)
 */
function collectStylingFromDirectives(hostDirectiveDef, tData, tNode, stylingKey, isClassBased) {
    var directives = tNode.directives;
    if (directives != null) {
        ngDevMode && hostDirectiveDef &&
            assertGreaterThanOrEqual(directives.indexOf(hostDirectiveDef, directives[0 /* STYLING_CURSOR */]), 0, 'Expecting that the current directive is in the directive list');
        // We need to loop because there can be directives which have `hostAttrs` but don't have
        // `hostBindings` so this loop catches up up to the current directive..
        var currentDirective = null;
        var index = directives[0 /* STYLING_CURSOR */];
        while (index + 1 < directives.length) {
            index++;
            currentDirective = directives[index];
            ngDevMode && assertDefined(currentDirective, 'expected to be defined');
            stylingKey = collectStylingFromTAttrs(stylingKey, currentDirective.hostAttrs, isClassBased);
            if (currentDirective === hostDirectiveDef)
                break;
        }
        if (hostDirectiveDef !== null) {
            // we only advance the styling cursor if we are collecting data from host bindings.
            // Template executes before host bindings and so if we would update the index,
            // host bindings would not get their statics.
            directives[0 /* STYLING_CURSOR */] = index;
        }
    }
    return stylingKey;
}
/**
 * Convert `TAttrs` into `TStylingStatic`.
 *
 * @param stylingKey existing `TStylingKey` to update or wrap.
 * @param attrs `TAttributes` to process.
 * @param isClassBased `true` if `class` (`false` if `style`)
 */
function collectStylingFromTAttrs(stylingKey, attrs, isClassBased) {
    var desiredMarker = isClassBased ? 1 /* Classes */ : 2 /* Styles */;
    var currentMarker = -1 /* ImplicitAttributes */;
    if (attrs !== null) {
        for (var i = 0; i < attrs.length; i++) {
            var item = attrs[i];
            if (typeof item === 'number') {
                currentMarker = item;
            }
            else {
                if (currentMarker === desiredMarker) {
                    if (!Array.isArray(stylingKey)) {
                        stylingKey = stylingKey === undefined ? [] : ['', stylingKey];
                    }
                    keyValueArraySet(stylingKey, item, isClassBased ? true : attrs[++i]);
                }
            }
        }
    }
    return stylingKey === undefined ? null : stylingKey;
}
/**
 * Retrieve the current `DirectiveDef` which is active when `hostBindings` style instruction is
 * being executed (or `null` if we are in `template`.)
 *
 * @param tData Current `TData` where the `DirectiveDef` will be looked up at.
 */
export function getHostDirectiveDef(tData) {
    var currentDirectiveIndex = getCurrentDirectiveIndex();
    return currentDirectiveIndex === -1 ? null : tData[currentDirectiveIndex];
}
/**
 * Convert user input to `KeyValueArray`.
 *
 * This function takes user input which could be `string`, Object literal, or iterable and converts
 * it into a consistent representation. The output of this is `KeyValueArray` (which is an array
 * where
 * even indexes contain keys and odd indexes contain values for those keys).
 *
 * The advantage of converting to `KeyValueArray` is that we can perform diff in an input
 * independent
 * way.
 * (ie we can compare `foo bar` to `['bar', 'baz'] and determine a set of changes which need to be
 * applied)
 *
 * The fact that `KeyValueArray` is sorted is very important because it allows us to compute the
 * difference in linear fashion without the need to allocate any additional data.
 *
 * For example if we kept this as a `Map` we would have to iterate over previous `Map` to determine
 * which values need to be deleted, over the new `Map` to determine additions, and we would have to
 * keep additional `Map` to keep track of duplicates or items which have not yet been visited.
 *
 * @param keyValueArraySet (See `keyValueArraySet` in "util/array_utils") Gets passed in as a
 * function so that
 *        `style` can pass in version which does sanitization. This is done for tree shaking
 *        purposes.
 * @param stringParser The parser is passed in so that it will be tree shakable. See
 *        `styleStringParser` and `classStringParser`
 * @param value The value to parse/convert to `KeyValueArray`
 */
export function toStylingKeyValueArray(keyValueArraySet, stringParser, value) {
    if (value == null /*|| value === undefined */ || value === '')
        return EMPTY_ARRAY;
    var styleKeyValueArray = [];
    if (Array.isArray(value)) {
        for (var i = 0; i < value.length; i++) {
            keyValueArraySet(styleKeyValueArray, value[i], true);
        }
    }
    else if (typeof value === 'object') {
        if (value instanceof Map) {
            value.forEach(function (v, k) { return keyValueArraySet(styleKeyValueArray, k, v); });
        }
        else if (value instanceof Set) {
            value.forEach(function (k) { return keyValueArraySet(styleKeyValueArray, k, true); });
        }
        else {
            for (var key in value) {
                if (value.hasOwnProperty(key)) {
                    keyValueArraySet(styleKeyValueArray, key, value[key]);
                }
            }
        }
    }
    else if (typeof value === 'string') {
        stringParser(styleKeyValueArray, value);
    }
    else {
        ngDevMode && throwError('Unsupported styling type ' + typeof value + ': ' + value);
    }
    return styleKeyValueArray;
}
/**
 * Set a `value` for a `key` taking style sanitization into account.
 *
 * See: `keyValueArraySet` for details
 *
 * @param keyValueArray KeyValueArray to add to.
 * @param key Style key to add. (This key will be checked if it needs sanitization)
 * @param value The value to set (If key needs sanitization it will be sanitized)
 */
function styleKeyValueArraySet(keyValueArray, key, value) {
    if (stylePropNeedsSanitization(key)) {
        value = ɵɵsanitizeStyle(value);
    }
    keyValueArraySet(keyValueArray, key, value);
}
/**
 * Update map based styling.
 *
 * Map based styling could be anything which contains more than one binding. For example `string`,
 * `Map`, `Set` or object literal. Dealing with all of these types would complicate the logic so
 * instead this function expects that the complex input is first converted into normalized
 * `KeyValueArray`. The advantage of normalization is that we get the values sorted, which makes it
 * very
 * cheap to compute deltas between the previous and current value.
 *
 * @param tView Associated `TView.data` contains the linked list of binding priorities.
 * @param tNode `TNode` where the binding is located.
 * @param lView `LView` contains the values associated with other styling binding at this `TNode`.
 * @param renderer Renderer to use if any updates.
 * @param oldKeyValueArray Previous value represented as `KeyValueArray`
 * @param newKeyValueArray Current value represented as `KeyValueArray`
 * @param isClassBased `true` if `class` (`false` if `style`)
 * @param bindingIndex Binding index of the binding.
 */
function updateStylingMap(tView, tNode, lView, renderer, oldKeyValueArray, newKeyValueArray, isClassBased, bindingIndex) {
    if (oldKeyValueArray === NO_CHANGE) {
        // On first execution the oldKeyValueArray is NO_CHANGE => treat it as empty KeyValueArray.
        oldKeyValueArray = EMPTY_ARRAY;
    }
    var oldIndex = 0;
    var newIndex = 0;
    var oldKey = 0 < oldKeyValueArray.length ? oldKeyValueArray[0] : null;
    var newKey = 0 < newKeyValueArray.length ? newKeyValueArray[0] : null;
    while (oldKey !== null || newKey !== null) {
        ngDevMode && assertLessThan(oldIndex, 999, 'Are we stuck in infinite loop?');
        ngDevMode && assertLessThan(newIndex, 999, 'Are we stuck in infinite loop?');
        var oldValue = oldIndex < oldKeyValueArray.length ? oldKeyValueArray[oldIndex + 1] : undefined;
        var newValue = newIndex < newKeyValueArray.length ? newKeyValueArray[newIndex + 1] : undefined;
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
            // DELETE: oldKey key is missing or we did not find the oldKey in the newValue
            // (because the keyValueArray is sorted and `newKey` is found later alphabetically).
            // `"background" < "color"` so we need to delete `"background"` because it is not found in the
            // new array.
            oldIndex += 2;
            setKey = oldKey;
        }
        else {
            // CREATE: newKey's is earlier alphabetically than oldKey's (or no oldKey) => we have new key.
            // `"color" > "background"` so we need to add `color` because it is in new array but not in
            // old array.
            ngDevMode && assertDefined(newKey, 'Expecting to have a valid key');
            newIndex += 2;
            setKey = newKey;
            setValue = newValue;
        }
        if (setKey !== null) {
            updateStyling(tView, tNode, lView, renderer, setKey, setValue, isClassBased, bindingIndex);
        }
        oldKey = oldIndex < oldKeyValueArray.length ? oldKeyValueArray[oldIndex] : null;
        newKey = newIndex < newKeyValueArray.length ? newKeyValueArray[newIndex] : null;
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
 * @param value Either style value for `prop` or `true`/`false` if `prop` is class.
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
        findStylingValue(tData, tNode, lView, prop, getTStylingRangeNext(tRange), isClassBased) :
        undefined;
    if (!isStylingValuePresent(higherPriorityValue)) {
        // We don't have a next duplicate, or we did not find a duplicate value.
        if (!isStylingValuePresent(value)) {
            // We should delete current value or restore to lower priority value.
            if (getTStylingRangePrevDuplicate(tRange)) {
                // We have a possible prev duplicate, let's retrieve it.
                value = findStylingValue(tData, null, lView, prop, bindingIndex, isClassBased);
            }
        }
        var rNode = getNativeByIndex(getSelectedIndex(), lView);
        applyStyling(renderer, isClassBased, rNode, prop, value);
    }
}
/**
 * Search for styling value with higher priority which is overwriting current value, or a
 * value of lower priority to which we should fall back if the value is `undefined`.
 *
 * When value is being applied at a location, related values need to be consulted.
 * - If there is a higher priority binding, we should be using that one instead.
 *   For example `<div  [style]="{color:exp1}" [style.color]="exp2">` change to `exp1`
 *   requires that we check `exp2` to see if it is set to value other than `undefined`.
 * - If there is a lower priority binding and we are changing to `undefined`
 *   For example `<div  [style]="{color:exp1}" [style.color]="exp2">` change to `exp2` to
 *   `undefined` requires that we check `exp1` (and static values) and use that as new value.
 *
 * NOTE: The styling stores two values.
 * 1. The raw value which came from the application is stored at `index + 0` location. (This value
 *    is used for dirty checking).
 * 2. The normalized value (converted to `KeyValueArray` if map and sanitized) is stored at `index +
 * 1`.
 *    The advantage of storing the sanitized value is that once the value is written we don't need
 *    to worry about sanitizing it later or keeping track of the sanitizer.
 *
 * @param tData `TData` used for traversing the priority.
 * @param tNode `TNode` to use for resolving static styling. Also controls search direction.
 *   - `TNode` search next and quit as soon as `isStylingValuePresent(value)` is true.
 *      If no value found consult `tNode.residualStyle`/`tNode.residualClass` for default value.
 *   - `null` search prev and go all the way to end. Return last value where
 *     `isStylingValuePresent(value)` is true.
 * @param lView `LView` used for retrieving the actual values.
 * @param prop Property which we are interested in.
 * @param index Starting index in the linked list of styling bindings where the search should start.
 * @param isClassBased `true` if `class` (`false` if `style`)
 */
function findStylingValue(tData, tNode, lView, prop, index, isClassBased) {
    // `TNode` to use for resolving static styling. Also controls search direction.
    //   - `TNode` search next and quit as soon as `isStylingValuePresent(value)` is true.
    //      If no value found consult `tNode.residualStyle`/`tNode.residualClass` for default value.
    //   - `null` search prev and go all the way to end. Return last value where
    //     `isStylingValuePresent(value)` is true.
    var isPrevDirection = tNode === null;
    var value = undefined;
    while (index > 0) {
        var rawKey = tData[index];
        var containsStatics = Array.isArray(rawKey);
        // Unwrap the key if we contain static values.
        var key = containsStatics ? rawKey[1] : rawKey;
        var currentValue = key === null ? keyValueArrayGet(lView[index + 1], prop) :
            key === prop ? lView[index + 1] : undefined;
        if (containsStatics && !isStylingValuePresent(currentValue)) {
            currentValue = keyValueArrayGet(rawKey, prop);
        }
        if (isStylingValuePresent(currentValue)) {
            value = currentValue;
            if (isPrevDirection) {
                return value;
            }
        }
        var tRange = tData[index + 1];
        index = isPrevDirection ? getTStylingRangePrev(tRange) : getTStylingRangeNext(tRange);
    }
    if (tNode !== null) {
        // in case where we are going in next direction AND we did not find anything, we need to
        // consult residual styling
        var residual = isClassBased ? tNode.residualClasses : tNode.residualStyles;
        if (residual != null /** OR residual !=== undefined */) {
            value = keyValueArrayGet(residual, prop);
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
 * Sanitizes or adds suffix to the value.
 *
 * If value is `null`/`undefined` no suffix is added
 * @param value
 * @param suffixOrSanitizer
 */
function normalizeAndApplySuffixOrSanitizer(value, suffixOrSanitizer) {
    if (value == null /** || value === undefined */) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3R5bGluZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaW5zdHJ1Y3Rpb25zL3N0eWxpbmcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztFQU1FO0FBRUYsT0FBTyxFQUFZLGVBQWUsRUFBQyxNQUFNLDJCQUEyQixDQUFDO0FBQ3JFLE9BQU8sRUFBQywwQkFBMEIsRUFBRSxlQUFlLEVBQUMsTUFBTSxpQ0FBaUMsQ0FBQztBQUU1RixPQUFPLEVBQWdCLGdCQUFnQixFQUFFLGdCQUFnQixFQUFDLE1BQU0sd0JBQXdCLENBQUM7QUFDekYsT0FBTyxFQUFDLGFBQWEsRUFBRSxXQUFXLEVBQUUsd0JBQXdCLEVBQUUsY0FBYyxFQUFFLGNBQWMsRUFBaUIsVUFBVSxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDbEosT0FBTyxFQUFDLFdBQVcsRUFBQyxNQUFNLGtCQUFrQixDQUFDO0FBQzdDLE9BQU8sRUFBQyxzQkFBc0IsRUFBRSxTQUFTLEVBQUMsTUFBTSxzQkFBc0IsQ0FBQztBQUN2RSxPQUFPLEVBQUMscUJBQXFCLEVBQUMsTUFBTSxXQUFXLENBQUM7QUFDaEQsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLGFBQWEsQ0FBQztBQUszQyxPQUFPLEVBQTZCLG9CQUFvQixFQUFFLDZCQUE2QixFQUFFLG9CQUFvQixFQUFFLDZCQUE2QixFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDM0ssT0FBTyxFQUFDLGFBQWEsRUFBUyxRQUFRLEVBQVMsS0FBSyxFQUFRLE1BQU0sb0JBQW9CLENBQUM7QUFDdkYsT0FBTyxFQUFDLFlBQVksRUFBQyxNQUFNLHNCQUFzQixDQUFDO0FBQ2xELE9BQU8sRUFBQyx3QkFBd0IsRUFBRSx3QkFBd0IsRUFBRSxRQUFRLEVBQUUsZ0JBQWdCLEVBQUUscUJBQXFCLEVBQUUsd0JBQXdCLEVBQUMsTUFBTSxVQUFV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UUFDL0MsYUFBYTtLQUNkO1NBQU0sSUFBSSxPQUFPLGlCQUFpQixLQUFLLFVBQVUsRUFBRTtRQUNsRCxzQkFBc0I7UUFDdEIsS0FBSyxHQUFHLGlCQUFpQixDQUFDLEtBQUssQ0FBQyxDQUFDO0tBQ2xDO1NBQU0sSUFBSSxPQUFPLGlCQUFpQixLQUFLLFFBQVEsRUFBRTtRQUNoRCxLQUFLLEdBQUcsS0FBSyxHQUFHLGlCQUFpQixDQUFDO0tBQ25DO1NBQU0sSUFBSSxPQUFPLEtBQUssS0FBSyxRQUFRLEVBQUU7UUFDcEMsS0FBSyxHQUFHLFNBQVMsQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztLQUMzQztJQUNELE9BQU8sS0FBSyxDQUFDO0FBQ2YsQ0FBQztBQUdEOzs7Ozs7OztHQVFHO0FBQ0gsTUFBTSxVQUFVLHFCQUFxQixDQUFDLEtBQVksRUFBRSxZQUFxQjtJQUN2RSxPQUFPLENBQUMsS0FBSyxDQUFDLEtBQUssR0FBRyxDQUFDLFlBQVksQ0FBQyxDQUFDLHdCQUEwQixDQUFDLHVCQUF5QixDQUFDLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDcEcsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuKiBAbGljZW5zZVxuKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbipcbiogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuKi9cblxuaW1wb3J0IHtTYWZlVmFsdWUsIHVud3JhcFNhZmVWYWx1ZX0gZnJvbSAnLi4vLi4vc2FuaXRpemF0aW9uL2J5cGFzcyc7XG5pbXBvcnQge3N0eWxlUHJvcE5lZWRzU2FuaXRpemF0aW9uLCDJtcm1c2FuaXRpemVTdHlsZX0gZnJvbSAnLi4vLi4vc2FuaXRpemF0aW9uL3Nhbml0aXphdGlvbic7XG5pbXBvcnQge1N0eWxlU2FuaXRpemVGbn0gZnJvbSAnLi4vLi4vc2FuaXRpemF0aW9uL3N0eWxlX3Nhbml0aXplcic7XG5pbXBvcnQge0tleVZhbHVlQXJyYXksIGtleVZhbHVlQXJyYXlHZXQsIGtleVZhbHVlQXJyYXlTZXR9IGZyb20gJy4uLy4uL3V0aWwvYXJyYXlfdXRpbHMnO1xuaW1wb3J0IHthc3NlcnREZWZpbmVkLCBhc3NlcnRFcXVhbCwgYXNzZXJ0R3JlYXRlclRoYW5PckVxdWFsLCBhc3NlcnRMZXNzVGhhbiwgYXNzZXJ0Tm90RXF1YWwsIGFzc2VydE5vdFNhbWUsIHRocm93RXJyb3J9IGZyb20gJy4uLy4uL3V0aWwvYXNzZXJ0JztcbmltcG9ydCB7RU1QVFlfQVJSQVl9IGZyb20gJy4uLy4uL3V0aWwvZW1wdHknO1xuaW1wb3J0IHtjb25jYXRTdHJpbmdzV2l0aFNwYWNlLCBzdHJpbmdpZnl9IGZyb20gJy4uLy4uL3V0aWwvc3RyaW5naWZ5JztcbmltcG9ydCB7YXNzZXJ0Rmlyc3RVcGRhdGVQYXNzfSBmcm9tICcuLi9hc3NlcnQnO1xuaW1wb3J0IHtiaW5kaW5nVXBkYXRlZH0gZnJvbSAnLi4vYmluZGluZ3MnO1xuaW1wb3J0IHtEaXJlY3RpdmVEZWZ9IGZyb20gJy4uL2ludGVyZmFjZXMvZGVmaW5pdGlvbic7XG5pbXBvcnQge0F0dHJpYnV0ZU1hcmtlciwgRGlyZWN0aXZlRGVmcywgVEF0dHJpYnV0ZXMsIFROb2RlLCBUTm9kZUZsYWdzLCBUTm9kZVR5cGV9IGZyb20gJy4uL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge1JFbGVtZW50LCBSZW5kZXJlcjN9IGZyb20gJy4uL2ludGVyZmFjZXMvcmVuZGVyZXInO1xuaW1wb3J0IHtTYW5pdGl6ZXJGbn0gZnJvbSAnLi4vaW50ZXJmYWNlcy9zYW5pdGl6YXRpb24nO1xuaW1wb3J0IHtUU3R5bGluZ0tleSwgVFN0eWxpbmdSYW5nZSwgZ2V0VFN0eWxpbmdSYW5nZU5leHQsIGdldFRTdHlsaW5nUmFuZ2VOZXh0RHVwbGljYXRlLCBnZXRUU3R5bGluZ1JhbmdlUHJldiwgZ2V0VFN0eWxpbmdSYW5nZVByZXZEdXBsaWNhdGV9IGZyb20gJy4uL2ludGVyZmFjZXMvc3R5bGluZyc7XG5pbXBvcnQge0hFQURFUl9PRkZTRVQsIExWaWV3LCBSRU5ERVJFUiwgVERhdGEsIFRWSUVXLCBUVmlld30gZnJvbSAnLi4vaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7YXBwbHlTdHlsaW5nfSBmcm9tICcuLi9ub2RlX21hbmlwdWxhdGlvbic7XG5pbXBvcnQge2dldEN1cnJlbnREaXJlY3RpdmVJbmRleCwgZ2V0Q3VycmVudFN0eWxlU2FuaXRpemVyLCBnZXRMVmlldywgZ2V0U2VsZWN0ZWRJbmRleCwgaW5jcmVtZW50QmluZGluZ0luZGV4LCBzZXRDdXJyZW50U3R5bGVTYW5pdGl6ZXJ9IGZyb20gJy4uL3N0YXRlJztcbmltcG9ydCB7aW5zZXJ0VFN0eWxpbmdCaW5kaW5nfSBmcm9tICcuLi9zdHlsaW5nL3N0eWxlX2JpbmRpbmdfbGlzdCc7XG5pbXBvcnQge2dldExhc3RQYXJzZWRLZXksIGdldExhc3RQYXJzZWRWYWx1ZSwgcGFyc2VDbGFzc05hbWUsIHBhcnNlQ2xhc3NOYW1lTmV4dCwgcGFyc2VTdHlsZSwgcGFyc2VTdHlsZU5leHR9IGZyb20gJy4uL3N0eWxpbmcvc3R5bGluZ19wYXJzZXInO1xuaW1wb3J0IHtOT19DSEFOR0V9IGZyb20gJy4uL3Rva2Vucyc7XG5pbXBvcnQge2dldE5hdGl2ZUJ5SW5kZXh9IGZyb20gJy4uL3V0aWwvdmlld191dGlscyc7XG5pbXBvcnQge3NldERpcmVjdGl2ZUlucHV0c1doaWNoU2hhZG93c1N0eWxpbmd9IGZyb20gJy4vcHJvcGVydHknO1xuXG5cbi8qKlxuICogU2V0cyB0aGUgY3VycmVudCBzdHlsZSBzYW5pdGl6ZXIgZnVuY3Rpb24gd2hpY2ggd2lsbCB0aGVuIGJlIHVzZWRcbiAqIHdpdGhpbiBhbGwgZm9sbG93LXVwIHByb3AgYW5kIG1hcC1iYXNlZCBzdHlsZSBiaW5kaW5nIGluc3RydWN0aW9uc1xuICogZm9yIHRoZSBnaXZlbiBlbGVtZW50LlxuICpcbiAqIE5vdGUgdGhhdCBvbmNlIHN0eWxpbmcgaGFzIGJlZW4gYXBwbGllZCB0byB0aGUgZWxlbWVudCAoaS5lLiBvbmNlXG4gKiBgYWR2YW5jZShuKWAgaXMgZXhlY3V0ZWQgb3IgdGhlIGhvc3RCaW5kaW5ncy90ZW1wbGF0ZSBmdW5jdGlvbiBleGl0cylcbiAqIHRoZW4gdGhlIGFjdGl2ZSBgc2FuaXRpemVyRm5gIHdpbGwgYmUgc2V0IHRvIGBudWxsYC4gVGhpcyBtZWFucyB0aGF0XG4gKiBvbmNlIHN0eWxpbmcgaXMgYXBwbGllZCB0byBhbm90aGVyIGVsZW1lbnQgdGhlbiBhIGFub3RoZXIgY2FsbCB0b1xuICogYHN0eWxlU2FuaXRpemVyYCB3aWxsIG5lZWQgdG8gYmUgbWFkZS5cbiAqXG4gKiBAcGFyYW0gc2FuaXRpemVyRm4gVGhlIHNhbml0aXphdGlvbiBmdW5jdGlvbiB0aGF0IHdpbGwgYmUgdXNlZCB0b1xuICogICAgICAgcHJvY2VzcyBzdHlsZSBwcm9wL3ZhbHVlIGVudHJpZXMuXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVzdHlsZVNhbml0aXplcihzYW5pdGl6ZXI6IFN0eWxlU2FuaXRpemVGbiB8IG51bGwpOiB2b2lkIHtcbiAgc2V0Q3VycmVudFN0eWxlU2FuaXRpemVyKHNhbml0aXplcik7XG59XG5cbi8qKlxuICogVXBkYXRlIGEgc3R5bGUgYmluZGluZyBvbiBhbiBlbGVtZW50IHdpdGggdGhlIHByb3ZpZGVkIHZhbHVlLlxuICpcbiAqIElmIHRoZSBzdHlsZSB2YWx1ZSBpcyBmYWxzeSB0aGVuIGl0IHdpbGwgYmUgcmVtb3ZlZCBmcm9tIHRoZSBlbGVtZW50XG4gKiAob3IgYXNzaWduZWQgYSBkaWZmZXJlbnQgdmFsdWUgZGVwZW5kaW5nIGlmIHRoZXJlIGFyZSBhbnkgc3R5bGVzIHBsYWNlZFxuICogb24gdGhlIGVsZW1lbnQgd2l0aCBgc3R5bGVNYXBgIG9yIGFueSBzdGF0aWMgc3R5bGVzIHRoYXQgYXJlXG4gKiBwcmVzZW50IGZyb20gd2hlbiB0aGUgZWxlbWVudCB3YXMgY3JlYXRlZCB3aXRoIGBzdHlsaW5nYCkuXG4gKlxuICogTm90ZSB0aGF0IHRoZSBzdHlsaW5nIGVsZW1lbnQgaXMgdXBkYXRlZCBhcyBwYXJ0IG9mIGBzdHlsaW5nQXBwbHlgLlxuICpcbiAqIEBwYXJhbSBwcm9wIEEgdmFsaWQgQ1NTIHByb3BlcnR5LlxuICogQHBhcmFtIHZhbHVlIE5ldyB2YWx1ZSB0byB3cml0ZSAoYG51bGxgIG9yIGFuIGVtcHR5IHN0cmluZyB0byByZW1vdmUpLlxuICogQHBhcmFtIHN1ZmZpeCBPcHRpb25hbCBzdWZmaXguIFVzZWQgd2l0aCBzY2FsYXIgdmFsdWVzIHRvIGFkZCB1bml0IHN1Y2ggYXMgYHB4YC5cbiAqICAgICAgICBOb3RlIHRoYXQgd2hlbiBhIHN1ZmZpeCBpcyBwcm92aWRlZCB0aGVuIHRoZSB1bmRlcmx5aW5nIHNhbml0aXplciB3aWxsXG4gKiAgICAgICAgYmUgaWdub3JlZC5cbiAqXG4gKiBOb3RlIHRoYXQgdGhpcyB3aWxsIGFwcGx5IHRoZSBwcm92aWRlZCBzdHlsZSB2YWx1ZSB0byB0aGUgaG9zdCBlbGVtZW50IGlmIHRoaXMgZnVuY3Rpb24gaXMgY2FsbGVkXG4gKiB3aXRoaW4gYSBob3N0IGJpbmRpbmcgZnVuY3Rpb24uXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVzdHlsZVByb3AoXG4gICAgcHJvcDogc3RyaW5nLCB2YWx1ZTogc3RyaW5nIHwgbnVtYmVyIHwgU2FmZVZhbHVlIHwgdW5kZWZpbmVkIHwgbnVsbCxcbiAgICBzdWZmaXg/OiBzdHJpbmcgfCBudWxsKTogdHlwZW9mIMm1ybVzdHlsZVByb3Age1xuICBjaGVja1N0eWxpbmdQcm9wZXJ0eShwcm9wLCB2YWx1ZSwgc3VmZml4LCBmYWxzZSk7XG4gIHJldHVybiDJtcm1c3R5bGVQcm9wO1xufVxuXG4vKipcbiAqIFVwZGF0ZSBhIGNsYXNzIGJpbmRpbmcgb24gYW4gZWxlbWVudCB3aXRoIHRoZSBwcm92aWRlZCB2YWx1ZS5cbiAqXG4gKiBUaGlzIGluc3RydWN0aW9uIGlzIG1lYW50IHRvIGhhbmRsZSB0aGUgYFtjbGFzcy5mb29dPVwiZXhwXCJgIGNhc2UgYW5kLFxuICogdGhlcmVmb3JlLCB0aGUgY2xhc3MgYmluZGluZyBpdHNlbGYgbXVzdCBhbHJlYWR5IGJlIGFsbG9jYXRlZCB1c2luZ1xuICogYHN0eWxpbmdgIHdpdGhpbiB0aGUgY3JlYXRpb24gYmxvY2suXG4gKlxuICogQHBhcmFtIHByb3AgQSB2YWxpZCBDU1MgY2xhc3MgKG9ubHkgb25lKS5cbiAqIEBwYXJhbSB2YWx1ZSBBIHRydWUvZmFsc2UgdmFsdWUgd2hpY2ggd2lsbCB0dXJuIHRoZSBjbGFzcyBvbiBvciBvZmYuXG4gKlxuICogTm90ZSB0aGF0IHRoaXMgd2lsbCBhcHBseSB0aGUgcHJvdmlkZWQgY2xhc3MgdmFsdWUgdG8gdGhlIGhvc3QgZWxlbWVudCBpZiB0aGlzIGZ1bmN0aW9uXG4gKiBpcyBjYWxsZWQgd2l0aGluIGEgaG9zdCBiaW5kaW5nIGZ1bmN0aW9uLlxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1Y2xhc3NQcm9wKFxuICAgIGNsYXNzTmFtZTogc3RyaW5nLCB2YWx1ZTogYm9vbGVhbiB8IHVuZGVmaW5lZCB8IG51bGwpOiB0eXBlb2YgybXJtWNsYXNzUHJvcCB7XG4gIGNoZWNrU3R5bGluZ1Byb3BlcnR5KGNsYXNzTmFtZSwgdmFsdWUsIG51bGwsIHRydWUpO1xuICByZXR1cm4gybXJtWNsYXNzUHJvcDtcbn1cblxuXG4vKipcbiAqIFVwZGF0ZSBzdHlsZSBiaW5kaW5ncyB1c2luZyBhbiBvYmplY3QgbGl0ZXJhbCBvbiBhbiBlbGVtZW50LlxuICpcbiAqIFRoaXMgaW5zdHJ1Y3Rpb24gaXMgbWVhbnQgdG8gYXBwbHkgc3R5bGluZyB2aWEgdGhlIGBbc3R5bGVdPVwiZXhwXCJgIHRlbXBsYXRlIGJpbmRpbmdzLlxuICogV2hlbiBzdHlsZXMgYXJlIGFwcGxpZWQgdG8gdGhlIGVsZW1lbnQgdGhleSB3aWxsIHRoZW4gYmUgdXBkYXRlZCB3aXRoIHJlc3BlY3QgdG9cbiAqIGFueSBzdHlsZXMvY2xhc3NlcyBzZXQgdmlhIGBzdHlsZVByb3BgLiBJZiBhbnkgc3R5bGVzIGFyZSBzZXQgdG8gZmFsc3lcbiAqIHRoZW4gdGhleSB3aWxsIGJlIHJlbW92ZWQgZnJvbSB0aGUgZWxlbWVudC5cbiAqXG4gKiBOb3RlIHRoYXQgdGhlIHN0eWxpbmcgaW5zdHJ1Y3Rpb24gd2lsbCBub3QgYmUgYXBwbGllZCB1bnRpbCBgc3R5bGluZ0FwcGx5YCBpcyBjYWxsZWQuXG4gKlxuICogQHBhcmFtIHN0eWxlcyBBIGtleS92YWx1ZSBzdHlsZSBtYXAgb2YgdGhlIHN0eWxlcyB0aGF0IHdpbGwgYmUgYXBwbGllZCB0byB0aGUgZ2l2ZW4gZWxlbWVudC5cbiAqICAgICAgICBBbnkgbWlzc2luZyBzdHlsZXMgKHRoYXQgaGF2ZSBhbHJlYWR5IGJlZW4gYXBwbGllZCB0byB0aGUgZWxlbWVudCBiZWZvcmVoYW5kKSB3aWxsIGJlXG4gKiAgICAgICAgcmVtb3ZlZCAodW5zZXQpIGZyb20gdGhlIGVsZW1lbnQncyBzdHlsaW5nLlxuICpcbiAqIE5vdGUgdGhhdCB0aGlzIHdpbGwgYXBwbHkgdGhlIHByb3ZpZGVkIHN0eWxlTWFwIHZhbHVlIHRvIHRoZSBob3N0IGVsZW1lbnQgaWYgdGhpcyBmdW5jdGlvblxuICogaXMgY2FsbGVkIHdpdGhpbiBhIGhvc3QgYmluZGluZy5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtXN0eWxlTWFwKFxuICAgIHN0eWxlczoge1tzdHlsZU5hbWU6IHN0cmluZ106IGFueX0gfCBNYXA8c3RyaW5nLCBzdHJpbmd8bnVtYmVyfG51bGx8dW5kZWZpbmVkPnwgc3RyaW5nIHxcbiAgICB1bmRlZmluZWQgfCBudWxsKTogdm9pZCB7XG4gIGNoZWNrU3R5bGluZ01hcChzdHlsZUtleVZhbHVlQXJyYXlTZXQsIHN0eWxlU3RyaW5nUGFyc2VyLCBzdHlsZXMsIGZhbHNlKTtcbn1cblxuXG4vKipcbiAqIFBhcnNlIHRleHQgYXMgc3R5bGUgYW5kIGFkZCB2YWx1ZXMgdG8gS2V5VmFsdWVBcnJheS5cbiAqXG4gKiBUaGlzIGNvZGUgaXMgcHVsbGVkIG91dCB0byBhIHNlcGFyYXRlIGZ1bmN0aW9uIHNvIHRoYXQgaXQgY2FuIGJlIHRyZWUgc2hha2VuIGF3YXkgaWYgaXQgaXMgbm90XG4gKiBuZWVkZWQuIEl0IGlzIG9ubHkgcmVmZXJlbmNlZCBmcm9tIGDJtcm1c3R5bGVNYXBgLlxuICpcbiAqIEBwYXJhbSBrZXlWYWx1ZUFycmF5IEtleVZhbHVlQXJyYXkgdG8gYWRkIHBhcnNlZCB2YWx1ZXMgdG8uXG4gKiBAcGFyYW0gdGV4dCB0ZXh0IHRvIHBhcnNlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gc3R5bGVTdHJpbmdQYXJzZXIoa2V5VmFsdWVBcnJheTogS2V5VmFsdWVBcnJheTxhbnk+LCB0ZXh0OiBzdHJpbmcpOiB2b2lkIHtcbiAgZm9yIChsZXQgaSA9IHBhcnNlU3R5bGUodGV4dCk7IGkgPj0gMDsgaSA9IHBhcnNlU3R5bGVOZXh0KHRleHQsIGkpKSB7XG4gICAgc3R5bGVLZXlWYWx1ZUFycmF5U2V0KGtleVZhbHVlQXJyYXksIGdldExhc3RQYXJzZWRLZXkodGV4dCksIGdldExhc3RQYXJzZWRWYWx1ZSh0ZXh0KSk7XG4gIH1cbn1cblxuXG4vKipcbiAqIFVwZGF0ZSBjbGFzcyBiaW5kaW5ncyB1c2luZyBhbiBvYmplY3QgbGl0ZXJhbCBvciBjbGFzcy1zdHJpbmcgb24gYW4gZWxlbWVudC5cbiAqXG4gKiBUaGlzIGluc3RydWN0aW9uIGlzIG1lYW50IHRvIGFwcGx5IHN0eWxpbmcgdmlhIHRoZSBgW2NsYXNzXT1cImV4cFwiYCB0ZW1wbGF0ZSBiaW5kaW5ncy5cbiAqIFdoZW4gY2xhc3NlcyBhcmUgYXBwbGllZCB0byB0aGUgZWxlbWVudCB0aGV5IHdpbGwgdGhlbiBiZSB1cGRhdGVkIHdpdGhcbiAqIHJlc3BlY3QgdG8gYW55IHN0eWxlcy9jbGFzc2VzIHNldCB2aWEgYGNsYXNzUHJvcGAuIElmIGFueVxuICogY2xhc3NlcyBhcmUgc2V0IHRvIGZhbHN5IHRoZW4gdGhleSB3aWxsIGJlIHJlbW92ZWQgZnJvbSB0aGUgZWxlbWVudC5cbiAqXG4gKiBOb3RlIHRoYXQgdGhlIHN0eWxpbmcgaW5zdHJ1Y3Rpb24gd2lsbCBub3QgYmUgYXBwbGllZCB1bnRpbCBgc3R5bGluZ0FwcGx5YCBpcyBjYWxsZWQuXG4gKiBOb3RlIHRoYXQgdGhpcyB3aWxsIHRoZSBwcm92aWRlZCBjbGFzc01hcCB2YWx1ZSB0byB0aGUgaG9zdCBlbGVtZW50IGlmIHRoaXMgZnVuY3Rpb24gaXMgY2FsbGVkXG4gKiB3aXRoaW4gYSBob3N0IGJpbmRpbmcuXG4gKlxuICogQHBhcmFtIGNsYXNzZXMgQSBrZXkvdmFsdWUgbWFwIG9yIHN0cmluZyBvZiBDU1MgY2xhc3NlcyB0aGF0IHdpbGwgYmUgYWRkZWQgdG8gdGhlXG4gKiAgICAgICAgZ2l2ZW4gZWxlbWVudC4gQW55IG1pc3NpbmcgY2xhc3NlcyAodGhhdCBoYXZlIGFscmVhZHkgYmVlbiBhcHBsaWVkIHRvIHRoZSBlbGVtZW50XG4gKiAgICAgICAgYmVmb3JlaGFuZCkgd2lsbCBiZSByZW1vdmVkICh1bnNldCkgZnJvbSB0aGUgZWxlbWVudCdzIGxpc3Qgb2YgQ1NTIGNsYXNzZXMuXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVjbGFzc01hcChcbiAgICBjbGFzc2VzOiB7W2NsYXNzTmFtZTogc3RyaW5nXTogYm9vbGVhbiB8IHVuZGVmaW5lZCB8IG51bGx9IHxcbiAgICBNYXA8c3RyaW5nLCBib29sZWFufHVuZGVmaW5lZHxudWxsPnwgU2V0PHN0cmluZz58IHN0cmluZ1tdIHwgc3RyaW5nIHwgdW5kZWZpbmVkIHwgbnVsbCk6IHZvaWQge1xuICBjaGVja1N0eWxpbmdNYXAoa2V5VmFsdWVBcnJheVNldCwgY2xhc3NTdHJpbmdQYXJzZXIsIGNsYXNzZXMsIHRydWUpO1xufVxuXG4vKipcbiAqIFBhcnNlIHRleHQgYXMgY2xhc3MgYW5kIGFkZCB2YWx1ZXMgdG8gS2V5VmFsdWVBcnJheS5cbiAqXG4gKiBUaGlzIGNvZGUgaXMgcHVsbGVkIG91dCB0byBhIHNlcGFyYXRlIGZ1bmN0aW9uIHNvIHRoYXQgaXQgY2FuIGJlIHRyZWUgc2hha2VuIGF3YXkgaWYgaXQgaXMgbm90XG4gKiBuZWVkZWQuIEl0IGlzIG9ubHkgcmVmZXJlbmNlZCBmcm9tIGDJtcm1Y2xhc3NNYXBgLlxuICpcbiAqIEBwYXJhbSBrZXlWYWx1ZUFycmF5IEtleVZhbHVlQXJyYXkgdG8gYWRkIHBhcnNlZCB2YWx1ZXMgdG8uXG4gKiBAcGFyYW0gdGV4dCB0ZXh0IHRvIHBhcnNlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY2xhc3NTdHJpbmdQYXJzZXIoa2V5VmFsdWVBcnJheTogS2V5VmFsdWVBcnJheTxhbnk+LCB0ZXh0OiBzdHJpbmcpOiB2b2lkIHtcbiAgZm9yIChsZXQgaSA9IHBhcnNlQ2xhc3NOYW1lKHRleHQpOyBpID49IDA7IGkgPSBwYXJzZUNsYXNzTmFtZU5leHQodGV4dCwgaSkpIHtcbiAgICBrZXlWYWx1ZUFycmF5U2V0KGtleVZhbHVlQXJyYXksIGdldExhc3RQYXJzZWRLZXkodGV4dCksIHRydWUpO1xuICB9XG59XG5cbi8qKlxuICogQ29tbW9uIGNvZGUgYmV0d2VlbiBgybXJtWNsYXNzUHJvcGAgYW5kIGDJtcm1c3R5bGVQcm9wYC5cbiAqXG4gKiBAcGFyYW0gcHJvcCBwcm9wZXJ0eSBuYW1lLlxuICogQHBhcmFtIHZhbHVlIGJpbmRpbmcgdmFsdWUuXG4gKiBAcGFyYW0gc3VmZml4T3JTYW5pdGl6ZXIgc3VmZml4IG9yIHNhbml0aXphdGlvbiBmdW5jdGlvblxuICogQHBhcmFtIGlzQ2xhc3NCYXNlZCBgdHJ1ZWAgaWYgYGNsYXNzYCBjaGFuZ2UgKGBmYWxzZWAgaWYgYHN0eWxlYClcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNoZWNrU3R5bGluZ1Byb3BlcnR5KFxuICAgIHByb3A6IHN0cmluZywgdmFsdWU6IGFueSB8IE5PX0NIQU5HRSxcbiAgICBzdWZmaXhPclNhbml0aXplcjogU2FuaXRpemVyRm4gfCBzdHJpbmcgfCB1bmRlZmluZWQgfCBudWxsLCBpc0NsYXNzQmFzZWQ6IGJvb2xlYW4pOiB2b2lkIHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgLy8gU3R5bGluZyBpbnN0cnVjdGlvbnMgdXNlIDIgc2xvdHMgcGVyIGJpbmRpbmcuXG4gIC8vIDEuIG9uZSBmb3IgdGhlIHZhbHVlIC8gVFN0eWxpbmdLZXlcbiAgLy8gMi4gb25lIGZvciB0aGUgaW50ZXJtaXR0ZW50LXZhbHVlIC8gVFN0eWxpbmdSYW5nZVxuICBjb25zdCBiaW5kaW5nSW5kZXggPSBpbmNyZW1lbnRCaW5kaW5nSW5kZXgoMik7XG4gIGlmICh0Vmlldy5maXJzdFVwZGF0ZVBhc3MpIHtcbiAgICBzdHlsaW5nRmlyc3RVcGRhdGVQYXNzKHRWaWV3LCBwcm9wLCBiaW5kaW5nSW5kZXgsIGlzQ2xhc3NCYXNlZCk7XG4gIH1cbiAgaWYgKHZhbHVlICE9PSBOT19DSEFOR0UgJiYgYmluZGluZ1VwZGF0ZWQobFZpZXcsIGJpbmRpbmdJbmRleCwgdmFsdWUpKSB7XG4gICAgLy8gVGhpcyBpcyBhIHdvcmsgYXJvdW5kLiBPbmNlIFBSIzM0NDgwIGxhbmRzIHRoZSBzYW5pdGl6ZXIgaXMgcGFzc2VkIGV4cGxpY2l0bHkgYW5kIHRoaXMgbGluZVxuICAgIC8vIGNhbiBiZSByZW1vdmVkLlxuICAgIGxldCBzdHlsZVNhbml0aXplcjogU3R5bGVTYW5pdGl6ZUZufG51bGw7XG4gICAgaWYgKHN1ZmZpeE9yU2FuaXRpemVyID09IG51bGwpIHtcbiAgICAgIGlmIChzdHlsZVNhbml0aXplciA9IGdldEN1cnJlbnRTdHlsZVNhbml0aXplcigpKSB7XG4gICAgICAgIHN1ZmZpeE9yU2FuaXRpemVyID0gc3R5bGVTYW5pdGl6ZXIgYXMgYW55O1xuICAgICAgfVxuICAgIH1cbiAgICBjb25zdCB0Tm9kZSA9IHRWaWV3LmRhdGFbZ2V0U2VsZWN0ZWRJbmRleCgpICsgSEVBREVSX09GRlNFVF0gYXMgVE5vZGU7XG4gICAgdXBkYXRlU3R5bGluZyhcbiAgICAgICAgdFZpZXcsIHROb2RlLCBsVmlldywgbFZpZXdbUkVOREVSRVJdLCBwcm9wLFxuICAgICAgICBsVmlld1tiaW5kaW5nSW5kZXggKyAxXSA9IG5vcm1hbGl6ZUFuZEFwcGx5U3VmZml4T3JTYW5pdGl6ZXIodmFsdWUsIHN1ZmZpeE9yU2FuaXRpemVyKSxcbiAgICAgICAgaXNDbGFzc0Jhc2VkLCBiaW5kaW5nSW5kZXgpO1xuICB9XG59XG5cbi8qKlxuICogQ29tbW9uIGNvZGUgYmV0d2VlbiBgybXJtWNsYXNzTWFwYCBhbmQgYMm1ybVzdHlsZU1hcGAuXG4gKlxuICogQHBhcmFtIGtleVZhbHVlQXJyYXlTZXQgKFNlZSBga2V5VmFsdWVBcnJheVNldGAgaW4gXCJ1dGlsL2FycmF5X3V0aWxzXCIpIEdldHMgcGFzc2VkIGluIGFzIGFcbiAqIGZ1bmN0aW9uIHNvIHRoYXRcbiAqICAgICAgICBgc3R5bGVgIGNhbiBwYXNzIGluIHZlcnNpb24gd2hpY2ggZG9lcyBzYW5pdGl6YXRpb24uIFRoaXMgaXMgZG9uZSBmb3IgdHJlZSBzaGFraW5nXG4gKiAgICAgICAgcHVycG9zZXMuXG4gKiBAcGFyYW0gc3RyaW5nUGFyc2VyIFBhcnNlciB1c2VkIHRvIHBhcnNlIGB2YWx1ZWAgaWYgYHN0cmluZ2AuIChQYXNzZWQgaW4gYXMgYHN0eWxlYCBhbmQgYGNsYXNzYFxuICogICAgICAgIGhhdmUgZGlmZmVyZW50IHBhcnNlcnMuKVxuICogQHBhcmFtIHZhbHVlIGJvdW5kIHZhbHVlIGZyb20gYXBwbGljYXRpb25cbiAqIEBwYXJhbSBpc0NsYXNzQmFzZWQgYHRydWVgIGlmIGBjbGFzc2AgY2hhbmdlIChgZmFsc2VgIGlmIGBzdHlsZWApXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjaGVja1N0eWxpbmdNYXAoXG4gICAga2V5VmFsdWVBcnJheVNldDogKGtleVZhbHVlQXJyYXk6IEtleVZhbHVlQXJyYXk8YW55Piwga2V5OiBzdHJpbmcsIHZhbHVlOiBhbnkpID0+IHZvaWQsXG4gICAgc3RyaW5nUGFyc2VyOiAoc3R5bGVLZXlWYWx1ZUFycmF5OiBLZXlWYWx1ZUFycmF5PGFueT4sIHRleHQ6IHN0cmluZykgPT4gdm9pZCxcbiAgICB2YWx1ZTogYW55fE5PX0NIQU5HRSwgaXNDbGFzc0Jhc2VkOiBib29sZWFuKTogdm9pZCB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgdFZpZXcgPSBsVmlld1tUVklFV107XG4gIGNvbnN0IGJpbmRpbmdJbmRleCA9IGluY3JlbWVudEJpbmRpbmdJbmRleCgyKTtcbiAgaWYgKHRWaWV3LmZpcnN0VXBkYXRlUGFzcykge1xuICAgIHN0eWxpbmdGaXJzdFVwZGF0ZVBhc3ModFZpZXcsIG51bGwsIGJpbmRpbmdJbmRleCwgaXNDbGFzc0Jhc2VkKTtcbiAgfVxuICBpZiAodmFsdWUgIT09IE5PX0NIQU5HRSAmJiBiaW5kaW5nVXBkYXRlZChsVmlldywgYmluZGluZ0luZGV4LCB2YWx1ZSkpIHtcbiAgICAvLyBgZ2V0U2VsZWN0ZWRJbmRleCgpYCBzaG91bGQgYmUgaGVyZSAocmF0aGVyIHRoYW4gaW4gaW5zdHJ1Y3Rpb24pIHNvIHRoYXQgaXQgaXMgZ3VhcmRlZCBieSB0aGVcbiAgICAvLyBpZiBzbyBhcyBub3QgdG8gcmVhZCB1bm5lY2Vzc2FyaWx5LlxuICAgIGNvbnN0IHROb2RlID0gdFZpZXcuZGF0YVtnZXRTZWxlY3RlZEluZGV4KCkgKyBIRUFERVJfT0ZGU0VUXSBhcyBUTm9kZTtcbiAgICBpZiAoaGFzU3R5bGluZ0lucHV0U2hhZG93KHROb2RlLCBpc0NsYXNzQmFzZWQpICYmICFpc0luSG9zdEJpbmRpbmdzKHRWaWV3LCBiaW5kaW5nSW5kZXgpKSB7XG4gICAgICBpZiAobmdEZXZNb2RlKSB7XG4gICAgICAgIC8vIHZlcmlmeSB0aGF0IGlmIHdlIGFyZSBzaGFkb3dpbmcgdGhlbiBgVERhdGFgIGlzIGFwcHJvcHJpYXRlbHkgbWFya2VkIHNvIHRoYXQgd2Ugc2tpcFxuICAgICAgICAvLyBwcm9jZXNzaW5nIHRoaXMgYmluZGluZyBpbiBzdHlsaW5nIHJlc29sdXRpb24uXG4gICAgICAgIGNvbnN0IHRTdHlsaW5nS2V5ID0gdFZpZXcuZGF0YVtiaW5kaW5nSW5kZXhdO1xuICAgICAgICBhc3NlcnRFcXVhbChcbiAgICAgICAgICAgIEFycmF5LmlzQXJyYXkodFN0eWxpbmdLZXkpID8gdFN0eWxpbmdLZXlbMV0gOiB0U3R5bGluZ0tleSwgZmFsc2UsXG4gICAgICAgICAgICAnU3R5bGluZyBsaW5rZWQgbGlzdCBzaGFkb3cgaW5wdXQgc2hvdWxkIGJlIG1hcmtlZCBhcyBcXCdmYWxzZVxcJycpO1xuICAgICAgfVxuICAgICAgLy8gVkUgZG9lcyBub3QgY29uY2F0ZW5hdGUgdGhlIHN0YXRpYyBwb3J0aW9uIGxpa2Ugd2UgYXJlIGRvaW5nIGhlcmUuXG4gICAgICAvLyBJbnN0ZWFkIFZFIGp1c3QgaWdub3JlcyB0aGUgc3RhdGljIGNvbXBsZXRlbHkgaWYgZHluYW1pYyBiaW5kaW5nIGlzIHByZXNlbnQuXG4gICAgICAvLyBCZWNhdXNlIG9mIGxvY2FsaXR5IHdlIGhhdmUgYWxyZWFkeSBzZXQgdGhlIHN0YXRpYyBwb3J0aW9uIGJlY2F1c2Ugd2UgZG9uJ3Qga25vdyBpZiB0aGVyZVxuICAgICAgLy8gaXMgYSBkeW5hbWljIHBvcnRpb24gdW50aWwgbGF0ZXIuIElmIHdlIHdvdWxkIGlnbm9yZSB0aGUgc3RhdGljIHBvcnRpb24gaXQgd291bGQgbG9vayBsaWtlXG4gICAgICAvLyB0aGUgYmluZGluZyBoYXMgcmVtb3ZlZCBpdC4gVGhpcyB3b3VsZCBjb25mdXNlIGBbbmdTdHlsZV1gL2BbbmdDbGFzc11gIHRvIGRvIHRoZSB3cm9uZ1xuICAgICAgLy8gdGhpbmcgYXMgaXQgd291bGQgdGhpbmsgdGhhdCB0aGUgc3RhdGljIHBvcnRpb24gd2FzIHJlbW92ZWQuIEZvciB0aGlzIHJlYXNvbiB3ZVxuICAgICAgLy8gY29uY2F0ZW5hdGUgaXQgc28gdGhhdCBgW25nU3R5bGVdYC9gW25nQ2xhc3NdYCAgY2FuIGNvbnRpbnVlIHRvIHdvcmsgb24gY2hhbmdlZC5cbiAgICAgIGxldCBzdGF0aWNQcmVmaXggPSBpc0NsYXNzQmFzZWQgPyB0Tm9kZS5jbGFzc2VzIDogdE5vZGUuc3R5bGVzO1xuICAgICAgbmdEZXZNb2RlICYmIGlzQ2xhc3NCYXNlZCA9PT0gZmFsc2UgJiYgc3RhdGljUHJlZml4ICE9PSBudWxsICYmXG4gICAgICAgICAgYXNzZXJ0RXF1YWwoXG4gICAgICAgICAgICAgIHN0YXRpY1ByZWZpeC5lbmRzV2l0aCgnOycpLCB0cnVlLCAnRXhwZWN0aW5nIHN0YXRpYyBwb3J0aW9uIHRvIGVuZCB3aXRoIFxcJztcXCcnKTtcbiAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIHZhbHVlID0gY29uY2F0U3RyaW5nc1dpdGhTcGFjZShzdGF0aWNQcmVmaXgsIHZhbHVlIGFzIHN0cmluZyk7XG4gICAgICB9XG4gICAgICAvLyBHaXZlbiBgPGRpdiBbc3R5bGVdIG15LWRpcj5gIHN1Y2ggdGhhdCBgbXktZGlyYCBoYXMgYEBJbnB1dCgnc3R5bGUnKWAuXG4gICAgICAvLyBUaGlzIHRha2VzIG92ZXIgdGhlIGBbc3R5bGVdYCBiaW5kaW5nLiAoU2FtZSBmb3IgYFtjbGFzc11gKVxuICAgICAgc2V0RGlyZWN0aXZlSW5wdXRzV2hpY2hTaGFkb3dzU3R5bGluZyh0Tm9kZSwgbFZpZXcsIHZhbHVlLCBpc0NsYXNzQmFzZWQpO1xuICAgIH0gZWxzZSB7XG4gICAgICB1cGRhdGVTdHlsaW5nTWFwKFxuICAgICAgICAgIHRWaWV3LCB0Tm9kZSwgbFZpZXcsIGxWaWV3W1JFTkRFUkVSXSwgbFZpZXdbYmluZGluZ0luZGV4ICsgMV0sXG4gICAgICAgICAgbFZpZXdbYmluZGluZ0luZGV4ICsgMV0gPSB0b1N0eWxpbmdLZXlWYWx1ZUFycmF5KGtleVZhbHVlQXJyYXlTZXQsIHN0cmluZ1BhcnNlciwgdmFsdWUpLFxuICAgICAgICAgIGlzQ2xhc3NCYXNlZCwgYmluZGluZ0luZGV4KTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBEZXRlcm1pbmVzIHdoZW4gdGhlIGJpbmRpbmcgaXMgaW4gYGhvc3RCaW5kaW5nc2Agc2VjdGlvblxuICpcbiAqIEBwYXJhbSB0VmlldyBDdXJyZW50IGBUVmlld2BcbiAqIEBwYXJhbSBiaW5kaW5nSW5kZXggaW5kZXggb2YgYmluZGluZyB3aGljaCB3ZSB3b3VsZCBsaWtlIGlmIGl0IGlzIGluIGBob3N0QmluZGluZ3NgXG4gKi9cbmZ1bmN0aW9uIGlzSW5Ib3N0QmluZGluZ3ModFZpZXc6IFRWaWV3LCBiaW5kaW5nSW5kZXg6IG51bWJlcik6IGJvb2xlYW4ge1xuICAvLyBBbGwgaG9zdCBiaW5kaW5ncyBhcmUgcGxhY2VkIGFmdGVyIHRoZSBleHBhbmRvIHNlY3Rpb24uXG4gIHJldHVybiBiaW5kaW5nSW5kZXggPj0gdFZpZXcuZXhwYW5kb1N0YXJ0SW5kZXg7XG59XG5cbi8qKlxuKiBDb2xsZWN0cyB0aGUgbmVjZXNzYXJ5IGluZm9ybWF0aW9uIHRvIGluc2VydCB0aGUgYmluZGluZyBpbnRvIGEgbGlua2VkIGxpc3Qgb2Ygc3R5bGUgYmluZGluZ3NcbiogdXNpbmcgYGluc2VydFRTdHlsaW5nQmluZGluZ2AuXG4qXG4qIEBwYXJhbSB0VmlldyBgVFZpZXdgIHdoZXJlIHRoZSBiaW5kaW5nIGxpbmtlZCBsaXN0IHdpbGwgYmUgc3RvcmVkLlxuKiBAcGFyYW0gdFN0eWxpbmdLZXkgUHJvcGVydHkva2V5IG9mIHRoZSBiaW5kaW5nLlxuKiBAcGFyYW0gYmluZGluZ0luZGV4IEluZGV4IG9mIGJpbmRpbmcgYXNzb2NpYXRlZCB3aXRoIHRoZSBgcHJvcGBcbiogQHBhcmFtIGlzQ2xhc3NCYXNlZCBgdHJ1ZWAgaWYgYGNsYXNzYCBjaGFuZ2UgKGBmYWxzZWAgaWYgYHN0eWxlYClcbiovXG5mdW5jdGlvbiBzdHlsaW5nRmlyc3RVcGRhdGVQYXNzKFxuICAgIHRWaWV3OiBUVmlldywgdFN0eWxpbmdLZXk6IFRTdHlsaW5nS2V5LCBiaW5kaW5nSW5kZXg6IG51bWJlciwgaXNDbGFzc0Jhc2VkOiBib29sZWFuKTogdm9pZCB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRGaXJzdFVwZGF0ZVBhc3ModFZpZXcpO1xuICBjb25zdCB0RGF0YSA9IHRWaWV3LmRhdGE7XG4gIGlmICh0RGF0YVtiaW5kaW5nSW5kZXggKyAxXSA9PT0gbnVsbCkge1xuICAgIC8vIFRoZSBhYm92ZSBjaGVjayBpcyBuZWNlc3NhcnkgYmVjYXVzZSB3ZSBkb24ndCBjbGVhciBmaXJzdCB1cGRhdGUgcGFzcyB1bnRpbCBmaXJzdCBzdWNjZXNzZnVsXG4gICAgLy8gKG5vIGV4Y2VwdGlvbikgdGVtcGxhdGUgZXhlY3V0aW9uLiBUaGlzIHByZXZlbnRzIHRoZSBzdHlsaW5nIGluc3RydWN0aW9uIGZyb20gZG91YmxlIGFkZGluZ1xuICAgIC8vIGl0c2VsZiB0byB0aGUgbGlzdC5cbiAgICAvLyBgZ2V0U2VsZWN0ZWRJbmRleCgpYCBzaG91bGQgYmUgaGVyZSAocmF0aGVyIHRoYW4gaW4gaW5zdHJ1Y3Rpb24pIHNvIHRoYXQgaXQgaXMgZ3VhcmRlZCBieSB0aGVcbiAgICAvLyBpZiBzbyBhcyBub3QgdG8gcmVhZCB1bm5lY2Vzc2FyaWx5LlxuICAgIGNvbnN0IHROb2RlID0gdERhdGFbZ2V0U2VsZWN0ZWRJbmRleCgpICsgSEVBREVSX09GRlNFVF0gYXMgVE5vZGU7XG4gICAgY29uc3QgaXNIb3N0QmluZGluZ3MgPSBpc0luSG9zdEJpbmRpbmdzKHRWaWV3LCBiaW5kaW5nSW5kZXgpO1xuICAgIGlmIChoYXNTdHlsaW5nSW5wdXRTaGFkb3codE5vZGUsIGlzQ2xhc3NCYXNlZCkgJiYgdFN0eWxpbmdLZXkgPT09IG51bGwgJiYgIWlzSG9zdEJpbmRpbmdzKSB7XG4gICAgICAvLyBgdFN0eWxpbmdLZXkgPT09IG51bGxgIGltcGxpZXMgdGhhdCB3ZSBhcmUgZWl0aGVyIGBbc3R5bGVdYCBvciBgW2NsYXNzXWAgYmluZGluZy5cbiAgICAgIC8vIElmIHRoZXJlIGlzIGEgZGlyZWN0aXZlIHdoaWNoIHVzZXMgYEBJbnB1dCgnc3R5bGUnKWAgb3IgYEBJbnB1dCgnY2xhc3MnKWAgdGhhblxuICAgICAgLy8gd2UgbmVlZCB0byBuZXV0cmFsaXplIHRoaXMgYmluZGluZyBzaW5jZSB0aGF0IGRpcmVjdGl2ZSBpcyBzaGFkb3dpbmcgaXQuXG4gICAgICAvLyBXZSB0dXJuIHRoaXMgaW50byBhIG5vb3AgYnkgc2V0dGluZyB0aGUga2V5IHRvIGBmYWxzZWBcbiAgICAgIHRTdHlsaW5nS2V5ID0gZmFsc2U7XG4gICAgfVxuICAgIHRTdHlsaW5nS2V5ID0gd3JhcEluU3RhdGljU3R5bGluZ0tleSh0RGF0YSwgdE5vZGUsIHRTdHlsaW5nS2V5LCBpc0NsYXNzQmFzZWQpO1xuICAgIGluc2VydFRTdHlsaW5nQmluZGluZyh0RGF0YSwgdE5vZGUsIHRTdHlsaW5nS2V5LCBiaW5kaW5nSW5kZXgsIGlzSG9zdEJpbmRpbmdzLCBpc0NsYXNzQmFzZWQpO1xuICB9XG59XG5cbi8qKlxuICogQWRkcyBzdGF0aWMgc3R5bGluZyBpbmZvcm1hdGlvbiB0byB0aGUgYmluZGluZyBpZiBhcHBsaWNhYmxlLlxuICpcbiAqIFRoZSBsaW5rZWQgbGlzdCBvZiBzdHlsZXMgbm90IG9ubHkgc3RvcmVzIHRoZSBsaXN0IGFuZCBrZXlzLCBidXQgYWxzbyBzdG9yZXMgc3RhdGljIHN0eWxpbmdcbiAqIGluZm9ybWF0aW9uIG9uIHNvbWUgb2YgdGhlIGtleXMuIFRoaXMgZnVuY3Rpb24gZGV0ZXJtaW5lcyBpZiB0aGUga2V5IHNob3VsZCBjb250YWluIHRoZSBzdHlsaW5nXG4gKiBpbmZvcm1hdGlvbiBhbmQgY29tcHV0ZXMgaXQuXG4gKlxuICogU2VlIGBUU3R5bGluZ1N0YXRpY2AgZm9yIG1vcmUgZGV0YWlscy5cbiAqXG4gKiBAcGFyYW0gdERhdGEgYFREYXRhYCB3aGVyZSB0aGUgbGlua2VkIGxpc3QgaXMgc3RvcmVkLlxuICogQHBhcmFtIHROb2RlIGBUTm9kZWAgZm9yIHdoaWNoIHRoZSBzdHlsaW5nIGlzIGJlaW5nIGNvbXB1dGVkLlxuICogQHBhcmFtIHN0eWxpbmdLZXkgYFRTdHlsaW5nS2V5UHJpbWl0aXZlYCB3aGljaCBtYXkgbmVlZCB0byBiZSB3cmFwcGVkIGludG8gYFRTdHlsaW5nS2V5YFxuICogQHBhcmFtIGlzQ2xhc3NCYXNlZCBgdHJ1ZWAgaWYgYGNsYXNzYCAoYGZhbHNlYCBpZiBgc3R5bGVgKVxuICovXG5leHBvcnQgZnVuY3Rpb24gd3JhcEluU3RhdGljU3R5bGluZ0tleShcbiAgICB0RGF0YTogVERhdGEsIHROb2RlOiBUTm9kZSwgc3R5bGluZ0tleTogVFN0eWxpbmdLZXksIGlzQ2xhc3NCYXNlZDogYm9vbGVhbik6IFRTdHlsaW5nS2V5IHtcbiAgY29uc3QgaG9zdERpcmVjdGl2ZURlZiA9IGdldEhvc3REaXJlY3RpdmVEZWYodERhdGEpO1xuICBsZXQgcmVzaWR1YWwgPSBpc0NsYXNzQmFzZWQgPyB0Tm9kZS5yZXNpZHVhbENsYXNzZXMgOiB0Tm9kZS5yZXNpZHVhbFN0eWxlcztcbiAgaWYgKGhvc3REaXJlY3RpdmVEZWYgPT09IG51bGwpIHtcbiAgICAvLyBXZSBhcmUgaW4gdGVtcGxhdGUgbm9kZS5cbiAgICAvLyBJZiB0ZW1wbGF0ZSBub2RlIGFscmVhZHkgaGFkIHN0eWxpbmcgaW5zdHJ1Y3Rpb24gdGhlbiBpdCBoYXMgYWxyZWFkeSBjb2xsZWN0ZWQgdGhlIHN0YXRpY1xuICAgIC8vIHN0eWxpbmcgYW5kIHRoZXJlIGlzIG5vIG5lZWQgdG8gY29sbGVjdCB0aGVtIGFnYWluLiBXZSBrbm93IHRoYXQgd2UgYXJlIHRoZSBmaXJzdCBzdHlsaW5nXG4gICAgLy8gaW5zdHJ1Y3Rpb24gYmVjYXVzZSB0aGUgYFROb2RlLipCaW5kaW5nc2AgcG9pbnRzIHRvIDAgKG5vdGhpbmcgaGFzIGJlZW4gaW5zZXJ0ZWQgeWV0KS5cbiAgICBjb25zdCBpc0ZpcnN0U3R5bGluZ0luc3RydWN0aW9uSW5UZW1wbGF0ZSA9XG4gICAgICAgIChpc0NsYXNzQmFzZWQgPyB0Tm9kZS5jbGFzc0JpbmRpbmdzIDogdE5vZGUuc3R5bGVCaW5kaW5ncykgYXMgYW55IGFzIG51bWJlciA9PT0gMDtcbiAgICBpZiAoaXNGaXJzdFN0eWxpbmdJbnN0cnVjdGlvbkluVGVtcGxhdGUpIHtcbiAgICAgIC8vIEl0IHdvdWxkIGJlIG5pY2UgdG8gYmUgYWJsZSB0byBnZXQgdGhlIHN0YXRpY3MgZnJvbSBgbWVyZ2VBdHRyc2AsIGhvd2V2ZXIsIGF0IHRoaXMgcG9pbnRcbiAgICAgIC8vIHRoZXkgYXJlIGFscmVhZHkgbWVyZ2VkIGFuZCBpdCB3b3VsZCBub3QgYmUgcG9zc2libGUgdG8gZmlndXJlIHdoaWNoIHByb3BlcnR5IGJlbG9uZ3Mgd2hlcmVcbiAgICAgIC8vIGluIHRoZSBwcmlvcml0eS5cbiAgICAgIHN0eWxpbmdLZXkgPSBjb2xsZWN0U3R5bGluZ0Zyb21EaXJlY3RpdmVzKG51bGwsIHREYXRhLCB0Tm9kZSwgc3R5bGluZ0tleSwgaXNDbGFzc0Jhc2VkKTtcbiAgICAgIHN0eWxpbmdLZXkgPSBjb2xsZWN0U3R5bGluZ0Zyb21UQXR0cnMoc3R5bGluZ0tleSwgdE5vZGUuYXR0cnMsIGlzQ2xhc3NCYXNlZCk7XG4gICAgICAvLyBXZSBrbm93IHRoYXQgaWYgd2UgaGF2ZSBzdHlsaW5nIGJpbmRpbmcgaW4gdGVtcGxhdGUgd2UgY2FuJ3QgaGF2ZSByZXNpZHVhbC5cbiAgICAgIHJlc2lkdWFsID0gbnVsbDtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgLy8gV2UgYXJlIGluIGhvc3QgYmluZGluZyBub2RlIGFuZCB0aGVyZSB3YXMgbm8gYmluZGluZyBpbnN0cnVjdGlvbiBpbiB0ZW1wbGF0ZSBub2RlLlxuICAgIC8vIFRoaXMgbWVhbnMgdGhhdCB3ZSBuZWVkIHRvIGNvbXB1dGUgdGhlIHJlc2lkdWFsLlxuICAgIGNvbnN0IGRpcmVjdGl2ZXMgPSB0Tm9kZS5kaXJlY3RpdmVzO1xuICAgIGNvbnN0IGlzRmlyc3RTdHlsaW5nSW5zdHJ1Y3Rpb25Jbkhvc3RCaW5kaW5nID0gZGlyZWN0aXZlcyAhPT0gbnVsbCAmJlxuICAgICAgICBkaXJlY3RpdmVzW2RpcmVjdGl2ZXNbRGlyZWN0aXZlRGVmcy5TVFlMSU5HX0NVUlNPUl1dICE9PSBob3N0RGlyZWN0aXZlRGVmO1xuICAgIGlmIChpc0ZpcnN0U3R5bGluZ0luc3RydWN0aW9uSW5Ib3N0QmluZGluZykge1xuICAgICAgc3R5bGluZ0tleSA9XG4gICAgICAgICAgY29sbGVjdFN0eWxpbmdGcm9tRGlyZWN0aXZlcyhob3N0RGlyZWN0aXZlRGVmLCB0RGF0YSwgdE5vZGUsIHN0eWxpbmdLZXksIGlzQ2xhc3NCYXNlZCk7XG4gICAgICBpZiAocmVzaWR1YWwgPT09IG51bGwpIHtcbiAgICAgICAgLy8gLSBJZiBgbnVsbGAgdGhhbiBlaXRoZXI6XG4gICAgICAgIC8vICAgIC0gVGVtcGxhdGUgc3R5bGluZyBpbnN0cnVjdGlvbiBhbHJlYWR5IHJhbiBhbmQgaXQgaGFzIGNvbnN1bWVkIHRoZSBzdGF0aWNcbiAgICAgICAgLy8gICAgICBzdHlsaW5nIGludG8gaXRzIGBUU3R5bGluZ0tleWAgYW5kIHNvIHRoZXJlIGlzIG5vIG5lZWQgdG8gdXBkYXRlIHJlc2lkdWFsLiBJbnN0ZWFkXG4gICAgICAgIC8vICAgICAgd2UgbmVlZCB0byB1cGRhdGUgdGhlIGBUU3R5bGluZ0tleWAgYXNzb2NpYXRlZCB3aXRoIHRoZSBmaXJzdCB0ZW1wbGF0ZSBub2RlXG4gICAgICAgIC8vICAgICAgaW5zdHJ1Y3Rpb24uIE9SXG4gICAgICAgIC8vICAgIC0gU29tZSBvdGhlciBzdHlsaW5nIGluc3RydWN0aW9uIHJhbiBhbmQgZGV0ZXJtaW5lZCB0aGF0IHRoZXJlIGFyZSBubyByZXNpZHVhbHNcbiAgICAgICAgbGV0IHRlbXBsYXRlU3R5bGluZ0tleSA9IGdldFRlbXBsYXRlSGVhZFRTdHlsaW5nS2V5KHREYXRhLCB0Tm9kZSwgaXNDbGFzc0Jhc2VkKTtcbiAgICAgICAgaWYgKHRlbXBsYXRlU3R5bGluZ0tleSAhPT0gdW5kZWZpbmVkICYmIEFycmF5LmlzQXJyYXkodGVtcGxhdGVTdHlsaW5nS2V5KSkge1xuICAgICAgICAgIC8vIE9ubHkgcmVjb21wdXRlIGlmIGB0ZW1wbGF0ZVN0eWxpbmdLZXlgIGhhZCBzdGF0aWMgdmFsdWVzLiAoSWYgbm8gc3RhdGljIHZhbHVlIGZvdW5kXG4gICAgICAgICAgLy8gdGhlbiB0aGVyZSBpcyBub3RoaW5nIHRvIGRvIHNpbmNlIHRoaXMgb3BlcmF0aW9uIGNhbiBvbmx5IHByb2R1Y2UgbGVzcyBzdGF0aWMga2V5cywgbm90XG4gICAgICAgICAgLy8gbW9yZS4pXG4gICAgICAgICAgdGVtcGxhdGVTdHlsaW5nS2V5ID0gY29sbGVjdFN0eWxpbmdGcm9tRGlyZWN0aXZlcyhcbiAgICAgICAgICAgICAgbnVsbCwgdERhdGEsIHROb2RlLCB0ZW1wbGF0ZVN0eWxpbmdLZXlbMV0gLyogdW53cmFwIHByZXZpb3VzIHN0YXRpY3MgKi8sXG4gICAgICAgICAgICAgIGlzQ2xhc3NCYXNlZCk7XG4gICAgICAgICAgdGVtcGxhdGVTdHlsaW5nS2V5ID1cbiAgICAgICAgICAgICAgY29sbGVjdFN0eWxpbmdGcm9tVEF0dHJzKHRlbXBsYXRlU3R5bGluZ0tleSwgdE5vZGUuYXR0cnMsIGlzQ2xhc3NCYXNlZCk7XG4gICAgICAgICAgc2V0VGVtcGxhdGVIZWFkVFN0eWxpbmdLZXkodERhdGEsIHROb2RlLCBpc0NsYXNzQmFzZWQsIHRlbXBsYXRlU3R5bGluZ0tleSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIFdlIG9ubHkgbmVlZCB0byByZWNvbXB1dGUgcmVzaWR1YWwgaWYgaXQgaXMgbm90IGBudWxsYC5cbiAgICAgICAgLy8gLSBJZiBleGlzdGluZyByZXNpZHVhbCAoaW1wbGllcyB0aGVyZSB3YXMgbm8gdGVtcGxhdGUgc3R5bGluZykuIFRoaXMgbWVhbnMgdGhhdCBzb21lIG9mXG4gICAgICAgIC8vICAgdGhlIHN0YXRpY3MgbWF5IGhhdmUgbW92ZWQgZnJvbSB0aGUgcmVzaWR1YWwgdG8gdGhlIGBzdHlsaW5nS2V5YCBhbmQgc28gd2UgaGF2ZSB0b1xuICAgICAgICAvLyAgIHJlY29tcHV0ZS5cbiAgICAgICAgLy8gLSBJZiBgdW5kZWZpbmVkYCB0aGlzIGlzIHRoZSBmaXJzdCB0aW1lIHdlIGFyZSBydW5uaW5nLlxuICAgICAgICByZXNpZHVhbCA9IGNvbGxlY3RSZXNpZHVhbCh0Tm9kZSwgaXNDbGFzc0Jhc2VkKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgaWYgKHJlc2lkdWFsICE9PSB1bmRlZmluZWQpIHtcbiAgICBpc0NsYXNzQmFzZWQgPyAodE5vZGUucmVzaWR1YWxDbGFzc2VzID0gcmVzaWR1YWwpIDogKHROb2RlLnJlc2lkdWFsU3R5bGVzID0gcmVzaWR1YWwpO1xuICB9XG4gIHJldHVybiBzdHlsaW5nS2V5O1xufVxuXG4vKipcbiAqIFJldHJpZXZlIHRoZSBgVFN0eWxpbmdLZXlgIGZvciB0aGUgdGVtcGxhdGUgc3R5bGluZyBpbnN0cnVjdGlvbi5cbiAqXG4gKiBUaGlzIGlzIG5lZWRlZCBzaW5jZSBgaG9zdEJpbmRpbmdgIHN0eWxpbmcgaW5zdHJ1Y3Rpb25zIGFyZSBpbnNlcnRlZCBhZnRlciB0aGUgdGVtcGxhdGVcbiAqIGluc3RydWN0aW9uLiBXaGlsZSB0aGUgdGVtcGxhdGUgaW5zdHJ1Y3Rpb24gbmVlZHMgdG8gdXBkYXRlIHRoZSByZXNpZHVhbCBpbiBgVE5vZGVgIHRoZVxuICogYGhvc3RCaW5kaW5nYCBpbnN0cnVjdGlvbnMgbmVlZCB0byB1cGRhdGUgdGhlIGBUU3R5bGluZ0tleWAgb2YgdGhlIHRlbXBsYXRlIGluc3RydWN0aW9uIGJlY2F1c2VcbiAqIHRoZSB0ZW1wbGF0ZSBpbnN0cnVjdGlvbiBpcyBkb3duc3RyZWFtIGZyb20gdGhlIGBob3N0QmluZGluZ3NgIGluc3RydWN0aW9ucy5cbiAqXG4gKiBAcGFyYW0gdERhdGEgYFREYXRhYCB3aGVyZSB0aGUgbGlua2VkIGxpc3QgaXMgc3RvcmVkLlxuICogQHBhcmFtIHROb2RlIGBUTm9kZWAgZm9yIHdoaWNoIHRoZSBzdHlsaW5nIGlzIGJlaW5nIGNvbXB1dGVkLlxuICogQHBhcmFtIGlzQ2xhc3NCYXNlZCBgdHJ1ZWAgaWYgYGNsYXNzYCAoYGZhbHNlYCBpZiBgc3R5bGVgKVxuICogQHJldHVybiBgVFN0eWxpbmdLZXlgIGlmIGZvdW5kIG9yIGB1bmRlZmluZWRgIGlmIG5vdCBmb3VuZC5cbiAqL1xuZnVuY3Rpb24gZ2V0VGVtcGxhdGVIZWFkVFN0eWxpbmdLZXkodERhdGE6IFREYXRhLCB0Tm9kZTogVE5vZGUsIGlzQ2xhc3NCYXNlZDogYm9vbGVhbik6IFRTdHlsaW5nS2V5fFxuICAgIHVuZGVmaW5lZCB7XG4gIGNvbnN0IGJpbmRpbmdzID0gaXNDbGFzc0Jhc2VkID8gdE5vZGUuY2xhc3NCaW5kaW5ncyA6IHROb2RlLnN0eWxlQmluZGluZ3M7XG4gIGlmIChnZXRUU3R5bGluZ1JhbmdlTmV4dChiaW5kaW5ncykgPT09IDApIHtcbiAgICAvLyBUaGVyZSBkb2VzIG5vdCBzZWVtIHRvIGJlIGEgc3R5bGluZyBpbnN0cnVjdGlvbiBpbiB0aGUgYHRlbXBsYXRlYC5cbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9XG4gIHJldHVybiB0RGF0YVtnZXRUU3R5bGluZ1JhbmdlUHJldihiaW5kaW5ncyldIGFzIFRTdHlsaW5nS2V5O1xufVxuXG5mdW5jdGlvbiBzZXRUZW1wbGF0ZUhlYWRUU3R5bGluZ0tleShcbiAgICB0RGF0YTogVERhdGEsIHROb2RlOiBUTm9kZSwgaXNDbGFzc0Jhc2VkOiBib29sZWFuLCB0U3R5bGluZ0tleTogVFN0eWxpbmdLZXkpOiB2b2lkIHtcbiAgY29uc3QgYmluZGluZ3MgPSBpc0NsYXNzQmFzZWQgPyB0Tm9kZS5jbGFzc0JpbmRpbmdzIDogdE5vZGUuc3R5bGVCaW5kaW5ncztcbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vdEVxdWFsKFxuICAgICAgICAgICAgICAgICAgIGdldFRTdHlsaW5nUmFuZ2VOZXh0KGJpbmRpbmdzKSwgMCxcbiAgICAgICAgICAgICAgICAgICAnRXhwZWN0aW5nIHRvIGhhdmUgYXQgbGVhc3Qgb25lIHRlbXBsYXRlIHN0eWxpbmcgYmluZGluZy4nKTtcbiAgdERhdGFbZ2V0VFN0eWxpbmdSYW5nZVByZXYoYmluZGluZ3MpXSA9IHRTdHlsaW5nS2V5O1xufVxuXG5mdW5jdGlvbiBjb2xsZWN0UmVzaWR1YWwodE5vZGU6IFROb2RlLCBpc0NsYXNzQmFzZWQ6IGJvb2xlYW4pOiBLZXlWYWx1ZUFycmF5PGFueT58bnVsbCB7XG4gIGxldCByZXNpZHVhbDogS2V5VmFsdWVBcnJheTxhbnk+fG51bGx8dW5kZWZpbmVkID0gdW5kZWZpbmVkO1xuICBjb25zdCBkaXJlY3RpdmVzID0gdE5vZGUuZGlyZWN0aXZlcztcbiAgaWYgKGRpcmVjdGl2ZXMpIHtcbiAgICBmb3IgKGxldCBpID0gZGlyZWN0aXZlc1tEaXJlY3RpdmVEZWZzLlNUWUxJTkdfQ1VSU09SXSArIDE7IGkgPCBkaXJlY3RpdmVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBhdHRycyA9IChkaXJlY3RpdmVzW2ldIGFzIERpcmVjdGl2ZURlZjxhbnk+KS5ob3N0QXR0cnM7XG4gICAgICByZXNpZHVhbCA9XG4gICAgICAgICAgY29sbGVjdFN0eWxpbmdGcm9tVEF0dHJzKHJlc2lkdWFsLCBhdHRycywgaXNDbGFzc0Jhc2VkKSBhcyBLZXlWYWx1ZUFycmF5PGFueT58IG51bGw7XG4gICAgfVxuICB9XG4gIHJldHVybiBjb2xsZWN0U3R5bGluZ0Zyb21UQXR0cnMocmVzaWR1YWwsIHROb2RlLmF0dHJzLCBpc0NsYXNzQmFzZWQpIGFzIEtleVZhbHVlQXJyYXk8YW55PnwgbnVsbDtcbn1cblxuLyoqXG4gKiBDb2xsZWN0IHRoZSBzdGF0aWMgc3R5bGluZyBpbmZvcm1hdGlvbiB3aXRoIGxvd2VyIHByaW9yaXR5IHRoYW4gYGhvc3REaXJlY3RpdmVEZWZgLlxuICpcbiAqIChUaGlzIGlzIG9wcG9zaXRlIG9mIHJlc2lkdWFsIHN0eWxpbmcuKVxuICpcbiAqIEBwYXJhbSBob3N0RGlyZWN0aXZlRGVmIGBEaXJlY3RpdmVEZWZgIGZvciB3aGljaCB3ZSB3YW50IHRvIGNvbGxlY3QgbG93ZXIgcHJpb3JpdHkgc3RhdGljXG4gKiAgICAgICAgc3R5bGluZy4gKE9yIGBudWxsYCBpZiB0ZW1wbGF0ZSBzdHlsaW5nKVxuICogQHBhcmFtIHREYXRhIGBURGF0YWAgd2hlcmUgdGhlIGxpbmtlZCBsaXN0IGlzIHN0b3JlZC5cbiAqIEBwYXJhbSB0Tm9kZSBgVE5vZGVgIGZvciB3aGljaCB0aGUgc3R5bGluZyBpcyBiZWluZyBjb21wdXRlZC5cbiAqIEBwYXJhbSBzdHlsaW5nS2V5IEV4aXN0aW5nIGBUU3R5bGluZ0tleWAgdG8gdXBkYXRlIG9yIHdyYXAuXG4gKiBAcGFyYW0gaXNDbGFzc0Jhc2VkIGB0cnVlYCBpZiBgY2xhc3NgIChgZmFsc2VgIGlmIGBzdHlsZWApXG4gKi9cbmZ1bmN0aW9uIGNvbGxlY3RTdHlsaW5nRnJvbURpcmVjdGl2ZXMoXG4gICAgaG9zdERpcmVjdGl2ZURlZjogRGlyZWN0aXZlRGVmPGFueT58IG51bGwsIHREYXRhOiBURGF0YSwgdE5vZGU6IFROb2RlLCBzdHlsaW5nS2V5OiBUU3R5bGluZ0tleSxcbiAgICBpc0NsYXNzQmFzZWQ6IGJvb2xlYW4pOiBUU3R5bGluZ0tleSB7XG4gIGNvbnN0IGRpcmVjdGl2ZXMgPSB0Tm9kZS5kaXJlY3RpdmVzO1xuICBpZiAoZGlyZWN0aXZlcyAhPSBudWxsKSB7XG4gICAgbmdEZXZNb2RlICYmIGhvc3REaXJlY3RpdmVEZWYgJiZcbiAgICAgICAgYXNzZXJ0R3JlYXRlclRoYW5PckVxdWFsKFxuICAgICAgICAgICAgZGlyZWN0aXZlcy5pbmRleE9mKGhvc3REaXJlY3RpdmVEZWYsIGRpcmVjdGl2ZXNbRGlyZWN0aXZlRGVmcy5TVFlMSU5HX0NVUlNPUl0pLCAwLFxuICAgICAgICAgICAgJ0V4cGVjdGluZyB0aGF0IHRoZSBjdXJyZW50IGRpcmVjdGl2ZSBpcyBpbiB0aGUgZGlyZWN0aXZlIGxpc3QnKTtcbiAgICAvLyBXZSBuZWVkIHRvIGxvb3AgYmVjYXVzZSB0aGVyZSBjYW4gYmUgZGlyZWN0aXZlcyB3aGljaCBoYXZlIGBob3N0QXR0cnNgIGJ1dCBkb24ndCBoYXZlXG4gICAgLy8gYGhvc3RCaW5kaW5nc2Agc28gdGhpcyBsb29wIGNhdGNoZXMgdXAgdXAgdG8gdGhlIGN1cnJlbnQgZGlyZWN0aXZlLi5cbiAgICBsZXQgY3VycmVudERpcmVjdGl2ZTogRGlyZWN0aXZlRGVmPGFueT58bnVsbCA9IG51bGw7XG4gICAgbGV0IGluZGV4ID0gZGlyZWN0aXZlc1tEaXJlY3RpdmVEZWZzLlNUWUxJTkdfQ1VSU09SXTtcbiAgICB3aGlsZSAoaW5kZXggKyAxIDwgZGlyZWN0aXZlcy5sZW5ndGgpIHtcbiAgICAgIGluZGV4Kys7XG4gICAgICBjdXJyZW50RGlyZWN0aXZlID0gZGlyZWN0aXZlc1tpbmRleF0gYXMgRGlyZWN0aXZlRGVmPGFueT47XG4gICAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChjdXJyZW50RGlyZWN0aXZlLCAnZXhwZWN0ZWQgdG8gYmUgZGVmaW5lZCcpO1xuICAgICAgc3R5bGluZ0tleSA9IGNvbGxlY3RTdHlsaW5nRnJvbVRBdHRycyhzdHlsaW5nS2V5LCBjdXJyZW50RGlyZWN0aXZlLmhvc3RBdHRycywgaXNDbGFzc0Jhc2VkKTtcbiAgICAgIGlmIChjdXJyZW50RGlyZWN0aXZlID09PSBob3N0RGlyZWN0aXZlRGVmKSBicmVhaztcbiAgICB9XG4gICAgaWYgKGhvc3REaXJlY3RpdmVEZWYgIT09IG51bGwpIHtcbiAgICAgIC8vIHdlIG9ubHkgYWR2YW5jZSB0aGUgc3R5bGluZyBjdXJzb3IgaWYgd2UgYXJlIGNvbGxlY3RpbmcgZGF0YSBmcm9tIGhvc3QgYmluZGluZ3MuXG4gICAgICAvLyBUZW1wbGF0ZSBleGVjdXRlcyBiZWZvcmUgaG9zdCBiaW5kaW5ncyBhbmQgc28gaWYgd2Ugd291bGQgdXBkYXRlIHRoZSBpbmRleCxcbiAgICAgIC8vIGhvc3QgYmluZGluZ3Mgd291bGQgbm90IGdldCB0aGVpciBzdGF0aWNzLlxuICAgICAgZGlyZWN0aXZlc1tEaXJlY3RpdmVEZWZzLlNUWUxJTkdfQ1VSU09SXSA9IGluZGV4O1xuICAgIH1cbiAgfVxuICByZXR1cm4gc3R5bGluZ0tleTtcbn1cblxuLyoqXG4gKiBDb252ZXJ0IGBUQXR0cnNgIGludG8gYFRTdHlsaW5nU3RhdGljYC5cbiAqXG4gKiBAcGFyYW0gc3R5bGluZ0tleSBleGlzdGluZyBgVFN0eWxpbmdLZXlgIHRvIHVwZGF0ZSBvciB3cmFwLlxuICogQHBhcmFtIGF0dHJzIGBUQXR0cmlidXRlc2AgdG8gcHJvY2Vzcy5cbiAqIEBwYXJhbSBpc0NsYXNzQmFzZWQgYHRydWVgIGlmIGBjbGFzc2AgKGBmYWxzZWAgaWYgYHN0eWxlYClcbiAqL1xuZnVuY3Rpb24gY29sbGVjdFN0eWxpbmdGcm9tVEF0dHJzKFxuICAgIHN0eWxpbmdLZXk6IFRTdHlsaW5nS2V5IHwgdW5kZWZpbmVkLCBhdHRyczogVEF0dHJpYnV0ZXMgfCBudWxsLFxuICAgIGlzQ2xhc3NCYXNlZDogYm9vbGVhbik6IFRTdHlsaW5nS2V5IHtcbiAgY29uc3QgZGVzaXJlZE1hcmtlciA9IGlzQ2xhc3NCYXNlZCA/IEF0dHJpYnV0ZU1hcmtlci5DbGFzc2VzIDogQXR0cmlidXRlTWFya2VyLlN0eWxlcztcbiAgbGV0IGN1cnJlbnRNYXJrZXIgPSBBdHRyaWJ1dGVNYXJrZXIuSW1wbGljaXRBdHRyaWJ1dGVzO1xuICBpZiAoYXR0cnMgIT09IG51bGwpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGF0dHJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBpdGVtID0gYXR0cnNbaV0gYXMgbnVtYmVyIHwgc3RyaW5nO1xuICAgICAgaWYgKHR5cGVvZiBpdGVtID09PSAnbnVtYmVyJykge1xuICAgICAgICBjdXJyZW50TWFya2VyID0gaXRlbTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChjdXJyZW50TWFya2VyID09PSBkZXNpcmVkTWFya2VyKSB7XG4gICAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KHN0eWxpbmdLZXkpKSB7XG4gICAgICAgICAgICBzdHlsaW5nS2V5ID0gc3R5bGluZ0tleSA9PT0gdW5kZWZpbmVkID8gW10gOiBbJycsIHN0eWxpbmdLZXldIGFzIGFueTtcbiAgICAgICAgICB9XG4gICAgICAgICAga2V5VmFsdWVBcnJheVNldChcbiAgICAgICAgICAgICAgc3R5bGluZ0tleSBhcyBLZXlWYWx1ZUFycmF5PGFueT4sIGl0ZW0sIGlzQ2xhc3NCYXNlZCA/IHRydWUgOiBhdHRyc1srK2ldKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gc3R5bGluZ0tleSA9PT0gdW5kZWZpbmVkID8gbnVsbCA6IHN0eWxpbmdLZXk7XG59XG5cbi8qKlxuICogUmV0cmlldmUgdGhlIGN1cnJlbnQgYERpcmVjdGl2ZURlZmAgd2hpY2ggaXMgYWN0aXZlIHdoZW4gYGhvc3RCaW5kaW5nc2Agc3R5bGUgaW5zdHJ1Y3Rpb24gaXNcbiAqIGJlaW5nIGV4ZWN1dGVkIChvciBgbnVsbGAgaWYgd2UgYXJlIGluIGB0ZW1wbGF0ZWAuKVxuICpcbiAqIEBwYXJhbSB0RGF0YSBDdXJyZW50IGBURGF0YWAgd2hlcmUgdGhlIGBEaXJlY3RpdmVEZWZgIHdpbGwgYmUgbG9va2VkIHVwIGF0LlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0SG9zdERpcmVjdGl2ZURlZih0RGF0YTogVERhdGEpOiBEaXJlY3RpdmVEZWY8YW55PnxudWxsIHtcbiAgY29uc3QgY3VycmVudERpcmVjdGl2ZUluZGV4ID0gZ2V0Q3VycmVudERpcmVjdGl2ZUluZGV4KCk7XG4gIHJldHVybiBjdXJyZW50RGlyZWN0aXZlSW5kZXggPT09IC0xID8gbnVsbCA6IHREYXRhW2N1cnJlbnREaXJlY3RpdmVJbmRleF0gYXMgRGlyZWN0aXZlRGVmPGFueT47XG59XG5cbi8qKlxuICogQ29udmVydCB1c2VyIGlucHV0IHRvIGBLZXlWYWx1ZUFycmF5YC5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIHRha2VzIHVzZXIgaW5wdXQgd2hpY2ggY291bGQgYmUgYHN0cmluZ2AsIE9iamVjdCBsaXRlcmFsLCBvciBpdGVyYWJsZSBhbmQgY29udmVydHNcbiAqIGl0IGludG8gYSBjb25zaXN0ZW50IHJlcHJlc2VudGF0aW9uLiBUaGUgb3V0cHV0IG9mIHRoaXMgaXMgYEtleVZhbHVlQXJyYXlgICh3aGljaCBpcyBhbiBhcnJheVxuICogd2hlcmVcbiAqIGV2ZW4gaW5kZXhlcyBjb250YWluIGtleXMgYW5kIG9kZCBpbmRleGVzIGNvbnRhaW4gdmFsdWVzIGZvciB0aG9zZSBrZXlzKS5cbiAqXG4gKiBUaGUgYWR2YW50YWdlIG9mIGNvbnZlcnRpbmcgdG8gYEtleVZhbHVlQXJyYXlgIGlzIHRoYXQgd2UgY2FuIHBlcmZvcm0gZGlmZiBpbiBhbiBpbnB1dFxuICogaW5kZXBlbmRlbnRcbiAqIHdheS5cbiAqIChpZSB3ZSBjYW4gY29tcGFyZSBgZm9vIGJhcmAgdG8gYFsnYmFyJywgJ2JheiddIGFuZCBkZXRlcm1pbmUgYSBzZXQgb2YgY2hhbmdlcyB3aGljaCBuZWVkIHRvIGJlXG4gKiBhcHBsaWVkKVxuICpcbiAqIFRoZSBmYWN0IHRoYXQgYEtleVZhbHVlQXJyYXlgIGlzIHNvcnRlZCBpcyB2ZXJ5IGltcG9ydGFudCBiZWNhdXNlIGl0IGFsbG93cyB1cyB0byBjb21wdXRlIHRoZVxuICogZGlmZmVyZW5jZSBpbiBsaW5lYXIgZmFzaGlvbiB3aXRob3V0IHRoZSBuZWVkIHRvIGFsbG9jYXRlIGFueSBhZGRpdGlvbmFsIGRhdGEuXG4gKlxuICogRm9yIGV4YW1wbGUgaWYgd2Uga2VwdCB0aGlzIGFzIGEgYE1hcGAgd2Ugd291bGQgaGF2ZSB0byBpdGVyYXRlIG92ZXIgcHJldmlvdXMgYE1hcGAgdG8gZGV0ZXJtaW5lXG4gKiB3aGljaCB2YWx1ZXMgbmVlZCB0byBiZSBkZWxldGVkLCBvdmVyIHRoZSBuZXcgYE1hcGAgdG8gZGV0ZXJtaW5lIGFkZGl0aW9ucywgYW5kIHdlIHdvdWxkIGhhdmUgdG9cbiAqIGtlZXAgYWRkaXRpb25hbCBgTWFwYCB0byBrZWVwIHRyYWNrIG9mIGR1cGxpY2F0ZXMgb3IgaXRlbXMgd2hpY2ggaGF2ZSBub3QgeWV0IGJlZW4gdmlzaXRlZC5cbiAqXG4gKiBAcGFyYW0ga2V5VmFsdWVBcnJheVNldCAoU2VlIGBrZXlWYWx1ZUFycmF5U2V0YCBpbiBcInV0aWwvYXJyYXlfdXRpbHNcIikgR2V0cyBwYXNzZWQgaW4gYXMgYVxuICogZnVuY3Rpb24gc28gdGhhdFxuICogICAgICAgIGBzdHlsZWAgY2FuIHBhc3MgaW4gdmVyc2lvbiB3aGljaCBkb2VzIHNhbml0aXphdGlvbi4gVGhpcyBpcyBkb25lIGZvciB0cmVlIHNoYWtpbmdcbiAqICAgICAgICBwdXJwb3Nlcy5cbiAqIEBwYXJhbSBzdHJpbmdQYXJzZXIgVGhlIHBhcnNlciBpcyBwYXNzZWQgaW4gc28gdGhhdCBpdCB3aWxsIGJlIHRyZWUgc2hha2FibGUuIFNlZVxuICogICAgICAgIGBzdHlsZVN0cmluZ1BhcnNlcmAgYW5kIGBjbGFzc1N0cmluZ1BhcnNlcmBcbiAqIEBwYXJhbSB2YWx1ZSBUaGUgdmFsdWUgdG8gcGFyc2UvY29udmVydCB0byBgS2V5VmFsdWVBcnJheWBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHRvU3R5bGluZ0tleVZhbHVlQXJyYXkoXG4gICAga2V5VmFsdWVBcnJheVNldDogKGtleVZhbHVlQXJyYXk6IEtleVZhbHVlQXJyYXk8YW55Piwga2V5OiBzdHJpbmcsIHZhbHVlOiBhbnkpID0+IHZvaWQsXG4gICAgc3RyaW5nUGFyc2VyOiAoc3R5bGVLZXlWYWx1ZUFycmF5OiBLZXlWYWx1ZUFycmF5PGFueT4sIHRleHQ6IHN0cmluZykgPT4gdm9pZCwgdmFsdWU6IHN0cmluZ3xcbiAgICBzdHJpbmdbXXx7W2tleTogc3RyaW5nXTogYW55fXxNYXA8YW55LCBhbnk+fFNldDxhbnk+fG51bGx8dW5kZWZpbmVkKTogS2V5VmFsdWVBcnJheTxhbnk+IHtcbiAgaWYgKHZhbHVlID09IG51bGwgLyp8fCB2YWx1ZSA9PT0gdW5kZWZpbmVkICovIHx8IHZhbHVlID09PSAnJykgcmV0dXJuIEVNUFRZX0FSUkFZIGFzIGFueTtcbiAgY29uc3Qgc3R5bGVLZXlWYWx1ZUFycmF5OiBLZXlWYWx1ZUFycmF5PGFueT4gPSBbXSBhcyBhbnk7XG4gIGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdmFsdWUubGVuZ3RoOyBpKyspIHtcbiAgICAgIGtleVZhbHVlQXJyYXlTZXQoc3R5bGVLZXlWYWx1ZUFycmF5LCB2YWx1ZVtpXSwgdHJ1ZSk7XG4gICAgfVxuICB9IGVsc2UgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcpIHtcbiAgICBpZiAodmFsdWUgaW5zdGFuY2VvZiBNYXApIHtcbiAgICAgIHZhbHVlLmZvckVhY2goKHYsIGspID0+IGtleVZhbHVlQXJyYXlTZXQoc3R5bGVLZXlWYWx1ZUFycmF5LCBrLCB2KSk7XG4gICAgfSBlbHNlIGlmICh2YWx1ZSBpbnN0YW5jZW9mIFNldCkge1xuICAgICAgdmFsdWUuZm9yRWFjaCgoaykgPT4ga2V5VmFsdWVBcnJheVNldChzdHlsZUtleVZhbHVlQXJyYXksIGssIHRydWUpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZm9yIChjb25zdCBrZXkgaW4gdmFsdWUpIHtcbiAgICAgICAgaWYgKHZhbHVlLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgICBrZXlWYWx1ZUFycmF5U2V0KHN0eWxlS2V5VmFsdWVBcnJheSwga2V5LCB2YWx1ZVtrZXldKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfSBlbHNlIGlmICh0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnKSB7XG4gICAgc3RyaW5nUGFyc2VyKHN0eWxlS2V5VmFsdWVBcnJheSwgdmFsdWUpO1xuICB9IGVsc2Uge1xuICAgIG5nRGV2TW9kZSAmJiB0aHJvd0Vycm9yKCdVbnN1cHBvcnRlZCBzdHlsaW5nIHR5cGUgJyArIHR5cGVvZiB2YWx1ZSArICc6ICcgKyB2YWx1ZSk7XG4gIH1cbiAgcmV0dXJuIHN0eWxlS2V5VmFsdWVBcnJheTtcbn1cblxuLyoqXG4gKiBTZXQgYSBgdmFsdWVgIGZvciBhIGBrZXlgIHRha2luZyBzdHlsZSBzYW5pdGl6YXRpb24gaW50byBhY2NvdW50LlxuICpcbiAqIFNlZTogYGtleVZhbHVlQXJyYXlTZXRgIGZvciBkZXRhaWxzXG4gKlxuICogQHBhcmFtIGtleVZhbHVlQXJyYXkgS2V5VmFsdWVBcnJheSB0byBhZGQgdG8uXG4gKiBAcGFyYW0ga2V5IFN0eWxlIGtleSB0byBhZGQuIChUaGlzIGtleSB3aWxsIGJlIGNoZWNrZWQgaWYgaXQgbmVlZHMgc2FuaXRpemF0aW9uKVxuICogQHBhcmFtIHZhbHVlIFRoZSB2YWx1ZSB0byBzZXQgKElmIGtleSBuZWVkcyBzYW5pdGl6YXRpb24gaXQgd2lsbCBiZSBzYW5pdGl6ZWQpXG4gKi9cbmZ1bmN0aW9uIHN0eWxlS2V5VmFsdWVBcnJheVNldChrZXlWYWx1ZUFycmF5OiBLZXlWYWx1ZUFycmF5PGFueT4sIGtleTogc3RyaW5nLCB2YWx1ZTogYW55KSB7XG4gIGlmIChzdHlsZVByb3BOZWVkc1Nhbml0aXphdGlvbihrZXkpKSB7XG4gICAgdmFsdWUgPSDJtcm1c2FuaXRpemVTdHlsZSh2YWx1ZSk7XG4gIH1cbiAga2V5VmFsdWVBcnJheVNldChrZXlWYWx1ZUFycmF5LCBrZXksIHZhbHVlKTtcbn1cblxuLyoqXG4gKiBVcGRhdGUgbWFwIGJhc2VkIHN0eWxpbmcuXG4gKlxuICogTWFwIGJhc2VkIHN0eWxpbmcgY291bGQgYmUgYW55dGhpbmcgd2hpY2ggY29udGFpbnMgbW9yZSB0aGFuIG9uZSBiaW5kaW5nLiBGb3IgZXhhbXBsZSBgc3RyaW5nYCxcbiAqIGBNYXBgLCBgU2V0YCBvciBvYmplY3QgbGl0ZXJhbC4gRGVhbGluZyB3aXRoIGFsbCBvZiB0aGVzZSB0eXBlcyB3b3VsZCBjb21wbGljYXRlIHRoZSBsb2dpYyBzb1xuICogaW5zdGVhZCB0aGlzIGZ1bmN0aW9uIGV4cGVjdHMgdGhhdCB0aGUgY29tcGxleCBpbnB1dCBpcyBmaXJzdCBjb252ZXJ0ZWQgaW50byBub3JtYWxpemVkXG4gKiBgS2V5VmFsdWVBcnJheWAuIFRoZSBhZHZhbnRhZ2Ugb2Ygbm9ybWFsaXphdGlvbiBpcyB0aGF0IHdlIGdldCB0aGUgdmFsdWVzIHNvcnRlZCwgd2hpY2ggbWFrZXMgaXRcbiAqIHZlcnlcbiAqIGNoZWFwIHRvIGNvbXB1dGUgZGVsdGFzIGJldHdlZW4gdGhlIHByZXZpb3VzIGFuZCBjdXJyZW50IHZhbHVlLlxuICpcbiAqIEBwYXJhbSB0VmlldyBBc3NvY2lhdGVkIGBUVmlldy5kYXRhYCBjb250YWlucyB0aGUgbGlua2VkIGxpc3Qgb2YgYmluZGluZyBwcmlvcml0aWVzLlxuICogQHBhcmFtIHROb2RlIGBUTm9kZWAgd2hlcmUgdGhlIGJpbmRpbmcgaXMgbG9jYXRlZC5cbiAqIEBwYXJhbSBsVmlldyBgTFZpZXdgIGNvbnRhaW5zIHRoZSB2YWx1ZXMgYXNzb2NpYXRlZCB3aXRoIG90aGVyIHN0eWxpbmcgYmluZGluZyBhdCB0aGlzIGBUTm9kZWAuXG4gKiBAcGFyYW0gcmVuZGVyZXIgUmVuZGVyZXIgdG8gdXNlIGlmIGFueSB1cGRhdGVzLlxuICogQHBhcmFtIG9sZEtleVZhbHVlQXJyYXkgUHJldmlvdXMgdmFsdWUgcmVwcmVzZW50ZWQgYXMgYEtleVZhbHVlQXJyYXlgXG4gKiBAcGFyYW0gbmV3S2V5VmFsdWVBcnJheSBDdXJyZW50IHZhbHVlIHJlcHJlc2VudGVkIGFzIGBLZXlWYWx1ZUFycmF5YFxuICogQHBhcmFtIGlzQ2xhc3NCYXNlZCBgdHJ1ZWAgaWYgYGNsYXNzYCAoYGZhbHNlYCBpZiBgc3R5bGVgKVxuICogQHBhcmFtIGJpbmRpbmdJbmRleCBCaW5kaW5nIGluZGV4IG9mIHRoZSBiaW5kaW5nLlxuICovXG5mdW5jdGlvbiB1cGRhdGVTdHlsaW5nTWFwKFxuICAgIHRWaWV3OiBUVmlldywgdE5vZGU6IFROb2RlLCBsVmlldzogTFZpZXcsIHJlbmRlcmVyOiBSZW5kZXJlcjMsXG4gICAgb2xkS2V5VmFsdWVBcnJheTogS2V5VmFsdWVBcnJheTxhbnk+LCBuZXdLZXlWYWx1ZUFycmF5OiBLZXlWYWx1ZUFycmF5PGFueT4sXG4gICAgaXNDbGFzc0Jhc2VkOiBib29sZWFuLCBiaW5kaW5nSW5kZXg6IG51bWJlcikge1xuICBpZiAob2xkS2V5VmFsdWVBcnJheSBhcyBLZXlWYWx1ZUFycmF5PGFueT58IE5PX0NIQU5HRSA9PT0gTk9fQ0hBTkdFKSB7XG4gICAgLy8gT24gZmlyc3QgZXhlY3V0aW9uIHRoZSBvbGRLZXlWYWx1ZUFycmF5IGlzIE5PX0NIQU5HRSA9PiB0cmVhdCBpdCBhcyBlbXB0eSBLZXlWYWx1ZUFycmF5LlxuICAgIG9sZEtleVZhbHVlQXJyYXkgPSBFTVBUWV9BUlJBWSBhcyBhbnk7XG4gIH1cbiAgbGV0IG9sZEluZGV4ID0gMDtcbiAgbGV0IG5ld0luZGV4ID0gMDtcbiAgbGV0IG9sZEtleTogc3RyaW5nfG51bGwgPSAwIDwgb2xkS2V5VmFsdWVBcnJheS5sZW5ndGggPyBvbGRLZXlWYWx1ZUFycmF5WzBdIDogbnVsbDtcbiAgbGV0IG5ld0tleTogc3RyaW5nfG51bGwgPSAwIDwgbmV3S2V5VmFsdWVBcnJheS5sZW5ndGggPyBuZXdLZXlWYWx1ZUFycmF5WzBdIDogbnVsbDtcbiAgd2hpbGUgKG9sZEtleSAhPT0gbnVsbCB8fCBuZXdLZXkgIT09IG51bGwpIHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0TGVzc1RoYW4ob2xkSW5kZXgsIDk5OSwgJ0FyZSB3ZSBzdHVjayBpbiBpbmZpbml0ZSBsb29wPycpO1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnRMZXNzVGhhbihuZXdJbmRleCwgOTk5LCAnQXJlIHdlIHN0dWNrIGluIGluZmluaXRlIGxvb3A/Jyk7XG4gICAgY29uc3Qgb2xkVmFsdWUgPVxuICAgICAgICBvbGRJbmRleCA8IG9sZEtleVZhbHVlQXJyYXkubGVuZ3RoID8gb2xkS2V5VmFsdWVBcnJheVtvbGRJbmRleCArIDFdIDogdW5kZWZpbmVkO1xuICAgIGNvbnN0IG5ld1ZhbHVlID1cbiAgICAgICAgbmV3SW5kZXggPCBuZXdLZXlWYWx1ZUFycmF5Lmxlbmd0aCA/IG5ld0tleVZhbHVlQXJyYXlbbmV3SW5kZXggKyAxXSA6IHVuZGVmaW5lZDtcbiAgICBsZXQgc2V0S2V5OiBzdHJpbmd8bnVsbCA9IG51bGw7XG4gICAgbGV0IHNldFZhbHVlOiBhbnkgPSB1bmRlZmluZWQ7XG4gICAgaWYgKG9sZEtleSA9PT0gbmV3S2V5KSB7XG4gICAgICAvLyBVUERBVEU6IEtleXMgYXJlIGVxdWFsID0+IG5ldyB2YWx1ZSBpcyBvdmVyd3JpdGluZyBvbGQgdmFsdWUuXG4gICAgICBvbGRJbmRleCArPSAyO1xuICAgICAgbmV3SW5kZXggKz0gMjtcbiAgICAgIGlmIChvbGRWYWx1ZSAhPT0gbmV3VmFsdWUpIHtcbiAgICAgICAgc2V0S2V5ID0gbmV3S2V5O1xuICAgICAgICBzZXRWYWx1ZSA9IG5ld1ZhbHVlO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAobmV3S2V5ID09PSBudWxsIHx8IG9sZEtleSAhPT0gbnVsbCAmJiBvbGRLZXkgPCBuZXdLZXkgISkge1xuICAgICAgLy8gREVMRVRFOiBvbGRLZXkga2V5IGlzIG1pc3Npbmcgb3Igd2UgZGlkIG5vdCBmaW5kIHRoZSBvbGRLZXkgaW4gdGhlIG5ld1ZhbHVlXG4gICAgICAvLyAoYmVjYXVzZSB0aGUga2V5VmFsdWVBcnJheSBpcyBzb3J0ZWQgYW5kIGBuZXdLZXlgIGlzIGZvdW5kIGxhdGVyIGFscGhhYmV0aWNhbGx5KS5cbiAgICAgIC8vIGBcImJhY2tncm91bmRcIiA8IFwiY29sb3JcImAgc28gd2UgbmVlZCB0byBkZWxldGUgYFwiYmFja2dyb3VuZFwiYCBiZWNhdXNlIGl0IGlzIG5vdCBmb3VuZCBpbiB0aGVcbiAgICAgIC8vIG5ldyBhcnJheS5cbiAgICAgIG9sZEluZGV4ICs9IDI7XG4gICAgICBzZXRLZXkgPSBvbGRLZXk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIENSRUFURTogbmV3S2V5J3MgaXMgZWFybGllciBhbHBoYWJldGljYWxseSB0aGFuIG9sZEtleSdzIChvciBubyBvbGRLZXkpID0+IHdlIGhhdmUgbmV3IGtleS5cbiAgICAgIC8vIGBcImNvbG9yXCIgPiBcImJhY2tncm91bmRcImAgc28gd2UgbmVlZCB0byBhZGQgYGNvbG9yYCBiZWNhdXNlIGl0IGlzIGluIG5ldyBhcnJheSBidXQgbm90IGluXG4gICAgICAvLyBvbGQgYXJyYXkuXG4gICAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChuZXdLZXksICdFeHBlY3RpbmcgdG8gaGF2ZSBhIHZhbGlkIGtleScpO1xuICAgICAgbmV3SW5kZXggKz0gMjtcbiAgICAgIHNldEtleSA9IG5ld0tleTtcbiAgICAgIHNldFZhbHVlID0gbmV3VmFsdWU7XG4gICAgfVxuICAgIGlmIChzZXRLZXkgIT09IG51bGwpIHtcbiAgICAgIHVwZGF0ZVN0eWxpbmcodFZpZXcsIHROb2RlLCBsVmlldywgcmVuZGVyZXIsIHNldEtleSwgc2V0VmFsdWUsIGlzQ2xhc3NCYXNlZCwgYmluZGluZ0luZGV4KTtcbiAgICB9XG4gICAgb2xkS2V5ID0gb2xkSW5kZXggPCBvbGRLZXlWYWx1ZUFycmF5Lmxlbmd0aCA/IG9sZEtleVZhbHVlQXJyYXlbb2xkSW5kZXhdIDogbnVsbDtcbiAgICBuZXdLZXkgPSBuZXdJbmRleCA8IG5ld0tleVZhbHVlQXJyYXkubGVuZ3RoID8gbmV3S2V5VmFsdWVBcnJheVtuZXdJbmRleF0gOiBudWxsO1xuICB9XG59XG5cbi8qKlxuICogVXBkYXRlIGEgc2ltcGxlIChwcm9wZXJ0eSBuYW1lKSBzdHlsaW5nLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gdGFrZXMgYHByb3BgIGFuZCB1cGRhdGVzIHRoZSBET00gdG8gdGhhdCB2YWx1ZS4gVGhlIGZ1bmN0aW9uIHRha2VzIHRoZSBiaW5kaW5nXG4gKiB2YWx1ZSBhcyB3ZWxsIGFzIGJpbmRpbmcgcHJpb3JpdHkgaW50byBjb25zaWRlcmF0aW9uIHRvIGRldGVybWluZSB3aGljaCB2YWx1ZSBzaG91bGQgYmUgd3JpdHRlblxuICogdG8gRE9NLiAoRm9yIGV4YW1wbGUgaXQgbWF5IGJlIGRldGVybWluZWQgdGhhdCB0aGVyZSBpcyBhIGhpZ2hlciBwcmlvcml0eSBvdmVyd3JpdGUgd2hpY2ggYmxvY2tzXG4gKiB0aGUgRE9NIHdyaXRlLCBvciBpZiB0aGUgdmFsdWUgZ29lcyB0byBgdW5kZWZpbmVkYCBhIGxvd2VyIHByaW9yaXR5IG92ZXJ3cml0ZSBtYXkgYmUgY29uc3VsdGVkLilcbiAqXG4gKiBAcGFyYW0gdFZpZXcgQXNzb2NpYXRlZCBgVFZpZXcuZGF0YWAgY29udGFpbnMgdGhlIGxpbmtlZCBsaXN0IG9mIGJpbmRpbmcgcHJpb3JpdGllcy5cbiAqIEBwYXJhbSB0Tm9kZSBgVE5vZGVgIHdoZXJlIHRoZSBiaW5kaW5nIGlzIGxvY2F0ZWQuXG4gKiBAcGFyYW0gbFZpZXcgYExWaWV3YCBjb250YWlucyB0aGUgdmFsdWVzIGFzc29jaWF0ZWQgd2l0aCBvdGhlciBzdHlsaW5nIGJpbmRpbmcgYXQgdGhpcyBgVE5vZGVgLlxuICogQHBhcmFtIHJlbmRlcmVyIFJlbmRlcmVyIHRvIHVzZSBpZiBhbnkgdXBkYXRlcy5cbiAqIEBwYXJhbSBwcm9wIEVpdGhlciBzdHlsZSBwcm9wZXJ0eSBuYW1lIG9yIGEgY2xhc3MgbmFtZS5cbiAqIEBwYXJhbSB2YWx1ZSBFaXRoZXIgc3R5bGUgdmFsdWUgZm9yIGBwcm9wYCBvciBgdHJ1ZWAvYGZhbHNlYCBpZiBgcHJvcGAgaXMgY2xhc3MuXG4gKiBAcGFyYW0gaXNDbGFzc0Jhc2VkIGB0cnVlYCBpZiBgY2xhc3NgIChgZmFsc2VgIGlmIGBzdHlsZWApXG4gKiBAcGFyYW0gYmluZGluZ0luZGV4IEJpbmRpbmcgaW5kZXggb2YgdGhlIGJpbmRpbmcuXG4gKi9cbmZ1bmN0aW9uIHVwZGF0ZVN0eWxpbmcoXG4gICAgdFZpZXc6IFRWaWV3LCB0Tm9kZTogVE5vZGUsIGxWaWV3OiBMVmlldywgcmVuZGVyZXI6IFJlbmRlcmVyMywgcHJvcDogc3RyaW5nLFxuICAgIHZhbHVlOiBzdHJpbmcgfCB1bmRlZmluZWQgfCBudWxsIHwgYm9vbGVhbiwgaXNDbGFzc0Jhc2VkOiBib29sZWFuLCBiaW5kaW5nSW5kZXg6IG51bWJlcikge1xuICBpZiAodE5vZGUudHlwZSAhPT0gVE5vZGVUeXBlLkVsZW1lbnQpIHtcbiAgICAvLyBJdCBpcyBwb3NzaWJsZSB0byBoYXZlIHN0eWxpbmcgb24gbm9uLWVsZW1lbnRzIChzdWNoIGFzIG5nLWNvbnRhaW5lcikuXG4gICAgLy8gVGhpcyBpcyByYXJlLCBidXQgaXQgZG9lcyBoYXBwZW4uIEluIHN1Y2ggYSBjYXNlLCBqdXN0IGlnbm9yZSB0aGUgYmluZGluZy5cbiAgICByZXR1cm47XG4gIH1cbiAgY29uc3QgdERhdGEgPSB0Vmlldy5kYXRhO1xuICBjb25zdCB0UmFuZ2UgPSB0RGF0YVtiaW5kaW5nSW5kZXggKyAxXSBhcyBUU3R5bGluZ1JhbmdlO1xuICBjb25zdCBoaWdoZXJQcmlvcml0eVZhbHVlID0gZ2V0VFN0eWxpbmdSYW5nZU5leHREdXBsaWNhdGUodFJhbmdlKSA/XG4gICAgICBmaW5kU3R5bGluZ1ZhbHVlKHREYXRhLCB0Tm9kZSwgbFZpZXcsIHByb3AsIGdldFRTdHlsaW5nUmFuZ2VOZXh0KHRSYW5nZSksIGlzQ2xhc3NCYXNlZCkgOlxuICAgICAgdW5kZWZpbmVkO1xuICBpZiAoIWlzU3R5bGluZ1ZhbHVlUHJlc2VudChoaWdoZXJQcmlvcml0eVZhbHVlKSkge1xuICAgIC8vIFdlIGRvbid0IGhhdmUgYSBuZXh0IGR1cGxpY2F0ZSwgb3Igd2UgZGlkIG5vdCBmaW5kIGEgZHVwbGljYXRlIHZhbHVlLlxuICAgIGlmICghaXNTdHlsaW5nVmFsdWVQcmVzZW50KHZhbHVlKSkge1xuICAgICAgLy8gV2Ugc2hvdWxkIGRlbGV0ZSBjdXJyZW50IHZhbHVlIG9yIHJlc3RvcmUgdG8gbG93ZXIgcHJpb3JpdHkgdmFsdWUuXG4gICAgICBpZiAoZ2V0VFN0eWxpbmdSYW5nZVByZXZEdXBsaWNhdGUodFJhbmdlKSkge1xuICAgICAgICAvLyBXZSBoYXZlIGEgcG9zc2libGUgcHJldiBkdXBsaWNhdGUsIGxldCdzIHJldHJpZXZlIGl0LlxuICAgICAgICB2YWx1ZSA9IGZpbmRTdHlsaW5nVmFsdWUodERhdGEsIG51bGwsIGxWaWV3LCBwcm9wLCBiaW5kaW5nSW5kZXgsIGlzQ2xhc3NCYXNlZCk7XG4gICAgICB9XG4gICAgfVxuICAgIGNvbnN0IHJOb2RlID0gZ2V0TmF0aXZlQnlJbmRleChnZXRTZWxlY3RlZEluZGV4KCksIGxWaWV3KSBhcyBSRWxlbWVudDtcbiAgICBhcHBseVN0eWxpbmcocmVuZGVyZXIsIGlzQ2xhc3NCYXNlZCwgck5vZGUsIHByb3AsIHZhbHVlKTtcbiAgfVxufVxuXG4vKipcbiAqIFNlYXJjaCBmb3Igc3R5bGluZyB2YWx1ZSB3aXRoIGhpZ2hlciBwcmlvcml0eSB3aGljaCBpcyBvdmVyd3JpdGluZyBjdXJyZW50IHZhbHVlLCBvciBhXG4gKiB2YWx1ZSBvZiBsb3dlciBwcmlvcml0eSB0byB3aGljaCB3ZSBzaG91bGQgZmFsbCBiYWNrIGlmIHRoZSB2YWx1ZSBpcyBgdW5kZWZpbmVkYC5cbiAqXG4gKiBXaGVuIHZhbHVlIGlzIGJlaW5nIGFwcGxpZWQgYXQgYSBsb2NhdGlvbiwgcmVsYXRlZCB2YWx1ZXMgbmVlZCB0byBiZSBjb25zdWx0ZWQuXG4gKiAtIElmIHRoZXJlIGlzIGEgaGlnaGVyIHByaW9yaXR5IGJpbmRpbmcsIHdlIHNob3VsZCBiZSB1c2luZyB0aGF0IG9uZSBpbnN0ZWFkLlxuICogICBGb3IgZXhhbXBsZSBgPGRpdiAgW3N0eWxlXT1cIntjb2xvcjpleHAxfVwiIFtzdHlsZS5jb2xvcl09XCJleHAyXCI+YCBjaGFuZ2UgdG8gYGV4cDFgXG4gKiAgIHJlcXVpcmVzIHRoYXQgd2UgY2hlY2sgYGV4cDJgIHRvIHNlZSBpZiBpdCBpcyBzZXQgdG8gdmFsdWUgb3RoZXIgdGhhbiBgdW5kZWZpbmVkYC5cbiAqIC0gSWYgdGhlcmUgaXMgYSBsb3dlciBwcmlvcml0eSBiaW5kaW5nIGFuZCB3ZSBhcmUgY2hhbmdpbmcgdG8gYHVuZGVmaW5lZGBcbiAqICAgRm9yIGV4YW1wbGUgYDxkaXYgIFtzdHlsZV09XCJ7Y29sb3I6ZXhwMX1cIiBbc3R5bGUuY29sb3JdPVwiZXhwMlwiPmAgY2hhbmdlIHRvIGBleHAyYCB0b1xuICogICBgdW5kZWZpbmVkYCByZXF1aXJlcyB0aGF0IHdlIGNoZWNrIGBleHAxYCAoYW5kIHN0YXRpYyB2YWx1ZXMpIGFuZCB1c2UgdGhhdCBhcyBuZXcgdmFsdWUuXG4gKlxuICogTk9URTogVGhlIHN0eWxpbmcgc3RvcmVzIHR3byB2YWx1ZXMuXG4gKiAxLiBUaGUgcmF3IHZhbHVlIHdoaWNoIGNhbWUgZnJvbSB0aGUgYXBwbGljYXRpb24gaXMgc3RvcmVkIGF0IGBpbmRleCArIDBgIGxvY2F0aW9uLiAoVGhpcyB2YWx1ZVxuICogICAgaXMgdXNlZCBmb3IgZGlydHkgY2hlY2tpbmcpLlxuICogMi4gVGhlIG5vcm1hbGl6ZWQgdmFsdWUgKGNvbnZlcnRlZCB0byBgS2V5VmFsdWVBcnJheWAgaWYgbWFwIGFuZCBzYW5pdGl6ZWQpIGlzIHN0b3JlZCBhdCBgaW5kZXggK1xuICogMWAuXG4gKiAgICBUaGUgYWR2YW50YWdlIG9mIHN0b3JpbmcgdGhlIHNhbml0aXplZCB2YWx1ZSBpcyB0aGF0IG9uY2UgdGhlIHZhbHVlIGlzIHdyaXR0ZW4gd2UgZG9uJ3QgbmVlZFxuICogICAgdG8gd29ycnkgYWJvdXQgc2FuaXRpemluZyBpdCBsYXRlciBvciBrZWVwaW5nIHRyYWNrIG9mIHRoZSBzYW5pdGl6ZXIuXG4gKlxuICogQHBhcmFtIHREYXRhIGBURGF0YWAgdXNlZCBmb3IgdHJhdmVyc2luZyB0aGUgcHJpb3JpdHkuXG4gKiBAcGFyYW0gdE5vZGUgYFROb2RlYCB0byB1c2UgZm9yIHJlc29sdmluZyBzdGF0aWMgc3R5bGluZy4gQWxzbyBjb250cm9scyBzZWFyY2ggZGlyZWN0aW9uLlxuICogICAtIGBUTm9kZWAgc2VhcmNoIG5leHQgYW5kIHF1aXQgYXMgc29vbiBhcyBgaXNTdHlsaW5nVmFsdWVQcmVzZW50KHZhbHVlKWAgaXMgdHJ1ZS5cbiAqICAgICAgSWYgbm8gdmFsdWUgZm91bmQgY29uc3VsdCBgdE5vZGUucmVzaWR1YWxTdHlsZWAvYHROb2RlLnJlc2lkdWFsQ2xhc3NgIGZvciBkZWZhdWx0IHZhbHVlLlxuICogICAtIGBudWxsYCBzZWFyY2ggcHJldiBhbmQgZ28gYWxsIHRoZSB3YXkgdG8gZW5kLiBSZXR1cm4gbGFzdCB2YWx1ZSB3aGVyZVxuICogICAgIGBpc1N0eWxpbmdWYWx1ZVByZXNlbnQodmFsdWUpYCBpcyB0cnVlLlxuICogQHBhcmFtIGxWaWV3IGBMVmlld2AgdXNlZCBmb3IgcmV0cmlldmluZyB0aGUgYWN0dWFsIHZhbHVlcy5cbiAqIEBwYXJhbSBwcm9wIFByb3BlcnR5IHdoaWNoIHdlIGFyZSBpbnRlcmVzdGVkIGluLlxuICogQHBhcmFtIGluZGV4IFN0YXJ0aW5nIGluZGV4IGluIHRoZSBsaW5rZWQgbGlzdCBvZiBzdHlsaW5nIGJpbmRpbmdzIHdoZXJlIHRoZSBzZWFyY2ggc2hvdWxkIHN0YXJ0LlxuICogQHBhcmFtIGlzQ2xhc3NCYXNlZCBgdHJ1ZWAgaWYgYGNsYXNzYCAoYGZhbHNlYCBpZiBgc3R5bGVgKVxuICovXG5mdW5jdGlvbiBmaW5kU3R5bGluZ1ZhbHVlKFxuICAgIHREYXRhOiBURGF0YSwgdE5vZGU6IFROb2RlIHwgbnVsbCwgbFZpZXc6IExWaWV3LCBwcm9wOiBzdHJpbmcsIGluZGV4OiBudW1iZXIsXG4gICAgaXNDbGFzc0Jhc2VkOiBib29sZWFuKTogYW55IHtcbiAgLy8gYFROb2RlYCB0byB1c2UgZm9yIHJlc29sdmluZyBzdGF0aWMgc3R5bGluZy4gQWxzbyBjb250cm9scyBzZWFyY2ggZGlyZWN0aW9uLlxuICAvLyAgIC0gYFROb2RlYCBzZWFyY2ggbmV4dCBhbmQgcXVpdCBhcyBzb29uIGFzIGBpc1N0eWxpbmdWYWx1ZVByZXNlbnQodmFsdWUpYCBpcyB0cnVlLlxuICAvLyAgICAgIElmIG5vIHZhbHVlIGZvdW5kIGNvbnN1bHQgYHROb2RlLnJlc2lkdWFsU3R5bGVgL2B0Tm9kZS5yZXNpZHVhbENsYXNzYCBmb3IgZGVmYXVsdCB2YWx1ZS5cbiAgLy8gICAtIGBudWxsYCBzZWFyY2ggcHJldiBhbmQgZ28gYWxsIHRoZSB3YXkgdG8gZW5kLiBSZXR1cm4gbGFzdCB2YWx1ZSB3aGVyZVxuICAvLyAgICAgYGlzU3R5bGluZ1ZhbHVlUHJlc2VudCh2YWx1ZSlgIGlzIHRydWUuXG4gIGNvbnN0IGlzUHJldkRpcmVjdGlvbiA9IHROb2RlID09PSBudWxsO1xuICBsZXQgdmFsdWU6IGFueSA9IHVuZGVmaW5lZDtcbiAgd2hpbGUgKGluZGV4ID4gMCkge1xuICAgIGNvbnN0IHJhd0tleSA9IHREYXRhW2luZGV4XSBhcyBUU3R5bGluZ0tleTtcbiAgICBjb25zdCBjb250YWluc1N0YXRpY3MgPSBBcnJheS5pc0FycmF5KHJhd0tleSk7XG4gICAgLy8gVW53cmFwIHRoZSBrZXkgaWYgd2UgY29udGFpbiBzdGF0aWMgdmFsdWVzLlxuICAgIGNvbnN0IGtleSA9IGNvbnRhaW5zU3RhdGljcyA/IChyYXdLZXkgYXMgc3RyaW5nW10pWzFdIDogcmF3S2V5O1xuICAgIGxldCBjdXJyZW50VmFsdWUgPSBrZXkgPT09IG51bGwgPyBrZXlWYWx1ZUFycmF5R2V0KGxWaWV3W2luZGV4ICsgMV0sIHByb3ApIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAga2V5ID09PSBwcm9wID8gbFZpZXdbaW5kZXggKyAxXSA6IHVuZGVmaW5lZDtcbiAgICBpZiAoY29udGFpbnNTdGF0aWNzICYmICFpc1N0eWxpbmdWYWx1ZVByZXNlbnQoY3VycmVudFZhbHVlKSkge1xuICAgICAgY3VycmVudFZhbHVlID0ga2V5VmFsdWVBcnJheUdldChyYXdLZXkgYXMgS2V5VmFsdWVBcnJheTxhbnk+LCBwcm9wKTtcbiAgICB9XG4gICAgaWYgKGlzU3R5bGluZ1ZhbHVlUHJlc2VudChjdXJyZW50VmFsdWUpKSB7XG4gICAgICB2YWx1ZSA9IGN1cnJlbnRWYWx1ZTtcbiAgICAgIGlmIChpc1ByZXZEaXJlY3Rpb24pIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgfVxuICAgIH1cbiAgICBjb25zdCB0UmFuZ2UgPSB0RGF0YVtpbmRleCArIDFdIGFzIFRTdHlsaW5nUmFuZ2U7XG4gICAgaW5kZXggPSBpc1ByZXZEaXJlY3Rpb24gPyBnZXRUU3R5bGluZ1JhbmdlUHJldih0UmFuZ2UpIDogZ2V0VFN0eWxpbmdSYW5nZU5leHQodFJhbmdlKTtcbiAgfVxuICBpZiAodE5vZGUgIT09IG51bGwpIHtcbiAgICAvLyBpbiBjYXNlIHdoZXJlIHdlIGFyZSBnb2luZyBpbiBuZXh0IGRpcmVjdGlvbiBBTkQgd2UgZGlkIG5vdCBmaW5kIGFueXRoaW5nLCB3ZSBuZWVkIHRvXG4gICAgLy8gY29uc3VsdCByZXNpZHVhbCBzdHlsaW5nXG4gICAgbGV0IHJlc2lkdWFsID0gaXNDbGFzc0Jhc2VkID8gdE5vZGUucmVzaWR1YWxDbGFzc2VzIDogdE5vZGUucmVzaWR1YWxTdHlsZXM7XG4gICAgaWYgKHJlc2lkdWFsICE9IG51bGwgLyoqIE9SIHJlc2lkdWFsICE9PT0gdW5kZWZpbmVkICovKSB7XG4gICAgICB2YWx1ZSA9IGtleVZhbHVlQXJyYXlHZXQocmVzaWR1YWwgISwgcHJvcCk7XG4gICAgfVxuICB9XG4gIHJldHVybiB2YWx1ZTtcbn1cblxuLyoqXG4gKiBEZXRlcm1pbmVzIGlmIHRoZSBiaW5kaW5nIHZhbHVlIHNob3VsZCBiZSB1c2VkIChvciBpZiB0aGUgdmFsdWUgaXMgJ3VuZGVmaW5lZCcgYW5kIGhlbmNlIHByaW9yaXR5XG4gKiByZXNvbHV0aW9uIHNob3VsZCBiZSB1c2VkLilcbiAqXG4gKiBAcGFyYW0gdmFsdWUgQmluZGluZyBzdHlsZSB2YWx1ZS5cbiAqL1xuZnVuY3Rpb24gaXNTdHlsaW5nVmFsdWVQcmVzZW50KHZhbHVlOiBhbnkpOiBib29sZWFuIHtcbiAgLy8gQ3VycmVudGx5IG9ubHkgYHVuZGVmaW5lZGAgdmFsdWUgaXMgY29uc2lkZXJlZCBub24tYmluZGluZy4gVGhhdCBpcyBgdW5kZWZpbmVkYCBzYXlzIEkgZG9uJ3RcbiAgLy8gaGF2ZSBhbiBvcGluaW9uIGFzIHRvIHdoYXQgdGhpcyBiaW5kaW5nIHNob3VsZCBiZSBhbmQgeW91IHNob3VsZCBjb25zdWx0IG90aGVyIGJpbmRpbmdzIGJ5XG4gIC8vIHByaW9yaXR5IHRvIGRldGVybWluZSB0aGUgdmFsaWQgdmFsdWUuXG4gIC8vIFRoaXMgaXMgZXh0cmFjdGVkIGludG8gYSBzaW5nbGUgZnVuY3Rpb24gc28gdGhhdCB3ZSBoYXZlIGEgc2luZ2xlIHBsYWNlIHRvIGNvbnRyb2wgdGhpcy5cbiAgcmV0dXJuIHZhbHVlICE9PSB1bmRlZmluZWQ7XG59XG5cbi8qKlxuICogU2FuaXRpemVzIG9yIGFkZHMgc3VmZml4IHRvIHRoZSB2YWx1ZS5cbiAqXG4gKiBJZiB2YWx1ZSBpcyBgbnVsbGAvYHVuZGVmaW5lZGAgbm8gc3VmZml4IGlzIGFkZGVkXG4gKiBAcGFyYW0gdmFsdWVcbiAqIEBwYXJhbSBzdWZmaXhPclNhbml0aXplclxuICovXG5mdW5jdGlvbiBub3JtYWxpemVBbmRBcHBseVN1ZmZpeE9yU2FuaXRpemVyKFxuICAgIHZhbHVlOiBhbnksIHN1ZmZpeE9yU2FuaXRpemVyOiBTYW5pdGl6ZXJGbiB8IHN0cmluZyB8IHVuZGVmaW5lZCB8IG51bGwpOiBzdHJpbmd8bnVsbHx1bmRlZmluZWR8XG4gICAgYm9vbGVhbiB7XG4gIGlmICh2YWx1ZSA9PSBudWxsIC8qKiB8fCB2YWx1ZSA9PT0gdW5kZWZpbmVkICovKSB7XG4gICAgLy8gZG8gbm90aGluZ1xuICB9IGVsc2UgaWYgKHR5cGVvZiBzdWZmaXhPclNhbml0aXplciA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIC8vIHNhbml0aXplIHRoZSB2YWx1ZS5cbiAgICB2YWx1ZSA9IHN1ZmZpeE9yU2FuaXRpemVyKHZhbHVlKTtcbiAgfSBlbHNlIGlmICh0eXBlb2Ygc3VmZml4T3JTYW5pdGl6ZXIgPT09ICdzdHJpbmcnKSB7XG4gICAgdmFsdWUgPSB2YWx1ZSArIHN1ZmZpeE9yU2FuaXRpemVyO1xuICB9IGVsc2UgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcpIHtcbiAgICB2YWx1ZSA9IHN0cmluZ2lmeSh1bndyYXBTYWZlVmFsdWUodmFsdWUpKTtcbiAgfVxuICByZXR1cm4gdmFsdWU7XG59XG5cblxuLyoqXG4gKiBUZXN0cyBpZiB0aGUgYFROb2RlYCBoYXMgaW5wdXQgc2hhZG93LlxuICpcbiAqIEFuIGlucHV0IHNoYWRvdyBpcyB3aGVuIGEgZGlyZWN0aXZlIHN0ZWFscyAoc2hhZG93cykgdGhlIGlucHV0IGJ5IHVzaW5nIGBASW5wdXQoJ3N0eWxlJylgIG9yXG4gKiBgQElucHV0KCdjbGFzcycpYCBhcyBpbnB1dC5cbiAqXG4gKiBAcGFyYW0gdE5vZGUgYFROb2RlYCB3aGljaCB3ZSB3b3VsZCBsaWtlIHRvIHNlZSBpZiBpdCBoYXMgc2hhZG93LlxuICogQHBhcmFtIGlzQ2xhc3NCYXNlZCBgdHJ1ZWAgaWYgYGNsYXNzYCAoYGZhbHNlYCBpZiBgc3R5bGVgKVxuICovXG5leHBvcnQgZnVuY3Rpb24gaGFzU3R5bGluZ0lucHV0U2hhZG93KHROb2RlOiBUTm9kZSwgaXNDbGFzc0Jhc2VkOiBib29sZWFuKSB7XG4gIHJldHVybiAodE5vZGUuZmxhZ3MgJiAoaXNDbGFzc0Jhc2VkID8gVE5vZGVGbGFncy5oYXNDbGFzc0lucHV0IDogVE5vZGVGbGFncy5oYXNTdHlsZUlucHV0KSkgIT09IDA7XG59XG4iXX0=