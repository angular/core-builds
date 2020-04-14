/**
 * @fileoverview added by tsickle
 * Generated from: packages/core/src/render3/node_selector_matcher.ts
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import '../util/ng_dev_mode';
import { assertDefined, assertEqual, assertNotEqual } from '../util/assert';
import { unusedValueExportToPlacateAjd as unused1 } from './interfaces/node';
import { unusedValueExportToPlacateAjd as unused2 } from './interfaces/projection';
import { classIndexOf } from './styling/class_differ';
import { isNameOnlyAttributeMarker } from './util/attrs_utils';
/** @type {?} */
const unusedValueToPlacateAjd = unused1 + unused2;
/** @type {?} */
const NG_TEMPLATE_SELECTOR = 'ng-template';
/**
 * Search the `TAttributes` to see if it contains `cssClassToMatch` (case insensitive)
 *
 * @param {?} attrs `TAttributes` to search through.
 * @param {?} cssClassToMatch class to match (lowercase)
 * @param {?} isProjectionMode Whether or not class matching should look into the attribute `class` in
 *    addition to the `AttributeMarker.Classes`.
 * @return {?}
 */
function isCssClassMatching(attrs, cssClassToMatch, isProjectionMode) {
    // TODO(misko): The fact that this function needs to know about `isProjectionMode` seems suspect.
    // It is strange to me that sometimes the class information comes in form of `class` attribute
    // and sometimes in form of `AttributeMarker.Classes`. Some investigation is needed to determine
    // if that is the right behavior.
    ngDevMode &&
        assertEqual(cssClassToMatch, cssClassToMatch.toLowerCase(), 'Class name expected to be lowercase.');
    /** @type {?} */
    let i = 0;
    while (i < attrs.length) {
        /** @type {?} */
        let item = attrs[i++];
        if (isProjectionMode && item === 'class') {
            item = (/** @type {?} */ (attrs[i]));
            if (classIndexOf(item.toLowerCase(), cssClassToMatch, 0) !== -1) {
                return true;
            }
        }
        else if (item === 1 /* Classes */) {
            // We found the classes section. Start searching for the class.
            while (i < attrs.length && typeof (item = attrs[i++]) == 'string') {
                // while we have strings
                if (item.toLowerCase() === cssClassToMatch)
                    return true;
            }
            return false;
        }
    }
    return false;
}
/**
 * Function that checks whether a given tNode matches tag-based selector and has a valid type.
 *
 * Matching can be performed in 2 modes: projection mode (when we project nodes) and regular
 * directive matching mode:
 * - in the "directive matching" mode we do _not_ take TContainer's tagName into account if it is
 * different from NG_TEMPLATE_SELECTOR (value different from NG_TEMPLATE_SELECTOR indicates that a
 * tag name was extracted from * syntax so we would match the same directive twice);
 * - in the "projection" mode, we use a tag name potentially extracted from the * syntax processing
 * (applicable to TNodeType.Container only).
 * @param {?} tNode
 * @param {?} currentSelector
 * @param {?} isProjectionMode
 * @return {?}
 */
function hasTagAndTypeMatch(tNode, currentSelector, isProjectionMode) {
    /** @type {?} */
    const tagNameToCompare = tNode.type === 0 /* Container */ && !isProjectionMode ?
        NG_TEMPLATE_SELECTOR :
        tNode.tagName;
    return currentSelector === tagNameToCompare;
}
/**
 * A utility function to match an Ivy node static data against a simple CSS selector
 *
 * @param {?} tNode
 * @param {?} selector The selector to try matching against the node.
 * @param {?} isProjectionMode if `true` we are matching for content projection, otherwise we are doing
 * directive matching.
 * @return {?} true if node matches the selector.
 */
export function isNodeMatchingSelector(tNode, selector, isProjectionMode) {
    ngDevMode && assertDefined(selector[0], 'Selector should have a tag name');
    /** @type {?} */
    let mode = 4 /* ELEMENT */;
    /** @type {?} */
    const nodeAttrs = tNode.attrs || [];
    // Find the index of first attribute that has no value, only a name.
    /** @type {?} */
    const nameOnlyMarkerIdx = getNameOnlyMarkerIndex(nodeAttrs);
    // When processing ":not" selectors, we skip to the next ":not" if the
    // current one doesn't match
    /** @type {?} */
    let skipToNextSelector = false;
    for (let i = 0; i < selector.length; i++) {
        /** @type {?} */
        const current = selector[i];
        if (typeof current === 'number') {
            // If we finish processing a :not selector and it hasn't failed, return false
            if (!skipToNextSelector && !isPositive(mode) && !isPositive(current)) {
                return false;
            }
            // If we are skipping to the next :not() and this mode flag is positive,
            // it's a part of the current :not() selector, and we should keep skipping
            if (skipToNextSelector && isPositive(current))
                continue;
            skipToNextSelector = false;
            mode = ((/** @type {?} */ (current))) | (mode & 1 /* NOT */);
            continue;
        }
        if (skipToNextSelector)
            continue;
        if (mode & 4 /* ELEMENT */) {
            mode = 2 /* ATTRIBUTE */ | mode & 1 /* NOT */;
            if (current !== '' && !hasTagAndTypeMatch(tNode, current, isProjectionMode) ||
                current === '' && selector.length === 1) {
                if (isPositive(mode))
                    return false;
                skipToNextSelector = true;
            }
        }
        else {
            /** @type {?} */
            const selectorAttrValue = mode & 8 /* CLASS */ ? current : selector[++i];
            // special case for matching against classes when a tNode has been instantiated with
            // class and style values as separate attribute values (e.g. ['title', CLASS, 'foo'])
            if ((mode & 8 /* CLASS */) && tNode.attrs !== null) {
                if (!isCssClassMatching(tNode.attrs, (/** @type {?} */ (selectorAttrValue)), isProjectionMode)) {
                    if (isPositive(mode))
                        return false;
                    skipToNextSelector = true;
                }
                continue;
            }
            /** @type {?} */
            const isInlineTemplate = tNode.type == 0 /* Container */ && tNode.tagName !== NG_TEMPLATE_SELECTOR;
            /** @type {?} */
            const attrName = (mode & 8 /* CLASS */) ? 'class' : current;
            /** @type {?} */
            const attrIndexInNode = findAttrIndexInNode(attrName, nodeAttrs, isInlineTemplate, isProjectionMode);
            if (attrIndexInNode === -1) {
                if (isPositive(mode))
                    return false;
                skipToNextSelector = true;
                continue;
            }
            if (selectorAttrValue !== '') {
                /** @type {?} */
                let nodeAttrValue;
                if (attrIndexInNode > nameOnlyMarkerIdx) {
                    nodeAttrValue = '';
                }
                else {
                    ngDevMode &&
                        assertNotEqual(nodeAttrs[attrIndexInNode], 0 /* NamespaceURI */, 'We do not match directives on namespaced attributes');
                    // we lowercase the attribute value to be able to match
                    // selectors without case-sensitivity
                    // (selectors are already in lowercase when generated)
                    nodeAttrValue = ((/** @type {?} */ (nodeAttrs[attrIndexInNode + 1]))).toLowerCase();
                }
                /** @type {?} */
                const compareAgainstClassName = mode & 8 /* CLASS */ ? nodeAttrValue : null;
                if (compareAgainstClassName &&
                    classIndexOf(compareAgainstClassName, (/** @type {?} */ (selectorAttrValue)), 0) !== -1 ||
                    mode & 2 /* ATTRIBUTE */ && selectorAttrValue !== nodeAttrValue) {
                    if (isPositive(mode))
                        return false;
                    skipToNextSelector = true;
                }
            }
        }
    }
    return isPositive(mode) || skipToNextSelector;
}
/**
 * @param {?} mode
 * @return {?}
 */
function isPositive(mode) {
    return (mode & 1 /* NOT */) === 0;
}
/**
 * Examines the attribute's definition array for a node to find the index of the
 * attribute that matches the given `name`.
 *
 * NOTE: This will not match namespaced attributes.
 *
 * Attribute matching depends upon `isInlineTemplate` and `isProjectionMode`.
 * The following table summarizes which types of attributes we attempt to match:
 *
 * ===========================================================================================================
 * Modes                   | Normal Attributes | Bindings Attributes | Template Attributes | I18n
 * Attributes
 * ===========================================================================================================
 * Inline + Projection     | YES               | YES                 | NO                  | YES
 * -----------------------------------------------------------------------------------------------------------
 * Inline + Directive      | NO                | NO                  | YES                 | NO
 * -----------------------------------------------------------------------------------------------------------
 * Non-inline + Projection | YES               | YES                 | NO                  | YES
 * -----------------------------------------------------------------------------------------------------------
 * Non-inline + Directive  | YES               | YES                 | NO                  | YES
 * ===========================================================================================================
 *
 * @param {?} name the name of the attribute to find
 * @param {?} attrs the attribute array to examine
 * @param {?} isInlineTemplate true if the node being matched is an inline template (e.g. `*ngFor`)
 * rather than a manually expanded template node (e.g `<ng-template>`).
 * @param {?} isProjectionMode true if we are matching against content projection otherwise we are
 * matching against directives.
 * @return {?}
 */
function findAttrIndexInNode(name, attrs, isInlineTemplate, isProjectionMode) {
    if (attrs === null)
        return -1;
    /** @type {?} */
    let i = 0;
    if (isProjectionMode || !isInlineTemplate) {
        /** @type {?} */
        let bindingsMode = false;
        while (i < attrs.length) {
            /** @type {?} */
            const maybeAttrName = attrs[i];
            if (maybeAttrName === name) {
                return i;
            }
            else if (maybeAttrName === 3 /* Bindings */ || maybeAttrName === 6 /* I18n */) {
                bindingsMode = true;
            }
            else if (maybeAttrName === 1 /* Classes */ || maybeAttrName === 2 /* Styles */) {
                /** @type {?} */
                let value = attrs[++i];
                // We should skip classes here because we have a separate mechanism for
                // matching classes in projection mode.
                while (typeof value === 'string') {
                    value = attrs[++i];
                }
                continue;
            }
            else if (maybeAttrName === 4 /* Template */) {
                // We do not care about Template attributes in this scenario.
                break;
            }
            else if (maybeAttrName === 0 /* NamespaceURI */) {
                // Skip the whole namespaced attribute and value. This is by design.
                i += 4;
                continue;
            }
            // In binding mode there are only names, rather than name-value pairs.
            i += bindingsMode ? 1 : 2;
        }
        // We did not match the attribute
        return -1;
    }
    else {
        return matchTemplateAttribute(attrs, name);
    }
}
/**
 * @param {?} tNode
 * @param {?} selector
 * @param {?=} isProjectionMode
 * @return {?}
 */
export function isNodeMatchingSelectorList(tNode, selector, isProjectionMode = false) {
    for (let i = 0; i < selector.length; i++) {
        if (isNodeMatchingSelector(tNode, selector[i], isProjectionMode)) {
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
    /** @type {?} */
    const nodeAttrs = tNode.attrs;
    if (nodeAttrs != null) {
        /** @type {?} */
        const ngProjectAsAttrIdx = nodeAttrs.indexOf(5 /* ProjectAs */);
        // only check for ngProjectAs in attribute names, don't accidentally match attribute's value
        // (attribute names are stored at even indexes)
        if ((ngProjectAsAttrIdx & 1) === 0) {
            return (/** @type {?} */ (nodeAttrs[ngProjectAsAttrIdx + 1]));
        }
    }
    return null;
}
/**
 * @param {?} nodeAttrs
 * @return {?}
 */
function getNameOnlyMarkerIndex(nodeAttrs) {
    for (let i = 0; i < nodeAttrs.length; i++) {
        /** @type {?} */
        const nodeAttr = nodeAttrs[i];
        if (isNameOnlyAttributeMarker(nodeAttr)) {
            return i;
        }
    }
    return nodeAttrs.length;
}
/**
 * @param {?} attrs
 * @param {?} name
 * @return {?}
 */
function matchTemplateAttribute(attrs, name) {
    /** @type {?} */
    let i = attrs.indexOf(4 /* Template */);
    if (i > -1) {
        i++;
        while (i < attrs.length) {
            if (attrs[i] === name)
                return i;
            i++;
        }
    }
    return -1;
}
/**
 * Checks whether a selector is inside a CssSelectorList
 * @param {?} selector Selector to be checked.
 * @param {?} list List in which to look for the selector.
 * @return {?}
 */
export function isSelectorInSelectorList(selector, list) {
    selectorListLoop: for (let i = 0; i < list.length; i++) {
        /** @type {?} */
        const currentSelectorInList = list[i];
        if (selector.length !== currentSelectorInList.length) {
            continue;
        }
        for (let j = 0; j < selector.length; j++) {
            if (selector[j] !== currentSelectorInList[j]) {
                continue selectorListLoop;
            }
        }
        return true;
    }
    return false;
}
/**
 * @param {?} isNegativeMode
 * @param {?} chunk
 * @return {?}
 */
function maybeWrapInNotSelector(isNegativeMode, chunk) {
    return isNegativeMode ? ':not(' + chunk.trim() + ')' : chunk;
}
/**
 * @param {?} selector
 * @return {?}
 */
function stringifyCSSSelector(selector) {
    /** @type {?} */
    let result = (/** @type {?} */ (selector[0]));
    /** @type {?} */
    let i = 1;
    /** @type {?} */
    let mode = 2 /* ATTRIBUTE */;
    /** @type {?} */
    let currentChunk = '';
    /** @type {?} */
    let isNegativeMode = false;
    while (i < selector.length) {
        /** @type {?} */
        let valueOrMarker = selector[i];
        if (typeof valueOrMarker === 'string') {
            if (mode & 2 /* ATTRIBUTE */) {
                /** @type {?} */
                const attrValue = (/** @type {?} */ (selector[++i]));
                currentChunk +=
                    '[' + valueOrMarker + (attrValue.length > 0 ? '="' + attrValue + '"' : '') + ']';
            }
            else if (mode & 8 /* CLASS */) {
                currentChunk += '.' + valueOrMarker;
            }
            else if (mode & 4 /* ELEMENT */) {
                currentChunk += ' ' + valueOrMarker;
            }
        }
        else {
            //
            // Append current chunk to the final result in case we come across SelectorFlag, which
            // indicates that the previous section of a selector is over. We need to accumulate content
            // between flags to make sure we wrap the chunk later in :not() selector if needed, e.g.
            // ```
            //  ['', Flags.CLASS, '.classA', Flags.CLASS | Flags.NOT, '.classB', '.classC']
            // ```
            // should be transformed to `.classA :not(.classB .classC)`.
            //
            // Note: for negative selector part, we accumulate content between flags until we find the
            // next negative flag. This is needed to support a case where `:not()` rule contains more than
            // one chunk, e.g. the following selector:
            // ```
            //  ['', Flags.ELEMENT | Flags.NOT, 'p', Flags.CLASS, 'foo', Flags.CLASS | Flags.NOT, 'bar']
            // ```
            // should be stringified to `:not(p.foo) :not(.bar)`
            //
            if (currentChunk !== '' && !isPositive(valueOrMarker)) {
                result += maybeWrapInNotSelector(isNegativeMode, currentChunk);
                currentChunk = '';
            }
            mode = valueOrMarker;
            // According to CssSelector spec, once we come across `SelectorFlags.NOT` flag, the negative
            // mode is maintained for remaining chunks of a selector.
            isNegativeMode = isNegativeMode || !isPositive(mode);
        }
        i++;
    }
    if (currentChunk !== '') {
        result += maybeWrapInNotSelector(isNegativeMode, currentChunk);
    }
    return result;
}
/**
 * Generates string representation of CSS selector in parsed form.
 *
 * ComponentDef and DirectiveDef are generated with the selector in parsed form to avoid doing
 * additional parsing at runtime (for example, for directive matching). However in some cases (for
 * example, while bootstrapping a component), a string version of the selector is required to query
 * for the host element on the page. This function takes the parsed form of a selector and returns
 * its string representation.
 *
 * @param {?} selectorList selector in parsed form
 * @return {?} string representation of a given selector
 */
export function stringifyCSSSelectorList(selectorList) {
    return selectorList.map(stringifyCSSSelector).join(',');
}
/**
 * Extracts attributes and classes information from a given CSS selector.
 *
 * This function is used while creating a component dynamically. In this case, the host element
 * (that is created dynamically) should contain attributes and classes specified in component's CSS
 * selector.
 *
 * @param {?} selector CSS selector in parsed form (in a form of array)
 * @return {?} object with `attrs` and `classes` fields that contain extracted information
 */
export function extractAttrsAndClassesFromSelector(selector) {
    /** @type {?} */
    const attrs = [];
    /** @type {?} */
    const classes = [];
    /** @type {?} */
    let i = 1;
    /** @type {?} */
    let mode = 2 /* ATTRIBUTE */;
    while (i < selector.length) {
        /** @type {?} */
        let valueOrMarker = selector[i];
        if (typeof valueOrMarker === 'string') {
            if (mode === 2 /* ATTRIBUTE */) {
                if (valueOrMarker !== '') {
                    attrs.push(valueOrMarker, (/** @type {?} */ (selector[++i])));
                }
            }
            else if (mode === 8 /* CLASS */) {
                classes.push(valueOrMarker);
            }
        }
        else {
            // According to CssSelector spec, once we come across `SelectorFlags.NOT` flag, the negative
            // mode is maintained for remaining chunks of a selector. Since attributes and classes are
            // extracted only for "positive" part of the selector, we can stop here.
            if (!isPositive(mode))
                break;
            mode = valueOrMarker;
        }
        i++;
    }
    return { attrs, classes };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9kZV9zZWxlY3Rvcl9tYXRjaGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9ub2RlX3NlbGVjdG9yX21hdGNoZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxxQkFBcUIsQ0FBQztBQUU3QixPQUFPLEVBQUMsYUFBYSxFQUFFLFdBQVcsRUFBRSxjQUFjLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUUxRSxPQUFPLEVBQWlELDZCQUE2QixJQUFJLE9BQU8sRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQzNILE9BQU8sRUFBOEMsNkJBQTZCLElBQUksT0FBTyxFQUFDLE1BQU0seUJBQXlCLENBQUM7QUFDOUgsT0FBTyxFQUFDLFlBQVksRUFBQyxNQUFNLHdCQUF3QixDQUFDO0FBQ3BELE9BQU8sRUFBQyx5QkFBeUIsRUFBQyxNQUFNLG9CQUFvQixDQUFDOztNQUV2RCx1QkFBdUIsR0FBRyxPQUFPLEdBQUcsT0FBTzs7TUFFM0Msb0JBQW9CLEdBQUcsYUFBYTs7Ozs7Ozs7OztBQVUxQyxTQUFTLGtCQUFrQixDQUN2QixLQUFrQixFQUFFLGVBQXVCLEVBQUUsZ0JBQXlCO0lBQ3hFLGlHQUFpRztJQUNqRyw4RkFBOEY7SUFDOUYsZ0dBQWdHO0lBQ2hHLGlDQUFpQztJQUNqQyxTQUFTO1FBQ0wsV0FBVyxDQUNQLGVBQWUsRUFBRSxlQUFlLENBQUMsV0FBVyxFQUFFLEVBQUUsc0NBQXNDLENBQUMsQ0FBQzs7UUFDNUYsQ0FBQyxHQUFHLENBQUM7SUFDVCxPQUFPLENBQUMsR0FBRyxLQUFLLENBQUMsTUFBTSxFQUFFOztZQUNuQixJQUFJLEdBQUcsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDO1FBQ3JCLElBQUksZ0JBQWdCLElBQUksSUFBSSxLQUFLLE9BQU8sRUFBRTtZQUN4QyxJQUFJLEdBQUcsbUJBQUEsS0FBSyxDQUFDLENB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SyxFQUFFLE9BQU8sRUFBQyxDQUFDO0FBQzFCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCAnLi4vdXRpbC9uZ19kZXZfbW9kZSc7XG5cbmltcG9ydCB7YXNzZXJ0RGVmaW5lZCwgYXNzZXJ0RXF1YWwsIGFzc2VydE5vdEVxdWFsfSBmcm9tICcuLi91dGlsL2Fzc2VydCc7XG5cbmltcG9ydCB7QXR0cmlidXRlTWFya2VyLCBUQXR0cmlidXRlcywgVE5vZGUsIFROb2RlVHlwZSwgdW51c2VkVmFsdWVFeHBvcnRUb1BsYWNhdGVBamQgYXMgdW51c2VkMX0gZnJvbSAnLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtDc3NTZWxlY3RvciwgQ3NzU2VsZWN0b3JMaXN0LCBTZWxlY3RvckZsYWdzLCB1bnVzZWRWYWx1ZUV4cG9ydFRvUGxhY2F0ZUFqZCBhcyB1bnVzZWQyfSBmcm9tICcuL2ludGVyZmFjZXMvcHJvamVjdGlvbic7XG5pbXBvcnQge2NsYXNzSW5kZXhPZn0gZnJvbSAnLi9zdHlsaW5nL2NsYXNzX2RpZmZlcic7XG5pbXBvcnQge2lzTmFtZU9ubHlBdHRyaWJ1dGVNYXJrZXJ9IGZyb20gJy4vdXRpbC9hdHRyc191dGlscyc7XG5cbmNvbnN0IHVudXNlZFZhbHVlVG9QbGFjYXRlQWpkID0gdW51c2VkMSArIHVudXNlZDI7XG5cbmNvbnN0IE5HX1RFTVBMQVRFX1NFTEVDVE9SID0gJ25nLXRlbXBsYXRlJztcblxuLyoqXG4gKiBTZWFyY2ggdGhlIGBUQXR0cmlidXRlc2AgdG8gc2VlIGlmIGl0IGNvbnRhaW5zIGBjc3NDbGFzc1RvTWF0Y2hgIChjYXNlIGluc2Vuc2l0aXZlKVxuICpcbiAqIEBwYXJhbSBhdHRycyBgVEF0dHJpYnV0ZXNgIHRvIHNlYXJjaCB0aHJvdWdoLlxuICogQHBhcmFtIGNzc0NsYXNzVG9NYXRjaCBjbGFzcyB0byBtYXRjaCAobG93ZXJjYXNlKVxuICogQHBhcmFtIGlzUHJvamVjdGlvbk1vZGUgV2hldGhlciBvciBub3QgY2xhc3MgbWF0Y2hpbmcgc2hvdWxkIGxvb2sgaW50byB0aGUgYXR0cmlidXRlIGBjbGFzc2AgaW5cbiAqICAgIGFkZGl0aW9uIHRvIHRoZSBgQXR0cmlidXRlTWFya2VyLkNsYXNzZXNgLlxuICovXG5mdW5jdGlvbiBpc0Nzc0NsYXNzTWF0Y2hpbmcoXG4gICAgYXR0cnM6IFRBdHRyaWJ1dGVzLCBjc3NDbGFzc1RvTWF0Y2g6IHN0cmluZywgaXNQcm9qZWN0aW9uTW9kZTogYm9vbGVhbik6IGJvb2xlYW4ge1xuICAvLyBUT0RPKG1pc2tvKTogVGhlIGZhY3QgdGhhdCB0aGlzIGZ1bmN0aW9uIG5lZWRzIHRvIGtub3cgYWJvdXQgYGlzUHJvamVjdGlvbk1vZGVgIHNlZW1zIHN1c3BlY3QuXG4gIC8vIEl0IGlzIHN0cmFuZ2UgdG8gbWUgdGhhdCBzb21ldGltZXMgdGhlIGNsYXNzIGluZm9ybWF0aW9uIGNvbWVzIGluIGZvcm0gb2YgYGNsYXNzYCBhdHRyaWJ1dGVcbiAgLy8gYW5kIHNvbWV0aW1lcyBpbiBmb3JtIG9mIGBBdHRyaWJ1dGVNYXJrZXIuQ2xhc3Nlc2AuIFNvbWUgaW52ZXN0aWdhdGlvbiBpcyBuZWVkZWQgdG8gZGV0ZXJtaW5lXG4gIC8vIGlmIHRoYXQgaXMgdGhlIHJpZ2h0IGJlaGF2aW9yLlxuICBuZ0Rldk1vZGUgJiZcbiAgICAgIGFzc2VydEVxdWFsKFxuICAgICAgICAgIGNzc0NsYXNzVG9NYXRjaCwgY3NzQ2xhc3NUb01hdGNoLnRvTG93ZXJDYXNlKCksICdDbGFzcyBuYW1lIGV4cGVjdGVkIHRvIGJlIGxvd2VyY2FzZS4nKTtcbiAgbGV0IGkgPSAwO1xuICB3aGlsZSAoaSA8IGF0dHJzLmxlbmd0aCkge1xuICAgIGxldCBpdGVtID0gYXR0cnNbaSsrXTtcbiAgICBpZiAoaXNQcm9qZWN0aW9uTW9kZSAmJiBpdGVtID09PSAnY2xhc3MnKSB7XG4gICAgICBpdGVtID0gYXR0cnNbaV0gYXMgc3RyaW5nO1xuICAgICAgaWYgKGNsYXNzSW5kZXhPZihpdGVtLnRvTG93ZXJDYXNlKCksIGNzc0NsYXNzVG9NYXRjaCwgMCkgIT09IC0xKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoaXRlbSA9PT0gQXR0cmlidXRlTWFya2VyLkNsYXNzZXMpIHtcbiAgICAgIC8vIFdlIGZvdW5kIHRoZSBjbGFzc2VzIHNlY3Rpb24uIFN0YXJ0IHNlYXJjaGluZyBmb3IgdGhlIGNsYXNzLlxuICAgICAgd2hpbGUgKGkgPCBhdHRycy5sZW5ndGggJiYgdHlwZW9mIChpdGVtID0gYXR0cnNbaSsrXSkgPT0gJ3N0cmluZycpIHtcbiAgICAgICAgLy8gd2hpbGUgd2UgaGF2ZSBzdHJpbmdzXG4gICAgICAgIGlmIChpdGVtLnRvTG93ZXJDYXNlKCkgPT09IGNzc0NsYXNzVG9NYXRjaCkgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG4gIHJldHVybiBmYWxzZTtcbn1cblxuLyoqXG4gKiBGdW5jdGlvbiB0aGF0IGNoZWNrcyB3aGV0aGVyIGEgZ2l2ZW4gdE5vZGUgbWF0Y2hlcyB0YWctYmFzZWQgc2VsZWN0b3IgYW5kIGhhcyBhIHZhbGlkIHR5cGUuXG4gKlxuICogTWF0Y2hpbmcgY2FuIGJlIHBlcmZvcm1lZCBpbiAyIG1vZGVzOiBwcm9qZWN0aW9uIG1vZGUgKHdoZW4gd2UgcHJvamVjdCBub2RlcykgYW5kIHJlZ3VsYXJcbiAqIGRpcmVjdGl2ZSBtYXRjaGluZyBtb2RlOlxuICogLSBpbiB0aGUgXCJkaXJlY3RpdmUgbWF0Y2hpbmdcIiBtb2RlIHdlIGRvIF9ub3RfIHRha2UgVENvbnRhaW5lcidzIHRhZ05hbWUgaW50byBhY2NvdW50IGlmIGl0IGlzXG4gKiBkaWZmZXJlbnQgZnJvbSBOR19URU1QTEFURV9TRUxFQ1RPUiAodmFsdWUgZGlmZmVyZW50IGZyb20gTkdfVEVNUExBVEVfU0VMRUNUT1IgaW5kaWNhdGVzIHRoYXQgYVxuICogdGFnIG5hbWUgd2FzIGV4dHJhY3RlZCBmcm9tICogc3ludGF4IHNvIHdlIHdvdWxkIG1hdGNoIHRoZSBzYW1lIGRpcmVjdGl2ZSB0d2ljZSk7XG4gKiAtIGluIHRoZSBcInByb2plY3Rpb25cIiBtb2RlLCB3ZSB1c2UgYSB0YWcgbmFtZSBwb3RlbnRpYWxseSBleHRyYWN0ZWQgZnJvbSB0aGUgKiBzeW50YXggcHJvY2Vzc2luZ1xuICogKGFwcGxpY2FibGUgdG8gVE5vZGVUeXBlLkNvbnRhaW5lciBvbmx5KS5cbiAqL1xuZnVuY3Rpb24gaGFzVGFnQW5kVHlwZU1hdGNoKFxuICAgIHROb2RlOiBUTm9kZSwgY3VycmVudFNlbGVjdG9yOiBzdHJpbmcsIGlzUHJvamVjdGlvbk1vZGU6IGJvb2xlYW4pOiBib29sZWFuIHtcbiAgY29uc3QgdGFnTmFtZVRvQ29tcGFyZSA9IHROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5Db250YWluZXIgJiYgIWlzUHJvamVjdGlvbk1vZGUgP1xuICAgICAgTkdfVEVNUExBVEVfU0VMRUNUT1IgOlxuICAgICAgdE5vZGUudGFnTmFtZTtcbiAgcmV0dXJuIGN1cnJlbnRTZWxlY3RvciA9PT0gdGFnTmFtZVRvQ29tcGFyZTtcbn1cblxuLyoqXG4gKiBBIHV0aWxpdHkgZnVuY3Rpb24gdG8gbWF0Y2ggYW4gSXZ5IG5vZGUgc3RhdGljIGRhdGEgYWdhaW5zdCBhIHNpbXBsZSBDU1Mgc2VsZWN0b3JcbiAqXG4gKiBAcGFyYW0gbm9kZSBzdGF0aWMgZGF0YSBvZiB0aGUgbm9kZSB0byBtYXRjaFxuICogQHBhcmFtIHNlbGVjdG9yIFRoZSBzZWxlY3RvciB0byB0cnkgbWF0Y2hpbmcgYWdhaW5zdCB0aGUgbm9kZS5cbiAqIEBwYXJhbSBpc1Byb2plY3Rpb25Nb2RlIGlmIGB0cnVlYCB3ZSBhcmUgbWF0Y2hpbmcgZm9yIGNvbnRlbnQgcHJvamVjdGlvbiwgb3RoZXJ3aXNlIHdlIGFyZSBkb2luZ1xuICogZGlyZWN0aXZlIG1hdGNoaW5nLlxuICogQHJldHVybnMgdHJ1ZSBpZiBub2RlIG1hdGNoZXMgdGhlIHNlbGVjdG9yLlxuICovXG5leHBvcnQgZnVuY3Rpb24gaXNOb2RlTWF0Y2hpbmdTZWxlY3RvcihcbiAgICB0Tm9kZTogVE5vZGUsIHNlbGVjdG9yOiBDc3NTZWxlY3RvciwgaXNQcm9qZWN0aW9uTW9kZTogYm9vbGVhbik6IGJvb2xlYW4ge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChzZWxlY3RvclswXSwgJ1NlbGVjdG9yIHNob3VsZCBoYXZlIGEgdGFnIG5hbWUnKTtcbiAgbGV0IG1vZGU6IFNlbGVjdG9yRmxhZ3MgPSBTZWxlY3RvckZsYWdzLkVMRU1FTlQ7XG4gIGNvbnN0IG5vZGVBdHRycyA9IHROb2RlLmF0dHJzIHx8IFtdO1xuXG4gIC8vIEZpbmQgdGhlIGluZGV4IG9mIGZpcnN0IGF0dHJpYnV0ZSB0aGF0IGhhcyBubyB2YWx1ZSwgb25seSBhIG5hbWUuXG4gIGNvbnN0IG5hbWVPbmx5TWFya2VySWR4ID0gZ2V0TmFtZU9ubHlNYXJrZXJJbmRleChub2RlQXR0cnMpO1xuXG4gIC8vIFdoZW4gcHJvY2Vzc2luZyBcIjpub3RcIiBzZWxlY3RvcnMsIHdlIHNraXAgdG8gdGhlIG5leHQgXCI6bm90XCIgaWYgdGhlXG4gIC8vIGN1cnJlbnQgb25lIGRvZXNuJ3QgbWF0Y2hcbiAgbGV0IHNraXBUb05leHRTZWxlY3RvciA9IGZhbHNlO1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgc2VsZWN0b3IubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBjdXJyZW50ID0gc2VsZWN0b3JbaV07XG4gICAgaWYgKHR5cGVvZiBjdXJyZW50ID09PSAnbnVtYmVyJykge1xuICAgICAgLy8gSWYgd2UgZmluaXNoIHByb2Nlc3NpbmcgYSA6bm90IHNlbGVjdG9yIGFuZCBpdCBoYXNuJ3QgZmFpbGVkLCByZXR1cm4gZmFsc2VcbiAgICAgIGlmICghc2tpcFRvTmV4dFNlbGVjdG9yICYmICFpc1Bvc2l0aXZlKG1vZGUpICYmICFpc1Bvc2l0aXZlKGN1cnJlbnQpKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIC8vIElmIHdlIGFyZSBza2lwcGluZyB0byB0aGUgbmV4dCA6bm90KCkgYW5kIHRoaXMgbW9kZSBmbGFnIGlzIHBvc2l0aXZlLFxuICAgICAgLy8gaXQncyBhIHBhcnQgb2YgdGhlIGN1cnJlbnQgOm5vdCgpIHNlbGVjdG9yLCBhbmQgd2Ugc2hvdWxkIGtlZXAgc2tpcHBpbmdcbiAgICAgIGlmIChza2lwVG9OZXh0U2VsZWN0b3IgJiYgaXNQb3NpdGl2ZShjdXJyZW50KSkgY29udGludWU7XG4gICAgICBza2lwVG9OZXh0U2VsZWN0b3IgPSBmYWxzZTtcbiAgICAgIG1vZGUgPSAoY3VycmVudCBhcyBudW1iZXIpIHwgKG1vZGUgJiBTZWxlY3RvckZsYWdzLk5PVCk7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAoc2tpcFRvTmV4dFNlbGVjdG9yKSBjb250aW51ZTtcblxuICAgIGlmIChtb2RlICYgU2VsZWN0b3JGbGFncy5FTEVNRU5UKSB7XG4gICAgICBtb2RlID0gU2VsZWN0b3JGbGFncy5BVFRSSUJVVEUgfCBtb2RlICYgU2VsZWN0b3JGbGFncy5OT1Q7XG4gICAgICBpZiAoY3VycmVudCAhPT0gJycgJiYgIWhhc1RhZ0FuZFR5cGVNYXRjaCh0Tm9kZSwgY3VycmVudCwgaXNQcm9qZWN0aW9uTW9kZSkgfHxcbiAgICAgICAgICBjdXJyZW50ID09PSAnJyAmJiBzZWxlY3Rvci5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgaWYgKGlzUG9zaXRpdmUobW9kZSkpIHJldHVybiBmYWxzZTtcbiAgICAgICAgc2tpcFRvTmV4dFNlbGVjdG9yID0gdHJ1ZTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3Qgc2VsZWN0b3JBdHRyVmFsdWUgPSBtb2RlICYgU2VsZWN0b3JGbGFncy5DTEFTUyA/IGN1cnJlbnQgOiBzZWxlY3RvclsrK2ldO1xuXG4gICAgICAvLyBzcGVjaWFsIGNhc2UgZm9yIG1hdGNoaW5nIGFnYWluc3QgY2xhc3NlcyB3aGVuIGEgdE5vZGUgaGFzIGJlZW4gaW5zdGFudGlhdGVkIHdpdGhcbiAgICAgIC8vIGNsYXNzIGFuZCBzdHlsZSB2YWx1ZXMgYXMgc2VwYXJhdGUgYXR0cmlidXRlIHZhbHVlcyAoZS5nLiBbJ3RpdGxlJywgQ0xBU1MsICdmb28nXSlcbiAgICAgIGlmICgobW9kZSAmIFNlbGVjdG9yRmxhZ3MuQ0xBU1MpICYmIHROb2RlLmF0dHJzICE9PSBudWxsKSB7XG4gICAgICAgIGlmICghaXNDc3NDbGFzc01hdGNoaW5nKHROb2RlLmF0dHJzLCBzZWxlY3RvckF0dHJWYWx1ZSBhcyBzdHJpbmcsIGlzUHJvamVjdGlvbk1vZGUpKSB7XG4gICAgICAgICAgaWYgKGlzUG9zaXRpdmUobW9kZSkpIHJldHVybiBmYWxzZTtcbiAgICAgICAgICBza2lwVG9OZXh0U2VsZWN0b3IgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBpc0lubGluZVRlbXBsYXRlID1cbiAgICAgICAgICB0Tm9kZS50eXBlID09IFROb2RlVHlwZS5Db250YWluZXIgJiYgdE5vZGUudGFnTmFtZSAhPT0gTkdfVEVNUExBVEVfU0VMRUNUT1I7XG4gICAgICBjb25zdCBhdHRyTmFtZSA9IChtb2RlICYgU2VsZWN0b3JGbGFncy5DTEFTUykgPyAnY2xhc3MnIDogY3VycmVudDtcbiAgICAgIGNvbnN0IGF0dHJJbmRleEluTm9kZSA9XG4gICAgICAgICAgZmluZEF0dHJJbmRleEluTm9kZShhdHRyTmFtZSwgbm9kZUF0dHJzLCBpc0lubGluZVRlbXBsYXRlLCBpc1Byb2plY3Rpb25Nb2RlKTtcblxuICAgICAgaWYgKGF0dHJJbmRleEluTm9kZSA9PT0gLTEpIHtcbiAgICAgICAgaWYgKGlzUG9zaXRpdmUobW9kZSkpIHJldHVybiBmYWxzZTtcbiAgICAgICAgc2tpcFRvTmV4dFNlbGVjdG9yID0gdHJ1ZTtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGlmIChzZWxlY3RvckF0dHJWYWx1ZSAhPT0gJycpIHtcbiAgICAgICAgbGV0IG5vZGVBdHRyVmFsdWU6IHN0cmluZztcbiAgICAgICAgaWYgKGF0dHJJbmRleEluTm9kZSA+IG5hbWVPbmx5TWFya2VySWR4KSB7XG4gICAgICAgICAgbm9kZUF0dHJWYWx1ZSA9ICcnO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG5nRGV2TW9kZSAmJlxuICAgICAgICAgICAgICBhc3NlcnROb3RFcXVhbChcbiAgICAgICAgICAgICAgICAgIG5vZGVBdHRyc1thdHRySW5kZXhJbk5vZGVdLCBBdHRyaWJ1dGVNYXJrZXIuTmFtZXNwYWNlVVJJLFxuICAgICAgICAgICAgICAgICAgJ1dlIGRvIG5vdCBtYXRjaCBkaXJlY3RpdmVzIG9uIG5hbWVzcGFjZWQgYXR0cmlidXRlcycpO1xuICAgICAgICAgIC8vIHdlIGxvd2VyY2FzZSB0aGUgYXR0cmlidXRlIHZhbHVlIHRvIGJlIGFibGUgdG8gbWF0Y2hcbiAgICAgICAgICAvLyBzZWxlY3RvcnMgd2l0aG91dCBjYXNlLXNlbnNpdGl2aXR5XG4gICAgICAgICAgLy8gKHNlbGVjdG9ycyBhcmUgYWxyZWFkeSBpbiBsb3dlcmNhc2Ugd2hlbiBnZW5lcmF0ZWQpXG4gICAgICAgICAgbm9kZUF0dHJWYWx1ZSA9IChub2RlQXR0cnNbYXR0ckluZGV4SW5Ob2RlICsgMV0gYXMgc3RyaW5nKS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgY29tcGFyZUFnYWluc3RDbGFzc05hbWUgPSBtb2RlICYgU2VsZWN0b3JGbGFncy5DTEFTUyA/IG5vZGVBdHRyVmFsdWUgOiBudWxsO1xuICAgICAgICBpZiAoY29tcGFyZUFnYWluc3RDbGFzc05hbWUgJiZcbiAgICAgICAgICAgICAgICBjbGFzc0luZGV4T2YoY29tcGFyZUFnYWluc3RDbGFzc05hbWUsIHNlbGVjdG9yQXR0clZhbHVlIGFzIHN0cmluZywgMCkgIT09IC0xIHx8XG4gICAgICAgICAgICBtb2RlICYgU2VsZWN0b3JGbGFncy5BVFRSSUJVVEUgJiYgc2VsZWN0b3JBdHRyVmFsdWUgIT09IG5vZGVBdHRyVmFsdWUpIHtcbiAgICAgICAgICBpZiAoaXNQb3NpdGl2ZShtb2RlKSkgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgIHNraXBUb05leHRTZWxlY3RvciA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gaXNQb3NpdGl2ZShtb2RlKSB8fCBza2lwVG9OZXh0U2VsZWN0b3I7XG59XG5cbmZ1bmN0aW9uIGlzUG9zaXRpdmUobW9kZTogU2VsZWN0b3JGbGFncyk6IGJvb2xlYW4ge1xuICByZXR1cm4gKG1vZGUgJiBTZWxlY3RvckZsYWdzLk5PVCkgPT09IDA7XG59XG5cbi8qKlxuICogRXhhbWluZXMgdGhlIGF0dHJpYnV0ZSdzIGRlZmluaXRpb24gYXJyYXkgZm9yIGEgbm9kZSB0byBmaW5kIHRoZSBpbmRleCBvZiB0aGVcbiAqIGF0dHJpYnV0ZSB0aGF0IG1hdGNoZXMgdGhlIGdpdmVuIGBuYW1lYC5cbiAqXG4gKiBOT1RFOiBUaGlzIHdpbGwgbm90IG1hdGNoIG5hbWVzcGFjZWQgYXR0cmlidXRlcy5cbiAqXG4gKiBBdHRyaWJ1dGUgbWF0Y2hpbmcgZGVwZW5kcyB1cG9uIGBpc0lubGluZVRlbXBsYXRlYCBhbmQgYGlzUHJvamVjdGlvbk1vZGVgLlxuICogVGhlIGZvbGxvd2luZyB0YWJsZSBzdW1tYXJpemVzIHdoaWNoIHR5cGVzIG9mIGF0dHJpYnV0ZXMgd2UgYXR0ZW1wdCB0byBtYXRjaDpcbiAqXG4gKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICogTW9kZXMgICAgICAgICAgICAgICAgICAgfCBOb3JtYWwgQXR0cmlidXRlcyB8IEJpbmRpbmdzIEF0dHJpYnV0ZXMgfCBUZW1wbGF0ZSBBdHRyaWJ1dGVzIHwgSTE4blxuICogQXR0cmlidXRlc1xuICogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAqIElubGluZSArIFByb2plY3Rpb24gICAgIHwgWUVTICAgICAgICAgICAgICAgfCBZRVMgICAgICAgICAgICAgICAgIHwgTk8gICAgICAgICAgICAgICAgICB8IFlFU1xuICogLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAqIElubGluZSArIERpcmVjdGl2ZSAgICAgIHwgTk8gICAgICAgICAgICAgICAgfCBOTyAgICAgICAgICAgICAgICAgIHwgWUVTICAgICAgICAgICAgICAgICB8IE5PXG4gKiAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICogTm9uLWlubGluZSArIFByb2plY3Rpb24gfCBZRVMgICAgICAgICAgICAgICB8IFlFUyAgICAgICAgICAgICAgICAgfCBOTyAgICAgICAgICAgICAgICAgIHwgWUVTXG4gKiAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICogTm9uLWlubGluZSArIERpcmVjdGl2ZSAgfCBZRVMgICAgICAgICAgICAgICB8IFlFUyAgICAgICAgICAgICAgICAgfCBOTyAgICAgICAgICAgICAgICAgIHwgWUVTXG4gKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICpcbiAqIEBwYXJhbSBuYW1lIHRoZSBuYW1lIG9mIHRoZSBhdHRyaWJ1dGUgdG8gZmluZFxuICogQHBhcmFtIGF0dHJzIHRoZSBhdHRyaWJ1dGUgYXJyYXkgdG8gZXhhbWluZVxuICogQHBhcmFtIGlzSW5saW5lVGVtcGxhdGUgdHJ1ZSBpZiB0aGUgbm9kZSBiZWluZyBtYXRjaGVkIGlzIGFuIGlubGluZSB0ZW1wbGF0ZSAoZS5nLiBgKm5nRm9yYClcbiAqIHJhdGhlciB0aGFuIGEgbWFudWFsbHkgZXhwYW5kZWQgdGVtcGxhdGUgbm9kZSAoZS5nIGA8bmctdGVtcGxhdGU+YCkuXG4gKiBAcGFyYW0gaXNQcm9qZWN0aW9uTW9kZSB0cnVlIGlmIHdlIGFyZSBtYXRjaGluZyBhZ2FpbnN0IGNvbnRlbnQgcHJvamVjdGlvbiBvdGhlcndpc2Ugd2UgYXJlXG4gKiBtYXRjaGluZyBhZ2FpbnN0IGRpcmVjdGl2ZXMuXG4gKi9cbmZ1bmN0aW9uIGZpbmRBdHRySW5kZXhJbk5vZGUoXG4gICAgbmFtZTogc3RyaW5nLCBhdHRyczogVEF0dHJpYnV0ZXN8bnVsbCwgaXNJbmxpbmVUZW1wbGF0ZTogYm9vbGVhbixcbiAgICBpc1Byb2plY3Rpb25Nb2RlOiBib29sZWFuKTogbnVtYmVyIHtcbiAgaWYgKGF0dHJzID09PSBudWxsKSByZXR1cm4gLTE7XG5cbiAgbGV0IGkgPSAwO1xuXG4gIGlmIChpc1Byb2plY3Rpb25Nb2RlIHx8ICFpc0lubGluZVRlbXBsYXRlKSB7XG4gICAgbGV0IGJpbmRpbmdzTW9kZSA9IGZhbHNlO1xuICAgIHdoaWxlIChpIDwgYXR0cnMubGVuZ3RoKSB7XG4gICAgICBjb25zdCBtYXliZUF0dHJOYW1lID0gYXR0cnNbaV07XG4gICAgICBpZiAobWF5YmVBdHRyTmFtZSA9PT0gbmFtZSkge1xuICAgICAgICByZXR1cm4gaTtcbiAgICAgIH0gZWxzZSBpZiAoXG4gICAgICAgICAgbWF5YmVBdHRyTmFtZSA9PT0gQXR0cmlidXRlTWFya2VyLkJpbmRpbmdzIHx8IG1heWJlQXR0ck5hbWUgPT09IEF0dHJpYnV0ZU1hcmtlci5JMThuKSB7XG4gICAgICAgIGJpbmRpbmdzTW9kZSA9IHRydWU7XG4gICAgICB9IGVsc2UgaWYgKFxuICAgICAgICAgIG1heWJlQXR0ck5hbWUgPT09IEF0dHJpYnV0ZU1hcmtlci5DbGFzc2VzIHx8IG1heWJlQXR0ck5hbWUgPT09IEF0dHJpYnV0ZU1hcmtlci5TdHlsZXMpIHtcbiAgICAgICAgbGV0IHZhbHVlID0gYXR0cnNbKytpXTtcbiAgICAgICAgLy8gV2Ugc2hvdWxkIHNraXAgY2xhc3NlcyBoZXJlIGJlY2F1c2Ugd2UgaGF2ZSBhIHNlcGFyYXRlIG1lY2hhbmlzbSBmb3JcbiAgICAgICAgLy8gbWF0Y2hpbmcgY2xhc3NlcyBpbiBwcm9qZWN0aW9uIG1vZGUuXG4gICAgICAgIHdoaWxlICh0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgdmFsdWUgPSBhdHRyc1srK2ldO1xuICAgICAgICB9XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfSBlbHNlIGlmIChtYXliZUF0dHJOYW1lID09PSBBdHRyaWJ1dGVNYXJrZXIuVGVtcGxhdGUpIHtcbiAgICAgICAgLy8gV2UgZG8gbm90IGNhcmUgYWJvdXQgVGVtcGxhdGUgYXR0cmlidXRlcyBpbiB0aGlzIHNjZW5hcmlvLlxuICAgICAgICBicmVhaztcbiAgICAgIH0gZWxzZSBpZiAobWF5YmVBdHRyTmFtZSA9PT0gQXR0cmlidXRlTWFya2VyLk5hbWVzcGFjZVVSSSkge1xuICAgICAgICAvLyBTa2lwIHRoZSB3aG9sZSBuYW1lc3BhY2VkIGF0dHJpYnV0ZSBhbmQgdmFsdWUuIFRoaXMgaXMgYnkgZGVzaWduLlxuICAgICAgICBpICs9IDQ7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgLy8gSW4gYmluZGluZyBtb2RlIHRoZXJlIGFyZSBvbmx5IG5hbWVzLCByYXRoZXIgdGhhbiBuYW1lLXZhbHVlIHBhaXJzLlxuICAgICAgaSArPSBiaW5kaW5nc01vZGUgPyAxIDogMjtcbiAgICB9XG4gICAgLy8gV2UgZGlkIG5vdCBtYXRjaCB0aGUgYXR0cmlidXRlXG4gICAgcmV0dXJuIC0xO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBtYXRjaFRlbXBsYXRlQXR0cmlidXRlKGF0dHJzLCBuYW1lKTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNOb2RlTWF0Y2hpbmdTZWxlY3Rvckxpc3QoXG4gICAgdE5vZGU6IFROb2RlLCBzZWxlY3RvcjogQ3NzU2VsZWN0b3JMaXN0LCBpc1Byb2plY3Rpb25Nb2RlOiBib29sZWFuID0gZmFsc2UpOiBib29sZWFuIHtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBzZWxlY3Rvci5sZW5ndGg7IGkrKykge1xuICAgIGlmIChpc05vZGVNYXRjaGluZ1NlbGVjdG9yKHROb2RlLCBzZWxlY3RvcltpXSwgaXNQcm9qZWN0aW9uTW9kZSkpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBmYWxzZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFByb2plY3RBc0F0dHJWYWx1ZSh0Tm9kZTogVE5vZGUpOiBDc3NTZWxlY3RvcnxudWxsIHtcbiAgY29uc3Qgbm9kZUF0dHJzID0gdE5vZGUuYXR0cnM7XG4gIGlmIChub2RlQXR0cnMgIT0gbnVsbCkge1xuICAgIGNvbnN0IG5nUHJvamVjdEFzQXR0cklkeCA9IG5vZGVBdHRycy5pbmRleE9mKEF0dHJpYnV0ZU1hcmtlci5Qcm9qZWN0QXMpO1xuICAgIC8vIG9ubHkgY2hlY2sgZm9yIG5nUHJvamVjdEFzIGluIGF0dHJpYnV0ZSBuYW1lcywgZG9uJ3QgYWNjaWRlbnRhbGx5IG1hdGNoIGF0dHJpYnV0ZSdzIHZhbHVlXG4gICAgLy8gKGF0dHJpYnV0ZSBuYW1lcyBhcmUgc3RvcmVkIGF0IGV2ZW4gaW5kZXhlcylcbiAgICBpZiAoKG5nUHJvamVjdEFzQXR0cklkeCAmIDEpID09PSAwKSB7XG4gICAgICByZXR1cm4gbm9kZUF0dHJzW25nUHJvamVjdEFzQXR0cklkeCArIDFdIGFzIENzc1NlbGVjdG9yO1xuICAgIH1cbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuZnVuY3Rpb24gZ2V0TmFtZU9ubHlNYXJrZXJJbmRleChub2RlQXR0cnM6IFRBdHRyaWJ1dGVzKSB7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgbm9kZUF0dHJzLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3Qgbm9kZUF0dHIgPSBub2RlQXR0cnNbaV07XG4gICAgaWYgKGlzTmFtZU9ubHlBdHRyaWJ1dGVNYXJrZXIobm9kZUF0dHIpKSB7XG4gICAgICByZXR1cm4gaTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIG5vZGVBdHRycy5sZW5ndGg7XG59XG5cbmZ1bmN0aW9uIG1hdGNoVGVtcGxhdGVBdHRyaWJ1dGUoYXR0cnM6IFRBdHRyaWJ1dGVzLCBuYW1lOiBzdHJpbmcpOiBudW1iZXIge1xuICBsZXQgaSA9IGF0dHJzLmluZGV4T2YoQXR0cmlidXRlTWFya2VyLlRlbXBsYXRlKTtcbiAgaWYgKGkgPiAtMSkge1xuICAgIGkrKztcbiAgICB3aGlsZSAoaSA8IGF0dHJzLmxlbmd0aCkge1xuICAgICAgaWYgKGF0dHJzW2ldID09PSBuYW1lKSByZXR1cm4gaTtcbiAgICAgIGkrKztcbiAgICB9XG4gIH1cbiAgcmV0dXJuIC0xO1xufVxuXG4vKipcbiAqIENoZWNrcyB3aGV0aGVyIGEgc2VsZWN0b3IgaXMgaW5zaWRlIGEgQ3NzU2VsZWN0b3JMaXN0XG4gKiBAcGFyYW0gc2VsZWN0b3IgU2VsZWN0b3IgdG8gYmUgY2hlY2tlZC5cbiAqIEBwYXJhbSBsaXN0IExpc3QgaW4gd2hpY2ggdG8gbG9vayBmb3IgdGhlIHNlbGVjdG9yLlxuICovXG5leHBvcnQgZnVuY3Rpb24gaXNTZWxlY3RvckluU2VsZWN0b3JMaXN0KHNlbGVjdG9yOiBDc3NTZWxlY3RvciwgbGlzdDogQ3NzU2VsZWN0b3JMaXN0KTogYm9vbGVhbiB7XG4gIHNlbGVjdG9yTGlzdExvb3A6IGZvciAobGV0IGkgPSAwOyBpIDwgbGlzdC5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IGN1cnJlbnRTZWxlY3RvckluTGlzdCA9IGxpc3RbaV07XG4gICAgaWYgKHNlbGVjdG9yLmxlbmd0aCAhPT0gY3VycmVudFNlbGVjdG9ySW5MaXN0Lmxlbmd0aCkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuICAgIGZvciAobGV0IGogPSAwOyBqIDwgc2VsZWN0b3IubGVuZ3RoOyBqKyspIHtcbiAgICAgIGlmIChzZWxlY3RvcltqXSAhPT0gY3VycmVudFNlbGVjdG9ySW5MaXN0W2pdKSB7XG4gICAgICAgIGNvbnRpbnVlIHNlbGVjdG9yTGlzdExvb3A7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9XG4gIHJldHVybiBmYWxzZTtcbn1cblxuZnVuY3Rpb24gbWF5YmVXcmFwSW5Ob3RTZWxlY3Rvcihpc05lZ2F0aXZlTW9kZTogYm9vbGVhbiwgY2h1bms6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBpc05lZ2F0aXZlTW9kZSA/ICc6bm90KCcgKyBjaHVuay50cmltKCkgKyAnKScgOiBjaHVuaztcbn1cblxuZnVuY3Rpb24gc3RyaW5naWZ5Q1NTU2VsZWN0b3Ioc2VsZWN0b3I6IENzc1NlbGVjdG9yKTogc3RyaW5nIHtcbiAgbGV0IHJlc3VsdCA9IHNlbGVjdG9yWzBdIGFzIHN0cmluZztcbiAgbGV0IGkgPSAxO1xuICBsZXQgbW9kZSA9IFNlbGVjdG9yRmxhZ3MuQVRUUklCVVRFO1xuICBsZXQgY3VycmVudENodW5rID0gJyc7XG4gIGxldCBpc05lZ2F0aXZlTW9kZSA9IGZhbHNlO1xuICB3aGlsZSAoaSA8IHNlbGVjdG9yLmxlbmd0aCkge1xuICAgIGxldCB2YWx1ZU9yTWFya2VyID0gc2VsZWN0b3JbaV07XG4gICAgaWYgKHR5cGVvZiB2YWx1ZU9yTWFya2VyID09PSAnc3RyaW5nJykge1xuICAgICAgaWYgKG1vZGUgJiBTZWxlY3RvckZsYWdzLkFUVFJJQlVURSkge1xuICAgICAgICBjb25zdCBhdHRyVmFsdWUgPSBzZWxlY3RvclsrK2ldIGFzIHN0cmluZztcbiAgICAgICAgY3VycmVudENodW5rICs9XG4gICAgICAgICAgICAnWycgKyB2YWx1ZU9yTWFya2VyICsgKGF0dHJWYWx1ZS5sZW5ndGggPiAwID8gJz1cIicgKyBhdHRyVmFsdWUgKyAnXCInIDogJycpICsgJ10nO1xuICAgICAgfSBlbHNlIGlmIChtb2RlICYgU2VsZWN0b3JGbGFncy5DTEFTUykge1xuICAgICAgICBjdXJyZW50Q2h1bmsgKz0gJy4nICsgdmFsdWVPck1hcmtlcjtcbiAgICAgIH0gZWxzZSBpZiAobW9kZSAmIFNlbGVjdG9yRmxhZ3MuRUxFTUVOVCkge1xuICAgICAgICBjdXJyZW50Q2h1bmsgKz0gJyAnICsgdmFsdWVPck1hcmtlcjtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgLy9cbiAgICAgIC8vIEFwcGVuZCBjdXJyZW50IGNodW5rIHRvIHRoZSBmaW5hbCByZXN1bHQgaW4gY2FzZSB3ZSBjb21lIGFjcm9zcyBTZWxlY3RvckZsYWcsIHdoaWNoXG4gICAgICAvLyBpbmRpY2F0ZXMgdGhhdCB0aGUgcHJldmlvdXMgc2VjdGlvbiBvZiBhIHNlbGVjdG9yIGlzIG92ZXIuIFdlIG5lZWQgdG8gYWNjdW11bGF0ZSBjb250ZW50XG4gICAgICAvLyBiZXR3ZWVuIGZsYWdzIHRvIG1ha2Ugc3VyZSB3ZSB3cmFwIHRoZSBjaHVuayBsYXRlciBpbiA6bm90KCkgc2VsZWN0b3IgaWYgbmVlZGVkLCBlLmcuXG4gICAgICAvLyBgYGBcbiAgICAgIC8vICBbJycsIEZsYWdzLkNMQVNTLCAnLmNsYXNzQScsIEZsYWdzLkNMQVNTIHwgRmxhZ3MuTk9ULCAnLmNsYXNzQicsICcuY2xhc3NDJ11cbiAgICAgIC8vIGBgYFxuICAgICAgLy8gc2hvdWxkIGJlIHRyYW5zZm9ybWVkIHRvIGAuY2xhc3NBIDpub3QoLmNsYXNzQiAuY2xhc3NDKWAuXG4gICAgICAvL1xuICAgICAgLy8gTm90ZTogZm9yIG5lZ2F0aXZlIHNlbGVjdG9yIHBhcnQsIHdlIGFjY3VtdWxhdGUgY29udGVudCBiZXR3ZWVuIGZsYWdzIHVudGlsIHdlIGZpbmQgdGhlXG4gICAgICAvLyBuZXh0IG5lZ2F0aXZlIGZsYWcuIFRoaXMgaXMgbmVlZGVkIHRvIHN1cHBvcnQgYSBjYXNlIHdoZXJlIGA6bm90KClgIHJ1bGUgY29udGFpbnMgbW9yZSB0aGFuXG4gICAgICAvLyBvbmUgY2h1bmssIGUuZy4gdGhlIGZvbGxvd2luZyBzZWxlY3RvcjpcbiAgICAgIC8vIGBgYFxuICAgICAgLy8gIFsnJywgRmxhZ3MuRUxFTUVOVCB8IEZsYWdzLk5PVCwgJ3AnLCBGbGFncy5DTEFTUywgJ2ZvbycsIEZsYWdzLkNMQVNTIHwgRmxhZ3MuTk9ULCAnYmFyJ11cbiAgICAgIC8vIGBgYFxuICAgICAgLy8gc2hvdWxkIGJlIHN0cmluZ2lmaWVkIHRvIGA6bm90KHAuZm9vKSA6bm90KC5iYXIpYFxuICAgICAgLy9cbiAgICAgIGlmIChjdXJyZW50Q2h1bmsgIT09ICcnICYmICFpc1Bvc2l0aXZlKHZhbHVlT3JNYXJrZXIpKSB7XG4gICAgICAgIHJlc3VsdCArPSBtYXliZVdyYXBJbk5vdFNlbGVjdG9yKGlzTmVnYXRpdmVNb2RlLCBjdXJyZW50Q2h1bmspO1xuICAgICAgICBjdXJyZW50Q2h1bmsgPSAnJztcbiAgICAgIH1cbiAgICAgIG1vZGUgPSB2YWx1ZU9yTWFya2VyO1xuICAgICAgLy8gQWNjb3JkaW5nIHRvIENzc1NlbGVjdG9yIHNwZWMsIG9uY2Ugd2UgY29tZSBhY3Jvc3MgYFNlbGVjdG9yRmxhZ3MuTk9UYCBmbGFnLCB0aGUgbmVnYXRpdmVcbiAgICAgIC8vIG1vZGUgaXMgbWFpbnRhaW5lZCBmb3IgcmVtYWluaW5nIGNodW5rcyBvZiBhIHNlbGVjdG9yLlxuICAgICAgaXNOZWdhdGl2ZU1vZGUgPSBpc05lZ2F0aXZlTW9kZSB8fCAhaXNQb3NpdGl2ZShtb2RlKTtcbiAgICB9XG4gICAgaSsrO1xuICB9XG4gIGlmIChjdXJyZW50Q2h1bmsgIT09ICcnKSB7XG4gICAgcmVzdWx0ICs9IG1heWJlV3JhcEluTm90U2VsZWN0b3IoaXNOZWdhdGl2ZU1vZGUsIGN1cnJlbnRDaHVuayk7XG4gIH1cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuLyoqXG4gKiBHZW5lcmF0ZXMgc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIENTUyBzZWxlY3RvciBpbiBwYXJzZWQgZm9ybS5cbiAqXG4gKiBDb21wb25lbnREZWYgYW5kIERpcmVjdGl2ZURlZiBhcmUgZ2VuZXJhdGVkIHdpdGggdGhlIHNlbGVjdG9yIGluIHBhcnNlZCBmb3JtIHRvIGF2b2lkIGRvaW5nXG4gKiBhZGRpdGlvbmFsIHBhcnNpbmcgYXQgcnVudGltZSAoZm9yIGV4YW1wbGUsIGZvciBkaXJlY3RpdmUgbWF0Y2hpbmcpLiBIb3dldmVyIGluIHNvbWUgY2FzZXMgKGZvclxuICogZXhhbXBsZSwgd2hpbGUgYm9vdHN0cmFwcGluZyBhIGNvbXBvbmVudCksIGEgc3RyaW5nIHZlcnNpb24gb2YgdGhlIHNlbGVjdG9yIGlzIHJlcXVpcmVkIHRvIHF1ZXJ5XG4gKiBmb3IgdGhlIGhvc3QgZWxlbWVudCBvbiB0aGUgcGFnZS4gVGhpcyBmdW5jdGlvbiB0YWtlcyB0aGUgcGFyc2VkIGZvcm0gb2YgYSBzZWxlY3RvciBhbmQgcmV0dXJuc1xuICogaXRzIHN0cmluZyByZXByZXNlbnRhdGlvbi5cbiAqXG4gKiBAcGFyYW0gc2VsZWN0b3JMaXN0IHNlbGVjdG9yIGluIHBhcnNlZCBmb3JtXG4gKiBAcmV0dXJucyBzdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgYSBnaXZlbiBzZWxlY3RvclxuICovXG5leHBvcnQgZnVuY3Rpb24gc3RyaW5naWZ5Q1NTU2VsZWN0b3JMaXN0KHNlbGVjdG9yTGlzdDogQ3NzU2VsZWN0b3JMaXN0KTogc3RyaW5nIHtcbiAgcmV0dXJuIHNlbGVjdG9yTGlzdC5tYXAoc3RyaW5naWZ5Q1NTU2VsZWN0b3IpLmpvaW4oJywnKTtcbn1cblxuLyoqXG4gKiBFeHRyYWN0cyBhdHRyaWJ1dGVzIGFuZCBjbGFzc2VzIGluZm9ybWF0aW9uIGZyb20gYSBnaXZlbiBDU1Mgc2VsZWN0b3IuXG4gKlxuICogVGhpcyBmdW5jdGlvbiBpcyB1c2VkIHdoaWxlIGNyZWF0aW5nIGEgY29tcG9uZW50IGR5bmFtaWNhbGx5LiBJbiB0aGlzIGNhc2UsIHRoZSBob3N0IGVsZW1lbnRcbiAqICh0aGF0IGlzIGNyZWF0ZWQgZHluYW1pY2FsbHkpIHNob3VsZCBjb250YWluIGF0dHJpYnV0ZXMgYW5kIGNsYXNzZXMgc3BlY2lmaWVkIGluIGNvbXBvbmVudCdzIENTU1xuICogc2VsZWN0b3IuXG4gKlxuICogQHBhcmFtIHNlbGVjdG9yIENTUyBzZWxlY3RvciBpbiBwYXJzZWQgZm9ybSAoaW4gYSBmb3JtIG9mIGFycmF5KVxuICogQHJldHVybnMgb2JqZWN0IHdpdGggYGF0dHJzYCBhbmQgYGNsYXNzZXNgIGZpZWxkcyB0aGF0IGNvbnRhaW4gZXh0cmFjdGVkIGluZm9ybWF0aW9uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBleHRyYWN0QXR0cnNBbmRDbGFzc2VzRnJvbVNlbGVjdG9yKHNlbGVjdG9yOiBDc3NTZWxlY3Rvcik6XG4gICAge2F0dHJzOiBzdHJpbmdbXSwgY2xhc3Nlczogc3RyaW5nW119IHtcbiAgY29uc3QgYXR0cnM6IHN0cmluZ1tdID0gW107XG4gIGNvbnN0IGNsYXNzZXM6IHN0cmluZ1tdID0gW107XG4gIGxldCBpID0gMTtcbiAgbGV0IG1vZGUgPSBTZWxlY3RvckZsYWdzLkFUVFJJQlVURTtcbiAgd2hpbGUgKGkgPCBzZWxlY3Rvci5sZW5ndGgpIHtcbiAgICBsZXQgdmFsdWVPck1hcmtlciA9IHNlbGVjdG9yW2ldO1xuICAgIGlmICh0eXBlb2YgdmFsdWVPck1hcmtlciA9PT0gJ3N0cmluZycpIHtcbiAgICAgIGlmIChtb2RlID09PSBTZWxlY3RvckZsYWdzLkFUVFJJQlVURSkge1xuICAgICAgICBpZiAodmFsdWVPck1hcmtlciAhPT0gJycpIHtcbiAgICAgICAgICBhdHRycy5wdXNoKHZhbHVlT3JNYXJrZXIsIHNlbGVjdG9yWysraV0gYXMgc3RyaW5nKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChtb2RlID09PSBTZWxlY3RvckZsYWdzLkNMQVNTKSB7XG4gICAgICAgIGNsYXNzZXMucHVzaCh2YWx1ZU9yTWFya2VyKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gQWNjb3JkaW5nIHRvIENzc1NlbGVjdG9yIHNwZWMsIG9uY2Ugd2UgY29tZSBhY3Jvc3MgYFNlbGVjdG9yRmxhZ3MuTk9UYCBmbGFnLCB0aGUgbmVnYXRpdmVcbiAgICAgIC8vIG1vZGUgaXMgbWFpbnRhaW5lZCBmb3IgcmVtYWluaW5nIGNodW5rcyBvZiBhIHNlbGVjdG9yLiBTaW5jZSBhdHRyaWJ1dGVzIGFuZCBjbGFzc2VzIGFyZVxuICAgICAgLy8gZXh0cmFjdGVkIG9ubHkgZm9yIFwicG9zaXRpdmVcIiBwYXJ0IG9mIHRoZSBzZWxlY3Rvciwgd2UgY2FuIHN0b3AgaGVyZS5cbiAgICAgIGlmICghaXNQb3NpdGl2ZShtb2RlKSkgYnJlYWs7XG4gICAgICBtb2RlID0gdmFsdWVPck1hcmtlcjtcbiAgICB9XG4gICAgaSsrO1xuICB9XG4gIHJldHVybiB7YXR0cnMsIGNsYXNzZXN9O1xufSJdfQ==