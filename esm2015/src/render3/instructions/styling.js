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
import { classMap as newClassMap, classProp as newClassProp, styleMap as newStyleMap, styleProp as newStyleProp, stylingApply as newStylingApply, stylingInit as newStylingInit } from '../styling_next/instructions';
import { runtimeAllowOldStyling, runtimeIsNewStylingInUse } from '../styling_next/state';
import { getBindingNameFromIndex } from '../styling_next/util';
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
export function ɵɵstyling(classBindingNames, styleBindingNames, styleSanitizer) {
    /** @type {?} */
    const tNode = getPreviousOrParentTNode();
    if (!tNode.stylingTemplate) {
        tNode.stylingTemplate = createEmptyStylingContext();
    }
    /** @type {?} */
    const directiveStylingIndex = getActiveDirectiveStylingIndex();
    if (directiveStylingIndex) {
        // this is temporary hack to get the existing styling instructions to
        // play ball with the new refactored implementation.
        // TODO (matsko): remove this once the old implementation is not needed.
        if (runtimeIsNewStylingInUse()) {
            newStylingInit();
        }
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
            initStyling(tNode, classBindingNames, styleBindingNames, styleSanitizer, directiveStylingIndex);
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
        initStyling(tNode, classBindingNames, styleBindingNames, styleSanitizer, DEFAULT_TEMPLATE_DIRECTIVE_INDEX);
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
function initStyling(tNode, classBindingNames, styleBindingNames, styleSanitizer, directiveStylingIndex) {
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
export function ɵɵstyleProp(styleIndex, value, suffix, forceOverride) {
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
    if (runtimeIsNewStylingInUse()) {
        /** @type {?} */
        const prop = getBindingNameFromIndex(stylingContext, styleIndex, directiveStylingIndex, false);
        // the reason why we cast the value as `boolean` is
        // because the new styling refactor does not yet support
        // sanitization or animation players.
        newStyleProp(prop, (/** @type {?} */ (value)), suffix);
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
export function ɵɵclassProp(classIndex, value, forceOverride) {
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
    if (runtimeIsNewStylingInUse()) {
        /** @type {?} */
        const prop = getBindingNameFromIndex(stylingContext, classIndex, directiveStylingIndex, true);
        // the reason why we cast the value as `boolean` is
        // because the new styling refactor does not yet support
        // sanitization or animation players.
        newClassProp(prop, (/** @type {?} */ (input)));
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
export function ɵɵstyleMap(styles) {
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
    if (runtimeIsNewStylingInUse()) {
        newStyleMap(styles);
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
export function ɵɵclassMap(classes) {
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
        if (hasClassInput(tNode)) {
            /** @type {?} */
            const initialClasses = getInitialClassNameValue(stylingContext);
            /** @type {?} */
            const classInputVal = (initialClasses.length ? (initialClasses + ' ') : '') + forceClassesAsString(classes);
            setInputsForProperty(lView, (/** @type {?} */ ((/** @type {?} */ (tNode.inputs))['class'])), classInputVal);
            classes = NO_CHANGE;
        }
        updateClassMap(stylingContext, classes);
    }
    if (runtimeIsNewStylingInUse()) {
        newClassMap(classes);
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
export function ɵɵstylingApply() {
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
    if (runtimeAllowOldStyling()) {
        /** @type {?} */
        const totalPlayersQueued = renderStyling(stylingContext, renderer, lView, isFirstRender, null, null, directiveStylingIndex);
        if (totalPlayersQueued > 0) {
            /** @type {?} */
            const rootContext = getRootContext(lView);
            scheduleTick(rootContext, 2 /* FlushPlayers */);
        }
    }
    // because select(n) may not run between every instruction, the cached styling
    // context may not get cleared between elements. The reason for this is because
    // styling bindings (like `[style]` and `[class]`) are not recognized as property
    // bindings by default so a select(n) instruction is not generated. To ensure the
    // context is loaded correctly for the next element the cache below is pre-emptively
    // cleared because there is no code in Angular that applies more styling code after a
    // styling flush has occurred. Note that this will be fixed once FW-1254 lands.
    setCachedStylingContext(null);
    if (runtimeIsNewStylingInUse()) {
        newStylingApply();
    }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3R5bGluZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaW5zdHJ1Y3Rpb25zL3N0eWxpbmcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7OztBQVFBLE9BQU8sRUFBQyxXQUFXLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUc5QyxPQUFPLEVBQUMsS0FBSyxFQUFFLGFBQWEsRUFBcUIsUUFBUSxFQUFtQixNQUFNLG9CQUFvQixDQUFDO0FBQ3ZHLE9BQU8sRUFBQyxvQkFBb0IsRUFBRSxpQ0FBaUMsRUFBRSxRQUFRLEVBQUUsd0JBQXdCLEVBQUUsZ0JBQWdCLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDdkksT0FBTyxFQUFDLHdCQUF3QixFQUFFLGFBQWEsRUFBRSxjQUFjLEVBQUUsZUFBZSxJQUFJLGVBQWUsRUFBRSx5QkFBeUIsRUFBRSxjQUFjLEVBQUUsZUFBZSxJQUFJLGVBQWUsRUFBQyxNQUFNLHFDQUFxQyxDQUFDO0FBQy9OLE9BQU8sRUFBVyxzQkFBc0IsRUFBRSxxQkFBcUIsRUFBQyxNQUFNLG9DQUFvQyxDQUFDO0FBQzNHLE9BQU8sRUFBQyxrQkFBa0IsRUFBQyxNQUFNLDJCQUEyQixDQUFDO0FBQzdELE9BQU8sRUFBQyxnQ0FBZ0MsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQ25FLE9BQU8sRUFBQyx1QkFBdUIsRUFBRSx1QkFBdUIsRUFBQyxNQUFNLGtCQUFrQixDQUFDO0FBQ2xGLE9BQU8sRUFBQyxvQ0FBb0MsRUFBRSx5QkFBeUIsRUFBRSxvQkFBb0IsRUFBRSxtQkFBbUIsRUFBRSwwQkFBMEIsRUFBRSxhQUFhLEVBQUUsYUFBYSxFQUFDLE1BQU0saUJBQWlCLENBQUM7QUFDck0sT0FBTyxFQUFDLFFBQVEsSUFBSSxXQUFXLEVBQUUsU0FBUyxJQUFJLFlBQVksRUFBRSxRQUFRLElBQUksV0FBVyxFQUFFLFNBQVMsSUFBSSxZQUFZLEVBQUUsWUFBWSxJQUFJLGVBQWUsRUFBRSxXQUFXLElBQUksY0FBYyxFQUFDLE1BQU0sOEJBQThCLENBQUM7QUFDcE4sT0FBTyxFQUFDLHNCQUFzQixFQUFFLHdCQUF3QixFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDdkYsT0FBTyxFQUFDLHVCQUF1QixFQUFDLE1BQU0sc0JBQXNCLENBQUM7QUFDN0QsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLFdBQVcsQ0FBQztBQUNwQyxPQUFPLEVBQUMsZUFBZSxFQUFDLE1BQU0sb0JBQW9CLENBQUM7QUFDbkQsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLDhCQUE4QixDQUFDO0FBQzVELE9BQU8sRUFBQyxRQUFRLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUU1QyxPQUFPLEVBQUMsWUFBWSxFQUFFLG9CQUFvQixFQUFDLE1BQU0sVUFBVSxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQXlDNUQsTUFBTSxVQUFVLFNBQVMsQ0FDckIsaUJBQW1DLEVBQUUsaUJBQW1DLEVBQ3hFLGNBQXVDOztVQUNuQyxLQUFLLEdBQUcsd0JBQXdCLEVBQUU7SUFDeEMsSUFBSSxDQUFDLEtBQUssQ0FBQyxlQUFlLEVBQUU7UUFDMUIsS0FBSyxDQUFDLGVBQWUsR0FBRyx5QkFBeUIsRUFBRSxDQUFDO0tBQ3JEOztVQUVLLHFCQUFxQixHQUFHLDhCQUE4QixFQUFFO0lBQzlELElBQUkscUJBQXFCLEVBQUU7UUFDekIscUVBQXFFO1FBQ3JFLG9EQUFvRDtRQUNwRCx3RUFBd0U7UUFDeEUsSUFBSSx3QkFBd0IsRUFBRSxFQUFFO1lBQzlCLGNBQWMsRUFBRSxDQUFDO1NBQ2xCO1FBRUQsdUVBQXVFO1FBQ3ZFLHVFQUF1RTtRQUN2RSx1RUFBdUU7UUFDdkUsdUNBQXVDO1FBQ3ZDLG9DQUFvQyxDQUFDLEtBQUssQ0FBQyxlQUFlLEVBQUUscUJBQXFCLENBQUMsQ0FBQzs7Y0FFN0UsR0FBRyxHQUFHLEtBQUssQ0FBQyxvQkFBb0IsR0FBRyxLQUFLLENBQUMsb0JBQW9CLElBQUksRUFBRTtRQUN6RSxHQUFHLENBQUMsSUFBSTs7O1FBQUMsR0FBRyxFQUFFO1lBQ1osV0FBVyxDQUNQLEtBQUssRUFBRSxpQkFBaUIsRUFBRSxpQkFBaUIsRUFBRSxjQUFjLEVBQUUscUJBQXFCLENBQUMsQ0FBQztZQUN4RixxQkFBcUIsQ0FBQyxtQkFBQSxLQUFLLENBQUMsZUFBZSxFQUFFLEVBQUUscUJBQXFCLENBQUMsQ0FBQztRQUN4RSxDQUFDLEVBQUMsQ0FBQztLQUNKO1NBQU07UUFDTCx3RUFBd0U7UUFDeEUsMEVBQTBFO1FBQzFFLHFFQUFxRTtRQUNyRSx1RUFBdUU7UUFDdkUsc0VBQXNFO1FBQ3RFLCtCQUErQjtRQUMvQixXQUFXLENBQ1AsS0FBSyxFQUFFLGlCQUFpQixFQUFFLGlCQUFpQixFQUFFLGNBQWMsRUFDM0QsZ0NBQWdDLENBQUMsQ0FBQztLQUN2QztBQUNILENBQUM7Ozs7Ozs7OztBQUVELFNBQVMsV0FBVyxDQUNoQixLQUFZLEVBQUUsaUJBQThDLEVBQzVELGlCQUE4QyxFQUM5QyxjQUFrRCxFQUFFLHFCQUE2QjtJQUNuRix5QkFBeUIsQ0FDckIsbUJBQUEsS0FBSyxDQUFDLGVBQWUsRUFBRSxFQUFFLHFCQUFxQixFQUFFLGlCQUFpQixFQUFFLGlCQUFpQixFQUNwRixjQUFjLENBQUMsQ0FBQztBQUN0QixDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUE0QkQsTUFBTSxVQUFVLFdBQVcsQ0FDdkIsVUFBa0IsRUFBRSxLQUFzRCxFQUMxRSxNQUFzQixFQUFFLGFBQXVCOztVQUMzQyxLQUFLLEdBQUcsZ0JBQWdCLEVBQUU7O1VBQzFCLFVBQVUsR0FBRyxxQkFBcUIsQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDOztVQUNqRCxjQUFjLEdBQUcsaUJBQWlCLENBQUMsS0FBSyxFQUFFLFFBQVEsRUFBRSxDQUFDOztVQUNyRCxxQkFBcUIsR0FBRyw4QkFBOEIsRUFBRTtJQUM5RCxJQUFJLHFCQUFxQixFQUFFOztjQUNuQixJQUFJLEdBQ04sQ0FBQyxjQUFjLEVBQUUsVUFBVSxFQUFFLFVBQVUsRUFBRSxxQkFBcUIsRUFBRSxhQUFhLENBQUM7UUFDbEYsc0JBQXNCLENBQUMsY0FBYyxFQUFFLHFCQUFxQixFQUFFLGVBQWUsRUFBRSxJQUFJLENBQUMsQ0FBQztLQUN0RjtTQUFNO1FBQ0wsZUFBZSxDQUNYLGNBQWMsRUFBRSxVQUFVLEVBQUUsVUFBVSxFQUFFLGdDQUFnQyxFQUFFLGFBQWEsQ0FBQyxDQUFDO0tBQzlGO0lBRUQsSUFBSSx3QkFBd0IsRUFBRSxFQUFFOztjQUN4QixJQUFJLEdBQUcsdUJBQXVCLENBQUMsY0FBYyxFQUFFLFVBQVUsRUFBRSxxQkFBcUIsRUFBRSxLQUFLLENBQUM7UUFFOUYsbURBQW1EO1FBQ25ELHdEQUF3RDtRQUN4RCxxQ0FBcUM7UUFDckMsWUFBWSxDQUFDLElBQUksRUFBRSxtQkFBQSxLQUFLLEVBQW1CLEVBQUUsTUFBTSxDQUFDLENBQUM7S0FDdEQ7QUFDSCxDQUFDOzs7Ozs7QUFFRCxTQUFTLHFCQUFxQixDQUMxQixLQUFzRCxFQUFFLE1BQWlDOztRQUN2RixVQUFVLEdBQWdCLElBQUk7SUFDbEMsSUFBSSxLQUFLLEtBQUssSUFBSSxFQUFFO1FBQ2xCLElBQUksTUFBTSxFQUFFO1lBQ1YsK0NBQStDO1lBQy9DLHNEQUFzRDtZQUN0RCxVQUFVLEdBQUcsZUFBZSxDQUFDLEtBQUssQ0FBQyxHQUFHLE1BQU0sQ0FBQztTQUM5QzthQUFNO1lBQ0wsc0RBQXNEO1lBQ3RELDBEQUEwRDtZQUMxRCwyREFBMkQ7WUFDM0QsMENBQTBDO1lBQzFDLFVBQVUsR0FBRyxtQkFBQSxtQkFBQSxLQUFLLEVBQU8sRUFBVSxDQUFDO1NBQ3JDO0tBQ0Y7SUFDRCxPQUFPLFVBQVUsQ0FBQztBQUNwQixDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBdUJELE1BQU0sVUFBVSxXQUFXLENBQ3ZCLFVBQWtCLEVBQUUsS0FBOEIsRUFBRSxhQUF1Qjs7VUFDdkUsS0FBSyxHQUFHLGdCQUFnQixFQUFFOztVQUMxQixLQUFLLEdBQUcsQ0FBQyxLQUFLLFlBQVksa0JBQWtCLENBQUMsQ0FBQyxDQUFDO1FBQ2pELENBQUMsbUJBQUEsS0FBSyxFQUFvQyxDQUFDLENBQUMsQ0FBQztRQUM3QyxhQUFhLENBQUMsS0FBSyxDQUFDOztVQUNsQixxQkFBcUIsR0FBRyw4QkFBOEIsRUFBRTs7VUFDeEQsY0FBYyxHQUFHLGlCQUFpQixDQUFDLEtBQUssRUFBRSxRQUFRLEVBQUUsQ0FBQztJQUMzRCxJQUFJLHFCQUFxQixFQUFFOztjQUNuQixJQUFJLEdBQ04sQ0FBQyxjQUFjLEVBQUUsVUFBVSxFQUFFLEtBQUssRUFBRSxxQkFBcUIsRUFBRSxhQUFhLENBQUM7UUFDN0Usc0JBQXNCLENBQUMsY0FBYyxFQUFFLHFCQUFxQixFQUFFLGVBQWUsRUFBRSxJQUFJLENBQUMsQ0FBQztLQUN0RjtTQUFNO1FBQ0wsZUFBZSxDQUNYLGNBQWMsRUFBRSxVQUFVLEVBQUUsS0FBSyxFQUFFLGdDQUFnQyxFQUFFLGFBQWEsQ0FBQyxDQUFDO0tBQ3pGO0lBRUQsSUFBSSx3QkFBd0IsRUFBRSxFQUFFOztjQUN4QixJQUFJLEdBQUcsdUJBQXVCLENBQUMsY0FBYyxFQUFFLFVBQVUsRUFBRSxxQkFBcUIsRUFBRSxJQUFJLENBQUM7UUFFN0YsbURBQW1EO1FBQ25ELHdEQUF3RDtRQUN4RCxxQ0FBcUM7UUFDckMsWUFBWSxDQUFDLElBQUksRUFBRSxtQkFBQSxLQUFLLEVBQVcsQ0FBQyxDQUFDO0tBQ3RDO0FBQ0gsQ0FBQzs7Ozs7QUFHRCxTQUFTLGFBQWEsQ0FBQyxLQUFVO0lBQy9CLElBQUksT0FBTyxLQUFLLEtBQUssU0FBUztRQUFFLE9BQU8sS0FBSyxDQUFDO0lBQzdDLE9BQU8sS0FBSyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztBQUM3QixDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFzQkQsTUFBTSxVQUFVLFVBQVUsQ0FBQyxNQUFxRDs7VUFDeEUsS0FBSyxHQUFHLGdCQUFnQixFQUFFOztVQUMxQixLQUFLLEdBQUcsUUFBUSxFQUFFOztVQUNsQixjQUFjLEdBQUcsaUJBQWlCLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQzs7VUFDaEQscUJBQXFCLEdBQUcsOEJBQThCLEVBQUU7SUFDOUQsSUFBSSxxQkFBcUIsRUFBRTs7Y0FDbkIsSUFBSSxHQUFvQyxDQUFDLGNBQWMsRUFBRSxNQUFNLEVBQUUscUJBQXFCLENBQUM7UUFDN0Ysc0JBQXNCLENBQUMsY0FBYyxFQUFFLHFCQUFxQixFQUFFLGNBQWMsRUFBRSxJQUFJLENBQUMsQ0FBQztLQUNyRjtTQUFNOztjQUNDLEtBQUssR0FBRyxRQUFRLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQztRQUVwQyxpRkFBaUY7UUFDakYsMkVBQTJFO1FBQzNFLDBFQUEwRTtRQUMxRSxJQUFJLGFBQWEsQ0FBQyxLQUFLLENBQUMsSUFBSSxNQUFNLEtBQUssU0FBUyxFQUFFOztrQkFDMUMsYUFBYSxHQUFHLHdCQUF3QixDQUFDLGNBQWMsQ0FBQzs7a0JBQ3hELGFBQWEsR0FDZixDQUFDLGFBQWEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsYUFBYSxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxtQkFBbUIsQ0FBQyxNQUFNLENBQUM7WUFDckYsb0JBQW9CLENBQUMsS0FBSyxFQUFFLG1CQUFBLG1CQUFBLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxPQUFPLENBQUMsRUFBRSxFQUFFLGFBQWEsQ0FBQyxDQUFDO1lBQ3RFLE1BQU0sR0FBRyxTQUFTLENBQUM7U0FDcEI7UUFDRCxjQUFjLENBQUMsY0FBYyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0tBQ3hDO0lBRUQsSUFBSSx3QkFBd0IsRUFBRSxFQUFFO1FBQzlCLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQztLQUNyQjtBQUNILENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBcUJELE1BQU0sVUFBVSxVQUFVLENBQUMsT0FBbUQ7O1VBQ3RFLEtBQUssR0FBRyxnQkFBZ0IsRUFBRTs7VUFDMUIsS0FBSyxHQUFHLFFBQVEsRUFBRTs7VUFDbEIsY0FBYyxHQUFHLGlCQUFpQixDQUFDLEtBQUssRUFBRSxLQUFLLENBQUM7O1VBQ2hELHFCQUFxQixHQUFHLDhCQUE4QixFQUFFO0lBQzlELElBQUkscUJBQXFCLEVBQUU7O2NBQ25CLElBQUksR0FBb0MsQ0FBQyxjQUFjLEVBQUUsT0FBTyxFQUFFLHFCQUFxQixDQUFDO1FBQzlGLHNCQUFzQixDQUFDLGNBQWMsRUFBRSxxQkFBcUIsRUFBRSxjQUFjLEVBQUUsSUFBSSxDQUFDLENBQUM7S0FDckY7U0FBTTs7Y0FDQyxLQUFLLEdBQUcsUUFBUSxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUM7UUFDcEMsaUZBQWlGO1FBQ2pGLDJFQUEyRTtRQUMzRSwwRUFBMEU7UUFDMUUsSUFBSSxhQUFhLENBQUMsS0FBSyxDQUFDLEVBQUU7O2tCQUNsQixjQUFjLEdBQUcsd0JBQXdCLENBQUMsY0FBYyxDQUFDOztrQkFDekQsYUFBYSxHQUNmLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxjQUFjLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLG9CQUFvQixDQUFDLE9BQU8sQ0FBQztZQUN6RixvQkFBb0IsQ0FBQyxLQUFLLEVBQUUsbUJBQUEsbUJBQUEsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDLE9BQU8sQ0FBQyxFQUFFLEVBQUUsYUFBYSxDQUFDLENBQUM7WUFDdEUsT0FBTyxHQUFHLFNBQVMsQ0FBQztTQUNyQjtRQUNELGNBQWMsQ0FBQyxjQUFjLEVBQUUsT0FBTyxDQUFDLENBQUM7S0FDekM7SUFFRCxJQUFJLHdCQUF3QixFQUFFLEVBQUU7UUFDOUIsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0tBQ3RCO0FBQ0gsQ0FBQzs7Ozs7Ozs7Ozs7QUFXRCxNQUFNLFVBQVUsY0FBYzs7VUFDdEIsS0FBSyxHQUFHLGdCQUFnQixFQUFFOztVQUMxQixxQkFBcUIsR0FDdkIsOEJBQThCLEVBQUUsSUFBSSxnQ0FBZ0M7O1VBQ2xFLEtBQUssR0FBRyxRQUFRLEVBQUU7O1VBQ2xCLEtBQUssR0FBRyxRQUFRLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQzs7Ozs7VUFLOUIsUUFBUSxHQUFHLEtBQUssQ0FBQyxJQUFJLG9CQUFzQixDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUk7O1VBQ3BFLGFBQWEsR0FBRyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMseUJBQTRCLENBQUMsS0FBSyxDQUFDOztVQUNoRSxjQUFjLEdBQUcsaUJBQWlCLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQztJQUV0RCxJQUFJLHNCQUFzQixFQUFFLEVBQUU7O2NBQ3RCLGtCQUFrQixHQUFHLGFBQWEsQ0FDcEMsY0FBYyxFQUFFLFFBQVEsRUFBRSxLQUFLLEVBQUUsYUFBYSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUscUJBQXFCLENBQUM7UUFDdEYsSUFBSSxrQkFBa0IsR0FBRyxDQUFDLEVBQUU7O2tCQUNwQixXQUFXLEdBQUcsY0FBYyxDQUFDLEtBQUssQ0FBQztZQUN6QyxZQUFZLENBQUMsV0FBVyx1QkFBZ0MsQ0FBQztTQUMxRDtLQUNGO0lBRUQsOEVBQThFO0lBQzlFLCtFQUErRTtJQUMvRSxpRkFBaUY7SUFDakYsaUZBQWlGO0lBQ2pGLG9GQUFvRjtJQUNwRixxRkFBcUY7SUFDckYsK0VBQStFO0lBQy9FLHVCQUF1QixDQUFDLElBQUksQ0FBQyxDQUFDO0lBRTlCLElBQUksd0JBQXdCLEVBQUUsRUFBRTtRQUM5QixlQUFlLEVBQUUsQ0FBQztLQUNuQjtBQUNILENBQUM7Ozs7QUFFRCxNQUFNLFVBQVUsOEJBQThCO0lBQzVDLDBFQUEwRTtJQUMxRSx5RUFBeUU7SUFDekUseUVBQXlFO0lBQ3pFLHlFQUF5RTtJQUN6RSwwRUFBMEU7SUFDMUUsNkVBQTZFO0lBQzdFLE9BQU8sb0JBQW9CLEVBQUUsR0FBRyxpQ0FBaUMsRUFBRSxDQUFDO0FBQ3RFLENBQUM7Ozs7OztBQUVELFNBQVMsaUJBQWlCLENBQUMsS0FBYSxFQUFFLEtBQVk7O1FBQ2hELE9BQU8sR0FBRyx1QkFBdUIsRUFBRTtJQUN2QyxJQUFJLENBQUMsT0FBTyxFQUFFO1FBQ1osT0FBTyxHQUFHLDBCQUEwQixDQUFDLEtBQUssR0FBRyxhQUFhLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDbkUsdUJBQXVCLENBQUMsT0FBTyxDQUFDLENBQUM7S0FDbEM7U0FBTSxJQUFJLFNBQVMsRUFBRTs7Y0FDZCxhQUFhLEdBQUcsMEJBQTBCLENBQUMsS0FBSyxHQUFHLGFBQWEsRUFBRSxLQUFLLENBQUM7UUFDOUUsV0FBVyxDQUFDLE9BQU8sRUFBRSxhQUFhLEVBQUUsdUNBQXVDLENBQUMsQ0FBQztLQUM5RTtJQUNELE9BQU8sT0FBTyxDQUFDO0FBQ2pCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5pbXBvcnQge1N0eWxlU2FuaXRpemVGbn0gZnJvbSAnLi4vLi4vc2FuaXRpemF0aW9uL3N0eWxlX3Nhbml0aXplcic7XG5pbXBvcnQge2Fzc2VydEVxdWFsfSBmcm9tICcuLi8uLi91dGlsL2Fzc2VydCc7XG5pbXBvcnQge1ROb2RlLCBUTm9kZVR5cGV9IGZyb20gJy4uL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge1BsYXllckZhY3Rvcnl9IGZyb20gJy4uL2ludGVyZmFjZXMvcGxheWVyJztcbmltcG9ydCB7RkxBR1MsIEhFQURFUl9PRkZTRVQsIExWaWV3LCBMVmlld0ZsYWdzLCBSRU5ERVJFUiwgUm9vdENvbnRleHRGbGFnc30gZnJvbSAnLi4vaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7Z2V0QWN0aXZlRGlyZWN0aXZlSWQsIGdldEFjdGl2ZURpcmVjdGl2ZVN1cGVyQ2xhc3NEZXB0aCwgZ2V0TFZpZXcsIGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSwgZ2V0U2VsZWN0ZWRJbmRleH0gZnJvbSAnLi4vc3RhdGUnO1xuaW1wb3J0IHtnZXRJbml0aWFsQ2xhc3NOYW1lVmFsdWUsIHJlbmRlclN0eWxpbmcsIHVwZGF0ZUNsYXNzTWFwLCB1cGRhdGVDbGFzc1Byb3AgYXMgdXBkYXRlY2xhc3NQcm9wLCB1cGRhdGVDb250ZXh0V2l0aEJpbmRpbmdzLCB1cGRhdGVTdHlsZU1hcCwgdXBkYXRlU3R5bGVQcm9wIGFzIHVwZGF0ZXN0eWxlUHJvcH0gZnJvbSAnLi4vc3R5bGluZy9jbGFzc19hbmRfc3R5bGVfYmluZGluZ3MnO1xuaW1wb3J0IHtQYXJhbXNPZiwgZW5xdWV1ZUhvc3RJbnN0cnVjdGlvbiwgcmVnaXN0ZXJIb3N0RGlyZWN0aXZlfSBmcm9tICcuLi9zdHlsaW5nL2hvc3RfaW5zdHJ1Y3Rpb25zX3F1ZXVlJztcbmltcG9ydCB7Qm91bmRQbGF5ZXJGYWN0b3J5fSBmcm9tICcuLi9zdHlsaW5nL3BsYXllcl9mYWN0b3J5JztcbmltcG9ydCB7REVGQVVMVF9URU1QTEFURV9ESVJFQ1RJVkVfSU5ERVh9IGZyb20gJy4uL3N0eWxpbmcvc2hhcmVkJztcbmltcG9ydCB7Z2V0Q2FjaGVkU3R5bGluZ0NvbnRleHQsIHNldENhY2hlZFN0eWxpbmdDb250ZXh0fSBmcm9tICcuLi9zdHlsaW5nL3N0YXRlJztcbmltcG9ydCB7YWxsb2NhdGVPclVwZGF0ZURpcmVjdGl2ZUludG9Db250ZXh0LCBjcmVhdGVFbXB0eVN0eWxpbmdDb250ZXh0LCBmb3JjZUNsYXNzZXNBc1N0cmluZywgZm9yY2VTdHlsZXNBc1N0cmluZywgZ2V0U3R5bGluZ0NvbnRleHRGcm9tTFZpZXcsIGhhc0NsYXNzSW5wdXQsIGhhc1N0eWxlSW5wdXR9IGZyb20gJy4uL3N0eWxpbmcvdXRpbCc7XG5pbXBvcnQge2NsYXNzTWFwIGFzIG5ld0NsYXNzTWFwLCBjbGFzc1Byb3AgYXMgbmV3Q2xhc3NQcm9wLCBzdHlsZU1hcCBhcyBuZXdTdHlsZU1hcCwgc3R5bGVQcm9wIGFzIG5ld1N0eWxlUHJvcCwgc3R5bGluZ0FwcGx5IGFzIG5ld1N0eWxpbmdBcHBseSwgc3R5bGluZ0luaXQgYXMgbmV3U3R5bGluZ0luaXR9IGZyb20gJy4uL3N0eWxpbmdfbmV4dC9pbnN0cnVjdGlvbnMnO1xuaW1wb3J0IHtydW50aW1lQWxsb3dPbGRTdHlsaW5nLCBydW50aW1lSXNOZXdTdHlsaW5nSW5Vc2V9IGZyb20gJy4uL3N0eWxpbmdfbmV4dC9zdGF0ZSc7XG5pbXBvcnQge2dldEJpbmRpbmdOYW1lRnJvbUluZGV4fSBmcm9tICcuLi9zdHlsaW5nX25leHQvdXRpbCc7XG5pbXBvcnQge05PX0NIQU5HRX0gZnJvbSAnLi4vdG9rZW5zJztcbmltcG9ydCB7cmVuZGVyU3RyaW5naWZ5fSBmcm9tICcuLi91dGlsL21pc2NfdXRpbHMnO1xuaW1wb3J0IHtnZXRSb290Q29udGV4dH0gZnJvbSAnLi4vdXRpbC92aWV3X3RyYXZlcnNhbF91dGlscyc7XG5pbXBvcnQge2dldFROb2RlfSBmcm9tICcuLi91dGlsL3ZpZXdfdXRpbHMnO1xuXG5pbXBvcnQge3NjaGVkdWxlVGljaywgc2V0SW5wdXRzRm9yUHJvcGVydHl9IGZyb20gJy4vc2hhcmVkJztcblxuXG5cbi8qXG4gKiBUaGUgY29udGVudHMgb2YgdGhpcyBmaWxlIGluY2x1ZGUgdGhlIGluc3RydWN0aW9ucyBmb3IgYWxsIHN0eWxpbmctcmVsYXRlZFxuICogb3BlcmF0aW9ucyBpbiBBbmd1bGFyLlxuICpcbiAqIFRoZSBpbnN0cnVjdGlvbnMgcHJlc2VudCBpbiB0aGlzIGZpbGUgYXJlOlxuICpcbiAqIFRlbXBsYXRlIGxldmVsIHN0eWxpbmcgaW5zdHJ1Y3Rpb25zOlxuICogLSBzdHlsaW5nXG4gKiAtIHN0eWxlTWFwXG4gKiAtIGNsYXNzTWFwXG4gKiAtIHN0eWxlUHJvcFxuICogLSBjbGFzc1Byb3BcbiAqIC0gc3R5bGluZ0FwcGx5XG4gKi9cblxuLyoqXG4gKiBBbGxvY2F0ZXMgc3R5bGUgYW5kIGNsYXNzIGJpbmRpbmcgcHJvcGVydGllcyBvbiB0aGUgZWxlbWVudCBkdXJpbmcgY3JlYXRpb24gbW9kZS5cbiAqXG4gKiBUaGlzIGluc3RydWN0aW9uIGlzIG1lYW50IHRvIGJlIGNhbGxlZCBkdXJpbmcgY3JlYXRpb24gbW9kZSB0byByZWdpc3RlciBhbGxcbiAqIGR5bmFtaWMgc3R5bGUgYW5kIGNsYXNzIGJpbmRpbmdzIG9uIHRoZSBlbGVtZW50LiBOb3RlIHRoYXQgdGhpcyBpcyBvbmx5IHVzZWRcbiAqIGZvciBiaW5kaW5nIHZhbHVlcyAoc2VlIGBlbGVtZW50U3RhcnRgIHRvIGxlYXJuIGhvdyB0byBhc3NpZ24gc3RhdGljIHN0eWxpbmdcbiAqIHZhbHVlcyB0byBhbiBlbGVtZW50KS5cbiAqXG4gKiBAcGFyYW0gY2xhc3NCaW5kaW5nTmFtZXMgQW4gYXJyYXkgY29udGFpbmluZyBiaW5kYWJsZSBjbGFzcyBuYW1lcy5cbiAqICAgICAgICBUaGUgYGNsYXNzUHJvcGAgaW5zdHJ1Y3Rpb24gcmVmZXJzIHRvIHRoZSBjbGFzcyBuYW1lIGJ5IGluZGV4IGluXG4gKiAgICAgICAgdGhpcyBhcnJheSAoaS5lLiBgWydmb28nLCAnYmFyJ11gIG1lYW5zIGBmb289MGAgYW5kIGBiYXI9MWApLlxuICogQHBhcmFtIHN0eWxlQmluZGluZ05hbWVzIEFuIGFycmF5IGNvbnRhaW5pbmcgYmluZGFibGUgc3R5bGUgcHJvcGVydGllcy5cbiAqICAgICAgICBUaGUgYHN0eWxlUHJvcGAgaW5zdHJ1Y3Rpb24gcmVmZXJzIHRvIHRoZSBjbGFzcyBuYW1lIGJ5IGluZGV4IGluXG4gKiAgICAgICAgdGhpcyBhcnJheSAoaS5lLiBgWyd3aWR0aCcsICdoZWlnaHQnXWAgbWVhbnMgYHdpZHRoPTBgIGFuZCBgaGVpZ2h0PTFgKS5cbiAqIEBwYXJhbSBzdHlsZVNhbml0aXplciBBbiBvcHRpb25hbCBzYW5pdGl6ZXIgZnVuY3Rpb24gdGhhdCB3aWxsIGJlIHVzZWQgdG8gc2FuaXRpemUgYW55IENTU1xuICogICAgICAgIHN0eWxlIHZhbHVlcyB0aGF0IGFyZSBhcHBsaWVkIHRvIHRoZSBlbGVtZW50IChkdXJpbmcgcmVuZGVyaW5nKS5cbiAqXG4gKiBOb3RlIHRoYXQgdGhpcyB3aWxsIGFsbG9jYXRlIHRoZSBwcm92aWRlZCBzdHlsZS9jbGFzcyBiaW5kaW5ncyB0byB0aGUgaG9zdCBlbGVtZW50IGlmXG4gKiB0aGlzIGZ1bmN0aW9uIGlzIGNhbGxlZCB3aXRoaW4gYSBob3N0IGJpbmRpbmcuXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVzdHlsaW5nKFxuICAgIGNsYXNzQmluZGluZ05hbWVzPzogc3RyaW5nW10gfCBudWxsLCBzdHlsZUJpbmRpbmdOYW1lcz86IHN0cmluZ1tdIHwgbnVsbCxcbiAgICBzdHlsZVNhbml0aXplcj86IFN0eWxlU2FuaXRpemVGbiB8IG51bGwpOiB2b2lkIHtcbiAgY29uc3QgdE5vZGUgPSBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKTtcbiAgaWYgKCF0Tm9kZS5zdHlsaW5nVGVtcGxhdGUpIHtcbiAgICB0Tm9kZS5zdHlsaW5nVGVtcGxhdGUgPSBjcmVhdGVFbXB0eVN0eWxpbmdDb250ZXh0KCk7XG4gIH1cblxuICBjb25zdCBkaXJlY3RpdmVTdHlsaW5nSW5kZXggPSBnZXRBY3RpdmVEaXJlY3RpdmVTdHlsaW5nSW5kZXgoKTtcbiAgaWYgKGRpcmVjdGl2ZVN0eWxpbmdJbmRleCkge1xuICAgIC8vIHRoaXMgaXMgdGVtcG9yYXJ5IGhhY2sgdG8gZ2V0IHRoZSBleGlzdGluZyBzdHlsaW5nIGluc3RydWN0aW9ucyB0b1xuICAgIC8vIHBsYXkgYmFsbCB3aXRoIHRoZSBuZXcgcmVmYWN0b3JlZCBpbXBsZW1lbnRhdGlvbi5cbiAgICAvLyBUT0RPIChtYXRza28pOiByZW1vdmUgdGhpcyBvbmNlIHRoZSBvbGQgaW1wbGVtZW50YXRpb24gaXMgbm90IG5lZWRlZC5cbiAgICBpZiAocnVudGltZUlzTmV3U3R5bGluZ0luVXNlKCkpIHtcbiAgICAgIG5ld1N0eWxpbmdJbml0KCk7XG4gICAgfVxuXG4gICAgLy8gZGVzcGl0ZSB0aGUgYmluZGluZyBiZWluZyBhcHBsaWVkIGluIGEgcXVldWUgKGJlbG93KSwgdGhlIGFsbG9jYXRpb25cbiAgICAvLyBvZiB0aGUgZGlyZWN0aXZlIGludG8gdGhlIGNvbnRleHQgaGFwcGVucyByaWdodCBhd2F5LiBUaGUgcmVhc29uIGZvclxuICAgIC8vIHRoaXMgaXMgdG8gcmV0YWluIHRoZSBvcmRlcmluZyBvZiB0aGUgZGlyZWN0aXZlcyAod2hpY2ggaXMgaW1wb3J0YW50XG4gICAgLy8gZm9yIHRoZSBwcmlvcml0aXphdGlvbiBvZiBiaW5kaW5ncykuXG4gICAgYWxsb2NhdGVPclVwZGF0ZURpcmVjdGl2ZUludG9Db250ZXh0KHROb2RlLnN0eWxpbmdUZW1wbGF0ZSwgZGlyZWN0aXZlU3R5bGluZ0luZGV4KTtcblxuICAgIGNvbnN0IGZucyA9IHROb2RlLm9uRWxlbWVudENyZWF0aW9uRm5zID0gdE5vZGUub25FbGVtZW50Q3JlYXRpb25GbnMgfHwgW107XG4gICAgZm5zLnB1c2goKCkgPT4ge1xuICAgICAgaW5pdFN0eWxpbmcoXG4gICAgICAgICAgdE5vZGUsIGNsYXNzQmluZGluZ05hbWVzLCBzdHlsZUJpbmRpbmdOYW1lcywgc3R5bGVTYW5pdGl6ZXIsIGRpcmVjdGl2ZVN0eWxpbmdJbmRleCk7XG4gICAgICByZWdpc3Rlckhvc3REaXJlY3RpdmUodE5vZGUuc3R5bGluZ1RlbXBsYXRlICEsIGRpcmVjdGl2ZVN0eWxpbmdJbmRleCk7XG4gICAgfSk7XG4gIH0gZWxzZSB7XG4gICAgLy8gY2FsbGluZyB0aGUgZnVuY3Rpb24gYmVsb3cgZW5zdXJlcyB0aGF0IHRoZSB0ZW1wbGF0ZSdzIGJpbmRpbmcgdmFsdWVzXG4gICAgLy8gYXJlIGFwcGxpZWQgYXMgdGhlIGZpcnN0IHNldCBvZiBiaW5kaW5ncyBpbnRvIHRoZSBjb250ZXh0LiBJZiBhbnkgb3RoZXJcbiAgICAvLyBzdHlsaW5nIGJpbmRpbmdzIGFyZSBzZXQgb24gdGhlIHNhbWUgZWxlbWVudCAoYnkgZGlyZWN0aXZlcyBhbmQvb3JcbiAgICAvLyBjb21wb25lbnRzKSB0aGVuIHRoZXkgd2lsbCBiZSBhcHBsaWVkIGF0IHRoZSBlbmQgb2YgdGhlIGBlbGVtZW50RW5kYFxuICAgIC8vIGluc3RydWN0aW9uIChiZWNhdXNlIGRpcmVjdGl2ZXMgYXJlIGNyZWF0ZWQgZmlyc3QgYmVmb3JlIHN0eWxpbmcgaXNcbiAgICAvLyBleGVjdXRlZCBmb3IgYSBuZXcgZWxlbWVudCkuXG4gICAgaW5pdFN0eWxpbmcoXG4gICAgICAgIHROb2RlLCBjbGFzc0JpbmRpbmdOYW1lcywgc3R5bGVCaW5kaW5nTmFtZXMsIHN0eWxlU2FuaXRpemVyLFxuICAgICAgICBERUZBVUxUX1RFTVBMQVRFX0RJUkVDVElWRV9JTkRFWCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gaW5pdFN0eWxpbmcoXG4gICAgdE5vZGU6IFROb2RlLCBjbGFzc0JpbmRpbmdOYW1lczogc3RyaW5nW10gfCBudWxsIHwgdW5kZWZpbmVkLFxuICAgIHN0eWxlQmluZGluZ05hbWVzOiBzdHJpbmdbXSB8IG51bGwgfCB1bmRlZmluZWQsXG4gICAgc3R5bGVTYW5pdGl6ZXI6IFN0eWxlU2FuaXRpemVGbiB8IG51bGwgfCB1bmRlZmluZWQsIGRpcmVjdGl2ZVN0eWxpbmdJbmRleDogbnVtYmVyKTogdm9pZCB7XG4gIHVwZGF0ZUNvbnRleHRXaXRoQmluZGluZ3MoXG4gICAgICB0Tm9kZS5zdHlsaW5nVGVtcGxhdGUgISwgZGlyZWN0aXZlU3R5bGluZ0luZGV4LCBjbGFzc0JpbmRpbmdOYW1lcywgc3R5bGVCaW5kaW5nTmFtZXMsXG4gICAgICBzdHlsZVNhbml0aXplcik7XG59XG5cblxuLyoqXG4gKiBVcGRhdGUgYSBzdHlsZSBiaW5kaW5nIG9uIGFuIGVsZW1lbnQgd2l0aCB0aGUgcHJvdmlkZWQgdmFsdWUuXG4gKlxuICogSWYgdGhlIHN0eWxlIHZhbHVlIGlzIGZhbHN5IHRoZW4gaXQgd2lsbCBiZSByZW1vdmVkIGZyb20gdGhlIGVsZW1lbnRcbiAqIChvciBhc3NpZ25lZCBhIGRpZmZlcmVudCB2YWx1ZSBkZXBlbmRpbmcgaWYgdGhlcmUgYXJlIGFueSBzdHlsZXMgcGxhY2VkXG4gKiBvbiB0aGUgZWxlbWVudCB3aXRoIGBzdHlsZU1hcGAgb3IgYW55IHN0YXRpYyBzdHlsZXMgdGhhdCBhcmVcbiAqIHByZXNlbnQgZnJvbSB3aGVuIHRoZSBlbGVtZW50IHdhcyBjcmVhdGVkIHdpdGggYHN0eWxpbmdgKS5cbiAqXG4gKiBOb3RlIHRoYXQgdGhlIHN0eWxpbmcgZWxlbWVudCBpcyB1cGRhdGVkIGFzIHBhcnQgb2YgYHN0eWxpbmdBcHBseWAuXG4gKlxuICogQHBhcmFtIHN0eWxlSW5kZXggSW5kZXggb2Ygc3R5bGUgdG8gdXBkYXRlLiBUaGlzIGluZGV4IHZhbHVlIHJlZmVycyB0byB0aGVcbiAqICAgICAgICBpbmRleCBvZiB0aGUgc3R5bGUgaW4gdGhlIHN0eWxlIGJpbmRpbmdzIGFycmF5IHRoYXQgd2FzIHBhc3NlZCBpbnRvXG4gKiAgICAgICAgYHN0eWxpbmdgLlxuICogQHBhcmFtIHZhbHVlIE5ldyB2YWx1ZSB0byB3cml0ZSAoZmFsc3kgdG8gcmVtb3ZlKS5cbiAqIEBwYXJhbSBzdWZmaXggT3B0aW9uYWwgc3VmZml4LiBVc2VkIHdpdGggc2NhbGFyIHZhbHVlcyB0byBhZGQgdW5pdCBzdWNoIGFzIGBweGAuXG4gKiAgICAgICAgTm90ZSB0aGF0IHdoZW4gYSBzdWZmaXggaXMgcHJvdmlkZWQgdGhlbiB0aGUgdW5kZXJseWluZyBzYW5pdGl6ZXIgd2lsbFxuICogICAgICAgIGJlIGlnbm9yZWQuXG4gKiBAcGFyYW0gZm9yY2VPdmVycmlkZSBXaGV0aGVyIG9yIG5vdCB0byB1cGRhdGUgdGhlIHN0eWxpbmcgdmFsdWUgaW1tZWRpYXRlbHlcbiAqICAgICAgICAoZGVzcGl0ZSB0aGUgb3RoZXIgYmluZGluZ3MgcG9zc2libHkgaGF2aW5nIHByaW9yaXR5KVxuICpcbiAqIE5vdGUgdGhhdCB0aGlzIHdpbGwgYXBwbHkgdGhlIHByb3ZpZGVkIHN0eWxlIHZhbHVlIHRvIHRoZSBob3N0IGVsZW1lbnQgaWYgdGhpcyBmdW5jdGlvbiBpcyBjYWxsZWRcbiAqIHdpdGhpbiBhIGhvc3QgYmluZGluZy5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtXN0eWxlUHJvcChcbiAgICBzdHlsZUluZGV4OiBudW1iZXIsIHZhbHVlOiBzdHJpbmcgfCBudW1iZXIgfCBTdHJpbmcgfCBQbGF5ZXJGYWN0b3J5IHwgbnVsbCxcbiAgICBzdWZmaXg/OiBzdHJpbmcgfCBudWxsLCBmb3JjZU92ZXJyaWRlPzogYm9vbGVhbik6IHZvaWQge1xuICBjb25zdCBpbmRleCA9IGdldFNlbGVjdGVkSW5kZXgoKTtcbiAgY29uc3QgdmFsdWVUb0FkZCA9IHJlc29sdmVTdHlsZVByb3BWYWx1ZSh2YWx1ZSwgc3VmZml4KTtcbiAgY29uc3Qgc3R5bGluZ0NvbnRleHQgPSBnZXRTdHlsaW5nQ29udGV4dChpbmRleCwgZ2V0TFZpZXcoKSk7XG4gIGNvbnN0IGRpcmVjdGl2ZVN0eWxpbmdJbmRleCA9IGdldEFjdGl2ZURpcmVjdGl2ZVN0eWxpbmdJbmRleCgpO1xuICBpZiAoZGlyZWN0aXZlU3R5bGluZ0luZGV4KSB7XG4gICAgY29uc3QgYXJnczogUGFyYW1zT2Y8dHlwZW9mIHVwZGF0ZXN0eWxlUHJvcD4gPVxuICAgICAgICBbc3R5bGluZ0NvbnRleHQsIHN0eWxlSW5kZXgsIHZhbHVlVG9BZGQsIGRpcmVjdGl2ZVN0eWxpbmdJbmRleCwgZm9yY2VPdmVycmlkZV07XG4gICAgZW5xdWV1ZUhvc3RJbnN0cnVjdGlvbihzdHlsaW5nQ29udGV4dCwgZGlyZWN0aXZlU3R5bGluZ0luZGV4LCB1cGRhdGVzdHlsZVByb3AsIGFyZ3MpO1xuICB9IGVsc2Uge1xuICAgIHVwZGF0ZXN0eWxlUHJvcChcbiAgICAgICAgc3R5bGluZ0NvbnRleHQsIHN0eWxlSW5kZXgsIHZhbHVlVG9BZGQsIERFRkFVTFRfVEVNUExBVEVfRElSRUNUSVZFX0lOREVYLCBmb3JjZU92ZXJyaWRlKTtcbiAgfVxuXG4gIGlmIChydW50aW1lSXNOZXdTdHlsaW5nSW5Vc2UoKSkge1xuICAgIGNvbnN0IHByb3AgPSBnZXRCaW5kaW5nTmFtZUZyb21JbmRleChzdHlsaW5nQ29udGV4dCwgc3R5bGVJbmRleCwgZGlyZWN0aXZlU3R5bGluZ0luZGV4LCBmYWxzZSk7XG5cbiAgICAvLyB0aGUgcmVhc29uIHdoeSB3ZSBjYXN0IHRoZSB2YWx1ZSBhcyBgYm9vbGVhbmAgaXNcbiAgICAvLyBiZWNhdXNlIHRoZSBuZXcgc3R5bGluZyByZWZhY3RvciBkb2VzIG5vdCB5ZXQgc3VwcG9ydFxuICAgIC8vIHNhbml0aXphdGlvbiBvciBhbmltYXRpb24gcGxheWVycy5cbiAgICBuZXdTdHlsZVByb3AocHJvcCwgdmFsdWUgYXMgc3RyaW5nIHwgbnVtYmVyLCBzdWZmaXgpO1xuICB9XG59XG5cbmZ1bmN0aW9uIHJlc29sdmVTdHlsZVByb3BWYWx1ZShcbiAgICB2YWx1ZTogc3RyaW5nIHwgbnVtYmVyIHwgU3RyaW5nIHwgUGxheWVyRmFjdG9yeSB8IG51bGwsIHN1ZmZpeDogc3RyaW5nIHwgbnVsbCB8IHVuZGVmaW5lZCkge1xuICBsZXQgdmFsdWVUb0FkZDogc3RyaW5nfG51bGwgPSBudWxsO1xuICBpZiAodmFsdWUgIT09IG51bGwpIHtcbiAgICBpZiAoc3VmZml4KSB7XG4gICAgICAvLyB3aGVuIGEgc3VmZml4IGlzIGFwcGxpZWQgdGhlbiBpdCB3aWxsIGJ5cGFzc1xuICAgICAgLy8gc2FuaXRpemF0aW9uIGVudGlyZWx5IChiL2MgYSBuZXcgc3RyaW5nIGlzIGNyZWF0ZWQpXG4gICAgICB2YWx1ZVRvQWRkID0gcmVuZGVyU3RyaW5naWZ5KHZhbHVlKSArIHN1ZmZpeDtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gc2FuaXRpemF0aW9uIGhhcHBlbnMgYnkgZGVhbGluZyB3aXRoIGEgU3RyaW5nIHZhbHVlXG4gICAgICAvLyB0aGlzIG1lYW5zIHRoYXQgdGhlIHN0cmluZyB2YWx1ZSB3aWxsIGJlIHBhc3NlZCB0aHJvdWdoXG4gICAgICAvLyBpbnRvIHRoZSBzdHlsZSByZW5kZXJpbmcgbGF0ZXIgKHdoaWNoIGlzIHdoZXJlIHRoZSB2YWx1ZVxuICAgICAgLy8gd2lsbCBiZSBzYW5pdGl6ZWQgYmVmb3JlIGl0IGlzIGFwcGxpZWQpXG4gICAgICB2YWx1ZVRvQWRkID0gdmFsdWUgYXMgYW55IGFzIHN0cmluZztcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHZhbHVlVG9BZGQ7XG59XG5cblxuLyoqXG4gKiBVcGRhdGUgYSBjbGFzcyBiaW5kaW5nIG9uIGFuIGVsZW1lbnQgd2l0aCB0aGUgcHJvdmlkZWQgdmFsdWUuXG4gKlxuICogVGhpcyBpbnN0cnVjdGlvbiBpcyBtZWFudCB0byBoYW5kbGUgdGhlIGBbY2xhc3MuZm9vXT1cImV4cFwiYCBjYXNlIGFuZCxcbiAqIHRoZXJlZm9yZSwgdGhlIGNsYXNzIGJpbmRpbmcgaXRzZWxmIG11c3QgYWxyZWFkeSBiZSBhbGxvY2F0ZWQgdXNpbmdcbiAqIGBzdHlsaW5nYCB3aXRoaW4gdGhlIGNyZWF0aW9uIGJsb2NrLlxuICpcbiAqIEBwYXJhbSBjbGFzc0luZGV4IEluZGV4IG9mIGNsYXNzIHRvIHRvZ2dsZS4gVGhpcyBpbmRleCB2YWx1ZSByZWZlcnMgdG8gdGhlXG4gKiAgICAgICAgaW5kZXggb2YgdGhlIGNsYXNzIGluIHRoZSBjbGFzcyBiaW5kaW5ncyBhcnJheSB0aGF0IHdhcyBwYXNzZWQgaW50b1xuICogICAgICAgIGBzdHlsaW5nYCAod2hpY2ggaXMgbWVhbnQgdG8gYmUgY2FsbGVkIGJlZm9yZSB0aGlzXG4gKiAgICAgICAgZnVuY3Rpb24gaXMpLlxuICogQHBhcmFtIHZhbHVlIEEgdHJ1ZS9mYWxzZSB2YWx1ZSB3aGljaCB3aWxsIHR1cm4gdGhlIGNsYXNzIG9uIG9yIG9mZi5cbiAqIEBwYXJhbSBmb3JjZU92ZXJyaWRlIFdoZXRoZXIgb3Igbm90IHRoaXMgdmFsdWUgd2lsbCBiZSBhcHBsaWVkIHJlZ2FyZGxlc3NcbiAqICAgICAgICBvZiB3aGVyZSBpdCBpcyBiZWluZyBzZXQgd2l0aGluIHRoZSBzdHlsaW5nIHByaW9yaXR5IHN0cnVjdHVyZS5cbiAqXG4gKiBOb3RlIHRoYXQgdGhpcyB3aWxsIGFwcGx5IHRoZSBwcm92aWRlZCBjbGFzcyB2YWx1ZSB0byB0aGUgaG9zdCBlbGVtZW50IGlmIHRoaXMgZnVuY3Rpb25cbiAqIGlzIGNhbGxlZCB3aXRoaW4gYSBob3N0IGJpbmRpbmcuXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVjbGFzc1Byb3AoXG4gICAgY2xhc3NJbmRleDogbnVtYmVyLCB2YWx1ZTogYm9vbGVhbiB8IFBsYXllckZhY3RvcnksIGZvcmNlT3ZlcnJpZGU/OiBib29sZWFuKTogdm9pZCB7XG4gIGNvbnN0IGluZGV4ID0gZ2V0U2VsZWN0ZWRJbmRleCgpO1xuICBjb25zdCBpbnB1dCA9ICh2YWx1ZSBpbnN0YW5jZW9mIEJvdW5kUGxheWVyRmFjdG9yeSkgP1xuICAgICAgKHZhbHVlIGFzIEJvdW5kUGxheWVyRmFjdG9yeTxib29sZWFufG51bGw+KSA6XG4gICAgICBib29sZWFuT3JOdWxsKHZhbHVlKTtcbiAgY29uc3QgZGlyZWN0aXZlU3R5bGluZ0luZGV4ID0gZ2V0QWN0aXZlRGlyZWN0aXZlU3R5bGluZ0luZGV4KCk7XG4gIGNvbnN0IHN0eWxpbmdDb250ZXh0ID0gZ2V0U3R5bGluZ0NvbnRleHQoaW5kZXgsIGdldExWaWV3KCkpO1xuICBpZiAoZGlyZWN0aXZlU3R5bGluZ0luZGV4KSB7XG4gICAgY29uc3QgYXJnczogUGFyYW1zT2Y8dHlwZW9mIHVwZGF0ZWNsYXNzUHJvcD4gPVxuICAgICAgICBbc3R5bGluZ0NvbnRleHQsIGNsYXNzSW5kZXgsIGlucHV0LCBkaXJlY3RpdmVTdHlsaW5nSW5kZXgsIGZvcmNlT3ZlcnJpZGVdO1xuICAgIGVucXVldWVIb3N0SW5zdHJ1Y3Rpb24oc3R5bGluZ0NvbnRleHQsIGRpcmVjdGl2ZVN0eWxpbmdJbmRleCwgdXBkYXRlY2xhc3NQcm9wLCBhcmdzKTtcbiAgfSBlbHNlIHtcbiAgICB1cGRhdGVjbGFzc1Byb3AoXG4gICAgICAgIHN0eWxpbmdDb250ZXh0LCBjbGFzc0luZGV4LCBpbnB1dCwgREVGQVVMVF9URU1QTEFURV9ESVJFQ1RJVkVfSU5ERVgsIGZvcmNlT3ZlcnJpZGUpO1xuICB9XG5cbiAgaWYgKHJ1bnRpbWVJc05ld1N0eWxpbmdJblVzZSgpKSB7XG4gICAgY29uc3QgcHJvcCA9IGdldEJpbmRpbmdOYW1lRnJvbUluZGV4KHN0eWxpbmdDb250ZXh0LCBjbGFzc0luZGV4LCBkaXJlY3RpdmVTdHlsaW5nSW5kZXgsIHRydWUpO1xuXG4gICAgLy8gdGhlIHJlYXNvbiB3aHkgd2UgY2FzdCB0aGUgdmFsdWUgYXMgYGJvb2xlYW5gIGlzXG4gICAgLy8gYmVjYXVzZSB0aGUgbmV3IHN0eWxpbmcgcmVmYWN0b3IgZG9lcyBub3QgeWV0IHN1cHBvcnRcbiAgICAvLyBzYW5pdGl6YXRpb24gb3IgYW5pbWF0aW9uIHBsYXllcnMuXG4gICAgbmV3Q2xhc3NQcm9wKHByb3AsIGlucHV0IGFzIGJvb2xlYW4pO1xuICB9XG59XG5cblxuZnVuY3Rpb24gYm9vbGVhbk9yTnVsbCh2YWx1ZTogYW55KTogYm9vbGVhbnxudWxsIHtcbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ2Jvb2xlYW4nKSByZXR1cm4gdmFsdWU7XG4gIHJldHVybiB2YWx1ZSA/IHRydWUgOiBudWxsO1xufVxuXG5cbi8qKlxuICogVXBkYXRlIHN0eWxlIGJpbmRpbmdzIHVzaW5nIGFuIG9iamVjdCBsaXRlcmFsIG9uIGFuIGVsZW1lbnQuXG4gKlxuICogVGhpcyBpbnN0cnVjdGlvbiBpcyBtZWFudCB0byBhcHBseSBzdHlsaW5nIHZpYSB0aGUgYFtzdHlsZV09XCJleHBcImAgdGVtcGxhdGUgYmluZGluZ3MuXG4gKiBXaGVuIHN0eWxlcyBhcmUgYXBwbGllZCB0byB0aGUgZWxlbWVudCB0aGV5IHdpbGwgdGhlbiBiZSB1cGRhdGVkIHdpdGggcmVzcGVjdCB0b1xuICogYW55IHN0eWxlcy9jbGFzc2VzIHNldCB2aWEgYHN0eWxlUHJvcGAuIElmIGFueSBzdHlsZXMgYXJlIHNldCB0byBmYWxzeVxuICogdGhlbiB0aGV5IHdpbGwgYmUgcmVtb3ZlZCBmcm9tIHRoZSBlbGVtZW50LlxuICpcbiAqIE5vdGUgdGhhdCB0aGUgc3R5bGluZyBpbnN0cnVjdGlvbiB3aWxsIG5vdCBiZSBhcHBsaWVkIHVudGlsIGBzdHlsaW5nQXBwbHlgIGlzIGNhbGxlZC5cbiAqXG4gKiBAcGFyYW0gc3R5bGVzIEEga2V5L3ZhbHVlIHN0eWxlIG1hcCBvZiB0aGUgc3R5bGVzIHRoYXQgd2lsbCBiZSBhcHBsaWVkIHRvIHRoZSBnaXZlbiBlbGVtZW50LlxuICogICAgICAgIEFueSBtaXNzaW5nIHN0eWxlcyAodGhhdCBoYXZlIGFscmVhZHkgYmVlbiBhcHBsaWVkIHRvIHRoZSBlbGVtZW50IGJlZm9yZWhhbmQpIHdpbGwgYmVcbiAqICAgICAgICByZW1vdmVkICh1bnNldCkgZnJvbSB0aGUgZWxlbWVudCdzIHN0eWxpbmcuXG4gKlxuICogTm90ZSB0aGF0IHRoaXMgd2lsbCBhcHBseSB0aGUgcHJvdmlkZWQgc3R5bGVNYXAgdmFsdWUgdG8gdGhlIGhvc3QgZWxlbWVudCBpZiB0aGlzIGZ1bmN0aW9uXG4gKiBpcyBjYWxsZWQgd2l0aGluIGEgaG9zdCBiaW5kaW5nLlxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1c3R5bGVNYXAoc3R5bGVzOiB7W3N0eWxlTmFtZTogc3RyaW5nXTogYW55fSB8IE5PX0NIQU5HRSB8IG51bGwpOiB2b2lkIHtcbiAgY29uc3QgaW5kZXggPSBnZXRTZWxlY3RlZEluZGV4KCk7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3Qgc3R5bGluZ0NvbnRleHQgPSBnZXRTdHlsaW5nQ29udGV4dChpbmRleCwgbFZpZXcpO1xuICBjb25zdCBkaXJlY3RpdmVTdHlsaW5nSW5kZXggPSBnZXRBY3RpdmVEaXJlY3RpdmVTdHlsaW5nSW5kZXgoKTtcbiAgaWYgKGRpcmVjdGl2ZVN0eWxpbmdJbmRleCkge1xuICAgIGNvbnN0IGFyZ3M6IFBhcmFtc09mPHR5cGVvZiB1cGRhdGVTdHlsZU1hcD4gPSBbc3R5bGluZ0NvbnRleHQsIHN0eWxlcywgZGlyZWN0aXZlU3R5bGluZ0luZGV4XTtcbiAgICBlbnF1ZXVlSG9zdEluc3RydWN0aW9uKHN0eWxpbmdDb250ZXh0LCBkaXJlY3RpdmVTdHlsaW5nSW5kZXgsIHVwZGF0ZVN0eWxlTWFwLCBhcmdzKTtcbiAgfSBlbHNlIHtcbiAgICBjb25zdCB0Tm9kZSA9IGdldFROb2RlKGluZGV4LCBsVmlldyk7XG5cbiAgICAvLyBpbnB1dHMgYXJlIG9ubHkgZXZhbHVhdGVkIGZyb20gYSB0ZW1wbGF0ZSBiaW5kaW5nIGludG8gYSBkaXJlY3RpdmUsIHRoZXJlZm9yZSxcbiAgICAvLyB0aGVyZSBzaG91bGQgbm90IGJlIGEgc2l0dWF0aW9uIHdoZXJlIGEgZGlyZWN0aXZlIGhvc3QgYmluZGluZ3MgZnVuY3Rpb25cbiAgICAvLyBldmFsdWF0ZXMgdGhlIGlucHV0cyAodGhpcyBzaG91bGQgb25seSBoYXBwZW4gaW4gdGhlIHRlbXBsYXRlIGZ1bmN0aW9uKVxuICAgIGlmIChoYXNTdHlsZUlucHV0KHROb2RlKSAmJiBzdHlsZXMgIT09IE5PX0NIQU5HRSkge1xuICAgICAgY29uc3QgaW5pdGlhbFN0eWxlcyA9IGdldEluaXRpYWxDbGFzc05hbWVWYWx1ZShzdHlsaW5nQ29udGV4dCk7XG4gICAgICBjb25zdCBzdHlsZUlucHV0VmFsID1cbiAgICAgICAgICAoaW5pdGlhbFN0eWxlcy5sZW5ndGggPyAoaW5pdGlhbFN0eWxlcyArICcgJykgOiAnJykgKyBmb3JjZVN0eWxlc0FzU3RyaW5nKHN0eWxlcyk7XG4gICAgICBzZXRJbnB1dHNGb3JQcm9wZXJ0eShsVmlldywgdE5vZGUuaW5wdXRzICFbJ3N0eWxlJ10gISwgc3R5bGVJbnB1dFZhbCk7XG4gICAgICBzdHlsZXMgPSBOT19DSEFOR0U7XG4gICAgfVxuICAgIHVwZGF0ZVN0eWxlTWFwKHN0eWxpbmdDb250ZXh0LCBzdHlsZXMpO1xuICB9XG5cbiAgaWYgKHJ1bnRpbWVJc05ld1N0eWxpbmdJblVzZSgpKSB7XG4gICAgbmV3U3R5bGVNYXAoc3R5bGVzKTtcbiAgfVxufVxuXG5cbi8qKlxuICogVXBkYXRlIGNsYXNzIGJpbmRpbmdzIHVzaW5nIGFuIG9iamVjdCBsaXRlcmFsIG9yIGNsYXNzLXN0cmluZyBvbiBhbiBlbGVtZW50LlxuICpcbiAqIFRoaXMgaW5zdHJ1Y3Rpb24gaXMgbWVhbnQgdG8gYXBwbHkgc3R5bGluZyB2aWEgdGhlIGBbY2xhc3NdPVwiZXhwXCJgIHRlbXBsYXRlIGJpbmRpbmdzLlxuICogV2hlbiBjbGFzc2VzIGFyZSBhcHBsaWVkIHRvIHRoZSBlbGVtZW50IHRoZXkgd2lsbCB0aGVuIGJlIHVwZGF0ZWQgd2l0aFxuICogcmVzcGVjdCB0byBhbnkgc3R5bGVzL2NsYXNzZXMgc2V0IHZpYSBgY2xhc3NQcm9wYC4gSWYgYW55XG4gKiBjbGFzc2VzIGFyZSBzZXQgdG8gZmFsc3kgdGhlbiB0aGV5IHdpbGwgYmUgcmVtb3ZlZCBmcm9tIHRoZSBlbGVtZW50LlxuICpcbiAqIE5vdGUgdGhhdCB0aGUgc3R5bGluZyBpbnN0cnVjdGlvbiB3aWxsIG5vdCBiZSBhcHBsaWVkIHVudGlsIGBzdHlsaW5nQXBwbHlgIGlzIGNhbGxlZC5cbiAqIE5vdGUgdGhhdCB0aGlzIHdpbGwgdGhlIHByb3ZpZGVkIGNsYXNzTWFwIHZhbHVlIHRvIHRoZSBob3N0IGVsZW1lbnQgaWYgdGhpcyBmdW5jdGlvbiBpcyBjYWxsZWRcbiAqIHdpdGhpbiBhIGhvc3QgYmluZGluZy5cbiAqXG4gKiBAcGFyYW0gY2xhc3NlcyBBIGtleS92YWx1ZSBtYXAgb3Igc3RyaW5nIG9mIENTUyBjbGFzc2VzIHRoYXQgd2lsbCBiZSBhZGRlZCB0byB0aGVcbiAqICAgICAgICBnaXZlbiBlbGVtZW50LiBBbnkgbWlzc2luZyBjbGFzc2VzICh0aGF0IGhhdmUgYWxyZWFkeSBiZWVuIGFwcGxpZWQgdG8gdGhlIGVsZW1lbnRcbiAqICAgICAgICBiZWZvcmVoYW5kKSB3aWxsIGJlIHJlbW92ZWQgKHVuc2V0KSBmcm9tIHRoZSBlbGVtZW50J3MgbGlzdCBvZiBDU1MgY2xhc3Nlcy5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWNsYXNzTWFwKGNsYXNzZXM6IHtbc3R5bGVOYW1lOiBzdHJpbmddOiBhbnl9IHwgc3RyaW5nIHwgbnVsbCk6IHZvaWQge1xuICBjb25zdCBpbmRleCA9IGdldFNlbGVjdGVkSW5kZXgoKTtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCBzdHlsaW5nQ29udGV4dCA9IGdldFN0eWxpbmdDb250ZXh0KGluZGV4LCBsVmlldyk7XG4gIGNvbnN0IGRpcmVjdGl2ZVN0eWxpbmdJbmRleCA9IGdldEFjdGl2ZURpcmVjdGl2ZVN0eWxpbmdJbmRleCgpO1xuICBpZiAoZGlyZWN0aXZlU3R5bGluZ0luZGV4KSB7XG4gICAgY29uc3QgYXJnczogUGFyYW1zT2Y8dHlwZW9mIHVwZGF0ZUNsYXNzTWFwPiA9IFtzdHlsaW5nQ29udGV4dCwgY2xhc3NlcywgZGlyZWN0aXZlU3R5bGluZ0luZGV4XTtcbiAgICBlbnF1ZXVlSG9zdEluc3RydWN0aW9uKHN0eWxpbmdDb250ZXh0LCBkaXJlY3RpdmVTdHlsaW5nSW5kZXgsIHVwZGF0ZUNsYXNzTWFwLCBhcmdzKTtcbiAgfSBlbHNlIHtcbiAgICBjb25zdCB0Tm9kZSA9IGdldFROb2RlKGluZGV4LCBsVmlldyk7XG4gICAgLy8gaW5wdXRzIGFyZSBvbmx5IGV2YWx1YXRlZCBmcm9tIGEgdGVtcGxhdGUgYmluZGluZyBpbnRvIGEgZGlyZWN0aXZlLCB0aGVyZWZvcmUsXG4gICAgLy8gdGhlcmUgc2hvdWxkIG5vdCBiZSBhIHNpdHVhdGlvbiB3aGVyZSBhIGRpcmVjdGl2ZSBob3N0IGJpbmRpbmdzIGZ1bmN0aW9uXG4gICAgLy8gZXZhbHVhdGVzIHRoZSBpbnB1dHMgKHRoaXMgc2hvdWxkIG9ubHkgaGFwcGVuIGluIHRoZSB0ZW1wbGF0ZSBmdW5jdGlvbilcbiAgICBpZiAoaGFzQ2xhc3NJbnB1dCh0Tm9kZSkpIHtcbiAgICAgIGNvbnN0IGluaXRpYWxDbGFzc2VzID0gZ2V0SW5pdGlhbENsYXNzTmFtZVZhbHVlKHN0eWxpbmdDb250ZXh0KTtcbiAgICAgIGNvbnN0IGNsYXNzSW5wdXRWYWwgPVxuICAgICAgICAgIChpbml0aWFsQ2xhc3Nlcy5sZW5ndGggPyAoaW5pdGlhbENsYXNzZXMgKyAnICcpIDogJycpICsgZm9yY2VDbGFzc2VzQXNTdHJpbmcoY2xhc3Nlcyk7XG4gICAgICBzZXRJbnB1dHNGb3JQcm9wZXJ0eShsVmlldywgdE5vZGUuaW5wdXRzICFbJ2NsYXNzJ10gISwgY2xhc3NJbnB1dFZhbCk7XG4gICAgICBjbGFzc2VzID0gTk9fQ0hBTkdFO1xuICAgIH1cbiAgICB1cGRhdGVDbGFzc01hcChzdHlsaW5nQ29udGV4dCwgY2xhc3Nlcyk7XG4gIH1cblxuICBpZiAocnVudGltZUlzTmV3U3R5bGluZ0luVXNlKCkpIHtcbiAgICBuZXdDbGFzc01hcChjbGFzc2VzKTtcbiAgfVxufVxuXG4vKipcbiAqIEFwcGx5IGFsbCBzdHlsZSBhbmQgY2xhc3MgYmluZGluZyB2YWx1ZXMgdG8gdGhlIGVsZW1lbnQuXG4gKlxuICogVGhpcyBpbnN0cnVjdGlvbiBpcyBtZWFudCB0byBiZSBydW4gYWZ0ZXIgYHN0eWxlTWFwYCwgYGNsYXNzTWFwYCxcbiAqIGBzdHlsZVByb3BgIG9yIGBjbGFzc1Byb3BgIGluc3RydWN0aW9ucyBoYXZlIGJlZW4gcnVuIGFuZCB3aWxsXG4gKiBvbmx5IGFwcGx5IHN0eWxpbmcgdG8gdGhlIGVsZW1lbnQgaWYgYW55IHN0eWxpbmcgYmluZGluZ3MgaGF2ZSBiZWVuIHVwZGF0ZWQuXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVzdHlsaW5nQXBwbHkoKTogdm9pZCB7XG4gIGNvbnN0IGluZGV4ID0gZ2V0U2VsZWN0ZWRJbmRleCgpO1xuICBjb25zdCBkaXJlY3RpdmVTdHlsaW5nSW5kZXggPVxuICAgICAgZ2V0QWN0aXZlRGlyZWN0aXZlU3R5bGluZ0luZGV4KCkgfHwgREVGQVVMVF9URU1QTEFURV9ESVJFQ1RJVkVfSU5ERVg7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgdE5vZGUgPSBnZXRUTm9kZShpbmRleCwgbFZpZXcpO1xuXG4gIC8vIGlmIGEgbm9uLWVsZW1lbnQgdmFsdWUgaXMgYmVpbmcgcHJvY2Vzc2VkIHRoZW4gd2UgY2FuJ3QgcmVuZGVyIHZhbHVlc1xuICAvLyBvbiB0aGUgZWxlbWVudCBhdCBhbGwgdGhlcmVmb3JlIGJ5IHNldHRpbmcgdGhlIHJlbmRlcmVyIHRvIG51bGwgdGhlblxuICAvLyB0aGUgc3R5bGluZyBhcHBseSBjb2RlIGtub3dzIG5vdCB0byBhY3R1YWxseSBhcHBseSB0aGUgdmFsdWVzLi4uXG4gIGNvbnN0IHJlbmRlcmVyID0gdE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkVsZW1lbnQgPyBsVmlld1tSRU5ERVJFUl0gOiBudWxsO1xuICBjb25zdCBpc0ZpcnN0UmVuZGVyID0gKGxWaWV3W0ZMQUdTXSAmIExWaWV3RmxhZ3MuRmlyc3RMVmlld1Bhc3MpICE9PSAwO1xuICBjb25zdCBzdHlsaW5nQ29udGV4dCA9IGdldFN0eWxpbmdDb250ZXh0KGluZGV4LCBsVmlldyk7XG5cbiAgaWYgKHJ1bnRpbWVBbGxvd09sZFN0eWxpbmcoKSkge1xuICAgIGNvbnN0IHRvdGFsUGxheWVyc1F1ZXVlZCA9IHJlbmRlclN0eWxpbmcoXG4gICAgICAgIHN0eWxpbmdDb250ZXh0LCByZW5kZXJlciwgbFZpZXcsIGlzRmlyc3RSZW5kZXIsIG51bGwsIG51bGwsIGRpcmVjdGl2ZVN0eWxpbmdJbmRleCk7XG4gICAgaWYgKHRvdGFsUGxheWVyc1F1ZXVlZCA+IDApIHtcbiAgICAgIGNvbnN0IHJvb3RDb250ZXh0ID0gZ2V0Um9vdENvbnRleHQobFZpZXcpO1xuICAgICAgc2NoZWR1bGVUaWNrKHJvb3RDb250ZXh0LCBSb290Q29udGV4dEZsYWdzLkZsdXNoUGxheWVycyk7XG4gICAgfVxuICB9XG5cbiAgLy8gYmVjYXVzZSBzZWxlY3QobikgbWF5IG5vdCBydW4gYmV0d2VlbiBldmVyeSBpbnN0cnVjdGlvbiwgdGhlIGNhY2hlZCBzdHlsaW5nXG4gIC8vIGNvbnRleHQgbWF5IG5vdCBnZXQgY2xlYXJlZCBiZXR3ZWVuIGVsZW1lbnRzLiBUaGUgcmVhc29uIGZvciB0aGlzIGlzIGJlY2F1c2VcbiAgLy8gc3R5bGluZyBiaW5kaW5ncyAobGlrZSBgW3N0eWxlXWAgYW5kIGBbY2xhc3NdYCkgYXJlIG5vdCByZWNvZ25pemVkIGFzIHByb3BlcnR5XG4gIC8vIGJpbmRpbmdzIGJ5IGRlZmF1bHQgc28gYSBzZWxlY3QobikgaW5zdHJ1Y3Rpb24gaXMgbm90IGdlbmVyYXRlZC4gVG8gZW5zdXJlIHRoZVxuICAvLyBjb250ZXh0IGlzIGxvYWRlZCBjb3JyZWN0bHkgZm9yIHRoZSBuZXh0IGVsZW1lbnQgdGhlIGNhY2hlIGJlbG93IGlzIHByZS1lbXB0aXZlbHlcbiAgLy8gY2xlYXJlZCBiZWNhdXNlIHRoZXJlIGlzIG5vIGNvZGUgaW4gQW5ndWxhciB0aGF0IGFwcGxpZXMgbW9yZSBzdHlsaW5nIGNvZGUgYWZ0ZXIgYVxuICAvLyBzdHlsaW5nIGZsdXNoIGhhcyBvY2N1cnJlZC4gTm90ZSB0aGF0IHRoaXMgd2lsbCBiZSBmaXhlZCBvbmNlIEZXLTEyNTQgbGFuZHMuXG4gIHNldENhY2hlZFN0eWxpbmdDb250ZXh0KG51bGwpO1xuXG4gIGlmIChydW50aW1lSXNOZXdTdHlsaW5nSW5Vc2UoKSkge1xuICAgIG5ld1N0eWxpbmdBcHBseSgpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRBY3RpdmVEaXJlY3RpdmVTdHlsaW5nSW5kZXgoKSB7XG4gIC8vIHdoZW5ldmVyIGEgZGlyZWN0aXZlJ3MgaG9zdEJpbmRpbmdzIGZ1bmN0aW9uIGlzIGNhbGxlZCBhIHVuaXF1ZUlkIHZhbHVlXG4gIC8vIGlzIGFzc2lnbmVkLiBOb3JtYWxseSB0aGlzIGlzIGVub3VnaCB0byBoZWxwIGRpc3Rpbmd1aXNoIG9uZSBkaXJlY3RpdmVcbiAgLy8gZnJvbSBhbm90aGVyIGZvciB0aGUgc3R5bGluZyBjb250ZXh0LCBidXQgdGhlcmUgYXJlIHNpdHVhdGlvbnMgd2hlcmUgYVxuICAvLyBzdWItY2xhc3MgZGlyZWN0aXZlIGNvdWxkIGluaGVyaXQgYW5kIGFzc2lnbiBzdHlsaW5nIGluIGNvbmNlcnQgd2l0aCBhXG4gIC8vIHBhcmVudCBkaXJlY3RpdmUuIFRvIGhlbHAgdGhlIHN0eWxpbmcgY29kZSBkaXN0aW5ndWlzaCBiZXR3ZWVuIGEgcGFyZW50XG4gIC8vIHN1Yi1jbGFzc2VkIGRpcmVjdGl2ZSB0aGUgaW5oZXJpdGFuY2UgZGVwdGggaXMgdGFrZW4gaW50byBhY2NvdW50IGFzIHdlbGwuXG4gIHJldHVybiBnZXRBY3RpdmVEaXJlY3RpdmVJZCgpICsgZ2V0QWN0aXZlRGlyZWN0aXZlU3VwZXJDbGFzc0RlcHRoKCk7XG59XG5cbmZ1bmN0aW9uIGdldFN0eWxpbmdDb250ZXh0KGluZGV4OiBudW1iZXIsIGxWaWV3OiBMVmlldykge1xuICBsZXQgY29udGV4dCA9IGdldENhY2hlZFN0eWxpbmdDb250ZXh0KCk7XG4gIGlmICghY29udGV4dCkge1xuICAgIGNvbnRleHQgPSBnZXRTdHlsaW5nQ29udGV4dEZyb21MVmlldyhpbmRleCArIEhFQURFUl9PRkZTRVQsIGxWaWV3KTtcbiAgICBzZXRDYWNoZWRTdHlsaW5nQ29udGV4dChjb250ZXh0KTtcbiAgfSBlbHNlIGlmIChuZ0Rldk1vZGUpIHtcbiAgICBjb25zdCBhY3R1YWxDb250ZXh0ID0gZ2V0U3R5bGluZ0NvbnRleHRGcm9tTFZpZXcoaW5kZXggKyBIRUFERVJfT0ZGU0VULCBsVmlldyk7XG4gICAgYXNzZXJ0RXF1YWwoY29udGV4dCwgYWN0dWFsQ29udGV4dCwgJ1RoZSBjYWNoZWQgc3R5bGluZyBjb250ZXh0IGlzIGludmFsaWQnKTtcbiAgfVxuICByZXR1cm4gY29udGV4dDtcbn1cbiJdfQ==