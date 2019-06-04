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
import { validateAgainstEventAttributes } from '../../sanitization/sanitization';
import { assertDataInRange, assertDefined, assertEqual } from '../../util/assert';
import { assertHasParent } from '../assert';
import { attachPatchData } from '../context_discovery';
import { registerPostOrderHooks } from '../hooks';
import { isProceduralRenderer } from '../interfaces/renderer';
import { BINDING_INDEX, HEADER_OFFSET, QUERIES, RENDERER, TVIEW, T_HOST } from '../interfaces/view';
import { assertNodeType } from '../node_assert';
import { appendChild } from '../node_manipulation';
import { applyOnCreateInstructions } from '../node_util';
import { decreaseElementDepthCount, getElementDepthCount, getIsParent, getLView, getPreviousOrParentTNode, getSelectedIndex, increaseElementDepthCount, setIsNotParent, setPreviousOrParentTNode } from '../state';
import { getInitialClassNameValue, getInitialStyleStringValue, initializeStaticContext, patchContextWithStaticAttrs, renderInitialClasses, renderInitialStyles } from '../styling/class_and_style_bindings';
import { getStylingContextFromLView, hasClassInput, hasStyleInput } from '../styling/util';
import { registerInitialStylingIntoContext } from '../styling_next/instructions';
import { runtimeIsNewStylingInUse } from '../styling_next/state';
import { NO_CHANGE } from '../tokens';
import { attrsStylingIndexOf, setUpAttributes } from '../util/attrs_utils';
import { renderStringify } from '../util/misc_utils';
import { getNativeByIndex, getNativeByTNode, getTNode } from '../util/view_utils';
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
    createDirectivesAndLocals(tView, lView, localRefs);
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
    registerPostOrderHooks(getLView()[TVIEW], previousOrParentTNode);
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
 * Updates the value or removes an attribute on an Element.
 *
 * \@codeGenApi
 * @param {?} index The index of the element in the data array
 * @param {?} name name The name of the attribute.
 * @param {?} value value The attribute is removed when value is `null` or `undefined`.
 *                  Otherwise the attribute value is set to the stringified value.
 * @param {?=} sanitizer An optional function used to sanitize the value.
 * @param {?=} namespace Optional namespace to use when setting the attribute.
 *
 * @return {?}
 */
export function ɵɵelementAttribute(index, name, value, sanitizer, namespace) {
    if (value !== NO_CHANGE) {
        /** @type {?} */
        const lView = getLView();
        /** @type {?} */
        const renderer = lView[RENDERER];
        elementAttributeInternal(index, name, value, lView, renderer, sanitizer, namespace);
    }
}
/**
 * @param {?} index
 * @param {?} name
 * @param {?} value
 * @param {?} lView
 * @param {?} renderer
 * @param {?=} sanitizer
 * @param {?=} namespace
 * @return {?}
 */
export function elementAttributeInternal(index, name, value, lView, renderer, sanitizer, namespace) {
    ngDevMode && validateAgainstEventAttributes(name);
    /** @type {?} */
    const element = (/** @type {?} */ (getNativeByIndex(index, lView)));
    if (value == null) {
        ngDevMode && ngDevMode.rendererRemoveAttribute++;
        isProceduralRenderer(renderer) ? renderer.removeAttribute(element, name, namespace) :
            element.removeAttribute(name);
    }
    else {
        ngDevMode && ngDevMode.rendererSetAttribute++;
        /** @type {?} */
        const tNode = getTNode(index, lView);
        /** @type {?} */
        const strValue = sanitizer == null ? renderStringify(value) : sanitizer(value, tNode.tagName || '', name);
        if (isProceduralRenderer(renderer)) {
            renderer.setAttribute(element, name, strValue, namespace);
        }
        else {
            namespace ? element.setAttributeNS(namespace, name, strValue) :
                element.setAttribute(name, strValue);
        }
    }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWxlbWVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaW5zdHJ1Y3Rpb25zL2VsZW1lbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFPQSxPQUFPLEVBQUMsOEJBQThCLEVBQUMsTUFBTSxpQ0FBaUMsQ0FBQztBQUMvRSxPQUFPLEVBQUMsaUJBQWlCLEVBQUUsYUFBYSxFQUFFLFdBQVcsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQ2hGLE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSxXQUFXLENBQUM7QUFDMUMsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLHNCQUFzQixDQUFDO0FBQ3JELE9BQU8sRUFBQyxzQkFBc0IsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUVoRCxPQUFPLEVBQXNCLG9CQUFvQixFQUFDLE1BQU0sd0JBQXdCLENBQUM7QUFHakYsT0FBTyxFQUFDLGFBQWEsRUFBRSxhQUFhLEVBQVMsT0FBTyxFQUFFLFFBQVEsRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFDLE1BQU0sb0JBQW9CLENBQUM7QUFDekcsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBQzlDLE9BQU8sRUFBQyxXQUFXLEVBQUMsTUFBTSxzQkFBc0IsQ0FBQztBQUNqRCxPQUFPLEVBQUMseUJBQXlCLEVBQUMsTUFBTSxjQUFjLENBQUM7QUFDdkQsT0FBTyxFQUFDLHlCQUF5QixFQUFFLG9CQUFvQixFQUFFLFdBQVcsRUFBRSxRQUFRLEVBQUUsd0JBQXdCLEVBQUUsZ0JBQWdCLEVBQUUseUJBQXlCLEVBQUUsY0FBYyxFQUFFLHdCQUF3QixFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQ2pOLE9BQU8sRUFBQyx3QkFBd0IsRUFBRSwwQkFBMEIsRUFBRSx1QkFBdUIsRUFBRSwyQkFBMkIsRUFBRSxvQkFBb0IsRUFBRSxtQkFBbUIsRUFBQyxNQUFN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Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUF5Q0QsTUFBTSxVQUFVLGtCQUFrQixDQUFDLEtBQWtCOztVQUM3QyxnQkFBZ0IsR0FBRyxnQkFBZ0IsRUFBRTs7VUFDckMsS0FBSyxHQUFHLFFBQVEsRUFBRTs7VUFDbEIsS0FBSyxHQUFHLFFBQVEsQ0FBQyxnQkFBZ0IsRUFBRSxLQUFLLENBQUM7SUFFL0MsdUVBQXVFO0lBQ3ZFLHdFQUF3RTtJQUN4RSxZQUFZO0lBQ1osSUFBSSxLQUFLLENBQUMsSUFBSSxvQkFBc0IsRUFBRTs7Y0FDOUIsTUFBTSxHQUFHLG1CQUFBLGdCQUFnQixDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsRUFBWTs7Y0FDbkQsYUFBYSxHQUFHLGVBQWUsQ0FBQyxNQUFNLEVBQUUsS0FBSyxDQUFDOztjQUM5QyxzQkFBc0IsR0FBRyxtQkFBbUIsQ0FBQyxLQUFLLEVBQUUsYUFBYSxDQUFDO1FBQ3hFLElBQUksc0JBQXNCLElBQUksQ0FBQyxFQUFFOztrQkFDekIscUJBQXFCLEdBQUcsOEJBQThCLEVBQUU7WUFDOUQsSUFBSSxLQUFLLENBQUMsZUFBZSxFQUFFO2dCQUN6QiwyQkFBMkIsQ0FDdkIsS0FBSyxDQUFDLGVBQWUsRUFBRSxLQUFLLEVBQUUsc0JBQXNCLEVBQUUscUJBQXFCLENBQUMsQ0FBQzthQUNsRjtpQkFBTTtnQkFDTCxLQUFLLENBQUMsZUFBZTtvQkFDakIsdUJBQXVCLENBQUMsS0FBSyxFQUFFLHNCQUFzQixFQUFFLHFCQUFxQixDQUFDLENBQUM7YUFDbkY7U0FDRjtLQUNGO0FBQ0gsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCB7dmFsaWRhdGVBZ2FpbnN0RXZlbnRBdHRyaWJ1dGVzfSBmcm9tICcuLi8uLi9zYW5pdGl6YXRpb24vc2FuaXRpemF0aW9uJztcbmltcG9ydCB7YXNzZXJ0RGF0YUluUmFuZ2UsIGFzc2VydERlZmluZWQsIGFzc2VydEVxdWFsfSBmcm9tICcuLi8uLi91dGlsL2Fzc2VydCc7XG5pbXBvcnQge2Fzc2VydEhhc1BhcmVudH0gZnJvbSAnLi4vYXNzZXJ0JztcbmltcG9ydCB7YXR0YWNoUGF0Y2hEYXRhfSBmcm9tICcuLi9jb250ZXh0X2Rpc2NvdmVyeSc7XG5pbXBvcnQge3JlZ2lzdGVyUG9zdE9yZGVySG9va3N9IGZyb20gJy4uL2hvb2tzJztcbmltcG9ydCB7VEF0dHJpYnV0ZXMsIFROb2RlRmxhZ3MsIFROb2RlVHlwZX0gZnJvbSAnLi4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7UkVsZW1lbnQsIFJlbmRlcmVyMywgaXNQcm9jZWR1cmFsUmVuZGVyZXJ9IGZyb20gJy4uL2ludGVyZmFjZXMvcmVuZGVyZXInO1xuaW1wb3J0IHtTYW5pdGl6ZXJGbn0gZnJvbSAnLi4vaW50ZXJmYWNlcy9zYW5pdGl6YXRpb24nO1xuaW1wb3J0IHtTdHlsaW5nQ29udGV4dH0gZnJvbSAnLi4vaW50ZXJmYWNlcy9zdHlsaW5nJztcbmltcG9ydCB7QklORElOR19JTkRFWCwgSEVBREVSX09GRlNFVCwgTFZpZXcsIFFVRVJJRVMsIFJFTkRFUkVSLCBUVklFVywgVF9IT1NUfSBmcm9tICcuLi9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHthc3NlcnROb2RlVHlwZX0gZnJvbSAnLi4vbm9kZV9hc3NlcnQnO1xuaW1wb3J0IHthcHBlbmRDaGlsZH0gZnJvbSAnLi4vbm9kZV9tYW5pcHVsYXRpb24nO1xuaW1wb3J0IHthcHBseU9uQ3JlYXRlSW5zdHJ1Y3Rpb25zfSBmcm9tICcuLi9ub2RlX3V0aWwnO1xuaW1wb3J0IHtkZWNyZWFzZUVsZW1lbnREZXB0aENvdW50LCBnZXRFbGVtZW50RGVwdGhDb3VudCwgZ2V0SXNQYXJlbnQsIGdldExWaWV3LCBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUsIGdldFNlbGVjdGVkSW5kZXgsIGluY3JlYXNlRWxlbWVudERlcHRoQ291bnQsIHNldElzTm90UGFyZW50LCBzZXRQcmV2aW91c09yUGFyZW50VE5vZGV9IGZyb20gJy4uL3N0YXRlJztcbmltcG9ydCB7Z2V0SW5pdGlhbENsYXNzTmFtZVZhbHVlLCBnZXRJbml0aWFsU3R5bGVTdHJpbmdWYWx1ZSwgaW5pdGlhbGl6ZVN0YXRpY0NvbnRleHQsIHBhdGNoQ29udGV4dFdpdGhTdGF0aWNBdHRycywgcmVuZGVySW5pdGlhbENsYXNzZXMsIHJlbmRlckluaXRpYWxTdHlsZXN9IGZyb20gJy4uL3N0eWxpbmcvY2xhc3NfYW5kX3N0eWxlX2JpbmRpbmdzJztcbmltcG9ydCB7Z2V0U3R5bGluZ0NvbnRleHRGcm9tTFZpZXcsIGhhc0NsYXNzSW5wdXQsIGhhc1N0eWxlSW5wdXR9IGZyb20gJy4uL3N0eWxpbmcvdXRpbCc7XG5pbXBvcnQge3JlZ2lzdGVySW5pdGlhbFN0eWxpbmdJbnRvQ29udGV4dH0gZnJvbSAnLi4vc3R5bGluZ19uZXh0L2luc3RydWN0aW9ucyc7XG5pbXBvcnQge3J1bnRpbWVJc05ld1N0eWxpbmdJblVzZX0gZnJvbSAnLi4vc3R5bGluZ19uZXh0L3N0YXRlJztcbmltcG9ydCB7Tk9fQ0hBTkdFfSBmcm9tICcuLi90b2tlbnMnO1xuaW1wb3J0IHthdHRyc1N0eWxpbmdJbmRleE9mLCBzZXRVcEF0dHJpYnV0ZXN9IGZyb20gJy4uL3V0aWwvYXR0cnNfdXRpbHMnO1xuaW1wb3J0IHtyZW5kZXJTdHJpbmdpZnl9IGZyb20gJy4uL3V0aWwvbWlzY191dGlscyc7XG5pbXBvcnQge2dldE5hdGl2ZUJ5SW5kZXgsIGdldE5hdGl2ZUJ5VE5vZGUsIGdldFROb2RlfSBmcm9tICcuLi91dGlsL3ZpZXdfdXRpbHMnO1xuaW1wb3J0IHtjcmVhdGVEaXJlY3RpdmVzQW5kTG9jYWxzLCBlbGVtZW50Q3JlYXRlLCBleGVjdXRlQ29udGVudFF1ZXJpZXMsIGdldE9yQ3JlYXRlVE5vZGUsIGluaXRpYWxpemVUTm9kZUlucHV0cywgc2V0SW5wdXRzRm9yUHJvcGVydHksIHNldE5vZGVTdHlsaW5nVGVtcGxhdGV9IGZyb20gJy4vc2hhcmVkJztcbmltcG9ydCB7Z2V0QWN0aXZlRGlyZWN0aXZlU3R5bGluZ0luZGV4fSBmcm9tICcuL3N0eWxpbmcnO1xuXG5cbi8qKlxuICogQ3JlYXRlIERPTSBlbGVtZW50LiBUaGUgaW5zdHJ1Y3Rpb24gbXVzdCBsYXRlciBiZSBmb2xsb3dlZCBieSBgZWxlbWVudEVuZCgpYCBjYWxsLlxuICpcbiAqIEBwYXJhbSBpbmRleCBJbmRleCBvZiB0aGUgZWxlbWVudCBpbiB0aGUgTFZpZXcgYXJyYXlcbiAqIEBwYXJhbSBuYW1lIE5hbWUgb2YgdGhlIERPTSBOb2RlXG4gKiBAcGFyYW0gYXR0cnMgU3RhdGljYWxseSBib3VuZCBzZXQgb2YgYXR0cmlidXRlcywgY2xhc3NlcywgYW5kIHN0eWxlcyB0byBiZSB3cml0dGVuIGludG8gdGhlIERPTVxuICogICAgICAgICAgICAgIGVsZW1lbnQgb24gY3JlYXRpb24uIFVzZSBbQXR0cmlidXRlTWFya2VyXSB0byBkZW5vdGUgdGhlIG1lYW5pbmcgb2YgdGhpcyBhcnJheS5cbiAqIEBwYXJhbSBsb2NhbFJlZnMgQSBzZXQgb2YgbG9jYWwgcmVmZXJlbmNlIGJpbmRpbmdzIG9uIHRoZSBlbGVtZW50LlxuICpcbiAqIEF0dHJpYnV0ZXMgYW5kIGxvY2FsUmVmcyBhcmUgcGFzc2VkIGFzIGFuIGFycmF5IG9mIHN0cmluZ3Mgd2hlcmUgZWxlbWVudHMgd2l0aCBhbiBldmVuIGluZGV4XG4gKiBob2xkIGFuIGF0dHJpYnV0ZSBuYW1lIGFuZCBlbGVtZW50cyB3aXRoIGFuIG9kZCBpbmRleCBob2xkIGFuIGF0dHJpYnV0ZSB2YWx1ZSwgZXguOlxuICogWydpZCcsICd3YXJuaW5nNScsICdjbGFzcycsICdhbGVydCddXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVlbGVtZW50U3RhcnQoXG4gICAgaW5kZXg6IG51bWJlciwgbmFtZTogc3RyaW5nLCBhdHRycz86IFRBdHRyaWJ1dGVzIHwgbnVsbCwgbG9jYWxSZWZzPzogc3RyaW5nW10gfCBudWxsKTogdm9pZCB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgdFZpZXcgPSBsVmlld1tUVklFV107XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRFcXVhbChcbiAgICAgICAgICAgICAgICAgICBsVmlld1tCSU5ESU5HX0lOREVYXSwgdFZpZXcuYmluZGluZ1N0YXJ0SW5kZXgsXG4gICAgICAgICAgICAgICAgICAgJ2VsZW1lbnRzIHNob3VsZCBiZSBjcmVhdGVkIGJlZm9yZSBhbnkgYmluZGluZ3MgJyk7XG5cbiAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlckNyZWF0ZUVsZW1lbnQrKztcbiAgbmdEZXZNb2RlICYmIGFzc2VydERhdGFJblJhbmdlKGxWaWV3LCBpbmRleCArIEhFQURFUl9PRkZTRVQpO1xuICBjb25zdCBuYXRpdmUgPSBsVmlld1tpbmRleCArIEhFQURFUl9PRkZTRVRdID0gZWxlbWVudENyZWF0ZShuYW1lKTtcbiAgY29uc3QgcmVuZGVyZXIgPSBsVmlld1tSRU5ERVJFUl07XG4gIGNvbnN0IHROb2RlID1cbiAgICAgIGdldE9yQ3JlYXRlVE5vZGUodFZpZXcsIGxWaWV3W1RfSE9TVF0sIGluZGV4LCBUTm9kZVR5cGUuRWxlbWVudCwgbmFtZSwgYXR0cnMgfHwgbnVsbCk7XG4gIGxldCBpbml0aWFsU3R5bGVzSW5kZXggPSAwO1xuICBsZXQgaW5pdGlhbENsYXNzZXNJbmRleCA9IDA7XG5cbiAgbGV0IGxhc3RBdHRySW5kZXggPSAtMTtcbiAgaWYgKGF0dHJzKSB7XG4gICAgbGFzdEF0dHJJbmRleCA9IHNldFVwQXR0cmlidXRlcyhuYXRpdmUsIGF0dHJzKTtcblxuICAgIC8vIGl0J3MgaW1wb3J0YW50IHRvIG9ubHkgcHJlcGFyZSBzdHlsaW5nLXJlbGF0ZWQgZGF0YXN0cnVjdHVyZXMgb25jZSBmb3IgYSBnaXZlblxuICAgIC8vIHROb2RlIGFuZCBub3QgZWFjaCB0aW1lIGFuIGVsZW1lbnQgaXMgY3JlYXRlZC4gQWxzbywgdGhlIHN0eWxpbmcgY29kZSBpcyBkZXNpZ25lZFxuICAgIC8vIHRvIGJlIHBhdGNoZWQgYW5kIGNvbnN0cnVjdGVkIGF0IHZhcmlvdXMgcG9pbnRzLCBidXQgb25seSB1cCB1bnRpbCB0aGUgc3R5bGluZ1xuICAgIC8vIHRlbXBsYXRlIGlzIGZpcnN0IGFsbG9jYXRlZCAod2hpY2ggaGFwcGVucyB3aGVuIHRoZSB2ZXJ5IGZpcnN0IHN0eWxlL2NsYXNzIGJpbmRpbmdcbiAgICAvLyB2YWx1ZSBpcyBldmFsdWF0ZWQpLiBXaGVuIHRoZSB0ZW1wbGF0ZSBpcyBhbGxvY2F0ZWQgKHdoZW4gaXQgdHVybnMgaW50byBhIGNvbnRleHQpXG4gICAgLy8gdGhlbiB0aGUgc3R5bGluZyB0ZW1wbGF0ZSBpcyBsb2NrZWQgYW5kIGNhbm5vdCBiZSBmdXJ0aGVyIGV4dGVuZGVkIChpdCBjYW4gb25seSBiZVxuICAgIC8vIGluc3RhbnRpYXRlZCBpbnRvIGEgY29udGV4dCBwZXIgZWxlbWVudClcbiAgICBzZXROb2RlU3R5bGluZ1RlbXBsYXRlKHRWaWV3LCB0Tm9kZSwgYXR0cnMsIGxhc3RBdHRySW5kZXgpO1xuXG4gICAgY29uc3Qgc3R5bGluZ1RlbXBsYXRlID0gdE5vZGUuc3R5bGluZ1RlbXBsYXRlO1xuICAgIGlmIChzdHlsaW5nVGVtcGxhdGUpIHtcbiAgICAgIC8vIHRoZSBpbml0aWFsIHN0eWxlL2NsYXNzIHZhbHVlcyBhcmUgcmVuZGVyZWQgaW1tZWRpYXRlbHkgYWZ0ZXIgaGF2aW5nIGJlZW5cbiAgICAgIC8vIGluaXRpYWxpemVkIGludG8gdGhlIGNvbnRleHQgc28gdGhlIGVsZW1lbnQgc3R5bGluZyBpcyByZWFkeSB3aGVuIGRpcmVjdGl2ZXNcbiAgICAgIC8vIGFyZSBpbml0aWFsaXplZCAoc2luY2UgdGhleSBtYXkgcmVhZCBzdHlsZS9jbGFzcyB2YWx1ZXMgaW4gdGhlaXIgY29uc3RydWN0b3IpXG4gICAgICBpbml0aWFsU3R5bGVzSW5kZXggPSByZW5kZXJJbml0aWFsU3R5bGVzKG5hdGl2ZSwgc3R5bGluZ1RlbXBsYXRlLCByZW5kZXJlcik7XG4gICAgICBpbml0aWFsQ2xhc3Nlc0luZGV4ID0gcmVuZGVySW5pdGlhbENsYXNzZXMobmF0aXZlLCBzdHlsaW5nVGVtcGxhdGUsIHJlbmRlcmVyKTtcbiAgICB9XG4gIH1cblxuICBhcHBlbmRDaGlsZChuYXRpdmUsIHROb2RlLCBsVmlldyk7XG4gIGNyZWF0ZURpcmVjdGl2ZXNBbmRMb2NhbHModFZpZXcsIGxWaWV3LCBsb2NhbFJlZnMpO1xuXG4gIC8vIGFueSBpbW1lZGlhdGUgY2hpbGRyZW4gb2YgYSBjb21wb25lbnQgb3IgdGVtcGxhdGUgY29udGFpbmVyIG11c3QgYmUgcHJlLWVtcHRpdmVseVxuICAvLyBtb25rZXktcGF0Y2hlZCB3aXRoIHRoZSBjb21wb25lbnQgdmlldyBkYXRhIHNvIHRoYXQgdGhlIGVsZW1lbnQgY2FuIGJlIGluc3BlY3RlZFxuICAvLyBsYXRlciBvbiB1c2luZyBhbnkgZWxlbWVudCBkaXNjb3ZlcnkgdXRpbGl0eSBtZXRob2RzIChzZWUgYGVsZW1lbnRfZGlzY292ZXJ5LnRzYClcbiAgaWYgKGdldEVsZW1lbnREZXB0aENvdW50KCkgPT09IDApIHtcbiAgICBhdHRhY2hQYXRjaERhdGEobmF0aXZlLCBsVmlldyk7XG4gIH1cbiAgaW5jcmVhc2VFbGVtZW50RGVwdGhDb3VudCgpO1xuXG4gIC8vIGlmIGEgZGlyZWN0aXZlIGNvbnRhaW5zIGEgaG9zdCBiaW5kaW5nIGZvciBcImNsYXNzXCIgdGhlbiBhbGwgY2xhc3MtYmFzZWQgZGF0YSB3aWxsXG4gIC8vIGZsb3cgdGhyb3VnaCB0aGF0IChleGNlcHQgZm9yIGBbY2xhc3MucHJvcF1gIGJpbmRpbmdzKS4gVGhpcyBhbHNvIGluY2x1ZGVzIGluaXRpYWxcbiAgLy8gc3RhdGljIGNsYXNzIHZhbHVlcyBhcyB3ZWxsLiAoTm90ZSB0aGF0IHRoaXMgd2lsbCBiZSBmaXhlZCBvbmNlIG1hcC1iYXNlZCBgW3N0eWxlXWBcbiAgLy8gYW5kIGBbY2xhc3NdYCBiaW5kaW5ncyB3b3JrIGZvciBtdWx0aXBsZSBkaXJlY3RpdmVzLilcbiAgaWYgKHRWaWV3LmZpcnN0VGVtcGxhdGVQYXNzKSB7XG4gICAgY29uc3QgaW5wdXREYXRhID0gaW5pdGlhbGl6ZVROb2RlSW5wdXRzKHROb2RlKTtcbiAgICBpZiAoaW5wdXREYXRhICYmIGlucHV0RGF0YS5oYXNPd25Qcm9wZXJ0eSgnY2xhc3MnKSkge1xuICAgICAgdE5vZGUuZmxhZ3MgfD0gVE5vZGVGbGFncy5oYXNDbGFzc0lucHV0O1xuICAgIH1cbiAgICBpZiAoaW5wdXREYXRhICYmIGlucHV0RGF0YS5oYXNPd25Qcm9wZXJ0eSgnc3R5bGUnKSkge1xuICAgICAgdE5vZGUuZmxhZ3MgfD0gVE5vZGVGbGFncy5oYXNTdHlsZUlucHV0O1xuICAgIH1cbiAgfVxuXG4gIC8vIHdlIHJlbmRlciB0aGUgc3R5bGluZyBhZ2FpbiBiZWxvdyBpbiBjYXNlIGFueSBkaXJlY3RpdmVzIGhhdmUgc2V0IGFueSBgc3R5bGVgIGFuZC9vclxuICAvLyBgY2xhc3NgIGhvc3QgYXR0cmlidXRlIHZhbHVlcy4uLlxuICBpZiAodE5vZGUuc3R5bGluZ1RlbXBsYXRlKSB7XG4gICAgcmVuZGVySW5pdGlhbENsYXNzZXMobmF0aXZlLCB0Tm9kZS5zdHlsaW5nVGVtcGxhdGUsIHJlbmRlcmVyLCBpbml0aWFsQ2xhc3Nlc0luZGV4KTtcbiAgICByZW5kZXJJbml0aWFsU3R5bGVzKG5hdGl2ZSwgdE5vZGUuc3R5bGluZ1RlbXBsYXRlLCByZW5kZXJlciwgaW5pdGlhbFN0eWxlc0luZGV4KTtcbiAgfVxuXG4gIGlmIChydW50aW1lSXNOZXdTdHlsaW5nSW5Vc2UoKSAmJiBsYXN0QXR0ckluZGV4ID49IDApIHtcbiAgICByZWdpc3RlckluaXRpYWxTdHlsaW5nSW50b0NvbnRleHQodE5vZGUsIGF0dHJzIGFzIFRBdHRyaWJ1dGVzLCBsYXN0QXR0ckluZGV4KTtcbiAgfVxuXG4gIGNvbnN0IGN1cnJlbnRRdWVyaWVzID0gbFZpZXdbUVVFUklFU107XG4gIGlmIChjdXJyZW50UXVlcmllcykge1xuICAgIGN1cnJlbnRRdWVyaWVzLmFkZE5vZGUodE5vZGUpO1xuICAgIGxWaWV3W1FVRVJJRVNdID0gY3VycmVudFF1ZXJpZXMuY2xvbmUodE5vZGUpO1xuICB9XG4gIGV4ZWN1dGVDb250ZW50UXVlcmllcyh0VmlldywgdE5vZGUsIGxWaWV3KTtcbn1cblxuLyoqXG4gKiBNYXJrIHRoZSBlbmQgb2YgdGhlIGVsZW1lbnQuXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVlbGVtZW50RW5kKCk6IHZvaWQge1xuICBsZXQgcHJldmlvdXNPclBhcmVudFROb2RlID0gZ2V0UHJldmlvdXNPclBhcmVudFROb2RlKCk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKHByZXZpb3VzT3JQYXJlbnRUTm9kZSwgJ05vIHBhcmVudCBub2RlIHRvIGNsb3NlLicpO1xuICBpZiAoZ2V0SXNQYXJlbnQoKSkge1xuICAgIHNldElzTm90UGFyZW50KCk7XG4gIH0gZWxzZSB7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydEhhc1BhcmVudChnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKSk7XG4gICAgcHJldmlvdXNPclBhcmVudFROb2RlID0gcHJldmlvdXNPclBhcmVudFROb2RlLnBhcmVudCAhO1xuICAgIHNldFByZXZpb3VzT3JQYXJlbnRUTm9kZShwcmV2aW91c09yUGFyZW50VE5vZGUsIGZhbHNlKTtcbiAgfVxuXG4gIC8vIHRoaXMgaXMgcmVxdWlyZWQgZm9yIGFsbCBob3N0LWxldmVsIHN0eWxpbmctcmVsYXRlZCBpbnN0cnVjdGlvbnMgdG8gcnVuXG4gIC8vIGluIHRoZSBjb3JyZWN0IG9yZGVyXG4gIHByZXZpb3VzT3JQYXJlbnRUTm9kZS5vbkVsZW1lbnRDcmVhdGlvbkZucyAmJiBhcHBseU9uQ3JlYXRlSW5zdHJ1Y3Rpb25zKHByZXZpb3VzT3JQYXJlbnRUTm9kZSk7XG5cbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVUeXBlKHByZXZpb3VzT3JQYXJlbnRUTm9kZSwgVE5vZGVUeXBlLkVsZW1lbnQpO1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IGN1cnJlbnRRdWVyaWVzID0gbFZpZXdbUVVFUklFU107XG4gIC8vIEdvIGJhY2sgdXAgdG8gcGFyZW50IHF1ZXJpZXMgb25seSBpZiBxdWVyaWVzIGhhdmUgYmVlbiBjbG9uZWQgb24gdGhpcyBlbGVtZW50LlxuICBpZiAoY3VycmVudFF1ZXJpZXMgJiYgcHJldmlvdXNPclBhcmVudFROb2RlLmluZGV4ID09PSBjdXJyZW50UXVlcmllcy5ub2RlSW5kZXgpIHtcbiAgICBsVmlld1tRVUVSSUVTXSA9IGN1cnJlbnRRdWVyaWVzLnBhcmVudDtcbiAgfVxuXG4gIHJlZ2lzdGVyUG9zdE9yZGVySG9va3MoZ2V0TFZpZXcoKVtUVklFV10sIHByZXZpb3VzT3JQYXJlbnRUTm9kZSk7XG4gIGRlY3JlYXNlRWxlbWVudERlcHRoQ291bnQoKTtcblxuICAvLyB0aGlzIGlzIGZpcmVkIGF0IHRoZSBlbmQgb2YgZWxlbWVudEVuZCBiZWNhdXNlIEFMTCBvZiB0aGUgc3R5bGluZ0JpbmRpbmdzIGNvZGVcbiAgLy8gKGZvciBkaXJlY3RpdmVzIGFuZCB0aGUgdGVtcGxhdGUpIGhhdmUgbm93IGV4ZWN1dGVkIHdoaWNoIG1lYW5zIHRoZSBzdHlsaW5nXG4gIC8vIGNvbnRleHQgY2FuIGJlIGluc3RhbnRpYXRlZCBwcm9wZXJseS5cbiAgbGV0IHN0eWxpbmdDb250ZXh0OiBTdHlsaW5nQ29udGV4dHxudWxsID0gbnVsbDtcbiAgaWYgKGhhc0NsYXNzSW5wdXQocHJldmlvdXNPclBhcmVudFROb2RlKSkge1xuICAgIHN0eWxpbmdDb250ZXh0ID0gZ2V0U3R5bGluZ0NvbnRleHRGcm9tTFZpZXcocHJldmlvdXNPclBhcmVudFROb2RlLmluZGV4LCBsVmlldyk7XG4gICAgc2V0SW5wdXRzRm9yUHJvcGVydHkoXG4gICAgICAgIGxWaWV3LCBwcmV2aW91c09yUGFyZW50VE5vZGUuaW5wdXRzICFbJ2NsYXNzJ10gISwgZ2V0SW5pdGlhbENsYXNzTmFtZVZhbHVlKHN0eWxpbmdDb250ZXh0KSk7XG4gIH1cbiAgaWYgKGhhc1N0eWxlSW5wdXQocHJldmlvdXNPclBhcmVudFROb2RlKSkge1xuICAgIHN0eWxpbmdDb250ZXh0ID1cbiAgICAgICAgc3R5bGluZ0NvbnRleHQgfHwgZ2V0U3R5bGluZ0NvbnRleHRGcm9tTFZpZXcocHJldmlvdXNPclBhcmVudFROb2RlLmluZGV4LCBsVmlldyk7XG4gICAgc2V0SW5wdXRzRm9yUHJvcGVydHkoXG4gICAgICAgIGxWaWV3LCBwcmV2aW91c09yUGFyZW50VE5vZGUuaW5wdXRzICFbJ3N0eWxlJ10gISxcbiAgICAgICAgZ2V0SW5pdGlhbFN0eWxlU3RyaW5nVmFsdWUoc3R5bGluZ0NvbnRleHQpKTtcbiAgfVxufVxuXG5cbi8qKlxuICogQ3JlYXRlcyBhbiBlbXB0eSBlbGVtZW50IHVzaW5nIHtAbGluayBlbGVtZW50U3RhcnR9IGFuZCB7QGxpbmsgZWxlbWVudEVuZH1cbiAqXG4gKiBAcGFyYW0gaW5kZXggSW5kZXggb2YgdGhlIGVsZW1lbnQgaW4gdGhlIGRhdGEgYXJyYXlcbiAqIEBwYXJhbSBuYW1lIE5hbWUgb2YgdGhlIERPTSBOb2RlXG4gKiBAcGFyYW0gYXR0cnMgU3RhdGljYWxseSBib3VuZCBzZXQgb2YgYXR0cmlidXRlcywgY2xhc3NlcywgYW5kIHN0eWxlcyB0byBiZSB3cml0dGVuIGludG8gdGhlIERPTVxuICogICAgICAgICAgICAgIGVsZW1lbnQgb24gY3JlYXRpb24uIFVzZSBbQXR0cmlidXRlTWFya2VyXSB0byBkZW5vdGUgdGhlIG1lYW5pbmcgb2YgdGhpcyBhcnJheS5cbiAqIEBwYXJhbSBsb2NhbFJlZnMgQSBzZXQgb2YgbG9jYWwgcmVmZXJlbmNlIGJpbmRpbmdzIG9uIHRoZSBlbGVtZW50LlxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1ZWxlbWVudChcbiAgICBpbmRleDogbnVtYmVyLCBuYW1lOiBzdHJpbmcsIGF0dHJzPzogVEF0dHJpYnV0ZXMgfCBudWxsLCBsb2NhbFJlZnM/OiBzdHJpbmdbXSB8IG51bGwpOiB2b2lkIHtcbiAgybXJtWVsZW1lbnRTdGFydChpbmRleCwgbmFtZSwgYXR0cnMsIGxvY2FsUmVmcyk7XG4gIMm1ybVlbGVtZW50RW5kKCk7XG59XG5cblxuLyoqXG4gKiBVcGRhdGVzIHRoZSB2YWx1ZSBvciByZW1vdmVzIGFuIGF0dHJpYnV0ZSBvbiBhbiBFbGVtZW50LlxuICpcbiAqIEBwYXJhbSBpbmRleCBUaGUgaW5kZXggb2YgdGhlIGVsZW1lbnQgaW4gdGhlIGRhdGEgYXJyYXlcbiAqIEBwYXJhbSBuYW1lIG5hbWUgVGhlIG5hbWUgb2YgdGhlIGF0dHJpYnV0ZS5cbiAqIEBwYXJhbSB2YWx1ZSB2YWx1ZSBUaGUgYXR0cmlidXRlIGlzIHJlbW92ZWQgd2hlbiB2YWx1ZSBpcyBgbnVsbGAgb3IgYHVuZGVmaW5lZGAuXG4gKiAgICAgICAgICAgICAgICAgIE90aGVyd2lzZSB0aGUgYXR0cmlidXRlIHZhbHVlIGlzIHNldCB0byB0aGUgc3RyaW5naWZpZWQgdmFsdWUuXG4gKiBAcGFyYW0gc2FuaXRpemVyIEFuIG9wdGlvbmFsIGZ1bmN0aW9uIHVzZWQgdG8gc2FuaXRpemUgdGhlIHZhbHVlLlxuICogQHBhcmFtIG5hbWVzcGFjZSBPcHRpb25hbCBuYW1lc3BhY2UgdG8gdXNlIHdoZW4gc2V0dGluZyB0aGUgYXR0cmlidXRlLlxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1ZWxlbWVudEF0dHJpYnV0ZShcbiAgICBpbmRleDogbnVtYmVyLCBuYW1lOiBzdHJpbmcsIHZhbHVlOiBhbnksIHNhbml0aXplcj86IFNhbml0aXplckZuIHwgbnVsbCxcbiAgICBuYW1lc3BhY2U/OiBzdHJpbmcpOiB2b2lkIHtcbiAgaWYgKHZhbHVlICE9PSBOT19DSEFOR0UpIHtcbiAgICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gICAgY29uc3QgcmVuZGVyZXIgPSBsVmlld1tSRU5ERVJFUl07XG4gICAgZWxlbWVudEF0dHJpYnV0ZUludGVybmFsKGluZGV4LCBuYW1lLCB2YWx1ZSwgbFZpZXcsIHJlbmRlcmVyLCBzYW5pdGl6ZXIsIG5hbWVzcGFjZSk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGVsZW1lbnRBdHRyaWJ1dGVJbnRlcm5hbChcbiAgICBpbmRleDogbnVtYmVyLCBuYW1lOiBzdHJpbmcsIHZhbHVlOiBhbnksIGxWaWV3OiBMVmlldywgcmVuZGVyZXI6IFJlbmRlcmVyMyxcbiAgICBzYW5pdGl6ZXI/OiBTYW5pdGl6ZXJGbiB8IG51bGwsIG5hbWVzcGFjZT86IHN0cmluZykge1xuICBuZ0Rldk1vZGUgJiYgdmFsaWRhdGVBZ2FpbnN0RXZlbnRBdHRyaWJ1dGVzKG5hbWUpO1xuICBjb25zdCBlbGVtZW50ID0gZ2V0TmF0aXZlQnlJbmRleChpbmRleCwgbFZpZXcpIGFzIFJFbGVtZW50O1xuICBpZiAodmFsdWUgPT0gbnVsbCkge1xuICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJSZW1vdmVBdHRyaWJ1dGUrKztcbiAgICBpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikgPyByZW5kZXJlci5yZW1vdmVBdHRyaWJ1dGUoZWxlbWVudCwgbmFtZSwgbmFtZXNwYWNlKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxlbWVudC5yZW1vdmVBdHRyaWJ1dGUobmFtZSk7XG4gIH0gZWxzZSB7XG4gICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlclNldEF0dHJpYnV0ZSsrO1xuICAgIGNvbnN0IHROb2RlID0gZ2V0VE5vZGUoaW5kZXgsIGxWaWV3KTtcbiAgICBjb25zdCBzdHJWYWx1ZSA9XG4gICAgICAgIHNhbml0aXplciA9PSBudWxsID8gcmVuZGVyU3RyaW5naWZ5KHZhbHVlKSA6IHNhbml0aXplcih2YWx1ZSwgdE5vZGUudGFnTmFtZSB8fCAnJywgbmFtZSk7XG5cblxuICAgIGlmIChpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikpIHtcbiAgICAgIHJlbmRlcmVyLnNldEF0dHJpYnV0ZShlbGVtZW50LCBuYW1lLCBzdHJWYWx1ZSwgbmFtZXNwYWNlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbmFtZXNwYWNlID8gZWxlbWVudC5zZXRBdHRyaWJ1dGVOUyhuYW1lc3BhY2UsIG5hbWUsIHN0clZhbHVlKSA6XG4gICAgICAgICAgICAgICAgICBlbGVtZW50LnNldEF0dHJpYnV0ZShuYW1lLCBzdHJWYWx1ZSk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogQXNzaWduIHN0YXRpYyBhdHRyaWJ1dGUgdmFsdWVzIHRvIGEgaG9zdCBlbGVtZW50LlxuICpcbiAqIFRoaXMgaW5zdHJ1Y3Rpb24gd2lsbCBhc3NpZ24gc3RhdGljIGF0dHJpYnV0ZSB2YWx1ZXMgYXMgd2VsbCBhcyBjbGFzcyBhbmQgc3R5bGVcbiAqIHZhbHVlcyB0byBhbiBlbGVtZW50IHdpdGhpbiB0aGUgaG9zdCBiaW5kaW5ncyBmdW5jdGlvbi4gU2luY2UgYXR0cmlidXRlIHZhbHVlc1xuICogY2FuIGNvbnNpc3Qgb2YgZGlmZmVyZW50IHR5cGVzIG9mIHZhbHVlcywgdGhlIGBhdHRyc2AgYXJyYXkgbXVzdCBpbmNsdWRlIHRoZSB2YWx1ZXMgaW5cbiAqIHRoZSBmb2xsb3dpbmcgZm9ybWF0OlxuICpcbiAqIGF0dHJzID0gW1xuICogICAvLyBzdGF0aWMgYXR0cmlidXRlcyAobGlrZSBgdGl0bGVgLCBgbmFtZWAsIGBpZGAuLi4pXG4gKiAgIGF0dHIxLCB2YWx1ZTEsIGF0dHIyLCB2YWx1ZSxcbiAqXG4gKiAgIC8vIGEgc2luZ2xlIG5hbWVzcGFjZSB2YWx1ZSAobGlrZSBgeDppZGApXG4gKiAgIE5BTUVTUEFDRV9NQVJLRVIsIG5hbWVzcGFjZVVyaTEsIG5hbWUxLCB2YWx1ZTEsXG4gKlxuICogICAvLyBhbm90aGVyIHNpbmdsZSBuYW1lc3BhY2UgdmFsdWUgKGxpa2UgYHg6bmFtZWApXG4gKiAgIE5BTUVTUEFDRV9NQVJLRVIsIG5hbWVzcGFjZVVyaTIsIG5hbWUyLCB2YWx1ZTIsXG4gKlxuICogICAvLyBhIHNlcmllcyBvZiBDU1MgY2xhc3NlcyB0aGF0IHdpbGwgYmUgYXBwbGllZCB0byB0aGUgZWxlbWVudCAobm8gc3BhY2VzKVxuICogICBDTEFTU0VTX01BUktFUiwgY2xhc3MxLCBjbGFzczIsIGNsYXNzMyxcbiAqXG4gKiAgIC8vIGEgc2VyaWVzIG9mIENTUyBzdHlsZXMgKHByb3BlcnR5ICsgdmFsdWUpIHRoYXQgd2lsbCBiZSBhcHBsaWVkIHRvIHRoZSBlbGVtZW50XG4gKiAgIFNUWUxFU19NQVJLRVIsIHByb3AxLCB2YWx1ZTEsIHByb3AyLCB2YWx1ZTJcbiAqIF1cbiAqXG4gKiBBbGwgbm9uLWNsYXNzIGFuZCBub24tc3R5bGUgYXR0cmlidXRlcyBtdXN0IGJlIGRlZmluZWQgYXQgdGhlIHN0YXJ0IG9mIHRoZSBsaXN0XG4gKiBmaXJzdCBiZWZvcmUgYWxsIGNsYXNzIGFuZCBzdHlsZSB2YWx1ZXMgYXJlIHNldC4gV2hlbiB0aGVyZSBpcyBhIGNoYW5nZSBpbiB2YWx1ZVxuICogdHlwZSAobGlrZSB3aGVuIGNsYXNzZXMgYW5kIHN0eWxlcyBhcmUgaW50cm9kdWNlZCkgYSBtYXJrZXIgbXVzdCBiZSB1c2VkIHRvIHNlcGFyYXRlXG4gKiB0aGUgZW50cmllcy4gVGhlIG1hcmtlciB2YWx1ZXMgdGhlbXNlbHZlcyBhcmUgc2V0IHZpYSBlbnRyaWVzIGZvdW5kIGluIHRoZVxuICogW0F0dHJpYnV0ZU1hcmtlcl0gZW51bS5cbiAqXG4gKiBOT1RFOiBUaGlzIGluc3RydWN0aW9uIGlzIG1lYW50IHRvIHVzZWQgZnJvbSBgaG9zdEJpbmRpbmdzYCBmdW5jdGlvbiBvbmx5LlxuICpcbiAqIEBwYXJhbSBkaXJlY3RpdmUgQSBkaXJlY3RpdmUgaW5zdGFuY2UgdGhlIHN0eWxpbmcgaXMgYXNzb2NpYXRlZCB3aXRoLlxuICogQHBhcmFtIGF0dHJzIEFuIGFycmF5IG9mIHN0YXRpYyB2YWx1ZXMgKGF0dHJpYnV0ZXMsIGNsYXNzZXMgYW5kIHN0eWxlcykgd2l0aCB0aGUgY29ycmVjdCBtYXJrZXJcbiAqIHZhbHVlcy5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWVsZW1lbnRIb3N0QXR0cnMoYXR0cnM6IFRBdHRyaWJ1dGVzKSB7XG4gIGNvbnN0IGhvc3RFbGVtZW50SW5kZXggPSBnZXRTZWxlY3RlZEluZGV4KCk7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgdE5vZGUgPSBnZXRUTm9kZShob3N0RWxlbWVudEluZGV4LCBsVmlldyk7XG5cbiAgLy8gbm9uLWVsZW1lbnQgbm9kZXMgKGUuZy4gYDxuZy1jb250YWluZXI+YCkgYXJlIG5vdCByZW5kZXJlZCBhcyBhY3R1YWxcbiAgLy8gZWxlbWVudCBub2RlcyBhbmQgYWRkaW5nIHN0eWxlcy9jbGFzc2VzIG9uIHRvIHRoZW0gd2lsbCBjYXVzZSBydW50aW1lXG4gIC8vIGVycm9ycy4uLlxuICBpZiAodE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkVsZW1lbnQpIHtcbiAgICBjb25zdCBuYXRpdmUgPSBnZXROYXRpdmVCeVROb2RlKHROb2RlLCBsVmlldykgYXMgUkVsZW1lbnQ7XG4gICAgY29uc3QgbGFzdEF0dHJJbmRleCA9IHNldFVwQXR0cmlidXRlcyhuYXRpdmUsIGF0dHJzKTtcbiAgICBjb25zdCBzdHlsaW5nQXR0cnNTdGFydEluZGV4ID0gYXR0cnNTdHlsaW5nSW5kZXhPZihhdHRycywgbGFzdEF0dHJJbmRleCk7XG4gICAgaWYgKHN0eWxpbmdBdHRyc1N0YXJ0SW5kZXggPj0gMCkge1xuICAgICAgY29uc3QgZGlyZWN0aXZlU3R5bGluZ0luZGV4ID0gZ2V0QWN0aXZlRGlyZWN0aXZlU3R5bGluZ0luZGV4KCk7XG4gICAgICBpZiAodE5vZGUuc3R5bGluZ1RlbXBsYXRlKSB7XG4gICAgICAgIHBhdGNoQ29udGV4dFdpdGhTdGF0aWNBdHRycyhcbiAgICAgICAgICAgIHROb2RlLnN0eWxpbmdUZW1wbGF0ZSwgYXR0cnMsIHN0eWxpbmdBdHRyc1N0YXJ0SW5kZXgsIGRpcmVjdGl2ZVN0eWxpbmdJbmRleCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0Tm9kZS5zdHlsaW5nVGVtcGxhdGUgPVxuICAgICAgICAgICAgaW5pdGlhbGl6ZVN0YXRpY0NvbnRleHQoYXR0cnMsIHN0eWxpbmdBdHRyc1N0YXJ0SW5kZXgsIGRpcmVjdGl2ZVN0eWxpbmdJbmRleCk7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG4iXX0=