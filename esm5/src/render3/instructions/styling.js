import { assertEqual } from '../../util/assert';
import { FLAGS, HEADER_OFFSET, RENDERER } from '../interfaces/view';
import { getActiveDirectiveId, getActiveDirectiveSuperClassDepth, getLView, getPreviousOrParentTNode, getSelectedIndex } from '../state';
import { getInitialClassNameValue, renderStyling, updateClassMap, updateClassProp as updateElementClassProp, updateContextWithBindings, updateStyleMap, updateStyleProp as updateElementStyleProp } from '../styling/class_and_style_bindings';
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
 * - elementStyling
 * - elementStyleMap
 * - elementClassMap
 * - elementStyleProp
 * - elementClassProp
 * - elementStylingApply
 *
 * Host bindings level styling instructions:
 * - elementHostStyling
 * - elementHostStyleMap
 * - elementHostClassMap
 * - elementHostStyleProp
 * - elementHostClassProp
 * - elementHostStylingApply
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
 *        The `elementClassProp` instruction refers to the class name by index in
 *        this array (i.e. `['foo', 'bar']` means `foo=0` and `bar=1`).
 * @param styleBindingNames An array containing bindable style properties.
 *        The `elementStyleProp` instruction refers to the class name by index in
 *        this array (i.e. `['width', 'height']` means `width=0` and `height=1`).
 * @param styleSanitizer An optional sanitizer function that will be used to sanitize any CSS
 *        style values that are applied to the element (during rendering).
 *
 * @codeGenApi
 */
export function ɵɵelementStyling(classBindingNames, styleBindingNames, styleSanitizer) {
    var tNode = getPreviousOrParentTNode();
    if (!tNode.stylingTemplate) {
        tNode.stylingTemplate = createEmptyStylingContext();
    }
    // calling the function below ensures that the template's binding values
    // are applied as the first set of bindings into the context. If any other
    // styling bindings are set on the same element (by directives and/or
    // components) then they will be applied at the end of the `elementEnd`
    // instruction (because directives are created first before styling is
    // executed for a new element).
    initElementStyling(tNode, classBindingNames, styleBindingNames, styleSanitizer, DEFAULT_TEMPLATE_DIRECTIVE_INDEX);
}
/**
 * Allocates style and class binding properties on the host element during creation mode
 * within the host bindings function of a directive or component.
 *
 * This instruction is meant to be called during creation mode to register all
 * dynamic style and class host bindings on the host element of a directive or
 * component. Note that this is only used for binding values (see `elementHostAttrs`
 * to learn how to assign static styling values to the host element).
 *
 * @param classBindingNames An array containing bindable class names.
 *        The `elementHostClassProp` instruction refers to the class name by index in
 *        this array (i.e. `['foo', 'bar']` means `foo=0` and `bar=1`).
 * @param styleBindingNames An array containing bindable style properties.
 *        The `elementHostStyleProp` instruction refers to the class name by index in
 *        this array (i.e. `['width', 'height']` means `width=0` and `height=1`).
 * @param styleSanitizer An optional sanitizer function that will be used to sanitize any CSS
 *        style values that are applied to the element (during rendering).
 *        Note that the sanitizer instance itself is tied to the provided `directive` and
 *        will not be used if the same property is assigned in another directive or
 *        on the element directly.
 *
 * @codeGenApi
 */
export function ɵɵelementHostStyling(classBindingNames, styleBindingNames, styleSanitizer) {
    var tNode = getPreviousOrParentTNode();
    if (!tNode.stylingTemplate) {
        tNode.stylingTemplate = createEmptyStylingContext();
    }
    var directiveStylingIndex = getActiveDirectiveStylingIndex();
    // despite the binding being applied in a queue (below), the allocation
    // of the directive into the context happens right away. The reason for
    // this is to retain the ordering of the directives (which is important
    // for the prioritization of bindings).
    allocateOrUpdateDirectiveIntoContext(tNode.stylingTemplate, directiveStylingIndex);
    var fns = tNode.onElementCreationFns = tNode.onElementCreationFns || [];
    fns.push(function () {
        initElementStyling(tNode, classBindingNames, styleBindingNames, styleSanitizer, directiveStylingIndex);
        registerHostDirective(tNode.stylingTemplate, directiveStylingIndex);
    });
}
function initElementStyling(tNode, classBindingNames, styleBindingNames, styleSanitizer, directiveStylingIndex) {
    updateContextWithBindings(tNode.stylingTemplate, directiveStylingIndex, classBindingNames, styleBindingNames, styleSanitizer);
}
/**
 * Update a style binding on an element with the provided value.
 *
 * If the style value is falsy then it will be removed from the element
 * (or assigned a different value depending if there are any styles placed
 * on the element with `elementStyleMap` or any static styles that are
 * present from when the element was created with `elementStyling`).
 *
 * Note that the styling element is updated as part of `elementStylingApply`.
 *
 * @param index Index of the element's with which styling is associated.
 * @param styleIndex Index of style to update. This index value refers to the
 *        index of the style in the style bindings array that was passed into
 *        `elementStyling`.
 * @param value New value to write (falsy to remove). Note that if a directive also
 *        attempts to write to the same binding value (via `elementHostStyleProp`)
 *        then it will only be able to do so if the binding value assigned via
 *        `elementStyleProp` is falsy (or doesn't exist at all).
 * @param suffix Optional suffix. Used with scalar values to add unit such as `px`.
 *        Note that when a suffix is provided then the underlying sanitizer will
 *        be ignored.
 * @param forceOverride Whether or not to update the styling value immediately
 *        (despite the other bindings possibly having priority)
 *
 * @codeGenApi
 */
export function ɵɵelementStyleProp(index, styleIndex, value, suffix, forceOverride) {
    var valueToAdd = resolveStylePropValue(value, suffix);
    var stylingContext = getStylingContext(index, getLView());
    updateElementStyleProp(stylingContext, styleIndex, valueToAdd, DEFAULT_TEMPLATE_DIRECTIVE_INDEX, forceOverride);
}
/**
 * Update a host style binding value on the host element within a component/directive.
 *
 * If the style value is falsy then it will be removed from the host element
 * (or assigned a different value depending if there are any styles placed
 * on the same element with `elementHostStyleMap` or any static styles that
 * are present from when the element was patched with `elementHostStyling`).
 *
 * Note that the styling applied to the host element once
 * `elementHostStylingApply` is called.
 *
 * @param styleIndex Index of style to update. This index value refers to the
 *        index of the style in the style bindings array that was passed into
 *        `elementHostStyling`.
 * @param value New value to write (falsy to remove). The value may or may not
 *        be applied to the element depending on the template/component/directive
 *        prioritization (see `interfaces/styling.ts`)
 * @param suffix Optional suffix. Used with scalar values to add unit such as `px`.
 *        Note that when a suffix is provided then the underlying sanitizer will
 *        be ignored.
 * @param forceOverride Whether or not to update the styling value immediately
 *        (despite the other bindings possibly having priority)
 *
 * @codeGenApi
 */
export function ɵɵelementHostStyleProp(styleIndex, value, suffix, forceOverride) {
    var directiveStylingIndex = getActiveDirectiveStylingIndex();
    var hostElementIndex = getSelectedIndex();
    var stylingContext = getStylingContext(hostElementIndex, getLView());
    var valueToAdd = resolveStylePropValue(value, suffix);
    var args = [stylingContext, styleIndex, valueToAdd, directiveStylingIndex, forceOverride];
    enqueueHostInstruction(stylingContext, directiveStylingIndex, updateElementStyleProp, args);
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
 * `elementStyling` within the creation block.
 *
 * @param index Index of the element's with which styling is associated.
 * @param classIndex Index of class to toggle. This index value refers to the
 *        index of the class in the class bindings array that was passed into
 *        `elementStyling` (which is meant to be called before this
 *        function is).
 * @param value A true/false value which will turn the class on or off.
 * @param forceOverride Whether or not this value will be applied regardless
 *        of where it is being set within the styling priority structure.
 *
 * @codeGenApi
 */
export function ɵɵelementClassProp(index, classIndex, value, forceOverride) {
    var input = (value instanceof BoundPlayerFactory) ?
        value :
        booleanOrNull(value);
    var stylingContext = getStylingContext(index, getLView());
    updateElementClassProp(stylingContext, classIndex, input, DEFAULT_TEMPLATE_DIRECTIVE_INDEX, forceOverride);
}
/**
 * Update a class host binding for a directive's/component's host element within
 * the host bindings function.
 *
 * This instruction is meant to handle the `@HostBinding('class.foo')` case and,
 * therefore, the class binding itself must already be allocated using
 * `elementHostStyling` within the creation block.
 *
 * @param classIndex Index of class to toggle. This index value refers to the
 *        index of the class in the class bindings array that was passed into
 *        `elementHostStlying` (which is meant to be called before this
 *        function is).
 * @param value A true/false value which will turn the class on or off.
 * @param forceOverride Whether or not this value will be applied regardless
 *        of where it is being set within the stylings priority structure.
 *
 * @codeGenApi
 */
export function ɵɵelementHostClassProp(classIndex, value, forceOverride) {
    var directiveStylingIndex = getActiveDirectiveStylingIndex();
    var hostElementIndex = getSelectedIndex();
    var stylingContext = getStylingContext(hostElementIndex, getLView());
    var input = (value instanceof BoundPlayerFactory) ?
        value :
        booleanOrNull(value);
    var args = [stylingContext, classIndex, input, directiveStylingIndex, forceOverride];
    enqueueHostInstruction(stylingContext, directiveStylingIndex, updateElementClassProp, args);
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
 * any styles/classes set via `elementStyleProp`. If any styles are set to falsy
 * then they will be removed from the element.
 *
 * Note that the styling instruction will not be applied until `elementStylingApply` is called.
 *
 * @param index Index of the element's with which styling is associated.
 * @param styles A key/value style map of the styles that will be applied to the given element.
 *        Any missing styles (that have already been applied to the element beforehand) will be
 *        removed (unset) from the element's styling.
 *
 * @codeGenApi
 */
export function ɵɵelementStyleMap(index, styles) {
    var lView = getLView();
    var stylingContext = getStylingContext(index, lView);
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
/**
 * Update class bindings using an object literal or class-string on an element.
 *
 * This instruction is meant to apply styling via the `[class]="exp"` template bindings.
 * When classes are applied to the element they will then be updated with
 * respect to any styles/classes set via `elementClassProp`. If any
 * classes are set to falsy then they will be removed from the element.
 *
 * Note that the styling instruction will not be applied until `elementStylingApply` is called.
 *
 * @param index Index of the element's with which styling is associated.
 * @param classes A key/value map or string of CSS classes that will be added to the
 *        given element. Any missing classes (that have already been applied to the element
 *        beforehand) will be removed (unset) from the element's list of CSS classes.
 *
 * @codeGenApi
 */
export function ɵɵelementClassMap(index, classes) {
    var lView = getLView();
    var stylingContext = getStylingContext(index, lView);
    var tNode = getTNode(index, lView);
    // inputs are only evaluated from a template binding into a directive, therefore,
    // there should not be a situation where a directive host bindings function
    // evaluates the inputs (this should only happen in the template function)
    if (hasClassInput(tNode) && classes !== NO_CHANGE) {
        var initialClasses = getInitialClassNameValue(stylingContext);
        var classInputVal = (initialClasses.length ? (initialClasses + ' ') : '') + forceClassesAsString(classes);
        setInputsForProperty(lView, tNode.inputs['class'], classInputVal);
        classes = NO_CHANGE;
    }
    updateClassMap(stylingContext, classes);
}
/**
 * Update style host bindings using object literals on an element within the host
 * bindings function for a directive/component.
 *
 * This instruction is meant to apply styling via the `@HostBinding('style')`
 * host bindings for a component's or directive's host element.
 * When styles are applied to the host element they will then be updated
 * with respect to any other styles set with `elementHostStyleProp`. If
 * If any styles are set to falsy then they will be removed from the element.
 *
 * Note that the styling instruction will not be applied until
 * `elementHostStylingApply` is called.
 *
 * @param styles A key/value style map of the styles that will be applied to the given element.
 *        Any missing styles (that have already been applied to the element beforehand) will be
 *        removed (unset) from the element's styling.
 *
 * @codeGenApi
 */
export function ɵɵelementHostStyleMap(styles) {
    var directiveStylingIndex = getActiveDirectiveStylingIndex();
    var hostElementIndex = getSelectedIndex();
    var stylingContext = getStylingContext(hostElementIndex, getLView());
    var args = [stylingContext, styles, directiveStylingIndex];
    enqueueHostInstruction(stylingContext, directiveStylingIndex, updateStyleMap, args);
}
/**
 * Update class host bindings using object literals on an element within the host
 * bindings function for a directive/component.
 *
 * This instruction is meant to apply styling via the `@HostBinding('class')`
 * host bindings for a component's or directive's host element.
 * When classes are applied to the host element they will then be updated
 * with respect to any other classes set with `elementHostClassProp`. If
 * any classes are set to falsy then they will be removed from the element.
 *
 * Note that the styling instruction will not be applied until
 * `elementHostStylingApply` is called.
 *
 * @param classes A key/value map or string of CSS classes that will be added to the
 *        given element. Any missing classes (that have already been applied to the element
 *        beforehand) will be removed (unset) from the element's list of CSS classes.
 *
 * @codeGenApi
 */
export function ɵɵelementHostClassMap(classes) {
    var directiveStylingIndex = getActiveDirectiveStylingIndex();
    var hostElementIndex = getSelectedIndex();
    var stylingContext = getStylingContext(hostElementIndex, getLView());
    var args = [stylingContext, classes, directiveStylingIndex];
    enqueueHostInstruction(stylingContext, directiveStylingIndex, updateClassMap, args);
}
/**
 * Apply all style and class binding values to the element.
 *
 * This instruction is meant to be run after `elementStyleMap`, `elementClassMap`,
 * `elementStyleProp` or `elementClassProp` instructions have been run and will
 * only apply styling to the element if any styling bindings have been updated.
 *
 * @param index Index of the element's with which styling is associated.
 *
 * @codeGenApi
 */
export function ɵɵelementStylingApply(index) {
    elementStylingApplyInternal(DEFAULT_TEMPLATE_DIRECTIVE_INDEX, index);
}
/**
 * Apply all style and class host binding values to the element.
 *
 * This instruction is meant to be run after both `elementHostStyleMap`
 * `elementHostClassMap`, `elementHostStyleProp` or `elementHostClassProp`
 * instructions have been run and will only apply styling to the host
 * element if any styling bindings have been updated.
 *
 * @codeGenApi
 */
export function ɵɵelementHostStylingApply() {
    elementStylingApplyInternal(getActiveDirectiveStylingIndex(), getSelectedIndex());
}
export function elementStylingApplyInternal(directiveStylingIndex, index) {
    var lView = getLView();
    var tNode = getTNode(index, lView);
    // if a non-element value is being processed then we can't render values
    // on the element at all therefore by setting the renderer to null then
    // the styling apply code knows not to actually apply the values...
    var renderer = tNode.type === 3 /* Element */ ? lView[RENDERER] : null;
    var isFirstRender = (lView[FLAGS] & 8 /* FirstLViewPass */) !== 0;
    var stylingContext = getStylingContext(index, lView);
    var totalPlayersQueued = renderStyling(stylingContext, renderer, lView, isFirstRender, null, null, directiveStylingIndex);
    if (totalPlayersQueued > 0) {
        var rootContext = getRootContext(lView);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3R5bGluZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaW5zdHJ1Y3Rpb25zL3N0eWxpbmcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBUUEsT0FBTyxFQUFDLFdBQVcsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBRzlDLE9BQU8sRUFBQyxLQUFLLEVBQUUsYUFBYSxFQUFxQixRQUFRLEVBQW1CLE1BQU0sb0JBQW9CLENBQUM7QUFDdkcsT0FBTyxFQUFDLG9CQUFvQixFQUFFLGlDQUFpQyxFQUFFLFFBQVEsRUFBRSx3QkFBd0IsRUFBRSxnQkFBZ0IsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUN2SSxPQUFPLEVBQUMsd0JBQXdCLEVBQUUsYUFBYSxFQUFFLGNBQWMsRUFBRSxlQUFlLElBQUksc0JBQXNCLEVBQUUseUJBQXlCLEVBQUUsY0FBYyxFQUFFLGVBQWUsSUFBSSxzQkFBc0IsRUFBQyxNQUFNLHFDQUFxQyxDQUFDO0FBQzdPLE9BQU8sRUFBVyxzQkFBc0IsRUFBRSxxQkFBcUIsRUFBQyxNQUFNLG9DQUFvQyxDQUFDO0FBQzNHLE9BQU8sRUFBQyxrQkFBa0IsRUFBQyxNQUFNLDJCQUEyQixDQUFDO0FBQzdELE9BQU8sRUFBQyxnQ0FBZ0MsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQ25FLE9BQU8sRUFBQyx1QkFBdUIsRUFBRSx1QkFBdUIsRUFBQyxNQUFNLGtCQUFrQixDQUFDO0FBQ2xGLE9BQU8sRUFBQyxvQ0FBb0MsRUFBRSx5QkFBeUIsRUFBRSxvQkFBb0IsRUFBRSxtQkFBbUIsRUFBRSwwQkFBMEIsRUFBRSxhQUFhLEVBQUUsYUFBYSxFQUFDLE1BQU0saUJBQWlCLENBQUM7QUFDck0sT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLFdBQVcsQ0FBQztBQUNwQyxPQUFPLEVBQUMsZUFBZSxFQUFDLE1BQU0sb0JBQW9CLENBQUM7QUFD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QUM7UUFDMUMsWUFBWSxDQUFDLFdBQVcsdUJBQWdDLENBQUM7S0FDMUQ7SUFFRCw4RUFBOEU7SUFDOUUsK0VBQStFO0lBQy9FLGlGQUFpRjtJQUNqRixpRkFBaUY7SUFDakYsb0ZBQW9GO0lBQ3BGLHFGQUFxRjtJQUNyRiwrRUFBK0U7SUFDL0UsdUJBQXVCLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDaEMsQ0FBQztBQUVELE1BQU0sVUFBVSw4QkFBOEI7SUFDNUMsMEVBQTBFO0lBQzFFLHlFQUF5RTtJQUN6RSx5RUFBeUU7SUFDekUseUVBQXlFO0lBQ3pFLDBFQUEwRTtJQUMxRSw2RUFBNkU7SUFDN0UsT0FBTyxvQkFBb0IsRUFBRSxHQUFHLGlDQUFpQyxFQUFFLENBQUM7QUFDdEUsQ0FBQztBQUVELFNBQVMsaUJBQWlCLENBQUMsS0FBYSxFQUFFLEtBQVk7SUFDcEQsSUFBSSxPQUFPLEdBQUcsdUJBQXVCLEVBQUUsQ0FBQztJQUN4QyxJQUFJLENBQUMsT0FBTyxFQUFFO1FBQ1osT0FBTyxHQUFHLDBCQUEwQixDQUFDLEtBQUssR0FBRyxhQUFhLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDbkUsdUJBQXVCLENBQUMsT0FBTyxDQUFDLENBQUM7S0FDbEM7U0FBTSxJQUFJLFNBQVMsRUFBRTtRQUNwQixJQUFNLGFBQWEsR0FBRywwQkFBMEIsQ0FBQyxLQUFLLEdBQUcsYUFBYSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQy9FLFdBQVcsQ0FBQyxPQUFPLEVBQUUsYUFBYSxFQUFFLHVDQUF1QyxDQUFDLENBQUM7S0FDOUU7SUFDRCxPQUFPLE9BQU8sQ0FBQztBQUNqQixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0IHtTdHlsZVNhbml0aXplRm59IGZyb20gJy4uLy4uL3Nhbml0aXphdGlvbi9zdHlsZV9zYW5pdGl6ZXInO1xuaW1wb3J0IHthc3NlcnRFcXVhbH0gZnJvbSAnLi4vLi4vdXRpbC9hc3NlcnQnO1xuaW1wb3J0IHtUTm9kZSwgVE5vZGVUeXBlfSBmcm9tICcuLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtQbGF5ZXJGYWN0b3J5fSBmcm9tICcuLi9pbnRlcmZhY2VzL3BsYXllcic7XG5pbXBvcnQge0ZMQUdTLCBIRUFERVJfT0ZGU0VULCBMVmlldywgTFZpZXdGbGFncywgUkVOREVSRVIsIFJvb3RDb250ZXh0RmxhZ3N9IGZyb20gJy4uL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2dldEFjdGl2ZURpcmVjdGl2ZUlkLCBnZXRBY3RpdmVEaXJlY3RpdmVTdXBlckNsYXNzRGVwdGgsIGdldExWaWV3LCBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUsIGdldFNlbGVjdGVkSW5kZXh9IGZyb20gJy4uL3N0YXRlJztcbmltcG9ydCB7Z2V0SW5pdGlhbENsYXNzTmFtZVZhbHVlLCByZW5kZXJTdHlsaW5nLCB1cGRhdGVDbGFzc01hcCwgdXBkYXRlQ2xhc3NQcm9wIGFzIHVwZGF0ZUVsZW1lbnRDbGFzc1Byb3AsIHVwZGF0ZUNvbnRleHRXaXRoQmluZGluZ3MsIHVwZGF0ZVN0eWxlTWFwLCB1cGRhdGVTdHlsZVByb3AgYXMgdXBkYXRlRWxlbWVudFN0eWxlUHJvcH0gZnJvbSAnLi4vc3R5bGluZy9jbGFzc19hbmRfc3R5bGVfYmluZGluZ3MnO1xuaW1wb3J0IHtQYXJhbXNPZiwgZW5xdWV1ZUhvc3RJbnN0cnVjdGlvbiwgcmVnaXN0ZXJIb3N0RGlyZWN0aXZlfSBmcm9tICcuLi9zdHlsaW5nL2hvc3RfaW5zdHJ1Y3Rpb25zX3F1ZXVlJztcbmltcG9ydCB7Qm91bmRQbGF5ZXJGYWN0b3J5fSBmcm9tICcuLi9zdHlsaW5nL3BsYXllcl9mYWN0b3J5JztcbmltcG9ydCB7REVGQVVMVF9URU1QTEFURV9ESVJFQ1RJVkVfSU5ERVh9IGZyb20gJy4uL3N0eWxpbmcvc2hhcmVkJztcbmltcG9ydCB7Z2V0Q2FjaGVkU3R5bGluZ0NvbnRleHQsIHNldENhY2hlZFN0eWxpbmdDb250ZXh0fSBmcm9tICcuLi9zdHlsaW5nL3N0YXRlJztcbmltcG9ydCB7YWxsb2NhdGVPclVwZGF0ZURpcmVjdGl2ZUludG9Db250ZXh0LCBjcmVhdGVFbXB0eVN0eWxpbmdDb250ZXh0LCBmb3JjZUNsYXNzZXNBc1N0cmluZywgZm9yY2VTdHlsZXNBc1N0cmluZywgZ2V0U3R5bGluZ0NvbnRleHRGcm9tTFZpZXcsIGhhc0NsYXNzSW5wdXQsIGhhc1N0eWxlSW5wdXR9IGZyb20gJy4uL3N0eWxpbmcvdXRpbCc7XG5pbXBvcnQge05PX0NIQU5HRX0gZnJvbSAnLi4vdG9rZW5zJztcbmltcG9ydCB7cmVuZGVyU3RyaW5naWZ5fSBmcm9tICcuLi91dGlsL21pc2NfdXRpbHMnO1xuaW1wb3J0IHtnZXRSb290Q29udGV4dH0gZnJvbSAnLi4vdXRpbC92aWV3X3RyYXZlcnNhbF91dGlscyc7XG5pbXBvcnQge2dldFROb2RlfSBmcm9tICcuLi91dGlsL3ZpZXdfdXRpbHMnO1xuXG5pbXBvcnQge3NjaGVkdWxlVGljaywgc2V0SW5wdXRzRm9yUHJvcGVydHl9IGZyb20gJy4vc2hhcmVkJztcblxuXG5cbi8qXG4gKiBUaGUgY29udGVudHMgb2YgdGhpcyBmaWxlIGluY2x1ZGUgdGhlIGluc3RydWN0aW9ucyBmb3IgYWxsIHN0eWxpbmctcmVsYXRlZFxuICogb3BlcmF0aW9ucyBpbiBBbmd1bGFyLlxuICpcbiAqIFRoZSBpbnN0cnVjdGlvbnMgcHJlc2VudCBpbiB0aGlzIGZpbGUgYXJlOlxuICpcbiAqIFRlbXBsYXRlIGxldmVsIHN0eWxpbmcgaW5zdHJ1Y3Rpb25zOlxuICogLSBlbGVtZW50U3R5bGluZ1xuICogLSBlbGVtZW50U3R5bGVNYXBcbiAqIC0gZWxlbWVudENsYXNzTWFwXG4gKiAtIGVsZW1lbnRTdHlsZVByb3BcbiAqIC0gZWxlbWVudENsYXNzUHJvcFxuICogLSBlbGVtZW50U3R5bGluZ0FwcGx5XG4gKlxuICogSG9zdCBiaW5kaW5ncyBsZXZlbCBzdHlsaW5nIGluc3RydWN0aW9uczpcbiAqIC0gZWxlbWVudEhvc3RTdHlsaW5nXG4gKiAtIGVsZW1lbnRIb3N0U3R5bGVNYXBcbiAqIC0gZWxlbWVudEhvc3RDbGFzc01hcFxuICogLSBlbGVtZW50SG9zdFN0eWxlUHJvcFxuICogLSBlbGVtZW50SG9zdENsYXNzUHJvcFxuICogLSBlbGVtZW50SG9zdFN0eWxpbmdBcHBseVxuICovXG5cbi8qKlxuICogQWxsb2NhdGVzIHN0eWxlIGFuZCBjbGFzcyBiaW5kaW5nIHByb3BlcnRpZXMgb24gdGhlIGVsZW1lbnQgZHVyaW5nIGNyZWF0aW9uIG1vZGUuXG4gKlxuICogVGhpcyBpbnN0cnVjdGlvbiBpcyBtZWFudCB0byBiZSBjYWxsZWQgZHVyaW5nIGNyZWF0aW9uIG1vZGUgdG8gcmVnaXN0ZXIgYWxsXG4gKiBkeW5hbWljIHN0eWxlIGFuZCBjbGFzcyBiaW5kaW5ncyBvbiB0aGUgZWxlbWVudC4gTm90ZSB0aGF0IHRoaXMgaXMgb25seSB1c2VkXG4gKiBmb3IgYmluZGluZyB2YWx1ZXMgKHNlZSBgZWxlbWVudFN0YXJ0YCB0byBsZWFybiBob3cgdG8gYXNzaWduIHN0YXRpYyBzdHlsaW5nXG4gKiB2YWx1ZXMgdG8gYW4gZWxlbWVudCkuXG4gKlxuICogQHBhcmFtIGNsYXNzQmluZGluZ05hbWVzIEFuIGFycmF5IGNvbnRhaW5pbmcgYmluZGFibGUgY2xhc3MgbmFtZXMuXG4gKiAgICAgICAgVGhlIGBlbGVtZW50Q2xhc3NQcm9wYCBpbnN0cnVjdGlvbiByZWZlcnMgdG8gdGhlIGNsYXNzIG5hbWUgYnkgaW5kZXggaW5cbiAqICAgICAgICB0aGlzIGFycmF5IChpLmUuIGBbJ2ZvbycsICdiYXInXWAgbWVhbnMgYGZvbz0wYCBhbmQgYGJhcj0xYCkuXG4gKiBAcGFyYW0gc3R5bGVCaW5kaW5nTmFtZXMgQW4gYXJyYXkgY29udGFpbmluZyBiaW5kYWJsZSBzdHlsZSBwcm9wZXJ0aWVzLlxuICogICAgICAgIFRoZSBgZWxlbWVudFN0eWxlUHJvcGAgaW5zdHJ1Y3Rpb24gcmVmZXJzIHRvIHRoZSBjbGFzcyBuYW1lIGJ5IGluZGV4IGluXG4gKiAgICAgICAgdGhpcyBhcnJheSAoaS5lLiBgWyd3aWR0aCcsICdoZWlnaHQnXWAgbWVhbnMgYHdpZHRoPTBgIGFuZCBgaGVpZ2h0PTFgKS5cbiAqIEBwYXJhbSBzdHlsZVNhbml0aXplciBBbiBvcHRpb25hbCBzYW5pdGl6ZXIgZnVuY3Rpb24gdGhhdCB3aWxsIGJlIHVzZWQgdG8gc2FuaXRpemUgYW55IENTU1xuICogICAgICAgIHN0eWxlIHZhbHVlcyB0aGF0IGFyZSBhcHBsaWVkIHRvIHRoZSBlbGVtZW50IChkdXJpbmcgcmVuZGVyaW5nKS5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWVsZW1lbnRTdHlsaW5nKFxuICAgIGNsYXNzQmluZGluZ05hbWVzPzogc3RyaW5nW10gfCBudWxsLCBzdHlsZUJpbmRpbmdOYW1lcz86IHN0cmluZ1tdIHwgbnVsbCxcbiAgICBzdHlsZVNhbml0aXplcj86IFN0eWxlU2FuaXRpemVGbiB8IG51bGwpOiB2b2lkIHtcbiAgY29uc3QgdE5vZGUgPSBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKTtcbiAgaWYgKCF0Tm9kZS5zdHlsaW5nVGVtcGxhdGUpIHtcbiAgICB0Tm9kZS5zdHlsaW5nVGVtcGxhdGUgPSBjcmVhdGVFbXB0eVN0eWxpbmdDb250ZXh0KCk7XG4gIH1cblxuICAvLyBjYWxsaW5nIHRoZSBmdW5jdGlvbiBiZWxvdyBlbnN1cmVzIHRoYXQgdGhlIHRlbXBsYXRlJ3MgYmluZGluZyB2YWx1ZXNcbiAgLy8gYXJlIGFwcGxpZWQgYXMgdGhlIGZpcnN0IHNldCBvZiBiaW5kaW5ncyBpbnRvIHRoZSBjb250ZXh0LiBJZiBhbnkgb3RoZXJcbiAgLy8gc3R5bGluZyBiaW5kaW5ncyBhcmUgc2V0IG9uIHRoZSBzYW1lIGVsZW1lbnQgKGJ5IGRpcmVjdGl2ZXMgYW5kL29yXG4gIC8vIGNvbXBvbmVudHMpIHRoZW4gdGhleSB3aWxsIGJlIGFwcGxpZWQgYXQgdGhlIGVuZCBvZiB0aGUgYGVsZW1lbnRFbmRgXG4gIC8vIGluc3RydWN0aW9uIChiZWNhdXNlIGRpcmVjdGl2ZXMgYXJlIGNyZWF0ZWQgZmlyc3QgYmVmb3JlIHN0eWxpbmcgaXNcbiAgLy8gZXhlY3V0ZWQgZm9yIGEgbmV3IGVsZW1lbnQpLlxuICBpbml0RWxlbWVudFN0eWxpbmcoXG4gICAgICB0Tm9kZSwgY2xhc3NCaW5kaW5nTmFtZXMsIHN0eWxlQmluZGluZ05hbWVzLCBzdHlsZVNhbml0aXplcixcbiAgICAgIERFRkFVTFRfVEVNUExBVEVfRElSRUNUSVZFX0lOREVYKTtcbn1cblxuLyoqXG4gKiBBbGxvY2F0ZXMgc3R5bGUgYW5kIGNsYXNzIGJpbmRpbmcgcHJvcGVydGllcyBvbiB0aGUgaG9zdCBlbGVtZW50IGR1cmluZyBjcmVhdGlvbiBtb2RlXG4gKiB3aXRoaW4gdGhlIGhvc3QgYmluZGluZ3MgZnVuY3Rpb24gb2YgYSBkaXJlY3RpdmUgb3IgY29tcG9uZW50LlxuICpcbiAqIFRoaXMgaW5zdHJ1Y3Rpb24gaXMgbWVhbnQgdG8gYmUgY2FsbGVkIGR1cmluZyBjcmVhdGlvbiBtb2RlIHRvIHJlZ2lzdGVyIGFsbFxuICogZHluYW1pYyBzdHlsZSBhbmQgY2xhc3MgaG9zdCBiaW5kaW5ncyBvbiB0aGUgaG9zdCBlbGVtZW50IG9mIGEgZGlyZWN0aXZlIG9yXG4gKiBjb21wb25lbnQuIE5vdGUgdGhhdCB0aGlzIGlzIG9ubHkgdXNlZCBmb3IgYmluZGluZyB2YWx1ZXMgKHNlZSBgZWxlbWVudEhvc3RBdHRyc2BcbiAqIHRvIGxlYXJuIGhvdyB0byBhc3NpZ24gc3RhdGljIHN0eWxpbmcgdmFsdWVzIHRvIHRoZSBob3N0IGVsZW1lbnQpLlxuICpcbiAqIEBwYXJhbSBjbGFzc0JpbmRpbmdOYW1lcyBBbiBhcnJheSBjb250YWluaW5nIGJpbmRhYmxlIGNsYXNzIG5hbWVzLlxuICogICAgICAgIFRoZSBgZWxlbWVudEhvc3RDbGFzc1Byb3BgIGluc3RydWN0aW9uIHJlZmVycyB0byB0aGUgY2xhc3MgbmFtZSBieSBpbmRleCBpblxuICogICAgICAgIHRoaXMgYXJyYXkgKGkuZS4gYFsnZm9vJywgJ2JhciddYCBtZWFucyBgZm9vPTBgIGFuZCBgYmFyPTFgKS5cbiAqIEBwYXJhbSBzdHlsZUJpbmRpbmdOYW1lcyBBbiBhcnJheSBjb250YWluaW5nIGJpbmRhYmxlIHN0eWxlIHByb3BlcnRpZXMuXG4gKiAgICAgICAgVGhlIGBlbGVtZW50SG9zdFN0eWxlUHJvcGAgaW5zdHJ1Y3Rpb24gcmVmZXJzIHRvIHRoZSBjbGFzcyBuYW1lIGJ5IGluZGV4IGluXG4gKiAgICAgICAgdGhpcyBhcnJheSAoaS5lLiBgWyd3aWR0aCcsICdoZWlnaHQnXWAgbWVhbnMgYHdpZHRoPTBgIGFuZCBgaGVpZ2h0PTFgKS5cbiAqIEBwYXJhbSBzdHlsZVNhbml0aXplciBBbiBvcHRpb25hbCBzYW5pdGl6ZXIgZnVuY3Rpb24gdGhhdCB3aWxsIGJlIHVzZWQgdG8gc2FuaXRpemUgYW55IENTU1xuICogICAgICAgIHN0eWxlIHZhbHVlcyB0aGF0IGFyZSBhcHBsaWVkIHRvIHRoZSBlbGVtZW50IChkdXJpbmcgcmVuZGVyaW5nKS5cbiAqICAgICAgICBOb3RlIHRoYXQgdGhlIHNhbml0aXplciBpbnN0YW5jZSBpdHNlbGYgaXMgdGllZCB0byB0aGUgcHJvdmlkZWQgYGRpcmVjdGl2ZWAgYW5kXG4gKiAgICAgICAgd2lsbCBub3QgYmUgdXNlZCBpZiB0aGUgc2FtZSBwcm9wZXJ0eSBpcyBhc3NpZ25lZCBpbiBhbm90aGVyIGRpcmVjdGl2ZSBvclxuICogICAgICAgIG9uIHRoZSBlbGVtZW50IGRpcmVjdGx5LlxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1ZWxlbWVudEhvc3RTdHlsaW5nKFxuICAgIGNsYXNzQmluZGluZ05hbWVzPzogc3RyaW5nW10gfCBudWxsLCBzdHlsZUJpbmRpbmdOYW1lcz86IHN0cmluZ1tdIHwgbnVsbCxcbiAgICBzdHlsZVNhbml0aXplcj86IFN0eWxlU2FuaXRpemVGbiB8IG51bGwpOiB2b2lkIHtcbiAgY29uc3QgdE5vZGUgPSBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKTtcbiAgaWYgKCF0Tm9kZS5zdHlsaW5nVGVtcGxhdGUpIHtcbiAgICB0Tm9kZS5zdHlsaW5nVGVtcGxhdGUgPSBjcmVhdGVFbXB0eVN0eWxpbmdDb250ZXh0KCk7XG4gIH1cblxuICBjb25zdCBkaXJlY3RpdmVTdHlsaW5nSW5kZXggPSBnZXRBY3RpdmVEaXJlY3RpdmVTdHlsaW5nSW5kZXgoKTtcblxuICAvLyBkZXNwaXRlIHRoZSBiaW5kaW5nIGJlaW5nIGFwcGxpZWQgaW4gYSBxdWV1ZSAoYmVsb3cpLCB0aGUgYWxsb2NhdGlvblxuICAvLyBvZiB0aGUgZGlyZWN0aXZlIGludG8gdGhlIGNvbnRleHQgaGFwcGVucyByaWdodCBhd2F5LiBUaGUgcmVhc29uIGZvclxuICAvLyB0aGlzIGlzIHRvIHJldGFpbiB0aGUgb3JkZXJpbmcgb2YgdGhlIGRpcmVjdGl2ZXMgKHdoaWNoIGlzIGltcG9ydGFudFxuICAvLyBmb3IgdGhlIHByaW9yaXRpemF0aW9uIG9mIGJpbmRpbmdzKS5cbiAgYWxsb2NhdGVPclVwZGF0ZURpcmVjdGl2ZUludG9Db250ZXh0KHROb2RlLnN0eWxpbmdUZW1wbGF0ZSwgZGlyZWN0aXZlU3R5bGluZ0luZGV4KTtcblxuICBjb25zdCBmbnMgPSB0Tm9kZS5vbkVsZW1lbnRDcmVhdGlvbkZucyA9IHROb2RlLm9uRWxlbWVudENyZWF0aW9uRm5zIHx8IFtdO1xuICBmbnMucHVzaCgoKSA9PiB7XG4gICAgaW5pdEVsZW1lbnRTdHlsaW5nKFxuICAgICAgICB0Tm9kZSwgY2xhc3NCaW5kaW5nTmFtZXMsIHN0eWxlQmluZGluZ05hbWVzLCBzdHlsZVNhbml0aXplciwgZGlyZWN0aXZlU3R5bGluZ0luZGV4KTtcbiAgICByZWdpc3Rlckhvc3REaXJlY3RpdmUodE5vZGUuc3R5bGluZ1RlbXBsYXRlICEsIGRpcmVjdGl2ZVN0eWxpbmdJbmRleCk7XG4gIH0pO1xufVxuXG5mdW5jdGlvbiBpbml0RWxlbWVudFN0eWxpbmcoXG4gICAgdE5vZGU6IFROb2RlLCBjbGFzc0JpbmRpbmdOYW1lczogc3RyaW5nW10gfCBudWxsIHwgdW5kZWZpbmVkLFxuICAgIHN0eWxlQmluZGluZ05hbWVzOiBzdHJpbmdbXSB8IG51bGwgfCB1bmRlZmluZWQsXG4gICAgc3R5bGVTYW5pdGl6ZXI6IFN0eWxlU2FuaXRpemVGbiB8IG51bGwgfCB1bmRlZmluZWQsIGRpcmVjdGl2ZVN0eWxpbmdJbmRleDogbnVtYmVyKTogdm9pZCB7XG4gIHVwZGF0ZUNvbnRleHRXaXRoQmluZGluZ3MoXG4gICAgICB0Tm9kZS5zdHlsaW5nVGVtcGxhdGUgISwgZGlyZWN0aXZlU3R5bGluZ0luZGV4LCBjbGFzc0JpbmRpbmdOYW1lcywgc3R5bGVCaW5kaW5nTmFtZXMsXG4gICAgICBzdHlsZVNhbml0aXplcik7XG59XG5cblxuLyoqXG4gKiBVcGRhdGUgYSBzdHlsZSBiaW5kaW5nIG9uIGFuIGVsZW1lbnQgd2l0aCB0aGUgcHJvdmlkZWQgdmFsdWUuXG4gKlxuICogSWYgdGhlIHN0eWxlIHZhbHVlIGlzIGZhbHN5IHRoZW4gaXQgd2lsbCBiZSByZW1vdmVkIGZyb20gdGhlIGVsZW1lbnRcbiAqIChvciBhc3NpZ25lZCBhIGRpZmZlcmVudCB2YWx1ZSBkZXBlbmRpbmcgaWYgdGhlcmUgYXJlIGFueSBzdHlsZXMgcGxhY2VkXG4gKiBvbiB0aGUgZWxlbWVudCB3aXRoIGBlbGVtZW50U3R5bGVNYXBgIG9yIGFueSBzdGF0aWMgc3R5bGVzIHRoYXQgYXJlXG4gKiBwcmVzZW50IGZyb20gd2hlbiB0aGUgZWxlbWVudCB3YXMgY3JlYXRlZCB3aXRoIGBlbGVtZW50U3R5bGluZ2ApLlxuICpcbiAqIE5vdGUgdGhhdCB0aGUgc3R5bGluZyBlbGVtZW50IGlzIHVwZGF0ZWQgYXMgcGFydCBvZiBgZWxlbWVudFN0eWxpbmdBcHBseWAuXG4gKlxuICogQHBhcmFtIGluZGV4IEluZGV4IG9mIHRoZSBlbGVtZW50J3Mgd2l0aCB3aGljaCBzdHlsaW5nIGlzIGFzc29jaWF0ZWQuXG4gKiBAcGFyYW0gc3R5bGVJbmRleCBJbmRleCBvZiBzdHlsZSB0byB1cGRhdGUuIFRoaXMgaW5kZXggdmFsdWUgcmVmZXJzIHRvIHRoZVxuICogICAgICAgIGluZGV4IG9mIHRoZSBzdHlsZSBpbiB0aGUgc3R5bGUgYmluZGluZ3MgYXJyYXkgdGhhdCB3YXMgcGFzc2VkIGludG9cbiAqICAgICAgICBgZWxlbWVudFN0eWxpbmdgLlxuICogQHBhcmFtIHZhbHVlIE5ldyB2YWx1ZSB0byB3cml0ZSAoZmFsc3kgdG8gcmVtb3ZlKS4gTm90ZSB0aGF0IGlmIGEgZGlyZWN0aXZlIGFsc29cbiAqICAgICAgICBhdHRlbXB0cyB0byB3cml0ZSB0byB0aGUgc2FtZSBiaW5kaW5nIHZhbHVlICh2aWEgYGVsZW1lbnRIb3N0U3R5bGVQcm9wYClcbiAqICAgICAgICB0aGVuIGl0IHdpbGwgb25seSBiZSBhYmxlIHRvIGRvIHNvIGlmIHRoZSBiaW5kaW5nIHZhbHVlIGFzc2lnbmVkIHZpYVxuICogICAgICAgIGBlbGVtZW50U3R5bGVQcm9wYCBpcyBmYWxzeSAob3IgZG9lc24ndCBleGlzdCBhdCBhbGwpLlxuICogQHBhcmFtIHN1ZmZpeCBPcHRpb25hbCBzdWZmaXguIFVzZWQgd2l0aCBzY2FsYXIgdmFsdWVzIHRvIGFkZCB1bml0IHN1Y2ggYXMgYHB4YC5cbiAqICAgICAgICBOb3RlIHRoYXQgd2hlbiBhIHN1ZmZpeCBpcyBwcm92aWRlZCB0aGVuIHRoZSB1bmRlcmx5aW5nIHNhbml0aXplciB3aWxsXG4gKiAgICAgICAgYmUgaWdub3JlZC5cbiAqIEBwYXJhbSBmb3JjZU92ZXJyaWRlIFdoZXRoZXIgb3Igbm90IHRvIHVwZGF0ZSB0aGUgc3R5bGluZyB2YWx1ZSBpbW1lZGlhdGVseVxuICogICAgICAgIChkZXNwaXRlIHRoZSBvdGhlciBiaW5kaW5ncyBwb3NzaWJseSBoYXZpbmcgcHJpb3JpdHkpXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVlbGVtZW50U3R5bGVQcm9wKFxuICAgIGluZGV4OiBudW1iZXIsIHN0eWxlSW5kZXg6IG51bWJlciwgdmFsdWU6IHN0cmluZyB8IG51bWJlciB8IFN0cmluZyB8IFBsYXllckZhY3RvcnkgfCBudWxsLFxuICAgIHN1ZmZpeD86IHN0cmluZyB8IG51bGwsIGZvcmNlT3ZlcnJpZGU/OiBib29sZWFuKTogdm9pZCB7XG4gIGNvbnN0IHZhbHVlVG9BZGQgPSByZXNvbHZlU3R5bGVQcm9wVmFsdWUodmFsdWUsIHN1ZmZpeCk7XG4gIGNvbnN0IHN0eWxpbmdDb250ZXh0ID0gZ2V0U3R5bGluZ0NvbnRleHQoaW5kZXgsIGdldExWaWV3KCkpO1xuICB1cGRhdGVFbGVtZW50U3R5bGVQcm9wKFxuICAgICAgc3R5bGluZ0NvbnRleHQsIHN0eWxlSW5kZXgsIHZhbHVlVG9BZGQsIERFRkFVTFRfVEVNUExBVEVfRElSRUNUSVZFX0lOREVYLCBmb3JjZU92ZXJyaWRlKTtcbn1cblxuLyoqXG4gKiBVcGRhdGUgYSBob3N0IHN0eWxlIGJpbmRpbmcgdmFsdWUgb24gdGhlIGhvc3QgZWxlbWVudCB3aXRoaW4gYSBjb21wb25lbnQvZGlyZWN0aXZlLlxuICpcbiAqIElmIHRoZSBzdHlsZSB2YWx1ZSBpcyBmYWxzeSB0aGVuIGl0IHdpbGwgYmUgcmVtb3ZlZCBmcm9tIHRoZSBob3N0IGVsZW1lbnRcbiAqIChvciBhc3NpZ25lZCBhIGRpZmZlcmVudCB2YWx1ZSBkZXBlbmRpbmcgaWYgdGhlcmUgYXJlIGFueSBzdHlsZXMgcGxhY2VkXG4gKiBvbiB0aGUgc2FtZSBlbGVtZW50IHdpdGggYGVsZW1lbnRIb3N0U3R5bGVNYXBgIG9yIGFueSBzdGF0aWMgc3R5bGVzIHRoYXRcbiAqIGFyZSBwcmVzZW50IGZyb20gd2hlbiB0aGUgZWxlbWVudCB3YXMgcGF0Y2hlZCB3aXRoIGBlbGVtZW50SG9zdFN0eWxpbmdgKS5cbiAqXG4gKiBOb3RlIHRoYXQgdGhlIHN0eWxpbmcgYXBwbGllZCB0byB0aGUgaG9zdCBlbGVtZW50IG9uY2VcbiAqIGBlbGVtZW50SG9zdFN0eWxpbmdBcHBseWAgaXMgY2FsbGVkLlxuICpcbiAqIEBwYXJhbSBzdHlsZUluZGV4IEluZGV4IG9mIHN0eWxlIHRvIHVwZGF0ZS4gVGhpcyBpbmRleCB2YWx1ZSByZWZlcnMgdG8gdGhlXG4gKiAgICAgICAgaW5kZXggb2YgdGhlIHN0eWxlIGluIHRoZSBzdHlsZSBiaW5kaW5ncyBhcnJheSB0aGF0IHdhcyBwYXNzZWQgaW50b1xuICogICAgICAgIGBlbGVtZW50SG9zdFN0eWxpbmdgLlxuICogQHBhcmFtIHZhbHVlIE5ldyB2YWx1ZSB0byB3cml0ZSAoZmFsc3kgdG8gcmVtb3ZlKS4gVGhlIHZhbHVlIG1heSBvciBtYXkgbm90XG4gKiAgICAgICAgYmUgYXBwbGllZCB0byB0aGUgZWxlbWVudCBkZXBlbmRpbmcgb24gdGhlIHRlbXBsYXRlL2NvbXBvbmVudC9kaXJlY3RpdmVcbiAqICAgICAgICBwcmlvcml0aXphdGlvbiAoc2VlIGBpbnRlcmZhY2VzL3N0eWxpbmcudHNgKVxuICogQHBhcmFtIHN1ZmZpeCBPcHRpb25hbCBzdWZmaXguIFVzZWQgd2l0aCBzY2FsYXIgdmFsdWVzIHRvIGFkZCB1bml0IHN1Y2ggYXMgYHB4YC5cbiAqICAgICAgICBOb3RlIHRoYXQgd2hlbiBhIHN1ZmZpeCBpcyBwcm92aWRlZCB0aGVuIHRoZSB1bmRlcmx5aW5nIHNhbml0aXplciB3aWxsXG4gKiAgICAgICAgYmUgaWdub3JlZC5cbiAqIEBwYXJhbSBmb3JjZU92ZXJyaWRlIFdoZXRoZXIgb3Igbm90IHRvIHVwZGF0ZSB0aGUgc3R5bGluZyB2YWx1ZSBpbW1lZGlhdGVseVxuICogICAgICAgIChkZXNwaXRlIHRoZSBvdGhlciBiaW5kaW5ncyBwb3NzaWJseSBoYXZpbmcgcHJpb3JpdHkpXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVlbGVtZW50SG9zdFN0eWxlUHJvcChcbiAgICBzdHlsZUluZGV4OiBudW1iZXIsIHZhbHVlOiBzdHJpbmcgfCBudW1iZXIgfCBTdHJpbmcgfCBQbGF5ZXJGYWN0b3J5IHwgbnVsbCxcbiAgICBzdWZmaXg/OiBzdHJpbmcgfCBudWxsLCBmb3JjZU92ZXJyaWRlPzogYm9vbGVhbik6IHZvaWQge1xuICBjb25zdCBkaXJlY3RpdmVTdHlsaW5nSW5kZXggPSBnZXRBY3RpdmVEaXJlY3RpdmVTdHlsaW5nSW5kZXgoKTtcbiAgY29uc3QgaG9zdEVsZW1lbnRJbmRleCA9IGdldFNlbGVjdGVkSW5kZXgoKTtcblxuICBjb25zdCBzdHlsaW5nQ29udGV4dCA9IGdldFN0eWxpbmdDb250ZXh0KGhvc3RFbGVtZW50SW5kZXgsIGdldExWaWV3KCkpO1xuICBjb25zdCB2YWx1ZVRvQWRkID0gcmVzb2x2ZVN0eWxlUHJvcFZhbHVlKHZhbHVlLCBzdWZmaXgpO1xuICBjb25zdCBhcmdzOiBQYXJhbXNPZjx0eXBlb2YgdXBkYXRlRWxlbWVudFN0eWxlUHJvcD4gPVxuICAgICAgW3N0eWxpbmdDb250ZXh0LCBzdHlsZUluZGV4LCB2YWx1ZVRvQWRkLCBkaXJlY3RpdmVTdHlsaW5nSW5kZXgsIGZvcmNlT3ZlcnJpZGVdO1xuICBlbnF1ZXVlSG9zdEluc3RydWN0aW9uKHN0eWxpbmdDb250ZXh0LCBkaXJlY3RpdmVTdHlsaW5nSW5kZXgsIHVwZGF0ZUVsZW1lbnRTdHlsZVByb3AsIGFyZ3MpO1xufVxuXG5mdW5jdGlvbiByZXNvbHZlU3R5bGVQcm9wVmFsdWUoXG4gICAgdmFsdWU6IHN0cmluZyB8IG51bWJlciB8IFN0cmluZyB8IFBsYXllckZhY3RvcnkgfCBudWxsLCBzdWZmaXg6IHN0cmluZyB8IG51bGwgfCB1bmRlZmluZWQpIHtcbiAgbGV0IHZhbHVlVG9BZGQ6IHN0cmluZ3xudWxsID0gbnVsbDtcbiAgaWYgKHZhbHVlICE9PSBudWxsKSB7XG4gICAgaWYgKHN1ZmZpeCkge1xuICAgICAgLy8gd2hlbiBhIHN1ZmZpeCBpcyBhcHBsaWVkIHRoZW4gaXQgd2lsbCBieXBhc3NcbiAgICAgIC8vIHNhbml0aXphdGlvbiBlbnRpcmVseSAoYi9jIGEgbmV3IHN0cmluZyBpcyBjcmVhdGVkKVxuICAgICAgdmFsdWVUb0FkZCA9IHJlbmRlclN0cmluZ2lmeSh2YWx1ZSkgKyBzdWZmaXg7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIHNhbml0aXphdGlvbiBoYXBwZW5zIGJ5IGRlYWxpbmcgd2l0aCBhIFN0cmluZyB2YWx1ZVxuICAgICAgLy8gdGhpcyBtZWFucyB0aGF0IHRoZSBzdHJpbmcgdmFsdWUgd2lsbCBiZSBwYXNzZWQgdGhyb3VnaFxuICAgICAgLy8gaW50byB0aGUgc3R5bGUgcmVuZGVyaW5nIGxhdGVyICh3aGljaCBpcyB3aGVyZSB0aGUgdmFsdWVcbiAgICAgIC8vIHdpbGwgYmUgc2FuaXRpemVkIGJlZm9yZSBpdCBpcyBhcHBsaWVkKVxuICAgICAgdmFsdWVUb0FkZCA9IHZhbHVlIGFzIGFueSBhcyBzdHJpbmc7XG4gICAgfVxuICB9XG4gIHJldHVybiB2YWx1ZVRvQWRkO1xufVxuXG5cbi8qKlxuICogVXBkYXRlIGEgY2xhc3MgYmluZGluZyBvbiBhbiBlbGVtZW50IHdpdGggdGhlIHByb3ZpZGVkIHZhbHVlLlxuICpcbiAqIFRoaXMgaW5zdHJ1Y3Rpb24gaXMgbWVhbnQgdG8gaGFuZGxlIHRoZSBgW2NsYXNzLmZvb109XCJleHBcImAgY2FzZSBhbmQsXG4gKiB0aGVyZWZvcmUsIHRoZSBjbGFzcyBiaW5kaW5nIGl0c2VsZiBtdXN0IGFscmVhZHkgYmUgYWxsb2NhdGVkIHVzaW5nXG4gKiBgZWxlbWVudFN0eWxpbmdgIHdpdGhpbiB0aGUgY3JlYXRpb24gYmxvY2suXG4gKlxuICogQHBhcmFtIGluZGV4IEluZGV4IG9mIHRoZSBlbGVtZW50J3Mgd2l0aCB3aGljaCBzdHlsaW5nIGlzIGFzc29jaWF0ZWQuXG4gKiBAcGFyYW0gY2xhc3NJbmRleCBJbmRleCBvZiBjbGFzcyB0byB0b2dnbGUuIFRoaXMgaW5kZXggdmFsdWUgcmVmZXJzIHRvIHRoZVxuICogICAgICAgIGluZGV4IG9mIHRoZSBjbGFzcyBpbiB0aGUgY2xhc3MgYmluZGluZ3MgYXJyYXkgdGhhdCB3YXMgcGFzc2VkIGludG9cbiAqICAgICAgICBgZWxlbWVudFN0eWxpbmdgICh3aGljaCBpcyBtZWFudCB0byBiZSBjYWxsZWQgYmVmb3JlIHRoaXNcbiAqICAgICAgICBmdW5jdGlvbiBpcykuXG4gKiBAcGFyYW0gdmFsdWUgQSB0cnVlL2ZhbHNlIHZhbHVlIHdoaWNoIHdpbGwgdHVybiB0aGUgY2xhc3Mgb24gb3Igb2ZmLlxuICogQHBhcmFtIGZvcmNlT3ZlcnJpZGUgV2hldGhlciBvciBub3QgdGhpcyB2YWx1ZSB3aWxsIGJlIGFwcGxpZWQgcmVnYXJkbGVzc1xuICogICAgICAgIG9mIHdoZXJlIGl0IGlzIGJlaW5nIHNldCB3aXRoaW4gdGhlIHN0eWxpbmcgcHJpb3JpdHkgc3RydWN0dXJlLlxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1ZWxlbWVudENsYXNzUHJvcChcbiAgICBpbmRleDogbnVtYmVyLCBjbGFzc0luZGV4OiBudW1iZXIsIHZhbHVlOiBib29sZWFuIHwgUGxheWVyRmFjdG9yeSxcbiAgICBmb3JjZU92ZXJyaWRlPzogYm9vbGVhbik6IHZvaWQge1xuICBjb25zdCBpbnB1dCA9ICh2YWx1ZSBpbnN0YW5jZW9mIEJvdW5kUGxheWVyRmFjdG9yeSkgP1xuICAgICAgKHZhbHVlIGFzIEJvdW5kUGxheWVyRmFjdG9yeTxib29sZWFufG51bGw+KSA6XG4gICAgICBib29sZWFuT3JOdWxsKHZhbHVlKTtcbiAgY29uc3Qgc3R5bGluZ0NvbnRleHQgPSBnZXRTdHlsaW5nQ29udGV4dChpbmRleCwgZ2V0TFZpZXcoKSk7XG4gIHVwZGF0ZUVsZW1lbnRDbGFzc1Byb3AoXG4gICAgICBzdHlsaW5nQ29udGV4dCwgY2xhc3NJbmRleCwgaW5wdXQsIERFRkFVTFRfVEVNUExBVEVfRElSRUNUSVZFX0lOREVYLCBmb3JjZU92ZXJyaWRlKTtcbn1cblxuXG4vKipcbiAqIFVwZGF0ZSBhIGNsYXNzIGhvc3QgYmluZGluZyBmb3IgYSBkaXJlY3RpdmUncy9jb21wb25lbnQncyBob3N0IGVsZW1lbnQgd2l0aGluXG4gKiB0aGUgaG9zdCBiaW5kaW5ncyBmdW5jdGlvbi5cbiAqXG4gKiBUaGlzIGluc3RydWN0aW9uIGlzIG1lYW50IHRvIGhhbmRsZSB0aGUgYEBIb3N0QmluZGluZygnY2xhc3MuZm9vJylgIGNhc2UgYW5kLFxuICogdGhlcmVmb3JlLCB0aGUgY2xhc3MgYmluZGluZyBpdHNlbGYgbXVzdCBhbHJlYWR5IGJlIGFsbG9jYXRlZCB1c2luZ1xuICogYGVsZW1lbnRIb3N0U3R5bGluZ2Agd2l0aGluIHRoZSBjcmVhdGlvbiBibG9jay5cbiAqXG4gKiBAcGFyYW0gY2xhc3NJbmRleCBJbmRleCBvZiBjbGFzcyB0byB0b2dnbGUuIFRoaXMgaW5kZXggdmFsdWUgcmVmZXJzIHRvIHRoZVxuICogICAgICAgIGluZGV4IG9mIHRoZSBjbGFzcyBpbiB0aGUgY2xhc3MgYmluZGluZ3MgYXJyYXkgdGhhdCB3YXMgcGFzc2VkIGludG9cbiAqICAgICAgICBgZWxlbWVudEhvc3RTdGx5aW5nYCAod2hpY2ggaXMgbWVhbnQgdG8gYmUgY2FsbGVkIGJlZm9yZSB0aGlzXG4gKiAgICAgICAgZnVuY3Rpb24gaXMpLlxuICogQHBhcmFtIHZhbHVlIEEgdHJ1ZS9mYWxzZSB2YWx1ZSB3aGljaCB3aWxsIHR1cm4gdGhlIGNsYXNzIG9uIG9yIG9mZi5cbiAqIEBwYXJhbSBmb3JjZU92ZXJyaWRlIFdoZXRoZXIgb3Igbm90IHRoaXMgdmFsdWUgd2lsbCBiZSBhcHBsaWVkIHJlZ2FyZGxlc3NcbiAqICAgICAgICBvZiB3aGVyZSBpdCBpcyBiZWluZyBzZXQgd2l0aGluIHRoZSBzdHlsaW5ncyBwcmlvcml0eSBzdHJ1Y3R1cmUuXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVlbGVtZW50SG9zdENsYXNzUHJvcChcbiAgICBjbGFzc0luZGV4OiBudW1iZXIsIHZhbHVlOiBib29sZWFuIHwgUGxheWVyRmFjdG9yeSwgZm9yY2VPdmVycmlkZT86IGJvb2xlYW4pOiB2b2lkIHtcbiAgY29uc3QgZGlyZWN0aXZlU3R5bGluZ0luZGV4ID0gZ2V0QWN0aXZlRGlyZWN0aXZlU3R5bGluZ0luZGV4KCk7XG4gIGNvbnN0IGhvc3RFbGVtZW50SW5kZXggPSBnZXRTZWxlY3RlZEluZGV4KCk7XG4gIGNvbnN0IHN0eWxpbmdDb250ZXh0ID0gZ2V0U3R5bGluZ0NvbnRleHQoaG9zdEVsZW1lbnRJbmRleCwgZ2V0TFZpZXcoKSk7XG5cbiAgY29uc3QgaW5wdXQgPSAodmFsdWUgaW5zdGFuY2VvZiBCb3VuZFBsYXllckZhY3RvcnkpID9cbiAgICAgICh2YWx1ZSBhcyBCb3VuZFBsYXllckZhY3Rvcnk8Ym9vbGVhbnxudWxsPikgOlxuICAgICAgYm9vbGVhbk9yTnVsbCh2YWx1ZSk7XG5cbiAgY29uc3QgYXJnczogUGFyYW1zT2Y8dHlwZW9mIHVwZGF0ZUVsZW1lbnRDbGFzc1Byb3A+ID1cbiAgICAgIFtzdHlsaW5nQ29udGV4dCwgY2xhc3NJbmRleCwgaW5wdXQsIGRpcmVjdGl2ZVN0eWxpbmdJbmRleCwgZm9yY2VPdmVycmlkZV07XG4gIGVucXVldWVIb3N0SW5zdHJ1Y3Rpb24oc3R5bGluZ0NvbnRleHQsIGRpcmVjdGl2ZVN0eWxpbmdJbmRleCwgdXBkYXRlRWxlbWVudENsYXNzUHJvcCwgYXJncyk7XG59XG5cbmZ1bmN0aW9uIGJvb2xlYW5Pck51bGwodmFsdWU6IGFueSk6IGJvb2xlYW58bnVsbCB7XG4gIGlmICh0eXBlb2YgdmFsdWUgPT09ICdib29sZWFuJykgcmV0dXJuIHZhbHVlO1xuICByZXR1cm4gdmFsdWUgPyB0cnVlIDogbnVsbDtcbn1cblxuXG4vKipcbiAqIFVwZGF0ZSBzdHlsZSBiaW5kaW5ncyB1c2luZyBhbiBvYmplY3QgbGl0ZXJhbCBvbiBhbiBlbGVtZW50LlxuICpcbiAqIFRoaXMgaW5zdHJ1Y3Rpb24gaXMgbWVhbnQgdG8gYXBwbHkgc3R5bGluZyB2aWEgdGhlIGBbc3R5bGVdPVwiZXhwXCJgIHRlbXBsYXRlIGJpbmRpbmdzLlxuICogV2hlbiBzdHlsZXMgYXJlIGFwcGxpZWQgdG8gdGhlIGVsZW1lbnQgdGhleSB3aWxsIHRoZW4gYmUgdXBkYXRlZCB3aXRoIHJlc3BlY3QgdG9cbiAqIGFueSBzdHlsZXMvY2xhc3NlcyBzZXQgdmlhIGBlbGVtZW50U3R5bGVQcm9wYC4gSWYgYW55IHN0eWxlcyBhcmUgc2V0IHRvIGZhbHN5XG4gKiB0aGVuIHRoZXkgd2lsbCBiZSByZW1vdmVkIGZyb20gdGhlIGVsZW1lbnQuXG4gKlxuICogTm90ZSB0aGF0IHRoZSBzdHlsaW5nIGluc3RydWN0aW9uIHdpbGwgbm90IGJlIGFwcGxpZWQgdW50aWwgYGVsZW1lbnRTdHlsaW5nQXBwbHlgIGlzIGNhbGxlZC5cbiAqXG4gKiBAcGFyYW0gaW5kZXggSW5kZXggb2YgdGhlIGVsZW1lbnQncyB3aXRoIHdoaWNoIHN0eWxpbmcgaXMgYXNzb2NpYXRlZC5cbiAqIEBwYXJhbSBzdHlsZXMgQSBrZXkvdmFsdWUgc3R5bGUgbWFwIG9mIHRoZSBzdHlsZXMgdGhhdCB3aWxsIGJlIGFwcGxpZWQgdG8gdGhlIGdpdmVuIGVsZW1lbnQuXG4gKiAgICAgICAgQW55IG1pc3Npbmcgc3R5bGVzICh0aGF0IGhhdmUgYWxyZWFkeSBiZWVuIGFwcGxpZWQgdG8gdGhlIGVsZW1lbnQgYmVmb3JlaGFuZCkgd2lsbCBiZVxuICogICAgICAgIHJlbW92ZWQgKHVuc2V0KSBmcm9tIHRoZSBlbGVtZW50J3Mgc3R5bGluZy5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWVsZW1lbnRTdHlsZU1hcChcbiAgICBpbmRleDogbnVtYmVyLCBzdHlsZXM6IHtbc3R5bGVOYW1lOiBzdHJpbmddOiBhbnl9IHwgTk9fQ0hBTkdFIHwgbnVsbCk6IHZvaWQge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IHN0eWxpbmdDb250ZXh0ID0gZ2V0U3R5bGluZ0NvbnRleHQoaW5kZXgsIGxWaWV3KTtcbiAgY29uc3QgdE5vZGUgPSBnZXRUTm9kZShpbmRleCwgbFZpZXcpO1xuXG4gIC8vIGlucHV0cyBhcmUgb25seSBldmFsdWF0ZWQgZnJvbSBhIHRlbXBsYXRlIGJpbmRpbmcgaW50byBhIGRpcmVjdGl2ZSwgdGhlcmVmb3JlLFxuICAvLyB0aGVyZSBzaG91bGQgbm90IGJlIGEgc2l0dWF0aW9uIHdoZXJlIGEgZGlyZWN0aXZlIGhvc3QgYmluZGluZ3MgZnVuY3Rpb25cbiAgLy8gZXZhbHVhdGVzIHRoZSBpbnB1dHMgKHRoaXMgc2hvdWxkIG9ubHkgaGFwcGVuIGluIHRoZSB0ZW1wbGF0ZSBmdW5jdGlvbilcbiAgaWYgKGhhc1N0eWxlSW5wdXQodE5vZGUpICYmIHN0eWxlcyAhPT0gTk9fQ0hBTkdFKSB7XG4gICAgY29uc3QgaW5pdGlhbFN0eWxlcyA9IGdldEluaXRpYWxDbGFzc05hbWVWYWx1ZShzdHlsaW5nQ29udGV4dCk7XG4gICAgY29uc3Qgc3R5bGVJbnB1dFZhbCA9XG4gICAgICAgIChpbml0aWFsU3R5bGVzLmxlbmd0aCA/IChpbml0aWFsU3R5bGVzICsgJyAnKSA6ICcnKSArIGZvcmNlU3R5bGVzQXNTdHJpbmcoc3R5bGVzKTtcbiAgICBzZXRJbnB1dHNGb3JQcm9wZXJ0eShsVmlldywgdE5vZGUuaW5wdXRzICFbJ3N0eWxlJ10gISwgc3R5bGVJbnB1dFZhbCk7XG4gICAgc3R5bGVzID0gTk9fQ0hBTkdFO1xuICB9XG5cbiAgdXBkYXRlU3R5bGVNYXAoc3R5bGluZ0NvbnRleHQsIHN0eWxlcyk7XG59XG5cblxuLyoqXG4gKiBVcGRhdGUgY2xhc3MgYmluZGluZ3MgdXNpbmcgYW4gb2JqZWN0IGxpdGVyYWwgb3IgY2xhc3Mtc3RyaW5nIG9uIGFuIGVsZW1lbnQuXG4gKlxuICogVGhpcyBpbnN0cnVjdGlvbiBpcyBtZWFudCB0byBhcHBseSBzdHlsaW5nIHZpYSB0aGUgYFtjbGFzc109XCJleHBcImAgdGVtcGxhdGUgYmluZGluZ3MuXG4gKiBXaGVuIGNsYXNzZXMgYXJlIGFwcGxpZWQgdG8gdGhlIGVsZW1lbnQgdGhleSB3aWxsIHRoZW4gYmUgdXBkYXRlZCB3aXRoXG4gKiByZXNwZWN0IHRvIGFueSBzdHlsZXMvY2xhc3NlcyBzZXQgdmlhIGBlbGVtZW50Q2xhc3NQcm9wYC4gSWYgYW55XG4gKiBjbGFzc2VzIGFyZSBzZXQgdG8gZmFsc3kgdGhlbiB0aGV5IHdpbGwgYmUgcmVtb3ZlZCBmcm9tIHRoZSBlbGVtZW50LlxuICpcbiAqIE5vdGUgdGhhdCB0aGUgc3R5bGluZyBpbnN0cnVjdGlvbiB3aWxsIG5vdCBiZSBhcHBsaWVkIHVudGlsIGBlbGVtZW50U3R5bGluZ0FwcGx5YCBpcyBjYWxsZWQuXG4gKlxuICogQHBhcmFtIGluZGV4IEluZGV4IG9mIHRoZSBlbGVtZW50J3Mgd2l0aCB3aGljaCBzdHlsaW5nIGlzIGFzc29jaWF0ZWQuXG4gKiBAcGFyYW0gY2xhc3NlcyBBIGtleS92YWx1ZSBtYXAgb3Igc3RyaW5nIG9mIENTUyBjbGFzc2VzIHRoYXQgd2lsbCBiZSBhZGRlZCB0byB0aGVcbiAqICAgICAgICBnaXZlbiBlbGVtZW50LiBBbnkgbWlzc2luZyBjbGFzc2VzICh0aGF0IGhhdmUgYWxyZWFkeSBiZWVuIGFwcGxpZWQgdG8gdGhlIGVsZW1lbnRcbiAqICAgICAgICBiZWZvcmVoYW5kKSB3aWxsIGJlIHJlbW92ZWQgKHVuc2V0KSBmcm9tIHRoZSBlbGVtZW50J3MgbGlzdCBvZiBDU1MgY2xhc3Nlcy5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWVsZW1lbnRDbGFzc01hcChcbiAgICBpbmRleDogbnVtYmVyLCBjbGFzc2VzOiB7W3N0eWxlTmFtZTogc3RyaW5nXTogYW55fSB8IE5PX0NIQU5HRSB8IHN0cmluZyB8IG51bGwpOiB2b2lkIHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCBzdHlsaW5nQ29udGV4dCA9IGdldFN0eWxpbmdDb250ZXh0KGluZGV4LCBsVmlldyk7XG4gIGNvbnN0IHROb2RlID0gZ2V0VE5vZGUoaW5kZXgsIGxWaWV3KTtcbiAgLy8gaW5wdXRzIGFyZSBvbmx5IGV2YWx1YXRlZCBmcm9tIGEgdGVtcGxhdGUgYmluZGluZyBpbnRvIGEgZGlyZWN0aXZlLCB0aGVyZWZvcmUsXG4gIC8vIHRoZXJlIHNob3VsZCBub3QgYmUgYSBzaXR1YXRpb24gd2hlcmUgYSBkaXJlY3RpdmUgaG9zdCBiaW5kaW5ncyBmdW5jdGlvblxuICAvLyBldmFsdWF0ZXMgdGhlIGlucHV0cyAodGhpcyBzaG91bGQgb25seSBoYXBwZW4gaW4gdGhlIHRlbXBsYXRlIGZ1bmN0aW9uKVxuICBpZiAoaGFzQ2xhc3NJbnB1dCh0Tm9kZSkgJiYgY2xhc3NlcyAhPT0gTk9fQ0hBTkdFKSB7XG4gICAgY29uc3QgaW5pdGlhbENsYXNzZXMgPSBnZXRJbml0aWFsQ2xhc3NOYW1lVmFsdWUoc3R5bGluZ0NvbnRleHQpO1xuICAgIGNvbnN0IGNsYXNzSW5wdXRWYWwgPVxuICAgICAgICAoaW5pdGlhbENsYXNzZXMubGVuZ3RoID8gKGluaXRpYWxDbGFzc2VzICsgJyAnKSA6ICcnKSArIGZvcmNlQ2xhc3Nlc0FzU3RyaW5nKGNsYXNzZXMpO1xuICAgIHNldElucHV0c0ZvclByb3BlcnR5KGxWaWV3LCB0Tm9kZS5pbnB1dHMgIVsnY2xhc3MnXSAhLCBjbGFzc0lucHV0VmFsKTtcbiAgICBjbGFzc2VzID0gTk9fQ0hBTkdFO1xuICB9XG4gIHVwZGF0ZUNsYXNzTWFwKHN0eWxpbmdDb250ZXh0LCBjbGFzc2VzKTtcbn1cblxuXG4vKipcbiAqIFVwZGF0ZSBzdHlsZSBob3N0IGJpbmRpbmdzIHVzaW5nIG9iamVjdCBsaXRlcmFscyBvbiBhbiBlbGVtZW50IHdpdGhpbiB0aGUgaG9zdFxuICogYmluZGluZ3MgZnVuY3Rpb24gZm9yIGEgZGlyZWN0aXZlL2NvbXBvbmVudC5cbiAqXG4gKiBUaGlzIGluc3RydWN0aW9uIGlzIG1lYW50IHRvIGFwcGx5IHN0eWxpbmcgdmlhIHRoZSBgQEhvc3RCaW5kaW5nKCdzdHlsZScpYFxuICogaG9zdCBiaW5kaW5ncyBmb3IgYSBjb21wb25lbnQncyBvciBkaXJlY3RpdmUncyBob3N0IGVsZW1lbnQuXG4gKiBXaGVuIHN0eWxlcyBhcmUgYXBwbGllZCB0byB0aGUgaG9zdCBlbGVtZW50IHRoZXkgd2lsbCB0aGVuIGJlIHVwZGF0ZWRcbiAqIHdpdGggcmVzcGVjdCB0byBhbnkgb3RoZXIgc3R5bGVzIHNldCB3aXRoIGBlbGVtZW50SG9zdFN0eWxlUHJvcGAuIElmXG4gKiBJZiBhbnkgc3R5bGVzIGFyZSBzZXQgdG8gZmFsc3kgdGhlbiB0aGV5IHdpbGwgYmUgcmVtb3ZlZCBmcm9tIHRoZSBlbGVtZW50LlxuICpcbiAqIE5vdGUgdGhhdCB0aGUgc3R5bGluZyBpbnN0cnVjdGlvbiB3aWxsIG5vdCBiZSBhcHBsaWVkIHVudGlsXG4gKiBgZWxlbWVudEhvc3RTdHlsaW5nQXBwbHlgIGlzIGNhbGxlZC5cbiAqXG4gKiBAcGFyYW0gc3R5bGVzIEEga2V5L3ZhbHVlIHN0eWxlIG1hcCBvZiB0aGUgc3R5bGVzIHRoYXQgd2lsbCBiZSBhcHBsaWVkIHRvIHRoZSBnaXZlbiBlbGVtZW50LlxuICogICAgICAgIEFueSBtaXNzaW5nIHN0eWxlcyAodGhhdCBoYXZlIGFscmVhZHkgYmVlbiBhcHBsaWVkIHRvIHRoZSBlbGVtZW50IGJlZm9yZWhhbmQpIHdpbGwgYmVcbiAqICAgICAgICByZW1vdmVkICh1bnNldCkgZnJvbSB0aGUgZWxlbWVudCdzIHN0eWxpbmcuXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVlbGVtZW50SG9zdFN0eWxlTWFwKHN0eWxlczoge1tzdHlsZU5hbWU6IHN0cmluZ106IGFueX0gfCBOT19DSEFOR0UgfCBudWxsKTogdm9pZCB7XG4gIGNvbnN0IGRpcmVjdGl2ZVN0eWxpbmdJbmRleCA9IGdldEFjdGl2ZURpcmVjdGl2ZVN0eWxpbmdJbmRleCgpO1xuICBjb25zdCBob3N0RWxlbWVudEluZGV4ID0gZ2V0U2VsZWN0ZWRJbmRleCgpO1xuICBjb25zdCBzdHlsaW5nQ29udGV4dCA9IGdldFN0eWxpbmdDb250ZXh0KGhvc3RFbGVtZW50SW5kZXgsIGdldExWaWV3KCkpO1xuICBjb25zdCBhcmdzOiBQYXJhbXNPZjx0eXBlb2YgdXBkYXRlU3R5bGVNYXA+ID0gW3N0eWxpbmdDb250ZXh0LCBzdHlsZXMsIGRpcmVjdGl2ZVN0eWxpbmdJbmRleF07XG4gIGVucXVldWVIb3N0SW5zdHJ1Y3Rpb24oc3R5bGluZ0NvbnRleHQsIGRpcmVjdGl2ZVN0eWxpbmdJbmRleCwgdXBkYXRlU3R5bGVNYXAsIGFyZ3MpO1xufVxuXG4vKipcbiAqIFVwZGF0ZSBjbGFzcyBob3N0IGJpbmRpbmdzIHVzaW5nIG9iamVjdCBsaXRlcmFscyBvbiBhbiBlbGVtZW50IHdpdGhpbiB0aGUgaG9zdFxuICogYmluZGluZ3MgZnVuY3Rpb24gZm9yIGEgZGlyZWN0aXZlL2NvbXBvbmVudC5cbiAqXG4gKiBUaGlzIGluc3RydWN0aW9uIGlzIG1lYW50IHRvIGFwcGx5IHN0eWxpbmcgdmlhIHRoZSBgQEhvc3RCaW5kaW5nKCdjbGFzcycpYFxuICogaG9zdCBiaW5kaW5ncyBmb3IgYSBjb21wb25lbnQncyBvciBkaXJlY3RpdmUncyBob3N0IGVsZW1lbnQuXG4gKiBXaGVuIGNsYXNzZXMgYXJlIGFwcGxpZWQgdG8gdGhlIGhvc3QgZWxlbWVudCB0aGV5IHdpbGwgdGhlbiBiZSB1cGRhdGVkXG4gKiB3aXRoIHJlc3BlY3QgdG8gYW55IG90aGVyIGNsYXNzZXMgc2V0IHdpdGggYGVsZW1lbnRIb3N0Q2xhc3NQcm9wYC4gSWZcbiAqIGFueSBjbGFzc2VzIGFyZSBzZXQgdG8gZmFsc3kgdGhlbiB0aGV5IHdpbGwgYmUgcmVtb3ZlZCBmcm9tIHRoZSBlbGVtZW50LlxuICpcbiAqIE5vdGUgdGhhdCB0aGUgc3R5bGluZyBpbnN0cnVjdGlvbiB3aWxsIG5vdCBiZSBhcHBsaWVkIHVudGlsXG4gKiBgZWxlbWVudEhvc3RTdHlsaW5nQXBwbHlgIGlzIGNhbGxlZC5cbiAqXG4gKiBAcGFyYW0gY2xhc3NlcyBBIGtleS92YWx1ZSBtYXAgb3Igc3RyaW5nIG9mIENTUyBjbGFzc2VzIHRoYXQgd2lsbCBiZSBhZGRlZCB0byB0aGVcbiAqICAgICAgICBnaXZlbiBlbGVtZW50LiBBbnkgbWlzc2luZyBjbGFzc2VzICh0aGF0IGhhdmUgYWxyZWFkeSBiZWVuIGFwcGxpZWQgdG8gdGhlIGVsZW1lbnRcbiAqICAgICAgICBiZWZvcmVoYW5kKSB3aWxsIGJlIHJlbW92ZWQgKHVuc2V0KSBmcm9tIHRoZSBlbGVtZW50J3MgbGlzdCBvZiBDU1MgY2xhc3Nlcy5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWVsZW1lbnRIb3N0Q2xhc3NNYXAoY2xhc3Nlczoge1trZXk6IHN0cmluZ106IGFueX0gfCBzdHJpbmcgfCBOT19DSEFOR0UgfCBudWxsKTpcbiAgICB2b2lkIHtcbiAgY29uc3QgZGlyZWN0aXZlU3R5bGluZ0luZGV4ID0gZ2V0QWN0aXZlRGlyZWN0aXZlU3R5bGluZ0luZGV4KCk7XG4gIGNvbnN0IGhvc3RFbGVtZW50SW5kZXggPSBnZXRTZWxlY3RlZEluZGV4KCk7XG4gIGNvbnN0IHN0eWxpbmdDb250ZXh0ID0gZ2V0U3R5bGluZ0NvbnRleHQoaG9zdEVsZW1lbnRJbmRleCwgZ2V0TFZpZXcoKSk7XG4gIGNvbnN0IGFyZ3M6IFBhcmFtc09mPHR5cGVvZiB1cGRhdGVDbGFzc01hcD4gPSBbc3R5bGluZ0NvbnRleHQsIGNsYXNzZXMsIGRpcmVjdGl2ZVN0eWxpbmdJbmRleF07XG4gIGVucXVldWVIb3N0SW5zdHJ1Y3Rpb24oc3R5bGluZ0NvbnRleHQsIGRpcmVjdGl2ZVN0eWxpbmdJbmRleCwgdXBkYXRlQ2xhc3NNYXAsIGFyZ3MpO1xufVxuXG4vKipcbiAqIEFwcGx5IGFsbCBzdHlsZSBhbmQgY2xhc3MgYmluZGluZyB2YWx1ZXMgdG8gdGhlIGVsZW1lbnQuXG4gKlxuICogVGhpcyBpbnN0cnVjdGlvbiBpcyBtZWFudCB0byBiZSBydW4gYWZ0ZXIgYGVsZW1lbnRTdHlsZU1hcGAsIGBlbGVtZW50Q2xhc3NNYXBgLFxuICogYGVsZW1lbnRTdHlsZVByb3BgIG9yIGBlbGVtZW50Q2xhc3NQcm9wYCBpbnN0cnVjdGlvbnMgaGF2ZSBiZWVuIHJ1biBhbmQgd2lsbFxuICogb25seSBhcHBseSBzdHlsaW5nIHRvIHRoZSBlbGVtZW50IGlmIGFueSBzdHlsaW5nIGJpbmRpbmdzIGhhdmUgYmVlbiB1cGRhdGVkLlxuICpcbiAqIEBwYXJhbSBpbmRleCBJbmRleCBvZiB0aGUgZWxlbWVudCdzIHdpdGggd2hpY2ggc3R5bGluZyBpcyBhc3NvY2lhdGVkLlxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1ZWxlbWVudFN0eWxpbmdBcHBseShpbmRleDogbnVtYmVyKTogdm9pZCB7XG4gIGVsZW1lbnRTdHlsaW5nQXBwbHlJbnRlcm5hbChERUZBVUxUX1RFTVBMQVRFX0RJUkVDVElWRV9JTkRFWCwgaW5kZXgpO1xufVxuXG4vKipcbiAqIEFwcGx5IGFsbCBzdHlsZSBhbmQgY2xhc3MgaG9zdCBiaW5kaW5nIHZhbHVlcyB0byB0aGUgZWxlbWVudC5cbiAqXG4gKiBUaGlzIGluc3RydWN0aW9uIGlzIG1lYW50IHRvIGJlIHJ1biBhZnRlciBib3RoIGBlbGVtZW50SG9zdFN0eWxlTWFwYFxuICogYGVsZW1lbnRIb3N0Q2xhc3NNYXBgLCBgZWxlbWVudEhvc3RTdHlsZVByb3BgIG9yIGBlbGVtZW50SG9zdENsYXNzUHJvcGBcbiAqIGluc3RydWN0aW9ucyBoYXZlIGJlZW4gcnVuIGFuZCB3aWxsIG9ubHkgYXBwbHkgc3R5bGluZyB0byB0aGUgaG9zdFxuICogZWxlbWVudCBpZiBhbnkgc3R5bGluZyBiaW5kaW5ncyBoYXZlIGJlZW4gdXBkYXRlZC5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWVsZW1lbnRIb3N0U3R5bGluZ0FwcGx5KCk6IHZvaWQge1xuICBlbGVtZW50U3R5bGluZ0FwcGx5SW50ZXJuYWwoZ2V0QWN0aXZlRGlyZWN0aXZlU3R5bGluZ0luZGV4KCksIGdldFNlbGVjdGVkSW5kZXgoKSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBlbGVtZW50U3R5bGluZ0FwcGx5SW50ZXJuYWwoZGlyZWN0aXZlU3R5bGluZ0luZGV4OiBudW1iZXIsIGluZGV4OiBudW1iZXIpOiB2b2lkIHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCB0Tm9kZSA9IGdldFROb2RlKGluZGV4LCBsVmlldyk7XG5cbiAgLy8gaWYgYSBub24tZWxlbWVudCB2YWx1ZSBpcyBiZWluZyBwcm9jZXNzZWQgdGhlbiB3ZSBjYW4ndCByZW5kZXIgdmFsdWVzXG4gIC8vIG9uIHRoZSBlbGVtZW50IGF0IGFsbCB0aGVyZWZvcmUgYnkgc2V0dGluZyB0aGUgcmVuZGVyZXIgdG8gbnVsbCB0aGVuXG4gIC8vIHRoZSBzdHlsaW5nIGFwcGx5IGNvZGUga25vd3Mgbm90IHRvIGFjdHVhbGx5IGFwcGx5IHRoZSB2YWx1ZXMuLi5cbiAgY29uc3QgcmVuZGVyZXIgPSB0Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuRWxlbWVudCA/IGxWaWV3W1JFTkRFUkVSXSA6IG51bGw7XG4gIGNvbnN0IGlzRmlyc3RSZW5kZXIgPSAobFZpZXdbRkxBR1NdICYgTFZpZXdGbGFncy5GaXJzdExWaWV3UGFzcykgIT09IDA7XG4gIGNvbnN0IHN0eWxpbmdDb250ZXh0ID0gZ2V0U3R5bGluZ0NvbnRleHQoaW5kZXgsIGxWaWV3KTtcbiAgY29uc3QgdG90YWxQbGF5ZXJzUXVldWVkID0gcmVuZGVyU3R5bGluZyhcbiAgICAgIHN0eWxpbmdDb250ZXh0LCByZW5kZXJlciwgbFZpZXcsIGlzRmlyc3RSZW5kZXIsIG51bGwsIG51bGwsIGRpcmVjdGl2ZVN0eWxpbmdJbmRleCk7XG4gIGlmICh0b3RhbFBsYXllcnNRdWV1ZWQgPiAwKSB7XG4gICAgY29uc3Qgcm9vdENvbnRleHQgPSBnZXRSb290Q29udGV4dChsVmlldyk7XG4gICAgc2NoZWR1bGVUaWNrKHJvb3RDb250ZXh0LCBSb290Q29udGV4dEZsYWdzLkZsdXNoUGxheWVycyk7XG4gIH1cblxuICAvLyBiZWNhdXNlIHNlbGVjdChuKSBtYXkgbm90IHJ1biBiZXR3ZWVuIGV2ZXJ5IGluc3RydWN0aW9uLCB0aGUgY2FjaGVkIHN0eWxpbmdcbiAgLy8gY29udGV4dCBtYXkgbm90IGdldCBjbGVhcmVkIGJldHdlZW4gZWxlbWVudHMuIFRoZSByZWFzb24gZm9yIHRoaXMgaXMgYmVjYXVzZVxuICAvLyBzdHlsaW5nIGJpbmRpbmdzIChsaWtlIGBbc3R5bGVdYCBhbmQgYFtjbGFzc11gKSBhcmUgbm90IHJlY29nbml6ZWQgYXMgcHJvcGVydHlcbiAgLy8gYmluZGluZ3MgYnkgZGVmYXVsdCBzbyBhIHNlbGVjdChuKSBpbnN0cnVjdGlvbiBpcyBub3QgZ2VuZXJhdGVkLiBUbyBlbnN1cmUgdGhlXG4gIC8vIGNvbnRleHQgaXMgbG9hZGVkIGNvcnJlY3RseSBmb3IgdGhlIG5leHQgZWxlbWVudCB0aGUgY2FjaGUgYmVsb3cgaXMgcHJlLWVtcHRpdmVseVxuICAvLyBjbGVhcmVkIGJlY2F1c2UgdGhlcmUgaXMgbm8gY29kZSBpbiBBbmd1bGFyIHRoYXQgYXBwbGllcyBtb3JlIHN0eWxpbmcgY29kZSBhZnRlciBhXG4gIC8vIHN0eWxpbmcgZmx1c2ggaGFzIG9jY3VycmVkLiBOb3RlIHRoYXQgdGhpcyB3aWxsIGJlIGZpeGVkIG9uY2UgRlctMTI1NCBsYW5kcy5cbiAgc2V0Q2FjaGVkU3R5bGluZ0NvbnRleHQobnVsbCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRBY3RpdmVEaXJlY3RpdmVTdHlsaW5nSW5kZXgoKSB7XG4gIC8vIHdoZW5ldmVyIGEgZGlyZWN0aXZlJ3MgaG9zdEJpbmRpbmdzIGZ1bmN0aW9uIGlzIGNhbGxlZCBhIHVuaXF1ZUlkIHZhbHVlXG4gIC8vIGlzIGFzc2lnbmVkLiBOb3JtYWxseSB0aGlzIGlzIGVub3VnaCB0byBoZWxwIGRpc3Rpbmd1aXNoIG9uZSBkaXJlY3RpdmVcbiAgLy8gZnJvbSBhbm90aGVyIGZvciB0aGUgc3R5bGluZyBjb250ZXh0LCBidXQgdGhlcmUgYXJlIHNpdHVhdGlvbnMgd2hlcmUgYVxuICAvLyBzdWItY2xhc3MgZGlyZWN0aXZlIGNvdWxkIGluaGVyaXQgYW5kIGFzc2lnbiBzdHlsaW5nIGluIGNvbmNlcnQgd2l0aCBhXG4gIC8vIHBhcmVudCBkaXJlY3RpdmUuIFRvIGhlbHAgdGhlIHN0eWxpbmcgY29kZSBkaXN0aW5ndWlzaCBiZXR3ZWVuIGEgcGFyZW50XG4gIC8vIHN1Yi1jbGFzc2VkIGRpcmVjdGl2ZSB0aGUgaW5oZXJpdGFuY2UgZGVwdGggaXMgdGFrZW4gaW50byBhY2NvdW50IGFzIHdlbGwuXG4gIHJldHVybiBnZXRBY3RpdmVEaXJlY3RpdmVJZCgpICsgZ2V0QWN0aXZlRGlyZWN0aXZlU3VwZXJDbGFzc0RlcHRoKCk7XG59XG5cbmZ1bmN0aW9uIGdldFN0eWxpbmdDb250ZXh0KGluZGV4OiBudW1iZXIsIGxWaWV3OiBMVmlldykge1xuICBsZXQgY29udGV4dCA9IGdldENhY2hlZFN0eWxpbmdDb250ZXh0KCk7XG4gIGlmICghY29udGV4dCkge1xuICAgIGNvbnRleHQgPSBnZXRTdHlsaW5nQ29udGV4dEZyb21MVmlldyhpbmRleCArIEhFQURFUl9PRkZTRVQsIGxWaWV3KTtcbiAgICBzZXRDYWNoZWRTdHlsaW5nQ29udGV4dChjb250ZXh0KTtcbiAgfSBlbHNlIGlmIChuZ0Rldk1vZGUpIHtcbiAgICBjb25zdCBhY3R1YWxDb250ZXh0ID0gZ2V0U3R5bGluZ0NvbnRleHRGcm9tTFZpZXcoaW5kZXggKyBIRUFERVJfT0ZGU0VULCBsVmlldyk7XG4gICAgYXNzZXJ0RXF1YWwoY29udGV4dCwgYWN0dWFsQ29udGV4dCwgJ1RoZSBjYWNoZWQgc3R5bGluZyBjb250ZXh0IGlzIGludmFsaWQnKTtcbiAgfVxuICByZXR1cm4gY29udGV4dDtcbn1cbiJdfQ==