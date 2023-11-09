/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import '../util/ng_dev_mode';
import { assertDefined, assertEqual, assertNotEqual } from '../util/assert';
import { classIndexOf } from './styling/class_differ';
import { isNameOnlyAttributeMarker } from './util/attrs_utils';
const NG_TEMPLATE_SELECTOR = 'ng-template';
/**
 * Search the `TAttributes` to see if it contains `cssClassToMatch` (case insensitive)
 *
 * @param attrs `TAttributes` to search through.
 * @param cssClassToMatch class to match (lowercase)
 * @param isProjectionMode Whether or not class matching should look into the attribute `class` in
 *    addition to the `AttributeMarker.Classes`.
 */
function isCssClassMatching(attrs, cssClassToMatch, isProjectionMode) {
    // TODO(misko): The fact that this function needs to know about `isProjectionMode` seems suspect.
    // It is strange to me that sometimes the class information comes in form of `class` attribute
    // and sometimes in form of `AttributeMarker.Classes`. Some investigation is needed to determine
    // if that is the right behavior.
    ngDevMode &&
        assertEqual(cssClassToMatch, cssClassToMatch.toLowerCase(), 'Class name expected to be lowercase.');
    let i = 0;
    // Indicates whether we are processing value from the implicit
    // attribute section (i.e. before the first marker in the array).
    let isImplicitAttrsSection = true;
    while (i < attrs.length) {
        let item = attrs[i++];
        if (typeof item === 'string' && isImplicitAttrsSection) {
            const value = attrs[i++];
            if (isProjectionMode && item === 'class') {
                // We found a `class` attribute in the implicit attribute section,
                // check if it matches the value of the `cssClassToMatch` argument.
                if (classIndexOf(value.toLowerCase(), cssClassToMatch, 0) !== -1) {
                    return true;
                }
            }
        }
        else if (item === 1 /* AttributeMarker.Classes */) {
            // We found the classes section. Start searching for the class.
            while (i < attrs.length && typeof (item = attrs[i++]) == 'string') {
                // while we have strings
                if (item.toLowerCase() === cssClassToMatch)
                    return true;
            }
            return false;
        }
        else if (typeof item === 'number') {
            // We've came across a first marker, which indicates
            // that the implicit attribute section is over.
            isImplicitAttrsSection = false;
        }
    }
    return false;
}
/**
 * Checks whether the `tNode` represents an inline template (e.g. `*ngFor`).
 *
 * @param tNode current TNode
 */
export function isInlineTemplate(tNode) {
    return tNode.type === 4 /* TNodeType.Container */ && tNode.value !== NG_TEMPLATE_SELECTOR;
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
    const tagNameToCompare = tNode.type === 4 /* TNodeType.Container */ && !isProjectionMode ? NG_TEMPLATE_SELECTOR : tNode.value;
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
    let mode = 4 /* SelectorFlags.ELEMENT */;
    const nodeAttrs = tNode.attrs || [];
    // Find the index of first attribute that has no value, only a name.
    const nameOnlyMarkerIdx = getNameOnlyMarkerIndex(nodeAttrs);
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
            mode = current | (mode & 1 /* SelectorFlags.NOT */);
            continue;
        }
        if (skipToNextSelector)
            continue;
        if (mode & 4 /* SelectorFlags.ELEMENT */) {
            mode = 2 /* SelectorFlags.ATTRIBUTE */ | mode & 1 /* SelectorFlags.NOT */;
            if (current !== '' && !hasTagAndTypeMatch(tNode, current, isProjectionMode) ||
                current === '' && selector.length === 1) {
                if (isPositive(mode))
                    return false;
                skipToNextSelector = true;
            }
        }
        else {
            const selectorAttrValue = mode & 8 /* SelectorFlags.CLASS */ ? current : selector[++i];
            // special case for matching against classes when a tNode has been instantiated with
            // class and style values as separate attribute values (e.g. ['title', CLASS, 'foo'])
            if ((mode & 8 /* SelectorFlags.CLASS */) && tNode.attrs !== null) {
                if (!isCssClassMatching(tNode.attrs, selectorAttrValue, isProjectionMode)) {
                    if (isPositive(mode))
                        return false;
                    skipToNextSelector = true;
                }
                continue;
            }
            const attrName = (mode & 8 /* SelectorFlags.CLASS */) ? 'class' : current;
            const attrIndexInNode = findAttrIndexInNode(attrName, nodeAttrs, isInlineTemplate(tNode), isProjectionMode);
            if (attrIndexInNode === -1) {
                if (isPositive(mode))
                    return false;
                skipToNextSelector = true;
                continue;
            }
            if (selectorAttrValue !== '') {
                let nodeAttrValue;
                if (attrIndexInNode > nameOnlyMarkerIdx) {
                    nodeAttrValue = '';
                }
                else {
                    ngDevMode &&
                        assertNotEqual(nodeAttrs[attrIndexInNode], 0 /* AttributeMarker.NamespaceURI */, 'We do not match directives on namespaced attributes');
                    // we lowercase the attribute value to be able to match
                    // selectors without case-sensitivity
                    // (selectors are already in lowercase when generated)
                    nodeAttrValue = nodeAttrs[attrIndexInNode + 1].toLowerCase();
                }
                const compareAgainstClassName = mode & 8 /* SelectorFlags.CLASS */ ? nodeAttrValue : null;
                if (compareAgainstClassName &&
                    classIndexOf(compareAgainstClassName, selectorAttrValue, 0) !== -1 ||
                    mode & 2 /* SelectorFlags.ATTRIBUTE */ && selectorAttrValue !== nodeAttrValue) {
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
    return (mode & 1 /* SelectorFlags.NOT */) === 0;
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
 * ===========================================================================================================
 * Modes                   | Normal Attributes | Bindings Attributes | Template Attributes | I18n
 * Attributes
 * ===========================================================================================================
 * Inline + Projection     | YES               | YES                 | NO                  | YES
 * -----------------------------------------------------------------------------------------------------------
 * Inline + Directive      | NO                | NO                  | YES                 | NO
 * -----------------------------------------------------------------------------------------------------------
 * Non-inline + Projection | YES               | YES                 | NO                  | YES
 * -----------------------------------------------------------------------------------------------------------
 * Non-inline + Directive  | YES               | YES                 | NO                  | YES
 * ===========================================================================================================
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
    let i = 0;
    if (isProjectionMode || !isInlineTemplate) {
        let bindingsMode = false;
        while (i < attrs.length) {
            const maybeAttrName = attrs[i];
            if (maybeAttrName === name) {
                return i;
            }
            else if (maybeAttrName === 3 /* AttributeMarker.Bindings */ || maybeAttrName === 6 /* AttributeMarker.I18n */) {
                bindingsMode = true;
            }
            else if (maybeAttrName === 1 /* AttributeMarker.Classes */ || maybeAttrName === 2 /* AttributeMarker.Styles */) {
                let value = attrs[++i];
                // We should skip classes here because we have a separate mechanism for
                // matching classes in projection mode.
                while (typeof value === 'string') {
                    value = attrs[++i];
                }
                continue;
            }
            else if (maybeAttrName === 4 /* AttributeMarker.Template */) {
                // We do not care about Template attributes in this scenario.
                break;
            }
            else if (maybeAttrName === 0 /* AttributeMarker.NamespaceURI */) {
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
export function isNodeMatchingSelectorList(tNode, selector, isProjectionMode = false) {
    for (let i = 0; i < selector.length; i++) {
        if (isNodeMatchingSelector(tNode, selector[i], isProjectionMode)) {
            return true;
        }
    }
    return false;
}
export function getProjectAsAttrValue(tNode) {
    const nodeAttrs = tNode.attrs;
    if (nodeAttrs != null) {
        const ngProjectAsAttrIdx = nodeAttrs.indexOf(5 /* AttributeMarker.ProjectAs */);
        // only check for ngProjectAs in attribute names, don't accidentally match attribute's value
        // (attribute names are stored at even indexes)
        if ((ngProjectAsAttrIdx & 1) === 0) {
            return nodeAttrs[ngProjectAsAttrIdx + 1];
        }
    }
    return null;
}
function getNameOnlyMarkerIndex(nodeAttrs) {
    for (let i = 0; i < nodeAttrs.length; i++) {
        const nodeAttr = nodeAttrs[i];
        if (isNameOnlyAttributeMarker(nodeAttr)) {
            return i;
        }
    }
    return nodeAttrs.length;
}
function matchTemplateAttribute(attrs, name) {
    let i = attrs.indexOf(4 /* AttributeMarker.Template */);
    if (i > -1) {
        i++;
        while (i < attrs.length) {
            const attr = attrs[i];
            // Return in case we checked all template attrs and are switching to the next section in the
            // attrs array (that starts with a number that represents an attribute marker).
            if (typeof attr === 'number')
                return -1;
            if (attr === name)
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
export function isSelectorInSelectorList(selector, list) {
    selectorListLoop: for (let i = 0; i < list.length; i++) {
        const currentSelectorInList = list[i];
        if (selector.length !== currentSelectorInList.length) {
            continue;
        }
        for (let j = 0; j < selector.length; j++) {
            if (selector[j] !== currentSelectorInList[j]) {
                continue selectorListLoop;
            }
        }
        return true;
    }
    return false;
}
function maybeWrapInNotSelector(isNegativeMode, chunk) {
    return isNegativeMode ? ':not(' + chunk.trim() + ')' : chunk;
}
function stringifyCSSSelector(selector) {
    let result = selector[0];
    let i = 1;
    let mode = 2 /* SelectorFlags.ATTRIBUTE */;
    let currentChunk = '';
    let isNegativeMode = false;
    while (i < selector.length) {
        let valueOrMarker = selector[i];
        if (typeof valueOrMarker === 'string') {
            if (mode & 2 /* SelectorFlags.ATTRIBUTE */) {
                const attrValue = selector[++i];
                currentChunk +=
                    '[' + valueOrMarker + (attrValue.length > 0 ? '="' + attrValue + '"' : '') + ']';
            }
            else if (mode & 8 /* SelectorFlags.CLASS */) {
                currentChunk += '.' + valueOrMarker;
            }
            else if (mode & 4 /* SelectorFlags.ELEMENT */) {
                currentChunk += ' ' + valueOrMarker;
            }
        }
        else {
            //
            // Append current chunk to the final result in case we come across SelectorFlag, which
            // indicates that the previous section of a selector is over. We need to accumulate content
            // between flags to make sure we wrap the chunk later in :not() selector if needed, e.g.
            // ```
            //  ['', Flags.CLASS, '.classA', Flags.CLASS | Flags.NOT, '.classB', '.classC']
            // ```
            // should be transformed to `.classA :not(.classB .classC)`.
            //
            // Note: for negative selector part, we accumulate content between flags until we find the
            // next negative flag. This is needed to support a case where `:not()` rule contains more than
            // one chunk, e.g. the following selector:
            // ```
            //  ['', Flags.ELEMENT | Flags.NOT, 'p', Flags.CLASS, 'foo', Flags.CLASS | Flags.NOT, 'bar']
            // ```
            // should be stringified to `:not(p.foo) :not(.bar)`
            //
            if (currentChunk !== '' && !isPositive(valueOrMarker)) {
                result += maybeWrapInNotSelector(isNegativeMode, currentChunk);
                currentChunk = '';
            }
            mode = valueOrMarker;
            // According to CssSelector spec, once we come across `SelectorFlags.NOT` flag, the negative
            // mode is maintained for remaining chunks of a selector.
            isNegativeMode = isNegativeMode || !isPositive(mode);
        }
        i++;
    }
    if (currentChunk !== '') {
        result += maybeWrapInNotSelector(isNegativeMode, currentChunk);
    }
    return result;
}
/**
 * Generates string representation of CSS selector in parsed form.
 *
 * ComponentDef and DirectiveDef are generated with the selector in parsed form to avoid doing
 * additional parsing at runtime (for example, for directive matching). However in some cases (for
 * example, while bootstrapping a component), a string version of the selector is required to query
 * for the host element on the page. This function takes the parsed form of a selector and returns
 * its string representation.
 *
 * @param selectorList selector in parsed form
 * @returns string representation of a given selector
 */
export function stringifyCSSSelectorList(selectorList) {
    return selectorList.map(stringifyCSSSelector).join(',');
}
/**
 * Extracts attributes and classes information from a given CSS selector.
 *
 * This function is used while creating a component dynamically. In this case, the host element
 * (that is created dynamically) should contain attributes and classes specified in component's CSS
 * selector.
 *
 * @param selector CSS selector in parsed form (in a form of array)
 * @returns object with `attrs` and `classes` fields that contain extracted information
 */
export function extractAttrsAndClassesFromSelector(selector) {
    const attrs = [];
    const classes = [];
    let i = 1;
    let mode = 2 /* SelectorFlags.ATTRIBUTE */;
    while (i < selector.length) {
        let valueOrMarker = selector[i];
        if (typeof valueOrMarker === 'string') {
            if (mode === 2 /* SelectorFlags.ATTRIBUTE */) {
                if (valueOrMarker !== '') {
                    attrs.push(valueOrMarker, selector[++i]);
                }
            }
            else if (mode === 8 /* SelectorFlags.CLASS */) {
                classes.push(valueOrMarker);
            }
        }
        else {
            // According to CssSelector spec, once we come across `SelectorFlags.NOT` flag, the negative
            // mode is maintained for remaining chunks of a selector. Since attributes and classes are
            // extracted only for "positive" part of the selector, we can stop here.
            if (!isPositive(mode))
                break;
            mode = valueOrMarker;
        }
        i++;
    }
    return { attrs, classes };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9kZV9zZWxlY3Rvcl9tYXRjaGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9ub2RlX3NlbGVjdG9yX21hdGNoZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxxQkFBcUIsQ0FBQztBQUU3QixPQUFPLEVBQUMsYUFBYSxFQUFFLFdBQVcsRUFBRSxjQUFjLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUkxRSxPQUFPLEVBQUMsWUFBWSxFQUFDLE1BQU0sd0JBQXdCLENBQUM7QUFDcEQsT0FBTyxFQUFDLHlCQUF5QixFQUFDLE1BQU0sb0JBQW9CLENBQUM7QUFFN0QsTUFBTSxvQkFBb0IsR0FBRyxhQUFhLENBQUM7QUFFM0M7Ozs7Ozs7R0FPRztBQUNILFNBQVMsa0JBQWtCLENBQ3ZCLEtBQWtCLEVBQUUsZUFBdUIsRUFBRSxnQkFBeUI7SUFDeEUsaUdBQWlHO0lBQ2pHLDhGQUE4RjtJQUM5RixnR0FBZ0c7SUFDaEcsaUNBQWlDO0lBQ2pDLFNBQVM7UUFDTCxXQUFXLENBQ1AsZUFBZSxFQUFFLGVBQWUsQ0FBQyxXQUFXLEVBQUUsRUFBRSxzQ0FBc0MsQ0FBQyxDQUFDO0lBQ2hHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUNWLDhEQUE4RDtJQUM5RCxpRUFBaUU7SUFDakUsSUFBSSxzQkFBc0IsR0FBRyxJQUFJLENBQUM7SUFDbEMsT0FBTyxDQUFDLEdBQUcsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBQ3hCLElBQUksSUFBSSxHQUFHLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQ3RCLElBQUksT0FBTyxJQUFJLEtBQUssUUFBUSxJQUFJLHNCQUFzQixFQUFFLENBQUM7WUFDdkQsTUFBTSxLQUFLLEdBQUcsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFXLENBQUM7WUFDbkMsSUFBSSxnQkFBZ0Is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QUFDO2FBQU0sQ0FBQztZQUNOLDRGQUE0RjtZQUM1RiwwRkFBMEY7WUFDMUYsd0VBQXdFO1lBQ3hFLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDO2dCQUFFLE1BQU07WUFDN0IsSUFBSSxHQUFHLGFBQWEsQ0FBQztRQUN2QixDQUFDO1FBQ0QsQ0FBQyxFQUFFLENBQUM7SUFDTixDQUFDO0lBQ0QsT0FBTyxFQUFDLEtBQUssRUFBRSxPQUFPLEVBQUMsQ0FBQztBQUMxQixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCAnLi4vdXRpbC9uZ19kZXZfbW9kZSc7XG5cbmltcG9ydCB7YXNzZXJ0RGVmaW5lZCwgYXNzZXJ0RXF1YWwsIGFzc2VydE5vdEVxdWFsfSBmcm9tICcuLi91dGlsL2Fzc2VydCc7XG5cbmltcG9ydCB7QXR0cmlidXRlTWFya2VyLCBUQXR0cmlidXRlcywgVE5vZGUsIFROb2RlVHlwZX0gZnJvbSAnLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtDc3NTZWxlY3RvciwgQ3NzU2VsZWN0b3JMaXN0LCBTZWxlY3RvckZsYWdzfSBmcm9tICcuL2ludGVyZmFjZXMvcHJvamVjdGlvbic7XG5pbXBvcnQge2NsYXNzSW5kZXhPZn0gZnJvbSAnLi9zdHlsaW5nL2NsYXNzX2RpZmZlcic7XG5pbXBvcnQge2lzTmFtZU9ubHlBdHRyaWJ1dGVNYXJrZXJ9IGZyb20gJy4vdXRpbC9hdHRyc191dGlscyc7XG5cbmNvbnN0IE5HX1RFTVBMQVRFX1NFTEVDVE9SID0gJ25nLXRlbXBsYXRlJztcblxuLyoqXG4gKiBTZWFyY2ggdGhlIGBUQXR0cmlidXRlc2AgdG8gc2VlIGlmIGl0IGNvbnRhaW5zIGBjc3NDbGFzc1RvTWF0Y2hgIChjYXNlIGluc2Vuc2l0aXZlKVxuICpcbiAqIEBwYXJhbSBhdHRycyBgVEF0dHJpYnV0ZXNgIHRvIHNlYXJjaCB0aHJvdWdoLlxuICogQHBhcmFtIGNzc0NsYXNzVG9NYXRjaCBjbGFzcyB0byBtYXRjaCAobG93ZXJjYXNlKVxuICogQHBhcmFtIGlzUHJvamVjdGlvbk1vZGUgV2hldGhlciBvciBub3QgY2xhc3MgbWF0Y2hpbmcgc2hvdWxkIGxvb2sgaW50byB0aGUgYXR0cmlidXRlIGBjbGFzc2AgaW5cbiAqICAgIGFkZGl0aW9uIHRvIHRoZSBgQXR0cmlidXRlTWFya2VyLkNsYXNzZXNgLlxuICovXG5mdW5jdGlvbiBpc0Nzc0NsYXNzTWF0Y2hpbmcoXG4gICAgYXR0cnM6IFRBdHRyaWJ1dGVzLCBjc3NDbGFzc1RvTWF0Y2g6IHN0cmluZywgaXNQcm9qZWN0aW9uTW9kZTogYm9vbGVhbik6IGJvb2xlYW4ge1xuICAvLyBUT0RPKG1pc2tvKTogVGhlIGZhY3QgdGhhdCB0aGlzIGZ1bmN0aW9uIG5lZWRzIHRvIGtub3cgYWJvdXQgYGlzUHJvamVjdGlvbk1vZGVgIHNlZW1zIHN1c3BlY3QuXG4gIC8vIEl0IGlzIHN0cmFuZ2UgdG8gbWUgdGhhdCBzb21ldGltZXMgdGhlIGNsYXNzIGluZm9ybWF0aW9uIGNvbWVzIGluIGZvcm0gb2YgYGNsYXNzYCBhdHRyaWJ1dGVcbiAgLy8gYW5kIHNvbWV0aW1lcyBpbiBmb3JtIG9mIGBBdHRyaWJ1dGVNYXJrZXIuQ2xhc3Nlc2AuIFNvbWUgaW52ZXN0aWdhdGlvbiBpcyBuZWVkZWQgdG8gZGV0ZXJtaW5lXG4gIC8vIGlmIHRoYXQgaXMgdGhlIHJpZ2h0IGJlaGF2aW9yLlxuICBuZ0Rldk1vZGUgJiZcbiAgICAgIGFzc2VydEVxdWFsKFxuICAgICAgICAgIGNzc0NsYXNzVG9NYXRjaCwgY3NzQ2xhc3NUb01hdGNoLnRvTG93ZXJDYXNlKCksICdDbGFzcyBuYW1lIGV4cGVjdGVkIHRvIGJlIGxvd2VyY2FzZS4nKTtcbiAgbGV0IGkgPSAwO1xuICAvLyBJbmRpY2F0ZXMgd2hldGhlciB3ZSBhcmUgcHJvY2Vzc2luZyB2YWx1ZSBmcm9tIHRoZSBpbXBsaWNpdFxuICAvLyBhdHRyaWJ1dGUgc2VjdGlvbiAoaS5lLiBiZWZvcmUgdGhlIGZpcnN0IG1hcmtlciBpbiB0aGUgYXJyYXkpLlxuICBsZXQgaXNJbXBsaWNpdEF0dHJzU2VjdGlvbiA9IHRydWU7XG4gIHdoaWxlIChpIDwgYXR0cnMubGVuZ3RoKSB7XG4gICAgbGV0IGl0ZW0gPSBhdHRyc1tpKytdO1xuICAgIGlmICh0eXBlb2YgaXRlbSA9PT0gJ3N0cmluZycgJiYgaXNJbXBsaWNpdEF0dHJzU2VjdGlvbikge1xuICAgICAgY29uc3QgdmFsdWUgPSBhdHRyc1tpKytdIGFzIHN0cmluZztcbiAgICAgIGlmIChpc1Byb2plY3Rpb25Nb2RlICYmIGl0ZW0gPT09ICdjbGFzcycpIHtcbiAgICAgICAgLy8gV2UgZm91bmQgYSBgY2xhc3NgIGF0dHJpYnV0ZSBpbiB0aGUgaW1wbGljaXQgYXR0cmlidXRlIHNlY3Rpb24sXG4gICAgICAgIC8vIGNoZWNrIGlmIGl0IG1hdGNoZXMgdGhlIHZhbHVlIG9mIHRoZSBgY3NzQ2xhc3NUb01hdGNoYCBhcmd1bWVudC5cbiAgICAgICAgaWYgKGNsYXNzSW5kZXhPZih2YWx1ZS50b0xvd2VyQ2FzZSgpLCBjc3NDbGFzc1RvTWF0Y2gsIDApICE9PSAtMSkge1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChpdGVtID09PSBBdHRyaWJ1dGVNYXJrZXIuQ2xhc3Nlcykge1xuICAgICAgLy8gV2UgZm91bmQgdGhlIGNsYXNzZXMgc2VjdGlvbi4gU3RhcnQgc2VhcmNoaW5nIGZvciB0aGUgY2xhc3MuXG4gICAgICB3aGlsZSAoaSA8IGF0dHJzLmxlbmd0aCAmJiB0eXBlb2YgKGl0ZW0gPSBhdHRyc1tpKytdKSA9PSAnc3RyaW5nJykge1xuICAgICAgICAvLyB3aGlsZSB3ZSBoYXZlIHN0cmluZ3NcbiAgICAgICAgaWYgKGl0ZW0udG9Mb3dlckNhc2UoKSA9PT0gY3NzQ2xhc3NUb01hdGNoKSByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBpdGVtID09PSAnbnVtYmVyJykge1xuICAgICAgLy8gV2UndmUgY2FtZSBhY3Jvc3MgYSBmaXJzdCBtYXJrZXIsIHdoaWNoIGluZGljYXRlc1xuICAgICAgLy8gdGhhdCB0aGUgaW1wbGljaXQgYXR0cmlidXRlIHNlY3Rpb24gaXMgb3Zlci5cbiAgICAgIGlzSW1wbGljaXRBdHRyc1NlY3Rpb24gPSBmYWxzZTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG4vKipcbiAqIENoZWNrcyB3aGV0aGVyIHRoZSBgdE5vZGVgIHJlcHJlc2VudHMgYW4gaW5saW5lIHRlbXBsYXRlIChlLmcuIGAqbmdGb3JgKS5cbiAqXG4gKiBAcGFyYW0gdE5vZGUgY3VycmVudCBUTm9kZVxuICovXG5leHBvcnQgZnVuY3Rpb24gaXNJbmxpbmVUZW1wbGF0ZSh0Tm9kZTogVE5vZGUpOiBib29sZWFuIHtcbiAgcmV0dXJuIHROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5Db250YWluZXIgJiYgdE5vZGUudmFsdWUgIT09IE5HX1RFTVBMQVRFX1NFTEVDVE9SO1xufVxuXG4vKipcbiAqIEZ1bmN0aW9uIHRoYXQgY2hlY2tzIHdoZXRoZXIgYSBnaXZlbiB0Tm9kZSBtYXRjaGVzIHRhZy1iYXNlZCBzZWxlY3RvciBhbmQgaGFzIGEgdmFsaWQgdHlwZS5cbiAqXG4gKiBNYXRjaGluZyBjYW4gYmUgcGVyZm9ybWVkIGluIDIgbW9kZXM6IHByb2plY3Rpb24gbW9kZSAod2hlbiB3ZSBwcm9qZWN0IG5vZGVzKSBhbmQgcmVndWxhclxuICogZGlyZWN0aXZlIG1hdGNoaW5nIG1vZGU6XG4gKiAtIGluIHRoZSBcImRpcmVjdGl2ZSBtYXRjaGluZ1wiIG1vZGUgd2UgZG8gX25vdF8gdGFrZSBUQ29udGFpbmVyJ3MgdGFnTmFtZSBpbnRvIGFjY291bnQgaWYgaXQgaXNcbiAqIGRpZmZlcmVudCBmcm9tIE5HX1RFTVBMQVRFX1NFTEVDVE9SICh2YWx1ZSBkaWZmZXJlbnQgZnJvbSBOR19URU1QTEFURV9TRUxFQ1RPUiBpbmRpY2F0ZXMgdGhhdCBhXG4gKiB0YWcgbmFtZSB3YXMgZXh0cmFjdGVkIGZyb20gKiBzeW50YXggc28gd2Ugd291bGQgbWF0Y2ggdGhlIHNhbWUgZGlyZWN0aXZlIHR3aWNlKTtcbiAqIC0gaW4gdGhlIFwicHJvamVjdGlvblwiIG1vZGUsIHdlIHVzZSBhIHRhZyBuYW1lIHBvdGVudGlhbGx5IGV4dHJhY3RlZCBmcm9tIHRoZSAqIHN5bnRheCBwcm9jZXNzaW5nXG4gKiAoYXBwbGljYWJsZSB0byBUTm9kZVR5cGUuQ29udGFpbmVyIG9ubHkpLlxuICovXG5mdW5jdGlvbiBoYXNUYWdBbmRUeXBlTWF0Y2goXG4gICAgdE5vZGU6IFROb2RlLCBjdXJyZW50U2VsZWN0b3I6IHN0cmluZywgaXNQcm9qZWN0aW9uTW9kZTogYm9vbGVhbik6IGJvb2xlYW4ge1xuICBjb25zdCB0YWdOYW1lVG9Db21wYXJlID1cbiAgICAgIHROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5Db250YWluZXIgJiYgIWlzUHJvamVjdGlvbk1vZGUgPyBOR19URU1QTEFURV9TRUxFQ1RPUiA6IHROb2RlLnZhbHVlO1xuICByZXR1cm4gY3VycmVudFNlbGVjdG9yID09PSB0YWdOYW1lVG9Db21wYXJlO1xufVxuXG4vKipcbiAqIEEgdXRpbGl0eSBmdW5jdGlvbiB0byBtYXRjaCBhbiBJdnkgbm9kZSBzdGF0aWMgZGF0YSBhZ2FpbnN0IGEgc2ltcGxlIENTUyBzZWxlY3RvclxuICpcbiAqIEBwYXJhbSBub2RlIHN0YXRpYyBkYXRhIG9mIHRoZSBub2RlIHRvIG1hdGNoXG4gKiBAcGFyYW0gc2VsZWN0b3IgVGhlIHNlbGVjdG9yIHRvIHRyeSBtYXRjaGluZyBhZ2FpbnN0IHRoZSBub2RlLlxuICogQHBhcmFtIGlzUHJvamVjdGlvbk1vZGUgaWYgYHRydWVgIHdlIGFyZSBtYXRjaGluZyBmb3IgY29udGVudCBwcm9qZWN0aW9uLCBvdGhlcndpc2Ugd2UgYXJlIGRvaW5nXG4gKiBkaXJlY3RpdmUgbWF0Y2hpbmcuXG4gKiBAcmV0dXJucyB0cnVlIGlmIG5vZGUgbWF0Y2hlcyB0aGUgc2VsZWN0b3IuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc05vZGVNYXRjaGluZ1NlbGVjdG9yKFxuICAgIHROb2RlOiBUTm9kZSwgc2VsZWN0b3I6IENzc1NlbGVjdG9yLCBpc1Byb2plY3Rpb25Nb2RlOiBib29sZWFuKTogYm9vbGVhbiB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKHNlbGVjdG9yWzBdLCAnU2VsZWN0b3Igc2hvdWxkIGhhdmUgYSB0YWcgbmFtZScpO1xuICBsZXQgbW9kZTogU2VsZWN0b3JGbGFncyA9IFNlbGVjdG9yRmxhZ3MuRUxFTUVOVDtcbiAgY29uc3Qgbm9kZUF0dHJzID0gdE5vZGUuYXR0cnMgfHwgW107XG5cbiAgLy8gRmluZCB0aGUgaW5kZXggb2YgZmlyc3QgYXR0cmlidXRlIHRoYXQgaGFzIG5vIHZhbHVlLCBvbmx5IGEgbmFtZS5cbiAgY29uc3QgbmFtZU9ubHlNYXJrZXJJZHggPSBnZXROYW1lT25seU1hcmtlckluZGV4KG5vZGVBdHRycyk7XG5cbiAgLy8gV2hlbiBwcm9jZXNzaW5nIFwiOm5vdFwiIHNlbGVjdG9ycywgd2Ugc2tpcCB0byB0aGUgbmV4dCBcIjpub3RcIiBpZiB0aGVcbiAgLy8gY3VycmVudCBvbmUgZG9lc24ndCBtYXRjaFxuICBsZXQgc2tpcFRvTmV4dFNlbGVjdG9yID0gZmFsc2U7XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBzZWxlY3Rvci5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IGN1cnJlbnQgPSBzZWxlY3RvcltpXTtcbiAgICBpZiAodHlwZW9mIGN1cnJlbnQgPT09ICdudW1iZXInKSB7XG4gICAgICAvLyBJZiB3ZSBmaW5pc2ggcHJvY2Vzc2luZyBhIDpub3Qgc2VsZWN0b3IgYW5kIGl0IGhhc24ndCBmYWlsZWQsIHJldHVybiBmYWxzZVxuICAgICAgaWYgKCFza2lwVG9OZXh0U2VsZWN0b3IgJiYgIWlzUG9zaXRpdmUobW9kZSkgJiYgIWlzUG9zaXRpdmUoY3VycmVudCkpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgLy8gSWYgd2UgYXJlIHNraXBwaW5nIHRvIHRoZSBuZXh0IDpub3QoKSBhbmQgdGhpcyBtb2RlIGZsYWcgaXMgcG9zaXRpdmUsXG4gICAgICAvLyBpdCdzIGEgcGFydCBvZiB0aGUgY3VycmVudCA6bm90KCkgc2VsZWN0b3IsIGFuZCB3ZSBzaG91bGQga2VlcCBza2lwcGluZ1xuICAgICAgaWYgKHNraXBUb05leHRTZWxlY3RvciAmJiBpc1Bvc2l0aXZlKGN1cnJlbnQpKSBjb250aW51ZTtcbiAgICAgIHNraXBUb05leHRTZWxlY3RvciA9IGZhbHNlO1xuICAgICAgbW9kZSA9IChjdXJyZW50IGFzIG51bWJlcikgfCAobW9kZSAmIFNlbGVjdG9yRmxhZ3MuTk9UKTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmIChza2lwVG9OZXh0U2VsZWN0b3IpIGNvbnRpbnVlO1xuXG4gICAgaWYgKG1vZGUgJiBTZWxlY3RvckZsYWdzLkVMRU1FTlQpIHtcbiAgICAgIG1vZGUgPSBTZWxlY3RvckZsYWdzLkFUVFJJQlVURSB8IG1vZGUgJiBTZWxlY3RvckZsYWdzLk5PVDtcbiAgICAgIGlmIChjdXJyZW50ICE9PSAnJyAmJiAhaGFzVGFnQW5kVHlwZU1hdGNoKHROb2RlLCBjdXJyZW50LCBpc1Byb2plY3Rpb25Nb2RlKSB8fFxuICAgICAgICAgIGN1cnJlbnQgPT09ICcnICYmIHNlbGVjdG9yLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICBpZiAoaXNQb3NpdGl2ZShtb2RlKSkgcmV0dXJuIGZhbHNlO1xuICAgICAgICBza2lwVG9OZXh0U2VsZWN0b3IgPSB0cnVlO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBzZWxlY3RvckF0dHJWYWx1ZSA9IG1vZGUgJiBTZWxlY3RvckZsYWdzLkNMQVNTID8gY3VycmVudCA6IHNlbGVjdG9yWysraV07XG5cbiAgICAgIC8vIHNwZWNpYWwgY2FzZSBmb3IgbWF0Y2hpbmcgYWdhaW5zdCBjbGFzc2VzIHdoZW4gYSB0Tm9kZSBoYXMgYmVlbiBpbnN0YW50aWF0ZWQgd2l0aFxuICAgICAgLy8gY2xhc3MgYW5kIHN0eWxlIHZhbHVlcyBhcyBzZXBhcmF0ZSBhdHRyaWJ1dGUgdmFsdWVzIChlLmcuIFsndGl0bGUnLCBDTEFTUywgJ2ZvbyddKVxuICAgICAgaWYgKChtb2RlICYgU2VsZWN0b3JGbGFncy5DTEFTUykgJiYgdE5vZGUuYXR0cnMgIT09IG51bGwpIHtcbiAgICAgICAgaWYgKCFpc0Nzc0NsYXNzTWF0Y2hpbmcodE5vZGUuYXR0cnMsIHNlbGVjdG9yQXR0clZhbHVlIGFzIHN0cmluZywgaXNQcm9qZWN0aW9uTW9kZSkpIHtcbiAgICAgICAgICBpZiAoaXNQb3NpdGl2ZShtb2RlKSkgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgIHNraXBUb05leHRTZWxlY3RvciA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGF0dHJOYW1lID0gKG1vZGUgJiBTZWxlY3RvckZsYWdzLkNMQVNTKSA/ICdjbGFzcycgOiBjdXJyZW50O1xuICAgICAgY29uc3QgYXR0ckluZGV4SW5Ob2RlID1cbiAgICAgICAgICBmaW5kQXR0ckluZGV4SW5Ob2RlKGF0dHJOYW1lLCBub2RlQXR0cnMsIGlzSW5saW5lVGVtcGxhdGUodE5vZGUpLCBpc1Byb2plY3Rpb25Nb2RlKTtcblxuICAgICAgaWYgKGF0dHJJbmRleEluTm9kZSA9PT0gLTEpIHtcbiAgICAgICAgaWYgKGlzUG9zaXRpdmUobW9kZSkpIHJldHVybiBmYWxzZTtcbiAgICAgICAgc2tpcFRvTmV4dFNlbGVjdG9yID0gdHJ1ZTtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGlmIChzZWxlY3RvckF0dHJWYWx1ZSAhPT0gJycpIHtcbiAgICAgICAgbGV0IG5vZGVBdHRyVmFsdWU6IHN0cmluZztcbiAgICAgICAgaWYgKGF0dHJJbmRleEluTm9kZSA+IG5hbWVPbmx5TWFya2VySWR4KSB7XG4gICAgICAgICAgbm9kZUF0dHJWYWx1ZSA9ICcnO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG5nRGV2TW9kZSAmJlxuICAgICAgICAgICAgICBhc3NlcnROb3RFcXVhbChcbiAgICAgICAgICAgICAgICAgIG5vZGVBdHRyc1thdHRySW5kZXhJbk5vZGVdLCBBdHRyaWJ1dGVNYXJrZXIuTmFtZXNwYWNlVVJJLFxuICAgICAgICAgICAgICAgICAgJ1dlIGRvIG5vdCBtYXRjaCBkaXJlY3RpdmVzIG9uIG5hbWVzcGFjZWQgYXR0cmlidXRlcycpO1xuICAgICAgICAgIC8vIHdlIGxvd2VyY2FzZSB0aGUgYXR0cmlidXRlIHZhbHVlIHRvIGJlIGFibGUgdG8gbWF0Y2hcbiAgICAgICAgICAvLyBzZWxlY3RvcnMgd2l0aG91dCBjYXNlLXNlbnNpdGl2aXR5XG4gICAgICAgICAgLy8gKHNlbGVjdG9ycyBhcmUgYWxyZWFkeSBpbiBsb3dlcmNhc2Ugd2hlbiBnZW5lcmF0ZWQpXG4gICAgICAgICAgbm9kZUF0dHJWYWx1ZSA9IChub2RlQXR0cnNbYXR0ckluZGV4SW5Ob2RlICsgMV0gYXMgc3RyaW5nKS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgY29tcGFyZUFnYWluc3RDbGFzc05hbWUgPSBtb2RlICYgU2VsZWN0b3JGbGFncy5DTEFTUyA/IG5vZGVBdHRyVmFsdWUgOiBudWxsO1xuICAgICAgICBpZiAoY29tcGFyZUFnYWluc3RDbGFzc05hbWUgJiZcbiAgICAgICAgICAgICAgICBjbGFzc0luZGV4T2YoY29tcGFyZUFnYWluc3RDbGFzc05hbWUsIHNlbGVjdG9yQXR0clZhbHVlIGFzIHN0cmluZywgMCkgIT09IC0xIHx8XG4gICAgICAgICAgICBtb2RlICYgU2VsZWN0b3JGbGFncy5BVFRSSUJVVEUgJiYgc2VsZWN0b3JBdHRyVmFsdWUgIT09IG5vZGVBdHRyVmFsdWUpIHtcbiAgICAgICAgICBpZiAoaXNQb3NpdGl2ZShtb2RlKSkgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgIHNraXBUb05leHRTZWxlY3RvciA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gaXNQb3NpdGl2ZShtb2RlKSB8fCBza2lwVG9OZXh0U2VsZWN0b3I7XG59XG5cbmZ1bmN0aW9uIGlzUG9zaXRpdmUobW9kZTogU2VsZWN0b3JGbGFncyk6IGJvb2xlYW4ge1xuICByZXR1cm4gKG1vZGUgJiBTZWxlY3RvckZsYWdzLk5PVCkgPT09IDA7XG59XG5cbi8qKlxuICogRXhhbWluZXMgdGhlIGF0dHJpYnV0ZSdzIGRlZmluaXRpb24gYXJyYXkgZm9yIGEgbm9kZSB0byBmaW5kIHRoZSBpbmRleCBvZiB0aGVcbiAqIGF0dHJpYnV0ZSB0aGF0IG1hdGNoZXMgdGhlIGdpdmVuIGBuYW1lYC5cbiAqXG4gKiBOT1RFOiBUaGlzIHdpbGwgbm90IG1hdGNoIG5hbWVzcGFjZWQgYXR0cmlidXRlcy5cbiAqXG4gKiBBdHRyaWJ1dGUgbWF0Y2hpbmcgZGVwZW5kcyB1cG9uIGBpc0lubGluZVRlbXBsYXRlYCBhbmQgYGlzUHJvamVjdGlvbk1vZGVgLlxuICogVGhlIGZvbGxvd2luZyB0YWJsZSBzdW1tYXJpemVzIHdoaWNoIHR5cGVzIG9mIGF0dHJpYnV0ZXMgd2UgYXR0ZW1wdCB0byBtYXRjaDpcbiAqXG4gKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICogTW9kZXMgICAgICAgICAgICAgICAgICAgfCBOb3JtYWwgQXR0cmlidXRlcyB8IEJpbmRpbmdzIEF0dHJpYnV0ZXMgfCBUZW1wbGF0ZSBBdHRyaWJ1dGVzIHwgSTE4blxuICogQXR0cmlidXRlc1xuICogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAqIElubGluZSArIFByb2plY3Rpb24gICAgIHwgWUVTICAgICAgICAgICAgICAgfCBZRVMgICAgICAgICAgICAgICAgIHwgTk8gICAgICAgICAgICAgICAgICB8IFlFU1xuICogLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAqIElubGluZSArIERpcmVjdGl2ZSAgICAgIHwgTk8gICAgICAgICAgICAgICAgfCBOTyAgICAgICAgICAgICAgICAgIHwgWUVTICAgICAgICAgICAgICAgICB8IE5PXG4gKiAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICogTm9uLWlubGluZSArIFByb2plY3Rpb24gfCBZRVMgICAgICAgICAgICAgICB8IFlFUyAgICAgICAgICAgICAgICAgfCBOTyAgICAgICAgICAgICAgICAgIHwgWUVTXG4gKiAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICogTm9uLWlubGluZSArIERpcmVjdGl2ZSAgfCBZRVMgICAgICAgICAgICAgICB8IFlFUyAgICAgICAgICAgICAgICAgfCBOTyAgICAgICAgICAgICAgICAgIHwgWUVTXG4gKiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICpcbiAqIEBwYXJhbSBuYW1lIHRoZSBuYW1lIG9mIHRoZSBhdHRyaWJ1dGUgdG8gZmluZFxuICogQHBhcmFtIGF0dHJzIHRoZSBhdHRyaWJ1dGUgYXJyYXkgdG8gZXhhbWluZVxuICogQHBhcmFtIGlzSW5saW5lVGVtcGxhdGUgdHJ1ZSBpZiB0aGUgbm9kZSBiZWluZyBtYXRjaGVkIGlzIGFuIGlubGluZSB0ZW1wbGF0ZSAoZS5nLiBgKm5nRm9yYClcbiAqIHJhdGhlciB0aGFuIGEgbWFudWFsbHkgZXhwYW5kZWQgdGVtcGxhdGUgbm9kZSAoZS5nIGA8bmctdGVtcGxhdGU+YCkuXG4gKiBAcGFyYW0gaXNQcm9qZWN0aW9uTW9kZSB0cnVlIGlmIHdlIGFyZSBtYXRjaGluZyBhZ2FpbnN0IGNvbnRlbnQgcHJvamVjdGlvbiBvdGhlcndpc2Ugd2UgYXJlXG4gKiBtYXRjaGluZyBhZ2FpbnN0IGRpcmVjdGl2ZXMuXG4gKi9cbmZ1bmN0aW9uIGZpbmRBdHRySW5kZXhJbk5vZGUoXG4gICAgbmFtZTogc3RyaW5nLCBhdHRyczogVEF0dHJpYnV0ZXN8bnVsbCwgaXNJbmxpbmVUZW1wbGF0ZTogYm9vbGVhbixcbiAgICBpc1Byb2plY3Rpb25Nb2RlOiBib29sZWFuKTogbnVtYmVyIHtcbiAgaWYgKGF0dHJzID09PSBudWxsKSByZXR1cm4gLTE7XG5cbiAgbGV0IGkgPSAwO1xuXG4gIGlmIChpc1Byb2plY3Rpb25Nb2RlIHx8ICFpc0lubGluZVRlbXBsYXRlKSB7XG4gICAgbGV0IGJpbmRpbmdzTW9kZSA9IGZhbHNlO1xuICAgIHdoaWxlIChpIDwgYXR0cnMubGVuZ3RoKSB7XG4gICAgICBjb25zdCBtYXliZUF0dHJOYW1lID0gYXR0cnNbaV07XG4gICAgICBpZiAobWF5YmVBdHRyTmFtZSA9PT0gbmFtZSkge1xuICAgICAgICByZXR1cm4gaTtcbiAgICAgIH0gZWxzZSBpZiAoXG4gICAgICAgICAgbWF5YmVBdHRyTmFtZSA9PT0gQXR0cmlidXRlTWFya2VyLkJpbmRpbmdzIHx8IG1heWJlQXR0ck5hbWUgPT09IEF0dHJpYnV0ZU1hcmtlci5JMThuKSB7XG4gICAgICAgIGJpbmRpbmdzTW9kZSA9IHRydWU7XG4gICAgICB9IGVsc2UgaWYgKFxuICAgICAgICAgIG1heWJlQXR0ck5hbWUgPT09IEF0dHJpYnV0ZU1hcmtlci5DbGFzc2VzIHx8IG1heWJlQXR0ck5hbWUgPT09IEF0dHJpYnV0ZU1hcmtlci5TdHlsZXMpIHtcbiAgICAgICAgbGV0IHZhbHVlID0gYXR0cnNbKytpXTtcbiAgICAgICAgLy8gV2Ugc2hvdWxkIHNraXAgY2xhc3NlcyBoZXJlIGJlY2F1c2Ugd2UgaGF2ZSBhIHNlcGFyYXRlIG1lY2hhbmlzbSBmb3JcbiAgICAgICAgLy8gbWF0Y2hpbmcgY2xhc3NlcyBpbiBwcm9qZWN0aW9uIG1vZGUuXG4gICAgICAgIHdoaWxlICh0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgdmFsdWUgPSBhdHRyc1srK2ldO1xuICAgICAgICB9XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfSBlbHNlIGlmIChtYXliZUF0dHJOYW1lID09PSBBdHRyaWJ1dGVNYXJrZXIuVGVtcGxhdGUpIHtcbiAgICAgICAgLy8gV2UgZG8gbm90IGNhcmUgYWJvdXQgVGVtcGxhdGUgYXR0cmlidXRlcyBpbiB0aGlzIHNjZW5hcmlvLlxuICAgICAgICBicmVhaztcbiAgICAgIH0gZWxzZSBpZiAobWF5YmVBdHRyTmFtZSA9PT0gQXR0cmlidXRlTWFya2VyLk5hbWVzcGFjZVVSSSkge1xuICAgICAgICAvLyBTa2lwIHRoZSB3aG9sZSBuYW1lc3BhY2VkIGF0dHJpYnV0ZSBhbmQgdmFsdWUuIFRoaXMgaXMgYnkgZGVzaWduLlxuICAgICAgICBpICs9IDQ7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgLy8gSW4gYmluZGluZyBtb2RlIHRoZXJlIGFyZSBvbmx5IG5hbWVzLCByYXRoZXIgdGhhbiBuYW1lLXZhbHVlIHBhaXJzLlxuICAgICAgaSArPSBiaW5kaW5nc01vZGUgPyAxIDogMjtcbiAgICB9XG4gICAgLy8gV2UgZGlkIG5vdCBtYXRjaCB0aGUgYXR0cmlidXRlXG4gICAgcmV0dXJuIC0xO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBtYXRjaFRlbXBsYXRlQXR0cmlidXRlKGF0dHJzLCBuYW1lKTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNOb2RlTWF0Y2hpbmdTZWxlY3Rvckxpc3QoXG4gICAgdE5vZGU6IFROb2RlLCBzZWxlY3RvcjogQ3NzU2VsZWN0b3JMaXN0LCBpc1Byb2plY3Rpb25Nb2RlOiBib29sZWFuID0gZmFsc2UpOiBib29sZWFuIHtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBzZWxlY3Rvci5sZW5ndGg7IGkrKykge1xuICAgIGlmIChpc05vZGVNYXRjaGluZ1NlbGVjdG9yKHROb2RlLCBzZWxlY3RvcltpXSwgaXNQcm9qZWN0aW9uTW9kZSkpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBmYWxzZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFByb2plY3RBc0F0dHJWYWx1ZSh0Tm9kZTogVE5vZGUpOiBDc3NTZWxlY3RvcnxudWxsIHtcbiAgY29uc3Qgbm9kZUF0dHJzID0gdE5vZGUuYXR0cnM7XG4gIGlmIChub2RlQXR0cnMgIT0gbnVsbCkge1xuICAgIGNvbnN0IG5nUHJvamVjdEFzQXR0cklkeCA9IG5vZGVBdHRycy5pbmRleE9mKEF0dHJpYnV0ZU1hcmtlci5Qcm9qZWN0QXMpO1xuICAgIC8vIG9ubHkgY2hlY2sgZm9yIG5nUHJvamVjdEFzIGluIGF0dHJpYnV0ZSBuYW1lcywgZG9uJ3QgYWNjaWRlbnRhbGx5IG1hdGNoIGF0dHJpYnV0ZSdzIHZhbHVlXG4gICAgLy8gKGF0dHJpYnV0ZSBuYW1lcyBhcmUgc3RvcmVkIGF0IGV2ZW4gaW5kZXhlcylcbiAgICBpZiAoKG5nUHJvamVjdEFzQXR0cklkeCAmIDEpID09PSAwKSB7XG4gICAgICByZXR1cm4gbm9kZUF0dHJzW25nUHJvamVjdEFzQXR0cklkeCArIDFdIGFzIENzc1NlbGVjdG9yO1xuICAgIH1cbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuZnVuY3Rpb24gZ2V0TmFtZU9ubHlNYXJrZXJJbmRleChub2RlQXR0cnM6IFRBdHRyaWJ1dGVzKSB7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgbm9kZUF0dHJzLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3Qgbm9kZUF0dHIgPSBub2RlQXR0cnNbaV07XG4gICAgaWYgKGlzTmFtZU9ubHlBdHRyaWJ1dGVNYXJrZXIobm9kZUF0dHIpKSB7XG4gICAgICByZXR1cm4gaTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIG5vZGVBdHRycy5sZW5ndGg7XG59XG5cbmZ1bmN0aW9uIG1hdGNoVGVtcGxhdGVBdHRyaWJ1dGUoYXR0cnM6IFRBdHRyaWJ1dGVzLCBuYW1lOiBzdHJpbmcpOiBudW1iZXIge1xuICBsZXQgaSA9IGF0dHJzLmluZGV4T2YoQXR0cmlidXRlTWFya2VyLlRlbXBsYXRlKTtcbiAgaWYgKGkgPiAtMSkge1xuICAgIGkrKztcbiAgICB3aGlsZSAoaSA8IGF0dHJzLmxlbmd0aCkge1xuICAgICAgY29uc3QgYXR0ciA9IGF0dHJzW2ldO1xuICAgICAgLy8gUmV0dXJuIGluIGNhc2Ugd2UgY2hlY2tlZCBhbGwgdGVtcGxhdGUgYXR0cnMgYW5kIGFyZSBzd2l0Y2hpbmcgdG8gdGhlIG5leHQgc2VjdGlvbiBpbiB0aGVcbiAgICAgIC8vIGF0dHJzIGFycmF5ICh0aGF0IHN0YXJ0cyB3aXRoIGEgbnVtYmVyIHRoYXQgcmVwcmVzZW50cyBhbiBhdHRyaWJ1dGUgbWFya2VyKS5cbiAgICAgIGlmICh0eXBlb2YgYXR0ciA9PT0gJ251bWJlcicpIHJldHVybiAtMTtcbiAgICAgIGlmIChhdHRyID09PSBuYW1lKSByZXR1cm4gaTtcbiAgICAgIGkrKztcbiAgICB9XG4gIH1cbiAgcmV0dXJuIC0xO1xufVxuXG4vKipcbiAqIENoZWNrcyB3aGV0aGVyIGEgc2VsZWN0b3IgaXMgaW5zaWRlIGEgQ3NzU2VsZWN0b3JMaXN0XG4gKiBAcGFyYW0gc2VsZWN0b3IgU2VsZWN0b3IgdG8gYmUgY2hlY2tlZC5cbiAqIEBwYXJhbSBsaXN0IExpc3QgaW4gd2hpY2ggdG8gbG9vayBmb3IgdGhlIHNlbGVjdG9yLlxuICovXG5leHBvcnQgZnVuY3Rpb24gaXNTZWxlY3RvckluU2VsZWN0b3JMaXN0KHNlbGVjdG9yOiBDc3NTZWxlY3RvciwgbGlzdDogQ3NzU2VsZWN0b3JMaXN0KTogYm9vbGVhbiB7XG4gIHNlbGVjdG9yTGlzdExvb3A6IGZvciAobGV0IGkgPSAwOyBpIDwgbGlzdC5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IGN1cnJlbnRTZWxlY3RvckluTGlzdCA9IGxpc3RbaV07XG4gICAgaWYgKHNlbGVjdG9yLmxlbmd0aCAhPT0gY3VycmVudFNlbGVjdG9ySW5MaXN0Lmxlbmd0aCkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuICAgIGZvciAobGV0IGogPSAwOyBqIDwgc2VsZWN0b3IubGVuZ3RoOyBqKyspIHtcbiAgICAgIGlmIChzZWxlY3RvcltqXSAhPT0gY3VycmVudFNlbGVjdG9ySW5MaXN0W2pdKSB7XG4gICAgICAgIGNvbnRpbnVlIHNlbGVjdG9yTGlzdExvb3A7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9XG4gIHJldHVybiBmYWxzZTtcbn1cblxuZnVuY3Rpb24gbWF5YmVXcmFwSW5Ob3RTZWxlY3Rvcihpc05lZ2F0aXZlTW9kZTogYm9vbGVhbiwgY2h1bms6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBpc05lZ2F0aXZlTW9kZSA/ICc6bm90KCcgKyBjaHVuay50cmltKCkgKyAnKScgOiBjaHVuaztcbn1cblxuZnVuY3Rpb24gc3RyaW5naWZ5Q1NTU2VsZWN0b3Ioc2VsZWN0b3I6IENzc1NlbGVjdG9yKTogc3RyaW5nIHtcbiAgbGV0IHJlc3VsdCA9IHNlbGVjdG9yWzBdIGFzIHN0cmluZztcbiAgbGV0IGkgPSAxO1xuICBsZXQgbW9kZSA9IFNlbGVjdG9yRmxhZ3MuQVRUUklCVVRFO1xuICBsZXQgY3VycmVudENodW5rID0gJyc7XG4gIGxldCBpc05lZ2F0aXZlTW9kZSA9IGZhbHNlO1xuICB3aGlsZSAoaSA8IHNlbGVjdG9yLmxlbmd0aCkge1xuICAgIGxldCB2YWx1ZU9yTWFya2VyID0gc2VsZWN0b3JbaV07XG4gICAgaWYgKHR5cGVvZiB2YWx1ZU9yTWFya2VyID09PSAnc3RyaW5nJykge1xuICAgICAgaWYgKG1vZGUgJiBTZWxlY3RvckZsYWdzLkFUVFJJQlVURSkge1xuICAgICAgICBjb25zdCBhdHRyVmFsdWUgPSBzZWxlY3RvclsrK2ldIGFzIHN0cmluZztcbiAgICAgICAgY3VycmVudENodW5rICs9XG4gICAgICAgICAgICAnWycgKyB2YWx1ZU9yTWFya2VyICsgKGF0dHJWYWx1ZS5sZW5ndGggPiAwID8gJz1cIicgKyBhdHRyVmFsdWUgKyAnXCInIDogJycpICsgJ10nO1xuICAgICAgfSBlbHNlIGlmIChtb2RlICYgU2VsZWN0b3JGbGFncy5DTEFTUykge1xuICAgICAgICBjdXJyZW50Q2h1bmsgKz0gJy4nICsgdmFsdWVPck1hcmtlcjtcbiAgICAgIH0gZWxzZSBpZiAobW9kZSAmIFNlbGVjdG9yRmxhZ3MuRUxFTUVOVCkge1xuICAgICAgICBjdXJyZW50Q2h1bmsgKz0gJyAnICsgdmFsdWVPck1hcmtlcjtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgLy9cbiAgICAgIC8vIEFwcGVuZCBjdXJyZW50IGNodW5rIHRvIHRoZSBmaW5hbCByZXN1bHQgaW4gY2FzZSB3ZSBjb21lIGFjcm9zcyBTZWxlY3RvckZsYWcsIHdoaWNoXG4gICAgICAvLyBpbmRpY2F0ZXMgdGhhdCB0aGUgcHJldmlvdXMgc2VjdGlvbiBvZiBhIHNlbGVjdG9yIGlzIG92ZXIuIFdlIG5lZWQgdG8gYWNjdW11bGF0ZSBjb250ZW50XG4gICAgICAvLyBiZXR3ZWVuIGZsYWdzIHRvIG1ha2Ugc3VyZSB3ZSB3cmFwIHRoZSBjaHVuayBsYXRlciBpbiA6bm90KCkgc2VsZWN0b3IgaWYgbmVlZGVkLCBlLmcuXG4gICAgICAvLyBgYGBcbiAgICAgIC8vICBbJycsIEZsYWdzLkNMQVNTLCAnLmNsYXNzQScsIEZsYWdzLkNMQVNTIHwgRmxhZ3MuTk9ULCAnLmNsYXNzQicsICcuY2xhc3NDJ11cbiAgICAgIC8vIGBgYFxuICAgICAgLy8gc2hvdWxkIGJlIHRyYW5zZm9ybWVkIHRvIGAuY2xhc3NBIDpub3QoLmNsYXNzQiAuY2xhc3NDKWAuXG4gICAgICAvL1xuICAgICAgLy8gTm90ZTogZm9yIG5lZ2F0aXZlIHNlbGVjdG9yIHBhcnQsIHdlIGFjY3VtdWxhdGUgY29udGVudCBiZXR3ZWVuIGZsYWdzIHVudGlsIHdlIGZpbmQgdGhlXG4gICAgICAvLyBuZXh0IG5lZ2F0aXZlIGZsYWcuIFRoaXMgaXMgbmVlZGVkIHRvIHN1cHBvcnQgYSBjYXNlIHdoZXJlIGA6bm90KClgIHJ1bGUgY29udGFpbnMgbW9yZSB0aGFuXG4gICAgICAvLyBvbmUgY2h1bmssIGUuZy4gdGhlIGZvbGxvd2luZyBzZWxlY3RvcjpcbiAgICAgIC8vIGBgYFxuICAgICAgLy8gIFsnJywgRmxhZ3MuRUxFTUVOVCB8IEZsYWdzLk5PVCwgJ3AnLCBGbGFncy5DTEFTUywgJ2ZvbycsIEZsYWdzLkNMQVNTIHwgRmxhZ3MuTk9ULCAnYmFyJ11cbiAgICAgIC8vIGBgYFxuICAgICAgLy8gc2hvdWxkIGJlIHN0cmluZ2lmaWVkIHRvIGA6bm90KHAuZm9vKSA6bm90KC5iYXIpYFxuICAgICAgLy9cbiAgICAgIGlmIChjdXJyZW50Q2h1bmsgIT09ICcnICYmICFpc1Bvc2l0aXZlKHZhbHVlT3JNYXJrZXIpKSB7XG4gICAgICAgIHJlc3VsdCArPSBtYXliZVdyYXBJbk5vdFNlbGVjdG9yKGlzTmVnYXRpdmVNb2RlLCBjdXJyZW50Q2h1bmspO1xuICAgICAgICBjdXJyZW50Q2h1bmsgPSAnJztcbiAgICAgIH1cbiAgICAgIG1vZGUgPSB2YWx1ZU9yTWFya2VyO1xuICAgICAgLy8gQWNjb3JkaW5nIHRvIENzc1NlbGVjdG9yIHNwZWMsIG9uY2Ugd2UgY29tZSBhY3Jvc3MgYFNlbGVjdG9yRmxhZ3MuTk9UYCBmbGFnLCB0aGUgbmVnYXRpdmVcbiAgICAgIC8vIG1vZGUgaXMgbWFpbnRhaW5lZCBmb3IgcmVtYWluaW5nIGNodW5rcyBvZiBhIHNlbGVjdG9yLlxuICAgICAgaXNOZWdhdGl2ZU1vZGUgPSBpc05lZ2F0aXZlTW9kZSB8fCAhaXNQb3NpdGl2ZShtb2RlKTtcbiAgICB9XG4gICAgaSsrO1xuICB9XG4gIGlmIChjdXJyZW50Q2h1bmsgIT09ICcnKSB7XG4gICAgcmVzdWx0ICs9IG1heWJlV3JhcEluTm90U2VsZWN0b3IoaXNOZWdhdGl2ZU1vZGUsIGN1cnJlbnRDaHVuayk7XG4gIH1cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuLyoqXG4gKiBHZW5lcmF0ZXMgc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIENTUyBzZWxlY3RvciBpbiBwYXJzZWQgZm9ybS5cbiAqXG4gKiBDb21wb25lbnREZWYgYW5kIERpcmVjdGl2ZURlZiBhcmUgZ2VuZXJhdGVkIHdpdGggdGhlIHNlbGVjdG9yIGluIHBhcnNlZCBmb3JtIHRvIGF2b2lkIGRvaW5nXG4gKiBhZGRpdGlvbmFsIHBhcnNpbmcgYXQgcnVudGltZSAoZm9yIGV4YW1wbGUsIGZvciBkaXJlY3RpdmUgbWF0Y2hpbmcpLiBIb3dldmVyIGluIHNvbWUgY2FzZXMgKGZvclxuICogZXhhbXBsZSwgd2hpbGUgYm9vdHN0cmFwcGluZyBhIGNvbXBvbmVudCksIGEgc3RyaW5nIHZlcnNpb24gb2YgdGhlIHNlbGVjdG9yIGlzIHJlcXVpcmVkIHRvIHF1ZXJ5XG4gKiBmb3IgdGhlIGhvc3QgZWxlbWVudCBvbiB0aGUgcGFnZS4gVGhpcyBmdW5jdGlvbiB0YWtlcyB0aGUgcGFyc2VkIGZvcm0gb2YgYSBzZWxlY3RvciBhbmQgcmV0dXJuc1xuICogaXRzIHN0cmluZyByZXByZXNlbnRhdGlvbi5cbiAqXG4gKiBAcGFyYW0gc2VsZWN0b3JMaXN0IHNlbGVjdG9yIGluIHBhcnNlZCBmb3JtXG4gKiBAcmV0dXJucyBzdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgYSBnaXZlbiBzZWxlY3RvclxuICovXG5leHBvcnQgZnVuY3Rpb24gc3RyaW5naWZ5Q1NTU2VsZWN0b3JMaXN0KHNlbGVjdG9yTGlzdDogQ3NzU2VsZWN0b3JMaXN0KTogc3RyaW5nIHtcbiAgcmV0dXJuIHNlbGVjdG9yTGlzdC5tYXAoc3RyaW5naWZ5Q1NTU2VsZWN0b3IpLmpvaW4oJywnKTtcbn1cblxuLyoqXG4gKiBFeHRyYWN0cyBhdHRyaWJ1dGVzIGFuZCBjbGFzc2VzIGluZm9ybWF0aW9uIGZyb20gYSBnaXZlbiBDU1Mgc2VsZWN0b3IuXG4gKlxuICogVGhpcyBmdW5jdGlvbiBpcyB1c2VkIHdoaWxlIGNyZWF0aW5nIGEgY29tcG9uZW50IGR5bmFtaWNhbGx5LiBJbiB0aGlzIGNhc2UsIHRoZSBob3N0IGVsZW1lbnRcbiAqICh0aGF0IGlzIGNyZWF0ZWQgZHluYW1pY2FsbHkpIHNob3VsZCBjb250YWluIGF0dHJpYnV0ZXMgYW5kIGNsYXNzZXMgc3BlY2lmaWVkIGluIGNvbXBvbmVudCdzIENTU1xuICogc2VsZWN0b3IuXG4gKlxuICogQHBhcmFtIHNlbGVjdG9yIENTUyBzZWxlY3RvciBpbiBwYXJzZWQgZm9ybSAoaW4gYSBmb3JtIG9mIGFycmF5KVxuICogQHJldHVybnMgb2JqZWN0IHdpdGggYGF0dHJzYCBhbmQgYGNsYXNzZXNgIGZpZWxkcyB0aGF0IGNvbnRhaW4gZXh0cmFjdGVkIGluZm9ybWF0aW9uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBleHRyYWN0QXR0cnNBbmRDbGFzc2VzRnJvbVNlbGVjdG9yKHNlbGVjdG9yOiBDc3NTZWxlY3Rvcik6XG4gICAge2F0dHJzOiBzdHJpbmdbXSwgY2xhc3Nlczogc3RyaW5nW119IHtcbiAgY29uc3QgYXR0cnM6IHN0cmluZ1tdID0gW107XG4gIGNvbnN0IGNsYXNzZXM6IHN0cmluZ1tdID0gW107XG4gIGxldCBpID0gMTtcbiAgbGV0IG1vZGUgPSBTZWxlY3RvckZsYWdzLkFUVFJJQlVURTtcbiAgd2hpbGUgKGkgPCBzZWxlY3Rvci5sZW5ndGgpIHtcbiAgICBsZXQgdmFsdWVPck1hcmtlciA9IHNlbGVjdG9yW2ldO1xuICAgIGlmICh0eXBlb2YgdmFsdWVPck1hcmtlciA9PT0gJ3N0cmluZycpIHtcbiAgICAgIGlmIChtb2RlID09PSBTZWxlY3RvckZsYWdzLkFUVFJJQlVURSkge1xuICAgICAgICBpZiAodmFsdWVPck1hcmtlciAhPT0gJycpIHtcbiAgICAgICAgICBhdHRycy5wdXNoKHZhbHVlT3JNYXJrZXIsIHNlbGVjdG9yWysraV0gYXMgc3RyaW5nKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChtb2RlID09PSBTZWxlY3RvckZsYWdzLkNMQVNTKSB7XG4gICAgICAgIGNsYXNzZXMucHVzaCh2YWx1ZU9yTWFya2VyKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gQWNjb3JkaW5nIHRvIENzc1NlbGVjdG9yIHNwZWMsIG9uY2Ugd2UgY29tZSBhY3Jvc3MgYFNlbGVjdG9yRmxhZ3MuTk9UYCBmbGFnLCB0aGUgbmVnYXRpdmVcbiAgICAgIC8vIG1vZGUgaXMgbWFpbnRhaW5lZCBmb3IgcmVtYWluaW5nIGNodW5rcyBvZiBhIHNlbGVjdG9yLiBTaW5jZSBhdHRyaWJ1dGVzIGFuZCBjbGFzc2VzIGFyZVxuICAgICAgLy8gZXh0cmFjdGVkIG9ubHkgZm9yIFwicG9zaXRpdmVcIiBwYXJ0IG9mIHRoZSBzZWxlY3Rvciwgd2UgY2FuIHN0b3AgaGVyZS5cbiAgICAgIGlmICghaXNQb3NpdGl2ZShtb2RlKSkgYnJlYWs7XG4gICAgICBtb2RlID0gdmFsdWVPck1hcmtlcjtcbiAgICB9XG4gICAgaSsrO1xuICB9XG4gIHJldHVybiB7YXR0cnMsIGNsYXNzZXN9O1xufVxuIl19