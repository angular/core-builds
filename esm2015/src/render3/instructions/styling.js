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
import { arrayMapGet, arrayMapSet } from '../../util/array_utils';
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
    checkStylingMap(styleArrayMapSet, styleStringParser, styles, false);
}
/**
 * Parse text as style and add values to ArrayMap.
 *
 * This code is pulled out to a separate function so that it can be tree shaken away if it is not
 * needed. It is only reference from `ɵɵstyleMap`.
 *
 * @param {?} arrayMap ArrayMap to add parsed values to.
 * @param {?} text text to parse.
 * @return {?}
 */
export function styleStringParser(arrayMap, text) {
    for (let i = parseStyle(text); i >= 0; i = parseStyleNext(text, i)) {
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
 * \@codeGenApi
 * @param {?} classes A key/value map or string of CSS classes that will be added to the
 *        given element. Any missing classes (that have already been applied to the element
 *        beforehand) will be removed (unset) from the element's list of CSS classes.
 *
 * @return {?}
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
 * @param {?} arrayMap ArrayMap to add parsed values to.
 * @param {?} text text to parse.
 * @return {?}
 */
export function classStringParser(arrayMap, text) {
    for (let i = parseClassName(text); i >= 0; i = parseClassNameNext(text, i)) {
        arrayMapSet(arrayMap, getLastParsedKey(text), true);
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
    const tView = lView[TVIEW];
    // Styling instructions use 2 slots per binding.
    // 1. one for the value / TStylingKey
    // 2. one for the intermittent-value / TStylingRange
    /** @type {?} */
    const bindingIndex = incrementBindingIndex(2);
    if (tView.firstUpdatePass) {
        stylingPropertyFirstUpdatePass(tView, prop, bindingIndex, isClassBased);
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
 * @param {?} arrayMapSet
 * @param {?} stringParser
 * @param {?} value binding value.
 * @param {?} isClassBased `true` if `class` change (`false` if `style`)
 * @return {?}
 */
export function checkStylingMap(arrayMapSet, stringParser, value, isClassBased) {
    /** @type {?} */
    const lView = getLView();
    /** @type {?} */
    const tView = lView[TVIEW];
    /** @type {?} */
    const bindingIndex = incrementBindingIndex(2);
    if (tView.firstUpdatePass) {
        stylingPropertyFirstUpdatePass(tView, null, bindingIndex, isClassBased);
    }
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
            // tha the binding has removed it. This would confuse `[ngStyle]`/`[ngClass]` to do the wrong
            // thing as it would think tha the static portion was removed. For this reason we
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
 * @param {?} tStylingKey
 * @param {?} bindingIndex Index of binding associated with the `prop`
 * @param {?} isClassBased `true` if `class` change (`false` if `style`)
 * @return {?}
 */
function stylingPropertyFirstUpdatePass(tView, tStylingKey, bindingIndex, isClassBased) {
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
        const directives = tNode.directives;
        /** @type {?} */
        const isFirstStylingInstructionInHostBinding = directives !== null &&
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
 * @param {?} tData
 * @param {?} tNode
 * @param {?} isClassBased
 * @param {?} tStylingKey
 * @return {?}
 */
function setTemplateHeadTStylingKey(tData, tNode, isClassBased, tStylingKey) {
    /** @type {?} */
    const bindings = isClassBased ? tNode.classBindings : tNode.styleBindings;
    ngDevMode && assertNotEqual(getTStylingRangeNext(bindings), 0, 'Expecting to have at least one template styling binding.');
    tData[getTStylingRangePrev(bindings)] = tStylingKey;
}
/**
 * @param {?} tNode
 * @param {?} isClassBased
 * @return {?}
 */
function collectResidual(tNode, isClassBased) {
    /** @type {?} */
    let residual = undefined;
    /** @type {?} */
    const directives = tNode.directives;
    if (directives) {
        for (let i = directives[0 /* STYLING_CURSOR */] + 1; i < directives.length; i++) {
            /** @type {?} */
            const attrs = ((/** @type {?} */ (directives[i]))).hostAttrs;
            residual = (/** @type {?} */ (collectStylingFromTAttrs(residual, attrs, isClassBased)));
        }
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
    /** @type {?} */
    const directives = tNode.directives;
    if (directives != null) {
        ngDevMode && hostDirectiveDef &&
            assertGreaterThanOrEqual(directives.indexOf(hostDirectiveDef, directives[0 /* STYLING_CURSOR */]), 0, 'Expecting that the current directive is in the directive list');
        // We need to loop because there can be directives which have `hostAttrs` but don't have
        // `hostBindings` so this loop catches up up to the current directive..
        /** @type {?} */
        let currentDirective = null;
        /** @type {?} */
        let index = directives[0 /* STYLING_CURSOR */];
        while (index + 1 < directives.length) {
            index++;
            currentDirective = (/** @type {?} */ (directives[index]));
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
                    arrayMapSet((/** @type {?} */ (stylingKey)), item, isClassBased ? true : attrs[++i]);
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
 * @param {?} arrayMapSet
 * @param {?} stringParser The parser is passed in so that it will be tree shakable. See
 *        `styleStringParser` and `classStringParser`
 * @param {?} value The value to parse/convert to `ArrayMap`
 * @return {?}
 */
export function toStylingArrayMap(arrayMapSet, stringParser, value) {
    if (value === null || value === undefined || value === '')
        return (/** @type {?} */ (EMPTY_ARRAY));
    /** @type {?} */
    const styleArrayMap = (/** @type {?} */ ([]));
    if (Array.isArray(value)) {
        for (let i = 0; i < value.length; i++) {
            arrayMapSet(styleArrayMap, value[i], true);
        }
    }
    else if (typeof value === 'object') {
        if (value instanceof Map) {
            value.forEach((/**
             * @param {?} v
             * @param {?} k
             * @return {?}
             */
            (v, k) => arrayMapSet(styleArrayMap, k, v)));
        }
        else if (value instanceof Set) {
            value.forEach((/**
             * @param {?} k
             * @return {?}
             */
            (k) => arrayMapSet(styleArrayMap, k, true)));
        }
        else {
            for (const key in value) {
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
 * @param {?} arrayMap ArrayMap to add to.
 * @param {?} key Style key to add. (This key will be checked if it needs sanitization)
 * @param {?} value The value to set (If key needs sanitization it will be sanitized)
 * @return {?}
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
 * @param {?} tView Associated `TView.data` contains the linked list of binding priorities.
 * @param {?} tNode `TNode` where the binding is located.
 * @param {?} lView `LView` contains the values associated with other styling binding at this `TNode`.
 * @param {?} renderer Renderer to use if any updates.
 * @param {?} oldArrayMap Previous value represented as `ArrayMap`
 * @param {?} newArrayMap Current value represented as `ArrayMap`
 * @param {?} isClassBased `true` if `class` (`false` if `style`)
 * @param {?} bindingIndex Binding index of the binding.
 * @return {?}
 */
function updateStylingMap(tView, tNode, lView, renderer, oldArrayMap, newArrayMap, isClassBased, bindingIndex) {
    if ((/** @type {?} */ (oldArrayMap)) === NO_CHANGE) {
        // ON first execution the oldArrayMap is NO_CHANGE => treat is as empty ArrayMap.
        oldArrayMap = (/** @type {?} */ (EMPTY_ARRAY));
    }
    /** @type {?} */
    let oldIndex = 0;
    /** @type {?} */
    let newIndex = 0;
    /** @type {?} */
    let oldKey = 0 < oldArrayMap.length ? oldArrayMap[0] : null;
    /** @type {?} */
    let newKey = 0 < newArrayMap.length ? newArrayMap[0] : null;
    while (oldKey !== null || newKey !== null) {
        ngDevMode && assertLessThan(oldIndex, 999, 'Are we stuck in infinite loop?');
        ngDevMode && assertLessThan(newIndex, 999, 'Are we stuck in infinite loop?');
        /** @type {?} */
        const oldValue = oldIndex < oldArrayMap.length ? oldArrayMap[oldIndex + 1] : undefined;
        /** @type {?} */
        const newValue = newIndex < newArrayMap.length ? newArrayMap[newIndex + 1] : undefined;
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
 * @param {?} tView Associated `TView.data` contains the linked list of binding priorities.
 * @param {?} tNode `TNode` where the binding is located.
 * @param {?} lView `LView` contains the values associated with other styling binding at this `TNode`.
 * @param {?} renderer Renderer to use if any updates.
 * @param {?} prop Either style property name or a class name.
 * @param {?} value Either style vale for `prop` or `true`/`false` if `prop` is class.
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
        let currentValue = key === null ? arrayMapGet(lView[index + 1], prop) :
            key === prop ? lView[index + 1] : undefined;
        if (containsStatics && !isStylingValuePresent(currentValue)) {
            currentValue = arrayMapGet((/** @type {?} */ (rawKey)), prop);
        }
        if (isStylingValuePresent(currentValue)) {
            value = currentValue;
            if (tNode === null) {
                return value;
            }
        }
        /** @type {?} */
        const tRange = (/** @type {?} */ (tData[index + 1]));
        index = tNode === null ? getTStylingRangePrev(tRange) : getTStylingRangeNext(tRange);
    }
    if (tNode !== null) {
        // in case where we are going in next direction AND we did not find anything, we need to
        // consult residual styling
        /** @type {?} */
        let residual = isClassBased ? tNode.residualClasses : tNode.residualStyles;
        if (residual != null /** OR residual !=== undefined */) {
            value = arrayMapGet((/** @type {?} */ (residual)), prop);
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
 * Lazily computes `tNode.classesMap`/`tNode.stylesMap`.
 *
 * This code is here because we don't want to included it in `elementStart` as it would make hello
 * world bigger even if no styling would be present. Instead we initialize the values here so that
 * tree shaking will only bring it in if styling is present.
 *
 * @param {?} tNode `TNode` to initialize.
 * @return {?}
 */
export function initializeStylingStaticArrayMap(tNode) {
    ngDevMode && assertEqual(tNode.residualClasses, undefined, 'Already initialized!');
    ngDevMode && assertEqual(tNode.residualStyles, undefined, 'Already initialized!');
    /** @type {?} */
    let styleMap = null;
    /** @type {?} */
    let classMap = null;
    /** @type {?} */
    const mergeAttrs = tNode.mergedAttrs || (/** @type {?} */ (EMPTY_ARRAY));
    /** @type {?} */
    let mode = -1 /* ImplicitAttributes */;
    for (let i = 0; i < mergeAttrs.length; i++) {
        /** @type {?} */
        let item = mergeAttrs[i];
        if (typeof item === 'number') {
            mode = item;
        }
        else if (mode === 1 /* Classes */) {
            classMap = classMap || (/** @type {?} */ ([]));
            arrayMapSet((/** @type {?} */ (classMap)), (/** @type {?} */ (item)), true);
        }
        else if (mode === 2 /* Styles */) {
            styleMap = styleMap || (/** @type {?} */ ([]));
            arrayMapSet((/** @type {?} */ (styleMap)), (/** @type {?} */ (item)), (/** @type {?} */ (mergeAttrs[++i])));
        }
    }
    tNode.residualClasses = classMap;
    tNode.residualStyles = styleMap;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3R5bGluZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaW5zdHJ1Y3Rpb25zL3N0eWxpbmcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUFZLGVBQWUsRUFBQyxNQUFNLDJCQUEyQixDQUFDO0FBQ3JFLE9BQU8sRUFBQywwQkFBMEIsRUFBRSxlQUFlLEVBQUMsTUFBTSxpQ0FBaUMsQ0FBQztBQUU1RixPQUFPLEVBQVcsV0FBVyxFQUFFLFdBQVcsRUFBQyxNQUFNLHdCQUF3QixDQUFDO0FBQzFFLE9BQU8sRUFBQyxhQUFhLEVBQUUsV0FBVyxFQUFFLHdCQUF3QixFQUFFLGNBQWMsRUFBRSxjQUFjLEVBQWlCLFVBQVUsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQ2xKLE9BQU8sRUFBQyxXQUFXLEVBQUMsTUFBTSxrQkFBa0IsQ0FBQztBQUM3QyxPQUFPLEVBQUMsc0JBQXNCLEVBQUUsU0FBUyxFQUFDLE1BQU0sc0JBQXNCLENBQUM7QUFDdkUsT0FBTyxFQUFDLHFCQUFxQixFQUFDLE1BQU0sV0FBVyxDQUFDO0FBQ2hELE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxhQUFhLENBQUM7QUFLM0MsT0FBTyxFQUE2QixvQkFBb0IsRUFBRSw2QkFBNkIsRUFBRSxvQkFBb0IsRUFBRSw2QkFBNkIsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQzNLLE9BQU8sRUFBQyxhQUFhLEVBQVMsUUFBUSxFQUFTLEtBQUssRUFBUSxNQUFNLG9CQUFvQixDQUFDO0FBQ3ZGLE9BQU8sRUFBQyxZQUFZLEVBQUMsTUFBTSxzQkFBc0IsQ0FBQztBQUNsRCxPQUFPLEVBQUMsd0JBQXdCLEVBQUUsd0JBQXdCLEVBQUUsUUFBUSxFQUFFLGdCQUFnQixFQUFFLHFCQUFxQixFQUFFLHdCQUF3QixFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQ3pKLE9BQU8sRUFBQyxxQkFBcUIsRUFBQyxNQUFNLCtCQUErQixDQUFDO0FBQ3BFLE9BQU8sRUFBQyxnQkFBZ0IsRUFBRSxrQkFBa0IsRUFBRSxjQUFjLEVBQUUsa0JBQWtCLEVBQUUsVUFBVSxFQUFFLGNBQWMsRUFBQyxNQUFNLDJCQUEyQixDQUFDO0FBQy9JLE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxXQUFXLENBQUM7QUFDcEMsT0FBTyxFQUFDLGdCQUFnQixFQUFDLE1BQU0sb0JBQW9CLENBQUM7QUFDcEQsT0FBTyxFQUFDLHFDQUFxQyxFQUFDLE1BQU0sWUFBWSxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7O0FBbUJqRSxNQUFNLFVBQVUsZ0JBQWdCLENBQUMsU0FBaUM7SUFDaEUsd0JBQXdCLENBQUMsU0FBUyxDQUFDLENBQUM7QUFDdEMsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUF1QkQsTUFBTSxVQUFVLFdBQVcsQ0FDdkIsSUFBWSxFQUFFLEtBQXFELEVBQ25FLE1BQXNCO0lBQ3hCLG9CQUFvQixDQUFDLElBQUksRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQ2pELE9BQU8sV0FBVyxDQUFDO0FBQ3JCLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBaUJELE1BQU0sVUFBVSxXQUFXLENBQ3ZCLFNBQWlCLEVBQUUsS0FBaUM7SUFDdEQsb0JBQW9CLENBQUMsU0FBUyxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDbkQsT0FBTyxXQUFXLENBQUM7QUFDckIsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBc0JELE1BQU0sVUFBVSxVQUFVLENBQ3RCLE1BQ2dCO0lBQ2xCLGVBQWUsQ0FBQyxnQkFBZ0IsRUFBRSxpQkFBaUIsRUFBRSxNQUFNLEVBQUUsS0FBSyxDQUFDLENBQUM7QUFDdEUsQ0FBQzs7Ozs7Ozs7Ozs7QUFZRCxNQUFNLFVBQVUsaUJBQWlCLENBQUMsUUFBdUIsRUFBRSxJQUFZO0lBQ3JFLEtBQUssSUFBSSxDQUFDLEdBQUcsVUFBVSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxHQUFHLGNBQWMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLEVBQUU7UUFDbEUsZ0JBQWdCLENBQUMsUUFBUSxFQUFFLGdCQUFnQixDQUFDLElBQUksQ0FBQyxFQUFFLGtCQUFrQixDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7S0FDOUU7QUFDSCxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQXFCRCxNQUFNLFVBQVUsVUFBVSxDQUN0QixPQUNzRjtJQUN4RixlQUFlLENBQUMsV0FBVyxFQUFFLGlCQUFpQixFQUFFLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQztBQUNqRSxDQUFDOzs7Ozs7Ozs7OztBQVdELE1BQU0sVUFBVSxpQkFBaUIsQ0FBQyxRQUF1QixFQUFFLElBQVk7SUFDckUsS0FBSyxJQUFJLENBQUMsR0FBRyxjQUFjLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLEdBQUcsa0JBQWtCLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxFQUFFO1FBQzFFLFdBQVcsQ0FBQyxRQUFRLEVBQUUsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7S0FDckQ7QUFDSCxDQUFDOzs7Ozs7Ozs7O0FBVUQsTUFBTSxVQUFVLG9CQUFvQixDQUNoQyxJQUFZLEVBQUUsS0FBc0IsRUFDcEMsaUJBQTBELEVBQUUsWUFBcUI7O1VBQzdFLEtBQUssR0FBRyxRQUFRLEVBQUU7O1VBQ2xCLEtBQUssR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDOzs7OztVQUlwQixZQUFZLEdBQUcscUJBQXFCLENBQUMsQ0FBQyxDQUFDO0lBQzdDLElBQUksS0FBSyxDQUFDLGVBQWUsRUFBRTtRQUN6Qiw4QkFBOEIsQ0FBQyxLQUFLLEVBQUUsSUFBSSxFQUFFLFlBQVksRUFBRSxZQUFZLENBQUMsQ0FBQztLQUN6RTtJQUNELElBQUksS0FBSyxLQUFLLFNBQVMsSUFBSSxjQUFjLENBQUMsS0FBSyxFQUFFLFlBQVksRUFBRSxLQUFLLENBQUMsRUFBRTs7OztZQUdqRSxjQUFvQztRQUN4QyxJQUFJLGlCQUFpQixJQUFJLElBQUksRUFBRTtZQUM3QixJQUFJLGNBQWMsR0FBRyx3QkFBd0IsRUFBRSxFQUFFO2dCQUMvQyxpQkFBaUIsR0FBRyxtQkFBQSxjQUFjLEVBQU8sQ0FBQzthQUMzQztTQUNGOztjQUNLLEtBQUssR0FBRyxtQkFBQSxLQUFLLENBQUMsSUFBSSxDQUFDLGdCQUFnQixFQUFFLEdBQUcsYUFBYSxDQUFDLEVBQVM7UUFDckUsYUFBYSxDQUNULEtBQUssRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxRQUFRLENBQUMsRUFBRSxJQUFJLEVBQzFDLEtBQUssQ0FBQyxZQUFZLEdBQUcsQ0FBQyxDQUFDLEdBQUcsa0NBQWtDLENBQUMsS0FBSyxFQUFFLGlCQUFpQixDQUFDLEVBQ3RGLFlBQVksRUFBRSxZQUFZLENBQUMsQ0FBQztLQUNqQztBQUNILENBQUM7Ozs7Ozs7Ozs7QUFTRCxNQUFNLFVBQVUsZUFBZSxDQUMzQixXQUF1RSxFQUN2RSxZQUFrRSxFQUFFLEtBQW9CLEVBQ3hGLFlBQXFCOztVQUNqQixLQUFLLEdBQUcsUUFBUSxFQUFFOztVQUNsQixLQUFLLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQzs7VUFDcEIsWUFBWSxHQUFHLHFCQUFxQixDQUFDLENBQUMsQ0FBQztJQUM3QyxJQUFJLEtBQUssQ0FBQyxlQUFlLEVBQUU7UUFDekIsOEJBQThCLENBQUMsS0FBSyxFQUFFLElBQUksRUFBRSxZQUFZLEVBQUUsWUFBWSxDQUFDLENBQUM7S0FDekU7SUFDRCxJQUFJLEtBQUssS0FBSyxTQUFTLElBQUksY0FBYyxDQUFDLEtBQUssRUFBRSxZQUFZLEVBQUUsS0FBSyxDQUFDLEVBQUU7Ozs7Y0FHL0QsS0FBSyxHQUFHLG1CQUFBLEtBQUssQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsR0FBRyxhQUFhLENBQUMsRUFBUztRQUNyRSxJQUFJLHFCQUFxQixDQUFDLEtBQUssRUFBRSxZQUFZLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEtBQUssRUFBRSxZQUFZLENBQUMsRUFBRTtZQUN4RixJQUFJLFNBQVMsRUFBRTs7OztzQkFHUCxXQUFXLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUM7Z0JBQzVDLFdBQVcsQ0FDUCxLQUFLLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFdBQVcsRUFBRSxLQUFLLEVBQ2hFLGdFQUFnRSxDQUFDLENBQUM7YUFDdkU7Ozs7Ozs7OztnQkFRRyxZQUFZLEdBQUcsWUFBWSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsTUFBTTtZQUM5RCxTQUFTLElBQUksWUFBWSxLQUFLLEtBQUssSUFBSSxZQUFZLEtBQUssSUFBSTtnQkFDeEQsV0FBVyxDQUNQLFlBQVksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLEVBQUUsSUFBSSxFQUFFLDRDQUE0QyxDQUFDLENBQUM7WUFDeEYsSUFBSSxPQUFPLEtBQUssS0FBSyxRQUFRLEVBQUU7Z0JBQzdCLEtBQUssR0FBRyxzQkFBc0IsQ0FBQyxZQUFZLEVBQUUsbUJBQUEsS0FBSyxFQUFVLENBQUMsQ0FBQzthQUMvRDtZQUNELHlFQUF5RTtZQUN6RSw4REFBOEQ7WUFDOUQscUNBQXFDLENBQUMsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsWUFBWSxDQUFDLENBQUM7U0FDMUU7YUFBTTtZQUNMLGdCQUFnQixDQUNaLEtBQUssRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxRQUFRLENBQUMsRUFBRSxLQUFLLENBQUMsWUFBWSxHQUFHLENBQUMsQ0FBQyxFQUM3RCxLQUFLLENBQUMsWUFBWSxHQUFHLENBQUMsQ0FBQyxHQUFHLGlCQUFpQixDQUFDLFdBQVcsRUFBRSxZQUFZLEVBQUUsS0FBSyxDQUFDLEVBQzdFLFlBQVksRUFBRSxZQUFZLENBQUMsQ0FBQztTQUNqQztLQUNGO0FBQ0gsQ0FBQzs7Ozs7Ozs7QUFRRCxTQUFTLGdCQUFnQixDQUFDLEtBQVksRUFBRSxZQUFvQjtJQUMxRCwwREFBMEQ7SUFDMUQsT0FBTyxZQUFZLElBQUksS0FBSyxDQUFDLGlCQUFpQixDQUFDO0FBQ2pELENBQUM7Ozs7Ozs7Ozs7O0FBWUQsU0FBUyw4QkFBOEIsQ0FDbkMsS0FBWSxFQUFFLFdBQXdCLEVBQUUsWUFBb0IsRUFBRSxZQUFxQjtJQUNyRixTQUFTLElBQUkscUJBQXFCLENBQUMsS0FBSyxDQUFDLENBQUM7O1VBQ3BDLEtBQUssR0FBRyxLQUFLLENBQUMsSUFBSTtJQUN4QixJQUFJLEtBQUssQ0FBQyxZQUFZLEdBQUcsQ0FBQyxDQUFDLEtBQUssSUFBSSxFQUFFOzs7Ozs7O2NBTTlCLEtBQUssR0FBRyxtQkFBQSxLQUFLLENBQUMsZ0JBQWdCLEVBQUUsR0FBRyxhQUFhLENBQUMsRUFBUzs7Y0FDMUQsY0FBYyxHQUFHLGdCQUFnQixDQUFDLEtBQUssRUFBRSxZQUFZLENBQUM7UUFDNUQsSUFBSSxxQkFBcUIsQ0FBQyxLQUFLLEVBQUUsWUFBWSxDQUFDLElBQUksV0FBVyxLQUFLLElBQUksSUFBSSxDQUFDLGNBQWMsRUFBRTtZQUN6RixvRkFBb0Y7WUFDcEYsaUZBQWlGO1lBQ2pGLDJFQUEyRTtZQUMzRSx5REFBeUQ7WUFDekQsV0FBVyxHQUFHLEtBQUssQ0FBQztTQUNyQjtRQUNELFdBQVcsR0FBRyxzQkFBc0IsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLFdBQVcsRUFBRSxZQUFZLENBQUMsQ0FBQztRQUM5RSxxQkFBcUIsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLFdBQVcsRUFBRSxZQUFZLEVBQUUsY0FBYyxFQUFFLFlBQVksQ0FBQyxDQUFDO0tBQzlGO0FBQ0gsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7OztBQWdCRCxNQUFNLFVBQVUsc0JBQXNCLENBQ2xDLEtBQVksRUFBRSxLQUFZLEVBQUUsVUFBdUIsRUFBRSxZQUFxQjs7VUFDdEUsZ0JBQWdCLEdBQUcsbUJBQW1CLENBQUMsS0FBSyxDQUFDOztRQUMvQyxRQUFRLEdBQUcsWUFBWSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsY0FBYztJQUMxRSxJQUFJLGdCQUFnQixLQUFLLElBQUksRUFBRTs7Ozs7O2NBS3ZCLG1DQUFtQyxHQUNyQyxtQkFBQSxtQkFBQSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxFQUFPLEVBQVUsS0FBSyxDQUFDO1FBQ3JGLElBQUksbUNBQW1DLEVBQUU7WUFDdkMsMkZBQTJGO1lBQzNGLDhGQUE4RjtZQUM5RixtQkFBbUI7WUFDbkIsVUFBVSxHQUFHLDRCQUE0QixDQUFDLElBQUksRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLFVBQVUsRUFBRSxZQUFZLENBQUMsQ0FBQztZQUN4RixVQUFVLEdBQUcsd0JBQXdCLENBQUMsVUFBVSxFQUFFLEtBQUssQ0FBQyxLQUFLLEVBQUUsWUFBWSxDQUFDLENBQUM7WUFDN0UsOEVBQThFO1lBQzlFLFFBQVEsR0FBRyxJQUFJLENBQUM7U0FDakI7S0FDRjtTQUFNOzs7O2NBR0MsVUFBVSxHQUFHLEtBQUssQ0FBQyxVQUFVOztjQUM3QixzQ0FBc0MsR0FBRyxVQUFVLEtBQUssSUFBSTtZQUM5RCxVQUFVLENBQUMsVUFBVSx3QkFBOEIsQ0FBQyxLQUFLLGdCQUFnQjtRQUM3RSxJQUFJLHNDQUFzQyxFQUFFO1lBQzFDLFVBQVU7Z0JBQ04sNEJBQTRCLENBQUMsZ0JBQWdCLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxVQUFVLEVBQUUsWUFBWSxDQUFDLENBQUM7WUFDM0YsSUFBSSxRQUFRLEtBQUssSUFBSSxFQUFFOzs7Ozs7OztvQkFPakIsa0JBQWtCLEdBQUcsMEJBQTBCLENBQUMsS0FBSyxFQUFFLEtBQUssRUFBRSxZQUFZLENBQUM7Z0JBQy9FLElBQUksa0JBQWtCLEtBQUssU0FBUyxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsa0JBQWtCLENBQUMsRUFBRTtvQkFDekUsc0ZBQXNGO29CQUN0RiwwRkFBMEY7b0JBQzFGLFNBQVM7b0JBQ1Qsa0JBQWtCLEdBQUcsNEJBQTRCLENBQzdDLElBQUksRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLGtCQUFrQixDQUFDLENBQUMsQ0FBQyxDQUFDLDZCQUE2QixFQUN2RSxZQUFZLENBQUMsQ0FBQztvQkFDbEIsa0JBQWtCO3dCQUNkLHdCQUF3QixDQUFDLGtCQUFrQixFQUFFLEtBQUssQ0FBQyxLQUFLLEVBQUUsWUFBWSxDQUFDLENBQUM7b0JBQzVFLDBCQUEwQixDQUFDLEtBQUssRUFBRSxLQUFLLEVBQUUsWUFBWSxFQUFFLGtCQUFrQixDQUFDLENBQUM7aUJBQzVFO2FBQ0Y7aUJBQU07Z0JBQ0wsMERBQTBEO2dCQUMxRCwwRkFBMEY7Z0JBQzFGLHVGQUF1RjtnQkFDdkYsZUFBZTtnQkFDZiwwREFBMEQ7Z0JBQzFELFFBQVEsR0FBRyxlQUFlLENBQUMsS0FBSyxFQUFFLFlBQVksQ0FBQyxDQUFDO2FBQ2pEO1NBQ0Y7S0FDRjtJQUNELElBQUksUUFBUSxLQUFLLFNBQVMsRUFBRTtRQUMxQixZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLGVBQWUsR0FBRyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsY0FBYyxHQUFHLFFBQVEsQ0FBQyxDQUFDO0tBQ3ZGO0lBQ0QsT0FBTyxVQUFVLENBQUM7QUFDcEIsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7QUFlRCxTQUFTLDBCQUEwQixDQUFDLEtBQVksRUFBRSxLQUFZLEVBQUUsWUFBcUI7O1VBRTdFLFFBQVEsR0FBRyxZQUFZLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxhQUFhO0lBQ3pFLElBQUksb0JBQW9CLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxFQUFFO1FBQ3hDLHFFQUFxRTtRQUNyRSxPQUFPLFNBQVMsQ0FBQztLQUNsQjtJQUNELE9BQU8sbUJBQUEsS0FBSyxDQUFDLG9CQUFvQixDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQWUsQ0FBQztBQUM5RCxDQUFDOzs7Ozs7OztBQUVELFNBQVMsMEJBQTBCLENBQy9CLEtBQVksRUFBRSxLQUFZLEVBQUUsWUFBcUIsRUFBRSxXQUF3Qjs7VUFDdkUsUUFBUSxHQUFHLFlBQVksQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLGFBQWE7SUFDekUsU0FBUyxJQUFJLGNBQWMsQ0FDVixvQkFBb0IsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLEVBQ2pDLDBEQUEwRCxDQUFDLENBQUM7SUFDN0UsS0FBSyxDQUFDLG9CQUFvQixDQUFDLFFBQVEsQ0FBQyxDQUFDLEdBQUcsV0FBVyxDQUFDO0FBQ3RELENBQUM7Ozs7OztBQUVELFNBQVMsZUFBZSxDQUFDLEtBQVksRUFBRSxZQUFxQjs7UUFDdEQsUUFBUSxHQUFpQyxTQUFTOztVQUNoRCxVQUFVLEdBQUcsS0FBSyxDQUFDLFVBQVU7SUFDbkMsSUFBSSxVQUFVLEVBQUU7UUFDZCxLQUFLLElBQUksQ0FBQyxHQUFHLFVBQVUsd0JBQThCLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxVQUFVLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFOztrQkFDL0UsS0FBSyxHQUFHLENBQUMsbUJBQUEsVUFBVSxDQUFDLENBQUMsQ0FBQyxFQUFxQixDQUFDLENBQUMsU0FBUztZQUM1RCxRQUFRLEdBQUcsbUJBQUEsd0JBQXdCLENBQUMsUUFBUSxFQUFFLEtBQUssRUFBRSxZQUFZLENBQUMsRUFBdUIsQ0FBQztTQUMzRjtLQUNGO0lBQ0QsT0FBTyxtQkFBQSx3QkFBd0IsQ0FBQyxRQUFRLEVBQUUsS0FBSyxDQUFDLEtBQUssRUFBRSxZQUFZLENBQUMsRUFBdUIsQ0FBQztBQUM5RixDQUFDOzs7Ozs7Ozs7Ozs7OztBQWNELFNBQVMsNEJBQTRCLENBQ2pDLGdCQUF5QyxFQUFFLEtBQVksRUFBRSxLQUFZLEVBQUUsVUFBdUIsRUFDOUYsWUFBcUI7O1VBQ2pCLFVBQVUsR0FBRyxLQUFLLENBQUMsVUFBVTtJQUNuQyxJQUFJLFVBQVUsSUFBSSxJQUFJLEVBQUU7UUFDdEIsU0FBUyxJQUFJLGdCQUFnQjtZQUN6Qix3QkFBd0IsQ0FDcEIsVUFBVSxDQUFDLE9BQU8sQ0FBQyxnQkFBZ0IsRUFBRSxVQUFVLHdCQUE4QixDQUFDLEVBQUUsQ0FBQyxFQUNqRiwrREFBK0QsQ0FBQyxDQUFDOzs7O1lBR3JFLGdCQUFnQixHQUEyQixJQUFJOztZQUMvQyxLQUFLLEdBQUcsVUFBVSx3QkFBOEI7UUFDcEQsT0FBTyxLQUFLLEdBQUcsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxNQUFNLEVBQUU7WUFDcEMsS0FBSyxFQUFFLENBQUM7WUFDUixnQkFBZ0IsR0FBRyxtQkFBQSxVQUFVLENBQUMsS0FBSyxDQUFDLEVBQXFCLENBQUM7WUFDMUQsU0FBUyxJQUFJLGFBQWEsQ0FBQyxnQkFBZ0IsRUFBRSx3QkFBd0IsQ0FBQyxDQUFDO1lBQ3ZFLFVBQVUsR0FBRyx3QkFBd0IsQ0FBQyxVQUFVLEVBQUUsZ0JBQWdCLENBQUMsU0FBUyxFQUFFLFlBQVksQ0FBQyxDQUFDO1lBQzVGLElBQUksZ0JBQWdCLEtBQUssZ0JBQWdCO2dCQUFFLE1BQU07U0FDbEQ7UUFDRCxJQUFJLGdCQUFnQixLQUFLLElBQUksRUFBRTtZQUM3QixtRkFBbUY7WUFDbkYsOEVBQThFO1lBQzlFLDZDQUE2QztZQUM3QyxVQUFVLHdCQUE4QixHQUFHLEtBQUssQ0FBQztTQUNsRDtLQUNGO0lBQ0QsT0FBTyxVQUFVLENBQUM7QUFDcEIsQ0FBQzs7Ozs7Ozs7O0FBU0QsU0FBUyx3QkFBd0IsQ0FDN0IsVUFBbUMsRUFBRSxLQUF5QixFQUM5RCxZQUFxQjs7VUFDakIsYUFBYSxHQUFHLFlBQVksQ0FBQyxDQUFDLGlCQUF5QixDQUFDLGVBQXVCOztRQUNqRixhQUFhLDhCQUFxQztJQUN0RCxJQUFJLEtBQUssS0FBSyxJQUFJLEVBQUU7UUFDbEIsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7O2tCQUMvQixJQUFJLEdBQUcsbUJBQUEsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFtQjtZQUN4QyxJQUFJLE9BQU8sSUFBSSxLQUFLLFFBQVEsRUFBRTtnQkFDNUIsYUFBYSxHQUFHLElBQUksQ0FBQzthQUN0QjtpQkFBTTtnQkFDTCxJQUFJLGFBQWEsS0FBSyxhQUFhLEVBQUU7b0JBQ25DLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxFQUFFO3dCQUM5QixVQUFVLEdBQUcsVUFBVSxLQUFLLFNBQVMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxtQkFBQSxDQUFDLEVBQUUsRUFBRSxVQUFVLENBQUMsRUFBTyxDQUFDO3FCQUN0RTtvQkFDRCxXQUFXLENBQUMsbUJBQUEsVUFBVSxFQUFpQixFQUFFLElBQUksRUFBRSxZQUFZLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztpQkFDbEY7YUFDRjtTQUNGO0tBQ0Y7SUFDRCxPQUFPLFVBQVUsS0FBSyxTQUFTLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDO0FBQ3RELENBQUM7Ozs7Ozs7O0FBUUQsTUFBTSxVQUFVLG1CQUFtQixDQUFDLEtBQVk7O1VBQ3hDLHFCQUFxQixHQUFHLHdCQUF3QixFQUFFO0lBQ3hELE9BQU8scUJBQXFCLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsbUJBQUEsS0FBSyxDQUFDLHFCQUFxQixDQUFDLEVBQXFCLENBQUM7QUFDakcsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQXdCRCxNQUFNLFVBQVUsaUJBQWlCLENBQzdCLFdBQXVFLEVBQ3ZFLFlBQWtFLEVBQUUsS0FDVjtJQUM1RCxJQUFJLEtBQUssS0FBSyxJQUFJLElBQUksS0FBSyxLQUFLLFNBQVMsSUFBSSxLQUFLLEtBQUssRUFBRTtRQUFFLE9BQU8sbUJBQUEsV0FBVyxFQUFPLENBQUM7O1VBQy9FLGFBQWEsR0FBa0IsbUJBQUEsRUFBRSxFQUFPO0lBQzlDLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsRUFBRTtRQUN4QixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtZQUNyQyxXQUFXLENBQUMsYUFBYSxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztTQUM1QztLQUNGO1NBQU0sSUFBSSxPQUFPLEtBQUssS0FBSyxRQUFRLEVBQUU7UUFDcEMsSUFBSSxLQUFLLFlBQVksR0FBRyxFQUFFO1lBQ3hCLEtBQUssQ0FBQyxPQUFPOzs7OztZQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsV0FBVyxDQUFDLGFBQWEsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUMsQ0FBQztTQUMzRDthQUFNLElBQUksS0FBSyxZQUFZLEdBQUcsRUFBRTtZQUMvQixLQUFLLENBQUMsT0FBTzs7OztZQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxXQUFXLENBQUMsYUFBYSxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUMsRUFBQyxDQUFDO1NBQzNEO2FBQU07WUFDTCxLQUFLLE1BQU0sR0FBRyxJQUFJLEtBQUssRUFBRTtnQkFDdkIsSUFBSSxLQUFLLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxFQUFFO29CQUM3QixXQUFXLENBQUMsYUFBYSxFQUFFLEdBQUcsRUFBRSxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztpQkFDN0M7YUFDRjtTQUNGO0tBQ0Y7U0FBTSxJQUFJLE9BQU8sS0FBSyxLQUFLLFFBQVEsRUFBRTtRQUNwQyxZQUFZLENBQUMsYUFBYSxFQUFFLEtBQUssQ0FBQyxDQUFDO0tBQ3BDO1NBQU07UUFDTCxTQUFTLElBQUksVUFBVSxDQUFDLDJCQUEyQixHQUFHLE9BQU8sS0FBSyxDQUFDLENBQUM7S0FDckU7SUFDRCxPQUFPLGFBQWEsQ0FBQztBQUN2QixDQUFDOzs7Ozs7Ozs7OztBQVdELFNBQVMsZ0JBQWdCLENBQUMsUUFBdUIsRUFBRSxHQUFXLEVBQUUsS0FBVTtJQUN4RSxJQUFJLDBCQUEwQixDQUFDLEdBQUcsQ0FBQyxFQUFFO1FBQ25DLEtBQUssR0FBRyxlQUFlLENBQUMsS0FBSyxDQUFDLENBQUM7S0FDaEM7SUFDRCxXQUFXLENBQUMsUUFBUSxFQUFFLEdBQUcsRUFBRSxLQUFLLENBQUMsQ0FBQztBQUNwQyxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQW9CRCxTQUFTLGdCQUFnQixDQUNyQixLQUFZLEVBQUUsS0FBWSxFQUFFLEtBQVksRUFBRSxRQUFtQixFQUFFLFdBQTBCLEVBQ3pGLFdBQTBCLEVBQUUsWUFBcUIsRUFBRSxZQUFvQjtJQUN6RSxJQUFJLG1CQUFBLFdBQVcsRUFBNEIsS0FBSyxTQUFTLEVBQUU7UUFDekQsaUZBQWlGO1FBQ2pGLFdBQVcsR0FBRyxtQkFBQSxXQUFXLEVBQU8sQ0FBQztLQUNsQzs7UUFDRyxRQUFRLEdBQUcsQ0FBQzs7UUFDWixRQUFRLEdBQUcsQ0FBQzs7UUFDWixNQUFNLEdBQWdCLENBQUMsR0FBRyxXQUFXLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUk7O1FBQ3BFLE1BQU0sR0FBZ0IsQ0FBQyxHQUFHLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSTtJQUN4RSxPQUFPLE1BQU0sS0FBSyxJQUFJLElBQUksTUFBTSxLQUFLLElBQUksRUFBRTtRQUN6QyxTQUFTLElBQUksY0FBYyxDQUFDLFFBQVEsRUFBRSxHQUFHLEVBQUUsZ0NBQWdDLENBQUMsQ0FBQztRQUM3RSxTQUFTLElBQUksY0FBYyxDQUFDLFFBQVEsRUFBRSxHQUFHLEVBQUUsZ0NBQWdDLENBQUMsQ0FBQzs7Y0FDdkUsUUFBUSxHQUFHLFFBQVEsR0FBRyxXQUFXLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsUUFBUSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTOztjQUNoRixRQUFRLEdBQUcsUUFBUSxHQUFHLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxRQUFRLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVM7O1lBQ2xGLE1BQU0sR0FBZ0IsSUFBSTs7WUFDMUIsUUFBUSxHQUFRLFNBQVM7UUFDN0IsSUFBSSxNQUFNLEtBQUssTUFBTSxFQUFFO1lBQ3JCLGdFQUFnRTtZQUNoRSxRQUFRLElBQUksQ0FBQyxDQUFDO1lBQ2QsUUFBUSxJQUFJLENBQUMsQ0FBQztZQUNkLElBQUksUUFBUSxLQUFLLFFBQVEsRUFBRTtnQkFDekIsTUFBTSxHQUFHLE1BQU0sQ0FBQztnQkFDaEIsUUFBUSxHQUFHLFFBQVEsQ0FBQzthQUNyQjtTQUNGO2FBQU0sSUFBSSxNQUFNLEtBQUssSUFBSSxJQUFJLE1BQU0sS0FBSyxJQUFJLElBQUksTUFBTSxHQUFHLG1CQUFBLE1BQU0sRUFBRSxFQUFFO1lBQ2xFLCtFQUErRTtZQUMvRSxRQUFRLElBQUksQ0FBQyxDQUFDO1lBQ2QsTUFBTSxHQUFHLE1BQU0sQ0FBQztTQUNqQjthQUFNO1lBQ0wsd0VBQXdFO1lBQ3hFLFNBQVMsSUFBSSxhQUFhLENBQUMsTUFBTSxFQUFFLCtCQUErQixDQUFDLENBQUM7WUFDcEUsUUFBUSxJQUFJLENBQUMsQ0FBQztZQUNkLE1BQU0sR0FBRyxNQUFNLENBQUM7WUFDaEIsUUFBUSxHQUFHLFFBQVEsQ0FBQztTQUNyQjtRQUNELElBQUksTUFBTSxLQUFLLElBQUksRUFBRTtZQUNuQixhQUFhLENBQUMsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsUUFBUSxFQUFFLE1BQU0sRUFBRSxRQUFRLEVBQUUsWUFBWSxFQUFFLFlBQVksQ0FBQyxDQUFDO1NBQzVGO1FBQ0QsTUFBTSxHQUFHLFFBQVEsR0FBRyxXQUFXLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztRQUN0RSxNQUFNLEdBQUcsUUFBUSxHQUFHLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO0tBQ3ZFO0FBQ0gsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQW1CRCxTQUFTLGFBQWEsQ0FDbEIsS0FBWSxFQUFFLEtBQVksRUFBRSxLQUFZLEVBQUUsUUFBbUIsRUFBRSxJQUFZLEVBQzNFLEtBQTBDLEVBQUUsWUFBcUIsRUFBRSxZQUFvQjtJQUN6RixJQUFJLEtBQUssQ0FBQyxJQUFJLG9CQUFzQixFQUFFO1FBQ3BDLHlFQUF5RTtRQUN6RSw2RUFBNkU7UUFDN0UsT0FBTztLQUNSOztVQUNLLEtBQUssR0FBRyxLQUFLLENBQUMsSUFBSTs7VUFDbEIsTUFBTSxHQUFHLG1CQUFBLEtBQUssQ0FBQyxZQUFZLEdBQUcsQ0FBQyxDQUFDLEVBQWlCOztVQUNqRCxtQkFBbUIsR0FBRyw2QkFBNkIsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO1FBQy9ELGdCQUFnQixDQUFDLEtBQUssRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxvQkFBb0IsQ0FBQyxNQUFNLENBQUMsRUFBRSxZQUFZLENBQUMsQ0FBQyxDQUFDO1FBQ3pGLFNBQVM7SUFDYixJQUFJLENBQUMscUJBQXFCLENBQUMsbUJBQW1CLENBQUMsRUFBRTtRQUMvQyx3RUFBd0U7UUFDeEUsSUFBSSxDQUFDLHFCQUFxQixDQUFDLEtBQUssQ0FBQyxFQUFFO1lBQ2pDLHFFQUFxRTtZQUNyRSxJQUFJLDZCQUE2QixDQUFDLE1BQU0sQ0FBQyxFQUFFO2dCQUN6Qyx3REFBd0Q7Z0JBQ3hELEtBQUssR0FBRyxnQkFBZ0IsQ0FBQyxLQUFLLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsWUFBWSxFQUFFLFlBQVksQ0FBQyxDQUFDO2FBQ2hGO1NBQ0Y7O2NBQ0ssS0FBSyxHQUFHLG1CQUFBLGdCQUFnQixDQUFDLGdCQUFnQixFQUFFLEVBQUUsS0FBSyxDQUFDLEVBQVk7UUFDckUsWUFBWSxDQUFDLFFBQVEsRUFBRSxZQUFZLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQztLQUMxRDtBQUNILENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUErQkQsU0FBUyxnQkFBZ0IsQ0FDckIsS0FBWSxFQUFFLEtBQW1CLEVBQUUsS0FBWSxFQUFFLElBQVksRUFBRSxLQUFhLEVBQzVFLFlBQXFCOztRQUNuQixLQUFLLEdBQVEsU0FBUztJQUMxQixPQUFPLEtBQUssR0FBRyxDQUFDLEVBQUU7O2NBQ1YsTUFBTSxHQUFHLG1CQUFBLEtBQUssQ0FBQyxLQUFLLENBQUMsRUFBZTs7Y0FDcEMsZUFBZSxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDOzs7Y0FFdkMsR0FBRyxHQUFHLGVBQWUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxtQkFBQSxNQUFNLEVBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNOztZQUMxRCxZQUFZLEdBQUcsR0FBRyxLQUFLLElBQUksQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUNyQyxHQUFHLEtBQUssSUFBSSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTO1FBQzdFLElBQUksZUFBZSxJQUFJLENBQUMscUJBQXFCLENBQUMsWUFBWSxDQUFDLEVBQUU7WUFDM0QsWUFBWSxHQUFHLFdBQVcsQ0FBQyxtQkFBQSxNQUFNLEVBQWlCLEVBQUUsSUFBSSxDQUFDLENBQUM7U0FDM0Q7UUFDRCxJQUFJLHFCQUFxQixDQUFDLFlBQVksQ0FBQyxFQUFFO1lBQ3ZDLEtBQUssR0FBRyxZQUFZLENBQUM7WUFDckIsSUFBSSxLQUFLLEtBQUssSUFBSSxFQUFFO2dCQUNsQixPQUFPLEtBQUssQ0FBQzthQUNkO1NBQ0Y7O2NBQ0ssTUFBTSxHQUFHLG1CQUFBLEtBQUssQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLEVBQWlCO1FBQ2hELEtBQUssR0FBRyxLQUFLLEtBQUssSUFBSSxDQUFDLENBQUMsQ0FBQyxvQkFBb0IsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsb0JBQW9CLENBQUMsTUFBTSxDQUFDLENBQUM7S0FDdEY7SUFDRCxJQUFJLEtBQUssS0FBSyxJQUFJLEVBQUU7Ozs7WUFHZCxRQUFRLEdBQUcsWUFBWSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsY0FBYztRQUMxRSxJQUFJLFFBQVEsSUFBSSxJQUFJLENBQUMsaUNBQWlDLEVBQUU7WUFDdEQsS0FBSyxHQUFHLFdBQVcsQ0FBQyxtQkFBQSxRQUFRLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQztTQUN2QztLQUNGO0lBQ0QsT0FBTyxLQUFLLENBQUM7QUFDZixDQUFDOzs7Ozs7OztBQVFELFNBQVMscUJBQXFCLENBQUMsS0FBVTtJQUN2QywrRkFBK0Y7SUFDL0YsNkZBQTZGO0lBQzdGLHlDQUF5QztJQUN6QywyRkFBMkY7SUFDM0YsT0FBTyxLQUFLLEtBQUssU0FBUyxDQUFDO0FBQzdCLENBQUM7Ozs7Ozs7Ozs7O0FBV0QsTUFBTSxVQUFVLCtCQUErQixDQUFDLEtBQVk7SUFDMUQsU0FBUyxJQUFJLFdBQVcsQ0FBQyxLQUFLLENBQUMsZUFBZSxFQUFFLFNBQVMsRUFBRSxzQkFBc0IsQ0FBQyxDQUFDO0lBQ25GLFNBQVMsSUFBSSxXQUFXLENBQUMsS0FBSyxDQUFDLGNBQWMsRUFBRSxTQUFTLEVBQUUsc0JBQXNCLENBQUMsQ0FBQzs7UUFDOUUsUUFBUSxHQUF1QixJQUFJOztRQUNuQyxRQUFRLEdBQXVCLElBQUk7O1VBQ2pDLFVBQVUsR0FBRyxLQUFLLENBQUMsV0FBVyxJQUFJLG1CQUFBLFdBQVcsRUFBZTs7UUFDOUQsSUFBSSw4QkFBc0Q7SUFDOUQsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7O1lBQ3RDLElBQUksR0FBRyxVQUFVLENBQUMsQ0FBQyxDQUFDO1FBQ3hCLElBQUksT0FBTyxJQUFJLEtBQUssUUFBUSxFQUFFO1lBQzVCLElBQUksR0FBRyxJQUFJLENBQUM7U0FDYjthQUFNLElBQUksSUFBSSxvQkFBNEIsRUFBRTtZQUMzQyxRQUFRLEdBQUcsUUFBUSxJQUFJLG1CQUFBLEVBQUUsRUFBTyxDQUFDO1lBQ2pDLFdBQVcsQ0FBQyxtQkFBQSxRQUFRLEVBQUUsRUFBRSxtQkFBQSxJQUFJLEVBQVUsRUFBRSxJQUFJLENBQUMsQ0FBQztTQUMvQzthQUFNLElBQUksSUFBSSxtQkFBMkIsRUFBRTtZQUMxQyxRQUFRLEdBQUcsUUFBUSxJQUFJLG1CQUFBLEVBQUUsRUFBTyxDQUFDO1lBQ2pDLFdBQVcsQ0FBQyxtQkFBQSxRQUFRLEVBQUUsRUFBRSxtQkFBQSxJQUFJLEVBQVUsRUFBRSxtQkFBQSxVQUFVLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBVSxDQUFDLENBQUM7U0FDcEU7S0FDRjtJQUNELEtBQUssQ0FBQyxlQUFlLEdBQUcsUUFBUSxDQUFDO0lBQ2pDLEtBQUssQ0FBQyxjQUFjLEdBQUcsUUFBUSxDQUFDO0FBQ2xDLENBQUM7Ozs7Ozs7OztBQVNELFNBQVMsa0NBQWtDLENBQ3ZDLEtBQVUsRUFBRSxpQkFBMEQ7SUFFeEUsSUFBSSxLQUFLLEtBQUssSUFBSSxJQUFJLEtBQUssS0FBSyxTQUFTLEVBQUU7UUFDekMsYUFBYTtLQUNkO1NBQU0sSUFBSSxPQUFPLGlCQUFpQixLQUFLLFVBQVUsRUFBRTtRQUNsRCxzQkFBc0I7UUFDdEIsS0FBSyxHQUFHLGlCQUFpQixDQUFDLEtBQUssQ0FBQyxDQUFDO0tBQ2xDO1NBQU0sSUFBSSxPQUFPLGlCQUFpQixLQUFLLFFBQVEsRUFBRTtRQUNoRCxLQUFLLEdBQUcsS0FBSyxHQUFHLGlCQUFpQixDQUFDO0tBQ25DO1NBQU0sSUFBSSxPQUFPLEtBQUssS0FBSyxRQUFRLEVBQUU7UUFDcEMsS0FBSyxHQUFHLFNBQVMsQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztLQUMzQztJQUNELE9BQU8sS0FBSyxDQUFDO0FBQ2YsQ0FBQzs7Ozs7Ozs7Ozs7QUFZRCxNQUFNLFVBQVUscUJBQXFCLENBQUMsS0FBWSxFQUFFLFlBQXFCO0lBQ3ZFLE9BQU8sQ0FBQyxLQUFLLENBQUMsS0FBSyxHQUFHLENBQUMsWUFBWSxDQUFDLENBQUMsd0JBQTBCLENBQUMsdUJBQXlCLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUNwRyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4qIEBsaWNlbnNlXG4qIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuKlxuKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4qL1xuXG5pbXBvcnQge1NhZmVWYWx1ZSwgdW53cmFwU2FmZVZhbHVlfSBmcm9tICcuLi8uLi9zYW5pdGl6YXRpb24vYnlwYXNzJztcbmltcG9ydCB7c3R5bGVQcm9wTmVlZHNTYW5pdGl6YXRpb24sIMm1ybVzYW5pdGl6ZVN0eWxlfSBmcm9tICcuLi8uLi9zYW5pdGl6YXRpb24vc2FuaXRpemF0aW9uJztcbmltcG9ydCB7U3R5bGVTYW5pdGl6ZUZufSBmcm9tICcuLi8uLi9zYW5pdGl6YXRpb24vc3R5bGVfc2FuaXRpemVyJztcbmltcG9ydCB7QXJyYXlNYXAsIGFycmF5TWFwR2V0LCBhcnJheU1hcFNldH0gZnJvbSAnLi4vLi4vdXRpbC9hcnJheV91dGlscyc7XG5pbXBvcnQge2Fzc2VydERlZmluZWQsIGFzc2VydEVxdWFsLCBhc3NlcnRHcmVhdGVyVGhhbk9yRXF1YWwsIGFzc2VydExlc3NUaGFuLCBhc3NlcnROb3RFcXVhbCwgYXNzZXJ0Tm90U2FtZSwgdGhyb3dFcnJvcn0gZnJvbSAnLi4vLi4vdXRpbC9hc3NlcnQnO1xuaW1wb3J0IHtFTVBUWV9BUlJBWX0gZnJvbSAnLi4vLi4vdXRpbC9lbXB0eSc7XG5pbXBvcnQge2NvbmNhdFN0cmluZ3NXaXRoU3BhY2UsIHN0cmluZ2lmeX0gZnJvbSAnLi4vLi4vdXRpbC9zdHJpbmdpZnknO1xuaW1wb3J0IHthc3NlcnRGaXJzdFVwZGF0ZVBhc3N9IGZyb20gJy4uL2Fzc2VydCc7XG5pbXBvcnQge2JpbmRpbmdVcGRhdGVkfSBmcm9tICcuLi9iaW5kaW5ncyc7XG5pbXBvcnQge0RpcmVjdGl2ZURlZn0gZnJvbSAnLi4vaW50ZXJmYWNlcy9kZWZpbml0aW9uJztcbmltcG9ydCB7QXR0cmlidXRlTWFya2VyLCBEaXJlY3RpdmVEZWZzLCBUQXR0cmlidXRlcywgVE5vZGUsIFROb2RlRmxhZ3MsIFROb2RlVHlwZX0gZnJvbSAnLi4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7UkVsZW1lbnQsIFJlbmRlcmVyM30gZnJvbSAnLi4vaW50ZXJmYWNlcy9yZW5kZXJlcic7XG5pbXBvcnQge1Nhbml0aXplckZufSBmcm9tICcuLi9pbnRlcmZhY2VzL3Nhbml0aXphdGlvbic7XG5pbXBvcnQge1RTdHlsaW5nS2V5LCBUU3R5bGluZ1JhbmdlLCBnZXRUU3R5bGluZ1JhbmdlTmV4dCwgZ2V0VFN0eWxpbmdSYW5nZU5leHREdXBsaWNhdGUsIGdldFRTdHlsaW5nUmFuZ2VQcmV2LCBnZXRUU3R5bGluZ1JhbmdlUHJldkR1cGxpY2F0ZX0gZnJvbSAnLi4vaW50ZXJmYWNlcy9zdHlsaW5nJztcbmltcG9ydCB7SEVBREVSX09GRlNFVCwgTFZpZXcsIFJFTkRFUkVSLCBURGF0YSwgVFZJRVcsIFRWaWV3fSBmcm9tICcuLi9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHthcHBseVN0eWxpbmd9IGZyb20gJy4uL25vZGVfbWFuaXB1bGF0aW9uJztcbmltcG9ydCB7Z2V0Q3VycmVudERpcmVjdGl2ZUluZGV4LCBnZXRDdXJyZW50U3R5bGVTYW5pdGl6ZXIsIGdldExWaWV3LCBnZXRTZWxlY3RlZEluZGV4LCBpbmNyZW1lbnRCaW5kaW5nSW5kZXgsIHNldEN1cnJlbnRTdHlsZVNhbml0aXplcn0gZnJvbSAnLi4vc3RhdGUnO1xuaW1wb3J0IHtpbnNlcnRUU3R5bGluZ0JpbmRpbmd9IGZyb20gJy4uL3N0eWxpbmcvc3R5bGVfYmluZGluZ19saXN0JztcbmltcG9ydCB7Z2V0TGFzdFBhcnNlZEtleSwgZ2V0TGFzdFBhcnNlZFZhbHVlLCBwYXJzZUNsYXNzTmFtZSwgcGFyc2VDbGFzc05hbWVOZXh0LCBwYXJzZVN0eWxlLCBwYXJzZVN0eWxlTmV4dH0gZnJvbSAnLi4vc3R5bGluZy9zdHlsaW5nX3BhcnNlcic7XG5pbXBvcnQge05PX0NIQU5HRX0gZnJvbSAnLi4vdG9rZW5zJztcbmltcG9ydCB7Z2V0TmF0aXZlQnlJbmRleH0gZnJvbSAnLi4vdXRpbC92aWV3X3V0aWxzJztcbmltcG9ydCB7c2V0RGlyZWN0aXZlSW5wdXRzV2hpY2hTaGFkb3dzU3R5bGluZ30gZnJvbSAnLi9wcm9wZXJ0eSc7XG5cblxuLyoqXG4gKiBTZXRzIHRoZSBjdXJyZW50IHN0eWxlIHNhbml0aXplciBmdW5jdGlvbiB3aGljaCB3aWxsIHRoZW4gYmUgdXNlZFxuICogd2l0aGluIGFsbCBmb2xsb3ctdXAgcHJvcCBhbmQgbWFwLWJhc2VkIHN0eWxlIGJpbmRpbmcgaW5zdHJ1Y3Rpb25zXG4gKiBmb3IgdGhlIGdpdmVuIGVsZW1lbnQuXG4gKlxuICogTm90ZSB0aGF0IG9uY2Ugc3R5bGluZyBoYXMgYmVlbiBhcHBsaWVkIHRvIHRoZSBlbGVtZW50IChpLmUuIG9uY2VcbiAqIGBhZHZhbmNlKG4pYCBpcyBleGVjdXRlZCBvciB0aGUgaG9zdEJpbmRpbmdzL3RlbXBsYXRlIGZ1bmN0aW9uIGV4aXRzKVxuICogdGhlbiB0aGUgYWN0aXZlIGBzYW5pdGl6ZXJGbmAgd2lsbCBiZSBzZXQgdG8gYG51bGxgLiBUaGlzIG1lYW5zIHRoYXRcbiAqIG9uY2Ugc3R5bGluZyBpcyBhcHBsaWVkIHRvIGFub3RoZXIgZWxlbWVudCB0aGVuIGEgYW5vdGhlciBjYWxsIHRvXG4gKiBgc3R5bGVTYW5pdGl6ZXJgIHdpbGwgbmVlZCB0byBiZSBtYWRlLlxuICpcbiAqIEBwYXJhbSBzYW5pdGl6ZXJGbiBUaGUgc2FuaXRpemF0aW9uIGZ1bmN0aW9uIHRoYXQgd2lsbCBiZSB1c2VkIHRvXG4gKiAgICAgICBwcm9jZXNzIHN0eWxlIHByb3AvdmFsdWUgZW50cmllcy5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtXN0eWxlU2FuaXRpemVyKHNhbml0aXplcjogU3R5bGVTYW5pdGl6ZUZuIHwgbnVsbCk6IHZvaWQge1xuICBzZXRDdXJyZW50U3R5bGVTYW5pdGl6ZXIoc2FuaXRpemVyKTtcbn1cblxuLyoqXG4gKiBVcGRhdGUgYSBzdHlsZSBiaW5kaW5nIG9uIGFuIGVsZW1lbnQgd2l0aCB0aGUgcHJvdmlkZWQgdmFsdWUuXG4gKlxuICogSWYgdGhlIHN0eWxlIHZhbHVlIGlzIGZhbHN5IHRoZW4gaXQgd2lsbCBiZSByZW1vdmVkIGZyb20gdGhlIGVsZW1lbnRcbiAqIChvciBhc3NpZ25lZCBhIGRpZmZlcmVudCB2YWx1ZSBkZXBlbmRpbmcgaWYgdGhlcmUgYXJlIGFueSBzdHlsZXMgcGxhY2VkXG4gKiBvbiB0aGUgZWxlbWVudCB3aXRoIGBzdHlsZU1hcGAgb3IgYW55IHN0YXRpYyBzdHlsZXMgdGhhdCBhcmVcbiAqIHByZXNlbnQgZnJvbSB3aGVuIHRoZSBlbGVtZW50IHdhcyBjcmVhdGVkIHdpdGggYHN0eWxpbmdgKS5cbiAqXG4gKiBOb3RlIHRoYXQgdGhlIHN0eWxpbmcgZWxlbWVudCBpcyB1cGRhdGVkIGFzIHBhcnQgb2YgYHN0eWxpbmdBcHBseWAuXG4gKlxuICogQHBhcmFtIHByb3AgQSB2YWxpZCBDU1MgcHJvcGVydHkuXG4gKiBAcGFyYW0gdmFsdWUgTmV3IHZhbHVlIHRvIHdyaXRlIChgbnVsbGAgb3IgYW4gZW1wdHkgc3RyaW5nIHRvIHJlbW92ZSkuXG4gKiBAcGFyYW0gc3VmZml4IE9wdGlvbmFsIHN1ZmZpeC4gVXNlZCB3aXRoIHNjYWxhciB2YWx1ZXMgdG8gYWRkIHVuaXQgc3VjaCBhcyBgcHhgLlxuICogICAgICAgIE5vdGUgdGhhdCB3aGVuIGEgc3VmZml4IGlzIHByb3ZpZGVkIHRoZW4gdGhlIHVuZGVybHlpbmcgc2FuaXRpemVyIHdpbGxcbiAqICAgICAgICBiZSBpZ25vcmVkLlxuICpcbiAqIE5vdGUgdGhhdCB0aGlzIHdpbGwgYXBwbHkgdGhlIHByb3ZpZGVkIHN0eWxlIHZhbHVlIHRvIHRoZSBob3N0IGVsZW1lbnQgaWYgdGhpcyBmdW5jdGlvbiBpcyBjYWxsZWRcbiAqIHdpdGhpbiBhIGhvc3QgYmluZGluZyBmdW5jdGlvbi5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtXN0eWxlUHJvcChcbiAgICBwcm9wOiBzdHJpbmcsIHZhbHVlOiBzdHJpbmcgfCBudW1iZXIgfCBTYWZlVmFsdWUgfCB1bmRlZmluZWQgfCBudWxsLFxuICAgIHN1ZmZpeD86IHN0cmluZyB8IG51bGwpOiB0eXBlb2YgybXJtXN0eWxlUHJvcCB7XG4gIGNoZWNrU3R5bGluZ1Byb3BlcnR5KHByb3AsIHZhbHVlLCBzdWZmaXgsIGZhbHNlKTtcbiAgcmV0dXJuIMm1ybVzdHlsZVByb3A7XG59XG5cbi8qKlxuICogVXBkYXRlIGEgY2xhc3MgYmluZGluZyBvbiBhbiBlbGVtZW50IHdpdGggdGhlIHByb3ZpZGVkIHZhbHVlLlxuICpcbiAqIFRoaXMgaW5zdHJ1Y3Rpb24gaXMgbWVhbnQgdG8gaGFuZGxlIHRoZSBgW2NsYXNzLmZvb109XCJleHBcImAgY2FzZSBhbmQsXG4gKiB0aGVyZWZvcmUsIHRoZSBjbGFzcyBiaW5kaW5nIGl0c2VsZiBtdXN0IGFscmVhZHkgYmUgYWxsb2NhdGVkIHVzaW5nXG4gKiBgc3R5bGluZ2Agd2l0aGluIHRoZSBjcmVhdGlvbiBibG9jay5cbiAqXG4gKiBAcGFyYW0gcHJvcCBBIHZhbGlkIENTUyBjbGFzcyAob25seSBvbmUpLlxuICogQHBhcmFtIHZhbHVlIEEgdHJ1ZS9mYWxzZSB2YWx1ZSB3aGljaCB3aWxsIHR1cm4gdGhlIGNsYXNzIG9uIG9yIG9mZi5cbiAqXG4gKiBOb3RlIHRoYXQgdGhpcyB3aWxsIGFwcGx5IHRoZSBwcm92aWRlZCBjbGFzcyB2YWx1ZSB0byB0aGUgaG9zdCBlbGVtZW50IGlmIHRoaXMgZnVuY3Rpb25cbiAqIGlzIGNhbGxlZCB3aXRoaW4gYSBob3N0IGJpbmRpbmcgZnVuY3Rpb24uXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVjbGFzc1Byb3AoXG4gICAgY2xhc3NOYW1lOiBzdHJpbmcsIHZhbHVlOiBib29sZWFuIHwgdW5kZWZpbmVkIHwgbnVsbCk6IHR5cGVvZiDJtcm1Y2xhc3NQcm9wIHtcbiAgY2hlY2tTdHlsaW5nUHJvcGVydHkoY2xhc3NOYW1lLCB2YWx1ZSwgbnVsbCwgdHJ1ZSk7XG4gIHJldHVybiDJtcm1Y2xhc3NQcm9wO1xufVxuXG5cbi8qKlxuICogVXBkYXRlIHN0eWxlIGJpbmRpbmdzIHVzaW5nIGFuIG9iamVjdCBsaXRlcmFsIG9uIGFuIGVsZW1lbnQuXG4gKlxuICogVGhpcyBpbnN0cnVjdGlvbiBpcyBtZWFudCB0byBhcHBseSBzdHlsaW5nIHZpYSB0aGUgYFtzdHlsZV09XCJleHBcImAgdGVtcGxhdGUgYmluZGluZ3MuXG4gKiBXaGVuIHN0eWxlcyBhcmUgYXBwbGllZCB0byB0aGUgZWxlbWVudCB0aGV5IHdpbGwgdGhlbiBiZSB1cGRhdGVkIHdpdGggcmVzcGVjdCB0b1xuICogYW55IHN0eWxlcy9jbGFzc2VzIHNldCB2aWEgYHN0eWxlUHJvcGAuIElmIGFueSBzdHlsZXMgYXJlIHNldCB0byBmYWxzeVxuICogdGhlbiB0aGV5IHdpbGwgYmUgcmVtb3ZlZCBmcm9tIHRoZSBlbGVtZW50LlxuICpcbiAqIE5vdGUgdGhhdCB0aGUgc3R5bGluZyBpbnN0cnVjdGlvbiB3aWxsIG5vdCBiZSBhcHBsaWVkIHVudGlsIGBzdHlsaW5nQXBwbHlgIGlzIGNhbGxlZC5cbiAqXG4gKiBAcGFyYW0gc3R5bGVzIEEga2V5L3ZhbHVlIHN0eWxlIG1hcCBvZiB0aGUgc3R5bGVzIHRoYXQgd2lsbCBiZSBhcHBsaWVkIHRvIHRoZSBnaXZlbiBlbGVtZW50LlxuICogICAgICAgIEFueSBtaXNzaW5nIHN0eWxlcyAodGhhdCBoYXZlIGFscmVhZHkgYmVlbiBhcHBsaWVkIHRvIHRoZSBlbGVtZW50IGJlZm9yZWhhbmQpIHdpbGwgYmVcbiAqICAgICAgICByZW1vdmVkICh1bnNldCkgZnJvbSB0aGUgZWxlbWVudCdzIHN0eWxpbmcuXG4gKlxuICogTm90ZSB0aGF0IHRoaXMgd2lsbCBhcHBseSB0aGUgcHJvdmlkZWQgc3R5bGVNYXAgdmFsdWUgdG8gdGhlIGhvc3QgZWxlbWVudCBpZiB0aGlzIGZ1bmN0aW9uXG4gKiBpcyBjYWxsZWQgd2l0aGluIGEgaG9zdCBiaW5kaW5nLlxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1c3R5bGVNYXAoXG4gICAgc3R5bGVzOiB7W3N0eWxlTmFtZTogc3RyaW5nXTogYW55fSB8IE1hcDxzdHJpbmcsIHN0cmluZ3xudW1iZXJ8bnVsbHx1bmRlZmluZWQ+fCBzdHJpbmcgfFxuICAgIHVuZGVmaW5lZCB8IG51bGwpOiB2b2lkIHtcbiAgY2hlY2tTdHlsaW5nTWFwKHN0eWxlQXJyYXlNYXBTZXQsIHN0eWxlU3RyaW5nUGFyc2VyLCBzdHlsZXMsIGZhbHNlKTtcbn1cblxuXG4vKipcbiAqIFBhcnNlIHRleHQgYXMgc3R5bGUgYW5kIGFkZCB2YWx1ZXMgdG8gQXJyYXlNYXAuXG4gKlxuICogVGhpcyBjb2RlIGlzIHB1bGxlZCBvdXQgdG8gYSBzZXBhcmF0ZSBmdW5jdGlvbiBzbyB0aGF0IGl0IGNhbiBiZSB0cmVlIHNoYWtlbiBhd2F5IGlmIGl0IGlzIG5vdFxuICogbmVlZGVkLiBJdCBpcyBvbmx5IHJlZmVyZW5jZSBmcm9tIGDJtcm1c3R5bGVNYXBgLlxuICpcbiAqIEBwYXJhbSBhcnJheU1hcCBBcnJheU1hcCB0byBhZGQgcGFyc2VkIHZhbHVlcyB0by5cbiAqIEBwYXJhbSB0ZXh0IHRleHQgdG8gcGFyc2UuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzdHlsZVN0cmluZ1BhcnNlcihhcnJheU1hcDogQXJyYXlNYXA8YW55PiwgdGV4dDogc3RyaW5nKTogdm9pZCB7XG4gIGZvciAobGV0IGkgPSBwYXJzZVN0eWxlKHRleHQpOyBpID49IDA7IGkgPSBwYXJzZVN0eWxlTmV4dCh0ZXh0LCBpKSkge1xuICAgIHN0eWxlQXJyYXlNYXBTZXQoYXJyYXlNYXAsIGdldExhc3RQYXJzZWRLZXkodGV4dCksIGdldExhc3RQYXJzZWRWYWx1ZSh0ZXh0KSk7XG4gIH1cbn1cblxuXG4vKipcbiAqIFVwZGF0ZSBjbGFzcyBiaW5kaW5ncyB1c2luZyBhbiBvYmplY3QgbGl0ZXJhbCBvciBjbGFzcy1zdHJpbmcgb24gYW4gZWxlbWVudC5cbiAqXG4gKiBUaGlzIGluc3RydWN0aW9uIGlzIG1lYW50IHRvIGFwcGx5IHN0eWxpbmcgdmlhIHRoZSBgW2NsYXNzXT1cImV4cFwiYCB0ZW1wbGF0ZSBiaW5kaW5ncy5cbiAqIFdoZW4gY2xhc3NlcyBhcmUgYXBwbGllZCB0byB0aGUgZWxlbWVudCB0aGV5IHdpbGwgdGhlbiBiZSB1cGRhdGVkIHdpdGhcbiAqIHJlc3BlY3QgdG8gYW55IHN0eWxlcy9jbGFzc2VzIHNldCB2aWEgYGNsYXNzUHJvcGAuIElmIGFueVxuICogY2xhc3NlcyBhcmUgc2V0IHRvIGZhbHN5IHRoZW4gdGhleSB3aWxsIGJlIHJlbW92ZWQgZnJvbSB0aGUgZWxlbWVudC5cbiAqXG4gKiBOb3RlIHRoYXQgdGhlIHN0eWxpbmcgaW5zdHJ1Y3Rpb24gd2lsbCBub3QgYmUgYXBwbGllZCB1bnRpbCBgc3R5bGluZ0FwcGx5YCBpcyBjYWxsZWQuXG4gKiBOb3RlIHRoYXQgdGhpcyB3aWxsIHRoZSBwcm92aWRlZCBjbGFzc01hcCB2YWx1ZSB0byB0aGUgaG9zdCBlbGVtZW50IGlmIHRoaXMgZnVuY3Rpb24gaXMgY2FsbGVkXG4gKiB3aXRoaW4gYSBob3N0IGJpbmRpbmcuXG4gKlxuICogQHBhcmFtIGNsYXNzZXMgQSBrZXkvdmFsdWUgbWFwIG9yIHN0cmluZyBvZiBDU1MgY2xhc3NlcyB0aGF0IHdpbGwgYmUgYWRkZWQgdG8gdGhlXG4gKiAgICAgICAgZ2l2ZW4gZWxlbWVudC4gQW55IG1pc3NpbmcgY2xhc3NlcyAodGhhdCBoYXZlIGFscmVhZHkgYmVlbiBhcHBsaWVkIHRvIHRoZSBlbGVtZW50XG4gKiAgICAgICAgYmVmb3JlaGFuZCkgd2lsbCBiZSByZW1vdmVkICh1bnNldCkgZnJvbSB0aGUgZWxlbWVudCdzIGxpc3Qgb2YgQ1NTIGNsYXNzZXMuXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVjbGFzc01hcChcbiAgICBjbGFzc2VzOiB7W2NsYXNzTmFtZTogc3RyaW5nXTogYm9vbGVhbiB8IHVuZGVmaW5lZCB8IG51bGx9IHxcbiAgICBNYXA8c3RyaW5nLCBib29sZWFufHVuZGVmaW5lZHxudWxsPnwgU2V0PHN0cmluZz58IHN0cmluZ1tdIHwgc3RyaW5nIHwgdW5kZWZpbmVkIHwgbnVsbCk6IHZvaWQge1xuICBjaGVja1N0eWxpbmdNYXAoYXJyYXlNYXBTZXQsIGNsYXNzU3RyaW5nUGFyc2VyLCBjbGFzc2VzLCB0cnVlKTtcbn1cblxuLyoqXG4gKiBQYXJzZSB0ZXh0IGFzIGNsYXNzIGFuZCBhZGQgdmFsdWVzIHRvIEFycmF5TWFwLlxuICpcbiAqIFRoaXMgY29kZSBpcyBwdWxsZWQgb3V0IHRvIGEgc2VwYXJhdGUgZnVuY3Rpb24gc28gdGhhdCBpdCBjYW4gYmUgdHJlZSBzaGFrZW4gYXdheSBpZiBpdCBpcyBub3RcbiAqIG5lZWRlZC4gSXQgaXMgb25seSByZWZlcmVuY2UgZnJvbSBgybXJtWNsYXNzTWFwYC5cbiAqXG4gKiBAcGFyYW0gYXJyYXlNYXAgQXJyYXlNYXAgdG8gYWRkIHBhcnNlZCB2YWx1ZXMgdG8uXG4gKiBAcGFyYW0gdGV4dCB0ZXh0IHRvIHBhcnNlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY2xhc3NTdHJpbmdQYXJzZXIoYXJyYXlNYXA6IEFycmF5TWFwPGFueT4sIHRleHQ6IHN0cmluZyk6IHZvaWQge1xuICBmb3IgKGxldCBpID0gcGFyc2VDbGFzc05hbWUodGV4dCk7IGkgPj0gMDsgaSA9IHBhcnNlQ2xhc3NOYW1lTmV4dCh0ZXh0LCBpKSkge1xuICAgIGFycmF5TWFwU2V0KGFycmF5TWFwLCBnZXRMYXN0UGFyc2VkS2V5KHRleHQpLCB0cnVlKTtcbiAgfVxufVxuXG4vKipcbiAqIENvbW1vbiBjb2RlIGJldHdlZW4gYMm1ybVjbGFzc1Byb3BgIGFuZCBgybXJtXN0eWxlUHJvcGAuXG4gKlxuICogQHBhcmFtIHByb3AgcHJvcGVydHkgbmFtZS5cbiAqIEBwYXJhbSB2YWx1ZSBiaW5kaW5nIHZhbHVlLlxuICogQHBhcmFtIHN1ZmZpeE9yU2FuaXRpemVyIHN1ZmZpeCBvciBzYW5pdGl6YXRpb24gZnVuY3Rpb25cbiAqIEBwYXJhbSBpc0NsYXNzQmFzZWQgYHRydWVgIGlmIGBjbGFzc2AgY2hhbmdlIChgZmFsc2VgIGlmIGBzdHlsZWApXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjaGVja1N0eWxpbmdQcm9wZXJ0eShcbiAgICBwcm9wOiBzdHJpbmcsIHZhbHVlOiBhbnkgfCBOT19DSEFOR0UsXG4gICAgc3VmZml4T3JTYW5pdGl6ZXI6IFNhbml0aXplckZuIHwgc3RyaW5nIHwgdW5kZWZpbmVkIHwgbnVsbCwgaXNDbGFzc0Jhc2VkOiBib29sZWFuKTogdm9pZCB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgdFZpZXcgPSBsVmlld1tUVklFV107XG4gIC8vIFN0eWxpbmcgaW5zdHJ1Y3Rpb25zIHVzZSAyIHNsb3RzIHBlciBiaW5kaW5nLlxuICAvLyAxLiBvbmUgZm9yIHRoZSB2YWx1ZSAvIFRTdHlsaW5nS2V5XG4gIC8vIDIuIG9uZSBmb3IgdGhlIGludGVybWl0dGVudC12YWx1ZSAvIFRTdHlsaW5nUmFuZ2VcbiAgY29uc3QgYmluZGluZ0luZGV4ID0gaW5jcmVtZW50QmluZGluZ0luZGV4KDIpO1xuICBpZiAodFZpZXcuZmlyc3RVcGRhdGVQYXNzKSB7XG4gICAgc3R5bGluZ1Byb3BlcnR5Rmlyc3RVcGRhdGVQYXNzKHRWaWV3LCBwcm9wLCBiaW5kaW5nSW5kZXgsIGlzQ2xhc3NCYXNlZCk7XG4gIH1cbiAgaWYgKHZhbHVlICE9PSBOT19DSEFOR0UgJiYgYmluZGluZ1VwZGF0ZWQobFZpZXcsIGJpbmRpbmdJbmRleCwgdmFsdWUpKSB7XG4gICAgLy8gVGhpcyBpcyBhIHdvcmsgYXJvdW5kLiBPbmNlIFBSIzM0NDgwIGxhbmRzIHRoZSBzYW5pdGl6ZXIgaXMgcGFzc2VkIGV4cGxpY2l0bHkgYW5kIHRoaXMgbGluZVxuICAgIC8vIGNhbiBiZSByZW1vdmVkLlxuICAgIGxldCBzdHlsZVNhbml0aXplcjogU3R5bGVTYW5pdGl6ZUZufG51bGw7XG4gICAgaWYgKHN1ZmZpeE9yU2FuaXRpemVyID09IG51bGwpIHtcbiAgICAgIGlmIChzdHlsZVNhbml0aXplciA9IGdldEN1cnJlbnRTdHlsZVNhbml0aXplcigpKSB7XG4gICAgICAgIHN1ZmZpeE9yU2FuaXRpemVyID0gc3R5bGVTYW5pdGl6ZXIgYXMgYW55O1xuICAgICAgfVxuICAgIH1cbiAgICBjb25zdCB0Tm9kZSA9IHRWaWV3LmRhdGFbZ2V0U2VsZWN0ZWRJbmRleCgpICsgSEVBREVSX09GRlNFVF0gYXMgVE5vZGU7XG4gICAgdXBkYXRlU3R5bGluZyhcbiAgICAgICAgdFZpZXcsIHROb2RlLCBsVmlldywgbFZpZXdbUkVOREVSRVJdLCBwcm9wLFxuICAgICAgICBsVmlld1tiaW5kaW5nSW5kZXggKyAxXSA9IG5vcm1hbGl6ZUFuZEFwcGx5U3VmZml4T3JTYW5pdGl6ZXIodmFsdWUsIHN1ZmZpeE9yU2FuaXRpemVyKSxcbiAgICAgICAgaXNDbGFzc0Jhc2VkLCBiaW5kaW5nSW5kZXgpO1xuICB9XG59XG5cbi8qKlxuKiBDb21tb24gY29kZSBiZXR3ZWVuIGDJtcm1Y2xhc3NNYXBgIGFuZCBgybXJtXN0eWxlTWFwYC5cbipcbiogQHBhcmFtIHRTdHlsaW5nTWFwS2V5IFNlZSBgU1RZTEVfTUFQX1NUWUxJTkdfS0VZYCBhbmQgYENMQVNTX01BUF9TVFlMSU5HX0tFWWAuXG4qIEBwYXJhbSB2YWx1ZSBiaW5kaW5nIHZhbHVlLlxuKiBAcGFyYW0gaXNDbGFzc0Jhc2VkIGB0cnVlYCBpZiBgY2xhc3NgIGNoYW5nZSAoYGZhbHNlYCBpZiBgc3R5bGVgKVxuKi9cbmV4cG9ydCBmdW5jdGlvbiBjaGVja1N0eWxpbmdNYXAoXG4gICAgYXJyYXlNYXBTZXQ6IChhcnJheU1hcDogQXJyYXlNYXA8YW55Piwga2V5OiBzdHJpbmcsIHZhbHVlOiBhbnkpID0+IHZvaWQsXG4gICAgc3RyaW5nUGFyc2VyOiAoc3R5bGVBcnJheU1hcDogQXJyYXlNYXA8YW55PiwgdGV4dDogc3RyaW5nKSA9PiB2b2lkLCB2YWx1ZTogYW55fE5PX0NIQU5HRSxcbiAgICBpc0NsYXNzQmFzZWQ6IGJvb2xlYW4pOiB2b2lkIHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgY29uc3QgYmluZGluZ0luZGV4ID0gaW5jcmVtZW50QmluZGluZ0luZGV4KDIpO1xuICBpZiAodFZpZXcuZmlyc3RVcGRhdGVQYXNzKSB7XG4gICAgc3R5bGluZ1Byb3BlcnR5Rmlyc3RVcGRhdGVQYXNzKHRWaWV3LCBudWxsLCBiaW5kaW5nSW5kZXgsIGlzQ2xhc3NCYXNlZCk7XG4gIH1cbiAgaWYgKHZhbHVlICE9PSBOT19DSEFOR0UgJiYgYmluZGluZ1VwZGF0ZWQobFZpZXcsIGJpbmRpbmdJbmRleCwgdmFsdWUpKSB7XG4gICAgLy8gYGdldFNlbGVjdGVkSW5kZXgoKWAgc2hvdWxkIGJlIGhlcmUgKHJhdGhlciB0aGFuIGluIGluc3RydWN0aW9uKSBzbyB0aGF0IGl0IGlzIGd1YXJkZWQgYnkgdGhlXG4gICAgLy8gaWYgc28gYXMgbm90IHRvIHJlYWQgdW5uZWNlc3NhcmlseS5cbiAgICBjb25zdCB0Tm9kZSA9IHRWaWV3LmRhdGFbZ2V0U2VsZWN0ZWRJbmRleCgpICsgSEVBREVSX09GRlNFVF0gYXMgVE5vZGU7XG4gICAgaWYgKGhhc1N0eWxpbmdJbnB1dFNoYWRvdyh0Tm9kZSwgaXNDbGFzc0Jhc2VkKSAmJiAhaXNJbkhvc3RCaW5kaW5ncyh0VmlldywgYmluZGluZ0luZGV4KSkge1xuICAgICAgaWYgKG5nRGV2TW9kZSkge1xuICAgICAgICAvLyB2ZXJpZnkgdGhhdCBpZiB3ZSBhcmUgc2hhZG93aW5nIHRoZW4gYFREYXRhYCBpcyBhcHByb3ByaWF0ZWx5IG1hcmtlZCBzbyB0aGF0IHdlIHNraXBcbiAgICAgICAgLy8gcHJvY2Vzc2luZyB0aGlzIGJpbmRpbmcgaW4gc3R5bGluZyByZXNvbHV0aW9uLlxuICAgICAgICBjb25zdCB0U3R5bGluZ0tleSA9IHRWaWV3LmRhdGFbYmluZGluZ0luZGV4XTtcbiAgICAgICAgYXNzZXJ0RXF1YWwoXG4gICAgICAgICAgICBBcnJheS5pc0FycmF5KHRTdHlsaW5nS2V5KSA/IHRTdHlsaW5nS2V5WzFdIDogdFN0eWxpbmdLZXksIGZhbHNlLFxuICAgICAgICAgICAgJ1N0eWxpbmcgbGlua2VkIGxpc3Qgc2hhZG93IGlucHV0IHNob3VsZCBiZSBtYXJrZWQgYXMgXFwnZmFsc2VcXCcnKTtcbiAgICAgIH1cbiAgICAgIC8vIFZFIGRvZXMgbm90IGNvbmNhdGVuYXRlIHRoZSBzdGF0aWMgcG9ydGlvbiBsaWtlIHdlIGFyZSBkb2luZyBoZXJlLlxuICAgICAgLy8gSW5zdGVhZCBWRSBqdXN0IGlnbm9yZXMgdGhlIHN0YXRpYyBjb21wbGV0ZWx5IGlmIGR5bmFtaWMgYmluZGluZyBpcyBwcmVzZW50LlxuICAgICAgLy8gQmVjYXVzZSBvZiBsb2NhbGl0eSB3ZSBoYXZlIGFscmVhZHkgc2V0IHRoZSBzdGF0aWMgcG9ydGlvbiBiZWNhdXNlIHdlIGRvbid0IGtub3cgaWYgdGhlcmVcbiAgICAgIC8vIGlzIGEgZHluYW1pYyBwb3J0aW9uIHVudGlsIGxhdGVyLiBJZiB3ZSB3b3VsZCBpZ25vcmUgdGhlIHN0YXRpYyBwb3J0aW9uIGl0IHdvdWxkIGxvb2sgbGlrZVxuICAgICAgLy8gdGhhIHRoZSBiaW5kaW5nIGhhcyByZW1vdmVkIGl0LiBUaGlzIHdvdWxkIGNvbmZ1c2UgYFtuZ1N0eWxlXWAvYFtuZ0NsYXNzXWAgdG8gZG8gdGhlIHdyb25nXG4gICAgICAvLyB0aGluZyBhcyBpdCB3b3VsZCB0aGluayB0aGEgdGhlIHN0YXRpYyBwb3J0aW9uIHdhcyByZW1vdmVkLiBGb3IgdGhpcyByZWFzb24gd2VcbiAgICAgIC8vIGNvbmNhdGVuYXRlIGl0IHNvIHRoYXQgYFtuZ1N0eWxlXWAvYFtuZ0NsYXNzXWAgIGNhbiBjb250aW51ZSB0byB3b3JrIG9uIGNoYW5nZWQuXG4gICAgICBsZXQgc3RhdGljUHJlZml4ID0gaXNDbGFzc0Jhc2VkID8gdE5vZGUuY2xhc3NlcyA6IHROb2RlLnN0eWxlcztcbiAgICAgIG5nRGV2TW9kZSAmJiBpc0NsYXNzQmFzZWQgPT09IGZhbHNlICYmIHN0YXRpY1ByZWZpeCAhPT0gbnVsbCAmJlxuICAgICAgICAgIGFzc2VydEVxdWFsKFxuICAgICAgICAgICAgICBzdGF0aWNQcmVmaXguZW5kc1dpdGgoJzsnKSwgdHJ1ZSwgJ0V4cGVjdGluZyBzdGF0aWMgcG9ydGlvbiB0byBlbmQgd2l0aCBcXCc7XFwnJyk7XG4gICAgICBpZiAodHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJykge1xuICAgICAgICB2YWx1ZSA9IGNvbmNhdFN0cmluZ3NXaXRoU3BhY2Uoc3RhdGljUHJlZml4LCB2YWx1ZSBhcyBzdHJpbmcpO1xuICAgICAgfVxuICAgICAgLy8gR2l2ZW4gYDxkaXYgW3N0eWxlXSBteS1kaXI+YCBzdWNoIHRoYXQgYG15LWRpcmAgaGFzIGBASW5wdXQoJ3N0eWxlJylgLlxuICAgICAgLy8gVGhpcyB0YWtlcyBvdmVyIHRoZSBgW3N0eWxlXWAgYmluZGluZy4gKFNhbWUgZm9yIGBbY2xhc3NdYClcbiAgICAgIHNldERpcmVjdGl2ZUlucHV0c1doaWNoU2hhZG93c1N0eWxpbmcodE5vZGUsIGxWaWV3LCB2YWx1ZSwgaXNDbGFzc0Jhc2VkKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdXBkYXRlU3R5bGluZ01hcChcbiAgICAgICAgICB0VmlldywgdE5vZGUsIGxWaWV3LCBsVmlld1tSRU5ERVJFUl0sIGxWaWV3W2JpbmRpbmdJbmRleCArIDFdLFxuICAgICAgICAgIGxWaWV3W2JpbmRpbmdJbmRleCArIDFdID0gdG9TdHlsaW5nQXJyYXlNYXAoYXJyYXlNYXBTZXQsIHN0cmluZ1BhcnNlciwgdmFsdWUpLFxuICAgICAgICAgIGlzQ2xhc3NCYXNlZCwgYmluZGluZ0luZGV4KTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBEZXRlcm1pbmVzIHdoZW4gdGhlIGJpbmRpbmcgaXMgaW4gYGhvc3RCaW5kaW5nc2Agc2VjdGlvblxuICpcbiAqIEBwYXJhbSB0VmlldyBDdXJyZW50IGBUVmlld2BcbiAqIEBwYXJhbSBiaW5kaW5nSW5kZXggaW5kZXggb2YgYmluZGluZyB3aGljaCB3ZSB3b3VsZCBsaWtlIGlmIGl0IGlzIGluIGBob3N0QmluZGluZ3NgXG4gKi9cbmZ1bmN0aW9uIGlzSW5Ib3N0QmluZGluZ3ModFZpZXc6IFRWaWV3LCBiaW5kaW5nSW5kZXg6IG51bWJlcik6IGJvb2xlYW4ge1xuICAvLyBBbGwgaG9zdCBiaW5kaW5ncyBhcmUgcGxhY2VkIGFmdGVyIHRoZSBleHBhbmRvIHNlY3Rpb24uXG4gIHJldHVybiBiaW5kaW5nSW5kZXggPj0gdFZpZXcuZXhwYW5kb1N0YXJ0SW5kZXg7XG59XG5cbi8qKlxuKiBDb2xsZWN0cyB0aGUgbmVjZXNzYXJ5IGluZm9ybWF0aW9uIHRvIGluc2VydCB0aGUgYmluZGluZyBpbnRvIGEgbGlua2VkIGxpc3Qgb2Ygc3R5bGUgYmluZGluZ3NcbiogdXNpbmcgYGluc2VydFRTdHlsaW5nQmluZGluZ2AuXG4qXG4qIEBwYXJhbSB0VmlldyBgVFZpZXdgIHdoZXJlIHRoZSBiaW5kaW5nIGxpbmtlZCBsaXN0IHdpbGwgYmUgc3RvcmVkLlxuKiBAcGFyYW0gcHJvcCBQcm9wZXJ0eS9rZXkgb2YgdGhlIGJpbmRpbmcuXG4qIEBwYXJhbSBzdWZmaXggT3B0aW9uYWwgc3VmZml4IG9yIFNhbml0aXphdGlvbiBmdW5jdGlvbi5cbiogQHBhcmFtIGJpbmRpbmdJbmRleCBJbmRleCBvZiBiaW5kaW5nIGFzc29jaWF0ZWQgd2l0aCB0aGUgYHByb3BgXG4qIEBwYXJhbSBpc0NsYXNzQmFzZWQgYHRydWVgIGlmIGBjbGFzc2AgY2hhbmdlIChgZmFsc2VgIGlmIGBzdHlsZWApXG4qL1xuZnVuY3Rpb24gc3R5bGluZ1Byb3BlcnR5Rmlyc3RVcGRhdGVQYXNzKFxuICAgIHRWaWV3OiBUVmlldywgdFN0eWxpbmdLZXk6IFRTdHlsaW5nS2V5LCBiaW5kaW5nSW5kZXg6IG51bWJlciwgaXNDbGFzc0Jhc2VkOiBib29sZWFuKTogdm9pZCB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRGaXJzdFVwZGF0ZVBhc3ModFZpZXcpO1xuICBjb25zdCB0RGF0YSA9IHRWaWV3LmRhdGE7XG4gIGlmICh0RGF0YVtiaW5kaW5nSW5kZXggKyAxXSA9PT0gbnVsbCkge1xuICAgIC8vIFRoZSBhYm92ZSBjaGVjayBpcyBuZWNlc3NhcnkgYmVjYXVzZSB3ZSBkb24ndCBjbGVhciBmaXJzdCB1cGRhdGUgcGFzcyB1bnRpbCBmaXJzdCBzdWNjZXNzZnVsXG4gICAgLy8gKG5vIGV4Y2VwdGlvbikgdGVtcGxhdGUgZXhlY3V0aW9uLiBUaGlzIHByZXZlbnRzIHRoZSBzdHlsaW5nIGluc3RydWN0aW9uIGZyb20gZG91YmxlIGFkZGluZ1xuICAgIC8vIGl0c2VsZiB0byB0aGUgbGlzdC5cbiAgICAvLyBgZ2V0U2VsZWN0ZWRJbmRleCgpYCBzaG91bGQgYmUgaGVyZSAocmF0aGVyIHRoYW4gaW4gaW5zdHJ1Y3Rpb24pIHNvIHRoYXQgaXQgaXMgZ3VhcmRlZCBieSB0aGVcbiAgICAvLyBpZiBzbyBhcyBub3QgdG8gcmVhZCB1bm5lY2Vzc2FyaWx5LlxuICAgIGNvbnN0IHROb2RlID0gdERhdGFbZ2V0U2VsZWN0ZWRJbmRleCgpICsgSEVBREVSX09GRlNFVF0gYXMgVE5vZGU7XG4gICAgY29uc3QgaXNIb3N0QmluZGluZ3MgPSBpc0luSG9zdEJpbmRpbmdzKHRWaWV3LCBiaW5kaW5nSW5kZXgpO1xuICAgIGlmIChoYXNTdHlsaW5nSW5wdXRTaGFkb3codE5vZGUsIGlzQ2xhc3NCYXNlZCkgJiYgdFN0eWxpbmdLZXkgPT09IG51bGwgJiYgIWlzSG9zdEJpbmRpbmdzKSB7XG4gICAgICAvLyBgdFN0eWxpbmdLZXkgPT09IG51bGxgIGltcGxpZXMgdGhhdCB3ZSBhcmUgZWl0aGVyIGBbc3R5bGVdYCBvciBgW2NsYXNzXWAgYmluZGluZy5cbiAgICAgIC8vIElmIHRoZXJlIGlzIGEgZGlyZWN0aXZlIHdoaWNoIHVzZXMgYEBJbnB1dCgnc3R5bGUnKWAgb3IgYEBJbnB1dCgnY2xhc3MnKWAgdGhhblxuICAgICAgLy8gd2UgbmVlZCB0byBuZXV0cmFsaXplIHRoaXMgYmluZGluZyBzaW5jZSB0aGF0IGRpcmVjdGl2ZSBpcyBzaGFkb3dpbmcgaXQuXG4gICAgICAvLyBXZSB0dXJuIHRoaXMgaW50byBhIG5vb3AgYnkgc2V0dGluZyB0aGUga2V5IHRvIGBmYWxzZWBcbiAgICAgIHRTdHlsaW5nS2V5ID0gZmFsc2U7XG4gICAgfVxuICAgIHRTdHlsaW5nS2V5ID0gd3JhcEluU3RhdGljU3R5bGluZ0tleSh0RGF0YSwgdE5vZGUsIHRTdHlsaW5nS2V5LCBpc0NsYXNzQmFzZWQpO1xuICAgIGluc2VydFRTdHlsaW5nQmluZGluZyh0RGF0YSwgdE5vZGUsIHRTdHlsaW5nS2V5LCBiaW5kaW5nSW5kZXgsIGlzSG9zdEJpbmRpbmdzLCBpc0NsYXNzQmFzZWQpO1xuICB9XG59XG5cbi8qKlxuICogQWRkcyBzdGF0aWMgc3R5bGluZyBpbmZvcm1hdGlvbiB0byB0aGUgYmluZGluZyBpZiBhcHBsaWNhYmxlLlxuICpcbiAqIFRoZSBsaW5rZWQgbGlzdCBvZiBzdHlsZXMgbm90IG9ubHkgc3RvcmVzIHRoZSBsaXN0IGFuZCBrZXlzLCBidXQgYWxzbyBzdG9yZXMgc3RhdGljIHN0eWxpbmdcbiAqIGluZm9ybWF0aW9uIG9uIHNvbWUgb2YgdGhlIGtleXMuIFRoaXMgZnVuY3Rpb24gZGV0ZXJtaW5lcyBpZiB0aGUga2V5IHNob3VsZCBjb250YWluIHRoZSBzdHlsaW5nXG4gKiBpbmZvcm1hdGlvbiBhbmQgY29tcHV0ZXMgaXQuXG4gKlxuICogU2VlIGBUU3R5bGluZ1N0YXRpY2AgZm9yIG1vcmUgZGV0YWlscy5cbiAqXG4gKiBAcGFyYW0gdERhdGEgYFREYXRhYCB3aGVyZSB0aGUgbGlua2VkIGxpc3QgaXMgc3RvcmVkLlxuICogQHBhcmFtIHROb2RlIGBUTm9kZWAgZm9yIHdoaWNoIHRoZSBzdHlsaW5nIGlzIGJlaW5nIGNvbXB1dGVkLlxuICogQHBhcmFtIHN0eWxpbmdLZXkgYFRTdHlsaW5nS2V5UHJpbWl0aXZlYCB3aGljaCBtYXkgbmVlZCB0byBiZSB3cmFwcGVkIGludG8gYFRTdHlsaW5nS2V5YFxuICogQHBhcmFtIGlzQ2xhc3NCYXNlZCBgdHJ1ZWAgaWYgYGNsYXNzYCAoYGZhbHNlYCBpZiBgc3R5bGVgKVxuICovXG5leHBvcnQgZnVuY3Rpb24gd3JhcEluU3RhdGljU3R5bGluZ0tleShcbiAgICB0RGF0YTogVERhdGEsIHROb2RlOiBUTm9kZSwgc3R5bGluZ0tleTogVFN0eWxpbmdLZXksIGlzQ2xhc3NCYXNlZDogYm9vbGVhbik6IFRTdHlsaW5nS2V5IHtcbiAgY29uc3QgaG9zdERpcmVjdGl2ZURlZiA9IGdldEhvc3REaXJlY3RpdmVEZWYodERhdGEpO1xuICBsZXQgcmVzaWR1YWwgPSBpc0NsYXNzQmFzZWQgPyB0Tm9kZS5yZXNpZHVhbENsYXNzZXMgOiB0Tm9kZS5yZXNpZHVhbFN0eWxlcztcbiAgaWYgKGhvc3REaXJlY3RpdmVEZWYgPT09IG51bGwpIHtcbiAgICAvLyBXZSBhcmUgaW4gdGVtcGxhdGUgbm9kZS5cbiAgICAvLyBJZiB0ZW1wbGF0ZSBub2RlIGFscmVhZHkgaGFkIHN0eWxpbmcgaW5zdHJ1Y3Rpb24gdGhlbiBpdCBoYXMgYWxyZWFkeSBjb2xsZWN0ZWQgdGhlIHN0YXRpY1xuICAgIC8vIHN0eWxpbmcgYW5kIHRoZXJlIGlzIG5vIG5lZWQgdG8gY29sbGVjdCB0aGVtIGFnYWluLiBXZSBrbm93IHRoYXQgd2UgYXJlIHRoZSBmaXJzdCBzdHlsaW5nXG4gICAgLy8gaW5zdHJ1Y3Rpb24gYmVjYXVzZSB0aGUgYFROb2RlLipCaW5kaW5nc2AgcG9pbnRzIHRvIDAgKG5vdGhpbmcgaGFzIGJlZW4gaW5zZXJ0ZWQgeWV0KS5cbiAgICBjb25zdCBpc0ZpcnN0U3R5bGluZ0luc3RydWN0aW9uSW5UZW1wbGF0ZSA9XG4gICAgICAgIChpc0NsYXNzQmFzZWQgPyB0Tm9kZS5jbGFzc0JpbmRpbmdzIDogdE5vZGUuc3R5bGVCaW5kaW5ncykgYXMgYW55IGFzIG51bWJlciA9PT0gMDtcbiAgICBpZiAoaXNGaXJzdFN0eWxpbmdJbnN0cnVjdGlvbkluVGVtcGxhdGUpIHtcbiAgICAgIC8vIEl0IHdvdWxkIGJlIG5pY2UgdG8gYmUgYWJsZSB0byBnZXQgdGhlIHN0YXRpY3MgZnJvbSBgbWVyZ2VBdHRyc2AsIGhvd2V2ZXIsIGF0IHRoaXMgcG9pbnRcbiAgICAgIC8vIHRoZXkgYXJlIGFscmVhZHkgbWVyZ2VkIGFuZCBpdCB3b3VsZCBub3QgYmUgcG9zc2libGUgdG8gZmlndXJlIHdoaWNoIHByb3BlcnR5IGJlbG9uZ3Mgd2hlcmVcbiAgICAgIC8vIGluIHRoZSBwcmlvcml0eS5cbiAgICAgIHN0eWxpbmdLZXkgPSBjb2xsZWN0U3R5bGluZ0Zyb21EaXJlY3RpdmVzKG51bGwsIHREYXRhLCB0Tm9kZSwgc3R5bGluZ0tleSwgaXNDbGFzc0Jhc2VkKTtcbiAgICAgIHN0eWxpbmdLZXkgPSBjb2xsZWN0U3R5bGluZ0Zyb21UQXR0cnMoc3R5bGluZ0tleSwgdE5vZGUuYXR0cnMsIGlzQ2xhc3NCYXNlZCk7XG4gICAgICAvLyBXZSBrbm93IHRoYXQgaWYgd2UgaGF2ZSBzdHlsaW5nIGJpbmRpbmcgaW4gdGVtcGxhdGUgd2UgY2FuJ3QgaGF2ZSByZXNpZHVhbC5cbiAgICAgIHJlc2lkdWFsID0gbnVsbDtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgLy8gV2UgYXJlIGluIGhvc3QgYmluZGluZyBub2RlIGFuZCB0aGVyZSB3YXMgbm8gYmluZGluZyBpbnN0cnVjdGlvbiBpbiB0ZW1wbGF0ZSBub2RlLlxuICAgIC8vIFRoaXMgbWVhbnMgdGhhdCB3ZSBuZWVkIHRvIGNvbXB1dGUgdGhlIHJlc2lkdWFsLlxuICAgIGNvbnN0IGRpcmVjdGl2ZXMgPSB0Tm9kZS5kaXJlY3RpdmVzO1xuICAgIGNvbnN0IGlzRmlyc3RTdHlsaW5nSW5zdHJ1Y3Rpb25Jbkhvc3RCaW5kaW5nID0gZGlyZWN0aXZlcyAhPT0gbnVsbCAmJlxuICAgICAgICBkaXJlY3RpdmVzW2RpcmVjdGl2ZXNbRGlyZWN0aXZlRGVmcy5TVFlMSU5HX0NVUlNPUl1dICE9PSBob3N0RGlyZWN0aXZlRGVmO1xuICAgIGlmIChpc0ZpcnN0U3R5bGluZ0luc3RydWN0aW9uSW5Ib3N0QmluZGluZykge1xuICAgICAgc3R5bGluZ0tleSA9XG4gICAgICAgICAgY29sbGVjdFN0eWxpbmdGcm9tRGlyZWN0aXZlcyhob3N0RGlyZWN0aXZlRGVmLCB0RGF0YSwgdE5vZGUsIHN0eWxpbmdLZXksIGlzQ2xhc3NCYXNlZCk7XG4gICAgICBpZiAocmVzaWR1YWwgPT09IG51bGwpIHtcbiAgICAgICAgLy8gLSBJZiBgbnVsbGAgdGhhbiBlaXRoZXI6XG4gICAgICAgIC8vICAgIC0gVGVtcGxhdGUgc3R5bGluZyBpbnN0cnVjdGlvbiBhbHJlYWR5IHJhbiBhbmQgaXQgaGFzIGNvbnN1bWVkIHRoZSBzdGF0aWNcbiAgICAgICAgLy8gICAgICBzdHlsaW5nIGludG8gaXRzIGBUU3R5bGluZ0tleWAgYW5kIHNvIHRoZXJlIGlzIG5vIG5lZWQgdG8gdXBkYXRlIHJlc2lkdWFsLiBJbnN0ZWFkXG4gICAgICAgIC8vICAgICAgd2UgbmVlZCB0byB1cGRhdGUgdGhlIGBUU3R5bGluZ0tleWAgYXNzb2NpYXRlZCB3aXRoIHRoZSBmaXJzdCB0ZW1wbGF0ZSBub2RlXG4gICAgICAgIC8vICAgICAgaW5zdHJ1Y3Rpb24uIE9SXG4gICAgICAgIC8vICAgIC0gU29tZSBvdGhlciBzdHlsaW5nIGluc3RydWN0aW9uIHJhbiBhbmQgZGV0ZXJtaW5lZCB0aGF0IHRoZXJlIGFyZSBubyByZXNpZHVhbHNcbiAgICAgICAgbGV0IHRlbXBsYXRlU3R5bGluZ0tleSA9IGdldFRlbXBsYXRlSGVhZFRTdHlsaW5nS2V5KHREYXRhLCB0Tm9kZSwgaXNDbGFzc0Jhc2VkKTtcbiAgICAgICAgaWYgKHRlbXBsYXRlU3R5bGluZ0tleSAhPT0gdW5kZWZpbmVkICYmIEFycmF5LmlzQXJyYXkodGVtcGxhdGVTdHlsaW5nS2V5KSkge1xuICAgICAgICAgIC8vIE9ubHkgcmVjb21wdXRlIGlmIGB0ZW1wbGF0ZVN0eWxpbmdLZXlgIGhhZCBzdGF0aWMgdmFsdWVzLiAoSWYgbm8gc3RhdGljIHZhbHVlIGZvdW5kXG4gICAgICAgICAgLy8gdGhlbiB0aGVyZSBpcyBub3RoaW5nIHRvIGRvIHNpbmNlIHRoaXMgb3BlcmF0aW9uIGNhbiBvbmx5IHByb2R1Y2UgbGVzcyBzdGF0aWMga2V5cywgbm90XG4gICAgICAgICAgLy8gbW9yZS4pXG4gICAgICAgICAgdGVtcGxhdGVTdHlsaW5nS2V5ID0gY29sbGVjdFN0eWxpbmdGcm9tRGlyZWN0aXZlcyhcbiAgICAgICAgICAgICAgbnVsbCwgdERhdGEsIHROb2RlLCB0ZW1wbGF0ZVN0eWxpbmdLZXlbMV0gLyogdW53cmFwIHByZXZpb3VzIHN0YXRpY3MgKi8sXG4gICAgICAgICAgICAgIGlzQ2xhc3NCYXNlZCk7XG4gICAgICAgICAgdGVtcGxhdGVTdHlsaW5nS2V5ID1cbiAgICAgICAgICAgICAgY29sbGVjdFN0eWxpbmdGcm9tVEF0dHJzKHRlbXBsYXRlU3R5bGluZ0tleSwgdE5vZGUuYXR0cnMsIGlzQ2xhc3NCYXNlZCk7XG4gICAgICAgICAgc2V0VGVtcGxhdGVIZWFkVFN0eWxpbmdLZXkodERhdGEsIHROb2RlLCBpc0NsYXNzQmFzZWQsIHRlbXBsYXRlU3R5bGluZ0tleSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIFdlIG9ubHkgbmVlZCB0byByZWNvbXB1dGUgcmVzaWR1YWwgaWYgaXQgaXMgbm90IGBudWxsYC5cbiAgICAgICAgLy8gLSBJZiBleGlzdGluZyByZXNpZHVhbCAoaW1wbGllcyB0aGVyZSB3YXMgbm8gdGVtcGxhdGUgc3R5bGluZykuIFRoaXMgbWVhbnMgdGhhdCBzb21lIG9mXG4gICAgICAgIC8vICAgdGhlIHN0YXRpY3MgbWF5IGhhdmUgbW92ZWQgZnJvbSB0aGUgcmVzaWR1YWwgdG8gdGhlIGBzdHlsaW5nS2V5YCBhbmQgc28gd2UgaGF2ZSB0b1xuICAgICAgICAvLyAgIHJlY29tcHV0ZS5cbiAgICAgICAgLy8gLSBJZiBgdW5kZWZpbmVkYCB0aGlzIGlzIHRoZSBmaXJzdCB0aW1lIHdlIGFyZSBydW5uaW5nLlxuICAgICAgICByZXNpZHVhbCA9IGNvbGxlY3RSZXNpZHVhbCh0Tm9kZSwgaXNDbGFzc0Jhc2VkKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgaWYgKHJlc2lkdWFsICE9PSB1bmRlZmluZWQpIHtcbiAgICBpc0NsYXNzQmFzZWQgPyAodE5vZGUucmVzaWR1YWxDbGFzc2VzID0gcmVzaWR1YWwpIDogKHROb2RlLnJlc2lkdWFsU3R5bGVzID0gcmVzaWR1YWwpO1xuICB9XG4gIHJldHVybiBzdHlsaW5nS2V5O1xufVxuXG4vKipcbiAqIFJldHJpZXZlIHRoZSBgVFN0eWxpbmdLZXlgIGZvciB0aGUgdGVtcGxhdGUgc3R5bGluZyBpbnN0cnVjdGlvbi5cbiAqXG4gKiBUaGlzIGlzIG5lZWRlZCBzaW5jZSBgaG9zdEJpbmRpbmdgIHN0eWxpbmcgaW5zdHJ1Y3Rpb25zIGFyZSBpbnNlcnRlZCBhZnRlciB0aGUgdGVtcGxhdGVcbiAqIGluc3RydWN0aW9uLiBXaGlsZSB0aGUgdGVtcGxhdGUgaW5zdHJ1Y3Rpb24gbmVlZHMgdG8gdXBkYXRlIHRoZSByZXNpZHVhbCBpbiBgVE5vZGVgIHRoZVxuICogYGhvc3RCaW5kaW5nYCBpbnN0cnVjdGlvbnMgbmVlZCB0byB1cGRhdGUgdGhlIGBUU3R5bGluZ0tleWAgb2YgdGhlIHRlbXBsYXRlIGluc3RydWN0aW9uIGJlY2F1c2VcbiAqIHRoZSB0ZW1wbGF0ZSBpbnN0cnVjdGlvbiBpcyBkb3duc3RyZWFtIGZyb20gdGhlIGBob3N0QmluZGluZ3NgIGluc3RydWN0aW9ucy5cbiAqXG4gKiBAcGFyYW0gdERhdGEgYFREYXRhYCB3aGVyZSB0aGUgbGlua2VkIGxpc3QgaXMgc3RvcmVkLlxuICogQHBhcmFtIHROb2RlIGBUTm9kZWAgZm9yIHdoaWNoIHRoZSBzdHlsaW5nIGlzIGJlaW5nIGNvbXB1dGVkLlxuICogQHBhcmFtIGlzQ2xhc3NCYXNlZCBgdHJ1ZWAgaWYgYGNsYXNzYCAoYGZhbHNlYCBpZiBgc3R5bGVgKVxuICogQHJldHVybiBgVFN0eWxpbmdLZXlgIGlmIGZvdW5kIG9yIGB1bmRlZmluZWRgIGlmIG5vdCBmb3VuZC5cbiAqL1xuZnVuY3Rpb24gZ2V0VGVtcGxhdGVIZWFkVFN0eWxpbmdLZXkodERhdGE6IFREYXRhLCB0Tm9kZTogVE5vZGUsIGlzQ2xhc3NCYXNlZDogYm9vbGVhbik6IFRTdHlsaW5nS2V5fFxuICAgIHVuZGVmaW5lZCB7XG4gIGNvbnN0IGJpbmRpbmdzID0gaXNDbGFzc0Jhc2VkID8gdE5vZGUuY2xhc3NCaW5kaW5ncyA6IHROb2RlLnN0eWxlQmluZGluZ3M7XG4gIGlmIChnZXRUU3R5bGluZ1JhbmdlTmV4dChiaW5kaW5ncykgPT09IDApIHtcbiAgICAvLyBUaGVyZSBkb2VzIG5vdCBzZWVtIHRvIGJlIGEgc3R5bGluZyBpbnN0cnVjdGlvbiBpbiB0aGUgYHRlbXBsYXRlYC5cbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9XG4gIHJldHVybiB0RGF0YVtnZXRUU3R5bGluZ1JhbmdlUHJldihiaW5kaW5ncyldIGFzIFRTdHlsaW5nS2V5O1xufVxuXG5mdW5jdGlvbiBzZXRUZW1wbGF0ZUhlYWRUU3R5bGluZ0tleShcbiAgICB0RGF0YTogVERhdGEsIHROb2RlOiBUTm9kZSwgaXNDbGFzc0Jhc2VkOiBib29sZWFuLCB0U3R5bGluZ0tleTogVFN0eWxpbmdLZXkpOiB2b2lkIHtcbiAgY29uc3QgYmluZGluZ3MgPSBpc0NsYXNzQmFzZWQgPyB0Tm9kZS5jbGFzc0JpbmRpbmdzIDogdE5vZGUuc3R5bGVCaW5kaW5ncztcbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vdEVxdWFsKFxuICAgICAgICAgICAgICAgICAgIGdldFRTdHlsaW5nUmFuZ2VOZXh0KGJpbmRpbmdzKSwgMCxcbiAgICAgICAgICAgICAgICAgICAnRXhwZWN0aW5nIHRvIGhhdmUgYXQgbGVhc3Qgb25lIHRlbXBsYXRlIHN0eWxpbmcgYmluZGluZy4nKTtcbiAgdERhdGFbZ2V0VFN0eWxpbmdSYW5nZVByZXYoYmluZGluZ3MpXSA9IHRTdHlsaW5nS2V5O1xufVxuXG5mdW5jdGlvbiBjb2xsZWN0UmVzaWR1YWwodE5vZGU6IFROb2RlLCBpc0NsYXNzQmFzZWQ6IGJvb2xlYW4pOiBBcnJheU1hcDxhbnk+fG51bGwge1xuICBsZXQgcmVzaWR1YWw6IEFycmF5TWFwPGFueT58bnVsbHx1bmRlZmluZWQgPSB1bmRlZmluZWQ7XG4gIGNvbnN0IGRpcmVjdGl2ZXMgPSB0Tm9kZS5kaXJlY3RpdmVzO1xuICBpZiAoZGlyZWN0aXZlcykge1xuICAgIGZvciAobGV0IGkgPSBkaXJlY3RpdmVzW0RpcmVjdGl2ZURlZnMuU1RZTElOR19DVVJTT1JdICsgMTsgaSA8IGRpcmVjdGl2ZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGF0dHJzID0gKGRpcmVjdGl2ZXNbaV0gYXMgRGlyZWN0aXZlRGVmPGFueT4pLmhvc3RBdHRycztcbiAgICAgIHJlc2lkdWFsID0gY29sbGVjdFN0eWxpbmdGcm9tVEF0dHJzKHJlc2lkdWFsLCBhdHRycywgaXNDbGFzc0Jhc2VkKSBhcyBBcnJheU1hcDxhbnk+fCBudWxsO1xuICAgIH1cbiAgfVxuICByZXR1cm4gY29sbGVjdFN0eWxpbmdGcm9tVEF0dHJzKHJlc2lkdWFsLCB0Tm9kZS5hdHRycywgaXNDbGFzc0Jhc2VkKSBhcyBBcnJheU1hcDxhbnk+fCBudWxsO1xufVxuXG4vKipcbiAqIENvbGxlY3QgdGhlIHN0YXRpYyBzdHlsaW5nIGluZm9ybWF0aW9uIHdpdGggbG93ZXIgcHJpb3JpdHkgdGhhbiBgaG9zdERpcmVjdGl2ZURlZmAuXG4gKlxuICogKFRoaXMgaXMgb3Bwb3NpdGUgb2YgcmVzaWR1YWwgc3R5bGluZy4pXG4gKlxuICogQHBhcmFtIGhvc3REaXJlY3RpdmVEZWYgYERpcmVjdGl2ZURlZmAgZm9yIHdoaWNoIHdlIHdhbnQgdG8gY29sbGVjdCBsb3dlciBwcmlvcml0eSBzdGF0aWNcbiAqICAgICAgICBzdHlsaW5nLiAoT3IgYG51bGxgIGlmIHRlbXBsYXRlIHN0eWxpbmcpXG4gKiBAcGFyYW0gdERhdGEgYFREYXRhYCB3aGVyZSB0aGUgbGlua2VkIGxpc3QgaXMgc3RvcmVkLlxuICogQHBhcmFtIHROb2RlIGBUTm9kZWAgZm9yIHdoaWNoIHRoZSBzdHlsaW5nIGlzIGJlaW5nIGNvbXB1dGVkLlxuICogQHBhcmFtIHN0eWxpbmdLZXkgRXhpc3RpbmcgYFRTdHlsaW5nS2V5YCB0byB1cGRhdGUgb3Igd3JhcC5cbiAqIEBwYXJhbSBpc0NsYXNzQmFzZWQgYHRydWVgIGlmIGBjbGFzc2AgKGBmYWxzZWAgaWYgYHN0eWxlYClcbiAqL1xuZnVuY3Rpb24gY29sbGVjdFN0eWxpbmdGcm9tRGlyZWN0aXZlcyhcbiAgICBob3N0RGlyZWN0aXZlRGVmOiBEaXJlY3RpdmVEZWY8YW55PnwgbnVsbCwgdERhdGE6IFREYXRhLCB0Tm9kZTogVE5vZGUsIHN0eWxpbmdLZXk6IFRTdHlsaW5nS2V5LFxuICAgIGlzQ2xhc3NCYXNlZDogYm9vbGVhbik6IFRTdHlsaW5nS2V5IHtcbiAgY29uc3QgZGlyZWN0aXZlcyA9IHROb2RlLmRpcmVjdGl2ZXM7XG4gIGlmIChkaXJlY3RpdmVzICE9IG51bGwpIHtcbiAgICBuZ0Rldk1vZGUgJiYgaG9zdERpcmVjdGl2ZURlZiAmJlxuICAgICAgICBhc3NlcnRHcmVhdGVyVGhhbk9yRXF1YWwoXG4gICAgICAgICAgICBkaXJlY3RpdmVzLmluZGV4T2YoaG9zdERpcmVjdGl2ZURlZiwgZGlyZWN0aXZlc1tEaXJlY3RpdmVEZWZzLlNUWUxJTkdfQ1VSU09SXSksIDAsXG4gICAgICAgICAgICAnRXhwZWN0aW5nIHRoYXQgdGhlIGN1cnJlbnQgZGlyZWN0aXZlIGlzIGluIHRoZSBkaXJlY3RpdmUgbGlzdCcpO1xuICAgIC8vIFdlIG5lZWQgdG8gbG9vcCBiZWNhdXNlIHRoZXJlIGNhbiBiZSBkaXJlY3RpdmVzIHdoaWNoIGhhdmUgYGhvc3RBdHRyc2AgYnV0IGRvbid0IGhhdmVcbiAgICAvLyBgaG9zdEJpbmRpbmdzYCBzbyB0aGlzIGxvb3AgY2F0Y2hlcyB1cCB1cCB0byB0aGUgY3VycmVudCBkaXJlY3RpdmUuLlxuICAgIGxldCBjdXJyZW50RGlyZWN0aXZlOiBEaXJlY3RpdmVEZWY8YW55PnxudWxsID0gbnVsbDtcbiAgICBsZXQgaW5kZXggPSBkaXJlY3RpdmVzW0RpcmVjdGl2ZURlZnMuU1RZTElOR19DVVJTT1JdO1xuICAgIHdoaWxlIChpbmRleCArIDEgPCBkaXJlY3RpdmVzLmxlbmd0aCkge1xuICAgICAgaW5kZXgrKztcbiAgICAgIGN1cnJlbnREaXJlY3RpdmUgPSBkaXJlY3RpdmVzW2luZGV4XSBhcyBEaXJlY3RpdmVEZWY8YW55PjtcbiAgICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKGN1cnJlbnREaXJlY3RpdmUsICdleHBlY3RlZCB0byBiZSBkZWZpbmVkJyk7XG4gICAgICBzdHlsaW5nS2V5ID0gY29sbGVjdFN0eWxpbmdGcm9tVEF0dHJzKHN0eWxpbmdLZXksIGN1cnJlbnREaXJlY3RpdmUuaG9zdEF0dHJzLCBpc0NsYXNzQmFzZWQpO1xuICAgICAgaWYgKGN1cnJlbnREaXJlY3RpdmUgPT09IGhvc3REaXJlY3RpdmVEZWYpIGJyZWFrO1xuICAgIH1cbiAgICBpZiAoaG9zdERpcmVjdGl2ZURlZiAhPT0gbnVsbCkge1xuICAgICAgLy8gd2Ugb25seSBhZHZhbmNlIHRoZSBzdHlsaW5nIGN1cnNvciBpZiB3ZSBhcmUgY29sbGVjdGluZyBkYXRhIGZyb20gaG9zdCBiaW5kaW5ncy5cbiAgICAgIC8vIFRlbXBsYXRlIGV4ZWN1dGVzIGJlZm9yZSBob3N0IGJpbmRpbmdzIGFuZCBzbyBpZiB3ZSB3b3VsZCB1cGRhdGUgdGhlIGluZGV4LFxuICAgICAgLy8gaG9zdCBiaW5kaW5ncyB3b3VsZCBub3QgZ2V0IHRoZWlyIHN0YXRpY3MuXG4gICAgICBkaXJlY3RpdmVzW0RpcmVjdGl2ZURlZnMuU1RZTElOR19DVVJTT1JdID0gaW5kZXg7XG4gICAgfVxuICB9XG4gIHJldHVybiBzdHlsaW5nS2V5O1xufVxuXG4vKipcbiAqIENvbnZlcnQgYFRBdHRyc2AgaW50byBgVFN0eWxpbmdTdGF0aWNgLlxuICpcbiAqIEBwYXJhbSBzdHlsaW5nS2V5IGV4aXN0aW5nIGBUU3R5bGluZ0tleWAgdG8gdXBkYXRlIG9yIHdyYXAuXG4gKiBAcGFyYW0gYXR0cnMgYFRBdHRyaWJ1dGVzYCB0byBwcm9jZXNzLlxuICogQHBhcmFtIGlzQ2xhc3NCYXNlZCBgdHJ1ZWAgaWYgYGNsYXNzYCAoYGZhbHNlYCBpZiBgc3R5bGVgKVxuICovXG5mdW5jdGlvbiBjb2xsZWN0U3R5bGluZ0Zyb21UQXR0cnMoXG4gICAgc3R5bGluZ0tleTogVFN0eWxpbmdLZXkgfCB1bmRlZmluZWQsIGF0dHJzOiBUQXR0cmlidXRlcyB8IG51bGwsXG4gICAgaXNDbGFzc0Jhc2VkOiBib29sZWFuKTogVFN0eWxpbmdLZXkge1xuICBjb25zdCBkZXNpcmVkTWFya2VyID0gaXNDbGFzc0Jhc2VkID8gQXR0cmlidXRlTWFya2VyLkNsYXNzZXMgOiBBdHRyaWJ1dGVNYXJrZXIuU3R5bGVzO1xuICBsZXQgY3VycmVudE1hcmtlciA9IEF0dHJpYnV0ZU1hcmtlci5JbXBsaWNpdEF0dHJpYnV0ZXM7XG4gIGlmIChhdHRycyAhPT0gbnVsbCkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYXR0cnMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGl0ZW0gPSBhdHRyc1tpXSBhcyBudW1iZXIgfCBzdHJpbmc7XG4gICAgICBpZiAodHlwZW9mIGl0ZW0gPT09ICdudW1iZXInKSB7XG4gICAgICAgIGN1cnJlbnRNYXJrZXIgPSBpdGVtO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKGN1cnJlbnRNYXJrZXIgPT09IGRlc2lyZWRNYXJrZXIpIHtcbiAgICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkoc3R5bGluZ0tleSkpIHtcbiAgICAgICAgICAgIHN0eWxpbmdLZXkgPSBzdHlsaW5nS2V5ID09PSB1bmRlZmluZWQgPyBbXSA6IFsnJywgc3R5bGluZ0tleV0gYXMgYW55O1xuICAgICAgICAgIH1cbiAgICAgICAgICBhcnJheU1hcFNldChzdHlsaW5nS2V5IGFzIEFycmF5TWFwPGFueT4sIGl0ZW0sIGlzQ2xhc3NCYXNlZCA/IHRydWUgOiBhdHRyc1srK2ldKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gc3R5bGluZ0tleSA9PT0gdW5kZWZpbmVkID8gbnVsbCA6IHN0eWxpbmdLZXk7XG59XG5cbi8qKlxuICogUmV0cmlldmUgdGhlIGN1cnJlbnQgYERpcmVjdGl2ZURlZmAgd2hpY2ggaXMgYWN0aXZlIHdoZW4gYGhvc3RCaW5kaW5nc2Agc3R5bGUgaW5zdHJ1Y3Rpb24gaXNcbiAqIGJlaW5nIGV4ZWN1dGVkIChvciBgbnVsbGAgaWYgd2UgYXJlIGluIGB0ZW1wbGF0ZWAuKVxuICpcbiAqIEBwYXJhbSB0RGF0YSBDdXJyZW50IGBURGF0YWAgd2hlcmUgdGhlIGBEaXJlY3RpdmVEZWZgIHdpbGwgYmUgbG9va2VkIHVwIGF0LlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0SG9zdERpcmVjdGl2ZURlZih0RGF0YTogVERhdGEpOiBEaXJlY3RpdmVEZWY8YW55PnxudWxsIHtcbiAgY29uc3QgY3VycmVudERpcmVjdGl2ZUluZGV4ID0gZ2V0Q3VycmVudERpcmVjdGl2ZUluZGV4KCk7XG4gIHJldHVybiBjdXJyZW50RGlyZWN0aXZlSW5kZXggPT09IC0xID8gbnVsbCA6IHREYXRhW2N1cnJlbnREaXJlY3RpdmVJbmRleF0gYXMgRGlyZWN0aXZlRGVmPGFueT47XG59XG5cbi8qKlxuICogQ29udmVydCB1c2VyIGlucHV0IHRvIGBBcnJheU1hcGAuXG4gKlxuICogVGhpcyBmdW5jdGlvbiB0YWtlcyB1c2VyIGlucHV0IHdoaWNoIGNvdWxkIGJlIGBzdHJpbmdgLCBPYmplY3QgbGl0ZXJhbCwgb3IgaXRlcmFibGUgYW5kIGNvbnZlcnRzXG4gKiBpdCBpbnRvIGEgY29uc2lzdGVudCByZXByZXNlbnRhdGlvbi4gVGhlIG91dHB1dCBvZiB0aGlzIGlzIGBBcnJheU1hcGAgKHdoaWNoIGlzIGFuIGFycmF5IHdoZXJlXG4gKiBldmVuIGluZGV4ZXMgY29udGFpbiBrZXlzIGFuZCBvZGQgaW5kZXhlcyBjb250YWluIHZhbHVlcyBmb3IgdGhvc2Uga2V5cykuXG4gKlxuICogVGhlIGFkdmFudGFnZSBvZiBjb252ZXJ0aW5nIHRvIGBBcnJheU1hcGAgaXMgdGhhdCB3ZSBjYW4gcGVyZm9ybSBkaWZmIGluIGEgaW5wdXQgaW5kZXBlbmRlbnQgd2F5LlxuICogKGllIHdlIGNhbiBjb21wYXJlIGBmb28gYmFyYCB0byBgWydiYXInLCAnYmF6J10gYW5kIGRldGVybWluZSBhIHNldCBvZiBjaGFuZ2VzIHdoaWNoIG5lZWQgdG8gYmVcbiAqIGFwcGxpZWQpXG4gKlxuICogVGhlIGZhY3QgdGhhdCBgQXJyYXlNYXBgIGlzIHNvcnRlZCBpcyB2ZXJ5IGltcG9ydGFudCBiZWNhdXNlIGl0IGFsbG93cyB1cyB0byBjb21wdXRlIHRoZVxuICogZGlmZmVyZW5jZSBpbiBsaW5lYXIgZmFzaGlvbiB3aXRob3V0IHRoZSBuZWVkIHRvIGFsbG9jYXRlIGFueSBhZGRpdGlvbmFsIGRhdGEuXG4gKlxuICogRm9yIGV4YW1wbGUgaWYgd2Uga2VwdCB0aGlzIGFzIGEgYE1hcGAgd2Ugd291bGQgaGF2ZSB0byBpdGVyYXRlIG92ZXIgcHJldmlvdXMgYE1hcGAgdG8gZGV0ZXJtaW5lXG4gKiB3aGljaCB2YWx1ZXMgbmVlZCB0byBiZSBkZWxldGUsIG92ZXIgdGhlIG5ldyBgTWFwYCB0byBkZXRlcm1pbmUgYWRkaXRpb25zLCBhbmQgd2Ugd291bGQgaGF2ZSB0b1xuICoga2VlcCBhZGRpdGlvbmFsIGBNYXBgIHRvIGtlZXAgdHJhY2sgb2YgZHVwbGljYXRlcyBvciBpdGVtcyB3aGljaCBoYXZlIG5vdCB5ZXQgYmVlbiB2aXNpdGVkLlxuICpcbiAqIEBwYXJhbSBzdHJpbmdQYXJzZXIgVGhlIHBhcnNlciBpcyBwYXNzZWQgaW4gc28gdGhhdCBpdCB3aWxsIGJlIHRyZWUgc2hha2FibGUuIFNlZVxuICogICAgICAgIGBzdHlsZVN0cmluZ1BhcnNlcmAgYW5kIGBjbGFzc1N0cmluZ1BhcnNlcmBcbiAqIEBwYXJhbSB2YWx1ZSBUaGUgdmFsdWUgdG8gcGFyc2UvY29udmVydCB0byBgQXJyYXlNYXBgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0b1N0eWxpbmdBcnJheU1hcChcbiAgICBhcnJheU1hcFNldDogKGFycmF5TWFwOiBBcnJheU1hcDxhbnk+LCBrZXk6IHN0cmluZywgdmFsdWU6IGFueSkgPT4gdm9pZCxcbiAgICBzdHJpbmdQYXJzZXI6IChzdHlsZUFycmF5TWFwOiBBcnJheU1hcDxhbnk+LCB0ZXh0OiBzdHJpbmcpID0+IHZvaWQsIHZhbHVlOiBzdHJpbmd8c3RyaW5nW118XG4gICAge1trZXk6IHN0cmluZ106IGFueX18TWFwPGFueSwgYW55PnxTZXQ8YW55PnxudWxsfHVuZGVmaW5lZCk6IEFycmF5TWFwPGFueT4ge1xuICBpZiAodmFsdWUgPT09IG51bGwgfHwgdmFsdWUgPT09IHVuZGVmaW5lZCB8fCB2YWx1ZSA9PT0gJycpIHJldHVybiBFTVBUWV9BUlJBWSBhcyBhbnk7XG4gIGNvbnN0IHN0eWxlQXJyYXlNYXA6IEFycmF5TWFwPGFueT4gPSBbXSBhcyBhbnk7XG4gIGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdmFsdWUubGVuZ3RoOyBpKyspIHtcbiAgICAgIGFycmF5TWFwU2V0KHN0eWxlQXJyYXlNYXAsIHZhbHVlW2ldLCB0cnVlKTtcbiAgICB9XG4gIH0gZWxzZSBpZiAodHlwZW9mIHZhbHVlID09PSAnb2JqZWN0Jykge1xuICAgIGlmICh2YWx1ZSBpbnN0YW5jZW9mIE1hcCkge1xuICAgICAgdmFsdWUuZm9yRWFjaCgodiwgaykgPT4gYXJyYXlNYXBTZXQoc3R5bGVBcnJheU1hcCwgaywgdikpO1xuICAgIH0gZWxzZSBpZiAodmFsdWUgaW5zdGFuY2VvZiBTZXQpIHtcbiAgICAgIHZhbHVlLmZvckVhY2goKGspID0+IGFycmF5TWFwU2V0KHN0eWxlQXJyYXlNYXAsIGssIHRydWUpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZm9yIChjb25zdCBrZXkgaW4gdmFsdWUpIHtcbiAgICAgICAgaWYgKHZhbHVlLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgICBhcnJheU1hcFNldChzdHlsZUFycmF5TWFwLCBrZXksIHZhbHVlW2tleV0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9IGVsc2UgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycpIHtcbiAgICBzdHJpbmdQYXJzZXIoc3R5bGVBcnJheU1hcCwgdmFsdWUpO1xuICB9IGVsc2Uge1xuICAgIG5nRGV2TW9kZSAmJiB0aHJvd0Vycm9yKCdVbnN1cHBvcnRlZCBzdHlsaW5nIHR5cGUgJyArIHR5cGVvZiB2YWx1ZSk7XG4gIH1cbiAgcmV0dXJuIHN0eWxlQXJyYXlNYXA7XG59XG5cbi8qKlxuICogU2V0IGEgYHZhbHVlYCBmb3IgYSBga2V5YCB0YWtpbmcgc3R5bGUgc2FuaXRpemF0aW9uIGludG8gYWNjb3VudC5cbiAqXG4gKiBTZWU6IGBhcnJheU1hcFNldGAgZm9yIGRldGFpbHNcbiAqXG4gKiBAcGFyYW0gYXJyYXlNYXAgQXJyYXlNYXAgdG8gYWRkIHRvLlxuICogQHBhcmFtIGtleSBTdHlsZSBrZXkgdG8gYWRkLiAoVGhpcyBrZXkgd2lsbCBiZSBjaGVja2VkIGlmIGl0IG5lZWRzIHNhbml0aXphdGlvbilcbiAqIEBwYXJhbSB2YWx1ZSBUaGUgdmFsdWUgdG8gc2V0IChJZiBrZXkgbmVlZHMgc2FuaXRpemF0aW9uIGl0IHdpbGwgYmUgc2FuaXRpemVkKVxuICovXG5mdW5jdGlvbiBzdHlsZUFycmF5TWFwU2V0KGFycmF5TWFwOiBBcnJheU1hcDxhbnk+LCBrZXk6IHN0cmluZywgdmFsdWU6IGFueSkge1xuICBpZiAoc3R5bGVQcm9wTmVlZHNTYW5pdGl6YXRpb24oa2V5KSkge1xuICAgIHZhbHVlID0gybXJtXNhbml0aXplU3R5bGUodmFsdWUpO1xuICB9XG4gIGFycmF5TWFwU2V0KGFycmF5TWFwLCBrZXksIHZhbHVlKTtcbn1cblxuLyoqXG4gKiBVcGRhdGUgbWFwIGJhc2VkIHN0eWxpbmcuXG4gKlxuICogTWFwIGJhc2VkIHN0eWxpbmcgY291bGQgYmUgYW55dGhpbmcgd2hpY2ggY29udGFpbnMgbW9yZSB0aGFuIG9uZSBiaW5kaW5nLiBGb3IgZXhhbXBsZSBgc3RyaW5nYCxcbiAqIGBNYXBgLCBgU2V0YCBvciBvYmplY3QgbGl0ZXJhbC4gRGVhbGluZyB3aXRoIGFsbCBvZiB0aGVzZSB0eXBlcyB3b3VsZCBjb21wbGljYXRlIHRoZSBsb2dpYyBzb1xuICogaW5zdGVhZCB0aGlzIGZ1bmN0aW9uIGV4cGVjdHMgdGhhdCB0aGUgY29tcGxleCBpbnB1dCBpcyBmaXJzdCBjb252ZXJ0ZWQgaW50byBub3JtYWxpemVkXG4gKiBgQXJyYXlNYXBgLiBUaGUgYWR2YW50YWdlIG9mIG5vcm1hbGl6YXRpb24gaXMgdGhhdCB3ZSBnZXQgdGhlIHZhbHVlcyBzb3J0ZWQsIHdoaWNoIG1ha2VzIGl0IHZlcnlcbiAqIGNoZWFwIHRvIGNvbXB1dGUgZGVsdGFzIGJldHdlZW4gdGhlIHByZXZpb3VzIGFuZCBjdXJyZW50IHZhbHVlLlxuICpcbiAqIEBwYXJhbSB0VmlldyBBc3NvY2lhdGVkIGBUVmlldy5kYXRhYCBjb250YWlucyB0aGUgbGlua2VkIGxpc3Qgb2YgYmluZGluZyBwcmlvcml0aWVzLlxuICogQHBhcmFtIHROb2RlIGBUTm9kZWAgd2hlcmUgdGhlIGJpbmRpbmcgaXMgbG9jYXRlZC5cbiAqIEBwYXJhbSBsVmlldyBgTFZpZXdgIGNvbnRhaW5zIHRoZSB2YWx1ZXMgYXNzb2NpYXRlZCB3aXRoIG90aGVyIHN0eWxpbmcgYmluZGluZyBhdCB0aGlzIGBUTm9kZWAuXG4gKiBAcGFyYW0gcmVuZGVyZXIgUmVuZGVyZXIgdG8gdXNlIGlmIGFueSB1cGRhdGVzLlxuICogQHBhcmFtIG9sZEFycmF5TWFwIFByZXZpb3VzIHZhbHVlIHJlcHJlc2VudGVkIGFzIGBBcnJheU1hcGBcbiAqIEBwYXJhbSBuZXdBcnJheU1hcCBDdXJyZW50IHZhbHVlIHJlcHJlc2VudGVkIGFzIGBBcnJheU1hcGBcbiAqIEBwYXJhbSBpc0NsYXNzQmFzZWQgYHRydWVgIGlmIGBjbGFzc2AgKGBmYWxzZWAgaWYgYHN0eWxlYClcbiAqIEBwYXJhbSBiaW5kaW5nSW5kZXggQmluZGluZyBpbmRleCBvZiB0aGUgYmluZGluZy5cbiAqL1xuZnVuY3Rpb24gdXBkYXRlU3R5bGluZ01hcChcbiAgICB0VmlldzogVFZpZXcsIHROb2RlOiBUTm9kZSwgbFZpZXc6IExWaWV3LCByZW5kZXJlcjogUmVuZGVyZXIzLCBvbGRBcnJheU1hcDogQXJyYXlNYXA8YW55PixcbiAgICBuZXdBcnJheU1hcDogQXJyYXlNYXA8YW55PiwgaXNDbGFzc0Jhc2VkOiBib29sZWFuLCBiaW5kaW5nSW5kZXg6IG51bWJlcikge1xuICBpZiAob2xkQXJyYXlNYXAgYXMgQXJyYXlNYXA8YW55PnwgTk9fQ0hBTkdFID09PSBOT19DSEFOR0UpIHtcbiAgICAvLyBPTiBmaXJzdCBleGVjdXRpb24gdGhlIG9sZEFycmF5TWFwIGlzIE5PX0NIQU5HRSA9PiB0cmVhdCBpcyBhcyBlbXB0eSBBcnJheU1hcC5cbiAgICBvbGRBcnJheU1hcCA9IEVNUFRZX0FSUkFZIGFzIGFueTtcbiAgfVxuICBsZXQgb2xkSW5kZXggPSAwO1xuICBsZXQgbmV3SW5kZXggPSAwO1xuICBsZXQgb2xkS2V5OiBzdHJpbmd8bnVsbCA9IDAgPCBvbGRBcnJheU1hcC5sZW5ndGggPyBvbGRBcnJheU1hcFswXSA6IG51bGw7XG4gIGxldCBuZXdLZXk6IHN0cmluZ3xudWxsID0gMCA8IG5ld0FycmF5TWFwLmxlbmd0aCA/IG5ld0FycmF5TWFwWzBdIDogbnVsbDtcbiAgd2hpbGUgKG9sZEtleSAhPT0gbnVsbCB8fCBuZXdLZXkgIT09IG51bGwpIHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0TGVzc1RoYW4ob2xkSW5kZXgsIDk5OSwgJ0FyZSB3ZSBzdHVjayBpbiBpbmZpbml0ZSBsb29wPycpO1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnRMZXNzVGhhbihuZXdJbmRleCwgOTk5LCAnQXJlIHdlIHN0dWNrIGluIGluZmluaXRlIGxvb3A/Jyk7XG4gICAgY29uc3Qgb2xkVmFsdWUgPSBvbGRJbmRleCA8IG9sZEFycmF5TWFwLmxlbmd0aCA/IG9sZEFycmF5TWFwW29sZEluZGV4ICsgMV0gOiB1bmRlZmluZWQ7XG4gICAgY29uc3QgbmV3VmFsdWUgPSBuZXdJbmRleCA8IG5ld0FycmF5TWFwLmxlbmd0aCA/IG5ld0FycmF5TWFwW25ld0luZGV4ICsgMV0gOiB1bmRlZmluZWQ7XG4gICAgbGV0IHNldEtleTogc3RyaW5nfG51bGwgPSBudWxsO1xuICAgIGxldCBzZXRWYWx1ZTogYW55ID0gdW5kZWZpbmVkO1xuICAgIGlmIChvbGRLZXkgPT09IG5ld0tleSkge1xuICAgICAgLy8gVVBEQVRFOiBLZXlzIGFyZSBlcXVhbCA9PiBuZXcgdmFsdWUgaXMgb3ZlcndyaXRpbmcgb2xkIHZhbHVlLlxuICAgICAgb2xkSW5kZXggKz0gMjtcbiAgICAgIG5ld0luZGV4ICs9IDI7XG4gICAgICBpZiAob2xkVmFsdWUgIT09IG5ld1ZhbHVlKSB7XG4gICAgICAgIHNldEtleSA9IG5ld0tleTtcbiAgICAgICAgc2V0VmFsdWUgPSBuZXdWYWx1ZTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKG5ld0tleSA9PT0gbnVsbCB8fCBvbGRLZXkgIT09IG51bGwgJiYgb2xkS2V5IDwgbmV3S2V5ICEpIHtcbiAgICAgIC8vIERFTEVURTogb2xkS2V5IGtleSBpcyBtaXNzaW5nIG9yIHdlIGRpZCBub3QgZmluZCB0aGUgb2xkS2V5IGluIHRoZSBuZXdWYWx1ZS5cbiAgICAgIG9sZEluZGV4ICs9IDI7XG4gICAgICBzZXRLZXkgPSBvbGRLZXk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIENSRUFURTogbmV3S2V5IGlzIGxlc3MgdGhhbiBvbGRLZXkgKG9yIG5vIG9sZEtleSkgPT4gd2UgaGF2ZSBuZXcga2V5LlxuICAgICAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQobmV3S2V5LCAnRXhwZWN0aW5nIHRvIGhhdmUgYSB2YWxpZCBrZXknKTtcbiAgICAgIG5ld0luZGV4ICs9IDI7XG4gICAgICBzZXRLZXkgPSBuZXdLZXk7XG4gICAgICBzZXRWYWx1ZSA9IG5ld1ZhbHVlO1xuICAgIH1cbiAgICBpZiAoc2V0S2V5ICE9PSBudWxsKSB7XG4gICAgICB1cGRhdGVTdHlsaW5nKHRWaWV3LCB0Tm9kZSwgbFZpZXcsIHJlbmRlcmVyLCBzZXRLZXksIHNldFZhbHVlLCBpc0NsYXNzQmFzZWQsIGJpbmRpbmdJbmRleCk7XG4gICAgfVxuICAgIG9sZEtleSA9IG9sZEluZGV4IDwgb2xkQXJyYXlNYXAubGVuZ3RoID8gb2xkQXJyYXlNYXBbb2xkSW5kZXhdIDogbnVsbDtcbiAgICBuZXdLZXkgPSBuZXdJbmRleCA8IG5ld0FycmF5TWFwLmxlbmd0aCA/IG5ld0FycmF5TWFwW25ld0luZGV4XSA6IG51bGw7XG4gIH1cbn1cblxuLyoqXG4gKiBVcGRhdGUgYSBzaW1wbGUgKHByb3BlcnR5IG5hbWUpIHN0eWxpbmcuXG4gKlxuICogVGhpcyBmdW5jdGlvbiB0YWtlcyBgcHJvcGAgYW5kIHVwZGF0ZXMgdGhlIERPTSB0byB0aGF0IHZhbHVlLiBUaGUgZnVuY3Rpb24gdGFrZXMgdGhlIGJpbmRpbmdcbiAqIHZhbHVlIGFzIHdlbGwgYXMgYmluZGluZyBwcmlvcml0eSBpbnRvIGNvbnNpZGVyYXRpb24gdG8gZGV0ZXJtaW5lIHdoaWNoIHZhbHVlIHNob3VsZCBiZSB3cml0dGVuXG4gKiB0byBET00uIChGb3IgZXhhbXBsZSBpdCBtYXkgYmUgZGV0ZXJtaW5lZCB0aGF0IHRoZXJlIGlzIGEgaGlnaGVyIHByaW9yaXR5IG92ZXJ3cml0ZSB3aGljaCBibG9ja3NcbiAqIHRoZSBET00gd3JpdGUsIG9yIGlmIHRoZSB2YWx1ZSBnb2VzIHRvIGB1bmRlZmluZWRgIGEgbG93ZXIgcHJpb3JpdHkgb3ZlcndyaXRlIG1heSBiZSBjb25zdWx0ZWQuKVxuICpcbiAqIEBwYXJhbSB0VmlldyBBc3NvY2lhdGVkIGBUVmlldy5kYXRhYCBjb250YWlucyB0aGUgbGlua2VkIGxpc3Qgb2YgYmluZGluZyBwcmlvcml0aWVzLlxuICogQHBhcmFtIHROb2RlIGBUTm9kZWAgd2hlcmUgdGhlIGJpbmRpbmcgaXMgbG9jYXRlZC5cbiAqIEBwYXJhbSBsVmlldyBgTFZpZXdgIGNvbnRhaW5zIHRoZSB2YWx1ZXMgYXNzb2NpYXRlZCB3aXRoIG90aGVyIHN0eWxpbmcgYmluZGluZyBhdCB0aGlzIGBUTm9kZWAuXG4gKiBAcGFyYW0gcmVuZGVyZXIgUmVuZGVyZXIgdG8gdXNlIGlmIGFueSB1cGRhdGVzLlxuICogQHBhcmFtIHByb3AgRWl0aGVyIHN0eWxlIHByb3BlcnR5IG5hbWUgb3IgYSBjbGFzcyBuYW1lLlxuICogQHBhcmFtIHZhbHVlIEVpdGhlciBzdHlsZSB2YWxlIGZvciBgcHJvcGAgb3IgYHRydWVgL2BmYWxzZWAgaWYgYHByb3BgIGlzIGNsYXNzLlxuICogQHBhcmFtIGlzQ2xhc3NCYXNlZCBgdHJ1ZWAgaWYgYGNsYXNzYCAoYGZhbHNlYCBpZiBgc3R5bGVgKVxuICogQHBhcmFtIGJpbmRpbmdJbmRleCBCaW5kaW5nIGluZGV4IG9mIHRoZSBiaW5kaW5nLlxuICovXG5mdW5jdGlvbiB1cGRhdGVTdHlsaW5nKFxuICAgIHRWaWV3OiBUVmlldywgdE5vZGU6IFROb2RlLCBsVmlldzogTFZpZXcsIHJlbmRlcmVyOiBSZW5kZXJlcjMsIHByb3A6IHN0cmluZyxcbiAgICB2YWx1ZTogc3RyaW5nIHwgdW5kZWZpbmVkIHwgbnVsbCB8IGJvb2xlYW4sIGlzQ2xhc3NCYXNlZDogYm9vbGVhbiwgYmluZGluZ0luZGV4OiBudW1iZXIpIHtcbiAgaWYgKHROb2RlLnR5cGUgIT09IFROb2RlVHlwZS5FbGVtZW50KSB7XG4gICAgLy8gSXQgaXMgcG9zc2libGUgdG8gaGF2ZSBzdHlsaW5nIG9uIG5vbi1lbGVtZW50cyAoc3VjaCBhcyBuZy1jb250YWluZXIpLlxuICAgIC8vIFRoaXMgaXMgcmFyZSwgYnV0IGl0IGRvZXMgaGFwcGVuLiBJbiBzdWNoIGEgY2FzZSwganVzdCBpZ25vcmUgdGhlIGJpbmRpbmcuXG4gICAgcmV0dXJuO1xuICB9XG4gIGNvbnN0IHREYXRhID0gdFZpZXcuZGF0YTtcbiAgY29uc3QgdFJhbmdlID0gdERhdGFbYmluZGluZ0luZGV4ICsgMV0gYXMgVFN0eWxpbmdSYW5nZTtcbiAgY29uc3QgaGlnaGVyUHJpb3JpdHlWYWx1ZSA9IGdldFRTdHlsaW5nUmFuZ2VOZXh0RHVwbGljYXRlKHRSYW5nZSkgP1xuICAgICAgZmluZFN0eWxpbmdWYWx1ZSh0RGF0YSwgdE5vZGUsIGxWaWV3LCBwcm9wLCBnZXRUU3R5bGluZ1JhbmdlTmV4dCh0UmFuZ2UpLCBpc0NsYXNzQmFzZWQpIDpcbiAgICAgIHVuZGVmaW5lZDtcbiAgaWYgKCFpc1N0eWxpbmdWYWx1ZVByZXNlbnQoaGlnaGVyUHJpb3JpdHlWYWx1ZSkpIHtcbiAgICAvLyBXZSBkb24ndCBoYXZlIGEgbmV4dCBkdXBsaWNhdGUsIG9yIHdlIGRpZCBub3QgZmluZCBhIGR1cGxpY2F0ZSB2YWx1ZS5cbiAgICBpZiAoIWlzU3R5bGluZ1ZhbHVlUHJlc2VudCh2YWx1ZSkpIHtcbiAgICAgIC8vIFdlIHNob3VsZCBkZWxldGUgY3VycmVudCB2YWx1ZSBvciByZXN0b3JlIHRvIGxvd2VyIHByaW9yaXR5IHZhbHVlLlxuICAgICAgaWYgKGdldFRTdHlsaW5nUmFuZ2VQcmV2RHVwbGljYXRlKHRSYW5nZSkpIHtcbiAgICAgICAgLy8gV2UgaGF2ZSBhIHBvc3NpYmxlIHByZXYgZHVwbGljYXRlLCBsZXQncyByZXRyaWV2ZSBpdC5cbiAgICAgICAgdmFsdWUgPSBmaW5kU3R5bGluZ1ZhbHVlKHREYXRhLCBudWxsLCBsVmlldywgcHJvcCwgYmluZGluZ0luZGV4LCBpc0NsYXNzQmFzZWQpO1xuICAgICAgfVxuICAgIH1cbiAgICBjb25zdCByTm9kZSA9IGdldE5hdGl2ZUJ5SW5kZXgoZ2V0U2VsZWN0ZWRJbmRleCgpLCBsVmlldykgYXMgUkVsZW1lbnQ7XG4gICAgYXBwbHlTdHlsaW5nKHJlbmRlcmVyLCBpc0NsYXNzQmFzZWQsIHJOb2RlLCBwcm9wLCB2YWx1ZSk7XG4gIH1cbn1cblxuLyoqXG4gKiBTZWFyY2ggZm9yIHN0eWxpbmcgdmFsdWUgd2l0aCBoaWdoZXIgcHJpb3JpdHkgd2hpY2ggaXMgb3ZlcndyaXRpbmcgY3VycmVudCB2YWx1ZS5cbiAqXG4gKiBXaGVuIHZhbHVlIGlzIGJlaW5nIGFwcGxpZWQgYXQgYSBsb2NhdGlvbiByZWxhdGVkIHZhbHVlcyBuZWVkIHRvIGJlIGNvbnN1bHRlZC5cbiAqIC0gSWYgdGhlcmUgaXMgYSBoaWdoZXIgcHJpb3JpdHkgYmluZGluZywgd2Ugc2hvdWxkIGJlIHVzaW5nIHRoYXQgb25lIGluc3RlYWQuXG4gKiAgIEZvciBleGFtcGxlIGA8ZGl2ICBbc3R5bGVdPVwie2NvbG9yOmV4cDF9XCIgW3N0eWxlLmNvbG9yXT1cImV4cDJcIj5gIGNoYW5nZSB0byBgZXhwMWBcbiAqICAgcmVxdWlyZXMgdGhhdCB3ZSBjaGVjayBgZXhwMmAgdG8gc2VlIGlmIGl0IGlzIHNldCB0byB2YWx1ZSBvdGhlciB0aGFuIGB1bmRlZmluZWRgLlxuICogLSBJZiB0aGVyZSBpcyBhIGxvd2VyIHByaW9yaXR5IGJpbmRpbmcgYW5kIHdlIGFyZSBjaGFuZ2luZyB0byBgdW5kZWZpbmVkYFxuICogICBGb3IgZXhhbXBsZSBgPGRpdiAgW3N0eWxlXT1cIntjb2xvcjpleHAxfVwiIFtzdHlsZS5jb2xvcl09XCJleHAyXCI+YCBjaGFuZ2UgdG8gYGV4cDJgIHRvXG4gKiAgIGB1bmRlZmluZWRgIHJlcXVpcmVzIHRoYXQgd2UgY2hlY2sgYGV4cGAgKGFuZCBzdGF0aWMgdmFsdWVzKSBhbmQgdXNlIHRoYXQgYXMgbmV3IHZhbHVlLlxuICpcbiAqIE5PVEU6IFRoZSBzdHlsaW5nIHN0b3JlcyB0d28gdmFsdWVzLlxuICogMS4gVGhlIHJhdyB2YWx1ZSB3aGljaCBjYW1lIGZyb20gdGhlIGFwcGxpY2F0aW9uIGlzIHN0b3JlZCBhdCBgaW5kZXggKyAwYCBsb2NhdGlvbi4gKFRoaXMgdmFsdWVcbiAqICAgIGlzIHVzZWQgZm9yIGRpcnR5IGNoZWNraW5nKS5cbiAqIDIuIFRoZSBub3JtYWxpemVkIHZhbHVlIChjb252ZXJ0ZWQgdG8gYEFycmF5TWFwYCBpZiBtYXAgYW5kIHNhbml0aXplZCkgaXMgc3RvcmVkIGF0IGBpbmRleCArIDFgLlxuICogICAgVGhlIGFkdmFudGFnZSBvZiBzdG9yaW5nIHRoZSBzYW5pdGl6ZWQgdmFsdWUgaXMgdGhhdCBvbmNlIHRoZSB2YWx1ZSBpcyB3cml0dGVuIHdlIGRvbid0IG5lZWRcbiAqICAgIHRvIHdvcnJ5IGFib3V0IHNhbml0aXppbmcgaXQgbGF0ZXIgb3Iga2VlcGluZyB0cmFjayBvZiB0aGUgc2FuaXRpemVyLlxuICpcbiAqIEBwYXJhbSB0RGF0YSBgVERhdGFgIHVzZWQgZm9yIHRyYXZlcnNpbmcgdGhlIHByaW9yaXR5LlxuICogQHBhcmFtIHROb2RlIGBUTm9kZWAgdG8gdXNlIGZvciByZXNvbHZpbmcgc3RhdGljIHN0eWxpbmcuIEFsc28gY29udHJvbHMgc2VhcmNoIGRpcmVjdGlvbi5cbiAqICAgLSBgVE5vZGVgIHNlYXJjaCBuZXh0IGFuZCBxdWl0IGFzIHNvb24gYXMgYGlzU3R5bGluZ1ZhbHVlUHJlc2VudCh2YWx1ZSlgIGlzIHRydWUuXG4gKiAgICAgIElmIG5vIHZhbHVlIGZvdW5kIGNvbnN1bHQgYHROb2RlLnJlc2lkdWFsU3R5bGVgL2B0Tm9kZS5yZXNpZHVhbENsYXNzYCBmb3IgZGVmYXVsdCB2YWx1ZS5cbiAqICAgLSBgbnVsbGAgc2VhcmNoIHByZXYgYW5kIGdvIGFsbCB0aGUgd2F5IHRvIGVuZC4gUmV0dXJuIGxhc3QgdmFsdWUgd2hlcmVcbiAqICAgICBgaXNTdHlsaW5nVmFsdWVQcmVzZW50KHZhbHVlKWAgaXMgdHJ1ZS5cbiAqIEBwYXJhbSBsVmlldyBgTFZpZXdgIHVzZWQgZm9yIHJldHJpZXZpbmcgdGhlIGFjdHVhbCB2YWx1ZXMuXG4gKiBAcGFyYW0gcHJvcCBQcm9wZXJ0eSB3aGljaCB3ZSBhcmUgaW50ZXJlc3RlZCBpbi5cbiAqIEBwYXJhbSBpbmRleCBTdGFydGluZyBpbmRleCBpbiB0aGUgbGlua2VkIGxpc3Qgb2Ygc3R5bGluZyBiaW5kaW5ncyB3aGVyZSB0aGUgc2VhcmNoIHNob3VsZCBzdGFydC5cbiAqIEBwYXJhbSBpc0NsYXNzQmFzZWQgYHRydWVgIGlmIGBjbGFzc2AgKGBmYWxzZWAgaWYgYHN0eWxlYClcbiAqL1xuZnVuY3Rpb24gZmluZFN0eWxpbmdWYWx1ZShcbiAgICB0RGF0YTogVERhdGEsIHROb2RlOiBUTm9kZSB8IG51bGwsIGxWaWV3OiBMVmlldywgcHJvcDogc3RyaW5nLCBpbmRleDogbnVtYmVyLFxuICAgIGlzQ2xhc3NCYXNlZDogYm9vbGVhbik6IGFueSB7XG4gIGxldCB2YWx1ZTogYW55ID0gdW5kZWZpbmVkO1xuICB3aGlsZSAoaW5kZXggPiAwKSB7XG4gICAgY29uc3QgcmF3S2V5ID0gdERhdGFbaW5kZXhdIGFzIFRTdHlsaW5nS2V5O1xuICAgIGNvbnN0IGNvbnRhaW5zU3RhdGljcyA9IEFycmF5LmlzQXJyYXkocmF3S2V5KTtcbiAgICAvLyBVbndyYXAgdGhlIGtleSBpZiB3ZSBjb250YWluIHN0YXRpYyB2YWx1ZXMuXG4gICAgY29uc3Qga2V5ID0gY29udGFpbnNTdGF0aWNzID8gKHJhd0tleSBhcyBzdHJpbmdbXSlbMV0gOiByYXdLZXk7XG4gICAgbGV0IGN1cnJlbnRWYWx1ZSA9IGtleSA9PT0gbnVsbCA/IGFycmF5TWFwR2V0KGxWaWV3W2luZGV4ICsgMV0sIHByb3ApIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAga2V5ID09PSBwcm9wID8gbFZpZXdbaW5kZXggKyAxXSA6IHVuZGVmaW5lZDtcbiAgICBpZiAoY29udGFpbnNTdGF0aWNzICYmICFpc1N0eWxpbmdWYWx1ZVByZXNlbnQoY3VycmVudFZhbHVlKSkge1xuICAgICAgY3VycmVudFZhbHVlID0gYXJyYXlNYXBHZXQocmF3S2V5IGFzIEFycmF5TWFwPGFueT4sIHByb3ApO1xuICAgIH1cbiAgICBpZiAoaXNTdHlsaW5nVmFsdWVQcmVzZW50KGN1cnJlbnRWYWx1ZSkpIHtcbiAgICAgIHZhbHVlID0gY3VycmVudFZhbHVlO1xuICAgICAgaWYgKHROb2RlID09PSBudWxsKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgIH1cbiAgICB9XG4gICAgY29uc3QgdFJhbmdlID0gdERhdGFbaW5kZXggKyAxXSBhcyBUU3R5bGluZ1JhbmdlO1xuICAgIGluZGV4ID0gdE5vZGUgPT09IG51bGwgPyBnZXRUU3R5bGluZ1JhbmdlUHJldih0UmFuZ2UpIDogZ2V0VFN0eWxpbmdSYW5nZU5leHQodFJhbmdlKTtcbiAgfVxuICBpZiAodE5vZGUgIT09IG51bGwpIHtcbiAgICAvLyBpbiBjYXNlIHdoZXJlIHdlIGFyZSBnb2luZyBpbiBuZXh0IGRpcmVjdGlvbiBBTkQgd2UgZGlkIG5vdCBmaW5kIGFueXRoaW5nLCB3ZSBuZWVkIHRvXG4gICAgLy8gY29uc3VsdCByZXNpZHVhbCBzdHlsaW5nXG4gICAgbGV0IHJlc2lkdWFsID0gaXNDbGFzc0Jhc2VkID8gdE5vZGUucmVzaWR1YWxDbGFzc2VzIDogdE5vZGUucmVzaWR1YWxTdHlsZXM7XG4gICAgaWYgKHJlc2lkdWFsICE9IG51bGwgLyoqIE9SIHJlc2lkdWFsICE9PT0gdW5kZWZpbmVkICovKSB7XG4gICAgICB2YWx1ZSA9IGFycmF5TWFwR2V0KHJlc2lkdWFsICEsIHByb3ApO1xuICAgIH1cbiAgfVxuICByZXR1cm4gdmFsdWU7XG59XG5cbi8qKlxuICogRGV0ZXJtaW5lcyBpZiB0aGUgYmluZGluZyB2YWx1ZSBzaG91bGQgYmUgdXNlZCAob3IgaWYgdGhlIHZhbHVlIGlzICd1bmRlZmluZWQnIGFuZCBoZW5jZSBwcmlvcml0eVxuICogcmVzb2x1dGlvbiBzaG91bGQgYmUgdXNlZC4pXG4gKlxuICogQHBhcmFtIHZhbHVlIEJpbmRpbmcgc3R5bGUgdmFsdWUuXG4gKi9cbmZ1bmN0aW9uIGlzU3R5bGluZ1ZhbHVlUHJlc2VudCh2YWx1ZTogYW55KTogYm9vbGVhbiB7XG4gIC8vIEN1cnJlbnRseSBvbmx5IGB1bmRlZmluZWRgIHZhbHVlIGlzIGNvbnNpZGVyZWQgbm9uLWJpbmRpbmcuIFRoYXQgaXMgYHVuZGVmaW5lZGAgc2F5cyBJIGRvbid0XG4gIC8vIGhhdmUgYW4gb3BpbmlvbiBhcyB0byB3aGF0IHRoaXMgYmluZGluZyBzaG91bGQgYmUgYW5kIHlvdSBzaG91bGQgY29uc3VsdCBvdGhlciBiaW5kaW5ncyBieVxuICAvLyBwcmlvcml0eSB0byBkZXRlcm1pbmUgdGhlIHZhbGlkIHZhbHVlLlxuICAvLyBUaGlzIGlzIGV4dHJhY3RlZCBpbnRvIGEgc2luZ2xlIGZ1bmN0aW9uIHNvIHRoYXQgd2UgaGF2ZSBhIHNpbmdsZSBwbGFjZSB0byBjb250cm9sIHRoaXMuXG4gIHJldHVybiB2YWx1ZSAhPT0gdW5kZWZpbmVkO1xufVxuXG4vKipcbiAqIExhemlseSBjb21wdXRlcyBgdE5vZGUuY2xhc3Nlc01hcGAvYHROb2RlLnN0eWxlc01hcGAuXG4gKlxuICogVGhpcyBjb2RlIGlzIGhlcmUgYmVjYXVzZSB3ZSBkb24ndCB3YW50IHRvIGluY2x1ZGVkIGl0IGluIGBlbGVtZW50U3RhcnRgIGFzIGl0IHdvdWxkIG1ha2UgaGVsbG9cbiAqIHdvcmxkIGJpZ2dlciBldmVuIGlmIG5vIHN0eWxpbmcgd291bGQgYmUgcHJlc2VudC4gSW5zdGVhZCB3ZSBpbml0aWFsaXplIHRoZSB2YWx1ZXMgaGVyZSBzbyB0aGF0XG4gKiB0cmVlIHNoYWtpbmcgd2lsbCBvbmx5IGJyaW5nIGl0IGluIGlmIHN0eWxpbmcgaXMgcHJlc2VudC5cbiAqXG4gKiBAcGFyYW0gdE5vZGUgYFROb2RlYCB0byBpbml0aWFsaXplLlxuICovXG5leHBvcnQgZnVuY3Rpb24gaW5pdGlhbGl6ZVN0eWxpbmdTdGF0aWNBcnJheU1hcCh0Tm9kZTogVE5vZGUpIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEVxdWFsKHROb2RlLnJlc2lkdWFsQ2xhc3NlcywgdW5kZWZpbmVkLCAnQWxyZWFkeSBpbml0aWFsaXplZCEnKTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEVxdWFsKHROb2RlLnJlc2lkdWFsU3R5bGVzLCB1bmRlZmluZWQsICdBbHJlYWR5IGluaXRpYWxpemVkIScpO1xuICBsZXQgc3R5bGVNYXA6IEFycmF5TWFwPGFueT58bnVsbCA9IG51bGw7XG4gIGxldCBjbGFzc01hcDogQXJyYXlNYXA8YW55PnxudWxsID0gbnVsbDtcbiAgY29uc3QgbWVyZ2VBdHRycyA9IHROb2RlLm1lcmdlZEF0dHJzIHx8IEVNUFRZX0FSUkFZIGFzIFRBdHRyaWJ1dGVzO1xuICBsZXQgbW9kZTogQXR0cmlidXRlTWFya2VyID0gQXR0cmlidXRlTWFya2VyLkltcGxpY2l0QXR0cmlidXRlcztcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBtZXJnZUF0dHJzLmxlbmd0aDsgaSsrKSB7XG4gICAgbGV0IGl0ZW0gPSBtZXJnZUF0dHJzW2ldO1xuICAgIGlmICh0eXBlb2YgaXRlbSA9PT0gJ251bWJlcicpIHtcbiAgICAgIG1vZGUgPSBpdGVtO1xuICAgIH0gZWxzZSBpZiAobW9kZSA9PT0gQXR0cmlidXRlTWFya2VyLkNsYXNzZXMpIHtcbiAgICAgIGNsYXNzTWFwID0gY2xhc3NNYXAgfHwgW10gYXMgYW55O1xuICAgICAgYXJyYXlNYXBTZXQoY2xhc3NNYXAgISwgaXRlbSBhcyBzdHJpbmcsIHRydWUpO1xuICAgIH0gZWxzZSBpZiAobW9kZSA9PT0gQXR0cmlidXRlTWFya2VyLlN0eWxlcykge1xuICAgICAgc3R5bGVNYXAgPSBzdHlsZU1hcCB8fCBbXSBhcyBhbnk7XG4gICAgICBhcnJheU1hcFNldChzdHlsZU1hcCAhLCBpdGVtIGFzIHN0cmluZywgbWVyZ2VBdHRyc1srK2ldIGFzIHN0cmluZyk7XG4gICAgfVxuICB9XG4gIHROb2RlLnJlc2lkdWFsQ2xhc3NlcyA9IGNsYXNzTWFwO1xuICB0Tm9kZS5yZXNpZHVhbFN0eWxlcyA9IHN0eWxlTWFwO1xufVxuXG4vKipcbiAqIFNhbml0aXplcyBvciBhZGRzIHN1ZmZpeCB0byB0aGUgdmFsdWUuXG4gKlxuICogSWYgdmFsdWUgaXMgYG51bGxgL2B1bmRlZmluZWRgIG5vIHN1ZmZpeCBpcyBhZGRlZFxuICogQHBhcmFtIHZhbHVlXG4gKiBAcGFyYW0gc3VmZml4T3JTYW5pdGl6ZXJcbiAqL1xuZnVuY3Rpb24gbm9ybWFsaXplQW5kQXBwbHlTdWZmaXhPclNhbml0aXplcihcbiAgICB2YWx1ZTogYW55LCBzdWZmaXhPclNhbml0aXplcjogU2FuaXRpemVyRm4gfCBzdHJpbmcgfCB1bmRlZmluZWQgfCBudWxsKTogc3RyaW5nfG51bGx8dW5kZWZpbmVkfFxuICAgIGJvb2xlYW4ge1xuICBpZiAodmFsdWUgPT09IG51bGwgfHwgdmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgIC8vIGRvIG5vdGhpbmdcbiAgfSBlbHNlIGlmICh0eXBlb2Ygc3VmZml4T3JTYW5pdGl6ZXIgPT09ICdmdW5jdGlvbicpIHtcbiAgICAvLyBzYW5pdGl6ZSB0aGUgdmFsdWUuXG4gICAgdmFsdWUgPSBzdWZmaXhPclNhbml0aXplcih2YWx1ZSk7XG4gIH0gZWxzZSBpZiAodHlwZW9mIHN1ZmZpeE9yU2FuaXRpemVyID09PSAnc3RyaW5nJykge1xuICAgIHZhbHVlID0gdmFsdWUgKyBzdWZmaXhPclNhbml0aXplcjtcbiAgfSBlbHNlIGlmICh0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnKSB7XG4gICAgdmFsdWUgPSBzdHJpbmdpZnkodW53cmFwU2FmZVZhbHVlKHZhbHVlKSk7XG4gIH1cbiAgcmV0dXJuIHZhbHVlO1xufVxuXG5cbi8qKlxuICogVGVzdHMgaWYgdGhlIGBUTm9kZWAgaGFzIGlucHV0IHNoYWRvdy5cbiAqXG4gKiBBbiBpbnB1dCBzaGFkb3cgaXMgd2hlbiBhIGRpcmVjdGl2ZSBzdGVhbHMgKHNoYWRvd3MpIHRoZSBpbnB1dCBieSB1c2luZyBgQElucHV0KCdzdHlsZScpYCBvclxuICogYEBJbnB1dCgnY2xhc3MnKWAgYXMgaW5wdXQuXG4gKlxuICogQHBhcmFtIHROb2RlIGBUTm9kZWAgd2hpY2ggd2Ugd291bGQgbGlrZSB0byBzZWUgaWYgaXQgaGFzIHNoYWRvdy5cbiAqIEBwYXJhbSBpc0NsYXNzQmFzZWQgYHRydWVgIGlmIGBjbGFzc2AgKGBmYWxzZWAgaWYgYHN0eWxlYClcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGhhc1N0eWxpbmdJbnB1dFNoYWRvdyh0Tm9kZTogVE5vZGUsIGlzQ2xhc3NCYXNlZDogYm9vbGVhbikge1xuICByZXR1cm4gKHROb2RlLmZsYWdzICYgKGlzQ2xhc3NCYXNlZCA/IFROb2RlRmxhZ3MuaGFzQ2xhc3NJbnB1dCA6IFROb2RlRmxhZ3MuaGFzU3R5bGVJbnB1dCkpICE9PSAwO1xufVxuIl19