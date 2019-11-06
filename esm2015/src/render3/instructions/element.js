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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWxlbWVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaW5zdHJ1Y3Rpb25zL2VsZW1lbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFRQSxPQUFPLEVBQUMsaUJBQWlCLEVBQUUsYUFBYSxFQUFFLFdBQVcsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQ2hGLE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSxXQUFXLENBQUM7QUFDMUMsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLHNCQUFzQixDQUFDO0FBQ3JELE9BQU8sRUFBQyxzQkFBc0IsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUloRCxPQUFPLEVBQUMsa0JBQWtCLEVBQUUsZUFBZSxFQUFDLE1BQU0sMkJBQTJCLENBQUM7QUFDOUUsT0FBTyxFQUFDLGFBQWEsRUFBUyxRQUFRLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBQyxNQUFNLG9CQUFvQixDQUFDO0FBQ2pGLE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUM5QyxPQUFPLEVBQUMsV0FBVyxFQUFDLE1BQU0sc0JBQXNCLENBQUM7QUFDakQsT0FBTyxFQUFDLHlCQUF5QixFQUFFLGVBQWUsRUFBRSxvQkFBb0IsRUFBRSxXQUFXLEVBQUUsUUFBUSxFQUFFLFlBQVksRUFBRSx3QkFBd0IsRUFBRSxnQkFBZ0IsRUFBRSx5QkFBeUIsRUFBRSxjQUFjLEVBQUUsd0JBQXdCLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDaFAsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBQ3BELE9BQU8sRUFBQyxzQkFBc0IsRUFBRSxhQUFhLEVBQUUsYUFBYSxFQUFFLHlCQUF5QixFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDdEgsT0FBTyxFQUFDLFdBQVcsRUFBRSxnQkFBZ0IsRUFBRSxRQUFRLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUUzRSxPQUFPLEVBQUMseUJBQXlCLEVBQUUsYUFBYSxFQUFFLHFCQUFxQixFQUFFLGdCQUFnQixFQUFFLGVBQWUsRUFBRSxvQkFBb0IsRUFBRSxpQkFBaUIsRUFBRSx3QkFBd0IsRUFBRSxvQkFBb0IsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUNyTixPQUFPLEVBQUMsNkJBQTZCLEVBQUMsTUFBTSxXQUFXLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7QUFrQnhELE1BQU0sVUFBVSxjQUFjLENBQzFCLEtBQWEsRUFBRSxJQUFZLEVBQUUsVUFBMEIsRUFBRSxjQUF1Qjs7VUFDNUUsS0FBSyxHQUFHLFFBQVEsRUFBRTs7VUFDbEIsS0FBSyxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUM7O1VBQ3BCLFdBQVcsR0FBRyxLQUFLLENBQUMsTUFBTTs7VUFDMUIsS0FBSyxHQUFHLG1CQUFBLFdBQVcsQ0FBQyxXQUFXLEVBQUUsVUFBVSxDQUFDLEVBQWU7O1VBQzNELFNBQVMsR0FBRyxtQkFBQSxXQUFXLENBQUMsV0FBVyxFQUFFLGNBQWMsQ0FBQyxFQUFZO0lBQ3RFLFNBQVMsSUFBSSxXQUFXLENBQ1AsZUFBZSxFQUFFLEVBQUUsS0FBSyxDQUFDLGlCQUFpQixFQUMxQyxnREFBZ0QsQ0FBQyxDQUFDO0lBQ25FLFNBQVMsSUFBSSxTQUFTLENBQUMscUJBQXFCLEVBQUUsQ0FBQztJQUMvQyxTQUFTLElBQUksaUJBQWlCLENBQUMsS0FBSyxFQUFFLEtBQUssR0FBRyxhQUFhLENBQUMsQ0FBQzs7VUFDdkQsUUFBUSxHQUFHLEtBQUssQ0FBQyxRQUFRLENBQUM7O1VBQzFCLE1BQU0sR0FBRyxLQUFLLENBQUMsS0FBSyxHQUFHLGFBQWEsQ0FBQyxHQUFHLGFBQWEsQ0FBQyxJQUFJLEVBQUUsUUFBUSxFQUFFLFlBQVksRUFBRSxDQUFDOztVQUNyRixLQUFLLEdBQUcsZ0JBQWdCLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxNQUFNLENBQUMsRUFBRSxLQUFLLG1CQUFxQixJQUFJLEVBQUUsS0FBSyxDQUFDO0lBRTNGLElBQUksS0FBSyxJQUFJLElBQUksRUFBRTs7Y0FDWCxhQUFhLEdBQUcsZUFBZSxDQUFDLFFBQVEsRUFBRSxNQUFNLEVBQUUsS0FBSyxDQUFDO1FBQzlELElBQUksS0FBSyxDQUFDLGVBQWUsRUFBRTtZQUN6Qiw2QkFBNkIsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLGFBQWEsQ0FBQyxDQUFDO1NBQzVEO0tBQ0Y7SUFFRCxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssOEJBQStCLENBQUMsZ0NBQWlDLEVBQUU7UUFDakYsb0JBQW9CLENBQUMsUUFBUSxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7S0FDdEQ7SUFFRCxXQUFXLENBQUMsTUFBTSxFQUFFLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztJQUVsQyxvRkFBb0Y7SUFDcEYsbUZBQW1GO0lBQ25GLG9GQUFvRjtJQUNwRixJQUFJLG9CQUFvQixFQUFFLEtBQUssQ0FBQyxFQUFFO1FBQ2hDLGVBQWUsQ0FBQyxNQUFNLEVBQUUsS0FBSyxDQUFDLENBQUM7S0FDaEM7SUFDRCx5QkFBeUIsRUFBRSxDQUFDO0lBRTVCLG9GQUFvRjtJQUNwRixxRkFBcUY7SUFDckYsc0ZBQXNGO0lBQ3RGLHdEQUF3RDtJQUN4RCxJQUFJLEtBQUssQ0FBQyxlQUFlLEVBQUU7UUFDekIsU0FBUyxJQUFJLFNBQVMsQ0FBQyxlQUFlLEVBQUUsQ0FBQzs7Y0FDbkMsYUFBYSxHQUFHLGlCQUFpQixDQUFDLEtBQUssRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLFNBQVMsQ0FBQztRQUN2RSxTQUFTLElBQUksZUFBZSxDQUFDLEtBQUssRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLGFBQWEsQ0FBQyxDQUFDO1FBRWxFLElBQUksS0FBSyxDQUFDLE9BQU8sS0FBSyxJQUFJLEVBQUU7WUFDMUIsS0FBSyxDQUFDLE9BQU8sQ0FBQyxZQUFZLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO1NBQzFDO0tBQ0Y7SUFFRCxJQUFJLGVBQWUsQ0FBQyxLQUFLLENBQUMsRUFBRTtRQUMxQix5QkFBeUIsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQy9DLHFCQUFxQixDQUFDLEtBQUssRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7S0FDNUM7SUFDRCxJQUFJLFNBQVMsSUFBSSxJQUFJLEVBQUU7UUFDckIsd0JBQXdCLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO0tBQ3hDO0FBQ0gsQ0FBQzs7Ozs7OztBQU9ELE1BQU0sVUFBVSxZQUFZOztRQUN0QixxQkFBcUIsR0FBRyx3QkFBd0IsRUFBRTtJQUN0RCxTQUFTLElBQUksYUFBYSxDQUFDLHFCQUFxQixFQUFFLDBCQUEwQixDQUFDLENBQUM7SUFDOUUsSUFBSSxXQUFXLEVBQUUsRUFBRTtRQUNqQixjQUFjLEVBQUUsQ0FBQztLQUNsQjtTQUFNO1FBQ0wsU0FBUyxJQUFJLGVBQWUsQ0FBQyx3QkFBd0IsRUFBRSxDQUFDLENBQUM7UUFDekQscUJBQXFCLEdBQUcsbUJBQUEscUJBQXFCLENBQUMsTUFBTSxFQUFFLENBQUM7UUFDdkQsd0JBQXdCLENBQUMscUJBQXFCLEVBQUUsS0FBSyxDQUFDLENBQUM7S0FDeEQ7O1VBRUssS0FBSyxHQUFHLHFCQUFxQjtJQUNuQyxTQUFTLElBQUksY0FBYyxDQUFDLEtBQUssa0JBQW9CLENBQUM7O1VBRWhELEtBQUssR0FBRyxRQUFRLEVBQUU7O1VBQ2xCLEtBQUssR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDO0lBRTFCLHlCQUF5QixFQUFFLENBQUM7SUFFNUIsSUFBSSxLQUFLLENBQUMsZUFBZSxFQUFFO1FBQ3pCLHNCQUFzQixDQUFDLEtBQUssRUFBRSxxQkFBcUIsQ0FBQyxDQUFDO1FBQ3JELElBQUksa0JBQWtCLENBQUMscUJBQXFCLENBQUMsRUFBRTtZQUM3QyxtQkFBQSxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUMsVUFBVSxDQUFDLHFCQUFxQixDQUFDLENBQUM7U0FDbkQ7S0FDRjtJQUVELElBQUksYUFBYSxDQUFDLEtBQUssQ0FBQyxFQUFFOztjQUNsQixTQUFTLEdBQVcseUJBQXlCLENBQUMsbUJBQUEsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBQ25FLHdCQUF3QixDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsS0FBSyxFQUFFLG1CQUFBLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDO0tBQzNFO0lBRUQsSUFBSSxhQUFhLENBQUMsS0FBSyxDQUFDLEVBQUU7UUFDeEIsd0JBQXdCLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxLQUFLLEVBQUUsbUJBQUEsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7S0FDeEU7QUFDSCxDQUFDOzs7Ozs7Ozs7Ozs7QUFhRCxNQUFNLFVBQVUsU0FBUyxDQUNyQixLQUFhLEVBQUUsSUFBWSxFQUFFLFVBQTBCLEVBQUUsY0FBdUI7SUFDbEYsY0FBYyxDQUFDLEtBQUssRUFBRSxJQUFJLEVBQUUsVUFBVSxFQUFFLGNBQWMsQ0FBQyxDQUFDO0lBQ3hELFlBQVksRUFBRSxDQUFDO0FBQ2pCLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUF5Q0QsTUFBTSxVQUFVLGtCQUFrQixDQUFDLEtBQWtCOztVQUM3QyxnQkFBZ0IsR0FBRyxnQkFBZ0IsRUFBRTs7VUFDckMsS0FBSyxHQUFHLFFBQVEsRUFBRTs7VUFDbEIsS0FBSyxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUM7O1VBQ3BCLEtBQUssR0FBRyxRQUFRLENBQUMsZ0JBQWdCLEVBQUUsS0FBSyxDQUFDO0lBRS9DLHVFQUF1RTtJQUN2RSx3RUFBd0U7SUFDeEUsWUFBWTtJQUNaLElBQUksS0FBSyxDQUFDLElBQUksb0JBQXNCLEVBQUU7O2NBQzlCLE1BQU0sR0FBRyxtQkFBQSxnQkFBZ0IsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLEVBQVk7O2NBQ25ELGFBQWEsR0FBRyxlQUFlLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxFQUFFLE1BQU0sRUFBRSxLQUFLLENBQUM7UUFDckUsSUFBSSxLQUFLLENBQUMsZUFBZSxFQUFFOztrQkFDbkIsd0JBQXdCLEdBQUcsNkJBQTZCLENBQUMsS0FBSyxFQUFFLEtBQUssRUFBRSxhQUFhLENBQUM7WUFFM0YsNERBQTREO1lBQzVELGlFQUFpRTtZQUNqRSxnRUFBZ0U7WUFDaEUsa0VBQWtFO1lBQ2xFLHNFQUFzRTtZQUN0RSxvRUFBb0U7WUFDcEUsb0VBQW9FO1lBQ3BFLG1DQUFtQztZQUNuQyxJQUFJLHdCQUF3QixFQUFFOztzQkFDdEIsUUFBUSxHQUFHLEtBQUssQ0FBQyxRQUFRLENBQUM7Z0JBQ2hDLG9CQUFvQixDQUFDLFFBQVEsRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLElBQUksQ0FBQyxDQUFDO2FBQ3JEO1NBQ0Y7S0FDRjtBQUNILENBQUM7Ozs7Ozs7QUFFRCxTQUFTLHdCQUF3QixDQUM3QixPQUFpRCxFQUFFLEtBQVksRUFDL0QsYUFBa0M7Ozs7O1VBSTlCLEtBQUssR0FBRyxDQUFDLE9BQU8sSUFBSSxzQkFBc0IsQ0FBQyxPQUFPLENBQUMsQ0FBQyxJQUFJLElBQUk7SUFFbEUsdUVBQXVFO0lBQ3ZFLDBFQUEwRTtJQUMxRSw2QkFBNkI7SUFDN0Isb0JBQW9CLENBQUMsS0FBSyxFQUFFLGFBQWEsRUFBRSxLQUFLLENBQUMsQ0FBQztBQUNwRCxDQUFDOzs7Ozs7OztBQUVELFNBQVMsZUFBZSxDQUNwQixRQUFlLEVBQUUsT0FBaUIsRUFBRSxLQUFZLEVBQUUsYUFBc0I7O1VBQ3BFLE9BQU8sR0FBRyxLQUFLLENBQUMsT0FBTztJQUU3QixrRUFBa0U7SUFDbEUsSUFBSSxDQUFDLGFBQWEsSUFBSSxPQUFPLEtBQUssSUFBSSxFQUFFOzs7OztjQUloQyxTQUFTLEdBQ1gsQ0FBQyxPQUFPLGtCQUFrQixLQUFLLFVBQVUsSUFBSSxPQUFPLFlBQVksa0JBQWtCLENBQUM7WUFDbkYsQ0FBQyxPQUFPLGNBQWMsS0FBSyxXQUFXLElBQUksT0FBTyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQ2xFLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUVsQyxJQUFJLFNBQVMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxRQUFRLEVBQUUsT0FBTyxDQUFDLEVBQUU7O2dCQUNoRCxZQUFZLEdBQUcsSUFBSSxPQUFPLDZCQUE2QjtZQUMzRCxZQUFZO2dCQUNSLFVBQVUsT0FBTywwRUFBMEUsQ0FBQztZQUNoRyxJQUFJLE9BQU8sSUFBSSxPQUFPLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFO2dCQUN4QyxZQUFZO29CQUNSLFVBQVUsT0FBTywrSEFBK0gsQ0FBQzthQUN0SjtpQkFBTTtnQkFDTCxZQUFZO29CQUNSLDhGQUE4RixDQUFDO2FBQ3BHO1lBQ0QsTUFBTSxJQUFJLEtBQUssQ0FBQyxZQUFZLENBQUMsQ0FBQztTQUMvQjtLQUNGO0FBQ0gsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHthc3NlcnREYXRhSW5SYW5nZSwgYXNzZXJ0RGVmaW5lZCwgYXNzZXJ0RXF1YWx9IGZyb20gJy4uLy4uL3V0aWwvYXNzZXJ0JztcbmltcG9ydCB7YXNzZXJ0SGFzUGFyZW50fSBmcm9tICcuLi9hc3NlcnQnO1xuaW1wb3J0IHthdHRhY2hQYXRjaERhdGF9IGZyb20gJy4uL2NvbnRleHRfZGlzY292ZXJ5JztcbmltcG9ydCB7cmVnaXN0ZXJQb3N0T3JkZXJIb29rc30gZnJvbSAnLi4vaG9va3MnO1xuaW1wb3J0IHtUQXR0cmlidXRlcywgVE5vZGUsIFROb2RlRmxhZ3MsIFROb2RlVHlwZX0gZnJvbSAnLi4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7UkVsZW1lbnR9IGZyb20gJy4uL2ludGVyZmFjZXMvcmVuZGVyZXInO1xuaW1wb3J0IHtTdHlsaW5nTWFwQXJyYXksIFRTdHlsaW5nQ29udGV4dH0gZnJvbSAnLi4vaW50ZXJmYWNlcy9zdHlsaW5nJztcbmltcG9ydCB7aXNDb250ZW50UXVlcnlIb3N0LCBpc0RpcmVjdGl2ZUhvc3R9IGZyb20gJy4uL2ludGVyZmFjZXMvdHlwZV9jaGVja3MnO1xuaW1wb3J0IHtIRUFERVJfT0ZGU0VULCBMVmlldywgUkVOREVSRVIsIFRWSUVXLCBUX0hPU1R9IGZyb20gJy4uL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2Fzc2VydE5vZGVUeXBlfSBmcm9tICcuLi9ub2RlX2Fzc2VydCc7XG5pbXBvcnQge2FwcGVuZENoaWxkfSBmcm9tICcuLi9ub2RlX21hbmlwdWxhdGlvbic7XG5pbXBvcnQge2RlY3JlYXNlRWxlbWVudERlcHRoQ291bnQsIGdldEJpbmRpbmdJbmRleCwgZ2V0RWxlbWVudERlcHRoQ291bnQsIGdldElzUGFyZW50LCBnZXRMVmlldywgZ2V0TmFtZXNwYWNlLCBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUsIGdldFNlbGVjdGVkSW5kZXgsIGluY3JlYXNlRWxlbWVudERlcHRoQ291bnQsIHNldElzTm90UGFyZW50LCBzZXRQcmV2aW91c09yUGFyZW50VE5vZGV9IGZyb20gJy4uL3N0YXRlJztcbmltcG9ydCB7c2V0VXBBdHRyaWJ1dGVzfSBmcm9tICcuLi91dGlsL2F0dHJzX3V0aWxzJztcbmltcG9ydCB7Z2V0SW5pdGlhbFN0eWxpbmdWYWx1ZSwgaGFzQ2xhc3NJbnB1dCwgaGFzU3R5bGVJbnB1dCwgc2VsZWN0Q2xhc3NCYXNlZElucHV0TmFtZX0gZnJvbSAnLi4vdXRpbC9zdHlsaW5nX3V0aWxzJztcbmltcG9ydCB7Z2V0Q29uc3RhbnQsIGdldE5hdGl2ZUJ5VE5vZGUsIGdldFROb2RlfSBmcm9tICcuLi91dGlsL3ZpZXdfdXRpbHMnO1xuXG5pbXBvcnQge2NyZWF0ZURpcmVjdGl2ZXNJbnN0YW5jZXMsIGVsZW1lbnRDcmVhdGUsIGV4ZWN1dGVDb250ZW50UXVlcmllcywgZ2V0T3JDcmVhdGVUTm9kZSwgbWF0Y2hpbmdTY2hlbWFzLCByZW5kZXJJbml0aWFsU3R5bGluZywgcmVzb2x2ZURpcmVjdGl2ZXMsIHNhdmVSZXNvbHZlZExvY2Fsc0luRGF0YSwgc2V0SW5wdXRzRm9yUHJvcGVydHl9IGZyb20gJy4vc2hhcmVkJztcbmltcG9ydCB7cmVnaXN0ZXJJbml0aWFsU3R5bGluZ09uVE5vZGV9IGZyb20gJy4vc3R5bGluZyc7XG5cblxuXG4vKipcbiAqIENyZWF0ZSBET00gZWxlbWVudC4gVGhlIGluc3RydWN0aW9uIG11c3QgbGF0ZXIgYmUgZm9sbG93ZWQgYnkgYGVsZW1lbnRFbmQoKWAgY2FsbC5cbiAqXG4gKiBAcGFyYW0gaW5kZXggSW5kZXggb2YgdGhlIGVsZW1lbnQgaW4gdGhlIExWaWV3IGFycmF5XG4gKiBAcGFyYW0gbmFtZSBOYW1lIG9mIHRoZSBET00gTm9kZVxuICogQHBhcmFtIGF0dHJzSW5kZXggSW5kZXggb2YgdGhlIGVsZW1lbnQncyBhdHRyaWJ1dGVzIGluIHRoZSBgY29uc3RzYCBhcnJheS5cbiAqIEBwYXJhbSBsb2NhbFJlZnNJbmRleCBJbmRleCBvZiB0aGUgZWxlbWVudCdzIGxvY2FsIHJlZmVyZW5jZXMgaW4gdGhlIGBjb25zdHNgIGFycmF5LlxuICpcbiAqIEF0dHJpYnV0ZXMgYW5kIGxvY2FsUmVmcyBhcmUgcGFzc2VkIGFzIGFuIGFycmF5IG9mIHN0cmluZ3Mgd2hlcmUgZWxlbWVudHMgd2l0aCBhbiBldmVuIGluZGV4XG4gKiBob2xkIGFuIGF0dHJpYnV0ZSBuYW1lIGFuZCBlbGVtZW50cyB3aXRoIGFuIG9kZCBpbmRleCBob2xkIGFuIGF0dHJpYnV0ZSB2YWx1ZSwgZXguOlxuICogWydpZCcsICd3YXJuaW5nNScsICdjbGFzcycsICdhbGVydCddXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVlbGVtZW50U3RhcnQoXG4gICAgaW5kZXg6IG51bWJlciwgbmFtZTogc3RyaW5nLCBhdHRyc0luZGV4PzogbnVtYmVyIHwgbnVsbCwgbG9jYWxSZWZzSW5kZXg/OiBudW1iZXIpOiB2b2lkIHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgY29uc3QgdFZpZXdDb25zdHMgPSB0Vmlldy5jb25zdHM7XG4gIGNvbnN0IGF0dHJzID0gZ2V0Q29uc3RhbnQodFZpZXdDb25zdHMsIGF0dHJzSW5kZXgpIGFzIFRBdHRyaWJ1dGVzO1xuICBjb25zdCBsb2NhbFJlZnMgPSBnZXRDb25zdGFudCh0Vmlld0NvbnN0cywgbG9jYWxSZWZzSW5kZXgpIGFzIHN0cmluZ1tdO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RXF1YWwoXG4gICAgICAgICAgICAgICAgICAgZ2V0QmluZGluZ0luZGV4KCksIHRWaWV3LmJpbmRpbmdTdGFydEluZGV4LFxuICAgICAgICAgICAgICAgICAgICdlbGVtZW50cyBzaG91bGQgYmUgY3JlYXRlZCBiZWZvcmUgYW55IGJpbmRpbmdzJyk7XG4gIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJDcmVhdGVFbGVtZW50Kys7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREYXRhSW5SYW5nZShsVmlldywgaW5kZXggKyBIRUFERVJfT0ZGU0VUKTtcbiAgY29uc3QgcmVuZGVyZXIgPSBsVmlld1tSRU5ERVJFUl07XG4gIGNvbnN0IG5hdGl2ZSA9IGxWaWV3W2luZGV4ICsgSEVBREVSX09GRlNFVF0gPSBlbGVtZW50Q3JlYXRlKG5hbWUsIHJlbmRlcmVyLCBnZXROYW1lc3BhY2UoKSk7XG4gIGNvbnN0IHROb2RlID0gZ2V0T3JDcmVhdGVUTm9kZSh0VmlldywgbFZpZXdbVF9IT1NUXSwgaW5kZXgsIFROb2RlVHlwZS5FbGVtZW50LCBuYW1lLCBhdHRycyk7XG5cbiAgaWYgKGF0dHJzICE9IG51bGwpIHtcbiAgICBjb25zdCBsYXN0QXR0ckluZGV4ID0gc2V0VXBBdHRyaWJ1dGVzKHJlbmRlcmVyLCBuYXRpdmUsIGF0dHJzKTtcbiAgICBpZiAodFZpZXcuZmlyc3RDcmVhdGVQYXNzKSB7XG4gICAgICByZWdpc3RlckluaXRpYWxTdHlsaW5nT25UTm9kZSh0Tm9kZSwgYXR0cnMsIGxhc3RBdHRySW5kZXgpO1xuICAgIH1cbiAgfVxuXG4gIGlmICgodE5vZGUuZmxhZ3MgJiBUTm9kZUZsYWdzLmhhc0luaXRpYWxTdHlsaW5nKSA9PT0gVE5vZGVGbGFncy5oYXNJbml0aWFsU3R5bGluZykge1xuICAgIHJlbmRlckluaXRpYWxTdHlsaW5nKHJlbmRlcmVyLCBuYXRpdmUsIHROb2RlLCBmYWxzZSk7XG4gIH1cblxuICBhcHBlbmRDaGlsZChuYXRpdmUsIHROb2RlLCBsVmlldyk7XG5cbiAgLy8gYW55IGltbWVkaWF0ZSBjaGlsZHJlbiBvZiBhIGNvbXBvbmVudCBvciB0ZW1wbGF0ZSBjb250YWluZXIgbXVzdCBiZSBwcmUtZW1wdGl2ZWx5XG4gIC8vIG1vbmtleS1wYXRjaGVkIHdpdGggdGhlIGNvbXBvbmVudCB2aWV3IGRhdGEgc28gdGhhdCB0aGUgZWxlbWVudCBjYW4gYmUgaW5zcGVjdGVkXG4gIC8vIGxhdGVyIG9uIHVzaW5nIGFueSBlbGVtZW50IGRpc2NvdmVyeSB1dGlsaXR5IG1ldGhvZHMgKHNlZSBgZWxlbWVudF9kaXNjb3ZlcnkudHNgKVxuICBpZiAoZ2V0RWxlbWVudERlcHRoQ291bnQoKSA9PT0gMCkge1xuICAgIGF0dGFjaFBhdGNoRGF0YShuYXRpdmUsIGxWaWV3KTtcbiAgfVxuICBpbmNyZWFzZUVsZW1lbnREZXB0aENvdW50KCk7XG5cbiAgLy8gaWYgYSBkaXJlY3RpdmUgY29udGFpbnMgYSBob3N0IGJpbmRpbmcgZm9yIFwiY2xhc3NcIiB0aGVuIGFsbCBjbGFzcy1iYXNlZCBkYXRhIHdpbGxcbiAgLy8gZmxvdyB0aHJvdWdoIHRoYXQgKGV4Y2VwdCBmb3IgYFtjbGFzcy5wcm9wXWAgYmluZGluZ3MpLiBUaGlzIGFsc28gaW5jbHVkZXMgaW5pdGlhbFxuICAvLyBzdGF0aWMgY2xhc3MgdmFsdWVzIGFzIHdlbGwuIChOb3RlIHRoYXQgdGhpcyB3aWxsIGJlIGZpeGVkIG9uY2UgbWFwLWJhc2VkIGBbc3R5bGVdYFxuICAvLyBhbmQgYFtjbGFzc11gIGJpbmRpbmdzIHdvcmsgZm9yIG11bHRpcGxlIGRpcmVjdGl2ZXMuKVxuICBpZiAodFZpZXcuZmlyc3RDcmVhdGVQYXNzKSB7XG4gICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5maXJzdENyZWF0ZVBhc3MrKztcbiAgICBjb25zdCBoYXNEaXJlY3RpdmVzID0gcmVzb2x2ZURpcmVjdGl2ZXModFZpZXcsIGxWaWV3LCB0Tm9kZSwgbG9jYWxSZWZzKTtcbiAgICBuZ0Rldk1vZGUgJiYgdmFsaWRhdGVFbGVtZW50KGxWaWV3LCBuYXRpdmUsIHROb2RlLCBoYXNEaXJlY3RpdmVzKTtcblxuICAgIGlmICh0Vmlldy5xdWVyaWVzICE9PSBudWxsKSB7XG4gICAgICB0Vmlldy5xdWVyaWVzLmVsZW1lbnRTdGFydCh0VmlldywgdE5vZGUpO1xuICAgIH1cbiAgfVxuXG4gIGlmIChpc0RpcmVjdGl2ZUhvc3QodE5vZGUpKSB7XG4gICAgY3JlYXRlRGlyZWN0aXZlc0luc3RhbmNlcyh0VmlldywgbFZpZXcsIHROb2RlKTtcbiAgICBleGVjdXRlQ29udGVudFF1ZXJpZXModFZpZXcsIHROb2RlLCBsVmlldyk7XG4gIH1cbiAgaWYgKGxvY2FsUmVmcyAhPSBudWxsKSB7XG4gICAgc2F2ZVJlc29sdmVkTG9jYWxzSW5EYXRhKGxWaWV3LCB0Tm9kZSk7XG4gIH1cbn1cblxuLyoqXG4gKiBNYXJrIHRoZSBlbmQgb2YgdGhlIGVsZW1lbnQuXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVlbGVtZW50RW5kKCk6IHZvaWQge1xuICBsZXQgcHJldmlvdXNPclBhcmVudFROb2RlID0gZ2V0UHJldmlvdXNPclBhcmVudFROb2RlKCk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKHByZXZpb3VzT3JQYXJlbnRUTm9kZSwgJ05vIHBhcmVudCBub2RlIHRvIGNsb3NlLicpO1xuICBpZiAoZ2V0SXNQYXJlbnQoKSkge1xuICAgIHNldElzTm90UGFyZW50KCk7XG4gIH0gZWxzZSB7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydEhhc1BhcmVudChnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKSk7XG4gICAgcHJldmlvdXNPclBhcmVudFROb2RlID0gcHJldmlvdXNPclBhcmVudFROb2RlLnBhcmVudCAhO1xuICAgIHNldFByZXZpb3VzT3JQYXJlbnRUTm9kZShwcmV2aW91c09yUGFyZW50VE5vZGUsIGZhbHNlKTtcbiAgfVxuXG4gIGNvbnN0IHROb2RlID0gcHJldmlvdXNPclBhcmVudFROb2RlO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZVR5cGUodE5vZGUsIFROb2RlVHlwZS5FbGVtZW50KTtcblxuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IHRWaWV3ID0gbFZpZXdbVFZJRVddO1xuXG4gIGRlY3JlYXNlRWxlbWVudERlcHRoQ291bnQoKTtcblxuICBpZiAodFZpZXcuZmlyc3RDcmVhdGVQYXNzKSB7XG4gICAgcmVnaXN0ZXJQb3N0T3JkZXJIb29rcyh0VmlldywgcHJldmlvdXNPclBhcmVudFROb2RlKTtcbiAgICBpZiAoaXNDb250ZW50UXVlcnlIb3N0KHByZXZpb3VzT3JQYXJlbnRUTm9kZSkpIHtcbiAgICAgIHRWaWV3LnF1ZXJpZXMgIS5lbGVtZW50RW5kKHByZXZpb3VzT3JQYXJlbnRUTm9kZSk7XG4gICAgfVxuICB9XG5cbiAgaWYgKGhhc0NsYXNzSW5wdXQodE5vZGUpKSB7XG4gICAgY29uc3QgaW5wdXROYW1lOiBzdHJpbmcgPSBzZWxlY3RDbGFzc0Jhc2VkSW5wdXROYW1lKHROb2RlLmlucHV0cyAhKTtcbiAgICBzZXREaXJlY3RpdmVTdHlsaW5nSW5wdXQodE5vZGUuY2xhc3NlcywgbFZpZXcsIHROb2RlLmlucHV0cyAhW2lucHV0TmFtZV0pO1xuICB9XG5cbiAgaWYgKGhhc1N0eWxlSW5wdXQodE5vZGUpKSB7XG4gICAgc2V0RGlyZWN0aXZlU3R5bGluZ0lucHV0KHROb2RlLnN0eWxlcywgbFZpZXcsIHROb2RlLmlucHV0cyAhWydzdHlsZSddKTtcbiAgfVxufVxuXG5cbi8qKlxuICogQ3JlYXRlcyBhbiBlbXB0eSBlbGVtZW50IHVzaW5nIHtAbGluayBlbGVtZW50U3RhcnR9IGFuZCB7QGxpbmsgZWxlbWVudEVuZH1cbiAqXG4gKiBAcGFyYW0gaW5kZXggSW5kZXggb2YgdGhlIGVsZW1lbnQgaW4gdGhlIGRhdGEgYXJyYXlcbiAqIEBwYXJhbSBuYW1lIE5hbWUgb2YgdGhlIERPTSBOb2RlXG4gKiBAcGFyYW0gYXR0cnNJbmRleCBJbmRleCBvZiB0aGUgZWxlbWVudCdzIGF0dHJpYnV0ZXMgaW4gdGhlIGBjb25zdHNgIGFycmF5LlxuICogQHBhcmFtIGxvY2FsUmVmc0luZGV4IEluZGV4IG9mIHRoZSBlbGVtZW50J3MgbG9jYWwgcmVmZXJlbmNlcyBpbiB0aGUgYGNvbnN0c2AgYXJyYXkuXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVlbGVtZW50KFxuICAgIGluZGV4OiBudW1iZXIsIG5hbWU6IHN0cmluZywgYXR0cnNJbmRleD86IG51bWJlciB8IG51bGwsIGxvY2FsUmVmc0luZGV4PzogbnVtYmVyKTogdm9pZCB7XG4gIMm1ybVlbGVtZW50U3RhcnQoaW5kZXgsIG5hbWUsIGF0dHJzSW5kZXgsIGxvY2FsUmVmc0luZGV4KTtcbiAgybXJtWVsZW1lbnRFbmQoKTtcbn1cblxuLyoqXG4gKiBBc3NpZ24gc3RhdGljIGF0dHJpYnV0ZSB2YWx1ZXMgdG8gYSBob3N0IGVsZW1lbnQuXG4gKlxuICogVGhpcyBpbnN0cnVjdGlvbiB3aWxsIGFzc2lnbiBzdGF0aWMgYXR0cmlidXRlIHZhbHVlcyBhcyB3ZWxsIGFzIGNsYXNzIGFuZCBzdHlsZVxuICogdmFsdWVzIHRvIGFuIGVsZW1lbnQgd2l0aGluIHRoZSBob3N0IGJpbmRpbmdzIGZ1bmN0aW9uLiBTaW5jZSBhdHRyaWJ1dGUgdmFsdWVzXG4gKiBjYW4gY29uc2lzdCBvZiBkaWZmZXJlbnQgdHlwZXMgb2YgdmFsdWVzLCB0aGUgYGF0dHJzYCBhcnJheSBtdXN0IGluY2x1ZGUgdGhlIHZhbHVlcyBpblxuICogdGhlIGZvbGxvd2luZyBmb3JtYXQ6XG4gKlxuICogYXR0cnMgPSBbXG4gKiAgIC8vIHN0YXRpYyBhdHRyaWJ1dGVzIChsaWtlIGB0aXRsZWAsIGBuYW1lYCwgYGlkYC4uLilcbiAqICAgYXR0cjEsIHZhbHVlMSwgYXR0cjIsIHZhbHVlLFxuICpcbiAqICAgLy8gYSBzaW5nbGUgbmFtZXNwYWNlIHZhbHVlIChsaWtlIGB4OmlkYClcbiAqICAgTkFNRVNQQUNFX01BUktFUiwgbmFtZXNwYWNlVXJpMSwgbmFtZTEsIHZhbHVlMSxcbiAqXG4gKiAgIC8vIGFub3RoZXIgc2luZ2xlIG5hbWVzcGFjZSB2YWx1ZSAobGlrZSBgeDpuYW1lYClcbiAqICAgTkFNRVNQQUNFX01BUktFUiwgbmFtZXNwYWNlVXJpMiwgbmFtZTIsIHZhbHVlMixcbiAqXG4gKiAgIC8vIGEgc2VyaWVzIG9mIENTUyBjbGFzc2VzIHRoYXQgd2lsbCBiZSBhcHBsaWVkIHRvIHRoZSBlbGVtZW50IChubyBzcGFjZXMpXG4gKiAgIENMQVNTRVNfTUFSS0VSLCBjbGFzczEsIGNsYXNzMiwgY2xhc3MzLFxuICpcbiAqICAgLy8gYSBzZXJpZXMgb2YgQ1NTIHN0eWxlcyAocHJvcGVydHkgKyB2YWx1ZSkgdGhhdCB3aWxsIGJlIGFwcGxpZWQgdG8gdGhlIGVsZW1lbnRcbiAqICAgU1RZTEVTX01BUktFUiwgcHJvcDEsIHZhbHVlMSwgcHJvcDIsIHZhbHVlMlxuICogXVxuICpcbiAqIEFsbCBub24tY2xhc3MgYW5kIG5vbi1zdHlsZSBhdHRyaWJ1dGVzIG11c3QgYmUgZGVmaW5lZCBhdCB0aGUgc3RhcnQgb2YgdGhlIGxpc3RcbiAqIGZpcnN0IGJlZm9yZSBhbGwgY2xhc3MgYW5kIHN0eWxlIHZhbHVlcyBhcmUgc2V0LiBXaGVuIHRoZXJlIGlzIGEgY2hhbmdlIGluIHZhbHVlXG4gKiB0eXBlIChsaWtlIHdoZW4gY2xhc3NlcyBhbmQgc3R5bGVzIGFyZSBpbnRyb2R1Y2VkKSBhIG1hcmtlciBtdXN0IGJlIHVzZWQgdG8gc2VwYXJhdGVcbiAqIHRoZSBlbnRyaWVzLiBUaGUgbWFya2VyIHZhbHVlcyB0aGVtc2VsdmVzIGFyZSBzZXQgdmlhIGVudHJpZXMgZm91bmQgaW4gdGhlXG4gKiBbQXR0cmlidXRlTWFya2VyXSBlbnVtLlxuICpcbiAqIE5PVEU6IFRoaXMgaW5zdHJ1Y3Rpb24gaXMgbWVhbnQgdG8gdXNlZCBmcm9tIGBob3N0QmluZGluZ3NgIGZ1bmN0aW9uIG9ubHkuXG4gKlxuICogQHBhcmFtIGRpcmVjdGl2ZSBBIGRpcmVjdGl2ZSBpbnN0YW5jZSB0aGUgc3R5bGluZyBpcyBhc3NvY2lhdGVkIHdpdGguXG4gKiBAcGFyYW0gYXR0cnMgQW4gYXJyYXkgb2Ygc3RhdGljIHZhbHVlcyAoYXR0cmlidXRlcywgY2xhc3NlcyBhbmQgc3R5bGVzKSB3aXRoIHRoZSBjb3JyZWN0IG1hcmtlclxuICogdmFsdWVzLlxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1ZWxlbWVudEhvc3RBdHRycyhhdHRyczogVEF0dHJpYnV0ZXMpIHtcbiAgY29uc3QgaG9zdEVsZW1lbnRJbmRleCA9IGdldFNlbGVjdGVkSW5kZXgoKTtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgY29uc3QgdE5vZGUgPSBnZXRUTm9kZShob3N0RWxlbWVudEluZGV4LCBsVmlldyk7XG5cbiAgLy8gbm9uLWVsZW1lbnQgbm9kZXMgKGUuZy4gYDxuZy1jb250YWluZXI+YCkgYXJlIG5vdCByZW5kZXJlZCBhcyBhY3R1YWxcbiAgLy8gZWxlbWVudCBub2RlcyBhbmQgYWRkaW5nIHN0eWxlcy9jbGFzc2VzIG9uIHRvIHRoZW0gd2lsbCBjYXVzZSBydW50aW1lXG4gIC8vIGVycm9ycy4uLlxuICBpZiAodE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkVsZW1lbnQpIHtcbiAgICBjb25zdCBuYXRpdmUgPSBnZXROYXRpdmVCeVROb2RlKHROb2RlLCBsVmlldykgYXMgUkVsZW1lbnQ7XG4gICAgY29uc3QgbGFzdEF0dHJJbmRleCA9IHNldFVwQXR0cmlidXRlcyhsVmlld1tSRU5ERVJFUl0sIG5hdGl2ZSwgYXR0cnMpO1xuICAgIGlmICh0Vmlldy5maXJzdENyZWF0ZVBhc3MpIHtcbiAgICAgIGNvbnN0IHN0eWxpbmdOZWVkc1RvQmVSZW5kZXJlZCA9IHJlZ2lzdGVySW5pdGlhbFN0eWxpbmdPblROb2RlKHROb2RlLCBhdHRycywgbGFzdEF0dHJJbmRleCk7XG5cbiAgICAgIC8vIHRoaXMgaXMgb25seSBjYWxsZWQgZHVyaW5nIHRoZSBmaXJzdCB0ZW1wbGF0ZSBwYXNzIGluIHRoZVxuICAgICAgLy8gZXZlbnQgdGhhdCB0aGlzIGN1cnJlbnQgZGlyZWN0aXZlIGFzc2lnbmVkIGluaXRpYWwgc3R5bGUvY2xhc3NcbiAgICAgIC8vIGhvc3QgYXR0cmlidXRlIHZhbHVlcyB0byB0aGUgZWxlbWVudC4gQmVjYXVzZSBpbml0aWFsIHN0eWxpbmdcbiAgICAgIC8vIHZhbHVlcyBhcmUgYXBwbGllZCBiZWZvcmUgZGlyZWN0aXZlcyBhcmUgZmlyc3QgcmVuZGVyZWQgKHdpdGhpblxuICAgICAgLy8gYGNyZWF0ZUVsZW1lbnRgKSB0aGlzIG1lYW5zIHRoYXQgaW5pdGlhbCBzdHlsaW5nIGZvciBhbnkgZGlyZWN0aXZlc1xuICAgICAgLy8gc3RpbGwgbmVlZHMgdG8gYmUgYXBwbGllZC4gTm90ZSB0aGF0IHRoaXMgd2lsbCBvbmx5IGhhcHBlbiBkdXJpbmdcbiAgICAgIC8vIHRoZSBmaXJzdCB0ZW1wbGF0ZSBwYXNzIGFuZCBub3QgZWFjaCB0aW1lIGEgZGlyZWN0aXZlIGFwcGxpZXMgaXRzXG4gICAgICAvLyBhdHRyaWJ1dGUgdmFsdWVzIHRvIHRoZSBlbGVtZW50LlxuICAgICAgaWYgKHN0eWxpbmdOZWVkc1RvQmVSZW5kZXJlZCkge1xuICAgICAgICBjb25zdCByZW5kZXJlciA9IGxWaWV3W1JFTkRFUkVSXTtcbiAgICAgICAgcmVuZGVySW5pdGlhbFN0eWxpbmcocmVuZGVyZXIsIG5hdGl2ZSwgdE5vZGUsIHRydWUpO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBzZXREaXJlY3RpdmVTdHlsaW5nSW5wdXQoXG4gICAgY29udGV4dDogVFN0eWxpbmdDb250ZXh0IHwgU3R5bGluZ01hcEFycmF5IHwgbnVsbCwgbFZpZXc6IExWaWV3LFxuICAgIHN0eWxpbmdJbnB1dHM6IChzdHJpbmcgfCBudW1iZXIpW10pIHtcbiAgLy8gb2xkZXIgdmVyc2lvbnMgb2YgQW5ndWxhciB0cmVhdCB0aGUgaW5wdXQgYXMgYG51bGxgIGluIHRoZVxuICAvLyBldmVudCB0aGF0IHRoZSB2YWx1ZSBkb2VzIG5vdCBleGlzdCBhdCBhbGwuIEZvciB0aGlzIHJlYXNvblxuICAvLyB3ZSBjYW4ndCBoYXZlIGEgc3R5bGluZyB2YWx1ZSBiZSBhbiBlbXB0eSBzdHJpbmcuXG4gIGNvbnN0IHZhbHVlID0gKGNvbnRleHQgJiYgZ2V0SW5pdGlhbFN0eWxpbmdWYWx1ZShjb250ZXh0KSkgfHwgbnVsbDtcblxuICAvLyBJdnkgZG9lcyBhbiBleHRyYSBgW2NsYXNzXWAgd3JpdGUgd2l0aCBhIGZhbHN5IHZhbHVlIHNpbmNlIHRoZSB2YWx1ZVxuICAvLyBpcyBhcHBsaWVkIGR1cmluZyBjcmVhdGlvbiBtb2RlLiBUaGlzIGlzIGEgZGV2aWF0aW9uIGZyb20gVkUgYW5kIHNob3VsZFxuICAvLyBiZSAoSmlyYSBJc3N1ZSA9IEZXLTE0NjcpLlxuICBzZXRJbnB1dHNGb3JQcm9wZXJ0eShsVmlldywgc3R5bGluZ0lucHV0cywgdmFsdWUpO1xufVxuXG5mdW5jdGlvbiB2YWxpZGF0ZUVsZW1lbnQoXG4gICAgaG9zdFZpZXc6IExWaWV3LCBlbGVtZW50OiBSRWxlbWVudCwgdE5vZGU6IFROb2RlLCBoYXNEaXJlY3RpdmVzOiBib29sZWFuKTogdm9pZCB7XG4gIGNvbnN0IHRhZ05hbWUgPSB0Tm9kZS50YWdOYW1lO1xuXG4gIC8vIElmIHRoZSBlbGVtZW50IG1hdGNoZXMgYW55IGRpcmVjdGl2ZSwgaXQncyBjb25zaWRlcmVkIGFzIHZhbGlkLlxuICBpZiAoIWhhc0RpcmVjdGl2ZXMgJiYgdGFnTmFtZSAhPT0gbnVsbCkge1xuICAgIC8vIFRoZSBlbGVtZW50IGlzIHVua25vd24gaWYgaXQncyBhbiBpbnN0YW5jZSBvZiBIVE1MVW5rbm93bkVsZW1lbnQgb3IgaXQgaXNuJ3QgcmVnaXN0ZXJlZFxuICAgIC8vIGFzIGEgY3VzdG9tIGVsZW1lbnQuIE5vdGUgdGhhdCB1bmtub3duIGVsZW1lbnRzIHdpdGggYSBkYXNoIGluIHRoZWlyIG5hbWUgd29uJ3QgYmUgaW5zdGFuY2VzXG4gICAgLy8gb2YgSFRNTFVua25vd25FbGVtZW50IGluIGJyb3dzZXJzIHRoYXQgc3VwcG9ydCB3ZWIgY29tcG9uZW50cy5cbiAgICBjb25zdCBpc1Vua25vd24gPVxuICAgICAgICAodHlwZW9mIEhUTUxVbmtub3duRWxlbWVudCA9PT0gJ2Z1bmN0aW9uJyAmJiBlbGVtZW50IGluc3RhbmNlb2YgSFRNTFVua25vd25FbGVtZW50KSB8fFxuICAgICAgICAodHlwZW9mIGN1c3RvbUVsZW1lbnRzICE9PSAndW5kZWZpbmVkJyAmJiB0YWdOYW1lLmluZGV4T2YoJy0nKSA+IC0xICYmXG4gICAgICAgICAhY3VzdG9tRWxlbWVudHMuZ2V0KHRhZ05hbWUpKTtcblxuICAgIGlmIChpc1Vua25vd24gJiYgIW1hdGNoaW5nU2NoZW1hcyhob3N0VmlldywgdGFnTmFtZSkpIHtcbiAgICAgIGxldCBlcnJvck1lc3NhZ2UgPSBgJyR7dGFnTmFtZX0nIGlzIG5vdCBhIGtub3duIGVsZW1lbnQ6XFxuYDtcbiAgICAgIGVycm9yTWVzc2FnZSArPVxuICAgICAgICAgIGAxLiBJZiAnJHt0YWdOYW1lfScgaXMgYW4gQW5ndWxhciBjb21wb25lbnQsIHRoZW4gdmVyaWZ5IHRoYXQgaXQgaXMgcGFydCBvZiB0aGlzIG1vZHVsZS5cXG5gO1xuICAgICAgaWYgKHRhZ05hbWUgJiYgdGFnTmFtZS5pbmRleE9mKCctJykgPiAtMSkge1xuICAgICAgICBlcnJvck1lc3NhZ2UgKz1cbiAgICAgICAgICAgIGAyLiBJZiAnJHt0YWdOYW1lfScgaXMgYSBXZWIgQ29tcG9uZW50IHRoZW4gYWRkICdDVVNUT01fRUxFTUVOVFNfU0NIRU1BJyB0byB0aGUgJ0BOZ01vZHVsZS5zY2hlbWFzJyBvZiB0aGlzIGNvbXBvbmVudCB0byBzdXBwcmVzcyB0aGlzIG1lc3NhZ2UuYDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGVycm9yTWVzc2FnZSArPVxuICAgICAgICAgICAgYDIuIFRvIGFsbG93IGFueSBlbGVtZW50IGFkZCAnTk9fRVJST1JTX1NDSEVNQScgdG8gdGhlICdATmdNb2R1bGUuc2NoZW1hcycgb2YgdGhpcyBjb21wb25lbnQuYDtcbiAgICAgIH1cbiAgICAgIHRocm93IG5ldyBFcnJvcihlcnJvck1lc3NhZ2UpO1xuICAgIH1cbiAgfVxufVxuIl19