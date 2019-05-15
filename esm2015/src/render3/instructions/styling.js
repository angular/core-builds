/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
import { assertEqual } from '../../util/assert';
import { FLAGS, HEADER_OFFSET, RENDERER } from '../interfaces/view';
import { getActiveDirectiveId, getActiveDirectiveSuperClassDepth, getLView, getPreviousOrParentTNode, getSelectedIndex } from '../state';
import { getInitialClassNameValue, renderStyling, updateClassMap, updateClassProp as updateclassProp, updateContextWithBindings, updateStyleMap, updateStyleProp as updatestyleProp } from '../styling/class_and_style_bindings';
import { enqueueHostInstruction, registerHostDirective } from '../styling/host_instructions_queue';
import { BoundPlayerFactory } from '../styling/player_factory';
import { DEFAULT_TEMPLATE_DIRECTIVE_INDEX } from '../styling/shared';
import { getCachedStylingContext, setCachedStylingContext } from '../styling/state';
import { allocateOrUpdateDirectiveIntoContext, createEmptyStylingContext, forceClassesAsString, forceStylesAsString, getStylingContextFromLView, hasClassInput, hasStyleInput } from '../styling/util';
import { NO_CHANGE } from '../tokens';
import { renderStringify } from '../util/misc_utils';
import { getRootContext } from '../util/view_traversal_utils';
import { getTNode } from '../util/view_utils';
import { scheduleTick, setInputsForProperty } from './shared';
/*
 * The contents of this file include the instructions for all styling-related
 * operations in Angular.
 *
 * The instructions present in this file are:
 *
 * Template level styling instructions:
 * - styling
 * - styleMap
 * - classMap
 * - styleProp
 * - classProp
 * - stylingApply
 */
/**
 * Allocates style and class binding properties on the element during creation mode.
 *
 * This instruction is meant to be called during creation mode to register all
 * dynamic style and class bindings on the element. Note that this is only used
 * for binding values (see `elementStart` to learn how to assign static styling
 * values to an element).
 *
 * \@codeGenApi
 * @param {?=} classBindingNames An array containing bindable class names.
 *        The `classProp` instruction refers to the class name by index in
 *        this array (i.e. `['foo', 'bar']` means `foo=0` and `bar=1`).
 * @param {?=} styleBindingNames An array containing bindable style properties.
 *        The `styleProp` instruction refers to the class name by index in
 *        this array (i.e. `['width', 'height']` means `width=0` and `height=1`).
 * @param {?=} styleSanitizer An optional sanitizer function that will be used to sanitize any CSS
 *        style values that are applied to the element (during rendering).
 *
 * Note that this will allocate the provided style/class bindings to the host element if
 * this function is called within a host binding.
 *
 * @return {?}
 */
export function Δstyling(classBindingNames, styleBindingNames, styleSanitizer) {
    /** @type {?} */
    const tNode = getPreviousOrParentTNode();
    if (!tNode.stylingTemplate) {
        tNode.stylingTemplate = createEmptyStylingContext();
    }
    /** @type {?} */
    const directiveStylingIndex = getActiveDirectiveStylingIndex();
    if (directiveStylingIndex) {
        // despite the binding being applied in a queue (below), the allocation
        // of the directive into the context happens right away. The reason for
        // this is to retain the ordering of the directives (which is important
        // for the prioritization of bindings).
        allocateOrUpdateDirectiveIntoContext(tNode.stylingTemplate, directiveStylingIndex);
        /** @type {?} */
        const fns = tNode.onElementCreationFns = tNode.onElementCreationFns || [];
        fns.push((/**
         * @return {?}
         */
        () => {
            initstyling(tNode, classBindingNames, styleBindingNames, styleSanitizer, directiveStylingIndex);
            registerHostDirective((/** @type {?} */ (tNode.stylingTemplate)), directiveStylingIndex);
        }));
    }
    else {
        // calling the function below ensures that the template's binding values
        // are applied as the first set of bindings into the context. If any other
        // styling bindings are set on the same element (by directives and/or
        // components) then they will be applied at the end of the `elementEnd`
        // instruction (because directives are created first before styling is
        // executed for a new element).
        initstyling(tNode, classBindingNames, styleBindingNames, styleSanitizer, DEFAULT_TEMPLATE_DIRECTIVE_INDEX);
    }
}
/**
 * @param {?} tNode
 * @param {?} classBindingNames
 * @param {?} styleBindingNames
 * @param {?} styleSanitizer
 * @param {?} directiveStylingIndex
 * @return {?}
 */
function initstyling(tNode, classBindingNames, styleBindingNames, styleSanitizer, directiveStylingIndex) {
    updateContextWithBindings((/** @type {?} */ (tNode.stylingTemplate)), directiveStylingIndex, classBindingNames, styleBindingNames, styleSanitizer);
}
/**
 * Update a style binding on an element with the provided value.
 *
 * If the style value is falsy then it will be removed from the element
 * (or assigned a different value depending if there are any styles placed
 * on the element with `styleMap` or any static styles that are
 * present from when the element was created with `styling`).
 *
 * Note that the styling element is updated as part of `stylingApply`.
 *
 * \@codeGenApi
 * @param {?} styleIndex Index of style to update. This index value refers to the
 *        index of the style in the style bindings array that was passed into
 *        `styling`.
 * @param {?} value New value to write (falsy to remove).
 * @param {?=} suffix Optional suffix. Used with scalar values to add unit such as `px`.
 *        Note that when a suffix is provided then the underlying sanitizer will
 *        be ignored.
 * @param {?=} forceOverride Whether or not to update the styling value immediately
 *        (despite the other bindings possibly having priority)
 *
 * Note that this will apply the provided style value to the host element if this function is called
 * within a host binding.
 *
 * @return {?}
 */
export function ΔstyleProp(styleIndex, value, suffix, forceOverride) {
    /** @type {?} */
    const index = getSelectedIndex();
    /** @type {?} */
    const valueToAdd = resolveStylePropValue(value, suffix);
    /** @type {?} */
    const stylingContext = getStylingContext(index, getLView());
    /** @type {?} */
    const directiveStylingIndex = getActiveDirectiveStylingIndex();
    if (directiveStylingIndex) {
        /** @type {?} */
        const args = [stylingContext, styleIndex, valueToAdd, directiveStylingIndex, forceOverride];
        enqueueHostInstruction(stylingContext, directiveStylingIndex, updatestyleProp, args);
    }
    else {
        updatestyleProp(stylingContext, styleIndex, valueToAdd, DEFAULT_TEMPLATE_DIRECTIVE_INDEX, forceOverride);
    }
}
/**
 * @param {?} value
 * @param {?} suffix
 * @return {?}
 */
function resolveStylePropValue(value, suffix) {
    /** @type {?} */
    let valueToAdd = null;
    if (value !== null) {
        if (suffix) {
            // when a suffix is applied then it will bypass
            // sanitization entirely (b/c a new string is created)
            valueToAdd = renderStringify(value) + suffix;
        }
        else {
            // sanitization happens by dealing with a String value
            // this means that the string value will be passed through
            // into the style rendering later (which is where the value
            // will be sanitized before it is applied)
            valueToAdd = (/** @type {?} */ ((/** @type {?} */ (value))));
        }
    }
    return valueToAdd;
}
/**
 * Update a class binding on an element with the provided value.
 *
 * This instruction is meant to handle the `[class.foo]="exp"` case and,
 * therefore, the class binding itself must already be allocated using
 * `styling` within the creation block.
 *
 * \@codeGenApi
 * @param {?} classIndex Index of class to toggle. This index value refers to the
 *        index of the class in the class bindings array that was passed into
 *        `styling` (which is meant to be called before this
 *        function is).
 * @param {?} value A true/false value which will turn the class on or off.
 * @param {?=} forceOverride Whether or not this value will be applied regardless
 *        of where it is being set within the styling priority structure.
 *
 * Note that this will apply the provided class value to the host element if this function
 * is called within a host binding.
 *
 * @return {?}
 */
export function ΔclassProp(classIndex, value, forceOverride) {
    /** @type {?} */
    const index = getSelectedIndex();
    /** @type {?} */
    const input = (value instanceof BoundPlayerFactory) ?
        ((/** @type {?} */ (value))) :
        booleanOrNull(value);
    /** @type {?} */
    const directiveStylingIndex = getActiveDirectiveStylingIndex();
    /** @type {?} */
    const stylingContext = getStylingContext(index, getLView());
    if (directiveStylingIndex) {
        /** @type {?} */
        const args = [stylingContext, classIndex, input, directiveStylingIndex, forceOverride];
        enqueueHostInstruction(stylingContext, directiveStylingIndex, updateclassProp, args);
    }
    else {
        updateclassProp(stylingContext, classIndex, input, DEFAULT_TEMPLATE_DIRECTIVE_INDEX, forceOverride);
    }
}
/**
 * @param {?} value
 * @return {?}
 */
function booleanOrNull(value) {
    if (typeof value === 'boolean')
        return value;
    return value ? true : null;
}
/**
 * Update style bindings using an object literal on an element.
 *
 * This instruction is meant to apply styling via the `[style]="exp"` template bindings.
 * When styles are applied to the element they will then be updated with respect to
 * any styles/classes set via `styleProp`. If any styles are set to falsy
 * then they will be removed from the element.
 *
 * Note that the styling instruction will not be applied until `stylingApply` is called.
 *
 * \@codeGenApi
 * @param {?} styles A key/value style map of the styles that will be applied to the given element.
 *        Any missing styles (that have already been applied to the element beforehand) will be
 *        removed (unset) from the element's styling.
 *
 * Note that this will apply the provided styleMap value to the host element if this function
 * is called within a host binding.
 *
 * @return {?}
 */
export function ΔstyleMap(styles) {
    /** @type {?} */
    const index = getSelectedIndex();
    /** @type {?} */
    const lView = getLView();
    /** @type {?} */
    const stylingContext = getStylingContext(index, lView);
    /** @type {?} */
    const directiveStylingIndex = getActiveDirectiveStylingIndex();
    if (directiveStylingIndex) {
        /** @type {?} */
        const args = [stylingContext, styles, directiveStylingIndex];
        enqueueHostInstruction(stylingContext, directiveStylingIndex, updateStyleMap, args);
    }
    else {
        /** @type {?} */
        const tNode = getTNode(index, lView);
        // inputs are only evaluated from a template binding into a directive, therefore,
        // there should not be a situation where a directive host bindings function
        // evaluates the inputs (this should only happen in the template function)
        if (hasStyleInput(tNode) && styles !== NO_CHANGE) {
            /** @type {?} */
            const initialStyles = getInitialClassNameValue(stylingContext);
            /** @type {?} */
            const styleInputVal = (initialStyles.length ? (initialStyles + ' ') : '') + forceStylesAsString(styles);
            setInputsForProperty(lView, (/** @type {?} */ ((/** @type {?} */ (tNode.inputs))['style'])), styleInputVal);
            styles = NO_CHANGE;
        }
        updateStyleMap(stylingContext, styles);
    }
}
/**
 * Update class bindings using an object literal or class-string on an element.
 *
 * This instruction is meant to apply styling via the `[class]="exp"` template bindings.
 * When classes are applied to the element they will then be updated with
 * respect to any styles/classes set via `classProp`. If any
 * classes are set to falsy then they will be removed from the element.
 *
 * Note that the styling instruction will not be applied until `stylingApply` is called.
 * Note that this will the provided classMap value to the host element if this function is called
 * within a host binding.
 *
 * \@codeGenApi
 * @param {?} classes A key/value map or string of CSS classes that will be added to the
 *        given element. Any missing classes (that have already been applied to the element
 *        beforehand) will be removed (unset) from the element's list of CSS classes.
 *
 * @return {?}
 */
export function ΔclassMap(classes) {
    /** @type {?} */
    const index = getSelectedIndex();
    /** @type {?} */
    const lView = getLView();
    /** @type {?} */
    const stylingContext = getStylingContext(index, lView);
    /** @type {?} */
    const directiveStylingIndex = getActiveDirectiveStylingIndex();
    if (directiveStylingIndex) {
        /** @type {?} */
        const args = [stylingContext, classes, directiveStylingIndex];
        enqueueHostInstruction(stylingContext, directiveStylingIndex, updateClassMap, args);
    }
    else {
        /** @type {?} */
        const tNode = getTNode(index, lView);
        // inputs are only evaluated from a template binding into a directive, therefore,
        // there should not be a situation where a directive host bindings function
        // evaluates the inputs (this should only happen in the template function)
        if (hasClassInput(tNode) && classes !== NO_CHANGE) {
            /** @type {?} */
            const initialClasses = getInitialClassNameValue(stylingContext);
            /** @type {?} */
            const classInputVal = (initialClasses.length ? (initialClasses + ' ') : '') + forceClassesAsString(classes);
            setInputsForProperty(lView, (/** @type {?} */ ((/** @type {?} */ (tNode.inputs))['class'])), classInputVal);
            classes = NO_CHANGE;
        }
        updateClassMap(stylingContext, classes);
    }
}
/**
 * Apply all style and class binding values to the element.
 *
 * This instruction is meant to be run after `styleMap`, `classMap`,
 * `styleProp` or `classProp` instructions have been run and will
 * only apply styling to the element if any styling bindings have been updated.
 *
 * \@codeGenApi
 * @return {?}
 */
export function ΔstylingApply() {
    /** @type {?} */
    const index = getSelectedIndex();
    /** @type {?} */
    const directiveStylingIndex = getActiveDirectiveStylingIndex() || DEFAULT_TEMPLATE_DIRECTIVE_INDEX;
    /** @type {?} */
    const lView = getLView();
    /** @type {?} */
    const tNode = getTNode(index, lView);
    // if a non-element value is being processed then we can't render values
    // on the element at all therefore by setting the renderer to null then
    // the styling apply code knows not to actually apply the values...
    /** @type {?} */
    const renderer = tNode.type === 3 /* Element */ ? lView[RENDERER] : null;
    /** @type {?} */
    const isFirstRender = (lView[FLAGS] & 8 /* FirstLViewPass */) !== 0;
    /** @type {?} */
    const stylingContext = getStylingContext(index, lView);
    /** @type {?} */
    const totalPlayersQueued = renderStyling(stylingContext, renderer, lView, isFirstRender, null, null, directiveStylingIndex);
    if (totalPlayersQueued > 0) {
        /** @type {?} */
        const rootContext = getRootContext(lView);
        scheduleTick(rootContext, 2 /* FlushPlayers */);
    }
    // because select(n) may not run between every instruction, the cached styling
    // context may not get cleared between elements. The reason for this is because
    // styling bindings (like `[style]` and `[class]`) are not recognized as property
    // bindings by default so a select(n) instruction is not generated. To ensure the
    // context is loaded correctly for the next element the cache below is pre-emptively
    // cleared because there is no code in Angular that applies more styling code after a
    // styling flush has occurred. Note that this will be fixed once FW-1254 lands.
    setCachedStylingContext(null);
}
/**
 * @return {?}
 */
export function getActiveDirectiveStylingIndex() {
    // whenever a directive's hostBindings function is called a uniqueId value
    // is assigned. Normally this is enough to help distinguish one directive
    // from another for the styling context, but there are situations where a
    // sub-class directive could inherit and assign styling in concert with a
    // parent directive. To help the styling code distinguish between a parent
    // sub-classed directive the inheritance depth is taken into account as well.
    return getActiveDirectiveId() + getActiveDirectiveSuperClassDepth();
}
/**
 * @param {?} index
 * @param {?} lView
 * @return {?}
 */
function getStylingContext(index, lView) {
    /** @type {?} */
    let context = getCachedStylingContext();
    if (!context) {
        context = getStylingContextFromLView(index + HEADER_OFFSET, lView);
        setCachedStylingContext(context);
    }
    else if (ngDevMode) {
        /** @type {?} */
        const actualContext = getStylingContextFromLView(index + HEADER_OFFSET, lView);
        assertEqual(context, actualContext, 'The cached styling context is invalid');
    }
    return context;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3R5bGluZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaW5zdHJ1Y3Rpb25zL3N0eWxpbmcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7OztBQVFBLE9BQU8sRUFBQyxXQUFXLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUc5QyxPQUFPLEVBQUMsS0FBSyxFQUFFLGFBQWEsRUFBcUIsUUFBUSxFQUFtQixNQUFNLG9CQUFvQixDQUFDO0FBQ3ZHLE9BQU8sRUFBQyxvQkFBb0IsRUFBRSxpQ0FBaUMsRUFBRSxRQUFRLEVBQUUsd0JBQXdCLEVBQUUsZ0JBQWdCLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDdkksT0FBTyxFQUFDLHdCQUF3QixFQUFFLGFBQWEsRUFBRSxjQUFjLEVBQUUsZUFBZSxJQUFJLGVBQWUsRUFBRSx5QkFBeUIsRUFBRSxjQUFjLEVBQUUsZUFBZSxJQUFJLGVBQWUsRUFBQyxNQUFNLHFDQUFxQyxDQUFDO0FBQy9OLE9BQU8sRUFBVyxzQkFBc0IsRUFBRSxxQkFBcUIsRUFBQyxNQUFNLG9DQUFvQyxDQUFDO0FBQzNHLE9BQU8sRUFBQyxrQkFBa0IsRUFBQyxNQUFNLDJCQUEyQixDQUFDO0FBQzdELE9BQU8sRUFBQyxnQ0FBZ0MsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQ25FLE9BQU8sRUFBQyx1QkFBdUIsRUFBRSx1QkFBdUIsRUFBQyxNQUFNLGtCQUFrQixDQUFDO0FBQ2xGLE9BQU8sRUFBQyxvQ0FBb0MsRUFBRSx5QkFBeUIsRUFBRSxvQkFBb0IsRUFBRSxtQkFBbUIsRUFBRSwwQkFBMEIsRUFBRSxhQUFhLEVBQUUsYUFBYSxFQUFDLE1BQU0saUJBQWlCLENBQUM7QUFDck0sT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLFdBQVcsQ0FBQztBQUNwQyxPQUFPLEVBQUMsZUFBZSxFQUFDLE1BQU0sb0JBQW9CLENBQUM7QUFDbkQsT0FBTyxF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O1FBQ1osT0FBTyxHQUFHLDBCQUEwQixDQUFDLEtBQUssR0FBRyxhQUFhLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDbkUsdUJBQXVCLENBQUMsT0FBTyxDQUFDLENBQUM7S0FDbEM7U0FBTSxJQUFJLFNBQVMsRUFBRTs7Y0FDZCxhQUFhLEdBQUcsMEJBQTBCLENBQUMsS0FBSyxHQUFHLGFBQWEsRUFBRSxLQUFLLENBQUM7UUFDOUUsV0FBVyxDQUFDLE9BQU8sRUFBRSxhQUFhLEVBQUUsdUNBQXVDLENBQUMsQ0FBQztLQUM5RTtJQUNELE9BQU8sT0FBTyxDQUFDO0FBQ2pCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5pbXBvcnQge1N0eWxlU2FuaXRpemVGbn0gZnJvbSAnLi4vLi4vc2FuaXRpemF0aW9uL3N0eWxlX3Nhbml0aXplcic7XG5pbXBvcnQge2Fzc2VydEVxdWFsfSBmcm9tICcuLi8uLi91dGlsL2Fzc2VydCc7XG5pbXBvcnQge1ROb2RlLCBUTm9kZVR5cGV9IGZyb20gJy4uL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge1BsYXllckZhY3Rvcnl9IGZyb20gJy4uL2ludGVyZmFjZXMvcGxheWVyJztcbmltcG9ydCB7RkxBR1MsIEhFQURFUl9PRkZTRVQsIExWaWV3LCBMVmlld0ZsYWdzLCBSRU5ERVJFUiwgUm9vdENvbnRleHRGbGFnc30gZnJvbSAnLi4vaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7Z2V0QWN0aXZlRGlyZWN0aXZlSWQsIGdldEFjdGl2ZURpcmVjdGl2ZVN1cGVyQ2xhc3NEZXB0aCwgZ2V0TFZpZXcsIGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSwgZ2V0U2VsZWN0ZWRJbmRleH0gZnJvbSAnLi4vc3RhdGUnO1xuaW1wb3J0IHtnZXRJbml0aWFsQ2xhc3NOYW1lVmFsdWUsIHJlbmRlclN0eWxpbmcsIHVwZGF0ZUNsYXNzTWFwLCB1cGRhdGVDbGFzc1Byb3AgYXMgdXBkYXRlY2xhc3NQcm9wLCB1cGRhdGVDb250ZXh0V2l0aEJpbmRpbmdzLCB1cGRhdGVTdHlsZU1hcCwgdXBkYXRlU3R5bGVQcm9wIGFzIHVwZGF0ZXN0eWxlUHJvcH0gZnJvbSAnLi4vc3R5bGluZy9jbGFzc19hbmRfc3R5bGVfYmluZGluZ3MnO1xuaW1wb3J0IHtQYXJhbXNPZiwgZW5xdWV1ZUhvc3RJbnN0cnVjdGlvbiwgcmVnaXN0ZXJIb3N0RGlyZWN0aXZlfSBmcm9tICcuLi9zdHlsaW5nL2hvc3RfaW5zdHJ1Y3Rpb25zX3F1ZXVlJztcbmltcG9ydCB7Qm91bmRQbGF5ZXJGYWN0b3J5fSBmcm9tICcuLi9zdHlsaW5nL3BsYXllcl9mYWN0b3J5JztcbmltcG9ydCB7REVGQVVMVF9URU1QTEFURV9ESVJFQ1RJVkVfSU5ERVh9IGZyb20gJy4uL3N0eWxpbmcvc2hhcmVkJztcbmltcG9ydCB7Z2V0Q2FjaGVkU3R5bGluZ0NvbnRleHQsIHNldENhY2hlZFN0eWxpbmdDb250ZXh0fSBmcm9tICcuLi9zdHlsaW5nL3N0YXRlJztcbmltcG9ydCB7YWxsb2NhdGVPclVwZGF0ZURpcmVjdGl2ZUludG9Db250ZXh0LCBjcmVhdGVFbXB0eVN0eWxpbmdDb250ZXh0LCBmb3JjZUNsYXNzZXNBc1N0cmluZywgZm9yY2VTdHlsZXNBc1N0cmluZywgZ2V0U3R5bGluZ0NvbnRleHRGcm9tTFZpZXcsIGhhc0NsYXNzSW5wdXQsIGhhc1N0eWxlSW5wdXR9IGZyb20gJy4uL3N0eWxpbmcvdXRpbCc7XG5pbXBvcnQge05PX0NIQU5HRX0gZnJvbSAnLi4vdG9rZW5zJztcbmltcG9ydCB7cmVuZGVyU3RyaW5naWZ5fSBmcm9tICcuLi91dGlsL21pc2NfdXRpbHMnO1xuaW1wb3J0IHtnZXRSb290Q29udGV4dH0gZnJvbSAnLi4vdXRpbC92aWV3X3RyYXZlcnNhbF91dGlscyc7XG5pbXBvcnQge2dldFROb2RlfSBmcm9tICcuLi91dGlsL3ZpZXdfdXRpbHMnO1xuXG5pbXBvcnQge3NjaGVkdWxlVGljaywgc2V0SW5wdXRzRm9yUHJvcGVydHl9IGZyb20gJy4vc2hhcmVkJztcblxuXG5cbi8qXG4gKiBUaGUgY29udGVudHMgb2YgdGhpcyBmaWxlIGluY2x1ZGUgdGhlIGluc3RydWN0aW9ucyBmb3IgYWxsIHN0eWxpbmctcmVsYXRlZFxuICogb3BlcmF0aW9ucyBpbiBBbmd1bGFyLlxuICpcbiAqIFRoZSBpbnN0cnVjdGlvbnMgcHJlc2VudCBpbiB0aGlzIGZpbGUgYXJlOlxuICpcbiAqIFRlbXBsYXRlIGxldmVsIHN0eWxpbmcgaW5zdHJ1Y3Rpb25zOlxuICogLSBzdHlsaW5nXG4gKiAtIHN0eWxlTWFwXG4gKiAtIGNsYXNzTWFwXG4gKiAtIHN0eWxlUHJvcFxuICogLSBjbGFzc1Byb3BcbiAqIC0gc3R5bGluZ0FwcGx5XG4gKi9cblxuLyoqXG4gKiBBbGxvY2F0ZXMgc3R5bGUgYW5kIGNsYXNzIGJpbmRpbmcgcHJvcGVydGllcyBvbiB0aGUgZWxlbWVudCBkdXJpbmcgY3JlYXRpb24gbW9kZS5cbiAqXG4gKiBUaGlzIGluc3RydWN0aW9uIGlzIG1lYW50IHRvIGJlIGNhbGxlZCBkdXJpbmcgY3JlYXRpb24gbW9kZSB0byByZWdpc3RlciBhbGxcbiAqIGR5bmFtaWMgc3R5bGUgYW5kIGNsYXNzIGJpbmRpbmdzIG9uIHRoZSBlbGVtZW50LiBOb3RlIHRoYXQgdGhpcyBpcyBvbmx5IHVzZWRcbiAqIGZvciBiaW5kaW5nIHZhbHVlcyAoc2VlIGBlbGVtZW50U3RhcnRgIHRvIGxlYXJuIGhvdyB0byBhc3NpZ24gc3RhdGljIHN0eWxpbmdcbiAqIHZhbHVlcyB0byBhbiBlbGVtZW50KS5cbiAqXG4gKiBAcGFyYW0gY2xhc3NCaW5kaW5nTmFtZXMgQW4gYXJyYXkgY29udGFpbmluZyBiaW5kYWJsZSBjbGFzcyBuYW1lcy5cbiAqICAgICAgICBUaGUgYGNsYXNzUHJvcGAgaW5zdHJ1Y3Rpb24gcmVmZXJzIHRvIHRoZSBjbGFzcyBuYW1lIGJ5IGluZGV4IGluXG4gKiAgICAgICAgdGhpcyBhcnJheSAoaS5lLiBgWydmb28nLCAnYmFyJ11gIG1lYW5zIGBmb289MGAgYW5kIGBiYXI9MWApLlxuICogQHBhcmFtIHN0eWxlQmluZGluZ05hbWVzIEFuIGFycmF5IGNvbnRhaW5pbmcgYmluZGFibGUgc3R5bGUgcHJvcGVydGllcy5cbiAqICAgICAgICBUaGUgYHN0eWxlUHJvcGAgaW5zdHJ1Y3Rpb24gcmVmZXJzIHRvIHRoZSBjbGFzcyBuYW1lIGJ5IGluZGV4IGluXG4gKiAgICAgICAgdGhpcyBhcnJheSAoaS5lLiBgWyd3aWR0aCcsICdoZWlnaHQnXWAgbWVhbnMgYHdpZHRoPTBgIGFuZCBgaGVpZ2h0PTFgKS5cbiAqIEBwYXJhbSBzdHlsZVNhbml0aXplciBBbiBvcHRpb25hbCBzYW5pdGl6ZXIgZnVuY3Rpb24gdGhhdCB3aWxsIGJlIHVzZWQgdG8gc2FuaXRpemUgYW55IENTU1xuICogICAgICAgIHN0eWxlIHZhbHVlcyB0aGF0IGFyZSBhcHBsaWVkIHRvIHRoZSBlbGVtZW50IChkdXJpbmcgcmVuZGVyaW5nKS5cbiAqXG4gKiBOb3RlIHRoYXQgdGhpcyB3aWxsIGFsbG9jYXRlIHRoZSBwcm92aWRlZCBzdHlsZS9jbGFzcyBiaW5kaW5ncyB0byB0aGUgaG9zdCBlbGVtZW50IGlmXG4gKiB0aGlzIGZ1bmN0aW9uIGlzIGNhbGxlZCB3aXRoaW4gYSBob3N0IGJpbmRpbmcuXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIM6Uc3R5bGluZyhcbiAgICBjbGFzc0JpbmRpbmdOYW1lcz86IHN0cmluZ1tdIHwgbnVsbCwgc3R5bGVCaW5kaW5nTmFtZXM/OiBzdHJpbmdbXSB8IG51bGwsXG4gICAgc3R5bGVTYW5pdGl6ZXI/OiBTdHlsZVNhbml0aXplRm4gfCBudWxsKTogdm9pZCB7XG4gIGNvbnN0IHROb2RlID0gZ2V0UHJldmlvdXNPclBhcmVudFROb2RlKCk7XG4gIGlmICghdE5vZGUuc3R5bGluZ1RlbXBsYXRlKSB7XG4gICAgdE5vZGUuc3R5bGluZ1RlbXBsYXRlID0gY3JlYXRlRW1wdHlTdHlsaW5nQ29udGV4dCgpO1xuICB9XG5cbiAgY29uc3QgZGlyZWN0aXZlU3R5bGluZ0luZGV4ID0gZ2V0QWN0aXZlRGlyZWN0aXZlU3R5bGluZ0luZGV4KCk7XG4gIGlmIChkaXJlY3RpdmVTdHlsaW5nSW5kZXgpIHtcbiAgICAvLyBkZXNwaXRlIHRoZSBiaW5kaW5nIGJlaW5nIGFwcGxpZWQgaW4gYSBxdWV1ZSAoYmVsb3cpLCB0aGUgYWxsb2NhdGlvblxuICAgIC8vIG9mIHRoZSBkaXJlY3RpdmUgaW50byB0aGUgY29udGV4dCBoYXBwZW5zIHJpZ2h0IGF3YXkuIFRoZSByZWFzb24gZm9yXG4gICAgLy8gdGhpcyBpcyB0byByZXRhaW4gdGhlIG9yZGVyaW5nIG9mIHRoZSBkaXJlY3RpdmVzICh3aGljaCBpcyBpbXBvcnRhbnRcbiAgICAvLyBmb3IgdGhlIHByaW9yaXRpemF0aW9uIG9mIGJpbmRpbmdzKS5cbiAgICBhbGxvY2F0ZU9yVXBkYXRlRGlyZWN0aXZlSW50b0NvbnRleHQodE5vZGUuc3R5bGluZ1RlbXBsYXRlLCBkaXJlY3RpdmVTdHlsaW5nSW5kZXgpO1xuXG4gICAgY29uc3QgZm5zID0gdE5vZGUub25FbGVtZW50Q3JlYXRpb25GbnMgPSB0Tm9kZS5vbkVsZW1lbnRDcmVhdGlvbkZucyB8fCBbXTtcbiAgICBmbnMucHVzaCgoKSA9PiB7XG4gICAgICBpbml0c3R5bGluZyhcbiAgICAgICAgICB0Tm9kZSwgY2xhc3NCaW5kaW5nTmFtZXMsIHN0eWxlQmluZGluZ05hbWVzLCBzdHlsZVNhbml0aXplciwgZGlyZWN0aXZlU3R5bGluZ0luZGV4KTtcbiAgICAgIHJlZ2lzdGVySG9zdERpcmVjdGl2ZSh0Tm9kZS5zdHlsaW5nVGVtcGxhdGUgISwgZGlyZWN0aXZlU3R5bGluZ0luZGV4KTtcbiAgICB9KTtcbiAgfSBlbHNlIHtcbiAgICAvLyBjYWxsaW5nIHRoZSBmdW5jdGlvbiBiZWxvdyBlbnN1cmVzIHRoYXQgdGhlIHRlbXBsYXRlJ3MgYmluZGluZyB2YWx1ZXNcbiAgICAvLyBhcmUgYXBwbGllZCBhcyB0aGUgZmlyc3Qgc2V0IG9mIGJpbmRpbmdzIGludG8gdGhlIGNvbnRleHQuIElmIGFueSBvdGhlclxuICAgIC8vIHN0eWxpbmcgYmluZGluZ3MgYXJlIHNldCBvbiB0aGUgc2FtZSBlbGVtZW50IChieSBkaXJlY3RpdmVzIGFuZC9vclxuICAgIC8vIGNvbXBvbmVudHMpIHRoZW4gdGhleSB3aWxsIGJlIGFwcGxpZWQgYXQgdGhlIGVuZCBvZiB0aGUgYGVsZW1lbnRFbmRgXG4gICAgLy8gaW5zdHJ1Y3Rpb24gKGJlY2F1c2UgZGlyZWN0aXZlcyBhcmUgY3JlYXRlZCBmaXJzdCBiZWZvcmUgc3R5bGluZyBpc1xuICAgIC8vIGV4ZWN1dGVkIGZvciBhIG5ldyBlbGVtZW50KS5cbiAgICBpbml0c3R5bGluZyhcbiAgICAgICAgdE5vZGUsIGNsYXNzQmluZGluZ05hbWVzLCBzdHlsZUJpbmRpbmdOYW1lcywgc3R5bGVTYW5pdGl6ZXIsXG4gICAgICAgIERFRkFVTFRfVEVNUExBVEVfRElSRUNUSVZFX0lOREVYKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBpbml0c3R5bGluZyhcbiAgICB0Tm9kZTogVE5vZGUsIGNsYXNzQmluZGluZ05hbWVzOiBzdHJpbmdbXSB8IG51bGwgfCB1bmRlZmluZWQsXG4gICAgc3R5bGVCaW5kaW5nTmFtZXM6IHN0cmluZ1tdIHwgbnVsbCB8IHVuZGVmaW5lZCxcbiAgICBzdHlsZVNhbml0aXplcjogU3R5bGVTYW5pdGl6ZUZuIHwgbnVsbCB8IHVuZGVmaW5lZCwgZGlyZWN0aXZlU3R5bGluZ0luZGV4OiBudW1iZXIpOiB2b2lkIHtcbiAgdXBkYXRlQ29udGV4dFdpdGhCaW5kaW5ncyhcbiAgICAgIHROb2RlLnN0eWxpbmdUZW1wbGF0ZSAhLCBkaXJlY3RpdmVTdHlsaW5nSW5kZXgsIGNsYXNzQmluZGluZ05hbWVzLCBzdHlsZUJpbmRpbmdOYW1lcyxcbiAgICAgIHN0eWxlU2FuaXRpemVyKTtcbn1cblxuXG4vKipcbiAqIFVwZGF0ZSBhIHN0eWxlIGJpbmRpbmcgb24gYW4gZWxlbWVudCB3aXRoIHRoZSBwcm92aWRlZCB2YWx1ZS5cbiAqXG4gKiBJZiB0aGUgc3R5bGUgdmFsdWUgaXMgZmFsc3kgdGhlbiBpdCB3aWxsIGJlIHJlbW92ZWQgZnJvbSB0aGUgZWxlbWVudFxuICogKG9yIGFzc2lnbmVkIGEgZGlmZmVyZW50IHZhbHVlIGRlcGVuZGluZyBpZiB0aGVyZSBhcmUgYW55IHN0eWxlcyBwbGFjZWRcbiAqIG9uIHRoZSBlbGVtZW50IHdpdGggYHN0eWxlTWFwYCBvciBhbnkgc3RhdGljIHN0eWxlcyB0aGF0IGFyZVxuICogcHJlc2VudCBmcm9tIHdoZW4gdGhlIGVsZW1lbnQgd2FzIGNyZWF0ZWQgd2l0aCBgc3R5bGluZ2ApLlxuICpcbiAqIE5vdGUgdGhhdCB0aGUgc3R5bGluZyBlbGVtZW50IGlzIHVwZGF0ZWQgYXMgcGFydCBvZiBgc3R5bGluZ0FwcGx5YC5cbiAqXG4gKiBAcGFyYW0gc3R5bGVJbmRleCBJbmRleCBvZiBzdHlsZSB0byB1cGRhdGUuIFRoaXMgaW5kZXggdmFsdWUgcmVmZXJzIHRvIHRoZVxuICogICAgICAgIGluZGV4IG9mIHRoZSBzdHlsZSBpbiB0aGUgc3R5bGUgYmluZGluZ3MgYXJyYXkgdGhhdCB3YXMgcGFzc2VkIGludG9cbiAqICAgICAgICBgc3R5bGluZ2AuXG4gKiBAcGFyYW0gdmFsdWUgTmV3IHZhbHVlIHRvIHdyaXRlIChmYWxzeSB0byByZW1vdmUpLlxuICogQHBhcmFtIHN1ZmZpeCBPcHRpb25hbCBzdWZmaXguIFVzZWQgd2l0aCBzY2FsYXIgdmFsdWVzIHRvIGFkZCB1bml0IHN1Y2ggYXMgYHB4YC5cbiAqICAgICAgICBOb3RlIHRoYXQgd2hlbiBhIHN1ZmZpeCBpcyBwcm92aWRlZCB0aGVuIHRoZSB1bmRlcmx5aW5nIHNhbml0aXplciB3aWxsXG4gKiAgICAgICAgYmUgaWdub3JlZC5cbiAqIEBwYXJhbSBmb3JjZU92ZXJyaWRlIFdoZXRoZXIgb3Igbm90IHRvIHVwZGF0ZSB0aGUgc3R5bGluZyB2YWx1ZSBpbW1lZGlhdGVseVxuICogICAgICAgIChkZXNwaXRlIHRoZSBvdGhlciBiaW5kaW5ncyBwb3NzaWJseSBoYXZpbmcgcHJpb3JpdHkpXG4gKlxuICogTm90ZSB0aGF0IHRoaXMgd2lsbCBhcHBseSB0aGUgcHJvdmlkZWQgc3R5bGUgdmFsdWUgdG8gdGhlIGhvc3QgZWxlbWVudCBpZiB0aGlzIGZ1bmN0aW9uIGlzIGNhbGxlZFxuICogd2l0aGluIGEgaG9zdCBiaW5kaW5nLlxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDOlHN0eWxlUHJvcChcbiAgICBzdHlsZUluZGV4OiBudW1iZXIsIHZhbHVlOiBzdHJpbmcgfCBudW1iZXIgfCBTdHJpbmcgfCBQbGF5ZXJGYWN0b3J5IHwgbnVsbCxcbiAgICBzdWZmaXg/OiBzdHJpbmcgfCBudWxsLCBmb3JjZU92ZXJyaWRlPzogYm9vbGVhbik6IHZvaWQge1xuICBjb25zdCBpbmRleCA9IGdldFNlbGVjdGVkSW5kZXgoKTtcbiAgY29uc3QgdmFsdWVUb0FkZCA9IHJlc29sdmVTdHlsZVByb3BWYWx1ZSh2YWx1ZSwgc3VmZml4KTtcbiAgY29uc3Qgc3R5bGluZ0NvbnRleHQgPSBnZXRTdHlsaW5nQ29udGV4dChpbmRleCwgZ2V0TFZpZXcoKSk7XG4gIGNvbnN0IGRpcmVjdGl2ZVN0eWxpbmdJbmRleCA9IGdldEFjdGl2ZURpcmVjdGl2ZVN0eWxpbmdJbmRleCgpO1xuICBpZiAoZGlyZWN0aXZlU3R5bGluZ0luZGV4KSB7XG4gICAgY29uc3QgYXJnczogUGFyYW1zT2Y8dHlwZW9mIHVwZGF0ZXN0eWxlUHJvcD4gPVxuICAgICAgICBbc3R5bGluZ0NvbnRleHQsIHN0eWxlSW5kZXgsIHZhbHVlVG9BZGQsIGRpcmVjdGl2ZVN0eWxpbmdJbmRleCwgZm9yY2VPdmVycmlkZV07XG4gICAgZW5xdWV1ZUhvc3RJbnN0cnVjdGlvbihzdHlsaW5nQ29udGV4dCwgZGlyZWN0aXZlU3R5bGluZ0luZGV4LCB1cGRhdGVzdHlsZVByb3AsIGFyZ3MpO1xuICB9IGVsc2Uge1xuICAgIHVwZGF0ZXN0eWxlUHJvcChcbiAgICAgICAgc3R5bGluZ0NvbnRleHQsIHN0eWxlSW5kZXgsIHZhbHVlVG9BZGQsIERFRkFVTFRfVEVNUExBVEVfRElSRUNUSVZFX0lOREVYLCBmb3JjZU92ZXJyaWRlKTtcbiAgfVxufVxuXG5mdW5jdGlvbiByZXNvbHZlU3R5bGVQcm9wVmFsdWUoXG4gICAgdmFsdWU6IHN0cmluZyB8IG51bWJlciB8IFN0cmluZyB8IFBsYXllckZhY3RvcnkgfCBudWxsLCBzdWZmaXg6IHN0cmluZyB8IG51bGwgfCB1bmRlZmluZWQpIHtcbiAgbGV0IHZhbHVlVG9BZGQ6IHN0cmluZ3xudWxsID0gbnVsbDtcbiAgaWYgKHZhbHVlICE9PSBudWxsKSB7XG4gICAgaWYgKHN1ZmZpeCkge1xuICAgICAgLy8gd2hlbiBhIHN1ZmZpeCBpcyBhcHBsaWVkIHRoZW4gaXQgd2lsbCBieXBhc3NcbiAgICAgIC8vIHNhbml0aXphdGlvbiBlbnRpcmVseSAoYi9jIGEgbmV3IHN0cmluZyBpcyBjcmVhdGVkKVxuICAgICAgdmFsdWVUb0FkZCA9IHJlbmRlclN0cmluZ2lmeSh2YWx1ZSkgKyBzdWZmaXg7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIHNhbml0aXphdGlvbiBoYXBwZW5zIGJ5IGRlYWxpbmcgd2l0aCBhIFN0cmluZyB2YWx1ZVxuICAgICAgLy8gdGhpcyBtZWFucyB0aGF0IHRoZSBzdHJpbmcgdmFsdWUgd2lsbCBiZSBwYXNzZWQgdGhyb3VnaFxuICAgICAgLy8gaW50byB0aGUgc3R5bGUgcmVuZGVyaW5nIGxhdGVyICh3aGljaCBpcyB3aGVyZSB0aGUgdmFsdWVcbiAgICAgIC8vIHdpbGwgYmUgc2FuaXRpemVkIGJlZm9yZSBpdCBpcyBhcHBsaWVkKVxuICAgICAgdmFsdWVUb0FkZCA9IHZhbHVlIGFzIGFueSBhcyBzdHJpbmc7XG4gICAgfVxuICB9XG4gIHJldHVybiB2YWx1ZVRvQWRkO1xufVxuXG5cbi8qKlxuICogVXBkYXRlIGEgY2xhc3MgYmluZGluZyBvbiBhbiBlbGVtZW50IHdpdGggdGhlIHByb3ZpZGVkIHZhbHVlLlxuICpcbiAqIFRoaXMgaW5zdHJ1Y3Rpb24gaXMgbWVhbnQgdG8gaGFuZGxlIHRoZSBgW2NsYXNzLmZvb109XCJleHBcImAgY2FzZSBhbmQsXG4gKiB0aGVyZWZvcmUsIHRoZSBjbGFzcyBiaW5kaW5nIGl0c2VsZiBtdXN0IGFscmVhZHkgYmUgYWxsb2NhdGVkIHVzaW5nXG4gKiBgc3R5bGluZ2Agd2l0aGluIHRoZSBjcmVhdGlvbiBibG9jay5cbiAqXG4gKiBAcGFyYW0gY2xhc3NJbmRleCBJbmRleCBvZiBjbGFzcyB0byB0b2dnbGUuIFRoaXMgaW5kZXggdmFsdWUgcmVmZXJzIHRvIHRoZVxuICogICAgICAgIGluZGV4IG9mIHRoZSBjbGFzcyBpbiB0aGUgY2xhc3MgYmluZGluZ3MgYXJyYXkgdGhhdCB3YXMgcGFzc2VkIGludG9cbiAqICAgICAgICBgc3R5bGluZ2AgKHdoaWNoIGlzIG1lYW50IHRvIGJlIGNhbGxlZCBiZWZvcmUgdGhpc1xuICogICAgICAgIGZ1bmN0aW9uIGlzKS5cbiAqIEBwYXJhbSB2YWx1ZSBBIHRydWUvZmFsc2UgdmFsdWUgd2hpY2ggd2lsbCB0dXJuIHRoZSBjbGFzcyBvbiBvciBvZmYuXG4gKiBAcGFyYW0gZm9yY2VPdmVycmlkZSBXaGV0aGVyIG9yIG5vdCB0aGlzIHZhbHVlIHdpbGwgYmUgYXBwbGllZCByZWdhcmRsZXNzXG4gKiAgICAgICAgb2Ygd2hlcmUgaXQgaXMgYmVpbmcgc2V0IHdpdGhpbiB0aGUgc3R5bGluZyBwcmlvcml0eSBzdHJ1Y3R1cmUuXG4gKlxuICogTm90ZSB0aGF0IHRoaXMgd2lsbCBhcHBseSB0aGUgcHJvdmlkZWQgY2xhc3MgdmFsdWUgdG8gdGhlIGhvc3QgZWxlbWVudCBpZiB0aGlzIGZ1bmN0aW9uXG4gKiBpcyBjYWxsZWQgd2l0aGluIGEgaG9zdCBiaW5kaW5nLlxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDOlGNsYXNzUHJvcChcbiAgICBjbGFzc0luZGV4OiBudW1iZXIsIHZhbHVlOiBib29sZWFuIHwgUGxheWVyRmFjdG9yeSwgZm9yY2VPdmVycmlkZT86IGJvb2xlYW4pOiB2b2lkIHtcbiAgY29uc3QgaW5kZXggPSBnZXRTZWxlY3RlZEluZGV4KCk7XG4gIGNvbnN0IGlucHV0ID0gKHZhbHVlIGluc3RhbmNlb2YgQm91bmRQbGF5ZXJGYWN0b3J5KSA/XG4gICAgICAodmFsdWUgYXMgQm91bmRQbGF5ZXJGYWN0b3J5PGJvb2xlYW58bnVsbD4pIDpcbiAgICAgIGJvb2xlYW5Pck51bGwodmFsdWUpO1xuICBjb25zdCBkaXJlY3RpdmVTdHlsaW5nSW5kZXggPSBnZXRBY3RpdmVEaXJlY3RpdmVTdHlsaW5nSW5kZXgoKTtcbiAgY29uc3Qgc3R5bGluZ0NvbnRleHQgPSBnZXRTdHlsaW5nQ29udGV4dChpbmRleCwgZ2V0TFZpZXcoKSk7XG4gIGlmIChkaXJlY3RpdmVTdHlsaW5nSW5kZXgpIHtcbiAgICBjb25zdCBhcmdzOiBQYXJhbXNPZjx0eXBlb2YgdXBkYXRlY2xhc3NQcm9wPiA9XG4gICAgICAgIFtzdHlsaW5nQ29udGV4dCwgY2xhc3NJbmRleCwgaW5wdXQsIGRpcmVjdGl2ZVN0eWxpbmdJbmRleCwgZm9yY2VPdmVycmlkZV07XG4gICAgZW5xdWV1ZUhvc3RJbnN0cnVjdGlvbihzdHlsaW5nQ29udGV4dCwgZGlyZWN0aXZlU3R5bGluZ0luZGV4LCB1cGRhdGVjbGFzc1Byb3AsIGFyZ3MpO1xuICB9IGVsc2Uge1xuICAgIHVwZGF0ZWNsYXNzUHJvcChcbiAgICAgICAgc3R5bGluZ0NvbnRleHQsIGNsYXNzSW5kZXgsIGlucHV0LCBERUZBVUxUX1RFTVBMQVRFX0RJUkVDVElWRV9JTkRFWCwgZm9yY2VPdmVycmlkZSk7XG4gIH1cbn1cblxuXG5mdW5jdGlvbiBib29sZWFuT3JOdWxsKHZhbHVlOiBhbnkpOiBib29sZWFufG51bGwge1xuICBpZiAodHlwZW9mIHZhbHVlID09PSAnYm9vbGVhbicpIHJldHVybiB2YWx1ZTtcbiAgcmV0dXJuIHZhbHVlID8gdHJ1ZSA6IG51bGw7XG59XG5cblxuLyoqXG4gKiBVcGRhdGUgc3R5bGUgYmluZGluZ3MgdXNpbmcgYW4gb2JqZWN0IGxpdGVyYWwgb24gYW4gZWxlbWVudC5cbiAqXG4gKiBUaGlzIGluc3RydWN0aW9uIGlzIG1lYW50IHRvIGFwcGx5IHN0eWxpbmcgdmlhIHRoZSBgW3N0eWxlXT1cImV4cFwiYCB0ZW1wbGF0ZSBiaW5kaW5ncy5cbiAqIFdoZW4gc3R5bGVzIGFyZSBhcHBsaWVkIHRvIHRoZSBlbGVtZW50IHRoZXkgd2lsbCB0aGVuIGJlIHVwZGF0ZWQgd2l0aCByZXNwZWN0IHRvXG4gKiBhbnkgc3R5bGVzL2NsYXNzZXMgc2V0IHZpYSBgc3R5bGVQcm9wYC4gSWYgYW55IHN0eWxlcyBhcmUgc2V0IHRvIGZhbHN5XG4gKiB0aGVuIHRoZXkgd2lsbCBiZSByZW1vdmVkIGZyb20gdGhlIGVsZW1lbnQuXG4gKlxuICogTm90ZSB0aGF0IHRoZSBzdHlsaW5nIGluc3RydWN0aW9uIHdpbGwgbm90IGJlIGFwcGxpZWQgdW50aWwgYHN0eWxpbmdBcHBseWAgaXMgY2FsbGVkLlxuICpcbiAqIEBwYXJhbSBzdHlsZXMgQSBrZXkvdmFsdWUgc3R5bGUgbWFwIG9mIHRoZSBzdHlsZXMgdGhhdCB3aWxsIGJlIGFwcGxpZWQgdG8gdGhlIGdpdmVuIGVsZW1lbnQuXG4gKiAgICAgICAgQW55IG1pc3Npbmcgc3R5bGVzICh0aGF0IGhhdmUgYWxyZWFkeSBiZWVuIGFwcGxpZWQgdG8gdGhlIGVsZW1lbnQgYmVmb3JlaGFuZCkgd2lsbCBiZVxuICogICAgICAgIHJlbW92ZWQgKHVuc2V0KSBmcm9tIHRoZSBlbGVtZW50J3Mgc3R5bGluZy5cbiAqXG4gKiBOb3RlIHRoYXQgdGhpcyB3aWxsIGFwcGx5IHRoZSBwcm92aWRlZCBzdHlsZU1hcCB2YWx1ZSB0byB0aGUgaG9zdCBlbGVtZW50IGlmIHRoaXMgZnVuY3Rpb25cbiAqIGlzIGNhbGxlZCB3aXRoaW4gYSBob3N0IGJpbmRpbmcuXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIM6Uc3R5bGVNYXAoc3R5bGVzOiB7W3N0eWxlTmFtZTogc3RyaW5nXTogYW55fSB8IE5PX0NIQU5HRSB8IG51bGwpOiB2b2lkIHtcbiAgY29uc3QgaW5kZXggPSBnZXRTZWxlY3RlZEluZGV4KCk7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3Qgc3R5bGluZ0NvbnRleHQgPSBnZXRTdHlsaW5nQ29udGV4dChpbmRleCwgbFZpZXcpO1xuICBjb25zdCBkaXJlY3RpdmVTdHlsaW5nSW5kZXggPSBnZXRBY3RpdmVEaXJlY3RpdmVTdHlsaW5nSW5kZXgoKTtcbiAgaWYgKGRpcmVjdGl2ZVN0eWxpbmdJbmRleCkge1xuICAgIGNvbnN0IGFyZ3M6IFBhcmFtc09mPHR5cGVvZiB1cGRhdGVTdHlsZU1hcD4gPSBbc3R5bGluZ0NvbnRleHQsIHN0eWxlcywgZGlyZWN0aXZlU3R5bGluZ0luZGV4XTtcbiAgICBlbnF1ZXVlSG9zdEluc3RydWN0aW9uKHN0eWxpbmdDb250ZXh0LCBkaXJlY3RpdmVTdHlsaW5nSW5kZXgsIHVwZGF0ZVN0eWxlTWFwLCBhcmdzKTtcbiAgfSBlbHNlIHtcbiAgICBjb25zdCB0Tm9kZSA9IGdldFROb2RlKGluZGV4LCBsVmlldyk7XG5cbiAgICAvLyBpbnB1dHMgYXJlIG9ubHkgZXZhbHVhdGVkIGZyb20gYSB0ZW1wbGF0ZSBiaW5kaW5nIGludG8gYSBkaXJlY3RpdmUsIHRoZXJlZm9yZSxcbiAgICAvLyB0aGVyZSBzaG91bGQgbm90IGJlIGEgc2l0dWF0aW9uIHdoZXJlIGEgZGlyZWN0aXZlIGhvc3QgYmluZGluZ3MgZnVuY3Rpb25cbiAgICAvLyBldmFsdWF0ZXMgdGhlIGlucHV0cyAodGhpcyBzaG91bGQgb25seSBoYXBwZW4gaW4gdGhlIHRlbXBsYXRlIGZ1bmN0aW9uKVxuICAgIGlmIChoYXNTdHlsZUlucHV0KHROb2RlKSAmJiBzdHlsZXMgIT09IE5PX0NIQU5HRSkge1xuICAgICAgY29uc3QgaW5pdGlhbFN0eWxlcyA9IGdldEluaXRpYWxDbGFzc05hbWVWYWx1ZShzdHlsaW5nQ29udGV4dCk7XG4gICAgICBjb25zdCBzdHlsZUlucHV0VmFsID1cbiAgICAgICAgICAoaW5pdGlhbFN0eWxlcy5sZW5ndGggPyAoaW5pdGlhbFN0eWxlcyArICcgJykgOiAnJykgKyBmb3JjZVN0eWxlc0FzU3RyaW5nKHN0eWxlcyk7XG4gICAgICBzZXRJbnB1dHNGb3JQcm9wZXJ0eShsVmlldywgdE5vZGUuaW5wdXRzICFbJ3N0eWxlJ10gISwgc3R5bGVJbnB1dFZhbCk7XG4gICAgICBzdHlsZXMgPSBOT19DSEFOR0U7XG4gICAgfVxuICAgIHVwZGF0ZVN0eWxlTWFwKHN0eWxpbmdDb250ZXh0LCBzdHlsZXMpO1xuICB9XG59XG5cblxuLyoqXG4gKiBVcGRhdGUgY2xhc3MgYmluZGluZ3MgdXNpbmcgYW4gb2JqZWN0IGxpdGVyYWwgb3IgY2xhc3Mtc3RyaW5nIG9uIGFuIGVsZW1lbnQuXG4gKlxuICogVGhpcyBpbnN0cnVjdGlvbiBpcyBtZWFudCB0byBhcHBseSBzdHlsaW5nIHZpYSB0aGUgYFtjbGFzc109XCJleHBcImAgdGVtcGxhdGUgYmluZGluZ3MuXG4gKiBXaGVuIGNsYXNzZXMgYXJlIGFwcGxpZWQgdG8gdGhlIGVsZW1lbnQgdGhleSB3aWxsIHRoZW4gYmUgdXBkYXRlZCB3aXRoXG4gKiByZXNwZWN0IHRvIGFueSBzdHlsZXMvY2xhc3NlcyBzZXQgdmlhIGBjbGFzc1Byb3BgLiBJZiBhbnlcbiAqIGNsYXNzZXMgYXJlIHNldCB0byBmYWxzeSB0aGVuIHRoZXkgd2lsbCBiZSByZW1vdmVkIGZyb20gdGhlIGVsZW1lbnQuXG4gKlxuICogTm90ZSB0aGF0IHRoZSBzdHlsaW5nIGluc3RydWN0aW9uIHdpbGwgbm90IGJlIGFwcGxpZWQgdW50aWwgYHN0eWxpbmdBcHBseWAgaXMgY2FsbGVkLlxuICogTm90ZSB0aGF0IHRoaXMgd2lsbCB0aGUgcHJvdmlkZWQgY2xhc3NNYXAgdmFsdWUgdG8gdGhlIGhvc3QgZWxlbWVudCBpZiB0aGlzIGZ1bmN0aW9uIGlzIGNhbGxlZFxuICogd2l0aGluIGEgaG9zdCBiaW5kaW5nLlxuICpcbiAqIEBwYXJhbSBjbGFzc2VzIEEga2V5L3ZhbHVlIG1hcCBvciBzdHJpbmcgb2YgQ1NTIGNsYXNzZXMgdGhhdCB3aWxsIGJlIGFkZGVkIHRvIHRoZVxuICogICAgICAgIGdpdmVuIGVsZW1lbnQuIEFueSBtaXNzaW5nIGNsYXNzZXMgKHRoYXQgaGF2ZSBhbHJlYWR5IGJlZW4gYXBwbGllZCB0byB0aGUgZWxlbWVudFxuICogICAgICAgIGJlZm9yZWhhbmQpIHdpbGwgYmUgcmVtb3ZlZCAodW5zZXQpIGZyb20gdGhlIGVsZW1lbnQncyBsaXN0IG9mIENTUyBjbGFzc2VzLlxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDOlGNsYXNzTWFwKGNsYXNzZXM6IHtbc3R5bGVOYW1lOiBzdHJpbmddOiBhbnl9IHwgTk9fQ0hBTkdFIHwgc3RyaW5nIHwgbnVsbCk6IHZvaWQge1xuICBjb25zdCBpbmRleCA9IGdldFNlbGVjdGVkSW5kZXgoKTtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCBzdHlsaW5nQ29udGV4dCA9IGdldFN0eWxpbmdDb250ZXh0KGluZGV4LCBsVmlldyk7XG4gIGNvbnN0IGRpcmVjdGl2ZVN0eWxpbmdJbmRleCA9IGdldEFjdGl2ZURpcmVjdGl2ZVN0eWxpbmdJbmRleCgpO1xuICBpZiAoZGlyZWN0aXZlU3R5bGluZ0luZGV4KSB7XG4gICAgY29uc3QgYXJnczogUGFyYW1zT2Y8dHlwZW9mIHVwZGF0ZUNsYXNzTWFwPiA9IFtzdHlsaW5nQ29udGV4dCwgY2xhc3NlcywgZGlyZWN0aXZlU3R5bGluZ0luZGV4XTtcbiAgICBlbnF1ZXVlSG9zdEluc3RydWN0aW9uKHN0eWxpbmdDb250ZXh0LCBkaXJlY3RpdmVTdHlsaW5nSW5kZXgsIHVwZGF0ZUNsYXNzTWFwLCBhcmdzKTtcbiAgfSBlbHNlIHtcbiAgICBjb25zdCB0Tm9kZSA9IGdldFROb2RlKGluZGV4LCBsVmlldyk7XG4gICAgLy8gaW5wdXRzIGFyZSBvbmx5IGV2YWx1YXRlZCBmcm9tIGEgdGVtcGxhdGUgYmluZGluZyBpbnRvIGEgZGlyZWN0aXZlLCB0aGVyZWZvcmUsXG4gICAgLy8gdGhlcmUgc2hvdWxkIG5vdCBiZSBhIHNpdHVhdGlvbiB3aGVyZSBhIGRpcmVjdGl2ZSBob3N0IGJpbmRpbmdzIGZ1bmN0aW9uXG4gICAgLy8gZXZhbHVhdGVzIHRoZSBpbnB1dHMgKHRoaXMgc2hvdWxkIG9ubHkgaGFwcGVuIGluIHRoZSB0ZW1wbGF0ZSBmdW5jdGlvbilcbiAgICBpZiAoaGFzQ2xhc3NJbnB1dCh0Tm9kZSkgJiYgY2xhc3NlcyAhPT0gTk9fQ0hBTkdFKSB7XG4gICAgICBjb25zdCBpbml0aWFsQ2xhc3NlcyA9IGdldEluaXRpYWxDbGFzc05hbWVWYWx1ZShzdHlsaW5nQ29udGV4dCk7XG4gICAgICBjb25zdCBjbGFzc0lucHV0VmFsID1cbiAgICAgICAgICAoaW5pdGlhbENsYXNzZXMubGVuZ3RoID8gKGluaXRpYWxDbGFzc2VzICsgJyAnKSA6ICcnKSArIGZvcmNlQ2xhc3Nlc0FzU3RyaW5nKGNsYXNzZXMpO1xuICAgICAgc2V0SW5wdXRzRm9yUHJvcGVydHkobFZpZXcsIHROb2RlLmlucHV0cyAhWydjbGFzcyddICEsIGNsYXNzSW5wdXRWYWwpO1xuICAgICAgY2xhc3NlcyA9IE5PX0NIQU5HRTtcbiAgICB9XG4gICAgdXBkYXRlQ2xhc3NNYXAoc3R5bGluZ0NvbnRleHQsIGNsYXNzZXMpO1xuICB9XG59XG5cbi8qKlxuICogQXBwbHkgYWxsIHN0eWxlIGFuZCBjbGFzcyBiaW5kaW5nIHZhbHVlcyB0byB0aGUgZWxlbWVudC5cbiAqXG4gKiBUaGlzIGluc3RydWN0aW9uIGlzIG1lYW50IHRvIGJlIHJ1biBhZnRlciBgc3R5bGVNYXBgLCBgY2xhc3NNYXBgLFxuICogYHN0eWxlUHJvcGAgb3IgYGNsYXNzUHJvcGAgaW5zdHJ1Y3Rpb25zIGhhdmUgYmVlbiBydW4gYW5kIHdpbGxcbiAqIG9ubHkgYXBwbHkgc3R5bGluZyB0byB0aGUgZWxlbWVudCBpZiBhbnkgc3R5bGluZyBiaW5kaW5ncyBoYXZlIGJlZW4gdXBkYXRlZC5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gzpRzdHlsaW5nQXBwbHkoKTogdm9pZCB7XG4gIGNvbnN0IGluZGV4ID0gZ2V0U2VsZWN0ZWRJbmRleCgpO1xuICBjb25zdCBkaXJlY3RpdmVTdHlsaW5nSW5kZXggPVxuICAgICAgZ2V0QWN0aXZlRGlyZWN0aXZlU3R5bGluZ0luZGV4KCkgfHwgREVGQVVMVF9URU1QTEFURV9ESVJFQ1RJVkVfSU5ERVg7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgdE5vZGUgPSBnZXRUTm9kZShpbmRleCwgbFZpZXcpO1xuXG4gIC8vIGlmIGEgbm9uLWVsZW1lbnQgdmFsdWUgaXMgYmVpbmcgcHJvY2Vzc2VkIHRoZW4gd2UgY2FuJ3QgcmVuZGVyIHZhbHVlc1xuICAvLyBvbiB0aGUgZWxlbWVudCBhdCBhbGwgdGhlcmVmb3JlIGJ5IHNldHRpbmcgdGhlIHJlbmRlcmVyIHRvIG51bGwgdGhlblxuICAvLyB0aGUgc3R5bGluZyBhcHBseSBjb2RlIGtub3dzIG5vdCB0byBhY3R1YWxseSBhcHBseSB0aGUgdmFsdWVzLi4uXG4gIGNvbnN0IHJlbmRlcmVyID0gdE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkVsZW1lbnQgPyBsVmlld1tSRU5ERVJFUl0gOiBudWxsO1xuICBjb25zdCBpc0ZpcnN0UmVuZGVyID0gKGxWaWV3W0ZMQUdTXSAmIExWaWV3RmxhZ3MuRmlyc3RMVmlld1Bhc3MpICE9PSAwO1xuICBjb25zdCBzdHlsaW5nQ29udGV4dCA9IGdldFN0eWxpbmdDb250ZXh0KGluZGV4LCBsVmlldyk7XG4gIGNvbnN0IHRvdGFsUGxheWVyc1F1ZXVlZCA9IHJlbmRlclN0eWxpbmcoXG4gICAgICBzdHlsaW5nQ29udGV4dCwgcmVuZGVyZXIsIGxWaWV3LCBpc0ZpcnN0UmVuZGVyLCBudWxsLCBudWxsLCBkaXJlY3RpdmVTdHlsaW5nSW5kZXgpO1xuICBpZiAodG90YWxQbGF5ZXJzUXVldWVkID4gMCkge1xuICAgIGNvbnN0IHJvb3RDb250ZXh0ID0gZ2V0Um9vdENvbnRleHQobFZpZXcpO1xuICAgIHNjaGVkdWxlVGljayhyb290Q29udGV4dCwgUm9vdENvbnRleHRGbGFncy5GbHVzaFBsYXllcnMpO1xuICB9XG5cbiAgLy8gYmVjYXVzZSBzZWxlY3QobikgbWF5IG5vdCBydW4gYmV0d2VlbiBldmVyeSBpbnN0cnVjdGlvbiwgdGhlIGNhY2hlZCBzdHlsaW5nXG4gIC8vIGNvbnRleHQgbWF5IG5vdCBnZXQgY2xlYXJlZCBiZXR3ZWVuIGVsZW1lbnRzLiBUaGUgcmVhc29uIGZvciB0aGlzIGlzIGJlY2F1c2VcbiAgLy8gc3R5bGluZyBiaW5kaW5ncyAobGlrZSBgW3N0eWxlXWAgYW5kIGBbY2xhc3NdYCkgYXJlIG5vdCByZWNvZ25pemVkIGFzIHByb3BlcnR5XG4gIC8vIGJpbmRpbmdzIGJ5IGRlZmF1bHQgc28gYSBzZWxlY3QobikgaW5zdHJ1Y3Rpb24gaXMgbm90IGdlbmVyYXRlZC4gVG8gZW5zdXJlIHRoZVxuICAvLyBjb250ZXh0IGlzIGxvYWRlZCBjb3JyZWN0bHkgZm9yIHRoZSBuZXh0IGVsZW1lbnQgdGhlIGNhY2hlIGJlbG93IGlzIHByZS1lbXB0aXZlbHlcbiAgLy8gY2xlYXJlZCBiZWNhdXNlIHRoZXJlIGlzIG5vIGNvZGUgaW4gQW5ndWxhciB0aGF0IGFwcGxpZXMgbW9yZSBzdHlsaW5nIGNvZGUgYWZ0ZXIgYVxuICAvLyBzdHlsaW5nIGZsdXNoIGhhcyBvY2N1cnJlZC4gTm90ZSB0aGF0IHRoaXMgd2lsbCBiZSBmaXhlZCBvbmNlIEZXLTEyNTQgbGFuZHMuXG4gIHNldENhY2hlZFN0eWxpbmdDb250ZXh0KG51bGwpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0QWN0aXZlRGlyZWN0aXZlU3R5bGluZ0luZGV4KCkge1xuICAvLyB3aGVuZXZlciBhIGRpcmVjdGl2ZSdzIGhvc3RCaW5kaW5ncyBmdW5jdGlvbiBpcyBjYWxsZWQgYSB1bmlxdWVJZCB2YWx1ZVxuICAvLyBpcyBhc3NpZ25lZC4gTm9ybWFsbHkgdGhpcyBpcyBlbm91Z2ggdG8gaGVscCBkaXN0aW5ndWlzaCBvbmUgZGlyZWN0aXZlXG4gIC8vIGZyb20gYW5vdGhlciBmb3IgdGhlIHN0eWxpbmcgY29udGV4dCwgYnV0IHRoZXJlIGFyZSBzaXR1YXRpb25zIHdoZXJlIGFcbiAgLy8gc3ViLWNsYXNzIGRpcmVjdGl2ZSBjb3VsZCBpbmhlcml0IGFuZCBhc3NpZ24gc3R5bGluZyBpbiBjb25jZXJ0IHdpdGggYVxuICAvLyBwYXJlbnQgZGlyZWN0aXZlLiBUbyBoZWxwIHRoZSBzdHlsaW5nIGNvZGUgZGlzdGluZ3Vpc2ggYmV0d2VlbiBhIHBhcmVudFxuICAvLyBzdWItY2xhc3NlZCBkaXJlY3RpdmUgdGhlIGluaGVyaXRhbmNlIGRlcHRoIGlzIHRha2VuIGludG8gYWNjb3VudCBhcyB3ZWxsLlxuICByZXR1cm4gZ2V0QWN0aXZlRGlyZWN0aXZlSWQoKSArIGdldEFjdGl2ZURpcmVjdGl2ZVN1cGVyQ2xhc3NEZXB0aCgpO1xufVxuXG5mdW5jdGlvbiBnZXRTdHlsaW5nQ29udGV4dChpbmRleDogbnVtYmVyLCBsVmlldzogTFZpZXcpIHtcbiAgbGV0IGNvbnRleHQgPSBnZXRDYWNoZWRTdHlsaW5nQ29udGV4dCgpO1xuICBpZiAoIWNvbnRleHQpIHtcbiAgICBjb250ZXh0ID0gZ2V0U3R5bGluZ0NvbnRleHRGcm9tTFZpZXcoaW5kZXggKyBIRUFERVJfT0ZGU0VULCBsVmlldyk7XG4gICAgc2V0Q2FjaGVkU3R5bGluZ0NvbnRleHQoY29udGV4dCk7XG4gIH0gZWxzZSBpZiAobmdEZXZNb2RlKSB7XG4gICAgY29uc3QgYWN0dWFsQ29udGV4dCA9IGdldFN0eWxpbmdDb250ZXh0RnJvbUxWaWV3KGluZGV4ICsgSEVBREVSX09GRlNFVCwgbFZpZXcpO1xuICAgIGFzc2VydEVxdWFsKGNvbnRleHQsIGFjdHVhbENvbnRleHQsICdUaGUgY2FjaGVkIHN0eWxpbmcgY29udGV4dCBpcyBpbnZhbGlkJyk7XG4gIH1cbiAgcmV0dXJuIGNvbnRleHQ7XG59XG4iXX0=