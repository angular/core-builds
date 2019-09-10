/**
 * @fileoverview added by tsickle
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
import { assertDefined, assertNotEqual } from '../util/assert';
import { unusedValueExportToPlacateAjd as unused1 } from './interfaces/node';
import { unusedValueExportToPlacateAjd as unused2 } from './interfaces/projection';
import { getInitialStylingValue } from './styling_next/util';
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
    // we lowercase the class attribute value to be able to match
    // selectors without case-sensitivity
    // (selectors are already in lowercase when generated)
    /** @type {?} */
    const matchIndex = nodeClassAttrVal.toLowerCase().indexOf(cssClassToMatch);
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
            if ((mode & 8 /* CLASS */) && tNode.classes) {
                if (!isCssClassMatching(getInitialStylingValue(tNode.classes), (/** @type {?} */ (selectorAttrValue)))) {
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
                    // we lowercase the attribute value to be able to match
                    // selectors without case-sensitivity
                    // (selectors are already in lowercase when generated)
                    nodeAttrValue = ((/** @type {?} */ (nodeAttrs[attrIndexInNode + 1]))).toLowerCase();
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9kZV9zZWxlY3Rvcl9tYXRjaGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9ub2RlX3NlbGVjdG9yX21hdGNoZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFRQSxPQUFPLHFCQUFxQixDQUFDO0FBRTdCLE9BQU8sRUFBQyxhQUFhLEVBQUUsY0FBYyxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFFN0QsT0FBTyxFQUFpRCw2QkFBNkIsSUFBSSxPQUFPLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUMzSCxPQUFPLEVBQThDLDZCQUE2QixJQUFJLE9BQU8sRUFBQyxNQUFNLHlCQUF5QixDQUFDO0FBQzlILE9BQU8sRUFBQyxzQkFBc0IsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBQzNELE9BQU8sRUFBQyx5QkFBeUIsRUFBQyxNQUFNLG9CQUFvQixDQUFDOztNQUV2RCx1QkFBdUIsR0FBRyxPQUFPLEdBQUcsT0FBTzs7TUFFM0Msb0JBQW9CLEdBQUcsYUFBYTs7Ozs7O0FBRTFDLFNBQVMsa0JBQWtCLENBQUMsZ0JBQXdCLEVBQUUsZUFBdUI7O1VBQ3JFLGNBQWMsR0FBRyxnQkFBZ0IsQ0FBQyxNQUFNOzs7OztVQUl4QyxVQUFVLEdBQUcsZ0JBQWdCLENBQUMsV0FBVyxFQUFFLENBQUMsT0FBTyxDQUFDLGVBQWUsQ0FBQzs7VUFDcEUsV0FBVyxHQUFHLFVBQVUsR0FBRyxlQUFlLENBQUMsTUFBTTtJQUN2RCxJQUFJLFVBQVUsS0FBSyxDQUFDLENBQUMsQ0FBa0QsV0FBVztXQUMzRSxDQUFDLFVBQVUsR0FBRyxDQUFDLElBQUksbUJBQUEsZ0JBQWdCLEVBQUUsQ0FBQyxVQUFVLEdBQUcsQ0FBQyxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUUsa0JBQWtCOztZQUVyRixDQUFDLFdBQVcsR0FBRyxjQUFjLElBQUksbUJBQUEsZ0JBQWdCLEVBQUUs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RUFBRSxDQUFDLEVBQUUsRUFBRTtZQUN4QyxJQUFJLFFBQVEsQ0FBQyxDQUFDLENBQUMsS0FBSyxxQkFBcUIsQ0FBQyxDQUFDLENBQUMsRUFBRTtnQkFDNUMsU0FBUyxnQkFBZ0IsQ0FBQzthQUMzQjtTQUNGO1FBQ0QsT0FBTyxJQUFJLENBQUM7S0FDYjtJQUNELE9BQU8sS0FBSyxDQUFDO0FBQ2YsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0ICcuLi91dGlsL25nX2Rldl9tb2RlJztcblxuaW1wb3J0IHthc3NlcnREZWZpbmVkLCBhc3NlcnROb3RFcXVhbH0gZnJvbSAnLi4vdXRpbC9hc3NlcnQnO1xuXG5pbXBvcnQge0F0dHJpYnV0ZU1hcmtlciwgVEF0dHJpYnV0ZXMsIFROb2RlLCBUTm9kZVR5cGUsIHVudXNlZFZhbHVlRXhwb3J0VG9QbGFjYXRlQWpkIGFzIHVudXNlZDF9IGZyb20gJy4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7Q3NzU2VsZWN0b3IsIENzc1NlbGVjdG9yTGlzdCwgU2VsZWN0b3JGbGFncywgdW51c2VkVmFsdWVFeHBvcnRUb1BsYWNhdGVBamQgYXMgdW51c2VkMn0gZnJvbSAnLi9pbnRlcmZhY2VzL3Byb2plY3Rpb24nO1xuaW1wb3J0IHtnZXRJbml0aWFsU3R5bGluZ1ZhbHVlfSBmcm9tICcuL3N0eWxpbmdfbmV4dC91dGlsJztcbmltcG9ydCB7aXNOYW1lT25seUF0dHJpYnV0ZU1hcmtlcn0gZnJvbSAnLi91dGlsL2F0dHJzX3V0aWxzJztcblxuY29uc3QgdW51c2VkVmFsdWVUb1BsYWNhdGVBamQgPSB1bnVzZWQxICsgdW51c2VkMjtcblxuY29uc3QgTkdfVEVNUExBVEVfU0VMRUNUT1IgPSAnbmctdGVtcGxhdGUnO1xuXG5mdW5jdGlvbiBpc0Nzc0NsYXNzTWF0Y2hpbmcobm9kZUNsYXNzQXR0clZhbDogc3RyaW5nLCBjc3NDbGFzc1RvTWF0Y2g6IHN0cmluZyk6IGJvb2xlYW4ge1xuICBjb25zdCBub2RlQ2xhc3Nlc0xlbiA9IG5vZGVDbGFzc0F0dHJWYWwubGVuZ3RoO1xuICAvLyB3ZSBsb3dlcmNhc2UgdGhlIGNsYXNzIGF0dHJpYnV0ZSB2YWx1ZSB0byBiZSBhYmxlIHRvIG1hdGNoXG4gIC8vIHNlbGVjdG9ycyB3aXRob3V0IGNhc2Utc2Vuc2l0aXZpdHlcbiAgLy8gKHNlbGVjdG9ycyBhcmUgYWxyZWFkeSBpbiBsb3dlcmNhc2Ugd2hlbiBnZW5lcmF0ZWQpXG4gIGNvbnN0IG1hdGNoSW5kZXggPSBub2RlQ2xhc3NBdHRyVmFsLnRvTG93ZXJDYXNlKCkuaW5kZXhPZihjc3NDbGFzc1RvTWF0Y2gpO1xuICBjb25zdCBtYXRjaEVuZElkeCA9IG1hdGNoSW5kZXggKyBjc3NDbGFzc1RvTWF0Y2gubGVuZ3RoO1xuICBpZiAobWF0Y2hJbmRleCA9PT0gLTEgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIG5vIG1hdGNoXG4gICAgICB8fCAobWF0Y2hJbmRleCA+IDAgJiYgbm9kZUNsYXNzQXR0clZhbCAhW21hdGNoSW5kZXggLSAxXSAhPT0gJyAnKSAgLy8gbm8gc3BhY2UgYmVmb3JlXG4gICAgICB8fFxuICAgICAgKG1hdGNoRW5kSWR4IDwgbm9kZUNsYXNzZXNMZW4gJiYgbm9kZUNsYXNzQXR0clZhbCAhW21hdGNoRW5kSWR4XSAhPT0gJyAnKSkgIC8vIG5vIHNwYWNlIGFmdGVyXG4gIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgcmV0dXJuIHRydWU7XG59XG5cbi8qKlxuICogRnVuY3Rpb24gdGhhdCBjaGVja3Mgd2hldGhlciBhIGdpdmVuIHROb2RlIG1hdGNoZXMgdGFnLWJhc2VkIHNlbGVjdG9yIGFuZCBoYXMgYSB2YWxpZCB0eXBlLlxuICpcbiAqIE1hdGNoaW5nIGNhbiBiZSBwZXJmb3JtZWQgaW4gMiBtb2RlczogcHJvamVjdGlvbiBtb2RlICh3aGVuIHdlIHByb2plY3Qgbm9kZXMpIGFuZCByZWd1bGFyXG4gKiBkaXJlY3RpdmUgbWF0Y2hpbmcgbW9kZTpcbiAqIC0gaW4gdGhlIFwiZGlyZWN0aXZlIG1hdGNoaW5nXCIgbW9kZSB3ZSBkbyBfbm90XyB0YWtlIFRDb250YWluZXIncyB0YWdOYW1lIGludG8gYWNjb3VudCBpZiBpdCBpc1xuICogZGlmZmVyZW50IGZyb20gTkdfVEVNUExBVEVfU0VMRUNUT1IgKHZhbHVlIGRpZmZlcmVudCBmcm9tIE5HX1RFTVBMQVRFX1NFTEVDVE9SIGluZGljYXRlcyB0aGF0IGFcbiAqIHRhZyBuYW1lIHdhcyBleHRyYWN0ZWQgZnJvbSAqIHN5bnRheCBzbyB3ZSB3b3VsZCBtYXRjaCB0aGUgc2FtZSBkaXJlY3RpdmUgdHdpY2UpO1xuICogLSBpbiB0aGUgXCJwcm9qZWN0aW9uXCIgbW9kZSwgd2UgdXNlIGEgdGFnIG5hbWUgcG90ZW50aWFsbHkgZXh0cmFjdGVkIGZyb20gdGhlICogc3ludGF4IHByb2Nlc3NpbmdcbiAqIChhcHBsaWNhYmxlIHRvIFROb2RlVHlwZS5Db250YWluZXIgb25seSkuXG4gKi9cbmZ1bmN0aW9uIGhhc1RhZ0FuZFR5cGVNYXRjaChcbiAgICB0Tm9kZTogVE5vZGUsIGN1cnJlbnRTZWxlY3Rvcjogc3RyaW5nLCBpc1Byb2plY3Rpb25Nb2RlOiBib29sZWFuKTogYm9vbGVhbiB7XG4gIGNvbnN0IHRhZ05hbWVUb0NvbXBhcmUgPSB0Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuQ29udGFpbmVyICYmICFpc1Byb2plY3Rpb25Nb2RlID9cbiAgICAgIE5HX1RFTVBMQVRFX1NFTEVDVE9SIDpcbiAgICAgIHROb2RlLnRhZ05hbWU7XG4gIHJldHVybiBjdXJyZW50U2VsZWN0b3IgPT09IHRhZ05hbWVUb0NvbXBhcmU7XG59XG5cbi8qKlxuICogQSB1dGlsaXR5IGZ1bmN0aW9uIHRvIG1hdGNoIGFuIEl2eSBub2RlIHN0YXRpYyBkYXRhIGFnYWluc3QgYSBzaW1wbGUgQ1NTIHNlbGVjdG9yXG4gKlxuICogQHBhcmFtIG5vZGUgc3RhdGljIGRhdGEgb2YgdGhlIG5vZGUgdG8gbWF0Y2hcbiAqIEBwYXJhbSBzZWxlY3RvciBUaGUgc2VsZWN0b3IgdG8gdHJ5IG1hdGNoaW5nIGFnYWluc3QgdGhlIG5vZGUuXG4gKiBAcGFyYW0gaXNQcm9qZWN0aW9uTW9kZSBpZiBgdHJ1ZWAgd2UgYXJlIG1hdGNoaW5nIGZvciBjb250ZW50IHByb2plY3Rpb24sIG90aGVyd2lzZSB3ZSBhcmUgZG9pbmdcbiAqIGRpcmVjdGl2ZSBtYXRjaGluZy5cbiAqIEByZXR1cm5zIHRydWUgaWYgbm9kZSBtYXRjaGVzIHRoZSBzZWxlY3Rvci5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzTm9kZU1hdGNoaW5nU2VsZWN0b3IoXG4gICAgdE5vZGU6IFROb2RlLCBzZWxlY3RvcjogQ3NzU2VsZWN0b3IsIGlzUHJvamVjdGlvbk1vZGU6IGJvb2xlYW4pOiBib29sZWFuIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQoc2VsZWN0b3JbMF0sICdTZWxlY3RvciBzaG91bGQgaGF2ZSBhIHRhZyBuYW1lJyk7XG4gIGxldCBtb2RlOiBTZWxlY3RvckZsYWdzID0gU2VsZWN0b3JGbGFncy5FTEVNRU5UO1xuICBjb25zdCBub2RlQXR0cnMgPSB0Tm9kZS5hdHRycyB8fCBbXTtcblxuICAvLyBGaW5kIHRoZSBpbmRleCBvZiBmaXJzdCBhdHRyaWJ1dGUgdGhhdCBoYXMgbm8gdmFsdWUsIG9ubHkgYSBuYW1lLlxuICBjb25zdCBuYW1lT25seU1hcmtlcklkeCA9IGdldE5hbWVPbmx5TWFya2VySW5kZXgobm9kZUF0dHJzKTtcblxuICAvLyBXaGVuIHByb2Nlc3NpbmcgXCI6bm90XCIgc2VsZWN0b3JzLCB3ZSBza2lwIHRvIHRoZSBuZXh0IFwiOm5vdFwiIGlmIHRoZVxuICAvLyBjdXJyZW50IG9uZSBkb2Vzbid0IG1hdGNoXG4gIGxldCBza2lwVG9OZXh0U2VsZWN0b3IgPSBmYWxzZTtcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IHNlbGVjdG9yLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgY3VycmVudCA9IHNlbGVjdG9yW2ldO1xuICAgIGlmICh0eXBlb2YgY3VycmVudCA9PT0gJ251bWJlcicpIHtcbiAgICAgIC8vIElmIHdlIGZpbmlzaCBwcm9jZXNzaW5nIGEgOm5vdCBzZWxlY3RvciBhbmQgaXQgaGFzbid0IGZhaWxlZCwgcmV0dXJuIGZhbHNlXG4gICAgICBpZiAoIXNraXBUb05leHRTZWxlY3RvciAmJiAhaXNQb3NpdGl2ZShtb2RlKSAmJiAhaXNQb3NpdGl2ZShjdXJyZW50IGFzIG51bWJlcikpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgLy8gSWYgd2UgYXJlIHNraXBwaW5nIHRvIHRoZSBuZXh0IDpub3QoKSBhbmQgdGhpcyBtb2RlIGZsYWcgaXMgcG9zaXRpdmUsXG4gICAgICAvLyBpdCdzIGEgcGFydCBvZiB0aGUgY3VycmVudCA6bm90KCkgc2VsZWN0b3IsIGFuZCB3ZSBzaG91bGQga2VlcCBza2lwcGluZ1xuICAgICAgaWYgKHNraXBUb05leHRTZWxlY3RvciAmJiBpc1Bvc2l0aXZlKGN1cnJlbnQpKSBjb250aW51ZTtcbiAgICAgIHNraXBUb05leHRTZWxlY3RvciA9IGZhbHNlO1xuICAgICAgbW9kZSA9IChjdXJyZW50IGFzIG51bWJlcikgfCAobW9kZSAmIFNlbGVjdG9yRmxhZ3MuTk9UKTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmIChza2lwVG9OZXh0U2VsZWN0b3IpIGNvbnRpbnVlO1xuXG4gICAgaWYgKG1vZGUgJiBTZWxlY3RvckZsYWdzLkVMRU1FTlQpIHtcbiAgICAgIG1vZGUgPSBTZWxlY3RvckZsYWdzLkFUVFJJQlVURSB8IG1vZGUgJiBTZWxlY3RvckZsYWdzLk5PVDtcbiAgICAgIGlmIChjdXJyZW50ICE9PSAnJyAmJiAhaGFzVGFnQW5kVHlwZU1hdGNoKHROb2RlLCBjdXJyZW50LCBpc1Byb2plY3Rpb25Nb2RlKSB8fFxuICAgICAgICAgIGN1cnJlbnQgPT09ICcnICYmIHNlbGVjdG9yLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICBpZiAoaXNQb3NpdGl2ZShtb2RlKSkgcmV0dXJuIGZhbHNlO1xuICAgICAgICBza2lwVG9OZXh0U2VsZWN0b3IgPSB0cnVlO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBzZWxlY3RvckF0dHJWYWx1ZSA9IG1vZGUgJiBTZWxlY3RvckZsYWdzLkNMQVNTID8gY3VycmVudCA6IHNlbGVjdG9yWysraV07XG5cbiAgICAgIC8vIHNwZWNpYWwgY2FzZSBmb3IgbWF0Y2hpbmcgYWdhaW5zdCBjbGFzc2VzIHdoZW4gYSB0Tm9kZSBoYXMgYmVlbiBpbnN0YW50aWF0ZWQgd2l0aFxuICAgICAgLy8gY2xhc3MgYW5kIHN0eWxlIHZhbHVlcyBhcyBzZXBhcmF0ZSBhdHRyaWJ1dGUgdmFsdWVzIChlLmcuIFsndGl0bGUnLCBDTEFTUywgJ2ZvbyddKVxuICAgICAgaWYgKChtb2RlICYgU2VsZWN0b3JGbGFncy5DTEFTUykgJiYgdE5vZGUuY2xhc3Nlcykge1xuICAgICAgICBpZiAoIWlzQ3NzQ2xhc3NNYXRjaGluZyhcbiAgICAgICAgICAgICAgICBnZXRJbml0aWFsU3R5bGluZ1ZhbHVlKHROb2RlLmNsYXNzZXMpLCBzZWxlY3RvckF0dHJWYWx1ZSBhcyBzdHJpbmcpKSB7XG4gICAgICAgICAgaWYgKGlzUG9zaXRpdmUobW9kZSkpIHJldHVybiBmYWxzZTtcbiAgICAgICAgICBza2lwVG9OZXh0U2VsZWN0b3IgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBpc0lubGluZVRlbXBsYXRlID1cbiAgICAgICAgICB0Tm9kZS50eXBlID09IFROb2RlVHlwZS5Db250YWluZXIgJiYgdE5vZGUudGFnTmFtZSAhPT0gTkdfVEVNUExBVEVfU0VMRUNUT1I7XG4gICAgICBjb25zdCBhdHRyTmFtZSA9IChtb2RlICYgU2VsZWN0b3JGbGFncy5DTEFTUykgPyAnY2xhc3MnIDogY3VycmVudDtcbiAgICAgIGNvbnN0IGF0dHJJbmRleEluTm9kZSA9XG4gICAgICAgICAgZmluZEF0dHJJbmRleEluTm9kZShhdHRyTmFtZSwgbm9kZUF0dHJzLCBpc0lubGluZVRlbXBsYXRlLCBpc1Byb2plY3Rpb25Nb2RlKTtcblxuICAgICAgaWYgKGF0dHJJbmRleEluTm9kZSA9PT0gLTEpIHtcbiAgICAgICAgaWYgKGlzUG9zaXRpdmUobW9kZSkpIHJldHVybiBmYWxzZTtcbiAgICAgICAgc2tpcFRvTmV4dFNlbGVjdG9yID0gdHJ1ZTtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGlmIChzZWxlY3RvckF0dHJWYWx1ZSAhPT0gJycpIHtcbiAgICAgICAgbGV0IG5vZGVBdHRyVmFsdWU6IHN0cmluZztcbiAgICAgICAgaWYgKGF0dHJJbmRleEluTm9kZSA+IG5hbWVPbmx5TWFya2VySWR4KSB7XG4gICAgICAgICAgbm9kZUF0dHJWYWx1ZSA9ICcnO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG5nRGV2TW9kZSAmJiBhc3NlcnROb3RFcXVhbChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVBdHRyc1thdHRySW5kZXhJbk5vZGVdLCBBdHRyaWJ1dGVNYXJrZXIuTmFtZXNwYWNlVVJJLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgJ1dlIGRvIG5vdCBtYXRjaCBkaXJlY3RpdmVzIG9uIG5hbWVzcGFjZWQgYXR0cmlidXRlcycpO1xuICAgICAgICAgIC8vIHdlIGxvd2VyY2FzZSB0aGUgYXR0cmlidXRlIHZhbHVlIHRvIGJlIGFibGUgdG8gbWF0Y2hcbiAgICAgICAgICAvLyBzZWxlY3RvcnMgd2l0aG91dCBjYXNlLXNlbnNpdGl2aXR5XG4gICAgICAgICAgLy8gKHNlbGVjdG9ycyBhcmUgYWxyZWFkeSBpbiBsb3dlcmNhc2Ugd2hlbiBnZW5lcmF0ZWQpXG4gICAgICAgICAgbm9kZUF0dHJWYWx1ZSA9IChub2RlQXR0cnNbYXR0ckluZGV4SW5Ob2RlICsgMV0gYXMgc3RyaW5nKS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgY29tcGFyZUFnYWluc3RDbGFzc05hbWUgPSBtb2RlICYgU2VsZWN0b3JGbGFncy5DTEFTUyA/IG5vZGVBdHRyVmFsdWUgOiBudWxsO1xuICAgICAgICBpZiAoY29tcGFyZUFnYWluc3RDbGFzc05hbWUgJiZcbiAgICAgICAgICAgICAgICAhaXNDc3NDbGFzc01hdGNoaW5nKGNvbXBhcmVBZ2FpbnN0Q2xhc3NOYW1lLCBzZWxlY3RvckF0dHJWYWx1ZSBhcyBzdHJpbmcpIHx8XG4gICAgICAgICAgICBtb2RlICYgU2VsZWN0b3JGbGFncy5BVFRSSUJVVEUgJiYgc2VsZWN0b3JBdHRyVmFsdWUgIT09IG5vZGVBdHRyVmFsdWUpIHtcbiAgICAgICAgICBpZiAoaXNQb3NpdGl2ZShtb2RlKSkgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgIHNraXBUb05leHRTZWxlY3RvciA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gaXNQb3NpdGl2ZShtb2RlKSB8fCBza2lwVG9OZXh0U2VsZWN0b3I7XG59XG5cbmZ1bmN0aW9uIGlzUG9zaXRpdmUobW9kZTogU2VsZWN0b3JGbGFncyk6IGJvb2xlYW4ge1xuICByZXR1cm4gKG1vZGUgJiBTZWxlY3RvckZsYWdzLk5PVCkgPT09IDA7XG59XG5cbi8qKlxuICogRXhhbWluZXMgdGhlIGF0dHJpYnV0ZSdzIGRlZmluaXRpb24gYXJyYXkgZm9yIGEgbm9kZSB0byBmaW5kIHRoZSBpbmRleCBvZiB0aGVcbiAqIGF0dHJpYnV0ZSB0aGF0IG1hdGNoZXMgdGhlIGdpdmVuIGBuYW1lYC5cbiAqXG4gKiBOT1RFOiBUaGlzIHdpbGwgbm90IG1hdGNoIG5hbWVzcGFjZWQgYXR0cmlidXRlcy5cbiAqXG4gKiBBdHRyaWJ1dGUgbWF0Y2hpbmcgZGVwZW5kcyB1cG9uIGBpc0lubGluZVRlbXBsYXRlYCBhbmQgYGlzUHJvamVjdGlvbk1vZGVgLlxuICogVGhlIGZvbGxvd2luZyB0YWJsZSBzdW1tYXJpemVzIHdoaWNoIHR5cGVzIG9mIGF0dHJpYnV0ZXMgd2UgYXR0ZW1wdCB0byBtYXRjaDpcbiAqXG4gKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICogTW9kZXMgICAgICAgICAgICAgICAgICAgfCBOb3JtYWwgQXR0cmlidXRlcyB8IEJpbmRpbmdzIEF0dHJpYnV0ZXMgfCBUZW1wbGF0ZSBBdHRyaWJ1dGVzIHwgSTE4blxuICogQXR0cmlidXRlc1xuICogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAqIElubGluZSArIFByb2plY3Rpb24gICAgIHwgWUVTICAgICAgICAgICAgICAgfCBZRVMgICAgICAgICAgICAgICAgIHwgTk8gICAgICAgICAgICAgICAgICB8IFlFU1xuICogLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAqIElubGluZSArIERpcmVjdGl2ZSAgICAgIHwgTk8gICAgICAgICAgICAgICAgfCBOTyAgICAgICAgICAgICAgICAgIHwgWUVTICAgICAgICAgICAgICAgICB8IE5PXG4gKiAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICogTm9uLWlubGluZSArIFByb2plY3Rpb24gfCBZRVMgICAgICAgICAgICAgICB8IFlFUyAgICAgICAgICAgICAgICAgfCBOTyAgICAgICAgICAgICAgICAgIHwgWUVTXG4gKiAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICogTm9uLWlubGluZSArIERpcmVjdGl2ZSAgfCBZRVMgICAgICAgICAgICAgICB8IFlFUyAgICAgICAgICAgICAgICAgfCBOTyAgICAgICAgICAgICAgICAgIHwgWUVTXG4gKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICpcbiAqIEBwYXJhbSBuYW1lIHRoZSBuYW1lIG9mIHRoZSBhdHRyaWJ1dGUgdG8gZmluZFxuICogQHBhcmFtIGF0dHJzIHRoZSBhdHRyaWJ1dGUgYXJyYXkgdG8gZXhhbWluZVxuICogQHBhcmFtIGlzSW5saW5lVGVtcGxhdGUgdHJ1ZSBpZiB0aGUgbm9kZSBiZWluZyBtYXRjaGVkIGlzIGFuIGlubGluZSB0ZW1wbGF0ZSAoZS5nLiBgKm5nRm9yYClcbiAqIHJhdGhlciB0aGFuIGEgbWFudWFsbHkgZXhwYW5kZWQgdGVtcGxhdGUgbm9kZSAoZS5nIGA8bmctdGVtcGxhdGU+YCkuXG4gKiBAcGFyYW0gaXNQcm9qZWN0aW9uTW9kZSB0cnVlIGlmIHdlIGFyZSBtYXRjaGluZyBhZ2FpbnN0IGNvbnRlbnQgcHJvamVjdGlvbiBvdGhlcndpc2Ugd2UgYXJlXG4gKiBtYXRjaGluZyBhZ2FpbnN0IGRpcmVjdGl2ZXMuXG4gKi9cbmZ1bmN0aW9uIGZpbmRBdHRySW5kZXhJbk5vZGUoXG4gICAgbmFtZTogc3RyaW5nLCBhdHRyczogVEF0dHJpYnV0ZXMgfCBudWxsLCBpc0lubGluZVRlbXBsYXRlOiBib29sZWFuLFxuICAgIGlzUHJvamVjdGlvbk1vZGU6IGJvb2xlYW4pOiBudW1iZXIge1xuICBpZiAoYXR0cnMgPT09IG51bGwpIHJldHVybiAtMTtcblxuICBsZXQgaSA9IDA7XG5cbiAgaWYgKGlzUHJvamVjdGlvbk1vZGUgfHwgIWlzSW5saW5lVGVtcGxhdGUpIHtcbiAgICBsZXQgYmluZGluZ3NNb2RlID0gZmFsc2U7XG4gICAgd2hpbGUgKGkgPCBhdHRycy5sZW5ndGgpIHtcbiAgICAgIGNvbnN0IG1heWJlQXR0ck5hbWUgPSBhdHRyc1tpXTtcbiAgICAgIGlmIChtYXliZUF0dHJOYW1lID09PSBuYW1lKSB7XG4gICAgICAgIHJldHVybiBpO1xuICAgICAgfSBlbHNlIGlmIChcbiAgICAgICAgICBtYXliZUF0dHJOYW1lID09PSBBdHRyaWJ1dGVNYXJrZXIuQmluZGluZ3MgfHwgbWF5YmVBdHRyTmFtZSA9PT0gQXR0cmlidXRlTWFya2VyLkkxOG4pIHtcbiAgICAgICAgYmluZGluZ3NNb2RlID0gdHJ1ZTtcbiAgICAgIH0gZWxzZSBpZiAoXG4gICAgICAgICAgbWF5YmVBdHRyTmFtZSA9PT0gQXR0cmlidXRlTWFya2VyLkNsYXNzZXMgfHwgbWF5YmVBdHRyTmFtZSA9PT0gQXR0cmlidXRlTWFya2VyLlN0eWxlcykge1xuICAgICAgICBsZXQgdmFsdWUgPSBhdHRyc1srK2ldO1xuICAgICAgICAvLyBXZSBzaG91bGQgc2tpcCBjbGFzc2VzIGhlcmUgYmVjYXVzZSB3ZSBoYXZlIGEgc2VwYXJhdGUgbWVjaGFuaXNtIGZvclxuICAgICAgICAvLyBtYXRjaGluZyBjbGFzc2VzIGluIHByb2plY3Rpb24gbW9kZS5cbiAgICAgICAgd2hpbGUgKHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICB2YWx1ZSA9IGF0dHJzWysraV07XG4gICAgICAgIH1cbiAgICAgICAgY29udGludWU7XG4gICAgICB9IGVsc2UgaWYgKG1heWJlQXR0ck5hbWUgPT09IEF0dHJpYnV0ZU1hcmtlci5UZW1wbGF0ZSkge1xuICAgICAgICAvLyBXZSBkbyBub3QgY2FyZSBhYm91dCBUZW1wbGF0ZSBhdHRyaWJ1dGVzIGluIHRoaXMgc2NlbmFyaW8uXG4gICAgICAgIGJyZWFrO1xuICAgICAgfSBlbHNlIGlmIChtYXliZUF0dHJOYW1lID09PSBBdHRyaWJ1dGVNYXJrZXIuTmFtZXNwYWNlVVJJKSB7XG4gICAgICAgIC8vIFNraXAgdGhlIHdob2xlIG5hbWVzcGFjZWQgYXR0cmlidXRlIGFuZCB2YWx1ZS4gVGhpcyBpcyBieSBkZXNpZ24uXG4gICAgICAgIGkgKz0gNDtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICAvLyBJbiBiaW5kaW5nIG1vZGUgdGhlcmUgYXJlIG9ubHkgbmFtZXMsIHJhdGhlciB0aGFuIG5hbWUtdmFsdWUgcGFpcnMuXG4gICAgICBpICs9IGJpbmRpbmdzTW9kZSA/IDEgOiAyO1xuICAgIH1cbiAgICAvLyBXZSBkaWQgbm90IG1hdGNoIHRoZSBhdHRyaWJ1dGVcbiAgICByZXR1cm4gLTE7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIG1hdGNoVGVtcGxhdGVBdHRyaWJ1dGUoYXR0cnMsIG5hbWUpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc05vZGVNYXRjaGluZ1NlbGVjdG9yTGlzdChcbiAgICB0Tm9kZTogVE5vZGUsIHNlbGVjdG9yOiBDc3NTZWxlY3Rvckxpc3QsIGlzUHJvamVjdGlvbk1vZGU6IGJvb2xlYW4gPSBmYWxzZSk6IGJvb2xlYW4ge1xuICBmb3IgKGxldCBpID0gMDsgaSA8IHNlbGVjdG9yLmxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKGlzTm9kZU1hdGNoaW5nU2VsZWN0b3IodE5vZGUsIHNlbGVjdG9yW2ldLCBpc1Byb2plY3Rpb25Nb2RlKSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0UHJvamVjdEFzQXR0clZhbHVlKHROb2RlOiBUTm9kZSk6IENzc1NlbGVjdG9yfG51bGwge1xuICBjb25zdCBub2RlQXR0cnMgPSB0Tm9kZS5hdHRycztcbiAgaWYgKG5vZGVBdHRycyAhPSBudWxsKSB7XG4gICAgY29uc3QgbmdQcm9qZWN0QXNBdHRySWR4ID0gbm9kZUF0dHJzLmluZGV4T2YoQXR0cmlidXRlTWFya2VyLlByb2plY3RBcyk7XG4gICAgLy8gb25seSBjaGVjayBmb3IgbmdQcm9qZWN0QXMgaW4gYXR0cmlidXRlIG5hbWVzLCBkb24ndCBhY2NpZGVudGFsbHkgbWF0Y2ggYXR0cmlidXRlJ3MgdmFsdWVcbiAgICAvLyAoYXR0cmlidXRlIG5hbWVzIGFyZSBzdG9yZWQgYXQgZXZlbiBpbmRleGVzKVxuICAgIGlmICgobmdQcm9qZWN0QXNBdHRySWR4ICYgMSkgPT09IDApIHtcbiAgICAgIHJldHVybiBub2RlQXR0cnNbbmdQcm9qZWN0QXNBdHRySWR4ICsgMV0gYXMgQ3NzU2VsZWN0b3I7XG4gICAgfVxuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG5mdW5jdGlvbiBnZXROYW1lT25seU1hcmtlckluZGV4KG5vZGVBdHRyczogVEF0dHJpYnV0ZXMpIHtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBub2RlQXR0cnMubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBub2RlQXR0ciA9IG5vZGVBdHRyc1tpXTtcbiAgICBpZiAoaXNOYW1lT25seUF0dHJpYnV0ZU1hcmtlcihub2RlQXR0cikpIHtcbiAgICAgIHJldHVybiBpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gbm9kZUF0dHJzLmxlbmd0aDtcbn1cblxuZnVuY3Rpb24gbWF0Y2hUZW1wbGF0ZUF0dHJpYnV0ZShhdHRyczogVEF0dHJpYnV0ZXMsIG5hbWU6IHN0cmluZyk6IG51bWJlciB7XG4gIGxldCBpID0gYXR0cnMuaW5kZXhPZihBdHRyaWJ1dGVNYXJrZXIuVGVtcGxhdGUpO1xuICBpZiAoaSA+IC0xKSB7XG4gICAgaSsrO1xuICAgIHdoaWxlIChpIDwgYXR0cnMubGVuZ3RoKSB7XG4gICAgICBpZiAoYXR0cnNbaV0gPT09IG5hbWUpIHJldHVybiBpO1xuICAgICAgaSsrO1xuICAgIH1cbiAgfVxuICByZXR1cm4gLTE7XG59XG5cbi8qKlxuICogQ2hlY2tzIHdoZXRoZXIgYSBzZWxlY3RvciBpcyBpbnNpZGUgYSBDc3NTZWxlY3Rvckxpc3RcbiAqIEBwYXJhbSBzZWxlY3RvciBTZWxlY3RvciB0byBiZSBjaGVja2VkLlxuICogQHBhcmFtIGxpc3QgTGlzdCBpbiB3aGljaCB0byBsb29rIGZvciB0aGUgc2VsZWN0b3IuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc1NlbGVjdG9ySW5TZWxlY3Rvckxpc3Qoc2VsZWN0b3I6IENzc1NlbGVjdG9yLCBsaXN0OiBDc3NTZWxlY3Rvckxpc3QpOiBib29sZWFuIHtcbiAgc2VsZWN0b3JMaXN0TG9vcDogZm9yIChsZXQgaSA9IDA7IGkgPCBsaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgY3VycmVudFNlbGVjdG9ySW5MaXN0ID0gbGlzdFtpXTtcbiAgICBpZiAoc2VsZWN0b3IubGVuZ3RoICE9PSBjdXJyZW50U2VsZWN0b3JJbkxpc3QubGVuZ3RoKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgZm9yIChsZXQgaiA9IDA7IGogPCBzZWxlY3Rvci5sZW5ndGg7IGorKykge1xuICAgICAgaWYgKHNlbGVjdG9yW2pdICE9PSBjdXJyZW50U2VsZWN0b3JJbkxpc3Rbal0pIHtcbiAgICAgICAgY29udGludWUgc2VsZWN0b3JMaXN0TG9vcDtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuIl19