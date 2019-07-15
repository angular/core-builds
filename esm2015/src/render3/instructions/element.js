/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
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
import { BINDING_INDEX, HEADER_OFFSET, QUERIES, RENDERER, TVIEW, T_HOST } from '../interfaces/view';
import { assertNodeType } from '../node_assert';
import { appendChild } from '../node_manipulation';
import { applyOnCreateInstructions } from '../node_util';
import { decreaseElementDepthCount, getElementDepthCount, getIsParent, getLView, getPreviousOrParentTNode, getSelectedIndex, increaseElementDepthCount, setIsNotParent, setPreviousOrParentTNode } from '../state';
import { getInitialClassNameValue, getInitialStyleStringValue, initializeStaticContext, patchContextWithStaticAttrs, renderInitialClasses, renderInitialStyles } from '../styling/class_and_style_bindings';
import { getStylingContextFromLView, hasClassInput, hasStyleInput } from '../styling/util';
import { registerInitialStylingIntoContext } from '../styling_next/instructions';
import { runtimeIsNewStylingInUse } from '../styling_next/state';
import { attrsStylingIndexOf, setUpAttributes } from '../util/attrs_utils';
import { getNativeByTNode, getTNode } from '../util/view_utils';
import { createDirectivesAndLocals, elementCreate, executeContentQueries, getOrCreateTNode, initializeTNodeInputs, setInputsForProperty, setNodeStylingTemplate } from './shared';
import { getActiveDirectiveStylingIndex } from './styling';
/**
 * Create DOM element. The instruction must later be followed by `elementEnd()` call.
 *
 * \@codeGenApi
 * @param {?} index Index of the element in the LView array
 * @param {?} name Name of the DOM Node
 * @param {?=} attrs Statically bound set of attributes, classes, and styles to be written into the DOM
 *              element on creation. Use [AttributeMarker] to denote the meaning of this array.
 * @param {?=} localRefs A set of local reference bindings on the element.
 *
 * Attributes and localRefs are passed as an array of strings where elements with an even index
 * hold an attribute name and elements with an odd index hold an attribute value, ex.:
 * ['id', 'warning5', 'class', 'alert']
 *
 * @return {?}
 */
export function ɵɵelementStart(index, name, attrs, localRefs) {
    /** @type {?} */
    const lView = getLView();
    /** @type {?} */
    const tView = lView[TVIEW];
    ngDevMode && assertEqual(lView[BINDING_INDEX], tView.bindingStartIndex, 'elements should be created before any bindings ');
    ngDevMode && ngDevMode.rendererCreateElement++;
    ngDevMode && assertDataInRange(lView, index + HEADER_OFFSET);
    /** @type {?} */
    const native = lView[index + HEADER_OFFSET] = elementCreate(name);
    /** @type {?} */
    const renderer = lView[RENDERER];
    /** @type {?} */
    const tNode = getOrCreateTNode(tView, lView[T_HOST], index, 3 /* Element */, name, attrs || null);
    /** @type {?} */
    let initialStylesIndex = 0;
    /** @type {?} */
    let initialClassesIndex = 0;
    /** @type {?} */
    let lastAttrIndex = -1;
    if (attrs) {
        lastAttrIndex = setUpAttributes(native, attrs);
        // it's important to only prepare styling-related datastructures once for a given
        // tNode and not each time an element is created. Also, the styling code is designed
        // to be patched and constructed at various points, but only up until the styling
        // template is first allocated (which happens when the very first style/class binding
        // value is evaluated). When the template is allocated (when it turns into a context)
        // then the styling template is locked and cannot be further extended (it can only be
        // instantiated into a context per element)
        setNodeStylingTemplate(tView, tNode, attrs, lastAttrIndex);
        /** @type {?} */
        const stylingTemplate = tNode.stylingTemplate;
        if (stylingTemplate) {
            // the initial style/class values are rendered immediately after having been
            // initialized into the context so the element styling is ready when directives
            // are initialized (since they may read style/class values in their constructor)
            initialStylesIndex = renderInitialStyles(native, stylingTemplate, renderer);
            initialClassesIndex = renderInitialClasses(native, stylingTemplate, renderer);
        }
    }
    appendChild(native, tNode, lView);
    createDirectivesAndLocals(tView, lView, tNode, localRefs);
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
        /** @type {?} */
        const inputData = initializeTNodeInputs(tNode);
        if (inputData && inputData.hasOwnProperty('class')) {
            tNode.flags |= 8 /* hasClassInput */;
        }
        if (inputData && inputData.hasOwnProperty('style')) {
            tNode.flags |= 16 /* hasStyleInput */;
        }
    }
    // we render the styling again below in case any directives have set any `style` and/or
    // `class` host attribute values...
    if (tNode.stylingTemplate) {
        renderInitialClasses(native, tNode.stylingTemplate, renderer, initialClassesIndex);
        renderInitialStyles(native, tNode.stylingTemplate, renderer, initialStylesIndex);
    }
    if (runtimeIsNewStylingInUse() && lastAttrIndex >= 0) {
        registerInitialStylingIntoContext(tNode, (/** @type {?} */ (attrs)), lastAttrIndex);
    }
    /** @type {?} */
    const currentQueries = lView[QUERIES];
    if (currentQueries) {
        currentQueries.addNode(tNode);
        lView[QUERIES] = currentQueries.clone(tNode);
    }
    executeContentQueries(tView, tNode, lView);
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
    // this is required for all host-level styling-related instructions to run
    // in the correct order
    previousOrParentTNode.onElementCreationFns && applyOnCreateInstructions(previousOrParentTNode);
    ngDevMode && assertNodeType(previousOrParentTNode, 3 /* Element */);
    /** @type {?} */
    const lView = getLView();
    /** @type {?} */
    const currentQueries = lView[QUERIES];
    // Go back up to parent queries only if queries have been cloned on this element.
    if (currentQueries && previousOrParentTNode.index === currentQueries.nodeIndex) {
        lView[QUERIES] = currentQueries.parent;
    }
    registerPostOrderHooks(lView[TVIEW], previousOrParentTNode);
    decreaseElementDepthCount();
    // this is fired at the end of elementEnd because ALL of the stylingBindings code
    // (for directives and the template) have now executed which means the styling
    // context can be instantiated properly.
    /** @type {?} */
    let stylingContext = null;
    if (hasClassInput(previousOrParentTNode)) {
        stylingContext = getStylingContextFromLView(previousOrParentTNode.index, lView);
        setInputsForProperty(lView, (/** @type {?} */ ((/** @type {?} */ (previousOrParentTNode.inputs))['class'])), getInitialClassNameValue(stylingContext));
    }
    if (hasStyleInput(previousOrParentTNode)) {
        stylingContext =
            stylingContext || getStylingContextFromLView(previousOrParentTNode.index, lView);
        setInputsForProperty(lView, (/** @type {?} */ ((/** @type {?} */ (previousOrParentTNode.inputs))['style'])), getInitialStyleStringValue(stylingContext));
    }
}
/**
 * Creates an empty element using {\@link elementStart} and {\@link elementEnd}
 *
 * \@codeGenApi
 * @param {?} index Index of the element in the data array
 * @param {?} name Name of the DOM Node
 * @param {?=} attrs Statically bound set of attributes, classes, and styles to be written into the DOM
 *              element on creation. Use [AttributeMarker] to denote the meaning of this array.
 * @param {?=} localRefs A set of local reference bindings on the element.
 *
 * @return {?}
 */
export function ɵɵelement(index, name, attrs, localRefs) {
    ɵɵelementStart(index, name, attrs, localRefs);
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
    const tNode = getTNode(hostElementIndex, lView);
    // non-element nodes (e.g. `<ng-container>`) are not rendered as actual
    // element nodes and adding styles/classes on to them will cause runtime
    // errors...
    if (tNode.type === 3 /* Element */) {
        /** @type {?} */
        const native = (/** @type {?} */ (getNativeByTNode(tNode, lView)));
        /** @type {?} */
        const lastAttrIndex = setUpAttributes(native, attrs);
        /** @type {?} */
        const stylingAttrsStartIndex = attrsStylingIndexOf(attrs, lastAttrIndex);
        if (stylingAttrsStartIndex >= 0) {
            /** @type {?} */
            const directiveStylingIndex = getActiveDirectiveStylingIndex();
            if (tNode.stylingTemplate) {
                patchContextWithStaticAttrs(tNode.stylingTemplate, attrs, stylingAttrsStartIndex, directiveStylingIndex);
            }
            else {
                tNode.stylingTemplate =
                    initializeStaticContext(attrs, stylingAttrsStartIndex, directiveStylingIndex);
            }
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWxlbWVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaW5zdHJ1Y3Rpb25zL2VsZW1lbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFPQSxPQUFPLEVBQUMsaUJBQWlCLEVBQUUsYUFBYSxFQUFFLFdBQVcsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQ2hGLE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSxXQUFXLENBQUM7QUFDMUMsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLHNCQUFzQixDQUFDO0FBQ3JELE9BQU8sRUFBQyxzQkFBc0IsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUloRCxPQUFPLEVBQUMsYUFBYSxFQUFFLGFBQWEsRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUNsRyxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFDOUMsT0FBTyxFQUFDLFdBQVcsRUFBQyxNQUFNLHNCQUFzQixDQUFDO0FBQ2pELE9BQU8sRUFBQyx5QkFBeUIsRUFBQyxNQUFNLGNBQWMsQ0FBQztBQUN2RCxPQUFPLEVBQUMseUJBQXlCLEVBQUUsb0JBQW9CLEVBQUUsV0FBVyxFQUFFLFFBQVEsRUFBRSx3QkFBd0IsRUFBRSxnQkFBZ0IsRUFBRSx5QkFBeUIsRUFBRSxjQUFjLEVBQUUsd0JBQXdCLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDak4sT0FBTyxFQUFDLHdCQUF3QixFQUFFLDBCQUEwQixFQUFFLHVCQUF1QixFQUFFLDJCQUEyQixFQUFFLG9CQUFvQixFQUFFLG1CQUFtQixFQUFDLE1BQU0scUNBQXFDLENBQUM7QUFDMU0sT0FBTyxFQUFDLDBCQUEwQixFQUFFLGFBQWEsRUFBRSxhQUFhLEVBQUMsTUFBTSxpQkFBaUIsQ0FBQztBQUN6RixPQUFPLEVB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QUFLLENBQUMsZUFBZSxFQUFFLEtBQUssRUFBRSxzQkFBc0IsRUFBRSxxQkFBcUIsQ0FBQyxDQUFDO2FBQ2xGO2lCQUFNO2dCQUNMLEtBQUssQ0FBQyxlQUFlO29CQUNqQix1QkFBdUIsQ0FBQyxLQUFLLEVBQUUsc0JBQXNCLEVBQUUscUJBQXFCLENBQUMsQ0FBQzthQUNuRjtTQUNGO0tBQ0Y7QUFDSCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0IHthc3NlcnREYXRhSW5SYW5nZSwgYXNzZXJ0RGVmaW5lZCwgYXNzZXJ0RXF1YWx9IGZyb20gJy4uLy4uL3V0aWwvYXNzZXJ0JztcbmltcG9ydCB7YXNzZXJ0SGFzUGFyZW50fSBmcm9tICcuLi9hc3NlcnQnO1xuaW1wb3J0IHthdHRhY2hQYXRjaERhdGF9IGZyb20gJy4uL2NvbnRleHRfZGlzY292ZXJ5JztcbmltcG9ydCB7cmVnaXN0ZXJQb3N0T3JkZXJIb29rc30gZnJvbSAnLi4vaG9va3MnO1xuaW1wb3J0IHtUQXR0cmlidXRlcywgVE5vZGVGbGFncywgVE5vZGVUeXBlfSBmcm9tICcuLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtSRWxlbWVudH0gZnJvbSAnLi4vaW50ZXJmYWNlcy9yZW5kZXJlcic7XG5pbXBvcnQge1N0eWxpbmdDb250ZXh0fSBmcm9tICcuLi9pbnRlcmZhY2VzL3N0eWxpbmcnO1xuaW1wb3J0IHtCSU5ESU5HX0lOREVYLCBIRUFERVJfT0ZGU0VULCBRVUVSSUVTLCBSRU5ERVJFUiwgVFZJRVcsIFRfSE9TVH0gZnJvbSAnLi4vaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7YXNzZXJ0Tm9kZVR5cGV9IGZyb20gJy4uL25vZGVfYXNzZXJ0JztcbmltcG9ydCB7YXBwZW5kQ2hpbGR9IGZyb20gJy4uL25vZGVfbWFuaXB1bGF0aW9uJztcbmltcG9ydCB7YXBwbHlPbkNyZWF0ZUluc3RydWN0aW9uc30gZnJvbSAnLi4vbm9kZV91dGlsJztcbmltcG9ydCB7ZGVjcmVhc2VFbGVtZW50RGVwdGhDb3VudCwgZ2V0RWxlbWVudERlcHRoQ291bnQsIGdldElzUGFyZW50LCBnZXRMVmlldywgZ2V0UHJldmlvdXNPclBhcmVudFROb2RlLCBnZXRTZWxlY3RlZEluZGV4LCBpbmNyZWFzZUVsZW1lbnREZXB0aENvdW50LCBzZXRJc05vdFBhcmVudCwgc2V0UHJldmlvdXNPclBhcmVudFROb2RlfSBmcm9tICcuLi9zdGF0ZSc7XG5pbXBvcnQge2dldEluaXRpYWxDbGFzc05hbWVWYWx1ZSwgZ2V0SW5pdGlhbFN0eWxlU3RyaW5nVmFsdWUsIGluaXRpYWxpemVTdGF0aWNDb250ZXh0LCBwYXRjaENvbnRleHRXaXRoU3RhdGljQXR0cnMsIHJlbmRlckluaXRpYWxDbGFzc2VzLCByZW5kZXJJbml0aWFsU3R5bGVzfSBmcm9tICcuLi9zdHlsaW5nL2NsYXNzX2FuZF9zdHlsZV9iaW5kaW5ncyc7XG5pbXBvcnQge2dldFN0eWxpbmdDb250ZXh0RnJvbUxWaWV3LCBoYXNDbGFzc0lucHV0LCBoYXNTdHlsZUlucHV0fSBmcm9tICcuLi9zdHlsaW5nL3V0aWwnO1xuaW1wb3J0IHtyZWdpc3RlckluaXRpYWxTdHlsaW5nSW50b0NvbnRleHR9IGZyb20gJy4uL3N0eWxpbmdfbmV4dC9pbnN0cnVjdGlvbnMnO1xuaW1wb3J0IHtydW50aW1lSXNOZXdTdHlsaW5nSW5Vc2V9IGZyb20gJy4uL3N0eWxpbmdfbmV4dC9zdGF0ZSc7XG5pbXBvcnQge2F0dHJzU3R5bGluZ0luZGV4T2YsIHNldFVwQXR0cmlidXRlc30gZnJvbSAnLi4vdXRpbC9hdHRyc191dGlscyc7XG5pbXBvcnQge2dldE5hdGl2ZUJ5VE5vZGUsIGdldFROb2RlfSBmcm9tICcuLi91dGlsL3ZpZXdfdXRpbHMnO1xuXG5pbXBvcnQge2NyZWF0ZURpcmVjdGl2ZXNBbmRMb2NhbHMsIGVsZW1lbnRDcmVhdGUsIGV4ZWN1dGVDb250ZW50UXVlcmllcywgZ2V0T3JDcmVhdGVUTm9kZSwgaW5pdGlhbGl6ZVROb2RlSW5wdXRzLCBzZXRJbnB1dHNGb3JQcm9wZXJ0eSwgc2V0Tm9kZVN0eWxpbmdUZW1wbGF0ZX0gZnJvbSAnLi9zaGFyZWQnO1xuaW1wb3J0IHtnZXRBY3RpdmVEaXJlY3RpdmVTdHlsaW5nSW5kZXh9IGZyb20gJy4vc3R5bGluZyc7XG5cblxuXG4vKipcbiAqIENyZWF0ZSBET00gZWxlbWVudC4gVGhlIGluc3RydWN0aW9uIG11c3QgbGF0ZXIgYmUgZm9sbG93ZWQgYnkgYGVsZW1lbnRFbmQoKWAgY2FsbC5cbiAqXG4gKiBAcGFyYW0gaW5kZXggSW5kZXggb2YgdGhlIGVsZW1lbnQgaW4gdGhlIExWaWV3IGFycmF5XG4gKiBAcGFyYW0gbmFtZSBOYW1lIG9mIHRoZSBET00gTm9kZVxuICogQHBhcmFtIGF0dHJzIFN0YXRpY2FsbHkgYm91bmQgc2V0IG9mIGF0dHJpYnV0ZXMsIGNsYXNzZXMsIGFuZCBzdHlsZXMgdG8gYmUgd3JpdHRlbiBpbnRvIHRoZSBET01cbiAqICAgICAgICAgICAgICBlbGVtZW50IG9uIGNyZWF0aW9uLiBVc2UgW0F0dHJpYnV0ZU1hcmtlcl0gdG8gZGVub3RlIHRoZSBtZWFuaW5nIG9mIHRoaXMgYXJyYXkuXG4gKiBAcGFyYW0gbG9jYWxSZWZzIEEgc2V0IG9mIGxvY2FsIHJlZmVyZW5jZSBiaW5kaW5ncyBvbiB0aGUgZWxlbWVudC5cbiAqXG4gKiBBdHRyaWJ1dGVzIGFuZCBsb2NhbFJlZnMgYXJlIHBhc3NlZCBhcyBhbiBhcnJheSBvZiBzdHJpbmdzIHdoZXJlIGVsZW1lbnRzIHdpdGggYW4gZXZlbiBpbmRleFxuICogaG9sZCBhbiBhdHRyaWJ1dGUgbmFtZSBhbmQgZWxlbWVudHMgd2l0aCBhbiBvZGQgaW5kZXggaG9sZCBhbiBhdHRyaWJ1dGUgdmFsdWUsIGV4LjpcbiAqIFsnaWQnLCAnd2FybmluZzUnLCAnY2xhc3MnLCAnYWxlcnQnXVxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1ZWxlbWVudFN0YXJ0KFxuICAgIGluZGV4OiBudW1iZXIsIG5hbWU6IHN0cmluZywgYXR0cnM/OiBUQXR0cmlidXRlcyB8IG51bGwsIGxvY2FsUmVmcz86IHN0cmluZ1tdIHwgbnVsbCk6IHZvaWQge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IHRWaWV3ID0gbFZpZXdbVFZJRVddO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RXF1YWwoXG4gICAgICAgICAgICAgICAgICAgbFZpZXdbQklORElOR19JTkRFWF0sIHRWaWV3LmJpbmRpbmdTdGFydEluZGV4LFxuICAgICAgICAgICAgICAgICAgICdlbGVtZW50cyBzaG91bGQgYmUgY3JlYXRlZCBiZWZvcmUgYW55IGJpbmRpbmdzICcpO1xuXG4gIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJDcmVhdGVFbGVtZW50Kys7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREYXRhSW5SYW5nZShsVmlldywgaW5kZXggKyBIRUFERVJfT0ZGU0VUKTtcbiAgY29uc3QgbmF0aXZlID0gbFZpZXdbaW5kZXggKyBIRUFERVJfT0ZGU0VUXSA9IGVsZW1lbnRDcmVhdGUobmFtZSk7XG4gIGNvbnN0IHJlbmRlcmVyID0gbFZpZXdbUkVOREVSRVJdO1xuICBjb25zdCB0Tm9kZSA9XG4gICAgICBnZXRPckNyZWF0ZVROb2RlKHRWaWV3LCBsVmlld1tUX0hPU1RdLCBpbmRleCwgVE5vZGVUeXBlLkVsZW1lbnQsIG5hbWUsIGF0dHJzIHx8IG51bGwpO1xuICBsZXQgaW5pdGlhbFN0eWxlc0luZGV4ID0gMDtcbiAgbGV0IGluaXRpYWxDbGFzc2VzSW5kZXggPSAwO1xuXG4gIGxldCBsYXN0QXR0ckluZGV4ID0gLTE7XG4gIGlmIChhdHRycykge1xuICAgIGxhc3RBdHRySW5kZXggPSBzZXRVcEF0dHJpYnV0ZXMobmF0aXZlLCBhdHRycyk7XG5cbiAgICAvLyBpdCdzIGltcG9ydGFudCB0byBvbmx5IHByZXBhcmUgc3R5bGluZy1yZWxhdGVkIGRhdGFzdHJ1Y3R1cmVzIG9uY2UgZm9yIGEgZ2l2ZW5cbiAgICAvLyB0Tm9kZSBhbmQgbm90IGVhY2ggdGltZSBhbiBlbGVtZW50IGlzIGNyZWF0ZWQuIEFsc28sIHRoZSBzdHlsaW5nIGNvZGUgaXMgZGVzaWduZWRcbiAgICAvLyB0byBiZSBwYXRjaGVkIGFuZCBjb25zdHJ1Y3RlZCBhdCB2YXJpb3VzIHBvaW50cywgYnV0IG9ubHkgdXAgdW50aWwgdGhlIHN0eWxpbmdcbiAgICAvLyB0ZW1wbGF0ZSBpcyBmaXJzdCBhbGxvY2F0ZWQgKHdoaWNoIGhhcHBlbnMgd2hlbiB0aGUgdmVyeSBmaXJzdCBzdHlsZS9jbGFzcyBiaW5kaW5nXG4gICAgLy8gdmFsdWUgaXMgZXZhbHVhdGVkKS4gV2hlbiB0aGUgdGVtcGxhdGUgaXMgYWxsb2NhdGVkICh3aGVuIGl0IHR1cm5zIGludG8gYSBjb250ZXh0KVxuICAgIC8vIHRoZW4gdGhlIHN0eWxpbmcgdGVtcGxhdGUgaXMgbG9ja2VkIGFuZCBjYW5ub3QgYmUgZnVydGhlciBleHRlbmRlZCAoaXQgY2FuIG9ubHkgYmVcbiAgICAvLyBpbnN0YW50aWF0ZWQgaW50byBhIGNvbnRleHQgcGVyIGVsZW1lbnQpXG4gICAgc2V0Tm9kZVN0eWxpbmdUZW1wbGF0ZSh0VmlldywgdE5vZGUsIGF0dHJzLCBsYXN0QXR0ckluZGV4KTtcblxuICAgIGNvbnN0IHN0eWxpbmdUZW1wbGF0ZSA9IHROb2RlLnN0eWxpbmdUZW1wbGF0ZTtcbiAgICBpZiAoc3R5bGluZ1RlbXBsYXRlKSB7XG4gICAgICAvLyB0aGUgaW5pdGlhbCBzdHlsZS9jbGFzcyB2YWx1ZXMgYXJlIHJlbmRlcmVkIGltbWVkaWF0ZWx5IGFmdGVyIGhhdmluZyBiZWVuXG4gICAgICAvLyBpbml0aWFsaXplZCBpbnRvIHRoZSBjb250ZXh0IHNvIHRoZSBlbGVtZW50IHN0eWxpbmcgaXMgcmVhZHkgd2hlbiBkaXJlY3RpdmVzXG4gICAgICAvLyBhcmUgaW5pdGlhbGl6ZWQgKHNpbmNlIHRoZXkgbWF5IHJlYWQgc3R5bGUvY2xhc3MgdmFsdWVzIGluIHRoZWlyIGNvbnN0cnVjdG9yKVxuICAgICAgaW5pdGlhbFN0eWxlc0luZGV4ID0gcmVuZGVySW5pdGlhbFN0eWxlcyhuYXRpdmUsIHN0eWxpbmdUZW1wbGF0ZSwgcmVuZGVyZXIpO1xuICAgICAgaW5pdGlhbENsYXNzZXNJbmRleCA9IHJlbmRlckluaXRpYWxDbGFzc2VzKG5hdGl2ZSwgc3R5bGluZ1RlbXBsYXRlLCByZW5kZXJlcik7XG4gICAgfVxuICB9XG5cbiAgYXBwZW5kQ2hpbGQobmF0aXZlLCB0Tm9kZSwgbFZpZXcpO1xuICBjcmVhdGVEaXJlY3RpdmVzQW5kTG9jYWxzKHRWaWV3LCBsVmlldywgdE5vZGUsIGxvY2FsUmVmcyk7XG5cbiAgLy8gYW55IGltbWVkaWF0ZSBjaGlsZHJlbiBvZiBhIGNvbXBvbmVudCBvciB0ZW1wbGF0ZSBjb250YWluZXIgbXVzdCBiZSBwcmUtZW1wdGl2ZWx5XG4gIC8vIG1vbmtleS1wYXRjaGVkIHdpdGggdGhlIGNvbXBvbmVudCB2aWV3IGRhdGEgc28gdGhhdCB0aGUgZWxlbWVudCBjYW4gYmUgaW5zcGVjdGVkXG4gIC8vIGxhdGVyIG9uIHVzaW5nIGFueSBlbGVtZW50IGRpc2NvdmVyeSB1dGlsaXR5IG1ldGhvZHMgKHNlZSBgZWxlbWVudF9kaXNjb3ZlcnkudHNgKVxuICBpZiAoZ2V0RWxlbWVudERlcHRoQ291bnQoKSA9PT0gMCkge1xuICAgIGF0dGFjaFBhdGNoRGF0YShuYXRpdmUsIGxWaWV3KTtcbiAgfVxuICBpbmNyZWFzZUVsZW1lbnREZXB0aENvdW50KCk7XG5cbiAgLy8gaWYgYSBkaXJlY3RpdmUgY29udGFpbnMgYSBob3N0IGJpbmRpbmcgZm9yIFwiY2xhc3NcIiB0aGVuIGFsbCBjbGFzcy1iYXNlZCBkYXRhIHdpbGxcbiAgLy8gZmxvdyB0aHJvdWdoIHRoYXQgKGV4Y2VwdCBmb3IgYFtjbGFzcy5wcm9wXWAgYmluZGluZ3MpLiBUaGlzIGFsc28gaW5jbHVkZXMgaW5pdGlhbFxuICAvLyBzdGF0aWMgY2xhc3MgdmFsdWVzIGFzIHdlbGwuIChOb3RlIHRoYXQgdGhpcyB3aWxsIGJlIGZpeGVkIG9uY2UgbWFwLWJhc2VkIGBbc3R5bGVdYFxuICAvLyBhbmQgYFtjbGFzc11gIGJpbmRpbmdzIHdvcmsgZm9yIG11bHRpcGxlIGRpcmVjdGl2ZXMuKVxuICBpZiAodFZpZXcuZmlyc3RUZW1wbGF0ZVBhc3MpIHtcbiAgICBjb25zdCBpbnB1dERhdGEgPSBpbml0aWFsaXplVE5vZGVJbnB1dHModE5vZGUpO1xuICAgIGlmIChpbnB1dERhdGEgJiYgaW5wdXREYXRhLmhhc093blByb3BlcnR5KCdjbGFzcycpKSB7XG4gICAgICB0Tm9kZS5mbGFncyB8PSBUTm9kZUZsYWdzLmhhc0NsYXNzSW5wdXQ7XG4gICAgfVxuICAgIGlmIChpbnB1dERhdGEgJiYgaW5wdXREYXRhLmhhc093blByb3BlcnR5KCdzdHlsZScpKSB7XG4gICAgICB0Tm9kZS5mbGFncyB8PSBUTm9kZUZsYWdzLmhhc1N0eWxlSW5wdXQ7XG4gICAgfVxuICB9XG5cbiAgLy8gd2UgcmVuZGVyIHRoZSBzdHlsaW5nIGFnYWluIGJlbG93IGluIGNhc2UgYW55IGRpcmVjdGl2ZXMgaGF2ZSBzZXQgYW55IGBzdHlsZWAgYW5kL29yXG4gIC8vIGBjbGFzc2AgaG9zdCBhdHRyaWJ1dGUgdmFsdWVzLi4uXG4gIGlmICh0Tm9kZS5zdHlsaW5nVGVtcGxhdGUpIHtcbiAgICByZW5kZXJJbml0aWFsQ2xhc3NlcyhuYXRpdmUsIHROb2RlLnN0eWxpbmdUZW1wbGF0ZSwgcmVuZGVyZXIsIGluaXRpYWxDbGFzc2VzSW5kZXgpO1xuICAgIHJlbmRlckluaXRpYWxTdHlsZXMobmF0aXZlLCB0Tm9kZS5zdHlsaW5nVGVtcGxhdGUsIHJlbmRlcmVyLCBpbml0aWFsU3R5bGVzSW5kZXgpO1xuICB9XG5cbiAgaWYgKHJ1bnRpbWVJc05ld1N0eWxpbmdJblVzZSgpICYmIGxhc3RBdHRySW5kZXggPj0gMCkge1xuICAgIHJlZ2lzdGVySW5pdGlhbFN0eWxpbmdJbnRvQ29udGV4dCh0Tm9kZSwgYXR0cnMgYXMgVEF0dHJpYnV0ZXMsIGxhc3RBdHRySW5kZXgpO1xuICB9XG5cbiAgY29uc3QgY3VycmVudFF1ZXJpZXMgPSBsVmlld1tRVUVSSUVTXTtcbiAgaWYgKGN1cnJlbnRRdWVyaWVzKSB7XG4gICAgY3VycmVudFF1ZXJpZXMuYWRkTm9kZSh0Tm9kZSk7XG4gICAgbFZpZXdbUVVFUklFU10gPSBjdXJyZW50UXVlcmllcy5jbG9uZSh0Tm9kZSk7XG4gIH1cbiAgZXhlY3V0ZUNvbnRlbnRRdWVyaWVzKHRWaWV3LCB0Tm9kZSwgbFZpZXcpO1xufVxuXG4vKipcbiAqIE1hcmsgdGhlIGVuZCBvZiB0aGUgZWxlbWVudC5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWVsZW1lbnRFbmQoKTogdm9pZCB7XG4gIGxldCBwcmV2aW91c09yUGFyZW50VE5vZGUgPSBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQocHJldmlvdXNPclBhcmVudFROb2RlLCAnTm8gcGFyZW50IG5vZGUgdG8gY2xvc2UuJyk7XG4gIGlmIChnZXRJc1BhcmVudCgpKSB7XG4gICAgc2V0SXNOb3RQYXJlbnQoKTtcbiAgfSBlbHNlIHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0SGFzUGFyZW50KGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSgpKTtcbiAgICBwcmV2aW91c09yUGFyZW50VE5vZGUgPSBwcmV2aW91c09yUGFyZW50VE5vZGUucGFyZW50ICE7XG4gICAgc2V0UHJldmlvdXNPclBhcmVudFROb2RlKHByZXZpb3VzT3JQYXJlbnRUTm9kZSwgZmFsc2UpO1xuICB9XG5cbiAgLy8gdGhpcyBpcyByZXF1aXJlZCBmb3IgYWxsIGhvc3QtbGV2ZWwgc3R5bGluZy1yZWxhdGVkIGluc3RydWN0aW9ucyB0byBydW5cbiAgLy8gaW4gdGhlIGNvcnJlY3Qgb3JkZXJcbiAgcHJldmlvdXNPclBhcmVudFROb2RlLm9uRWxlbWVudENyZWF0aW9uRm5zICYmIGFwcGx5T25DcmVhdGVJbnN0cnVjdGlvbnMocHJldmlvdXNPclBhcmVudFROb2RlKTtcblxuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZVR5cGUocHJldmlvdXNPclBhcmVudFROb2RlLCBUTm9kZVR5cGUuRWxlbWVudCk7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgY3VycmVudFF1ZXJpZXMgPSBsVmlld1tRVUVSSUVTXTtcbiAgLy8gR28gYmFjayB1cCB0byBwYXJlbnQgcXVlcmllcyBvbmx5IGlmIHF1ZXJpZXMgaGF2ZSBiZWVuIGNsb25lZCBvbiB0aGlzIGVsZW1lbnQuXG4gIGlmIChjdXJyZW50UXVlcmllcyAmJiBwcmV2aW91c09yUGFyZW50VE5vZGUuaW5kZXggPT09IGN1cnJlbnRRdWVyaWVzLm5vZGVJbmRleCkge1xuICAgIGxWaWV3W1FVRVJJRVNdID0gY3VycmVudFF1ZXJpZXMucGFyZW50O1xuICB9XG5cbiAgcmVnaXN0ZXJQb3N0T3JkZXJIb29rcyhsVmlld1tUVklFV10sIHByZXZpb3VzT3JQYXJlbnRUTm9kZSk7XG4gIGRlY3JlYXNlRWxlbWVudERlcHRoQ291bnQoKTtcblxuICAvLyB0aGlzIGlzIGZpcmVkIGF0IHRoZSBlbmQgb2YgZWxlbWVudEVuZCBiZWNhdXNlIEFMTCBvZiB0aGUgc3R5bGluZ0JpbmRpbmdzIGNvZGVcbiAgLy8gKGZvciBkaXJlY3RpdmVzIGFuZCB0aGUgdGVtcGxhdGUpIGhhdmUgbm93IGV4ZWN1dGVkIHdoaWNoIG1lYW5zIHRoZSBzdHlsaW5nXG4gIC8vIGNvbnRleHQgY2FuIGJlIGluc3RhbnRpYXRlZCBwcm9wZXJseS5cbiAgbGV0IHN0eWxpbmdDb250ZXh0OiBTdHlsaW5nQ29udGV4dHxudWxsID0gbnVsbDtcbiAgaWYgKGhhc0NsYXNzSW5wdXQocHJldmlvdXNPclBhcmVudFROb2RlKSkge1xuICAgIHN0eWxpbmdDb250ZXh0ID0gZ2V0U3R5bGluZ0NvbnRleHRGcm9tTFZpZXcocHJldmlvdXNPclBhcmVudFROb2RlLmluZGV4LCBsVmlldyk7XG4gICAgc2V0SW5wdXRzRm9yUHJvcGVydHkoXG4gICAgICAgIGxWaWV3LCBwcmV2aW91c09yUGFyZW50VE5vZGUuaW5wdXRzICFbJ2NsYXNzJ10gISwgZ2V0SW5pdGlhbENsYXNzTmFtZVZhbHVlKHN0eWxpbmdDb250ZXh0KSk7XG4gIH1cbiAgaWYgKGhhc1N0eWxlSW5wdXQocHJldmlvdXNPclBhcmVudFROb2RlKSkge1xuICAgIHN0eWxpbmdDb250ZXh0ID1cbiAgICAgICAgc3R5bGluZ0NvbnRleHQgfHwgZ2V0U3R5bGluZ0NvbnRleHRGcm9tTFZpZXcocHJldmlvdXNPclBhcmVudFROb2RlLmluZGV4LCBsVmlldyk7XG4gICAgc2V0SW5wdXRzRm9yUHJvcGVydHkoXG4gICAgICAgIGxWaWV3LCBwcmV2aW91c09yUGFyZW50VE5vZGUuaW5wdXRzICFbJ3N0eWxlJ10gISxcbiAgICAgICAgZ2V0SW5pdGlhbFN0eWxlU3RyaW5nVmFsdWUoc3R5bGluZ0NvbnRleHQpKTtcbiAgfVxufVxuXG5cbi8qKlxuICogQ3JlYXRlcyBhbiBlbXB0eSBlbGVtZW50IHVzaW5nIHtAbGluayBlbGVtZW50U3RhcnR9IGFuZCB7QGxpbmsgZWxlbWVudEVuZH1cbiAqXG4gKiBAcGFyYW0gaW5kZXggSW5kZXggb2YgdGhlIGVsZW1lbnQgaW4gdGhlIGRhdGEgYXJyYXlcbiAqIEBwYXJhbSBuYW1lIE5hbWUgb2YgdGhlIERPTSBOb2RlXG4gKiBAcGFyYW0gYXR0cnMgU3RhdGljYWxseSBib3VuZCBzZXQgb2YgYXR0cmlidXRlcywgY2xhc3NlcywgYW5kIHN0eWxlcyB0byBiZSB3cml0dGVuIGludG8gdGhlIERPTVxuICogICAgICAgICAgICAgIGVsZW1lbnQgb24gY3JlYXRpb24uIFVzZSBbQXR0cmlidXRlTWFya2VyXSB0byBkZW5vdGUgdGhlIG1lYW5pbmcgb2YgdGhpcyBhcnJheS5cbiAqIEBwYXJhbSBsb2NhbFJlZnMgQSBzZXQgb2YgbG9jYWwgcmVmZXJlbmNlIGJpbmRpbmdzIG9uIHRoZSBlbGVtZW50LlxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1ZWxlbWVudChcbiAgICBpbmRleDogbnVtYmVyLCBuYW1lOiBzdHJpbmcsIGF0dHJzPzogVEF0dHJpYnV0ZXMgfCBudWxsLCBsb2NhbFJlZnM/OiBzdHJpbmdbXSB8IG51bGwpOiB2b2lkIHtcbiAgybXJtWVsZW1lbnRTdGFydChpbmRleCwgbmFtZSwgYXR0cnMsIGxvY2FsUmVmcyk7XG4gIMm1ybVlbGVtZW50RW5kKCk7XG59XG5cbi8qKlxuICogQXNzaWduIHN0YXRpYyBhdHRyaWJ1dGUgdmFsdWVzIHRvIGEgaG9zdCBlbGVtZW50LlxuICpcbiAqIFRoaXMgaW5zdHJ1Y3Rpb24gd2lsbCBhc3NpZ24gc3RhdGljIGF0dHJpYnV0ZSB2YWx1ZXMgYXMgd2VsbCBhcyBjbGFzcyBhbmQgc3R5bGVcbiAqIHZhbHVlcyB0byBhbiBlbGVtZW50IHdpdGhpbiB0aGUgaG9zdCBiaW5kaW5ncyBmdW5jdGlvbi4gU2luY2UgYXR0cmlidXRlIHZhbHVlc1xuICogY2FuIGNvbnNpc3Qgb2YgZGlmZmVyZW50IHR5cGVzIG9mIHZhbHVlcywgdGhlIGBhdHRyc2AgYXJyYXkgbXVzdCBpbmNsdWRlIHRoZSB2YWx1ZXMgaW5cbiAqIHRoZSBmb2xsb3dpbmcgZm9ybWF0OlxuICpcbiAqIGF0dHJzID0gW1xuICogICAvLyBzdGF0aWMgYXR0cmlidXRlcyAobGlrZSBgdGl0bGVgLCBgbmFtZWAsIGBpZGAuLi4pXG4gKiAgIGF0dHIxLCB2YWx1ZTEsIGF0dHIyLCB2YWx1ZSxcbiAqXG4gKiAgIC8vIGEgc2luZ2xlIG5hbWVzcGFjZSB2YWx1ZSAobGlrZSBgeDppZGApXG4gKiAgIE5BTUVTUEFDRV9NQVJLRVIsIG5hbWVzcGFjZVVyaTEsIG5hbWUxLCB2YWx1ZTEsXG4gKlxuICogICAvLyBhbm90aGVyIHNpbmdsZSBuYW1lc3BhY2UgdmFsdWUgKGxpa2UgYHg6bmFtZWApXG4gKiAgIE5BTUVTUEFDRV9NQVJLRVIsIG5hbWVzcGFjZVVyaTIsIG5hbWUyLCB2YWx1ZTIsXG4gKlxuICogICAvLyBhIHNlcmllcyBvZiBDU1MgY2xhc3NlcyB0aGF0IHdpbGwgYmUgYXBwbGllZCB0byB0aGUgZWxlbWVudCAobm8gc3BhY2VzKVxuICogICBDTEFTU0VTX01BUktFUiwgY2xhc3MxLCBjbGFzczIsIGNsYXNzMyxcbiAqXG4gKiAgIC8vIGEgc2VyaWVzIG9mIENTUyBzdHlsZXMgKHByb3BlcnR5ICsgdmFsdWUpIHRoYXQgd2lsbCBiZSBhcHBsaWVkIHRvIHRoZSBlbGVtZW50XG4gKiAgIFNUWUxFU19NQVJLRVIsIHByb3AxLCB2YWx1ZTEsIHByb3AyLCB2YWx1ZTJcbiAqIF1cbiAqXG4gKiBBbGwgbm9uLWNsYXNzIGFuZCBub24tc3R5bGUgYXR0cmlidXRlcyBtdXN0IGJlIGRlZmluZWQgYXQgdGhlIHN0YXJ0IG9mIHRoZSBsaXN0XG4gKiBmaXJzdCBiZWZvcmUgYWxsIGNsYXNzIGFuZCBzdHlsZSB2YWx1ZXMgYXJlIHNldC4gV2hlbiB0aGVyZSBpcyBhIGNoYW5nZSBpbiB2YWx1ZVxuICogdHlwZSAobGlrZSB3aGVuIGNsYXNzZXMgYW5kIHN0eWxlcyBhcmUgaW50cm9kdWNlZCkgYSBtYXJrZXIgbXVzdCBiZSB1c2VkIHRvIHNlcGFyYXRlXG4gKiB0aGUgZW50cmllcy4gVGhlIG1hcmtlciB2YWx1ZXMgdGhlbXNlbHZlcyBhcmUgc2V0IHZpYSBlbnRyaWVzIGZvdW5kIGluIHRoZVxuICogW0F0dHJpYnV0ZU1hcmtlcl0gZW51bS5cbiAqXG4gKiBOT1RFOiBUaGlzIGluc3RydWN0aW9uIGlzIG1lYW50IHRvIHVzZWQgZnJvbSBgaG9zdEJpbmRpbmdzYCBmdW5jdGlvbiBvbmx5LlxuICpcbiAqIEBwYXJhbSBkaXJlY3RpdmUgQSBkaXJlY3RpdmUgaW5zdGFuY2UgdGhlIHN0eWxpbmcgaXMgYXNzb2NpYXRlZCB3aXRoLlxuICogQHBhcmFtIGF0dHJzIEFuIGFycmF5IG9mIHN0YXRpYyB2YWx1ZXMgKGF0dHJpYnV0ZXMsIGNsYXNzZXMgYW5kIHN0eWxlcykgd2l0aCB0aGUgY29ycmVjdCBtYXJrZXJcbiAqIHZhbHVlcy5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWVsZW1lbnRIb3N0QXR0cnMoYXR0cnM6IFRBdHRyaWJ1dGVzKSB7XG4gIGNvbnN0IGhvc3RFbGVtZW50SW5kZXggPSBnZXRTZWxlY3RlZEluZGV4KCk7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgdE5vZGUgPSBnZXRUTm9kZShob3N0RWxlbWVudEluZGV4LCBsVmlldyk7XG5cbiAgLy8gbm9uLWVsZW1lbnQgbm9kZXMgKGUuZy4gYDxuZy1jb250YWluZXI+YCkgYXJlIG5vdCByZW5kZXJlZCBhcyBhY3R1YWxcbiAgLy8gZWxlbWVudCBub2RlcyBhbmQgYWRkaW5nIHN0eWxlcy9jbGFzc2VzIG9uIHRvIHRoZW0gd2lsbCBjYXVzZSBydW50aW1lXG4gIC8vIGVycm9ycy4uLlxuICBpZiAodE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkVsZW1lbnQpIHtcbiAgICBjb25zdCBuYXRpdmUgPSBnZXROYXRpdmVCeVROb2RlKHROb2RlLCBsVmlldykgYXMgUkVsZW1lbnQ7XG4gICAgY29uc3QgbGFzdEF0dHJJbmRleCA9IHNldFVwQXR0cmlidXRlcyhuYXRpdmUsIGF0dHJzKTtcbiAgICBjb25zdCBzdHlsaW5nQXR0cnNTdGFydEluZGV4ID0gYXR0cnNTdHlsaW5nSW5kZXhPZihhdHRycywgbGFzdEF0dHJJbmRleCk7XG4gICAgaWYgKHN0eWxpbmdBdHRyc1N0YXJ0SW5kZXggPj0gMCkge1xuICAgICAgY29uc3QgZGlyZWN0aXZlU3R5bGluZ0luZGV4ID0gZ2V0QWN0aXZlRGlyZWN0aXZlU3R5bGluZ0luZGV4KCk7XG4gICAgICBpZiAodE5vZGUuc3R5bGluZ1RlbXBsYXRlKSB7XG4gICAgICAgIHBhdGNoQ29udGV4dFdpdGhTdGF0aWNBdHRycyhcbiAgICAgICAgICAgIHROb2RlLnN0eWxpbmdUZW1wbGF0ZSwgYXR0cnMsIHN0eWxpbmdBdHRyc1N0YXJ0SW5kZXgsIGRpcmVjdGl2ZVN0eWxpbmdJbmRleCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0Tm9kZS5zdHlsaW5nVGVtcGxhdGUgPVxuICAgICAgICAgICAgaW5pdGlhbGl6ZVN0YXRpY0NvbnRleHQoYXR0cnMsIHN0eWxpbmdBdHRyc1N0YXJ0SW5kZXgsIGRpcmVjdGl2ZVN0eWxpbmdJbmRleCk7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG4iXX0=