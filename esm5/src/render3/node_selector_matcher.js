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
var unusedValueToPlacateAjd = unused1 + unused2;
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
 * A utility function to match an Ivy node static data against a simple CSS selector
 *
 * @param node static data to match
 * @param selector
 * @returns true if node matches the selector.
 */
export function isNodeMatchingSelector(tNode, selector) {
    ngDevMode && assertNotNull(selector[0], 'Selector should have a tag name');
    var mode = 4 /* ELEMENT */;
    var nodeAttrs = tNode.attrs;
    var selectOnlyMarkerIdx = nodeAttrs ? nodeAttrs.indexOf(1 /* SELECT_ONLY */) : -1;
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
            if (current !== '' && current !== tNode.tagName) {
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
                var nodeAttrValue = selectOnlyMarkerIdx > -1 && attrIndexInNode > selectOnlyMarkerIdx ?
                    '' :
                    nodeAttrs[attrIndexInNode + 1];
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
function findAttrIndexInNode(name, attrs) {
    var step = 2;
    if (attrs === null)
        return -1;
    for (var i = 0; i < attrs.length; i += step) {
        var attrName = attrs[i];
        if (attrName === name)
            return i;
        if (attrName === 1 /* SELECT_ONLY */) {
            step = 1;
        }
    }
    return -1;
}
export function isNodeMatchingSelectorList(tNode, selector) {
    for (var i = 0; i < selector.length; i++) {
        if (isNodeMatchingSelector(tNode, selector[i])) {
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
            ngProjectAsAttrVal === null && isNodeMatchingSelectorList(tNode, selectors[i])) {
            return i + 1; // first matching selector "captures" a given node
        }
    }
    return 0;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9kZV9zZWxlY3Rvcl9tYXRjaGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9ub2RlX3NlbGVjdG9yX21hdGNoZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxlQUFlLENBQUM7QUFFdkIsT0FBTyxFQUFDLGFBQWEsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUN2QyxPQUFPLEVBQXNDLDZCQUE2QixJQUFJLE9BQU8sRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQ2hILE9BQU8sRUFBK0IsdUJBQXVCLEVBQWlCLDZCQUE2QixJQUFJLE9BQU8sRUFBQyxNQUFNLHlCQUF5QixDQUFDO0FBRXZKLElBQU0sdUJBQXVCLEdBQUcsT0FBTyxHQUFHLE9BQU8sQ0FBQztBQUVsRCw0QkFBNEIsZ0JBQXdCLEVBQUUsZUFBdUI7SUFDM0UsSUFBTSxjQUFjLEdBQUcsZ0JBQWdCLENBQUMsTUFBTSxDQUFDO0lBQy9DLElBQU0sVUFBVSxHQUFHLGdCQUFrQixDQUFDLE9BQU8sQ0FBQyxlQUFlLENBQUMsQ0FBQztJQUMvRCxJQUFNLFdBQVcsR0FBRyxVQUFVLEdBQUcsZUFBZSxDQUFDLE1BQU0sQ0FBQztJQUN4RCxJQUFJLFVBQVUsS0FBSyxDQUFDLENBQUMsQ0FBa0QsV0FBVztXQUMzRSxDQUFDLFVBQVUsR0FBRyxDQUFDLElBQUksZ0JBQWtCLENBQUMsVUFBVSxHQUFHLENBQUMsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFFLGtCQUFrQjs7WUFFckYsQ0FBQyxXQUFXLEdBQUcsY0FBYyxJQUFJLGdCQUFrQixDQUFDLFdBQVcsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxFQUFHLGlCQUFpQjtLQUNqRztRQUNFLE9BQU8sS0FBSyxDQUFDO0tBQ2Q7SUFDRCxPQUFPLElBQUksQ0FBQztBQUNkLENBQUM7QUFFRDs7Ozs7O0dBTUc7QUFD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QkFBdUIsQ0FBQyxDQUFDO1FBQ3RFLDRGQUE0RjtRQUM1RiwrQ0FBK0M7UUFDL0MsSUFBSSxDQUFDLGtCQUFrQixHQUFHLENBQUMsQ0FBQyxLQUFLLENBQUMsRUFBRTtZQUNsQyxPQUFPLFNBQVMsQ0FBQyxrQkFBa0IsR0FBRyxDQUFDLENBQVcsQ0FBQztTQUNwRDtLQUNGO0lBQ0QsT0FBTyxJQUFJLENBQUM7QUFDZCxDQUFDO0FBRUQ7Ozs7OztHQU1HO0FBQ0gsTUFBTSxnQ0FDRixLQUFZLEVBQUUsU0FBNEIsRUFBRSxhQUF1QjtJQUNyRSxJQUFNLGtCQUFrQixHQUFHLHFCQUFxQixDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ3hELEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxTQUFTLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO1FBQ3pDLDZFQUE2RTtRQUM3RSxzRkFBc0Y7UUFDdEYsSUFBSSxrQkFBa0IsS0FBSyxhQUFhLENBQUMsQ0FBQyxDQUFDO1lBQ3ZDLGtCQUFrQixLQUFLLElBQUksSUFBSSwwQkFBMEIsQ0FBQyxLQUFLLEVBQUUsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUU7WUFDbEYsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUUsa0RBQWtEO1NBQ2xFO0tBQ0Y7SUFDRCxPQUFPLENBQUMsQ0FBQztBQUNYLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCAnLi9uZ19kZXZfbW9kZSc7XG5cbmltcG9ydCB7YXNzZXJ0Tm90TnVsbH0gZnJvbSAnLi9hc3NlcnQnO1xuaW1wb3J0IHtBdHRyaWJ1dGVNYXJrZXIsIFRBdHRyaWJ1dGVzLCBUTm9kZSwgdW51c2VkVmFsdWVFeHBvcnRUb1BsYWNhdGVBamQgYXMgdW51c2VkMX0gZnJvbSAnLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtDc3NTZWxlY3RvciwgQ3NzU2VsZWN0b3JMaXN0LCBOR19QUk9KRUNUX0FTX0FUVFJfTkFNRSwgU2VsZWN0b3JGbGFncywgdW51c2VkVmFsdWVFeHBvcnRUb1BsYWNhdGVBamQgYXMgdW51c2VkMn0gZnJvbSAnLi9pbnRlcmZhY2VzL3Byb2plY3Rpb24nO1xuXG5jb25zdCB1bnVzZWRWYWx1ZVRvUGxhY2F0ZUFqZCA9IHVudXNlZDEgKyB1bnVzZWQyO1xuXG5mdW5jdGlvbiBpc0Nzc0NsYXNzTWF0Y2hpbmcobm9kZUNsYXNzQXR0clZhbDogc3RyaW5nLCBjc3NDbGFzc1RvTWF0Y2g6IHN0cmluZyk6IGJvb2xlYW4ge1xuICBjb25zdCBub2RlQ2xhc3Nlc0xlbiA9IG5vZGVDbGFzc0F0dHJWYWwubGVuZ3RoO1xuICBjb25zdCBtYXRjaEluZGV4ID0gbm9kZUNsYXNzQXR0clZhbCAhLmluZGV4T2YoY3NzQ2xhc3NUb01hdGNoKTtcbiAgY29uc3QgbWF0Y2hFbmRJZHggPSBtYXRjaEluZGV4ICsgY3NzQ2xhc3NUb01hdGNoLmxlbmd0aDtcbiAgaWYgKG1hdGNoSW5kZXggPT09IC0xICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBubyBtYXRjaFxuICAgICAgfHwgKG1hdGNoSW5kZXggPiAwICYmIG5vZGVDbGFzc0F0dHJWYWwgIVttYXRjaEluZGV4IC0gMV0gIT09ICcgJykgIC8vIG5vIHNwYWNlIGJlZm9yZVxuICAgICAgfHxcbiAgICAgIChtYXRjaEVuZElkeCA8IG5vZGVDbGFzc2VzTGVuICYmIG5vZGVDbGFzc0F0dHJWYWwgIVttYXRjaEVuZElkeF0gIT09ICcgJykpICAvLyBubyBzcGFjZSBhZnRlclxuICB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIHJldHVybiB0cnVlO1xufVxuXG4vKipcbiAqIEEgdXRpbGl0eSBmdW5jdGlvbiB0byBtYXRjaCBhbiBJdnkgbm9kZSBzdGF0aWMgZGF0YSBhZ2FpbnN0IGEgc2ltcGxlIENTUyBzZWxlY3RvclxuICpcbiAqIEBwYXJhbSBub2RlIHN0YXRpYyBkYXRhIHRvIG1hdGNoXG4gKiBAcGFyYW0gc2VsZWN0b3JcbiAqIEByZXR1cm5zIHRydWUgaWYgbm9kZSBtYXRjaGVzIHRoZSBzZWxlY3Rvci5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzTm9kZU1hdGNoaW5nU2VsZWN0b3IodE5vZGU6IFROb2RlLCBzZWxlY3RvcjogQ3NzU2VsZWN0b3IpOiBib29sZWFuIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vdE51bGwoc2VsZWN0b3JbMF0sICdTZWxlY3RvciBzaG91bGQgaGF2ZSBhIHRhZyBuYW1lJyk7XG5cbiAgbGV0IG1vZGU6IFNlbGVjdG9yRmxhZ3MgPSBTZWxlY3RvckZsYWdzLkVMRU1FTlQ7XG4gIGNvbnN0IG5vZGVBdHRycyA9IHROb2RlLmF0dHJzICE7XG4gIGNvbnN0IHNlbGVjdE9ubHlNYXJrZXJJZHggPSBub2RlQXR0cnMgPyBub2RlQXR0cnMuaW5kZXhPZihBdHRyaWJ1dGVNYXJrZXIuU0VMRUNUX09OTFkpIDogLTE7XG5cbiAgLy8gV2hlbiBwcm9jZXNzaW5nIFwiOm5vdFwiIHNlbGVjdG9ycywgd2Ugc2tpcCB0byB0aGUgbmV4dCBcIjpub3RcIiBpZiB0aGVcbiAgLy8gY3VycmVudCBvbmUgZG9lc24ndCBtYXRjaFxuICBsZXQgc2tpcFRvTmV4dFNlbGVjdG9yID0gZmFsc2U7XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBzZWxlY3Rvci5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IGN1cnJlbnQgPSBzZWxlY3RvcltpXTtcbiAgICBpZiAodHlwZW9mIGN1cnJlbnQgPT09ICdudW1iZXInKSB7XG4gICAgICAvLyBJZiB3ZSBmaW5pc2ggcHJvY2Vzc2luZyBhIDpub3Qgc2VsZWN0b3IgYW5kIGl0IGhhc24ndCBmYWlsZWQsIHJldHVybiBmYWxzZVxuICAgICAgaWYgKCFza2lwVG9OZXh0U2VsZWN0b3IgJiYgIWlzUG9zaXRpdmUobW9kZSkgJiYgIWlzUG9zaXRpdmUoY3VycmVudCBhcyBudW1iZXIpKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIC8vIElmIHdlIGFyZSBza2lwcGluZyB0byB0aGUgbmV4dCA6bm90KCkgYW5kIHRoaXMgbW9kZSBmbGFnIGlzIHBvc2l0aXZlLFxuICAgICAgLy8gaXQncyBhIHBhcnQgb2YgdGhlIGN1cnJlbnQgOm5vdCgpIHNlbGVjdG9yLCBhbmQgd2Ugc2hvdWxkIGtlZXAgc2tpcHBpbmdcbiAgICAgIGlmIChza2lwVG9OZXh0U2VsZWN0b3IgJiYgaXNQb3NpdGl2ZShjdXJyZW50KSkgY29udGludWU7XG4gICAgICBza2lwVG9OZXh0U2VsZWN0b3IgPSBmYWxzZTtcbiAgICAgIG1vZGUgPSAoY3VycmVudCBhcyBudW1iZXIpIHwgKG1vZGUgJiBTZWxlY3RvckZsYWdzLk5PVCk7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAoc2tpcFRvTmV4dFNlbGVjdG9yKSBjb250aW51ZTtcblxuICAgIGlmIChtb2RlICYgU2VsZWN0b3JGbGFncy5FTEVNRU5UKSB7XG4gICAgICBtb2RlID0gU2VsZWN0b3JGbGFncy5BVFRSSUJVVEUgfCBtb2RlICYgU2VsZWN0b3JGbGFncy5OT1Q7XG4gICAgICBpZiAoY3VycmVudCAhPT0gJycgJiYgY3VycmVudCAhPT0gdE5vZGUudGFnTmFtZSkge1xuICAgICAgICBpZiAoaXNQb3NpdGl2ZShtb2RlKSkgcmV0dXJuIGZhbHNlO1xuICAgICAgICBza2lwVG9OZXh0U2VsZWN0b3IgPSB0cnVlO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBhdHRyTmFtZSA9IG1vZGUgJiBTZWxlY3RvckZsYWdzLkNMQVNTID8gJ2NsYXNzJyA6IGN1cnJlbnQ7XG4gICAgICBjb25zdCBhdHRySW5kZXhJbk5vZGUgPSBmaW5kQXR0ckluZGV4SW5Ob2RlKGF0dHJOYW1lLCBub2RlQXR0cnMpO1xuXG4gICAgICBpZiAoYXR0ckluZGV4SW5Ob2RlID09PSAtMSkge1xuICAgICAgICBpZiAoaXNQb3NpdGl2ZShtb2RlKSkgcmV0dXJuIGZhbHNlO1xuICAgICAgICBza2lwVG9OZXh0U2VsZWN0b3IgPSB0cnVlO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgY29uc3Qgc2VsZWN0b3JBdHRyVmFsdWUgPSBtb2RlICYgU2VsZWN0b3JGbGFncy5DTEFTUyA/IGN1cnJlbnQgOiBzZWxlY3RvclsrK2ldO1xuICAgICAgaWYgKHNlbGVjdG9yQXR0clZhbHVlICE9PSAnJykge1xuICAgICAgICBjb25zdCBub2RlQXR0clZhbHVlID0gc2VsZWN0T25seU1hcmtlcklkeCA+IC0xICYmIGF0dHJJbmRleEluTm9kZSA+IHNlbGVjdE9ubHlNYXJrZXJJZHggP1xuICAgICAgICAgICAgJycgOlxuICAgICAgICAgICAgbm9kZUF0dHJzW2F0dHJJbmRleEluTm9kZSArIDFdO1xuICAgICAgICBpZiAobW9kZSAmIFNlbGVjdG9yRmxhZ3MuQ0xBU1MgJiZcbiAgICAgICAgICAgICAgICAhaXNDc3NDbGFzc01hdGNoaW5nKG5vZGVBdHRyVmFsdWUgYXMgc3RyaW5nLCBzZWxlY3RvckF0dHJWYWx1ZSBhcyBzdHJpbmcpIHx8XG4gICAgICAgICAgICBtb2RlICYgU2VsZWN0b3JGbGFncy5BVFRSSUJVVEUgJiYgc2VsZWN0b3JBdHRyVmFsdWUgIT09IG5vZGVBdHRyVmFsdWUpIHtcbiAgICAgICAgICBpZiAoaXNQb3NpdGl2ZShtb2RlKSkgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgIHNraXBUb05leHRTZWxlY3RvciA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gaXNQb3NpdGl2ZShtb2RlKSB8fCBza2lwVG9OZXh0U2VsZWN0b3I7XG59XG5cbmZ1bmN0aW9uIGlzUG9zaXRpdmUobW9kZTogU2VsZWN0b3JGbGFncyk6IGJvb2xlYW4ge1xuICByZXR1cm4gKG1vZGUgJiBTZWxlY3RvckZsYWdzLk5PVCkgPT09IDA7XG59XG5cbmZ1bmN0aW9uIGZpbmRBdHRySW5kZXhJbk5vZGUobmFtZTogc3RyaW5nLCBhdHRyczogVEF0dHJpYnV0ZXMgfCBudWxsKTogbnVtYmVyIHtcbiAgbGV0IHN0ZXAgPSAyO1xuICBpZiAoYXR0cnMgPT09IG51bGwpIHJldHVybiAtMTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBhdHRycy5sZW5ndGg7IGkgKz0gc3RlcCkge1xuICAgIGNvbnN0IGF0dHJOYW1lID0gYXR0cnNbaV07XG4gICAgaWYgKGF0dHJOYW1lID09PSBuYW1lKSByZXR1cm4gaTtcbiAgICBpZiAoYXR0ck5hbWUgPT09IEF0dHJpYnV0ZU1hcmtlci5TRUxFQ1RfT05MWSkge1xuICAgICAgc3RlcCA9IDE7XG4gICAgfVxuICB9XG4gIHJldHVybiAtMTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzTm9kZU1hdGNoaW5nU2VsZWN0b3JMaXN0KHROb2RlOiBUTm9kZSwgc2VsZWN0b3I6IENzc1NlbGVjdG9yTGlzdCk6IGJvb2xlYW4ge1xuICBmb3IgKGxldCBpID0gMDsgaSA8IHNlbGVjdG9yLmxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKGlzTm9kZU1hdGNoaW5nU2VsZWN0b3IodE5vZGUsIHNlbGVjdG9yW2ldKSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0UHJvamVjdEFzQXR0clZhbHVlKHROb2RlOiBUTm9kZSk6IHN0cmluZ3xudWxsIHtcbiAgY29uc3Qgbm9kZUF0dHJzID0gdE5vZGUuYXR0cnM7XG4gIGlmIChub2RlQXR0cnMgIT0gbnVsbCkge1xuICAgIGNvbnN0IG5nUHJvamVjdEFzQXR0cklkeCA9IG5vZGVBdHRycy5pbmRleE9mKE5HX1BST0pFQ1RfQVNfQVRUUl9OQU1FKTtcbiAgICAvLyBvbmx5IGNoZWNrIGZvciBuZ1Byb2plY3RBcyBpbiBhdHRyaWJ1dGUgbmFtZXMsIGRvbid0IGFjY2lkZW50YWxseSBtYXRjaCBhdHRyaWJ1dGUncyB2YWx1ZVxuICAgIC8vIChhdHRyaWJ1dGUgbmFtZXMgYXJlIHN0b3JlZCBhdCBldmVuIGluZGV4ZXMpXG4gICAgaWYgKChuZ1Byb2plY3RBc0F0dHJJZHggJiAxKSA9PT0gMCkge1xuICAgICAgcmV0dXJuIG5vZGVBdHRyc1tuZ1Byb2plY3RBc0F0dHJJZHggKyAxXSBhcyBzdHJpbmc7XG4gICAgfVxuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG4vKipcbiAqIENoZWNrcyBhIGdpdmVuIG5vZGUgYWdhaW5zdCBtYXRjaGluZyBzZWxlY3RvcnMgYW5kIHJldHVybnNcbiAqIHNlbGVjdG9yIGluZGV4IChvciAwIGlmIG5vbmUgbWF0Y2hlZCkuXG4gKlxuICogVGhpcyBmdW5jdGlvbiB0YWtlcyBpbnRvIGFjY291bnQgdGhlIG5nUHJvamVjdEFzIGF0dHJpYnV0ZTogaWYgcHJlc2VudCBpdHMgdmFsdWUgd2lsbCBiZSBjb21wYXJlZFxuICogdG8gdGhlIHJhdyAodW4tcGFyc2VkKSBDU1Mgc2VsZWN0b3IgaW5zdGVhZCBvZiB1c2luZyBzdGFuZGFyZCBzZWxlY3RvciBtYXRjaGluZyBsb2dpYy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG1hdGNoaW5nU2VsZWN0b3JJbmRleChcbiAgICB0Tm9kZTogVE5vZGUsIHNlbGVjdG9yczogQ3NzU2VsZWN0b3JMaXN0W10sIHRleHRTZWxlY3RvcnM6IHN0cmluZ1tdKTogbnVtYmVyIHtcbiAgY29uc3QgbmdQcm9qZWN0QXNBdHRyVmFsID0gZ2V0UHJvamVjdEFzQXR0clZhbHVlKHROb2RlKTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBzZWxlY3RvcnMubGVuZ3RoOyBpKyspIHtcbiAgICAvLyBpZiBhIG5vZGUgaGFzIHRoZSBuZ1Byb2plY3RBcyBhdHRyaWJ1dGUgbWF0Y2ggaXQgYWdhaW5zdCB1bnBhcnNlZCBzZWxlY3RvclxuICAgIC8vIG1hdGNoIGEgbm9kZSBhZ2FpbnN0IGEgcGFyc2VkIHNlbGVjdG9yIG9ubHkgaWYgbmdQcm9qZWN0QXMgYXR0cmlidXRlIGlzIG5vdCBwcmVzZW50XG4gICAgaWYgKG5nUHJvamVjdEFzQXR0clZhbCA9PT0gdGV4dFNlbGVjdG9yc1tpXSB8fFxuICAgICAgICBuZ1Byb2plY3RBc0F0dHJWYWwgPT09IG51bGwgJiYgaXNOb2RlTWF0Y2hpbmdTZWxlY3Rvckxpc3QodE5vZGUsIHNlbGVjdG9yc1tpXSkpIHtcbiAgICAgIHJldHVybiBpICsgMTsgIC8vIGZpcnN0IG1hdGNoaW5nIHNlbGVjdG9yIFwiY2FwdHVyZXNcIiBhIGdpdmVuIG5vZGVcbiAgICB9XG4gIH1cbiAgcmV0dXJuIDA7XG59XG4iXX0=