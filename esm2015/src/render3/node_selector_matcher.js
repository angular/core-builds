/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
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
 * Matching can be perfomed in 2 modes: projection mode (when we project nodes) and regular
 * directive matching mode. In "projection" mode, we do not need to check types, so if tag name
 * matches selector, we declare a match. In "directive matching" mode, we also check whether tNode
 * is of expected type:
 * - whether tNode has either Element or ElementContainer type
 * - or if we want to match "ng-template" tag, we check for Container type
 * @param {?} tNode
 * @param {?} currentSelector
 * @param {?} isProjectionMode
 * @return {?}
 */
function hasTagAndTypeMatch(tNode, currentSelector, isProjectionMode) {
    return currentSelector === tNode.tagName &&
        (isProjectionMode ||
            (tNode.type === 3 /* Element */ || tNode.type === 4 /* ElementContainer */) ||
            (tNode.type === 0 /* Container */ && currentSelector === NG_TEMPLATE_SELECTOR));
}
/**
 * A utility function to match an Ivy node static data against a simple CSS selector
 *
 * @param {?} tNode
 * @param {?} selector
 * @param {?} isProjectionMode
 * @return {?} true if node matches the selector.
 */
export function isNodeMatchingSelector(tNode, selector, isProjectionMode) {
    ngDevMode && assertDefined(selector[0], 'Selector should have a tag name');
    /** @type {?} */
    let mode = 4 /* ELEMENT */;
    /** @type {?} */
    const nodeAttrs = (/** @type {?} */ (tNode.attrs));
    /** @type {?} */
    const selectOnlyMarkerIdx = nodeAttrs ? nodeAttrs.indexOf(3 /* SelectOnly */) : -1;
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
            const attrName = (mode & 8 /* CLASS */) ? 'class' : current;
            /** @type {?} */
            const attrIndexInNode = findAttrIndexInNode(attrName, nodeAttrs);
            if (attrIndexInNode === -1) {
                if (isPositive(mode))
                    return false;
                skipToNextSelector = true;
                continue;
            }
            if (selectorAttrValue !== '') {
                /** @type {?} */
                let nodeAttrValue;
                /** @type {?} */
                const maybeAttrName = nodeAttrs[attrIndexInNode];
                if (selectOnlyMarkerIdx > -1 && attrIndexInNode > selectOnlyMarkerIdx) {
                    nodeAttrValue = '';
                }
                else {
                    ngDevMode && assertNotEqual(maybeAttrName, 0 /* NamespaceURI */, 'We do not match directives on namespaced attributes');
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
 * Examines an attributes definition array from a node to find the index of the
 * attribute with the specified name.
 *
 * NOTE: Will not find namespaced attributes.
 *
 * @param {?} name the name of the attribute to find
 * @param {?} attrs the attribute array to examine
 * @return {?}
 */
function findAttrIndexInNode(name, attrs) {
    if (attrs === null)
        return -1;
    /** @type {?} */
    let selectOnlyMode = false;
    /** @type {?} */
    let i = 0;
    while (i < attrs.length) {
        /** @type {?} */
        const maybeAttrName = attrs[i];
        if (maybeAttrName === name) {
            return i;
        }
        else if (maybeAttrName === 0 /* NamespaceURI */) {
            // NOTE(benlesh): will not find namespaced attributes. This is by design.
            i += 4;
        }
        else {
            if (maybeAttrName === 3 /* SelectOnly */) {
                selectOnlyMode = true;
            }
            i += selectOnlyMode ? 1 : 2;
        }
    }
    return -1;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9kZV9zZWxlY3Rvcl9tYXRjaGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9ub2RlX3NlbGVjdG9yX21hdGNoZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFRQSxPQUFPLHFCQUFxQixDQUFDO0FBRTdCLE9BQU8sRUFBQyxhQUFhLEVBQUUsY0FBYyxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFDN0QsT0FBTyxFQUFpRCw2QkFBNkIsSUFBSSxPQUFPLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUMzSCxPQUFPLEVBQStCLHVCQUF1QixFQUFpQiw2QkFBNkIsSUFBSSxPQUFPLEVBQUMsTUFBTSx5QkFBeUIsQ0FBQztBQUN2SixPQUFPLEVBQUMsd0JBQXdCLEVBQUMsTUFBTSxvQ0FBb0MsQ0FBQzs7TUFFdEUsdUJBQXVCLEdBQUcsT0FBTyxHQUFHLE9BQU87O01BRTNDLG9CQUFvQixHQUFHLGFBQWE7Ozs7OztBQUUxQyxTQUFTLGtCQUFrQixDQUFDLGdCQUF3QixFQUFFLGVBQXVCOztVQUNyRSxjQUFjLEdBQUcsZ0JBQWdCLENBQUMsTUFBTTs7VUFDeEMsVUFBVSxHQUFHLG1CQUFBLGdCQUFnQixFQUFFLENBQUMsT0FBTyxDQUFDLGVBQWUsQ0FBQzs7VUFDeEQsV0FBVyxHQUFHLFVBQVUsR0FBRyxlQUFlLENBQUMsTUFBTTtJQUN2RCxJQUFJLFVBQVUsS0FBSyxDQUFDLENBQUMsQ0FBa0QsV0FBVztXQUMzRSxDQUFDLFVBQVUsR0FBRyxDQUFDLElBQUksbUJBQUEsZ0JBQWdCLEVBQUUsQ0FBQyxVQUFVLEdBQUcsQ0FBQyxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUUsa0JBQWtCOztZQUVyRixDQUFDLFdBQVcsR0FBRyxjQUFjLElBQUksbUJBQUEsZ0JBQWdCLEVBQUUsQ0FBQyxXQUFXLENBQUMsS0FBSyxHQUFHLENBQUMsRUFBRyxpQkFB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QVMsQ0FBQyxDQUFDLENBQUMsRUFBRSxzQkFBc0IsQ0FBQyxJQUFJLENBQUMsRUFBRTtZQUNwRixPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBRSxrREFBa0Q7U0FDbEU7S0FDRjtJQUNELE9BQU8sQ0FBQyxDQUFDO0FBQ1gsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0ICcuLi91dGlsL25nX2Rldl9tb2RlJztcblxuaW1wb3J0IHthc3NlcnREZWZpbmVkLCBhc3NlcnROb3RFcXVhbH0gZnJvbSAnLi4vdXRpbC9hc3NlcnQnO1xuaW1wb3J0IHtBdHRyaWJ1dGVNYXJrZXIsIFRBdHRyaWJ1dGVzLCBUTm9kZSwgVE5vZGVUeXBlLCB1bnVzZWRWYWx1ZUV4cG9ydFRvUGxhY2F0ZUFqZCBhcyB1bnVzZWQxfSBmcm9tICcuL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge0Nzc1NlbGVjdG9yLCBDc3NTZWxlY3Rvckxpc3QsIE5HX1BST0pFQ1RfQVNfQVRUUl9OQU1FLCBTZWxlY3RvckZsYWdzLCB1bnVzZWRWYWx1ZUV4cG9ydFRvUGxhY2F0ZUFqZCBhcyB1bnVzZWQyfSBmcm9tICcuL2ludGVyZmFjZXMvcHJvamVjdGlvbic7XG5pbXBvcnQge2dldEluaXRpYWxDbGFzc05hbWVWYWx1ZX0gZnJvbSAnLi9zdHlsaW5nL2NsYXNzX2FuZF9zdHlsZV9iaW5kaW5ncyc7XG5cbmNvbnN0IHVudXNlZFZhbHVlVG9QbGFjYXRlQWpkID0gdW51c2VkMSArIHVudXNlZDI7XG5cbmNvbnN0IE5HX1RFTVBMQVRFX1NFTEVDVE9SID0gJ25nLXRlbXBsYXRlJztcblxuZnVuY3Rpb24gaXNDc3NDbGFzc01hdGNoaW5nKG5vZGVDbGFzc0F0dHJWYWw6IHN0cmluZywgY3NzQ2xhc3NUb01hdGNoOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgY29uc3Qgbm9kZUNsYXNzZXNMZW4gPSBub2RlQ2xhc3NBdHRyVmFsLmxlbmd0aDtcbiAgY29uc3QgbWF0Y2hJbmRleCA9IG5vZGVDbGFzc0F0dHJWYWwgIS5pbmRleE9mKGNzc0NsYXNzVG9NYXRjaCk7XG4gIGNvbnN0IG1hdGNoRW5kSWR4ID0gbWF0Y2hJbmRleCArIGNzc0NsYXNzVG9NYXRjaC5sZW5ndGg7XG4gIGlmIChtYXRjaEluZGV4ID09PSAtMSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gbm8gbWF0Y2hcbiAgICAgIHx8IChtYXRjaEluZGV4ID4gMCAmJiBub2RlQ2xhc3NBdHRyVmFsICFbbWF0Y2hJbmRleCAtIDFdICE9PSAnICcpICAvLyBubyBzcGFjZSBiZWZvcmVcbiAgICAgIHx8XG4gICAgICAobWF0Y2hFbmRJZHggPCBub2RlQ2xhc3Nlc0xlbiAmJiBub2RlQ2xhc3NBdHRyVmFsICFbbWF0Y2hFbmRJZHhdICE9PSAnICcpKSAgLy8gbm8gc3BhY2UgYWZ0ZXJcbiAge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICByZXR1cm4gdHJ1ZTtcbn1cblxuLyoqXG4gKiBGdW5jdGlvbiB0aGF0IGNoZWNrcyB3aGV0aGVyIGEgZ2l2ZW4gdE5vZGUgbWF0Y2hlcyB0YWctYmFzZWQgc2VsZWN0b3IgYW5kIGhhcyBhIHZhbGlkIHR5cGUuXG4gKlxuICogTWF0Y2hpbmcgY2FuIGJlIHBlcmZvbWVkIGluIDIgbW9kZXM6IHByb2plY3Rpb24gbW9kZSAod2hlbiB3ZSBwcm9qZWN0IG5vZGVzKSBhbmQgcmVndWxhclxuICogZGlyZWN0aXZlIG1hdGNoaW5nIG1vZGUuIEluIFwicHJvamVjdGlvblwiIG1vZGUsIHdlIGRvIG5vdCBuZWVkIHRvIGNoZWNrIHR5cGVzLCBzbyBpZiB0YWcgbmFtZVxuICogbWF0Y2hlcyBzZWxlY3Rvciwgd2UgZGVjbGFyZSBhIG1hdGNoLiBJbiBcImRpcmVjdGl2ZSBtYXRjaGluZ1wiIG1vZGUsIHdlIGFsc28gY2hlY2sgd2hldGhlciB0Tm9kZVxuICogaXMgb2YgZXhwZWN0ZWQgdHlwZTpcbiAqIC0gd2hldGhlciB0Tm9kZSBoYXMgZWl0aGVyIEVsZW1lbnQgb3IgRWxlbWVudENvbnRhaW5lciB0eXBlXG4gKiAtIG9yIGlmIHdlIHdhbnQgdG8gbWF0Y2ggXCJuZy10ZW1wbGF0ZVwiIHRhZywgd2UgY2hlY2sgZm9yIENvbnRhaW5lciB0eXBlXG4gKi9cbmZ1bmN0aW9uIGhhc1RhZ0FuZFR5cGVNYXRjaChcbiAgICB0Tm9kZTogVE5vZGUsIGN1cnJlbnRTZWxlY3Rvcjogc3RyaW5nLCBpc1Byb2plY3Rpb25Nb2RlOiBib29sZWFuKTogYm9vbGVhbiB7XG4gIHJldHVybiBjdXJyZW50U2VsZWN0b3IgPT09IHROb2RlLnRhZ05hbWUgJiZcbiAgICAgIChpc1Byb2plY3Rpb25Nb2RlIHx8XG4gICAgICAgKHROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5FbGVtZW50IHx8IHROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5FbGVtZW50Q29udGFpbmVyKSB8fFxuICAgICAgICh0Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuQ29udGFpbmVyICYmIGN1cnJlbnRTZWxlY3RvciA9PT0gTkdfVEVNUExBVEVfU0VMRUNUT1IpKTtcbn1cblxuLyoqXG4gKiBBIHV0aWxpdHkgZnVuY3Rpb24gdG8gbWF0Y2ggYW4gSXZ5IG5vZGUgc3RhdGljIGRhdGEgYWdhaW5zdCBhIHNpbXBsZSBDU1Mgc2VsZWN0b3JcbiAqXG4gKiBAcGFyYW0gbm9kZSBzdGF0aWMgZGF0YSB0byBtYXRjaFxuICogQHBhcmFtIHNlbGVjdG9yXG4gKiBAcmV0dXJucyB0cnVlIGlmIG5vZGUgbWF0Y2hlcyB0aGUgc2VsZWN0b3IuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc05vZGVNYXRjaGluZ1NlbGVjdG9yKFxuICAgIHROb2RlOiBUTm9kZSwgc2VsZWN0b3I6IENzc1NlbGVjdG9yLCBpc1Byb2plY3Rpb25Nb2RlOiBib29sZWFuKTogYm9vbGVhbiB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKHNlbGVjdG9yWzBdLCAnU2VsZWN0b3Igc2hvdWxkIGhhdmUgYSB0YWcgbmFtZScpO1xuICBsZXQgbW9kZTogU2VsZWN0b3JGbGFncyA9IFNlbGVjdG9yRmxhZ3MuRUxFTUVOVDtcbiAgY29uc3Qgbm9kZUF0dHJzID0gdE5vZGUuYXR0cnMgITtcbiAgY29uc3Qgc2VsZWN0T25seU1hcmtlcklkeCA9IG5vZGVBdHRycyA/IG5vZGVBdHRycy5pbmRleE9mKEF0dHJpYnV0ZU1hcmtlci5TZWxlY3RPbmx5KSA6IC0xO1xuXG4gIC8vIFdoZW4gcHJvY2Vzc2luZyBcIjpub3RcIiBzZWxlY3RvcnMsIHdlIHNraXAgdG8gdGhlIG5leHQgXCI6bm90XCIgaWYgdGhlXG4gIC8vIGN1cnJlbnQgb25lIGRvZXNuJ3QgbWF0Y2hcbiAgbGV0IHNraXBUb05leHRTZWxlY3RvciA9IGZhbHNlO1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgc2VsZWN0b3IubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBjdXJyZW50ID0gc2VsZWN0b3JbaV07XG4gICAgaWYgKHR5cGVvZiBjdXJyZW50ID09PSAnbnVtYmVyJykge1xuICAgICAgLy8gSWYgd2UgZmluaXNoIHByb2Nlc3NpbmcgYSA6bm90IHNlbGVjdG9yIGFuZCBpdCBoYXNuJ3QgZmFpbGVkLCByZXR1cm4gZmFsc2VcbiAgICAgIGlmICghc2tpcFRvTmV4dFNlbGVjdG9yICYmICFpc1Bvc2l0aXZlKG1vZGUpICYmICFpc1Bvc2l0aXZlKGN1cnJlbnQgYXMgbnVtYmVyKSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICAvLyBJZiB3ZSBhcmUgc2tpcHBpbmcgdG8gdGhlIG5leHQgOm5vdCgpIGFuZCB0aGlzIG1vZGUgZmxhZyBpcyBwb3NpdGl2ZSxcbiAgICAgIC8vIGl0J3MgYSBwYXJ0IG9mIHRoZSBjdXJyZW50IDpub3QoKSBzZWxlY3RvciwgYW5kIHdlIHNob3VsZCBrZWVwIHNraXBwaW5nXG4gICAgICBpZiAoc2tpcFRvTmV4dFNlbGVjdG9yICYmIGlzUG9zaXRpdmUoY3VycmVudCkpIGNvbnRpbnVlO1xuICAgICAgc2tpcFRvTmV4dFNlbGVjdG9yID0gZmFsc2U7XG4gICAgICBtb2RlID0gKGN1cnJlbnQgYXMgbnVtYmVyKSB8IChtb2RlICYgU2VsZWN0b3JGbGFncy5OT1QpO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKHNraXBUb05leHRTZWxlY3RvcikgY29udGludWU7XG5cbiAgICBpZiAobW9kZSAmIFNlbGVjdG9yRmxhZ3MuRUxFTUVOVCkge1xuICAgICAgbW9kZSA9IFNlbGVjdG9yRmxhZ3MuQVRUUklCVVRFIHwgbW9kZSAmIFNlbGVjdG9yRmxhZ3MuTk9UO1xuICAgICAgaWYgKGN1cnJlbnQgIT09ICcnICYmICFoYXNUYWdBbmRUeXBlTWF0Y2godE5vZGUsIGN1cnJlbnQsIGlzUHJvamVjdGlvbk1vZGUpIHx8XG4gICAgICAgICAgY3VycmVudCA9PT0gJycgJiYgc2VsZWN0b3IubGVuZ3RoID09PSAxKSB7XG4gICAgICAgIGlmIChpc1Bvc2l0aXZlKG1vZGUpKSByZXR1cm4gZmFsc2U7XG4gICAgICAgIHNraXBUb05leHRTZWxlY3RvciA9IHRydWU7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IHNlbGVjdG9yQXR0clZhbHVlID0gbW9kZSAmIFNlbGVjdG9yRmxhZ3MuQ0xBU1MgPyBjdXJyZW50IDogc2VsZWN0b3JbKytpXTtcblxuICAgICAgLy8gc3BlY2lhbCBjYXNlIGZvciBtYXRjaGluZyBhZ2FpbnN0IGNsYXNzZXMgd2hlbiBhIHROb2RlIGhhcyBiZWVuIGluc3RhbnRpYXRlZCB3aXRoXG4gICAgICAvLyBjbGFzcyBhbmQgc3R5bGUgdmFsdWVzIGFzIHNlcGFyYXRlIGF0dHJpYnV0ZSB2YWx1ZXMgKGUuZy4gWyd0aXRsZScsIENMQVNTLCAnZm9vJ10pXG4gICAgICBpZiAoKG1vZGUgJiBTZWxlY3RvckZsYWdzLkNMQVNTKSAmJiB0Tm9kZS5zdHlsaW5nVGVtcGxhdGUpIHtcbiAgICAgICAgaWYgKCFpc0Nzc0NsYXNzTWF0Y2hpbmcocmVhZENsYXNzVmFsdWVGcm9tVE5vZGUodE5vZGUpLCBzZWxlY3RvckF0dHJWYWx1ZSBhcyBzdHJpbmcpKSB7XG4gICAgICAgICAgaWYgKGlzUG9zaXRpdmUobW9kZSkpIHJldHVybiBmYWxzZTtcbiAgICAgICAgICBza2lwVG9OZXh0U2VsZWN0b3IgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBhdHRyTmFtZSA9IChtb2RlICYgU2VsZWN0b3JGbGFncy5DTEFTUykgPyAnY2xhc3MnIDogY3VycmVudDtcbiAgICAgIGNvbnN0IGF0dHJJbmRleEluTm9kZSA9IGZpbmRBdHRySW5kZXhJbk5vZGUoYXR0ck5hbWUsIG5vZGVBdHRycyk7XG5cbiAgICAgIGlmIChhdHRySW5kZXhJbk5vZGUgPT09IC0xKSB7XG4gICAgICAgIGlmIChpc1Bvc2l0aXZlKG1vZGUpKSByZXR1cm4gZmFsc2U7XG4gICAgICAgIHNraXBUb05leHRTZWxlY3RvciA9IHRydWU7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBpZiAoc2VsZWN0b3JBdHRyVmFsdWUgIT09ICcnKSB7XG4gICAgICAgIGxldCBub2RlQXR0clZhbHVlOiBzdHJpbmc7XG4gICAgICAgIGNvbnN0IG1heWJlQXR0ck5hbWUgPSBub2RlQXR0cnNbYXR0ckluZGV4SW5Ob2RlXTtcbiAgICAgICAgaWYgKHNlbGVjdE9ubHlNYXJrZXJJZHggPiAtMSAmJiBhdHRySW5kZXhJbk5vZGUgPiBzZWxlY3RPbmx5TWFya2VySWR4KSB7XG4gICAgICAgICAgbm9kZUF0dHJWYWx1ZSA9ICcnO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG5nRGV2TW9kZSAmJiBhc3NlcnROb3RFcXVhbChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIG1heWJlQXR0ck5hbWUsIEF0dHJpYnV0ZU1hcmtlci5OYW1lc3BhY2VVUkksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAnV2UgZG8gbm90IG1hdGNoIGRpcmVjdGl2ZXMgb24gbmFtZXNwYWNlZCBhdHRyaWJ1dGVzJyk7XG4gICAgICAgICAgbm9kZUF0dHJWYWx1ZSA9IG5vZGVBdHRyc1thdHRySW5kZXhJbk5vZGUgKyAxXSBhcyBzdHJpbmc7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBjb21wYXJlQWdhaW5zdENsYXNzTmFtZSA9IG1vZGUgJiBTZWxlY3RvckZsYWdzLkNMQVNTID8gbm9kZUF0dHJWYWx1ZSA6IG51bGw7XG4gICAgICAgIGlmIChjb21wYXJlQWdhaW5zdENsYXNzTmFtZSAmJlxuICAgICAgICAgICAgICAgICFpc0Nzc0NsYXNzTWF0Y2hpbmcoY29tcGFyZUFnYWluc3RDbGFzc05hbWUsIHNlbGVjdG9yQXR0clZhbHVlIGFzIHN0cmluZykgfHxcbiAgICAgICAgICAgIG1vZGUgJiBTZWxlY3RvckZsYWdzLkFUVFJJQlVURSAmJiBzZWxlY3RvckF0dHJWYWx1ZSAhPT0gbm9kZUF0dHJWYWx1ZSkge1xuICAgICAgICAgIGlmIChpc1Bvc2l0aXZlKG1vZGUpKSByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgc2tpcFRvTmV4dFNlbGVjdG9yID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBpc1Bvc2l0aXZlKG1vZGUpIHx8IHNraXBUb05leHRTZWxlY3Rvcjtcbn1cblxuZnVuY3Rpb24gaXNQb3NpdGl2ZShtb2RlOiBTZWxlY3RvckZsYWdzKTogYm9vbGVhbiB7XG4gIHJldHVybiAobW9kZSAmIFNlbGVjdG9yRmxhZ3MuTk9UKSA9PT0gMDtcbn1cblxuZnVuY3Rpb24gcmVhZENsYXNzVmFsdWVGcm9tVE5vZGUodE5vZGU6IFROb2RlKTogc3RyaW5nIHtcbiAgLy8gY29tcGFyaW5nIGFnYWluc3QgQ1NTIGNsYXNzIHZhbHVlcyBpcyBjb21wbGV4IGJlY2F1c2UgdGhlIGNvbXBpbGVyIGRvZXNuJ3QgcGxhY2UgdGhlbSBhc1xuICAvLyByZWd1bGFyIGF0dHJpYnV0ZXMgd2hlbiBhbiBlbGVtZW50IGlzIGNyZWF0ZWQuIEluc3RlYWQsIHRoZSBjbGFzc2VzIChhbmQgc3R5bGVzIGZvclxuICAvLyB0aGF0IG1hdHRlcikgYXJlIHBsYWNlZCBpbiBhIHNwZWNpYWwgc3R5bGluZyBjb250ZXh0IHRoYXQgaXMgdXNlZCBmb3IgcmVzb2x2aW5nIGFsbFxuICAvLyBjbGFzcy9zdHlsZSB2YWx1ZXMgYWNyb3NzIHN0YXRpYyBhdHRyaWJ1dGVzLCBbc3R5bGVdL1tjbGFzc10gYW5kIFtzdHlsZS5wcm9wXS9bY2xhc3MubmFtZV1cbiAgLy8gYmluZGluZ3MuIFRoZXJlZm9yZSBpZiBhbmQgd2hlbiB0aGUgc3R5bGluZyBjb250ZXh0IGV4aXN0cyB0aGVuIHRoZSBjbGFzcyB2YWx1ZXMgYXJlIHRvIGJlXG4gIC8vIGV4dHJhY3RlZCBieSB0aGUgY29udGV4dCBoZWxwZXIgY29kZSBiZWxvdy4uLlxuICByZXR1cm4gdE5vZGUuc3R5bGluZ1RlbXBsYXRlID8gZ2V0SW5pdGlhbENsYXNzTmFtZVZhbHVlKHROb2RlLnN0eWxpbmdUZW1wbGF0ZSkgOiAnJztcbn1cblxuLyoqXG4gKiBFeGFtaW5lcyBhbiBhdHRyaWJ1dGVzIGRlZmluaXRpb24gYXJyYXkgZnJvbSBhIG5vZGUgdG8gZmluZCB0aGUgaW5kZXggb2YgdGhlXG4gKiBhdHRyaWJ1dGUgd2l0aCB0aGUgc3BlY2lmaWVkIG5hbWUuXG4gKlxuICogTk9URTogV2lsbCBub3QgZmluZCBuYW1lc3BhY2VkIGF0dHJpYnV0ZXMuXG4gKlxuICogQHBhcmFtIG5hbWUgdGhlIG5hbWUgb2YgdGhlIGF0dHJpYnV0ZSB0byBmaW5kXG4gKiBAcGFyYW0gYXR0cnMgdGhlIGF0dHJpYnV0ZSBhcnJheSB0byBleGFtaW5lXG4gKi9cbmZ1bmN0aW9uIGZpbmRBdHRySW5kZXhJbk5vZGUobmFtZTogc3RyaW5nLCBhdHRyczogVEF0dHJpYnV0ZXMgfCBudWxsKTogbnVtYmVyIHtcbiAgaWYgKGF0dHJzID09PSBudWxsKSByZXR1cm4gLTE7XG4gIGxldCBzZWxlY3RPbmx5TW9kZSA9IGZhbHNlO1xuICBsZXQgaSA9IDA7XG4gIHdoaWxlIChpIDwgYXR0cnMubGVuZ3RoKSB7XG4gICAgY29uc3QgbWF5YmVBdHRyTmFtZSA9IGF0dHJzW2ldO1xuICAgIGlmIChtYXliZUF0dHJOYW1lID09PSBuYW1lKSB7XG4gICAgICByZXR1cm4gaTtcbiAgICB9IGVsc2UgaWYgKG1heWJlQXR0ck5hbWUgPT09IEF0dHJpYnV0ZU1hcmtlci5OYW1lc3BhY2VVUkkpIHtcbiAgICAgIC8vIE5PVEUoYmVubGVzaCk6IHdpbGwgbm90IGZpbmQgbmFtZXNwYWNlZCBhdHRyaWJ1dGVzLiBUaGlzIGlzIGJ5IGRlc2lnbi5cbiAgICAgIGkgKz0gNDtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKG1heWJlQXR0ck5hbWUgPT09IEF0dHJpYnV0ZU1hcmtlci5TZWxlY3RPbmx5KSB7XG4gICAgICAgIHNlbGVjdE9ubHlNb2RlID0gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIGkgKz0gc2VsZWN0T25seU1vZGUgPyAxIDogMjtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gLTE7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc05vZGVNYXRjaGluZ1NlbGVjdG9yTGlzdChcbiAgICB0Tm9kZTogVE5vZGUsIHNlbGVjdG9yOiBDc3NTZWxlY3Rvckxpc3QsIGlzUHJvamVjdGlvbk1vZGU6IGJvb2xlYW4gPSBmYWxzZSk6IGJvb2xlYW4ge1xuICBmb3IgKGxldCBpID0gMDsgaSA8IHNlbGVjdG9yLmxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKGlzTm9kZU1hdGNoaW5nU2VsZWN0b3IodE5vZGUsIHNlbGVjdG9yW2ldLCBpc1Byb2plY3Rpb25Nb2RlKSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0UHJvamVjdEFzQXR0clZhbHVlKHROb2RlOiBUTm9kZSk6IHN0cmluZ3xudWxsIHtcbiAgY29uc3Qgbm9kZUF0dHJzID0gdE5vZGUuYXR0cnM7XG4gIGlmIChub2RlQXR0cnMgIT0gbnVsbCkge1xuICAgIGNvbnN0IG5nUHJvamVjdEFzQXR0cklkeCA9IG5vZGVBdHRycy5pbmRleE9mKE5HX1BST0pFQ1RfQVNfQVRUUl9OQU1FKTtcbiAgICAvLyBvbmx5IGNoZWNrIGZvciBuZ1Byb2plY3RBcyBpbiBhdHRyaWJ1dGUgbmFtZXMsIGRvbid0IGFjY2lkZW50YWxseSBtYXRjaCBhdHRyaWJ1dGUncyB2YWx1ZVxuICAgIC8vIChhdHRyaWJ1dGUgbmFtZXMgYXJlIHN0b3JlZCBhdCBldmVuIGluZGV4ZXMpXG4gICAgaWYgKChuZ1Byb2plY3RBc0F0dHJJZHggJiAxKSA9PT0gMCkge1xuICAgICAgcmV0dXJuIG5vZGVBdHRyc1tuZ1Byb2plY3RBc0F0dHJJZHggKyAxXSBhcyBzdHJpbmc7XG4gICAgfVxuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG4vKipcbiAqIENoZWNrcyBhIGdpdmVuIG5vZGUgYWdhaW5zdCBtYXRjaGluZyBzZWxlY3RvcnMgYW5kIHJldHVybnNcbiAqIHNlbGVjdG9yIGluZGV4IChvciAwIGlmIG5vbmUgbWF0Y2hlZCkuXG4gKlxuICogVGhpcyBmdW5jdGlvbiB0YWtlcyBpbnRvIGFjY291bnQgdGhlIG5nUHJvamVjdEFzIGF0dHJpYnV0ZTogaWYgcHJlc2VudCBpdHMgdmFsdWUgd2lsbCBiZSBjb21wYXJlZFxuICogdG8gdGhlIHJhdyAodW4tcGFyc2VkKSBDU1Mgc2VsZWN0b3IgaW5zdGVhZCBvZiB1c2luZyBzdGFuZGFyZCBzZWxlY3RvciBtYXRjaGluZyBsb2dpYy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG1hdGNoaW5nU2VsZWN0b3JJbmRleChcbiAgICB0Tm9kZTogVE5vZGUsIHNlbGVjdG9yczogQ3NzU2VsZWN0b3JMaXN0W10sIHRleHRTZWxlY3RvcnM6IHN0cmluZ1tdKTogbnVtYmVyIHtcbiAgY29uc3QgbmdQcm9qZWN0QXNBdHRyVmFsID0gZ2V0UHJvamVjdEFzQXR0clZhbHVlKHROb2RlKTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBzZWxlY3RvcnMubGVuZ3RoOyBpKyspIHtcbiAgICAvLyBpZiBhIG5vZGUgaGFzIHRoZSBuZ1Byb2plY3RBcyBhdHRyaWJ1dGUgbWF0Y2ggaXQgYWdhaW5zdCB1bnBhcnNlZCBzZWxlY3RvclxuICAgIC8vIG1hdGNoIGEgbm9kZSBhZ2FpbnN0IGEgcGFyc2VkIHNlbGVjdG9yIG9ubHkgaWYgbmdQcm9qZWN0QXMgYXR0cmlidXRlIGlzIG5vdCBwcmVzZW50XG4gICAgaWYgKG5nUHJvamVjdEFzQXR0clZhbCA9PT0gdGV4dFNlbGVjdG9yc1tpXSB8fFxuICAgICAgICBuZ1Byb2plY3RBc0F0dHJWYWwgPT09IG51bGwgJiZcbiAgICAgICAgICAgIGlzTm9kZU1hdGNoaW5nU2VsZWN0b3JMaXN0KHROb2RlLCBzZWxlY3RvcnNbaV0sIC8qIGlzUHJvamVjdGlvbk1vZGUgKi8gdHJ1ZSkpIHtcbiAgICAgIHJldHVybiBpICsgMTsgIC8vIGZpcnN0IG1hdGNoaW5nIHNlbGVjdG9yIFwiY2FwdHVyZXNcIiBhIGdpdmVuIG5vZGVcbiAgICB9XG4gIH1cbiAgcmV0dXJuIDA7XG59XG4iXX0=