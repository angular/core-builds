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
    checkStylingMap(classKeyValueArraySet, classStringParser, classes, true);
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
 * Class-binding-specific function for setting the `value` for a `key`.
 *
 * See: `keyValueArraySet` for details
 *
 * @param keyValueArray KeyValueArray to add to.
 * @param key Style key to add.
 * @param value The value to set.
 */
export function classKeyValueArraySet(keyValueArray, key, value) {
    // We use `classList.add` to eventually add the CSS classes to the DOM node. Any value passed into
    // `add` is stringified and added to the `class` attribute, e.g. even null, undefined or numbers
    // will be added. Stringify the key here so that our internal data structure matches the value in
    // the DOM. The only exceptions are empty strings and strings that contain spaces for which
    // the browser throws an error. We ignore such values, because the error is somewhat cryptic.
    const stringKey = String(key);
    if (stringKey !== '' && !stringKey.includes(' ')) {
        keyValueArraySet(keyValueArray, stringKey, value);
    }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3R5bGluZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaW5zdHJ1Y3Rpb25zL3N0eWxpbmcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFZLGVBQWUsRUFBQyxNQUFNLDJCQUEyQixDQUFDO0FBQ3JFLE9BQU8sRUFBZ0IsZ0JBQWdCLEVBQUUsZ0JBQWdCLEVBQUMsTUFBTSx3QkFBd0IsQ0FBQztBQUN6RixPQUFPLEVBQUMsYUFBYSxFQUFFLFdBQVcsRUFBRSxjQUFjLEVBQUUsY0FBYyxFQUFFLFVBQVUsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQ3pHLE9BQU8sRUFBQyxXQUFXLEVBQUMsTUFBTSxrQkFBa0IsQ0FBQztBQUM3QyxPQUFPLEVBQUMsc0JBQXNCLEVBQUUsU0FBUyxFQUFDLE1BQU0sc0JBQXNCLENBQUM7QUFDdkUsT0FBTyxFQUFDLHFCQUFxQixFQUFDLE1BQU0sV0FBVyxDQUFDO0FBQ2hELE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxhQUFhLENBQUM7QUFLM0MsT0FBTyxFQUFDLG9CQUFvQixFQUFFLDZCQUE2QixFQUFFLG9CQUFvQixFQUFFLDZCQUE2QixFQUE2QixNQUFNLHVCQUF1QixDQUFDO0FBQzNLLE9BQU8sRUFBUSxRQUFRLEVBQWUsTUFBTSxvQkFBb0IsQ0FBQztBQUNqRSxPQUFPLEVBQUMsWUFBWSxFQUFDLE1BQU0sc0JBQXNCLENBQUM7QUFDbEQsT0FBTyxFQUFDLHNCQUFzQixFQUFFLFFBQVEsRUFBRSxnQkFBZ0IsRUFBRSxRQUFRLEVBQUUscUJBQXFCLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDN0csT0FBTyxFQUFDLHFCQUFxQixFQUFDLE1BQU0sK0JBQStCLENBQUM7QUFDcEUsT0FBTyxFQUFDLGdCQUFnQixFQUFFLGtCQUFrQixFQUFFLGNBQWMsRUFBRSxrQkFBa0IsRUFB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cEcsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1NhZmVWYWx1ZSwgdW53cmFwU2FmZVZhbHVlfSBmcm9tICcuLi8uLi9zYW5pdGl6YXRpb24vYnlwYXNzJztcbmltcG9ydCB7S2V5VmFsdWVBcnJheSwga2V5VmFsdWVBcnJheUdldCwga2V5VmFsdWVBcnJheVNldH0gZnJvbSAnLi4vLi4vdXRpbC9hcnJheV91dGlscyc7XG5pbXBvcnQge2Fzc2VydERlZmluZWQsIGFzc2VydEVxdWFsLCBhc3NlcnRMZXNzVGhhbiwgYXNzZXJ0Tm90RXF1YWwsIHRocm93RXJyb3J9IGZyb20gJy4uLy4uL3V0aWwvYXNzZXJ0JztcbmltcG9ydCB7RU1QVFlfQVJSQVl9IGZyb20gJy4uLy4uL3V0aWwvZW1wdHknO1xuaW1wb3J0IHtjb25jYXRTdHJpbmdzV2l0aFNwYWNlLCBzdHJpbmdpZnl9IGZyb20gJy4uLy4uL3V0aWwvc3RyaW5naWZ5JztcbmltcG9ydCB7YXNzZXJ0Rmlyc3RVcGRhdGVQYXNzfSBmcm9tICcuLi9hc3NlcnQnO1xuaW1wb3J0IHtiaW5kaW5nVXBkYXRlZH0gZnJvbSAnLi4vYmluZGluZ3MnO1xuaW1wb3J0IHtEaXJlY3RpdmVEZWZ9IGZyb20gJy4uL2ludGVyZmFjZXMvZGVmaW5pdGlvbic7XG5pbXBvcnQge0F0dHJpYnV0ZU1hcmtlciwgVEF0dHJpYnV0ZXMsIFROb2RlLCBUTm9kZUZsYWdzLCBUTm9kZVR5cGV9IGZyb20gJy4uL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge1JlbmRlcmVyfSBmcm9tICcuLi9pbnRlcmZhY2VzL3JlbmRlcmVyJztcbmltcG9ydCB7UkVsZW1lbnR9IGZyb20gJy4uL2ludGVyZmFjZXMvcmVuZGVyZXJfZG9tJztcbmltcG9ydCB7Z2V0VFN0eWxpbmdSYW5nZU5leHQsIGdldFRTdHlsaW5nUmFuZ2VOZXh0RHVwbGljYXRlLCBnZXRUU3R5bGluZ1JhbmdlUHJldiwgZ2V0VFN0eWxpbmdSYW5nZVByZXZEdXBsaWNhdGUsIFRTdHlsaW5nS2V5LCBUU3R5bGluZ1JhbmdlfSBmcm9tICcuLi9pbnRlcmZhY2VzL3N0eWxpbmcnO1xuaW1wb3J0IHtMVmlldywgUkVOREVSRVIsIFREYXRhLCBUVmlld30gZnJvbSAnLi4vaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7YXBwbHlTdHlsaW5nfSBmcm9tICcuLi9ub2RlX21hbmlwdWxhdGlvbic7XG5pbXBvcnQge2dldEN1cnJlbnREaXJlY3RpdmVEZWYsIGdldExWaWV3LCBnZXRTZWxlY3RlZEluZGV4LCBnZXRUVmlldywgaW5jcmVtZW50QmluZGluZ0luZGV4fSBmcm9tICcuLi9zdGF0ZSc7XG5pbXBvcnQge2luc2VydFRTdHlsaW5nQmluZGluZ30gZnJvbSAnLi4vc3R5bGluZy9zdHlsZV9iaW5kaW5nX2xpc3QnO1xuaW1wb3J0IHtnZXRMYXN0UGFyc2VkS2V5LCBnZXRMYXN0UGFyc2VkVmFsdWUsIHBhcnNlQ2xhc3NOYW1lLCBwYXJzZUNsYXNzTmFtZU5leHQsIHBhcnNlU3R5bGUsIHBhcnNlU3R5bGVOZXh0fSBmcm9tICcuLi9zdHlsaW5nL3N0eWxpbmdfcGFyc2VyJztcbmltcG9ydCB7Tk9fQ0hBTkdFfSBmcm9tICcuLi90b2tlbnMnO1xuaW1wb3J0IHtnZXROYXRpdmVCeUluZGV4fSBmcm9tICcuLi91dGlsL3ZpZXdfdXRpbHMnO1xuXG5pbXBvcnQge3NldERpcmVjdGl2ZUlucHV0c1doaWNoU2hhZG93c1N0eWxpbmd9IGZyb20gJy4vcHJvcGVydHknO1xuXG5cbi8qKlxuICogVXBkYXRlIGEgc3R5bGUgYmluZGluZyBvbiBhbiBlbGVtZW50IHdpdGggdGhlIHByb3ZpZGVkIHZhbHVlLlxuICpcbiAqIElmIHRoZSBzdHlsZSB2YWx1ZSBpcyBmYWxzeSB0aGVuIGl0IHdpbGwgYmUgcmVtb3ZlZCBmcm9tIHRoZSBlbGVtZW50XG4gKiAob3IgYXNzaWduZWQgYSBkaWZmZXJlbnQgdmFsdWUgZGVwZW5kaW5nIGlmIHRoZXJlIGFyZSBhbnkgc3R5bGVzIHBsYWNlZFxuICogb24gdGhlIGVsZW1lbnQgd2l0aCBgc3R5bGVNYXBgIG9yIGFueSBzdGF0aWMgc3R5bGVzIHRoYXQgYXJlXG4gKiBwcmVzZW50IGZyb20gd2hlbiB0aGUgZWxlbWVudCB3YXMgY3JlYXRlZCB3aXRoIGBzdHlsaW5nYCkuXG4gKlxuICogTm90ZSB0aGF0IHRoZSBzdHlsaW5nIGVsZW1lbnQgaXMgdXBkYXRlZCBhcyBwYXJ0IG9mIGBzdHlsaW5nQXBwbHlgLlxuICpcbiAqIEBwYXJhbSBwcm9wIEEgdmFsaWQgQ1NTIHByb3BlcnR5LlxuICogQHBhcmFtIHZhbHVlIE5ldyB2YWx1ZSB0byB3cml0ZSAoYG51bGxgIG9yIGFuIGVtcHR5IHN0cmluZyB0byByZW1vdmUpLlxuICogQHBhcmFtIHN1ZmZpeCBPcHRpb25hbCBzdWZmaXguIFVzZWQgd2l0aCBzY2FsYXIgdmFsdWVzIHRvIGFkZCB1bml0IHN1Y2ggYXMgYHB4YC5cbiAqXG4gKiBOb3RlIHRoYXQgdGhpcyB3aWxsIGFwcGx5IHRoZSBwcm92aWRlZCBzdHlsZSB2YWx1ZSB0byB0aGUgaG9zdCBlbGVtZW50IGlmIHRoaXMgZnVuY3Rpb24gaXMgY2FsbGVkXG4gKiB3aXRoaW4gYSBob3N0IGJpbmRpbmcgZnVuY3Rpb24uXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVzdHlsZVByb3AoXG4gICAgcHJvcDogc3RyaW5nLCB2YWx1ZTogc3RyaW5nfG51bWJlcnxTYWZlVmFsdWV8dW5kZWZpbmVkfG51bGwsXG4gICAgc3VmZml4Pzogc3RyaW5nfG51bGwpOiB0eXBlb2YgybXJtXN0eWxlUHJvcCB7XG4gIGNoZWNrU3R5bGluZ1Byb3BlcnR5KHByb3AsIHZhbHVlLCBzdWZmaXgsIGZhbHNlKTtcbiAgcmV0dXJuIMm1ybVzdHlsZVByb3A7XG59XG5cbi8qKlxuICogVXBkYXRlIGEgY2xhc3MgYmluZGluZyBvbiBhbiBlbGVtZW50IHdpdGggdGhlIHByb3ZpZGVkIHZhbHVlLlxuICpcbiAqIFRoaXMgaW5zdHJ1Y3Rpb24gaXMgbWVhbnQgdG8gaGFuZGxlIHRoZSBgW2NsYXNzLmZvb109XCJleHBcImAgY2FzZSBhbmQsXG4gKiB0aGVyZWZvcmUsIHRoZSBjbGFzcyBiaW5kaW5nIGl0c2VsZiBtdXN0IGFscmVhZHkgYmUgYWxsb2NhdGVkIHVzaW5nXG4gKiBgc3R5bGluZ2Agd2l0aGluIHRoZSBjcmVhdGlvbiBibG9jay5cbiAqXG4gKiBAcGFyYW0gcHJvcCBBIHZhbGlkIENTUyBjbGFzcyAob25seSBvbmUpLlxuICogQHBhcmFtIHZhbHVlIEEgdHJ1ZS9mYWxzZSB2YWx1ZSB3aGljaCB3aWxsIHR1cm4gdGhlIGNsYXNzIG9uIG9yIG9mZi5cbiAqXG4gKiBOb3RlIHRoYXQgdGhpcyB3aWxsIGFwcGx5IHRoZSBwcm92aWRlZCBjbGFzcyB2YWx1ZSB0byB0aGUgaG9zdCBlbGVtZW50IGlmIHRoaXMgZnVuY3Rpb25cbiAqIGlzIGNhbGxlZCB3aXRoaW4gYSBob3N0IGJpbmRpbmcgZnVuY3Rpb24uXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVjbGFzc1Byb3AoY2xhc3NOYW1lOiBzdHJpbmcsIHZhbHVlOiBib29sZWFufHVuZGVmaW5lZHxudWxsKTogdHlwZW9mIMm1ybVjbGFzc1Byb3Age1xuICBjaGVja1N0eWxpbmdQcm9wZXJ0eShjbGFzc05hbWUsIHZhbHVlLCBudWxsLCB0cnVlKTtcbiAgcmV0dXJuIMm1ybVjbGFzc1Byb3A7XG59XG5cblxuLyoqXG4gKiBVcGRhdGUgc3R5bGUgYmluZGluZ3MgdXNpbmcgYW4gb2JqZWN0IGxpdGVyYWwgb24gYW4gZWxlbWVudC5cbiAqXG4gKiBUaGlzIGluc3RydWN0aW9uIGlzIG1lYW50IHRvIGFwcGx5IHN0eWxpbmcgdmlhIHRoZSBgW3N0eWxlXT1cImV4cFwiYCB0ZW1wbGF0ZSBiaW5kaW5ncy5cbiAqIFdoZW4gc3R5bGVzIGFyZSBhcHBsaWVkIHRvIHRoZSBlbGVtZW50IHRoZXkgd2lsbCB0aGVuIGJlIHVwZGF0ZWQgd2l0aCByZXNwZWN0IHRvXG4gKiBhbnkgc3R5bGVzL2NsYXNzZXMgc2V0IHZpYSBgc3R5bGVQcm9wYC4gSWYgYW55IHN0eWxlcyBhcmUgc2V0IHRvIGZhbHN5XG4gKiB0aGVuIHRoZXkgd2lsbCBiZSByZW1vdmVkIGZyb20gdGhlIGVsZW1lbnQuXG4gKlxuICogTm90ZSB0aGF0IHRoZSBzdHlsaW5nIGluc3RydWN0aW9uIHdpbGwgbm90IGJlIGFwcGxpZWQgdW50aWwgYHN0eWxpbmdBcHBseWAgaXMgY2FsbGVkLlxuICpcbiAqIEBwYXJhbSBzdHlsZXMgQSBrZXkvdmFsdWUgc3R5bGUgbWFwIG9mIHRoZSBzdHlsZXMgdGhhdCB3aWxsIGJlIGFwcGxpZWQgdG8gdGhlIGdpdmVuIGVsZW1lbnQuXG4gKiAgICAgICAgQW55IG1pc3Npbmcgc3R5bGVzICh0aGF0IGhhdmUgYWxyZWFkeSBiZWVuIGFwcGxpZWQgdG8gdGhlIGVsZW1lbnQgYmVmb3JlaGFuZCkgd2lsbCBiZVxuICogICAgICAgIHJlbW92ZWQgKHVuc2V0KSBmcm9tIHRoZSBlbGVtZW50J3Mgc3R5bGluZy5cbiAqXG4gKiBOb3RlIHRoYXQgdGhpcyB3aWxsIGFwcGx5IHRoZSBwcm92aWRlZCBzdHlsZU1hcCB2YWx1ZSB0byB0aGUgaG9zdCBlbGVtZW50IGlmIHRoaXMgZnVuY3Rpb25cbiAqIGlzIGNhbGxlZCB3aXRoaW4gYSBob3N0IGJpbmRpbmcuXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVzdHlsZU1hcChzdHlsZXM6IHtbc3R5bGVOYW1lOiBzdHJpbmddOiBhbnl9fHN0cmluZ3x1bmRlZmluZWR8bnVsbCk6IHZvaWQge1xuICBjaGVja1N0eWxpbmdNYXAoc3R5bGVLZXlWYWx1ZUFycmF5U2V0LCBzdHlsZVN0cmluZ1BhcnNlciwgc3R5bGVzLCBmYWxzZSk7XG59XG5cblxuLyoqXG4gKiBQYXJzZSB0ZXh0IGFzIHN0eWxlIGFuZCBhZGQgdmFsdWVzIHRvIEtleVZhbHVlQXJyYXkuXG4gKlxuICogVGhpcyBjb2RlIGlzIHB1bGxlZCBvdXQgdG8gYSBzZXBhcmF0ZSBmdW5jdGlvbiBzbyB0aGF0IGl0IGNhbiBiZSB0cmVlIHNoYWtlbiBhd2F5IGlmIGl0IGlzIG5vdFxuICogbmVlZGVkLiBJdCBpcyBvbmx5IHJlZmVyZW5jZWQgZnJvbSBgybXJtXN0eWxlTWFwYC5cbiAqXG4gKiBAcGFyYW0ga2V5VmFsdWVBcnJheSBLZXlWYWx1ZUFycmF5IHRvIGFkZCBwYXJzZWQgdmFsdWVzIHRvLlxuICogQHBhcmFtIHRleHQgdGV4dCB0byBwYXJzZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHN0eWxlU3RyaW5nUGFyc2VyKGtleVZhbHVlQXJyYXk6IEtleVZhbHVlQXJyYXk8YW55PiwgdGV4dDogc3RyaW5nKTogdm9pZCB7XG4gIGZvciAobGV0IGkgPSBwYXJzZVN0eWxlKHRleHQpOyBpID49IDA7IGkgPSBwYXJzZVN0eWxlTmV4dCh0ZXh0LCBpKSkge1xuICAgIHN0eWxlS2V5VmFsdWVBcnJheVNldChrZXlWYWx1ZUFycmF5LCBnZXRMYXN0UGFyc2VkS2V5KHRleHQpLCBnZXRMYXN0UGFyc2VkVmFsdWUodGV4dCkpO1xuICB9XG59XG5cblxuLyoqXG4gKiBVcGRhdGUgY2xhc3MgYmluZGluZ3MgdXNpbmcgYW4gb2JqZWN0IGxpdGVyYWwgb3IgY2xhc3Mtc3RyaW5nIG9uIGFuIGVsZW1lbnQuXG4gKlxuICogVGhpcyBpbnN0cnVjdGlvbiBpcyBtZWFudCB0byBhcHBseSBzdHlsaW5nIHZpYSB0aGUgYFtjbGFzc109XCJleHBcImAgdGVtcGxhdGUgYmluZGluZ3MuXG4gKiBXaGVuIGNsYXNzZXMgYXJlIGFwcGxpZWQgdG8gdGhlIGVsZW1lbnQgdGhleSB3aWxsIHRoZW4gYmUgdXBkYXRlZCB3aXRoXG4gKiByZXNwZWN0IHRvIGFueSBzdHlsZXMvY2xhc3NlcyBzZXQgdmlhIGBjbGFzc1Byb3BgLiBJZiBhbnlcbiAqIGNsYXNzZXMgYXJlIHNldCB0byBmYWxzeSB0aGVuIHRoZXkgd2lsbCBiZSByZW1vdmVkIGZyb20gdGhlIGVsZW1lbnQuXG4gKlxuICogTm90ZSB0aGF0IHRoZSBzdHlsaW5nIGluc3RydWN0aW9uIHdpbGwgbm90IGJlIGFwcGxpZWQgdW50aWwgYHN0eWxpbmdBcHBseWAgaXMgY2FsbGVkLlxuICogTm90ZSB0aGF0IHRoaXMgd2lsbCB0aGUgcHJvdmlkZWQgY2xhc3NNYXAgdmFsdWUgdG8gdGhlIGhvc3QgZWxlbWVudCBpZiB0aGlzIGZ1bmN0aW9uIGlzIGNhbGxlZFxuICogd2l0aGluIGEgaG9zdCBiaW5kaW5nLlxuICpcbiAqIEBwYXJhbSBjbGFzc2VzIEEga2V5L3ZhbHVlIG1hcCBvciBzdHJpbmcgb2YgQ1NTIGNsYXNzZXMgdGhhdCB3aWxsIGJlIGFkZGVkIHRvIHRoZVxuICogICAgICAgIGdpdmVuIGVsZW1lbnQuIEFueSBtaXNzaW5nIGNsYXNzZXMgKHRoYXQgaGF2ZSBhbHJlYWR5IGJlZW4gYXBwbGllZCB0byB0aGUgZWxlbWVudFxuICogICAgICAgIGJlZm9yZWhhbmQpIHdpbGwgYmUgcmVtb3ZlZCAodW5zZXQpIGZyb20gdGhlIGVsZW1lbnQncyBsaXN0IG9mIENTUyBjbGFzc2VzLlxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1Y2xhc3NNYXAoY2xhc3Nlczoge1tjbGFzc05hbWU6IHN0cmluZ106IGJvb2xlYW58dW5kZWZpbmVkfG51bGx9fHN0cmluZ3x1bmRlZmluZWR8XG4gICAgICAgICAgICAgICAgICAgICAgICAgICBudWxsKTogdm9pZCB7XG4gIGNoZWNrU3R5bGluZ01hcChjbGFzc0tleVZhbHVlQXJyYXlTZXQsIGNsYXNzU3RyaW5nUGFyc2VyLCBjbGFzc2VzLCB0cnVlKTtcbn1cblxuLyoqXG4gKiBQYXJzZSB0ZXh0IGFzIGNsYXNzIGFuZCBhZGQgdmFsdWVzIHRvIEtleVZhbHVlQXJyYXkuXG4gKlxuICogVGhpcyBjb2RlIGlzIHB1bGxlZCBvdXQgdG8gYSBzZXBhcmF0ZSBmdW5jdGlvbiBzbyB0aGF0IGl0IGNhbiBiZSB0cmVlIHNoYWtlbiBhd2F5IGlmIGl0IGlzIG5vdFxuICogbmVlZGVkLiBJdCBpcyBvbmx5IHJlZmVyZW5jZWQgZnJvbSBgybXJtWNsYXNzTWFwYC5cbiAqXG4gKiBAcGFyYW0ga2V5VmFsdWVBcnJheSBLZXlWYWx1ZUFycmF5IHRvIGFkZCBwYXJzZWQgdmFsdWVzIHRvLlxuICogQHBhcmFtIHRleHQgdGV4dCB0byBwYXJzZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNsYXNzU3RyaW5nUGFyc2VyKGtleVZhbHVlQXJyYXk6IEtleVZhbHVlQXJyYXk8YW55PiwgdGV4dDogc3RyaW5nKTogdm9pZCB7XG4gIGZvciAobGV0IGkgPSBwYXJzZUNsYXNzTmFtZSh0ZXh0KTsgaSA+PSAwOyBpID0gcGFyc2VDbGFzc05hbWVOZXh0KHRleHQsIGkpKSB7XG4gICAga2V5VmFsdWVBcnJheVNldChrZXlWYWx1ZUFycmF5LCBnZXRMYXN0UGFyc2VkS2V5KHRleHQpLCB0cnVlKTtcbiAgfVxufVxuXG4vKipcbiAqIENvbW1vbiBjb2RlIGJldHdlZW4gYMm1ybVjbGFzc1Byb3BgIGFuZCBgybXJtXN0eWxlUHJvcGAuXG4gKlxuICogQHBhcmFtIHByb3AgcHJvcGVydHkgbmFtZS5cbiAqIEBwYXJhbSB2YWx1ZSBiaW5kaW5nIHZhbHVlLlxuICogQHBhcmFtIHN1ZmZpeCBzdWZmaXggZm9yIHRoZSBwcm9wZXJ0eSAoZS5nLiBgZW1gIG9yIGBweGApXG4gKiBAcGFyYW0gaXNDbGFzc0Jhc2VkIGB0cnVlYCBpZiBgY2xhc3NgIGNoYW5nZSAoYGZhbHNlYCBpZiBgc3R5bGVgKVxuICovXG5leHBvcnQgZnVuY3Rpb24gY2hlY2tTdHlsaW5nUHJvcGVydHkoXG4gICAgcHJvcDogc3RyaW5nLCB2YWx1ZTogYW55fE5PX0NIQU5HRSwgc3VmZml4OiBzdHJpbmd8dW5kZWZpbmVkfG51bGwsXG4gICAgaXNDbGFzc0Jhc2VkOiBib29sZWFuKTogdm9pZCB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgdFZpZXcgPSBnZXRUVmlldygpO1xuICAvLyBTdHlsaW5nIGluc3RydWN0aW9ucyB1c2UgMiBzbG90cyBwZXIgYmluZGluZy5cbiAgLy8gMS4gb25lIGZvciB0aGUgdmFsdWUgLyBUU3R5bGluZ0tleVxuICAvLyAyLiBvbmUgZm9yIHRoZSBpbnRlcm1pdHRlbnQtdmFsdWUgLyBUU3R5bGluZ1JhbmdlXG4gIGNvbnN0IGJpbmRpbmdJbmRleCA9IGluY3JlbWVudEJpbmRpbmdJbmRleCgyKTtcbiAgaWYgKHRWaWV3LmZpcnN0VXBkYXRlUGFzcykge1xuICAgIHN0eWxpbmdGaXJzdFVwZGF0ZVBhc3ModFZpZXcsIHByb3AsIGJpbmRpbmdJbmRleCwgaXNDbGFzc0Jhc2VkKTtcbiAgfVxuICBpZiAodmFsdWUgIT09IE5PX0NIQU5HRSAmJiBiaW5kaW5nVXBkYXRlZChsVmlldywgYmluZGluZ0luZGV4LCB2YWx1ZSkpIHtcbiAgICBjb25zdCB0Tm9kZSA9IHRWaWV3LmRhdGFbZ2V0U2VsZWN0ZWRJbmRleCgpXSBhcyBUTm9kZTtcbiAgICB1cGRhdGVTdHlsaW5nKFxuICAgICAgICB0VmlldywgdE5vZGUsIGxWaWV3LCBsVmlld1tSRU5ERVJFUl0sIHByb3AsXG4gICAgICAgIGxWaWV3W2JpbmRpbmdJbmRleCArIDFdID0gbm9ybWFsaXplU3VmZml4KHZhbHVlLCBzdWZmaXgpLCBpc0NsYXNzQmFzZWQsIGJpbmRpbmdJbmRleCk7XG4gIH1cbn1cblxuLyoqXG4gKiBDb21tb24gY29kZSBiZXR3ZWVuIGDJtcm1Y2xhc3NNYXBgIGFuZCBgybXJtXN0eWxlTWFwYC5cbiAqXG4gKiBAcGFyYW0ga2V5VmFsdWVBcnJheVNldCAoU2VlIGBrZXlWYWx1ZUFycmF5U2V0YCBpbiBcInV0aWwvYXJyYXlfdXRpbHNcIikgR2V0cyBwYXNzZWQgaW4gYXMgYVxuICogICAgICAgIGZ1bmN0aW9uIHNvIHRoYXQgYHN0eWxlYCBjYW4gYmUgcHJvY2Vzc2VkLiBUaGlzIGlzIGRvbmUgZm9yIHRyZWUgc2hha2luZyBwdXJwb3Nlcy5cbiAqIEBwYXJhbSBzdHJpbmdQYXJzZXIgUGFyc2VyIHVzZWQgdG8gcGFyc2UgYHZhbHVlYCBpZiBgc3RyaW5nYC4gKFBhc3NlZCBpbiBhcyBgc3R5bGVgIGFuZCBgY2xhc3NgXG4gKiAgICAgICAgaGF2ZSBkaWZmZXJlbnQgcGFyc2Vycy4pXG4gKiBAcGFyYW0gdmFsdWUgYm91bmQgdmFsdWUgZnJvbSBhcHBsaWNhdGlvblxuICogQHBhcmFtIGlzQ2xhc3NCYXNlZCBgdHJ1ZWAgaWYgYGNsYXNzYCBjaGFuZ2UgKGBmYWxzZWAgaWYgYHN0eWxlYClcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNoZWNrU3R5bGluZ01hcChcbiAgICBrZXlWYWx1ZUFycmF5U2V0OiAoa2V5VmFsdWVBcnJheTogS2V5VmFsdWVBcnJheTxhbnk+LCBrZXk6IHN0cmluZywgdmFsdWU6IGFueSkgPT4gdm9pZCxcbiAgICBzdHJpbmdQYXJzZXI6IChzdHlsZUtleVZhbHVlQXJyYXk6IEtleVZhbHVlQXJyYXk8YW55PiwgdGV4dDogc3RyaW5nKSA9PiB2b2lkLFxuICAgIHZhbHVlOiBhbnl8Tk9fQ0hBTkdFLCBpc0NsYXNzQmFzZWQ6IGJvb2xlYW4pOiB2b2lkIHtcbiAgY29uc3QgdFZpZXcgPSBnZXRUVmlldygpO1xuICBjb25zdCBiaW5kaW5nSW5kZXggPSBpbmNyZW1lbnRCaW5kaW5nSW5kZXgoMik7XG4gIGlmICh0Vmlldy5maXJzdFVwZGF0ZVBhc3MpIHtcbiAgICBzdHlsaW5nRmlyc3RVcGRhdGVQYXNzKHRWaWV3LCBudWxsLCBiaW5kaW5nSW5kZXgsIGlzQ2xhc3NCYXNlZCk7XG4gIH1cbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBpZiAodmFsdWUgIT09IE5PX0NIQU5HRSAmJiBiaW5kaW5nVXBkYXRlZChsVmlldywgYmluZGluZ0luZGV4LCB2YWx1ZSkpIHtcbiAgICAvLyBgZ2V0U2VsZWN0ZWRJbmRleCgpYCBzaG91bGQgYmUgaGVyZSAocmF0aGVyIHRoYW4gaW4gaW5zdHJ1Y3Rpb24pIHNvIHRoYXQgaXQgaXMgZ3VhcmRlZCBieSB0aGVcbiAgICAvLyBpZiBzbyBhcyBub3QgdG8gcmVhZCB1bm5lY2Vzc2FyaWx5LlxuICAgIGNvbnN0IHROb2RlID0gdFZpZXcuZGF0YVtnZXRTZWxlY3RlZEluZGV4KCldIGFzIFROb2RlO1xuICAgIGlmIChoYXNTdHlsaW5nSW5wdXRTaGFkb3codE5vZGUsIGlzQ2xhc3NCYXNlZCkgJiYgIWlzSW5Ib3N0QmluZGluZ3ModFZpZXcsIGJpbmRpbmdJbmRleCkpIHtcbiAgICAgIGlmIChuZ0Rldk1vZGUpIHtcbiAgICAgICAgLy8gdmVyaWZ5IHRoYXQgaWYgd2UgYXJlIHNoYWRvd2luZyB0aGVuIGBURGF0YWAgaXMgYXBwcm9wcmlhdGVseSBtYXJrZWQgc28gdGhhdCB3ZSBza2lwXG4gICAgICAgIC8vIHByb2Nlc3NpbmcgdGhpcyBiaW5kaW5nIGluIHN0eWxpbmcgcmVzb2x1dGlvbi5cbiAgICAgICAgY29uc3QgdFN0eWxpbmdLZXkgPSB0Vmlldy5kYXRhW2JpbmRpbmdJbmRleF07XG4gICAgICAgIGFzc2VydEVxdWFsKFxuICAgICAgICAgICAgQXJyYXkuaXNBcnJheSh0U3R5bGluZ0tleSkgPyB0U3R5bGluZ0tleVsxXSA6IHRTdHlsaW5nS2V5LCBmYWxzZSxcbiAgICAgICAgICAgICdTdHlsaW5nIGxpbmtlZCBsaXN0IHNoYWRvdyBpbnB1dCBzaG91bGQgYmUgbWFya2VkIGFzIFxcJ2ZhbHNlXFwnJyk7XG4gICAgICB9XG4gICAgICAvLyBWRSBkb2VzIG5vdCBjb25jYXRlbmF0ZSB0aGUgc3RhdGljIHBvcnRpb24gbGlrZSB3ZSBhcmUgZG9pbmcgaGVyZS5cbiAgICAgIC8vIEluc3RlYWQgVkUganVzdCBpZ25vcmVzIHRoZSBzdGF0aWMgY29tcGxldGVseSBpZiBkeW5hbWljIGJpbmRpbmcgaXMgcHJlc2VudC5cbiAgICAgIC8vIEJlY2F1c2Ugb2YgbG9jYWxpdHkgd2UgaGF2ZSBhbHJlYWR5IHNldCB0aGUgc3RhdGljIHBvcnRpb24gYmVjYXVzZSB3ZSBkb24ndCBrbm93IGlmIHRoZXJlXG4gICAgICAvLyBpcyBhIGR5bmFtaWMgcG9ydGlvbiB1bnRpbCBsYXRlci4gSWYgd2Ugd291bGQgaWdub3JlIHRoZSBzdGF0aWMgcG9ydGlvbiBpdCB3b3VsZCBsb29rIGxpa2VcbiAgICAgIC8vIHRoZSBiaW5kaW5nIGhhcyByZW1vdmVkIGl0LiBUaGlzIHdvdWxkIGNvbmZ1c2UgYFtuZ1N0eWxlXWAvYFtuZ0NsYXNzXWAgdG8gZG8gdGhlIHdyb25nXG4gICAgICAvLyB0aGluZyBhcyBpdCB3b3VsZCB0aGluayB0aGF0IHRoZSBzdGF0aWMgcG9ydGlvbiB3YXMgcmVtb3ZlZC4gRm9yIHRoaXMgcmVhc29uIHdlXG4gICAgICAvLyBjb25jYXRlbmF0ZSBpdCBzbyB0aGF0IGBbbmdTdHlsZV1gL2BbbmdDbGFzc11gICBjYW4gY29udGludWUgdG8gd29yayBvbiBjaGFuZ2VkLlxuICAgICAgbGV0IHN0YXRpY1ByZWZpeCA9IGlzQ2xhc3NCYXNlZCA/IHROb2RlLmNsYXNzZXNXaXRob3V0SG9zdCA6IHROb2RlLnN0eWxlc1dpdGhvdXRIb3N0O1xuICAgICAgbmdEZXZNb2RlICYmIGlzQ2xhc3NCYXNlZCA9PT0gZmFsc2UgJiYgc3RhdGljUHJlZml4ICE9PSBudWxsICYmXG4gICAgICAgICAgYXNzZXJ0RXF1YWwoXG4gICAgICAgICAgICAgIHN0YXRpY1ByZWZpeC5lbmRzV2l0aCgnOycpLCB0cnVlLCAnRXhwZWN0aW5nIHN0YXRpYyBwb3J0aW9uIHRvIGVuZCB3aXRoIFxcJztcXCcnKTtcbiAgICAgIGlmIChzdGF0aWNQcmVmaXggIT09IG51bGwpIHtcbiAgICAgICAgLy8gV2Ugd2FudCB0byBtYWtlIHN1cmUgdGhhdCBmYWxzeSB2YWx1ZXMgb2YgYHZhbHVlYCBiZWNvbWUgZW1wdHkgc3RyaW5ncy5cbiAgICAgICAgdmFsdWUgPSBjb25jYXRTdHJpbmdzV2l0aFNwYWNlKHN0YXRpY1ByZWZpeCwgdmFsdWUgPyB2YWx1ZSA6ICcnKTtcbiAgICAgIH1cbiAgICAgIC8vIEdpdmVuIGA8ZGl2IFtzdHlsZV0gbXktZGlyPmAgc3VjaCB0aGF0IGBteS1kaXJgIGhhcyBgQElucHV0KCdzdHlsZScpYC5cbiAgICAgIC8vIFRoaXMgdGFrZXMgb3ZlciB0aGUgYFtzdHlsZV1gIGJpbmRpbmcuIChTYW1lIGZvciBgW2NsYXNzXWApXG4gICAgICBzZXREaXJlY3RpdmVJbnB1dHNXaGljaFNoYWRvd3NTdHlsaW5nKHRWaWV3LCB0Tm9kZSwgbFZpZXcsIHZhbHVlLCBpc0NsYXNzQmFzZWQpO1xuICAgIH0gZWxzZSB7XG4gICAgICB1cGRhdGVTdHlsaW5nTWFwKFxuICAgICAgICAgIHRWaWV3LCB0Tm9kZSwgbFZpZXcsIGxWaWV3W1JFTkRFUkVSXSwgbFZpZXdbYmluZGluZ0luZGV4ICsgMV0sXG4gICAgICAgICAgbFZpZXdbYmluZGluZ0luZGV4ICsgMV0gPSB0b1N0eWxpbmdLZXlWYWx1ZUFycmF5KGtleVZhbHVlQXJyYXlTZXQsIHN0cmluZ1BhcnNlciwgdmFsdWUpLFxuICAgICAgICAgIGlzQ2xhc3NCYXNlZCwgYmluZGluZ0luZGV4KTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBEZXRlcm1pbmVzIHdoZW4gdGhlIGJpbmRpbmcgaXMgaW4gYGhvc3RCaW5kaW5nc2Agc2VjdGlvblxuICpcbiAqIEBwYXJhbSB0VmlldyBDdXJyZW50IGBUVmlld2BcbiAqIEBwYXJhbSBiaW5kaW5nSW5kZXggaW5kZXggb2YgYmluZGluZyB3aGljaCB3ZSB3b3VsZCBsaWtlIGlmIGl0IGlzIGluIGBob3N0QmluZGluZ3NgXG4gKi9cbmZ1bmN0aW9uIGlzSW5Ib3N0QmluZGluZ3ModFZpZXc6IFRWaWV3LCBiaW5kaW5nSW5kZXg6IG51bWJlcik6IGJvb2xlYW4ge1xuICAvLyBBbGwgaG9zdCBiaW5kaW5ncyBhcmUgcGxhY2VkIGFmdGVyIHRoZSBleHBhbmRvIHNlY3Rpb24uXG4gIHJldHVybiBiaW5kaW5nSW5kZXggPj0gdFZpZXcuZXhwYW5kb1N0YXJ0SW5kZXg7XG59XG5cbi8qKlxuICogQ29sbGVjdHMgdGhlIG5lY2Vzc2FyeSBpbmZvcm1hdGlvbiB0byBpbnNlcnQgdGhlIGJpbmRpbmcgaW50byBhIGxpbmtlZCBsaXN0IG9mIHN0eWxlIGJpbmRpbmdzXG4gKiB1c2luZyBgaW5zZXJ0VFN0eWxpbmdCaW5kaW5nYC5cbiAqXG4gKiBAcGFyYW0gdFZpZXcgYFRWaWV3YCB3aGVyZSB0aGUgYmluZGluZyBsaW5rZWQgbGlzdCB3aWxsIGJlIHN0b3JlZC5cbiAqIEBwYXJhbSB0U3R5bGluZ0tleSBQcm9wZXJ0eS9rZXkgb2YgdGhlIGJpbmRpbmcuXG4gKiBAcGFyYW0gYmluZGluZ0luZGV4IEluZGV4IG9mIGJpbmRpbmcgYXNzb2NpYXRlZCB3aXRoIHRoZSBgcHJvcGBcbiAqIEBwYXJhbSBpc0NsYXNzQmFzZWQgYHRydWVgIGlmIGBjbGFzc2AgY2hhbmdlIChgZmFsc2VgIGlmIGBzdHlsZWApXG4gKi9cbmZ1bmN0aW9uIHN0eWxpbmdGaXJzdFVwZGF0ZVBhc3MoXG4gICAgdFZpZXc6IFRWaWV3LCB0U3R5bGluZ0tleTogVFN0eWxpbmdLZXksIGJpbmRpbmdJbmRleDogbnVtYmVyLCBpc0NsYXNzQmFzZWQ6IGJvb2xlYW4pOiB2b2lkIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEZpcnN0VXBkYXRlUGFzcyh0Vmlldyk7XG4gIGNvbnN0IHREYXRhID0gdFZpZXcuZGF0YTtcbiAgaWYgKHREYXRhW2JpbmRpbmdJbmRleCArIDFdID09PSBudWxsKSB7XG4gICAgLy8gVGhlIGFib3ZlIGNoZWNrIGlzIG5lY2Vzc2FyeSBiZWNhdXNlIHdlIGRvbid0IGNsZWFyIGZpcnN0IHVwZGF0ZSBwYXNzIHVudGlsIGZpcnN0IHN1Y2Nlc3NmdWxcbiAgICAvLyAobm8gZXhjZXB0aW9uKSB0ZW1wbGF0ZSBleGVjdXRpb24uIFRoaXMgcHJldmVudHMgdGhlIHN0eWxpbmcgaW5zdHJ1Y3Rpb24gZnJvbSBkb3VibGUgYWRkaW5nXG4gICAgLy8gaXRzZWxmIHRvIHRoZSBsaXN0LlxuICAgIC8vIGBnZXRTZWxlY3RlZEluZGV4KClgIHNob3VsZCBiZSBoZXJlIChyYXRoZXIgdGhhbiBpbiBpbnN0cnVjdGlvbikgc28gdGhhdCBpdCBpcyBndWFyZGVkIGJ5IHRoZVxuICAgIC8vIGlmIHNvIGFzIG5vdCB0byByZWFkIHVubmVjZXNzYXJpbHkuXG4gICAgY29uc3QgdE5vZGUgPSB0RGF0YVtnZXRTZWxlY3RlZEluZGV4KCldIGFzIFROb2RlO1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKHROb2RlLCAnVE5vZGUgZXhwZWN0ZWQnKTtcbiAgICBjb25zdCBpc0hvc3RCaW5kaW5ncyA9IGlzSW5Ib3N0QmluZGluZ3ModFZpZXcsIGJpbmRpbmdJbmRleCk7XG4gICAgaWYgKGhhc1N0eWxpbmdJbnB1dFNoYWRvdyh0Tm9kZSwgaXNDbGFzc0Jhc2VkKSAmJiB0U3R5bGluZ0tleSA9PT0gbnVsbCAmJiAhaXNIb3N0QmluZGluZ3MpIHtcbiAgICAgIC8vIGB0U3R5bGluZ0tleSA9PT0gbnVsbGAgaW1wbGllcyB0aGF0IHdlIGFyZSBlaXRoZXIgYFtzdHlsZV1gIG9yIGBbY2xhc3NdYCBiaW5kaW5nLlxuICAgICAgLy8gSWYgdGhlcmUgaXMgYSBkaXJlY3RpdmUgd2hpY2ggdXNlcyBgQElucHV0KCdzdHlsZScpYCBvciBgQElucHV0KCdjbGFzcycpYCB0aGFuXG4gICAgICAvLyB3ZSBuZWVkIHRvIG5ldXRyYWxpemUgdGhpcyBiaW5kaW5nIHNpbmNlIHRoYXQgZGlyZWN0aXZlIGlzIHNoYWRvd2luZyBpdC5cbiAgICAgIC8vIFdlIHR1cm4gdGhpcyBpbnRvIGEgbm9vcCBieSBzZXR0aW5nIHRoZSBrZXkgdG8gYGZhbHNlYFxuICAgICAgdFN0eWxpbmdLZXkgPSBmYWxzZTtcbiAgICB9XG4gICAgdFN0eWxpbmdLZXkgPSB3cmFwSW5TdGF0aWNTdHlsaW5nS2V5KHREYXRhLCB0Tm9kZSwgdFN0eWxpbmdLZXksIGlzQ2xhc3NCYXNlZCk7XG4gICAgaW5zZXJ0VFN0eWxpbmdCaW5kaW5nKHREYXRhLCB0Tm9kZSwgdFN0eWxpbmdLZXksIGJpbmRpbmdJbmRleCwgaXNIb3N0QmluZGluZ3MsIGlzQ2xhc3NCYXNlZCk7XG4gIH1cbn1cblxuLyoqXG4gKiBBZGRzIHN0YXRpYyBzdHlsaW5nIGluZm9ybWF0aW9uIHRvIHRoZSBiaW5kaW5nIGlmIGFwcGxpY2FibGUuXG4gKlxuICogVGhlIGxpbmtlZCBsaXN0IG9mIHN0eWxlcyBub3Qgb25seSBzdG9yZXMgdGhlIGxpc3QgYW5kIGtleXMsIGJ1dCBhbHNvIHN0b3JlcyBzdGF0aWMgc3R5bGluZ1xuICogaW5mb3JtYXRpb24gb24gc29tZSBvZiB0aGUga2V5cy4gVGhpcyBmdW5jdGlvbiBkZXRlcm1pbmVzIGlmIHRoZSBrZXkgc2hvdWxkIGNvbnRhaW4gdGhlIHN0eWxpbmdcbiAqIGluZm9ybWF0aW9uIGFuZCBjb21wdXRlcyBpdC5cbiAqXG4gKiBTZWUgYFRTdHlsaW5nU3RhdGljYCBmb3IgbW9yZSBkZXRhaWxzLlxuICpcbiAqIEBwYXJhbSB0RGF0YSBgVERhdGFgIHdoZXJlIHRoZSBsaW5rZWQgbGlzdCBpcyBzdG9yZWQuXG4gKiBAcGFyYW0gdE5vZGUgYFROb2RlYCBmb3Igd2hpY2ggdGhlIHN0eWxpbmcgaXMgYmVpbmcgY29tcHV0ZWQuXG4gKiBAcGFyYW0gc3R5bGluZ0tleSBgVFN0eWxpbmdLZXlQcmltaXRpdmVgIHdoaWNoIG1heSBuZWVkIHRvIGJlIHdyYXBwZWQgaW50byBgVFN0eWxpbmdLZXlgXG4gKiBAcGFyYW0gaXNDbGFzc0Jhc2VkIGB0cnVlYCBpZiBgY2xhc3NgIChgZmFsc2VgIGlmIGBzdHlsZWApXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB3cmFwSW5TdGF0aWNTdHlsaW5nS2V5KFxuICAgIHREYXRhOiBURGF0YSwgdE5vZGU6IFROb2RlLCBzdHlsaW5nS2V5OiBUU3R5bGluZ0tleSwgaXNDbGFzc0Jhc2VkOiBib29sZWFuKTogVFN0eWxpbmdLZXkge1xuICBjb25zdCBob3N0RGlyZWN0aXZlRGVmID0gZ2V0Q3VycmVudERpcmVjdGl2ZURlZih0RGF0YSk7XG4gIGxldCByZXNpZHVhbCA9IGlzQ2xhc3NCYXNlZCA/IHROb2RlLnJlc2lkdWFsQ2xhc3NlcyA6IHROb2RlLnJlc2lkdWFsU3R5bGVzO1xuICBpZiAoaG9zdERpcmVjdGl2ZURlZiA9PT0gbnVsbCkge1xuICAgIC8vIFdlIGFyZSBpbiB0ZW1wbGF0ZSBub2RlLlxuICAgIC8vIElmIHRlbXBsYXRlIG5vZGUgYWxyZWFkeSBoYWQgc3R5bGluZyBpbnN0cnVjdGlvbiB0aGVuIGl0IGhhcyBhbHJlYWR5IGNvbGxlY3RlZCB0aGUgc3RhdGljXG4gICAgLy8gc3R5bGluZyBhbmQgdGhlcmUgaXMgbm8gbmVlZCB0byBjb2xsZWN0IHRoZW0gYWdhaW4uIFdlIGtub3cgdGhhdCB3ZSBhcmUgdGhlIGZpcnN0IHN0eWxpbmdcbiAgICAvLyBpbnN0cnVjdGlvbiBiZWNhdXNlIHRoZSBgVE5vZGUuKkJpbmRpbmdzYCBwb2ludHMgdG8gMCAobm90aGluZyBoYXMgYmVlbiBpbnNlcnRlZCB5ZXQpLlxuICAgIGNvbnN0IGlzRmlyc3RTdHlsaW5nSW5zdHJ1Y3Rpb25JblRlbXBsYXRlID1cbiAgICAgICAgKGlzQ2xhc3NCYXNlZCA/IHROb2RlLmNsYXNzQmluZGluZ3MgOiB0Tm9kZS5zdHlsZUJpbmRpbmdzKSBhcyBhbnkgYXMgbnVtYmVyID09PSAwO1xuICAgIGlmIChpc0ZpcnN0U3R5bGluZ0luc3RydWN0aW9uSW5UZW1wbGF0ZSkge1xuICAgICAgLy8gSXQgd291bGQgYmUgbmljZSB0byBiZSBhYmxlIHRvIGdldCB0aGUgc3RhdGljcyBmcm9tIGBtZXJnZUF0dHJzYCwgaG93ZXZlciwgYXQgdGhpcyBwb2ludFxuICAgICAgLy8gdGhleSBhcmUgYWxyZWFkeSBtZXJnZWQgYW5kIGl0IHdvdWxkIG5vdCBiZSBwb3NzaWJsZSB0byBmaWd1cmUgd2hpY2ggcHJvcGVydHkgYmVsb25ncyB3aGVyZVxuICAgICAgLy8gaW4gdGhlIHByaW9yaXR5LlxuICAgICAgc3R5bGluZ0tleSA9IGNvbGxlY3RTdHlsaW5nRnJvbURpcmVjdGl2ZXMobnVsbCwgdERhdGEsIHROb2RlLCBzdHlsaW5nS2V5LCBpc0NsYXNzQmFzZWQpO1xuICAgICAgc3R5bGluZ0tleSA9IGNvbGxlY3RTdHlsaW5nRnJvbVRBdHRycyhzdHlsaW5nS2V5LCB0Tm9kZS5hdHRycywgaXNDbGFzc0Jhc2VkKTtcbiAgICAgIC8vIFdlIGtub3cgdGhhdCBpZiB3ZSBoYXZlIHN0eWxpbmcgYmluZGluZyBpbiB0ZW1wbGF0ZSB3ZSBjYW4ndCBoYXZlIHJlc2lkdWFsLlxuICAgICAgcmVzaWR1YWwgPSBudWxsO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICAvLyBXZSBhcmUgaW4gaG9zdCBiaW5kaW5nIG5vZGUgYW5kIHRoZXJlIHdhcyBubyBiaW5kaW5nIGluc3RydWN0aW9uIGluIHRlbXBsYXRlIG5vZGUuXG4gICAgLy8gVGhpcyBtZWFucyB0aGF0IHdlIG5lZWQgdG8gY29tcHV0ZSB0aGUgcmVzaWR1YWwuXG4gICAgY29uc3QgZGlyZWN0aXZlU3R5bGluZ0xhc3QgPSB0Tm9kZS5kaXJlY3RpdmVTdHlsaW5nTGFzdDtcbiAgICBjb25zdCBpc0ZpcnN0U3R5bGluZ0luc3RydWN0aW9uSW5Ib3N0QmluZGluZyA9XG4gICAgICAgIGRpcmVjdGl2ZVN0eWxpbmdMYXN0ID09PSAtMSB8fCB0RGF0YVtkaXJlY3RpdmVTdHlsaW5nTGFzdF0gIT09IGhvc3REaXJlY3RpdmVEZWY7XG4gICAgaWYgKGlzRmlyc3RTdHlsaW5nSW5zdHJ1Y3Rpb25Jbkhvc3RCaW5kaW5nKSB7XG4gICAgICBzdHlsaW5nS2V5ID1cbiAgICAgICAgICBjb2xsZWN0U3R5bGluZ0Zyb21EaXJlY3RpdmVzKGhvc3REaXJlY3RpdmVEZWYsIHREYXRhLCB0Tm9kZSwgc3R5bGluZ0tleSwgaXNDbGFzc0Jhc2VkKTtcbiAgICAgIGlmIChyZXNpZHVhbCA9PT0gbnVsbCkge1xuICAgICAgICAvLyAtIElmIGBudWxsYCB0aGFuIGVpdGhlcjpcbiAgICAgICAgLy8gICAgLSBUZW1wbGF0ZSBzdHlsaW5nIGluc3RydWN0aW9uIGFscmVhZHkgcmFuIGFuZCBpdCBoYXMgY29uc3VtZWQgdGhlIHN0YXRpY1xuICAgICAgICAvLyAgICAgIHN0eWxpbmcgaW50byBpdHMgYFRTdHlsaW5nS2V5YCBhbmQgc28gdGhlcmUgaXMgbm8gbmVlZCB0byB1cGRhdGUgcmVzaWR1YWwuIEluc3RlYWRcbiAgICAgICAgLy8gICAgICB3ZSBuZWVkIHRvIHVwZGF0ZSB0aGUgYFRTdHlsaW5nS2V5YCBhc3NvY2lhdGVkIHdpdGggdGhlIGZpcnN0IHRlbXBsYXRlIG5vZGVcbiAgICAgICAgLy8gICAgICBpbnN0cnVjdGlvbi4gT1JcbiAgICAgICAgLy8gICAgLSBTb21lIG90aGVyIHN0eWxpbmcgaW5zdHJ1Y3Rpb24gcmFuIGFuZCBkZXRlcm1pbmVkIHRoYXQgdGhlcmUgYXJlIG5vIHJlc2lkdWFsc1xuICAgICAgICBsZXQgdGVtcGxhdGVTdHlsaW5nS2V5ID0gZ2V0VGVtcGxhdGVIZWFkVFN0eWxpbmdLZXkodERhdGEsIHROb2RlLCBpc0NsYXNzQmFzZWQpO1xuICAgICAgICBpZiAodGVtcGxhdGVTdHlsaW5nS2V5ICE9PSB1bmRlZmluZWQgJiYgQXJyYXkuaXNBcnJheSh0ZW1wbGF0ZVN0eWxpbmdLZXkpKSB7XG4gICAgICAgICAgLy8gT25seSByZWNvbXB1dGUgaWYgYHRlbXBsYXRlU3R5bGluZ0tleWAgaGFkIHN0YXRpYyB2YWx1ZXMuIChJZiBubyBzdGF0aWMgdmFsdWUgZm91bmRcbiAgICAgICAgICAvLyB0aGVuIHRoZXJlIGlzIG5vdGhpbmcgdG8gZG8gc2luY2UgdGhpcyBvcGVyYXRpb24gY2FuIG9ubHkgcHJvZHVjZSBsZXNzIHN0YXRpYyBrZXlzLCBub3RcbiAgICAgICAgICAvLyBtb3JlLilcbiAgICAgICAgICB0ZW1wbGF0ZVN0eWxpbmdLZXkgPSBjb2xsZWN0U3R5bGluZ0Zyb21EaXJlY3RpdmVzKFxuICAgICAgICAgICAgICBudWxsLCB0RGF0YSwgdE5vZGUsIHRlbXBsYXRlU3R5bGluZ0tleVsxXSAvKiB1bndyYXAgcHJldmlvdXMgc3RhdGljcyAqLyxcbiAgICAgICAgICAgICAgaXNDbGFzc0Jhc2VkKTtcbiAgICAgICAgICB0ZW1wbGF0ZVN0eWxpbmdLZXkgPVxuICAgICAgICAgICAgICBjb2xsZWN0U3R5bGluZ0Zyb21UQXR0cnModGVtcGxhdGVTdHlsaW5nS2V5LCB0Tm9kZS5hdHRycywgaXNDbGFzc0Jhc2VkKTtcbiAgICAgICAgICBzZXRUZW1wbGF0ZUhlYWRUU3R5bGluZ0tleSh0RGF0YSwgdE5vZGUsIGlzQ2xhc3NCYXNlZCwgdGVtcGxhdGVTdHlsaW5nS2V5KTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gV2Ugb25seSBuZWVkIHRvIHJlY29tcHV0ZSByZXNpZHVhbCBpZiBpdCBpcyBub3QgYG51bGxgLlxuICAgICAgICAvLyAtIElmIGV4aXN0aW5nIHJlc2lkdWFsIChpbXBsaWVzIHRoZXJlIHdhcyBubyB0ZW1wbGF0ZSBzdHlsaW5nKS4gVGhpcyBtZWFucyB0aGF0IHNvbWUgb2ZcbiAgICAgICAgLy8gICB0aGUgc3RhdGljcyBtYXkgaGF2ZSBtb3ZlZCBmcm9tIHRoZSByZXNpZHVhbCB0byB0aGUgYHN0eWxpbmdLZXlgIGFuZCBzbyB3ZSBoYXZlIHRvXG4gICAgICAgIC8vICAgcmVjb21wdXRlLlxuICAgICAgICAvLyAtIElmIGB1bmRlZmluZWRgIHRoaXMgaXMgdGhlIGZpcnN0IHRpbWUgd2UgYXJlIHJ1bm5pbmcuXG4gICAgICAgIHJlc2lkdWFsID0gY29sbGVjdFJlc2lkdWFsKHREYXRhLCB0Tm9kZSwgaXNDbGFzc0Jhc2VkKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgaWYgKHJlc2lkdWFsICE9PSB1bmRlZmluZWQpIHtcbiAgICBpc0NsYXNzQmFzZWQgPyAodE5vZGUucmVzaWR1YWxDbGFzc2VzID0gcmVzaWR1YWwpIDogKHROb2RlLnJlc2lkdWFsU3R5bGVzID0gcmVzaWR1YWwpO1xuICB9XG4gIHJldHVybiBzdHlsaW5nS2V5O1xufVxuXG4vKipcbiAqIFJldHJpZXZlIHRoZSBgVFN0eWxpbmdLZXlgIGZvciB0aGUgdGVtcGxhdGUgc3R5bGluZyBpbnN0cnVjdGlvbi5cbiAqXG4gKiBUaGlzIGlzIG5lZWRlZCBzaW5jZSBgaG9zdEJpbmRpbmdgIHN0eWxpbmcgaW5zdHJ1Y3Rpb25zIGFyZSBpbnNlcnRlZCBhZnRlciB0aGUgdGVtcGxhdGVcbiAqIGluc3RydWN0aW9uLiBXaGlsZSB0aGUgdGVtcGxhdGUgaW5zdHJ1Y3Rpb24gbmVlZHMgdG8gdXBkYXRlIHRoZSByZXNpZHVhbCBpbiBgVE5vZGVgIHRoZVxuICogYGhvc3RCaW5kaW5nYCBpbnN0cnVjdGlvbnMgbmVlZCB0byB1cGRhdGUgdGhlIGBUU3R5bGluZ0tleWAgb2YgdGhlIHRlbXBsYXRlIGluc3RydWN0aW9uIGJlY2F1c2VcbiAqIHRoZSB0ZW1wbGF0ZSBpbnN0cnVjdGlvbiBpcyBkb3duc3RyZWFtIGZyb20gdGhlIGBob3N0QmluZGluZ3NgIGluc3RydWN0aW9ucy5cbiAqXG4gKiBAcGFyYW0gdERhdGEgYFREYXRhYCB3aGVyZSB0aGUgbGlua2VkIGxpc3QgaXMgc3RvcmVkLlxuICogQHBhcmFtIHROb2RlIGBUTm9kZWAgZm9yIHdoaWNoIHRoZSBzdHlsaW5nIGlzIGJlaW5nIGNvbXB1dGVkLlxuICogQHBhcmFtIGlzQ2xhc3NCYXNlZCBgdHJ1ZWAgaWYgYGNsYXNzYCAoYGZhbHNlYCBpZiBgc3R5bGVgKVxuICogQHJldHVybiBgVFN0eWxpbmdLZXlgIGlmIGZvdW5kIG9yIGB1bmRlZmluZWRgIGlmIG5vdCBmb3VuZC5cbiAqL1xuZnVuY3Rpb24gZ2V0VGVtcGxhdGVIZWFkVFN0eWxpbmdLZXkodERhdGE6IFREYXRhLCB0Tm9kZTogVE5vZGUsIGlzQ2xhc3NCYXNlZDogYm9vbGVhbik6IFRTdHlsaW5nS2V5fFxuICAgIHVuZGVmaW5lZCB7XG4gIGNvbnN0IGJpbmRpbmdzID0gaXNDbGFzc0Jhc2VkID8gdE5vZGUuY2xhc3NCaW5kaW5ncyA6IHROb2RlLnN0eWxlQmluZGluZ3M7XG4gIGlmIChnZXRUU3R5bGluZ1JhbmdlTmV4dChiaW5kaW5ncykgPT09IDApIHtcbiAgICAvLyBUaGVyZSBkb2VzIG5vdCBzZWVtIHRvIGJlIGEgc3R5bGluZyBpbnN0cnVjdGlvbiBpbiB0aGUgYHRlbXBsYXRlYC5cbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9XG4gIHJldHVybiB0RGF0YVtnZXRUU3R5bGluZ1JhbmdlUHJldihiaW5kaW5ncyldIGFzIFRTdHlsaW5nS2V5O1xufVxuXG4vKipcbiAqIFVwZGF0ZSB0aGUgYFRTdHlsaW5nS2V5YCBvZiB0aGUgZmlyc3QgdGVtcGxhdGUgaW5zdHJ1Y3Rpb24gaW4gYFROb2RlYC5cbiAqXG4gKiBMb2dpY2FsbHkgYGhvc3RCaW5kaW5nc2Agc3R5bGluZyBpbnN0cnVjdGlvbnMgYXJlIG9mIGxvd2VyIHByaW9yaXR5IHRoYW4gdGhhdCBvZiB0aGUgdGVtcGxhdGUuXG4gKiBIb3dldmVyLCB0aGV5IGV4ZWN1dGUgYWZ0ZXIgdGhlIHRlbXBsYXRlIHN0eWxpbmcgaW5zdHJ1Y3Rpb25zLiBUaGlzIG1lYW5zIHRoYXQgdGhleSBnZXQgaW5zZXJ0ZWRcbiAqIGluIGZyb250IG9mIHRoZSB0ZW1wbGF0ZSBzdHlsaW5nIGluc3RydWN0aW9ucy5cbiAqXG4gKiBJZiB3ZSBoYXZlIGEgdGVtcGxhdGUgc3R5bGluZyBpbnN0cnVjdGlvbiBhbmQgYSBuZXcgYGhvc3RCaW5kaW5nc2Agc3R5bGluZyBpbnN0cnVjdGlvbiBpc1xuICogZXhlY3V0ZWQgaXQgbWVhbnMgdGhhdCBpdCBtYXkgbmVlZCB0byBzdGVhbCBzdGF0aWMgZmllbGRzIGZyb20gdGhlIHRlbXBsYXRlIGluc3RydWN0aW9uLiBUaGlzXG4gKiBtZXRob2QgYWxsb3dzIHVzIHRvIHVwZGF0ZSB0aGUgZmlyc3QgdGVtcGxhdGUgaW5zdHJ1Y3Rpb24gYFRTdHlsaW5nS2V5YCB3aXRoIGEgbmV3IHZhbHVlLlxuICpcbiAqIEFzc3VtZTpcbiAqIGBgYFxuICogPGRpdiBteS1kaXIgc3R5bGU9XCJjb2xvcjogcmVkXCIgW3N0eWxlLmNvbG9yXT1cInRtcGxFeHBcIj48L2Rpdj5cbiAqXG4gKiBARGlyZWN0aXZlKHtcbiAqICAgaG9zdDoge1xuICogICAgICdzdHlsZSc6ICd3aWR0aDogMTAwcHgnLFxuICogICAgICdbc3R5bGUuY29sb3JdJzogJ2RpckV4cCcsXG4gKiAgIH1cbiAqIH0pXG4gKiBjbGFzcyBNeURpciB7fVxuICogYGBgXG4gKlxuICogd2hlbiBgW3N0eWxlLmNvbG9yXT1cInRtcGxFeHBcImAgZXhlY3V0ZXMgaXQgY3JlYXRlcyB0aGlzIGRhdGEgc3RydWN0dXJlLlxuICogYGBgXG4gKiAgWycnLCAnY29sb3InLCAnY29sb3InLCAncmVkJywgJ3dpZHRoJywgJzEwMHB4J10sXG4gKiBgYGBcbiAqXG4gKiBUaGUgcmVhc29uIGZvciB0aGlzIGlzIHRoYXQgdGhlIHRlbXBsYXRlIGluc3RydWN0aW9uIGRvZXMgbm90IGtub3cgaWYgdGhlcmUgYXJlIHN0eWxpbmdcbiAqIGluc3RydWN0aW9ucyBhbmQgbXVzdCBhc3N1bWUgdGhhdCB0aGVyZSBhcmUgbm9uZSBhbmQgbXVzdCBjb2xsZWN0IGFsbCBvZiB0aGUgc3RhdGljIHN0eWxpbmcuXG4gKiAoYm90aFxuICogYGNvbG9yJyBhbmQgJ3dpZHRoYClcbiAqXG4gKiBXaGVuIGAnW3N0eWxlLmNvbG9yXSc6ICdkaXJFeHAnLGAgZXhlY3V0ZXMgd2UgbmVlZCB0byBpbnNlcnQgYSBuZXcgZGF0YSBpbnRvIHRoZSBsaW5rZWQgbGlzdC5cbiAqIGBgYFxuICogIFsnJywgJ2NvbG9yJywgJ3dpZHRoJywgJzEwMHB4J10sICAvLyBuZXdseSBpbnNlcnRlZFxuICogIFsnJywgJ2NvbG9yJywgJ2NvbG9yJywgJ3JlZCcsICd3aWR0aCcsICcxMDBweCddLCAvLyB0aGlzIGlzIHdyb25nXG4gKiBgYGBcbiAqXG4gKiBOb3RpY2UgdGhhdCB0aGUgdGVtcGxhdGUgc3RhdGljcyBpcyBub3cgd3JvbmcgYXMgaXQgaW5jb3JyZWN0bHkgY29udGFpbnMgYHdpZHRoYCBzbyB3ZSBuZWVkIHRvXG4gKiB1cGRhdGUgaXQgbGlrZSBzbzpcbiAqIGBgYFxuICogIFsnJywgJ2NvbG9yJywgJ3dpZHRoJywgJzEwMHB4J10sXG4gKiAgWycnLCAnY29sb3InLCAnY29sb3InLCAncmVkJ10sICAgIC8vIFVQREFURVxuICogYGBgXG4gKlxuICogQHBhcmFtIHREYXRhIGBURGF0YWAgd2hlcmUgdGhlIGxpbmtlZCBsaXN0IGlzIHN0b3JlZC5cbiAqIEBwYXJhbSB0Tm9kZSBgVE5vZGVgIGZvciB3aGljaCB0aGUgc3R5bGluZyBpcyBiZWluZyBjb21wdXRlZC5cbiAqIEBwYXJhbSBpc0NsYXNzQmFzZWQgYHRydWVgIGlmIGBjbGFzc2AgKGBmYWxzZWAgaWYgYHN0eWxlYClcbiAqIEBwYXJhbSB0U3R5bGluZ0tleSBOZXcgYFRTdHlsaW5nS2V5YCB3aGljaCBpcyByZXBsYWNpbmcgdGhlIG9sZCBvbmUuXG4gKi9cbmZ1bmN0aW9uIHNldFRlbXBsYXRlSGVhZFRTdHlsaW5nS2V5KFxuICAgIHREYXRhOiBURGF0YSwgdE5vZGU6IFROb2RlLCBpc0NsYXNzQmFzZWQ6IGJvb2xlYW4sIHRTdHlsaW5nS2V5OiBUU3R5bGluZ0tleSk6IHZvaWQge1xuICBjb25zdCBiaW5kaW5ncyA9IGlzQ2xhc3NCYXNlZCA/IHROb2RlLmNsYXNzQmluZGluZ3MgOiB0Tm9kZS5zdHlsZUJpbmRpbmdzO1xuICBuZ0Rldk1vZGUgJiZcbiAgICAgIGFzc2VydE5vdEVxdWFsKFxuICAgICAgICAgIGdldFRTdHlsaW5nUmFuZ2VOZXh0KGJpbmRpbmdzKSwgMCxcbiAgICAgICAgICAnRXhwZWN0aW5nIHRvIGhhdmUgYXQgbGVhc3Qgb25lIHRlbXBsYXRlIHN0eWxpbmcgYmluZGluZy4nKTtcbiAgdERhdGFbZ2V0VFN0eWxpbmdSYW5nZVByZXYoYmluZGluZ3MpXSA9IHRTdHlsaW5nS2V5O1xufVxuXG4vKipcbiAqIENvbGxlY3QgYWxsIHN0YXRpYyB2YWx1ZXMgYWZ0ZXIgdGhlIGN1cnJlbnQgYFROb2RlLmRpcmVjdGl2ZVN0eWxpbmdMYXN0YCBpbmRleC5cbiAqXG4gKiBDb2xsZWN0IHRoZSByZW1haW5pbmcgc3R5bGluZyBpbmZvcm1hdGlvbiB3aGljaCBoYXMgbm90IHlldCBiZWVuIGNvbGxlY3RlZCBieSBhbiBleGlzdGluZ1xuICogc3R5bGluZyBpbnN0cnVjdGlvbi5cbiAqXG4gKiBAcGFyYW0gdERhdGEgYFREYXRhYCB3aGVyZSB0aGUgYERpcmVjdGl2ZURlZnNgIGFyZSBzdG9yZWQuXG4gKiBAcGFyYW0gdE5vZGUgYFROb2RlYCB3aGljaCBjb250YWlucyB0aGUgZGlyZWN0aXZlIHJhbmdlLlxuICogQHBhcmFtIGlzQ2xhc3NCYXNlZCBgdHJ1ZWAgaWYgYGNsYXNzYCAoYGZhbHNlYCBpZiBgc3R5bGVgKVxuICovXG5mdW5jdGlvbiBjb2xsZWN0UmVzaWR1YWwodERhdGE6IFREYXRhLCB0Tm9kZTogVE5vZGUsIGlzQ2xhc3NCYXNlZDogYm9vbGVhbik6IEtleVZhbHVlQXJyYXk8YW55PnxcbiAgICBudWxsIHtcbiAgbGV0IHJlc2lkdWFsOiBLZXlWYWx1ZUFycmF5PGFueT58bnVsbHx1bmRlZmluZWQgPSB1bmRlZmluZWQ7XG4gIGNvbnN0IGRpcmVjdGl2ZUVuZCA9IHROb2RlLmRpcmVjdGl2ZUVuZDtcbiAgbmdEZXZNb2RlICYmXG4gICAgICBhc3NlcnROb3RFcXVhbChcbiAgICAgICAgICB0Tm9kZS5kaXJlY3RpdmVTdHlsaW5nTGFzdCwgLTEsXG4gICAgICAgICAgJ0J5IHRoZSB0aW1lIHRoaXMgZnVuY3Rpb24gZ2V0cyBjYWxsZWQgYXQgbGVhc3Qgb25lIGhvc3RCaW5kaW5ncy1ub2RlIHN0eWxpbmcgaW5zdHJ1Y3Rpb24gbXVzdCBoYXZlIGV4ZWN1dGVkLicpO1xuICAvLyBXZSBhZGQgYDEgKyB0Tm9kZS5kaXJlY3RpdmVTdGFydGAgYmVjYXVzZSB3ZSBuZWVkIHRvIHNraXAgdGhlIGN1cnJlbnQgZGlyZWN0aXZlIChhcyB3ZSBhcmVcbiAgLy8gY29sbGVjdGluZyB0aGluZ3MgYWZ0ZXIgdGhlIGxhc3QgYGhvc3RCaW5kaW5nc2AgZGlyZWN0aXZlIHdoaWNoIGhhZCBhIHN0eWxpbmcgaW5zdHJ1Y3Rpb24uKVxuICBmb3IgKGxldCBpID0gMSArIHROb2RlLmRpcmVjdGl2ZVN0eWxpbmdMYXN0OyBpIDwgZGlyZWN0aXZlRW5kOyBpKyspIHtcbiAgICBjb25zdCBhdHRycyA9ICh0RGF0YVtpXSBhcyBEaXJlY3RpdmVEZWY8YW55PikuaG9zdEF0dHJzO1xuICAgIHJlc2lkdWFsID0gY29sbGVjdFN0eWxpbmdGcm9tVEF0dHJzKHJlc2lkdWFsLCBhdHRycywgaXNDbGFzc0Jhc2VkKSBhcyBLZXlWYWx1ZUFycmF5PGFueT58IG51bGw7XG4gIH1cbiAgcmV0dXJuIGNvbGxlY3RTdHlsaW5nRnJvbVRBdHRycyhyZXNpZHVhbCwgdE5vZGUuYXR0cnMsIGlzQ2xhc3NCYXNlZCkgYXMgS2V5VmFsdWVBcnJheTxhbnk+fCBudWxsO1xufVxuXG4vKipcbiAqIENvbGxlY3QgdGhlIHN0YXRpYyBzdHlsaW5nIGluZm9ybWF0aW9uIHdpdGggbG93ZXIgcHJpb3JpdHkgdGhhbiBgaG9zdERpcmVjdGl2ZURlZmAuXG4gKlxuICogKFRoaXMgaXMgb3Bwb3NpdGUgb2YgcmVzaWR1YWwgc3R5bGluZy4pXG4gKlxuICogQHBhcmFtIGhvc3REaXJlY3RpdmVEZWYgYERpcmVjdGl2ZURlZmAgZm9yIHdoaWNoIHdlIHdhbnQgdG8gY29sbGVjdCBsb3dlciBwcmlvcml0eSBzdGF0aWNcbiAqICAgICAgICBzdHlsaW5nLiAoT3IgYG51bGxgIGlmIHRlbXBsYXRlIHN0eWxpbmcpXG4gKiBAcGFyYW0gdERhdGEgYFREYXRhYCB3aGVyZSB0aGUgbGlua2VkIGxpc3QgaXMgc3RvcmVkLlxuICogQHBhcmFtIHROb2RlIGBUTm9kZWAgZm9yIHdoaWNoIHRoZSBzdHlsaW5nIGlzIGJlaW5nIGNvbXB1dGVkLlxuICogQHBhcmFtIHN0eWxpbmdLZXkgRXhpc3RpbmcgYFRTdHlsaW5nS2V5YCB0byB1cGRhdGUgb3Igd3JhcC5cbiAqIEBwYXJhbSBpc0NsYXNzQmFzZWQgYHRydWVgIGlmIGBjbGFzc2AgKGBmYWxzZWAgaWYgYHN0eWxlYClcbiAqL1xuZnVuY3Rpb24gY29sbGVjdFN0eWxpbmdGcm9tRGlyZWN0aXZlcyhcbiAgICBob3N0RGlyZWN0aXZlRGVmOiBEaXJlY3RpdmVEZWY8YW55PnxudWxsLCB0RGF0YTogVERhdGEsIHROb2RlOiBUTm9kZSwgc3R5bGluZ0tleTogVFN0eWxpbmdLZXksXG4gICAgaXNDbGFzc0Jhc2VkOiBib29sZWFuKTogVFN0eWxpbmdLZXkge1xuICAvLyBXZSBuZWVkIHRvIGxvb3AgYmVjYXVzZSB0aGVyZSBjYW4gYmUgZGlyZWN0aXZlcyB3aGljaCBoYXZlIGBob3N0QXR0cnNgIGJ1dCBkb24ndCBoYXZlXG4gIC8vIGBob3N0QmluZGluZ3NgIHNvIHRoaXMgbG9vcCBjYXRjaGVzIHVwIHRvIHRoZSBjdXJyZW50IGRpcmVjdGl2ZS4uXG4gIGxldCBjdXJyZW50RGlyZWN0aXZlOiBEaXJlY3RpdmVEZWY8YW55PnxudWxsID0gbnVsbDtcbiAgY29uc3QgZGlyZWN0aXZlRW5kID0gdE5vZGUuZGlyZWN0aXZlRW5kO1xuICBsZXQgZGlyZWN0aXZlU3R5bGluZ0xhc3QgPSB0Tm9kZS5kaXJlY3RpdmVTdHlsaW5nTGFzdDtcbiAgaWYgKGRpcmVjdGl2ZVN0eWxpbmdMYXN0ID09PSAtMSkge1xuICAgIGRpcmVjdGl2ZVN0eWxpbmdMYXN0ID0gdE5vZGUuZGlyZWN0aXZlU3RhcnQ7XG4gIH0gZWxzZSB7XG4gICAgZGlyZWN0aXZlU3R5bGluZ0xhc3QrKztcbiAgfVxuICB3aGlsZSAoZGlyZWN0aXZlU3R5bGluZ0xhc3QgPCBkaXJlY3RpdmVFbmQpIHtcbiAgICBjdXJyZW50RGlyZWN0aXZlID0gdERhdGFbZGlyZWN0aXZlU3R5bGluZ0xhc3RdIGFzIERpcmVjdGl2ZURlZjxhbnk+O1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKGN1cnJlbnREaXJlY3RpdmUsICdleHBlY3RlZCB0byBiZSBkZWZpbmVkJyk7XG4gICAgc3R5bGluZ0tleSA9IGNvbGxlY3RTdHlsaW5nRnJvbVRBdHRycyhzdHlsaW5nS2V5LCBjdXJyZW50RGlyZWN0aXZlLmhvc3RBdHRycywgaXNDbGFzc0Jhc2VkKTtcbiAgICBpZiAoY3VycmVudERpcmVjdGl2ZSA9PT0gaG9zdERpcmVjdGl2ZURlZikgYnJlYWs7XG4gICAgZGlyZWN0aXZlU3R5bGluZ0xhc3QrKztcbiAgfVxuICBpZiAoaG9zdERpcmVjdGl2ZURlZiAhPT0gbnVsbCkge1xuICAgIC8vIHdlIG9ubHkgYWR2YW5jZSB0aGUgc3R5bGluZyBjdXJzb3IgaWYgd2UgYXJlIGNvbGxlY3RpbmcgZGF0YSBmcm9tIGhvc3QgYmluZGluZ3MuXG4gICAgLy8gVGVtcGxhdGUgZXhlY3V0ZXMgYmVmb3JlIGhvc3QgYmluZGluZ3MgYW5kIHNvIGlmIHdlIHdvdWxkIHVwZGF0ZSB0aGUgaW5kZXgsXG4gICAgLy8gaG9zdCBiaW5kaW5ncyB3b3VsZCBub3QgZ2V0IHRoZWlyIHN0YXRpY3MuXG4gICAgdE5vZGUuZGlyZWN0aXZlU3R5bGluZ0xhc3QgPSBkaXJlY3RpdmVTdHlsaW5nTGFzdDtcbiAgfVxuICByZXR1cm4gc3R5bGluZ0tleTtcbn1cblxuLyoqXG4gKiBDb252ZXJ0IGBUQXR0cnNgIGludG8gYFRTdHlsaW5nU3RhdGljYC5cbiAqXG4gKiBAcGFyYW0gc3R5bGluZ0tleSBleGlzdGluZyBgVFN0eWxpbmdLZXlgIHRvIHVwZGF0ZSBvciB3cmFwLlxuICogQHBhcmFtIGF0dHJzIGBUQXR0cmlidXRlc2AgdG8gcHJvY2Vzcy5cbiAqIEBwYXJhbSBpc0NsYXNzQmFzZWQgYHRydWVgIGlmIGBjbGFzc2AgKGBmYWxzZWAgaWYgYHN0eWxlYClcbiAqL1xuZnVuY3Rpb24gY29sbGVjdFN0eWxpbmdGcm9tVEF0dHJzKFxuICAgIHN0eWxpbmdLZXk6IFRTdHlsaW5nS2V5fHVuZGVmaW5lZCwgYXR0cnM6IFRBdHRyaWJ1dGVzfG51bGwsXG4gICAgaXNDbGFzc0Jhc2VkOiBib29sZWFuKTogVFN0eWxpbmdLZXkge1xuICBjb25zdCBkZXNpcmVkTWFya2VyID0gaXNDbGFzc0Jhc2VkID8gQXR0cmlidXRlTWFya2VyLkNsYXNzZXMgOiBBdHRyaWJ1dGVNYXJrZXIuU3R5bGVzO1xuICBsZXQgY3VycmVudE1hcmtlciA9IEF0dHJpYnV0ZU1hcmtlci5JbXBsaWNpdEF0dHJpYnV0ZXM7XG4gIGlmIChhdHRycyAhPT0gbnVsbCkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYXR0cnMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGl0ZW0gPSBhdHRyc1tpXSBhcyBudW1iZXIgfCBzdHJpbmc7XG4gICAgICBpZiAodHlwZW9mIGl0ZW0gPT09ICdudW1iZXInKSB7XG4gICAgICAgIGN1cnJlbnRNYXJrZXIgPSBpdGVtO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKGN1cnJlbnRNYXJrZXIgPT09IGRlc2lyZWRNYXJrZXIpIHtcbiAgICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkoc3R5bGluZ0tleSkpIHtcbiAgICAgICAgICAgIHN0eWxpbmdLZXkgPSBzdHlsaW5nS2V5ID09PSB1bmRlZmluZWQgPyBbXSA6IFsnJywgc3R5bGluZ0tleV0gYXMgYW55O1xuICAgICAgICAgIH1cbiAgICAgICAgICBrZXlWYWx1ZUFycmF5U2V0KFxuICAgICAgICAgICAgICBzdHlsaW5nS2V5IGFzIEtleVZhbHVlQXJyYXk8YW55PiwgaXRlbSwgaXNDbGFzc0Jhc2VkID8gdHJ1ZSA6IGF0dHJzWysraV0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBzdHlsaW5nS2V5ID09PSB1bmRlZmluZWQgPyBudWxsIDogc3R5bGluZ0tleTtcbn1cblxuLyoqXG4gKiBDb252ZXJ0IHVzZXIgaW5wdXQgdG8gYEtleVZhbHVlQXJyYXlgLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gdGFrZXMgdXNlciBpbnB1dCB3aGljaCBjb3VsZCBiZSBgc3RyaW5nYCwgT2JqZWN0IGxpdGVyYWwsIG9yIGl0ZXJhYmxlIGFuZCBjb252ZXJ0c1xuICogaXQgaW50byBhIGNvbnNpc3RlbnQgcmVwcmVzZW50YXRpb24uIFRoZSBvdXRwdXQgb2YgdGhpcyBpcyBgS2V5VmFsdWVBcnJheWAgKHdoaWNoIGlzIGFuIGFycmF5XG4gKiB3aGVyZVxuICogZXZlbiBpbmRleGVzIGNvbnRhaW4ga2V5cyBhbmQgb2RkIGluZGV4ZXMgY29udGFpbiB2YWx1ZXMgZm9yIHRob3NlIGtleXMpLlxuICpcbiAqIFRoZSBhZHZhbnRhZ2Ugb2YgY29udmVydGluZyB0byBgS2V5VmFsdWVBcnJheWAgaXMgdGhhdCB3ZSBjYW4gcGVyZm9ybSBkaWZmIGluIGFuIGlucHV0XG4gKiBpbmRlcGVuZGVudFxuICogd2F5LlxuICogKGllIHdlIGNhbiBjb21wYXJlIGBmb28gYmFyYCB0byBgWydiYXInLCAnYmF6J10gYW5kIGRldGVybWluZSBhIHNldCBvZiBjaGFuZ2VzIHdoaWNoIG5lZWQgdG8gYmVcbiAqIGFwcGxpZWQpXG4gKlxuICogVGhlIGZhY3QgdGhhdCBgS2V5VmFsdWVBcnJheWAgaXMgc29ydGVkIGlzIHZlcnkgaW1wb3J0YW50IGJlY2F1c2UgaXQgYWxsb3dzIHVzIHRvIGNvbXB1dGUgdGhlXG4gKiBkaWZmZXJlbmNlIGluIGxpbmVhciBmYXNoaW9uIHdpdGhvdXQgdGhlIG5lZWQgdG8gYWxsb2NhdGUgYW55IGFkZGl0aW9uYWwgZGF0YS5cbiAqXG4gKiBGb3IgZXhhbXBsZSBpZiB3ZSBrZXB0IHRoaXMgYXMgYSBgTWFwYCB3ZSB3b3VsZCBoYXZlIHRvIGl0ZXJhdGUgb3ZlciBwcmV2aW91cyBgTWFwYCB0byBkZXRlcm1pbmVcbiAqIHdoaWNoIHZhbHVlcyBuZWVkIHRvIGJlIGRlbGV0ZWQsIG92ZXIgdGhlIG5ldyBgTWFwYCB0byBkZXRlcm1pbmUgYWRkaXRpb25zLCBhbmQgd2Ugd291bGQgaGF2ZSB0b1xuICoga2VlcCBhZGRpdGlvbmFsIGBNYXBgIHRvIGtlZXAgdHJhY2sgb2YgZHVwbGljYXRlcyBvciBpdGVtcyB3aGljaCBoYXZlIG5vdCB5ZXQgYmVlbiB2aXNpdGVkLlxuICpcbiAqIEBwYXJhbSBrZXlWYWx1ZUFycmF5U2V0IChTZWUgYGtleVZhbHVlQXJyYXlTZXRgIGluIFwidXRpbC9hcnJheV91dGlsc1wiKSBHZXRzIHBhc3NlZCBpbiBhcyBhXG4gKiAgICAgICAgZnVuY3Rpb24gc28gdGhhdCBgc3R5bGVgIGNhbiBiZSBwcm9jZXNzZWQuIFRoaXMgaXMgZG9uZVxuICogICAgICAgIGZvciB0cmVlIHNoYWtpbmcgcHVycG9zZXMuXG4gKiBAcGFyYW0gc3RyaW5nUGFyc2VyIFRoZSBwYXJzZXIgaXMgcGFzc2VkIGluIHNvIHRoYXQgaXQgd2lsbCBiZSB0cmVlIHNoYWthYmxlLiBTZWVcbiAqICAgICAgICBgc3R5bGVTdHJpbmdQYXJzZXJgIGFuZCBgY2xhc3NTdHJpbmdQYXJzZXJgXG4gKiBAcGFyYW0gdmFsdWUgVGhlIHZhbHVlIHRvIHBhcnNlL2NvbnZlcnQgdG8gYEtleVZhbHVlQXJyYXlgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0b1N0eWxpbmdLZXlWYWx1ZUFycmF5KFxuICAgIGtleVZhbHVlQXJyYXlTZXQ6IChrZXlWYWx1ZUFycmF5OiBLZXlWYWx1ZUFycmF5PGFueT4sIGtleTogc3RyaW5nLCB2YWx1ZTogYW55KSA9PiB2b2lkLFxuICAgIHN0cmluZ1BhcnNlcjogKHN0eWxlS2V5VmFsdWVBcnJheTogS2V5VmFsdWVBcnJheTxhbnk+LCB0ZXh0OiBzdHJpbmcpID0+IHZvaWQsXG4gICAgdmFsdWU6IHN0cmluZ3xzdHJpbmdbXXx7W2tleTogc3RyaW5nXTogYW55fXxTYWZlVmFsdWV8bnVsbHx1bmRlZmluZWQpOiBLZXlWYWx1ZUFycmF5PGFueT4ge1xuICBpZiAodmFsdWUgPT0gbnVsbCAvKnx8IHZhbHVlID09PSB1bmRlZmluZWQgKi8gfHwgdmFsdWUgPT09ICcnKSByZXR1cm4gRU1QVFlfQVJSQVkgYXMgYW55O1xuICBjb25zdCBzdHlsZUtleVZhbHVlQXJyYXk6IEtleVZhbHVlQXJyYXk8YW55PiA9IFtdIGFzIGFueTtcbiAgY29uc3QgdW53cmFwcGVkVmFsdWUgPSB1bndyYXBTYWZlVmFsdWUodmFsdWUpIGFzIHN0cmluZyB8IHN0cmluZ1tdIHwge1trZXk6IHN0cmluZ106IGFueX07XG4gIGlmIChBcnJheS5pc0FycmF5KHVud3JhcHBlZFZhbHVlKSkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdW53cmFwcGVkVmFsdWUubGVuZ3RoOyBpKyspIHtcbiAgICAgIGtleVZhbHVlQXJyYXlTZXQoc3R5bGVLZXlWYWx1ZUFycmF5LCB1bndyYXBwZWRWYWx1ZVtpXSwgdHJ1ZSk7XG4gICAgfVxuICB9IGVsc2UgaWYgKHR5cGVvZiB1bndyYXBwZWRWYWx1ZSA9PT0gJ29iamVjdCcpIHtcbiAgICBmb3IgKGNvbnN0IGtleSBpbiB1bndyYXBwZWRWYWx1ZSkge1xuICAgICAgaWYgKHVud3JhcHBlZFZhbHVlLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAga2V5VmFsdWVBcnJheVNldChzdHlsZUtleVZhbHVlQXJyYXksIGtleSwgdW53cmFwcGVkVmFsdWVba2V5XSk7XG4gICAgICB9XG4gICAgfVxuICB9IGVsc2UgaWYgKHR5cGVvZiB1bndyYXBwZWRWYWx1ZSA9PT0gJ3N0cmluZycpIHtcbiAgICBzdHJpbmdQYXJzZXIoc3R5bGVLZXlWYWx1ZUFycmF5LCB1bndyYXBwZWRWYWx1ZSk7XG4gIH0gZWxzZSB7XG4gICAgbmdEZXZNb2RlICYmXG4gICAgICAgIHRocm93RXJyb3IoJ1Vuc3VwcG9ydGVkIHN0eWxpbmcgdHlwZSAnICsgdHlwZW9mIHVud3JhcHBlZFZhbHVlICsgJzogJyArIHVud3JhcHBlZFZhbHVlKTtcbiAgfVxuICByZXR1cm4gc3R5bGVLZXlWYWx1ZUFycmF5O1xufVxuXG4vKipcbiAqIFNldCBhIGB2YWx1ZWAgZm9yIGEgYGtleWAuXG4gKlxuICogU2VlOiBga2V5VmFsdWVBcnJheVNldGAgZm9yIGRldGFpbHNcbiAqXG4gKiBAcGFyYW0ga2V5VmFsdWVBcnJheSBLZXlWYWx1ZUFycmF5IHRvIGFkZCB0by5cbiAqIEBwYXJhbSBrZXkgU3R5bGUga2V5IHRvIGFkZC5cbiAqIEBwYXJhbSB2YWx1ZSBUaGUgdmFsdWUgdG8gc2V0LlxuICovXG5leHBvcnQgZnVuY3Rpb24gc3R5bGVLZXlWYWx1ZUFycmF5U2V0KGtleVZhbHVlQXJyYXk6IEtleVZhbHVlQXJyYXk8YW55Piwga2V5OiBzdHJpbmcsIHZhbHVlOiBhbnkpIHtcbiAga2V5VmFsdWVBcnJheVNldChrZXlWYWx1ZUFycmF5LCBrZXksIHVud3JhcFNhZmVWYWx1ZSh2YWx1ZSkpO1xufVxuXG4vKipcbiAqIENsYXNzLWJpbmRpbmctc3BlY2lmaWMgZnVuY3Rpb24gZm9yIHNldHRpbmcgdGhlIGB2YWx1ZWAgZm9yIGEgYGtleWAuXG4gKlxuICogU2VlOiBga2V5VmFsdWVBcnJheVNldGAgZm9yIGRldGFpbHNcbiAqXG4gKiBAcGFyYW0ga2V5VmFsdWVBcnJheSBLZXlWYWx1ZUFycmF5IHRvIGFkZCB0by5cbiAqIEBwYXJhbSBrZXkgU3R5bGUga2V5IHRvIGFkZC5cbiAqIEBwYXJhbSB2YWx1ZSBUaGUgdmFsdWUgdG8gc2V0LlxuICovXG5leHBvcnQgZnVuY3Rpb24gY2xhc3NLZXlWYWx1ZUFycmF5U2V0KGtleVZhbHVlQXJyYXk6IEtleVZhbHVlQXJyYXk8YW55Piwga2V5OiB1bmtub3duLCB2YWx1ZTogYW55KSB7XG4gIC8vIFdlIHVzZSBgY2xhc3NMaXN0LmFkZGAgdG8gZXZlbnR1YWxseSBhZGQgdGhlIENTUyBjbGFzc2VzIHRvIHRoZSBET00gbm9kZS4gQW55IHZhbHVlIHBhc3NlZCBpbnRvXG4gIC8vIGBhZGRgIGlzIHN0cmluZ2lmaWVkIGFuZCBhZGRlZCB0byB0aGUgYGNsYXNzYCBhdHRyaWJ1dGUsIGUuZy4gZXZlbiBudWxsLCB1bmRlZmluZWQgb3IgbnVtYmVyc1xuICAvLyB3aWxsIGJlIGFkZGVkLiBTdHJpbmdpZnkgdGhlIGtleSBoZXJlIHNvIHRoYXQgb3VyIGludGVybmFsIGRhdGEgc3RydWN0dXJlIG1hdGNoZXMgdGhlIHZhbHVlIGluXG4gIC8vIHRoZSBET00uIFRoZSBvbmx5IGV4Y2VwdGlvbnMgYXJlIGVtcHR5IHN0cmluZ3MgYW5kIHN0cmluZ3MgdGhhdCBjb250YWluIHNwYWNlcyBmb3Igd2hpY2hcbiAgLy8gdGhlIGJyb3dzZXIgdGhyb3dzIGFuIGVycm9yLiBXZSBpZ25vcmUgc3VjaCB2YWx1ZXMsIGJlY2F1c2UgdGhlIGVycm9yIGlzIHNvbWV3aGF0IGNyeXB0aWMuXG4gIGNvbnN0IHN0cmluZ0tleSA9IFN0cmluZyhrZXkpO1xuICBpZiAoc3RyaW5nS2V5ICE9PSAnJyAmJiAhc3RyaW5nS2V5LmluY2x1ZGVzKCcgJykpIHtcbiAgICBrZXlWYWx1ZUFycmF5U2V0KGtleVZhbHVlQXJyYXksIHN0cmluZ0tleSwgdmFsdWUpO1xuICB9XG59XG5cbi8qKlxuICogVXBkYXRlIG1hcCBiYXNlZCBzdHlsaW5nLlxuICpcbiAqIE1hcCBiYXNlZCBzdHlsaW5nIGNvdWxkIGJlIGFueXRoaW5nIHdoaWNoIGNvbnRhaW5zIG1vcmUgdGhhbiBvbmUgYmluZGluZy4gRm9yIGV4YW1wbGUgYHN0cmluZ2AsXG4gKiBvciBvYmplY3QgbGl0ZXJhbC4gRGVhbGluZyB3aXRoIGFsbCBvZiB0aGVzZSB0eXBlcyB3b3VsZCBjb21wbGljYXRlIHRoZSBsb2dpYyBzb1xuICogaW5zdGVhZCB0aGlzIGZ1bmN0aW9uIGV4cGVjdHMgdGhhdCB0aGUgY29tcGxleCBpbnB1dCBpcyBmaXJzdCBjb252ZXJ0ZWQgaW50byBub3JtYWxpemVkXG4gKiBgS2V5VmFsdWVBcnJheWAuIFRoZSBhZHZhbnRhZ2Ugb2Ygbm9ybWFsaXphdGlvbiBpcyB0aGF0IHdlIGdldCB0aGUgdmFsdWVzIHNvcnRlZCwgd2hpY2ggbWFrZXMgaXRcbiAqIHZlcnkgY2hlYXAgdG8gY29tcHV0ZSBkZWx0YXMgYmV0d2VlbiB0aGUgcHJldmlvdXMgYW5kIGN1cnJlbnQgdmFsdWUuXG4gKlxuICogQHBhcmFtIHRWaWV3IEFzc29jaWF0ZWQgYFRWaWV3LmRhdGFgIGNvbnRhaW5zIHRoZSBsaW5rZWQgbGlzdCBvZiBiaW5kaW5nIHByaW9yaXRpZXMuXG4gKiBAcGFyYW0gdE5vZGUgYFROb2RlYCB3aGVyZSB0aGUgYmluZGluZyBpcyBsb2NhdGVkLlxuICogQHBhcmFtIGxWaWV3IGBMVmlld2AgY29udGFpbnMgdGhlIHZhbHVlcyBhc3NvY2lhdGVkIHdpdGggb3RoZXIgc3R5bGluZyBiaW5kaW5nIGF0IHRoaXMgYFROb2RlYC5cbiAqIEBwYXJhbSByZW5kZXJlciBSZW5kZXJlciB0byB1c2UgaWYgYW55IHVwZGF0ZXMuXG4gKiBAcGFyYW0gb2xkS2V5VmFsdWVBcnJheSBQcmV2aW91cyB2YWx1ZSByZXByZXNlbnRlZCBhcyBgS2V5VmFsdWVBcnJheWBcbiAqIEBwYXJhbSBuZXdLZXlWYWx1ZUFycmF5IEN1cnJlbnQgdmFsdWUgcmVwcmVzZW50ZWQgYXMgYEtleVZhbHVlQXJyYXlgXG4gKiBAcGFyYW0gaXNDbGFzc0Jhc2VkIGB0cnVlYCBpZiBgY2xhc3NgIChgZmFsc2VgIGlmIGBzdHlsZWApXG4gKiBAcGFyYW0gYmluZGluZ0luZGV4IEJpbmRpbmcgaW5kZXggb2YgdGhlIGJpbmRpbmcuXG4gKi9cbmZ1bmN0aW9uIHVwZGF0ZVN0eWxpbmdNYXAoXG4gICAgdFZpZXc6IFRWaWV3LCB0Tm9kZTogVE5vZGUsIGxWaWV3OiBMVmlldywgcmVuZGVyZXI6IFJlbmRlcmVyLFxuICAgIG9sZEtleVZhbHVlQXJyYXk6IEtleVZhbHVlQXJyYXk8YW55PiwgbmV3S2V5VmFsdWVBcnJheTogS2V5VmFsdWVBcnJheTxhbnk+LFxuICAgIGlzQ2xhc3NCYXNlZDogYm9vbGVhbiwgYmluZGluZ0luZGV4OiBudW1iZXIpIHtcbiAgaWYgKG9sZEtleVZhbHVlQXJyYXkgYXMgS2V5VmFsdWVBcnJheTxhbnk+fCBOT19DSEFOR0UgPT09IE5PX0NIQU5HRSkge1xuICAgIC8vIE9uIGZpcnN0IGV4ZWN1dGlvbiB0aGUgb2xkS2V5VmFsdWVBcnJheSBpcyBOT19DSEFOR0UgPT4gdHJlYXQgaXQgYXMgZW1wdHkgS2V5VmFsdWVBcnJheS5cbiAgICBvbGRLZXlWYWx1ZUFycmF5ID0gRU1QVFlfQVJSQVkgYXMgYW55O1xuICB9XG4gIGxldCBvbGRJbmRleCA9IDA7XG4gIGxldCBuZXdJbmRleCA9IDA7XG4gIGxldCBvbGRLZXk6IHN0cmluZ3xudWxsID0gMCA8IG9sZEtleVZhbHVlQXJyYXkubGVuZ3RoID8gb2xkS2V5VmFsdWVBcnJheVswXSA6IG51bGw7XG4gIGxldCBuZXdLZXk6IHN0cmluZ3xudWxsID0gMCA8IG5ld0tleVZhbHVlQXJyYXkubGVuZ3RoID8gbmV3S2V5VmFsdWVBcnJheVswXSA6IG51bGw7XG4gIHdoaWxlIChvbGRLZXkgIT09IG51bGwgfHwgbmV3S2V5ICE9PSBudWxsKSB7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydExlc3NUaGFuKG9sZEluZGV4LCA5OTksICdBcmUgd2Ugc3R1Y2sgaW4gaW5maW5pdGUgbG9vcD8nKTtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0TGVzc1RoYW4obmV3SW5kZXgsIDk5OSwgJ0FyZSB3ZSBzdHVjayBpbiBpbmZpbml0ZSBsb29wPycpO1xuICAgIGNvbnN0IG9sZFZhbHVlID1cbiAgICAgICAgb2xkSW5kZXggPCBvbGRLZXlWYWx1ZUFycmF5Lmxlbmd0aCA/IG9sZEtleVZhbHVlQXJyYXlbb2xkSW5kZXggKyAxXSA6IHVuZGVmaW5lZDtcbiAgICBjb25zdCBuZXdWYWx1ZSA9XG4gICAgICAgIG5ld0luZGV4IDwgbmV3S2V5VmFsdWVBcnJheS5sZW5ndGggPyBuZXdLZXlWYWx1ZUFycmF5W25ld0luZGV4ICsgMV0gOiB1bmRlZmluZWQ7XG4gICAgbGV0IHNldEtleTogc3RyaW5nfG51bGwgPSBudWxsO1xuICAgIGxldCBzZXRWYWx1ZTogYW55ID0gdW5kZWZpbmVkO1xuICAgIGlmIChvbGRLZXkgPT09IG5ld0tleSkge1xuICAgICAgLy8gVVBEQVRFOiBLZXlzIGFyZSBlcXVhbCA9PiBuZXcgdmFsdWUgaXMgb3ZlcndyaXRpbmcgb2xkIHZhbHVlLlxuICAgICAgb2xkSW5kZXggKz0gMjtcbiAgICAgIG5ld0luZGV4ICs9IDI7XG4gICAgICBpZiAob2xkVmFsdWUgIT09IG5ld1ZhbHVlKSB7XG4gICAgICAgIHNldEtleSA9IG5ld0tleTtcbiAgICAgICAgc2V0VmFsdWUgPSBuZXdWYWx1ZTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKG5ld0tleSA9PT0gbnVsbCB8fCBvbGRLZXkgIT09IG51bGwgJiYgb2xkS2V5IDwgbmV3S2V5ISkge1xuICAgICAgLy8gREVMRVRFOiBvbGRLZXkga2V5IGlzIG1pc3Npbmcgb3Igd2UgZGlkIG5vdCBmaW5kIHRoZSBvbGRLZXkgaW4gdGhlIG5ld1ZhbHVlXG4gICAgICAvLyAoYmVjYXVzZSB0aGUga2V5VmFsdWVBcnJheSBpcyBzb3J0ZWQgYW5kIGBuZXdLZXlgIGlzIGZvdW5kIGxhdGVyIGFscGhhYmV0aWNhbGx5KS5cbiAgICAgIC8vIGBcImJhY2tncm91bmRcIiA8IFwiY29sb3JcImAgc28gd2UgbmVlZCB0byBkZWxldGUgYFwiYmFja2dyb3VuZFwiYCBiZWNhdXNlIGl0IGlzIG5vdCBmb3VuZCBpbiB0aGVcbiAgICAgIC8vIG5ldyBhcnJheS5cbiAgICAgIG9sZEluZGV4ICs9IDI7XG4gICAgICBzZXRLZXkgPSBvbGRLZXk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIENSRUFURTogbmV3S2V5J3MgaXMgZWFybGllciBhbHBoYWJldGljYWxseSB0aGFuIG9sZEtleSdzIChvciBubyBvbGRLZXkpID0+IHdlIGhhdmUgbmV3IGtleS5cbiAgICAgIC8vIGBcImNvbG9yXCIgPiBcImJhY2tncm91bmRcImAgc28gd2UgbmVlZCB0byBhZGQgYGNvbG9yYCBiZWNhdXNlIGl0IGlzIGluIG5ldyBhcnJheSBidXQgbm90IGluXG4gICAgICAvLyBvbGQgYXJyYXkuXG4gICAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChuZXdLZXksICdFeHBlY3RpbmcgdG8gaGF2ZSBhIHZhbGlkIGtleScpO1xuICAgICAgbmV3SW5kZXggKz0gMjtcbiAgICAgIHNldEtleSA9IG5ld0tleTtcbiAgICAgIHNldFZhbHVlID0gbmV3VmFsdWU7XG4gICAgfVxuICAgIGlmIChzZXRLZXkgIT09IG51bGwpIHtcbiAgICAgIHVwZGF0ZVN0eWxpbmcodFZpZXcsIHROb2RlLCBsVmlldywgcmVuZGVyZXIsIHNldEtleSwgc2V0VmFsdWUsIGlzQ2xhc3NCYXNlZCwgYmluZGluZ0luZGV4KTtcbiAgICB9XG4gICAgb2xkS2V5ID0gb2xkSW5kZXggPCBvbGRLZXlWYWx1ZUFycmF5Lmxlbmd0aCA/IG9sZEtleVZhbHVlQXJyYXlbb2xkSW5kZXhdIDogbnVsbDtcbiAgICBuZXdLZXkgPSBuZXdJbmRleCA8IG5ld0tleVZhbHVlQXJyYXkubGVuZ3RoID8gbmV3S2V5VmFsdWVBcnJheVtuZXdJbmRleF0gOiBudWxsO1xuICB9XG59XG5cbi8qKlxuICogVXBkYXRlIGEgc2ltcGxlIChwcm9wZXJ0eSBuYW1lKSBzdHlsaW5nLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gdGFrZXMgYHByb3BgIGFuZCB1cGRhdGVzIHRoZSBET00gdG8gdGhhdCB2YWx1ZS4gVGhlIGZ1bmN0aW9uIHRha2VzIHRoZSBiaW5kaW5nXG4gKiB2YWx1ZSBhcyB3ZWxsIGFzIGJpbmRpbmcgcHJpb3JpdHkgaW50byBjb25zaWRlcmF0aW9uIHRvIGRldGVybWluZSB3aGljaCB2YWx1ZSBzaG91bGQgYmUgd3JpdHRlblxuICogdG8gRE9NLiAoRm9yIGV4YW1wbGUgaXQgbWF5IGJlIGRldGVybWluZWQgdGhhdCB0aGVyZSBpcyBhIGhpZ2hlciBwcmlvcml0eSBvdmVyd3JpdGUgd2hpY2ggYmxvY2tzXG4gKiB0aGUgRE9NIHdyaXRlLCBvciBpZiB0aGUgdmFsdWUgZ29lcyB0byBgdW5kZWZpbmVkYCBhIGxvd2VyIHByaW9yaXR5IG92ZXJ3cml0ZSBtYXkgYmUgY29uc3VsdGVkLilcbiAqXG4gKiBAcGFyYW0gdFZpZXcgQXNzb2NpYXRlZCBgVFZpZXcuZGF0YWAgY29udGFpbnMgdGhlIGxpbmtlZCBsaXN0IG9mIGJpbmRpbmcgcHJpb3JpdGllcy5cbiAqIEBwYXJhbSB0Tm9kZSBgVE5vZGVgIHdoZXJlIHRoZSBiaW5kaW5nIGlzIGxvY2F0ZWQuXG4gKiBAcGFyYW0gbFZpZXcgYExWaWV3YCBjb250YWlucyB0aGUgdmFsdWVzIGFzc29jaWF0ZWQgd2l0aCBvdGhlciBzdHlsaW5nIGJpbmRpbmcgYXQgdGhpcyBgVE5vZGVgLlxuICogQHBhcmFtIHJlbmRlcmVyIFJlbmRlcmVyIHRvIHVzZSBpZiBhbnkgdXBkYXRlcy5cbiAqIEBwYXJhbSBwcm9wIEVpdGhlciBzdHlsZSBwcm9wZXJ0eSBuYW1lIG9yIGEgY2xhc3MgbmFtZS5cbiAqIEBwYXJhbSB2YWx1ZSBFaXRoZXIgc3R5bGUgdmFsdWUgZm9yIGBwcm9wYCBvciBgdHJ1ZWAvYGZhbHNlYCBpZiBgcHJvcGAgaXMgY2xhc3MuXG4gKiBAcGFyYW0gaXNDbGFzc0Jhc2VkIGB0cnVlYCBpZiBgY2xhc3NgIChgZmFsc2VgIGlmIGBzdHlsZWApXG4gKiBAcGFyYW0gYmluZGluZ0luZGV4IEJpbmRpbmcgaW5kZXggb2YgdGhlIGJpbmRpbmcuXG4gKi9cbmZ1bmN0aW9uIHVwZGF0ZVN0eWxpbmcoXG4gICAgdFZpZXc6IFRWaWV3LCB0Tm9kZTogVE5vZGUsIGxWaWV3OiBMVmlldywgcmVuZGVyZXI6IFJlbmRlcmVyLCBwcm9wOiBzdHJpbmcsXG4gICAgdmFsdWU6IHN0cmluZ3x1bmRlZmluZWR8bnVsbHxib29sZWFuLCBpc0NsYXNzQmFzZWQ6IGJvb2xlYW4sIGJpbmRpbmdJbmRleDogbnVtYmVyKSB7XG4gIGlmICghKHROb2RlLnR5cGUgJiBUTm9kZVR5cGUuQW55Uk5vZGUpKSB7XG4gICAgLy8gSXQgaXMgcG9zc2libGUgdG8gaGF2ZSBzdHlsaW5nIG9uIG5vbi1lbGVtZW50cyAoc3VjaCBhcyBuZy1jb250YWluZXIpLlxuICAgIC8vIFRoaXMgaXMgcmFyZSwgYnV0IGl0IGRvZXMgaGFwcGVuLiBJbiBzdWNoIGEgY2FzZSwganVzdCBpZ25vcmUgdGhlIGJpbmRpbmcuXG4gICAgcmV0dXJuO1xuICB9XG4gIGNvbnN0IHREYXRhID0gdFZpZXcuZGF0YTtcbiAgY29uc3QgdFJhbmdlID0gdERhdGFbYmluZGluZ0luZGV4ICsgMV0gYXMgVFN0eWxpbmdSYW5nZTtcbiAgY29uc3QgaGlnaGVyUHJpb3JpdHlWYWx1ZSA9IGdldFRTdHlsaW5nUmFuZ2VOZXh0RHVwbGljYXRlKHRSYW5nZSkgP1xuICAgICAgZmluZFN0eWxpbmdWYWx1ZSh0RGF0YSwgdE5vZGUsIGxWaWV3LCBwcm9wLCBnZXRUU3R5bGluZ1JhbmdlTmV4dCh0UmFuZ2UpLCBpc0NsYXNzQmFzZWQpIDpcbiAgICAgIHVuZGVmaW5lZDtcbiAgaWYgKCFpc1N0eWxpbmdWYWx1ZVByZXNlbnQoaGlnaGVyUHJpb3JpdHlWYWx1ZSkpIHtcbiAgICAvLyBXZSBkb24ndCBoYXZlIGEgbmV4dCBkdXBsaWNhdGUsIG9yIHdlIGRpZCBub3QgZmluZCBhIGR1cGxpY2F0ZSB2YWx1ZS5cbiAgICBpZiAoIWlzU3R5bGluZ1ZhbHVlUHJlc2VudCh2YWx1ZSkpIHtcbiAgICAgIC8vIFdlIHNob3VsZCBkZWxldGUgY3VycmVudCB2YWx1ZSBvciByZXN0b3JlIHRvIGxvd2VyIHByaW9yaXR5IHZhbHVlLlxuICAgICAgaWYgKGdldFRTdHlsaW5nUmFuZ2VQcmV2RHVwbGljYXRlKHRSYW5nZSkpIHtcbiAgICAgICAgLy8gV2UgaGF2ZSBhIHBvc3NpYmxlIHByZXYgZHVwbGljYXRlLCBsZXQncyByZXRyaWV2ZSBpdC5cbiAgICAgICAgdmFsdWUgPSBmaW5kU3R5bGluZ1ZhbHVlKHREYXRhLCBudWxsLCBsVmlldywgcHJvcCwgYmluZGluZ0luZGV4LCBpc0NsYXNzQmFzZWQpO1xuICAgICAgfVxuICAgIH1cbiAgICBjb25zdCByTm9kZSA9IGdldE5hdGl2ZUJ5SW5kZXgoZ2V0U2VsZWN0ZWRJbmRleCgpLCBsVmlldykgYXMgUkVsZW1lbnQ7XG4gICAgYXBwbHlTdHlsaW5nKHJlbmRlcmVyLCBpc0NsYXNzQmFzZWQsIHJOb2RlLCBwcm9wLCB2YWx1ZSk7XG4gIH1cbn1cblxuLyoqXG4gKiBTZWFyY2ggZm9yIHN0eWxpbmcgdmFsdWUgd2l0aCBoaWdoZXIgcHJpb3JpdHkgd2hpY2ggaXMgb3ZlcndyaXRpbmcgY3VycmVudCB2YWx1ZSwgb3IgYVxuICogdmFsdWUgb2YgbG93ZXIgcHJpb3JpdHkgdG8gd2hpY2ggd2Ugc2hvdWxkIGZhbGwgYmFjayBpZiB0aGUgdmFsdWUgaXMgYHVuZGVmaW5lZGAuXG4gKlxuICogV2hlbiB2YWx1ZSBpcyBiZWluZyBhcHBsaWVkIGF0IGEgbG9jYXRpb24sIHJlbGF0ZWQgdmFsdWVzIG5lZWQgdG8gYmUgY29uc3VsdGVkLlxuICogLSBJZiB0aGVyZSBpcyBhIGhpZ2hlciBwcmlvcml0eSBiaW5kaW5nLCB3ZSBzaG91bGQgYmUgdXNpbmcgdGhhdCBvbmUgaW5zdGVhZC5cbiAqICAgRm9yIGV4YW1wbGUgYDxkaXYgIFtzdHlsZV09XCJ7Y29sb3I6ZXhwMX1cIiBbc3R5bGUuY29sb3JdPVwiZXhwMlwiPmAgY2hhbmdlIHRvIGBleHAxYFxuICogICByZXF1aXJlcyB0aGF0IHdlIGNoZWNrIGBleHAyYCB0byBzZWUgaWYgaXQgaXMgc2V0IHRvIHZhbHVlIG90aGVyIHRoYW4gYHVuZGVmaW5lZGAuXG4gKiAtIElmIHRoZXJlIGlzIGEgbG93ZXIgcHJpb3JpdHkgYmluZGluZyBhbmQgd2UgYXJlIGNoYW5naW5nIHRvIGB1bmRlZmluZWRgXG4gKiAgIEZvciBleGFtcGxlIGA8ZGl2ICBbc3R5bGVdPVwie2NvbG9yOmV4cDF9XCIgW3N0eWxlLmNvbG9yXT1cImV4cDJcIj5gIGNoYW5nZSB0byBgZXhwMmAgdG9cbiAqICAgYHVuZGVmaW5lZGAgcmVxdWlyZXMgdGhhdCB3ZSBjaGVjayBgZXhwMWAgKGFuZCBzdGF0aWMgdmFsdWVzKSBhbmQgdXNlIHRoYXQgYXMgbmV3IHZhbHVlLlxuICpcbiAqIE5PVEU6IFRoZSBzdHlsaW5nIHN0b3JlcyB0d28gdmFsdWVzLlxuICogMS4gVGhlIHJhdyB2YWx1ZSB3aGljaCBjYW1lIGZyb20gdGhlIGFwcGxpY2F0aW9uIGlzIHN0b3JlZCBhdCBgaW5kZXggKyAwYCBsb2NhdGlvbi4gKFRoaXMgdmFsdWVcbiAqICAgIGlzIHVzZWQgZm9yIGRpcnR5IGNoZWNraW5nKS5cbiAqIDIuIFRoZSBub3JtYWxpemVkIHZhbHVlIGlzIHN0b3JlZCBhdCBgaW5kZXggKyAxYC5cbiAqXG4gKiBAcGFyYW0gdERhdGEgYFREYXRhYCB1c2VkIGZvciB0cmF2ZXJzaW5nIHRoZSBwcmlvcml0eS5cbiAqIEBwYXJhbSB0Tm9kZSBgVE5vZGVgIHRvIHVzZSBmb3IgcmVzb2x2aW5nIHN0YXRpYyBzdHlsaW5nLiBBbHNvIGNvbnRyb2xzIHNlYXJjaCBkaXJlY3Rpb24uXG4gKiAgIC0gYFROb2RlYCBzZWFyY2ggbmV4dCBhbmQgcXVpdCBhcyBzb29uIGFzIGBpc1N0eWxpbmdWYWx1ZVByZXNlbnQodmFsdWUpYCBpcyB0cnVlLlxuICogICAgICBJZiBubyB2YWx1ZSBmb3VuZCBjb25zdWx0IGB0Tm9kZS5yZXNpZHVhbFN0eWxlYC9gdE5vZGUucmVzaWR1YWxDbGFzc2AgZm9yIGRlZmF1bHQgdmFsdWUuXG4gKiAgIC0gYG51bGxgIHNlYXJjaCBwcmV2IGFuZCBnbyBhbGwgdGhlIHdheSB0byBlbmQuIFJldHVybiBsYXN0IHZhbHVlIHdoZXJlXG4gKiAgICAgYGlzU3R5bGluZ1ZhbHVlUHJlc2VudCh2YWx1ZSlgIGlzIHRydWUuXG4gKiBAcGFyYW0gbFZpZXcgYExWaWV3YCB1c2VkIGZvciByZXRyaWV2aW5nIHRoZSBhY3R1YWwgdmFsdWVzLlxuICogQHBhcmFtIHByb3AgUHJvcGVydHkgd2hpY2ggd2UgYXJlIGludGVyZXN0ZWQgaW4uXG4gKiBAcGFyYW0gaW5kZXggU3RhcnRpbmcgaW5kZXggaW4gdGhlIGxpbmtlZCBsaXN0IG9mIHN0eWxpbmcgYmluZGluZ3Mgd2hlcmUgdGhlIHNlYXJjaCBzaG91bGQgc3RhcnQuXG4gKiBAcGFyYW0gaXNDbGFzc0Jhc2VkIGB0cnVlYCBpZiBgY2xhc3NgIChgZmFsc2VgIGlmIGBzdHlsZWApXG4gKi9cbmZ1bmN0aW9uIGZpbmRTdHlsaW5nVmFsdWUoXG4gICAgdERhdGE6IFREYXRhLCB0Tm9kZTogVE5vZGV8bnVsbCwgbFZpZXc6IExWaWV3LCBwcm9wOiBzdHJpbmcsIGluZGV4OiBudW1iZXIsXG4gICAgaXNDbGFzc0Jhc2VkOiBib29sZWFuKTogYW55IHtcbiAgLy8gYFROb2RlYCB0byB1c2UgZm9yIHJlc29sdmluZyBzdGF0aWMgc3R5bGluZy4gQWxzbyBjb250cm9scyBzZWFyY2ggZGlyZWN0aW9uLlxuICAvLyAgIC0gYFROb2RlYCBzZWFyY2ggbmV4dCBhbmQgcXVpdCBhcyBzb29uIGFzIGBpc1N0eWxpbmdWYWx1ZVByZXNlbnQodmFsdWUpYCBpcyB0cnVlLlxuICAvLyAgICAgIElmIG5vIHZhbHVlIGZvdW5kIGNvbnN1bHQgYHROb2RlLnJlc2lkdWFsU3R5bGVgL2B0Tm9kZS5yZXNpZHVhbENsYXNzYCBmb3IgZGVmYXVsdCB2YWx1ZS5cbiAgLy8gICAtIGBudWxsYCBzZWFyY2ggcHJldiBhbmQgZ28gYWxsIHRoZSB3YXkgdG8gZW5kLiBSZXR1cm4gbGFzdCB2YWx1ZSB3aGVyZVxuICAvLyAgICAgYGlzU3R5bGluZ1ZhbHVlUHJlc2VudCh2YWx1ZSlgIGlzIHRydWUuXG4gIGNvbnN0IGlzUHJldkRpcmVjdGlvbiA9IHROb2RlID09PSBudWxsO1xuICBsZXQgdmFsdWU6IGFueSA9IHVuZGVmaW5lZDtcbiAgd2hpbGUgKGluZGV4ID4gMCkge1xuICAgIGNvbnN0IHJhd0tleSA9IHREYXRhW2luZGV4XSBhcyBUU3R5bGluZ0tleTtcbiAgICBjb25zdCBjb250YWluc1N0YXRpY3MgPSBBcnJheS5pc0FycmF5KHJhd0tleSk7XG4gICAgLy8gVW53cmFwIHRoZSBrZXkgaWYgd2UgY29udGFpbiBzdGF0aWMgdmFsdWVzLlxuICAgIGNvbnN0IGtleSA9IGNvbnRhaW5zU3RhdGljcyA/IChyYXdLZXkgYXMgc3RyaW5nW10pWzFdIDogcmF3S2V5O1xuICAgIGNvbnN0IGlzU3R5bGluZ01hcCA9IGtleSA9PT0gbnVsbDtcbiAgICBsZXQgdmFsdWVBdExWaWV3SW5kZXggPSBsVmlld1tpbmRleCArIDFdO1xuICAgIGlmICh2YWx1ZUF0TFZpZXdJbmRleCA9PT0gTk9fQ0hBTkdFKSB7XG4gICAgICAvLyBJbiBmaXJzdFVwZGF0ZVBhc3MgdGhlIHN0eWxpbmcgaW5zdHJ1Y3Rpb25zIGNyZWF0ZSBhIGxpbmtlZCBsaXN0IG9mIHN0eWxpbmcuXG4gICAgICAvLyBPbiBzdWJzZXF1ZW50IHBhc3NlcyBpdCBpcyBwb3NzaWJsZSBmb3IgYSBzdHlsaW5nIGluc3RydWN0aW9uIHRvIHRyeSB0byByZWFkIGEgYmluZGluZ1xuICAgICAgLy8gd2hpY2hcbiAgICAgIC8vIGhhcyBub3QgeWV0IGV4ZWN1dGVkLiBJbiB0aGF0IGNhc2Ugd2Ugd2lsbCBmaW5kIGBOT19DSEFOR0VgIGFuZCB3ZSBzaG91bGQgYXNzdW1lIHRoYXRcbiAgICAgIC8vIHdlIGhhdmUgYHVuZGVmaW5lZGAgKG9yIGVtcHR5IGFycmF5IGluIGNhc2Ugb2Ygc3R5bGluZy1tYXAgaW5zdHJ1Y3Rpb24pIGluc3RlYWQuIFRoaXNcbiAgICAgIC8vIGFsbG93cyB0aGUgcmVzb2x1dGlvbiB0byBhcHBseSB0aGUgdmFsdWUgKHdoaWNoIG1heSBsYXRlciBiZSBvdmVyd3JpdHRlbiB3aGVuIHRoZVxuICAgICAgLy8gYmluZGluZyBhY3R1YWxseSBleGVjdXRlcy4pXG4gICAgICB2YWx1ZUF0TFZpZXdJbmRleCA9IGlzU3R5bGluZ01hcCA/IEVNUFRZX0FSUkFZIDogdW5kZWZpbmVkO1xuICAgIH1cbiAgICBsZXQgY3VycmVudFZhbHVlID0gaXNTdHlsaW5nTWFwID8ga2V5VmFsdWVBcnJheUdldCh2YWx1ZUF0TFZpZXdJbmRleCwgcHJvcCkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoa2V5ID09PSBwcm9wID8gdmFsdWVBdExWaWV3SW5kZXggOiB1bmRlZmluZWQpO1xuICAgIGlmIChjb250YWluc1N0YXRpY3MgJiYgIWlzU3R5bGluZ1ZhbHVlUHJlc2VudChjdXJyZW50VmFsdWUpKSB7XG4gICAgICBjdXJyZW50VmFsdWUgPSBrZXlWYWx1ZUFycmF5R2V0KHJhd0tleSBhcyBLZXlWYWx1ZUFycmF5PGFueT4sIHByb3ApO1xuICAgIH1cbiAgICBpZiAoaXNTdHlsaW5nVmFsdWVQcmVzZW50KGN1cnJlbnRWYWx1ZSkpIHtcbiAgICAgIHZhbHVlID0gY3VycmVudFZhbHVlO1xuICAgICAgaWYgKGlzUHJldkRpcmVjdGlvbikge1xuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICB9XG4gICAgfVxuICAgIGNvbnN0IHRSYW5nZSA9IHREYXRhW2luZGV4ICsgMV0gYXMgVFN0eWxpbmdSYW5nZTtcbiAgICBpbmRleCA9IGlzUHJldkRpcmVjdGlvbiA/IGdldFRTdHlsaW5nUmFuZ2VQcmV2KHRSYW5nZSkgOiBnZXRUU3R5bGluZ1JhbmdlTmV4dCh0UmFuZ2UpO1xuICB9XG4gIGlmICh0Tm9kZSAhPT0gbnVsbCkge1xuICAgIC8vIGluIGNhc2Ugd2hlcmUgd2UgYXJlIGdvaW5nIGluIG5leHQgZGlyZWN0aW9uIEFORCB3ZSBkaWQgbm90IGZpbmQgYW55dGhpbmcsIHdlIG5lZWQgdG9cbiAgICAvLyBjb25zdWx0IHJlc2lkdWFsIHN0eWxpbmdcbiAgICBsZXQgcmVzaWR1YWwgPSBpc0NsYXNzQmFzZWQgPyB0Tm9kZS5yZXNpZHVhbENsYXNzZXMgOiB0Tm9kZS5yZXNpZHVhbFN0eWxlcztcbiAgICBpZiAocmVzaWR1YWwgIT0gbnVsbCAvKiogT1IgcmVzaWR1YWwgIT09PSB1bmRlZmluZWQgKi8pIHtcbiAgICAgIHZhbHVlID0ga2V5VmFsdWVBcnJheUdldChyZXNpZHVhbCEsIHByb3ApO1xuICAgIH1cbiAgfVxuICByZXR1cm4gdmFsdWU7XG59XG5cbi8qKlxuICogRGV0ZXJtaW5lcyBpZiB0aGUgYmluZGluZyB2YWx1ZSBzaG91bGQgYmUgdXNlZCAob3IgaWYgdGhlIHZhbHVlIGlzICd1bmRlZmluZWQnIGFuZCBoZW5jZSBwcmlvcml0eVxuICogcmVzb2x1dGlvbiBzaG91bGQgYmUgdXNlZC4pXG4gKlxuICogQHBhcmFtIHZhbHVlIEJpbmRpbmcgc3R5bGUgdmFsdWUuXG4gKi9cbmZ1bmN0aW9uIGlzU3R5bGluZ1ZhbHVlUHJlc2VudCh2YWx1ZTogYW55KTogYm9vbGVhbiB7XG4gIC8vIEN1cnJlbnRseSBvbmx5IGB1bmRlZmluZWRgIHZhbHVlIGlzIGNvbnNpZGVyZWQgbm9uLWJpbmRpbmcuIFRoYXQgaXMgYHVuZGVmaW5lZGAgc2F5cyBJIGRvbid0XG4gIC8vIGhhdmUgYW4gb3BpbmlvbiBhcyB0byB3aGF0IHRoaXMgYmluZGluZyBzaG91bGQgYmUgYW5kIHlvdSBzaG91bGQgY29uc3VsdCBvdGhlciBiaW5kaW5ncyBieVxuICAvLyBwcmlvcml0eSB0byBkZXRlcm1pbmUgdGhlIHZhbGlkIHZhbHVlLlxuICAvLyBUaGlzIGlzIGV4dHJhY3RlZCBpbnRvIGEgc2luZ2xlIGZ1bmN0aW9uIHNvIHRoYXQgd2UgaGF2ZSBhIHNpbmdsZSBwbGFjZSB0byBjb250cm9sIHRoaXMuXG4gIHJldHVybiB2YWx1ZSAhPT0gdW5kZWZpbmVkO1xufVxuXG4vKipcbiAqIE5vcm1hbGl6ZXMgYW5kL29yIGFkZHMgYSBzdWZmaXggdG8gdGhlIHZhbHVlLlxuICpcbiAqIElmIHZhbHVlIGlzIGBudWxsYC9gdW5kZWZpbmVkYCBubyBzdWZmaXggaXMgYWRkZWRcbiAqIEBwYXJhbSB2YWx1ZVxuICogQHBhcmFtIHN1ZmZpeFxuICovXG5mdW5jdGlvbiBub3JtYWxpemVTdWZmaXgodmFsdWU6IGFueSwgc3VmZml4OiBzdHJpbmd8dW5kZWZpbmVkfG51bGwpOiBzdHJpbmd8bnVsbHx1bmRlZmluZWR8Ym9vbGVhbiB7XG4gIGlmICh2YWx1ZSA9PSBudWxsIHx8IHZhbHVlID09PSAnJykge1xuICAgIC8vIGRvIG5vdGhpbmdcbiAgICAvLyBEbyBub3QgYWRkIHRoZSBzdWZmaXggaWYgdGhlIHZhbHVlIGlzIGdvaW5nIHRvIGJlIGVtcHR5LlxuICAgIC8vIEFzIGl0IHByb2R1Y2UgaW52YWxpZCBDU1MsIHdoaWNoIHRoZSBicm93c2VycyB3aWxsIGF1dG9tYXRpY2FsbHkgb21pdCBidXQgRG9taW5vIHdpbGwgbm90LlxuICAgIC8vIEV4YW1wbGU6IGBcImxlZnRcIjogXCJweDtcImAgaW5zdGVhZCBvZiBgXCJsZWZ0XCI6IFwiXCJgLlxuICB9IGVsc2UgaWYgKHR5cGVvZiBzdWZmaXggPT09ICdzdHJpbmcnKSB7XG4gICAgdmFsdWUgPSB2YWx1ZSArIHN1ZmZpeDtcbiAgfSBlbHNlIGlmICh0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnKSB7XG4gICAgdmFsdWUgPSBzdHJpbmdpZnkodW53cmFwU2FmZVZhbHVlKHZhbHVlKSk7XG4gIH1cbiAgcmV0dXJuIHZhbHVlO1xufVxuXG5cbi8qKlxuICogVGVzdHMgaWYgdGhlIGBUTm9kZWAgaGFzIGlucHV0IHNoYWRvdy5cbiAqXG4gKiBBbiBpbnB1dCBzaGFkb3cgaXMgd2hlbiBhIGRpcmVjdGl2ZSBzdGVhbHMgKHNoYWRvd3MpIHRoZSBpbnB1dCBieSB1c2luZyBgQElucHV0KCdzdHlsZScpYCBvclxuICogYEBJbnB1dCgnY2xhc3MnKWAgYXMgaW5wdXQuXG4gKlxuICogQHBhcmFtIHROb2RlIGBUTm9kZWAgd2hpY2ggd2Ugd291bGQgbGlrZSB0byBzZWUgaWYgaXQgaGFzIHNoYWRvdy5cbiAqIEBwYXJhbSBpc0NsYXNzQmFzZWQgYHRydWVgIGlmIGBjbGFzc2AgKGBmYWxzZWAgaWYgYHN0eWxlYClcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGhhc1N0eWxpbmdJbnB1dFNoYWRvdyh0Tm9kZTogVE5vZGUsIGlzQ2xhc3NCYXNlZDogYm9vbGVhbikge1xuICByZXR1cm4gKHROb2RlLmZsYWdzICYgKGlzQ2xhc3NCYXNlZCA/IFROb2RlRmxhZ3MuaGFzQ2xhc3NJbnB1dCA6IFROb2RlRmxhZ3MuaGFzU3R5bGVJbnB1dCkpICE9PSAwO1xufVxuIl19