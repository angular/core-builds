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
    var selectOnlyMarkerIdx = nodeAttrs ? nodeAttrs.indexOf(1 /* SelectOnly */) : -1;
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
        if (attrName === 0 /* NamespaceUri */) {
            step = 2;
        }
        else if (attrName === name) {
            return i;
        }
        else if (attrName === 1 /* SelectOnly */) {
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9kZV9zZWxlY3Rvcl9tYXRjaGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9ub2RlX3NlbGVjdG9yX21hdGNoZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxlQUFlLENBQUM7QUFFdkIsT0FBTyxFQUFDLGFBQWEsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUN2QyxPQUFPLEVBQXNDLDZCQUE2QixJQUFJLE9BQU8sRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQ2hILE9BQU8sRUFBK0IsdUJBQXVCLEVBQWlCLDZCQUE2QixJQUFJLE9BQU8sRUFBQyxNQUFNLHlCQUF5QixDQUFDO0FBR3ZKLElBQU0sdUJBQXVCLEdBQUcsT0FBTyxHQUFHLE9BQU8sQ0FBQztBQUVsRCw0QkFBNEIsZ0JBQXdCLEVBQUUsZUFBdUI7SUFDM0UsSUFBTSxjQUFjLEdBQUcsZ0JBQWdCLENBQUMsTUFBTSxDQUFDO0lBQy9DLElBQU0sVUFBVSxHQUFHLGdCQUFrQixDQUFDLE9BQU8sQ0FBQyxlQUFlLENBQUMsQ0FBQztJQUMvRCxJQUFNLFdBQVcsR0FBRyxVQUFVLEdBQUcsZUFBZSxDQUFDLE1BQU0sQ0FBQztJQUN4RCxJQUFJLFVBQVUsS0FBSyxDQUFDLENBQUMsQ0FBa0QsV0FBVztXQUMzRSxDQUFDLFVBQVUsR0FBRyxDQUFDLElBQUksZ0JBQWtCLENBQUMsVUFBVSxHQUFHLENBQUMsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFFLGtCQUFrQjs7WUFFckYsQ0FBQyxXQUFXLEdBQUcsY0FBYyxJQUFJLGdCQUFrQixDQUFDLFdBQVcsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxFQUFHLGlCQUFpQjtLQUNqRztRQUNFLE9BQU8sS0FBSyxDQUFDO0tBQ2Q7SUFDRCxPQUFPLElBQUksQ0FBQztBQUNkLENBQUM7QUFFRDs7Ozs7O0dBTUc7QUFD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QUFJLFNBQVMsSUFBSSxJQUFJLEVBQUU7UUFDckIsSUFBTSxrQkFBa0IsR0FBRyxTQUFTLENBQUMsT0FBTyxDQUFDLHVCQUF1QixDQUFDLENBQUM7UUFDdEUsNEZBQTRGO1FBQzVGLCtDQUErQztRQUMvQyxJQUFJLENBQUMsa0JBQWtCLEdBQUcsQ0FBQyxDQUFDLEtBQUssQ0FBQyxFQUFFO1lBQ2xDLE9BQU8sU0FBUyxDQUFDLGtCQUFrQixHQUFHLENBQUMsQ0FBVyxDQUFDO1NBQ3BEO0tBQ0Y7SUFDRCxPQUFPLElBQUksQ0FBQztBQUNkLENBQUM7QUFFRDs7Ozs7O0dBTUc7QUFDSCxNQUFNLGdDQUNGLEtBQVksRUFBRSxTQUE0QixFQUFFLGFBQXVCO0lBQ3JFLElBQU0sa0JBQWtCLEdBQUcscUJBQXFCLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDeEQsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFNBQVMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7UUFDekMsNkVBQTZFO1FBQzdFLHNGQUFzRjtRQUN0RixJQUFJLGtCQUFrQixLQUFLLGFBQWEsQ0FBQyxDQUFDLENBQUM7WUFDdkMsa0JBQWtCLEtBQUssSUFBSSxJQUFJLDBCQUEwQixDQUFDLEtBQUssRUFBRSxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRTtZQUNsRixPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBRSxrREFBa0Q7U0FDbEU7S0FDRjtJQUNELE9BQU8sQ0FBQyxDQUFDO0FBQ1gsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0ICcuL25nX2Rldl9tb2RlJztcblxuaW1wb3J0IHthc3NlcnROb3ROdWxsfSBmcm9tICcuL2Fzc2VydCc7XG5pbXBvcnQge0F0dHJpYnV0ZU1hcmtlciwgVEF0dHJpYnV0ZXMsIFROb2RlLCB1bnVzZWRWYWx1ZUV4cG9ydFRvUGxhY2F0ZUFqZCBhcyB1bnVzZWQxfSBmcm9tICcuL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge0Nzc1NlbGVjdG9yLCBDc3NTZWxlY3Rvckxpc3QsIE5HX1BST0pFQ1RfQVNfQVRUUl9OQU1FLCBTZWxlY3RvckZsYWdzLCB1bnVzZWRWYWx1ZUV4cG9ydFRvUGxhY2F0ZUFqZCBhcyB1bnVzZWQyfSBmcm9tICcuL2ludGVyZmFjZXMvcHJvamVjdGlvbic7XG5cblxuY29uc3QgdW51c2VkVmFsdWVUb1BsYWNhdGVBamQgPSB1bnVzZWQxICsgdW51c2VkMjtcblxuZnVuY3Rpb24gaXNDc3NDbGFzc01hdGNoaW5nKG5vZGVDbGFzc0F0dHJWYWw6IHN0cmluZywgY3NzQ2xhc3NUb01hdGNoOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgY29uc3Qgbm9kZUNsYXNzZXNMZW4gPSBub2RlQ2xhc3NBdHRyVmFsLmxlbmd0aDtcbiAgY29uc3QgbWF0Y2hJbmRleCA9IG5vZGVDbGFzc0F0dHJWYWwgIS5pbmRleE9mKGNzc0NsYXNzVG9NYXRjaCk7XG4gIGNvbnN0IG1hdGNoRW5kSWR4ID0gbWF0Y2hJbmRleCArIGNzc0NsYXNzVG9NYXRjaC5sZW5ndGg7XG4gIGlmIChtYXRjaEluZGV4ID09PSAtMSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gbm8gbWF0Y2hcbiAgICAgIHx8IChtYXRjaEluZGV4ID4gMCAmJiBub2RlQ2xhc3NBdHRyVmFsICFbbWF0Y2hJbmRleCAtIDFdICE9PSAnICcpICAvLyBubyBzcGFjZSBiZWZvcmVcbiAgICAgIHx8XG4gICAgICAobWF0Y2hFbmRJZHggPCBub2RlQ2xhc3Nlc0xlbiAmJiBub2RlQ2xhc3NBdHRyVmFsICFbbWF0Y2hFbmRJZHhdICE9PSAnICcpKSAgLy8gbm8gc3BhY2UgYWZ0ZXJcbiAge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICByZXR1cm4gdHJ1ZTtcbn1cblxuLyoqXG4gKiBBIHV0aWxpdHkgZnVuY3Rpb24gdG8gbWF0Y2ggYW4gSXZ5IG5vZGUgc3RhdGljIGRhdGEgYWdhaW5zdCBhIHNpbXBsZSBDU1Mgc2VsZWN0b3JcbiAqXG4gKiBAcGFyYW0gbm9kZSBzdGF0aWMgZGF0YSB0byBtYXRjaFxuICogQHBhcmFtIHNlbGVjdG9yXG4gKiBAcmV0dXJucyB0cnVlIGlmIG5vZGUgbWF0Y2hlcyB0aGUgc2VsZWN0b3IuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc05vZGVNYXRjaGluZ1NlbGVjdG9yKHROb2RlOiBUTm9kZSwgc2VsZWN0b3I6IENzc1NlbGVjdG9yKTogYm9vbGVhbiB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb3ROdWxsKHNlbGVjdG9yWzBdLCAnU2VsZWN0b3Igc2hvdWxkIGhhdmUgYSB0YWcgbmFtZScpO1xuXG4gIGxldCBtb2RlOiBTZWxlY3RvckZsYWdzID0gU2VsZWN0b3JGbGFncy5FTEVNRU5UO1xuICBjb25zdCBub2RlQXR0cnMgPSB0Tm9kZS5hdHRycyAhO1xuICBjb25zdCBzZWxlY3RPbmx5TWFya2VySWR4ID0gbm9kZUF0dHJzID8gbm9kZUF0dHJzLmluZGV4T2YoQXR0cmlidXRlTWFya2VyLlNlbGVjdE9ubHkpIDogLTE7XG5cbiAgLy8gV2hlbiBwcm9jZXNzaW5nIFwiOm5vdFwiIHNlbGVjdG9ycywgd2Ugc2tpcCB0byB0aGUgbmV4dCBcIjpub3RcIiBpZiB0aGVcbiAgLy8gY3VycmVudCBvbmUgZG9lc24ndCBtYXRjaFxuICBsZXQgc2tpcFRvTmV4dFNlbGVjdG9yID0gZmFsc2U7XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBzZWxlY3Rvci5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IGN1cnJlbnQgPSBzZWxlY3RvcltpXTtcbiAgICBpZiAodHlwZW9mIGN1cnJlbnQgPT09ICdudW1iZXInKSB7XG4gICAgICAvLyBJZiB3ZSBmaW5pc2ggcHJvY2Vzc2luZyBhIDpub3Qgc2VsZWN0b3IgYW5kIGl0IGhhc24ndCBmYWlsZWQsIHJldHVybiBmYWxzZVxuICAgICAgaWYgKCFza2lwVG9OZXh0U2VsZWN0b3IgJiYgIWlzUG9zaXRpdmUobW9kZSkgJiYgIWlzUG9zaXRpdmUoY3VycmVudCBhcyBudW1iZXIpKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIC8vIElmIHdlIGFyZSBza2lwcGluZyB0byB0aGUgbmV4dCA6bm90KCkgYW5kIHRoaXMgbW9kZSBmbGFnIGlzIHBvc2l0aXZlLFxuICAgICAgLy8gaXQncyBhIHBhcnQgb2YgdGhlIGN1cnJlbnQgOm5vdCgpIHNlbGVjdG9yLCBhbmQgd2Ugc2hvdWxkIGtlZXAgc2tpcHBpbmdcbiAgICAgIGlmIChza2lwVG9OZXh0U2VsZWN0b3IgJiYgaXNQb3NpdGl2ZShjdXJyZW50KSkgY29udGludWU7XG4gICAgICBza2lwVG9OZXh0U2VsZWN0b3IgPSBmYWxzZTtcbiAgICAgIG1vZGUgPSAoY3VycmVudCBhcyBudW1iZXIpIHwgKG1vZGUgJiBTZWxlY3RvckZsYWdzLk5PVCk7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAoc2tpcFRvTmV4dFNlbGVjdG9yKSBjb250aW51ZTtcblxuICAgIGlmIChtb2RlICYgU2VsZWN0b3JGbGFncy5FTEVNRU5UKSB7XG4gICAgICBtb2RlID0gU2VsZWN0b3JGbGFncy5BVFRSSUJVVEUgfCBtb2RlICYgU2VsZWN0b3JGbGFncy5OT1Q7XG4gICAgICBpZiAoY3VycmVudCAhPT0gJycgJiYgY3VycmVudCAhPT0gdE5vZGUudGFnTmFtZSkge1xuICAgICAgICBpZiAoaXNQb3NpdGl2ZShtb2RlKSkgcmV0dXJuIGZhbHNlO1xuICAgICAgICBza2lwVG9OZXh0U2VsZWN0b3IgPSB0cnVlO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBhdHRyTmFtZSA9IG1vZGUgJiBTZWxlY3RvckZsYWdzLkNMQVNTID8gJ2NsYXNzJyA6IGN1cnJlbnQ7XG4gICAgICBjb25zdCBhdHRySW5kZXhJbk5vZGUgPSBmaW5kQXR0ckluZGV4SW5Ob2RlKGF0dHJOYW1lLCBub2RlQXR0cnMpO1xuXG4gICAgICBpZiAoYXR0ckluZGV4SW5Ob2RlID09PSAtMSkge1xuICAgICAgICBpZiAoaXNQb3NpdGl2ZShtb2RlKSkgcmV0dXJuIGZhbHNlO1xuICAgICAgICBza2lwVG9OZXh0U2VsZWN0b3IgPSB0cnVlO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgY29uc3Qgc2VsZWN0b3JBdHRyVmFsdWUgPSBtb2RlICYgU2VsZWN0b3JGbGFncy5DTEFTUyA/IGN1cnJlbnQgOiBzZWxlY3RvclsrK2ldO1xuICAgICAgaWYgKHNlbGVjdG9yQXR0clZhbHVlICE9PSAnJykge1xuICAgICAgICBjb25zdCBub2RlQXR0clZhbHVlID0gc2VsZWN0T25seU1hcmtlcklkeCA+IC0xICYmIGF0dHJJbmRleEluTm9kZSA+IHNlbGVjdE9ubHlNYXJrZXJJZHggP1xuICAgICAgICAgICAgJycgOlxuICAgICAgICAgICAgbm9kZUF0dHJzW2F0dHJJbmRleEluTm9kZSArIDFdO1xuICAgICAgICBpZiAobW9kZSAmIFNlbGVjdG9yRmxhZ3MuQ0xBU1MgJiZcbiAgICAgICAgICAgICAgICAhaXNDc3NDbGFzc01hdGNoaW5nKG5vZGVBdHRyVmFsdWUgYXMgc3RyaW5nLCBzZWxlY3RvckF0dHJWYWx1ZSBhcyBzdHJpbmcpIHx8XG4gICAgICAgICAgICBtb2RlICYgU2VsZWN0b3JGbGFncy5BVFRSSUJVVEUgJiYgc2VsZWN0b3JBdHRyVmFsdWUgIT09IG5vZGVBdHRyVmFsdWUpIHtcbiAgICAgICAgICBpZiAoaXNQb3NpdGl2ZShtb2RlKSkgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgIHNraXBUb05leHRTZWxlY3RvciA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gaXNQb3NpdGl2ZShtb2RlKSB8fCBza2lwVG9OZXh0U2VsZWN0b3I7XG59XG5cbmZ1bmN0aW9uIGlzUG9zaXRpdmUobW9kZTogU2VsZWN0b3JGbGFncyk6IGJvb2xlYW4ge1xuICByZXR1cm4gKG1vZGUgJiBTZWxlY3RvckZsYWdzLk5PVCkgPT09IDA7XG59XG5cbmZ1bmN0aW9uIGZpbmRBdHRySW5kZXhJbk5vZGUobmFtZTogc3RyaW5nLCBhdHRyczogVEF0dHJpYnV0ZXMgfCBudWxsKTogbnVtYmVyIHtcbiAgbGV0IHN0ZXAgPSAyO1xuICBpZiAoYXR0cnMgPT09IG51bGwpIHJldHVybiAtMTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBhdHRycy5sZW5ndGg7IGkgKz0gc3RlcCkge1xuICAgIGNvbnN0IGF0dHJOYW1lID0gYXR0cnNbaV07XG4gICAgaWYgKGF0dHJOYW1lID09PSBBdHRyaWJ1dGVNYXJrZXIuTmFtZXNwYWNlVXJpKSB7XG4gICAgICBzdGVwID0gMjtcbiAgICB9IGVsc2UgaWYgKGF0dHJOYW1lID09PSBuYW1lKSB7XG4gICAgICByZXR1cm4gaTtcbiAgICB9IGVsc2UgaWYgKGF0dHJOYW1lID09PSBBdHRyaWJ1dGVNYXJrZXIuU2VsZWN0T25seSkge1xuICAgICAgc3RlcCA9IDE7XG4gICAgfVxuICB9XG4gIHJldHVybiAtMTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzTm9kZU1hdGNoaW5nU2VsZWN0b3JMaXN0KHROb2RlOiBUTm9kZSwgc2VsZWN0b3I6IENzc1NlbGVjdG9yTGlzdCk6IGJvb2xlYW4ge1xuICBmb3IgKGxldCBpID0gMDsgaSA8IHNlbGVjdG9yLmxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKGlzTm9kZU1hdGNoaW5nU2VsZWN0b3IodE5vZGUsIHNlbGVjdG9yW2ldKSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0UHJvamVjdEFzQXR0clZhbHVlKHROb2RlOiBUTm9kZSk6IHN0cmluZ3xudWxsIHtcbiAgY29uc3Qgbm9kZUF0dHJzID0gdE5vZGUuYXR0cnM7XG4gIGlmIChub2RlQXR0cnMgIT0gbnVsbCkge1xuICAgIGNvbnN0IG5nUHJvamVjdEFzQXR0cklkeCA9IG5vZGVBdHRycy5pbmRleE9mKE5HX1BST0pFQ1RfQVNfQVRUUl9OQU1FKTtcbiAgICAvLyBvbmx5IGNoZWNrIGZvciBuZ1Byb2plY3RBcyBpbiBhdHRyaWJ1dGUgbmFtZXMsIGRvbid0IGFjY2lkZW50YWxseSBtYXRjaCBhdHRyaWJ1dGUncyB2YWx1ZVxuICAgIC8vIChhdHRyaWJ1dGUgbmFtZXMgYXJlIHN0b3JlZCBhdCBldmVuIGluZGV4ZXMpXG4gICAgaWYgKChuZ1Byb2plY3RBc0F0dHJJZHggJiAxKSA9PT0gMCkge1xuICAgICAgcmV0dXJuIG5vZGVBdHRyc1tuZ1Byb2plY3RBc0F0dHJJZHggKyAxXSBhcyBzdHJpbmc7XG4gICAgfVxuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG4vKipcbiAqIENoZWNrcyBhIGdpdmVuIG5vZGUgYWdhaW5zdCBtYXRjaGluZyBzZWxlY3RvcnMgYW5kIHJldHVybnNcbiAqIHNlbGVjdG9yIGluZGV4IChvciAwIGlmIG5vbmUgbWF0Y2hlZCkuXG4gKlxuICogVGhpcyBmdW5jdGlvbiB0YWtlcyBpbnRvIGFjY291bnQgdGhlIG5nUHJvamVjdEFzIGF0dHJpYnV0ZTogaWYgcHJlc2VudCBpdHMgdmFsdWUgd2lsbCBiZSBjb21wYXJlZFxuICogdG8gdGhlIHJhdyAodW4tcGFyc2VkKSBDU1Mgc2VsZWN0b3IgaW5zdGVhZCBvZiB1c2luZyBzdGFuZGFyZCBzZWxlY3RvciBtYXRjaGluZyBsb2dpYy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG1hdGNoaW5nU2VsZWN0b3JJbmRleChcbiAgICB0Tm9kZTogVE5vZGUsIHNlbGVjdG9yczogQ3NzU2VsZWN0b3JMaXN0W10sIHRleHRTZWxlY3RvcnM6IHN0cmluZ1tdKTogbnVtYmVyIHtcbiAgY29uc3QgbmdQcm9qZWN0QXNBdHRyVmFsID0gZ2V0UHJvamVjdEFzQXR0clZhbHVlKHROb2RlKTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBzZWxlY3RvcnMubGVuZ3RoOyBpKyspIHtcbiAgICAvLyBpZiBhIG5vZGUgaGFzIHRoZSBuZ1Byb2plY3RBcyBhdHRyaWJ1dGUgbWF0Y2ggaXQgYWdhaW5zdCB1bnBhcnNlZCBzZWxlY3RvclxuICAgIC8vIG1hdGNoIGEgbm9kZSBhZ2FpbnN0IGEgcGFyc2VkIHNlbGVjdG9yIG9ubHkgaWYgbmdQcm9qZWN0QXMgYXR0cmlidXRlIGlzIG5vdCBwcmVzZW50XG4gICAgaWYgKG5nUHJvamVjdEFzQXR0clZhbCA9PT0gdGV4dFNlbGVjdG9yc1tpXSB8fFxuICAgICAgICBuZ1Byb2plY3RBc0F0dHJWYWwgPT09IG51bGwgJiYgaXNOb2RlTWF0Y2hpbmdTZWxlY3Rvckxpc3QodE5vZGUsIHNlbGVjdG9yc1tpXSkpIHtcbiAgICAgIHJldHVybiBpICsgMTsgIC8vIGZpcnN0IG1hdGNoaW5nIHNlbGVjdG9yIFwiY2FwdHVyZXNcIiBhIGdpdmVuIG5vZGVcbiAgICB9XG4gIH1cbiAgcmV0dXJuIDA7XG59XG4iXX0=