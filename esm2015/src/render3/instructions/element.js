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
import { assertDataInRange, assertEqual } from '../../util/assert';
import { assertHasParent } from '../assert';
import { attachPatchData } from '../context_discovery';
import { registerPostOrderHooks } from '../hooks';
import { isProceduralRenderer } from '../interfaces/renderer';
import { BINDING_INDEX, QUERIES, RENDERER, TVIEW } from '../interfaces/view';
import { assertNodeType } from '../node_assert';
import { appendChild } from '../node_manipulation';
import { applyOnCreateInstructions } from '../node_util';
import { decreaseElementDepthCount, getElementDepthCount, getIsParent, getLView, getPreviousOrParentTNode, getSelectedIndex, increaseElementDepthCount, setIsParent, setPreviousOrParentTNode } from '../state';
import { getInitialClassNameValue, getInitialStyleStringValue, initializeStaticContext, patchContextWithStaticAttrs, renderInitialClasses, renderInitialStyles } from '../styling/class_and_style_bindings';
import { getStylingContext, hasClassInput, hasStyleInput } from '../styling/util';
import { NO_CHANGE } from '../tokens';
import { attrsStylingIndexOf, setUpAttributes } from '../util/attrs_utils';
import { renderStringify } from '../util/misc_utils';
import { getNativeByIndex, getNativeByTNode, getTNode } from '../util/view_utils';
import { createDirectivesAndLocals, createNodeAtIndex, elementCreate, executeContentQueries, initializeTNodeInputs, setInputsForProperty, setNodeStylingTemplate } from './shared';
import { getActiveDirectiveStylingIndex } from './styling';
/**
 * Create DOM element. The instruction must later be followed by `elementEnd()` call.
 *
 * @param {?} index Index of the element in the LView array
 * @param {?} name Name of the DOM Node
 * @param {?=} attrs Statically bound set of attributes, classes, and styles to be written into the DOM
 *              element on creation. Use [AttributeMarker] to denote the meaning of this array.
 * @param {?=} localRefs A set of local reference bindings on the element.
 *
 * Attributes and localRefs are passed as an array of strings where elements with an even index
 * hold an attribute name and elements with an odd index hold an attribute value, ex.:
 * ['id', 'warning5', 'class', 'alert']
 * @return {?}
 */
export function elementStart(index, name, attrs, localRefs) {
    /** @type {?} */
    const lView = getLView();
    /** @type {?} */
    const tView = lView[TVIEW];
    ngDevMode && assertEqual(lView[BINDING_INDEX], tView.bindingStartIndex, 'elements should be created before any bindings ');
    ngDevMode && ngDevMode.rendererCreateElement++;
    /** @type {?} */
    const native = elementCreate(name);
    /** @type {?} */
    const renderer = lView[RENDERER];
    ngDevMode && assertDataInRange(lView, index - 1);
    /** @type {?} */
    const tNode = createNodeAtIndex(index, 3 /* Element */, (/** @type {?} */ (native)), name, attrs || null);
    /** @type {?} */
    let initialStylesIndex = 0;
    /** @type {?} */
    let initialClassesIndex = 0;
    if (attrs) {
        /** @type {?} */
        const lastAttrIndex = setUpAttributes(native, attrs);
        // it's important to only prepare styling-related datastructures once for a given
        // tNode and not each time an element is created. Also, the styling code is designed
        // to be patched and constructed at various points, but only up until the styling
        // template is first allocated (which happens when the very first style/class binding
        // value is evaluated). When the template is allocated (when it turns into a context)
        // then the styling template is locked and cannot be further extended (it can only be
        // instantiated into a context per element)
        setNodeStylingTemplate(tView, tNode, attrs, lastAttrIndex);
        if (tNode.stylingTemplate) {
            // the initial style/class values are rendered immediately after having been
            // initialized into the context so the element styling is ready when directives
            // are initialized (since they may read style/class values in their constructor)
            initialStylesIndex = renderInitialStyles(native, tNode.stylingTemplate, renderer);
            initialClassesIndex = renderInitialClasses(native, tNode.stylingTemplate, renderer);
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
    /** @type {?} */
    const currentQueries = lView[QUERIES];
    if (currentQueries) {
        currentQueries.addNode(tNode);
        lView[QUERIES] = currentQueries.clone();
    }
    executeContentQueries(tView, tNode, lView);
}
/**
 * Mark the end of the element.
 * @return {?}
 */
export function elementEnd() {
    /** @type {?} */
    let previousOrParentTNode = getPreviousOrParentTNode();
    if (getIsParent()) {
        setIsParent(false);
    }
    else {
        ngDevMode && assertHasParent(getPreviousOrParentTNode());
        previousOrParentTNode = (/** @type {?} */ (previousOrParentTNode.parent));
        setPreviousOrParentTNode(previousOrParentTNode);
    }
    // this is required for all host-level styling-related instructions to run
    // in the correct order
    previousOrParentTNode.onElementCreationFns && applyOnCreateInstructions(previousOrParentTNode);
    ngDevMode && assertNodeType(previousOrParentTNode, 3 /* Element */);
    /** @type {?} */
    const lView = getLView();
    /** @type {?} */
    const currentQueries = lView[QUERIES];
    if (currentQueries) {
        lView[QUERIES] = currentQueries.parent;
    }
    registerPostOrderHooks(getLView()[TVIEW], previousOrParentTNode);
    decreaseElementDepthCount();
    // this is fired at the end of elementEnd because ALL of the stylingBindings code
    // (for directives and the template) have now executed which means the styling
    // context can be instantiated properly.
    if (hasClassInput(previousOrParentTNode)) {
        /** @type {?} */
        const stylingContext = getStylingContext(previousOrParentTNode.index, lView);
        setInputsForProperty(lView, (/** @type {?} */ ((/** @type {?} */ (previousOrParentTNode.inputs))['class'])), getInitialClassNameValue(stylingContext));
    }
    if (hasStyleInput(previousOrParentTNode)) {
        /** @type {?} */
        const stylingContext = getStylingContext(previousOrParentTNode.index, lView);
        setInputsForProperty(lView, (/** @type {?} */ ((/** @type {?} */ (previousOrParentTNode.inputs))['style'])), getInitialStyleStringValue(stylingContext));
    }
}
/**
 * Creates an empty element using {\@link elementStart} and {\@link elementEnd}
 *
 * @param {?} index Index of the element in the data array
 * @param {?} name Name of the DOM Node
 * @param {?=} attrs Statically bound set of attributes, classes, and styles to be written into the DOM
 *              element on creation. Use [AttributeMarker] to denote the meaning of this array.
 * @param {?=} localRefs A set of local reference bindings on the element.
 * @return {?}
 */
export function element(index, name, attrs, localRefs) {
    elementStart(index, name, attrs, localRefs);
    elementEnd();
}
/**
 * Updates the value of removes an attribute on an Element.
 *
 * @param {?} index
 * @param {?} name name The name of the attribute.
 * @param {?} value value The attribute is removed when value is `null` or `undefined`.
 *                  Otherwise the attribute value is set to the stringified value.
 * @param {?=} sanitizer An optional function used to sanitize the value.
 * @param {?=} namespace Optional namespace to use when setting the attribute.
 * @return {?}
 */
export function elementAttribute(index, name, value, sanitizer, namespace) {
    if (value !== NO_CHANGE) {
        ngDevMode && validateAgainstEventAttributes(name);
        /** @type {?} */
        const lView = getLView();
        /** @type {?} */
        const renderer = lView[RENDERER];
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
 * \@publicApi
 * @param {?} attrs An array of static values (attributes, classes and styles) with the correct marker
 * values.
 *
 * @return {?}
 */
export function elementHostAttrs(attrs) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWxlbWVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaW5zdHJ1Y3Rpb25zL2VsZW1lbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFPQSxPQUFPLEVBQUMsOEJBQThCLEVBQUMsTUFBTSxpQ0FBaUMsQ0FBQztBQUMvRSxPQUFPLEVBQUMsaUJBQWlCLEVBQUUsV0FBVyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDakUsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLFdBQVcsQ0FBQztBQUMxQyxPQUFPLEVBQUMsZUFBZSxFQUFDLE1BQU0sc0JBQXNCLENBQUM7QUFDckQsT0FBTyxFQUFDLHNCQUFzQixFQUFDLE1BQU0sVUFBVSxDQUFDO0FBRWhELE9BQU8sRUFBVyxvQkFBb0IsRUFBQyxNQUFNLHdCQUF3QixDQUFDO0FBRXRFLE9BQU8sRUFBQyxhQUFhLEVBQUUsT0FBTyxFQUFFLFFBQVEsRUFBRSxLQUFLLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUMzRSxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFDOUMsT0FBTyxFQUFDLFdBQVcsRUFBQyxNQUFNLHNCQUFzQixDQUFDO0FBQ2pELE9BQU8sRUFBQyx5QkFBeUIsRUFBQyxNQUFNLGNBQWMsQ0FBQztBQUN2RCxPQUFPLEVBQUMseUJBQXlCLEVBQXdCLG9CQUFvQixFQUFFLFdBQVcsRUFBRSxRQUFRLEVBQWdCLHdCQUF3QixFQUFFLGdCQUFnQixFQUFFLHlCQUF5QixFQUFFLFdBQVcsRUFBRSx3QkFBd0IsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUNsUCxPQUFPLEVBQUMsd0JBQXdCLEVBQUUsMEJBQTBCLEVBQUUsdUJBQXVCLEVBQUUsMkJBQTJCLEVBQUUsb0JBQW9CLEVBQUUsbUJBQW1CLEVBQUMsTUFBTSxxQ0FBcUMsQ0FBQztBQUMxTSxPQUFPLEVBQUMs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QUFxQixDQUFDLENBQUM7YUFDbkY7U0FDRjtLQUNGO0FBQ0gsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCB7dmFsaWRhdGVBZ2FpbnN0RXZlbnRBdHRyaWJ1dGVzfSBmcm9tICcuLi8uLi9zYW5pdGl6YXRpb24vc2FuaXRpemF0aW9uJztcbmltcG9ydCB7YXNzZXJ0RGF0YUluUmFuZ2UsIGFzc2VydEVxdWFsfSBmcm9tICcuLi8uLi91dGlsL2Fzc2VydCc7XG5pbXBvcnQge2Fzc2VydEhhc1BhcmVudH0gZnJvbSAnLi4vYXNzZXJ0JztcbmltcG9ydCB7YXR0YWNoUGF0Y2hEYXRhfSBmcm9tICcuLi9jb250ZXh0X2Rpc2NvdmVyeSc7XG5pbXBvcnQge3JlZ2lzdGVyUG9zdE9yZGVySG9va3N9IGZyb20gJy4uL2hvb2tzJztcbmltcG9ydCB7VEF0dHJpYnV0ZXMsIFROb2RlRmxhZ3MsIFROb2RlVHlwZX0gZnJvbSAnLi4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7UkVsZW1lbnQsIGlzUHJvY2VkdXJhbFJlbmRlcmVyfSBmcm9tICcuLi9pbnRlcmZhY2VzL3JlbmRlcmVyJztcbmltcG9ydCB7U2FuaXRpemVyRm59IGZyb20gJy4uL2ludGVyZmFjZXMvc2FuaXRpemF0aW9uJztcbmltcG9ydCB7QklORElOR19JTkRFWCwgUVVFUklFUywgUkVOREVSRVIsIFRWSUVXfSBmcm9tICcuLi9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHthc3NlcnROb2RlVHlwZX0gZnJvbSAnLi4vbm9kZV9hc3NlcnQnO1xuaW1wb3J0IHthcHBlbmRDaGlsZH0gZnJvbSAnLi4vbm9kZV9tYW5pcHVsYXRpb24nO1xuaW1wb3J0IHthcHBseU9uQ3JlYXRlSW5zdHJ1Y3Rpb25zfSBmcm9tICcuLi9ub2RlX3V0aWwnO1xuaW1wb3J0IHtkZWNyZWFzZUVsZW1lbnREZXB0aENvdW50LCBnZXRBY3RpdmVEaXJlY3RpdmVJZCwgZ2V0RWxlbWVudERlcHRoQ291bnQsIGdldElzUGFyZW50LCBnZXRMVmlldywgZ2V0TmFtZXNwYWNlLCBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUsIGdldFNlbGVjdGVkSW5kZXgsIGluY3JlYXNlRWxlbWVudERlcHRoQ291bnQsIHNldElzUGFyZW50LCBzZXRQcmV2aW91c09yUGFyZW50VE5vZGV9IGZyb20gJy4uL3N0YXRlJztcbmltcG9ydCB7Z2V0SW5pdGlhbENsYXNzTmFtZVZhbHVlLCBnZXRJbml0aWFsU3R5bGVTdHJpbmdWYWx1ZSwgaW5pdGlhbGl6ZVN0YXRpY0NvbnRleHQsIHBhdGNoQ29udGV4dFdpdGhTdGF0aWNBdHRycywgcmVuZGVySW5pdGlhbENsYXNzZXMsIHJlbmRlckluaXRpYWxTdHlsZXN9IGZyb20gJy4uL3N0eWxpbmcvY2xhc3NfYW5kX3N0eWxlX2JpbmRpbmdzJztcbmltcG9ydCB7Z2V0U3R5bGluZ0NvbnRleHQsIGhhc0NsYXNzSW5wdXQsIGhhc1N0eWxlSW5wdXR9IGZyb20gJy4uL3N0eWxpbmcvdXRpbCc7XG5pbXBvcnQge05PX0NIQU5HRX0gZnJvbSAnLi4vdG9rZW5zJztcbmltcG9ydCB7YXR0cnNTdHlsaW5nSW5kZXhPZiwgc2V0VXBBdHRyaWJ1dGVzfSBmcm9tICcuLi91dGlsL2F0dHJzX3V0aWxzJztcbmltcG9ydCB7cmVuZGVyU3RyaW5naWZ5fSBmcm9tICcuLi91dGlsL21pc2NfdXRpbHMnO1xuaW1wb3J0IHtnZXROYXRpdmVCeUluZGV4LCBnZXROYXRpdmVCeVROb2RlLCBnZXRUTm9kZX0gZnJvbSAnLi4vdXRpbC92aWV3X3V0aWxzJztcblxuaW1wb3J0IHtjcmVhdGVEaXJlY3RpdmVzQW5kTG9jYWxzLCBjcmVhdGVOb2RlQXRJbmRleCwgZWxlbWVudENyZWF0ZSwgZXhlY3V0ZUNvbnRlbnRRdWVyaWVzLCBpbml0aWFsaXplVE5vZGVJbnB1dHMsIHNldElucHV0c0ZvclByb3BlcnR5LCBzZXROb2RlU3R5bGluZ1RlbXBsYXRlfSBmcm9tICcuL3NoYXJlZCc7XG5pbXBvcnQge2dldEFjdGl2ZURpcmVjdGl2ZVN0eWxpbmdJbmRleH0gZnJvbSAnLi9zdHlsaW5nJztcblxuXG4vKipcbiAqIENyZWF0ZSBET00gZWxlbWVudC4gVGhlIGluc3RydWN0aW9uIG11c3QgbGF0ZXIgYmUgZm9sbG93ZWQgYnkgYGVsZW1lbnRFbmQoKWAgY2FsbC5cbiAqXG4gKiBAcGFyYW0gaW5kZXggSW5kZXggb2YgdGhlIGVsZW1lbnQgaW4gdGhlIExWaWV3IGFycmF5XG4gKiBAcGFyYW0gbmFtZSBOYW1lIG9mIHRoZSBET00gTm9kZVxuICogQHBhcmFtIGF0dHJzIFN0YXRpY2FsbHkgYm91bmQgc2V0IG9mIGF0dHJpYnV0ZXMsIGNsYXNzZXMsIGFuZCBzdHlsZXMgdG8gYmUgd3JpdHRlbiBpbnRvIHRoZSBET01cbiAqICAgICAgICAgICAgICBlbGVtZW50IG9uIGNyZWF0aW9uLiBVc2UgW0F0dHJpYnV0ZU1hcmtlcl0gdG8gZGVub3RlIHRoZSBtZWFuaW5nIG9mIHRoaXMgYXJyYXkuXG4gKiBAcGFyYW0gbG9jYWxSZWZzIEEgc2V0IG9mIGxvY2FsIHJlZmVyZW5jZSBiaW5kaW5ncyBvbiB0aGUgZWxlbWVudC5cbiAqXG4gKiBBdHRyaWJ1dGVzIGFuZCBsb2NhbFJlZnMgYXJlIHBhc3NlZCBhcyBhbiBhcnJheSBvZiBzdHJpbmdzIHdoZXJlIGVsZW1lbnRzIHdpdGggYW4gZXZlbiBpbmRleFxuICogaG9sZCBhbiBhdHRyaWJ1dGUgbmFtZSBhbmQgZWxlbWVudHMgd2l0aCBhbiBvZGQgaW5kZXggaG9sZCBhbiBhdHRyaWJ1dGUgdmFsdWUsIGV4LjpcbiAqIFsnaWQnLCAnd2FybmluZzUnLCAnY2xhc3MnLCAnYWxlcnQnXVxuICovXG5leHBvcnQgZnVuY3Rpb24gZWxlbWVudFN0YXJ0KFxuICAgIGluZGV4OiBudW1iZXIsIG5hbWU6IHN0cmluZywgYXR0cnM/OiBUQXR0cmlidXRlcyB8IG51bGwsIGxvY2FsUmVmcz86IHN0cmluZ1tdIHwgbnVsbCk6IHZvaWQge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IHRWaWV3ID0gbFZpZXdbVFZJRVddO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RXF1YWwoXG4gICAgICAgICAgICAgICAgICAgbFZpZXdbQklORElOR19JTkRFWF0sIHRWaWV3LmJpbmRpbmdTdGFydEluZGV4LFxuICAgICAgICAgICAgICAgICAgICdlbGVtZW50cyBzaG91bGQgYmUgY3JlYXRlZCBiZWZvcmUgYW55IGJpbmRpbmdzICcpO1xuXG4gIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJDcmVhdGVFbGVtZW50Kys7XG5cbiAgY29uc3QgbmF0aXZlID0gZWxlbWVudENyZWF0ZShuYW1lKTtcbiAgY29uc3QgcmVuZGVyZXIgPSBsVmlld1tSRU5ERVJFUl07XG5cbiAgbmdEZXZNb2RlICYmIGFzc2VydERhdGFJblJhbmdlKGxWaWV3LCBpbmRleCAtIDEpO1xuXG4gIGNvbnN0IHROb2RlID0gY3JlYXRlTm9kZUF0SW5kZXgoaW5kZXgsIFROb2RlVHlwZS5FbGVtZW50LCBuYXRpdmUgISwgbmFtZSwgYXR0cnMgfHwgbnVsbCk7XG4gIGxldCBpbml0aWFsU3R5bGVzSW5kZXggPSAwO1xuICBsZXQgaW5pdGlhbENsYXNzZXNJbmRleCA9IDA7XG5cbiAgaWYgKGF0dHJzKSB7XG4gICAgY29uc3QgbGFzdEF0dHJJbmRleCA9IHNldFVwQXR0cmlidXRlcyhuYXRpdmUsIGF0dHJzKTtcblxuICAgIC8vIGl0J3MgaW1wb3J0YW50IHRvIG9ubHkgcHJlcGFyZSBzdHlsaW5nLXJlbGF0ZWQgZGF0YXN0cnVjdHVyZXMgb25jZSBmb3IgYSBnaXZlblxuICAgIC8vIHROb2RlIGFuZCBub3QgZWFjaCB0aW1lIGFuIGVsZW1lbnQgaXMgY3JlYXRlZC4gQWxzbywgdGhlIHN0eWxpbmcgY29kZSBpcyBkZXNpZ25lZFxuICAgIC8vIHRvIGJlIHBhdGNoZWQgYW5kIGNvbnN0cnVjdGVkIGF0IHZhcmlvdXMgcG9pbnRzLCBidXQgb25seSB1cCB1bnRpbCB0aGUgc3R5bGluZ1xuICAgIC8vIHRlbXBsYXRlIGlzIGZpcnN0IGFsbG9jYXRlZCAod2hpY2ggaGFwcGVucyB3aGVuIHRoZSB2ZXJ5IGZpcnN0IHN0eWxlL2NsYXNzIGJpbmRpbmdcbiAgICAvLyB2YWx1ZSBpcyBldmFsdWF0ZWQpLiBXaGVuIHRoZSB0ZW1wbGF0ZSBpcyBhbGxvY2F0ZWQgKHdoZW4gaXQgdHVybnMgaW50byBhIGNvbnRleHQpXG4gICAgLy8gdGhlbiB0aGUgc3R5bGluZyB0ZW1wbGF0ZSBpcyBsb2NrZWQgYW5kIGNhbm5vdCBiZSBmdXJ0aGVyIGV4dGVuZGVkIChpdCBjYW4gb25seSBiZVxuICAgIC8vIGluc3RhbnRpYXRlZCBpbnRvIGEgY29udGV4dCBwZXIgZWxlbWVudClcbiAgICBzZXROb2RlU3R5bGluZ1RlbXBsYXRlKHRWaWV3LCB0Tm9kZSwgYXR0cnMsIGxhc3RBdHRySW5kZXgpO1xuXG4gICAgaWYgKHROb2RlLnN0eWxpbmdUZW1wbGF0ZSkge1xuICAgICAgLy8gdGhlIGluaXRpYWwgc3R5bGUvY2xhc3MgdmFsdWVzIGFyZSByZW5kZXJlZCBpbW1lZGlhdGVseSBhZnRlciBoYXZpbmcgYmVlblxuICAgICAgLy8gaW5pdGlhbGl6ZWQgaW50byB0aGUgY29udGV4dCBzbyB0aGUgZWxlbWVudCBzdHlsaW5nIGlzIHJlYWR5IHdoZW4gZGlyZWN0aXZlc1xuICAgICAgLy8gYXJlIGluaXRpYWxpemVkIChzaW5jZSB0aGV5IG1heSByZWFkIHN0eWxlL2NsYXNzIHZhbHVlcyBpbiB0aGVpciBjb25zdHJ1Y3RvcilcbiAgICAgIGluaXRpYWxTdHlsZXNJbmRleCA9IHJlbmRlckluaXRpYWxTdHlsZXMobmF0aXZlLCB0Tm9kZS5zdHlsaW5nVGVtcGxhdGUsIHJlbmRlcmVyKTtcbiAgICAgIGluaXRpYWxDbGFzc2VzSW5kZXggPSByZW5kZXJJbml0aWFsQ2xhc3NlcyhuYXRpdmUsIHROb2RlLnN0eWxpbmdUZW1wbGF0ZSwgcmVuZGVyZXIpO1xuICAgIH1cbiAgfVxuXG4gIGFwcGVuZENoaWxkKG5hdGl2ZSwgdE5vZGUsIGxWaWV3KTtcbiAgY3JlYXRlRGlyZWN0aXZlc0FuZExvY2Fscyh0VmlldywgbFZpZXcsIGxvY2FsUmVmcyk7XG5cbiAgLy8gYW55IGltbWVkaWF0ZSBjaGlsZHJlbiBvZiBhIGNvbXBvbmVudCBvciB0ZW1wbGF0ZSBjb250YWluZXIgbXVzdCBiZSBwcmUtZW1wdGl2ZWx5XG4gIC8vIG1vbmtleS1wYXRjaGVkIHdpdGggdGhlIGNvbXBvbmVudCB2aWV3IGRhdGEgc28gdGhhdCB0aGUgZWxlbWVudCBjYW4gYmUgaW5zcGVjdGVkXG4gIC8vIGxhdGVyIG9uIHVzaW5nIGFueSBlbGVtZW50IGRpc2NvdmVyeSB1dGlsaXR5IG1ldGhvZHMgKHNlZSBgZWxlbWVudF9kaXNjb3ZlcnkudHNgKVxuICBpZiAoZ2V0RWxlbWVudERlcHRoQ291bnQoKSA9PT0gMCkge1xuICAgIGF0dGFjaFBhdGNoRGF0YShuYXRpdmUsIGxWaWV3KTtcbiAgfVxuICBpbmNyZWFzZUVsZW1lbnREZXB0aENvdW50KCk7XG5cbiAgLy8gaWYgYSBkaXJlY3RpdmUgY29udGFpbnMgYSBob3N0IGJpbmRpbmcgZm9yIFwiY2xhc3NcIiB0aGVuIGFsbCBjbGFzcy1iYXNlZCBkYXRhIHdpbGxcbiAgLy8gZmxvdyB0aHJvdWdoIHRoYXQgKGV4Y2VwdCBmb3IgYFtjbGFzcy5wcm9wXWAgYmluZGluZ3MpLiBUaGlzIGFsc28gaW5jbHVkZXMgaW5pdGlhbFxuICAvLyBzdGF0aWMgY2xhc3MgdmFsdWVzIGFzIHdlbGwuIChOb3RlIHRoYXQgdGhpcyB3aWxsIGJlIGZpeGVkIG9uY2UgbWFwLWJhc2VkIGBbc3R5bGVdYFxuICAvLyBhbmQgYFtjbGFzc11gIGJpbmRpbmdzIHdvcmsgZm9yIG11bHRpcGxlIGRpcmVjdGl2ZXMuKVxuICBpZiAodFZpZXcuZmlyc3RUZW1wbGF0ZVBhc3MpIHtcbiAgICBjb25zdCBpbnB1dERhdGEgPSBpbml0aWFsaXplVE5vZGVJbnB1dHModE5vZGUpO1xuICAgIGlmIChpbnB1dERhdGEgJiYgaW5wdXREYXRhLmhhc093blByb3BlcnR5KCdjbGFzcycpKSB7XG4gICAgICB0Tm9kZS5mbGFncyB8PSBUTm9kZUZsYWdzLmhhc0NsYXNzSW5wdXQ7XG4gICAgfVxuICAgIGlmIChpbnB1dERhdGEgJiYgaW5wdXREYXRhLmhhc093blByb3BlcnR5KCdzdHlsZScpKSB7XG4gICAgICB0Tm9kZS5mbGFncyB8PSBUTm9kZUZsYWdzLmhhc1N0eWxlSW5wdXQ7XG4gICAgfVxuICB9XG5cbiAgLy8gd2UgcmVuZGVyIHRoZSBzdHlsaW5nIGFnYWluIGJlbG93IGluIGNhc2UgYW55IGRpcmVjdGl2ZXMgaGF2ZSBzZXQgYW55IGBzdHlsZWAgYW5kL29yXG4gIC8vIGBjbGFzc2AgaG9zdCBhdHRyaWJ1dGUgdmFsdWVzLi4uXG4gIGlmICh0Tm9kZS5zdHlsaW5nVGVtcGxhdGUpIHtcbiAgICByZW5kZXJJbml0aWFsQ2xhc3NlcyhuYXRpdmUsIHROb2RlLnN0eWxpbmdUZW1wbGF0ZSwgcmVuZGVyZXIsIGluaXRpYWxDbGFzc2VzSW5kZXgpO1xuICAgIHJlbmRlckluaXRpYWxTdHlsZXMobmF0aXZlLCB0Tm9kZS5zdHlsaW5nVGVtcGxhdGUsIHJlbmRlcmVyLCBpbml0aWFsU3R5bGVzSW5kZXgpO1xuICB9XG5cbiAgY29uc3QgY3VycmVudFF1ZXJpZXMgPSBsVmlld1tRVUVSSUVTXTtcbiAgaWYgKGN1cnJlbnRRdWVyaWVzKSB7XG4gICAgY3VycmVudFF1ZXJpZXMuYWRkTm9kZSh0Tm9kZSk7XG4gICAgbFZpZXdbUVVFUklFU10gPSBjdXJyZW50UXVlcmllcy5jbG9uZSgpO1xuICB9XG4gIGV4ZWN1dGVDb250ZW50UXVlcmllcyh0VmlldywgdE5vZGUsIGxWaWV3KTtcbn1cblxuLyoqIE1hcmsgdGhlIGVuZCBvZiB0aGUgZWxlbWVudC4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbGVtZW50RW5kKCk6IHZvaWQge1xuICBsZXQgcHJldmlvdXNPclBhcmVudFROb2RlID0gZ2V0UHJldmlvdXNPclBhcmVudFROb2RlKCk7XG4gIGlmIChnZXRJc1BhcmVudCgpKSB7XG4gICAgc2V0SXNQYXJlbnQoZmFsc2UpO1xuICB9IGVsc2Uge1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnRIYXNQYXJlbnQoZ2V0UHJldmlvdXNPclBhcmVudFROb2RlKCkpO1xuICAgIHByZXZpb3VzT3JQYXJlbnRUTm9kZSA9IHByZXZpb3VzT3JQYXJlbnRUTm9kZS5wYXJlbnQgITtcbiAgICBzZXRQcmV2aW91c09yUGFyZW50VE5vZGUocHJldmlvdXNPclBhcmVudFROb2RlKTtcbiAgfVxuXG4gIC8vIHRoaXMgaXMgcmVxdWlyZWQgZm9yIGFsbCBob3N0LWxldmVsIHN0eWxpbmctcmVsYXRlZCBpbnN0cnVjdGlvbnMgdG8gcnVuXG4gIC8vIGluIHRoZSBjb3JyZWN0IG9yZGVyXG4gIHByZXZpb3VzT3JQYXJlbnRUTm9kZS5vbkVsZW1lbnRDcmVhdGlvbkZucyAmJiBhcHBseU9uQ3JlYXRlSW5zdHJ1Y3Rpb25zKHByZXZpb3VzT3JQYXJlbnRUTm9kZSk7XG5cbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVUeXBlKHByZXZpb3VzT3JQYXJlbnRUTm9kZSwgVE5vZGVUeXBlLkVsZW1lbnQpO1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IGN1cnJlbnRRdWVyaWVzID0gbFZpZXdbUVVFUklFU107XG4gIGlmIChjdXJyZW50UXVlcmllcykge1xuICAgIGxWaWV3W1FVRVJJRVNdID0gY3VycmVudFF1ZXJpZXMucGFyZW50O1xuICB9XG5cbiAgcmVnaXN0ZXJQb3N0T3JkZXJIb29rcyhnZXRMVmlldygpW1RWSUVXXSwgcHJldmlvdXNPclBhcmVudFROb2RlKTtcbiAgZGVjcmVhc2VFbGVtZW50RGVwdGhDb3VudCgpO1xuXG4gIC8vIHRoaXMgaXMgZmlyZWQgYXQgdGhlIGVuZCBvZiBlbGVtZW50RW5kIGJlY2F1c2UgQUxMIG9mIHRoZSBzdHlsaW5nQmluZGluZ3MgY29kZVxuICAvLyAoZm9yIGRpcmVjdGl2ZXMgYW5kIHRoZSB0ZW1wbGF0ZSkgaGF2ZSBub3cgZXhlY3V0ZWQgd2hpY2ggbWVhbnMgdGhlIHN0eWxpbmdcbiAgLy8gY29udGV4dCBjYW4gYmUgaW5zdGFudGlhdGVkIHByb3Blcmx5LlxuICBpZiAoaGFzQ2xhc3NJbnB1dChwcmV2aW91c09yUGFyZW50VE5vZGUpKSB7XG4gICAgY29uc3Qgc3R5bGluZ0NvbnRleHQgPSBnZXRTdHlsaW5nQ29udGV4dChwcmV2aW91c09yUGFyZW50VE5vZGUuaW5kZXgsIGxWaWV3KTtcbiAgICBzZXRJbnB1dHNGb3JQcm9wZXJ0eShcbiAgICAgICAgbFZpZXcsIHByZXZpb3VzT3JQYXJlbnRUTm9kZS5pbnB1dHMgIVsnY2xhc3MnXSAhLCBnZXRJbml0aWFsQ2xhc3NOYW1lVmFsdWUoc3R5bGluZ0NvbnRleHQpKTtcbiAgfVxuICBpZiAoaGFzU3R5bGVJbnB1dChwcmV2aW91c09yUGFyZW50VE5vZGUpKSB7XG4gICAgY29uc3Qgc3R5bGluZ0NvbnRleHQgPSBnZXRTdHlsaW5nQ29udGV4dChwcmV2aW91c09yUGFyZW50VE5vZGUuaW5kZXgsIGxWaWV3KTtcbiAgICBzZXRJbnB1dHNGb3JQcm9wZXJ0eShcbiAgICAgICAgbFZpZXcsIHByZXZpb3VzT3JQYXJlbnRUTm9kZS5pbnB1dHMgIVsnc3R5bGUnXSAhLFxuICAgICAgICBnZXRJbml0aWFsU3R5bGVTdHJpbmdWYWx1ZShzdHlsaW5nQ29udGV4dCkpO1xuICB9XG59XG5cblxuLyoqXG4gKiBDcmVhdGVzIGFuIGVtcHR5IGVsZW1lbnQgdXNpbmcge0BsaW5rIGVsZW1lbnRTdGFydH0gYW5kIHtAbGluayBlbGVtZW50RW5kfVxuICpcbiAqIEBwYXJhbSBpbmRleCBJbmRleCBvZiB0aGUgZWxlbWVudCBpbiB0aGUgZGF0YSBhcnJheVxuICogQHBhcmFtIG5hbWUgTmFtZSBvZiB0aGUgRE9NIE5vZGVcbiAqIEBwYXJhbSBhdHRycyBTdGF0aWNhbGx5IGJvdW5kIHNldCBvZiBhdHRyaWJ1dGVzLCBjbGFzc2VzLCBhbmQgc3R5bGVzIHRvIGJlIHdyaXR0ZW4gaW50byB0aGUgRE9NXG4gKiAgICAgICAgICAgICAgZWxlbWVudCBvbiBjcmVhdGlvbi4gVXNlIFtBdHRyaWJ1dGVNYXJrZXJdIHRvIGRlbm90ZSB0aGUgbWVhbmluZyBvZiB0aGlzIGFycmF5LlxuICogQHBhcmFtIGxvY2FsUmVmcyBBIHNldCBvZiBsb2NhbCByZWZlcmVuY2UgYmluZGluZ3Mgb24gdGhlIGVsZW1lbnQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbGVtZW50KFxuICAgIGluZGV4OiBudW1iZXIsIG5hbWU6IHN0cmluZywgYXR0cnM/OiBUQXR0cmlidXRlcyB8IG51bGwsIGxvY2FsUmVmcz86IHN0cmluZ1tdIHwgbnVsbCk6IHZvaWQge1xuICBlbGVtZW50U3RhcnQoaW5kZXgsIG5hbWUsIGF0dHJzLCBsb2NhbFJlZnMpO1xuICBlbGVtZW50RW5kKCk7XG59XG5cblxuLyoqXG4gKiBVcGRhdGVzIHRoZSB2YWx1ZSBvZiByZW1vdmVzIGFuIGF0dHJpYnV0ZSBvbiBhbiBFbGVtZW50LlxuICpcbiAqIEBwYXJhbSBudW1iZXIgaW5kZXggVGhlIGluZGV4IG9mIHRoZSBlbGVtZW50IGluIHRoZSBkYXRhIGFycmF5XG4gKiBAcGFyYW0gbmFtZSBuYW1lIFRoZSBuYW1lIG9mIHRoZSBhdHRyaWJ1dGUuXG4gKiBAcGFyYW0gdmFsdWUgdmFsdWUgVGhlIGF0dHJpYnV0ZSBpcyByZW1vdmVkIHdoZW4gdmFsdWUgaXMgYG51bGxgIG9yIGB1bmRlZmluZWRgLlxuICogICAgICAgICAgICAgICAgICBPdGhlcndpc2UgdGhlIGF0dHJpYnV0ZSB2YWx1ZSBpcyBzZXQgdG8gdGhlIHN0cmluZ2lmaWVkIHZhbHVlLlxuICogQHBhcmFtIHNhbml0aXplciBBbiBvcHRpb25hbCBmdW5jdGlvbiB1c2VkIHRvIHNhbml0aXplIHRoZSB2YWx1ZS5cbiAqIEBwYXJhbSBuYW1lc3BhY2UgT3B0aW9uYWwgbmFtZXNwYWNlIHRvIHVzZSB3aGVuIHNldHRpbmcgdGhlIGF0dHJpYnV0ZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVsZW1lbnRBdHRyaWJ1dGUoXG4gICAgaW5kZXg6IG51bWJlciwgbmFtZTogc3RyaW5nLCB2YWx1ZTogYW55LCBzYW5pdGl6ZXI/OiBTYW5pdGl6ZXJGbiB8IG51bGwsXG4gICAgbmFtZXNwYWNlPzogc3RyaW5nKTogdm9pZCB7XG4gIGlmICh2YWx1ZSAhPT0gTk9fQ0hBTkdFKSB7XG4gICAgbmdEZXZNb2RlICYmIHZhbGlkYXRlQWdhaW5zdEV2ZW50QXR0cmlidXRlcyhuYW1lKTtcbiAgICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gICAgY29uc3QgcmVuZGVyZXIgPSBsVmlld1tSRU5ERVJFUl07XG4gICAgY29uc3QgZWxlbWVudCA9IGdldE5hdGl2ZUJ5SW5kZXgoaW5kZXgsIGxWaWV3KSBhcyBSRWxlbWVudDtcbiAgICBpZiAodmFsdWUgPT0gbnVsbCkge1xuICAgICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlclJlbW92ZUF0dHJpYnV0ZSsrO1xuICAgICAgaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpID8gcmVuZGVyZXIucmVtb3ZlQXR0cmlidXRlKGVsZW1lbnQsIG5hbWUsIG5hbWVzcGFjZSkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxlbWVudC5yZW1vdmVBdHRyaWJ1dGUobmFtZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJTZXRBdHRyaWJ1dGUrKztcbiAgICAgIGNvbnN0IHROb2RlID0gZ2V0VE5vZGUoaW5kZXgsIGxWaWV3KTtcbiAgICAgIGNvbnN0IHN0clZhbHVlID1cbiAgICAgICAgICBzYW5pdGl6ZXIgPT0gbnVsbCA/IHJlbmRlclN0cmluZ2lmeSh2YWx1ZSkgOiBzYW5pdGl6ZXIodmFsdWUsIHROb2RlLnRhZ05hbWUgfHwgJycsIG5hbWUpO1xuXG5cbiAgICAgIGlmIChpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikpIHtcbiAgICAgICAgcmVuZGVyZXIuc2V0QXR0cmlidXRlKGVsZW1lbnQsIG5hbWUsIHN0clZhbHVlLCBuYW1lc3BhY2UpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbmFtZXNwYWNlID8gZWxlbWVudC5zZXRBdHRyaWJ1dGVOUyhuYW1lc3BhY2UsIG5hbWUsIHN0clZhbHVlKSA6XG4gICAgICAgICAgICAgICAgICAgIGVsZW1lbnQuc2V0QXR0cmlidXRlKG5hbWUsIHN0clZhbHVlKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBBc3NpZ24gc3RhdGljIGF0dHJpYnV0ZSB2YWx1ZXMgdG8gYSBob3N0IGVsZW1lbnQuXG4gKlxuICogVGhpcyBpbnN0cnVjdGlvbiB3aWxsIGFzc2lnbiBzdGF0aWMgYXR0cmlidXRlIHZhbHVlcyBhcyB3ZWxsIGFzIGNsYXNzIGFuZCBzdHlsZVxuICogdmFsdWVzIHRvIGFuIGVsZW1lbnQgd2l0aGluIHRoZSBob3N0IGJpbmRpbmdzIGZ1bmN0aW9uLiBTaW5jZSBhdHRyaWJ1dGUgdmFsdWVzXG4gKiBjYW4gY29uc2lzdCBvZiBkaWZmZXJlbnQgdHlwZXMgb2YgdmFsdWVzLCB0aGUgYGF0dHJzYCBhcnJheSBtdXN0IGluY2x1ZGUgdGhlIHZhbHVlcyBpblxuICogdGhlIGZvbGxvd2luZyBmb3JtYXQ6XG4gKlxuICogYXR0cnMgPSBbXG4gKiAgIC8vIHN0YXRpYyBhdHRyaWJ1dGVzIChsaWtlIGB0aXRsZWAsIGBuYW1lYCwgYGlkYC4uLilcbiAqICAgYXR0cjEsIHZhbHVlMSwgYXR0cjIsIHZhbHVlLFxuICpcbiAqICAgLy8gYSBzaW5nbGUgbmFtZXNwYWNlIHZhbHVlIChsaWtlIGB4OmlkYClcbiAqICAgTkFNRVNQQUNFX01BUktFUiwgbmFtZXNwYWNlVXJpMSwgbmFtZTEsIHZhbHVlMSxcbiAqXG4gKiAgIC8vIGFub3RoZXIgc2luZ2xlIG5hbWVzcGFjZSB2YWx1ZSAobGlrZSBgeDpuYW1lYClcbiAqICAgTkFNRVNQQUNFX01BUktFUiwgbmFtZXNwYWNlVXJpMiwgbmFtZTIsIHZhbHVlMixcbiAqXG4gKiAgIC8vIGEgc2VyaWVzIG9mIENTUyBjbGFzc2VzIHRoYXQgd2lsbCBiZSBhcHBsaWVkIHRvIHRoZSBlbGVtZW50IChubyBzcGFjZXMpXG4gKiAgIENMQVNTRVNfTUFSS0VSLCBjbGFzczEsIGNsYXNzMiwgY2xhc3MzLFxuICpcbiAqICAgLy8gYSBzZXJpZXMgb2YgQ1NTIHN0eWxlcyAocHJvcGVydHkgKyB2YWx1ZSkgdGhhdCB3aWxsIGJlIGFwcGxpZWQgdG8gdGhlIGVsZW1lbnRcbiAqICAgU1RZTEVTX01BUktFUiwgcHJvcDEsIHZhbHVlMSwgcHJvcDIsIHZhbHVlMlxuICogXVxuICpcbiAqIEFsbCBub24tY2xhc3MgYW5kIG5vbi1zdHlsZSBhdHRyaWJ1dGVzIG11c3QgYmUgZGVmaW5lZCBhdCB0aGUgc3RhcnQgb2YgdGhlIGxpc3RcbiAqIGZpcnN0IGJlZm9yZSBhbGwgY2xhc3MgYW5kIHN0eWxlIHZhbHVlcyBhcmUgc2V0LiBXaGVuIHRoZXJlIGlzIGEgY2hhbmdlIGluIHZhbHVlXG4gKiB0eXBlIChsaWtlIHdoZW4gY2xhc3NlcyBhbmQgc3R5bGVzIGFyZSBpbnRyb2R1Y2VkKSBhIG1hcmtlciBtdXN0IGJlIHVzZWQgdG8gc2VwYXJhdGVcbiAqIHRoZSBlbnRyaWVzLiBUaGUgbWFya2VyIHZhbHVlcyB0aGVtc2VsdmVzIGFyZSBzZXQgdmlhIGVudHJpZXMgZm91bmQgaW4gdGhlXG4gKiBbQXR0cmlidXRlTWFya2VyXSBlbnVtLlxuICpcbiAqIE5PVEU6IFRoaXMgaW5zdHJ1Y3Rpb24gaXMgbWVhbnQgdG8gdXNlZCBmcm9tIGBob3N0QmluZGluZ3NgIGZ1bmN0aW9uIG9ubHkuXG4gKlxuICogQHBhcmFtIGRpcmVjdGl2ZSBBIGRpcmVjdGl2ZSBpbnN0YW5jZSB0aGUgc3R5bGluZyBpcyBhc3NvY2lhdGVkIHdpdGguXG4gKiBAcGFyYW0gYXR0cnMgQW4gYXJyYXkgb2Ygc3RhdGljIHZhbHVlcyAoYXR0cmlidXRlcywgY2xhc3NlcyBhbmQgc3R5bGVzKSB3aXRoIHRoZSBjb3JyZWN0IG1hcmtlclxuICogdmFsdWVzLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVsZW1lbnRIb3N0QXR0cnMoYXR0cnM6IFRBdHRyaWJ1dGVzKSB7XG4gIGNvbnN0IGhvc3RFbGVtZW50SW5kZXggPSBnZXRTZWxlY3RlZEluZGV4KCk7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgdE5vZGUgPSBnZXRUTm9kZShob3N0RWxlbWVudEluZGV4LCBsVmlldyk7XG5cbiAgLy8gbm9uLWVsZW1lbnQgbm9kZXMgKGUuZy4gYDxuZy1jb250YWluZXI+YCkgYXJlIG5vdCByZW5kZXJlZCBhcyBhY3R1YWxcbiAgLy8gZWxlbWVudCBub2RlcyBhbmQgYWRkaW5nIHN0eWxlcy9jbGFzc2VzIG9uIHRvIHRoZW0gd2lsbCBjYXVzZSBydW50aW1lXG4gIC8vIGVycm9ycy4uLlxuICBpZiAodE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkVsZW1lbnQpIHtcbiAgICBjb25zdCBuYXRpdmUgPSBnZXROYXRpdmVCeVROb2RlKHROb2RlLCBsVmlldykgYXMgUkVsZW1lbnQ7XG4gICAgY29uc3QgbGFzdEF0dHJJbmRleCA9IHNldFVwQXR0cmlidXRlcyhuYXRpdmUsIGF0dHJzKTtcbiAgICBjb25zdCBzdHlsaW5nQXR0cnNTdGFydEluZGV4ID0gYXR0cnNTdHlsaW5nSW5kZXhPZihhdHRycywgbGFzdEF0dHJJbmRleCk7XG4gICAgaWYgKHN0eWxpbmdBdHRyc1N0YXJ0SW5kZXggPj0gMCkge1xuICAgICAgY29uc3QgZGlyZWN0aXZlU3R5bGluZ0luZGV4ID0gZ2V0QWN0aXZlRGlyZWN0aXZlU3R5bGluZ0luZGV4KCk7XG4gICAgICBpZiAodE5vZGUuc3R5bGluZ1RlbXBsYXRlKSB7XG4gICAgICAgIHBhdGNoQ29udGV4dFdpdGhTdGF0aWNBdHRycyhcbiAgICAgICAgICAgIHROb2RlLnN0eWxpbmdUZW1wbGF0ZSwgYXR0cnMsIHN0eWxpbmdBdHRyc1N0YXJ0SW5kZXgsIGRpcmVjdGl2ZVN0eWxpbmdJbmRleCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0Tm9kZS5zdHlsaW5nVGVtcGxhdGUgPVxuICAgICAgICAgICAgaW5pdGlhbGl6ZVN0YXRpY0NvbnRleHQoYXR0cnMsIHN0eWxpbmdBdHRyc1N0YXJ0SW5kZXgsIGRpcmVjdGl2ZVN0eWxpbmdJbmRleCk7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG4iXX0=