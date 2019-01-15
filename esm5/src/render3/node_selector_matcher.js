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
            var attrName = (mode & 8 /* CLASS */) ? 'class' : current;
            var attrIndexInNode = findAttrIndexInNode(attrName, nodeAttrs);
            if (attrIndexInNode === -1) {
                if (isPositive(mode))
                    return false;
                skipToNextSelector = true;
                continue;
            }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9kZV9zZWxlY3Rvcl9tYXRjaGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9ub2RlX3NlbGVjdG9yX21hdGNoZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxxQkFBcUIsQ0FBQztBQUU3QixPQUFPLEVBQUMsYUFBYSxFQUFFLGNBQWMsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBQzdELE9BQU8sRUFBaUQsNkJBQTZCLElBQUksT0FBTyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDM0gsT0FBTyxFQUErQix1QkFBdUIsRUFBaUIsNkJBQTZCLElBQUksT0FBTyxFQUFDLE1BQU0seUJBQXlCLENBQUM7QUFDdkosT0FBTyxFQUFDLHdCQUF3QixFQUFDLE1BQU0sb0NBQW9DLENBQUM7QUFFNUUsSUFBTSx1QkFBdUIsR0FBRyxPQUFPLEdBQUcsT0FBTyxDQUFDO0FBRWxELElBQU0sb0JBQW9CLEdBQUcsYUFBYSxDQUFDO0FBRTNDLFNBQVMsa0JBQWtCLENBQUMsZ0JBQXdCLEVBQUUsZUFBdUI7SUFDM0UsSUFBTSxjQUFjLEdBQUcsZ0JBQWdCLENBQUMsTUFBTSxDQUFDO0lBQy9DLElBQU0sVUFBVSxHQUFHLGdCQUFrQixDQUFDLE9BQU8sQ0FBQyxlQUFlLENBQUMsQ0FBQztJQUMvRCxJQUFNLFdBQVcsR0FBRyxVQUFVLEdBQUcsZUFBZSxDQUFDLE1BQU0sQ0FBQztJQUN4RCxJQUFJLFVBQVUsS0FBSyxDQUFDLENBQUMsQ0FBa0QsV0FBVztXQUMzRSxDQUFDLFVBQVUsR0FBRyxDQUFDLElBQUksZ0JBQWtCLENBQUMsVUFBVSxHQUFHLENBQUMsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFFLGtCQUFrQjs7WUFFckYsQ0FBQyxXQUFXLEdBQUcsY0FBYyxJQUFJLGdCQUFrQixDQUFDLFdBQVcsQ0FBQyxLQUFL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QUFDLEVBQUUsRUFBRTtRQUN6Qyw2RUFBNkU7UUFDN0Usc0ZBQXNGO1FBQ3RGLElBQUksa0JBQWtCLEtBQUssYUFBYSxDQUFDLENBQUMsQ0FBQztZQUN2QyxrQkFBa0IsS0FBSyxJQUFJO2dCQUN2QiwwQkFBMEIsQ0FBQyxLQUFLLEVBQUUsU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFFLHNCQUFzQixDQUFDLElBQUksQ0FBQyxFQUFFO1lBQ3BGLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFFLGtEQUFrRDtTQUNsRTtLQUNGO0lBQ0QsT0FBTyxDQUFDLENBQUM7QUFDWCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgJy4uL3V0aWwvbmdfZGV2X21vZGUnO1xuXG5pbXBvcnQge2Fzc2VydERlZmluZWQsIGFzc2VydE5vdEVxdWFsfSBmcm9tICcuLi91dGlsL2Fzc2VydCc7XG5pbXBvcnQge0F0dHJpYnV0ZU1hcmtlciwgVEF0dHJpYnV0ZXMsIFROb2RlLCBUTm9kZVR5cGUsIHVudXNlZFZhbHVlRXhwb3J0VG9QbGFjYXRlQWpkIGFzIHVudXNlZDF9IGZyb20gJy4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7Q3NzU2VsZWN0b3IsIENzc1NlbGVjdG9yTGlzdCwgTkdfUFJPSkVDVF9BU19BVFRSX05BTUUsIFNlbGVjdG9yRmxhZ3MsIHVudXNlZFZhbHVlRXhwb3J0VG9QbGFjYXRlQWpkIGFzIHVudXNlZDJ9IGZyb20gJy4vaW50ZXJmYWNlcy9wcm9qZWN0aW9uJztcbmltcG9ydCB7Z2V0SW5pdGlhbENsYXNzTmFtZVZhbHVlfSBmcm9tICcuL3N0eWxpbmcvY2xhc3NfYW5kX3N0eWxlX2JpbmRpbmdzJztcblxuY29uc3QgdW51c2VkVmFsdWVUb1BsYWNhdGVBamQgPSB1bnVzZWQxICsgdW51c2VkMjtcblxuY29uc3QgTkdfVEVNUExBVEVfU0VMRUNUT1IgPSAnbmctdGVtcGxhdGUnO1xuXG5mdW5jdGlvbiBpc0Nzc0NsYXNzTWF0Y2hpbmcobm9kZUNsYXNzQXR0clZhbDogc3RyaW5nLCBjc3NDbGFzc1RvTWF0Y2g6IHN0cmluZyk6IGJvb2xlYW4ge1xuICBjb25zdCBub2RlQ2xhc3Nlc0xlbiA9IG5vZGVDbGFzc0F0dHJWYWwubGVuZ3RoO1xuICBjb25zdCBtYXRjaEluZGV4ID0gbm9kZUNsYXNzQXR0clZhbCAhLmluZGV4T2YoY3NzQ2xhc3NUb01hdGNoKTtcbiAgY29uc3QgbWF0Y2hFbmRJZHggPSBtYXRjaEluZGV4ICsgY3NzQ2xhc3NUb01hdGNoLmxlbmd0aDtcbiAgaWYgKG1hdGNoSW5kZXggPT09IC0xICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBubyBtYXRjaFxuICAgICAgfHwgKG1hdGNoSW5kZXggPiAwICYmIG5vZGVDbGFzc0F0dHJWYWwgIVttYXRjaEluZGV4IC0gMV0gIT09ICcgJykgIC8vIG5vIHNwYWNlIGJlZm9yZVxuICAgICAgfHxcbiAgICAgIChtYXRjaEVuZElkeCA8IG5vZGVDbGFzc2VzTGVuICYmIG5vZGVDbGFzc0F0dHJWYWwgIVttYXRjaEVuZElkeF0gIT09ICcgJykpICAvLyBubyBzcGFjZSBhZnRlclxuICB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIHJldHVybiB0cnVlO1xufVxuXG4vKipcbiAqIEZ1bmN0aW9uIHRoYXQgY2hlY2tzIHdoZXRoZXIgYSBnaXZlbiB0Tm9kZSBtYXRjaGVzIHRhZy1iYXNlZCBzZWxlY3RvciBhbmQgaGFzIGEgdmFsaWQgdHlwZS5cbiAqXG4gKiBNYXRjaGluZyBjYW4gYmUgcGVyZm9tZWQgaW4gMiBtb2RlczogcHJvamVjdGlvbiBtb2RlICh3aGVuIHdlIHByb2plY3Qgbm9kZXMpIGFuZCByZWd1bGFyXG4gKiBkaXJlY3RpdmUgbWF0Y2hpbmcgbW9kZS4gSW4gXCJwcm9qZWN0aW9uXCIgbW9kZSwgd2UgZG8gbm90IG5lZWQgdG8gY2hlY2sgdHlwZXMsIHNvIGlmIHRhZyBuYW1lXG4gKiBtYXRjaGVzIHNlbGVjdG9yLCB3ZSBkZWNsYXJlIGEgbWF0Y2guIEluIFwiZGlyZWN0aXZlIG1hdGNoaW5nXCIgbW9kZSwgd2UgYWxzbyBjaGVjayB3aGV0aGVyIHROb2RlXG4gKiBpcyBvZiBleHBlY3RlZCB0eXBlOlxuICogLSB3aGV0aGVyIHROb2RlIGhhcyBlaXRoZXIgRWxlbWVudCBvciBFbGVtZW50Q29udGFpbmVyIHR5cGVcbiAqIC0gb3IgaWYgd2Ugd2FudCB0byBtYXRjaCBcIm5nLXRlbXBsYXRlXCIgdGFnLCB3ZSBjaGVjayBmb3IgQ29udGFpbmVyIHR5cGVcbiAqL1xuZnVuY3Rpb24gaGFzVGFnQW5kVHlwZU1hdGNoKFxuICAgIHROb2RlOiBUTm9kZSwgY3VycmVudFNlbGVjdG9yOiBzdHJpbmcsIGlzUHJvamVjdGlvbk1vZGU6IGJvb2xlYW4pOiBib29sZWFuIHtcbiAgcmV0dXJuIGN1cnJlbnRTZWxlY3RvciA9PT0gdE5vZGUudGFnTmFtZSAmJlxuICAgICAgKGlzUHJvamVjdGlvbk1vZGUgfHxcbiAgICAgICAodE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkVsZW1lbnQgfHwgdE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkVsZW1lbnRDb250YWluZXIpIHx8XG4gICAgICAgKHROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5Db250YWluZXIgJiYgY3VycmVudFNlbGVjdG9yID09PSBOR19URU1QTEFURV9TRUxFQ1RPUikpO1xufVxuXG4vKipcbiAqIEEgdXRpbGl0eSBmdW5jdGlvbiB0byBtYXRjaCBhbiBJdnkgbm9kZSBzdGF0aWMgZGF0YSBhZ2FpbnN0IGEgc2ltcGxlIENTUyBzZWxlY3RvclxuICpcbiAqIEBwYXJhbSBub2RlIHN0YXRpYyBkYXRhIHRvIG1hdGNoXG4gKiBAcGFyYW0gc2VsZWN0b3JcbiAqIEByZXR1cm5zIHRydWUgaWYgbm9kZSBtYXRjaGVzIHRoZSBzZWxlY3Rvci5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzTm9kZU1hdGNoaW5nU2VsZWN0b3IoXG4gICAgdE5vZGU6IFROb2RlLCBzZWxlY3RvcjogQ3NzU2VsZWN0b3IsIGlzUHJvamVjdGlvbk1vZGU6IGJvb2xlYW4pOiBib29sZWFuIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQoc2VsZWN0b3JbMF0sICdTZWxlY3RvciBzaG91bGQgaGF2ZSBhIHRhZyBuYW1lJyk7XG4gIGxldCBtb2RlOiBTZWxlY3RvckZsYWdzID0gU2VsZWN0b3JGbGFncy5FTEVNRU5UO1xuICBjb25zdCBub2RlQXR0cnMgPSB0Tm9kZS5hdHRycyAhO1xuICBjb25zdCBzZWxlY3RPbmx5TWFya2VySWR4ID0gbm9kZUF0dHJzID8gbm9kZUF0dHJzLmluZGV4T2YoQXR0cmlidXRlTWFya2VyLlNlbGVjdE9ubHkpIDogLTE7XG5cbiAgLy8gV2hlbiBwcm9jZXNzaW5nIFwiOm5vdFwiIHNlbGVjdG9ycywgd2Ugc2tpcCB0byB0aGUgbmV4dCBcIjpub3RcIiBpZiB0aGVcbiAgLy8gY3VycmVudCBvbmUgZG9lc24ndCBtYXRjaFxuICBsZXQgc2tpcFRvTmV4dFNlbGVjdG9yID0gZmFsc2U7XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBzZWxlY3Rvci5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IGN1cnJlbnQgPSBzZWxlY3RvcltpXTtcbiAgICBpZiAodHlwZW9mIGN1cnJlbnQgPT09ICdudW1iZXInKSB7XG4gICAgICAvLyBJZiB3ZSBmaW5pc2ggcHJvY2Vzc2luZyBhIDpub3Qgc2VsZWN0b3IgYW5kIGl0IGhhc24ndCBmYWlsZWQsIHJldHVybiBmYWxzZVxuICAgICAgaWYgKCFza2lwVG9OZXh0U2VsZWN0b3IgJiYgIWlzUG9zaXRpdmUobW9kZSkgJiYgIWlzUG9zaXRpdmUoY3VycmVudCBhcyBudW1iZXIpKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIC8vIElmIHdlIGFyZSBza2lwcGluZyB0byB0aGUgbmV4dCA6bm90KCkgYW5kIHRoaXMgbW9kZSBmbGFnIGlzIHBvc2l0aXZlLFxuICAgICAgLy8gaXQncyBhIHBhcnQgb2YgdGhlIGN1cnJlbnQgOm5vdCgpIHNlbGVjdG9yLCBhbmQgd2Ugc2hvdWxkIGtlZXAgc2tpcHBpbmdcbiAgICAgIGlmIChza2lwVG9OZXh0U2VsZWN0b3IgJiYgaXNQb3NpdGl2ZShjdXJyZW50KSkgY29udGludWU7XG4gICAgICBza2lwVG9OZXh0U2VsZWN0b3IgPSBmYWxzZTtcbiAgICAgIG1vZGUgPSAoY3VycmVudCBhcyBudW1iZXIpIHwgKG1vZGUgJiBTZWxlY3RvckZsYWdzLk5PVCk7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAoc2tpcFRvTmV4dFNlbGVjdG9yKSBjb250aW51ZTtcblxuICAgIGlmIChtb2RlICYgU2VsZWN0b3JGbGFncy5FTEVNRU5UKSB7XG4gICAgICBtb2RlID0gU2VsZWN0b3JGbGFncy5BVFRSSUJVVEUgfCBtb2RlICYgU2VsZWN0b3JGbGFncy5OT1Q7XG4gICAgICBpZiAoY3VycmVudCAhPT0gJycgJiYgIWhhc1RhZ0FuZFR5cGVNYXRjaCh0Tm9kZSwgY3VycmVudCwgaXNQcm9qZWN0aW9uTW9kZSkgfHxcbiAgICAgICAgICBjdXJyZW50ID09PSAnJyAmJiBzZWxlY3Rvci5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgaWYgKGlzUG9zaXRpdmUobW9kZSkpIHJldHVybiBmYWxzZTtcbiAgICAgICAgc2tpcFRvTmV4dFNlbGVjdG9yID0gdHJ1ZTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3Qgc2VsZWN0b3JBdHRyVmFsdWUgPSBtb2RlICYgU2VsZWN0b3JGbGFncy5DTEFTUyA/IGN1cnJlbnQgOiBzZWxlY3RvclsrK2ldO1xuXG4gICAgICAvLyBzcGVjaWFsIGNhc2UgZm9yIG1hdGNoaW5nIGFnYWluc3QgY2xhc3NlcyB3aGVuIGEgdE5vZGUgaGFzIGJlZW4gaW5zdGFudGlhdGVkIHdpdGhcbiAgICAgIC8vIGNsYXNzIGFuZCBzdHlsZSB2YWx1ZXMgYXMgc2VwYXJhdGUgYXR0cmlidXRlIHZhbHVlcyAoZS5nLiBbJ3RpdGxlJywgQ0xBU1MsICdmb28nXSlcbiAgICAgIGlmICgobW9kZSAmIFNlbGVjdG9yRmxhZ3MuQ0xBU1MpICYmIHROb2RlLnN0eWxpbmdUZW1wbGF0ZSkge1xuICAgICAgICBpZiAoIWlzQ3NzQ2xhc3NNYXRjaGluZyhyZWFkQ2xhc3NWYWx1ZUZyb21UTm9kZSh0Tm9kZSksIHNlbGVjdG9yQXR0clZhbHVlIGFzIHN0cmluZykpIHtcbiAgICAgICAgICBpZiAoaXNQb3NpdGl2ZShtb2RlKSkgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgIHNraXBUb05leHRTZWxlY3RvciA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGF0dHJOYW1lID0gKG1vZGUgJiBTZWxlY3RvckZsYWdzLkNMQVNTKSA/ICdjbGFzcycgOiBjdXJyZW50O1xuICAgICAgY29uc3QgYXR0ckluZGV4SW5Ob2RlID0gZmluZEF0dHJJbmRleEluTm9kZShhdHRyTmFtZSwgbm9kZUF0dHJzKTtcblxuICAgICAgaWYgKGF0dHJJbmRleEluTm9kZSA9PT0gLTEpIHtcbiAgICAgICAgaWYgKGlzUG9zaXRpdmUobW9kZSkpIHJldHVybiBmYWxzZTtcbiAgICAgICAgc2tpcFRvTmV4dFNlbGVjdG9yID0gdHJ1ZTtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGlmIChzZWxlY3RvckF0dHJWYWx1ZSAhPT0gJycpIHtcbiAgICAgICAgbGV0IG5vZGVBdHRyVmFsdWU6IHN0cmluZztcbiAgICAgICAgY29uc3QgbWF5YmVBdHRyTmFtZSA9IG5vZGVBdHRyc1thdHRySW5kZXhJbk5vZGVdO1xuICAgICAgICBpZiAoc2VsZWN0T25seU1hcmtlcklkeCA+IC0xICYmIGF0dHJJbmRleEluTm9kZSA+IHNlbGVjdE9ubHlNYXJrZXJJZHgpIHtcbiAgICAgICAgICBub2RlQXR0clZhbHVlID0gJyc7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbmdEZXZNb2RlICYmIGFzc2VydE5vdEVxdWFsKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgbWF5YmVBdHRyTmFtZSwgQXR0cmlidXRlTWFya2VyLk5hbWVzcGFjZVVSSSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICdXZSBkbyBub3QgbWF0Y2ggZGlyZWN0aXZlcyBvbiBuYW1lc3BhY2VkIGF0dHJpYnV0ZXMnKTtcbiAgICAgICAgICBub2RlQXR0clZhbHVlID0gbm9kZUF0dHJzW2F0dHJJbmRleEluTm9kZSArIDFdIGFzIHN0cmluZztcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGNvbXBhcmVBZ2FpbnN0Q2xhc3NOYW1lID0gbW9kZSAmIFNlbGVjdG9yRmxhZ3MuQ0xBU1MgPyBub2RlQXR0clZhbHVlIDogbnVsbDtcbiAgICAgICAgaWYgKGNvbXBhcmVBZ2FpbnN0Q2xhc3NOYW1lICYmXG4gICAgICAgICAgICAgICAgIWlzQ3NzQ2xhc3NNYXRjaGluZyhjb21wYXJlQWdhaW5zdENsYXNzTmFtZSwgc2VsZWN0b3JBdHRyVmFsdWUgYXMgc3RyaW5nKSB8fFxuICAgICAgICAgICAgbW9kZSAmIFNlbGVjdG9yRmxhZ3MuQVRUUklCVVRFICYmIHNlbGVjdG9yQXR0clZhbHVlICE9PSBub2RlQXR0clZhbHVlKSB7XG4gICAgICAgICAgaWYgKGlzUG9zaXRpdmUobW9kZSkpIHJldHVybiBmYWxzZTtcbiAgICAgICAgICBza2lwVG9OZXh0U2VsZWN0b3IgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGlzUG9zaXRpdmUobW9kZSkgfHwgc2tpcFRvTmV4dFNlbGVjdG9yO1xufVxuXG5mdW5jdGlvbiBpc1Bvc2l0aXZlKG1vZGU6IFNlbGVjdG9yRmxhZ3MpOiBib29sZWFuIHtcbiAgcmV0dXJuIChtb2RlICYgU2VsZWN0b3JGbGFncy5OT1QpID09PSAwO1xufVxuXG5mdW5jdGlvbiByZWFkQ2xhc3NWYWx1ZUZyb21UTm9kZSh0Tm9kZTogVE5vZGUpOiBzdHJpbmcge1xuICAvLyBjb21wYXJpbmcgYWdhaW5zdCBDU1MgY2xhc3MgdmFsdWVzIGlzIGNvbXBsZXggYmVjYXVzZSB0aGUgY29tcGlsZXIgZG9lc24ndCBwbGFjZSB0aGVtIGFzXG4gIC8vIHJlZ3VsYXIgYXR0cmlidXRlcyB3aGVuIGFuIGVsZW1lbnQgaXMgY3JlYXRlZC4gSW5zdGVhZCwgdGhlIGNsYXNzZXMgKGFuZCBzdHlsZXMgZm9yXG4gIC8vIHRoYXQgbWF0dGVyKSBhcmUgcGxhY2VkIGluIGEgc3BlY2lhbCBzdHlsaW5nIGNvbnRleHQgdGhhdCBpcyB1c2VkIGZvciByZXNvbHZpbmcgYWxsXG4gIC8vIGNsYXNzL3N0eWxlIHZhbHVlcyBhY3Jvc3Mgc3RhdGljIGF0dHJpYnV0ZXMsIFtzdHlsZV0vW2NsYXNzXSBhbmQgW3N0eWxlLnByb3BdL1tjbGFzcy5uYW1lXVxuICAvLyBiaW5kaW5ncy4gVGhlcmVmb3JlIGlmIGFuZCB3aGVuIHRoZSBzdHlsaW5nIGNvbnRleHQgZXhpc3RzIHRoZW4gdGhlIGNsYXNzIHZhbHVlcyBhcmUgdG8gYmVcbiAgLy8gZXh0cmFjdGVkIGJ5IHRoZSBjb250ZXh0IGhlbHBlciBjb2RlIGJlbG93Li4uXG4gIHJldHVybiB0Tm9kZS5zdHlsaW5nVGVtcGxhdGUgPyBnZXRJbml0aWFsQ2xhc3NOYW1lVmFsdWUodE5vZGUuc3R5bGluZ1RlbXBsYXRlKSA6ICcnO1xufVxuXG4vKipcbiAqIEV4YW1pbmVzIGFuIGF0dHJpYnV0ZXMgZGVmaW5pdGlvbiBhcnJheSBmcm9tIGEgbm9kZSB0byBmaW5kIHRoZSBpbmRleCBvZiB0aGVcbiAqIGF0dHJpYnV0ZSB3aXRoIHRoZSBzcGVjaWZpZWQgbmFtZS5cbiAqXG4gKiBOT1RFOiBXaWxsIG5vdCBmaW5kIG5hbWVzcGFjZWQgYXR0cmlidXRlcy5cbiAqXG4gKiBAcGFyYW0gbmFtZSB0aGUgbmFtZSBvZiB0aGUgYXR0cmlidXRlIHRvIGZpbmRcbiAqIEBwYXJhbSBhdHRycyB0aGUgYXR0cmlidXRlIGFycmF5IHRvIGV4YW1pbmVcbiAqL1xuZnVuY3Rpb24gZmluZEF0dHJJbmRleEluTm9kZShuYW1lOiBzdHJpbmcsIGF0dHJzOiBUQXR0cmlidXRlcyB8IG51bGwpOiBudW1iZXIge1xuICBpZiAoYXR0cnMgPT09IG51bGwpIHJldHVybiAtMTtcbiAgbGV0IHNlbGVjdE9ubHlNb2RlID0gZmFsc2U7XG4gIGxldCBpID0gMDtcbiAgd2hpbGUgKGkgPCBhdHRycy5sZW5ndGgpIHtcbiAgICBjb25zdCBtYXliZUF0dHJOYW1lID0gYXR0cnNbaV07XG4gICAgaWYgKG1heWJlQXR0ck5hbWUgPT09IG5hbWUpIHtcbiAgICAgIHJldHVybiBpO1xuICAgIH0gZWxzZSBpZiAobWF5YmVBdHRyTmFtZSA9PT0gQXR0cmlidXRlTWFya2VyLk5hbWVzcGFjZVVSSSkge1xuICAgICAgLy8gTk9URShiZW5sZXNoKTogd2lsbCBub3QgZmluZCBuYW1lc3BhY2VkIGF0dHJpYnV0ZXMuIFRoaXMgaXMgYnkgZGVzaWduLlxuICAgICAgaSArPSA0O1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAobWF5YmVBdHRyTmFtZSA9PT0gQXR0cmlidXRlTWFya2VyLlNlbGVjdE9ubHkpIHtcbiAgICAgICAgc2VsZWN0T25seU1vZGUgPSB0cnVlO1xuICAgICAgfVxuICAgICAgaSArPSBzZWxlY3RPbmx5TW9kZSA/IDEgOiAyO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiAtMTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzTm9kZU1hdGNoaW5nU2VsZWN0b3JMaXN0KFxuICAgIHROb2RlOiBUTm9kZSwgc2VsZWN0b3I6IENzc1NlbGVjdG9yTGlzdCwgaXNQcm9qZWN0aW9uTW9kZTogYm9vbGVhbiA9IGZhbHNlKTogYm9vbGVhbiB7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgc2VsZWN0b3IubGVuZ3RoOyBpKyspIHtcbiAgICBpZiAoaXNOb2RlTWF0Y2hpbmdTZWxlY3Rvcih0Tm9kZSwgc2VsZWN0b3JbaV0sIGlzUHJvamVjdGlvbk1vZGUpKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gZmFsc2U7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRQcm9qZWN0QXNBdHRyVmFsdWUodE5vZGU6IFROb2RlKTogc3RyaW5nfG51bGwge1xuICBjb25zdCBub2RlQXR0cnMgPSB0Tm9kZS5hdHRycztcbiAgaWYgKG5vZGVBdHRycyAhPSBudWxsKSB7XG4gICAgY29uc3QgbmdQcm9qZWN0QXNBdHRySWR4ID0gbm9kZUF0dHJzLmluZGV4T2YoTkdfUFJPSkVDVF9BU19BVFRSX05BTUUpO1xuICAgIC8vIG9ubHkgY2hlY2sgZm9yIG5nUHJvamVjdEFzIGluIGF0dHJpYnV0ZSBuYW1lcywgZG9uJ3QgYWNjaWRlbnRhbGx5IG1hdGNoIGF0dHJpYnV0ZSdzIHZhbHVlXG4gICAgLy8gKGF0dHJpYnV0ZSBuYW1lcyBhcmUgc3RvcmVkIGF0IGV2ZW4gaW5kZXhlcylcbiAgICBpZiAoKG5nUHJvamVjdEFzQXR0cklkeCAmIDEpID09PSAwKSB7XG4gICAgICByZXR1cm4gbm9kZUF0dHJzW25nUHJvamVjdEFzQXR0cklkeCArIDFdIGFzIHN0cmluZztcbiAgICB9XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbi8qKlxuICogQ2hlY2tzIGEgZ2l2ZW4gbm9kZSBhZ2FpbnN0IG1hdGNoaW5nIHNlbGVjdG9ycyBhbmQgcmV0dXJuc1xuICogc2VsZWN0b3IgaW5kZXggKG9yIDAgaWYgbm9uZSBtYXRjaGVkKS5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIHRha2VzIGludG8gYWNjb3VudCB0aGUgbmdQcm9qZWN0QXMgYXR0cmlidXRlOiBpZiBwcmVzZW50IGl0cyB2YWx1ZSB3aWxsIGJlIGNvbXBhcmVkXG4gKiB0byB0aGUgcmF3ICh1bi1wYXJzZWQpIENTUyBzZWxlY3RvciBpbnN0ZWFkIG9mIHVzaW5nIHN0YW5kYXJkIHNlbGVjdG9yIG1hdGNoaW5nIGxvZ2ljLlxuICovXG5leHBvcnQgZnVuY3Rpb24gbWF0Y2hpbmdTZWxlY3RvckluZGV4KFxuICAgIHROb2RlOiBUTm9kZSwgc2VsZWN0b3JzOiBDc3NTZWxlY3Rvckxpc3RbXSwgdGV4dFNlbGVjdG9yczogc3RyaW5nW10pOiBudW1iZXIge1xuICBjb25zdCBuZ1Byb2plY3RBc0F0dHJWYWwgPSBnZXRQcm9qZWN0QXNBdHRyVmFsdWUodE5vZGUpO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IHNlbGVjdG9ycy5sZW5ndGg7IGkrKykge1xuICAgIC8vIGlmIGEgbm9kZSBoYXMgdGhlIG5nUHJvamVjdEFzIGF0dHJpYnV0ZSBtYXRjaCBpdCBhZ2FpbnN0IHVucGFyc2VkIHNlbGVjdG9yXG4gICAgLy8gbWF0Y2ggYSBub2RlIGFnYWluc3QgYSBwYXJzZWQgc2VsZWN0b3Igb25seSBpZiBuZ1Byb2plY3RBcyBhdHRyaWJ1dGUgaXMgbm90IHByZXNlbnRcbiAgICBpZiAobmdQcm9qZWN0QXNBdHRyVmFsID09PSB0ZXh0U2VsZWN0b3JzW2ldIHx8XG4gICAgICAgIG5nUHJvamVjdEFzQXR0clZhbCA9PT0gbnVsbCAmJlxuICAgICAgICAgICAgaXNOb2RlTWF0Y2hpbmdTZWxlY3Rvckxpc3QodE5vZGUsIHNlbGVjdG9yc1tpXSwgLyogaXNQcm9qZWN0aW9uTW9kZSAqLyB0cnVlKSkge1xuICAgICAgcmV0dXJuIGkgKyAxOyAgLy8gZmlyc3QgbWF0Y2hpbmcgc2VsZWN0b3IgXCJjYXB0dXJlc1wiIGEgZ2l2ZW4gbm9kZVxuICAgIH1cbiAgfVxuICByZXR1cm4gMDtcbn1cbiJdfQ==