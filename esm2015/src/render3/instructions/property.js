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
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '../../metadata/schema';
import { validateAgainstEventProperties } from '../../sanitization/sanitization';
import { normalizeDebugBindingName, normalizeDebugBindingValue } from '../../util/ng_reflect';
import { assertLView } from '../assert';
import { bindingUpdated } from '../bindings';
import { isProceduralRenderer } from '../interfaces/renderer';
import { BINDING_INDEX, FLAGS, HEADER_OFFSET, RENDERER, TVIEW } from '../interfaces/view';
import { getLView, getSelectedIndex } from '../state';
import { ANIMATION_PROP_PREFIX, isAnimationProp } from '../styling/util';
import { NO_CHANGE } from '../tokens';
import { INTERPOLATION_DELIMITER } from '../util/misc_utils';
import { getComponentViewByIndex, getNativeByIndex, getTNode, isComponent } from '../util/view_utils';
import { initializeTNodeInputs, loadComponentRenderer, setInputsForProperty, storeBindingMetadata } from './shared';
/**
 * Update a property on a selected element.
 *
 * Operates on the element selected by index via the {\@link select} instruction.
 *
 * If the property name also exists as an input property on one of the element's directives,
 * the component property will be set instead of the element property. This check must
 * be conducted at runtime so child components that add new `\@Inputs` don't have to be re-compiled
 *
 * @template T
 * @param {?} propName Name of property. Because it is going to DOM, this is not subject to
 *        renaming as part of minification.
 * @param {?} value New value to write.
 * @param {?=} sanitizer An optional function used to sanitize the value.
 * @param {?=} nativeOnly Whether or not we should only set native properties and skip input check
 * (this is necessary for host property bindings)
 * @return {?} This function returns itself so that it may be chained
 * (e.g. `property('name', ctx.name)('title', ctx.title)`)
 */
export function property(propName, value, sanitizer, nativeOnly) {
    /** @type {?} */
    const index = getSelectedIndex();
    /** @type {?} */
    const bindReconciledValue = bind(value);
    elementPropertyInternal(index, propName, bindReconciledValue, sanitizer, nativeOnly);
    return property;
}
/**
 * Creates a single value binding.
 *
 * @template T
 * @param {?} value Value to diff
 * @return {?}
 */
export function bind(value) {
    /** @type {?} */
    const lView = getLView();
    /** @type {?} */
    const bindingIndex = lView[BINDING_INDEX]++;
    storeBindingMetadata(lView);
    return bindingUpdated(lView, bindingIndex, value) ? value : NO_CHANGE;
}
/**
 * **TODO: Remove this function after `property` is in use**
 * Update a property on an element.
 *
 * If the property name also exists as an input property on one of the element's directives,
 * the component property will be set instead of the element property. This check must
 * be conducted at runtime so child components that add new \@Inputs don't have to be re-compiled.
 *
 * @template T
 * @param {?} index The index of the element to update in the data array
 * @param {?} propName Name of property. Because it is going to DOM, this is not subject to
 *        renaming as part of minification.
 * @param {?} value New value to write.
 * @param {?=} sanitizer An optional function used to sanitize the value.
 * @param {?=} nativeOnly Whether or not we should only set native properties and skip input check
 * (this is necessary for host property bindings)
 * @return {?}
 */
export function elementProperty(index, propName, value, sanitizer, nativeOnly) {
    elementPropertyInternal(index, propName, value, sanitizer, nativeOnly);
}
/**
 * Updates a synthetic host binding (e.g. `[\@foo]`) on a component.
 *
 * This instruction is for compatibility purposes and is designed to ensure that a
 * synthetic host binding (e.g. `\@HostBinding('\@foo')`) properly gets rendered in
 * the component's renderer. Normally all host bindings are evaluated with the parent
 * component's renderer, but, in the case of animation \@triggers, they need to be
 * evaluated with the sub component's renderer (because that's where the animation
 * triggers are defined).
 *
 * Do not use this instruction as a replacement for `elementProperty`. This instruction
 * only exists to ensure compatibility with the ViewEngine's host binding behavior.
 *
 * @template T
 * @param {?} index The index of the element to update in the data array
 * @param {?} propName Name of property. Because it is going to DOM, this is not subject to
 *        renaming as part of minification.
 * @param {?} value New value to write.
 * @param {?=} sanitizer An optional function used to sanitize the value.
 * @param {?=} nativeOnly Whether or not we should only set native properties and skip input check
 * (this is necessary for host property bindings)
 * @return {?}
 */
export function componentHostSyntheticProperty(index, propName, value, sanitizer, nativeOnly) {
    elementPropertyInternal(index, propName, value, sanitizer, nativeOnly, loadComponentRenderer);
}
/**
 * Mapping between attributes names that don't correspond to their element property names.
 * @type {?}
 */
const ATTR_TO_PROP = {
    'class': 'className',
    'for': 'htmlFor',
    'formaction': 'formAction',
    'innerHtml': 'innerHTML',
    'readonly': 'readOnly',
    'tabindex': 'tabIndex',
};
/**
 * @template T
 * @param {?} index
 * @param {?} propName
 * @param {?} value
 * @param {?=} sanitizer
 * @param {?=} nativeOnly
 * @param {?=} loadRendererFn
 * @return {?}
 */
function elementPropertyInternal(index, propName, value, sanitizer, nativeOnly, loadRendererFn) {
    if (value === NO_CHANGE)
        return;
    /** @type {?} */
    const lView = getLView();
    /** @type {?} */
    const element = (/** @type {?} */ (getNativeByIndex(index, lView)));
    /** @type {?} */
    const tNode = getTNode(index, lView);
    /** @type {?} */
    let inputData;
    /** @type {?} */
    let dataValue;
    if (!nativeOnly && (inputData = initializeTNodeInputs(tNode)) &&
        (dataValue = inputData[propName])) {
        setInputsForProperty(lView, dataValue, value);
        if (isComponent(tNode))
            markDirtyIfOnPush(lView, index + HEADER_OFFSET);
        if (ngDevMode) {
            if (tNode.type === 3 /* Element */ || tNode.type === 0 /* Container */) {
                setNgReflectProperties(lView, element, tNode.type, dataValue, value);
            }
        }
    }
    else if (tNode.type === 3 /* Element */) {
        propName = ATTR_TO_PROP[propName] || propName;
        if (ngDevMode) {
            validateAgainstEventProperties(propName);
            validateAgainstUnknownProperties(lView, element, propName, tNode);
            ngDevMode.rendererSetProperty++;
        }
        savePropertyDebugData(tNode, lView, propName, lView[TVIEW].data, nativeOnly);
        /** @type {?} */
        const renderer = loadRendererFn ? loadRendererFn(tNode, lView) : lView[RENDERER];
        // It is assumed that the sanitizer is only added when the compiler determines that the property
        // is risky, so sanitization can be done without further checks.
        value = sanitizer != null ? ((/** @type {?} */ (sanitizer(value, tNode.tagName || '', propName)))) : value;
        if (isProceduralRenderer(renderer)) {
            renderer.setProperty((/** @type {?} */ (element)), propName, value);
        }
        else if (!isAnimationProp(propName)) {
            ((/** @type {?} */ (element))).setProperty ? ((/** @type {?} */ (element))).setProperty(propName, value) :
                ((/** @type {?} */ (element)))[propName] = value;
        }
    }
    else if (tNode.type === 0 /* Container */) {
        // If the node is a container and the property didn't
        // match any of the inputs or schemas we should throw.
        if (ngDevMode && !matchingSchemas(lView, tNode.tagName)) {
            throw createUnknownPropertyError(propName, tNode);
        }
    }
}
/**
 * If node is an OnPush component, marks its LView dirty.
 * @param {?} lView
 * @param {?} viewIndex
 * @return {?}
 */
function markDirtyIfOnPush(lView, viewIndex) {
    ngDevMode && assertLView(lView);
    /** @type {?} */
    const childComponentLView = getComponentViewByIndex(viewIndex, lView);
    if (!(childComponentLView[FLAGS] & 16 /* CheckAlways */)) {
        childComponentLView[FLAGS] |= 64 /* Dirty */;
    }
}
/**
 * @param {?} lView
 * @param {?} element
 * @param {?} type
 * @param {?} inputs
 * @param {?} value
 * @return {?}
 */
function setNgReflectProperties(lView, element, type, inputs, value) {
    for (let i = 0; i < inputs.length; i += 3) {
        /** @type {?} */
        const renderer = lView[RENDERER];
        /** @type {?} */
        const attrName = normalizeDebugBindingName((/** @type {?} */ (inputs[i + 2])));
        /** @type {?} */
        const debugValue = normalizeDebugBindingValue(value);
        if (type === 3 /* Element */) {
            isProceduralRenderer(renderer) ?
                renderer.setAttribute(((/** @type {?} */ (element))), attrName, debugValue) :
                ((/** @type {?} */ (element))).setAttribute(attrName, debugValue);
        }
        else if (value !== undefined) {
            /** @type {?} */
            const value = `bindings=${JSON.stringify({ [attrName]: debugValue }, null, 2)}`;
            if (isProceduralRenderer(renderer)) {
                renderer.setValue(((/** @type {?} */ (element))), value);
            }
            else {
                ((/** @type {?} */ (element))).textContent = value;
            }
        }
    }
}
/**
 * @param {?} hostView
 * @param {?} element
 * @param {?} propName
 * @param {?} tNode
 * @return {?}
 */
function validateAgainstUnknownProperties(hostView, element, propName, tNode) {
    // If the tag matches any of the schemas we shouldn't throw.
    if (matchingSchemas(hostView, tNode.tagName)) {
        return;
    }
    // If prop is not a known property of the HTML element...
    if (!(propName in element) &&
        // and we are in a browser context... (web worker nodes should be skipped)
        typeof Node === 'function' && element instanceof Node &&
        // and isn't a synthetic animation property...
        propName[0] !== ANIMATION_PROP_PREFIX) {
        // ... it is probably a user error and we should throw.
        throw createUnknownPropertyError(propName, tNode);
    }
}
/**
 * @param {?} hostView
 * @param {?} tagName
 * @return {?}
 */
function matchingSchemas(hostView, tagName) {
    /** @type {?} */
    const schemas = hostView[TVIEW].schemas;
    if (schemas !== null) {
        for (let i = 0; i < schemas.length; i++) {
            /** @type {?} */
            const schema = schemas[i];
            if (schema === NO_ERRORS_SCHEMA ||
                schema === CUSTOM_ELEMENTS_SCHEMA && tagName && tagName.indexOf('-') > -1) {
                return true;
            }
        }
    }
    return false;
}
/**
 * Stores debugging data for this property binding on first template pass.
 * This enables features like DebugElement.properties.
 * @param {?} tNode
 * @param {?} lView
 * @param {?} propName
 * @param {?} tData
 * @param {?} nativeOnly
 * @return {?}
 */
function savePropertyDebugData(tNode, lView, propName, tData, nativeOnly) {
    /** @type {?} */
    const lastBindingIndex = lView[BINDING_INDEX] - 1;
    // Bind/interpolation functions save binding metadata in the last binding index,
    // but leave the property name blank. If the interpolation delimiter is at the 0
    // index, we know that this is our first pass and the property name still needs to
    // be set.
    /** @type {?} */
    const bindingMetadata = (/** @type {?} */ (tData[lastBindingIndex]));
    if (bindingMetadata[0] == INTERPOLATION_DELIMITER) {
        tData[lastBindingIndex] = propName + bindingMetadata;
        // We don't want to store indices for host bindings because they are stored in a
        // different part of LView (the expando section).
        if (!nativeOnly) {
            if (tNode.propertyMetadataStartIndex == -1) {
                tNode.propertyMetadataStartIndex = lastBindingIndex;
            }
            tNode.propertyMetadataEndIndex = lastBindingIndex + 1;
        }
    }
}
/**
 * Creates an error that should be thrown when encountering an unknown property on an element.
 * @param {?} propName Name of the invalid property.
 * @param {?} tNode Node on which we encountered the error.
 * @return {?}
 */
function createUnknownPropertyError(propName, tNode) {
    return new Error(`Template error: Can't bind to '${propName}' since it isn't a known property of '${tNode.tagName}'.`);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvcGVydHkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2luc3RydWN0aW9ucy9wcm9wZXJ0eS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQU9BLE9BQU8sRUFBQyxzQkFBc0IsRUFBRSxnQkFBZ0IsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQy9FLE9BQU8sRUFBQyw4QkFBOEIsRUFBQyxNQUFNLGlDQUFpQyxDQUFDO0FBQy9FLE9BQU8sRUFBQyx5QkFBeUIsRUFBRSwwQkFBMEIsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQzVGLE9BQU8sRUFBQyxXQUFXLEVBQUMsTUFBTSxXQUFXLENBQUM7QUFDdEMsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLGFBQWEsQ0FBQztBQUUzQyxPQUFPLEVBQWdDLG9CQUFvQixFQUFDLE1BQU0sd0JBQXdCLENBQUM7QUFFM0YsT0FBTyxFQUFDLGFBQWEsRUFBRSxLQUFLLEVBQUUsYUFBYSxFQUFxQixRQUFRLEVBQVMsS0FBSyxFQUFDLE1BQU0sb0JBQW9CLENBQUM7QUFDbEgsT0FBTyxFQUFDLFFBQVEsRUFBRSxnQkFBZ0IsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUNwRCxPQUFPLEVBQUMscUJBQXFCLEVBQUUsZUFBZSxFQUFDLE1BQU0saUJBQWlCLENBQUM7QUFDdkUsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLFdBQVcsQ0FBQztBQUNwQyxPQUFPLEVBQUMsdUJBQXVCLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUMzRCxPQUFPLEVBQUMsdUJBQXVCLEVBQUUsZ0JBQWdCLEVBQUUsUUFBUSxFQUFFLFdBQVcsRUFBQyxNQUFNLG9CQUFvQixDQUFDO0FBQ3BHLE9BQU8sRUFBbUIscUJBQXFCLEVBQUUscUJBQXFCLEVBQUUsb0JBQW9CLEVBQUUsb0JBQW9CLEVBQUMsTUFBTSxVQUFVLENBQUM7Ozs7Ozs7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SCxDQUFDOzs7Ozs7O0FBT0QsU0FBUywwQkFBMEIsQ0FBQyxRQUFnQixFQUFFLEtBQVk7SUFDaEUsT0FBTyxJQUFJLEtBQUssQ0FDWixrQ0FBa0MsUUFBUSx5Q0FBeUMsS0FBSyxDQUFDLE9BQU8sSUFBSSxDQUFDLENBQUM7QUFDNUcsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCB7Q1VTVE9NX0VMRU1FTlRTX1NDSEVNQSwgTk9fRVJST1JTX1NDSEVNQX0gZnJvbSAnLi4vLi4vbWV0YWRhdGEvc2NoZW1hJztcbmltcG9ydCB7dmFsaWRhdGVBZ2FpbnN0RXZlbnRQcm9wZXJ0aWVzfSBmcm9tICcuLi8uLi9zYW5pdGl6YXRpb24vc2FuaXRpemF0aW9uJztcbmltcG9ydCB7bm9ybWFsaXplRGVidWdCaW5kaW5nTmFtZSwgbm9ybWFsaXplRGVidWdCaW5kaW5nVmFsdWV9IGZyb20gJy4uLy4uL3V0aWwvbmdfcmVmbGVjdCc7XG5pbXBvcnQge2Fzc2VydExWaWV3fSBmcm9tICcuLi9hc3NlcnQnO1xuaW1wb3J0IHtiaW5kaW5nVXBkYXRlZH0gZnJvbSAnLi4vYmluZGluZ3MnO1xuaW1wb3J0IHtQcm9wZXJ0eUFsaWFzVmFsdWUsIFByb3BlcnR5QWxpYXNlcywgVE5vZGUsIFROb2RlVHlwZX0gZnJvbSAnLi4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7UkNvbW1lbnQsIFJFbGVtZW50LCBSZW5kZXJlcjMsIGlzUHJvY2VkdXJhbFJlbmRlcmVyfSBmcm9tICcuLi9pbnRlcmZhY2VzL3JlbmRlcmVyJztcbmltcG9ydCB7U2FuaXRpemVyRm59IGZyb20gJy4uL2ludGVyZmFjZXMvc2FuaXRpemF0aW9uJztcbmltcG9ydCB7QklORElOR19JTkRFWCwgRkxBR1MsIEhFQURFUl9PRkZTRVQsIExWaWV3LCBMVmlld0ZsYWdzLCBSRU5ERVJFUiwgVERhdGEsIFRWSUVXfSBmcm9tICcuLi9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHtnZXRMVmlldywgZ2V0U2VsZWN0ZWRJbmRleH0gZnJvbSAnLi4vc3RhdGUnO1xuaW1wb3J0IHtBTklNQVRJT05fUFJPUF9QUkVGSVgsIGlzQW5pbWF0aW9uUHJvcH0gZnJvbSAnLi4vc3R5bGluZy91dGlsJztcbmltcG9ydCB7Tk9fQ0hBTkdFfSBmcm9tICcuLi90b2tlbnMnO1xuaW1wb3J0IHtJTlRFUlBPTEFUSU9OX0RFTElNSVRFUn0gZnJvbSAnLi4vdXRpbC9taXNjX3V0aWxzJztcbmltcG9ydCB7Z2V0Q29tcG9uZW50Vmlld0J5SW5kZXgsIGdldE5hdGl2ZUJ5SW5kZXgsIGdldFROb2RlLCBpc0NvbXBvbmVudH0gZnJvbSAnLi4vdXRpbC92aWV3X3V0aWxzJztcbmltcG9ydCB7VHNpY2tsZUlzc3VlMTAwOSwgaW5pdGlhbGl6ZVROb2RlSW5wdXRzLCBsb2FkQ29tcG9uZW50UmVuZGVyZXIsIHNldElucHV0c0ZvclByb3BlcnR5LCBzdG9yZUJpbmRpbmdNZXRhZGF0YX0gZnJvbSAnLi9zaGFyZWQnO1xuXG4vKipcbiAqIFVwZGF0ZSBhIHByb3BlcnR5IG9uIGEgc2VsZWN0ZWQgZWxlbWVudC5cbiAqXG4gKiBPcGVyYXRlcyBvbiB0aGUgZWxlbWVudCBzZWxlY3RlZCBieSBpbmRleCB2aWEgdGhlIHtAbGluayBzZWxlY3R9IGluc3RydWN0aW9uLlxuICpcbiAqIElmIHRoZSBwcm9wZXJ0eSBuYW1lIGFsc28gZXhpc3RzIGFzIGFuIGlucHV0IHByb3BlcnR5IG9uIG9uZSBvZiB0aGUgZWxlbWVudCdzIGRpcmVjdGl2ZXMsXG4gKiB0aGUgY29tcG9uZW50IHByb3BlcnR5IHdpbGwgYmUgc2V0IGluc3RlYWQgb2YgdGhlIGVsZW1lbnQgcHJvcGVydHkuIFRoaXMgY2hlY2sgbXVzdFxuICogYmUgY29uZHVjdGVkIGF0IHJ1bnRpbWUgc28gY2hpbGQgY29tcG9uZW50cyB0aGF0IGFkZCBuZXcgYEBJbnB1dHNgIGRvbid0IGhhdmUgdG8gYmUgcmUtY29tcGlsZWRcbiAqXG4gKiBAcGFyYW0gcHJvcE5hbWUgTmFtZSBvZiBwcm9wZXJ0eS4gQmVjYXVzZSBpdCBpcyBnb2luZyB0byBET00sIHRoaXMgaXMgbm90IHN1YmplY3QgdG9cbiAqICAgICAgICByZW5hbWluZyBhcyBwYXJ0IG9mIG1pbmlmaWNhdGlvbi5cbiAqIEBwYXJhbSB2YWx1ZSBOZXcgdmFsdWUgdG8gd3JpdGUuXG4gKiBAcGFyYW0gc2FuaXRpemVyIEFuIG9wdGlvbmFsIGZ1bmN0aW9uIHVzZWQgdG8gc2FuaXRpemUgdGhlIHZhbHVlLlxuICogQHBhcmFtIG5hdGl2ZU9ubHkgV2hldGhlciBvciBub3Qgd2Ugc2hvdWxkIG9ubHkgc2V0IG5hdGl2ZSBwcm9wZXJ0aWVzIGFuZCBza2lwIGlucHV0IGNoZWNrXG4gKiAodGhpcyBpcyBuZWNlc3NhcnkgZm9yIGhvc3QgcHJvcGVydHkgYmluZGluZ3MpXG4gKiBAcmV0dXJucyBUaGlzIGZ1bmN0aW9uIHJldHVybnMgaXRzZWxmIHNvIHRoYXQgaXQgbWF5IGJlIGNoYWluZWRcbiAqIChlLmcuIGBwcm9wZXJ0eSgnbmFtZScsIGN0eC5uYW1lKSgndGl0bGUnLCBjdHgudGl0bGUpYClcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHByb3BlcnR5PFQ+KFxuICAgIHByb3BOYW1lOiBzdHJpbmcsIHZhbHVlOiBULCBzYW5pdGl6ZXI/OiBTYW5pdGl6ZXJGbiB8IG51bGwsXG4gICAgbmF0aXZlT25seT86IGJvb2xlYW4pOiBUc2lja2xlSXNzdWUxMDA5IHtcbiAgY29uc3QgaW5kZXggPSBnZXRTZWxlY3RlZEluZGV4KCk7XG4gIGNvbnN0IGJpbmRSZWNvbmNpbGVkVmFsdWUgPSBiaW5kKHZhbHVlKTtcbiAgZWxlbWVudFByb3BlcnR5SW50ZXJuYWwoaW5kZXgsIHByb3BOYW1lLCBiaW5kUmVjb25jaWxlZFZhbHVlLCBzYW5pdGl6ZXIsIG5hdGl2ZU9ubHkpO1xuICByZXR1cm4gcHJvcGVydHk7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIHNpbmdsZSB2YWx1ZSBiaW5kaW5nLlxuICpcbiAqIEBwYXJhbSB2YWx1ZSBWYWx1ZSB0byBkaWZmXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBiaW5kPFQ+KHZhbHVlOiBUKTogVHxOT19DSEFOR0Uge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IGJpbmRpbmdJbmRleCA9IGxWaWV3W0JJTkRJTkdfSU5ERVhdKys7XG4gIHN0b3JlQmluZGluZ01ldGFkYXRhKGxWaWV3KTtcbiAgcmV0dXJuIGJpbmRpbmdVcGRhdGVkKGxWaWV3LCBiaW5kaW5nSW5kZXgsIHZhbHVlKSA/IHZhbHVlIDogTk9fQ0hBTkdFO1xufVxuXG4vKipcbiogKipUT0RPOiBSZW1vdmUgdGhpcyBmdW5jdGlvbiBhZnRlciBgcHJvcGVydHlgIGlzIGluIHVzZSoqXG4qIFVwZGF0ZSBhIHByb3BlcnR5IG9uIGFuIGVsZW1lbnQuXG4qXG4qIElmIHRoZSBwcm9wZXJ0eSBuYW1lIGFsc28gZXhpc3RzIGFzIGFuIGlucHV0IHByb3BlcnR5IG9uIG9uZSBvZiB0aGUgZWxlbWVudCdzIGRpcmVjdGl2ZXMsXG4qIHRoZSBjb21wb25lbnQgcHJvcGVydHkgd2lsbCBiZSBzZXQgaW5zdGVhZCBvZiB0aGUgZWxlbWVudCBwcm9wZXJ0eS4gVGhpcyBjaGVjayBtdXN0XG4qIGJlIGNvbmR1Y3RlZCBhdCBydW50aW1lIHNvIGNoaWxkIGNvbXBvbmVudHMgdGhhdCBhZGQgbmV3IEBJbnB1dHMgZG9uJ3QgaGF2ZSB0byBiZSByZS1jb21waWxlZC5cbipcbiogQHBhcmFtIGluZGV4IFRoZSBpbmRleCBvZiB0aGUgZWxlbWVudCB0byB1cGRhdGUgaW4gdGhlIGRhdGEgYXJyYXlcbiogQHBhcmFtIHByb3BOYW1lIE5hbWUgb2YgcHJvcGVydHkuIEJlY2F1c2UgaXQgaXMgZ29pbmcgdG8gRE9NLCB0aGlzIGlzIG5vdCBzdWJqZWN0IHRvXG4qICAgICAgICByZW5hbWluZyBhcyBwYXJ0IG9mIG1pbmlmaWNhdGlvbi5cbiogQHBhcmFtIHZhbHVlIE5ldyB2YWx1ZSB0byB3cml0ZS5cbiogQHBhcmFtIHNhbml0aXplciBBbiBvcHRpb25hbCBmdW5jdGlvbiB1c2VkIHRvIHNhbml0aXplIHRoZSB2YWx1ZS5cbiogQHBhcmFtIG5hdGl2ZU9ubHkgV2hldGhlciBvciBub3Qgd2Ugc2hvdWxkIG9ubHkgc2V0IG5hdGl2ZSBwcm9wZXJ0aWVzIGFuZCBza2lwIGlucHV0IGNoZWNrXG4qICh0aGlzIGlzIG5lY2Vzc2FyeSBmb3IgaG9zdCBwcm9wZXJ0eSBiaW5kaW5ncylcbiovXG5leHBvcnQgZnVuY3Rpb24gZWxlbWVudFByb3BlcnR5PFQ+KFxuICAgIGluZGV4OiBudW1iZXIsIHByb3BOYW1lOiBzdHJpbmcsIHZhbHVlOiBUIHwgTk9fQ0hBTkdFLCBzYW5pdGl6ZXI/OiBTYW5pdGl6ZXJGbiB8IG51bGwsXG4gICAgbmF0aXZlT25seT86IGJvb2xlYW4pOiB2b2lkIHtcbiAgZWxlbWVudFByb3BlcnR5SW50ZXJuYWwoaW5kZXgsIHByb3BOYW1lLCB2YWx1ZSwgc2FuaXRpemVyLCBuYXRpdmVPbmx5KTtcbn1cblxuLyoqXG4gKiBVcGRhdGVzIGEgc3ludGhldGljIGhvc3QgYmluZGluZyAoZS5nLiBgW0Bmb29dYCkgb24gYSBjb21wb25lbnQuXG4gKlxuICogVGhpcyBpbnN0cnVjdGlvbiBpcyBmb3IgY29tcGF0aWJpbGl0eSBwdXJwb3NlcyBhbmQgaXMgZGVzaWduZWQgdG8gZW5zdXJlIHRoYXQgYVxuICogc3ludGhldGljIGhvc3QgYmluZGluZyAoZS5nLiBgQEhvc3RCaW5kaW5nKCdAZm9vJylgKSBwcm9wZXJseSBnZXRzIHJlbmRlcmVkIGluXG4gKiB0aGUgY29tcG9uZW50J3MgcmVuZGVyZXIuIE5vcm1hbGx5IGFsbCBob3N0IGJpbmRpbmdzIGFyZSBldmFsdWF0ZWQgd2l0aCB0aGUgcGFyZW50XG4gKiBjb21wb25lbnQncyByZW5kZXJlciwgYnV0LCBpbiB0aGUgY2FzZSBvZiBhbmltYXRpb24gQHRyaWdnZXJzLCB0aGV5IG5lZWQgdG8gYmVcbiAqIGV2YWx1YXRlZCB3aXRoIHRoZSBzdWIgY29tcG9uZW50J3MgcmVuZGVyZXIgKGJlY2F1c2UgdGhhdCdzIHdoZXJlIHRoZSBhbmltYXRpb25cbiAqIHRyaWdnZXJzIGFyZSBkZWZpbmVkKS5cbiAqXG4gKiBEbyBub3QgdXNlIHRoaXMgaW5zdHJ1Y3Rpb24gYXMgYSByZXBsYWNlbWVudCBmb3IgYGVsZW1lbnRQcm9wZXJ0eWAuIFRoaXMgaW5zdHJ1Y3Rpb25cbiAqIG9ubHkgZXhpc3RzIHRvIGVuc3VyZSBjb21wYXRpYmlsaXR5IHdpdGggdGhlIFZpZXdFbmdpbmUncyBob3N0IGJpbmRpbmcgYmVoYXZpb3IuXG4gKlxuICogQHBhcmFtIGluZGV4IFRoZSBpbmRleCBvZiB0aGUgZWxlbWVudCB0byB1cGRhdGUgaW4gdGhlIGRhdGEgYXJyYXlcbiAqIEBwYXJhbSBwcm9wTmFtZSBOYW1lIG9mIHByb3BlcnR5LiBCZWNhdXNlIGl0IGlzIGdvaW5nIHRvIERPTSwgdGhpcyBpcyBub3Qgc3ViamVjdCB0b1xuICogICAgICAgIHJlbmFtaW5nIGFzIHBhcnQgb2YgbWluaWZpY2F0aW9uLlxuICogQHBhcmFtIHZhbHVlIE5ldyB2YWx1ZSB0byB3cml0ZS5cbiAqIEBwYXJhbSBzYW5pdGl6ZXIgQW4gb3B0aW9uYWwgZnVuY3Rpb24gdXNlZCB0byBzYW5pdGl6ZSB0aGUgdmFsdWUuXG4gKiBAcGFyYW0gbmF0aXZlT25seSBXaGV0aGVyIG9yIG5vdCB3ZSBzaG91bGQgb25seSBzZXQgbmF0aXZlIHByb3BlcnRpZXMgYW5kIHNraXAgaW5wdXQgY2hlY2tcbiAqICh0aGlzIGlzIG5lY2Vzc2FyeSBmb3IgaG9zdCBwcm9wZXJ0eSBiaW5kaW5ncylcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbXBvbmVudEhvc3RTeW50aGV0aWNQcm9wZXJ0eTxUPihcbiAgICBpbmRleDogbnVtYmVyLCBwcm9wTmFtZTogc3RyaW5nLCB2YWx1ZTogVCB8IE5PX0NIQU5HRSwgc2FuaXRpemVyPzogU2FuaXRpemVyRm4gfCBudWxsLFxuICAgIG5hdGl2ZU9ubHk/OiBib29sZWFuKSB7XG4gIGVsZW1lbnRQcm9wZXJ0eUludGVybmFsKGluZGV4LCBwcm9wTmFtZSwgdmFsdWUsIHNhbml0aXplciwgbmF0aXZlT25seSwgbG9hZENvbXBvbmVudFJlbmRlcmVyKTtcbn1cblxuLyoqXG4qIE1hcHBpbmcgYmV0d2VlbiBhdHRyaWJ1dGVzIG5hbWVzIHRoYXQgZG9uJ3QgY29ycmVzcG9uZCB0byB0aGVpciBlbGVtZW50IHByb3BlcnR5IG5hbWVzLlxuKi9cbmNvbnN0IEFUVFJfVE9fUFJPUDoge1tuYW1lOiBzdHJpbmddOiBzdHJpbmd9ID0ge1xuICAnY2xhc3MnOiAnY2xhc3NOYW1lJyxcbiAgJ2Zvcic6ICdodG1sRm9yJyxcbiAgJ2Zvcm1hY3Rpb24nOiAnZm9ybUFjdGlvbicsXG4gICdpbm5lckh0bWwnOiAnaW5uZXJIVE1MJyxcbiAgJ3JlYWRvbmx5JzogJ3JlYWRPbmx5JyxcbiAgJ3RhYmluZGV4JzogJ3RhYkluZGV4Jyxcbn07XG5cbmZ1bmN0aW9uIGVsZW1lbnRQcm9wZXJ0eUludGVybmFsPFQ+KFxuICAgIGluZGV4OiBudW1iZXIsIHByb3BOYW1lOiBzdHJpbmcsIHZhbHVlOiBUIHwgTk9fQ0hBTkdFLCBzYW5pdGl6ZXI/OiBTYW5pdGl6ZXJGbiB8IG51bGwsXG4gICAgbmF0aXZlT25seT86IGJvb2xlYW4sXG4gICAgbG9hZFJlbmRlcmVyRm4/OiAoKHROb2RlOiBUTm9kZSwgbFZpZXc6IExWaWV3KSA9PiBSZW5kZXJlcjMpIHwgbnVsbCk6IHZvaWQge1xuICBpZiAodmFsdWUgPT09IE5PX0NIQU5HRSkgcmV0dXJuO1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IGVsZW1lbnQgPSBnZXROYXRpdmVCeUluZGV4KGluZGV4LCBsVmlldykgYXMgUkVsZW1lbnQgfCBSQ29tbWVudDtcbiAgY29uc3QgdE5vZGUgPSBnZXRUTm9kZShpbmRleCwgbFZpZXcpO1xuICBsZXQgaW5wdXREYXRhOiBQcm9wZXJ0eUFsaWFzZXN8bnVsbHx1bmRlZmluZWQ7XG4gIGxldCBkYXRhVmFsdWU6IFByb3BlcnR5QWxpYXNWYWx1ZXx1bmRlZmluZWQ7XG4gIGlmICghbmF0aXZlT25seSAmJiAoaW5wdXREYXRhID0gaW5pdGlhbGl6ZVROb2RlSW5wdXRzKHROb2RlKSkgJiZcbiAgICAgIChkYXRhVmFsdWUgPSBpbnB1dERhdGFbcHJvcE5hbWVdKSkge1xuICAgIHNldElucHV0c0ZvclByb3BlcnR5KGxWaWV3LCBkYXRhVmFsdWUsIHZhbHVlKTtcbiAgICBpZiAoaXNDb21wb25lbnQodE5vZGUpKSBtYXJrRGlydHlJZk9uUHVzaChsVmlldywgaW5kZXggKyBIRUFERVJfT0ZGU0VUKTtcbiAgICBpZiAobmdEZXZNb2RlKSB7XG4gICAgICBpZiAodE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkVsZW1lbnQgfHwgdE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkNvbnRhaW5lcikge1xuICAgICAgICBzZXROZ1JlZmxlY3RQcm9wZXJ0aWVzKGxWaWV3LCBlbGVtZW50LCB0Tm9kZS50eXBlLCBkYXRhVmFsdWUsIHZhbHVlKTtcbiAgICAgIH1cbiAgICB9XG4gIH0gZWxzZSBpZiAodE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkVsZW1lbnQpIHtcbiAgICBwcm9wTmFtZSA9IEFUVFJfVE9fUFJPUFtwcm9wTmFtZV0gfHwgcHJvcE5hbWU7XG5cbiAgICBpZiAobmdEZXZNb2RlKSB7XG4gICAgICB2YWxpZGF0ZUFnYWluc3RFdmVudFByb3BlcnRpZXMocHJvcE5hbWUpO1xuICAgICAgdmFsaWRhdGVBZ2FpbnN0VW5rbm93blByb3BlcnRpZXMobFZpZXcsIGVsZW1lbnQsIHByb3BOYW1lLCB0Tm9kZSk7XG4gICAgICBuZ0Rldk1vZGUucmVuZGVyZXJTZXRQcm9wZXJ0eSsrO1xuICAgIH1cblxuICAgIHNhdmVQcm9wZXJ0eURlYnVnRGF0YSh0Tm9kZSwgbFZpZXcsIHByb3BOYW1lLCBsVmlld1tUVklFV10uZGF0YSwgbmF0aXZlT25seSk7XG5cbiAgICBjb25zdCByZW5kZXJlciA9IGxvYWRSZW5kZXJlckZuID8gbG9hZFJlbmRlcmVyRm4odE5vZGUsIGxWaWV3KSA6IGxWaWV3W1JFTkRFUkVSXTtcbiAgICAvLyBJdCBpcyBhc3N1bWVkIHRoYXQgdGhlIHNhbml0aXplciBpcyBvbmx5IGFkZGVkIHdoZW4gdGhlIGNvbXBpbGVyIGRldGVybWluZXMgdGhhdCB0aGUgcHJvcGVydHlcbiAgICAvLyBpcyByaXNreSwgc28gc2FuaXRpemF0aW9uIGNhbiBiZSBkb25lIHdpdGhvdXQgZnVydGhlciBjaGVja3MuXG4gICAgdmFsdWUgPSBzYW5pdGl6ZXIgIT0gbnVsbCA/IChzYW5pdGl6ZXIodmFsdWUsIHROb2RlLnRhZ05hbWUgfHwgJycsIHByb3BOYW1lKSBhcyBhbnkpIDogdmFsdWU7XG4gICAgaWYgKGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSkge1xuICAgICAgcmVuZGVyZXIuc2V0UHJvcGVydHkoZWxlbWVudCBhcyBSRWxlbWVudCwgcHJvcE5hbWUsIHZhbHVlKTtcbiAgICB9IGVsc2UgaWYgKCFpc0FuaW1hdGlvblByb3AocHJvcE5hbWUpKSB7XG4gICAgICAoZWxlbWVudCBhcyBSRWxlbWVudCkuc2V0UHJvcGVydHkgPyAoZWxlbWVudCBhcyBhbnkpLnNldFByb3BlcnR5KHByb3BOYW1lLCB2YWx1ZSkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKGVsZW1lbnQgYXMgYW55KVtwcm9wTmFtZV0gPSB2YWx1ZTtcbiAgICB9XG4gIH0gZWxzZSBpZiAodE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkNvbnRhaW5lcikge1xuICAgIC8vIElmIHRoZSBub2RlIGlzIGEgY29udGFpbmVyIGFuZCB0aGUgcHJvcGVydHkgZGlkbid0XG4gICAgLy8gbWF0Y2ggYW55IG9mIHRoZSBpbnB1dHMgb3Igc2NoZW1hcyB3ZSBzaG91bGQgdGhyb3cuXG4gICAgaWYgKG5nRGV2TW9kZSAmJiAhbWF0Y2hpbmdTY2hlbWFzKGxWaWV3LCB0Tm9kZS50YWdOYW1lKSkge1xuICAgICAgdGhyb3cgY3JlYXRlVW5rbm93blByb3BlcnR5RXJyb3IocHJvcE5hbWUsIHROb2RlKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqIElmIG5vZGUgaXMgYW4gT25QdXNoIGNvbXBvbmVudCwgbWFya3MgaXRzIExWaWV3IGRpcnR5LiAqL1xuZnVuY3Rpb24gbWFya0RpcnR5SWZPblB1c2gobFZpZXc6IExWaWV3LCB2aWV3SW5kZXg6IG51bWJlcik6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0TFZpZXcobFZpZXcpO1xuICBjb25zdCBjaGlsZENvbXBvbmVudExWaWV3ID0gZ2V0Q29tcG9uZW50Vmlld0J5SW5kZXgodmlld0luZGV4LCBsVmlldyk7XG4gIGlmICghKGNoaWxkQ29tcG9uZW50TFZpZXdbRkxBR1NdICYgTFZpZXdGbGFncy5DaGVja0Fsd2F5cykpIHtcbiAgICBjaGlsZENvbXBvbmVudExWaWV3W0ZMQUdTXSB8PSBMVmlld0ZsYWdzLkRpcnR5O1xuICB9XG59XG5cbmZ1bmN0aW9uIHNldE5nUmVmbGVjdFByb3BlcnRpZXMoXG4gICAgbFZpZXc6IExWaWV3LCBlbGVtZW50OiBSRWxlbWVudCB8IFJDb21tZW50LCB0eXBlOiBUTm9kZVR5cGUsIGlucHV0czogUHJvcGVydHlBbGlhc1ZhbHVlLFxuICAgIHZhbHVlOiBhbnkpIHtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBpbnB1dHMubGVuZ3RoOyBpICs9IDMpIHtcbiAgICBjb25zdCByZW5kZXJlciA9IGxWaWV3W1JFTkRFUkVSXTtcbiAgICBjb25zdCBhdHRyTmFtZSA9IG5vcm1hbGl6ZURlYnVnQmluZGluZ05hbWUoaW5wdXRzW2kgKyAyXSBhcyBzdHJpbmcpO1xuICAgIGNvbnN0IGRlYnVnVmFsdWUgPSBub3JtYWxpemVEZWJ1Z0JpbmRpbmdWYWx1ZSh2YWx1ZSk7XG4gICAgaWYgKHR5cGUgPT09IFROb2RlVHlwZS5FbGVtZW50KSB7XG4gICAgICBpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikgP1xuICAgICAgICAgIHJlbmRlcmVyLnNldEF0dHJpYnV0ZSgoZWxlbWVudCBhcyBSRWxlbWVudCksIGF0dHJOYW1lLCBkZWJ1Z1ZhbHVlKSA6XG4gICAgICAgICAgKGVsZW1lbnQgYXMgUkVsZW1lbnQpLnNldEF0dHJpYnV0ZShhdHRyTmFtZSwgZGVidWdWYWx1ZSk7XG4gICAgfSBlbHNlIGlmICh2YWx1ZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBjb25zdCB2YWx1ZSA9IGBiaW5kaW5ncz0ke0pTT04uc3RyaW5naWZ5KHtbYXR0ck5hbWVdOiBkZWJ1Z1ZhbHVlfSwgbnVsbCwgMil9YDtcbiAgICAgIGlmIChpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikpIHtcbiAgICAgICAgcmVuZGVyZXIuc2V0VmFsdWUoKGVsZW1lbnQgYXMgUkNvbW1lbnQpLCB2YWx1ZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAoZWxlbWVudCBhcyBSQ29tbWVudCkudGV4dENvbnRlbnQgPSB2YWx1ZTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gdmFsaWRhdGVBZ2FpbnN0VW5rbm93blByb3BlcnRpZXMoXG4gICAgaG9zdFZpZXc6IExWaWV3LCBlbGVtZW50OiBSRWxlbWVudCB8IFJDb21tZW50LCBwcm9wTmFtZTogc3RyaW5nLCB0Tm9kZTogVE5vZGUpIHtcbiAgLy8gSWYgdGhlIHRhZyBtYXRjaGVzIGFueSBvZiB0aGUgc2NoZW1hcyB3ZSBzaG91bGRuJ3QgdGhyb3cuXG4gIGlmIChtYXRjaGluZ1NjaGVtYXMoaG9zdFZpZXcsIHROb2RlLnRhZ05hbWUpKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgLy8gSWYgcHJvcCBpcyBub3QgYSBrbm93biBwcm9wZXJ0eSBvZiB0aGUgSFRNTCBlbGVtZW50Li4uXG4gIGlmICghKHByb3BOYW1lIGluIGVsZW1lbnQpICYmXG4gICAgICAvLyBhbmQgd2UgYXJlIGluIGEgYnJvd3NlciBjb250ZXh0Li4uICh3ZWIgd29ya2VyIG5vZGVzIHNob3VsZCBiZSBza2lwcGVkKVxuICAgICAgdHlwZW9mIE5vZGUgPT09ICdmdW5jdGlvbicgJiYgZWxlbWVudCBpbnN0YW5jZW9mIE5vZGUgJiZcbiAgICAgIC8vIGFuZCBpc24ndCBhIHN5bnRoZXRpYyBhbmltYXRpb24gcHJvcGVydHkuLi5cbiAgICAgIHByb3BOYW1lWzBdICE9PSBBTklNQVRJT05fUFJPUF9QUkVGSVgpIHtcbiAgICAvLyAuLi4gaXQgaXMgcHJvYmFibHkgYSB1c2VyIGVycm9yIGFuZCB3ZSBzaG91bGQgdGhyb3cuXG4gICAgdGhyb3cgY3JlYXRlVW5rbm93blByb3BlcnR5RXJyb3IocHJvcE5hbWUsIHROb2RlKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBtYXRjaGluZ1NjaGVtYXMoaG9zdFZpZXc6IExWaWV3LCB0YWdOYW1lOiBzdHJpbmcgfCBudWxsKTogYm9vbGVhbiB7XG4gIGNvbnN0IHNjaGVtYXMgPSBob3N0Vmlld1tUVklFV10uc2NoZW1hcztcblxuICBpZiAoc2NoZW1hcyAhPT0gbnVsbCkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc2NoZW1hcy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3Qgc2NoZW1hID0gc2NoZW1hc1tpXTtcbiAgICAgIGlmIChzY2hlbWEgPT09IE5PX0VSUk9SU19TQ0hFTUEgfHxcbiAgICAgICAgICBzY2hlbWEgPT09IENVU1RPTV9FTEVNRU5UU19TQ0hFTUEgJiYgdGFnTmFtZSAmJiB0YWdOYW1lLmluZGV4T2YoJy0nKSA+IC0xKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBmYWxzZTtcbn1cblxuLyoqXG4gKiBTdG9yZXMgZGVidWdnaW5nIGRhdGEgZm9yIHRoaXMgcHJvcGVydHkgYmluZGluZyBvbiBmaXJzdCB0ZW1wbGF0ZSBwYXNzLlxuICogVGhpcyBlbmFibGVzIGZlYXR1cmVzIGxpa2UgRGVidWdFbGVtZW50LnByb3BlcnRpZXMuXG4gKi9cbmZ1bmN0aW9uIHNhdmVQcm9wZXJ0eURlYnVnRGF0YShcbiAgICB0Tm9kZTogVE5vZGUsIGxWaWV3OiBMVmlldywgcHJvcE5hbWU6IHN0cmluZywgdERhdGE6IFREYXRhLFxuICAgIG5hdGl2ZU9ubHk6IGJvb2xlYW4gfCB1bmRlZmluZWQpOiB2b2lkIHtcbiAgY29uc3QgbGFzdEJpbmRpbmdJbmRleCA9IGxWaWV3W0JJTkRJTkdfSU5ERVhdIC0gMTtcblxuICAvLyBCaW5kL2ludGVycG9sYXRpb24gZnVuY3Rpb25zIHNhdmUgYmluZGluZyBtZXRhZGF0YSBpbiB0aGUgbGFzdCBiaW5kaW5nIGluZGV4LFxuICAvLyBidXQgbGVhdmUgdGhlIHByb3BlcnR5IG5hbWUgYmxhbmsuIElmIHRoZSBpbnRlcnBvbGF0aW9uIGRlbGltaXRlciBpcyBhdCB0aGUgMFxuICAvLyBpbmRleCwgd2Uga25vdyB0aGF0IHRoaXMgaXMgb3VyIGZpcnN0IHBhc3MgYW5kIHRoZSBwcm9wZXJ0eSBuYW1lIHN0aWxsIG5lZWRzIHRvXG4gIC8vIGJlIHNldC5cbiAgY29uc3QgYmluZGluZ01ldGFkYXRhID0gdERhdGFbbGFzdEJpbmRpbmdJbmRleF0gYXMgc3RyaW5nO1xuICBpZiAoYmluZGluZ01ldGFkYXRhWzBdID09IElOVEVSUE9MQVRJT05fREVMSU1JVEVSKSB7XG4gICAgdERhdGFbbGFzdEJpbmRpbmdJbmRleF0gPSBwcm9wTmFtZSArIGJpbmRpbmdNZXRhZGF0YTtcblxuICAgIC8vIFdlIGRvbid0IHdhbnQgdG8gc3RvcmUgaW5kaWNlcyBmb3IgaG9zdCBiaW5kaW5ncyBiZWNhdXNlIHRoZXkgYXJlIHN0b3JlZCBpbiBhXG4gICAgLy8gZGlmZmVyZW50IHBhcnQgb2YgTFZpZXcgKHRoZSBleHBhbmRvIHNlY3Rpb24pLlxuICAgIGlmICghbmF0aXZlT25seSkge1xuICAgICAgaWYgKHROb2RlLnByb3BlcnR5TWV0YWRhdGFTdGFydEluZGV4ID09IC0xKSB7XG4gICAgICAgIHROb2RlLnByb3BlcnR5TWV0YWRhdGFTdGFydEluZGV4ID0gbGFzdEJpbmRpbmdJbmRleDtcbiAgICAgIH1cbiAgICAgIHROb2RlLnByb3BlcnR5TWV0YWRhdGFFbmRJbmRleCA9IGxhc3RCaW5kaW5nSW5kZXggKyAxO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIENyZWF0ZXMgYW4gZXJyb3IgdGhhdCBzaG91bGQgYmUgdGhyb3duIHdoZW4gZW5jb3VudGVyaW5nIGFuIHVua25vd24gcHJvcGVydHkgb24gYW4gZWxlbWVudC5cbiAqIEBwYXJhbSBwcm9wTmFtZSBOYW1lIG9mIHRoZSBpbnZhbGlkIHByb3BlcnR5LlxuICogQHBhcmFtIHROb2RlIE5vZGUgb24gd2hpY2ggd2UgZW5jb3VudGVyZWQgdGhlIGVycm9yLlxuICovXG5mdW5jdGlvbiBjcmVhdGVVbmtub3duUHJvcGVydHlFcnJvcihwcm9wTmFtZTogc3RyaW5nLCB0Tm9kZTogVE5vZGUpOiBFcnJvciB7XG4gIHJldHVybiBuZXcgRXJyb3IoXG4gICAgICBgVGVtcGxhdGUgZXJyb3I6IENhbid0IGJpbmQgdG8gJyR7cHJvcE5hbWV9JyBzaW5jZSBpdCBpc24ndCBhIGtub3duIHByb3BlcnR5IG9mICcke3ROb2RlLnRhZ05hbWV9Jy5gKTtcbn1cbiJdfQ==