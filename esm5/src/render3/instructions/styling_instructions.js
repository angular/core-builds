import { FLAGS, HEADER_OFFSET, RENDERER } from '../interfaces/view';
import { getActiveHostContext, getActiveHostElementIndex, getLView, getPreviousOrParentTNode } from '../state';
import { getInitialClassNameValue, renderStyling, updateClassProp as updateElementClassProp, updateContextWithBindings, updateStyleProp as updateElementStyleProp, updateStylingMap } from '../styling/class_and_style_bindings';
import { BoundPlayerFactory } from '../styling/player_factory';
import { allocateDirectiveIntoContext, createEmptyStylingContext, forceClassesAsString, forceStylesAsString, getStylingContext, hasClassInput, hasStyleInput } from '../styling/util';
import { NO_CHANGE } from '../tokens';
import { renderStringify } from '../util/misc_utils';
import { getRootContext } from '../util/view_traversal_utils';
import { getTNode } from '../util/view_utils';
import { scheduleTick } from './instructions';
import { setInputsForProperty } from './shared';
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
    initElementStyling(tNode, classBindingNames, styleBindingNames, styleSanitizer, null);
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
    var directive = getActiveHostContext();
    // despite the binding being applied in a queue (below), the allocation
    // of the directive into the context happens right away. The reason for
    // this is to retain the ordering of the directives (which is important
    // for the prioritization of bindings).
    allocateDirectiveIntoContext(tNode.stylingTemplate, directive);
    var fns = tNode.onElementCreationFns = tNode.onElementCreationFns || [];
    fns.push(function () { return initElementStyling(tNode, classBindingNames, styleBindingNames, styleSanitizer, directive); });
}
function initElementStyling(tNode, classBindingNames, styleBindingNames, styleSanitizer, directive) {
    updateContextWithBindings(tNode.stylingTemplate, directive || null, classBindingNames, styleBindingNames, styleSanitizer);
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
    elementStylePropInternal(null, index, styleIndex, value, suffix, forceOverride);
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
    elementStylePropInternal(getActiveHostContext(), getActiveHostElementIndex(), styleIndex, value, suffix, forceOverride);
}
function elementStylePropInternal(directive, index, styleIndex, value, suffix, forceOverride) {
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
    updateElementStyleProp(getStylingContext(index + HEADER_OFFSET, getLView()), styleIndex, valueToAdd, directive, forceOverride);
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
    elementClassPropInternal(null, index, classIndex, value, forceOverride);
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
    elementClassPropInternal(getActiveHostContext(), getActiveHostElementIndex(), classIndex, value, forceOverride);
}
function elementClassPropInternal(directive, index, classIndex, value, forceOverride) {
    var input = (value instanceof BoundPlayerFactory) ?
        value :
        booleanOrNull(value);
    updateElementClassProp(getStylingContext(index + HEADER_OFFSET, getLView()), classIndex, input, directive, forceOverride);
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
    elementStylingMapInternal(null, index, classes, styles);
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
    elementStylingMapInternal(getActiveHostContext(), getActiveHostElementIndex(), classes, styles);
}
function elementStylingMapInternal(directive, index, classes, styles) {
    var lView = getLView();
    var tNode = getTNode(index, lView);
    var stylingContext = getStylingContext(index + HEADER_OFFSET, lView);
    // inputs are only evaluated from a template binding into a directive, therefore,
    // there should not be a situation where a directive host bindings function
    // evaluates the inputs (this should only happen in the template function)
    if (!directive) {
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
    }
    updateStylingMap(stylingContext, classes, styles, directive);
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
    elementStylingApplyInternal(null, index);
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
    elementStylingApplyInternal(getActiveHostContext(), getActiveHostElementIndex());
}
export function elementStylingApplyInternal(directive, index) {
    var lView = getLView();
    var isFirstRender = (lView[FLAGS] & 8 /* FirstLViewPass */) !== 0;
    var totalPlayersQueued = renderStyling(getStylingContext(index + HEADER_OFFSET, lView), lView[RENDERER], lView, isFirstRender, null, null, directive);
    if (totalPlayersQueued > 0) {
        var rootContext = getRootContext(lView);
        scheduleTick(rootContext, 2 /* FlushPlayers */);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3R5bGluZ19pbnN0cnVjdGlvbnMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2luc3RydWN0aW9ucy9zdHlsaW5nX2luc3RydWN0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFVQSxPQUFPLEVBQUMsS0FBSyxFQUFFLGFBQWEsRUFBYyxRQUFRLEVBQW1CLE1BQU0sb0JBQW9CLENBQUM7QUFDaEcsT0FBTyxFQUFDLG9CQUFvQixFQUFFLHlCQUF5QixFQUFFLFFBQVEsRUFBRSx3QkFBd0IsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUM3RyxPQUFPLEVBQUMsd0JBQXdCLEVBQUUsYUFBYSxFQUFFLGVBQWUsSUFBSSxzQkFBc0IsRUFBRSx5QkFBeUIsRUFBRSxlQUFlLElBQUksc0JBQXNCLEVBQUUsZ0JBQWdCLEVBQUMsTUFBTSxxQ0FBcUMsQ0FBQztBQUMvTixPQUFPLEVBQUMsa0JBQWtCLEVBQUMsTUFBTSwyQkFBMkIsQ0FBQztBQUM3RCxPQUFPLEVBQUMsNEJBQTRCLEVBQUUseUJBQXlCLEVBQUUsb0JBQW9CLEVBQUUsbUJBQW1CLEVBQUUsaUJBQWlCLEVBQUUsYUFBYSxFQUFFLGFBQWEsRUFBQyxNQUFNLGlCQUFpQixDQUFDO0FBQ3BMLE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxXQUFXLENBQUM7QUFDcEMsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLG9CQUFvQixDQUFDO0FBQ25ELE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSw4QkFBOEIsQ0FBQztBQUM1RCxPQUFPLEVBQUMsUUFBUSxFQUFDLE1BQU0sb0JBQW9CLENBQUM7QUFFNUMsT0FBTyxFQUFDLFlBQVksRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBQzVDLE9BQU8sRUFBQyxvQkFBb0IsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUk5Qzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQW1C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QUFLLEdBQUcsUUFBUSxFQUFFLENBQUM7SUFDekIsSUFBTSxhQUFhLEdBQUcsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLHlCQUE0QixDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ3ZFLElBQU0sa0JBQWtCLEdBQUcsYUFBYSxDQUNwQyxpQkFBaUIsQ0FBQyxLQUFLLEdBQUcsYUFBYSxFQUFFLEtBQUssQ0FBQyxFQUFFLEtBQUssQ0FBQyxRQUFRLENBQUMsRUFBRSxLQUFLLEVBQUUsYUFBYSxFQUFFLElBQUksRUFDNUYsSUFBSSxFQUFFLFNBQVMsQ0FBQyxDQUFDO0lBQ3JCLElBQUksa0JBQWtCLEdBQUcsQ0FBQyxFQUFFO1FBQzFCLElBQU0sV0FBVyxHQUFHLGNBQWMsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUMxQyxZQUFZLENBQUMsV0FBVyx1QkFBZ0MsQ0FBQztLQUMxRDtBQUNILENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5pbXBvcnQge1N0eWxlU2FuaXRpemVGbn0gZnJvbSAnLi4vLi4vc2FuaXRpemF0aW9uL3N0eWxlX3Nhbml0aXplcic7XG5pbXBvcnQge1ROb2RlfSBmcm9tICcuLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtQbGF5ZXJGYWN0b3J5fSBmcm9tICcuLi9pbnRlcmZhY2VzL3BsYXllcic7XG5pbXBvcnQge0ZMQUdTLCBIRUFERVJfT0ZGU0VULCBMVmlld0ZsYWdzLCBSRU5ERVJFUiwgUm9vdENvbnRleHRGbGFnc30gZnJvbSAnLi4vaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7Z2V0QWN0aXZlSG9zdENvbnRleHQsIGdldEFjdGl2ZUhvc3RFbGVtZW50SW5kZXgsIGdldExWaWV3LCBnZXRQcmV2aW91c09yUGFyZW50VE5vZGV9IGZyb20gJy4uL3N0YXRlJztcbmltcG9ydCB7Z2V0SW5pdGlhbENsYXNzTmFtZVZhbHVlLCByZW5kZXJTdHlsaW5nLCB1cGRhdGVDbGFzc1Byb3AgYXMgdXBkYXRlRWxlbWVudENsYXNzUHJvcCwgdXBkYXRlQ29udGV4dFdpdGhCaW5kaW5ncywgdXBkYXRlU3R5bGVQcm9wIGFzIHVwZGF0ZUVsZW1lbnRTdHlsZVByb3AsIHVwZGF0ZVN0eWxpbmdNYXB9IGZyb20gJy4uL3N0eWxpbmcvY2xhc3NfYW5kX3N0eWxlX2JpbmRpbmdzJztcbmltcG9ydCB7Qm91bmRQbGF5ZXJGYWN0b3J5fSBmcm9tICcuLi9zdHlsaW5nL3BsYXllcl9mYWN0b3J5JztcbmltcG9ydCB7YWxsb2NhdGVEaXJlY3RpdmVJbnRvQ29udGV4dCwgY3JlYXRlRW1wdHlTdHlsaW5nQ29udGV4dCwgZm9yY2VDbGFzc2VzQXNTdHJpbmcsIGZvcmNlU3R5bGVzQXNTdHJpbmcsIGdldFN0eWxpbmdDb250ZXh0LCBoYXNDbGFzc0lucHV0LCBoYXNTdHlsZUlucHV0fSBmcm9tICcuLi9zdHlsaW5nL3V0aWwnO1xuaW1wb3J0IHtOT19DSEFOR0V9IGZyb20gJy4uL3Rva2Vucyc7XG5pbXBvcnQge3JlbmRlclN0cmluZ2lmeX0gZnJvbSAnLi4vdXRpbC9taXNjX3V0aWxzJztcbmltcG9ydCB7Z2V0Um9vdENvbnRleHR9IGZyb20gJy4uL3V0aWwvdmlld190cmF2ZXJzYWxfdXRpbHMnO1xuaW1wb3J0IHtnZXRUTm9kZX0gZnJvbSAnLi4vdXRpbC92aWV3X3V0aWxzJztcblxuaW1wb3J0IHtzY2hlZHVsZVRpY2t9IGZyb20gJy4vaW5zdHJ1Y3Rpb25zJztcbmltcG9ydCB7c2V0SW5wdXRzRm9yUHJvcGVydHl9IGZyb20gJy4vc2hhcmVkJztcblxuXG5cbi8qXG4gKiBUaGUgY29udGVudHMgb2YgdGhpcyBmaWxlIGluY2x1ZGUgdGhlIGluc3RydWN0aW9ucyBmb3IgYWxsIHN0eWxpbmctcmVsYXRlZFxuICogb3BlcmF0aW9ucyBpbiBBbmd1bGFyLlxuICpcbiAqIFRoZSBpbnN0cnVjdGlvbnMgcHJlc2VudCBpbiB0aGlzIGZpbGUgYXJlOlxuICpcbiAqIFRlbXBsYXRlIGxldmVsIHN0eWxpbmcgaW5zdHJ1Y3Rpb25zOlxuICogLSBlbGVtZW50U3R5bGluZ1xuICogLSBlbGVtZW50U3R5bGluZ01hcFxuICogLSBlbGVtZW50U3R5bGVQcm9wXG4gKiAtIGVsZW1lbnRDbGFzc1Byb3BcbiAqIC0gZWxlbWVudFN0eWxpbmdBcHBseVxuICpcbiAqIEhvc3QgYmluZGluZ3MgbGV2ZWwgc3R5bGluZyBpbnN0cnVjdGlvbnM6XG4gKiAtIGVsZW1lbnRIb3N0U3R5bGluZ1xuICogLSBlbGVtZW50SG9zdFN0eWxpbmdNYXBcbiAqIC0gZWxlbWVudEhvc3RTdHlsZVByb3BcbiAqIC0gZWxlbWVudEhvc3RDbGFzc1Byb3BcbiAqIC0gZWxlbWVudEhvc3RTdHlsaW5nQXBwbHlcbiAqL1xuXG5cbi8qKlxuICogQWxsb2NhdGVzIHN0eWxlIGFuZCBjbGFzcyBiaW5kaW5nIHByb3BlcnRpZXMgb24gdGhlIGVsZW1lbnQgZHVyaW5nIGNyZWF0aW9uIG1vZGUuXG4gKlxuICogVGhpcyBpbnN0cnVjdGlvbiBpcyBtZWFudCB0byBiZSBjYWxsZWQgZHVyaW5nIGNyZWF0aW9uIG1vZGUgdG8gcmVnaXN0ZXIgYWxsXG4gKiBkeW5hbWljIHN0eWxlIGFuZCBjbGFzcyBiaW5kaW5ncyBvbiB0aGUgZWxlbWVudC4gTm90ZSB0aGF0IHRoaXMgaXMgb25seSB1c2VkXG4gKiBmb3IgYmluZGluZyB2YWx1ZXMgKHNlZSBgZWxlbWVudFN0YXJ0YCB0byBsZWFybiBob3cgdG8gYXNzaWduIHN0YXRpYyBzdHlsaW5nXG4gKiB2YWx1ZXMgdG8gYW4gZWxlbWVudCkuXG4gKlxuICogQHBhcmFtIGNsYXNzQmluZGluZ05hbWVzIEFuIGFycmF5IGNvbnRhaW5pbmcgYmluZGFibGUgY2xhc3MgbmFtZXMuXG4gKiAgICAgICAgVGhlIGBlbGVtZW50Q2xhc3NQcm9wYCBpbnN0cnVjdGlvbiByZWZlcnMgdG8gdGhlIGNsYXNzIG5hbWUgYnkgaW5kZXggaW5cbiAqICAgICAgICB0aGlzIGFycmF5IChpLmUuIGBbJ2ZvbycsICdiYXInXWAgbWVhbnMgYGZvbz0wYCBhbmQgYGJhcj0xYCkuXG4gKiBAcGFyYW0gc3R5bGVCaW5kaW5nTmFtZXMgQW4gYXJyYXkgY29udGFpbmluZyBiaW5kYWJsZSBzdHlsZSBwcm9wZXJ0aWVzLlxuICogICAgICAgIFRoZSBgZWxlbWVudFN0eWxlUHJvcGAgaW5zdHJ1Y3Rpb24gcmVmZXJzIHRvIHRoZSBjbGFzcyBuYW1lIGJ5IGluZGV4IGluXG4gKiAgICAgICAgdGhpcyBhcnJheSAoaS5lLiBgWyd3aWR0aCcsICdoZWlnaHQnXWAgbWVhbnMgYHdpZHRoPTBgIGFuZCBgaGVpZ2h0PTFgKS5cbiAqIEBwYXJhbSBzdHlsZVNhbml0aXplciBBbiBvcHRpb25hbCBzYW5pdGl6ZXIgZnVuY3Rpb24gdGhhdCB3aWxsIGJlIHVzZWQgdG8gc2FuaXRpemUgYW55IENTU1xuICogICAgICAgIHN0eWxlIHZhbHVlcyB0aGF0IGFyZSBhcHBsaWVkIHRvIHRoZSBlbGVtZW50IChkdXJpbmcgcmVuZGVyaW5nKS5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbGVtZW50U3R5bGluZyhcbiAgICBjbGFzc0JpbmRpbmdOYW1lcz86IHN0cmluZ1tdIHwgbnVsbCwgc3R5bGVCaW5kaW5nTmFtZXM/OiBzdHJpbmdbXSB8IG51bGwsXG4gICAgc3R5bGVTYW5pdGl6ZXI/OiBTdHlsZVNhbml0aXplRm4gfCBudWxsKTogdm9pZCB7XG4gIGNvbnN0IHROb2RlID0gZ2V0UHJldmlvdXNPclBhcmVudFROb2RlKCk7XG4gIGlmICghdE5vZGUuc3R5bGluZ1RlbXBsYXRlKSB7XG4gICAgdE5vZGUuc3R5bGluZ1RlbXBsYXRlID0gY3JlYXRlRW1wdHlTdHlsaW5nQ29udGV4dCgpO1xuICB9XG5cbiAgLy8gY2FsbGluZyB0aGUgZnVuY3Rpb24gYmVsb3cgZW5zdXJlcyB0aGF0IHRoZSB0ZW1wbGF0ZSdzIGJpbmRpbmcgdmFsdWVzXG4gIC8vIGFyZSBhcHBsaWVkIGFzIHRoZSBmaXJzdCBzZXQgb2YgYmluZGluZ3MgaW50byB0aGUgY29udGV4dC4gSWYgYW55IG90aGVyXG4gIC8vIHN0eWxpbmcgYmluZGluZ3MgYXJlIHNldCBvbiB0aGUgc2FtZSBlbGVtZW50IChieSBkaXJlY3RpdmVzIGFuZC9vclxuICAvLyBjb21wb25lbnRzKSB0aGVuIHRoZXkgd2lsbCBiZSBhcHBsaWVkIGF0IHRoZSBlbmQgb2YgdGhlIGBlbGVtZW50RW5kYFxuICAvLyBpbnN0cnVjdGlvbiAoYmVjYXVzZSBkaXJlY3RpdmVzIGFyZSBjcmVhdGVkIGZpcnN0IGJlZm9yZSBzdHlsaW5nIGlzXG4gIC8vIGV4ZWN1dGVkIGZvciBhIG5ldyBlbGVtZW50KS5cbiAgaW5pdEVsZW1lbnRTdHlsaW5nKHROb2RlLCBjbGFzc0JpbmRpbmdOYW1lcywgc3R5bGVCaW5kaW5nTmFtZXMsIHN0eWxlU2FuaXRpemVyLCBudWxsKTtcbn1cblxuLyoqXG4gKiBBbGxvY2F0ZXMgc3R5bGUgYW5kIGNsYXNzIGJpbmRpbmcgcHJvcGVydGllcyBvbiB0aGUgaG9zdCBlbGVtZW50IGR1cmluZyBjcmVhdGlvbiBtb2RlXG4gKiB3aXRoaW4gdGhlIGhvc3QgYmluZGluZ3MgZnVuY3Rpb24gb2YgYSBkaXJlY3RpdmUgb3IgY29tcG9uZW50LlxuICpcbiAqIFRoaXMgaW5zdHJ1Y3Rpb24gaXMgbWVhbnQgdG8gYmUgY2FsbGVkIGR1cmluZyBjcmVhdGlvbiBtb2RlIHRvIHJlZ2lzdGVyIGFsbFxuICogZHluYW1pYyBzdHlsZSBhbmQgY2xhc3MgaG9zdCBiaW5kaW5ncyBvbiB0aGUgaG9zdCBlbGVtZW50IG9mIGEgZGlyZWN0aXZlIG9yXG4gKiBjb21wb25lbnQuIE5vdGUgdGhhdCB0aGlzIGlzIG9ubHkgdXNlZCBmb3IgYmluZGluZyB2YWx1ZXMgKHNlZSBgZWxlbWVudEhvc3RBdHRyc2BcbiAqIHRvIGxlYXJuIGhvdyB0byBhc3NpZ24gc3RhdGljIHN0eWxpbmcgdmFsdWVzIHRvIHRoZSBob3N0IGVsZW1lbnQpLlxuICpcbiAqIEBwYXJhbSBjbGFzc0JpbmRpbmdOYW1lcyBBbiBhcnJheSBjb250YWluaW5nIGJpbmRhYmxlIGNsYXNzIG5hbWVzLlxuICogICAgICAgIFRoZSBgZWxlbWVudEhvc3RDbGFzc1Byb3BgIGluc3RydWN0aW9uIHJlZmVycyB0byB0aGUgY2xhc3MgbmFtZSBieSBpbmRleCBpblxuICogICAgICAgIHRoaXMgYXJyYXkgKGkuZS4gYFsnZm9vJywgJ2JhciddYCBtZWFucyBgZm9vPTBgIGFuZCBgYmFyPTFgKS5cbiAqIEBwYXJhbSBzdHlsZUJpbmRpbmdOYW1lcyBBbiBhcnJheSBjb250YWluaW5nIGJpbmRhYmxlIHN0eWxlIHByb3BlcnRpZXMuXG4gKiAgICAgICAgVGhlIGBlbGVtZW50SG9zdFN0eWxlUHJvcGAgaW5zdHJ1Y3Rpb24gcmVmZXJzIHRvIHRoZSBjbGFzcyBuYW1lIGJ5IGluZGV4IGluXG4gKiAgICAgICAgdGhpcyBhcnJheSAoaS5lLiBgWyd3aWR0aCcsICdoZWlnaHQnXWAgbWVhbnMgYHdpZHRoPTBgIGFuZCBgaGVpZ2h0PTFgKS5cbiAqIEBwYXJhbSBzdHlsZVNhbml0aXplciBBbiBvcHRpb25hbCBzYW5pdGl6ZXIgZnVuY3Rpb24gdGhhdCB3aWxsIGJlIHVzZWQgdG8gc2FuaXRpemUgYW55IENTU1xuICogICAgICAgIHN0eWxlIHZhbHVlcyB0aGF0IGFyZSBhcHBsaWVkIHRvIHRoZSBlbGVtZW50IChkdXJpbmcgcmVuZGVyaW5nKS5cbiAqICAgICAgICBOb3RlIHRoYXQgdGhlIHNhbml0aXplciBpbnN0YW5jZSBpdHNlbGYgaXMgdGllZCB0byB0aGUgcHJvdmlkZWQgYGRpcmVjdGl2ZWAgYW5kXG4gKiAgICAgICAgd2lsbCBub3QgYmUgdXNlZCBpZiB0aGUgc2FtZSBwcm9wZXJ0eSBpcyBhc3NpZ25lZCBpbiBhbm90aGVyIGRpcmVjdGl2ZSBvclxuICogICAgICAgIG9uIHRoZSBlbGVtZW50IGRpcmVjdGx5LlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVsZW1lbnRIb3N0U3R5bGluZyhcbiAgICBjbGFzc0JpbmRpbmdOYW1lcz86IHN0cmluZ1tdIHwgbnVsbCwgc3R5bGVCaW5kaW5nTmFtZXM/OiBzdHJpbmdbXSB8IG51bGwsXG4gICAgc3R5bGVTYW5pdGl6ZXI/OiBTdHlsZVNhbml0aXplRm4gfCBudWxsKTogdm9pZCB7XG4gIGNvbnN0IHROb2RlID0gZ2V0UHJldmlvdXNPclBhcmVudFROb2RlKCk7XG4gIGlmICghdE5vZGUuc3R5bGluZ1RlbXBsYXRlKSB7XG4gICAgdE5vZGUuc3R5bGluZ1RlbXBsYXRlID0gY3JlYXRlRW1wdHlTdHlsaW5nQ29udGV4dCgpO1xuICB9XG5cbiAgY29uc3QgZGlyZWN0aXZlID0gZ2V0QWN0aXZlSG9zdENvbnRleHQoKTtcblxuICAvLyBkZXNwaXRlIHRoZSBiaW5kaW5nIGJlaW5nIGFwcGxpZWQgaW4gYSBxdWV1ZSAoYmVsb3cpLCB0aGUgYWxsb2NhdGlvblxuICAvLyBvZiB0aGUgZGlyZWN0aXZlIGludG8gdGhlIGNvbnRleHQgaGFwcGVucyByaWdodCBhd2F5LiBUaGUgcmVhc29uIGZvclxuICAvLyB0aGlzIGlzIHRvIHJldGFpbiB0aGUgb3JkZXJpbmcgb2YgdGhlIGRpcmVjdGl2ZXMgKHdoaWNoIGlzIGltcG9ydGFudFxuICAvLyBmb3IgdGhlIHByaW9yaXRpemF0aW9uIG9mIGJpbmRpbmdzKS5cbiAgYWxsb2NhdGVEaXJlY3RpdmVJbnRvQ29udGV4dCh0Tm9kZS5zdHlsaW5nVGVtcGxhdGUsIGRpcmVjdGl2ZSk7XG5cbiAgY29uc3QgZm5zID0gdE5vZGUub25FbGVtZW50Q3JlYXRpb25GbnMgPSB0Tm9kZS5vbkVsZW1lbnRDcmVhdGlvbkZucyB8fCBbXTtcbiAgZm5zLnB1c2goXG4gICAgICAoKSA9PiBpbml0RWxlbWVudFN0eWxpbmcoXG4gICAgICAgICAgdE5vZGUsIGNsYXNzQmluZGluZ05hbWVzLCBzdHlsZUJpbmRpbmdOYW1lcywgc3R5bGVTYW5pdGl6ZXIsIGRpcmVjdGl2ZSkpO1xufVxuXG5mdW5jdGlvbiBpbml0RWxlbWVudFN0eWxpbmcoXG4gICAgdE5vZGU6IFROb2RlLCBjbGFzc0JpbmRpbmdOYW1lcz86IHN0cmluZ1tdIHwgbnVsbCwgc3R5bGVCaW5kaW5nTmFtZXM/OiBzdHJpbmdbXSB8IG51bGwsXG4gICAgc3R5bGVTYW5pdGl6ZXI/OiBTdHlsZVNhbml0aXplRm4gfCBudWxsLCBkaXJlY3RpdmU/OiB7fSB8IG51bGwpOiB2b2lkIHtcbiAgdXBkYXRlQ29udGV4dFdpdGhCaW5kaW5ncyhcbiAgICAgIHROb2RlLnN0eWxpbmdUZW1wbGF0ZSAhLCBkaXJlY3RpdmUgfHwgbnVsbCwgY2xhc3NCaW5kaW5nTmFtZXMsIHN0eWxlQmluZGluZ05hbWVzLFxuICAgICAgc3R5bGVTYW5pdGl6ZXIpO1xufVxuXG5cbi8qKlxuICogVXBkYXRlIGEgc3R5bGUgYmluZGluZyBvbiBhbiBlbGVtZW50IHdpdGggdGhlIHByb3ZpZGVkIHZhbHVlLlxuICpcbiAqIElmIHRoZSBzdHlsZSB2YWx1ZSBpcyBmYWxzeSB0aGVuIGl0IHdpbGwgYmUgcmVtb3ZlZCBmcm9tIHRoZSBlbGVtZW50XG4gKiAob3IgYXNzaWduZWQgYSBkaWZmZXJlbnQgdmFsdWUgZGVwZW5kaW5nIGlmIHRoZXJlIGFyZSBhbnkgc3R5bGVzIHBsYWNlZFxuICogb24gdGhlIGVsZW1lbnQgd2l0aCBgZWxlbWVudFN0eWxpbmdNYXBgIG9yIGFueSBzdGF0aWMgc3R5bGVzIHRoYXQgYXJlXG4gKiBwcmVzZW50IGZyb20gd2hlbiB0aGUgZWxlbWVudCB3YXMgY3JlYXRlZCB3aXRoIGBlbGVtZW50U3R5bGluZ2ApLlxuICpcbiAqIE5vdGUgdGhhdCB0aGUgc3R5bGluZyBlbGVtZW50IGlzIHVwZGF0ZWQgYXMgcGFydCBvZiBgZWxlbWVudFN0eWxpbmdBcHBseWAuXG4gKlxuICogQHBhcmFtIGluZGV4IEluZGV4IG9mIHRoZSBlbGVtZW50J3Mgd2l0aCB3aGljaCBzdHlsaW5nIGlzIGFzc29jaWF0ZWQuXG4gKiBAcGFyYW0gc3R5bGVJbmRleCBJbmRleCBvZiBzdHlsZSB0byB1cGRhdGUuIFRoaXMgaW5kZXggdmFsdWUgcmVmZXJzIHRvIHRoZVxuICogICAgICAgIGluZGV4IG9mIHRoZSBzdHlsZSBpbiB0aGUgc3R5bGUgYmluZGluZ3MgYXJyYXkgdGhhdCB3YXMgcGFzc2VkIGludG9cbiAqICAgICAgICBgZWxlbWVudFN0eWxpbmdgLlxuICogQHBhcmFtIHZhbHVlIE5ldyB2YWx1ZSB0byB3cml0ZSAoZmFsc3kgdG8gcmVtb3ZlKS4gTm90ZSB0aGF0IGlmIGEgZGlyZWN0aXZlIGFsc29cbiAqICAgICAgICBhdHRlbXB0cyB0byB3cml0ZSB0byB0aGUgc2FtZSBiaW5kaW5nIHZhbHVlICh2aWEgYGVsZW1lbnRIb3N0U3R5bGVQcm9wYClcbiAqICAgICAgICB0aGVuIGl0IHdpbGwgb25seSBiZSBhYmxlIHRvIGRvIHNvIGlmIHRoZSBiaW5kaW5nIHZhbHVlIGFzc2lnbmVkIHZpYVxuICogICAgICAgIGBlbGVtZW50U3R5bGVQcm9wYCBpcyBmYWxzeSAob3IgZG9lc24ndCBleGlzdCBhdCBhbGwpLlxuICogQHBhcmFtIHN1ZmZpeCBPcHRpb25hbCBzdWZmaXguIFVzZWQgd2l0aCBzY2FsYXIgdmFsdWVzIHRvIGFkZCB1bml0IHN1Y2ggYXMgYHB4YC5cbiAqICAgICAgICBOb3RlIHRoYXQgd2hlbiBhIHN1ZmZpeCBpcyBwcm92aWRlZCB0aGVuIHRoZSB1bmRlcmx5aW5nIHNhbml0aXplciB3aWxsXG4gKiAgICAgICAgYmUgaWdub3JlZC5cbiAqIEBwYXJhbSBmb3JjZU92ZXJyaWRlIFdoZXRoZXIgb3Igbm90IHRvIHVwZGF0ZSB0aGUgc3R5bGluZyB2YWx1ZSBpbW1lZGlhdGVseVxuICogICAgICAgIChkZXNwaXRlIHRoZSBvdGhlciBiaW5kaW5ncyBwb3NzaWJseSBoYXZpbmcgcHJpb3JpdHkpXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gZWxlbWVudFN0eWxlUHJvcChcbiAgICBpbmRleDogbnVtYmVyLCBzdHlsZUluZGV4OiBudW1iZXIsIHZhbHVlOiBzdHJpbmcgfCBudW1iZXIgfCBTdHJpbmcgfCBQbGF5ZXJGYWN0b3J5IHwgbnVsbCxcbiAgICBzdWZmaXg/OiBzdHJpbmcgfCBudWxsLCBmb3JjZU92ZXJyaWRlPzogYm9vbGVhbik6IHZvaWQge1xuICBlbGVtZW50U3R5bGVQcm9wSW50ZXJuYWwobnVsbCwgaW5kZXgsIHN0eWxlSW5kZXgsIHZhbHVlLCBzdWZmaXgsIGZvcmNlT3ZlcnJpZGUpO1xufVxuXG4vKipcbiAqIFVwZGF0ZSBhIGhvc3Qgc3R5bGUgYmluZGluZyB2YWx1ZSBvbiB0aGUgaG9zdCBlbGVtZW50IHdpdGhpbiBhIGNvbXBvbmVudC9kaXJlY3RpdmUuXG4gKlxuICogSWYgdGhlIHN0eWxlIHZhbHVlIGlzIGZhbHN5IHRoZW4gaXQgd2lsbCBiZSByZW1vdmVkIGZyb20gdGhlIGhvc3QgZWxlbWVudFxuICogKG9yIGFzc2lnbmVkIGEgZGlmZmVyZW50IHZhbHVlIGRlcGVuZGluZyBpZiB0aGVyZSBhcmUgYW55IHN0eWxlcyBwbGFjZWRcbiAqIG9uIHRoZSBzYW1lIGVsZW1lbnQgd2l0aCBgZWxlbWVudEhvc3RTdHlsaW5nTWFwYCBvciBhbnkgc3RhdGljIHN0eWxlcyB0aGF0XG4gKiBhcmUgcHJlc2VudCBmcm9tIHdoZW4gdGhlIGVsZW1lbnQgd2FzIHBhdGNoZWQgd2l0aCBgZWxlbWVudEhvc3RTdHlsaW5nYCkuXG4gKlxuICogTm90ZSB0aGF0IHRoZSBzdHlsaW5nIGFwcGxpZWQgdG8gdGhlIGhvc3QgZWxlbWVudCBvbmNlXG4gKiBgZWxlbWVudEhvc3RTdHlsaW5nQXBwbHlgIGlzIGNhbGxlZC5cbiAqXG4gKiBAcGFyYW0gc3R5bGVJbmRleCBJbmRleCBvZiBzdHlsZSB0byB1cGRhdGUuIFRoaXMgaW5kZXggdmFsdWUgcmVmZXJzIHRvIHRoZVxuICogICAgICAgIGluZGV4IG9mIHRoZSBzdHlsZSBpbiB0aGUgc3R5bGUgYmluZGluZ3MgYXJyYXkgdGhhdCB3YXMgcGFzc2VkIGludG9cbiAqICAgICAgICBgZWxlbWVudEhvc3RTdHlsaW5nYC5cbiAqIEBwYXJhbSB2YWx1ZSBOZXcgdmFsdWUgdG8gd3JpdGUgKGZhbHN5IHRvIHJlbW92ZSkuIFRoZSB2YWx1ZSBtYXkgb3IgbWF5IG5vdFxuICogICAgICAgIGJlIGFwcGxpZWQgdG8gdGhlIGVsZW1lbnQgZGVwZW5kaW5nIG9uIHRoZSB0ZW1wbGF0ZS9jb21wb25lbnQvZGlyZWN0aXZlXG4gKiAgICAgICAgcHJpb3JpdGl6YXRpb24gKHNlZSBgaW50ZXJmYWNlcy9zdHlsaW5nLnRzYClcbiAqIEBwYXJhbSBzdWZmaXggT3B0aW9uYWwgc3VmZml4LiBVc2VkIHdpdGggc2NhbGFyIHZhbHVlcyB0byBhZGQgdW5pdCBzdWNoIGFzIGBweGAuXG4gKiAgICAgICAgTm90ZSB0aGF0IHdoZW4gYSBzdWZmaXggaXMgcHJvdmlkZWQgdGhlbiB0aGUgdW5kZXJseWluZyBzYW5pdGl6ZXIgd2lsbFxuICogICAgICAgIGJlIGlnbm9yZWQuXG4gKiBAcGFyYW0gZm9yY2VPdmVycmlkZSBXaGV0aGVyIG9yIG5vdCB0byB1cGRhdGUgdGhlIHN0eWxpbmcgdmFsdWUgaW1tZWRpYXRlbHlcbiAqICAgICAgICAoZGVzcGl0ZSB0aGUgb3RoZXIgYmluZGluZ3MgcG9zc2libHkgaGF2aW5nIHByaW9yaXR5KVxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVsZW1lbnRIb3N0U3R5bGVQcm9wKFxuICAgIHN0eWxlSW5kZXg6IG51bWJlciwgdmFsdWU6IHN0cmluZyB8IG51bWJlciB8IFN0cmluZyB8IFBsYXllckZhY3RvcnkgfCBudWxsLFxuICAgIHN1ZmZpeD86IHN0cmluZyB8IG51bGwsIGZvcmNlT3ZlcnJpZGU/OiBib29sZWFuKTogdm9pZCB7XG4gIGVsZW1lbnRTdHlsZVByb3BJbnRlcm5hbChcbiAgICAgIGdldEFjdGl2ZUhvc3RDb250ZXh0KCkgISwgZ2V0QWN0aXZlSG9zdEVsZW1lbnRJbmRleCgpICEsIHN0eWxlSW5kZXgsIHZhbHVlLCBzdWZmaXgsXG4gICAgICBmb3JjZU92ZXJyaWRlKTtcbn1cblxuZnVuY3Rpb24gZWxlbWVudFN0eWxlUHJvcEludGVybmFsKFxuICAgIGRpcmVjdGl2ZToge30gfCBudWxsLCBpbmRleDogbnVtYmVyLCBzdHlsZUluZGV4OiBudW1iZXIsXG4gICAgdmFsdWU6IHN0cmluZyB8IG51bWJlciB8IFN0cmluZyB8IFBsYXllckZhY3RvcnkgfCBudWxsLCBzdWZmaXg/OiBzdHJpbmcgfCBudWxsLFxuICAgIGZvcmNlT3ZlcnJpZGU/OiBib29sZWFuKTogdm9pZCB7XG4gIGxldCB2YWx1ZVRvQWRkOiBzdHJpbmd8bnVsbCA9IG51bGw7XG4gIGlmICh2YWx1ZSAhPT0gbnVsbCkge1xuICAgIGlmIChzdWZmaXgpIHtcbiAgICAgIC8vIHdoZW4gYSBzdWZmaXggaXMgYXBwbGllZCB0aGVuIGl0IHdpbGwgYnlwYXNzXG4gICAgICAvLyBzYW5pdGl6YXRpb24gZW50aXJlbHkgKGIvYyBhIG5ldyBzdHJpbmcgaXMgY3JlYXRlZClcbiAgICAgIHZhbHVlVG9BZGQgPSByZW5kZXJTdHJpbmdpZnkodmFsdWUpICsgc3VmZml4O1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBzYW5pdGl6YXRpb24gaGFwcGVucyBieSBkZWFsaW5nIHdpdGggYSBTdHJpbmcgdmFsdWVcbiAgICAgIC8vIHRoaXMgbWVhbnMgdGhhdCB0aGUgc3RyaW5nIHZhbHVlIHdpbGwgYmUgcGFzc2VkIHRocm91Z2hcbiAgICAgIC8vIGludG8gdGhlIHN0eWxlIHJlbmRlcmluZyBsYXRlciAod2hpY2ggaXMgd2hlcmUgdGhlIHZhbHVlXG4gICAgICAvLyB3aWxsIGJlIHNhbml0aXplZCBiZWZvcmUgaXQgaXMgYXBwbGllZClcbiAgICAgIHZhbHVlVG9BZGQgPSB2YWx1ZSBhcyBhbnkgYXMgc3RyaW5nO1xuICAgIH1cbiAgfVxuICB1cGRhdGVFbGVtZW50U3R5bGVQcm9wKFxuICAgICAgZ2V0U3R5bGluZ0NvbnRleHQoaW5kZXggKyBIRUFERVJfT0ZGU0VULCBnZXRMVmlldygpKSwgc3R5bGVJbmRleCwgdmFsdWVUb0FkZCwgZGlyZWN0aXZlLFxuICAgICAgZm9yY2VPdmVycmlkZSk7XG59XG5cblxuLyoqXG4gKiBVcGRhdGUgYSBjbGFzcyBiaW5kaW5nIG9uIGFuIGVsZW1lbnQgd2l0aCB0aGUgcHJvdmlkZWQgdmFsdWUuXG4gKlxuICogVGhpcyBpbnN0cnVjdGlvbiBpcyBtZWFudCB0byBoYW5kbGUgdGhlIGBbY2xhc3MuZm9vXT1cImV4cFwiYCBjYXNlIGFuZCxcbiAqIHRoZXJlZm9yZSwgdGhlIGNsYXNzIGJpbmRpbmcgaXRzZWxmIG11c3QgYWxyZWFkeSBiZSBhbGxvY2F0ZWQgdXNpbmdcbiAqIGBlbGVtZW50U3R5bGluZ2Agd2l0aGluIHRoZSBjcmVhdGlvbiBibG9jay5cbiAqXG4gKiBAcGFyYW0gaW5kZXggSW5kZXggb2YgdGhlIGVsZW1lbnQncyB3aXRoIHdoaWNoIHN0eWxpbmcgaXMgYXNzb2NpYXRlZC5cbiAqIEBwYXJhbSBjbGFzc0luZGV4IEluZGV4IG9mIGNsYXNzIHRvIHRvZ2dsZS4gVGhpcyBpbmRleCB2YWx1ZSByZWZlcnMgdG8gdGhlXG4gKiAgICAgICAgaW5kZXggb2YgdGhlIGNsYXNzIGluIHRoZSBjbGFzcyBiaW5kaW5ncyBhcnJheSB0aGF0IHdhcyBwYXNzZWQgaW50b1xuICogICAgICAgIGBlbGVtZW50U3R5bGluZ2AgKHdoaWNoIGlzIG1lYW50IHRvIGJlIGNhbGxlZCBiZWZvcmUgdGhpc1xuICogICAgICAgIGZ1bmN0aW9uIGlzKS5cbiAqIEBwYXJhbSB2YWx1ZSBBIHRydWUvZmFsc2UgdmFsdWUgd2hpY2ggd2lsbCB0dXJuIHRoZSBjbGFzcyBvbiBvciBvZmYuXG4gKiBAcGFyYW0gZm9yY2VPdmVycmlkZSBXaGV0aGVyIG9yIG5vdCB0aGlzIHZhbHVlIHdpbGwgYmUgYXBwbGllZCByZWdhcmRsZXNzXG4gKiAgICAgICAgb2Ygd2hlcmUgaXQgaXMgYmVpbmcgc2V0IHdpdGhpbiB0aGUgc3R5bGluZyBwcmlvcml0eSBzdHJ1Y3R1cmUuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gZWxlbWVudENsYXNzUHJvcChcbiAgICBpbmRleDogbnVtYmVyLCBjbGFzc0luZGV4OiBudW1iZXIsIHZhbHVlOiBib29sZWFuIHwgUGxheWVyRmFjdG9yeSxcbiAgICBmb3JjZU92ZXJyaWRlPzogYm9vbGVhbik6IHZvaWQge1xuICBlbGVtZW50Q2xhc3NQcm9wSW50ZXJuYWwobnVsbCwgaW5kZXgsIGNsYXNzSW5kZXgsIHZhbHVlLCBmb3JjZU92ZXJyaWRlKTtcbn1cblxuXG4vKipcbiAqIFVwZGF0ZSBhIGNsYXNzIGhvc3QgYmluZGluZyBmb3IgYSBkaXJlY3RpdmUncy9jb21wb25lbnQncyBob3N0IGVsZW1lbnQgd2l0aGluXG4gKiB0aGUgaG9zdCBiaW5kaW5ncyBmdW5jdGlvbi5cbiAqXG4gKiBUaGlzIGluc3RydWN0aW9uIGlzIG1lYW50IHRvIGhhbmRsZSB0aGUgYEBIb3N0QmluZGluZygnY2xhc3MuZm9vJylgIGNhc2UgYW5kLFxuICogdGhlcmVmb3JlLCB0aGUgY2xhc3MgYmluZGluZyBpdHNlbGYgbXVzdCBhbHJlYWR5IGJlIGFsbG9jYXRlZCB1c2luZ1xuICogYGVsZW1lbnRIb3N0U3R5bGluZ2Agd2l0aGluIHRoZSBjcmVhdGlvbiBibG9jay5cbiAqXG4gKiBAcGFyYW0gY2xhc3NJbmRleCBJbmRleCBvZiBjbGFzcyB0byB0b2dnbGUuIFRoaXMgaW5kZXggdmFsdWUgcmVmZXJzIHRvIHRoZVxuICogICAgICAgIGluZGV4IG9mIHRoZSBjbGFzcyBpbiB0aGUgY2xhc3MgYmluZGluZ3MgYXJyYXkgdGhhdCB3YXMgcGFzc2VkIGludG9cbiAqICAgICAgICBgZWxlbWVudEhvc3RTdGx5aW5nYCAod2hpY2ggaXMgbWVhbnQgdG8gYmUgY2FsbGVkIGJlZm9yZSB0aGlzXG4gKiAgICAgICAgZnVuY3Rpb24gaXMpLlxuICogQHBhcmFtIHZhbHVlIEEgdHJ1ZS9mYWxzZSB2YWx1ZSB3aGljaCB3aWxsIHR1cm4gdGhlIGNsYXNzIG9uIG9yIG9mZi5cbiAqIEBwYXJhbSBmb3JjZU92ZXJyaWRlIFdoZXRoZXIgb3Igbm90IHRoaXMgdmFsdWUgd2lsbCBiZSBhcHBsaWVkIHJlZ2FyZGxlc3NcbiAqICAgICAgICBvZiB3aGVyZSBpdCBpcyBiZWluZyBzZXQgd2l0aGluIHRoZSBzdHlsaW5ncyBwcmlvcml0eSBzdHJ1Y3R1cmUuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gZWxlbWVudEhvc3RDbGFzc1Byb3AoXG4gICAgY2xhc3NJbmRleDogbnVtYmVyLCB2YWx1ZTogYm9vbGVhbiB8IFBsYXllckZhY3RvcnksIGZvcmNlT3ZlcnJpZGU/OiBib29sZWFuKTogdm9pZCB7XG4gIGVsZW1lbnRDbGFzc1Byb3BJbnRlcm5hbChcbiAgICAgIGdldEFjdGl2ZUhvc3RDb250ZXh0KCkgISwgZ2V0QWN0aXZlSG9zdEVsZW1lbnRJbmRleCgpICEsIGNsYXNzSW5kZXgsIHZhbHVlLCBmb3JjZU92ZXJyaWRlKTtcbn1cblxuZnVuY3Rpb24gZWxlbWVudENsYXNzUHJvcEludGVybmFsKFxuICAgIGRpcmVjdGl2ZToge30gfCBudWxsLCBpbmRleDogbnVtYmVyLCBjbGFzc0luZGV4OiBudW1iZXIsIHZhbHVlOiBib29sZWFuIHwgUGxheWVyRmFjdG9yeSxcbiAgICBmb3JjZU92ZXJyaWRlPzogYm9vbGVhbik6IHZvaWQge1xuICBjb25zdCBpbnB1dCA9ICh2YWx1ZSBpbnN0YW5jZW9mIEJvdW5kUGxheWVyRmFjdG9yeSkgP1xuICAgICAgKHZhbHVlIGFzIEJvdW5kUGxheWVyRmFjdG9yeTxib29sZWFufG51bGw+KSA6XG4gICAgICBib29sZWFuT3JOdWxsKHZhbHVlKTtcbiAgdXBkYXRlRWxlbWVudENsYXNzUHJvcChcbiAgICAgIGdldFN0eWxpbmdDb250ZXh0KGluZGV4ICsgSEVBREVSX09GRlNFVCwgZ2V0TFZpZXcoKSksIGNsYXNzSW5kZXgsIGlucHV0LCBkaXJlY3RpdmUsXG4gICAgICBmb3JjZU92ZXJyaWRlKTtcbn1cblxuZnVuY3Rpb24gYm9vbGVhbk9yTnVsbCh2YWx1ZTogYW55KTogYm9vbGVhbnxudWxsIHtcbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ2Jvb2xlYW4nKSByZXR1cm4gdmFsdWU7XG4gIHJldHVybiB2YWx1ZSA/IHRydWUgOiBudWxsO1xufVxuXG5cbi8qKlxuICogVXBkYXRlIHN0eWxlIGFuZC9vciBjbGFzcyBiaW5kaW5ncyB1c2luZyBvYmplY3QgbGl0ZXJhbHMgb24gYW4gZWxlbWVudC5cbiAqXG4gKiBUaGlzIGluc3RydWN0aW9uIGlzIG1lYW50IHRvIGFwcGx5IHN0eWxpbmcgdmlhIHRoZSBgW3N0eWxlXT1cImV4cFwiYCBhbmQgYFtjbGFzc109XCJleHBcImAgdGVtcGxhdGVcbiAqIGJpbmRpbmdzLiBXaGVuIHN0eWxlcy9jbGFzc2VzIGFyZSBhcHBsaWVkIHRvIHRoZSBlbGVtZW50IHRoZXkgd2lsbCB0aGVuIGJlIHVwZGF0ZWQgd2l0aFxuICogcmVzcGVjdCB0byBhbnkgc3R5bGVzL2NsYXNzZXMgc2V0IHdpdGggYGVsZW1lbnRTdHlsZVByb3BgIG9yIGBlbGVtZW50Q2xhc3NQcm9wYC4gSWYgYW55XG4gKiBzdHlsZXMgb3IgY2xhc3NlcyBhcmUgc2V0IHRvIGZhbHN5IHRoZW4gdGhleSB3aWxsIGJlIHJlbW92ZWQgZnJvbSB0aGUgZWxlbWVudC5cbiAqXG4gKiBOb3RlIHRoYXQgdGhlIHN0eWxpbmcgaW5zdHJ1Y3Rpb24gd2lsbCBub3QgYmUgYXBwbGllZCB1bnRpbCBgZWxlbWVudFN0eWxpbmdBcHBseWAgaXMgY2FsbGVkLlxuICpcbiAqIEBwYXJhbSBpbmRleCBJbmRleCBvZiB0aGUgZWxlbWVudCdzIHdpdGggd2hpY2ggc3R5bGluZyBpcyBhc3NvY2lhdGVkLlxuICogQHBhcmFtIGNsYXNzZXMgQSBrZXkvdmFsdWUgbWFwIG9yIHN0cmluZyBvZiBDU1MgY2xhc3NlcyB0aGF0IHdpbGwgYmUgYWRkZWQgdG8gdGhlXG4gKiAgICAgICAgZ2l2ZW4gZWxlbWVudC4gQW55IG1pc3NpbmcgY2xhc3NlcyAodGhhdCBoYXZlIGFscmVhZHkgYmVlbiBhcHBsaWVkIHRvIHRoZSBlbGVtZW50XG4gKiAgICAgICAgYmVmb3JlaGFuZCkgd2lsbCBiZSByZW1vdmVkICh1bnNldCkgZnJvbSB0aGUgZWxlbWVudCdzIGxpc3Qgb2YgQ1NTIGNsYXNzZXMuXG4gKiBAcGFyYW0gc3R5bGVzIEEga2V5L3ZhbHVlIHN0eWxlIG1hcCBvZiB0aGUgc3R5bGVzIHRoYXQgd2lsbCBiZSBhcHBsaWVkIHRvIHRoZSBnaXZlbiBlbGVtZW50LlxuICogICAgICAgIEFueSBtaXNzaW5nIHN0eWxlcyAodGhhdCBoYXZlIGFscmVhZHkgYmVlbiBhcHBsaWVkIHRvIHRoZSBlbGVtZW50IGJlZm9yZWhhbmQpIHdpbGwgYmVcbiAqICAgICAgICByZW1vdmVkICh1bnNldCkgZnJvbSB0aGUgZWxlbWVudCdzIHN0eWxpbmcuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gZWxlbWVudFN0eWxpbmdNYXAoXG4gICAgaW5kZXg6IG51bWJlciwgY2xhc3Nlczoge1trZXk6IHN0cmluZ106IGFueX0gfCBzdHJpbmcgfCBOT19DSEFOR0UgfCBudWxsLFxuICAgIHN0eWxlcz86IHtbc3R5bGVOYW1lOiBzdHJpbmddOiBhbnl9IHwgTk9fQ0hBTkdFIHwgbnVsbCk6IHZvaWQge1xuICBlbGVtZW50U3R5bGluZ01hcEludGVybmFsKG51bGwsIGluZGV4LCBjbGFzc2VzLCBzdHlsZXMpO1xufVxuXG5cbi8qKlxuICogVXBkYXRlIHN0eWxlIGFuZC9vciBjbGFzcyBob3N0IGJpbmRpbmdzIHVzaW5nIG9iamVjdCBsaXRlcmFscyBvbiBhbiBlbGVtZW50IHdpdGhpbiB0aGUgaG9zdFxuICogYmluZGluZ3MgZnVuY3Rpb24gZm9yIGEgZGlyZWN0aXZlL2NvbXBvbmVudC5cbiAqXG4gKiBUaGlzIGluc3RydWN0aW9uIGlzIG1lYW50IHRvIGFwcGx5IHN0eWxpbmcgdmlhIHRoZSBgQEhvc3RCaW5kaW5nKCdzdHlsZScpYCBhbmRcbiAqIGBASG9zdEJpbmRpbmcoJ2NsYXNzJylgIGJpbmRpbmdzIGZvciBhIGNvbXBvbmVudCdzIG9yIGRpcmVjdGl2ZSdzIGhvc3QgZWxlbWVudC5cbiAqIFdoZW4gc3R5bGVzL2NsYXNzZXMgYXJlIGFwcGxpZWQgdG8gdGhlIGhvc3QgZWxlbWVudCB0aGV5IHdpbGwgdGhlbiBiZSB1cGRhdGVkXG4gKiB3aXRoIHJlc3BlY3QgdG8gYW55IHN0eWxlcy9jbGFzc2VzIHNldCB3aXRoIGBlbGVtZW50SG9zdFN0eWxlUHJvcGAgb3JcbiAqIGBlbGVtZW50SG9zdENsYXNzUHJvcGAuIElmIGFueSBzdHlsZXMgb3IgY2xhc3NlcyBhcmUgc2V0IHRvIGZhbHN5IHRoZW4gdGhleVxuICogd2lsbCBiZSByZW1vdmVkIGZyb20gdGhlIGVsZW1lbnQuXG4gKlxuICogTm90ZSB0aGF0IHRoZSBzdHlsaW5nIGluc3RydWN0aW9uIHdpbGwgbm90IGJlIGFwcGxpZWQgdW50aWxcbiAqIGBlbGVtZW50SG9zdFN0eWxpbmdBcHBseWAgaXMgY2FsbGVkLlxuICpcbiAqIEBwYXJhbSBjbGFzc2VzIEEga2V5L3ZhbHVlIG1hcCBvciBzdHJpbmcgb2YgQ1NTIGNsYXNzZXMgdGhhdCB3aWxsIGJlIGFkZGVkIHRvIHRoZVxuICogICAgICAgIGdpdmVuIGVsZW1lbnQuIEFueSBtaXNzaW5nIGNsYXNzZXMgKHRoYXQgaGF2ZSBhbHJlYWR5IGJlZW4gYXBwbGllZCB0byB0aGUgZWxlbWVudFxuICogICAgICAgIGJlZm9yZWhhbmQpIHdpbGwgYmUgcmVtb3ZlZCAodW5zZXQpIGZyb20gdGhlIGVsZW1lbnQncyBsaXN0IG9mIENTUyBjbGFzc2VzLlxuICogQHBhcmFtIHN0eWxlcyBBIGtleS92YWx1ZSBzdHlsZSBtYXAgb2YgdGhlIHN0eWxlcyB0aGF0IHdpbGwgYmUgYXBwbGllZCB0byB0aGUgZ2l2ZW4gZWxlbWVudC5cbiAqICAgICAgICBBbnkgbWlzc2luZyBzdHlsZXMgKHRoYXQgaGF2ZSBhbHJlYWR5IGJlZW4gYXBwbGllZCB0byB0aGUgZWxlbWVudCBiZWZvcmVoYW5kKSB3aWxsIGJlXG4gKiAgICAgICAgcmVtb3ZlZCAodW5zZXQpIGZyb20gdGhlIGVsZW1lbnQncyBzdHlsaW5nLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVsZW1lbnRIb3N0U3R5bGluZ01hcChcbiAgICBjbGFzc2VzOiB7W2tleTogc3RyaW5nXTogYW55fSB8IHN0cmluZyB8IE5PX0NIQU5HRSB8IG51bGwsXG4gICAgc3R5bGVzPzoge1tzdHlsZU5hbWU6IHN0cmluZ106IGFueX0gfCBOT19DSEFOR0UgfCBudWxsKTogdm9pZCB7XG4gIGVsZW1lbnRTdHlsaW5nTWFwSW50ZXJuYWwoXG4gICAgICBnZXRBY3RpdmVIb3N0Q29udGV4dCgpICEsIGdldEFjdGl2ZUhvc3RFbGVtZW50SW5kZXgoKSAhLCBjbGFzc2VzLCBzdHlsZXMpO1xufVxuXG5mdW5jdGlvbiBlbGVtZW50U3R5bGluZ01hcEludGVybmFsKFxuICAgIGRpcmVjdGl2ZToge30gfCBudWxsLCBpbmRleDogbnVtYmVyLCBjbGFzc2VzOiB7W2tleTogc3RyaW5nXTogYW55fSB8IHN0cmluZyB8IE5PX0NIQU5HRSB8IG51bGwsXG4gICAgc3R5bGVzPzoge1tzdHlsZU5hbWU6IHN0cmluZ106IGFueX0gfCBOT19DSEFOR0UgfCBudWxsKTogdm9pZCB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgdE5vZGUgPSBnZXRUTm9kZShpbmRleCwgbFZpZXcpO1xuICBjb25zdCBzdHlsaW5nQ29udGV4dCA9IGdldFN0eWxpbmdDb250ZXh0KGluZGV4ICsgSEVBREVSX09GRlNFVCwgbFZpZXcpO1xuXG4gIC8vIGlucHV0cyBhcmUgb25seSBldmFsdWF0ZWQgZnJvbSBhIHRlbXBsYXRlIGJpbmRpbmcgaW50byBhIGRpcmVjdGl2ZSwgdGhlcmVmb3JlLFxuICAvLyB0aGVyZSBzaG91bGQgbm90IGJlIGEgc2l0dWF0aW9uIHdoZXJlIGEgZGlyZWN0aXZlIGhvc3QgYmluZGluZ3MgZnVuY3Rpb25cbiAgLy8gZXZhbHVhdGVzIHRoZSBpbnB1dHMgKHRoaXMgc2hvdWxkIG9ubHkgaGFwcGVuIGluIHRoZSB0ZW1wbGF0ZSBmdW5jdGlvbilcbiAgaWYgKCFkaXJlY3RpdmUpIHtcbiAgICBpZiAoaGFzQ2xhc3NJbnB1dCh0Tm9kZSkgJiYgY2xhc3NlcyAhPT0gTk9fQ0hBTkdFKSB7XG4gICAgICBjb25zdCBpbml0aWFsQ2xhc3NlcyA9IGdldEluaXRpYWxDbGFzc05hbWVWYWx1ZShzdHlsaW5nQ29udGV4dCk7XG4gICAgICBjb25zdCBjbGFzc0lucHV0VmFsID1cbiAgICAgICAgICAoaW5pdGlhbENsYXNzZXMubGVuZ3RoID8gKGluaXRpYWxDbGFzc2VzICsgJyAnKSA6ICcnKSArIGZvcmNlQ2xhc3Nlc0FzU3RyaW5nKGNsYXNzZXMpO1xuICAgICAgc2V0SW5wdXRzRm9yUHJvcGVydHkobFZpZXcsIHROb2RlLmlucHV0cyAhWydjbGFzcyddICEsIGNsYXNzSW5wdXRWYWwpO1xuICAgICAgY2xhc3NlcyA9IE5PX0NIQU5HRTtcbiAgICB9XG5cbiAgICBpZiAoaGFzU3R5bGVJbnB1dCh0Tm9kZSkgJiYgc3R5bGVzICE9PSBOT19DSEFOR0UpIHtcbiAgICAgIGNvbnN0IGluaXRpYWxTdHlsZXMgPSBnZXRJbml0aWFsQ2xhc3NOYW1lVmFsdWUoc3R5bGluZ0NvbnRleHQpO1xuICAgICAgY29uc3Qgc3R5bGVJbnB1dFZhbCA9XG4gICAgICAgICAgKGluaXRpYWxTdHlsZXMubGVuZ3RoID8gKGluaXRpYWxTdHlsZXMgKyAnICcpIDogJycpICsgZm9yY2VTdHlsZXNBc1N0cmluZyhzdHlsZXMpO1xuICAgICAgc2V0SW5wdXRzRm9yUHJvcGVydHkobFZpZXcsIHROb2RlLmlucHV0cyAhWydzdHlsZSddICEsIHN0eWxlSW5wdXRWYWwpO1xuICAgICAgc3R5bGVzID0gTk9fQ0hBTkdFO1xuICAgIH1cbiAgfVxuXG4gIHVwZGF0ZVN0eWxpbmdNYXAoc3R5bGluZ0NvbnRleHQsIGNsYXNzZXMsIHN0eWxlcywgZGlyZWN0aXZlKTtcbn1cblxuXG4vKipcbiAqIEFwcGx5IGFsbCBzdHlsZSBhbmQgY2xhc3MgYmluZGluZyB2YWx1ZXMgdG8gdGhlIGVsZW1lbnQuXG4gKlxuICogVGhpcyBpbnN0cnVjdGlvbiBpcyBtZWFudCB0byBiZSBydW4gYWZ0ZXIgYGVsZW1lbnRTdHlsaW5nTWFwYCwgYGVsZW1lbnRTdHlsZVByb3BgXG4gKiBvciBgZWxlbWVudENsYXNzUHJvcGAgaW5zdHJ1Y3Rpb25zIGhhdmUgYmVlbiBydW4gYW5kIHdpbGwgb25seSBhcHBseSBzdHlsaW5nIHRvXG4gKiB0aGUgZWxlbWVudCBpZiBhbnkgc3R5bGluZyBiaW5kaW5ncyBoYXZlIGJlZW4gdXBkYXRlZC5cbiAqXG4gKiBAcGFyYW0gaW5kZXggSW5kZXggb2YgdGhlIGVsZW1lbnQncyB3aXRoIHdoaWNoIHN0eWxpbmcgaXMgYXNzb2NpYXRlZC5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbGVtZW50U3R5bGluZ0FwcGx5KGluZGV4OiBudW1iZXIpOiB2b2lkIHtcbiAgZWxlbWVudFN0eWxpbmdBcHBseUludGVybmFsKG51bGwsIGluZGV4KTtcbn1cblxuLyoqXG4gKiBBcHBseSBhbGwgc3R5bGUgYW5kIGNsYXNzIGhvc3QgYmluZGluZyB2YWx1ZXMgdG8gdGhlIGVsZW1lbnQuXG4gKlxuICogVGhpcyBpbnN0cnVjdGlvbiBpcyBtZWFudCB0byBiZSBydW4gYWZ0ZXIgYGVsZW1lbnRIb3N0U3R5bGluZ01hcGAsXG4gKiBgZWxlbWVudEhvc3RTdHlsZVByb3BgIG9yIGBlbGVtZW50SG9zdENsYXNzUHJvcGAgaW5zdHJ1Y3Rpb25zIGhhdmVcbiAqIGJlZW4gcnVuIGFuZCB3aWxsIG9ubHkgYXBwbHkgc3R5bGluZyB0byB0aGUgaG9zdCBlbGVtZW50IGlmIGFueVxuICogc3R5bGluZyBiaW5kaW5ncyBoYXZlIGJlZW4gdXBkYXRlZC5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbGVtZW50SG9zdFN0eWxpbmdBcHBseSgpOiB2b2lkIHtcbiAgZWxlbWVudFN0eWxpbmdBcHBseUludGVybmFsKGdldEFjdGl2ZUhvc3RDb250ZXh0KCkgISwgZ2V0QWN0aXZlSG9zdEVsZW1lbnRJbmRleCgpICEpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZWxlbWVudFN0eWxpbmdBcHBseUludGVybmFsKGRpcmVjdGl2ZToge30gfCBudWxsLCBpbmRleDogbnVtYmVyKTogdm9pZCB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgaXNGaXJzdFJlbmRlciA9IChsVmlld1tGTEFHU10gJiBMVmlld0ZsYWdzLkZpcnN0TFZpZXdQYXNzKSAhPT0gMDtcbiAgY29uc3QgdG90YWxQbGF5ZXJzUXVldWVkID0gcmVuZGVyU3R5bGluZyhcbiAgICAgIGdldFN0eWxpbmdDb250ZXh0KGluZGV4ICsgSEVBREVSX09GRlNFVCwgbFZpZXcpLCBsVmlld1tSRU5ERVJFUl0sIGxWaWV3LCBpc0ZpcnN0UmVuZGVyLCBudWxsLFxuICAgICAgbnVsbCwgZGlyZWN0aXZlKTtcbiAgaWYgKHRvdGFsUGxheWVyc1F1ZXVlZCA+IDApIHtcbiAgICBjb25zdCByb290Q29udGV4dCA9IGdldFJvb3RDb250ZXh0KGxWaWV3KTtcbiAgICBzY2hlZHVsZVRpY2socm9vdENvbnRleHQsIFJvb3RDb250ZXh0RmxhZ3MuRmx1c2hQbGF5ZXJzKTtcbiAgfVxufSJdfQ==