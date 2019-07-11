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
 * @param classBindingNames An array containing bindable class names.
 *        The `classProp` instruction refers to the class name by index in
 *        this array (i.e. `['foo', 'bar']` means `foo=0` and `bar=1`).
 * @param styleBindingNames An array containing bindable style properties.
 *        The `styleProp` instruction refers to the class name by index in
 *        this array (i.e. `['width', 'height']` means `width=0` and `height=1`).
 * @param styleSanitizer An optional sanitizer function that will be used to sanitize any CSS
 *        style values that are applied to the element (during rendering).
 *
 * Note that this will allocate the provided style/class bindings to the host element if
 * this function is called within a host binding.
 *
 * @codeGenApi
 */
export function ɵɵstyling(classBindingNames, styleBindingNames, styleSanitizer) {
    var tNode = getPreviousOrParentTNode();
    if (!tNode.stylingTemplate) {
        tNode.stylingTemplate = createEmptyStylingContext();
    }
    var directiveStylingIndex = getActiveDirectiveStylingIndex();
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
        var fns = tNode.onElementCreationFns = tNode.onElementCreationFns || [];
        fns.push(function () {
            initStyling(tNode, classBindingNames, styleBindingNames, styleSanitizer, directiveStylingIndex);
            registerHostDirective(tNode.stylingTemplate, directiveStylingIndex);
        });
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
function initStyling(tNode, classBindingNames, styleBindingNames, styleSanitizer, directiveStylingIndex) {
    updateContextWithBindings(tNode.stylingTemplate, directiveStylingIndex, classBindingNames, styleBindingNames, styleSanitizer);
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
 * @param styleIndex Index of style to update. This index value refers to the
 *        index of the style in the style bindings array that was passed into
 *        `styling`.
 * @param value New value to write (falsy to remove).
 * @param suffix Optional suffix. Used with scalar values to add unit such as `px`.
 *        Note that when a suffix is provided then the underlying sanitizer will
 *        be ignored.
 * @param forceOverride Whether or not to update the styling value immediately
 *        (despite the other bindings possibly having priority)
 *
 * Note that this will apply the provided style value to the host element if this function is called
 * within a host binding.
 *
 * @codeGenApi
 */
export function ɵɵstyleProp(styleIndex, value, suffix, forceOverride) {
    stylePropInternal(getLView(), getSelectedIndex(), styleIndex, getActiveDirectiveStylingIndex(), value, suffix, forceOverride);
}
export function stylePropInternal(lView, selectedIndex, styleIndex, directiveStylingIndex, value, suffix, forceOverride) {
    var valueToAdd = resolveStylePropValue(value, suffix);
    var stylingContext = getStylingContext(selectedIndex, lView);
    if (directiveStylingIndex) {
        var args = [stylingContext, styleIndex, valueToAdd, directiveStylingIndex, forceOverride];
        enqueueHostInstruction(stylingContext, directiveStylingIndex, updatestyleProp, args);
    }
    else {
        updatestyleProp(stylingContext, styleIndex, valueToAdd, DEFAULT_TEMPLATE_DIRECTIVE_INDEX, forceOverride);
    }
    if (runtimeIsNewStylingInUse()) {
        var prop = getBindingNameFromIndex(stylingContext, styleIndex, directiveStylingIndex, false);
        // the reason why we cast the value as `boolean` is
        // because the new styling refactor does not yet support
        // sanitization or animation players.
        newStyleProp(prop, value, suffix);
    }
}
function resolveStylePropValue(value, suffix) {
    var valueToAdd = null;
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
            valueToAdd = value;
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
 * @param classIndex Index of class to toggle. This index value refers to the
 *        index of the class in the class bindings array that was passed into
 *        `styling` (which is meant to be called before this
 *        function is).
 * @param value A true/false value which will turn the class on or off.
 * @param forceOverride Whether or not this value will be applied regardless
 *        of where it is being set within the styling priority structure.
 *
 * Note that this will apply the provided class value to the host element if this function
 * is called within a host binding.
 *
 * @codeGenApi
 */
export function ɵɵclassProp(classIndex, value, forceOverride) {
    var index = getSelectedIndex();
    var input = (value instanceof BoundPlayerFactory) ?
        value :
        booleanOrNull(value);
    var directiveStylingIndex = getActiveDirectiveStylingIndex();
    var stylingContext = getStylingContext(index, getLView());
    if (directiveStylingIndex) {
        var args = [stylingContext, classIndex, input, directiveStylingIndex, forceOverride];
        enqueueHostInstruction(stylingContext, directiveStylingIndex, updateclassProp, args);
    }
    else {
        updateclassProp(stylingContext, classIndex, input, DEFAULT_TEMPLATE_DIRECTIVE_INDEX, forceOverride);
    }
    if (runtimeIsNewStylingInUse()) {
        var prop = getBindingNameFromIndex(stylingContext, classIndex, directiveStylingIndex, true);
        // the reason why we cast the value as `boolean` is
        // because the new styling refactor does not yet support
        // sanitization or animation players.
        newClassProp(prop, input);
    }
}
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
 * @param styles A key/value style map of the styles that will be applied to the given element.
 *        Any missing styles (that have already been applied to the element beforehand) will be
 *        removed (unset) from the element's styling.
 *
 * Note that this will apply the provided styleMap value to the host element if this function
 * is called within a host binding.
 *
 * @codeGenApi
 */
export function ɵɵstyleMap(styles) {
    var index = getSelectedIndex();
    var lView = getLView();
    var stylingContext = getStylingContext(index, lView);
    var directiveStylingIndex = getActiveDirectiveStylingIndex();
    if (directiveStylingIndex) {
        var args = [stylingContext, styles, directiveStylingIndex];
        enqueueHostInstruction(stylingContext, directiveStylingIndex, updateStyleMap, args);
    }
    else {
        var tNode = getTNode(index, lView);
        // inputs are only evaluated from a template binding into a directive, therefore,
        // there should not be a situation where a directive host bindings function
        // evaluates the inputs (this should only happen in the template function)
        if (hasStyleInput(tNode) && styles !== NO_CHANGE) {
            var initialStyles = getInitialClassNameValue(stylingContext);
            var styleInputVal = (initialStyles.length ? (initialStyles + ' ') : '') + forceStylesAsString(styles);
            setInputsForProperty(lView, tNode.inputs['style'], styleInputVal);
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
 * @param classes A key/value map or string of CSS classes that will be added to the
 *        given element. Any missing classes (that have already been applied to the element
 *        beforehand) will be removed (unset) from the element's list of CSS classes.
 *
 * @codeGenApi
 */
export function ɵɵclassMap(classes) {
    classMapInternal(getLView(), getSelectedIndex(), getActiveDirectiveStylingIndex(), classes);
}
export function classMapInternal(lView, selectedIndex, directiveStylingIndex, classes) {
    var stylingContext = getStylingContext(selectedIndex, lView);
    if (directiveStylingIndex) {
        var args = [stylingContext, classes, directiveStylingIndex];
        enqueueHostInstruction(stylingContext, directiveStylingIndex, updateClassMap, args);
    }
    else {
        var tNode = getTNode(selectedIndex, lView);
        // inputs are only evaluated from a template binding into a directive, therefore,
        // there should not be a situation where a directive host bindings function
        // evaluates the inputs (this should only happen in the template function)
        if (hasClassInput(tNode)) {
            var initialClasses = getInitialClassNameValue(stylingContext);
            var classInputVal = (initialClasses.length ? (initialClasses + ' ') : '') + forceClassesAsString(classes);
            setInputsForProperty(lView, tNode.inputs['class'], classInputVal);
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
 * @codeGenApi
 */
export function ɵɵstylingApply() {
    var index = getSelectedIndex();
    var directiveStylingIndex = getActiveDirectiveStylingIndex() || DEFAULT_TEMPLATE_DIRECTIVE_INDEX;
    var lView = getLView();
    var tNode = getTNode(index, lView);
    // if a non-element value is being processed then we can't render values
    // on the element at all therefore by setting the renderer to null then
    // the styling apply code knows not to actually apply the values...
    var renderer = tNode.type === 3 /* Element */ ? lView[RENDERER] : null;
    var isFirstRender = (lView[FLAGS] & 8 /* FirstLViewPass */) !== 0;
    var stylingContext = getStylingContext(index, lView);
    if (runtimeAllowOldStyling()) {
        var totalPlayersQueued = renderStyling(stylingContext, renderer, lView, isFirstRender, null, null, directiveStylingIndex);
        if (totalPlayersQueued > 0) {
            var rootContext = getRootContext(lView);
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
export function getActiveDirectiveStylingIndex() {
    // whenever a directive's hostBindings function is called a uniqueId value
    // is assigned. Normally this is enough to help distinguish one directive
    // from another for the styling context, but there are situations where a
    // sub-class directive could inherit and assign styling in concert with a
    // parent directive. To help the styling code distinguish between a parent
    // sub-classed directive the inheritance depth is taken into account as well.
    return getActiveDirectiveId() + getActiveDirectiveSuperClassDepth();
}
function getStylingContext(index, lView) {
    var context = getCachedStylingContext();
    if (!context) {
        context = getStylingContextFromLView(index + HEADER_OFFSET, lView);
        setCachedStylingContext(context);
    }
    else if (ngDevMode) {
        var actualContext = getStylingContextFromLView(index + HEADER_OFFSET, lView);
        assertEqual(context, actualContext, 'The cached styling context is invalid');
    }
    return context;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3R5bGluZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaW5zdHJ1Y3Rpb25zL3N0eWxpbmcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBUUEsT0FBTyxFQUFDLFdBQVcsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBRzlDLE9BQU8sRUFBQyxLQUFLLEVBQUUsYUFBYSxFQUFxQixRQUFRLEVBQW1CLE1BQU0sb0JBQW9CLENBQUM7QUFDdkcsT0FBTyxFQUFDLG9CQUFvQixFQUFFLGlDQUFpQyxFQUFFLFFBQVEsRUFBRSx3QkFBd0IsRUFBRSxnQkFBZ0IsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUN2SSxPQUFPLEVBQUMsd0JBQXdCLEVBQUUsYUFBYSxFQUFFLGNBQWMsRUFBRSxlQUFlLElBQUksZUFBZSxFQUFFLHlCQUF5QixFQUFFLGNBQWMsRUFBRSxlQUFlLElBQUksZUFBZSxFQUFDLE1BQU0scUNBQXFDLENBQUM7QUFDL04sT0FBTyxFQUFXLHNCQUFzQixFQUFFLHFCQUFxQixFQUFDLE1BQU0sb0NBQW9DLENBQUM7QUFDM0csT0FBTyxFQUFDLGtCQUFrQixFQUFDLE1BQU0sMkJBQTJCLENBQUM7QUFDN0QsT0FBTyxFQUFDLGdDQUFnQyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDbkUsT0FBTyxFQUFDLHVCQUF1QixFQUFFLHVCQUF1QixFQUFDLE1BQU0sa0JBQWtCLENBQUM7QUFDbEYsT0FBTyxFQUFDLG9DQUFvQyxFQUFFLHlCQUF5QixFQUFFLG9CQUFvQixFQUFFLG1CQUFtQixFQUFFLDBCQUEwQixFQUFFLGFBQWEsRUFBRSxhQUFhLEVBQUMsTUFBTSxpQkFBaUIsQ0FBQztBQUNyTSxPQUFPLEVBQUMsUUFBUSxJQUFJLFdBQVcsRUFBRSxTQUFTLElBQUksWUFBWSxFQUFFLFFBQVEsSUFBSSxXQUFXLEVBQUUsU0FBUyxJQUFJLFlBQVksRUFBRSxZQUFZLElBQUksZUFBZSxFQUFFLFdBQVcsSUFBSSxjQUFjLEVBQUMsTUFBTSw4QkFBOEIsQ0FBQztBQUNwTixPQUFPLEVBQUMsc0JBQXNCLEVBQUUsd0JBQXdCLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUN2RixPQUFPLEVBQUMsdUJBQXVCLEVBQUMsTUFBTSxzQkFBc0IsQ0FBQztBQUM3RCxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sV0FBVyxDQUFDO0FBQ3BDLE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUNuRCxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sOEJBQThCLENBQUM7QUFDNUQsT0FBTyxFQUFDLFFBQVEsRUFBQyxNQUFNLG9CQUFvQixDQUFDO0FBRTVDLE9BQU8sRUFBQyxZQUFZLEVBQUUsb0JBQW9CLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFJNUQ7Ozs7Ozs7Ozs7Ozs7R0FhRztBQUVIOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0FxQkc7QUFDSCxNQUFNLFVBQVUsU0FBUyxDQUNyQixpQkFBbUMsRUFBRSxpQkFBbUMsRUFDeEUsY0FBdUM7SUFDekMsSUFBTSxLQUFLLEdBQUcsd0JBQXdCLEVBQUUsQ0FBQztJQUN6QyxJQUFJLENBQUMsS0FBSyxDQUFDLGVBQWUsRUFBRTtRQUMxQixLQUFLLENBQUMsZUFBZSxHQUFHLHlCQUF5QixFQUFFLENBQUM7S0FDckQ7SUFFRCxJQUFNLHFCQUFxQixHQUFHLDhCQUE4QixFQUFFLENBQUM7SUFDL0QsSUFBSSxxQkFBcUIsRUFBRTtRQUN6QixxRUFBcUU7UUFDckUsb0RBQW9EO1FBQ3BELHdFQUF3RTtRQUN4RSxJQUFJLHdCQUF3QixFQUFFLEVBQUU7WUFDOUIsY0FBYyxFQUFFLENBQUM7U0FDbEI7UUFFRCx1RUFBdUU7UUFDdkUsdUVBQXVFO1FBQ3ZFLHVFQUF1RTtRQUN2RSx1Q0FBdUM7UUFDdkMsb0NBQW9DLENBQUMsS0FBSyxDQUFDLGVBQWUsRUFBRSxxQkFBcUIsQ0FBQyxDQUFDO1FBRW5GLElBQU0sR0FBRyxHQUFHLEtBQUssQ0FBQyxvQkFBb0IsR0FBRyxLQUFLLENBQUMsb0JBQW9CLElBQUksRUFBRSxDQUFDO1FBQzFFLEdBQUcsQ0FBQyxJQUFJLENBQUM7WUFDUCxXQUFXLENBQ1AsS0FBSyxFQUFFLGlCQUFpQixFQUFFLGlCQUFpQixFQUFFLGNBQWMsRUFBRSxxQkFBcUIsQ0FBQyxDQUFDO1lBQ3hGLHFCQUFxQixDQUFDLEtBQUssQ0FBQyxlQUFpQixFQUFFLHFCQUFxQixDQUFDLENBQUM7UUFDeEUsQ0FBQyxDQUFDLENBQUM7S0FDSjtTQUFNO1FBQ0wsd0VBQXdFO1FBQ3hFLDBFQUEwRTtRQUMxRSxxRUFBcUU7UUFDckUsdUVBQXVFO1FBQ3ZFLHNFQUFzRTtRQUN0RSwrQkFBK0I7UUFDL0IsV0FBVyxDQUNQLEtBQUssRUFBRSxpQkFBaUIsRUFBRSxpQkFBaUIsRUFBRSxjQUFjLEVBQzNELGdDQUFnQyxDQUFDLENBQUM7S0FDdkM7QUFDSCxDQUFDO0FBRUQsU0FBUyxXQUFXLENBQ2hCLEtBQVksRUFBRSxpQkFBOEMsRUFDNUQsaUJBQThDLEVBQzlDLGNBQWtELEVBQUUscUJBQTZCO0lBQ25GLHlCQUF5QixDQUNyQixLQUFLLENBQUMsZUFBaUIsRUFBRSxxQkFBcUIsRUFBRSxpQkFBaUIsRUFBRSxpQkFBaUIsRUFDcEYsY0FBYyxDQUFDLENBQUM7QUFDdEIsQ0FBQztBQUdEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0F3Qkc7QUFDSCxNQUFNLFVBQVUsV0FBVyxDQUN2QixVQUFrQixFQUFFLEtBQXNELEVBQzFFLE1BQXNCLEVBQUUsYUFBdUI7SUFDakQsaUJBQWlCLENBQ2IsUUFBUSxFQUFFLEVBQUUsZ0JBQWdCLEVBQUUsRUFBRSxVQUFVLEVBQUUsOEJBQThCLEVBQUUsRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUMzRixhQUFhLENBQUMsQ0FBQztBQUNyQixDQUFDO0FBRUQsTUFBTSxVQUFVLGlCQUFpQixDQUM3QixLQUFZLEVBQUUsYUFBcUIsRUFBRSxVQUFrQixFQUFFLHFCQUE2QixFQUN0RixLQUFzRCxFQUFFLE1BQXNCLEVBQzlFLGFBQXVCO0lBQ3pCLElBQU0sVUFBVSxHQUFHLHFCQUFxQixDQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsQ0FBQztJQUN4RCxJQUFNLGNBQWMsR0FBRyxpQkFBaUIsQ0FBQyxhQUFhLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDL0QsSUFBSSxxQkFBcUIsRUFBRTtRQUN6QixJQUFNLElBQUksR0FDTixDQUFDLGNBQWMsRUFBRSxVQUFVLEVBQUUsVUFBVSxFQUFFLHFCQUFxQixFQUFFLGFBQWEsQ0FBQyxDQUFDO1FBQ25GLHNCQUFzQixDQUFDLGNBQWMsRUFBRSxxQkFBcUIsRUFBRSxlQUFlLEVBQUUsSUFBSSxDQUFDLENBQUM7S0FDdEY7U0FBTTtRQUNMLGVBQWUsQ0FDWCxjQUFjLEVBQUUsVUFBVSxFQUFFLFVBQVUsRUFBRSxnQ0FBZ0MsRUFBRSxhQUFhLENBQUMsQ0FBQztLQUM5RjtJQUVELElBQUksd0JBQXdCLEVBQUUsRUFBRTtRQUM5QixJQUFNLElBQUksR0FBRyx1QkFBdUIsQ0FBQyxjQUFjLEVBQUUsVUFBVSxFQUFFLHFCQUFxQixFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRS9GLG1EQUFtRDtRQUNuRCx3REFBd0Q7UUFDeEQscUNBQXFDO1FBQ3JDLFlBQVksQ0FBQyxJQUFJLEVBQUUsS0FBd0IsRUFBRSxNQUFNLENBQUMsQ0FBQztLQUN0RDtBQUNILENBQUM7QUFFRCxTQUFTLHFCQUFxQixDQUMxQixLQUFzRCxFQUFFLE1BQWlDO0lBQzNGLElBQUksVUFBVSxHQUFnQixJQUFJLENBQUM7SUFDbkMsSUFBSSxLQUFLLEtBQUssSUFBSSxFQUFFO1FBQ2xCLElBQUksTUFBTSxFQUFFO1lBQ1YsK0NBQStDO1lBQy9DLHNEQUFzRDtZQUN0RCxVQUFVLEdBQUcsZUFBZSxDQUFDLEtBQUssQ0FBQyxHQUFHLE1BQU0sQ0FBQztTQUM5QzthQUFNO1lBQ0wsc0RBQXNEO1lBQ3RELDBEQUEwRDtZQUMxRCwyREFBMkQ7WUFDM0QsMENBQTBDO1lBQzFDLFVBQVUsR0FBRyxLQUFzQixDQUFDO1NBQ3JDO0tBQ0Y7SUFDRCxPQUFPLFVBQVUsQ0FBQztBQUNwQixDQUFDO0FBR0Q7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0FtQkc7QUFDSCxNQUFNLFVBQVUsV0FBVyxDQUN2QixVQUFrQixFQUFFLEtBQThCLEVBQUUsYUFBdUI7SUFDN0UsSUFBTSxLQUFLLEdBQUcsZ0JBQWdCLEVBQUUsQ0FBQztJQUNqQyxJQUFNLEtBQUssR0FBRyxDQUFDLEtBQUssWUFBWSxrQkFBa0IsQ0FBQyxDQUFDLENBQUM7UUFDaEQsS0FBMEMsQ0FBQyxDQUFDO1FBQzdDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUN6QixJQUFNLHFCQUFxQixHQUFHLDhCQUE4QixFQUFFLENBQUM7SUFDL0QsSUFBTSxjQUFjLEdBQUcsaUJBQWlCLENBQUMsS0FBSyxFQUFFLFFBQVEsRUFBRSxDQUFDLENBQUM7SUFDNUQsSUFBSSxxQkFBcUIsRUFBRTtRQUN6QixJQUFNLElBQUksR0FDTixDQUFDLGNBQWMsRUFBRSxVQUFVLEVBQUUsS0FBSyxFQUFFLHFCQUFxQixFQUFFLGFBQWEsQ0FBQyxDQUFDO1FBQzlFLHNCQUFzQixDQUFDLGNBQWMsRUFBRSxxQkFBcUIsRUFBRSxlQUFlLEVBQUUsSUFBSSxDQUFDLENBQUM7S0FDdEY7U0FBTTtRQUNMLGVBQWUsQ0FDWCxjQUFjLEVBQUUsVUFBVSxFQUFFLEtBQUssRUFBRSxnQ0FBZ0MsRUFBRSxhQUFhLENBQUMsQ0FBQztLQUN6RjtJQUVELElBQUksd0JBQXdCLEVBQUUsRUFBRTtRQUM5QixJQUFNLElBQUksR0FBRyx1QkFBdUIsQ0FBQyxjQUFjLEVBQUUsVUFBVSxFQUFFLHFCQUFxQixFQUFFLElBQUksQ0FBQyxDQUFDO1FBRTlGLG1EQUFtRDtRQUNuRCx3REFBd0Q7UUFDeEQscUNBQXFDO1FBQ3JDLFlBQVksQ0FBQyxJQUFJLEVBQUUsS0FBZ0IsQ0FBQyxDQUFDO0tBQ3RDO0FBQ0gsQ0FBQztBQUdELFNBQVMsYUFBYSxDQUFDLEtBQVU7SUFDL0IsSUFBSSxPQUFPLEtBQUssS0FBSyxTQUFTO1FBQUUsT0FBTyxLQUFLLENBQUM7SUFDN0MsT0FBTyxLQUFLLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO0FBQzdCLENBQUM7QUFHRDs7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBa0JHO0FBQ0gsTUFBTSxVQUFVLFVBQVUsQ0FBQyxNQUFxRDtJQUM5RSxJQUFNLEtBQUssR0FBRyxnQkFBZ0IsRUFBRSxDQUFDO0lBQ2pDLElBQU0sS0FBSyxHQUFHLFFBQVEsRUFBRSxDQUFDO0lBQ3pCLElBQU0sY0FBYyxHQUFHLGlCQUFpQixDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztJQUN2RCxJQUFNLHFCQUFxQixHQUFHLDhCQUE4QixFQUFFLENBQUM7SUFDL0QsSUFBSSxxQkFBcUIsRUFBRTtRQUN6QixJQUFNLElBQUksR0FBb0MsQ0FBQyxjQUFjLEVBQUUsTUFBTSxFQUFFLHFCQUFxQixDQUFDLENBQUM7UUFDOUYsc0JBQXNCLENBQUMsY0FBYyxFQUFFLHFCQUFxQixFQUFFLGNBQWMsRUFBRSxJQUFJLENBQUMsQ0FBQztLQUNyRjtTQUFNO1FBQ0wsSUFBTSxLQUFLLEdBQUcsUUFBUSxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztRQUVyQyxpRkFBaUY7UUFDakYsMkVBQTJFO1FBQzNFLDBFQUEwRTtRQUMxRSxJQUFJLGFBQWEsQ0FBQyxLQUFLLENBQUMsSUFBSSxNQUFNLEtBQUssU0FBUyxFQUFFO1lBQ2hELElBQU0sYUFBYSxHQUFHLHdCQUF3QixDQUFDLGNBQWMsQ0FBQyxDQUFDO1lBQy9ELElBQU0sYUFBYSxHQUNmLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxhQUFhLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLG1CQUFtQixDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ3RGLG9CQUFvQixDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsTUFBUSxDQUFDLE9BQU8sQ0FBRyxFQUFFLGFBQWEsQ0FBQyxDQUFDO1lBQ3RFLE1BQU0sR0FBRyxTQUFTLENBQUM7U0FDcEI7UUFDRCxjQUFjLENBQUMsY0FBYyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0tBQ3hDO0lBRUQsSUFBSSx3QkFBd0IsRUFBRSxFQUFFO1FBQzlCLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQztLQUNyQjtBQUNILENBQUM7QUFHRDs7Ozs7Ozs7Ozs7Ozs7Ozs7R0FpQkc7QUFDSCxNQUFNLFVBQVUsVUFBVSxDQUFDLE9BQW1EO0lBQzVFLGdCQUFnQixDQUFDLFFBQVEsRUFBRSxFQUFFLGdCQUFnQixFQUFFLEVBQUUsOEJBQThCLEVBQUUsRUFBRSxPQUFPLENBQUMsQ0FBQztBQUM5RixDQUFDO0FBRUQsTUFBTSxVQUFVLGdCQUFnQixDQUM1QixLQUFZLEVBQUUsYUFBcUIsRUFBRSxxQkFBNkIsRUFDbEUsT0FBbUQ7SUFDckQsSUFBTSxjQUFjLEdBQUcsaUJBQWlCLENBQUMsYUFBYSxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQy9ELElBQUkscUJBQXFCLEVBQUU7UUFDekIsSUFBTSxJQUFJLEdBQW9DLENBQUMsY0FBYyxFQUFFLE9BQU8sRUFBRSxxQkFBcUIsQ0FBQyxDQUFDO1FBQy9GLHNCQUFzQixDQUFDLGNBQWMsRUFBRSxxQkFBcUIsRUFBRSxjQUFjLEVBQUUsSUFBSSxDQUFDLENBQUM7S0FDckY7U0FBTTtRQUNMLElBQU0sS0FBSyxHQUFHLFFBQVEsQ0FBQyxhQUFhLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDN0MsaUZBQWlGO1FBQ2pGLDJFQUEyRTtRQUMzRSwwRUFBMEU7UUFDMUUsSUFBSSxhQUFhLENBQUMsS0FBSyxDQUFDLEVBQUU7WUFDeEIsSUFBTSxjQUFjLEdBQUcsd0JBQXdCLENBQUMsY0FBYyxDQUFDLENBQUM7WUFDaEUsSUFBTSxhQUFhLEdBQ2YsQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLGNBQWMsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsb0JBQW9CLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDMUYsb0JBQW9CLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxNQUFRLENBQUMsT0FBTyxDQUFHLEVBQUUsYUFBYSxDQUFDLENBQUM7WUFDdEUsT0FBTyxHQUFHLFNBQVMsQ0FBQztTQUNyQjtRQUNELGNBQWMsQ0FBQyxjQUFjLEVBQUUsT0FBTyxDQUFDLENBQUM7S0FDekM7SUFFRCxJQUFJLHdCQUF3QixFQUFFLEVBQUU7UUFDOUIsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0tBQ3RCO0FBQ0gsQ0FBQztBQUVEOzs7Ozs7OztHQVFHO0FBQ0gsTUFBTSxVQUFVLGNBQWM7SUFDNUIsSUFBTSxLQUFLLEdBQUcsZ0JBQWdCLEVBQUUsQ0FBQztJQUNqQyxJQUFNLHFCQUFxQixHQUN2Qiw4QkFBOEIsRUFBRSxJQUFJLGdDQUFnQyxDQUFDO0lBQ3pFLElBQU0sS0FBSyxHQUFHLFFBQVEsRUFBRSxDQUFDO0lBQ3pCLElBQU0sS0FBSyxHQUFHLFFBQVEsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFFckMsd0VBQXdFO0lBQ3hFLHVFQUF1RTtJQUN2RSxtRUFBbUU7SUFDbkUsSUFBTSxRQUFRLEdBQUcsS0FBSyxDQUFDLElBQUksb0JBQXNCLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO0lBQzNFLElBQU0sYUFBYSxHQUFHLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyx5QkFBNEIsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUN2RSxJQUFNLGNBQWMsR0FBRyxpQkFBaUIsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFFdkQsSUFBSSxzQkFBc0IsRUFBRSxFQUFFO1FBQzVCLElBQU0sa0JBQWtCLEdBQUcsYUFBYSxDQUNwQyxjQUFjLEVBQUUsUUFBUSxFQUFFLEtBQUssRUFBRSxhQUFhLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxxQkFBcUIsQ0FBQyxDQUFDO1FBQ3ZGLElBQUksa0JBQWtCLEdBQUcsQ0FBQyxFQUFFO1lBQzFCLElBQU0sV0FBVyxHQUFHLGNBQWMsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUMxQyxZQUFZLENBQUMsV0FBVyx1QkFBZ0MsQ0FBQztTQUMxRDtLQUNGO0lBRUQsOEVBQThFO0lBQzlFLCtFQUErRTtJQUMvRSxpRkFBaUY7SUFDakYsaUZBQWlGO0lBQ2pGLG9GQUFvRjtJQUNwRixxRkFBcUY7SUFDckYsK0VBQStFO0lBQy9FLHVCQUF1QixDQUFDLElBQUksQ0FBQyxDQUFDO0lBRTlCLElBQUksd0JBQXdCLEVBQUUsRUFBRTtRQUM5QixlQUFlLEVBQUUsQ0FBQztLQUNuQjtBQUNILENBQUM7QUFFRCxNQUFNLFVBQVUsOEJBQThCO0lBQzVDLDBFQUEwRTtJQUMxRSx5RUFBeUU7SUFDekUseUVBQXlFO0lBQ3pFLHlFQUF5RTtJQUN6RSwwRUFBMEU7SUFDMUUsNkVBQTZFO0lBQzdFLE9BQU8sb0JBQW9CLEVBQUUsR0FBRyxpQ0FBaUMsRUFBRSxDQUFDO0FBQ3RFLENBQUM7QUFFRCxTQUFTLGlCQUFpQixDQUFDLEtBQWEsRUFBRSxLQUFZO0lBQ3BELElBQUksT0FBTyxHQUFHLHVCQUF1QixFQUFFLENBQUM7SUFDeEMsSUFBSSxDQUFDLE9BQU8sRUFBRTtRQUNaLE9BQU8sR0FBRywwQkFBMEIsQ0FBQyxLQUFLLEdBQUcsYUFBYSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ25FLHVCQUF1QixDQUFDLE9BQU8sQ0FBQyxDQUFDO0tBQ2xDO1NBQU0sSUFBSSxTQUFTLEVBQUU7UUFDcEIsSUFBTSxhQUFhLEdBQUcsMEJBQTBCLENBQUMsS0FBSyxHQUFHLGFBQWEsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUMvRSxXQUFXLENBQUMsT0FBTyxFQUFFLGFBQWEsRUFBRSx1Q0FBdUMsQ0FBQyxDQUFDO0tBQzlFO0lBQ0QsT0FBTyxPQUFPLENBQUM7QUFDakIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCB7U3R5bGVTYW5pdGl6ZUZufSBmcm9tICcuLi8uLi9zYW5pdGl6YXRpb24vc3R5bGVfc2FuaXRpemVyJztcbmltcG9ydCB7YXNzZXJ0RXF1YWx9IGZyb20gJy4uLy4uL3V0aWwvYXNzZXJ0JztcbmltcG9ydCB7VE5vZGUsIFROb2RlVHlwZX0gZnJvbSAnLi4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7UGxheWVyRmFjdG9yeX0gZnJvbSAnLi4vaW50ZXJmYWNlcy9wbGF5ZXInO1xuaW1wb3J0IHtGTEFHUywgSEVBREVSX09GRlNFVCwgTFZpZXcsIExWaWV3RmxhZ3MsIFJFTkRFUkVSLCBSb290Q29udGV4dEZsYWdzfSBmcm9tICcuLi9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHtnZXRBY3RpdmVEaXJlY3RpdmVJZCwgZ2V0QWN0aXZlRGlyZWN0aXZlU3VwZXJDbGFzc0RlcHRoLCBnZXRMVmlldywgZ2V0UHJldmlvdXNPclBhcmVudFROb2RlLCBnZXRTZWxlY3RlZEluZGV4fSBmcm9tICcuLi9zdGF0ZSc7XG5pbXBvcnQge2dldEluaXRpYWxDbGFzc05hbWVWYWx1ZSwgcmVuZGVyU3R5bGluZywgdXBkYXRlQ2xhc3NNYXAsIHVwZGF0ZUNsYXNzUHJvcCBhcyB1cGRhdGVjbGFzc1Byb3AsIHVwZGF0ZUNvbnRleHRXaXRoQmluZGluZ3MsIHVwZGF0ZVN0eWxlTWFwLCB1cGRhdGVTdHlsZVByb3AgYXMgdXBkYXRlc3R5bGVQcm9wfSBmcm9tICcuLi9zdHlsaW5nL2NsYXNzX2FuZF9zdHlsZV9iaW5kaW5ncyc7XG5pbXBvcnQge1BhcmFtc09mLCBlbnF1ZXVlSG9zdEluc3RydWN0aW9uLCByZWdpc3Rlckhvc3REaXJlY3RpdmV9IGZyb20gJy4uL3N0eWxpbmcvaG9zdF9pbnN0cnVjdGlvbnNfcXVldWUnO1xuaW1wb3J0IHtCb3VuZFBsYXllckZhY3Rvcnl9IGZyb20gJy4uL3N0eWxpbmcvcGxheWVyX2ZhY3RvcnknO1xuaW1wb3J0IHtERUZBVUxUX1RFTVBMQVRFX0RJUkVDVElWRV9JTkRFWH0gZnJvbSAnLi4vc3R5bGluZy9zaGFyZWQnO1xuaW1wb3J0IHtnZXRDYWNoZWRTdHlsaW5nQ29udGV4dCwgc2V0Q2FjaGVkU3R5bGluZ0NvbnRleHR9IGZyb20gJy4uL3N0eWxpbmcvc3RhdGUnO1xuaW1wb3J0IHthbGxvY2F0ZU9yVXBkYXRlRGlyZWN0aXZlSW50b0NvbnRleHQsIGNyZWF0ZUVtcHR5U3R5bGluZ0NvbnRleHQsIGZvcmNlQ2xhc3Nlc0FzU3RyaW5nLCBmb3JjZVN0eWxlc0FzU3RyaW5nLCBnZXRTdHlsaW5nQ29udGV4dEZyb21MVmlldywgaGFzQ2xhc3NJbnB1dCwgaGFzU3R5bGVJbnB1dH0gZnJvbSAnLi4vc3R5bGluZy91dGlsJztcbmltcG9ydCB7Y2xhc3NNYXAgYXMgbmV3Q2xhc3NNYXAsIGNsYXNzUHJvcCBhcyBuZXdDbGFzc1Byb3AsIHN0eWxlTWFwIGFzIG5ld1N0eWxlTWFwLCBzdHlsZVByb3AgYXMgbmV3U3R5bGVQcm9wLCBzdHlsaW5nQXBwbHkgYXMgbmV3U3R5bGluZ0FwcGx5LCBzdHlsaW5nSW5pdCBhcyBuZXdTdHlsaW5nSW5pdH0gZnJvbSAnLi4vc3R5bGluZ19uZXh0L2luc3RydWN0aW9ucyc7XG5pbXBvcnQge3J1bnRpbWVBbGxvd09sZFN0eWxpbmcsIHJ1bnRpbWVJc05ld1N0eWxpbmdJblVzZX0gZnJvbSAnLi4vc3R5bGluZ19uZXh0L3N0YXRlJztcbmltcG9ydCB7Z2V0QmluZGluZ05hbWVGcm9tSW5kZXh9IGZyb20gJy4uL3N0eWxpbmdfbmV4dC91dGlsJztcbmltcG9ydCB7Tk9fQ0hBTkdFfSBmcm9tICcuLi90b2tlbnMnO1xuaW1wb3J0IHtyZW5kZXJTdHJpbmdpZnl9IGZyb20gJy4uL3V0aWwvbWlzY191dGlscyc7XG5pbXBvcnQge2dldFJvb3RDb250ZXh0fSBmcm9tICcuLi91dGlsL3ZpZXdfdHJhdmVyc2FsX3V0aWxzJztcbmltcG9ydCB7Z2V0VE5vZGV9IGZyb20gJy4uL3V0aWwvdmlld191dGlscyc7XG5cbmltcG9ydCB7c2NoZWR1bGVUaWNrLCBzZXRJbnB1dHNGb3JQcm9wZXJ0eX0gZnJvbSAnLi9zaGFyZWQnO1xuXG5cblxuLypcbiAqIFRoZSBjb250ZW50cyBvZiB0aGlzIGZpbGUgaW5jbHVkZSB0aGUgaW5zdHJ1Y3Rpb25zIGZvciBhbGwgc3R5bGluZy1yZWxhdGVkXG4gKiBvcGVyYXRpb25zIGluIEFuZ3VsYXIuXG4gKlxuICogVGhlIGluc3RydWN0aW9ucyBwcmVzZW50IGluIHRoaXMgZmlsZSBhcmU6XG4gKlxuICogVGVtcGxhdGUgbGV2ZWwgc3R5bGluZyBpbnN0cnVjdGlvbnM6XG4gKiAtIHN0eWxpbmdcbiAqIC0gc3R5bGVNYXBcbiAqIC0gY2xhc3NNYXBcbiAqIC0gc3R5bGVQcm9wXG4gKiAtIGNsYXNzUHJvcFxuICogLSBzdHlsaW5nQXBwbHlcbiAqL1xuXG4vKipcbiAqIEFsbG9jYXRlcyBzdHlsZSBhbmQgY2xhc3MgYmluZGluZyBwcm9wZXJ0aWVzIG9uIHRoZSBlbGVtZW50IGR1cmluZyBjcmVhdGlvbiBtb2RlLlxuICpcbiAqIFRoaXMgaW5zdHJ1Y3Rpb24gaXMgbWVhbnQgdG8gYmUgY2FsbGVkIGR1cmluZyBjcmVhdGlvbiBtb2RlIHRvIHJlZ2lzdGVyIGFsbFxuICogZHluYW1pYyBzdHlsZSBhbmQgY2xhc3MgYmluZGluZ3Mgb24gdGhlIGVsZW1lbnQuIE5vdGUgdGhhdCB0aGlzIGlzIG9ubHkgdXNlZFxuICogZm9yIGJpbmRpbmcgdmFsdWVzIChzZWUgYGVsZW1lbnRTdGFydGAgdG8gbGVhcm4gaG93IHRvIGFzc2lnbiBzdGF0aWMgc3R5bGluZ1xuICogdmFsdWVzIHRvIGFuIGVsZW1lbnQpLlxuICpcbiAqIEBwYXJhbSBjbGFzc0JpbmRpbmdOYW1lcyBBbiBhcnJheSBjb250YWluaW5nIGJpbmRhYmxlIGNsYXNzIG5hbWVzLlxuICogICAgICAgIFRoZSBgY2xhc3NQcm9wYCBpbnN0cnVjdGlvbiByZWZlcnMgdG8gdGhlIGNsYXNzIG5hbWUgYnkgaW5kZXggaW5cbiAqICAgICAgICB0aGlzIGFycmF5IChpLmUuIGBbJ2ZvbycsICdiYXInXWAgbWVhbnMgYGZvbz0wYCBhbmQgYGJhcj0xYCkuXG4gKiBAcGFyYW0gc3R5bGVCaW5kaW5nTmFtZXMgQW4gYXJyYXkgY29udGFpbmluZyBiaW5kYWJsZSBzdHlsZSBwcm9wZXJ0aWVzLlxuICogICAgICAgIFRoZSBgc3R5bGVQcm9wYCBpbnN0cnVjdGlvbiByZWZlcnMgdG8gdGhlIGNsYXNzIG5hbWUgYnkgaW5kZXggaW5cbiAqICAgICAgICB0aGlzIGFycmF5IChpLmUuIGBbJ3dpZHRoJywgJ2hlaWdodCddYCBtZWFucyBgd2lkdGg9MGAgYW5kIGBoZWlnaHQ9MWApLlxuICogQHBhcmFtIHN0eWxlU2FuaXRpemVyIEFuIG9wdGlvbmFsIHNhbml0aXplciBmdW5jdGlvbiB0aGF0IHdpbGwgYmUgdXNlZCB0byBzYW5pdGl6ZSBhbnkgQ1NTXG4gKiAgICAgICAgc3R5bGUgdmFsdWVzIHRoYXQgYXJlIGFwcGxpZWQgdG8gdGhlIGVsZW1lbnQgKGR1cmluZyByZW5kZXJpbmcpLlxuICpcbiAqIE5vdGUgdGhhdCB0aGlzIHdpbGwgYWxsb2NhdGUgdGhlIHByb3ZpZGVkIHN0eWxlL2NsYXNzIGJpbmRpbmdzIHRvIHRoZSBob3N0IGVsZW1lbnQgaWZcbiAqIHRoaXMgZnVuY3Rpb24gaXMgY2FsbGVkIHdpdGhpbiBhIGhvc3QgYmluZGluZy5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtXN0eWxpbmcoXG4gICAgY2xhc3NCaW5kaW5nTmFtZXM/OiBzdHJpbmdbXSB8IG51bGwsIHN0eWxlQmluZGluZ05hbWVzPzogc3RyaW5nW10gfCBudWxsLFxuICAgIHN0eWxlU2FuaXRpemVyPzogU3R5bGVTYW5pdGl6ZUZuIHwgbnVsbCk6IHZvaWQge1xuICBjb25zdCB0Tm9kZSA9IGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSgpO1xuICBpZiAoIXROb2RlLnN0eWxpbmdUZW1wbGF0ZSkge1xuICAgIHROb2RlLnN0eWxpbmdUZW1wbGF0ZSA9IGNyZWF0ZUVtcHR5U3R5bGluZ0NvbnRleHQoKTtcbiAgfVxuXG4gIGNvbnN0IGRpcmVjdGl2ZVN0eWxpbmdJbmRleCA9IGdldEFjdGl2ZURpcmVjdGl2ZVN0eWxpbmdJbmRleCgpO1xuICBpZiAoZGlyZWN0aXZlU3R5bGluZ0luZGV4KSB7XG4gICAgLy8gdGhpcyBpcyB0ZW1wb3JhcnkgaGFjayB0byBnZXQgdGhlIGV4aXN0aW5nIHN0eWxpbmcgaW5zdHJ1Y3Rpb25zIHRvXG4gICAgLy8gcGxheSBiYWxsIHdpdGggdGhlIG5ldyByZWZhY3RvcmVkIGltcGxlbWVudGF0aW9uLlxuICAgIC8vIFRPRE8gKG1hdHNrbyk6IHJlbW92ZSB0aGlzIG9uY2UgdGhlIG9sZCBpbXBsZW1lbnRhdGlvbiBpcyBub3QgbmVlZGVkLlxuICAgIGlmIChydW50aW1lSXNOZXdTdHlsaW5nSW5Vc2UoKSkge1xuICAgICAgbmV3U3R5bGluZ0luaXQoKTtcbiAgICB9XG5cbiAgICAvLyBkZXNwaXRlIHRoZSBiaW5kaW5nIGJlaW5nIGFwcGxpZWQgaW4gYSBxdWV1ZSAoYmVsb3cpLCB0aGUgYWxsb2NhdGlvblxuICAgIC8vIG9mIHRoZSBkaXJlY3RpdmUgaW50byB0aGUgY29udGV4dCBoYXBwZW5zIHJpZ2h0IGF3YXkuIFRoZSByZWFzb24gZm9yXG4gICAgLy8gdGhpcyBpcyB0byByZXRhaW4gdGhlIG9yZGVyaW5nIG9mIHRoZSBkaXJlY3RpdmVzICh3aGljaCBpcyBpbXBvcnRhbnRcbiAgICAvLyBmb3IgdGhlIHByaW9yaXRpemF0aW9uIG9mIGJpbmRpbmdzKS5cbiAgICBhbGxvY2F0ZU9yVXBkYXRlRGlyZWN0aXZlSW50b0NvbnRleHQodE5vZGUuc3R5bGluZ1RlbXBsYXRlLCBkaXJlY3RpdmVTdHlsaW5nSW5kZXgpO1xuXG4gICAgY29uc3QgZm5zID0gdE5vZGUub25FbGVtZW50Q3JlYXRpb25GbnMgPSB0Tm9kZS5vbkVsZW1lbnRDcmVhdGlvbkZucyB8fCBbXTtcbiAgICBmbnMucHVzaCgoKSA9PiB7XG4gICAgICBpbml0U3R5bGluZyhcbiAgICAgICAgICB0Tm9kZSwgY2xhc3NCaW5kaW5nTmFtZXMsIHN0eWxlQmluZGluZ05hbWVzLCBzdHlsZVNhbml0aXplciwgZGlyZWN0aXZlU3R5bGluZ0luZGV4KTtcbiAgICAgIHJlZ2lzdGVySG9zdERpcmVjdGl2ZSh0Tm9kZS5zdHlsaW5nVGVtcGxhdGUgISwgZGlyZWN0aXZlU3R5bGluZ0luZGV4KTtcbiAgICB9KTtcbiAgfSBlbHNlIHtcbiAgICAvLyBjYWxsaW5nIHRoZSBmdW5jdGlvbiBiZWxvdyBlbnN1cmVzIHRoYXQgdGhlIHRlbXBsYXRlJ3MgYmluZGluZyB2YWx1ZXNcbiAgICAvLyBhcmUgYXBwbGllZCBhcyB0aGUgZmlyc3Qgc2V0IG9mIGJpbmRpbmdzIGludG8gdGhlIGNvbnRleHQuIElmIGFueSBvdGhlclxuICAgIC8vIHN0eWxpbmcgYmluZGluZ3MgYXJlIHNldCBvbiB0aGUgc2FtZSBlbGVtZW50IChieSBkaXJlY3RpdmVzIGFuZC9vclxuICAgIC8vIGNvbXBvbmVudHMpIHRoZW4gdGhleSB3aWxsIGJlIGFwcGxpZWQgYXQgdGhlIGVuZCBvZiB0aGUgYGVsZW1lbnRFbmRgXG4gICAgLy8gaW5zdHJ1Y3Rpb24gKGJlY2F1c2UgZGlyZWN0aXZlcyBhcmUgY3JlYXRlZCBmaXJzdCBiZWZvcmUgc3R5bGluZyBpc1xuICAgIC8vIGV4ZWN1dGVkIGZvciBhIG5ldyBlbGVtZW50KS5cbiAgICBpbml0U3R5bGluZyhcbiAgICAgICAgdE5vZGUsIGNsYXNzQmluZGluZ05hbWVzLCBzdHlsZUJpbmRpbmdOYW1lcywgc3R5bGVTYW5pdGl6ZXIsXG4gICAgICAgIERFRkFVTFRfVEVNUExBVEVfRElSRUNUSVZFX0lOREVYKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBpbml0U3R5bGluZyhcbiAgICB0Tm9kZTogVE5vZGUsIGNsYXNzQmluZGluZ05hbWVzOiBzdHJpbmdbXSB8IG51bGwgfCB1bmRlZmluZWQsXG4gICAgc3R5bGVCaW5kaW5nTmFtZXM6IHN0cmluZ1tdIHwgbnVsbCB8IHVuZGVmaW5lZCxcbiAgICBzdHlsZVNhbml0aXplcjogU3R5bGVTYW5pdGl6ZUZuIHwgbnVsbCB8IHVuZGVmaW5lZCwgZGlyZWN0aXZlU3R5bGluZ0luZGV4OiBudW1iZXIpOiB2b2lkIHtcbiAgdXBkYXRlQ29udGV4dFdpdGhCaW5kaW5ncyhcbiAgICAgIHROb2RlLnN0eWxpbmdUZW1wbGF0ZSAhLCBkaXJlY3RpdmVTdHlsaW5nSW5kZXgsIGNsYXNzQmluZGluZ05hbWVzLCBzdHlsZUJpbmRpbmdOYW1lcyxcbiAgICAgIHN0eWxlU2FuaXRpemVyKTtcbn1cblxuXG4vKipcbiAqIFVwZGF0ZSBhIHN0eWxlIGJpbmRpbmcgb24gYW4gZWxlbWVudCB3aXRoIHRoZSBwcm92aWRlZCB2YWx1ZS5cbiAqXG4gKiBJZiB0aGUgc3R5bGUgdmFsdWUgaXMgZmFsc3kgdGhlbiBpdCB3aWxsIGJlIHJlbW92ZWQgZnJvbSB0aGUgZWxlbWVudFxuICogKG9yIGFzc2lnbmVkIGEgZGlmZmVyZW50IHZhbHVlIGRlcGVuZGluZyBpZiB0aGVyZSBhcmUgYW55IHN0eWxlcyBwbGFjZWRcbiAqIG9uIHRoZSBlbGVtZW50IHdpdGggYHN0eWxlTWFwYCBvciBhbnkgc3RhdGljIHN0eWxlcyB0aGF0IGFyZVxuICogcHJlc2VudCBmcm9tIHdoZW4gdGhlIGVsZW1lbnQgd2FzIGNyZWF0ZWQgd2l0aCBgc3R5bGluZ2ApLlxuICpcbiAqIE5vdGUgdGhhdCB0aGUgc3R5bGluZyBlbGVtZW50IGlzIHVwZGF0ZWQgYXMgcGFydCBvZiBgc3R5bGluZ0FwcGx5YC5cbiAqXG4gKiBAcGFyYW0gc3R5bGVJbmRleCBJbmRleCBvZiBzdHlsZSB0byB1cGRhdGUuIFRoaXMgaW5kZXggdmFsdWUgcmVmZXJzIHRvIHRoZVxuICogICAgICAgIGluZGV4IG9mIHRoZSBzdHlsZSBpbiB0aGUgc3R5bGUgYmluZGluZ3MgYXJyYXkgdGhhdCB3YXMgcGFzc2VkIGludG9cbiAqICAgICAgICBgc3R5bGluZ2AuXG4gKiBAcGFyYW0gdmFsdWUgTmV3IHZhbHVlIHRvIHdyaXRlIChmYWxzeSB0byByZW1vdmUpLlxuICogQHBhcmFtIHN1ZmZpeCBPcHRpb25hbCBzdWZmaXguIFVzZWQgd2l0aCBzY2FsYXIgdmFsdWVzIHRvIGFkZCB1bml0IHN1Y2ggYXMgYHB4YC5cbiAqICAgICAgICBOb3RlIHRoYXQgd2hlbiBhIHN1ZmZpeCBpcyBwcm92aWRlZCB0aGVuIHRoZSB1bmRlcmx5aW5nIHNhbml0aXplciB3aWxsXG4gKiAgICAgICAgYmUgaWdub3JlZC5cbiAqIEBwYXJhbSBmb3JjZU92ZXJyaWRlIFdoZXRoZXIgb3Igbm90IHRvIHVwZGF0ZSB0aGUgc3R5bGluZyB2YWx1ZSBpbW1lZGlhdGVseVxuICogICAgICAgIChkZXNwaXRlIHRoZSBvdGhlciBiaW5kaW5ncyBwb3NzaWJseSBoYXZpbmcgcHJpb3JpdHkpXG4gKlxuICogTm90ZSB0aGF0IHRoaXMgd2lsbCBhcHBseSB0aGUgcHJvdmlkZWQgc3R5bGUgdmFsdWUgdG8gdGhlIGhvc3QgZWxlbWVudCBpZiB0aGlzIGZ1bmN0aW9uIGlzIGNhbGxlZFxuICogd2l0aGluIGEgaG9zdCBiaW5kaW5nLlxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1c3R5bGVQcm9wKFxuICAgIHN0eWxlSW5kZXg6IG51bWJlciwgdmFsdWU6IHN0cmluZyB8IG51bWJlciB8IFN0cmluZyB8IFBsYXllckZhY3RvcnkgfCBudWxsLFxuICAgIHN1ZmZpeD86IHN0cmluZyB8IG51bGwsIGZvcmNlT3ZlcnJpZGU/OiBib29sZWFuKTogdm9pZCB7XG4gIHN0eWxlUHJvcEludGVybmFsKFxuICAgICAgZ2V0TFZpZXcoKSwgZ2V0U2VsZWN0ZWRJbmRleCgpLCBzdHlsZUluZGV4LCBnZXRBY3RpdmVEaXJlY3RpdmVTdHlsaW5nSW5kZXgoKSwgdmFsdWUsIHN1ZmZpeCxcbiAgICAgIGZvcmNlT3ZlcnJpZGUpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc3R5bGVQcm9wSW50ZXJuYWwoXG4gICAgbFZpZXc6IExWaWV3LCBzZWxlY3RlZEluZGV4OiBudW1iZXIsIHN0eWxlSW5kZXg6IG51bWJlciwgZGlyZWN0aXZlU3R5bGluZ0luZGV4OiBudW1iZXIsXG4gICAgdmFsdWU6IHN0cmluZyB8IG51bWJlciB8IFN0cmluZyB8IFBsYXllckZhY3RvcnkgfCBudWxsLCBzdWZmaXg/OiBzdHJpbmcgfCBudWxsLFxuICAgIGZvcmNlT3ZlcnJpZGU/OiBib29sZWFuKTogdm9pZCB7XG4gIGNvbnN0IHZhbHVlVG9BZGQgPSByZXNvbHZlU3R5bGVQcm9wVmFsdWUodmFsdWUsIHN1ZmZpeCk7XG4gIGNvbnN0IHN0eWxpbmdDb250ZXh0ID0gZ2V0U3R5bGluZ0NvbnRleHQoc2VsZWN0ZWRJbmRleCwgbFZpZXcpO1xuICBpZiAoZGlyZWN0aXZlU3R5bGluZ0luZGV4KSB7XG4gICAgY29uc3QgYXJnczogUGFyYW1zT2Y8dHlwZW9mIHVwZGF0ZXN0eWxlUHJvcD4gPVxuICAgICAgICBbc3R5bGluZ0NvbnRleHQsIHN0eWxlSW5kZXgsIHZhbHVlVG9BZGQsIGRpcmVjdGl2ZVN0eWxpbmdJbmRleCwgZm9yY2VPdmVycmlkZV07XG4gICAgZW5xdWV1ZUhvc3RJbnN0cnVjdGlvbihzdHlsaW5nQ29udGV4dCwgZGlyZWN0aXZlU3R5bGluZ0luZGV4LCB1cGRhdGVzdHlsZVByb3AsIGFyZ3MpO1xuICB9IGVsc2Uge1xuICAgIHVwZGF0ZXN0eWxlUHJvcChcbiAgICAgICAgc3R5bGluZ0NvbnRleHQsIHN0eWxlSW5kZXgsIHZhbHVlVG9BZGQsIERFRkFVTFRfVEVNUExBVEVfRElSRUNUSVZFX0lOREVYLCBmb3JjZU92ZXJyaWRlKTtcbiAgfVxuXG4gIGlmIChydW50aW1lSXNOZXdTdHlsaW5nSW5Vc2UoKSkge1xuICAgIGNvbnN0IHByb3AgPSBnZXRCaW5kaW5nTmFtZUZyb21JbmRleChzdHlsaW5nQ29udGV4dCwgc3R5bGVJbmRleCwgZGlyZWN0aXZlU3R5bGluZ0luZGV4LCBmYWxzZSk7XG5cbiAgICAvLyB0aGUgcmVhc29uIHdoeSB3ZSBjYXN0IHRoZSB2YWx1ZSBhcyBgYm9vbGVhbmAgaXNcbiAgICAvLyBiZWNhdXNlIHRoZSBuZXcgc3R5bGluZyByZWZhY3RvciBkb2VzIG5vdCB5ZXQgc3VwcG9ydFxuICAgIC8vIHNhbml0aXphdGlvbiBvciBhbmltYXRpb24gcGxheWVycy5cbiAgICBuZXdTdHlsZVByb3AocHJvcCwgdmFsdWUgYXMgc3RyaW5nIHwgbnVtYmVyLCBzdWZmaXgpO1xuICB9XG59XG5cbmZ1bmN0aW9uIHJlc29sdmVTdHlsZVByb3BWYWx1ZShcbiAgICB2YWx1ZTogc3RyaW5nIHwgbnVtYmVyIHwgU3RyaW5nIHwgUGxheWVyRmFjdG9yeSB8IG51bGwsIHN1ZmZpeDogc3RyaW5nIHwgbnVsbCB8IHVuZGVmaW5lZCkge1xuICBsZXQgdmFsdWVUb0FkZDogc3RyaW5nfG51bGwgPSBudWxsO1xuICBpZiAodmFsdWUgIT09IG51bGwpIHtcbiAgICBpZiAoc3VmZml4KSB7XG4gICAgICAvLyB3aGVuIGEgc3VmZml4IGlzIGFwcGxpZWQgdGhlbiBpdCB3aWxsIGJ5cGFzc1xuICAgICAgLy8gc2FuaXRpemF0aW9uIGVudGlyZWx5IChiL2MgYSBuZXcgc3RyaW5nIGlzIGNyZWF0ZWQpXG4gICAgICB2YWx1ZVRvQWRkID0gcmVuZGVyU3RyaW5naWZ5KHZhbHVlKSArIHN1ZmZpeDtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gc2FuaXRpemF0aW9uIGhhcHBlbnMgYnkgZGVhbGluZyB3aXRoIGEgU3RyaW5nIHZhbHVlXG4gICAgICAvLyB0aGlzIG1lYW5zIHRoYXQgdGhlIHN0cmluZyB2YWx1ZSB3aWxsIGJlIHBhc3NlZCB0aHJvdWdoXG4gICAgICAvLyBpbnRvIHRoZSBzdHlsZSByZW5kZXJpbmcgbGF0ZXIgKHdoaWNoIGlzIHdoZXJlIHRoZSB2YWx1ZVxuICAgICAgLy8gd2lsbCBiZSBzYW5pdGl6ZWQgYmVmb3JlIGl0IGlzIGFwcGxpZWQpXG4gICAgICB2YWx1ZVRvQWRkID0gdmFsdWUgYXMgYW55IGFzIHN0cmluZztcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHZhbHVlVG9BZGQ7XG59XG5cblxuLyoqXG4gKiBVcGRhdGUgYSBjbGFzcyBiaW5kaW5nIG9uIGFuIGVsZW1lbnQgd2l0aCB0aGUgcHJvdmlkZWQgdmFsdWUuXG4gKlxuICogVGhpcyBpbnN0cnVjdGlvbiBpcyBtZWFudCB0byBoYW5kbGUgdGhlIGBbY2xhc3MuZm9vXT1cImV4cFwiYCBjYXNlIGFuZCxcbiAqIHRoZXJlZm9yZSwgdGhlIGNsYXNzIGJpbmRpbmcgaXRzZWxmIG11c3QgYWxyZWFkeSBiZSBhbGxvY2F0ZWQgdXNpbmdcbiAqIGBzdHlsaW5nYCB3aXRoaW4gdGhlIGNyZWF0aW9uIGJsb2NrLlxuICpcbiAqIEBwYXJhbSBjbGFzc0luZGV4IEluZGV4IG9mIGNsYXNzIHRvIHRvZ2dsZS4gVGhpcyBpbmRleCB2YWx1ZSByZWZlcnMgdG8gdGhlXG4gKiAgICAgICAgaW5kZXggb2YgdGhlIGNsYXNzIGluIHRoZSBjbGFzcyBiaW5kaW5ncyBhcnJheSB0aGF0IHdhcyBwYXNzZWQgaW50b1xuICogICAgICAgIGBzdHlsaW5nYCAod2hpY2ggaXMgbWVhbnQgdG8gYmUgY2FsbGVkIGJlZm9yZSB0aGlzXG4gKiAgICAgICAgZnVuY3Rpb24gaXMpLlxuICogQHBhcmFtIHZhbHVlIEEgdHJ1ZS9mYWxzZSB2YWx1ZSB3aGljaCB3aWxsIHR1cm4gdGhlIGNsYXNzIG9uIG9yIG9mZi5cbiAqIEBwYXJhbSBmb3JjZU92ZXJyaWRlIFdoZXRoZXIgb3Igbm90IHRoaXMgdmFsdWUgd2lsbCBiZSBhcHBsaWVkIHJlZ2FyZGxlc3NcbiAqICAgICAgICBvZiB3aGVyZSBpdCBpcyBiZWluZyBzZXQgd2l0aGluIHRoZSBzdHlsaW5nIHByaW9yaXR5IHN0cnVjdHVyZS5cbiAqXG4gKiBOb3RlIHRoYXQgdGhpcyB3aWxsIGFwcGx5IHRoZSBwcm92aWRlZCBjbGFzcyB2YWx1ZSB0byB0aGUgaG9zdCBlbGVtZW50IGlmIHRoaXMgZnVuY3Rpb25cbiAqIGlzIGNhbGxlZCB3aXRoaW4gYSBob3N0IGJpbmRpbmcuXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVjbGFzc1Byb3AoXG4gICAgY2xhc3NJbmRleDogbnVtYmVyLCB2YWx1ZTogYm9vbGVhbiB8IFBsYXllckZhY3RvcnksIGZvcmNlT3ZlcnJpZGU/OiBib29sZWFuKTogdm9pZCB7XG4gIGNvbnN0IGluZGV4ID0gZ2V0U2VsZWN0ZWRJbmRleCgpO1xuICBjb25zdCBpbnB1dCA9ICh2YWx1ZSBpbnN0YW5jZW9mIEJvdW5kUGxheWVyRmFjdG9yeSkgP1xuICAgICAgKHZhbHVlIGFzIEJvdW5kUGxheWVyRmFjdG9yeTxib29sZWFufG51bGw+KSA6XG4gICAgICBib29sZWFuT3JOdWxsKHZhbHVlKTtcbiAgY29uc3QgZGlyZWN0aXZlU3R5bGluZ0luZGV4ID0gZ2V0QWN0aXZlRGlyZWN0aXZlU3R5bGluZ0luZGV4KCk7XG4gIGNvbnN0IHN0eWxpbmdDb250ZXh0ID0gZ2V0U3R5bGluZ0NvbnRleHQoaW5kZXgsIGdldExWaWV3KCkpO1xuICBpZiAoZGlyZWN0aXZlU3R5bGluZ0luZGV4KSB7XG4gICAgY29uc3QgYXJnczogUGFyYW1zT2Y8dHlwZW9mIHVwZGF0ZWNsYXNzUHJvcD4gPVxuICAgICAgICBbc3R5bGluZ0NvbnRleHQsIGNsYXNzSW5kZXgsIGlucHV0LCBkaXJlY3RpdmVTdHlsaW5nSW5kZXgsIGZvcmNlT3ZlcnJpZGVdO1xuICAgIGVucXVldWVIb3N0SW5zdHJ1Y3Rpb24oc3R5bGluZ0NvbnRleHQsIGRpcmVjdGl2ZVN0eWxpbmdJbmRleCwgdXBkYXRlY2xhc3NQcm9wLCBhcmdzKTtcbiAgfSBlbHNlIHtcbiAgICB1cGRhdGVjbGFzc1Byb3AoXG4gICAgICAgIHN0eWxpbmdDb250ZXh0LCBjbGFzc0luZGV4LCBpbnB1dCwgREVGQVVMVF9URU1QTEFURV9ESVJFQ1RJVkVfSU5ERVgsIGZvcmNlT3ZlcnJpZGUpO1xuICB9XG5cbiAgaWYgKHJ1bnRpbWVJc05ld1N0eWxpbmdJblVzZSgpKSB7XG4gICAgY29uc3QgcHJvcCA9IGdldEJpbmRpbmdOYW1lRnJvbUluZGV4KHN0eWxpbmdDb250ZXh0LCBjbGFzc0luZGV4LCBkaXJlY3RpdmVTdHlsaW5nSW5kZXgsIHRydWUpO1xuXG4gICAgLy8gdGhlIHJlYXNvbiB3aHkgd2UgY2FzdCB0aGUgdmFsdWUgYXMgYGJvb2xlYW5gIGlzXG4gICAgLy8gYmVjYXVzZSB0aGUgbmV3IHN0eWxpbmcgcmVmYWN0b3IgZG9lcyBub3QgeWV0IHN1cHBvcnRcbiAgICAvLyBzYW5pdGl6YXRpb24gb3IgYW5pbWF0aW9uIHBsYXllcnMuXG4gICAgbmV3Q2xhc3NQcm9wKHByb3AsIGlucHV0IGFzIGJvb2xlYW4pO1xuICB9XG59XG5cblxuZnVuY3Rpb24gYm9vbGVhbk9yTnVsbCh2YWx1ZTogYW55KTogYm9vbGVhbnxudWxsIHtcbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ2Jvb2xlYW4nKSByZXR1cm4gdmFsdWU7XG4gIHJldHVybiB2YWx1ZSA/IHRydWUgOiBudWxsO1xufVxuXG5cbi8qKlxuICogVXBkYXRlIHN0eWxlIGJpbmRpbmdzIHVzaW5nIGFuIG9iamVjdCBsaXRlcmFsIG9uIGFuIGVsZW1lbnQuXG4gKlxuICogVGhpcyBpbnN0cnVjdGlvbiBpcyBtZWFudCB0byBhcHBseSBzdHlsaW5nIHZpYSB0aGUgYFtzdHlsZV09XCJleHBcImAgdGVtcGxhdGUgYmluZGluZ3MuXG4gKiBXaGVuIHN0eWxlcyBhcmUgYXBwbGllZCB0byB0aGUgZWxlbWVudCB0aGV5IHdpbGwgdGhlbiBiZSB1cGRhdGVkIHdpdGggcmVzcGVjdCB0b1xuICogYW55IHN0eWxlcy9jbGFzc2VzIHNldCB2aWEgYHN0eWxlUHJvcGAuIElmIGFueSBzdHlsZXMgYXJlIHNldCB0byBmYWxzeVxuICogdGhlbiB0aGV5IHdpbGwgYmUgcmVtb3ZlZCBmcm9tIHRoZSBlbGVtZW50LlxuICpcbiAqIE5vdGUgdGhhdCB0aGUgc3R5bGluZyBpbnN0cnVjdGlvbiB3aWxsIG5vdCBiZSBhcHBsaWVkIHVudGlsIGBzdHlsaW5nQXBwbHlgIGlzIGNhbGxlZC5cbiAqXG4gKiBAcGFyYW0gc3R5bGVzIEEga2V5L3ZhbHVlIHN0eWxlIG1hcCBvZiB0aGUgc3R5bGVzIHRoYXQgd2lsbCBiZSBhcHBsaWVkIHRvIHRoZSBnaXZlbiBlbGVtZW50LlxuICogICAgICAgIEFueSBtaXNzaW5nIHN0eWxlcyAodGhhdCBoYXZlIGFscmVhZHkgYmVlbiBhcHBsaWVkIHRvIHRoZSBlbGVtZW50IGJlZm9yZWhhbmQpIHdpbGwgYmVcbiAqICAgICAgICByZW1vdmVkICh1bnNldCkgZnJvbSB0aGUgZWxlbWVudCdzIHN0eWxpbmcuXG4gKlxuICogTm90ZSB0aGF0IHRoaXMgd2lsbCBhcHBseSB0aGUgcHJvdmlkZWQgc3R5bGVNYXAgdmFsdWUgdG8gdGhlIGhvc3QgZWxlbWVudCBpZiB0aGlzIGZ1bmN0aW9uXG4gKiBpcyBjYWxsZWQgd2l0aGluIGEgaG9zdCBiaW5kaW5nLlxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1c3R5bGVNYXAoc3R5bGVzOiB7W3N0eWxlTmFtZTogc3RyaW5nXTogYW55fSB8IE5PX0NIQU5HRSB8IG51bGwpOiB2b2lkIHtcbiAgY29uc3QgaW5kZXggPSBnZXRTZWxlY3RlZEluZGV4KCk7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3Qgc3R5bGluZ0NvbnRleHQgPSBnZXRTdHlsaW5nQ29udGV4dChpbmRleCwgbFZpZXcpO1xuICBjb25zdCBkaXJlY3RpdmVTdHlsaW5nSW5kZXggPSBnZXRBY3RpdmVEaXJlY3RpdmVTdHlsaW5nSW5kZXgoKTtcbiAgaWYgKGRpcmVjdGl2ZVN0eWxpbmdJbmRleCkge1xuICAgIGNvbnN0IGFyZ3M6IFBhcmFtc09mPHR5cGVvZiB1cGRhdGVTdHlsZU1hcD4gPSBbc3R5bGluZ0NvbnRleHQsIHN0eWxlcywgZGlyZWN0aXZlU3R5bGluZ0luZGV4XTtcbiAgICBlbnF1ZXVlSG9zdEluc3RydWN0aW9uKHN0eWxpbmdDb250ZXh0LCBkaXJlY3RpdmVTdHlsaW5nSW5kZXgsIHVwZGF0ZVN0eWxlTWFwLCBhcmdzKTtcbiAgfSBlbHNlIHtcbiAgICBjb25zdCB0Tm9kZSA9IGdldFROb2RlKGluZGV4LCBsVmlldyk7XG5cbiAgICAvLyBpbnB1dHMgYXJlIG9ubHkgZXZhbHVhdGVkIGZyb20gYSB0ZW1wbGF0ZSBiaW5kaW5nIGludG8gYSBkaXJlY3RpdmUsIHRoZXJlZm9yZSxcbiAgICAvLyB0aGVyZSBzaG91bGQgbm90IGJlIGEgc2l0dWF0aW9uIHdoZXJlIGEgZGlyZWN0aXZlIGhvc3QgYmluZGluZ3MgZnVuY3Rpb25cbiAgICAvLyBldmFsdWF0ZXMgdGhlIGlucHV0cyAodGhpcyBzaG91bGQgb25seSBoYXBwZW4gaW4gdGhlIHRlbXBsYXRlIGZ1bmN0aW9uKVxuICAgIGlmIChoYXNTdHlsZUlucHV0KHROb2RlKSAmJiBzdHlsZXMgIT09IE5PX0NIQU5HRSkge1xuICAgICAgY29uc3QgaW5pdGlhbFN0eWxlcyA9IGdldEluaXRpYWxDbGFzc05hbWVWYWx1ZShzdHlsaW5nQ29udGV4dCk7XG4gICAgICBjb25zdCBzdHlsZUlucHV0VmFsID1cbiAgICAgICAgICAoaW5pdGlhbFN0eWxlcy5sZW5ndGggPyAoaW5pdGlhbFN0eWxlcyArICcgJykgOiAnJykgKyBmb3JjZVN0eWxlc0FzU3RyaW5nKHN0eWxlcyk7XG4gICAgICBzZXRJbnB1dHNGb3JQcm9wZXJ0eShsVmlldywgdE5vZGUuaW5wdXRzICFbJ3N0eWxlJ10gISwgc3R5bGVJbnB1dFZhbCk7XG4gICAgICBzdHlsZXMgPSBOT19DSEFOR0U7XG4gICAgfVxuICAgIHVwZGF0ZVN0eWxlTWFwKHN0eWxpbmdDb250ZXh0LCBzdHlsZXMpO1xuICB9XG5cbiAgaWYgKHJ1bnRpbWVJc05ld1N0eWxpbmdJblVzZSgpKSB7XG4gICAgbmV3U3R5bGVNYXAoc3R5bGVzKTtcbiAgfVxufVxuXG5cbi8qKlxuICogVXBkYXRlIGNsYXNzIGJpbmRpbmdzIHVzaW5nIGFuIG9iamVjdCBsaXRlcmFsIG9yIGNsYXNzLXN0cmluZyBvbiBhbiBlbGVtZW50LlxuICpcbiAqIFRoaXMgaW5zdHJ1Y3Rpb24gaXMgbWVhbnQgdG8gYXBwbHkgc3R5bGluZyB2aWEgdGhlIGBbY2xhc3NdPVwiZXhwXCJgIHRlbXBsYXRlIGJpbmRpbmdzLlxuICogV2hlbiBjbGFzc2VzIGFyZSBhcHBsaWVkIHRvIHRoZSBlbGVtZW50IHRoZXkgd2lsbCB0aGVuIGJlIHVwZGF0ZWQgd2l0aFxuICogcmVzcGVjdCB0byBhbnkgc3R5bGVzL2NsYXNzZXMgc2V0IHZpYSBgY2xhc3NQcm9wYC4gSWYgYW55XG4gKiBjbGFzc2VzIGFyZSBzZXQgdG8gZmFsc3kgdGhlbiB0aGV5IHdpbGwgYmUgcmVtb3ZlZCBmcm9tIHRoZSBlbGVtZW50LlxuICpcbiAqIE5vdGUgdGhhdCB0aGUgc3R5bGluZyBpbnN0cnVjdGlvbiB3aWxsIG5vdCBiZSBhcHBsaWVkIHVudGlsIGBzdHlsaW5nQXBwbHlgIGlzIGNhbGxlZC5cbiAqIE5vdGUgdGhhdCB0aGlzIHdpbGwgdGhlIHByb3ZpZGVkIGNsYXNzTWFwIHZhbHVlIHRvIHRoZSBob3N0IGVsZW1lbnQgaWYgdGhpcyBmdW5jdGlvbiBpcyBjYWxsZWRcbiAqIHdpdGhpbiBhIGhvc3QgYmluZGluZy5cbiAqXG4gKiBAcGFyYW0gY2xhc3NlcyBBIGtleS92YWx1ZSBtYXAgb3Igc3RyaW5nIG9mIENTUyBjbGFzc2VzIHRoYXQgd2lsbCBiZSBhZGRlZCB0byB0aGVcbiAqICAgICAgICBnaXZlbiBlbGVtZW50LiBBbnkgbWlzc2luZyBjbGFzc2VzICh0aGF0IGhhdmUgYWxyZWFkeSBiZWVuIGFwcGxpZWQgdG8gdGhlIGVsZW1lbnRcbiAqICAgICAgICBiZWZvcmVoYW5kKSB3aWxsIGJlIHJlbW92ZWQgKHVuc2V0KSBmcm9tIHRoZSBlbGVtZW50J3MgbGlzdCBvZiBDU1MgY2xhc3Nlcy5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWNsYXNzTWFwKGNsYXNzZXM6IHtbc3R5bGVOYW1lOiBzdHJpbmddOiBhbnl9IHwgc3RyaW5nIHwgbnVsbCk6IHZvaWQge1xuICBjbGFzc01hcEludGVybmFsKGdldExWaWV3KCksIGdldFNlbGVjdGVkSW5kZXgoKSwgZ2V0QWN0aXZlRGlyZWN0aXZlU3R5bGluZ0luZGV4KCksIGNsYXNzZXMpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY2xhc3NNYXBJbnRlcm5hbChcbiAgICBsVmlldzogTFZpZXcsIHNlbGVjdGVkSW5kZXg6IG51bWJlciwgZGlyZWN0aXZlU3R5bGluZ0luZGV4OiBudW1iZXIsXG4gICAgY2xhc3Nlczoge1tzdHlsZU5hbWU6IHN0cmluZ106IGFueX0gfCBzdHJpbmcgfCBudWxsKSB7XG4gIGNvbnN0IHN0eWxpbmdDb250ZXh0ID0gZ2V0U3R5bGluZ0NvbnRleHQoc2VsZWN0ZWRJbmRleCwgbFZpZXcpO1xuICBpZiAoZGlyZWN0aXZlU3R5bGluZ0luZGV4KSB7XG4gICAgY29uc3QgYXJnczogUGFyYW1zT2Y8dHlwZW9mIHVwZGF0ZUNsYXNzTWFwPiA9IFtzdHlsaW5nQ29udGV4dCwgY2xhc3NlcywgZGlyZWN0aXZlU3R5bGluZ0luZGV4XTtcbiAgICBlbnF1ZXVlSG9zdEluc3RydWN0aW9uKHN0eWxpbmdDb250ZXh0LCBkaXJlY3RpdmVTdHlsaW5nSW5kZXgsIHVwZGF0ZUNsYXNzTWFwLCBhcmdzKTtcbiAgfSBlbHNlIHtcbiAgICBjb25zdCB0Tm9kZSA9IGdldFROb2RlKHNlbGVjdGVkSW5kZXgsIGxWaWV3KTtcbiAgICAvLyBpbnB1dHMgYXJlIG9ubHkgZXZhbHVhdGVkIGZyb20gYSB0ZW1wbGF0ZSBiaW5kaW5nIGludG8gYSBkaXJlY3RpdmUsIHRoZXJlZm9yZSxcbiAgICAvLyB0aGVyZSBzaG91bGQgbm90IGJlIGEgc2l0dWF0aW9uIHdoZXJlIGEgZGlyZWN0aXZlIGhvc3QgYmluZGluZ3MgZnVuY3Rpb25cbiAgICAvLyBldmFsdWF0ZXMgdGhlIGlucHV0cyAodGhpcyBzaG91bGQgb25seSBoYXBwZW4gaW4gdGhlIHRlbXBsYXRlIGZ1bmN0aW9uKVxuICAgIGlmIChoYXNDbGFzc0lucHV0KHROb2RlKSkge1xuICAgICAgY29uc3QgaW5pdGlhbENsYXNzZXMgPSBnZXRJbml0aWFsQ2xhc3NOYW1lVmFsdWUoc3R5bGluZ0NvbnRleHQpO1xuICAgICAgY29uc3QgY2xhc3NJbnB1dFZhbCA9XG4gICAgICAgICAgKGluaXRpYWxDbGFzc2VzLmxlbmd0aCA/IChpbml0aWFsQ2xhc3NlcyArICcgJykgOiAnJykgKyBmb3JjZUNsYXNzZXNBc1N0cmluZyhjbGFzc2VzKTtcbiAgICAgIHNldElucHV0c0ZvclByb3BlcnR5KGxWaWV3LCB0Tm9kZS5pbnB1dHMgIVsnY2xhc3MnXSAhLCBjbGFzc0lucHV0VmFsKTtcbiAgICAgIGNsYXNzZXMgPSBOT19DSEFOR0U7XG4gICAgfVxuICAgIHVwZGF0ZUNsYXNzTWFwKHN0eWxpbmdDb250ZXh0LCBjbGFzc2VzKTtcbiAgfVxuXG4gIGlmIChydW50aW1lSXNOZXdTdHlsaW5nSW5Vc2UoKSkge1xuICAgIG5ld0NsYXNzTWFwKGNsYXNzZXMpO1xuICB9XG59XG5cbi8qKlxuICogQXBwbHkgYWxsIHN0eWxlIGFuZCBjbGFzcyBiaW5kaW5nIHZhbHVlcyB0byB0aGUgZWxlbWVudC5cbiAqXG4gKiBUaGlzIGluc3RydWN0aW9uIGlzIG1lYW50IHRvIGJlIHJ1biBhZnRlciBgc3R5bGVNYXBgLCBgY2xhc3NNYXBgLFxuICogYHN0eWxlUHJvcGAgb3IgYGNsYXNzUHJvcGAgaW5zdHJ1Y3Rpb25zIGhhdmUgYmVlbiBydW4gYW5kIHdpbGxcbiAqIG9ubHkgYXBwbHkgc3R5bGluZyB0byB0aGUgZWxlbWVudCBpZiBhbnkgc3R5bGluZyBiaW5kaW5ncyBoYXZlIGJlZW4gdXBkYXRlZC5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtXN0eWxpbmdBcHBseSgpOiB2b2lkIHtcbiAgY29uc3QgaW5kZXggPSBnZXRTZWxlY3RlZEluZGV4KCk7XG4gIGNvbnN0IGRpcmVjdGl2ZVN0eWxpbmdJbmRleCA9XG4gICAgICBnZXRBY3RpdmVEaXJlY3RpdmVTdHlsaW5nSW5kZXgoKSB8fCBERUZBVUxUX1RFTVBMQVRFX0RJUkVDVElWRV9JTkRFWDtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCB0Tm9kZSA9IGdldFROb2RlKGluZGV4LCBsVmlldyk7XG5cbiAgLy8gaWYgYSBub24tZWxlbWVudCB2YWx1ZSBpcyBiZWluZyBwcm9jZXNzZWQgdGhlbiB3ZSBjYW4ndCByZW5kZXIgdmFsdWVzXG4gIC8vIG9uIHRoZSBlbGVtZW50IGF0IGFsbCB0aGVyZWZvcmUgYnkgc2V0dGluZyB0aGUgcmVuZGVyZXIgdG8gbnVsbCB0aGVuXG4gIC8vIHRoZSBzdHlsaW5nIGFwcGx5IGNvZGUga25vd3Mgbm90IHRvIGFjdHVhbGx5IGFwcGx5IHRoZSB2YWx1ZXMuLi5cbiAgY29uc3QgcmVuZGVyZXIgPSB0Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuRWxlbWVudCA/IGxWaWV3W1JFTkRFUkVSXSA6IG51bGw7XG4gIGNvbnN0IGlzRmlyc3RSZW5kZXIgPSAobFZpZXdbRkxBR1NdICYgTFZpZXdGbGFncy5GaXJzdExWaWV3UGFzcykgIT09IDA7XG4gIGNvbnN0IHN0eWxpbmdDb250ZXh0ID0gZ2V0U3R5bGluZ0NvbnRleHQoaW5kZXgsIGxWaWV3KTtcblxuICBpZiAocnVudGltZUFsbG93T2xkU3R5bGluZygpKSB7XG4gICAgY29uc3QgdG90YWxQbGF5ZXJzUXVldWVkID0gcmVuZGVyU3R5bGluZyhcbiAgICAgICAgc3R5bGluZ0NvbnRleHQsIHJlbmRlcmVyLCBsVmlldywgaXNGaXJzdFJlbmRlciwgbnVsbCwgbnVsbCwgZGlyZWN0aXZlU3R5bGluZ0luZGV4KTtcbiAgICBpZiAodG90YWxQbGF5ZXJzUXVldWVkID4gMCkge1xuICAgICAgY29uc3Qgcm9vdENvbnRleHQgPSBnZXRSb290Q29udGV4dChsVmlldyk7XG4gICAgICBzY2hlZHVsZVRpY2socm9vdENvbnRleHQsIFJvb3RDb250ZXh0RmxhZ3MuRmx1c2hQbGF5ZXJzKTtcbiAgICB9XG4gIH1cblxuICAvLyBiZWNhdXNlIHNlbGVjdChuKSBtYXkgbm90IHJ1biBiZXR3ZWVuIGV2ZXJ5IGluc3RydWN0aW9uLCB0aGUgY2FjaGVkIHN0eWxpbmdcbiAgLy8gY29udGV4dCBtYXkgbm90IGdldCBjbGVhcmVkIGJldHdlZW4gZWxlbWVudHMuIFRoZSByZWFzb24gZm9yIHRoaXMgaXMgYmVjYXVzZVxuICAvLyBzdHlsaW5nIGJpbmRpbmdzIChsaWtlIGBbc3R5bGVdYCBhbmQgYFtjbGFzc11gKSBhcmUgbm90IHJlY29nbml6ZWQgYXMgcHJvcGVydHlcbiAgLy8gYmluZGluZ3MgYnkgZGVmYXVsdCBzbyBhIHNlbGVjdChuKSBpbnN0cnVjdGlvbiBpcyBub3QgZ2VuZXJhdGVkLiBUbyBlbnN1cmUgdGhlXG4gIC8vIGNvbnRleHQgaXMgbG9hZGVkIGNvcnJlY3RseSBmb3IgdGhlIG5leHQgZWxlbWVudCB0aGUgY2FjaGUgYmVsb3cgaXMgcHJlLWVtcHRpdmVseVxuICAvLyBjbGVhcmVkIGJlY2F1c2UgdGhlcmUgaXMgbm8gY29kZSBpbiBBbmd1bGFyIHRoYXQgYXBwbGllcyBtb3JlIHN0eWxpbmcgY29kZSBhZnRlciBhXG4gIC8vIHN0eWxpbmcgZmx1c2ggaGFzIG9jY3VycmVkLiBOb3RlIHRoYXQgdGhpcyB3aWxsIGJlIGZpeGVkIG9uY2UgRlctMTI1NCBsYW5kcy5cbiAgc2V0Q2FjaGVkU3R5bGluZ0NvbnRleHQobnVsbCk7XG5cbiAgaWYgKHJ1bnRpbWVJc05ld1N0eWxpbmdJblVzZSgpKSB7XG4gICAgbmV3U3R5bGluZ0FwcGx5KCk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEFjdGl2ZURpcmVjdGl2ZVN0eWxpbmdJbmRleCgpIHtcbiAgLy8gd2hlbmV2ZXIgYSBkaXJlY3RpdmUncyBob3N0QmluZGluZ3MgZnVuY3Rpb24gaXMgY2FsbGVkIGEgdW5pcXVlSWQgdmFsdWVcbiAgLy8gaXMgYXNzaWduZWQuIE5vcm1hbGx5IHRoaXMgaXMgZW5vdWdoIHRvIGhlbHAgZGlzdGluZ3Vpc2ggb25lIGRpcmVjdGl2ZVxuICAvLyBmcm9tIGFub3RoZXIgZm9yIHRoZSBzdHlsaW5nIGNvbnRleHQsIGJ1dCB0aGVyZSBhcmUgc2l0dWF0aW9ucyB3aGVyZSBhXG4gIC8vIHN1Yi1jbGFzcyBkaXJlY3RpdmUgY291bGQgaW5oZXJpdCBhbmQgYXNzaWduIHN0eWxpbmcgaW4gY29uY2VydCB3aXRoIGFcbiAgLy8gcGFyZW50IGRpcmVjdGl2ZS4gVG8gaGVscCB0aGUgc3R5bGluZyBjb2RlIGRpc3Rpbmd1aXNoIGJldHdlZW4gYSBwYXJlbnRcbiAgLy8gc3ViLWNsYXNzZWQgZGlyZWN0aXZlIHRoZSBpbmhlcml0YW5jZSBkZXB0aCBpcyB0YWtlbiBpbnRvIGFjY291bnQgYXMgd2VsbC5cbiAgcmV0dXJuIGdldEFjdGl2ZURpcmVjdGl2ZUlkKCkgKyBnZXRBY3RpdmVEaXJlY3RpdmVTdXBlckNsYXNzRGVwdGgoKTtcbn1cblxuZnVuY3Rpb24gZ2V0U3R5bGluZ0NvbnRleHQoaW5kZXg6IG51bWJlciwgbFZpZXc6IExWaWV3KSB7XG4gIGxldCBjb250ZXh0ID0gZ2V0Q2FjaGVkU3R5bGluZ0NvbnRleHQoKTtcbiAgaWYgKCFjb250ZXh0KSB7XG4gICAgY29udGV4dCA9IGdldFN0eWxpbmdDb250ZXh0RnJvbUxWaWV3KGluZGV4ICsgSEVBREVSX09GRlNFVCwgbFZpZXcpO1xuICAgIHNldENhY2hlZFN0eWxpbmdDb250ZXh0KGNvbnRleHQpO1xuICB9IGVsc2UgaWYgKG5nRGV2TW9kZSkge1xuICAgIGNvbnN0IGFjdHVhbENvbnRleHQgPSBnZXRTdHlsaW5nQ29udGV4dEZyb21MVmlldyhpbmRleCArIEhFQURFUl9PRkZTRVQsIGxWaWV3KTtcbiAgICBhc3NlcnRFcXVhbChjb250ZXh0LCBhY3R1YWxDb250ZXh0LCAnVGhlIGNhY2hlZCBzdHlsaW5nIGNvbnRleHQgaXMgaW52YWxpZCcpO1xuICB9XG4gIHJldHVybiBjb250ZXh0O1xufVxuIl19