/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
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
 * \@publicApi
 * @param {?=} classBindingNames An array containing bindable class names.
 *        The `elementClassProp` instruction refers to the class name by index in
 *        this array (i.e. `['foo', 'bar']` means `foo=0` and `bar=1`).
 * @param {?=} styleBindingNames An array containing bindable style properties.
 *        The `elementStyleProp` instruction refers to the class name by index in
 *        this array (i.e. `['width', 'height']` means `width=0` and `height=1`).
 * @param {?=} styleSanitizer An optional sanitizer function that will be used to sanitize any CSS
 *        style values that are applied to the element (during rendering).
 *
 * @return {?}
 */
export function elementStyling(classBindingNames, styleBindingNames, styleSanitizer) {
    /** @type {?} */
    const tNode = getPreviousOrParentTNode();
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
 * \@publicApi
 * @param {?=} classBindingNames An array containing bindable class names.
 *        The `elementHostClassProp` instruction refers to the class name by index in
 *        this array (i.e. `['foo', 'bar']` means `foo=0` and `bar=1`).
 * @param {?=} styleBindingNames An array containing bindable style properties.
 *        The `elementHostStyleProp` instruction refers to the class name by index in
 *        this array (i.e. `['width', 'height']` means `width=0` and `height=1`).
 * @param {?=} styleSanitizer An optional sanitizer function that will be used to sanitize any CSS
 *        style values that are applied to the element (during rendering).
 *        Note that the sanitizer instance itself is tied to the provided `directive` and
 *        will not be used if the same property is assigned in another directive or
 *        on the element directly.
 *
 * @return {?}
 */
export function elementHostStyling(classBindingNames, styleBindingNames, styleSanitizer) {
    /** @type {?} */
    const tNode = getPreviousOrParentTNode();
    if (!tNode.stylingTemplate) {
        tNode.stylingTemplate = createEmptyStylingContext();
    }
    /** @type {?} */
    const directive = getActiveHostContext();
    // despite the binding being applied in a queue (below), the allocation
    // of the directive into the context happens right away. The reason for
    // this is to retain the ordering of the directives (which is important
    // for the prioritization of bindings).
    allocateDirectiveIntoContext(tNode.stylingTemplate, directive);
    /** @type {?} */
    const fns = tNode.onElementCreationFns = tNode.onElementCreationFns || [];
    fns.push((/**
     * @return {?}
     */
    () => initElementStyling(tNode, classBindingNames, styleBindingNames, styleSanitizer, directive)));
}
/**
 * @param {?} tNode
 * @param {?=} classBindingNames
 * @param {?=} styleBindingNames
 * @param {?=} styleSanitizer
 * @param {?=} directive
 * @return {?}
 */
function initElementStyling(tNode, classBindingNames, styleBindingNames, styleSanitizer, directive) {
    updateContextWithBindings((/** @type {?} */ (tNode.stylingTemplate)), directive || null, classBindingNames, styleBindingNames, styleSanitizer);
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
 * \@publicApi
 * @param {?} index Index of the element's with which styling is associated.
 * @param {?} styleIndex Index of style to update. This index value refers to the
 *        index of the style in the style bindings array that was passed into
 *        `elementStyling`.
 * @param {?} value New value to write (falsy to remove). Note that if a directive also
 *        attempts to write to the same binding value (via `elementHostStyleProp`)
 *        then it will only be able to do so if the binding value assigned via
 *        `elementStyleProp` is falsy (or doesn't exist at all).
 * @param {?=} suffix Optional suffix. Used with scalar values to add unit such as `px`.
 *        Note that when a suffix is provided then the underlying sanitizer will
 *        be ignored.
 * @param {?=} forceOverride Whether or not to update the styling value immediately
 *        (despite the other bindings possibly having priority)
 *
 * @return {?}
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
 * \@publicApi
 * @param {?} styleIndex Index of style to update. This index value refers to the
 *        index of the style in the style bindings array that was passed into
 *        `elementHostStyling`.
 * @param {?} value New value to write (falsy to remove). The value may or may not
 *        be applied to the element depending on the template/component/directive
 *        prioritization (see `interfaces/styling.ts`)
 * @param {?=} suffix Optional suffix. Used with scalar values to add unit such as `px`.
 *        Note that when a suffix is provided then the underlying sanitizer will
 *        be ignored.
 * @param {?=} forceOverride Whether or not to update the styling value immediately
 *        (despite the other bindings possibly having priority)
 *
 * @return {?}
 */
export function elementHostStyleProp(styleIndex, value, suffix, forceOverride) {
    elementStylePropInternal((/** @type {?} */ (getActiveHostContext())), (/** @type {?} */ (getActiveHostElementIndex())), styleIndex, value, suffix, forceOverride);
}
/**
 * @param {?} directive
 * @param {?} index
 * @param {?} styleIndex
 * @param {?} value
 * @param {?=} suffix
 * @param {?=} forceOverride
 * @return {?}
 */
function elementStylePropInternal(directive, index, styleIndex, value, suffix, forceOverride) {
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
    updateElementStyleProp(getStylingContext(index + HEADER_OFFSET, getLView()), styleIndex, valueToAdd, directive, forceOverride);
}
/**
 * Update a class binding on an element with the provided value.
 *
 * This instruction is meant to handle the `[class.foo]="exp"` case and,
 * therefore, the class binding itself must already be allocated using
 * `elementStyling` within the creation block.
 *
 * \@publicApi
 * @param {?} index Index of the element's with which styling is associated.
 * @param {?} classIndex Index of class to toggle. This index value refers to the
 *        index of the class in the class bindings array that was passed into
 *        `elementStyling` (which is meant to be called before this
 *        function is).
 * @param {?} value A true/false value which will turn the class on or off.
 * @param {?=} forceOverride Whether or not this value will be applied regardless
 *        of where it is being set within the styling priority structure.
 *
 * @return {?}
 */
export function elementClassProp(index, classIndex, value, forceOverride) {
    elementClassPropInternal(null, index, classIndex, value, forceOverride);
}
/**
 * Update a class host binding for a directive's/component's host element within
 * the host bindings function.
 *
 * This instruction is meant to handle the `\@HostBinding('class.foo')` case and,
 * therefore, the class binding itself must already be allocated using
 * `elementHostStyling` within the creation block.
 *
 * \@publicApi
 * @param {?} classIndex Index of class to toggle. This index value refers to the
 *        index of the class in the class bindings array that was passed into
 *        `elementHostStlying` (which is meant to be called before this
 *        function is).
 * @param {?} value A true/false value which will turn the class on or off.
 * @param {?=} forceOverride Whether or not this value will be applied regardless
 *        of where it is being set within the stylings priority structure.
 *
 * @return {?}
 */
export function elementHostClassProp(classIndex, value, forceOverride) {
    elementClassPropInternal((/** @type {?} */ (getActiveHostContext())), (/** @type {?} */ (getActiveHostElementIndex())), classIndex, value, forceOverride);
}
/**
 * @param {?} directive
 * @param {?} index
 * @param {?} classIndex
 * @param {?} value
 * @param {?=} forceOverride
 * @return {?}
 */
function elementClassPropInternal(directive, index, classIndex, value, forceOverride) {
    /** @type {?} */
    const input = (value instanceof BoundPlayerFactory) ?
        ((/** @type {?} */ (value))) :
        booleanOrNull(value);
    updateElementClassProp(getStylingContext(index + HEADER_OFFSET, getLView()), classIndex, input, directive, forceOverride);
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
 * Update style and/or class bindings using object literals on an element.
 *
 * This instruction is meant to apply styling via the `[style]="exp"` and `[class]="exp"` template
 * bindings. When styles/classes are applied to the element they will then be updated with
 * respect to any styles/classes set with `elementStyleProp` or `elementClassProp`. If any
 * styles or classes are set to falsy then they will be removed from the element.
 *
 * Note that the styling instruction will not be applied until `elementStylingApply` is called.
 *
 * \@publicApi
 * @param {?} index Index of the element's with which styling is associated.
 * @param {?} classes A key/value map or string of CSS classes that will be added to the
 *        given element. Any missing classes (that have already been applied to the element
 *        beforehand) will be removed (unset) from the element's list of CSS classes.
 * @param {?=} styles A key/value style map of the styles that will be applied to the given element.
 *        Any missing styles (that have already been applied to the element beforehand) will be
 *        removed (unset) from the element's styling.
 *
 * @return {?}
 */
export function elementStylingMap(index, classes, styles) {
    elementStylingMapInternal(null, index, classes, styles);
}
/**
 * Update style and/or class host bindings using object literals on an element within the host
 * bindings function for a directive/component.
 *
 * This instruction is meant to apply styling via the `\@HostBinding('style')` and
 * `\@HostBinding('class')` bindings for a component's or directive's host element.
 * When styles/classes are applied to the host element they will then be updated
 * with respect to any styles/classes set with `elementHostStyleProp` or
 * `elementHostClassProp`. If any styles or classes are set to falsy then they
 * will be removed from the element.
 *
 * Note that the styling instruction will not be applied until
 * `elementHostStylingApply` is called.
 *
 * \@publicApi
 * @param {?} classes A key/value map or string of CSS classes that will be added to the
 *        given element. Any missing classes (that have already been applied to the element
 *        beforehand) will be removed (unset) from the element's list of CSS classes.
 * @param {?=} styles A key/value style map of the styles that will be applied to the given element.
 *        Any missing styles (that have already been applied to the element beforehand) will be
 *        removed (unset) from the element's styling.
 *
 * @return {?}
 */
export function elementHostStylingMap(classes, styles) {
    elementStylingMapInternal((/** @type {?} */ (getActiveHostContext())), (/** @type {?} */ (getActiveHostElementIndex())), classes, styles);
}
/**
 * @param {?} directive
 * @param {?} index
 * @param {?} classes
 * @param {?=} styles
 * @return {?}
 */
function elementStylingMapInternal(directive, index, classes, styles) {
    /** @type {?} */
    const lView = getLView();
    /** @type {?} */
    const tNode = getTNode(index, lView);
    /** @type {?} */
    const stylingContext = getStylingContext(index + HEADER_OFFSET, lView);
    // inputs are only evaluated from a template binding into a directive, therefore,
    // there should not be a situation where a directive host bindings function
    // evaluates the inputs (this should only happen in the template function)
    if (!directive) {
        if (hasClassInput(tNode) && classes !== NO_CHANGE) {
            /** @type {?} */
            const initialClasses = getInitialClassNameValue(stylingContext);
            /** @type {?} */
            const classInputVal = (initialClasses.length ? (initialClasses + ' ') : '') + forceClassesAsString(classes);
            setInputsForProperty(lView, (/** @type {?} */ ((/** @type {?} */ (tNode.inputs))['class'])), classInputVal);
            classes = NO_CHANGE;
        }
        if (hasStyleInput(tNode) && styles !== NO_CHANGE) {
            /** @type {?} */
            const initialStyles = getInitialClassNameValue(stylingContext);
            /** @type {?} */
            const styleInputVal = (initialStyles.length ? (initialStyles + ' ') : '') + forceStylesAsString(styles);
            setInputsForProperty(lView, (/** @type {?} */ ((/** @type {?} */ (tNode.inputs))['style'])), styleInputVal);
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
 * \@publicApi
 * @param {?} index Index of the element's with which styling is associated.
 *
 * @return {?}
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
 * \@publicApi
 * @return {?}
 */
export function elementHostStylingApply() {
    elementStylingApplyInternal((/** @type {?} */ (getActiveHostContext())), (/** @type {?} */ (getActiveHostElementIndex())));
}
/**
 * @param {?} directive
 * @param {?} index
 * @return {?}
 */
export function elementStylingApplyInternal(directive, index) {
    /** @type {?} */
    const lView = getLView();
    /** @type {?} */
    const isFirstRender = (lView[FLAGS] & 8 /* FirstLViewPass */) !== 0;
    /** @type {?} */
    const totalPlayersQueued = renderStyling(getStylingContext(index + HEADER_OFFSET, lView), lView[RENDERER], lView, isFirstRender, null, null, directive);
    if (totalPlayersQueued > 0) {
        /** @type {?} */
        const rootContext = getRootContext(lView);
        scheduleTick(rootContext, 2 /* FlushPlayers */);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3R5bGluZ19pbnN0cnVjdGlvbnMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2luc3RydWN0aW9ucy9zdHlsaW5nX2luc3RydWN0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7O0FBVUEsT0FBTyxFQUFDLEtBQUssRUFBRSxhQUFhLEVBQWMsUUFBUSxFQUFtQixNQUFNLG9CQUFvQixDQUFDO0FBQ2hHLE9BQU8sRUFBQyxvQkFBb0IsRUFBRSx5QkFBeUIsRUFBRSxRQUFRLEVBQUUsd0JBQXdCLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDN0csT0FBTyxFQUFDLHdCQUF3QixFQUFFLGFBQWEsRUFBRSxlQUFlLElBQUksc0JBQXNCLEVBQUUseUJBQXlCLEVBQUUsZUFBZSxJQUFJLHNCQUFzQixFQUFFLGdCQUFnQixFQUFDLE1BQU0scUNBQXFDLENBQUM7QUFDL04sT0FBTyxFQUFDLGtCQUFrQixFQUFDLE1BQU0sMkJBQTJCLENBQUM7QUFDN0QsT0FBTyxFQUFDLDRCQUE0QixFQUFFLHlCQUF5QixFQUFFLG9CQUFvQixFQUFFLG1CQUFtQixFQUFFLGlCQUFpQixFQUFFLGFBQWEsRUFBRSxhQUFhLEVBQUMsTUFBTSxpQkFBaUIsQ0FBQztBQUNwTCxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sV0FBVyxDQUFDO0FBQ3BDLE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUNuRCxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sOEJBQThCLENBQUM7QUFDNUQsT0FBTyxFQUFDLFFBQVEsRUFBQyxNQUFNLG9CQUFvQixDQUFDO0FBRTVDLE9BQU8sRUFBQyxZQUFZLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUM1QyxPQUFPLEVBQUMsb0JBQW9CLEVBQUMsTUFBTSxVQUFVLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7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LEVBQUUsS0FBYTs7VUFDdkUsS0FBSyxHQUFHLFFBQVEsRUFBRTs7VUFDbEIsYUFBYSxHQUFHLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyx5QkFBNEIsQ0FBQyxLQUFLLENBQUM7O1VBQ2hFLGtCQUFrQixHQUFHLGFBQWEsQ0FDcEMsaUJBQWlCLENBQUMsS0FBSyxHQUFHLGFBQWEsRUFBRSxLQUFLLENBQUMsRUFBRSxLQUFLLENBQUMsUUFBUSxDQUFDLEVBQUUsS0FBSyxFQUFFLGFBQWEsRUFBRSxJQUFJLEVBQzVGLElBQUksRUFBRSxTQUFTLENBQUM7SUFDcEIsSUFBSSxrQkFBa0IsR0FBRyxDQUFDLEVBQUU7O2NBQ3BCLFdBQVcsR0FBRyxjQUFjLENBQUMsS0FBSyxDQUFDO1FBQ3pDLFlBQVksQ0FBQyxXQUFXLHVCQUFnQyxDQUFDO0tBQzFEO0FBQ0gsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCB7U3R5bGVTYW5pdGl6ZUZufSBmcm9tICcuLi8uLi9zYW5pdGl6YXRpb24vc3R5bGVfc2FuaXRpemVyJztcbmltcG9ydCB7VE5vZGV9IGZyb20gJy4uL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge1BsYXllckZhY3Rvcnl9IGZyb20gJy4uL2ludGVyZmFjZXMvcGxheWVyJztcbmltcG9ydCB7RkxBR1MsIEhFQURFUl9PRkZTRVQsIExWaWV3RmxhZ3MsIFJFTkRFUkVSLCBSb290Q29udGV4dEZsYWdzfSBmcm9tICcuLi9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHtnZXRBY3RpdmVIb3N0Q29udGV4dCwgZ2V0QWN0aXZlSG9zdEVsZW1lbnRJbmRleCwgZ2V0TFZpZXcsIGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZX0gZnJvbSAnLi4vc3RhdGUnO1xuaW1wb3J0IHtnZXRJbml0aWFsQ2xhc3NOYW1lVmFsdWUsIHJlbmRlclN0eWxpbmcsIHVwZGF0ZUNsYXNzUHJvcCBhcyB1cGRhdGVFbGVtZW50Q2xhc3NQcm9wLCB1cGRhdGVDb250ZXh0V2l0aEJpbmRpbmdzLCB1cGRhdGVTdHlsZVByb3AgYXMgdXBkYXRlRWxlbWVudFN0eWxlUHJvcCwgdXBkYXRlU3R5bGluZ01hcH0gZnJvbSAnLi4vc3R5bGluZy9jbGFzc19hbmRfc3R5bGVfYmluZGluZ3MnO1xuaW1wb3J0IHtCb3VuZFBsYXllckZhY3Rvcnl9IGZyb20gJy4uL3N0eWxpbmcvcGxheWVyX2ZhY3RvcnknO1xuaW1wb3J0IHthbGxvY2F0ZURpcmVjdGl2ZUludG9Db250ZXh0LCBjcmVhdGVFbXB0eVN0eWxpbmdDb250ZXh0LCBmb3JjZUNsYXNzZXNBc1N0cmluZywgZm9yY2VTdHlsZXNBc1N0cmluZywgZ2V0U3R5bGluZ0NvbnRleHQsIGhhc0NsYXNzSW5wdXQsIGhhc1N0eWxlSW5wdXR9IGZyb20gJy4uL3N0eWxpbmcvdXRpbCc7XG5pbXBvcnQge05PX0NIQU5HRX0gZnJvbSAnLi4vdG9rZW5zJztcbmltcG9ydCB7cmVuZGVyU3RyaW5naWZ5fSBmcm9tICcuLi91dGlsL21pc2NfdXRpbHMnO1xuaW1wb3J0IHtnZXRSb290Q29udGV4dH0gZnJvbSAnLi4vdXRpbC92aWV3X3RyYXZlcnNhbF91dGlscyc7XG5pbXBvcnQge2dldFROb2RlfSBmcm9tICcuLi91dGlsL3ZpZXdfdXRpbHMnO1xuXG5pbXBvcnQge3NjaGVkdWxlVGlja30gZnJvbSAnLi9pbnN0cnVjdGlvbnMnO1xuaW1wb3J0IHtzZXRJbnB1dHNGb3JQcm9wZXJ0eX0gZnJvbSAnLi9zaGFyZWQnO1xuXG5cblxuLypcbiAqIFRoZSBjb250ZW50cyBvZiB0aGlzIGZpbGUgaW5jbHVkZSB0aGUgaW5zdHJ1Y3Rpb25zIGZvciBhbGwgc3R5bGluZy1yZWxhdGVkXG4gKiBvcGVyYXRpb25zIGluIEFuZ3VsYXIuXG4gKlxuICogVGhlIGluc3RydWN0aW9ucyBwcmVzZW50IGluIHRoaXMgZmlsZSBhcmU6XG4gKlxuICogVGVtcGxhdGUgbGV2ZWwgc3R5bGluZyBpbnN0cnVjdGlvbnM6XG4gKiAtIGVsZW1lbnRTdHlsaW5nXG4gKiAtIGVsZW1lbnRTdHlsaW5nTWFwXG4gKiAtIGVsZW1lbnRTdHlsZVByb3BcbiAqIC0gZWxlbWVudENsYXNzUHJvcFxuICogLSBlbGVtZW50U3R5bGluZ0FwcGx5XG4gKlxuICogSG9zdCBiaW5kaW5ncyBsZXZlbCBzdHlsaW5nIGluc3RydWN0aW9uczpcbiAqIC0gZWxlbWVudEhvc3RTdHlsaW5nXG4gKiAtIGVsZW1lbnRIb3N0U3R5bGluZ01hcFxuICogLSBlbGVtZW50SG9zdFN0eWxlUHJvcFxuICogLSBlbGVtZW50SG9zdENsYXNzUHJvcFxuICogLSBlbGVtZW50SG9zdFN0eWxpbmdBcHBseVxuICovXG5cblxuLyoqXG4gKiBBbGxvY2F0ZXMgc3R5bGUgYW5kIGNsYXNzIGJpbmRpbmcgcHJvcGVydGllcyBvbiB0aGUgZWxlbWVudCBkdXJpbmcgY3JlYXRpb24gbW9kZS5cbiAqXG4gKiBUaGlzIGluc3RydWN0aW9uIGlzIG1lYW50IHRvIGJlIGNhbGxlZCBkdXJpbmcgY3JlYXRpb24gbW9kZSB0byByZWdpc3RlciBhbGxcbiAqIGR5bmFtaWMgc3R5bGUgYW5kIGNsYXNzIGJpbmRpbmdzIG9uIHRoZSBlbGVtZW50LiBOb3RlIHRoYXQgdGhpcyBpcyBvbmx5IHVzZWRcbiAqIGZvciBiaW5kaW5nIHZhbHVlcyAoc2VlIGBlbGVtZW50U3RhcnRgIHRvIGxlYXJuIGhvdyB0byBhc3NpZ24gc3RhdGljIHN0eWxpbmdcbiAqIHZhbHVlcyB0byBhbiBlbGVtZW50KS5cbiAqXG4gKiBAcGFyYW0gY2xhc3NCaW5kaW5nTmFtZXMgQW4gYXJyYXkgY29udGFpbmluZyBiaW5kYWJsZSBjbGFzcyBuYW1lcy5cbiAqICAgICAgICBUaGUgYGVsZW1lbnRDbGFzc1Byb3BgIGluc3RydWN0aW9uIHJlZmVycyB0byB0aGUgY2xhc3MgbmFtZSBieSBpbmRleCBpblxuICogICAgICAgIHRoaXMgYXJyYXkgKGkuZS4gYFsnZm9vJywgJ2JhciddYCBtZWFucyBgZm9vPTBgIGFuZCBgYmFyPTFgKS5cbiAqIEBwYXJhbSBzdHlsZUJpbmRpbmdOYW1lcyBBbiBhcnJheSBjb250YWluaW5nIGJpbmRhYmxlIHN0eWxlIHByb3BlcnRpZXMuXG4gKiAgICAgICAgVGhlIGBlbGVtZW50U3R5bGVQcm9wYCBpbnN0cnVjdGlvbiByZWZlcnMgdG8gdGhlIGNsYXNzIG5hbWUgYnkgaW5kZXggaW5cbiAqICAgICAgICB0aGlzIGFycmF5IChpLmUuIGBbJ3dpZHRoJywgJ2hlaWdodCddYCBtZWFucyBgd2lkdGg9MGAgYW5kIGBoZWlnaHQ9MWApLlxuICogQHBhcmFtIHN0eWxlU2FuaXRpemVyIEFuIG9wdGlvbmFsIHNhbml0aXplciBmdW5jdGlvbiB0aGF0IHdpbGwgYmUgdXNlZCB0byBzYW5pdGl6ZSBhbnkgQ1NTXG4gKiAgICAgICAgc3R5bGUgdmFsdWVzIHRoYXQgYXJlIGFwcGxpZWQgdG8gdGhlIGVsZW1lbnQgKGR1cmluZyByZW5kZXJpbmcpLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVsZW1lbnRTdHlsaW5nKFxuICAgIGNsYXNzQmluZGluZ05hbWVzPzogc3RyaW5nW10gfCBudWxsLCBzdHlsZUJpbmRpbmdOYW1lcz86IHN0cmluZ1tdIHwgbnVsbCxcbiAgICBzdHlsZVNhbml0aXplcj86IFN0eWxlU2FuaXRpemVGbiB8IG51bGwpOiB2b2lkIHtcbiAgY29uc3QgdE5vZGUgPSBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKTtcbiAgaWYgKCF0Tm9kZS5zdHlsaW5nVGVtcGxhdGUpIHtcbiAgICB0Tm9kZS5zdHlsaW5nVGVtcGxhdGUgPSBjcmVhdGVFbXB0eVN0eWxpbmdDb250ZXh0KCk7XG4gIH1cblxuICAvLyBjYWxsaW5nIHRoZSBmdW5jdGlvbiBiZWxvdyBlbnN1cmVzIHRoYXQgdGhlIHRlbXBsYXRlJ3MgYmluZGluZyB2YWx1ZXNcbiAgLy8gYXJlIGFwcGxpZWQgYXMgdGhlIGZpcnN0IHNldCBvZiBiaW5kaW5ncyBpbnRvIHRoZSBjb250ZXh0LiBJZiBhbnkgb3RoZXJcbiAgLy8gc3R5bGluZyBiaW5kaW5ncyBhcmUgc2V0IG9uIHRoZSBzYW1lIGVsZW1lbnQgKGJ5IGRpcmVjdGl2ZXMgYW5kL29yXG4gIC8vIGNvbXBvbmVudHMpIHRoZW4gdGhleSB3aWxsIGJlIGFwcGxpZWQgYXQgdGhlIGVuZCBvZiB0aGUgYGVsZW1lbnRFbmRgXG4gIC8vIGluc3RydWN0aW9uIChiZWNhdXNlIGRpcmVjdGl2ZXMgYXJlIGNyZWF0ZWQgZmlyc3QgYmVmb3JlIHN0eWxpbmcgaXNcbiAgLy8gZXhlY3V0ZWQgZm9yIGEgbmV3IGVsZW1lbnQpLlxuICBpbml0RWxlbWVudFN0eWxpbmcodE5vZGUsIGNsYXNzQmluZGluZ05hbWVzLCBzdHlsZUJpbmRpbmdOYW1lcywgc3R5bGVTYW5pdGl6ZXIsIG51bGwpO1xufVxuXG4vKipcbiAqIEFsbG9jYXRlcyBzdHlsZSBhbmQgY2xhc3MgYmluZGluZyBwcm9wZXJ0aWVzIG9uIHRoZSBob3N0IGVsZW1lbnQgZHVyaW5nIGNyZWF0aW9uIG1vZGVcbiAqIHdpdGhpbiB0aGUgaG9zdCBiaW5kaW5ncyBmdW5jdGlvbiBvZiBhIGRpcmVjdGl2ZSBvciBjb21wb25lbnQuXG4gKlxuICogVGhpcyBpbnN0cnVjdGlvbiBpcyBtZWFudCB0byBiZSBjYWxsZWQgZHVyaW5nIGNyZWF0aW9uIG1vZGUgdG8gcmVnaXN0ZXIgYWxsXG4gKiBkeW5hbWljIHN0eWxlIGFuZCBjbGFzcyBob3N0IGJpbmRpbmdzIG9uIHRoZSBob3N0IGVsZW1lbnQgb2YgYSBkaXJlY3RpdmUgb3JcbiAqIGNvbXBvbmVudC4gTm90ZSB0aGF0IHRoaXMgaXMgb25seSB1c2VkIGZvciBiaW5kaW5nIHZhbHVlcyAoc2VlIGBlbGVtZW50SG9zdEF0dHJzYFxuICogdG8gbGVhcm4gaG93IHRvIGFzc2lnbiBzdGF0aWMgc3R5bGluZyB2YWx1ZXMgdG8gdGhlIGhvc3QgZWxlbWVudCkuXG4gKlxuICogQHBhcmFtIGNsYXNzQmluZGluZ05hbWVzIEFuIGFycmF5IGNvbnRhaW5pbmcgYmluZGFibGUgY2xhc3MgbmFtZXMuXG4gKiAgICAgICAgVGhlIGBlbGVtZW50SG9zdENsYXNzUHJvcGAgaW5zdHJ1Y3Rpb24gcmVmZXJzIHRvIHRoZSBjbGFzcyBuYW1lIGJ5IGluZGV4IGluXG4gKiAgICAgICAgdGhpcyBhcnJheSAoaS5lLiBgWydmb28nLCAnYmFyJ11gIG1lYW5zIGBmb289MGAgYW5kIGBiYXI9MWApLlxuICogQHBhcmFtIHN0eWxlQmluZGluZ05hbWVzIEFuIGFycmF5IGNvbnRhaW5pbmcgYmluZGFibGUgc3R5bGUgcHJvcGVydGllcy5cbiAqICAgICAgICBUaGUgYGVsZW1lbnRIb3N0U3R5bGVQcm9wYCBpbnN0cnVjdGlvbiByZWZlcnMgdG8gdGhlIGNsYXNzIG5hbWUgYnkgaW5kZXggaW5cbiAqICAgICAgICB0aGlzIGFycmF5IChpLmUuIGBbJ3dpZHRoJywgJ2hlaWdodCddYCBtZWFucyBgd2lkdGg9MGAgYW5kIGBoZWlnaHQ9MWApLlxuICogQHBhcmFtIHN0eWxlU2FuaXRpemVyIEFuIG9wdGlvbmFsIHNhbml0aXplciBmdW5jdGlvbiB0aGF0IHdpbGwgYmUgdXNlZCB0byBzYW5pdGl6ZSBhbnkgQ1NTXG4gKiAgICAgICAgc3R5bGUgdmFsdWVzIHRoYXQgYXJlIGFwcGxpZWQgdG8gdGhlIGVsZW1lbnQgKGR1cmluZyByZW5kZXJpbmcpLlxuICogICAgICAgIE5vdGUgdGhhdCB0aGUgc2FuaXRpemVyIGluc3RhbmNlIGl0c2VsZiBpcyB0aWVkIHRvIHRoZSBwcm92aWRlZCBgZGlyZWN0aXZlYCBhbmRcbiAqICAgICAgICB3aWxsIG5vdCBiZSB1c2VkIGlmIHRoZSBzYW1lIHByb3BlcnR5IGlzIGFzc2lnbmVkIGluIGFub3RoZXIgZGlyZWN0aXZlIG9yXG4gKiAgICAgICAgb24gdGhlIGVsZW1lbnQgZGlyZWN0bHkuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gZWxlbWVudEhvc3RTdHlsaW5nKFxuICAgIGNsYXNzQmluZGluZ05hbWVzPzogc3RyaW5nW10gfCBudWxsLCBzdHlsZUJpbmRpbmdOYW1lcz86IHN0cmluZ1tdIHwgbnVsbCxcbiAgICBzdHlsZVNhbml0aXplcj86IFN0eWxlU2FuaXRpemVGbiB8IG51bGwpOiB2b2lkIHtcbiAgY29uc3QgdE5vZGUgPSBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKTtcbiAgaWYgKCF0Tm9kZS5zdHlsaW5nVGVtcGxhdGUpIHtcbiAgICB0Tm9kZS5zdHlsaW5nVGVtcGxhdGUgPSBjcmVhdGVFbXB0eVN0eWxpbmdDb250ZXh0KCk7XG4gIH1cblxuICBjb25zdCBkaXJlY3RpdmUgPSBnZXRBY3RpdmVIb3N0Q29udGV4dCgpO1xuXG4gIC8vIGRlc3BpdGUgdGhlIGJpbmRpbmcgYmVpbmcgYXBwbGllZCBpbiBhIHF1ZXVlIChiZWxvdyksIHRoZSBhbGxvY2F0aW9uXG4gIC8vIG9mIHRoZSBkaXJlY3RpdmUgaW50byB0aGUgY29udGV4dCBoYXBwZW5zIHJpZ2h0IGF3YXkuIFRoZSByZWFzb24gZm9yXG4gIC8vIHRoaXMgaXMgdG8gcmV0YWluIHRoZSBvcmRlcmluZyBvZiB0aGUgZGlyZWN0aXZlcyAod2hpY2ggaXMgaW1wb3J0YW50XG4gIC8vIGZvciB0aGUgcHJpb3JpdGl6YXRpb24gb2YgYmluZGluZ3MpLlxuICBhbGxvY2F0ZURpcmVjdGl2ZUludG9Db250ZXh0KHROb2RlLnN0eWxpbmdUZW1wbGF0ZSwgZGlyZWN0aXZlKTtcblxuICBjb25zdCBmbnMgPSB0Tm9kZS5vbkVsZW1lbnRDcmVhdGlvbkZucyA9IHROb2RlLm9uRWxlbWVudENyZWF0aW9uRm5zIHx8IFtdO1xuICBmbnMucHVzaChcbiAgICAgICgpID0+IGluaXRFbGVtZW50U3R5bGluZyhcbiAgICAgICAgICB0Tm9kZSwgY2xhc3NCaW5kaW5nTmFtZXMsIHN0eWxlQmluZGluZ05hbWVzLCBzdHlsZVNhbml0aXplciwgZGlyZWN0aXZlKSk7XG59XG5cbmZ1bmN0aW9uIGluaXRFbGVtZW50U3R5bGluZyhcbiAgICB0Tm9kZTogVE5vZGUsIGNsYXNzQmluZGluZ05hbWVzPzogc3RyaW5nW10gfCBudWxsLCBzdHlsZUJpbmRpbmdOYW1lcz86IHN0cmluZ1tdIHwgbnVsbCxcbiAgICBzdHlsZVNhbml0aXplcj86IFN0eWxlU2FuaXRpemVGbiB8IG51bGwsIGRpcmVjdGl2ZT86IHt9IHwgbnVsbCk6IHZvaWQge1xuICB1cGRhdGVDb250ZXh0V2l0aEJpbmRpbmdzKFxuICAgICAgdE5vZGUuc3R5bGluZ1RlbXBsYXRlICEsIGRpcmVjdGl2ZSB8fCBudWxsLCBjbGFzc0JpbmRpbmdOYW1lcywgc3R5bGVCaW5kaW5nTmFtZXMsXG4gICAgICBzdHlsZVNhbml0aXplcik7XG59XG5cblxuLyoqXG4gKiBVcGRhdGUgYSBzdHlsZSBiaW5kaW5nIG9uIGFuIGVsZW1lbnQgd2l0aCB0aGUgcHJvdmlkZWQgdmFsdWUuXG4gKlxuICogSWYgdGhlIHN0eWxlIHZhbHVlIGlzIGZhbHN5IHRoZW4gaXQgd2lsbCBiZSByZW1vdmVkIGZyb20gdGhlIGVsZW1lbnRcbiAqIChvciBhc3NpZ25lZCBhIGRpZmZlcmVudCB2YWx1ZSBkZXBlbmRpbmcgaWYgdGhlcmUgYXJlIGFueSBzdHlsZXMgcGxhY2VkXG4gKiBvbiB0aGUgZWxlbWVudCB3aXRoIGBlbGVtZW50U3R5bGluZ01hcGAgb3IgYW55IHN0YXRpYyBzdHlsZXMgdGhhdCBhcmVcbiAqIHByZXNlbnQgZnJvbSB3aGVuIHRoZSBlbGVtZW50IHdhcyBjcmVhdGVkIHdpdGggYGVsZW1lbnRTdHlsaW5nYCkuXG4gKlxuICogTm90ZSB0aGF0IHRoZSBzdHlsaW5nIGVsZW1lbnQgaXMgdXBkYXRlZCBhcyBwYXJ0IG9mIGBlbGVtZW50U3R5bGluZ0FwcGx5YC5cbiAqXG4gKiBAcGFyYW0gaW5kZXggSW5kZXggb2YgdGhlIGVsZW1lbnQncyB3aXRoIHdoaWNoIHN0eWxpbmcgaXMgYXNzb2NpYXRlZC5cbiAqIEBwYXJhbSBzdHlsZUluZGV4IEluZGV4IG9mIHN0eWxlIHRvIHVwZGF0ZS4gVGhpcyBpbmRleCB2YWx1ZSByZWZlcnMgdG8gdGhlXG4gKiAgICAgICAgaW5kZXggb2YgdGhlIHN0eWxlIGluIHRoZSBzdHlsZSBiaW5kaW5ncyBhcnJheSB0aGF0IHdhcyBwYXNzZWQgaW50b1xuICogICAgICAgIGBlbGVtZW50U3R5bGluZ2AuXG4gKiBAcGFyYW0gdmFsdWUgTmV3IHZhbHVlIHRvIHdyaXRlIChmYWxzeSB0byByZW1vdmUpLiBOb3RlIHRoYXQgaWYgYSBkaXJlY3RpdmUgYWxzb1xuICogICAgICAgIGF0dGVtcHRzIHRvIHdyaXRlIHRvIHRoZSBzYW1lIGJpbmRpbmcgdmFsdWUgKHZpYSBgZWxlbWVudEhvc3RTdHlsZVByb3BgKVxuICogICAgICAgIHRoZW4gaXQgd2lsbCBvbmx5IGJlIGFibGUgdG8gZG8gc28gaWYgdGhlIGJpbmRpbmcgdmFsdWUgYXNzaWduZWQgdmlhXG4gKiAgICAgICAgYGVsZW1lbnRTdHlsZVByb3BgIGlzIGZhbHN5IChvciBkb2Vzbid0IGV4aXN0IGF0IGFsbCkuXG4gKiBAcGFyYW0gc3VmZml4IE9wdGlvbmFsIHN1ZmZpeC4gVXNlZCB3aXRoIHNjYWxhciB2YWx1ZXMgdG8gYWRkIHVuaXQgc3VjaCBhcyBgcHhgLlxuICogICAgICAgIE5vdGUgdGhhdCB3aGVuIGEgc3VmZml4IGlzIHByb3ZpZGVkIHRoZW4gdGhlIHVuZGVybHlpbmcgc2FuaXRpemVyIHdpbGxcbiAqICAgICAgICBiZSBpZ25vcmVkLlxuICogQHBhcmFtIGZvcmNlT3ZlcnJpZGUgV2hldGhlciBvciBub3QgdG8gdXBkYXRlIHRoZSBzdHlsaW5nIHZhbHVlIGltbWVkaWF0ZWx5XG4gKiAgICAgICAgKGRlc3BpdGUgdGhlIG90aGVyIGJpbmRpbmdzIHBvc3NpYmx5IGhhdmluZyBwcmlvcml0eSlcbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbGVtZW50U3R5bGVQcm9wKFxuICAgIGluZGV4OiBudW1iZXIsIHN0eWxlSW5kZXg6IG51bWJlciwgdmFsdWU6IHN0cmluZyB8IG51bWJlciB8IFN0cmluZyB8IFBsYXllckZhY3RvcnkgfCBudWxsLFxuICAgIHN1ZmZpeD86IHN0cmluZyB8IG51bGwsIGZvcmNlT3ZlcnJpZGU/OiBib29sZWFuKTogdm9pZCB7XG4gIGVsZW1lbnRTdHlsZVByb3BJbnRlcm5hbChudWxsLCBpbmRleCwgc3R5bGVJbmRleCwgdmFsdWUsIHN1ZmZpeCwgZm9yY2VPdmVycmlkZSk7XG59XG5cbi8qKlxuICogVXBkYXRlIGEgaG9zdCBzdHlsZSBiaW5kaW5nIHZhbHVlIG9uIHRoZSBob3N0IGVsZW1lbnQgd2l0aGluIGEgY29tcG9uZW50L2RpcmVjdGl2ZS5cbiAqXG4gKiBJZiB0aGUgc3R5bGUgdmFsdWUgaXMgZmFsc3kgdGhlbiBpdCB3aWxsIGJlIHJlbW92ZWQgZnJvbSB0aGUgaG9zdCBlbGVtZW50XG4gKiAob3IgYXNzaWduZWQgYSBkaWZmZXJlbnQgdmFsdWUgZGVwZW5kaW5nIGlmIHRoZXJlIGFyZSBhbnkgc3R5bGVzIHBsYWNlZFxuICogb24gdGhlIHNhbWUgZWxlbWVudCB3aXRoIGBlbGVtZW50SG9zdFN0eWxpbmdNYXBgIG9yIGFueSBzdGF0aWMgc3R5bGVzIHRoYXRcbiAqIGFyZSBwcmVzZW50IGZyb20gd2hlbiB0aGUgZWxlbWVudCB3YXMgcGF0Y2hlZCB3aXRoIGBlbGVtZW50SG9zdFN0eWxpbmdgKS5cbiAqXG4gKiBOb3RlIHRoYXQgdGhlIHN0eWxpbmcgYXBwbGllZCB0byB0aGUgaG9zdCBlbGVtZW50IG9uY2VcbiAqIGBlbGVtZW50SG9zdFN0eWxpbmdBcHBseWAgaXMgY2FsbGVkLlxuICpcbiAqIEBwYXJhbSBzdHlsZUluZGV4IEluZGV4IG9mIHN0eWxlIHRvIHVwZGF0ZS4gVGhpcyBpbmRleCB2YWx1ZSByZWZlcnMgdG8gdGhlXG4gKiAgICAgICAgaW5kZXggb2YgdGhlIHN0eWxlIGluIHRoZSBzdHlsZSBiaW5kaW5ncyBhcnJheSB0aGF0IHdhcyBwYXNzZWQgaW50b1xuICogICAgICAgIGBlbGVtZW50SG9zdFN0eWxpbmdgLlxuICogQHBhcmFtIHZhbHVlIE5ldyB2YWx1ZSB0byB3cml0ZSAoZmFsc3kgdG8gcmVtb3ZlKS4gVGhlIHZhbHVlIG1heSBvciBtYXkgbm90XG4gKiAgICAgICAgYmUgYXBwbGllZCB0byB0aGUgZWxlbWVudCBkZXBlbmRpbmcgb24gdGhlIHRlbXBsYXRlL2NvbXBvbmVudC9kaXJlY3RpdmVcbiAqICAgICAgICBwcmlvcml0aXphdGlvbiAoc2VlIGBpbnRlcmZhY2VzL3N0eWxpbmcudHNgKVxuICogQHBhcmFtIHN1ZmZpeCBPcHRpb25hbCBzdWZmaXguIFVzZWQgd2l0aCBzY2FsYXIgdmFsdWVzIHRvIGFkZCB1bml0IHN1Y2ggYXMgYHB4YC5cbiAqICAgICAgICBOb3RlIHRoYXQgd2hlbiBhIHN1ZmZpeCBpcyBwcm92aWRlZCB0aGVuIHRoZSB1bmRlcmx5aW5nIHNhbml0aXplciB3aWxsXG4gKiAgICAgICAgYmUgaWdub3JlZC5cbiAqIEBwYXJhbSBmb3JjZU92ZXJyaWRlIFdoZXRoZXIgb3Igbm90IHRvIHVwZGF0ZSB0aGUgc3R5bGluZyB2YWx1ZSBpbW1lZGlhdGVseVxuICogICAgICAgIChkZXNwaXRlIHRoZSBvdGhlciBiaW5kaW5ncyBwb3NzaWJseSBoYXZpbmcgcHJpb3JpdHkpXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gZWxlbWVudEhvc3RTdHlsZVByb3AoXG4gICAgc3R5bGVJbmRleDogbnVtYmVyLCB2YWx1ZTogc3RyaW5nIHwgbnVtYmVyIHwgU3RyaW5nIHwgUGxheWVyRmFjdG9yeSB8IG51bGwsXG4gICAgc3VmZml4Pzogc3RyaW5nIHwgbnVsbCwgZm9yY2VPdmVycmlkZT86IGJvb2xlYW4pOiB2b2lkIHtcbiAgZWxlbWVudFN0eWxlUHJvcEludGVybmFsKFxuICAgICAgZ2V0QWN0aXZlSG9zdENvbnRleHQoKSAhLCBnZXRBY3RpdmVIb3N0RWxlbWVudEluZGV4KCkgISwgc3R5bGVJbmRleCwgdmFsdWUsIHN1ZmZpeCxcbiAgICAgIGZvcmNlT3ZlcnJpZGUpO1xufVxuXG5mdW5jdGlvbiBlbGVtZW50U3R5bGVQcm9wSW50ZXJuYWwoXG4gICAgZGlyZWN0aXZlOiB7fSB8IG51bGwsIGluZGV4OiBudW1iZXIsIHN0eWxlSW5kZXg6IG51bWJlcixcbiAgICB2YWx1ZTogc3RyaW5nIHwgbnVtYmVyIHwgU3RyaW5nIHwgUGxheWVyRmFjdG9yeSB8IG51bGwsIHN1ZmZpeD86IHN0cmluZyB8IG51bGwsXG4gICAgZm9yY2VPdmVycmlkZT86IGJvb2xlYW4pOiB2b2lkIHtcbiAgbGV0IHZhbHVlVG9BZGQ6IHN0cmluZ3xudWxsID0gbnVsbDtcbiAgaWYgKHZhbHVlICE9PSBudWxsKSB7XG4gICAgaWYgKHN1ZmZpeCkge1xuICAgICAgLy8gd2hlbiBhIHN1ZmZpeCBpcyBhcHBsaWVkIHRoZW4gaXQgd2lsbCBieXBhc3NcbiAgICAgIC8vIHNhbml0aXphdGlvbiBlbnRpcmVseSAoYi9jIGEgbmV3IHN0cmluZyBpcyBjcmVhdGVkKVxuICAgICAgdmFsdWVUb0FkZCA9IHJlbmRlclN0cmluZ2lmeSh2YWx1ZSkgKyBzdWZmaXg7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIHNhbml0aXphdGlvbiBoYXBwZW5zIGJ5IGRlYWxpbmcgd2l0aCBhIFN0cmluZyB2YWx1ZVxuICAgICAgLy8gdGhpcyBtZWFucyB0aGF0IHRoZSBzdHJpbmcgdmFsdWUgd2lsbCBiZSBwYXNzZWQgdGhyb3VnaFxuICAgICAgLy8gaW50byB0aGUgc3R5bGUgcmVuZGVyaW5nIGxhdGVyICh3aGljaCBpcyB3aGVyZSB0aGUgdmFsdWVcbiAgICAgIC8vIHdpbGwgYmUgc2FuaXRpemVkIGJlZm9yZSBpdCBpcyBhcHBsaWVkKVxuICAgICAgdmFsdWVUb0FkZCA9IHZhbHVlIGFzIGFueSBhcyBzdHJpbmc7XG4gICAgfVxuICB9XG4gIHVwZGF0ZUVsZW1lbnRTdHlsZVByb3AoXG4gICAgICBnZXRTdHlsaW5nQ29udGV4dChpbmRleCArIEhFQURFUl9PRkZTRVQsIGdldExWaWV3KCkpLCBzdHlsZUluZGV4LCB2YWx1ZVRvQWRkLCBkaXJlY3RpdmUsXG4gICAgICBmb3JjZU92ZXJyaWRlKTtcbn1cblxuXG4vKipcbiAqIFVwZGF0ZSBhIGNsYXNzIGJpbmRpbmcgb24gYW4gZWxlbWVudCB3aXRoIHRoZSBwcm92aWRlZCB2YWx1ZS5cbiAqXG4gKiBUaGlzIGluc3RydWN0aW9uIGlzIG1lYW50IHRvIGhhbmRsZSB0aGUgYFtjbGFzcy5mb29dPVwiZXhwXCJgIGNhc2UgYW5kLFxuICogdGhlcmVmb3JlLCB0aGUgY2xhc3MgYmluZGluZyBpdHNlbGYgbXVzdCBhbHJlYWR5IGJlIGFsbG9jYXRlZCB1c2luZ1xuICogYGVsZW1lbnRTdHlsaW5nYCB3aXRoaW4gdGhlIGNyZWF0aW9uIGJsb2NrLlxuICpcbiAqIEBwYXJhbSBpbmRleCBJbmRleCBvZiB0aGUgZWxlbWVudCdzIHdpdGggd2hpY2ggc3R5bGluZyBpcyBhc3NvY2lhdGVkLlxuICogQHBhcmFtIGNsYXNzSW5kZXggSW5kZXggb2YgY2xhc3MgdG8gdG9nZ2xlLiBUaGlzIGluZGV4IHZhbHVlIHJlZmVycyB0byB0aGVcbiAqICAgICAgICBpbmRleCBvZiB0aGUgY2xhc3MgaW4gdGhlIGNsYXNzIGJpbmRpbmdzIGFycmF5IHRoYXQgd2FzIHBhc3NlZCBpbnRvXG4gKiAgICAgICAgYGVsZW1lbnRTdHlsaW5nYCAod2hpY2ggaXMgbWVhbnQgdG8gYmUgY2FsbGVkIGJlZm9yZSB0aGlzXG4gKiAgICAgICAgZnVuY3Rpb24gaXMpLlxuICogQHBhcmFtIHZhbHVlIEEgdHJ1ZS9mYWxzZSB2YWx1ZSB3aGljaCB3aWxsIHR1cm4gdGhlIGNsYXNzIG9uIG9yIG9mZi5cbiAqIEBwYXJhbSBmb3JjZU92ZXJyaWRlIFdoZXRoZXIgb3Igbm90IHRoaXMgdmFsdWUgd2lsbCBiZSBhcHBsaWVkIHJlZ2FyZGxlc3NcbiAqICAgICAgICBvZiB3aGVyZSBpdCBpcyBiZWluZyBzZXQgd2l0aGluIHRoZSBzdHlsaW5nIHByaW9yaXR5IHN0cnVjdHVyZS5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbGVtZW50Q2xhc3NQcm9wKFxuICAgIGluZGV4OiBudW1iZXIsIGNsYXNzSW5kZXg6IG51bWJlciwgdmFsdWU6IGJvb2xlYW4gfCBQbGF5ZXJGYWN0b3J5LFxuICAgIGZvcmNlT3ZlcnJpZGU/OiBib29sZWFuKTogdm9pZCB7XG4gIGVsZW1lbnRDbGFzc1Byb3BJbnRlcm5hbChudWxsLCBpbmRleCwgY2xhc3NJbmRleCwgdmFsdWUsIGZvcmNlT3ZlcnJpZGUpO1xufVxuXG5cbi8qKlxuICogVXBkYXRlIGEgY2xhc3MgaG9zdCBiaW5kaW5nIGZvciBhIGRpcmVjdGl2ZSdzL2NvbXBvbmVudCdzIGhvc3QgZWxlbWVudCB3aXRoaW5cbiAqIHRoZSBob3N0IGJpbmRpbmdzIGZ1bmN0aW9uLlxuICpcbiAqIFRoaXMgaW5zdHJ1Y3Rpb24gaXMgbWVhbnQgdG8gaGFuZGxlIHRoZSBgQEhvc3RCaW5kaW5nKCdjbGFzcy5mb28nKWAgY2FzZSBhbmQsXG4gKiB0aGVyZWZvcmUsIHRoZSBjbGFzcyBiaW5kaW5nIGl0c2VsZiBtdXN0IGFscmVhZHkgYmUgYWxsb2NhdGVkIHVzaW5nXG4gKiBgZWxlbWVudEhvc3RTdHlsaW5nYCB3aXRoaW4gdGhlIGNyZWF0aW9uIGJsb2NrLlxuICpcbiAqIEBwYXJhbSBjbGFzc0luZGV4IEluZGV4IG9mIGNsYXNzIHRvIHRvZ2dsZS4gVGhpcyBpbmRleCB2YWx1ZSByZWZlcnMgdG8gdGhlXG4gKiAgICAgICAgaW5kZXggb2YgdGhlIGNsYXNzIGluIHRoZSBjbGFzcyBiaW5kaW5ncyBhcnJheSB0aGF0IHdhcyBwYXNzZWQgaW50b1xuICogICAgICAgIGBlbGVtZW50SG9zdFN0bHlpbmdgICh3aGljaCBpcyBtZWFudCB0byBiZSBjYWxsZWQgYmVmb3JlIHRoaXNcbiAqICAgICAgICBmdW5jdGlvbiBpcykuXG4gKiBAcGFyYW0gdmFsdWUgQSB0cnVlL2ZhbHNlIHZhbHVlIHdoaWNoIHdpbGwgdHVybiB0aGUgY2xhc3Mgb24gb3Igb2ZmLlxuICogQHBhcmFtIGZvcmNlT3ZlcnJpZGUgV2hldGhlciBvciBub3QgdGhpcyB2YWx1ZSB3aWxsIGJlIGFwcGxpZWQgcmVnYXJkbGVzc1xuICogICAgICAgIG9mIHdoZXJlIGl0IGlzIGJlaW5nIHNldCB3aXRoaW4gdGhlIHN0eWxpbmdzIHByaW9yaXR5IHN0cnVjdHVyZS5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbGVtZW50SG9zdENsYXNzUHJvcChcbiAgICBjbGFzc0luZGV4OiBudW1iZXIsIHZhbHVlOiBib29sZWFuIHwgUGxheWVyRmFjdG9yeSwgZm9yY2VPdmVycmlkZT86IGJvb2xlYW4pOiB2b2lkIHtcbiAgZWxlbWVudENsYXNzUHJvcEludGVybmFsKFxuICAgICAgZ2V0QWN0aXZlSG9zdENvbnRleHQoKSAhLCBnZXRBY3RpdmVIb3N0RWxlbWVudEluZGV4KCkgISwgY2xhc3NJbmRleCwgdmFsdWUsIGZvcmNlT3ZlcnJpZGUpO1xufVxuXG5mdW5jdGlvbiBlbGVtZW50Q2xhc3NQcm9wSW50ZXJuYWwoXG4gICAgZGlyZWN0aXZlOiB7fSB8IG51bGwsIGluZGV4OiBudW1iZXIsIGNsYXNzSW5kZXg6IG51bWJlciwgdmFsdWU6IGJvb2xlYW4gfCBQbGF5ZXJGYWN0b3J5LFxuICAgIGZvcmNlT3ZlcnJpZGU/OiBib29sZWFuKTogdm9pZCB7XG4gIGNvbnN0IGlucHV0ID0gKHZhbHVlIGluc3RhbmNlb2YgQm91bmRQbGF5ZXJGYWN0b3J5KSA/XG4gICAgICAodmFsdWUgYXMgQm91bmRQbGF5ZXJGYWN0b3J5PGJvb2xlYW58bnVsbD4pIDpcbiAgICAgIGJvb2xlYW5Pck51bGwodmFsdWUpO1xuICB1cGRhdGVFbGVtZW50Q2xhc3NQcm9wKFxuICAgICAgZ2V0U3R5bGluZ0NvbnRleHQoaW5kZXggKyBIRUFERVJfT0ZGU0VULCBnZXRMVmlldygpKSwgY2xhc3NJbmRleCwgaW5wdXQsIGRpcmVjdGl2ZSxcbiAgICAgIGZvcmNlT3ZlcnJpZGUpO1xufVxuXG5mdW5jdGlvbiBib29sZWFuT3JOdWxsKHZhbHVlOiBhbnkpOiBib29sZWFufG51bGwge1xuICBpZiAodHlwZW9mIHZhbHVlID09PSAnYm9vbGVhbicpIHJldHVybiB2YWx1ZTtcbiAgcmV0dXJuIHZhbHVlID8gdHJ1ZSA6IG51bGw7XG59XG5cblxuLyoqXG4gKiBVcGRhdGUgc3R5bGUgYW5kL29yIGNsYXNzIGJpbmRpbmdzIHVzaW5nIG9iamVjdCBsaXRlcmFscyBvbiBhbiBlbGVtZW50LlxuICpcbiAqIFRoaXMgaW5zdHJ1Y3Rpb24gaXMgbWVhbnQgdG8gYXBwbHkgc3R5bGluZyB2aWEgdGhlIGBbc3R5bGVdPVwiZXhwXCJgIGFuZCBgW2NsYXNzXT1cImV4cFwiYCB0ZW1wbGF0ZVxuICogYmluZGluZ3MuIFdoZW4gc3R5bGVzL2NsYXNzZXMgYXJlIGFwcGxpZWQgdG8gdGhlIGVsZW1lbnQgdGhleSB3aWxsIHRoZW4gYmUgdXBkYXRlZCB3aXRoXG4gKiByZXNwZWN0IHRvIGFueSBzdHlsZXMvY2xhc3NlcyBzZXQgd2l0aCBgZWxlbWVudFN0eWxlUHJvcGAgb3IgYGVsZW1lbnRDbGFzc1Byb3BgLiBJZiBhbnlcbiAqIHN0eWxlcyBvciBjbGFzc2VzIGFyZSBzZXQgdG8gZmFsc3kgdGhlbiB0aGV5IHdpbGwgYmUgcmVtb3ZlZCBmcm9tIHRoZSBlbGVtZW50LlxuICpcbiAqIE5vdGUgdGhhdCB0aGUgc3R5bGluZyBpbnN0cnVjdGlvbiB3aWxsIG5vdCBiZSBhcHBsaWVkIHVudGlsIGBlbGVtZW50U3R5bGluZ0FwcGx5YCBpcyBjYWxsZWQuXG4gKlxuICogQHBhcmFtIGluZGV4IEluZGV4IG9mIHRoZSBlbGVtZW50J3Mgd2l0aCB3aGljaCBzdHlsaW5nIGlzIGFzc29jaWF0ZWQuXG4gKiBAcGFyYW0gY2xhc3NlcyBBIGtleS92YWx1ZSBtYXAgb3Igc3RyaW5nIG9mIENTUyBjbGFzc2VzIHRoYXQgd2lsbCBiZSBhZGRlZCB0byB0aGVcbiAqICAgICAgICBnaXZlbiBlbGVtZW50LiBBbnkgbWlzc2luZyBjbGFzc2VzICh0aGF0IGhhdmUgYWxyZWFkeSBiZWVuIGFwcGxpZWQgdG8gdGhlIGVsZW1lbnRcbiAqICAgICAgICBiZWZvcmVoYW5kKSB3aWxsIGJlIHJlbW92ZWQgKHVuc2V0KSBmcm9tIHRoZSBlbGVtZW50J3MgbGlzdCBvZiBDU1MgY2xhc3Nlcy5cbiAqIEBwYXJhbSBzdHlsZXMgQSBrZXkvdmFsdWUgc3R5bGUgbWFwIG9mIHRoZSBzdHlsZXMgdGhhdCB3aWxsIGJlIGFwcGxpZWQgdG8gdGhlIGdpdmVuIGVsZW1lbnQuXG4gKiAgICAgICAgQW55IG1pc3Npbmcgc3R5bGVzICh0aGF0IGhhdmUgYWxyZWFkeSBiZWVuIGFwcGxpZWQgdG8gdGhlIGVsZW1lbnQgYmVmb3JlaGFuZCkgd2lsbCBiZVxuICogICAgICAgIHJlbW92ZWQgKHVuc2V0KSBmcm9tIHRoZSBlbGVtZW50J3Mgc3R5bGluZy5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbGVtZW50U3R5bGluZ01hcChcbiAgICBpbmRleDogbnVtYmVyLCBjbGFzc2VzOiB7W2tleTogc3RyaW5nXTogYW55fSB8IHN0cmluZyB8IE5PX0NIQU5HRSB8IG51bGwsXG4gICAgc3R5bGVzPzoge1tzdHlsZU5hbWU6IHN0cmluZ106IGFueX0gfCBOT19DSEFOR0UgfCBudWxsKTogdm9pZCB7XG4gIGVsZW1lbnRTdHlsaW5nTWFwSW50ZXJuYWwobnVsbCwgaW5kZXgsIGNsYXNzZXMsIHN0eWxlcyk7XG59XG5cblxuLyoqXG4gKiBVcGRhdGUgc3R5bGUgYW5kL29yIGNsYXNzIGhvc3QgYmluZGluZ3MgdXNpbmcgb2JqZWN0IGxpdGVyYWxzIG9uIGFuIGVsZW1lbnQgd2l0aGluIHRoZSBob3N0XG4gKiBiaW5kaW5ncyBmdW5jdGlvbiBmb3IgYSBkaXJlY3RpdmUvY29tcG9uZW50LlxuICpcbiAqIFRoaXMgaW5zdHJ1Y3Rpb24gaXMgbWVhbnQgdG8gYXBwbHkgc3R5bGluZyB2aWEgdGhlIGBASG9zdEJpbmRpbmcoJ3N0eWxlJylgIGFuZFxuICogYEBIb3N0QmluZGluZygnY2xhc3MnKWAgYmluZGluZ3MgZm9yIGEgY29tcG9uZW50J3Mgb3IgZGlyZWN0aXZlJ3MgaG9zdCBlbGVtZW50LlxuICogV2hlbiBzdHlsZXMvY2xhc3NlcyBhcmUgYXBwbGllZCB0byB0aGUgaG9zdCBlbGVtZW50IHRoZXkgd2lsbCB0aGVuIGJlIHVwZGF0ZWRcbiAqIHdpdGggcmVzcGVjdCB0byBhbnkgc3R5bGVzL2NsYXNzZXMgc2V0IHdpdGggYGVsZW1lbnRIb3N0U3R5bGVQcm9wYCBvclxuICogYGVsZW1lbnRIb3N0Q2xhc3NQcm9wYC4gSWYgYW55IHN0eWxlcyBvciBjbGFzc2VzIGFyZSBzZXQgdG8gZmFsc3kgdGhlbiB0aGV5XG4gKiB3aWxsIGJlIHJlbW92ZWQgZnJvbSB0aGUgZWxlbWVudC5cbiAqXG4gKiBOb3RlIHRoYXQgdGhlIHN0eWxpbmcgaW5zdHJ1Y3Rpb24gd2lsbCBub3QgYmUgYXBwbGllZCB1bnRpbFxuICogYGVsZW1lbnRIb3N0U3R5bGluZ0FwcGx5YCBpcyBjYWxsZWQuXG4gKlxuICogQHBhcmFtIGNsYXNzZXMgQSBrZXkvdmFsdWUgbWFwIG9yIHN0cmluZyBvZiBDU1MgY2xhc3NlcyB0aGF0IHdpbGwgYmUgYWRkZWQgdG8gdGhlXG4gKiAgICAgICAgZ2l2ZW4gZWxlbWVudC4gQW55IG1pc3NpbmcgY2xhc3NlcyAodGhhdCBoYXZlIGFscmVhZHkgYmVlbiBhcHBsaWVkIHRvIHRoZSBlbGVtZW50XG4gKiAgICAgICAgYmVmb3JlaGFuZCkgd2lsbCBiZSByZW1vdmVkICh1bnNldCkgZnJvbSB0aGUgZWxlbWVudCdzIGxpc3Qgb2YgQ1NTIGNsYXNzZXMuXG4gKiBAcGFyYW0gc3R5bGVzIEEga2V5L3ZhbHVlIHN0eWxlIG1hcCBvZiB0aGUgc3R5bGVzIHRoYXQgd2lsbCBiZSBhcHBsaWVkIHRvIHRoZSBnaXZlbiBlbGVtZW50LlxuICogICAgICAgIEFueSBtaXNzaW5nIHN0eWxlcyAodGhhdCBoYXZlIGFscmVhZHkgYmVlbiBhcHBsaWVkIHRvIHRoZSBlbGVtZW50IGJlZm9yZWhhbmQpIHdpbGwgYmVcbiAqICAgICAgICByZW1vdmVkICh1bnNldCkgZnJvbSB0aGUgZWxlbWVudCdzIHN0eWxpbmcuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gZWxlbWVudEhvc3RTdHlsaW5nTWFwKFxuICAgIGNsYXNzZXM6IHtba2V5OiBzdHJpbmddOiBhbnl9IHwgc3RyaW5nIHwgTk9fQ0hBTkdFIHwgbnVsbCxcbiAgICBzdHlsZXM/OiB7W3N0eWxlTmFtZTogc3RyaW5nXTogYW55fSB8IE5PX0NIQU5HRSB8IG51bGwpOiB2b2lkIHtcbiAgZWxlbWVudFN0eWxpbmdNYXBJbnRlcm5hbChcbiAgICAgIGdldEFjdGl2ZUhvc3RDb250ZXh0KCkgISwgZ2V0QWN0aXZlSG9zdEVsZW1lbnRJbmRleCgpICEsIGNsYXNzZXMsIHN0eWxlcyk7XG59XG5cbmZ1bmN0aW9uIGVsZW1lbnRTdHlsaW5nTWFwSW50ZXJuYWwoXG4gICAgZGlyZWN0aXZlOiB7fSB8IG51bGwsIGluZGV4OiBudW1iZXIsIGNsYXNzZXM6IHtba2V5OiBzdHJpbmddOiBhbnl9IHwgc3RyaW5nIHwgTk9fQ0hBTkdFIHwgbnVsbCxcbiAgICBzdHlsZXM/OiB7W3N0eWxlTmFtZTogc3RyaW5nXTogYW55fSB8IE5PX0NIQU5HRSB8IG51bGwpOiB2b2lkIHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCB0Tm9kZSA9IGdldFROb2RlKGluZGV4LCBsVmlldyk7XG4gIGNvbnN0IHN0eWxpbmdDb250ZXh0ID0gZ2V0U3R5bGluZ0NvbnRleHQoaW5kZXggKyBIRUFERVJfT0ZGU0VULCBsVmlldyk7XG5cbiAgLy8gaW5wdXRzIGFyZSBvbmx5IGV2YWx1YXRlZCBmcm9tIGEgdGVtcGxhdGUgYmluZGluZyBpbnRvIGEgZGlyZWN0aXZlLCB0aGVyZWZvcmUsXG4gIC8vIHRoZXJlIHNob3VsZCBub3QgYmUgYSBzaXR1YXRpb24gd2hlcmUgYSBkaXJlY3RpdmUgaG9zdCBiaW5kaW5ncyBmdW5jdGlvblxuICAvLyBldmFsdWF0ZXMgdGhlIGlucHV0cyAodGhpcyBzaG91bGQgb25seSBoYXBwZW4gaW4gdGhlIHRlbXBsYXRlIGZ1bmN0aW9uKVxuICBpZiAoIWRpcmVjdGl2ZSkge1xuICAgIGlmIChoYXNDbGFzc0lucHV0KHROb2RlKSAmJiBjbGFzc2VzICE9PSBOT19DSEFOR0UpIHtcbiAgICAgIGNvbnN0IGluaXRpYWxDbGFzc2VzID0gZ2V0SW5pdGlhbENsYXNzTmFtZVZhbHVlKHN0eWxpbmdDb250ZXh0KTtcbiAgICAgIGNvbnN0IGNsYXNzSW5wdXRWYWwgPVxuICAgICAgICAgIChpbml0aWFsQ2xhc3Nlcy5sZW5ndGggPyAoaW5pdGlhbENsYXNzZXMgKyAnICcpIDogJycpICsgZm9yY2VDbGFzc2VzQXNTdHJpbmcoY2xhc3Nlcyk7XG4gICAgICBzZXRJbnB1dHNGb3JQcm9wZXJ0eShsVmlldywgdE5vZGUuaW5wdXRzICFbJ2NsYXNzJ10gISwgY2xhc3NJbnB1dFZhbCk7XG4gICAgICBjbGFzc2VzID0gTk9fQ0hBTkdFO1xuICAgIH1cblxuICAgIGlmIChoYXNTdHlsZUlucHV0KHROb2RlKSAmJiBzdHlsZXMgIT09IE5PX0NIQU5HRSkge1xuICAgICAgY29uc3QgaW5pdGlhbFN0eWxlcyA9IGdldEluaXRpYWxDbGFzc05hbWVWYWx1ZShzdHlsaW5nQ29udGV4dCk7XG4gICAgICBjb25zdCBzdHlsZUlucHV0VmFsID1cbiAgICAgICAgICAoaW5pdGlhbFN0eWxlcy5sZW5ndGggPyAoaW5pdGlhbFN0eWxlcyArICcgJykgOiAnJykgKyBmb3JjZVN0eWxlc0FzU3RyaW5nKHN0eWxlcyk7XG4gICAgICBzZXRJbnB1dHNGb3JQcm9wZXJ0eShsVmlldywgdE5vZGUuaW5wdXRzICFbJ3N0eWxlJ10gISwgc3R5bGVJbnB1dFZhbCk7XG4gICAgICBzdHlsZXMgPSBOT19DSEFOR0U7XG4gICAgfVxuICB9XG5cbiAgdXBkYXRlU3R5bGluZ01hcChzdHlsaW5nQ29udGV4dCwgY2xhc3Nlcywgc3R5bGVzLCBkaXJlY3RpdmUpO1xufVxuXG5cbi8qKlxuICogQXBwbHkgYWxsIHN0eWxlIGFuZCBjbGFzcyBiaW5kaW5nIHZhbHVlcyB0byB0aGUgZWxlbWVudC5cbiAqXG4gKiBUaGlzIGluc3RydWN0aW9uIGlzIG1lYW50IHRvIGJlIHJ1biBhZnRlciBgZWxlbWVudFN0eWxpbmdNYXBgLCBgZWxlbWVudFN0eWxlUHJvcGBcbiAqIG9yIGBlbGVtZW50Q2xhc3NQcm9wYCBpbnN0cnVjdGlvbnMgaGF2ZSBiZWVuIHJ1biBhbmQgd2lsbCBvbmx5IGFwcGx5IHN0eWxpbmcgdG9cbiAqIHRoZSBlbGVtZW50IGlmIGFueSBzdHlsaW5nIGJpbmRpbmdzIGhhdmUgYmVlbiB1cGRhdGVkLlxuICpcbiAqIEBwYXJhbSBpbmRleCBJbmRleCBvZiB0aGUgZWxlbWVudCdzIHdpdGggd2hpY2ggc3R5bGluZyBpcyBhc3NvY2lhdGVkLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVsZW1lbnRTdHlsaW5nQXBwbHkoaW5kZXg6IG51bWJlcik6IHZvaWQge1xuICBlbGVtZW50U3R5bGluZ0FwcGx5SW50ZXJuYWwobnVsbCwgaW5kZXgpO1xufVxuXG4vKipcbiAqIEFwcGx5IGFsbCBzdHlsZSBhbmQgY2xhc3MgaG9zdCBiaW5kaW5nIHZhbHVlcyB0byB0aGUgZWxlbWVudC5cbiAqXG4gKiBUaGlzIGluc3RydWN0aW9uIGlzIG1lYW50IHRvIGJlIHJ1biBhZnRlciBgZWxlbWVudEhvc3RTdHlsaW5nTWFwYCxcbiAqIGBlbGVtZW50SG9zdFN0eWxlUHJvcGAgb3IgYGVsZW1lbnRIb3N0Q2xhc3NQcm9wYCBpbnN0cnVjdGlvbnMgaGF2ZVxuICogYmVlbiBydW4gYW5kIHdpbGwgb25seSBhcHBseSBzdHlsaW5nIHRvIHRoZSBob3N0IGVsZW1lbnQgaWYgYW55XG4gKiBzdHlsaW5nIGJpbmRpbmdzIGhhdmUgYmVlbiB1cGRhdGVkLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVsZW1lbnRIb3N0U3R5bGluZ0FwcGx5KCk6IHZvaWQge1xuICBlbGVtZW50U3R5bGluZ0FwcGx5SW50ZXJuYWwoZ2V0QWN0aXZlSG9zdENvbnRleHQoKSAhLCBnZXRBY3RpdmVIb3N0RWxlbWVudEluZGV4KCkgISk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBlbGVtZW50U3R5bGluZ0FwcGx5SW50ZXJuYWwoZGlyZWN0aXZlOiB7fSB8IG51bGwsIGluZGV4OiBudW1iZXIpOiB2b2lkIHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCBpc0ZpcnN0UmVuZGVyID0gKGxWaWV3W0ZMQUdTXSAmIExWaWV3RmxhZ3MuRmlyc3RMVmlld1Bhc3MpICE9PSAwO1xuICBjb25zdCB0b3RhbFBsYXllcnNRdWV1ZWQgPSByZW5kZXJTdHlsaW5nKFxuICAgICAgZ2V0U3R5bGluZ0NvbnRleHQoaW5kZXggKyBIRUFERVJfT0ZGU0VULCBsVmlldyksIGxWaWV3W1JFTkRFUkVSXSwgbFZpZXcsIGlzRmlyc3RSZW5kZXIsIG51bGwsXG4gICAgICBudWxsLCBkaXJlY3RpdmUpO1xuICBpZiAodG90YWxQbGF5ZXJzUXVldWVkID4gMCkge1xuICAgIGNvbnN0IHJvb3RDb250ZXh0ID0gZ2V0Um9vdENvbnRleHQobFZpZXcpO1xuICAgIHNjaGVkdWxlVGljayhyb290Q29udGV4dCwgUm9vdENvbnRleHRGbGFncy5GbHVzaFBsYXllcnMpO1xuICB9XG59Il19