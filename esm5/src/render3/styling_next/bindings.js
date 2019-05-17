/**
* @license
* Copyright Google Inc. All Rights Reserved.
*
* Use of this source code is governed by an MIT-style license that can be
* found in the LICENSE file at https://angular.io/license
*/
import { RendererStyleFlags3, isProceduralRenderer } from '../interfaces/renderer';
import { allowStylingFlush, getGuardMask, getProp, getValue, getValuesCount, isContextLocked, lockContext } from './util';
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
 */
// the values below are global to all styling code below. Each value
// will either increment or mutate each time a styling instruction is
// executed. Do not modify the values below.
var currentStyleIndex = 0;
var currentClassIndex = 0;
var stylesBitMask = 0;
var classesBitMask = 0;
var deferredBindingQueue = [];
var DEFAULT_BINDING_VALUE = null;
var DEFAULT_SIZE_VALUE = 1;
var DEFAULT_MASK_VALUE = 0;
export var DEFAULT_BINDING_INDEX_VALUE = -1;
export var BIT_MASK_APPLY_ALL = -1;
/**
 * Visits a class-based binding and updates the new value (if changed).
 *
 * This function is called each time a class-based styling instruction
 * is executed. It's important that it's always called (even if the value
 * has not changed) so that the inner counter index value is incremented.
 * This way, each instruction is always guaranteed to get the same counter
 * state each time its called (which then allows the `TStylingContext`
 * and the bit mask values to be in sync).
 */
export function updateClassBinding(context, data, prop, bindingIndex, value, deferRegistration) {
    var index = currentClassIndex++;
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
 */
export function updateStyleBinding(context, data, prop, bindingIndex, value, deferRegistration) {
    var index = currentStyleIndex++;
    if (updateBindingData(context, data, index, prop, bindingIndex, value, deferRegistration)) {
        stylesBitMask |= 1 << index;
    }
}
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
 */
function deferBindingRegistration(context, counterIndex, prop, bindingIndex) {
    deferredBindingQueue.splice(0, 0, context, counterIndex, prop, bindingIndex);
}
/**
 * Flushes the collection of deferred bindings and causes each entry
 * to be registered into the context.
 */
function flushDeferredBindings() {
    var i = 0;
    while (i < deferredBindingQueue.length) {
        var context = deferredBindingQueue[i++];
        var count = deferredBindingQueue[i++];
        var prop = deferredBindingQueue[i++];
        var bindingIndex = deferredBindingQueue[i++];
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
 */
export function registerBinding(context, countId, prop, bindingValue) {
    var i = 2 /* ValuesStartPosition */;
    var found = false;
    while (i < context.length) {
        var valuesCount = getValuesCount(context, i);
        var p = getProp(context, i);
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
 */
function addBindingIntoContext(context, index, bindingValue, countId) {
    var valuesCount = getValuesCount(context, index);
    // -1 is used because we want the last value that's in the list (not the next slot)
    var lastValueIndex = index + 3 /* BindingsStartOffset */ + valuesCount - 1;
    if (typeof bindingValue === 'number') {
        context.splice(lastValueIndex, 0, bindingValue);
        context[index + 1 /* ValuesCountOffset */]++;
        context[index + 0 /* MaskOffset */] |= 1 << countId;
    }
    else if (typeof bindingValue === 'string' && context[lastValueIndex] == null) {
        context[lastValueIndex] = bindingValue;
    }
}
/**
 * Applies all class entries in the provided context to the provided element.
 */
export function applyClasses(renderer, data, context, element, directiveIndex) {
    if (allowStylingFlush(context, directiveIndex)) {
        var isFirstPass = isContextLocked(context);
        isFirstPass && lockContext(context);
        applyStyling(context, renderer, element, data, classesBitMask, setClass, isFirstPass);
        currentClassIndex = 0;
        classesBitMask = 0;
    }
}
/**
 * Applies all style entries in the provided context to the provided element.
 */
export function applyStyles(renderer, data, context, element, directiveIndex) {
    if (allowStylingFlush(context, directiveIndex)) {
        var isFirstPass = isContextLocked(context);
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
 */
export function applyStyling(context, renderer, element, bindingData, bitMask, applyStylingFn, forceApplyDefaultValues) {
    deferredBindingQueue.length && flushDeferredBindings();
    if (bitMask) {
        var processAllEntries = bitMask === BIT_MASK_APPLY_ALL;
        var i = 2 /* ValuesStartPosition */;
        while (i < context.length) {
            var valuesCount = getValuesCount(context, i);
            var guardMask = getGuardMask(context, i);
            // the guard mask value is non-zero if and when
            // there are binding values present for the property.
            // If there are ONLY static values (i.e. `style="prop:val")
            // then the guard value will stay as zero.
            var processEntry = processAllEntries || (guardMask ? (bitMask & guardMask) : forceApplyDefaultValues);
            if (processEntry) {
                var prop = getProp(context, i);
                var limit = valuesCount - 1;
                for (var j = 0; j <= limit; j++) {
                    var isFinalValue = j === limit;
                    var bindingValue = getValue(context, i, j);
                    var bindingIndex = isFinalValue ? DEFAULT_BINDING_INDEX_VALUE : bindingValue;
                    var valueToApply = isFinalValue ? bindingValue : bindingData[bindingIndex];
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
 */
var setStyle = function (renderer, native, prop, value) {
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
};
/**
 * Adds/removes the provided className value to the provided element.
 */
var setClass = function (renderer, native, className, value) {
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
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmluZGluZ3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL3N0eWxpbmdfbmV4dC9iaW5kaW5ncy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0VBTUU7QUFDRixPQUFPLEVBQTJDLG1CQUFtQixFQUFFLG9CQUFvQixFQUFDLE1BQU0sd0JBQXdCLENBQUM7QUFFM0gsT0FBTyxFQUFDLGlCQUFpQixFQUFFLFlBQVksRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFFLGNBQWMsRUFBRSxlQUFlLEVBQUUsV0FBVyxFQUFDLE1BQU0sUUFBUSxDQUFDO0FBR3hIOzs7Ozs7Ozs7Ozs7O0dBYUc7QUFFSCxvRUFBb0U7QUFDcEUscUVBQXFFO0FBQ3JFLDRDQUE0QztBQUM1QyxJQUFJLGlCQUFpQixHQUFHLENBQUMsQ0FBQztBQUMxQixJQUFJLGlCQUFpQixHQUFHLENBQUMsQ0FBQztBQUMxQixJQUFJLGFBQWEsR0FBRyxDQUFDLENBQUM7QUFDdEIsSUFBSSxjQUFjLEdBQUcsQ0FBQyxDQUFDO0FBQ3ZCLElBQUksb0JBQW9CLEdBQWlELEVBQUUsQ0FBQztBQUU1RSxJQUFNLHFCQUFxQixHQUFHLElBQUksQ0FBQztBQUNuQyxJQUFNLGtCQUFrQixHQUFHLENBQUMsQ0FBQztBQUM3QixJQUFNLGtCQUFrQixHQUFHLENBQUMsQ0FBQztBQUM3QixNQUFNLENBQUMsSUFBTSwyQkFBMkIsR0FBRyxDQUFDLENBQUMsQ0FBQztBQUM5QyxNQUFNLENBQUMsSUFBTSxrQkFBa0IsR0FBRyxDQUFDLENBQUMsQ0FBQztBQUdyQzs7Ozs7Ozs7O0dBU0c7QUFDSCxNQUFNLFVBQVUsa0JBQWtCLENBQzlCLE9BQXdCLEVBQUUsSUFBd0IsRUFBRSxJQUFZLEVBQUUsWUFBb0IsRUFDdEYsS0FBaUMsRUFBRSxpQkFBMEI7SUFDL0QsSUFBTSxLQUFLLEdBQUcsaUJBQWlC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QzdDLFFBQVEsSUFBSSxvQkFBb0IsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxNQUFNLEVBQUUsU0FBUyxDQUFDLENBQUMsQ0FBQztnQkFDekMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUM7U0FDakY7S0FDRjtBQUNILENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuKiBAbGljZW5zZVxuKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbipcbiogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuKi9cbmltcG9ydCB7UHJvY2VkdXJhbFJlbmRlcmVyMywgUkVsZW1lbnQsIFJlbmRlcmVyMywgUmVuZGVyZXJTdHlsZUZsYWdzMywgaXNQcm9jZWR1cmFsUmVuZGVyZXJ9IGZyb20gJy4uL2ludGVyZmFjZXMvcmVuZGVyZXInO1xuaW1wb3J0IHtBcHBseVN0eWxpbmdGbiwgU3R5bGluZ0JpbmRpbmdEYXRhLCBUU3R5bGluZ0NvbnRleHQsIFRTdHlsaW5nQ29udGV4dEluZGV4fSBmcm9tICcuL2ludGVyZmFjZXMnO1xuaW1wb3J0IHthbGxvd1N0eWxpbmdGbHVzaCwgZ2V0R3VhcmRNYXNrLCBnZXRQcm9wLCBnZXRWYWx1ZSwgZ2V0VmFsdWVzQ291bnQsIGlzQ29udGV4dExvY2tlZCwgbG9ja0NvbnRleHR9IGZyb20gJy4vdXRpbCc7XG5cblxuLyoqXG4gKiBUaGlzIGZpbGUgY29udGFpbnMgdGhlIGNvcmUgbG9naWMgZm9yIHN0eWxpbmcgaW4gQW5ndWxhci5cbiAqXG4gKiBBbGwgc3R5bGluZyBiaW5kaW5ncyAoaS5lLiBgW3N0eWxlXWAsIGBbc3R5bGUucHJvcF1gLCBgW2NsYXNzXWAgYW5kIGBbY2xhc3MubmFtZV1gKVxuICogd2lsbCBoYXZlIHRoZWlyIHZhbHVlcyBiZSBhcHBsaWVkIHRocm91Z2ggdGhlIGxvZ2ljIGluIHRoaXMgZmlsZS5cbiAqXG4gKiBXaGVuIGEgYmluZGluZyBpcyBlbmNvdW50ZXJlZCAoZS5nLiBgPGRpdiBbc3R5bGUud2lkdGhdPVwid1wiPmApIHRoZW5cbiAqIHRoZSBiaW5kaW5nIGRhdGEgd2lsbCBiZSBwb3B1bGF0ZWQgaW50byBhIGBUU3R5bGluZ0NvbnRleHRgIGRhdGEtc3RydWN0dXJlLlxuICogVGhlcmUgaXMgb25seSBvbmUgYFRTdHlsaW5nQ29udGV4dGAgcGVyIGBUTm9kZWAgYW5kIGVhY2ggZWxlbWVudCBpbnN0YW5jZVxuICogd2lsbCB1cGRhdGUgaXRzIHN0eWxlL2NsYXNzIGJpbmRpbmcgdmFsdWVzIGluIGNvbmNlcnQgd2l0aCB0aGUgc3R5bGluZ1xuICogY29udGV4dC5cbiAqXG4gKiBUbyBsZWFybiBtb3JlIGFib3V0IHRoZSBhbGdvcml0aG0gc2VlIGBUU3R5bGluZ0NvbnRleHRgLlxuICovXG5cbi8vIHRoZSB2YWx1ZXMgYmVsb3cgYXJlIGdsb2JhbCB0byBhbGwgc3R5bGluZyBjb2RlIGJlbG93LiBFYWNoIHZhbHVlXG4vLyB3aWxsIGVpdGhlciBpbmNyZW1lbnQgb3IgbXV0YXRlIGVhY2ggdGltZSBhIHN0eWxpbmcgaW5zdHJ1Y3Rpb24gaXNcbi8vIGV4ZWN1dGVkLiBEbyBub3QgbW9kaWZ5IHRoZSB2YWx1ZXMgYmVsb3cuXG5sZXQgY3VycmVudFN0eWxlSW5kZXggPSAwO1xubGV0IGN1cnJlbnRDbGFzc0luZGV4ID0gMDtcbmxldCBzdHlsZXNCaXRNYXNrID0gMDtcbmxldCBjbGFzc2VzQml0TWFzayA9IDA7XG5sZXQgZGVmZXJyZWRCaW5kaW5nUXVldWU6IChUU3R5bGluZ0NvbnRleHQgfCBudW1iZXIgfCBzdHJpbmcgfCBudWxsKVtdID0gW107XG5cbmNvbnN0IERFRkFVTFRfQklORElOR19WQUxVRSA9IG51bGw7XG5jb25zdCBERUZBVUxUX1NJWkVfVkFMVUUgPSAxO1xuY29uc3QgREVGQVVMVF9NQVNLX1ZBTFVFID0gMDtcbmV4cG9ydCBjb25zdCBERUZBVUxUX0JJTkRJTkdfSU5ERVhfVkFMVUUgPSAtMTtcbmV4cG9ydCBjb25zdCBCSVRfTUFTS19BUFBMWV9BTEwgPSAtMTtcblxuXG4vKipcbiAqIFZpc2l0cyBhIGNsYXNzLWJhc2VkIGJpbmRpbmcgYW5kIHVwZGF0ZXMgdGhlIG5ldyB2YWx1ZSAoaWYgY2hhbmdlZCkuXG4gKlxuICogVGhpcyBmdW5jdGlvbiBpcyBjYWxsZWQgZWFjaCB0aW1lIGEgY2xhc3MtYmFzZWQgc3R5bGluZyBpbnN0cnVjdGlvblxuICogaXMgZXhlY3V0ZWQuIEl0J3MgaW1wb3J0YW50IHRoYXQgaXQncyBhbHdheXMgY2FsbGVkIChldmVuIGlmIHRoZSB2YWx1ZVxuICogaGFzIG5vdCBjaGFuZ2VkKSBzbyB0aGF0IHRoZSBpbm5lciBjb3VudGVyIGluZGV4IHZhbHVlIGlzIGluY3JlbWVudGVkLlxuICogVGhpcyB3YXksIGVhY2ggaW5zdHJ1Y3Rpb24gaXMgYWx3YXlzIGd1YXJhbnRlZWQgdG8gZ2V0IHRoZSBzYW1lIGNvdW50ZXJcbiAqIHN0YXRlIGVhY2ggdGltZSBpdHMgY2FsbGVkICh3aGljaCB0aGVuIGFsbG93cyB0aGUgYFRTdHlsaW5nQ29udGV4dGBcbiAqIGFuZCB0aGUgYml0IG1hc2sgdmFsdWVzIHRvIGJlIGluIHN5bmMpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gdXBkYXRlQ2xhc3NCaW5kaW5nKFxuICAgIGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgZGF0YTogU3R5bGluZ0JpbmRpbmdEYXRhLCBwcm9wOiBzdHJpbmcsIGJpbmRpbmdJbmRleDogbnVtYmVyLFxuICAgIHZhbHVlOiBib29sZWFuIHwgbnVsbCB8IHVuZGVmaW5lZCwgZGVmZXJSZWdpc3RyYXRpb246IGJvb2xlYW4pOiB2b2lkIHtcbiAgY29uc3QgaW5kZXggPSBjdXJyZW50Q2xhc3NJbmRleCsrO1xuICBpZiAodXBkYXRlQmluZGluZ0RhdGEoY29udGV4dCwgZGF0YSwgaW5kZXgsIHByb3AsIGJpbmRpbmdJbmRleCwgdmFsdWUsIGRlZmVyUmVnaXN0cmF0aW9uKSkge1xuICAgIGNsYXNzZXNCaXRNYXNrIHw9IDEgPDwgaW5kZXg7XG4gIH1cbn1cblxuLyoqXG4gKiBWaXNpdHMgYSBzdHlsZS1iYXNlZCBiaW5kaW5nIGFuZCB1cGRhdGVzIHRoZSBuZXcgdmFsdWUgKGlmIGNoYW5nZWQpLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gaXMgY2FsbGVkIGVhY2ggdGltZSBhIHN0eWxlLWJhc2VkIHN0eWxpbmcgaW5zdHJ1Y3Rpb25cbiAqIGlzIGV4ZWN1dGVkLiBJdCdzIGltcG9ydGFudCB0aGF0IGl0J3MgYWx3YXlzIGNhbGxlZCAoZXZlbiBpZiB0aGUgdmFsdWVcbiAqIGhhcyBub3QgY2hhbmdlZCkgc28gdGhhdCB0aGUgaW5uZXIgY291bnRlciBpbmRleCB2YWx1ZSBpcyBpbmNyZW1lbnRlZC5cbiAqIFRoaXMgd2F5LCBlYWNoIGluc3RydWN0aW9uIGlzIGFsd2F5cyBndWFyYW50ZWVkIHRvIGdldCB0aGUgc2FtZSBjb3VudGVyXG4gKiBzdGF0ZSBlYWNoIHRpbWUgaXRzIGNhbGxlZCAod2hpY2ggdGhlbiBhbGxvd3MgdGhlIGBUU3R5bGluZ0NvbnRleHRgXG4gKiBhbmQgdGhlIGJpdCBtYXNrIHZhbHVlcyB0byBiZSBpbiBzeW5jKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHVwZGF0ZVN0eWxlQmluZGluZyhcbiAgICBjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIGRhdGE6IFN0eWxpbmdCaW5kaW5nRGF0YSwgcHJvcDogc3RyaW5nLCBiaW5kaW5nSW5kZXg6IG51bWJlcixcbiAgICB2YWx1ZTogU3RyaW5nIHwgc3RyaW5nIHwgbnVtYmVyIHwgbnVsbCB8IHVuZGVmaW5lZCwgZGVmZXJSZWdpc3RyYXRpb246IGJvb2xlYW4pOiB2b2lkIHtcbiAgY29uc3QgaW5kZXggPSBjdXJyZW50U3R5bGVJbmRleCsrO1xuICBpZiAodXBkYXRlQmluZGluZ0RhdGEoY29udGV4dCwgZGF0YSwgaW5kZXgsIHByb3AsIGJpbmRpbmdJbmRleCwgdmFsdWUsIGRlZmVyUmVnaXN0cmF0aW9uKSkge1xuICAgIHN0eWxlc0JpdE1hc2sgfD0gMSA8PCBpbmRleDtcbiAgfVxufVxuXG5mdW5jdGlvbiB1cGRhdGVCaW5kaW5nRGF0YShcbiAgICBjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIGRhdGE6IFN0eWxpbmdCaW5kaW5nRGF0YSwgY291bnRlckluZGV4OiBudW1iZXIsIHByb3A6IHN0cmluZyxcbiAgICBiaW5kaW5nSW5kZXg6IG51bWJlciwgdmFsdWU6IHN0cmluZyB8IFN0cmluZyB8IG51bWJlciB8IGJvb2xlYW4gfCBudWxsIHwgdW5kZWZpbmVkLFxuICAgIGRlZmVyUmVnaXN0cmF0aW9uPzogYm9vbGVhbik6IGJvb2xlYW4ge1xuICBpZiAoIWlzQ29udGV4dExvY2tlZChjb250ZXh0KSkge1xuICAgIGlmIChkZWZlclJlZ2lzdHJhdGlvbikge1xuICAgICAgZGVmZXJCaW5kaW5nUmVnaXN0cmF0aW9uKGNvbnRleHQsIGNvdW50ZXJJbmRleCwgcHJvcCwgYmluZGluZ0luZGV4KTtcbiAgICB9IGVsc2Uge1xuICAgICAgZGVmZXJyZWRCaW5kaW5nUXVldWUubGVuZ3RoICYmIGZsdXNoRGVmZXJyZWRCaW5kaW5ncygpO1xuXG4gICAgICAvLyB0aGlzIHdpbGwgb25seSBoYXBwZW4gZHVyaW5nIHRoZSBmaXJzdCB1cGRhdGUgcGFzcyBvZiB0aGVcbiAgICAgIC8vIGNvbnRleHQuIFRoZSByZWFzb24gd2h5IHdlIGNhbid0IHVzZSBgdE5vZGUuZmlyc3RUZW1wbGF0ZVBhc3NgXG4gICAgICAvLyBoZXJlIGlzIGJlY2F1c2UgaXRzIG5vdCBndWFyYW50ZWVkIHRvIGJlIHRydWUgd2hlbiB0aGUgZmlyc3RcbiAgICAgIC8vIHVwZGF0ZSBwYXNzIGlzIGV4ZWN1dGVkIChyZW1lbWJlciB0aGF0IGFsbCBzdHlsaW5nIGluc3RydWN0aW9uc1xuICAgICAgLy8gYXJlIHJ1biBpbiB0aGUgdXBkYXRlIHBoYXNlLCBhbmQsIGFzIGEgcmVzdWx0LCBhcmUgbm8gbW9yZVxuICAgICAgLy8gc3R5bGluZyBpbnN0cnVjdGlvbnMgdGhhdCBhcmUgcnVuIGluIHRoZSBjcmVhdGlvbiBwaGFzZSkuXG4gICAgICByZWdpc3RlckJpbmRpbmcoY29udGV4dCwgY291bnRlckluZGV4LCBwcm9wLCBiaW5kaW5nSW5kZXgpO1xuICAgIH1cbiAgfVxuXG4gIGlmIChkYXRhW2JpbmRpbmdJbmRleF0gIT09IHZhbHVlKSB7XG4gICAgZGF0YVtiaW5kaW5nSW5kZXhdID0gdmFsdWU7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG4vKipcbiAqIFNjaGVkdWxlcyBhIGJpbmRpbmcgcmVnaXN0cmF0aW9uIHRvIGJlIHJ1biBhdCBhIGxhdGVyIHBvaW50LlxuICpcbiAqIFRoZSByZWFzb25pbmcgZm9yIHRoaXMgZmVhdHVyZSBpcyB0byBlbnN1cmUgdGhhdCBzdHlsaW5nXG4gKiBiaW5kaW5ncyBhcmUgcmVnaXN0ZXJlZCBpbiB0aGUgY29ycmVjdCBvcmRlciBmb3Igd2hlblxuICogZGlyZWN0aXZlcy9jb21wb25lbnRzIGhhdmUgYSBzdXBlci9zdWIgY2xhc3MgaW5oZXJpdGFuY2VcbiAqIGNoYWlucy4gRWFjaCBkaXJlY3RpdmUncyBzdHlsaW5nIGJpbmRpbmdzIG11c3QgYmVcbiAqIHJlZ2lzdGVyZWQgaW50byB0aGUgY29udGV4dCBpbiByZXZlcnNlIG9yZGVyLiBUaGVyZWZvcmUgYWxsXG4gKiBiaW5kaW5ncyB3aWxsIGJlIGJ1ZmZlcmVkIGluIHJldmVyc2Ugb3JkZXIgYW5kIHRoZW4gYXBwbGllZFxuICogYWZ0ZXIgdGhlIGluaGVyaXRhbmNlIGNoYWluIGV4aXRzLlxuICovXG5mdW5jdGlvbiBkZWZlckJpbmRpbmdSZWdpc3RyYXRpb24oXG4gICAgY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCBjb3VudGVySW5kZXg6IG51bWJlciwgcHJvcDogc3RyaW5nLCBiaW5kaW5nSW5kZXg6IG51bWJlcikge1xuICBkZWZlcnJlZEJpbmRpbmdRdWV1ZS5zcGxpY2UoMCwgMCwgY29udGV4dCwgY291bnRlckluZGV4LCBwcm9wLCBiaW5kaW5nSW5kZXgpO1xufVxuXG4vKipcbiAqIEZsdXNoZXMgdGhlIGNvbGxlY3Rpb24gb2YgZGVmZXJyZWQgYmluZGluZ3MgYW5kIGNhdXNlcyBlYWNoIGVudHJ5XG4gKiB0byBiZSByZWdpc3RlcmVkIGludG8gdGhlIGNvbnRleHQuXG4gKi9cbmZ1bmN0aW9uIGZsdXNoRGVmZXJyZWRCaW5kaW5ncygpIHtcbiAgbGV0IGkgPSAwO1xuICB3aGlsZSAoaSA8IGRlZmVycmVkQmluZGluZ1F1ZXVlLmxlbmd0aCkge1xuICAgIGNvbnN0IGNvbnRleHQgPSBkZWZlcnJlZEJpbmRpbmdRdWV1ZVtpKytdIGFzIFRTdHlsaW5nQ29udGV4dDtcbiAgICBjb25zdCBjb3VudCA9IGRlZmVycmVkQmluZGluZ1F1ZXVlW2krK10gYXMgbnVtYmVyO1xuICAgIGNvbnN0IHByb3AgPSBkZWZlcnJlZEJpbmRpbmdRdWV1ZVtpKytdIGFzIHN0cmluZztcbiAgICBjb25zdCBiaW5kaW5nSW5kZXggPSBkZWZlcnJlZEJpbmRpbmdRdWV1ZVtpKytdIGFzIG51bWJlciB8IG51bGw7XG4gICAgcmVnaXN0ZXJCaW5kaW5nKGNvbnRleHQsIGNvdW50LCBwcm9wLCBiaW5kaW5nSW5kZXgpO1xuICB9XG4gIGRlZmVycmVkQmluZGluZ1F1ZXVlLmxlbmd0aCA9IDA7XG59XG5cbi8qKlxuICogUmVnaXN0ZXJzIHRoZSBwcm92aWRlZCBiaW5kaW5nIChwcm9wICsgYmluZGluZ0luZGV4KSBpbnRvIHRoZSBjb250ZXh0LlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gaXMgc2hhcmVkIGJldHdlZW4gYmluZGluZ3MgdGhhdCBhcmUgYXNzaWduZWQgaW1tZWRpYXRlbHlcbiAqICh2aWEgYHVwZGF0ZUJpbmRpbmdEYXRhYCkgYW5kIGF0IGEgZGVmZXJyZWQgc3RhZ2UuIFdoZW4gY2FsbGVkLCBpdCB3aWxsXG4gKiBmaWd1cmUgb3V0IGV4YWN0bHkgd2hlcmUgdG8gcGxhY2UgdGhlIGJpbmRpbmcgZGF0YSBpbiB0aGUgY29udGV4dC5cbiAqXG4gKiBJdCBpcyBuZWVkZWQgYmVjYXVzZSBpdCB3aWxsIGVpdGhlciB1cGRhdGUgb3IgaW5zZXJ0IGEgc3R5bGluZyBwcm9wZXJ0eVxuICogaW50byB0aGUgY29udGV4dCBhdCB0aGUgY29ycmVjdCBzcG90LlxuICpcbiAqIFdoZW4gY2FsbGVkLCBvbmUgb2YgdHdvIHRoaW5ncyB3aWxsIGhhcHBlbjpcbiAqXG4gKiAxKSBJZiB0aGUgcHJvcGVydHkgYWxyZWFkeSBleGlzdHMgaW4gdGhlIGNvbnRleHQgdGhlbiBpdCB3aWxsIGp1c3QgYWRkXG4gKiAgICB0aGUgcHJvdmlkZWQgYGJpbmRpbmdWYWx1ZWAgdG8gdGhlIGVuZCBvZiB0aGUgYmluZGluZyBzb3VyY2VzIHJlZ2lvblxuICogICAgZm9yIHRoYXQgcGFydGljdWxhciBwcm9wZXJ0eS5cbiAqXG4gKiAgICAtIElmIHRoZSBiaW5kaW5nIHZhbHVlIGlzIGEgbnVtYmVyIHRoZW4gaXQgd2lsbCBiZSBhZGRlZCBhcyBhIG5ld1xuICogICAgICBiaW5kaW5nIGluZGV4IHNvdXJjZSBuZXh0IHRvIHRoZSBvdGhlciBiaW5kaW5nIHNvdXJjZXMgZm9yIHRoZSBwcm9wZXJ0eS5cbiAqXG4gKiAgICAtIE90aGVyd2lzZSwgaWYgdGhlIGJpbmRpbmcgdmFsdWUgaXMgYSBzdHJpbmcvYm9vbGVhbi9udWxsIHR5cGUgdGhlbiBpdCB3aWxsXG4gKiAgICAgIHJlcGxhY2UgdGhlIGRlZmF1bHQgdmFsdWUgZm9yIHRoZSBwcm9wZXJ0eSBpZiB0aGUgZGVmYXVsdCB2YWx1ZSBpcyBgbnVsbGAuXG4gKlxuICogMikgSWYgdGhlIHByb3BlcnR5IGRvZXMgbm90IGV4aXN0IHRoZW4gaXQgd2lsbCBiZSBpbnNlcnRlZCBpbnRvIHRoZSBjb250ZXh0LlxuICogICAgVGhlIHN0eWxpbmcgY29udGV4dCByZWxpZXMgb24gYWxsIHByb3BlcnRpZXMgYmVpbmcgc3RvcmVkIGluIGFscGhhYmV0aWNhbFxuICogICAgb3JkZXIsIHNvIGl0IGtub3dzIGV4YWN0bHkgd2hlcmUgdG8gc3RvcmUgaXQuXG4gKlxuICogICAgV2hlbiBpbnNlcnRlZCwgYSBkZWZhdWx0IGBudWxsYCB2YWx1ZSBpcyBjcmVhdGVkIGZvciB0aGUgcHJvcGVydHkgd2hpY2ggZXhpc3RzXG4gKiAgICBhcyB0aGUgZGVmYXVsdCB2YWx1ZSBmb3IgdGhlIGJpbmRpbmcuIElmIHRoZSBiaW5kaW5nVmFsdWUgcHJvcGVydHkgaXMgaW5zZXJ0ZWRcbiAqICAgIGFuZCBpdCBpcyBlaXRoZXIgYSBzdHJpbmcsIG51bWJlciBvciBudWxsIHZhbHVlIHRoZW4gdGhhdCB3aWxsIHJlcGxhY2UgdGhlIGRlZmF1bHRcbiAqICAgIHZhbHVlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVnaXN0ZXJCaW5kaW5nKFxuICAgIGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgY291bnRJZDogbnVtYmVyLCBwcm9wOiBzdHJpbmcsXG4gICAgYmluZGluZ1ZhbHVlOiBudW1iZXIgfCBudWxsIHwgc3RyaW5nIHwgYm9vbGVhbikge1xuICBsZXQgaSA9IFRTdHlsaW5nQ29udGV4dEluZGV4LlZhbHVlc1N0YXJ0UG9zaXRpb247XG4gIGxldCBmb3VuZCA9IGZhbHNlO1xuICB3aGlsZSAoaSA8IGNvbnRleHQubGVuZ3RoKSB7XG4gICAgY29uc3QgdmFsdWVzQ291bnQgPSBnZXRWYWx1ZXNDb3VudChjb250ZXh0LCBpKTtcbiAgICBjb25zdCBwID0gZ2V0UHJvcChjb250ZXh0LCBpKTtcbiAgICBmb3VuZCA9IHByb3AgPD0gcDtcbiAgICBpZiAoZm91bmQpIHtcbiAgICAgIC8vIGFsbCBzdHlsZS9jbGFzcyBiaW5kaW5ncyBhcmUgc29ydGVkIGJ5IHByb3BlcnR5IG5hbWVcbiAgICAgIGlmIChwcm9wIDwgcCkge1xuICAgICAgICBhbGxvY2F0ZU5ld0NvbnRleHRFbnRyeShjb250ZXh0LCBpLCBwcm9wKTtcbiAgICAgIH1cbiAgICAgIGFkZEJpbmRpbmdJbnRvQ29udGV4dChjb250ZXh0LCBpLCBiaW5kaW5nVmFsdWUsIGNvdW50SWQpO1xuICAgICAgYnJlYWs7XG4gICAgfVxuICAgIGkgKz0gVFN0eWxpbmdDb250ZXh0SW5kZXguQmluZGluZ3NTdGFydE9mZnNldCArIHZhbHVlc0NvdW50O1xuICB9XG5cbiAgaWYgKCFmb3VuZCkge1xuICAgIGFsbG9jYXRlTmV3Q29udGV4dEVudHJ5KGNvbnRleHQsIGNvbnRleHQubGVuZ3RoLCBwcm9wKTtcbiAgICBhZGRCaW5kaW5nSW50b0NvbnRleHQoY29udGV4dCwgaSwgYmluZGluZ1ZhbHVlLCBjb3VudElkKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBhbGxvY2F0ZU5ld0NvbnRleHRFbnRyeShjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIGluZGV4OiBudW1iZXIsIHByb3A6IHN0cmluZykge1xuICBjb250ZXh0LnNwbGljZShpbmRleCwgMCwgREVGQVVMVF9NQVNLX1ZBTFVFLCBERUZBVUxUX1NJWkVfVkFMVUUsIHByb3AsIERFRkFVTFRfQklORElOR19WQUxVRSk7XG59XG5cbi8qKlxuICogSW5zZXJ0cyBhIG5ldyBiaW5kaW5nIHZhbHVlIGludG8gYSBzdHlsaW5nIHByb3BlcnR5IHR1cGxlIGluIHRoZSBgVFN0eWxpbmdDb250ZXh0YC5cbiAqXG4gKiBBIGJpbmRpbmdWYWx1ZSBpcyBpbnNlcnRlZCBpbnRvIGEgY29udGV4dCBkdXJpbmcgdGhlIGZpcnN0IHVwZGF0ZSBwYXNzXG4gKiBvZiBhIHRlbXBsYXRlIG9yIGhvc3QgYmluZGluZ3MgZnVuY3Rpb24uIFdoZW4gdGhpcyBvY2N1cnMsIHR3byB0aGluZ3NcbiAqIGhhcHBlbjpcbiAqXG4gKiAtIElmIHRoZSBiaW5kaW5nVmFsdWUgdmFsdWUgaXMgYSBudW1iZXIgdGhlbiBpdCBpcyB0cmVhdGVkIGFzIGEgYmluZGluZ0luZGV4XG4gKiAgIHZhbHVlIChhIGluZGV4IGluIHRoZSBgTFZpZXdgKSBhbmQgaXQgd2lsbCBiZSBpbnNlcnRlZCBuZXh0IHRvIHRoZSBvdGhlclxuICogICBiaW5kaW5nIGluZGV4IGVudHJpZXMuXG4gKlxuICogLSBPdGhlcndpc2UgdGhlIGJpbmRpbmcgdmFsdWUgd2lsbCB1cGRhdGUgdGhlIGRlZmF1bHQgdmFsdWUgZm9yIHRoZSBwcm9wZXJ0eVxuICogICBhbmQgdGhpcyB3aWxsIG9ubHkgaGFwcGVuIGlmIHRoZSBkZWZhdWx0IHZhbHVlIGlzIGBudWxsYC5cbiAqL1xuZnVuY3Rpb24gYWRkQmluZGluZ0ludG9Db250ZXh0KFxuICAgIGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgaW5kZXg6IG51bWJlciwgYmluZGluZ1ZhbHVlOiBudW1iZXIgfCBzdHJpbmcgfCBib29sZWFuIHwgbnVsbCxcbiAgICBjb3VudElkOiBudW1iZXIpIHtcbiAgY29uc3QgdmFsdWVzQ291bnQgPSBnZXRWYWx1ZXNDb3VudChjb250ZXh0LCBpbmRleCk7XG5cbiAgLy8gLTEgaXMgdXNlZCBiZWNhdXNlIHdlIHdhbnQgdGhlIGxhc3QgdmFsdWUgdGhhdCdzIGluIHRoZSBsaXN0IChub3QgdGhlIG5leHQgc2xvdClcbiAgY29uc3QgbGFzdFZhbHVlSW5kZXggPSBpbmRleCArIFRTdHlsaW5nQ29udGV4dEluZGV4LkJpbmRpbmdzU3RhcnRPZmZzZXQgKyB2YWx1ZXNDb3VudCAtIDE7XG5cbiAgaWYgKHR5cGVvZiBiaW5kaW5nVmFsdWUgPT09ICdudW1iZXInKSB7XG4gICAgY29udGV4dC5zcGxpY2UobGFzdFZhbHVlSW5kZXgsIDAsIGJpbmRpbmdWYWx1ZSk7XG4gICAgKGNvbnRleHRbaW5kZXggKyBUU3R5bGluZ0NvbnRleHRJbmRleC5WYWx1ZXNDb3VudE9mZnNldF0gYXMgbnVtYmVyKSsrO1xuICAgIChjb250ZXh0W2luZGV4ICsgVFN0eWxpbmdDb250ZXh0SW5kZXguTWFza09mZnNldF0gYXMgbnVtYmVyKSB8PSAxIDw8IGNvdW50SWQ7XG4gIH0gZWxzZSBpZiAodHlwZW9mIGJpbmRpbmdWYWx1ZSA9PT0gJ3N0cmluZycgJiYgY29udGV4dFtsYXN0VmFsdWVJbmRleF0gPT0gbnVsbCkge1xuICAgIGNvbnRleHRbbGFzdFZhbHVlSW5kZXhdID0gYmluZGluZ1ZhbHVlO1xuICB9XG59XG5cbi8qKlxuICogQXBwbGllcyBhbGwgY2xhc3MgZW50cmllcyBpbiB0aGUgcHJvdmlkZWQgY29udGV4dCB0byB0aGUgcHJvdmlkZWQgZWxlbWVudC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFwcGx5Q2xhc3NlcyhcbiAgICByZW5kZXJlcjogUmVuZGVyZXIzIHwgUHJvY2VkdXJhbFJlbmRlcmVyMyB8IG51bGwsIGRhdGE6IFN0eWxpbmdCaW5kaW5nRGF0YSxcbiAgICBjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIGVsZW1lbnQ6IFJFbGVtZW50LCBkaXJlY3RpdmVJbmRleDogbnVtYmVyKSB7XG4gIGlmIChhbGxvd1N0eWxpbmdGbHVzaChjb250ZXh0LCBkaXJlY3RpdmVJbmRleCkpIHtcbiAgICBjb25zdCBpc0ZpcnN0UGFzcyA9IGlzQ29udGV4dExvY2tlZChjb250ZXh0KTtcbiAgICBpc0ZpcnN0UGFzcyAmJiBsb2NrQ29udGV4dChjb250ZXh0KTtcbiAgICBhcHBseVN0eWxpbmcoY29udGV4dCwgcmVuZGVyZXIsIGVsZW1lbnQsIGRhdGEsIGNsYXNzZXNCaXRNYXNrLCBzZXRDbGFzcywgaXNGaXJzdFBhc3MpO1xuICAgIGN1cnJlbnRDbGFzc0luZGV4ID0gMDtcbiAgICBjbGFzc2VzQml0TWFzayA9IDA7XG4gIH1cbn1cblxuLyoqXG4gKiBBcHBsaWVzIGFsbCBzdHlsZSBlbnRyaWVzIGluIHRoZSBwcm92aWRlZCBjb250ZXh0IHRvIHRoZSBwcm92aWRlZCBlbGVtZW50LlxuICovXG5leHBvcnQgZnVuY3Rpb24gYXBwbHlTdHlsZXMoXG4gICAgcmVuZGVyZXI6IFJlbmRlcmVyMyB8IFByb2NlZHVyYWxSZW5kZXJlcjMgfCBudWxsLCBkYXRhOiBTdHlsaW5nQmluZGluZ0RhdGEsXG4gICAgY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCBlbGVtZW50OiBSRWxlbWVudCwgZGlyZWN0aXZlSW5kZXg6IG51bWJlcikge1xuICBpZiAoYWxsb3dTdHlsaW5nRmx1c2goY29udGV4dCwgZGlyZWN0aXZlSW5kZXgpKSB7XG4gICAgY29uc3QgaXNGaXJzdFBhc3MgPSBpc0NvbnRleHRMb2NrZWQoY29udGV4dCk7XG4gICAgaXNGaXJzdFBhc3MgJiYgbG9ja0NvbnRleHQoY29udGV4dCk7XG4gICAgYXBwbHlTdHlsaW5nKGNvbnRleHQsIHJlbmRlcmVyLCBlbGVtZW50LCBkYXRhLCBzdHlsZXNCaXRNYXNrLCBzZXRTdHlsZSwgaXNGaXJzdFBhc3MpO1xuICAgIGN1cnJlbnRTdHlsZUluZGV4ID0gMDtcbiAgICBzdHlsZXNCaXRNYXNrID0gMDtcbiAgfVxufVxuXG4vKipcbiAqIFJ1bnMgdGhyb3VnaCB0aGUgcHJvdmlkZWQgc3R5bGluZyBjb250ZXh0IGFuZCBhcHBsaWVzIGVhY2ggdmFsdWUgdG9cbiAqIHRoZSBwcm92aWRlZCBlbGVtZW50ICh2aWEgdGhlIHJlbmRlcmVyKSBpZiBvbmUgb3IgbW9yZSB2YWx1ZXMgYXJlIHByZXNlbnQuXG4gKlxuICogTm90ZSB0aGF0IHRoaXMgZnVuY3Rpb24gaXMgbm90IGRlc2lnbmVkIHRvIGJlIGNhbGxlZCBpbiBpc29sYXRpb24gKHVzZVxuICogYGFwcGx5Q2xhc3Nlc2AgYW5kIGBhcHBseVN0eWxlc2AgdG8gYWN0dWFsbHkgYXBwbHkgc3R5bGluZyB2YWx1ZXMpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gYXBwbHlTdHlsaW5nKFxuICAgIGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgcmVuZGVyZXI6IFJlbmRlcmVyMyB8IFByb2NlZHVyYWxSZW5kZXJlcjMgfCBudWxsLCBlbGVtZW50OiBSRWxlbWVudCxcbiAgICBiaW5kaW5nRGF0YTogU3R5bGluZ0JpbmRpbmdEYXRhLCBiaXRNYXNrOiBudW1iZXIsIGFwcGx5U3R5bGluZ0ZuOiBBcHBseVN0eWxpbmdGbixcbiAgICBmb3JjZUFwcGx5RGVmYXVsdFZhbHVlcz86IGJvb2xlYW4pIHtcbiAgZGVmZXJyZWRCaW5kaW5nUXVldWUubGVuZ3RoICYmIGZsdXNoRGVmZXJyZWRCaW5kaW5ncygpO1xuXG4gIGlmIChiaXRNYXNrKSB7XG4gICAgbGV0IHByb2Nlc3NBbGxFbnRyaWVzID0gYml0TWFzayA9PT0gQklUX01BU0tfQVBQTFlfQUxMO1xuICAgIGxldCBpID0gVFN0eWxpbmdDb250ZXh0SW5kZXguVmFsdWVzU3RhcnRQb3NpdGlvbjtcbiAgICB3aGlsZSAoaSA8IGNvbnRleHQubGVuZ3RoKSB7XG4gICAgICBjb25zdCB2YWx1ZXNDb3VudCA9IGdldFZhbHVlc0NvdW50KGNvbnRleHQsIGkpO1xuICAgICAgY29uc3QgZ3VhcmRNYXNrID0gZ2V0R3VhcmRNYXNrKGNvbnRleHQsIGkpO1xuXG4gICAgICAvLyB0aGUgZ3VhcmQgbWFzayB2YWx1ZSBpcyBub24temVybyBpZiBhbmQgd2hlblxuICAgICAgLy8gdGhlcmUgYXJlIGJpbmRpbmcgdmFsdWVzIHByZXNlbnQgZm9yIHRoZSBwcm9wZXJ0eS5cbiAgICAgIC8vIElmIHRoZXJlIGFyZSBPTkxZIHN0YXRpYyB2YWx1ZXMgKGkuZS4gYHN0eWxlPVwicHJvcDp2YWxcIilcbiAgICAgIC8vIHRoZW4gdGhlIGd1YXJkIHZhbHVlIHdpbGwgc3RheSBhcyB6ZXJvLlxuICAgICAgY29uc3QgcHJvY2Vzc0VudHJ5ID1cbiAgICAgICAgICBwcm9jZXNzQWxsRW50cmllcyB8fCAoZ3VhcmRNYXNrID8gKGJpdE1hc2sgJiBndWFyZE1hc2spIDogZm9yY2VBcHBseURlZmF1bHRWYWx1ZXMpO1xuICAgICAgaWYgKHByb2Nlc3NFbnRyeSkge1xuICAgICAgICBjb25zdCBwcm9wID0gZ2V0UHJvcChjb250ZXh0LCBpKTtcbiAgICAgICAgY29uc3QgbGltaXQgPSB2YWx1ZXNDb3VudCAtIDE7XG4gICAgICAgIGZvciAobGV0IGogPSAwOyBqIDw9IGxpbWl0OyBqKyspIHtcbiAgICAgICAgICBjb25zdCBpc0ZpbmFsVmFsdWUgPSBqID09PSBsaW1pdDtcbiAgICAgICAgICBjb25zdCBiaW5kaW5nVmFsdWUgPSBnZXRWYWx1ZShjb250ZXh0LCBpLCBqKTtcbiAgICAgICAgICBjb25zdCBiaW5kaW5nSW5kZXggPVxuICAgICAgICAgICAgICBpc0ZpbmFsVmFsdWUgPyBERUZBVUxUX0JJTkRJTkdfSU5ERVhfVkFMVUUgOiAoYmluZGluZ1ZhbHVlIGFzIG51bWJlcik7XG4gICAgICAgICAgY29uc3QgdmFsdWVUb0FwcGx5OiBzdHJpbmd8bnVsbCA9IGlzRmluYWxWYWx1ZSA/IGJpbmRpbmdWYWx1ZSA6IGJpbmRpbmdEYXRhW2JpbmRpbmdJbmRleF07XG4gICAgICAgICAgaWYgKGlzVmFsdWVEZWZpbmVkKHZhbHVlVG9BcHBseSkgfHwgaXNGaW5hbFZhbHVlKSB7XG4gICAgICAgICAgICBhcHBseVN0eWxpbmdGbihyZW5kZXJlciwgZWxlbWVudCwgcHJvcCwgdmFsdWVUb0FwcGx5LCBiaW5kaW5nSW5kZXgpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpICs9IFRTdHlsaW5nQ29udGV4dEluZGV4LkJpbmRpbmdzU3RhcnRPZmZzZXQgKyB2YWx1ZXNDb3VudDtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gaXNWYWx1ZURlZmluZWQodmFsdWU6IGFueSkge1xuICAvLyB0aGUgcmVhc29uIHdoeSBudWxsIGlzIGNvbXBhcmVkIGFnYWluc3QgaXMgYmVjYXVzZVxuICAvLyBhIENTUyBjbGFzcyB2YWx1ZSB0aGF0IGlzIHNldCB0byBgZmFsc2VgIG11c3QgYmVcbiAgLy8gcmVzcGVjdGVkIChvdGhlcndpc2UgaXQgd291bGQgYmUgdHJlYXRlZCBhcyBmYWxzeSkuXG4gIC8vIEVtcHR5IHN0cmluZyB2YWx1ZXMgYXJlIGJlY2F1c2UgZGV2ZWxvcGVycyB1c3VhbGx5XG4gIC8vIHNldCBhIHZhbHVlIHRvIGFuIGVtcHR5IHN0cmluZyB0byByZW1vdmUgaXQuXG4gIHJldHVybiB2YWx1ZSAhPSBudWxsICYmIHZhbHVlICE9PSAnJztcbn1cblxuLyoqXG4gKiBBc3NpZ25zIGEgc3R5bGUgdmFsdWUgdG8gYSBzdHlsZSBwcm9wZXJ0eSBmb3IgdGhlIGdpdmVuIGVsZW1lbnQuXG4gKi9cbmNvbnN0IHNldFN0eWxlOiBBcHBseVN0eWxpbmdGbiA9XG4gICAgKHJlbmRlcmVyOiBSZW5kZXJlcjMgfCBudWxsLCBuYXRpdmU6IGFueSwgcHJvcDogc3RyaW5nLCB2YWx1ZTogc3RyaW5nIHwgbnVsbCkgPT4ge1xuICAgICAgaWYgKHZhbHVlKSB7XG4gICAgICAgIC8vIG9wYWNpdHksIHotaW5kZXggYW5kIGZsZXhib3ggYWxsIGhhdmUgbnVtYmVyIHZhbHVlc1xuICAgICAgICAvLyBhbmQgdGhlc2UgbmVlZCB0byBiZSBjb252ZXJ0ZWQgaW50byBzdHJpbmdzIHNvIHRoYXRcbiAgICAgICAgLy8gdGhleSBjYW4gYmUgYXNzaWduZWQgcHJvcGVybHkuXG4gICAgICAgIHZhbHVlID0gdmFsdWUudG9TdHJpbmcoKTtcbiAgICAgICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlclNldFN0eWxlKys7XG4gICAgICAgIHJlbmRlcmVyICYmIGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSA/XG4gICAgICAgICAgICByZW5kZXJlci5zZXRTdHlsZShuYXRpdmUsIHByb3AsIHZhbHVlLCBSZW5kZXJlclN0eWxlRmxhZ3MzLkRhc2hDYXNlKSA6XG4gICAgICAgICAgICBuYXRpdmUuc3R5bGUuc2V0UHJvcGVydHkocHJvcCwgdmFsdWUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlclJlbW92ZVN0eWxlKys7XG4gICAgICAgIHJlbmRlcmVyICYmIGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSA/XG4gICAgICAgICAgICByZW5kZXJlci5yZW1vdmVTdHlsZShuYXRpdmUsIHByb3AsIFJlbmRlcmVyU3R5bGVGbGFnczMuRGFzaENhc2UpIDpcbiAgICAgICAgICAgIG5hdGl2ZS5zdHlsZS5yZW1vdmVQcm9wZXJ0eShwcm9wKTtcbiAgICAgIH1cbiAgICB9O1xuXG4vKipcbiAqIEFkZHMvcmVtb3ZlcyB0aGUgcHJvdmlkZWQgY2xhc3NOYW1lIHZhbHVlIHRvIHRoZSBwcm92aWRlZCBlbGVtZW50LlxuICovXG5jb25zdCBzZXRDbGFzczogQXBwbHlTdHlsaW5nRm4gPVxuICAgIChyZW5kZXJlcjogUmVuZGVyZXIzIHwgbnVsbCwgbmF0aXZlOiBhbnksIGNsYXNzTmFtZTogc3RyaW5nLCB2YWx1ZTogYW55KSA9PiB7XG4gICAgICBpZiAoY2xhc3NOYW1lICE9PSAnJykge1xuICAgICAgICBpZiAodmFsdWUpIHtcbiAgICAgICAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyQWRkQ2xhc3MrKztcbiAgICAgICAgICByZW5kZXJlciAmJiBpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikgPyByZW5kZXJlci5hZGRDbGFzcyhuYXRpdmUsIGNsYXNzTmFtZSkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hdGl2ZS5jbGFzc0xpc3QuYWRkKGNsYXNzTmFtZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlclJlbW92ZUNsYXNzKys7XG4gICAgICAgICAgcmVuZGVyZXIgJiYgaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpID8gcmVuZGVyZXIucmVtb3ZlQ2xhc3MobmF0aXZlLCBjbGFzc05hbWUpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYXRpdmUuY2xhc3NMaXN0LnJlbW92ZShjbGFzc05hbWUpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfTtcbiJdfQ==