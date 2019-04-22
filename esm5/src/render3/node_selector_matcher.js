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
 * directive matching mode:
 * - in the "directive matching" mode we do _not_ take TContainer's tagName into account if it is
 * different from NG_TEMPLATE_SELECTOR (value different from NG_TEMPLATE_SELECTOR indicates that a
 * tag name was extracted from * syntax so we would match the same directive twice);
 * - in the "projection" mode, we use a tag name potentially extracted from the * syntax processing
 * (applicable to TNodeType.Container only).
 */
function hasTagAndTypeMatch(tNode, currentSelector, isProjectionMode) {
    var tagNameToCompare = tNode.type === 0 /* Container */ && !isProjectionMode ?
        NG_TEMPLATE_SELECTOR :
        tNode.tagName;
    return currentSelector === tagNameToCompare;
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
            else if (maybeAttrName === 1 /* Classes */) {
                var value = attrs[++i];
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
        var ngProjectAsAttrIdx = nodeAttrs.indexOf(5 /* ProjectAs */);
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
 * This function takes into account the parsed ngProjectAs selector from the node's attributes.
 * If present, it will check whether the ngProjectAs selector matches any of the projection
 * selectors.
 */
export function matchingProjectionSelectorIndex(tNode, selectors) {
    var ngProjectAsAttrVal = getProjectAsAttrValue(tNode);
    for (var i = 0; i < selectors.length; i++) {
        // If we ran into an `ngProjectAs` attribute, we should match its parsed selector
        // to the list of selectors, otherwise we fall back to matching against the node.
        if (ngProjectAsAttrVal === null ?
            isNodeMatchingSelectorList(tNode, selectors[i], /* isProjectionMode */ true) :
            isSelectorInSelectorList(ngProjectAsAttrVal, selectors[i])) {
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
/**
 * Checks whether a selector is inside a CssSelectorList
 * @param selector Selector to be checked.
 * @param list List in which to look for the selector.
 */
function isSelectorInSelectorList(selector, list) {
    selectorListLoop: for (var i = 0; i < list.length; i++) {
        var currentSelectorInList = list[i];
        if (selector.length !== currentSelectorInList.length) {
            continue;
        }
        for (var j = 0; j < selector.length; j++) {
            if (selector[j] !== currentSelectorInList[j]) {
                continue selectorListLoop;
            }
        }
        return true;
    }
    return false;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9kZV9zZWxlY3Rvcl9tYXRjaGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9ub2RlX3NlbGVjdG9yX21hdGNoZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxxQkFBcUIsQ0FBQztBQUU3QixPQUFPLEVBQUMsYUFBYSxFQUFFLGNBQWMsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBRTdELE9BQU8sRUFBaUQsNkJBQTZCLElBQUksT0FBTyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDM0gsT0FBTyxFQUE4Qyw2QkFBNkIsSUFBSSxPQUFPLEVBQUMsTUFBTSx5QkFBeUIsQ0FBQztBQUM5SCxPQUFPLEVBQUMsd0JBQXdCLEVBQUMsTUFBTSxvQ0FBb0MsQ0FBQztBQUM1RSxPQUFPLEVBQUMseUJBQXlCLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUU3RCxJQUFNLHVCQUF1QixHQUFHLE9BQU8sR0FBRyxPQUFPLENBQUM7QUFFbEQsSUFBTSxvQkFBb0IsR0FBRyxhQUFhLENBQUM7QUFFM0MsU0FBUyxrQkFBa0IsQ0FBQyxnQkFBd0IsRUFBRSxlQUF1QjtJQUMzRSxJQUFNLGNBQWMsR0FBRyxnQkFBZ0IsQ0FBQyxNQUFNLENBQUM7SUFDL0MsSUFBTSxVQUFVLEdBQUcsZ0JBQWtCLENBQUMsT0FBTyxDQUFDLGVBQWUsQ0FBQyxDQUFDO0lBQy9ELElBQU0sV0FBVyxHQUFHLFVBQVUsR0FBRyxlQUFlLENBQUMsTUFBTSxDQUFDO0lBQ3hELElBQUksVUFBVSxLQUFLLENBQUMsQ0FBQyxDQUFrRCxXQUFXO1dBQzNFLENBQUMsVUFBVSxHQUFHLENBQUMsSUFBSSxnQkFBa0IsQ0FBQyxVQUFVLEdBQUcsQ0FBQyxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUUsa0JBQWtCOztZQUVyRixDQUFDLFdBQVcsR0FBRyxjQUFj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LENBQUM7S0FDYjtJQUNELE9BQU8sS0FBSyxDQUFDO0FBQ2YsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0ICcuLi91dGlsL25nX2Rldl9tb2RlJztcblxuaW1wb3J0IHthc3NlcnREZWZpbmVkLCBhc3NlcnROb3RFcXVhbH0gZnJvbSAnLi4vdXRpbC9hc3NlcnQnO1xuXG5pbXBvcnQge0F0dHJpYnV0ZU1hcmtlciwgVEF0dHJpYnV0ZXMsIFROb2RlLCBUTm9kZVR5cGUsIHVudXNlZFZhbHVlRXhwb3J0VG9QbGFjYXRlQWpkIGFzIHVudXNlZDF9IGZyb20gJy4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7Q3NzU2VsZWN0b3IsIENzc1NlbGVjdG9yTGlzdCwgU2VsZWN0b3JGbGFncywgdW51c2VkVmFsdWVFeHBvcnRUb1BsYWNhdGVBamQgYXMgdW51c2VkMn0gZnJvbSAnLi9pbnRlcmZhY2VzL3Byb2plY3Rpb24nO1xuaW1wb3J0IHtnZXRJbml0aWFsQ2xhc3NOYW1lVmFsdWV9IGZyb20gJy4vc3R5bGluZy9jbGFzc19hbmRfc3R5bGVfYmluZGluZ3MnO1xuaW1wb3J0IHtpc05hbWVPbmx5QXR0cmlidXRlTWFya2VyfSBmcm9tICcuL3V0aWwvYXR0cnNfdXRpbHMnO1xuXG5jb25zdCB1bnVzZWRWYWx1ZVRvUGxhY2F0ZUFqZCA9IHVudXNlZDEgKyB1bnVzZWQyO1xuXG5jb25zdCBOR19URU1QTEFURV9TRUxFQ1RPUiA9ICduZy10ZW1wbGF0ZSc7XG5cbmZ1bmN0aW9uIGlzQ3NzQ2xhc3NNYXRjaGluZyhub2RlQ2xhc3NBdHRyVmFsOiBzdHJpbmcsIGNzc0NsYXNzVG9NYXRjaDogc3RyaW5nKTogYm9vbGVhbiB7XG4gIGNvbnN0IG5vZGVDbGFzc2VzTGVuID0gbm9kZUNsYXNzQXR0clZhbC5sZW5ndGg7XG4gIGNvbnN0IG1hdGNoSW5kZXggPSBub2RlQ2xhc3NBdHRyVmFsICEuaW5kZXhPZihjc3NDbGFzc1RvTWF0Y2gpO1xuICBjb25zdCBtYXRjaEVuZElkeCA9IG1hdGNoSW5kZXggKyBjc3NDbGFzc1RvTWF0Y2gubGVuZ3RoO1xuICBpZiAobWF0Y2hJbmRleCA9PT0gLTEgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIG5vIG1hdGNoXG4gICAgICB8fCAobWF0Y2hJbmRleCA+IDAgJiYgbm9kZUNsYXNzQXR0clZhbCAhW21hdGNoSW5kZXggLSAxXSAhPT0gJyAnKSAgLy8gbm8gc3BhY2UgYmVmb3JlXG4gICAgICB8fFxuICAgICAgKG1hdGNoRW5kSWR4IDwgbm9kZUNsYXNzZXNMZW4gJiYgbm9kZUNsYXNzQXR0clZhbCAhW21hdGNoRW5kSWR4XSAhPT0gJyAnKSkgIC8vIG5vIHNwYWNlIGFmdGVyXG4gIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgcmV0dXJuIHRydWU7XG59XG5cbi8qKlxuICogRnVuY3Rpb24gdGhhdCBjaGVja3Mgd2hldGhlciBhIGdpdmVuIHROb2RlIG1hdGNoZXMgdGFnLWJhc2VkIHNlbGVjdG9yIGFuZCBoYXMgYSB2YWxpZCB0eXBlLlxuICpcbiAqIE1hdGNoaW5nIGNhbiBiZSBwZXJmb3JtZWQgaW4gMiBtb2RlczogcHJvamVjdGlvbiBtb2RlICh3aGVuIHdlIHByb2plY3Qgbm9kZXMpIGFuZCByZWd1bGFyXG4gKiBkaXJlY3RpdmUgbWF0Y2hpbmcgbW9kZTpcbiAqIC0gaW4gdGhlIFwiZGlyZWN0aXZlIG1hdGNoaW5nXCIgbW9kZSB3ZSBkbyBfbm90XyB0YWtlIFRDb250YWluZXIncyB0YWdOYW1lIGludG8gYWNjb3VudCBpZiBpdCBpc1xuICogZGlmZmVyZW50IGZyb20gTkdfVEVNUExBVEVfU0VMRUNUT1IgKHZhbHVlIGRpZmZlcmVudCBmcm9tIE5HX1RFTVBMQVRFX1NFTEVDVE9SIGluZGljYXRlcyB0aGF0IGFcbiAqIHRhZyBuYW1lIHdhcyBleHRyYWN0ZWQgZnJvbSAqIHN5bnRheCBzbyB3ZSB3b3VsZCBtYXRjaCB0aGUgc2FtZSBkaXJlY3RpdmUgdHdpY2UpO1xuICogLSBpbiB0aGUgXCJwcm9qZWN0aW9uXCIgbW9kZSwgd2UgdXNlIGEgdGFnIG5hbWUgcG90ZW50aWFsbHkgZXh0cmFjdGVkIGZyb20gdGhlICogc3ludGF4IHByb2Nlc3NpbmdcbiAqIChhcHBsaWNhYmxlIHRvIFROb2RlVHlwZS5Db250YWluZXIgb25seSkuXG4gKi9cbmZ1bmN0aW9uIGhhc1RhZ0FuZFR5cGVNYXRjaChcbiAgICB0Tm9kZTogVE5vZGUsIGN1cnJlbnRTZWxlY3Rvcjogc3RyaW5nLCBpc1Byb2plY3Rpb25Nb2RlOiBib29sZWFuKTogYm9vbGVhbiB7XG4gIGNvbnN0IHRhZ05hbWVUb0NvbXBhcmUgPSB0Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuQ29udGFpbmVyICYmICFpc1Byb2plY3Rpb25Nb2RlID9cbiAgICAgIE5HX1RFTVBMQVRFX1NFTEVDVE9SIDpcbiAgICAgIHROb2RlLnRhZ05hbWU7XG4gIHJldHVybiBjdXJyZW50U2VsZWN0b3IgPT09IHRhZ05hbWVUb0NvbXBhcmU7XG59XG5cbi8qKlxuICogQSB1dGlsaXR5IGZ1bmN0aW9uIHRvIG1hdGNoIGFuIEl2eSBub2RlIHN0YXRpYyBkYXRhIGFnYWluc3QgYSBzaW1wbGUgQ1NTIHNlbGVjdG9yXG4gKlxuICogQHBhcmFtIG5vZGUgc3RhdGljIGRhdGEgb2YgdGhlIG5vZGUgdG8gbWF0Y2hcbiAqIEBwYXJhbSBzZWxlY3RvciBUaGUgc2VsZWN0b3IgdG8gdHJ5IG1hdGNoaW5nIGFnYWluc3QgdGhlIG5vZGUuXG4gKiBAcGFyYW0gaXNQcm9qZWN0aW9uTW9kZSBpZiBgdHJ1ZWAgd2UgYXJlIG1hdGNoaW5nIGZvciBjb250ZW50IHByb2plY3Rpb24sIG90aGVyd2lzZSB3ZSBhcmUgZG9pbmdcbiAqIGRpcmVjdGl2ZSBtYXRjaGluZy5cbiAqIEByZXR1cm5zIHRydWUgaWYgbm9kZSBtYXRjaGVzIHRoZSBzZWxlY3Rvci5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzTm9kZU1hdGNoaW5nU2VsZWN0b3IoXG4gICAgdE5vZGU6IFROb2RlLCBzZWxlY3RvcjogQ3NzU2VsZWN0b3IsIGlzUHJvamVjdGlvbk1vZGU6IGJvb2xlYW4pOiBib29sZWFuIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQoc2VsZWN0b3JbMF0sICdTZWxlY3RvciBzaG91bGQgaGF2ZSBhIHRhZyBuYW1lJyk7XG4gIGxldCBtb2RlOiBTZWxlY3RvckZsYWdzID0gU2VsZWN0b3JGbGFncy5FTEVNRU5UO1xuICBjb25zdCBub2RlQXR0cnMgPSB0Tm9kZS5hdHRycyB8fCBbXTtcblxuICAvLyBGaW5kIHRoZSBpbmRleCBvZiBmaXJzdCBhdHRyaWJ1dGUgdGhhdCBoYXMgbm8gdmFsdWUsIG9ubHkgYSBuYW1lLlxuICBjb25zdCBuYW1lT25seU1hcmtlcklkeCA9IGdldE5hbWVPbmx5TWFya2VySW5kZXgobm9kZUF0dHJzKTtcblxuICAvLyBXaGVuIHByb2Nlc3NpbmcgXCI6bm90XCIgc2VsZWN0b3JzLCB3ZSBza2lwIHRvIHRoZSBuZXh0IFwiOm5vdFwiIGlmIHRoZVxuICAvLyBjdXJyZW50IG9uZSBkb2Vzbid0IG1hdGNoXG4gIGxldCBza2lwVG9OZXh0U2VsZWN0b3IgPSBmYWxzZTtcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IHNlbGVjdG9yLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgY3VycmVudCA9IHNlbGVjdG9yW2ldO1xuICAgIGlmICh0eXBlb2YgY3VycmVudCA9PT0gJ251bWJlcicpIHtcbiAgICAgIC8vIElmIHdlIGZpbmlzaCBwcm9jZXNzaW5nIGEgOm5vdCBzZWxlY3RvciBhbmQgaXQgaGFzbid0IGZhaWxlZCwgcmV0dXJuIGZhbHNlXG4gICAgICBpZiAoIXNraXBUb05leHRTZWxlY3RvciAmJiAhaXNQb3NpdGl2ZShtb2RlKSAmJiAhaXNQb3NpdGl2ZShjdXJyZW50IGFzIG51bWJlcikpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgLy8gSWYgd2UgYXJlIHNraXBwaW5nIHRvIHRoZSBuZXh0IDpub3QoKSBhbmQgdGhpcyBtb2RlIGZsYWcgaXMgcG9zaXRpdmUsXG4gICAgICAvLyBpdCdzIGEgcGFydCBvZiB0aGUgY3VycmVudCA6bm90KCkgc2VsZWN0b3IsIGFuZCB3ZSBzaG91bGQga2VlcCBza2lwcGluZ1xuICAgICAgaWYgKHNraXBUb05leHRTZWxlY3RvciAmJiBpc1Bvc2l0aXZlKGN1cnJlbnQpKSBjb250aW51ZTtcbiAgICAgIHNraXBUb05leHRTZWxlY3RvciA9IGZhbHNlO1xuICAgICAgbW9kZSA9IChjdXJyZW50IGFzIG51bWJlcikgfCAobW9kZSAmIFNlbGVjdG9yRmxhZ3MuTk9UKTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmIChza2lwVG9OZXh0U2VsZWN0b3IpIGNvbnRpbnVlO1xuXG4gICAgaWYgKG1vZGUgJiBTZWxlY3RvckZsYWdzLkVMRU1FTlQpIHtcbiAgICAgIG1vZGUgPSBTZWxlY3RvckZsYWdzLkFUVFJJQlVURSB8IG1vZGUgJiBTZWxlY3RvckZsYWdzLk5PVDtcbiAgICAgIGlmIChjdXJyZW50ICE9PSAnJyAmJiAhaGFzVGFnQW5kVHlwZU1hdGNoKHROb2RlLCBjdXJyZW50LCBpc1Byb2plY3Rpb25Nb2RlKSB8fFxuICAgICAgICAgIGN1cnJlbnQgPT09ICcnICYmIHNlbGVjdG9yLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICBpZiAoaXNQb3NpdGl2ZShtb2RlKSkgcmV0dXJuIGZhbHNlO1xuICAgICAgICBza2lwVG9OZXh0U2VsZWN0b3IgPSB0cnVlO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBzZWxlY3RvckF0dHJWYWx1ZSA9IG1vZGUgJiBTZWxlY3RvckZsYWdzLkNMQVNTID8gY3VycmVudCA6IHNlbGVjdG9yWysraV07XG5cbiAgICAgIC8vIHNwZWNpYWwgY2FzZSBmb3IgbWF0Y2hpbmcgYWdhaW5zdCBjbGFzc2VzIHdoZW4gYSB0Tm9kZSBoYXMgYmVlbiBpbnN0YW50aWF0ZWQgd2l0aFxuICAgICAgLy8gY2xhc3MgYW5kIHN0eWxlIHZhbHVlcyBhcyBzZXBhcmF0ZSBhdHRyaWJ1dGUgdmFsdWVzIChlLmcuIFsndGl0bGUnLCBDTEFTUywgJ2ZvbyddKVxuICAgICAgaWYgKChtb2RlICYgU2VsZWN0b3JGbGFncy5DTEFTUykgJiYgdE5vZGUuc3R5bGluZ1RlbXBsYXRlKSB7XG4gICAgICAgIGlmICghaXNDc3NDbGFzc01hdGNoaW5nKHJlYWRDbGFzc1ZhbHVlRnJvbVROb2RlKHROb2RlKSwgc2VsZWN0b3JBdHRyVmFsdWUgYXMgc3RyaW5nKSkge1xuICAgICAgICAgIGlmIChpc1Bvc2l0aXZlKG1vZGUpKSByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgc2tpcFRvTmV4dFNlbGVjdG9yID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgaXNJbmxpbmVUZW1wbGF0ZSA9XG4gICAgICAgICAgdE5vZGUudHlwZSA9PSBUTm9kZVR5cGUuQ29udGFpbmVyICYmIHROb2RlLnRhZ05hbWUgIT09IE5HX1RFTVBMQVRFX1NFTEVDVE9SO1xuICAgICAgY29uc3QgYXR0ck5hbWUgPSAobW9kZSAmIFNlbGVjdG9yRmxhZ3MuQ0xBU1MpID8gJ2NsYXNzJyA6IGN1cnJlbnQ7XG4gICAgICBjb25zdCBhdHRySW5kZXhJbk5vZGUgPVxuICAgICAgICAgIGZpbmRBdHRySW5kZXhJbk5vZGUoYXR0ck5hbWUsIG5vZGVBdHRycywgaXNJbmxpbmVUZW1wbGF0ZSwgaXNQcm9qZWN0aW9uTW9kZSk7XG5cbiAgICAgIGlmIChhdHRySW5kZXhJbk5vZGUgPT09IC0xKSB7XG4gICAgICAgIGlmIChpc1Bvc2l0aXZlKG1vZGUpKSByZXR1cm4gZmFsc2U7XG4gICAgICAgIHNraXBUb05leHRTZWxlY3RvciA9IHRydWU7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBpZiAoc2VsZWN0b3JBdHRyVmFsdWUgIT09ICcnKSB7XG4gICAgICAgIGxldCBub2RlQXR0clZhbHVlOiBzdHJpbmc7XG4gICAgICAgIGlmIChhdHRySW5kZXhJbk5vZGUgPiBuYW1lT25seU1hcmtlcklkeCkge1xuICAgICAgICAgIG5vZGVBdHRyVmFsdWUgPSAnJztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm90RXF1YWwoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlQXR0cnNbYXR0ckluZGV4SW5Ob2RlXSwgQXR0cmlidXRlTWFya2VyLk5hbWVzcGFjZVVSSSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICdXZSBkbyBub3QgbWF0Y2ggZGlyZWN0aXZlcyBvbiBuYW1lc3BhY2VkIGF0dHJpYnV0ZXMnKTtcbiAgICAgICAgICBub2RlQXR0clZhbHVlID0gbm9kZUF0dHJzW2F0dHJJbmRleEluTm9kZSArIDFdIGFzIHN0cmluZztcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGNvbXBhcmVBZ2FpbnN0Q2xhc3NOYW1lID0gbW9kZSAmIFNlbGVjdG9yRmxhZ3MuQ0xBU1MgPyBub2RlQXR0clZhbHVlIDogbnVsbDtcbiAgICAgICAgaWYgKGNvbXBhcmVBZ2FpbnN0Q2xhc3NOYW1lICYmXG4gICAgICAgICAgICAgICAgIWlzQ3NzQ2xhc3NNYXRjaGluZyhjb21wYXJlQWdhaW5zdENsYXNzTmFtZSwgc2VsZWN0b3JBdHRyVmFsdWUgYXMgc3RyaW5nKSB8fFxuICAgICAgICAgICAgbW9kZSAmIFNlbGVjdG9yRmxhZ3MuQVRUUklCVVRFICYmIHNlbGVjdG9yQXR0clZhbHVlICE9PSBub2RlQXR0clZhbHVlKSB7XG4gICAgICAgICAgaWYgKGlzUG9zaXRpdmUobW9kZSkpIHJldHVybiBmYWxzZTtcbiAgICAgICAgICBza2lwVG9OZXh0U2VsZWN0b3IgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGlzUG9zaXRpdmUobW9kZSkgfHwgc2tpcFRvTmV4dFNlbGVjdG9yO1xufVxuXG5mdW5jdGlvbiBpc1Bvc2l0aXZlKG1vZGU6IFNlbGVjdG9yRmxhZ3MpOiBib29sZWFuIHtcbiAgcmV0dXJuIChtb2RlICYgU2VsZWN0b3JGbGFncy5OT1QpID09PSAwO1xufVxuXG5mdW5jdGlvbiByZWFkQ2xhc3NWYWx1ZUZyb21UTm9kZSh0Tm9kZTogVE5vZGUpOiBzdHJpbmcge1xuICAvLyBjb21wYXJpbmcgYWdhaW5zdCBDU1MgY2xhc3MgdmFsdWVzIGlzIGNvbXBsZXggYmVjYXVzZSB0aGUgY29tcGlsZXIgZG9lc24ndCBwbGFjZSB0aGVtIGFzXG4gIC8vIHJlZ3VsYXIgYXR0cmlidXRlcyB3aGVuIGFuIGVsZW1lbnQgaXMgY3JlYXRlZC4gSW5zdGVhZCwgdGhlIGNsYXNzZXMgKGFuZCBzdHlsZXMgZm9yXG4gIC8vIHRoYXQgbWF0dGVyKSBhcmUgcGxhY2VkIGluIGEgc3BlY2lhbCBzdHlsaW5nIGNvbnRleHQgdGhhdCBpcyB1c2VkIGZvciByZXNvbHZpbmcgYWxsXG4gIC8vIGNsYXNzL3N0eWxlIHZhbHVlcyBhY3Jvc3Mgc3RhdGljIGF0dHJpYnV0ZXMsIFtzdHlsZV0vW2NsYXNzXSBhbmQgW3N0eWxlLnByb3BdL1tjbGFzcy5uYW1lXVxuICAvLyBiaW5kaW5ncy4gVGhlcmVmb3JlIGlmIGFuZCB3aGVuIHRoZSBzdHlsaW5nIGNvbnRleHQgZXhpc3RzIHRoZW4gdGhlIGNsYXNzIHZhbHVlcyBhcmUgdG8gYmVcbiAgLy8gZXh0cmFjdGVkIGJ5IHRoZSBjb250ZXh0IGhlbHBlciBjb2RlIGJlbG93Li4uXG4gIHJldHVybiB0Tm9kZS5zdHlsaW5nVGVtcGxhdGUgPyBnZXRJbml0aWFsQ2xhc3NOYW1lVmFsdWUodE5vZGUuc3R5bGluZ1RlbXBsYXRlKSA6ICcnO1xufVxuXG4vKipcbiAqIEV4YW1pbmVzIHRoZSBhdHRyaWJ1dGUncyBkZWZpbml0aW9uIGFycmF5IGZvciBhIG5vZGUgdG8gZmluZCB0aGUgaW5kZXggb2YgdGhlXG4gKiBhdHRyaWJ1dGUgdGhhdCBtYXRjaGVzIHRoZSBnaXZlbiBgbmFtZWAuXG4gKlxuICogTk9URTogVGhpcyB3aWxsIG5vdCBtYXRjaCBuYW1lc3BhY2VkIGF0dHJpYnV0ZXMuXG4gKlxuICogQXR0cmlidXRlIG1hdGNoaW5nIGRlcGVuZHMgdXBvbiBgaXNJbmxpbmVUZW1wbGF0ZWAgYW5kIGBpc1Byb2plY3Rpb25Nb2RlYC5cbiAqIFRoZSBmb2xsb3dpbmcgdGFibGUgc3VtbWFyaXplcyB3aGljaCB0eXBlcyBvZiBhdHRyaWJ1dGVzIHdlIGF0dGVtcHQgdG8gbWF0Y2g6XG4gKlxuICogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAqIE1vZGVzICAgICAgICAgICAgICAgICAgIHwgTm9ybWFsIEF0dHJpYnV0ZXMgfCBCaW5kaW5ncyBBdHRyaWJ1dGVzIHwgVGVtcGxhdGUgQXR0cmlidXRlc1xuICogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAqIElubGluZSArIFByb2plY3Rpb24gICAgIHwgWUVTICAgICAgICAgICAgICAgfCBZRVMgICAgICAgICAgICAgICAgIHwgTk9cbiAqIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gKiBJbmxpbmUgKyBEaXJlY3RpdmUgICAgICB8IE5PICAgICAgICAgICAgICAgIHwgTk8gICAgICAgICAgICAgICAgICB8IFlFU1xuICogLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAqIE5vbi1pbmxpbmUgKyBQcm9qZWN0aW9uIHwgWUVTICAgICAgICAgICAgICAgfCBZRVMgICAgICAgICAgICAgICAgIHwgTk9cbiAqIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gKiBOb24taW5saW5lICsgRGlyZWN0aXZlICB8IFlFUyAgICAgICAgICAgICAgIHwgWUVTICAgICAgICAgICAgICAgICB8IE5PXG4gKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICpcbiAqIEBwYXJhbSBuYW1lIHRoZSBuYW1lIG9mIHRoZSBhdHRyaWJ1dGUgdG8gZmluZFxuICogQHBhcmFtIGF0dHJzIHRoZSBhdHRyaWJ1dGUgYXJyYXkgdG8gZXhhbWluZVxuICogQHBhcmFtIGlzSW5saW5lVGVtcGxhdGUgdHJ1ZSBpZiB0aGUgbm9kZSBiZWluZyBtYXRjaGVkIGlzIGFuIGlubGluZSB0ZW1wbGF0ZSAoZS5nLiBgKm5nRm9yYClcbiAqIHJhdGhlciB0aGFuIGEgbWFudWFsbHkgZXhwYW5kZWQgdGVtcGxhdGUgbm9kZSAoZS5nIGA8bmctdGVtcGxhdGU+YCkuXG4gKiBAcGFyYW0gaXNQcm9qZWN0aW9uTW9kZSB0cnVlIGlmIHdlIGFyZSBtYXRjaGluZyBhZ2FpbnN0IGNvbnRlbnQgcHJvamVjdGlvbiBvdGhlcndpc2Ugd2UgYXJlXG4gKiBtYXRjaGluZyBhZ2FpbnN0IGRpcmVjdGl2ZXMuXG4gKi9cbmZ1bmN0aW9uIGZpbmRBdHRySW5kZXhJbk5vZGUoXG4gICAgbmFtZTogc3RyaW5nLCBhdHRyczogVEF0dHJpYnV0ZXMgfCBudWxsLCBpc0lubGluZVRlbXBsYXRlOiBib29sZWFuLFxuICAgIGlzUHJvamVjdGlvbk1vZGU6IGJvb2xlYW4pOiBudW1iZXIge1xuICBpZiAoYXR0cnMgPT09IG51bGwpIHJldHVybiAtMTtcblxuICBsZXQgaSA9IDA7XG5cbiAgaWYgKGlzUHJvamVjdGlvbk1vZGUgfHwgIWlzSW5saW5lVGVtcGxhdGUpIHtcbiAgICBsZXQgYmluZGluZ3NNb2RlID0gZmFsc2U7XG4gICAgd2hpbGUgKGkgPCBhdHRycy5sZW5ndGgpIHtcbiAgICAgIGNvbnN0IG1heWJlQXR0ck5hbWUgPSBhdHRyc1tpXTtcbiAgICAgIGlmIChtYXliZUF0dHJOYW1lID09PSBuYW1lKSB7XG4gICAgICAgIHJldHVybiBpO1xuICAgICAgfSBlbHNlIGlmIChtYXliZUF0dHJOYW1lID09PSBBdHRyaWJ1dGVNYXJrZXIuQmluZGluZ3MpIHtcbiAgICAgICAgYmluZGluZ3NNb2RlID0gdHJ1ZTtcbiAgICAgIH0gZWxzZSBpZiAobWF5YmVBdHRyTmFtZSA9PT0gQXR0cmlidXRlTWFya2VyLkNsYXNzZXMpIHtcbiAgICAgICAgbGV0IHZhbHVlID0gYXR0cnNbKytpXTtcbiAgICAgICAgLy8gV2Ugc2hvdWxkIHNraXAgY2xhc3NlcyBoZXJlIGJlY2F1c2Ugd2UgaGF2ZSBhIHNlcGFyYXRlIG1lY2hhbmlzbSBmb3JcbiAgICAgICAgLy8gbWF0Y2hpbmcgY2xhc3NlcyBpbiBwcm9qZWN0aW9uIG1vZGUuXG4gICAgICAgIHdoaWxlICh0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgdmFsdWUgPSBhdHRyc1srK2ldO1xuICAgICAgICB9XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfSBlbHNlIGlmIChtYXliZUF0dHJOYW1lID09PSBBdHRyaWJ1dGVNYXJrZXIuVGVtcGxhdGUpIHtcbiAgICAgICAgLy8gV2UgZG8gbm90IGNhcmUgYWJvdXQgVGVtcGxhdGUgYXR0cmlidXRlcyBpbiB0aGlzIHNjZW5hcmlvLlxuICAgICAgICBicmVhaztcbiAgICAgIH0gZWxzZSBpZiAobWF5YmVBdHRyTmFtZSA9PT0gQXR0cmlidXRlTWFya2VyLk5hbWVzcGFjZVVSSSkge1xuICAgICAgICAvLyBTa2lwIHRoZSB3aG9sZSBuYW1lc3BhY2VkIGF0dHJpYnV0ZSBhbmQgdmFsdWUuIFRoaXMgaXMgYnkgZGVzaWduLlxuICAgICAgICBpICs9IDQ7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgLy8gSW4gYmluZGluZyBtb2RlIHRoZXJlIGFyZSBvbmx5IG5hbWVzLCByYXRoZXIgdGhhbiBuYW1lLXZhbHVlIHBhaXJzLlxuICAgICAgaSArPSBiaW5kaW5nc01vZGUgPyAxIDogMjtcbiAgICB9XG4gICAgLy8gV2UgZGlkIG5vdCBtYXRjaCB0aGUgYXR0cmlidXRlXG4gICAgcmV0dXJuIC0xO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBtYXRjaFRlbXBsYXRlQXR0cmlidXRlKGF0dHJzLCBuYW1lKTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNOb2RlTWF0Y2hpbmdTZWxlY3Rvckxpc3QoXG4gICAgdE5vZGU6IFROb2RlLCBzZWxlY3RvcjogQ3NzU2VsZWN0b3JMaXN0LCBpc1Byb2plY3Rpb25Nb2RlOiBib29sZWFuID0gZmFsc2UpOiBib29sZWFuIHtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBzZWxlY3Rvci5sZW5ndGg7IGkrKykge1xuICAgIGlmIChpc05vZGVNYXRjaGluZ1NlbGVjdG9yKHROb2RlLCBzZWxlY3RvcltpXSwgaXNQcm9qZWN0aW9uTW9kZSkpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBmYWxzZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFByb2plY3RBc0F0dHJWYWx1ZSh0Tm9kZTogVE5vZGUpOiBDc3NTZWxlY3RvcnxudWxsIHtcbiAgY29uc3Qgbm9kZUF0dHJzID0gdE5vZGUuYXR0cnM7XG4gIGlmIChub2RlQXR0cnMgIT0gbnVsbCkge1xuICAgIGNvbnN0IG5nUHJvamVjdEFzQXR0cklkeCA9IG5vZGVBdHRycy5pbmRleE9mKEF0dHJpYnV0ZU1hcmtlci5Qcm9qZWN0QXMpO1xuICAgIC8vIG9ubHkgY2hlY2sgZm9yIG5nUHJvamVjdEFzIGluIGF0dHJpYnV0ZSBuYW1lcywgZG9uJ3QgYWNjaWRlbnRhbGx5IG1hdGNoIGF0dHJpYnV0ZSdzIHZhbHVlXG4gICAgLy8gKGF0dHJpYnV0ZSBuYW1lcyBhcmUgc3RvcmVkIGF0IGV2ZW4gaW5kZXhlcylcbiAgICBpZiAoKG5nUHJvamVjdEFzQXR0cklkeCAmIDEpID09PSAwKSB7XG4gICAgICByZXR1cm4gbm9kZUF0dHJzW25nUHJvamVjdEFzQXR0cklkeCArIDFdIGFzIENzc1NlbGVjdG9yO1xuICAgIH1cbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuLyoqXG4gKiBDaGVja3MgYSBnaXZlbiBub2RlIGFnYWluc3QgbWF0Y2hpbmcgcHJvamVjdGlvbiBzZWxlY3RvcnMgYW5kIHJldHVybnNcbiAqIHNlbGVjdG9yIGluZGV4IChvciAwIGlmIG5vbmUgbWF0Y2hlZCkuXG4gKlxuICogVGhpcyBmdW5jdGlvbiB0YWtlcyBpbnRvIGFjY291bnQgdGhlIHBhcnNlZCBuZ1Byb2plY3RBcyBzZWxlY3RvciBmcm9tIHRoZSBub2RlJ3MgYXR0cmlidXRlcy5cbiAqIElmIHByZXNlbnQsIGl0IHdpbGwgY2hlY2sgd2hldGhlciB0aGUgbmdQcm9qZWN0QXMgc2VsZWN0b3IgbWF0Y2hlcyBhbnkgb2YgdGhlIHByb2plY3Rpb25cbiAqIHNlbGVjdG9ycy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG1hdGNoaW5nUHJvamVjdGlvblNlbGVjdG9ySW5kZXgoXG4gICAgdE5vZGU6IFROb2RlLCBzZWxlY3RvcnM6IENzc1NlbGVjdG9yTGlzdFtdKTogbnVtYmVyIHtcbiAgY29uc3QgbmdQcm9qZWN0QXNBdHRyVmFsID0gZ2V0UHJvamVjdEFzQXR0clZhbHVlKHROb2RlKTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBzZWxlY3RvcnMubGVuZ3RoOyBpKyspIHtcbiAgICAvLyBJZiB3ZSByYW4gaW50byBhbiBgbmdQcm9qZWN0QXNgIGF0dHJpYnV0ZSwgd2Ugc2hvdWxkIG1hdGNoIGl0cyBwYXJzZWQgc2VsZWN0b3JcbiAgICAvLyB0byB0aGUgbGlzdCBvZiBzZWxlY3RvcnMsIG90aGVyd2lzZSB3ZSBmYWxsIGJhY2sgdG8gbWF0Y2hpbmcgYWdhaW5zdCB0aGUgbm9kZS5cbiAgICBpZiAobmdQcm9qZWN0QXNBdHRyVmFsID09PSBudWxsID9cbiAgICAgICAgICAgIGlzTm9kZU1hdGNoaW5nU2VsZWN0b3JMaXN0KHROb2RlLCBzZWxlY3RvcnNbaV0sIC8qIGlzUHJvamVjdGlvbk1vZGUgKi8gdHJ1ZSkgOlxuICAgICAgICAgICAgaXNTZWxlY3RvckluU2VsZWN0b3JMaXN0KG5nUHJvamVjdEFzQXR0clZhbCwgc2VsZWN0b3JzW2ldKSkge1xuICAgICAgcmV0dXJuIGkgKyAxOyAgLy8gZmlyc3QgbWF0Y2hpbmcgc2VsZWN0b3IgXCJjYXB0dXJlc1wiIGEgZ2l2ZW4gbm9kZVxuICAgIH1cbiAgfVxuICByZXR1cm4gMDtcbn1cblxuZnVuY3Rpb24gZ2V0TmFtZU9ubHlNYXJrZXJJbmRleChub2RlQXR0cnM6IFRBdHRyaWJ1dGVzKSB7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgbm9kZUF0dHJzLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3Qgbm9kZUF0dHIgPSBub2RlQXR0cnNbaV07XG4gICAgaWYgKGlzTmFtZU9ubHlBdHRyaWJ1dGVNYXJrZXIobm9kZUF0dHIpKSB7XG4gICAgICByZXR1cm4gaTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIG5vZGVBdHRycy5sZW5ndGg7XG59XG5cbmZ1bmN0aW9uIG1hdGNoVGVtcGxhdGVBdHRyaWJ1dGUoYXR0cnM6IFRBdHRyaWJ1dGVzLCBuYW1lOiBzdHJpbmcpOiBudW1iZXIge1xuICBsZXQgaSA9IGF0dHJzLmluZGV4T2YoQXR0cmlidXRlTWFya2VyLlRlbXBsYXRlKTtcbiAgaWYgKGkgPiAtMSkge1xuICAgIGkrKztcbiAgICB3aGlsZSAoaSA8IGF0dHJzLmxlbmd0aCkge1xuICAgICAgaWYgKGF0dHJzW2ldID09PSBuYW1lKSByZXR1cm4gaTtcbiAgICAgIGkrKztcbiAgICB9XG4gIH1cbiAgcmV0dXJuIC0xO1xufVxuXG4vKipcbiAqIENoZWNrcyB3aGV0aGVyIGEgc2VsZWN0b3IgaXMgaW5zaWRlIGEgQ3NzU2VsZWN0b3JMaXN0XG4gKiBAcGFyYW0gc2VsZWN0b3IgU2VsZWN0b3IgdG8gYmUgY2hlY2tlZC5cbiAqIEBwYXJhbSBsaXN0IExpc3QgaW4gd2hpY2ggdG8gbG9vayBmb3IgdGhlIHNlbGVjdG9yLlxuICovXG5mdW5jdGlvbiBpc1NlbGVjdG9ySW5TZWxlY3Rvckxpc3Qoc2VsZWN0b3I6IENzc1NlbGVjdG9yLCBsaXN0OiBDc3NTZWxlY3Rvckxpc3QpOiBib29sZWFuIHtcbiAgc2VsZWN0b3JMaXN0TG9vcDogZm9yIChsZXQgaSA9IDA7IGkgPCBsaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgY3VycmVudFNlbGVjdG9ySW5MaXN0ID0gbGlzdFtpXTtcbiAgICBpZiAoc2VsZWN0b3IubGVuZ3RoICE9PSBjdXJyZW50U2VsZWN0b3JJbkxpc3QubGVuZ3RoKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgZm9yIChsZXQgaiA9IDA7IGogPCBzZWxlY3Rvci5sZW5ndGg7IGorKykge1xuICAgICAgaWYgKHNlbGVjdG9yW2pdICE9PSBjdXJyZW50U2VsZWN0b3JJbkxpc3Rbal0pIHtcbiAgICAgICAgY29udGludWUgc2VsZWN0b3JMaXN0TG9vcDtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuIl19