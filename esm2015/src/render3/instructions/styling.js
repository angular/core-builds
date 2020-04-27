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
import { getCurrentDirectiveDef, getCurrentStyleSanitizer, getLView, getSelectedIndex, getTView, incrementBindingIndex, setCurrentStyleSanitizer } from '../state';
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
 * Set a `value` for a `key` taking style sanitization into account.
 *
 * See: `keyValueArraySet` for details
 *
 * @param {?} keyValueArray KeyValueArray to add to.
 * @param {?} key Style key to add. (This key will be checked if it needs sanitization)
 * @param {?} value The value to set (If key needs sanitization it will be sanitized)
 * @return {?}
 */
export function styleKeyValueArraySet(keyValueArray, key, value) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3R5bGluZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaW5zdHJ1Y3Rpb25zL3N0eWxpbmcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUFZLGVBQWUsRUFBQyxNQUFNLDJCQUEyQixDQUFDO0FBQ3JFLE9BQU8sRUFBQywwQkFBMEIsRUFBRSxlQUFlLEVBQUMsTUFBTSxpQ0FBaUMsQ0FBQztBQUU1RixPQUFPLEVBQWdCLGdCQUFnQixFQUFFLGdCQUFnQixFQUFDLE1BQU0sd0JBQXdCLENBQUM7QUFDekYsT0FBTyxFQUFDLGFBQWEsRUFBRSxXQUFXLEVBQUUsY0FBYyxFQUFFLGNBQWMsRUFBRSxVQUFVLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUN6RyxPQUFPLEVBQUMsV0FBVyxFQUFDLE1BQU0sa0JBQWtCLENBQUM7QUFDN0MsT0FBTyxFQUFDLHNCQUFzQixFQUFFLFNBQVMsRUFBQyxNQUFNLHNCQUFzQixDQUFDO0FBQ3ZFLE9BQU8sRUFBQyxxQkFBcUIsRUFBQyxNQUFNLFdBQVcsQ0FBQztBQUNoRCxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sYUFBYSxDQUFDO0FBSzNDLE9BQU8sRUFBQyxvQkFBb0IsRUFBRSw2QkFBNkIsRUFBRSxvQkFBb0IsRUFBRSw2QkFBNkIsRUFBNkIsTUFBTSx1QkFBdUIsQ0FBQztBQUMzSyxPQUFPLEVBQUMsYUFBYSxFQUFTLFFBQVEsRUFBZSxNQUFNLG9CQUFvQixDQUFDO0FBQ2hGLE9BQU8sRUFBQyxZQUFZLEVBQUMsTUFBTSxzQkFBc0IsQ0FBQztBQUNsRCxPQUFPLEVBQUMsc0JBQXNCLEVBQUUsd0JBQXdCLEVBQUUsUUFBUSxFQUFFLGdCQUFnQixFQUFFLFFBQVEsRUFBRSxxQkFBcUIsRUFBRSx3QkFBd0IsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUNqSyxPQUFPLEVBQUMscUJB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c0JBQXNCO1FBQ3RCLEtBQUssR0FBRyxpQkFBaUIsQ0FBQyxLQUFLLENBQUMsQ0FBQztLQUNsQztTQUFNLElBQUksT0FBTyxpQkFBaUIsS0FBSyxRQUFRLEVBQUU7UUFDaEQsS0FBSyxHQUFHLEtBQUssR0FBRyxpQkFBaUIsQ0FBQztLQUNuQztTQUFNLElBQUksT0FBTyxLQUFLLEtBQUssUUFBUSxFQUFFO1FBQ3BDLEtBQUssR0FBRyxTQUFTLENBQUMsZUFBZSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7S0FDM0M7SUFDRCxPQUFPLEtBQUssQ0FBQztBQUNmLENBQUM7Ozs7Ozs7Ozs7O0FBWUQsTUFBTSxVQUFVLHFCQUFxQixDQUFDLEtBQVksRUFBRSxZQUFxQjtJQUN2RSxPQUFPLENBQUMsS0FBSyxDQUFDLEtBQUssR0FBRyxDQUFDLFlBQVksQ0FBQyxDQUFDLHdCQUEwQixDQUFDLHVCQUF5QixDQUFDLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDcEcsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtTYWZlVmFsdWUsIHVud3JhcFNhZmVWYWx1ZX0gZnJvbSAnLi4vLi4vc2FuaXRpemF0aW9uL2J5cGFzcyc7XG5pbXBvcnQge3N0eWxlUHJvcE5lZWRzU2FuaXRpemF0aW9uLCDJtcm1c2FuaXRpemVTdHlsZX0gZnJvbSAnLi4vLi4vc2FuaXRpemF0aW9uL3Nhbml0aXphdGlvbic7XG5pbXBvcnQge1N0eWxlU2FuaXRpemVGbn0gZnJvbSAnLi4vLi4vc2FuaXRpemF0aW9uL3N0eWxlX3Nhbml0aXplcic7XG5pbXBvcnQge0tleVZhbHVlQXJyYXksIGtleVZhbHVlQXJyYXlHZXQsIGtleVZhbHVlQXJyYXlTZXR9IGZyb20gJy4uLy4uL3V0aWwvYXJyYXlfdXRpbHMnO1xuaW1wb3J0IHthc3NlcnREZWZpbmVkLCBhc3NlcnRFcXVhbCwgYXNzZXJ0TGVzc1RoYW4sIGFzc2VydE5vdEVxdWFsLCB0aHJvd0Vycm9yfSBmcm9tICcuLi8uLi91dGlsL2Fzc2VydCc7XG5pbXBvcnQge0VNUFRZX0FSUkFZfSBmcm9tICcuLi8uLi91dGlsL2VtcHR5JztcbmltcG9ydCB7Y29uY2F0U3RyaW5nc1dpdGhTcGFjZSwgc3RyaW5naWZ5fSBmcm9tICcuLi8uLi91dGlsL3N0cmluZ2lmeSc7XG5pbXBvcnQge2Fzc2VydEZpcnN0VXBkYXRlUGFzc30gZnJvbSAnLi4vYXNzZXJ0JztcbmltcG9ydCB7YmluZGluZ1VwZGF0ZWR9IGZyb20gJy4uL2JpbmRpbmdzJztcbmltcG9ydCB7RGlyZWN0aXZlRGVmfSBmcm9tICcuLi9pbnRlcmZhY2VzL2RlZmluaXRpb24nO1xuaW1wb3J0IHtBdHRyaWJ1dGVNYXJrZXIsIFRBdHRyaWJ1dGVzLCBUTm9kZSwgVE5vZGVGbGFncywgVE5vZGVUeXBlfSBmcm9tICcuLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtSRWxlbWVudCwgUmVuZGVyZXIzfSBmcm9tICcuLi9pbnRlcmZhY2VzL3JlbmRlcmVyJztcbmltcG9ydCB7U2FuaXRpemVyRm59IGZyb20gJy4uL2ludGVyZmFjZXMvc2FuaXRpemF0aW9uJztcbmltcG9ydCB7Z2V0VFN0eWxpbmdSYW5nZU5leHQsIGdldFRTdHlsaW5nUmFuZ2VOZXh0RHVwbGljYXRlLCBnZXRUU3R5bGluZ1JhbmdlUHJldiwgZ2V0VFN0eWxpbmdSYW5nZVByZXZEdXBsaWNhdGUsIFRTdHlsaW5nS2V5LCBUU3R5bGluZ1JhbmdlfSBmcm9tICcuLi9pbnRlcmZhY2VzL3N0eWxpbmcnO1xuaW1wb3J0IHtIRUFERVJfT0ZGU0VULCBMVmlldywgUkVOREVSRVIsIFREYXRhLCBUVmlld30gZnJvbSAnLi4vaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7YXBwbHlTdHlsaW5nfSBmcm9tICcuLi9ub2RlX21hbmlwdWxhdGlvbic7XG5pbXBvcnQge2dldEN1cnJlbnREaXJlY3RpdmVEZWYsIGdldEN1cnJlbnRTdHlsZVNhbml0aXplciwgZ2V0TFZpZXcsIGdldFNlbGVjdGVkSW5kZXgsIGdldFRWaWV3LCBpbmNyZW1lbnRCaW5kaW5nSW5kZXgsIHNldEN1cnJlbnRTdHlsZVNhbml0aXplcn0gZnJvbSAnLi4vc3RhdGUnO1xuaW1wb3J0IHtpbnNlcnRUU3R5bGluZ0JpbmRpbmd9IGZyb20gJy4uL3N0eWxpbmcvc3R5bGVfYmluZGluZ19saXN0JztcbmltcG9ydCB7Z2V0TGFzdFBhcnNlZEtleSwgZ2V0TGFzdFBhcnNlZFZhbHVlLCBwYXJzZUNsYXNzTmFtZSwgcGFyc2VDbGFzc05hbWVOZXh0LCBwYXJzZVN0eWxlLCBwYXJzZVN0eWxlTmV4dH0gZnJvbSAnLi4vc3R5bGluZy9zdHlsaW5nX3BhcnNlcic7XG5pbXBvcnQge05PX0NIQU5HRX0gZnJvbSAnLi4vdG9rZW5zJztcbmltcG9ydCB7Z2V0TmF0aXZlQnlJbmRleH0gZnJvbSAnLi4vdXRpbC92aWV3X3V0aWxzJztcblxuaW1wb3J0IHtzZXREaXJlY3RpdmVJbnB1dHNXaGljaFNoYWRvd3NTdHlsaW5nfSBmcm9tICcuL3Byb3BlcnR5JztcblxuXG4vKipcbiAqIFNldHMgdGhlIGN1cnJlbnQgc3R5bGUgc2FuaXRpemVyIGZ1bmN0aW9uIHdoaWNoIHdpbGwgdGhlbiBiZSB1c2VkXG4gKiB3aXRoaW4gYWxsIGZvbGxvdy11cCBwcm9wIGFuZCBtYXAtYmFzZWQgc3R5bGUgYmluZGluZyBpbnN0cnVjdGlvbnNcbiAqIGZvciB0aGUgZ2l2ZW4gZWxlbWVudC5cbiAqXG4gKiBOb3RlIHRoYXQgb25jZSBzdHlsaW5nIGhhcyBiZWVuIGFwcGxpZWQgdG8gdGhlIGVsZW1lbnQgKGkuZS4gb25jZVxuICogYGFkdmFuY2UobilgIGlzIGV4ZWN1dGVkIG9yIHRoZSBob3N0QmluZGluZ3MvdGVtcGxhdGUgZnVuY3Rpb24gZXhpdHMpXG4gKiB0aGVuIHRoZSBhY3RpdmUgYHNhbml0aXplckZuYCB3aWxsIGJlIHNldCB0byBgbnVsbGAuIFRoaXMgbWVhbnMgdGhhdFxuICogb25jZSBzdHlsaW5nIGlzIGFwcGxpZWQgdG8gYW5vdGhlciBlbGVtZW50IHRoZW4gYSBhbm90aGVyIGNhbGwgdG9cbiAqIGBzdHlsZVNhbml0aXplcmAgd2lsbCBuZWVkIHRvIGJlIG1hZGUuXG4gKlxuICogQHBhcmFtIHNhbml0aXplckZuIFRoZSBzYW5pdGl6YXRpb24gZnVuY3Rpb24gdGhhdCB3aWxsIGJlIHVzZWQgdG9cbiAqICAgICAgIHByb2Nlc3Mgc3R5bGUgcHJvcC92YWx1ZSBlbnRyaWVzLlxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1c3R5bGVTYW5pdGl6ZXIoc2FuaXRpemVyOiBTdHlsZVNhbml0aXplRm58bnVsbCk6IHZvaWQge1xuICBzZXRDdXJyZW50U3R5bGVTYW5pdGl6ZXIoc2FuaXRpemVyKTtcbn1cblxuLyoqXG4gKiBVcGRhdGUgYSBzdHlsZSBiaW5kaW5nIG9uIGFuIGVsZW1lbnQgd2l0aCB0aGUgcHJvdmlkZWQgdmFsdWUuXG4gKlxuICogSWYgdGhlIHN0eWxlIHZhbHVlIGlzIGZhbHN5IHRoZW4gaXQgd2lsbCBiZSByZW1vdmVkIGZyb20gdGhlIGVsZW1lbnRcbiAqIChvciBhc3NpZ25lZCBhIGRpZmZlcmVudCB2YWx1ZSBkZXBlbmRpbmcgaWYgdGhlcmUgYXJlIGFueSBzdHlsZXMgcGxhY2VkXG4gKiBvbiB0aGUgZWxlbWVudCB3aXRoIGBzdHlsZU1hcGAgb3IgYW55IHN0YXRpYyBzdHlsZXMgdGhhdCBhcmVcbiAqIHByZXNlbnQgZnJvbSB3aGVuIHRoZSBlbGVtZW50IHdhcyBjcmVhdGVkIHdpdGggYHN0eWxpbmdgKS5cbiAqXG4gKiBOb3RlIHRoYXQgdGhlIHN0eWxpbmcgZWxlbWVudCBpcyB1cGRhdGVkIGFzIHBhcnQgb2YgYHN0eWxpbmdBcHBseWAuXG4gKlxuICogQHBhcmFtIHByb3AgQSB2YWxpZCBDU1MgcHJvcGVydHkuXG4gKiBAcGFyYW0gdmFsdWUgTmV3IHZhbHVlIHRvIHdyaXRlIChgbnVsbGAgb3IgYW4gZW1wdHkgc3RyaW5nIHRvIHJlbW92ZSkuXG4gKiBAcGFyYW0gc3VmZml4IE9wdGlvbmFsIHN1ZmZpeC4gVXNlZCB3aXRoIHNjYWxhciB2YWx1ZXMgdG8gYWRkIHVuaXQgc3VjaCBhcyBgcHhgLlxuICogICAgICAgIE5vdGUgdGhhdCB3aGVuIGEgc3VmZml4IGlzIHByb3ZpZGVkIHRoZW4gdGhlIHVuZGVybHlpbmcgc2FuaXRpemVyIHdpbGxcbiAqICAgICAgICBiZSBpZ25vcmVkLlxuICpcbiAqIE5vdGUgdGhhdCB0aGlzIHdpbGwgYXBwbHkgdGhlIHByb3ZpZGVkIHN0eWxlIHZhbHVlIHRvIHRoZSBob3N0IGVsZW1lbnQgaWYgdGhpcyBmdW5jdGlvbiBpcyBjYWxsZWRcbiAqIHdpdGhpbiBhIGhvc3QgYmluZGluZyBmdW5jdGlvbi5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtXN0eWxlUHJvcChcbiAgICBwcm9wOiBzdHJpbmcsIHZhbHVlOiBzdHJpbmd8bnVtYmVyfFNhZmVWYWx1ZXx1bmRlZmluZWR8bnVsbCxcbiAgICBzdWZmaXg/OiBzdHJpbmd8bnVsbCk6IHR5cGVvZiDJtcm1c3R5bGVQcm9wIHtcbiAgY2hlY2tTdHlsaW5nUHJvcGVydHkocHJvcCwgdmFsdWUsIHN1ZmZpeCwgZmFsc2UpO1xuICByZXR1cm4gybXJtXN0eWxlUHJvcDtcbn1cblxuLyoqXG4gKiBVcGRhdGUgYSBjbGFzcyBiaW5kaW5nIG9uIGFuIGVsZW1lbnQgd2l0aCB0aGUgcHJvdmlkZWQgdmFsdWUuXG4gKlxuICogVGhpcyBpbnN0cnVjdGlvbiBpcyBtZWFudCB0byBoYW5kbGUgdGhlIGBbY2xhc3MuZm9vXT1cImV4cFwiYCBjYXNlIGFuZCxcbiAqIHRoZXJlZm9yZSwgdGhlIGNsYXNzIGJpbmRpbmcgaXRzZWxmIG11c3QgYWxyZWFkeSBiZSBhbGxvY2F0ZWQgdXNpbmdcbiAqIGBzdHlsaW5nYCB3aXRoaW4gdGhlIGNyZWF0aW9uIGJsb2NrLlxuICpcbiAqIEBwYXJhbSBwcm9wIEEgdmFsaWQgQ1NTIGNsYXNzIChvbmx5IG9uZSkuXG4gKiBAcGFyYW0gdmFsdWUgQSB0cnVlL2ZhbHNlIHZhbHVlIHdoaWNoIHdpbGwgdHVybiB0aGUgY2xhc3Mgb24gb3Igb2ZmLlxuICpcbiAqIE5vdGUgdGhhdCB0aGlzIHdpbGwgYXBwbHkgdGhlIHByb3ZpZGVkIGNsYXNzIHZhbHVlIHRvIHRoZSBob3N0IGVsZW1lbnQgaWYgdGhpcyBmdW5jdGlvblxuICogaXMgY2FsbGVkIHdpdGhpbiBhIGhvc3QgYmluZGluZyBmdW5jdGlvbi5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWNsYXNzUHJvcChjbGFzc05hbWU6IHN0cmluZywgdmFsdWU6IGJvb2xlYW58dW5kZWZpbmVkfG51bGwpOiB0eXBlb2YgybXJtWNsYXNzUHJvcCB7XG4gIGNoZWNrU3R5bGluZ1Byb3BlcnR5KGNsYXNzTmFtZSwgdmFsdWUsIG51bGwsIHRydWUpO1xuICByZXR1cm4gybXJtWNsYXNzUHJvcDtcbn1cblxuXG4vKipcbiAqIFVwZGF0ZSBzdHlsZSBiaW5kaW5ncyB1c2luZyBhbiBvYmplY3QgbGl0ZXJhbCBvbiBhbiBlbGVtZW50LlxuICpcbiAqIFRoaXMgaW5zdHJ1Y3Rpb24gaXMgbWVhbnQgdG8gYXBwbHkgc3R5bGluZyB2aWEgdGhlIGBbc3R5bGVdPVwiZXhwXCJgIHRlbXBsYXRlIGJpbmRpbmdzLlxuICogV2hlbiBzdHlsZXMgYXJlIGFwcGxpZWQgdG8gdGhlIGVsZW1lbnQgdGhleSB3aWxsIHRoZW4gYmUgdXBkYXRlZCB3aXRoIHJlc3BlY3QgdG9cbiAqIGFueSBzdHlsZXMvY2xhc3NlcyBzZXQgdmlhIGBzdHlsZVByb3BgLiBJZiBhbnkgc3R5bGVzIGFyZSBzZXQgdG8gZmFsc3lcbiAqIHRoZW4gdGhleSB3aWxsIGJlIHJlbW92ZWQgZnJvbSB0aGUgZWxlbWVudC5cbiAqXG4gKiBOb3RlIHRoYXQgdGhlIHN0eWxpbmcgaW5zdHJ1Y3Rpb24gd2lsbCBub3QgYmUgYXBwbGllZCB1bnRpbCBgc3R5bGluZ0FwcGx5YCBpcyBjYWxsZWQuXG4gKlxuICogQHBhcmFtIHN0eWxlcyBBIGtleS92YWx1ZSBzdHlsZSBtYXAgb2YgdGhlIHN0eWxlcyB0aGF0IHdpbGwgYmUgYXBwbGllZCB0byB0aGUgZ2l2ZW4gZWxlbWVudC5cbiAqICAgICAgICBBbnkgbWlzc2luZyBzdHlsZXMgKHRoYXQgaGF2ZSBhbHJlYWR5IGJlZW4gYXBwbGllZCB0byB0aGUgZWxlbWVudCBiZWZvcmVoYW5kKSB3aWxsIGJlXG4gKiAgICAgICAgcmVtb3ZlZCAodW5zZXQpIGZyb20gdGhlIGVsZW1lbnQncyBzdHlsaW5nLlxuICpcbiAqIE5vdGUgdGhhdCB0aGlzIHdpbGwgYXBwbHkgdGhlIHByb3ZpZGVkIHN0eWxlTWFwIHZhbHVlIHRvIHRoZSBob3N0IGVsZW1lbnQgaWYgdGhpcyBmdW5jdGlvblxuICogaXMgY2FsbGVkIHdpdGhpbiBhIGhvc3QgYmluZGluZy5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtXN0eWxlTWFwKHN0eWxlczoge1tzdHlsZU5hbWU6IHN0cmluZ106IGFueX18c3RyaW5nfHVuZGVmaW5lZHxudWxsKTogdm9pZCB7XG4gIGNoZWNrU3R5bGluZ01hcChzdHlsZUtleVZhbHVlQXJyYXlTZXQsIHN0eWxlU3RyaW5nUGFyc2VyLCBzdHlsZXMsIGZhbHNlKTtcbn1cblxuXG4vKipcbiAqIFBhcnNlIHRleHQgYXMgc3R5bGUgYW5kIGFkZCB2YWx1ZXMgdG8gS2V5VmFsdWVBcnJheS5cbiAqXG4gKiBUaGlzIGNvZGUgaXMgcHVsbGVkIG91dCB0byBhIHNlcGFyYXRlIGZ1bmN0aW9uIHNvIHRoYXQgaXQgY2FuIGJlIHRyZWUgc2hha2VuIGF3YXkgaWYgaXQgaXMgbm90XG4gKiBuZWVkZWQuIEl0IGlzIG9ubHkgcmVmZXJlbmNlZCBmcm9tIGDJtcm1c3R5bGVNYXBgLlxuICpcbiAqIEBwYXJhbSBrZXlWYWx1ZUFycmF5IEtleVZhbHVlQXJyYXkgdG8gYWRkIHBhcnNlZCB2YWx1ZXMgdG8uXG4gKiBAcGFyYW0gdGV4dCB0ZXh0IHRvIHBhcnNlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gc3R5bGVTdHJpbmdQYXJzZXIoa2V5VmFsdWVBcnJheTogS2V5VmFsdWVBcnJheTxhbnk+LCB0ZXh0OiBzdHJpbmcpOiB2b2lkIHtcbiAgZm9yIChsZXQgaSA9IHBhcnNlU3R5bGUodGV4dCk7IGkgPj0gMDsgaSA9IHBhcnNlU3R5bGVOZXh0KHRleHQsIGkpKSB7XG4gICAgc3R5bGVLZXlWYWx1ZUFycmF5U2V0KGtleVZhbHVlQXJyYXksIGdldExhc3RQYXJzZWRLZXkodGV4dCksIGdldExhc3RQYXJzZWRWYWx1ZSh0ZXh0KSk7XG4gIH1cbn1cblxuXG4vKipcbiAqIFVwZGF0ZSBjbGFzcyBiaW5kaW5ncyB1c2luZyBhbiBvYmplY3QgbGl0ZXJhbCBvciBjbGFzcy1zdHJpbmcgb24gYW4gZWxlbWVudC5cbiAqXG4gKiBUaGlzIGluc3RydWN0aW9uIGlzIG1lYW50IHRvIGFwcGx5IHN0eWxpbmcgdmlhIHRoZSBgW2NsYXNzXT1cImV4cFwiYCB0ZW1wbGF0ZSBiaW5kaW5ncy5cbiAqIFdoZW4gY2xhc3NlcyBhcmUgYXBwbGllZCB0byB0aGUgZWxlbWVudCB0aGV5IHdpbGwgdGhlbiBiZSB1cGRhdGVkIHdpdGhcbiAqIHJlc3BlY3QgdG8gYW55IHN0eWxlcy9jbGFzc2VzIHNldCB2aWEgYGNsYXNzUHJvcGAuIElmIGFueVxuICogY2xhc3NlcyBhcmUgc2V0IHRvIGZhbHN5IHRoZW4gdGhleSB3aWxsIGJlIHJlbW92ZWQgZnJvbSB0aGUgZWxlbWVudC5cbiAqXG4gKiBOb3RlIHRoYXQgdGhlIHN0eWxpbmcgaW5zdHJ1Y3Rpb24gd2lsbCBub3QgYmUgYXBwbGllZCB1bnRpbCBgc3R5bGluZ0FwcGx5YCBpcyBjYWxsZWQuXG4gKiBOb3RlIHRoYXQgdGhpcyB3aWxsIHRoZSBwcm92aWRlZCBjbGFzc01hcCB2YWx1ZSB0byB0aGUgaG9zdCBlbGVtZW50IGlmIHRoaXMgZnVuY3Rpb24gaXMgY2FsbGVkXG4gKiB3aXRoaW4gYSBob3N0IGJpbmRpbmcuXG4gKlxuICogQHBhcmFtIGNsYXNzZXMgQSBrZXkvdmFsdWUgbWFwIG9yIHN0cmluZyBvZiBDU1MgY2xhc3NlcyB0aGF0IHdpbGwgYmUgYWRkZWQgdG8gdGhlXG4gKiAgICAgICAgZ2l2ZW4gZWxlbWVudC4gQW55IG1pc3NpbmcgY2xhc3NlcyAodGhhdCBoYXZlIGFscmVhZHkgYmVlbiBhcHBsaWVkIHRvIHRoZSBlbGVtZW50XG4gKiAgICAgICAgYmVmb3JlaGFuZCkgd2lsbCBiZSByZW1vdmVkICh1bnNldCkgZnJvbSB0aGUgZWxlbWVudCdzIGxpc3Qgb2YgQ1NTIGNsYXNzZXMuXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVjbGFzc01hcChjbGFzc2VzOiB7W2NsYXNzTmFtZTogc3RyaW5nXTogYm9vbGVhbnx1bmRlZmluZWR8bnVsbH18c3RyaW5nfHVuZGVmaW5lZHxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIG51bGwpOiB2b2lkIHtcbiAgY2hlY2tTdHlsaW5nTWFwKGtleVZhbHVlQXJyYXlTZXQsIGNsYXNzU3RyaW5nUGFyc2VyLCBjbGFzc2VzLCB0cnVlKTtcbn1cblxuLyoqXG4gKiBQYXJzZSB0ZXh0IGFzIGNsYXNzIGFuZCBhZGQgdmFsdWVzIHRvIEtleVZhbHVlQXJyYXkuXG4gKlxuICogVGhpcyBjb2RlIGlzIHB1bGxlZCBvdXQgdG8gYSBzZXBhcmF0ZSBmdW5jdGlvbiBzbyB0aGF0IGl0IGNhbiBiZSB0cmVlIHNoYWtlbiBhd2F5IGlmIGl0IGlzIG5vdFxuICogbmVlZGVkLiBJdCBpcyBvbmx5IHJlZmVyZW5jZWQgZnJvbSBgybXJtWNsYXNzTWFwYC5cbiAqXG4gKiBAcGFyYW0ga2V5VmFsdWVBcnJheSBLZXlWYWx1ZUFycmF5IHRvIGFkZCBwYXJzZWQgdmFsdWVzIHRvLlxuICogQHBhcmFtIHRleHQgdGV4dCB0byBwYXJzZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNsYXNzU3RyaW5nUGFyc2VyKGtleVZhbHVlQXJyYXk6IEtleVZhbHVlQXJyYXk8YW55PiwgdGV4dDogc3RyaW5nKTogdm9pZCB7XG4gIGZvciAobGV0IGkgPSBwYXJzZUNsYXNzTmFtZSh0ZXh0KTsgaSA+PSAwOyBpID0gcGFyc2VDbGFzc05hbWVOZXh0KHRleHQsIGkpKSB7XG4gICAga2V5VmFsdWVBcnJheVNldChrZXlWYWx1ZUFycmF5LCBnZXRMYXN0UGFyc2VkS2V5KHRleHQpLCB0cnVlKTtcbiAgfVxufVxuXG4vKipcbiAqIENvbW1vbiBjb2RlIGJldHdlZW4gYMm1ybVjbGFzc1Byb3BgIGFuZCBgybXJtXN0eWxlUHJvcGAuXG4gKlxuICogQHBhcmFtIHByb3AgcHJvcGVydHkgbmFtZS5cbiAqIEBwYXJhbSB2YWx1ZSBiaW5kaW5nIHZhbHVlLlxuICogQHBhcmFtIHN1ZmZpeE9yU2FuaXRpemVyIHN1ZmZpeCBvciBzYW5pdGl6YXRpb24gZnVuY3Rpb25cbiAqIEBwYXJhbSBpc0NsYXNzQmFzZWQgYHRydWVgIGlmIGBjbGFzc2AgY2hhbmdlIChgZmFsc2VgIGlmIGBzdHlsZWApXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjaGVja1N0eWxpbmdQcm9wZXJ0eShcbiAgICBwcm9wOiBzdHJpbmcsIHZhbHVlOiBhbnl8Tk9fQ0hBTkdFLCBzdWZmaXhPclNhbml0aXplcjogU2FuaXRpemVyRm58c3RyaW5nfHVuZGVmaW5lZHxudWxsLFxuICAgIGlzQ2xhc3NCYXNlZDogYm9vbGVhbik6IHZvaWQge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IHRWaWV3ID0gZ2V0VFZpZXcoKTtcbiAgLy8gU3R5bGluZyBpbnN0cnVjdGlvbnMgdXNlIDIgc2xvdHMgcGVyIGJpbmRpbmcuXG4gIC8vIDEuIG9uZSBmb3IgdGhlIHZhbHVlIC8gVFN0eWxpbmdLZXlcbiAgLy8gMi4gb25lIGZvciB0aGUgaW50ZXJtaXR0ZW50LXZhbHVlIC8gVFN0eWxpbmdSYW5nZVxuICBjb25zdCBiaW5kaW5nSW5kZXggPSBpbmNyZW1lbnRCaW5kaW5nSW5kZXgoMik7XG4gIGlmICh0Vmlldy5maXJzdFVwZGF0ZVBhc3MpIHtcbiAgICBzdHlsaW5nRmlyc3RVcGRhdGVQYXNzKHRWaWV3LCBwcm9wLCBiaW5kaW5nSW5kZXgsIGlzQ2xhc3NCYXNlZCk7XG4gIH1cbiAgaWYgKHZhbHVlICE9PSBOT19DSEFOR0UgJiYgYmluZGluZ1VwZGF0ZWQobFZpZXcsIGJpbmRpbmdJbmRleCwgdmFsdWUpKSB7XG4gICAgLy8gVGhpcyBpcyBhIHdvcmsgYXJvdW5kLiBPbmNlIFBSIzM0NDgwIGxhbmRzIHRoZSBzYW5pdGl6ZXIgaXMgcGFzc2VkIGV4cGxpY2l0bHkgYW5kIHRoaXMgbGluZVxuICAgIC8vIGNhbiBiZSByZW1vdmVkLlxuICAgIGxldCBzdHlsZVNhbml0aXplcjogU3R5bGVTYW5pdGl6ZUZufG51bGw7XG4gICAgaWYgKHN1ZmZpeE9yU2FuaXRpemVyID09IG51bGwpIHtcbiAgICAgIGlmIChzdHlsZVNhbml0aXplciA9IGdldEN1cnJlbnRTdHlsZVNhbml0aXplcigpKSB7XG4gICAgICAgIHN1ZmZpeE9yU2FuaXRpemVyID0gc3R5bGVTYW5pdGl6ZXIgYXMgYW55O1xuICAgICAgfVxuICAgIH1cbiAgICBjb25zdCB0Tm9kZSA9IHRWaWV3LmRhdGFbZ2V0U2VsZWN0ZWRJbmRleCgpICsgSEVBREVSX09GRlNFVF0gYXMgVE5vZGU7XG4gICAgdXBkYXRlU3R5bGluZyhcbiAgICAgICAgdFZpZXcsIHROb2RlLCBsVmlldywgbFZpZXdbUkVOREVSRVJdLCBwcm9wLFxuICAgICAgICBsVmlld1tiaW5kaW5nSW5kZXggKyAxXSA9IG5vcm1hbGl6ZUFuZEFwcGx5U3VmZml4T3JTYW5pdGl6ZXIodmFsdWUsIHN1ZmZpeE9yU2FuaXRpemVyKSxcbiAgICAgICAgaXNDbGFzc0Jhc2VkLCBiaW5kaW5nSW5kZXgpO1xuICB9XG59XG5cbi8qKlxuICogQ29tbW9uIGNvZGUgYmV0d2VlbiBgybXJtWNsYXNzTWFwYCBhbmQgYMm1ybVzdHlsZU1hcGAuXG4gKlxuICogQHBhcmFtIGtleVZhbHVlQXJyYXlTZXQgKFNlZSBga2V5VmFsdWVBcnJheVNldGAgaW4gXCJ1dGlsL2FycmF5X3V0aWxzXCIpIEdldHMgcGFzc2VkIGluIGFzIGFcbiAqIGZ1bmN0aW9uIHNvIHRoYXRcbiAqICAgICAgICBgc3R5bGVgIGNhbiBwYXNzIGluIHZlcnNpb24gd2hpY2ggZG9lcyBzYW5pdGl6YXRpb24uIFRoaXMgaXMgZG9uZSBmb3IgdHJlZSBzaGFraW5nXG4gKiAgICAgICAgcHVycG9zZXMuXG4gKiBAcGFyYW0gc3RyaW5nUGFyc2VyIFBhcnNlciB1c2VkIHRvIHBhcnNlIGB2YWx1ZWAgaWYgYHN0cmluZ2AuIChQYXNzZWQgaW4gYXMgYHN0eWxlYCBhbmQgYGNsYXNzYFxuICogICAgICAgIGhhdmUgZGlmZmVyZW50IHBhcnNlcnMuKVxuICogQHBhcmFtIHZhbHVlIGJvdW5kIHZhbHVlIGZyb20gYXBwbGljYXRpb25cbiAqIEBwYXJhbSBpc0NsYXNzQmFzZWQgYHRydWVgIGlmIGBjbGFzc2AgY2hhbmdlIChgZmFsc2VgIGlmIGBzdHlsZWApXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjaGVja1N0eWxpbmdNYXAoXG4gICAga2V5VmFsdWVBcnJheVNldDogKGtleVZhbHVlQXJyYXk6IEtleVZhbHVlQXJyYXk8YW55Piwga2V5OiBzdHJpbmcsIHZhbHVlOiBhbnkpID0+IHZvaWQsXG4gICAgc3RyaW5nUGFyc2VyOiAoc3R5bGVLZXlWYWx1ZUFycmF5OiBLZXlWYWx1ZUFycmF5PGFueT4sIHRleHQ6IHN0cmluZykgPT4gdm9pZCxcbiAgICB2YWx1ZTogYW55fE5PX0NIQU5HRSwgaXNDbGFzc0Jhc2VkOiBib29sZWFuKTogdm9pZCB7XG4gIGNvbnN0IHRWaWV3ID0gZ2V0VFZpZXcoKTtcbiAgY29uc3QgYmluZGluZ0luZGV4ID0gaW5jcmVtZW50QmluZGluZ0luZGV4KDIpO1xuICBpZiAodFZpZXcuZmlyc3RVcGRhdGVQYXNzKSB7XG4gICAgc3R5bGluZ0ZpcnN0VXBkYXRlUGFzcyh0VmlldywgbnVsbCwgYmluZGluZ0luZGV4LCBpc0NsYXNzQmFzZWQpO1xuICB9XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgaWYgKHZhbHVlICE9PSBOT19DSEFOR0UgJiYgYmluZGluZ1VwZGF0ZWQobFZpZXcsIGJpbmRpbmdJbmRleCwgdmFsdWUpKSB7XG4gICAgLy8gYGdldFNlbGVjdGVkSW5kZXgoKWAgc2hvdWxkIGJlIGhlcmUgKHJhdGhlciB0aGFuIGluIGluc3RydWN0aW9uKSBzbyB0aGF0IGl0IGlzIGd1YXJkZWQgYnkgdGhlXG4gICAgLy8gaWYgc28gYXMgbm90IHRvIHJlYWQgdW5uZWNlc3NhcmlseS5cbiAgICBjb25zdCB0Tm9kZSA9IHRWaWV3LmRhdGFbZ2V0U2VsZWN0ZWRJbmRleCgpICsgSEVBREVSX09GRlNFVF0gYXMgVE5vZGU7XG4gICAgaWYgKGhhc1N0eWxpbmdJbnB1dFNoYWRvdyh0Tm9kZSwgaXNDbGFzc0Jhc2VkKSAmJiAhaXNJbkhvc3RCaW5kaW5ncyh0VmlldywgYmluZGluZ0luZGV4KSkge1xuICAgICAgaWYgKG5nRGV2TW9kZSkge1xuICAgICAgICAvLyB2ZXJpZnkgdGhhdCBpZiB3ZSBhcmUgc2hhZG93aW5nIHRoZW4gYFREYXRhYCBpcyBhcHByb3ByaWF0ZWx5IG1hcmtlZCBzbyB0aGF0IHdlIHNraXBcbiAgICAgICAgLy8gcHJvY2Vzc2luZyB0aGlzIGJpbmRpbmcgaW4gc3R5bGluZyByZXNvbHV0aW9uLlxuICAgICAgICBjb25zdCB0U3R5bGluZ0tleSA9IHRWaWV3LmRhdGFbYmluZGluZ0luZGV4XTtcbiAgICAgICAgYXNzZXJ0RXF1YWwoXG4gICAgICAgICAgICBBcnJheS5pc0FycmF5KHRTdHlsaW5nS2V5KSA/IHRTdHlsaW5nS2V5WzFdIDogdFN0eWxpbmdLZXksIGZhbHNlLFxuICAgICAgICAgICAgJ1N0eWxpbmcgbGlua2VkIGxpc3Qgc2hhZG93IGlucHV0IHNob3VsZCBiZSBtYXJrZWQgYXMgXFwnZmFsc2VcXCcnKTtcbiAgICAgIH1cbiAgICAgIC8vIFZFIGRvZXMgbm90IGNvbmNhdGVuYXRlIHRoZSBzdGF0aWMgcG9ydGlvbiBsaWtlIHdlIGFyZSBkb2luZyBoZXJlLlxuICAgICAgLy8gSW5zdGVhZCBWRSBqdXN0IGlnbm9yZXMgdGhlIHN0YXRpYyBjb21wbGV0ZWx5IGlmIGR5bmFtaWMgYmluZGluZyBpcyBwcmVzZW50LlxuICAgICAgLy8gQmVjYXVzZSBvZiBsb2NhbGl0eSB3ZSBoYXZlIGFscmVhZHkgc2V0IHRoZSBzdGF0aWMgcG9ydGlvbiBiZWNhdXNlIHdlIGRvbid0IGtub3cgaWYgdGhlcmVcbiAgICAgIC8vIGlzIGEgZHluYW1pYyBwb3J0aW9uIHVudGlsIGxhdGVyLiBJZiB3ZSB3b3VsZCBpZ25vcmUgdGhlIHN0YXRpYyBwb3J0aW9uIGl0IHdvdWxkIGxvb2sgbGlrZVxuICAgICAgLy8gdGhlIGJpbmRpbmcgaGFzIHJlbW92ZWQgaXQuIFRoaXMgd291bGQgY29uZnVzZSBgW25nU3R5bGVdYC9gW25nQ2xhc3NdYCB0byBkbyB0aGUgd3JvbmdcbiAgICAgIC8vIHRoaW5nIGFzIGl0IHdvdWxkIHRoaW5rIHRoYXQgdGhlIHN0YXRpYyBwb3J0aW9uIHdhcyByZW1vdmVkLiBGb3IgdGhpcyByZWFzb24gd2VcbiAgICAgIC8vIGNvbmNhdGVuYXRlIGl0IHNvIHRoYXQgYFtuZ1N0eWxlXWAvYFtuZ0NsYXNzXWAgIGNhbiBjb250aW51ZSB0byB3b3JrIG9uIGNoYW5nZWQuXG4gICAgICBsZXQgc3RhdGljUHJlZml4ID0gaXNDbGFzc0Jhc2VkID8gdE5vZGUuY2xhc3NlcyA6IHROb2RlLnN0eWxlcztcbiAgICAgIG5nRGV2TW9kZSAmJiBpc0NsYXNzQmFzZWQgPT09IGZhbHNlICYmIHN0YXRpY1ByZWZpeCAhPT0gbnVsbCAmJlxuICAgICAgICAgIGFzc2VydEVxdWFsKFxuICAgICAgICAgICAgICBzdGF0aWNQcmVmaXguZW5kc1dpdGgoJzsnKSwgdHJ1ZSwgJ0V4cGVjdGluZyBzdGF0aWMgcG9ydGlvbiB0byBlbmQgd2l0aCBcXCc7XFwnJyk7XG4gICAgICBpZiAoc3RhdGljUHJlZml4ICE9PSBudWxsKSB7XG4gICAgICAgIC8vIFdlIHdhbnQgdG8gbWFrZSBzdXJlIHRoYXQgZmFsc3kgdmFsdWVzIG9mIGB2YWx1ZWAgYmVjb21lIGVtcHR5IHN0cmluZ3MuXG4gICAgICAgIHZhbHVlID0gY29uY2F0U3RyaW5nc1dpdGhTcGFjZShzdGF0aWNQcmVmaXgsIHZhbHVlID8gdmFsdWUgOiAnJyk7XG4gICAgICB9XG4gICAgICAvLyBHaXZlbiBgPGRpdiBbc3R5bGVdIG15LWRpcj5gIHN1Y2ggdGhhdCBgbXktZGlyYCBoYXMgYEBJbnB1dCgnc3R5bGUnKWAuXG4gICAgICAvLyBUaGlzIHRha2VzIG92ZXIgdGhlIGBbc3R5bGVdYCBiaW5kaW5nLiAoU2FtZSBmb3IgYFtjbGFzc11gKVxuICAgICAgc2V0RGlyZWN0aXZlSW5wdXRzV2hpY2hTaGFkb3dzU3R5bGluZyh0VmlldywgdE5vZGUsIGxWaWV3LCB2YWx1ZSwgaXNDbGFzc0Jhc2VkKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdXBkYXRlU3R5bGluZ01hcChcbiAgICAgICAgICB0VmlldywgdE5vZGUsIGxWaWV3LCBsVmlld1tSRU5ERVJFUl0sIGxWaWV3W2JpbmRpbmdJbmRleCArIDFdLFxuICAgICAgICAgIGxWaWV3W2JpbmRpbmdJbmRleCArIDFdID0gdG9TdHlsaW5nS2V5VmFsdWVBcnJheShrZXlWYWx1ZUFycmF5U2V0LCBzdHJpbmdQYXJzZXIsIHZhbHVlKSxcbiAgICAgICAgICBpc0NsYXNzQmFzZWQsIGJpbmRpbmdJbmRleCk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogRGV0ZXJtaW5lcyB3aGVuIHRoZSBiaW5kaW5nIGlzIGluIGBob3N0QmluZGluZ3NgIHNlY3Rpb25cbiAqXG4gKiBAcGFyYW0gdFZpZXcgQ3VycmVudCBgVFZpZXdgXG4gKiBAcGFyYW0gYmluZGluZ0luZGV4IGluZGV4IG9mIGJpbmRpbmcgd2hpY2ggd2Ugd291bGQgbGlrZSBpZiBpdCBpcyBpbiBgaG9zdEJpbmRpbmdzYFxuICovXG5mdW5jdGlvbiBpc0luSG9zdEJpbmRpbmdzKHRWaWV3OiBUVmlldywgYmluZGluZ0luZGV4OiBudW1iZXIpOiBib29sZWFuIHtcbiAgLy8gQWxsIGhvc3QgYmluZGluZ3MgYXJlIHBsYWNlZCBhZnRlciB0aGUgZXhwYW5kbyBzZWN0aW9uLlxuICByZXR1cm4gYmluZGluZ0luZGV4ID49IHRWaWV3LmV4cGFuZG9TdGFydEluZGV4O1xufVxuXG4vKipcbiAqIENvbGxlY3RzIHRoZSBuZWNlc3NhcnkgaW5mb3JtYXRpb24gdG8gaW5zZXJ0IHRoZSBiaW5kaW5nIGludG8gYSBsaW5rZWQgbGlzdCBvZiBzdHlsZSBiaW5kaW5nc1xuICogdXNpbmcgYGluc2VydFRTdHlsaW5nQmluZGluZ2AuXG4gKlxuICogQHBhcmFtIHRWaWV3IGBUVmlld2Agd2hlcmUgdGhlIGJpbmRpbmcgbGlua2VkIGxpc3Qgd2lsbCBiZSBzdG9yZWQuXG4gKiBAcGFyYW0gdFN0eWxpbmdLZXkgUHJvcGVydHkva2V5IG9mIHRoZSBiaW5kaW5nLlxuICogQHBhcmFtIGJpbmRpbmdJbmRleCBJbmRleCBvZiBiaW5kaW5nIGFzc29jaWF0ZWQgd2l0aCB0aGUgYHByb3BgXG4gKiBAcGFyYW0gaXNDbGFzc0Jhc2VkIGB0cnVlYCBpZiBgY2xhc3NgIGNoYW5nZSAoYGZhbHNlYCBpZiBgc3R5bGVgKVxuICovXG5mdW5jdGlvbiBzdHlsaW5nRmlyc3RVcGRhdGVQYXNzKFxuICAgIHRWaWV3OiBUVmlldywgdFN0eWxpbmdLZXk6IFRTdHlsaW5nS2V5LCBiaW5kaW5nSW5kZXg6IG51bWJlciwgaXNDbGFzc0Jhc2VkOiBib29sZWFuKTogdm9pZCB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRGaXJzdFVwZGF0ZVBhc3ModFZpZXcpO1xuICBjb25zdCB0RGF0YSA9IHRWaWV3LmRhdGE7XG4gIGlmICh0RGF0YVtiaW5kaW5nSW5kZXggKyAxXSA9PT0gbnVsbCkge1xuICAgIC8vIFRoZSBhYm92ZSBjaGVjayBpcyBuZWNlc3NhcnkgYmVjYXVzZSB3ZSBkb24ndCBjbGVhciBmaXJzdCB1cGRhdGUgcGFzcyB1bnRpbCBmaXJzdCBzdWNjZXNzZnVsXG4gICAgLy8gKG5vIGV4Y2VwdGlvbikgdGVtcGxhdGUgZXhlY3V0aW9uLiBUaGlzIHByZXZlbnRzIHRoZSBzdHlsaW5nIGluc3RydWN0aW9uIGZyb20gZG91YmxlIGFkZGluZ1xuICAgIC8vIGl0c2VsZiB0byB0aGUgbGlzdC5cbiAgICAvLyBgZ2V0U2VsZWN0ZWRJbmRleCgpYCBzaG91bGQgYmUgaGVyZSAocmF0aGVyIHRoYW4gaW4gaW5zdHJ1Y3Rpb24pIHNvIHRoYXQgaXQgaXMgZ3VhcmRlZCBieSB0aGVcbiAgICAvLyBpZiBzbyBhcyBub3QgdG8gcmVhZCB1bm5lY2Vzc2FyaWx5LlxuICAgIGNvbnN0IHROb2RlID0gdERhdGFbZ2V0U2VsZWN0ZWRJbmRleCgpICsgSEVBREVSX09GRlNFVF0gYXMgVE5vZGU7XG4gICAgY29uc3QgaXNIb3N0QmluZGluZ3MgPSBpc0luSG9zdEJpbmRpbmdzKHRWaWV3LCBiaW5kaW5nSW5kZXgpO1xuICAgIGlmIChoYXNTdHlsaW5nSW5wdXRTaGFkb3codE5vZGUsIGlzQ2xhc3NCYXNlZCkgJiYgdFN0eWxpbmdLZXkgPT09IG51bGwgJiYgIWlzSG9zdEJpbmRpbmdzKSB7XG4gICAgICAvLyBgdFN0eWxpbmdLZXkgPT09IG51bGxgIGltcGxpZXMgdGhhdCB3ZSBhcmUgZWl0aGVyIGBbc3R5bGVdYCBvciBgW2NsYXNzXWAgYmluZGluZy5cbiAgICAgIC8vIElmIHRoZXJlIGlzIGEgZGlyZWN0aXZlIHdoaWNoIHVzZXMgYEBJbnB1dCgnc3R5bGUnKWAgb3IgYEBJbnB1dCgnY2xhc3MnKWAgdGhhblxuICAgICAgLy8gd2UgbmVlZCB0byBuZXV0cmFsaXplIHRoaXMgYmluZGluZyBzaW5jZSB0aGF0IGRpcmVjdGl2ZSBpcyBzaGFkb3dpbmcgaXQuXG4gICAgICAvLyBXZSB0dXJuIHRoaXMgaW50byBhIG5vb3AgYnkgc2V0dGluZyB0aGUga2V5IHRvIGBmYWxzZWBcbiAgICAgIHRTdHlsaW5nS2V5ID0gZmFsc2U7XG4gICAgfVxuICAgIHRTdHlsaW5nS2V5ID0gd3JhcEluU3RhdGljU3R5bGluZ0tleSh0RGF0YSwgdE5vZGUsIHRTdHlsaW5nS2V5LCBpc0NsYXNzQmFzZWQpO1xuICAgIGluc2VydFRTdHlsaW5nQmluZGluZyh0RGF0YSwgdE5vZGUsIHRTdHlsaW5nS2V5LCBiaW5kaW5nSW5kZXgsIGlzSG9zdEJpbmRpbmdzLCBpc0NsYXNzQmFzZWQpO1xuICB9XG59XG5cbi8qKlxuICogQWRkcyBzdGF0aWMgc3R5bGluZyBpbmZvcm1hdGlvbiB0byB0aGUgYmluZGluZyBpZiBhcHBsaWNhYmxlLlxuICpcbiAqIFRoZSBsaW5rZWQgbGlzdCBvZiBzdHlsZXMgbm90IG9ubHkgc3RvcmVzIHRoZSBsaXN0IGFuZCBrZXlzLCBidXQgYWxzbyBzdG9yZXMgc3RhdGljIHN0eWxpbmdcbiAqIGluZm9ybWF0aW9uIG9uIHNvbWUgb2YgdGhlIGtleXMuIFRoaXMgZnVuY3Rpb24gZGV0ZXJtaW5lcyBpZiB0aGUga2V5IHNob3VsZCBjb250YWluIHRoZSBzdHlsaW5nXG4gKiBpbmZvcm1hdGlvbiBhbmQgY29tcHV0ZXMgaXQuXG4gKlxuICogU2VlIGBUU3R5bGluZ1N0YXRpY2AgZm9yIG1vcmUgZGV0YWlscy5cbiAqXG4gKiBAcGFyYW0gdERhdGEgYFREYXRhYCB3aGVyZSB0aGUgbGlua2VkIGxpc3QgaXMgc3RvcmVkLlxuICogQHBhcmFtIHROb2RlIGBUTm9kZWAgZm9yIHdoaWNoIHRoZSBzdHlsaW5nIGlzIGJlaW5nIGNvbXB1dGVkLlxuICogQHBhcmFtIHN0eWxpbmdLZXkgYFRTdHlsaW5nS2V5UHJpbWl0aXZlYCB3aGljaCBtYXkgbmVlZCB0byBiZSB3cmFwcGVkIGludG8gYFRTdHlsaW5nS2V5YFxuICogQHBhcmFtIGlzQ2xhc3NCYXNlZCBgdHJ1ZWAgaWYgYGNsYXNzYCAoYGZhbHNlYCBpZiBgc3R5bGVgKVxuICovXG5leHBvcnQgZnVuY3Rpb24gd3JhcEluU3RhdGljU3R5bGluZ0tleShcbiAgICB0RGF0YTogVERhdGEsIHROb2RlOiBUTm9kZSwgc3R5bGluZ0tleTogVFN0eWxpbmdLZXksIGlzQ2xhc3NCYXNlZDogYm9vbGVhbik6IFRTdHlsaW5nS2V5IHtcbiAgY29uc3QgaG9zdERpcmVjdGl2ZURlZiA9IGdldEN1cnJlbnREaXJlY3RpdmVEZWYodERhdGEpO1xuICBsZXQgcmVzaWR1YWwgPSBpc0NsYXNzQmFzZWQgPyB0Tm9kZS5yZXNpZHVhbENsYXNzZXMgOiB0Tm9kZS5yZXNpZHVhbFN0eWxlcztcbiAgaWYgKGhvc3REaXJlY3RpdmVEZWYgPT09IG51bGwpIHtcbiAgICAvLyBXZSBhcmUgaW4gdGVtcGxhdGUgbm9kZS5cbiAgICAvLyBJZiB0ZW1wbGF0ZSBub2RlIGFscmVhZHkgaGFkIHN0eWxpbmcgaW5zdHJ1Y3Rpb24gdGhlbiBpdCBoYXMgYWxyZWFkeSBjb2xsZWN0ZWQgdGhlIHN0YXRpY1xuICAgIC8vIHN0eWxpbmcgYW5kIHRoZXJlIGlzIG5vIG5lZWQgdG8gY29sbGVjdCB0aGVtIGFnYWluLiBXZSBrbm93IHRoYXQgd2UgYXJlIHRoZSBmaXJzdCBzdHlsaW5nXG4gICAgLy8gaW5zdHJ1Y3Rpb24gYmVjYXVzZSB0aGUgYFROb2RlLipCaW5kaW5nc2AgcG9pbnRzIHRvIDAgKG5vdGhpbmcgaGFzIGJlZW4gaW5zZXJ0ZWQgeWV0KS5cbiAgICBjb25zdCBpc0ZpcnN0U3R5bGluZ0luc3RydWN0aW9uSW5UZW1wbGF0ZSA9XG4gICAgICAgIChpc0NsYXNzQmFzZWQgPyB0Tm9kZS5jbGFzc0JpbmRpbmdzIDogdE5vZGUuc3R5bGVCaW5kaW5ncykgYXMgYW55IGFzIG51bWJlciA9PT0gMDtcbiAgICBpZiAoaXNGaXJzdFN0eWxpbmdJbnN0cnVjdGlvbkluVGVtcGxhdGUpIHtcbiAgICAgIC8vIEl0IHdvdWxkIGJlIG5pY2UgdG8gYmUgYWJsZSB0byBnZXQgdGhlIHN0YXRpY3MgZnJvbSBgbWVyZ2VBdHRyc2AsIGhvd2V2ZXIsIGF0IHRoaXMgcG9pbnRcbiAgICAgIC8vIHRoZXkgYXJlIGFscmVhZHkgbWVyZ2VkIGFuZCBpdCB3b3VsZCBub3QgYmUgcG9zc2libGUgdG8gZmlndXJlIHdoaWNoIHByb3BlcnR5IGJlbG9uZ3Mgd2hlcmVcbiAgICAgIC8vIGluIHRoZSBwcmlvcml0eS5cbiAgICAgIHN0eWxpbmdLZXkgPSBjb2xsZWN0U3R5bGluZ0Zyb21EaXJlY3RpdmVzKG51bGwsIHREYXRhLCB0Tm9kZSwgc3R5bGluZ0tleSwgaXNDbGFzc0Jhc2VkKTtcbiAgICAgIHN0eWxpbmdLZXkgPSBjb2xsZWN0U3R5bGluZ0Zyb21UQXR0cnMoc3R5bGluZ0tleSwgdE5vZGUuYXR0cnMsIGlzQ2xhc3NCYXNlZCk7XG4gICAgICAvLyBXZSBrbm93IHRoYXQgaWYgd2UgaGF2ZSBzdHlsaW5nIGJpbmRpbmcgaW4gdGVtcGxhdGUgd2UgY2FuJ3QgaGF2ZSByZXNpZHVhbC5cbiAgICAgIHJlc2lkdWFsID0gbnVsbDtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgLy8gV2UgYXJlIGluIGhvc3QgYmluZGluZyBub2RlIGFuZCB0aGVyZSB3YXMgbm8gYmluZGluZyBpbnN0cnVjdGlvbiBpbiB0ZW1wbGF0ZSBub2RlLlxuICAgIC8vIFRoaXMgbWVhbnMgdGhhdCB3ZSBuZWVkIHRvIGNvbXB1dGUgdGhlIHJlc2lkdWFsLlxuICAgIGNvbnN0IGRpcmVjdGl2ZVN0eWxpbmdMYXN0ID0gdE5vZGUuZGlyZWN0aXZlU3R5bGluZ0xhc3Q7XG4gICAgY29uc3QgaXNGaXJzdFN0eWxpbmdJbnN0cnVjdGlvbkluSG9zdEJpbmRpbmcgPVxuICAgICAgICBkaXJlY3RpdmVTdHlsaW5nTGFzdCA9PT0gLTEgfHwgdERhdGFbZGlyZWN0aXZlU3R5bGluZ0xhc3RdICE9PSBob3N0RGlyZWN0aXZlRGVmO1xuICAgIGlmIChpc0ZpcnN0U3R5bGluZ0luc3RydWN0aW9uSW5Ib3N0QmluZGluZykge1xuICAgICAgc3R5bGluZ0tleSA9XG4gICAgICAgICAgY29sbGVjdFN0eWxpbmdGcm9tRGlyZWN0aXZlcyhob3N0RGlyZWN0aXZlRGVmLCB0RGF0YSwgdE5vZGUsIHN0eWxpbmdLZXksIGlzQ2xhc3NCYXNlZCk7XG4gICAgICBpZiAocmVzaWR1YWwgPT09IG51bGwpIHtcbiAgICAgICAgLy8gLSBJZiBgbnVsbGAgdGhhbiBlaXRoZXI6XG4gICAgICAgIC8vICAgIC0gVGVtcGxhdGUgc3R5bGluZyBpbnN0cnVjdGlvbiBhbHJlYWR5IHJhbiBhbmQgaXQgaGFzIGNvbnN1bWVkIHRoZSBzdGF0aWNcbiAgICAgICAgLy8gICAgICBzdHlsaW5nIGludG8gaXRzIGBUU3R5bGluZ0tleWAgYW5kIHNvIHRoZXJlIGlzIG5vIG5lZWQgdG8gdXBkYXRlIHJlc2lkdWFsLiBJbnN0ZWFkXG4gICAgICAgIC8vICAgICAgd2UgbmVlZCB0byB1cGRhdGUgdGhlIGBUU3R5bGluZ0tleWAgYXNzb2NpYXRlZCB3aXRoIHRoZSBmaXJzdCB0ZW1wbGF0ZSBub2RlXG4gICAgICAgIC8vICAgICAgaW5zdHJ1Y3Rpb24uIE9SXG4gICAgICAgIC8vICAgIC0gU29tZSBvdGhlciBzdHlsaW5nIGluc3RydWN0aW9uIHJhbiBhbmQgZGV0ZXJtaW5lZCB0aGF0IHRoZXJlIGFyZSBubyByZXNpZHVhbHNcbiAgICAgICAgbGV0IHRlbXBsYXRlU3R5bGluZ0tleSA9IGdldFRlbXBsYXRlSGVhZFRTdHlsaW5nS2V5KHREYXRhLCB0Tm9kZSwgaXNDbGFzc0Jhc2VkKTtcbiAgICAgICAgaWYgKHRlbXBsYXRlU3R5bGluZ0tleSAhPT0gdW5kZWZpbmVkICYmIEFycmF5LmlzQXJyYXkodGVtcGxhdGVTdHlsaW5nS2V5KSkge1xuICAgICAgICAgIC8vIE9ubHkgcmVjb21wdXRlIGlmIGB0ZW1wbGF0ZVN0eWxpbmdLZXlgIGhhZCBzdGF0aWMgdmFsdWVzLiAoSWYgbm8gc3RhdGljIHZhbHVlIGZvdW5kXG4gICAgICAgICAgLy8gdGhlbiB0aGVyZSBpcyBub3RoaW5nIHRvIGRvIHNpbmNlIHRoaXMgb3BlcmF0aW9uIGNhbiBvbmx5IHByb2R1Y2UgbGVzcyBzdGF0aWMga2V5cywgbm90XG4gICAgICAgICAgLy8gbW9yZS4pXG4gICAgICAgICAgdGVtcGxhdGVTdHlsaW5nS2V5ID0gY29sbGVjdFN0eWxpbmdGcm9tRGlyZWN0aXZlcyhcbiAgICAgICAgICAgICAgbnVsbCwgdERhdGEsIHROb2RlLCB0ZW1wbGF0ZVN0eWxpbmdLZXlbMV0gLyogdW53cmFwIHByZXZpb3VzIHN0YXRpY3MgKi8sXG4gICAgICAgICAgICAgIGlzQ2xhc3NCYXNlZCk7XG4gICAgICAgICAgdGVtcGxhdGVTdHlsaW5nS2V5ID1cbiAgICAgICAgICAgICAgY29sbGVjdFN0eWxpbmdGcm9tVEF0dHJzKHRlbXBsYXRlU3R5bGluZ0tleSwgdE5vZGUuYXR0cnMsIGlzQ2xhc3NCYXNlZCk7XG4gICAgICAgICAgc2V0VGVtcGxhdGVIZWFkVFN0eWxpbmdLZXkodERhdGEsIHROb2RlLCBpc0NsYXNzQmFzZWQsIHRlbXBsYXRlU3R5bGluZ0tleSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIFdlIG9ubHkgbmVlZCB0byByZWNvbXB1dGUgcmVzaWR1YWwgaWYgaXQgaXMgbm90IGBudWxsYC5cbiAgICAgICAgLy8gLSBJZiBleGlzdGluZyByZXNpZHVhbCAoaW1wbGllcyB0aGVyZSB3YXMgbm8gdGVtcGxhdGUgc3R5bGluZykuIFRoaXMgbWVhbnMgdGhhdCBzb21lIG9mXG4gICAgICAgIC8vICAgdGhlIHN0YXRpY3MgbWF5IGhhdmUgbW92ZWQgZnJvbSB0aGUgcmVzaWR1YWwgdG8gdGhlIGBzdHlsaW5nS2V5YCBhbmQgc28gd2UgaGF2ZSB0b1xuICAgICAgICAvLyAgIHJlY29tcHV0ZS5cbiAgICAgICAgLy8gLSBJZiBgdW5kZWZpbmVkYCB0aGlzIGlzIHRoZSBmaXJzdCB0aW1lIHdlIGFyZSBydW5uaW5nLlxuICAgICAgICByZXNpZHVhbCA9IGNvbGxlY3RSZXNpZHVhbCh0RGF0YSwgdE5vZGUsIGlzQ2xhc3NCYXNlZCk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIGlmIChyZXNpZHVhbCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgaXNDbGFzc0Jhc2VkID8gKHROb2RlLnJlc2lkdWFsQ2xhc3NlcyA9IHJlc2lkdWFsKSA6ICh0Tm9kZS5yZXNpZHVhbFN0eWxlcyA9IHJlc2lkdWFsKTtcbiAgfVxuICByZXR1cm4gc3R5bGluZ0tleTtcbn1cblxuLyoqXG4gKiBSZXRyaWV2ZSB0aGUgYFRTdHlsaW5nS2V5YCBmb3IgdGhlIHRlbXBsYXRlIHN0eWxpbmcgaW5zdHJ1Y3Rpb24uXG4gKlxuICogVGhpcyBpcyBuZWVkZWQgc2luY2UgYGhvc3RCaW5kaW5nYCBzdHlsaW5nIGluc3RydWN0aW9ucyBhcmUgaW5zZXJ0ZWQgYWZ0ZXIgdGhlIHRlbXBsYXRlXG4gKiBpbnN0cnVjdGlvbi4gV2hpbGUgdGhlIHRlbXBsYXRlIGluc3RydWN0aW9uIG5lZWRzIHRvIHVwZGF0ZSB0aGUgcmVzaWR1YWwgaW4gYFROb2RlYCB0aGVcbiAqIGBob3N0QmluZGluZ2AgaW5zdHJ1Y3Rpb25zIG5lZWQgdG8gdXBkYXRlIHRoZSBgVFN0eWxpbmdLZXlgIG9mIHRoZSB0ZW1wbGF0ZSBpbnN0cnVjdGlvbiBiZWNhdXNlXG4gKiB0aGUgdGVtcGxhdGUgaW5zdHJ1Y3Rpb24gaXMgZG93bnN0cmVhbSBmcm9tIHRoZSBgaG9zdEJpbmRpbmdzYCBpbnN0cnVjdGlvbnMuXG4gKlxuICogQHBhcmFtIHREYXRhIGBURGF0YWAgd2hlcmUgdGhlIGxpbmtlZCBsaXN0IGlzIHN0b3JlZC5cbiAqIEBwYXJhbSB0Tm9kZSBgVE5vZGVgIGZvciB3aGljaCB0aGUgc3R5bGluZyBpcyBiZWluZyBjb21wdXRlZC5cbiAqIEBwYXJhbSBpc0NsYXNzQmFzZWQgYHRydWVgIGlmIGBjbGFzc2AgKGBmYWxzZWAgaWYgYHN0eWxlYClcbiAqIEByZXR1cm4gYFRTdHlsaW5nS2V5YCBpZiBmb3VuZCBvciBgdW5kZWZpbmVkYCBpZiBub3QgZm91bmQuXG4gKi9cbmZ1bmN0aW9uIGdldFRlbXBsYXRlSGVhZFRTdHlsaW5nS2V5KHREYXRhOiBURGF0YSwgdE5vZGU6IFROb2RlLCBpc0NsYXNzQmFzZWQ6IGJvb2xlYW4pOiBUU3R5bGluZ0tleXxcbiAgICB1bmRlZmluZWQge1xuICBjb25zdCBiaW5kaW5ncyA9IGlzQ2xhc3NCYXNlZCA/IHROb2RlLmNsYXNzQmluZGluZ3MgOiB0Tm9kZS5zdHlsZUJpbmRpbmdzO1xuICBpZiAoZ2V0VFN0eWxpbmdSYW5nZU5leHQoYmluZGluZ3MpID09PSAwKSB7XG4gICAgLy8gVGhlcmUgZG9lcyBub3Qgc2VlbSB0byBiZSBhIHN0eWxpbmcgaW5zdHJ1Y3Rpb24gaW4gdGhlIGB0ZW1wbGF0ZWAuXG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxuICByZXR1cm4gdERhdGFbZ2V0VFN0eWxpbmdSYW5nZVByZXYoYmluZGluZ3MpXSBhcyBUU3R5bGluZ0tleTtcbn1cblxuLyoqXG4gKiBVcGRhdGUgdGhlIGBUU3R5bGluZ0tleWAgb2YgdGhlIGZpcnN0IHRlbXBsYXRlIGluc3RydWN0aW9uIGluIGBUTm9kZWAuXG4gKlxuICogTG9naWNhbGx5IGBob3N0QmluZGluZ3NgIHN0eWxpbmcgaW5zdHJ1Y3Rpb25zIGFyZSBvZiBsb3dlciBwcmlvcml0eSB0aGFuIHRoYXQgb2YgdGhlIHRlbXBsYXRlLlxuICogSG93ZXZlciwgdGhleSBleGVjdXRlIGFmdGVyIHRoZSB0ZW1wbGF0ZSBzdHlsaW5nIGluc3RydWN0aW9ucy4gVGhpcyBtZWFucyB0aGF0IHRoZXkgZ2V0IGluc2VydGVkXG4gKiBpbiBmcm9udCBvZiB0aGUgdGVtcGxhdGUgc3R5bGluZyBpbnN0cnVjdGlvbnMuXG4gKlxuICogSWYgd2UgaGF2ZSBhIHRlbXBsYXRlIHN0eWxpbmcgaW5zdHJ1Y3Rpb24gYW5kIGEgbmV3IGBob3N0QmluZGluZ3NgIHN0eWxpbmcgaW5zdHJ1Y3Rpb24gaXNcbiAqIGV4ZWN1dGVkIGl0IG1lYW5zIHRoYXQgaXQgbWF5IG5lZWQgdG8gc3RlYWwgc3RhdGljIGZpZWxkcyBmcm9tIHRoZSB0ZW1wbGF0ZSBpbnN0cnVjdGlvbi4gVGhpc1xuICogbWV0aG9kIGFsbG93cyB1cyB0byB1cGRhdGUgdGhlIGZpcnN0IHRlbXBsYXRlIGluc3RydWN0aW9uIGBUU3R5bGluZ0tleWAgd2l0aCBhIG5ldyB2YWx1ZS5cbiAqXG4gKiBBc3N1bWU6XG4gKiBgYGBcbiAqIDxkaXYgbXktZGlyIHN0eWxlPVwiY29sb3I6IHJlZFwiIFtzdHlsZS5jb2xvcl09XCJ0bXBsRXhwXCI+PC9kaXY+XG4gKlxuICogQERpcmVjdGl2ZSh7XG4gKiAgIGhvc3Q6IHtcbiAqICAgICAnc3R5bGUnOiAnd2lkdGg6IDEwMHB4JyxcbiAqICAgICAnW3N0eWxlLmNvbG9yXSc6ICdkaXJFeHAnLFxuICogICB9XG4gKiB9KVxuICogY2xhc3MgTXlEaXIge31cbiAqIGBgYFxuICpcbiAqIHdoZW4gYFtzdHlsZS5jb2xvcl09XCJ0bXBsRXhwXCJgIGV4ZWN1dGVzIGl0IGNyZWF0ZXMgdGhpcyBkYXRhIHN0cnVjdHVyZS5cbiAqIGBgYFxuICogIFsnJywgJ2NvbG9yJywgJ2NvbG9yJywgJ3JlZCcsICd3aWR0aCcsICcxMDBweCddLFxuICogYGBgXG4gKlxuICogVGhlIHJlYXNvbiBmb3IgdGhpcyBpcyB0aGF0IHRoZSB0ZW1wbGF0ZSBpbnN0cnVjdGlvbiBkb2VzIG5vdCBrbm93IGlmIHRoZXJlIGFyZSBzdHlsaW5nXG4gKiBpbnN0cnVjdGlvbnMgYW5kIG11c3QgYXNzdW1lIHRoYXQgdGhlcmUgYXJlIG5vbmUgYW5kIG11c3QgY29sbGVjdCBhbGwgb2YgdGhlIHN0YXRpYyBzdHlsaW5nLlxuICogKGJvdGhcbiAqIGBjb2xvcicgYW5kICd3aWR0aGApXG4gKlxuICogV2hlbiBgJ1tzdHlsZS5jb2xvcl0nOiAnZGlyRXhwJyxgIGV4ZWN1dGVzIHdlIG5lZWQgdG8gaW5zZXJ0IGEgbmV3IGRhdGEgaW50byB0aGUgbGlua2VkIGxpc3QuXG4gKiBgYGBcbiAqICBbJycsICdjb2xvcicsICd3aWR0aCcsICcxMDBweCddLCAgLy8gbmV3bHkgaW5zZXJ0ZWRcbiAqICBbJycsICdjb2xvcicsICdjb2xvcicsICdyZWQnLCAnd2lkdGgnLCAnMTAwcHgnXSwgLy8gdGhpcyBpcyB3cm9uZ1xuICogYGBgXG4gKlxuICogTm90aWNlIHRoYXQgdGhlIHRlbXBsYXRlIHN0YXRpY3MgaXMgbm93IHdyb25nIGFzIGl0IGluY29ycmVjdGx5IGNvbnRhaW5zIGB3aWR0aGAgc28gd2UgbmVlZCB0b1xuICogdXBkYXRlIGl0IGxpa2Ugc286XG4gKiBgYGBcbiAqICBbJycsICdjb2xvcicsICd3aWR0aCcsICcxMDBweCddLFxuICogIFsnJywgJ2NvbG9yJywgJ2NvbG9yJywgJ3JlZCddLCAgICAvLyBVUERBVEVcbiAqIGBgYFxuICpcbiAqIEBwYXJhbSB0RGF0YSBgVERhdGFgIHdoZXJlIHRoZSBsaW5rZWQgbGlzdCBpcyBzdG9yZWQuXG4gKiBAcGFyYW0gdE5vZGUgYFROb2RlYCBmb3Igd2hpY2ggdGhlIHN0eWxpbmcgaXMgYmVpbmcgY29tcHV0ZWQuXG4gKiBAcGFyYW0gaXNDbGFzc0Jhc2VkIGB0cnVlYCBpZiBgY2xhc3NgIChgZmFsc2VgIGlmIGBzdHlsZWApXG4gKiBAcGFyYW0gdFN0eWxpbmdLZXkgTmV3IGBUU3R5bGluZ0tleWAgd2hpY2ggaXMgcmVwbGFjaW5nIHRoZSBvbGQgb25lLlxuICovXG5mdW5jdGlvbiBzZXRUZW1wbGF0ZUhlYWRUU3R5bGluZ0tleShcbiAgICB0RGF0YTogVERhdGEsIHROb2RlOiBUTm9kZSwgaXNDbGFzc0Jhc2VkOiBib29sZWFuLCB0U3R5bGluZ0tleTogVFN0eWxpbmdLZXkpOiB2b2lkIHtcbiAgY29uc3QgYmluZGluZ3MgPSBpc0NsYXNzQmFzZWQgPyB0Tm9kZS5jbGFzc0JpbmRpbmdzIDogdE5vZGUuc3R5bGVCaW5kaW5ncztcbiAgbmdEZXZNb2RlICYmXG4gICAgICBhc3NlcnROb3RFcXVhbChcbiAgICAgICAgICBnZXRUU3R5bGluZ1JhbmdlTmV4dChiaW5kaW5ncyksIDAsXG4gICAgICAgICAgJ0V4cGVjdGluZyB0byBoYXZlIGF0IGxlYXN0IG9uZSB0ZW1wbGF0ZSBzdHlsaW5nIGJpbmRpbmcuJyk7XG4gIHREYXRhW2dldFRTdHlsaW5nUmFuZ2VQcmV2KGJpbmRpbmdzKV0gPSB0U3R5bGluZ0tleTtcbn1cblxuLyoqXG4gKiBDb2xsZWN0IGFsbCBzdGF0aWMgdmFsdWVzIGFmdGVyIHRoZSBjdXJyZW50IGBUTm9kZS5kaXJlY3RpdmVTdHlsaW5nTGFzdGAgaW5kZXguXG4gKlxuICogQ29sbGVjdCB0aGUgcmVtYWluaW5nIHN0eWxpbmcgaW5mb3JtYXRpb24gd2hpY2ggaGFzIG5vdCB5ZXQgYmVlbiBjb2xsZWN0ZWQgYnkgYW4gZXhpc3RpbmdcbiAqIHN0eWxpbmcgaW5zdHJ1Y3Rpb24uXG4gKlxuICogQHBhcmFtIHREYXRhIGBURGF0YWAgd2hlcmUgdGhlIGBEaXJlY3RpdmVEZWZzYCBhcmUgc3RvcmVkLlxuICogQHBhcmFtIHROb2RlIGBUTm9kZWAgd2hpY2ggY29udGFpbnMgdGhlIGRpcmVjdGl2ZSByYW5nZS5cbiAqIEBwYXJhbSBpc0NsYXNzQmFzZWQgYHRydWVgIGlmIGBjbGFzc2AgKGBmYWxzZWAgaWYgYHN0eWxlYClcbiAqL1xuZnVuY3Rpb24gY29sbGVjdFJlc2lkdWFsKHREYXRhOiBURGF0YSwgdE5vZGU6IFROb2RlLCBpc0NsYXNzQmFzZWQ6IGJvb2xlYW4pOiBLZXlWYWx1ZUFycmF5PGFueT58XG4gICAgbnVsbCB7XG4gIGxldCByZXNpZHVhbDogS2V5VmFsdWVBcnJheTxhbnk+fG51bGx8dW5kZWZpbmVkID0gdW5kZWZpbmVkO1xuICBjb25zdCBkaXJlY3RpdmVFbmQgPSB0Tm9kZS5kaXJlY3RpdmVFbmQ7XG4gIG5nRGV2TW9kZSAmJlxuICAgICAgYXNzZXJ0Tm90RXF1YWwoXG4gICAgICAgICAgdE5vZGUuZGlyZWN0aXZlU3R5bGluZ0xhc3QsIC0xLFxuICAgICAgICAgICdCeSB0aGUgdGltZSB0aGlzIGZ1bmN0aW9uIGdldHMgY2FsbGVkIGF0IGxlYXN0IG9uZSBob3N0QmluZGluZ3Mtbm9kZSBzdHlsaW5nIGluc3RydWN0aW9uIG11c3QgaGF2ZSBleGVjdXRlZC4nKTtcbiAgLy8gV2UgYWRkIGAxICsgdE5vZGUuZGlyZWN0aXZlU3RhcnRgIGJlY2F1c2Ugd2UgbmVlZCB0byBza2lwIHRoZSBjdXJyZW50IGRpcmVjdGl2ZSAoYXMgd2UgYXJlXG4gIC8vIGNvbGxlY3RpbmcgdGhpbmdzIGFmdGVyIHRoZSBsYXN0IGBob3N0QmluZGluZ3NgIGRpcmVjdGl2ZSB3aGljaCBoYWQgYSBzdHlsaW5nIGluc3RydWN0aW9uLilcbiAgZm9yIChsZXQgaSA9IDEgKyB0Tm9kZS5kaXJlY3RpdmVTdHlsaW5nTGFzdDsgaSA8IGRpcmVjdGl2ZUVuZDsgaSsrKSB7XG4gICAgY29uc3QgYXR0cnMgPSAodERhdGFbaV0gYXMgRGlyZWN0aXZlRGVmPGFueT4pLmhvc3RBdHRycztcbiAgICByZXNpZHVhbCA9IGNvbGxlY3RTdHlsaW5nRnJvbVRBdHRycyhyZXNpZHVhbCwgYXR0cnMsIGlzQ2xhc3NCYXNlZCkgYXMgS2V5VmFsdWVBcnJheTxhbnk+fCBudWxsO1xuICB9XG4gIHJldHVybiBjb2xsZWN0U3R5bGluZ0Zyb21UQXR0cnMocmVzaWR1YWwsIHROb2RlLmF0dHJzLCBpc0NsYXNzQmFzZWQpIGFzIEtleVZhbHVlQXJyYXk8YW55PnwgbnVsbDtcbn1cblxuLyoqXG4gKiBDb2xsZWN0IHRoZSBzdGF0aWMgc3R5bGluZyBpbmZvcm1hdGlvbiB3aXRoIGxvd2VyIHByaW9yaXR5IHRoYW4gYGhvc3REaXJlY3RpdmVEZWZgLlxuICpcbiAqIChUaGlzIGlzIG9wcG9zaXRlIG9mIHJlc2lkdWFsIHN0eWxpbmcuKVxuICpcbiAqIEBwYXJhbSBob3N0RGlyZWN0aXZlRGVmIGBEaXJlY3RpdmVEZWZgIGZvciB3aGljaCB3ZSB3YW50IHRvIGNvbGxlY3QgbG93ZXIgcHJpb3JpdHkgc3RhdGljXG4gKiAgICAgICAgc3R5bGluZy4gKE9yIGBudWxsYCBpZiB0ZW1wbGF0ZSBzdHlsaW5nKVxuICogQHBhcmFtIHREYXRhIGBURGF0YWAgd2hlcmUgdGhlIGxpbmtlZCBsaXN0IGlzIHN0b3JlZC5cbiAqIEBwYXJhbSB0Tm9kZSBgVE5vZGVgIGZvciB3aGljaCB0aGUgc3R5bGluZyBpcyBiZWluZyBjb21wdXRlZC5cbiAqIEBwYXJhbSBzdHlsaW5nS2V5IEV4aXN0aW5nIGBUU3R5bGluZ0tleWAgdG8gdXBkYXRlIG9yIHdyYXAuXG4gKiBAcGFyYW0gaXNDbGFzc0Jhc2VkIGB0cnVlYCBpZiBgY2xhc3NgIChgZmFsc2VgIGlmIGBzdHlsZWApXG4gKi9cbmZ1bmN0aW9uIGNvbGxlY3RTdHlsaW5nRnJvbURpcmVjdGl2ZXMoXG4gICAgaG9zdERpcmVjdGl2ZURlZjogRGlyZWN0aXZlRGVmPGFueT58bnVsbCwgdERhdGE6IFREYXRhLCB0Tm9kZTogVE5vZGUsIHN0eWxpbmdLZXk6IFRTdHlsaW5nS2V5LFxuICAgIGlzQ2xhc3NCYXNlZDogYm9vbGVhbik6IFRTdHlsaW5nS2V5IHtcbiAgLy8gV2UgbmVlZCB0byBsb29wIGJlY2F1c2UgdGhlcmUgY2FuIGJlIGRpcmVjdGl2ZXMgd2hpY2ggaGF2ZSBgaG9zdEF0dHJzYCBidXQgZG9uJ3QgaGF2ZVxuICAvLyBgaG9zdEJpbmRpbmdzYCBzbyB0aGlzIGxvb3AgY2F0Y2hlcyB1cCB0byB0aGUgY3VycmVudCBkaXJlY3RpdmUuLlxuICBsZXQgY3VycmVudERpcmVjdGl2ZTogRGlyZWN0aXZlRGVmPGFueT58bnVsbCA9IG51bGw7XG4gIGNvbnN0IGRpcmVjdGl2ZUVuZCA9IHROb2RlLmRpcmVjdGl2ZUVuZDtcbiAgbGV0IGRpcmVjdGl2ZVN0eWxpbmdMYXN0ID0gdE5vZGUuZGlyZWN0aXZlU3R5bGluZ0xhc3Q7XG4gIGlmIChkaXJlY3RpdmVTdHlsaW5nTGFzdCA9PT0gLTEpIHtcbiAgICBkaXJlY3RpdmVTdHlsaW5nTGFzdCA9IHROb2RlLmRpcmVjdGl2ZVN0YXJ0O1xuICB9IGVsc2Uge1xuICAgIGRpcmVjdGl2ZVN0eWxpbmdMYXN0Kys7XG4gIH1cbiAgd2hpbGUgKGRpcmVjdGl2ZVN0eWxpbmdMYXN0IDwgZGlyZWN0aXZlRW5kKSB7XG4gICAgY3VycmVudERpcmVjdGl2ZSA9IHREYXRhW2RpcmVjdGl2ZVN0eWxpbmdMYXN0XSBhcyBEaXJlY3RpdmVEZWY8YW55PjtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChjdXJyZW50RGlyZWN0aXZlLCAnZXhwZWN0ZWQgdG8gYmUgZGVmaW5lZCcpO1xuICAgIHN0eWxpbmdLZXkgPSBjb2xsZWN0U3R5bGluZ0Zyb21UQXR0cnMoc3R5bGluZ0tleSwgY3VycmVudERpcmVjdGl2ZS5ob3N0QXR0cnMsIGlzQ2xhc3NCYXNlZCk7XG4gICAgaWYgKGN1cnJlbnREaXJlY3RpdmUgPT09IGhvc3REaXJlY3RpdmVEZWYpIGJyZWFrO1xuICAgIGRpcmVjdGl2ZVN0eWxpbmdMYXN0Kys7XG4gIH1cbiAgaWYgKGhvc3REaXJlY3RpdmVEZWYgIT09IG51bGwpIHtcbiAgICAvLyB3ZSBvbmx5IGFkdmFuY2UgdGhlIHN0eWxpbmcgY3Vyc29yIGlmIHdlIGFyZSBjb2xsZWN0aW5nIGRhdGEgZnJvbSBob3N0IGJpbmRpbmdzLlxuICAgIC8vIFRlbXBsYXRlIGV4ZWN1dGVzIGJlZm9yZSBob3N0IGJpbmRpbmdzIGFuZCBzbyBpZiB3ZSB3b3VsZCB1cGRhdGUgdGhlIGluZGV4LFxuICAgIC8vIGhvc3QgYmluZGluZ3Mgd291bGQgbm90IGdldCB0aGVpciBzdGF0aWNzLlxuICAgIHROb2RlLmRpcmVjdGl2ZVN0eWxpbmdMYXN0ID0gZGlyZWN0aXZlU3R5bGluZ0xhc3Q7XG4gIH1cbiAgcmV0dXJuIHN0eWxpbmdLZXk7XG59XG5cbi8qKlxuICogQ29udmVydCBgVEF0dHJzYCBpbnRvIGBUU3R5bGluZ1N0YXRpY2AuXG4gKlxuICogQHBhcmFtIHN0eWxpbmdLZXkgZXhpc3RpbmcgYFRTdHlsaW5nS2V5YCB0byB1cGRhdGUgb3Igd3JhcC5cbiAqIEBwYXJhbSBhdHRycyBgVEF0dHJpYnV0ZXNgIHRvIHByb2Nlc3MuXG4gKiBAcGFyYW0gaXNDbGFzc0Jhc2VkIGB0cnVlYCBpZiBgY2xhc3NgIChgZmFsc2VgIGlmIGBzdHlsZWApXG4gKi9cbmZ1bmN0aW9uIGNvbGxlY3RTdHlsaW5nRnJvbVRBdHRycyhcbiAgICBzdHlsaW5nS2V5OiBUU3R5bGluZ0tleXx1bmRlZmluZWQsIGF0dHJzOiBUQXR0cmlidXRlc3xudWxsLFxuICAgIGlzQ2xhc3NCYXNlZDogYm9vbGVhbik6IFRTdHlsaW5nS2V5IHtcbiAgY29uc3QgZGVzaXJlZE1hcmtlciA9IGlzQ2xhc3NCYXNlZCA/IEF0dHJpYnV0ZU1hcmtlci5DbGFzc2VzIDogQXR0cmlidXRlTWFya2VyLlN0eWxlcztcbiAgbGV0IGN1cnJlbnRNYXJrZXIgPSBBdHRyaWJ1dGVNYXJrZXIuSW1wbGljaXRBdHRyaWJ1dGVzO1xuICBpZiAoYXR0cnMgIT09IG51bGwpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGF0dHJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBpdGVtID0gYXR0cnNbaV0gYXMgbnVtYmVyIHwgc3RyaW5nO1xuICAgICAgaWYgKHR5cGVvZiBpdGVtID09PSAnbnVtYmVyJykge1xuICAgICAgICBjdXJyZW50TWFya2VyID0gaXRlbTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChjdXJyZW50TWFya2VyID09PSBkZXNpcmVkTWFya2VyKSB7XG4gICAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KHN0eWxpbmdLZXkpKSB7XG4gICAgICAgICAgICBzdHlsaW5nS2V5ID0gc3R5bGluZ0tleSA9PT0gdW5kZWZpbmVkID8gW10gOiBbJycsIHN0eWxpbmdLZXldIGFzIGFueTtcbiAgICAgICAgICB9XG4gICAgICAgICAga2V5VmFsdWVBcnJheVNldChcbiAgICAgICAgICAgICAgc3R5bGluZ0tleSBhcyBLZXlWYWx1ZUFycmF5PGFueT4sIGl0ZW0sIGlzQ2xhc3NCYXNlZCA/IHRydWUgOiBhdHRyc1srK2ldKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gc3R5bGluZ0tleSA9PT0gdW5kZWZpbmVkID8gbnVsbCA6IHN0eWxpbmdLZXk7XG59XG5cbi8qKlxuICogQ29udmVydCB1c2VyIGlucHV0IHRvIGBLZXlWYWx1ZUFycmF5YC5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIHRha2VzIHVzZXIgaW5wdXQgd2hpY2ggY291bGQgYmUgYHN0cmluZ2AsIE9iamVjdCBsaXRlcmFsLCBvciBpdGVyYWJsZSBhbmQgY29udmVydHNcbiAqIGl0IGludG8gYSBjb25zaXN0ZW50IHJlcHJlc2VudGF0aW9uLiBUaGUgb3V0cHV0IG9mIHRoaXMgaXMgYEtleVZhbHVlQXJyYXlgICh3aGljaCBpcyBhbiBhcnJheVxuICogd2hlcmVcbiAqIGV2ZW4gaW5kZXhlcyBjb250YWluIGtleXMgYW5kIG9kZCBpbmRleGVzIGNvbnRhaW4gdmFsdWVzIGZvciB0aG9zZSBrZXlzKS5cbiAqXG4gKiBUaGUgYWR2YW50YWdlIG9mIGNvbnZlcnRpbmcgdG8gYEtleVZhbHVlQXJyYXlgIGlzIHRoYXQgd2UgY2FuIHBlcmZvcm0gZGlmZiBpbiBhbiBpbnB1dFxuICogaW5kZXBlbmRlbnRcbiAqIHdheS5cbiAqIChpZSB3ZSBjYW4gY29tcGFyZSBgZm9vIGJhcmAgdG8gYFsnYmFyJywgJ2JheiddIGFuZCBkZXRlcm1pbmUgYSBzZXQgb2YgY2hhbmdlcyB3aGljaCBuZWVkIHRvIGJlXG4gKiBhcHBsaWVkKVxuICpcbiAqIFRoZSBmYWN0IHRoYXQgYEtleVZhbHVlQXJyYXlgIGlzIHNvcnRlZCBpcyB2ZXJ5IGltcG9ydGFudCBiZWNhdXNlIGl0IGFsbG93cyB1cyB0byBjb21wdXRlIHRoZVxuICogZGlmZmVyZW5jZSBpbiBsaW5lYXIgZmFzaGlvbiB3aXRob3V0IHRoZSBuZWVkIHRvIGFsbG9jYXRlIGFueSBhZGRpdGlvbmFsIGRhdGEuXG4gKlxuICogRm9yIGV4YW1wbGUgaWYgd2Uga2VwdCB0aGlzIGFzIGEgYE1hcGAgd2Ugd291bGQgaGF2ZSB0byBpdGVyYXRlIG92ZXIgcHJldmlvdXMgYE1hcGAgdG8gZGV0ZXJtaW5lXG4gKiB3aGljaCB2YWx1ZXMgbmVlZCB0byBiZSBkZWxldGVkLCBvdmVyIHRoZSBuZXcgYE1hcGAgdG8gZGV0ZXJtaW5lIGFkZGl0aW9ucywgYW5kIHdlIHdvdWxkIGhhdmUgdG9cbiAqIGtlZXAgYWRkaXRpb25hbCBgTWFwYCB0byBrZWVwIHRyYWNrIG9mIGR1cGxpY2F0ZXMgb3IgaXRlbXMgd2hpY2ggaGF2ZSBub3QgeWV0IGJlZW4gdmlzaXRlZC5cbiAqXG4gKiBAcGFyYW0ga2V5VmFsdWVBcnJheVNldCAoU2VlIGBrZXlWYWx1ZUFycmF5U2V0YCBpbiBcInV0aWwvYXJyYXlfdXRpbHNcIikgR2V0cyBwYXNzZWQgaW4gYXMgYVxuICogZnVuY3Rpb24gc28gdGhhdFxuICogICAgICAgIGBzdHlsZWAgY2FuIHBhc3MgaW4gdmVyc2lvbiB3aGljaCBkb2VzIHNhbml0aXphdGlvbi4gVGhpcyBpcyBkb25lIGZvciB0cmVlIHNoYWtpbmdcbiAqICAgICAgICBwdXJwb3Nlcy5cbiAqIEBwYXJhbSBzdHJpbmdQYXJzZXIgVGhlIHBhcnNlciBpcyBwYXNzZWQgaW4gc28gdGhhdCBpdCB3aWxsIGJlIHRyZWUgc2hha2FibGUuIFNlZVxuICogICAgICAgIGBzdHlsZVN0cmluZ1BhcnNlcmAgYW5kIGBjbGFzc1N0cmluZ1BhcnNlcmBcbiAqIEBwYXJhbSB2YWx1ZSBUaGUgdmFsdWUgdG8gcGFyc2UvY29udmVydCB0byBgS2V5VmFsdWVBcnJheWBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHRvU3R5bGluZ0tleVZhbHVlQXJyYXkoXG4gICAga2V5VmFsdWVBcnJheVNldDogKGtleVZhbHVlQXJyYXk6IEtleVZhbHVlQXJyYXk8YW55Piwga2V5OiBzdHJpbmcsIHZhbHVlOiBhbnkpID0+IHZvaWQsXG4gICAgc3RyaW5nUGFyc2VyOiAoc3R5bGVLZXlWYWx1ZUFycmF5OiBLZXlWYWx1ZUFycmF5PGFueT4sIHRleHQ6IHN0cmluZykgPT4gdm9pZCxcbiAgICB2YWx1ZTogc3RyaW5nfHN0cmluZ1tdfHtba2V5OiBzdHJpbmddOiBhbnl9fFNhZmVWYWx1ZXxudWxsfHVuZGVmaW5lZCk6IEtleVZhbHVlQXJyYXk8YW55PiB7XG4gIGlmICh2YWx1ZSA9PSBudWxsIC8qfHwgdmFsdWUgPT09IHVuZGVmaW5lZCAqLyB8fCB2YWx1ZSA9PT0gJycpIHJldHVybiBFTVBUWV9BUlJBWSBhcyBhbnk7XG4gIGNvbnN0IHN0eWxlS2V5VmFsdWVBcnJheTogS2V5VmFsdWVBcnJheTxhbnk+ID0gW10gYXMgYW55O1xuICBjb25zdCB1bndyYXBwZWRWYWx1ZSA9IHVud3JhcFNhZmVWYWx1ZSh2YWx1ZSkgYXMgc3RyaW5nIHwgc3RyaW5nW10gfCB7W2tleTogc3RyaW5nXTogYW55fTtcbiAgaWYgKEFycmF5LmlzQXJyYXkodW53cmFwcGVkVmFsdWUpKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB1bndyYXBwZWRWYWx1ZS5sZW5ndGg7IGkrKykge1xuICAgICAga2V5VmFsdWVBcnJheVNldChzdHlsZUtleVZhbHVlQXJyYXksIHVud3JhcHBlZFZhbHVlW2ldLCB0cnVlKTtcbiAgICB9XG4gIH0gZWxzZSBpZiAodHlwZW9mIHVud3JhcHBlZFZhbHVlID09PSAnb2JqZWN0Jykge1xuICAgIGZvciAoY29uc3Qga2V5IGluIHVud3JhcHBlZFZhbHVlKSB7XG4gICAgICBpZiAodW53cmFwcGVkVmFsdWUuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICBrZXlWYWx1ZUFycmF5U2V0KHN0eWxlS2V5VmFsdWVBcnJheSwga2V5LCB1bndyYXBwZWRWYWx1ZVtrZXldKTtcbiAgICAgIH1cbiAgICB9XG4gIH0gZWxzZSBpZiAodHlwZW9mIHVud3JhcHBlZFZhbHVlID09PSAnc3RyaW5nJykge1xuICAgIHN0cmluZ1BhcnNlcihzdHlsZUtleVZhbHVlQXJyYXksIHVud3JhcHBlZFZhbHVlKTtcbiAgfSBlbHNlIHtcbiAgICBuZ0Rldk1vZGUgJiZcbiAgICAgICAgdGhyb3dFcnJvcignVW5zdXBwb3J0ZWQgc3R5bGluZyB0eXBlICcgKyB0eXBlb2YgdW53cmFwcGVkVmFsdWUgKyAnOiAnICsgdW53cmFwcGVkVmFsdWUpO1xuICB9XG4gIHJldHVybiBzdHlsZUtleVZhbHVlQXJyYXk7XG59XG5cbi8qKlxuICogU2V0IGEgYHZhbHVlYCBmb3IgYSBga2V5YCB0YWtpbmcgc3R5bGUgc2FuaXRpemF0aW9uIGludG8gYWNjb3VudC5cbiAqXG4gKiBTZWU6IGBrZXlWYWx1ZUFycmF5U2V0YCBmb3IgZGV0YWlsc1xuICpcbiAqIEBwYXJhbSBrZXlWYWx1ZUFycmF5IEtleVZhbHVlQXJyYXkgdG8gYWRkIHRvLlxuICogQHBhcmFtIGtleSBTdHlsZSBrZXkgdG8gYWRkLiAoVGhpcyBrZXkgd2lsbCBiZSBjaGVja2VkIGlmIGl0IG5lZWRzIHNhbml0aXphdGlvbilcbiAqIEBwYXJhbSB2YWx1ZSBUaGUgdmFsdWUgdG8gc2V0IChJZiBrZXkgbmVlZHMgc2FuaXRpemF0aW9uIGl0IHdpbGwgYmUgc2FuaXRpemVkKVxuICovXG5leHBvcnQgZnVuY3Rpb24gc3R5bGVLZXlWYWx1ZUFycmF5U2V0KGtleVZhbHVlQXJyYXk6IEtleVZhbHVlQXJyYXk8YW55Piwga2V5OiBzdHJpbmcsIHZhbHVlOiBhbnkpIHtcbiAgaWYgKHN0eWxlUHJvcE5lZWRzU2FuaXRpemF0aW9uKGtleSkpIHtcbiAgICB2YWx1ZSA9IMm1ybVzYW5pdGl6ZVN0eWxlKHZhbHVlKTtcbiAgfVxuICBrZXlWYWx1ZUFycmF5U2V0KGtleVZhbHVlQXJyYXksIGtleSwgdmFsdWUpO1xufVxuXG4vKipcbiAqIFVwZGF0ZSBtYXAgYmFzZWQgc3R5bGluZy5cbiAqXG4gKiBNYXAgYmFzZWQgc3R5bGluZyBjb3VsZCBiZSBhbnl0aGluZyB3aGljaCBjb250YWlucyBtb3JlIHRoYW4gb25lIGJpbmRpbmcuIEZvciBleGFtcGxlIGBzdHJpbmdgLFxuICogb3Igb2JqZWN0IGxpdGVyYWwuIERlYWxpbmcgd2l0aCBhbGwgb2YgdGhlc2UgdHlwZXMgd291bGQgY29tcGxpY2F0ZSB0aGUgbG9naWMgc29cbiAqIGluc3RlYWQgdGhpcyBmdW5jdGlvbiBleHBlY3RzIHRoYXQgdGhlIGNvbXBsZXggaW5wdXQgaXMgZmlyc3QgY29udmVydGVkIGludG8gbm9ybWFsaXplZFxuICogYEtleVZhbHVlQXJyYXlgLiBUaGUgYWR2YW50YWdlIG9mIG5vcm1hbGl6YXRpb24gaXMgdGhhdCB3ZSBnZXQgdGhlIHZhbHVlcyBzb3J0ZWQsIHdoaWNoIG1ha2VzIGl0XG4gKiB2ZXJ5IGNoZWFwIHRvIGNvbXB1dGUgZGVsdGFzIGJldHdlZW4gdGhlIHByZXZpb3VzIGFuZCBjdXJyZW50IHZhbHVlLlxuICpcbiAqIEBwYXJhbSB0VmlldyBBc3NvY2lhdGVkIGBUVmlldy5kYXRhYCBjb250YWlucyB0aGUgbGlua2VkIGxpc3Qgb2YgYmluZGluZyBwcmlvcml0aWVzLlxuICogQHBhcmFtIHROb2RlIGBUTm9kZWAgd2hlcmUgdGhlIGJpbmRpbmcgaXMgbG9jYXRlZC5cbiAqIEBwYXJhbSBsVmlldyBgTFZpZXdgIGNvbnRhaW5zIHRoZSB2YWx1ZXMgYXNzb2NpYXRlZCB3aXRoIG90aGVyIHN0eWxpbmcgYmluZGluZyBhdCB0aGlzIGBUTm9kZWAuXG4gKiBAcGFyYW0gcmVuZGVyZXIgUmVuZGVyZXIgdG8gdXNlIGlmIGFueSB1cGRhdGVzLlxuICogQHBhcmFtIG9sZEtleVZhbHVlQXJyYXkgUHJldmlvdXMgdmFsdWUgcmVwcmVzZW50ZWQgYXMgYEtleVZhbHVlQXJyYXlgXG4gKiBAcGFyYW0gbmV3S2V5VmFsdWVBcnJheSBDdXJyZW50IHZhbHVlIHJlcHJlc2VudGVkIGFzIGBLZXlWYWx1ZUFycmF5YFxuICogQHBhcmFtIGlzQ2xhc3NCYXNlZCBgdHJ1ZWAgaWYgYGNsYXNzYCAoYGZhbHNlYCBpZiBgc3R5bGVgKVxuICogQHBhcmFtIGJpbmRpbmdJbmRleCBCaW5kaW5nIGluZGV4IG9mIHRoZSBiaW5kaW5nLlxuICovXG5mdW5jdGlvbiB1cGRhdGVTdHlsaW5nTWFwKFxuICAgIHRWaWV3OiBUVmlldywgdE5vZGU6IFROb2RlLCBsVmlldzogTFZpZXcsIHJlbmRlcmVyOiBSZW5kZXJlcjMsXG4gICAgb2xkS2V5VmFsdWVBcnJheTogS2V5VmFsdWVBcnJheTxhbnk+LCBuZXdLZXlWYWx1ZUFycmF5OiBLZXlWYWx1ZUFycmF5PGFueT4sXG4gICAgaXNDbGFzc0Jhc2VkOiBib29sZWFuLCBiaW5kaW5nSW5kZXg6IG51bWJlcikge1xuICBpZiAob2xkS2V5VmFsdWVBcnJheSBhcyBLZXlWYWx1ZUFycmF5PGFueT58IE5PX0NIQU5HRSA9PT0gTk9fQ0hBTkdFKSB7XG4gICAgLy8gT24gZmlyc3QgZXhlY3V0aW9uIHRoZSBvbGRLZXlWYWx1ZUFycmF5IGlzIE5PX0NIQU5HRSA9PiB0cmVhdCBpdCBhcyBlbXB0eSBLZXlWYWx1ZUFycmF5LlxuICAgIG9sZEtleVZhbHVlQXJyYXkgPSBFTVBUWV9BUlJBWSBhcyBhbnk7XG4gIH1cbiAgbGV0IG9sZEluZGV4ID0gMDtcbiAgbGV0IG5ld0luZGV4ID0gMDtcbiAgbGV0IG9sZEtleTogc3RyaW5nfG51bGwgPSAwIDwgb2xkS2V5VmFsdWVBcnJheS5sZW5ndGggPyBvbGRLZXlWYWx1ZUFycmF5WzBdIDogbnVsbDtcbiAgbGV0IG5ld0tleTogc3RyaW5nfG51bGwgPSAwIDwgbmV3S2V5VmFsdWVBcnJheS5sZW5ndGggPyBuZXdLZXlWYWx1ZUFycmF5WzBdIDogbnVsbDtcbiAgd2hpbGUgKG9sZEtleSAhPT0gbnVsbCB8fCBuZXdLZXkgIT09IG51bGwpIHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0TGVzc1RoYW4ob2xkSW5kZXgsIDk5OSwgJ0FyZSB3ZSBzdHVjayBpbiBpbmZpbml0ZSBsb29wPycpO1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnRMZXNzVGhhbihuZXdJbmRleCwgOTk5LCAnQXJlIHdlIHN0dWNrIGluIGluZmluaXRlIGxvb3A/Jyk7XG4gICAgY29uc3Qgb2xkVmFsdWUgPVxuICAgICAgICBvbGRJbmRleCA8IG9sZEtleVZhbHVlQXJyYXkubGVuZ3RoID8gb2xkS2V5VmFsdWVBcnJheVtvbGRJbmRleCArIDFdIDogdW5kZWZpbmVkO1xuICAgIGNvbnN0IG5ld1ZhbHVlID1cbiAgICAgICAgbmV3SW5kZXggPCBuZXdLZXlWYWx1ZUFycmF5Lmxlbmd0aCA/IG5ld0tleVZhbHVlQXJyYXlbbmV3SW5kZXggKyAxXSA6IHVuZGVmaW5lZDtcbiAgICBsZXQgc2V0S2V5OiBzdHJpbmd8bnVsbCA9IG51bGw7XG4gICAgbGV0IHNldFZhbHVlOiBhbnkgPSB1bmRlZmluZWQ7XG4gICAgaWYgKG9sZEtleSA9PT0gbmV3S2V5KSB7XG4gICAgICAvLyBVUERBVEU6IEtleXMgYXJlIGVxdWFsID0+IG5ldyB2YWx1ZSBpcyBvdmVyd3JpdGluZyBvbGQgdmFsdWUuXG4gICAgICBvbGRJbmRleCArPSAyO1xuICAgICAgbmV3SW5kZXggKz0gMjtcbiAgICAgIGlmIChvbGRWYWx1ZSAhPT0gbmV3VmFsdWUpIHtcbiAgICAgICAgc2V0S2V5ID0gbmV3S2V5O1xuICAgICAgICBzZXRWYWx1ZSA9IG5ld1ZhbHVlO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAobmV3S2V5ID09PSBudWxsIHx8IG9sZEtleSAhPT0gbnVsbCAmJiBvbGRLZXkgPCBuZXdLZXkhKSB7XG4gICAgICAvLyBERUxFVEU6IG9sZEtleSBrZXkgaXMgbWlzc2luZyBvciB3ZSBkaWQgbm90IGZpbmQgdGhlIG9sZEtleSBpbiB0aGUgbmV3VmFsdWVcbiAgICAgIC8vIChiZWNhdXNlIHRoZSBrZXlWYWx1ZUFycmF5IGlzIHNvcnRlZCBhbmQgYG5ld0tleWAgaXMgZm91bmQgbGF0ZXIgYWxwaGFiZXRpY2FsbHkpLlxuICAgICAgLy8gYFwiYmFja2dyb3VuZFwiIDwgXCJjb2xvclwiYCBzbyB3ZSBuZWVkIHRvIGRlbGV0ZSBgXCJiYWNrZ3JvdW5kXCJgIGJlY2F1c2UgaXQgaXMgbm90IGZvdW5kIGluIHRoZVxuICAgICAgLy8gbmV3IGFycmF5LlxuICAgICAgb2xkSW5kZXggKz0gMjtcbiAgICAgIHNldEtleSA9IG9sZEtleTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gQ1JFQVRFOiBuZXdLZXkncyBpcyBlYXJsaWVyIGFscGhhYmV0aWNhbGx5IHRoYW4gb2xkS2V5J3MgKG9yIG5vIG9sZEtleSkgPT4gd2UgaGF2ZSBuZXcga2V5LlxuICAgICAgLy8gYFwiY29sb3JcIiA+IFwiYmFja2dyb3VuZFwiYCBzbyB3ZSBuZWVkIHRvIGFkZCBgY29sb3JgIGJlY2F1c2UgaXQgaXMgaW4gbmV3IGFycmF5IGJ1dCBub3QgaW5cbiAgICAgIC8vIG9sZCBhcnJheS5cbiAgICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKG5ld0tleSwgJ0V4cGVjdGluZyB0byBoYXZlIGEgdmFsaWQga2V5Jyk7XG4gICAgICBuZXdJbmRleCArPSAyO1xuICAgICAgc2V0S2V5ID0gbmV3S2V5O1xuICAgICAgc2V0VmFsdWUgPSBuZXdWYWx1ZTtcbiAgICB9XG4gICAgaWYgKHNldEtleSAhPT0gbnVsbCkge1xuICAgICAgdXBkYXRlU3R5bGluZyh0VmlldywgdE5vZGUsIGxWaWV3LCByZW5kZXJlciwgc2V0S2V5LCBzZXRWYWx1ZSwgaXNDbGFzc0Jhc2VkLCBiaW5kaW5nSW5kZXgpO1xuICAgIH1cbiAgICBvbGRLZXkgPSBvbGRJbmRleCA8IG9sZEtleVZhbHVlQXJyYXkubGVuZ3RoID8gb2xkS2V5VmFsdWVBcnJheVtvbGRJbmRleF0gOiBudWxsO1xuICAgIG5ld0tleSA9IG5ld0luZGV4IDwgbmV3S2V5VmFsdWVBcnJheS5sZW5ndGggPyBuZXdLZXlWYWx1ZUFycmF5W25ld0luZGV4XSA6IG51bGw7XG4gIH1cbn1cblxuLyoqXG4gKiBVcGRhdGUgYSBzaW1wbGUgKHByb3BlcnR5IG5hbWUpIHN0eWxpbmcuXG4gKlxuICogVGhpcyBmdW5jdGlvbiB0YWtlcyBgcHJvcGAgYW5kIHVwZGF0ZXMgdGhlIERPTSB0byB0aGF0IHZhbHVlLiBUaGUgZnVuY3Rpb24gdGFrZXMgdGhlIGJpbmRpbmdcbiAqIHZhbHVlIGFzIHdlbGwgYXMgYmluZGluZyBwcmlvcml0eSBpbnRvIGNvbnNpZGVyYXRpb24gdG8gZGV0ZXJtaW5lIHdoaWNoIHZhbHVlIHNob3VsZCBiZSB3cml0dGVuXG4gKiB0byBET00uIChGb3IgZXhhbXBsZSBpdCBtYXkgYmUgZGV0ZXJtaW5lZCB0aGF0IHRoZXJlIGlzIGEgaGlnaGVyIHByaW9yaXR5IG92ZXJ3cml0ZSB3aGljaCBibG9ja3NcbiAqIHRoZSBET00gd3JpdGUsIG9yIGlmIHRoZSB2YWx1ZSBnb2VzIHRvIGB1bmRlZmluZWRgIGEgbG93ZXIgcHJpb3JpdHkgb3ZlcndyaXRlIG1heSBiZSBjb25zdWx0ZWQuKVxuICpcbiAqIEBwYXJhbSB0VmlldyBBc3NvY2lhdGVkIGBUVmlldy5kYXRhYCBjb250YWlucyB0aGUgbGlua2VkIGxpc3Qgb2YgYmluZGluZyBwcmlvcml0aWVzLlxuICogQHBhcmFtIHROb2RlIGBUTm9kZWAgd2hlcmUgdGhlIGJpbmRpbmcgaXMgbG9jYXRlZC5cbiAqIEBwYXJhbSBsVmlldyBgTFZpZXdgIGNvbnRhaW5zIHRoZSB2YWx1ZXMgYXNzb2NpYXRlZCB3aXRoIG90aGVyIHN0eWxpbmcgYmluZGluZyBhdCB0aGlzIGBUTm9kZWAuXG4gKiBAcGFyYW0gcmVuZGVyZXIgUmVuZGVyZXIgdG8gdXNlIGlmIGFueSB1cGRhdGVzLlxuICogQHBhcmFtIHByb3AgRWl0aGVyIHN0eWxlIHByb3BlcnR5IG5hbWUgb3IgYSBjbGFzcyBuYW1lLlxuICogQHBhcmFtIHZhbHVlIEVpdGhlciBzdHlsZSB2YWx1ZSBmb3IgYHByb3BgIG9yIGB0cnVlYC9gZmFsc2VgIGlmIGBwcm9wYCBpcyBjbGFzcy5cbiAqIEBwYXJhbSBpc0NsYXNzQmFzZWQgYHRydWVgIGlmIGBjbGFzc2AgKGBmYWxzZWAgaWYgYHN0eWxlYClcbiAqIEBwYXJhbSBiaW5kaW5nSW5kZXggQmluZGluZyBpbmRleCBvZiB0aGUgYmluZGluZy5cbiAqL1xuZnVuY3Rpb24gdXBkYXRlU3R5bGluZyhcbiAgICB0VmlldzogVFZpZXcsIHROb2RlOiBUTm9kZSwgbFZpZXc6IExWaWV3LCByZW5kZXJlcjogUmVuZGVyZXIzLCBwcm9wOiBzdHJpbmcsXG4gICAgdmFsdWU6IHN0cmluZ3x1bmRlZmluZWR8bnVsbHxib29sZWFuLCBpc0NsYXNzQmFzZWQ6IGJvb2xlYW4sIGJpbmRpbmdJbmRleDogbnVtYmVyKSB7XG4gIGlmICh0Tm9kZS50eXBlICE9PSBUTm9kZVR5cGUuRWxlbWVudCkge1xuICAgIC8vIEl0IGlzIHBvc3NpYmxlIHRvIGhhdmUgc3R5bGluZyBvbiBub24tZWxlbWVudHMgKHN1Y2ggYXMgbmctY29udGFpbmVyKS5cbiAgICAvLyBUaGlzIGlzIHJhcmUsIGJ1dCBpdCBkb2VzIGhhcHBlbi4gSW4gc3VjaCBhIGNhc2UsIGp1c3QgaWdub3JlIHRoZSBiaW5kaW5nLlxuICAgIHJldHVybjtcbiAgfVxuICBjb25zdCB0RGF0YSA9IHRWaWV3LmRhdGE7XG4gIGNvbnN0IHRSYW5nZSA9IHREYXRhW2JpbmRpbmdJbmRleCArIDFdIGFzIFRTdHlsaW5nUmFuZ2U7XG4gIGNvbnN0IGhpZ2hlclByaW9yaXR5VmFsdWUgPSBnZXRUU3R5bGluZ1JhbmdlTmV4dER1cGxpY2F0ZSh0UmFuZ2UpID9cbiAgICAgIGZpbmRTdHlsaW5nVmFsdWUodERhdGEsIHROb2RlLCBsVmlldywgcHJvcCwgZ2V0VFN0eWxpbmdSYW5nZU5leHQodFJhbmdlKSwgaXNDbGFzc0Jhc2VkKSA6XG4gICAgICB1bmRlZmluZWQ7XG4gIGlmICghaXNTdHlsaW5nVmFsdWVQcmVzZW50KGhpZ2hlclByaW9yaXR5VmFsdWUpKSB7XG4gICAgLy8gV2UgZG9uJ3QgaGF2ZSBhIG5leHQgZHVwbGljYXRlLCBvciB3ZSBkaWQgbm90IGZpbmQgYSBkdXBsaWNhdGUgdmFsdWUuXG4gICAgaWYgKCFpc1N0eWxpbmdWYWx1ZVByZXNlbnQodmFsdWUpKSB7XG4gICAgICAvLyBXZSBzaG91bGQgZGVsZXRlIGN1cnJlbnQgdmFsdWUgb3IgcmVzdG9yZSB0byBsb3dlciBwcmlvcml0eSB2YWx1ZS5cbiAgICAgIGlmIChnZXRUU3R5bGluZ1JhbmdlUHJldkR1cGxpY2F0ZSh0UmFuZ2UpKSB7XG4gICAgICAgIC8vIFdlIGhhdmUgYSBwb3NzaWJsZSBwcmV2IGR1cGxpY2F0ZSwgbGV0J3MgcmV0cmlldmUgaXQuXG4gICAgICAgIHZhbHVlID0gZmluZFN0eWxpbmdWYWx1ZSh0RGF0YSwgbnVsbCwgbFZpZXcsIHByb3AsIGJpbmRpbmdJbmRleCwgaXNDbGFzc0Jhc2VkKTtcbiAgICAgIH1cbiAgICB9XG4gICAgY29uc3Qgck5vZGUgPSBnZXROYXRpdmVCeUluZGV4KGdldFNlbGVjdGVkSW5kZXgoKSwgbFZpZXcpIGFzIFJFbGVtZW50O1xuICAgIGFwcGx5U3R5bGluZyhyZW5kZXJlciwgaXNDbGFzc0Jhc2VkLCByTm9kZSwgcHJvcCwgdmFsdWUpO1xuICB9XG59XG5cbi8qKlxuICogU2VhcmNoIGZvciBzdHlsaW5nIHZhbHVlIHdpdGggaGlnaGVyIHByaW9yaXR5IHdoaWNoIGlzIG92ZXJ3cml0aW5nIGN1cnJlbnQgdmFsdWUsIG9yIGFcbiAqIHZhbHVlIG9mIGxvd2VyIHByaW9yaXR5IHRvIHdoaWNoIHdlIHNob3VsZCBmYWxsIGJhY2sgaWYgdGhlIHZhbHVlIGlzIGB1bmRlZmluZWRgLlxuICpcbiAqIFdoZW4gdmFsdWUgaXMgYmVpbmcgYXBwbGllZCBhdCBhIGxvY2F0aW9uLCByZWxhdGVkIHZhbHVlcyBuZWVkIHRvIGJlIGNvbnN1bHRlZC5cbiAqIC0gSWYgdGhlcmUgaXMgYSBoaWdoZXIgcHJpb3JpdHkgYmluZGluZywgd2Ugc2hvdWxkIGJlIHVzaW5nIHRoYXQgb25lIGluc3RlYWQuXG4gKiAgIEZvciBleGFtcGxlIGA8ZGl2ICBbc3R5bGVdPVwie2NvbG9yOmV4cDF9XCIgW3N0eWxlLmNvbG9yXT1cImV4cDJcIj5gIGNoYW5nZSB0byBgZXhwMWBcbiAqICAgcmVxdWlyZXMgdGhhdCB3ZSBjaGVjayBgZXhwMmAgdG8gc2VlIGlmIGl0IGlzIHNldCB0byB2YWx1ZSBvdGhlciB0aGFuIGB1bmRlZmluZWRgLlxuICogLSBJZiB0aGVyZSBpcyBhIGxvd2VyIHByaW9yaXR5IGJpbmRpbmcgYW5kIHdlIGFyZSBjaGFuZ2luZyB0byBgdW5kZWZpbmVkYFxuICogICBGb3IgZXhhbXBsZSBgPGRpdiAgW3N0eWxlXT1cIntjb2xvcjpleHAxfVwiIFtzdHlsZS5jb2xvcl09XCJleHAyXCI+YCBjaGFuZ2UgdG8gYGV4cDJgIHRvXG4gKiAgIGB1bmRlZmluZWRgIHJlcXVpcmVzIHRoYXQgd2UgY2hlY2sgYGV4cDFgIChhbmQgc3RhdGljIHZhbHVlcykgYW5kIHVzZSB0aGF0IGFzIG5ldyB2YWx1ZS5cbiAqXG4gKiBOT1RFOiBUaGUgc3R5bGluZyBzdG9yZXMgdHdvIHZhbHVlcy5cbiAqIDEuIFRoZSByYXcgdmFsdWUgd2hpY2ggY2FtZSBmcm9tIHRoZSBhcHBsaWNhdGlvbiBpcyBzdG9yZWQgYXQgYGluZGV4ICsgMGAgbG9jYXRpb24uIChUaGlzIHZhbHVlXG4gKiAgICBpcyB1c2VkIGZvciBkaXJ0eSBjaGVja2luZykuXG4gKiAyLiBUaGUgbm9ybWFsaXplZCB2YWx1ZSAoY29udmVydGVkIHRvIGBLZXlWYWx1ZUFycmF5YCBpZiBtYXAgYW5kIHNhbml0aXplZCkgaXMgc3RvcmVkIGF0IGBpbmRleCArXG4gKiAxYC5cbiAqICAgIFRoZSBhZHZhbnRhZ2Ugb2Ygc3RvcmluZyB0aGUgc2FuaXRpemVkIHZhbHVlIGlzIHRoYXQgb25jZSB0aGUgdmFsdWUgaXMgd3JpdHRlbiB3ZSBkb24ndCBuZWVkXG4gKiAgICB0byB3b3JyeSBhYm91dCBzYW5pdGl6aW5nIGl0IGxhdGVyIG9yIGtlZXBpbmcgdHJhY2sgb2YgdGhlIHNhbml0aXplci5cbiAqXG4gKiBAcGFyYW0gdERhdGEgYFREYXRhYCB1c2VkIGZvciB0cmF2ZXJzaW5nIHRoZSBwcmlvcml0eS5cbiAqIEBwYXJhbSB0Tm9kZSBgVE5vZGVgIHRvIHVzZSBmb3IgcmVzb2x2aW5nIHN0YXRpYyBzdHlsaW5nLiBBbHNvIGNvbnRyb2xzIHNlYXJjaCBkaXJlY3Rpb24uXG4gKiAgIC0gYFROb2RlYCBzZWFyY2ggbmV4dCBhbmQgcXVpdCBhcyBzb29uIGFzIGBpc1N0eWxpbmdWYWx1ZVByZXNlbnQodmFsdWUpYCBpcyB0cnVlLlxuICogICAgICBJZiBubyB2YWx1ZSBmb3VuZCBjb25zdWx0IGB0Tm9kZS5yZXNpZHVhbFN0eWxlYC9gdE5vZGUucmVzaWR1YWxDbGFzc2AgZm9yIGRlZmF1bHQgdmFsdWUuXG4gKiAgIC0gYG51bGxgIHNlYXJjaCBwcmV2IGFuZCBnbyBhbGwgdGhlIHdheSB0byBlbmQuIFJldHVybiBsYXN0IHZhbHVlIHdoZXJlXG4gKiAgICAgYGlzU3R5bGluZ1ZhbHVlUHJlc2VudCh2YWx1ZSlgIGlzIHRydWUuXG4gKiBAcGFyYW0gbFZpZXcgYExWaWV3YCB1c2VkIGZvciByZXRyaWV2aW5nIHRoZSBhY3R1YWwgdmFsdWVzLlxuICogQHBhcmFtIHByb3AgUHJvcGVydHkgd2hpY2ggd2UgYXJlIGludGVyZXN0ZWQgaW4uXG4gKiBAcGFyYW0gaW5kZXggU3RhcnRpbmcgaW5kZXggaW4gdGhlIGxpbmtlZCBsaXN0IG9mIHN0eWxpbmcgYmluZGluZ3Mgd2hlcmUgdGhlIHNlYXJjaCBzaG91bGQgc3RhcnQuXG4gKiBAcGFyYW0gaXNDbGFzc0Jhc2VkIGB0cnVlYCBpZiBgY2xhc3NgIChgZmFsc2VgIGlmIGBzdHlsZWApXG4gKi9cbmZ1bmN0aW9uIGZpbmRTdHlsaW5nVmFsdWUoXG4gICAgdERhdGE6IFREYXRhLCB0Tm9kZTogVE5vZGV8bnVsbCwgbFZpZXc6IExWaWV3LCBwcm9wOiBzdHJpbmcsIGluZGV4OiBudW1iZXIsXG4gICAgaXNDbGFzc0Jhc2VkOiBib29sZWFuKTogYW55IHtcbiAgLy8gYFROb2RlYCB0byB1c2UgZm9yIHJlc29sdmluZyBzdGF0aWMgc3R5bGluZy4gQWxzbyBjb250cm9scyBzZWFyY2ggZGlyZWN0aW9uLlxuICAvLyAgIC0gYFROb2RlYCBzZWFyY2ggbmV4dCBhbmQgcXVpdCBhcyBzb29uIGFzIGBpc1N0eWxpbmdWYWx1ZVByZXNlbnQodmFsdWUpYCBpcyB0cnVlLlxuICAvLyAgICAgIElmIG5vIHZhbHVlIGZvdW5kIGNvbnN1bHQgYHROb2RlLnJlc2lkdWFsU3R5bGVgL2B0Tm9kZS5yZXNpZHVhbENsYXNzYCBmb3IgZGVmYXVsdCB2YWx1ZS5cbiAgLy8gICAtIGBudWxsYCBzZWFyY2ggcHJldiBhbmQgZ28gYWxsIHRoZSB3YXkgdG8gZW5kLiBSZXR1cm4gbGFzdCB2YWx1ZSB3aGVyZVxuICAvLyAgICAgYGlzU3R5bGluZ1ZhbHVlUHJlc2VudCh2YWx1ZSlgIGlzIHRydWUuXG4gIGNvbnN0IGlzUHJldkRpcmVjdGlvbiA9IHROb2RlID09PSBudWxsO1xuICBsZXQgdmFsdWU6IGFueSA9IHVuZGVmaW5lZDtcbiAgd2hpbGUgKGluZGV4ID4gMCkge1xuICAgIGNvbnN0IHJhd0tleSA9IHREYXRhW2luZGV4XSBhcyBUU3R5bGluZ0tleTtcbiAgICBjb25zdCBjb250YWluc1N0YXRpY3MgPSBBcnJheS5pc0FycmF5KHJhd0tleSk7XG4gICAgLy8gVW53cmFwIHRoZSBrZXkgaWYgd2UgY29udGFpbiBzdGF0aWMgdmFsdWVzLlxuICAgIGNvbnN0IGtleSA9IGNvbnRhaW5zU3RhdGljcyA/IChyYXdLZXkgYXMgc3RyaW5nW10pWzFdIDogcmF3S2V5O1xuICAgIGNvbnN0IGlzU3R5bGluZ01hcCA9IGtleSA9PT0gbnVsbDtcbiAgICBsZXQgdmFsdWVBdExWaWV3SW5kZXggPSBsVmlld1tpbmRleCArIDFdO1xuICAgIGlmICh2YWx1ZUF0TFZpZXdJbmRleCA9PT0gTk9fQ0hBTkdFKSB7XG4gICAgICAvLyBJbiBmaXJzdFVwZGF0ZVBhc3MgdGhlIHN0eWxpbmcgaW5zdHJ1Y3Rpb25zIGNyZWF0ZSBhIGxpbmtlZCBsaXN0IG9mIHN0eWxpbmcuXG4gICAgICAvLyBPbiBzdWJzZXF1ZW50IHBhc3NlcyBpdCBpcyBwb3NzaWJsZSBmb3IgYSBzdHlsaW5nIGluc3RydWN0aW9uIHRvIHRyeSB0byByZWFkIGEgYmluZGluZ1xuICAgICAgLy8gd2hpY2hcbiAgICAgIC8vIGhhcyBub3QgeWV0IGV4ZWN1dGVkLiBJbiB0aGF0IGNhc2Ugd2Ugd2lsbCBmaW5kIGBOT19DSEFOR0VgIGFuZCB3ZSBzaG91bGQgYXNzdW1lIHRoYXRcbiAgICAgIC8vIHdlIGhhdmUgYHVuZGVmaW5lZGAgKG9yIGVtcHR5IGFycmF5IGluIGNhc2Ugb2Ygc3R5bGluZy1tYXAgaW5zdHJ1Y3Rpb24pIGluc3RlYWQuIFRoaXNcbiAgICAgIC8vIGFsbG93cyB0aGUgcmVzb2x1dGlvbiB0byBhcHBseSB0aGUgdmFsdWUgKHdoaWNoIG1heSBsYXRlciBiZSBvdmVyd3JpdHRlbiB3aGVuIHRoZVxuICAgICAgLy8gYmluZGluZyBhY3R1YWxseSBleGVjdXRlcy4pXG4gICAgICB2YWx1ZUF0TFZpZXdJbmRleCA9IGlzU3R5bGluZ01hcCA/IEVNUFRZX0FSUkFZIDogdW5kZWZpbmVkO1xuICAgIH1cbiAgICBsZXQgY3VycmVudFZhbHVlID0gaXNTdHlsaW5nTWFwID8ga2V5VmFsdWVBcnJheUdldCh2YWx1ZUF0TFZpZXdJbmRleCwgcHJvcCkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBrZXkgPT09IHByb3AgPyB2YWx1ZUF0TFZpZXdJbmRleCA6IHVuZGVmaW5lZDtcbiAgICBpZiAoY29udGFpbnNTdGF0aWNzICYmICFpc1N0eWxpbmdWYWx1ZVByZXNlbnQoY3VycmVudFZhbHVlKSkge1xuICAgICAgY3VycmVudFZhbHVlID0ga2V5VmFsdWVBcnJheUdldChyYXdLZXkgYXMgS2V5VmFsdWVBcnJheTxhbnk+LCBwcm9wKTtcbiAgICB9XG4gICAgaWYgKGlzU3R5bGluZ1ZhbHVlUHJlc2VudChjdXJyZW50VmFsdWUpKSB7XG4gICAgICB2YWx1ZSA9IGN1cnJlbnRWYWx1ZTtcbiAgICAgIGlmIChpc1ByZXZEaXJlY3Rpb24pIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgfVxuICAgIH1cbiAgICBjb25zdCB0UmFuZ2UgPSB0RGF0YVtpbmRleCArIDFdIGFzIFRTdHlsaW5nUmFuZ2U7XG4gICAgaW5kZXggPSBpc1ByZXZEaXJlY3Rpb24gPyBnZXRUU3R5bGluZ1JhbmdlUHJldih0UmFuZ2UpIDogZ2V0VFN0eWxpbmdSYW5nZU5leHQodFJhbmdlKTtcbiAgfVxuICBpZiAodE5vZGUgIT09IG51bGwpIHtcbiAgICAvLyBpbiBjYXNlIHdoZXJlIHdlIGFyZSBnb2luZyBpbiBuZXh0IGRpcmVjdGlvbiBBTkQgd2UgZGlkIG5vdCBmaW5kIGFueXRoaW5nLCB3ZSBuZWVkIHRvXG4gICAgLy8gY29uc3VsdCByZXNpZHVhbCBzdHlsaW5nXG4gICAgbGV0IHJlc2lkdWFsID0gaXNDbGFzc0Jhc2VkID8gdE5vZGUucmVzaWR1YWxDbGFzc2VzIDogdE5vZGUucmVzaWR1YWxTdHlsZXM7XG4gICAgaWYgKHJlc2lkdWFsICE9IG51bGwgLyoqIE9SIHJlc2lkdWFsICE9PT0gdW5kZWZpbmVkICovKSB7XG4gICAgICB2YWx1ZSA9IGtleVZhbHVlQXJyYXlHZXQocmVzaWR1YWwhLCBwcm9wKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHZhbHVlO1xufVxuXG4vKipcbiAqIERldGVybWluZXMgaWYgdGhlIGJpbmRpbmcgdmFsdWUgc2hvdWxkIGJlIHVzZWQgKG9yIGlmIHRoZSB2YWx1ZSBpcyAndW5kZWZpbmVkJyBhbmQgaGVuY2UgcHJpb3JpdHlcbiAqIHJlc29sdXRpb24gc2hvdWxkIGJlIHVzZWQuKVxuICpcbiAqIEBwYXJhbSB2YWx1ZSBCaW5kaW5nIHN0eWxlIHZhbHVlLlxuICovXG5mdW5jdGlvbiBpc1N0eWxpbmdWYWx1ZVByZXNlbnQodmFsdWU6IGFueSk6IGJvb2xlYW4ge1xuICAvLyBDdXJyZW50bHkgb25seSBgdW5kZWZpbmVkYCB2YWx1ZSBpcyBjb25zaWRlcmVkIG5vbi1iaW5kaW5nLiBUaGF0IGlzIGB1bmRlZmluZWRgIHNheXMgSSBkb24ndFxuICAvLyBoYXZlIGFuIG9waW5pb24gYXMgdG8gd2hhdCB0aGlzIGJpbmRpbmcgc2hvdWxkIGJlIGFuZCB5b3Ugc2hvdWxkIGNvbnN1bHQgb3RoZXIgYmluZGluZ3MgYnlcbiAgLy8gcHJpb3JpdHkgdG8gZGV0ZXJtaW5lIHRoZSB2YWxpZCB2YWx1ZS5cbiAgLy8gVGhpcyBpcyBleHRyYWN0ZWQgaW50byBhIHNpbmdsZSBmdW5jdGlvbiBzbyB0aGF0IHdlIGhhdmUgYSBzaW5nbGUgcGxhY2UgdG8gY29udHJvbCB0aGlzLlxuICByZXR1cm4gdmFsdWUgIT09IHVuZGVmaW5lZDtcbn1cblxuLyoqXG4gKiBTYW5pdGl6ZXMgb3IgYWRkcyBzdWZmaXggdG8gdGhlIHZhbHVlLlxuICpcbiAqIElmIHZhbHVlIGlzIGBudWxsYC9gdW5kZWZpbmVkYCBubyBzdWZmaXggaXMgYWRkZWRcbiAqIEBwYXJhbSB2YWx1ZVxuICogQHBhcmFtIHN1ZmZpeE9yU2FuaXRpemVyXG4gKi9cbmZ1bmN0aW9uIG5vcm1hbGl6ZUFuZEFwcGx5U3VmZml4T3JTYW5pdGl6ZXIoXG4gICAgdmFsdWU6IGFueSwgc3VmZml4T3JTYW5pdGl6ZXI6IFNhbml0aXplckZufHN0cmluZ3x1bmRlZmluZWR8bnVsbCk6IHN0cmluZ3xudWxsfHVuZGVmaW5lZHxcbiAgICBib29sZWFuIHtcbiAgaWYgKHZhbHVlID09IG51bGwgLyoqIHx8IHZhbHVlID09PSB1bmRlZmluZWQgKi8pIHtcbiAgICAvLyBkbyBub3RoaW5nXG4gIH0gZWxzZSBpZiAodHlwZW9mIHN1ZmZpeE9yU2FuaXRpemVyID09PSAnZnVuY3Rpb24nKSB7XG4gICAgLy8gc2FuaXRpemUgdGhlIHZhbHVlLlxuICAgIHZhbHVlID0gc3VmZml4T3JTYW5pdGl6ZXIodmFsdWUpO1xuICB9IGVsc2UgaWYgKHR5cGVvZiBzdWZmaXhPclNhbml0aXplciA9PT0gJ3N0cmluZycpIHtcbiAgICB2YWx1ZSA9IHZhbHVlICsgc3VmZml4T3JTYW5pdGl6ZXI7XG4gIH0gZWxzZSBpZiAodHlwZW9mIHZhbHVlID09PSAnb2JqZWN0Jykge1xuICAgIHZhbHVlID0gc3RyaW5naWZ5KHVud3JhcFNhZmVWYWx1ZSh2YWx1ZSkpO1xuICB9XG4gIHJldHVybiB2YWx1ZTtcbn1cblxuXG4vKipcbiAqIFRlc3RzIGlmIHRoZSBgVE5vZGVgIGhhcyBpbnB1dCBzaGFkb3cuXG4gKlxuICogQW4gaW5wdXQgc2hhZG93IGlzIHdoZW4gYSBkaXJlY3RpdmUgc3RlYWxzIChzaGFkb3dzKSB0aGUgaW5wdXQgYnkgdXNpbmcgYEBJbnB1dCgnc3R5bGUnKWAgb3JcbiAqIGBASW5wdXQoJ2NsYXNzJylgIGFzIGlucHV0LlxuICpcbiAqIEBwYXJhbSB0Tm9kZSBgVE5vZGVgIHdoaWNoIHdlIHdvdWxkIGxpa2UgdG8gc2VlIGlmIGl0IGhhcyBzaGFkb3cuXG4gKiBAcGFyYW0gaXNDbGFzc0Jhc2VkIGB0cnVlYCBpZiBgY2xhc3NgIChgZmFsc2VgIGlmIGBzdHlsZWApXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBoYXNTdHlsaW5nSW5wdXRTaGFkb3codE5vZGU6IFROb2RlLCBpc0NsYXNzQmFzZWQ6IGJvb2xlYW4pIHtcbiAgcmV0dXJuICh0Tm9kZS5mbGFncyAmIChpc0NsYXNzQmFzZWQgPyBUTm9kZUZsYWdzLmhhc0NsYXNzSW5wdXQgOiBUTm9kZUZsYWdzLmhhc1N0eWxlSW5wdXQpKSAhPT0gMDtcbn1cbiJdfQ==