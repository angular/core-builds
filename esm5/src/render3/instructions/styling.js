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
export function elementStyling(classBindingNames, styleBindingNames, styleSanitizer) {
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
export function elementHostStyling(classBindingNames, styleBindingNames, styleSanitizer) {
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
export function elementStyleProp(index, styleIndex, value, suffix, forceOverride) {
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
export function elementHostStyleProp(styleIndex, value, suffix, forceOverride) {
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
export function elementClassProp(index, classIndex, value, forceOverride) {
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
export function elementHostClassProp(classIndex, value, forceOverride) {
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
export function elementStylingMap(index, classes, styles) {
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
export function elementHostStylingMap(classes, styles) {
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
export function elementStylingApply(index) {
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
export function elementHostStylingApply() {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3R5bGluZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaW5zdHJ1Y3Rpb25zL3N0eWxpbmcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBVUEsT0FBTyxFQUFDLEtBQUssRUFBRSxhQUFhLEVBQWMsUUFBUSxFQUFtQixNQUFNLG9CQUFvQixDQUFDO0FBQ2hHLE9BQU8sRUFBQyxvQkFBb0IsRUFBRSxpQ0FBaUMsRUFBRSxRQUFRLEVBQUUsd0JBQXdCLEVBQUUsZ0JBQWdCLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDdkksT0FBTyxFQUFDLHdCQUF3QixFQUFFLGFBQWEsRUFBRSxlQUFlLElBQUksc0JBQXNCLEVBQUUseUJBQXlCLEVBQUUsZUFBZSxJQUFJLHNCQUFzQixFQUFFLGdCQUFnQixFQUFDLE1BQU0scUNBQXFDLENBQUM7QUFDL04sT0FBTyxFQUFXLHNCQUFzQixFQUFFLHFCQUFxQixFQUFDLE1BQU0sb0NBQW9DLENBQUM7QUFDM0csT0FBTyxFQUFDLGtCQUFrQixFQUFDLE1BQU0sMkJBQTJCLENBQUM7QUFDN0QsT0FBTyxFQUFDLGdDQUFnQyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDbkUsT0FBTyxFQUFDLG9DQUFvQyxFQUFFLHlCQUF5QixFQUFFLG9CQUFvQixFQUFFLG1CQUFtQixFQUFFLGlCQUFpQixFQUFFLGFBQWEsRUFBRSxhQUFhLEVBQUMsTUFBTSxpQkFBaUIsQ0FBQztBQUM1TCxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sV0FBVyxDQUFDO0FBQ3BDLE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUNuRCxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sOEJBQThCLENBQUM7QUFDNUQsT0FBTyxFQUFDLFFBQVEsRUFBQyxNQUFNLG9CQUFvQixDQUFDO0FBRTVDLE9BQU8sRUFBQyxZQUFZLEVBQUUs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LENBQUMseUJBQTRCLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDdkUsSUFBTSxjQUFjLEdBQUcsaUJBQWlCLENBQUMsS0FBSyxHQUFHLGFBQWEsRUFBRSxLQUFLLENBQUMsQ0FBQztJQUN2RSxJQUFNLGtCQUFrQixHQUFHLGFBQWEsQ0FDcEMsY0FBYyxFQUFFLFFBQVEsRUFBRSxLQUFLLEVBQUUsYUFBYSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUscUJBQXFCLENBQUMsQ0FBQztJQUN2RixJQUFJLGtCQUFrQixHQUFHLENBQUMsRUFBRTtRQUMxQixJQUFNLFdBQVcsR0FBRyxjQUFjLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDMUMsWUFBWSxDQUFDLFdBQVcsdUJBQWdDLENBQUM7S0FDMUQ7QUFDSCxDQUFDO0FBRUQsTUFBTSxVQUFVLDhCQUE4QjtJQUM1QywwRUFBMEU7SUFDMUUseUVBQXlFO0lBQ3pFLHlFQUF5RTtJQUN6RSx5RUFBeUU7SUFDekUsMEVBQTBFO0lBQzFFLDZFQUE2RTtJQUM3RSxPQUFPLG9CQUFvQixFQUFFLEdBQUcsaUNBQWlDLEVBQUUsQ0FBQztBQUN0RSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0IHtTdHlsZVNhbml0aXplRm59IGZyb20gJy4uLy4uL3Nhbml0aXphdGlvbi9zdHlsZV9zYW5pdGl6ZXInO1xuaW1wb3J0IHtUTm9kZSwgVE5vZGVUeXBlfSBmcm9tICcuLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtQbGF5ZXJGYWN0b3J5fSBmcm9tICcuLi9pbnRlcmZhY2VzL3BsYXllcic7XG5pbXBvcnQge0ZMQUdTLCBIRUFERVJfT0ZGU0VULCBMVmlld0ZsYWdzLCBSRU5ERVJFUiwgUm9vdENvbnRleHRGbGFnc30gZnJvbSAnLi4vaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7Z2V0QWN0aXZlRGlyZWN0aXZlSWQsIGdldEFjdGl2ZURpcmVjdGl2ZVN1cGVyQ2xhc3NEZXB0aCwgZ2V0TFZpZXcsIGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSwgZ2V0U2VsZWN0ZWRJbmRleH0gZnJvbSAnLi4vc3RhdGUnO1xuaW1wb3J0IHtnZXRJbml0aWFsQ2xhc3NOYW1lVmFsdWUsIHJlbmRlclN0eWxpbmcsIHVwZGF0ZUNsYXNzUHJvcCBhcyB1cGRhdGVFbGVtZW50Q2xhc3NQcm9wLCB1cGRhdGVDb250ZXh0V2l0aEJpbmRpbmdzLCB1cGRhdGVTdHlsZVByb3AgYXMgdXBkYXRlRWxlbWVudFN0eWxlUHJvcCwgdXBkYXRlU3R5bGluZ01hcH0gZnJvbSAnLi4vc3R5bGluZy9jbGFzc19hbmRfc3R5bGVfYmluZGluZ3MnO1xuaW1wb3J0IHtQYXJhbXNPZiwgZW5xdWV1ZUhvc3RJbnN0cnVjdGlvbiwgcmVnaXN0ZXJIb3N0RGlyZWN0aXZlfSBmcm9tICcuLi9zdHlsaW5nL2hvc3RfaW5zdHJ1Y3Rpb25zX3F1ZXVlJztcbmltcG9ydCB7Qm91bmRQbGF5ZXJGYWN0b3J5fSBmcm9tICcuLi9zdHlsaW5nL3BsYXllcl9mYWN0b3J5JztcbmltcG9ydCB7REVGQVVMVF9URU1QTEFURV9ESVJFQ1RJVkVfSU5ERVh9IGZyb20gJy4uL3N0eWxpbmcvc2hhcmVkJztcbmltcG9ydCB7YWxsb2NhdGVPclVwZGF0ZURpcmVjdGl2ZUludG9Db250ZXh0LCBjcmVhdGVFbXB0eVN0eWxpbmdDb250ZXh0LCBmb3JjZUNsYXNzZXNBc1N0cmluZywgZm9yY2VTdHlsZXNBc1N0cmluZywgZ2V0U3R5bGluZ0NvbnRleHQsIGhhc0NsYXNzSW5wdXQsIGhhc1N0eWxlSW5wdXR9IGZyb20gJy4uL3N0eWxpbmcvdXRpbCc7XG5pbXBvcnQge05PX0NIQU5HRX0gZnJvbSAnLi4vdG9rZW5zJztcbmltcG9ydCB7cmVuZGVyU3RyaW5naWZ5fSBmcm9tICcuLi91dGlsL21pc2NfdXRpbHMnO1xuaW1wb3J0IHtnZXRSb290Q29udGV4dH0gZnJvbSAnLi4vdXRpbC92aWV3X3RyYXZlcnNhbF91dGlscyc7XG5pbXBvcnQge2dldFROb2RlfSBmcm9tICcuLi91dGlsL3ZpZXdfdXRpbHMnO1xuXG5pbXBvcnQge3NjaGVkdWxlVGljaywgc2V0SW5wdXRzRm9yUHJvcGVydHl9IGZyb20gJy4vc2hhcmVkJztcblxuXG5cbi8qXG4gKiBUaGUgY29udGVudHMgb2YgdGhpcyBmaWxlIGluY2x1ZGUgdGhlIGluc3RydWN0aW9ucyBmb3IgYWxsIHN0eWxpbmctcmVsYXRlZFxuICogb3BlcmF0aW9ucyBpbiBBbmd1bGFyLlxuICpcbiAqIFRoZSBpbnN0cnVjdGlvbnMgcHJlc2VudCBpbiB0aGlzIGZpbGUgYXJlOlxuICpcbiAqIFRlbXBsYXRlIGxldmVsIHN0eWxpbmcgaW5zdHJ1Y3Rpb25zOlxuICogLSBlbGVtZW50U3R5bGluZ1xuICogLSBlbGVtZW50U3R5bGluZ01hcFxuICogLSBlbGVtZW50U3R5bGVQcm9wXG4gKiAtIGVsZW1lbnRDbGFzc1Byb3BcbiAqIC0gZWxlbWVudFN0eWxpbmdBcHBseVxuICpcbiAqIEhvc3QgYmluZGluZ3MgbGV2ZWwgc3R5bGluZyBpbnN0cnVjdGlvbnM6XG4gKiAtIGVsZW1lbnRIb3N0U3R5bGluZ1xuICogLSBlbGVtZW50SG9zdFN0eWxpbmdNYXBcbiAqIC0gZWxlbWVudEhvc3RTdHlsZVByb3BcbiAqIC0gZWxlbWVudEhvc3RDbGFzc1Byb3BcbiAqIC0gZWxlbWVudEhvc3RTdHlsaW5nQXBwbHlcbiAqL1xuXG4vKipcbiAqIEFsbG9jYXRlcyBzdHlsZSBhbmQgY2xhc3MgYmluZGluZyBwcm9wZXJ0aWVzIG9uIHRoZSBlbGVtZW50IGR1cmluZyBjcmVhdGlvbiBtb2RlLlxuICpcbiAqIFRoaXMgaW5zdHJ1Y3Rpb24gaXMgbWVhbnQgdG8gYmUgY2FsbGVkIGR1cmluZyBjcmVhdGlvbiBtb2RlIHRvIHJlZ2lzdGVyIGFsbFxuICogZHluYW1pYyBzdHlsZSBhbmQgY2xhc3MgYmluZGluZ3Mgb24gdGhlIGVsZW1lbnQuIE5vdGUgdGhhdCB0aGlzIGlzIG9ubHkgdXNlZFxuICogZm9yIGJpbmRpbmcgdmFsdWVzIChzZWUgYGVsZW1lbnRTdGFydGAgdG8gbGVhcm4gaG93IHRvIGFzc2lnbiBzdGF0aWMgc3R5bGluZ1xuICogdmFsdWVzIHRvIGFuIGVsZW1lbnQpLlxuICpcbiAqIEBwYXJhbSBjbGFzc0JpbmRpbmdOYW1lcyBBbiBhcnJheSBjb250YWluaW5nIGJpbmRhYmxlIGNsYXNzIG5hbWVzLlxuICogICAgICAgIFRoZSBgZWxlbWVudENsYXNzUHJvcGAgaW5zdHJ1Y3Rpb24gcmVmZXJzIHRvIHRoZSBjbGFzcyBuYW1lIGJ5IGluZGV4IGluXG4gKiAgICAgICAgdGhpcyBhcnJheSAoaS5lLiBgWydmb28nLCAnYmFyJ11gIG1lYW5zIGBmb289MGAgYW5kIGBiYXI9MWApLlxuICogQHBhcmFtIHN0eWxlQmluZGluZ05hbWVzIEFuIGFycmF5IGNvbnRhaW5pbmcgYmluZGFibGUgc3R5bGUgcHJvcGVydGllcy5cbiAqICAgICAgICBUaGUgYGVsZW1lbnRTdHlsZVByb3BgIGluc3RydWN0aW9uIHJlZmVycyB0byB0aGUgY2xhc3MgbmFtZSBieSBpbmRleCBpblxuICogICAgICAgIHRoaXMgYXJyYXkgKGkuZS4gYFsnd2lkdGgnLCAnaGVpZ2h0J11gIG1lYW5zIGB3aWR0aD0wYCBhbmQgYGhlaWdodD0xYCkuXG4gKiBAcGFyYW0gc3R5bGVTYW5pdGl6ZXIgQW4gb3B0aW9uYWwgc2FuaXRpemVyIGZ1bmN0aW9uIHRoYXQgd2lsbCBiZSB1c2VkIHRvIHNhbml0aXplIGFueSBDU1NcbiAqICAgICAgICBzdHlsZSB2YWx1ZXMgdGhhdCBhcmUgYXBwbGllZCB0byB0aGUgZWxlbWVudCAoZHVyaW5nIHJlbmRlcmluZykuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gZWxlbWVudFN0eWxpbmcoXG4gICAgY2xhc3NCaW5kaW5nTmFtZXM/OiBzdHJpbmdbXSB8IG51bGwsIHN0eWxlQmluZGluZ05hbWVzPzogc3RyaW5nW10gfCBudWxsLFxuICAgIHN0eWxlU2FuaXRpemVyPzogU3R5bGVTYW5pdGl6ZUZuIHwgbnVsbCk6IHZvaWQge1xuICBjb25zdCB0Tm9kZSA9IGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSgpO1xuICBpZiAoIXROb2RlLnN0eWxpbmdUZW1wbGF0ZSkge1xuICAgIHROb2RlLnN0eWxpbmdUZW1wbGF0ZSA9IGNyZWF0ZUVtcHR5U3R5bGluZ0NvbnRleHQoKTtcbiAgfVxuXG4gIC8vIGNhbGxpbmcgdGhlIGZ1bmN0aW9uIGJlbG93IGVuc3VyZXMgdGhhdCB0aGUgdGVtcGxhdGUncyBiaW5kaW5nIHZhbHVlc1xuICAvLyBhcmUgYXBwbGllZCBhcyB0aGUgZmlyc3Qgc2V0IG9mIGJpbmRpbmdzIGludG8gdGhlIGNvbnRleHQuIElmIGFueSBvdGhlclxuICAvLyBzdHlsaW5nIGJpbmRpbmdzIGFyZSBzZXQgb24gdGhlIHNhbWUgZWxlbWVudCAoYnkgZGlyZWN0aXZlcyBhbmQvb3JcbiAgLy8gY29tcG9uZW50cykgdGhlbiB0aGV5IHdpbGwgYmUgYXBwbGllZCBhdCB0aGUgZW5kIG9mIHRoZSBgZWxlbWVudEVuZGBcbiAgLy8gaW5zdHJ1Y3Rpb24gKGJlY2F1c2UgZGlyZWN0aXZlcyBhcmUgY3JlYXRlZCBmaXJzdCBiZWZvcmUgc3R5bGluZyBpc1xuICAvLyBleGVjdXRlZCBmb3IgYSBuZXcgZWxlbWVudCkuXG4gIGluaXRFbGVtZW50U3R5bGluZyhcbiAgICAgIHROb2RlLCBjbGFzc0JpbmRpbmdOYW1lcywgc3R5bGVCaW5kaW5nTmFtZXMsIHN0eWxlU2FuaXRpemVyLFxuICAgICAgREVGQVVMVF9URU1QTEFURV9ESVJFQ1RJVkVfSU5ERVgpO1xufVxuXG4vKipcbiAqIEFsbG9jYXRlcyBzdHlsZSBhbmQgY2xhc3MgYmluZGluZyBwcm9wZXJ0aWVzIG9uIHRoZSBob3N0IGVsZW1lbnQgZHVyaW5nIGNyZWF0aW9uIG1vZGVcbiAqIHdpdGhpbiB0aGUgaG9zdCBiaW5kaW5ncyBmdW5jdGlvbiBvZiBhIGRpcmVjdGl2ZSBvciBjb21wb25lbnQuXG4gKlxuICogVGhpcyBpbnN0cnVjdGlvbiBpcyBtZWFudCB0byBiZSBjYWxsZWQgZHVyaW5nIGNyZWF0aW9uIG1vZGUgdG8gcmVnaXN0ZXIgYWxsXG4gKiBkeW5hbWljIHN0eWxlIGFuZCBjbGFzcyBob3N0IGJpbmRpbmdzIG9uIHRoZSBob3N0IGVsZW1lbnQgb2YgYSBkaXJlY3RpdmUgb3JcbiAqIGNvbXBvbmVudC4gTm90ZSB0aGF0IHRoaXMgaXMgb25seSB1c2VkIGZvciBiaW5kaW5nIHZhbHVlcyAoc2VlIGBlbGVtZW50SG9zdEF0dHJzYFxuICogdG8gbGVhcm4gaG93IHRvIGFzc2lnbiBzdGF0aWMgc3R5bGluZyB2YWx1ZXMgdG8gdGhlIGhvc3QgZWxlbWVudCkuXG4gKlxuICogQHBhcmFtIGNsYXNzQmluZGluZ05hbWVzIEFuIGFycmF5IGNvbnRhaW5pbmcgYmluZGFibGUgY2xhc3MgbmFtZXMuXG4gKiAgICAgICAgVGhlIGBlbGVtZW50SG9zdENsYXNzUHJvcGAgaW5zdHJ1Y3Rpb24gcmVmZXJzIHRvIHRoZSBjbGFzcyBuYW1lIGJ5IGluZGV4IGluXG4gKiAgICAgICAgdGhpcyBhcnJheSAoaS5lLiBgWydmb28nLCAnYmFyJ11gIG1lYW5zIGBmb289MGAgYW5kIGBiYXI9MWApLlxuICogQHBhcmFtIHN0eWxlQmluZGluZ05hbWVzIEFuIGFycmF5IGNvbnRhaW5pbmcgYmluZGFibGUgc3R5bGUgcHJvcGVydGllcy5cbiAqICAgICAgICBUaGUgYGVsZW1lbnRIb3N0U3R5bGVQcm9wYCBpbnN0cnVjdGlvbiByZWZlcnMgdG8gdGhlIGNsYXNzIG5hbWUgYnkgaW5kZXggaW5cbiAqICAgICAgICB0aGlzIGFycmF5IChpLmUuIGBbJ3dpZHRoJywgJ2hlaWdodCddYCBtZWFucyBgd2lkdGg9MGAgYW5kIGBoZWlnaHQ9MWApLlxuICogQHBhcmFtIHN0eWxlU2FuaXRpemVyIEFuIG9wdGlvbmFsIHNhbml0aXplciBmdW5jdGlvbiB0aGF0IHdpbGwgYmUgdXNlZCB0byBzYW5pdGl6ZSBhbnkgQ1NTXG4gKiAgICAgICAgc3R5bGUgdmFsdWVzIHRoYXQgYXJlIGFwcGxpZWQgdG8gdGhlIGVsZW1lbnQgKGR1cmluZyByZW5kZXJpbmcpLlxuICogICAgICAgIE5vdGUgdGhhdCB0aGUgc2FuaXRpemVyIGluc3RhbmNlIGl0c2VsZiBpcyB0aWVkIHRvIHRoZSBwcm92aWRlZCBgZGlyZWN0aXZlYCBhbmRcbiAqICAgICAgICB3aWxsIG5vdCBiZSB1c2VkIGlmIHRoZSBzYW1lIHByb3BlcnR5IGlzIGFzc2lnbmVkIGluIGFub3RoZXIgZGlyZWN0aXZlIG9yXG4gKiAgICAgICAgb24gdGhlIGVsZW1lbnQgZGlyZWN0bHkuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gZWxlbWVudEhvc3RTdHlsaW5nKFxuICAgIGNsYXNzQmluZGluZ05hbWVzPzogc3RyaW5nW10gfCBudWxsLCBzdHlsZUJpbmRpbmdOYW1lcz86IHN0cmluZ1tdIHwgbnVsbCxcbiAgICBzdHlsZVNhbml0aXplcj86IFN0eWxlU2FuaXRpemVGbiB8IG51bGwpOiB2b2lkIHtcbiAgY29uc3QgdE5vZGUgPSBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKTtcbiAgaWYgKCF0Tm9kZS5zdHlsaW5nVGVtcGxhdGUpIHtcbiAgICB0Tm9kZS5zdHlsaW5nVGVtcGxhdGUgPSBjcmVhdGVFbXB0eVN0eWxpbmdDb250ZXh0KCk7XG4gIH1cblxuICBjb25zdCBkaXJlY3RpdmVTdHlsaW5nSW5kZXggPSBnZXRBY3RpdmVEaXJlY3RpdmVTdHlsaW5nSW5kZXgoKTtcblxuICAvLyBkZXNwaXRlIHRoZSBiaW5kaW5nIGJlaW5nIGFwcGxpZWQgaW4gYSBxdWV1ZSAoYmVsb3cpLCB0aGUgYWxsb2NhdGlvblxuICAvLyBvZiB0aGUgZGlyZWN0aXZlIGludG8gdGhlIGNvbnRleHQgaGFwcGVucyByaWdodCBhd2F5LiBUaGUgcmVhc29uIGZvclxuICAvLyB0aGlzIGlzIHRvIHJldGFpbiB0aGUgb3JkZXJpbmcgb2YgdGhlIGRpcmVjdGl2ZXMgKHdoaWNoIGlzIGltcG9ydGFudFxuICAvLyBmb3IgdGhlIHByaW9yaXRpemF0aW9uIG9mIGJpbmRpbmdzKS5cbiAgYWxsb2NhdGVPclVwZGF0ZURpcmVjdGl2ZUludG9Db250ZXh0KHROb2RlLnN0eWxpbmdUZW1wbGF0ZSwgZGlyZWN0aXZlU3R5bGluZ0luZGV4KTtcblxuICBjb25zdCBmbnMgPSB0Tm9kZS5vbkVsZW1lbnRDcmVhdGlvbkZucyA9IHROb2RlLm9uRWxlbWVudENyZWF0aW9uRm5zIHx8IFtdO1xuICBmbnMucHVzaCgoKSA9PiB7XG4gICAgaW5pdEVsZW1lbnRTdHlsaW5nKFxuICAgICAgICB0Tm9kZSwgY2xhc3NCaW5kaW5nTmFtZXMsIHN0eWxlQmluZGluZ05hbWVzLCBzdHlsZVNhbml0aXplciwgZGlyZWN0aXZlU3R5bGluZ0luZGV4KTtcbiAgICByZWdpc3Rlckhvc3REaXJlY3RpdmUodE5vZGUuc3R5bGluZ1RlbXBsYXRlICEsIGRpcmVjdGl2ZVN0eWxpbmdJbmRleCk7XG4gIH0pO1xufVxuXG5mdW5jdGlvbiBpbml0RWxlbWVudFN0eWxpbmcoXG4gICAgdE5vZGU6IFROb2RlLCBjbGFzc0JpbmRpbmdOYW1lczogc3RyaW5nW10gfCBudWxsIHwgdW5kZWZpbmVkLFxuICAgIHN0eWxlQmluZGluZ05hbWVzOiBzdHJpbmdbXSB8IG51bGwgfCB1bmRlZmluZWQsXG4gICAgc3R5bGVTYW5pdGl6ZXI6IFN0eWxlU2FuaXRpemVGbiB8IG51bGwgfCB1bmRlZmluZWQsIGRpcmVjdGl2ZVN0eWxpbmdJbmRleDogbnVtYmVyKTogdm9pZCB7XG4gIHVwZGF0ZUNvbnRleHRXaXRoQmluZGluZ3MoXG4gICAgICB0Tm9kZS5zdHlsaW5nVGVtcGxhdGUgISwgZGlyZWN0aXZlU3R5bGluZ0luZGV4LCBjbGFzc0JpbmRpbmdOYW1lcywgc3R5bGVCaW5kaW5nTmFtZXMsXG4gICAgICBzdHlsZVNhbml0aXplcik7XG59XG5cblxuLyoqXG4gKiBVcGRhdGUgYSBzdHlsZSBiaW5kaW5nIG9uIGFuIGVsZW1lbnQgd2l0aCB0aGUgcHJvdmlkZWQgdmFsdWUuXG4gKlxuICogSWYgdGhlIHN0eWxlIHZhbHVlIGlzIGZhbHN5IHRoZW4gaXQgd2lsbCBiZSByZW1vdmVkIGZyb20gdGhlIGVsZW1lbnRcbiAqIChvciBhc3NpZ25lZCBhIGRpZmZlcmVudCB2YWx1ZSBkZXBlbmRpbmcgaWYgdGhlcmUgYXJlIGFueSBzdHlsZXMgcGxhY2VkXG4gKiBvbiB0aGUgZWxlbWVudCB3aXRoIGBlbGVtZW50U3R5bGluZ01hcGAgb3IgYW55IHN0YXRpYyBzdHlsZXMgdGhhdCBhcmVcbiAqIHByZXNlbnQgZnJvbSB3aGVuIHRoZSBlbGVtZW50IHdhcyBjcmVhdGVkIHdpdGggYGVsZW1lbnRTdHlsaW5nYCkuXG4gKlxuICogTm90ZSB0aGF0IHRoZSBzdHlsaW5nIGVsZW1lbnQgaXMgdXBkYXRlZCBhcyBwYXJ0IG9mIGBlbGVtZW50U3R5bGluZ0FwcGx5YC5cbiAqXG4gKiBAcGFyYW0gaW5kZXggSW5kZXggb2YgdGhlIGVsZW1lbnQncyB3aXRoIHdoaWNoIHN0eWxpbmcgaXMgYXNzb2NpYXRlZC5cbiAqIEBwYXJhbSBzdHlsZUluZGV4IEluZGV4IG9mIHN0eWxlIHRvIHVwZGF0ZS4gVGhpcyBpbmRleCB2YWx1ZSByZWZlcnMgdG8gdGhlXG4gKiAgICAgICAgaW5kZXggb2YgdGhlIHN0eWxlIGluIHRoZSBzdHlsZSBiaW5kaW5ncyBhcnJheSB0aGF0IHdhcyBwYXNzZWQgaW50b1xuICogICAgICAgIGBlbGVtZW50U3R5bGluZ2AuXG4gKiBAcGFyYW0gdmFsdWUgTmV3IHZhbHVlIHRvIHdyaXRlIChmYWxzeSB0byByZW1vdmUpLiBOb3RlIHRoYXQgaWYgYSBkaXJlY3RpdmUgYWxzb1xuICogICAgICAgIGF0dGVtcHRzIHRvIHdyaXRlIHRvIHRoZSBzYW1lIGJpbmRpbmcgdmFsdWUgKHZpYSBgZWxlbWVudEhvc3RTdHlsZVByb3BgKVxuICogICAgICAgIHRoZW4gaXQgd2lsbCBvbmx5IGJlIGFibGUgdG8gZG8gc28gaWYgdGhlIGJpbmRpbmcgdmFsdWUgYXNzaWduZWQgdmlhXG4gKiAgICAgICAgYGVsZW1lbnRTdHlsZVByb3BgIGlzIGZhbHN5IChvciBkb2Vzbid0IGV4aXN0IGF0IGFsbCkuXG4gKiBAcGFyYW0gc3VmZml4IE9wdGlvbmFsIHN1ZmZpeC4gVXNlZCB3aXRoIHNjYWxhciB2YWx1ZXMgdG8gYWRkIHVuaXQgc3VjaCBhcyBgcHhgLlxuICogICAgICAgIE5vdGUgdGhhdCB3aGVuIGEgc3VmZml4IGlzIHByb3ZpZGVkIHRoZW4gdGhlIHVuZGVybHlpbmcgc2FuaXRpemVyIHdpbGxcbiAqICAgICAgICBiZSBpZ25vcmVkLlxuICogQHBhcmFtIGZvcmNlT3ZlcnJpZGUgV2hldGhlciBvciBub3QgdG8gdXBkYXRlIHRoZSBzdHlsaW5nIHZhbHVlIGltbWVkaWF0ZWx5XG4gKiAgICAgICAgKGRlc3BpdGUgdGhlIG90aGVyIGJpbmRpbmdzIHBvc3NpYmx5IGhhdmluZyBwcmlvcml0eSlcbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbGVtZW50U3R5bGVQcm9wKFxuICAgIGluZGV4OiBudW1iZXIsIHN0eWxlSW5kZXg6IG51bWJlciwgdmFsdWU6IHN0cmluZyB8IG51bWJlciB8IFN0cmluZyB8IFBsYXllckZhY3RvcnkgfCBudWxsLFxuICAgIHN1ZmZpeD86IHN0cmluZyB8IG51bGwsIGZvcmNlT3ZlcnJpZGU/OiBib29sZWFuKTogdm9pZCB7XG4gIGNvbnN0IHZhbHVlVG9BZGQgPSByZXNvbHZlU3R5bGVQcm9wVmFsdWUodmFsdWUsIHN1ZmZpeCk7XG4gIHVwZGF0ZUVsZW1lbnRTdHlsZVByb3AoXG4gICAgICBnZXRTdHlsaW5nQ29udGV4dChpbmRleCArIEhFQURFUl9PRkZTRVQsIGdldExWaWV3KCkpLCBzdHlsZUluZGV4LCB2YWx1ZVRvQWRkLFxuICAgICAgREVGQVVMVF9URU1QTEFURV9ESVJFQ1RJVkVfSU5ERVgsIGZvcmNlT3ZlcnJpZGUpO1xufVxuXG4vKipcbiAqIFVwZGF0ZSBhIGhvc3Qgc3R5bGUgYmluZGluZyB2YWx1ZSBvbiB0aGUgaG9zdCBlbGVtZW50IHdpdGhpbiBhIGNvbXBvbmVudC9kaXJlY3RpdmUuXG4gKlxuICogSWYgdGhlIHN0eWxlIHZhbHVlIGlzIGZhbHN5IHRoZW4gaXQgd2lsbCBiZSByZW1vdmVkIGZyb20gdGhlIGhvc3QgZWxlbWVudFxuICogKG9yIGFzc2lnbmVkIGEgZGlmZmVyZW50IHZhbHVlIGRlcGVuZGluZyBpZiB0aGVyZSBhcmUgYW55IHN0eWxlcyBwbGFjZWRcbiAqIG9uIHRoZSBzYW1lIGVsZW1lbnQgd2l0aCBgZWxlbWVudEhvc3RTdHlsaW5nTWFwYCBvciBhbnkgc3RhdGljIHN0eWxlcyB0aGF0XG4gKiBhcmUgcHJlc2VudCBmcm9tIHdoZW4gdGhlIGVsZW1lbnQgd2FzIHBhdGNoZWQgd2l0aCBgZWxlbWVudEhvc3RTdHlsaW5nYCkuXG4gKlxuICogTm90ZSB0aGF0IHRoZSBzdHlsaW5nIGFwcGxpZWQgdG8gdGhlIGhvc3QgZWxlbWVudCBvbmNlXG4gKiBgZWxlbWVudEhvc3RTdHlsaW5nQXBwbHlgIGlzIGNhbGxlZC5cbiAqXG4gKiBAcGFyYW0gc3R5bGVJbmRleCBJbmRleCBvZiBzdHlsZSB0byB1cGRhdGUuIFRoaXMgaW5kZXggdmFsdWUgcmVmZXJzIHRvIHRoZVxuICogICAgICAgIGluZGV4IG9mIHRoZSBzdHlsZSBpbiB0aGUgc3R5bGUgYmluZGluZ3MgYXJyYXkgdGhhdCB3YXMgcGFzc2VkIGludG9cbiAqICAgICAgICBgZWxlbWVudEhvc3RTdHlsaW5nYC5cbiAqIEBwYXJhbSB2YWx1ZSBOZXcgdmFsdWUgdG8gd3JpdGUgKGZhbHN5IHRvIHJlbW92ZSkuIFRoZSB2YWx1ZSBtYXkgb3IgbWF5IG5vdFxuICogICAgICAgIGJlIGFwcGxpZWQgdG8gdGhlIGVsZW1lbnQgZGVwZW5kaW5nIG9uIHRoZSB0ZW1wbGF0ZS9jb21wb25lbnQvZGlyZWN0aXZlXG4gKiAgICAgICAgcHJpb3JpdGl6YXRpb24gKHNlZSBgaW50ZXJmYWNlcy9zdHlsaW5nLnRzYClcbiAqIEBwYXJhbSBzdWZmaXggT3B0aW9uYWwgc3VmZml4LiBVc2VkIHdpdGggc2NhbGFyIHZhbHVlcyB0byBhZGQgdW5pdCBzdWNoIGFzIGBweGAuXG4gKiAgICAgICAgTm90ZSB0aGF0IHdoZW4gYSBzdWZmaXggaXMgcHJvdmlkZWQgdGhlbiB0aGUgdW5kZXJseWluZyBzYW5pdGl6ZXIgd2lsbFxuICogICAgICAgIGJlIGlnbm9yZWQuXG4gKiBAcGFyYW0gZm9yY2VPdmVycmlkZSBXaGV0aGVyIG9yIG5vdCB0byB1cGRhdGUgdGhlIHN0eWxpbmcgdmFsdWUgaW1tZWRpYXRlbHlcbiAqICAgICAgICAoZGVzcGl0ZSB0aGUgb3RoZXIgYmluZGluZ3MgcG9zc2libHkgaGF2aW5nIHByaW9yaXR5KVxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVsZW1lbnRIb3N0U3R5bGVQcm9wKFxuICAgIHN0eWxlSW5kZXg6IG51bWJlciwgdmFsdWU6IHN0cmluZyB8IG51bWJlciB8IFN0cmluZyB8IFBsYXllckZhY3RvcnkgfCBudWxsLFxuICAgIHN1ZmZpeD86IHN0cmluZyB8IG51bGwsIGZvcmNlT3ZlcnJpZGU/OiBib29sZWFuKTogdm9pZCB7XG4gIGNvbnN0IGRpcmVjdGl2ZVN0eWxpbmdJbmRleCA9IGdldEFjdGl2ZURpcmVjdGl2ZVN0eWxpbmdJbmRleCgpO1xuICBjb25zdCBob3N0RWxlbWVudEluZGV4ID0gZ2V0U2VsZWN0ZWRJbmRleCgpO1xuXG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3Qgc3R5bGluZ0NvbnRleHQgPSBnZXRTdHlsaW5nQ29udGV4dChob3N0RWxlbWVudEluZGV4ICsgSEVBREVSX09GRlNFVCwgbFZpZXcpO1xuXG4gIGNvbnN0IHZhbHVlVG9BZGQgPSByZXNvbHZlU3R5bGVQcm9wVmFsdWUodmFsdWUsIHN1ZmZpeCk7XG4gIGNvbnN0IGFyZ3M6IFBhcmFtc09mPHR5cGVvZiB1cGRhdGVFbGVtZW50U3R5bGVQcm9wPiA9XG4gICAgICBbc3R5bGluZ0NvbnRleHQsIHN0eWxlSW5kZXgsIHZhbHVlVG9BZGQsIGRpcmVjdGl2ZVN0eWxpbmdJbmRleCwgZm9yY2VPdmVycmlkZV07XG4gIGVucXVldWVIb3N0SW5zdHJ1Y3Rpb24oc3R5bGluZ0NvbnRleHQsIGRpcmVjdGl2ZVN0eWxpbmdJbmRleCwgdXBkYXRlRWxlbWVudFN0eWxlUHJvcCwgYXJncyk7XG59XG5cbmZ1bmN0aW9uIHJlc29sdmVTdHlsZVByb3BWYWx1ZShcbiAgICB2YWx1ZTogc3RyaW5nIHwgbnVtYmVyIHwgU3RyaW5nIHwgUGxheWVyRmFjdG9yeSB8IG51bGwsIHN1ZmZpeDogc3RyaW5nIHwgbnVsbCB8IHVuZGVmaW5lZCkge1xuICBsZXQgdmFsdWVUb0FkZDogc3RyaW5nfG51bGwgPSBudWxsO1xuICBpZiAodmFsdWUgIT09IG51bGwpIHtcbiAgICBpZiAoc3VmZml4KSB7XG4gICAgICAvLyB3aGVuIGEgc3VmZml4IGlzIGFwcGxpZWQgdGhlbiBpdCB3aWxsIGJ5cGFzc1xuICAgICAgLy8gc2FuaXRpemF0aW9uIGVudGlyZWx5IChiL2MgYSBuZXcgc3RyaW5nIGlzIGNyZWF0ZWQpXG4gICAgICB2YWx1ZVRvQWRkID0gcmVuZGVyU3RyaW5naWZ5KHZhbHVlKSArIHN1ZmZpeDtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gc2FuaXRpemF0aW9uIGhhcHBlbnMgYnkgZGVhbGluZyB3aXRoIGEgU3RyaW5nIHZhbHVlXG4gICAgICAvLyB0aGlzIG1lYW5zIHRoYXQgdGhlIHN0cmluZyB2YWx1ZSB3aWxsIGJlIHBhc3NlZCB0aHJvdWdoXG4gICAgICAvLyBpbnRvIHRoZSBzdHlsZSByZW5kZXJpbmcgbGF0ZXIgKHdoaWNoIGlzIHdoZXJlIHRoZSB2YWx1ZVxuICAgICAgLy8gd2lsbCBiZSBzYW5pdGl6ZWQgYmVmb3JlIGl0IGlzIGFwcGxpZWQpXG4gICAgICB2YWx1ZVRvQWRkID0gdmFsdWUgYXMgYW55IGFzIHN0cmluZztcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHZhbHVlVG9BZGQ7XG59XG5cblxuLyoqXG4gKiBVcGRhdGUgYSBjbGFzcyBiaW5kaW5nIG9uIGFuIGVsZW1lbnQgd2l0aCB0aGUgcHJvdmlkZWQgdmFsdWUuXG4gKlxuICogVGhpcyBpbnN0cnVjdGlvbiBpcyBtZWFudCB0byBoYW5kbGUgdGhlIGBbY2xhc3MuZm9vXT1cImV4cFwiYCBjYXNlIGFuZCxcbiAqIHRoZXJlZm9yZSwgdGhlIGNsYXNzIGJpbmRpbmcgaXRzZWxmIG11c3QgYWxyZWFkeSBiZSBhbGxvY2F0ZWQgdXNpbmdcbiAqIGBlbGVtZW50U3R5bGluZ2Agd2l0aGluIHRoZSBjcmVhdGlvbiBibG9jay5cbiAqXG4gKiBAcGFyYW0gaW5kZXggSW5kZXggb2YgdGhlIGVsZW1lbnQncyB3aXRoIHdoaWNoIHN0eWxpbmcgaXMgYXNzb2NpYXRlZC5cbiAqIEBwYXJhbSBjbGFzc0luZGV4IEluZGV4IG9mIGNsYXNzIHRvIHRvZ2dsZS4gVGhpcyBpbmRleCB2YWx1ZSByZWZlcnMgdG8gdGhlXG4gKiAgICAgICAgaW5kZXggb2YgdGhlIGNsYXNzIGluIHRoZSBjbGFzcyBiaW5kaW5ncyBhcnJheSB0aGF0IHdhcyBwYXNzZWQgaW50b1xuICogICAgICAgIGBlbGVtZW50U3R5bGluZ2AgKHdoaWNoIGlzIG1lYW50IHRvIGJlIGNhbGxlZCBiZWZvcmUgdGhpc1xuICogICAgICAgIGZ1bmN0aW9uIGlzKS5cbiAqIEBwYXJhbSB2YWx1ZSBBIHRydWUvZmFsc2UgdmFsdWUgd2hpY2ggd2lsbCB0dXJuIHRoZSBjbGFzcyBvbiBvciBvZmYuXG4gKiBAcGFyYW0gZm9yY2VPdmVycmlkZSBXaGV0aGVyIG9yIG5vdCB0aGlzIHZhbHVlIHdpbGwgYmUgYXBwbGllZCByZWdhcmRsZXNzXG4gKiAgICAgICAgb2Ygd2hlcmUgaXQgaXMgYmVpbmcgc2V0IHdpdGhpbiB0aGUgc3R5bGluZyBwcmlvcml0eSBzdHJ1Y3R1cmUuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gZWxlbWVudENsYXNzUHJvcChcbiAgICBpbmRleDogbnVtYmVyLCBjbGFzc0luZGV4OiBudW1iZXIsIHZhbHVlOiBib29sZWFuIHwgUGxheWVyRmFjdG9yeSxcbiAgICBmb3JjZU92ZXJyaWRlPzogYm9vbGVhbik6IHZvaWQge1xuICBjb25zdCBpbnB1dCA9ICh2YWx1ZSBpbnN0YW5jZW9mIEJvdW5kUGxheWVyRmFjdG9yeSkgP1xuICAgICAgKHZhbHVlIGFzIEJvdW5kUGxheWVyRmFjdG9yeTxib29sZWFufG51bGw+KSA6XG4gICAgICBib29sZWFuT3JOdWxsKHZhbHVlKTtcbiAgdXBkYXRlRWxlbWVudENsYXNzUHJvcChcbiAgICAgIGdldFN0eWxpbmdDb250ZXh0KGluZGV4ICsgSEVBREVSX09GRlNFVCwgZ2V0TFZpZXcoKSksIGNsYXNzSW5kZXgsIGlucHV0LFxuICAgICAgREVGQVVMVF9URU1QTEFURV9ESVJFQ1RJVkVfSU5ERVgsIGZvcmNlT3ZlcnJpZGUpO1xufVxuXG5cbi8qKlxuICogVXBkYXRlIGEgY2xhc3MgaG9zdCBiaW5kaW5nIGZvciBhIGRpcmVjdGl2ZSdzL2NvbXBvbmVudCdzIGhvc3QgZWxlbWVudCB3aXRoaW5cbiAqIHRoZSBob3N0IGJpbmRpbmdzIGZ1bmN0aW9uLlxuICpcbiAqIFRoaXMgaW5zdHJ1Y3Rpb24gaXMgbWVhbnQgdG8gaGFuZGxlIHRoZSBgQEhvc3RCaW5kaW5nKCdjbGFzcy5mb28nKWAgY2FzZSBhbmQsXG4gKiB0aGVyZWZvcmUsIHRoZSBjbGFzcyBiaW5kaW5nIGl0c2VsZiBtdXN0IGFscmVhZHkgYmUgYWxsb2NhdGVkIHVzaW5nXG4gKiBgZWxlbWVudEhvc3RTdHlsaW5nYCB3aXRoaW4gdGhlIGNyZWF0aW9uIGJsb2NrLlxuICpcbiAqIEBwYXJhbSBjbGFzc0luZGV4IEluZGV4IG9mIGNsYXNzIHRvIHRvZ2dsZS4gVGhpcyBpbmRleCB2YWx1ZSByZWZlcnMgdG8gdGhlXG4gKiAgICAgICAgaW5kZXggb2YgdGhlIGNsYXNzIGluIHRoZSBjbGFzcyBiaW5kaW5ncyBhcnJheSB0aGF0IHdhcyBwYXNzZWQgaW50b1xuICogICAgICAgIGBlbGVtZW50SG9zdFN0bHlpbmdgICh3aGljaCBpcyBtZWFudCB0byBiZSBjYWxsZWQgYmVmb3JlIHRoaXNcbiAqICAgICAgICBmdW5jdGlvbiBpcykuXG4gKiBAcGFyYW0gdmFsdWUgQSB0cnVlL2ZhbHNlIHZhbHVlIHdoaWNoIHdpbGwgdHVybiB0aGUgY2xhc3Mgb24gb3Igb2ZmLlxuICogQHBhcmFtIGZvcmNlT3ZlcnJpZGUgV2hldGhlciBvciBub3QgdGhpcyB2YWx1ZSB3aWxsIGJlIGFwcGxpZWQgcmVnYXJkbGVzc1xuICogICAgICAgIG9mIHdoZXJlIGl0IGlzIGJlaW5nIHNldCB3aXRoaW4gdGhlIHN0eWxpbmdzIHByaW9yaXR5IHN0cnVjdHVyZS5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbGVtZW50SG9zdENsYXNzUHJvcChcbiAgICBjbGFzc0luZGV4OiBudW1iZXIsIHZhbHVlOiBib29sZWFuIHwgUGxheWVyRmFjdG9yeSwgZm9yY2VPdmVycmlkZT86IGJvb2xlYW4pOiB2b2lkIHtcbiAgY29uc3QgZGlyZWN0aXZlU3R5bGluZ0luZGV4ID0gZ2V0QWN0aXZlRGlyZWN0aXZlU3R5bGluZ0luZGV4KCk7XG4gIGNvbnN0IGhvc3RFbGVtZW50SW5kZXggPSBnZXRTZWxlY3RlZEluZGV4KCk7XG5cbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCBzdHlsaW5nQ29udGV4dCA9IGdldFN0eWxpbmdDb250ZXh0KGhvc3RFbGVtZW50SW5kZXggKyBIRUFERVJfT0ZGU0VULCBsVmlldyk7XG5cbiAgY29uc3QgaW5wdXQgPSAodmFsdWUgaW5zdGFuY2VvZiBCb3VuZFBsYXllckZhY3RvcnkpID9cbiAgICAgICh2YWx1ZSBhcyBCb3VuZFBsYXllckZhY3Rvcnk8Ym9vbGVhbnxudWxsPikgOlxuICAgICAgYm9vbGVhbk9yTnVsbCh2YWx1ZSk7XG5cbiAgY29uc3QgYXJnczogUGFyYW1zT2Y8dHlwZW9mIHVwZGF0ZUVsZW1lbnRDbGFzc1Byb3A+ID1cbiAgICAgIFtzdHlsaW5nQ29udGV4dCwgY2xhc3NJbmRleCwgaW5wdXQsIGRpcmVjdGl2ZVN0eWxpbmdJbmRleCwgZm9yY2VPdmVycmlkZV07XG4gIGVucXVldWVIb3N0SW5zdHJ1Y3Rpb24oc3R5bGluZ0NvbnRleHQsIGRpcmVjdGl2ZVN0eWxpbmdJbmRleCwgdXBkYXRlRWxlbWVudENsYXNzUHJvcCwgYXJncyk7XG59XG5cbmZ1bmN0aW9uIGJvb2xlYW5Pck51bGwodmFsdWU6IGFueSk6IGJvb2xlYW58bnVsbCB7XG4gIGlmICh0eXBlb2YgdmFsdWUgPT09ICdib29sZWFuJykgcmV0dXJuIHZhbHVlO1xuICByZXR1cm4gdmFsdWUgPyB0cnVlIDogbnVsbDtcbn1cblxuXG4vKipcbiAqIFVwZGF0ZSBzdHlsZSBhbmQvb3IgY2xhc3MgYmluZGluZ3MgdXNpbmcgb2JqZWN0IGxpdGVyYWxzIG9uIGFuIGVsZW1lbnQuXG4gKlxuICogVGhpcyBpbnN0cnVjdGlvbiBpcyBtZWFudCB0byBhcHBseSBzdHlsaW5nIHZpYSB0aGUgYFtzdHlsZV09XCJleHBcImAgYW5kIGBbY2xhc3NdPVwiZXhwXCJgIHRlbXBsYXRlXG4gKiBiaW5kaW5ncy4gV2hlbiBzdHlsZXMvY2xhc3NlcyBhcmUgYXBwbGllZCB0byB0aGUgZWxlbWVudCB0aGV5IHdpbGwgdGhlbiBiZSB1cGRhdGVkIHdpdGhcbiAqIHJlc3BlY3QgdG8gYW55IHN0eWxlcy9jbGFzc2VzIHNldCB3aXRoIGBlbGVtZW50U3R5bGVQcm9wYCBvciBgZWxlbWVudENsYXNzUHJvcGAuIElmIGFueVxuICogc3R5bGVzIG9yIGNsYXNzZXMgYXJlIHNldCB0byBmYWxzeSB0aGVuIHRoZXkgd2lsbCBiZSByZW1vdmVkIGZyb20gdGhlIGVsZW1lbnQuXG4gKlxuICogTm90ZSB0aGF0IHRoZSBzdHlsaW5nIGluc3RydWN0aW9uIHdpbGwgbm90IGJlIGFwcGxpZWQgdW50aWwgYGVsZW1lbnRTdHlsaW5nQXBwbHlgIGlzIGNhbGxlZC5cbiAqXG4gKiBAcGFyYW0gaW5kZXggSW5kZXggb2YgdGhlIGVsZW1lbnQncyB3aXRoIHdoaWNoIHN0eWxpbmcgaXMgYXNzb2NpYXRlZC5cbiAqIEBwYXJhbSBjbGFzc2VzIEEga2V5L3ZhbHVlIG1hcCBvciBzdHJpbmcgb2YgQ1NTIGNsYXNzZXMgdGhhdCB3aWxsIGJlIGFkZGVkIHRvIHRoZVxuICogICAgICAgIGdpdmVuIGVsZW1lbnQuIEFueSBtaXNzaW5nIGNsYXNzZXMgKHRoYXQgaGF2ZSBhbHJlYWR5IGJlZW4gYXBwbGllZCB0byB0aGUgZWxlbWVudFxuICogICAgICAgIGJlZm9yZWhhbmQpIHdpbGwgYmUgcmVtb3ZlZCAodW5zZXQpIGZyb20gdGhlIGVsZW1lbnQncyBsaXN0IG9mIENTUyBjbGFzc2VzLlxuICogQHBhcmFtIHN0eWxlcyBBIGtleS92YWx1ZSBzdHlsZSBtYXAgb2YgdGhlIHN0eWxlcyB0aGF0IHdpbGwgYmUgYXBwbGllZCB0byB0aGUgZ2l2ZW4gZWxlbWVudC5cbiAqICAgICAgICBBbnkgbWlzc2luZyBzdHlsZXMgKHRoYXQgaGF2ZSBhbHJlYWR5IGJlZW4gYXBwbGllZCB0byB0aGUgZWxlbWVudCBiZWZvcmVoYW5kKSB3aWxsIGJlXG4gKiAgICAgICAgcmVtb3ZlZCAodW5zZXQpIGZyb20gdGhlIGVsZW1lbnQncyBzdHlsaW5nLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVsZW1lbnRTdHlsaW5nTWFwKFxuICAgIGluZGV4OiBudW1iZXIsIGNsYXNzZXM6IHtba2V5OiBzdHJpbmddOiBhbnl9IHwgc3RyaW5nIHwgTk9fQ0hBTkdFIHwgbnVsbCxcbiAgICBzdHlsZXM/OiB7W3N0eWxlTmFtZTogc3RyaW5nXTogYW55fSB8IE5PX0NIQU5HRSB8IG51bGwpOiB2b2lkIHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCB0Tm9kZSA9IGdldFROb2RlKGluZGV4LCBsVmlldyk7XG4gIGNvbnN0IHN0eWxpbmdDb250ZXh0ID0gZ2V0U3R5bGluZ0NvbnRleHQoaW5kZXggKyBIRUFERVJfT0ZGU0VULCBsVmlldyk7XG5cbiAgLy8gaW5wdXRzIGFyZSBvbmx5IGV2YWx1YXRlZCBmcm9tIGEgdGVtcGxhdGUgYmluZGluZyBpbnRvIGEgZGlyZWN0aXZlLCB0aGVyZWZvcmUsXG4gIC8vIHRoZXJlIHNob3VsZCBub3QgYmUgYSBzaXR1YXRpb24gd2hlcmUgYSBkaXJlY3RpdmUgaG9zdCBiaW5kaW5ncyBmdW5jdGlvblxuICAvLyBldmFsdWF0ZXMgdGhlIGlucHV0cyAodGhpcyBzaG91bGQgb25seSBoYXBwZW4gaW4gdGhlIHRlbXBsYXRlIGZ1bmN0aW9uKVxuICBpZiAoaGFzQ2xhc3NJbnB1dCh0Tm9kZSkgJiYgY2xhc3NlcyAhPT0gTk9fQ0hBTkdFKSB7XG4gICAgY29uc3QgaW5pdGlhbENsYXNzZXMgPSBnZXRJbml0aWFsQ2xhc3NOYW1lVmFsdWUoc3R5bGluZ0NvbnRleHQpO1xuICAgIGNvbnN0IGNsYXNzSW5wdXRWYWwgPVxuICAgICAgICAoaW5pdGlhbENsYXNzZXMubGVuZ3RoID8gKGluaXRpYWxDbGFzc2VzICsgJyAnKSA6ICcnKSArIGZvcmNlQ2xhc3Nlc0FzU3RyaW5nKGNsYXNzZXMpO1xuICAgIHNldElucHV0c0ZvclByb3BlcnR5KGxWaWV3LCB0Tm9kZS5pbnB1dHMgIVsnY2xhc3MnXSAhLCBjbGFzc0lucHV0VmFsKTtcbiAgICBjbGFzc2VzID0gTk9fQ0hBTkdFO1xuICB9XG5cbiAgaWYgKGhhc1N0eWxlSW5wdXQodE5vZGUpICYmIHN0eWxlcyAhPT0gTk9fQ0hBTkdFKSB7XG4gICAgY29uc3QgaW5pdGlhbFN0eWxlcyA9IGdldEluaXRpYWxDbGFzc05hbWVWYWx1ZShzdHlsaW5nQ29udGV4dCk7XG4gICAgY29uc3Qgc3R5bGVJbnB1dFZhbCA9XG4gICAgICAgIChpbml0aWFsU3R5bGVzLmxlbmd0aCA/IChpbml0aWFsU3R5bGVzICsgJyAnKSA6ICcnKSArIGZvcmNlU3R5bGVzQXNTdHJpbmcoc3R5bGVzKTtcbiAgICBzZXRJbnB1dHNGb3JQcm9wZXJ0eShsVmlldywgdE5vZGUuaW5wdXRzICFbJ3N0eWxlJ10gISwgc3R5bGVJbnB1dFZhbCk7XG4gICAgc3R5bGVzID0gTk9fQ0hBTkdFO1xuICB9XG5cbiAgdXBkYXRlU3R5bGluZ01hcChzdHlsaW5nQ29udGV4dCwgY2xhc3Nlcywgc3R5bGVzKTtcbn1cblxuXG4vKipcbiAqIFVwZGF0ZSBzdHlsZSBhbmQvb3IgY2xhc3MgaG9zdCBiaW5kaW5ncyB1c2luZyBvYmplY3QgbGl0ZXJhbHMgb24gYW4gZWxlbWVudCB3aXRoaW4gdGhlIGhvc3RcbiAqIGJpbmRpbmdzIGZ1bmN0aW9uIGZvciBhIGRpcmVjdGl2ZS9jb21wb25lbnQuXG4gKlxuICogVGhpcyBpbnN0cnVjdGlvbiBpcyBtZWFudCB0byBhcHBseSBzdHlsaW5nIHZpYSB0aGUgYEBIb3N0QmluZGluZygnc3R5bGUnKWAgYW5kXG4gKiBgQEhvc3RCaW5kaW5nKCdjbGFzcycpYCBiaW5kaW5ncyBmb3IgYSBjb21wb25lbnQncyBvciBkaXJlY3RpdmUncyBob3N0IGVsZW1lbnQuXG4gKiBXaGVuIHN0eWxlcy9jbGFzc2VzIGFyZSBhcHBsaWVkIHRvIHRoZSBob3N0IGVsZW1lbnQgdGhleSB3aWxsIHRoZW4gYmUgdXBkYXRlZFxuICogd2l0aCByZXNwZWN0IHRvIGFueSBzdHlsZXMvY2xhc3NlcyBzZXQgd2l0aCBgZWxlbWVudEhvc3RTdHlsZVByb3BgIG9yXG4gKiBgZWxlbWVudEhvc3RDbGFzc1Byb3BgLiBJZiBhbnkgc3R5bGVzIG9yIGNsYXNzZXMgYXJlIHNldCB0byBmYWxzeSB0aGVuIHRoZXlcbiAqIHdpbGwgYmUgcmVtb3ZlZCBmcm9tIHRoZSBlbGVtZW50LlxuICpcbiAqIE5vdGUgdGhhdCB0aGUgc3R5bGluZyBpbnN0cnVjdGlvbiB3aWxsIG5vdCBiZSBhcHBsaWVkIHVudGlsXG4gKiBgZWxlbWVudEhvc3RTdHlsaW5nQXBwbHlgIGlzIGNhbGxlZC5cbiAqXG4gKiBAcGFyYW0gY2xhc3NlcyBBIGtleS92YWx1ZSBtYXAgb3Igc3RyaW5nIG9mIENTUyBjbGFzc2VzIHRoYXQgd2lsbCBiZSBhZGRlZCB0byB0aGVcbiAqICAgICAgICBnaXZlbiBlbGVtZW50LiBBbnkgbWlzc2luZyBjbGFzc2VzICh0aGF0IGhhdmUgYWxyZWFkeSBiZWVuIGFwcGxpZWQgdG8gdGhlIGVsZW1lbnRcbiAqICAgICAgICBiZWZvcmVoYW5kKSB3aWxsIGJlIHJlbW92ZWQgKHVuc2V0KSBmcm9tIHRoZSBlbGVtZW50J3MgbGlzdCBvZiBDU1MgY2xhc3Nlcy5cbiAqIEBwYXJhbSBzdHlsZXMgQSBrZXkvdmFsdWUgc3R5bGUgbWFwIG9mIHRoZSBzdHlsZXMgdGhhdCB3aWxsIGJlIGFwcGxpZWQgdG8gdGhlIGdpdmVuIGVsZW1lbnQuXG4gKiAgICAgICAgQW55IG1pc3Npbmcgc3R5bGVzICh0aGF0IGhhdmUgYWxyZWFkeSBiZWVuIGFwcGxpZWQgdG8gdGhlIGVsZW1lbnQgYmVmb3JlaGFuZCkgd2lsbCBiZVxuICogICAgICAgIHJlbW92ZWQgKHVuc2V0KSBmcm9tIHRoZSBlbGVtZW50J3Mgc3R5bGluZy5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbGVtZW50SG9zdFN0eWxpbmdNYXAoXG4gICAgY2xhc3Nlczoge1trZXk6IHN0cmluZ106IGFueX0gfCBzdHJpbmcgfCBOT19DSEFOR0UgfCBudWxsLFxuICAgIHN0eWxlcz86IHtbc3R5bGVOYW1lOiBzdHJpbmddOiBhbnl9IHwgTk9fQ0hBTkdFIHwgbnVsbCk6IHZvaWQge1xuICBjb25zdCBkaXJlY3RpdmVTdHlsaW5nSW5kZXggPSBnZXRBY3RpdmVEaXJlY3RpdmVTdHlsaW5nSW5kZXgoKTtcbiAgY29uc3QgaG9zdEVsZW1lbnRJbmRleCA9IGdldFNlbGVjdGVkSW5kZXgoKTtcblxuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IHN0eWxpbmdDb250ZXh0ID0gZ2V0U3R5bGluZ0NvbnRleHQoaG9zdEVsZW1lbnRJbmRleCArIEhFQURFUl9PRkZTRVQsIGxWaWV3KTtcblxuICBjb25zdCBhcmdzOiBQYXJhbXNPZjx0eXBlb2YgdXBkYXRlU3R5bGluZ01hcD4gPVxuICAgICAgW3N0eWxpbmdDb250ZXh0LCBjbGFzc2VzLCBzdHlsZXMsIGRpcmVjdGl2ZVN0eWxpbmdJbmRleF07XG4gIGVucXVldWVIb3N0SW5zdHJ1Y3Rpb24oc3R5bGluZ0NvbnRleHQsIGRpcmVjdGl2ZVN0eWxpbmdJbmRleCwgdXBkYXRlU3R5bGluZ01hcCwgYXJncyk7XG59XG5cblxuLyoqXG4gKiBBcHBseSBhbGwgc3R5bGUgYW5kIGNsYXNzIGJpbmRpbmcgdmFsdWVzIHRvIHRoZSBlbGVtZW50LlxuICpcbiAqIFRoaXMgaW5zdHJ1Y3Rpb24gaXMgbWVhbnQgdG8gYmUgcnVuIGFmdGVyIGBlbGVtZW50U3R5bGluZ01hcGAsIGBlbGVtZW50U3R5bGVQcm9wYFxuICogb3IgYGVsZW1lbnRDbGFzc1Byb3BgIGluc3RydWN0aW9ucyBoYXZlIGJlZW4gcnVuIGFuZCB3aWxsIG9ubHkgYXBwbHkgc3R5bGluZyB0b1xuICogdGhlIGVsZW1lbnQgaWYgYW55IHN0eWxpbmcgYmluZGluZ3MgaGF2ZSBiZWVuIHVwZGF0ZWQuXG4gKlxuICogQHBhcmFtIGluZGV4IEluZGV4IG9mIHRoZSBlbGVtZW50J3Mgd2l0aCB3aGljaCBzdHlsaW5nIGlzIGFzc29jaWF0ZWQuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gZWxlbWVudFN0eWxpbmdBcHBseShpbmRleDogbnVtYmVyKTogdm9pZCB7XG4gIGVsZW1lbnRTdHlsaW5nQXBwbHlJbnRlcm5hbChERUZBVUxUX1RFTVBMQVRFX0RJUkVDVElWRV9JTkRFWCwgaW5kZXgpO1xufVxuXG4vKipcbiAqIEFwcGx5IGFsbCBzdHlsZSBhbmQgY2xhc3MgaG9zdCBiaW5kaW5nIHZhbHVlcyB0byB0aGUgZWxlbWVudC5cbiAqXG4gKiBUaGlzIGluc3RydWN0aW9uIGlzIG1lYW50IHRvIGJlIHJ1biBhZnRlciBgZWxlbWVudEhvc3RTdHlsaW5nTWFwYCxcbiAqIGBlbGVtZW50SG9zdFN0eWxlUHJvcGAgb3IgYGVsZW1lbnRIb3N0Q2xhc3NQcm9wYCBpbnN0cnVjdGlvbnMgaGF2ZVxuICogYmVlbiBydW4gYW5kIHdpbGwgb25seSBhcHBseSBzdHlsaW5nIHRvIHRoZSBob3N0IGVsZW1lbnQgaWYgYW55XG4gKiBzdHlsaW5nIGJpbmRpbmdzIGhhdmUgYmVlbiB1cGRhdGVkLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVsZW1lbnRIb3N0U3R5bGluZ0FwcGx5KCk6IHZvaWQge1xuICBlbGVtZW50U3R5bGluZ0FwcGx5SW50ZXJuYWwoZ2V0QWN0aXZlRGlyZWN0aXZlU3R5bGluZ0luZGV4KCksIGdldFNlbGVjdGVkSW5kZXgoKSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBlbGVtZW50U3R5bGluZ0FwcGx5SW50ZXJuYWwoZGlyZWN0aXZlU3R5bGluZ0luZGV4OiBudW1iZXIsIGluZGV4OiBudW1iZXIpOiB2b2lkIHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCB0Tm9kZSA9IGdldFROb2RlKGluZGV4LCBsVmlldyk7XG5cbiAgLy8gaWYgYSBub24tZWxlbWVudCB2YWx1ZSBpcyBiZWluZyBwcm9jZXNzZWQgdGhlbiB3ZSBjYW4ndCByZW5kZXIgdmFsdWVzXG4gIC8vIG9uIHRoZSBlbGVtZW50IGF0IGFsbCB0aGVyZWZvcmUgYnkgc2V0dGluZyB0aGUgcmVuZGVyZXIgdG8gbnVsbCB0aGVuXG4gIC8vIHRoZSBzdHlsaW5nIGFwcGx5IGNvZGUga25vd3Mgbm90IHRvIGFjdHVhbGx5IGFwcGx5IHRoZSB2YWx1ZXMuLi5cbiAgY29uc3QgcmVuZGVyZXIgPSB0Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuRWxlbWVudCA/IGxWaWV3W1JFTkRFUkVSXSA6IG51bGw7XG4gIGNvbnN0IGlzRmlyc3RSZW5kZXIgPSAobFZpZXdbRkxBR1NdICYgTFZpZXdGbGFncy5GaXJzdExWaWV3UGFzcykgIT09IDA7XG4gIGNvbnN0IHN0eWxpbmdDb250ZXh0ID0gZ2V0U3R5bGluZ0NvbnRleHQoaW5kZXggKyBIRUFERVJfT0ZGU0VULCBsVmlldyk7XG4gIGNvbnN0IHRvdGFsUGxheWVyc1F1ZXVlZCA9IHJlbmRlclN0eWxpbmcoXG4gICAgICBzdHlsaW5nQ29udGV4dCwgcmVuZGVyZXIsIGxWaWV3LCBpc0ZpcnN0UmVuZGVyLCBudWxsLCBudWxsLCBkaXJlY3RpdmVTdHlsaW5nSW5kZXgpO1xuICBpZiAodG90YWxQbGF5ZXJzUXVldWVkID4gMCkge1xuICAgIGNvbnN0IHJvb3RDb250ZXh0ID0gZ2V0Um9vdENvbnRleHQobFZpZXcpO1xuICAgIHNjaGVkdWxlVGljayhyb290Q29udGV4dCwgUm9vdENvbnRleHRGbGFncy5GbHVzaFBsYXllcnMpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRBY3RpdmVEaXJlY3RpdmVTdHlsaW5nSW5kZXgoKSB7XG4gIC8vIHdoZW5ldmVyIGEgZGlyZWN0aXZlJ3MgaG9zdEJpbmRpbmdzIGZ1bmN0aW9uIGlzIGNhbGxlZCBhIHVuaXF1ZUlkIHZhbHVlXG4gIC8vIGlzIGFzc2lnbmVkLiBOb3JtYWxseSB0aGlzIGlzIGVub3VnaCB0byBoZWxwIGRpc3Rpbmd1aXNoIG9uZSBkaXJlY3RpdmVcbiAgLy8gZnJvbSBhbm90aGVyIGZvciB0aGUgc3R5bGluZyBjb250ZXh0LCBidXQgdGhlcmUgYXJlIHNpdHVhdGlvbnMgd2hlcmUgYVxuICAvLyBzdWItY2xhc3MgZGlyZWN0aXZlIGNvdWxkIGluaGVyaXQgYW5kIGFzc2lnbiBzdHlsaW5nIGluIGNvbmNlcnQgd2l0aCBhXG4gIC8vIHBhcmVudCBkaXJlY3RpdmUuIFRvIGhlbHAgdGhlIHN0eWxpbmcgY29kZSBkaXN0aW5ndWlzaCBiZXR3ZWVuIGEgcGFyZW50XG4gIC8vIHN1Yi1jbGFzc2VkIGRpcmVjdGl2ZSB0aGUgaW5oZXJpdGFuY2UgZGVwdGggaXMgdGFrZW4gaW50byBhY2NvdW50IGFzIHdlbGwuXG4gIHJldHVybiBnZXRBY3RpdmVEaXJlY3RpdmVJZCgpICsgZ2V0QWN0aXZlRGlyZWN0aXZlU3VwZXJDbGFzc0RlcHRoKCk7XG59Il19