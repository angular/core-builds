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
    var index = getSelectedIndex();
    var valueToAdd = resolveStylePropValue(value, suffix);
    var stylingContext = getStylingContext(index, getLView());
    var directiveStylingIndex = getActiveDirectiveStylingIndex();
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
    var index = getSelectedIndex();
    var lView = getLView();
    var stylingContext = getStylingContext(index, lView);
    var directiveStylingIndex = getActiveDirectiveStylingIndex();
    if (directiveStylingIndex) {
        var args = [stylingContext, classes, directiveStylingIndex];
        enqueueHostInstruction(stylingContext, directiveStylingIndex, updateClassMap, args);
    }
    else {
        var tNode = getTNode(index, lView);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3R5bGluZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvaW5zdHJ1Y3Rpb25zL3N0eWxpbmcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBUUEsT0FBTyxFQUFDLFdBQVcsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBRzlDLE9BQU8sRUFBQyxLQUFLLEVBQUUsYUFBYSxFQUFxQixRQUFRLEVBQW1CLE1BQU0sb0JBQW9CLENBQUM7QUFDdkcsT0FBTyxFQUFDLG9CQUFvQixFQUFFLGlDQUFpQyxFQUFFLFFBQVEsRUFBRSx3QkFBd0IsRUFBRSxnQkFBZ0IsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUN2SSxPQUFPLEVBQUMsd0JBQXdCLEVBQUUsYUFBYSxFQUFFLGNBQWMsRUFBRSxlQUFlLElBQUksZUFBZSxFQUFFLHlCQUF5QixFQUFFLGNBQWMsRUFBRSxlQUFlLElBQUksZUFBZSxFQUFDLE1BQU0scUNBQXFDLENBQUM7QUFDL04sT0FBTyxFQUFXLHNCQUFzQixFQUFFLHFCQUFxQixFQUFDLE1BQU0sb0NBQW9DLENBQUM7QUFDM0csT0FBTyxFQUFDLGtCQUFrQixFQUFDLE1BQU0sMkJBQTJCLENBQUM7QUFDN0QsT0FBTyxFQUFDLGdDQUFnQyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDbkUsT0FBTyxFQUFDLHVCQUF1QixFQUFFLHVCQUF1QixFQUFDLE1BQU0sa0JBQWtCLENBQUM7QUFDbEYsT0FBTyxFQUFDLG9DQUFvQyxFQUFFLHlCQUF5QixFQUFFLG9CQUFvQixFQUFFLG1CQUFtQixFQUFFLDBCQUEwQixFQUFFLGFBQWEsRUFBRSxhQUFhLEVBQUMsTUFBTSxpQkFBaUIsQ0FBQztBQUNyTSxPQUFPLEVBQUMsUUFBUSxJQUFJLFdBQVcsRUFBRSxTQUFTLElBQUksWUFBWSxFQUFFLFFBQVEsSUFBSSxXQUFXLEVBQUUsU0FBUyxJQUFJLFlBQVks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QXVCLENBQUMsSUFBSSxDQUFDLENBQUM7SUFFOUIsSUFBSSx3QkFBd0IsRUFBRSxFQUFFO1FBQzlCLGVBQWUsRUFBRSxDQUFDO0tBQ25CO0FBQ0gsQ0FBQztBQUVELE1BQU0sVUFBVSw4QkFBOEI7SUFDNUMsMEVBQTBFO0lBQzFFLHlFQUF5RTtJQUN6RSx5RUFBeUU7SUFDekUseUVBQXlFO0lBQ3pFLDBFQUEwRTtJQUMxRSw2RUFBNkU7SUFDN0UsT0FBTyxvQkFBb0IsRUFBRSxHQUFHLGlDQUFpQyxFQUFFLENBQUM7QUFDdEUsQ0FBQztBQUVELFNBQVMsaUJBQWlCLENBQUMsS0FBYSxFQUFFLEtBQVk7SUFDcEQsSUFBSSxPQUFPLEdBQUcsdUJBQXVCLEVBQUUsQ0FBQztJQUN4QyxJQUFJLENBQUMsT0FBTyxFQUFFO1FBQ1osT0FBTyxHQUFHLDBCQUEwQixDQUFDLEtBQUssR0FBRyxhQUFhLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDbkUsdUJBQXVCLENBQUMsT0FBTyxDQUFDLENBQUM7S0FDbEM7U0FBTSxJQUFJLFNBQVMsRUFBRTtRQUNwQixJQUFNLGFBQWEsR0FBRywwQkFBMEIsQ0FBQyxLQUFLLEdBQUcsYUFBYSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQy9FLFdBQVcsQ0FBQyxPQUFPLEVBQUUsYUFBYSxFQUFFLHVDQUF1QyxDQUFDLENBQUM7S0FDOUU7SUFDRCxPQUFPLE9BQU8sQ0FBQztBQUNqQixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0IHtTdHlsZVNhbml0aXplRm59IGZyb20gJy4uLy4uL3Nhbml0aXphdGlvbi9zdHlsZV9zYW5pdGl6ZXInO1xuaW1wb3J0IHthc3NlcnRFcXVhbH0gZnJvbSAnLi4vLi4vdXRpbC9hc3NlcnQnO1xuaW1wb3J0IHtUTm9kZSwgVE5vZGVUeXBlfSBmcm9tICcuLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtQbGF5ZXJGYWN0b3J5fSBmcm9tICcuLi9pbnRlcmZhY2VzL3BsYXllcic7XG5pbXBvcnQge0ZMQUdTLCBIRUFERVJfT0ZGU0VULCBMVmlldywgTFZpZXdGbGFncywgUkVOREVSRVIsIFJvb3RDb250ZXh0RmxhZ3N9IGZyb20gJy4uL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2dldEFjdGl2ZURpcmVjdGl2ZUlkLCBnZXRBY3RpdmVEaXJlY3RpdmVTdXBlckNsYXNzRGVwdGgsIGdldExWaWV3LCBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUsIGdldFNlbGVjdGVkSW5kZXh9IGZyb20gJy4uL3N0YXRlJztcbmltcG9ydCB7Z2V0SW5pdGlhbENsYXNzTmFtZVZhbHVlLCByZW5kZXJTdHlsaW5nLCB1cGRhdGVDbGFzc01hcCwgdXBkYXRlQ2xhc3NQcm9wIGFzIHVwZGF0ZWNsYXNzUHJvcCwgdXBkYXRlQ29udGV4dFdpdGhCaW5kaW5ncywgdXBkYXRlU3R5bGVNYXAsIHVwZGF0ZVN0eWxlUHJvcCBhcyB1cGRhdGVzdHlsZVByb3B9IGZyb20gJy4uL3N0eWxpbmcvY2xhc3NfYW5kX3N0eWxlX2JpbmRpbmdzJztcbmltcG9ydCB7UGFyYW1zT2YsIGVucXVldWVIb3N0SW5zdHJ1Y3Rpb24sIHJlZ2lzdGVySG9zdERpcmVjdGl2ZX0gZnJvbSAnLi4vc3R5bGluZy9ob3N0X2luc3RydWN0aW9uc19xdWV1ZSc7XG5pbXBvcnQge0JvdW5kUGxheWVyRmFjdG9yeX0gZnJvbSAnLi4vc3R5bGluZy9wbGF5ZXJfZmFjdG9yeSc7XG5pbXBvcnQge0RFRkFVTFRfVEVNUExBVEVfRElSRUNUSVZFX0lOREVYfSBmcm9tICcuLi9zdHlsaW5nL3NoYXJlZCc7XG5pbXBvcnQge2dldENhY2hlZFN0eWxpbmdDb250ZXh0LCBzZXRDYWNoZWRTdHlsaW5nQ29udGV4dH0gZnJvbSAnLi4vc3R5bGluZy9zdGF0ZSc7XG5pbXBvcnQge2FsbG9jYXRlT3JVcGRhdGVEaXJlY3RpdmVJbnRvQ29udGV4dCwgY3JlYXRlRW1wdHlTdHlsaW5nQ29udGV4dCwgZm9yY2VDbGFzc2VzQXNTdHJpbmcsIGZvcmNlU3R5bGVzQXNTdHJpbmcsIGdldFN0eWxpbmdDb250ZXh0RnJvbUxWaWV3LCBoYXNDbGFzc0lucHV0LCBoYXNTdHlsZUlucHV0fSBmcm9tICcuLi9zdHlsaW5nL3V0aWwnO1xuaW1wb3J0IHtjbGFzc01hcCBhcyBuZXdDbGFzc01hcCwgY2xhc3NQcm9wIGFzIG5ld0NsYXNzUHJvcCwgc3R5bGVNYXAgYXMgbmV3U3R5bGVNYXAsIHN0eWxlUHJvcCBhcyBuZXdTdHlsZVByb3AsIHN0eWxpbmdBcHBseSBhcyBuZXdTdHlsaW5nQXBwbHksIHN0eWxpbmdJbml0IGFzIG5ld1N0eWxpbmdJbml0fSBmcm9tICcuLi9zdHlsaW5nX25leHQvaW5zdHJ1Y3Rpb25zJztcbmltcG9ydCB7cnVudGltZUFsbG93T2xkU3R5bGluZywgcnVudGltZUlzTmV3U3R5bGluZ0luVXNlfSBmcm9tICcuLi9zdHlsaW5nX25leHQvc3RhdGUnO1xuaW1wb3J0IHtnZXRCaW5kaW5nTmFtZUZyb21JbmRleH0gZnJvbSAnLi4vc3R5bGluZ19uZXh0L3V0aWwnO1xuaW1wb3J0IHtOT19DSEFOR0V9IGZyb20gJy4uL3Rva2Vucyc7XG5pbXBvcnQge3JlbmRlclN0cmluZ2lmeX0gZnJvbSAnLi4vdXRpbC9taXNjX3V0aWxzJztcbmltcG9ydCB7Z2V0Um9vdENvbnRleHR9IGZyb20gJy4uL3V0aWwvdmlld190cmF2ZXJzYWxfdXRpbHMnO1xuaW1wb3J0IHtnZXRUTm9kZX0gZnJvbSAnLi4vdXRpbC92aWV3X3V0aWxzJztcblxuaW1wb3J0IHtzY2hlZHVsZVRpY2ssIHNldElucHV0c0ZvclByb3BlcnR5fSBmcm9tICcuL3NoYXJlZCc7XG5cblxuXG4vKlxuICogVGhlIGNvbnRlbnRzIG9mIHRoaXMgZmlsZSBpbmNsdWRlIHRoZSBpbnN0cnVjdGlvbnMgZm9yIGFsbCBzdHlsaW5nLXJlbGF0ZWRcbiAqIG9wZXJhdGlvbnMgaW4gQW5ndWxhci5cbiAqXG4gKiBUaGUgaW5zdHJ1Y3Rpb25zIHByZXNlbnQgaW4gdGhpcyBmaWxlIGFyZTpcbiAqXG4gKiBUZW1wbGF0ZSBsZXZlbCBzdHlsaW5nIGluc3RydWN0aW9uczpcbiAqIC0gc3R5bGluZ1xuICogLSBzdHlsZU1hcFxuICogLSBjbGFzc01hcFxuICogLSBzdHlsZVByb3BcbiAqIC0gY2xhc3NQcm9wXG4gKiAtIHN0eWxpbmdBcHBseVxuICovXG5cbi8qKlxuICogQWxsb2NhdGVzIHN0eWxlIGFuZCBjbGFzcyBiaW5kaW5nIHByb3BlcnRpZXMgb24gdGhlIGVsZW1lbnQgZHVyaW5nIGNyZWF0aW9uIG1vZGUuXG4gKlxuICogVGhpcyBpbnN0cnVjdGlvbiBpcyBtZWFudCB0byBiZSBjYWxsZWQgZHVyaW5nIGNyZWF0aW9uIG1vZGUgdG8gcmVnaXN0ZXIgYWxsXG4gKiBkeW5hbWljIHN0eWxlIGFuZCBjbGFzcyBiaW5kaW5ncyBvbiB0aGUgZWxlbWVudC4gTm90ZSB0aGF0IHRoaXMgaXMgb25seSB1c2VkXG4gKiBmb3IgYmluZGluZyB2YWx1ZXMgKHNlZSBgZWxlbWVudFN0YXJ0YCB0byBsZWFybiBob3cgdG8gYXNzaWduIHN0YXRpYyBzdHlsaW5nXG4gKiB2YWx1ZXMgdG8gYW4gZWxlbWVudCkuXG4gKlxuICogQHBhcmFtIGNsYXNzQmluZGluZ05hbWVzIEFuIGFycmF5IGNvbnRhaW5pbmcgYmluZGFibGUgY2xhc3MgbmFtZXMuXG4gKiAgICAgICAgVGhlIGBjbGFzc1Byb3BgIGluc3RydWN0aW9uIHJlZmVycyB0byB0aGUgY2xhc3MgbmFtZSBieSBpbmRleCBpblxuICogICAgICAgIHRoaXMgYXJyYXkgKGkuZS4gYFsnZm9vJywgJ2JhciddYCBtZWFucyBgZm9vPTBgIGFuZCBgYmFyPTFgKS5cbiAqIEBwYXJhbSBzdHlsZUJpbmRpbmdOYW1lcyBBbiBhcnJheSBjb250YWluaW5nIGJpbmRhYmxlIHN0eWxlIHByb3BlcnRpZXMuXG4gKiAgICAgICAgVGhlIGBzdHlsZVByb3BgIGluc3RydWN0aW9uIHJlZmVycyB0byB0aGUgY2xhc3MgbmFtZSBieSBpbmRleCBpblxuICogICAgICAgIHRoaXMgYXJyYXkgKGkuZS4gYFsnd2lkdGgnLCAnaGVpZ2h0J11gIG1lYW5zIGB3aWR0aD0wYCBhbmQgYGhlaWdodD0xYCkuXG4gKiBAcGFyYW0gc3R5bGVTYW5pdGl6ZXIgQW4gb3B0aW9uYWwgc2FuaXRpemVyIGZ1bmN0aW9uIHRoYXQgd2lsbCBiZSB1c2VkIHRvIHNhbml0aXplIGFueSBDU1NcbiAqICAgICAgICBzdHlsZSB2YWx1ZXMgdGhhdCBhcmUgYXBwbGllZCB0byB0aGUgZWxlbWVudCAoZHVyaW5nIHJlbmRlcmluZykuXG4gKlxuICogTm90ZSB0aGF0IHRoaXMgd2lsbCBhbGxvY2F0ZSB0aGUgcHJvdmlkZWQgc3R5bGUvY2xhc3MgYmluZGluZ3MgdG8gdGhlIGhvc3QgZWxlbWVudCBpZlxuICogdGhpcyBmdW5jdGlvbiBpcyBjYWxsZWQgd2l0aGluIGEgaG9zdCBiaW5kaW5nLlxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1c3R5bGluZyhcbiAgICBjbGFzc0JpbmRpbmdOYW1lcz86IHN0cmluZ1tdIHwgbnVsbCwgc3R5bGVCaW5kaW5nTmFtZXM/OiBzdHJpbmdbXSB8IG51bGwsXG4gICAgc3R5bGVTYW5pdGl6ZXI/OiBTdHlsZVNhbml0aXplRm4gfCBudWxsKTogdm9pZCB7XG4gIGNvbnN0IHROb2RlID0gZ2V0UHJldmlvdXNPclBhcmVudFROb2RlKCk7XG4gIGlmICghdE5vZGUuc3R5bGluZ1RlbXBsYXRlKSB7XG4gICAgdE5vZGUuc3R5bGluZ1RlbXBsYXRlID0gY3JlYXRlRW1wdHlTdHlsaW5nQ29udGV4dCgpO1xuICB9XG5cbiAgY29uc3QgZGlyZWN0aXZlU3R5bGluZ0luZGV4ID0gZ2V0QWN0aXZlRGlyZWN0aXZlU3R5bGluZ0luZGV4KCk7XG4gIGlmIChkaXJlY3RpdmVTdHlsaW5nSW5kZXgpIHtcbiAgICAvLyB0aGlzIGlzIHRlbXBvcmFyeSBoYWNrIHRvIGdldCB0aGUgZXhpc3Rpbmcgc3R5bGluZyBpbnN0cnVjdGlvbnMgdG9cbiAgICAvLyBwbGF5IGJhbGwgd2l0aCB0aGUgbmV3IHJlZmFjdG9yZWQgaW1wbGVtZW50YXRpb24uXG4gICAgLy8gVE9ETyAobWF0c2tvKTogcmVtb3ZlIHRoaXMgb25jZSB0aGUgb2xkIGltcGxlbWVudGF0aW9uIGlzIG5vdCBuZWVkZWQuXG4gICAgaWYgKHJ1bnRpbWVJc05ld1N0eWxpbmdJblVzZSgpKSB7XG4gICAgICBuZXdTdHlsaW5nSW5pdCgpO1xuICAgIH1cblxuICAgIC8vIGRlc3BpdGUgdGhlIGJpbmRpbmcgYmVpbmcgYXBwbGllZCBpbiBhIHF1ZXVlIChiZWxvdyksIHRoZSBhbGxvY2F0aW9uXG4gICAgLy8gb2YgdGhlIGRpcmVjdGl2ZSBpbnRvIHRoZSBjb250ZXh0IGhhcHBlbnMgcmlnaHQgYXdheS4gVGhlIHJlYXNvbiBmb3JcbiAgICAvLyB0aGlzIGlzIHRvIHJldGFpbiB0aGUgb3JkZXJpbmcgb2YgdGhlIGRpcmVjdGl2ZXMgKHdoaWNoIGlzIGltcG9ydGFudFxuICAgIC8vIGZvciB0aGUgcHJpb3JpdGl6YXRpb24gb2YgYmluZGluZ3MpLlxuICAgIGFsbG9jYXRlT3JVcGRhdGVEaXJlY3RpdmVJbnRvQ29udGV4dCh0Tm9kZS5zdHlsaW5nVGVtcGxhdGUsIGRpcmVjdGl2ZVN0eWxpbmdJbmRleCk7XG5cbiAgICBjb25zdCBmbnMgPSB0Tm9kZS5vbkVsZW1lbnRDcmVhdGlvbkZucyA9IHROb2RlLm9uRWxlbWVudENyZWF0aW9uRm5zIHx8IFtdO1xuICAgIGZucy5wdXNoKCgpID0+IHtcbiAgICAgIGluaXRTdHlsaW5nKFxuICAgICAgICAgIHROb2RlLCBjbGFzc0JpbmRpbmdOYW1lcywgc3R5bGVCaW5kaW5nTmFtZXMsIHN0eWxlU2FuaXRpemVyLCBkaXJlY3RpdmVTdHlsaW5nSW5kZXgpO1xuICAgICAgcmVnaXN0ZXJIb3N0RGlyZWN0aXZlKHROb2RlLnN0eWxpbmdUZW1wbGF0ZSAhLCBkaXJlY3RpdmVTdHlsaW5nSW5kZXgpO1xuICAgIH0pO1xuICB9IGVsc2Uge1xuICAgIC8vIGNhbGxpbmcgdGhlIGZ1bmN0aW9uIGJlbG93IGVuc3VyZXMgdGhhdCB0aGUgdGVtcGxhdGUncyBiaW5kaW5nIHZhbHVlc1xuICAgIC8vIGFyZSBhcHBsaWVkIGFzIHRoZSBmaXJzdCBzZXQgb2YgYmluZGluZ3MgaW50byB0aGUgY29udGV4dC4gSWYgYW55IG90aGVyXG4gICAgLy8gc3R5bGluZyBiaW5kaW5ncyBhcmUgc2V0IG9uIHRoZSBzYW1lIGVsZW1lbnQgKGJ5IGRpcmVjdGl2ZXMgYW5kL29yXG4gICAgLy8gY29tcG9uZW50cykgdGhlbiB0aGV5IHdpbGwgYmUgYXBwbGllZCBhdCB0aGUgZW5kIG9mIHRoZSBgZWxlbWVudEVuZGBcbiAgICAvLyBpbnN0cnVjdGlvbiAoYmVjYXVzZSBkaXJlY3RpdmVzIGFyZSBjcmVhdGVkIGZpcnN0IGJlZm9yZSBzdHlsaW5nIGlzXG4gICAgLy8gZXhlY3V0ZWQgZm9yIGEgbmV3IGVsZW1lbnQpLlxuICAgIGluaXRTdHlsaW5nKFxuICAgICAgICB0Tm9kZSwgY2xhc3NCaW5kaW5nTmFtZXMsIHN0eWxlQmluZGluZ05hbWVzLCBzdHlsZVNhbml0aXplcixcbiAgICAgICAgREVGQVVMVF9URU1QTEFURV9ESVJFQ1RJVkVfSU5ERVgpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGluaXRTdHlsaW5nKFxuICAgIHROb2RlOiBUTm9kZSwgY2xhc3NCaW5kaW5nTmFtZXM6IHN0cmluZ1tdIHwgbnVsbCB8IHVuZGVmaW5lZCxcbiAgICBzdHlsZUJpbmRpbmdOYW1lczogc3RyaW5nW10gfCBudWxsIHwgdW5kZWZpbmVkLFxuICAgIHN0eWxlU2FuaXRpemVyOiBTdHlsZVNhbml0aXplRm4gfCBudWxsIHwgdW5kZWZpbmVkLCBkaXJlY3RpdmVTdHlsaW5nSW5kZXg6IG51bWJlcik6IHZvaWQge1xuICB1cGRhdGVDb250ZXh0V2l0aEJpbmRpbmdzKFxuICAgICAgdE5vZGUuc3R5bGluZ1RlbXBsYXRlICEsIGRpcmVjdGl2ZVN0eWxpbmdJbmRleCwgY2xhc3NCaW5kaW5nTmFtZXMsIHN0eWxlQmluZGluZ05hbWVzLFxuICAgICAgc3R5bGVTYW5pdGl6ZXIpO1xufVxuXG5cbi8qKlxuICogVXBkYXRlIGEgc3R5bGUgYmluZGluZyBvbiBhbiBlbGVtZW50IHdpdGggdGhlIHByb3ZpZGVkIHZhbHVlLlxuICpcbiAqIElmIHRoZSBzdHlsZSB2YWx1ZSBpcyBmYWxzeSB0aGVuIGl0IHdpbGwgYmUgcmVtb3ZlZCBmcm9tIHRoZSBlbGVtZW50XG4gKiAob3IgYXNzaWduZWQgYSBkaWZmZXJlbnQgdmFsdWUgZGVwZW5kaW5nIGlmIHRoZXJlIGFyZSBhbnkgc3R5bGVzIHBsYWNlZFxuICogb24gdGhlIGVsZW1lbnQgd2l0aCBgc3R5bGVNYXBgIG9yIGFueSBzdGF0aWMgc3R5bGVzIHRoYXQgYXJlXG4gKiBwcmVzZW50IGZyb20gd2hlbiB0aGUgZWxlbWVudCB3YXMgY3JlYXRlZCB3aXRoIGBzdHlsaW5nYCkuXG4gKlxuICogTm90ZSB0aGF0IHRoZSBzdHlsaW5nIGVsZW1lbnQgaXMgdXBkYXRlZCBhcyBwYXJ0IG9mIGBzdHlsaW5nQXBwbHlgLlxuICpcbiAqIEBwYXJhbSBzdHlsZUluZGV4IEluZGV4IG9mIHN0eWxlIHRvIHVwZGF0ZS4gVGhpcyBpbmRleCB2YWx1ZSByZWZlcnMgdG8gdGhlXG4gKiAgICAgICAgaW5kZXggb2YgdGhlIHN0eWxlIGluIHRoZSBzdHlsZSBiaW5kaW5ncyBhcnJheSB0aGF0IHdhcyBwYXNzZWQgaW50b1xuICogICAgICAgIGBzdHlsaW5nYC5cbiAqIEBwYXJhbSB2YWx1ZSBOZXcgdmFsdWUgdG8gd3JpdGUgKGZhbHN5IHRvIHJlbW92ZSkuXG4gKiBAcGFyYW0gc3VmZml4IE9wdGlvbmFsIHN1ZmZpeC4gVXNlZCB3aXRoIHNjYWxhciB2YWx1ZXMgdG8gYWRkIHVuaXQgc3VjaCBhcyBgcHhgLlxuICogICAgICAgIE5vdGUgdGhhdCB3aGVuIGEgc3VmZml4IGlzIHByb3ZpZGVkIHRoZW4gdGhlIHVuZGVybHlpbmcgc2FuaXRpemVyIHdpbGxcbiAqICAgICAgICBiZSBpZ25vcmVkLlxuICogQHBhcmFtIGZvcmNlT3ZlcnJpZGUgV2hldGhlciBvciBub3QgdG8gdXBkYXRlIHRoZSBzdHlsaW5nIHZhbHVlIGltbWVkaWF0ZWx5XG4gKiAgICAgICAgKGRlc3BpdGUgdGhlIG90aGVyIGJpbmRpbmdzIHBvc3NpYmx5IGhhdmluZyBwcmlvcml0eSlcbiAqXG4gKiBOb3RlIHRoYXQgdGhpcyB3aWxsIGFwcGx5IHRoZSBwcm92aWRlZCBzdHlsZSB2YWx1ZSB0byB0aGUgaG9zdCBlbGVtZW50IGlmIHRoaXMgZnVuY3Rpb24gaXMgY2FsbGVkXG4gKiB3aXRoaW4gYSBob3N0IGJpbmRpbmcuXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVzdHlsZVByb3AoXG4gICAgc3R5bGVJbmRleDogbnVtYmVyLCB2YWx1ZTogc3RyaW5nIHwgbnVtYmVyIHwgU3RyaW5nIHwgUGxheWVyRmFjdG9yeSB8IG51bGwsXG4gICAgc3VmZml4Pzogc3RyaW5nIHwgbnVsbCwgZm9yY2VPdmVycmlkZT86IGJvb2xlYW4pOiB2b2lkIHtcbiAgY29uc3QgaW5kZXggPSBnZXRTZWxlY3RlZEluZGV4KCk7XG4gIGNvbnN0IHZhbHVlVG9BZGQgPSByZXNvbHZlU3R5bGVQcm9wVmFsdWUodmFsdWUsIHN1ZmZpeCk7XG4gIGNvbnN0IHN0eWxpbmdDb250ZXh0ID0gZ2V0U3R5bGluZ0NvbnRleHQoaW5kZXgsIGdldExWaWV3KCkpO1xuICBjb25zdCBkaXJlY3RpdmVTdHlsaW5nSW5kZXggPSBnZXRBY3RpdmVEaXJlY3RpdmVTdHlsaW5nSW5kZXgoKTtcbiAgaWYgKGRpcmVjdGl2ZVN0eWxpbmdJbmRleCkge1xuICAgIGNvbnN0IGFyZ3M6IFBhcmFtc09mPHR5cGVvZiB1cGRhdGVzdHlsZVByb3A+ID1cbiAgICAgICAgW3N0eWxpbmdDb250ZXh0LCBzdHlsZUluZGV4LCB2YWx1ZVRvQWRkLCBkaXJlY3RpdmVTdHlsaW5nSW5kZXgsIGZvcmNlT3ZlcnJpZGVdO1xuICAgIGVucXVldWVIb3N0SW5zdHJ1Y3Rpb24oc3R5bGluZ0NvbnRleHQsIGRpcmVjdGl2ZVN0eWxpbmdJbmRleCwgdXBkYXRlc3R5bGVQcm9wLCBhcmdzKTtcbiAgfSBlbHNlIHtcbiAgICB1cGRhdGVzdHlsZVByb3AoXG4gICAgICAgIHN0eWxpbmdDb250ZXh0LCBzdHlsZUluZGV4LCB2YWx1ZVRvQWRkLCBERUZBVUxUX1RFTVBMQVRFX0RJUkVDVElWRV9JTkRFWCwgZm9yY2VPdmVycmlkZSk7XG4gIH1cblxuICBpZiAocnVudGltZUlzTmV3U3R5bGluZ0luVXNlKCkpIHtcbiAgICBjb25zdCBwcm9wID0gZ2V0QmluZGluZ05hbWVGcm9tSW5kZXgoc3R5bGluZ0NvbnRleHQsIHN0eWxlSW5kZXgsIGRpcmVjdGl2ZVN0eWxpbmdJbmRleCwgZmFsc2UpO1xuXG4gICAgLy8gdGhlIHJlYXNvbiB3aHkgd2UgY2FzdCB0aGUgdmFsdWUgYXMgYGJvb2xlYW5gIGlzXG4gICAgLy8gYmVjYXVzZSB0aGUgbmV3IHN0eWxpbmcgcmVmYWN0b3IgZG9lcyBub3QgeWV0IHN1cHBvcnRcbiAgICAvLyBzYW5pdGl6YXRpb24gb3IgYW5pbWF0aW9uIHBsYXllcnMuXG4gICAgbmV3U3R5bGVQcm9wKHByb3AsIHZhbHVlIGFzIHN0cmluZyB8IG51bWJlciwgc3VmZml4KTtcbiAgfVxufVxuXG5mdW5jdGlvbiByZXNvbHZlU3R5bGVQcm9wVmFsdWUoXG4gICAgdmFsdWU6IHN0cmluZyB8IG51bWJlciB8IFN0cmluZyB8IFBsYXllckZhY3RvcnkgfCBudWxsLCBzdWZmaXg6IHN0cmluZyB8IG51bGwgfCB1bmRlZmluZWQpIHtcbiAgbGV0IHZhbHVlVG9BZGQ6IHN0cmluZ3xudWxsID0gbnVsbDtcbiAgaWYgKHZhbHVlICE9PSBudWxsKSB7XG4gICAgaWYgKHN1ZmZpeCkge1xuICAgICAgLy8gd2hlbiBhIHN1ZmZpeCBpcyBhcHBsaWVkIHRoZW4gaXQgd2lsbCBieXBhc3NcbiAgICAgIC8vIHNhbml0aXphdGlvbiBlbnRpcmVseSAoYi9jIGEgbmV3IHN0cmluZyBpcyBjcmVhdGVkKVxuICAgICAgdmFsdWVUb0FkZCA9IHJlbmRlclN0cmluZ2lmeSh2YWx1ZSkgKyBzdWZmaXg7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIHNhbml0aXphdGlvbiBoYXBwZW5zIGJ5IGRlYWxpbmcgd2l0aCBhIFN0cmluZyB2YWx1ZVxuICAgICAgLy8gdGhpcyBtZWFucyB0aGF0IHRoZSBzdHJpbmcgdmFsdWUgd2lsbCBiZSBwYXNzZWQgdGhyb3VnaFxuICAgICAgLy8gaW50byB0aGUgc3R5bGUgcmVuZGVyaW5nIGxhdGVyICh3aGljaCBpcyB3aGVyZSB0aGUgdmFsdWVcbiAgICAgIC8vIHdpbGwgYmUgc2FuaXRpemVkIGJlZm9yZSBpdCBpcyBhcHBsaWVkKVxuICAgICAgdmFsdWVUb0FkZCA9IHZhbHVlIGFzIGFueSBhcyBzdHJpbmc7XG4gICAgfVxuICB9XG4gIHJldHVybiB2YWx1ZVRvQWRkO1xufVxuXG5cbi8qKlxuICogVXBkYXRlIGEgY2xhc3MgYmluZGluZyBvbiBhbiBlbGVtZW50IHdpdGggdGhlIHByb3ZpZGVkIHZhbHVlLlxuICpcbiAqIFRoaXMgaW5zdHJ1Y3Rpb24gaXMgbWVhbnQgdG8gaGFuZGxlIHRoZSBgW2NsYXNzLmZvb109XCJleHBcImAgY2FzZSBhbmQsXG4gKiB0aGVyZWZvcmUsIHRoZSBjbGFzcyBiaW5kaW5nIGl0c2VsZiBtdXN0IGFscmVhZHkgYmUgYWxsb2NhdGVkIHVzaW5nXG4gKiBgc3R5bGluZ2Agd2l0aGluIHRoZSBjcmVhdGlvbiBibG9jay5cbiAqXG4gKiBAcGFyYW0gY2xhc3NJbmRleCBJbmRleCBvZiBjbGFzcyB0byB0b2dnbGUuIFRoaXMgaW5kZXggdmFsdWUgcmVmZXJzIHRvIHRoZVxuICogICAgICAgIGluZGV4IG9mIHRoZSBjbGFzcyBpbiB0aGUgY2xhc3MgYmluZGluZ3MgYXJyYXkgdGhhdCB3YXMgcGFzc2VkIGludG9cbiAqICAgICAgICBgc3R5bGluZ2AgKHdoaWNoIGlzIG1lYW50IHRvIGJlIGNhbGxlZCBiZWZvcmUgdGhpc1xuICogICAgICAgIGZ1bmN0aW9uIGlzKS5cbiAqIEBwYXJhbSB2YWx1ZSBBIHRydWUvZmFsc2UgdmFsdWUgd2hpY2ggd2lsbCB0dXJuIHRoZSBjbGFzcyBvbiBvciBvZmYuXG4gKiBAcGFyYW0gZm9yY2VPdmVycmlkZSBXaGV0aGVyIG9yIG5vdCB0aGlzIHZhbHVlIHdpbGwgYmUgYXBwbGllZCByZWdhcmRsZXNzXG4gKiAgICAgICAgb2Ygd2hlcmUgaXQgaXMgYmVpbmcgc2V0IHdpdGhpbiB0aGUgc3R5bGluZyBwcmlvcml0eSBzdHJ1Y3R1cmUuXG4gKlxuICogTm90ZSB0aGF0IHRoaXMgd2lsbCBhcHBseSB0aGUgcHJvdmlkZWQgY2xhc3MgdmFsdWUgdG8gdGhlIGhvc3QgZWxlbWVudCBpZiB0aGlzIGZ1bmN0aW9uXG4gKiBpcyBjYWxsZWQgd2l0aGluIGEgaG9zdCBiaW5kaW5nLlxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1Y2xhc3NQcm9wKFxuICAgIGNsYXNzSW5kZXg6IG51bWJlciwgdmFsdWU6IGJvb2xlYW4gfCBQbGF5ZXJGYWN0b3J5LCBmb3JjZU92ZXJyaWRlPzogYm9vbGVhbik6IHZvaWQge1xuICBjb25zdCBpbmRleCA9IGdldFNlbGVjdGVkSW5kZXgoKTtcbiAgY29uc3QgaW5wdXQgPSAodmFsdWUgaW5zdGFuY2VvZiBCb3VuZFBsYXllckZhY3RvcnkpID9cbiAgICAgICh2YWx1ZSBhcyBCb3VuZFBsYXllckZhY3Rvcnk8Ym9vbGVhbnxudWxsPikgOlxuICAgICAgYm9vbGVhbk9yTnVsbCh2YWx1ZSk7XG4gIGNvbnN0IGRpcmVjdGl2ZVN0eWxpbmdJbmRleCA9IGdldEFjdGl2ZURpcmVjdGl2ZVN0eWxpbmdJbmRleCgpO1xuICBjb25zdCBzdHlsaW5nQ29udGV4dCA9IGdldFN0eWxpbmdDb250ZXh0KGluZGV4LCBnZXRMVmlldygpKTtcbiAgaWYgKGRpcmVjdGl2ZVN0eWxpbmdJbmRleCkge1xuICAgIGNvbnN0IGFyZ3M6IFBhcmFtc09mPHR5cGVvZiB1cGRhdGVjbGFzc1Byb3A+ID1cbiAgICAgICAgW3N0eWxpbmdDb250ZXh0LCBjbGFzc0luZGV4LCBpbnB1dCwgZGlyZWN0aXZlU3R5bGluZ0luZGV4LCBmb3JjZU92ZXJyaWRlXTtcbiAgICBlbnF1ZXVlSG9zdEluc3RydWN0aW9uKHN0eWxpbmdDb250ZXh0LCBkaXJlY3RpdmVTdHlsaW5nSW5kZXgsIHVwZGF0ZWNsYXNzUHJvcCwgYXJncyk7XG4gIH0gZWxzZSB7XG4gICAgdXBkYXRlY2xhc3NQcm9wKFxuICAgICAgICBzdHlsaW5nQ29udGV4dCwgY2xhc3NJbmRleCwgaW5wdXQsIERFRkFVTFRfVEVNUExBVEVfRElSRUNUSVZFX0lOREVYLCBmb3JjZU92ZXJyaWRlKTtcbiAgfVxuXG4gIGlmIChydW50aW1lSXNOZXdTdHlsaW5nSW5Vc2UoKSkge1xuICAgIGNvbnN0IHByb3AgPSBnZXRCaW5kaW5nTmFtZUZyb21JbmRleChzdHlsaW5nQ29udGV4dCwgY2xhc3NJbmRleCwgZGlyZWN0aXZlU3R5bGluZ0luZGV4LCB0cnVlKTtcblxuICAgIC8vIHRoZSByZWFzb24gd2h5IHdlIGNhc3QgdGhlIHZhbHVlIGFzIGBib29sZWFuYCBpc1xuICAgIC8vIGJlY2F1c2UgdGhlIG5ldyBzdHlsaW5nIHJlZmFjdG9yIGRvZXMgbm90IHlldCBzdXBwb3J0XG4gICAgLy8gc2FuaXRpemF0aW9uIG9yIGFuaW1hdGlvbiBwbGF5ZXJzLlxuICAgIG5ld0NsYXNzUHJvcChwcm9wLCBpbnB1dCBhcyBib29sZWFuKTtcbiAgfVxufVxuXG5cbmZ1bmN0aW9uIGJvb2xlYW5Pck51bGwodmFsdWU6IGFueSk6IGJvb2xlYW58bnVsbCB7XG4gIGlmICh0eXBlb2YgdmFsdWUgPT09ICdib29sZWFuJykgcmV0dXJuIHZhbHVlO1xuICByZXR1cm4gdmFsdWUgPyB0cnVlIDogbnVsbDtcbn1cblxuXG4vKipcbiAqIFVwZGF0ZSBzdHlsZSBiaW5kaW5ncyB1c2luZyBhbiBvYmplY3QgbGl0ZXJhbCBvbiBhbiBlbGVtZW50LlxuICpcbiAqIFRoaXMgaW5zdHJ1Y3Rpb24gaXMgbWVhbnQgdG8gYXBwbHkgc3R5bGluZyB2aWEgdGhlIGBbc3R5bGVdPVwiZXhwXCJgIHRlbXBsYXRlIGJpbmRpbmdzLlxuICogV2hlbiBzdHlsZXMgYXJlIGFwcGxpZWQgdG8gdGhlIGVsZW1lbnQgdGhleSB3aWxsIHRoZW4gYmUgdXBkYXRlZCB3aXRoIHJlc3BlY3QgdG9cbiAqIGFueSBzdHlsZXMvY2xhc3NlcyBzZXQgdmlhIGBzdHlsZVByb3BgLiBJZiBhbnkgc3R5bGVzIGFyZSBzZXQgdG8gZmFsc3lcbiAqIHRoZW4gdGhleSB3aWxsIGJlIHJlbW92ZWQgZnJvbSB0aGUgZWxlbWVudC5cbiAqXG4gKiBOb3RlIHRoYXQgdGhlIHN0eWxpbmcgaW5zdHJ1Y3Rpb24gd2lsbCBub3QgYmUgYXBwbGllZCB1bnRpbCBgc3R5bGluZ0FwcGx5YCBpcyBjYWxsZWQuXG4gKlxuICogQHBhcmFtIHN0eWxlcyBBIGtleS92YWx1ZSBzdHlsZSBtYXAgb2YgdGhlIHN0eWxlcyB0aGF0IHdpbGwgYmUgYXBwbGllZCB0byB0aGUgZ2l2ZW4gZWxlbWVudC5cbiAqICAgICAgICBBbnkgbWlzc2luZyBzdHlsZXMgKHRoYXQgaGF2ZSBhbHJlYWR5IGJlZW4gYXBwbGllZCB0byB0aGUgZWxlbWVudCBiZWZvcmVoYW5kKSB3aWxsIGJlXG4gKiAgICAgICAgcmVtb3ZlZCAodW5zZXQpIGZyb20gdGhlIGVsZW1lbnQncyBzdHlsaW5nLlxuICpcbiAqIE5vdGUgdGhhdCB0aGlzIHdpbGwgYXBwbHkgdGhlIHByb3ZpZGVkIHN0eWxlTWFwIHZhbHVlIHRvIHRoZSBob3N0IGVsZW1lbnQgaWYgdGhpcyBmdW5jdGlvblxuICogaXMgY2FsbGVkIHdpdGhpbiBhIGhvc3QgYmluZGluZy5cbiAqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtXN0eWxlTWFwKHN0eWxlczoge1tzdHlsZU5hbWU6IHN0cmluZ106IGFueX0gfCBOT19DSEFOR0UgfCBudWxsKTogdm9pZCB7XG4gIGNvbnN0IGluZGV4ID0gZ2V0U2VsZWN0ZWRJbmRleCgpO1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IHN0eWxpbmdDb250ZXh0ID0gZ2V0U3R5bGluZ0NvbnRleHQoaW5kZXgsIGxWaWV3KTtcbiAgY29uc3QgZGlyZWN0aXZlU3R5bGluZ0luZGV4ID0gZ2V0QWN0aXZlRGlyZWN0aXZlU3R5bGluZ0luZGV4KCk7XG4gIGlmIChkaXJlY3RpdmVTdHlsaW5nSW5kZXgpIHtcbiAgICBjb25zdCBhcmdzOiBQYXJhbXNPZjx0eXBlb2YgdXBkYXRlU3R5bGVNYXA+ID0gW3N0eWxpbmdDb250ZXh0LCBzdHlsZXMsIGRpcmVjdGl2ZVN0eWxpbmdJbmRleF07XG4gICAgZW5xdWV1ZUhvc3RJbnN0cnVjdGlvbihzdHlsaW5nQ29udGV4dCwgZGlyZWN0aXZlU3R5bGluZ0luZGV4LCB1cGRhdGVTdHlsZU1hcCwgYXJncyk7XG4gIH0gZWxzZSB7XG4gICAgY29uc3QgdE5vZGUgPSBnZXRUTm9kZShpbmRleCwgbFZpZXcpO1xuXG4gICAgLy8gaW5wdXRzIGFyZSBvbmx5IGV2YWx1YXRlZCBmcm9tIGEgdGVtcGxhdGUgYmluZGluZyBpbnRvIGEgZGlyZWN0aXZlLCB0aGVyZWZvcmUsXG4gICAgLy8gdGhlcmUgc2hvdWxkIG5vdCBiZSBhIHNpdHVhdGlvbiB3aGVyZSBhIGRpcmVjdGl2ZSBob3N0IGJpbmRpbmdzIGZ1bmN0aW9uXG4gICAgLy8gZXZhbHVhdGVzIHRoZSBpbnB1dHMgKHRoaXMgc2hvdWxkIG9ubHkgaGFwcGVuIGluIHRoZSB0ZW1wbGF0ZSBmdW5jdGlvbilcbiAgICBpZiAoaGFzU3R5bGVJbnB1dCh0Tm9kZSkgJiYgc3R5bGVzICE9PSBOT19DSEFOR0UpIHtcbiAgICAgIGNvbnN0IGluaXRpYWxTdHlsZXMgPSBnZXRJbml0aWFsQ2xhc3NOYW1lVmFsdWUoc3R5bGluZ0NvbnRleHQpO1xuICAgICAgY29uc3Qgc3R5bGVJbnB1dFZhbCA9XG4gICAgICAgICAgKGluaXRpYWxTdHlsZXMubGVuZ3RoID8gKGluaXRpYWxTdHlsZXMgKyAnICcpIDogJycpICsgZm9yY2VTdHlsZXNBc1N0cmluZyhzdHlsZXMpO1xuICAgICAgc2V0SW5wdXRzRm9yUHJvcGVydHkobFZpZXcsIHROb2RlLmlucHV0cyAhWydzdHlsZSddICEsIHN0eWxlSW5wdXRWYWwpO1xuICAgICAgc3R5bGVzID0gTk9fQ0hBTkdFO1xuICAgIH1cbiAgICB1cGRhdGVTdHlsZU1hcChzdHlsaW5nQ29udGV4dCwgc3R5bGVzKTtcbiAgfVxuXG4gIGlmIChydW50aW1lSXNOZXdTdHlsaW5nSW5Vc2UoKSkge1xuICAgIG5ld1N0eWxlTWFwKHN0eWxlcyk7XG4gIH1cbn1cblxuXG4vKipcbiAqIFVwZGF0ZSBjbGFzcyBiaW5kaW5ncyB1c2luZyBhbiBvYmplY3QgbGl0ZXJhbCBvciBjbGFzcy1zdHJpbmcgb24gYW4gZWxlbWVudC5cbiAqXG4gKiBUaGlzIGluc3RydWN0aW9uIGlzIG1lYW50IHRvIGFwcGx5IHN0eWxpbmcgdmlhIHRoZSBgW2NsYXNzXT1cImV4cFwiYCB0ZW1wbGF0ZSBiaW5kaW5ncy5cbiAqIFdoZW4gY2xhc3NlcyBhcmUgYXBwbGllZCB0byB0aGUgZWxlbWVudCB0aGV5IHdpbGwgdGhlbiBiZSB1cGRhdGVkIHdpdGhcbiAqIHJlc3BlY3QgdG8gYW55IHN0eWxlcy9jbGFzc2VzIHNldCB2aWEgYGNsYXNzUHJvcGAuIElmIGFueVxuICogY2xhc3NlcyBhcmUgc2V0IHRvIGZhbHN5IHRoZW4gdGhleSB3aWxsIGJlIHJlbW92ZWQgZnJvbSB0aGUgZWxlbWVudC5cbiAqXG4gKiBOb3RlIHRoYXQgdGhlIHN0eWxpbmcgaW5zdHJ1Y3Rpb24gd2lsbCBub3QgYmUgYXBwbGllZCB1bnRpbCBgc3R5bGluZ0FwcGx5YCBpcyBjYWxsZWQuXG4gKiBOb3RlIHRoYXQgdGhpcyB3aWxsIHRoZSBwcm92aWRlZCBjbGFzc01hcCB2YWx1ZSB0byB0aGUgaG9zdCBlbGVtZW50IGlmIHRoaXMgZnVuY3Rpb24gaXMgY2FsbGVkXG4gKiB3aXRoaW4gYSBob3N0IGJpbmRpbmcuXG4gKlxuICogQHBhcmFtIGNsYXNzZXMgQSBrZXkvdmFsdWUgbWFwIG9yIHN0cmluZyBvZiBDU1MgY2xhc3NlcyB0aGF0IHdpbGwgYmUgYWRkZWQgdG8gdGhlXG4gKiAgICAgICAgZ2l2ZW4gZWxlbWVudC4gQW55IG1pc3NpbmcgY2xhc3NlcyAodGhhdCBoYXZlIGFscmVhZHkgYmVlbiBhcHBsaWVkIHRvIHRoZSBlbGVtZW50XG4gKiAgICAgICAgYmVmb3JlaGFuZCkgd2lsbCBiZSByZW1vdmVkICh1bnNldCkgZnJvbSB0aGUgZWxlbWVudCdzIGxpc3Qgb2YgQ1NTIGNsYXNzZXMuXG4gKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIMm1ybVjbGFzc01hcChjbGFzc2VzOiB7W3N0eWxlTmFtZTogc3RyaW5nXTogYW55fSB8IHN0cmluZyB8IG51bGwpOiB2b2lkIHtcbiAgY29uc3QgaW5kZXggPSBnZXRTZWxlY3RlZEluZGV4KCk7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3Qgc3R5bGluZ0NvbnRleHQgPSBnZXRTdHlsaW5nQ29udGV4dChpbmRleCwgbFZpZXcpO1xuICBjb25zdCBkaXJlY3RpdmVTdHlsaW5nSW5kZXggPSBnZXRBY3RpdmVEaXJlY3RpdmVTdHlsaW5nSW5kZXgoKTtcbiAgaWYgKGRpcmVjdGl2ZVN0eWxpbmdJbmRleCkge1xuICAgIGNvbnN0IGFyZ3M6IFBhcmFtc09mPHR5cGVvZiB1cGRhdGVDbGFzc01hcD4gPSBbc3R5bGluZ0NvbnRleHQsIGNsYXNzZXMsIGRpcmVjdGl2ZVN0eWxpbmdJbmRleF07XG4gICAgZW5xdWV1ZUhvc3RJbnN0cnVjdGlvbihzdHlsaW5nQ29udGV4dCwgZGlyZWN0aXZlU3R5bGluZ0luZGV4LCB1cGRhdGVDbGFzc01hcCwgYXJncyk7XG4gIH0gZWxzZSB7XG4gICAgY29uc3QgdE5vZGUgPSBnZXRUTm9kZShpbmRleCwgbFZpZXcpO1xuICAgIC8vIGlucHV0cyBhcmUgb25seSBldmFsdWF0ZWQgZnJvbSBhIHRlbXBsYXRlIGJpbmRpbmcgaW50byBhIGRpcmVjdGl2ZSwgdGhlcmVmb3JlLFxuICAgIC8vIHRoZXJlIHNob3VsZCBub3QgYmUgYSBzaXR1YXRpb24gd2hlcmUgYSBkaXJlY3RpdmUgaG9zdCBiaW5kaW5ncyBmdW5jdGlvblxuICAgIC8vIGV2YWx1YXRlcyB0aGUgaW5wdXRzICh0aGlzIHNob3VsZCBvbmx5IGhhcHBlbiBpbiB0aGUgdGVtcGxhdGUgZnVuY3Rpb24pXG4gICAgaWYgKGhhc0NsYXNzSW5wdXQodE5vZGUpKSB7XG4gICAgICBjb25zdCBpbml0aWFsQ2xhc3NlcyA9IGdldEluaXRpYWxDbGFzc05hbWVWYWx1ZShzdHlsaW5nQ29udGV4dCk7XG4gICAgICBjb25zdCBjbGFzc0lucHV0VmFsID1cbiAgICAgICAgICAoaW5pdGlhbENsYXNzZXMubGVuZ3RoID8gKGluaXRpYWxDbGFzc2VzICsgJyAnKSA6ICcnKSArIGZvcmNlQ2xhc3Nlc0FzU3RyaW5nKGNsYXNzZXMpO1xuICAgICAgc2V0SW5wdXRzRm9yUHJvcGVydHkobFZpZXcsIHROb2RlLmlucHV0cyAhWydjbGFzcyddICEsIGNsYXNzSW5wdXRWYWwpO1xuICAgICAgY2xhc3NlcyA9IE5PX0NIQU5HRTtcbiAgICB9XG4gICAgdXBkYXRlQ2xhc3NNYXAoc3R5bGluZ0NvbnRleHQsIGNsYXNzZXMpO1xuICB9XG5cbiAgaWYgKHJ1bnRpbWVJc05ld1N0eWxpbmdJblVzZSgpKSB7XG4gICAgbmV3Q2xhc3NNYXAoY2xhc3Nlcyk7XG4gIH1cbn1cblxuLyoqXG4gKiBBcHBseSBhbGwgc3R5bGUgYW5kIGNsYXNzIGJpbmRpbmcgdmFsdWVzIHRvIHRoZSBlbGVtZW50LlxuICpcbiAqIFRoaXMgaW5zdHJ1Y3Rpb24gaXMgbWVhbnQgdG8gYmUgcnVuIGFmdGVyIGBzdHlsZU1hcGAsIGBjbGFzc01hcGAsXG4gKiBgc3R5bGVQcm9wYCBvciBgY2xhc3NQcm9wYCBpbnN0cnVjdGlvbnMgaGF2ZSBiZWVuIHJ1biBhbmQgd2lsbFxuICogb25seSBhcHBseSBzdHlsaW5nIHRvIHRoZSBlbGVtZW50IGlmIGFueSBzdHlsaW5nIGJpbmRpbmdzIGhhdmUgYmVlbiB1cGRhdGVkLlxuICpcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1c3R5bGluZ0FwcGx5KCk6IHZvaWQge1xuICBjb25zdCBpbmRleCA9IGdldFNlbGVjdGVkSW5kZXgoKTtcbiAgY29uc3QgZGlyZWN0aXZlU3R5bGluZ0luZGV4ID1cbiAgICAgIGdldEFjdGl2ZURpcmVjdGl2ZVN0eWxpbmdJbmRleCgpIHx8IERFRkFVTFRfVEVNUExBVEVfRElSRUNUSVZFX0lOREVYO1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IHROb2RlID0gZ2V0VE5vZGUoaW5kZXgsIGxWaWV3KTtcblxuICAvLyBpZiBhIG5vbi1lbGVtZW50IHZhbHVlIGlzIGJlaW5nIHByb2Nlc3NlZCB0aGVuIHdlIGNhbid0IHJlbmRlciB2YWx1ZXNcbiAgLy8gb24gdGhlIGVsZW1lbnQgYXQgYWxsIHRoZXJlZm9yZSBieSBzZXR0aW5nIHRoZSByZW5kZXJlciB0byBudWxsIHRoZW5cbiAgLy8gdGhlIHN0eWxpbmcgYXBwbHkgY29kZSBrbm93cyBub3QgdG8gYWN0dWFsbHkgYXBwbHkgdGhlIHZhbHVlcy4uLlxuICBjb25zdCByZW5kZXJlciA9IHROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5FbGVtZW50ID8gbFZpZXdbUkVOREVSRVJdIDogbnVsbDtcbiAgY29uc3QgaXNGaXJzdFJlbmRlciA9IChsVmlld1tGTEFHU10gJiBMVmlld0ZsYWdzLkZpcnN0TFZpZXdQYXNzKSAhPT0gMDtcbiAgY29uc3Qgc3R5bGluZ0NvbnRleHQgPSBnZXRTdHlsaW5nQ29udGV4dChpbmRleCwgbFZpZXcpO1xuXG4gIGlmIChydW50aW1lQWxsb3dPbGRTdHlsaW5nKCkpIHtcbiAgICBjb25zdCB0b3RhbFBsYXllcnNRdWV1ZWQgPSByZW5kZXJTdHlsaW5nKFxuICAgICAgICBzdHlsaW5nQ29udGV4dCwgcmVuZGVyZXIsIGxWaWV3LCBpc0ZpcnN0UmVuZGVyLCBudWxsLCBudWxsLCBkaXJlY3RpdmVTdHlsaW5nSW5kZXgpO1xuICAgIGlmICh0b3RhbFBsYXllcnNRdWV1ZWQgPiAwKSB7XG4gICAgICBjb25zdCByb290Q29udGV4dCA9IGdldFJvb3RDb250ZXh0KGxWaWV3KTtcbiAgICAgIHNjaGVkdWxlVGljayhyb290Q29udGV4dCwgUm9vdENvbnRleHRGbGFncy5GbHVzaFBsYXllcnMpO1xuICAgIH1cbiAgfVxuXG4gIC8vIGJlY2F1c2Ugc2VsZWN0KG4pIG1heSBub3QgcnVuIGJldHdlZW4gZXZlcnkgaW5zdHJ1Y3Rpb24sIHRoZSBjYWNoZWQgc3R5bGluZ1xuICAvLyBjb250ZXh0IG1heSBub3QgZ2V0IGNsZWFyZWQgYmV0d2VlbiBlbGVtZW50cy4gVGhlIHJlYXNvbiBmb3IgdGhpcyBpcyBiZWNhdXNlXG4gIC8vIHN0eWxpbmcgYmluZGluZ3MgKGxpa2UgYFtzdHlsZV1gIGFuZCBgW2NsYXNzXWApIGFyZSBub3QgcmVjb2duaXplZCBhcyBwcm9wZXJ0eVxuICAvLyBiaW5kaW5ncyBieSBkZWZhdWx0IHNvIGEgc2VsZWN0KG4pIGluc3RydWN0aW9uIGlzIG5vdCBnZW5lcmF0ZWQuIFRvIGVuc3VyZSB0aGVcbiAgLy8gY29udGV4dCBpcyBsb2FkZWQgY29ycmVjdGx5IGZvciB0aGUgbmV4dCBlbGVtZW50IHRoZSBjYWNoZSBiZWxvdyBpcyBwcmUtZW1wdGl2ZWx5XG4gIC8vIGNsZWFyZWQgYmVjYXVzZSB0aGVyZSBpcyBubyBjb2RlIGluIEFuZ3VsYXIgdGhhdCBhcHBsaWVzIG1vcmUgc3R5bGluZyBjb2RlIGFmdGVyIGFcbiAgLy8gc3R5bGluZyBmbHVzaCBoYXMgb2NjdXJyZWQuIE5vdGUgdGhhdCB0aGlzIHdpbGwgYmUgZml4ZWQgb25jZSBGVy0xMjU0IGxhbmRzLlxuICBzZXRDYWNoZWRTdHlsaW5nQ29udGV4dChudWxsKTtcblxuICBpZiAocnVudGltZUlzTmV3U3R5bGluZ0luVXNlKCkpIHtcbiAgICBuZXdTdHlsaW5nQXBwbHkoKTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0QWN0aXZlRGlyZWN0aXZlU3R5bGluZ0luZGV4KCkge1xuICAvLyB3aGVuZXZlciBhIGRpcmVjdGl2ZSdzIGhvc3RCaW5kaW5ncyBmdW5jdGlvbiBpcyBjYWxsZWQgYSB1bmlxdWVJZCB2YWx1ZVxuICAvLyBpcyBhc3NpZ25lZC4gTm9ybWFsbHkgdGhpcyBpcyBlbm91Z2ggdG8gaGVscCBkaXN0aW5ndWlzaCBvbmUgZGlyZWN0aXZlXG4gIC8vIGZyb20gYW5vdGhlciBmb3IgdGhlIHN0eWxpbmcgY29udGV4dCwgYnV0IHRoZXJlIGFyZSBzaXR1YXRpb25zIHdoZXJlIGFcbiAgLy8gc3ViLWNsYXNzIGRpcmVjdGl2ZSBjb3VsZCBpbmhlcml0IGFuZCBhc3NpZ24gc3R5bGluZyBpbiBjb25jZXJ0IHdpdGggYVxuICAvLyBwYXJlbnQgZGlyZWN0aXZlLiBUbyBoZWxwIHRoZSBzdHlsaW5nIGNvZGUgZGlzdGluZ3Vpc2ggYmV0d2VlbiBhIHBhcmVudFxuICAvLyBzdWItY2xhc3NlZCBkaXJlY3RpdmUgdGhlIGluaGVyaXRhbmNlIGRlcHRoIGlzIHRha2VuIGludG8gYWNjb3VudCBhcyB3ZWxsLlxuICByZXR1cm4gZ2V0QWN0aXZlRGlyZWN0aXZlSWQoKSArIGdldEFjdGl2ZURpcmVjdGl2ZVN1cGVyQ2xhc3NEZXB0aCgpO1xufVxuXG5mdW5jdGlvbiBnZXRTdHlsaW5nQ29udGV4dChpbmRleDogbnVtYmVyLCBsVmlldzogTFZpZXcpIHtcbiAgbGV0IGNvbnRleHQgPSBnZXRDYWNoZWRTdHlsaW5nQ29udGV4dCgpO1xuICBpZiAoIWNvbnRleHQpIHtcbiAgICBjb250ZXh0ID0gZ2V0U3R5bGluZ0NvbnRleHRGcm9tTFZpZXcoaW5kZXggKyBIRUFERVJfT0ZGU0VULCBsVmlldyk7XG4gICAgc2V0Q2FjaGVkU3R5bGluZ0NvbnRleHQoY29udGV4dCk7XG4gIH0gZWxzZSBpZiAobmdEZXZNb2RlKSB7XG4gICAgY29uc3QgYWN0dWFsQ29udGV4dCA9IGdldFN0eWxpbmdDb250ZXh0RnJvbUxWaWV3KGluZGV4ICsgSEVBREVSX09GRlNFVCwgbFZpZXcpO1xuICAgIGFzc2VydEVxdWFsKGNvbnRleHQsIGFjdHVhbENvbnRleHQsICdUaGUgY2FjaGVkIHN0eWxpbmcgY29udGV4dCBpcyBpbnZhbGlkJyk7XG4gIH1cbiAgcmV0dXJuIGNvbnRleHQ7XG59XG4iXX0=