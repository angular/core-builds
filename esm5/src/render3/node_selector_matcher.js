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
 * Matching can be perfomed in 2 modes: projection mode (when we project nodes) and regular
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
 * @param node static data to match
 * @param selector
 * @returns true if node matches the selector.
 */
export function isNodeMatchingSelector(tNode, selector, isProjectionMode) {
    ngDevMode && assertDefined(selector[0], 'Selector should have a tag name');
    var mode = 4 /* ELEMENT */;
    var nodeAttrs = tNode.attrs;
    var selectOnlyMarkerIdx = nodeAttrs ? nodeAttrs.indexOf(3 /* SelectOnly */) : -1;
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
            var attrName = mode & 8 /* CLASS */ ? 'class' : current;
            var attrIndexInNode = findAttrIndexInNode(attrName, nodeAttrs);
            if (attrIndexInNode === -1) {
                if (isPositive(mode))
                    return false;
                skipToNextSelector = true;
                continue;
            }
            var selectorAttrValue = mode & 8 /* CLASS */ ? current : selector[++i];
            if (selectorAttrValue !== '') {
                var nodeAttrValue = void 0;
                var maybeAttrName = nodeAttrs[attrIndexInNode];
                if (selectOnlyMarkerIdx > -1 && attrIndexInNode > selectOnlyMarkerIdx) {
                    nodeAttrValue = '';
                }
                else {
                    ngDevMode && assertNotEqual(maybeAttrName, 0 /* NamespaceURI */, 'We do not match directives on namespaced attributes');
                    nodeAttrValue = nodeAttrs[attrIndexInNode + 1];
                }
                if (mode & 8 /* CLASS */ &&
                    !isCssClassMatching(nodeAttrValue, selectorAttrValue) ||
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
/**
 * Examines an attributes definition array from a node to find the index of the
 * attribute with the specified name.
 *
 * NOTE: Will not find namespaced attributes.
 *
 * @param name the name of the attribute to find
 * @param attrs the attribute array to examine
 */
function findAttrIndexInNode(name, attrs) {
    if (attrs === null)
        return -1;
    var selectOnlyMode = false;
    var i = 0;
    while (i < attrs.length) {
        var maybeAttrName = attrs[i];
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
 * Checks a given node against matching selectors and returns
 * selector index (or 0 if none matched).
 *
 * This function takes into account the ngProjectAs attribute: if present its value will be compared
 * to the raw (un-parsed) CSS selector instead of using standard selector matching logic.
 */
export function matchingSelectorIndex(tNode, selectors, textSelectors) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9kZV9zZWxlY3Rvcl9tYXRjaGVyLmpzIiwic291cmNlUm9vdCI6Ii4uLy4uLyIsInNvdXJjZXMiOlsicGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9ub2RlX3NlbGVjdG9yX21hdGNoZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxxQkFBcUIsQ0FBQztBQUU3QixPQUFPLEVBQUMsYUFBYSxFQUFFLGNBQWMsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBQzdELE9BQU8sRUFBaUQsNkJBQTZCLElBQUksT0FBTyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDM0gsT0FBTyxFQUErQix1QkFBdUIsRUFBaUIsNkJBQTZCLElBQUksT0FBTyxFQUFDLE1BQU0seUJBQXlCLENBQUM7QUFFdkosSUFBTSx1QkFBdUIsR0FBRyxPQUFPLEdBQUcsT0FBTyxDQUFDO0FBRWxELElBQU0sb0JBQW9CLEdBQUcsYUFBYSxDQUFDO0FBRTNDLFNBQVMsa0JBQWtCLENBQUMsZ0JBQXdCLEVBQUUsZUFBdUI7SUFDM0UsSUFBTSxjQUFjLEdBQUcsZ0JBQWdCLENBQUMsTUFBTSxDQUFDO0lBQy9DLElBQU0sVUFBVSxHQUFHLGdCQUFrQixDQUFDLE9BQU8sQ0FBQyxlQUFlLENBQUMsQ0FBQztJQUMvRCxJQUFNLFdBQVcsR0FBRyxVQUFVLEdBQUcsZUFBZSxDQUFDLE1BQU0sQ0FBQztJQUN4RCxJQUFJLFVBQVUsS0FBSyxDQUFDLENBQUMsQ0FBa0QsV0FBVztXQUMzRSxDQUFDLFVBQVUsR0FBRyxDQUFDLElBQUksZ0JBQWtCLENBQUMsVUFBVSxHQUFHLENBQUMsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFFLGtCQUFrQjs7WUFFckYsQ0FBQyxXQUFXLEdBQUcsY0FBYyxJQUFJLGdCQUFrQixDQUFDLFdBQVcsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxFQUFHLGlCQUFpQjtLQUNqRztRQUNFLE9BQU8sS0FBSyxDQUFDO0tBQ2Q7SUFDRCxPQUFPLElBQUks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QUFPLFNBQVMsQ0FBQyxrQkFBa0IsR0FBRyxDQUFDLENBQVcsQ0FBQztTQUNwRDtLQUNGO0lBQ0QsT0FBTyxJQUFJLENBQUM7QUFDZCxDQUFDO0FBRUQ7Ozs7OztHQU1HO0FBQ0gsTUFBTSxVQUFVLHFCQUFxQixDQUNqQyxLQUFZLEVBQUUsU0FBNEIsRUFBRSxhQUF1QjtJQUNyRSxJQUFNLGtCQUFrQixHQUFHLHFCQUFxQixDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ3hELEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxTQUFTLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO1FBQ3pDLDZFQUE2RTtRQUM3RSxzRkFBc0Y7UUFDdEYsSUFBSSxrQkFBa0IsS0FBSyxhQUFhLENBQUMsQ0FBQyxDQUFDO1lBQ3ZDLGtCQUFrQixLQUFLLElBQUk7Z0JBQ3ZCLDBCQUEwQixDQUFDLEtBQUssRUFBRSxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUUsc0JBQXNCLENBQUMsSUFBSSxDQUFDLEVBQUU7WUFDcEYsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUUsa0RBQWtEO1NBQ2xFO0tBQ0Y7SUFDRCxPQUFPLENBQUMsQ0FBQztBQUNYLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCAnLi4vdXRpbC9uZ19kZXZfbW9kZSc7XG5cbmltcG9ydCB7YXNzZXJ0RGVmaW5lZCwgYXNzZXJ0Tm90RXF1YWx9IGZyb20gJy4uL3V0aWwvYXNzZXJ0JztcbmltcG9ydCB7QXR0cmlidXRlTWFya2VyLCBUQXR0cmlidXRlcywgVE5vZGUsIFROb2RlVHlwZSwgdW51c2VkVmFsdWVFeHBvcnRUb1BsYWNhdGVBamQgYXMgdW51c2VkMX0gZnJvbSAnLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtDc3NTZWxlY3RvciwgQ3NzU2VsZWN0b3JMaXN0LCBOR19QUk9KRUNUX0FTX0FUVFJfTkFNRSwgU2VsZWN0b3JGbGFncywgdW51c2VkVmFsdWVFeHBvcnRUb1BsYWNhdGVBamQgYXMgdW51c2VkMn0gZnJvbSAnLi9pbnRlcmZhY2VzL3Byb2plY3Rpb24nO1xuXG5jb25zdCB1bnVzZWRWYWx1ZVRvUGxhY2F0ZUFqZCA9IHVudXNlZDEgKyB1bnVzZWQyO1xuXG5jb25zdCBOR19URU1QTEFURV9TRUxFQ1RPUiA9ICduZy10ZW1wbGF0ZSc7XG5cbmZ1bmN0aW9uIGlzQ3NzQ2xhc3NNYXRjaGluZyhub2RlQ2xhc3NBdHRyVmFsOiBzdHJpbmcsIGNzc0NsYXNzVG9NYXRjaDogc3RyaW5nKTogYm9vbGVhbiB7XG4gIGNvbnN0IG5vZGVDbGFzc2VzTGVuID0gbm9kZUNsYXNzQXR0clZhbC5sZW5ndGg7XG4gIGNvbnN0IG1hdGNoSW5kZXggPSBub2RlQ2xhc3NBdHRyVmFsICEuaW5kZXhPZihjc3NDbGFzc1RvTWF0Y2gpO1xuICBjb25zdCBtYXRjaEVuZElkeCA9IG1hdGNoSW5kZXggKyBjc3NDbGFzc1RvTWF0Y2gubGVuZ3RoO1xuICBpZiAobWF0Y2hJbmRleCA9PT0gLTEgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIG5vIG1hdGNoXG4gICAgICB8fCAobWF0Y2hJbmRleCA+IDAgJiYgbm9kZUNsYXNzQXR0clZhbCAhW21hdGNoSW5kZXggLSAxXSAhPT0gJyAnKSAgLy8gbm8gc3BhY2UgYmVmb3JlXG4gICAgICB8fFxuICAgICAgKG1hdGNoRW5kSWR4IDwgbm9kZUNsYXNzZXNMZW4gJiYgbm9kZUNsYXNzQXR0clZhbCAhW21hdGNoRW5kSWR4XSAhPT0gJyAnKSkgIC8vIG5vIHNwYWNlIGFmdGVyXG4gIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgcmV0dXJuIHRydWU7XG59XG5cbi8qKlxuICogRnVuY3Rpb24gdGhhdCBjaGVja3Mgd2hldGhlciBhIGdpdmVuIHROb2RlIG1hdGNoZXMgdGFnLWJhc2VkIHNlbGVjdG9yIGFuZCBoYXMgYSB2YWxpZCB0eXBlLlxuICpcbiAqIE1hdGNoaW5nIGNhbiBiZSBwZXJmb21lZCBpbiAyIG1vZGVzOiBwcm9qZWN0aW9uIG1vZGUgKHdoZW4gd2UgcHJvamVjdCBub2RlcykgYW5kIHJlZ3VsYXJcbiAqIGRpcmVjdGl2ZSBtYXRjaGluZyBtb2RlLiBJbiBcInByb2plY3Rpb25cIiBtb2RlLCB3ZSBkbyBub3QgbmVlZCB0byBjaGVjayB0eXBlcywgc28gaWYgdGFnIG5hbWVcbiAqIG1hdGNoZXMgc2VsZWN0b3IsIHdlIGRlY2xhcmUgYSBtYXRjaC4gSW4gXCJkaXJlY3RpdmUgbWF0Y2hpbmdcIiBtb2RlLCB3ZSBhbHNvIGNoZWNrIHdoZXRoZXIgdE5vZGVcbiAqIGlzIG9mIGV4cGVjdGVkIHR5cGU6XG4gKiAtIHdoZXRoZXIgdE5vZGUgaGFzIGVpdGhlciBFbGVtZW50IG9yIEVsZW1lbnRDb250YWluZXIgdHlwZVxuICogLSBvciBpZiB3ZSB3YW50IHRvIG1hdGNoIFwibmctdGVtcGxhdGVcIiB0YWcsIHdlIGNoZWNrIGZvciBDb250YWluZXIgdHlwZVxuICovXG5mdW5jdGlvbiBoYXNUYWdBbmRUeXBlTWF0Y2goXG4gICAgdE5vZGU6IFROb2RlLCBjdXJyZW50U2VsZWN0b3I6IHN0cmluZywgaXNQcm9qZWN0aW9uTW9kZTogYm9vbGVhbik6IGJvb2xlYW4ge1xuICByZXR1cm4gY3VycmVudFNlbGVjdG9yID09PSB0Tm9kZS50YWdOYW1lICYmXG4gICAgICAoaXNQcm9qZWN0aW9uTW9kZSB8fFxuICAgICAgICh0Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuRWxlbWVudCB8fCB0Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuRWxlbWVudENvbnRhaW5lcikgfHxcbiAgICAgICAodE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkNvbnRhaW5lciAmJiBjdXJyZW50U2VsZWN0b3IgPT09IE5HX1RFTVBMQVRFX1NFTEVDVE9SKSk7XG59XG5cbi8qKlxuICogQSB1dGlsaXR5IGZ1bmN0aW9uIHRvIG1hdGNoIGFuIEl2eSBub2RlIHN0YXRpYyBkYXRhIGFnYWluc3QgYSBzaW1wbGUgQ1NTIHNlbGVjdG9yXG4gKlxuICogQHBhcmFtIG5vZGUgc3RhdGljIGRhdGEgdG8gbWF0Y2hcbiAqIEBwYXJhbSBzZWxlY3RvclxuICogQHJldHVybnMgdHJ1ZSBpZiBub2RlIG1hdGNoZXMgdGhlIHNlbGVjdG9yLlxuICovXG5leHBvcnQgZnVuY3Rpb24gaXNOb2RlTWF0Y2hpbmdTZWxlY3RvcihcbiAgICB0Tm9kZTogVE5vZGUsIHNlbGVjdG9yOiBDc3NTZWxlY3RvciwgaXNQcm9qZWN0aW9uTW9kZTogYm9vbGVhbik6IGJvb2xlYW4ge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChzZWxlY3RvclswXSwgJ1NlbGVjdG9yIHNob3VsZCBoYXZlIGEgdGFnIG5hbWUnKTtcblxuICBsZXQgbW9kZTogU2VsZWN0b3JGbGFncyA9IFNlbGVjdG9yRmxhZ3MuRUxFTUVOVDtcbiAgY29uc3Qgbm9kZUF0dHJzID0gdE5vZGUuYXR0cnMgITtcbiAgY29uc3Qgc2VsZWN0T25seU1hcmtlcklkeCA9IG5vZGVBdHRycyA/IG5vZGVBdHRycy5pbmRleE9mKEF0dHJpYnV0ZU1hcmtlci5TZWxlY3RPbmx5KSA6IC0xO1xuXG4gIC8vIFdoZW4gcHJvY2Vzc2luZyBcIjpub3RcIiBzZWxlY3RvcnMsIHdlIHNraXAgdG8gdGhlIG5leHQgXCI6bm90XCIgaWYgdGhlXG4gIC8vIGN1cnJlbnQgb25lIGRvZXNuJ3QgbWF0Y2hcbiAgbGV0IHNraXBUb05leHRTZWxlY3RvciA9IGZhbHNlO1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgc2VsZWN0b3IubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBjdXJyZW50ID0gc2VsZWN0b3JbaV07XG4gICAgaWYgKHR5cGVvZiBjdXJyZW50ID09PSAnbnVtYmVyJykge1xuICAgICAgLy8gSWYgd2UgZmluaXNoIHByb2Nlc3NpbmcgYSA6bm90IHNlbGVjdG9yIGFuZCBpdCBoYXNuJ3QgZmFpbGVkLCByZXR1cm4gZmFsc2VcbiAgICAgIGlmICghc2tpcFRvTmV4dFNlbGVjdG9yICYmICFpc1Bvc2l0aXZlKG1vZGUpICYmICFpc1Bvc2l0aXZlKGN1cnJlbnQgYXMgbnVtYmVyKSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICAvLyBJZiB3ZSBhcmUgc2tpcHBpbmcgdG8gdGhlIG5leHQgOm5vdCgpIGFuZCB0aGlzIG1vZGUgZmxhZyBpcyBwb3NpdGl2ZSxcbiAgICAgIC8vIGl0J3MgYSBwYXJ0IG9mIHRoZSBjdXJyZW50IDpub3QoKSBzZWxlY3RvciwgYW5kIHdlIHNob3VsZCBrZWVwIHNraXBwaW5nXG4gICAgICBpZiAoc2tpcFRvTmV4dFNlbGVjdG9yICYmIGlzUG9zaXRpdmUoY3VycmVudCkpIGNvbnRpbnVlO1xuICAgICAgc2tpcFRvTmV4dFNlbGVjdG9yID0gZmFsc2U7XG4gICAgICBtb2RlID0gKGN1cnJlbnQgYXMgbnVtYmVyKSB8IChtb2RlICYgU2VsZWN0b3JGbGFncy5OT1QpO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKHNraXBUb05leHRTZWxlY3RvcikgY29udGludWU7XG5cbiAgICBpZiAobW9kZSAmIFNlbGVjdG9yRmxhZ3MuRUxFTUVOVCkge1xuICAgICAgbW9kZSA9IFNlbGVjdG9yRmxhZ3MuQVRUUklCVVRFIHwgbW9kZSAmIFNlbGVjdG9yRmxhZ3MuTk9UO1xuICAgICAgaWYgKGN1cnJlbnQgIT09ICcnICYmICFoYXNUYWdBbmRUeXBlTWF0Y2godE5vZGUsIGN1cnJlbnQsIGlzUHJvamVjdGlvbk1vZGUpIHx8XG4gICAgICAgICAgY3VycmVudCA9PT0gJycgJiYgc2VsZWN0b3IubGVuZ3RoID09PSAxKSB7XG4gICAgICAgIGlmIChpc1Bvc2l0aXZlKG1vZGUpKSByZXR1cm4gZmFsc2U7XG4gICAgICAgIHNraXBUb05leHRTZWxlY3RvciA9IHRydWU7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IGF0dHJOYW1lID0gbW9kZSAmIFNlbGVjdG9yRmxhZ3MuQ0xBU1MgPyAnY2xhc3MnIDogY3VycmVudDtcbiAgICAgIGNvbnN0IGF0dHJJbmRleEluTm9kZSA9IGZpbmRBdHRySW5kZXhJbk5vZGUoYXR0ck5hbWUsIG5vZGVBdHRycyk7XG5cbiAgICAgIGlmIChhdHRySW5kZXhJbk5vZGUgPT09IC0xKSB7XG4gICAgICAgIGlmIChpc1Bvc2l0aXZlKG1vZGUpKSByZXR1cm4gZmFsc2U7XG4gICAgICAgIHNraXBUb05leHRTZWxlY3RvciA9IHRydWU7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBzZWxlY3RvckF0dHJWYWx1ZSA9IG1vZGUgJiBTZWxlY3RvckZsYWdzLkNMQVNTID8gY3VycmVudCA6IHNlbGVjdG9yWysraV07XG4gICAgICBpZiAoc2VsZWN0b3JBdHRyVmFsdWUgIT09ICcnKSB7XG4gICAgICAgIGxldCBub2RlQXR0clZhbHVlOiBzdHJpbmc7XG4gICAgICAgIGNvbnN0IG1heWJlQXR0ck5hbWUgPSBub2RlQXR0cnNbYXR0ckluZGV4SW5Ob2RlXTtcbiAgICAgICAgaWYgKHNlbGVjdE9ubHlNYXJrZXJJZHggPiAtMSAmJiBhdHRySW5kZXhJbk5vZGUgPiBzZWxlY3RPbmx5TWFya2VySWR4KSB7XG4gICAgICAgICAgbm9kZUF0dHJWYWx1ZSA9ICcnO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG5nRGV2TW9kZSAmJiBhc3NlcnROb3RFcXVhbChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIG1heWJlQXR0ck5hbWUsIEF0dHJpYnV0ZU1hcmtlci5OYW1lc3BhY2VVUkksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAnV2UgZG8gbm90IG1hdGNoIGRpcmVjdGl2ZXMgb24gbmFtZXNwYWNlZCBhdHRyaWJ1dGVzJyk7XG4gICAgICAgICAgbm9kZUF0dHJWYWx1ZSA9IG5vZGVBdHRyc1thdHRySW5kZXhJbk5vZGUgKyAxXSBhcyBzdHJpbmc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG1vZGUgJiBTZWxlY3RvckZsYWdzLkNMQVNTICYmXG4gICAgICAgICAgICAgICAgIWlzQ3NzQ2xhc3NNYXRjaGluZyhub2RlQXR0clZhbHVlIGFzIHN0cmluZywgc2VsZWN0b3JBdHRyVmFsdWUgYXMgc3RyaW5nKSB8fFxuICAgICAgICAgICAgbW9kZSAmIFNlbGVjdG9yRmxhZ3MuQVRUUklCVVRFICYmIHNlbGVjdG9yQXR0clZhbHVlICE9PSBub2RlQXR0clZhbHVlKSB7XG4gICAgICAgICAgaWYgKGlzUG9zaXRpdmUobW9kZSkpIHJldHVybiBmYWxzZTtcbiAgICAgICAgICBza2lwVG9OZXh0U2VsZWN0b3IgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGlzUG9zaXRpdmUobW9kZSkgfHwgc2tpcFRvTmV4dFNlbGVjdG9yO1xufVxuXG5mdW5jdGlvbiBpc1Bvc2l0aXZlKG1vZGU6IFNlbGVjdG9yRmxhZ3MpOiBib29sZWFuIHtcbiAgcmV0dXJuIChtb2RlICYgU2VsZWN0b3JGbGFncy5OT1QpID09PSAwO1xufVxuXG4vKipcbiAqIEV4YW1pbmVzIGFuIGF0dHJpYnV0ZXMgZGVmaW5pdGlvbiBhcnJheSBmcm9tIGEgbm9kZSB0byBmaW5kIHRoZSBpbmRleCBvZiB0aGVcbiAqIGF0dHJpYnV0ZSB3aXRoIHRoZSBzcGVjaWZpZWQgbmFtZS5cbiAqXG4gKiBOT1RFOiBXaWxsIG5vdCBmaW5kIG5hbWVzcGFjZWQgYXR0cmlidXRlcy5cbiAqXG4gKiBAcGFyYW0gbmFtZSB0aGUgbmFtZSBvZiB0aGUgYXR0cmlidXRlIHRvIGZpbmRcbiAqIEBwYXJhbSBhdHRycyB0aGUgYXR0cmlidXRlIGFycmF5IHRvIGV4YW1pbmVcbiAqL1xuZnVuY3Rpb24gZmluZEF0dHJJbmRleEluTm9kZShuYW1lOiBzdHJpbmcsIGF0dHJzOiBUQXR0cmlidXRlcyB8IG51bGwpOiBudW1iZXIge1xuICBpZiAoYXR0cnMgPT09IG51bGwpIHJldHVybiAtMTtcbiAgbGV0IHNlbGVjdE9ubHlNb2RlID0gZmFsc2U7XG4gIGxldCBpID0gMDtcbiAgd2hpbGUgKGkgPCBhdHRycy5sZW5ndGgpIHtcbiAgICBjb25zdCBtYXliZUF0dHJOYW1lID0gYXR0cnNbaV07XG4gICAgaWYgKG1heWJlQXR0ck5hbWUgPT09IG5hbWUpIHtcbiAgICAgIHJldHVybiBpO1xuICAgIH0gZWxzZSBpZiAobWF5YmVBdHRyTmFtZSA9PT0gQXR0cmlidXRlTWFya2VyLk5hbWVzcGFjZVVSSSkge1xuICAgICAgLy8gTk9URShiZW5sZXNoKTogd2lsbCBub3QgZmluZCBuYW1lc3BhY2VkIGF0dHJpYnV0ZXMuIFRoaXMgaXMgYnkgZGVzaWduLlxuICAgICAgaSArPSA0O1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAobWF5YmVBdHRyTmFtZSA9PT0gQXR0cmlidXRlTWFya2VyLlNlbGVjdE9ubHkpIHtcbiAgICAgICAgc2VsZWN0T25seU1vZGUgPSB0cnVlO1xuICAgICAgfVxuICAgICAgaSArPSBzZWxlY3RPbmx5TW9kZSA/IDEgOiAyO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiAtMTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzTm9kZU1hdGNoaW5nU2VsZWN0b3JMaXN0KFxuICAgIHROb2RlOiBUTm9kZSwgc2VsZWN0b3I6IENzc1NlbGVjdG9yTGlzdCwgaXNQcm9qZWN0aW9uTW9kZTogYm9vbGVhbiA9IGZhbHNlKTogYm9vbGVhbiB7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgc2VsZWN0b3IubGVuZ3RoOyBpKyspIHtcbiAgICBpZiAoaXNOb2RlTWF0Y2hpbmdTZWxlY3Rvcih0Tm9kZSwgc2VsZWN0b3JbaV0sIGlzUHJvamVjdGlvbk1vZGUpKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gZmFsc2U7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRQcm9qZWN0QXNBdHRyVmFsdWUodE5vZGU6IFROb2RlKTogc3RyaW5nfG51bGwge1xuICBjb25zdCBub2RlQXR0cnMgPSB0Tm9kZS5hdHRycztcbiAgaWYgKG5vZGVBdHRycyAhPSBudWxsKSB7XG4gICAgY29uc3QgbmdQcm9qZWN0QXNBdHRySWR4ID0gbm9kZUF0dHJzLmluZGV4T2YoTkdfUFJPSkVDVF9BU19BVFRSX05BTUUpO1xuICAgIC8vIG9ubHkgY2hlY2sgZm9yIG5nUHJvamVjdEFzIGluIGF0dHJpYnV0ZSBuYW1lcywgZG9uJ3QgYWNjaWRlbnRhbGx5IG1hdGNoIGF0dHJpYnV0ZSdzIHZhbHVlXG4gICAgLy8gKGF0dHJpYnV0ZSBuYW1lcyBhcmUgc3RvcmVkIGF0IGV2ZW4gaW5kZXhlcylcbiAgICBpZiAoKG5nUHJvamVjdEFzQXR0cklkeCAmIDEpID09PSAwKSB7XG4gICAgICByZXR1cm4gbm9kZUF0dHJzW25nUHJvamVjdEFzQXR0cklkeCArIDFdIGFzIHN0cmluZztcbiAgICB9XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbi8qKlxuICogQ2hlY2tzIGEgZ2l2ZW4gbm9kZSBhZ2FpbnN0IG1hdGNoaW5nIHNlbGVjdG9ycyBhbmQgcmV0dXJuc1xuICogc2VsZWN0b3IgaW5kZXggKG9yIDAgaWYgbm9uZSBtYXRjaGVkKS5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIHRha2VzIGludG8gYWNjb3VudCB0aGUgbmdQcm9qZWN0QXMgYXR0cmlidXRlOiBpZiBwcmVzZW50IGl0cyB2YWx1ZSB3aWxsIGJlIGNvbXBhcmVkXG4gKiB0byB0aGUgcmF3ICh1bi1wYXJzZWQpIENTUyBzZWxlY3RvciBpbnN0ZWFkIG9mIHVzaW5nIHN0YW5kYXJkIHNlbGVjdG9yIG1hdGNoaW5nIGxvZ2ljLlxuICovXG5leHBvcnQgZnVuY3Rpb24gbWF0Y2hpbmdTZWxlY3RvckluZGV4KFxuICAgIHROb2RlOiBUTm9kZSwgc2VsZWN0b3JzOiBDc3NTZWxlY3Rvckxpc3RbXSwgdGV4dFNlbGVjdG9yczogc3RyaW5nW10pOiBudW1iZXIge1xuICBjb25zdCBuZ1Byb2plY3RBc0F0dHJWYWwgPSBnZXRQcm9qZWN0QXNBdHRyVmFsdWUodE5vZGUpO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IHNlbGVjdG9ycy5sZW5ndGg7IGkrKykge1xuICAgIC8vIGlmIGEgbm9kZSBoYXMgdGhlIG5nUHJvamVjdEFzIGF0dHJpYnV0ZSBtYXRjaCBpdCBhZ2FpbnN0IHVucGFyc2VkIHNlbGVjdG9yXG4gICAgLy8gbWF0Y2ggYSBub2RlIGFnYWluc3QgYSBwYXJzZWQgc2VsZWN0b3Igb25seSBpZiBuZ1Byb2plY3RBcyBhdHRyaWJ1dGUgaXMgbm90IHByZXNlbnRcbiAgICBpZiAobmdQcm9qZWN0QXNBdHRyVmFsID09PSB0ZXh0U2VsZWN0b3JzW2ldIHx8XG4gICAgICAgIG5nUHJvamVjdEFzQXR0clZhbCA9PT0gbnVsbCAmJlxuICAgICAgICAgICAgaXNOb2RlTWF0Y2hpbmdTZWxlY3Rvckxpc3QodE5vZGUsIHNlbGVjdG9yc1tpXSwgLyogaXNQcm9qZWN0aW9uTW9kZSAqLyB0cnVlKSkge1xuICAgICAgcmV0dXJuIGkgKyAxOyAgLy8gZmlyc3QgbWF0Y2hpbmcgc2VsZWN0b3IgXCJjYXB0dXJlc1wiIGEgZ2l2ZW4gbm9kZVxuICAgIH1cbiAgfVxuICByZXR1cm4gMDtcbn1cbiJdfQ==