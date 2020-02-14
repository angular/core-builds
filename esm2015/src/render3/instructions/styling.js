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
import { stylePropNeedsSanitization, ɵɵsanitizeStyle } from '../../sanitization/sanitization';
import { keyValueArrayGet, keyValueArraySet } from '../../util/array_utils';
import { assertDefined, assertEqual, assertLessThan, assertNotEqual, throwError } from '../../util/assert';
import { EMPTY_ARRAY } from '../../util/empty';
import { concatStringsWithSpace, stringify } from '../../util/stringify';
import { assertFirstUpdatePass } from '../assert';
import { bindingUpdated } from '../bindings';
import { getTStylingRangeNext, getTStylingRangeNextDuplicate, getTStylingRangePrev, getTStylingRangePrevDuplicate } from '../interfaces/styling';
import { HEADER_OFFSET, RENDERER } from '../interfaces/view';
import { applyStyling } from '../node_manipulation';
import { getCurrentDirectiveIndex, getCurrentStyleSanitizer, getLView, getSelectedIndex, getTView, incrementBindingIndex, setCurrentStyleSanitizer } from '../state';
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
 * \@codeGenApi
 * @param {?} sanitizer
 * @return {?}
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
 * \@codeGenApi
 * @param {?} prop A valid CSS property.
 * @param {?} value New value to write (`null` or an empty string to remove).
 * @param {?=} suffix Optional suffix. Used with scalar values to add unit such as `px`.
 *        Note that when a suffix is provided then the underlying sanitizer will
 *        be ignored.
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
 * @param {?} suffixOrSanitizer suffix or sanitization function
 * @param {?} isClassBased `true` if `class` change (`false` if `style`)
 * @return {?}
 */
export function checkStylingProperty(prop, value, suffixOrSanitizer, isClassBased) {
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
        // This is a work around. Once PR#34480 lands the sanitizer is passed explicitly and this line
        // can be removed.
        /** @type {?} */
        let styleSanitizer;
        if (suffixOrSanitizer == null) {
            if (styleSanitizer = getCurrentStyleSanitizer()) {
                suffixOrSanitizer = (/** @type {?} */ (styleSanitizer));
            }
        }
        /** @type {?} */
        const tNode = (/** @type {?} */ (tView.data[getSelectedIndex() + HEADER_OFFSET]));
        updateStyling(tView, tNode, lView, lView[RENDERER], prop, lView[bindingIndex + 1] = normalizeAndApplySuffixOrSanitizer(value, suffixOrSanitizer), isClassBased, bindingIndex);
    }
}
/**
 * Common code between `ɵɵclassMap` and `ɵɵstyleMap`.
 *
 * @param {?} keyValueArraySet (See `keyValueArraySet` in "util/array_utils") Gets passed in as a
 * function so that
 *        `style` can pass in version which does sanitization. This is done for tree shaking
 *        purposes.
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
            let staticPrefix = isClassBased ? tNode.classes : tNode.styles;
            ngDevMode && isClassBased === false && staticPrefix !== null &&
                assertEqual(staticPrefix.endsWith(';'), true, 'Expecting static portion to end with \';\'');
            if (typeof value === 'string') {
                value = concatStringsWithSpace(staticPrefix, (/** @type {?} */ (value)));
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
    const hostDirectiveDef = getHostDirectiveDef(tData);
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
    ngDevMode && assertNotEqual(getTStylingRangeNext(bindings), 0, 'Expecting to have at least one template styling binding.');
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
 * Retrieve the current `DirectiveDef` which is active when `hostBindings` style instruction is
 * being executed (or `null` if we are in `template`.)
 *
 * @param {?} tData Current `TData` where the `DirectiveDef` will be looked up at.
 * @return {?}
 */
export function getHostDirectiveDef(tData) {
    /** @type {?} */
    const currentDirectiveIndex = getCurrentDirectiveIndex();
    return currentDirectiveIndex === -1 ? null : (/** @type {?} */ (tData[currentDirectiveIndex]));
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
 * function so that
 *        `style` can pass in version which does sanitization. This is done for tree shaking
 *        purposes.
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
    if (Array.isArray(value)) {
        for (let i = 0; i < value.length; i++) {
            keyValueArraySet(styleKeyValueArray, value[i], true);
        }
    }
    else if (typeof value === 'object') {
        for (const key in value) {
            if (value.hasOwnProperty(key)) {
                keyValueArraySet(styleKeyValueArray, key, value[key]);
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
 * @param {?} keyValueArray KeyValueArray to add to.
 * @param {?} key Style key to add. (This key will be checked if it needs sanitization)
 * @param {?} value The value to set (If key needs sanitization it will be sanitized)
 * @return {?}
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
 * 2. The normalized value (converted to `KeyValueArray` if map and sanitized) is stored at `index +
 * 1`.
 *    The advantage of storing the sanitized value is that once the value is written we don't need
 *    to worry about sanitizing it later or keeping track of the sanitizer.
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
 * Sanitizes or adds suffix to the value.
 *
 * If value is `null`/`undefined` no suffix is added
 * @param {?} value
 * @param {?} suffixOrSanitizer
 * @return {?}
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3R5bGluZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaW5zdHJ1Y3Rpb25zL3N0eWxpbmcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUFZLGVBQWUsRUFBQyxNQUFNLDJCQUEyQixDQUFDO0FBQ3JFLE9BQU8sRUFBQywwQkFBMEIsRUFBRSxlQUFlLEVBQUMsTUFBTSxpQ0FBaUMsQ0FBQztBQUU1RixPQUFPLEVBQWdCLGdCQUFnQixFQUFFLGdCQUFnQixFQUFDLE1BQU0sd0JBQXdCLENBQUM7QUFDekYsT0FBTyxFQUFDLGFBQWEsRUFBRSxXQUFXLEVBQUUsY0FBYyxFQUFFLGNBQWMsRUFBRSxVQUFVLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUN6RyxPQUFPLEVBQUMsV0FBVyxFQUFDLE1BQU0sa0JBQWtCLENBQUM7QUFDN0MsT0FBTyxFQUFDLHNCQUFzQixFQUFFLFNBQVMsRUFBQyxNQUFNLHNCQUFzQixDQUFDO0FBQ3ZFLE9BQU8sRUFBQyxxQkFBcUIsRUFBQyxNQUFNLFdBQVcsQ0FBQztBQUNoRCxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sYUFBYSxDQUFDO0FBSzNDLE9BQU8sRUFBNkIsb0JBQW9CLEVBQUUsNkJBQTZCLEVBQUUsb0JBQW9CLEVBQUUsNkJBQTZCLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUMzSyxPQUFPLEVBQUMsYUFBYSxFQUFTLFFBQVEsRUFBZSxNQUFNLG9CQUFvQixDQUFDO0FBQ2hGLE9BQU8sRUFBQyxZQUFZLEVBQUMsTUFBTSxzQkFBc0IsQ0FBQztBQUNsRCxPQUFPLEVBQUMsd0JBQXdCLEVBQUUsd0JBQXdCLEVBQUUsUUFBUSxFQUFFLGdCQUFnQixFQUFFLFFBQVEsRUFBRSxxQkFBcUIsRUFBRSx3QkFBd0IsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUNuSyxPQUFPLEVBQUMscUJB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eEUsSUFBSSxLQUFLLElBQUksSUFBSSxDQUFDLDZCQUE2QixFQUFFO1FBQy9DLGFBQWE7S0FDZDtTQUFNLElBQUksT0FBTyxpQkFBaUIsS0FBSyxVQUFVLEVBQUU7UUFDbEQsc0JBQXNCO1FBQ3RCLEtBQUssR0FBRyxpQkFBaUIsQ0FBQyxLQUFLLENBQUMsQ0FBQztLQUNsQztTQUFNLElBQUksT0FBTyxpQkFBaUIsS0FBSyxRQUFRLEVBQUU7UUFDaEQsS0FBSyxHQUFHLEtBQUssR0FBRyxpQkFBaUIsQ0FBQztLQUNuQztTQUFNLElBQUksT0FBTyxLQUFLLEtBQUssUUFBUSxFQUFFO1FBQ3BDLEtBQUssR0FBRyxTQUFTLENBQUMsZUFBZSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7S0FDM0M7SUFDRCxPQUFPLEtBQUssQ0FBQztBQUNmLENBQUM7Ozs7Ozs7Ozs7O0FBWUQsTUFBTSxVQUFVLHFCQUFxQixDQUFDLEtBQVksRUFBRSxZQUFxQjtJQUN2RSxPQUFPLENBQUMsS0FBSyxDQUFDLEtBQUssR0FBRyxDQUFDLFlBQVksQ0FBQyxDQUFDLHdCQUEwQixDQUFDLHVCQUF5QixDQUFDLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDcEcsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuKiBAbGljZW5zZVxuKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbipcbiogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuKi9cblxuaW1wb3J0IHtTYWZlVmFsdWUsIHVud3JhcFNhZmVWYWx1ZX0gZnJvbSAnLi4vLi4vc2FuaXRpemF0aW9uL2J5cGFzcyc7XG5pbXBvcnQge3N0eWxlUHJvcE5lZWRzU2FuaXRpemF0aW9uLCDJtcm1c2FuaXRpemVTdHlsZX0gZnJvbSAnLi4vLi4vc2FuaXRpemF0aW9uL3Nhbml0aXphdGlvbic7XG5pbXBvcnQge1N0eWxlU2FuaXRpemVGbn0gZnJvbSAnLi4vLi4vc2FuaXRpemF0aW9uL3N0eWxlX3Nhbml0aXplcic7XG5pbXBvcnQge0tleVZhbHVlQXJyYXksIGtleVZhbHVlQXJyYXlHZXQsIGtleVZhbHVlQXJyYXlTZXR9IGZyb20gJy4uLy4uL3V0aWwvYXJyYXlfdXRpbHMnO1xuaW1wb3J0IHthc3NlcnREZWZpbmVkLCBhc3NlcnRFcXVhbCwgYXNzZXJ0TGVzc1RoYW4sIGFzc2VydE5vdEVxdWFsLCB0aHJvd0Vycm9yfSBmcm9tICcuLi8uLi91dGlsL2Fzc2VydCc7XG5pbXBvcnQge0VNUFRZX0FSUkFZfSBmcm9tICcuLi8uLi91dGlsL2VtcHR5JztcbmltcG9ydCB7Y29uY2F0U3RyaW5nc1dpdGhTcGFjZSwgc3RyaW5naWZ5fSBmcm9tICcuLi8uLi91dGlsL3N0cmluZ2lmeSc7XG5pbXBvcnQge2Fzc2VydEZpcnN0VXBkYXRlUGFzc30gZnJvbSAnLi4vYXNzZXJ0JztcbmltcG9ydCB7YmluZGluZ1VwZGF0ZWR9IGZyb20gJy4uL2JpbmRpbmdzJztcbmltcG9ydCB7RGlyZWN0aXZlRGVmfSBmcm9tICcuLi9pbnRlcmZhY2VzL2RlZmluaXRpb24nO1xuaW1wb3J0IHtBdHRyaWJ1dGVNYXJrZXIsIFRBdHRyaWJ1dGVzLCBUTm9kZSwgVE5vZGVGbGFncywgVE5vZGVUeXBlfSBmcm9tICcuLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtSRWxlbWVudCwgUmVuZGVyZXIzfSBmcm9tICcuLi9pbnRlcmZhY2VzL3JlbmRlcmVyJztcbmltcG9ydCB7U2FuaXRpemVyRm59IGZyb20gJy4uL2ludGVyZmFjZXMvc2FuaXRpemF0aW9uJztcbmltcG9ydCB7VFN0eWxpbmdLZXksIFRTdHlsaW5nUmFuZ2UsIGdldFRTdHlsaW5nUmFuZ2VOZXh0LCBnZXRUU3R5bGluZ1JhbmdlTmV4dER1cGxpY2F0ZSwgZ2V0VFN0eWxpbmdSYW5nZVByZXYsIGdldFRTdHlsaW5nUmFuZ2VQcmV2RHVwbGljYXRlfSBmcm9tICcuLi9pbnRlcmZhY2VzL3N0eWxpbmcnO1xuaW1wb3J0IHtIRUFERVJfT0ZGU0VULCBMVmlldywgUkVOREVSRVIsIFREYXRhLCBUVmlld30gZnJvbSAnLi4vaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7YXBwbHlTdHlsaW5nfSBmcm9tICcuLi9ub2RlX21hbmlwdWxhdGlvbic7XG5pbXBvcnQge2dldEN1cnJlbnREaXJlY3RpdmVJbmRleCwgZ2V0Q3VycmVudFN0eWxlU2FuaXRpemVyLCBnZXRMVmlldywgZ2V0U2VsZWN0ZWRJbmRleCwgZ2V0VFZpZXcsIGluY3JlbWVudEJpbmRpbmdJbmRleCwgc2V0Q3VycmVudFN0eWxlU2FuaXRpemVyfSBmcm9tICcuLi9zdGF0ZSc7XG5pbXBvcnQge2luc2VydFRTdHlsaW5nQmluZGluZ30gZnJvbSAnLi4vc3R5bGluZy9zdHlsZV9iaW5kaW5nX2xpc3QnO1xuaW1wb3J0IHtnZXRMYXN0UGFyc2VkS2V5LCBnZXRMYXN0UGFyc2VkVmFsdWUsIHBhcnNlQ2xhc3NOYW1lLCBwYXJzZUNsYXNzTmFtZU5leHQsIHBhcnNlU3R5bGUsIHBhcnNlU3R5bGVOZXh0fSBmcm9tICcuLi9zdHlsaW5nL3N0eWxpbmdfcGFyc2VyJztcbmltcG9ydCB7Tk9fQ0hBTkdFfSBmcm9tICcuLi90b2tlbnMnO1xuaW1wb3J0IHtnZXROYXRpdmVCeUluZGV4fSBmcm9tICcuLi91dGlsL3ZpZXdfdXRpbHMnO1xuaW1wb3J0IHtzZXREaXJlY3RpdmVJbnB1dHNXaGljaFNoYWRvd3NTdHlsaW5nfSBmcm9tICcuL3Byb3BlcnR5JztcblxuXG4vKipcbiAqIFNldHMgdGhlIGN1cnJlbnQgc3R5bGUgc2FuaXRpemVyIGZ1bmN0aW9uIHdoaWNoIHdpbGwgdGhlbiBiZSB1c2VkXG4gKiB3aXRoaW4gYWxsIGZvbGxvdy11cCBwcm9wIGFuZCBtYXAtYmFzZWQgc3R5bGUgYmluZGluZyBpbnN0cnVjdGlvbnNcbiAqIGZvciB0aGUgZ2l2ZW4gZWxlbWVudC5cbiAqXG4gKiBOb3RlIHRoYXQgb25jZSBzdHlsaW5nIGhhcyBiZWVuIGFwcGxpZWQgdG8gdGhlIGVsZW1lbnQgKGkuZS4gb25jZVxuICogYGFkdmFuY2UobilgIGlzIGV4ZWN1dGVkIG9yIHRoZSBob3N0QmluZGluZ3MvdGVtcGxhdGUgZnVuY3Rpb24gZXhpdHMpXG4gKiB0aGVuIHRoZSBhY3RpdmUgYHNhbml0aXplckZuYCB3aWxsIGJlIHNldCB0byBgbnVsbGAuIFRoaXMgbWVhbnMgdGhhdFxuICogb25jZSBzdHlsaW5nIGlzIGFwcGxpZWQgdG8gYW5vdGhlciBlbGVtZW50IHRoZW4gYSBhbm90aGVyIGNhbGwgdG9cbiAqIGBzdHlsZVNhbml0aXplcmAgd2lsbCBuZWVkIHRvIGJlIG1hZGUuXG4gKlxuICogQHBhcmFtIHNhbml0aXplckZuIFRoZSBzYW5pdGl6YXRpb24gZnVuY3Rpb24gdGhhdCB3aWxsIGJlIHVzZWQgdG9cbiAqICAgICAgIHByb2Nlc3Mgc3R5bGUgcHJvcC92YWx1ZSBlbnRyaWVzLlxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1c3R5bGVTYW5pdGl6ZXIoc2FuaXRpemVyOiBTdHlsZVNhbml0aXplRm4gfCBudWxsKTogdm9pZCB7XG4gIHNldEN1cnJlbnRTdHlsZVNhbml0aXplcihzYW5pdGl6ZXIpO1xufVxuXG4vKipcbiAqIFVwZGF0ZSBhIHN0eWxlIGJpbmRpbmcgb24gYW4gZWxlbWVudCB3aXRoIHRoZSBwcm92aWRlZCB2YWx1ZS5cbiAqXG4gKiBJZiB0aGUgc3R5bGUgdmFsdWUgaXMgZmFsc3kgdGhlbiBpdCB3aWxsIGJlIHJlbW92ZWQgZnJvbSB0aGUgZWxlbWVudFxuICogKG9yIGFzc2lnbmVkIGEgZGlmZmVyZW50IHZhbHVlIGRlcGVuZGluZyBpZiB0aGVyZSBhcmUgYW55IHN0eWxlcyBwbGFjZWRcbiAqIG9uIHRoZSBlbGVtZW50IHdpdGggYHN0eWxlTWFwYCBvciBhbnkgc3RhdGljIHN0eWxlcyB0aGF0IGFyZVxuICogcHJlc2VudCBmcm9tIHdoZW4gdGhlIGVsZW1lbnQgd2FzIGNyZWF0ZWQgd2l0aCBgc3R5bGluZ2ApLlxuICpcbiAqIE5vdGUgdGhhdCB0aGUgc3R5bGluZyBlbGVtZW50IGlzIHVwZGF0ZWQgYXMgcGFydCBvZiBgc3R5bGluZ0FwcGx5YC5cbiAqXG4gKiBAcGFyYW0gcHJvcCBBIHZhbGlkIENTUyBwcm9wZXJ0eS5cbiAqIEBwYXJhbSB2YWx1ZSBOZXcgdmFsdWUgdG8gd3JpdGUgKGBudWxsYCBvciBhbiBlbXB0eSBzdHJpbmcgdG8gcmVtb3ZlKS5cbiAqIEBwYXJhbSBzdWZmaXggT3B0aW9uYWwgc3VmZml4LiBVc2VkIHdpdGggc2NhbGFyIHZhbHVlcyB0byBhZGQgdW5pdCBzdWNoIGFzIGBweGAuXG4gKiAgICAgICAgTm90ZSB0aGF0IHdoZW4gYSBzdWZmaXggaXMgcHJvdmlkZWQgdGhlbiB0aGUgdW5kZXJseWluZyBzYW5pdGl6ZXIgd2lsbFxuICogICAgICAgIGJlIGlnbm9yZWQuXG4gKlxuICogTm90ZSB0aGF0IHRoaXMgd2lsbCBhcHBseSB0aGUgcHJvdmlkZWQgc3R5bGUgdmFsdWUgdG8gdGhlIGhvc3QgZWxlbWVudCBpZiB0aGlzIGZ1bmN0aW9uIGlzIGNhbGxlZFxuICogd2l0aGluIGEgaG9zdCBiaW5kaW5nIGZ1bmN0aW9uLlxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1c3R5bGVQcm9wKFxuICAgIHByb3A6IHN0cmluZywgdmFsdWU6IHN0cmluZyB8IG51bWJlciB8IFNhZmVWYWx1ZSB8IHVuZGVmaW5lZCB8IG51bGwsXG4gICAgc3VmZml4Pzogc3RyaW5nIHwgbnVsbCk6IHR5cGVvZiDJtcm1c3R5bGVQcm9wIHtcbiAgY2hlY2tTdHlsaW5nUHJvcGVydHkocHJvcCwgdmFsdWUsIHN1ZmZpeCwgZmFsc2UpO1xuICByZXR1cm4gybXJtXN0eWxlUHJvcDtcbn1cblxuLyoqXG4gKiBVcGRhdGUgYSBjbGFzcyBiaW5kaW5nIG9uIGFuIGVsZW1lbnQgd2l0aCB0aGUgcHJvdmlkZWQgdmFsdWUuXG4gKlxuICogVGhpcyBpbnN0cnVjdGlvbiBpcyBtZWFudCB0byBoYW5kbGUgdGhlIGBbY2xhc3MuZm9vXT1cImV4cFwiYCBjYXNlIGFuZCxcbiAqIHRoZXJlZm9yZSwgdGhlIGNsYXNzIGJpbmRpbmcgaXRzZWxmIG11c3QgYWxyZWFkeSBiZSBhbGxvY2F0ZWQgdXNpbmdcbiAqIGBzdHlsaW5nYCB3aXRoaW4gdGhlIGNyZWF0aW9uIGJsb2NrLlxuICpcbiAqIEBwYXJhbSBwcm9wIEEgdmFsaWQgQ1NTIGNsYXNzIChvbmx5IG9uZSkuXG4gKiBAcGFyYW0gdmFsdWUgQSB0cnVlL2ZhbHNlIHZhbHVlIHdoaWNoIHdpbGwgdHVybiB0aGUgY2xhc3Mgb24gb3Igb2ZmLlxuICpcbiAqIE5vdGUgdGhhdCB0aGlzIHdpbGwgYXBwbHkgdGhlIHByb3ZpZGVkIGNsYXNzIHZhbHVlIHRvIHRoZSBob3N0IGVsZW1lbnQgaWYgdGhpcyBmdW5jdGlvblxuICogaXMgY2FsbGVkIHdpdGhpbiBhIGhvc3QgYmluZGluZyBmdW5jdGlvbi5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWNsYXNzUHJvcChcbiAgICBjbGFzc05hbWU6IHN0cmluZywgdmFsdWU6IGJvb2xlYW4gfCB1bmRlZmluZWQgfCBudWxsKTogdHlwZW9mIMm1ybVjbGFzc1Byb3Age1xuICBjaGVja1N0eWxpbmdQcm9wZXJ0eShjbGFzc05hbWUsIHZhbHVlLCBudWxsLCB0cnVlKTtcbiAgcmV0dXJuIMm1ybVjbGFzc1Byb3A7XG59XG5cblxuLyoqXG4gKiBVcGRhdGUgc3R5bGUgYmluZGluZ3MgdXNpbmcgYW4gb2JqZWN0IGxpdGVyYWwgb24gYW4gZWxlbWVudC5cbiAqXG4gKiBUaGlzIGluc3RydWN0aW9uIGlzIG1lYW50IHRvIGFwcGx5IHN0eWxpbmcgdmlhIHRoZSBgW3N0eWxlXT1cImV4cFwiYCB0ZW1wbGF0ZSBiaW5kaW5ncy5cbiAqIFdoZW4gc3R5bGVzIGFyZSBhcHBsaWVkIHRvIHRoZSBlbGVtZW50IHRoZXkgd2lsbCB0aGVuIGJlIHVwZGF0ZWQgd2l0aCByZXNwZWN0IHRvXG4gKiBhbnkgc3R5bGVzL2NsYXNzZXMgc2V0IHZpYSBgc3R5bGVQcm9wYC4gSWYgYW55IHN0eWxlcyBhcmUgc2V0IHRvIGZhbHN5XG4gKiB0aGVuIHRoZXkgd2lsbCBiZSByZW1vdmVkIGZyb20gdGhlIGVsZW1lbnQuXG4gKlxuICogTm90ZSB0aGF0IHRoZSBzdHlsaW5nIGluc3RydWN0aW9uIHdpbGwgbm90IGJlIGFwcGxpZWQgdW50aWwgYHN0eWxpbmdBcHBseWAgaXMgY2FsbGVkLlxuICpcbiAqIEBwYXJhbSBzdHlsZXMgQSBrZXkvdmFsdWUgc3R5bGUgbWFwIG9mIHRoZSBzdHlsZXMgdGhhdCB3aWxsIGJlIGFwcGxpZWQgdG8gdGhlIGdpdmVuIGVsZW1lbnQuXG4gKiAgICAgICAgQW55IG1pc3Npbmcgc3R5bGVzICh0aGF0IGhhdmUgYWxyZWFkeSBiZWVuIGFwcGxpZWQgdG8gdGhlIGVsZW1lbnQgYmVmb3JlaGFuZCkgd2lsbCBiZVxuICogICAgICAgIHJlbW92ZWQgKHVuc2V0KSBmcm9tIHRoZSBlbGVtZW50J3Mgc3R5bGluZy5cbiAqXG4gKiBOb3RlIHRoYXQgdGhpcyB3aWxsIGFwcGx5IHRoZSBwcm92aWRlZCBzdHlsZU1hcCB2YWx1ZSB0byB0aGUgaG9zdCBlbGVtZW50IGlmIHRoaXMgZnVuY3Rpb25cbiAqIGlzIGNhbGxlZCB3aXRoaW4gYSBob3N0IGJpbmRpbmcuXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVzdHlsZU1hcChzdHlsZXM6IHtbc3R5bGVOYW1lOiBzdHJpbmddOiBhbnl9IHwgc3RyaW5nIHwgdW5kZWZpbmVkIHwgbnVsbCk6IHZvaWQge1xuICBjaGVja1N0eWxpbmdNYXAoc3R5bGVLZXlWYWx1ZUFycmF5U2V0LCBzdHlsZVN0cmluZ1BhcnNlciwgc3R5bGVzLCBmYWxzZSk7XG59XG5cblxuLyoqXG4gKiBQYXJzZSB0ZXh0IGFzIHN0eWxlIGFuZCBhZGQgdmFsdWVzIHRvIEtleVZhbHVlQXJyYXkuXG4gKlxuICogVGhpcyBjb2RlIGlzIHB1bGxlZCBvdXQgdG8gYSBzZXBhcmF0ZSBmdW5jdGlvbiBzbyB0aGF0IGl0IGNhbiBiZSB0cmVlIHNoYWtlbiBhd2F5IGlmIGl0IGlzIG5vdFxuICogbmVlZGVkLiBJdCBpcyBvbmx5IHJlZmVyZW5jZWQgZnJvbSBgybXJtXN0eWxlTWFwYC5cbiAqXG4gKiBAcGFyYW0ga2V5VmFsdWVBcnJheSBLZXlWYWx1ZUFycmF5IHRvIGFkZCBwYXJzZWQgdmFsdWVzIHRvLlxuICogQHBhcmFtIHRleHQgdGV4dCB0byBwYXJzZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHN0eWxlU3RyaW5nUGFyc2VyKGtleVZhbHVlQXJyYXk6IEtleVZhbHVlQXJyYXk8YW55PiwgdGV4dDogc3RyaW5nKTogdm9pZCB7XG4gIGZvciAobGV0IGkgPSBwYXJzZVN0eWxlKHRleHQpOyBpID49IDA7IGkgPSBwYXJzZVN0eWxlTmV4dCh0ZXh0LCBpKSkge1xuICAgIHN0eWxlS2V5VmFsdWVBcnJheVNldChrZXlWYWx1ZUFycmF5LCBnZXRMYXN0UGFyc2VkS2V5KHRleHQpLCBnZXRMYXN0UGFyc2VkVmFsdWUodGV4dCkpO1xuICB9XG59XG5cblxuLyoqXG4gKiBVcGRhdGUgY2xhc3MgYmluZGluZ3MgdXNpbmcgYW4gb2JqZWN0IGxpdGVyYWwgb3IgY2xhc3Mtc3RyaW5nIG9uIGFuIGVsZW1lbnQuXG4gKlxuICogVGhpcyBpbnN0cnVjdGlvbiBpcyBtZWFudCB0byBhcHBseSBzdHlsaW5nIHZpYSB0aGUgYFtjbGFzc109XCJleHBcImAgdGVtcGxhdGUgYmluZGluZ3MuXG4gKiBXaGVuIGNsYXNzZXMgYXJlIGFwcGxpZWQgdG8gdGhlIGVsZW1lbnQgdGhleSB3aWxsIHRoZW4gYmUgdXBkYXRlZCB3aXRoXG4gKiByZXNwZWN0IHRvIGFueSBzdHlsZXMvY2xhc3NlcyBzZXQgdmlhIGBjbGFzc1Byb3BgLiBJZiBhbnlcbiAqIGNsYXNzZXMgYXJlIHNldCB0byBmYWxzeSB0aGVuIHRoZXkgd2lsbCBiZSByZW1vdmVkIGZyb20gdGhlIGVsZW1lbnQuXG4gKlxuICogTm90ZSB0aGF0IHRoZSBzdHlsaW5nIGluc3RydWN0aW9uIHdpbGwgbm90IGJlIGFwcGxpZWQgdW50aWwgYHN0eWxpbmdBcHBseWAgaXMgY2FsbGVkLlxuICogTm90ZSB0aGF0IHRoaXMgd2lsbCB0aGUgcHJvdmlkZWQgY2xhc3NNYXAgdmFsdWUgdG8gdGhlIGhvc3QgZWxlbWVudCBpZiB0aGlzIGZ1bmN0aW9uIGlzIGNhbGxlZFxuICogd2l0aGluIGEgaG9zdCBiaW5kaW5nLlxuICpcbiAqIEBwYXJhbSBjbGFzc2VzIEEga2V5L3ZhbHVlIG1hcCBvciBzdHJpbmcgb2YgQ1NTIGNsYXNzZXMgdGhhdCB3aWxsIGJlIGFkZGVkIHRvIHRoZVxuICogICAgICAgIGdpdmVuIGVsZW1lbnQuIEFueSBtaXNzaW5nIGNsYXNzZXMgKHRoYXQgaGF2ZSBhbHJlYWR5IGJlZW4gYXBwbGllZCB0byB0aGUgZWxlbWVudFxuICogICAgICAgIGJlZm9yZWhhbmQpIHdpbGwgYmUgcmVtb3ZlZCAodW5zZXQpIGZyb20gdGhlIGVsZW1lbnQncyBsaXN0IG9mIENTUyBjbGFzc2VzLlxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1Y2xhc3NNYXAoXG4gICAgY2xhc3Nlczoge1tjbGFzc05hbWU6IHN0cmluZ106IGJvb2xlYW4gfCB1bmRlZmluZWQgfCBudWxsfSB8IHN0cmluZyB8IHVuZGVmaW5lZCB8IG51bGwpOiB2b2lkIHtcbiAgY2hlY2tTdHlsaW5nTWFwKGtleVZhbHVlQXJyYXlTZXQsIGNsYXNzU3RyaW5nUGFyc2VyLCBjbGFzc2VzLCB0cnVlKTtcbn1cblxuLyoqXG4gKiBQYXJzZSB0ZXh0IGFzIGNsYXNzIGFuZCBhZGQgdmFsdWVzIHRvIEtleVZhbHVlQXJyYXkuXG4gKlxuICogVGhpcyBjb2RlIGlzIHB1bGxlZCBvdXQgdG8gYSBzZXBhcmF0ZSBmdW5jdGlvbiBzbyB0aGF0IGl0IGNhbiBiZSB0cmVlIHNoYWtlbiBhd2F5IGlmIGl0IGlzIG5vdFxuICogbmVlZGVkLiBJdCBpcyBvbmx5IHJlZmVyZW5jZWQgZnJvbSBgybXJtWNsYXNzTWFwYC5cbiAqXG4gKiBAcGFyYW0ga2V5VmFsdWVBcnJheSBLZXlWYWx1ZUFycmF5IHRvIGFkZCBwYXJzZWQgdmFsdWVzIHRvLlxuICogQHBhcmFtIHRleHQgdGV4dCB0byBwYXJzZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNsYXNzU3RyaW5nUGFyc2VyKGtleVZhbHVlQXJyYXk6IEtleVZhbHVlQXJyYXk8YW55PiwgdGV4dDogc3RyaW5nKTogdm9pZCB7XG4gIGZvciAobGV0IGkgPSBwYXJzZUNsYXNzTmFtZSh0ZXh0KTsgaSA+PSAwOyBpID0gcGFyc2VDbGFzc05hbWVOZXh0KHRleHQsIGkpKSB7XG4gICAga2V5VmFsdWVBcnJheVNldChrZXlWYWx1ZUFycmF5LCBnZXRMYXN0UGFyc2VkS2V5KHRleHQpLCB0cnVlKTtcbiAgfVxufVxuXG4vKipcbiAqIENvbW1vbiBjb2RlIGJldHdlZW4gYMm1ybVjbGFzc1Byb3BgIGFuZCBgybXJtXN0eWxlUHJvcGAuXG4gKlxuICogQHBhcmFtIHByb3AgcHJvcGVydHkgbmFtZS5cbiAqIEBwYXJhbSB2YWx1ZSBiaW5kaW5nIHZhbHVlLlxuICogQHBhcmFtIHN1ZmZpeE9yU2FuaXRpemVyIHN1ZmZpeCBvciBzYW5pdGl6YXRpb24gZnVuY3Rpb25cbiAqIEBwYXJhbSBpc0NsYXNzQmFzZWQgYHRydWVgIGlmIGBjbGFzc2AgY2hhbmdlIChgZmFsc2VgIGlmIGBzdHlsZWApXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjaGVja1N0eWxpbmdQcm9wZXJ0eShcbiAgICBwcm9wOiBzdHJpbmcsIHZhbHVlOiBhbnkgfCBOT19DSEFOR0UsXG4gICAgc3VmZml4T3JTYW5pdGl6ZXI6IFNhbml0aXplckZuIHwgc3RyaW5nIHwgdW5kZWZpbmVkIHwgbnVsbCwgaXNDbGFzc0Jhc2VkOiBib29sZWFuKTogdm9pZCB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgdFZpZXcgPSBnZXRUVmlldygpO1xuICAvLyBTdHlsaW5nIGluc3RydWN0aW9ucyB1c2UgMiBzbG90cyBwZXIgYmluZGluZy5cbiAgLy8gMS4gb25lIGZvciB0aGUgdmFsdWUgLyBUU3R5bGluZ0tleVxuICAvLyAyLiBvbmUgZm9yIHRoZSBpbnRlcm1pdHRlbnQtdmFsdWUgLyBUU3R5bGluZ1JhbmdlXG4gIGNvbnN0IGJpbmRpbmdJbmRleCA9IGluY3JlbWVudEJpbmRpbmdJbmRleCgyKTtcbiAgaWYgKHRWaWV3LmZpcnN0VXBkYXRlUGFzcykge1xuICAgIHN0eWxpbmdGaXJzdFVwZGF0ZVBhc3ModFZpZXcsIHByb3AsIGJpbmRpbmdJbmRleCwgaXNDbGFzc0Jhc2VkKTtcbiAgfVxuICBpZiAodmFsdWUgIT09IE5PX0NIQU5HRSAmJiBiaW5kaW5nVXBkYXRlZChsVmlldywgYmluZGluZ0luZGV4LCB2YWx1ZSkpIHtcbiAgICAvLyBUaGlzIGlzIGEgd29yayBhcm91bmQuIE9uY2UgUFIjMzQ0ODAgbGFuZHMgdGhlIHNhbml0aXplciBpcyBwYXNzZWQgZXhwbGljaXRseSBhbmQgdGhpcyBsaW5lXG4gICAgLy8gY2FuIGJlIHJlbW92ZWQuXG4gICAgbGV0IHN0eWxlU2FuaXRpemVyOiBTdHlsZVNhbml0aXplRm58bnVsbDtcbiAgICBpZiAoc3VmZml4T3JTYW5pdGl6ZXIgPT0gbnVsbCkge1xuICAgICAgaWYgKHN0eWxlU2FuaXRpemVyID0gZ2V0Q3VycmVudFN0eWxlU2FuaXRpemVyKCkpIHtcbiAgICAgICAgc3VmZml4T3JTYW5pdGl6ZXIgPSBzdHlsZVNhbml0aXplciBhcyBhbnk7XG4gICAgICB9XG4gICAgfVxuICAgIGNvbnN0IHROb2RlID0gdFZpZXcuZGF0YVtnZXRTZWxlY3RlZEluZGV4KCkgKyBIRUFERVJfT0ZGU0VUXSBhcyBUTm9kZTtcbiAgICB1cGRhdGVTdHlsaW5nKFxuICAgICAgICB0VmlldywgdE5vZGUsIGxWaWV3LCBsVmlld1tSRU5ERVJFUl0sIHByb3AsXG4gICAgICAgIGxWaWV3W2JpbmRpbmdJbmRleCArIDFdID0gbm9ybWFsaXplQW5kQXBwbHlTdWZmaXhPclNhbml0aXplcih2YWx1ZSwgc3VmZml4T3JTYW5pdGl6ZXIpLFxuICAgICAgICBpc0NsYXNzQmFzZWQsIGJpbmRpbmdJbmRleCk7XG4gIH1cbn1cblxuLyoqXG4gKiBDb21tb24gY29kZSBiZXR3ZWVuIGDJtcm1Y2xhc3NNYXBgIGFuZCBgybXJtXN0eWxlTWFwYC5cbiAqXG4gKiBAcGFyYW0ga2V5VmFsdWVBcnJheVNldCAoU2VlIGBrZXlWYWx1ZUFycmF5U2V0YCBpbiBcInV0aWwvYXJyYXlfdXRpbHNcIikgR2V0cyBwYXNzZWQgaW4gYXMgYVxuICogZnVuY3Rpb24gc28gdGhhdFxuICogICAgICAgIGBzdHlsZWAgY2FuIHBhc3MgaW4gdmVyc2lvbiB3aGljaCBkb2VzIHNhbml0aXphdGlvbi4gVGhpcyBpcyBkb25lIGZvciB0cmVlIHNoYWtpbmdcbiAqICAgICAgICBwdXJwb3Nlcy5cbiAqIEBwYXJhbSBzdHJpbmdQYXJzZXIgUGFyc2VyIHVzZWQgdG8gcGFyc2UgYHZhbHVlYCBpZiBgc3RyaW5nYC4gKFBhc3NlZCBpbiBhcyBgc3R5bGVgIGFuZCBgY2xhc3NgXG4gKiAgICAgICAgaGF2ZSBkaWZmZXJlbnQgcGFyc2Vycy4pXG4gKiBAcGFyYW0gdmFsdWUgYm91bmQgdmFsdWUgZnJvbSBhcHBsaWNhdGlvblxuICogQHBhcmFtIGlzQ2xhc3NCYXNlZCBgdHJ1ZWAgaWYgYGNsYXNzYCBjaGFuZ2UgKGBmYWxzZWAgaWYgYHN0eWxlYClcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNoZWNrU3R5bGluZ01hcChcbiAgICBrZXlWYWx1ZUFycmF5U2V0OiAoa2V5VmFsdWVBcnJheTogS2V5VmFsdWVBcnJheTxhbnk+LCBrZXk6IHN0cmluZywgdmFsdWU6IGFueSkgPT4gdm9pZCxcbiAgICBzdHJpbmdQYXJzZXI6IChzdHlsZUtleVZhbHVlQXJyYXk6IEtleVZhbHVlQXJyYXk8YW55PiwgdGV4dDogc3RyaW5nKSA9PiB2b2lkLFxuICAgIHZhbHVlOiBhbnl8Tk9fQ0hBTkdFLCBpc0NsYXNzQmFzZWQ6IGJvb2xlYW4pOiB2b2lkIHtcbiAgY29uc3QgdFZpZXcgPSBnZXRUVmlldygpO1xuICBjb25zdCBiaW5kaW5nSW5kZXggPSBpbmNyZW1lbnRCaW5kaW5nSW5kZXgoMik7XG4gIGlmICh0Vmlldy5maXJzdFVwZGF0ZVBhc3MpIHtcbiAgICBzdHlsaW5nRmlyc3RVcGRhdGVQYXNzKHRWaWV3LCBudWxsLCBiaW5kaW5nSW5kZXgsIGlzQ2xhc3NCYXNlZCk7XG4gIH1cbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBpZiAodmFsdWUgIT09IE5PX0NIQU5HRSAmJiBiaW5kaW5nVXBkYXRlZChsVmlldywgYmluZGluZ0luZGV4LCB2YWx1ZSkpIHtcbiAgICAvLyBgZ2V0U2VsZWN0ZWRJbmRleCgpYCBzaG91bGQgYmUgaGVyZSAocmF0aGVyIHRoYW4gaW4gaW5zdHJ1Y3Rpb24pIHNvIHRoYXQgaXQgaXMgZ3VhcmRlZCBieSB0aGVcbiAgICAvLyBpZiBzbyBhcyBub3QgdG8gcmVhZCB1bm5lY2Vzc2FyaWx5LlxuICAgIGNvbnN0IHROb2RlID0gdFZpZXcuZGF0YVtnZXRTZWxlY3RlZEluZGV4KCkgKyBIRUFERVJfT0ZGU0VUXSBhcyBUTm9kZTtcbiAgICBpZiAoaGFzU3R5bGluZ0lucHV0U2hhZG93KHROb2RlLCBpc0NsYXNzQmFzZWQpICYmICFpc0luSG9zdEJpbmRpbmdzKHRWaWV3LCBiaW5kaW5nSW5kZXgpKSB7XG4gICAgICBpZiAobmdEZXZNb2RlKSB7XG4gICAgICAgIC8vIHZlcmlmeSB0aGF0IGlmIHdlIGFyZSBzaGFkb3dpbmcgdGhlbiBgVERhdGFgIGlzIGFwcHJvcHJpYXRlbHkgbWFya2VkIHNvIHRoYXQgd2Ugc2tpcFxuICAgICAgICAvLyBwcm9jZXNzaW5nIHRoaXMgYmluZGluZyBpbiBzdHlsaW5nIHJlc29sdXRpb24uXG4gICAgICAgIGNvbnN0IHRTdHlsaW5nS2V5ID0gdFZpZXcuZGF0YVtiaW5kaW5nSW5kZXhdO1xuICAgICAgICBhc3NlcnRFcXVhbChcbiAgICAgICAgICAgIEFycmF5LmlzQXJyYXkodFN0eWxpbmdLZXkpID8gdFN0eWxpbmdLZXlbMV0gOiB0U3R5bGluZ0tleSwgZmFsc2UsXG4gICAgICAgICAgICAnU3R5bGluZyBsaW5rZWQgbGlzdCBzaGFkb3cgaW5wdXQgc2hvdWxkIGJlIG1hcmtlZCBhcyBcXCdmYWxzZVxcJycpO1xuICAgICAgfVxuICAgICAgLy8gVkUgZG9lcyBub3QgY29uY2F0ZW5hdGUgdGhlIHN0YXRpYyBwb3J0aW9uIGxpa2Ugd2UgYXJlIGRvaW5nIGhlcmUuXG4gICAgICAvLyBJbnN0ZWFkIFZFIGp1c3QgaWdub3JlcyB0aGUgc3RhdGljIGNvbXBsZXRlbHkgaWYgZHluYW1pYyBiaW5kaW5nIGlzIHByZXNlbnQuXG4gICAgICAvLyBCZWNhdXNlIG9mIGxvY2FsaXR5IHdlIGhhdmUgYWxyZWFkeSBzZXQgdGhlIHN0YXRpYyBwb3J0aW9uIGJlY2F1c2Ugd2UgZG9uJ3Qga25vdyBpZiB0aGVyZVxuICAgICAgLy8gaXMgYSBkeW5hbWljIHBvcnRpb24gdW50aWwgbGF0ZXIuIElmIHdlIHdvdWxkIGlnbm9yZSB0aGUgc3RhdGljIHBvcnRpb24gaXQgd291bGQgbG9vayBsaWtlXG4gICAgICAvLyB0aGUgYmluZGluZyBoYXMgcmVtb3ZlZCBpdC4gVGhpcyB3b3VsZCBjb25mdXNlIGBbbmdTdHlsZV1gL2BbbmdDbGFzc11gIHRvIGRvIHRoZSB3cm9uZ1xuICAgICAgLy8gdGhpbmcgYXMgaXQgd291bGQgdGhpbmsgdGhhdCB0aGUgc3RhdGljIHBvcnRpb24gd2FzIHJlbW92ZWQuIEZvciB0aGlzIHJlYXNvbiB3ZVxuICAgICAgLy8gY29uY2F0ZW5hdGUgaXQgc28gdGhhdCBgW25nU3R5bGVdYC9gW25nQ2xhc3NdYCAgY2FuIGNvbnRpbnVlIHRvIHdvcmsgb24gY2hhbmdlZC5cbiAgICAgIGxldCBzdGF0aWNQcmVmaXggPSBpc0NsYXNzQmFzZWQgPyB0Tm9kZS5jbGFzc2VzIDogdE5vZGUuc3R5bGVzO1xuICAgICAgbmdEZXZNb2RlICYmIGlzQ2xhc3NCYXNlZCA9PT0gZmFsc2UgJiYgc3RhdGljUHJlZml4ICE9PSBudWxsICYmXG4gICAgICAgICAgYXNzZXJ0RXF1YWwoXG4gICAgICAgICAgICAgIHN0YXRpY1ByZWZpeC5lbmRzV2l0aCgnOycpLCB0cnVlLCAnRXhwZWN0aW5nIHN0YXRpYyBwb3J0aW9uIHRvIGVuZCB3aXRoIFxcJztcXCcnKTtcbiAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIHZhbHVlID0gY29uY2F0U3RyaW5nc1dpdGhTcGFjZShzdGF0aWNQcmVmaXgsIHZhbHVlIGFzIHN0cmluZyk7XG4gICAgICB9XG4gICAgICAvLyBHaXZlbiBgPGRpdiBbc3R5bGVdIG15LWRpcj5gIHN1Y2ggdGhhdCBgbXktZGlyYCBoYXMgYEBJbnB1dCgnc3R5bGUnKWAuXG4gICAgICAvLyBUaGlzIHRha2VzIG92ZXIgdGhlIGBbc3R5bGVdYCBiaW5kaW5nLiAoU2FtZSBmb3IgYFtjbGFzc11gKVxuICAgICAgc2V0RGlyZWN0aXZlSW5wdXRzV2hpY2hTaGFkb3dzU3R5bGluZyh0VmlldywgdE5vZGUsIGxWaWV3LCB2YWx1ZSwgaXNDbGFzc0Jhc2VkKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdXBkYXRlU3R5bGluZ01hcChcbiAgICAgICAgICB0VmlldywgdE5vZGUsIGxWaWV3LCBsVmlld1tSRU5ERVJFUl0sIGxWaWV3W2JpbmRpbmdJbmRleCArIDFdLFxuICAgICAgICAgIGxWaWV3W2JpbmRpbmdJbmRleCArIDFdID0gdG9TdHlsaW5nS2V5VmFsdWVBcnJheShrZXlWYWx1ZUFycmF5U2V0LCBzdHJpbmdQYXJzZXIsIHZhbHVlKSxcbiAgICAgICAgICBpc0NsYXNzQmFzZWQsIGJpbmRpbmdJbmRleCk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogRGV0ZXJtaW5lcyB3aGVuIHRoZSBiaW5kaW5nIGlzIGluIGBob3N0QmluZGluZ3NgIHNlY3Rpb25cbiAqXG4gKiBAcGFyYW0gdFZpZXcgQ3VycmVudCBgVFZpZXdgXG4gKiBAcGFyYW0gYmluZGluZ0luZGV4IGluZGV4IG9mIGJpbmRpbmcgd2hpY2ggd2Ugd291bGQgbGlrZSBpZiBpdCBpcyBpbiBgaG9zdEJpbmRpbmdzYFxuICovXG5mdW5jdGlvbiBpc0luSG9zdEJpbmRpbmdzKHRWaWV3OiBUVmlldywgYmluZGluZ0luZGV4OiBudW1iZXIpOiBib29sZWFuIHtcbiAgLy8gQWxsIGhvc3QgYmluZGluZ3MgYXJlIHBsYWNlZCBhZnRlciB0aGUgZXhwYW5kbyBzZWN0aW9uLlxuICByZXR1cm4gYmluZGluZ0luZGV4ID49IHRWaWV3LmV4cGFuZG9TdGFydEluZGV4O1xufVxuXG4vKipcbiogQ29sbGVjdHMgdGhlIG5lY2Vzc2FyeSBpbmZvcm1hdGlvbiB0byBpbnNlcnQgdGhlIGJpbmRpbmcgaW50byBhIGxpbmtlZCBsaXN0IG9mIHN0eWxlIGJpbmRpbmdzXG4qIHVzaW5nIGBpbnNlcnRUU3R5bGluZ0JpbmRpbmdgLlxuKlxuKiBAcGFyYW0gdFZpZXcgYFRWaWV3YCB3aGVyZSB0aGUgYmluZGluZyBsaW5rZWQgbGlzdCB3aWxsIGJlIHN0b3JlZC5cbiogQHBhcmFtIHRTdHlsaW5nS2V5IFByb3BlcnR5L2tleSBvZiB0aGUgYmluZGluZy5cbiogQHBhcmFtIGJpbmRpbmdJbmRleCBJbmRleCBvZiBiaW5kaW5nIGFzc29jaWF0ZWQgd2l0aCB0aGUgYHByb3BgXG4qIEBwYXJhbSBpc0NsYXNzQmFzZWQgYHRydWVgIGlmIGBjbGFzc2AgY2hhbmdlIChgZmFsc2VgIGlmIGBzdHlsZWApXG4qL1xuZnVuY3Rpb24gc3R5bGluZ0ZpcnN0VXBkYXRlUGFzcyhcbiAgICB0VmlldzogVFZpZXcsIHRTdHlsaW5nS2V5OiBUU3R5bGluZ0tleSwgYmluZGluZ0luZGV4OiBudW1iZXIsIGlzQ2xhc3NCYXNlZDogYm9vbGVhbik6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Rmlyc3RVcGRhdGVQYXNzKHRWaWV3KTtcbiAgY29uc3QgdERhdGEgPSB0Vmlldy5kYXRhO1xuICBpZiAodERhdGFbYmluZGluZ0luZGV4ICsgMV0gPT09IG51bGwpIHtcbiAgICAvLyBUaGUgYWJvdmUgY2hlY2sgaXMgbmVjZXNzYXJ5IGJlY2F1c2Ugd2UgZG9uJ3QgY2xlYXIgZmlyc3QgdXBkYXRlIHBhc3MgdW50aWwgZmlyc3Qgc3VjY2Vzc2Z1bFxuICAgIC8vIChubyBleGNlcHRpb24pIHRlbXBsYXRlIGV4ZWN1dGlvbi4gVGhpcyBwcmV2ZW50cyB0aGUgc3R5bGluZyBpbnN0cnVjdGlvbiBmcm9tIGRvdWJsZSBhZGRpbmdcbiAgICAvLyBpdHNlbGYgdG8gdGhlIGxpc3QuXG4gICAgLy8gYGdldFNlbGVjdGVkSW5kZXgoKWAgc2hvdWxkIGJlIGhlcmUgKHJhdGhlciB0aGFuIGluIGluc3RydWN0aW9uKSBzbyB0aGF0IGl0IGlzIGd1YXJkZWQgYnkgdGhlXG4gICAgLy8gaWYgc28gYXMgbm90IHRvIHJlYWQgdW5uZWNlc3NhcmlseS5cbiAgICBjb25zdCB0Tm9kZSA9IHREYXRhW2dldFNlbGVjdGVkSW5kZXgoKSArIEhFQURFUl9PRkZTRVRdIGFzIFROb2RlO1xuICAgIGNvbnN0IGlzSG9zdEJpbmRpbmdzID0gaXNJbkhvc3RCaW5kaW5ncyh0VmlldywgYmluZGluZ0luZGV4KTtcbiAgICBpZiAoaGFzU3R5bGluZ0lucHV0U2hhZG93KHROb2RlLCBpc0NsYXNzQmFzZWQpICYmIHRTdHlsaW5nS2V5ID09PSBudWxsICYmICFpc0hvc3RCaW5kaW5ncykge1xuICAgICAgLy8gYHRTdHlsaW5nS2V5ID09PSBudWxsYCBpbXBsaWVzIHRoYXQgd2UgYXJlIGVpdGhlciBgW3N0eWxlXWAgb3IgYFtjbGFzc11gIGJpbmRpbmcuXG4gICAgICAvLyBJZiB0aGVyZSBpcyBhIGRpcmVjdGl2ZSB3aGljaCB1c2VzIGBASW5wdXQoJ3N0eWxlJylgIG9yIGBASW5wdXQoJ2NsYXNzJylgIHRoYW5cbiAgICAgIC8vIHdlIG5lZWQgdG8gbmV1dHJhbGl6ZSB0aGlzIGJpbmRpbmcgc2luY2UgdGhhdCBkaXJlY3RpdmUgaXMgc2hhZG93aW5nIGl0LlxuICAgICAgLy8gV2UgdHVybiB0aGlzIGludG8gYSBub29wIGJ5IHNldHRpbmcgdGhlIGtleSB0byBgZmFsc2VgXG4gICAgICB0U3R5bGluZ0tleSA9IGZhbHNlO1xuICAgIH1cbiAgICB0U3R5bGluZ0tleSA9IHdyYXBJblN0YXRpY1N0eWxpbmdLZXkodERhdGEsIHROb2RlLCB0U3R5bGluZ0tleSwgaXNDbGFzc0Jhc2VkKTtcbiAgICBpbnNlcnRUU3R5bGluZ0JpbmRpbmcodERhdGEsIHROb2RlLCB0U3R5bGluZ0tleSwgYmluZGluZ0luZGV4LCBpc0hvc3RCaW5kaW5ncywgaXNDbGFzc0Jhc2VkKTtcbiAgfVxufVxuXG4vKipcbiAqIEFkZHMgc3RhdGljIHN0eWxpbmcgaW5mb3JtYXRpb24gdG8gdGhlIGJpbmRpbmcgaWYgYXBwbGljYWJsZS5cbiAqXG4gKiBUaGUgbGlua2VkIGxpc3Qgb2Ygc3R5bGVzIG5vdCBvbmx5IHN0b3JlcyB0aGUgbGlzdCBhbmQga2V5cywgYnV0IGFsc28gc3RvcmVzIHN0YXRpYyBzdHlsaW5nXG4gKiBpbmZvcm1hdGlvbiBvbiBzb21lIG9mIHRoZSBrZXlzLiBUaGlzIGZ1bmN0aW9uIGRldGVybWluZXMgaWYgdGhlIGtleSBzaG91bGQgY29udGFpbiB0aGUgc3R5bGluZ1xuICogaW5mb3JtYXRpb24gYW5kIGNvbXB1dGVzIGl0LlxuICpcbiAqIFNlZSBgVFN0eWxpbmdTdGF0aWNgIGZvciBtb3JlIGRldGFpbHMuXG4gKlxuICogQHBhcmFtIHREYXRhIGBURGF0YWAgd2hlcmUgdGhlIGxpbmtlZCBsaXN0IGlzIHN0b3JlZC5cbiAqIEBwYXJhbSB0Tm9kZSBgVE5vZGVgIGZvciB3aGljaCB0aGUgc3R5bGluZyBpcyBiZWluZyBjb21wdXRlZC5cbiAqIEBwYXJhbSBzdHlsaW5nS2V5IGBUU3R5bGluZ0tleVByaW1pdGl2ZWAgd2hpY2ggbWF5IG5lZWQgdG8gYmUgd3JhcHBlZCBpbnRvIGBUU3R5bGluZ0tleWBcbiAqIEBwYXJhbSBpc0NsYXNzQmFzZWQgYHRydWVgIGlmIGBjbGFzc2AgKGBmYWxzZWAgaWYgYHN0eWxlYClcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHdyYXBJblN0YXRpY1N0eWxpbmdLZXkoXG4gICAgdERhdGE6IFREYXRhLCB0Tm9kZTogVE5vZGUsIHN0eWxpbmdLZXk6IFRTdHlsaW5nS2V5LCBpc0NsYXNzQmFzZWQ6IGJvb2xlYW4pOiBUU3R5bGluZ0tleSB7XG4gIGNvbnN0IGhvc3REaXJlY3RpdmVEZWYgPSBnZXRIb3N0RGlyZWN0aXZlRGVmKHREYXRhKTtcbiAgbGV0IHJlc2lkdWFsID0gaXNDbGFzc0Jhc2VkID8gdE5vZGUucmVzaWR1YWxDbGFzc2VzIDogdE5vZGUucmVzaWR1YWxTdHlsZXM7XG4gIGlmIChob3N0RGlyZWN0aXZlRGVmID09PSBudWxsKSB7XG4gICAgLy8gV2UgYXJlIGluIHRlbXBsYXRlIG5vZGUuXG4gICAgLy8gSWYgdGVtcGxhdGUgbm9kZSBhbHJlYWR5IGhhZCBzdHlsaW5nIGluc3RydWN0aW9uIHRoZW4gaXQgaGFzIGFscmVhZHkgY29sbGVjdGVkIHRoZSBzdGF0aWNcbiAgICAvLyBzdHlsaW5nIGFuZCB0aGVyZSBpcyBubyBuZWVkIHRvIGNvbGxlY3QgdGhlbSBhZ2Fpbi4gV2Uga25vdyB0aGF0IHdlIGFyZSB0aGUgZmlyc3Qgc3R5bGluZ1xuICAgIC8vIGluc3RydWN0aW9uIGJlY2F1c2UgdGhlIGBUTm9kZS4qQmluZGluZ3NgIHBvaW50cyB0byAwIChub3RoaW5nIGhhcyBiZWVuIGluc2VydGVkIHlldCkuXG4gICAgY29uc3QgaXNGaXJzdFN0eWxpbmdJbnN0cnVjdGlvbkluVGVtcGxhdGUgPVxuICAgICAgICAoaXNDbGFzc0Jhc2VkID8gdE5vZGUuY2xhc3NCaW5kaW5ncyA6IHROb2RlLnN0eWxlQmluZGluZ3MpIGFzIGFueSBhcyBudW1iZXIgPT09IDA7XG4gICAgaWYgKGlzRmlyc3RTdHlsaW5nSW5zdHJ1Y3Rpb25JblRlbXBsYXRlKSB7XG4gICAgICAvLyBJdCB3b3VsZCBiZSBuaWNlIHRvIGJlIGFibGUgdG8gZ2V0IHRoZSBzdGF0aWNzIGZyb20gYG1lcmdlQXR0cnNgLCBob3dldmVyLCBhdCB0aGlzIHBvaW50XG4gICAgICAvLyB0aGV5IGFyZSBhbHJlYWR5IG1lcmdlZCBhbmQgaXQgd291bGQgbm90IGJlIHBvc3NpYmxlIHRvIGZpZ3VyZSB3aGljaCBwcm9wZXJ0eSBiZWxvbmdzIHdoZXJlXG4gICAgICAvLyBpbiB0aGUgcHJpb3JpdHkuXG4gICAgICBzdHlsaW5nS2V5ID0gY29sbGVjdFN0eWxpbmdGcm9tRGlyZWN0aXZlcyhudWxsLCB0RGF0YSwgdE5vZGUsIHN0eWxpbmdLZXksIGlzQ2xhc3NCYXNlZCk7XG4gICAgICBzdHlsaW5nS2V5ID0gY29sbGVjdFN0eWxpbmdGcm9tVEF0dHJzKHN0eWxpbmdLZXksIHROb2RlLmF0dHJzLCBpc0NsYXNzQmFzZWQpO1xuICAgICAgLy8gV2Uga25vdyB0aGF0IGlmIHdlIGhhdmUgc3R5bGluZyBiaW5kaW5nIGluIHRlbXBsYXRlIHdlIGNhbid0IGhhdmUgcmVzaWR1YWwuXG4gICAgICByZXNpZHVhbCA9IG51bGw7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIC8vIFdlIGFyZSBpbiBob3N0IGJpbmRpbmcgbm9kZSBhbmQgdGhlcmUgd2FzIG5vIGJpbmRpbmcgaW5zdHJ1Y3Rpb24gaW4gdGVtcGxhdGUgbm9kZS5cbiAgICAvLyBUaGlzIG1lYW5zIHRoYXQgd2UgbmVlZCB0byBjb21wdXRlIHRoZSByZXNpZHVhbC5cbiAgICBjb25zdCBkaXJlY3RpdmVTdHlsaW5nTGFzdCA9IHROb2RlLmRpcmVjdGl2ZVN0eWxpbmdMYXN0O1xuICAgIGNvbnN0IGlzRmlyc3RTdHlsaW5nSW5zdHJ1Y3Rpb25Jbkhvc3RCaW5kaW5nID1cbiAgICAgICAgZGlyZWN0aXZlU3R5bGluZ0xhc3QgPT09IC0xIHx8IHREYXRhW2RpcmVjdGl2ZVN0eWxpbmdMYXN0XSAhPT0gaG9zdERpcmVjdGl2ZURlZjtcbiAgICBpZiAoaXNGaXJzdFN0eWxpbmdJbnN0cnVjdGlvbkluSG9zdEJpbmRpbmcpIHtcbiAgICAgIHN0eWxpbmdLZXkgPVxuICAgICAgICAgIGNvbGxlY3RTdHlsaW5nRnJvbURpcmVjdGl2ZXMoaG9zdERpcmVjdGl2ZURlZiwgdERhdGEsIHROb2RlLCBzdHlsaW5nS2V5LCBpc0NsYXNzQmFzZWQpO1xuICAgICAgaWYgKHJlc2lkdWFsID09PSBudWxsKSB7XG4gICAgICAgIC8vIC0gSWYgYG51bGxgIHRoYW4gZWl0aGVyOlxuICAgICAgICAvLyAgICAtIFRlbXBsYXRlIHN0eWxpbmcgaW5zdHJ1Y3Rpb24gYWxyZWFkeSByYW4gYW5kIGl0IGhhcyBjb25zdW1lZCB0aGUgc3RhdGljXG4gICAgICAgIC8vICAgICAgc3R5bGluZyBpbnRvIGl0cyBgVFN0eWxpbmdLZXlgIGFuZCBzbyB0aGVyZSBpcyBubyBuZWVkIHRvIHVwZGF0ZSByZXNpZHVhbC4gSW5zdGVhZFxuICAgICAgICAvLyAgICAgIHdlIG5lZWQgdG8gdXBkYXRlIHRoZSBgVFN0eWxpbmdLZXlgIGFzc29jaWF0ZWQgd2l0aCB0aGUgZmlyc3QgdGVtcGxhdGUgbm9kZVxuICAgICAgICAvLyAgICAgIGluc3RydWN0aW9uLiBPUlxuICAgICAgICAvLyAgICAtIFNvbWUgb3RoZXIgc3R5bGluZyBpbnN0cnVjdGlvbiByYW4gYW5kIGRldGVybWluZWQgdGhhdCB0aGVyZSBhcmUgbm8gcmVzaWR1YWxzXG4gICAgICAgIGxldCB0ZW1wbGF0ZVN0eWxpbmdLZXkgPSBnZXRUZW1wbGF0ZUhlYWRUU3R5bGluZ0tleSh0RGF0YSwgdE5vZGUsIGlzQ2xhc3NCYXNlZCk7XG4gICAgICAgIGlmICh0ZW1wbGF0ZVN0eWxpbmdLZXkgIT09IHVuZGVmaW5lZCAmJiBBcnJheS5pc0FycmF5KHRlbXBsYXRlU3R5bGluZ0tleSkpIHtcbiAgICAgICAgICAvLyBPbmx5IHJlY29tcHV0ZSBpZiBgdGVtcGxhdGVTdHlsaW5nS2V5YCBoYWQgc3RhdGljIHZhbHVlcy4gKElmIG5vIHN0YXRpYyB2YWx1ZSBmb3VuZFxuICAgICAgICAgIC8vIHRoZW4gdGhlcmUgaXMgbm90aGluZyB0byBkbyBzaW5jZSB0aGlzIG9wZXJhdGlvbiBjYW4gb25seSBwcm9kdWNlIGxlc3Mgc3RhdGljIGtleXMsIG5vdFxuICAgICAgICAgIC8vIG1vcmUuKVxuICAgICAgICAgIHRlbXBsYXRlU3R5bGluZ0tleSA9IGNvbGxlY3RTdHlsaW5nRnJvbURpcmVjdGl2ZXMoXG4gICAgICAgICAgICAgIG51bGwsIHREYXRhLCB0Tm9kZSwgdGVtcGxhdGVTdHlsaW5nS2V5WzFdIC8qIHVud3JhcCBwcmV2aW91cyBzdGF0aWNzICovLFxuICAgICAgICAgICAgICBpc0NsYXNzQmFzZWQpO1xuICAgICAgICAgIHRlbXBsYXRlU3R5bGluZ0tleSA9XG4gICAgICAgICAgICAgIGNvbGxlY3RTdHlsaW5nRnJvbVRBdHRycyh0ZW1wbGF0ZVN0eWxpbmdLZXksIHROb2RlLmF0dHJzLCBpc0NsYXNzQmFzZWQpO1xuICAgICAgICAgIHNldFRlbXBsYXRlSGVhZFRTdHlsaW5nS2V5KHREYXRhLCB0Tm9kZSwgaXNDbGFzc0Jhc2VkLCB0ZW1wbGF0ZVN0eWxpbmdLZXkpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBXZSBvbmx5IG5lZWQgdG8gcmVjb21wdXRlIHJlc2lkdWFsIGlmIGl0IGlzIG5vdCBgbnVsbGAuXG4gICAgICAgIC8vIC0gSWYgZXhpc3RpbmcgcmVzaWR1YWwgKGltcGxpZXMgdGhlcmUgd2FzIG5vIHRlbXBsYXRlIHN0eWxpbmcpLiBUaGlzIG1lYW5zIHRoYXQgc29tZSBvZlxuICAgICAgICAvLyAgIHRoZSBzdGF0aWNzIG1heSBoYXZlIG1vdmVkIGZyb20gdGhlIHJlc2lkdWFsIHRvIHRoZSBgc3R5bGluZ0tleWAgYW5kIHNvIHdlIGhhdmUgdG9cbiAgICAgICAgLy8gICByZWNvbXB1dGUuXG4gICAgICAgIC8vIC0gSWYgYHVuZGVmaW5lZGAgdGhpcyBpcyB0aGUgZmlyc3QgdGltZSB3ZSBhcmUgcnVubmluZy5cbiAgICAgICAgcmVzaWR1YWwgPSBjb2xsZWN0UmVzaWR1YWwodERhdGEsIHROb2RlLCBpc0NsYXNzQmFzZWQpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICBpZiAocmVzaWR1YWwgIT09IHVuZGVmaW5lZCkge1xuICAgIGlzQ2xhc3NCYXNlZCA/ICh0Tm9kZS5yZXNpZHVhbENsYXNzZXMgPSByZXNpZHVhbCkgOiAodE5vZGUucmVzaWR1YWxTdHlsZXMgPSByZXNpZHVhbCk7XG4gIH1cbiAgcmV0dXJuIHN0eWxpbmdLZXk7XG59XG5cbi8qKlxuICogUmV0cmlldmUgdGhlIGBUU3R5bGluZ0tleWAgZm9yIHRoZSB0ZW1wbGF0ZSBzdHlsaW5nIGluc3RydWN0aW9uLlxuICpcbiAqIFRoaXMgaXMgbmVlZGVkIHNpbmNlIGBob3N0QmluZGluZ2Agc3R5bGluZyBpbnN0cnVjdGlvbnMgYXJlIGluc2VydGVkIGFmdGVyIHRoZSB0ZW1wbGF0ZVxuICogaW5zdHJ1Y3Rpb24uIFdoaWxlIHRoZSB0ZW1wbGF0ZSBpbnN0cnVjdGlvbiBuZWVkcyB0byB1cGRhdGUgdGhlIHJlc2lkdWFsIGluIGBUTm9kZWAgdGhlXG4gKiBgaG9zdEJpbmRpbmdgIGluc3RydWN0aW9ucyBuZWVkIHRvIHVwZGF0ZSB0aGUgYFRTdHlsaW5nS2V5YCBvZiB0aGUgdGVtcGxhdGUgaW5zdHJ1Y3Rpb24gYmVjYXVzZVxuICogdGhlIHRlbXBsYXRlIGluc3RydWN0aW9uIGlzIGRvd25zdHJlYW0gZnJvbSB0aGUgYGhvc3RCaW5kaW5nc2AgaW5zdHJ1Y3Rpb25zLlxuICpcbiAqIEBwYXJhbSB0RGF0YSBgVERhdGFgIHdoZXJlIHRoZSBsaW5rZWQgbGlzdCBpcyBzdG9yZWQuXG4gKiBAcGFyYW0gdE5vZGUgYFROb2RlYCBmb3Igd2hpY2ggdGhlIHN0eWxpbmcgaXMgYmVpbmcgY29tcHV0ZWQuXG4gKiBAcGFyYW0gaXNDbGFzc0Jhc2VkIGB0cnVlYCBpZiBgY2xhc3NgIChgZmFsc2VgIGlmIGBzdHlsZWApXG4gKiBAcmV0dXJuIGBUU3R5bGluZ0tleWAgaWYgZm91bmQgb3IgYHVuZGVmaW5lZGAgaWYgbm90IGZvdW5kLlxuICovXG5mdW5jdGlvbiBnZXRUZW1wbGF0ZUhlYWRUU3R5bGluZ0tleSh0RGF0YTogVERhdGEsIHROb2RlOiBUTm9kZSwgaXNDbGFzc0Jhc2VkOiBib29sZWFuKTogVFN0eWxpbmdLZXl8XG4gICAgdW5kZWZpbmVkIHtcbiAgY29uc3QgYmluZGluZ3MgPSBpc0NsYXNzQmFzZWQgPyB0Tm9kZS5jbGFzc0JpbmRpbmdzIDogdE5vZGUuc3R5bGVCaW5kaW5ncztcbiAgaWYgKGdldFRTdHlsaW5nUmFuZ2VOZXh0KGJpbmRpbmdzKSA9PT0gMCkge1xuICAgIC8vIFRoZXJlIGRvZXMgbm90IHNlZW0gdG8gYmUgYSBzdHlsaW5nIGluc3RydWN0aW9uIGluIHRoZSBgdGVtcGxhdGVgLlxuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cbiAgcmV0dXJuIHREYXRhW2dldFRTdHlsaW5nUmFuZ2VQcmV2KGJpbmRpbmdzKV0gYXMgVFN0eWxpbmdLZXk7XG59XG5cbi8qKlxuICogVXBkYXRlIHRoZSBgVFN0eWxpbmdLZXlgIG9mIHRoZSBmaXJzdCB0ZW1wbGF0ZSBpbnN0cnVjdGlvbiBpbiBgVE5vZGVgLlxuICpcbiAqIExvZ2ljYWxseSBgaG9zdEJpbmRpbmdzYCBzdHlsaW5nIGluc3RydWN0aW9ucyBhcmUgb2YgbG93ZXIgcHJpb3JpdHkgdGhhbiB0aGF0IG9mIHRoZSB0ZW1wbGF0ZS5cbiAqIEhvd2V2ZXIsIHRoZXkgZXhlY3V0ZSBhZnRlciB0aGUgdGVtcGxhdGUgc3R5bGluZyBpbnN0cnVjdGlvbnMuIFRoaXMgbWVhbnMgdGhhdCB0aGV5IGdldCBpbnNlcnRlZFxuICogaW4gZnJvbnQgb2YgdGhlIHRlbXBsYXRlIHN0eWxpbmcgaW5zdHJ1Y3Rpb25zLlxuICpcbiAqIElmIHdlIGhhdmUgYSB0ZW1wbGF0ZSBzdHlsaW5nIGluc3RydWN0aW9uIGFuZCBhIG5ldyBgaG9zdEJpbmRpbmdzYCBzdHlsaW5nIGluc3RydWN0aW9uIGlzXG4gKiBleGVjdXRlZCBpdCBtZWFucyB0aGF0IGl0IG1heSBuZWVkIHRvIHN0ZWFsIHN0YXRpYyBmaWVsZHMgZnJvbSB0aGUgdGVtcGxhdGUgaW5zdHJ1Y3Rpb24uIFRoaXNcbiAqIG1ldGhvZCBhbGxvd3MgdXMgdG8gdXBkYXRlIHRoZSBmaXJzdCB0ZW1wbGF0ZSBpbnN0cnVjdGlvbiBgVFN0eWxpbmdLZXlgIHdpdGggYSBuZXcgdmFsdWUuXG4gKlxuICogQXNzdW1lOlxuICogYGBgXG4gKiA8ZGl2IG15LWRpciBzdHlsZT1cImNvbG9yOiByZWRcIiBbc3R5bGUuY29sb3JdPVwidG1wbEV4cFwiPjwvZGl2PlxuICpcbiAqIEBEaXJlY3RpdmUoe1xuICogICBob3N0OiB7XG4gKiAgICAgJ3N0eWxlJzogJ3dpZHRoOiAxMDBweCcsXG4gKiAgICAgJ1tzdHlsZS5jb2xvcl0nOiAnZGlyRXhwJyxcbiAqICAgfVxuICogfSlcbiAqIGNsYXNzIE15RGlyIHt9XG4gKiBgYGBcbiAqXG4gKiB3aGVuIGBbc3R5bGUuY29sb3JdPVwidG1wbEV4cFwiYCBleGVjdXRlcyBpdCBjcmVhdGVzIHRoaXMgZGF0YSBzdHJ1Y3R1cmUuXG4gKiBgYGBcbiAqICBbJycsICdjb2xvcicsICdjb2xvcicsICdyZWQnLCAnd2lkdGgnLCAnMTAwcHgnXSxcbiAqIGBgYFxuICpcbiAqIFRoZSByZWFzb24gZm9yIHRoaXMgaXMgdGhhdCB0aGUgdGVtcGxhdGUgaW5zdHJ1Y3Rpb24gZG9lcyBub3Qga25vdyBpZiB0aGVyZSBhcmUgc3R5bGluZ1xuICogaW5zdHJ1Y3Rpb25zIGFuZCBtdXN0IGFzc3VtZSB0aGF0IHRoZXJlIGFyZSBub25lIGFuZCBtdXN0IGNvbGxlY3QgYWxsIG9mIHRoZSBzdGF0aWMgc3R5bGluZy5cbiAqIChib3RoXG4gKiBgY29sb3InIGFuZCAnd2lkdGhgKVxuICpcbiAqIFdoZW4gYCdbc3R5bGUuY29sb3JdJzogJ2RpckV4cCcsYCBleGVjdXRlcyB3ZSBuZWVkIHRvIGluc2VydCBhIG5ldyBkYXRhIGludG8gdGhlIGxpbmtlZCBsaXN0LlxuICogYGBgXG4gKiAgWycnLCAnY29sb3InLCAnd2lkdGgnLCAnMTAwcHgnXSwgIC8vIG5ld2x5IGluc2VydGVkXG4gKiAgWycnLCAnY29sb3InLCAnY29sb3InLCAncmVkJywgJ3dpZHRoJywgJzEwMHB4J10sIC8vIHRoaXMgaXMgd3JvbmdcbiAqIGBgYFxuICpcbiAqIE5vdGljZSB0aGF0IHRoZSB0ZW1wbGF0ZSBzdGF0aWNzIGlzIG5vdyB3cm9uZyBhcyBpdCBpbmNvcnJlY3RseSBjb250YWlucyBgd2lkdGhgIHNvIHdlIG5lZWQgdG9cbiAqIHVwZGF0ZSBpdCBsaWtlIHNvOlxuICogYGBgXG4gKiAgWycnLCAnY29sb3InLCAnd2lkdGgnLCAnMTAwcHgnXSxcbiAqICBbJycsICdjb2xvcicsICdjb2xvcicsICdyZWQnXSwgICAgLy8gVVBEQVRFXG4gKiBgYGBcbiAqXG4gKiBAcGFyYW0gdERhdGEgYFREYXRhYCB3aGVyZSB0aGUgbGlua2VkIGxpc3QgaXMgc3RvcmVkLlxuICogQHBhcmFtIHROb2RlIGBUTm9kZWAgZm9yIHdoaWNoIHRoZSBzdHlsaW5nIGlzIGJlaW5nIGNvbXB1dGVkLlxuICogQHBhcmFtIGlzQ2xhc3NCYXNlZCBgdHJ1ZWAgaWYgYGNsYXNzYCAoYGZhbHNlYCBpZiBgc3R5bGVgKVxuICogQHBhcmFtIHRTdHlsaW5nS2V5IE5ldyBgVFN0eWxpbmdLZXlgIHdoaWNoIGlzIHJlcGxhY2luZyB0aGUgb2xkIG9uZS5cbiAqL1xuZnVuY3Rpb24gc2V0VGVtcGxhdGVIZWFkVFN0eWxpbmdLZXkoXG4gICAgdERhdGE6IFREYXRhLCB0Tm9kZTogVE5vZGUsIGlzQ2xhc3NCYXNlZDogYm9vbGVhbiwgdFN0eWxpbmdLZXk6IFRTdHlsaW5nS2V5KTogdm9pZCB7XG4gIGNvbnN0IGJpbmRpbmdzID0gaXNDbGFzc0Jhc2VkID8gdE5vZGUuY2xhc3NCaW5kaW5ncyA6IHROb2RlLnN0eWxlQmluZGluZ3M7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb3RFcXVhbChcbiAgICAgICAgICAgICAgICAgICBnZXRUU3R5bGluZ1JhbmdlTmV4dChiaW5kaW5ncyksIDAsXG4gICAgICAgICAgICAgICAgICAgJ0V4cGVjdGluZyB0byBoYXZlIGF0IGxlYXN0IG9uZSB0ZW1wbGF0ZSBzdHlsaW5nIGJpbmRpbmcuJyk7XG4gIHREYXRhW2dldFRTdHlsaW5nUmFuZ2VQcmV2KGJpbmRpbmdzKV0gPSB0U3R5bGluZ0tleTtcbn1cblxuLyoqXG4gKiBDb2xsZWN0IGFsbCBzdGF0aWMgdmFsdWVzIGFmdGVyIHRoZSBjdXJyZW50IGBUTm9kZS5kaXJlY3RpdmVTdHlsaW5nTGFzdGAgaW5kZXguXG4gKlxuICogQ29sbGVjdCB0aGUgcmVtYWluaW5nIHN0eWxpbmcgaW5mb3JtYXRpb24gd2hpY2ggaGFzIG5vdCB5ZXQgYmVlbiBjb2xsZWN0ZWQgYnkgYW4gZXhpc3RpbmdcbiAqIHN0eWxpbmcgaW5zdHJ1Y3Rpb24uXG4gKlxuICogQHBhcmFtIHREYXRhIGBURGF0YWAgd2hlcmUgdGhlIGBEaXJlY3RpdmVEZWZzYCBhcmUgc3RvcmVkLlxuICogQHBhcmFtIHROb2RlIGBUTm9kZWAgd2hpY2ggY29udGFpbnMgdGhlIGRpcmVjdGl2ZSByYW5nZS5cbiAqIEBwYXJhbSBpc0NsYXNzQmFzZWQgYHRydWVgIGlmIGBjbGFzc2AgKGBmYWxzZWAgaWYgYHN0eWxlYClcbiAqL1xuZnVuY3Rpb24gY29sbGVjdFJlc2lkdWFsKHREYXRhOiBURGF0YSwgdE5vZGU6IFROb2RlLCBpc0NsYXNzQmFzZWQ6IGJvb2xlYW4pOiBLZXlWYWx1ZUFycmF5PGFueT58XG4gICAgbnVsbCB7XG4gIGxldCByZXNpZHVhbDogS2V5VmFsdWVBcnJheTxhbnk+fG51bGx8dW5kZWZpbmVkID0gdW5kZWZpbmVkO1xuICBjb25zdCBkaXJlY3RpdmVFbmQgPSB0Tm9kZS5kaXJlY3RpdmVFbmQ7XG4gIG5nRGV2TW9kZSAmJlxuICAgICAgYXNzZXJ0Tm90RXF1YWwoXG4gICAgICAgICAgdE5vZGUuZGlyZWN0aXZlU3R5bGluZ0xhc3QsIC0xLFxuICAgICAgICAgICdCeSB0aGUgdGltZSB0aGlzIGZ1bmN0aW9uIGdldHMgY2FsbGVkIGF0IGxlYXN0IG9uZSBob3N0QmluZGluZ3Mtbm9kZSBzdHlsaW5nIGluc3RydWN0aW9uIG11c3QgaGF2ZSBleGVjdXRlZC4nKTtcbiAgLy8gV2UgYWRkIGAxICsgdE5vZGUuZGlyZWN0aXZlU3RhcnRgIGJlY2F1c2Ugd2UgbmVlZCB0byBza2lwIHRoZSBjdXJyZW50IGRpcmVjdGl2ZSAoYXMgd2UgYXJlXG4gIC8vIGNvbGxlY3RpbmcgdGhpbmdzIGFmdGVyIHRoZSBsYXN0IGBob3N0QmluZGluZ3NgIGRpcmVjdGl2ZSB3aGljaCBoYWQgYSBzdHlsaW5nIGluc3RydWN0aW9uLilcbiAgZm9yIChsZXQgaSA9IDEgKyB0Tm9kZS5kaXJlY3RpdmVTdHlsaW5nTGFzdDsgaSA8IGRpcmVjdGl2ZUVuZDsgaSsrKSB7XG4gICAgY29uc3QgYXR0cnMgPSAodERhdGFbaV0gYXMgRGlyZWN0aXZlRGVmPGFueT4pLmhvc3RBdHRycztcbiAgICByZXNpZHVhbCA9IGNvbGxlY3RTdHlsaW5nRnJvbVRBdHRycyhyZXNpZHVhbCwgYXR0cnMsIGlzQ2xhc3NCYXNlZCkgYXMgS2V5VmFsdWVBcnJheTxhbnk+fCBudWxsO1xuICB9XG4gIHJldHVybiBjb2xsZWN0U3R5bGluZ0Zyb21UQXR0cnMocmVzaWR1YWwsIHROb2RlLmF0dHJzLCBpc0NsYXNzQmFzZWQpIGFzIEtleVZhbHVlQXJyYXk8YW55PnwgbnVsbDtcbn1cblxuLyoqXG4gKiBDb2xsZWN0IHRoZSBzdGF0aWMgc3R5bGluZyBpbmZvcm1hdGlvbiB3aXRoIGxvd2VyIHByaW9yaXR5IHRoYW4gYGhvc3REaXJlY3RpdmVEZWZgLlxuICpcbiAqIChUaGlzIGlzIG9wcG9zaXRlIG9mIHJlc2lkdWFsIHN0eWxpbmcuKVxuICpcbiAqIEBwYXJhbSBob3N0RGlyZWN0aXZlRGVmIGBEaXJlY3RpdmVEZWZgIGZvciB3aGljaCB3ZSB3YW50IHRvIGNvbGxlY3QgbG93ZXIgcHJpb3JpdHkgc3RhdGljXG4gKiAgICAgICAgc3R5bGluZy4gKE9yIGBudWxsYCBpZiB0ZW1wbGF0ZSBzdHlsaW5nKVxuICogQHBhcmFtIHREYXRhIGBURGF0YWAgd2hlcmUgdGhlIGxpbmtlZCBsaXN0IGlzIHN0b3JlZC5cbiAqIEBwYXJhbSB0Tm9kZSBgVE5vZGVgIGZvciB3aGljaCB0aGUgc3R5bGluZyBpcyBiZWluZyBjb21wdXRlZC5cbiAqIEBwYXJhbSBzdHlsaW5nS2V5IEV4aXN0aW5nIGBUU3R5bGluZ0tleWAgdG8gdXBkYXRlIG9yIHdyYXAuXG4gKiBAcGFyYW0gaXNDbGFzc0Jhc2VkIGB0cnVlYCBpZiBgY2xhc3NgIChgZmFsc2VgIGlmIGBzdHlsZWApXG4gKi9cbmZ1bmN0aW9uIGNvbGxlY3RTdHlsaW5nRnJvbURpcmVjdGl2ZXMoXG4gICAgaG9zdERpcmVjdGl2ZURlZjogRGlyZWN0aXZlRGVmPGFueT58IG51bGwsIHREYXRhOiBURGF0YSwgdE5vZGU6IFROb2RlLCBzdHlsaW5nS2V5OiBUU3R5bGluZ0tleSxcbiAgICBpc0NsYXNzQmFzZWQ6IGJvb2xlYW4pOiBUU3R5bGluZ0tleSB7XG4gIC8vIFdlIG5lZWQgdG8gbG9vcCBiZWNhdXNlIHRoZXJlIGNhbiBiZSBkaXJlY3RpdmVzIHdoaWNoIGhhdmUgYGhvc3RBdHRyc2AgYnV0IGRvbid0IGhhdmVcbiAgLy8gYGhvc3RCaW5kaW5nc2Agc28gdGhpcyBsb29wIGNhdGNoZXMgdXAgdG8gdGhlIGN1cnJlbnQgZGlyZWN0aXZlLi5cbiAgbGV0IGN1cnJlbnREaXJlY3RpdmU6IERpcmVjdGl2ZURlZjxhbnk+fG51bGwgPSBudWxsO1xuICBjb25zdCBkaXJlY3RpdmVFbmQgPSB0Tm9kZS5kaXJlY3RpdmVFbmQ7XG4gIGxldCBkaXJlY3RpdmVTdHlsaW5nTGFzdCA9IHROb2RlLmRpcmVjdGl2ZVN0eWxpbmdMYXN0O1xuICBpZiAoZGlyZWN0aXZlU3R5bGluZ0xhc3QgPT09IC0xKSB7XG4gICAgZGlyZWN0aXZlU3R5bGluZ0xhc3QgPSB0Tm9kZS5kaXJlY3RpdmVTdGFydDtcbiAgfSBlbHNlIHtcbiAgICBkaXJlY3RpdmVTdHlsaW5nTGFzdCsrO1xuICB9XG4gIHdoaWxlIChkaXJlY3RpdmVTdHlsaW5nTGFzdCA8IGRpcmVjdGl2ZUVuZCkge1xuICAgIGN1cnJlbnREaXJlY3RpdmUgPSB0RGF0YVtkaXJlY3RpdmVTdHlsaW5nTGFzdF0gYXMgRGlyZWN0aXZlRGVmPGFueT47XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQoY3VycmVudERpcmVjdGl2ZSwgJ2V4cGVjdGVkIHRvIGJlIGRlZmluZWQnKTtcbiAgICBzdHlsaW5nS2V5ID0gY29sbGVjdFN0eWxpbmdGcm9tVEF0dHJzKHN0eWxpbmdLZXksIGN1cnJlbnREaXJlY3RpdmUuaG9zdEF0dHJzLCBpc0NsYXNzQmFzZWQpO1xuICAgIGlmIChjdXJyZW50RGlyZWN0aXZlID09PSBob3N0RGlyZWN0aXZlRGVmKSBicmVhaztcbiAgICBkaXJlY3RpdmVTdHlsaW5nTGFzdCsrO1xuICB9XG4gIGlmIChob3N0RGlyZWN0aXZlRGVmICE9PSBudWxsKSB7XG4gICAgLy8gd2Ugb25seSBhZHZhbmNlIHRoZSBzdHlsaW5nIGN1cnNvciBpZiB3ZSBhcmUgY29sbGVjdGluZyBkYXRhIGZyb20gaG9zdCBiaW5kaW5ncy5cbiAgICAvLyBUZW1wbGF0ZSBleGVjdXRlcyBiZWZvcmUgaG9zdCBiaW5kaW5ncyBhbmQgc28gaWYgd2Ugd291bGQgdXBkYXRlIHRoZSBpbmRleCxcbiAgICAvLyBob3N0IGJpbmRpbmdzIHdvdWxkIG5vdCBnZXQgdGhlaXIgc3RhdGljcy5cbiAgICB0Tm9kZS5kaXJlY3RpdmVTdHlsaW5nTGFzdCA9IGRpcmVjdGl2ZVN0eWxpbmdMYXN0O1xuICB9XG4gIHJldHVybiBzdHlsaW5nS2V5O1xufVxuXG4vKipcbiAqIENvbnZlcnQgYFRBdHRyc2AgaW50byBgVFN0eWxpbmdTdGF0aWNgLlxuICpcbiAqIEBwYXJhbSBzdHlsaW5nS2V5IGV4aXN0aW5nIGBUU3R5bGluZ0tleWAgdG8gdXBkYXRlIG9yIHdyYXAuXG4gKiBAcGFyYW0gYXR0cnMgYFRBdHRyaWJ1dGVzYCB0byBwcm9jZXNzLlxuICogQHBhcmFtIGlzQ2xhc3NCYXNlZCBgdHJ1ZWAgaWYgYGNsYXNzYCAoYGZhbHNlYCBpZiBgc3R5bGVgKVxuICovXG5mdW5jdGlvbiBjb2xsZWN0U3R5bGluZ0Zyb21UQXR0cnMoXG4gICAgc3R5bGluZ0tleTogVFN0eWxpbmdLZXkgfCB1bmRlZmluZWQsIGF0dHJzOiBUQXR0cmlidXRlcyB8IG51bGwsXG4gICAgaXNDbGFzc0Jhc2VkOiBib29sZWFuKTogVFN0eWxpbmdLZXkge1xuICBjb25zdCBkZXNpcmVkTWFya2VyID0gaXNDbGFzc0Jhc2VkID8gQXR0cmlidXRlTWFya2VyLkNsYXNzZXMgOiBBdHRyaWJ1dGVNYXJrZXIuU3R5bGVzO1xuICBsZXQgY3VycmVudE1hcmtlciA9IEF0dHJpYnV0ZU1hcmtlci5JbXBsaWNpdEF0dHJpYnV0ZXM7XG4gIGlmIChhdHRycyAhPT0gbnVsbCkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYXR0cnMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGl0ZW0gPSBhdHRyc1tpXSBhcyBudW1iZXIgfCBzdHJpbmc7XG4gICAgICBpZiAodHlwZW9mIGl0ZW0gPT09ICdudW1iZXInKSB7XG4gICAgICAgIGN1cnJlbnRNYXJrZXIgPSBpdGVtO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKGN1cnJlbnRNYXJrZXIgPT09IGRlc2lyZWRNYXJrZXIpIHtcbiAgICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkoc3R5bGluZ0tleSkpIHtcbiAgICAgICAgICAgIHN0eWxpbmdLZXkgPSBzdHlsaW5nS2V5ID09PSB1bmRlZmluZWQgPyBbXSA6IFsnJywgc3R5bGluZ0tleV0gYXMgYW55O1xuICAgICAgICAgIH1cbiAgICAgICAgICBrZXlWYWx1ZUFycmF5U2V0KFxuICAgICAgICAgICAgICBzdHlsaW5nS2V5IGFzIEtleVZhbHVlQXJyYXk8YW55PiwgaXRlbSwgaXNDbGFzc0Jhc2VkID8gdHJ1ZSA6IGF0dHJzWysraV0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBzdHlsaW5nS2V5ID09PSB1bmRlZmluZWQgPyBudWxsIDogc3R5bGluZ0tleTtcbn1cblxuLyoqXG4gKiBSZXRyaWV2ZSB0aGUgY3VycmVudCBgRGlyZWN0aXZlRGVmYCB3aGljaCBpcyBhY3RpdmUgd2hlbiBgaG9zdEJpbmRpbmdzYCBzdHlsZSBpbnN0cnVjdGlvbiBpc1xuICogYmVpbmcgZXhlY3V0ZWQgKG9yIGBudWxsYCBpZiB3ZSBhcmUgaW4gYHRlbXBsYXRlYC4pXG4gKlxuICogQHBhcmFtIHREYXRhIEN1cnJlbnQgYFREYXRhYCB3aGVyZSB0aGUgYERpcmVjdGl2ZURlZmAgd2lsbCBiZSBsb29rZWQgdXAgYXQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRIb3N0RGlyZWN0aXZlRGVmKHREYXRhOiBURGF0YSk6IERpcmVjdGl2ZURlZjxhbnk+fG51bGwge1xuICBjb25zdCBjdXJyZW50RGlyZWN0aXZlSW5kZXggPSBnZXRDdXJyZW50RGlyZWN0aXZlSW5kZXgoKTtcbiAgcmV0dXJuIGN1cnJlbnREaXJlY3RpdmVJbmRleCA9PT0gLTEgPyBudWxsIDogdERhdGFbY3VycmVudERpcmVjdGl2ZUluZGV4XSBhcyBEaXJlY3RpdmVEZWY8YW55Pjtcbn1cblxuLyoqXG4gKiBDb252ZXJ0IHVzZXIgaW5wdXQgdG8gYEtleVZhbHVlQXJyYXlgLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gdGFrZXMgdXNlciBpbnB1dCB3aGljaCBjb3VsZCBiZSBgc3RyaW5nYCwgT2JqZWN0IGxpdGVyYWwsIG9yIGl0ZXJhYmxlIGFuZCBjb252ZXJ0c1xuICogaXQgaW50byBhIGNvbnNpc3RlbnQgcmVwcmVzZW50YXRpb24uIFRoZSBvdXRwdXQgb2YgdGhpcyBpcyBgS2V5VmFsdWVBcnJheWAgKHdoaWNoIGlzIGFuIGFycmF5XG4gKiB3aGVyZVxuICogZXZlbiBpbmRleGVzIGNvbnRhaW4ga2V5cyBhbmQgb2RkIGluZGV4ZXMgY29udGFpbiB2YWx1ZXMgZm9yIHRob3NlIGtleXMpLlxuICpcbiAqIFRoZSBhZHZhbnRhZ2Ugb2YgY29udmVydGluZyB0byBgS2V5VmFsdWVBcnJheWAgaXMgdGhhdCB3ZSBjYW4gcGVyZm9ybSBkaWZmIGluIGFuIGlucHV0XG4gKiBpbmRlcGVuZGVudFxuICogd2F5LlxuICogKGllIHdlIGNhbiBjb21wYXJlIGBmb28gYmFyYCB0byBgWydiYXInLCAnYmF6J10gYW5kIGRldGVybWluZSBhIHNldCBvZiBjaGFuZ2VzIHdoaWNoIG5lZWQgdG8gYmVcbiAqIGFwcGxpZWQpXG4gKlxuICogVGhlIGZhY3QgdGhhdCBgS2V5VmFsdWVBcnJheWAgaXMgc29ydGVkIGlzIHZlcnkgaW1wb3J0YW50IGJlY2F1c2UgaXQgYWxsb3dzIHVzIHRvIGNvbXB1dGUgdGhlXG4gKiBkaWZmZXJlbmNlIGluIGxpbmVhciBmYXNoaW9uIHdpdGhvdXQgdGhlIG5lZWQgdG8gYWxsb2NhdGUgYW55IGFkZGl0aW9uYWwgZGF0YS5cbiAqXG4gKiBGb3IgZXhhbXBsZSBpZiB3ZSBrZXB0IHRoaXMgYXMgYSBgTWFwYCB3ZSB3b3VsZCBoYXZlIHRvIGl0ZXJhdGUgb3ZlciBwcmV2aW91cyBgTWFwYCB0byBkZXRlcm1pbmVcbiAqIHdoaWNoIHZhbHVlcyBuZWVkIHRvIGJlIGRlbGV0ZWQsIG92ZXIgdGhlIG5ldyBgTWFwYCB0byBkZXRlcm1pbmUgYWRkaXRpb25zLCBhbmQgd2Ugd291bGQgaGF2ZSB0b1xuICoga2VlcCBhZGRpdGlvbmFsIGBNYXBgIHRvIGtlZXAgdHJhY2sgb2YgZHVwbGljYXRlcyBvciBpdGVtcyB3aGljaCBoYXZlIG5vdCB5ZXQgYmVlbiB2aXNpdGVkLlxuICpcbiAqIEBwYXJhbSBrZXlWYWx1ZUFycmF5U2V0IChTZWUgYGtleVZhbHVlQXJyYXlTZXRgIGluIFwidXRpbC9hcnJheV91dGlsc1wiKSBHZXRzIHBhc3NlZCBpbiBhcyBhXG4gKiBmdW5jdGlvbiBzbyB0aGF0XG4gKiAgICAgICAgYHN0eWxlYCBjYW4gcGFzcyBpbiB2ZXJzaW9uIHdoaWNoIGRvZXMgc2FuaXRpemF0aW9uLiBUaGlzIGlzIGRvbmUgZm9yIHRyZWUgc2hha2luZ1xuICogICAgICAgIHB1cnBvc2VzLlxuICogQHBhcmFtIHN0cmluZ1BhcnNlciBUaGUgcGFyc2VyIGlzIHBhc3NlZCBpbiBzbyB0aGF0IGl0IHdpbGwgYmUgdHJlZSBzaGFrYWJsZS4gU2VlXG4gKiAgICAgICAgYHN0eWxlU3RyaW5nUGFyc2VyYCBhbmQgYGNsYXNzU3RyaW5nUGFyc2VyYFxuICogQHBhcmFtIHZhbHVlIFRoZSB2YWx1ZSB0byBwYXJzZS9jb252ZXJ0IHRvIGBLZXlWYWx1ZUFycmF5YFxuICovXG5leHBvcnQgZnVuY3Rpb24gdG9TdHlsaW5nS2V5VmFsdWVBcnJheShcbiAgICBrZXlWYWx1ZUFycmF5U2V0OiAoa2V5VmFsdWVBcnJheTogS2V5VmFsdWVBcnJheTxhbnk+LCBrZXk6IHN0cmluZywgdmFsdWU6IGFueSkgPT4gdm9pZCxcbiAgICBzdHJpbmdQYXJzZXI6IChzdHlsZUtleVZhbHVlQXJyYXk6IEtleVZhbHVlQXJyYXk8YW55PiwgdGV4dDogc3RyaW5nKSA9PiB2b2lkLFxuICAgIHZhbHVlOiBzdHJpbmd8c3RyaW5nW118e1trZXk6IHN0cmluZ106IGFueX18bnVsbHx1bmRlZmluZWQpOiBLZXlWYWx1ZUFycmF5PGFueT4ge1xuICBpZiAodmFsdWUgPT0gbnVsbCAvKnx8IHZhbHVlID09PSB1bmRlZmluZWQgKi8gfHwgdmFsdWUgPT09ICcnKSByZXR1cm4gRU1QVFlfQVJSQVkgYXMgYW55O1xuICBjb25zdCBzdHlsZUtleVZhbHVlQXJyYXk6IEtleVZhbHVlQXJyYXk8YW55PiA9IFtdIGFzIGFueTtcbiAgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB2YWx1ZS5sZW5ndGg7IGkrKykge1xuICAgICAga2V5VmFsdWVBcnJheVNldChzdHlsZUtleVZhbHVlQXJyYXksIHZhbHVlW2ldLCB0cnVlKTtcbiAgICB9XG4gIH0gZWxzZSBpZiAodHlwZW9mIHZhbHVlID09PSAnb2JqZWN0Jykge1xuICAgIGZvciAoY29uc3Qga2V5IGluIHZhbHVlKSB7XG4gICAgICBpZiAodmFsdWUuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICBrZXlWYWx1ZUFycmF5U2V0KHN0eWxlS2V5VmFsdWVBcnJheSwga2V5LCB2YWx1ZVtrZXldKTtcbiAgICAgIH1cbiAgICB9XG4gIH0gZWxzZSBpZiAodHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJykge1xuICAgIHN0cmluZ1BhcnNlcihzdHlsZUtleVZhbHVlQXJyYXksIHZhbHVlKTtcbiAgfSBlbHNlIHtcbiAgICBuZ0Rldk1vZGUgJiYgdGhyb3dFcnJvcignVW5zdXBwb3J0ZWQgc3R5bGluZyB0eXBlICcgKyB0eXBlb2YgdmFsdWUgKyAnOiAnICsgdmFsdWUpO1xuICB9XG4gIHJldHVybiBzdHlsZUtleVZhbHVlQXJyYXk7XG59XG5cbi8qKlxuICogU2V0IGEgYHZhbHVlYCBmb3IgYSBga2V5YCB0YWtpbmcgc3R5bGUgc2FuaXRpemF0aW9uIGludG8gYWNjb3VudC5cbiAqXG4gKiBTZWU6IGBrZXlWYWx1ZUFycmF5U2V0YCBmb3IgZGV0YWlsc1xuICpcbiAqIEBwYXJhbSBrZXlWYWx1ZUFycmF5IEtleVZhbHVlQXJyYXkgdG8gYWRkIHRvLlxuICogQHBhcmFtIGtleSBTdHlsZSBrZXkgdG8gYWRkLiAoVGhpcyBrZXkgd2lsbCBiZSBjaGVja2VkIGlmIGl0IG5lZWRzIHNhbml0aXphdGlvbilcbiAqIEBwYXJhbSB2YWx1ZSBUaGUgdmFsdWUgdG8gc2V0IChJZiBrZXkgbmVlZHMgc2FuaXRpemF0aW9uIGl0IHdpbGwgYmUgc2FuaXRpemVkKVxuICovXG5mdW5jdGlvbiBzdHlsZUtleVZhbHVlQXJyYXlTZXQoa2V5VmFsdWVBcnJheTogS2V5VmFsdWVBcnJheTxhbnk+LCBrZXk6IHN0cmluZywgdmFsdWU6IGFueSkge1xuICBpZiAoc3R5bGVQcm9wTmVlZHNTYW5pdGl6YXRpb24oa2V5KSkge1xuICAgIHZhbHVlID0gybXJtXNhbml0aXplU3R5bGUodmFsdWUpO1xuICB9XG4gIGtleVZhbHVlQXJyYXlTZXQoa2V5VmFsdWVBcnJheSwga2V5LCB2YWx1ZSk7XG59XG5cbi8qKlxuICogVXBkYXRlIG1hcCBiYXNlZCBzdHlsaW5nLlxuICpcbiAqIE1hcCBiYXNlZCBzdHlsaW5nIGNvdWxkIGJlIGFueXRoaW5nIHdoaWNoIGNvbnRhaW5zIG1vcmUgdGhhbiBvbmUgYmluZGluZy4gRm9yIGV4YW1wbGUgYHN0cmluZ2AsXG4gKiBvciBvYmplY3QgbGl0ZXJhbC4gRGVhbGluZyB3aXRoIGFsbCBvZiB0aGVzZSB0eXBlcyB3b3VsZCBjb21wbGljYXRlIHRoZSBsb2dpYyBzb1xuICogaW5zdGVhZCB0aGlzIGZ1bmN0aW9uIGV4cGVjdHMgdGhhdCB0aGUgY29tcGxleCBpbnB1dCBpcyBmaXJzdCBjb252ZXJ0ZWQgaW50byBub3JtYWxpemVkXG4gKiBgS2V5VmFsdWVBcnJheWAuIFRoZSBhZHZhbnRhZ2Ugb2Ygbm9ybWFsaXphdGlvbiBpcyB0aGF0IHdlIGdldCB0aGUgdmFsdWVzIHNvcnRlZCwgd2hpY2ggbWFrZXMgaXRcbiAqIHZlcnkgY2hlYXAgdG8gY29tcHV0ZSBkZWx0YXMgYmV0d2VlbiB0aGUgcHJldmlvdXMgYW5kIGN1cnJlbnQgdmFsdWUuXG4gKlxuICogQHBhcmFtIHRWaWV3IEFzc29jaWF0ZWQgYFRWaWV3LmRhdGFgIGNvbnRhaW5zIHRoZSBsaW5rZWQgbGlzdCBvZiBiaW5kaW5nIHByaW9yaXRpZXMuXG4gKiBAcGFyYW0gdE5vZGUgYFROb2RlYCB3aGVyZSB0aGUgYmluZGluZyBpcyBsb2NhdGVkLlxuICogQHBhcmFtIGxWaWV3IGBMVmlld2AgY29udGFpbnMgdGhlIHZhbHVlcyBhc3NvY2lhdGVkIHdpdGggb3RoZXIgc3R5bGluZyBiaW5kaW5nIGF0IHRoaXMgYFROb2RlYC5cbiAqIEBwYXJhbSByZW5kZXJlciBSZW5kZXJlciB0byB1c2UgaWYgYW55IHVwZGF0ZXMuXG4gKiBAcGFyYW0gb2xkS2V5VmFsdWVBcnJheSBQcmV2aW91cyB2YWx1ZSByZXByZXNlbnRlZCBhcyBgS2V5VmFsdWVBcnJheWBcbiAqIEBwYXJhbSBuZXdLZXlWYWx1ZUFycmF5IEN1cnJlbnQgdmFsdWUgcmVwcmVzZW50ZWQgYXMgYEtleVZhbHVlQXJyYXlgXG4gKiBAcGFyYW0gaXNDbGFzc0Jhc2VkIGB0cnVlYCBpZiBgY2xhc3NgIChgZmFsc2VgIGlmIGBzdHlsZWApXG4gKiBAcGFyYW0gYmluZGluZ0luZGV4IEJpbmRpbmcgaW5kZXggb2YgdGhlIGJpbmRpbmcuXG4gKi9cbmZ1bmN0aW9uIHVwZGF0ZVN0eWxpbmdNYXAoXG4gICAgdFZpZXc6IFRWaWV3LCB0Tm9kZTogVE5vZGUsIGxWaWV3OiBMVmlldywgcmVuZGVyZXI6IFJlbmRlcmVyMyxcbiAgICBvbGRLZXlWYWx1ZUFycmF5OiBLZXlWYWx1ZUFycmF5PGFueT4sIG5ld0tleVZhbHVlQXJyYXk6IEtleVZhbHVlQXJyYXk8YW55PixcbiAgICBpc0NsYXNzQmFzZWQ6IGJvb2xlYW4sIGJpbmRpbmdJbmRleDogbnVtYmVyKSB7XG4gIGlmIChvbGRLZXlWYWx1ZUFycmF5IGFzIEtleVZhbHVlQXJyYXk8YW55PnwgTk9fQ0hBTkdFID09PSBOT19DSEFOR0UpIHtcbiAgICAvLyBPbiBmaXJzdCBleGVjdXRpb24gdGhlIG9sZEtleVZhbHVlQXJyYXkgaXMgTk9fQ0hBTkdFID0+IHRyZWF0IGl0IGFzIGVtcHR5IEtleVZhbHVlQXJyYXkuXG4gICAgb2xkS2V5VmFsdWVBcnJheSA9IEVNUFRZX0FSUkFZIGFzIGFueTtcbiAgfVxuICBsZXQgb2xkSW5kZXggPSAwO1xuICBsZXQgbmV3SW5kZXggPSAwO1xuICBsZXQgb2xkS2V5OiBzdHJpbmd8bnVsbCA9IDAgPCBvbGRLZXlWYWx1ZUFycmF5Lmxlbmd0aCA/IG9sZEtleVZhbHVlQXJyYXlbMF0gOiBudWxsO1xuICBsZXQgbmV3S2V5OiBzdHJpbmd8bnVsbCA9IDAgPCBuZXdLZXlWYWx1ZUFycmF5Lmxlbmd0aCA/IG5ld0tleVZhbHVlQXJyYXlbMF0gOiBudWxsO1xuICB3aGlsZSAob2xkS2V5ICE9PSBudWxsIHx8IG5ld0tleSAhPT0gbnVsbCkge1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnRMZXNzVGhhbihvbGRJbmRleCwgOTk5LCAnQXJlIHdlIHN0dWNrIGluIGluZmluaXRlIGxvb3A/Jyk7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydExlc3NUaGFuKG5ld0luZGV4LCA5OTksICdBcmUgd2Ugc3R1Y2sgaW4gaW5maW5pdGUgbG9vcD8nKTtcbiAgICBjb25zdCBvbGRWYWx1ZSA9XG4gICAgICAgIG9sZEluZGV4IDwgb2xkS2V5VmFsdWVBcnJheS5sZW5ndGggPyBvbGRLZXlWYWx1ZUFycmF5W29sZEluZGV4ICsgMV0gOiB1bmRlZmluZWQ7XG4gICAgY29uc3QgbmV3VmFsdWUgPVxuICAgICAgICBuZXdJbmRleCA8IG5ld0tleVZhbHVlQXJyYXkubGVuZ3RoID8gbmV3S2V5VmFsdWVBcnJheVtuZXdJbmRleCArIDFdIDogdW5kZWZpbmVkO1xuICAgIGxldCBzZXRLZXk6IHN0cmluZ3xudWxsID0gbnVsbDtcbiAgICBsZXQgc2V0VmFsdWU6IGFueSA9IHVuZGVmaW5lZDtcbiAgICBpZiAob2xkS2V5ID09PSBuZXdLZXkpIHtcbiAgICAgIC8vIFVQREFURTogS2V5cyBhcmUgZXF1YWwgPT4gbmV3IHZhbHVlIGlzIG92ZXJ3cml0aW5nIG9sZCB2YWx1ZS5cbiAgICAgIG9sZEluZGV4ICs9IDI7XG4gICAgICBuZXdJbmRleCArPSAyO1xuICAgICAgaWYgKG9sZFZhbHVlICE9PSBuZXdWYWx1ZSkge1xuICAgICAgICBzZXRLZXkgPSBuZXdLZXk7XG4gICAgICAgIHNldFZhbHVlID0gbmV3VmFsdWU7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChuZXdLZXkgPT09IG51bGwgfHwgb2xkS2V5ICE9PSBudWxsICYmIG9sZEtleSA8IG5ld0tleSAhKSB7XG4gICAgICAvLyBERUxFVEU6IG9sZEtleSBrZXkgaXMgbWlzc2luZyBvciB3ZSBkaWQgbm90IGZpbmQgdGhlIG9sZEtleSBpbiB0aGUgbmV3VmFsdWVcbiAgICAgIC8vIChiZWNhdXNlIHRoZSBrZXlWYWx1ZUFycmF5IGlzIHNvcnRlZCBhbmQgYG5ld0tleWAgaXMgZm91bmQgbGF0ZXIgYWxwaGFiZXRpY2FsbHkpLlxuICAgICAgLy8gYFwiYmFja2dyb3VuZFwiIDwgXCJjb2xvclwiYCBzbyB3ZSBuZWVkIHRvIGRlbGV0ZSBgXCJiYWNrZ3JvdW5kXCJgIGJlY2F1c2UgaXQgaXMgbm90IGZvdW5kIGluIHRoZVxuICAgICAgLy8gbmV3IGFycmF5LlxuICAgICAgb2xkSW5kZXggKz0gMjtcbiAgICAgIHNldEtleSA9IG9sZEtleTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gQ1JFQVRFOiBuZXdLZXkncyBpcyBlYXJsaWVyIGFscGhhYmV0aWNhbGx5IHRoYW4gb2xkS2V5J3MgKG9yIG5vIG9sZEtleSkgPT4gd2UgaGF2ZSBuZXcga2V5LlxuICAgICAgLy8gYFwiY29sb3JcIiA+IFwiYmFja2dyb3VuZFwiYCBzbyB3ZSBuZWVkIHRvIGFkZCBgY29sb3JgIGJlY2F1c2UgaXQgaXMgaW4gbmV3IGFycmF5IGJ1dCBub3QgaW5cbiAgICAgIC8vIG9sZCBhcnJheS5cbiAgICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKG5ld0tleSwgJ0V4cGVjdGluZyB0byBoYXZlIGEgdmFsaWQga2V5Jyk7XG4gICAgICBuZXdJbmRleCArPSAyO1xuICAgICAgc2V0S2V5ID0gbmV3S2V5O1xuICAgICAgc2V0VmFsdWUgPSBuZXdWYWx1ZTtcbiAgICB9XG4gICAgaWYgKHNldEtleSAhPT0gbnVsbCkge1xuICAgICAgdXBkYXRlU3R5bGluZyh0VmlldywgdE5vZGUsIGxWaWV3LCByZW5kZXJlciwgc2V0S2V5LCBzZXRWYWx1ZSwgaXNDbGFzc0Jhc2VkLCBiaW5kaW5nSW5kZXgpO1xuICAgIH1cbiAgICBvbGRLZXkgPSBvbGRJbmRleCA8IG9sZEtleVZhbHVlQXJyYXkubGVuZ3RoID8gb2xkS2V5VmFsdWVBcnJheVtvbGRJbmRleF0gOiBudWxsO1xuICAgIG5ld0tleSA9IG5ld0luZGV4IDwgbmV3S2V5VmFsdWVBcnJheS5sZW5ndGggPyBuZXdLZXlWYWx1ZUFycmF5W25ld0luZGV4XSA6IG51bGw7XG4gIH1cbn1cblxuLyoqXG4gKiBVcGRhdGUgYSBzaW1wbGUgKHByb3BlcnR5IG5hbWUpIHN0eWxpbmcuXG4gKlxuICogVGhpcyBmdW5jdGlvbiB0YWtlcyBgcHJvcGAgYW5kIHVwZGF0ZXMgdGhlIERPTSB0byB0aGF0IHZhbHVlLiBUaGUgZnVuY3Rpb24gdGFrZXMgdGhlIGJpbmRpbmdcbiAqIHZhbHVlIGFzIHdlbGwgYXMgYmluZGluZyBwcmlvcml0eSBpbnRvIGNvbnNpZGVyYXRpb24gdG8gZGV0ZXJtaW5lIHdoaWNoIHZhbHVlIHNob3VsZCBiZSB3cml0dGVuXG4gKiB0byBET00uIChGb3IgZXhhbXBsZSBpdCBtYXkgYmUgZGV0ZXJtaW5lZCB0aGF0IHRoZXJlIGlzIGEgaGlnaGVyIHByaW9yaXR5IG92ZXJ3cml0ZSB3aGljaCBibG9ja3NcbiAqIHRoZSBET00gd3JpdGUsIG9yIGlmIHRoZSB2YWx1ZSBnb2VzIHRvIGB1bmRlZmluZWRgIGEgbG93ZXIgcHJpb3JpdHkgb3ZlcndyaXRlIG1heSBiZSBjb25zdWx0ZWQuKVxuICpcbiAqIEBwYXJhbSB0VmlldyBBc3NvY2lhdGVkIGBUVmlldy5kYXRhYCBjb250YWlucyB0aGUgbGlua2VkIGxpc3Qgb2YgYmluZGluZyBwcmlvcml0aWVzLlxuICogQHBhcmFtIHROb2RlIGBUTm9kZWAgd2hlcmUgdGhlIGJpbmRpbmcgaXMgbG9jYXRlZC5cbiAqIEBwYXJhbSBsVmlldyBgTFZpZXdgIGNvbnRhaW5zIHRoZSB2YWx1ZXMgYXNzb2NpYXRlZCB3aXRoIG90aGVyIHN0eWxpbmcgYmluZGluZyBhdCB0aGlzIGBUTm9kZWAuXG4gKiBAcGFyYW0gcmVuZGVyZXIgUmVuZGVyZXIgdG8gdXNlIGlmIGFueSB1cGRhdGVzLlxuICogQHBhcmFtIHByb3AgRWl0aGVyIHN0eWxlIHByb3BlcnR5IG5hbWUgb3IgYSBjbGFzcyBuYW1lLlxuICogQHBhcmFtIHZhbHVlIEVpdGhlciBzdHlsZSB2YWx1ZSBmb3IgYHByb3BgIG9yIGB0cnVlYC9gZmFsc2VgIGlmIGBwcm9wYCBpcyBjbGFzcy5cbiAqIEBwYXJhbSBpc0NsYXNzQmFzZWQgYHRydWVgIGlmIGBjbGFzc2AgKGBmYWxzZWAgaWYgYHN0eWxlYClcbiAqIEBwYXJhbSBiaW5kaW5nSW5kZXggQmluZGluZyBpbmRleCBvZiB0aGUgYmluZGluZy5cbiAqL1xuZnVuY3Rpb24gdXBkYXRlU3R5bGluZyhcbiAgICB0VmlldzogVFZpZXcsIHROb2RlOiBUTm9kZSwgbFZpZXc6IExWaWV3LCByZW5kZXJlcjogUmVuZGVyZXIzLCBwcm9wOiBzdHJpbmcsXG4gICAgdmFsdWU6IHN0cmluZyB8IHVuZGVmaW5lZCB8IG51bGwgfCBib29sZWFuLCBpc0NsYXNzQmFzZWQ6IGJvb2xlYW4sIGJpbmRpbmdJbmRleDogbnVtYmVyKSB7XG4gIGlmICh0Tm9kZS50eXBlICE9PSBUTm9kZVR5cGUuRWxlbWVudCkge1xuICAgIC8vIEl0IGlzIHBvc3NpYmxlIHRvIGhhdmUgc3R5bGluZyBvbiBub24tZWxlbWVudHMgKHN1Y2ggYXMgbmctY29udGFpbmVyKS5cbiAgICAvLyBUaGlzIGlzIHJhcmUsIGJ1dCBpdCBkb2VzIGhhcHBlbi4gSW4gc3VjaCBhIGNhc2UsIGp1c3QgaWdub3JlIHRoZSBiaW5kaW5nLlxuICAgIHJldHVybjtcbiAgfVxuICBjb25zdCB0RGF0YSA9IHRWaWV3LmRhdGE7XG4gIGNvbnN0IHRSYW5nZSA9IHREYXRhW2JpbmRpbmdJbmRleCArIDFdIGFzIFRTdHlsaW5nUmFuZ2U7XG4gIGNvbnN0IGhpZ2hlclByaW9yaXR5VmFsdWUgPSBnZXRUU3R5bGluZ1JhbmdlTmV4dER1cGxpY2F0ZSh0UmFuZ2UpID9cbiAgICAgIGZpbmRTdHlsaW5nVmFsdWUodERhdGEsIHROb2RlLCBsVmlldywgcHJvcCwgZ2V0VFN0eWxpbmdSYW5nZU5leHQodFJhbmdlKSwgaXNDbGFzc0Jhc2VkKSA6XG4gICAgICB1bmRlZmluZWQ7XG4gIGlmICghaXNTdHlsaW5nVmFsdWVQcmVzZW50KGhpZ2hlclByaW9yaXR5VmFsdWUpKSB7XG4gICAgLy8gV2UgZG9uJ3QgaGF2ZSBhIG5leHQgZHVwbGljYXRlLCBvciB3ZSBkaWQgbm90IGZpbmQgYSBkdXBsaWNhdGUgdmFsdWUuXG4gICAgaWYgKCFpc1N0eWxpbmdWYWx1ZVByZXNlbnQodmFsdWUpKSB7XG4gICAgICAvLyBXZSBzaG91bGQgZGVsZXRlIGN1cnJlbnQgdmFsdWUgb3IgcmVzdG9yZSB0byBsb3dlciBwcmlvcml0eSB2YWx1ZS5cbiAgICAgIGlmIChnZXRUU3R5bGluZ1JhbmdlUHJldkR1cGxpY2F0ZSh0UmFuZ2UpKSB7XG4gICAgICAgIC8vIFdlIGhhdmUgYSBwb3NzaWJsZSBwcmV2IGR1cGxpY2F0ZSwgbGV0J3MgcmV0cmlldmUgaXQuXG4gICAgICAgIHZhbHVlID0gZmluZFN0eWxpbmdWYWx1ZSh0RGF0YSwgbnVsbCwgbFZpZXcsIHByb3AsIGJpbmRpbmdJbmRleCwgaXNDbGFzc0Jhc2VkKTtcbiAgICAgIH1cbiAgICB9XG4gICAgY29uc3Qgck5vZGUgPSBnZXROYXRpdmVCeUluZGV4KGdldFNlbGVjdGVkSW5kZXgoKSwgbFZpZXcpIGFzIFJFbGVtZW50O1xuICAgIGFwcGx5U3R5bGluZyhyZW5kZXJlciwgaXNDbGFzc0Jhc2VkLCByTm9kZSwgcHJvcCwgdmFsdWUpO1xuICB9XG59XG5cbi8qKlxuICogU2VhcmNoIGZvciBzdHlsaW5nIHZhbHVlIHdpdGggaGlnaGVyIHByaW9yaXR5IHdoaWNoIGlzIG92ZXJ3cml0aW5nIGN1cnJlbnQgdmFsdWUsIG9yIGFcbiAqIHZhbHVlIG9mIGxvd2VyIHByaW9yaXR5IHRvIHdoaWNoIHdlIHNob3VsZCBmYWxsIGJhY2sgaWYgdGhlIHZhbHVlIGlzIGB1bmRlZmluZWRgLlxuICpcbiAqIFdoZW4gdmFsdWUgaXMgYmVpbmcgYXBwbGllZCBhdCBhIGxvY2F0aW9uLCByZWxhdGVkIHZhbHVlcyBuZWVkIHRvIGJlIGNvbnN1bHRlZC5cbiAqIC0gSWYgdGhlcmUgaXMgYSBoaWdoZXIgcHJpb3JpdHkgYmluZGluZywgd2Ugc2hvdWxkIGJlIHVzaW5nIHRoYXQgb25lIGluc3RlYWQuXG4gKiAgIEZvciBleGFtcGxlIGA8ZGl2ICBbc3R5bGVdPVwie2NvbG9yOmV4cDF9XCIgW3N0eWxlLmNvbG9yXT1cImV4cDJcIj5gIGNoYW5nZSB0byBgZXhwMWBcbiAqICAgcmVxdWlyZXMgdGhhdCB3ZSBjaGVjayBgZXhwMmAgdG8gc2VlIGlmIGl0IGlzIHNldCB0byB2YWx1ZSBvdGhlciB0aGFuIGB1bmRlZmluZWRgLlxuICogLSBJZiB0aGVyZSBpcyBhIGxvd2VyIHByaW9yaXR5IGJpbmRpbmcgYW5kIHdlIGFyZSBjaGFuZ2luZyB0byBgdW5kZWZpbmVkYFxuICogICBGb3IgZXhhbXBsZSBgPGRpdiAgW3N0eWxlXT1cIntjb2xvcjpleHAxfVwiIFtzdHlsZS5jb2xvcl09XCJleHAyXCI+YCBjaGFuZ2UgdG8gYGV4cDJgIHRvXG4gKiAgIGB1bmRlZmluZWRgIHJlcXVpcmVzIHRoYXQgd2UgY2hlY2sgYGV4cDFgIChhbmQgc3RhdGljIHZhbHVlcykgYW5kIHVzZSB0aGF0IGFzIG5ldyB2YWx1ZS5cbiAqXG4gKiBOT1RFOiBUaGUgc3R5bGluZyBzdG9yZXMgdHdvIHZhbHVlcy5cbiAqIDEuIFRoZSByYXcgdmFsdWUgd2hpY2ggY2FtZSBmcm9tIHRoZSBhcHBsaWNhdGlvbiBpcyBzdG9yZWQgYXQgYGluZGV4ICsgMGAgbG9jYXRpb24uIChUaGlzIHZhbHVlXG4gKiAgICBpcyB1c2VkIGZvciBkaXJ0eSBjaGVja2luZykuXG4gKiAyLiBUaGUgbm9ybWFsaXplZCB2YWx1ZSAoY29udmVydGVkIHRvIGBLZXlWYWx1ZUFycmF5YCBpZiBtYXAgYW5kIHNhbml0aXplZCkgaXMgc3RvcmVkIGF0IGBpbmRleCArXG4gKiAxYC5cbiAqICAgIFRoZSBhZHZhbnRhZ2Ugb2Ygc3RvcmluZyB0aGUgc2FuaXRpemVkIHZhbHVlIGlzIHRoYXQgb25jZSB0aGUgdmFsdWUgaXMgd3JpdHRlbiB3ZSBkb24ndCBuZWVkXG4gKiAgICB0byB3b3JyeSBhYm91dCBzYW5pdGl6aW5nIGl0IGxhdGVyIG9yIGtlZXBpbmcgdHJhY2sgb2YgdGhlIHNhbml0aXplci5cbiAqXG4gKiBAcGFyYW0gdERhdGEgYFREYXRhYCB1c2VkIGZvciB0cmF2ZXJzaW5nIHRoZSBwcmlvcml0eS5cbiAqIEBwYXJhbSB0Tm9kZSBgVE5vZGVgIHRvIHVzZSBmb3IgcmVzb2x2aW5nIHN0YXRpYyBzdHlsaW5nLiBBbHNvIGNvbnRyb2xzIHNlYXJjaCBkaXJlY3Rpb24uXG4gKiAgIC0gYFROb2RlYCBzZWFyY2ggbmV4dCBhbmQgcXVpdCBhcyBzb29uIGFzIGBpc1N0eWxpbmdWYWx1ZVByZXNlbnQodmFsdWUpYCBpcyB0cnVlLlxuICogICAgICBJZiBubyB2YWx1ZSBmb3VuZCBjb25zdWx0IGB0Tm9kZS5yZXNpZHVhbFN0eWxlYC9gdE5vZGUucmVzaWR1YWxDbGFzc2AgZm9yIGRlZmF1bHQgdmFsdWUuXG4gKiAgIC0gYG51bGxgIHNlYXJjaCBwcmV2IGFuZCBnbyBhbGwgdGhlIHdheSB0byBlbmQuIFJldHVybiBsYXN0IHZhbHVlIHdoZXJlXG4gKiAgICAgYGlzU3R5bGluZ1ZhbHVlUHJlc2VudCh2YWx1ZSlgIGlzIHRydWUuXG4gKiBAcGFyYW0gbFZpZXcgYExWaWV3YCB1c2VkIGZvciByZXRyaWV2aW5nIHRoZSBhY3R1YWwgdmFsdWVzLlxuICogQHBhcmFtIHByb3AgUHJvcGVydHkgd2hpY2ggd2UgYXJlIGludGVyZXN0ZWQgaW4uXG4gKiBAcGFyYW0gaW5kZXggU3RhcnRpbmcgaW5kZXggaW4gdGhlIGxpbmtlZCBsaXN0IG9mIHN0eWxpbmcgYmluZGluZ3Mgd2hlcmUgdGhlIHNlYXJjaCBzaG91bGQgc3RhcnQuXG4gKiBAcGFyYW0gaXNDbGFzc0Jhc2VkIGB0cnVlYCBpZiBgY2xhc3NgIChgZmFsc2VgIGlmIGBzdHlsZWApXG4gKi9cbmZ1bmN0aW9uIGZpbmRTdHlsaW5nVmFsdWUoXG4gICAgdERhdGE6IFREYXRhLCB0Tm9kZTogVE5vZGUgfCBudWxsLCBsVmlldzogTFZpZXcsIHByb3A6IHN0cmluZywgaW5kZXg6IG51bWJlcixcbiAgICBpc0NsYXNzQmFzZWQ6IGJvb2xlYW4pOiBhbnkge1xuICAvLyBgVE5vZGVgIHRvIHVzZSBmb3IgcmVzb2x2aW5nIHN0YXRpYyBzdHlsaW5nLiBBbHNvIGNvbnRyb2xzIHNlYXJjaCBkaXJlY3Rpb24uXG4gIC8vICAgLSBgVE5vZGVgIHNlYXJjaCBuZXh0IGFuZCBxdWl0IGFzIHNvb24gYXMgYGlzU3R5bGluZ1ZhbHVlUHJlc2VudCh2YWx1ZSlgIGlzIHRydWUuXG4gIC8vICAgICAgSWYgbm8gdmFsdWUgZm91bmQgY29uc3VsdCBgdE5vZGUucmVzaWR1YWxTdHlsZWAvYHROb2RlLnJlc2lkdWFsQ2xhc3NgIGZvciBkZWZhdWx0IHZhbHVlLlxuICAvLyAgIC0gYG51bGxgIHNlYXJjaCBwcmV2IGFuZCBnbyBhbGwgdGhlIHdheSB0byBlbmQuIFJldHVybiBsYXN0IHZhbHVlIHdoZXJlXG4gIC8vICAgICBgaXNTdHlsaW5nVmFsdWVQcmVzZW50KHZhbHVlKWAgaXMgdHJ1ZS5cbiAgY29uc3QgaXNQcmV2RGlyZWN0aW9uID0gdE5vZGUgPT09IG51bGw7XG4gIGxldCB2YWx1ZTogYW55ID0gdW5kZWZpbmVkO1xuICB3aGlsZSAoaW5kZXggPiAwKSB7XG4gICAgY29uc3QgcmF3S2V5ID0gdERhdGFbaW5kZXhdIGFzIFRTdHlsaW5nS2V5O1xuICAgIGNvbnN0IGNvbnRhaW5zU3RhdGljcyA9IEFycmF5LmlzQXJyYXkocmF3S2V5KTtcbiAgICAvLyBVbndyYXAgdGhlIGtleSBpZiB3ZSBjb250YWluIHN0YXRpYyB2YWx1ZXMuXG4gICAgY29uc3Qga2V5ID0gY29udGFpbnNTdGF0aWNzID8gKHJhd0tleSBhcyBzdHJpbmdbXSlbMV0gOiByYXdLZXk7XG4gICAgY29uc3QgaXNTdHlsaW5nTWFwID0ga2V5ID09PSBudWxsO1xuICAgIGxldCB2YWx1ZUF0TFZpZXdJbmRleCA9IGxWaWV3W2luZGV4ICsgMV07XG4gICAgaWYgKHZhbHVlQXRMVmlld0luZGV4ID09PSBOT19DSEFOR0UpIHtcbiAgICAgIC8vIEluIGZpcnN0VXBkYXRlUGFzcyB0aGUgc3R5bGluZyBpbnN0cnVjdGlvbnMgY3JlYXRlIGEgbGlua2VkIGxpc3Qgb2Ygc3R5bGluZy5cbiAgICAgIC8vIE9uIHN1YnNlcXVlbnQgcGFzc2VzIGl0IGlzIHBvc3NpYmxlIGZvciBhIHN0eWxpbmcgaW5zdHJ1Y3Rpb24gdG8gdHJ5IHRvIHJlYWQgYSBiaW5kaW5nXG4gICAgICAvLyB3aGljaFxuICAgICAgLy8gaGFzIG5vdCB5ZXQgZXhlY3V0ZWQuIEluIHRoYXQgY2FzZSB3ZSB3aWxsIGZpbmQgYE5PX0NIQU5HRWAgYW5kIHdlIHNob3VsZCBhc3N1bWUgdGhhdFxuICAgICAgLy8gd2UgaGF2ZSBgdW5kZWZpbmVkYCAob3IgZW1wdHkgYXJyYXkgaW4gY2FzZSBvZiBzdHlsaW5nLW1hcCBpbnN0cnVjdGlvbikgaW5zdGVhZC4gVGhpc1xuICAgICAgLy8gYWxsb3dzIHRoZSByZXNvbHV0aW9uIHRvIGFwcGx5IHRoZSB2YWx1ZSAod2hpY2ggbWF5IGxhdGVyIGJlIG92ZXJ3cml0dGVuIHdoZW4gdGhlXG4gICAgICAvLyBiaW5kaW5nIGFjdHVhbGx5IGV4ZWN1dGVzLilcbiAgICAgIHZhbHVlQXRMVmlld0luZGV4ID0gaXNTdHlsaW5nTWFwID8gRU1QVFlfQVJSQVkgOiB1bmRlZmluZWQ7XG4gICAgfVxuICAgIGxldCBjdXJyZW50VmFsdWUgPSBpc1N0eWxpbmdNYXAgPyBrZXlWYWx1ZUFycmF5R2V0KHZhbHVlQXRMVmlld0luZGV4LCBwcm9wKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGtleSA9PT0gcHJvcCA/IHZhbHVlQXRMVmlld0luZGV4IDogdW5kZWZpbmVkO1xuICAgIGlmIChjb250YWluc1N0YXRpY3MgJiYgIWlzU3R5bGluZ1ZhbHVlUHJlc2VudChjdXJyZW50VmFsdWUpKSB7XG4gICAgICBjdXJyZW50VmFsdWUgPSBrZXlWYWx1ZUFycmF5R2V0KHJhd0tleSBhcyBLZXlWYWx1ZUFycmF5PGFueT4sIHByb3ApO1xuICAgIH1cbiAgICBpZiAoaXNTdHlsaW5nVmFsdWVQcmVzZW50KGN1cnJlbnRWYWx1ZSkpIHtcbiAgICAgIHZhbHVlID0gY3VycmVudFZhbHVlO1xuICAgICAgaWYgKGlzUHJldkRpcmVjdGlvbikge1xuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICB9XG4gICAgfVxuICAgIGNvbnN0IHRSYW5nZSA9IHREYXRhW2luZGV4ICsgMV0gYXMgVFN0eWxpbmdSYW5nZTtcbiAgICBpbmRleCA9IGlzUHJldkRpcmVjdGlvbiA/IGdldFRTdHlsaW5nUmFuZ2VQcmV2KHRSYW5nZSkgOiBnZXRUU3R5bGluZ1JhbmdlTmV4dCh0UmFuZ2UpO1xuICB9XG4gIGlmICh0Tm9kZSAhPT0gbnVsbCkge1xuICAgIC8vIGluIGNhc2Ugd2hlcmUgd2UgYXJlIGdvaW5nIGluIG5leHQgZGlyZWN0aW9uIEFORCB3ZSBkaWQgbm90IGZpbmQgYW55dGhpbmcsIHdlIG5lZWQgdG9cbiAgICAvLyBjb25zdWx0IHJlc2lkdWFsIHN0eWxpbmdcbiAgICBsZXQgcmVzaWR1YWwgPSBpc0NsYXNzQmFzZWQgPyB0Tm9kZS5yZXNpZHVhbENsYXNzZXMgOiB0Tm9kZS5yZXNpZHVhbFN0eWxlcztcbiAgICBpZiAocmVzaWR1YWwgIT0gbnVsbCAvKiogT1IgcmVzaWR1YWwgIT09PSB1bmRlZmluZWQgKi8pIHtcbiAgICAgIHZhbHVlID0ga2V5VmFsdWVBcnJheUdldChyZXNpZHVhbCAhLCBwcm9wKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHZhbHVlO1xufVxuXG4vKipcbiAqIERldGVybWluZXMgaWYgdGhlIGJpbmRpbmcgdmFsdWUgc2hvdWxkIGJlIHVzZWQgKG9yIGlmIHRoZSB2YWx1ZSBpcyAndW5kZWZpbmVkJyBhbmQgaGVuY2UgcHJpb3JpdHlcbiAqIHJlc29sdXRpb24gc2hvdWxkIGJlIHVzZWQuKVxuICpcbiAqIEBwYXJhbSB2YWx1ZSBCaW5kaW5nIHN0eWxlIHZhbHVlLlxuICovXG5mdW5jdGlvbiBpc1N0eWxpbmdWYWx1ZVByZXNlbnQodmFsdWU6IGFueSk6IGJvb2xlYW4ge1xuICAvLyBDdXJyZW50bHkgb25seSBgdW5kZWZpbmVkYCB2YWx1ZSBpcyBjb25zaWRlcmVkIG5vbi1iaW5kaW5nLiBUaGF0IGlzIGB1bmRlZmluZWRgIHNheXMgSSBkb24ndFxuICAvLyBoYXZlIGFuIG9waW5pb24gYXMgdG8gd2hhdCB0aGlzIGJpbmRpbmcgc2hvdWxkIGJlIGFuZCB5b3Ugc2hvdWxkIGNvbnN1bHQgb3RoZXIgYmluZGluZ3MgYnlcbiAgLy8gcHJpb3JpdHkgdG8gZGV0ZXJtaW5lIHRoZSB2YWxpZCB2YWx1ZS5cbiAgLy8gVGhpcyBpcyBleHRyYWN0ZWQgaW50byBhIHNpbmdsZSBmdW5jdGlvbiBzbyB0aGF0IHdlIGhhdmUgYSBzaW5nbGUgcGxhY2UgdG8gY29udHJvbCB0aGlzLlxuICByZXR1cm4gdmFsdWUgIT09IHVuZGVmaW5lZDtcbn1cblxuLyoqXG4gKiBTYW5pdGl6ZXMgb3IgYWRkcyBzdWZmaXggdG8gdGhlIHZhbHVlLlxuICpcbiAqIElmIHZhbHVlIGlzIGBudWxsYC9gdW5kZWZpbmVkYCBubyBzdWZmaXggaXMgYWRkZWRcbiAqIEBwYXJhbSB2YWx1ZVxuICogQHBhcmFtIHN1ZmZpeE9yU2FuaXRpemVyXG4gKi9cbmZ1bmN0aW9uIG5vcm1hbGl6ZUFuZEFwcGx5U3VmZml4T3JTYW5pdGl6ZXIoXG4gICAgdmFsdWU6IGFueSwgc3VmZml4T3JTYW5pdGl6ZXI6IFNhbml0aXplckZuIHwgc3RyaW5nIHwgdW5kZWZpbmVkIHwgbnVsbCk6IHN0cmluZ3xudWxsfHVuZGVmaW5lZHxcbiAgICBib29sZWFuIHtcbiAgaWYgKHZhbHVlID09IG51bGwgLyoqIHx8IHZhbHVlID09PSB1bmRlZmluZWQgKi8pIHtcbiAgICAvLyBkbyBub3RoaW5nXG4gIH0gZWxzZSBpZiAodHlwZW9mIHN1ZmZpeE9yU2FuaXRpemVyID09PSAnZnVuY3Rpb24nKSB7XG4gICAgLy8gc2FuaXRpemUgdGhlIHZhbHVlLlxuICAgIHZhbHVlID0gc3VmZml4T3JTYW5pdGl6ZXIodmFsdWUpO1xuICB9IGVsc2UgaWYgKHR5cGVvZiBzdWZmaXhPclNhbml0aXplciA9PT0gJ3N0cmluZycpIHtcbiAgICB2YWx1ZSA9IHZhbHVlICsgc3VmZml4T3JTYW5pdGl6ZXI7XG4gIH0gZWxzZSBpZiAodHlwZW9mIHZhbHVlID09PSAnb2JqZWN0Jykge1xuICAgIHZhbHVlID0gc3RyaW5naWZ5KHVud3JhcFNhZmVWYWx1ZSh2YWx1ZSkpO1xuICB9XG4gIHJldHVybiB2YWx1ZTtcbn1cblxuXG4vKipcbiAqIFRlc3RzIGlmIHRoZSBgVE5vZGVgIGhhcyBpbnB1dCBzaGFkb3cuXG4gKlxuICogQW4gaW5wdXQgc2hhZG93IGlzIHdoZW4gYSBkaXJlY3RpdmUgc3RlYWxzIChzaGFkb3dzKSB0aGUgaW5wdXQgYnkgdXNpbmcgYEBJbnB1dCgnc3R5bGUnKWAgb3JcbiAqIGBASW5wdXQoJ2NsYXNzJylgIGFzIGlucHV0LlxuICpcbiAqIEBwYXJhbSB0Tm9kZSBgVE5vZGVgIHdoaWNoIHdlIHdvdWxkIGxpa2UgdG8gc2VlIGlmIGl0IGhhcyBzaGFkb3cuXG4gKiBAcGFyYW0gaXNDbGFzc0Jhc2VkIGB0cnVlYCBpZiBgY2xhc3NgIChgZmFsc2VgIGlmIGBzdHlsZWApXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBoYXNTdHlsaW5nSW5wdXRTaGFkb3codE5vZGU6IFROb2RlLCBpc0NsYXNzQmFzZWQ6IGJvb2xlYW4pIHtcbiAgcmV0dXJuICh0Tm9kZS5mbGFncyAmIChpc0NsYXNzQmFzZWQgPyBUTm9kZUZsYWdzLmhhc0NsYXNzSW5wdXQgOiBUTm9kZUZsYWdzLmhhc1N0eWxlSW5wdXQpKSAhPT0gMDtcbn1cbiJdfQ==