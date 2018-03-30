/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import './ng_dev_mode';
import { assertNotNull } from './assert';
import { unusedValueExportToPlacateAjd as unused1 } from './interfaces/node';
import { NG_PROJECT_AS_ATTR_NAME, unusedValueExportToPlacateAjd as unused2 } from './interfaces/projection';
const /** @type {?} */ unusedValueToPlacateAjd = unused1 + unused2;
/**
 * @param {?} nodeClassAttrVal
 * @param {?} cssClassToMatch
 * @return {?}
 */
function isCssClassMatching(nodeClassAttrVal, cssClassToMatch) {
    const /** @type {?} */ nodeClassesLen = nodeClassAttrVal.length;
    const /** @type {?} */ matchIndex = /** @type {?} */ ((nodeClassAttrVal)).indexOf(cssClassToMatch);
    const /** @type {?} */ matchEndIdx = matchIndex + cssClassToMatch.length;
    if (matchIndex === -1 // no match
        || (matchIndex > 0 && /** @type {?} */ ((nodeClassAttrVal))[matchIndex - 1] !== ' ') // no space before
        ||
            (matchEndIdx < nodeClassesLen && /** @type {?} */ ((nodeClassAttrVal))[matchEndIdx] !== ' ')) {
        return false;
    }
    return true;
}
/**
 * A utility function to match an Ivy node static data against a simple CSS selector
 *
 * @param {?} tNode
 * @param {?} selector
 * @return {?} true if node matches the selector.
 */
export function isNodeMatchingSimpleSelector(tNode, selector) {
    const /** @type {?} */ noOfSelectorParts = selector.length;
    ngDevMode && assertNotNull(selector[0], 'the selector should have a tag name');
    const /** @type {?} */ tagNameInSelector = selector[0];
    // check tag tame
    if (tagNameInSelector !== '' && tagNameInSelector !== tNode.tagName) {
        return false;
    }
    // short-circuit case where we are only matching on element's tag name
    if (noOfSelectorParts === 1) {
        return true;
    }
    // short-circuit case where an element has no attrs but a selector tries to match some
    if (noOfSelectorParts > 1 && !tNode.attrs) {
        return false;
    }
    const /** @type {?} */ attrsInNode = /** @type {?} */ ((tNode.attrs));
    for (let /** @type {?} */ i = 1; i < noOfSelectorParts; i += 2) {
        const /** @type {?} */ attrNameInSelector = selector[i];
        const /** @type {?} */ attrIdxInNode = attrsInNode.indexOf(attrNameInSelector);
        if (attrIdxInNode % 2 !== 0) {
            // attribute names are stored at even indexes
            return false;
        }
        else {
            const /** @type {?} */ attrValInSelector = selector[i + 1];
            if (attrValInSelector !== '') {
                // selector should also match on an attribute value
                const /** @type {?} */ attrValInNode = attrsInNode[attrIdxInNode + 1];
                if (attrNameInSelector === 'class') {
                    // iterate over all the remaining items in the selector selector array = class names
                    for (i++; i < noOfSelectorParts; i++) {
                        if (!isCssClassMatching(attrValInNode, selector[i])) {
                            return false;
                        }
                    }
                }
                else if (attrValInSelector !== attrValInNode) {
                    return false;
                }
            }
        }
    }
    return true;
}
/**
 * @param {?} tNode
 * @param {?} selector
 * @return {?}
 */
export function isNodeMatchingSelectorWithNegations(tNode, selector) {
    const /** @type {?} */ positiveSelector = selector[0];
    if (positiveSelector != null && !isNodeMatchingSimpleSelector(tNode, positiveSelector)) {
        return false;
    }
    // do we have any negation parts in this selector?
    const /** @type {?} */ negativeSelectors = selector[1];
    if (negativeSelectors) {
        for (let /** @type {?} */ i = 0; i < negativeSelectors.length; i++) {
            // if one of negative selectors matched than the whole selector doesn't match
            if (isNodeMatchingSimpleSelector(tNode, negativeSelectors[i])) {
                return false;
            }
        }
    }
    return true;
}
/**
 * @param {?} tNode
 * @param {?} selector
 * @return {?}
 */
export function isNodeMatchingSelector(tNode, selector) {
    for (let /** @type {?} */ i = 0; i < selector.length; i++) {
        if (isNodeMatchingSelectorWithNegations(tNode, selector[i])) {
            return true;
        }
    }
    return false;
}
/**
 * @param {?} tNode
 * @return {?}
 */
export function getProjectAsAttrValue(tNode) {
    const /** @type {?} */ nodeAttrs = tNode.attrs;
    if (nodeAttrs != null) {
        const /** @type {?} */ ngProjectAsAttrIdx = nodeAttrs.indexOf(NG_PROJECT_AS_ATTR_NAME);
        // only check for ngProjectAs in attribute names, don't accidentally match attribute's value
        // (attribute names are stored at even indexes)
        if ((ngProjectAsAttrIdx & 1) === 0) {
            return nodeAttrs[ngProjectAsAttrIdx + 1];
        }
    }
    return null;
}
/**
 * Checks a given node against matching selectors and returns
 * selector index (or 0 if none matched).
 *
 * This function takes into account the ngProjectAs attribute: if present its value will be compared
 * to the raw (un-parsed) CSS selector instead of using standard selector matching logic.
 * @param {?} tNode
 * @param {?} selectors
 * @param {?} textSelectors
 * @return {?}
 */
export function matchingSelectorIndex(tNode, selectors, textSelectors) {
    const /** @type {?} */ ngProjectAsAttrVal = getProjectAsAttrValue(tNode);
    for (let /** @type {?} */ i = 0; i < selectors.length; i++) {
        // if a node has the ngProjectAs attribute match it against unparsed selector
        // match a node against a parsed selector only if ngProjectAs attribute is not present
        if (ngProjectAsAttrVal === textSelectors[i] ||
            ngProjectAsAttrVal === null && isNodeMatchingSelector(tNode, selectors[i])) {
            return i + 1; // first matching selector "captures" a given node
        }
    }
    return 0;
}
//# sourceMappingURL=node_selector_matcher.js.map