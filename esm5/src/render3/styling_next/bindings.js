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
var ɵ0 = setStyle;
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
var ɵ1 = setClass;
export { ɵ0, ɵ1 };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmluZGluZ3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL3N0eWxpbmdfbmV4dC9iaW5kaW5ncy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0VBTUU7QUFDRixPQUFPLEVBQTJDLG1CQUFtQixFQUFFLG9CQUFvQixFQUFDLE1BQU0sd0JBQXdCLENBQUM7QUFFM0gsT0FBTyxFQUFDLGlCQUFpQixFQUFFLFlBQVksRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFFLGNBQWMsRUFBRSxlQUFlLEVBQUUsV0FBVyxFQUFDLE1BQU0sUUFBUSxDQUFDO0FBR3hIOzs7Ozs7Ozs7Ozs7O0dBYUc7QUFFSCxvRUFBb0U7QUFDcEUscUVBQXFFO0FBQ3JFLDRDQUE0QztBQUM1QyxJQUFJLGlCQUFpQixHQUFHLENBQUMsQ0FBQztBQUMxQixJQUFJLGlCQUFpQixHQUFHLENBQUMsQ0FBQztBQUMxQixJQUFJLGFBQWEsR0FBRyxDQUFDLENBQUM7QUFDdEIsSUFBSSxjQUFjLEdBQUcsQ0FBQyxDQUFDO0FBQ3ZCLElBQUksb0JBQW9CLEdBQWlELEVBQUUsQ0FBQztBQUU1RSxJQUFNLHFCQUFxQixHQUFHLElBQUksQ0FBQztBQUNuQyxJQUFNLGtCQUFrQixHQUFHLENBQUMsQ0FBQztBQUM3QixJQUFNLGtCQUFrQixHQUFHLENBQUMsQ0FBQztBQUM3QixNQUFNLENBQUMsSUFBTSwyQkFBMkIsR0FBRyxDQUFDLENBQUMsQ0FBQztBQUM5QyxNQUFNLENBQUMsSUFBTSxrQkFBa0IsR0FBRyxDQUFDLENBQUMsQ0FBQztBQUdyQzs7Ozs7Ozs7O0dBU0c7QUFDSCxNQUFNLFVBQVUsa0JBQWtCLENBQzlCLE9BQXdCLEVBQUUsSUFBd0IsRUFBRSxJQUFZLEVBQUUsWUFBb0IsRUFDdEYsS0FBaUMsRUFBRSxpQkFBMEI7SUFDL0QsSUFBTSxLQUFLLEdBQUcsaUJBQWlC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QUM3QyxRQUFRLElBQUksb0JBQW9CLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsTUFBTSxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3pDLE1BQU0sQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1NBQ2pGO0tBQ0Y7QUFDSCxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiogQGxpY2Vuc2VcbiogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4qXG4qIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4qIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiovXG5pbXBvcnQge1Byb2NlZHVyYWxSZW5kZXJlcjMsIFJFbGVtZW50LCBSZW5kZXJlcjMsIFJlbmRlcmVyU3R5bGVGbGFnczMsIGlzUHJvY2VkdXJhbFJlbmRlcmVyfSBmcm9tICcuLi9pbnRlcmZhY2VzL3JlbmRlcmVyJztcbmltcG9ydCB7QXBwbHlTdHlsaW5nRm4sIFN0eWxpbmdCaW5kaW5nRGF0YSwgVFN0eWxpbmdDb250ZXh0LCBUU3R5bGluZ0NvbnRleHRJbmRleH0gZnJvbSAnLi9pbnRlcmZhY2VzJztcbmltcG9ydCB7YWxsb3dTdHlsaW5nRmx1c2gsIGdldEd1YXJkTWFzaywgZ2V0UHJvcCwgZ2V0VmFsdWUsIGdldFZhbHVlc0NvdW50LCBpc0NvbnRleHRMb2NrZWQsIGxvY2tDb250ZXh0fSBmcm9tICcuL3V0aWwnO1xuXG5cbi8qKlxuICogVGhpcyBmaWxlIGNvbnRhaW5zIHRoZSBjb3JlIGxvZ2ljIGZvciBzdHlsaW5nIGluIEFuZ3VsYXIuXG4gKlxuICogQWxsIHN0eWxpbmcgYmluZGluZ3MgKGkuZS4gYFtzdHlsZV1gLCBgW3N0eWxlLnByb3BdYCwgYFtjbGFzc11gIGFuZCBgW2NsYXNzLm5hbWVdYClcbiAqIHdpbGwgaGF2ZSB0aGVpciB2YWx1ZXMgYmUgYXBwbGllZCB0aHJvdWdoIHRoZSBsb2dpYyBpbiB0aGlzIGZpbGUuXG4gKlxuICogV2hlbiBhIGJpbmRpbmcgaXMgZW5jb3VudGVyZWQgKGUuZy4gYDxkaXYgW3N0eWxlLndpZHRoXT1cIndcIj5gKSB0aGVuXG4gKiB0aGUgYmluZGluZyBkYXRhIHdpbGwgYmUgcG9wdWxhdGVkIGludG8gYSBgVFN0eWxpbmdDb250ZXh0YCBkYXRhLXN0cnVjdHVyZS5cbiAqIFRoZXJlIGlzIG9ubHkgb25lIGBUU3R5bGluZ0NvbnRleHRgIHBlciBgVE5vZGVgIGFuZCBlYWNoIGVsZW1lbnQgaW5zdGFuY2VcbiAqIHdpbGwgdXBkYXRlIGl0cyBzdHlsZS9jbGFzcyBiaW5kaW5nIHZhbHVlcyBpbiBjb25jZXJ0IHdpdGggdGhlIHN0eWxpbmdcbiAqIGNvbnRleHQuXG4gKlxuICogVG8gbGVhcm4gbW9yZSBhYm91dCB0aGUgYWxnb3JpdGhtIHNlZSBgVFN0eWxpbmdDb250ZXh0YC5cbiAqL1xuXG4vLyB0aGUgdmFsdWVzIGJlbG93IGFyZSBnbG9iYWwgdG8gYWxsIHN0eWxpbmcgY29kZSBiZWxvdy4gRWFjaCB2YWx1ZVxuLy8gd2lsbCBlaXRoZXIgaW5jcmVtZW50IG9yIG11dGF0ZSBlYWNoIHRpbWUgYSBzdHlsaW5nIGluc3RydWN0aW9uIGlzXG4vLyBleGVjdXRlZC4gRG8gbm90IG1vZGlmeSB0aGUgdmFsdWVzIGJlbG93LlxubGV0IGN1cnJlbnRTdHlsZUluZGV4ID0gMDtcbmxldCBjdXJyZW50Q2xhc3NJbmRleCA9IDA7XG5sZXQgc3R5bGVzQml0TWFzayA9IDA7XG5sZXQgY2xhc3Nlc0JpdE1hc2sgPSAwO1xubGV0IGRlZmVycmVkQmluZGluZ1F1ZXVlOiAoVFN0eWxpbmdDb250ZXh0IHwgbnVtYmVyIHwgc3RyaW5nIHwgbnVsbClbXSA9IFtdO1xuXG5jb25zdCBERUZBVUxUX0JJTkRJTkdfVkFMVUUgPSBudWxsO1xuY29uc3QgREVGQVVMVF9TSVpFX1ZBTFVFID0gMTtcbmNvbnN0IERFRkFVTFRfTUFTS19WQUxVRSA9IDA7XG5leHBvcnQgY29uc3QgREVGQVVMVF9CSU5ESU5HX0lOREVYX1ZBTFVFID0gLTE7XG5leHBvcnQgY29uc3QgQklUX01BU0tfQVBQTFlfQUxMID0gLTE7XG5cblxuLyoqXG4gKiBWaXNpdHMgYSBjbGFzcy1iYXNlZCBiaW5kaW5nIGFuZCB1cGRhdGVzIHRoZSBuZXcgdmFsdWUgKGlmIGNoYW5nZWQpLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gaXMgY2FsbGVkIGVhY2ggdGltZSBhIGNsYXNzLWJhc2VkIHN0eWxpbmcgaW5zdHJ1Y3Rpb25cbiAqIGlzIGV4ZWN1dGVkLiBJdCdzIGltcG9ydGFudCB0aGF0IGl0J3MgYWx3YXlzIGNhbGxlZCAoZXZlbiBpZiB0aGUgdmFsdWVcbiAqIGhhcyBub3QgY2hhbmdlZCkgc28gdGhhdCB0aGUgaW5uZXIgY291bnRlciBpbmRleCB2YWx1ZSBpcyBpbmNyZW1lbnRlZC5cbiAqIFRoaXMgd2F5LCBlYWNoIGluc3RydWN0aW9uIGlzIGFsd2F5cyBndWFyYW50ZWVkIHRvIGdldCB0aGUgc2FtZSBjb3VudGVyXG4gKiBzdGF0ZSBlYWNoIHRpbWUgaXRzIGNhbGxlZCAod2hpY2ggdGhlbiBhbGxvd3MgdGhlIGBUU3R5bGluZ0NvbnRleHRgXG4gKiBhbmQgdGhlIGJpdCBtYXNrIHZhbHVlcyB0byBiZSBpbiBzeW5jKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHVwZGF0ZUNsYXNzQmluZGluZyhcbiAgICBjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIGRhdGE6IFN0eWxpbmdCaW5kaW5nRGF0YSwgcHJvcDogc3RyaW5nLCBiaW5kaW5nSW5kZXg6IG51bWJlcixcbiAgICB2YWx1ZTogYm9vbGVhbiB8IG51bGwgfCB1bmRlZmluZWQsIGRlZmVyUmVnaXN0cmF0aW9uOiBib29sZWFuKTogdm9pZCB7XG4gIGNvbnN0IGluZGV4ID0gY3VycmVudENsYXNzSW5kZXgrKztcbiAgaWYgKHVwZGF0ZUJpbmRpbmdEYXRhKGNvbnRleHQsIGRhdGEsIGluZGV4LCBwcm9wLCBiaW5kaW5nSW5kZXgsIHZhbHVlLCBkZWZlclJlZ2lzdHJhdGlvbikpIHtcbiAgICBjbGFzc2VzQml0TWFzayB8PSAxIDw8IGluZGV4O1xuICB9XG59XG5cbi8qKlxuICogVmlzaXRzIGEgc3R5bGUtYmFzZWQgYmluZGluZyBhbmQgdXBkYXRlcyB0aGUgbmV3IHZhbHVlIChpZiBjaGFuZ2VkKS5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIGlzIGNhbGxlZCBlYWNoIHRpbWUgYSBzdHlsZS1iYXNlZCBzdHlsaW5nIGluc3RydWN0aW9uXG4gKiBpcyBleGVjdXRlZC4gSXQncyBpbXBvcnRhbnQgdGhhdCBpdCdzIGFsd2F5cyBjYWxsZWQgKGV2ZW4gaWYgdGhlIHZhbHVlXG4gKiBoYXMgbm90IGNoYW5nZWQpIHNvIHRoYXQgdGhlIGlubmVyIGNvdW50ZXIgaW5kZXggdmFsdWUgaXMgaW5jcmVtZW50ZWQuXG4gKiBUaGlzIHdheSwgZWFjaCBpbnN0cnVjdGlvbiBpcyBhbHdheXMgZ3VhcmFudGVlZCB0byBnZXQgdGhlIHNhbWUgY291bnRlclxuICogc3RhdGUgZWFjaCB0aW1lIGl0cyBjYWxsZWQgKHdoaWNoIHRoZW4gYWxsb3dzIHRoZSBgVFN0eWxpbmdDb250ZXh0YFxuICogYW5kIHRoZSBiaXQgbWFzayB2YWx1ZXMgdG8gYmUgaW4gc3luYykuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB1cGRhdGVTdHlsZUJpbmRpbmcoXG4gICAgY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCBkYXRhOiBTdHlsaW5nQmluZGluZ0RhdGEsIHByb3A6IHN0cmluZywgYmluZGluZ0luZGV4OiBudW1iZXIsXG4gICAgdmFsdWU6IFN0cmluZyB8IHN0cmluZyB8IG51bWJlciB8IG51bGwgfCB1bmRlZmluZWQsIGRlZmVyUmVnaXN0cmF0aW9uOiBib29sZWFuKTogdm9pZCB7XG4gIGNvbnN0IGluZGV4ID0gY3VycmVudFN0eWxlSW5kZXgrKztcbiAgaWYgKHVwZGF0ZUJpbmRpbmdEYXRhKGNvbnRleHQsIGRhdGEsIGluZGV4LCBwcm9wLCBiaW5kaW5nSW5kZXgsIHZhbHVlLCBkZWZlclJlZ2lzdHJhdGlvbikpIHtcbiAgICBzdHlsZXNCaXRNYXNrIHw9IDEgPDwgaW5kZXg7XG4gIH1cbn1cblxuZnVuY3Rpb24gdXBkYXRlQmluZGluZ0RhdGEoXG4gICAgY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCBkYXRhOiBTdHlsaW5nQmluZGluZ0RhdGEsIGNvdW50ZXJJbmRleDogbnVtYmVyLCBwcm9wOiBzdHJpbmcsXG4gICAgYmluZGluZ0luZGV4OiBudW1iZXIsIHZhbHVlOiBzdHJpbmcgfCBTdHJpbmcgfCBudW1iZXIgfCBib29sZWFuIHwgbnVsbCB8IHVuZGVmaW5lZCxcbiAgICBkZWZlclJlZ2lzdHJhdGlvbj86IGJvb2xlYW4pOiBib29sZWFuIHtcbiAgaWYgKCFpc0NvbnRleHRMb2NrZWQoY29udGV4dCkpIHtcbiAgICBpZiAoZGVmZXJSZWdpc3RyYXRpb24pIHtcbiAgICAgIGRlZmVyQmluZGluZ1JlZ2lzdHJhdGlvbihjb250ZXh0LCBjb3VudGVySW5kZXgsIHByb3AsIGJpbmRpbmdJbmRleCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGRlZmVycmVkQmluZGluZ1F1ZXVlLmxlbmd0aCAmJiBmbHVzaERlZmVycmVkQmluZGluZ3MoKTtcblxuICAgICAgLy8gdGhpcyB3aWxsIG9ubHkgaGFwcGVuIGR1cmluZyB0aGUgZmlyc3QgdXBkYXRlIHBhc3Mgb2YgdGhlXG4gICAgICAvLyBjb250ZXh0LiBUaGUgcmVhc29uIHdoeSB3ZSBjYW4ndCB1c2UgYHROb2RlLmZpcnN0VGVtcGxhdGVQYXNzYFxuICAgICAgLy8gaGVyZSBpcyBiZWNhdXNlIGl0cyBub3QgZ3VhcmFudGVlZCB0byBiZSB0cnVlIHdoZW4gdGhlIGZpcnN0XG4gICAgICAvLyB1cGRhdGUgcGFzcyBpcyBleGVjdXRlZCAocmVtZW1iZXIgdGhhdCBhbGwgc3R5bGluZyBpbnN0cnVjdGlvbnNcbiAgICAgIC8vIGFyZSBydW4gaW4gdGhlIHVwZGF0ZSBwaGFzZSwgYW5kLCBhcyBhIHJlc3VsdCwgYXJlIG5vIG1vcmVcbiAgICAgIC8vIHN0eWxpbmcgaW5zdHJ1Y3Rpb25zIHRoYXQgYXJlIHJ1biBpbiB0aGUgY3JlYXRpb24gcGhhc2UpLlxuICAgICAgcmVnaXN0ZXJCaW5kaW5nKGNvbnRleHQsIGNvdW50ZXJJbmRleCwgcHJvcCwgYmluZGluZ0luZGV4KTtcbiAgICB9XG4gIH1cblxuICBpZiAoZGF0YVtiaW5kaW5nSW5kZXhdICE9PSB2YWx1ZSkge1xuICAgIGRhdGFbYmluZGluZ0luZGV4XSA9IHZhbHVlO1xuICAgIHJldHVybiB0cnVlO1xuICB9XG4gIHJldHVybiBmYWxzZTtcbn1cblxuLyoqXG4gKiBTY2hlZHVsZXMgYSBiaW5kaW5nIHJlZ2lzdHJhdGlvbiB0byBiZSBydW4gYXQgYSBsYXRlciBwb2ludC5cbiAqXG4gKiBUaGUgcmVhc29uaW5nIGZvciB0aGlzIGZlYXR1cmUgaXMgdG8gZW5zdXJlIHRoYXQgc3R5bGluZ1xuICogYmluZGluZ3MgYXJlIHJlZ2lzdGVyZWQgaW4gdGhlIGNvcnJlY3Qgb3JkZXIgZm9yIHdoZW5cbiAqIGRpcmVjdGl2ZXMvY29tcG9uZW50cyBoYXZlIGEgc3VwZXIvc3ViIGNsYXNzIGluaGVyaXRhbmNlXG4gKiBjaGFpbnMuIEVhY2ggZGlyZWN0aXZlJ3Mgc3R5bGluZyBiaW5kaW5ncyBtdXN0IGJlXG4gKiByZWdpc3RlcmVkIGludG8gdGhlIGNvbnRleHQgaW4gcmV2ZXJzZSBvcmRlci4gVGhlcmVmb3JlIGFsbFxuICogYmluZGluZ3Mgd2lsbCBiZSBidWZmZXJlZCBpbiByZXZlcnNlIG9yZGVyIGFuZCB0aGVuIGFwcGxpZWRcbiAqIGFmdGVyIHRoZSBpbmhlcml0YW5jZSBjaGFpbiBleGl0cy5cbiAqL1xuZnVuY3Rpb24gZGVmZXJCaW5kaW5nUmVnaXN0cmF0aW9uKFxuICAgIGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgY291bnRlckluZGV4OiBudW1iZXIsIHByb3A6IHN0cmluZywgYmluZGluZ0luZGV4OiBudW1iZXIpIHtcbiAgZGVmZXJyZWRCaW5kaW5nUXVldWUuc3BsaWNlKDAsIDAsIGNvbnRleHQsIGNvdW50ZXJJbmRleCwgcHJvcCwgYmluZGluZ0luZGV4KTtcbn1cblxuLyoqXG4gKiBGbHVzaGVzIHRoZSBjb2xsZWN0aW9uIG9mIGRlZmVycmVkIGJpbmRpbmdzIGFuZCBjYXVzZXMgZWFjaCBlbnRyeVxuICogdG8gYmUgcmVnaXN0ZXJlZCBpbnRvIHRoZSBjb250ZXh0LlxuICovXG5mdW5jdGlvbiBmbHVzaERlZmVycmVkQmluZGluZ3MoKSB7XG4gIGxldCBpID0gMDtcbiAgd2hpbGUgKGkgPCBkZWZlcnJlZEJpbmRpbmdRdWV1ZS5sZW5ndGgpIHtcbiAgICBjb25zdCBjb250ZXh0ID0gZGVmZXJyZWRCaW5kaW5nUXVldWVbaSsrXSBhcyBUU3R5bGluZ0NvbnRleHQ7XG4gICAgY29uc3QgY291bnQgPSBkZWZlcnJlZEJpbmRpbmdRdWV1ZVtpKytdIGFzIG51bWJlcjtcbiAgICBjb25zdCBwcm9wID0gZGVmZXJyZWRCaW5kaW5nUXVldWVbaSsrXSBhcyBzdHJpbmc7XG4gICAgY29uc3QgYmluZGluZ0luZGV4ID0gZGVmZXJyZWRCaW5kaW5nUXVldWVbaSsrXSBhcyBudW1iZXIgfCBudWxsO1xuICAgIHJlZ2lzdGVyQmluZGluZyhjb250ZXh0LCBjb3VudCwgcHJvcCwgYmluZGluZ0luZGV4KTtcbiAgfVxuICBkZWZlcnJlZEJpbmRpbmdRdWV1ZS5sZW5ndGggPSAwO1xufVxuXG4vKipcbiAqIFJlZ2lzdGVycyB0aGUgcHJvdmlkZWQgYmluZGluZyAocHJvcCArIGJpbmRpbmdJbmRleCkgaW50byB0aGUgY29udGV4dC5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIGlzIHNoYXJlZCBiZXR3ZWVuIGJpbmRpbmdzIHRoYXQgYXJlIGFzc2lnbmVkIGltbWVkaWF0ZWx5XG4gKiAodmlhIGB1cGRhdGVCaW5kaW5nRGF0YWApIGFuZCBhdCBhIGRlZmVycmVkIHN0YWdlLiBXaGVuIGNhbGxlZCwgaXQgd2lsbFxuICogZmlndXJlIG91dCBleGFjdGx5IHdoZXJlIHRvIHBsYWNlIHRoZSBiaW5kaW5nIGRhdGEgaW4gdGhlIGNvbnRleHQuXG4gKlxuICogSXQgaXMgbmVlZGVkIGJlY2F1c2UgaXQgd2lsbCBlaXRoZXIgdXBkYXRlIG9yIGluc2VydCBhIHN0eWxpbmcgcHJvcGVydHlcbiAqIGludG8gdGhlIGNvbnRleHQgYXQgdGhlIGNvcnJlY3Qgc3BvdC5cbiAqXG4gKiBXaGVuIGNhbGxlZCwgb25lIG9mIHR3byB0aGluZ3Mgd2lsbCBoYXBwZW46XG4gKlxuICogMSkgSWYgdGhlIHByb3BlcnR5IGFscmVhZHkgZXhpc3RzIGluIHRoZSBjb250ZXh0IHRoZW4gaXQgd2lsbCBqdXN0IGFkZFxuICogICAgdGhlIHByb3ZpZGVkIGBiaW5kaW5nVmFsdWVgIHRvIHRoZSBlbmQgb2YgdGhlIGJpbmRpbmcgc291cmNlcyByZWdpb25cbiAqICAgIGZvciB0aGF0IHBhcnRpY3VsYXIgcHJvcGVydHkuXG4gKlxuICogICAgLSBJZiB0aGUgYmluZGluZyB2YWx1ZSBpcyBhIG51bWJlciB0aGVuIGl0IHdpbGwgYmUgYWRkZWQgYXMgYSBuZXdcbiAqICAgICAgYmluZGluZyBpbmRleCBzb3VyY2UgbmV4dCB0byB0aGUgb3RoZXIgYmluZGluZyBzb3VyY2VzIGZvciB0aGUgcHJvcGVydHkuXG4gKlxuICogICAgLSBPdGhlcndpc2UsIGlmIHRoZSBiaW5kaW5nIHZhbHVlIGlzIGEgc3RyaW5nL2Jvb2xlYW4vbnVsbCB0eXBlIHRoZW4gaXQgd2lsbFxuICogICAgICByZXBsYWNlIHRoZSBkZWZhdWx0IHZhbHVlIGZvciB0aGUgcHJvcGVydHkgaWYgdGhlIGRlZmF1bHQgdmFsdWUgaXMgYG51bGxgLlxuICpcbiAqIDIpIElmIHRoZSBwcm9wZXJ0eSBkb2VzIG5vdCBleGlzdCB0aGVuIGl0IHdpbGwgYmUgaW5zZXJ0ZWQgaW50byB0aGUgY29udGV4dC5cbiAqICAgIFRoZSBzdHlsaW5nIGNvbnRleHQgcmVsaWVzIG9uIGFsbCBwcm9wZXJ0aWVzIGJlaW5nIHN0b3JlZCBpbiBhbHBoYWJldGljYWxcbiAqICAgIG9yZGVyLCBzbyBpdCBrbm93cyBleGFjdGx5IHdoZXJlIHRvIHN0b3JlIGl0LlxuICpcbiAqICAgIFdoZW4gaW5zZXJ0ZWQsIGEgZGVmYXVsdCBgbnVsbGAgdmFsdWUgaXMgY3JlYXRlZCBmb3IgdGhlIHByb3BlcnR5IHdoaWNoIGV4aXN0c1xuICogICAgYXMgdGhlIGRlZmF1bHQgdmFsdWUgZm9yIHRoZSBiaW5kaW5nLiBJZiB0aGUgYmluZGluZ1ZhbHVlIHByb3BlcnR5IGlzIGluc2VydGVkXG4gKiAgICBhbmQgaXQgaXMgZWl0aGVyIGEgc3RyaW5nLCBudW1iZXIgb3IgbnVsbCB2YWx1ZSB0aGVuIHRoYXQgd2lsbCByZXBsYWNlIHRoZSBkZWZhdWx0XG4gKiAgICB2YWx1ZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlZ2lzdGVyQmluZGluZyhcbiAgICBjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIGNvdW50SWQ6IG51bWJlciwgcHJvcDogc3RyaW5nLFxuICAgIGJpbmRpbmdWYWx1ZTogbnVtYmVyIHwgbnVsbCB8IHN0cmluZyB8IGJvb2xlYW4pIHtcbiAgbGV0IGkgPSBUU3R5bGluZ0NvbnRleHRJbmRleC5WYWx1ZXNTdGFydFBvc2l0aW9uO1xuICBsZXQgZm91bmQgPSBmYWxzZTtcbiAgd2hpbGUgKGkgPCBjb250ZXh0Lmxlbmd0aCkge1xuICAgIGNvbnN0IHZhbHVlc0NvdW50ID0gZ2V0VmFsdWVzQ291bnQoY29udGV4dCwgaSk7XG4gICAgY29uc3QgcCA9IGdldFByb3AoY29udGV4dCwgaSk7XG4gICAgZm91bmQgPSBwcm9wIDw9IHA7XG4gICAgaWYgKGZvdW5kKSB7XG4gICAgICAvLyBhbGwgc3R5bGUvY2xhc3MgYmluZGluZ3MgYXJlIHNvcnRlZCBieSBwcm9wZXJ0eSBuYW1lXG4gICAgICBpZiAocHJvcCA8IHApIHtcbiAgICAgICAgYWxsb2NhdGVOZXdDb250ZXh0RW50cnkoY29udGV4dCwgaSwgcHJvcCk7XG4gICAgICB9XG4gICAgICBhZGRCaW5kaW5nSW50b0NvbnRleHQoY29udGV4dCwgaSwgYmluZGluZ1ZhbHVlLCBjb3VudElkKTtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBpICs9IFRTdHlsaW5nQ29udGV4dEluZGV4LkJpbmRpbmdzU3RhcnRPZmZzZXQgKyB2YWx1ZXNDb3VudDtcbiAgfVxuXG4gIGlmICghZm91bmQpIHtcbiAgICBhbGxvY2F0ZU5ld0NvbnRleHRFbnRyeShjb250ZXh0LCBjb250ZXh0Lmxlbmd0aCwgcHJvcCk7XG4gICAgYWRkQmluZGluZ0ludG9Db250ZXh0KGNvbnRleHQsIGksIGJpbmRpbmdWYWx1ZSwgY291bnRJZCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gYWxsb2NhdGVOZXdDb250ZXh0RW50cnkoY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCBpbmRleDogbnVtYmVyLCBwcm9wOiBzdHJpbmcpIHtcbiAgY29udGV4dC5zcGxpY2UoaW5kZXgsIDAsIERFRkFVTFRfTUFTS19WQUxVRSwgREVGQVVMVF9TSVpFX1ZBTFVFLCBwcm9wLCBERUZBVUxUX0JJTkRJTkdfVkFMVUUpO1xufVxuXG4vKipcbiAqIEluc2VydHMgYSBuZXcgYmluZGluZyB2YWx1ZSBpbnRvIGEgc3R5bGluZyBwcm9wZXJ0eSB0dXBsZSBpbiB0aGUgYFRTdHlsaW5nQ29udGV4dGAuXG4gKlxuICogQSBiaW5kaW5nVmFsdWUgaXMgaW5zZXJ0ZWQgaW50byBhIGNvbnRleHQgZHVyaW5nIHRoZSBmaXJzdCB1cGRhdGUgcGFzc1xuICogb2YgYSB0ZW1wbGF0ZSBvciBob3N0IGJpbmRpbmdzIGZ1bmN0aW9uLiBXaGVuIHRoaXMgb2NjdXJzLCB0d28gdGhpbmdzXG4gKiBoYXBwZW46XG4gKlxuICogLSBJZiB0aGUgYmluZGluZ1ZhbHVlIHZhbHVlIGlzIGEgbnVtYmVyIHRoZW4gaXQgaXMgdHJlYXRlZCBhcyBhIGJpbmRpbmdJbmRleFxuICogICB2YWx1ZSAoYSBpbmRleCBpbiB0aGUgYExWaWV3YCkgYW5kIGl0IHdpbGwgYmUgaW5zZXJ0ZWQgbmV4dCB0byB0aGUgb3RoZXJcbiAqICAgYmluZGluZyBpbmRleCBlbnRyaWVzLlxuICpcbiAqIC0gT3RoZXJ3aXNlIHRoZSBiaW5kaW5nIHZhbHVlIHdpbGwgdXBkYXRlIHRoZSBkZWZhdWx0IHZhbHVlIGZvciB0aGUgcHJvcGVydHlcbiAqICAgYW5kIHRoaXMgd2lsbCBvbmx5IGhhcHBlbiBpZiB0aGUgZGVmYXVsdCB2YWx1ZSBpcyBgbnVsbGAuXG4gKi9cbmZ1bmN0aW9uIGFkZEJpbmRpbmdJbnRvQ29udGV4dChcbiAgICBjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIGluZGV4OiBudW1iZXIsIGJpbmRpbmdWYWx1ZTogbnVtYmVyIHwgc3RyaW5nIHwgYm9vbGVhbiB8IG51bGwsXG4gICAgY291bnRJZDogbnVtYmVyKSB7XG4gIGNvbnN0IHZhbHVlc0NvdW50ID0gZ2V0VmFsdWVzQ291bnQoY29udGV4dCwgaW5kZXgpO1xuXG4gIC8vIC0xIGlzIHVzZWQgYmVjYXVzZSB3ZSB3YW50IHRoZSBsYXN0IHZhbHVlIHRoYXQncyBpbiB0aGUgbGlzdCAobm90IHRoZSBuZXh0IHNsb3QpXG4gIGNvbnN0IGxhc3RWYWx1ZUluZGV4ID0gaW5kZXggKyBUU3R5bGluZ0NvbnRleHRJbmRleC5CaW5kaW5nc1N0YXJ0T2Zmc2V0ICsgdmFsdWVzQ291bnQgLSAxO1xuXG4gIGlmICh0eXBlb2YgYmluZGluZ1ZhbHVlID09PSAnbnVtYmVyJykge1xuICAgIGNvbnRleHQuc3BsaWNlKGxhc3RWYWx1ZUluZGV4LCAwLCBiaW5kaW5nVmFsdWUpO1xuICAgIChjb250ZXh0W2luZGV4ICsgVFN0eWxpbmdDb250ZXh0SW5kZXguVmFsdWVzQ291bnRPZmZzZXRdIGFzIG51bWJlcikrKztcbiAgICAoY29udGV4dFtpbmRleCArIFRTdHlsaW5nQ29udGV4dEluZGV4Lk1hc2tPZmZzZXRdIGFzIG51bWJlcikgfD0gMSA8PCBjb3VudElkO1xuICB9IGVsc2UgaWYgKHR5cGVvZiBiaW5kaW5nVmFsdWUgPT09ICdzdHJpbmcnICYmIGNvbnRleHRbbGFzdFZhbHVlSW5kZXhdID09IG51bGwpIHtcbiAgICBjb250ZXh0W2xhc3RWYWx1ZUluZGV4XSA9IGJpbmRpbmdWYWx1ZTtcbiAgfVxufVxuXG4vKipcbiAqIEFwcGxpZXMgYWxsIGNsYXNzIGVudHJpZXMgaW4gdGhlIHByb3ZpZGVkIGNvbnRleHQgdG8gdGhlIHByb3ZpZGVkIGVsZW1lbnQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhcHBseUNsYXNzZXMoXG4gICAgcmVuZGVyZXI6IFJlbmRlcmVyMyB8IFByb2NlZHVyYWxSZW5kZXJlcjMgfCBudWxsLCBkYXRhOiBTdHlsaW5nQmluZGluZ0RhdGEsXG4gICAgY29udGV4dDogVFN0eWxpbmdDb250ZXh0LCBlbGVtZW50OiBSRWxlbWVudCwgZGlyZWN0aXZlSW5kZXg6IG51bWJlcikge1xuICBpZiAoYWxsb3dTdHlsaW5nRmx1c2goY29udGV4dCwgZGlyZWN0aXZlSW5kZXgpKSB7XG4gICAgY29uc3QgaXNGaXJzdFBhc3MgPSBpc0NvbnRleHRMb2NrZWQoY29udGV4dCk7XG4gICAgaXNGaXJzdFBhc3MgJiYgbG9ja0NvbnRleHQoY29udGV4dCk7XG4gICAgYXBwbHlTdHlsaW5nKGNvbnRleHQsIHJlbmRlcmVyLCBlbGVtZW50LCBkYXRhLCBjbGFzc2VzQml0TWFzaywgc2V0Q2xhc3MsIGlzRmlyc3RQYXNzKTtcbiAgICBjdXJyZW50Q2xhc3NJbmRleCA9IDA7XG4gICAgY2xhc3Nlc0JpdE1hc2sgPSAwO1xuICB9XG59XG5cbi8qKlxuICogQXBwbGllcyBhbGwgc3R5bGUgZW50cmllcyBpbiB0aGUgcHJvdmlkZWQgY29udGV4dCB0byB0aGUgcHJvdmlkZWQgZWxlbWVudC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFwcGx5U3R5bGVzKFxuICAgIHJlbmRlcmVyOiBSZW5kZXJlcjMgfCBQcm9jZWR1cmFsUmVuZGVyZXIzIHwgbnVsbCwgZGF0YTogU3R5bGluZ0JpbmRpbmdEYXRhLFxuICAgIGNvbnRleHQ6IFRTdHlsaW5nQ29udGV4dCwgZWxlbWVudDogUkVsZW1lbnQsIGRpcmVjdGl2ZUluZGV4OiBudW1iZXIpIHtcbiAgaWYgKGFsbG93U3R5bGluZ0ZsdXNoKGNvbnRleHQsIGRpcmVjdGl2ZUluZGV4KSkge1xuICAgIGNvbnN0IGlzRmlyc3RQYXNzID0gaXNDb250ZXh0TG9ja2VkKGNvbnRleHQpO1xuICAgIGlzRmlyc3RQYXNzICYmIGxvY2tDb250ZXh0KGNvbnRleHQpO1xuICAgIGFwcGx5U3R5bGluZyhjb250ZXh0LCByZW5kZXJlciwgZWxlbWVudCwgZGF0YSwgc3R5bGVzQml0TWFzaywgc2V0U3R5bGUsIGlzRmlyc3RQYXNzKTtcbiAgICBjdXJyZW50U3R5bGVJbmRleCA9IDA7XG4gICAgc3R5bGVzQml0TWFzayA9IDA7XG4gIH1cbn1cblxuLyoqXG4gKiBSdW5zIHRocm91Z2ggdGhlIHByb3ZpZGVkIHN0eWxpbmcgY29udGV4dCBhbmQgYXBwbGllcyBlYWNoIHZhbHVlIHRvXG4gKiB0aGUgcHJvdmlkZWQgZWxlbWVudCAodmlhIHRoZSByZW5kZXJlcikgaWYgb25lIG9yIG1vcmUgdmFsdWVzIGFyZSBwcmVzZW50LlxuICpcbiAqIE5vdGUgdGhhdCB0aGlzIGZ1bmN0aW9uIGlzIG5vdCBkZXNpZ25lZCB0byBiZSBjYWxsZWQgaW4gaXNvbGF0aW9uICh1c2VcbiAqIGBhcHBseUNsYXNzZXNgIGFuZCBgYXBwbHlTdHlsZXNgIHRvIGFjdHVhbGx5IGFwcGx5IHN0eWxpbmcgdmFsdWVzKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFwcGx5U3R5bGluZyhcbiAgICBjb250ZXh0OiBUU3R5bGluZ0NvbnRleHQsIHJlbmRlcmVyOiBSZW5kZXJlcjMgfCBQcm9jZWR1cmFsUmVuZGVyZXIzIHwgbnVsbCwgZWxlbWVudDogUkVsZW1lbnQsXG4gICAgYmluZGluZ0RhdGE6IFN0eWxpbmdCaW5kaW5nRGF0YSwgYml0TWFzazogbnVtYmVyLCBhcHBseVN0eWxpbmdGbjogQXBwbHlTdHlsaW5nRm4sXG4gICAgZm9yY2VBcHBseURlZmF1bHRWYWx1ZXM/OiBib29sZWFuKSB7XG4gIGRlZmVycmVkQmluZGluZ1F1ZXVlLmxlbmd0aCAmJiBmbHVzaERlZmVycmVkQmluZGluZ3MoKTtcblxuICBpZiAoYml0TWFzaykge1xuICAgIGxldCBwcm9jZXNzQWxsRW50cmllcyA9IGJpdE1hc2sgPT09IEJJVF9NQVNLX0FQUExZX0FMTDtcbiAgICBsZXQgaSA9IFRTdHlsaW5nQ29udGV4dEluZGV4LlZhbHVlc1N0YXJ0UG9zaXRpb247XG4gICAgd2hpbGUgKGkgPCBjb250ZXh0Lmxlbmd0aCkge1xuICAgICAgY29uc3QgdmFsdWVzQ291bnQgPSBnZXRWYWx1ZXNDb3VudChjb250ZXh0LCBpKTtcbiAgICAgIGNvbnN0IGd1YXJkTWFzayA9IGdldEd1YXJkTWFzayhjb250ZXh0LCBpKTtcblxuICAgICAgLy8gdGhlIGd1YXJkIG1hc2sgdmFsdWUgaXMgbm9uLXplcm8gaWYgYW5kIHdoZW5cbiAgICAgIC8vIHRoZXJlIGFyZSBiaW5kaW5nIHZhbHVlcyBwcmVzZW50IGZvciB0aGUgcHJvcGVydHkuXG4gICAgICAvLyBJZiB0aGVyZSBhcmUgT05MWSBzdGF0aWMgdmFsdWVzIChpLmUuIGBzdHlsZT1cInByb3A6dmFsXCIpXG4gICAgICAvLyB0aGVuIHRoZSBndWFyZCB2YWx1ZSB3aWxsIHN0YXkgYXMgemVyby5cbiAgICAgIGNvbnN0IHByb2Nlc3NFbnRyeSA9XG4gICAgICAgICAgcHJvY2Vzc0FsbEVudHJpZXMgfHwgKGd1YXJkTWFzayA/IChiaXRNYXNrICYgZ3VhcmRNYXNrKSA6IGZvcmNlQXBwbHlEZWZhdWx0VmFsdWVzKTtcbiAgICAgIGlmIChwcm9jZXNzRW50cnkpIHtcbiAgICAgICAgY29uc3QgcHJvcCA9IGdldFByb3AoY29udGV4dCwgaSk7XG4gICAgICAgIGNvbnN0IGxpbWl0ID0gdmFsdWVzQ291bnQgLSAxO1xuICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8PSBsaW1pdDsgaisrKSB7XG4gICAgICAgICAgY29uc3QgaXNGaW5hbFZhbHVlID0gaiA9PT0gbGltaXQ7XG4gICAgICAgICAgY29uc3QgYmluZGluZ1ZhbHVlID0gZ2V0VmFsdWUoY29udGV4dCwgaSwgaik7XG4gICAgICAgICAgY29uc3QgYmluZGluZ0luZGV4ID1cbiAgICAgICAgICAgICAgaXNGaW5hbFZhbHVlID8gREVGQVVMVF9CSU5ESU5HX0lOREVYX1ZBTFVFIDogKGJpbmRpbmdWYWx1ZSBhcyBudW1iZXIpO1xuICAgICAgICAgIGNvbnN0IHZhbHVlVG9BcHBseTogc3RyaW5nfG51bGwgPSBpc0ZpbmFsVmFsdWUgPyBiaW5kaW5nVmFsdWUgOiBiaW5kaW5nRGF0YVtiaW5kaW5nSW5kZXhdO1xuICAgICAgICAgIGlmIChpc1ZhbHVlRGVmaW5lZCh2YWx1ZVRvQXBwbHkpIHx8IGlzRmluYWxWYWx1ZSkge1xuICAgICAgICAgICAgYXBwbHlTdHlsaW5nRm4ocmVuZGVyZXIsIGVsZW1lbnQsIHByb3AsIHZhbHVlVG9BcHBseSwgYmluZGluZ0luZGV4KTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaSArPSBUU3R5bGluZ0NvbnRleHRJbmRleC5CaW5kaW5nc1N0YXJ0T2Zmc2V0ICsgdmFsdWVzQ291bnQ7XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGlzVmFsdWVEZWZpbmVkKHZhbHVlOiBhbnkpIHtcbiAgLy8gdGhlIHJlYXNvbiB3aHkgbnVsbCBpcyBjb21wYXJlZCBhZ2FpbnN0IGlzIGJlY2F1c2VcbiAgLy8gYSBDU1MgY2xhc3MgdmFsdWUgdGhhdCBpcyBzZXQgdG8gYGZhbHNlYCBtdXN0IGJlXG4gIC8vIHJlc3BlY3RlZCAob3RoZXJ3aXNlIGl0IHdvdWxkIGJlIHRyZWF0ZWQgYXMgZmFsc3kpLlxuICAvLyBFbXB0eSBzdHJpbmcgdmFsdWVzIGFyZSBiZWNhdXNlIGRldmVsb3BlcnMgdXN1YWxseVxuICAvLyBzZXQgYSB2YWx1ZSB0byBhbiBlbXB0eSBzdHJpbmcgdG8gcmVtb3ZlIGl0LlxuICByZXR1cm4gdmFsdWUgIT0gbnVsbCAmJiB2YWx1ZSAhPT0gJyc7XG59XG5cbi8qKlxuICogQXNzaWducyBhIHN0eWxlIHZhbHVlIHRvIGEgc3R5bGUgcHJvcGVydHkgZm9yIHRoZSBnaXZlbiBlbGVtZW50LlxuICovXG5jb25zdCBzZXRTdHlsZTogQXBwbHlTdHlsaW5nRm4gPVxuICAgIChyZW5kZXJlcjogUmVuZGVyZXIzIHwgbnVsbCwgbmF0aXZlOiBhbnksIHByb3A6IHN0cmluZywgdmFsdWU6IHN0cmluZyB8IG51bGwpID0+IHtcbiAgICAgIGlmICh2YWx1ZSkge1xuICAgICAgICAvLyBvcGFjaXR5LCB6LWluZGV4IGFuZCBmbGV4Ym94IGFsbCBoYXZlIG51bWJlciB2YWx1ZXNcbiAgICAgICAgLy8gYW5kIHRoZXNlIG5lZWQgdG8gYmUgY29udmVydGVkIGludG8gc3RyaW5ncyBzbyB0aGF0XG4gICAgICAgIC8vIHRoZXkgY2FuIGJlIGFzc2lnbmVkIHByb3Blcmx5LlxuICAgICAgICB2YWx1ZSA9IHZhbHVlLnRvU3RyaW5nKCk7XG4gICAgICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJTZXRTdHlsZSsrO1xuICAgICAgICByZW5kZXJlciAmJiBpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikgP1xuICAgICAgICAgICAgcmVuZGVyZXIuc2V0U3R5bGUobmF0aXZlLCBwcm9wLCB2YWx1ZSwgUmVuZGVyZXJTdHlsZUZsYWdzMy5EYXNoQ2FzZSkgOlxuICAgICAgICAgICAgbmF0aXZlLnN0eWxlLnNldFByb3BlcnR5KHByb3AsIHZhbHVlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJSZW1vdmVTdHlsZSsrO1xuICAgICAgICByZW5kZXJlciAmJiBpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikgP1xuICAgICAgICAgICAgcmVuZGVyZXIucmVtb3ZlU3R5bGUobmF0aXZlLCBwcm9wLCBSZW5kZXJlclN0eWxlRmxhZ3MzLkRhc2hDYXNlKSA6XG4gICAgICAgICAgICBuYXRpdmUuc3R5bGUucmVtb3ZlUHJvcGVydHkocHJvcCk7XG4gICAgICB9XG4gICAgfTtcblxuLyoqXG4gKiBBZGRzL3JlbW92ZXMgdGhlIHByb3ZpZGVkIGNsYXNzTmFtZSB2YWx1ZSB0byB0aGUgcHJvdmlkZWQgZWxlbWVudC5cbiAqL1xuY29uc3Qgc2V0Q2xhc3M6IEFwcGx5U3R5bGluZ0ZuID1cbiAgICAocmVuZGVyZXI6IFJlbmRlcmVyMyB8IG51bGwsIG5hdGl2ZTogYW55LCBjbGFzc05hbWU6IHN0cmluZywgdmFsdWU6IGFueSkgPT4ge1xuICAgICAgaWYgKGNsYXNzTmFtZSAhPT0gJycpIHtcbiAgICAgICAgaWYgKHZhbHVlKSB7XG4gICAgICAgICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlckFkZENsYXNzKys7XG4gICAgICAgICAgcmVuZGVyZXIgJiYgaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpID8gcmVuZGVyZXIuYWRkQ2xhc3MobmF0aXZlLCBjbGFzc05hbWUpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYXRpdmUuY2xhc3NMaXN0LmFkZChjbGFzc05hbWUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJSZW1vdmVDbGFzcysrO1xuICAgICAgICAgIHJlbmRlcmVyICYmIGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSA/IHJlbmRlcmVyLnJlbW92ZUNsYXNzKG5hdGl2ZSwgY2xhc3NOYW1lKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmF0aXZlLmNsYXNzTGlzdC5yZW1vdmUoY2xhc3NOYW1lKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH07XG4iXX0=