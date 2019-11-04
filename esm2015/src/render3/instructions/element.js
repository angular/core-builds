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
    const attrs = (/** @type {?} */ (getConstant(tViewConsts, attrsIndex)));
    /** @type {?} */
    const localRefs = (/** @type {?} */ (getConstant(tViewConsts, localRefsIndex)));
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
        if (tView.firstTemplatePass) {
            registerInitialStylingOnTNode(tNode, attrs, lastAttrIndex);
        }
    }
    if ((tNode.flags & 64 /* hasInitialStyling */) === 64 /* hasInitialStyling */) {
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
    if (tView.firstTemplatePass) {
        ngDevMode && ngDevMode.firstTemplatePass++;
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
    if (tView.firstTemplatePass) {
        registerPostOrderHooks(tView, previousOrParentTNode);
        if (isContentQueryHost(previousOrParentTNode)) {
            (/** @type {?} */ (tView.queries)).elementEnd(previousOrParentTNode);
        }
    }
    if (hasClassInput(tNode)) {
        /** @type {?} */
        const inputName = selectClassBasedInputName((/** @type {?} */ (tNode.inputs)));
        setDirectiveStylingInput(tNode.classes, lView, (/** @type {?} */ (tNode.inputs))[inputName]);
    }
    if (hasStyleInput(tNode)) {
        setDirectiveStylingInput(tNode.styles, lView, (/** @type {?} */ (tNode.inputs))['style']);
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
        if (tView.firstTemplatePass) {
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
 * @return {?}
 */
function setDirectiveStylingInput(context, lView, stylingInputs) {
    // older versions of Angular treat the input as `null` in the
    // event that the value does not exist at all. For this reason
    // we can't have a styling value be an empty string.
    /** @type {?} */
    const value = (context && getInitialStylingValue(context)) || null;
    // Ivy does an extra `[class]` write with a falsy value since the value
    // is applied during creation mode. This is a deviation from VE and should
    // be (Jira Issue = FW-1467).
    setInputsForProperty(lView, stylingInputs, value);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWxlbWVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaW5zdHJ1Y3Rpb25zL2VsZW1lbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFRQSxPQUFPLEVBQUMsaUJBQWlCLEVBQUUsYUFBYSxFQUFFLFdBQVcsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQ2hGLE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSxXQUFXLENBQUM7QUFDMUMsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLHNCQUFzQixDQUFDO0FBQ3JELE9BQU8sRUFBQyxzQkFBc0IsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUloRCxPQUFPLEVBQUMsa0JBQWtCLEVBQUUsZUFBZSxFQUFDLE1BQU0sMkJBQTJCLENBQUM7QUFDOUUsT0FBTyxFQUFDLGFBQWEsRUFBUyxRQUFRLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBQyxNQUFNLG9CQUFvQixDQUFDO0FBQ2pGLE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUM5QyxPQUFPLEVBQUMsV0FBVyxFQUFDLE1BQU0sc0JBQXNCLENBQUM7QUFDakQsT0FBTyxFQUFDLHlCQUF5QixFQUFFLGVBQWUsRUFBRSxvQkFBb0IsRUFBRSxXQUFXLEVBQUUsUUFBUSxFQUFFLFlBQVksRUFBRSx3QkFBd0IsRUFBRSxnQkFBZ0IsRUFBRSx5QkFBeUIsRUFBRSxjQUFjLEVBQUUsd0JBQXdCLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDaFAsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBQ3BELE9BQU8sRUFBQyxzQkFBc0IsRUFBRSxhQUFhLEVBQUUsYUFBYSxFQUFFLHlCQUF5QixFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDdEgsT0FBTyxFQUFDLFdBQVcsRUFBRSxnQkFBZ0IsRUFBRSxRQUFRLEVBQUMsTUFB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QUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUNsRSxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUM7UUFFbEMsSUFBSSxTQUFTLElBQUksQ0FBQyxlQUFlLENBQUMsUUFBUSxFQUFFLE9BQU8sQ0FBQyxFQUFFOztnQkFDaEQsWUFBWSxHQUFHLElBQUksT0FBTyw2QkFBNkI7WUFDM0QsWUFBWTtnQkFDUixVQUFVLE9BQU8sMEVBQTBFLENBQUM7WUFDaEcsSUFBSSxPQUFPLElBQUksT0FBTyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRTtnQkFDeEMsWUFBWTtvQkFDUixVQUFVLE9BQU8sK0hBQStILENBQUM7YUFDdEo7aUJBQU07Z0JBQ0wsWUFBWTtvQkFDUiw4RkFBOEYsQ0FBQzthQUNwRztZQUNELE1BQU0sSUFBSSxLQUFLLENBQUMsWUFBWSxDQUFDLENBQUM7U0FDL0I7S0FDRjtBQUNILENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7YXNzZXJ0RGF0YUluUmFuZ2UsIGFzc2VydERlZmluZWQsIGFzc2VydEVxdWFsfSBmcm9tICcuLi8uLi91dGlsL2Fzc2VydCc7XG5pbXBvcnQge2Fzc2VydEhhc1BhcmVudH0gZnJvbSAnLi4vYXNzZXJ0JztcbmltcG9ydCB7YXR0YWNoUGF0Y2hEYXRhfSBmcm9tICcuLi9jb250ZXh0X2Rpc2NvdmVyeSc7XG5pbXBvcnQge3JlZ2lzdGVyUG9zdE9yZGVySG9va3N9IGZyb20gJy4uL2hvb2tzJztcbmltcG9ydCB7VEF0dHJpYnV0ZXMsIFROb2RlLCBUTm9kZUZsYWdzLCBUTm9kZVR5cGV9IGZyb20gJy4uL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge1JFbGVtZW50fSBmcm9tICcuLi9pbnRlcmZhY2VzL3JlbmRlcmVyJztcbmltcG9ydCB7U3R5bGluZ01hcEFycmF5LCBUU3R5bGluZ0NvbnRleHR9IGZyb20gJy4uL2ludGVyZmFjZXMvc3R5bGluZyc7XG5pbXBvcnQge2lzQ29udGVudFF1ZXJ5SG9zdCwgaXNEaXJlY3RpdmVIb3N0fSBmcm9tICcuLi9pbnRlcmZhY2VzL3R5cGVfY2hlY2tzJztcbmltcG9ydCB7SEVBREVSX09GRlNFVCwgTFZpZXcsIFJFTkRFUkVSLCBUVklFVywgVF9IT1NUfSBmcm9tICcuLi9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHthc3NlcnROb2RlVHlwZX0gZnJvbSAnLi4vbm9kZV9hc3NlcnQnO1xuaW1wb3J0IHthcHBlbmRDaGlsZH0gZnJvbSAnLi4vbm9kZV9tYW5pcHVsYXRpb24nO1xuaW1wb3J0IHtkZWNyZWFzZUVsZW1lbnREZXB0aENvdW50LCBnZXRCaW5kaW5nSW5kZXgsIGdldEVsZW1lbnREZXB0aENvdW50LCBnZXRJc1BhcmVudCwgZ2V0TFZpZXcsIGdldE5hbWVzcGFjZSwgZ2V0UHJldmlvdXNPclBhcmVudFROb2RlLCBnZXRTZWxlY3RlZEluZGV4LCBpbmNyZWFzZUVsZW1lbnREZXB0aENvdW50LCBzZXRJc05vdFBhcmVudCwgc2V0UHJldmlvdXNPclBhcmVudFROb2RlfSBmcm9tICcuLi9zdGF0ZSc7XG5pbXBvcnQge3NldFVwQXR0cmlidXRlc30gZnJvbSAnLi4vdXRpbC9hdHRyc191dGlscyc7XG5pbXBvcnQge2dldEluaXRpYWxTdHlsaW5nVmFsdWUsIGhhc0NsYXNzSW5wdXQsIGhhc1N0eWxlSW5wdXQsIHNlbGVjdENsYXNzQmFzZWRJbnB1dE5hbWV9IGZyb20gJy4uL3V0aWwvc3R5bGluZ191dGlscyc7XG5pbXBvcnQge2dldENvbnN0YW50LCBnZXROYXRpdmVCeVROb2RlLCBnZXRUTm9kZX0gZnJvbSAnLi4vdXRpbC92aWV3X3V0aWxzJztcblxuaW1wb3J0IHtjcmVhdGVEaXJlY3RpdmVzSW5zdGFuY2VzLCBlbGVtZW50Q3JlYXRlLCBleGVjdXRlQ29udGVudFF1ZXJpZXMsIGdldE9yQ3JlYXRlVE5vZGUsIG1hdGNoaW5nU2NoZW1hcywgcmVuZGVySW5pdGlhbFN0eWxpbmcsIHJlc29sdmVEaXJlY3RpdmVzLCBzYXZlUmVzb2x2ZWRMb2NhbHNJbkRhdGEsIHNldElucHV0c0ZvclByb3BlcnR5fSBmcm9tICcuL3NoYXJlZCc7XG5pbXBvcnQge3JlZ2lzdGVySW5pdGlhbFN0eWxpbmdPblROb2RlfSBmcm9tICcuL3N0eWxpbmcnO1xuXG5cblxuLyoqXG4gKiBDcmVhdGUgRE9NIGVsZW1lbnQuIFRoZSBpbnN0cnVjdGlvbiBtdXN0IGxhdGVyIGJlIGZvbGxvd2VkIGJ5IGBlbGVtZW50RW5kKClgIGNhbGwuXG4gKlxuICogQHBhcmFtIGluZGV4IEluZGV4IG9mIHRoZSBlbGVtZW50IGluIHRoZSBMVmlldyBhcnJheVxuICogQHBhcmFtIG5hbWUgTmFtZSBvZiB0aGUgRE9NIE5vZGVcbiAqIEBwYXJhbSBhdHRyc0luZGV4IEluZGV4IG9mIHRoZSBlbGVtZW50J3MgYXR0cmlidXRlcyBpbiB0aGUgYGNvbnN0c2AgYXJyYXkuXG4gKiBAcGFyYW0gbG9jYWxSZWZzSW5kZXggSW5kZXggb2YgdGhlIGVsZW1lbnQncyBsb2NhbCByZWZlcmVuY2VzIGluIHRoZSBgY29uc3RzYCBhcnJheS5cbiAqXG4gKiBBdHRyaWJ1dGVzIGFuZCBsb2NhbFJlZnMgYXJlIHBhc3NlZCBhcyBhbiBhcnJheSBvZiBzdHJpbmdzIHdoZXJlIGVsZW1lbnRzIHdpdGggYW4gZXZlbiBpbmRleFxuICogaG9sZCBhbiBhdHRyaWJ1dGUgbmFtZSBhbmQgZWxlbWVudHMgd2l0aCBhbiBvZGQgaW5kZXggaG9sZCBhbiBhdHRyaWJ1dGUgdmFsdWUsIGV4LjpcbiAqIFsnaWQnLCAnd2FybmluZzUnLCAnY2xhc3MnLCAnYWxlcnQnXVxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1ZWxlbWVudFN0YXJ0KFxuICAgIGluZGV4OiBudW1iZXIsIG5hbWU6IHN0cmluZywgYXR0cnNJbmRleD86IG51bWJlciB8IG51bGwsIGxvY2FsUmVmc0luZGV4PzogbnVtYmVyKTogdm9pZCB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgdFZpZXcgPSBsVmlld1tUVklFV107XG4gIGNvbnN0IHRWaWV3Q29uc3RzID0gdFZpZXcuY29uc3RzO1xuICBjb25zdCBhdHRycyA9IGdldENvbnN0YW50KHRWaWV3Q29uc3RzLCBhdHRyc0luZGV4KSBhcyBUQXR0cmlidXRlcztcbiAgY29uc3QgbG9jYWxSZWZzID0gZ2V0Q29uc3RhbnQodFZpZXdDb25zdHMsIGxvY2FsUmVmc0luZGV4KSBhcyBzdHJpbmdbXTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEVxdWFsKFxuICAgICAgICAgICAgICAgICAgIGdldEJpbmRpbmdJbmRleCgpLCB0Vmlldy5iaW5kaW5nU3RhcnRJbmRleCxcbiAgICAgICAgICAgICAgICAgICAnZWxlbWVudHMgc2hvdWxkIGJlIGNyZWF0ZWQgYmVmb3JlIGFueSBiaW5kaW5ncycpO1xuICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyQ3JlYXRlRWxlbWVudCsrO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGF0YUluUmFuZ2UobFZpZXcsIGluZGV4ICsgSEVBREVSX09GRlNFVCk7XG4gIGNvbnN0IHJlbmRlcmVyID0gbFZpZXdbUkVOREVSRVJdO1xuICBjb25zdCBuYXRpdmUgPSBsVmlld1tpbmRleCArIEhFQURFUl9PRkZTRVRdID0gZWxlbWVudENyZWF0ZShuYW1lLCByZW5kZXJlciwgZ2V0TmFtZXNwYWNlKCkpO1xuICBjb25zdCB0Tm9kZSA9IGdldE9yQ3JlYXRlVE5vZGUodFZpZXcsIGxWaWV3W1RfSE9TVF0sIGluZGV4LCBUTm9kZVR5cGUuRWxlbWVudCwgbmFtZSwgYXR0cnMpO1xuXG4gIGlmIChhdHRycyAhPSBudWxsKSB7XG4gICAgY29uc3QgbGFzdEF0dHJJbmRleCA9IHNldFVwQXR0cmlidXRlcyhyZW5kZXJlciwgbmF0aXZlLCBhdHRycyk7XG4gICAgaWYgKHRWaWV3LmZpcnN0VGVtcGxhdGVQYXNzKSB7XG4gICAgICByZWdpc3RlckluaXRpYWxTdHlsaW5nT25UTm9kZSh0Tm9kZSwgYXR0cnMsIGxhc3RBdHRySW5kZXgpO1xuICAgIH1cbiAgfVxuXG4gIGlmICgodE5vZGUuZmxhZ3MgJiBUTm9kZUZsYWdzLmhhc0luaXRpYWxTdHlsaW5nKSA9PT0gVE5vZGVGbGFncy5oYXNJbml0aWFsU3R5bGluZykge1xuICAgIHJlbmRlckluaXRpYWxTdHlsaW5nKHJlbmRlcmVyLCBuYXRpdmUsIHROb2RlLCBmYWxzZSk7XG4gIH1cblxuICBhcHBlbmRDaGlsZChuYXRpdmUsIHROb2RlLCBsVmlldyk7XG5cbiAgLy8gYW55IGltbWVkaWF0ZSBjaGlsZHJlbiBvZiBhIGNvbXBvbmVudCBvciB0ZW1wbGF0ZSBjb250YWluZXIgbXVzdCBiZSBwcmUtZW1wdGl2ZWx5XG4gIC8vIG1vbmtleS1wYXRjaGVkIHdpdGggdGhlIGNvbXBvbmVudCB2aWV3IGRhdGEgc28gdGhhdCB0aGUgZWxlbWVudCBjYW4gYmUgaW5zcGVjdGVkXG4gIC8vIGxhdGVyIG9uIHVzaW5nIGFueSBlbGVtZW50IGRpc2NvdmVyeSB1dGlsaXR5IG1ldGhvZHMgKHNlZSBgZWxlbWVudF9kaXNjb3ZlcnkudHNgKVxuICBpZiAoZ2V0RWxlbWVudERlcHRoQ291bnQoKSA9PT0gMCkge1xuICAgIGF0dGFjaFBhdGNoRGF0YShuYXRpdmUsIGxWaWV3KTtcbiAgfVxuICBpbmNyZWFzZUVsZW1lbnREZXB0aENvdW50KCk7XG5cbiAgLy8gaWYgYSBkaXJlY3RpdmUgY29udGFpbnMgYSBob3N0IGJpbmRpbmcgZm9yIFwiY2xhc3NcIiB0aGVuIGFsbCBjbGFzcy1iYXNlZCBkYXRhIHdpbGxcbiAgLy8gZmxvdyB0aHJvdWdoIHRoYXQgKGV4Y2VwdCBmb3IgYFtjbGFzcy5wcm9wXWAgYmluZGluZ3MpLiBUaGlzIGFsc28gaW5jbHVkZXMgaW5pdGlhbFxuICAvLyBzdGF0aWMgY2xhc3MgdmFsdWVzIGFzIHdlbGwuIChOb3RlIHRoYXQgdGhpcyB3aWxsIGJlIGZpeGVkIG9uY2UgbWFwLWJhc2VkIGBbc3R5bGVdYFxuICAvLyBhbmQgYFtjbGFzc11gIGJpbmRpbmdzIHdvcmsgZm9yIG11bHRpcGxlIGRpcmVjdGl2ZXMuKVxuICBpZiAodFZpZXcuZmlyc3RUZW1wbGF0ZVBhc3MpIHtcbiAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLmZpcnN0VGVtcGxhdGVQYXNzKys7XG4gICAgY29uc3QgaGFzRGlyZWN0aXZlcyA9IHJlc29sdmVEaXJlY3RpdmVzKHRWaWV3LCBsVmlldywgdE5vZGUsIGxvY2FsUmVmcyk7XG4gICAgbmdEZXZNb2RlICYmIHZhbGlkYXRlRWxlbWVudChsVmlldywgbmF0aXZlLCB0Tm9kZSwgaGFzRGlyZWN0aXZlcyk7XG5cbiAgICBpZiAodFZpZXcucXVlcmllcyAhPT0gbnVsbCkge1xuICAgICAgdFZpZXcucXVlcmllcy5lbGVtZW50U3RhcnQodFZpZXcsIHROb2RlKTtcbiAgICB9XG4gIH1cblxuICBpZiAoaXNEaXJlY3RpdmVIb3N0KHROb2RlKSkge1xuICAgIGNyZWF0ZURpcmVjdGl2ZXNJbnN0YW5jZXModFZpZXcsIGxWaWV3LCB0Tm9kZSk7XG4gICAgZXhlY3V0ZUNvbnRlbnRRdWVyaWVzKHRWaWV3LCB0Tm9kZSwgbFZpZXcpO1xuICB9XG4gIGlmIChsb2NhbFJlZnMgIT0gbnVsbCkge1xuICAgIHNhdmVSZXNvbHZlZExvY2Fsc0luRGF0YShsVmlldywgdE5vZGUpO1xuICB9XG59XG5cbi8qKlxuICogTWFyayB0aGUgZW5kIG9mIHRoZSBlbGVtZW50LlxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1ZWxlbWVudEVuZCgpOiB2b2lkIHtcbiAgbGV0IHByZXZpb3VzT3JQYXJlbnRUTm9kZSA9IGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSgpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChwcmV2aW91c09yUGFyZW50VE5vZGUsICdObyBwYXJlbnQgbm9kZSB0byBjbG9zZS4nKTtcbiAgaWYgKGdldElzUGFyZW50KCkpIHtcbiAgICBzZXRJc05vdFBhcmVudCgpO1xuICB9IGVsc2Uge1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnRIYXNQYXJlbnQoZ2V0UHJldmlvdXNPclBhcmVudFROb2RlKCkpO1xuICAgIHByZXZpb3VzT3JQYXJlbnRUTm9kZSA9IHByZXZpb3VzT3JQYXJlbnRUTm9kZS5wYXJlbnQgITtcbiAgICBzZXRQcmV2aW91c09yUGFyZW50VE5vZGUocHJldmlvdXNPclBhcmVudFROb2RlLCBmYWxzZSk7XG4gIH1cblxuICBjb25zdCB0Tm9kZSA9IHByZXZpb3VzT3JQYXJlbnRUTm9kZTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVUeXBlKHROb2RlLCBUTm9kZVR5cGUuRWxlbWVudCk7XG5cbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcblxuICBkZWNyZWFzZUVsZW1lbnREZXB0aENvdW50KCk7XG5cbiAgaWYgKHRWaWV3LmZpcnN0VGVtcGxhdGVQYXNzKSB7XG4gICAgcmVnaXN0ZXJQb3N0T3JkZXJIb29rcyh0VmlldywgcHJldmlvdXNPclBhcmVudFROb2RlKTtcbiAgICBpZiAoaXNDb250ZW50UXVlcnlIb3N0KHByZXZpb3VzT3JQYXJlbnRUTm9kZSkpIHtcbiAgICAgIHRWaWV3LnF1ZXJpZXMgIS5lbGVtZW50RW5kKHByZXZpb3VzT3JQYXJlbnRUTm9kZSk7XG4gICAgfVxuICB9XG5cbiAgaWYgKGhhc0NsYXNzSW5wdXQodE5vZGUpKSB7XG4gICAgY29uc3QgaW5wdXROYW1lOiBzdHJpbmcgPSBzZWxlY3RDbGFzc0Jhc2VkSW5wdXROYW1lKHROb2RlLmlucHV0cyAhKTtcbiAgICBzZXREaXJlY3RpdmVTdHlsaW5nSW5wdXQodE5vZGUuY2xhc3NlcywgbFZpZXcsIHROb2RlLmlucHV0cyAhW2lucHV0TmFtZV0pO1xuICB9XG5cbiAgaWYgKGhhc1N0eWxlSW5wdXQodE5vZGUpKSB7XG4gICAgc2V0RGlyZWN0aXZlU3R5bGluZ0lucHV0KHROb2RlLnN0eWxlcywgbFZpZXcsIHROb2RlLmlucHV0cyAhWydzdHlsZSddKTtcbiAgfVxufVxuXG5cbi8qKlxuICogQ3JlYXRlcyBhbiBlbXB0eSBlbGVtZW50IHVzaW5nIHtAbGluayBlbGVtZW50U3RhcnR9IGFuZCB7QGxpbmsgZWxlbWVudEVuZH1cbiAqXG4gKiBAcGFyYW0gaW5kZXggSW5kZXggb2YgdGhlIGVsZW1lbnQgaW4gdGhlIGRhdGEgYXJyYXlcbiAqIEBwYXJhbSBuYW1lIE5hbWUgb2YgdGhlIERPTSBOb2RlXG4gKiBAcGFyYW0gYXR0cnNJbmRleCBJbmRleCBvZiB0aGUgZWxlbWVudCdzIGF0dHJpYnV0ZXMgaW4gdGhlIGBjb25zdHNgIGFycmF5LlxuICogQHBhcmFtIGxvY2FsUmVmc0luZGV4IEluZGV4IG9mIHRoZSBlbGVtZW50J3MgbG9jYWwgcmVmZXJlbmNlcyBpbiB0aGUgYGNvbnN0c2AgYXJyYXkuXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVlbGVtZW50KFxuICAgIGluZGV4OiBudW1iZXIsIG5hbWU6IHN0cmluZywgYXR0cnNJbmRleD86IG51bWJlciB8IG51bGwsIGxvY2FsUmVmc0luZGV4PzogbnVtYmVyKTogdm9pZCB7XG4gIMm1ybVlbGVtZW50U3RhcnQoaW5kZXgsIG5hbWUsIGF0dHJzSW5kZXgsIGxvY2FsUmVmc0luZGV4KTtcbiAgybXJtWVsZW1lbnRFbmQoKTtcbn1cblxuLyoqXG4gKiBBc3NpZ24gc3RhdGljIGF0dHJpYnV0ZSB2YWx1ZXMgdG8gYSBob3N0IGVsZW1lbnQuXG4gKlxuICogVGhpcyBpbnN0cnVjdGlvbiB3aWxsIGFzc2lnbiBzdGF0aWMgYXR0cmlidXRlIHZhbHVlcyBhcyB3ZWxsIGFzIGNsYXNzIGFuZCBzdHlsZVxuICogdmFsdWVzIHRvIGFuIGVsZW1lbnQgd2l0aGluIHRoZSBob3N0IGJpbmRpbmdzIGZ1bmN0aW9uLiBTaW5jZSBhdHRyaWJ1dGUgdmFsdWVzXG4gKiBjYW4gY29uc2lzdCBvZiBkaWZmZXJlbnQgdHlwZXMgb2YgdmFsdWVzLCB0aGUgYGF0dHJzYCBhcnJheSBtdXN0IGluY2x1ZGUgdGhlIHZhbHVlcyBpblxuICogdGhlIGZvbGxvd2luZyBmb3JtYXQ6XG4gKlxuICogYXR0cnMgPSBbXG4gKiAgIC8vIHN0YXRpYyBhdHRyaWJ1dGVzIChsaWtlIGB0aXRsZWAsIGBuYW1lYCwgYGlkYC4uLilcbiAqICAgYXR0cjEsIHZhbHVlMSwgYXR0cjIsIHZhbHVlLFxuICpcbiAqICAgLy8gYSBzaW5nbGUgbmFtZXNwYWNlIHZhbHVlIChsaWtlIGB4OmlkYClcbiAqICAgTkFNRVNQQUNFX01BUktFUiwgbmFtZXNwYWNlVXJpMSwgbmFtZTEsIHZhbHVlMSxcbiAqXG4gKiAgIC8vIGFub3RoZXIgc2luZ2xlIG5hbWVzcGFjZSB2YWx1ZSAobGlrZSBgeDpuYW1lYClcbiAqICAgTkFNRVNQQUNFX01BUktFUiwgbmFtZXNwYWNlVXJpMiwgbmFtZTIsIHZhbHVlMixcbiAqXG4gKiAgIC8vIGEgc2VyaWVzIG9mIENTUyBjbGFzc2VzIHRoYXQgd2lsbCBiZSBhcHBsaWVkIHRvIHRoZSBlbGVtZW50IChubyBzcGFjZXMpXG4gKiAgIENMQVNTRVNfTUFSS0VSLCBjbGFzczEsIGNsYXNzMiwgY2xhc3MzLFxuICpcbiAqICAgLy8gYSBzZXJpZXMgb2YgQ1NTIHN0eWxlcyAocHJvcGVydHkgKyB2YWx1ZSkgdGhhdCB3aWxsIGJlIGFwcGxpZWQgdG8gdGhlIGVsZW1lbnRcbiAqICAgU1RZTEVTX01BUktFUiwgcHJvcDEsIHZhbHVlMSwgcHJvcDIsIHZhbHVlMlxuICogXVxuICpcbiAqIEFsbCBub24tY2xhc3MgYW5kIG5vbi1zdHlsZSBhdHRyaWJ1dGVzIG11c3QgYmUgZGVmaW5lZCBhdCB0aGUgc3RhcnQgb2YgdGhlIGxpc3RcbiAqIGZpcnN0IGJlZm9yZSBhbGwgY2xhc3MgYW5kIHN0eWxlIHZhbHVlcyBhcmUgc2V0LiBXaGVuIHRoZXJlIGlzIGEgY2hhbmdlIGluIHZhbHVlXG4gKiB0eXBlIChsaWtlIHdoZW4gY2xhc3NlcyBhbmQgc3R5bGVzIGFyZSBpbnRyb2R1Y2VkKSBhIG1hcmtlciBtdXN0IGJlIHVzZWQgdG8gc2VwYXJhdGVcbiAqIHRoZSBlbnRyaWVzLiBUaGUgbWFya2VyIHZhbHVlcyB0aGVtc2VsdmVzIGFyZSBzZXQgdmlhIGVudHJpZXMgZm91bmQgaW4gdGhlXG4gKiBbQXR0cmlidXRlTWFya2VyXSBlbnVtLlxuICpcbiAqIE5PVEU6IFRoaXMgaW5zdHJ1Y3Rpb24gaXMgbWVhbnQgdG8gdXNlZCBmcm9tIGBob3N0QmluZGluZ3NgIGZ1bmN0aW9uIG9ubHkuXG4gKlxuICogQHBhcmFtIGRpcmVjdGl2ZSBBIGRpcmVjdGl2ZSBpbnN0YW5jZSB0aGUgc3R5bGluZyBpcyBhc3NvY2lhdGVkIHdpdGguXG4gKiBAcGFyYW0gYXR0cnMgQW4gYXJyYXkgb2Ygc3RhdGljIHZhbHVlcyAoYXR0cmlidXRlcywgY2xhc3NlcyBhbmQgc3R5bGVzKSB3aXRoIHRoZSBjb3JyZWN0IG1hcmtlclxuICogdmFsdWVzLlxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1ZWxlbWVudEhvc3RBdHRycyhhdHRyczogVEF0dHJpYnV0ZXMpIHtcbiAgY29uc3QgaG9zdEVsZW1lbnRJbmRleCA9IGdldFNlbGVjdGVkSW5kZXgoKTtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgY29uc3QgdE5vZGUgPSBnZXRUTm9kZShob3N0RWxlbWVudEluZGV4LCBsVmlldyk7XG5cbiAgLy8gbm9uLWVsZW1lbnQgbm9kZXMgKGUuZy4gYDxuZy1jb250YWluZXI+YCkgYXJlIG5vdCByZW5kZXJlZCBhcyBhY3R1YWxcbiAgLy8gZWxlbWVudCBub2RlcyBhbmQgYWRkaW5nIHN0eWxlcy9jbGFzc2VzIG9uIHRvIHRoZW0gd2lsbCBjYXVzZSBydW50aW1lXG4gIC8vIGVycm9ycy4uLlxuICBpZiAodE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkVsZW1lbnQpIHtcbiAgICBjb25zdCBuYXRpdmUgPSBnZXROYXRpdmVCeVROb2RlKHROb2RlLCBsVmlldykgYXMgUkVsZW1lbnQ7XG4gICAgY29uc3QgbGFzdEF0dHJJbmRleCA9IHNldFVwQXR0cmlidXRlcyhsVmlld1tSRU5ERVJFUl0sIG5hdGl2ZSwgYXR0cnMpO1xuICAgIGlmICh0Vmlldy5maXJzdFRlbXBsYXRlUGFzcykge1xuICAgICAgY29uc3Qgc3R5bGluZ05lZWRzVG9CZVJlbmRlcmVkID0gcmVnaXN0ZXJJbml0aWFsU3R5bGluZ09uVE5vZGUodE5vZGUsIGF0dHJzLCBsYXN0QXR0ckluZGV4KTtcblxuICAgICAgLy8gdGhpcyBpcyBvbmx5IGNhbGxlZCBkdXJpbmcgdGhlIGZpcnN0IHRlbXBsYXRlIHBhc3MgaW4gdGhlXG4gICAgICAvLyBldmVudCB0aGF0IHRoaXMgY3VycmVudCBkaXJlY3RpdmUgYXNzaWduZWQgaW5pdGlhbCBzdHlsZS9jbGFzc1xuICAgICAgLy8gaG9zdCBhdHRyaWJ1dGUgdmFsdWVzIHRvIHRoZSBlbGVtZW50LiBCZWNhdXNlIGluaXRpYWwgc3R5bGluZ1xuICAgICAgLy8gdmFsdWVzIGFyZSBhcHBsaWVkIGJlZm9yZSBkaXJlY3RpdmVzIGFyZSBmaXJzdCByZW5kZXJlZCAod2l0aGluXG4gICAgICAvLyBgY3JlYXRlRWxlbWVudGApIHRoaXMgbWVhbnMgdGhhdCBpbml0aWFsIHN0eWxpbmcgZm9yIGFueSBkaXJlY3RpdmVzXG4gICAgICAvLyBzdGlsbCBuZWVkcyB0byBiZSBhcHBsaWVkLiBOb3RlIHRoYXQgdGhpcyB3aWxsIG9ubHkgaGFwcGVuIGR1cmluZ1xuICAgICAgLy8gdGhlIGZpcnN0IHRlbXBsYXRlIHBhc3MgYW5kIG5vdCBlYWNoIHRpbWUgYSBkaXJlY3RpdmUgYXBwbGllcyBpdHNcbiAgICAgIC8vIGF0dHJpYnV0ZSB2YWx1ZXMgdG8gdGhlIGVsZW1lbnQuXG4gICAgICBpZiAoc3R5bGluZ05lZWRzVG9CZVJlbmRlcmVkKSB7XG4gICAgICAgIGNvbnN0IHJlbmRlcmVyID0gbFZpZXdbUkVOREVSRVJdO1xuICAgICAgICByZW5kZXJJbml0aWFsU3R5bGluZyhyZW5kZXJlciwgbmF0aXZlLCB0Tm9kZSwgdHJ1ZSk7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIHNldERpcmVjdGl2ZVN0eWxpbmdJbnB1dChcbiAgICBjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQgfCBTdHlsaW5nTWFwQXJyYXkgfCBudWxsLCBsVmlldzogTFZpZXcsXG4gICAgc3R5bGluZ0lucHV0czogKHN0cmluZyB8IG51bWJlcilbXSkge1xuICAvLyBvbGRlciB2ZXJzaW9ucyBvZiBBbmd1bGFyIHRyZWF0IHRoZSBpbnB1dCBhcyBgbnVsbGAgaW4gdGhlXG4gIC8vIGV2ZW50IHRoYXQgdGhlIHZhbHVlIGRvZXMgbm90IGV4aXN0IGF0IGFsbC4gRm9yIHRoaXMgcmVhc29uXG4gIC8vIHdlIGNhbid0IGhhdmUgYSBzdHlsaW5nIHZhbHVlIGJlIGFuIGVtcHR5IHN0cmluZy5cbiAgY29uc3QgdmFsdWUgPSAoY29udGV4dCAmJiBnZXRJbml0aWFsU3R5bGluZ1ZhbHVlKGNvbnRleHQpKSB8fCBudWxsO1xuXG4gIC8vIEl2eSBkb2VzIGFuIGV4dHJhIGBbY2xhc3NdYCB3cml0ZSB3aXRoIGEgZmFsc3kgdmFsdWUgc2luY2UgdGhlIHZhbHVlXG4gIC8vIGlzIGFwcGxpZWQgZHVyaW5nIGNyZWF0aW9uIG1vZGUuIFRoaXMgaXMgYSBkZXZpYXRpb24gZnJvbSBWRSBhbmQgc2hvdWxkXG4gIC8vIGJlIChKaXJhIElzc3VlID0gRlctMTQ2NykuXG4gIHNldElucHV0c0ZvclByb3BlcnR5KGxWaWV3LCBzdHlsaW5nSW5wdXRzLCB2YWx1ZSk7XG59XG5cbmZ1bmN0aW9uIHZhbGlkYXRlRWxlbWVudChcbiAgICBob3N0VmlldzogTFZpZXcsIGVsZW1lbnQ6IFJFbGVtZW50LCB0Tm9kZTogVE5vZGUsIGhhc0RpcmVjdGl2ZXM6IGJvb2xlYW4pOiB2b2lkIHtcbiAgY29uc3QgdGFnTmFtZSA9IHROb2RlLnRhZ05hbWU7XG5cbiAgLy8gSWYgdGhlIGVsZW1lbnQgbWF0Y2hlcyBhbnkgZGlyZWN0aXZlLCBpdCdzIGNvbnNpZGVyZWQgYXMgdmFsaWQuXG4gIGlmICghaGFzRGlyZWN0aXZlcyAmJiB0YWdOYW1lICE9PSBudWxsKSB7XG4gICAgLy8gVGhlIGVsZW1lbnQgaXMgdW5rbm93biBpZiBpdCdzIGFuIGluc3RhbmNlIG9mIEhUTUxVbmtub3duRWxlbWVudCBvciBpdCBpc24ndCByZWdpc3RlcmVkXG4gICAgLy8gYXMgYSBjdXN0b20gZWxlbWVudC4gTm90ZSB0aGF0IHVua25vd24gZWxlbWVudHMgd2l0aCBhIGRhc2ggaW4gdGhlaXIgbmFtZSB3b24ndCBiZSBpbnN0YW5jZXNcbiAgICAvLyBvZiBIVE1MVW5rbm93bkVsZW1lbnQgaW4gYnJvd3NlcnMgdGhhdCBzdXBwb3J0IHdlYiBjb21wb25lbnRzLlxuICAgIGNvbnN0IGlzVW5rbm93biA9XG4gICAgICAgICh0eXBlb2YgSFRNTFVua25vd25FbGVtZW50ID09PSAnZnVuY3Rpb24nICYmIGVsZW1lbnQgaW5zdGFuY2VvZiBIVE1MVW5rbm93bkVsZW1lbnQpIHx8XG4gICAgICAgICh0eXBlb2YgY3VzdG9tRWxlbWVudHMgIT09ICd1bmRlZmluZWQnICYmIHRhZ05hbWUuaW5kZXhPZignLScpID4gLTEgJiZcbiAgICAgICAgICFjdXN0b21FbGVtZW50cy5nZXQodGFnTmFtZSkpO1xuXG4gICAgaWYgKGlzVW5rbm93biAmJiAhbWF0Y2hpbmdTY2hlbWFzKGhvc3RWaWV3LCB0YWdOYW1lKSkge1xuICAgICAgbGV0IGVycm9yTWVzc2FnZSA9IGAnJHt0YWdOYW1lfScgaXMgbm90IGEga25vd24gZWxlbWVudDpcXG5gO1xuICAgICAgZXJyb3JNZXNzYWdlICs9XG4gICAgICAgICAgYDEuIElmICcke3RhZ05hbWV9JyBpcyBhbiBBbmd1bGFyIGNvbXBvbmVudCwgdGhlbiB2ZXJpZnkgdGhhdCBpdCBpcyBwYXJ0IG9mIHRoaXMgbW9kdWxlLlxcbmA7XG4gICAgICBpZiAodGFnTmFtZSAmJiB0YWdOYW1lLmluZGV4T2YoJy0nKSA+IC0xKSB7XG4gICAgICAgIGVycm9yTWVzc2FnZSArPVxuICAgICAgICAgICAgYDIuIElmICcke3RhZ05hbWV9JyBpcyBhIFdlYiBDb21wb25lbnQgdGhlbiBhZGQgJ0NVU1RPTV9FTEVNRU5UU19TQ0hFTUEnIHRvIHRoZSAnQE5nTW9kdWxlLnNjaGVtYXMnIG9mIHRoaXMgY29tcG9uZW50IHRvIHN1cHByZXNzIHRoaXMgbWVzc2FnZS5gO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZXJyb3JNZXNzYWdlICs9XG4gICAgICAgICAgICBgMi4gVG8gYWxsb3cgYW55IGVsZW1lbnQgYWRkICdOT19FUlJPUlNfU0NIRU1BJyB0byB0aGUgJ0BOZ01vZHVsZS5zY2hlbWFzJyBvZiB0aGlzIGNvbXBvbmVudC5gO1xuICAgICAgfVxuICAgICAgdGhyb3cgbmV3IEVycm9yKGVycm9yTWVzc2FnZSk7XG4gICAgfVxuICB9XG59XG4iXX0=