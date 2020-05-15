/**
 * @fileoverview added by tsickle
 * Generated from: packages/core/src/render3/instructions/styling.ts
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
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
import { HEADER_OFFSET, RENDERER } from '../interfaces/view';
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
 * \@codeGenApi
 * @param {?} prop A valid CSS property.
 * @param {?} value New value to write (`null` or an empty string to remove).
 * @param {?=} suffix Optional suffix. Used with scalar values to add unit such as `px`.
 *
 * Note that this will apply the provided style value to the host element if this function is called
 * within a host binding function.
 *
 * @return {?}
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
 * \@codeGenApi
 * @param {?} className
 * @param {?} value A true/false value which will turn the class on or off.
 *
 * Note that this will apply the provided class value to the host element if this function
 * is called within a host binding function.
 *
 * @return {?}
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
 * \@codeGenApi
 * @param {?} styles A key/value style map of the styles that will be applied to the given element.
 *        Any missing styles (that have already been applied to the element beforehand) will be
 *        removed (unset) from the element's styling.
 *
 * Note that this will apply the provided styleMap value to the host element if this function
 * is called within a host binding.
 *
 * @return {?}
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
 * @param {?} keyValueArray KeyValueArray to add parsed values to.
 * @param {?} text text to parse.
 * @return {?}
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
 * \@codeGenApi
 * @param {?} classes A key/value map or string of CSS classes that will be added to the
 *        given element. Any missing classes (that have already been applied to the element
 *        beforehand) will be removed (unset) from the element's list of CSS classes.
 *
 * @return {?}
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
 * @param {?} keyValueArray KeyValueArray to add parsed values to.
 * @param {?} text text to parse.
 * @return {?}
 */
export function classStringParser(keyValueArray, text) {
    for (let i = parseClassName(text); i >= 0; i = parseClassNameNext(text, i)) {
        keyValueArraySet(keyValueArray, getLastParsedKey(text), true);
    }
}
/**
 * Common code between `ɵɵclassProp` and `ɵɵstyleProp`.
 *
 * @param {?} prop property name.
 * @param {?} value binding value.
 * @param {?} suffix suffix for the property (e.g. `em` or `px`)
 * @param {?} isClassBased `true` if `class` change (`false` if `style`)
 * @return {?}
 */
export function checkStylingProperty(prop, value, suffix, isClassBased) {
    /** @type {?} */
    const lView = getLView();
    /** @type {?} */
    const tView = getTView();
    // Styling instructions use 2 slots per binding.
    // 1. one for the value / TStylingKey
    // 2. one for the intermittent-value / TStylingRange
    /** @type {?} */
    const bindingIndex = incrementBindingIndex(2);
    if (tView.firstUpdatePass) {
        stylingFirstUpdatePass(tView, prop, bindingIndex, isClassBased);
    }
    if (value !== NO_CHANGE && bindingUpdated(lView, bindingIndex, value)) {
        /** @type {?} */
        const tNode = (/** @type {?} */ (tView.data[getSelectedIndex() + HEADER_OFFSET]));
        updateStyling(tView, tNode, lView, lView[RENDERER], prop, lView[bindingIndex + 1] = normalizeSuffix(value, suffix), isClassBased, bindingIndex);
    }
}
/**
 * Common code between `ɵɵclassMap` and `ɵɵstyleMap`.
 *
 * @param {?} keyValueArraySet (See `keyValueArraySet` in "util/array_utils") Gets passed in as a
 *        function so that `style` can be processed. This is done for tree shaking purposes.
 * @param {?} stringParser Parser used to parse `value` if `string`. (Passed in as `style` and `class`
 *        have different parsers.)
 * @param {?} value bound value from application
 * @param {?} isClassBased `true` if `class` change (`false` if `style`)
 * @return {?}
 */
export function checkStylingMap(keyValueArraySet, stringParser, value, isClassBased) {
    /** @type {?} */
    const tView = getTView();
    /** @type {?} */
    const bindingIndex = incrementBindingIndex(2);
    if (tView.firstUpdatePass) {
        stylingFirstUpdatePass(tView, null, bindingIndex, isClassBased);
    }
    /** @type {?} */
    const lView = getLView();
    if (value !== NO_CHANGE && bindingUpdated(lView, bindingIndex, value)) {
        // `getSelectedIndex()` should be here (rather than in instruction) so that it is guarded by the
        // if so as not to read unnecessarily.
        /** @type {?} */
        const tNode = (/** @type {?} */ (tView.data[getSelectedIndex() + HEADER_OFFSET]));
        if (hasStylingInputShadow(tNode, isClassBased) && !isInHostBindings(tView, bindingIndex)) {
            if (ngDevMode) {
                // verify that if we are shadowing then `TData` is appropriately marked so that we skip
                // processing this binding in styling resolution.
                /** @type {?} */
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
            /** @type {?} */
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
 * @param {?} tView Current `TView`
 * @param {?} bindingIndex index of binding which we would like if it is in `hostBindings`
 * @return {?}
 */
function isInHostBindings(tView, bindingIndex) {
    // All host bindings are placed after the expando section.
    return bindingIndex >= tView.expandoStartIndex;
}
/**
 * Collects the necessary information to insert the binding into a linked list of style bindings
 * using `insertTStylingBinding`.
 *
 * @param {?} tView `TView` where the binding linked list will be stored.
 * @param {?} tStylingKey Property/key of the binding.
 * @param {?} bindingIndex Index of binding associated with the `prop`
 * @param {?} isClassBased `true` if `class` change (`false` if `style`)
 * @return {?}
 */
function stylingFirstUpdatePass(tView, tStylingKey, bindingIndex, isClassBased) {
    ngDevMode && assertFirstUpdatePass(tView);
    /** @type {?} */
    const tData = tView.data;
    if (tData[bindingIndex + 1] === null) {
        // The above check is necessary because we don't clear first update pass until first successful
        // (no exception) template execution. This prevents the styling instruction from double adding
        // itself to the list.
        // `getSelectedIndex()` should be here (rather than in instruction) so that it is guarded by the
        // if so as not to read unnecessarily.
        /** @type {?} */
        const tNode = (/** @type {?} */ (tData[getSelectedIndex() + HEADER_OFFSET]));
        /** @type {?} */
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
 * @param {?} tData `TData` where the linked list is stored.
 * @param {?} tNode `TNode` for which the styling is being computed.
 * @param {?} stylingKey `TStylingKeyPrimitive` which may need to be wrapped into `TStylingKey`
 * @param {?} isClassBased `true` if `class` (`false` if `style`)
 * @return {?}
 */
export function wrapInStaticStylingKey(tData, tNode, stylingKey, isClassBased) {
    /** @type {?} */
    const hostDirectiveDef = getCurrentDirectiveDef(tData);
    /** @type {?} */
    let residual = isClassBased ? tNode.residualClasses : tNode.residualStyles;
    if (hostDirectiveDef === null) {
        // We are in template node.
        // If template node already had styling instruction then it has already collected the static
        // styling and there is no need to collect them again. We know that we are the first styling
        // instruction because the `TNode.*Bindings` points to 0 (nothing has been inserted yet).
        /** @type {?} */
        const isFirstStylingInstructionInTemplate = (/** @type {?} */ ((/** @type {?} */ ((isClassBased ? tNode.classBindings : tNode.styleBindings))))) === 0;
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
        /** @type {?} */
        const directiveStylingLast = tNode.directiveStylingLast;
        /** @type {?} */
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
                /** @type {?} */
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
 * @param {?} tData `TData` where the linked list is stored.
 * @param {?} tNode `TNode` for which the styling is being computed.
 * @param {?} isClassBased `true` if `class` (`false` if `style`)
 * @return {?} `TStylingKey` if found or `undefined` if not found.
 */
function getTemplateHeadTStylingKey(tData, tNode, isClassBased) {
    /** @type {?} */
    const bindings = isClassBased ? tNode.classBindings : tNode.styleBindings;
    if (getTStylingRangeNext(bindings) === 0) {
        // There does not seem to be a styling instruction in the `template`.
        return undefined;
    }
    return (/** @type {?} */ (tData[getTStylingRangePrev(bindings)]));
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
 * \@Directive({
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
 * @param {?} tData `TData` where the linked list is stored.
 * @param {?} tNode `TNode` for which the styling is being computed.
 * @param {?} isClassBased `true` if `class` (`false` if `style`)
 * @param {?} tStylingKey New `TStylingKey` which is replacing the old one.
 * @return {?}
 */
function setTemplateHeadTStylingKey(tData, tNode, isClassBased, tStylingKey) {
    /** @type {?} */
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
 * @param {?} tData `TData` where the `DirectiveDefs` are stored.
 * @param {?} tNode `TNode` which contains the directive range.
 * @param {?} isClassBased `true` if `class` (`false` if `style`)
 * @return {?}
 */
function collectResidual(tData, tNode, isClassBased) {
    /** @type {?} */
    let residual = undefined;
    /** @type {?} */
    const directiveEnd = tNode.directiveEnd;
    ngDevMode &&
        assertNotEqual(tNode.directiveStylingLast, -1, 'By the time this function gets called at least one hostBindings-node styling instruction must have executed.');
    // We add `1 + tNode.directiveStart` because we need to skip the current directive (as we are
    // collecting things after the last `hostBindings` directive which had a styling instruction.)
    for (let i = 1 + tNode.directiveStylingLast; i < directiveEnd; i++) {
        /** @type {?} */
        const attrs = ((/** @type {?} */ (tData[i]))).hostAttrs;
        residual = (/** @type {?} */ (collectStylingFromTAttrs(residual, attrs, isClassBased)));
    }
    return (/** @type {?} */ (collectStylingFromTAttrs(residual, tNode.attrs, isClassBased)));
}
/**
 * Collect the static styling information with lower priority than `hostDirectiveDef`.
 *
 * (This is opposite of residual styling.)
 *
 * @param {?} hostDirectiveDef `DirectiveDef` for which we want to collect lower priority static
 *        styling. (Or `null` if template styling)
 * @param {?} tData `TData` where the linked list is stored.
 * @param {?} tNode `TNode` for which the styling is being computed.
 * @param {?} stylingKey Existing `TStylingKey` to update or wrap.
 * @param {?} isClassBased `true` if `class` (`false` if `style`)
 * @return {?}
 */
function collectStylingFromDirectives(hostDirectiveDef, tData, tNode, stylingKey, isClassBased) {
    // We need to loop because there can be directives which have `hostAttrs` but don't have
    // `hostBindings` so this loop catches up to the current directive..
    /** @type {?} */
    let currentDirective = null;
    /** @type {?} */
    const directiveEnd = tNode.directiveEnd;
    /** @type {?} */
    let directiveStylingLast = tNode.directiveStylingLast;
    if (directiveStylingLast === -1) {
        directiveStylingLast = tNode.directiveStart;
    }
    else {
        directiveStylingLast++;
    }
    while (directiveStylingLast < directiveEnd) {
        currentDirective = (/** @type {?} */ (tData[directiveStylingLast]));
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
 * @param {?} stylingKey existing `TStylingKey` to update or wrap.
 * @param {?} attrs `TAttributes` to process.
 * @param {?} isClassBased `true` if `class` (`false` if `style`)
 * @return {?}
 */
function collectStylingFromTAttrs(stylingKey, attrs, isClassBased) {
    /** @type {?} */
    const desiredMarker = isClassBased ? 1 /* Classes */ : 2 /* Styles */;
    /** @type {?} */
    let currentMarker = -1 /* ImplicitAttributes */;
    if (attrs !== null) {
        for (let i = 0; i < attrs.length; i++) {
            /** @type {?} */
            const item = (/** @type {?} */ (attrs[i]));
            if (typeof item === 'number') {
                currentMarker = item;
            }
            else {
                if (currentMarker === desiredMarker) {
                    if (!Array.isArray(stylingKey)) {
                        stylingKey = stylingKey === undefined ? [] : (/** @type {?} */ (['', stylingKey]));
                    }
                    keyValueArraySet((/** @type {?} */ (stylingKey)), item, isClassBased ? true : attrs[++i]);
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
 * @param {?} keyValueArraySet (See `keyValueArraySet` in "util/array_utils") Gets passed in as a
 *        function so that `style` can be processed. This is done
 *        for tree shaking purposes.
 * @param {?} stringParser The parser is passed in so that it will be tree shakable. See
 *        `styleStringParser` and `classStringParser`
 * @param {?} value The value to parse/convert to `KeyValueArray`
 * @return {?}
 */
export function toStylingKeyValueArray(keyValueArraySet, stringParser, value) {
    if (value == null /*|| value === undefined */ || value === '')
        return (/** @type {?} */ (EMPTY_ARRAY));
    /** @type {?} */
    const styleKeyValueArray = (/** @type {?} */ ([]));
    /** @type {?} */
    const unwrappedValue = (/** @type {?} */ (unwrapSafeValue(value)));
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
 * @param {?} keyValueArray KeyValueArray to add to.
 * @param {?} key Style key to add.
 * @param {?} value The value to set.
 * @return {?}
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
 * @param {?} tView Associated `TView.data` contains the linked list of binding priorities.
 * @param {?} tNode `TNode` where the binding is located.
 * @param {?} lView `LView` contains the values associated with other styling binding at this `TNode`.
 * @param {?} renderer Renderer to use if any updates.
 * @param {?} oldKeyValueArray Previous value represented as `KeyValueArray`
 * @param {?} newKeyValueArray Current value represented as `KeyValueArray`
 * @param {?} isClassBased `true` if `class` (`false` if `style`)
 * @param {?} bindingIndex Binding index of the binding.
 * @return {?}
 */
function updateStylingMap(tView, tNode, lView, renderer, oldKeyValueArray, newKeyValueArray, isClassBased, bindingIndex) {
    if ((/** @type {?} */ (oldKeyValueArray)) === NO_CHANGE) {
        // On first execution the oldKeyValueArray is NO_CHANGE => treat it as empty KeyValueArray.
        oldKeyValueArray = (/** @type {?} */ (EMPTY_ARRAY));
    }
    /** @type {?} */
    let oldIndex = 0;
    /** @type {?} */
    let newIndex = 0;
    /** @type {?} */
    let oldKey = 0 < oldKeyValueArray.length ? oldKeyValueArray[0] : null;
    /** @type {?} */
    let newKey = 0 < newKeyValueArray.length ? newKeyValueArray[0] : null;
    while (oldKey !== null || newKey !== null) {
        ngDevMode && assertLessThan(oldIndex, 999, 'Are we stuck in infinite loop?');
        ngDevMode && assertLessThan(newIndex, 999, 'Are we stuck in infinite loop?');
        /** @type {?} */
        const oldValue = oldIndex < oldKeyValueArray.length ? oldKeyValueArray[oldIndex + 1] : undefined;
        /** @type {?} */
        const newValue = newIndex < newKeyValueArray.length ? newKeyValueArray[newIndex + 1] : undefined;
        /** @type {?} */
        let setKey = null;
        /** @type {?} */
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
        else if (newKey === null || oldKey !== null && oldKey < (/** @type {?} */ (newKey))) {
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
 * @param {?} tView Associated `TView.data` contains the linked list of binding priorities.
 * @param {?} tNode `TNode` where the binding is located.
 * @param {?} lView `LView` contains the values associated with other styling binding at this `TNode`.
 * @param {?} renderer Renderer to use if any updates.
 * @param {?} prop Either style property name or a class name.
 * @param {?} value Either style value for `prop` or `true`/`false` if `prop` is class.
 * @param {?} isClassBased `true` if `class` (`false` if `style`)
 * @param {?} bindingIndex Binding index of the binding.
 * @return {?}
 */
function updateStyling(tView, tNode, lView, renderer, prop, value, isClassBased, bindingIndex) {
    if (tNode.type !== 3 /* Element */) {
        // It is possible to have styling on non-elements (such as ng-container).
        // This is rare, but it does happen. In such a case, just ignore the binding.
        return;
    }
    /** @type {?} */
    const tData = tView.data;
    /** @type {?} */
    const tRange = (/** @type {?} */ (tData[bindingIndex + 1]));
    /** @type {?} */
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
        /** @type {?} */
        const rNode = (/** @type {?} */ (getNativeByIndex(getSelectedIndex(), lView)));
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
 * @param {?} tData `TData` used for traversing the priority.
 * @param {?} tNode `TNode` to use for resolving static styling. Also controls search direction.
 *   - `TNode` search next and quit as soon as `isStylingValuePresent(value)` is true.
 *      If no value found consult `tNode.residualStyle`/`tNode.residualClass` for default value.
 *   - `null` search prev and go all the way to end. Return last value where
 *     `isStylingValuePresent(value)` is true.
 * @param {?} lView `LView` used for retrieving the actual values.
 * @param {?} prop Property which we are interested in.
 * @param {?} index Starting index in the linked list of styling bindings where the search should start.
 * @param {?} isClassBased `true` if `class` (`false` if `style`)
 * @return {?}
 */
function findStylingValue(tData, tNode, lView, prop, index, isClassBased) {
    // `TNode` to use for resolving static styling. Also controls search direction.
    //   - `TNode` search next and quit as soon as `isStylingValuePresent(value)` is true.
    //      If no value found consult `tNode.residualStyle`/`tNode.residualClass` for default value.
    //   - `null` search prev and go all the way to end. Return last value where
    //     `isStylingValuePresent(value)` is true.
    /** @type {?} */
    const isPrevDirection = tNode === null;
    /** @type {?} */
    let value = undefined;
    while (index > 0) {
        /** @type {?} */
        const rawKey = (/** @type {?} */ (tData[index]));
        /** @type {?} */
        const containsStatics = Array.isArray(rawKey);
        // Unwrap the key if we contain static values.
        /** @type {?} */
        const key = containsStatics ? ((/** @type {?} */ (rawKey)))[1] : rawKey;
        /** @type {?} */
        const isStylingMap = key === null;
        /** @type {?} */
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
        /** @type {?} */
        let currentValue = isStylingMap ? keyValueArrayGet(valueAtLViewIndex, prop) :
            key === prop ? valueAtLViewIndex : undefined;
        if (containsStatics && !isStylingValuePresent(currentValue)) {
            currentValue = keyValueArrayGet((/** @type {?} */ (rawKey)), prop);
        }
        if (isStylingValuePresent(currentValue)) {
            value = currentValue;
            if (isPrevDirection) {
                return value;
            }
        }
        /** @type {?} */
        const tRange = (/** @type {?} */ (tData[index + 1]));
        index = isPrevDirection ? getTStylingRangePrev(tRange) : getTStylingRangeNext(tRange);
    }
    if (tNode !== null) {
        // in case where we are going in next direction AND we did not find anything, we need to
        // consult residual styling
        /** @type {?} */
        let residual = isClassBased ? tNode.residualClasses : tNode.residualStyles;
        if (residual != null /** OR residual !=== undefined */) {
            value = keyValueArrayGet((/** @type {?} */ (residual)), prop);
        }
    }
    return value;
}
/**
 * Determines if the binding value should be used (or if the value is 'undefined' and hence priority
 * resolution should be used.)
 *
 * @param {?} value Binding style value.
 * @return {?}
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
 * @param {?} value
 * @param {?} suffix
 * @return {?}
 */
function normalizeSuffix(value, suffix) {
    if (value == null /** || value === undefined */) {
        // do nothing
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
 * An input shadow is when a directive steals (shadows) the input by using `\@Input('style')` or
 * `\@Input('class')` as input.
 *
 * @param {?} tNode `TNode` which we would like to see if it has shadow.
 * @param {?} isClassBased `true` if `class` (`false` if `style`)
 * @return {?}
 */
export function hasStylingInputShadow(tNode, isClassBased) {
    return (tNode.flags & (isClassBased ? 16 /* hasClassInput */ : 32 /* hasStyleInput */)) !== 0;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3R5bGluZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaW5zdHJ1Y3Rpb25zL3N0eWxpbmcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUFZLGVBQWUsRUFBQyxNQUFNLDJCQUEyQixDQUFDO0FBQ3JFLE9BQU8sRUFBZ0IsZ0JBQWdCLEVBQUUsZ0JBQWdCLEVBQUMsTUFBTSx3QkFBd0IsQ0FBQztBQUN6RixPQUFPLEVBQUMsYUFBYSxFQUFFLFdBQVcsRUFBRSxjQUFjLEVBQUUsY0FBYyxFQUFFLFVBQVUsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQ3pHLE9BQU8sRUFBQyxXQUFXLEVBQUMsTUFBTSxrQkFBa0IsQ0FBQztBQUM3QyxPQUFPLEVBQUMsc0JBQXNCLEVBQUUsU0FBUyxFQUFDLE1BQU0sc0JBQXNCLENBQUM7QUFDdkUsT0FBTyxFQUFDLHFCQUFxQixFQUFDLE1BQU0sV0FBVyxDQUFDO0FBQ2hELE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxhQUFhLENBQUM7QUFJM0MsT0FBTyxFQUFDLG9CQUFvQixFQUFFLDZCQUE2QixFQUFFLG9CQUFvQixFQUFFLDZCQUE2QixFQUE2QixNQUFNLHVCQUF1QixDQUFDO0FBQzNLLE9BQU8sRUFBQyxhQUFhLEVBQVMsUUFBUSxFQUFlLE1BQU0sb0JBQW9CLENBQUM7QUFDaEYsT0FBTyxFQUFDLFlBQVksRUFBQyxNQUFNLHNCQUFzQixDQUFDO0FBQ2xELE9BQU8sRUFBQyxzQkFBc0IsRUFBRSxRQUFRLEVBQUUsZ0JBQWdCLEVBQUUsUUFBUSxFQUFFLHFCQUFxQixFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQzdHLE9BQU8sRUFBQyxxQkFBcUIsRUFBQyxNQUFNLCtCQUErQixDQUFDO0FBQ3BFLE9BQU8sRUFBQyxnQkFBZ0IsRUFBRSxrQkFBa0IsRUFBRSxjQUFjLEVBQUUsa0JB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QUFFOzs7O1lBR2QsUUFBUSxHQUFHLFlBQVksQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLGNBQWM7UUFDMUUsSUFBSSxRQUFRLElBQUksSUFBSSxDQUFDLGlDQUFpQyxFQUFFO1lBQ3RELEtBQUssR0FBRyxnQkFBZ0IsQ0FBQyxtQkFBQSxRQUFRLEVBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztTQUMzQztLQUNGO0lBQ0QsT0FBTyxLQUFLLENBQUM7QUFDZixDQUFDOzs7Ozs7OztBQVFELFNBQVMscUJBQXFCLENBQUMsS0FBVTtJQUN2QywrRkFBK0Y7SUFDL0YsNkZBQTZGO0lBQzdGLHlDQUF5QztJQUN6QywyRkFBMkY7SUFDM0YsT0FBTyxLQUFLLEtBQUssU0FBUyxDQUFDO0FBQzdCLENBQUM7Ozs7Ozs7OztBQVNELFNBQVMsZUFBZSxDQUFDLEtBQVUsRUFBRSxNQUE2QjtJQUNoRSxJQUFJLEtBQUssSUFBSSxJQUFJLENBQUMsNkJBQTZCLEVBQUU7UUFDL0MsYUFBYTtLQUNkO1NBQU0sSUFBSSxPQUFPLE1BQU0sS0FBSyxRQUFRLEVBQUU7UUFDckMsS0FBSyxHQUFHLEtBQUssR0FBRyxNQUFNLENBQUM7S0FDeEI7U0FBTSxJQUFJLE9BQU8sS0FBSyxLQUFLLFFBQVEsRUFBRTtRQUNwQyxLQUFLLEdBQUcsU0FBUyxDQUFDLGVBQWUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO0tBQzNDO0lBQ0QsT0FBTyxLQUFLLENBQUM7QUFDZixDQUFDOzs7Ozs7Ozs7OztBQVlELE1BQU0sVUFBVSxxQkFBcUIsQ0FBQyxLQUFZLEVBQUUsWUFBcUI7SUFDdkUsT0FBTyxDQUFDLEtBQUssQ0FBQyxLQUFLLEdBQUcsQ0FBQyxZQUFZLENBQUMsQ0FBQyx3QkFBMEIsQ0FBQyx1QkFBeUIsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQ3BHLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7U2FmZVZhbHVlLCB1bndyYXBTYWZlVmFsdWV9IGZyb20gJy4uLy4uL3Nhbml0aXphdGlvbi9ieXBhc3MnO1xuaW1wb3J0IHtLZXlWYWx1ZUFycmF5LCBrZXlWYWx1ZUFycmF5R2V0LCBrZXlWYWx1ZUFycmF5U2V0fSBmcm9tICcuLi8uLi91dGlsL2FycmF5X3V0aWxzJztcbmltcG9ydCB7YXNzZXJ0RGVmaW5lZCwgYXNzZXJ0RXF1YWwsIGFzc2VydExlc3NUaGFuLCBhc3NlcnROb3RFcXVhbCwgdGhyb3dFcnJvcn0gZnJvbSAnLi4vLi4vdXRpbC9hc3NlcnQnO1xuaW1wb3J0IHtFTVBUWV9BUlJBWX0gZnJvbSAnLi4vLi4vdXRpbC9lbXB0eSc7XG5pbXBvcnQge2NvbmNhdFN0cmluZ3NXaXRoU3BhY2UsIHN0cmluZ2lmeX0gZnJvbSAnLi4vLi4vdXRpbC9zdHJpbmdpZnknO1xuaW1wb3J0IHthc3NlcnRGaXJzdFVwZGF0ZVBhc3N9IGZyb20gJy4uL2Fzc2VydCc7XG5pbXBvcnQge2JpbmRpbmdVcGRhdGVkfSBmcm9tICcuLi9iaW5kaW5ncyc7XG5pbXBvcnQge0RpcmVjdGl2ZURlZn0gZnJvbSAnLi4vaW50ZXJmYWNlcy9kZWZpbml0aW9uJztcbmltcG9ydCB7QXR0cmlidXRlTWFya2VyLCBUQXR0cmlidXRlcywgVE5vZGUsIFROb2RlRmxhZ3MsIFROb2RlVHlwZX0gZnJvbSAnLi4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7UkVsZW1lbnQsIFJlbmRlcmVyM30gZnJvbSAnLi4vaW50ZXJmYWNlcy9yZW5kZXJlcic7XG5pbXBvcnQge2dldFRTdHlsaW5nUmFuZ2VOZXh0LCBnZXRUU3R5bGluZ1JhbmdlTmV4dER1cGxpY2F0ZSwgZ2V0VFN0eWxpbmdSYW5nZVByZXYsIGdldFRTdHlsaW5nUmFuZ2VQcmV2RHVwbGljYXRlLCBUU3R5bGluZ0tleSwgVFN0eWxpbmdSYW5nZX0gZnJvbSAnLi4vaW50ZXJmYWNlcy9zdHlsaW5nJztcbmltcG9ydCB7SEVBREVSX09GRlNFVCwgTFZpZXcsIFJFTkRFUkVSLCBURGF0YSwgVFZpZXd9IGZyb20gJy4uL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2FwcGx5U3R5bGluZ30gZnJvbSAnLi4vbm9kZV9tYW5pcHVsYXRpb24nO1xuaW1wb3J0IHtnZXRDdXJyZW50RGlyZWN0aXZlRGVmLCBnZXRMVmlldywgZ2V0U2VsZWN0ZWRJbmRleCwgZ2V0VFZpZXcsIGluY3JlbWVudEJpbmRpbmdJbmRleH0gZnJvbSAnLi4vc3RhdGUnO1xuaW1wb3J0IHtpbnNlcnRUU3R5bGluZ0JpbmRpbmd9IGZyb20gJy4uL3N0eWxpbmcvc3R5bGVfYmluZGluZ19saXN0JztcbmltcG9ydCB7Z2V0TGFzdFBhcnNlZEtleSwgZ2V0TGFzdFBhcnNlZFZhbHVlLCBwYXJzZUNsYXNzTmFtZSwgcGFyc2VDbGFzc05hbWVOZXh0LCBwYXJzZVN0eWxlLCBwYXJzZVN0eWxlTmV4dH0gZnJvbSAnLi4vc3R5bGluZy9zdHlsaW5nX3BhcnNlcic7XG5pbXBvcnQge05PX0NIQU5HRX0gZnJvbSAnLi4vdG9rZW5zJztcbmltcG9ydCB7Z2V0TmF0aXZlQnlJbmRleH0gZnJvbSAnLi4vdXRpbC92aWV3X3V0aWxzJztcblxuaW1wb3J0IHtzZXREaXJlY3RpdmVJbnB1dHNXaGljaFNoYWRvd3NTdHlsaW5nfSBmcm9tICcuL3Byb3BlcnR5JztcblxuXG4vKipcbiAqIFVwZGF0ZSBhIHN0eWxlIGJpbmRpbmcgb24gYW4gZWxlbWVudCB3aXRoIHRoZSBwcm92aWRlZCB2YWx1ZS5cbiAqXG4gKiBJZiB0aGUgc3R5bGUgdmFsdWUgaXMgZmFsc3kgdGhlbiBpdCB3aWxsIGJlIHJlbW92ZWQgZnJvbSB0aGUgZWxlbWVudFxuICogKG9yIGFzc2lnbmVkIGEgZGlmZmVyZW50IHZhbHVlIGRlcGVuZGluZyBpZiB0aGVyZSBhcmUgYW55IHN0eWxlcyBwbGFjZWRcbiAqIG9uIHRoZSBlbGVtZW50IHdpdGggYHN0eWxlTWFwYCBvciBhbnkgc3RhdGljIHN0eWxlcyB0aGF0IGFyZVxuICogcHJlc2VudCBmcm9tIHdoZW4gdGhlIGVsZW1lbnQgd2FzIGNyZWF0ZWQgd2l0aCBgc3R5bGluZ2ApLlxuICpcbiAqIE5vdGUgdGhhdCB0aGUgc3R5bGluZyBlbGVtZW50IGlzIHVwZGF0ZWQgYXMgcGFydCBvZiBgc3R5bGluZ0FwcGx5YC5cbiAqXG4gKiBAcGFyYW0gcHJvcCBBIHZhbGlkIENTUyBwcm9wZXJ0eS5cbiAqIEBwYXJhbSB2YWx1ZSBOZXcgdmFsdWUgdG8gd3JpdGUgKGBudWxsYCBvciBhbiBlbXB0eSBzdHJpbmcgdG8gcmVtb3ZlKS5cbiAqIEBwYXJhbSBzdWZmaXggT3B0aW9uYWwgc3VmZml4LiBVc2VkIHdpdGggc2NhbGFyIHZhbHVlcyB0byBhZGQgdW5pdCBzdWNoIGFzIGBweGAuXG4gKlxuICogTm90ZSB0aGF0IHRoaXMgd2lsbCBhcHBseSB0aGUgcHJvdmlkZWQgc3R5bGUgdmFsdWUgdG8gdGhlIGhvc3QgZWxlbWVudCBpZiB0aGlzIGZ1bmN0aW9uIGlzIGNhbGxlZFxuICogd2l0aGluIGEgaG9zdCBiaW5kaW5nIGZ1bmN0aW9uLlxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1c3R5bGVQcm9wKFxuICAgIHByb3A6IHN0cmluZywgdmFsdWU6IHN0cmluZ3xudW1iZXJ8U2FmZVZhbHVlfHVuZGVmaW5lZHxudWxsLFxuICAgIHN1ZmZpeD86IHN0cmluZ3xudWxsKTogdHlwZW9mIMm1ybVzdHlsZVByb3Age1xuICBjaGVja1N0eWxpbmdQcm9wZXJ0eShwcm9wLCB2YWx1ZSwgc3VmZml4LCBmYWxzZSk7XG4gIHJldHVybiDJtcm1c3R5bGVQcm9wO1xufVxuXG4vKipcbiAqIFVwZGF0ZSBhIGNsYXNzIGJpbmRpbmcgb24gYW4gZWxlbWVudCB3aXRoIHRoZSBwcm92aWRlZCB2YWx1ZS5cbiAqXG4gKiBUaGlzIGluc3RydWN0aW9uIGlzIG1lYW50IHRvIGhhbmRsZSB0aGUgYFtjbGFzcy5mb29dPVwiZXhwXCJgIGNhc2UgYW5kLFxuICogdGhlcmVmb3JlLCB0aGUgY2xhc3MgYmluZGluZyBpdHNlbGYgbXVzdCBhbHJlYWR5IGJlIGFsbG9jYXRlZCB1c2luZ1xuICogYHN0eWxpbmdgIHdpdGhpbiB0aGUgY3JlYXRpb24gYmxvY2suXG4gKlxuICogQHBhcmFtIHByb3AgQSB2YWxpZCBDU1MgY2xhc3MgKG9ubHkgb25lKS5cbiAqIEBwYXJhbSB2YWx1ZSBBIHRydWUvZmFsc2UgdmFsdWUgd2hpY2ggd2lsbCB0dXJuIHRoZSBjbGFzcyBvbiBvciBvZmYuXG4gKlxuICogTm90ZSB0aGF0IHRoaXMgd2lsbCBhcHBseSB0aGUgcHJvdmlkZWQgY2xhc3MgdmFsdWUgdG8gdGhlIGhvc3QgZWxlbWVudCBpZiB0aGlzIGZ1bmN0aW9uXG4gKiBpcyBjYWxsZWQgd2l0aGluIGEgaG9zdCBiaW5kaW5nIGZ1bmN0aW9uLlxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1Y2xhc3NQcm9wKGNsYXNzTmFtZTogc3RyaW5nLCB2YWx1ZTogYm9vbGVhbnx1bmRlZmluZWR8bnVsbCk6IHR5cGVvZiDJtcm1Y2xhc3NQcm9wIHtcbiAgY2hlY2tTdHlsaW5nUHJvcGVydHkoY2xhc3NOYW1lLCB2YWx1ZSwgbnVsbCwgdHJ1ZSk7XG4gIHJldHVybiDJtcm1Y2xhc3NQcm9wO1xufVxuXG5cbi8qKlxuICogVXBkYXRlIHN0eWxlIGJpbmRpbmdzIHVzaW5nIGFuIG9iamVjdCBsaXRlcmFsIG9uIGFuIGVsZW1lbnQuXG4gKlxuICogVGhpcyBpbnN0cnVjdGlvbiBpcyBtZWFudCB0byBhcHBseSBzdHlsaW5nIHZpYSB0aGUgYFtzdHlsZV09XCJleHBcImAgdGVtcGxhdGUgYmluZGluZ3MuXG4gKiBXaGVuIHN0eWxlcyBhcmUgYXBwbGllZCB0byB0aGUgZWxlbWVudCB0aGV5IHdpbGwgdGhlbiBiZSB1cGRhdGVkIHdpdGggcmVzcGVjdCB0b1xuICogYW55IHN0eWxlcy9jbGFzc2VzIHNldCB2aWEgYHN0eWxlUHJvcGAuIElmIGFueSBzdHlsZXMgYXJlIHNldCB0byBmYWxzeVxuICogdGhlbiB0aGV5IHdpbGwgYmUgcmVtb3ZlZCBmcm9tIHRoZSBlbGVtZW50LlxuICpcbiAqIE5vdGUgdGhhdCB0aGUgc3R5bGluZyBpbnN0cnVjdGlvbiB3aWxsIG5vdCBiZSBhcHBsaWVkIHVudGlsIGBzdHlsaW5nQXBwbHlgIGlzIGNhbGxlZC5cbiAqXG4gKiBAcGFyYW0gc3R5bGVzIEEga2V5L3ZhbHVlIHN0eWxlIG1hcCBvZiB0aGUgc3R5bGVzIHRoYXQgd2lsbCBiZSBhcHBsaWVkIHRvIHRoZSBnaXZlbiBlbGVtZW50LlxuICogICAgICAgIEFueSBtaXNzaW5nIHN0eWxlcyAodGhhdCBoYXZlIGFscmVhZHkgYmVlbiBhcHBsaWVkIHRvIHRoZSBlbGVtZW50IGJlZm9yZWhhbmQpIHdpbGwgYmVcbiAqICAgICAgICByZW1vdmVkICh1bnNldCkgZnJvbSB0aGUgZWxlbWVudCdzIHN0eWxpbmcuXG4gKlxuICogTm90ZSB0aGF0IHRoaXMgd2lsbCBhcHBseSB0aGUgcHJvdmlkZWQgc3R5bGVNYXAgdmFsdWUgdG8gdGhlIGhvc3QgZWxlbWVudCBpZiB0aGlzIGZ1bmN0aW9uXG4gKiBpcyBjYWxsZWQgd2l0aGluIGEgaG9zdCBiaW5kaW5nLlxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1c3R5bGVNYXAoc3R5bGVzOiB7W3N0eWxlTmFtZTogc3RyaW5nXTogYW55fXxzdHJpbmd8dW5kZWZpbmVkfG51bGwpOiB2b2lkIHtcbiAgY2hlY2tTdHlsaW5nTWFwKHN0eWxlS2V5VmFsdWVBcnJheVNldCwgc3R5bGVTdHJpbmdQYXJzZXIsIHN0eWxlcywgZmFsc2UpO1xufVxuXG5cbi8qKlxuICogUGFyc2UgdGV4dCBhcyBzdHlsZSBhbmQgYWRkIHZhbHVlcyB0byBLZXlWYWx1ZUFycmF5LlxuICpcbiAqIFRoaXMgY29kZSBpcyBwdWxsZWQgb3V0IHRvIGEgc2VwYXJhdGUgZnVuY3Rpb24gc28gdGhhdCBpdCBjYW4gYmUgdHJlZSBzaGFrZW4gYXdheSBpZiBpdCBpcyBub3RcbiAqIG5lZWRlZC4gSXQgaXMgb25seSByZWZlcmVuY2VkIGZyb20gYMm1ybVzdHlsZU1hcGAuXG4gKlxuICogQHBhcmFtIGtleVZhbHVlQXJyYXkgS2V5VmFsdWVBcnJheSB0byBhZGQgcGFyc2VkIHZhbHVlcyB0by5cbiAqIEBwYXJhbSB0ZXh0IHRleHQgdG8gcGFyc2UuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzdHlsZVN0cmluZ1BhcnNlcihrZXlWYWx1ZUFycmF5OiBLZXlWYWx1ZUFycmF5PGFueT4sIHRleHQ6IHN0cmluZyk6IHZvaWQge1xuICBmb3IgKGxldCBpID0gcGFyc2VTdHlsZSh0ZXh0KTsgaSA+PSAwOyBpID0gcGFyc2VTdHlsZU5leHQodGV4dCwgaSkpIHtcbiAgICBzdHlsZUtleVZhbHVlQXJyYXlTZXQoa2V5VmFsdWVBcnJheSwgZ2V0TGFzdFBhcnNlZEtleSh0ZXh0KSwgZ2V0TGFzdFBhcnNlZFZhbHVlKHRleHQpKTtcbiAgfVxufVxuXG5cbi8qKlxuICogVXBkYXRlIGNsYXNzIGJpbmRpbmdzIHVzaW5nIGFuIG9iamVjdCBsaXRlcmFsIG9yIGNsYXNzLXN0cmluZyBvbiBhbiBlbGVtZW50LlxuICpcbiAqIFRoaXMgaW5zdHJ1Y3Rpb24gaXMgbWVhbnQgdG8gYXBwbHkgc3R5bGluZyB2aWEgdGhlIGBbY2xhc3NdPVwiZXhwXCJgIHRlbXBsYXRlIGJpbmRpbmdzLlxuICogV2hlbiBjbGFzc2VzIGFyZSBhcHBsaWVkIHRvIHRoZSBlbGVtZW50IHRoZXkgd2lsbCB0aGVuIGJlIHVwZGF0ZWQgd2l0aFxuICogcmVzcGVjdCB0byBhbnkgc3R5bGVzL2NsYXNzZXMgc2V0IHZpYSBgY2xhc3NQcm9wYC4gSWYgYW55XG4gKiBjbGFzc2VzIGFyZSBzZXQgdG8gZmFsc3kgdGhlbiB0aGV5IHdpbGwgYmUgcmVtb3ZlZCBmcm9tIHRoZSBlbGVtZW50LlxuICpcbiAqIE5vdGUgdGhhdCB0aGUgc3R5bGluZyBpbnN0cnVjdGlvbiB3aWxsIG5vdCBiZSBhcHBsaWVkIHVudGlsIGBzdHlsaW5nQXBwbHlgIGlzIGNhbGxlZC5cbiAqIE5vdGUgdGhhdCB0aGlzIHdpbGwgdGhlIHByb3ZpZGVkIGNsYXNzTWFwIHZhbHVlIHRvIHRoZSBob3N0IGVsZW1lbnQgaWYgdGhpcyBmdW5jdGlvbiBpcyBjYWxsZWRcbiAqIHdpdGhpbiBhIGhvc3QgYmluZGluZy5cbiAqXG4gKiBAcGFyYW0gY2xhc3NlcyBBIGtleS92YWx1ZSBtYXAgb3Igc3RyaW5nIG9mIENTUyBjbGFzc2VzIHRoYXQgd2lsbCBiZSBhZGRlZCB0byB0aGVcbiAqICAgICAgICBnaXZlbiBlbGVtZW50LiBBbnkgbWlzc2luZyBjbGFzc2VzICh0aGF0IGhhdmUgYWxyZWFkeSBiZWVuIGFwcGxpZWQgdG8gdGhlIGVsZW1lbnRcbiAqICAgICAgICBiZWZvcmVoYW5kKSB3aWxsIGJlIHJlbW92ZWQgKHVuc2V0KSBmcm9tIHRoZSBlbGVtZW50J3MgbGlzdCBvZiBDU1MgY2xhc3Nlcy5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWNsYXNzTWFwKGNsYXNzZXM6IHtbY2xhc3NOYW1lOiBzdHJpbmddOiBib29sZWFufHVuZGVmaW5lZHxudWxsfXxzdHJpbmd8dW5kZWZpbmVkfFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgbnVsbCk6IHZvaWQge1xuICBjaGVja1N0eWxpbmdNYXAoa2V5VmFsdWVBcnJheVNldCwgY2xhc3NTdHJpbmdQYXJzZXIsIGNsYXNzZXMsIHRydWUpO1xufVxuXG4vKipcbiAqIFBhcnNlIHRleHQgYXMgY2xhc3MgYW5kIGFkZCB2YWx1ZXMgdG8gS2V5VmFsdWVBcnJheS5cbiAqXG4gKiBUaGlzIGNvZGUgaXMgcHVsbGVkIG91dCB0byBhIHNlcGFyYXRlIGZ1bmN0aW9uIHNvIHRoYXQgaXQgY2FuIGJlIHRyZWUgc2hha2VuIGF3YXkgaWYgaXQgaXMgbm90XG4gKiBuZWVkZWQuIEl0IGlzIG9ubHkgcmVmZXJlbmNlZCBmcm9tIGDJtcm1Y2xhc3NNYXBgLlxuICpcbiAqIEBwYXJhbSBrZXlWYWx1ZUFycmF5IEtleVZhbHVlQXJyYXkgdG8gYWRkIHBhcnNlZCB2YWx1ZXMgdG8uXG4gKiBAcGFyYW0gdGV4dCB0ZXh0IHRvIHBhcnNlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY2xhc3NTdHJpbmdQYXJzZXIoa2V5VmFsdWVBcnJheTogS2V5VmFsdWVBcnJheTxhbnk+LCB0ZXh0OiBzdHJpbmcpOiB2b2lkIHtcbiAgZm9yIChsZXQgaSA9IHBhcnNlQ2xhc3NOYW1lKHRleHQpOyBpID49IDA7IGkgPSBwYXJzZUNsYXNzTmFtZU5leHQodGV4dCwgaSkpIHtcbiAgICBrZXlWYWx1ZUFycmF5U2V0KGtleVZhbHVlQXJyYXksIGdldExhc3RQYXJzZWRLZXkodGV4dCksIHRydWUpO1xuICB9XG59XG5cbi8qKlxuICogQ29tbW9uIGNvZGUgYmV0d2VlbiBgybXJtWNsYXNzUHJvcGAgYW5kIGDJtcm1c3R5bGVQcm9wYC5cbiAqXG4gKiBAcGFyYW0gcHJvcCBwcm9wZXJ0eSBuYW1lLlxuICogQHBhcmFtIHZhbHVlIGJpbmRpbmcgdmFsdWUuXG4gKiBAcGFyYW0gc3VmZml4IHN1ZmZpeCBmb3IgdGhlIHByb3BlcnR5IChlLmcuIGBlbWAgb3IgYHB4YClcbiAqIEBwYXJhbSBpc0NsYXNzQmFzZWQgYHRydWVgIGlmIGBjbGFzc2AgY2hhbmdlIChgZmFsc2VgIGlmIGBzdHlsZWApXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjaGVja1N0eWxpbmdQcm9wZXJ0eShcbiAgICBwcm9wOiBzdHJpbmcsIHZhbHVlOiBhbnl8Tk9fQ0hBTkdFLCBzdWZmaXg6IHN0cmluZ3x1bmRlZmluZWR8bnVsbCxcbiAgICBpc0NsYXNzQmFzZWQ6IGJvb2xlYW4pOiB2b2lkIHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCB0VmlldyA9IGdldFRWaWV3KCk7XG4gIC8vIFN0eWxpbmcgaW5zdHJ1Y3Rpb25zIHVzZSAyIHNsb3RzIHBlciBiaW5kaW5nLlxuICAvLyAxLiBvbmUgZm9yIHRoZSB2YWx1ZSAvIFRTdHlsaW5nS2V5XG4gIC8vIDIuIG9uZSBmb3IgdGhlIGludGVybWl0dGVudC12YWx1ZSAvIFRTdHlsaW5nUmFuZ2VcbiAgY29uc3QgYmluZGluZ0luZGV4ID0gaW5jcmVtZW50QmluZGluZ0luZGV4KDIpO1xuICBpZiAodFZpZXcuZmlyc3RVcGRhdGVQYXNzKSB7XG4gICAgc3R5bGluZ0ZpcnN0VXBkYXRlUGFzcyh0VmlldywgcHJvcCwgYmluZGluZ0luZGV4LCBpc0NsYXNzQmFzZWQpO1xuICB9XG4gIGlmICh2YWx1ZSAhPT0gTk9fQ0hBTkdFICYmIGJpbmRpbmdVcGRhdGVkKGxWaWV3LCBiaW5kaW5nSW5kZXgsIHZhbHVlKSkge1xuICAgIGNvbnN0IHROb2RlID0gdFZpZXcuZGF0YVtnZXRTZWxlY3RlZEluZGV4KCkgKyBIRUFERVJfT0ZGU0VUXSBhcyBUTm9kZTtcbiAgICB1cGRhdGVTdHlsaW5nKFxuICAgICAgICB0VmlldywgdE5vZGUsIGxWaWV3LCBsVmlld1tSRU5ERVJFUl0sIHByb3AsXG4gICAgICAgIGxWaWV3W2JpbmRpbmdJbmRleCArIDFdID0gbm9ybWFsaXplU3VmZml4KHZhbHVlLCBzdWZmaXgpLCBpc0NsYXNzQmFzZWQsIGJpbmRpbmdJbmRleCk7XG4gIH1cbn1cblxuLyoqXG4gKiBDb21tb24gY29kZSBiZXR3ZWVuIGDJtcm1Y2xhc3NNYXBgIGFuZCBgybXJtXN0eWxlTWFwYC5cbiAqXG4gKiBAcGFyYW0ga2V5VmFsdWVBcnJheVNldCAoU2VlIGBrZXlWYWx1ZUFycmF5U2V0YCBpbiBcInV0aWwvYXJyYXlfdXRpbHNcIikgR2V0cyBwYXNzZWQgaW4gYXMgYVxuICogICAgICAgIGZ1bmN0aW9uIHNvIHRoYXQgYHN0eWxlYCBjYW4gYmUgcHJvY2Vzc2VkLiBUaGlzIGlzIGRvbmUgZm9yIHRyZWUgc2hha2luZyBwdXJwb3Nlcy5cbiAqIEBwYXJhbSBzdHJpbmdQYXJzZXIgUGFyc2VyIHVzZWQgdG8gcGFyc2UgYHZhbHVlYCBpZiBgc3RyaW5nYC4gKFBhc3NlZCBpbiBhcyBgc3R5bGVgIGFuZCBgY2xhc3NgXG4gKiAgICAgICAgaGF2ZSBkaWZmZXJlbnQgcGFyc2Vycy4pXG4gKiBAcGFyYW0gdmFsdWUgYm91bmQgdmFsdWUgZnJvbSBhcHBsaWNhdGlvblxuICogQHBhcmFtIGlzQ2xhc3NCYXNlZCBgdHJ1ZWAgaWYgYGNsYXNzYCBjaGFuZ2UgKGBmYWxzZWAgaWYgYHN0eWxlYClcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNoZWNrU3R5bGluZ01hcChcbiAgICBrZXlWYWx1ZUFycmF5U2V0OiAoa2V5VmFsdWVBcnJheTogS2V5VmFsdWVBcnJheTxhbnk+LCBrZXk6IHN0cmluZywgdmFsdWU6IGFueSkgPT4gdm9pZCxcbiAgICBzdHJpbmdQYXJzZXI6IChzdHlsZUtleVZhbHVlQXJyYXk6IEtleVZhbHVlQXJyYXk8YW55PiwgdGV4dDogc3RyaW5nKSA9PiB2b2lkLFxuICAgIHZhbHVlOiBhbnl8Tk9fQ0hBTkdFLCBpc0NsYXNzQmFzZWQ6IGJvb2xlYW4pOiB2b2lkIHtcbiAgY29uc3QgdFZpZXcgPSBnZXRUVmlldygpO1xuICBjb25zdCBiaW5kaW5nSW5kZXggPSBpbmNyZW1lbnRCaW5kaW5nSW5kZXgoMik7XG4gIGlmICh0Vmlldy5maXJzdFVwZGF0ZVBhc3MpIHtcbiAgICBzdHlsaW5nRmlyc3RVcGRhdGVQYXNzKHRWaWV3LCBudWxsLCBiaW5kaW5nSW5kZXgsIGlzQ2xhc3NCYXNlZCk7XG4gIH1cbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBpZiAodmFsdWUgIT09IE5PX0NIQU5HRSAmJiBiaW5kaW5nVXBkYXRlZChsVmlldywgYmluZGluZ0luZGV4LCB2YWx1ZSkpIHtcbiAgICAvLyBgZ2V0U2VsZWN0ZWRJbmRleCgpYCBzaG91bGQgYmUgaGVyZSAocmF0aGVyIHRoYW4gaW4gaW5zdHJ1Y3Rpb24pIHNvIHRoYXQgaXQgaXMgZ3VhcmRlZCBieSB0aGVcbiAgICAvLyBpZiBzbyBhcyBub3QgdG8gcmVhZCB1bm5lY2Vzc2FyaWx5LlxuICAgIGNvbnN0IHROb2RlID0gdFZpZXcuZGF0YVtnZXRTZWxlY3RlZEluZGV4KCkgKyBIRUFERVJfT0ZGU0VUXSBhcyBUTm9kZTtcbiAgICBpZiAoaGFzU3R5bGluZ0lucHV0U2hhZG93KHROb2RlLCBpc0NsYXNzQmFzZWQpICYmICFpc0luSG9zdEJpbmRpbmdzKHRWaWV3LCBiaW5kaW5nSW5kZXgpKSB7XG4gICAgICBpZiAobmdEZXZNb2RlKSB7XG4gICAgICAgIC8vIHZlcmlmeSB0aGF0IGlmIHdlIGFyZSBzaGFkb3dpbmcgdGhlbiBgVERhdGFgIGlzIGFwcHJvcHJpYXRlbHkgbWFya2VkIHNvIHRoYXQgd2Ugc2tpcFxuICAgICAgICAvLyBwcm9jZXNzaW5nIHRoaXMgYmluZGluZyBpbiBzdHlsaW5nIHJlc29sdXRpb24uXG4gICAgICAgIGNvbnN0IHRTdHlsaW5nS2V5ID0gdFZpZXcuZGF0YVtiaW5kaW5nSW5kZXhdO1xuICAgICAgICBhc3NlcnRFcXVhbChcbiAgICAgICAgICAgIEFycmF5LmlzQXJyYXkodFN0eWxpbmdLZXkpID8gdFN0eWxpbmdLZXlbMV0gOiB0U3R5bGluZ0tleSwgZmFsc2UsXG4gICAgICAgICAgICAnU3R5bGluZyBsaW5rZWQgbGlzdCBzaGFkb3cgaW5wdXQgc2hvdWxkIGJlIG1hcmtlZCBhcyBcXCdmYWxzZVxcJycpO1xuICAgICAgfVxuICAgICAgLy8gVkUgZG9lcyBub3QgY29uY2F0ZW5hdGUgdGhlIHN0YXRpYyBwb3J0aW9uIGxpa2Ugd2UgYXJlIGRvaW5nIGhlcmUuXG4gICAgICAvLyBJbnN0ZWFkIFZFIGp1c3QgaWdub3JlcyB0aGUgc3RhdGljIGNvbXBsZXRlbHkgaWYgZHluYW1pYyBiaW5kaW5nIGlzIHByZXNlbnQuXG4gICAgICAvLyBCZWNhdXNlIG9mIGxvY2FsaXR5IHdlIGhhdmUgYWxyZWFkeSBzZXQgdGhlIHN0YXRpYyBwb3J0aW9uIGJlY2F1c2Ugd2UgZG9uJ3Qga25vdyBpZiB0aGVyZVxuICAgICAgLy8gaXMgYSBkeW5hbWljIHBvcnRpb24gdW50aWwgbGF0ZXIuIElmIHdlIHdvdWxkIGlnbm9yZSB0aGUgc3RhdGljIHBvcnRpb24gaXQgd291bGQgbG9vayBsaWtlXG4gICAgICAvLyB0aGUgYmluZGluZyBoYXMgcmVtb3ZlZCBpdC4gVGhpcyB3b3VsZCBjb25mdXNlIGBbbmdTdHlsZV1gL2BbbmdDbGFzc11gIHRvIGRvIHRoZSB3cm9uZ1xuICAgICAgLy8gdGhpbmcgYXMgaXQgd291bGQgdGhpbmsgdGhhdCB0aGUgc3RhdGljIHBvcnRpb24gd2FzIHJlbW92ZWQuIEZvciB0aGlzIHJlYXNvbiB3ZVxuICAgICAgLy8gY29uY2F0ZW5hdGUgaXQgc28gdGhhdCBgW25nU3R5bGVdYC9gW25nQ2xhc3NdYCAgY2FuIGNvbnRpbnVlIHRvIHdvcmsgb24gY2hhbmdlZC5cbiAgICAgIGxldCBzdGF0aWNQcmVmaXggPSBpc0NsYXNzQmFzZWQgPyB0Tm9kZS5jbGFzc2VzV2l0aG91dEhvc3QgOiB0Tm9kZS5zdHlsZXNXaXRob3V0SG9zdDtcbiAgICAgIG5nRGV2TW9kZSAmJiBpc0NsYXNzQmFzZWQgPT09IGZhbHNlICYmIHN0YXRpY1ByZWZpeCAhPT0gbnVsbCAmJlxuICAgICAgICAgIGFzc2VydEVxdWFsKFxuICAgICAgICAgICAgICBzdGF0aWNQcmVmaXguZW5kc1dpdGgoJzsnKSwgdHJ1ZSwgJ0V4cGVjdGluZyBzdGF0aWMgcG9ydGlvbiB0byBlbmQgd2l0aCBcXCc7XFwnJyk7XG4gICAgICBpZiAoc3RhdGljUHJlZml4ICE9PSBudWxsKSB7XG4gICAgICAgIC8vIFdlIHdhbnQgdG8gbWFrZSBzdXJlIHRoYXQgZmFsc3kgdmFsdWVzIG9mIGB2YWx1ZWAgYmVjb21lIGVtcHR5IHN0cmluZ3MuXG4gICAgICAgIHZhbHVlID0gY29uY2F0U3RyaW5nc1dpdGhTcGFjZShzdGF0aWNQcmVmaXgsIHZhbHVlID8gdmFsdWUgOiAnJyk7XG4gICAgICB9XG4gICAgICAvLyBHaXZlbiBgPGRpdiBbc3R5bGVdIG15LWRpcj5gIHN1Y2ggdGhhdCBgbXktZGlyYCBoYXMgYEBJbnB1dCgnc3R5bGUnKWAuXG4gICAgICAvLyBUaGlzIHRha2VzIG92ZXIgdGhlIGBbc3R5bGVdYCBiaW5kaW5nLiAoU2FtZSBmb3IgYFtjbGFzc11gKVxuICAgICAgc2V0RGlyZWN0aXZlSW5wdXRzV2hpY2hTaGFkb3dzU3R5bGluZyh0VmlldywgdE5vZGUsIGxWaWV3LCB2YWx1ZSwgaXNDbGFzc0Jhc2VkKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdXBkYXRlU3R5bGluZ01hcChcbiAgICAgICAgICB0VmlldywgdE5vZGUsIGxWaWV3LCBsVmlld1tSRU5ERVJFUl0sIGxWaWV3W2JpbmRpbmdJbmRleCArIDFdLFxuICAgICAgICAgIGxWaWV3W2JpbmRpbmdJbmRleCArIDFdID0gdG9TdHlsaW5nS2V5VmFsdWVBcnJheShrZXlWYWx1ZUFycmF5U2V0LCBzdHJpbmdQYXJzZXIsIHZhbHVlKSxcbiAgICAgICAgICBpc0NsYXNzQmFzZWQsIGJpbmRpbmdJbmRleCk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogRGV0ZXJtaW5lcyB3aGVuIHRoZSBiaW5kaW5nIGlzIGluIGBob3N0QmluZGluZ3NgIHNlY3Rpb25cbiAqXG4gKiBAcGFyYW0gdFZpZXcgQ3VycmVudCBgVFZpZXdgXG4gKiBAcGFyYW0gYmluZGluZ0luZGV4IGluZGV4IG9mIGJpbmRpbmcgd2hpY2ggd2Ugd291bGQgbGlrZSBpZiBpdCBpcyBpbiBgaG9zdEJpbmRpbmdzYFxuICovXG5mdW5jdGlvbiBpc0luSG9zdEJpbmRpbmdzKHRWaWV3OiBUVmlldywgYmluZGluZ0luZGV4OiBudW1iZXIpOiBib29sZWFuIHtcbiAgLy8gQWxsIGhvc3QgYmluZGluZ3MgYXJlIHBsYWNlZCBhZnRlciB0aGUgZXhwYW5kbyBzZWN0aW9uLlxuICByZXR1cm4gYmluZGluZ0luZGV4ID49IHRWaWV3LmV4cGFuZG9TdGFydEluZGV4O1xufVxuXG4vKipcbiAqIENvbGxlY3RzIHRoZSBuZWNlc3NhcnkgaW5mb3JtYXRpb24gdG8gaW5zZXJ0IHRoZSBiaW5kaW5nIGludG8gYSBsaW5rZWQgbGlzdCBvZiBzdHlsZSBiaW5kaW5nc1xuICogdXNpbmcgYGluc2VydFRTdHlsaW5nQmluZGluZ2AuXG4gKlxuICogQHBhcmFtIHRWaWV3IGBUVmlld2Agd2hlcmUgdGhlIGJpbmRpbmcgbGlua2VkIGxpc3Qgd2lsbCBiZSBzdG9yZWQuXG4gKiBAcGFyYW0gdFN0eWxpbmdLZXkgUHJvcGVydHkva2V5IG9mIHRoZSBiaW5kaW5nLlxuICogQHBhcmFtIGJpbmRpbmdJbmRleCBJbmRleCBvZiBiaW5kaW5nIGFzc29jaWF0ZWQgd2l0aCB0aGUgYHByb3BgXG4gKiBAcGFyYW0gaXNDbGFzc0Jhc2VkIGB0cnVlYCBpZiBgY2xhc3NgIGNoYW5nZSAoYGZhbHNlYCBpZiBgc3R5bGVgKVxuICovXG5mdW5jdGlvbiBzdHlsaW5nRmlyc3RVcGRhdGVQYXNzKFxuICAgIHRWaWV3OiBUVmlldywgdFN0eWxpbmdLZXk6IFRTdHlsaW5nS2V5LCBiaW5kaW5nSW5kZXg6IG51bWJlciwgaXNDbGFzc0Jhc2VkOiBib29sZWFuKTogdm9pZCB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRGaXJzdFVwZGF0ZVBhc3ModFZpZXcpO1xuICBjb25zdCB0RGF0YSA9IHRWaWV3LmRhdGE7XG4gIGlmICh0RGF0YVtiaW5kaW5nSW5kZXggKyAxXSA9PT0gbnVsbCkge1xuICAgIC8vIFRoZSBhYm92ZSBjaGVjayBpcyBuZWNlc3NhcnkgYmVjYXVzZSB3ZSBkb24ndCBjbGVhciBmaXJzdCB1cGRhdGUgcGFzcyB1bnRpbCBmaXJzdCBzdWNjZXNzZnVsXG4gICAgLy8gKG5vIGV4Y2VwdGlvbikgdGVtcGxhdGUgZXhlY3V0aW9uLiBUaGlzIHByZXZlbnRzIHRoZSBzdHlsaW5nIGluc3RydWN0aW9uIGZyb20gZG91YmxlIGFkZGluZ1xuICAgIC8vIGl0c2VsZiB0byB0aGUgbGlzdC5cbiAgICAvLyBgZ2V0U2VsZWN0ZWRJbmRleCgpYCBzaG91bGQgYmUgaGVyZSAocmF0aGVyIHRoYW4gaW4gaW5zdHJ1Y3Rpb24pIHNvIHRoYXQgaXQgaXMgZ3VhcmRlZCBieSB0aGVcbiAgICAvLyBpZiBzbyBhcyBub3QgdG8gcmVhZCB1bm5lY2Vzc2FyaWx5LlxuICAgIGNvbnN0IHROb2RlID0gdERhdGFbZ2V0U2VsZWN0ZWRJbmRleCgpICsgSEVBREVSX09GRlNFVF0gYXMgVE5vZGU7XG4gICAgY29uc3QgaXNIb3N0QmluZGluZ3MgPSBpc0luSG9zdEJpbmRpbmdzKHRWaWV3LCBiaW5kaW5nSW5kZXgpO1xuICAgIGlmIChoYXNTdHlsaW5nSW5wdXRTaGFkb3codE5vZGUsIGlzQ2xhc3NCYXNlZCkgJiYgdFN0eWxpbmdLZXkgPT09IG51bGwgJiYgIWlzSG9zdEJpbmRpbmdzKSB7XG4gICAgICAvLyBgdFN0eWxpbmdLZXkgPT09IG51bGxgIGltcGxpZXMgdGhhdCB3ZSBhcmUgZWl0aGVyIGBbc3R5bGVdYCBvciBgW2NsYXNzXWAgYmluZGluZy5cbiAgICAgIC8vIElmIHRoZXJlIGlzIGEgZGlyZWN0aXZlIHdoaWNoIHVzZXMgYEBJbnB1dCgnc3R5bGUnKWAgb3IgYEBJbnB1dCgnY2xhc3MnKWAgdGhhblxuICAgICAgLy8gd2UgbmVlZCB0byBuZXV0cmFsaXplIHRoaXMgYmluZGluZyBzaW5jZSB0aGF0IGRpcmVjdGl2ZSBpcyBzaGFkb3dpbmcgaXQuXG4gICAgICAvLyBXZSB0dXJuIHRoaXMgaW50byBhIG5vb3AgYnkgc2V0dGluZyB0aGUga2V5IHRvIGBmYWxzZWBcbiAgICAgIHRTdHlsaW5nS2V5ID0gZmFsc2U7XG4gICAgfVxuICAgIHRTdHlsaW5nS2V5ID0gd3JhcEluU3RhdGljU3R5bGluZ0tleSh0RGF0YSwgdE5vZGUsIHRTdHlsaW5nS2V5LCBpc0NsYXNzQmFzZWQpO1xuICAgIGluc2VydFRTdHlsaW5nQmluZGluZyh0RGF0YSwgdE5vZGUsIHRTdHlsaW5nS2V5LCBiaW5kaW5nSW5kZXgsIGlzSG9zdEJpbmRpbmdzLCBpc0NsYXNzQmFzZWQpO1xuICB9XG59XG5cbi8qKlxuICogQWRkcyBzdGF0aWMgc3R5bGluZyBpbmZvcm1hdGlvbiB0byB0aGUgYmluZGluZyBpZiBhcHBsaWNhYmxlLlxuICpcbiAqIFRoZSBsaW5rZWQgbGlzdCBvZiBzdHlsZXMgbm90IG9ubHkgc3RvcmVzIHRoZSBsaXN0IGFuZCBrZXlzLCBidXQgYWxzbyBzdG9yZXMgc3RhdGljIHN0eWxpbmdcbiAqIGluZm9ybWF0aW9uIG9uIHNvbWUgb2YgdGhlIGtleXMuIFRoaXMgZnVuY3Rpb24gZGV0ZXJtaW5lcyBpZiB0aGUga2V5IHNob3VsZCBjb250YWluIHRoZSBzdHlsaW5nXG4gKiBpbmZvcm1hdGlvbiBhbmQgY29tcHV0ZXMgaXQuXG4gKlxuICogU2VlIGBUU3R5bGluZ1N0YXRpY2AgZm9yIG1vcmUgZGV0YWlscy5cbiAqXG4gKiBAcGFyYW0gdERhdGEgYFREYXRhYCB3aGVyZSB0aGUgbGlua2VkIGxpc3QgaXMgc3RvcmVkLlxuICogQHBhcmFtIHROb2RlIGBUTm9kZWAgZm9yIHdoaWNoIHRoZSBzdHlsaW5nIGlzIGJlaW5nIGNvbXB1dGVkLlxuICogQHBhcmFtIHN0eWxpbmdLZXkgYFRTdHlsaW5nS2V5UHJpbWl0aXZlYCB3aGljaCBtYXkgbmVlZCB0byBiZSB3cmFwcGVkIGludG8gYFRTdHlsaW5nS2V5YFxuICogQHBhcmFtIGlzQ2xhc3NCYXNlZCBgdHJ1ZWAgaWYgYGNsYXNzYCAoYGZhbHNlYCBpZiBgc3R5bGVgKVxuICovXG5leHBvcnQgZnVuY3Rpb24gd3JhcEluU3RhdGljU3R5bGluZ0tleShcbiAgICB0RGF0YTogVERhdGEsIHROb2RlOiBUTm9kZSwgc3R5bGluZ0tleTogVFN0eWxpbmdLZXksIGlzQ2xhc3NCYXNlZDogYm9vbGVhbik6IFRTdHlsaW5nS2V5IHtcbiAgY29uc3QgaG9zdERpcmVjdGl2ZURlZiA9IGdldEN1cnJlbnREaXJlY3RpdmVEZWYodERhdGEpO1xuICBsZXQgcmVzaWR1YWwgPSBpc0NsYXNzQmFzZWQgPyB0Tm9kZS5yZXNpZHVhbENsYXNzZXMgOiB0Tm9kZS5yZXNpZHVhbFN0eWxlcztcbiAgaWYgKGhvc3REaXJlY3RpdmVEZWYgPT09IG51bGwpIHtcbiAgICAvLyBXZSBhcmUgaW4gdGVtcGxhdGUgbm9kZS5cbiAgICAvLyBJZiB0ZW1wbGF0ZSBub2RlIGFscmVhZHkgaGFkIHN0eWxpbmcgaW5zdHJ1Y3Rpb24gdGhlbiBpdCBoYXMgYWxyZWFkeSBjb2xsZWN0ZWQgdGhlIHN0YXRpY1xuICAgIC8vIHN0eWxpbmcgYW5kIHRoZXJlIGlzIG5vIG5lZWQgdG8gY29sbGVjdCB0aGVtIGFnYWluLiBXZSBrbm93IHRoYXQgd2UgYXJlIHRoZSBmaXJzdCBzdHlsaW5nXG4gICAgLy8gaW5zdHJ1Y3Rpb24gYmVjYXVzZSB0aGUgYFROb2RlLipCaW5kaW5nc2AgcG9pbnRzIHRvIDAgKG5vdGhpbmcgaGFzIGJlZW4gaW5zZXJ0ZWQgeWV0KS5cbiAgICBjb25zdCBpc0ZpcnN0U3R5bGluZ0luc3RydWN0aW9uSW5UZW1wbGF0ZSA9XG4gICAgICAgIChpc0NsYXNzQmFzZWQgPyB0Tm9kZS5jbGFzc0JpbmRpbmdzIDogdE5vZGUuc3R5bGVCaW5kaW5ncykgYXMgYW55IGFzIG51bWJlciA9PT0gMDtcbiAgICBpZiAoaXNGaXJzdFN0eWxpbmdJbnN0cnVjdGlvbkluVGVtcGxhdGUpIHtcbiAgICAgIC8vIEl0IHdvdWxkIGJlIG5pY2UgdG8gYmUgYWJsZSB0byBnZXQgdGhlIHN0YXRpY3MgZnJvbSBgbWVyZ2VBdHRyc2AsIGhvd2V2ZXIsIGF0IHRoaXMgcG9pbnRcbiAgICAgIC8vIHRoZXkgYXJlIGFscmVhZHkgbWVyZ2VkIGFuZCBpdCB3b3VsZCBub3QgYmUgcG9zc2libGUgdG8gZmlndXJlIHdoaWNoIHByb3BlcnR5IGJlbG9uZ3Mgd2hlcmVcbiAgICAgIC8vIGluIHRoZSBwcmlvcml0eS5cbiAgICAgIHN0eWxpbmdLZXkgPSBjb2xsZWN0U3R5bGluZ0Zyb21EaXJlY3RpdmVzKG51bGwsIHREYXRhLCB0Tm9kZSwgc3R5bGluZ0tleSwgaXNDbGFzc0Jhc2VkKTtcbiAgICAgIHN0eWxpbmdLZXkgPSBjb2xsZWN0U3R5bGluZ0Zyb21UQXR0cnMoc3R5bGluZ0tleSwgdE5vZGUuYXR0cnMsIGlzQ2xhc3NCYXNlZCk7XG4gICAgICAvLyBXZSBrbm93IHRoYXQgaWYgd2UgaGF2ZSBzdHlsaW5nIGJpbmRpbmcgaW4gdGVtcGxhdGUgd2UgY2FuJ3QgaGF2ZSByZXNpZHVhbC5cbiAgICAgIHJlc2lkdWFsID0gbnVsbDtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgLy8gV2UgYXJlIGluIGhvc3QgYmluZGluZyBub2RlIGFuZCB0aGVyZSB3YXMgbm8gYmluZGluZyBpbnN0cnVjdGlvbiBpbiB0ZW1wbGF0ZSBub2RlLlxuICAgIC8vIFRoaXMgbWVhbnMgdGhhdCB3ZSBuZWVkIHRvIGNvbXB1dGUgdGhlIHJlc2lkdWFsLlxuICAgIGNvbnN0IGRpcmVjdGl2ZVN0eWxpbmdMYXN0ID0gdE5vZGUuZGlyZWN0aXZlU3R5bGluZ0xhc3Q7XG4gICAgY29uc3QgaXNGaXJzdFN0eWxpbmdJbnN0cnVjdGlvbkluSG9zdEJpbmRpbmcgPVxuICAgICAgICBkaXJlY3RpdmVTdHlsaW5nTGFzdCA9PT0gLTEgfHwgdERhdGFbZGlyZWN0aXZlU3R5bGluZ0xhc3RdICE9PSBob3N0RGlyZWN0aXZlRGVmO1xuICAgIGlmIChpc0ZpcnN0U3R5bGluZ0luc3RydWN0aW9uSW5Ib3N0QmluZGluZykge1xuICAgICAgc3R5bGluZ0tleSA9XG4gICAgICAgICAgY29sbGVjdFN0eWxpbmdGcm9tRGlyZWN0aXZlcyhob3N0RGlyZWN0aXZlRGVmLCB0RGF0YSwgdE5vZGUsIHN0eWxpbmdLZXksIGlzQ2xhc3NCYXNlZCk7XG4gICAgICBpZiAocmVzaWR1YWwgPT09IG51bGwpIHtcbiAgICAgICAgLy8gLSBJZiBgbnVsbGAgdGhhbiBlaXRoZXI6XG4gICAgICAgIC8vICAgIC0gVGVtcGxhdGUgc3R5bGluZyBpbnN0cnVjdGlvbiBhbHJlYWR5IHJhbiBhbmQgaXQgaGFzIGNvbnN1bWVkIHRoZSBzdGF0aWNcbiAgICAgICAgLy8gICAgICBzdHlsaW5nIGludG8gaXRzIGBUU3R5bGluZ0tleWAgYW5kIHNvIHRoZXJlIGlzIG5vIG5lZWQgdG8gdXBkYXRlIHJlc2lkdWFsLiBJbnN0ZWFkXG4gICAgICAgIC8vICAgICAgd2UgbmVlZCB0byB1cGRhdGUgdGhlIGBUU3R5bGluZ0tleWAgYXNzb2NpYXRlZCB3aXRoIHRoZSBmaXJzdCB0ZW1wbGF0ZSBub2RlXG4gICAgICAgIC8vICAgICAgaW5zdHJ1Y3Rpb24uIE9SXG4gICAgICAgIC8vICAgIC0gU29tZSBvdGhlciBzdHlsaW5nIGluc3RydWN0aW9uIHJhbiBhbmQgZGV0ZXJtaW5lZCB0aGF0IHRoZXJlIGFyZSBubyByZXNpZHVhbHNcbiAgICAgICAgbGV0IHRlbXBsYXRlU3R5bGluZ0tleSA9IGdldFRlbXBsYXRlSGVhZFRTdHlsaW5nS2V5KHREYXRhLCB0Tm9kZSwgaXNDbGFzc0Jhc2VkKTtcbiAgICAgICAgaWYgKHRlbXBsYXRlU3R5bGluZ0tleSAhPT0gdW5kZWZpbmVkICYmIEFycmF5LmlzQXJyYXkodGVtcGxhdGVTdHlsaW5nS2V5KSkge1xuICAgICAgICAgIC8vIE9ubHkgcmVjb21wdXRlIGlmIGB0ZW1wbGF0ZVN0eWxpbmdLZXlgIGhhZCBzdGF0aWMgdmFsdWVzLiAoSWYgbm8gc3RhdGljIHZhbHVlIGZvdW5kXG4gICAgICAgICAgLy8gdGhlbiB0aGVyZSBpcyBub3RoaW5nIHRvIGRvIHNpbmNlIHRoaXMgb3BlcmF0aW9uIGNhbiBvbmx5IHByb2R1Y2UgbGVzcyBzdGF0aWMga2V5cywgbm90XG4gICAgICAgICAgLy8gbW9yZS4pXG4gICAgICAgICAgdGVtcGxhdGVTdHlsaW5nS2V5ID0gY29sbGVjdFN0eWxpbmdGcm9tRGlyZWN0aXZlcyhcbiAgICAgICAgICAgICAgbnVsbCwgdERhdGEsIHROb2RlLCB0ZW1wbGF0ZVN0eWxpbmdLZXlbMV0gLyogdW53cmFwIHByZXZpb3VzIHN0YXRpY3MgKi8sXG4gICAgICAgICAgICAgIGlzQ2xhc3NCYXNlZCk7XG4gICAgICAgICAgdGVtcGxhdGVTdHlsaW5nS2V5ID1cbiAgICAgICAgICAgICAgY29sbGVjdFN0eWxpbmdGcm9tVEF0dHJzKHRlbXBsYXRlU3R5bGluZ0tleSwgdE5vZGUuYXR0cnMsIGlzQ2xhc3NCYXNlZCk7XG4gICAgICAgICAgc2V0VGVtcGxhdGVIZWFkVFN0eWxpbmdLZXkodERhdGEsIHROb2RlLCBpc0NsYXNzQmFzZWQsIHRlbXBsYXRlU3R5bGluZ0tleSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIFdlIG9ubHkgbmVlZCB0byByZWNvbXB1dGUgcmVzaWR1YWwgaWYgaXQgaXMgbm90IGBudWxsYC5cbiAgICAgICAgLy8gLSBJZiBleGlzdGluZyByZXNpZHVhbCAoaW1wbGllcyB0aGVyZSB3YXMgbm8gdGVtcGxhdGUgc3R5bGluZykuIFRoaXMgbWVhbnMgdGhhdCBzb21lIG9mXG4gICAgICAgIC8vICAgdGhlIHN0YXRpY3MgbWF5IGhhdmUgbW92ZWQgZnJvbSB0aGUgcmVzaWR1YWwgdG8gdGhlIGBzdHlsaW5nS2V5YCBhbmQgc28gd2UgaGF2ZSB0b1xuICAgICAgICAvLyAgIHJlY29tcHV0ZS5cbiAgICAgICAgLy8gLSBJZiBgdW5kZWZpbmVkYCB0aGlzIGlzIHRoZSBmaXJzdCB0aW1lIHdlIGFyZSBydW5uaW5nLlxuICAgICAgICByZXNpZHVhbCA9IGNvbGxlY3RSZXNpZHVhbCh0RGF0YSwgdE5vZGUsIGlzQ2xhc3NCYXNlZCk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIGlmIChyZXNpZHVhbCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgaXNDbGFzc0Jhc2VkID8gKHROb2RlLnJlc2lkdWFsQ2xhc3NlcyA9IHJlc2lkdWFsKSA6ICh0Tm9kZS5yZXNpZHVhbFN0eWxlcyA9IHJlc2lkdWFsKTtcbiAgfVxuICByZXR1cm4gc3R5bGluZ0tleTtcbn1cblxuLyoqXG4gKiBSZXRyaWV2ZSB0aGUgYFRTdHlsaW5nS2V5YCBmb3IgdGhlIHRlbXBsYXRlIHN0eWxpbmcgaW5zdHJ1Y3Rpb24uXG4gKlxuICogVGhpcyBpcyBuZWVkZWQgc2luY2UgYGhvc3RCaW5kaW5nYCBzdHlsaW5nIGluc3RydWN0aW9ucyBhcmUgaW5zZXJ0ZWQgYWZ0ZXIgdGhlIHRlbXBsYXRlXG4gKiBpbnN0cnVjdGlvbi4gV2hpbGUgdGhlIHRlbXBsYXRlIGluc3RydWN0aW9uIG5lZWRzIHRvIHVwZGF0ZSB0aGUgcmVzaWR1YWwgaW4gYFROb2RlYCB0aGVcbiAqIGBob3N0QmluZGluZ2AgaW5zdHJ1Y3Rpb25zIG5lZWQgdG8gdXBkYXRlIHRoZSBgVFN0eWxpbmdLZXlgIG9mIHRoZSB0ZW1wbGF0ZSBpbnN0cnVjdGlvbiBiZWNhdXNlXG4gKiB0aGUgdGVtcGxhdGUgaW5zdHJ1Y3Rpb24gaXMgZG93bnN0cmVhbSBmcm9tIHRoZSBgaG9zdEJpbmRpbmdzYCBpbnN0cnVjdGlvbnMuXG4gKlxuICogQHBhcmFtIHREYXRhIGBURGF0YWAgd2hlcmUgdGhlIGxpbmtlZCBsaXN0IGlzIHN0b3JlZC5cbiAqIEBwYXJhbSB0Tm9kZSBgVE5vZGVgIGZvciB3aGljaCB0aGUgc3R5bGluZyBpcyBiZWluZyBjb21wdXRlZC5cbiAqIEBwYXJhbSBpc0NsYXNzQmFzZWQgYHRydWVgIGlmIGBjbGFzc2AgKGBmYWxzZWAgaWYgYHN0eWxlYClcbiAqIEByZXR1cm4gYFRTdHlsaW5nS2V5YCBpZiBmb3VuZCBvciBgdW5kZWZpbmVkYCBpZiBub3QgZm91bmQuXG4gKi9cbmZ1bmN0aW9uIGdldFRlbXBsYXRlSGVhZFRTdHlsaW5nS2V5KHREYXRhOiBURGF0YSwgdE5vZGU6IFROb2RlLCBpc0NsYXNzQmFzZWQ6IGJvb2xlYW4pOiBUU3R5bGluZ0tleXxcbiAgICB1bmRlZmluZWQge1xuICBjb25zdCBiaW5kaW5ncyA9IGlzQ2xhc3NCYXNlZCA/IHROb2RlLmNsYXNzQmluZGluZ3MgOiB0Tm9kZS5zdHlsZUJpbmRpbmdzO1xuICBpZiAoZ2V0VFN0eWxpbmdSYW5nZU5leHQoYmluZGluZ3MpID09PSAwKSB7XG4gICAgLy8gVGhlcmUgZG9lcyBub3Qgc2VlbSB0byBiZSBhIHN0eWxpbmcgaW5zdHJ1Y3Rpb24gaW4gdGhlIGB0ZW1wbGF0ZWAuXG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxuICByZXR1cm4gdERhdGFbZ2V0VFN0eWxpbmdSYW5nZVByZXYoYmluZGluZ3MpXSBhcyBUU3R5bGluZ0tleTtcbn1cblxuLyoqXG4gKiBVcGRhdGUgdGhlIGBUU3R5bGluZ0tleWAgb2YgdGhlIGZpcnN0IHRlbXBsYXRlIGluc3RydWN0aW9uIGluIGBUTm9kZWAuXG4gKlxuICogTG9naWNhbGx5IGBob3N0QmluZGluZ3NgIHN0eWxpbmcgaW5zdHJ1Y3Rpb25zIGFyZSBvZiBsb3dlciBwcmlvcml0eSB0aGFuIHRoYXQgb2YgdGhlIHRlbXBsYXRlLlxuICogSG93ZXZlciwgdGhleSBleGVjdXRlIGFmdGVyIHRoZSB0ZW1wbGF0ZSBzdHlsaW5nIGluc3RydWN0aW9ucy4gVGhpcyBtZWFucyB0aGF0IHRoZXkgZ2V0IGluc2VydGVkXG4gKiBpbiBmcm9udCBvZiB0aGUgdGVtcGxhdGUgc3R5bGluZyBpbnN0cnVjdGlvbnMuXG4gKlxuICogSWYgd2UgaGF2ZSBhIHRlbXBsYXRlIHN0eWxpbmcgaW5zdHJ1Y3Rpb24gYW5kIGEgbmV3IGBob3N0QmluZGluZ3NgIHN0eWxpbmcgaW5zdHJ1Y3Rpb24gaXNcbiAqIGV4ZWN1dGVkIGl0IG1lYW5zIHRoYXQgaXQgbWF5IG5lZWQgdG8gc3RlYWwgc3RhdGljIGZpZWxkcyBmcm9tIHRoZSB0ZW1wbGF0ZSBpbnN0cnVjdGlvbi4gVGhpc1xuICogbWV0aG9kIGFsbG93cyB1cyB0byB1cGRhdGUgdGhlIGZpcnN0IHRlbXBsYXRlIGluc3RydWN0aW9uIGBUU3R5bGluZ0tleWAgd2l0aCBhIG5ldyB2YWx1ZS5cbiAqXG4gKiBBc3N1bWU6XG4gKiBgYGBcbiAqIDxkaXYgbXktZGlyIHN0eWxlPVwiY29sb3I6IHJlZFwiIFtzdHlsZS5jb2xvcl09XCJ0bXBsRXhwXCI+PC9kaXY+XG4gKlxuICogQERpcmVjdGl2ZSh7XG4gKiAgIGhvc3Q6IHtcbiAqICAgICAnc3R5bGUnOiAnd2lkdGg6IDEwMHB4JyxcbiAqICAgICAnW3N0eWxlLmNvbG9yXSc6ICdkaXJFeHAnLFxuICogICB9XG4gKiB9KVxuICogY2xhc3MgTXlEaXIge31cbiAqIGBgYFxuICpcbiAqIHdoZW4gYFtzdHlsZS5jb2xvcl09XCJ0bXBsRXhwXCJgIGV4ZWN1dGVzIGl0IGNyZWF0ZXMgdGhpcyBkYXRhIHN0cnVjdHVyZS5cbiAqIGBgYFxuICogIFsnJywgJ2NvbG9yJywgJ2NvbG9yJywgJ3JlZCcsICd3aWR0aCcsICcxMDBweCddLFxuICogYGBgXG4gKlxuICogVGhlIHJlYXNvbiBmb3IgdGhpcyBpcyB0aGF0IHRoZSB0ZW1wbGF0ZSBpbnN0cnVjdGlvbiBkb2VzIG5vdCBrbm93IGlmIHRoZXJlIGFyZSBzdHlsaW5nXG4gKiBpbnN0cnVjdGlvbnMgYW5kIG11c3QgYXNzdW1lIHRoYXQgdGhlcmUgYXJlIG5vbmUgYW5kIG11c3QgY29sbGVjdCBhbGwgb2YgdGhlIHN0YXRpYyBzdHlsaW5nLlxuICogKGJvdGhcbiAqIGBjb2xvcicgYW5kICd3aWR0aGApXG4gKlxuICogV2hlbiBgJ1tzdHlsZS5jb2xvcl0nOiAnZGlyRXhwJyxgIGV4ZWN1dGVzIHdlIG5lZWQgdG8gaW5zZXJ0IGEgbmV3IGRhdGEgaW50byB0aGUgbGlua2VkIGxpc3QuXG4gKiBgYGBcbiAqICBbJycsICdjb2xvcicsICd3aWR0aCcsICcxMDBweCddLCAgLy8gbmV3bHkgaW5zZXJ0ZWRcbiAqICBbJycsICdjb2xvcicsICdjb2xvcicsICdyZWQnLCAnd2lkdGgnLCAnMTAwcHgnXSwgLy8gdGhpcyBpcyB3cm9uZ1xuICogYGBgXG4gKlxuICogTm90aWNlIHRoYXQgdGhlIHRlbXBsYXRlIHN0YXRpY3MgaXMgbm93IHdyb25nIGFzIGl0IGluY29ycmVjdGx5IGNvbnRhaW5zIGB3aWR0aGAgc28gd2UgbmVlZCB0b1xuICogdXBkYXRlIGl0IGxpa2Ugc286XG4gKiBgYGBcbiAqICBbJycsICdjb2xvcicsICd3aWR0aCcsICcxMDBweCddLFxuICogIFsnJywgJ2NvbG9yJywgJ2NvbG9yJywgJ3JlZCddLCAgICAvLyBVUERBVEVcbiAqIGBgYFxuICpcbiAqIEBwYXJhbSB0RGF0YSBgVERhdGFgIHdoZXJlIHRoZSBsaW5rZWQgbGlzdCBpcyBzdG9yZWQuXG4gKiBAcGFyYW0gdE5vZGUgYFROb2RlYCBmb3Igd2hpY2ggdGhlIHN0eWxpbmcgaXMgYmVpbmcgY29tcHV0ZWQuXG4gKiBAcGFyYW0gaXNDbGFzc0Jhc2VkIGB0cnVlYCBpZiBgY2xhc3NgIChgZmFsc2VgIGlmIGBzdHlsZWApXG4gKiBAcGFyYW0gdFN0eWxpbmdLZXkgTmV3IGBUU3R5bGluZ0tleWAgd2hpY2ggaXMgcmVwbGFjaW5nIHRoZSBvbGQgb25lLlxuICovXG5mdW5jdGlvbiBzZXRUZW1wbGF0ZUhlYWRUU3R5bGluZ0tleShcbiAgICB0RGF0YTogVERhdGEsIHROb2RlOiBUTm9kZSwgaXNDbGFzc0Jhc2VkOiBib29sZWFuLCB0U3R5bGluZ0tleTogVFN0eWxpbmdLZXkpOiB2b2lkIHtcbiAgY29uc3QgYmluZGluZ3MgPSBpc0NsYXNzQmFzZWQgPyB0Tm9kZS5jbGFzc0JpbmRpbmdzIDogdE5vZGUuc3R5bGVCaW5kaW5ncztcbiAgbmdEZXZNb2RlICYmXG4gICAgICBhc3NlcnROb3RFcXVhbChcbiAgICAgICAgICBnZXRUU3R5bGluZ1JhbmdlTmV4dChiaW5kaW5ncyksIDAsXG4gICAgICAgICAgJ0V4cGVjdGluZyB0byBoYXZlIGF0IGxlYXN0IG9uZSB0ZW1wbGF0ZSBzdHlsaW5nIGJpbmRpbmcuJyk7XG4gIHREYXRhW2dldFRTdHlsaW5nUmFuZ2VQcmV2KGJpbmRpbmdzKV0gPSB0U3R5bGluZ0tleTtcbn1cblxuLyoqXG4gKiBDb2xsZWN0IGFsbCBzdGF0aWMgdmFsdWVzIGFmdGVyIHRoZSBjdXJyZW50IGBUTm9kZS5kaXJlY3RpdmVTdHlsaW5nTGFzdGAgaW5kZXguXG4gKlxuICogQ29sbGVjdCB0aGUgcmVtYWluaW5nIHN0eWxpbmcgaW5mb3JtYXRpb24gd2hpY2ggaGFzIG5vdCB5ZXQgYmVlbiBjb2xsZWN0ZWQgYnkgYW4gZXhpc3RpbmdcbiAqIHN0eWxpbmcgaW5zdHJ1Y3Rpb24uXG4gKlxuICogQHBhcmFtIHREYXRhIGBURGF0YWAgd2hlcmUgdGhlIGBEaXJlY3RpdmVEZWZzYCBhcmUgc3RvcmVkLlxuICogQHBhcmFtIHROb2RlIGBUTm9kZWAgd2hpY2ggY29udGFpbnMgdGhlIGRpcmVjdGl2ZSByYW5nZS5cbiAqIEBwYXJhbSBpc0NsYXNzQmFzZWQgYHRydWVgIGlmIGBjbGFzc2AgKGBmYWxzZWAgaWYgYHN0eWxlYClcbiAqL1xuZnVuY3Rpb24gY29sbGVjdFJlc2lkdWFsKHREYXRhOiBURGF0YSwgdE5vZGU6IFROb2RlLCBpc0NsYXNzQmFzZWQ6IGJvb2xlYW4pOiBLZXlWYWx1ZUFycmF5PGFueT58XG4gICAgbnVsbCB7XG4gIGxldCByZXNpZHVhbDogS2V5VmFsdWVBcnJheTxhbnk+fG51bGx8dW5kZWZpbmVkID0gdW5kZWZpbmVkO1xuICBjb25zdCBkaXJlY3RpdmVFbmQgPSB0Tm9kZS5kaXJlY3RpdmVFbmQ7XG4gIG5nRGV2TW9kZSAmJlxuICAgICAgYXNzZXJ0Tm90RXF1YWwoXG4gICAgICAgICAgdE5vZGUuZGlyZWN0aXZlU3R5bGluZ0xhc3QsIC0xLFxuICAgICAgICAgICdCeSB0aGUgdGltZSB0aGlzIGZ1bmN0aW9uIGdldHMgY2FsbGVkIGF0IGxlYXN0IG9uZSBob3N0QmluZGluZ3Mtbm9kZSBzdHlsaW5nIGluc3RydWN0aW9uIG11c3QgaGF2ZSBleGVjdXRlZC4nKTtcbiAgLy8gV2UgYWRkIGAxICsgdE5vZGUuZGlyZWN0aXZlU3RhcnRgIGJlY2F1c2Ugd2UgbmVlZCB0byBza2lwIHRoZSBjdXJyZW50IGRpcmVjdGl2ZSAoYXMgd2UgYXJlXG4gIC8vIGNvbGxlY3RpbmcgdGhpbmdzIGFmdGVyIHRoZSBsYXN0IGBob3N0QmluZGluZ3NgIGRpcmVjdGl2ZSB3aGljaCBoYWQgYSBzdHlsaW5nIGluc3RydWN0aW9uLilcbiAgZm9yIChsZXQgaSA9IDEgKyB0Tm9kZS5kaXJlY3RpdmVTdHlsaW5nTGFzdDsgaSA8IGRpcmVjdGl2ZUVuZDsgaSsrKSB7XG4gICAgY29uc3QgYXR0cnMgPSAodERhdGFbaV0gYXMgRGlyZWN0aXZlRGVmPGFueT4pLmhvc3RBdHRycztcbiAgICByZXNpZHVhbCA9IGNvbGxlY3RTdHlsaW5nRnJvbVRBdHRycyhyZXNpZHVhbCwgYXR0cnMsIGlzQ2xhc3NCYXNlZCkgYXMgS2V5VmFsdWVBcnJheTxhbnk+fCBudWxsO1xuICB9XG4gIHJldHVybiBjb2xsZWN0U3R5bGluZ0Zyb21UQXR0cnMocmVzaWR1YWwsIHROb2RlLmF0dHJzLCBpc0NsYXNzQmFzZWQpIGFzIEtleVZhbHVlQXJyYXk8YW55PnwgbnVsbDtcbn1cblxuLyoqXG4gKiBDb2xsZWN0IHRoZSBzdGF0aWMgc3R5bGluZyBpbmZvcm1hdGlvbiB3aXRoIGxvd2VyIHByaW9yaXR5IHRoYW4gYGhvc3REaXJlY3RpdmVEZWZgLlxuICpcbiAqIChUaGlzIGlzIG9wcG9zaXRlIG9mIHJlc2lkdWFsIHN0eWxpbmcuKVxuICpcbiAqIEBwYXJhbSBob3N0RGlyZWN0aXZlRGVmIGBEaXJlY3RpdmVEZWZgIGZvciB3aGljaCB3ZSB3YW50IHRvIGNvbGxlY3QgbG93ZXIgcHJpb3JpdHkgc3RhdGljXG4gKiAgICAgICAgc3R5bGluZy4gKE9yIGBudWxsYCBpZiB0ZW1wbGF0ZSBzdHlsaW5nKVxuICogQHBhcmFtIHREYXRhIGBURGF0YWAgd2hlcmUgdGhlIGxpbmtlZCBsaXN0IGlzIHN0b3JlZC5cbiAqIEBwYXJhbSB0Tm9kZSBgVE5vZGVgIGZvciB3aGljaCB0aGUgc3R5bGluZyBpcyBiZWluZyBjb21wdXRlZC5cbiAqIEBwYXJhbSBzdHlsaW5nS2V5IEV4aXN0aW5nIGBUU3R5bGluZ0tleWAgdG8gdXBkYXRlIG9yIHdyYXAuXG4gKiBAcGFyYW0gaXNDbGFzc0Jhc2VkIGB0cnVlYCBpZiBgY2xhc3NgIChgZmFsc2VgIGlmIGBzdHlsZWApXG4gKi9cbmZ1bmN0aW9uIGNvbGxlY3RTdHlsaW5nRnJvbURpcmVjdGl2ZXMoXG4gICAgaG9zdERpcmVjdGl2ZURlZjogRGlyZWN0aXZlRGVmPGFueT58bnVsbCwgdERhdGE6IFREYXRhLCB0Tm9kZTogVE5vZGUsIHN0eWxpbmdLZXk6IFRTdHlsaW5nS2V5LFxuICAgIGlzQ2xhc3NCYXNlZDogYm9vbGVhbik6IFRTdHlsaW5nS2V5IHtcbiAgLy8gV2UgbmVlZCB0byBsb29wIGJlY2F1c2UgdGhlcmUgY2FuIGJlIGRpcmVjdGl2ZXMgd2hpY2ggaGF2ZSBgaG9zdEF0dHJzYCBidXQgZG9uJ3QgaGF2ZVxuICAvLyBgaG9zdEJpbmRpbmdzYCBzbyB0aGlzIGxvb3AgY2F0Y2hlcyB1cCB0byB0aGUgY3VycmVudCBkaXJlY3RpdmUuLlxuICBsZXQgY3VycmVudERpcmVjdGl2ZTogRGlyZWN0aXZlRGVmPGFueT58bnVsbCA9IG51bGw7XG4gIGNvbnN0IGRpcmVjdGl2ZUVuZCA9IHROb2RlLmRpcmVjdGl2ZUVuZDtcbiAgbGV0IGRpcmVjdGl2ZVN0eWxpbmdMYXN0ID0gdE5vZGUuZGlyZWN0aXZlU3R5bGluZ0xhc3Q7XG4gIGlmIChkaXJlY3RpdmVTdHlsaW5nTGFzdCA9PT0gLTEpIHtcbiAgICBkaXJlY3RpdmVTdHlsaW5nTGFzdCA9IHROb2RlLmRpcmVjdGl2ZVN0YXJ0O1xuICB9IGVsc2Uge1xuICAgIGRpcmVjdGl2ZVN0eWxpbmdMYXN0Kys7XG4gIH1cbiAgd2hpbGUgKGRpcmVjdGl2ZVN0eWxpbmdMYXN0IDwgZGlyZWN0aXZlRW5kKSB7XG4gICAgY3VycmVudERpcmVjdGl2ZSA9IHREYXRhW2RpcmVjdGl2ZVN0eWxpbmdMYXN0XSBhcyBEaXJlY3RpdmVEZWY8YW55PjtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChjdXJyZW50RGlyZWN0aXZlLCAnZXhwZWN0ZWQgdG8gYmUgZGVmaW5lZCcpO1xuICAgIHN0eWxpbmdLZXkgPSBjb2xsZWN0U3R5bGluZ0Zyb21UQXR0cnMoc3R5bGluZ0tleSwgY3VycmVudERpcmVjdGl2ZS5ob3N0QXR0cnMsIGlzQ2xhc3NCYXNlZCk7XG4gICAgaWYgKGN1cnJlbnREaXJlY3RpdmUgPT09IGhvc3REaXJlY3RpdmVEZWYpIGJyZWFrO1xuICAgIGRpcmVjdGl2ZVN0eWxpbmdMYXN0Kys7XG4gIH1cbiAgaWYgKGhvc3REaXJlY3RpdmVEZWYgIT09IG51bGwpIHtcbiAgICAvLyB3ZSBvbmx5IGFkdmFuY2UgdGhlIHN0eWxpbmcgY3Vyc29yIGlmIHdlIGFyZSBjb2xsZWN0aW5nIGRhdGEgZnJvbSBob3N0IGJpbmRpbmdzLlxuICAgIC8vIFRlbXBsYXRlIGV4ZWN1dGVzIGJlZm9yZSBob3N0IGJpbmRpbmdzIGFuZCBzbyBpZiB3ZSB3b3VsZCB1cGRhdGUgdGhlIGluZGV4LFxuICAgIC8vIGhvc3QgYmluZGluZ3Mgd291bGQgbm90IGdldCB0aGVpciBzdGF0aWNzLlxuICAgIHROb2RlLmRpcmVjdGl2ZVN0eWxpbmdMYXN0ID0gZGlyZWN0aXZlU3R5bGluZ0xhc3Q7XG4gIH1cbiAgcmV0dXJuIHN0eWxpbmdLZXk7XG59XG5cbi8qKlxuICogQ29udmVydCBgVEF0dHJzYCBpbnRvIGBUU3R5bGluZ1N0YXRpY2AuXG4gKlxuICogQHBhcmFtIHN0eWxpbmdLZXkgZXhpc3RpbmcgYFRTdHlsaW5nS2V5YCB0byB1cGRhdGUgb3Igd3JhcC5cbiAqIEBwYXJhbSBhdHRycyBgVEF0dHJpYnV0ZXNgIHRvIHByb2Nlc3MuXG4gKiBAcGFyYW0gaXNDbGFzc0Jhc2VkIGB0cnVlYCBpZiBgY2xhc3NgIChgZmFsc2VgIGlmIGBzdHlsZWApXG4gKi9cbmZ1bmN0aW9uIGNvbGxlY3RTdHlsaW5nRnJvbVRBdHRycyhcbiAgICBzdHlsaW5nS2V5OiBUU3R5bGluZ0tleXx1bmRlZmluZWQsIGF0dHJzOiBUQXR0cmlidXRlc3xudWxsLFxuICAgIGlzQ2xhc3NCYXNlZDogYm9vbGVhbik6IFRTdHlsaW5nS2V5IHtcbiAgY29uc3QgZGVzaXJlZE1hcmtlciA9IGlzQ2xhc3NCYXNlZCA/IEF0dHJpYnV0ZU1hcmtlci5DbGFzc2VzIDogQXR0cmlidXRlTWFya2VyLlN0eWxlcztcbiAgbGV0IGN1cnJlbnRNYXJrZXIgPSBBdHRyaWJ1dGVNYXJrZXIuSW1wbGljaXRBdHRyaWJ1dGVzO1xuICBpZiAoYXR0cnMgIT09IG51bGwpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGF0dHJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBpdGVtID0gYXR0cnNbaV0gYXMgbnVtYmVyIHwgc3RyaW5nO1xuICAgICAgaWYgKHR5cGVvZiBpdGVtID09PSAnbnVtYmVyJykge1xuICAgICAgICBjdXJyZW50TWFya2VyID0gaXRlbTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChjdXJyZW50TWFya2VyID09PSBkZXNpcmVkTWFya2VyKSB7XG4gICAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KHN0eWxpbmdLZXkpKSB7XG4gICAgICAgICAgICBzdHlsaW5nS2V5ID0gc3R5bGluZ0tleSA9PT0gdW5kZWZpbmVkID8gW10gOiBbJycsIHN0eWxpbmdLZXldIGFzIGFueTtcbiAgICAgICAgICB9XG4gICAgICAgICAga2V5VmFsdWVBcnJheVNldChcbiAgICAgICAgICAgICAgc3R5bGluZ0tleSBhcyBLZXlWYWx1ZUFycmF5PGFueT4sIGl0ZW0sIGlzQ2xhc3NCYXNlZCA/IHRydWUgOiBhdHRyc1srK2ldKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gc3R5bGluZ0tleSA9PT0gdW5kZWZpbmVkID8gbnVsbCA6IHN0eWxpbmdLZXk7XG59XG5cbi8qKlxuICogQ29udmVydCB1c2VyIGlucHV0IHRvIGBLZXlWYWx1ZUFycmF5YC5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIHRha2VzIHVzZXIgaW5wdXQgd2hpY2ggY291bGQgYmUgYHN0cmluZ2AsIE9iamVjdCBsaXRlcmFsLCBvciBpdGVyYWJsZSBhbmQgY29udmVydHNcbiAqIGl0IGludG8gYSBjb25zaXN0ZW50IHJlcHJlc2VudGF0aW9uLiBUaGUgb3V0cHV0IG9mIHRoaXMgaXMgYEtleVZhbHVlQXJyYXlgICh3aGljaCBpcyBhbiBhcnJheVxuICogd2hlcmVcbiAqIGV2ZW4gaW5kZXhlcyBjb250YWluIGtleXMgYW5kIG9kZCBpbmRleGVzIGNvbnRhaW4gdmFsdWVzIGZvciB0aG9zZSBrZXlzKS5cbiAqXG4gKiBUaGUgYWR2YW50YWdlIG9mIGNvbnZlcnRpbmcgdG8gYEtleVZhbHVlQXJyYXlgIGlzIHRoYXQgd2UgY2FuIHBlcmZvcm0gZGlmZiBpbiBhbiBpbnB1dFxuICogaW5kZXBlbmRlbnRcbiAqIHdheS5cbiAqIChpZSB3ZSBjYW4gY29tcGFyZSBgZm9vIGJhcmAgdG8gYFsnYmFyJywgJ2JheiddIGFuZCBkZXRlcm1pbmUgYSBzZXQgb2YgY2hhbmdlcyB3aGljaCBuZWVkIHRvIGJlXG4gKiBhcHBsaWVkKVxuICpcbiAqIFRoZSBmYWN0IHRoYXQgYEtleVZhbHVlQXJyYXlgIGlzIHNvcnRlZCBpcyB2ZXJ5IGltcG9ydGFudCBiZWNhdXNlIGl0IGFsbG93cyB1cyB0byBjb21wdXRlIHRoZVxuICogZGlmZmVyZW5jZSBpbiBsaW5lYXIgZmFzaGlvbiB3aXRob3V0IHRoZSBuZWVkIHRvIGFsbG9jYXRlIGFueSBhZGRpdGlvbmFsIGRhdGEuXG4gKlxuICogRm9yIGV4YW1wbGUgaWYgd2Uga2VwdCB0aGlzIGFzIGEgYE1hcGAgd2Ugd291bGQgaGF2ZSB0byBpdGVyYXRlIG92ZXIgcHJldmlvdXMgYE1hcGAgdG8gZGV0ZXJtaW5lXG4gKiB3aGljaCB2YWx1ZXMgbmVlZCB0byBiZSBkZWxldGVkLCBvdmVyIHRoZSBuZXcgYE1hcGAgdG8gZGV0ZXJtaW5lIGFkZGl0aW9ucywgYW5kIHdlIHdvdWxkIGhhdmUgdG9cbiAqIGtlZXAgYWRkaXRpb25hbCBgTWFwYCB0byBrZWVwIHRyYWNrIG9mIGR1cGxpY2F0ZXMgb3IgaXRlbXMgd2hpY2ggaGF2ZSBub3QgeWV0IGJlZW4gdmlzaXRlZC5cbiAqXG4gKiBAcGFyYW0ga2V5VmFsdWVBcnJheVNldCAoU2VlIGBrZXlWYWx1ZUFycmF5U2V0YCBpbiBcInV0aWwvYXJyYXlfdXRpbHNcIikgR2V0cyBwYXNzZWQgaW4gYXMgYVxuICogICAgICAgIGZ1bmN0aW9uIHNvIHRoYXQgYHN0eWxlYCBjYW4gYmUgcHJvY2Vzc2VkLiBUaGlzIGlzIGRvbmVcbiAqICAgICAgICBmb3IgdHJlZSBzaGFraW5nIHB1cnBvc2VzLlxuICogQHBhcmFtIHN0cmluZ1BhcnNlciBUaGUgcGFyc2VyIGlzIHBhc3NlZCBpbiBzbyB0aGF0IGl0IHdpbGwgYmUgdHJlZSBzaGFrYWJsZS4gU2VlXG4gKiAgICAgICAgYHN0eWxlU3RyaW5nUGFyc2VyYCBhbmQgYGNsYXNzU3RyaW5nUGFyc2VyYFxuICogQHBhcmFtIHZhbHVlIFRoZSB2YWx1ZSB0byBwYXJzZS9jb252ZXJ0IHRvIGBLZXlWYWx1ZUFycmF5YFxuICovXG5leHBvcnQgZnVuY3Rpb24gdG9TdHlsaW5nS2V5VmFsdWVBcnJheShcbiAgICBrZXlWYWx1ZUFycmF5U2V0OiAoa2V5VmFsdWVBcnJheTogS2V5VmFsdWVBcnJheTxhbnk+LCBrZXk6IHN0cmluZywgdmFsdWU6IGFueSkgPT4gdm9pZCxcbiAgICBzdHJpbmdQYXJzZXI6IChzdHlsZUtleVZhbHVlQXJyYXk6IEtleVZhbHVlQXJyYXk8YW55PiwgdGV4dDogc3RyaW5nKSA9PiB2b2lkLFxuICAgIHZhbHVlOiBzdHJpbmd8c3RyaW5nW118e1trZXk6IHN0cmluZ106IGFueX18U2FmZVZhbHVlfG51bGx8dW5kZWZpbmVkKTogS2V5VmFsdWVBcnJheTxhbnk+IHtcbiAgaWYgKHZhbHVlID09IG51bGwgLyp8fCB2YWx1ZSA9PT0gdW5kZWZpbmVkICovIHx8IHZhbHVlID09PSAnJykgcmV0dXJuIEVNUFRZX0FSUkFZIGFzIGFueTtcbiAgY29uc3Qgc3R5bGVLZXlWYWx1ZUFycmF5OiBLZXlWYWx1ZUFycmF5PGFueT4gPSBbXSBhcyBhbnk7XG4gIGNvbnN0IHVud3JhcHBlZFZhbHVlID0gdW53cmFwU2FmZVZhbHVlKHZhbHVlKSBhcyBzdHJpbmcgfCBzdHJpbmdbXSB8IHtba2V5OiBzdHJpbmddOiBhbnl9O1xuICBpZiAoQXJyYXkuaXNBcnJheSh1bndyYXBwZWRWYWx1ZSkpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHVud3JhcHBlZFZhbHVlLmxlbmd0aDsgaSsrKSB7XG4gICAgICBrZXlWYWx1ZUFycmF5U2V0KHN0eWxlS2V5VmFsdWVBcnJheSwgdW53cmFwcGVkVmFsdWVbaV0sIHRydWUpO1xuICAgIH1cbiAgfSBlbHNlIGlmICh0eXBlb2YgdW53cmFwcGVkVmFsdWUgPT09ICdvYmplY3QnKSB7XG4gICAgZm9yIChjb25zdCBrZXkgaW4gdW53cmFwcGVkVmFsdWUpIHtcbiAgICAgIGlmICh1bndyYXBwZWRWYWx1ZS5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgIGtleVZhbHVlQXJyYXlTZXQoc3R5bGVLZXlWYWx1ZUFycmF5LCBrZXksIHVud3JhcHBlZFZhbHVlW2tleV0pO1xuICAgICAgfVxuICAgIH1cbiAgfSBlbHNlIGlmICh0eXBlb2YgdW53cmFwcGVkVmFsdWUgPT09ICdzdHJpbmcnKSB7XG4gICAgc3RyaW5nUGFyc2VyKHN0eWxlS2V5VmFsdWVBcnJheSwgdW53cmFwcGVkVmFsdWUpO1xuICB9IGVsc2Uge1xuICAgIG5nRGV2TW9kZSAmJlxuICAgICAgICB0aHJvd0Vycm9yKCdVbnN1cHBvcnRlZCBzdHlsaW5nIHR5cGUgJyArIHR5cGVvZiB1bndyYXBwZWRWYWx1ZSArICc6ICcgKyB1bndyYXBwZWRWYWx1ZSk7XG4gIH1cbiAgcmV0dXJuIHN0eWxlS2V5VmFsdWVBcnJheTtcbn1cblxuLyoqXG4gKiBTZXQgYSBgdmFsdWVgIGZvciBhIGBrZXlgLlxuICpcbiAqIFNlZTogYGtleVZhbHVlQXJyYXlTZXRgIGZvciBkZXRhaWxzXG4gKlxuICogQHBhcmFtIGtleVZhbHVlQXJyYXkgS2V5VmFsdWVBcnJheSB0byBhZGQgdG8uXG4gKiBAcGFyYW0ga2V5IFN0eWxlIGtleSB0byBhZGQuXG4gKiBAcGFyYW0gdmFsdWUgVGhlIHZhbHVlIHRvIHNldC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHN0eWxlS2V5VmFsdWVBcnJheVNldChrZXlWYWx1ZUFycmF5OiBLZXlWYWx1ZUFycmF5PGFueT4sIGtleTogc3RyaW5nLCB2YWx1ZTogYW55KSB7XG4gIGtleVZhbHVlQXJyYXlTZXQoa2V5VmFsdWVBcnJheSwga2V5LCB1bndyYXBTYWZlVmFsdWUodmFsdWUpKTtcbn1cblxuLyoqXG4gKiBVcGRhdGUgbWFwIGJhc2VkIHN0eWxpbmcuXG4gKlxuICogTWFwIGJhc2VkIHN0eWxpbmcgY291bGQgYmUgYW55dGhpbmcgd2hpY2ggY29udGFpbnMgbW9yZSB0aGFuIG9uZSBiaW5kaW5nLiBGb3IgZXhhbXBsZSBgc3RyaW5nYCxcbiAqIG9yIG9iamVjdCBsaXRlcmFsLiBEZWFsaW5nIHdpdGggYWxsIG9mIHRoZXNlIHR5cGVzIHdvdWxkIGNvbXBsaWNhdGUgdGhlIGxvZ2ljIHNvXG4gKiBpbnN0ZWFkIHRoaXMgZnVuY3Rpb24gZXhwZWN0cyB0aGF0IHRoZSBjb21wbGV4IGlucHV0IGlzIGZpcnN0IGNvbnZlcnRlZCBpbnRvIG5vcm1hbGl6ZWRcbiAqIGBLZXlWYWx1ZUFycmF5YC4gVGhlIGFkdmFudGFnZSBvZiBub3JtYWxpemF0aW9uIGlzIHRoYXQgd2UgZ2V0IHRoZSB2YWx1ZXMgc29ydGVkLCB3aGljaCBtYWtlcyBpdFxuICogdmVyeSBjaGVhcCB0byBjb21wdXRlIGRlbHRhcyBiZXR3ZWVuIHRoZSBwcmV2aW91cyBhbmQgY3VycmVudCB2YWx1ZS5cbiAqXG4gKiBAcGFyYW0gdFZpZXcgQXNzb2NpYXRlZCBgVFZpZXcuZGF0YWAgY29udGFpbnMgdGhlIGxpbmtlZCBsaXN0IG9mIGJpbmRpbmcgcHJpb3JpdGllcy5cbiAqIEBwYXJhbSB0Tm9kZSBgVE5vZGVgIHdoZXJlIHRoZSBiaW5kaW5nIGlzIGxvY2F0ZWQuXG4gKiBAcGFyYW0gbFZpZXcgYExWaWV3YCBjb250YWlucyB0aGUgdmFsdWVzIGFzc29jaWF0ZWQgd2l0aCBvdGhlciBzdHlsaW5nIGJpbmRpbmcgYXQgdGhpcyBgVE5vZGVgLlxuICogQHBhcmFtIHJlbmRlcmVyIFJlbmRlcmVyIHRvIHVzZSBpZiBhbnkgdXBkYXRlcy5cbiAqIEBwYXJhbSBvbGRLZXlWYWx1ZUFycmF5IFByZXZpb3VzIHZhbHVlIHJlcHJlc2VudGVkIGFzIGBLZXlWYWx1ZUFycmF5YFxuICogQHBhcmFtIG5ld0tleVZhbHVlQXJyYXkgQ3VycmVudCB2YWx1ZSByZXByZXNlbnRlZCBhcyBgS2V5VmFsdWVBcnJheWBcbiAqIEBwYXJhbSBpc0NsYXNzQmFzZWQgYHRydWVgIGlmIGBjbGFzc2AgKGBmYWxzZWAgaWYgYHN0eWxlYClcbiAqIEBwYXJhbSBiaW5kaW5nSW5kZXggQmluZGluZyBpbmRleCBvZiB0aGUgYmluZGluZy5cbiAqL1xuZnVuY3Rpb24gdXBkYXRlU3R5bGluZ01hcChcbiAgICB0VmlldzogVFZpZXcsIHROb2RlOiBUTm9kZSwgbFZpZXc6IExWaWV3LCByZW5kZXJlcjogUmVuZGVyZXIzLFxuICAgIG9sZEtleVZhbHVlQXJyYXk6IEtleVZhbHVlQXJyYXk8YW55PiwgbmV3S2V5VmFsdWVBcnJheTogS2V5VmFsdWVBcnJheTxhbnk+LFxuICAgIGlzQ2xhc3NCYXNlZDogYm9vbGVhbiwgYmluZGluZ0luZGV4OiBudW1iZXIpIHtcbiAgaWYgKG9sZEtleVZhbHVlQXJyYXkgYXMgS2V5VmFsdWVBcnJheTxhbnk+fCBOT19DSEFOR0UgPT09IE5PX0NIQU5HRSkge1xuICAgIC8vIE9uIGZpcnN0IGV4ZWN1dGlvbiB0aGUgb2xkS2V5VmFsdWVBcnJheSBpcyBOT19DSEFOR0UgPT4gdHJlYXQgaXQgYXMgZW1wdHkgS2V5VmFsdWVBcnJheS5cbiAgICBvbGRLZXlWYWx1ZUFycmF5ID0gRU1QVFlfQVJSQVkgYXMgYW55O1xuICB9XG4gIGxldCBvbGRJbmRleCA9IDA7XG4gIGxldCBuZXdJbmRleCA9IDA7XG4gIGxldCBvbGRLZXk6IHN0cmluZ3xudWxsID0gMCA8IG9sZEtleVZhbHVlQXJyYXkubGVuZ3RoID8gb2xkS2V5VmFsdWVBcnJheVswXSA6IG51bGw7XG4gIGxldCBuZXdLZXk6IHN0cmluZ3xudWxsID0gMCA8IG5ld0tleVZhbHVlQXJyYXkubGVuZ3RoID8gbmV3S2V5VmFsdWVBcnJheVswXSA6IG51bGw7XG4gIHdoaWxlIChvbGRLZXkgIT09IG51bGwgfHwgbmV3S2V5ICE9PSBudWxsKSB7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydExlc3NUaGFuKG9sZEluZGV4LCA5OTksICdBcmUgd2Ugc3R1Y2sgaW4gaW5maW5pdGUgbG9vcD8nKTtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0TGVzc1RoYW4obmV3SW5kZXgsIDk5OSwgJ0FyZSB3ZSBzdHVjayBpbiBpbmZpbml0ZSBsb29wPycpO1xuICAgIGNvbnN0IG9sZFZhbHVlID1cbiAgICAgICAgb2xkSW5kZXggPCBvbGRLZXlWYWx1ZUFycmF5Lmxlbmd0aCA/IG9sZEtleVZhbHVlQXJyYXlbb2xkSW5kZXggKyAxXSA6IHVuZGVmaW5lZDtcbiAgICBjb25zdCBuZXdWYWx1ZSA9XG4gICAgICAgIG5ld0luZGV4IDwgbmV3S2V5VmFsdWVBcnJheS5sZW5ndGggPyBuZXdLZXlWYWx1ZUFycmF5W25ld0luZGV4ICsgMV0gOiB1bmRlZmluZWQ7XG4gICAgbGV0IHNldEtleTogc3RyaW5nfG51bGwgPSBudWxsO1xuICAgIGxldCBzZXRWYWx1ZTogYW55ID0gdW5kZWZpbmVkO1xuICAgIGlmIChvbGRLZXkgPT09IG5ld0tleSkge1xuICAgICAgLy8gVVBEQVRFOiBLZXlzIGFyZSBlcXVhbCA9PiBuZXcgdmFsdWUgaXMgb3ZlcndyaXRpbmcgb2xkIHZhbHVlLlxuICAgICAgb2xkSW5kZXggKz0gMjtcbiAgICAgIG5ld0luZGV4ICs9IDI7XG4gICAgICBpZiAob2xkVmFsdWUgIT09IG5ld1ZhbHVlKSB7XG4gICAgICAgIHNldEtleSA9IG5ld0tleTtcbiAgICAgICAgc2V0VmFsdWUgPSBuZXdWYWx1ZTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKG5ld0tleSA9PT0gbnVsbCB8fCBvbGRLZXkgIT09IG51bGwgJiYgb2xkS2V5IDwgbmV3S2V5ISkge1xuICAgICAgLy8gREVMRVRFOiBvbGRLZXkga2V5IGlzIG1pc3Npbmcgb3Igd2UgZGlkIG5vdCBmaW5kIHRoZSBvbGRLZXkgaW4gdGhlIG5ld1ZhbHVlXG4gICAgICAvLyAoYmVjYXVzZSB0aGUga2V5VmFsdWVBcnJheSBpcyBzb3J0ZWQgYW5kIGBuZXdLZXlgIGlzIGZvdW5kIGxhdGVyIGFscGhhYmV0aWNhbGx5KS5cbiAgICAgIC8vIGBcImJhY2tncm91bmRcIiA8IFwiY29sb3JcImAgc28gd2UgbmVlZCB0byBkZWxldGUgYFwiYmFja2dyb3VuZFwiYCBiZWNhdXNlIGl0IGlzIG5vdCBmb3VuZCBpbiB0aGVcbiAgICAgIC8vIG5ldyBhcnJheS5cbiAgICAgIG9sZEluZGV4ICs9IDI7XG4gICAgICBzZXRLZXkgPSBvbGRLZXk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIENSRUFURTogbmV3S2V5J3MgaXMgZWFybGllciBhbHBoYWJldGljYWxseSB0aGFuIG9sZEtleSdzIChvciBubyBvbGRLZXkpID0+IHdlIGhhdmUgbmV3IGtleS5cbiAgICAgIC8vIGBcImNvbG9yXCIgPiBcImJhY2tncm91bmRcImAgc28gd2UgbmVlZCB0byBhZGQgYGNvbG9yYCBiZWNhdXNlIGl0IGlzIGluIG5ldyBhcnJheSBidXQgbm90IGluXG4gICAgICAvLyBvbGQgYXJyYXkuXG4gICAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChuZXdLZXksICdFeHBlY3RpbmcgdG8gaGF2ZSBhIHZhbGlkIGtleScpO1xuICAgICAgbmV3SW5kZXggKz0gMjtcbiAgICAgIHNldEtleSA9IG5ld0tleTtcbiAgICAgIHNldFZhbHVlID0gbmV3VmFsdWU7XG4gICAgfVxuICAgIGlmIChzZXRLZXkgIT09IG51bGwpIHtcbiAgICAgIHVwZGF0ZVN0eWxpbmcodFZpZXcsIHROb2RlLCBsVmlldywgcmVuZGVyZXIsIHNldEtleSwgc2V0VmFsdWUsIGlzQ2xhc3NCYXNlZCwgYmluZGluZ0luZGV4KTtcbiAgICB9XG4gICAgb2xkS2V5ID0gb2xkSW5kZXggPCBvbGRLZXlWYWx1ZUFycmF5Lmxlbmd0aCA/IG9sZEtleVZhbHVlQXJyYXlbb2xkSW5kZXhdIDogbnVsbDtcbiAgICBuZXdLZXkgPSBuZXdJbmRleCA8IG5ld0tleVZhbHVlQXJyYXkubGVuZ3RoID8gbmV3S2V5VmFsdWVBcnJheVtuZXdJbmRleF0gOiBudWxsO1xuICB9XG59XG5cbi8qKlxuICogVXBkYXRlIGEgc2ltcGxlIChwcm9wZXJ0eSBuYW1lKSBzdHlsaW5nLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gdGFrZXMgYHByb3BgIGFuZCB1cGRhdGVzIHRoZSBET00gdG8gdGhhdCB2YWx1ZS4gVGhlIGZ1bmN0aW9uIHRha2VzIHRoZSBiaW5kaW5nXG4gKiB2YWx1ZSBhcyB3ZWxsIGFzIGJpbmRpbmcgcHJpb3JpdHkgaW50byBjb25zaWRlcmF0aW9uIHRvIGRldGVybWluZSB3aGljaCB2YWx1ZSBzaG91bGQgYmUgd3JpdHRlblxuICogdG8gRE9NLiAoRm9yIGV4YW1wbGUgaXQgbWF5IGJlIGRldGVybWluZWQgdGhhdCB0aGVyZSBpcyBhIGhpZ2hlciBwcmlvcml0eSBvdmVyd3JpdGUgd2hpY2ggYmxvY2tzXG4gKiB0aGUgRE9NIHdyaXRlLCBvciBpZiB0aGUgdmFsdWUgZ29lcyB0byBgdW5kZWZpbmVkYCBhIGxvd2VyIHByaW9yaXR5IG92ZXJ3cml0ZSBtYXkgYmUgY29uc3VsdGVkLilcbiAqXG4gKiBAcGFyYW0gdFZpZXcgQXNzb2NpYXRlZCBgVFZpZXcuZGF0YWAgY29udGFpbnMgdGhlIGxpbmtlZCBsaXN0IG9mIGJpbmRpbmcgcHJpb3JpdGllcy5cbiAqIEBwYXJhbSB0Tm9kZSBgVE5vZGVgIHdoZXJlIHRoZSBiaW5kaW5nIGlzIGxvY2F0ZWQuXG4gKiBAcGFyYW0gbFZpZXcgYExWaWV3YCBjb250YWlucyB0aGUgdmFsdWVzIGFzc29jaWF0ZWQgd2l0aCBvdGhlciBzdHlsaW5nIGJpbmRpbmcgYXQgdGhpcyBgVE5vZGVgLlxuICogQHBhcmFtIHJlbmRlcmVyIFJlbmRlcmVyIHRvIHVzZSBpZiBhbnkgdXBkYXRlcy5cbiAqIEBwYXJhbSBwcm9wIEVpdGhlciBzdHlsZSBwcm9wZXJ0eSBuYW1lIG9yIGEgY2xhc3MgbmFtZS5cbiAqIEBwYXJhbSB2YWx1ZSBFaXRoZXIgc3R5bGUgdmFsdWUgZm9yIGBwcm9wYCBvciBgdHJ1ZWAvYGZhbHNlYCBpZiBgcHJvcGAgaXMgY2xhc3MuXG4gKiBAcGFyYW0gaXNDbGFzc0Jhc2VkIGB0cnVlYCBpZiBgY2xhc3NgIChgZmFsc2VgIGlmIGBzdHlsZWApXG4gKiBAcGFyYW0gYmluZGluZ0luZGV4IEJpbmRpbmcgaW5kZXggb2YgdGhlIGJpbmRpbmcuXG4gKi9cbmZ1bmN0aW9uIHVwZGF0ZVN0eWxpbmcoXG4gICAgdFZpZXc6IFRWaWV3LCB0Tm9kZTogVE5vZGUsIGxWaWV3OiBMVmlldywgcmVuZGVyZXI6IFJlbmRlcmVyMywgcHJvcDogc3RyaW5nLFxuICAgIHZhbHVlOiBzdHJpbmd8dW5kZWZpbmVkfG51bGx8Ym9vbGVhbiwgaXNDbGFzc0Jhc2VkOiBib29sZWFuLCBiaW5kaW5nSW5kZXg6IG51bWJlcikge1xuICBpZiAodE5vZGUudHlwZSAhPT0gVE5vZGVUeXBlLkVsZW1lbnQpIHtcbiAgICAvLyBJdCBpcyBwb3NzaWJsZSB0byBoYXZlIHN0eWxpbmcgb24gbm9uLWVsZW1lbnRzIChzdWNoIGFzIG5nLWNvbnRhaW5lcikuXG4gICAgLy8gVGhpcyBpcyByYXJlLCBidXQgaXQgZG9lcyBoYXBwZW4uIEluIHN1Y2ggYSBjYXNlLCBqdXN0IGlnbm9yZSB0aGUgYmluZGluZy5cbiAgICByZXR1cm47XG4gIH1cbiAgY29uc3QgdERhdGEgPSB0Vmlldy5kYXRhO1xuICBjb25zdCB0UmFuZ2UgPSB0RGF0YVtiaW5kaW5nSW5kZXggKyAxXSBhcyBUU3R5bGluZ1JhbmdlO1xuICBjb25zdCBoaWdoZXJQcmlvcml0eVZhbHVlID0gZ2V0VFN0eWxpbmdSYW5nZU5leHREdXBsaWNhdGUodFJhbmdlKSA/XG4gICAgICBmaW5kU3R5bGluZ1ZhbHVlKHREYXRhLCB0Tm9kZSwgbFZpZXcsIHByb3AsIGdldFRTdHlsaW5nUmFuZ2VOZXh0KHRSYW5nZSksIGlzQ2xhc3NCYXNlZCkgOlxuICAgICAgdW5kZWZpbmVkO1xuICBpZiAoIWlzU3R5bGluZ1ZhbHVlUHJlc2VudChoaWdoZXJQcmlvcml0eVZhbHVlKSkge1xuICAgIC8vIFdlIGRvbid0IGhhdmUgYSBuZXh0IGR1cGxpY2F0ZSwgb3Igd2UgZGlkIG5vdCBmaW5kIGEgZHVwbGljYXRlIHZhbHVlLlxuICAgIGlmICghaXNTdHlsaW5nVmFsdWVQcmVzZW50KHZhbHVlKSkge1xuICAgICAgLy8gV2Ugc2hvdWxkIGRlbGV0ZSBjdXJyZW50IHZhbHVlIG9yIHJlc3RvcmUgdG8gbG93ZXIgcHJpb3JpdHkgdmFsdWUuXG4gICAgICBpZiAoZ2V0VFN0eWxpbmdSYW5nZVByZXZEdXBsaWNhdGUodFJhbmdlKSkge1xuICAgICAgICAvLyBXZSBoYXZlIGEgcG9zc2libGUgcHJldiBkdXBsaWNhdGUsIGxldCdzIHJldHJpZXZlIGl0LlxuICAgICAgICB2YWx1ZSA9IGZpbmRTdHlsaW5nVmFsdWUodERhdGEsIG51bGwsIGxWaWV3LCBwcm9wLCBiaW5kaW5nSW5kZXgsIGlzQ2xhc3NCYXNlZCk7XG4gICAgICB9XG4gICAgfVxuICAgIGNvbnN0IHJOb2RlID0gZ2V0TmF0aXZlQnlJbmRleChnZXRTZWxlY3RlZEluZGV4KCksIGxWaWV3KSBhcyBSRWxlbWVudDtcbiAgICBhcHBseVN0eWxpbmcocmVuZGVyZXIsIGlzQ2xhc3NCYXNlZCwgck5vZGUsIHByb3AsIHZhbHVlKTtcbiAgfVxufVxuXG4vKipcbiAqIFNlYXJjaCBmb3Igc3R5bGluZyB2YWx1ZSB3aXRoIGhpZ2hlciBwcmlvcml0eSB3aGljaCBpcyBvdmVyd3JpdGluZyBjdXJyZW50IHZhbHVlLCBvciBhXG4gKiB2YWx1ZSBvZiBsb3dlciBwcmlvcml0eSB0byB3aGljaCB3ZSBzaG91bGQgZmFsbCBiYWNrIGlmIHRoZSB2YWx1ZSBpcyBgdW5kZWZpbmVkYC5cbiAqXG4gKiBXaGVuIHZhbHVlIGlzIGJlaW5nIGFwcGxpZWQgYXQgYSBsb2NhdGlvbiwgcmVsYXRlZCB2YWx1ZXMgbmVlZCB0byBiZSBjb25zdWx0ZWQuXG4gKiAtIElmIHRoZXJlIGlzIGEgaGlnaGVyIHByaW9yaXR5IGJpbmRpbmcsIHdlIHNob3VsZCBiZSB1c2luZyB0aGF0IG9uZSBpbnN0ZWFkLlxuICogICBGb3IgZXhhbXBsZSBgPGRpdiAgW3N0eWxlXT1cIntjb2xvcjpleHAxfVwiIFtzdHlsZS5jb2xvcl09XCJleHAyXCI+YCBjaGFuZ2UgdG8gYGV4cDFgXG4gKiAgIHJlcXVpcmVzIHRoYXQgd2UgY2hlY2sgYGV4cDJgIHRvIHNlZSBpZiBpdCBpcyBzZXQgdG8gdmFsdWUgb3RoZXIgdGhhbiBgdW5kZWZpbmVkYC5cbiAqIC0gSWYgdGhlcmUgaXMgYSBsb3dlciBwcmlvcml0eSBiaW5kaW5nIGFuZCB3ZSBhcmUgY2hhbmdpbmcgdG8gYHVuZGVmaW5lZGBcbiAqICAgRm9yIGV4YW1wbGUgYDxkaXYgIFtzdHlsZV09XCJ7Y29sb3I6ZXhwMX1cIiBbc3R5bGUuY29sb3JdPVwiZXhwMlwiPmAgY2hhbmdlIHRvIGBleHAyYCB0b1xuICogICBgdW5kZWZpbmVkYCByZXF1aXJlcyB0aGF0IHdlIGNoZWNrIGBleHAxYCAoYW5kIHN0YXRpYyB2YWx1ZXMpIGFuZCB1c2UgdGhhdCBhcyBuZXcgdmFsdWUuXG4gKlxuICogTk9URTogVGhlIHN0eWxpbmcgc3RvcmVzIHR3byB2YWx1ZXMuXG4gKiAxLiBUaGUgcmF3IHZhbHVlIHdoaWNoIGNhbWUgZnJvbSB0aGUgYXBwbGljYXRpb24gaXMgc3RvcmVkIGF0IGBpbmRleCArIDBgIGxvY2F0aW9uLiAoVGhpcyB2YWx1ZVxuICogICAgaXMgdXNlZCBmb3IgZGlydHkgY2hlY2tpbmcpLlxuICogMi4gVGhlIG5vcm1hbGl6ZWQgdmFsdWUgaXMgc3RvcmVkIGF0IGBpbmRleCArIDFgLlxuICpcbiAqIEBwYXJhbSB0RGF0YSBgVERhdGFgIHVzZWQgZm9yIHRyYXZlcnNpbmcgdGhlIHByaW9yaXR5LlxuICogQHBhcmFtIHROb2RlIGBUTm9kZWAgdG8gdXNlIGZvciByZXNvbHZpbmcgc3RhdGljIHN0eWxpbmcuIEFsc28gY29udHJvbHMgc2VhcmNoIGRpcmVjdGlvbi5cbiAqICAgLSBgVE5vZGVgIHNlYXJjaCBuZXh0IGFuZCBxdWl0IGFzIHNvb24gYXMgYGlzU3R5bGluZ1ZhbHVlUHJlc2VudCh2YWx1ZSlgIGlzIHRydWUuXG4gKiAgICAgIElmIG5vIHZhbHVlIGZvdW5kIGNvbnN1bHQgYHROb2RlLnJlc2lkdWFsU3R5bGVgL2B0Tm9kZS5yZXNpZHVhbENsYXNzYCBmb3IgZGVmYXVsdCB2YWx1ZS5cbiAqICAgLSBgbnVsbGAgc2VhcmNoIHByZXYgYW5kIGdvIGFsbCB0aGUgd2F5IHRvIGVuZC4gUmV0dXJuIGxhc3QgdmFsdWUgd2hlcmVcbiAqICAgICBgaXNTdHlsaW5nVmFsdWVQcmVzZW50KHZhbHVlKWAgaXMgdHJ1ZS5cbiAqIEBwYXJhbSBsVmlldyBgTFZpZXdgIHVzZWQgZm9yIHJldHJpZXZpbmcgdGhlIGFjdHVhbCB2YWx1ZXMuXG4gKiBAcGFyYW0gcHJvcCBQcm9wZXJ0eSB3aGljaCB3ZSBhcmUgaW50ZXJlc3RlZCBpbi5cbiAqIEBwYXJhbSBpbmRleCBTdGFydGluZyBpbmRleCBpbiB0aGUgbGlua2VkIGxpc3Qgb2Ygc3R5bGluZyBiaW5kaW5ncyB3aGVyZSB0aGUgc2VhcmNoIHNob3VsZCBzdGFydC5cbiAqIEBwYXJhbSBpc0NsYXNzQmFzZWQgYHRydWVgIGlmIGBjbGFzc2AgKGBmYWxzZWAgaWYgYHN0eWxlYClcbiAqL1xuZnVuY3Rpb24gZmluZFN0eWxpbmdWYWx1ZShcbiAgICB0RGF0YTogVERhdGEsIHROb2RlOiBUTm9kZXxudWxsLCBsVmlldzogTFZpZXcsIHByb3A6IHN0cmluZywgaW5kZXg6IG51bWJlcixcbiAgICBpc0NsYXNzQmFzZWQ6IGJvb2xlYW4pOiBhbnkge1xuICAvLyBgVE5vZGVgIHRvIHVzZSBmb3IgcmVzb2x2aW5nIHN0YXRpYyBzdHlsaW5nLiBBbHNvIGNvbnRyb2xzIHNlYXJjaCBkaXJlY3Rpb24uXG4gIC8vICAgLSBgVE5vZGVgIHNlYXJjaCBuZXh0IGFuZCBxdWl0IGFzIHNvb24gYXMgYGlzU3R5bGluZ1ZhbHVlUHJlc2VudCh2YWx1ZSlgIGlzIHRydWUuXG4gIC8vICAgICAgSWYgbm8gdmFsdWUgZm91bmQgY29uc3VsdCBgdE5vZGUucmVzaWR1YWxTdHlsZWAvYHROb2RlLnJlc2lkdWFsQ2xhc3NgIGZvciBkZWZhdWx0IHZhbHVlLlxuICAvLyAgIC0gYG51bGxgIHNlYXJjaCBwcmV2IGFuZCBnbyBhbGwgdGhlIHdheSB0byBlbmQuIFJldHVybiBsYXN0IHZhbHVlIHdoZXJlXG4gIC8vICAgICBgaXNTdHlsaW5nVmFsdWVQcmVzZW50KHZhbHVlKWAgaXMgdHJ1ZS5cbiAgY29uc3QgaXNQcmV2RGlyZWN0aW9uID0gdE5vZGUgPT09IG51bGw7XG4gIGxldCB2YWx1ZTogYW55ID0gdW5kZWZpbmVkO1xuICB3aGlsZSAoaW5kZXggPiAwKSB7XG4gICAgY29uc3QgcmF3S2V5ID0gdERhdGFbaW5kZXhdIGFzIFRTdHlsaW5nS2V5O1xuICAgIGNvbnN0IGNvbnRhaW5zU3RhdGljcyA9IEFycmF5LmlzQXJyYXkocmF3S2V5KTtcbiAgICAvLyBVbndyYXAgdGhlIGtleSBpZiB3ZSBjb250YWluIHN0YXRpYyB2YWx1ZXMuXG4gICAgY29uc3Qga2V5ID0gY29udGFpbnNTdGF0aWNzID8gKHJhd0tleSBhcyBzdHJpbmdbXSlbMV0gOiByYXdLZXk7XG4gICAgY29uc3QgaXNTdHlsaW5nTWFwID0ga2V5ID09PSBudWxsO1xuICAgIGxldCB2YWx1ZUF0TFZpZXdJbmRleCA9IGxWaWV3W2luZGV4ICsgMV07XG4gICAgaWYgKHZhbHVlQXRMVmlld0luZGV4ID09PSBOT19DSEFOR0UpIHtcbiAgICAgIC8vIEluIGZpcnN0VXBkYXRlUGFzcyB0aGUgc3R5bGluZyBpbnN0cnVjdGlvbnMgY3JlYXRlIGEgbGlua2VkIGxpc3Qgb2Ygc3R5bGluZy5cbiAgICAgIC8vIE9uIHN1YnNlcXVlbnQgcGFzc2VzIGl0IGlzIHBvc3NpYmxlIGZvciBhIHN0eWxpbmcgaW5zdHJ1Y3Rpb24gdG8gdHJ5IHRvIHJlYWQgYSBiaW5kaW5nXG4gICAgICAvLyB3aGljaFxuICAgICAgLy8gaGFzIG5vdCB5ZXQgZXhlY3V0ZWQuIEluIHRoYXQgY2FzZSB3ZSB3aWxsIGZpbmQgYE5PX0NIQU5HRWAgYW5kIHdlIHNob3VsZCBhc3N1bWUgdGhhdFxuICAgICAgLy8gd2UgaGF2ZSBgdW5kZWZpbmVkYCAob3IgZW1wdHkgYXJyYXkgaW4gY2FzZSBvZiBzdHlsaW5nLW1hcCBpbnN0cnVjdGlvbikgaW5zdGVhZC4gVGhpc1xuICAgICAgLy8gYWxsb3dzIHRoZSByZXNvbHV0aW9uIHRvIGFwcGx5IHRoZSB2YWx1ZSAod2hpY2ggbWF5IGxhdGVyIGJlIG92ZXJ3cml0dGVuIHdoZW4gdGhlXG4gICAgICAvLyBiaW5kaW5nIGFjdHVhbGx5IGV4ZWN1dGVzLilcbiAgICAgIHZhbHVlQXRMVmlld0luZGV4ID0gaXNTdHlsaW5nTWFwID8gRU1QVFlfQVJSQVkgOiB1bmRlZmluZWQ7XG4gICAgfVxuICAgIGxldCBjdXJyZW50VmFsdWUgPSBpc1N0eWxpbmdNYXAgPyBrZXlWYWx1ZUFycmF5R2V0KHZhbHVlQXRMVmlld0luZGV4LCBwcm9wKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGtleSA9PT0gcHJvcCA/IHZhbHVlQXRMVmlld0luZGV4IDogdW5kZWZpbmVkO1xuICAgIGlmIChjb250YWluc1N0YXRpY3MgJiYgIWlzU3R5bGluZ1ZhbHVlUHJlc2VudChjdXJyZW50VmFsdWUpKSB7XG4gICAgICBjdXJyZW50VmFsdWUgPSBrZXlWYWx1ZUFycmF5R2V0KHJhd0tleSBhcyBLZXlWYWx1ZUFycmF5PGFueT4sIHByb3ApO1xuICAgIH1cbiAgICBpZiAoaXNTdHlsaW5nVmFsdWVQcmVzZW50KGN1cnJlbnRWYWx1ZSkpIHtcbiAgICAgIHZhbHVlID0gY3VycmVudFZhbHVlO1xuICAgICAgaWYgKGlzUHJldkRpcmVjdGlvbikge1xuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICB9XG4gICAgfVxuICAgIGNvbnN0IHRSYW5nZSA9IHREYXRhW2luZGV4ICsgMV0gYXMgVFN0eWxpbmdSYW5nZTtcbiAgICBpbmRleCA9IGlzUHJldkRpcmVjdGlvbiA/IGdldFRTdHlsaW5nUmFuZ2VQcmV2KHRSYW5nZSkgOiBnZXRUU3R5bGluZ1JhbmdlTmV4dCh0UmFuZ2UpO1xuICB9XG4gIGlmICh0Tm9kZSAhPT0gbnVsbCkge1xuICAgIC8vIGluIGNhc2Ugd2hlcmUgd2UgYXJlIGdvaW5nIGluIG5leHQgZGlyZWN0aW9uIEFORCB3ZSBkaWQgbm90IGZpbmQgYW55dGhpbmcsIHdlIG5lZWQgdG9cbiAgICAvLyBjb25zdWx0IHJlc2lkdWFsIHN0eWxpbmdcbiAgICBsZXQgcmVzaWR1YWwgPSBpc0NsYXNzQmFzZWQgPyB0Tm9kZS5yZXNpZHVhbENsYXNzZXMgOiB0Tm9kZS5yZXNpZHVhbFN0eWxlcztcbiAgICBpZiAocmVzaWR1YWwgIT0gbnVsbCAvKiogT1IgcmVzaWR1YWwgIT09PSB1bmRlZmluZWQgKi8pIHtcbiAgICAgIHZhbHVlID0ga2V5VmFsdWVBcnJheUdldChyZXNpZHVhbCEsIHByb3ApO1xuICAgIH1cbiAgfVxuICByZXR1cm4gdmFsdWU7XG59XG5cbi8qKlxuICogRGV0ZXJtaW5lcyBpZiB0aGUgYmluZGluZyB2YWx1ZSBzaG91bGQgYmUgdXNlZCAob3IgaWYgdGhlIHZhbHVlIGlzICd1bmRlZmluZWQnIGFuZCBoZW5jZSBwcmlvcml0eVxuICogcmVzb2x1dGlvbiBzaG91bGQgYmUgdXNlZC4pXG4gKlxuICogQHBhcmFtIHZhbHVlIEJpbmRpbmcgc3R5bGUgdmFsdWUuXG4gKi9cbmZ1bmN0aW9uIGlzU3R5bGluZ1ZhbHVlUHJlc2VudCh2YWx1ZTogYW55KTogYm9vbGVhbiB7XG4gIC8vIEN1cnJlbnRseSBvbmx5IGB1bmRlZmluZWRgIHZhbHVlIGlzIGNvbnNpZGVyZWQgbm9uLWJpbmRpbmcuIFRoYXQgaXMgYHVuZGVmaW5lZGAgc2F5cyBJIGRvbid0XG4gIC8vIGhhdmUgYW4gb3BpbmlvbiBhcyB0byB3aGF0IHRoaXMgYmluZGluZyBzaG91bGQgYmUgYW5kIHlvdSBzaG91bGQgY29uc3VsdCBvdGhlciBiaW5kaW5ncyBieVxuICAvLyBwcmlvcml0eSB0byBkZXRlcm1pbmUgdGhlIHZhbGlkIHZhbHVlLlxuICAvLyBUaGlzIGlzIGV4dHJhY3RlZCBpbnRvIGEgc2luZ2xlIGZ1bmN0aW9uIHNvIHRoYXQgd2UgaGF2ZSBhIHNpbmdsZSBwbGFjZSB0byBjb250cm9sIHRoaXMuXG4gIHJldHVybiB2YWx1ZSAhPT0gdW5kZWZpbmVkO1xufVxuXG4vKipcbiAqIE5vcm1hbGl6ZXMgYW5kL29yIGFkZHMgYSBzdWZmaXggdG8gdGhlIHZhbHVlLlxuICpcbiAqIElmIHZhbHVlIGlzIGBudWxsYC9gdW5kZWZpbmVkYCBubyBzdWZmaXggaXMgYWRkZWRcbiAqIEBwYXJhbSB2YWx1ZVxuICogQHBhcmFtIHN1ZmZpeFxuICovXG5mdW5jdGlvbiBub3JtYWxpemVTdWZmaXgodmFsdWU6IGFueSwgc3VmZml4OiBzdHJpbmd8dW5kZWZpbmVkfG51bGwpOiBzdHJpbmd8bnVsbHx1bmRlZmluZWR8Ym9vbGVhbiB7XG4gIGlmICh2YWx1ZSA9PSBudWxsIC8qKiB8fCB2YWx1ZSA9PT0gdW5kZWZpbmVkICovKSB7XG4gICAgLy8gZG8gbm90aGluZ1xuICB9IGVsc2UgaWYgKHR5cGVvZiBzdWZmaXggPT09ICdzdHJpbmcnKSB7XG4gICAgdmFsdWUgPSB2YWx1ZSArIHN1ZmZpeDtcbiAgfSBlbHNlIGlmICh0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnKSB7XG4gICAgdmFsdWUgPSBzdHJpbmdpZnkodW53cmFwU2FmZVZhbHVlKHZhbHVlKSk7XG4gIH1cbiAgcmV0dXJuIHZhbHVlO1xufVxuXG5cbi8qKlxuICogVGVzdHMgaWYgdGhlIGBUTm9kZWAgaGFzIGlucHV0IHNoYWRvdy5cbiAqXG4gKiBBbiBpbnB1dCBzaGFkb3cgaXMgd2hlbiBhIGRpcmVjdGl2ZSBzdGVhbHMgKHNoYWRvd3MpIHRoZSBpbnB1dCBieSB1c2luZyBgQElucHV0KCdzdHlsZScpYCBvclxuICogYEBJbnB1dCgnY2xhc3MnKWAgYXMgaW5wdXQuXG4gKlxuICogQHBhcmFtIHROb2RlIGBUTm9kZWAgd2hpY2ggd2Ugd291bGQgbGlrZSB0byBzZWUgaWYgaXQgaGFzIHNoYWRvdy5cbiAqIEBwYXJhbSBpc0NsYXNzQmFzZWQgYHRydWVgIGlmIGBjbGFzc2AgKGBmYWxzZWAgaWYgYHN0eWxlYClcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGhhc1N0eWxpbmdJbnB1dFNoYWRvdyh0Tm9kZTogVE5vZGUsIGlzQ2xhc3NCYXNlZDogYm9vbGVhbikge1xuICByZXR1cm4gKHROb2RlLmZsYWdzICYgKGlzQ2xhc3NCYXNlZCA/IFROb2RlRmxhZ3MuaGFzQ2xhc3NJbnB1dCA6IFROb2RlRmxhZ3MuaGFzU3R5bGVJbnB1dCkpICE9PSAwO1xufVxuIl19