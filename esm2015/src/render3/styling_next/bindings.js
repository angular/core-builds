/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
* @license
* Copyright Google Inc. All Rights Reserved.
*
* Use of this source code is governed by an MIT-style license that can be
* found in the LICENSE file at https://angular.io/license
*/
import { RendererStyleFlags3, isProceduralRenderer } from '../interfaces/renderer';
import { allowStylingFlush, getGuardMask, getProp, getValue, getValuesCount, isContextLocked, lockContext } from './util';
// the values below are global to all styling code below. Each value
// will either increment or mutate each time a styling instruction is
// executed. Do not modify the values below.
/**
 * This file contains the core logic for styling in Angular.
 *
 * All styling bindings (i.e. `[style]`, `[style.prop]`, `[class]` and `[class.name]`)
 * will have their values be applied through the logic in this file.
 *
 * When a binding is encountered (e.g. `<div [style.width]="w">`) then
 * the binding data will be populated into a `TStylingContext` data-structure.
 * There is only one `TStylingContext` per `TNode` and each element instance
 * will update its style/class binding values in concert with the styling
 * context.
 *
 * To learn more about the algorithm see `TStylingContext`.
 * @type {?}
 */
let currentStyleIndex = 0;
/** @type {?} */
let currentClassIndex = 0;
/** @type {?} */
let stylesBitMask = 0;
/** @type {?} */
let classesBitMask = 0;
/** @type {?} */
let deferredBindingQueue = [];
/** @type {?} */
const DEFAULT_BINDING_VALUE = null;
/** @type {?} */
const DEFAULT_SIZE_VALUE = 1;
/** @type {?} */
const DEFAULT_MASK_VALUE = 0;
/** @type {?} */
export const DEFAULT_BINDING_INDEX_VALUE = -1;
/** @type {?} */
export const BIT_MASK_APPLY_ALL = -1;
/**
 * Visits a class-based binding and updates the new value (if changed).
 *
 * This function is called each time a class-based styling instruction
 * is executed. It's important that it's always called (even if the value
 * has not changed) so that the inner counter index value is incremented.
 * This way, each instruction is always guaranteed to get the same counter
 * state each time its called (which then allows the `TStylingContext`
 * and the bit mask values to be in sync).
 * @param {?} context
 * @param {?} data
 * @param {?} prop
 * @param {?} bindingIndex
 * @param {?} value
 * @param {?} deferRegistration
 * @return {?}
 */
export function updateClassBinding(context, data, prop, bindingIndex, value, deferRegistration) {
    /** @type {?} */
    const index = currentClassIndex++;
    if (updateBindingData(context, data, index, prop, bindingIndex, value, deferRegistration)) {
        classesBitMask |= 1 << index;
    }
}
/**
 * Visits a style-based binding and updates the new value (if changed).
 *
 * This function is called each time a style-based styling instruction
 * is executed. It's important that it's always called (even if the value
 * has not changed) so that the inner counter index value is incremented.
 * This way, each instruction is always guaranteed to get the same counter
 * state each time its called (which then allows the `TStylingContext`
 * and the bit mask values to be in sync).
 * @param {?} context
 * @param {?} data
 * @param {?} prop
 * @param {?} bindingIndex
 * @param {?} value
 * @param {?} deferRegistration
 * @return {?}
 */
export function updateStyleBinding(context, data, prop, bindingIndex, value, deferRegistration) {
    /** @type {?} */
    const index = currentStyleIndex++;
    if (updateBindingData(context, data, index, prop, bindingIndex, value, deferRegistration)) {
        stylesBitMask |= 1 << index;
    }
}
/**
 * @param {?} context
 * @param {?} data
 * @param {?} counterIndex
 * @param {?} prop
 * @param {?} bindingIndex
 * @param {?} value
 * @param {?=} deferRegistration
 * @return {?}
 */
function updateBindingData(context, data, counterIndex, prop, bindingIndex, value, deferRegistration) {
    if (!isContextLocked(context)) {
        if (deferRegistration) {
            deferBindingRegistration(context, counterIndex, prop, bindingIndex);
        }
        else {
            deferredBindingQueue.length && flushDeferredBindings();
            // this will only happen during the first update pass of the
            // context. The reason why we can't use `tNode.firstTemplatePass`
            // here is because its not guaranteed to be true when the first
            // update pass is executed (remember that all styling instructions
            // are run in the update phase, and, as a result, are no more
            // styling instructions that are run in the creation phase).
            registerBinding(context, counterIndex, prop, bindingIndex);
        }
    }
    if (data[bindingIndex] !== value) {
        data[bindingIndex] = value;
        return true;
    }
    return false;
}
/**
 * Schedules a binding registration to be run at a later point.
 *
 * The reasoning for this feature is to ensure that styling
 * bindings are registered in the correct order for when
 * directives/components have a super/sub class inheritance
 * chains. Each directive's styling bindings must be
 * registered into the context in reverse order. Therefore all
 * bindings will be buffered in reverse order and then applied
 * after the inheritance chain exits.
 * @param {?} context
 * @param {?} counterIndex
 * @param {?} prop
 * @param {?} bindingIndex
 * @return {?}
 */
function deferBindingRegistration(context, counterIndex, prop, bindingIndex) {
    deferredBindingQueue.splice(0, 0, context, counterIndex, prop, bindingIndex);
}
/**
 * Flushes the collection of deferred bindings and causes each entry
 * to be registered into the context.
 * @return {?}
 */
function flushDeferredBindings() {
    /** @type {?} */
    let i = 0;
    while (i < deferredBindingQueue.length) {
        /** @type {?} */
        const context = (/** @type {?} */ (deferredBindingQueue[i++]));
        /** @type {?} */
        const count = (/** @type {?} */ (deferredBindingQueue[i++]));
        /** @type {?} */
        const prop = (/** @type {?} */ (deferredBindingQueue[i++]));
        /** @type {?} */
        const bindingIndex = (/** @type {?} */ (deferredBindingQueue[i++]));
        registerBinding(context, count, prop, bindingIndex);
    }
    deferredBindingQueue.length = 0;
}
/**
 * Registers the provided binding (prop + bindingIndex) into the context.
 *
 * This function is shared between bindings that are assigned immediately
 * (via `updateBindingData`) and at a deferred stage. When called, it will
 * figure out exactly where to place the binding data in the context.
 *
 * It is needed because it will either update or insert a styling property
 * into the context at the correct spot.
 *
 * When called, one of two things will happen:
 *
 * 1) If the property already exists in the context then it will just add
 *    the provided `bindingValue` to the end of the binding sources region
 *    for that particular property.
 *
 *    - If the binding value is a number then it will be added as a new
 *      binding index source next to the other binding sources for the property.
 *
 *    - Otherwise, if the binding value is a string/boolean/null type then it will
 *      replace the default value for the property if the default value is `null`.
 *
 * 2) If the property does not exist then it will be inserted into the context.
 *    The styling context relies on all properties being stored in alphabetical
 *    order, so it knows exactly where to store it.
 *
 *    When inserted, a default `null` value is created for the property which exists
 *    as the default value for the binding. If the bindingValue property is inserted
 *    and it is either a string, number or null value then that will replace the default
 *    value.
 * @param {?} context
 * @param {?} countId
 * @param {?} prop
 * @param {?} bindingValue
 * @return {?}
 */
export function registerBinding(context, countId, prop, bindingValue) {
    /** @type {?} */
    let i = 2 /* ValuesStartPosition */;
    /** @type {?} */
    let found = false;
    while (i < context.length) {
        /** @type {?} */
        const valuesCount = getValuesCount(context, i);
        /** @type {?} */
        const p = getProp(context, i);
        found = prop <= p;
        if (found) {
            // all style/class bindings are sorted by property name
            if (prop < p) {
                allocateNewContextEntry(context, i, prop);
            }
            addBindingIntoContext(context, i, bindingValue, countId);
            break;
        }
        i += 3 /* BindingsStartOffset */ + valuesCount;
    }
    if (!found) {
        allocateNewContextEntry(context, context.length, prop);
        addBindingIntoContext(context, i, bindingValue, countId);
    }
}
/**
 * @param {?} context
 * @param {?} index
 * @param {?} prop
 * @return {?}
 */
function allocateNewContextEntry(context, index, prop) {
    context.splice(index, 0, DEFAULT_MASK_VALUE, DEFAULT_SIZE_VALUE, prop, DEFAULT_BINDING_VALUE);
}
/**
 * Inserts a new binding value into a styling property tuple in the `TStylingContext`.
 *
 * A bindingValue is inserted into a context during the first update pass
 * of a template or host bindings function. When this occurs, two things
 * happen:
 *
 * - If the bindingValue value is a number then it is treated as a bindingIndex
 *   value (a index in the `LView`) and it will be inserted next to the other
 *   binding index entries.
 *
 * - Otherwise the binding value will update the default value for the property
 *   and this will only happen if the default value is `null`.
 * @param {?} context
 * @param {?} index
 * @param {?} bindingValue
 * @param {?} countId
 * @return {?}
 */
function addBindingIntoContext(context, index, bindingValue, countId) {
    /** @type {?} */
    const valuesCount = getValuesCount(context, index);
    // -1 is used because we want the last value that's in the list (not the next slot)
    /** @type {?} */
    const lastValueIndex = index + 3 /* BindingsStartOffset */ + valuesCount - 1;
    if (typeof bindingValue === 'number') {
        context.splice(lastValueIndex, 0, bindingValue);
        ((/** @type {?} */ (context[index + 1 /* ValuesCountOffset */])))++;
        ((/** @type {?} */ (context[index + 0 /* MaskOffset */]))) |= 1 << countId;
    }
    else if (typeof bindingValue === 'string' && context[lastValueIndex] == null) {
        context[lastValueIndex] = bindingValue;
    }
}
/**
 * Applies all class entries in the provided context to the provided element.
 * @param {?} renderer
 * @param {?} data
 * @param {?} context
 * @param {?} element
 * @param {?} directiveIndex
 * @return {?}
 */
export function applyClasses(renderer, data, context, element, directiveIndex) {
    if (allowStylingFlush(context, directiveIndex)) {
        /** @type {?} */
        const isFirstPass = isContextLocked(context);
        isFirstPass && lockContext(context);
        applyStyling(context, renderer, element, data, classesBitMask, setClass, isFirstPass);
        currentClassIndex = 0;
        classesBitMask = 0;
    }
}
/**
 * Applies all style entries in the provided context to the provided element.
 * @param {?} renderer
 * @param {?} data
 * @param {?} context
 * @param {?} element
 * @param {?} directiveIndex
 * @return {?}
 */
export function applyStyles(renderer, data, context, element, directiveIndex) {
    if (allowStylingFlush(context, directiveIndex)) {
        /** @type {?} */
        const isFirstPass = isContextLocked(context);
        isFirstPass && lockContext(context);
        applyStyling(context, renderer, element, data, stylesBitMask, setStyle, isFirstPass);
        currentStyleIndex = 0;
        stylesBitMask = 0;
    }
}
/**
 * Runs through the provided styling context and applies each value to
 * the provided element (via the renderer) if one or more values are present.
 *
 * Note that this function is not designed to be called in isolation (use
 * `applyClasses` and `applyStyles` to actually apply styling values).
 * @param {?} context
 * @param {?} renderer
 * @param {?} element
 * @param {?} bindingData
 * @param {?} bitMask
 * @param {?} applyStylingFn
 * @param {?=} forceApplyDefaultValues
 * @return {?}
 */
export function applyStyling(context, renderer, element, bindingData, bitMask, applyStylingFn, forceApplyDefaultValues) {
    deferredBindingQueue.length && flushDeferredBindings();
    if (bitMask) {
        /** @type {?} */
        let processAllEntries = bitMask === BIT_MASK_APPLY_ALL;
        /** @type {?} */
        let i = 2 /* ValuesStartPosition */;
        while (i < context.length) {
            /** @type {?} */
            const valuesCount = getValuesCount(context, i);
            /** @type {?} */
            const guardMask = getGuardMask(context, i);
            // the guard mask value is non-zero if and when
            // there are binding values present for the property.
            // If there are ONLY static values (i.e. `style="prop:val")
            // then the guard value will stay as zero.
            /** @type {?} */
            const processEntry = processAllEntries || (guardMask ? (bitMask & guardMask) : forceApplyDefaultValues);
            if (processEntry) {
                /** @type {?} */
                const prop = getProp(context, i);
                /** @type {?} */
                const limit = valuesCount - 1;
                for (let j = 0; j <= limit; j++) {
                    /** @type {?} */
                    const isFinalValue = j === limit;
                    /** @type {?} */
                    const bindingValue = getValue(context, i, j);
                    /** @type {?} */
                    const bindingIndex = isFinalValue ? DEFAULT_BINDING_INDEX_VALUE : ((/** @type {?} */ (bindingValue)));
                    /** @type {?} */
                    const valueToApply = isFinalValue ? bindingValue : bindingData[bindingIndex];
                    if (isValueDefined(valueToApply) || isFinalValue) {
                        applyStylingFn(renderer, element, prop, valueToApply, bindingIndex);
                        break;
                    }
                }
            }
            i += 3 /* BindingsStartOffset */ + valuesCount;
        }
    }
}
/**
 * @param {?} value
 * @return {?}
 */
function isValueDefined(value) {
    // the reason why null is compared against is because
    // a CSS class value that is set to `false` must be
    // respected (otherwise it would be treated as falsy).
    // Empty string values are because developers usually
    // set a value to an empty string to remove it.
    return value != null && value !== '';
}
/**
 * Assigns a style value to a style property for the given element.
 * @type {?}
 */
const setStyle = (/**
 * @param {?} renderer
 * @param {?} native
 * @param {?} prop
 * @param {?} value
 * @return {?}
 */
(renderer, native, prop, value) => {
    if (value) {
        // opacity, z-index and flexbox all have number values
        // and these need to be converted into strings so that
        // they can be assigned properly.
        value = value.toString();
        ngDevMode && ngDevMode.rendererSetStyle++;
        renderer && isProceduralRenderer(renderer) ?
            renderer.setStyle(native, prop, value, RendererStyleFlags3.DashCase) :
            native.style.setProperty(prop, value);
    }
    else {
        ngDevMode && ngDevMode.rendererRemoveStyle++;
        renderer && isProceduralRenderer(renderer) ?
            renderer.removeStyle(native, prop, RendererStyleFlags3.DashCase) :
            native.style.removeProperty(prop);
    }
});
const ɵ0 = setStyle;
/**
 * Adds/removes the provided className value to the provided element.
 * @type {?}
 */
const setClass = (/**
 * @param {?} renderer
 * @param {?} native
 * @param {?} className
 * @param {?} value
 * @return {?}
 */
(renderer, native, className, value) => {
    if (className !== '') {
        if (value) {
            ngDevMode && ngDevMode.rendererAddClass++;
            renderer && isProceduralRenderer(renderer) ? renderer.addClass(native, className) :
                native.classList.add(className);
        }
        else {
            ngDevMode && ngDevMode.rendererRemoveClass++;
            renderer && isProceduralRenderer(renderer) ? renderer.removeClass(native, className) :
                native.classList.remove(className);
        }
    }
});
const ɵ1 = setClass;
export { ɵ0, ɵ1 };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmluZGluZ3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL3N0eWxpbmdfbmV4dC9iaW5kaW5ncy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQU9BLE9BQU8sRUFBMkMsbUJBQW1CLEVBQUUsb0JBQW9CLEVBQUMsTUFBTSx3QkFBd0IsQ0FBQztBQUUzSCxPQUFPLEVBQUMsaUJBQWlCLEVBQUUsWUFBWSxFQUFFLE9BQU8sRUFBRSxRQUFRLEVBQUUsY0FBYyxFQUFFLGVBQWUsRUFBRSxXQUFXLEVBQUMsTUFBTSxRQUFRLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUFxQnBILGlCQUFpQixHQUFHLENBQUM7O0lBQ3JCLGlCQUFpQixHQUFHLENBQUM7O0lBQ3JCLGFBQWEsR0FBRyxDQUFDOztJQUNqQixjQUFjLEdBQUcsQ0FBQzs7SUFDbEIsb0JBQW9CLEdBQWlELEVBQUU7O01BRXJFLHFCQUFxQixHQUFHLElBQUk7O01BQzVCLGtCQUFrQixHQUFHLENBQUM7O01BQ3RCLGtCQUFrQixHQUFHLENBQUM7O0FBQzVCLE1BQU0sT0FBTywyQkFBMkIsR0FBRyxDQUFDLENBQUM7O0FBQzdDLE1BQU0sT0FBTyxrQkFBa0IsR0FBRyxDQUFDLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQWFwQyxNQUFNLFVBQVUsa0JBQWtCLENBQzlCLE9BQXdCLEVBQUUsSUFBd0IsRUFBRSxJQUFZLEVBQUUsWUFBb0IsRUFDdEYsS0FBaUMsRUFBRSxpQkFBMEI7O1VBQ3pELEtBQUssR0FBRyxpQkFBaUIsRUFBRTtJQUNqQyxJQUFJLGlCQUFpQixDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxZQUFZLEVBQUUsS0FBSyxFQUFFLGlCQUFpQixDQUFDLEVBQUU7UUFDekYsY0FBYyxJQUFJLENBQUMsSUFBSSxLQUFLLENBQUM7S0FDOUI7QUFD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LFFBQVEsSUFBSSxvQkFBb0IsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO1lBQ3hDLFFBQVEsQ0FBQyxXQUFXLENBQUMsTUFBTSxFQUFFLElBQUksRUFBRSxtQkFBbUIsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO1lBQ2xFLE1BQU0sQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxDQUFDO0tBQ3ZDO0FBQ0gsQ0FBQyxDQUFBOzs7Ozs7TUFLQyxRQUFROzs7Ozs7O0FBQ1YsQ0FBQyxRQUEwQixFQUFFLE1BQVcsRUFBRSxTQUFpQixFQUFFLEtBQVUsRUFBRSxFQUFFO0lBQ3pFLElBQUksU0FBUyxLQUFLLEVBQUUsRUFBRTtRQUNwQixJQUFJLEtBQUssRUFBRTtZQUNULFNBQVMsSUFBSSxTQUFTLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztZQUMxQyxRQUFRLElBQUksb0JBQW9CLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3RDLE1BQU0sQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1NBQzlFO2FBQU07WUFDTCxTQUFTLElBQUksU0FBUyxDQUFDLG1CQUFtQixFQUFFLENBQUM7WUFDN0MsUUFBUSxJQUFJLG9CQUFvQixDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLE1BQU0sRUFBRSxTQUFTLENBQUMsQ0FBQyxDQUFDO2dCQUN6QyxNQUFNLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQztTQUNqRjtLQUNGO0FBQ0gsQ0FBQyxDQUFBIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4qIEBsaWNlbnNlXG4qIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuKlxuKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4qL1xuaW1wb3J0IHtQcm9jZWR1cmFsUmVuZGVyZXIzLCBSRWxlbWVudCwgUmVuZGVyZXIzLCBSZW5kZXJlclN0eWxlRmxhZ3MzLCBpc1Byb2NlZHVyYWxSZW5kZXJlcn0gZnJvbSAnLi4vaW50ZXJmYWNlcy9yZW5kZXJlcic7XG5pbXBvcnQge0FwcGx5U3R5bGluZ0ZuLCBTdHlsaW5nQmluZGluZ0RhdGEsIFRTdHlsaW5nQ29udGV4dCwgVFN0eWxpbmdDb250ZXh0SW5kZXh9IGZyb20gJy4vaW50ZXJmYWNlcyc7XG5pbXBvcnQge2FsbG93U3R5bGluZ0ZsdXNoLCBnZXRHdWFyZE1hc2ssIGdldFByb3AsIGdldFZhbHVlLCBnZXRWYWx1ZXNDb3VudCwgaXNDb250ZXh0TG9ja2VkLCBsb2NrQ29udGV4dH0gZnJvbSAnLi91dGlsJztcblxuXG4vKipcbiAqIFRoaXMgZmlsZSBjb250YWlucyB0aGUgY29yZSBsb2dpYyBmb3Igc3R5bGluZyBpbiBBbmd1bGFyLlxuICpcbiAqIEFsbCBzdHlsaW5nIGJpbmRpbmdzIChpLmUuIGBbc3R5bGVdYCwgYFtzdHlsZS5wcm9wXWAsIGBbY2xhc3NdYCBhbmQgYFtjbGFzcy5uYW1lXWApXG4gKiB3aWxsIGhhdmUgdGhlaXIgdmFsdWVzIGJlIGFwcGxpZWQgdGhyb3VnaCB0aGUgbG9naWMgaW4gdGhpcyBmaWxlLlxuICpcbiAqIFdoZW4gYSBiaW5kaW5nIGlzIGVuY291bnRlcmVkIChlLmcuIGA8ZGl2IFtzdHlsZS53aWR0aF09XCJ3XCI+YCkgdGhlblxuICogdGhlIGJpbmRpbmcgZGF0YSB3aWxsIGJlIHBvcHVsYXRlZCBpbnRvIGEgYFRTdHlsaW5nQ29udGV4dGAgZGF0YS1zdHJ1Y3R1cmUuXG4gKiBUaGVyZSBpcyBvbmx5IG9uZSBgVFN0eWxpbmdDb250ZXh0YCBwZXIgYFROb2RlYCBhbmQgZWFjaCBlbGVtZW50IGluc3RhbmNlXG4gKiB3aWxsIHVwZGF0ZSBpdHMgc3R5bGUvY2xhc3MgYmluZGluZyB2YWx1ZXMgaW4gY29uY2VydCB3aXRoIHRoZSBzdHlsaW5nXG4gKiBjb250ZXh0LlxuICpcbiAqIFRvIGxlYXJuIG1vcmUgYWJvdXQgdGhlIGFsZ29yaXRobSBzZWUgYFRTdHlsaW5nQ29udGV4dGAuXG4gKi9cblxuLy8gdGhlIHZhbHVlcyBiZWxvdyBhcmUgZ2xvYmFsIHRvIGFsbCBzdHlsaW5nIGNvZGUgYmVsb3cuIEVhY2ggdmFsdWVcbi8vIHdpbGwgZWl0aGVyIGluY3JlbWVudCBvciBtdXRhdGUgZWFjaCB0aW1lIGEgc3R5bGluZyBpbnN0cnVjdGlvbiBpc1xuLy8gZXhlY3V0ZWQuIERvIG5vdCBtb2RpZnkgdGhlIHZhbHVlcyBiZWxvdy5cbmxldCBjdXJyZW50U3R5bGVJbmRleCA9IDA7XG5sZXQgY3VycmVudENsYXNzSW5kZXggPSAwO1xubGV0IHN0eWxlc0JpdE1hc2sgPSAwO1xubGV0IGNsYXNzZXNCaXRNYXNrID0gMDtcbmxldCBkZWZlcnJlZEJpbmRpbmdRdWV1ZTogKFRTdHlsaW5nQ29udGV4dCB8IG51bWJlciB8IHN0cmluZyB8IG51bGwpW10gPSBbXTtcblxuY29uc3QgREVGQVVMVF9CSU5ESU5HX1ZBTFVFID0gbnVsbDtcbmNvbnN0IERFRkFVTFRfU0laRV9WQUxVRSA9IDE7XG5jb25zdCBERUZBVUxUX01BU0tfVkFMVUUgPSAwO1xuZXhwb3J0IGNvbnN0IERFRkFVTFRfQklORElOR19JTkRFWF9WQUxVRSA9IC0xO1xuZXhwb3J0IGNvbnN0IEJJVF9NQVNLX0FQUExZX0FMTCA9IC0xO1xuXG5cbi8qKlxuICogVmlzaXRzIGEgY2xhc3MtYmFzZWQgYmluZGluZyBhbmQgdXBkYXRlcyB0aGUgbmV3IHZhbHVlIChpZiBjaGFuZ2VkKS5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIGlzIGNhbGxlZCBlYWNoIHRpbWUgYSBjbGFzcy1iYXNlZCBzdHlsaW5nIGluc3RydWN0aW9uXG4gKiBpcyBleGVjdXRlZC4gSXQncyBpbXBvcnRhbnQgdGhhdCBpdCdzIGFsd2F5cyBjYWxsZWQgKGV2ZW4gaWYgdGhlIHZhbHVlXG4gKiBoYXMgbm90IGNoYW5nZWQpIHNvIHRoYXQgdGhlIGlubmVyIGNvdW50ZXIgaW5kZXggdmFsdWUgaXMgaW5jcmVtZW50ZWQuXG4gKiBUaGlzIHdheSwgZWFjaCBpbnN0cnVjdGlvbiBpcyBhbHdheXMgZ3VhcmFudGVlZCB0byBnZXQgdGhlIHNhbWUgY291bnRlclxuICogc3RhdGUgZWFjaCB0aW1lIGl0cyBjYWxsZWQgKHdoaWNoIHRoZW4gYWxsb3dzIHRoZSBgVFN0eWxpbmdDb250ZXh0YFxuICogYW5kIHRoZSBiaXQgbWFzayB2YWx1ZXMgdG8gYmUgaW4gc3luYykuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB1cGRhdGVDbGFzc0JpbmRpbmcoXG4gICAgY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCBkYXRhOiBTdHlsaW5nQmluZGluZ0RhdGEsIHByb3A6IHN0cmluZywgYmluZGluZ0luZGV4OiBudW1iZXIsXG4gICAgdmFsdWU6IGJvb2xlYW4gfCBudWxsIHwgdW5kZWZpbmVkLCBkZWZlclJlZ2lzdHJhdGlvbjogYm9vbGVhbik6IHZvaWQge1xuICBjb25zdCBpbmRleCA9IGN1cnJlbnRDbGFzc0luZGV4Kys7XG4gIGlmICh1cGRhdGVCaW5kaW5nRGF0YShjb250ZXh0LCBkYXRhLCBpbmRleCwgcHJvcCwgYmluZGluZ0luZGV4LCB2YWx1ZSwgZGVmZXJSZWdpc3RyYXRpb24pKSB7XG4gICAgY2xhc3Nlc0JpdE1hc2sgfD0gMSA8PCBpbmRleDtcbiAgfVxufVxuXG4vKipcbiAqIFZpc2l0cyBhIHN0eWxlLWJhc2VkIGJpbmRpbmcgYW5kIHVwZGF0ZXMgdGhlIG5ldyB2YWx1ZSAoaWYgY2hhbmdlZCkuXG4gKlxuICogVGhpcyBmdW5jdGlvbiBpcyBjYWxsZWQgZWFjaCB0aW1lIGEgc3R5bGUtYmFzZWQgc3R5bGluZyBpbnN0cnVjdGlvblxuICogaXMgZXhlY3V0ZWQuIEl0J3MgaW1wb3J0YW50IHRoYXQgaXQncyBhbHdheXMgY2FsbGVkIChldmVuIGlmIHRoZSB2YWx1ZVxuICogaGFzIG5vdCBjaGFuZ2VkKSBzbyB0aGF0IHRoZSBpbm5lciBjb3VudGVyIGluZGV4IHZhbHVlIGlzIGluY3JlbWVudGVkLlxuICogVGhpcyB3YXksIGVhY2ggaW5zdHJ1Y3Rpb24gaXMgYWx3YXlzIGd1YXJhbnRlZWQgdG8gZ2V0IHRoZSBzYW1lIGNvdW50ZXJcbiAqIHN0YXRlIGVhY2ggdGltZSBpdHMgY2FsbGVkICh3aGljaCB0aGVuIGFsbG93cyB0aGUgYFRTdHlsaW5nQ29udGV4dGBcbiAqIGFuZCB0aGUgYml0IG1hc2sgdmFsdWVzIHRvIGJlIGluIHN5bmMpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gdXBkYXRlU3R5bGVCaW5kaW5nKFxuICAgIGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgZGF0YTogU3R5bGluZ0JpbmRpbmdEYXRhLCBwcm9wOiBzdHJpbmcsIGJpbmRpbmdJbmRleDogbnVtYmVyLFxuICAgIHZhbHVlOiBTdHJpbmcgfCBzdHJpbmcgfCBudW1iZXIgfCBudWxsIHwgdW5kZWZpbmVkLCBkZWZlclJlZ2lzdHJhdGlvbjogYm9vbGVhbik6IHZvaWQge1xuICBjb25zdCBpbmRleCA9IGN1cnJlbnRTdHlsZUluZGV4Kys7XG4gIGlmICh1cGRhdGVCaW5kaW5nRGF0YShjb250ZXh0LCBkYXRhLCBpbmRleCwgcHJvcCwgYmluZGluZ0luZGV4LCB2YWx1ZSwgZGVmZXJSZWdpc3RyYXRpb24pKSB7XG4gICAgc3R5bGVzQml0TWFzayB8PSAxIDw8IGluZGV4O1xuICB9XG59XG5cbmZ1bmN0aW9uIHVwZGF0ZUJpbmRpbmdEYXRhKFxuICAgIGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgZGF0YTogU3R5bGluZ0JpbmRpbmdEYXRhLCBjb3VudGVySW5kZXg6IG51bWJlciwgcHJvcDogc3RyaW5nLFxuICAgIGJpbmRpbmdJbmRleDogbnVtYmVyLCB2YWx1ZTogc3RyaW5nIHwgU3RyaW5nIHwgbnVtYmVyIHwgYm9vbGVhbiB8IG51bGwgfCB1bmRlZmluZWQsXG4gICAgZGVmZXJSZWdpc3RyYXRpb24/OiBib29sZWFuKTogYm9vbGVhbiB7XG4gIGlmICghaXNDb250ZXh0TG9ja2VkKGNvbnRleHQpKSB7XG4gICAgaWYgKGRlZmVyUmVnaXN0cmF0aW9uKSB7XG4gICAgICBkZWZlckJpbmRpbmdSZWdpc3RyYXRpb24oY29udGV4dCwgY291bnRlckluZGV4LCBwcm9wLCBiaW5kaW5nSW5kZXgpO1xuICAgIH0gZWxzZSB7XG4gICAgICBkZWZlcnJlZEJpbmRpbmdRdWV1ZS5sZW5ndGggJiYgZmx1c2hEZWZlcnJlZEJpbmRpbmdzKCk7XG5cbiAgICAgIC8vIHRoaXMgd2lsbCBvbmx5IGhhcHBlbiBkdXJpbmcgdGhlIGZpcnN0IHVwZGF0ZSBwYXNzIG9mIHRoZVxuICAgICAgLy8gY29udGV4dC4gVGhlIHJlYXNvbiB3aHkgd2UgY2FuJ3QgdXNlIGB0Tm9kZS5maXJzdFRlbXBsYXRlUGFzc2BcbiAgICAgIC8vIGhlcmUgaXMgYmVjYXVzZSBpdHMgbm90IGd1YXJhbnRlZWQgdG8gYmUgdHJ1ZSB3aGVuIHRoZSBmaXJzdFxuICAgICAgLy8gdXBkYXRlIHBhc3MgaXMgZXhlY3V0ZWQgKHJlbWVtYmVyIHRoYXQgYWxsIHN0eWxpbmcgaW5zdHJ1Y3Rpb25zXG4gICAgICAvLyBhcmUgcnVuIGluIHRoZSB1cGRhdGUgcGhhc2UsIGFuZCwgYXMgYSByZXN1bHQsIGFyZSBubyBtb3JlXG4gICAgICAvLyBzdHlsaW5nIGluc3RydWN0aW9ucyB0aGF0IGFyZSBydW4gaW4gdGhlIGNyZWF0aW9uIHBoYXNlKS5cbiAgICAgIHJlZ2lzdGVyQmluZGluZyhjb250ZXh0LCBjb3VudGVySW5kZXgsIHByb3AsIGJpbmRpbmdJbmRleCk7XG4gICAgfVxuICB9XG5cbiAgaWYgKGRhdGFbYmluZGluZ0luZGV4XSAhPT0gdmFsdWUpIHtcbiAgICBkYXRhW2JpbmRpbmdJbmRleF0gPSB2YWx1ZTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICByZXR1cm4gZmFsc2U7XG59XG5cbi8qKlxuICogU2NoZWR1bGVzIGEgYmluZGluZyByZWdpc3RyYXRpb24gdG8gYmUgcnVuIGF0IGEgbGF0ZXIgcG9pbnQuXG4gKlxuICogVGhlIHJlYXNvbmluZyBmb3IgdGhpcyBmZWF0dXJlIGlzIHRvIGVuc3VyZSB0aGF0IHN0eWxpbmdcbiAqIGJpbmRpbmdzIGFyZSByZWdpc3RlcmVkIGluIHRoZSBjb3JyZWN0IG9yZGVyIGZvciB3aGVuXG4gKiBkaXJlY3RpdmVzL2NvbXBvbmVudHMgaGF2ZSBhIHN1cGVyL3N1YiBjbGFzcyBpbmhlcml0YW5jZVxuICogY2hhaW5zLiBFYWNoIGRpcmVjdGl2ZSdzIHN0eWxpbmcgYmluZGluZ3MgbXVzdCBiZVxuICogcmVnaXN0ZXJlZCBpbnRvIHRoZSBjb250ZXh0IGluIHJldmVyc2Ugb3JkZXIuIFRoZXJlZm9yZSBhbGxcbiAqIGJpbmRpbmdzIHdpbGwgYmUgYnVmZmVyZWQgaW4gcmV2ZXJzZSBvcmRlciBhbmQgdGhlbiBhcHBsaWVkXG4gKiBhZnRlciB0aGUgaW5oZXJpdGFuY2UgY2hhaW4gZXhpdHMuXG4gKi9cbmZ1bmN0aW9uIGRlZmVyQmluZGluZ1JlZ2lzdHJhdGlvbihcbiAgICBjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIGNvdW50ZXJJbmRleDogbnVtYmVyLCBwcm9wOiBzdHJpbmcsIGJpbmRpbmdJbmRleDogbnVtYmVyKSB7XG4gIGRlZmVycmVkQmluZGluZ1F1ZXVlLnNwbGljZSgwLCAwLCBjb250ZXh0LCBjb3VudGVySW5kZXgsIHByb3AsIGJpbmRpbmdJbmRleCk7XG59XG5cbi8qKlxuICogRmx1c2hlcyB0aGUgY29sbGVjdGlvbiBvZiBkZWZlcnJlZCBiaW5kaW5ncyBhbmQgY2F1c2VzIGVhY2ggZW50cnlcbiAqIHRvIGJlIHJlZ2lzdGVyZWQgaW50byB0aGUgY29udGV4dC5cbiAqL1xuZnVuY3Rpb24gZmx1c2hEZWZlcnJlZEJpbmRpbmdzKCkge1xuICBsZXQgaSA9IDA7XG4gIHdoaWxlIChpIDwgZGVmZXJyZWRCaW5kaW5nUXVldWUubGVuZ3RoKSB7XG4gICAgY29uc3QgY29udGV4dCA9IGRlZmVycmVkQmluZGluZ1F1ZXVlW2krK10gYXMgVFN0eWxpbmdDb250ZXh0O1xuICAgIGNvbnN0IGNvdW50ID0gZGVmZXJyZWRCaW5kaW5nUXVldWVbaSsrXSBhcyBudW1iZXI7XG4gICAgY29uc3QgcHJvcCA9IGRlZmVycmVkQmluZGluZ1F1ZXVlW2krK10gYXMgc3RyaW5nO1xuICAgIGNvbnN0IGJpbmRpbmdJbmRleCA9IGRlZmVycmVkQmluZGluZ1F1ZXVlW2krK10gYXMgbnVtYmVyIHwgbnVsbDtcbiAgICByZWdpc3RlckJpbmRpbmcoY29udGV4dCwgY291bnQsIHByb3AsIGJpbmRpbmdJbmRleCk7XG4gIH1cbiAgZGVmZXJyZWRCaW5kaW5nUXVldWUubGVuZ3RoID0gMDtcbn1cblxuLyoqXG4gKiBSZWdpc3RlcnMgdGhlIHByb3ZpZGVkIGJpbmRpbmcgKHByb3AgKyBiaW5kaW5nSW5kZXgpIGludG8gdGhlIGNvbnRleHQuXG4gKlxuICogVGhpcyBmdW5jdGlvbiBpcyBzaGFyZWQgYmV0d2VlbiBiaW5kaW5ncyB0aGF0IGFyZSBhc3NpZ25lZCBpbW1lZGlhdGVseVxuICogKHZpYSBgdXBkYXRlQmluZGluZ0RhdGFgKSBhbmQgYXQgYSBkZWZlcnJlZCBzdGFnZS4gV2hlbiBjYWxsZWQsIGl0IHdpbGxcbiAqIGZpZ3VyZSBvdXQgZXhhY3RseSB3aGVyZSB0byBwbGFjZSB0aGUgYmluZGluZyBkYXRhIGluIHRoZSBjb250ZXh0LlxuICpcbiAqIEl0IGlzIG5lZWRlZCBiZWNhdXNlIGl0IHdpbGwgZWl0aGVyIHVwZGF0ZSBvciBpbnNlcnQgYSBzdHlsaW5nIHByb3BlcnR5XG4gKiBpbnRvIHRoZSBjb250ZXh0IGF0IHRoZSBjb3JyZWN0IHNwb3QuXG4gKlxuICogV2hlbiBjYWxsZWQsIG9uZSBvZiB0d28gdGhpbmdzIHdpbGwgaGFwcGVuOlxuICpcbiAqIDEpIElmIHRoZSBwcm9wZXJ0eSBhbHJlYWR5IGV4aXN0cyBpbiB0aGUgY29udGV4dCB0aGVuIGl0IHdpbGwganVzdCBhZGRcbiAqICAgIHRoZSBwcm92aWRlZCBgYmluZGluZ1ZhbHVlYCB0byB0aGUgZW5kIG9mIHRoZSBiaW5kaW5nIHNvdXJjZXMgcmVnaW9uXG4gKiAgICBmb3IgdGhhdCBwYXJ0aWN1bGFyIHByb3BlcnR5LlxuICpcbiAqICAgIC0gSWYgdGhlIGJpbmRpbmcgdmFsdWUgaXMgYSBudW1iZXIgdGhlbiBpdCB3aWxsIGJlIGFkZGVkIGFzIGEgbmV3XG4gKiAgICAgIGJpbmRpbmcgaW5kZXggc291cmNlIG5leHQgdG8gdGhlIG90aGVyIGJpbmRpbmcgc291cmNlcyBmb3IgdGhlIHByb3BlcnR5LlxuICpcbiAqICAgIC0gT3RoZXJ3aXNlLCBpZiB0aGUgYmluZGluZyB2YWx1ZSBpcyBhIHN0cmluZy9ib29sZWFuL251bGwgdHlwZSB0aGVuIGl0IHdpbGxcbiAqICAgICAgcmVwbGFjZSB0aGUgZGVmYXVsdCB2YWx1ZSBmb3IgdGhlIHByb3BlcnR5IGlmIHRoZSBkZWZhdWx0IHZhbHVlIGlzIGBudWxsYC5cbiAqXG4gKiAyKSBJZiB0aGUgcHJvcGVydHkgZG9lcyBub3QgZXhpc3QgdGhlbiBpdCB3aWxsIGJlIGluc2VydGVkIGludG8gdGhlIGNvbnRleHQuXG4gKiAgICBUaGUgc3R5bGluZyBjb250ZXh0IHJlbGllcyBvbiBhbGwgcHJvcGVydGllcyBiZWluZyBzdG9yZWQgaW4gYWxwaGFiZXRpY2FsXG4gKiAgICBvcmRlciwgc28gaXQga25vd3MgZXhhY3RseSB3aGVyZSB0byBzdG9yZSBpdC5cbiAqXG4gKiAgICBXaGVuIGluc2VydGVkLCBhIGRlZmF1bHQgYG51bGxgIHZhbHVlIGlzIGNyZWF0ZWQgZm9yIHRoZSBwcm9wZXJ0eSB3aGljaCBleGlzdHNcbiAqICAgIGFzIHRoZSBkZWZhdWx0IHZhbHVlIGZvciB0aGUgYmluZGluZy4gSWYgdGhlIGJpbmRpbmdWYWx1ZSBwcm9wZXJ0eSBpcyBpbnNlcnRlZFxuICogICAgYW5kIGl0IGlzIGVpdGhlciBhIHN0cmluZywgbnVtYmVyIG9yIG51bGwgdmFsdWUgdGhlbiB0aGF0IHdpbGwgcmVwbGFjZSB0aGUgZGVmYXVsdFxuICogICAgdmFsdWUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZWdpc3RlckJpbmRpbmcoXG4gICAgY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCBjb3VudElkOiBudW1iZXIsIHByb3A6IHN0cmluZyxcbiAgICBiaW5kaW5nVmFsdWU6IG51bWJlciB8IG51bGwgfCBzdHJpbmcgfCBib29sZWFuKSB7XG4gIGxldCBpID0gVFN0eWxpbmdDb250ZXh0SW5kZXguVmFsdWVzU3RhcnRQb3NpdGlvbjtcbiAgbGV0IGZvdW5kID0gZmFsc2U7XG4gIHdoaWxlIChpIDwgY29udGV4dC5sZW5ndGgpIHtcbiAgICBjb25zdCB2YWx1ZXNDb3VudCA9IGdldFZhbHVlc0NvdW50KGNvbnRleHQsIGkpO1xuICAgIGNvbnN0IHAgPSBnZXRQcm9wKGNvbnRleHQsIGkpO1xuICAgIGZvdW5kID0gcHJvcCA8PSBwO1xuICAgIGlmIChmb3VuZCkge1xuICAgICAgLy8gYWxsIHN0eWxlL2NsYXNzIGJpbmRpbmdzIGFyZSBzb3J0ZWQgYnkgcHJvcGVydHkgbmFtZVxuICAgICAgaWYgKHByb3AgPCBwKSB7XG4gICAgICAgIGFsbG9jYXRlTmV3Q29udGV4dEVudHJ5KGNvbnRleHQsIGksIHByb3ApO1xuICAgICAgfVxuICAgICAgYWRkQmluZGluZ0ludG9Db250ZXh0KGNvbnRleHQsIGksIGJpbmRpbmdWYWx1ZSwgY291bnRJZCk7XG4gICAgICBicmVhaztcbiAgICB9XG4gICAgaSArPSBUU3R5bGluZ0NvbnRleHRJbmRleC5CaW5kaW5nc1N0YXJ0T2Zmc2V0ICsgdmFsdWVzQ291bnQ7XG4gIH1cblxuICBpZiAoIWZvdW5kKSB7XG4gICAgYWxsb2NhdGVOZXdDb250ZXh0RW50cnkoY29udGV4dCwgY29udGV4dC5sZW5ndGgsIHByb3ApO1xuICAgIGFkZEJpbmRpbmdJbnRvQ29udGV4dChjb250ZXh0LCBpLCBiaW5kaW5nVmFsdWUsIGNvdW50SWQpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGFsbG9jYXRlTmV3Q29udGV4dEVudHJ5KGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgaW5kZXg6IG51bWJlciwgcHJvcDogc3RyaW5nKSB7XG4gIGNvbnRleHQuc3BsaWNlKGluZGV4LCAwLCBERUZBVUxUX01BU0tfVkFMVUUsIERFRkFVTFRfU0laRV9WQUxVRSwgcHJvcCwgREVGQVVMVF9CSU5ESU5HX1ZBTFVFKTtcbn1cblxuLyoqXG4gKiBJbnNlcnRzIGEgbmV3IGJpbmRpbmcgdmFsdWUgaW50byBhIHN0eWxpbmcgcHJvcGVydHkgdHVwbGUgaW4gdGhlIGBUU3R5bGluZ0NvbnRleHRgLlxuICpcbiAqIEEgYmluZGluZ1ZhbHVlIGlzIGluc2VydGVkIGludG8gYSBjb250ZXh0IGR1cmluZyB0aGUgZmlyc3QgdXBkYXRlIHBhc3NcbiAqIG9mIGEgdGVtcGxhdGUgb3IgaG9zdCBiaW5kaW5ncyBmdW5jdGlvbi4gV2hlbiB0aGlzIG9jY3VycywgdHdvIHRoaW5nc1xuICogaGFwcGVuOlxuICpcbiAqIC0gSWYgdGhlIGJpbmRpbmdWYWx1ZSB2YWx1ZSBpcyBhIG51bWJlciB0aGVuIGl0IGlzIHRyZWF0ZWQgYXMgYSBiaW5kaW5nSW5kZXhcbiAqICAgdmFsdWUgKGEgaW5kZXggaW4gdGhlIGBMVmlld2ApIGFuZCBpdCB3aWxsIGJlIGluc2VydGVkIG5leHQgdG8gdGhlIG90aGVyXG4gKiAgIGJpbmRpbmcgaW5kZXggZW50cmllcy5cbiAqXG4gKiAtIE90aGVyd2lzZSB0aGUgYmluZGluZyB2YWx1ZSB3aWxsIHVwZGF0ZSB0aGUgZGVmYXVsdCB2YWx1ZSBmb3IgdGhlIHByb3BlcnR5XG4gKiAgIGFuZCB0aGlzIHdpbGwgb25seSBoYXBwZW4gaWYgdGhlIGRlZmF1bHQgdmFsdWUgaXMgYG51bGxgLlxuICovXG5mdW5jdGlvbiBhZGRCaW5kaW5nSW50b0NvbnRleHQoXG4gICAgY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCBpbmRleDogbnVtYmVyLCBiaW5kaW5nVmFsdWU6IG51bWJlciB8IHN0cmluZyB8IGJvb2xlYW4gfCBudWxsLFxuICAgIGNvdW50SWQ6IG51bWJlcikge1xuICBjb25zdCB2YWx1ZXNDb3VudCA9IGdldFZhbHVlc0NvdW50KGNvbnRleHQsIGluZGV4KTtcblxuICAvLyAtMSBpcyB1c2VkIGJlY2F1c2Ugd2Ugd2FudCB0aGUgbGFzdCB2YWx1ZSB0aGF0J3MgaW4gdGhlIGxpc3QgKG5vdCB0aGUgbmV4dCBzbG90KVxuICBjb25zdCBsYXN0VmFsdWVJbmRleCA9IGluZGV4ICsgVFN0eWxpbmdDb250ZXh0SW5kZXguQmluZGluZ3NTdGFydE9mZnNldCArIHZhbHVlc0NvdW50IC0gMTtcblxuICBpZiAodHlwZW9mIGJpbmRpbmdWYWx1ZSA9PT0gJ251bWJlcicpIHtcbiAgICBjb250ZXh0LnNwbGljZShsYXN0VmFsdWVJbmRleCwgMCwgYmluZGluZ1ZhbHVlKTtcbiAgICAoY29udGV4dFtpbmRleCArIFRTdHlsaW5nQ29udGV4dEluZGV4LlZhbHVlc0NvdW50T2Zmc2V0XSBhcyBudW1iZXIpKys7XG4gICAgKGNvbnRleHRbaW5kZXggKyBUU3R5bGluZ0NvbnRleHRJbmRleC5NYXNrT2Zmc2V0XSBhcyBudW1iZXIpIHw9IDEgPDwgY291bnRJZDtcbiAgfSBlbHNlIGlmICh0eXBlb2YgYmluZGluZ1ZhbHVlID09PSAnc3RyaW5nJyAmJiBjb250ZXh0W2xhc3RWYWx1ZUluZGV4XSA9PSBudWxsKSB7XG4gICAgY29udGV4dFtsYXN0VmFsdWVJbmRleF0gPSBiaW5kaW5nVmFsdWU7XG4gIH1cbn1cblxuLyoqXG4gKiBBcHBsaWVzIGFsbCBjbGFzcyBlbnRyaWVzIGluIHRoZSBwcm92aWRlZCBjb250ZXh0IHRvIHRoZSBwcm92aWRlZCBlbGVtZW50LlxuICovXG5leHBvcnQgZnVuY3Rpb24gYXBwbHlDbGFzc2VzKFxuICAgIHJlbmRlcmVyOiBSZW5kZXJlcjMgfCBQcm9jZWR1cmFsUmVuZGVyZXIzIHwgbnVsbCwgZGF0YTogU3R5bGluZ0JpbmRpbmdEYXRhLFxuICAgIGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgZWxlbWVudDogUkVsZW1lbnQsIGRpcmVjdGl2ZUluZGV4OiBudW1iZXIpIHtcbiAgaWYgKGFsbG93U3R5bGluZ0ZsdXNoKGNvbnRleHQsIGRpcmVjdGl2ZUluZGV4KSkge1xuICAgIGNvbnN0IGlzRmlyc3RQYXNzID0gaXNDb250ZXh0TG9ja2VkKGNvbnRleHQpO1xuICAgIGlzRmlyc3RQYXNzICYmIGxvY2tDb250ZXh0KGNvbnRleHQpO1xuICAgIGFwcGx5U3R5bGluZyhjb250ZXh0LCByZW5kZXJlciwgZWxlbWVudCwgZGF0YSwgY2xhc3Nlc0JpdE1hc2ssIHNldENsYXNzLCBpc0ZpcnN0UGFzcyk7XG4gICAgY3VycmVudENsYXNzSW5kZXggPSAwO1xuICAgIGNsYXNzZXNCaXRNYXNrID0gMDtcbiAgfVxufVxuXG4vKipcbiAqIEFwcGxpZXMgYWxsIHN0eWxlIGVudHJpZXMgaW4gdGhlIHByb3ZpZGVkIGNvbnRleHQgdG8gdGhlIHByb3ZpZGVkIGVsZW1lbnQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhcHBseVN0eWxlcyhcbiAgICByZW5kZXJlcjogUmVuZGVyZXIzIHwgUHJvY2VkdXJhbFJlbmRlcmVyMyB8IG51bGwsIGRhdGE6IFN0eWxpbmdCaW5kaW5nRGF0YSxcbiAgICBjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIGVsZW1lbnQ6IFJFbGVtZW50LCBkaXJlY3RpdmVJbmRleDogbnVtYmVyKSB7XG4gIGlmIChhbGxvd1N0eWxpbmdGbHVzaChjb250ZXh0LCBkaXJlY3RpdmVJbmRleCkpIHtcbiAgICBjb25zdCBpc0ZpcnN0UGFzcyA9IGlzQ29udGV4dExvY2tlZChjb250ZXh0KTtcbiAgICBpc0ZpcnN0UGFzcyAmJiBsb2NrQ29udGV4dChjb250ZXh0KTtcbiAgICBhcHBseVN0eWxpbmcoY29udGV4dCwgcmVuZGVyZXIsIGVsZW1lbnQsIGRhdGEsIHN0eWxlc0JpdE1hc2ssIHNldFN0eWxlLCBpc0ZpcnN0UGFzcyk7XG4gICAgY3VycmVudFN0eWxlSW5kZXggPSAwO1xuICAgIHN0eWxlc0JpdE1hc2sgPSAwO1xuICB9XG59XG5cbi8qKlxuICogUnVucyB0aHJvdWdoIHRoZSBwcm92aWRlZCBzdHlsaW5nIGNvbnRleHQgYW5kIGFwcGxpZXMgZWFjaCB2YWx1ZSB0b1xuICogdGhlIHByb3ZpZGVkIGVsZW1lbnQgKHZpYSB0aGUgcmVuZGVyZXIpIGlmIG9uZSBvciBtb3JlIHZhbHVlcyBhcmUgcHJlc2VudC5cbiAqXG4gKiBOb3RlIHRoYXQgdGhpcyBmdW5jdGlvbiBpcyBub3QgZGVzaWduZWQgdG8gYmUgY2FsbGVkIGluIGlzb2xhdGlvbiAodXNlXG4gKiBgYXBwbHlDbGFzc2VzYCBhbmQgYGFwcGx5U3R5bGVzYCB0byBhY3R1YWxseSBhcHBseSBzdHlsaW5nIHZhbHVlcykuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhcHBseVN0eWxpbmcoXG4gICAgY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCByZW5kZXJlcjogUmVuZGVyZXIzIHwgUHJvY2VkdXJhbFJlbmRlcmVyMyB8IG51bGwsIGVsZW1lbnQ6IFJFbGVtZW50LFxuICAgIGJpbmRpbmdEYXRhOiBTdHlsaW5nQmluZGluZ0RhdGEsIGJpdE1hc2s6IG51bWJlciwgYXBwbHlTdHlsaW5nRm46IEFwcGx5U3R5bGluZ0ZuLFxuICAgIGZvcmNlQXBwbHlEZWZhdWx0VmFsdWVzPzogYm9vbGVhbikge1xuICBkZWZlcnJlZEJpbmRpbmdRdWV1ZS5sZW5ndGggJiYgZmx1c2hEZWZlcnJlZEJpbmRpbmdzKCk7XG5cbiAgaWYgKGJpdE1hc2spIHtcbiAgICBsZXQgcHJvY2Vzc0FsbEVudHJpZXMgPSBiaXRNYXNrID09PSBCSVRfTUFTS19BUFBMWV9BTEw7XG4gICAgbGV0IGkgPSBUU3R5bGluZ0NvbnRleHRJbmRleC5WYWx1ZXNTdGFydFBvc2l0aW9uO1xuICAgIHdoaWxlIChpIDwgY29udGV4dC5sZW5ndGgpIHtcbiAgICAgIGNvbnN0IHZhbHVlc0NvdW50ID0gZ2V0VmFsdWVzQ291bnQoY29udGV4dCwgaSk7XG4gICAgICBjb25zdCBndWFyZE1hc2sgPSBnZXRHdWFyZE1hc2soY29udGV4dCwgaSk7XG5cbiAgICAgIC8vIHRoZSBndWFyZCBtYXNrIHZhbHVlIGlzIG5vbi16ZXJvIGlmIGFuZCB3aGVuXG4gICAgICAvLyB0aGVyZSBhcmUgYmluZGluZyB2YWx1ZXMgcHJlc2VudCBmb3IgdGhlIHByb3BlcnR5LlxuICAgICAgLy8gSWYgdGhlcmUgYXJlIE9OTFkgc3RhdGljIHZhbHVlcyAoaS5lLiBgc3R5bGU9XCJwcm9wOnZhbFwiKVxuICAgICAgLy8gdGhlbiB0aGUgZ3VhcmQgdmFsdWUgd2lsbCBzdGF5IGFzIHplcm8uXG4gICAgICBjb25zdCBwcm9jZXNzRW50cnkgPVxuICAgICAgICAgIHByb2Nlc3NBbGxFbnRyaWVzIHx8IChndWFyZE1hc2sgPyAoYml0TWFzayAmIGd1YXJkTWFzaykgOiBmb3JjZUFwcGx5RGVmYXVsdFZhbHVlcyk7XG4gICAgICBpZiAocHJvY2Vzc0VudHJ5KSB7XG4gICAgICAgIGNvbnN0IHByb3AgPSBnZXRQcm9wKGNvbnRleHQsIGkpO1xuICAgICAgICBjb25zdCBsaW1pdCA9IHZhbHVlc0NvdW50IC0gMTtcbiAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPD0gbGltaXQ7IGorKykge1xuICAgICAgICAgIGNvbnN0IGlzRmluYWxWYWx1ZSA9IGogPT09IGxpbWl0O1xuICAgICAgICAgIGNvbnN0IGJpbmRpbmdWYWx1ZSA9IGdldFZhbHVlKGNvbnRleHQsIGksIGopO1xuICAgICAgICAgIGNvbnN0IGJpbmRpbmdJbmRleCA9XG4gICAgICAgICAgICAgIGlzRmluYWxWYWx1ZSA/IERFRkFVTFRfQklORElOR19JTkRFWF9WQUxVRSA6IChiaW5kaW5nVmFsdWUgYXMgbnVtYmVyKTtcbiAgICAgICAgICBjb25zdCB2YWx1ZVRvQXBwbHk6IHN0cmluZ3xudWxsID0gaXNGaW5hbFZhbHVlID8gYmluZGluZ1ZhbHVlIDogYmluZGluZ0RhdGFbYmluZGluZ0luZGV4XTtcbiAgICAgICAgICBpZiAoaXNWYWx1ZURlZmluZWQodmFsdWVUb0FwcGx5KSB8fCBpc0ZpbmFsVmFsdWUpIHtcbiAgICAgICAgICAgIGFwcGx5U3R5bGluZ0ZuKHJlbmRlcmVyLCBlbGVtZW50LCBwcm9wLCB2YWx1ZVRvQXBwbHksIGJpbmRpbmdJbmRleCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGkgKz0gVFN0eWxpbmdDb250ZXh0SW5kZXguQmluZGluZ3NTdGFydE9mZnNldCArIHZhbHVlc0NvdW50O1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBpc1ZhbHVlRGVmaW5lZCh2YWx1ZTogYW55KSB7XG4gIC8vIHRoZSByZWFzb24gd2h5IG51bGwgaXMgY29tcGFyZWQgYWdhaW5zdCBpcyBiZWNhdXNlXG4gIC8vIGEgQ1NTIGNsYXNzIHZhbHVlIHRoYXQgaXMgc2V0IHRvIGBmYWxzZWAgbXVzdCBiZVxuICAvLyByZXNwZWN0ZWQgKG90aGVyd2lzZSBpdCB3b3VsZCBiZSB0cmVhdGVkIGFzIGZhbHN5KS5cbiAgLy8gRW1wdHkgc3RyaW5nIHZhbHVlcyBhcmUgYmVjYXVzZSBkZXZlbG9wZXJzIHVzdWFsbHlcbiAgLy8gc2V0IGEgdmFsdWUgdG8gYW4gZW1wdHkgc3RyaW5nIHRvIHJlbW92ZSBpdC5cbiAgcmV0dXJuIHZhbHVlICE9IG51bGwgJiYgdmFsdWUgIT09ICcnO1xufVxuXG4vKipcbiAqIEFzc2lnbnMgYSBzdHlsZSB2YWx1ZSB0byBhIHN0eWxlIHByb3BlcnR5IGZvciB0aGUgZ2l2ZW4gZWxlbWVudC5cbiAqL1xuY29uc3Qgc2V0U3R5bGU6IEFwcGx5U3R5bGluZ0ZuID1cbiAgICAocmVuZGVyZXI6IFJlbmRlcmVyMyB8IG51bGwsIG5hdGl2ZTogYW55LCBwcm9wOiBzdHJpbmcsIHZhbHVlOiBzdHJpbmcgfCBudWxsKSA9PiB7XG4gICAgICBpZiAodmFsdWUpIHtcbiAgICAgICAgLy8gb3BhY2l0eSwgei1pbmRleCBhbmQgZmxleGJveCBhbGwgaGF2ZSBudW1iZXIgdmFsdWVzXG4gICAgICAgIC8vIGFuZCB0aGVzZSBuZWVkIHRvIGJlIGNvbnZlcnRlZCBpbnRvIHN0cmluZ3Mgc28gdGhhdFxuICAgICAgICAvLyB0aGV5IGNhbiBiZSBhc3NpZ25lZCBwcm9wZXJseS5cbiAgICAgICAgdmFsdWUgPSB2YWx1ZS50b1N0cmluZygpO1xuICAgICAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyU2V0U3R5bGUrKztcbiAgICAgICAgcmVuZGVyZXIgJiYgaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpID9cbiAgICAgICAgICAgIHJlbmRlcmVyLnNldFN0eWxlKG5hdGl2ZSwgcHJvcCwgdmFsdWUsIFJlbmRlcmVyU3R5bGVGbGFnczMuRGFzaENhc2UpIDpcbiAgICAgICAgICAgIG5hdGl2ZS5zdHlsZS5zZXRQcm9wZXJ0eShwcm9wLCB2YWx1ZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyUmVtb3ZlU3R5bGUrKztcbiAgICAgICAgcmVuZGVyZXIgJiYgaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpID9cbiAgICAgICAgICAgIHJlbmRlcmVyLnJlbW92ZVN0eWxlKG5hdGl2ZSwgcHJvcCwgUmVuZGVyZXJTdHlsZUZsYWdzMy5EYXNoQ2FzZSkgOlxuICAgICAgICAgICAgbmF0aXZlLnN0eWxlLnJlbW92ZVByb3BlcnR5KHByb3ApO1xuICAgICAgfVxuICAgIH07XG5cbi8qKlxuICogQWRkcy9yZW1vdmVzIHRoZSBwcm92aWRlZCBjbGFzc05hbWUgdmFsdWUgdG8gdGhlIHByb3ZpZGVkIGVsZW1lbnQuXG4gKi9cbmNvbnN0IHNldENsYXNzOiBBcHBseVN0eWxpbmdGbiA9XG4gICAgKHJlbmRlcmVyOiBSZW5kZXJlcjMgfCBudWxsLCBuYXRpdmU6IGFueSwgY2xhc3NOYW1lOiBzdHJpbmcsIHZhbHVlOiBhbnkpID0+IHtcbiAgICAgIGlmIChjbGFzc05hbWUgIT09ICcnKSB7XG4gICAgICAgIGlmICh2YWx1ZSkge1xuICAgICAgICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJBZGRDbGFzcysrO1xuICAgICAgICAgIHJlbmRlcmVyICYmIGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSA/IHJlbmRlcmVyLmFkZENsYXNzKG5hdGl2ZSwgY2xhc3NOYW1lKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmF0aXZlLmNsYXNzTGlzdC5hZGQoY2xhc3NOYW1lKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyUmVtb3ZlQ2xhc3MrKztcbiAgICAgICAgICByZW5kZXJlciAmJiBpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikgPyByZW5kZXJlci5yZW1vdmVDbGFzcyhuYXRpdmUsIGNsYXNzTmFtZSkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hdGl2ZS5jbGFzc0xpc3QucmVtb3ZlKGNsYXNzTmFtZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9O1xuIl19