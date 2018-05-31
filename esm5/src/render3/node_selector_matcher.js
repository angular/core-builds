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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9kZV9zZWxlY3Rvcl9tYXRjaGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9ub2RlX3NlbGVjdG9yX21hdGNoZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQVFBLE9BQU8sZUFBZSxDQUFDO0FBRXZCLE9BQU8sRUFBQyxhQUFhLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDdkMsT0FBTyxFQUFzQyw2QkFBNkIsSUFBSSxPQUFPLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUNoSCxPQUFPLEVBQStCLHVCQUF1QixFQUFpQiw2QkFBNkIsSUFBSSxPQUFPLEVBQUMsTUFBTSx5QkFBeUIsQ0FBQztBQUV2SixJQUFNLHVCQUF1QixHQUFHLE9BQU8sR0FBRyxPQUFPLENBQUM7QUFFbEQsNEJBQTRCLGdCQUF3QixFQUFFLGVBQXVCO0lBQzNFLElBQU0sY0FBYyxHQUFHLGdCQUFnQixDQUFDLE1BQU0sQ0FBQztJQUMvQyxJQUFNLFVBQVUsR0FBRyxnQkFBa0IsQ0FBQyxPQUFPLENBQUMsZUFBZSxDQUFDLENBQUM7SUFDL0QsSUFBTSxXQUFXLEdBQUcsVUFBVSxHQUFHLGVBQWUsQ0FBQyxNQUFNLENBQUM7SUFDeEQsSUFBSSxVQUFVLEtBQUssQ0FBQyxDQUFDO1dBQ2QsQ0FBQyxVQUFVLEdBQUcsQ0FBQyxJQUFJLGdCQUFrQixDQUFDLFVBQVUsR0FBRyxDQUFDLENBQUMsS0FBSyxHQUFHLENBQUM7O1lBRWpFLENBQUMsV0FBVyxHQUFHLGNBQWMsSUFBSSxnQkFBa0IsQ0FBQyxXQUFXLENBQUMsS0FBSyxHQUFHLENBQUMsRUFBRyxpQkFBaUI7S0FDakc7UUFDRSxPQUFPLEtBQUssQ0FBQztLQUNkO0lBQ0QsT0FBTyxJQUFJLENBQUM7Q0FDYjs7Ozs7Ozs7QUFTRCxNQUFNLGlDQUFpQyxLQUFZLEVBQUUsUUFBcUI7SUFDeEUsU0FBUyxJQUFJ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QUFDO1NBQ3BEO0tBQ0Y7SUFDRCxPQUFPLElBQUksQ0FBQztDQUNiOzs7Ozs7OztBQVNELE1BQU0sZ0NBQ0YsS0FBWSxFQUFFLFNBQTRCLEVBQUUsYUFBdUI7SUFDckUsSUFBTSxrQkFBa0IsR0FBRyxxQkFBcUIsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUN4RCxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsU0FBUyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTs7O1FBR3pDLElBQUksa0JBQWtCLEtBQUssYUFBYSxDQUFDLENBQUMsQ0FBQztZQUN2QyxrQkFBa0IsS0FBSyxJQUFJLElBQUksMEJBQTBCLENBQUMsS0FBSyxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFO1lBQ2xGLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztTQUNkO0tBQ0Y7SUFDRCxPQUFPLENBQUMsQ0FBQztDQUNWIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgJy4vbmdfZGV2X21vZGUnO1xuXG5pbXBvcnQge2Fzc2VydE5vdE51bGx9IGZyb20gJy4vYXNzZXJ0JztcbmltcG9ydCB7QXR0cmlidXRlTWFya2VyLCBUQXR0cmlidXRlcywgVE5vZGUsIHVudXNlZFZhbHVlRXhwb3J0VG9QbGFjYXRlQWpkIGFzIHVudXNlZDF9IGZyb20gJy4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7Q3NzU2VsZWN0b3IsIENzc1NlbGVjdG9yTGlzdCwgTkdfUFJPSkVDVF9BU19BVFRSX05BTUUsIFNlbGVjdG9yRmxhZ3MsIHVudXNlZFZhbHVlRXhwb3J0VG9QbGFjYXRlQWpkIGFzIHVudXNlZDJ9IGZyb20gJy4vaW50ZXJmYWNlcy9wcm9qZWN0aW9uJztcblxuY29uc3QgdW51c2VkVmFsdWVUb1BsYWNhdGVBamQgPSB1bnVzZWQxICsgdW51c2VkMjtcblxuZnVuY3Rpb24gaXNDc3NDbGFzc01hdGNoaW5nKG5vZGVDbGFzc0F0dHJWYWw6IHN0cmluZywgY3NzQ2xhc3NUb01hdGNoOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgY29uc3Qgbm9kZUNsYXNzZXNMZW4gPSBub2RlQ2xhc3NBdHRyVmFsLmxlbmd0aDtcbiAgY29uc3QgbWF0Y2hJbmRleCA9IG5vZGVDbGFzc0F0dHJWYWwgIS5pbmRleE9mKGNzc0NsYXNzVG9NYXRjaCk7XG4gIGNvbnN0IG1hdGNoRW5kSWR4ID0gbWF0Y2hJbmRleCArIGNzc0NsYXNzVG9NYXRjaC5sZW5ndGg7XG4gIGlmIChtYXRjaEluZGV4ID09PSAtMSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gbm8gbWF0Y2hcbiAgICAgIHx8IChtYXRjaEluZGV4ID4gMCAmJiBub2RlQ2xhc3NBdHRyVmFsICFbbWF0Y2hJbmRleCAtIDFdICE9PSAnICcpICAvLyBubyBzcGFjZSBiZWZvcmVcbiAgICAgIHx8XG4gICAgICAobWF0Y2hFbmRJZHggPCBub2RlQ2xhc3Nlc0xlbiAmJiBub2RlQ2xhc3NBdHRyVmFsICFbbWF0Y2hFbmRJZHhdICE9PSAnICcpKSAgLy8gbm8gc3BhY2UgYWZ0ZXJcbiAge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICByZXR1cm4gdHJ1ZTtcbn1cblxuLyoqXG4gKiBBIHV0aWxpdHkgZnVuY3Rpb24gdG8gbWF0Y2ggYW4gSXZ5IG5vZGUgc3RhdGljIGRhdGEgYWdhaW5zdCBhIHNpbXBsZSBDU1Mgc2VsZWN0b3JcbiAqXG4gKiBAcGFyYW0gbm9kZSBzdGF0aWMgZGF0YSB0byBtYXRjaFxuICogQHBhcmFtIHNlbGVjdG9yXG4gKiBAcmV0dXJucyB0cnVlIGlmIG5vZGUgbWF0Y2hlcyB0aGUgc2VsZWN0b3IuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc05vZGVNYXRjaGluZ1NlbGVjdG9yKHROb2RlOiBUTm9kZSwgc2VsZWN0b3I6IENzc1NlbGVjdG9yKTogYm9vbGVhbiB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb3ROdWxsKHNlbGVjdG9yWzBdLCAnU2VsZWN0b3Igc2hvdWxkIGhhdmUgYSB0YWcgbmFtZScpO1xuXG4gIGxldCBtb2RlOiBTZWxlY3RvckZsYWdzID0gU2VsZWN0b3JGbGFncy5FTEVNRU5UO1xuICBjb25zdCBub2RlQXR0cnMgPSB0Tm9kZS5hdHRycyAhO1xuICBjb25zdCBzZWxlY3RPbmx5TWFya2VySWR4ID0gbm9kZUF0dHJzID8gbm9kZUF0dHJzLmluZGV4T2YoQXR0cmlidXRlTWFya2VyLlNFTEVDVF9PTkxZKSA6IC0xO1xuXG4gIC8vIFdoZW4gcHJvY2Vzc2luZyBcIjpub3RcIiBzZWxlY3RvcnMsIHdlIHNraXAgdG8gdGhlIG5leHQgXCI6bm90XCIgaWYgdGhlXG4gIC8vIGN1cnJlbnQgb25lIGRvZXNuJ3QgbWF0Y2hcbiAgbGV0IHNraXBUb05leHRTZWxlY3RvciA9IGZhbHNlO1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgc2VsZWN0b3IubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBjdXJyZW50ID0gc2VsZWN0b3JbaV07XG4gICAgaWYgKHR5cGVvZiBjdXJyZW50ID09PSAnbnVtYmVyJykge1xuICAgICAgLy8gSWYgd2UgZmluaXNoIHByb2Nlc3NpbmcgYSA6bm90IHNlbGVjdG9yIGFuZCBpdCBoYXNuJ3QgZmFpbGVkLCByZXR1cm4gZmFsc2VcbiAgICAgIGlmICghc2tpcFRvTmV4dFNlbGVjdG9yICYmICFpc1Bvc2l0aXZlKG1vZGUpICYmICFpc1Bvc2l0aXZlKGN1cnJlbnQgYXMgbnVtYmVyKSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICAvLyBJZiB3ZSBhcmUgc2tpcHBpbmcgdG8gdGhlIG5leHQgOm5vdCgpIGFuZCB0aGlzIG1vZGUgZmxhZyBpcyBwb3NpdGl2ZSxcbiAgICAgIC8vIGl0J3MgYSBwYXJ0IG9mIHRoZSBjdXJyZW50IDpub3QoKSBzZWxlY3RvciwgYW5kIHdlIHNob3VsZCBrZWVwIHNraXBwaW5nXG4gICAgICBpZiAoc2tpcFRvTmV4dFNlbGVjdG9yICYmIGlzUG9zaXRpdmUoY3VycmVudCkpIGNvbnRpbnVlO1xuICAgICAgc2tpcFRvTmV4dFNlbGVjdG9yID0gZmFsc2U7XG4gICAgICBtb2RlID0gKGN1cnJlbnQgYXMgbnVtYmVyKSB8IChtb2RlICYgU2VsZWN0b3JGbGFncy5OT1QpO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKHNraXBUb05leHRTZWxlY3RvcikgY29udGludWU7XG5cbiAgICBpZiAobW9kZSAmIFNlbGVjdG9yRmxhZ3MuRUxFTUVOVCkge1xuICAgICAgbW9kZSA9IFNlbGVjdG9yRmxhZ3MuQVRUUklCVVRFIHwgbW9kZSAmIFNlbGVjdG9yRmxhZ3MuTk9UO1xuICAgICAgaWYgKGN1cnJlbnQgIT09ICcnICYmIGN1cnJlbnQgIT09IHROb2RlLnRhZ05hbWUpIHtcbiAgICAgICAgaWYgKGlzUG9zaXRpdmUobW9kZSkpIHJldHVybiBmYWxzZTtcbiAgICAgICAgc2tpcFRvTmV4dFNlbGVjdG9yID0gdHJ1ZTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgYXR0ck5hbWUgPSBtb2RlICYgU2VsZWN0b3JGbGFncy5DTEFTUyA/ICdjbGFzcycgOiBjdXJyZW50O1xuICAgICAgY29uc3QgYXR0ckluZGV4SW5Ob2RlID0gZmluZEF0dHJJbmRleEluTm9kZShhdHRyTmFtZSwgbm9kZUF0dHJzKTtcblxuICAgICAgaWYgKGF0dHJJbmRleEluTm9kZSA9PT0gLTEpIHtcbiAgICAgICAgaWYgKGlzUG9zaXRpdmUobW9kZSkpIHJldHVybiBmYWxzZTtcbiAgICAgICAgc2tpcFRvTmV4dFNlbGVjdG9yID0gdHJ1ZTtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHNlbGVjdG9yQXR0clZhbHVlID0gbW9kZSAmIFNlbGVjdG9yRmxhZ3MuQ0xBU1MgPyBjdXJyZW50IDogc2VsZWN0b3JbKytpXTtcbiAgICAgIGlmIChzZWxlY3RvckF0dHJWYWx1ZSAhPT0gJycpIHtcbiAgICAgICAgY29uc3Qgbm9kZUF0dHJWYWx1ZSA9IHNlbGVjdE9ubHlNYXJrZXJJZHggPiAtMSAmJiBhdHRySW5kZXhJbk5vZGUgPiBzZWxlY3RPbmx5TWFya2VySWR4ID9cbiAgICAgICAgICAgICcnIDpcbiAgICAgICAgICAgIG5vZGVBdHRyc1thdHRySW5kZXhJbk5vZGUgKyAxXTtcbiAgICAgICAgaWYgKG1vZGUgJiBTZWxlY3RvckZsYWdzLkNMQVNTICYmXG4gICAgICAgICAgICAgICAgIWlzQ3NzQ2xhc3NNYXRjaGluZyhub2RlQXR0clZhbHVlIGFzIHN0cmluZywgc2VsZWN0b3JBdHRyVmFsdWUgYXMgc3RyaW5nKSB8fFxuICAgICAgICAgICAgbW9kZSAmIFNlbGVjdG9yRmxhZ3MuQVRUUklCVVRFICYmIHNlbGVjdG9yQXR0clZhbHVlICE9PSBub2RlQXR0clZhbHVlKSB7XG4gICAgICAgICAgaWYgKGlzUG9zaXRpdmUobW9kZSkpIHJldHVybiBmYWxzZTtcbiAgICAgICAgICBza2lwVG9OZXh0U2VsZWN0b3IgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGlzUG9zaXRpdmUobW9kZSkgfHwgc2tpcFRvTmV4dFNlbGVjdG9yO1xufVxuXG5mdW5jdGlvbiBpc1Bvc2l0aXZlKG1vZGU6IFNlbGVjdG9yRmxhZ3MpOiBib29sZWFuIHtcbiAgcmV0dXJuIChtb2RlICYgU2VsZWN0b3JGbGFncy5OT1QpID09PSAwO1xufVxuXG5mdW5jdGlvbiBmaW5kQXR0ckluZGV4SW5Ob2RlKG5hbWU6IHN0cmluZywgYXR0cnM6IFRBdHRyaWJ1dGVzIHwgbnVsbCk6IG51bWJlciB7XG4gIGxldCBzdGVwID0gMjtcbiAgaWYgKGF0dHJzID09PSBudWxsKSByZXR1cm4gLTE7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgYXR0cnMubGVuZ3RoOyBpICs9IHN0ZXApIHtcbiAgICBjb25zdCBhdHRyTmFtZSA9IGF0dHJzW2ldO1xuICAgIGlmIChhdHRyTmFtZSA9PT0gbmFtZSkgcmV0dXJuIGk7XG4gICAgaWYgKGF0dHJOYW1lID09PSBBdHRyaWJ1dGVNYXJrZXIuU0VMRUNUX09OTFkpIHtcbiAgICAgIHN0ZXAgPSAxO1xuICAgIH1cbiAgfVxuICByZXR1cm4gLTE7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc05vZGVNYXRjaGluZ1NlbGVjdG9yTGlzdCh0Tm9kZTogVE5vZGUsIHNlbGVjdG9yOiBDc3NTZWxlY3Rvckxpc3QpOiBib29sZWFuIHtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBzZWxlY3Rvci5sZW5ndGg7IGkrKykge1xuICAgIGlmIChpc05vZGVNYXRjaGluZ1NlbGVjdG9yKHROb2RlLCBzZWxlY3RvcltpXSkpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBmYWxzZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFByb2plY3RBc0F0dHJWYWx1ZSh0Tm9kZTogVE5vZGUpOiBzdHJpbmd8bnVsbCB7XG4gIGNvbnN0IG5vZGVBdHRycyA9IHROb2RlLmF0dHJzO1xuICBpZiAobm9kZUF0dHJzICE9IG51bGwpIHtcbiAgICBjb25zdCBuZ1Byb2plY3RBc0F0dHJJZHggPSBub2RlQXR0cnMuaW5kZXhPZihOR19QUk9KRUNUX0FTX0FUVFJfTkFNRSk7XG4gICAgLy8gb25seSBjaGVjayBmb3IgbmdQcm9qZWN0QXMgaW4gYXR0cmlidXRlIG5hbWVzLCBkb24ndCBhY2NpZGVudGFsbHkgbWF0Y2ggYXR0cmlidXRlJ3MgdmFsdWVcbiAgICAvLyAoYXR0cmlidXRlIG5hbWVzIGFyZSBzdG9yZWQgYXQgZXZlbiBpbmRleGVzKVxuICAgIGlmICgobmdQcm9qZWN0QXNBdHRySWR4ICYgMSkgPT09IDApIHtcbiAgICAgIHJldHVybiBub2RlQXR0cnNbbmdQcm9qZWN0QXNBdHRySWR4ICsgMV0gYXMgc3RyaW5nO1xuICAgIH1cbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuLyoqXG4gKiBDaGVja3MgYSBnaXZlbiBub2RlIGFnYWluc3QgbWF0Y2hpbmcgc2VsZWN0b3JzIGFuZCByZXR1cm5zXG4gKiBzZWxlY3RvciBpbmRleCAob3IgMCBpZiBub25lIG1hdGNoZWQpLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gdGFrZXMgaW50byBhY2NvdW50IHRoZSBuZ1Byb2plY3RBcyBhdHRyaWJ1dGU6IGlmIHByZXNlbnQgaXRzIHZhbHVlIHdpbGwgYmUgY29tcGFyZWRcbiAqIHRvIHRoZSByYXcgKHVuLXBhcnNlZCkgQ1NTIHNlbGVjdG9yIGluc3RlYWQgb2YgdXNpbmcgc3RhbmRhcmQgc2VsZWN0b3IgbWF0Y2hpbmcgbG9naWMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBtYXRjaGluZ1NlbGVjdG9ySW5kZXgoXG4gICAgdE5vZGU6IFROb2RlLCBzZWxlY3RvcnM6IENzc1NlbGVjdG9yTGlzdFtdLCB0ZXh0U2VsZWN0b3JzOiBzdHJpbmdbXSk6IG51bWJlciB7XG4gIGNvbnN0IG5nUHJvamVjdEFzQXR0clZhbCA9IGdldFByb2plY3RBc0F0dHJWYWx1ZSh0Tm9kZSk7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgc2VsZWN0b3JzLmxlbmd0aDsgaSsrKSB7XG4gICAgLy8gaWYgYSBub2RlIGhhcyB0aGUgbmdQcm9qZWN0QXMgYXR0cmlidXRlIG1hdGNoIGl0IGFnYWluc3QgdW5wYXJzZWQgc2VsZWN0b3JcbiAgICAvLyBtYXRjaCBhIG5vZGUgYWdhaW5zdCBhIHBhcnNlZCBzZWxlY3RvciBvbmx5IGlmIG5nUHJvamVjdEFzIGF0dHJpYnV0ZSBpcyBub3QgcHJlc2VudFxuICAgIGlmIChuZ1Byb2plY3RBc0F0dHJWYWwgPT09IHRleHRTZWxlY3RvcnNbaV0gfHxcbiAgICAgICAgbmdQcm9qZWN0QXNBdHRyVmFsID09PSBudWxsICYmIGlzTm9kZU1hdGNoaW5nU2VsZWN0b3JMaXN0KHROb2RlLCBzZWxlY3RvcnNbaV0pKSB7XG4gICAgICByZXR1cm4gaSArIDE7ICAvLyBmaXJzdCBtYXRjaGluZyBzZWxlY3RvciBcImNhcHR1cmVzXCIgYSBnaXZlbiBub2RlXG4gICAgfVxuICB9XG4gIHJldHVybiAwO1xufVxuIl19