/**
 * @fileoverview added by tsickle
 * Generated from: packages/core/src/render3/instructions/element.ts
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
import { assertFirstCreatePass, assertHasParent } from '../assert';
import { attachPatchData } from '../context_discovery';
import { registerPostOrderHooks } from '../hooks';
import { hasClassInput, hasStyleInput } from '../interfaces/node';
import { isContentQueryHost, isDirectiveHost } from '../interfaces/type_checks';
import { HEADER_OFFSET, RENDERER, T_HOST } from '../interfaces/view';
import { assertNodeType } from '../node_assert';
import { appendChild, writeDirectClass, writeDirectStyle } from '../node_manipulation';
import { decreaseElementDepthCount, getBindingIndex, getElementDepthCount, getIsParent, getLView, getNamespace, getPreviousOrParentTNode, getTView, increaseElementDepthCount, setIsNotParent, setPreviousOrParentTNode } from '../state';
import { computeStaticStyling } from '../styling/static_styling';
import { setUpAttributes } from '../util/attrs_utils';
import { getConstant } from '../util/view_utils';
import { setDirectiveInputsWhichShadowsStyling } from './property';
import { createDirectivesInstances, elementCreate, executeContentQueries, getOrCreateTNode, matchingSchemas, resolveDirectives, saveResolvedLocalsInData } from './shared';
/**
 * @param {?} index
 * @param {?} tView
 * @param {?} lView
 * @param {?} native
 * @param {?} name
 * @param {?=} attrsIndex
 * @param {?=} localRefsIndex
 * @return {?}
 */
function elementStartFirstCreatePass(index, tView, lView, native, name, attrsIndex, localRefsIndex) {
    ngDevMode && assertFirstCreatePass(tView);
    ngDevMode && ngDevMode.firstCreatePass++;
    /** @type {?} */
    const tViewConsts = tView.consts;
    /** @type {?} */
    const attrs = getConstant(tViewConsts, attrsIndex);
    /** @type {?} */
    const tNode = getOrCreateTNode(tView, lView[T_HOST], index, 3 /* Element */, name, attrs);
    /** @type {?} */
    const hasDirectives = resolveDirectives(tView, lView, tNode, getConstant(tViewConsts, localRefsIndex));
    ngDevMode && warnAboutUnknownElement(tView, lView, native, tNode, hasDirectives);
    if (tNode.mergedAttrs !== null) {
        computeStaticStyling(tNode, tNode.mergedAttrs);
    }
    if (tView.queries !== null) {
        tView.queries.elementStart(tView, tNode);
    }
    return tNode;
}
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
    const tView = getTView();
    /** @type {?} */
    const adjustedIndex = HEADER_OFFSET + index;
    ngDevMode &&
        assertEqual(getBindingIndex(), tView.bindingStartIndex, 'elements should be created before any bindings');
    ngDevMode && ngDevMode.rendererCreateElement++;
    ngDevMode && assertDataInRange(lView, adjustedIndex);
    /** @type {?} */
    const renderer = lView[RENDERER];
    /** @type {?} */
    const native = lView[adjustedIndex] = elementCreate(name, renderer, getNamespace());
    /** @type {?} */
    const tNode = tView.firstCreatePass ?
        elementStartFirstCreatePass(index, tView, lView, native, name, attrsIndex, localRefsIndex) :
        (/** @type {?} */ (tView.data[adjustedIndex]));
    setPreviousOrParentTNode(tNode, true);
    /** @type {?} */
    const mergedAttrs = tNode.mergedAttrs;
    if (mergedAttrs !== null) {
        setUpAttributes(renderer, native, mergedAttrs);
    }
    /** @type {?} */
    const classes = tNode.classes;
    if (classes !== null) {
        writeDirectClass(renderer, native, classes);
    }
    /** @type {?} */
    const styles = tNode.styles;
    if (styles !== null) {
        writeDirectStyle(renderer, native, styles);
    }
    appendChild(tView, lView, native, tNode);
    // any immediate children of a component or template container must be pre-emptively
    // monkey-patched with the component view data so that the element can be inspected
    // later on using any element discovery utility methods (see `element_discovery.ts`)
    if (getElementDepthCount() === 0) {
        attachPatchData(native, lView);
    }
    increaseElementDepthCount();
    if (isDirectiveHost(tNode)) {
        createDirectivesInstances(tView, lView, tNode);
        executeContentQueries(tView, tNode, lView);
    }
    if (localRefsIndex !== null) {
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
    decreaseElementDepthCount();
    /** @type {?} */
    const tView = getTView();
    if (tView.firstCreatePass) {
        registerPostOrderHooks(tView, previousOrParentTNode);
        if (isContentQueryHost(previousOrParentTNode)) {
            (/** @type {?} */ (tView.queries)).elementEnd(previousOrParentTNode);
        }
    }
    if (tNode.classes !== null && hasClassInput(tNode)) {
        setDirectiveInputsWhichShadowsStyling(tView, tNode, getLView(), tNode.classes, true);
    }
    if (tNode.styles !== null && hasStyleInput(tNode)) {
        setDirectiveInputsWhichShadowsStyling(tView, tNode, getLView(), tNode.styles, false);
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
 * @param {?} tView
 * @param {?} lView
 * @param {?} element
 * @param {?} tNode
 * @param {?} hasDirectives
 * @return {?}
 */
function warnAboutUnknownElement(tView, lView, element, tNode, hasDirectives) {
    /** @type {?} */
    const schemas = tView.schemas;
    // If `schemas` is set to `null`, that's an indication that this Component was compiled in AOT
    // mode where this check happens at compile time. In JIT mode, `schemas` is always present and
    // defined as an array (as an empty array in case `schemas` field is not defined) and we should
    // execute the check below.
    if (schemas === null)
        return;
    /** @type {?} */
    const tagName = tNode.tagName;
    // If the element matches any directive, it's considered as valid.
    if (!hasDirectives && tagName !== null) {
        // The element is unknown if it's an instance of HTMLUnknownElement or it isn't registered
        // as a custom element. Note that unknown elements with a dash in their name won't be instances
        // of HTMLUnknownElement in browsers that support web components.
        /** @type {?} */
        const isUnknown = 
        // Note that we can't check for `typeof HTMLUnknownElement === 'function'`,
        // because while most browsers return 'function', IE returns 'object'.
        (typeof HTMLUnknownElement !== 'undefined' && HTMLUnknownElement &&
            element instanceof HTMLUnknownElement) ||
            (typeof customElements !== 'undefined' && tagName.indexOf('-') > -1 &&
                !customElements.get(tagName));
        if (isUnknown && !matchingSchemas(tView, lView, tagName)) {
            /** @type {?} */
            let warning = `'${tagName}' is not a known element:\n`;
            warning += `1. If '${tagName}' is an Angular component, then verify that it is part of this module.\n`;
            if (tagName && tagName.indexOf('-') > -1) {
                warning += `2. If '${tagName}' is a Web Component then add 'CUSTOM_ELEMENTS_SCHEMA' to the '@NgModule.schemas' of this component to suppress this message.`;
            }
            else {
                warning +=
                    `2. To allow any element add 'NO_ERRORS_SCHEMA' to the '@NgModule.schemas' of this component.`;
            }
            console.warn(warning);
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWxlbWVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaW5zdHJ1Y3Rpb25zL2VsZW1lbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUFDLGlCQUFpQixFQUFFLGFBQWEsRUFBRSxXQUFXLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUNoRixPQUFPLEVBQUMscUJBQXFCLEVBQUUsZUFBZSxFQUFDLE1BQU0sV0FBVyxDQUFDO0FBQ2pFLE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSxzQkFBc0IsQ0FBQztBQUNyRCxPQUFPLEVBQUMsc0JBQXNCLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDaEQsT0FBTyxFQUFDLGFBQWEsRUFBRSxhQUFhLEVBQThDLE1BQU0sb0JBQW9CLENBQUM7QUFFN0csT0FBTyxFQUFDLGtCQUFrQixFQUFFLGVBQWUsRUFBQyxNQUFNLDJCQUEyQixDQUFDO0FBQzlFLE9BQU8sRUFBQyxhQUFhLEVBQVMsUUFBUSxFQUFFLE1BQU0sRUFBZSxNQUFNLG9CQUFvQixDQUFDO0FBQ3hGLE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUM5QyxPQUFPLEVBQUMsV0FBVyxFQUFFLGdCQUFnQixFQUFFLGdCQUFnQixFQUFDLE1BQU0sc0JBQXNCLENBQUM7QUFDckYsT0FBTyxFQUFDLHlCQUF5QixFQUFFLGVBQWUsRUFBRSxvQkFBb0IsRUFBRSxXQUFXLEVBQUUsUUFBUSxFQUFFLFlBQVksRUFBRSx3QkFBd0IsRUFBRSxRQUFRLEVBQUUseUJBQXlCLEVBQUUsY0FBYyxFQUFFLHdCQUF3QixFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQ3hPLE9BQU8sRUFBQyxvQkFBb0IsRUFBQyxNQUFNLDJCQUEyQixDQUFDO0FBQy9ELE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUNw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IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHthc3NlcnREYXRhSW5SYW5nZSwgYXNzZXJ0RGVmaW5lZCwgYXNzZXJ0RXF1YWx9IGZyb20gJy4uLy4uL3V0aWwvYXNzZXJ0JztcbmltcG9ydCB7YXNzZXJ0Rmlyc3RDcmVhdGVQYXNzLCBhc3NlcnRIYXNQYXJlbnR9IGZyb20gJy4uL2Fzc2VydCc7XG5pbXBvcnQge2F0dGFjaFBhdGNoRGF0YX0gZnJvbSAnLi4vY29udGV4dF9kaXNjb3ZlcnknO1xuaW1wb3J0IHtyZWdpc3RlclBvc3RPcmRlckhvb2tzfSBmcm9tICcuLi9ob29rcyc7XG5pbXBvcnQge2hhc0NsYXNzSW5wdXQsIGhhc1N0eWxlSW5wdXQsIFRBdHRyaWJ1dGVzLCBURWxlbWVudE5vZGUsIFROb2RlLCBUTm9kZVR5cGV9IGZyb20gJy4uL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge1JFbGVtZW50fSBmcm9tICcuLi9pbnRlcmZhY2VzL3JlbmRlcmVyJztcbmltcG9ydCB7aXNDb250ZW50UXVlcnlIb3N0LCBpc0RpcmVjdGl2ZUhvc3R9IGZyb20gJy4uL2ludGVyZmFjZXMvdHlwZV9jaGVja3MnO1xuaW1wb3J0IHtIRUFERVJfT0ZGU0VULCBMVmlldywgUkVOREVSRVIsIFRfSE9TVCwgVFZJRVcsIFRWaWV3fSBmcm9tICcuLi9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHthc3NlcnROb2RlVHlwZX0gZnJvbSAnLi4vbm9kZV9hc3NlcnQnO1xuaW1wb3J0IHthcHBlbmRDaGlsZCwgd3JpdGVEaXJlY3RDbGFzcywgd3JpdGVEaXJlY3RTdHlsZX0gZnJvbSAnLi4vbm9kZV9tYW5pcHVsYXRpb24nO1xuaW1wb3J0IHtkZWNyZWFzZUVsZW1lbnREZXB0aENvdW50LCBnZXRCaW5kaW5nSW5kZXgsIGdldEVsZW1lbnREZXB0aENvdW50LCBnZXRJc1BhcmVudCwgZ2V0TFZpZXcsIGdldE5hbWVzcGFjZSwgZ2V0UHJldmlvdXNPclBhcmVudFROb2RlLCBnZXRUVmlldywgaW5jcmVhc2VFbGVtZW50RGVwdGhDb3VudCwgc2V0SXNOb3RQYXJlbnQsIHNldFByZXZpb3VzT3JQYXJlbnRUTm9kZX0gZnJvbSAnLi4vc3RhdGUnO1xuaW1wb3J0IHtjb21wdXRlU3RhdGljU3R5bGluZ30gZnJvbSAnLi4vc3R5bGluZy9zdGF0aWNfc3R5bGluZyc7XG5pbXBvcnQge3NldFVwQXR0cmlidXRlc30gZnJvbSAnLi4vdXRpbC9hdHRyc191dGlscyc7XG5pbXBvcnQge2dldENvbnN0YW50fSBmcm9tICcuLi91dGlsL3ZpZXdfdXRpbHMnO1xuXG5pbXBvcnQge3NldERpcmVjdGl2ZUlucHV0c1doaWNoU2hhZG93c1N0eWxpbmd9IGZyb20gJy4vcHJvcGVydHknO1xuaW1wb3J0IHtjcmVhdGVEaXJlY3RpdmVzSW5zdGFuY2VzLCBlbGVtZW50Q3JlYXRlLCBleGVjdXRlQ29udGVudFF1ZXJpZXMsIGdldE9yQ3JlYXRlVE5vZGUsIG1hdGNoaW5nU2NoZW1hcywgcmVzb2x2ZURpcmVjdGl2ZXMsIHNhdmVSZXNvbHZlZExvY2Fsc0luRGF0YX0gZnJvbSAnLi9zaGFyZWQnO1xuXG5cbmZ1bmN0aW9uIGVsZW1lbnRTdGFydEZpcnN0Q3JlYXRlUGFzcyhcbiAgICBpbmRleDogbnVtYmVyLCB0VmlldzogVFZpZXcsIGxWaWV3OiBMVmlldywgbmF0aXZlOiBSRWxlbWVudCwgbmFtZTogc3RyaW5nLFxuICAgIGF0dHJzSW5kZXg/OiBudW1iZXJ8bnVsbCwgbG9jYWxSZWZzSW5kZXg/OiBudW1iZXIpOiBURWxlbWVudE5vZGUge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Rmlyc3RDcmVhdGVQYXNzKHRWaWV3KTtcbiAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5maXJzdENyZWF0ZVBhc3MrKztcblxuICBjb25zdCB0Vmlld0NvbnN0cyA9IHRWaWV3LmNvbnN0cztcbiAgY29uc3QgYXR0cnMgPSBnZXRDb25zdGFudDxUQXR0cmlidXRlcz4odFZpZXdDb25zdHMsIGF0dHJzSW5kZXgpO1xuICBjb25zdCB0Tm9kZSA9IGdldE9yQ3JlYXRlVE5vZGUodFZpZXcsIGxWaWV3W1RfSE9TVF0sIGluZGV4LCBUTm9kZVR5cGUuRWxlbWVudCwgbmFtZSwgYXR0cnMpO1xuXG4gIGNvbnN0IGhhc0RpcmVjdGl2ZXMgPVxuICAgICAgcmVzb2x2ZURpcmVjdGl2ZXModFZpZXcsIGxWaWV3LCB0Tm9kZSwgZ2V0Q29uc3RhbnQ8c3RyaW5nW10+KHRWaWV3Q29uc3RzLCBsb2NhbFJlZnNJbmRleCkpO1xuICBuZ0Rldk1vZGUgJiYgd2FybkFib3V0VW5rbm93bkVsZW1lbnQodFZpZXcsIGxWaWV3LCBuYXRpdmUsIHROb2RlLCBoYXNEaXJlY3RpdmVzKTtcblxuICBpZiAodE5vZGUubWVyZ2VkQXR0cnMgIT09IG51bGwpIHtcbiAgICBjb21wdXRlU3RhdGljU3R5bGluZyh0Tm9kZSwgdE5vZGUubWVyZ2VkQXR0cnMpO1xuICB9XG5cbiAgaWYgKHRWaWV3LnF1ZXJpZXMgIT09IG51bGwpIHtcbiAgICB0Vmlldy5xdWVyaWVzLmVsZW1lbnRTdGFydCh0VmlldywgdE5vZGUpO1xuICB9XG5cbiAgcmV0dXJuIHROb2RlO1xufVxuXG4vKipcbiAqIENyZWF0ZSBET00gZWxlbWVudC4gVGhlIGluc3RydWN0aW9uIG11c3QgbGF0ZXIgYmUgZm9sbG93ZWQgYnkgYGVsZW1lbnRFbmQoKWAgY2FsbC5cbiAqXG4gKiBAcGFyYW0gaW5kZXggSW5kZXggb2YgdGhlIGVsZW1lbnQgaW4gdGhlIExWaWV3IGFycmF5XG4gKiBAcGFyYW0gbmFtZSBOYW1lIG9mIHRoZSBET00gTm9kZVxuICogQHBhcmFtIGF0dHJzSW5kZXggSW5kZXggb2YgdGhlIGVsZW1lbnQncyBhdHRyaWJ1dGVzIGluIHRoZSBgY29uc3RzYCBhcnJheS5cbiAqIEBwYXJhbSBsb2NhbFJlZnNJbmRleCBJbmRleCBvZiB0aGUgZWxlbWVudCdzIGxvY2FsIHJlZmVyZW5jZXMgaW4gdGhlIGBjb25zdHNgIGFycmF5LlxuICpcbiAqIEF0dHJpYnV0ZXMgYW5kIGxvY2FsUmVmcyBhcmUgcGFzc2VkIGFzIGFuIGFycmF5IG9mIHN0cmluZ3Mgd2hlcmUgZWxlbWVudHMgd2l0aCBhbiBldmVuIGluZGV4XG4gKiBob2xkIGFuIGF0dHJpYnV0ZSBuYW1lIGFuZCBlbGVtZW50cyB3aXRoIGFuIG9kZCBpbmRleCBob2xkIGFuIGF0dHJpYnV0ZSB2YWx1ZSwgZXguOlxuICogWydpZCcsICd3YXJuaW5nNScsICdjbGFzcycsICdhbGVydCddXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVlbGVtZW50U3RhcnQoXG4gICAgaW5kZXg6IG51bWJlciwgbmFtZTogc3RyaW5nLCBhdHRyc0luZGV4PzogbnVtYmVyfG51bGwsIGxvY2FsUmVmc0luZGV4PzogbnVtYmVyKTogdm9pZCB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgdFZpZXcgPSBnZXRUVmlldygpO1xuICBjb25zdCBhZGp1c3RlZEluZGV4ID0gSEVBREVSX09GRlNFVCArIGluZGV4O1xuXG4gIG5nRGV2TW9kZSAmJlxuICAgICAgYXNzZXJ0RXF1YWwoXG4gICAgICAgICAgZ2V0QmluZGluZ0luZGV4KCksIHRWaWV3LmJpbmRpbmdTdGFydEluZGV4LFxuICAgICAgICAgICdlbGVtZW50cyBzaG91bGQgYmUgY3JlYXRlZCBiZWZvcmUgYW55IGJpbmRpbmdzJyk7XG4gIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJDcmVhdGVFbGVtZW50Kys7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREYXRhSW5SYW5nZShsVmlldywgYWRqdXN0ZWRJbmRleCk7XG5cbiAgY29uc3QgcmVuZGVyZXIgPSBsVmlld1tSRU5ERVJFUl07XG4gIGNvbnN0IG5hdGl2ZSA9IGxWaWV3W2FkanVzdGVkSW5kZXhdID0gZWxlbWVudENyZWF0ZShuYW1lLCByZW5kZXJlciwgZ2V0TmFtZXNwYWNlKCkpO1xuXG4gIGNvbnN0IHROb2RlID0gdFZpZXcuZmlyc3RDcmVhdGVQYXNzID9cbiAgICAgIGVsZW1lbnRTdGFydEZpcnN0Q3JlYXRlUGFzcyhpbmRleCwgdFZpZXcsIGxWaWV3LCBuYXRpdmUsIG5hbWUsIGF0dHJzSW5kZXgsIGxvY2FsUmVmc0luZGV4KSA6XG4gICAgICB0Vmlldy5kYXRhW2FkanVzdGVkSW5kZXhdIGFzIFRFbGVtZW50Tm9kZTtcbiAgc2V0UHJldmlvdXNPclBhcmVudFROb2RlKHROb2RlLCB0cnVlKTtcblxuICBjb25zdCBtZXJnZWRBdHRycyA9IHROb2RlLm1lcmdlZEF0dHJzO1xuICBpZiAobWVyZ2VkQXR0cnMgIT09IG51bGwpIHtcbiAgICBzZXRVcEF0dHJpYnV0ZXMocmVuZGVyZXIsIG5hdGl2ZSwgbWVyZ2VkQXR0cnMpO1xuICB9XG4gIGNvbnN0IGNsYXNzZXMgPSB0Tm9kZS5jbGFzc2VzO1xuICBpZiAoY2xhc3NlcyAhPT0gbnVsbCkge1xuICAgIHdyaXRlRGlyZWN0Q2xhc3MocmVuZGVyZXIsIG5hdGl2ZSwgY2xhc3Nlcyk7XG4gIH1cbiAgY29uc3Qgc3R5bGVzID0gdE5vZGUuc3R5bGVzO1xuICBpZiAoc3R5bGVzICE9PSBudWxsKSB7XG4gICAgd3JpdGVEaXJlY3RTdHlsZShyZW5kZXJlciwgbmF0aXZlLCBzdHlsZXMpO1xuICB9XG5cbiAgYXBwZW5kQ2hpbGQodFZpZXcsIGxWaWV3LCBuYXRpdmUsIHROb2RlKTtcblxuICAvLyBhbnkgaW1tZWRpYXRlIGNoaWxkcmVuIG9mIGEgY29tcG9uZW50IG9yIHRlbXBsYXRlIGNvbnRhaW5lciBtdXN0IGJlIHByZS1lbXB0aXZlbHlcbiAgLy8gbW9ua2V5LXBhdGNoZWQgd2l0aCB0aGUgY29tcG9uZW50IHZpZXcgZGF0YSBzbyB0aGF0IHRoZSBlbGVtZW50IGNhbiBiZSBpbnNwZWN0ZWRcbiAgLy8gbGF0ZXIgb24gdXNpbmcgYW55IGVsZW1lbnQgZGlzY292ZXJ5IHV0aWxpdHkgbWV0aG9kcyAoc2VlIGBlbGVtZW50X2Rpc2NvdmVyeS50c2ApXG4gIGlmIChnZXRFbGVtZW50RGVwdGhDb3VudCgpID09PSAwKSB7XG4gICAgYXR0YWNoUGF0Y2hEYXRhKG5hdGl2ZSwgbFZpZXcpO1xuICB9XG4gIGluY3JlYXNlRWxlbWVudERlcHRoQ291bnQoKTtcblxuXG4gIGlmIChpc0RpcmVjdGl2ZUhvc3QodE5vZGUpKSB7XG4gICAgY3JlYXRlRGlyZWN0aXZlc0luc3RhbmNlcyh0VmlldywgbFZpZXcsIHROb2RlKTtcbiAgICBleGVjdXRlQ29udGVudFF1ZXJpZXModFZpZXcsIHROb2RlLCBsVmlldyk7XG4gIH1cbiAgaWYgKGxvY2FsUmVmc0luZGV4ICE9PSBudWxsKSB7XG4gICAgc2F2ZVJlc29sdmVkTG9jYWxzSW5EYXRhKGxWaWV3LCB0Tm9kZSk7XG4gIH1cbn1cblxuLyoqXG4gKiBNYXJrIHRoZSBlbmQgb2YgdGhlIGVsZW1lbnQuXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVlbGVtZW50RW5kKCk6IHZvaWQge1xuICBsZXQgcHJldmlvdXNPclBhcmVudFROb2RlID0gZ2V0UHJldmlvdXNPclBhcmVudFROb2RlKCk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKHByZXZpb3VzT3JQYXJlbnRUTm9kZSwgJ05vIHBhcmVudCBub2RlIHRvIGNsb3NlLicpO1xuICBpZiAoZ2V0SXNQYXJlbnQoKSkge1xuICAgIHNldElzTm90UGFyZW50KCk7XG4gIH0gZWxzZSB7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydEhhc1BhcmVudChnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKSk7XG4gICAgcHJldmlvdXNPclBhcmVudFROb2RlID0gcHJldmlvdXNPclBhcmVudFROb2RlLnBhcmVudCE7XG4gICAgc2V0UHJldmlvdXNPclBhcmVudFROb2RlKHByZXZpb3VzT3JQYXJlbnRUTm9kZSwgZmFsc2UpO1xuICB9XG5cbiAgY29uc3QgdE5vZGUgPSBwcmV2aW91c09yUGFyZW50VE5vZGU7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlVHlwZSh0Tm9kZSwgVE5vZGVUeXBlLkVsZW1lbnQpO1xuXG5cbiAgZGVjcmVhc2VFbGVtZW50RGVwdGhDb3VudCgpO1xuXG4gIGNvbnN0IHRWaWV3ID0gZ2V0VFZpZXcoKTtcbiAgaWYgKHRWaWV3LmZpcnN0Q3JlYXRlUGFzcykge1xuICAgIHJlZ2lzdGVyUG9zdE9yZGVySG9va3ModFZpZXcsIHByZXZpb3VzT3JQYXJlbnRUTm9kZSk7XG4gICAgaWYgKGlzQ29udGVudFF1ZXJ5SG9zdChwcmV2aW91c09yUGFyZW50VE5vZGUpKSB7XG4gICAgICB0Vmlldy5xdWVyaWVzIS5lbGVtZW50RW5kKHByZXZpb3VzT3JQYXJlbnRUTm9kZSk7XG4gICAgfVxuICB9XG5cbiAgaWYgKHROb2RlLmNsYXNzZXMgIT09IG51bGwgJiYgaGFzQ2xhc3NJbnB1dCh0Tm9kZSkpIHtcbiAgICBzZXREaXJlY3RpdmVJbnB1dHNXaGljaFNoYWRvd3NTdHlsaW5nKHRWaWV3LCB0Tm9kZSwgZ2V0TFZpZXcoKSwgdE5vZGUuY2xhc3NlcywgdHJ1ZSk7XG4gIH1cblxuICBpZiAodE5vZGUuc3R5bGVzICE9PSBudWxsICYmIGhhc1N0eWxlSW5wdXQodE5vZGUpKSB7XG4gICAgc2V0RGlyZWN0aXZlSW5wdXRzV2hpY2hTaGFkb3dzU3R5bGluZyh0VmlldywgdE5vZGUsIGdldExWaWV3KCksIHROb2RlLnN0eWxlcywgZmFsc2UpO1xuICB9XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhbiBlbXB0eSBlbGVtZW50IHVzaW5nIHtAbGluayBlbGVtZW50U3RhcnR9IGFuZCB7QGxpbmsgZWxlbWVudEVuZH1cbiAqXG4gKiBAcGFyYW0gaW5kZXggSW5kZXggb2YgdGhlIGVsZW1lbnQgaW4gdGhlIGRhdGEgYXJyYXlcbiAqIEBwYXJhbSBuYW1lIE5hbWUgb2YgdGhlIERPTSBOb2RlXG4gKiBAcGFyYW0gYXR0cnNJbmRleCBJbmRleCBvZiB0aGUgZWxlbWVudCdzIGF0dHJpYnV0ZXMgaW4gdGhlIGBjb25zdHNgIGFycmF5LlxuICogQHBhcmFtIGxvY2FsUmVmc0luZGV4IEluZGV4IG9mIHRoZSBlbGVtZW50J3MgbG9jYWwgcmVmZXJlbmNlcyBpbiB0aGUgYGNvbnN0c2AgYXJyYXkuXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVlbGVtZW50KFxuICAgIGluZGV4OiBudW1iZXIsIG5hbWU6IHN0cmluZywgYXR0cnNJbmRleD86IG51bWJlcnxudWxsLCBsb2NhbFJlZnNJbmRleD86IG51bWJlcik6IHZvaWQge1xuICDJtcm1ZWxlbWVudFN0YXJ0KGluZGV4LCBuYW1lLCBhdHRyc0luZGV4LCBsb2NhbFJlZnNJbmRleCk7XG4gIMm1ybVlbGVtZW50RW5kKCk7XG59XG5cbmZ1bmN0aW9uIHdhcm5BYm91dFVua25vd25FbGVtZW50KFxuICAgIHRWaWV3OiBUVmlldywgbFZpZXc6IExWaWV3LCBlbGVtZW50OiBSRWxlbWVudCwgdE5vZGU6IFROb2RlLCBoYXNEaXJlY3RpdmVzOiBib29sZWFuKTogdm9pZCB7XG4gIGNvbnN0IHNjaGVtYXMgPSB0Vmlldy5zY2hlbWFzO1xuXG4gIC8vIElmIGBzY2hlbWFzYCBpcyBzZXQgdG8gYG51bGxgLCB0aGF0J3MgYW4gaW5kaWNhdGlvbiB0aGF0IHRoaXMgQ29tcG9uZW50IHdhcyBjb21waWxlZCBpbiBBT1RcbiAgLy8gbW9kZSB3aGVyZSB0aGlzIGNoZWNrIGhhcHBlbnMgYXQgY29tcGlsZSB0aW1lLiBJbiBKSVQgbW9kZSwgYHNjaGVtYXNgIGlzIGFsd2F5cyBwcmVzZW50IGFuZFxuICAvLyBkZWZpbmVkIGFzIGFuIGFycmF5IChhcyBhbiBlbXB0eSBhcnJheSBpbiBjYXNlIGBzY2hlbWFzYCBmaWVsZCBpcyBub3QgZGVmaW5lZCkgYW5kIHdlIHNob3VsZFxuICAvLyBleGVjdXRlIHRoZSBjaGVjayBiZWxvdy5cbiAgaWYgKHNjaGVtYXMgPT09IG51bGwpIHJldHVybjtcblxuICBjb25zdCB0YWdOYW1lID0gdE5vZGUudGFnTmFtZTtcblxuICAvLyBJZiB0aGUgZWxlbWVudCBtYXRjaGVzIGFueSBkaXJlY3RpdmUsIGl0J3MgY29uc2lkZXJlZCBhcyB2YWxpZC5cbiAgaWYgKCFoYXNEaXJlY3RpdmVzICYmIHRhZ05hbWUgIT09IG51bGwpIHtcbiAgICAvLyBUaGUgZWxlbWVudCBpcyB1bmtub3duIGlmIGl0J3MgYW4gaW5zdGFuY2Ugb2YgSFRNTFVua25vd25FbGVtZW50IG9yIGl0IGlzbid0IHJlZ2lzdGVyZWRcbiAgICAvLyBhcyBhIGN1c3RvbSBlbGVtZW50LiBOb3RlIHRoYXQgdW5rbm93biBlbGVtZW50cyB3aXRoIGEgZGFzaCBpbiB0aGVpciBuYW1lIHdvbid0IGJlIGluc3RhbmNlc1xuICAgIC8vIG9mIEhUTUxVbmtub3duRWxlbWVudCBpbiBicm93c2VycyB0aGF0IHN1cHBvcnQgd2ViIGNvbXBvbmVudHMuXG4gICAgY29uc3QgaXNVbmtub3duID1cbiAgICAgICAgLy8gTm90ZSB0aGF0IHdlIGNhbid0IGNoZWNrIGZvciBgdHlwZW9mIEhUTUxVbmtub3duRWxlbWVudCA9PT0gJ2Z1bmN0aW9uJ2AsXG4gICAgICAgIC8vIGJlY2F1c2Ugd2hpbGUgbW9zdCBicm93c2VycyByZXR1cm4gJ2Z1bmN0aW9uJywgSUUgcmV0dXJucyAnb2JqZWN0Jy5cbiAgICAgICAgKHR5cGVvZiBIVE1MVW5rbm93bkVsZW1lbnQgIT09ICd1bmRlZmluZWQnICYmIEhUTUxVbmtub3duRWxlbWVudCAmJlxuICAgICAgICAgZWxlbWVudCBpbnN0YW5jZW9mIEhUTUxVbmtub3duRWxlbWVudCkgfHxcbiAgICAgICAgKHR5cGVvZiBjdXN0b21FbGVtZW50cyAhPT0gJ3VuZGVmaW5lZCcgJiYgdGFnTmFtZS5pbmRleE9mKCctJykgPiAtMSAmJlxuICAgICAgICAgIWN1c3RvbUVsZW1lbnRzLmdldCh0YWdOYW1lKSk7XG5cbiAgICBpZiAoaXNVbmtub3duICYmICFtYXRjaGluZ1NjaGVtYXModFZpZXcsIGxWaWV3LCB0YWdOYW1lKSkge1xuICAgICAgbGV0IHdhcm5pbmcgPSBgJyR7dGFnTmFtZX0nIGlzIG5vdCBhIGtub3duIGVsZW1lbnQ6XFxuYDtcbiAgICAgIHdhcm5pbmcgKz0gYDEuIElmICcke1xuICAgICAgICAgIHRhZ05hbWV9JyBpcyBhbiBBbmd1bGFyIGNvbXBvbmVudCwgdGhlbiB2ZXJpZnkgdGhhdCBpdCBpcyBwYXJ0IG9mIHRoaXMgbW9kdWxlLlxcbmA7XG4gICAgICBpZiAodGFnTmFtZSAmJiB0YWdOYW1lLmluZGV4T2YoJy0nKSA+IC0xKSB7XG4gICAgICAgIHdhcm5pbmcgKz0gYDIuIElmICcke1xuICAgICAgICAgICAgdGFnTmFtZX0nIGlzIGEgV2ViIENvbXBvbmVudCB0aGVuIGFkZCAnQ1VTVE9NX0VMRU1FTlRTX1NDSEVNQScgdG8gdGhlICdATmdNb2R1bGUuc2NoZW1hcycgb2YgdGhpcyBjb21wb25lbnQgdG8gc3VwcHJlc3MgdGhpcyBtZXNzYWdlLmA7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB3YXJuaW5nICs9XG4gICAgICAgICAgICBgMi4gVG8gYWxsb3cgYW55IGVsZW1lbnQgYWRkICdOT19FUlJPUlNfU0NIRU1BJyB0byB0aGUgJ0BOZ01vZHVsZS5zY2hlbWFzJyBvZiB0aGlzIGNvbXBvbmVudC5gO1xuICAgICAgfVxuICAgICAgY29uc29sZS53YXJuKHdhcm5pbmcpO1xuICAgIH1cbiAgfVxufVxuIl19