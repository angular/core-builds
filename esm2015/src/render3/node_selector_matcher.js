/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import './ng_dev_mode';
import { assertDefined, assertNotEqual } from './assert';
import { unusedValueExportToPlacateAjd as unused1 } from './interfaces/node';
import { NG_PROJECT_AS_ATTR_NAME, unusedValueExportToPlacateAjd as unused2 } from './interfaces/projection';
const unusedValueToPlacateAjd = unused1 + unused2;
function isCssClassMatching(nodeClassAttrVal, cssClassToMatch) {
    const nodeClassesLen = nodeClassAttrVal.length;
    const matchIndex = nodeClassAttrVal.indexOf(cssClassToMatch);
    const matchEndIdx = matchIndex + cssClassToMatch.length;
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
    ngDevMode && assertDefined(selector[0], 'Selector should have a tag name');
    let mode = 4 /* ELEMENT */;
    const nodeAttrs = tNode.attrs;
    const selectOnlyMarkerIdx = nodeAttrs ? nodeAttrs.indexOf(1 /* SelectOnly */) : -1;
    // When processing ":not" selectors, we skip to the next ":not" if the
    // current one doesn't match
    let skipToNextSelector = false;
    for (let i = 0; i < selector.length; i++) {
        const current = selector[i];
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
            const attrName = mode & 8 /* CLASS */ ? 'class' : current;
            const attrIndexInNode = findAttrIndexInNode(attrName, nodeAttrs);
            if (attrIndexInNode === -1) {
                if (isPositive(mode))
                    return false;
                skipToNextSelector = true;
                continue;
            }
            const selectorAttrValue = mode & 8 /* CLASS */ ? current : selector[++i];
            if (selectorAttrValue !== '') {
                let nodeAttrValue;
                const maybeAttrName = nodeAttrs[attrIndexInNode];
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
    let selectOnlyMode = false;
    let i = 0;
    while (i < attrs.length) {
        const maybeAttrName = attrs[i];
        if (maybeAttrName === name) {
            return i;
        }
        else if (maybeAttrName === 0 /* NamespaceURI */) {
            // NOTE(benlesh): will not find namespaced attributes. This is by design.
            i += 4;
        }
        else {
            if (maybeAttrName === 1 /* SelectOnly */) {
                selectOnlyMode = true;
            }
            i += selectOnlyMode ? 1 : 2;
        }
    }
    return -1;
}
export function isNodeMatchingSelectorList(tNode, selector) {
    for (let i = 0; i < selector.length; i++) {
        if (isNodeMatchingSelector(tNode, selector[i])) {
            return true;
        }
    }
    return false;
}
export function getProjectAsAttrValue(tNode) {
    const nodeAttrs = tNode.attrs;
    if (nodeAttrs != null) {
        const ngProjectAsAttrIdx = nodeAttrs.indexOf(NG_PROJECT_AS_ATTR_NAME);
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
    const ngProjectAsAttrVal = getProjectAsAttrValue(tNode);
    for (let i = 0; i < selectors.length; i++) {
        // if a node has the ngProjectAs attribute match it against unparsed selector
        // match a node against a parsed selector only if ngProjectAs attribute is not present
        if (ngProjectAsAttrVal === textSelectors[i] ||
            ngProjectAsAttrVal === null && isNodeMatchingSelectorList(tNode, selectors[i])) {
            return i + 1; // first matching selector "captures" a given node
        }
    }
    return 0;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9kZV9zZWxlY3Rvcl9tYXRjaGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9ub2RlX3NlbGVjdG9yX21hdGNoZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxlQUFlLENBQUM7QUFFdkIsT0FBTyxFQUFDLGFBQWEsRUFBRSxjQUFjLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDdkQsT0FBTyxFQUFzQyw2QkFBNkIsSUFBSSxPQUFPLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUNoSCxPQUFPLEVBQStCLHVCQUF1QixFQUFpQiw2QkFBNkIsSUFBSSxPQUFPLEVBQUMsTUFBTSx5QkFBeUIsQ0FBQztBQUV2SixNQUFNLHVCQUF1QixHQUFHLE9BQU8sR0FBRyxPQUFPLENBQUM7QUFFbEQsNEJBQTRCLGdCQUF3QixFQUFFLGVBQXVCO0lBQzNFLE1BQU0sY0FBYyxHQUFHLGdCQUFnQixDQUFDLE1BQU0sQ0FBQztJQUMvQyxNQUFNLFVBQVUsR0FBRyxnQkFBa0IsQ0FBQyxPQUFPLENBQUMsZUFBZSxDQUFDLENBQUM7SUFDL0QsTUFBTSxXQUFXLEdBQUcsVUFBVSxHQUFHLGVBQWUsQ0FBQyxNQUFNLENBQUM7SUFDeEQsSUFBSSxVQUFVLEtBQUssQ0FBQyxDQUFDLENBQWtELFdBQVc7V0FDM0UsQ0FBQyxVQUFVLEdBQUcsQ0FBQyxJQUFJLGdCQUFrQixDQUFDLFVBQVUsR0FBRyxDQUFDLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBRSxrQkFBa0I7O1lBRXJGLENBQUMsV0FBVyxHQUFHLGNBQWMsSUFBSSxnQkFBa0IsQ0FBQyxXQUFXLENBQUMsS0FBSyxHQUFHLENBQUMsRUFBRyxpQkFBaUI7S0FDakc7UUFDRSxPQUFPLEtBQUssQ0FBQztLQUNkO0lBQ0QsT0FBTyxJQUFJLENBQUM7QUFDZCxDQUFDO0FBRUQ7Ozs7OztHQU1HO0FB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QUM7QUFDWCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgJy4vbmdfZGV2X21vZGUnO1xuXG5pbXBvcnQge2Fzc2VydERlZmluZWQsIGFzc2VydE5vdEVxdWFsfSBmcm9tICcuL2Fzc2VydCc7XG5pbXBvcnQge0F0dHJpYnV0ZU1hcmtlciwgVEF0dHJpYnV0ZXMsIFROb2RlLCB1bnVzZWRWYWx1ZUV4cG9ydFRvUGxhY2F0ZUFqZCBhcyB1bnVzZWQxfSBmcm9tICcuL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge0Nzc1NlbGVjdG9yLCBDc3NTZWxlY3Rvckxpc3QsIE5HX1BST0pFQ1RfQVNfQVRUUl9OQU1FLCBTZWxlY3RvckZsYWdzLCB1bnVzZWRWYWx1ZUV4cG9ydFRvUGxhY2F0ZUFqZCBhcyB1bnVzZWQyfSBmcm9tICcuL2ludGVyZmFjZXMvcHJvamVjdGlvbic7XG5cbmNvbnN0IHVudXNlZFZhbHVlVG9QbGFjYXRlQWpkID0gdW51c2VkMSArIHVudXNlZDI7XG5cbmZ1bmN0aW9uIGlzQ3NzQ2xhc3NNYXRjaGluZyhub2RlQ2xhc3NBdHRyVmFsOiBzdHJpbmcsIGNzc0NsYXNzVG9NYXRjaDogc3RyaW5nKTogYm9vbGVhbiB7XG4gIGNvbnN0IG5vZGVDbGFzc2VzTGVuID0gbm9kZUNsYXNzQXR0clZhbC5sZW5ndGg7XG4gIGNvbnN0IG1hdGNoSW5kZXggPSBub2RlQ2xhc3NBdHRyVmFsICEuaW5kZXhPZihjc3NDbGFzc1RvTWF0Y2gpO1xuICBjb25zdCBtYXRjaEVuZElkeCA9IG1hdGNoSW5kZXggKyBjc3NDbGFzc1RvTWF0Y2gubGVuZ3RoO1xuICBpZiAobWF0Y2hJbmRleCA9PT0gLTEgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIG5vIG1hdGNoXG4gICAgICB8fCAobWF0Y2hJbmRleCA+IDAgJiYgbm9kZUNsYXNzQXR0clZhbCAhW21hdGNoSW5kZXggLSAxXSAhPT0gJyAnKSAgLy8gbm8gc3BhY2UgYmVmb3JlXG4gICAgICB8fFxuICAgICAgKG1hdGNoRW5kSWR4IDwgbm9kZUNsYXNzZXNMZW4gJiYgbm9kZUNsYXNzQXR0clZhbCAhW21hdGNoRW5kSWR4XSAhPT0gJyAnKSkgIC8vIG5vIHNwYWNlIGFmdGVyXG4gIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgcmV0dXJuIHRydWU7XG59XG5cbi8qKlxuICogQSB1dGlsaXR5IGZ1bmN0aW9uIHRvIG1hdGNoIGFuIEl2eSBub2RlIHN0YXRpYyBkYXRhIGFnYWluc3QgYSBzaW1wbGUgQ1NTIHNlbGVjdG9yXG4gKlxuICogQHBhcmFtIG5vZGUgc3RhdGljIGRhdGEgdG8gbWF0Y2hcbiAqIEBwYXJhbSBzZWxlY3RvclxuICogQHJldHVybnMgdHJ1ZSBpZiBub2RlIG1hdGNoZXMgdGhlIHNlbGVjdG9yLlxuICovXG5leHBvcnQgZnVuY3Rpb24gaXNOb2RlTWF0Y2hpbmdTZWxlY3Rvcih0Tm9kZTogVE5vZGUsIHNlbGVjdG9yOiBDc3NTZWxlY3Rvcik6IGJvb2xlYW4ge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChzZWxlY3RvclswXSwgJ1NlbGVjdG9yIHNob3VsZCBoYXZlIGEgdGFnIG5hbWUnKTtcblxuICBsZXQgbW9kZTogU2VsZWN0b3JGbGFncyA9IFNlbGVjdG9yRmxhZ3MuRUxFTUVOVDtcbiAgY29uc3Qgbm9kZUF0dHJzID0gdE5vZGUuYXR0cnMgITtcbiAgY29uc3Qgc2VsZWN0T25seU1hcmtlcklkeCA9IG5vZGVBdHRycyA/IG5vZGVBdHRycy5pbmRleE9mKEF0dHJpYnV0ZU1hcmtlci5TZWxlY3RPbmx5KSA6IC0xO1xuXG4gIC8vIFdoZW4gcHJvY2Vzc2luZyBcIjpub3RcIiBzZWxlY3RvcnMsIHdlIHNraXAgdG8gdGhlIG5leHQgXCI6bm90XCIgaWYgdGhlXG4gIC8vIGN1cnJlbnQgb25lIGRvZXNuJ3QgbWF0Y2hcbiAgbGV0IHNraXBUb05leHRTZWxlY3RvciA9IGZhbHNlO1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgc2VsZWN0b3IubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBjdXJyZW50ID0gc2VsZWN0b3JbaV07XG4gICAgaWYgKHR5cGVvZiBjdXJyZW50ID09PSAnbnVtYmVyJykge1xuICAgICAgLy8gSWYgd2UgZmluaXNoIHByb2Nlc3NpbmcgYSA6bm90IHNlbGVjdG9yIGFuZCBpdCBoYXNuJ3QgZmFpbGVkLCByZXR1cm4gZmFsc2VcbiAgICAgIGlmICghc2tpcFRvTmV4dFNlbGVjdG9yICYmICFpc1Bvc2l0aXZlKG1vZGUpICYmICFpc1Bvc2l0aXZlKGN1cnJlbnQgYXMgbnVtYmVyKSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICAvLyBJZiB3ZSBhcmUgc2tpcHBpbmcgdG8gdGhlIG5leHQgOm5vdCgpIGFuZCB0aGlzIG1vZGUgZmxhZyBpcyBwb3NpdGl2ZSxcbiAgICAgIC8vIGl0J3MgYSBwYXJ0IG9mIHRoZSBjdXJyZW50IDpub3QoKSBzZWxlY3RvciwgYW5kIHdlIHNob3VsZCBrZWVwIHNraXBwaW5nXG4gICAgICBpZiAoc2tpcFRvTmV4dFNlbGVjdG9yICYmIGlzUG9zaXRpdmUoY3VycmVudCkpIGNvbnRpbnVlO1xuICAgICAgc2tpcFRvTmV4dFNlbGVjdG9yID0gZmFsc2U7XG4gICAgICBtb2RlID0gKGN1cnJlbnQgYXMgbnVtYmVyKSB8IChtb2RlICYgU2VsZWN0b3JGbGFncy5OT1QpO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKHNraXBUb05leHRTZWxlY3RvcikgY29udGludWU7XG5cbiAgICBpZiAobW9kZSAmIFNlbGVjdG9yRmxhZ3MuRUxFTUVOVCkge1xuICAgICAgbW9kZSA9IFNlbGVjdG9yRmxhZ3MuQVRUUklCVVRFIHwgbW9kZSAmIFNlbGVjdG9yRmxhZ3MuTk9UO1xuICAgICAgaWYgKGN1cnJlbnQgIT09ICcnICYmIGN1cnJlbnQgIT09IHROb2RlLnRhZ05hbWUpIHtcbiAgICAgICAgaWYgKGlzUG9zaXRpdmUobW9kZSkpIHJldHVybiBmYWxzZTtcbiAgICAgICAgc2tpcFRvTmV4dFNlbGVjdG9yID0gdHJ1ZTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgYXR0ck5hbWUgPSBtb2RlICYgU2VsZWN0b3JGbGFncy5DTEFTUyA/ICdjbGFzcycgOiBjdXJyZW50O1xuICAgICAgY29uc3QgYXR0ckluZGV4SW5Ob2RlID0gZmluZEF0dHJJbmRleEluTm9kZShhdHRyTmFtZSwgbm9kZUF0dHJzKTtcblxuICAgICAgaWYgKGF0dHJJbmRleEluTm9kZSA9PT0gLTEpIHtcbiAgICAgICAgaWYgKGlzUG9zaXRpdmUobW9kZSkpIHJldHVybiBmYWxzZTtcbiAgICAgICAgc2tpcFRvTmV4dFNlbGVjdG9yID0gdHJ1ZTtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHNlbGVjdG9yQXR0clZhbHVlID0gbW9kZSAmIFNlbGVjdG9yRmxhZ3MuQ0xBU1MgPyBjdXJyZW50IDogc2VsZWN0b3JbKytpXTtcbiAgICAgIGlmIChzZWxlY3RvckF0dHJWYWx1ZSAhPT0gJycpIHtcbiAgICAgICAgbGV0IG5vZGVBdHRyVmFsdWU6IHN0cmluZztcbiAgICAgICAgY29uc3QgbWF5YmVBdHRyTmFtZSA9IG5vZGVBdHRyc1thdHRySW5kZXhJbk5vZGVdO1xuICAgICAgICBpZiAoc2VsZWN0T25seU1hcmtlcklkeCA+IC0xICYmIGF0dHJJbmRleEluTm9kZSA+IHNlbGVjdE9ubHlNYXJrZXJJZHgpIHtcbiAgICAgICAgICBub2RlQXR0clZhbHVlID0gJyc7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbmdEZXZNb2RlICYmIGFzc2VydE5vdEVxdWFsKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgbWF5YmVBdHRyTmFtZSwgQXR0cmlidXRlTWFya2VyLk5hbWVzcGFjZVVSSSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICdXZSBkbyBub3QgbWF0Y2ggZGlyZWN0aXZlcyBvbiBuYW1lc3BhY2VkIGF0dHJpYnV0ZXMnKTtcbiAgICAgICAgICBub2RlQXR0clZhbHVlID0gbm9kZUF0dHJzW2F0dHJJbmRleEluTm9kZSArIDFdIGFzIHN0cmluZztcbiAgICAgICAgfVxuICAgICAgICBpZiAobW9kZSAmIFNlbGVjdG9yRmxhZ3MuQ0xBU1MgJiZcbiAgICAgICAgICAgICAgICAhaXNDc3NDbGFzc01hdGNoaW5nKG5vZGVBdHRyVmFsdWUgYXMgc3RyaW5nLCBzZWxlY3RvckF0dHJWYWx1ZSBhcyBzdHJpbmcpIHx8XG4gICAgICAgICAgICBtb2RlICYgU2VsZWN0b3JGbGFncy5BVFRSSUJVVEUgJiYgc2VsZWN0b3JBdHRyVmFsdWUgIT09IG5vZGVBdHRyVmFsdWUpIHtcbiAgICAgICAgICBpZiAoaXNQb3NpdGl2ZShtb2RlKSkgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgIHNraXBUb05leHRTZWxlY3RvciA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gaXNQb3NpdGl2ZShtb2RlKSB8fCBza2lwVG9OZXh0U2VsZWN0b3I7XG59XG5cbmZ1bmN0aW9uIGlzUG9zaXRpdmUobW9kZTogU2VsZWN0b3JGbGFncyk6IGJvb2xlYW4ge1xuICByZXR1cm4gKG1vZGUgJiBTZWxlY3RvckZsYWdzLk5PVCkgPT09IDA7XG59XG5cbi8qKlxuICogRXhhbWluZXMgYW4gYXR0cmlidXRlcyBkZWZpbml0aW9uIGFycmF5IGZyb20gYSBub2RlIHRvIGZpbmQgdGhlIGluZGV4IG9mIHRoZVxuICogYXR0cmlidXRlIHdpdGggdGhlIHNwZWNpZmllZCBuYW1lLlxuICpcbiAqIE5PVEU6IFdpbGwgbm90IGZpbmQgbmFtZXNwYWNlZCBhdHRyaWJ1dGVzLlxuICpcbiAqIEBwYXJhbSBuYW1lIHRoZSBuYW1lIG9mIHRoZSBhdHRyaWJ1dGUgdG8gZmluZFxuICogQHBhcmFtIGF0dHJzIHRoZSBhdHRyaWJ1dGUgYXJyYXkgdG8gZXhhbWluZVxuICovXG5mdW5jdGlvbiBmaW5kQXR0ckluZGV4SW5Ob2RlKG5hbWU6IHN0cmluZywgYXR0cnM6IFRBdHRyaWJ1dGVzIHwgbnVsbCk6IG51bWJlciB7XG4gIGlmIChhdHRycyA9PT0gbnVsbCkgcmV0dXJuIC0xO1xuICBsZXQgc2VsZWN0T25seU1vZGUgPSBmYWxzZTtcbiAgbGV0IGkgPSAwO1xuICB3aGlsZSAoaSA8IGF0dHJzLmxlbmd0aCkge1xuICAgIGNvbnN0IG1heWJlQXR0ck5hbWUgPSBhdHRyc1tpXTtcbiAgICBpZiAobWF5YmVBdHRyTmFtZSA9PT0gbmFtZSkge1xuICAgICAgcmV0dXJuIGk7XG4gICAgfSBlbHNlIGlmIChtYXliZUF0dHJOYW1lID09PSBBdHRyaWJ1dGVNYXJrZXIuTmFtZXNwYWNlVVJJKSB7XG4gICAgICAvLyBOT1RFKGJlbmxlc2gpOiB3aWxsIG5vdCBmaW5kIG5hbWVzcGFjZWQgYXR0cmlidXRlcy4gVGhpcyBpcyBieSBkZXNpZ24uXG4gICAgICBpICs9IDQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChtYXliZUF0dHJOYW1lID09PSBBdHRyaWJ1dGVNYXJrZXIuU2VsZWN0T25seSkge1xuICAgICAgICBzZWxlY3RPbmx5TW9kZSA9IHRydWU7XG4gICAgICB9XG4gICAgICBpICs9IHNlbGVjdE9ubHlNb2RlID8gMSA6IDI7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIC0xO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNOb2RlTWF0Y2hpbmdTZWxlY3Rvckxpc3QodE5vZGU6IFROb2RlLCBzZWxlY3RvcjogQ3NzU2VsZWN0b3JMaXN0KTogYm9vbGVhbiB7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgc2VsZWN0b3IubGVuZ3RoOyBpKyspIHtcbiAgICBpZiAoaXNOb2RlTWF0Y2hpbmdTZWxlY3Rvcih0Tm9kZSwgc2VsZWN0b3JbaV0pKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gZmFsc2U7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRQcm9qZWN0QXNBdHRyVmFsdWUodE5vZGU6IFROb2RlKTogc3RyaW5nfG51bGwge1xuICBjb25zdCBub2RlQXR0cnMgPSB0Tm9kZS5hdHRycztcbiAgaWYgKG5vZGVBdHRycyAhPSBudWxsKSB7XG4gICAgY29uc3QgbmdQcm9qZWN0QXNBdHRySWR4ID0gbm9kZUF0dHJzLmluZGV4T2YoTkdfUFJPSkVDVF9BU19BVFRSX05BTUUpO1xuICAgIC8vIG9ubHkgY2hlY2sgZm9yIG5nUHJvamVjdEFzIGluIGF0dHJpYnV0ZSBuYW1lcywgZG9uJ3QgYWNjaWRlbnRhbGx5IG1hdGNoIGF0dHJpYnV0ZSdzIHZhbHVlXG4gICAgLy8gKGF0dHJpYnV0ZSBuYW1lcyBhcmUgc3RvcmVkIGF0IGV2ZW4gaW5kZXhlcylcbiAgICBpZiAoKG5nUHJvamVjdEFzQXR0cklkeCAmIDEpID09PSAwKSB7XG4gICAgICByZXR1cm4gbm9kZUF0dHJzW25nUHJvamVjdEFzQXR0cklkeCArIDFdIGFzIHN0cmluZztcbiAgICB9XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbi8qKlxuICogQ2hlY2tzIGEgZ2l2ZW4gbm9kZSBhZ2FpbnN0IG1hdGNoaW5nIHNlbGVjdG9ycyBhbmQgcmV0dXJuc1xuICogc2VsZWN0b3IgaW5kZXggKG9yIDAgaWYgbm9uZSBtYXRjaGVkKS5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIHRha2VzIGludG8gYWNjb3VudCB0aGUgbmdQcm9qZWN0QXMgYXR0cmlidXRlOiBpZiBwcmVzZW50IGl0cyB2YWx1ZSB3aWxsIGJlIGNvbXBhcmVkXG4gKiB0byB0aGUgcmF3ICh1bi1wYXJzZWQpIENTUyBzZWxlY3RvciBpbnN0ZWFkIG9mIHVzaW5nIHN0YW5kYXJkIHNlbGVjdG9yIG1hdGNoaW5nIGxvZ2ljLlxuICovXG5leHBvcnQgZnVuY3Rpb24gbWF0Y2hpbmdTZWxlY3RvckluZGV4KFxuICAgIHROb2RlOiBUTm9kZSwgc2VsZWN0b3JzOiBDc3NTZWxlY3Rvckxpc3RbXSwgdGV4dFNlbGVjdG9yczogc3RyaW5nW10pOiBudW1iZXIge1xuICBjb25zdCBuZ1Byb2plY3RBc0F0dHJWYWwgPSBnZXRQcm9qZWN0QXNBdHRyVmFsdWUodE5vZGUpO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IHNlbGVjdG9ycy5sZW5ndGg7IGkrKykge1xuICAgIC8vIGlmIGEgbm9kZSBoYXMgdGhlIG5nUHJvamVjdEFzIGF0dHJpYnV0ZSBtYXRjaCBpdCBhZ2FpbnN0IHVucGFyc2VkIHNlbGVjdG9yXG4gICAgLy8gbWF0Y2ggYSBub2RlIGFnYWluc3QgYSBwYXJzZWQgc2VsZWN0b3Igb25seSBpZiBuZ1Byb2plY3RBcyBhdHRyaWJ1dGUgaXMgbm90IHByZXNlbnRcbiAgICBpZiAobmdQcm9qZWN0QXNBdHRyVmFsID09PSB0ZXh0U2VsZWN0b3JzW2ldIHx8XG4gICAgICAgIG5nUHJvamVjdEFzQXR0clZhbCA9PT0gbnVsbCAmJiBpc05vZGVNYXRjaGluZ1NlbGVjdG9yTGlzdCh0Tm9kZSwgc2VsZWN0b3JzW2ldKSkge1xuICAgICAgcmV0dXJuIGkgKyAxOyAgLy8gZmlyc3QgbWF0Y2hpbmcgc2VsZWN0b3IgXCJjYXB0dXJlc1wiIGEgZ2l2ZW4gbm9kZVxuICAgIH1cbiAgfVxuICByZXR1cm4gMDtcbn1cbiJdfQ==