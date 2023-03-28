/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { unwrapSafeValue } from '../../sanitization/bypass';
import { keyValueArrayGet, keyValueArraySet } from '../../util/array_utils';
import { assertDefined, assertEqual, assertLessThan, assertNotEqual, throwError } from '../../util/assert';
import { EMPTY_ARRAY } from '../../util/empty';
import { concatStringsWithSpace, stringify } from '../../util/stringify';
import { assertFirstUpdatePass } from '../assert';
import { bindingUpdated } from '../bindings';
import { getTStylingRangeNext, getTStylingRangeNextDuplicate, getTStylingRangePrev, getTStylingRangePrevDuplicate } from '../interfaces/styling';
import { RENDERER } from '../interfaces/view';
import { applyStyling } from '../node_manipulation';
import { getCurrentDirectiveDef, getLView, getSelectedIndex, getTView, incrementBindingIndex } from '../state';
import { insertTStylingBinding } from '../styling/style_binding_list';
import { getLastParsedKey, getLastParsedValue, parseClassName, parseClassNameNext, parseStyle, parseStyleNext } from '../styling/styling_parser';
import { NO_CHANGE } from '../tokens';
import { getNativeByIndex } from '../util/view_utils';
import { setDirectiveInputsWhichShadowsStyling } from './property';
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
    for (let i = parseStyle(text); i >= 0; i = parseStyleNext(text, i)) {
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
    for (let i = parseClassName(text); i >= 0; i = parseClassNameNext(text, i)) {
        keyValueArraySet(keyValueArray, getLastParsedKey(text), true);
    }
}
/**
 * Common code between `ɵɵclassProp` and `ɵɵstyleProp`.
 *
 * @param prop property name.
 * @param value binding value.
 * @param suffix suffix for the property (e.g. `em` or `px`)
 * @param isClassBased `true` if `class` change (`false` if `style`)
 */
export function checkStylingProperty(prop, value, suffix, isClassBased) {
    const lView = getLView();
    const tView = getTView();
    // Styling instructions use 2 slots per binding.
    // 1. one for the value / TStylingKey
    // 2. one for the intermittent-value / TStylingRange
    const bindingIndex = incrementBindingIndex(2);
    if (tView.firstUpdatePass) {
        stylingFirstUpdatePass(tView, prop, bindingIndex, isClassBased);
    }
    if (value !== NO_CHANGE && bindingUpdated(lView, bindingIndex, value)) {
        const tNode = tView.data[getSelectedIndex()];
        updateStyling(tView, tNode, lView, lView[RENDERER], prop, lView[bindingIndex + 1] = normalizeSuffix(value, suffix), isClassBased, bindingIndex);
    }
}
/**
 * Common code between `ɵɵclassMap` and `ɵɵstyleMap`.
 *
 * @param keyValueArraySet (See `keyValueArraySet` in "util/array_utils") Gets passed in as a
 *        function so that `style` can be processed. This is done for tree shaking purposes.
 * @param stringParser Parser used to parse `value` if `string`. (Passed in as `style` and `class`
 *        have different parsers.)
 * @param value bound value from application
 * @param isClassBased `true` if `class` change (`false` if `style`)
 */
export function checkStylingMap(keyValueArraySet, stringParser, value, isClassBased) {
    const tView = getTView();
    const bindingIndex = incrementBindingIndex(2);
    if (tView.firstUpdatePass) {
        stylingFirstUpdatePass(tView, null, bindingIndex, isClassBased);
    }
    const lView = getLView();
    if (value !== NO_CHANGE && bindingUpdated(lView, bindingIndex, value)) {
        // `getSelectedIndex()` should be here (rather than in instruction) so that it is guarded by the
        // if so as not to read unnecessarily.
        const tNode = tView.data[getSelectedIndex()];
        if (hasStylingInputShadow(tNode, isClassBased) && !isInHostBindings(tView, bindingIndex)) {
            if (ngDevMode) {
                // verify that if we are shadowing then `TData` is appropriately marked so that we skip
                // processing this binding in styling resolution.
                const tStylingKey = tView.data[bindingIndex];
                assertEqual(Array.isArray(tStylingKey) ? tStylingKey[1] : tStylingKey, false, 'Styling linked list shadow input should be marked as \'false\'');
            }
            // VE does not concatenate the static portion like we are doing here.
            // Instead VE just ignores the static completely if dynamic binding is present.
            // Because of locality we have already set the static portion because we don't know if there
            // is a dynamic portion until later. If we would ignore the static portion it would look like
            // the binding has removed it. This would confuse `[ngStyle]`/`[ngClass]` to do the wrong
            // thing as it would think that the static portion was removed. For this reason we
            // concatenate it so that `[ngStyle]`/`[ngClass]`  can continue to work on changed.
            let staticPrefix = isClassBased ? tNode.classesWithoutHost : tNode.stylesWithoutHost;
            ngDevMode && isClassBased === false && staticPrefix !== null &&
                assertEqual(staticPrefix.endsWith(';'), true, 'Expecting static portion to end with \';\'');
            if (staticPrefix !== null) {
                // We want to make sure that falsy values of `value` become empty strings.
                value = concatStringsWithSpace(staticPrefix, value ? value : '');
            }
            // Given `<div [style] my-dir>` such that `my-dir` has `@Input('style')`.
            // This takes over the `[style]` binding. (Same for `[class]`)
            setDirectiveInputsWhichShadowsStyling(tView, tNode, lView, value, isClassBased);
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
    const tData = tView.data;
    if (tData[bindingIndex + 1] === null) {
        // The above check is necessary because we don't clear first update pass until first successful
        // (no exception) template execution. This prevents the styling instruction from double adding
        // itself to the list.
        // `getSelectedIndex()` should be here (rather than in instruction) so that it is guarded by the
        // if so as not to read unnecessarily.
        const tNode = tData[getSelectedIndex()];
        ngDevMode && assertDefined(tNode, 'TNode expected');
        const isHostBindings = isInHostBindings(tView, bindingIndex);
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
    const hostDirectiveDef = getCurrentDirectiveDef(tData);
    let residual = isClassBased ? tNode.residualClasses : tNode.residualStyles;
    if (hostDirectiveDef === null) {
        // We are in template node.
        // If template node already had styling instruction then it has already collected the static
        // styling and there is no need to collect them again. We know that we are the first styling
        // instruction because the `TNode.*Bindings` points to 0 (nothing has been inserted yet).
        const isFirstStylingInstructionInTemplate = (isClassBased ? tNode.classBindings : tNode.styleBindings) === 0;
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
        const directiveStylingLast = tNode.directiveStylingLast;
        const isFirstStylingInstructionInHostBinding = directiveStylingLast === -1 || tData[directiveStylingLast] !== hostDirectiveDef;
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
                let templateStylingKey = getTemplateHeadTStylingKey(tData, tNode, isClassBased);
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
                residual = collectResidual(tData, tNode, isClassBased);
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
    const bindings = isClassBased ? tNode.classBindings : tNode.styleBindings;
    if (getTStylingRangeNext(bindings) === 0) {
        // There does not seem to be a styling instruction in the `template`.
        return undefined;
    }
    return tData[getTStylingRangePrev(bindings)];
}
/**
 * Update the `TStylingKey` of the first template instruction in `TNode`.
 *
 * Logically `hostBindings` styling instructions are of lower priority than that of the template.
 * However, they execute after the template styling instructions. This means that they get inserted
 * in front of the template styling instructions.
 *
 * If we have a template styling instruction and a new `hostBindings` styling instruction is
 * executed it means that it may need to steal static fields from the template instruction. This
 * method allows us to update the first template instruction `TStylingKey` with a new value.
 *
 * Assume:
 * ```
 * <div my-dir style="color: red" [style.color]="tmplExp"></div>
 *
 * @Directive({
 *   host: {
 *     'style': 'width: 100px',
 *     '[style.color]': 'dirExp',
 *   }
 * })
 * class MyDir {}
 * ```
 *
 * when `[style.color]="tmplExp"` executes it creates this data structure.
 * ```
 *  ['', 'color', 'color', 'red', 'width', '100px'],
 * ```
 *
 * The reason for this is that the template instruction does not know if there are styling
 * instructions and must assume that there are none and must collect all of the static styling.
 * (both
 * `color' and 'width`)
 *
 * When `'[style.color]': 'dirExp',` executes we need to insert a new data into the linked list.
 * ```
 *  ['', 'color', 'width', '100px'],  // newly inserted
 *  ['', 'color', 'color', 'red', 'width', '100px'], // this is wrong
 * ```
 *
 * Notice that the template statics is now wrong as it incorrectly contains `width` so we need to
 * update it like so:
 * ```
 *  ['', 'color', 'width', '100px'],
 *  ['', 'color', 'color', 'red'],    // UPDATE
 * ```
 *
 * @param tData `TData` where the linked list is stored.
 * @param tNode `TNode` for which the styling is being computed.
 * @param isClassBased `true` if `class` (`false` if `style`)
 * @param tStylingKey New `TStylingKey` which is replacing the old one.
 */
function setTemplateHeadTStylingKey(tData, tNode, isClassBased, tStylingKey) {
    const bindings = isClassBased ? tNode.classBindings : tNode.styleBindings;
    ngDevMode &&
        assertNotEqual(getTStylingRangeNext(bindings), 0, 'Expecting to have at least one template styling binding.');
    tData[getTStylingRangePrev(bindings)] = tStylingKey;
}
/**
 * Collect all static values after the current `TNode.directiveStylingLast` index.
 *
 * Collect the remaining styling information which has not yet been collected by an existing
 * styling instruction.
 *
 * @param tData `TData` where the `DirectiveDefs` are stored.
 * @param tNode `TNode` which contains the directive range.
 * @param isClassBased `true` if `class` (`false` if `style`)
 */
function collectResidual(tData, tNode, isClassBased) {
    let residual = undefined;
    const directiveEnd = tNode.directiveEnd;
    ngDevMode &&
        assertNotEqual(tNode.directiveStylingLast, -1, 'By the time this function gets called at least one hostBindings-node styling instruction must have executed.');
    // We add `1 + tNode.directiveStart` because we need to skip the current directive (as we are
    // collecting things after the last `hostBindings` directive which had a styling instruction.)
    for (let i = 1 + tNode.directiveStylingLast; i < directiveEnd; i++) {
        const attrs = tData[i].hostAttrs;
        residual = collectStylingFromTAttrs(residual, attrs, isClassBased);
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
    // We need to loop because there can be directives which have `hostAttrs` but don't have
    // `hostBindings` so this loop catches up to the current directive..
    let currentDirective = null;
    const directiveEnd = tNode.directiveEnd;
    let directiveStylingLast = tNode.directiveStylingLast;
    if (directiveStylingLast === -1) {
        directiveStylingLast = tNode.directiveStart;
    }
    else {
        directiveStylingLast++;
    }
    while (directiveStylingLast < directiveEnd) {
        currentDirective = tData[directiveStylingLast];
        ngDevMode && assertDefined(currentDirective, 'expected to be defined');
        stylingKey = collectStylingFromTAttrs(stylingKey, currentDirective.hostAttrs, isClassBased);
        if (currentDirective === hostDirectiveDef)
            break;
        directiveStylingLast++;
    }
    if (hostDirectiveDef !== null) {
        // we only advance the styling cursor if we are collecting data from host bindings.
        // Template executes before host bindings and so if we would update the index,
        // host bindings would not get their statics.
        tNode.directiveStylingLast = directiveStylingLast;
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
    const desiredMarker = isClassBased ? 1 /* AttributeMarker.Classes */ : 2 /* AttributeMarker.Styles */;
    let currentMarker = -1 /* AttributeMarker.ImplicitAttributes */;
    if (attrs !== null) {
        for (let i = 0; i < attrs.length; i++) {
            const item = attrs[i];
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
 *        function so that `style` can be processed. This is done
 *        for tree shaking purposes.
 * @param stringParser The parser is passed in so that it will be tree shakable. See
 *        `styleStringParser` and `classStringParser`
 * @param value The value to parse/convert to `KeyValueArray`
 */
export function toStylingKeyValueArray(keyValueArraySet, stringParser, value) {
    if (value == null /*|| value === undefined */ || value === '')
        return EMPTY_ARRAY;
    const styleKeyValueArray = [];
    const unwrappedValue = unwrapSafeValue(value);
    if (Array.isArray(unwrappedValue)) {
        for (let i = 0; i < unwrappedValue.length; i++) {
            keyValueArraySet(styleKeyValueArray, unwrappedValue[i], true);
        }
    }
    else if (typeof unwrappedValue === 'object') {
        for (const key in unwrappedValue) {
            if (unwrappedValue.hasOwnProperty(key)) {
                keyValueArraySet(styleKeyValueArray, key, unwrappedValue[key]);
            }
        }
    }
    else if (typeof unwrappedValue === 'string') {
        stringParser(styleKeyValueArray, unwrappedValue);
    }
    else {
        ngDevMode &&
            throwError('Unsupported styling type ' + typeof unwrappedValue + ': ' + unwrappedValue);
    }
    return styleKeyValueArray;
}
/**
 * Set a `value` for a `key`.
 *
 * See: `keyValueArraySet` for details
 *
 * @param keyValueArray KeyValueArray to add to.
 * @param key Style key to add.
 * @param value The value to set.
 */
export function styleKeyValueArraySet(keyValueArray, key, value) {
    keyValueArraySet(keyValueArray, key, unwrapSafeValue(value));
}
/**
 * Update map based styling.
 *
 * Map based styling could be anything which contains more than one binding. For example `string`,
 * or object literal. Dealing with all of these types would complicate the logic so
 * instead this function expects that the complex input is first converted into normalized
 * `KeyValueArray`. The advantage of normalization is that we get the values sorted, which makes it
 * very cheap to compute deltas between the previous and current value.
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
    let oldIndex = 0;
    let newIndex = 0;
    let oldKey = 0 < oldKeyValueArray.length ? oldKeyValueArray[0] : null;
    let newKey = 0 < newKeyValueArray.length ? newKeyValueArray[0] : null;
    while (oldKey !== null || newKey !== null) {
        ngDevMode && assertLessThan(oldIndex, 999, 'Are we stuck in infinite loop?');
        ngDevMode && assertLessThan(newIndex, 999, 'Are we stuck in infinite loop?');
        const oldValue = oldIndex < oldKeyValueArray.length ? oldKeyValueArray[oldIndex + 1] : undefined;
        const newValue = newIndex < newKeyValueArray.length ? newKeyValueArray[newIndex + 1] : undefined;
        let setKey = null;
        let setValue = undefined;
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
    if (!(tNode.type & 3 /* TNodeType.AnyRNode */)) {
        // It is possible to have styling on non-elements (such as ng-container).
        // This is rare, but it does happen. In such a case, just ignore the binding.
        return;
    }
    const tData = tView.data;
    const tRange = tData[bindingIndex + 1];
    const higherPriorityValue = getTStylingRangeNextDuplicate(tRange) ?
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
        const rNode = getNativeByIndex(getSelectedIndex(), lView);
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
 * 2. The normalized value is stored at `index + 1`.
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
    const isPrevDirection = tNode === null;
    let value = undefined;
    while (index > 0) {
        const rawKey = tData[index];
        const containsStatics = Array.isArray(rawKey);
        // Unwrap the key if we contain static values.
        const key = containsStatics ? rawKey[1] : rawKey;
        const isStylingMap = key === null;
        let valueAtLViewIndex = lView[index + 1];
        if (valueAtLViewIndex === NO_CHANGE) {
            // In firstUpdatePass the styling instructions create a linked list of styling.
            // On subsequent passes it is possible for a styling instruction to try to read a binding
            // which
            // has not yet executed. In that case we will find `NO_CHANGE` and we should assume that
            // we have `undefined` (or empty array in case of styling-map instruction) instead. This
            // allows the resolution to apply the value (which may later be overwritten when the
            // binding actually executes.)
            valueAtLViewIndex = isStylingMap ? EMPTY_ARRAY : undefined;
        }
        let currentValue = isStylingMap ? keyValueArrayGet(valueAtLViewIndex, prop) :
            (key === prop ? valueAtLViewIndex : undefined);
        if (containsStatics && !isStylingValuePresent(currentValue)) {
            currentValue = keyValueArrayGet(rawKey, prop);
        }
        if (isStylingValuePresent(currentValue)) {
            value = currentValue;
            if (isPrevDirection) {
                return value;
            }
        }
        const tRange = tData[index + 1];
        index = isPrevDirection ? getTStylingRangePrev(tRange) : getTStylingRangeNext(tRange);
    }
    if (tNode !== null) {
        // in case where we are going in next direction AND we did not find anything, we need to
        // consult residual styling
        let residual = isClassBased ? tNode.residualClasses : tNode.residualStyles;
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
 * Normalizes and/or adds a suffix to the value.
 *
 * If value is `null`/`undefined` no suffix is added
 * @param value
 * @param suffix
 */
function normalizeSuffix(value, suffix) {
    if (value == null || value === '') {
        // do nothing
        // Do not add the suffix if the value is going to be empty.
        // As it produce invalid CSS, which the browsers will automatically omit but Domino will not.
        // Example: `"left": "px;"` instead of `"left": ""`.
    }
    else if (typeof suffix === 'string') {
        value = value + suffix;
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
    return (tNode.flags & (isClassBased ? 8 /* TNodeFlags.hasClassInput */ : 16 /* TNodeFlags.hasStyleInput */)) !== 0;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3R5bGluZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaW5zdHJ1Y3Rpb25zL3N0eWxpbmcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFZLGVBQWUsRUFBQyxNQUFNLDJCQUEyQixDQUFDO0FBQ3JFLE9BQU8sRUFBZ0IsZ0JBQWdCLEVBQUUsZ0JBQWdCLEVBQUMsTUFBTSx3QkFBd0IsQ0FBQztBQUN6RixPQUFPLEVBQUMsYUFBYSxFQUFFLFdBQVcsRUFBRSxjQUFjLEVBQUUsY0FBYyxFQUFFLFVBQVUsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQ3pHLE9BQU8sRUFBQyxXQUFXLEVBQUMsTUFBTSxrQkFBa0IsQ0FBQztBQUM3QyxPQUFPLEVBQUMsc0JBQXNCLEVBQUUsU0FBUyxFQUFDLE1BQU0sc0JBQXNCLENBQUM7QUFDdkUsT0FBTyxFQUFDLHFCQUFxQixFQUFDLE1BQU0sV0FBVyxDQUFDO0FBQ2hELE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxhQUFhLENBQUM7QUFLM0MsT0FBTyxFQUFDLG9CQUFvQixFQUFFLDZCQUE2QixFQUFFLG9CQUFvQixFQUFFLDZCQUE2QixFQUE2QixNQUFNLHVCQUF1QixDQUFDO0FBQzNLLE9BQU8sRUFBUSxRQUFRLEVBQWUsTUFBTSxvQkFBb0IsQ0FBQztBQUNqRSxPQUFPLEVBQUMsWUFBWSxFQUFDLE1BQU0sc0JBQXNCLENBQUM7QUFDbEQsT0FBTyxFQUFDLHNCQUFzQixFQUFFLFFBQVEsRUFBRSxnQkFBZ0IsRUFBRSxRQUFRLEVBQUUscUJBQXFCLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDN0csT0FBTyxFQUFDLHFCQUFxQixFQUFDLE1BQU0sK0JBQStCLENBQUM7QUFDcEUsT0FBTyxFQUFDLGdCQUFnQixFQUFFLGtCQUFrQixFQUFFLGNBQWMsRUFBRSxrQkFBa0IsRUFB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XG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7U2FmZVZhbHVlLCB1bndyYXBTYWZlVmFsdWV9IGZyb20gJy4uLy4uL3Nhbml0aXphdGlvbi9ieXBhc3MnO1xuaW1wb3J0IHtLZXlWYWx1ZUFycmF5LCBrZXlWYWx1ZUFycmF5R2V0LCBrZXlWYWx1ZUFycmF5U2V0fSBmcm9tICcuLi8uLi91dGlsL2FycmF5X3V0aWxzJztcbmltcG9ydCB7YXNzZXJ0RGVmaW5lZCwgYXNzZXJ0RXF1YWwsIGFzc2VydExlc3NUaGFuLCBhc3NlcnROb3RFcXVhbCwgdGhyb3dFcnJvcn0gZnJvbSAnLi4vLi4vdXRpbC9hc3NlcnQnO1xuaW1wb3J0IHtFTVBUWV9BUlJBWX0gZnJvbSAnLi4vLi4vdXRpbC9lbXB0eSc7XG5pbXBvcnQge2NvbmNhdFN0cmluZ3NXaXRoU3BhY2UsIHN0cmluZ2lmeX0gZnJvbSAnLi4vLi4vdXRpbC9zdHJpbmdpZnknO1xuaW1wb3J0IHthc3NlcnRGaXJzdFVwZGF0ZVBhc3N9IGZyb20gJy4uL2Fzc2VydCc7XG5pbXBvcnQge2JpbmRpbmdVcGRhdGVkfSBmcm9tICcuLi9iaW5kaW5ncyc7XG5pbXBvcnQge0RpcmVjdGl2ZURlZn0gZnJvbSAnLi4vaW50ZXJmYWNlcy9kZWZpbml0aW9uJztcbmltcG9ydCB7QXR0cmlidXRlTWFya2VyLCBUQXR0cmlidXRlcywgVE5vZGUsIFROb2RlRmxhZ3MsIFROb2RlVHlwZX0gZnJvbSAnLi4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7UmVuZGVyZXJ9IGZyb20gJy4uL2ludGVyZmFjZXMvcmVuZGVyZXInO1xuaW1wb3J0IHtSRWxlbWVudH0gZnJvbSAnLi4vaW50ZXJmYWNlcy9yZW5kZXJlcl9kb20nO1xuaW1wb3J0IHtnZXRUU3R5bGluZ1JhbmdlTmV4dCwgZ2V0VFN0eWxpbmdSYW5nZU5leHREdXBsaWNhdGUsIGdldFRTdHlsaW5nUmFuZ2VQcmV2LCBnZXRUU3R5bGluZ1JhbmdlUHJldkR1cGxpY2F0ZSwgVFN0eWxpbmdLZXksIFRTdHlsaW5nUmFuZ2V9IGZyb20gJy4uL2ludGVyZmFjZXMvc3R5bGluZyc7XG5pbXBvcnQge0xWaWV3LCBSRU5ERVJFUiwgVERhdGEsIFRWaWV3fSBmcm9tICcuLi9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHthcHBseVN0eWxpbmd9IGZyb20gJy4uL25vZGVfbWFuaXB1bGF0aW9uJztcbmltcG9ydCB7Z2V0Q3VycmVudERpcmVjdGl2ZURlZiwgZ2V0TFZpZXcsIGdldFNlbGVjdGVkSW5kZXgsIGdldFRWaWV3LCBpbmNyZW1lbnRCaW5kaW5nSW5kZXh9IGZyb20gJy4uL3N0YXRlJztcbmltcG9ydCB7aW5zZXJ0VFN0eWxpbmdCaW5kaW5nfSBmcm9tICcuLi9zdHlsaW5nL3N0eWxlX2JpbmRpbmdfbGlzdCc7XG5pbXBvcnQge2dldExhc3RQYXJzZWRLZXksIGdldExhc3RQYXJzZWRWYWx1ZSwgcGFyc2VDbGFzc05hbWUsIHBhcnNlQ2xhc3NOYW1lTmV4dCwgcGFyc2VTdHlsZSwgcGFyc2VTdHlsZU5leHR9IGZyb20gJy4uL3N0eWxpbmcvc3R5bGluZ19wYXJzZXInO1xuaW1wb3J0IHtOT19DSEFOR0V9IGZyb20gJy4uL3Rva2Vucyc7XG5pbXBvcnQge2dldE5hdGl2ZUJ5SW5kZXh9IGZyb20gJy4uL3V0aWwvdmlld191dGlscyc7XG5cbmltcG9ydCB7c2V0RGlyZWN0aXZlSW5wdXRzV2hpY2hTaGFkb3dzU3R5bGluZ30gZnJvbSAnLi9wcm9wZXJ0eSc7XG5cblxuLyoqXG4gKiBVcGRhdGUgYSBzdHlsZSBiaW5kaW5nIG9uIGFuIGVsZW1lbnQgd2l0aCB0aGUgcHJvdmlkZWQgdmFsdWUuXG4gKlxuICogSWYgdGhlIHN0eWxlIHZhbHVlIGlzIGZhbHN5IHRoZW4gaXQgd2lsbCBiZSByZW1vdmVkIGZyb20gdGhlIGVsZW1lbnRcbiAqIChvciBhc3NpZ25lZCBhIGRpZmZlcmVudCB2YWx1ZSBkZXBlbmRpbmcgaWYgdGhlcmUgYXJlIGFueSBzdHlsZXMgcGxhY2VkXG4gKiBvbiB0aGUgZWxlbWVudCB3aXRoIGBzdHlsZU1hcGAgb3IgYW55IHN0YXRpYyBzdHlsZXMgdGhhdCBhcmVcbiAqIHByZXNlbnQgZnJvbSB3aGVuIHRoZSBlbGVtZW50IHdhcyBjcmVhdGVkIHdpdGggYHN0eWxpbmdgKS5cbiAqXG4gKiBOb3RlIHRoYXQgdGhlIHN0eWxpbmcgZWxlbWVudCBpcyB1cGRhdGVkIGFzIHBhcnQgb2YgYHN0eWxpbmdBcHBseWAuXG4gKlxuICogQHBhcmFtIHByb3AgQSB2YWxpZCBDU1MgcHJvcGVydHkuXG4gKiBAcGFyYW0gdmFsdWUgTmV3IHZhbHVlIHRvIHdyaXRlIChgbnVsbGAgb3IgYW4gZW1wdHkgc3RyaW5nIHRvIHJlbW92ZSkuXG4gKiBAcGFyYW0gc3VmZml4IE9wdGlvbmFsIHN1ZmZpeC4gVXNlZCB3aXRoIHNjYWxhciB2YWx1ZXMgdG8gYWRkIHVuaXQgc3VjaCBhcyBgcHhgLlxuICpcbiAqIE5vdGUgdGhhdCB0aGlzIHdpbGwgYXBwbHkgdGhlIHByb3ZpZGVkIHN0eWxlIHZhbHVlIHRvIHRoZSBob3N0IGVsZW1lbnQgaWYgdGhpcyBmdW5jdGlvbiBpcyBjYWxsZWRcbiAqIHdpdGhpbiBhIGhvc3QgYmluZGluZyBmdW5jdGlvbi5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtXN0eWxlUHJvcChcbiAgICBwcm9wOiBzdHJpbmcsIHZhbHVlOiBzdHJpbmd8bnVtYmVyfFNhZmVWYWx1ZXx1bmRlZmluZWR8bnVsbCxcbiAgICBzdWZmaXg/OiBzdHJpbmd8bnVsbCk6IHR5cGVvZiDJtcm1c3R5bGVQcm9wIHtcbiAgY2hlY2tTdHlsaW5nUHJvcGVydHkocHJvcCwgdmFsdWUsIHN1ZmZpeCwgZmFsc2UpO1xuICByZXR1cm4gybXJtXN0eWxlUHJvcDtcbn1cblxuLyoqXG4gKiBVcGRhdGUgYSBjbGFzcyBiaW5kaW5nIG9uIGFuIGVsZW1lbnQgd2l0aCB0aGUgcHJvdmlkZWQgdmFsdWUuXG4gKlxuICogVGhpcyBpbnN0cnVjdGlvbiBpcyBtZWFudCB0byBoYW5kbGUgdGhlIGBbY2xhc3MuZm9vXT1cImV4cFwiYCBjYXNlIGFuZCxcbiAqIHRoZXJlZm9yZSwgdGhlIGNsYXNzIGJpbmRpbmcgaXRzZWxmIG11c3QgYWxyZWFkeSBiZSBhbGxvY2F0ZWQgdXNpbmdcbiAqIGBzdHlsaW5nYCB3aXRoaW4gdGhlIGNyZWF0aW9uIGJsb2NrLlxuICpcbiAqIEBwYXJhbSBwcm9wIEEgdmFsaWQgQ1NTIGNsYXNzIChvbmx5IG9uZSkuXG4gKiBAcGFyYW0gdmFsdWUgQSB0cnVlL2ZhbHNlIHZhbHVlIHdoaWNoIHdpbGwgdHVybiB0aGUgY2xhc3Mgb24gb3Igb2ZmLlxuICpcbiAqIE5vdGUgdGhhdCB0aGlzIHdpbGwgYXBwbHkgdGhlIHByb3ZpZGVkIGNsYXNzIHZhbHVlIHRvIHRoZSBob3N0IGVsZW1lbnQgaWYgdGhpcyBmdW5jdGlvblxuICogaXMgY2FsbGVkIHdpdGhpbiBhIGhvc3QgYmluZGluZyBmdW5jdGlvbi5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWNsYXNzUHJvcChjbGFzc05hbWU6IHN0cmluZywgdmFsdWU6IGJvb2xlYW58dW5kZWZpbmVkfG51bGwpOiB0eXBlb2YgybXJtWNsYXNzUHJvcCB7XG4gIGNoZWNrU3R5bGluZ1Byb3BlcnR5KGNsYXNzTmFtZSwgdmFsdWUsIG51bGwsIHRydWUpO1xuICByZXR1cm4gybXJtWNsYXNzUHJvcDtcbn1cblxuXG4vKipcbiAqIFVwZGF0ZSBzdHlsZSBiaW5kaW5ncyB1c2luZyBhbiBvYmplY3QgbGl0ZXJhbCBvbiBhbiBlbGVtZW50LlxuICpcbiAqIFRoaXMgaW5zdHJ1Y3Rpb24gaXMgbWVhbnQgdG8gYXBwbHkgc3R5bGluZyB2aWEgdGhlIGBbc3R5bGVdPVwiZXhwXCJgIHRlbXBsYXRlIGJpbmRpbmdzLlxuICogV2hlbiBzdHlsZXMgYXJlIGFwcGxpZWQgdG8gdGhlIGVsZW1lbnQgdGhleSB3aWxsIHRoZW4gYmUgdXBkYXRlZCB3aXRoIHJlc3BlY3QgdG9cbiAqIGFueSBzdHlsZXMvY2xhc3NlcyBzZXQgdmlhIGBzdHlsZVByb3BgLiBJZiBhbnkgc3R5bGVzIGFyZSBzZXQgdG8gZmFsc3lcbiAqIHRoZW4gdGhleSB3aWxsIGJlIHJlbW92ZWQgZnJvbSB0aGUgZWxlbWVudC5cbiAqXG4gKiBOb3RlIHRoYXQgdGhlIHN0eWxpbmcgaW5zdHJ1Y3Rpb24gd2lsbCBub3QgYmUgYXBwbGllZCB1bnRpbCBgc3R5bGluZ0FwcGx5YCBpcyBjYWxsZWQuXG4gKlxuICogQHBhcmFtIHN0eWxlcyBBIGtleS92YWx1ZSBzdHlsZSBtYXAgb2YgdGhlIHN0eWxlcyB0aGF0IHdpbGwgYmUgYXBwbGllZCB0byB0aGUgZ2l2ZW4gZWxlbWVudC5cbiAqICAgICAgICBBbnkgbWlzc2luZyBzdHlsZXMgKHRoYXQgaGF2ZSBhbHJlYWR5IGJlZW4gYXBwbGllZCB0byB0aGUgZWxlbWVudCBiZWZvcmVoYW5kKSB3aWxsIGJlXG4gKiAgICAgICAgcmVtb3ZlZCAodW5zZXQpIGZyb20gdGhlIGVsZW1lbnQncyBzdHlsaW5nLlxuICpcbiAqIE5vdGUgdGhhdCB0aGlzIHdpbGwgYXBwbHkgdGhlIHByb3ZpZGVkIHN0eWxlTWFwIHZhbHVlIHRvIHRoZSBob3N0IGVsZW1lbnQgaWYgdGhpcyBmdW5jdGlvblxuICogaXMgY2FsbGVkIHdpdGhpbiBhIGhvc3QgYmluZGluZy5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtXN0eWxlTWFwKHN0eWxlczoge1tzdHlsZU5hbWU6IHN0cmluZ106IGFueX18c3RyaW5nfHVuZGVmaW5lZHxudWxsKTogdm9pZCB7XG4gIGNoZWNrU3R5bGluZ01hcChzdHlsZUtleVZhbHVlQXJyYXlTZXQsIHN0eWxlU3RyaW5nUGFyc2VyLCBzdHlsZXMsIGZhbHNlKTtcbn1cblxuXG4vKipcbiAqIFBhcnNlIHRleHQgYXMgc3R5bGUgYW5kIGFkZCB2YWx1ZXMgdG8gS2V5VmFsdWVBcnJheS5cbiAqXG4gKiBUaGlzIGNvZGUgaXMgcHVsbGVkIG91dCB0byBhIHNlcGFyYXRlIGZ1bmN0aW9uIHNvIHRoYXQgaXQgY2FuIGJlIHRyZWUgc2hha2VuIGF3YXkgaWYgaXQgaXMgbm90XG4gKiBuZWVkZWQuIEl0IGlzIG9ubHkgcmVmZXJlbmNlZCBmcm9tIGDJtcm1c3R5bGVNYXBgLlxuICpcbiAqIEBwYXJhbSBrZXlWYWx1ZUFycmF5IEtleVZhbHVlQXJyYXkgdG8gYWRkIHBhcnNlZCB2YWx1ZXMgdG8uXG4gKiBAcGFyYW0gdGV4dCB0ZXh0IHRvIHBhcnNlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gc3R5bGVTdHJpbmdQYXJzZXIoa2V5VmFsdWVBcnJheTogS2V5VmFsdWVBcnJheTxhbnk+LCB0ZXh0OiBzdHJpbmcpOiB2b2lkIHtcbiAgZm9yIChsZXQgaSA9IHBhcnNlU3R5bGUodGV4dCk7IGkgPj0gMDsgaSA9IHBhcnNlU3R5bGVOZXh0KHRleHQsIGkpKSB7XG4gICAgc3R5bGVLZXlWYWx1ZUFycmF5U2V0KGtleVZhbHVlQXJyYXksIGdldExhc3RQYXJzZWRLZXkodGV4dCksIGdldExhc3RQYXJzZWRWYWx1ZSh0ZXh0KSk7XG4gIH1cbn1cblxuXG4vKipcbiAqIFVwZGF0ZSBjbGFzcyBiaW5kaW5ncyB1c2luZyBhbiBvYmplY3QgbGl0ZXJhbCBvciBjbGFzcy1zdHJpbmcgb24gYW4gZWxlbWVudC5cbiAqXG4gKiBUaGlzIGluc3RydWN0aW9uIGlzIG1lYW50IHRvIGFwcGx5IHN0eWxpbmcgdmlhIHRoZSBgW2NsYXNzXT1cImV4cFwiYCB0ZW1wbGF0ZSBiaW5kaW5ncy5cbiAqIFdoZW4gY2xhc3NlcyBhcmUgYXBwbGllZCB0byB0aGUgZWxlbWVudCB0aGV5IHdpbGwgdGhlbiBiZSB1cGRhdGVkIHdpdGhcbiAqIHJlc3BlY3QgdG8gYW55IHN0eWxlcy9jbGFzc2VzIHNldCB2aWEgYGNsYXNzUHJvcGAuIElmIGFueVxuICogY2xhc3NlcyBhcmUgc2V0IHRvIGZhbHN5IHRoZW4gdGhleSB3aWxsIGJlIHJlbW92ZWQgZnJvbSB0aGUgZWxlbWVudC5cbiAqXG4gKiBOb3RlIHRoYXQgdGhlIHN0eWxpbmcgaW5zdHJ1Y3Rpb24gd2lsbCBub3QgYmUgYXBwbGllZCB1bnRpbCBgc3R5bGluZ0FwcGx5YCBpcyBjYWxsZWQuXG4gKiBOb3RlIHRoYXQgdGhpcyB3aWxsIHRoZSBwcm92aWRlZCBjbGFzc01hcCB2YWx1ZSB0byB0aGUgaG9zdCBlbGVtZW50IGlmIHRoaXMgZnVuY3Rpb24gaXMgY2FsbGVkXG4gKiB3aXRoaW4gYSBob3N0IGJpbmRpbmcuXG4gKlxuICogQHBhcmFtIGNsYXNzZXMgQSBrZXkvdmFsdWUgbWFwIG9yIHN0cmluZyBvZiBDU1MgY2xhc3NlcyB0aGF0IHdpbGwgYmUgYWRkZWQgdG8gdGhlXG4gKiAgICAgICAgZ2l2ZW4gZWxlbWVudC4gQW55IG1pc3NpbmcgY2xhc3NlcyAodGhhdCBoYXZlIGFscmVhZHkgYmVlbiBhcHBsaWVkIHRvIHRoZSBlbGVtZW50XG4gKiAgICAgICAgYmVmb3JlaGFuZCkgd2lsbCBiZSByZW1vdmVkICh1bnNldCkgZnJvbSB0aGUgZWxlbWVudCdzIGxpc3Qgb2YgQ1NTIGNsYXNzZXMuXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVjbGFzc01hcChjbGFzc2VzOiB7W2NsYXNzTmFtZTogc3RyaW5nXTogYm9vbGVhbnx1bmRlZmluZWR8bnVsbH18c3RyaW5nfHVuZGVmaW5lZHxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIG51bGwpOiB2b2lkIHtcbiAgY2hlY2tTdHlsaW5nTWFwKGtleVZhbHVlQXJyYXlTZXQsIGNsYXNzU3RyaW5nUGFyc2VyLCBjbGFzc2VzLCB0cnVlKTtcbn1cblxuLyoqXG4gKiBQYXJzZSB0ZXh0IGFzIGNsYXNzIGFuZCBhZGQgdmFsdWVzIHRvIEtleVZhbHVlQXJyYXkuXG4gKlxuICogVGhpcyBjb2RlIGlzIHB1bGxlZCBvdXQgdG8gYSBzZXBhcmF0ZSBmdW5jdGlvbiBzbyB0aGF0IGl0IGNhbiBiZSB0cmVlIHNoYWtlbiBhd2F5IGlmIGl0IGlzIG5vdFxuICogbmVlZGVkLiBJdCBpcyBvbmx5IHJlZmVyZW5jZWQgZnJvbSBgybXJtWNsYXNzTWFwYC5cbiAqXG4gKiBAcGFyYW0ga2V5VmFsdWVBcnJheSBLZXlWYWx1ZUFycmF5IHRvIGFkZCBwYXJzZWQgdmFsdWVzIHRvLlxuICogQHBhcmFtIHRleHQgdGV4dCB0byBwYXJzZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNsYXNzU3RyaW5nUGFyc2VyKGtleVZhbHVlQXJyYXk6IEtleVZhbHVlQXJyYXk8YW55PiwgdGV4dDogc3RyaW5nKTogdm9pZCB7XG4gIGZvciAobGV0IGkgPSBwYXJzZUNsYXNzTmFtZSh0ZXh0KTsgaSA+PSAwOyBpID0gcGFyc2VDbGFzc05hbWVOZXh0KHRleHQsIGkpKSB7XG4gICAga2V5VmFsdWVBcnJheVNldChrZXlWYWx1ZUFycmF5LCBnZXRMYXN0UGFyc2VkS2V5KHRleHQpLCB0cnVlKTtcbiAgfVxufVxuXG4vKipcbiAqIENvbW1vbiBjb2RlIGJldHdlZW4gYMm1ybVjbGFzc1Byb3BgIGFuZCBgybXJtXN0eWxlUHJvcGAuXG4gKlxuICogQHBhcmFtIHByb3AgcHJvcGVydHkgbmFtZS5cbiAqIEBwYXJhbSB2YWx1ZSBiaW5kaW5nIHZhbHVlLlxuICogQHBhcmFtIHN1ZmZpeCBzdWZmaXggZm9yIHRoZSBwcm9wZXJ0eSAoZS5nLiBgZW1gIG9yIGBweGApXG4gKiBAcGFyYW0gaXNDbGFzc0Jhc2VkIGB0cnVlYCBpZiBgY2xhc3NgIGNoYW5nZSAoYGZhbHNlYCBpZiBgc3R5bGVgKVxuICovXG5leHBvcnQgZnVuY3Rpb24gY2hlY2tTdHlsaW5nUHJvcGVydHkoXG4gICAgcHJvcDogc3RyaW5nLCB2YWx1ZTogYW55fE5PX0NIQU5HRSwgc3VmZml4OiBzdHJpbmd8dW5kZWZpbmVkfG51bGwsXG4gICAgaXNDbGFzc0Jhc2VkOiBib29sZWFuKTogdm9pZCB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgdFZpZXcgPSBnZXRUVmlldygpO1xuICAvLyBTdHlsaW5nIGluc3RydWN0aW9ucyB1c2UgMiBzbG90cyBwZXIgYmluZGluZy5cbiAgLy8gMS4gb25lIGZvciB0aGUgdmFsdWUgLyBUU3R5bGluZ0tleVxuICAvLyAyLiBvbmUgZm9yIHRoZSBpbnRlcm1pdHRlbnQtdmFsdWUgLyBUU3R5bGluZ1JhbmdlXG4gIGNvbnN0IGJpbmRpbmdJbmRleCA9IGluY3JlbWVudEJpbmRpbmdJbmRleCgyKTtcbiAgaWYgKHRWaWV3LmZpcnN0VXBkYXRlUGFzcykge1xuICAgIHN0eWxpbmdGaXJzdFVwZGF0ZVBhc3ModFZpZXcsIHByb3AsIGJpbmRpbmdJbmRleCwgaXNDbGFzc0Jhc2VkKTtcbiAgfVxuICBpZiAodmFsdWUgIT09IE5PX0NIQU5HRSAmJiBiaW5kaW5nVXBkYXRlZChsVmlldywgYmluZGluZ0luZGV4LCB2YWx1ZSkpIHtcbiAgICBjb25zdCB0Tm9kZSA9IHRWaWV3LmRhdGFbZ2V0U2VsZWN0ZWRJbmRleCgpXSBhcyBUTm9kZTtcbiAgICB1cGRhdGVTdHlsaW5nKFxuICAgICAgICB0VmlldywgdE5vZGUsIGxWaWV3LCBsVmlld1tSRU5ERVJFUl0sIHByb3AsXG4gICAgICAgIGxWaWV3W2JpbmRpbmdJbmRleCArIDFdID0gbm9ybWFsaXplU3VmZml4KHZhbHVlLCBzdWZmaXgpLCBpc0NsYXNzQmFzZWQsIGJpbmRpbmdJbmRleCk7XG4gIH1cbn1cblxuLyoqXG4gKiBDb21tb24gY29kZSBiZXR3ZWVuIGDJtcm1Y2xhc3NNYXBgIGFuZCBgybXJtXN0eWxlTWFwYC5cbiAqXG4gKiBAcGFyYW0ga2V5VmFsdWVBcnJheVNldCAoU2VlIGBrZXlWYWx1ZUFycmF5U2V0YCBpbiBcInV0aWwvYXJyYXlfdXRpbHNcIikgR2V0cyBwYXNzZWQgaW4gYXMgYVxuICogICAgICAgIGZ1bmN0aW9uIHNvIHRoYXQgYHN0eWxlYCBjYW4gYmUgcHJvY2Vzc2VkLiBUaGlzIGlzIGRvbmUgZm9yIHRyZWUgc2hha2luZyBwdXJwb3Nlcy5cbiAqIEBwYXJhbSBzdHJpbmdQYXJzZXIgUGFyc2VyIHVzZWQgdG8gcGFyc2UgYHZhbHVlYCBpZiBgc3RyaW5nYC4gKFBhc3NlZCBpbiBhcyBgc3R5bGVgIGFuZCBgY2xhc3NgXG4gKiAgICAgICAgaGF2ZSBkaWZmZXJlbnQgcGFyc2Vycy4pXG4gKiBAcGFyYW0gdmFsdWUgYm91bmQgdmFsdWUgZnJvbSBhcHBsaWNhdGlvblxuICogQHBhcmFtIGlzQ2xhc3NCYXNlZCBgdHJ1ZWAgaWYgYGNsYXNzYCBjaGFuZ2UgKGBmYWxzZWAgaWYgYHN0eWxlYClcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNoZWNrU3R5bGluZ01hcChcbiAgICBrZXlWYWx1ZUFycmF5U2V0OiAoa2V5VmFsdWVBcnJheTogS2V5VmFsdWVBcnJheTxhbnk+LCBrZXk6IHN0cmluZywgdmFsdWU6IGFueSkgPT4gdm9pZCxcbiAgICBzdHJpbmdQYXJzZXI6IChzdHlsZUtleVZhbHVlQXJyYXk6IEtleVZhbHVlQXJyYXk8YW55PiwgdGV4dDogc3RyaW5nKSA9PiB2b2lkLFxuICAgIHZhbHVlOiBhbnl8Tk9fQ0hBTkdFLCBpc0NsYXNzQmFzZWQ6IGJvb2xlYW4pOiB2b2lkIHtcbiAgY29uc3QgdFZpZXcgPSBnZXRUVmlldygpO1xuICBjb25zdCBiaW5kaW5nSW5kZXggPSBpbmNyZW1lbnRCaW5kaW5nSW5kZXgoMik7XG4gIGlmICh0Vmlldy5maXJzdFVwZGF0ZVBhc3MpIHtcbiAgICBzdHlsaW5nRmlyc3RVcGRhdGVQYXNzKHRWaWV3LCBudWxsLCBiaW5kaW5nSW5kZXgsIGlzQ2xhc3NCYXNlZCk7XG4gIH1cbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBpZiAodmFsdWUgIT09IE5PX0NIQU5HRSAmJiBiaW5kaW5nVXBkYXRlZChsVmlldywgYmluZGluZ0luZGV4LCB2YWx1ZSkpIHtcbiAgICAvLyBgZ2V0U2VsZWN0ZWRJbmRleCgpYCBzaG91bGQgYmUgaGVyZSAocmF0aGVyIHRoYW4gaW4gaW5zdHJ1Y3Rpb24pIHNvIHRoYXQgaXQgaXMgZ3VhcmRlZCBieSB0aGVcbiAgICAvLyBpZiBzbyBhcyBub3QgdG8gcmVhZCB1bm5lY2Vzc2FyaWx5LlxuICAgIGNvbnN0IHROb2RlID0gdFZpZXcuZGF0YVtnZXRTZWxlY3RlZEluZGV4KCldIGFzIFROb2RlO1xuICAgIGlmIChoYXNTdHlsaW5nSW5wdXRTaGFkb3codE5vZGUsIGlzQ2xhc3NCYXNlZCkgJiYgIWlzSW5Ib3N0QmluZGluZ3ModFZpZXcsIGJpbmRpbmdJbmRleCkpIHtcbiAgICAgIGlmIChuZ0Rldk1vZGUpIHtcbiAgICAgICAgLy8gdmVyaWZ5IHRoYXQgaWYgd2UgYXJlIHNoYWRvd2luZyB0aGVuIGBURGF0YWAgaXMgYXBwcm9wcmlhdGVseSBtYXJrZWQgc28gdGhhdCB3ZSBza2lwXG4gICAgICAgIC8vIHByb2Nlc3NpbmcgdGhpcyBiaW5kaW5nIGluIHN0eWxpbmcgcmVzb2x1dGlvbi5cbiAgICAgICAgY29uc3QgdFN0eWxpbmdLZXkgPSB0Vmlldy5kYXRhW2JpbmRpbmdJbmRleF07XG4gICAgICAgIGFzc2VydEVxdWFsKFxuICAgICAgICAgICAgQXJyYXkuaXNBcnJheSh0U3R5bGluZ0tleSkgPyB0U3R5bGluZ0tleVsxXSA6IHRTdHlsaW5nS2V5LCBmYWxzZSxcbiAgICAgICAgICAgICdTdHlsaW5nIGxpbmtlZCBsaXN0IHNoYWRvdyBpbnB1dCBzaG91bGQgYmUgbWFya2VkIGFzIFxcJ2ZhbHNlXFwnJyk7XG4gICAgICB9XG4gICAgICAvLyBWRSBkb2VzIG5vdCBjb25jYXRlbmF0ZSB0aGUgc3RhdGljIHBvcnRpb24gbGlrZSB3ZSBhcmUgZG9pbmcgaGVyZS5cbiAgICAgIC8vIEluc3RlYWQgVkUganVzdCBpZ25vcmVzIHRoZSBzdGF0aWMgY29tcGxldGVseSBpZiBkeW5hbWljIGJpbmRpbmcgaXMgcHJlc2VudC5cbiAgICAgIC8vIEJlY2F1c2Ugb2YgbG9jYWxpdHkgd2UgaGF2ZSBhbHJlYWR5IHNldCB0aGUgc3RhdGljIHBvcnRpb24gYmVjYXVzZSB3ZSBkb24ndCBrbm93IGlmIHRoZXJlXG4gICAgICAvLyBpcyBhIGR5bmFtaWMgcG9ydGlvbiB1bnRpbCBsYXRlci4gSWYgd2Ugd291bGQgaWdub3JlIHRoZSBzdGF0aWMgcG9ydGlvbiBpdCB3b3VsZCBsb29rIGxpa2VcbiAgICAgIC8vIHRoZSBiaW5kaW5nIGhhcyByZW1vdmVkIGl0LiBUaGlzIHdvdWxkIGNvbmZ1c2UgYFtuZ1N0eWxlXWAvYFtuZ0NsYXNzXWAgdG8gZG8gdGhlIHdyb25nXG4gICAgICAvLyB0aGluZyBhcyBpdCB3b3VsZCB0aGluayB0aGF0IHRoZSBzdGF0aWMgcG9ydGlvbiB3YXMgcmVtb3ZlZC4gRm9yIHRoaXMgcmVhc29uIHdlXG4gICAgICAvLyBjb25jYXRlbmF0ZSBpdCBzbyB0aGF0IGBbbmdTdHlsZV1gL2BbbmdDbGFzc11gICBjYW4gY29udGludWUgdG8gd29yayBvbiBjaGFuZ2VkLlxuICAgICAgbGV0IHN0YXRpY1ByZWZpeCA9IGlzQ2xhc3NCYXNlZCA/IHROb2RlLmNsYXNzZXNXaXRob3V0SG9zdCA6IHROb2RlLnN0eWxlc1dpdGhvdXRIb3N0O1xuICAgICAgbmdEZXZNb2RlICYmIGlzQ2xhc3NCYXNlZCA9PT0gZmFsc2UgJiYgc3RhdGljUHJlZml4ICE9PSBudWxsICYmXG4gICAgICAgICAgYXNzZXJ0RXF1YWwoXG4gICAgICAgICAgICAgIHN0YXRpY1ByZWZpeC5lbmRzV2l0aCgnOycpLCB0cnVlLCAnRXhwZWN0aW5nIHN0YXRpYyBwb3J0aW9uIHRvIGVuZCB3aXRoIFxcJztcXCcnKTtcbiAgICAgIGlmIChzdGF0aWNQcmVmaXggIT09IG51bGwpIHtcbiAgICAgICAgLy8gV2Ugd2FudCB0byBtYWtlIHN1cmUgdGhhdCBmYWxzeSB2YWx1ZXMgb2YgYHZhbHVlYCBiZWNvbWUgZW1wdHkgc3RyaW5ncy5cbiAgICAgICAgdmFsdWUgPSBjb25jYXRTdHJpbmdzV2l0aFNwYWNlKHN0YXRpY1ByZWZpeCwgdmFsdWUgPyB2YWx1ZSA6ICcnKTtcbiAgICAgIH1cbiAgICAgIC8vIEdpdmVuIGA8ZGl2IFtzdHlsZV0gbXktZGlyPmAgc3VjaCB0aGF0IGBteS1kaXJgIGhhcyBgQElucHV0KCdzdHlsZScpYC5cbiAgICAgIC8vIFRoaXMgdGFrZXMgb3ZlciB0aGUgYFtzdHlsZV1gIGJpbmRpbmcuIChTYW1lIGZvciBgW2NsYXNzXWApXG4gICAgICBzZXREaXJlY3RpdmVJbnB1dHNXaGljaFNoYWRvd3NTdHlsaW5nKHRWaWV3LCB0Tm9kZSwgbFZpZXcsIHZhbHVlLCBpc0NsYXNzQmFzZWQpO1xuICAgIH0gZWxzZSB7XG4gICAgICB1cGRhdGVTdHlsaW5nTWFwKFxuICAgICAgICAgIHRWaWV3LCB0Tm9kZSwgbFZpZXcsIGxWaWV3W1JFTkRFUkVSXSwgbFZpZXdbYmluZGluZ0luZGV4ICsgMV0sXG4gICAgICAgICAgbFZpZXdbYmluZGluZ0luZGV4ICsgMV0gPSB0b1N0eWxpbmdLZXlWYWx1ZUFycmF5KGtleVZhbHVlQXJyYXlTZXQsIHN0cmluZ1BhcnNlciwgdmFsdWUpLFxuICAgICAgICAgIGlzQ2xhc3NCYXNlZCwgYmluZGluZ0luZGV4KTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBEZXRlcm1pbmVzIHdoZW4gdGhlIGJpbmRpbmcgaXMgaW4gYGhvc3RCaW5kaW5nc2Agc2VjdGlvblxuICpcbiAqIEBwYXJhbSB0VmlldyBDdXJyZW50IGBUVmlld2BcbiAqIEBwYXJhbSBiaW5kaW5nSW5kZXggaW5kZXggb2YgYmluZGluZyB3aGljaCB3ZSB3b3VsZCBsaWtlIGlmIGl0IGlzIGluIGBob3N0QmluZGluZ3NgXG4gKi9cbmZ1bmN0aW9uIGlzSW5Ib3N0QmluZGluZ3ModFZpZXc6IFRWaWV3LCBiaW5kaW5nSW5kZXg6IG51bWJlcik6IGJvb2xlYW4ge1xuICAvLyBBbGwgaG9zdCBiaW5kaW5ncyBhcmUgcGxhY2VkIGFmdGVyIHRoZSBleHBhbmRvIHNlY3Rpb24uXG4gIHJldHVybiBiaW5kaW5nSW5kZXggPj0gdFZpZXcuZXhwYW5kb1N0YXJ0SW5kZXg7XG59XG5cbi8qKlxuICogQ29sbGVjdHMgdGhlIG5lY2Vzc2FyeSBpbmZvcm1hdGlvbiB0byBpbnNlcnQgdGhlIGJpbmRpbmcgaW50byBhIGxpbmtlZCBsaXN0IG9mIHN0eWxlIGJpbmRpbmdzXG4gKiB1c2luZyBgaW5zZXJ0VFN0eWxpbmdCaW5kaW5nYC5cbiAqXG4gKiBAcGFyYW0gdFZpZXcgYFRWaWV3YCB3aGVyZSB0aGUgYmluZGluZyBsaW5rZWQgbGlzdCB3aWxsIGJlIHN0b3JlZC5cbiAqIEBwYXJhbSB0U3R5bGluZ0tleSBQcm9wZXJ0eS9rZXkgb2YgdGhlIGJpbmRpbmcuXG4gKiBAcGFyYW0gYmluZGluZ0luZGV4IEluZGV4IG9mIGJpbmRpbmcgYXNzb2NpYXRlZCB3aXRoIHRoZSBgcHJvcGBcbiAqIEBwYXJhbSBpc0NsYXNzQmFzZWQgYHRydWVgIGlmIGBjbGFzc2AgY2hhbmdlIChgZmFsc2VgIGlmIGBzdHlsZWApXG4gKi9cbmZ1bmN0aW9uIHN0eWxpbmdGaXJzdFVwZGF0ZVBhc3MoXG4gICAgdFZpZXc6IFRWaWV3LCB0U3R5bGluZ0tleTogVFN0eWxpbmdLZXksIGJpbmRpbmdJbmRleDogbnVtYmVyLCBpc0NsYXNzQmFzZWQ6IGJvb2xlYW4pOiB2b2lkIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEZpcnN0VXBkYXRlUGFzcyh0Vmlldyk7XG4gIGNvbnN0IHREYXRhID0gdFZpZXcuZGF0YTtcbiAgaWYgKHREYXRhW2JpbmRpbmdJbmRleCArIDFdID09PSBudWxsKSB7XG4gICAgLy8gVGhlIGFib3ZlIGNoZWNrIGlzIG5lY2Vzc2FyeSBiZWNhdXNlIHdlIGRvbid0IGNsZWFyIGZpcnN0IHVwZGF0ZSBwYXNzIHVudGlsIGZpcnN0IHN1Y2Nlc3NmdWxcbiAgICAvLyAobm8gZXhjZXB0aW9uKSB0ZW1wbGF0ZSBleGVjdXRpb24uIFRoaXMgcHJldmVudHMgdGhlIHN0eWxpbmcgaW5zdHJ1Y3Rpb24gZnJvbSBkb3VibGUgYWRkaW5nXG4gICAgLy8gaXRzZWxmIHRvIHRoZSBsaXN0LlxuICAgIC8vIGBnZXRTZWxlY3RlZEluZGV4KClgIHNob3VsZCBiZSBoZXJlIChyYXRoZXIgdGhhbiBpbiBpbnN0cnVjdGlvbikgc28gdGhhdCBpdCBpcyBndWFyZGVkIGJ5IHRoZVxuICAgIC8vIGlmIHNvIGFzIG5vdCB0byByZWFkIHVubmVjZXNzYXJpbHkuXG4gICAgY29uc3QgdE5vZGUgPSB0RGF0YVtnZXRTZWxlY3RlZEluZGV4KCldIGFzIFROb2RlO1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKHROb2RlLCAnVE5vZGUgZXhwZWN0ZWQnKTtcbiAgICBjb25zdCBpc0hvc3RCaW5kaW5ncyA9IGlzSW5Ib3N0QmluZGluZ3ModFZpZXcsIGJpbmRpbmdJbmRleCk7XG4gICAgaWYgKGhhc1N0eWxpbmdJbnB1dFNoYWRvdyh0Tm9kZSwgaXNDbGFzc0Jhc2VkKSAmJiB0U3R5bGluZ0tleSA9PT0gbnVsbCAmJiAhaXNIb3N0QmluZGluZ3MpIHtcbiAgICAgIC8vIGB0U3R5bGluZ0tleSA9PT0gbnVsbGAgaW1wbGllcyB0aGF0IHdlIGFyZSBlaXRoZXIgYFtzdHlsZV1gIG9yIGBbY2xhc3NdYCBiaW5kaW5nLlxuICAgICAgLy8gSWYgdGhlcmUgaXMgYSBkaXJlY3RpdmUgd2hpY2ggdXNlcyBgQElucHV0KCdzdHlsZScpYCBvciBgQElucHV0KCdjbGFzcycpYCB0aGFuXG4gICAgICAvLyB3ZSBuZWVkIHRvIG5ldXRyYWxpemUgdGhpcyBiaW5kaW5nIHNpbmNlIHRoYXQgZGlyZWN0aXZlIGlzIHNoYWRvd2luZyBpdC5cbiAgICAgIC8vIFdlIHR1cm4gdGhpcyBpbnRvIGEgbm9vcCBieSBzZXR0aW5nIHRoZSBrZXkgdG8gYGZhbHNlYFxuICAgICAgdFN0eWxpbmdLZXkgPSBmYWxzZTtcbiAgICB9XG4gICAgdFN0eWxpbmdLZXkgPSB3cmFwSW5TdGF0aWNTdHlsaW5nS2V5KHREYXRhLCB0Tm9kZSwgdFN0eWxpbmdLZXksIGlzQ2xhc3NCYXNlZCk7XG4gICAgaW5zZXJ0VFN0eWxpbmdCaW5kaW5nKHREYXRhLCB0Tm9kZSwgdFN0eWxpbmdLZXksIGJpbmRpbmdJbmRleCwgaXNIb3N0QmluZGluZ3MsIGlzQ2xhc3NCYXNlZCk7XG4gIH1cbn1cblxuLyoqXG4gKiBBZGRzIHN0YXRpYyBzdHlsaW5nIGluZm9ybWF0aW9uIHRvIHRoZSBiaW5kaW5nIGlmIGFwcGxpY2FibGUuXG4gKlxuICogVGhlIGxpbmtlZCBsaXN0IG9mIHN0eWxlcyBub3Qgb25seSBzdG9yZXMgdGhlIGxpc3QgYW5kIGtleXMsIGJ1dCBhbHNvIHN0b3JlcyBzdGF0aWMgc3R5bGluZ1xuICogaW5mb3JtYXRpb24gb24gc29tZSBvZiB0aGUga2V5cy4gVGhpcyBmdW5jdGlvbiBkZXRlcm1pbmVzIGlmIHRoZSBrZXkgc2hvdWxkIGNvbnRhaW4gdGhlIHN0eWxpbmdcbiAqIGluZm9ybWF0aW9uIGFuZCBjb21wdXRlcyBpdC5cbiAqXG4gKiBTZWUgYFRTdHlsaW5nU3RhdGljYCBmb3IgbW9yZSBkZXRhaWxzLlxuICpcbiAqIEBwYXJhbSB0RGF0YSBgVERhdGFgIHdoZXJlIHRoZSBsaW5rZWQgbGlzdCBpcyBzdG9yZWQuXG4gKiBAcGFyYW0gdE5vZGUgYFROb2RlYCBmb3Igd2hpY2ggdGhlIHN0eWxpbmcgaXMgYmVpbmcgY29tcHV0ZWQuXG4gKiBAcGFyYW0gc3R5bGluZ0tleSBgVFN0eWxpbmdLZXlQcmltaXRpdmVgIHdoaWNoIG1heSBuZWVkIHRvIGJlIHdyYXBwZWQgaW50byBgVFN0eWxpbmdLZXlgXG4gKiBAcGFyYW0gaXNDbGFzc0Jhc2VkIGB0cnVlYCBpZiBgY2xhc3NgIChgZmFsc2VgIGlmIGBzdHlsZWApXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB3cmFwSW5TdGF0aWNTdHlsaW5nS2V5KFxuICAgIHREYXRhOiBURGF0YSwgdE5vZGU6IFROb2RlLCBzdHlsaW5nS2V5OiBUU3R5bGluZ0tleSwgaXNDbGFzc0Jhc2VkOiBib29sZWFuKTogVFN0eWxpbmdLZXkge1xuICBjb25zdCBob3N0RGlyZWN0aXZlRGVmID0gZ2V0Q3VycmVudERpcmVjdGl2ZURlZih0RGF0YSk7XG4gIGxldCByZXNpZHVhbCA9IGlzQ2xhc3NCYXNlZCA/IHROb2RlLnJlc2lkdWFsQ2xhc3NlcyA6IHROb2RlLnJlc2lkdWFsU3R5bGVzO1xuICBpZiAoaG9zdERpcmVjdGl2ZURlZiA9PT0gbnVsbCkge1xuICAgIC8vIFdlIGFyZSBpbiB0ZW1wbGF0ZSBub2RlLlxuICAgIC8vIElmIHRlbXBsYXRlIG5vZGUgYWxyZWFkeSBoYWQgc3R5bGluZyBpbnN0cnVjdGlvbiB0aGVuIGl0IGhhcyBhbHJlYWR5IGNvbGxlY3RlZCB0aGUgc3RhdGljXG4gICAgLy8gc3R5bGluZyBhbmQgdGhlcmUgaXMgbm8gbmVlZCB0byBjb2xsZWN0IHRoZW0gYWdhaW4uIFdlIGtub3cgdGhhdCB3ZSBhcmUgdGhlIGZpcnN0IHN0eWxpbmdcbiAgICAvLyBpbnN0cnVjdGlvbiBiZWNhdXNlIHRoZSBgVE5vZGUuKkJpbmRpbmdzYCBwb2ludHMgdG8gMCAobm90aGluZyBoYXMgYmVlbiBpbnNlcnRlZCB5ZXQpLlxuICAgIGNvbnN0IGlzRmlyc3RTdHlsaW5nSW5zdHJ1Y3Rpb25JblRlbXBsYXRlID1cbiAgICAgICAgKGlzQ2xhc3NCYXNlZCA/IHROb2RlLmNsYXNzQmluZGluZ3MgOiB0Tm9kZS5zdHlsZUJpbmRpbmdzKSBhcyBhbnkgYXMgbnVtYmVyID09PSAwO1xuICAgIGlmIChpc0ZpcnN0U3R5bGluZ0luc3RydWN0aW9uSW5UZW1wbGF0ZSkge1xuICAgICAgLy8gSXQgd291bGQgYmUgbmljZSB0byBiZSBhYmxlIHRvIGdldCB0aGUgc3RhdGljcyBmcm9tIGBtZXJnZUF0dHJzYCwgaG93ZXZlciwgYXQgdGhpcyBwb2ludFxuICAgICAgLy8gdGhleSBhcmUgYWxyZWFkeSBtZXJnZWQgYW5kIGl0IHdvdWxkIG5vdCBiZSBwb3NzaWJsZSB0byBmaWd1cmUgd2hpY2ggcHJvcGVydHkgYmVsb25ncyB3aGVyZVxuICAgICAgLy8gaW4gdGhlIHByaW9yaXR5LlxuICAgICAgc3R5bGluZ0tleSA9IGNvbGxlY3RTdHlsaW5nRnJvbURpcmVjdGl2ZXMobnVsbCwgdERhdGEsIHROb2RlLCBzdHlsaW5nS2V5LCBpc0NsYXNzQmFzZWQpO1xuICAgICAgc3R5bGluZ0tleSA9IGNvbGxlY3RTdHlsaW5nRnJvbVRBdHRycyhzdHlsaW5nS2V5LCB0Tm9kZS5hdHRycywgaXNDbGFzc0Jhc2VkKTtcbiAgICAgIC8vIFdlIGtub3cgdGhhdCBpZiB3ZSBoYXZlIHN0eWxpbmcgYmluZGluZyBpbiB0ZW1wbGF0ZSB3ZSBjYW4ndCBoYXZlIHJlc2lkdWFsLlxuICAgICAgcmVzaWR1YWwgPSBudWxsO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICAvLyBXZSBhcmUgaW4gaG9zdCBiaW5kaW5nIG5vZGUgYW5kIHRoZXJlIHdhcyBubyBiaW5kaW5nIGluc3RydWN0aW9uIGluIHRlbXBsYXRlIG5vZGUuXG4gICAgLy8gVGhpcyBtZWFucyB0aGF0IHdlIG5lZWQgdG8gY29tcHV0ZSB0aGUgcmVzaWR1YWwuXG4gICAgY29uc3QgZGlyZWN0aXZlU3R5bGluZ0xhc3QgPSB0Tm9kZS5kaXJlY3RpdmVTdHlsaW5nTGFzdDtcbiAgICBjb25zdCBpc0ZpcnN0U3R5bGluZ0luc3RydWN0aW9uSW5Ib3N0QmluZGluZyA9XG4gICAgICAgIGRpcmVjdGl2ZVN0eWxpbmdMYXN0ID09PSAtMSB8fCB0RGF0YVtkaXJlY3RpdmVTdHlsaW5nTGFzdF0gIT09IGhvc3REaXJlY3RpdmVEZWY7XG4gICAgaWYgKGlzRmlyc3RTdHlsaW5nSW5zdHJ1Y3Rpb25Jbkhvc3RCaW5kaW5nKSB7XG4gICAgICBzdHlsaW5nS2V5ID1cbiAgICAgICAgICBjb2xsZWN0U3R5bGluZ0Zyb21EaXJlY3RpdmVzKGhvc3REaXJlY3RpdmVEZWYsIHREYXRhLCB0Tm9kZSwgc3R5bGluZ0tleSwgaXNDbGFzc0Jhc2VkKTtcbiAgICAgIGlmIChyZXNpZHVhbCA9PT0gbnVsbCkge1xuICAgICAgICAvLyAtIElmIGBudWxsYCB0aGFuIGVpdGhlcjpcbiAgICAgICAgLy8gICAgLSBUZW1wbGF0ZSBzdHlsaW5nIGluc3RydWN0aW9uIGFscmVhZHkgcmFuIGFuZCBpdCBoYXMgY29uc3VtZWQgdGhlIHN0YXRpY1xuICAgICAgICAvLyAgICAgIHN0eWxpbmcgaW50byBpdHMgYFRTdHlsaW5nS2V5YCBhbmQgc28gdGhlcmUgaXMgbm8gbmVlZCB0byB1cGRhdGUgcmVzaWR1YWwuIEluc3RlYWRcbiAgICAgICAgLy8gICAgICB3ZSBuZWVkIHRvIHVwZGF0ZSB0aGUgYFRTdHlsaW5nS2V5YCBhc3NvY2lhdGVkIHdpdGggdGhlIGZpcnN0IHRlbXBsYXRlIG5vZGVcbiAgICAgICAgLy8gICAgICBpbnN0cnVjdGlvbi4gT1JcbiAgICAgICAgLy8gICAgLSBTb21lIG90aGVyIHN0eWxpbmcgaW5zdHJ1Y3Rpb24gcmFuIGFuZCBkZXRlcm1pbmVkIHRoYXQgdGhlcmUgYXJlIG5vIHJlc2lkdWFsc1xuICAgICAgICBsZXQgdGVtcGxhdGVTdHlsaW5nS2V5ID0gZ2V0VGVtcGxhdGVIZWFkVFN0eWxpbmdLZXkodERhdGEsIHROb2RlLCBpc0NsYXNzQmFzZWQpO1xuICAgICAgICBpZiAodGVtcGxhdGVTdHlsaW5nS2V5ICE9PSB1bmRlZmluZWQgJiYgQXJyYXkuaXNBcnJheSh0ZW1wbGF0ZVN0eWxpbmdLZXkpKSB7XG4gICAgICAgICAgLy8gT25seSByZWNvbXB1dGUgaWYgYHRlbXBsYXRlU3R5bGluZ0tleWAgaGFkIHN0YXRpYyB2YWx1ZXMuIChJZiBubyBzdGF0aWMgdmFsdWUgZm91bmRcbiAgICAgICAgICAvLyB0aGVuIHRoZXJlIGlzIG5vdGhpbmcgdG8gZG8gc2luY2UgdGhpcyBvcGVyYXRpb24gY2FuIG9ubHkgcHJvZHVjZSBsZXNzIHN0YXRpYyBrZXlzLCBub3RcbiAgICAgICAgICAvLyBtb3JlLilcbiAgICAgICAgICB0ZW1wbGF0ZVN0eWxpbmdLZXkgPSBjb2xsZWN0U3R5bGluZ0Zyb21EaXJlY3RpdmVzKFxuICAgICAgICAgICAgICBudWxsLCB0RGF0YSwgdE5vZGUsIHRlbXBsYXRlU3R5bGluZ0tleVsxXSAvKiB1bndyYXAgcHJldmlvdXMgc3RhdGljcyAqLyxcbiAgICAgICAgICAgICAgaXNDbGFzc0Jhc2VkKTtcbiAgICAgICAgICB0ZW1wbGF0ZVN0eWxpbmdLZXkgPVxuICAgICAgICAgICAgICBjb2xsZWN0U3R5bGluZ0Zyb21UQXR0cnModGVtcGxhdGVTdHlsaW5nS2V5LCB0Tm9kZS5hdHRycywgaXNDbGFzc0Jhc2VkKTtcbiAgICAgICAgICBzZXRUZW1wbGF0ZUhlYWRUU3R5bGluZ0tleSh0RGF0YSwgdE5vZGUsIGlzQ2xhc3NCYXNlZCwgdGVtcGxhdGVTdHlsaW5nS2V5KTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gV2Ugb25seSBuZWVkIHRvIHJlY29tcHV0ZSByZXNpZHVhbCBpZiBpdCBpcyBub3QgYG51bGxgLlxuICAgICAgICAvLyAtIElmIGV4aXN0aW5nIHJlc2lkdWFsIChpbXBsaWVzIHRoZXJlIHdhcyBubyB0ZW1wbGF0ZSBzdHlsaW5nKS4gVGhpcyBtZWFucyB0aGF0IHNvbWUgb2ZcbiAgICAgICAgLy8gICB0aGUgc3RhdGljcyBtYXkgaGF2ZSBtb3ZlZCBmcm9tIHRoZSByZXNpZHVhbCB0byB0aGUgYHN0eWxpbmdLZXlgIGFuZCBzbyB3ZSBoYXZlIHRvXG4gICAgICAgIC8vICAgcmVjb21wdXRlLlxuICAgICAgICAvLyAtIElmIGB1bmRlZmluZWRgIHRoaXMgaXMgdGhlIGZpcnN0IHRpbWUgd2UgYXJlIHJ1bm5pbmcuXG4gICAgICAgIHJlc2lkdWFsID0gY29sbGVjdFJlc2lkdWFsKHREYXRhLCB0Tm9kZSwgaXNDbGFzc0Jhc2VkKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgaWYgKHJlc2lkdWFsICE9PSB1bmRlZmluZWQpIHtcbiAgICBpc0NsYXNzQmFzZWQgPyAodE5vZGUucmVzaWR1YWxDbGFzc2VzID0gcmVzaWR1YWwpIDogKHROb2RlLnJlc2lkdWFsU3R5bGVzID0gcmVzaWR1YWwpO1xuICB9XG4gIHJldHVybiBzdHlsaW5nS2V5O1xufVxuXG4vKipcbiAqIFJldHJpZXZlIHRoZSBgVFN0eWxpbmdLZXlgIGZvciB0aGUgdGVtcGxhdGUgc3R5bGluZyBpbnN0cnVjdGlvbi5cbiAqXG4gKiBUaGlzIGlzIG5lZWRlZCBzaW5jZSBgaG9zdEJpbmRpbmdgIHN0eWxpbmcgaW5zdHJ1Y3Rpb25zIGFyZSBpbnNlcnRlZCBhZnRlciB0aGUgdGVtcGxhdGVcbiAqIGluc3RydWN0aW9uLiBXaGlsZSB0aGUgdGVtcGxhdGUgaW5zdHJ1Y3Rpb24gbmVlZHMgdG8gdXBkYXRlIHRoZSByZXNpZHVhbCBpbiBgVE5vZGVgIHRoZVxuICogYGhvc3RCaW5kaW5nYCBpbnN0cnVjdGlvbnMgbmVlZCB0byB1cGRhdGUgdGhlIGBUU3R5bGluZ0tleWAgb2YgdGhlIHRlbXBsYXRlIGluc3RydWN0aW9uIGJlY2F1c2VcbiAqIHRoZSB0ZW1wbGF0ZSBpbnN0cnVjdGlvbiBpcyBkb3duc3RyZWFtIGZyb20gdGhlIGBob3N0QmluZGluZ3NgIGluc3RydWN0aW9ucy5cbiAqXG4gKiBAcGFyYW0gdERhdGEgYFREYXRhYCB3aGVyZSB0aGUgbGlua2VkIGxpc3QgaXMgc3RvcmVkLlxuICogQHBhcmFtIHROb2RlIGBUTm9kZWAgZm9yIHdoaWNoIHRoZSBzdHlsaW5nIGlzIGJlaW5nIGNvbXB1dGVkLlxuICogQHBhcmFtIGlzQ2xhc3NCYXNlZCBgdHJ1ZWAgaWYgYGNsYXNzYCAoYGZhbHNlYCBpZiBgc3R5bGVgKVxuICogQHJldHVybiBgVFN0eWxpbmdLZXlgIGlmIGZvdW5kIG9yIGB1bmRlZmluZWRgIGlmIG5vdCBmb3VuZC5cbiAqL1xuZnVuY3Rpb24gZ2V0VGVtcGxhdGVIZWFkVFN0eWxpbmdLZXkodERhdGE6IFREYXRhLCB0Tm9kZTogVE5vZGUsIGlzQ2xhc3NCYXNlZDogYm9vbGVhbik6IFRTdHlsaW5nS2V5fFxuICAgIHVuZGVmaW5lZCB7XG4gIGNvbnN0IGJpbmRpbmdzID0gaXNDbGFzc0Jhc2VkID8gdE5vZGUuY2xhc3NCaW5kaW5ncyA6IHROb2RlLnN0eWxlQmluZGluZ3M7XG4gIGlmIChnZXRUU3R5bGluZ1JhbmdlTmV4dChiaW5kaW5ncykgPT09IDApIHtcbiAgICAvLyBUaGVyZSBkb2VzIG5vdCBzZWVtIHRvIGJlIGEgc3R5bGluZyBpbnN0cnVjdGlvbiBpbiB0aGUgYHRlbXBsYXRlYC5cbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9XG4gIHJldHVybiB0RGF0YVtnZXRUU3R5bGluZ1JhbmdlUHJldihiaW5kaW5ncyldIGFzIFRTdHlsaW5nS2V5O1xufVxuXG4vKipcbiAqIFVwZGF0ZSB0aGUgYFRTdHlsaW5nS2V5YCBvZiB0aGUgZmlyc3QgdGVtcGxhdGUgaW5zdHJ1Y3Rpb24gaW4gYFROb2RlYC5cbiAqXG4gKiBMb2dpY2FsbHkgYGhvc3RCaW5kaW5nc2Agc3R5bGluZyBpbnN0cnVjdGlvbnMgYXJlIG9mIGxvd2VyIHByaW9yaXR5IHRoYW4gdGhhdCBvZiB0aGUgdGVtcGxhdGUuXG4gKiBIb3dldmVyLCB0aGV5IGV4ZWN1dGUgYWZ0ZXIgdGhlIHRlbXBsYXRlIHN0eWxpbmcgaW5zdHJ1Y3Rpb25zLiBUaGlzIG1lYW5zIHRoYXQgdGhleSBnZXQgaW5zZXJ0ZWRcbiAqIGluIGZyb250IG9mIHRoZSB0ZW1wbGF0ZSBzdHlsaW5nIGluc3RydWN0aW9ucy5cbiAqXG4gKiBJZiB3ZSBoYXZlIGEgdGVtcGxhdGUgc3R5bGluZyBpbnN0cnVjdGlvbiBhbmQgYSBuZXcgYGhvc3RCaW5kaW5nc2Agc3R5bGluZyBpbnN0cnVjdGlvbiBpc1xuICogZXhlY3V0ZWQgaXQgbWVhbnMgdGhhdCBpdCBtYXkgbmVlZCB0byBzdGVhbCBzdGF0aWMgZmllbGRzIGZyb20gdGhlIHRlbXBsYXRlIGluc3RydWN0aW9uLiBUaGlzXG4gKiBtZXRob2QgYWxsb3dzIHVzIHRvIHVwZGF0ZSB0aGUgZmlyc3QgdGVtcGxhdGUgaW5zdHJ1Y3Rpb24gYFRTdHlsaW5nS2V5YCB3aXRoIGEgbmV3IHZhbHVlLlxuICpcbiAqIEFzc3VtZTpcbiAqIGBgYFxuICogPGRpdiBteS1kaXIgc3R5bGU9XCJjb2xvcjogcmVkXCIgW3N0eWxlLmNvbG9yXT1cInRtcGxFeHBcIj48L2Rpdj5cbiAqXG4gKiBARGlyZWN0aXZlKHtcbiAqICAgaG9zdDoge1xuICogICAgICdzdHlsZSc6ICd3aWR0aDogMTAwcHgnLFxuICogICAgICdbc3R5bGUuY29sb3JdJzogJ2RpckV4cCcsXG4gKiAgIH1cbiAqIH0pXG4gKiBjbGFzcyBNeURpciB7fVxuICogYGBgXG4gKlxuICogd2hlbiBgW3N0eWxlLmNvbG9yXT1cInRtcGxFeHBcImAgZXhlY3V0ZXMgaXQgY3JlYXRlcyB0aGlzIGRhdGEgc3RydWN0dXJlLlxuICogYGBgXG4gKiAgWycnLCAnY29sb3InLCAnY29sb3InLCAncmVkJywgJ3dpZHRoJywgJzEwMHB4J10sXG4gKiBgYGBcbiAqXG4gKiBUaGUgcmVhc29uIGZvciB0aGlzIGlzIHRoYXQgdGhlIHRlbXBsYXRlIGluc3RydWN0aW9uIGRvZXMgbm90IGtub3cgaWYgdGhlcmUgYXJlIHN0eWxpbmdcbiAqIGluc3RydWN0aW9ucyBhbmQgbXVzdCBhc3N1bWUgdGhhdCB0aGVyZSBhcmUgbm9uZSBhbmQgbXVzdCBjb2xsZWN0IGFsbCBvZiB0aGUgc3RhdGljIHN0eWxpbmcuXG4gKiAoYm90aFxuICogYGNvbG9yJyBhbmQgJ3dpZHRoYClcbiAqXG4gKiBXaGVuIGAnW3N0eWxlLmNvbG9yXSc6ICdkaXJFeHAnLGAgZXhlY3V0ZXMgd2UgbmVlZCB0byBpbnNlcnQgYSBuZXcgZGF0YSBpbnRvIHRoZSBsaW5rZWQgbGlzdC5cbiAqIGBgYFxuICogIFsnJywgJ2NvbG9yJywgJ3dpZHRoJywgJzEwMHB4J10sICAvLyBuZXdseSBpbnNlcnRlZFxuICogIFsnJywgJ2NvbG9yJywgJ2NvbG9yJywgJ3JlZCcsICd3aWR0aCcsICcxMDBweCddLCAvLyB0aGlzIGlzIHdyb25nXG4gKiBgYGBcbiAqXG4gKiBOb3RpY2UgdGhhdCB0aGUgdGVtcGxhdGUgc3RhdGljcyBpcyBub3cgd3JvbmcgYXMgaXQgaW5jb3JyZWN0bHkgY29udGFpbnMgYHdpZHRoYCBzbyB3ZSBuZWVkIHRvXG4gKiB1cGRhdGUgaXQgbGlrZSBzbzpcbiAqIGBgYFxuICogIFsnJywgJ2NvbG9yJywgJ3dpZHRoJywgJzEwMHB4J10sXG4gKiAgWycnLCAnY29sb3InLCAnY29sb3InLCAncmVkJ10sICAgIC8vIFVQREFURVxuICogYGBgXG4gKlxuICogQHBhcmFtIHREYXRhIGBURGF0YWAgd2hlcmUgdGhlIGxpbmtlZCBsaXN0IGlzIHN0b3JlZC5cbiAqIEBwYXJhbSB0Tm9kZSBgVE5vZGVgIGZvciB3aGljaCB0aGUgc3R5bGluZyBpcyBiZWluZyBjb21wdXRlZC5cbiAqIEBwYXJhbSBpc0NsYXNzQmFzZWQgYHRydWVgIGlmIGBjbGFzc2AgKGBmYWxzZWAgaWYgYHN0eWxlYClcbiAqIEBwYXJhbSB0U3R5bGluZ0tleSBOZXcgYFRTdHlsaW5nS2V5YCB3aGljaCBpcyByZXBsYWNpbmcgdGhlIG9sZCBvbmUuXG4gKi9cbmZ1bmN0aW9uIHNldFRlbXBsYXRlSGVhZFRTdHlsaW5nS2V5KFxuICAgIHREYXRhOiBURGF0YSwgdE5vZGU6IFROb2RlLCBpc0NsYXNzQmFzZWQ6IGJvb2xlYW4sIHRTdHlsaW5nS2V5OiBUU3R5bGluZ0tleSk6IHZvaWQge1xuICBjb25zdCBiaW5kaW5ncyA9IGlzQ2xhc3NCYXNlZCA/IHROb2RlLmNsYXNzQmluZGluZ3MgOiB0Tm9kZS5zdHlsZUJpbmRpbmdzO1xuICBuZ0Rldk1vZGUgJiZcbiAgICAgIGFzc2VydE5vdEVxdWFsKFxuICAgICAgICAgIGdldFRTdHlsaW5nUmFuZ2VOZXh0KGJpbmRpbmdzKSwgMCxcbiAgICAgICAgICAnRXhwZWN0aW5nIHRvIGhhdmUgYXQgbGVhc3Qgb25lIHRlbXBsYXRlIHN0eWxpbmcgYmluZGluZy4nKTtcbiAgdERhdGFbZ2V0VFN0eWxpbmdSYW5nZVByZXYoYmluZGluZ3MpXSA9IHRTdHlsaW5nS2V5O1xufVxuXG4vKipcbiAqIENvbGxlY3QgYWxsIHN0YXRpYyB2YWx1ZXMgYWZ0ZXIgdGhlIGN1cnJlbnQgYFROb2RlLmRpcmVjdGl2ZVN0eWxpbmdMYXN0YCBpbmRleC5cbiAqXG4gKiBDb2xsZWN0IHRoZSByZW1haW5pbmcgc3R5bGluZyBpbmZvcm1hdGlvbiB3aGljaCBoYXMgbm90IHlldCBiZWVuIGNvbGxlY3RlZCBieSBhbiBleGlzdGluZ1xuICogc3R5bGluZyBpbnN0cnVjdGlvbi5cbiAqXG4gKiBAcGFyYW0gdERhdGEgYFREYXRhYCB3aGVyZSB0aGUgYERpcmVjdGl2ZURlZnNgIGFyZSBzdG9yZWQuXG4gKiBAcGFyYW0gdE5vZGUgYFROb2RlYCB3aGljaCBjb250YWlucyB0aGUgZGlyZWN0aXZlIHJhbmdlLlxuICogQHBhcmFtIGlzQ2xhc3NCYXNlZCBgdHJ1ZWAgaWYgYGNsYXNzYCAoYGZhbHNlYCBpZiBgc3R5bGVgKVxuICovXG5mdW5jdGlvbiBjb2xsZWN0UmVzaWR1YWwodERhdGE6IFREYXRhLCB0Tm9kZTogVE5vZGUsIGlzQ2xhc3NCYXNlZDogYm9vbGVhbik6IEtleVZhbHVlQXJyYXk8YW55PnxcbiAgICBudWxsIHtcbiAgbGV0IHJlc2lkdWFsOiBLZXlWYWx1ZUFycmF5PGFueT58bnVsbHx1bmRlZmluZWQgPSB1bmRlZmluZWQ7XG4gIGNvbnN0IGRpcmVjdGl2ZUVuZCA9IHROb2RlLmRpcmVjdGl2ZUVuZDtcbiAgbmdEZXZNb2RlICYmXG4gICAgICBhc3NlcnROb3RFcXVhbChcbiAgICAgICAgICB0Tm9kZS5kaXJlY3RpdmVTdHlsaW5nTGFzdCwgLTEsXG4gICAgICAgICAgJ0J5IHRoZSB0aW1lIHRoaXMgZnVuY3Rpb24gZ2V0cyBjYWxsZWQgYXQgbGVhc3Qgb25lIGhvc3RCaW5kaW5ncy1ub2RlIHN0eWxpbmcgaW5zdHJ1Y3Rpb24gbXVzdCBoYXZlIGV4ZWN1dGVkLicpO1xuICAvLyBXZSBhZGQgYDEgKyB0Tm9kZS5kaXJlY3RpdmVTdGFydGAgYmVjYXVzZSB3ZSBuZWVkIHRvIHNraXAgdGhlIGN1cnJlbnQgZGlyZWN0aXZlIChhcyB3ZSBhcmVcbiAgLy8gY29sbGVjdGluZyB0aGluZ3MgYWZ0ZXIgdGhlIGxhc3QgYGhvc3RCaW5kaW5nc2AgZGlyZWN0aXZlIHdoaWNoIGhhZCBhIHN0eWxpbmcgaW5zdHJ1Y3Rpb24uKVxuICBmb3IgKGxldCBpID0gMSArIHROb2RlLmRpcmVjdGl2ZVN0eWxpbmdMYXN0OyBpIDwgZGlyZWN0aXZlRW5kOyBpKyspIHtcbiAgICBjb25zdCBhdHRycyA9ICh0RGF0YVtpXSBhcyBEaXJlY3RpdmVEZWY8YW55PikuaG9zdEF0dHJzO1xuICAgIHJlc2lkdWFsID0gY29sbGVjdFN0eWxpbmdGcm9tVEF0dHJzKHJlc2lkdWFsLCBhdHRycywgaXNDbGFzc0Jhc2VkKSBhcyBLZXlWYWx1ZUFycmF5PGFueT58IG51bGw7XG4gIH1cbiAgcmV0dXJuIGNvbGxlY3RTdHlsaW5nRnJvbVRBdHRycyhyZXNpZHVhbCwgdE5vZGUuYXR0cnMsIGlzQ2xhc3NCYXNlZCkgYXMgS2V5VmFsdWVBcnJheTxhbnk+fCBudWxsO1xufVxuXG4vKipcbiAqIENvbGxlY3QgdGhlIHN0YXRpYyBzdHlsaW5nIGluZm9ybWF0aW9uIHdpdGggbG93ZXIgcHJpb3JpdHkgdGhhbiBgaG9zdERpcmVjdGl2ZURlZmAuXG4gKlxuICogKFRoaXMgaXMgb3Bwb3NpdGUgb2YgcmVzaWR1YWwgc3R5bGluZy4pXG4gKlxuICogQHBhcmFtIGhvc3REaXJlY3RpdmVEZWYgYERpcmVjdGl2ZURlZmAgZm9yIHdoaWNoIHdlIHdhbnQgdG8gY29sbGVjdCBsb3dlciBwcmlvcml0eSBzdGF0aWNcbiAqICAgICAgICBzdHlsaW5nLiAoT3IgYG51bGxgIGlmIHRlbXBsYXRlIHN0eWxpbmcpXG4gKiBAcGFyYW0gdERhdGEgYFREYXRhYCB3aGVyZSB0aGUgbGlua2VkIGxpc3QgaXMgc3RvcmVkLlxuICogQHBhcmFtIHROb2RlIGBUTm9kZWAgZm9yIHdoaWNoIHRoZSBzdHlsaW5nIGlzIGJlaW5nIGNvbXB1dGVkLlxuICogQHBhcmFtIHN0eWxpbmdLZXkgRXhpc3RpbmcgYFRTdHlsaW5nS2V5YCB0byB1cGRhdGUgb3Igd3JhcC5cbiAqIEBwYXJhbSBpc0NsYXNzQmFzZWQgYHRydWVgIGlmIGBjbGFzc2AgKGBmYWxzZWAgaWYgYHN0eWxlYClcbiAqL1xuZnVuY3Rpb24gY29sbGVjdFN0eWxpbmdGcm9tRGlyZWN0aXZlcyhcbiAgICBob3N0RGlyZWN0aXZlRGVmOiBEaXJlY3RpdmVEZWY8YW55PnxudWxsLCB0RGF0YTogVERhdGEsIHROb2RlOiBUTm9kZSwgc3R5bGluZ0tleTogVFN0eWxpbmdLZXksXG4gICAgaXNDbGFzc0Jhc2VkOiBib29sZWFuKTogVFN0eWxpbmdLZXkge1xuICAvLyBXZSBuZWVkIHRvIGxvb3AgYmVjYXVzZSB0aGVyZSBjYW4gYmUgZGlyZWN0aXZlcyB3aGljaCBoYXZlIGBob3N0QXR0cnNgIGJ1dCBkb24ndCBoYXZlXG4gIC8vIGBob3N0QmluZGluZ3NgIHNvIHRoaXMgbG9vcCBjYXRjaGVzIHVwIHRvIHRoZSBjdXJyZW50IGRpcmVjdGl2ZS4uXG4gIGxldCBjdXJyZW50RGlyZWN0aXZlOiBEaXJlY3RpdmVEZWY8YW55PnxudWxsID0gbnVsbDtcbiAgY29uc3QgZGlyZWN0aXZlRW5kID0gdE5vZGUuZGlyZWN0aXZlRW5kO1xuICBsZXQgZGlyZWN0aXZlU3R5bGluZ0xhc3QgPSB0Tm9kZS5kaXJlY3RpdmVTdHlsaW5nTGFzdDtcbiAgaWYgKGRpcmVjdGl2ZVN0eWxpbmdMYXN0ID09PSAtMSkge1xuICAgIGRpcmVjdGl2ZVN0eWxpbmdMYXN0ID0gdE5vZGUuZGlyZWN0aXZlU3RhcnQ7XG4gIH0gZWxzZSB7XG4gICAgZGlyZWN0aXZlU3R5bGluZ0xhc3QrKztcbiAgfVxuICB3aGlsZSAoZGlyZWN0aXZlU3R5bGluZ0xhc3QgPCBkaXJlY3RpdmVFbmQpIHtcbiAgICBjdXJyZW50RGlyZWN0aXZlID0gdERhdGFbZGlyZWN0aXZlU3R5bGluZ0xhc3RdIGFzIERpcmVjdGl2ZURlZjxhbnk+O1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKGN1cnJlbnREaXJlY3RpdmUsICdleHBlY3RlZCB0byBiZSBkZWZpbmVkJyk7XG4gICAgc3R5bGluZ0tleSA9IGNvbGxlY3RTdHlsaW5nRnJvbVRBdHRycyhzdHlsaW5nS2V5LCBjdXJyZW50RGlyZWN0aXZlLmhvc3RBdHRycywgaXNDbGFzc0Jhc2VkKTtcbiAgICBpZiAoY3VycmVudERpcmVjdGl2ZSA9PT0gaG9zdERpcmVjdGl2ZURlZikgYnJlYWs7XG4gICAgZGlyZWN0aXZlU3R5bGluZ0xhc3QrKztcbiAgfVxuICBpZiAoaG9zdERpcmVjdGl2ZURlZiAhPT0gbnVsbCkge1xuICAgIC8vIHdlIG9ubHkgYWR2YW5jZSB0aGUgc3R5bGluZyBjdXJzb3IgaWYgd2UgYXJlIGNvbGxlY3RpbmcgZGF0YSBmcm9tIGhvc3QgYmluZGluZ3MuXG4gICAgLy8gVGVtcGxhdGUgZXhlY3V0ZXMgYmVmb3JlIGhvc3QgYmluZGluZ3MgYW5kIHNvIGlmIHdlIHdvdWxkIHVwZGF0ZSB0aGUgaW5kZXgsXG4gICAgLy8gaG9zdCBiaW5kaW5ncyB3b3VsZCBub3QgZ2V0IHRoZWlyIHN0YXRpY3MuXG4gICAgdE5vZGUuZGlyZWN0aXZlU3R5bGluZ0xhc3QgPSBkaXJlY3RpdmVTdHlsaW5nTGFzdDtcbiAgfVxuICByZXR1cm4gc3R5bGluZ0tleTtcbn1cblxuLyoqXG4gKiBDb252ZXJ0IGBUQXR0cnNgIGludG8gYFRTdHlsaW5nU3RhdGljYC5cbiAqXG4gKiBAcGFyYW0gc3R5bGluZ0tleSBleGlzdGluZyBgVFN0eWxpbmdLZXlgIHRvIHVwZGF0ZSBvciB3cmFwLlxuICogQHBhcmFtIGF0dHJzIGBUQXR0cmlidXRlc2AgdG8gcHJvY2Vzcy5cbiAqIEBwYXJhbSBpc0NsYXNzQmFzZWQgYHRydWVgIGlmIGBjbGFzc2AgKGBmYWxzZWAgaWYgYHN0eWxlYClcbiAqL1xuZnVuY3Rpb24gY29sbGVjdFN0eWxpbmdGcm9tVEF0dHJzKFxuICAgIHN0eWxpbmdLZXk6IFRTdHlsaW5nS2V5fHVuZGVmaW5lZCwgYXR0cnM6IFRBdHRyaWJ1dGVzfG51bGwsXG4gICAgaXNDbGFzc0Jhc2VkOiBib29sZWFuKTogVFN0eWxpbmdLZXkge1xuICBjb25zdCBkZXNpcmVkTWFya2VyID0gaXNDbGFzc0Jhc2VkID8gQXR0cmlidXRlTWFya2VyLkNsYXNzZXMgOiBBdHRyaWJ1dGVNYXJrZXIuU3R5bGVzO1xuICBsZXQgY3VycmVudE1hcmtlciA9IEF0dHJpYnV0ZU1hcmtlci5JbXBsaWNpdEF0dHJpYnV0ZXM7XG4gIGlmIChhdHRycyAhPT0gbnVsbCkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYXR0cnMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGl0ZW0gPSBhdHRyc1tpXSBhcyBudW1iZXIgfCBzdHJpbmc7XG4gICAgICBpZiAodHlwZW9mIGl0ZW0gPT09ICdudW1iZXInKSB7XG4gICAgICAgIGN1cnJlbnRNYXJrZXIgPSBpdGVtO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKGN1cnJlbnRNYXJrZXIgPT09IGRlc2lyZWRNYXJrZXIpIHtcbiAgICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkoc3R5bGluZ0tleSkpIHtcbiAgICAgICAgICAgIHN0eWxpbmdLZXkgPSBzdHlsaW5nS2V5ID09PSB1bmRlZmluZWQgPyBbXSA6IFsnJywgc3R5bGluZ0tleV0gYXMgYW55O1xuICAgICAgICAgIH1cbiAgICAgICAgICBrZXlWYWx1ZUFycmF5U2V0KFxuICAgICAgICAgICAgICBzdHlsaW5nS2V5IGFzIEtleVZhbHVlQXJyYXk8YW55PiwgaXRlbSwgaXNDbGFzc0Jhc2VkID8gdHJ1ZSA6IGF0dHJzWysraV0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBzdHlsaW5nS2V5ID09PSB1bmRlZmluZWQgPyBudWxsIDogc3R5bGluZ0tleTtcbn1cblxuLyoqXG4gKiBDb252ZXJ0IHVzZXIgaW5wdXQgdG8gYEtleVZhbHVlQXJyYXlgLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gdGFrZXMgdXNlciBpbnB1dCB3aGljaCBjb3VsZCBiZSBgc3RyaW5nYCwgT2JqZWN0IGxpdGVyYWwsIG9yIGl0ZXJhYmxlIGFuZCBjb252ZXJ0c1xuICogaXQgaW50byBhIGNvbnNpc3RlbnQgcmVwcmVzZW50YXRpb24uIFRoZSBvdXRwdXQgb2YgdGhpcyBpcyBgS2V5VmFsdWVBcnJheWAgKHdoaWNoIGlzIGFuIGFycmF5XG4gKiB3aGVyZVxuICogZXZlbiBpbmRleGVzIGNvbnRhaW4ga2V5cyBhbmQgb2RkIGluZGV4ZXMgY29udGFpbiB2YWx1ZXMgZm9yIHRob3NlIGtleXMpLlxuICpcbiAqIFRoZSBhZHZhbnRhZ2Ugb2YgY29udmVydGluZyB0byBgS2V5VmFsdWVBcnJheWAgaXMgdGhhdCB3ZSBjYW4gcGVyZm9ybSBkaWZmIGluIGFuIGlucHV0XG4gKiBpbmRlcGVuZGVudFxuICogd2F5LlxuICogKGllIHdlIGNhbiBjb21wYXJlIGBmb28gYmFyYCB0byBgWydiYXInLCAnYmF6J10gYW5kIGRldGVybWluZSBhIHNldCBvZiBjaGFuZ2VzIHdoaWNoIG5lZWQgdG8gYmVcbiAqIGFwcGxpZWQpXG4gKlxuICogVGhlIGZhY3QgdGhhdCBgS2V5VmFsdWVBcnJheWAgaXMgc29ydGVkIGlzIHZlcnkgaW1wb3J0YW50IGJlY2F1c2UgaXQgYWxsb3dzIHVzIHRvIGNvbXB1dGUgdGhlXG4gKiBkaWZmZXJlbmNlIGluIGxpbmVhciBmYXNoaW9uIHdpdGhvdXQgdGhlIG5lZWQgdG8gYWxsb2NhdGUgYW55IGFkZGl0aW9uYWwgZGF0YS5cbiAqXG4gKiBGb3IgZXhhbXBsZSBpZiB3ZSBrZXB0IHRoaXMgYXMgYSBgTWFwYCB3ZSB3b3VsZCBoYXZlIHRvIGl0ZXJhdGUgb3ZlciBwcmV2aW91cyBgTWFwYCB0byBkZXRlcm1pbmVcbiAqIHdoaWNoIHZhbHVlcyBuZWVkIHRvIGJlIGRlbGV0ZWQsIG92ZXIgdGhlIG5ldyBgTWFwYCB0byBkZXRlcm1pbmUgYWRkaXRpb25zLCBhbmQgd2Ugd291bGQgaGF2ZSB0b1xuICoga2VlcCBhZGRpdGlvbmFsIGBNYXBgIHRvIGtlZXAgdHJhY2sgb2YgZHVwbGljYXRlcyBvciBpdGVtcyB3aGljaCBoYXZlIG5vdCB5ZXQgYmVlbiB2aXNpdGVkLlxuICpcbiAqIEBwYXJhbSBrZXlWYWx1ZUFycmF5U2V0IChTZWUgYGtleVZhbHVlQXJyYXlTZXRgIGluIFwidXRpbC9hcnJheV91dGlsc1wiKSBHZXRzIHBhc3NlZCBpbiBhcyBhXG4gKiAgICAgICAgZnVuY3Rpb24gc28gdGhhdCBgc3R5bGVgIGNhbiBiZSBwcm9jZXNzZWQuIFRoaXMgaXMgZG9uZVxuICogICAgICAgIGZvciB0cmVlIHNoYWtpbmcgcHVycG9zZXMuXG4gKiBAcGFyYW0gc3RyaW5nUGFyc2VyIFRoZSBwYXJzZXIgaXMgcGFzc2VkIGluIHNvIHRoYXQgaXQgd2lsbCBiZSB0cmVlIHNoYWthYmxlLiBTZWVcbiAqICAgICAgICBgc3R5bGVTdHJpbmdQYXJzZXJgIGFuZCBgY2xhc3NTdHJpbmdQYXJzZXJgXG4gKiBAcGFyYW0gdmFsdWUgVGhlIHZhbHVlIHRvIHBhcnNlL2NvbnZlcnQgdG8gYEtleVZhbHVlQXJyYXlgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0b1N0eWxpbmdLZXlWYWx1ZUFycmF5KFxuICAgIGtleVZhbHVlQXJyYXlTZXQ6IChrZXlWYWx1ZUFycmF5OiBLZXlWYWx1ZUFycmF5PGFueT4sIGtleTogc3RyaW5nLCB2YWx1ZTogYW55KSA9PiB2b2lkLFxuICAgIHN0cmluZ1BhcnNlcjogKHN0eWxlS2V5VmFsdWVBcnJheTogS2V5VmFsdWVBcnJheTxhbnk+LCB0ZXh0OiBzdHJpbmcpID0+IHZvaWQsXG4gICAgdmFsdWU6IHN0cmluZ3xzdHJpbmdbXXx7W2tleTogc3RyaW5nXTogYW55fXxTYWZlVmFsdWV8bnVsbHx1bmRlZmluZWQpOiBLZXlWYWx1ZUFycmF5PGFueT4ge1xuICBpZiAodmFsdWUgPT0gbnVsbCAvKnx8IHZhbHVlID09PSB1bmRlZmluZWQgKi8gfHwgdmFsdWUgPT09ICcnKSByZXR1cm4gRU1QVFlfQVJSQVkgYXMgYW55O1xuICBjb25zdCBzdHlsZUtleVZhbHVlQXJyYXk6IEtleVZhbHVlQXJyYXk8YW55PiA9IFtdIGFzIGFueTtcbiAgY29uc3QgdW53cmFwcGVkVmFsdWUgPSB1bndyYXBTYWZlVmFsdWUodmFsdWUpIGFzIHN0cmluZyB8IHN0cmluZ1tdIHwge1trZXk6IHN0cmluZ106IGFueX07XG4gIGlmIChBcnJheS5pc0FycmF5KHVud3JhcHBlZFZhbHVlKSkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdW53cmFwcGVkVmFsdWUubGVuZ3RoOyBpKyspIHtcbiAgICAgIGtleVZhbHVlQXJyYXlTZXQoc3R5bGVLZXlWYWx1ZUFycmF5LCB1bndyYXBwZWRWYWx1ZVtpXSwgdHJ1ZSk7XG4gICAgfVxuICB9IGVsc2UgaWYgKHR5cGVvZiB1bndyYXBwZWRWYWx1ZSA9PT0gJ29iamVjdCcpIHtcbiAgICBmb3IgKGNvbnN0IGtleSBpbiB1bndyYXBwZWRWYWx1ZSkge1xuICAgICAgaWYgKHVud3JhcHBlZFZhbHVlLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAga2V5VmFsdWVBcnJheVNldChzdHlsZUtleVZhbHVlQXJyYXksIGtleSwgdW53cmFwcGVkVmFsdWVba2V5XSk7XG4gICAgICB9XG4gICAgfVxuICB9IGVsc2UgaWYgKHR5cGVvZiB1bndyYXBwZWRWYWx1ZSA9PT0gJ3N0cmluZycpIHtcbiAgICBzdHJpbmdQYXJzZXIoc3R5bGVLZXlWYWx1ZUFycmF5LCB1bndyYXBwZWRWYWx1ZSk7XG4gIH0gZWxzZSB7XG4gICAgbmdEZXZNb2RlICYmXG4gICAgICAgIHRocm93RXJyb3IoJ1Vuc3VwcG9ydGVkIHN0eWxpbmcgdHlwZSAnICsgdHlwZW9mIHVud3JhcHBlZFZhbHVlICsgJzogJyArIHVud3JhcHBlZFZhbHVlKTtcbiAgfVxuICByZXR1cm4gc3R5bGVLZXlWYWx1ZUFycmF5O1xufVxuXG4vKipcbiAqIFNldCBhIGB2YWx1ZWAgZm9yIGEgYGtleWAuXG4gKlxuICogU2VlOiBga2V5VmFsdWVBcnJheVNldGAgZm9yIGRldGFpbHNcbiAqXG4gKiBAcGFyYW0ga2V5VmFsdWVBcnJheSBLZXlWYWx1ZUFycmF5IHRvIGFkZCB0by5cbiAqIEBwYXJhbSBrZXkgU3R5bGUga2V5IHRvIGFkZC5cbiAqIEBwYXJhbSB2YWx1ZSBUaGUgdmFsdWUgdG8gc2V0LlxuICovXG5leHBvcnQgZnVuY3Rpb24gc3R5bGVLZXlWYWx1ZUFycmF5U2V0KGtleVZhbHVlQXJyYXk6IEtleVZhbHVlQXJyYXk8YW55Piwga2V5OiBzdHJpbmcsIHZhbHVlOiBhbnkpIHtcbiAga2V5VmFsdWVBcnJheVNldChrZXlWYWx1ZUFycmF5LCBrZXksIHVud3JhcFNhZmVWYWx1ZSh2YWx1ZSkpO1xufVxuXG4vKipcbiAqIFVwZGF0ZSBtYXAgYmFzZWQgc3R5bGluZy5cbiAqXG4gKiBNYXAgYmFzZWQgc3R5bGluZyBjb3VsZCBiZSBhbnl0aGluZyB3aGljaCBjb250YWlucyBtb3JlIHRoYW4gb25lIGJpbmRpbmcuIEZvciBleGFtcGxlIGBzdHJpbmdgLFxuICogb3Igb2JqZWN0IGxpdGVyYWwuIERlYWxpbmcgd2l0aCBhbGwgb2YgdGhlc2UgdHlwZXMgd291bGQgY29tcGxpY2F0ZSB0aGUgbG9naWMgc29cbiAqIGluc3RlYWQgdGhpcyBmdW5jdGlvbiBleHBlY3RzIHRoYXQgdGhlIGNvbXBsZXggaW5wdXQgaXMgZmlyc3QgY29udmVydGVkIGludG8gbm9ybWFsaXplZFxuICogYEtleVZhbHVlQXJyYXlgLiBUaGUgYWR2YW50YWdlIG9mIG5vcm1hbGl6YXRpb24gaXMgdGhhdCB3ZSBnZXQgdGhlIHZhbHVlcyBzb3J0ZWQsIHdoaWNoIG1ha2VzIGl0XG4gKiB2ZXJ5IGNoZWFwIHRvIGNvbXB1dGUgZGVsdGFzIGJldHdlZW4gdGhlIHByZXZpb3VzIGFuZCBjdXJyZW50IHZhbHVlLlxuICpcbiAqIEBwYXJhbSB0VmlldyBBc3NvY2lhdGVkIGBUVmlldy5kYXRhYCBjb250YWlucyB0aGUgbGlua2VkIGxpc3Qgb2YgYmluZGluZyBwcmlvcml0aWVzLlxuICogQHBhcmFtIHROb2RlIGBUTm9kZWAgd2hlcmUgdGhlIGJpbmRpbmcgaXMgbG9jYXRlZC5cbiAqIEBwYXJhbSBsVmlldyBgTFZpZXdgIGNvbnRhaW5zIHRoZSB2YWx1ZXMgYXNzb2NpYXRlZCB3aXRoIG90aGVyIHN0eWxpbmcgYmluZGluZyBhdCB0aGlzIGBUTm9kZWAuXG4gKiBAcGFyYW0gcmVuZGVyZXIgUmVuZGVyZXIgdG8gdXNlIGlmIGFueSB1cGRhdGVzLlxuICogQHBhcmFtIG9sZEtleVZhbHVlQXJyYXkgUHJldmlvdXMgdmFsdWUgcmVwcmVzZW50ZWQgYXMgYEtleVZhbHVlQXJyYXlgXG4gKiBAcGFyYW0gbmV3S2V5VmFsdWVBcnJheSBDdXJyZW50IHZhbHVlIHJlcHJlc2VudGVkIGFzIGBLZXlWYWx1ZUFycmF5YFxuICogQHBhcmFtIGlzQ2xhc3NCYXNlZCBgdHJ1ZWAgaWYgYGNsYXNzYCAoYGZhbHNlYCBpZiBgc3R5bGVgKVxuICogQHBhcmFtIGJpbmRpbmdJbmRleCBCaW5kaW5nIGluZGV4IG9mIHRoZSBiaW5kaW5nLlxuICovXG5mdW5jdGlvbiB1cGRhdGVTdHlsaW5nTWFwKFxuICAgIHRWaWV3OiBUVmlldywgdE5vZGU6IFROb2RlLCBsVmlldzogTFZpZXcsIHJlbmRlcmVyOiBSZW5kZXJlcixcbiAgICBvbGRLZXlWYWx1ZUFycmF5OiBLZXlWYWx1ZUFycmF5PGFueT4sIG5ld0tleVZhbHVlQXJyYXk6IEtleVZhbHVlQXJyYXk8YW55PixcbiAgICBpc0NsYXNzQmFzZWQ6IGJvb2xlYW4sIGJpbmRpbmdJbmRleDogbnVtYmVyKSB7XG4gIGlmIChvbGRLZXlWYWx1ZUFycmF5IGFzIEtleVZhbHVlQXJyYXk8YW55PnwgTk9fQ0hBTkdFID09PSBOT19DSEFOR0UpIHtcbiAgICAvLyBPbiBmaXJzdCBleGVjdXRpb24gdGhlIG9sZEtleVZhbHVlQXJyYXkgaXMgTk9fQ0hBTkdFID0+IHRyZWF0IGl0IGFzIGVtcHR5IEtleVZhbHVlQXJyYXkuXG4gICAgb2xkS2V5VmFsdWVBcnJheSA9IEVNUFRZX0FSUkFZIGFzIGFueTtcbiAgfVxuICBsZXQgb2xkSW5kZXggPSAwO1xuICBsZXQgbmV3SW5kZXggPSAwO1xuICBsZXQgb2xkS2V5OiBzdHJpbmd8bnVsbCA9IDAgPCBvbGRLZXlWYWx1ZUFycmF5Lmxlbmd0aCA/IG9sZEtleVZhbHVlQXJyYXlbMF0gOiBudWxsO1xuICBsZXQgbmV3S2V5OiBzdHJpbmd8bnVsbCA9IDAgPCBuZXdLZXlWYWx1ZUFycmF5Lmxlbmd0aCA/IG5ld0tleVZhbHVlQXJyYXlbMF0gOiBudWxsO1xuICB3aGlsZSAob2xkS2V5ICE9PSBudWxsIHx8IG5ld0tleSAhPT0gbnVsbCkge1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnRMZXNzVGhhbihvbGRJbmRleCwgOTk5LCAnQXJlIHdlIHN0dWNrIGluIGluZmluaXRlIGxvb3A/Jyk7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydExlc3NUaGFuKG5ld0luZGV4LCA5OTksICdBcmUgd2Ugc3R1Y2sgaW4gaW5maW5pdGUgbG9vcD8nKTtcbiAgICBjb25zdCBvbGRWYWx1ZSA9XG4gICAgICAgIG9sZEluZGV4IDwgb2xkS2V5VmFsdWVBcnJheS5sZW5ndGggPyBvbGRLZXlWYWx1ZUFycmF5W29sZEluZGV4ICsgMV0gOiB1bmRlZmluZWQ7XG4gICAgY29uc3QgbmV3VmFsdWUgPVxuICAgICAgICBuZXdJbmRleCA8IG5ld0tleVZhbHVlQXJyYXkubGVuZ3RoID8gbmV3S2V5VmFsdWVBcnJheVtuZXdJbmRleCArIDFdIDogdW5kZWZpbmVkO1xuICAgIGxldCBzZXRLZXk6IHN0cmluZ3xudWxsID0gbnVsbDtcbiAgICBsZXQgc2V0VmFsdWU6IGFueSA9IHVuZGVmaW5lZDtcbiAgICBpZiAob2xkS2V5ID09PSBuZXdLZXkpIHtcbiAgICAgIC8vIFVQREFURTogS2V5cyBhcmUgZXF1YWwgPT4gbmV3IHZhbHVlIGlzIG92ZXJ3cml0aW5nIG9sZCB2YWx1ZS5cbiAgICAgIG9sZEluZGV4ICs9IDI7XG4gICAgICBuZXdJbmRleCArPSAyO1xuICAgICAgaWYgKG9sZFZhbHVlICE9PSBuZXdWYWx1ZSkge1xuICAgICAgICBzZXRLZXkgPSBuZXdLZXk7XG4gICAgICAgIHNldFZhbHVlID0gbmV3VmFsdWU7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChuZXdLZXkgPT09IG51bGwgfHwgb2xkS2V5ICE9PSBudWxsICYmIG9sZEtleSA8IG5ld0tleSEpIHtcbiAgICAgIC8vIERFTEVURTogb2xkS2V5IGtleSBpcyBtaXNzaW5nIG9yIHdlIGRpZCBub3QgZmluZCB0aGUgb2xkS2V5IGluIHRoZSBuZXdWYWx1ZVxuICAgICAgLy8gKGJlY2F1c2UgdGhlIGtleVZhbHVlQXJyYXkgaXMgc29ydGVkIGFuZCBgbmV3S2V5YCBpcyBmb3VuZCBsYXRlciBhbHBoYWJldGljYWxseSkuXG4gICAgICAvLyBgXCJiYWNrZ3JvdW5kXCIgPCBcImNvbG9yXCJgIHNvIHdlIG5lZWQgdG8gZGVsZXRlIGBcImJhY2tncm91bmRcImAgYmVjYXVzZSBpdCBpcyBub3QgZm91bmQgaW4gdGhlXG4gICAgICAvLyBuZXcgYXJyYXkuXG4gICAgICBvbGRJbmRleCArPSAyO1xuICAgICAgc2V0S2V5ID0gb2xkS2V5O1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBDUkVBVEU6IG5ld0tleSdzIGlzIGVhcmxpZXIgYWxwaGFiZXRpY2FsbHkgdGhhbiBvbGRLZXkncyAob3Igbm8gb2xkS2V5KSA9PiB3ZSBoYXZlIG5ldyBrZXkuXG4gICAgICAvLyBgXCJjb2xvclwiID4gXCJiYWNrZ3JvdW5kXCJgIHNvIHdlIG5lZWQgdG8gYWRkIGBjb2xvcmAgYmVjYXVzZSBpdCBpcyBpbiBuZXcgYXJyYXkgYnV0IG5vdCBpblxuICAgICAgLy8gb2xkIGFycmF5LlxuICAgICAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQobmV3S2V5LCAnRXhwZWN0aW5nIHRvIGhhdmUgYSB2YWxpZCBrZXknKTtcbiAgICAgIG5ld0luZGV4ICs9IDI7XG4gICAgICBzZXRLZXkgPSBuZXdLZXk7XG4gICAgICBzZXRWYWx1ZSA9IG5ld1ZhbHVlO1xuICAgIH1cbiAgICBpZiAoc2V0S2V5ICE9PSBudWxsKSB7XG4gICAgICB1cGRhdGVTdHlsaW5nKHRWaWV3LCB0Tm9kZSwgbFZpZXcsIHJlbmRlcmVyLCBzZXRLZXksIHNldFZhbHVlLCBpc0NsYXNzQmFzZWQsIGJpbmRpbmdJbmRleCk7XG4gICAgfVxuICAgIG9sZEtleSA9IG9sZEluZGV4IDwgb2xkS2V5VmFsdWVBcnJheS5sZW5ndGggPyBvbGRLZXlWYWx1ZUFycmF5W29sZEluZGV4XSA6IG51bGw7XG4gICAgbmV3S2V5ID0gbmV3SW5kZXggPCBuZXdLZXlWYWx1ZUFycmF5Lmxlbmd0aCA/IG5ld0tleVZhbHVlQXJyYXlbbmV3SW5kZXhdIDogbnVsbDtcbiAgfVxufVxuXG4vKipcbiAqIFVwZGF0ZSBhIHNpbXBsZSAocHJvcGVydHkgbmFtZSkgc3R5bGluZy5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIHRha2VzIGBwcm9wYCBhbmQgdXBkYXRlcyB0aGUgRE9NIHRvIHRoYXQgdmFsdWUuIFRoZSBmdW5jdGlvbiB0YWtlcyB0aGUgYmluZGluZ1xuICogdmFsdWUgYXMgd2VsbCBhcyBiaW5kaW5nIHByaW9yaXR5IGludG8gY29uc2lkZXJhdGlvbiB0byBkZXRlcm1pbmUgd2hpY2ggdmFsdWUgc2hvdWxkIGJlIHdyaXR0ZW5cbiAqIHRvIERPTS4gKEZvciBleGFtcGxlIGl0IG1heSBiZSBkZXRlcm1pbmVkIHRoYXQgdGhlcmUgaXMgYSBoaWdoZXIgcHJpb3JpdHkgb3ZlcndyaXRlIHdoaWNoIGJsb2Nrc1xuICogdGhlIERPTSB3cml0ZSwgb3IgaWYgdGhlIHZhbHVlIGdvZXMgdG8gYHVuZGVmaW5lZGAgYSBsb3dlciBwcmlvcml0eSBvdmVyd3JpdGUgbWF5IGJlIGNvbnN1bHRlZC4pXG4gKlxuICogQHBhcmFtIHRWaWV3IEFzc29jaWF0ZWQgYFRWaWV3LmRhdGFgIGNvbnRhaW5zIHRoZSBsaW5rZWQgbGlzdCBvZiBiaW5kaW5nIHByaW9yaXRpZXMuXG4gKiBAcGFyYW0gdE5vZGUgYFROb2RlYCB3aGVyZSB0aGUgYmluZGluZyBpcyBsb2NhdGVkLlxuICogQHBhcmFtIGxWaWV3IGBMVmlld2AgY29udGFpbnMgdGhlIHZhbHVlcyBhc3NvY2lhdGVkIHdpdGggb3RoZXIgc3R5bGluZyBiaW5kaW5nIGF0IHRoaXMgYFROb2RlYC5cbiAqIEBwYXJhbSByZW5kZXJlciBSZW5kZXJlciB0byB1c2UgaWYgYW55IHVwZGF0ZXMuXG4gKiBAcGFyYW0gcHJvcCBFaXRoZXIgc3R5bGUgcHJvcGVydHkgbmFtZSBvciBhIGNsYXNzIG5hbWUuXG4gKiBAcGFyYW0gdmFsdWUgRWl0aGVyIHN0eWxlIHZhbHVlIGZvciBgcHJvcGAgb3IgYHRydWVgL2BmYWxzZWAgaWYgYHByb3BgIGlzIGNsYXNzLlxuICogQHBhcmFtIGlzQ2xhc3NCYXNlZCBgdHJ1ZWAgaWYgYGNsYXNzYCAoYGZhbHNlYCBpZiBgc3R5bGVgKVxuICogQHBhcmFtIGJpbmRpbmdJbmRleCBCaW5kaW5nIGluZGV4IG9mIHRoZSBiaW5kaW5nLlxuICovXG5mdW5jdGlvbiB1cGRhdGVTdHlsaW5nKFxuICAgIHRWaWV3OiBUVmlldywgdE5vZGU6IFROb2RlLCBsVmlldzogTFZpZXcsIHJlbmRlcmVyOiBSZW5kZXJlciwgcHJvcDogc3RyaW5nLFxuICAgIHZhbHVlOiBzdHJpbmd8dW5kZWZpbmVkfG51bGx8Ym9vbGVhbiwgaXNDbGFzc0Jhc2VkOiBib29sZWFuLCBiaW5kaW5nSW5kZXg6IG51bWJlcikge1xuICBpZiAoISh0Tm9kZS50eXBlICYgVE5vZGVUeXBlLkFueVJOb2RlKSkge1xuICAgIC8vIEl0IGlzIHBvc3NpYmxlIHRvIGhhdmUgc3R5bGluZyBvbiBub24tZWxlbWVudHMgKHN1Y2ggYXMgbmctY29udGFpbmVyKS5cbiAgICAvLyBUaGlzIGlzIHJhcmUsIGJ1dCBpdCBkb2VzIGhhcHBlbi4gSW4gc3VjaCBhIGNhc2UsIGp1c3QgaWdub3JlIHRoZSBiaW5kaW5nLlxuICAgIHJldHVybjtcbiAgfVxuICBjb25zdCB0RGF0YSA9IHRWaWV3LmRhdGE7XG4gIGNvbnN0IHRSYW5nZSA9IHREYXRhW2JpbmRpbmdJbmRleCArIDFdIGFzIFRTdHlsaW5nUmFuZ2U7XG4gIGNvbnN0IGhpZ2hlclByaW9yaXR5VmFsdWUgPSBnZXRUU3R5bGluZ1JhbmdlTmV4dER1cGxpY2F0ZSh0UmFuZ2UpID9cbiAgICAgIGZpbmRTdHlsaW5nVmFsdWUodERhdGEsIHROb2RlLCBsVmlldywgcHJvcCwgZ2V0VFN0eWxpbmdSYW5nZU5leHQodFJhbmdlKSwgaXNDbGFzc0Jhc2VkKSA6XG4gICAgICB1bmRlZmluZWQ7XG4gIGlmICghaXNTdHlsaW5nVmFsdWVQcmVzZW50KGhpZ2hlclByaW9yaXR5VmFsdWUpKSB7XG4gICAgLy8gV2UgZG9uJ3QgaGF2ZSBhIG5leHQgZHVwbGljYXRlLCBvciB3ZSBkaWQgbm90IGZpbmQgYSBkdXBsaWNhdGUgdmFsdWUuXG4gICAgaWYgKCFpc1N0eWxpbmdWYWx1ZVByZXNlbnQodmFsdWUpKSB7XG4gICAgICAvLyBXZSBzaG91bGQgZGVsZXRlIGN1cnJlbnQgdmFsdWUgb3IgcmVzdG9yZSB0byBsb3dlciBwcmlvcml0eSB2YWx1ZS5cbiAgICAgIGlmIChnZXRUU3R5bGluZ1JhbmdlUHJldkR1cGxpY2F0ZSh0UmFuZ2UpKSB7XG4gICAgICAgIC8vIFdlIGhhdmUgYSBwb3NzaWJsZSBwcmV2IGR1cGxpY2F0ZSwgbGV0J3MgcmV0cmlldmUgaXQuXG4gICAgICAgIHZhbHVlID0gZmluZFN0eWxpbmdWYWx1ZSh0RGF0YSwgbnVsbCwgbFZpZXcsIHByb3AsIGJpbmRpbmdJbmRleCwgaXNDbGFzc0Jhc2VkKTtcbiAgICAgIH1cbiAgICB9XG4gICAgY29uc3Qgck5vZGUgPSBnZXROYXRpdmVCeUluZGV4KGdldFNlbGVjdGVkSW5kZXgoKSwgbFZpZXcpIGFzIFJFbGVtZW50O1xuICAgIGFwcGx5U3R5bGluZyhyZW5kZXJlciwgaXNDbGFzc0Jhc2VkLCByTm9kZSwgcHJvcCwgdmFsdWUpO1xuICB9XG59XG5cbi8qKlxuICogU2VhcmNoIGZvciBzdHlsaW5nIHZhbHVlIHdpdGggaGlnaGVyIHByaW9yaXR5IHdoaWNoIGlzIG92ZXJ3cml0aW5nIGN1cnJlbnQgdmFsdWUsIG9yIGFcbiAqIHZhbHVlIG9mIGxvd2VyIHByaW9yaXR5IHRvIHdoaWNoIHdlIHNob3VsZCBmYWxsIGJhY2sgaWYgdGhlIHZhbHVlIGlzIGB1bmRlZmluZWRgLlxuICpcbiAqIFdoZW4gdmFsdWUgaXMgYmVpbmcgYXBwbGllZCBhdCBhIGxvY2F0aW9uLCByZWxhdGVkIHZhbHVlcyBuZWVkIHRvIGJlIGNvbnN1bHRlZC5cbiAqIC0gSWYgdGhlcmUgaXMgYSBoaWdoZXIgcHJpb3JpdHkgYmluZGluZywgd2Ugc2hvdWxkIGJlIHVzaW5nIHRoYXQgb25lIGluc3RlYWQuXG4gKiAgIEZvciBleGFtcGxlIGA8ZGl2ICBbc3R5bGVdPVwie2NvbG9yOmV4cDF9XCIgW3N0eWxlLmNvbG9yXT1cImV4cDJcIj5gIGNoYW5nZSB0byBgZXhwMWBcbiAqICAgcmVxdWlyZXMgdGhhdCB3ZSBjaGVjayBgZXhwMmAgdG8gc2VlIGlmIGl0IGlzIHNldCB0byB2YWx1ZSBvdGhlciB0aGFuIGB1bmRlZmluZWRgLlxuICogLSBJZiB0aGVyZSBpcyBhIGxvd2VyIHByaW9yaXR5IGJpbmRpbmcgYW5kIHdlIGFyZSBjaGFuZ2luZyB0byBgdW5kZWZpbmVkYFxuICogICBGb3IgZXhhbXBsZSBgPGRpdiAgW3N0eWxlXT1cIntjb2xvcjpleHAxfVwiIFtzdHlsZS5jb2xvcl09XCJleHAyXCI+YCBjaGFuZ2UgdG8gYGV4cDJgIHRvXG4gKiAgIGB1bmRlZmluZWRgIHJlcXVpcmVzIHRoYXQgd2UgY2hlY2sgYGV4cDFgIChhbmQgc3RhdGljIHZhbHVlcykgYW5kIHVzZSB0aGF0IGFzIG5ldyB2YWx1ZS5cbiAqXG4gKiBOT1RFOiBUaGUgc3R5bGluZyBzdG9yZXMgdHdvIHZhbHVlcy5cbiAqIDEuIFRoZSByYXcgdmFsdWUgd2hpY2ggY2FtZSBmcm9tIHRoZSBhcHBsaWNhdGlvbiBpcyBzdG9yZWQgYXQgYGluZGV4ICsgMGAgbG9jYXRpb24uIChUaGlzIHZhbHVlXG4gKiAgICBpcyB1c2VkIGZvciBkaXJ0eSBjaGVja2luZykuXG4gKiAyLiBUaGUgbm9ybWFsaXplZCB2YWx1ZSBpcyBzdG9yZWQgYXQgYGluZGV4ICsgMWAuXG4gKlxuICogQHBhcmFtIHREYXRhIGBURGF0YWAgdXNlZCBmb3IgdHJhdmVyc2luZyB0aGUgcHJpb3JpdHkuXG4gKiBAcGFyYW0gdE5vZGUgYFROb2RlYCB0byB1c2UgZm9yIHJlc29sdmluZyBzdGF0aWMgc3R5bGluZy4gQWxzbyBjb250cm9scyBzZWFyY2ggZGlyZWN0aW9uLlxuICogICAtIGBUTm9kZWAgc2VhcmNoIG5leHQgYW5kIHF1aXQgYXMgc29vbiBhcyBgaXNTdHlsaW5nVmFsdWVQcmVzZW50KHZhbHVlKWAgaXMgdHJ1ZS5cbiAqICAgICAgSWYgbm8gdmFsdWUgZm91bmQgY29uc3VsdCBgdE5vZGUucmVzaWR1YWxTdHlsZWAvYHROb2RlLnJlc2lkdWFsQ2xhc3NgIGZvciBkZWZhdWx0IHZhbHVlLlxuICogICAtIGBudWxsYCBzZWFyY2ggcHJldiBhbmQgZ28gYWxsIHRoZSB3YXkgdG8gZW5kLiBSZXR1cm4gbGFzdCB2YWx1ZSB3aGVyZVxuICogICAgIGBpc1N0eWxpbmdWYWx1ZVByZXNlbnQodmFsdWUpYCBpcyB0cnVlLlxuICogQHBhcmFtIGxWaWV3IGBMVmlld2AgdXNlZCBmb3IgcmV0cmlldmluZyB0aGUgYWN0dWFsIHZhbHVlcy5cbiAqIEBwYXJhbSBwcm9wIFByb3BlcnR5IHdoaWNoIHdlIGFyZSBpbnRlcmVzdGVkIGluLlxuICogQHBhcmFtIGluZGV4IFN0YXJ0aW5nIGluZGV4IGluIHRoZSBsaW5rZWQgbGlzdCBvZiBzdHlsaW5nIGJpbmRpbmdzIHdoZXJlIHRoZSBzZWFyY2ggc2hvdWxkIHN0YXJ0LlxuICogQHBhcmFtIGlzQ2xhc3NCYXNlZCBgdHJ1ZWAgaWYgYGNsYXNzYCAoYGZhbHNlYCBpZiBgc3R5bGVgKVxuICovXG5mdW5jdGlvbiBmaW5kU3R5bGluZ1ZhbHVlKFxuICAgIHREYXRhOiBURGF0YSwgdE5vZGU6IFROb2RlfG51bGwsIGxWaWV3OiBMVmlldywgcHJvcDogc3RyaW5nLCBpbmRleDogbnVtYmVyLFxuICAgIGlzQ2xhc3NCYXNlZDogYm9vbGVhbik6IGFueSB7XG4gIC8vIGBUTm9kZWAgdG8gdXNlIGZvciByZXNvbHZpbmcgc3RhdGljIHN0eWxpbmcuIEFsc28gY29udHJvbHMgc2VhcmNoIGRpcmVjdGlvbi5cbiAgLy8gICAtIGBUTm9kZWAgc2VhcmNoIG5leHQgYW5kIHF1aXQgYXMgc29vbiBhcyBgaXNTdHlsaW5nVmFsdWVQcmVzZW50KHZhbHVlKWAgaXMgdHJ1ZS5cbiAgLy8gICAgICBJZiBubyB2YWx1ZSBmb3VuZCBjb25zdWx0IGB0Tm9kZS5yZXNpZHVhbFN0eWxlYC9gdE5vZGUucmVzaWR1YWxDbGFzc2AgZm9yIGRlZmF1bHQgdmFsdWUuXG4gIC8vICAgLSBgbnVsbGAgc2VhcmNoIHByZXYgYW5kIGdvIGFsbCB0aGUgd2F5IHRvIGVuZC4gUmV0dXJuIGxhc3QgdmFsdWUgd2hlcmVcbiAgLy8gICAgIGBpc1N0eWxpbmdWYWx1ZVByZXNlbnQodmFsdWUpYCBpcyB0cnVlLlxuICBjb25zdCBpc1ByZXZEaXJlY3Rpb24gPSB0Tm9kZSA9PT0gbnVsbDtcbiAgbGV0IHZhbHVlOiBhbnkgPSB1bmRlZmluZWQ7XG4gIHdoaWxlIChpbmRleCA+IDApIHtcbiAgICBjb25zdCByYXdLZXkgPSB0RGF0YVtpbmRleF0gYXMgVFN0eWxpbmdLZXk7XG4gICAgY29uc3QgY29udGFpbnNTdGF0aWNzID0gQXJyYXkuaXNBcnJheShyYXdLZXkpO1xuICAgIC8vIFVud3JhcCB0aGUga2V5IGlmIHdlIGNvbnRhaW4gc3RhdGljIHZhbHVlcy5cbiAgICBjb25zdCBrZXkgPSBjb250YWluc1N0YXRpY3MgPyAocmF3S2V5IGFzIHN0cmluZ1tdKVsxXSA6IHJhd0tleTtcbiAgICBjb25zdCBpc1N0eWxpbmdNYXAgPSBrZXkgPT09IG51bGw7XG4gICAgbGV0IHZhbHVlQXRMVmlld0luZGV4ID0gbFZpZXdbaW5kZXggKyAxXTtcbiAgICBpZiAodmFsdWVBdExWaWV3SW5kZXggPT09IE5PX0NIQU5HRSkge1xuICAgICAgLy8gSW4gZmlyc3RVcGRhdGVQYXNzIHRoZSBzdHlsaW5nIGluc3RydWN0aW9ucyBjcmVhdGUgYSBsaW5rZWQgbGlzdCBvZiBzdHlsaW5nLlxuICAgICAgLy8gT24gc3Vic2VxdWVudCBwYXNzZXMgaXQgaXMgcG9zc2libGUgZm9yIGEgc3R5bGluZyBpbnN0cnVjdGlvbiB0byB0cnkgdG8gcmVhZCBhIGJpbmRpbmdcbiAgICAgIC8vIHdoaWNoXG4gICAgICAvLyBoYXMgbm90IHlldCBleGVjdXRlZC4gSW4gdGhhdCBjYXNlIHdlIHdpbGwgZmluZCBgTk9fQ0hBTkdFYCBhbmQgd2Ugc2hvdWxkIGFzc3VtZSB0aGF0XG4gICAgICAvLyB3ZSBoYXZlIGB1bmRlZmluZWRgIChvciBlbXB0eSBhcnJheSBpbiBjYXNlIG9mIHN0eWxpbmctbWFwIGluc3RydWN0aW9uKSBpbnN0ZWFkLiBUaGlzXG4gICAgICAvLyBhbGxvd3MgdGhlIHJlc29sdXRpb24gdG8gYXBwbHkgdGhlIHZhbHVlICh3aGljaCBtYXkgbGF0ZXIgYmUgb3ZlcndyaXR0ZW4gd2hlbiB0aGVcbiAgICAgIC8vIGJpbmRpbmcgYWN0dWFsbHkgZXhlY3V0ZXMuKVxuICAgICAgdmFsdWVBdExWaWV3SW5kZXggPSBpc1N0eWxpbmdNYXAgPyBFTVBUWV9BUlJBWSA6IHVuZGVmaW5lZDtcbiAgICB9XG4gICAgbGV0IGN1cnJlbnRWYWx1ZSA9IGlzU3R5bGluZ01hcCA/IGtleVZhbHVlQXJyYXlHZXQodmFsdWVBdExWaWV3SW5kZXgsIHByb3ApIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKGtleSA9PT0gcHJvcCA/IHZhbHVlQXRMVmlld0luZGV4IDogdW5kZWZpbmVkKTtcbiAgICBpZiAoY29udGFpbnNTdGF0aWNzICYmICFpc1N0eWxpbmdWYWx1ZVByZXNlbnQoY3VycmVudFZhbHVlKSkge1xuICAgICAgY3VycmVudFZhbHVlID0ga2V5VmFsdWVBcnJheUdldChyYXdLZXkgYXMgS2V5VmFsdWVBcnJheTxhbnk+LCBwcm9wKTtcbiAgICB9XG4gICAgaWYgKGlzU3R5bGluZ1ZhbHVlUHJlc2VudChjdXJyZW50VmFsdWUpKSB7XG4gICAgICB2YWx1ZSA9IGN1cnJlbnRWYWx1ZTtcbiAgICAgIGlmIChpc1ByZXZEaXJlY3Rpb24pIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgfVxuICAgIH1cbiAgICBjb25zdCB0UmFuZ2UgPSB0RGF0YVtpbmRleCArIDFdIGFzIFRTdHlsaW5nUmFuZ2U7XG4gICAgaW5kZXggPSBpc1ByZXZEaXJlY3Rpb24gPyBnZXRUU3R5bGluZ1JhbmdlUHJldih0UmFuZ2UpIDogZ2V0VFN0eWxpbmdSYW5nZU5leHQodFJhbmdlKTtcbiAgfVxuICBpZiAodE5vZGUgIT09IG51bGwpIHtcbiAgICAvLyBpbiBjYXNlIHdoZXJlIHdlIGFyZSBnb2luZyBpbiBuZXh0IGRpcmVjdGlvbiBBTkQgd2UgZGlkIG5vdCBmaW5kIGFueXRoaW5nLCB3ZSBuZWVkIHRvXG4gICAgLy8gY29uc3VsdCByZXNpZHVhbCBzdHlsaW5nXG4gICAgbGV0IHJlc2lkdWFsID0gaXNDbGFzc0Jhc2VkID8gdE5vZGUucmVzaWR1YWxDbGFzc2VzIDogdE5vZGUucmVzaWR1YWxTdHlsZXM7XG4gICAgaWYgKHJlc2lkdWFsICE9IG51bGwgLyoqIE9SIHJlc2lkdWFsICE9PT0gdW5kZWZpbmVkICovKSB7XG4gICAgICB2YWx1ZSA9IGtleVZhbHVlQXJyYXlHZXQocmVzaWR1YWwhLCBwcm9wKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHZhbHVlO1xufVxuXG4vKipcbiAqIERldGVybWluZXMgaWYgdGhlIGJpbmRpbmcgdmFsdWUgc2hvdWxkIGJlIHVzZWQgKG9yIGlmIHRoZSB2YWx1ZSBpcyAndW5kZWZpbmVkJyBhbmQgaGVuY2UgcHJpb3JpdHlcbiAqIHJlc29sdXRpb24gc2hvdWxkIGJlIHVzZWQuKVxuICpcbiAqIEBwYXJhbSB2YWx1ZSBCaW5kaW5nIHN0eWxlIHZhbHVlLlxuICovXG5mdW5jdGlvbiBpc1N0eWxpbmdWYWx1ZVByZXNlbnQodmFsdWU6IGFueSk6IGJvb2xlYW4ge1xuICAvLyBDdXJyZW50bHkgb25seSBgdW5kZWZpbmVkYCB2YWx1ZSBpcyBjb25zaWRlcmVkIG5vbi1iaW5kaW5nLiBUaGF0IGlzIGB1bmRlZmluZWRgIHNheXMgSSBkb24ndFxuICAvLyBoYXZlIGFuIG9waW5pb24gYXMgdG8gd2hhdCB0aGlzIGJpbmRpbmcgc2hvdWxkIGJlIGFuZCB5b3Ugc2hvdWxkIGNvbnN1bHQgb3RoZXIgYmluZGluZ3MgYnlcbiAgLy8gcHJpb3JpdHkgdG8gZGV0ZXJtaW5lIHRoZSB2YWxpZCB2YWx1ZS5cbiAgLy8gVGhpcyBpcyBleHRyYWN0ZWQgaW50byBhIHNpbmdsZSBmdW5jdGlvbiBzbyB0aGF0IHdlIGhhdmUgYSBzaW5nbGUgcGxhY2UgdG8gY29udHJvbCB0aGlzLlxuICByZXR1cm4gdmFsdWUgIT09IHVuZGVmaW5lZDtcbn1cblxuLyoqXG4gKiBOb3JtYWxpemVzIGFuZC9vciBhZGRzIGEgc3VmZml4IHRvIHRoZSB2YWx1ZS5cbiAqXG4gKiBJZiB2YWx1ZSBpcyBgbnVsbGAvYHVuZGVmaW5lZGAgbm8gc3VmZml4IGlzIGFkZGVkXG4gKiBAcGFyYW0gdmFsdWVcbiAqIEBwYXJhbSBzdWZmaXhcbiAqL1xuZnVuY3Rpb24gbm9ybWFsaXplU3VmZml4KHZhbHVlOiBhbnksIHN1ZmZpeDogc3RyaW5nfHVuZGVmaW5lZHxudWxsKTogc3RyaW5nfG51bGx8dW5kZWZpbmVkfGJvb2xlYW4ge1xuICBpZiAodmFsdWUgPT0gbnVsbCB8fCB2YWx1ZSA9PT0gJycpIHtcbiAgICAvLyBkbyBub3RoaW5nXG4gICAgLy8gRG8gbm90IGFkZCB0aGUgc3VmZml4IGlmIHRoZSB2YWx1ZSBpcyBnb2luZyB0byBiZSBlbXB0eS5cbiAgICAvLyBBcyBpdCBwcm9kdWNlIGludmFsaWQgQ1NTLCB3aGljaCB0aGUgYnJvd3NlcnMgd2lsbCBhdXRvbWF0aWNhbGx5IG9taXQgYnV0IERvbWlubyB3aWxsIG5vdC5cbiAgICAvLyBFeGFtcGxlOiBgXCJsZWZ0XCI6IFwicHg7XCJgIGluc3RlYWQgb2YgYFwibGVmdFwiOiBcIlwiYC5cbiAgfSBlbHNlIGlmICh0eXBlb2Ygc3VmZml4ID09PSAnc3RyaW5nJykge1xuICAgIHZhbHVlID0gdmFsdWUgKyBzdWZmaXg7XG4gIH0gZWxzZSBpZiAodHlwZW9mIHZhbHVlID09PSAnb2JqZWN0Jykge1xuICAgIHZhbHVlID0gc3RyaW5naWZ5KHVud3JhcFNhZmVWYWx1ZSh2YWx1ZSkpO1xuICB9XG4gIHJldHVybiB2YWx1ZTtcbn1cblxuXG4vKipcbiAqIFRlc3RzIGlmIHRoZSBgVE5vZGVgIGhhcyBpbnB1dCBzaGFkb3cuXG4gKlxuICogQW4gaW5wdXQgc2hhZG93IGlzIHdoZW4gYSBkaXJlY3RpdmUgc3RlYWxzIChzaGFkb3dzKSB0aGUgaW5wdXQgYnkgdXNpbmcgYEBJbnB1dCgnc3R5bGUnKWAgb3JcbiAqIGBASW5wdXQoJ2NsYXNzJylgIGFzIGlucHV0LlxuICpcbiAqIEBwYXJhbSB0Tm9kZSBgVE5vZGVgIHdoaWNoIHdlIHdvdWxkIGxpa2UgdG8gc2VlIGlmIGl0IGhhcyBzaGFkb3cuXG4gKiBAcGFyYW0gaXNDbGFzc0Jhc2VkIGB0cnVlYCBpZiBgY2xhc3NgIChgZmFsc2VgIGlmIGBzdHlsZWApXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBoYXNTdHlsaW5nSW5wdXRTaGFkb3codE5vZGU6IFROb2RlLCBpc0NsYXNzQmFzZWQ6IGJvb2xlYW4pIHtcbiAgcmV0dXJuICh0Tm9kZS5mbGFncyAmIChpc0NsYXNzQmFzZWQgPyBUTm9kZUZsYWdzLmhhc0NsYXNzSW5wdXQgOiBUTm9kZUZsYWdzLmhhc1N0eWxlSW5wdXQpKSAhPT0gMDtcbn1cbiJdfQ==