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
var unusedValueToPlacateAjd = unused1 + unused2;
var NG_TEMPLATE_SELECTOR = 'ng-template';
function isCssClassMatching(nodeClassAttrVal, cssClassToMatch) {
    var nodeClassesLen = nodeClassAttrVal.length;
    var matchIndex = nodeClassAttrVal.indexOf(cssClassToMatch);
    var matchEndIdx = matchIndex + cssClassToMatch.length;
    if (matchIndex === -1 // no match
        || (matchIndex > 0 && nodeClassAttrVal[matchIndex - 1] !== ' ') // no space before
        ||
            (matchEndIdx < nodeClassesLen && nodeClassAttrVal[matchEndIdx] !== ' ')) // no space after
     {
        return false;
    }
    return true;
}
/**
 * Function that checks whether a given tNode matches tag-based selector and has a valid type.
 *
 * Matching can be performed in 2 modes: projection mode (when we project nodes) and regular
 * directive matching mode. In "projection" mode, we do not need to check types, so if tag name
 * matches selector, we declare a match. In "directive matching" mode, we also check whether tNode
 * is of expected type:
 * - whether tNode has either Element or ElementContainer type
 * - or if we want to match "ng-template" tag, we check for Container type
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
 * @param node static data of the node to match
 * @param selector The selector to try matching against the node.
 * @param isProjectionMode if `true` we are matching for content projection, otherwise we are doing
 * directive matching.
 * @returns true if node matches the selector.
 */
export function isNodeMatchingSelector(tNode, selector, isProjectionMode) {
    ngDevMode && assertDefined(selector[0], 'Selector should have a tag name');
    var mode = 4 /* ELEMENT */;
    var nodeAttrs = tNode.attrs || [];
    // Find the index of first attribute that has no value, only a name.
    var nameOnlyMarkerIdx = getNameOnlyMarkerIndex(nodeAttrs);
    // When processing ":not" selectors, we skip to the next ":not" if the
    // current one doesn't match
    var skipToNextSelector = false;
    for (var i = 0; i < selector.length; i++) {
        var current = selector[i];
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
            mode = current | (mode & 1 /* NOT */);
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
            var selectorAttrValue = mode & 8 /* CLASS */ ? current : selector[++i];
            // special case for matching against classes when a tNode has been instantiated with
            // class and style values as separate attribute values (e.g. ['title', CLASS, 'foo'])
            if ((mode & 8 /* CLASS */) && tNode.stylingTemplate) {
                if (!isCssClassMatching(readClassValueFromTNode(tNode), selectorAttrValue)) {
                    if (isPositive(mode))
                        return false;
                    skipToNextSelector = true;
                }
                continue;
            }
            var isInlineTemplate = tNode.type == 0 /* Container */ && tNode.tagName !== NG_TEMPLATE_SELECTOR;
            var attrName = (mode & 8 /* CLASS */) ? 'class' : current;
            var attrIndexInNode = findAttrIndexInNode(attrName, nodeAttrs, isInlineTemplate, isProjectionMode);
            if (attrIndexInNode === -1) {
                if (isPositive(mode))
                    return false;
                skipToNextSelector = true;
                continue;
            }
            if (selectorAttrValue !== '') {
                var nodeAttrValue = void 0;
                if (attrIndexInNode > nameOnlyMarkerIdx) {
                    nodeAttrValue = '';
                }
                else {
                    ngDevMode && assertNotEqual(nodeAttrs[attrIndexInNode], 0 /* NamespaceURI */, 'We do not match directives on namespaced attributes');
                    nodeAttrValue = nodeAttrs[attrIndexInNode + 1];
                }
                var compareAgainstClassName = mode & 8 /* CLASS */ ? nodeAttrValue : null;
                if (compareAgainstClassName &&
                    !isCssClassMatching(compareAgainstClassName, selectorAttrValue) ||
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
function isPositive(mode) {
    return (mode & 1 /* NOT */) === 0;
}
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
 * @param name the name of the attribute to find
 * @param attrs the attribute array to examine
 * @param isInlineTemplate true if the node being matched is an inline template (e.g. `*ngFor`)
 * rather than a manually expanded template node (e.g `<ng-template>`).
 * @param isProjectionMode true if we are matching against content projection otherwise we are
 * matching against directives.
 */
function findAttrIndexInNode(name, attrs, isInlineTemplate, isProjectionMode) {
    if (attrs === null)
        return -1;
    var i = 0;
    if (isProjectionMode || !isInlineTemplate) {
        var bindingsMode = false;
        while (i < attrs.length) {
            var maybeAttrName = attrs[i];
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
export function isNodeMatchingSelectorList(tNode, selector, isProjectionMode) {
    if (isProjectionMode === void 0) { isProjectionMode = false; }
    for (var i = 0; i < selector.length; i++) {
        if (isNodeMatchingSelector(tNode, selector[i], isProjectionMode)) {
            return true;
        }
    }
    return false;
}
export function getProjectAsAttrValue(tNode) {
    var nodeAttrs = tNode.attrs;
    if (nodeAttrs != null) {
        var ngProjectAsAttrIdx = nodeAttrs.indexOf(NG_PROJECT_AS_ATTR_NAME);
        // only check for ngProjectAs in attribute names, don't accidentally match attribute's value
        // (attribute names are stored at even indexes)
        if ((ngProjectAsAttrIdx & 1) === 0) {
            return nodeAttrs[ngProjectAsAttrIdx + 1];
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
 */
export function matchingProjectionSelectorIndex(tNode, selectors, textSelectors) {
    var ngProjectAsAttrVal = getProjectAsAttrValue(tNode);
    for (var i = 0; i < selectors.length; i++) {
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
function getNameOnlyMarkerIndex(nodeAttrs) {
    for (var i = 0; i < nodeAttrs.length; i++) {
        var nodeAttr = nodeAttrs[i];
        if (isNameOnlyAttributeMarker(nodeAttr)) {
            return i;
        }
    }
    return nodeAttrs.length;
}
function matchTemplateAttribute(attrs, name) {
    var i = attrs.indexOf(4 /* Template */);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9kZV9zZWxlY3Rvcl9tYXRjaGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9ub2RlX3NlbGVjdG9yX21hdGNoZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxxQkFBcUIsQ0FBQztBQUU3QixPQUFPLEVBQUMsYUFBYSxFQUFFLGNBQWMsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBRTdELE9BQU8sRUFBaUQsNkJBQTZCLElBQUksT0FBTyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDM0gsT0FBTyxFQUErQix1QkFBdUIsRUFBaUIsNkJBQTZCLElBQUksT0FBTyxFQUFDLE1BQU0seUJBQXlCLENBQUM7QUFDdkosT0FBTyxFQUFDLHdCQUF3QixFQUFDLE1BQU0sb0NBQW9DLENBQUM7QUFDNUUsT0FBTyxFQUFDLHlCQUF5QixFQUFDLE1BQU0sb0JBQW9CLENBQUM7QUFFN0QsSUFBTSx1QkFBdUIsR0FBRyxPQUFPLEdBQUcsT0FBTyxDQUFDO0FBRWxELElBQU0sb0JBQW9CLEdBQUcsYUFBYSxDQUFDO0FBRTNDLFNBQVMsa0JBQWtCLENBQUMsZ0JBQXdCLEVBQUUsZUFBdUI7SUFDM0UsSUFBTSxjQUFjLEdBQUcsZ0JBQWdCLENBQUMsTUFBTSxDQUFDO0lBQy9DLElBQU0sVUFBVSxHQUFHLGdCQUFrQixDQUFDLE9BQU8sQ0FBQyxlQUFlLENBQUMsQ0FBQztJQUMvRCxJQUFNLFdBQVcsR0FBRyxVQUFVLEdBQUcsZUFBZSxDQUFDLE1BQU0sQ0FBQztJQUN4RCxJQUFJLFVBQVUsS0FBSyxDQUFDLENBQUMsQ0FBa0QsV0FBVztXQUMzRSxDQUFDLFVBQVUsR0FBRyxDQUFDLElBQUksZ0JBQWtCLENBQUMsVUFBVSxHQUFHLENBQUMsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFFLGtCQUFrQjs7WUFFckYsQ0FBQyxX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Q0FBQyxHQUFHLEtBQUssQ0FBQyxPQUFPLGtCQUEwQixDQUFDO0lBQ2hELElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFO1FBQ1YsQ0FBQyxFQUFFLENBQUM7UUFDSixPQUFPLENBQUMsR0FBRyxLQUFLLENBQUMsTUFBTSxFQUFFO1lBQ3ZCLElBQUksS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLElBQUk7Z0JBQUUsT0FBTyxDQUFDLENBQUM7WUFDaEMsQ0FBQyxFQUFFLENBQUM7U0FDTDtLQUNGO0lBQ0QsT0FBTyxDQUFDLENBQUMsQ0FBQztBQUNaLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCAnLi4vdXRpbC9uZ19kZXZfbW9kZSc7XG5cbmltcG9ydCB7YXNzZXJ0RGVmaW5lZCwgYXNzZXJ0Tm90RXF1YWx9IGZyb20gJy4uL3V0aWwvYXNzZXJ0JztcblxuaW1wb3J0IHtBdHRyaWJ1dGVNYXJrZXIsIFRBdHRyaWJ1dGVzLCBUTm9kZSwgVE5vZGVUeXBlLCB1bnVzZWRWYWx1ZUV4cG9ydFRvUGxhY2F0ZUFqZCBhcyB1bnVzZWQxfSBmcm9tICcuL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge0Nzc1NlbGVjdG9yLCBDc3NTZWxlY3Rvckxpc3QsIE5HX1BST0pFQ1RfQVNfQVRUUl9OQU1FLCBTZWxlY3RvckZsYWdzLCB1bnVzZWRWYWx1ZUV4cG9ydFRvUGxhY2F0ZUFqZCBhcyB1bnVzZWQyfSBmcm9tICcuL2ludGVyZmFjZXMvcHJvamVjdGlvbic7XG5pbXBvcnQge2dldEluaXRpYWxDbGFzc05hbWVWYWx1ZX0gZnJvbSAnLi9zdHlsaW5nL2NsYXNzX2FuZF9zdHlsZV9iaW5kaW5ncyc7XG5pbXBvcnQge2lzTmFtZU9ubHlBdHRyaWJ1dGVNYXJrZXJ9IGZyb20gJy4vdXRpbC9hdHRyc191dGlscyc7XG5cbmNvbnN0IHVudXNlZFZhbHVlVG9QbGFjYXRlQWpkID0gdW51c2VkMSArIHVudXNlZDI7XG5cbmNvbnN0IE5HX1RFTVBMQVRFX1NFTEVDVE9SID0gJ25nLXRlbXBsYXRlJztcblxuZnVuY3Rpb24gaXNDc3NDbGFzc01hdGNoaW5nKG5vZGVDbGFzc0F0dHJWYWw6IHN0cmluZywgY3NzQ2xhc3NUb01hdGNoOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgY29uc3Qgbm9kZUNsYXNzZXNMZW4gPSBub2RlQ2xhc3NBdHRyVmFsLmxlbmd0aDtcbiAgY29uc3QgbWF0Y2hJbmRleCA9IG5vZGVDbGFzc0F0dHJWYWwgIS5pbmRleE9mKGNzc0NsYXNzVG9NYXRjaCk7XG4gIGNvbnN0IG1hdGNoRW5kSWR4ID0gbWF0Y2hJbmRleCArIGNzc0NsYXNzVG9NYXRjaC5sZW5ndGg7XG4gIGlmIChtYXRjaEluZGV4ID09PSAtMSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gbm8gbWF0Y2hcbiAgICAgIHx8IChtYXRjaEluZGV4ID4gMCAmJiBub2RlQ2xhc3NBdHRyVmFsICFbbWF0Y2hJbmRleCAtIDFdICE9PSAnICcpICAvLyBubyBzcGFjZSBiZWZvcmVcbiAgICAgIHx8XG4gICAgICAobWF0Y2hFbmRJZHggPCBub2RlQ2xhc3Nlc0xlbiAmJiBub2RlQ2xhc3NBdHRyVmFsICFbbWF0Y2hFbmRJZHhdICE9PSAnICcpKSAgLy8gbm8gc3BhY2UgYWZ0ZXJcbiAge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICByZXR1cm4gdHJ1ZTtcbn1cblxuLyoqXG4gKiBGdW5jdGlvbiB0aGF0IGNoZWNrcyB3aGV0aGVyIGEgZ2l2ZW4gdE5vZGUgbWF0Y2hlcyB0YWctYmFzZWQgc2VsZWN0b3IgYW5kIGhhcyBhIHZhbGlkIHR5cGUuXG4gKlxuICogTWF0Y2hpbmcgY2FuIGJlIHBlcmZvcm1lZCBpbiAyIG1vZGVzOiBwcm9qZWN0aW9uIG1vZGUgKHdoZW4gd2UgcHJvamVjdCBub2RlcykgYW5kIHJlZ3VsYXJcbiAqIGRpcmVjdGl2ZSBtYXRjaGluZyBtb2RlLiBJbiBcInByb2plY3Rpb25cIiBtb2RlLCB3ZSBkbyBub3QgbmVlZCB0byBjaGVjayB0eXBlcywgc28gaWYgdGFnIG5hbWVcbiAqIG1hdGNoZXMgc2VsZWN0b3IsIHdlIGRlY2xhcmUgYSBtYXRjaC4gSW4gXCJkaXJlY3RpdmUgbWF0Y2hpbmdcIiBtb2RlLCB3ZSBhbHNvIGNoZWNrIHdoZXRoZXIgdE5vZGVcbiAqIGlzIG9mIGV4cGVjdGVkIHR5cGU6XG4gKiAtIHdoZXRoZXIgdE5vZGUgaGFzIGVpdGhlciBFbGVtZW50IG9yIEVsZW1lbnRDb250YWluZXIgdHlwZVxuICogLSBvciBpZiB3ZSB3YW50IHRvIG1hdGNoIFwibmctdGVtcGxhdGVcIiB0YWcsIHdlIGNoZWNrIGZvciBDb250YWluZXIgdHlwZVxuICovXG5mdW5jdGlvbiBoYXNUYWdBbmRUeXBlTWF0Y2goXG4gICAgdE5vZGU6IFROb2RlLCBjdXJyZW50U2VsZWN0b3I6IHN0cmluZywgaXNQcm9qZWN0aW9uTW9kZTogYm9vbGVhbik6IGJvb2xlYW4ge1xuICByZXR1cm4gY3VycmVudFNlbGVjdG9yID09PSB0Tm9kZS50YWdOYW1lICYmXG4gICAgICAoaXNQcm9qZWN0aW9uTW9kZSB8fFxuICAgICAgICh0Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuRWxlbWVudCB8fCB0Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuRWxlbWVudENvbnRhaW5lcikgfHxcbiAgICAgICAodE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkNvbnRhaW5lciAmJiBjdXJyZW50U2VsZWN0b3IgPT09IE5HX1RFTVBMQVRFX1NFTEVDVE9SKSk7XG59XG5cbi8qKlxuICogQSB1dGlsaXR5IGZ1bmN0aW9uIHRvIG1hdGNoIGFuIEl2eSBub2RlIHN0YXRpYyBkYXRhIGFnYWluc3QgYSBzaW1wbGUgQ1NTIHNlbGVjdG9yXG4gKlxuICogQHBhcmFtIG5vZGUgc3RhdGljIGRhdGEgb2YgdGhlIG5vZGUgdG8gbWF0Y2hcbiAqIEBwYXJhbSBzZWxlY3RvciBUaGUgc2VsZWN0b3IgdG8gdHJ5IG1hdGNoaW5nIGFnYWluc3QgdGhlIG5vZGUuXG4gKiBAcGFyYW0gaXNQcm9qZWN0aW9uTW9kZSBpZiBgdHJ1ZWAgd2UgYXJlIG1hdGNoaW5nIGZvciBjb250ZW50IHByb2plY3Rpb24sIG90aGVyd2lzZSB3ZSBhcmUgZG9pbmdcbiAqIGRpcmVjdGl2ZSBtYXRjaGluZy5cbiAqIEByZXR1cm5zIHRydWUgaWYgbm9kZSBtYXRjaGVzIHRoZSBzZWxlY3Rvci5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzTm9kZU1hdGNoaW5nU2VsZWN0b3IoXG4gICAgdE5vZGU6IFROb2RlLCBzZWxlY3RvcjogQ3NzU2VsZWN0b3IsIGlzUHJvamVjdGlvbk1vZGU6IGJvb2xlYW4pOiBib29sZWFuIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQoc2VsZWN0b3JbMF0sICdTZWxlY3RvciBzaG91bGQgaGF2ZSBhIHRhZyBuYW1lJyk7XG4gIGxldCBtb2RlOiBTZWxlY3RvckZsYWdzID0gU2VsZWN0b3JGbGFncy5FTEVNRU5UO1xuICBjb25zdCBub2RlQXR0cnMgPSB0Tm9kZS5hdHRycyB8fCBbXTtcblxuICAvLyBGaW5kIHRoZSBpbmRleCBvZiBmaXJzdCBhdHRyaWJ1dGUgdGhhdCBoYXMgbm8gdmFsdWUsIG9ubHkgYSBuYW1lLlxuICBjb25zdCBuYW1lT25seU1hcmtlcklkeCA9IGdldE5hbWVPbmx5TWFya2VySW5kZXgobm9kZUF0dHJzKTtcblxuICAvLyBXaGVuIHByb2Nlc3NpbmcgXCI6bm90XCIgc2VsZWN0b3JzLCB3ZSBza2lwIHRvIHRoZSBuZXh0IFwiOm5vdFwiIGlmIHRoZVxuICAvLyBjdXJyZW50IG9uZSBkb2Vzbid0IG1hdGNoXG4gIGxldCBza2lwVG9OZXh0U2VsZWN0b3IgPSBmYWxzZTtcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IHNlbGVjdG9yLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgY3VycmVudCA9IHNlbGVjdG9yW2ldO1xuICAgIGlmICh0eXBlb2YgY3VycmVudCA9PT0gJ251bWJlcicpIHtcbiAgICAgIC8vIElmIHdlIGZpbmlzaCBwcm9jZXNzaW5nIGEgOm5vdCBzZWxlY3RvciBhbmQgaXQgaGFzbid0IGZhaWxlZCwgcmV0dXJuIGZhbHNlXG4gICAgICBpZiAoIXNraXBUb05leHRTZWxlY3RvciAmJiAhaXNQb3NpdGl2ZShtb2RlKSAmJiAhaXNQb3NpdGl2ZShjdXJyZW50IGFzIG51bWJlcikpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgLy8gSWYgd2UgYXJlIHNraXBwaW5nIHRvIHRoZSBuZXh0IDpub3QoKSBhbmQgdGhpcyBtb2RlIGZsYWcgaXMgcG9zaXRpdmUsXG4gICAgICAvLyBpdCdzIGEgcGFydCBvZiB0aGUgY3VycmVudCA6bm90KCkgc2VsZWN0b3IsIGFuZCB3ZSBzaG91bGQga2VlcCBza2lwcGluZ1xuICAgICAgaWYgKHNraXBUb05leHRTZWxlY3RvciAmJiBpc1Bvc2l0aXZlKGN1cnJlbnQpKSBjb250aW51ZTtcbiAgICAgIHNraXBUb05leHRTZWxlY3RvciA9IGZhbHNlO1xuICAgICAgbW9kZSA9IChjdXJyZW50IGFzIG51bWJlcikgfCAobW9kZSAmIFNlbGVjdG9yRmxhZ3MuTk9UKTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmIChza2lwVG9OZXh0U2VsZWN0b3IpIGNvbnRpbnVlO1xuXG4gICAgaWYgKG1vZGUgJiBTZWxlY3RvckZsYWdzLkVMRU1FTlQpIHtcbiAgICAgIG1vZGUgPSBTZWxlY3RvckZsYWdzLkFUVFJJQlVURSB8IG1vZGUgJiBTZWxlY3RvckZsYWdzLk5PVDtcbiAgICAgIGlmIChjdXJyZW50ICE9PSAnJyAmJiAhaGFzVGFnQW5kVHlwZU1hdGNoKHROb2RlLCBjdXJyZW50LCBpc1Byb2plY3Rpb25Nb2RlKSB8fFxuICAgICAgICAgIGN1cnJlbnQgPT09ICcnICYmIHNlbGVjdG9yLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICBpZiAoaXNQb3NpdGl2ZShtb2RlKSkgcmV0dXJuIGZhbHNlO1xuICAgICAgICBza2lwVG9OZXh0U2VsZWN0b3IgPSB0cnVlO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBzZWxlY3RvckF0dHJWYWx1ZSA9IG1vZGUgJiBTZWxlY3RvckZsYWdzLkNMQVNTID8gY3VycmVudCA6IHNlbGVjdG9yWysraV07XG5cbiAgICAgIC8vIHNwZWNpYWwgY2FzZSBmb3IgbWF0Y2hpbmcgYWdhaW5zdCBjbGFzc2VzIHdoZW4gYSB0Tm9kZSBoYXMgYmVlbiBpbnN0YW50aWF0ZWQgd2l0aFxuICAgICAgLy8gY2xhc3MgYW5kIHN0eWxlIHZhbHVlcyBhcyBzZXBhcmF0ZSBhdHRyaWJ1dGUgdmFsdWVzIChlLmcuIFsndGl0bGUnLCBDTEFTUywgJ2ZvbyddKVxuICAgICAgaWYgKChtb2RlICYgU2VsZWN0b3JGbGFncy5DTEFTUykgJiYgdE5vZGUuc3R5bGluZ1RlbXBsYXRlKSB7XG4gICAgICAgIGlmICghaXNDc3NDbGFzc01hdGNoaW5nKHJlYWRDbGFzc1ZhbHVlRnJvbVROb2RlKHROb2RlKSwgc2VsZWN0b3JBdHRyVmFsdWUgYXMgc3RyaW5nKSkge1xuICAgICAgICAgIGlmIChpc1Bvc2l0aXZlKG1vZGUpKSByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgc2tpcFRvTmV4dFNlbGVjdG9yID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgaXNJbmxpbmVUZW1wbGF0ZSA9XG4gICAgICAgICAgdE5vZGUudHlwZSA9PSBUTm9kZVR5cGUuQ29udGFpbmVyICYmIHROb2RlLnRhZ05hbWUgIT09IE5HX1RFTVBMQVRFX1NFTEVDVE9SO1xuICAgICAgY29uc3QgYXR0ck5hbWUgPSAobW9kZSAmIFNlbGVjdG9yRmxhZ3MuQ0xBU1MpID8gJ2NsYXNzJyA6IGN1cnJlbnQ7XG4gICAgICBjb25zdCBhdHRySW5kZXhJbk5vZGUgPVxuICAgICAgICAgIGZpbmRBdHRySW5kZXhJbk5vZGUoYXR0ck5hbWUsIG5vZGVBdHRycywgaXNJbmxpbmVUZW1wbGF0ZSwgaXNQcm9qZWN0aW9uTW9kZSk7XG5cbiAgICAgIGlmIChhdHRySW5kZXhJbk5vZGUgPT09IC0xKSB7XG4gICAgICAgIGlmIChpc1Bvc2l0aXZlKG1vZGUpKSByZXR1cm4gZmFsc2U7XG4gICAgICAgIHNraXBUb05leHRTZWxlY3RvciA9IHRydWU7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBpZiAoc2VsZWN0b3JBdHRyVmFsdWUgIT09ICcnKSB7XG4gICAgICAgIGxldCBub2RlQXR0clZhbHVlOiBzdHJpbmc7XG4gICAgICAgIGlmIChhdHRySW5kZXhJbk5vZGUgPiBuYW1lT25seU1hcmtlcklkeCkge1xuICAgICAgICAgIG5vZGVBdHRyVmFsdWUgPSAnJztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm90RXF1YWwoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlQXR0cnNbYXR0ckluZGV4SW5Ob2RlXSwgQXR0cmlidXRlTWFya2VyLk5hbWVzcGFjZVVSSSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICdXZSBkbyBub3QgbWF0Y2ggZGlyZWN0aXZlcyBvbiBuYW1lc3BhY2VkIGF0dHJpYnV0ZXMnKTtcbiAgICAgICAgICBub2RlQXR0clZhbHVlID0gbm9kZUF0dHJzW2F0dHJJbmRleEluTm9kZSArIDFdIGFzIHN0cmluZztcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGNvbXBhcmVBZ2FpbnN0Q2xhc3NOYW1lID0gbW9kZSAmIFNlbGVjdG9yRmxhZ3MuQ0xBU1MgPyBub2RlQXR0clZhbHVlIDogbnVsbDtcbiAgICAgICAgaWYgKGNvbXBhcmVBZ2FpbnN0Q2xhc3NOYW1lICYmXG4gICAgICAgICAgICAgICAgIWlzQ3NzQ2xhc3NNYXRjaGluZyhjb21wYXJlQWdhaW5zdENsYXNzTmFtZSwgc2VsZWN0b3JBdHRyVmFsdWUgYXMgc3RyaW5nKSB8fFxuICAgICAgICAgICAgbW9kZSAmIFNlbGVjdG9yRmxhZ3MuQVRUUklCVVRFICYmIHNlbGVjdG9yQXR0clZhbHVlICE9PSBub2RlQXR0clZhbHVlKSB7XG4gICAgICAgICAgaWYgKGlzUG9zaXRpdmUobW9kZSkpIHJldHVybiBmYWxzZTtcbiAgICAgICAgICBza2lwVG9OZXh0U2VsZWN0b3IgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGlzUG9zaXRpdmUobW9kZSkgfHwgc2tpcFRvTmV4dFNlbGVjdG9yO1xufVxuXG5mdW5jdGlvbiBpc1Bvc2l0aXZlKG1vZGU6IFNlbGVjdG9yRmxhZ3MpOiBib29sZWFuIHtcbiAgcmV0dXJuIChtb2RlICYgU2VsZWN0b3JGbGFncy5OT1QpID09PSAwO1xufVxuXG5mdW5jdGlvbiByZWFkQ2xhc3NWYWx1ZUZyb21UTm9kZSh0Tm9kZTogVE5vZGUpOiBzdHJpbmcge1xuICAvLyBjb21wYXJpbmcgYWdhaW5zdCBDU1MgY2xhc3MgdmFsdWVzIGlzIGNvbXBsZXggYmVjYXVzZSB0aGUgY29tcGlsZXIgZG9lc24ndCBwbGFjZSB0aGVtIGFzXG4gIC8vIHJlZ3VsYXIgYXR0cmlidXRlcyB3aGVuIGFuIGVsZW1lbnQgaXMgY3JlYXRlZC4gSW5zdGVhZCwgdGhlIGNsYXNzZXMgKGFuZCBzdHlsZXMgZm9yXG4gIC8vIHRoYXQgbWF0dGVyKSBhcmUgcGxhY2VkIGluIGEgc3BlY2lhbCBzdHlsaW5nIGNvbnRleHQgdGhhdCBpcyB1c2VkIGZvciByZXNvbHZpbmcgYWxsXG4gIC8vIGNsYXNzL3N0eWxlIHZhbHVlcyBhY3Jvc3Mgc3RhdGljIGF0dHJpYnV0ZXMsIFtzdHlsZV0vW2NsYXNzXSBhbmQgW3N0eWxlLnByb3BdL1tjbGFzcy5uYW1lXVxuICAvLyBiaW5kaW5ncy4gVGhlcmVmb3JlIGlmIGFuZCB3aGVuIHRoZSBzdHlsaW5nIGNvbnRleHQgZXhpc3RzIHRoZW4gdGhlIGNsYXNzIHZhbHVlcyBhcmUgdG8gYmVcbiAgLy8gZXh0cmFjdGVkIGJ5IHRoZSBjb250ZXh0IGhlbHBlciBjb2RlIGJlbG93Li4uXG4gIHJldHVybiB0Tm9kZS5zdHlsaW5nVGVtcGxhdGUgPyBnZXRJbml0aWFsQ2xhc3NOYW1lVmFsdWUodE5vZGUuc3R5bGluZ1RlbXBsYXRlKSA6ICcnO1xufVxuXG4vKipcbiAqIEV4YW1pbmVzIHRoZSBhdHRyaWJ1dGUncyBkZWZpbml0aW9uIGFycmF5IGZvciBhIG5vZGUgdG8gZmluZCB0aGUgaW5kZXggb2YgdGhlXG4gKiBhdHRyaWJ1dGUgdGhhdCBtYXRjaGVzIHRoZSBnaXZlbiBgbmFtZWAuXG4gKlxuICogTk9URTogVGhpcyB3aWxsIG5vdCBtYXRjaCBuYW1lc3BhY2VkIGF0dHJpYnV0ZXMuXG4gKlxuICogQXR0cmlidXRlIG1hdGNoaW5nIGRlcGVuZHMgdXBvbiBgaXNJbmxpbmVUZW1wbGF0ZWAgYW5kIGBpc1Byb2plY3Rpb25Nb2RlYC5cbiAqIFRoZSBmb2xsb3dpbmcgdGFibGUgc3VtbWFyaXplcyB3aGljaCB0eXBlcyBvZiBhdHRyaWJ1dGVzIHdlIGF0dGVtcHQgdG8gbWF0Y2g6XG4gKlxuICogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAqIE1vZGVzICAgICAgICAgICAgICAgICAgIHwgTm9ybWFsIEF0dHJpYnV0ZXMgfCBCaW5kaW5ncyBBdHRyaWJ1dGVzIHwgVGVtcGxhdGUgQXR0cmlidXRlc1xuICogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAqIElubGluZSArIFByb2plY3Rpb24gICAgIHwgWUVTICAgICAgICAgICAgICAgfCBZRVMgICAgICAgICAgICAgICAgIHwgTk9cbiAqIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gKiBJbmxpbmUgKyBEaXJlY3RpdmUgICAgICB8IE5PICAgICAgICAgICAgICAgIHwgTk8gICAgICAgICAgICAgICAgICB8IFlFU1xuICogLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAqIE5vbi1pbmxpbmUgKyBQcm9qZWN0aW9uIHwgWUVTICAgICAgICAgICAgICAgfCBZRVMgICAgICAgICAgICAgICAgIHwgTk9cbiAqIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gKiBOb24taW5saW5lICsgRGlyZWN0aXZlICB8IFlFUyAgICAgICAgICAgICAgIHwgWUVTICAgICAgICAgICAgICAgICB8IE5PXG4gKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICpcbiAqIEBwYXJhbSBuYW1lIHRoZSBuYW1lIG9mIHRoZSBhdHRyaWJ1dGUgdG8gZmluZFxuICogQHBhcmFtIGF0dHJzIHRoZSBhdHRyaWJ1dGUgYXJyYXkgdG8gZXhhbWluZVxuICogQHBhcmFtIGlzSW5saW5lVGVtcGxhdGUgdHJ1ZSBpZiB0aGUgbm9kZSBiZWluZyBtYXRjaGVkIGlzIGFuIGlubGluZSB0ZW1wbGF0ZSAoZS5nLiBgKm5nRm9yYClcbiAqIHJhdGhlciB0aGFuIGEgbWFudWFsbHkgZXhwYW5kZWQgdGVtcGxhdGUgbm9kZSAoZS5nIGA8bmctdGVtcGxhdGU+YCkuXG4gKiBAcGFyYW0gaXNQcm9qZWN0aW9uTW9kZSB0cnVlIGlmIHdlIGFyZSBtYXRjaGluZyBhZ2FpbnN0IGNvbnRlbnQgcHJvamVjdGlvbiBvdGhlcndpc2Ugd2UgYXJlXG4gKiBtYXRjaGluZyBhZ2FpbnN0IGRpcmVjdGl2ZXMuXG4gKi9cbmZ1bmN0aW9uIGZpbmRBdHRySW5kZXhJbk5vZGUoXG4gICAgbmFtZTogc3RyaW5nLCBhdHRyczogVEF0dHJpYnV0ZXMgfCBudWxsLCBpc0lubGluZVRlbXBsYXRlOiBib29sZWFuLFxuICAgIGlzUHJvamVjdGlvbk1vZGU6IGJvb2xlYW4pOiBudW1iZXIge1xuICBpZiAoYXR0cnMgPT09IG51bGwpIHJldHVybiAtMTtcblxuICBsZXQgaSA9IDA7XG5cbiAgaWYgKGlzUHJvamVjdGlvbk1vZGUgfHwgIWlzSW5saW5lVGVtcGxhdGUpIHtcbiAgICBsZXQgYmluZGluZ3NNb2RlID0gZmFsc2U7XG4gICAgd2hpbGUgKGkgPCBhdHRycy5sZW5ndGgpIHtcbiAgICAgIGNvbnN0IG1heWJlQXR0ck5hbWUgPSBhdHRyc1tpXTtcbiAgICAgIGlmIChtYXliZUF0dHJOYW1lID09PSBuYW1lKSB7XG4gICAgICAgIHJldHVybiBpO1xuICAgICAgfSBlbHNlIGlmIChtYXliZUF0dHJOYW1lID09PSBBdHRyaWJ1dGVNYXJrZXIuQmluZGluZ3MpIHtcbiAgICAgICAgYmluZGluZ3NNb2RlID0gdHJ1ZTtcbiAgICAgIH0gZWxzZSBpZiAobWF5YmVBdHRyTmFtZSA9PT0gQXR0cmlidXRlTWFya2VyLlRlbXBsYXRlKSB7XG4gICAgICAgIC8vIFdlIGRvIG5vdCBjYXJlIGFib3V0IFRlbXBsYXRlIGF0dHJpYnV0ZXMgaW4gdGhpcyBzY2VuYXJpby5cbiAgICAgICAgYnJlYWs7XG4gICAgICB9IGVsc2UgaWYgKG1heWJlQXR0ck5hbWUgPT09IEF0dHJpYnV0ZU1hcmtlci5OYW1lc3BhY2VVUkkpIHtcbiAgICAgICAgLy8gU2tpcCB0aGUgd2hvbGUgbmFtZXNwYWNlZCBhdHRyaWJ1dGUgYW5kIHZhbHVlLiBUaGlzIGlzIGJ5IGRlc2lnbi5cbiAgICAgICAgaSArPSA0O1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIC8vIEluIGJpbmRpbmcgbW9kZSB0aGVyZSBhcmUgb25seSBuYW1lcywgcmF0aGVyIHRoYW4gbmFtZS12YWx1ZSBwYWlycy5cbiAgICAgIGkgKz0gYmluZGluZ3NNb2RlID8gMSA6IDI7XG4gICAgfVxuICAgIC8vIFdlIGRpZCBub3QgbWF0Y2ggdGhlIGF0dHJpYnV0ZVxuICAgIHJldHVybiAtMTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gbWF0Y2hUZW1wbGF0ZUF0dHJpYnV0ZShhdHRycywgbmFtZSk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzTm9kZU1hdGNoaW5nU2VsZWN0b3JMaXN0KFxuICAgIHROb2RlOiBUTm9kZSwgc2VsZWN0b3I6IENzc1NlbGVjdG9yTGlzdCwgaXNQcm9qZWN0aW9uTW9kZTogYm9vbGVhbiA9IGZhbHNlKTogYm9vbGVhbiB7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgc2VsZWN0b3IubGVuZ3RoOyBpKyspIHtcbiAgICBpZiAoaXNOb2RlTWF0Y2hpbmdTZWxlY3Rvcih0Tm9kZSwgc2VsZWN0b3JbaV0sIGlzUHJvamVjdGlvbk1vZGUpKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gZmFsc2U7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRQcm9qZWN0QXNBdHRyVmFsdWUodE5vZGU6IFROb2RlKTogc3RyaW5nfG51bGwge1xuICBjb25zdCBub2RlQXR0cnMgPSB0Tm9kZS5hdHRycztcbiAgaWYgKG5vZGVBdHRycyAhPSBudWxsKSB7XG4gICAgY29uc3QgbmdQcm9qZWN0QXNBdHRySWR4ID0gbm9kZUF0dHJzLmluZGV4T2YoTkdfUFJPSkVDVF9BU19BVFRSX05BTUUpO1xuICAgIC8vIG9ubHkgY2hlY2sgZm9yIG5nUHJvamVjdEFzIGluIGF0dHJpYnV0ZSBuYW1lcywgZG9uJ3QgYWNjaWRlbnRhbGx5IG1hdGNoIGF0dHJpYnV0ZSdzIHZhbHVlXG4gICAgLy8gKGF0dHJpYnV0ZSBuYW1lcyBhcmUgc3RvcmVkIGF0IGV2ZW4gaW5kZXhlcylcbiAgICBpZiAoKG5nUHJvamVjdEFzQXR0cklkeCAmIDEpID09PSAwKSB7XG4gICAgICByZXR1cm4gbm9kZUF0dHJzW25nUHJvamVjdEFzQXR0cklkeCArIDFdIGFzIHN0cmluZztcbiAgICB9XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbi8qKlxuICogQ2hlY2tzIGEgZ2l2ZW4gbm9kZSBhZ2FpbnN0IG1hdGNoaW5nIHByb2plY3Rpb24gc2VsZWN0b3JzIGFuZCByZXR1cm5zXG4gKiBzZWxlY3RvciBpbmRleCAob3IgMCBpZiBub25lIG1hdGNoZWQpLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gdGFrZXMgaW50byBhY2NvdW50IHRoZSBuZ1Byb2plY3RBcyBhdHRyaWJ1dGU6IGlmIHByZXNlbnQgaXRzIHZhbHVlIHdpbGwgYmVcbiAqIGNvbXBhcmVkIHRvIHRoZSByYXcgKHVuLXBhcnNlZCkgQ1NTIHNlbGVjdG9yIGluc3RlYWQgb2YgdXNpbmcgc3RhbmRhcmQgc2VsZWN0b3IgbWF0Y2hpbmcgbG9naWMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBtYXRjaGluZ1Byb2plY3Rpb25TZWxlY3RvckluZGV4KFxuICAgIHROb2RlOiBUTm9kZSwgc2VsZWN0b3JzOiBDc3NTZWxlY3Rvckxpc3RbXSwgdGV4dFNlbGVjdG9yczogc3RyaW5nW10pOiBudW1iZXIge1xuICBjb25zdCBuZ1Byb2plY3RBc0F0dHJWYWwgPSBnZXRQcm9qZWN0QXNBdHRyVmFsdWUodE5vZGUpO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IHNlbGVjdG9ycy5sZW5ndGg7IGkrKykge1xuICAgIC8vIGlmIGEgbm9kZSBoYXMgdGhlIG5nUHJvamVjdEFzIGF0dHJpYnV0ZSBtYXRjaCBpdCBhZ2FpbnN0IHVucGFyc2VkIHNlbGVjdG9yXG4gICAgLy8gbWF0Y2ggYSBub2RlIGFnYWluc3QgYSBwYXJzZWQgc2VsZWN0b3Igb25seSBpZiBuZ1Byb2plY3RBcyBhdHRyaWJ1dGUgaXMgbm90IHByZXNlbnRcbiAgICBpZiAobmdQcm9qZWN0QXNBdHRyVmFsID09PSB0ZXh0U2VsZWN0b3JzW2ldIHx8XG4gICAgICAgIG5nUHJvamVjdEFzQXR0clZhbCA9PT0gbnVsbCAmJlxuICAgICAgICAgICAgaXNOb2RlTWF0Y2hpbmdTZWxlY3Rvckxpc3QodE5vZGUsIHNlbGVjdG9yc1tpXSwgLyogaXNQcm9qZWN0aW9uTW9kZSAqLyB0cnVlKSkge1xuICAgICAgcmV0dXJuIGkgKyAxOyAgLy8gZmlyc3QgbWF0Y2hpbmcgc2VsZWN0b3IgXCJjYXB0dXJlc1wiIGEgZ2l2ZW4gbm9kZVxuICAgIH1cbiAgfVxuICByZXR1cm4gMDtcbn1cblxuZnVuY3Rpb24gZ2V0TmFtZU9ubHlNYXJrZXJJbmRleChub2RlQXR0cnM6IFRBdHRyaWJ1dGVzKSB7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgbm9kZUF0dHJzLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3Qgbm9kZUF0dHIgPSBub2RlQXR0cnNbaV07XG4gICAgaWYgKGlzTmFtZU9ubHlBdHRyaWJ1dGVNYXJrZXIobm9kZUF0dHIpKSB7XG4gICAgICByZXR1cm4gaTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIG5vZGVBdHRycy5sZW5ndGg7XG59XG5cbmZ1bmN0aW9uIG1hdGNoVGVtcGxhdGVBdHRyaWJ1dGUoYXR0cnM6IFRBdHRyaWJ1dGVzLCBuYW1lOiBzdHJpbmcpOiBudW1iZXIge1xuICBsZXQgaSA9IGF0dHJzLmluZGV4T2YoQXR0cmlidXRlTWFya2VyLlRlbXBsYXRlKTtcbiAgaWYgKGkgPiAtMSkge1xuICAgIGkrKztcbiAgICB3aGlsZSAoaSA8IGF0dHJzLmxlbmd0aCkge1xuICAgICAgaWYgKGF0dHJzW2ldID09PSBuYW1lKSByZXR1cm4gaTtcbiAgICAgIGkrKztcbiAgICB9XG4gIH1cbiAgcmV0dXJuIC0xO1xufVxuIl19