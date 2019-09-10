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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9kZV9zZWxlY3Rvcl9tYXRjaGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9ub2RlX3NlbGVjdG9yX21hdGNoZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFRQSxPQUFPLHFCQUFxQixDQUFDO0FBRTdCLE9BQU8sRUFBQyxhQUFhLEVBQUUsY0FBYyxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFFN0QsT0FBTyxFQUFpRCw2QkFBNkIsSUFBSSxPQUFPLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUMzSCxPQUFPLEVBQThDLDZCQUE2QixJQUFJLE9BQU8sRUFBQyxNQUFNLHlCQUF5QixDQUFDO0FBQzlILE9BQU8sRUFBQyxzQkFBc0IsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBQzNELE9BQU8sRUFBQyx5QkFBeUIsRUFBQyxNQUFNLG9CQUFvQixDQUFDOztNQUV2RCx1QkFBdUIsR0FBRyxPQUFPLEdBQUcsT0FBTzs7TUFFM0Msb0JBQW9CLEdBQUcsYUFBYTs7Ozs7O0FBRTFDLFNBQVMsa0JBQWtCLENBQUMsZ0JBQXdCLEVBQUUsZUFBdUI7O1VBQ3JFLGNBQWMsR0FBRyxnQkFBZ0IsQ0FBQyxNQUFNOztVQUN4QyxVQUFVLEdBQUcsbUJBQUEsZ0JBQWdCLEVBQUUsQ0FBQyxPQUFPLENBQUMsZUFBZSxDQUFDOztVQUN4RCxXQUFXLEdBQUcsVUFBVSxHQUFHLGVBQWUsQ0FBQyxNQUFNO0lBQ3ZELElBQUksVUFBVSxLQUFLLENBQUMsQ0FBQyxDQUFrRCxXQUFXO1dBQzNFLENBQUMsVUFBVSxHQUFHLENBQUMsSUFBSSxtQkFBQSxnQkFBZ0IsRUFBRSxDQUFDLFVBQVUsR0FBRyxDQUFDLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBRSxrQkFBa0I7O1lBRXJGLENBQUMsV0FBVyxHQUFHLGNBQWMsSUFBSSxtQkFBQSxnQkFBZ0IsRUFBRSxDQUFDLFdB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QUFDLEVBQUU7Z0JBQzVDLFNBQVMsZ0JBQWdCLENBQUM7YUFDM0I7U0FDRjtRQUNELE9BQU8sSUFBSSxDQUFDO0tBQ2I7SUFDRCxPQUFPLEtBQUssQ0FBQztBQUNmLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCAnLi4vdXRpbC9uZ19kZXZfbW9kZSc7XG5cbmltcG9ydCB7YXNzZXJ0RGVmaW5lZCwgYXNzZXJ0Tm90RXF1YWx9IGZyb20gJy4uL3V0aWwvYXNzZXJ0JztcblxuaW1wb3J0IHtBdHRyaWJ1dGVNYXJrZXIsIFRBdHRyaWJ1dGVzLCBUTm9kZSwgVE5vZGVUeXBlLCB1bnVzZWRWYWx1ZUV4cG9ydFRvUGxhY2F0ZUFqZCBhcyB1bnVzZWQxfSBmcm9tICcuL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge0Nzc1NlbGVjdG9yLCBDc3NTZWxlY3Rvckxpc3QsIFNlbGVjdG9yRmxhZ3MsIHVudXNlZFZhbHVlRXhwb3J0VG9QbGFjYXRlQWpkIGFzIHVudXNlZDJ9IGZyb20gJy4vaW50ZXJmYWNlcy9wcm9qZWN0aW9uJztcbmltcG9ydCB7Z2V0SW5pdGlhbFN0eWxpbmdWYWx1ZX0gZnJvbSAnLi9zdHlsaW5nX25leHQvdXRpbCc7XG5pbXBvcnQge2lzTmFtZU9ubHlBdHRyaWJ1dGVNYXJrZXJ9IGZyb20gJy4vdXRpbC9hdHRyc191dGlscyc7XG5cbmNvbnN0IHVudXNlZFZhbHVlVG9QbGFjYXRlQWpkID0gdW51c2VkMSArIHVudXNlZDI7XG5cbmNvbnN0IE5HX1RFTVBMQVRFX1NFTEVDVE9SID0gJ25nLXRlbXBsYXRlJztcblxuZnVuY3Rpb24gaXNDc3NDbGFzc01hdGNoaW5nKG5vZGVDbGFzc0F0dHJWYWw6IHN0cmluZywgY3NzQ2xhc3NUb01hdGNoOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgY29uc3Qgbm9kZUNsYXNzZXNMZW4gPSBub2RlQ2xhc3NBdHRyVmFsLmxlbmd0aDtcbiAgY29uc3QgbWF0Y2hJbmRleCA9IG5vZGVDbGFzc0F0dHJWYWwgIS5pbmRleE9mKGNzc0NsYXNzVG9NYXRjaCk7XG4gIGNvbnN0IG1hdGNoRW5kSWR4ID0gbWF0Y2hJbmRleCArIGNzc0NsYXNzVG9NYXRjaC5sZW5ndGg7XG4gIGlmIChtYXRjaEluZGV4ID09PSAtMSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gbm8gbWF0Y2hcbiAgICAgIHx8IChtYXRjaEluZGV4ID4gMCAmJiBub2RlQ2xhc3NBdHRyVmFsICFbbWF0Y2hJbmRleCAtIDFdICE9PSAnICcpICAvLyBubyBzcGFjZSBiZWZvcmVcbiAgICAgIHx8XG4gICAgICAobWF0Y2hFbmRJZHggPCBub2RlQ2xhc3Nlc0xlbiAmJiBub2RlQ2xhc3NBdHRyVmFsICFbbWF0Y2hFbmRJZHhdICE9PSAnICcpKSAgLy8gbm8gc3BhY2UgYWZ0ZXJcbiAge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICByZXR1cm4gdHJ1ZTtcbn1cblxuLyoqXG4gKiBGdW5jdGlvbiB0aGF0IGNoZWNrcyB3aGV0aGVyIGEgZ2l2ZW4gdE5vZGUgbWF0Y2hlcyB0YWctYmFzZWQgc2VsZWN0b3IgYW5kIGhhcyBhIHZhbGlkIHR5cGUuXG4gKlxuICogTWF0Y2hpbmcgY2FuIGJlIHBlcmZvcm1lZCBpbiAyIG1vZGVzOiBwcm9qZWN0aW9uIG1vZGUgKHdoZW4gd2UgcHJvamVjdCBub2RlcykgYW5kIHJlZ3VsYXJcbiAqIGRpcmVjdGl2ZSBtYXRjaGluZyBtb2RlOlxuICogLSBpbiB0aGUgXCJkaXJlY3RpdmUgbWF0Y2hpbmdcIiBtb2RlIHdlIGRvIF9ub3RfIHRha2UgVENvbnRhaW5lcidzIHRhZ05hbWUgaW50byBhY2NvdW50IGlmIGl0IGlzXG4gKiBkaWZmZXJlbnQgZnJvbSBOR19URU1QTEFURV9TRUxFQ1RPUiAodmFsdWUgZGlmZmVyZW50IGZyb20gTkdfVEVNUExBVEVfU0VMRUNUT1IgaW5kaWNhdGVzIHRoYXQgYVxuICogdGFnIG5hbWUgd2FzIGV4dHJhY3RlZCBmcm9tICogc3ludGF4IHNvIHdlIHdvdWxkIG1hdGNoIHRoZSBzYW1lIGRpcmVjdGl2ZSB0d2ljZSk7XG4gKiAtIGluIHRoZSBcInByb2plY3Rpb25cIiBtb2RlLCB3ZSB1c2UgYSB0YWcgbmFtZSBwb3RlbnRpYWxseSBleHRyYWN0ZWQgZnJvbSB0aGUgKiBzeW50YXggcHJvY2Vzc2luZ1xuICogKGFwcGxpY2FibGUgdG8gVE5vZGVUeXBlLkNvbnRhaW5lciBvbmx5KS5cbiAqL1xuZnVuY3Rpb24gaGFzVGFnQW5kVHlwZU1hdGNoKFxuICAgIHROb2RlOiBUTm9kZSwgY3VycmVudFNlbGVjdG9yOiBzdHJpbmcsIGlzUHJvamVjdGlvbk1vZGU6IGJvb2xlYW4pOiBib29sZWFuIHtcbiAgY29uc3QgdGFnTmFtZVRvQ29tcGFyZSA9IHROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5Db250YWluZXIgJiYgIWlzUHJvamVjdGlvbk1vZGUgP1xuICAgICAgTkdfVEVNUExBVEVfU0VMRUNUT1IgOlxuICAgICAgdE5vZGUudGFnTmFtZTtcbiAgcmV0dXJuIGN1cnJlbnRTZWxlY3RvciA9PT0gdGFnTmFtZVRvQ29tcGFyZTtcbn1cblxuLyoqXG4gKiBBIHV0aWxpdHkgZnVuY3Rpb24gdG8gbWF0Y2ggYW4gSXZ5IG5vZGUgc3RhdGljIGRhdGEgYWdhaW5zdCBhIHNpbXBsZSBDU1Mgc2VsZWN0b3JcbiAqXG4gKiBAcGFyYW0gbm9kZSBzdGF0aWMgZGF0YSBvZiB0aGUgbm9kZSB0byBtYXRjaFxuICogQHBhcmFtIHNlbGVjdG9yIFRoZSBzZWxlY3RvciB0byB0cnkgbWF0Y2hpbmcgYWdhaW5zdCB0aGUgbm9kZS5cbiAqIEBwYXJhbSBpc1Byb2plY3Rpb25Nb2RlIGlmIGB0cnVlYCB3ZSBhcmUgbWF0Y2hpbmcgZm9yIGNvbnRlbnQgcHJvamVjdGlvbiwgb3RoZXJ3aXNlIHdlIGFyZSBkb2luZ1xuICogZGlyZWN0aXZlIG1hdGNoaW5nLlxuICogQHJldHVybnMgdHJ1ZSBpZiBub2RlIG1hdGNoZXMgdGhlIHNlbGVjdG9yLlxuICovXG5leHBvcnQgZnVuY3Rpb24gaXNOb2RlTWF0Y2hpbmdTZWxlY3RvcihcbiAgICB0Tm9kZTogVE5vZGUsIHNlbGVjdG9yOiBDc3NTZWxlY3RvciwgaXNQcm9qZWN0aW9uTW9kZTogYm9vbGVhbik6IGJvb2xlYW4ge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChzZWxlY3RvclswXSwgJ1NlbGVjdG9yIHNob3VsZCBoYXZlIGEgdGFnIG5hbWUnKTtcbiAgbGV0IG1vZGU6IFNlbGVjdG9yRmxhZ3MgPSBTZWxlY3RvckZsYWdzLkVMRU1FTlQ7XG4gIGNvbnN0IG5vZGVBdHRycyA9IHROb2RlLmF0dHJzIHx8IFtdO1xuXG4gIC8vIEZpbmQgdGhlIGluZGV4IG9mIGZpcnN0IGF0dHJpYnV0ZSB0aGF0IGhhcyBubyB2YWx1ZSwgb25seSBhIG5hbWUuXG4gIGNvbnN0IG5hbWVPbmx5TWFya2VySWR4ID0gZ2V0TmFtZU9ubHlNYXJrZXJJbmRleChub2RlQXR0cnMpO1xuXG4gIC8vIFdoZW4gcHJvY2Vzc2luZyBcIjpub3RcIiBzZWxlY3RvcnMsIHdlIHNraXAgdG8gdGhlIG5leHQgXCI6bm90XCIgaWYgdGhlXG4gIC8vIGN1cnJlbnQgb25lIGRvZXNuJ3QgbWF0Y2hcbiAgbGV0IHNraXBUb05leHRTZWxlY3RvciA9IGZhbHNlO1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgc2VsZWN0b3IubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBjdXJyZW50ID0gc2VsZWN0b3JbaV07XG4gICAgaWYgKHR5cGVvZiBjdXJyZW50ID09PSAnbnVtYmVyJykge1xuICAgICAgLy8gSWYgd2UgZmluaXNoIHByb2Nlc3NpbmcgYSA6bm90IHNlbGVjdG9yIGFuZCBpdCBoYXNuJ3QgZmFpbGVkLCByZXR1cm4gZmFsc2VcbiAgICAgIGlmICghc2tpcFRvTmV4dFNlbGVjdG9yICYmICFpc1Bvc2l0aXZlKG1vZGUpICYmICFpc1Bvc2l0aXZlKGN1cnJlbnQgYXMgbnVtYmVyKSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICAvLyBJZiB3ZSBhcmUgc2tpcHBpbmcgdG8gdGhlIG5leHQgOm5vdCgpIGFuZCB0aGlzIG1vZGUgZmxhZyBpcyBwb3NpdGl2ZSxcbiAgICAgIC8vIGl0J3MgYSBwYXJ0IG9mIHRoZSBjdXJyZW50IDpub3QoKSBzZWxlY3RvciwgYW5kIHdlIHNob3VsZCBrZWVwIHNraXBwaW5nXG4gICAgICBpZiAoc2tpcFRvTmV4dFNlbGVjdG9yICYmIGlzUG9zaXRpdmUoY3VycmVudCkpIGNvbnRpbnVlO1xuICAgICAgc2tpcFRvTmV4dFNlbGVjdG9yID0gZmFsc2U7XG4gICAgICBtb2RlID0gKGN1cnJlbnQgYXMgbnVtYmVyKSB8IChtb2RlICYgU2VsZWN0b3JGbGFncy5OT1QpO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKHNraXBUb05leHRTZWxlY3RvcikgY29udGludWU7XG5cbiAgICBpZiAobW9kZSAmIFNlbGVjdG9yRmxhZ3MuRUxFTUVOVCkge1xuICAgICAgbW9kZSA9IFNlbGVjdG9yRmxhZ3MuQVRUUklCVVRFIHwgbW9kZSAmIFNlbGVjdG9yRmxhZ3MuTk9UO1xuICAgICAgaWYgKGN1cnJlbnQgIT09ICcnICYmICFoYXNUYWdBbmRUeXBlTWF0Y2godE5vZGUsIGN1cnJlbnQsIGlzUHJvamVjdGlvbk1vZGUpIHx8XG4gICAgICAgICAgY3VycmVudCA9PT0gJycgJiYgc2VsZWN0b3IubGVuZ3RoID09PSAxKSB7XG4gICAgICAgIGlmIChpc1Bvc2l0aXZlKG1vZGUpKSByZXR1cm4gZmFsc2U7XG4gICAgICAgIHNraXBUb05leHRTZWxlY3RvciA9IHRydWU7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IHNlbGVjdG9yQXR0clZhbHVlID0gbW9kZSAmIFNlbGVjdG9yRmxhZ3MuQ0xBU1MgPyBjdXJyZW50IDogc2VsZWN0b3JbKytpXTtcblxuICAgICAgLy8gc3BlY2lhbCBjYXNlIGZvciBtYXRjaGluZyBhZ2FpbnN0IGNsYXNzZXMgd2hlbiBhIHROb2RlIGhhcyBiZWVuIGluc3RhbnRpYXRlZCB3aXRoXG4gICAgICAvLyBjbGFzcyBhbmQgc3R5bGUgdmFsdWVzIGFzIHNlcGFyYXRlIGF0dHJpYnV0ZSB2YWx1ZXMgKGUuZy4gWyd0aXRsZScsIENMQVNTLCAnZm9vJ10pXG4gICAgICBpZiAoKG1vZGUgJiBTZWxlY3RvckZsYWdzLkNMQVNTKSAmJiB0Tm9kZS5jbGFzc2VzKSB7XG4gICAgICAgIGlmICghaXNDc3NDbGFzc01hdGNoaW5nKFxuICAgICAgICAgICAgICAgIGdldEluaXRpYWxTdHlsaW5nVmFsdWUodE5vZGUuY2xhc3NlcyksIHNlbGVjdG9yQXR0clZhbHVlIGFzIHN0cmluZykpIHtcbiAgICAgICAgICBpZiAoaXNQb3NpdGl2ZShtb2RlKSkgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgIHNraXBUb05leHRTZWxlY3RvciA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGlzSW5saW5lVGVtcGxhdGUgPVxuICAgICAgICAgIHROb2RlLnR5cGUgPT0gVE5vZGVUeXBlLkNvbnRhaW5lciAmJiB0Tm9kZS50YWdOYW1lICE9PSBOR19URU1QTEFURV9TRUxFQ1RPUjtcbiAgICAgIGNvbnN0IGF0dHJOYW1lID0gKG1vZGUgJiBTZWxlY3RvckZsYWdzLkNMQVNTKSA/ICdjbGFzcycgOiBjdXJyZW50O1xuICAgICAgY29uc3QgYXR0ckluZGV4SW5Ob2RlID1cbiAgICAgICAgICBmaW5kQXR0ckluZGV4SW5Ob2RlKGF0dHJOYW1lLCBub2RlQXR0cnMsIGlzSW5saW5lVGVtcGxhdGUsIGlzUHJvamVjdGlvbk1vZGUpO1xuXG4gICAgICBpZiAoYXR0ckluZGV4SW5Ob2RlID09PSAtMSkge1xuICAgICAgICBpZiAoaXNQb3NpdGl2ZShtb2RlKSkgcmV0dXJuIGZhbHNlO1xuICAgICAgICBza2lwVG9OZXh0U2VsZWN0b3IgPSB0cnVlO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgaWYgKHNlbGVjdG9yQXR0clZhbHVlICE9PSAnJykge1xuICAgICAgICBsZXQgbm9kZUF0dHJWYWx1ZTogc3RyaW5nO1xuICAgICAgICBpZiAoYXR0ckluZGV4SW5Ob2RlID4gbmFtZU9ubHlNYXJrZXJJZHgpIHtcbiAgICAgICAgICBub2RlQXR0clZhbHVlID0gJyc7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbmdEZXZNb2RlICYmIGFzc2VydE5vdEVxdWFsKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZUF0dHJzW2F0dHJJbmRleEluTm9kZV0sIEF0dHJpYnV0ZU1hcmtlci5OYW1lc3BhY2VVUkksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAnV2UgZG8gbm90IG1hdGNoIGRpcmVjdGl2ZXMgb24gbmFtZXNwYWNlZCBhdHRyaWJ1dGVzJyk7XG4gICAgICAgICAgbm9kZUF0dHJWYWx1ZSA9IG5vZGVBdHRyc1thdHRySW5kZXhJbk5vZGUgKyAxXSBhcyBzdHJpbmc7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBjb21wYXJlQWdhaW5zdENsYXNzTmFtZSA9IG1vZGUgJiBTZWxlY3RvckZsYWdzLkNMQVNTID8gbm9kZUF0dHJWYWx1ZSA6IG51bGw7XG4gICAgICAgIGlmIChjb21wYXJlQWdhaW5zdENsYXNzTmFtZSAmJlxuICAgICAgICAgICAgICAgICFpc0Nzc0NsYXNzTWF0Y2hpbmcoY29tcGFyZUFnYWluc3RDbGFzc05hbWUsIHNlbGVjdG9yQXR0clZhbHVlIGFzIHN0cmluZykgfHxcbiAgICAgICAgICAgIG1vZGUgJiBTZWxlY3RvckZsYWdzLkFUVFJJQlVURSAmJiBzZWxlY3RvckF0dHJWYWx1ZSAhPT0gbm9kZUF0dHJWYWx1ZSkge1xuICAgICAgICAgIGlmIChpc1Bvc2l0aXZlKG1vZGUpKSByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgc2tpcFRvTmV4dFNlbGVjdG9yID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBpc1Bvc2l0aXZlKG1vZGUpIHx8IHNraXBUb05leHRTZWxlY3Rvcjtcbn1cblxuZnVuY3Rpb24gaXNQb3NpdGl2ZShtb2RlOiBTZWxlY3RvckZsYWdzKTogYm9vbGVhbiB7XG4gIHJldHVybiAobW9kZSAmIFNlbGVjdG9yRmxhZ3MuTk9UKSA9PT0gMDtcbn1cblxuLyoqXG4gKiBFeGFtaW5lcyB0aGUgYXR0cmlidXRlJ3MgZGVmaW5pdGlvbiBhcnJheSBmb3IgYSBub2RlIHRvIGZpbmQgdGhlIGluZGV4IG9mIHRoZVxuICogYXR0cmlidXRlIHRoYXQgbWF0Y2hlcyB0aGUgZ2l2ZW4gYG5hbWVgLlxuICpcbiAqIE5PVEU6IFRoaXMgd2lsbCBub3QgbWF0Y2ggbmFtZXNwYWNlZCBhdHRyaWJ1dGVzLlxuICpcbiAqIEF0dHJpYnV0ZSBtYXRjaGluZyBkZXBlbmRzIHVwb24gYGlzSW5saW5lVGVtcGxhdGVgIGFuZCBgaXNQcm9qZWN0aW9uTW9kZWAuXG4gKiBUaGUgZm9sbG93aW5nIHRhYmxlIHN1bW1hcml6ZXMgd2hpY2ggdHlwZXMgb2YgYXR0cmlidXRlcyB3ZSBhdHRlbXB0IHRvIG1hdGNoOlxuICpcbiAqID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gKiBNb2RlcyAgICAgICAgICAgICAgICAgICB8IE5vcm1hbCBBdHRyaWJ1dGVzIHwgQmluZGluZ3MgQXR0cmlidXRlcyB8IFRlbXBsYXRlIEF0dHJpYnV0ZXMgfCBJMThuXG4gKiBBdHRyaWJ1dGVzXG4gKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICogSW5saW5lICsgUHJvamVjdGlvbiAgICAgfCBZRVMgICAgICAgICAgICAgICB8IFlFUyAgICAgICAgICAgICAgICAgfCBOTyAgICAgICAgICAgICAgICAgIHwgWUVTXG4gKiAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICogSW5saW5lICsgRGlyZWN0aXZlICAgICAgfCBOTyAgICAgICAgICAgICAgICB8IE5PICAgICAgICAgICAgICAgICAgfCBZRVMgICAgICAgICAgICAgICAgIHwgTk9cbiAqIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gKiBOb24taW5saW5lICsgUHJvamVjdGlvbiB8IFlFUyAgICAgICAgICAgICAgIHwgWUVTICAgICAgICAgICAgICAgICB8IE5PICAgICAgICAgICAgICAgICAgfCBZRVNcbiAqIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gKiBOb24taW5saW5lICsgRGlyZWN0aXZlICB8IFlFUyAgICAgICAgICAgICAgIHwgWUVTICAgICAgICAgICAgICAgICB8IE5PICAgICAgICAgICAgICAgICAgfCBZRVNcbiAqID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gKlxuICogQHBhcmFtIG5hbWUgdGhlIG5hbWUgb2YgdGhlIGF0dHJpYnV0ZSB0byBmaW5kXG4gKiBAcGFyYW0gYXR0cnMgdGhlIGF0dHJpYnV0ZSBhcnJheSB0byBleGFtaW5lXG4gKiBAcGFyYW0gaXNJbmxpbmVUZW1wbGF0ZSB0cnVlIGlmIHRoZSBub2RlIGJlaW5nIG1hdGNoZWQgaXMgYW4gaW5saW5lIHRlbXBsYXRlIChlLmcuIGAqbmdGb3JgKVxuICogcmF0aGVyIHRoYW4gYSBtYW51YWxseSBleHBhbmRlZCB0ZW1wbGF0ZSBub2RlIChlLmcgYDxuZy10ZW1wbGF0ZT5gKS5cbiAqIEBwYXJhbSBpc1Byb2plY3Rpb25Nb2RlIHRydWUgaWYgd2UgYXJlIG1hdGNoaW5nIGFnYWluc3QgY29udGVudCBwcm9qZWN0aW9uIG90aGVyd2lzZSB3ZSBhcmVcbiAqIG1hdGNoaW5nIGFnYWluc3QgZGlyZWN0aXZlcy5cbiAqL1xuZnVuY3Rpb24gZmluZEF0dHJJbmRleEluTm9kZShcbiAgICBuYW1lOiBzdHJpbmcsIGF0dHJzOiBUQXR0cmlidXRlcyB8IG51bGwsIGlzSW5saW5lVGVtcGxhdGU6IGJvb2xlYW4sXG4gICAgaXNQcm9qZWN0aW9uTW9kZTogYm9vbGVhbik6IG51bWJlciB7XG4gIGlmIChhdHRycyA9PT0gbnVsbCkgcmV0dXJuIC0xO1xuXG4gIGxldCBpID0gMDtcblxuICBpZiAoaXNQcm9qZWN0aW9uTW9kZSB8fCAhaXNJbmxpbmVUZW1wbGF0ZSkge1xuICAgIGxldCBiaW5kaW5nc01vZGUgPSBmYWxzZTtcbiAgICB3aGlsZSAoaSA8IGF0dHJzLmxlbmd0aCkge1xuICAgICAgY29uc3QgbWF5YmVBdHRyTmFtZSA9IGF0dHJzW2ldO1xuICAgICAgaWYgKG1heWJlQXR0ck5hbWUgPT09IG5hbWUpIHtcbiAgICAgICAgcmV0dXJuIGk7XG4gICAgICB9IGVsc2UgaWYgKFxuICAgICAgICAgIG1heWJlQXR0ck5hbWUgPT09IEF0dHJpYnV0ZU1hcmtlci5CaW5kaW5ncyB8fCBtYXliZUF0dHJOYW1lID09PSBBdHRyaWJ1dGVNYXJrZXIuSTE4bikge1xuICAgICAgICBiaW5kaW5nc01vZGUgPSB0cnVlO1xuICAgICAgfSBlbHNlIGlmIChcbiAgICAgICAgICBtYXliZUF0dHJOYW1lID09PSBBdHRyaWJ1dGVNYXJrZXIuQ2xhc3NlcyB8fCBtYXliZUF0dHJOYW1lID09PSBBdHRyaWJ1dGVNYXJrZXIuU3R5bGVzKSB7XG4gICAgICAgIGxldCB2YWx1ZSA9IGF0dHJzWysraV07XG4gICAgICAgIC8vIFdlIHNob3VsZCBza2lwIGNsYXNzZXMgaGVyZSBiZWNhdXNlIHdlIGhhdmUgYSBzZXBhcmF0ZSBtZWNoYW5pc20gZm9yXG4gICAgICAgIC8vIG1hdGNoaW5nIGNsYXNzZXMgaW4gcHJvamVjdGlvbiBtb2RlLlxuICAgICAgICB3aGlsZSAodHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJykge1xuICAgICAgICAgIHZhbHVlID0gYXR0cnNbKytpXTtcbiAgICAgICAgfVxuICAgICAgICBjb250aW51ZTtcbiAgICAgIH0gZWxzZSBpZiAobWF5YmVBdHRyTmFtZSA9PT0gQXR0cmlidXRlTWFya2VyLlRlbXBsYXRlKSB7XG4gICAgICAgIC8vIFdlIGRvIG5vdCBjYXJlIGFib3V0IFRlbXBsYXRlIGF0dHJpYnV0ZXMgaW4gdGhpcyBzY2VuYXJpby5cbiAgICAgICAgYnJlYWs7XG4gICAgICB9IGVsc2UgaWYgKG1heWJlQXR0ck5hbWUgPT09IEF0dHJpYnV0ZU1hcmtlci5OYW1lc3BhY2VVUkkpIHtcbiAgICAgICAgLy8gU2tpcCB0aGUgd2hvbGUgbmFtZXNwYWNlZCBhdHRyaWJ1dGUgYW5kIHZhbHVlLiBUaGlzIGlzIGJ5IGRlc2lnbi5cbiAgICAgICAgaSArPSA0O1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIC8vIEluIGJpbmRpbmcgbW9kZSB0aGVyZSBhcmUgb25seSBuYW1lcywgcmF0aGVyIHRoYW4gbmFtZS12YWx1ZSBwYWlycy5cbiAgICAgIGkgKz0gYmluZGluZ3NNb2RlID8gMSA6IDI7XG4gICAgfVxuICAgIC8vIFdlIGRpZCBub3QgbWF0Y2ggdGhlIGF0dHJpYnV0ZVxuICAgIHJldHVybiAtMTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gbWF0Y2hUZW1wbGF0ZUF0dHJpYnV0ZShhdHRycywgbmFtZSk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzTm9kZU1hdGNoaW5nU2VsZWN0b3JMaXN0KFxuICAgIHROb2RlOiBUTm9kZSwgc2VsZWN0b3I6IENzc1NlbGVjdG9yTGlzdCwgaXNQcm9qZWN0aW9uTW9kZTogYm9vbGVhbiA9IGZhbHNlKTogYm9vbGVhbiB7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgc2VsZWN0b3IubGVuZ3RoOyBpKyspIHtcbiAgICBpZiAoaXNOb2RlTWF0Y2hpbmdTZWxlY3Rvcih0Tm9kZSwgc2VsZWN0b3JbaV0sIGlzUHJvamVjdGlvbk1vZGUpKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gZmFsc2U7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRQcm9qZWN0QXNBdHRyVmFsdWUodE5vZGU6IFROb2RlKTogQ3NzU2VsZWN0b3J8bnVsbCB7XG4gIGNvbnN0IG5vZGVBdHRycyA9IHROb2RlLmF0dHJzO1xuICBpZiAobm9kZUF0dHJzICE9IG51bGwpIHtcbiAgICBjb25zdCBuZ1Byb2plY3RBc0F0dHJJZHggPSBub2RlQXR0cnMuaW5kZXhPZihBdHRyaWJ1dGVNYXJrZXIuUHJvamVjdEFzKTtcbiAgICAvLyBvbmx5IGNoZWNrIGZvciBuZ1Byb2plY3RBcyBpbiBhdHRyaWJ1dGUgbmFtZXMsIGRvbid0IGFjY2lkZW50YWxseSBtYXRjaCBhdHRyaWJ1dGUncyB2YWx1ZVxuICAgIC8vIChhdHRyaWJ1dGUgbmFtZXMgYXJlIHN0b3JlZCBhdCBldmVuIGluZGV4ZXMpXG4gICAgaWYgKChuZ1Byb2plY3RBc0F0dHJJZHggJiAxKSA9PT0gMCkge1xuICAgICAgcmV0dXJuIG5vZGVBdHRyc1tuZ1Byb2plY3RBc0F0dHJJZHggKyAxXSBhcyBDc3NTZWxlY3RvcjtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbmZ1bmN0aW9uIGdldE5hbWVPbmx5TWFya2VySW5kZXgobm9kZUF0dHJzOiBUQXR0cmlidXRlcykge1xuICBmb3IgKGxldCBpID0gMDsgaSA8IG5vZGVBdHRycy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IG5vZGVBdHRyID0gbm9kZUF0dHJzW2ldO1xuICAgIGlmIChpc05hbWVPbmx5QXR0cmlidXRlTWFya2VyKG5vZGVBdHRyKSkge1xuICAgICAgcmV0dXJuIGk7XG4gICAgfVxuICB9XG4gIHJldHVybiBub2RlQXR0cnMubGVuZ3RoO1xufVxuXG5mdW5jdGlvbiBtYXRjaFRlbXBsYXRlQXR0cmlidXRlKGF0dHJzOiBUQXR0cmlidXRlcywgbmFtZTogc3RyaW5nKTogbnVtYmVyIHtcbiAgbGV0IGkgPSBhdHRycy5pbmRleE9mKEF0dHJpYnV0ZU1hcmtlci5UZW1wbGF0ZSk7XG4gIGlmIChpID4gLTEpIHtcbiAgICBpKys7XG4gICAgd2hpbGUgKGkgPCBhdHRycy5sZW5ndGgpIHtcbiAgICAgIGlmIChhdHRyc1tpXSA9PT0gbmFtZSkgcmV0dXJuIGk7XG4gICAgICBpKys7XG4gICAgfVxuICB9XG4gIHJldHVybiAtMTtcbn1cblxuLyoqXG4gKiBDaGVja3Mgd2hldGhlciBhIHNlbGVjdG9yIGlzIGluc2lkZSBhIENzc1NlbGVjdG9yTGlzdFxuICogQHBhcmFtIHNlbGVjdG9yIFNlbGVjdG9yIHRvIGJlIGNoZWNrZWQuXG4gKiBAcGFyYW0gbGlzdCBMaXN0IGluIHdoaWNoIHRvIGxvb2sgZm9yIHRoZSBzZWxlY3Rvci5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzU2VsZWN0b3JJblNlbGVjdG9yTGlzdChzZWxlY3RvcjogQ3NzU2VsZWN0b3IsIGxpc3Q6IENzc1NlbGVjdG9yTGlzdCk6IGJvb2xlYW4ge1xuICBzZWxlY3Rvckxpc3RMb29wOiBmb3IgKGxldCBpID0gMDsgaSA8IGxpc3QubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBjdXJyZW50U2VsZWN0b3JJbkxpc3QgPSBsaXN0W2ldO1xuICAgIGlmIChzZWxlY3Rvci5sZW5ndGggIT09IGN1cnJlbnRTZWxlY3RvckluTGlzdC5sZW5ndGgpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICBmb3IgKGxldCBqID0gMDsgaiA8IHNlbGVjdG9yLmxlbmd0aDsgaisrKSB7XG4gICAgICBpZiAoc2VsZWN0b3Jbal0gIT09IGN1cnJlbnRTZWxlY3RvckluTGlzdFtqXSkge1xuICAgICAgICBjb250aW51ZSBzZWxlY3Rvckxpc3RMb29wO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICByZXR1cm4gZmFsc2U7XG59XG4iXX0=