import { FLAGS, HEADER_OFFSET, RENDERER } from '../interfaces/view';
import { getActiveDirectiveId, getActiveDirectiveSuperClassDepth, getLView, getPreviousOrParentTNode, getSelectedIndex } from '../state';
import { getInitialClassNameValue, renderStyling, updateClassProp as updateElementClassProp, updateContextWithBindings, updateStyleProp as updateElementStyleProp, updateStylingMap } from '../styling/class_and_style_bindings';
import { enqueueHostInstruction, registerHostDirective } from '../styling/host_instructions_queue';
import { BoundPlayerFactory } from '../styling/player_factory';
import { DEFAULT_TEMPLATE_DIRECTIVE_INDEX } from '../styling/shared';
import { allocateOrUpdateDirectiveIntoContext, createEmptyStylingContext, forceClassesAsString, forceStylesAsString, getStylingContext, hasClassInput, hasStyleInput } from '../styling/util';
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
 * - elementStylingMap
 * - elementStyleProp
 * - elementClassProp
 * - elementStylingApply
 *
 * Host bindings level styling instructions:
 * - elementHostStyling
 * - elementHostStylingMap
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
 * @publicApi
 */
export function ΔelementStyling(classBindingNames, styleBindingNames, styleSanitizer) {
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
 * @publicApi
 */
export function ΔelementHostStyling(classBindingNames, styleBindingNames, styleSanitizer) {
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
 * on the element with `elementStylingMap` or any static styles that are
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
 * @publicApi
 */
export function ΔelementStyleProp(index, styleIndex, value, suffix, forceOverride) {
    var valueToAdd = resolveStylePropValue(value, suffix);
    updateElementStyleProp(getStylingContext(index + HEADER_OFFSET, getLView()), styleIndex, valueToAdd, DEFAULT_TEMPLATE_DIRECTIVE_INDEX, forceOverride);
}
/**
 * Update a host style binding value on the host element within a component/directive.
 *
 * If the style value is falsy then it will be removed from the host element
 * (or assigned a different value depending if there are any styles placed
 * on the same element with `elementHostStylingMap` or any static styles that
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
 * @publicApi
 */
export function ΔelementHostStyleProp(styleIndex, value, suffix, forceOverride) {
    var directiveStylingIndex = getActiveDirectiveStylingIndex();
    var hostElementIndex = getSelectedIndex();
    var lView = getLView();
    var stylingContext = getStylingContext(hostElementIndex + HEADER_OFFSET, lView);
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
 * @publicApi
 */
export function ΔelementClassProp(index, classIndex, value, forceOverride) {
    var input = (value instanceof BoundPlayerFactory) ?
        value :
        booleanOrNull(value);
    updateElementClassProp(getStylingContext(index + HEADER_OFFSET, getLView()), classIndex, input, DEFAULT_TEMPLATE_DIRECTIVE_INDEX, forceOverride);
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
 * @publicApi
 */
export function ΔelementHostClassProp(classIndex, value, forceOverride) {
    var directiveStylingIndex = getActiveDirectiveStylingIndex();
    var hostElementIndex = getSelectedIndex();
    var lView = getLView();
    var stylingContext = getStylingContext(hostElementIndex + HEADER_OFFSET, lView);
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
 * Update style and/or class bindings using object literals on an element.
 *
 * This instruction is meant to apply styling via the `[style]="exp"` and `[class]="exp"` template
 * bindings. When styles/classes are applied to the element they will then be updated with
 * respect to any styles/classes set with `elementStyleProp` or `elementClassProp`. If any
 * styles or classes are set to falsy then they will be removed from the element.
 *
 * Note that the styling instruction will not be applied until `elementStylingApply` is called.
 *
 * @param index Index of the element's with which styling is associated.
 * @param classes A key/value map or string of CSS classes that will be added to the
 *        given element. Any missing classes (that have already been applied to the element
 *        beforehand) will be removed (unset) from the element's list of CSS classes.
 * @param styles A key/value style map of the styles that will be applied to the given element.
 *        Any missing styles (that have already been applied to the element beforehand) will be
 *        removed (unset) from the element's styling.
 *
 * @publicApi
 */
export function ΔelementStylingMap(index, classes, styles) {
    var lView = getLView();
    var tNode = getTNode(index, lView);
    var stylingContext = getStylingContext(index + HEADER_OFFSET, lView);
    // inputs are only evaluated from a template binding into a directive, therefore,
    // there should not be a situation where a directive host bindings function
    // evaluates the inputs (this should only happen in the template function)
    if (hasClassInput(tNode) && classes !== NO_CHANGE) {
        var initialClasses = getInitialClassNameValue(stylingContext);
        var classInputVal = (initialClasses.length ? (initialClasses + ' ') : '') + forceClassesAsString(classes);
        setInputsForProperty(lView, tNode.inputs['class'], classInputVal);
        classes = NO_CHANGE;
    }
    if (hasStyleInput(tNode) && styles !== NO_CHANGE) {
        var initialStyles = getInitialClassNameValue(stylingContext);
        var styleInputVal = (initialStyles.length ? (initialStyles + ' ') : '') + forceStylesAsString(styles);
        setInputsForProperty(lView, tNode.inputs['style'], styleInputVal);
        styles = NO_CHANGE;
    }
    updateStylingMap(stylingContext, classes, styles);
}
/**
 * Update style and/or class host bindings using object literals on an element within the host
 * bindings function for a directive/component.
 *
 * This instruction is meant to apply styling via the `@HostBinding('style')` and
 * `@HostBinding('class')` bindings for a component's or directive's host element.
 * When styles/classes are applied to the host element they will then be updated
 * with respect to any styles/classes set with `elementHostStyleProp` or
 * `elementHostClassProp`. If any styles or classes are set to falsy then they
 * will be removed from the element.
 *
 * Note that the styling instruction will not be applied until
 * `elementHostStylingApply` is called.
 *
 * @param classes A key/value map or string of CSS classes that will be added to the
 *        given element. Any missing classes (that have already been applied to the element
 *        beforehand) will be removed (unset) from the element's list of CSS classes.
 * @param styles A key/value style map of the styles that will be applied to the given element.
 *        Any missing styles (that have already been applied to the element beforehand) will be
 *        removed (unset) from the element's styling.
 *
 * @publicApi
 */
export function ΔelementHostStylingMap(classes, styles) {
    var directiveStylingIndex = getActiveDirectiveStylingIndex();
    var hostElementIndex = getSelectedIndex();
    var lView = getLView();
    var stylingContext = getStylingContext(hostElementIndex + HEADER_OFFSET, lView);
    var args = [stylingContext, classes, styles, directiveStylingIndex];
    enqueueHostInstruction(stylingContext, directiveStylingIndex, updateStylingMap, args);
}
/**
 * Apply all style and class binding values to the element.
 *
 * This instruction is meant to be run after `elementStylingMap`, `elementStyleProp`
 * or `elementClassProp` instructions have been run and will only apply styling to
 * the element if any styling bindings have been updated.
 *
 * @param index Index of the element's with which styling is associated.
 *
 * @publicApi
 */
export function ΔelementStylingApply(index) {
    elementStylingApplyInternal(DEFAULT_TEMPLATE_DIRECTIVE_INDEX, index);
}
/**
 * Apply all style and class host binding values to the element.
 *
 * This instruction is meant to be run after `elementHostStylingMap`,
 * `elementHostStyleProp` or `elementHostClassProp` instructions have
 * been run and will only apply styling to the host element if any
 * styling bindings have been updated.
 *
 * @publicApi
 */
export function ΔelementHostStylingApply() {
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
    var stylingContext = getStylingContext(index + HEADER_OFFSET, lView);
    var totalPlayersQueued = renderStyling(stylingContext, renderer, lView, isFirstRender, null, null, directiveStylingIndex);
    if (totalPlayersQueued > 0) {
        var rootContext = getRootContext(lView);
        scheduleTick(rootContext, 2 /* FlushPlayers */);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3R5bGluZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaW5zdHJ1Y3Rpb25zL3N0eWxpbmcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBVUEsT0FBTyxFQUFDLEtBQUssRUFBRSxhQUFhLEVBQWMsUUFBUSxFQUFtQixNQUFNLG9CQUFvQixDQUFDO0FBQ2hHLE9BQU8sRUFBQyxvQkFBb0IsRUFBRSxpQ0FBaUMsRUFBRSxRQUFRLEVBQUUsd0JBQXdCLEVBQUUsZ0JBQWdCLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDdkksT0FBTyxFQUFDLHdCQUF3QixFQUFFLGFBQWEsRUFBRSxlQUFlLElBQUksc0JBQXNCLEVBQUUseUJBQXlCLEVBQUUsZUFBZSxJQUFJLHNCQUFzQixFQUFFLGdCQUFnQixFQUFDLE1BQU0scUNBQXFDLENBQUM7QUFDL04sT0FBTyxFQUFXLHNCQUFzQixFQUFFLHFCQUFxQixFQUFDLE1BQU0sb0NBQW9DLENBQUM7QUFDM0csT0FBTyxFQUFDLGtCQUFrQixFQUFDLE1BQU0sMkJBQTJCLENBQUM7QUFDN0QsT0FBTyxFQUFDLGdDQUFnQyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDbkUsT0FBTyxFQUFDLG9DQUFvQyxFQUFFLHlCQUF5QixFQUFFLG9CQUFvQixFQUFFLG1CQUFtQixFQUFFLGlCQUFpQixFQUFFLGFBQWEsRUFBRSxhQUFhLEVBQUMsTUFBTSxpQkFBaUIsQ0FBQztBQUM1TCxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sV0FBVyxDQUFDO0FBQ3BDLE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUNuRCxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sOEJBQThCLENBQUM7QUFDNUQsT0FBTyxFQUFDLFFBQVEsRUFBQyxNQUFNLG9CQUFvQixDQUFDO0FBRTVDLE9BQU8sRUFBQyxZQUFZLEVBQUUs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LENBQUMseUJBQTRCLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDdkUsSUFBTSxjQUFjLEdBQUcsaUJBQWlCLENBQUMsS0FBSyxHQUFHLGFBQWEsRUFBRSxLQUFLLENBQUMsQ0FBQztJQUN2RSxJQUFNLGtCQUFrQixHQUFHLGFBQWEsQ0FDcEMsY0FBYyxFQUFFLFFBQVEsRUFBRSxLQUFLLEVBQUUsYUFBYSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUscUJBQXFCLENBQUMsQ0FBQztJQUN2RixJQUFJLGtCQUFrQixHQUFHLENBQUMsRUFBRTtRQUMxQixJQUFNLFdBQVcsR0FBRyxjQUFjLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDMUMsWUFBWSxDQUFDLFdBQVcsdUJBQWdDLENBQUM7S0FDMUQ7QUFDSCxDQUFDO0FBRUQsTUFBTSxVQUFVLDhCQUE4QjtJQUM1QywwRUFBMEU7SUFDMUUseUVBQXlFO0lBQ3pFLHlFQUF5RTtJQUN6RSx5RUFBeUU7SUFDekUsMEVBQTBFO0lBQzFFLDZFQUE2RTtJQUM3RSxPQUFPLG9CQUFvQixFQUFFLEdBQUcsaUNBQWlDLEVBQUUsQ0FBQztBQUN0RSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0IHtTdHlsZVNhbml0aXplRm59IGZyb20gJy4uLy4uL3Nhbml0aXphdGlvbi9zdHlsZV9zYW5pdGl6ZXInO1xuaW1wb3J0IHtUTm9kZSwgVE5vZGVUeXBlfSBmcm9tICcuLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtQbGF5ZXJGYWN0b3J5fSBmcm9tICcuLi9pbnRlcmZhY2VzL3BsYXllcic7XG5pbXBvcnQge0ZMQUdTLCBIRUFERVJfT0ZGU0VULCBMVmlld0ZsYWdzLCBSRU5ERVJFUiwgUm9vdENvbnRleHRGbGFnc30gZnJvbSAnLi4vaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7Z2V0QWN0aXZlRGlyZWN0aXZlSWQsIGdldEFjdGl2ZURpcmVjdGl2ZVN1cGVyQ2xhc3NEZXB0aCwgZ2V0TFZpZXcsIGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSwgZ2V0U2VsZWN0ZWRJbmRleH0gZnJvbSAnLi4vc3RhdGUnO1xuaW1wb3J0IHtnZXRJbml0aWFsQ2xhc3NOYW1lVmFsdWUsIHJlbmRlclN0eWxpbmcsIHVwZGF0ZUNsYXNzUHJvcCBhcyB1cGRhdGVFbGVtZW50Q2xhc3NQcm9wLCB1cGRhdGVDb250ZXh0V2l0aEJpbmRpbmdzLCB1cGRhdGVTdHlsZVByb3AgYXMgdXBkYXRlRWxlbWVudFN0eWxlUHJvcCwgdXBkYXRlU3R5bGluZ01hcH0gZnJvbSAnLi4vc3R5bGluZy9jbGFzc19hbmRfc3R5bGVfYmluZGluZ3MnO1xuaW1wb3J0IHtQYXJhbXNPZiwgZW5xdWV1ZUhvc3RJbnN0cnVjdGlvbiwgcmVnaXN0ZXJIb3N0RGlyZWN0aXZlfSBmcm9tICcuLi9zdHlsaW5nL2hvc3RfaW5zdHJ1Y3Rpb25zX3F1ZXVlJztcbmltcG9ydCB7Qm91bmRQbGF5ZXJGYWN0b3J5fSBmcm9tICcuLi9zdHlsaW5nL3BsYXllcl9mYWN0b3J5JztcbmltcG9ydCB7REVGQVVMVF9URU1QTEFURV9ESVJFQ1RJVkVfSU5ERVh9IGZyb20gJy4uL3N0eWxpbmcvc2hhcmVkJztcbmltcG9ydCB7YWxsb2NhdGVPclVwZGF0ZURpcmVjdGl2ZUludG9Db250ZXh0LCBjcmVhdGVFbXB0eVN0eWxpbmdDb250ZXh0LCBmb3JjZUNsYXNzZXNBc1N0cmluZywgZm9yY2VTdHlsZXNBc1N0cmluZywgZ2V0U3R5bGluZ0NvbnRleHQsIGhhc0NsYXNzSW5wdXQsIGhhc1N0eWxlSW5wdXR9IGZyb20gJy4uL3N0eWxpbmcvdXRpbCc7XG5pbXBvcnQge05PX0NIQU5HRX0gZnJvbSAnLi4vdG9rZW5zJztcbmltcG9ydCB7cmVuZGVyU3RyaW5naWZ5fSBmcm9tICcuLi91dGlsL21pc2NfdXRpbHMnO1xuaW1wb3J0IHtnZXRSb290Q29udGV4dH0gZnJvbSAnLi4vdXRpbC92aWV3X3RyYXZlcnNhbF91dGlscyc7XG5pbXBvcnQge2dldFROb2RlfSBmcm9tICcuLi91dGlsL3ZpZXdfdXRpbHMnO1xuXG5pbXBvcnQge3NjaGVkdWxlVGljaywgc2V0SW5wdXRzRm9yUHJvcGVydHl9IGZyb20gJy4vc2hhcmVkJztcblxuXG5cbi8qXG4gKiBUaGUgY29udGVudHMgb2YgdGhpcyBmaWxlIGluY2x1ZGUgdGhlIGluc3RydWN0aW9ucyBmb3IgYWxsIHN0eWxpbmctcmVsYXRlZFxuICogb3BlcmF0aW9ucyBpbiBBbmd1bGFyLlxuICpcbiAqIFRoZSBpbnN0cnVjdGlvbnMgcHJlc2VudCBpbiB0aGlzIGZpbGUgYXJlOlxuICpcbiAqIFRlbXBsYXRlIGxldmVsIHN0eWxpbmcgaW5zdHJ1Y3Rpb25zOlxuICogLSBlbGVtZW50U3R5bGluZ1xuICogLSBlbGVtZW50U3R5bGluZ01hcFxuICogLSBlbGVtZW50U3R5bGVQcm9wXG4gKiAtIGVsZW1lbnRDbGFzc1Byb3BcbiAqIC0gZWxlbWVudFN0eWxpbmdBcHBseVxuICpcbiAqIEhvc3QgYmluZGluZ3MgbGV2ZWwgc3R5bGluZyBpbnN0cnVjdGlvbnM6XG4gKiAtIGVsZW1lbnRIb3N0U3R5bGluZ1xuICogLSBlbGVtZW50SG9zdFN0eWxpbmdNYXBcbiAqIC0gZWxlbWVudEhvc3RTdHlsZVByb3BcbiAqIC0gZWxlbWVudEhvc3RDbGFzc1Byb3BcbiAqIC0gZWxlbWVudEhvc3RTdHlsaW5nQXBwbHlcbiAqL1xuXG4vKipcbiAqIEFsbG9jYXRlcyBzdHlsZSBhbmQgY2xhc3MgYmluZGluZyBwcm9wZXJ0aWVzIG9uIHRoZSBlbGVtZW50IGR1cmluZyBjcmVhdGlvbiBtb2RlLlxuICpcbiAqIFRoaXMgaW5zdHJ1Y3Rpb24gaXMgbWVhbnQgdG8gYmUgY2FsbGVkIGR1cmluZyBjcmVhdGlvbiBtb2RlIHRvIHJlZ2lzdGVyIGFsbFxuICogZHluYW1pYyBzdHlsZSBhbmQgY2xhc3MgYmluZGluZ3Mgb24gdGhlIGVsZW1lbnQuIE5vdGUgdGhhdCB0aGlzIGlzIG9ubHkgdXNlZFxuICogZm9yIGJpbmRpbmcgdmFsdWVzIChzZWUgYGVsZW1lbnRTdGFydGAgdG8gbGVhcm4gaG93IHRvIGFzc2lnbiBzdGF0aWMgc3R5bGluZ1xuICogdmFsdWVzIHRvIGFuIGVsZW1lbnQpLlxuICpcbiAqIEBwYXJhbSBjbGFzc0JpbmRpbmdOYW1lcyBBbiBhcnJheSBjb250YWluaW5nIGJpbmRhYmxlIGNsYXNzIG5hbWVzLlxuICogICAgICAgIFRoZSBgZWxlbWVudENsYXNzUHJvcGAgaW5zdHJ1Y3Rpb24gcmVmZXJzIHRvIHRoZSBjbGFzcyBuYW1lIGJ5IGluZGV4IGluXG4gKiAgICAgICAgdGhpcyBhcnJheSAoaS5lLiBgWydmb28nLCAnYmFyJ11gIG1lYW5zIGBmb289MGAgYW5kIGBiYXI9MWApLlxuICogQHBhcmFtIHN0eWxlQmluZGluZ05hbWVzIEFuIGFycmF5IGNvbnRhaW5pbmcgYmluZGFibGUgc3R5bGUgcHJvcGVydGllcy5cbiAqICAgICAgICBUaGUgYGVsZW1lbnRTdHlsZVByb3BgIGluc3RydWN0aW9uIHJlZmVycyB0byB0aGUgY2xhc3MgbmFtZSBieSBpbmRleCBpblxuICogICAgICAgIHRoaXMgYXJyYXkgKGkuZS4gYFsnd2lkdGgnLCAnaGVpZ2h0J11gIG1lYW5zIGB3aWR0aD0wYCBhbmQgYGhlaWdodD0xYCkuXG4gKiBAcGFyYW0gc3R5bGVTYW5pdGl6ZXIgQW4gb3B0aW9uYWwgc2FuaXRpemVyIGZ1bmN0aW9uIHRoYXQgd2lsbCBiZSB1c2VkIHRvIHNhbml0aXplIGFueSBDU1NcbiAqICAgICAgICBzdHlsZSB2YWx1ZXMgdGhhdCBhcmUgYXBwbGllZCB0byB0aGUgZWxlbWVudCAoZHVyaW5nIHJlbmRlcmluZykuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gzpRlbGVtZW50U3R5bGluZyhcbiAgICBjbGFzc0JpbmRpbmdOYW1lcz86IHN0cmluZ1tdIHwgbnVsbCwgc3R5bGVCaW5kaW5nTmFtZXM/OiBzdHJpbmdbXSB8IG51bGwsXG4gICAgc3R5bGVTYW5pdGl6ZXI/OiBTdHlsZVNhbml0aXplRm4gfCBudWxsKTogdm9pZCB7XG4gIGNvbnN0IHROb2RlID0gZ2V0UHJldmlvdXNPclBhcmVudFROb2RlKCk7XG4gIGlmICghdE5vZGUuc3R5bGluZ1RlbXBsYXRlKSB7XG4gICAgdE5vZGUuc3R5bGluZ1RlbXBsYXRlID0gY3JlYXRlRW1wdHlTdHlsaW5nQ29udGV4dCgpO1xuICB9XG5cbiAgLy8gY2FsbGluZyB0aGUgZnVuY3Rpb24gYmVsb3cgZW5zdXJlcyB0aGF0IHRoZSB0ZW1wbGF0ZSdzIGJpbmRpbmcgdmFsdWVzXG4gIC8vIGFyZSBhcHBsaWVkIGFzIHRoZSBmaXJzdCBzZXQgb2YgYmluZGluZ3MgaW50byB0aGUgY29udGV4dC4gSWYgYW55IG90aGVyXG4gIC8vIHN0eWxpbmcgYmluZGluZ3MgYXJlIHNldCBvbiB0aGUgc2FtZSBlbGVtZW50IChieSBkaXJlY3RpdmVzIGFuZC9vclxuICAvLyBjb21wb25lbnRzKSB0aGVuIHRoZXkgd2lsbCBiZSBhcHBsaWVkIGF0IHRoZSBlbmQgb2YgdGhlIGBlbGVtZW50RW5kYFxuICAvLyBpbnN0cnVjdGlvbiAoYmVjYXVzZSBkaXJlY3RpdmVzIGFyZSBjcmVhdGVkIGZpcnN0IGJlZm9yZSBzdHlsaW5nIGlzXG4gIC8vIGV4ZWN1dGVkIGZvciBhIG5ldyBlbGVtZW50KS5cbiAgaW5pdEVsZW1lbnRTdHlsaW5nKFxuICAgICAgdE5vZGUsIGNsYXNzQmluZGluZ05hbWVzLCBzdHlsZUJpbmRpbmdOYW1lcywgc3R5bGVTYW5pdGl6ZXIsXG4gICAgICBERUZBVUxUX1RFTVBMQVRFX0RJUkVDVElWRV9JTkRFWCk7XG59XG5cbi8qKlxuICogQWxsb2NhdGVzIHN0eWxlIGFuZCBjbGFzcyBiaW5kaW5nIHByb3BlcnRpZXMgb24gdGhlIGhvc3QgZWxlbWVudCBkdXJpbmcgY3JlYXRpb24gbW9kZVxuICogd2l0aGluIHRoZSBob3N0IGJpbmRpbmdzIGZ1bmN0aW9uIG9mIGEgZGlyZWN0aXZlIG9yIGNvbXBvbmVudC5cbiAqXG4gKiBUaGlzIGluc3RydWN0aW9uIGlzIG1lYW50IHRvIGJlIGNhbGxlZCBkdXJpbmcgY3JlYXRpb24gbW9kZSB0byByZWdpc3RlciBhbGxcbiAqIGR5bmFtaWMgc3R5bGUgYW5kIGNsYXNzIGhvc3QgYmluZGluZ3Mgb24gdGhlIGhvc3QgZWxlbWVudCBvZiBhIGRpcmVjdGl2ZSBvclxuICogY29tcG9uZW50LiBOb3RlIHRoYXQgdGhpcyBpcyBvbmx5IHVzZWQgZm9yIGJpbmRpbmcgdmFsdWVzIChzZWUgYGVsZW1lbnRIb3N0QXR0cnNgXG4gKiB0byBsZWFybiBob3cgdG8gYXNzaWduIHN0YXRpYyBzdHlsaW5nIHZhbHVlcyB0byB0aGUgaG9zdCBlbGVtZW50KS5cbiAqXG4gKiBAcGFyYW0gY2xhc3NCaW5kaW5nTmFtZXMgQW4gYXJyYXkgY29udGFpbmluZyBiaW5kYWJsZSBjbGFzcyBuYW1lcy5cbiAqICAgICAgICBUaGUgYGVsZW1lbnRIb3N0Q2xhc3NQcm9wYCBpbnN0cnVjdGlvbiByZWZlcnMgdG8gdGhlIGNsYXNzIG5hbWUgYnkgaW5kZXggaW5cbiAqICAgICAgICB0aGlzIGFycmF5IChpLmUuIGBbJ2ZvbycsICdiYXInXWAgbWVhbnMgYGZvbz0wYCBhbmQgYGJhcj0xYCkuXG4gKiBAcGFyYW0gc3R5bGVCaW5kaW5nTmFtZXMgQW4gYXJyYXkgY29udGFpbmluZyBiaW5kYWJsZSBzdHlsZSBwcm9wZXJ0aWVzLlxuICogICAgICAgIFRoZSBgZWxlbWVudEhvc3RTdHlsZVByb3BgIGluc3RydWN0aW9uIHJlZmVycyB0byB0aGUgY2xhc3MgbmFtZSBieSBpbmRleCBpblxuICogICAgICAgIHRoaXMgYXJyYXkgKGkuZS4gYFsnd2lkdGgnLCAnaGVpZ2h0J11gIG1lYW5zIGB3aWR0aD0wYCBhbmQgYGhlaWdodD0xYCkuXG4gKiBAcGFyYW0gc3R5bGVTYW5pdGl6ZXIgQW4gb3B0aW9uYWwgc2FuaXRpemVyIGZ1bmN0aW9uIHRoYXQgd2lsbCBiZSB1c2VkIHRvIHNhbml0aXplIGFueSBDU1NcbiAqICAgICAgICBzdHlsZSB2YWx1ZXMgdGhhdCBhcmUgYXBwbGllZCB0byB0aGUgZWxlbWVudCAoZHVyaW5nIHJlbmRlcmluZykuXG4gKiAgICAgICAgTm90ZSB0aGF0IHRoZSBzYW5pdGl6ZXIgaW5zdGFuY2UgaXRzZWxmIGlzIHRpZWQgdG8gdGhlIHByb3ZpZGVkIGBkaXJlY3RpdmVgIGFuZFxuICogICAgICAgIHdpbGwgbm90IGJlIHVzZWQgaWYgdGhlIHNhbWUgcHJvcGVydHkgaXMgYXNzaWduZWQgaW4gYW5vdGhlciBkaXJlY3RpdmUgb3JcbiAqICAgICAgICBvbiB0aGUgZWxlbWVudCBkaXJlY3RseS5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDOlGVsZW1lbnRIb3N0U3R5bGluZyhcbiAgICBjbGFzc0JpbmRpbmdOYW1lcz86IHN0cmluZ1tdIHwgbnVsbCwgc3R5bGVCaW5kaW5nTmFtZXM/OiBzdHJpbmdbXSB8IG51bGwsXG4gICAgc3R5bGVTYW5pdGl6ZXI/OiBTdHlsZVNhbml0aXplRm4gfCBudWxsKTogdm9pZCB7XG4gIGNvbnN0IHROb2RlID0gZ2V0UHJldmlvdXNPclBhcmVudFROb2RlKCk7XG4gIGlmICghdE5vZGUuc3R5bGluZ1RlbXBsYXRlKSB7XG4gICAgdE5vZGUuc3R5bGluZ1RlbXBsYXRlID0gY3JlYXRlRW1wdHlTdHlsaW5nQ29udGV4dCgpO1xuICB9XG5cbiAgY29uc3QgZGlyZWN0aXZlU3R5bGluZ0luZGV4ID0gZ2V0QWN0aXZlRGlyZWN0aXZlU3R5bGluZ0luZGV4KCk7XG5cbiAgLy8gZGVzcGl0ZSB0aGUgYmluZGluZyBiZWluZyBhcHBsaWVkIGluIGEgcXVldWUgKGJlbG93KSwgdGhlIGFsbG9jYXRpb25cbiAgLy8gb2YgdGhlIGRpcmVjdGl2ZSBpbnRvIHRoZSBjb250ZXh0IGhhcHBlbnMgcmlnaHQgYXdheS4gVGhlIHJlYXNvbiBmb3JcbiAgLy8gdGhpcyBpcyB0byByZXRhaW4gdGhlIG9yZGVyaW5nIG9mIHRoZSBkaXJlY3RpdmVzICh3aGljaCBpcyBpbXBvcnRhbnRcbiAgLy8gZm9yIHRoZSBwcmlvcml0aXphdGlvbiBvZiBiaW5kaW5ncykuXG4gIGFsbG9jYXRlT3JVcGRhdGVEaXJlY3RpdmVJbnRvQ29udGV4dCh0Tm9kZS5zdHlsaW5nVGVtcGxhdGUsIGRpcmVjdGl2ZVN0eWxpbmdJbmRleCk7XG5cbiAgY29uc3QgZm5zID0gdE5vZGUub25FbGVtZW50Q3JlYXRpb25GbnMgPSB0Tm9kZS5vbkVsZW1lbnRDcmVhdGlvbkZucyB8fCBbXTtcbiAgZm5zLnB1c2goKCkgPT4ge1xuICAgIGluaXRFbGVtZW50U3R5bGluZyhcbiAgICAgICAgdE5vZGUsIGNsYXNzQmluZGluZ05hbWVzLCBzdHlsZUJpbmRpbmdOYW1lcywgc3R5bGVTYW5pdGl6ZXIsIGRpcmVjdGl2ZVN0eWxpbmdJbmRleCk7XG4gICAgcmVnaXN0ZXJIb3N0RGlyZWN0aXZlKHROb2RlLnN0eWxpbmdUZW1wbGF0ZSAhLCBkaXJlY3RpdmVTdHlsaW5nSW5kZXgpO1xuICB9KTtcbn1cblxuZnVuY3Rpb24gaW5pdEVsZW1lbnRTdHlsaW5nKFxuICAgIHROb2RlOiBUTm9kZSwgY2xhc3NCaW5kaW5nTmFtZXM6IHN0cmluZ1tdIHwgbnVsbCB8IHVuZGVmaW5lZCxcbiAgICBzdHlsZUJpbmRpbmdOYW1lczogc3RyaW5nW10gfCBudWxsIHwgdW5kZWZpbmVkLFxuICAgIHN0eWxlU2FuaXRpemVyOiBTdHlsZVNhbml0aXplRm4gfCBudWxsIHwgdW5kZWZpbmVkLCBkaXJlY3RpdmVTdHlsaW5nSW5kZXg6IG51bWJlcik6IHZvaWQge1xuICB1cGRhdGVDb250ZXh0V2l0aEJpbmRpbmdzKFxuICAgICAgdE5vZGUuc3R5bGluZ1RlbXBsYXRlICEsIGRpcmVjdGl2ZVN0eWxpbmdJbmRleCwgY2xhc3NCaW5kaW5nTmFtZXMsIHN0eWxlQmluZGluZ05hbWVzLFxuICAgICAgc3R5bGVTYW5pdGl6ZXIpO1xufVxuXG5cbi8qKlxuICogVXBkYXRlIGEgc3R5bGUgYmluZGluZyBvbiBhbiBlbGVtZW50IHdpdGggdGhlIHByb3ZpZGVkIHZhbHVlLlxuICpcbiAqIElmIHRoZSBzdHlsZSB2YWx1ZSBpcyBmYWxzeSB0aGVuIGl0IHdpbGwgYmUgcmVtb3ZlZCBmcm9tIHRoZSBlbGVtZW50XG4gKiAob3IgYXNzaWduZWQgYSBkaWZmZXJlbnQgdmFsdWUgZGVwZW5kaW5nIGlmIHRoZXJlIGFyZSBhbnkgc3R5bGVzIHBsYWNlZFxuICogb24gdGhlIGVsZW1lbnQgd2l0aCBgZWxlbWVudFN0eWxpbmdNYXBgIG9yIGFueSBzdGF0aWMgc3R5bGVzIHRoYXQgYXJlXG4gKiBwcmVzZW50IGZyb20gd2hlbiB0aGUgZWxlbWVudCB3YXMgY3JlYXRlZCB3aXRoIGBlbGVtZW50U3R5bGluZ2ApLlxuICpcbiAqIE5vdGUgdGhhdCB0aGUgc3R5bGluZyBlbGVtZW50IGlzIHVwZGF0ZWQgYXMgcGFydCBvZiBgZWxlbWVudFN0eWxpbmdBcHBseWAuXG4gKlxuICogQHBhcmFtIGluZGV4IEluZGV4IG9mIHRoZSBlbGVtZW50J3Mgd2l0aCB3aGljaCBzdHlsaW5nIGlzIGFzc29jaWF0ZWQuXG4gKiBAcGFyYW0gc3R5bGVJbmRleCBJbmRleCBvZiBzdHlsZSB0byB1cGRhdGUuIFRoaXMgaW5kZXggdmFsdWUgcmVmZXJzIHRvIHRoZVxuICogICAgICAgIGluZGV4IG9mIHRoZSBzdHlsZSBpbiB0aGUgc3R5bGUgYmluZGluZ3MgYXJyYXkgdGhhdCB3YXMgcGFzc2VkIGludG9cbiAqICAgICAgICBgZWxlbWVudFN0eWxpbmdgLlxuICogQHBhcmFtIHZhbHVlIE5ldyB2YWx1ZSB0byB3cml0ZSAoZmFsc3kgdG8gcmVtb3ZlKS4gTm90ZSB0aGF0IGlmIGEgZGlyZWN0aXZlIGFsc29cbiAqICAgICAgICBhdHRlbXB0cyB0byB3cml0ZSB0byB0aGUgc2FtZSBiaW5kaW5nIHZhbHVlICh2aWEgYGVsZW1lbnRIb3N0U3R5bGVQcm9wYClcbiAqICAgICAgICB0aGVuIGl0IHdpbGwgb25seSBiZSBhYmxlIHRvIGRvIHNvIGlmIHRoZSBiaW5kaW5nIHZhbHVlIGFzc2lnbmVkIHZpYVxuICogICAgICAgIGBlbGVtZW50U3R5bGVQcm9wYCBpcyBmYWxzeSAob3IgZG9lc24ndCBleGlzdCBhdCBhbGwpLlxuICogQHBhcmFtIHN1ZmZpeCBPcHRpb25hbCBzdWZmaXguIFVzZWQgd2l0aCBzY2FsYXIgdmFsdWVzIHRvIGFkZCB1bml0IHN1Y2ggYXMgYHB4YC5cbiAqICAgICAgICBOb3RlIHRoYXQgd2hlbiBhIHN1ZmZpeCBpcyBwcm92aWRlZCB0aGVuIHRoZSB1bmRlcmx5aW5nIHNhbml0aXplciB3aWxsXG4gKiAgICAgICAgYmUgaWdub3JlZC5cbiAqIEBwYXJhbSBmb3JjZU92ZXJyaWRlIFdoZXRoZXIgb3Igbm90IHRvIHVwZGF0ZSB0aGUgc3R5bGluZyB2YWx1ZSBpbW1lZGlhdGVseVxuICogICAgICAgIChkZXNwaXRlIHRoZSBvdGhlciBiaW5kaW5ncyBwb3NzaWJseSBoYXZpbmcgcHJpb3JpdHkpXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gzpRlbGVtZW50U3R5bGVQcm9wKFxuICAgIGluZGV4OiBudW1iZXIsIHN0eWxlSW5kZXg6IG51bWJlciwgdmFsdWU6IHN0cmluZyB8IG51bWJlciB8IFN0cmluZyB8IFBsYXllckZhY3RvcnkgfCBudWxsLFxuICAgIHN1ZmZpeD86IHN0cmluZyB8IG51bGwsIGZvcmNlT3ZlcnJpZGU/OiBib29sZWFuKTogdm9pZCB7XG4gIGNvbnN0IHZhbHVlVG9BZGQgPSByZXNvbHZlU3R5bGVQcm9wVmFsdWUodmFsdWUsIHN1ZmZpeCk7XG4gIHVwZGF0ZUVsZW1lbnRTdHlsZVByb3AoXG4gICAgICBnZXRTdHlsaW5nQ29udGV4dChpbmRleCArIEhFQURFUl9PRkZTRVQsIGdldExWaWV3KCkpLCBzdHlsZUluZGV4LCB2YWx1ZVRvQWRkLFxuICAgICAgREVGQVVMVF9URU1QTEFURV9ESVJFQ1RJVkVfSU5ERVgsIGZvcmNlT3ZlcnJpZGUpO1xufVxuXG4vKipcbiAqIFVwZGF0ZSBhIGhvc3Qgc3R5bGUgYmluZGluZyB2YWx1ZSBvbiB0aGUgaG9zdCBlbGVtZW50IHdpdGhpbiBhIGNvbXBvbmVudC9kaXJlY3RpdmUuXG4gKlxuICogSWYgdGhlIHN0eWxlIHZhbHVlIGlzIGZhbHN5IHRoZW4gaXQgd2lsbCBiZSByZW1vdmVkIGZyb20gdGhlIGhvc3QgZWxlbWVudFxuICogKG9yIGFzc2lnbmVkIGEgZGlmZmVyZW50IHZhbHVlIGRlcGVuZGluZyBpZiB0aGVyZSBhcmUgYW55IHN0eWxlcyBwbGFjZWRcbiAqIG9uIHRoZSBzYW1lIGVsZW1lbnQgd2l0aCBgZWxlbWVudEhvc3RTdHlsaW5nTWFwYCBvciBhbnkgc3RhdGljIHN0eWxlcyB0aGF0XG4gKiBhcmUgcHJlc2VudCBmcm9tIHdoZW4gdGhlIGVsZW1lbnQgd2FzIHBhdGNoZWQgd2l0aCBgZWxlbWVudEhvc3RTdHlsaW5nYCkuXG4gKlxuICogTm90ZSB0aGF0IHRoZSBzdHlsaW5nIGFwcGxpZWQgdG8gdGhlIGhvc3QgZWxlbWVudCBvbmNlXG4gKiBgZWxlbWVudEhvc3RTdHlsaW5nQXBwbHlgIGlzIGNhbGxlZC5cbiAqXG4gKiBAcGFyYW0gc3R5bGVJbmRleCBJbmRleCBvZiBzdHlsZSB0byB1cGRhdGUuIFRoaXMgaW5kZXggdmFsdWUgcmVmZXJzIHRvIHRoZVxuICogICAgICAgIGluZGV4IG9mIHRoZSBzdHlsZSBpbiB0aGUgc3R5bGUgYmluZGluZ3MgYXJyYXkgdGhhdCB3YXMgcGFzc2VkIGludG9cbiAqICAgICAgICBgZWxlbWVudEhvc3RTdHlsaW5nYC5cbiAqIEBwYXJhbSB2YWx1ZSBOZXcgdmFsdWUgdG8gd3JpdGUgKGZhbHN5IHRvIHJlbW92ZSkuIFRoZSB2YWx1ZSBtYXkgb3IgbWF5IG5vdFxuICogICAgICAgIGJlIGFwcGxpZWQgdG8gdGhlIGVsZW1lbnQgZGVwZW5kaW5nIG9uIHRoZSB0ZW1wbGF0ZS9jb21wb25lbnQvZGlyZWN0aXZlXG4gKiAgICAgICAgcHJpb3JpdGl6YXRpb24gKHNlZSBgaW50ZXJmYWNlcy9zdHlsaW5nLnRzYClcbiAqIEBwYXJhbSBzdWZmaXggT3B0aW9uYWwgc3VmZml4LiBVc2VkIHdpdGggc2NhbGFyIHZhbHVlcyB0byBhZGQgdW5pdCBzdWNoIGFzIGBweGAuXG4gKiAgICAgICAgTm90ZSB0aGF0IHdoZW4gYSBzdWZmaXggaXMgcHJvdmlkZWQgdGhlbiB0aGUgdW5kZXJseWluZyBzYW5pdGl6ZXIgd2lsbFxuICogICAgICAgIGJlIGlnbm9yZWQuXG4gKiBAcGFyYW0gZm9yY2VPdmVycmlkZSBXaGV0aGVyIG9yIG5vdCB0byB1cGRhdGUgdGhlIHN0eWxpbmcgdmFsdWUgaW1tZWRpYXRlbHlcbiAqICAgICAgICAoZGVzcGl0ZSB0aGUgb3RoZXIgYmluZGluZ3MgcG9zc2libHkgaGF2aW5nIHByaW9yaXR5KVxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIM6UZWxlbWVudEhvc3RTdHlsZVByb3AoXG4gICAgc3R5bGVJbmRleDogbnVtYmVyLCB2YWx1ZTogc3RyaW5nIHwgbnVtYmVyIHwgU3RyaW5nIHwgUGxheWVyRmFjdG9yeSB8IG51bGwsXG4gICAgc3VmZml4Pzogc3RyaW5nIHwgbnVsbCwgZm9yY2VPdmVycmlkZT86IGJvb2xlYW4pOiB2b2lkIHtcbiAgY29uc3QgZGlyZWN0aXZlU3R5bGluZ0luZGV4ID0gZ2V0QWN0aXZlRGlyZWN0aXZlU3R5bGluZ0luZGV4KCk7XG4gIGNvbnN0IGhvc3RFbGVtZW50SW5kZXggPSBnZXRTZWxlY3RlZEluZGV4KCk7XG5cbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCBzdHlsaW5nQ29udGV4dCA9IGdldFN0eWxpbmdDb250ZXh0KGhvc3RFbGVtZW50SW5kZXggKyBIRUFERVJfT0ZGU0VULCBsVmlldyk7XG5cbiAgY29uc3QgdmFsdWVUb0FkZCA9IHJlc29sdmVTdHlsZVByb3BWYWx1ZSh2YWx1ZSwgc3VmZml4KTtcbiAgY29uc3QgYXJnczogUGFyYW1zT2Y8dHlwZW9mIHVwZGF0ZUVsZW1lbnRTdHlsZVByb3A+ID1cbiAgICAgIFtzdHlsaW5nQ29udGV4dCwgc3R5bGVJbmRleCwgdmFsdWVUb0FkZCwgZGlyZWN0aXZlU3R5bGluZ0luZGV4LCBmb3JjZU92ZXJyaWRlXTtcbiAgZW5xdWV1ZUhvc3RJbnN0cnVjdGlvbihzdHlsaW5nQ29udGV4dCwgZGlyZWN0aXZlU3R5bGluZ0luZGV4LCB1cGRhdGVFbGVtZW50U3R5bGVQcm9wLCBhcmdzKTtcbn1cblxuZnVuY3Rpb24gcmVzb2x2ZVN0eWxlUHJvcFZhbHVlKFxuICAgIHZhbHVlOiBzdHJpbmcgfCBudW1iZXIgfCBTdHJpbmcgfCBQbGF5ZXJGYWN0b3J5IHwgbnVsbCwgc3VmZml4OiBzdHJpbmcgfCBudWxsIHwgdW5kZWZpbmVkKSB7XG4gIGxldCB2YWx1ZVRvQWRkOiBzdHJpbmd8bnVsbCA9IG51bGw7XG4gIGlmICh2YWx1ZSAhPT0gbnVsbCkge1xuICAgIGlmIChzdWZmaXgpIHtcbiAgICAgIC8vIHdoZW4gYSBzdWZmaXggaXMgYXBwbGllZCB0aGVuIGl0IHdpbGwgYnlwYXNzXG4gICAgICAvLyBzYW5pdGl6YXRpb24gZW50aXJlbHkgKGIvYyBhIG5ldyBzdHJpbmcgaXMgY3JlYXRlZClcbiAgICAgIHZhbHVlVG9BZGQgPSByZW5kZXJTdHJpbmdpZnkodmFsdWUpICsgc3VmZml4O1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBzYW5pdGl6YXRpb24gaGFwcGVucyBieSBkZWFsaW5nIHdpdGggYSBTdHJpbmcgdmFsdWVcbiAgICAgIC8vIHRoaXMgbWVhbnMgdGhhdCB0aGUgc3RyaW5nIHZhbHVlIHdpbGwgYmUgcGFzc2VkIHRocm91Z2hcbiAgICAgIC8vIGludG8gdGhlIHN0eWxlIHJlbmRlcmluZyBsYXRlciAod2hpY2ggaXMgd2hlcmUgdGhlIHZhbHVlXG4gICAgICAvLyB3aWxsIGJlIHNhbml0aXplZCBiZWZvcmUgaXQgaXMgYXBwbGllZClcbiAgICAgIHZhbHVlVG9BZGQgPSB2YWx1ZSBhcyBhbnkgYXMgc3RyaW5nO1xuICAgIH1cbiAgfVxuICByZXR1cm4gdmFsdWVUb0FkZDtcbn1cblxuXG4vKipcbiAqIFVwZGF0ZSBhIGNsYXNzIGJpbmRpbmcgb24gYW4gZWxlbWVudCB3aXRoIHRoZSBwcm92aWRlZCB2YWx1ZS5cbiAqXG4gKiBUaGlzIGluc3RydWN0aW9uIGlzIG1lYW50IHRvIGhhbmRsZSB0aGUgYFtjbGFzcy5mb29dPVwiZXhwXCJgIGNhc2UgYW5kLFxuICogdGhlcmVmb3JlLCB0aGUgY2xhc3MgYmluZGluZyBpdHNlbGYgbXVzdCBhbHJlYWR5IGJlIGFsbG9jYXRlZCB1c2luZ1xuICogYGVsZW1lbnRTdHlsaW5nYCB3aXRoaW4gdGhlIGNyZWF0aW9uIGJsb2NrLlxuICpcbiAqIEBwYXJhbSBpbmRleCBJbmRleCBvZiB0aGUgZWxlbWVudCdzIHdpdGggd2hpY2ggc3R5bGluZyBpcyBhc3NvY2lhdGVkLlxuICogQHBhcmFtIGNsYXNzSW5kZXggSW5kZXggb2YgY2xhc3MgdG8gdG9nZ2xlLiBUaGlzIGluZGV4IHZhbHVlIHJlZmVycyB0byB0aGVcbiAqICAgICAgICBpbmRleCBvZiB0aGUgY2xhc3MgaW4gdGhlIGNsYXNzIGJpbmRpbmdzIGFycmF5IHRoYXQgd2FzIHBhc3NlZCBpbnRvXG4gKiAgICAgICAgYGVsZW1lbnRTdHlsaW5nYCAod2hpY2ggaXMgbWVhbnQgdG8gYmUgY2FsbGVkIGJlZm9yZSB0aGlzXG4gKiAgICAgICAgZnVuY3Rpb24gaXMpLlxuICogQHBhcmFtIHZhbHVlIEEgdHJ1ZS9mYWxzZSB2YWx1ZSB3aGljaCB3aWxsIHR1cm4gdGhlIGNsYXNzIG9uIG9yIG9mZi5cbiAqIEBwYXJhbSBmb3JjZU92ZXJyaWRlIFdoZXRoZXIgb3Igbm90IHRoaXMgdmFsdWUgd2lsbCBiZSBhcHBsaWVkIHJlZ2FyZGxlc3NcbiAqICAgICAgICBvZiB3aGVyZSBpdCBpcyBiZWluZyBzZXQgd2l0aGluIHRoZSBzdHlsaW5nIHByaW9yaXR5IHN0cnVjdHVyZS5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDOlGVsZW1lbnRDbGFzc1Byb3AoXG4gICAgaW5kZXg6IG51bWJlciwgY2xhc3NJbmRleDogbnVtYmVyLCB2YWx1ZTogYm9vbGVhbiB8IFBsYXllckZhY3RvcnksXG4gICAgZm9yY2VPdmVycmlkZT86IGJvb2xlYW4pOiB2b2lkIHtcbiAgY29uc3QgaW5wdXQgPSAodmFsdWUgaW5zdGFuY2VvZiBCb3VuZFBsYXllckZhY3RvcnkpID9cbiAgICAgICh2YWx1ZSBhcyBCb3VuZFBsYXllckZhY3Rvcnk8Ym9vbGVhbnxudWxsPikgOlxuICAgICAgYm9vbGVhbk9yTnVsbCh2YWx1ZSk7XG4gIHVwZGF0ZUVsZW1lbnRDbGFzc1Byb3AoXG4gICAgICBnZXRTdHlsaW5nQ29udGV4dChpbmRleCArIEhFQURFUl9PRkZTRVQsIGdldExWaWV3KCkpLCBjbGFzc0luZGV4LCBpbnB1dCxcbiAgICAgIERFRkFVTFRfVEVNUExBVEVfRElSRUNUSVZFX0lOREVYLCBmb3JjZU92ZXJyaWRlKTtcbn1cblxuXG4vKipcbiAqIFVwZGF0ZSBhIGNsYXNzIGhvc3QgYmluZGluZyBmb3IgYSBkaXJlY3RpdmUncy9jb21wb25lbnQncyBob3N0IGVsZW1lbnQgd2l0aGluXG4gKiB0aGUgaG9zdCBiaW5kaW5ncyBmdW5jdGlvbi5cbiAqXG4gKiBUaGlzIGluc3RydWN0aW9uIGlzIG1lYW50IHRvIGhhbmRsZSB0aGUgYEBIb3N0QmluZGluZygnY2xhc3MuZm9vJylgIGNhc2UgYW5kLFxuICogdGhlcmVmb3JlLCB0aGUgY2xhc3MgYmluZGluZyBpdHNlbGYgbXVzdCBhbHJlYWR5IGJlIGFsbG9jYXRlZCB1c2luZ1xuICogYGVsZW1lbnRIb3N0U3R5bGluZ2Agd2l0aGluIHRoZSBjcmVhdGlvbiBibG9jay5cbiAqXG4gKiBAcGFyYW0gY2xhc3NJbmRleCBJbmRleCBvZiBjbGFzcyB0byB0b2dnbGUuIFRoaXMgaW5kZXggdmFsdWUgcmVmZXJzIHRvIHRoZVxuICogICAgICAgIGluZGV4IG9mIHRoZSBjbGFzcyBpbiB0aGUgY2xhc3MgYmluZGluZ3MgYXJyYXkgdGhhdCB3YXMgcGFzc2VkIGludG9cbiAqICAgICAgICBgZWxlbWVudEhvc3RTdGx5aW5nYCAod2hpY2ggaXMgbWVhbnQgdG8gYmUgY2FsbGVkIGJlZm9yZSB0aGlzXG4gKiAgICAgICAgZnVuY3Rpb24gaXMpLlxuICogQHBhcmFtIHZhbHVlIEEgdHJ1ZS9mYWxzZSB2YWx1ZSB3aGljaCB3aWxsIHR1cm4gdGhlIGNsYXNzIG9uIG9yIG9mZi5cbiAqIEBwYXJhbSBmb3JjZU92ZXJyaWRlIFdoZXRoZXIgb3Igbm90IHRoaXMgdmFsdWUgd2lsbCBiZSBhcHBsaWVkIHJlZ2FyZGxlc3NcbiAqICAgICAgICBvZiB3aGVyZSBpdCBpcyBiZWluZyBzZXQgd2l0aGluIHRoZSBzdHlsaW5ncyBwcmlvcml0eSBzdHJ1Y3R1cmUuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gzpRlbGVtZW50SG9zdENsYXNzUHJvcChcbiAgICBjbGFzc0luZGV4OiBudW1iZXIsIHZhbHVlOiBib29sZWFuIHwgUGxheWVyRmFjdG9yeSwgZm9yY2VPdmVycmlkZT86IGJvb2xlYW4pOiB2b2lkIHtcbiAgY29uc3QgZGlyZWN0aXZlU3R5bGluZ0luZGV4ID0gZ2V0QWN0aXZlRGlyZWN0aXZlU3R5bGluZ0luZGV4KCk7XG4gIGNvbnN0IGhvc3RFbGVtZW50SW5kZXggPSBnZXRTZWxlY3RlZEluZGV4KCk7XG5cbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCBzdHlsaW5nQ29udGV4dCA9IGdldFN0eWxpbmdDb250ZXh0KGhvc3RFbGVtZW50SW5kZXggKyBIRUFERVJfT0ZGU0VULCBsVmlldyk7XG5cbiAgY29uc3QgaW5wdXQgPSAodmFsdWUgaW5zdGFuY2VvZiBCb3VuZFBsYXllckZhY3RvcnkpID9cbiAgICAgICh2YWx1ZSBhcyBCb3VuZFBsYXllckZhY3Rvcnk8Ym9vbGVhbnxudWxsPikgOlxuICAgICAgYm9vbGVhbk9yTnVsbCh2YWx1ZSk7XG5cbiAgY29uc3QgYXJnczogUGFyYW1zT2Y8dHlwZW9mIHVwZGF0ZUVsZW1lbnRDbGFzc1Byb3A+ID1cbiAgICAgIFtzdHlsaW5nQ29udGV4dCwgY2xhc3NJbmRleCwgaW5wdXQsIGRpcmVjdGl2ZVN0eWxpbmdJbmRleCwgZm9yY2VPdmVycmlkZV07XG4gIGVucXVldWVIb3N0SW5zdHJ1Y3Rpb24oc3R5bGluZ0NvbnRleHQsIGRpcmVjdGl2ZVN0eWxpbmdJbmRleCwgdXBkYXRlRWxlbWVudENsYXNzUHJvcCwgYXJncyk7XG59XG5cbmZ1bmN0aW9uIGJvb2xlYW5Pck51bGwodmFsdWU6IGFueSk6IGJvb2xlYW58bnVsbCB7XG4gIGlmICh0eXBlb2YgdmFsdWUgPT09ICdib29sZWFuJykgcmV0dXJuIHZhbHVlO1xuICByZXR1cm4gdmFsdWUgPyB0cnVlIDogbnVsbDtcbn1cblxuXG4vKipcbiAqIFVwZGF0ZSBzdHlsZSBhbmQvb3IgY2xhc3MgYmluZGluZ3MgdXNpbmcgb2JqZWN0IGxpdGVyYWxzIG9uIGFuIGVsZW1lbnQuXG4gKlxuICogVGhpcyBpbnN0cnVjdGlvbiBpcyBtZWFudCB0byBhcHBseSBzdHlsaW5nIHZpYSB0aGUgYFtzdHlsZV09XCJleHBcImAgYW5kIGBbY2xhc3NdPVwiZXhwXCJgIHRlbXBsYXRlXG4gKiBiaW5kaW5ncy4gV2hlbiBzdHlsZXMvY2xhc3NlcyBhcmUgYXBwbGllZCB0byB0aGUgZWxlbWVudCB0aGV5IHdpbGwgdGhlbiBiZSB1cGRhdGVkIHdpdGhcbiAqIHJlc3BlY3QgdG8gYW55IHN0eWxlcy9jbGFzc2VzIHNldCB3aXRoIGBlbGVtZW50U3R5bGVQcm9wYCBvciBgZWxlbWVudENsYXNzUHJvcGAuIElmIGFueVxuICogc3R5bGVzIG9yIGNsYXNzZXMgYXJlIHNldCB0byBmYWxzeSB0aGVuIHRoZXkgd2lsbCBiZSByZW1vdmVkIGZyb20gdGhlIGVsZW1lbnQuXG4gKlxuICogTm90ZSB0aGF0IHRoZSBzdHlsaW5nIGluc3RydWN0aW9uIHdpbGwgbm90IGJlIGFwcGxpZWQgdW50aWwgYGVsZW1lbnRTdHlsaW5nQXBwbHlgIGlzIGNhbGxlZC5cbiAqXG4gKiBAcGFyYW0gaW5kZXggSW5kZXggb2YgdGhlIGVsZW1lbnQncyB3aXRoIHdoaWNoIHN0eWxpbmcgaXMgYXNzb2NpYXRlZC5cbiAqIEBwYXJhbSBjbGFzc2VzIEEga2V5L3ZhbHVlIG1hcCBvciBzdHJpbmcgb2YgQ1NTIGNsYXNzZXMgdGhhdCB3aWxsIGJlIGFkZGVkIHRvIHRoZVxuICogICAgICAgIGdpdmVuIGVsZW1lbnQuIEFueSBtaXNzaW5nIGNsYXNzZXMgKHRoYXQgaGF2ZSBhbHJlYWR5IGJlZW4gYXBwbGllZCB0byB0aGUgZWxlbWVudFxuICogICAgICAgIGJlZm9yZWhhbmQpIHdpbGwgYmUgcmVtb3ZlZCAodW5zZXQpIGZyb20gdGhlIGVsZW1lbnQncyBsaXN0IG9mIENTUyBjbGFzc2VzLlxuICogQHBhcmFtIHN0eWxlcyBBIGtleS92YWx1ZSBzdHlsZSBtYXAgb2YgdGhlIHN0eWxlcyB0aGF0IHdpbGwgYmUgYXBwbGllZCB0byB0aGUgZ2l2ZW4gZWxlbWVudC5cbiAqICAgICAgICBBbnkgbWlzc2luZyBzdHlsZXMgKHRoYXQgaGF2ZSBhbHJlYWR5IGJlZW4gYXBwbGllZCB0byB0aGUgZWxlbWVudCBiZWZvcmVoYW5kKSB3aWxsIGJlXG4gKiAgICAgICAgcmVtb3ZlZCAodW5zZXQpIGZyb20gdGhlIGVsZW1lbnQncyBzdHlsaW5nLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIM6UZWxlbWVudFN0eWxpbmdNYXAoXG4gICAgaW5kZXg6IG51bWJlciwgY2xhc3Nlczoge1trZXk6IHN0cmluZ106IGFueX0gfCBzdHJpbmcgfCBOT19DSEFOR0UgfCBudWxsLFxuICAgIHN0eWxlcz86IHtbc3R5bGVOYW1lOiBzdHJpbmddOiBhbnl9IHwgTk9fQ0hBTkdFIHwgbnVsbCk6IHZvaWQge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IHROb2RlID0gZ2V0VE5vZGUoaW5kZXgsIGxWaWV3KTtcbiAgY29uc3Qgc3R5bGluZ0NvbnRleHQgPSBnZXRTdHlsaW5nQ29udGV4dChpbmRleCArIEhFQURFUl9PRkZTRVQsIGxWaWV3KTtcblxuICAvLyBpbnB1dHMgYXJlIG9ubHkgZXZhbHVhdGVkIGZyb20gYSB0ZW1wbGF0ZSBiaW5kaW5nIGludG8gYSBkaXJlY3RpdmUsIHRoZXJlZm9yZSxcbiAgLy8gdGhlcmUgc2hvdWxkIG5vdCBiZSBhIHNpdHVhdGlvbiB3aGVyZSBhIGRpcmVjdGl2ZSBob3N0IGJpbmRpbmdzIGZ1bmN0aW9uXG4gIC8vIGV2YWx1YXRlcyB0aGUgaW5wdXRzICh0aGlzIHNob3VsZCBvbmx5IGhhcHBlbiBpbiB0aGUgdGVtcGxhdGUgZnVuY3Rpb24pXG4gIGlmIChoYXNDbGFzc0lucHV0KHROb2RlKSAmJiBjbGFzc2VzICE9PSBOT19DSEFOR0UpIHtcbiAgICBjb25zdCBpbml0aWFsQ2xhc3NlcyA9IGdldEluaXRpYWxDbGFzc05hbWVWYWx1ZShzdHlsaW5nQ29udGV4dCk7XG4gICAgY29uc3QgY2xhc3NJbnB1dFZhbCA9XG4gICAgICAgIChpbml0aWFsQ2xhc3Nlcy5sZW5ndGggPyAoaW5pdGlhbENsYXNzZXMgKyAnICcpIDogJycpICsgZm9yY2VDbGFzc2VzQXNTdHJpbmcoY2xhc3Nlcyk7XG4gICAgc2V0SW5wdXRzRm9yUHJvcGVydHkobFZpZXcsIHROb2RlLmlucHV0cyAhWydjbGFzcyddICEsIGNsYXNzSW5wdXRWYWwpO1xuICAgIGNsYXNzZXMgPSBOT19DSEFOR0U7XG4gIH1cblxuICBpZiAoaGFzU3R5bGVJbnB1dCh0Tm9kZSkgJiYgc3R5bGVzICE9PSBOT19DSEFOR0UpIHtcbiAgICBjb25zdCBpbml0aWFsU3R5bGVzID0gZ2V0SW5pdGlhbENsYXNzTmFtZVZhbHVlKHN0eWxpbmdDb250ZXh0KTtcbiAgICBjb25zdCBzdHlsZUlucHV0VmFsID1cbiAgICAgICAgKGluaXRpYWxTdHlsZXMubGVuZ3RoID8gKGluaXRpYWxTdHlsZXMgKyAnICcpIDogJycpICsgZm9yY2VTdHlsZXNBc1N0cmluZyhzdHlsZXMpO1xuICAgIHNldElucHV0c0ZvclByb3BlcnR5KGxWaWV3LCB0Tm9kZS5pbnB1dHMgIVsnc3R5bGUnXSAhLCBzdHlsZUlucHV0VmFsKTtcbiAgICBzdHlsZXMgPSBOT19DSEFOR0U7XG4gIH1cblxuICB1cGRhdGVTdHlsaW5nTWFwKHN0eWxpbmdDb250ZXh0LCBjbGFzc2VzLCBzdHlsZXMpO1xufVxuXG5cbi8qKlxuICogVXBkYXRlIHN0eWxlIGFuZC9vciBjbGFzcyBob3N0IGJpbmRpbmdzIHVzaW5nIG9iamVjdCBsaXRlcmFscyBvbiBhbiBlbGVtZW50IHdpdGhpbiB0aGUgaG9zdFxuICogYmluZGluZ3MgZnVuY3Rpb24gZm9yIGEgZGlyZWN0aXZlL2NvbXBvbmVudC5cbiAqXG4gKiBUaGlzIGluc3RydWN0aW9uIGlzIG1lYW50IHRvIGFwcGx5IHN0eWxpbmcgdmlhIHRoZSBgQEhvc3RCaW5kaW5nKCdzdHlsZScpYCBhbmRcbiAqIGBASG9zdEJpbmRpbmcoJ2NsYXNzJylgIGJpbmRpbmdzIGZvciBhIGNvbXBvbmVudCdzIG9yIGRpcmVjdGl2ZSdzIGhvc3QgZWxlbWVudC5cbiAqIFdoZW4gc3R5bGVzL2NsYXNzZXMgYXJlIGFwcGxpZWQgdG8gdGhlIGhvc3QgZWxlbWVudCB0aGV5IHdpbGwgdGhlbiBiZSB1cGRhdGVkXG4gKiB3aXRoIHJlc3BlY3QgdG8gYW55IHN0eWxlcy9jbGFzc2VzIHNldCB3aXRoIGBlbGVtZW50SG9zdFN0eWxlUHJvcGAgb3JcbiAqIGBlbGVtZW50SG9zdENsYXNzUHJvcGAuIElmIGFueSBzdHlsZXMgb3IgY2xhc3NlcyBhcmUgc2V0IHRvIGZhbHN5IHRoZW4gdGhleVxuICogd2lsbCBiZSByZW1vdmVkIGZyb20gdGhlIGVsZW1lbnQuXG4gKlxuICogTm90ZSB0aGF0IHRoZSBzdHlsaW5nIGluc3RydWN0aW9uIHdpbGwgbm90IGJlIGFwcGxpZWQgdW50aWxcbiAqIGBlbGVtZW50SG9zdFN0eWxpbmdBcHBseWAgaXMgY2FsbGVkLlxuICpcbiAqIEBwYXJhbSBjbGFzc2VzIEEga2V5L3ZhbHVlIG1hcCBvciBzdHJpbmcgb2YgQ1NTIGNsYXNzZXMgdGhhdCB3aWxsIGJlIGFkZGVkIHRvIHRoZVxuICogICAgICAgIGdpdmVuIGVsZW1lbnQuIEFueSBtaXNzaW5nIGNsYXNzZXMgKHRoYXQgaGF2ZSBhbHJlYWR5IGJlZW4gYXBwbGllZCB0byB0aGUgZWxlbWVudFxuICogICAgICAgIGJlZm9yZWhhbmQpIHdpbGwgYmUgcmVtb3ZlZCAodW5zZXQpIGZyb20gdGhlIGVsZW1lbnQncyBsaXN0IG9mIENTUyBjbGFzc2VzLlxuICogQHBhcmFtIHN0eWxlcyBBIGtleS92YWx1ZSBzdHlsZSBtYXAgb2YgdGhlIHN0eWxlcyB0aGF0IHdpbGwgYmUgYXBwbGllZCB0byB0aGUgZ2l2ZW4gZWxlbWVudC5cbiAqICAgICAgICBBbnkgbWlzc2luZyBzdHlsZXMgKHRoYXQgaGF2ZSBhbHJlYWR5IGJlZW4gYXBwbGllZCB0byB0aGUgZWxlbWVudCBiZWZvcmVoYW5kKSB3aWxsIGJlXG4gKiAgICAgICAgcmVtb3ZlZCAodW5zZXQpIGZyb20gdGhlIGVsZW1lbnQncyBzdHlsaW5nLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIM6UZWxlbWVudEhvc3RTdHlsaW5nTWFwKFxuICAgIGNsYXNzZXM6IHtba2V5OiBzdHJpbmddOiBhbnl9IHwgc3RyaW5nIHwgTk9fQ0hBTkdFIHwgbnVsbCxcbiAgICBzdHlsZXM/OiB7W3N0eWxlTmFtZTogc3RyaW5nXTogYW55fSB8IE5PX0NIQU5HRSB8IG51bGwpOiB2b2lkIHtcbiAgY29uc3QgZGlyZWN0aXZlU3R5bGluZ0luZGV4ID0gZ2V0QWN0aXZlRGlyZWN0aXZlU3R5bGluZ0luZGV4KCk7XG4gIGNvbnN0IGhvc3RFbGVtZW50SW5kZXggPSBnZXRTZWxlY3RlZEluZGV4KCk7XG5cbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCBzdHlsaW5nQ29udGV4dCA9IGdldFN0eWxpbmdDb250ZXh0KGhvc3RFbGVtZW50SW5kZXggKyBIRUFERVJfT0ZGU0VULCBsVmlldyk7XG5cbiAgY29uc3QgYXJnczogUGFyYW1zT2Y8dHlwZW9mIHVwZGF0ZVN0eWxpbmdNYXA+ID1cbiAgICAgIFtzdHlsaW5nQ29udGV4dCwgY2xhc3Nlcywgc3R5bGVzLCBkaXJlY3RpdmVTdHlsaW5nSW5kZXhdO1xuICBlbnF1ZXVlSG9zdEluc3RydWN0aW9uKHN0eWxpbmdDb250ZXh0LCBkaXJlY3RpdmVTdHlsaW5nSW5kZXgsIHVwZGF0ZVN0eWxpbmdNYXAsIGFyZ3MpO1xufVxuXG5cbi8qKlxuICogQXBwbHkgYWxsIHN0eWxlIGFuZCBjbGFzcyBiaW5kaW5nIHZhbHVlcyB0byB0aGUgZWxlbWVudC5cbiAqXG4gKiBUaGlzIGluc3RydWN0aW9uIGlzIG1lYW50IHRvIGJlIHJ1biBhZnRlciBgZWxlbWVudFN0eWxpbmdNYXBgLCBgZWxlbWVudFN0eWxlUHJvcGBcbiAqIG9yIGBlbGVtZW50Q2xhc3NQcm9wYCBpbnN0cnVjdGlvbnMgaGF2ZSBiZWVuIHJ1biBhbmQgd2lsbCBvbmx5IGFwcGx5IHN0eWxpbmcgdG9cbiAqIHRoZSBlbGVtZW50IGlmIGFueSBzdHlsaW5nIGJpbmRpbmdzIGhhdmUgYmVlbiB1cGRhdGVkLlxuICpcbiAqIEBwYXJhbSBpbmRleCBJbmRleCBvZiB0aGUgZWxlbWVudCdzIHdpdGggd2hpY2ggc3R5bGluZyBpcyBhc3NvY2lhdGVkLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIM6UZWxlbWVudFN0eWxpbmdBcHBseShpbmRleDogbnVtYmVyKTogdm9pZCB7XG4gIGVsZW1lbnRTdHlsaW5nQXBwbHlJbnRlcm5hbChERUZBVUxUX1RFTVBMQVRFX0RJUkVDVElWRV9JTkRFWCwgaW5kZXgpO1xufVxuXG4vKipcbiAqIEFwcGx5IGFsbCBzdHlsZSBhbmQgY2xhc3MgaG9zdCBiaW5kaW5nIHZhbHVlcyB0byB0aGUgZWxlbWVudC5cbiAqXG4gKiBUaGlzIGluc3RydWN0aW9uIGlzIG1lYW50IHRvIGJlIHJ1biBhZnRlciBgZWxlbWVudEhvc3RTdHlsaW5nTWFwYCxcbiAqIGBlbGVtZW50SG9zdFN0eWxlUHJvcGAgb3IgYGVsZW1lbnRIb3N0Q2xhc3NQcm9wYCBpbnN0cnVjdGlvbnMgaGF2ZVxuICogYmVlbiBydW4gYW5kIHdpbGwgb25seSBhcHBseSBzdHlsaW5nIHRvIHRoZSBob3N0IGVsZW1lbnQgaWYgYW55XG4gKiBzdHlsaW5nIGJpbmRpbmdzIGhhdmUgYmVlbiB1cGRhdGVkLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIM6UZWxlbWVudEhvc3RTdHlsaW5nQXBwbHkoKTogdm9pZCB7XG4gIGVsZW1lbnRTdHlsaW5nQXBwbHlJbnRlcm5hbChnZXRBY3RpdmVEaXJlY3RpdmVTdHlsaW5nSW5kZXgoKSwgZ2V0U2VsZWN0ZWRJbmRleCgpKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGVsZW1lbnRTdHlsaW5nQXBwbHlJbnRlcm5hbChkaXJlY3RpdmVTdHlsaW5nSW5kZXg6IG51bWJlciwgaW5kZXg6IG51bWJlcik6IHZvaWQge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IHROb2RlID0gZ2V0VE5vZGUoaW5kZXgsIGxWaWV3KTtcblxuICAvLyBpZiBhIG5vbi1lbGVtZW50IHZhbHVlIGlzIGJlaW5nIHByb2Nlc3NlZCB0aGVuIHdlIGNhbid0IHJlbmRlciB2YWx1ZXNcbiAgLy8gb24gdGhlIGVsZW1lbnQgYXQgYWxsIHRoZXJlZm9yZSBieSBzZXR0aW5nIHRoZSByZW5kZXJlciB0byBudWxsIHRoZW5cbiAgLy8gdGhlIHN0eWxpbmcgYXBwbHkgY29kZSBrbm93cyBub3QgdG8gYWN0dWFsbHkgYXBwbHkgdGhlIHZhbHVlcy4uLlxuICBjb25zdCByZW5kZXJlciA9IHROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5FbGVtZW50ID8gbFZpZXdbUkVOREVSRVJdIDogbnVsbDtcbiAgY29uc3QgaXNGaXJzdFJlbmRlciA9IChsVmlld1tGTEFHU10gJiBMVmlld0ZsYWdzLkZpcnN0TFZpZXdQYXNzKSAhPT0gMDtcbiAgY29uc3Qgc3R5bGluZ0NvbnRleHQgPSBnZXRTdHlsaW5nQ29udGV4dChpbmRleCArIEhFQURFUl9PRkZTRVQsIGxWaWV3KTtcbiAgY29uc3QgdG90YWxQbGF5ZXJzUXVldWVkID0gcmVuZGVyU3R5bGluZyhcbiAgICAgIHN0eWxpbmdDb250ZXh0LCByZW5kZXJlciwgbFZpZXcsIGlzRmlyc3RSZW5kZXIsIG51bGwsIG51bGwsIGRpcmVjdGl2ZVN0eWxpbmdJbmRleCk7XG4gIGlmICh0b3RhbFBsYXllcnNRdWV1ZWQgPiAwKSB7XG4gICAgY29uc3Qgcm9vdENvbnRleHQgPSBnZXRSb290Q29udGV4dChsVmlldyk7XG4gICAgc2NoZWR1bGVUaWNrKHJvb3RDb250ZXh0LCBSb290Q29udGV4dEZsYWdzLkZsdXNoUGxheWVycyk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEFjdGl2ZURpcmVjdGl2ZVN0eWxpbmdJbmRleCgpIHtcbiAgLy8gd2hlbmV2ZXIgYSBkaXJlY3RpdmUncyBob3N0QmluZGluZ3MgZnVuY3Rpb24gaXMgY2FsbGVkIGEgdW5pcXVlSWQgdmFsdWVcbiAgLy8gaXMgYXNzaWduZWQuIE5vcm1hbGx5IHRoaXMgaXMgZW5vdWdoIHRvIGhlbHAgZGlzdGluZ3Vpc2ggb25lIGRpcmVjdGl2ZVxuICAvLyBmcm9tIGFub3RoZXIgZm9yIHRoZSBzdHlsaW5nIGNvbnRleHQsIGJ1dCB0aGVyZSBhcmUgc2l0dWF0aW9ucyB3aGVyZSBhXG4gIC8vIHN1Yi1jbGFzcyBkaXJlY3RpdmUgY291bGQgaW5oZXJpdCBhbmQgYXNzaWduIHN0eWxpbmcgaW4gY29uY2VydCB3aXRoIGFcbiAgLy8gcGFyZW50IGRpcmVjdGl2ZS4gVG8gaGVscCB0aGUgc3R5bGluZyBjb2RlIGRpc3Rpbmd1aXNoIGJldHdlZW4gYSBwYXJlbnRcbiAgLy8gc3ViLWNsYXNzZWQgZGlyZWN0aXZlIHRoZSBpbmhlcml0YW5jZSBkZXB0aCBpcyB0YWtlbiBpbnRvIGFjY291bnQgYXMgd2VsbC5cbiAgcmV0dXJuIGdldEFjdGl2ZURpcmVjdGl2ZUlkKCkgKyBnZXRBY3RpdmVEaXJlY3RpdmVTdXBlckNsYXNzRGVwdGgoKTtcbn1cbiJdfQ==