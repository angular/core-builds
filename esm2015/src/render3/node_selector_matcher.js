/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */
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
const /** @type {?} */ unusedValueToPlacateAjd = unused1 + unused2;
/**
 * @param {?} nodeClassAttrVal
 * @param {?} cssClassToMatch
 * @return {?}
 */
function isCssClassMatching(nodeClassAttrVal, cssClassToMatch) {
    const /** @type {?} */ nodeClassesLen = nodeClassAttrVal.length;
    const /** @type {?} */ matchIndex = /** @type {?} */ ((nodeClassAttrVal)).indexOf(cssClassToMatch);
    const /** @type {?} */ matchEndIdx = matchIndex + cssClassToMatch.length;
    if (matchIndex === -1 // no match
        || (matchIndex > 0 && /** @type {?} */ ((nodeClassAttrVal))[matchIndex - 1] !== ' ') // no space before
        ||
            (matchEndIdx < nodeClassesLen && /** @type {?} */ ((nodeClassAttrVal))[matchEndIdx] !== ' ')) // no space after
     {
        return false;
    }
    return true;
}
/**
 * A utility function to match an Ivy node static data against a simple CSS selector
 *
 * @param {?} tNode
 * @param {?} selector
 * @return {?} true if node matches the selector.
 */
export function isNodeMatchingSelector(tNode, selector) {
    ngDevMode && assertNotNull(selector[0], 'Selector should have a tag name');
    let /** @type {?} */ mode = 4 /* ELEMENT */;
    const /** @type {?} */ nodeAttrs = /** @type {?} */ ((tNode.attrs));
    const /** @type {?} */ selectOnlyMarkerIdx = nodeAttrs ? nodeAttrs.indexOf(1 /* SelectOnly */) : -1;
    // When processing ":not" selectors, we skip to the next ":not" if the
    // current one doesn't match
    let /** @type {?} */ skipToNextSelector = false;
    for (let /** @type {?} */ i = 0; i < selector.length; i++) {
        const /** @type {?} */ current = selector[i];
        if (typeof current === 'number') {
            // If we finish processing a :not selector and it hasn't failed, return false
            if (!skipToNextSelector && !isPositive(mode) && !isPositive(/** @type {?} */ (current))) {
                return false;
            }
            // If we are skipping to the next :not() and this mode flag is positive,
            // it's a part of the current :not() selector, and we should keep skipping
            if (skipToNextSelector && isPositive(current))
                continue;
            skipToNextSelector = false;
            mode = (/** @type {?} */ (current)) | (mode & 1 /* NOT */);
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
            const /** @type {?} */ attrName = mode & 8 /* CLASS */ ? 'class' : current;
            const /** @type {?} */ attrIndexInNode = findAttrIndexInNode(attrName, nodeAttrs);
            if (attrIndexInNode === -1) {
                if (isPositive(mode))
                    return false;
                skipToNextSelector = true;
                continue;
            }
            const /** @type {?} */ selectorAttrValue = mode & 8 /* CLASS */ ? current : selector[++i];
            if (selectorAttrValue !== '') {
                const /** @type {?} */ nodeAttrValue = selectOnlyMarkerIdx > -1 && attrIndexInNode > selectOnlyMarkerIdx ?
                    '' :
                    nodeAttrs[attrIndexInNode + 1];
                if (mode & 8 /* CLASS */ &&
                    !isCssClassMatching(/** @type {?} */ (nodeAttrValue), /** @type {?} */ (selectorAttrValue)) ||
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
 * @param {?} name
 * @param {?} attrs
 * @return {?}
 */
function findAttrIndexInNode(name, attrs) {
    let /** @type {?} */ step = 2;
    if (attrs === null)
        return -1;
    for (let /** @type {?} */ i = 0; i < attrs.length; i += step) {
        const /** @type {?} */ attrName = attrs[i];
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
/**
 * @param {?} tNode
 * @param {?} selector
 * @return {?}
 */
export function isNodeMatchingSelectorList(tNode, selector) {
    for (let /** @type {?} */ i = 0; i < selector.length; i++) {
        if (isNodeMatchingSelector(tNode, selector[i])) {
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
    const /** @type {?} */ nodeAttrs = tNode.attrs;
    if (nodeAttrs != null) {
        const /** @type {?} */ ngProjectAsAttrIdx = nodeAttrs.indexOf(NG_PROJECT_AS_ATTR_NAME);
        // only check for ngProjectAs in attribute names, don't accidentally match attribute's value
        // (attribute names are stored at even indexes)
        if ((ngProjectAsAttrIdx & 1) === 0) {
            return /** @type {?} */ (nodeAttrs[ngProjectAsAttrIdx + 1]);
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
    const /** @type {?} */ ngProjectAsAttrVal = getProjectAsAttrValue(tNode);
    for (let /** @type {?} */ i = 0; i < selectors.length; i++) {
        // if a node has the ngProjectAs attribute match it against unparsed selector
        // match a node against a parsed selector only if ngProjectAs attribute is not present
        if (ngProjectAsAttrVal === textSelectors[i] ||
            ngProjectAsAttrVal === null && isNodeMatchingSelectorList(tNode, selectors[i])) {
            return i + 1; // first matching selector "captures" a given node
        }
    }
    return 0;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9kZV9zZWxlY3Rvcl9tYXRjaGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9ub2RlX3NlbGVjdG9yX21hdGNoZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFRQSxPQUFPLGVBQWUsQ0FBQztBQUV2QixPQUFPLEVBQUMsYUFBYSxFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQ3ZDLE9BQU8sRUFBc0MsNkJBQTZCLElBQUksT0FBTyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDaEgsT0FBTyxFQUErQix1QkFBdUIsRUFBaUIsNkJBQTZCLElBQUksT0FBTyxFQUFDLE1BQU0seUJBQXlCLENBQUM7QUFHdkosdUJBQU0sdUJBQXVCLEdBQUcsT0FBTyxHQUFHLE9BQU8sQ0FBQzs7Ozs7O0FBRWxELDRCQUE0QixnQkFBd0IsRUFBRSxlQUF1QjtJQUMzRSx1QkFBTSxjQUFjLEdBQUcsZ0JBQWdCLENBQUMsTUFBTSxDQUFDO0lBQy9DLHVCQUFNLFVBQVUsc0JBQUcsZ0JBQWdCLEdBQUcsT0FBTyxDQUFDLGVBQWUsQ0FBQyxDQUFDO0lBQy9ELHVCQUFNLFdBQVcsR0FBRyxVQUFVLEdBQUcsZUFBZSxDQUFDLE1BQU0sQ0FBQztJQUN4RCxJQUFJLFVBQVUsS0FBSyxDQUFDLENBQUM7V0FDZCxDQUFDLFVBQVUsR0FBRyxDQUFDLHVCQUFJLGdCQUFnQixHQUFHLFVBQVUsR0FBRyxDQUFDLE1BQU0sR0FBRyxDQUFDOztZQUVqRSxDQUFDLFdBQVcsR0FBRyxjQUFjLHVCQUFJLGdCQUFnQixHQUFHLFdBQVcsTUFBTSxHQUFHLENBQUMsRUFBRyxpQkFBaUI7S0FDakc7UUFDRSxPQUFPLEtBQUssQ0FBQztLQUNkO0lBQ0QsT0FBTyxJQUFJLENBQUM7Q0FDYjs7Ozs7Ozs7QUFTRCxNQUFNLGlDQUFpQyxLQUFZLEVBQUUsUUFBcUI7SUFDeEUsU0FBUyxJQUFJLGFB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Q0FBQyxDQUFDOzs7UUFHdEUsSUFBSSxDQUFDLGtCQUFrQixHQUFHLENBQUMsQ0FBQyxLQUFLLENBQUMsRUFBRTtZQUNsQyx5QkFBTyxTQUFTLENBQUMsa0JBQWtCLEdBQUcsQ0FBQyxDQUFXLEVBQUM7U0FDcEQ7S0FDRjtJQUNELE9BQU8sSUFBSSxDQUFDO0NBQ2I7Ozs7Ozs7Ozs7OztBQVNELE1BQU0sZ0NBQ0YsS0FBWSxFQUFFLFNBQTRCLEVBQUUsYUFBdUI7SUFDckUsdUJBQU0sa0JBQWtCLEdBQUcscUJBQXFCLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDeEQsS0FBSyxxQkFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxTQUFTLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFOzs7UUFHekMsSUFBSSxrQkFBa0IsS0FBSyxhQUFhLENBQUMsQ0FBQyxDQUFDO1lBQ3ZDLGtCQUFrQixLQUFLLElBQUksSUFBSSwwQkFBMEIsQ0FBQyxLQUFLLEVBQUUsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUU7WUFDbEYsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1NBQ2Q7S0FDRjtJQUNELE9BQU8sQ0FBQyxDQUFDO0NBQ1YiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCAnLi9uZ19kZXZfbW9kZSc7XG5cbmltcG9ydCB7YXNzZXJ0Tm90TnVsbH0gZnJvbSAnLi9hc3NlcnQnO1xuaW1wb3J0IHtBdHRyaWJ1dGVNYXJrZXIsIFRBdHRyaWJ1dGVzLCBUTm9kZSwgdW51c2VkVmFsdWVFeHBvcnRUb1BsYWNhdGVBamQgYXMgdW51c2VkMX0gZnJvbSAnLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtDc3NTZWxlY3RvciwgQ3NzU2VsZWN0b3JMaXN0LCBOR19QUk9KRUNUX0FTX0FUVFJfTkFNRSwgU2VsZWN0b3JGbGFncywgdW51c2VkVmFsdWVFeHBvcnRUb1BsYWNhdGVBamQgYXMgdW51c2VkMn0gZnJvbSAnLi9pbnRlcmZhY2VzL3Byb2plY3Rpb24nO1xuXG5cbmNvbnN0IHVudXNlZFZhbHVlVG9QbGFjYXRlQWpkID0gdW51c2VkMSArIHVudXNlZDI7XG5cbmZ1bmN0aW9uIGlzQ3NzQ2xhc3NNYXRjaGluZyhub2RlQ2xhc3NBdHRyVmFsOiBzdHJpbmcsIGNzc0NsYXNzVG9NYXRjaDogc3RyaW5nKTogYm9vbGVhbiB7XG4gIGNvbnN0IG5vZGVDbGFzc2VzTGVuID0gbm9kZUNsYXNzQXR0clZhbC5sZW5ndGg7XG4gIGNvbnN0IG1hdGNoSW5kZXggPSBub2RlQ2xhc3NBdHRyVmFsICEuaW5kZXhPZihjc3NDbGFzc1RvTWF0Y2gpO1xuICBjb25zdCBtYXRjaEVuZElkeCA9IG1hdGNoSW5kZXggKyBjc3NDbGFzc1RvTWF0Y2gubGVuZ3RoO1xuICBpZiAobWF0Y2hJbmRleCA9PT0gLTEgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIG5vIG1hdGNoXG4gICAgICB8fCAobWF0Y2hJbmRleCA+IDAgJiYgbm9kZUNsYXNzQXR0clZhbCAhW21hdGNoSW5kZXggLSAxXSAhPT0gJyAnKSAgLy8gbm8gc3BhY2UgYmVmb3JlXG4gICAgICB8fFxuICAgICAgKG1hdGNoRW5kSWR4IDwgbm9kZUNsYXNzZXNMZW4gJiYgbm9kZUNsYXNzQXR0clZhbCAhW21hdGNoRW5kSWR4XSAhPT0gJyAnKSkgIC8vIG5vIHNwYWNlIGFmdGVyXG4gIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgcmV0dXJuIHRydWU7XG59XG5cbi8qKlxuICogQSB1dGlsaXR5IGZ1bmN0aW9uIHRvIG1hdGNoIGFuIEl2eSBub2RlIHN0YXRpYyBkYXRhIGFnYWluc3QgYSBzaW1wbGUgQ1NTIHNlbGVjdG9yXG4gKlxuICogQHBhcmFtIG5vZGUgc3RhdGljIGRhdGEgdG8gbWF0Y2hcbiAqIEBwYXJhbSBzZWxlY3RvclxuICogQHJldHVybnMgdHJ1ZSBpZiBub2RlIG1hdGNoZXMgdGhlIHNlbGVjdG9yLlxuICovXG5leHBvcnQgZnVuY3Rpb24gaXNOb2RlTWF0Y2hpbmdTZWxlY3Rvcih0Tm9kZTogVE5vZGUsIHNlbGVjdG9yOiBDc3NTZWxlY3Rvcik6IGJvb2xlYW4ge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm90TnVsbChzZWxlY3RvclswXSwgJ1NlbGVjdG9yIHNob3VsZCBoYXZlIGEgdGFnIG5hbWUnKTtcblxuICBsZXQgbW9kZTogU2VsZWN0b3JGbGFncyA9IFNlbGVjdG9yRmxhZ3MuRUxFTUVOVDtcbiAgY29uc3Qgbm9kZUF0dHJzID0gdE5vZGUuYXR0cnMgITtcbiAgY29uc3Qgc2VsZWN0T25seU1hcmtlcklkeCA9IG5vZGVBdHRycyA/IG5vZGVBdHRycy5pbmRleE9mKEF0dHJpYnV0ZU1hcmtlci5TZWxlY3RPbmx5KSA6IC0xO1xuXG4gIC8vIFdoZW4gcHJvY2Vzc2luZyBcIjpub3RcIiBzZWxlY3RvcnMsIHdlIHNraXAgdG8gdGhlIG5leHQgXCI6bm90XCIgaWYgdGhlXG4gIC8vIGN1cnJlbnQgb25lIGRvZXNuJ3QgbWF0Y2hcbiAgbGV0IHNraXBUb05leHRTZWxlY3RvciA9IGZhbHNlO1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgc2VsZWN0b3IubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBjdXJyZW50ID0gc2VsZWN0b3JbaV07XG4gICAgaWYgKHR5cGVvZiBjdXJyZW50ID09PSAnbnVtYmVyJykge1xuICAgICAgLy8gSWYgd2UgZmluaXNoIHByb2Nlc3NpbmcgYSA6bm90IHNlbGVjdG9yIGFuZCBpdCBoYXNuJ3QgZmFpbGVkLCByZXR1cm4gZmFsc2VcbiAgICAgIGlmICghc2tpcFRvTmV4dFNlbGVjdG9yICYmICFpc1Bvc2l0aXZlKG1vZGUpICYmICFpc1Bvc2l0aXZlKGN1cnJlbnQgYXMgbnVtYmVyKSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICAvLyBJZiB3ZSBhcmUgc2tpcHBpbmcgdG8gdGhlIG5leHQgOm5vdCgpIGFuZCB0aGlzIG1vZGUgZmxhZyBpcyBwb3NpdGl2ZSxcbiAgICAgIC8vIGl0J3MgYSBwYXJ0IG9mIHRoZSBjdXJyZW50IDpub3QoKSBzZWxlY3RvciwgYW5kIHdlIHNob3VsZCBrZWVwIHNraXBwaW5nXG4gICAgICBpZiAoc2tpcFRvTmV4dFNlbGVjdG9yICYmIGlzUG9zaXRpdmUoY3VycmVudCkpIGNvbnRpbnVlO1xuICAgICAgc2tpcFRvTmV4dFNlbGVjdG9yID0gZmFsc2U7XG4gICAgICBtb2RlID0gKGN1cnJlbnQgYXMgbnVtYmVyKSB8IChtb2RlICYgU2VsZWN0b3JGbGFncy5OT1QpO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKHNraXBUb05leHRTZWxlY3RvcikgY29udGludWU7XG5cbiAgICBpZiAobW9kZSAmIFNlbGVjdG9yRmxhZ3MuRUxFTUVOVCkge1xuICAgICAgbW9kZSA9IFNlbGVjdG9yRmxhZ3MuQVRUUklCVVRFIHwgbW9kZSAmIFNlbGVjdG9yRmxhZ3MuTk9UO1xuICAgICAgaWYgKGN1cnJlbnQgIT09ICcnICYmIGN1cnJlbnQgIT09IHROb2RlLnRhZ05hbWUpIHtcbiAgICAgICAgaWYgKGlzUG9zaXRpdmUobW9kZSkpIHJldHVybiBmYWxzZTtcbiAgICAgICAgc2tpcFRvTmV4dFNlbGVjdG9yID0gdHJ1ZTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgYXR0ck5hbWUgPSBtb2RlICYgU2VsZWN0b3JGbGFncy5DTEFTUyA/ICdjbGFzcycgOiBjdXJyZW50O1xuICAgICAgY29uc3QgYXR0ckluZGV4SW5Ob2RlID0gZmluZEF0dHJJbmRleEluTm9kZShhdHRyTmFtZSwgbm9kZUF0dHJzKTtcblxuICAgICAgaWYgKGF0dHJJbmRleEluTm9kZSA9PT0gLTEpIHtcbiAgICAgICAgaWYgKGlzUG9zaXRpdmUobW9kZSkpIHJldHVybiBmYWxzZTtcbiAgICAgICAgc2tpcFRvTmV4dFNlbGVjdG9yID0gdHJ1ZTtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHNlbGVjdG9yQXR0clZhbHVlID0gbW9kZSAmIFNlbGVjdG9yRmxhZ3MuQ0xBU1MgPyBjdXJyZW50IDogc2VsZWN0b3JbKytpXTtcbiAgICAgIGlmIChzZWxlY3RvckF0dHJWYWx1ZSAhPT0gJycpIHtcbiAgICAgICAgY29uc3Qgbm9kZUF0dHJWYWx1ZSA9IHNlbGVjdE9ubHlNYXJrZXJJZHggPiAtMSAmJiBhdHRySW5kZXhJbk5vZGUgPiBzZWxlY3RPbmx5TWFya2VySWR4ID9cbiAgICAgICAgICAgICcnIDpcbiAgICAgICAgICAgIG5vZGVBdHRyc1thdHRySW5kZXhJbk5vZGUgKyAxXTtcbiAgICAgICAgaWYgKG1vZGUgJiBTZWxlY3RvckZsYWdzLkNMQVNTICYmXG4gICAgICAgICAgICAgICAgIWlzQ3NzQ2xhc3NNYXRjaGluZyhub2RlQXR0clZhbHVlIGFzIHN0cmluZywgc2VsZWN0b3JBdHRyVmFsdWUgYXMgc3RyaW5nKSB8fFxuICAgICAgICAgICAgbW9kZSAmIFNlbGVjdG9yRmxhZ3MuQVRUUklCVVRFICYmIHNlbGVjdG9yQXR0clZhbHVlICE9PSBub2RlQXR0clZhbHVlKSB7XG4gICAgICAgICAgaWYgKGlzUG9zaXRpdmUobW9kZSkpIHJldHVybiBmYWxzZTtcbiAgICAgICAgICBza2lwVG9OZXh0U2VsZWN0b3IgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGlzUG9zaXRpdmUobW9kZSkgfHwgc2tpcFRvTmV4dFNlbGVjdG9yO1xufVxuXG5mdW5jdGlvbiBpc1Bvc2l0aXZlKG1vZGU6IFNlbGVjdG9yRmxhZ3MpOiBib29sZWFuIHtcbiAgcmV0dXJuIChtb2RlICYgU2VsZWN0b3JGbGFncy5OT1QpID09PSAwO1xufVxuXG5mdW5jdGlvbiBmaW5kQXR0ckluZGV4SW5Ob2RlKG5hbWU6IHN0cmluZywgYXR0cnM6IFRBdHRyaWJ1dGVzIHwgbnVsbCk6IG51bWJlciB7XG4gIGxldCBzdGVwID0gMjtcbiAgaWYgKGF0dHJzID09PSBudWxsKSByZXR1cm4gLTE7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgYXR0cnMubGVuZ3RoOyBpICs9IHN0ZXApIHtcbiAgICBjb25zdCBhdHRyTmFtZSA9IGF0dHJzW2ldO1xuICAgIGlmIChhdHRyTmFtZSA9PT0gQXR0cmlidXRlTWFya2VyLk5hbWVzcGFjZVVyaSkge1xuICAgICAgc3RlcCA9IDI7XG4gICAgfSBlbHNlIGlmIChhdHRyTmFtZSA9PT0gbmFtZSkge1xuICAgICAgcmV0dXJuIGk7XG4gICAgfSBlbHNlIGlmIChhdHRyTmFtZSA9PT0gQXR0cmlidXRlTWFya2VyLlNlbGVjdE9ubHkpIHtcbiAgICAgIHN0ZXAgPSAxO1xuICAgIH1cbiAgfVxuICByZXR1cm4gLTE7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc05vZGVNYXRjaGluZ1NlbGVjdG9yTGlzdCh0Tm9kZTogVE5vZGUsIHNlbGVjdG9yOiBDc3NTZWxlY3Rvckxpc3QpOiBib29sZWFuIHtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBzZWxlY3Rvci5sZW5ndGg7IGkrKykge1xuICAgIGlmIChpc05vZGVNYXRjaGluZ1NlbGVjdG9yKHROb2RlLCBzZWxlY3RvcltpXSkpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBmYWxzZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFByb2plY3RBc0F0dHJWYWx1ZSh0Tm9kZTogVE5vZGUpOiBzdHJpbmd8bnVsbCB7XG4gIGNvbnN0IG5vZGVBdHRycyA9IHROb2RlLmF0dHJzO1xuICBpZiAobm9kZUF0dHJzICE9IG51bGwpIHtcbiAgICBjb25zdCBuZ1Byb2plY3RBc0F0dHJJZHggPSBub2RlQXR0cnMuaW5kZXhPZihOR19QUk9KRUNUX0FTX0FUVFJfTkFNRSk7XG4gICAgLy8gb25seSBjaGVjayBmb3IgbmdQcm9qZWN0QXMgaW4gYXR0cmlidXRlIG5hbWVzLCBkb24ndCBhY2NpZGVudGFsbHkgbWF0Y2ggYXR0cmlidXRlJ3MgdmFsdWVcbiAgICAvLyAoYXR0cmlidXRlIG5hbWVzIGFyZSBzdG9yZWQgYXQgZXZlbiBpbmRleGVzKVxuICAgIGlmICgobmdQcm9qZWN0QXNBdHRySWR4ICYgMSkgPT09IDApIHtcbiAgICAgIHJldHVybiBub2RlQXR0cnNbbmdQcm9qZWN0QXNBdHRySWR4ICsgMV0gYXMgc3RyaW5nO1xuICAgIH1cbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuLyoqXG4gKiBDaGVja3MgYSBnaXZlbiBub2RlIGFnYWluc3QgbWF0Y2hpbmcgc2VsZWN0b3JzIGFuZCByZXR1cm5zXG4gKiBzZWxlY3RvciBpbmRleCAob3IgMCBpZiBub25lIG1hdGNoZWQpLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gdGFrZXMgaW50byBhY2NvdW50IHRoZSBuZ1Byb2plY3RBcyBhdHRyaWJ1dGU6IGlmIHByZXNlbnQgaXRzIHZhbHVlIHdpbGwgYmUgY29tcGFyZWRcbiAqIHRvIHRoZSByYXcgKHVuLXBhcnNlZCkgQ1NTIHNlbGVjdG9yIGluc3RlYWQgb2YgdXNpbmcgc3RhbmRhcmQgc2VsZWN0b3IgbWF0Y2hpbmcgbG9naWMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBtYXRjaGluZ1NlbGVjdG9ySW5kZXgoXG4gICAgdE5vZGU6IFROb2RlLCBzZWxlY3RvcnM6IENzc1NlbGVjdG9yTGlzdFtdLCB0ZXh0U2VsZWN0b3JzOiBzdHJpbmdbXSk6IG51bWJlciB7XG4gIGNvbnN0IG5nUHJvamVjdEFzQXR0clZhbCA9IGdldFByb2plY3RBc0F0dHJWYWx1ZSh0Tm9kZSk7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgc2VsZWN0b3JzLmxlbmd0aDsgaSsrKSB7XG4gICAgLy8gaWYgYSBub2RlIGhhcyB0aGUgbmdQcm9qZWN0QXMgYXR0cmlidXRlIG1hdGNoIGl0IGFnYWluc3QgdW5wYXJzZWQgc2VsZWN0b3JcbiAgICAvLyBtYXRjaCBhIG5vZGUgYWdhaW5zdCBhIHBhcnNlZCBzZWxlY3RvciBvbmx5IGlmIG5nUHJvamVjdEFzIGF0dHJpYnV0ZSBpcyBub3QgcHJlc2VudFxuICAgIGlmIChuZ1Byb2plY3RBc0F0dHJWYWwgPT09IHRleHRTZWxlY3RvcnNbaV0gfHxcbiAgICAgICAgbmdQcm9qZWN0QXNBdHRyVmFsID09PSBudWxsICYmIGlzTm9kZU1hdGNoaW5nU2VsZWN0b3JMaXN0KHROb2RlLCBzZWxlY3RvcnNbaV0pKSB7XG4gICAgICByZXR1cm4gaSArIDE7ICAvLyBmaXJzdCBtYXRjaGluZyBzZWxlY3RvciBcImNhcHR1cmVzXCIgYSBnaXZlbiBub2RlXG4gICAgfVxuICB9XG4gIHJldHVybiAwO1xufVxuIl19