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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3R5bGluZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaW5zdHJ1Y3Rpb25zL3N0eWxpbmcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7OztBQVFBLE9BQU8sRUFBQyxXQUFXLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUc5QyxPQUFPLEVBQUMsS0FBSyxFQUFFLGFBQWEsRUFBcUIsUUFBUSxFQUFtQixNQUFNLG9CQUFvQixDQUFDO0FBQ3ZHLE9BQU8sRUFBQyxvQkFBb0IsRUFBRSxpQ0FBaUMsRUFBRSxRQUFRLEVBQUUsd0JBQXdCLEVBQUUsZ0JBQWdCLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDdkksT0FBTyxFQUFDLHdCQUF3QixFQUFFLGFBQWEsRUFBRSxjQUFjLEVBQUUsZUFBZSxJQUFJLGVBQWUsRUFBRSx5QkFBeUIsRUFBRSxjQUFjLEVBQUUsZUFBZSxJQUFJLGVBQWUsRUFBQyxNQUFNLHFDQUFxQyxDQUFDO0FBQy9OLE9BQU8sRUFBVyxzQkFBc0IsRUFBRSxxQkFBcUIsRUFBQyxNQUFNLG9DQUFvQyxDQUFDO0FBQzNHLE9BQU8sRUFBQyxrQkFBa0IsRUFBQyxNQUFNLDJCQUEyQixDQUFDO0FBQzdELE9BQU8sRUFBQyxnQ0FBZ0MsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQ25FLE9BQU8sRUFBQyx1QkFBdUIsRUFBRSx1QkFBdUIsRUFBQyxNQUFNLGtCQUFrQixDQUFDO0FBQ2xGLE9BQU8sRUFBQyxvQ0FBb0MsRUFBRSx5QkFBeUIsRUFBRSxvQkFBb0IsRUFBRSxtQkFBbUIsRUFBRSwwQkFBMEIsRUFBRSxhQUFhLEVBQUUsYUFBYSxFQUFDLE1BQU0saUJBQWlCLENBQUM7QUFDck0sT0FBTyxFQUFDLFFBQVEsSUFBSSxXQUFXLEVBQUUsU0FBUyxJQUFJLFlBQVksRUFBRSxRQUFRLElBQUksV0FBVyxFQUFFLFNBQVMsSUFBSSxZQUFZLEVBQUUs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LEVBQUUsS0FBWTs7UUFDaEQsT0FBTyxHQUFHLHVCQUF1QixFQUFFO0lBQ3ZDLElBQUksQ0FBQyxPQUFPLEVBQUU7UUFDWixPQUFPLEdBQUcsMEJBQTBCLENBQUMsS0FBSyxHQUFHLGFBQWEsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUNuRSx1QkFBdUIsQ0FBQyxPQUFPLENBQUMsQ0FBQztLQUNsQztTQUFNLElBQUksU0FBUyxFQUFFOztjQUNkLGFBQWEsR0FBRywwQkFBMEIsQ0FBQyxLQUFLLEdBQUcsYUFBYSxFQUFFLEtBQUssQ0FBQztRQUM5RSxXQUFXLENBQUMsT0FBTyxFQUFFLGFBQWEsRUFBRSx1Q0FBdUMsQ0FBQyxDQUFDO0tBQzlFO0lBQ0QsT0FBTyxPQUFPLENBQUM7QUFDakIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCB7U3R5bGVTYW5pdGl6ZUZufSBmcm9tICcuLi8uLi9zYW5pdGl6YXRpb24vc3R5bGVfc2FuaXRpemVyJztcbmltcG9ydCB7YXNzZXJ0RXF1YWx9IGZyb20gJy4uLy4uL3V0aWwvYXNzZXJ0JztcbmltcG9ydCB7VE5vZGUsIFROb2RlVHlwZX0gZnJvbSAnLi4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7UGxheWVyRmFjdG9yeX0gZnJvbSAnLi4vaW50ZXJmYWNlcy9wbGF5ZXInO1xuaW1wb3J0IHtGTEFHUywgSEVBREVSX09GRlNFVCwgTFZpZXcsIExWaWV3RmxhZ3MsIFJFTkRFUkVSLCBSb290Q29udGV4dEZsYWdzfSBmcm9tICcuLi9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHtnZXRBY3RpdmVEaXJlY3RpdmVJZCwgZ2V0QWN0aXZlRGlyZWN0aXZlU3VwZXJDbGFzc0RlcHRoLCBnZXRMVmlldywgZ2V0UHJldmlvdXNPclBhcmVudFROb2RlLCBnZXRTZWxlY3RlZEluZGV4fSBmcm9tICcuLi9zdGF0ZSc7XG5pbXBvcnQge2dldEluaXRpYWxDbGFzc05hbWVWYWx1ZSwgcmVuZGVyU3R5bGluZywgdXBkYXRlQ2xhc3NNYXAsIHVwZGF0ZUNsYXNzUHJvcCBhcyB1cGRhdGVjbGFzc1Byb3AsIHVwZGF0ZUNvbnRleHRXaXRoQmluZGluZ3MsIHVwZGF0ZVN0eWxlTWFwLCB1cGRhdGVTdHlsZVByb3AgYXMgdXBkYXRlc3R5bGVQcm9wfSBmcm9tICcuLi9zdHlsaW5nL2NsYXNzX2FuZF9zdHlsZV9iaW5kaW5ncyc7XG5pbXBvcnQge1BhcmFtc09mLCBlbnF1ZXVlSG9zdEluc3RydWN0aW9uLCByZWdpc3Rlckhvc3REaXJlY3RpdmV9IGZyb20gJy4uL3N0eWxpbmcvaG9zdF9pbnN0cnVjdGlvbnNfcXVldWUnO1xuaW1wb3J0IHtCb3VuZFBsYXllckZhY3Rvcnl9IGZyb20gJy4uL3N0eWxpbmcvcGxheWVyX2ZhY3RvcnknO1xuaW1wb3J0IHtERUZBVUxUX1RFTVBMQVRFX0RJUkVDVElWRV9JTkRFWH0gZnJvbSAnLi4vc3R5bGluZy9zaGFyZWQnO1xuaW1wb3J0IHtnZXRDYWNoZWRTdHlsaW5nQ29udGV4dCwgc2V0Q2FjaGVkU3R5bGluZ0NvbnRleHR9IGZyb20gJy4uL3N0eWxpbmcvc3RhdGUnO1xuaW1wb3J0IHthbGxvY2F0ZU9yVXBkYXRlRGlyZWN0aXZlSW50b0NvbnRleHQsIGNyZWF0ZUVtcHR5U3R5bGluZ0NvbnRleHQsIGZvcmNlQ2xhc3Nlc0FzU3RyaW5nLCBmb3JjZVN0eWxlc0FzU3RyaW5nLCBnZXRTdHlsaW5nQ29udGV4dEZyb21MVmlldywgaGFzQ2xhc3NJbnB1dCwgaGFzU3R5bGVJbnB1dH0gZnJvbSAnLi4vc3R5bGluZy91dGlsJztcbmltcG9ydCB7Y2xhc3NNYXAgYXMgbmV3Q2xhc3NNYXAsIGNsYXNzUHJvcCBhcyBuZXdDbGFzc1Byb3AsIHN0eWxlTWFwIGFzIG5ld1N0eWxlTWFwLCBzdHlsZVByb3AgYXMgbmV3U3R5bGVQcm9wLCBzdHlsaW5nQXBwbHkgYXMgbmV3U3R5bGluZ0FwcGx5LCBzdHlsaW5nSW5pdCBhcyBuZXdTdHlsaW5nSW5pdH0gZnJvbSAnLi4vc3R5bGluZ19uZXh0L2luc3RydWN0aW9ucyc7XG5pbXBvcnQge3J1bnRpbWVBbGxvd09sZFN0eWxpbmcsIHJ1bnRpbWVJc05ld1N0eWxpbmdJblVzZX0gZnJvbSAnLi4vc3R5bGluZ19uZXh0L3N0YXRlJztcbmltcG9ydCB7Z2V0QmluZGluZ05hbWVGcm9tSW5kZXh9IGZyb20gJy4uL3N0eWxpbmdfbmV4dC91dGlsJztcbmltcG9ydCB7Tk9fQ0hBTkdFfSBmcm9tICcuLi90b2tlbnMnO1xuaW1wb3J0IHtyZW5kZXJTdHJpbmdpZnl9IGZyb20gJy4uL3V0aWwvbWlzY191dGlscyc7XG5pbXBvcnQge2dldFJvb3RDb250ZXh0fSBmcm9tICcuLi91dGlsL3ZpZXdfdHJhdmVyc2FsX3V0aWxzJztcbmltcG9ydCB7Z2V0VE5vZGV9IGZyb20gJy4uL3V0aWwvdmlld191dGlscyc7XG5cbmltcG9ydCB7c2NoZWR1bGVUaWNrLCBzZXRJbnB1dHNGb3JQcm9wZXJ0eX0gZnJvbSAnLi9zaGFyZWQnO1xuXG5cblxuLypcbiAqIFRoZSBjb250ZW50cyBvZiB0aGlzIGZpbGUgaW5jbHVkZSB0aGUgaW5zdHJ1Y3Rpb25zIGZvciBhbGwgc3R5bGluZy1yZWxhdGVkXG4gKiBvcGVyYXRpb25zIGluIEFuZ3VsYXIuXG4gKlxuICogVGhlIGluc3RydWN0aW9ucyBwcmVzZW50IGluIHRoaXMgZmlsZSBhcmU6XG4gKlxuICogVGVtcGxhdGUgbGV2ZWwgc3R5bGluZyBpbnN0cnVjdGlvbnM6XG4gKiAtIHN0eWxpbmdcbiAqIC0gc3R5bGVNYXBcbiAqIC0gY2xhc3NNYXBcbiAqIC0gc3R5bGVQcm9wXG4gKiAtIGNsYXNzUHJvcFxuICogLSBzdHlsaW5nQXBwbHlcbiAqL1xuXG4vKipcbiAqIEFsbG9jYXRlcyBzdHlsZSBhbmQgY2xhc3MgYmluZGluZyBwcm9wZXJ0aWVzIG9uIHRoZSBlbGVtZW50IGR1cmluZyBjcmVhdGlvbiBtb2RlLlxuICpcbiAqIFRoaXMgaW5zdHJ1Y3Rpb24gaXMgbWVhbnQgdG8gYmUgY2FsbGVkIGR1cmluZyBjcmVhdGlvbiBtb2RlIHRvIHJlZ2lzdGVyIGFsbFxuICogZHluYW1pYyBzdHlsZSBhbmQgY2xhc3MgYmluZGluZ3Mgb24gdGhlIGVsZW1lbnQuIE5vdGUgdGhhdCB0aGlzIGlzIG9ubHkgdXNlZFxuICogZm9yIGJpbmRpbmcgdmFsdWVzIChzZWUgYGVsZW1lbnRTdGFydGAgdG8gbGVhcm4gaG93IHRvIGFzc2lnbiBzdGF0aWMgc3R5bGluZ1xuICogdmFsdWVzIHRvIGFuIGVsZW1lbnQpLlxuICpcbiAqIEBwYXJhbSBjbGFzc0JpbmRpbmdOYW1lcyBBbiBhcnJheSBjb250YWluaW5nIGJpbmRhYmxlIGNsYXNzIG5hbWVzLlxuICogICAgICAgIFRoZSBgY2xhc3NQcm9wYCBpbnN0cnVjdGlvbiByZWZlcnMgdG8gdGhlIGNsYXNzIG5hbWUgYnkgaW5kZXggaW5cbiAqICAgICAgICB0aGlzIGFycmF5IChpLmUuIGBbJ2ZvbycsICdiYXInXWAgbWVhbnMgYGZvbz0wYCBhbmQgYGJhcj0xYCkuXG4gKiBAcGFyYW0gc3R5bGVCaW5kaW5nTmFtZXMgQW4gYXJyYXkgY29udGFpbmluZyBiaW5kYWJsZSBzdHlsZSBwcm9wZXJ0aWVzLlxuICogICAgICAgIFRoZSBgc3R5bGVQcm9wYCBpbnN0cnVjdGlvbiByZWZlcnMgdG8gdGhlIGNsYXNzIG5hbWUgYnkgaW5kZXggaW5cbiAqICAgICAgICB0aGlzIGFycmF5IChpLmUuIGBbJ3dpZHRoJywgJ2hlaWdodCddYCBtZWFucyBgd2lkdGg9MGAgYW5kIGBoZWlnaHQ9MWApLlxuICogQHBhcmFtIHN0eWxlU2FuaXRpemVyIEFuIG9wdGlvbmFsIHNhbml0aXplciBmdW5jdGlvbiB0aGF0IHdpbGwgYmUgdXNlZCB0byBzYW5pdGl6ZSBhbnkgQ1NTXG4gKiAgICAgICAgc3R5bGUgdmFsdWVzIHRoYXQgYXJlIGFwcGxpZWQgdG8gdGhlIGVsZW1lbnQgKGR1cmluZyByZW5kZXJpbmcpLlxuICpcbiAqIE5vdGUgdGhhdCB0aGlzIHdpbGwgYWxsb2NhdGUgdGhlIHByb3ZpZGVkIHN0eWxlL2NsYXNzIGJpbmRpbmdzIHRvIHRoZSBob3N0IGVsZW1lbnQgaWZcbiAqIHRoaXMgZnVuY3Rpb24gaXMgY2FsbGVkIHdpdGhpbiBhIGhvc3QgYmluZGluZy5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtXN0eWxpbmcoXG4gICAgY2xhc3NCaW5kaW5nTmFtZXM/OiBzdHJpbmdbXSB8IG51bGwsIHN0eWxlQmluZGluZ05hbWVzPzogc3RyaW5nW10gfCBudWxsLFxuICAgIHN0eWxlU2FuaXRpemVyPzogU3R5bGVTYW5pdGl6ZUZuIHwgbnVsbCk6IHZvaWQge1xuICBjb25zdCB0Tm9kZSA9IGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSgpO1xuICBpZiAoIXROb2RlLnN0eWxpbmdUZW1wbGF0ZSkge1xuICAgIHROb2RlLnN0eWxpbmdUZW1wbGF0ZSA9IGNyZWF0ZUVtcHR5U3R5bGluZ0NvbnRleHQoKTtcbiAgfVxuXG4gIGNvbnN0IGRpcmVjdGl2ZVN0eWxpbmdJbmRleCA9IGdldEFjdGl2ZURpcmVjdGl2ZVN0eWxpbmdJbmRleCgpO1xuICBpZiAoZGlyZWN0aXZlU3R5bGluZ0luZGV4KSB7XG4gICAgLy8gdGhpcyBpcyB0ZW1wb3JhcnkgaGFjayB0byBnZXQgdGhlIGV4aXN0aW5nIHN0eWxpbmcgaW5zdHJ1Y3Rpb25zIHRvXG4gICAgLy8gcGxheSBiYWxsIHdpdGggdGhlIG5ldyByZWZhY3RvcmVkIGltcGxlbWVudGF0aW9uLlxuICAgIC8vIFRPRE8gKG1hdHNrbyk6IHJlbW92ZSB0aGlzIG9uY2UgdGhlIG9sZCBpbXBsZW1lbnRhdGlvbiBpcyBub3QgbmVlZGVkLlxuICAgIGlmIChydW50aW1lSXNOZXdTdHlsaW5nSW5Vc2UoKSkge1xuICAgICAgbmV3U3R5bGluZ0luaXQoKTtcbiAgICB9XG5cbiAgICAvLyBkZXNwaXRlIHRoZSBiaW5kaW5nIGJlaW5nIGFwcGxpZWQgaW4gYSBxdWV1ZSAoYmVsb3cpLCB0aGUgYWxsb2NhdGlvblxuICAgIC8vIG9mIHRoZSBkaXJlY3RpdmUgaW50byB0aGUgY29udGV4dCBoYXBwZW5zIHJpZ2h0IGF3YXkuIFRoZSByZWFzb24gZm9yXG4gICAgLy8gdGhpcyBpcyB0byByZXRhaW4gdGhlIG9yZGVyaW5nIG9mIHRoZSBkaXJlY3RpdmVzICh3aGljaCBpcyBpbXBvcnRhbnRcbiAgICAvLyBmb3IgdGhlIHByaW9yaXRpemF0aW9uIG9mIGJpbmRpbmdzKS5cbiAgICBhbGxvY2F0ZU9yVXBkYXRlRGlyZWN0aXZlSW50b0NvbnRleHQodE5vZGUuc3R5bGluZ1RlbXBsYXRlLCBkaXJlY3RpdmVTdHlsaW5nSW5kZXgpO1xuXG4gICAgY29uc3QgZm5zID0gdE5vZGUub25FbGVtZW50Q3JlYXRpb25GbnMgPSB0Tm9kZS5vbkVsZW1lbnRDcmVhdGlvbkZucyB8fCBbXTtcbiAgICBmbnMucHVzaCgoKSA9PiB7XG4gICAgICBpbml0U3R5bGluZyhcbiAgICAgICAgICB0Tm9kZSwgY2xhc3NCaW5kaW5nTmFtZXMsIHN0eWxlQmluZGluZ05hbWVzLCBzdHlsZVNhbml0aXplciwgZGlyZWN0aXZlU3R5bGluZ0luZGV4KTtcbiAgICAgIHJlZ2lzdGVySG9zdERpcmVjdGl2ZSh0Tm9kZS5zdHlsaW5nVGVtcGxhdGUgISwgZGlyZWN0aXZlU3R5bGluZ0luZGV4KTtcbiAgICB9KTtcbiAgfSBlbHNlIHtcbiAgICAvLyBjYWxsaW5nIHRoZSBmdW5jdGlvbiBiZWxvdyBlbnN1cmVzIHRoYXQgdGhlIHRlbXBsYXRlJ3MgYmluZGluZyB2YWx1ZXNcbiAgICAvLyBhcmUgYXBwbGllZCBhcyB0aGUgZmlyc3Qgc2V0IG9mIGJpbmRpbmdzIGludG8gdGhlIGNvbnRleHQuIElmIGFueSBvdGhlclxuICAgIC8vIHN0eWxpbmcgYmluZGluZ3MgYXJlIHNldCBvbiB0aGUgc2FtZSBlbGVtZW50IChieSBkaXJlY3RpdmVzIGFuZC9vclxuICAgIC8vIGNvbXBvbmVudHMpIHRoZW4gdGhleSB3aWxsIGJlIGFwcGxpZWQgYXQgdGhlIGVuZCBvZiB0aGUgYGVsZW1lbnRFbmRgXG4gICAgLy8gaW5zdHJ1Y3Rpb24gKGJlY2F1c2UgZGlyZWN0aXZlcyBhcmUgY3JlYXRlZCBmaXJzdCBiZWZvcmUgc3R5bGluZyBpc1xuICAgIC8vIGV4ZWN1dGVkIGZvciBhIG5ldyBlbGVtZW50KS5cbiAgICBpbml0U3R5bGluZyhcbiAgICAgICAgdE5vZGUsIGNsYXNzQmluZGluZ05hbWVzLCBzdHlsZUJpbmRpbmdOYW1lcywgc3R5bGVTYW5pdGl6ZXIsXG4gICAgICAgIERFRkFVTFRfVEVNUExBVEVfRElSRUNUSVZFX0lOREVYKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBpbml0U3R5bGluZyhcbiAgICB0Tm9kZTogVE5vZGUsIGNsYXNzQmluZGluZ05hbWVzOiBzdHJpbmdbXSB8IG51bGwgfCB1bmRlZmluZWQsXG4gICAgc3R5bGVCaW5kaW5nTmFtZXM6IHN0cmluZ1tdIHwgbnVsbCB8IHVuZGVmaW5lZCxcbiAgICBzdHlsZVNhbml0aXplcjogU3R5bGVTYW5pdGl6ZUZuIHwgbnVsbCB8IHVuZGVmaW5lZCwgZGlyZWN0aXZlU3R5bGluZ0luZGV4OiBudW1iZXIpOiB2b2lkIHtcbiAgdXBkYXRlQ29udGV4dFdpdGhCaW5kaW5ncyhcbiAgICAgIHROb2RlLnN0eWxpbmdUZW1wbGF0ZSAhLCBkaXJlY3RpdmVTdHlsaW5nSW5kZXgsIGNsYXNzQmluZGluZ05hbWVzLCBzdHlsZUJpbmRpbmdOYW1lcyxcbiAgICAgIHN0eWxlU2FuaXRpemVyKTtcbn1cblxuXG4vKipcbiAqIFVwZGF0ZSBhIHN0eWxlIGJpbmRpbmcgb24gYW4gZWxlbWVudCB3aXRoIHRoZSBwcm92aWRlZCB2YWx1ZS5cbiAqXG4gKiBJZiB0aGUgc3R5bGUgdmFsdWUgaXMgZmFsc3kgdGhlbiBpdCB3aWxsIGJlIHJlbW92ZWQgZnJvbSB0aGUgZWxlbWVudFxuICogKG9yIGFzc2lnbmVkIGEgZGlmZmVyZW50IHZhbHVlIGRlcGVuZGluZyBpZiB0aGVyZSBhcmUgYW55IHN0eWxlcyBwbGFjZWRcbiAqIG9uIHRoZSBlbGVtZW50IHdpdGggYHN0eWxlTWFwYCBvciBhbnkgc3RhdGljIHN0eWxlcyB0aGF0IGFyZVxuICogcHJlc2VudCBmcm9tIHdoZW4gdGhlIGVsZW1lbnQgd2FzIGNyZWF0ZWQgd2l0aCBgc3R5bGluZ2ApLlxuICpcbiAqIE5vdGUgdGhhdCB0aGUgc3R5bGluZyBlbGVtZW50IGlzIHVwZGF0ZWQgYXMgcGFydCBvZiBgc3R5bGluZ0FwcGx5YC5cbiAqXG4gKiBAcGFyYW0gc3R5bGVJbmRleCBJbmRleCBvZiBzdHlsZSB0byB1cGRhdGUuIFRoaXMgaW5kZXggdmFsdWUgcmVmZXJzIHRvIHRoZVxuICogICAgICAgIGluZGV4IG9mIHRoZSBzdHlsZSBpbiB0aGUgc3R5bGUgYmluZGluZ3MgYXJyYXkgdGhhdCB3YXMgcGFzc2VkIGludG9cbiAqICAgICAgICBgc3R5bGluZ2AuXG4gKiBAcGFyYW0gdmFsdWUgTmV3IHZhbHVlIHRvIHdyaXRlIChmYWxzeSB0byByZW1vdmUpLlxuICogQHBhcmFtIHN1ZmZpeCBPcHRpb25hbCBzdWZmaXguIFVzZWQgd2l0aCBzY2FsYXIgdmFsdWVzIHRvIGFkZCB1bml0IHN1Y2ggYXMgYHB4YC5cbiAqICAgICAgICBOb3RlIHRoYXQgd2hlbiBhIHN1ZmZpeCBpcyBwcm92aWRlZCB0aGVuIHRoZSB1bmRlcmx5aW5nIHNhbml0aXplciB3aWxsXG4gKiAgICAgICAgYmUgaWdub3JlZC5cbiAqIEBwYXJhbSBmb3JjZU92ZXJyaWRlIFdoZXRoZXIgb3Igbm90IHRvIHVwZGF0ZSB0aGUgc3R5bGluZyB2YWx1ZSBpbW1lZGlhdGVseVxuICogICAgICAgIChkZXNwaXRlIHRoZSBvdGhlciBiaW5kaW5ncyBwb3NzaWJseSBoYXZpbmcgcHJpb3JpdHkpXG4gKlxuICogTm90ZSB0aGF0IHRoaXMgd2lsbCBhcHBseSB0aGUgcHJvdmlkZWQgc3R5bGUgdmFsdWUgdG8gdGhlIGhvc3QgZWxlbWVudCBpZiB0aGlzIGZ1bmN0aW9uIGlzIGNhbGxlZFxuICogd2l0aGluIGEgaG9zdCBiaW5kaW5nLlxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1c3R5bGVQcm9wKFxuICAgIHN0eWxlSW5kZXg6IG51bWJlciwgdmFsdWU6IHN0cmluZyB8IG51bWJlciB8IFN0cmluZyB8IFBsYXllckZhY3RvcnkgfCBudWxsLFxuICAgIHN1ZmZpeD86IHN0cmluZyB8IG51bGwsIGZvcmNlT3ZlcnJpZGU/OiBib29sZWFuKTogdm9pZCB7XG4gIGNvbnN0IGluZGV4ID0gZ2V0U2VsZWN0ZWRJbmRleCgpO1xuICBjb25zdCB2YWx1ZVRvQWRkID0gcmVzb2x2ZVN0eWxlUHJvcFZhbHVlKHZhbHVlLCBzdWZmaXgpO1xuICBjb25zdCBzdHlsaW5nQ29udGV4dCA9IGdldFN0eWxpbmdDb250ZXh0KGluZGV4LCBnZXRMVmlldygpKTtcbiAgY29uc3QgZGlyZWN0aXZlU3R5bGluZ0luZGV4ID0gZ2V0QWN0aXZlRGlyZWN0aXZlU3R5bGluZ0luZGV4KCk7XG4gIGlmIChkaXJlY3RpdmVTdHlsaW5nSW5kZXgpIHtcbiAgICBjb25zdCBhcmdzOiBQYXJhbXNPZjx0eXBlb2YgdXBkYXRlc3R5bGVQcm9wPiA9XG4gICAgICAgIFtzdHlsaW5nQ29udGV4dCwgc3R5bGVJbmRleCwgdmFsdWVUb0FkZCwgZGlyZWN0aXZlU3R5bGluZ0luZGV4LCBmb3JjZU92ZXJyaWRlXTtcbiAgICBlbnF1ZXVlSG9zdEluc3RydWN0aW9uKHN0eWxpbmdDb250ZXh0LCBkaXJlY3RpdmVTdHlsaW5nSW5kZXgsIHVwZGF0ZXN0eWxlUHJvcCwgYXJncyk7XG4gIH0gZWxzZSB7XG4gICAgdXBkYXRlc3R5bGVQcm9wKFxuICAgICAgICBzdHlsaW5nQ29udGV4dCwgc3R5bGVJbmRleCwgdmFsdWVUb0FkZCwgREVGQVVMVF9URU1QTEFURV9ESVJFQ1RJVkVfSU5ERVgsIGZvcmNlT3ZlcnJpZGUpO1xuICB9XG5cbiAgaWYgKHJ1bnRpbWVJc05ld1N0eWxpbmdJblVzZSgpKSB7XG4gICAgY29uc3QgcHJvcCA9IGdldEJpbmRpbmdOYW1lRnJvbUluZGV4KHN0eWxpbmdDb250ZXh0LCBzdHlsZUluZGV4LCBkaXJlY3RpdmVTdHlsaW5nSW5kZXgsIGZhbHNlKTtcblxuICAgIC8vIHRoZSByZWFzb24gd2h5IHdlIGNhc3QgdGhlIHZhbHVlIGFzIGBib29sZWFuYCBpc1xuICAgIC8vIGJlY2F1c2UgdGhlIG5ldyBzdHlsaW5nIHJlZmFjdG9yIGRvZXMgbm90IHlldCBzdXBwb3J0XG4gICAgLy8gc2FuaXRpemF0aW9uIG9yIGFuaW1hdGlvbiBwbGF5ZXJzLlxuICAgIG5ld1N0eWxlUHJvcChwcm9wLCB2YWx1ZSBhcyBzdHJpbmcgfCBudW1iZXIsIHN1ZmZpeCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gcmVzb2x2ZVN0eWxlUHJvcFZhbHVlKFxuICAgIHZhbHVlOiBzdHJpbmcgfCBudW1iZXIgfCBTdHJpbmcgfCBQbGF5ZXJGYWN0b3J5IHwgbnVsbCwgc3VmZml4OiBzdHJpbmcgfCBudWxsIHwgdW5kZWZpbmVkKSB7XG4gIGxldCB2YWx1ZVRvQWRkOiBzdHJpbmd8bnVsbCA9IG51bGw7XG4gIGlmICh2YWx1ZSAhPT0gbnVsbCkge1xuICAgIGlmIChzdWZmaXgpIHtcbiAgICAgIC8vIHdoZW4gYSBzdWZmaXggaXMgYXBwbGllZCB0aGVuIGl0IHdpbGwgYnlwYXNzXG4gICAgICAvLyBzYW5pdGl6YXRpb24gZW50aXJlbHkgKGIvYyBhIG5ldyBzdHJpbmcgaXMgY3JlYXRlZClcbiAgICAgIHZhbHVlVG9BZGQgPSByZW5kZXJTdHJpbmdpZnkodmFsdWUpICsgc3VmZml4O1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBzYW5pdGl6YXRpb24gaGFwcGVucyBieSBkZWFsaW5nIHdpdGggYSBTdHJpbmcgdmFsdWVcbiAgICAgIC8vIHRoaXMgbWVhbnMgdGhhdCB0aGUgc3RyaW5nIHZhbHVlIHdpbGwgYmUgcGFzc2VkIHRocm91Z2hcbiAgICAgIC8vIGludG8gdGhlIHN0eWxlIHJlbmRlcmluZyBsYXRlciAod2hpY2ggaXMgd2hlcmUgdGhlIHZhbHVlXG4gICAgICAvLyB3aWxsIGJlIHNhbml0aXplZCBiZWZvcmUgaXQgaXMgYXBwbGllZClcbiAgICAgIHZhbHVlVG9BZGQgPSB2YWx1ZSBhcyBhbnkgYXMgc3RyaW5nO1xuICAgIH1cbiAgfVxuICByZXR1cm4gdmFsdWVUb0FkZDtcbn1cblxuXG4vKipcbiAqIFVwZGF0ZSBhIGNsYXNzIGJpbmRpbmcgb24gYW4gZWxlbWVudCB3aXRoIHRoZSBwcm92aWRlZCB2YWx1ZS5cbiAqXG4gKiBUaGlzIGluc3RydWN0aW9uIGlzIG1lYW50IHRvIGhhbmRsZSB0aGUgYFtjbGFzcy5mb29dPVwiZXhwXCJgIGNhc2UgYW5kLFxuICogdGhlcmVmb3JlLCB0aGUgY2xhc3MgYmluZGluZyBpdHNlbGYgbXVzdCBhbHJlYWR5IGJlIGFsbG9jYXRlZCB1c2luZ1xuICogYHN0eWxpbmdgIHdpdGhpbiB0aGUgY3JlYXRpb24gYmxvY2suXG4gKlxuICogQHBhcmFtIGNsYXNzSW5kZXggSW5kZXggb2YgY2xhc3MgdG8gdG9nZ2xlLiBUaGlzIGluZGV4IHZhbHVlIHJlZmVycyB0byB0aGVcbiAqICAgICAgICBpbmRleCBvZiB0aGUgY2xhc3MgaW4gdGhlIGNsYXNzIGJpbmRpbmdzIGFycmF5IHRoYXQgd2FzIHBhc3NlZCBpbnRvXG4gKiAgICAgICAgYHN0eWxpbmdgICh3aGljaCBpcyBtZWFudCB0byBiZSBjYWxsZWQgYmVmb3JlIHRoaXNcbiAqICAgICAgICBmdW5jdGlvbiBpcykuXG4gKiBAcGFyYW0gdmFsdWUgQSB0cnVlL2ZhbHNlIHZhbHVlIHdoaWNoIHdpbGwgdHVybiB0aGUgY2xhc3Mgb24gb3Igb2ZmLlxuICogQHBhcmFtIGZvcmNlT3ZlcnJpZGUgV2hldGhlciBvciBub3QgdGhpcyB2YWx1ZSB3aWxsIGJlIGFwcGxpZWQgcmVnYXJkbGVzc1xuICogICAgICAgIG9mIHdoZXJlIGl0IGlzIGJlaW5nIHNldCB3aXRoaW4gdGhlIHN0eWxpbmcgcHJpb3JpdHkgc3RydWN0dXJlLlxuICpcbiAqIE5vdGUgdGhhdCB0aGlzIHdpbGwgYXBwbHkgdGhlIHByb3ZpZGVkIGNsYXNzIHZhbHVlIHRvIHRoZSBob3N0IGVsZW1lbnQgaWYgdGhpcyBmdW5jdGlvblxuICogaXMgY2FsbGVkIHdpdGhpbiBhIGhvc3QgYmluZGluZy5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWNsYXNzUHJvcChcbiAgICBjbGFzc0luZGV4OiBudW1iZXIsIHZhbHVlOiBib29sZWFuIHwgUGxheWVyRmFjdG9yeSwgZm9yY2VPdmVycmlkZT86IGJvb2xlYW4pOiB2b2lkIHtcbiAgY29uc3QgaW5kZXggPSBnZXRTZWxlY3RlZEluZGV4KCk7XG4gIGNvbnN0IGlucHV0ID0gKHZhbHVlIGluc3RhbmNlb2YgQm91bmRQbGF5ZXJGYWN0b3J5KSA/XG4gICAgICAodmFsdWUgYXMgQm91bmRQbGF5ZXJGYWN0b3J5PGJvb2xlYW58bnVsbD4pIDpcbiAgICAgIGJvb2xlYW5Pck51bGwodmFsdWUpO1xuICBjb25zdCBkaXJlY3RpdmVTdHlsaW5nSW5kZXggPSBnZXRBY3RpdmVEaXJlY3RpdmVTdHlsaW5nSW5kZXgoKTtcbiAgY29uc3Qgc3R5bGluZ0NvbnRleHQgPSBnZXRTdHlsaW5nQ29udGV4dChpbmRleCwgZ2V0TFZpZXcoKSk7XG4gIGlmIChkaXJlY3RpdmVTdHlsaW5nSW5kZXgpIHtcbiAgICBjb25zdCBhcmdzOiBQYXJhbXNPZjx0eXBlb2YgdXBkYXRlY2xhc3NQcm9wPiA9XG4gICAgICAgIFtzdHlsaW5nQ29udGV4dCwgY2xhc3NJbmRleCwgaW5wdXQsIGRpcmVjdGl2ZVN0eWxpbmdJbmRleCwgZm9yY2VPdmVycmlkZV07XG4gICAgZW5xdWV1ZUhvc3RJbnN0cnVjdGlvbihzdHlsaW5nQ29udGV4dCwgZGlyZWN0aXZlU3R5bGluZ0luZGV4LCB1cGRhdGVjbGFzc1Byb3AsIGFyZ3MpO1xuICB9IGVsc2Uge1xuICAgIHVwZGF0ZWNsYXNzUHJvcChcbiAgICAgICAgc3R5bGluZ0NvbnRleHQsIGNsYXNzSW5kZXgsIGlucHV0LCBERUZBVUxUX1RFTVBMQVRFX0RJUkVDVElWRV9JTkRFWCwgZm9yY2VPdmVycmlkZSk7XG4gIH1cblxuICBpZiAocnVudGltZUlzTmV3U3R5bGluZ0luVXNlKCkpIHtcbiAgICBjb25zdCBwcm9wID0gZ2V0QmluZGluZ05hbWVGcm9tSW5kZXgoc3R5bGluZ0NvbnRleHQsIGNsYXNzSW5kZXgsIGRpcmVjdGl2ZVN0eWxpbmdJbmRleCwgdHJ1ZSk7XG5cbiAgICAvLyB0aGUgcmVhc29uIHdoeSB3ZSBjYXN0IHRoZSB2YWx1ZSBhcyBgYm9vbGVhbmAgaXNcbiAgICAvLyBiZWNhdXNlIHRoZSBuZXcgc3R5bGluZyByZWZhY3RvciBkb2VzIG5vdCB5ZXQgc3VwcG9ydFxuICAgIC8vIHNhbml0aXphdGlvbiBvciBhbmltYXRpb24gcGxheWVycy5cbiAgICBuZXdDbGFzc1Byb3AocHJvcCwgaW5wdXQgYXMgYm9vbGVhbik7XG4gIH1cbn1cblxuXG5mdW5jdGlvbiBib29sZWFuT3JOdWxsKHZhbHVlOiBhbnkpOiBib29sZWFufG51bGwge1xuICBpZiAodHlwZW9mIHZhbHVlID09PSAnYm9vbGVhbicpIHJldHVybiB2YWx1ZTtcbiAgcmV0dXJuIHZhbHVlID8gdHJ1ZSA6IG51bGw7XG59XG5cblxuLyoqXG4gKiBVcGRhdGUgc3R5bGUgYmluZGluZ3MgdXNpbmcgYW4gb2JqZWN0IGxpdGVyYWwgb24gYW4gZWxlbWVudC5cbiAqXG4gKiBUaGlzIGluc3RydWN0aW9uIGlzIG1lYW50IHRvIGFwcGx5IHN0eWxpbmcgdmlhIHRoZSBgW3N0eWxlXT1cImV4cFwiYCB0ZW1wbGF0ZSBiaW5kaW5ncy5cbiAqIFdoZW4gc3R5bGVzIGFyZSBhcHBsaWVkIHRvIHRoZSBlbGVtZW50IHRoZXkgd2lsbCB0aGVuIGJlIHVwZGF0ZWQgd2l0aCByZXNwZWN0IHRvXG4gKiBhbnkgc3R5bGVzL2NsYXNzZXMgc2V0IHZpYSBgc3R5bGVQcm9wYC4gSWYgYW55IHN0eWxlcyBhcmUgc2V0IHRvIGZhbHN5XG4gKiB0aGVuIHRoZXkgd2lsbCBiZSByZW1vdmVkIGZyb20gdGhlIGVsZW1lbnQuXG4gKlxuICogTm90ZSB0aGF0IHRoZSBzdHlsaW5nIGluc3RydWN0aW9uIHdpbGwgbm90IGJlIGFwcGxpZWQgdW50aWwgYHN0eWxpbmdBcHBseWAgaXMgY2FsbGVkLlxuICpcbiAqIEBwYXJhbSBzdHlsZXMgQSBrZXkvdmFsdWUgc3R5bGUgbWFwIG9mIHRoZSBzdHlsZXMgdGhhdCB3aWxsIGJlIGFwcGxpZWQgdG8gdGhlIGdpdmVuIGVsZW1lbnQuXG4gKiAgICAgICAgQW55IG1pc3Npbmcgc3R5bGVzICh0aGF0IGhhdmUgYWxyZWFkeSBiZWVuIGFwcGxpZWQgdG8gdGhlIGVsZW1lbnQgYmVmb3JlaGFuZCkgd2lsbCBiZVxuICogICAgICAgIHJlbW92ZWQgKHVuc2V0KSBmcm9tIHRoZSBlbGVtZW50J3Mgc3R5bGluZy5cbiAqXG4gKiBOb3RlIHRoYXQgdGhpcyB3aWxsIGFwcGx5IHRoZSBwcm92aWRlZCBzdHlsZU1hcCB2YWx1ZSB0byB0aGUgaG9zdCBlbGVtZW50IGlmIHRoaXMgZnVuY3Rpb25cbiAqIGlzIGNhbGxlZCB3aXRoaW4gYSBob3N0IGJpbmRpbmcuXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVzdHlsZU1hcChzdHlsZXM6IHtbc3R5bGVOYW1lOiBzdHJpbmddOiBhbnl9IHwgTk9fQ0hBTkdFIHwgbnVsbCk6IHZvaWQge1xuICBjb25zdCBpbmRleCA9IGdldFNlbGVjdGVkSW5kZXgoKTtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCBzdHlsaW5nQ29udGV4dCA9IGdldFN0eWxpbmdDb250ZXh0KGluZGV4LCBsVmlldyk7XG4gIGNvbnN0IGRpcmVjdGl2ZVN0eWxpbmdJbmRleCA9IGdldEFjdGl2ZURpcmVjdGl2ZVN0eWxpbmdJbmRleCgpO1xuICBpZiAoZGlyZWN0aXZlU3R5bGluZ0luZGV4KSB7XG4gICAgY29uc3QgYXJnczogUGFyYW1zT2Y8dHlwZW9mIHVwZGF0ZVN0eWxlTWFwPiA9IFtzdHlsaW5nQ29udGV4dCwgc3R5bGVzLCBkaXJlY3RpdmVTdHlsaW5nSW5kZXhdO1xuICAgIGVucXVldWVIb3N0SW5zdHJ1Y3Rpb24oc3R5bGluZ0NvbnRleHQsIGRpcmVjdGl2ZVN0eWxpbmdJbmRleCwgdXBkYXRlU3R5bGVNYXAsIGFyZ3MpO1xuICB9IGVsc2Uge1xuICAgIGNvbnN0IHROb2RlID0gZ2V0VE5vZGUoaW5kZXgsIGxWaWV3KTtcblxuICAgIC8vIGlucHV0cyBhcmUgb25seSBldmFsdWF0ZWQgZnJvbSBhIHRlbXBsYXRlIGJpbmRpbmcgaW50byBhIGRpcmVjdGl2ZSwgdGhlcmVmb3JlLFxuICAgIC8vIHRoZXJlIHNob3VsZCBub3QgYmUgYSBzaXR1YXRpb24gd2hlcmUgYSBkaXJlY3RpdmUgaG9zdCBiaW5kaW5ncyBmdW5jdGlvblxuICAgIC8vIGV2YWx1YXRlcyB0aGUgaW5wdXRzICh0aGlzIHNob3VsZCBvbmx5IGhhcHBlbiBpbiB0aGUgdGVtcGxhdGUgZnVuY3Rpb24pXG4gICAgaWYgKGhhc1N0eWxlSW5wdXQodE5vZGUpICYmIHN0eWxlcyAhPT0gTk9fQ0hBTkdFKSB7XG4gICAgICBjb25zdCBpbml0aWFsU3R5bGVzID0gZ2V0SW5pdGlhbENsYXNzTmFtZVZhbHVlKHN0eWxpbmdDb250ZXh0KTtcbiAgICAgIGNvbnN0IHN0eWxlSW5wdXRWYWwgPVxuICAgICAgICAgIChpbml0aWFsU3R5bGVzLmxlbmd0aCA/IChpbml0aWFsU3R5bGVzICsgJyAnKSA6ICcnKSArIGZvcmNlU3R5bGVzQXNTdHJpbmcoc3R5bGVzKTtcbiAgICAgIHNldElucHV0c0ZvclByb3BlcnR5KGxWaWV3LCB0Tm9kZS5pbnB1dHMgIVsnc3R5bGUnXSAhLCBzdHlsZUlucHV0VmFsKTtcbiAgICAgIHN0eWxlcyA9IE5PX0NIQU5HRTtcbiAgICB9XG4gICAgdXBkYXRlU3R5bGVNYXAoc3R5bGluZ0NvbnRleHQsIHN0eWxlcyk7XG4gIH1cblxuICBpZiAocnVudGltZUlzTmV3U3R5bGluZ0luVXNlKCkpIHtcbiAgICBuZXdTdHlsZU1hcChzdHlsZXMpO1xuICB9XG59XG5cblxuLyoqXG4gKiBVcGRhdGUgY2xhc3MgYmluZGluZ3MgdXNpbmcgYW4gb2JqZWN0IGxpdGVyYWwgb3IgY2xhc3Mtc3RyaW5nIG9uIGFuIGVsZW1lbnQuXG4gKlxuICogVGhpcyBpbnN0cnVjdGlvbiBpcyBtZWFudCB0byBhcHBseSBzdHlsaW5nIHZpYSB0aGUgYFtjbGFzc109XCJleHBcImAgdGVtcGxhdGUgYmluZGluZ3MuXG4gKiBXaGVuIGNsYXNzZXMgYXJlIGFwcGxpZWQgdG8gdGhlIGVsZW1lbnQgdGhleSB3aWxsIHRoZW4gYmUgdXBkYXRlZCB3aXRoXG4gKiByZXNwZWN0IHRvIGFueSBzdHlsZXMvY2xhc3NlcyBzZXQgdmlhIGBjbGFzc1Byb3BgLiBJZiBhbnlcbiAqIGNsYXNzZXMgYXJlIHNldCB0byBmYWxzeSB0aGVuIHRoZXkgd2lsbCBiZSByZW1vdmVkIGZyb20gdGhlIGVsZW1lbnQuXG4gKlxuICogTm90ZSB0aGF0IHRoZSBzdHlsaW5nIGluc3RydWN0aW9uIHdpbGwgbm90IGJlIGFwcGxpZWQgdW50aWwgYHN0eWxpbmdBcHBseWAgaXMgY2FsbGVkLlxuICogTm90ZSB0aGF0IHRoaXMgd2lsbCB0aGUgcHJvdmlkZWQgY2xhc3NNYXAgdmFsdWUgdG8gdGhlIGhvc3QgZWxlbWVudCBpZiB0aGlzIGZ1bmN0aW9uIGlzIGNhbGxlZFxuICogd2l0aGluIGEgaG9zdCBiaW5kaW5nLlxuICpcbiAqIEBwYXJhbSBjbGFzc2VzIEEga2V5L3ZhbHVlIG1hcCBvciBzdHJpbmcgb2YgQ1NTIGNsYXNzZXMgdGhhdCB3aWxsIGJlIGFkZGVkIHRvIHRoZVxuICogICAgICAgIGdpdmVuIGVsZW1lbnQuIEFueSBtaXNzaW5nIGNsYXNzZXMgKHRoYXQgaGF2ZSBhbHJlYWR5IGJlZW4gYXBwbGllZCB0byB0aGUgZWxlbWVudFxuICogICAgICAgIGJlZm9yZWhhbmQpIHdpbGwgYmUgcmVtb3ZlZCAodW5zZXQpIGZyb20gdGhlIGVsZW1lbnQncyBsaXN0IG9mIENTUyBjbGFzc2VzLlxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1Y2xhc3NNYXAoY2xhc3Nlczoge1tzdHlsZU5hbWU6IHN0cmluZ106IGFueX0gfCBOT19DSEFOR0UgfCBzdHJpbmcgfCBudWxsKTogdm9pZCB7XG4gIGNvbnN0IGluZGV4ID0gZ2V0U2VsZWN0ZWRJbmRleCgpO1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IHN0eWxpbmdDb250ZXh0ID0gZ2V0U3R5bGluZ0NvbnRleHQoaW5kZXgsIGxWaWV3KTtcbiAgY29uc3QgZGlyZWN0aXZlU3R5bGluZ0luZGV4ID0gZ2V0QWN0aXZlRGlyZWN0aXZlU3R5bGluZ0luZGV4KCk7XG4gIGlmIChkaXJlY3RpdmVTdHlsaW5nSW5kZXgpIHtcbiAgICBjb25zdCBhcmdzOiBQYXJhbXNPZjx0eXBlb2YgdXBkYXRlQ2xhc3NNYXA+ID0gW3N0eWxpbmdDb250ZXh0LCBjbGFzc2VzLCBkaXJlY3RpdmVTdHlsaW5nSW5kZXhdO1xuICAgIGVucXVldWVIb3N0SW5zdHJ1Y3Rpb24oc3R5bGluZ0NvbnRleHQsIGRpcmVjdGl2ZVN0eWxpbmdJbmRleCwgdXBkYXRlQ2xhc3NNYXAsIGFyZ3MpO1xuICB9IGVsc2Uge1xuICAgIGNvbnN0IHROb2RlID0gZ2V0VE5vZGUoaW5kZXgsIGxWaWV3KTtcbiAgICAvLyBpbnB1dHMgYXJlIG9ubHkgZXZhbHVhdGVkIGZyb20gYSB0ZW1wbGF0ZSBiaW5kaW5nIGludG8gYSBkaXJlY3RpdmUsIHRoZXJlZm9yZSxcbiAgICAvLyB0aGVyZSBzaG91bGQgbm90IGJlIGEgc2l0dWF0aW9uIHdoZXJlIGEgZGlyZWN0aXZlIGhvc3QgYmluZGluZ3MgZnVuY3Rpb25cbiAgICAvLyBldmFsdWF0ZXMgdGhlIGlucHV0cyAodGhpcyBzaG91bGQgb25seSBoYXBwZW4gaW4gdGhlIHRlbXBsYXRlIGZ1bmN0aW9uKVxuICAgIGlmIChoYXNDbGFzc0lucHV0KHROb2RlKSAmJiBjbGFzc2VzICE9PSBOT19DSEFOR0UpIHtcbiAgICAgIGNvbnN0IGluaXRpYWxDbGFzc2VzID0gZ2V0SW5pdGlhbENsYXNzTmFtZVZhbHVlKHN0eWxpbmdDb250ZXh0KTtcbiAgICAgIGNvbnN0IGNsYXNzSW5wdXRWYWwgPVxuICAgICAgICAgIChpbml0aWFsQ2xhc3Nlcy5sZW5ndGggPyAoaW5pdGlhbENsYXNzZXMgKyAnICcpIDogJycpICsgZm9yY2VDbGFzc2VzQXNTdHJpbmcoY2xhc3Nlcyk7XG4gICAgICBzZXRJbnB1dHNGb3JQcm9wZXJ0eShsVmlldywgdE5vZGUuaW5wdXRzICFbJ2NsYXNzJ10gISwgY2xhc3NJbnB1dFZhbCk7XG4gICAgICBjbGFzc2VzID0gTk9fQ0hBTkdFO1xuICAgIH1cbiAgICB1cGRhdGVDbGFzc01hcChzdHlsaW5nQ29udGV4dCwgY2xhc3Nlcyk7XG4gIH1cblxuICBpZiAocnVudGltZUlzTmV3U3R5bGluZ0luVXNlKCkpIHtcbiAgICBuZXdDbGFzc01hcChjbGFzc2VzKTtcbiAgfVxufVxuXG4vKipcbiAqIEFwcGx5IGFsbCBzdHlsZSBhbmQgY2xhc3MgYmluZGluZyB2YWx1ZXMgdG8gdGhlIGVsZW1lbnQuXG4gKlxuICogVGhpcyBpbnN0cnVjdGlvbiBpcyBtZWFudCB0byBiZSBydW4gYWZ0ZXIgYHN0eWxlTWFwYCwgYGNsYXNzTWFwYCxcbiAqIGBzdHlsZVByb3BgIG9yIGBjbGFzc1Byb3BgIGluc3RydWN0aW9ucyBoYXZlIGJlZW4gcnVuIGFuZCB3aWxsXG4gKiBvbmx5IGFwcGx5IHN0eWxpbmcgdG8gdGhlIGVsZW1lbnQgaWYgYW55IHN0eWxpbmcgYmluZGluZ3MgaGF2ZSBiZWVuIHVwZGF0ZWQuXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVzdHlsaW5nQXBwbHkoKTogdm9pZCB7XG4gIGNvbnN0IGluZGV4ID0gZ2V0U2VsZWN0ZWRJbmRleCgpO1xuICBjb25zdCBkaXJlY3RpdmVTdHlsaW5nSW5kZXggPVxuICAgICAgZ2V0QWN0aXZlRGlyZWN0aXZlU3R5bGluZ0luZGV4KCkgfHwgREVGQVVMVF9URU1QTEFURV9ESVJFQ1RJVkVfSU5ERVg7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgdE5vZGUgPSBnZXRUTm9kZShpbmRleCwgbFZpZXcpO1xuXG4gIC8vIGlmIGEgbm9uLWVsZW1lbnQgdmFsdWUgaXMgYmVpbmcgcHJvY2Vzc2VkIHRoZW4gd2UgY2FuJ3QgcmVuZGVyIHZhbHVlc1xuICAvLyBvbiB0aGUgZWxlbWVudCBhdCBhbGwgdGhlcmVmb3JlIGJ5IHNldHRpbmcgdGhlIHJlbmRlcmVyIHRvIG51bGwgdGhlblxuICAvLyB0aGUgc3R5bGluZyBhcHBseSBjb2RlIGtub3dzIG5vdCB0byBhY3R1YWxseSBhcHBseSB0aGUgdmFsdWVzLi4uXG4gIGNvbnN0IHJlbmRlcmVyID0gdE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkVsZW1lbnQgPyBsVmlld1tSRU5ERVJFUl0gOiBudWxsO1xuICBjb25zdCBpc0ZpcnN0UmVuZGVyID0gKGxWaWV3W0ZMQUdTXSAmIExWaWV3RmxhZ3MuRmlyc3RMVmlld1Bhc3MpICE9PSAwO1xuICBjb25zdCBzdHlsaW5nQ29udGV4dCA9IGdldFN0eWxpbmdDb250ZXh0KGluZGV4LCBsVmlldyk7XG5cbiAgaWYgKHJ1bnRpbWVBbGxvd09sZFN0eWxpbmcoKSkge1xuICAgIGNvbnN0IHRvdGFsUGxheWVyc1F1ZXVlZCA9IHJlbmRlclN0eWxpbmcoXG4gICAgICAgIHN0eWxpbmdDb250ZXh0LCByZW5kZXJlciwgbFZpZXcsIGlzRmlyc3RSZW5kZXIsIG51bGwsIG51bGwsIGRpcmVjdGl2ZVN0eWxpbmdJbmRleCk7XG4gICAgaWYgKHRvdGFsUGxheWVyc1F1ZXVlZCA+IDApIHtcbiAgICAgIGNvbnN0IHJvb3RDb250ZXh0ID0gZ2V0Um9vdENvbnRleHQobFZpZXcpO1xuICAgICAgc2NoZWR1bGVUaWNrKHJvb3RDb250ZXh0LCBSb290Q29udGV4dEZsYWdzLkZsdXNoUGxheWVycyk7XG4gICAgfVxuICB9XG5cbiAgLy8gYmVjYXVzZSBzZWxlY3QobikgbWF5IG5vdCBydW4gYmV0d2VlbiBldmVyeSBpbnN0cnVjdGlvbiwgdGhlIGNhY2hlZCBzdHlsaW5nXG4gIC8vIGNvbnRleHQgbWF5IG5vdCBnZXQgY2xlYXJlZCBiZXR3ZWVuIGVsZW1lbnRzLiBUaGUgcmVhc29uIGZvciB0aGlzIGlzIGJlY2F1c2VcbiAgLy8gc3R5bGluZyBiaW5kaW5ncyAobGlrZSBgW3N0eWxlXWAgYW5kIGBbY2xhc3NdYCkgYXJlIG5vdCByZWNvZ25pemVkIGFzIHByb3BlcnR5XG4gIC8vIGJpbmRpbmdzIGJ5IGRlZmF1bHQgc28gYSBzZWxlY3QobikgaW5zdHJ1Y3Rpb24gaXMgbm90IGdlbmVyYXRlZC4gVG8gZW5zdXJlIHRoZVxuICAvLyBjb250ZXh0IGlzIGxvYWRlZCBjb3JyZWN0bHkgZm9yIHRoZSBuZXh0IGVsZW1lbnQgdGhlIGNhY2hlIGJlbG93IGlzIHByZS1lbXB0aXZlbHlcbiAgLy8gY2xlYXJlZCBiZWNhdXNlIHRoZXJlIGlzIG5vIGNvZGUgaW4gQW5ndWxhciB0aGF0IGFwcGxpZXMgbW9yZSBzdHlsaW5nIGNvZGUgYWZ0ZXIgYVxuICAvLyBzdHlsaW5nIGZsdXNoIGhhcyBvY2N1cnJlZC4gTm90ZSB0aGF0IHRoaXMgd2lsbCBiZSBmaXhlZCBvbmNlIEZXLTEyNTQgbGFuZHMuXG4gIHNldENhY2hlZFN0eWxpbmdDb250ZXh0KG51bGwpO1xuXG4gIGlmIChydW50aW1lSXNOZXdTdHlsaW5nSW5Vc2UoKSkge1xuICAgIG5ld1N0eWxpbmdBcHBseSgpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRBY3RpdmVEaXJlY3RpdmVTdHlsaW5nSW5kZXgoKSB7XG4gIC8vIHdoZW5ldmVyIGEgZGlyZWN0aXZlJ3MgaG9zdEJpbmRpbmdzIGZ1bmN0aW9uIGlzIGNhbGxlZCBhIHVuaXF1ZUlkIHZhbHVlXG4gIC8vIGlzIGFzc2lnbmVkLiBOb3JtYWxseSB0aGlzIGlzIGVub3VnaCB0byBoZWxwIGRpc3Rpbmd1aXNoIG9uZSBkaXJlY3RpdmVcbiAgLy8gZnJvbSBhbm90aGVyIGZvciB0aGUgc3R5bGluZyBjb250ZXh0LCBidXQgdGhlcmUgYXJlIHNpdHVhdGlvbnMgd2hlcmUgYVxuICAvLyBzdWItY2xhc3MgZGlyZWN0aXZlIGNvdWxkIGluaGVyaXQgYW5kIGFzc2lnbiBzdHlsaW5nIGluIGNvbmNlcnQgd2l0aCBhXG4gIC8vIHBhcmVudCBkaXJlY3RpdmUuIFRvIGhlbHAgdGhlIHN0eWxpbmcgY29kZSBkaXN0aW5ndWlzaCBiZXR3ZWVuIGEgcGFyZW50XG4gIC8vIHN1Yi1jbGFzc2VkIGRpcmVjdGl2ZSB0aGUgaW5oZXJpdGFuY2UgZGVwdGggaXMgdGFrZW4gaW50byBhY2NvdW50IGFzIHdlbGwuXG4gIHJldHVybiBnZXRBY3RpdmVEaXJlY3RpdmVJZCgpICsgZ2V0QWN0aXZlRGlyZWN0aXZlU3VwZXJDbGFzc0RlcHRoKCk7XG59XG5cbmZ1bmN0aW9uIGdldFN0eWxpbmdDb250ZXh0KGluZGV4OiBudW1iZXIsIGxWaWV3OiBMVmlldykge1xuICBsZXQgY29udGV4dCA9IGdldENhY2hlZFN0eWxpbmdDb250ZXh0KCk7XG4gIGlmICghY29udGV4dCkge1xuICAgIGNvbnRleHQgPSBnZXRTdHlsaW5nQ29udGV4dEZyb21MVmlldyhpbmRleCArIEhFQURFUl9PRkZTRVQsIGxWaWV3KTtcbiAgICBzZXRDYWNoZWRTdHlsaW5nQ29udGV4dChjb250ZXh0KTtcbiAgfSBlbHNlIGlmIChuZ0Rldk1vZGUpIHtcbiAgICBjb25zdCBhY3R1YWxDb250ZXh0ID0gZ2V0U3R5bGluZ0NvbnRleHRGcm9tTFZpZXcoaW5kZXggKyBIRUFERVJfT0ZGU0VULCBsVmlldyk7XG4gICAgYXNzZXJ0RXF1YWwoY29udGV4dCwgYWN0dWFsQ29udGV4dCwgJ1RoZSBjYWNoZWQgc3R5bGluZyBjb250ZXh0IGlzIGludmFsaWQnKTtcbiAgfVxuICByZXR1cm4gY29udGV4dDtcbn1cbiJdfQ==