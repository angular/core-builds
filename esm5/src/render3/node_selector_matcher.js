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
    var nodeAttrs = (tNode.attrs);
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
                var nodeAttrValue = nodeAttrs[attrIndexInNode + 1];
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
    if (attrs === null)
        return -1;
    for (var i = 0; i < attrs.length; i += 2) {
        if (attrs[i] === name)
            return i;
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9kZV9zZWxlY3Rvcl9tYXRjaGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9ub2RlX3NlbGVjdG9yX21hdGNoZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQVFBLE9BQU8sZUFBZSxDQUFDO0FBRXZCLE9BQU8sRUFBQyxhQUFhLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDdkMsT0FBTyxFQUFRLDZCQUE2QixJQUFJLE9BQU8sRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQ2xGLE9BQU8sRUFBK0IsdUJBQXVCLEVBQWlCLDZCQUE2QixJQUFJLE9BQU8sRUFBQyxNQUFNLHlCQUF5QixDQUFDO0FBRXZKLElBQU0sdUJBQXVCLEdBQUcsT0FBTyxHQUFHLE9BQU8sQ0FBQztBQUVsRCw0QkFBNEIsZ0JBQXdCLEVBQUUsZUFBdUI7SUFDM0UsSUFBTSxjQUFjLEdBQUcsZ0JBQWdCLENBQUMsTUFBTSxDQUFDO0lBQy9DLElBQU0sVUFBVSxHQUFHLGdCQUFrQixDQUFDLE9BQU8sQ0FBQyxlQUFlLENBQUMsQ0FBQztJQUMvRCxJQUFNLFdBQVcsR0FBRyxVQUFVLEdBQUcsZUFBZSxDQUFDLE1BQU0sQ0FBQztJQUN4RCxJQUFJLFVBQVUsS0FBSyxDQUFDLENBQUM7V0FDZCxDQUFDLFVBQVUsR0FBRyxDQUFDLElBQUksZ0JBQWtCLENBQUMsVUFBVSxHQUFHLENBQUMsQ0FBQyxLQUFLLEdBQUcsQ0FBQzs7WUFFakUsQ0FBQyxXQUFXLEdBQUcsY0FBYyxJQUFJLGdCQUFrQixDQUFDLFdBQVcsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxFQUFHLGlCQUFpQjtLQUNqRztRQUNFLE9BQU8sS0FBSyxDQUFDO0tBQ2Q7SUFDRCxPQUFPLElBQUksQ0FBQztDQUNiOzs7Ozs7OztBQVNELE1BQU0saUNBQWlDLEtBQVksRUFBRSxRQUFxQjtJQUN4RSxTQUFTLElBQUks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MEIsQ0FBQyxLQUFLLEVBQUUsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUU7WUFDbEYsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1NBQ2Q7S0FDRjtJQUNELE9BQU8sQ0FBQyxDQUFDO0NBQ1YiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCAnLi9uZ19kZXZfbW9kZSc7XG5cbmltcG9ydCB7YXNzZXJ0Tm90TnVsbH0gZnJvbSAnLi9hc3NlcnQnO1xuaW1wb3J0IHtUTm9kZSwgdW51c2VkVmFsdWVFeHBvcnRUb1BsYWNhdGVBamQgYXMgdW51c2VkMX0gZnJvbSAnLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtDc3NTZWxlY3RvciwgQ3NzU2VsZWN0b3JMaXN0LCBOR19QUk9KRUNUX0FTX0FUVFJfTkFNRSwgU2VsZWN0b3JGbGFncywgdW51c2VkVmFsdWVFeHBvcnRUb1BsYWNhdGVBamQgYXMgdW51c2VkMn0gZnJvbSAnLi9pbnRlcmZhY2VzL3Byb2plY3Rpb24nO1xuXG5jb25zdCB1bnVzZWRWYWx1ZVRvUGxhY2F0ZUFqZCA9IHVudXNlZDEgKyB1bnVzZWQyO1xuXG5mdW5jdGlvbiBpc0Nzc0NsYXNzTWF0Y2hpbmcobm9kZUNsYXNzQXR0clZhbDogc3RyaW5nLCBjc3NDbGFzc1RvTWF0Y2g6IHN0cmluZyk6IGJvb2xlYW4ge1xuICBjb25zdCBub2RlQ2xhc3Nlc0xlbiA9IG5vZGVDbGFzc0F0dHJWYWwubGVuZ3RoO1xuICBjb25zdCBtYXRjaEluZGV4ID0gbm9kZUNsYXNzQXR0clZhbCAhLmluZGV4T2YoY3NzQ2xhc3NUb01hdGNoKTtcbiAgY29uc3QgbWF0Y2hFbmRJZHggPSBtYXRjaEluZGV4ICsgY3NzQ2xhc3NUb01hdGNoLmxlbmd0aDtcbiAgaWYgKG1hdGNoSW5kZXggPT09IC0xICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBubyBtYXRjaFxuICAgICAgfHwgKG1hdGNoSW5kZXggPiAwICYmIG5vZGVDbGFzc0F0dHJWYWwgIVttYXRjaEluZGV4IC0gMV0gIT09ICcgJykgIC8vIG5vIHNwYWNlIGJlZm9yZVxuICAgICAgfHxcbiAgICAgIChtYXRjaEVuZElkeCA8IG5vZGVDbGFzc2VzTGVuICYmIG5vZGVDbGFzc0F0dHJWYWwgIVttYXRjaEVuZElkeF0gIT09ICcgJykpICAvLyBubyBzcGFjZSBhZnRlclxuICB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIHJldHVybiB0cnVlO1xufVxuXG4vKipcbiAqIEEgdXRpbGl0eSBmdW5jdGlvbiB0byBtYXRjaCBhbiBJdnkgbm9kZSBzdGF0aWMgZGF0YSBhZ2FpbnN0IGEgc2ltcGxlIENTUyBzZWxlY3RvclxuICpcbiAqIEBwYXJhbSBub2RlIHN0YXRpYyBkYXRhIHRvIG1hdGNoXG4gKiBAcGFyYW0gc2VsZWN0b3JcbiAqIEByZXR1cm5zIHRydWUgaWYgbm9kZSBtYXRjaGVzIHRoZSBzZWxlY3Rvci5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzTm9kZU1hdGNoaW5nU2VsZWN0b3IodE5vZGU6IFROb2RlLCBzZWxlY3RvcjogQ3NzU2VsZWN0b3IpOiBib29sZWFuIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vdE51bGwoc2VsZWN0b3JbMF0sICdTZWxlY3RvciBzaG91bGQgaGF2ZSBhIHRhZyBuYW1lJyk7XG5cbiAgbGV0IG1vZGU6IFNlbGVjdG9yRmxhZ3MgPSBTZWxlY3RvckZsYWdzLkVMRU1FTlQ7XG4gIGNvbnN0IG5vZGVBdHRycyA9IHROb2RlLmF0dHJzICE7XG5cbiAgLy8gV2hlbiBwcm9jZXNzaW5nIFwiOm5vdFwiIHNlbGVjdG9ycywgd2Ugc2tpcCB0byB0aGUgbmV4dCBcIjpub3RcIiBpZiB0aGVcbiAgLy8gY3VycmVudCBvbmUgZG9lc24ndCBtYXRjaFxuICBsZXQgc2tpcFRvTmV4dFNlbGVjdG9yID0gZmFsc2U7XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBzZWxlY3Rvci5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IGN1cnJlbnQgPSBzZWxlY3RvcltpXTtcbiAgICBpZiAodHlwZW9mIGN1cnJlbnQgPT09ICdudW1iZXInKSB7XG4gICAgICAvLyBJZiB3ZSBmaW5pc2ggcHJvY2Vzc2luZyBhIDpub3Qgc2VsZWN0b3IgYW5kIGl0IGhhc24ndCBmYWlsZWQsIHJldHVybiBmYWxzZVxuICAgICAgaWYgKCFza2lwVG9OZXh0U2VsZWN0b3IgJiYgIWlzUG9zaXRpdmUobW9kZSkgJiYgIWlzUG9zaXRpdmUoY3VycmVudCBhcyBudW1iZXIpKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIC8vIElmIHdlIGFyZSBza2lwcGluZyB0byB0aGUgbmV4dCA6bm90KCkgYW5kIHRoaXMgbW9kZSBmbGFnIGlzIHBvc2l0aXZlLFxuICAgICAgLy8gaXQncyBhIHBhcnQgb2YgdGhlIGN1cnJlbnQgOm5vdCgpIHNlbGVjdG9yLCBhbmQgd2Ugc2hvdWxkIGtlZXAgc2tpcHBpbmdcbiAgICAgIGlmIChza2lwVG9OZXh0U2VsZWN0b3IgJiYgaXNQb3NpdGl2ZShjdXJyZW50KSkgY29udGludWU7XG4gICAgICBza2lwVG9OZXh0U2VsZWN0b3IgPSBmYWxzZTtcbiAgICAgIG1vZGUgPSAoY3VycmVudCBhcyBudW1iZXIpIHwgKG1vZGUgJiBTZWxlY3RvckZsYWdzLk5PVCk7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAoc2tpcFRvTmV4dFNlbGVjdG9yKSBjb250aW51ZTtcblxuICAgIGlmIChtb2RlICYgU2VsZWN0b3JGbGFncy5FTEVNRU5UKSB7XG4gICAgICBtb2RlID0gU2VsZWN0b3JGbGFncy5BVFRSSUJVVEUgfCBtb2RlICYgU2VsZWN0b3JGbGFncy5OT1Q7XG4gICAgICBpZiAoY3VycmVudCAhPT0gJycgJiYgY3VycmVudCAhPT0gdE5vZGUudGFnTmFtZSkge1xuICAgICAgICBpZiAoaXNQb3NpdGl2ZShtb2RlKSkgcmV0dXJuIGZhbHNlO1xuICAgICAgICBza2lwVG9OZXh0U2VsZWN0b3IgPSB0cnVlO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBhdHRyTmFtZSA9IG1vZGUgJiBTZWxlY3RvckZsYWdzLkNMQVNTID8gJ2NsYXNzJyA6IGN1cnJlbnQ7XG4gICAgICBjb25zdCBhdHRySW5kZXhJbk5vZGUgPSBmaW5kQXR0ckluZGV4SW5Ob2RlKGF0dHJOYW1lLCBub2RlQXR0cnMpO1xuXG4gICAgICBpZiAoYXR0ckluZGV4SW5Ob2RlID09PSAtMSkge1xuICAgICAgICBpZiAoaXNQb3NpdGl2ZShtb2RlKSkgcmV0dXJuIGZhbHNlO1xuICAgICAgICBza2lwVG9OZXh0U2VsZWN0b3IgPSB0cnVlO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgY29uc3Qgc2VsZWN0b3JBdHRyVmFsdWUgPSBtb2RlICYgU2VsZWN0b3JGbGFncy5DTEFTUyA/IGN1cnJlbnQgOiBzZWxlY3RvclsrK2ldO1xuICAgICAgaWYgKHNlbGVjdG9yQXR0clZhbHVlICE9PSAnJykge1xuICAgICAgICBjb25zdCBub2RlQXR0clZhbHVlID0gbm9kZUF0dHJzW2F0dHJJbmRleEluTm9kZSArIDFdO1xuICAgICAgICBpZiAobW9kZSAmIFNlbGVjdG9yRmxhZ3MuQ0xBU1MgJiZcbiAgICAgICAgICAgICAgICAhaXNDc3NDbGFzc01hdGNoaW5nKG5vZGVBdHRyVmFsdWUsIHNlbGVjdG9yQXR0clZhbHVlIGFzIHN0cmluZykgfHxcbiAgICAgICAgICAgIG1vZGUgJiBTZWxlY3RvckZsYWdzLkFUVFJJQlVURSAmJiBzZWxlY3RvckF0dHJWYWx1ZSAhPT0gbm9kZUF0dHJWYWx1ZSkge1xuICAgICAgICAgIGlmIChpc1Bvc2l0aXZlKG1vZGUpKSByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgc2tpcFRvTmV4dFNlbGVjdG9yID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBpc1Bvc2l0aXZlKG1vZGUpIHx8IHNraXBUb05leHRTZWxlY3Rvcjtcbn1cblxuZnVuY3Rpb24gaXNQb3NpdGl2ZShtb2RlOiBTZWxlY3RvckZsYWdzKTogYm9vbGVhbiB7XG4gIHJldHVybiAobW9kZSAmIFNlbGVjdG9yRmxhZ3MuTk9UKSA9PT0gMDtcbn1cblxuZnVuY3Rpb24gZmluZEF0dHJJbmRleEluTm9kZShuYW1lOiBzdHJpbmcsIGF0dHJzOiBzdHJpbmdbXSB8IG51bGwpOiBudW1iZXIge1xuICBpZiAoYXR0cnMgPT09IG51bGwpIHJldHVybiAtMTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBhdHRycy5sZW5ndGg7IGkgKz0gMikge1xuICAgIGlmIChhdHRyc1tpXSA9PT0gbmFtZSkgcmV0dXJuIGk7XG4gIH1cbiAgcmV0dXJuIC0xO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNOb2RlTWF0Y2hpbmdTZWxlY3Rvckxpc3QodE5vZGU6IFROb2RlLCBzZWxlY3RvcjogQ3NzU2VsZWN0b3JMaXN0KTogYm9vbGVhbiB7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgc2VsZWN0b3IubGVuZ3RoOyBpKyspIHtcbiAgICBpZiAoaXNOb2RlTWF0Y2hpbmdTZWxlY3Rvcih0Tm9kZSwgc2VsZWN0b3JbaV0pKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gZmFsc2U7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRQcm9qZWN0QXNBdHRyVmFsdWUodE5vZGU6IFROb2RlKTogc3RyaW5nfG51bGwge1xuICBjb25zdCBub2RlQXR0cnMgPSB0Tm9kZS5hdHRycztcbiAgaWYgKG5vZGVBdHRycyAhPSBudWxsKSB7XG4gICAgY29uc3QgbmdQcm9qZWN0QXNBdHRySWR4ID0gbm9kZUF0dHJzLmluZGV4T2YoTkdfUFJPSkVDVF9BU19BVFRSX05BTUUpO1xuICAgIC8vIG9ubHkgY2hlY2sgZm9yIG5nUHJvamVjdEFzIGluIGF0dHJpYnV0ZSBuYW1lcywgZG9uJ3QgYWNjaWRlbnRhbGx5IG1hdGNoIGF0dHJpYnV0ZSdzIHZhbHVlXG4gICAgLy8gKGF0dHJpYnV0ZSBuYW1lcyBhcmUgc3RvcmVkIGF0IGV2ZW4gaW5kZXhlcylcbiAgICBpZiAoKG5nUHJvamVjdEFzQXR0cklkeCAmIDEpID09PSAwKSB7XG4gICAgICByZXR1cm4gbm9kZUF0dHJzW25nUHJvamVjdEFzQXR0cklkeCArIDFdO1xuICAgIH1cbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuLyoqXG4gKiBDaGVja3MgYSBnaXZlbiBub2RlIGFnYWluc3QgbWF0Y2hpbmcgc2VsZWN0b3JzIGFuZCByZXR1cm5zXG4gKiBzZWxlY3RvciBpbmRleCAob3IgMCBpZiBub25lIG1hdGNoZWQpLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gdGFrZXMgaW50byBhY2NvdW50IHRoZSBuZ1Byb2plY3RBcyBhdHRyaWJ1dGU6IGlmIHByZXNlbnQgaXRzIHZhbHVlIHdpbGwgYmUgY29tcGFyZWRcbiAqIHRvIHRoZSByYXcgKHVuLXBhcnNlZCkgQ1NTIHNlbGVjdG9yIGluc3RlYWQgb2YgdXNpbmcgc3RhbmRhcmQgc2VsZWN0b3IgbWF0Y2hpbmcgbG9naWMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBtYXRjaGluZ1NlbGVjdG9ySW5kZXgoXG4gICAgdE5vZGU6IFROb2RlLCBzZWxlY3RvcnM6IENzc1NlbGVjdG9yTGlzdFtdLCB0ZXh0U2VsZWN0b3JzOiBzdHJpbmdbXSk6IG51bWJlciB7XG4gIGNvbnN0IG5nUHJvamVjdEFzQXR0clZhbCA9IGdldFByb2plY3RBc0F0dHJWYWx1ZSh0Tm9kZSk7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgc2VsZWN0b3JzLmxlbmd0aDsgaSsrKSB7XG4gICAgLy8gaWYgYSBub2RlIGhhcyB0aGUgbmdQcm9qZWN0QXMgYXR0cmlidXRlIG1hdGNoIGl0IGFnYWluc3QgdW5wYXJzZWQgc2VsZWN0b3JcbiAgICAvLyBtYXRjaCBhIG5vZGUgYWdhaW5zdCBhIHBhcnNlZCBzZWxlY3RvciBvbmx5IGlmIG5nUHJvamVjdEFzIGF0dHJpYnV0ZSBpcyBub3QgcHJlc2VudFxuICAgIGlmIChuZ1Byb2plY3RBc0F0dHJWYWwgPT09IHRleHRTZWxlY3RvcnNbaV0gfHxcbiAgICAgICAgbmdQcm9qZWN0QXNBdHRyVmFsID09PSBudWxsICYmIGlzTm9kZU1hdGNoaW5nU2VsZWN0b3JMaXN0KHROb2RlLCBzZWxlY3RvcnNbaV0pKSB7XG4gICAgICByZXR1cm4gaSArIDE7ICAvLyBmaXJzdCBtYXRjaGluZyBzZWxlY3RvciBcImNhcHR1cmVzXCIgYSBnaXZlbiBub2RlXG4gICAgfVxuICB9XG4gIHJldHVybiAwO1xufVxuIl19