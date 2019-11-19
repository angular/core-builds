/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { assertDataInRange, assertDefined, assertEqual } from '../../util/assert';
import { assertHasParent } from '../assert';
import { attachPatchData } from '../context_discovery';
import { registerPostOrderHooks } from '../hooks';
import { isContentQueryHost, isDirectiveHost } from '../interfaces/type_checks';
import { HEADER_OFFSET, RENDERER, TVIEW, T_HOST } from '../interfaces/view';
import { assertNodeType } from '../node_assert';
import { appendChild } from '../node_manipulation';
import { decreaseElementDepthCount, getBindingIndex, getElementDepthCount, getIsParent, getLView, getNamespace, getPreviousOrParentTNode, getSelectedIndex, increaseElementDepthCount, setIsNotParent, setPreviousOrParentTNode } from '../state';
import { setUpAttributes } from '../util/attrs_utils';
import { getInitialStylingValue, hasClassInput, hasStyleInput, selectClassBasedInputName } from '../util/styling_utils';
import { getConstant, getNativeByTNode, getTNode } from '../util/view_utils';
import { createDirectivesInstances, elementCreate, executeContentQueries, getOrCreateTNode, matchingSchemas, renderInitialStyling, resolveDirectives, saveResolvedLocalsInData, setInputsForProperty } from './shared';
import { registerInitialStylingOnTNode } from './styling';
/**
 * Create DOM element. The instruction must later be followed by `elementEnd()` call.
 *
 * \@codeGenApi
 * @param {?} index Index of the element in the LView array
 * @param {?} name Name of the DOM Node
 * @param {?=} attrsIndex Index of the element's attributes in the `consts` array.
 * @param {?=} localRefsIndex Index of the element's local references in the `consts` array.
 *
 * Attributes and localRefs are passed as an array of strings where elements with an even index
 * hold an attribute name and elements with an odd index hold an attribute value, ex.:
 * ['id', 'warning5', 'class', 'alert']
 *
 * @return {?}
 */
export function ɵɵelementStart(index, name, attrsIndex, localRefsIndex) {
    /** @type {?} */
    const lView = getLView();
    /** @type {?} */
    const tView = lView[TVIEW];
    /** @type {?} */
    const tViewConsts = tView.consts;
    /** @type {?} */
    const attrs = getConstant(tViewConsts, attrsIndex);
    /** @type {?} */
    const localRefs = getConstant(tViewConsts, localRefsIndex);
    ngDevMode && assertEqual(getBindingIndex(), tView.bindingStartIndex, 'elements should be created before any bindings');
    ngDevMode && ngDevMode.rendererCreateElement++;
    ngDevMode && assertDataInRange(lView, index + HEADER_OFFSET);
    /** @type {?} */
    const renderer = lView[RENDERER];
    /** @type {?} */
    const native = lView[index + HEADER_OFFSET] = elementCreate(name, renderer, getNamespace());
    /** @type {?} */
    const tNode = getOrCreateTNode(tView, lView[T_HOST], index, 3 /* Element */, name, attrs);
    if (attrs != null) {
        /** @type {?} */
        const lastAttrIndex = setUpAttributes(renderer, native, attrs);
        if (tView.firstCreatePass) {
            registerInitialStylingOnTNode(tNode, attrs, lastAttrIndex);
        }
    }
    if ((tNode.flags & 256 /* hasInitialStyling */) === 256 /* hasInitialStyling */) {
        renderInitialStyling(renderer, native, tNode, false);
    }
    appendChild(native, tNode, lView);
    // any immediate children of a component or template container must be pre-emptively
    // monkey-patched with the component view data so that the element can be inspected
    // later on using any element discovery utility methods (see `element_discovery.ts`)
    if (getElementDepthCount() === 0) {
        attachPatchData(native, lView);
    }
    increaseElementDepthCount();
    // if a directive contains a host binding for "class" then all class-based data will
    // flow through that (except for `[class.prop]` bindings). This also includes initial
    // static class values as well. (Note that this will be fixed once map-based `[style]`
    // and `[class]` bindings work for multiple directives.)
    if (tView.firstCreatePass) {
        ngDevMode && ngDevMode.firstCreatePass++;
        /** @type {?} */
        const hasDirectives = resolveDirectives(tView, lView, tNode, localRefs);
        ngDevMode && validateElement(lView, native, tNode, hasDirectives);
        if (tView.queries !== null) {
            tView.queries.elementStart(tView, tNode);
        }
    }
    if (isDirectiveHost(tNode)) {
        createDirectivesInstances(tView, lView, tNode);
        executeContentQueries(tView, tNode, lView);
    }
    if (localRefs != null) {
        saveResolvedLocalsInData(lView, tNode);
    }
}
/**
 * Mark the end of the element.
 *
 * \@codeGenApi
 * @return {?}
 */
export function ɵɵelementEnd() {
    /** @type {?} */
    let previousOrParentTNode = getPreviousOrParentTNode();
    ngDevMode && assertDefined(previousOrParentTNode, 'No parent node to close.');
    if (getIsParent()) {
        setIsNotParent();
    }
    else {
        ngDevMode && assertHasParent(getPreviousOrParentTNode());
        previousOrParentTNode = (/** @type {?} */ (previousOrParentTNode.parent));
        setPreviousOrParentTNode(previousOrParentTNode, false);
    }
    /** @type {?} */
    const tNode = previousOrParentTNode;
    ngDevMode && assertNodeType(tNode, 3 /* Element */);
    /** @type {?} */
    const lView = getLView();
    /** @type {?} */
    const tView = lView[TVIEW];
    decreaseElementDepthCount();
    if (tView.firstCreatePass) {
        registerPostOrderHooks(tView, previousOrParentTNode);
        if (isContentQueryHost(previousOrParentTNode)) {
            (/** @type {?} */ (tView.queries)).elementEnd(previousOrParentTNode);
        }
    }
    if (hasClassInput(tNode)) {
        /** @type {?} */
        const inputName = selectClassBasedInputName((/** @type {?} */ (tNode.inputs)));
        setDirectiveStylingInput(tNode.classes, lView, (/** @type {?} */ (tNode.inputs))[inputName], inputName);
    }
    if (hasStyleInput(tNode)) {
        setDirectiveStylingInput(tNode.styles, lView, (/** @type {?} */ (tNode.inputs))['style'], 'style');
    }
}
/**
 * Creates an empty element using {\@link elementStart} and {\@link elementEnd}
 *
 * \@codeGenApi
 * @param {?} index Index of the element in the data array
 * @param {?} name Name of the DOM Node
 * @param {?=} attrsIndex Index of the element's attributes in the `consts` array.
 * @param {?=} localRefsIndex Index of the element's local references in the `consts` array.
 *
 * @return {?}
 */
export function ɵɵelement(index, name, attrsIndex, localRefsIndex) {
    ɵɵelementStart(index, name, attrsIndex, localRefsIndex);
    ɵɵelementEnd();
}
/**
 * Assign static attribute values to a host element.
 *
 * This instruction will assign static attribute values as well as class and style
 * values to an element within the host bindings function. Since attribute values
 * can consist of different types of values, the `attrs` array must include the values in
 * the following format:
 *
 * attrs = [
 *   // static attributes (like `title`, `name`, `id`...)
 *   attr1, value1, attr2, value,
 *
 *   // a single namespace value (like `x:id`)
 *   NAMESPACE_MARKER, namespaceUri1, name1, value1,
 *
 *   // another single namespace value (like `x:name`)
 *   NAMESPACE_MARKER, namespaceUri2, name2, value2,
 *
 *   // a series of CSS classes that will be applied to the element (no spaces)
 *   CLASSES_MARKER, class1, class2, class3,
 *
 *   // a series of CSS styles (property + value) that will be applied to the element
 *   STYLES_MARKER, prop1, value1, prop2, value2
 * ]
 *
 * All non-class and non-style attributes must be defined at the start of the list
 * first before all class and style values are set. When there is a change in value
 * type (like when classes and styles are introduced) a marker must be used to separate
 * the entries. The marker values themselves are set via entries found in the
 * [AttributeMarker] enum.
 *
 * NOTE: This instruction is meant to used from `hostBindings` function only.
 *
 * \@codeGenApi
 * @param {?} attrs An array of static values (attributes, classes and styles) with the correct marker
 * values.
 *
 * @return {?}
 */
export function ɵɵelementHostAttrs(attrs) {
    /** @type {?} */
    const hostElementIndex = getSelectedIndex();
    /** @type {?} */
    const lView = getLView();
    /** @type {?} */
    const tView = lView[TVIEW];
    /** @type {?} */
    const tNode = getTNode(hostElementIndex, lView);
    // non-element nodes (e.g. `<ng-container>`) are not rendered as actual
    // element nodes and adding styles/classes on to them will cause runtime
    // errors...
    if (tNode.type === 3 /* Element */) {
        /** @type {?} */
        const native = (/** @type {?} */ (getNativeByTNode(tNode, lView)));
        /** @type {?} */
        const lastAttrIndex = setUpAttributes(lView[RENDERER], native, attrs);
        if (tView.firstCreatePass) {
            /** @type {?} */
            const stylingNeedsToBeRendered = registerInitialStylingOnTNode(tNode, attrs, lastAttrIndex);
            // this is only called during the first template pass in the
            // event that this current directive assigned initial style/class
            // host attribute values to the element. Because initial styling
            // values are applied before directives are first rendered (within
            // `createElement`) this means that initial styling for any directives
            // still needs to be applied. Note that this will only happen during
            // the first template pass and not each time a directive applies its
            // attribute values to the element.
            if (stylingNeedsToBeRendered) {
                /** @type {?} */
                const renderer = lView[RENDERER];
                renderInitialStyling(renderer, native, tNode, true);
            }
        }
    }
}
/**
 * @param {?} context
 * @param {?} lView
 * @param {?} stylingInputs
 * @param {?} propName
 * @return {?}
 */
function setDirectiveStylingInput(context, lView, stylingInputs, propName) {
    // older versions of Angular treat the input as `null` in the
    // event that the value does not exist at all. For this reason
    // we can't have a styling value be an empty string.
    /** @type {?} */
    const value = (context && getInitialStylingValue(context)) || null;
    // Ivy does an extra `[class]` write with a falsy value since the value
    // is applied during creation mode. This is a deviation from VE and should
    // be (Jira Issue = FW-1467).
    setInputsForProperty(lView, stylingInputs, propName, value);
}
/**
 * @param {?} hostView
 * @param {?} element
 * @param {?} tNode
 * @param {?} hasDirectives
 * @return {?}
 */
function validateElement(hostView, element, tNode, hasDirectives) {
    /** @type {?} */
    const tagName = tNode.tagName;
    // If the element matches any directive, it's considered as valid.
    if (!hasDirectives && tagName !== null) {
        // The element is unknown if it's an instance of HTMLUnknownElement or it isn't registered
        // as a custom element. Note that unknown elements with a dash in their name won't be instances
        // of HTMLUnknownElement in browsers that support web components.
        /** @type {?} */
        const isUnknown = (typeof HTMLUnknownElement === 'function' && element instanceof HTMLUnknownElement) ||
            (typeof customElements !== 'undefined' && tagName.indexOf('-') > -1 &&
                !customElements.get(tagName));
        if (isUnknown && !matchingSchemas(hostView, tagName)) {
            /** @type {?} */
            let errorMessage = `'${tagName}' is not a known element:\n`;
            errorMessage +=
                `1. If '${tagName}' is an Angular component, then verify that it is part of this module.\n`;
            if (tagName && tagName.indexOf('-') > -1) {
                errorMessage +=
                    `2. If '${tagName}' is a Web Component then add 'CUSTOM_ELEMENTS_SCHEMA' to the '@NgModule.schemas' of this component to suppress this message.`;
            }
            else {
                errorMessage +=
                    `2. To allow any element add 'NO_ERRORS_SCHEMA' to the '@NgModule.schemas' of this component.`;
            }
            throw new Error(errorMessage);
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWxlbWVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaW5zdHJ1Y3Rpb25zL2VsZW1lbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFRQSxPQUFPLEVBQUMsaUJBQWlCLEVBQUUsYUFBYSxFQUFFLFdBQVcsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQ2hGLE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSxXQUFXLENBQUM7QUFDMUMsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLHNCQUFzQixDQUFDO0FBQ3JELE9BQU8sRUFBQyxzQkFBc0IsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUloRCxPQUFPLEVBQUMsa0JBQWtCLEVBQUUsZUFBZSxFQUFDLE1BQU0sMkJBQTJCLENBQUM7QUFDOUUsT0FBTyxFQUFDLGFBQWEsRUFBUyxRQUFRLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBQyxNQUFNLG9CQUFvQixDQUFDO0FBQ2pGLE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUM5QyxPQUFPLEVBQUMsV0FBVyxFQUFDLE1BQU0sc0JBQXNCLENBQUM7QUFDakQsT0FBTyxFQUFDLHlCQUF5QixFQUFFLGVBQWUsRUFBRSxvQkFBb0IsRUFBRSxXQUFXLEVBQUUsUUFBUSxFQUFFLFlBQVksRUFBRSx3QkFBd0IsRUFBRSxnQkFBZ0IsRUFBRSx5QkFBeUIsRUFBRSxjQUFjLEVBQUUsd0JBQXdCLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDaFAsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBQ3BELE9BQU8sRUFBQyxzQkFBc0IsRUFBRSxhQUFhLEVBQUUsYUFBYSxFQUFFLHlCQUF5QixFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDdEgsT0FBTyxFQUFDLFdBQVcsRUFBRSxnQkFBZ0IsRUFBRSxRQUFRLEVBQUMsTUFB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QUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDbEUsQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBRWxDLElBQUksU0FBUyxJQUFJLENBQUMsZUFBZSxDQUFDLFFBQVEsRUFBRSxPQUFPLENBQUMsRUFBRTs7Z0JBQ2hELFlBQVksR0FBRyxJQUFJLE9BQU8sNkJBQTZCO1lBQzNELFlBQVk7Z0JBQ1IsVUFBVSxPQUFPLDBFQUEwRSxDQUFDO1lBQ2hHLElBQUksT0FBTyxJQUFJLE9BQU8sQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUU7Z0JBQ3hDLFlBQVk7b0JBQ1IsVUFBVSxPQUFPLCtIQUErSCxDQUFDO2FBQ3RKO2lCQUFNO2dCQUNMLFlBQVk7b0JBQ1IsOEZBQThGLENBQUM7YUFDcEc7WUFDRCxNQUFNLElBQUksS0FBSyxDQUFDLFlBQVksQ0FBQyxDQUFDO1NBQy9CO0tBQ0Y7QUFDSCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge2Fzc2VydERhdGFJblJhbmdlLCBhc3NlcnREZWZpbmVkLCBhc3NlcnRFcXVhbH0gZnJvbSAnLi4vLi4vdXRpbC9hc3NlcnQnO1xuaW1wb3J0IHthc3NlcnRIYXNQYXJlbnR9IGZyb20gJy4uL2Fzc2VydCc7XG5pbXBvcnQge2F0dGFjaFBhdGNoRGF0YX0gZnJvbSAnLi4vY29udGV4dF9kaXNjb3ZlcnknO1xuaW1wb3J0IHtyZWdpc3RlclBvc3RPcmRlckhvb2tzfSBmcm9tICcuLi9ob29rcyc7XG5pbXBvcnQge1RBdHRyaWJ1dGVzLCBUTm9kZSwgVE5vZGVGbGFncywgVE5vZGVUeXBlfSBmcm9tICcuLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtSRWxlbWVudH0gZnJvbSAnLi4vaW50ZXJmYWNlcy9yZW5kZXJlcic7XG5pbXBvcnQge1N0eWxpbmdNYXBBcnJheSwgVFN0eWxpbmdDb250ZXh0fSBmcm9tICcuLi9pbnRlcmZhY2VzL3N0eWxpbmcnO1xuaW1wb3J0IHtpc0NvbnRlbnRRdWVyeUhvc3QsIGlzRGlyZWN0aXZlSG9zdH0gZnJvbSAnLi4vaW50ZXJmYWNlcy90eXBlX2NoZWNrcyc7XG5pbXBvcnQge0hFQURFUl9PRkZTRVQsIExWaWV3LCBSRU5ERVJFUiwgVFZJRVcsIFRfSE9TVH0gZnJvbSAnLi4vaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7YXNzZXJ0Tm9kZVR5cGV9IGZyb20gJy4uL25vZGVfYXNzZXJ0JztcbmltcG9ydCB7YXBwZW5kQ2hpbGR9IGZyb20gJy4uL25vZGVfbWFuaXB1bGF0aW9uJztcbmltcG9ydCB7ZGVjcmVhc2VFbGVtZW50RGVwdGhDb3VudCwgZ2V0QmluZGluZ0luZGV4LCBnZXRFbGVtZW50RGVwdGhDb3VudCwgZ2V0SXNQYXJlbnQsIGdldExWaWV3LCBnZXROYW1lc3BhY2UsIGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSwgZ2V0U2VsZWN0ZWRJbmRleCwgaW5jcmVhc2VFbGVtZW50RGVwdGhDb3VudCwgc2V0SXNOb3RQYXJlbnQsIHNldFByZXZpb3VzT3JQYXJlbnRUTm9kZX0gZnJvbSAnLi4vc3RhdGUnO1xuaW1wb3J0IHtzZXRVcEF0dHJpYnV0ZXN9IGZyb20gJy4uL3V0aWwvYXR0cnNfdXRpbHMnO1xuaW1wb3J0IHtnZXRJbml0aWFsU3R5bGluZ1ZhbHVlLCBoYXNDbGFzc0lucHV0LCBoYXNTdHlsZUlucHV0LCBzZWxlY3RDbGFzc0Jhc2VkSW5wdXROYW1lfSBmcm9tICcuLi91dGlsL3N0eWxpbmdfdXRpbHMnO1xuaW1wb3J0IHtnZXRDb25zdGFudCwgZ2V0TmF0aXZlQnlUTm9kZSwgZ2V0VE5vZGV9IGZyb20gJy4uL3V0aWwvdmlld191dGlscyc7XG5cbmltcG9ydCB7Y3JlYXRlRGlyZWN0aXZlc0luc3RhbmNlcywgZWxlbWVudENyZWF0ZSwgZXhlY3V0ZUNvbnRlbnRRdWVyaWVzLCBnZXRPckNyZWF0ZVROb2RlLCBtYXRjaGluZ1NjaGVtYXMsIHJlbmRlckluaXRpYWxTdHlsaW5nLCByZXNvbHZlRGlyZWN0aXZlcywgc2F2ZVJlc29sdmVkTG9jYWxzSW5EYXRhLCBzZXRJbnB1dHNGb3JQcm9wZXJ0eX0gZnJvbSAnLi9zaGFyZWQnO1xuaW1wb3J0IHtyZWdpc3RlckluaXRpYWxTdHlsaW5nT25UTm9kZX0gZnJvbSAnLi9zdHlsaW5nJztcblxuXG5cbi8qKlxuICogQ3JlYXRlIERPTSBlbGVtZW50LiBUaGUgaW5zdHJ1Y3Rpb24gbXVzdCBsYXRlciBiZSBmb2xsb3dlZCBieSBgZWxlbWVudEVuZCgpYCBjYWxsLlxuICpcbiAqIEBwYXJhbSBpbmRleCBJbmRleCBvZiB0aGUgZWxlbWVudCBpbiB0aGUgTFZpZXcgYXJyYXlcbiAqIEBwYXJhbSBuYW1lIE5hbWUgb2YgdGhlIERPTSBOb2RlXG4gKiBAcGFyYW0gYXR0cnNJbmRleCBJbmRleCBvZiB0aGUgZWxlbWVudCdzIGF0dHJpYnV0ZXMgaW4gdGhlIGBjb25zdHNgIGFycmF5LlxuICogQHBhcmFtIGxvY2FsUmVmc0luZGV4IEluZGV4IG9mIHRoZSBlbGVtZW50J3MgbG9jYWwgcmVmZXJlbmNlcyBpbiB0aGUgYGNvbnN0c2AgYXJyYXkuXG4gKlxuICogQXR0cmlidXRlcyBhbmQgbG9jYWxSZWZzIGFyZSBwYXNzZWQgYXMgYW4gYXJyYXkgb2Ygc3RyaW5ncyB3aGVyZSBlbGVtZW50cyB3aXRoIGFuIGV2ZW4gaW5kZXhcbiAqIGhvbGQgYW4gYXR0cmlidXRlIG5hbWUgYW5kIGVsZW1lbnRzIHdpdGggYW4gb2RkIGluZGV4IGhvbGQgYW4gYXR0cmlidXRlIHZhbHVlLCBleC46XG4gKiBbJ2lkJywgJ3dhcm5pbmc1JywgJ2NsYXNzJywgJ2FsZXJ0J11cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWVsZW1lbnRTdGFydChcbiAgICBpbmRleDogbnVtYmVyLCBuYW1lOiBzdHJpbmcsIGF0dHJzSW5kZXg/OiBudW1iZXIgfCBudWxsLCBsb2NhbFJlZnNJbmRleD86IG51bWJlcik6IHZvaWQge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IHRWaWV3ID0gbFZpZXdbVFZJRVddO1xuICBjb25zdCB0Vmlld0NvbnN0cyA9IHRWaWV3LmNvbnN0cztcbiAgY29uc3QgYXR0cnMgPSBnZXRDb25zdGFudDxUQXR0cmlidXRlcz4odFZpZXdDb25zdHMsIGF0dHJzSW5kZXgpO1xuICBjb25zdCBsb2NhbFJlZnMgPSBnZXRDb25zdGFudDxzdHJpbmdbXT4odFZpZXdDb25zdHMsIGxvY2FsUmVmc0luZGV4KTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEVxdWFsKFxuICAgICAgICAgICAgICAgICAgIGdldEJpbmRpbmdJbmRleCgpLCB0Vmlldy5iaW5kaW5nU3RhcnRJbmRleCxcbiAgICAgICAgICAgICAgICAgICAnZWxlbWVudHMgc2hvdWxkIGJlIGNyZWF0ZWQgYmVmb3JlIGFueSBiaW5kaW5ncycpO1xuICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyQ3JlYXRlRWxlbWVudCsrO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGF0YUluUmFuZ2UobFZpZXcsIGluZGV4ICsgSEVBREVSX09GRlNFVCk7XG4gIGNvbnN0IHJlbmRlcmVyID0gbFZpZXdbUkVOREVSRVJdO1xuICBjb25zdCBuYXRpdmUgPSBsVmlld1tpbmRleCArIEhFQURFUl9PRkZTRVRdID0gZWxlbWVudENyZWF0ZShuYW1lLCByZW5kZXJlciwgZ2V0TmFtZXNwYWNlKCkpO1xuICBjb25zdCB0Tm9kZSA9IGdldE9yQ3JlYXRlVE5vZGUodFZpZXcsIGxWaWV3W1RfSE9TVF0sIGluZGV4LCBUTm9kZVR5cGUuRWxlbWVudCwgbmFtZSwgYXR0cnMpO1xuXG4gIGlmIChhdHRycyAhPSBudWxsKSB7XG4gICAgY29uc3QgbGFzdEF0dHJJbmRleCA9IHNldFVwQXR0cmlidXRlcyhyZW5kZXJlciwgbmF0aXZlLCBhdHRycyk7XG4gICAgaWYgKHRWaWV3LmZpcnN0Q3JlYXRlUGFzcykge1xuICAgICAgcmVnaXN0ZXJJbml0aWFsU3R5bGluZ09uVE5vZGUodE5vZGUsIGF0dHJzLCBsYXN0QXR0ckluZGV4KTtcbiAgICB9XG4gIH1cblxuICBpZiAoKHROb2RlLmZsYWdzICYgVE5vZGVGbGFncy5oYXNJbml0aWFsU3R5bGluZykgPT09IFROb2RlRmxhZ3MuaGFzSW5pdGlhbFN0eWxpbmcpIHtcbiAgICByZW5kZXJJbml0aWFsU3R5bGluZyhyZW5kZXJlciwgbmF0aXZlLCB0Tm9kZSwgZmFsc2UpO1xuICB9XG5cbiAgYXBwZW5kQ2hpbGQobmF0aXZlLCB0Tm9kZSwgbFZpZXcpO1xuXG4gIC8vIGFueSBpbW1lZGlhdGUgY2hpbGRyZW4gb2YgYSBjb21wb25lbnQgb3IgdGVtcGxhdGUgY29udGFpbmVyIG11c3QgYmUgcHJlLWVtcHRpdmVseVxuICAvLyBtb25rZXktcGF0Y2hlZCB3aXRoIHRoZSBjb21wb25lbnQgdmlldyBkYXRhIHNvIHRoYXQgdGhlIGVsZW1lbnQgY2FuIGJlIGluc3BlY3RlZFxuICAvLyBsYXRlciBvbiB1c2luZyBhbnkgZWxlbWVudCBkaXNjb3ZlcnkgdXRpbGl0eSBtZXRob2RzIChzZWUgYGVsZW1lbnRfZGlzY292ZXJ5LnRzYClcbiAgaWYgKGdldEVsZW1lbnREZXB0aENvdW50KCkgPT09IDApIHtcbiAgICBhdHRhY2hQYXRjaERhdGEobmF0aXZlLCBsVmlldyk7XG4gIH1cbiAgaW5jcmVhc2VFbGVtZW50RGVwdGhDb3VudCgpO1xuXG4gIC8vIGlmIGEgZGlyZWN0aXZlIGNvbnRhaW5zIGEgaG9zdCBiaW5kaW5nIGZvciBcImNsYXNzXCIgdGhlbiBhbGwgY2xhc3MtYmFzZWQgZGF0YSB3aWxsXG4gIC8vIGZsb3cgdGhyb3VnaCB0aGF0IChleGNlcHQgZm9yIGBbY2xhc3MucHJvcF1gIGJpbmRpbmdzKS4gVGhpcyBhbHNvIGluY2x1ZGVzIGluaXRpYWxcbiAgLy8gc3RhdGljIGNsYXNzIHZhbHVlcyBhcyB3ZWxsLiAoTm90ZSB0aGF0IHRoaXMgd2lsbCBiZSBmaXhlZCBvbmNlIG1hcC1iYXNlZCBgW3N0eWxlXWBcbiAgLy8gYW5kIGBbY2xhc3NdYCBiaW5kaW5ncyB3b3JrIGZvciBtdWx0aXBsZSBkaXJlY3RpdmVzLilcbiAgaWYgKHRWaWV3LmZpcnN0Q3JlYXRlUGFzcykge1xuICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUuZmlyc3RDcmVhdGVQYXNzKys7XG4gICAgY29uc3QgaGFzRGlyZWN0aXZlcyA9IHJlc29sdmVEaXJlY3RpdmVzKHRWaWV3LCBsVmlldywgdE5vZGUsIGxvY2FsUmVmcyk7XG4gICAgbmdEZXZNb2RlICYmIHZhbGlkYXRlRWxlbWVudChsVmlldywgbmF0aXZlLCB0Tm9kZSwgaGFzRGlyZWN0aXZlcyk7XG5cbiAgICBpZiAodFZpZXcucXVlcmllcyAhPT0gbnVsbCkge1xuICAgICAgdFZpZXcucXVlcmllcy5lbGVtZW50U3RhcnQodFZpZXcsIHROb2RlKTtcbiAgICB9XG4gIH1cblxuICBpZiAoaXNEaXJlY3RpdmVIb3N0KHROb2RlKSkge1xuICAgIGNyZWF0ZURpcmVjdGl2ZXNJbnN0YW5jZXModFZpZXcsIGxWaWV3LCB0Tm9kZSk7XG4gICAgZXhlY3V0ZUNvbnRlbnRRdWVyaWVzKHRWaWV3LCB0Tm9kZSwgbFZpZXcpO1xuICB9XG4gIGlmIChsb2NhbFJlZnMgIT0gbnVsbCkge1xuICAgIHNhdmVSZXNvbHZlZExvY2Fsc0luRGF0YShsVmlldywgdE5vZGUpO1xuICB9XG59XG5cbi8qKlxuICogTWFyayB0aGUgZW5kIG9mIHRoZSBlbGVtZW50LlxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1ZWxlbWVudEVuZCgpOiB2b2lkIHtcbiAgbGV0IHByZXZpb3VzT3JQYXJlbnRUTm9kZSA9IGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSgpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChwcmV2aW91c09yUGFyZW50VE5vZGUsICdObyBwYXJlbnQgbm9kZSB0byBjbG9zZS4nKTtcbiAgaWYgKGdldElzUGFyZW50KCkpIHtcbiAgICBzZXRJc05vdFBhcmVudCgpO1xuICB9IGVsc2Uge1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnRIYXNQYXJlbnQoZ2V0UHJldmlvdXNPclBhcmVudFROb2RlKCkpO1xuICAgIHByZXZpb3VzT3JQYXJlbnRUTm9kZSA9IHByZXZpb3VzT3JQYXJlbnRUTm9kZS5wYXJlbnQgITtcbiAgICBzZXRQcmV2aW91c09yUGFyZW50VE5vZGUocHJldmlvdXNPclBhcmVudFROb2RlLCBmYWxzZSk7XG4gIH1cblxuICBjb25zdCB0Tm9kZSA9IHByZXZpb3VzT3JQYXJlbnRUTm9kZTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVUeXBlKHROb2RlLCBUTm9kZVR5cGUuRWxlbWVudCk7XG5cbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcblxuICBkZWNyZWFzZUVsZW1lbnREZXB0aENvdW50KCk7XG5cbiAgaWYgKHRWaWV3LmZpcnN0Q3JlYXRlUGFzcykge1xuICAgIHJlZ2lzdGVyUG9zdE9yZGVySG9va3ModFZpZXcsIHByZXZpb3VzT3JQYXJlbnRUTm9kZSk7XG4gICAgaWYgKGlzQ29udGVudFF1ZXJ5SG9zdChwcmV2aW91c09yUGFyZW50VE5vZGUpKSB7XG4gICAgICB0Vmlldy5xdWVyaWVzICEuZWxlbWVudEVuZChwcmV2aW91c09yUGFyZW50VE5vZGUpO1xuICAgIH1cbiAgfVxuXG4gIGlmIChoYXNDbGFzc0lucHV0KHROb2RlKSkge1xuICAgIGNvbnN0IGlucHV0TmFtZTogc3RyaW5nID0gc2VsZWN0Q2xhc3NCYXNlZElucHV0TmFtZSh0Tm9kZS5pbnB1dHMgISk7XG4gICAgc2V0RGlyZWN0aXZlU3R5bGluZ0lucHV0KHROb2RlLmNsYXNzZXMsIGxWaWV3LCB0Tm9kZS5pbnB1dHMgIVtpbnB1dE5hbWVdLCBpbnB1dE5hbWUpO1xuICB9XG5cbiAgaWYgKGhhc1N0eWxlSW5wdXQodE5vZGUpKSB7XG4gICAgc2V0RGlyZWN0aXZlU3R5bGluZ0lucHV0KHROb2RlLnN0eWxlcywgbFZpZXcsIHROb2RlLmlucHV0cyAhWydzdHlsZSddLCAnc3R5bGUnKTtcbiAgfVxufVxuXG5cbi8qKlxuICogQ3JlYXRlcyBhbiBlbXB0eSBlbGVtZW50IHVzaW5nIHtAbGluayBlbGVtZW50U3RhcnR9IGFuZCB7QGxpbmsgZWxlbWVudEVuZH1cbiAqXG4gKiBAcGFyYW0gaW5kZXggSW5kZXggb2YgdGhlIGVsZW1lbnQgaW4gdGhlIGRhdGEgYXJyYXlcbiAqIEBwYXJhbSBuYW1lIE5hbWUgb2YgdGhlIERPTSBOb2RlXG4gKiBAcGFyYW0gYXR0cnNJbmRleCBJbmRleCBvZiB0aGUgZWxlbWVudCdzIGF0dHJpYnV0ZXMgaW4gdGhlIGBjb25zdHNgIGFycmF5LlxuICogQHBhcmFtIGxvY2FsUmVmc0luZGV4IEluZGV4IG9mIHRoZSBlbGVtZW50J3MgbG9jYWwgcmVmZXJlbmNlcyBpbiB0aGUgYGNvbnN0c2AgYXJyYXkuXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVlbGVtZW50KFxuICAgIGluZGV4OiBudW1iZXIsIG5hbWU6IHN0cmluZywgYXR0cnNJbmRleD86IG51bWJlciB8IG51bGwsIGxvY2FsUmVmc0luZGV4PzogbnVtYmVyKTogdm9pZCB7XG4gIMm1ybVlbGVtZW50U3RhcnQoaW5kZXgsIG5hbWUsIGF0dHJzSW5kZXgsIGxvY2FsUmVmc0luZGV4KTtcbiAgybXJtWVsZW1lbnRFbmQoKTtcbn1cblxuLyoqXG4gKiBBc3NpZ24gc3RhdGljIGF0dHJpYnV0ZSB2YWx1ZXMgdG8gYSBob3N0IGVsZW1lbnQuXG4gKlxuICogVGhpcyBpbnN0cnVjdGlvbiB3aWxsIGFzc2lnbiBzdGF0aWMgYXR0cmlidXRlIHZhbHVlcyBhcyB3ZWxsIGFzIGNsYXNzIGFuZCBzdHlsZVxuICogdmFsdWVzIHRvIGFuIGVsZW1lbnQgd2l0aGluIHRoZSBob3N0IGJpbmRpbmdzIGZ1bmN0aW9uLiBTaW5jZSBhdHRyaWJ1dGUgdmFsdWVzXG4gKiBjYW4gY29uc2lzdCBvZiBkaWZmZXJlbnQgdHlwZXMgb2YgdmFsdWVzLCB0aGUgYGF0dHJzYCBhcnJheSBtdXN0IGluY2x1ZGUgdGhlIHZhbHVlcyBpblxuICogdGhlIGZvbGxvd2luZyBmb3JtYXQ6XG4gKlxuICogYXR0cnMgPSBbXG4gKiAgIC8vIHN0YXRpYyBhdHRyaWJ1dGVzIChsaWtlIGB0aXRsZWAsIGBuYW1lYCwgYGlkYC4uLilcbiAqICAgYXR0cjEsIHZhbHVlMSwgYXR0cjIsIHZhbHVlLFxuICpcbiAqICAgLy8gYSBzaW5nbGUgbmFtZXNwYWNlIHZhbHVlIChsaWtlIGB4OmlkYClcbiAqICAgTkFNRVNQQUNFX01BUktFUiwgbmFtZXNwYWNlVXJpMSwgbmFtZTEsIHZhbHVlMSxcbiAqXG4gKiAgIC8vIGFub3RoZXIgc2luZ2xlIG5hbWVzcGFjZSB2YWx1ZSAobGlrZSBgeDpuYW1lYClcbiAqICAgTkFNRVNQQUNFX01BUktFUiwgbmFtZXNwYWNlVXJpMiwgbmFtZTIsIHZhbHVlMixcbiAqXG4gKiAgIC8vIGEgc2VyaWVzIG9mIENTUyBjbGFzc2VzIHRoYXQgd2lsbCBiZSBhcHBsaWVkIHRvIHRoZSBlbGVtZW50IChubyBzcGFjZXMpXG4gKiAgIENMQVNTRVNfTUFSS0VSLCBjbGFzczEsIGNsYXNzMiwgY2xhc3MzLFxuICpcbiAqICAgLy8gYSBzZXJpZXMgb2YgQ1NTIHN0eWxlcyAocHJvcGVydHkgKyB2YWx1ZSkgdGhhdCB3aWxsIGJlIGFwcGxpZWQgdG8gdGhlIGVsZW1lbnRcbiAqICAgU1RZTEVTX01BUktFUiwgcHJvcDEsIHZhbHVlMSwgcHJvcDIsIHZhbHVlMlxuICogXVxuICpcbiAqIEFsbCBub24tY2xhc3MgYW5kIG5vbi1zdHlsZSBhdHRyaWJ1dGVzIG11c3QgYmUgZGVmaW5lZCBhdCB0aGUgc3RhcnQgb2YgdGhlIGxpc3RcbiAqIGZpcnN0IGJlZm9yZSBhbGwgY2xhc3MgYW5kIHN0eWxlIHZhbHVlcyBhcmUgc2V0LiBXaGVuIHRoZXJlIGlzIGEgY2hhbmdlIGluIHZhbHVlXG4gKiB0eXBlIChsaWtlIHdoZW4gY2xhc3NlcyBhbmQgc3R5bGVzIGFyZSBpbnRyb2R1Y2VkKSBhIG1hcmtlciBtdXN0IGJlIHVzZWQgdG8gc2VwYXJhdGVcbiAqIHRoZSBlbnRyaWVzLiBUaGUgbWFya2VyIHZhbHVlcyB0aGVtc2VsdmVzIGFyZSBzZXQgdmlhIGVudHJpZXMgZm91bmQgaW4gdGhlXG4gKiBbQXR0cmlidXRlTWFya2VyXSBlbnVtLlxuICpcbiAqIE5PVEU6IFRoaXMgaW5zdHJ1Y3Rpb24gaXMgbWVhbnQgdG8gdXNlZCBmcm9tIGBob3N0QmluZGluZ3NgIGZ1bmN0aW9uIG9ubHkuXG4gKlxuICogQHBhcmFtIGRpcmVjdGl2ZSBBIGRpcmVjdGl2ZSBpbnN0YW5jZSB0aGUgc3R5bGluZyBpcyBhc3NvY2lhdGVkIHdpdGguXG4gKiBAcGFyYW0gYXR0cnMgQW4gYXJyYXkgb2Ygc3RhdGljIHZhbHVlcyAoYXR0cmlidXRlcywgY2xhc3NlcyBhbmQgc3R5bGVzKSB3aXRoIHRoZSBjb3JyZWN0IG1hcmtlclxuICogdmFsdWVzLlxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1ZWxlbWVudEhvc3RBdHRycyhhdHRyczogVEF0dHJpYnV0ZXMpIHtcbiAgY29uc3QgaG9zdEVsZW1lbnRJbmRleCA9IGdldFNlbGVjdGVkSW5kZXgoKTtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgY29uc3QgdE5vZGUgPSBnZXRUTm9kZShob3N0RWxlbWVudEluZGV4LCBsVmlldyk7XG5cbiAgLy8gbm9uLWVsZW1lbnQgbm9kZXMgKGUuZy4gYDxuZy1jb250YWluZXI+YCkgYXJlIG5vdCByZW5kZXJlZCBhcyBhY3R1YWxcbiAgLy8gZWxlbWVudCBub2RlcyBhbmQgYWRkaW5nIHN0eWxlcy9jbGFzc2VzIG9uIHRvIHRoZW0gd2lsbCBjYXVzZSBydW50aW1lXG4gIC8vIGVycm9ycy4uLlxuICBpZiAodE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkVsZW1lbnQpIHtcbiAgICBjb25zdCBuYXRpdmUgPSBnZXROYXRpdmVCeVROb2RlKHROb2RlLCBsVmlldykgYXMgUkVsZW1lbnQ7XG4gICAgY29uc3QgbGFzdEF0dHJJbmRleCA9IHNldFVwQXR0cmlidXRlcyhsVmlld1tSRU5ERVJFUl0sIG5hdGl2ZSwgYXR0cnMpO1xuICAgIGlmICh0Vmlldy5maXJzdENyZWF0ZVBhc3MpIHtcbiAgICAgIGNvbnN0IHN0eWxpbmdOZWVkc1RvQmVSZW5kZXJlZCA9IHJlZ2lzdGVySW5pdGlhbFN0eWxpbmdPblROb2RlKHROb2RlLCBhdHRycywgbGFzdEF0dHJJbmRleCk7XG5cbiAgICAgIC8vIHRoaXMgaXMgb25seSBjYWxsZWQgZHVyaW5nIHRoZSBmaXJzdCB0ZW1wbGF0ZSBwYXNzIGluIHRoZVxuICAgICAgLy8gZXZlbnQgdGhhdCB0aGlzIGN1cnJlbnQgZGlyZWN0aXZlIGFzc2lnbmVkIGluaXRpYWwgc3R5bGUvY2xhc3NcbiAgICAgIC8vIGhvc3QgYXR0cmlidXRlIHZhbHVlcyB0byB0aGUgZWxlbWVudC4gQmVjYXVzZSBpbml0aWFsIHN0eWxpbmdcbiAgICAgIC8vIHZhbHVlcyBhcmUgYXBwbGllZCBiZWZvcmUgZGlyZWN0aXZlcyBhcmUgZmlyc3QgcmVuZGVyZWQgKHdpdGhpblxuICAgICAgLy8gYGNyZWF0ZUVsZW1lbnRgKSB0aGlzIG1lYW5zIHRoYXQgaW5pdGlhbCBzdHlsaW5nIGZvciBhbnkgZGlyZWN0aXZlc1xuICAgICAgLy8gc3RpbGwgbmVlZHMgdG8gYmUgYXBwbGllZC4gTm90ZSB0aGF0IHRoaXMgd2lsbCBvbmx5IGhhcHBlbiBkdXJpbmdcbiAgICAgIC8vIHRoZSBmaXJzdCB0ZW1wbGF0ZSBwYXNzIGFuZCBub3QgZWFjaCB0aW1lIGEgZGlyZWN0aXZlIGFwcGxpZXMgaXRzXG4gICAgICAvLyBhdHRyaWJ1dGUgdmFsdWVzIHRvIHRoZSBlbGVtZW50LlxuICAgICAgaWYgKHN0eWxpbmdOZWVkc1RvQmVSZW5kZXJlZCkge1xuICAgICAgICBjb25zdCByZW5kZXJlciA9IGxWaWV3W1JFTkRFUkVSXTtcbiAgICAgICAgcmVuZGVySW5pdGlhbFN0eWxpbmcocmVuZGVyZXIsIG5hdGl2ZSwgdE5vZGUsIHRydWUpO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBzZXREaXJlY3RpdmVTdHlsaW5nSW5wdXQoXG4gICAgY29udGV4dDogVFN0eWxpbmdDb250ZXh0IHwgU3R5bGluZ01hcEFycmF5IHwgbnVsbCwgbFZpZXc6IExWaWV3LFxuICAgIHN0eWxpbmdJbnB1dHM6IChzdHJpbmcgfCBudW1iZXIpW10sIHByb3BOYW1lOiBzdHJpbmcpIHtcbiAgLy8gb2xkZXIgdmVyc2lvbnMgb2YgQW5ndWxhciB0cmVhdCB0aGUgaW5wdXQgYXMgYG51bGxgIGluIHRoZVxuICAvLyBldmVudCB0aGF0IHRoZSB2YWx1ZSBkb2VzIG5vdCBleGlzdCBhdCBhbGwuIEZvciB0aGlzIHJlYXNvblxuICAvLyB3ZSBjYW4ndCBoYXZlIGEgc3R5bGluZyB2YWx1ZSBiZSBhbiBlbXB0eSBzdHJpbmcuXG4gIGNvbnN0IHZhbHVlID0gKGNvbnRleHQgJiYgZ2V0SW5pdGlhbFN0eWxpbmdWYWx1ZShjb250ZXh0KSkgfHwgbnVsbDtcblxuICAvLyBJdnkgZG9lcyBhbiBleHRyYSBgW2NsYXNzXWAgd3JpdGUgd2l0aCBhIGZhbHN5IHZhbHVlIHNpbmNlIHRoZSB2YWx1ZVxuICAvLyBpcyBhcHBsaWVkIGR1cmluZyBjcmVhdGlvbiBtb2RlLiBUaGlzIGlzIGEgZGV2aWF0aW9uIGZyb20gVkUgYW5kIHNob3VsZFxuICAvLyBiZSAoSmlyYSBJc3N1ZSA9IEZXLTE0NjcpLlxuICBzZXRJbnB1dHNGb3JQcm9wZXJ0eShsVmlldywgc3R5bGluZ0lucHV0cywgcHJvcE5hbWUsIHZhbHVlKTtcbn1cblxuZnVuY3Rpb24gdmFsaWRhdGVFbGVtZW50KFxuICAgIGhvc3RWaWV3OiBMVmlldywgZWxlbWVudDogUkVsZW1lbnQsIHROb2RlOiBUTm9kZSwgaGFzRGlyZWN0aXZlczogYm9vbGVhbik6IHZvaWQge1xuICBjb25zdCB0YWdOYW1lID0gdE5vZGUudGFnTmFtZTtcblxuICAvLyBJZiB0aGUgZWxlbWVudCBtYXRjaGVzIGFueSBkaXJlY3RpdmUsIGl0J3MgY29uc2lkZXJlZCBhcyB2YWxpZC5cbiAgaWYgKCFoYXNEaXJlY3RpdmVzICYmIHRhZ05hbWUgIT09IG51bGwpIHtcbiAgICAvLyBUaGUgZWxlbWVudCBpcyB1bmtub3duIGlmIGl0J3MgYW4gaW5zdGFuY2Ugb2YgSFRNTFVua25vd25FbGVtZW50IG9yIGl0IGlzbid0IHJlZ2lzdGVyZWRcbiAgICAvLyBhcyBhIGN1c3RvbSBlbGVtZW50LiBOb3RlIHRoYXQgdW5rbm93biBlbGVtZW50cyB3aXRoIGEgZGFzaCBpbiB0aGVpciBuYW1lIHdvbid0IGJlIGluc3RhbmNlc1xuICAgIC8vIG9mIEhUTUxVbmtub3duRWxlbWVudCBpbiBicm93c2VycyB0aGF0IHN1cHBvcnQgd2ViIGNvbXBvbmVudHMuXG4gICAgY29uc3QgaXNVbmtub3duID1cbiAgICAgICAgKHR5cGVvZiBIVE1MVW5rbm93bkVsZW1lbnQgPT09ICdmdW5jdGlvbicgJiYgZWxlbWVudCBpbnN0YW5jZW9mIEhUTUxVbmtub3duRWxlbWVudCkgfHxcbiAgICAgICAgKHR5cGVvZiBjdXN0b21FbGVtZW50cyAhPT0gJ3VuZGVmaW5lZCcgJiYgdGFnTmFtZS5pbmRleE9mKCctJykgPiAtMSAmJlxuICAgICAgICAgIWN1c3RvbUVsZW1lbnRzLmdldCh0YWdOYW1lKSk7XG5cbiAgICBpZiAoaXNVbmtub3duICYmICFtYXRjaGluZ1NjaGVtYXMoaG9zdFZpZXcsIHRhZ05hbWUpKSB7XG4gICAgICBsZXQgZXJyb3JNZXNzYWdlID0gYCcke3RhZ05hbWV9JyBpcyBub3QgYSBrbm93biBlbGVtZW50OlxcbmA7XG4gICAgICBlcnJvck1lc3NhZ2UgKz1cbiAgICAgICAgICBgMS4gSWYgJyR7dGFnTmFtZX0nIGlzIGFuIEFuZ3VsYXIgY29tcG9uZW50LCB0aGVuIHZlcmlmeSB0aGF0IGl0IGlzIHBhcnQgb2YgdGhpcyBtb2R1bGUuXFxuYDtcbiAgICAgIGlmICh0YWdOYW1lICYmIHRhZ05hbWUuaW5kZXhPZignLScpID4gLTEpIHtcbiAgICAgICAgZXJyb3JNZXNzYWdlICs9XG4gICAgICAgICAgICBgMi4gSWYgJyR7dGFnTmFtZX0nIGlzIGEgV2ViIENvbXBvbmVudCB0aGVuIGFkZCAnQ1VTVE9NX0VMRU1FTlRTX1NDSEVNQScgdG8gdGhlICdATmdNb2R1bGUuc2NoZW1hcycgb2YgdGhpcyBjb21wb25lbnQgdG8gc3VwcHJlc3MgdGhpcyBtZXNzYWdlLmA7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBlcnJvck1lc3NhZ2UgKz1cbiAgICAgICAgICAgIGAyLiBUbyBhbGxvdyBhbnkgZWxlbWVudCBhZGQgJ05PX0VSUk9SU19TQ0hFTUEnIHRvIHRoZSAnQE5nTW9kdWxlLnNjaGVtYXMnIG9mIHRoaXMgY29tcG9uZW50LmA7XG4gICAgICB9XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoZXJyb3JNZXNzYWdlKTtcbiAgICB9XG4gIH1cbn1cbiJdfQ==