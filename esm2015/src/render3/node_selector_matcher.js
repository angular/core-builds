/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import '../util/ng_dev_mode';
import { assertDefined, assertNotEqual } from '../util/assert';
import { unusedValueExportToPlacateAjd as unused1 } from './interfaces/node';
import { NG_PROJECT_AS_ATTR_NAME, unusedValueExportToPlacateAjd as unused2 } from './interfaces/projection';
import { getInitialClassNameValue } from './styling/class_and_style_bindings';
import { isNameOnlyAttributeMarker } from './util/attrs_utils';
/** @type {?} */
const unusedValueToPlacateAjd = unused1 + unused2;
/** @type {?} */
const NG_TEMPLATE_SELECTOR = 'ng-template';
/**
 * @param {?} nodeClassAttrVal
 * @param {?} cssClassToMatch
 * @return {?}
 */
function isCssClassMatching(nodeClassAttrVal, cssClassToMatch) {
    /** @type {?} */
    const nodeClassesLen = nodeClassAttrVal.length;
    /** @type {?} */
    const matchIndex = (/** @type {?} */ (nodeClassAttrVal)).indexOf(cssClassToMatch);
    /** @type {?} */
    const matchEndIdx = matchIndex + cssClassToMatch.length;
    if (matchIndex === -1 // no match
        || (matchIndex > 0 && (/** @type {?} */ (nodeClassAttrVal))[matchIndex - 1] !== ' ') // no space before
        ||
            (matchEndIdx < nodeClassesLen && (/** @type {?} */ (nodeClassAttrVal))[matchEndIdx] !== ' ')) // no space after
     {
        return false;
    }
    return true;
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
            if (!skipToNextSelector && !isPositive(mode) && !isPositive((/** @type {?} */ (current)))) {
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
            if ((mode & 8 /* CLASS */) && tNode.stylingTemplate) {
                if (!isCssClassMatching(readClassValueFromTNode(tNode), (/** @type {?} */ (selectorAttrValue)))) {
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
                    ngDevMode && assertNotEqual(nodeAttrs[attrIndexInNode], 0 /* NamespaceURI */, 'We do not match directives on namespaced attributes');
                    nodeAttrValue = (/** @type {?} */ (nodeAttrs[attrIndexInNode + 1]));
                }
                /** @type {?} */
                const compareAgainstClassName = mode & 8 /* CLASS */ ? nodeAttrValue : null;
                if (compareAgainstClassName &&
                    !isCssClassMatching(compareAgainstClassName, (/** @type {?} */ (selectorAttrValue))) ||
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
 * @param {?} tNode
 * @return {?}
 */
function readClassValueFromTNode(tNode) {
    // comparing against CSS class values is complex because the compiler doesn't place them as
    // regular attributes when an element is created. Instead, the classes (and styles for
    // that matter) are placed in a special styling context that is used for resolving all
    // class/style values across static attributes, [style]/[class] and [style.prop]/[class.name]
    // bindings. Therefore if and when the styling context exists then the class values are to be
    // extracted by the context helper code below...
    return tNode.stylingTemplate ? getInitialClassNameValue(tNode.stylingTemplate) : '';
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
 * =========================================================================================
 * Modes                   | Normal Attributes | Bindings Attributes | Template Attributes
 * =========================================================================================
 * Inline + Projection     | YES               | YES                 | NO
 * -----------------------------------------------------------------------------------------
 * Inline + Directive      | NO                | NO                  | YES
 * -----------------------------------------------------------------------------------------
 * Non-inline + Projection | YES               | YES                 | NO
 * -----------------------------------------------------------------------------------------
 * Non-inline + Directive  | YES               | YES                 | NO
 * =========================================================================================
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
            else if (maybeAttrName === 3 /* Bindings */) {
                bindingsMode = true;
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
        const ngProjectAsAttrIdx = nodeAttrs.indexOf(NG_PROJECT_AS_ATTR_NAME);
        // only check for ngProjectAs in attribute names, don't accidentally match attribute's value
        // (attribute names are stored at even indexes)
        if ((ngProjectAsAttrIdx & 1) === 0) {
            return (/** @type {?} */ (nodeAttrs[ngProjectAsAttrIdx + 1]));
        }
    }
    return null;
}
/**
 * Checks a given node against matching projection selectors and returns
 * selector index (or 0 if none matched).
 *
 * This function takes into account the ngProjectAs attribute: if present its value will be
 * compared to the raw (un-parsed) CSS selector instead of using standard selector matching logic.
 * @param {?} tNode
 * @param {?} selectors
 * @param {?} textSelectors
 * @return {?}
 */
export function matchingProjectionSelectorIndex(tNode, selectors, textSelectors) {
    /** @type {?} */
    const ngProjectAsAttrVal = getProjectAsAttrValue(tNode);
    for (let i = 0; i < selectors.length; i++) {
        // if a node has the ngProjectAs attribute match it against unparsed selector
        // match a node against a parsed selector only if ngProjectAs attribute is not present
        if (ngProjectAsAttrVal === textSelectors[i] ||
            ngProjectAsAttrVal === null &&
                isNodeMatchingSelectorList(tNode, selectors[i], /* isProjectionMode */ true)) {
            return i + 1; // first matching selector "captures" a given node
        }
    }
    return 0;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9kZV9zZWxlY3Rvcl9tYXRjaGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9ub2RlX3NlbGVjdG9yX21hdGNoZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFRQSxPQUFPLHFCQUFxQixDQUFDO0FBRTdCLE9BQU8sRUFBQyxhQUFhLEVBQUUsY0FBYyxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFFN0QsT0FBTyxFQUFpRCw2QkFBNkIsSUFBSSxPQUFPLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUMzSCxPQUFPLEVBQStCLHVCQUF1QixFQUFpQiw2QkFBNkIsSUFBSSxPQUFPLEVBQUMsTUFBTSx5QkFBeUIsQ0FBQztBQUN2SixPQUFPLEVBQUMsd0JBQXdCLEVBQUMsTUFBTSxvQ0FBb0MsQ0FBQztBQUM1RSxPQUFPLEVBQUMseUJBQXlCLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQzs7TUFFdkQsdUJBQXVCLEdBQUcsT0FBTyxHQUFHLE9BQU87O01BRTNDLG9CQUFvQixHQUFHLGFBQWE7Ozs7OztBQUUxQyxTQUFTLGtCQUFrQixDQUFDLGdCQUF3QixFQUFFLGVBQXVCOztVQUNyRSxjQUFjLEdBQUcsZ0JBQWdCLENBQUMsTUFBTTs7VUFDeEMsVUFBVSxHQUFHLG1CQUFBLGdCQUFnQixFQUFFLENBQUMsT0FBTyxDQUFDLGVBQWUsQ0FBQzs7VUFDeEQsV0FBVyxHQUFHLFVBQVUsR0FBRyxlQUFlLENBQUMsTUFBTTtJQUN2RCxJQUFJLFVBQVUsS0FBSyxDQUFDLENBQUMsQ0FBa0QsV0FBVztXQUMzRSxDQUFDLFVBQVUsR0FBRyxDQUFDLElBQUksbUJBQUEsZ0JBQWdCLEVBQUUsQ0FBQyxVQUFVLEdBQUcsQ0FBQyxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUUsa0JBQWtCOztZQUVyRixDQUFDLFdBQVcsR0FBRyxjQUFjLElBQUksbUJBQUEsZ0JBQWdC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Q0FBQztTQUNMO0tBQ0Y7SUFDRCxPQUFPLENBQUMsQ0FBQyxDQUFDO0FBQ1osQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0ICcuLi91dGlsL25nX2Rldl9tb2RlJztcblxuaW1wb3J0IHthc3NlcnREZWZpbmVkLCBhc3NlcnROb3RFcXVhbH0gZnJvbSAnLi4vdXRpbC9hc3NlcnQnO1xuXG5pbXBvcnQge0F0dHJpYnV0ZU1hcmtlciwgVEF0dHJpYnV0ZXMsIFROb2RlLCBUTm9kZVR5cGUsIHVudXNlZFZhbHVlRXhwb3J0VG9QbGFjYXRlQWpkIGFzIHVudXNlZDF9IGZyb20gJy4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7Q3NzU2VsZWN0b3IsIENzc1NlbGVjdG9yTGlzdCwgTkdfUFJPSkVDVF9BU19BVFRSX05BTUUsIFNlbGVjdG9yRmxhZ3MsIHVudXNlZFZhbHVlRXhwb3J0VG9QbGFjYXRlQWpkIGFzIHVudXNlZDJ9IGZyb20gJy4vaW50ZXJmYWNlcy9wcm9qZWN0aW9uJztcbmltcG9ydCB7Z2V0SW5pdGlhbENsYXNzTmFtZVZhbHVlfSBmcm9tICcuL3N0eWxpbmcvY2xhc3NfYW5kX3N0eWxlX2JpbmRpbmdzJztcbmltcG9ydCB7aXNOYW1lT25seUF0dHJpYnV0ZU1hcmtlcn0gZnJvbSAnLi91dGlsL2F0dHJzX3V0aWxzJztcblxuY29uc3QgdW51c2VkVmFsdWVUb1BsYWNhdGVBamQgPSB1bnVzZWQxICsgdW51c2VkMjtcblxuY29uc3QgTkdfVEVNUExBVEVfU0VMRUNUT1IgPSAnbmctdGVtcGxhdGUnO1xuXG5mdW5jdGlvbiBpc0Nzc0NsYXNzTWF0Y2hpbmcobm9kZUNsYXNzQXR0clZhbDogc3RyaW5nLCBjc3NDbGFzc1RvTWF0Y2g6IHN0cmluZyk6IGJvb2xlYW4ge1xuICBjb25zdCBub2RlQ2xhc3Nlc0xlbiA9IG5vZGVDbGFzc0F0dHJWYWwubGVuZ3RoO1xuICBjb25zdCBtYXRjaEluZGV4ID0gbm9kZUNsYXNzQXR0clZhbCAhLmluZGV4T2YoY3NzQ2xhc3NUb01hdGNoKTtcbiAgY29uc3QgbWF0Y2hFbmRJZHggPSBtYXRjaEluZGV4ICsgY3NzQ2xhc3NUb01hdGNoLmxlbmd0aDtcbiAgaWYgKG1hdGNoSW5kZXggPT09IC0xICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBubyBtYXRjaFxuICAgICAgfHwgKG1hdGNoSW5kZXggPiAwICYmIG5vZGVDbGFzc0F0dHJWYWwgIVttYXRjaEluZGV4IC0gMV0gIT09ICcgJykgIC8vIG5vIHNwYWNlIGJlZm9yZVxuICAgICAgfHxcbiAgICAgIChtYXRjaEVuZElkeCA8IG5vZGVDbGFzc2VzTGVuICYmIG5vZGVDbGFzc0F0dHJWYWwgIVttYXRjaEVuZElkeF0gIT09ICcgJykpICAvLyBubyBzcGFjZSBhZnRlclxuICB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIHJldHVybiB0cnVlO1xufVxuXG4vKipcbiAqIEZ1bmN0aW9uIHRoYXQgY2hlY2tzIHdoZXRoZXIgYSBnaXZlbiB0Tm9kZSBtYXRjaGVzIHRhZy1iYXNlZCBzZWxlY3RvciBhbmQgaGFzIGEgdmFsaWQgdHlwZS5cbiAqXG4gKiBNYXRjaGluZyBjYW4gYmUgcGVyZm9ybWVkIGluIDIgbW9kZXM6IHByb2plY3Rpb24gbW9kZSAod2hlbiB3ZSBwcm9qZWN0IG5vZGVzKSBhbmQgcmVndWxhclxuICogZGlyZWN0aXZlIG1hdGNoaW5nIG1vZGU6XG4gKiAtIGluIHRoZSBcImRpcmVjdGl2ZSBtYXRjaGluZ1wiIG1vZGUgd2UgZG8gX25vdF8gdGFrZSBUQ29udGFpbmVyJ3MgdGFnTmFtZSBpbnRvIGFjY291bnQgaWYgaXQgaXNcbiAqIGRpZmZlcmVudCBmcm9tIE5HX1RFTVBMQVRFX1NFTEVDVE9SICh2YWx1ZSBkaWZmZXJlbnQgZnJvbSBOR19URU1QTEFURV9TRUxFQ1RPUiBpbmRpY2F0ZXMgdGhhdCBhXG4gKiB0YWcgbmFtZSB3YXMgZXh0cmFjdGVkIGZyb20gKiBzeW50YXggc28gd2Ugd291bGQgbWF0Y2ggdGhlIHNhbWUgZGlyZWN0aXZlIHR3aWNlKTtcbiAqIC0gaW4gdGhlIFwicHJvamVjdGlvblwiIG1vZGUsIHdlIHVzZSBhIHRhZyBuYW1lIHBvdGVudGlhbGx5IGV4dHJhY3RlZCBmcm9tIHRoZSAqIHN5bnRheCBwcm9jZXNzaW5nXG4gKiAoYXBwbGljYWJsZSB0byBUTm9kZVR5cGUuQ29udGFpbmVyIG9ubHkpLlxuICovXG5mdW5jdGlvbiBoYXNUYWdBbmRUeXBlTWF0Y2goXG4gICAgdE5vZGU6IFROb2RlLCBjdXJyZW50U2VsZWN0b3I6IHN0cmluZywgaXNQcm9qZWN0aW9uTW9kZTogYm9vbGVhbik6IGJvb2xlYW4ge1xuICBjb25zdCB0YWdOYW1lVG9Db21wYXJlID0gdE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkNvbnRhaW5lciAmJiAhaXNQcm9qZWN0aW9uTW9kZSA/XG4gICAgICBOR19URU1QTEFURV9TRUxFQ1RPUiA6XG4gICAgICB0Tm9kZS50YWdOYW1lO1xuICByZXR1cm4gY3VycmVudFNlbGVjdG9yID09PSB0YWdOYW1lVG9Db21wYXJlO1xufVxuXG4vKipcbiAqIEEgdXRpbGl0eSBmdW5jdGlvbiB0byBtYXRjaCBhbiBJdnkgbm9kZSBzdGF0aWMgZGF0YSBhZ2FpbnN0IGEgc2ltcGxlIENTUyBzZWxlY3RvclxuICpcbiAqIEBwYXJhbSBub2RlIHN0YXRpYyBkYXRhIG9mIHRoZSBub2RlIHRvIG1hdGNoXG4gKiBAcGFyYW0gc2VsZWN0b3IgVGhlIHNlbGVjdG9yIHRvIHRyeSBtYXRjaGluZyBhZ2FpbnN0IHRoZSBub2RlLlxuICogQHBhcmFtIGlzUHJvamVjdGlvbk1vZGUgaWYgYHRydWVgIHdlIGFyZSBtYXRjaGluZyBmb3IgY29udGVudCBwcm9qZWN0aW9uLCBvdGhlcndpc2Ugd2UgYXJlIGRvaW5nXG4gKiBkaXJlY3RpdmUgbWF0Y2hpbmcuXG4gKiBAcmV0dXJucyB0cnVlIGlmIG5vZGUgbWF0Y2hlcyB0aGUgc2VsZWN0b3IuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc05vZGVNYXRjaGluZ1NlbGVjdG9yKFxuICAgIHROb2RlOiBUTm9kZSwgc2VsZWN0b3I6IENzc1NlbGVjdG9yLCBpc1Byb2plY3Rpb25Nb2RlOiBib29sZWFuKTogYm9vbGVhbiB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKHNlbGVjdG9yWzBdLCAnU2VsZWN0b3Igc2hvdWxkIGhhdmUgYSB0YWcgbmFtZScpO1xuICBsZXQgbW9kZTogU2VsZWN0b3JGbGFncyA9IFNlbGVjdG9yRmxhZ3MuRUxFTUVOVDtcbiAgY29uc3Qgbm9kZUF0dHJzID0gdE5vZGUuYXR0cnMgfHwgW107XG5cbiAgLy8gRmluZCB0aGUgaW5kZXggb2YgZmlyc3QgYXR0cmlidXRlIHRoYXQgaGFzIG5vIHZhbHVlLCBvbmx5IGEgbmFtZS5cbiAgY29uc3QgbmFtZU9ubHlNYXJrZXJJZHggPSBnZXROYW1lT25seU1hcmtlckluZGV4KG5vZGVBdHRycyk7XG5cbiAgLy8gV2hlbiBwcm9jZXNzaW5nIFwiOm5vdFwiIHNlbGVjdG9ycywgd2Ugc2tpcCB0byB0aGUgbmV4dCBcIjpub3RcIiBpZiB0aGVcbiAgLy8gY3VycmVudCBvbmUgZG9lc24ndCBtYXRjaFxuICBsZXQgc2tpcFRvTmV4dFNlbGVjdG9yID0gZmFsc2U7XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBzZWxlY3Rvci5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IGN1cnJlbnQgPSBzZWxlY3RvcltpXTtcbiAgICBpZiAodHlwZW9mIGN1cnJlbnQgPT09ICdudW1iZXInKSB7XG4gICAgICAvLyBJZiB3ZSBmaW5pc2ggcHJvY2Vzc2luZyBhIDpub3Qgc2VsZWN0b3IgYW5kIGl0IGhhc24ndCBmYWlsZWQsIHJldHVybiBmYWxzZVxuICAgICAgaWYgKCFza2lwVG9OZXh0U2VsZWN0b3IgJiYgIWlzUG9zaXRpdmUobW9kZSkgJiYgIWlzUG9zaXRpdmUoY3VycmVudCBhcyBudW1iZXIpKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIC8vIElmIHdlIGFyZSBza2lwcGluZyB0byB0aGUgbmV4dCA6bm90KCkgYW5kIHRoaXMgbW9kZSBmbGFnIGlzIHBvc2l0aXZlLFxuICAgICAgLy8gaXQncyBhIHBhcnQgb2YgdGhlIGN1cnJlbnQgOm5vdCgpIHNlbGVjdG9yLCBhbmQgd2Ugc2hvdWxkIGtlZXAgc2tpcHBpbmdcbiAgICAgIGlmIChza2lwVG9OZXh0U2VsZWN0b3IgJiYgaXNQb3NpdGl2ZShjdXJyZW50KSkgY29udGludWU7XG4gICAgICBza2lwVG9OZXh0U2VsZWN0b3IgPSBmYWxzZTtcbiAgICAgIG1vZGUgPSAoY3VycmVudCBhcyBudW1iZXIpIHwgKG1vZGUgJiBTZWxlY3RvckZsYWdzLk5PVCk7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAoc2tpcFRvTmV4dFNlbGVjdG9yKSBjb250aW51ZTtcblxuICAgIGlmIChtb2RlICYgU2VsZWN0b3JGbGFncy5FTEVNRU5UKSB7XG4gICAgICBtb2RlID0gU2VsZWN0b3JGbGFncy5BVFRSSUJVVEUgfCBtb2RlICYgU2VsZWN0b3JGbGFncy5OT1Q7XG4gICAgICBpZiAoY3VycmVudCAhPT0gJycgJiYgIWhhc1RhZ0FuZFR5cGVNYXRjaCh0Tm9kZSwgY3VycmVudCwgaXNQcm9qZWN0aW9uTW9kZSkgfHxcbiAgICAgICAgICBjdXJyZW50ID09PSAnJyAmJiBzZWxlY3Rvci5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgaWYgKGlzUG9zaXRpdmUobW9kZSkpIHJldHVybiBmYWxzZTtcbiAgICAgICAgc2tpcFRvTmV4dFNlbGVjdG9yID0gdHJ1ZTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3Qgc2VsZWN0b3JBdHRyVmFsdWUgPSBtb2RlICYgU2VsZWN0b3JGbGFncy5DTEFTUyA/IGN1cnJlbnQgOiBzZWxlY3RvclsrK2ldO1xuXG4gICAgICAvLyBzcGVjaWFsIGNhc2UgZm9yIG1hdGNoaW5nIGFnYWluc3QgY2xhc3NlcyB3aGVuIGEgdE5vZGUgaGFzIGJlZW4gaW5zdGFudGlhdGVkIHdpdGhcbiAgICAgIC8vIGNsYXNzIGFuZCBzdHlsZSB2YWx1ZXMgYXMgc2VwYXJhdGUgYXR0cmlidXRlIHZhbHVlcyAoZS5nLiBbJ3RpdGxlJywgQ0xBU1MsICdmb28nXSlcbiAgICAgIGlmICgobW9kZSAmIFNlbGVjdG9yRmxhZ3MuQ0xBU1MpICYmIHROb2RlLnN0eWxpbmdUZW1wbGF0ZSkge1xuICAgICAgICBpZiAoIWlzQ3NzQ2xhc3NNYXRjaGluZyhyZWFkQ2xhc3NWYWx1ZUZyb21UTm9kZSh0Tm9kZSksIHNlbGVjdG9yQXR0clZhbHVlIGFzIHN0cmluZykpIHtcbiAgICAgICAgICBpZiAoaXNQb3NpdGl2ZShtb2RlKSkgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgIHNraXBUb05leHRTZWxlY3RvciA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGlzSW5saW5lVGVtcGxhdGUgPVxuICAgICAgICAgIHROb2RlLnR5cGUgPT0gVE5vZGVUeXBlLkNvbnRhaW5lciAmJiB0Tm9kZS50YWdOYW1lICE9PSBOR19URU1QTEFURV9TRUxFQ1RPUjtcbiAgICAgIGNvbnN0IGF0dHJOYW1lID0gKG1vZGUgJiBTZWxlY3RvckZsYWdzLkNMQVNTKSA/ICdjbGFzcycgOiBjdXJyZW50O1xuICAgICAgY29uc3QgYXR0ckluZGV4SW5Ob2RlID1cbiAgICAgICAgICBmaW5kQXR0ckluZGV4SW5Ob2RlKGF0dHJOYW1lLCBub2RlQXR0cnMsIGlzSW5saW5lVGVtcGxhdGUsIGlzUHJvamVjdGlvbk1vZGUpO1xuXG4gICAgICBpZiAoYXR0ckluZGV4SW5Ob2RlID09PSAtMSkge1xuICAgICAgICBpZiAoaXNQb3NpdGl2ZShtb2RlKSkgcmV0dXJuIGZhbHNlO1xuICAgICAgICBza2lwVG9OZXh0U2VsZWN0b3IgPSB0cnVlO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgaWYgKHNlbGVjdG9yQXR0clZhbHVlICE9PSAnJykge1xuICAgICAgICBsZXQgbm9kZUF0dHJWYWx1ZTogc3RyaW5nO1xuICAgICAgICBpZiAoYXR0ckluZGV4SW5Ob2RlID4gbmFtZU9ubHlNYXJrZXJJZHgpIHtcbiAgICAgICAgICBub2RlQXR0clZhbHVlID0gJyc7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbmdEZXZNb2RlICYmIGFzc2VydE5vdEVxdWFsKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZUF0dHJzW2F0dHJJbmRleEluTm9kZV0sIEF0dHJpYnV0ZU1hcmtlci5OYW1lc3BhY2VVUkksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAnV2UgZG8gbm90IG1hdGNoIGRpcmVjdGl2ZXMgb24gbmFtZXNwYWNlZCBhdHRyaWJ1dGVzJyk7XG4gICAgICAgICAgbm9kZUF0dHJWYWx1ZSA9IG5vZGVBdHRyc1thdHRySW5kZXhJbk5vZGUgKyAxXSBhcyBzdHJpbmc7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBjb21wYXJlQWdhaW5zdENsYXNzTmFtZSA9IG1vZGUgJiBTZWxlY3RvckZsYWdzLkNMQVNTID8gbm9kZUF0dHJWYWx1ZSA6IG51bGw7XG4gICAgICAgIGlmIChjb21wYXJlQWdhaW5zdENsYXNzTmFtZSAmJlxuICAgICAgICAgICAgICAgICFpc0Nzc0NsYXNzTWF0Y2hpbmcoY29tcGFyZUFnYWluc3RDbGFzc05hbWUsIHNlbGVjdG9yQXR0clZhbHVlIGFzIHN0cmluZykgfHxcbiAgICAgICAgICAgIG1vZGUgJiBTZWxlY3RvckZsYWdzLkFUVFJJQlVURSAmJiBzZWxlY3RvckF0dHJWYWx1ZSAhPT0gbm9kZUF0dHJWYWx1ZSkge1xuICAgICAgICAgIGlmIChpc1Bvc2l0aXZlKG1vZGUpKSByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgc2tpcFRvTmV4dFNlbGVjdG9yID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBpc1Bvc2l0aXZlKG1vZGUpIHx8IHNraXBUb05leHRTZWxlY3Rvcjtcbn1cblxuZnVuY3Rpb24gaXNQb3NpdGl2ZShtb2RlOiBTZWxlY3RvckZsYWdzKTogYm9vbGVhbiB7XG4gIHJldHVybiAobW9kZSAmIFNlbGVjdG9yRmxhZ3MuTk9UKSA9PT0gMDtcbn1cblxuZnVuY3Rpb24gcmVhZENsYXNzVmFsdWVGcm9tVE5vZGUodE5vZGU6IFROb2RlKTogc3RyaW5nIHtcbiAgLy8gY29tcGFyaW5nIGFnYWluc3QgQ1NTIGNsYXNzIHZhbHVlcyBpcyBjb21wbGV4IGJlY2F1c2UgdGhlIGNvbXBpbGVyIGRvZXNuJ3QgcGxhY2UgdGhlbSBhc1xuICAvLyByZWd1bGFyIGF0dHJpYnV0ZXMgd2hlbiBhbiBlbGVtZW50IGlzIGNyZWF0ZWQuIEluc3RlYWQsIHRoZSBjbGFzc2VzIChhbmQgc3R5bGVzIGZvclxuICAvLyB0aGF0IG1hdHRlcikgYXJlIHBsYWNlZCBpbiBhIHNwZWNpYWwgc3R5bGluZyBjb250ZXh0IHRoYXQgaXMgdXNlZCBmb3IgcmVzb2x2aW5nIGFsbFxuICAvLyBjbGFzcy9zdHlsZSB2YWx1ZXMgYWNyb3NzIHN0YXRpYyBhdHRyaWJ1dGVzLCBbc3R5bGVdL1tjbGFzc10gYW5kIFtzdHlsZS5wcm9wXS9bY2xhc3MubmFtZV1cbiAgLy8gYmluZGluZ3MuIFRoZXJlZm9yZSBpZiBhbmQgd2hlbiB0aGUgc3R5bGluZyBjb250ZXh0IGV4aXN0cyB0aGVuIHRoZSBjbGFzcyB2YWx1ZXMgYXJlIHRvIGJlXG4gIC8vIGV4dHJhY3RlZCBieSB0aGUgY29udGV4dCBoZWxwZXIgY29kZSBiZWxvdy4uLlxuICByZXR1cm4gdE5vZGUuc3R5bGluZ1RlbXBsYXRlID8gZ2V0SW5pdGlhbENsYXNzTmFtZVZhbHVlKHROb2RlLnN0eWxpbmdUZW1wbGF0ZSkgOiAnJztcbn1cblxuLyoqXG4gKiBFeGFtaW5lcyB0aGUgYXR0cmlidXRlJ3MgZGVmaW5pdGlvbiBhcnJheSBmb3IgYSBub2RlIHRvIGZpbmQgdGhlIGluZGV4IG9mIHRoZVxuICogYXR0cmlidXRlIHRoYXQgbWF0Y2hlcyB0aGUgZ2l2ZW4gYG5hbWVgLlxuICpcbiAqIE5PVEU6IFRoaXMgd2lsbCBub3QgbWF0Y2ggbmFtZXNwYWNlZCBhdHRyaWJ1dGVzLlxuICpcbiAqIEF0dHJpYnV0ZSBtYXRjaGluZyBkZXBlbmRzIHVwb24gYGlzSW5saW5lVGVtcGxhdGVgIGFuZCBgaXNQcm9qZWN0aW9uTW9kZWAuXG4gKiBUaGUgZm9sbG93aW5nIHRhYmxlIHN1bW1hcml6ZXMgd2hpY2ggdHlwZXMgb2YgYXR0cmlidXRlcyB3ZSBhdHRlbXB0IHRvIG1hdGNoOlxuICpcbiAqID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gKiBNb2RlcyAgICAgICAgICAgICAgICAgICB8IE5vcm1hbCBBdHRyaWJ1dGVzIHwgQmluZGluZ3MgQXR0cmlidXRlcyB8IFRlbXBsYXRlIEF0dHJpYnV0ZXNcbiAqID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gKiBJbmxpbmUgKyBQcm9qZWN0aW9uICAgICB8IFlFUyAgICAgICAgICAgICAgIHwgWUVTICAgICAgICAgICAgICAgICB8IE5PXG4gKiAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICogSW5saW5lICsgRGlyZWN0aXZlICAgICAgfCBOTyAgICAgICAgICAgICAgICB8IE5PICAgICAgICAgICAgICAgICAgfCBZRVNcbiAqIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gKiBOb24taW5saW5lICsgUHJvamVjdGlvbiB8IFlFUyAgICAgICAgICAgICAgIHwgWUVTICAgICAgICAgICAgICAgICB8IE5PXG4gKiAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICogTm9uLWlubGluZSArIERpcmVjdGl2ZSAgfCBZRVMgICAgICAgICAgICAgICB8IFlFUyAgICAgICAgICAgICAgICAgfCBOT1xuICogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAqXG4gKiBAcGFyYW0gbmFtZSB0aGUgbmFtZSBvZiB0aGUgYXR0cmlidXRlIHRvIGZpbmRcbiAqIEBwYXJhbSBhdHRycyB0aGUgYXR0cmlidXRlIGFycmF5IHRvIGV4YW1pbmVcbiAqIEBwYXJhbSBpc0lubGluZVRlbXBsYXRlIHRydWUgaWYgdGhlIG5vZGUgYmVpbmcgbWF0Y2hlZCBpcyBhbiBpbmxpbmUgdGVtcGxhdGUgKGUuZy4gYCpuZ0ZvcmApXG4gKiByYXRoZXIgdGhhbiBhIG1hbnVhbGx5IGV4cGFuZGVkIHRlbXBsYXRlIG5vZGUgKGUuZyBgPG5nLXRlbXBsYXRlPmApLlxuICogQHBhcmFtIGlzUHJvamVjdGlvbk1vZGUgdHJ1ZSBpZiB3ZSBhcmUgbWF0Y2hpbmcgYWdhaW5zdCBjb250ZW50IHByb2plY3Rpb24gb3RoZXJ3aXNlIHdlIGFyZVxuICogbWF0Y2hpbmcgYWdhaW5zdCBkaXJlY3RpdmVzLlxuICovXG5mdW5jdGlvbiBmaW5kQXR0ckluZGV4SW5Ob2RlKFxuICAgIG5hbWU6IHN0cmluZywgYXR0cnM6IFRBdHRyaWJ1dGVzIHwgbnVsbCwgaXNJbmxpbmVUZW1wbGF0ZTogYm9vbGVhbixcbiAgICBpc1Byb2plY3Rpb25Nb2RlOiBib29sZWFuKTogbnVtYmVyIHtcbiAgaWYgKGF0dHJzID09PSBudWxsKSByZXR1cm4gLTE7XG5cbiAgbGV0IGkgPSAwO1xuXG4gIGlmIChpc1Byb2plY3Rpb25Nb2RlIHx8ICFpc0lubGluZVRlbXBsYXRlKSB7XG4gICAgbGV0IGJpbmRpbmdzTW9kZSA9IGZhbHNlO1xuICAgIHdoaWxlIChpIDwgYXR0cnMubGVuZ3RoKSB7XG4gICAgICBjb25zdCBtYXliZUF0dHJOYW1lID0gYXR0cnNbaV07XG4gICAgICBpZiAobWF5YmVBdHRyTmFtZSA9PT0gbmFtZSkge1xuICAgICAgICByZXR1cm4gaTtcbiAgICAgIH0gZWxzZSBpZiAobWF5YmVBdHRyTmFtZSA9PT0gQXR0cmlidXRlTWFya2VyLkJpbmRpbmdzKSB7XG4gICAgICAgIGJpbmRpbmdzTW9kZSA9IHRydWU7XG4gICAgICB9IGVsc2UgaWYgKG1heWJlQXR0ck5hbWUgPT09IEF0dHJpYnV0ZU1hcmtlci5UZW1wbGF0ZSkge1xuICAgICAgICAvLyBXZSBkbyBub3QgY2FyZSBhYm91dCBUZW1wbGF0ZSBhdHRyaWJ1dGVzIGluIHRoaXMgc2NlbmFyaW8uXG4gICAgICAgIGJyZWFrO1xuICAgICAgfSBlbHNlIGlmIChtYXliZUF0dHJOYW1lID09PSBBdHRyaWJ1dGVNYXJrZXIuTmFtZXNwYWNlVVJJKSB7XG4gICAgICAgIC8vIFNraXAgdGhlIHdob2xlIG5hbWVzcGFjZWQgYXR0cmlidXRlIGFuZCB2YWx1ZS4gVGhpcyBpcyBieSBkZXNpZ24uXG4gICAgICAgIGkgKz0gNDtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICAvLyBJbiBiaW5kaW5nIG1vZGUgdGhlcmUgYXJlIG9ubHkgbmFtZXMsIHJhdGhlciB0aGFuIG5hbWUtdmFsdWUgcGFpcnMuXG4gICAgICBpICs9IGJpbmRpbmdzTW9kZSA/IDEgOiAyO1xuICAgIH1cbiAgICAvLyBXZSBkaWQgbm90IG1hdGNoIHRoZSBhdHRyaWJ1dGVcbiAgICByZXR1cm4gLTE7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIG1hdGNoVGVtcGxhdGVBdHRyaWJ1dGUoYXR0cnMsIG5hbWUpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc05vZGVNYXRjaGluZ1NlbGVjdG9yTGlzdChcbiAgICB0Tm9kZTogVE5vZGUsIHNlbGVjdG9yOiBDc3NTZWxlY3Rvckxpc3QsIGlzUHJvamVjdGlvbk1vZGU6IGJvb2xlYW4gPSBmYWxzZSk6IGJvb2xlYW4ge1xuICBmb3IgKGxldCBpID0gMDsgaSA8IHNlbGVjdG9yLmxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKGlzTm9kZU1hdGNoaW5nU2VsZWN0b3IodE5vZGUsIHNlbGVjdG9yW2ldLCBpc1Byb2plY3Rpb25Nb2RlKSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0UHJvamVjdEFzQXR0clZhbHVlKHROb2RlOiBUTm9kZSk6IHN0cmluZ3xudWxsIHtcbiAgY29uc3Qgbm9kZUF0dHJzID0gdE5vZGUuYXR0cnM7XG4gIGlmIChub2RlQXR0cnMgIT0gbnVsbCkge1xuICAgIGNvbnN0IG5nUHJvamVjdEFzQXR0cklkeCA9IG5vZGVBdHRycy5pbmRleE9mKE5HX1BST0pFQ1RfQVNfQVRUUl9OQU1FKTtcbiAgICAvLyBvbmx5IGNoZWNrIGZvciBuZ1Byb2plY3RBcyBpbiBhdHRyaWJ1dGUgbmFtZXMsIGRvbid0IGFjY2lkZW50YWxseSBtYXRjaCBhdHRyaWJ1dGUncyB2YWx1ZVxuICAgIC8vIChhdHRyaWJ1dGUgbmFtZXMgYXJlIHN0b3JlZCBhdCBldmVuIGluZGV4ZXMpXG4gICAgaWYgKChuZ1Byb2plY3RBc0F0dHJJZHggJiAxKSA9PT0gMCkge1xuICAgICAgcmV0dXJuIG5vZGVBdHRyc1tuZ1Byb2plY3RBc0F0dHJJZHggKyAxXSBhcyBzdHJpbmc7XG4gICAgfVxuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG4vKipcbiAqIENoZWNrcyBhIGdpdmVuIG5vZGUgYWdhaW5zdCBtYXRjaGluZyBwcm9qZWN0aW9uIHNlbGVjdG9ycyBhbmQgcmV0dXJuc1xuICogc2VsZWN0b3IgaW5kZXggKG9yIDAgaWYgbm9uZSBtYXRjaGVkKS5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIHRha2VzIGludG8gYWNjb3VudCB0aGUgbmdQcm9qZWN0QXMgYXR0cmlidXRlOiBpZiBwcmVzZW50IGl0cyB2YWx1ZSB3aWxsIGJlXG4gKiBjb21wYXJlZCB0byB0aGUgcmF3ICh1bi1wYXJzZWQpIENTUyBzZWxlY3RvciBpbnN0ZWFkIG9mIHVzaW5nIHN0YW5kYXJkIHNlbGVjdG9yIG1hdGNoaW5nIGxvZ2ljLlxuICovXG5leHBvcnQgZnVuY3Rpb24gbWF0Y2hpbmdQcm9qZWN0aW9uU2VsZWN0b3JJbmRleChcbiAgICB0Tm9kZTogVE5vZGUsIHNlbGVjdG9yczogQ3NzU2VsZWN0b3JMaXN0W10sIHRleHRTZWxlY3RvcnM6IHN0cmluZ1tdKTogbnVtYmVyIHtcbiAgY29uc3QgbmdQcm9qZWN0QXNBdHRyVmFsID0gZ2V0UHJvamVjdEFzQXR0clZhbHVlKHROb2RlKTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBzZWxlY3RvcnMubGVuZ3RoOyBpKyspIHtcbiAgICAvLyBpZiBhIG5vZGUgaGFzIHRoZSBuZ1Byb2plY3RBcyBhdHRyaWJ1dGUgbWF0Y2ggaXQgYWdhaW5zdCB1bnBhcnNlZCBzZWxlY3RvclxuICAgIC8vIG1hdGNoIGEgbm9kZSBhZ2FpbnN0IGEgcGFyc2VkIHNlbGVjdG9yIG9ubHkgaWYgbmdQcm9qZWN0QXMgYXR0cmlidXRlIGlzIG5vdCBwcmVzZW50XG4gICAgaWYgKG5nUHJvamVjdEFzQXR0clZhbCA9PT0gdGV4dFNlbGVjdG9yc1tpXSB8fFxuICAgICAgICBuZ1Byb2plY3RBc0F0dHJWYWwgPT09IG51bGwgJiZcbiAgICAgICAgICAgIGlzTm9kZU1hdGNoaW5nU2VsZWN0b3JMaXN0KHROb2RlLCBzZWxlY3RvcnNbaV0sIC8qIGlzUHJvamVjdGlvbk1vZGUgKi8gdHJ1ZSkpIHtcbiAgICAgIHJldHVybiBpICsgMTsgIC8vIGZpcnN0IG1hdGNoaW5nIHNlbGVjdG9yIFwiY2FwdHVyZXNcIiBhIGdpdmVuIG5vZGVcbiAgICB9XG4gIH1cbiAgcmV0dXJuIDA7XG59XG5cbmZ1bmN0aW9uIGdldE5hbWVPbmx5TWFya2VySW5kZXgobm9kZUF0dHJzOiBUQXR0cmlidXRlcykge1xuICBmb3IgKGxldCBpID0gMDsgaSA8IG5vZGVBdHRycy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IG5vZGVBdHRyID0gbm9kZUF0dHJzW2ldO1xuICAgIGlmIChpc05hbWVPbmx5QXR0cmlidXRlTWFya2VyKG5vZGVBdHRyKSkge1xuICAgICAgcmV0dXJuIGk7XG4gICAgfVxuICB9XG4gIHJldHVybiBub2RlQXR0cnMubGVuZ3RoO1xufVxuXG5mdW5jdGlvbiBtYXRjaFRlbXBsYXRlQXR0cmlidXRlKGF0dHJzOiBUQXR0cmlidXRlcywgbmFtZTogc3RyaW5nKTogbnVtYmVyIHtcbiAgbGV0IGkgPSBhdHRycy5pbmRleE9mKEF0dHJpYnV0ZU1hcmtlci5UZW1wbGF0ZSk7XG4gIGlmIChpID4gLTEpIHtcbiAgICBpKys7XG4gICAgd2hpbGUgKGkgPCBhdHRycy5sZW5ndGgpIHtcbiAgICAgIGlmIChhdHRyc1tpXSA9PT0gbmFtZSkgcmV0dXJuIGk7XG4gICAgICBpKys7XG4gICAgfVxuICB9XG4gIHJldHVybiAtMTtcbn1cbiJdfQ==