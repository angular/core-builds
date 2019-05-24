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
import { classProp as newClassProp, styleProp as newStyleProp, stylingApply as newStylingApply, stylingInit as newStylingInit } from '../styling_next/instructions';
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3R5bGluZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaW5zdHJ1Y3Rpb25zL3N0eWxpbmcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7OztBQVFBLE9BQU8sRUFBQyxXQUFXLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUc5QyxPQUFPLEVBQUMsS0FBSyxFQUFFLGFBQWEsRUFBcUIsUUFBUSxFQUFtQixNQUFNLG9CQUFvQixDQUFDO0FBQ3ZHLE9BQU8sRUFBQyxvQkFBb0IsRUFBRSxpQ0FBaUMsRUFBRSxRQUFRLEVBQUUsd0JBQXdCLEVBQUUsZ0JBQWdCLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDdkksT0FBTyxFQUFDLHdCQUF3QixFQUFFLGFBQWEsRUFBRSxjQUFjLEVBQUUsZUFBZSxJQUFJLGVBQWUsRUFBRSx5QkFBeUIsRUFBRSxjQUFjLEVBQUUsZUFBZSxJQUFJLGVBQWUsRUFBQyxNQUFNLHFDQUFxQyxDQUFDO0FBQy9OLE9BQU8sRUFBVyxzQkFBc0IsRUFBRSxxQkFBcUIsRUFBQyxNQUFNLG9DQUFvQyxDQUFDO0FBQzNHLE9BQU8sRUFBQyxrQkFBa0IsRUFBQyxNQUFNLDJCQUEyQixDQUFDO0FBQzdELE9BQU8sRUFBQyxnQ0FBZ0MsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQ25FLE9BQU8sRUFBQyx1QkFBdUIsRUFBRSx1QkFBdUIsRUFBQyxNQUFNLGtCQUFrQixDQUFDO0FBQ2xGLE9BQU8sRUFBQyxvQ0FBb0MsRUFBRSx5QkFBeUIsRUFBRSxvQkFBb0IsRUFBRSxtQkFBbUIsRUFBRSwwQkFBMEIsRUFBRSxhQUFhLEVBQUUsYUFBYSxFQUFDLE1BQU0saUJBQWlCLENBQUM7QUFDck0sT0FBTyxFQUFDLFNBQVMsSUFBSSxZQUFZLEVBQUUsU0FBUyxJQUFJLFlBQVksRUFBRSxZQUFZLElBQUksZUFBZSxFQUFFLFdBQVcsSUFBSSxjQUFjLEVBQUMs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QUFNLElBQUksU0FBUyxFQUFFOztjQUNkLGFBQWEsR0FBRywwQkFBMEIsQ0FBQyxLQUFLLEdBQUcsYUFBYSxFQUFFLEtBQUssQ0FBQztRQUM5RSxXQUFXLENBQUMsT0FBTyxFQUFFLGFBQWEsRUFBRSx1Q0FBdUMsQ0FBQyxDQUFDO0tBQzlFO0lBQ0QsT0FBTyxPQUFPLENBQUM7QUFDakIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCB7U3R5bGVTYW5pdGl6ZUZufSBmcm9tICcuLi8uLi9zYW5pdGl6YXRpb24vc3R5bGVfc2FuaXRpemVyJztcbmltcG9ydCB7YXNzZXJ0RXF1YWx9IGZyb20gJy4uLy4uL3V0aWwvYXNzZXJ0JztcbmltcG9ydCB7VE5vZGUsIFROb2RlVHlwZX0gZnJvbSAnLi4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7UGxheWVyRmFjdG9yeX0gZnJvbSAnLi4vaW50ZXJmYWNlcy9wbGF5ZXInO1xuaW1wb3J0IHtGTEFHUywgSEVBREVSX09GRlNFVCwgTFZpZXcsIExWaWV3RmxhZ3MsIFJFTkRFUkVSLCBSb290Q29udGV4dEZsYWdzfSBmcm9tICcuLi9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHtnZXRBY3RpdmVEaXJlY3RpdmVJZCwgZ2V0QWN0aXZlRGlyZWN0aXZlU3VwZXJDbGFzc0RlcHRoLCBnZXRMVmlldywgZ2V0UHJldmlvdXNPclBhcmVudFROb2RlLCBnZXRTZWxlY3RlZEluZGV4fSBmcm9tICcuLi9zdGF0ZSc7XG5pbXBvcnQge2dldEluaXRpYWxDbGFzc05hbWVWYWx1ZSwgcmVuZGVyU3R5bGluZywgdXBkYXRlQ2xhc3NNYXAsIHVwZGF0ZUNsYXNzUHJvcCBhcyB1cGRhdGVjbGFzc1Byb3AsIHVwZGF0ZUNvbnRleHRXaXRoQmluZGluZ3MsIHVwZGF0ZVN0eWxlTWFwLCB1cGRhdGVTdHlsZVByb3AgYXMgdXBkYXRlc3R5bGVQcm9wfSBmcm9tICcuLi9zdHlsaW5nL2NsYXNzX2FuZF9zdHlsZV9iaW5kaW5ncyc7XG5pbXBvcnQge1BhcmFtc09mLCBlbnF1ZXVlSG9zdEluc3RydWN0aW9uLCByZWdpc3Rlckhvc3REaXJlY3RpdmV9IGZyb20gJy4uL3N0eWxpbmcvaG9zdF9pbnN0cnVjdGlvbnNfcXVldWUnO1xuaW1wb3J0IHtCb3VuZFBsYXllckZhY3Rvcnl9IGZyb20gJy4uL3N0eWxpbmcvcGxheWVyX2ZhY3RvcnknO1xuaW1wb3J0IHtERUZBVUxUX1RFTVBMQVRFX0RJUkVDVElWRV9JTkRFWH0gZnJvbSAnLi4vc3R5bGluZy9zaGFyZWQnO1xuaW1wb3J0IHtnZXRDYWNoZWRTdHlsaW5nQ29udGV4dCwgc2V0Q2FjaGVkU3R5bGluZ0NvbnRleHR9IGZyb20gJy4uL3N0eWxpbmcvc3RhdGUnO1xuaW1wb3J0IHthbGxvY2F0ZU9yVXBkYXRlRGlyZWN0aXZlSW50b0NvbnRleHQsIGNyZWF0ZUVtcHR5U3R5bGluZ0NvbnRleHQsIGZvcmNlQ2xhc3Nlc0FzU3RyaW5nLCBmb3JjZVN0eWxlc0FzU3RyaW5nLCBnZXRTdHlsaW5nQ29udGV4dEZyb21MVmlldywgaGFzQ2xhc3NJbnB1dCwgaGFzU3R5bGVJbnB1dH0gZnJvbSAnLi4vc3R5bGluZy91dGlsJztcbmltcG9ydCB7Y2xhc3NQcm9wIGFzIG5ld0NsYXNzUHJvcCwgc3R5bGVQcm9wIGFzIG5ld1N0eWxlUHJvcCwgc3R5bGluZ0FwcGx5IGFzIG5ld1N0eWxpbmdBcHBseSwgc3R5bGluZ0luaXQgYXMgbmV3U3R5bGluZ0luaXR9IGZyb20gJy4uL3N0eWxpbmdfbmV4dC9pbnN0cnVjdGlvbnMnO1xuaW1wb3J0IHtydW50aW1lQWxsb3dPbGRTdHlsaW5nLCBydW50aW1lSXNOZXdTdHlsaW5nSW5Vc2V9IGZyb20gJy4uL3N0eWxpbmdfbmV4dC9zdGF0ZSc7XG5pbXBvcnQge2dldEJpbmRpbmdOYW1lRnJvbUluZGV4fSBmcm9tICcuLi9zdHlsaW5nX25leHQvdXRpbCc7XG5pbXBvcnQge05PX0NIQU5HRX0gZnJvbSAnLi4vdG9rZW5zJztcbmltcG9ydCB7cmVuZGVyU3RyaW5naWZ5fSBmcm9tICcuLi91dGlsL21pc2NfdXRpbHMnO1xuaW1wb3J0IHtnZXRSb290Q29udGV4dH0gZnJvbSAnLi4vdXRpbC92aWV3X3RyYXZlcnNhbF91dGlscyc7XG5pbXBvcnQge2dldFROb2RlfSBmcm9tICcuLi91dGlsL3ZpZXdfdXRpbHMnO1xuXG5pbXBvcnQge3NjaGVkdWxlVGljaywgc2V0SW5wdXRzRm9yUHJvcGVydHl9IGZyb20gJy4vc2hhcmVkJztcblxuXG5cbi8qXG4gKiBUaGUgY29udGVudHMgb2YgdGhpcyBmaWxlIGluY2x1ZGUgdGhlIGluc3RydWN0aW9ucyBmb3IgYWxsIHN0eWxpbmctcmVsYXRlZFxuICogb3BlcmF0aW9ucyBpbiBBbmd1bGFyLlxuICpcbiAqIFRoZSBpbnN0cnVjdGlvbnMgcHJlc2VudCBpbiB0aGlzIGZpbGUgYXJlOlxuICpcbiAqIFRlbXBsYXRlIGxldmVsIHN0eWxpbmcgaW5zdHJ1Y3Rpb25zOlxuICogLSBzdHlsaW5nXG4gKiAtIHN0eWxlTWFwXG4gKiAtIGNsYXNzTWFwXG4gKiAtIHN0eWxlUHJvcFxuICogLSBjbGFzc1Byb3BcbiAqIC0gc3R5bGluZ0FwcGx5XG4gKi9cblxuLyoqXG4gKiBBbGxvY2F0ZXMgc3R5bGUgYW5kIGNsYXNzIGJpbmRpbmcgcHJvcGVydGllcyBvbiB0aGUgZWxlbWVudCBkdXJpbmcgY3JlYXRpb24gbW9kZS5cbiAqXG4gKiBUaGlzIGluc3RydWN0aW9uIGlzIG1lYW50IHRvIGJlIGNhbGxlZCBkdXJpbmcgY3JlYXRpb24gbW9kZSB0byByZWdpc3RlciBhbGxcbiAqIGR5bmFtaWMgc3R5bGUgYW5kIGNsYXNzIGJpbmRpbmdzIG9uIHRoZSBlbGVtZW50LiBOb3RlIHRoYXQgdGhpcyBpcyBvbmx5IHVzZWRcbiAqIGZvciBiaW5kaW5nIHZhbHVlcyAoc2VlIGBlbGVtZW50U3RhcnRgIHRvIGxlYXJuIGhvdyB0byBhc3NpZ24gc3RhdGljIHN0eWxpbmdcbiAqIHZhbHVlcyB0byBhbiBlbGVtZW50KS5cbiAqXG4gKiBAcGFyYW0gY2xhc3NCaW5kaW5nTmFtZXMgQW4gYXJyYXkgY29udGFpbmluZyBiaW5kYWJsZSBjbGFzcyBuYW1lcy5cbiAqICAgICAgICBUaGUgYGNsYXNzUHJvcGAgaW5zdHJ1Y3Rpb24gcmVmZXJzIHRvIHRoZSBjbGFzcyBuYW1lIGJ5IGluZGV4IGluXG4gKiAgICAgICAgdGhpcyBhcnJheSAoaS5lLiBgWydmb28nLCAnYmFyJ11gIG1lYW5zIGBmb289MGAgYW5kIGBiYXI9MWApLlxuICogQHBhcmFtIHN0eWxlQmluZGluZ05hbWVzIEFuIGFycmF5IGNvbnRhaW5pbmcgYmluZGFibGUgc3R5bGUgcHJvcGVydGllcy5cbiAqICAgICAgICBUaGUgYHN0eWxlUHJvcGAgaW5zdHJ1Y3Rpb24gcmVmZXJzIHRvIHRoZSBjbGFzcyBuYW1lIGJ5IGluZGV4IGluXG4gKiAgICAgICAgdGhpcyBhcnJheSAoaS5lLiBgWyd3aWR0aCcsICdoZWlnaHQnXWAgbWVhbnMgYHdpZHRoPTBgIGFuZCBgaGVpZ2h0PTFgKS5cbiAqIEBwYXJhbSBzdHlsZVNhbml0aXplciBBbiBvcHRpb25hbCBzYW5pdGl6ZXIgZnVuY3Rpb24gdGhhdCB3aWxsIGJlIHVzZWQgdG8gc2FuaXRpemUgYW55IENTU1xuICogICAgICAgIHN0eWxlIHZhbHVlcyB0aGF0IGFyZSBhcHBsaWVkIHRvIHRoZSBlbGVtZW50IChkdXJpbmcgcmVuZGVyaW5nKS5cbiAqXG4gKiBOb3RlIHRoYXQgdGhpcyB3aWxsIGFsbG9jYXRlIHRoZSBwcm92aWRlZCBzdHlsZS9jbGFzcyBiaW5kaW5ncyB0byB0aGUgaG9zdCBlbGVtZW50IGlmXG4gKiB0aGlzIGZ1bmN0aW9uIGlzIGNhbGxlZCB3aXRoaW4gYSBob3N0IGJpbmRpbmcuXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVzdHlsaW5nKFxuICAgIGNsYXNzQmluZGluZ05hbWVzPzogc3RyaW5nW10gfCBudWxsLCBzdHlsZUJpbmRpbmdOYW1lcz86IHN0cmluZ1tdIHwgbnVsbCxcbiAgICBzdHlsZVNhbml0aXplcj86IFN0eWxlU2FuaXRpemVGbiB8IG51bGwpOiB2b2lkIHtcbiAgY29uc3QgdE5vZGUgPSBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKTtcbiAgaWYgKCF0Tm9kZS5zdHlsaW5nVGVtcGxhdGUpIHtcbiAgICB0Tm9kZS5zdHlsaW5nVGVtcGxhdGUgPSBjcmVhdGVFbXB0eVN0eWxpbmdDb250ZXh0KCk7XG4gIH1cblxuICBjb25zdCBkaXJlY3RpdmVTdHlsaW5nSW5kZXggPSBnZXRBY3RpdmVEaXJlY3RpdmVTdHlsaW5nSW5kZXgoKTtcbiAgaWYgKGRpcmVjdGl2ZVN0eWxpbmdJbmRleCkge1xuICAgIC8vIHRoaXMgaXMgdGVtcG9yYXJ5IGhhY2sgdG8gZ2V0IHRoZSBleGlzdGluZyBzdHlsaW5nIGluc3RydWN0aW9ucyB0b1xuICAgIC8vIHBsYXkgYmFsbCB3aXRoIHRoZSBuZXcgcmVmYWN0b3JlZCBpbXBsZW1lbnRhdGlvbi5cbiAgICAvLyBUT0RPIChtYXRza28pOiByZW1vdmUgdGhpcyBvbmNlIHRoZSBvbGQgaW1wbGVtZW50YXRpb24gaXMgbm90IG5lZWRlZC5cbiAgICBpZiAocnVudGltZUlzTmV3U3R5bGluZ0luVXNlKCkpIHtcbiAgICAgIG5ld1N0eWxpbmdJbml0KCk7XG4gICAgfVxuXG4gICAgLy8gZGVzcGl0ZSB0aGUgYmluZGluZyBiZWluZyBhcHBsaWVkIGluIGEgcXVldWUgKGJlbG93KSwgdGhlIGFsbG9jYXRpb25cbiAgICAvLyBvZiB0aGUgZGlyZWN0aXZlIGludG8gdGhlIGNvbnRleHQgaGFwcGVucyByaWdodCBhd2F5LiBUaGUgcmVhc29uIGZvclxuICAgIC8vIHRoaXMgaXMgdG8gcmV0YWluIHRoZSBvcmRlcmluZyBvZiB0aGUgZGlyZWN0aXZlcyAod2hpY2ggaXMgaW1wb3J0YW50XG4gICAgLy8gZm9yIHRoZSBwcmlvcml0aXphdGlvbiBvZiBiaW5kaW5ncykuXG4gICAgYWxsb2NhdGVPclVwZGF0ZURpcmVjdGl2ZUludG9Db250ZXh0KHROb2RlLnN0eWxpbmdUZW1wbGF0ZSwgZGlyZWN0aXZlU3R5bGluZ0luZGV4KTtcblxuICAgIGNvbnN0IGZucyA9IHROb2RlLm9uRWxlbWVudENyZWF0aW9uRm5zID0gdE5vZGUub25FbGVtZW50Q3JlYXRpb25GbnMgfHwgW107XG4gICAgZm5zLnB1c2goKCkgPT4ge1xuICAgICAgaW5pdFN0eWxpbmcoXG4gICAgICAgICAgdE5vZGUsIGNsYXNzQmluZGluZ05hbWVzLCBzdHlsZUJpbmRpbmdOYW1lcywgc3R5bGVTYW5pdGl6ZXIsIGRpcmVjdGl2ZVN0eWxpbmdJbmRleCk7XG4gICAgICByZWdpc3Rlckhvc3REaXJlY3RpdmUodE5vZGUuc3R5bGluZ1RlbXBsYXRlICEsIGRpcmVjdGl2ZVN0eWxpbmdJbmRleCk7XG4gICAgfSk7XG4gIH0gZWxzZSB7XG4gICAgLy8gY2FsbGluZyB0aGUgZnVuY3Rpb24gYmVsb3cgZW5zdXJlcyB0aGF0IHRoZSB0ZW1wbGF0ZSdzIGJpbmRpbmcgdmFsdWVzXG4gICAgLy8gYXJlIGFwcGxpZWQgYXMgdGhlIGZpcnN0IHNldCBvZiBiaW5kaW5ncyBpbnRvIHRoZSBjb250ZXh0LiBJZiBhbnkgb3RoZXJcbiAgICAvLyBzdHlsaW5nIGJpbmRpbmdzIGFyZSBzZXQgb24gdGhlIHNhbWUgZWxlbWVudCAoYnkgZGlyZWN0aXZlcyBhbmQvb3JcbiAgICAvLyBjb21wb25lbnRzKSB0aGVuIHRoZXkgd2lsbCBiZSBhcHBsaWVkIGF0IHRoZSBlbmQgb2YgdGhlIGBlbGVtZW50RW5kYFxuICAgIC8vIGluc3RydWN0aW9uIChiZWNhdXNlIGRpcmVjdGl2ZXMgYXJlIGNyZWF0ZWQgZmlyc3QgYmVmb3JlIHN0eWxpbmcgaXNcbiAgICAvLyBleGVjdXRlZCBmb3IgYSBuZXcgZWxlbWVudCkuXG4gICAgaW5pdFN0eWxpbmcoXG4gICAgICAgIHROb2RlLCBjbGFzc0JpbmRpbmdOYW1lcywgc3R5bGVCaW5kaW5nTmFtZXMsIHN0eWxlU2FuaXRpemVyLFxuICAgICAgICBERUZBVUxUX1RFTVBMQVRFX0RJUkVDVElWRV9JTkRFWCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gaW5pdFN0eWxpbmcoXG4gICAgdE5vZGU6IFROb2RlLCBjbGFzc0JpbmRpbmdOYW1lczogc3RyaW5nW10gfCBudWxsIHwgdW5kZWZpbmVkLFxuICAgIHN0eWxlQmluZGluZ05hbWVzOiBzdHJpbmdbXSB8IG51bGwgfCB1bmRlZmluZWQsXG4gICAgc3R5bGVTYW5pdGl6ZXI6IFN0eWxlU2FuaXRpemVGbiB8IG51bGwgfCB1bmRlZmluZWQsIGRpcmVjdGl2ZVN0eWxpbmdJbmRleDogbnVtYmVyKTogdm9pZCB7XG4gIHVwZGF0ZUNvbnRleHRXaXRoQmluZGluZ3MoXG4gICAgICB0Tm9kZS5zdHlsaW5nVGVtcGxhdGUgISwgZGlyZWN0aXZlU3R5bGluZ0luZGV4LCBjbGFzc0JpbmRpbmdOYW1lcywgc3R5bGVCaW5kaW5nTmFtZXMsXG4gICAgICBzdHlsZVNhbml0aXplcik7XG59XG5cblxuLyoqXG4gKiBVcGRhdGUgYSBzdHlsZSBiaW5kaW5nIG9uIGFuIGVsZW1lbnQgd2l0aCB0aGUgcHJvdmlkZWQgdmFsdWUuXG4gKlxuICogSWYgdGhlIHN0eWxlIHZhbHVlIGlzIGZhbHN5IHRoZW4gaXQgd2lsbCBiZSByZW1vdmVkIGZyb20gdGhlIGVsZW1lbnRcbiAqIChvciBhc3NpZ25lZCBhIGRpZmZlcmVudCB2YWx1ZSBkZXBlbmRpbmcgaWYgdGhlcmUgYXJlIGFueSBzdHlsZXMgcGxhY2VkXG4gKiBvbiB0aGUgZWxlbWVudCB3aXRoIGBzdHlsZU1hcGAgb3IgYW55IHN0YXRpYyBzdHlsZXMgdGhhdCBhcmVcbiAqIHByZXNlbnQgZnJvbSB3aGVuIHRoZSBlbGVtZW50IHdhcyBjcmVhdGVkIHdpdGggYHN0eWxpbmdgKS5cbiAqXG4gKiBOb3RlIHRoYXQgdGhlIHN0eWxpbmcgZWxlbWVudCBpcyB1cGRhdGVkIGFzIHBhcnQgb2YgYHN0eWxpbmdBcHBseWAuXG4gKlxuICogQHBhcmFtIHN0eWxlSW5kZXggSW5kZXggb2Ygc3R5bGUgdG8gdXBkYXRlLiBUaGlzIGluZGV4IHZhbHVlIHJlZmVycyB0byB0aGVcbiAqICAgICAgICBpbmRleCBvZiB0aGUgc3R5bGUgaW4gdGhlIHN0eWxlIGJpbmRpbmdzIGFycmF5IHRoYXQgd2FzIHBhc3NlZCBpbnRvXG4gKiAgICAgICAgYHN0eWxpbmdgLlxuICogQHBhcmFtIHZhbHVlIE5ldyB2YWx1ZSB0byB3cml0ZSAoZmFsc3kgdG8gcmVtb3ZlKS5cbiAqIEBwYXJhbSBzdWZmaXggT3B0aW9uYWwgc3VmZml4LiBVc2VkIHdpdGggc2NhbGFyIHZhbHVlcyB0byBhZGQgdW5pdCBzdWNoIGFzIGBweGAuXG4gKiAgICAgICAgTm90ZSB0aGF0IHdoZW4gYSBzdWZmaXggaXMgcHJvdmlkZWQgdGhlbiB0aGUgdW5kZXJseWluZyBzYW5pdGl6ZXIgd2lsbFxuICogICAgICAgIGJlIGlnbm9yZWQuXG4gKiBAcGFyYW0gZm9yY2VPdmVycmlkZSBXaGV0aGVyIG9yIG5vdCB0byB1cGRhdGUgdGhlIHN0eWxpbmcgdmFsdWUgaW1tZWRpYXRlbHlcbiAqICAgICAgICAoZGVzcGl0ZSB0aGUgb3RoZXIgYmluZGluZ3MgcG9zc2libHkgaGF2aW5nIHByaW9yaXR5KVxuICpcbiAqIE5vdGUgdGhhdCB0aGlzIHdpbGwgYXBwbHkgdGhlIHByb3ZpZGVkIHN0eWxlIHZhbHVlIHRvIHRoZSBob3N0IGVsZW1lbnQgaWYgdGhpcyBmdW5jdGlvbiBpcyBjYWxsZWRcbiAqIHdpdGhpbiBhIGhvc3QgYmluZGluZy5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtXN0eWxlUHJvcChcbiAgICBzdHlsZUluZGV4OiBudW1iZXIsIHZhbHVlOiBzdHJpbmcgfCBudW1iZXIgfCBTdHJpbmcgfCBQbGF5ZXJGYWN0b3J5IHwgbnVsbCxcbiAgICBzdWZmaXg/OiBzdHJpbmcgfCBudWxsLCBmb3JjZU92ZXJyaWRlPzogYm9vbGVhbik6IHZvaWQge1xuICBjb25zdCBpbmRleCA9IGdldFNlbGVjdGVkSW5kZXgoKTtcbiAgY29uc3QgdmFsdWVUb0FkZCA9IHJlc29sdmVTdHlsZVByb3BWYWx1ZSh2YWx1ZSwgc3VmZml4KTtcbiAgY29uc3Qgc3R5bGluZ0NvbnRleHQgPSBnZXRTdHlsaW5nQ29udGV4dChpbmRleCwgZ2V0TFZpZXcoKSk7XG4gIGNvbnN0IGRpcmVjdGl2ZVN0eWxpbmdJbmRleCA9IGdldEFjdGl2ZURpcmVjdGl2ZVN0eWxpbmdJbmRleCgpO1xuICBpZiAoZGlyZWN0aXZlU3R5bGluZ0luZGV4KSB7XG4gICAgY29uc3QgYXJnczogUGFyYW1zT2Y8dHlwZW9mIHVwZGF0ZXN0eWxlUHJvcD4gPVxuICAgICAgICBbc3R5bGluZ0NvbnRleHQsIHN0eWxlSW5kZXgsIHZhbHVlVG9BZGQsIGRpcmVjdGl2ZVN0eWxpbmdJbmRleCwgZm9yY2VPdmVycmlkZV07XG4gICAgZW5xdWV1ZUhvc3RJbnN0cnVjdGlvbihzdHlsaW5nQ29udGV4dCwgZGlyZWN0aXZlU3R5bGluZ0luZGV4LCB1cGRhdGVzdHlsZVByb3AsIGFyZ3MpO1xuICB9IGVsc2Uge1xuICAgIHVwZGF0ZXN0eWxlUHJvcChcbiAgICAgICAgc3R5bGluZ0NvbnRleHQsIHN0eWxlSW5kZXgsIHZhbHVlVG9BZGQsIERFRkFVTFRfVEVNUExBVEVfRElSRUNUSVZFX0lOREVYLCBmb3JjZU92ZXJyaWRlKTtcbiAgfVxuXG4gIGlmIChydW50aW1lSXNOZXdTdHlsaW5nSW5Vc2UoKSkge1xuICAgIGNvbnN0IHByb3AgPSBnZXRCaW5kaW5nTmFtZUZyb21JbmRleChzdHlsaW5nQ29udGV4dCwgc3R5bGVJbmRleCwgZGlyZWN0aXZlU3R5bGluZ0luZGV4LCBmYWxzZSk7XG5cbiAgICAvLyB0aGUgcmVhc29uIHdoeSB3ZSBjYXN0IHRoZSB2YWx1ZSBhcyBgYm9vbGVhbmAgaXNcbiAgICAvLyBiZWNhdXNlIHRoZSBuZXcgc3R5bGluZyByZWZhY3RvciBkb2VzIG5vdCB5ZXQgc3VwcG9ydFxuICAgIC8vIHNhbml0aXphdGlvbiBvciBhbmltYXRpb24gcGxheWVycy5cbiAgICBuZXdTdHlsZVByb3AocHJvcCwgdmFsdWUgYXMgc3RyaW5nIHwgbnVtYmVyLCBzdWZmaXgpO1xuICB9XG59XG5cbmZ1bmN0aW9uIHJlc29sdmVTdHlsZVByb3BWYWx1ZShcbiAgICB2YWx1ZTogc3RyaW5nIHwgbnVtYmVyIHwgU3RyaW5nIHwgUGxheWVyRmFjdG9yeSB8IG51bGwsIHN1ZmZpeDogc3RyaW5nIHwgbnVsbCB8IHVuZGVmaW5lZCkge1xuICBsZXQgdmFsdWVUb0FkZDogc3RyaW5nfG51bGwgPSBudWxsO1xuICBpZiAodmFsdWUgIT09IG51bGwpIHtcbiAgICBpZiAoc3VmZml4KSB7XG4gICAgICAvLyB3aGVuIGEgc3VmZml4IGlzIGFwcGxpZWQgdGhlbiBpdCB3aWxsIGJ5cGFzc1xuICAgICAgLy8gc2FuaXRpemF0aW9uIGVudGlyZWx5IChiL2MgYSBuZXcgc3RyaW5nIGlzIGNyZWF0ZWQpXG4gICAgICB2YWx1ZVRvQWRkID0gcmVuZGVyU3RyaW5naWZ5KHZhbHVlKSArIHN1ZmZpeDtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gc2FuaXRpemF0aW9uIGhhcHBlbnMgYnkgZGVhbGluZyB3aXRoIGEgU3RyaW5nIHZhbHVlXG4gICAgICAvLyB0aGlzIG1lYW5zIHRoYXQgdGhlIHN0cmluZyB2YWx1ZSB3aWxsIGJlIHBhc3NlZCB0aHJvdWdoXG4gICAgICAvLyBpbnRvIHRoZSBzdHlsZSByZW5kZXJpbmcgbGF0ZXIgKHdoaWNoIGlzIHdoZXJlIHRoZSB2YWx1ZVxuICAgICAgLy8gd2lsbCBiZSBzYW5pdGl6ZWQgYmVmb3JlIGl0IGlzIGFwcGxpZWQpXG4gICAgICB2YWx1ZVRvQWRkID0gdmFsdWUgYXMgYW55IGFzIHN0cmluZztcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHZhbHVlVG9BZGQ7XG59XG5cblxuLyoqXG4gKiBVcGRhdGUgYSBjbGFzcyBiaW5kaW5nIG9uIGFuIGVsZW1lbnQgd2l0aCB0aGUgcHJvdmlkZWQgdmFsdWUuXG4gKlxuICogVGhpcyBpbnN0cnVjdGlvbiBpcyBtZWFudCB0byBoYW5kbGUgdGhlIGBbY2xhc3MuZm9vXT1cImV4cFwiYCBjYXNlIGFuZCxcbiAqIHRoZXJlZm9yZSwgdGhlIGNsYXNzIGJpbmRpbmcgaXRzZWxmIG11c3QgYWxyZWFkeSBiZSBhbGxvY2F0ZWQgdXNpbmdcbiAqIGBzdHlsaW5nYCB3aXRoaW4gdGhlIGNyZWF0aW9uIGJsb2NrLlxuICpcbiAqIEBwYXJhbSBjbGFzc0luZGV4IEluZGV4IG9mIGNsYXNzIHRvIHRvZ2dsZS4gVGhpcyBpbmRleCB2YWx1ZSByZWZlcnMgdG8gdGhlXG4gKiAgICAgICAgaW5kZXggb2YgdGhlIGNsYXNzIGluIHRoZSBjbGFzcyBiaW5kaW5ncyBhcnJheSB0aGF0IHdhcyBwYXNzZWQgaW50b1xuICogICAgICAgIGBzdHlsaW5nYCAod2hpY2ggaXMgbWVhbnQgdG8gYmUgY2FsbGVkIGJlZm9yZSB0aGlzXG4gKiAgICAgICAgZnVuY3Rpb24gaXMpLlxuICogQHBhcmFtIHZhbHVlIEEgdHJ1ZS9mYWxzZSB2YWx1ZSB3aGljaCB3aWxsIHR1cm4gdGhlIGNsYXNzIG9uIG9yIG9mZi5cbiAqIEBwYXJhbSBmb3JjZU92ZXJyaWRlIFdoZXRoZXIgb3Igbm90IHRoaXMgdmFsdWUgd2lsbCBiZSBhcHBsaWVkIHJlZ2FyZGxlc3NcbiAqICAgICAgICBvZiB3aGVyZSBpdCBpcyBiZWluZyBzZXQgd2l0aGluIHRoZSBzdHlsaW5nIHByaW9yaXR5IHN0cnVjdHVyZS5cbiAqXG4gKiBOb3RlIHRoYXQgdGhpcyB3aWxsIGFwcGx5IHRoZSBwcm92aWRlZCBjbGFzcyB2YWx1ZSB0byB0aGUgaG9zdCBlbGVtZW50IGlmIHRoaXMgZnVuY3Rpb25cbiAqIGlzIGNhbGxlZCB3aXRoaW4gYSBob3N0IGJpbmRpbmcuXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVjbGFzc1Byb3AoXG4gICAgY2xhc3NJbmRleDogbnVtYmVyLCB2YWx1ZTogYm9vbGVhbiB8IFBsYXllckZhY3RvcnksIGZvcmNlT3ZlcnJpZGU/OiBib29sZWFuKTogdm9pZCB7XG4gIGNvbnN0IGluZGV4ID0gZ2V0U2VsZWN0ZWRJbmRleCgpO1xuICBjb25zdCBpbnB1dCA9ICh2YWx1ZSBpbnN0YW5jZW9mIEJvdW5kUGxheWVyRmFjdG9yeSkgP1xuICAgICAgKHZhbHVlIGFzIEJvdW5kUGxheWVyRmFjdG9yeTxib29sZWFufG51bGw+KSA6XG4gICAgICBib29sZWFuT3JOdWxsKHZhbHVlKTtcbiAgY29uc3QgZGlyZWN0aXZlU3R5bGluZ0luZGV4ID0gZ2V0QWN0aXZlRGlyZWN0aXZlU3R5bGluZ0luZGV4KCk7XG4gIGNvbnN0IHN0eWxpbmdDb250ZXh0ID0gZ2V0U3R5bGluZ0NvbnRleHQoaW5kZXgsIGdldExWaWV3KCkpO1xuICBpZiAoZGlyZWN0aXZlU3R5bGluZ0luZGV4KSB7XG4gICAgY29uc3QgYXJnczogUGFyYW1zT2Y8dHlwZW9mIHVwZGF0ZWNsYXNzUHJvcD4gPVxuICAgICAgICBbc3R5bGluZ0NvbnRleHQsIGNsYXNzSW5kZXgsIGlucHV0LCBkaXJlY3RpdmVTdHlsaW5nSW5kZXgsIGZvcmNlT3ZlcnJpZGVdO1xuICAgIGVucXVldWVIb3N0SW5zdHJ1Y3Rpb24oc3R5bGluZ0NvbnRleHQsIGRpcmVjdGl2ZVN0eWxpbmdJbmRleCwgdXBkYXRlY2xhc3NQcm9wLCBhcmdzKTtcbiAgfSBlbHNlIHtcbiAgICB1cGRhdGVjbGFzc1Byb3AoXG4gICAgICAgIHN0eWxpbmdDb250ZXh0LCBjbGFzc0luZGV4LCBpbnB1dCwgREVGQVVMVF9URU1QTEFURV9ESVJFQ1RJVkVfSU5ERVgsIGZvcmNlT3ZlcnJpZGUpO1xuICB9XG5cbiAgaWYgKHJ1bnRpbWVJc05ld1N0eWxpbmdJblVzZSgpKSB7XG4gICAgY29uc3QgcHJvcCA9IGdldEJpbmRpbmdOYW1lRnJvbUluZGV4KHN0eWxpbmdDb250ZXh0LCBjbGFzc0luZGV4LCBkaXJlY3RpdmVTdHlsaW5nSW5kZXgsIHRydWUpO1xuXG4gICAgLy8gdGhlIHJlYXNvbiB3aHkgd2UgY2FzdCB0aGUgdmFsdWUgYXMgYGJvb2xlYW5gIGlzXG4gICAgLy8gYmVjYXVzZSB0aGUgbmV3IHN0eWxpbmcgcmVmYWN0b3IgZG9lcyBub3QgeWV0IHN1cHBvcnRcbiAgICAvLyBzYW5pdGl6YXRpb24gb3IgYW5pbWF0aW9uIHBsYXllcnMuXG4gICAgbmV3Q2xhc3NQcm9wKHByb3AsIGlucHV0IGFzIGJvb2xlYW4pO1xuICB9XG59XG5cblxuZnVuY3Rpb24gYm9vbGVhbk9yTnVsbCh2YWx1ZTogYW55KTogYm9vbGVhbnxudWxsIHtcbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ2Jvb2xlYW4nKSByZXR1cm4gdmFsdWU7XG4gIHJldHVybiB2YWx1ZSA/IHRydWUgOiBudWxsO1xufVxuXG5cbi8qKlxuICogVXBkYXRlIHN0eWxlIGJpbmRpbmdzIHVzaW5nIGFuIG9iamVjdCBsaXRlcmFsIG9uIGFuIGVsZW1lbnQuXG4gKlxuICogVGhpcyBpbnN0cnVjdGlvbiBpcyBtZWFudCB0byBhcHBseSBzdHlsaW5nIHZpYSB0aGUgYFtzdHlsZV09XCJleHBcImAgdGVtcGxhdGUgYmluZGluZ3MuXG4gKiBXaGVuIHN0eWxlcyBhcmUgYXBwbGllZCB0byB0aGUgZWxlbWVudCB0aGV5IHdpbGwgdGhlbiBiZSB1cGRhdGVkIHdpdGggcmVzcGVjdCB0b1xuICogYW55IHN0eWxlcy9jbGFzc2VzIHNldCB2aWEgYHN0eWxlUHJvcGAuIElmIGFueSBzdHlsZXMgYXJlIHNldCB0byBmYWxzeVxuICogdGhlbiB0aGV5IHdpbGwgYmUgcmVtb3ZlZCBmcm9tIHRoZSBlbGVtZW50LlxuICpcbiAqIE5vdGUgdGhhdCB0aGUgc3R5bGluZyBpbnN0cnVjdGlvbiB3aWxsIG5vdCBiZSBhcHBsaWVkIHVudGlsIGBzdHlsaW5nQXBwbHlgIGlzIGNhbGxlZC5cbiAqXG4gKiBAcGFyYW0gc3R5bGVzIEEga2V5L3ZhbHVlIHN0eWxlIG1hcCBvZiB0aGUgc3R5bGVzIHRoYXQgd2lsbCBiZSBhcHBsaWVkIHRvIHRoZSBnaXZlbiBlbGVtZW50LlxuICogICAgICAgIEFueSBtaXNzaW5nIHN0eWxlcyAodGhhdCBoYXZlIGFscmVhZHkgYmVlbiBhcHBsaWVkIHRvIHRoZSBlbGVtZW50IGJlZm9yZWhhbmQpIHdpbGwgYmVcbiAqICAgICAgICByZW1vdmVkICh1bnNldCkgZnJvbSB0aGUgZWxlbWVudCdzIHN0eWxpbmcuXG4gKlxuICogTm90ZSB0aGF0IHRoaXMgd2lsbCBhcHBseSB0aGUgcHJvdmlkZWQgc3R5bGVNYXAgdmFsdWUgdG8gdGhlIGhvc3QgZWxlbWVudCBpZiB0aGlzIGZ1bmN0aW9uXG4gKiBpcyBjYWxsZWQgd2l0aGluIGEgaG9zdCBiaW5kaW5nLlxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1c3R5bGVNYXAoc3R5bGVzOiB7W3N0eWxlTmFtZTogc3RyaW5nXTogYW55fSB8IE5PX0NIQU5HRSB8IG51bGwpOiB2b2lkIHtcbiAgY29uc3QgaW5kZXggPSBnZXRTZWxlY3RlZEluZGV4KCk7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3Qgc3R5bGluZ0NvbnRleHQgPSBnZXRTdHlsaW5nQ29udGV4dChpbmRleCwgbFZpZXcpO1xuICBjb25zdCBkaXJlY3RpdmVTdHlsaW5nSW5kZXggPSBnZXRBY3RpdmVEaXJlY3RpdmVTdHlsaW5nSW5kZXgoKTtcbiAgaWYgKGRpcmVjdGl2ZVN0eWxpbmdJbmRleCkge1xuICAgIGNvbnN0IGFyZ3M6IFBhcmFtc09mPHR5cGVvZiB1cGRhdGVTdHlsZU1hcD4gPSBbc3R5bGluZ0NvbnRleHQsIHN0eWxlcywgZGlyZWN0aXZlU3R5bGluZ0luZGV4XTtcbiAgICBlbnF1ZXVlSG9zdEluc3RydWN0aW9uKHN0eWxpbmdDb250ZXh0LCBkaXJlY3RpdmVTdHlsaW5nSW5kZXgsIHVwZGF0ZVN0eWxlTWFwLCBhcmdzKTtcbiAgfSBlbHNlIHtcbiAgICBjb25zdCB0Tm9kZSA9IGdldFROb2RlKGluZGV4LCBsVmlldyk7XG5cbiAgICAvLyBpbnB1dHMgYXJlIG9ubHkgZXZhbHVhdGVkIGZyb20gYSB0ZW1wbGF0ZSBiaW5kaW5nIGludG8gYSBkaXJlY3RpdmUsIHRoZXJlZm9yZSxcbiAgICAvLyB0aGVyZSBzaG91bGQgbm90IGJlIGEgc2l0dWF0aW9uIHdoZXJlIGEgZGlyZWN0aXZlIGhvc3QgYmluZGluZ3MgZnVuY3Rpb25cbiAgICAvLyBldmFsdWF0ZXMgdGhlIGlucHV0cyAodGhpcyBzaG91bGQgb25seSBoYXBwZW4gaW4gdGhlIHRlbXBsYXRlIGZ1bmN0aW9uKVxuICAgIGlmIChoYXNTdHlsZUlucHV0KHROb2RlKSAmJiBzdHlsZXMgIT09IE5PX0NIQU5HRSkge1xuICAgICAgY29uc3QgaW5pdGlhbFN0eWxlcyA9IGdldEluaXRpYWxDbGFzc05hbWVWYWx1ZShzdHlsaW5nQ29udGV4dCk7XG4gICAgICBjb25zdCBzdHlsZUlucHV0VmFsID1cbiAgICAgICAgICAoaW5pdGlhbFN0eWxlcy5sZW5ndGggPyAoaW5pdGlhbFN0eWxlcyArICcgJykgOiAnJykgKyBmb3JjZVN0eWxlc0FzU3RyaW5nKHN0eWxlcyk7XG4gICAgICBzZXRJbnB1dHNGb3JQcm9wZXJ0eShsVmlldywgdE5vZGUuaW5wdXRzICFbJ3N0eWxlJ10gISwgc3R5bGVJbnB1dFZhbCk7XG4gICAgICBzdHlsZXMgPSBOT19DSEFOR0U7XG4gICAgfVxuICAgIHVwZGF0ZVN0eWxlTWFwKHN0eWxpbmdDb250ZXh0LCBzdHlsZXMpO1xuICB9XG59XG5cblxuLyoqXG4gKiBVcGRhdGUgY2xhc3MgYmluZGluZ3MgdXNpbmcgYW4gb2JqZWN0IGxpdGVyYWwgb3IgY2xhc3Mtc3RyaW5nIG9uIGFuIGVsZW1lbnQuXG4gKlxuICogVGhpcyBpbnN0cnVjdGlvbiBpcyBtZWFudCB0byBhcHBseSBzdHlsaW5nIHZpYSB0aGUgYFtjbGFzc109XCJleHBcImAgdGVtcGxhdGUgYmluZGluZ3MuXG4gKiBXaGVuIGNsYXNzZXMgYXJlIGFwcGxpZWQgdG8gdGhlIGVsZW1lbnQgdGhleSB3aWxsIHRoZW4gYmUgdXBkYXRlZCB3aXRoXG4gKiByZXNwZWN0IHRvIGFueSBzdHlsZXMvY2xhc3NlcyBzZXQgdmlhIGBjbGFzc1Byb3BgLiBJZiBhbnlcbiAqIGNsYXNzZXMgYXJlIHNldCB0byBmYWxzeSB0aGVuIHRoZXkgd2lsbCBiZSByZW1vdmVkIGZyb20gdGhlIGVsZW1lbnQuXG4gKlxuICogTm90ZSB0aGF0IHRoZSBzdHlsaW5nIGluc3RydWN0aW9uIHdpbGwgbm90IGJlIGFwcGxpZWQgdW50aWwgYHN0eWxpbmdBcHBseWAgaXMgY2FsbGVkLlxuICogTm90ZSB0aGF0IHRoaXMgd2lsbCB0aGUgcHJvdmlkZWQgY2xhc3NNYXAgdmFsdWUgdG8gdGhlIGhvc3QgZWxlbWVudCBpZiB0aGlzIGZ1bmN0aW9uIGlzIGNhbGxlZFxuICogd2l0aGluIGEgaG9zdCBiaW5kaW5nLlxuICpcbiAqIEBwYXJhbSBjbGFzc2VzIEEga2V5L3ZhbHVlIG1hcCBvciBzdHJpbmcgb2YgQ1NTIGNsYXNzZXMgdGhhdCB3aWxsIGJlIGFkZGVkIHRvIHRoZVxuICogICAgICAgIGdpdmVuIGVsZW1lbnQuIEFueSBtaXNzaW5nIGNsYXNzZXMgKHRoYXQgaGF2ZSBhbHJlYWR5IGJlZW4gYXBwbGllZCB0byB0aGUgZWxlbWVudFxuICogICAgICAgIGJlZm9yZWhhbmQpIHdpbGwgYmUgcmVtb3ZlZCAodW5zZXQpIGZyb20gdGhlIGVsZW1lbnQncyBsaXN0IG9mIENTUyBjbGFzc2VzLlxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1Y2xhc3NNYXAoY2xhc3Nlczoge1tzdHlsZU5hbWU6IHN0cmluZ106IGFueX0gfCBOT19DSEFOR0UgfCBzdHJpbmcgfCBudWxsKTogdm9pZCB7XG4gIGNvbnN0IGluZGV4ID0gZ2V0U2VsZWN0ZWRJbmRleCgpO1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IHN0eWxpbmdDb250ZXh0ID0gZ2V0U3R5bGluZ0NvbnRleHQoaW5kZXgsIGxWaWV3KTtcbiAgY29uc3QgZGlyZWN0aXZlU3R5bGluZ0luZGV4ID0gZ2V0QWN0aXZlRGlyZWN0aXZlU3R5bGluZ0luZGV4KCk7XG4gIGlmIChkaXJlY3RpdmVTdHlsaW5nSW5kZXgpIHtcbiAgICBjb25zdCBhcmdzOiBQYXJhbXNPZjx0eXBlb2YgdXBkYXRlQ2xhc3NNYXA+ID0gW3N0eWxpbmdDb250ZXh0LCBjbGFzc2VzLCBkaXJlY3RpdmVTdHlsaW5nSW5kZXhdO1xuICAgIGVucXVldWVIb3N0SW5zdHJ1Y3Rpb24oc3R5bGluZ0NvbnRleHQsIGRpcmVjdGl2ZVN0eWxpbmdJbmRleCwgdXBkYXRlQ2xhc3NNYXAsIGFyZ3MpO1xuICB9IGVsc2Uge1xuICAgIGNvbnN0IHROb2RlID0gZ2V0VE5vZGUoaW5kZXgsIGxWaWV3KTtcbiAgICAvLyBpbnB1dHMgYXJlIG9ubHkgZXZhbHVhdGVkIGZyb20gYSB0ZW1wbGF0ZSBiaW5kaW5nIGludG8gYSBkaXJlY3RpdmUsIHRoZXJlZm9yZSxcbiAgICAvLyB0aGVyZSBzaG91bGQgbm90IGJlIGEgc2l0dWF0aW9uIHdoZXJlIGEgZGlyZWN0aXZlIGhvc3QgYmluZGluZ3MgZnVuY3Rpb25cbiAgICAvLyBldmFsdWF0ZXMgdGhlIGlucHV0cyAodGhpcyBzaG91bGQgb25seSBoYXBwZW4gaW4gdGhlIHRlbXBsYXRlIGZ1bmN0aW9uKVxuICAgIGlmIChoYXNDbGFzc0lucHV0KHROb2RlKSAmJiBjbGFzc2VzICE9PSBOT19DSEFOR0UpIHtcbiAgICAgIGNvbnN0IGluaXRpYWxDbGFzc2VzID0gZ2V0SW5pdGlhbENsYXNzTmFtZVZhbHVlKHN0eWxpbmdDb250ZXh0KTtcbiAgICAgIGNvbnN0IGNsYXNzSW5wdXRWYWwgPVxuICAgICAgICAgIChpbml0aWFsQ2xhc3Nlcy5sZW5ndGggPyAoaW5pdGlhbENsYXNzZXMgKyAnICcpIDogJycpICsgZm9yY2VDbGFzc2VzQXNTdHJpbmcoY2xhc3Nlcyk7XG4gICAgICBzZXRJbnB1dHNGb3JQcm9wZXJ0eShsVmlldywgdE5vZGUuaW5wdXRzICFbJ2NsYXNzJ10gISwgY2xhc3NJbnB1dFZhbCk7XG4gICAgICBjbGFzc2VzID0gTk9fQ0hBTkdFO1xuICAgIH1cbiAgICB1cGRhdGVDbGFzc01hcChzdHlsaW5nQ29udGV4dCwgY2xhc3Nlcyk7XG4gIH1cbn1cblxuLyoqXG4gKiBBcHBseSBhbGwgc3R5bGUgYW5kIGNsYXNzIGJpbmRpbmcgdmFsdWVzIHRvIHRoZSBlbGVtZW50LlxuICpcbiAqIFRoaXMgaW5zdHJ1Y3Rpb24gaXMgbWVhbnQgdG8gYmUgcnVuIGFmdGVyIGBzdHlsZU1hcGAsIGBjbGFzc01hcGAsXG4gKiBgc3R5bGVQcm9wYCBvciBgY2xhc3NQcm9wYCBpbnN0cnVjdGlvbnMgaGF2ZSBiZWVuIHJ1biBhbmQgd2lsbFxuICogb25seSBhcHBseSBzdHlsaW5nIHRvIHRoZSBlbGVtZW50IGlmIGFueSBzdHlsaW5nIGJpbmRpbmdzIGhhdmUgYmVlbiB1cGRhdGVkLlxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1c3R5bGluZ0FwcGx5KCk6IHZvaWQge1xuICBjb25zdCBpbmRleCA9IGdldFNlbGVjdGVkSW5kZXgoKTtcbiAgY29uc3QgZGlyZWN0aXZlU3R5bGluZ0luZGV4ID1cbiAgICAgIGdldEFjdGl2ZURpcmVjdGl2ZVN0eWxpbmdJbmRleCgpIHx8IERFRkFVTFRfVEVNUExBVEVfRElSRUNUSVZFX0lOREVYO1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IHROb2RlID0gZ2V0VE5vZGUoaW5kZXgsIGxWaWV3KTtcblxuICAvLyBpZiBhIG5vbi1lbGVtZW50IHZhbHVlIGlzIGJlaW5nIHByb2Nlc3NlZCB0aGVuIHdlIGNhbid0IHJlbmRlciB2YWx1ZXNcbiAgLy8gb24gdGhlIGVsZW1lbnQgYXQgYWxsIHRoZXJlZm9yZSBieSBzZXR0aW5nIHRoZSByZW5kZXJlciB0byBudWxsIHRoZW5cbiAgLy8gdGhlIHN0eWxpbmcgYXBwbHkgY29kZSBrbm93cyBub3QgdG8gYWN0dWFsbHkgYXBwbHkgdGhlIHZhbHVlcy4uLlxuICBjb25zdCByZW5kZXJlciA9IHROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5FbGVtZW50ID8gbFZpZXdbUkVOREVSRVJdIDogbnVsbDtcbiAgY29uc3QgaXNGaXJzdFJlbmRlciA9IChsVmlld1tGTEFHU10gJiBMVmlld0ZsYWdzLkZpcnN0TFZpZXdQYXNzKSAhPT0gMDtcbiAgY29uc3Qgc3R5bGluZ0NvbnRleHQgPSBnZXRTdHlsaW5nQ29udGV4dChpbmRleCwgbFZpZXcpO1xuXG4gIGlmIChydW50aW1lQWxsb3dPbGRTdHlsaW5nKCkpIHtcbiAgICBjb25zdCB0b3RhbFBsYXllcnNRdWV1ZWQgPSByZW5kZXJTdHlsaW5nKFxuICAgICAgICBzdHlsaW5nQ29udGV4dCwgcmVuZGVyZXIsIGxWaWV3LCBpc0ZpcnN0UmVuZGVyLCBudWxsLCBudWxsLCBkaXJlY3RpdmVTdHlsaW5nSW5kZXgpO1xuICAgIGlmICh0b3RhbFBsYXllcnNRdWV1ZWQgPiAwKSB7XG4gICAgICBjb25zdCByb290Q29udGV4dCA9IGdldFJvb3RDb250ZXh0KGxWaWV3KTtcbiAgICAgIHNjaGVkdWxlVGljayhyb290Q29udGV4dCwgUm9vdENvbnRleHRGbGFncy5GbHVzaFBsYXllcnMpO1xuICAgIH1cbiAgfVxuXG4gIC8vIGJlY2F1c2Ugc2VsZWN0KG4pIG1heSBub3QgcnVuIGJldHdlZW4gZXZlcnkgaW5zdHJ1Y3Rpb24sIHRoZSBjYWNoZWQgc3R5bGluZ1xuICAvLyBjb250ZXh0IG1heSBub3QgZ2V0IGNsZWFyZWQgYmV0d2VlbiBlbGVtZW50cy4gVGhlIHJlYXNvbiBmb3IgdGhpcyBpcyBiZWNhdXNlXG4gIC8vIHN0eWxpbmcgYmluZGluZ3MgKGxpa2UgYFtzdHlsZV1gIGFuZCBgW2NsYXNzXWApIGFyZSBub3QgcmVjb2duaXplZCBhcyBwcm9wZXJ0eVxuICAvLyBiaW5kaW5ncyBieSBkZWZhdWx0IHNvIGEgc2VsZWN0KG4pIGluc3RydWN0aW9uIGlzIG5vdCBnZW5lcmF0ZWQuIFRvIGVuc3VyZSB0aGVcbiAgLy8gY29udGV4dCBpcyBsb2FkZWQgY29ycmVjdGx5IGZvciB0aGUgbmV4dCBlbGVtZW50IHRoZSBjYWNoZSBiZWxvdyBpcyBwcmUtZW1wdGl2ZWx5XG4gIC8vIGNsZWFyZWQgYmVjYXVzZSB0aGVyZSBpcyBubyBjb2RlIGluIEFuZ3VsYXIgdGhhdCBhcHBsaWVzIG1vcmUgc3R5bGluZyBjb2RlIGFmdGVyIGFcbiAgLy8gc3R5bGluZyBmbHVzaCBoYXMgb2NjdXJyZWQuIE5vdGUgdGhhdCB0aGlzIHdpbGwgYmUgZml4ZWQgb25jZSBGVy0xMjU0IGxhbmRzLlxuICBzZXRDYWNoZWRTdHlsaW5nQ29udGV4dChudWxsKTtcblxuICBpZiAocnVudGltZUlzTmV3U3R5bGluZ0luVXNlKCkpIHtcbiAgICBuZXdTdHlsaW5nQXBwbHkoKTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0QWN0aXZlRGlyZWN0aXZlU3R5bGluZ0luZGV4KCkge1xuICAvLyB3aGVuZXZlciBhIGRpcmVjdGl2ZSdzIGhvc3RCaW5kaW5ncyBmdW5jdGlvbiBpcyBjYWxsZWQgYSB1bmlxdWVJZCB2YWx1ZVxuICAvLyBpcyBhc3NpZ25lZC4gTm9ybWFsbHkgdGhpcyBpcyBlbm91Z2ggdG8gaGVscCBkaXN0aW5ndWlzaCBvbmUgZGlyZWN0aXZlXG4gIC8vIGZyb20gYW5vdGhlciBmb3IgdGhlIHN0eWxpbmcgY29udGV4dCwgYnV0IHRoZXJlIGFyZSBzaXR1YXRpb25zIHdoZXJlIGFcbiAgLy8gc3ViLWNsYXNzIGRpcmVjdGl2ZSBjb3VsZCBpbmhlcml0IGFuZCBhc3NpZ24gc3R5bGluZyBpbiBjb25jZXJ0IHdpdGggYVxuICAvLyBwYXJlbnQgZGlyZWN0aXZlLiBUbyBoZWxwIHRoZSBzdHlsaW5nIGNvZGUgZGlzdGluZ3Vpc2ggYmV0d2VlbiBhIHBhcmVudFxuICAvLyBzdWItY2xhc3NlZCBkaXJlY3RpdmUgdGhlIGluaGVyaXRhbmNlIGRlcHRoIGlzIHRha2VuIGludG8gYWNjb3VudCBhcyB3ZWxsLlxuICByZXR1cm4gZ2V0QWN0aXZlRGlyZWN0aXZlSWQoKSArIGdldEFjdGl2ZURpcmVjdGl2ZVN1cGVyQ2xhc3NEZXB0aCgpO1xufVxuXG5mdW5jdGlvbiBnZXRTdHlsaW5nQ29udGV4dChpbmRleDogbnVtYmVyLCBsVmlldzogTFZpZXcpIHtcbiAgbGV0IGNvbnRleHQgPSBnZXRDYWNoZWRTdHlsaW5nQ29udGV4dCgpO1xuICBpZiAoIWNvbnRleHQpIHtcbiAgICBjb250ZXh0ID0gZ2V0U3R5bGluZ0NvbnRleHRGcm9tTFZpZXcoaW5kZXggKyBIRUFERVJfT0ZGU0VULCBsVmlldyk7XG4gICAgc2V0Q2FjaGVkU3R5bGluZ0NvbnRleHQoY29udGV4dCk7XG4gIH0gZWxzZSBpZiAobmdEZXZNb2RlKSB7XG4gICAgY29uc3QgYWN0dWFsQ29udGV4dCA9IGdldFN0eWxpbmdDb250ZXh0RnJvbUxWaWV3KGluZGV4ICsgSEVBREVSX09GRlNFVCwgbFZpZXcpO1xuICAgIGFzc2VydEVxdWFsKGNvbnRleHQsIGFjdHVhbENvbnRleHQsICdUaGUgY2FjaGVkIHN0eWxpbmcgY29udGV4dCBpcyBpbnZhbGlkJyk7XG4gIH1cbiAgcmV0dXJuIGNvbnRleHQ7XG59XG4iXX0=