/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { RendererStyleFlags3, isProceduralRenderer } from './interfaces/renderer';
/**
 * Used clone a copy of a pre-computed template of a styling context.
 *
 * A pre-computed template is designed to be computed once for a given element
 * (instructions.ts has logic for caching this).
 */
export function allocStylingContext(templateStyleContext) {
    // each instance gets a copy
    return templateStyleContext.slice();
}
/**
 * Creates a styling context template where styling information is stored.
 * Any styles that are later referenced using `updateStyleProp` must be
 * passed in within this function. Initial values for those styles are to
 * be declared after all initial style properties are declared (this change in
 * mode between declarations and initial styles is made possible using a special
 * enum value found in `definition.ts`).
 *
 * @param initialStyleDeclarations a list of style declarations and initial style values
 *    that are used later within the styling context.
 *
 *    -> ['width', 'height', SPECIAL_ENUM_VAL, 'width', '100px']
 *       This implies that `width` and `height` will be later styled and that the `width`
 *       property has an initial value of `100px`.
 */
export function createStylingContextTemplate(initialStyleDeclarations) {
    var initialStyles = [null];
    var context = [initialStyles, 0];
    var indexLookup = {};
    if (initialStyleDeclarations) {
        var hasPassedDeclarations = false;
        for (var i = 0; i < initialStyleDeclarations.length; i++) {
            var v = initialStyleDeclarations[i];
            // this flag value marks where the declarations end the initial values begin
            if (v === 0 /* INITIAL_STYLES */) {
                hasPassedDeclarations = true;
            }
            else {
                var prop = v;
                if (hasPassedDeclarations) {
                    var value = initialStyleDeclarations[++i];
                    initialStyles.push(value);
                    indexLookup[prop] = initialStyles.length - 1;
                }
                else {
                    // it's safe to use `0` since the default initial value for
                    // each property will always be null (which is at position 0)
                    indexLookup[prop] = 0;
                }
            }
        }
    }
    var allProps = Object.keys(indexLookup);
    var totalProps = allProps.length;
    // *2 because we are filling for both single and multi style spaces
    var maxLength = totalProps * 3 /* Size */ * 2 + 2 /* SingleStylesStartPosition */;
    // we need to fill the array from the start so that we can access
    // both the multi and the single array positions in the same loop block
    for (var i = 2 /* SingleStylesStartPosition */; i < maxLength; i++) {
        context.push(null);
    }
    var singleStart = 2 /* SingleStylesStartPosition */;
    var multiStart = totalProps * 3 /* Size */ + 2 /* SingleStylesStartPosition */;
    // fill single and multi-level styles
    for (var i = 0; i < allProps.length; i++) {
        var prop = allProps[i];
        var indexForInitial = indexLookup[prop];
        var indexForMulti = i * 3 /* Size */ + multiStart;
        var indexForSingle = i * 3 /* Size */ + singleStart;
        setFlag(context, indexForSingle, pointers(0 /* None */, indexForInitial, indexForMulti));
        setProp(context, indexForSingle, prop);
        setValue(context, indexForSingle, null);
        setFlag(context, indexForMulti, pointers(1 /* Dirty */, indexForInitial, indexForSingle));
        setProp(context, indexForMulti, prop);
        setValue(context, indexForMulti, null);
    }
    // there is no initial value flag for the master index since it doesn't reference an initial style
    // value
    setFlag(context, 1 /* MasterFlagPosition */, pointers(0, 0, multiStart));
    setContextDirty(context, initialStyles.length > 1);
    return context;
}
var EMPTY_ARR = [];
/**
 * Sets and resolves all `multi` styles on an `StylingContext` so that they can be
 * applied to the element once `renderStyles` is called.
 *
 * All missing styles (any values that are not provided in the new `styles` param)
 * will resolve to `null` within their respective positions in the context.
 *
 * @param context The styling context that will be updated with the
 *    newly provided style values.
 * @param styles The key/value map of CSS styles that will be used for the update.
 */
export function updateStyleMap(context, styles) {
    var propsToApply = styles ? Object.keys(styles) : EMPTY_ARR;
    var multiStartIndex = getMultiStartIndex(context);
    var dirty = false;
    var ctxIndex = multiStartIndex;
    var propIndex = 0;
    // the main loop here will try and figure out how the shape of the provided
    // styles differ with respect to the context. Later if the context/styles are
    // off-balance then they will be dealt in another loop after this one
    while (ctxIndex < context.length && propIndex < propsToApply.length) {
        var flag = getPointers(context, ctxIndex);
        var prop = getProp(context, ctxIndex);
        var value = getValue(context, ctxIndex);
        var newProp = propsToApply[propIndex];
        var newValue = styles[newProp];
        if (prop === newProp) {
            if (value !== newValue) {
                setValue(context, ctxIndex, newValue);
                var initialValue = getInitialValue(context, flag);
                // there is no point in setting this to dirty if the previously
                // rendered value was being referenced by the initial style (or null)
                if (initialValue !== newValue) {
                    setDirty(context, ctxIndex, true);
                    dirty = true;
                }
            }
        }
        else {
            var indexOfEntry = findEntryPositionByProp(context, newProp, ctxIndex);
            if (indexOfEntry > 0) {
                // it was found at a later point ... just swap the values
                swapMultiContextEntries(context, ctxIndex, indexOfEntry);
                if (value !== newValue) {
                    setValue(context, ctxIndex, newValue);
                    dirty = true;
                }
            }
            else {
                // we only care to do this if the insertion is in the middle
                var doShift = ctxIndex < context.length;
                insertNewMultiProperty(context, ctxIndex, newProp, newValue);
                dirty = true;
            }
        }
        ctxIndex += 3 /* Size */;
        propIndex++;
    }
    // this means that there are left-over values in the context that
    // were not included in the provided styles and in this case the
    // goal is to "remove" them from the context (by nullifying)
    while (ctxIndex < context.length) {
        var value = context[ctxIndex + 2 /* ValueOffset */];
        if (value !== null) {
            setDirty(context, ctxIndex, true);
            setValue(context, ctxIndex, null);
            dirty = true;
        }
        ctxIndex += 3 /* Size */;
    }
    // this means that there are left-over property in the context that
    // were not detected in the context during the loop above. In that
    // case we want to add the new entries into the list
    while (propIndex < propsToApply.length) {
        var prop = propsToApply[propIndex];
        var value = styles[prop];
        context.push(1 /* Dirty */, prop, value);
        propIndex++;
        dirty = true;
    }
    if (dirty) {
        setContextDirty(context, true);
    }
}
/**
 * Sets and resolves a single CSS style on a property on an `StylingContext` so that they
 * can be applied to the element once `renderElementStyles` is called.
 *
 * Note that prop-level styles are considered higher priority than styles that are applied
 * using `updateStyleMap`, therefore, when styles are rendered then any styles that
 * have been applied using this function will be considered first (then multi values second
 * and then initial values as a backup).
 *
 * @param context The styling context that will be updated with the
 *    newly provided style value.
 * @param index The index of the property which is being updated.
 * @param value The CSS style value that will be assigned
 */
export function updateStyleProp(context, index, value) {
    var singleIndex = 2 /* SingleStylesStartPosition */ + index * 3 /* Size */;
    var currValue = getValue(context, singleIndex);
    var currFlag = getPointers(context, singleIndex);
    // didn't change ... nothing to make a note of
    if (currValue !== value) {
        // the value will always get updated (even if the dirty flag is skipped)
        setValue(context, singleIndex, value);
        var indexForMulti = getMultiOrSingleIndex(currFlag);
        // if the value is the same in the multi-area then there's no point in re-assembling
        var valueForMulti = getValue(context, indexForMulti);
        if (!valueForMulti || valueForMulti !== value) {
            var multiDirty = false;
            var singleDirty = true;
            // only when the value is set to `null` should the multi-value get flagged
            if (value == null && valueForMulti) {
                multiDirty = true;
                singleDirty = false;
            }
            setDirty(context, indexForMulti, multiDirty);
            setDirty(context, singleIndex, singleDirty);
            setContextDirty(context, true);
        }
    }
}
/**
 * Renders all queued styles using a renderer onto the given element.
 *
 * This function works by rendering any styles (that have been applied
 * using `updateStyleMap` and `updateStyleProp`) onto the
 * provided element using the provided renderer. Just before the styles
 * are rendered a final key/value style map will be assembled.
 *
 * @param lElement the element that the styles will be rendered on
 * @param context The styling context that will be used to determine
 *      what styles will be rendered
 * @param renderer the renderer that will be used to apply the styling
 * @param styleStore if provided, the updated style values will be applied
 *    to this key/value map instead of being renderered via the renderer.
 * @returns an object literal. `{ color: 'red', height: 'auto'}`.
 */
export function renderStyles(lElement, context, renderer, styleStore) {
    if (isContextDirty(context)) {
        var native = lElement.native;
        var multiStartIndex = getMultiStartIndex(context);
        for (var i = 2 /* SingleStylesStartPosition */; i < context.length; i += 3 /* Size */) {
            // there is no point in rendering styles that have not changed on screen
            if (isDirty(context, i)) {
                var prop = getProp(context, i);
                var value = getValue(context, i);
                var flag = getPointers(context, i);
                var isInSingleRegion = i < multiStartIndex;
                var styleToApply = value;
                // STYLE DEFER CASE 1: Use a multi value instead of a null single value
                // this check implies that a single value was removed and we
                // should now defer to a multi value and use that (if set).
                if (isInSingleRegion && styleToApply == null) {
                    // single values ALWAYS have a reference to a multi index
                    var multiIndex = getMultiOrSingleIndex(flag);
                    styleToApply = getValue(context, multiIndex);
                }
                // STYLE DEFER CASE 2: Use the initial value if all else fails (is null)
                // the initial value will always be a string or null,
                // therefore we can safely adopt it incase there's nothing else
                if (styleToApply == null) {
                    styleToApply = getInitialValue(context, flag);
                }
                setStyle(native, prop, styleToApply, renderer, styleStore);
                setDirty(context, i, false);
            }
        }
        setContextDirty(context, false);
    }
}
/**
 * This function renders a given CSS prop/value entry using the
 * provided renderer. If a `styleStore` value is provided then
 * that will be used a render context instead of the provided
 * renderer.
 *
 * @param native the DOM Element
 * @param prop the CSS style property that will be rendered
 * @param value the CSS style value that will be rendered
 * @param renderer
 * @param styleStore an optional key/value map that will be used as a context to render styles on
 */
function setStyle(native, prop, value, renderer, styleStore) {
    if (styleStore) {
        styleStore[prop] = value;
    }
    else if (value == null) {
        ngDevMode && ngDevMode.rendererRemoveStyle++;
        isProceduralRenderer(renderer) ?
            renderer.removeStyle(native, prop, RendererStyleFlags3.DashCase) :
            native['style'].removeProperty(prop);
    }
    else {
        ngDevMode && ngDevMode.rendererSetStyle++;
        isProceduralRenderer(renderer) ?
            renderer.setStyle(native, prop, value, RendererStyleFlags3.DashCase) :
            native['style'].setProperty(prop, value);
    }
}
function setDirty(context, index, isDirtyYes) {
    var adjustedIndex = index >= 2 /* SingleStylesStartPosition */ ? (index + 0 /* FlagsOffset */) : index;
    if (isDirtyYes) {
        context[adjustedIndex] |= 1 /* Dirty */;
    }
    else {
        context[adjustedIndex] &= ~1 /* Dirty */;
    }
}
function isDirty(context, index) {
    var adjustedIndex = index >= 2 /* SingleStylesStartPosition */ ? (index + 0 /* FlagsOffset */) : index;
    return (context[adjustedIndex] & 1 /* Dirty */) == 1 /* Dirty */;
}
function pointers(configFlag, staticIndex, dynamicIndex) {
    return (configFlag & 1 /* Dirty */) | (staticIndex << 1 /* BitCountSize */) |
        (dynamicIndex << (15 /* BitCountSize */ + 1 /* BitCountSize */));
}
function getInitialValue(context, flag) {
    var index = getInitialIndex(flag);
    return context[0 /* InitialStylesPosition */][index];
}
function getInitialIndex(flag) {
    return (flag >> 1 /* BitCountSize */) & 32767 /* BitMask */;
}
function getMultiOrSingleIndex(flag) {
    var index = (flag >> (15 /* BitCountSize */ + 1 /* BitCountSize */)) & 32767 /* BitMask */;
    return index >= 2 /* SingleStylesStartPosition */ ? index : -1;
}
function getMultiStartIndex(context) {
    return getMultiOrSingleIndex(context[1 /* MasterFlagPosition */]);
}
function setProp(context, index, prop) {
    context[index + 1 /* PropertyOffset */] = prop;
}
function setValue(context, index, value) {
    context[index + 2 /* ValueOffset */] = value;
}
function setFlag(context, index, flag) {
    var adjustedIndex = index === 1 /* MasterFlagPosition */ ? index : (index + 0 /* FlagsOffset */);
    context[adjustedIndex] = flag;
}
function getPointers(context, index) {
    var adjustedIndex = index === 1 /* MasterFlagPosition */ ? index : (index + 0 /* FlagsOffset */);
    return context[adjustedIndex];
}
function getValue(context, index) {
    return context[index + 2 /* ValueOffset */];
}
function getProp(context, index) {
    return context[index + 1 /* PropertyOffset */];
}
export function isContextDirty(context) {
    return isDirty(context, 1 /* MasterFlagPosition */);
}
export function setContextDirty(context, isDirtyYes) {
    setDirty(context, 1 /* MasterFlagPosition */, isDirtyYes);
}
function findEntryPositionByProp(context, prop, startIndex) {
    for (var i = (startIndex || 0) + 1 /* PropertyOffset */; i < context.length; i += 3 /* Size */) {
        var thisProp = context[i];
        if (thisProp == prop) {
            return i - 1 /* PropertyOffset */;
        }
    }
    return -1;
}
function swapMultiContextEntries(context, indexA, indexB) {
    var tmpValue = getValue(context, indexA);
    var tmpProp = getProp(context, indexA);
    var tmpFlag = getPointers(context, indexA);
    var flagA = tmpFlag;
    var flagB = getPointers(context, indexB);
    var singleIndexA = getMultiOrSingleIndex(flagA);
    if (singleIndexA >= 0) {
        var _flag = getPointers(context, singleIndexA);
        var _initial = getInitialIndex(_flag);
        setFlag(context, singleIndexA, pointers(_flag, _initial, indexB));
    }
    var singleIndexB = getMultiOrSingleIndex(flagB);
    if (singleIndexB >= 0) {
        var _flag = getPointers(context, singleIndexB);
        var _initial = getInitialIndex(_flag);
        setFlag(context, singleIndexB, pointers(_flag, _initial, indexA));
    }
    setValue(context, indexA, getValue(context, indexB));
    setProp(context, indexA, getProp(context, indexB));
    setFlag(context, indexA, getPointers(context, indexB));
    setValue(context, indexB, tmpValue);
    setProp(context, indexB, tmpProp);
    setFlag(context, indexB, tmpFlag);
}
function updateSinglePointerValues(context, indexStartPosition) {
    for (var i = indexStartPosition; i < context.length; i += 3 /* Size */) {
        var multiFlag = getPointers(context, i);
        var singleIndex = getMultiOrSingleIndex(multiFlag);
        if (singleIndex > 0) {
            var singleFlag = getPointers(context, singleIndex);
            var initialIndexForSingle = getInitialIndex(singleFlag);
            var updatedFlag = pointers(isDirty(context, singleIndex) ? 1 /* Dirty */ : 0 /* None */, initialIndexForSingle, i);
            setFlag(context, singleIndex, updatedFlag);
        }
    }
}
function insertNewMultiProperty(context, index, name, value) {
    var doShift = index < context.length;
    // prop does not exist in the list, add it in
    context.splice(index, 0, 1 /* Dirty */, name, value);
    if (doShift) {
        // because the value was inserted midway into the array then we
        // need to update all the shifted multi values' single value
        // pointers to point to the newly shifted location
        updateSinglePointerValues(context, index + 3 /* Size */);
    }
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3R5bGluZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvc3R5bGluZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFJSCxPQUFPLEVBQVksbUJBQW1CLEVBQUUsb0JBQW9CLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQStJM0Y7Ozs7O0dBS0c7QUFDSCxNQUFNLDhCQUE4QixvQkFBb0M7SUFDdEUsNEJBQTRCO0lBQzVCLE9BQU8sb0JBQW9CLENBQUMsS0FBSyxFQUEyQixDQUFDO0FBQy9ELENBQUM7QUFFRDs7Ozs7Ozs7Ozs7Ozs7R0FjRztBQUNILE1BQU0sdUNBQ0Ysd0JBQWtFO0lBQ3BFLElBQU0sYUFBYSxHQUFrQixDQUFDLElBQUksQ0FBQyxDQUFDO0lBQzVDLElBQU0sT0FBTyxHQUFtQixDQUFDLGFBQWEsRUFBRSxDQUFDLENBQUMsQ0FBQztJQUVuRCxJQUFNLFdBQVcsR0FBNEIsRUFBRSxDQUFDO0lBQ2hELElBQUksd0JBQXdCLEVBQUU7UUFDNUIsSUFBSSxxQkFBcUIsR0FBRyxLQUFLLENBQUM7UUFDbEMsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLHdCQUF3QixDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtZQUN4RCxJQUFNLENBQUMsR0FBRyx3QkFBd0IsQ0FBQyxDQUFDLENBQWlDLENBQUM7WUFFdEUsNEVBQTRFO1lBQzVFLElBQUksQ0FBQywyQkFBdUMsRUFBRTtnQkFDNUMscUJBQXFCLEdBQUcsSUFBSSxDQUFDO2FBQzlCO2lCQUFNO2dCQUNMLElBQU0sSUFBSSxHQUFHLENBQVcsQ0FBQztnQkFDekIsSUFBSSxxQkFBcUIsRUFBRTtvQkFDekIsSUFBTSxLQUFLLEdBQUcsd0JBQXdCLENBQUMsRUFBRSxDQUFDLENBQVcsQ0FBQztvQkFDdEQsYUFBYSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztvQkFDMUIsV0FBVyxDQUFDLElBQUksQ0FBQyxHQUFHLGFBQWEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO2lCQUM5QztxQkFBTTtvQkFDTCwyREFBMkQ7b0JBQzNELDZEQUE2RDtvQkFDN0QsV0FBVyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztpQkFDdkI7YUFDRjtTQUNGO0tBQ0Y7SUFFRCxJQUFNLFFBQVEsR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO0lBQzFDLElBQU0sVUFBVSxHQUFHLFFBQVEsQ0FBQyxNQUFNLENBQUM7SUFFbkMsbUVBQW1FO0lBQ25FLElBQU0sU0FBUyxHQUFHLFVBQVUsZUFBb0IsR0FBRyxDQUFDLG9DQUF5QyxDQUFDO0lBRTlGLGlFQUFpRTtJQUNqRSx1RUFBdUU7SUFDdkUsS0FBSyxJQUFJLENBQUMsb0NBQXlDLEVBQUUsQ0FBQyxHQUFHLFNBQVMsRUFBRSxDQUFDLEVBQUUsRUFBRTtRQUN2RSxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0tBQ3BCO0lBRUQsSUFBTSxXQUFXLG9DQUF5QyxDQUFDO0lBQzNELElBQU0sVUFBVSxHQUFHLFVBQVUsZUFBb0Isb0NBQXlDLENBQUM7SUFFM0YscUNBQXFDO0lBQ3JDLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxRQUFRLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO1FBQ3hDLElBQU0sSUFBSSxHQUFHLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUV6QixJQUFNLGVBQWUsR0FBRyxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDMUMsSUFBTSxhQUFhLEdBQUcsQ0FBQyxlQUFvQixHQUFHLFVBQVUsQ0FBQztRQUN6RCxJQUFNLGNBQWMsR0FBRyxDQUFDLGVBQW9CLEdBQUcsV0FBVyxDQUFDO1FBRTNELE9BQU8sQ0FBQyxPQUFPLEVBQUUsY0FBYyxFQUFFLFFBQVEsZUFBb0IsZUFBZSxFQUFFLGFBQWEsQ0FBQyxDQUFDLENBQUM7UUFDOUYsT0FBTyxDQUFDLE9BQU8sRUFBRSxjQUFjLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDdkMsUUFBUSxDQUFDLE9BQU8sRUFBRSxjQUFjLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFFeEMsT0FBTyxDQUFDLE9BQU8sRUFBRSxhQUFhLEVBQUUsUUFBUSxnQkFBcUIsZUFBZSxFQUFFLGNBQWMsQ0FBQyxDQUFDLENBQUM7UUFDL0YsT0FBTyxDQUFDLE9BQU8sRUFBRSxhQUFhLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDdEMsUUFBUSxDQUFDLE9BQU8sRUFBRSxhQUFhLEVBQUUsSUFBSSxDQUFDLENBQUM7S0FDeEM7SUFFRCxrR0FBa0c7SUFDbEcsUUFBUTtJQUNSLE9BQU8sQ0FBQyxPQUFPLDhCQUFtQyxRQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxVQUFVLENBQUMsQ0FBQyxDQUFDO0lBQzlFLGVBQWUsQ0FBQyxPQUFPLEVBQUUsYUFBYSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQztJQUVuRCxPQUFPLE9BQU8sQ0FBQztBQUNqQixDQUFDO0FBRUQsSUFBTSxTQUFTLEdBQVUsRUFBRSxDQUFDO0FBQzVCOzs7Ozs7Ozs7O0dBVUc7QUFDSCxNQUFNLHlCQUF5QixPQUF1QixFQUFFLE1BQW1DO0lBQ3pGLElBQU0sWUFBWSxHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDO0lBQzlELElBQU0sZUFBZSxHQUFHLGtCQUFrQixDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBRXBELElBQUksS0FBSyxHQUFHLEtBQUssQ0FBQztJQUNsQixJQUFJLFFBQVEsR0FBRyxlQUFlLENBQUM7SUFDL0IsSUFBSSxTQUFTLEdBQUcsQ0FBQyxDQUFDO0lBRWxCLDJFQUEyRTtJQUMzRSw2RUFBNkU7SUFDN0UscUVBQXFFO0lBQ3JFLE9BQU8sUUFBUSxHQUFHLE9BQU8sQ0FBQyxNQUFNLElBQUksU0FBUyxHQUFHLFlBQVksQ0FBQyxNQUFNLEVBQUU7UUFDbkUsSUFBTSxJQUFJLEdBQUcsV0FBVyxDQUFDLE9BQU8sRUFBRSxRQUFRLENBQUMsQ0FBQztRQUM1QyxJQUFNLElBQUksR0FBRyxPQUFPLENBQUMsT0FBTyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBQ3hDLElBQU0sS0FBSyxHQUFHLFFBQVEsQ0FBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFFMUMsSUFBTSxPQUFPLEdBQUcsWUFBWSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQ3hDLElBQU0sUUFBUSxHQUFHLE1BQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUNuQyxJQUFJLElBQUksS0FBSyxPQUFPLEVBQUU7WUFDcEIsSUFBSSxLQUFLLEtBQUssUUFBUSxFQUFFO2dCQUN0QixRQUFRLENBQUMsT0FBTyxFQUFFLFFBQVEsRUFBRSxRQUFRLENBQUMsQ0FBQztnQkFDdEMsSUFBTSxZQUFZLEdBQUcsZUFBZSxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFFcEQsK0RBQStEO2dCQUMvRCxxRUFBcUU7Z0JBQ3JFLElBQUksWUFBWSxLQUFLLFFBQVEsRUFBRTtvQkFDN0IsUUFBUSxDQUFDLE9BQU8sRUFBRSxRQUFRLEVBQUUsSUFBSSxDQUFDLENBQUM7b0JBQ2xDLEtBQUssR0FBRyxJQUFJLENBQUM7aUJBQ2Q7YUFDRjtTQUNGO2FBQU07WUFDTCxJQUFNLFlBQVksR0FBRyx1QkFBdUIsQ0FBQyxPQUFPLEVBQUUsT0FBTyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBQ3pFLElBQUksWUFBWSxHQUFHLENBQUMsRUFBRTtnQkFDcEIseURBQXlEO2dCQUN6RCx1QkFBdUIsQ0FBQyxPQUFPLEVBQUUsUUFBUSxFQUFFLFlBQVksQ0FBQyxDQUFDO2dCQUN6RCxJQUFJLEtBQUssS0FBSyxRQUFRLEVBQUU7b0JBQ3RCLFFBQVEsQ0FBQyxPQUFPLEVBQUUsUUFBUSxFQUFFLFFBQVEsQ0FBQyxDQUFDO29CQUN0QyxLQUFLLEdBQUcsSUFBSSxDQUFDO2lCQUNkO2FBQ0Y7aUJBQU07Z0JBQ0wsNERBQTREO2dCQUM1RCxJQUFNLE9BQU8sR0FBRyxRQUFRLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQztnQkFDMUMsc0JBQXNCLENBQUMsT0FBTyxFQUFFLFFBQVEsRUFBRSxPQUFPLEVBQUUsUUFBUSxDQUFDLENBQUM7Z0JBQzdELEtBQUssR0FBRyxJQUFJLENBQUM7YUFDZDtTQUNGO1FBRUQsUUFBUSxnQkFBcUIsQ0FBQztRQUM5QixTQUFTLEVBQUUsQ0FBQztLQUNiO0lBRUQsaUVBQWlFO0lBQ2pFLGdFQUFnRTtJQUNoRSw0REFBNEQ7SUFDNUQsT0FBTyxRQUFRLEdBQUcsT0FBTyxDQUFDLE1BQU0sRUFBRTtRQUNoQyxJQUFNLEtBQUssR0FBRyxPQUFPLENBQUMsUUFBUSxzQkFBMkIsQ0FBQyxDQUFDO1FBQzNELElBQUksS0FBSyxLQUFLLElBQUksRUFBRTtZQUNsQixRQUFRLENBQUMsT0FBTyxFQUFFLFFBQVEsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUNsQyxRQUFRLENBQUMsT0FBTyxFQUFFLFFBQVEsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUNsQyxLQUFLLEdBQUcsSUFBSSxDQUFDO1NBQ2Q7UUFDRCxRQUFRLGdCQUFxQixDQUFDO0tBQy9CO0lBRUQsbUVBQW1FO0lBQ25FLGtFQUFrRTtJQUNsRSxvREFBb0Q7SUFDcEQsT0FBTyxTQUFTLEdBQUcsWUFBWSxDQUFDLE1BQU0sRUFBRTtRQUN0QyxJQUFNLElBQUksR0FBRyxZQUFZLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDckMsSUFBTSxLQUFLLEdBQUcsTUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzdCLE9BQU8sQ0FBQyxJQUFJLGdCQUFxQixJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDOUMsU0FBUyxFQUFFLENBQUM7UUFDWixLQUFLLEdBQUcsSUFBSSxDQUFDO0tBQ2Q7SUFFRCxJQUFJLEtBQUssRUFBRTtRQUNULGVBQWUsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUM7S0FDaEM7QUFDSCxDQUFDO0FBRUQ7Ozs7Ozs7Ozs7Ozs7R0FhRztBQUNILE1BQU0sMEJBQ0YsT0FBdUIsRUFBRSxLQUFhLEVBQUUsS0FBb0I7SUFDOUQsSUFBTSxXQUFXLEdBQUcsb0NBQXlDLEtBQUssZUFBb0IsQ0FBQztJQUN2RixJQUFNLFNBQVMsR0FBRyxRQUFRLENBQUMsT0FBTyxFQUFFLFdBQVcsQ0FBQyxDQUFDO0lBQ2pELElBQU0sUUFBUSxHQUFHLFdBQVcsQ0FBQyxPQUFPLEVBQUUsV0FBVyxDQUFDLENBQUM7SUFFbkQsOENBQThDO0lBQzlDLElBQUksU0FBUyxLQUFLLEtBQUssRUFBRTtRQUN2Qix3RUFBd0U7UUFDeEUsUUFBUSxDQUFDLE9BQU8sRUFBRSxXQUFXLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDdEMsSUFBTSxhQUFhLEdBQUcscUJBQXFCLENBQUMsUUFBUSxDQUFDLENBQUM7UUFFdEQsb0ZBQW9GO1FBQ3BGLElBQU0sYUFBYSxHQUFHLFFBQVEsQ0FBQyxPQUFPLEVBQUUsYUFBYSxDQUFDLENBQUM7UUFDdkQsSUFBSSxDQUFDLGFBQWEsSUFBSSxhQUFhLEtBQUssS0FBSyxFQUFFO1lBQzdDLElBQUksVUFBVSxHQUFHLEtBQUssQ0FBQztZQUN2QixJQUFJLFdBQVcsR0FBRyxJQUFJLENBQUM7WUFFdkIsMEVBQTBFO1lBQzFFLElBQUksS0FBSyxJQUFJLElBQUksSUFBSSxhQUFhLEVBQUU7Z0JBQ2xDLFVBQVUsR0FBRyxJQUFJLENBQUM7Z0JBQ2xCLFdBQVcsR0FBRyxLQUFLLENBQUM7YUFDckI7WUFFRCxRQUFRLENBQUMsT0FBTyxFQUFFLGFBQWEsRUFBRSxVQUFVLENBQUMsQ0FBQztZQUM3QyxRQUFRLENBQUMsT0FBTyxFQUFFLFdBQVcsRUFBRSxXQUFXLENBQUMsQ0FBQztZQUM1QyxlQUFlLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDO1NBQ2hDO0tBQ0Y7QUFDSCxDQUFDO0FBRUQ7Ozs7Ozs7Ozs7Ozs7OztHQWVHO0FBQ0gsTUFBTSx1QkFDRixRQUFzQixFQUFFLE9BQXVCLEVBQUUsUUFBbUIsRUFDcEUsVUFBaUM7SUFDbkMsSUFBSSxjQUFjLENBQUMsT0FBTyxDQUFDLEVBQUU7UUFDM0IsSUFBTSxNQUFNLEdBQUcsUUFBUSxDQUFDLE1BQU0sQ0FBQztRQUMvQixJQUFNLGVBQWUsR0FBRyxrQkFBa0IsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUNwRCxLQUFLLElBQUksQ0FBQyxvQ0FBeUMsRUFBRSxDQUFDLEdBQUcsT0FBTyxDQUFDLE1BQU0sRUFDbEUsQ0FBQyxnQkFBcUIsRUFBRTtZQUMzQix3RUFBd0U7WUFDeEUsSUFBSSxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxFQUFFO2dCQUN2QixJQUFNLElBQUksR0FBRyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUNqQyxJQUFNLEtBQUssR0FBRyxRQUFRLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUNuQyxJQUFNLElBQUksR0FBRyxXQUFXLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUNyQyxJQUFNLGdCQUFnQixHQUFHLENBQUMsR0FBRyxlQUFlLENBQUM7Z0JBRTdDLElBQUksWUFBWSxHQUFnQixLQUFLLENBQUM7Z0JBRXRDLHVFQUF1RTtnQkFDdkUsNERBQTREO2dCQUM1RCwyREFBMkQ7Z0JBQzNELElBQUksZ0JBQWdCLElBQUksWUFBWSxJQUFJLElBQUksRUFBRTtvQkFDNUMseURBQXlEO29CQUN6RCxJQUFNLFVBQVUsR0FBRyxxQkFBcUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztvQkFDL0MsWUFBWSxHQUFHLFFBQVEsQ0FBQyxPQUFPLEVBQUUsVUFBVSxDQUFDLENBQUM7aUJBQzlDO2dCQUVELHdFQUF3RTtnQkFDeEUscURBQXFEO2dCQUNyRCwrREFBK0Q7Z0JBQy9ELElBQUksWUFBWSxJQUFJLElBQUksRUFBRTtvQkFDeEIsWUFBWSxHQUFHLGVBQWUsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUM7aUJBQy9DO2dCQUVELFFBQVEsQ0FBQyxNQUFNLEVBQUUsSUFBSSxFQUFFLFlBQVksRUFBRSxRQUFRLEVBQUUsVUFBVSxDQUFDLENBQUM7Z0JBQzNELFFBQVEsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO2FBQzdCO1NBQ0Y7UUFFRCxlQUFlLENBQUMsT0FBTyxFQUFFLEtBQUssQ0FBQyxDQUFDO0tBQ2pDO0FBQ0gsQ0FBQztBQUVEOzs7Ozs7Ozs7OztHQVdHO0FBQ0gsa0JBQ0ksTUFBVyxFQUFFLElBQVksRUFBRSxLQUFvQixFQUFFLFFBQW1CLEVBQ3BFLFVBQWlDO0lBQ25DLElBQUksVUFBVSxFQUFFO1FBQ2QsVUFBVSxDQUFDLElBQUksQ0FBQyxHQUFHLEtBQUssQ0FBQztLQUMxQjtTQUFNLElBQUksS0FBSyxJQUFJLElBQUksRUFBRTtRQUN4QixTQUFTLElBQUksU0FBUyxDQUFDLG1CQUFtQixFQUFFLENBQUM7UUFDN0Msb0JBQW9CLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztZQUM1QixRQUFRLENBQUMsV0FBVyxDQUFDLE1BQU0sRUFBRSxJQUFJLEVBQUUsbUJBQW1CLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztZQUNsRSxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxDQUFDO0tBQzFDO1NBQU07UUFDTCxTQUFTLElBQUksU0FBUyxDQUFDLGdCQUFnQixFQUFFLENBQUM7UUFDMUMsb0JBQW9CLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztZQUM1QixRQUFRLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLG1CQUFtQixDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7WUFDdEUsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDLFdBQVcsQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7S0FDOUM7QUFDSCxDQUFDO0FBRUQsa0JBQWtCLE9BQXVCLEVBQUUsS0FBYSxFQUFFLFVBQW1CO0lBQzNFLElBQU0sYUFBYSxHQUNmLEtBQUsscUNBQTBDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxzQkFBMkIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUM7SUFDakcsSUFBSSxVQUFVLEVBQUU7UUFDYixPQUFPLENBQUMsYUFBYSxDQUFZLGlCQUFzQixDQUFDO0tBQzFEO1NBQU07UUFDSixPQUFPLENBQUMsYUFBYSxDQUFZLElBQUksY0FBbUIsQ0FBQztLQUMzRDtBQUNILENBQUM7QUFFRCxpQkFBaUIsT0FBdUIsRUFBRSxLQUFhO0lBQ3JELElBQU0sYUFBYSxHQUNmLEtBQUsscUNBQTBDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxzQkFBMkIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUM7SUFDakcsT0FBTyxDQUFFLE9BQU8sQ0FBQyxhQUFhLENBQVksZ0JBQXFCLENBQUMsaUJBQXNCLENBQUM7QUFDekYsQ0FBQztBQUVELGtCQUFrQixVQUFrQixFQUFFLFdBQW1CLEVBQUUsWUFBb0I7SUFDN0UsT0FBTyxDQUFDLFVBQVUsZ0JBQXFCLENBQUMsR0FBRyxDQUFDLFdBQVcsd0JBQTZCLENBQUM7UUFDakYsQ0FBQyxZQUFZLElBQUksQ0FBQyw0Q0FBcUQsQ0FBQyxDQUFDLENBQUM7QUFDaEYsQ0FBQztBQUVELHlCQUF5QixPQUF1QixFQUFFLElBQVk7SUFDNUQsSUFBTSxLQUFLLEdBQUcsZUFBZSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3BDLE9BQU8sT0FBTywrQkFBb0MsQ0FBQyxLQUFLLENBQWtCLENBQUM7QUFDN0UsQ0FBQztBQUVELHlCQUF5QixJQUFZO0lBQ25DLE9BQU8sQ0FBQyxJQUFJLHdCQUE2QixDQUFDLHNCQUF1QixDQUFDO0FBQ3BFLENBQUM7QUFFRCwrQkFBK0IsSUFBWTtJQUN6QyxJQUFNLEtBQUssR0FDUCxDQUFDLElBQUksSUFBSSxDQUFDLDRDQUFxRCxDQUFDLENBQUMsc0JBQXVCLENBQUM7SUFDN0YsT0FBTyxLQUFLLHFDQUEwQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3RFLENBQUM7QUFFRCw0QkFBNEIsT0FBdUI7SUFDakQsT0FBTyxxQkFBcUIsQ0FBQyxPQUFPLDRCQUFpQyxDQUFXLENBQUM7QUFDbkYsQ0FBQztBQUVELGlCQUFpQixPQUF1QixFQUFFLEtBQWEsRUFBRSxJQUFZO0lBQ25FLE9BQU8sQ0FBQyxLQUFLLHlCQUE4QixDQUFDLEdBQUcsSUFBSSxDQUFDO0FBQ3RELENBQUM7QUFFRCxrQkFBa0IsT0FBdUIsRUFBRSxLQUFhLEVBQUUsS0FBb0I7SUFDNUUsT0FBTyxDQUFDLEtBQUssc0JBQTJCLENBQUMsR0FBRyxLQUFLLENBQUM7QUFDcEQsQ0FBQztBQUVELGlCQUFpQixPQUF1QixFQUFFLEtBQWEsRUFBRSxJQUFZO0lBQ25FLElBQU0sYUFBYSxHQUNmLEtBQUssK0JBQW9DLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLHNCQUEyQixDQUFDLENBQUM7SUFDM0YsT0FBTyxDQUFDLGFBQWEsQ0FBQyxHQUFHLElBQUksQ0FBQztBQUNoQyxDQUFDO0FBRUQscUJBQXFCLE9BQXVCLEVBQUUsS0FBYTtJQUN6RCxJQUFNLGFBQWEsR0FDZixLQUFLLCtCQUFvQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxzQkFBMkIsQ0FBQyxDQUFDO0lBQzNGLE9BQU8sT0FBTyxDQUFDLGFBQWEsQ0FBVyxDQUFDO0FBQzFDLENBQUM7QUFFRCxrQkFBa0IsT0FBdUIsRUFBRSxLQUFhO0lBQ3RELE9BQU8sT0FBTyxDQUFDLEtBQUssc0JBQTJCLENBQWtCLENBQUM7QUFDcEUsQ0FBQztBQUVELGlCQUFpQixPQUF1QixFQUFFLEtBQWE7SUFDckQsT0FBTyxPQUFPLENBQUMsS0FBSyx5QkFBOEIsQ0FBVyxDQUFDO0FBQ2hFLENBQUM7QUFFRCxNQUFNLHlCQUF5QixPQUF1QjtJQUNwRCxPQUFPLE9BQU8sQ0FBQyxPQUFPLDZCQUFrQyxDQUFDO0FBQzNELENBQUM7QUFFRCxNQUFNLDBCQUEwQixPQUF1QixFQUFFLFVBQW1CO0lBQzFFLFFBQVEsQ0FBQyxPQUFPLDhCQUFtQyxVQUFVLENBQUMsQ0FBQztBQUNqRSxDQUFDO0FBRUQsaUNBQ0ksT0FBdUIsRUFBRSxJQUFZLEVBQUUsVUFBbUI7SUFDNUQsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLFVBQVUsSUFBSSxDQUFDLENBQUMseUJBQThCLEVBQUUsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxNQUFNLEVBQzNFLENBQUMsZ0JBQXFCLEVBQUU7UUFDM0IsSUFBTSxRQUFRLEdBQUcsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzVCLElBQUksUUFBUSxJQUFJLElBQUksRUFBRTtZQUNwQixPQUFPLENBQUMseUJBQThCLENBQUM7U0FDeEM7S0FDRjtJQUNELE9BQU8sQ0FBQyxDQUFDLENBQUM7QUFDWixDQUFDO0FBRUQsaUNBQWlDLE9BQXVCLEVBQUUsTUFBYyxFQUFFLE1BQWM7SUFDdEYsSUFBTSxRQUFRLEdBQUcsUUFBUSxDQUFDLE9BQU8sRUFBRSxNQUFNLENBQUMsQ0FBQztJQUMzQyxJQUFNLE9BQU8sR0FBRyxPQUFPLENBQUMsT0FBTyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0lBQ3pDLElBQU0sT0FBTyxHQUFHLFdBQVcsQ0FBQyxPQUFPLEVBQUUsTUFBTSxDQUFDLENBQUM7SUFFN0MsSUFBSSxLQUFLLEdBQUcsT0FBTyxDQUFDO0lBQ3BCLElBQUksS0FBSyxHQUFHLFdBQVcsQ0FBQyxPQUFPLEVBQUUsTUFBTSxDQUFDLENBQUM7SUFFekMsSUFBTSxZQUFZLEdBQUcscUJBQXFCLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDbEQsSUFBSSxZQUFZLElBQUksQ0FBQyxFQUFFO1FBQ3JCLElBQU0sS0FBSyxHQUFHLFdBQVcsQ0FBQyxPQUFPLEVBQUUsWUFBWSxDQUFDLENBQUM7UUFDakQsSUFBTSxRQUFRLEdBQUcsZUFBZSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3hDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsWUFBWSxFQUFFLFFBQVEsQ0FBQyxLQUFLLEVBQUUsUUFBUSxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUM7S0FDbkU7SUFFRCxJQUFNLFlBQVksR0FBRyxxQkFBcUIsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUNsRCxJQUFJLFlBQVksSUFBSSxDQUFDLEVBQUU7UUFDckIsSUFBTSxLQUFLLEdBQUcsV0FBVyxDQUFDLE9BQU8sRUFBRSxZQUFZLENBQUMsQ0FBQztRQUNqRCxJQUFNLFFBQVEsR0FBRyxlQUFlLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDeEMsT0FBTyxDQUFDLE9BQU8sRUFBRSxZQUFZLEVBQUUsUUFBUSxDQUFDLEtBQUssRUFBRSxRQUFRLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQztLQUNuRTtJQUVELFFBQVEsQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLFFBQVEsQ0FBQyxPQUFPLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQztJQUNyRCxPQUFPLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxPQUFPLENBQUMsT0FBTyxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUM7SUFDbkQsT0FBTyxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsV0FBVyxDQUFDLE9BQU8sRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDO0lBRXZELFFBQVEsQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLFFBQVEsQ0FBQyxDQUFDO0lBQ3BDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0lBQ2xDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0FBQ3BDLENBQUM7QUFFRCxtQ0FBbUMsT0FBdUIsRUFBRSxrQkFBMEI7SUFDcEYsS0FBSyxJQUFJLENBQUMsR0FBRyxrQkFBa0IsRUFBRSxDQUFDLEdBQUcsT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDLGdCQUFxQixFQUFFO1FBQzNFLElBQU0sU0FBUyxHQUFHLFdBQVcsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDMUMsSUFBTSxXQUFXLEdBQUcscUJBQXFCLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDckQsSUFBSSxXQUFXLEdBQUcsQ0FBQyxFQUFFO1lBQ25CLElBQU0sVUFBVSxHQUFHLFdBQVcsQ0FBQyxPQUFPLEVBQUUsV0FBVyxDQUFDLENBQUM7WUFDckQsSUFBTSxxQkFBcUIsR0FBRyxlQUFlLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDMUQsSUFBTSxXQUFXLEdBQUcsUUFBUSxDQUN4QixPQUFPLENBQUMsT0FBTyxFQUFFLFdBQVcsQ0FBQyxDQUFDLENBQUMsZUFBb0IsQ0FBQyxhQUFrQixFQUN0RSxxQkFBcUIsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUM5QixPQUFPLENBQUMsT0FBTyxFQUFFLFdBQVcsRUFBRSxXQUFXLENBQUMsQ0FBQztTQUM1QztLQUNGO0FBQ0gsQ0FBQztBQUVELGdDQUNJLE9BQXVCLEVBQUUsS0FBYSxFQUFFLElBQVksRUFBRSxLQUFhO0lBQ3JFLElBQU0sT0FBTyxHQUFHLEtBQUssR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDO0lBRXZDLDZDQUE2QztJQUM3QyxPQUFPLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRSxDQUFDLGlCQUFzQixJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFFMUQsSUFBSSxPQUFPLEVBQUU7UUFDWCwrREFBK0Q7UUFDL0QsNERBQTREO1FBQzVELGtEQUFrRDtRQUNsRCx5QkFBeUIsQ0FBQyxPQUFPLEVBQUUsS0FBSyxlQUFvQixDQUFDLENBQUM7S0FDL0Q7QUFDSCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0luaXRpYWxTdHlsaW5nRmxhZ3N9IGZyb20gJy4vaW50ZXJmYWNlcy9kZWZpbml0aW9uJztcbmltcG9ydCB7TEVsZW1lbnROb2RlfSBmcm9tICcuL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge1JlbmRlcmVyMywgUmVuZGVyZXJTdHlsZUZsYWdzMywgaXNQcm9jZWR1cmFsUmVuZGVyZXJ9IGZyb20gJy4vaW50ZXJmYWNlcy9yZW5kZXJlcic7XG5cbi8qKlxuICogVGhlIHN0eWxpbmcgY29udGV4dCBhY3RzIGFzIGEgc3R5bGluZyBtYW5pZmVzdCAoc2hhcGVkIGFzIGFuIGFycmF5KSBmb3IgZGV0ZXJtaW5pbmcgd2hpY2hcbiAqIHN0eWxpbmcgcHJvcGVydGllcyBoYXZlIGJlZW4gYXNzaWduZWQgdmlhIHRoZSBwcm92aWRlZCBgdXBkYXRlU3R5bGVNYXBgIGFuZCBgdXBkYXRlU3R5bGVQcm9wYFxuICogZnVuY3Rpb25zLiBUaGVyZSBhcmUgYWxzbyB0d28gaW5pdGlhbGl6YXRpb24gZnVuY3Rpb25zIGBhbGxvY1N0eWxpbmdDb250ZXh0YCBhbmRcbiAqIGBjcmVhdGVTdHlsaW5nQ29udGV4dFRlbXBsYXRlYCB3aGljaCBhcmUgdXNlZCB0byBpbml0aWFsaXplIGFuZC9vciBjbG9uZSB0aGUgY29udGV4dC5cbiAqXG4gKiBUaGUgY29udGV4dCBpcyBhbiBhcnJheSB3aGVyZSB0aGUgZmlyc3QgdHdvIGNlbGxzIGFyZSB1c2VkIGZvciBzdGF0aWMgZGF0YSAoaW5pdGlhbCBzdHlsaW5nKVxuICogYW5kIGRpcnR5IGZsYWdzIC8gaW5kZXggb2Zmc2V0cykuIFRoZSByZW1haW5pbmcgc2V0IG9mIGNlbGxzIGlzIHVzZWQgZm9yIG11bHRpIChtYXApIGFuZCBzaW5nbGVcbiAqIChwcm9wKSBzdHlsZSB2YWx1ZXMuXG4gKlxuICogZWFjaCB2YWx1ZSBmcm9tIGhlcmUgb253YXJkcyBpcyBtYXBwZWQgYXMgc286XG4gKiBbaV0gPSBtdXRhdGlvbi90eXBlIGZsYWcgZm9yIHRoZSBzdHlsZSB2YWx1ZVxuICogW2kgKyAxXSA9IHByb3Agc3RyaW5nIChvciBudWxsIGluY2FzZSBpdCBoYXMgYmVlbiByZW1vdmVkKVxuICogW2kgKyAyXSA9IHZhbHVlIHN0cmluZyAob3IgbnVsbCBpbmNhc2UgaXQgaGFzIGJlZW4gcmVtb3ZlZClcbiAqXG4gKiBUaGVyZSBhcmUgdGhyZWUgdHlwZXMgb2Ygc3R5bGluZyB0eXBlcyBzdG9yZWQgaW4gdGhpcyBjb250ZXh0OlxuICogICBpbml0aWFsOiBhbnkgc3R5bGVzIHRoYXQgYXJlIHBhc3NlZCBpbiBvbmNlIHRoZSBjb250ZXh0IGlzIGNyZWF0ZWRcbiAqICAgICAgICAgICAgKHRoZXNlIGFyZSBzdG9yZWQgaW4gdGhlIGZpcnN0IGNlbGwgb2YgdGhlIGFycmF5IGFuZCB0aGUgZmlyc3RcbiAqICAgICAgICAgICAgIHZhbHVlIG9mIHRoaXMgYXJyYXkgaXMgYWx3YXlzIGBudWxsYCBldmVuIGlmIG5vIGluaXRpYWwgc3R5bGVzIGV4aXN0LlxuICogICAgICAgICAgICAgdGhlIGBudWxsYCB2YWx1ZSBpcyB0aGVyZSBzbyB0aGF0IGFueSBuZXcgc3R5bGVzIGhhdmUgYSBwYXJlbnQgdG8gcG9pbnRcbiAqICAgICAgICAgICAgIHRvLiBUaGlzIHdheSB3ZSBjYW4gYWx3YXlzIGFzc3VtZSB0aGF0IHRoZXJlIGlzIGEgcGFyZW50LilcbiAqXG4gKiAgIHNpbmdsZTogYW55IHN0eWxlcyB0aGF0IGFyZSB1cGRhdGVkIHVzaW5nIGB1cGRhdGVTdHlsZVByb3BgIChmaXhlZCBzZXQpXG4gKlxuICogICBtdWx0aTogYW55IHN0eWxlcyB0aGF0IGFyZSB1cGRhdGVkIHVzaW5nIGB1cGRhdGVTdHlsZU1hcGAgKGR5bmFtaWMgc2V0KVxuICpcbiAqIE5vdGUgdGhhdCBjb250ZXh0IGlzIG9ubHkgdXNlZCB0byBjb2xsZWN0IHN0eWxlIGluZm9ybWF0aW9uLiBPbmx5IHdoZW4gYHJlbmRlclN0eWxlc2BcbiAqIGlzIGNhbGxlZCBpcyB3aGVuIHRoZSBzdHlsaW5nIHBheWxvYWQgd2lsbCBiZSByZW5kZXJlZCAob3IgYnVpbHQgYXMgYSBrZXkvdmFsdWUgbWFwKS5cbiAqXG4gKiBXaGVuIHRoZSBjb250ZXh0IGlzIGNyZWF0ZWQsIGRlcGVuZGluZyBvbiB3aGF0IGluaXRpYWwgc3R5bGVzIGFyZSBwYXNzZWQgaW4sIHRoZSBjb250ZXh0IGl0c2VsZlxuICogd2lsbCBiZSBwcmUtZmlsbGVkIHdpdGggc2xvdHMgYmFzZWQgb24gdGhlIGluaXRpYWwgc3R5bGUgcHJvcGVydGllcy4gU2F5IGZvciBleGFtcGxlIHdlIGhhdmUgYVxuICogc2VyaWVzIG9mIGluaXRpYWwgc3R5bGVzIHRoYXQgbG9vayBsaWtlIHNvOlxuICpcbiAqICAgc3R5bGU9XCJ3aWR0aDoxMDBweDsgaGVpZ2h0OjIwMHB4O1wiXG4gKlxuICogVGhlbiB0aGUgaW5pdGlhbCBzdGF0ZSBvZiB0aGUgY29udGV4dCAob25jZSBpbml0aWFsaXplZCkgd2lsbCBsb29rIGxpa2Ugc286XG4gKlxuICogYGBgXG4gKiBjb250ZXh0ID0gW1xuICogICBbbnVsbCwgJzEwMHB4JywgJzIwMHB4J10sICAvLyBwcm9wZXJ0eSBuYW1lcyBhcmUgbm90IG5lZWRlZCBzaW5jZSB0aGV5IGhhdmUgYWxyZWFkeSBiZWVuXG4gKiB3cml0dGVuIHRvIERPTS5cbiAqXG4gKiAgIGNvbmZpZ01hc3RlclZhbCxcbiAqXG4gKiAgIC8vIDJcbiAqICAgJ3dpZHRoJyxcbiAqICAgcG9pbnRlcnMoMSwgOCk7ICAvLyBQb2ludCB0byBzdGF0aWMgYHdpZHRoYDogYDEwMHB4YCBhbmQgbXVsdGkgYHdpZHRoYC5cbiAqICAgbnVsbCxcbiAqXG4gKiAgIC8vIDVcbiAqICAgJ2hlaWdodCcsXG4gKiAgIHBvaW50ZXJzKDIsIDExKTsgLy8gUG9pbnQgdG8gc3RhdGljIGBoZWlnaHRgOiBgMjAwcHhgIGFuZCBtdWx0aSBgaGVpZ2h0YC5cbiAqICAgbnVsbCxcbiAqXG4gKiAgIC8vIDhcbiAqICAgJ3dpZHRoJyxcbiAqICAgcG9pbnRlcnMoMSwgMik7ICAvLyBQb2ludCB0byBzdGF0aWMgYHdpZHRoYDogYDEwMHB4YCBhbmQgc2luZ2xlIGB3aWR0aGAuXG4gKiAgIG51bGwsXG4gKlxuICogICAvLyAxMVxuICogICAnaGVpZ2h0JyxcbiAqICAgcG9pbnRlcnMoMiwgNSk7ICAvLyBQb2ludCB0byBzdGF0aWMgYGhlaWdodGA6IGAyMDBweGAgYW5kIHNpbmdsZSBgaGVpZ2h0YC5cbiAqICAgbnVsbCxcbiAqIF1cbiAqXG4gKiBmdW5jdGlvbiBwb2ludGVycyhzdGF0aWNJbmRleDogbnVtYmVyLCBkeW5hbWljSW5kZXg6IG51bWJlcikge1xuICogICAvLyBjb21iaW5lIHRoZSB0d28gaW5kaWNlcyBpbnRvIGEgc2luZ2xlIHdvcmQuXG4gKiAgIHJldHVybiAoc3RhdGljSW5kZXggPDwgU3R5bGluZ0ZsYWdzLkJpdENvdW50U2l6ZSkgfFxuICogICAgIChkeW5hbWljSW5kZXggPDwgKFN0eWxpbmdJbmRleC5CaXRDb3VudFNpemUgKyBTdHlsaW5nRmxhZ3MuQml0Q291bnRTaXplKSk7XG4gKiB9XG4gKiBgYGBcbiAqXG4gKiBUaGUgdmFsdWVzIGFyZSBkdXBsaWNhdGVkIHNvIHRoYXQgc3BhY2UgaXMgc2V0IGFzaWRlIGZvciBib3RoIG11bHRpIChbc3R5bGVdKVxuICogYW5kIHNpbmdsZSAoW3N0eWxlLnByb3BdKSB2YWx1ZXMuIFRoZSByZXNwZWN0aXZlIGNvbmZpZyB2YWx1ZXMgKGNvbmZpZ1ZhbEEsIGNvbmZpZ1ZhbEIsIGV0Yy4uLilcbiAqIGFyZSBhIGNvbWJpbmF0aW9uIG9mIHRoZSBTdHlsaW5nRmxhZ3Mgd2l0aCB0d28gaW5kZXggdmFsdWVzOiB0aGUgYGluaXRpYWxJbmRleGAgKHdoaWNoIHBvaW50cyB0b1xuICogdGhlIGluZGV4IGxvY2F0aW9uIG9mIHRoZSBzdHlsZSB2YWx1ZSBpbiB0aGUgaW5pdGlhbCBzdHlsZXMgYXJyYXkgaW4gc2xvdCAwKSBhbmQgdGhlXG4gKiBgZHluYW1pY0luZGV4YCAod2hpY2ggcG9pbnRzIHRvIHRoZSBtYXRjaGluZyBzaW5nbGUvbXVsdGkgaW5kZXggcG9zaXRpb24gaW4gdGhlIGNvbnRleHQgYXJyYXlcbiAqIGZvciB0aGUgc2FtZSBwcm9wKS5cbiAqXG4gKiBUaGlzIG1lYW5zIHRoYXQgZXZlcnkgdGltZSBgdXBkYXRlU3R5bGVQcm9wYCBpcyBjYWxsZWQgaXQgbXVzdCBiZSBjYWxsZWQgdXNpbmcgYW4gaW5kZXggdmFsdWVcbiAqIChub3QgYSBwcm9wZXJ0eSBzdHJpbmcpIHdoaWNoIHJlZmVyZW5jZXMgdGhlIGluZGV4IHZhbHVlIG9mIHRoZSBpbml0aWFsIHN0eWxlIHdoZW4gdGhlIGNvbnRleHRcbiAqIHdhcyBjcmVhdGVkLiBUaGlzIGFsc28gbWVhbnMgdGhhdCBgdXBkYXRlU3R5bGVQcm9wYCBjYW5ub3QgYmUgY2FsbGVkIHdpdGggYSBuZXcgcHJvcGVydHlcbiAqIChvbmx5IGB1cGRhdGVTdHlsZU1hcGAgY2FuIGluY2x1ZGUgbmV3IENTUyBwcm9wZXJ0aWVzIHRoYXQgd2lsbCBiZSBhZGRlZCB0byB0aGUgY29udGV4dCkuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgU3R5bGluZ0NvbnRleHQgZXh0ZW5kcyBBcnJheTxJbml0aWFsU3R5bGVzfG51bWJlcnxzdHJpbmd8bnVsbD4ge1xuICAvKipcbiAgICogTG9jYXRpb24gb2YgaW5pdGlhbCBkYXRhIHNoYXJlZCBieSBhbGwgaW5zdGFuY2VzIG9mIHRoaXMgc3R5bGUuXG4gICAqL1xuICBbMF06IEluaXRpYWxTdHlsZXM7XG5cbiAgLyoqXG4gICAqIEEgbnVtZXJpYyB2YWx1ZSByZXByZXNlbnRpbmcgdGhlIGNvbmZpZ3VyYXRpb24gc3RhdHVzICh3aGV0aGVyIHRoZSBjb250ZXh0IGlzIGRpcnR5IG9yIG5vdClcbiAgICogbWl4ZWQgdG9nZXRoZXIgKHVzaW5nIGJpdCBzaGlmdGluZykgd2l0aCBhIGluZGV4IHZhbHVlIHdoaWNoIHRlbGxzIHRoZSBzdGFydGluZyBpbmRleCB2YWx1ZVxuICAgKiBvZiB3aGVyZSB0aGUgbXVsdGkgc3R5bGUgZW50cmllcyBiZWdpbi5cbiAgICovXG4gIFsxXTogbnVtYmVyO1xufVxuXG4vKipcbiAqIFRoZSBpbml0aWFsIHN0eWxlcyBpcyBwb3B1bGF0ZWQgd2hldGhlciBvciBub3QgdGhlcmUgYXJlIGFueSBpbml0aWFsIHN0eWxlcyBwYXNzZWQgaW50b1xuICogdGhlIGNvbnRleHQgZHVyaW5nIGFsbG9jYXRpb24uIFRoZSAwdGggdmFsdWUgbXVzdCBiZSBudWxsIHNvIHRoYXQgaW5kZXggdmFsdWVzIG9mIGAwYCB3aXRoaW5cbiAqIHRoZSBjb250ZXh0IGZsYWdzIGNhbiBhbHdheXMgcG9pbnQgdG8gYSBudWxsIHZhbHVlIHNhZmVseSB3aGVuIG5vdGhpbmcgaXMgc2V0LlxuICpcbiAqIEFsbCBvdGhlciBlbnRyaWVzIGluIHRoaXMgYXJyYXkgYXJlIG9mIGBzdHJpbmdgIHZhbHVlIGFuZCBjb3JyZXNwb25kIHRvIHRoZSB2YWx1ZXMgdGhhdFxuICogd2VyZSBleHRyYWN0ZWQgZnJvbSB0aGUgYHN0eWxlPVwiXCJgIGF0dHJpYnV0ZSBpbiB0aGUgSFRNTCBjb2RlIGZvciB0aGUgcHJvdmlkZWQgdGVtcGxhdGUuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgSW5pdGlhbFN0eWxlcyBleHRlbmRzIEFycmF5PHN0cmluZ3xudWxsPiB7IFswXTogbnVsbDsgfVxuXG4vKipcbiAqIFVzZWQgdG8gc2V0IHRoZSBjb250ZXh0IHRvIGJlIGRpcnR5IG9yIG5vdCBib3RoIG9uIHRoZSBtYXN0ZXIgZmxhZyAocG9zaXRpb24gMSlcbiAqIG9yIGZvciBlYWNoIHNpbmdsZS9tdWx0aSBwcm9wZXJ0eSB0aGF0IGV4aXN0cyBpbiB0aGUgY29udGV4dC5cbiAqL1xuZXhwb3J0IGNvbnN0IGVudW0gU3R5bGluZ0ZsYWdzIHtcbiAgLy8gSW1wbGllcyBubyBjb25maWd1cmF0aW9uc1xuICBOb25lID0gMGIwLFxuICAvLyBXaGV0aGVyIG9yIG5vdCB0aGUgZW50cnkgb3IgY29udGV4dCBpdHNlbGYgaXMgZGlydHlcbiAgRGlydHkgPSAwYjEsXG4gIC8vIFRoZSBtYXggYW1vdW50IG9mIGJpdHMgdXNlZCB0byByZXByZXNlbnQgdGhlc2UgY29uZmlndXJhdGlvbiB2YWx1ZXNcbiAgQml0Q291bnRTaXplID0gMSxcbn1cblxuLyoqIFVzZWQgYXMgbnVtZXJpYyBwb2ludGVyIHZhbHVlcyB0byBkZXRlcm1pbmUgd2hhdCBjZWxscyB0byB1cGRhdGUgaW4gdGhlIGBTdHlsaW5nQ29udGV4dGAgKi9cbmV4cG9ydCBjb25zdCBlbnVtIFN0eWxpbmdJbmRleCB7XG4gIC8vIFBvc2l0aW9uIG9mIHdoZXJlIHRoZSBpbml0aWFsIHN0eWxlcyBhcmUgc3RvcmVkIGluIHRoZSBzdHlsaW5nIGNvbnRleHRcbiAgSW5pdGlhbFN0eWxlc1Bvc2l0aW9uID0gMCxcbiAgLy8gSW5kZXggb2YgbG9jYXRpb24gd2hlcmUgdGhlIHN0YXJ0IG9mIHNpbmdsZSBwcm9wZXJ0aWVzIGFyZSBzdG9yZWQuIChgdXBkYXRlU3R5bGVQcm9wYClcbiAgTWFzdGVyRmxhZ1Bvc2l0aW9uID0gMSxcbiAgLy8gTG9jYXRpb24gb2Ygc2luZ2xlIChwcm9wKSB2YWx1ZSBlbnRyaWVzIGFyZSBzdG9yZWQgd2l0aGluIHRoZSBjb250ZXh0XG4gIFNpbmdsZVN0eWxlc1N0YXJ0UG9zaXRpb24gPSAyLFxuICAvLyBNdWx0aSBhbmQgc2luZ2xlIGVudHJpZXMgYXJlIHN0b3JlZCBpbiBgU3R5bGluZ0NvbnRleHRgIGFzOiBGbGFnOyBQcm9wZXJ0eU5hbWU7ICBQcm9wZXJ0eVZhbHVlXG4gIEZsYWdzT2Zmc2V0ID0gMCxcbiAgUHJvcGVydHlPZmZzZXQgPSAxLFxuICBWYWx1ZU9mZnNldCA9IDIsXG4gIC8vIFNpemUgb2YgZWFjaCBtdWx0aSBvciBzaW5nbGUgZW50cnkgKGZsYWcgKyBwcm9wICsgdmFsdWUpXG4gIFNpemUgPSAzLFxuICAvLyBFYWNoIGZsYWcgaGFzIGEgYmluYXJ5IGRpZ2l0IGxlbmd0aCBvZiB0aGlzIHZhbHVlXG4gIEJpdENvdW50U2l6ZSA9IDE1LCAgLy8gKDMyIC0gMSkgLyAyID0gfjE1XG4gIC8vIFRoZSBiaW5hcnkgZGlnaXQgdmFsdWUgYXMgYSBtYXNrXG4gIEJpdE1hc2sgPSAwYjExMTExMTExMTExMTExMSAgLy8gMTUgYml0c1xufVxuXG4vKipcbiAqIFVzZWQgY2xvbmUgYSBjb3B5IG9mIGEgcHJlLWNvbXB1dGVkIHRlbXBsYXRlIG9mIGEgc3R5bGluZyBjb250ZXh0LlxuICpcbiAqIEEgcHJlLWNvbXB1dGVkIHRlbXBsYXRlIGlzIGRlc2lnbmVkIHRvIGJlIGNvbXB1dGVkIG9uY2UgZm9yIGEgZ2l2ZW4gZWxlbWVudFxuICogKGluc3RydWN0aW9ucy50cyBoYXMgbG9naWMgZm9yIGNhY2hpbmcgdGhpcykuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhbGxvY1N0eWxpbmdDb250ZXh0KHRlbXBsYXRlU3R5bGVDb250ZXh0OiBTdHlsaW5nQ29udGV4dCk6IFN0eWxpbmdDb250ZXh0IHtcbiAgLy8gZWFjaCBpbnN0YW5jZSBnZXRzIGEgY29weVxuICByZXR1cm4gdGVtcGxhdGVTdHlsZUNvbnRleHQuc2xpY2UoKSBhcyBhbnkgYXMgU3R5bGluZ0NvbnRleHQ7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIHN0eWxpbmcgY29udGV4dCB0ZW1wbGF0ZSB3aGVyZSBzdHlsaW5nIGluZm9ybWF0aW9uIGlzIHN0b3JlZC5cbiAqIEFueSBzdHlsZXMgdGhhdCBhcmUgbGF0ZXIgcmVmZXJlbmNlZCB1c2luZyBgdXBkYXRlU3R5bGVQcm9wYCBtdXN0IGJlXG4gKiBwYXNzZWQgaW4gd2l0aGluIHRoaXMgZnVuY3Rpb24uIEluaXRpYWwgdmFsdWVzIGZvciB0aG9zZSBzdHlsZXMgYXJlIHRvXG4gKiBiZSBkZWNsYXJlZCBhZnRlciBhbGwgaW5pdGlhbCBzdHlsZSBwcm9wZXJ0aWVzIGFyZSBkZWNsYXJlZCAodGhpcyBjaGFuZ2UgaW5cbiAqIG1vZGUgYmV0d2VlbiBkZWNsYXJhdGlvbnMgYW5kIGluaXRpYWwgc3R5bGVzIGlzIG1hZGUgcG9zc2libGUgdXNpbmcgYSBzcGVjaWFsXG4gKiBlbnVtIHZhbHVlIGZvdW5kIGluIGBkZWZpbml0aW9uLnRzYCkuXG4gKlxuICogQHBhcmFtIGluaXRpYWxTdHlsZURlY2xhcmF0aW9ucyBhIGxpc3Qgb2Ygc3R5bGUgZGVjbGFyYXRpb25zIGFuZCBpbml0aWFsIHN0eWxlIHZhbHVlc1xuICogICAgdGhhdCBhcmUgdXNlZCBsYXRlciB3aXRoaW4gdGhlIHN0eWxpbmcgY29udGV4dC5cbiAqXG4gKiAgICAtPiBbJ3dpZHRoJywgJ2hlaWdodCcsIFNQRUNJQUxfRU5VTV9WQUwsICd3aWR0aCcsICcxMDBweCddXG4gKiAgICAgICBUaGlzIGltcGxpZXMgdGhhdCBgd2lkdGhgIGFuZCBgaGVpZ2h0YCB3aWxsIGJlIGxhdGVyIHN0eWxlZCBhbmQgdGhhdCB0aGUgYHdpZHRoYFxuICogICAgICAgcHJvcGVydHkgaGFzIGFuIGluaXRpYWwgdmFsdWUgb2YgYDEwMHB4YC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVN0eWxpbmdDb250ZXh0VGVtcGxhdGUoXG4gICAgaW5pdGlhbFN0eWxlRGVjbGFyYXRpb25zPzogKHN0cmluZyB8IEluaXRpYWxTdHlsaW5nRmxhZ3MpW10gfCBudWxsKTogU3R5bGluZ0NvbnRleHQge1xuICBjb25zdCBpbml0aWFsU3R5bGVzOiBJbml0aWFsU3R5bGVzID0gW251bGxdO1xuICBjb25zdCBjb250ZXh0OiBTdHlsaW5nQ29udGV4dCA9IFtpbml0aWFsU3R5bGVzLCAwXTtcblxuICBjb25zdCBpbmRleExvb2t1cDoge1trZXk6IHN0cmluZ106IG51bWJlcn0gPSB7fTtcbiAgaWYgKGluaXRpYWxTdHlsZURlY2xhcmF0aW9ucykge1xuICAgIGxldCBoYXNQYXNzZWREZWNsYXJhdGlvbnMgPSBmYWxzZTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGluaXRpYWxTdHlsZURlY2xhcmF0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgdiA9IGluaXRpYWxTdHlsZURlY2xhcmF0aW9uc1tpXSBhcyBzdHJpbmcgfCBJbml0aWFsU3R5bGluZ0ZsYWdzO1xuXG4gICAgICAvLyB0aGlzIGZsYWcgdmFsdWUgbWFya3Mgd2hlcmUgdGhlIGRlY2xhcmF0aW9ucyBlbmQgdGhlIGluaXRpYWwgdmFsdWVzIGJlZ2luXG4gICAgICBpZiAodiA9PT0gSW5pdGlhbFN0eWxpbmdGbGFncy5JTklUSUFMX1NUWUxFUykge1xuICAgICAgICBoYXNQYXNzZWREZWNsYXJhdGlvbnMgPSB0cnVlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3QgcHJvcCA9IHYgYXMgc3RyaW5nO1xuICAgICAgICBpZiAoaGFzUGFzc2VkRGVjbGFyYXRpb25zKSB7XG4gICAgICAgICAgY29uc3QgdmFsdWUgPSBpbml0aWFsU3R5bGVEZWNsYXJhdGlvbnNbKytpXSBhcyBzdHJpbmc7XG4gICAgICAgICAgaW5pdGlhbFN0eWxlcy5wdXNoKHZhbHVlKTtcbiAgICAgICAgICBpbmRleExvb2t1cFtwcm9wXSA9IGluaXRpYWxTdHlsZXMubGVuZ3RoIC0gMTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBpdCdzIHNhZmUgdG8gdXNlIGAwYCBzaW5jZSB0aGUgZGVmYXVsdCBpbml0aWFsIHZhbHVlIGZvclxuICAgICAgICAgIC8vIGVhY2ggcHJvcGVydHkgd2lsbCBhbHdheXMgYmUgbnVsbCAod2hpY2ggaXMgYXQgcG9zaXRpb24gMClcbiAgICAgICAgICBpbmRleExvb2t1cFtwcm9wXSA9IDA7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBjb25zdCBhbGxQcm9wcyA9IE9iamVjdC5rZXlzKGluZGV4TG9va3VwKTtcbiAgY29uc3QgdG90YWxQcm9wcyA9IGFsbFByb3BzLmxlbmd0aDtcblxuICAvLyAqMiBiZWNhdXNlIHdlIGFyZSBmaWxsaW5nIGZvciBib3RoIHNpbmdsZSBhbmQgbXVsdGkgc3R5bGUgc3BhY2VzXG4gIGNvbnN0IG1heExlbmd0aCA9IHRvdGFsUHJvcHMgKiBTdHlsaW5nSW5kZXguU2l6ZSAqIDIgKyBTdHlsaW5nSW5kZXguU2luZ2xlU3R5bGVzU3RhcnRQb3NpdGlvbjtcblxuICAvLyB3ZSBuZWVkIHRvIGZpbGwgdGhlIGFycmF5IGZyb20gdGhlIHN0YXJ0IHNvIHRoYXQgd2UgY2FuIGFjY2Vzc1xuICAvLyBib3RoIHRoZSBtdWx0aSBhbmQgdGhlIHNpbmdsZSBhcnJheSBwb3NpdGlvbnMgaW4gdGhlIHNhbWUgbG9vcCBibG9ja1xuICBmb3IgKGxldCBpID0gU3R5bGluZ0luZGV4LlNpbmdsZVN0eWxlc1N0YXJ0UG9zaXRpb247IGkgPCBtYXhMZW5ndGg7IGkrKykge1xuICAgIGNvbnRleHQucHVzaChudWxsKTtcbiAgfVxuXG4gIGNvbnN0IHNpbmdsZVN0YXJ0ID0gU3R5bGluZ0luZGV4LlNpbmdsZVN0eWxlc1N0YXJ0UG9zaXRpb247XG4gIGNvbnN0IG11bHRpU3RhcnQgPSB0b3RhbFByb3BzICogU3R5bGluZ0luZGV4LlNpemUgKyBTdHlsaW5nSW5kZXguU2luZ2xlU3R5bGVzU3RhcnRQb3NpdGlvbjtcblxuICAvLyBmaWxsIHNpbmdsZSBhbmQgbXVsdGktbGV2ZWwgc3R5bGVzXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgYWxsUHJvcHMubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBwcm9wID0gYWxsUHJvcHNbaV07XG5cbiAgICBjb25zdCBpbmRleEZvckluaXRpYWwgPSBpbmRleExvb2t1cFtwcm9wXTtcbiAgICBjb25zdCBpbmRleEZvck11bHRpID0gaSAqIFN0eWxpbmdJbmRleC5TaXplICsgbXVsdGlTdGFydDtcbiAgICBjb25zdCBpbmRleEZvclNpbmdsZSA9IGkgKiBTdHlsaW5nSW5kZXguU2l6ZSArIHNpbmdsZVN0YXJ0O1xuXG4gICAgc2V0RmxhZyhjb250ZXh0LCBpbmRleEZvclNpbmdsZSwgcG9pbnRlcnMoU3R5bGluZ0ZsYWdzLk5vbmUsIGluZGV4Rm9ySW5pdGlhbCwgaW5kZXhGb3JNdWx0aSkpO1xuICAgIHNldFByb3AoY29udGV4dCwgaW5kZXhGb3JTaW5nbGUsIHByb3ApO1xuICAgIHNldFZhbHVlKGNvbnRleHQsIGluZGV4Rm9yU2luZ2xlLCBudWxsKTtcblxuICAgIHNldEZsYWcoY29udGV4dCwgaW5kZXhGb3JNdWx0aSwgcG9pbnRlcnMoU3R5bGluZ0ZsYWdzLkRpcnR5LCBpbmRleEZvckluaXRpYWwsIGluZGV4Rm9yU2luZ2xlKSk7XG4gICAgc2V0UHJvcChjb250ZXh0LCBpbmRleEZvck11bHRpLCBwcm9wKTtcbiAgICBzZXRWYWx1ZShjb250ZXh0LCBpbmRleEZvck11bHRpLCBudWxsKTtcbiAgfVxuXG4gIC8vIHRoZXJlIGlzIG5vIGluaXRpYWwgdmFsdWUgZmxhZyBmb3IgdGhlIG1hc3RlciBpbmRleCBzaW5jZSBpdCBkb2Vzbid0IHJlZmVyZW5jZSBhbiBpbml0aWFsIHN0eWxlXG4gIC8vIHZhbHVlXG4gIHNldEZsYWcoY29udGV4dCwgU3R5bGluZ0luZGV4Lk1hc3RlckZsYWdQb3NpdGlvbiwgcG9pbnRlcnMoMCwgMCwgbXVsdGlTdGFydCkpO1xuICBzZXRDb250ZXh0RGlydHkoY29udGV4dCwgaW5pdGlhbFN0eWxlcy5sZW5ndGggPiAxKTtcblxuICByZXR1cm4gY29udGV4dDtcbn1cblxuY29uc3QgRU1QVFlfQVJSOiBhbnlbXSA9IFtdO1xuLyoqXG4gKiBTZXRzIGFuZCByZXNvbHZlcyBhbGwgYG11bHRpYCBzdHlsZXMgb24gYW4gYFN0eWxpbmdDb250ZXh0YCBzbyB0aGF0IHRoZXkgY2FuIGJlXG4gKiBhcHBsaWVkIHRvIHRoZSBlbGVtZW50IG9uY2UgYHJlbmRlclN0eWxlc2AgaXMgY2FsbGVkLlxuICpcbiAqIEFsbCBtaXNzaW5nIHN0eWxlcyAoYW55IHZhbHVlcyB0aGF0IGFyZSBub3QgcHJvdmlkZWQgaW4gdGhlIG5ldyBgc3R5bGVzYCBwYXJhbSlcbiAqIHdpbGwgcmVzb2x2ZSB0byBgbnVsbGAgd2l0aGluIHRoZWlyIHJlc3BlY3RpdmUgcG9zaXRpb25zIGluIHRoZSBjb250ZXh0LlxuICpcbiAqIEBwYXJhbSBjb250ZXh0IFRoZSBzdHlsaW5nIGNvbnRleHQgdGhhdCB3aWxsIGJlIHVwZGF0ZWQgd2l0aCB0aGVcbiAqICAgIG5ld2x5IHByb3ZpZGVkIHN0eWxlIHZhbHVlcy5cbiAqIEBwYXJhbSBzdHlsZXMgVGhlIGtleS92YWx1ZSBtYXAgb2YgQ1NTIHN0eWxlcyB0aGF0IHdpbGwgYmUgdXNlZCBmb3IgdGhlIHVwZGF0ZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHVwZGF0ZVN0eWxlTWFwKGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBzdHlsZXM6IHtba2V5OiBzdHJpbmddOiBhbnl9IHwgbnVsbCk6IHZvaWQge1xuICBjb25zdCBwcm9wc1RvQXBwbHkgPSBzdHlsZXMgPyBPYmplY3Qua2V5cyhzdHlsZXMpIDogRU1QVFlfQVJSO1xuICBjb25zdCBtdWx0aVN0YXJ0SW5kZXggPSBnZXRNdWx0aVN0YXJ0SW5kZXgoY29udGV4dCk7XG5cbiAgbGV0IGRpcnR5ID0gZmFsc2U7XG4gIGxldCBjdHhJbmRleCA9IG11bHRpU3RhcnRJbmRleDtcbiAgbGV0IHByb3BJbmRleCA9IDA7XG5cbiAgLy8gdGhlIG1haW4gbG9vcCBoZXJlIHdpbGwgdHJ5IGFuZCBmaWd1cmUgb3V0IGhvdyB0aGUgc2hhcGUgb2YgdGhlIHByb3ZpZGVkXG4gIC8vIHN0eWxlcyBkaWZmZXIgd2l0aCByZXNwZWN0IHRvIHRoZSBjb250ZXh0LiBMYXRlciBpZiB0aGUgY29udGV4dC9zdHlsZXMgYXJlXG4gIC8vIG9mZi1iYWxhbmNlIHRoZW4gdGhleSB3aWxsIGJlIGRlYWx0IGluIGFub3RoZXIgbG9vcCBhZnRlciB0aGlzIG9uZVxuICB3aGlsZSAoY3R4SW5kZXggPCBjb250ZXh0Lmxlbmd0aCAmJiBwcm9wSW5kZXggPCBwcm9wc1RvQXBwbHkubGVuZ3RoKSB7XG4gICAgY29uc3QgZmxhZyA9IGdldFBvaW50ZXJzKGNvbnRleHQsIGN0eEluZGV4KTtcbiAgICBjb25zdCBwcm9wID0gZ2V0UHJvcChjb250ZXh0LCBjdHhJbmRleCk7XG4gICAgY29uc3QgdmFsdWUgPSBnZXRWYWx1ZShjb250ZXh0LCBjdHhJbmRleCk7XG5cbiAgICBjb25zdCBuZXdQcm9wID0gcHJvcHNUb0FwcGx5W3Byb3BJbmRleF07XG4gICAgY29uc3QgbmV3VmFsdWUgPSBzdHlsZXMgIVtuZXdQcm9wXTtcbiAgICBpZiAocHJvcCA9PT0gbmV3UHJvcCkge1xuICAgICAgaWYgKHZhbHVlICE9PSBuZXdWYWx1ZSkge1xuICAgICAgICBzZXRWYWx1ZShjb250ZXh0LCBjdHhJbmRleCwgbmV3VmFsdWUpO1xuICAgICAgICBjb25zdCBpbml0aWFsVmFsdWUgPSBnZXRJbml0aWFsVmFsdWUoY29udGV4dCwgZmxhZyk7XG5cbiAgICAgICAgLy8gdGhlcmUgaXMgbm8gcG9pbnQgaW4gc2V0dGluZyB0aGlzIHRvIGRpcnR5IGlmIHRoZSBwcmV2aW91c2x5XG4gICAgICAgIC8vIHJlbmRlcmVkIHZhbHVlIHdhcyBiZWluZyByZWZlcmVuY2VkIGJ5IHRoZSBpbml0aWFsIHN0eWxlIChvciBudWxsKVxuICAgICAgICBpZiAoaW5pdGlhbFZhbHVlICE9PSBuZXdWYWx1ZSkge1xuICAgICAgICAgIHNldERpcnR5KGNvbnRleHQsIGN0eEluZGV4LCB0cnVlKTtcbiAgICAgICAgICBkaXJ0eSA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgaW5kZXhPZkVudHJ5ID0gZmluZEVudHJ5UG9zaXRpb25CeVByb3AoY29udGV4dCwgbmV3UHJvcCwgY3R4SW5kZXgpO1xuICAgICAgaWYgKGluZGV4T2ZFbnRyeSA+IDApIHtcbiAgICAgICAgLy8gaXQgd2FzIGZvdW5kIGF0IGEgbGF0ZXIgcG9pbnQgLi4uIGp1c3Qgc3dhcCB0aGUgdmFsdWVzXG4gICAgICAgIHN3YXBNdWx0aUNvbnRleHRFbnRyaWVzKGNvbnRleHQsIGN0eEluZGV4LCBpbmRleE9mRW50cnkpO1xuICAgICAgICBpZiAodmFsdWUgIT09IG5ld1ZhbHVlKSB7XG4gICAgICAgICAgc2V0VmFsdWUoY29udGV4dCwgY3R4SW5kZXgsIG5ld1ZhbHVlKTtcbiAgICAgICAgICBkaXJ0eSA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIHdlIG9ubHkgY2FyZSB0byBkbyB0aGlzIGlmIHRoZSBpbnNlcnRpb24gaXMgaW4gdGhlIG1pZGRsZVxuICAgICAgICBjb25zdCBkb1NoaWZ0ID0gY3R4SW5kZXggPCBjb250ZXh0Lmxlbmd0aDtcbiAgICAgICAgaW5zZXJ0TmV3TXVsdGlQcm9wZXJ0eShjb250ZXh0LCBjdHhJbmRleCwgbmV3UHJvcCwgbmV3VmFsdWUpO1xuICAgICAgICBkaXJ0eSA9IHRydWU7XG4gICAgICB9XG4gICAgfVxuXG4gICAgY3R4SW5kZXggKz0gU3R5bGluZ0luZGV4LlNpemU7XG4gICAgcHJvcEluZGV4Kys7XG4gIH1cblxuICAvLyB0aGlzIG1lYW5zIHRoYXQgdGhlcmUgYXJlIGxlZnQtb3ZlciB2YWx1ZXMgaW4gdGhlIGNvbnRleHQgdGhhdFxuICAvLyB3ZXJlIG5vdCBpbmNsdWRlZCBpbiB0aGUgcHJvdmlkZWQgc3R5bGVzIGFuZCBpbiB0aGlzIGNhc2UgdGhlXG4gIC8vIGdvYWwgaXMgdG8gXCJyZW1vdmVcIiB0aGVtIGZyb20gdGhlIGNvbnRleHQgKGJ5IG51bGxpZnlpbmcpXG4gIHdoaWxlIChjdHhJbmRleCA8IGNvbnRleHQubGVuZ3RoKSB7XG4gICAgY29uc3QgdmFsdWUgPSBjb250ZXh0W2N0eEluZGV4ICsgU3R5bGluZ0luZGV4LlZhbHVlT2Zmc2V0XTtcbiAgICBpZiAodmFsdWUgIT09IG51bGwpIHtcbiAgICAgIHNldERpcnR5KGNvbnRleHQsIGN0eEluZGV4LCB0cnVlKTtcbiAgICAgIHNldFZhbHVlKGNvbnRleHQsIGN0eEluZGV4LCBudWxsKTtcbiAgICAgIGRpcnR5ID0gdHJ1ZTtcbiAgICB9XG4gICAgY3R4SW5kZXggKz0gU3R5bGluZ0luZGV4LlNpemU7XG4gIH1cblxuICAvLyB0aGlzIG1lYW5zIHRoYXQgdGhlcmUgYXJlIGxlZnQtb3ZlciBwcm9wZXJ0eSBpbiB0aGUgY29udGV4dCB0aGF0XG4gIC8vIHdlcmUgbm90IGRldGVjdGVkIGluIHRoZSBjb250ZXh0IGR1cmluZyB0aGUgbG9vcCBhYm92ZS4gSW4gdGhhdFxuICAvLyBjYXNlIHdlIHdhbnQgdG8gYWRkIHRoZSBuZXcgZW50cmllcyBpbnRvIHRoZSBsaXN0XG4gIHdoaWxlIChwcm9wSW5kZXggPCBwcm9wc1RvQXBwbHkubGVuZ3RoKSB7XG4gICAgY29uc3QgcHJvcCA9IHByb3BzVG9BcHBseVtwcm9wSW5kZXhdO1xuICAgIGNvbnN0IHZhbHVlID0gc3R5bGVzICFbcHJvcF07XG4gICAgY29udGV4dC5wdXNoKFN0eWxpbmdGbGFncy5EaXJ0eSwgcHJvcCwgdmFsdWUpO1xuICAgIHByb3BJbmRleCsrO1xuICAgIGRpcnR5ID0gdHJ1ZTtcbiAgfVxuXG4gIGlmIChkaXJ0eSkge1xuICAgIHNldENvbnRleHREaXJ0eShjb250ZXh0LCB0cnVlKTtcbiAgfVxufVxuXG4vKipcbiAqIFNldHMgYW5kIHJlc29sdmVzIGEgc2luZ2xlIENTUyBzdHlsZSBvbiBhIHByb3BlcnR5IG9uIGFuIGBTdHlsaW5nQ29udGV4dGAgc28gdGhhdCB0aGV5XG4gKiBjYW4gYmUgYXBwbGllZCB0byB0aGUgZWxlbWVudCBvbmNlIGByZW5kZXJFbGVtZW50U3R5bGVzYCBpcyBjYWxsZWQuXG4gKlxuICogTm90ZSB0aGF0IHByb3AtbGV2ZWwgc3R5bGVzIGFyZSBjb25zaWRlcmVkIGhpZ2hlciBwcmlvcml0eSB0aGFuIHN0eWxlcyB0aGF0IGFyZSBhcHBsaWVkXG4gKiB1c2luZyBgdXBkYXRlU3R5bGVNYXBgLCB0aGVyZWZvcmUsIHdoZW4gc3R5bGVzIGFyZSByZW5kZXJlZCB0aGVuIGFueSBzdHlsZXMgdGhhdFxuICogaGF2ZSBiZWVuIGFwcGxpZWQgdXNpbmcgdGhpcyBmdW5jdGlvbiB3aWxsIGJlIGNvbnNpZGVyZWQgZmlyc3QgKHRoZW4gbXVsdGkgdmFsdWVzIHNlY29uZFxuICogYW5kIHRoZW4gaW5pdGlhbCB2YWx1ZXMgYXMgYSBiYWNrdXApLlxuICpcbiAqIEBwYXJhbSBjb250ZXh0IFRoZSBzdHlsaW5nIGNvbnRleHQgdGhhdCB3aWxsIGJlIHVwZGF0ZWQgd2l0aCB0aGVcbiAqICAgIG5ld2x5IHByb3ZpZGVkIHN0eWxlIHZhbHVlLlxuICogQHBhcmFtIGluZGV4IFRoZSBpbmRleCBvZiB0aGUgcHJvcGVydHkgd2hpY2ggaXMgYmVpbmcgdXBkYXRlZC5cbiAqIEBwYXJhbSB2YWx1ZSBUaGUgQ1NTIHN0eWxlIHZhbHVlIHRoYXQgd2lsbCBiZSBhc3NpZ25lZFxuICovXG5leHBvcnQgZnVuY3Rpb24gdXBkYXRlU3R5bGVQcm9wKFxuICAgIGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBpbmRleDogbnVtYmVyLCB2YWx1ZTogc3RyaW5nIHwgbnVsbCk6IHZvaWQge1xuICBjb25zdCBzaW5nbGVJbmRleCA9IFN0eWxpbmdJbmRleC5TaW5nbGVTdHlsZXNTdGFydFBvc2l0aW9uICsgaW5kZXggKiBTdHlsaW5nSW5kZXguU2l6ZTtcbiAgY29uc3QgY3VyclZhbHVlID0gZ2V0VmFsdWUoY29udGV4dCwgc2luZ2xlSW5kZXgpO1xuICBjb25zdCBjdXJyRmxhZyA9IGdldFBvaW50ZXJzKGNvbnRleHQsIHNpbmdsZUluZGV4KTtcblxuICAvLyBkaWRuJ3QgY2hhbmdlIC4uLiBub3RoaW5nIHRvIG1ha2UgYSBub3RlIG9mXG4gIGlmIChjdXJyVmFsdWUgIT09IHZhbHVlKSB7XG4gICAgLy8gdGhlIHZhbHVlIHdpbGwgYWx3YXlzIGdldCB1cGRhdGVkIChldmVuIGlmIHRoZSBkaXJ0eSBmbGFnIGlzIHNraXBwZWQpXG4gICAgc2V0VmFsdWUoY29udGV4dCwgc2luZ2xlSW5kZXgsIHZhbHVlKTtcbiAgICBjb25zdCBpbmRleEZvck11bHRpID0gZ2V0TXVsdGlPclNpbmdsZUluZGV4KGN1cnJGbGFnKTtcblxuICAgIC8vIGlmIHRoZSB2YWx1ZSBpcyB0aGUgc2FtZSBpbiB0aGUgbXVsdGktYXJlYSB0aGVuIHRoZXJlJ3Mgbm8gcG9pbnQgaW4gcmUtYXNzZW1ibGluZ1xuICAgIGNvbnN0IHZhbHVlRm9yTXVsdGkgPSBnZXRWYWx1ZShjb250ZXh0LCBpbmRleEZvck11bHRpKTtcbiAgICBpZiAoIXZhbHVlRm9yTXVsdGkgfHwgdmFsdWVGb3JNdWx0aSAhPT0gdmFsdWUpIHtcbiAgICAgIGxldCBtdWx0aURpcnR5ID0gZmFsc2U7XG4gICAgICBsZXQgc2luZ2xlRGlydHkgPSB0cnVlO1xuXG4gICAgICAvLyBvbmx5IHdoZW4gdGhlIHZhbHVlIGlzIHNldCB0byBgbnVsbGAgc2hvdWxkIHRoZSBtdWx0aS12YWx1ZSBnZXQgZmxhZ2dlZFxuICAgICAgaWYgKHZhbHVlID09IG51bGwgJiYgdmFsdWVGb3JNdWx0aSkge1xuICAgICAgICBtdWx0aURpcnR5ID0gdHJ1ZTtcbiAgICAgICAgc2luZ2xlRGlydHkgPSBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgc2V0RGlydHkoY29udGV4dCwgaW5kZXhGb3JNdWx0aSwgbXVsdGlEaXJ0eSk7XG4gICAgICBzZXREaXJ0eShjb250ZXh0LCBzaW5nbGVJbmRleCwgc2luZ2xlRGlydHkpO1xuICAgICAgc2V0Q29udGV4dERpcnR5KGNvbnRleHQsIHRydWUpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIFJlbmRlcnMgYWxsIHF1ZXVlZCBzdHlsZXMgdXNpbmcgYSByZW5kZXJlciBvbnRvIHRoZSBnaXZlbiBlbGVtZW50LlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gd29ya3MgYnkgcmVuZGVyaW5nIGFueSBzdHlsZXMgKHRoYXQgaGF2ZSBiZWVuIGFwcGxpZWRcbiAqIHVzaW5nIGB1cGRhdGVTdHlsZU1hcGAgYW5kIGB1cGRhdGVTdHlsZVByb3BgKSBvbnRvIHRoZVxuICogcHJvdmlkZWQgZWxlbWVudCB1c2luZyB0aGUgcHJvdmlkZWQgcmVuZGVyZXIuIEp1c3QgYmVmb3JlIHRoZSBzdHlsZXNcbiAqIGFyZSByZW5kZXJlZCBhIGZpbmFsIGtleS92YWx1ZSBzdHlsZSBtYXAgd2lsbCBiZSBhc3NlbWJsZWQuXG4gKlxuICogQHBhcmFtIGxFbGVtZW50IHRoZSBlbGVtZW50IHRoYXQgdGhlIHN0eWxlcyB3aWxsIGJlIHJlbmRlcmVkIG9uXG4gKiBAcGFyYW0gY29udGV4dCBUaGUgc3R5bGluZyBjb250ZXh0IHRoYXQgd2lsbCBiZSB1c2VkIHRvIGRldGVybWluZVxuICogICAgICB3aGF0IHN0eWxlcyB3aWxsIGJlIHJlbmRlcmVkXG4gKiBAcGFyYW0gcmVuZGVyZXIgdGhlIHJlbmRlcmVyIHRoYXQgd2lsbCBiZSB1c2VkIHRvIGFwcGx5IHRoZSBzdHlsaW5nXG4gKiBAcGFyYW0gc3R5bGVTdG9yZSBpZiBwcm92aWRlZCwgdGhlIHVwZGF0ZWQgc3R5bGUgdmFsdWVzIHdpbGwgYmUgYXBwbGllZFxuICogICAgdG8gdGhpcyBrZXkvdmFsdWUgbWFwIGluc3RlYWQgb2YgYmVpbmcgcmVuZGVyZXJlZCB2aWEgdGhlIHJlbmRlcmVyLlxuICogQHJldHVybnMgYW4gb2JqZWN0IGxpdGVyYWwuIGB7IGNvbG9yOiAncmVkJywgaGVpZ2h0OiAnYXV0byd9YC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlbmRlclN0eWxlcyhcbiAgICBsRWxlbWVudDogTEVsZW1lbnROb2RlLCBjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgcmVuZGVyZXI6IFJlbmRlcmVyMyxcbiAgICBzdHlsZVN0b3JlPzoge1trZXk6IHN0cmluZ106IGFueX0pIHtcbiAgaWYgKGlzQ29udGV4dERpcnR5KGNvbnRleHQpKSB7XG4gICAgY29uc3QgbmF0aXZlID0gbEVsZW1lbnQubmF0aXZlO1xuICAgIGNvbnN0IG11bHRpU3RhcnRJbmRleCA9IGdldE11bHRpU3RhcnRJbmRleChjb250ZXh0KTtcbiAgICBmb3IgKGxldCBpID0gU3R5bGluZ0luZGV4LlNpbmdsZVN0eWxlc1N0YXJ0UG9zaXRpb247IGkgPCBjb250ZXh0Lmxlbmd0aDtcbiAgICAgICAgIGkgKz0gU3R5bGluZ0luZGV4LlNpemUpIHtcbiAgICAgIC8vIHRoZXJlIGlzIG5vIHBvaW50IGluIHJlbmRlcmluZyBzdHlsZXMgdGhhdCBoYXZlIG5vdCBjaGFuZ2VkIG9uIHNjcmVlblxuICAgICAgaWYgKGlzRGlydHkoY29udGV4dCwgaSkpIHtcbiAgICAgICAgY29uc3QgcHJvcCA9IGdldFByb3AoY29udGV4dCwgaSk7XG4gICAgICAgIGNvbnN0IHZhbHVlID0gZ2V0VmFsdWUoY29udGV4dCwgaSk7XG4gICAgICAgIGNvbnN0IGZsYWcgPSBnZXRQb2ludGVycyhjb250ZXh0LCBpKTtcbiAgICAgICAgY29uc3QgaXNJblNpbmdsZVJlZ2lvbiA9IGkgPCBtdWx0aVN0YXJ0SW5kZXg7XG5cbiAgICAgICAgbGV0IHN0eWxlVG9BcHBseTogc3RyaW5nfG51bGwgPSB2YWx1ZTtcblxuICAgICAgICAvLyBTVFlMRSBERUZFUiBDQVNFIDE6IFVzZSBhIG11bHRpIHZhbHVlIGluc3RlYWQgb2YgYSBudWxsIHNpbmdsZSB2YWx1ZVxuICAgICAgICAvLyB0aGlzIGNoZWNrIGltcGxpZXMgdGhhdCBhIHNpbmdsZSB2YWx1ZSB3YXMgcmVtb3ZlZCBhbmQgd2VcbiAgICAgICAgLy8gc2hvdWxkIG5vdyBkZWZlciB0byBhIG11bHRpIHZhbHVlIGFuZCB1c2UgdGhhdCAoaWYgc2V0KS5cbiAgICAgICAgaWYgKGlzSW5TaW5nbGVSZWdpb24gJiYgc3R5bGVUb0FwcGx5ID09IG51bGwpIHtcbiAgICAgICAgICAvLyBzaW5nbGUgdmFsdWVzIEFMV0FZUyBoYXZlIGEgcmVmZXJlbmNlIHRvIGEgbXVsdGkgaW5kZXhcbiAgICAgICAgICBjb25zdCBtdWx0aUluZGV4ID0gZ2V0TXVsdGlPclNpbmdsZUluZGV4KGZsYWcpO1xuICAgICAgICAgIHN0eWxlVG9BcHBseSA9IGdldFZhbHVlKGNvbnRleHQsIG11bHRpSW5kZXgpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gU1RZTEUgREVGRVIgQ0FTRSAyOiBVc2UgdGhlIGluaXRpYWwgdmFsdWUgaWYgYWxsIGVsc2UgZmFpbHMgKGlzIG51bGwpXG4gICAgICAgIC8vIHRoZSBpbml0aWFsIHZhbHVlIHdpbGwgYWx3YXlzIGJlIGEgc3RyaW5nIG9yIG51bGwsXG4gICAgICAgIC8vIHRoZXJlZm9yZSB3ZSBjYW4gc2FmZWx5IGFkb3B0IGl0IGluY2FzZSB0aGVyZSdzIG5vdGhpbmcgZWxzZVxuICAgICAgICBpZiAoc3R5bGVUb0FwcGx5ID09IG51bGwpIHtcbiAgICAgICAgICBzdHlsZVRvQXBwbHkgPSBnZXRJbml0aWFsVmFsdWUoY29udGV4dCwgZmxhZyk7XG4gICAgICAgIH1cblxuICAgICAgICBzZXRTdHlsZShuYXRpdmUsIHByb3AsIHN0eWxlVG9BcHBseSwgcmVuZGVyZXIsIHN0eWxlU3RvcmUpO1xuICAgICAgICBzZXREaXJ0eShjb250ZXh0LCBpLCBmYWxzZSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgc2V0Q29udGV4dERpcnR5KGNvbnRleHQsIGZhbHNlKTtcbiAgfVxufVxuXG4vKipcbiAqIFRoaXMgZnVuY3Rpb24gcmVuZGVycyBhIGdpdmVuIENTUyBwcm9wL3ZhbHVlIGVudHJ5IHVzaW5nIHRoZVxuICogcHJvdmlkZWQgcmVuZGVyZXIuIElmIGEgYHN0eWxlU3RvcmVgIHZhbHVlIGlzIHByb3ZpZGVkIHRoZW5cbiAqIHRoYXQgd2lsbCBiZSB1c2VkIGEgcmVuZGVyIGNvbnRleHQgaW5zdGVhZCBvZiB0aGUgcHJvdmlkZWRcbiAqIHJlbmRlcmVyLlxuICpcbiAqIEBwYXJhbSBuYXRpdmUgdGhlIERPTSBFbGVtZW50XG4gKiBAcGFyYW0gcHJvcCB0aGUgQ1NTIHN0eWxlIHByb3BlcnR5IHRoYXQgd2lsbCBiZSByZW5kZXJlZFxuICogQHBhcmFtIHZhbHVlIHRoZSBDU1Mgc3R5bGUgdmFsdWUgdGhhdCB3aWxsIGJlIHJlbmRlcmVkXG4gKiBAcGFyYW0gcmVuZGVyZXJcbiAqIEBwYXJhbSBzdHlsZVN0b3JlIGFuIG9wdGlvbmFsIGtleS92YWx1ZSBtYXAgdGhhdCB3aWxsIGJlIHVzZWQgYXMgYSBjb250ZXh0IHRvIHJlbmRlciBzdHlsZXMgb25cbiAqL1xuZnVuY3Rpb24gc2V0U3R5bGUoXG4gICAgbmF0aXZlOiBhbnksIHByb3A6IHN0cmluZywgdmFsdWU6IHN0cmluZyB8IG51bGwsIHJlbmRlcmVyOiBSZW5kZXJlcjMsXG4gICAgc3R5bGVTdG9yZT86IHtba2V5OiBzdHJpbmddOiBhbnl9KSB7XG4gIGlmIChzdHlsZVN0b3JlKSB7XG4gICAgc3R5bGVTdG9yZVtwcm9wXSA9IHZhbHVlO1xuICB9IGVsc2UgaWYgKHZhbHVlID09IG51bGwpIHtcbiAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyUmVtb3ZlU3R5bGUrKztcbiAgICBpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikgP1xuICAgICAgICByZW5kZXJlci5yZW1vdmVTdHlsZShuYXRpdmUsIHByb3AsIFJlbmRlcmVyU3R5bGVGbGFnczMuRGFzaENhc2UpIDpcbiAgICAgICAgbmF0aXZlWydzdHlsZSddLnJlbW92ZVByb3BlcnR5KHByb3ApO1xuICB9IGVsc2Uge1xuICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJTZXRTdHlsZSsrO1xuICAgIGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSA/XG4gICAgICAgIHJlbmRlcmVyLnNldFN0eWxlKG5hdGl2ZSwgcHJvcCwgdmFsdWUsIFJlbmRlcmVyU3R5bGVGbGFnczMuRGFzaENhc2UpIDpcbiAgICAgICAgbmF0aXZlWydzdHlsZSddLnNldFByb3BlcnR5KHByb3AsIHZhbHVlKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBzZXREaXJ0eShjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgaW5kZXg6IG51bWJlciwgaXNEaXJ0eVllczogYm9vbGVhbikge1xuICBjb25zdCBhZGp1c3RlZEluZGV4ID1cbiAgICAgIGluZGV4ID49IFN0eWxpbmdJbmRleC5TaW5nbGVTdHlsZXNTdGFydFBvc2l0aW9uID8gKGluZGV4ICsgU3R5bGluZ0luZGV4LkZsYWdzT2Zmc2V0KSA6IGluZGV4O1xuICBpZiAoaXNEaXJ0eVllcykge1xuICAgIChjb250ZXh0W2FkanVzdGVkSW5kZXhdIGFzIG51bWJlcikgfD0gU3R5bGluZ0ZsYWdzLkRpcnR5O1xuICB9IGVsc2Uge1xuICAgIChjb250ZXh0W2FkanVzdGVkSW5kZXhdIGFzIG51bWJlcikgJj0gflN0eWxpbmdGbGFncy5EaXJ0eTtcbiAgfVxufVxuXG5mdW5jdGlvbiBpc0RpcnR5KGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBpbmRleDogbnVtYmVyKTogYm9vbGVhbiB7XG4gIGNvbnN0IGFkanVzdGVkSW5kZXggPVxuICAgICAgaW5kZXggPj0gU3R5bGluZ0luZGV4LlNpbmdsZVN0eWxlc1N0YXJ0UG9zaXRpb24gPyAoaW5kZXggKyBTdHlsaW5nSW5kZXguRmxhZ3NPZmZzZXQpIDogaW5kZXg7XG4gIHJldHVybiAoKGNvbnRleHRbYWRqdXN0ZWRJbmRleF0gYXMgbnVtYmVyKSAmIFN0eWxpbmdGbGFncy5EaXJ0eSkgPT0gU3R5bGluZ0ZsYWdzLkRpcnR5O1xufVxuXG5mdW5jdGlvbiBwb2ludGVycyhjb25maWdGbGFnOiBudW1iZXIsIHN0YXRpY0luZGV4OiBudW1iZXIsIGR5bmFtaWNJbmRleDogbnVtYmVyKSB7XG4gIHJldHVybiAoY29uZmlnRmxhZyAmIFN0eWxpbmdGbGFncy5EaXJ0eSkgfCAoc3RhdGljSW5kZXggPDwgU3R5bGluZ0ZsYWdzLkJpdENvdW50U2l6ZSkgfFxuICAgICAgKGR5bmFtaWNJbmRleCA8PCAoU3R5bGluZ0luZGV4LkJpdENvdW50U2l6ZSArIFN0eWxpbmdGbGFncy5CaXRDb3VudFNpemUpKTtcbn1cblxuZnVuY3Rpb24gZ2V0SW5pdGlhbFZhbHVlKGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBmbGFnOiBudW1iZXIpOiBzdHJpbmd8bnVsbCB7XG4gIGNvbnN0IGluZGV4ID0gZ2V0SW5pdGlhbEluZGV4KGZsYWcpO1xuICByZXR1cm4gY29udGV4dFtTdHlsaW5nSW5kZXguSW5pdGlhbFN0eWxlc1Bvc2l0aW9uXVtpbmRleF0gYXMgbnVsbCB8IHN0cmluZztcbn1cblxuZnVuY3Rpb24gZ2V0SW5pdGlhbEluZGV4KGZsYWc6IG51bWJlcik6IG51bWJlciB7XG4gIHJldHVybiAoZmxhZyA+PiBTdHlsaW5nRmxhZ3MuQml0Q291bnRTaXplKSAmIFN0eWxpbmdJbmRleC5CaXRNYXNrO1xufVxuXG5mdW5jdGlvbiBnZXRNdWx0aU9yU2luZ2xlSW5kZXgoZmxhZzogbnVtYmVyKTogbnVtYmVyIHtcbiAgY29uc3QgaW5kZXggPVxuICAgICAgKGZsYWcgPj4gKFN0eWxpbmdJbmRleC5CaXRDb3VudFNpemUgKyBTdHlsaW5nRmxhZ3MuQml0Q291bnRTaXplKSkgJiBTdHlsaW5nSW5kZXguQml0TWFzaztcbiAgcmV0dXJuIGluZGV4ID49IFN0eWxpbmdJbmRleC5TaW5nbGVTdHlsZXNTdGFydFBvc2l0aW9uID8gaW5kZXggOiAtMTtcbn1cblxuZnVuY3Rpb24gZ2V0TXVsdGlTdGFydEluZGV4KGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0KTogbnVtYmVyIHtcbiAgcmV0dXJuIGdldE11bHRpT3JTaW5nbGVJbmRleChjb250ZXh0W1N0eWxpbmdJbmRleC5NYXN0ZXJGbGFnUG9zaXRpb25dKSBhcyBudW1iZXI7XG59XG5cbmZ1bmN0aW9uIHNldFByb3AoY29udGV4dDogU3R5bGluZ0NvbnRleHQsIGluZGV4OiBudW1iZXIsIHByb3A6IHN0cmluZykge1xuICBjb250ZXh0W2luZGV4ICsgU3R5bGluZ0luZGV4LlByb3BlcnR5T2Zmc2V0XSA9IHByb3A7XG59XG5cbmZ1bmN0aW9uIHNldFZhbHVlKGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBpbmRleDogbnVtYmVyLCB2YWx1ZTogc3RyaW5nIHwgbnVsbCkge1xuICBjb250ZXh0W2luZGV4ICsgU3R5bGluZ0luZGV4LlZhbHVlT2Zmc2V0XSA9IHZhbHVlO1xufVxuXG5mdW5jdGlvbiBzZXRGbGFnKGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBpbmRleDogbnVtYmVyLCBmbGFnOiBudW1iZXIpIHtcbiAgY29uc3QgYWRqdXN0ZWRJbmRleCA9XG4gICAgICBpbmRleCA9PT0gU3R5bGluZ0luZGV4Lk1hc3RlckZsYWdQb3NpdGlvbiA/IGluZGV4IDogKGluZGV4ICsgU3R5bGluZ0luZGV4LkZsYWdzT2Zmc2V0KTtcbiAgY29udGV4dFthZGp1c3RlZEluZGV4XSA9IGZsYWc7XG59XG5cbmZ1bmN0aW9uIGdldFBvaW50ZXJzKGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBpbmRleDogbnVtYmVyKTogbnVtYmVyIHtcbiAgY29uc3QgYWRqdXN0ZWRJbmRleCA9XG4gICAgICBpbmRleCA9PT0gU3R5bGluZ0luZGV4Lk1hc3RlckZsYWdQb3NpdGlvbiA/IGluZGV4IDogKGluZGV4ICsgU3R5bGluZ0luZGV4LkZsYWdzT2Zmc2V0KTtcbiAgcmV0dXJuIGNvbnRleHRbYWRqdXN0ZWRJbmRleF0gYXMgbnVtYmVyO1xufVxuXG5mdW5jdGlvbiBnZXRWYWx1ZShjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgaW5kZXg6IG51bWJlcik6IHN0cmluZ3xudWxsIHtcbiAgcmV0dXJuIGNvbnRleHRbaW5kZXggKyBTdHlsaW5nSW5kZXguVmFsdWVPZmZzZXRdIGFzIHN0cmluZyB8IG51bGw7XG59XG5cbmZ1bmN0aW9uIGdldFByb3AoY29udGV4dDogU3R5bGluZ0NvbnRleHQsIGluZGV4OiBudW1iZXIpOiBzdHJpbmcge1xuICByZXR1cm4gY29udGV4dFtpbmRleCArIFN0eWxpbmdJbmRleC5Qcm9wZXJ0eU9mZnNldF0gYXMgc3RyaW5nO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNDb250ZXh0RGlydHkoY29udGV4dDogU3R5bGluZ0NvbnRleHQpOiBib29sZWFuIHtcbiAgcmV0dXJuIGlzRGlydHkoY29udGV4dCwgU3R5bGluZ0luZGV4Lk1hc3RlckZsYWdQb3NpdGlvbik7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRDb250ZXh0RGlydHkoY29udGV4dDogU3R5bGluZ0NvbnRleHQsIGlzRGlydHlZZXM6IGJvb2xlYW4pOiB2b2lkIHtcbiAgc2V0RGlydHkoY29udGV4dCwgU3R5bGluZ0luZGV4Lk1hc3RlckZsYWdQb3NpdGlvbiwgaXNEaXJ0eVllcyk7XG59XG5cbmZ1bmN0aW9uIGZpbmRFbnRyeVBvc2l0aW9uQnlQcm9wKFxuICAgIGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBwcm9wOiBzdHJpbmcsIHN0YXJ0SW5kZXg/OiBudW1iZXIpOiBudW1iZXIge1xuICBmb3IgKGxldCBpID0gKHN0YXJ0SW5kZXggfHwgMCkgKyBTdHlsaW5nSW5kZXguUHJvcGVydHlPZmZzZXQ7IGkgPCBjb250ZXh0Lmxlbmd0aDtcbiAgICAgICBpICs9IFN0eWxpbmdJbmRleC5TaXplKSB7XG4gICAgY29uc3QgdGhpc1Byb3AgPSBjb250ZXh0W2ldO1xuICAgIGlmICh0aGlzUHJvcCA9PSBwcm9wKSB7XG4gICAgICByZXR1cm4gaSAtIFN0eWxpbmdJbmRleC5Qcm9wZXJ0eU9mZnNldDtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIC0xO1xufVxuXG5mdW5jdGlvbiBzd2FwTXVsdGlDb250ZXh0RW50cmllcyhjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgaW5kZXhBOiBudW1iZXIsIGluZGV4QjogbnVtYmVyKSB7XG4gIGNvbnN0IHRtcFZhbHVlID0gZ2V0VmFsdWUoY29udGV4dCwgaW5kZXhBKTtcbiAgY29uc3QgdG1wUHJvcCA9IGdldFByb3AoY29udGV4dCwgaW5kZXhBKTtcbiAgY29uc3QgdG1wRmxhZyA9IGdldFBvaW50ZXJzKGNvbnRleHQsIGluZGV4QSk7XG5cbiAgbGV0IGZsYWdBID0gdG1wRmxhZztcbiAgbGV0IGZsYWdCID0gZ2V0UG9pbnRlcnMoY29udGV4dCwgaW5kZXhCKTtcblxuICBjb25zdCBzaW5nbGVJbmRleEEgPSBnZXRNdWx0aU9yU2luZ2xlSW5kZXgoZmxhZ0EpO1xuICBpZiAoc2luZ2xlSW5kZXhBID49IDApIHtcbiAgICBjb25zdCBfZmxhZyA9IGdldFBvaW50ZXJzKGNvbnRleHQsIHNpbmdsZUluZGV4QSk7XG4gICAgY29uc3QgX2luaXRpYWwgPSBnZXRJbml0aWFsSW5kZXgoX2ZsYWcpO1xuICAgIHNldEZsYWcoY29udGV4dCwgc2luZ2xlSW5kZXhBLCBwb2ludGVycyhfZmxhZywgX2luaXRpYWwsIGluZGV4QikpO1xuICB9XG5cbiAgY29uc3Qgc2luZ2xlSW5kZXhCID0gZ2V0TXVsdGlPclNpbmdsZUluZGV4KGZsYWdCKTtcbiAgaWYgKHNpbmdsZUluZGV4QiA+PSAwKSB7XG4gICAgY29uc3QgX2ZsYWcgPSBnZXRQb2ludGVycyhjb250ZXh0LCBzaW5nbGVJbmRleEIpO1xuICAgIGNvbnN0IF9pbml0aWFsID0gZ2V0SW5pdGlhbEluZGV4KF9mbGFnKTtcbiAgICBzZXRGbGFnKGNvbnRleHQsIHNpbmdsZUluZGV4QiwgcG9pbnRlcnMoX2ZsYWcsIF9pbml0aWFsLCBpbmRleEEpKTtcbiAgfVxuXG4gIHNldFZhbHVlKGNvbnRleHQsIGluZGV4QSwgZ2V0VmFsdWUoY29udGV4dCwgaW5kZXhCKSk7XG4gIHNldFByb3AoY29udGV4dCwgaW5kZXhBLCBnZXRQcm9wKGNvbnRleHQsIGluZGV4QikpO1xuICBzZXRGbGFnKGNvbnRleHQsIGluZGV4QSwgZ2V0UG9pbnRlcnMoY29udGV4dCwgaW5kZXhCKSk7XG5cbiAgc2V0VmFsdWUoY29udGV4dCwgaW5kZXhCLCB0bXBWYWx1ZSk7XG4gIHNldFByb3AoY29udGV4dCwgaW5kZXhCLCB0bXBQcm9wKTtcbiAgc2V0RmxhZyhjb250ZXh0LCBpbmRleEIsIHRtcEZsYWcpO1xufVxuXG5mdW5jdGlvbiB1cGRhdGVTaW5nbGVQb2ludGVyVmFsdWVzKGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBpbmRleFN0YXJ0UG9zaXRpb246IG51bWJlcikge1xuICBmb3IgKGxldCBpID0gaW5kZXhTdGFydFBvc2l0aW9uOyBpIDwgY29udGV4dC5sZW5ndGg7IGkgKz0gU3R5bGluZ0luZGV4LlNpemUpIHtcbiAgICBjb25zdCBtdWx0aUZsYWcgPSBnZXRQb2ludGVycyhjb250ZXh0LCBpKTtcbiAgICBjb25zdCBzaW5nbGVJbmRleCA9IGdldE11bHRpT3JTaW5nbGVJbmRleChtdWx0aUZsYWcpO1xuICAgIGlmIChzaW5nbGVJbmRleCA+IDApIHtcbiAgICAgIGNvbnN0IHNpbmdsZUZsYWcgPSBnZXRQb2ludGVycyhjb250ZXh0LCBzaW5nbGVJbmRleCk7XG4gICAgICBjb25zdCBpbml0aWFsSW5kZXhGb3JTaW5nbGUgPSBnZXRJbml0aWFsSW5kZXgoc2luZ2xlRmxhZyk7XG4gICAgICBjb25zdCB1cGRhdGVkRmxhZyA9IHBvaW50ZXJzKFxuICAgICAgICAgIGlzRGlydHkoY29udGV4dCwgc2luZ2xlSW5kZXgpID8gU3R5bGluZ0ZsYWdzLkRpcnR5IDogU3R5bGluZ0ZsYWdzLk5vbmUsXG4gICAgICAgICAgaW5pdGlhbEluZGV4Rm9yU2luZ2xlLCBpKTtcbiAgICAgIHNldEZsYWcoY29udGV4dCwgc2luZ2xlSW5kZXgsIHVwZGF0ZWRGbGFnKTtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gaW5zZXJ0TmV3TXVsdGlQcm9wZXJ0eShcbiAgICBjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgaW5kZXg6IG51bWJlciwgbmFtZTogc3RyaW5nLCB2YWx1ZTogc3RyaW5nKTogdm9pZCB7XG4gIGNvbnN0IGRvU2hpZnQgPSBpbmRleCA8IGNvbnRleHQubGVuZ3RoO1xuXG4gIC8vIHByb3AgZG9lcyBub3QgZXhpc3QgaW4gdGhlIGxpc3QsIGFkZCBpdCBpblxuICBjb250ZXh0LnNwbGljZShpbmRleCwgMCwgU3R5bGluZ0ZsYWdzLkRpcnR5LCBuYW1lLCB2YWx1ZSk7XG5cbiAgaWYgKGRvU2hpZnQpIHtcbiAgICAvLyBiZWNhdXNlIHRoZSB2YWx1ZSB3YXMgaW5zZXJ0ZWQgbWlkd2F5IGludG8gdGhlIGFycmF5IHRoZW4gd2VcbiAgICAvLyBuZWVkIHRvIHVwZGF0ZSBhbGwgdGhlIHNoaWZ0ZWQgbXVsdGkgdmFsdWVzJyBzaW5nbGUgdmFsdWVcbiAgICAvLyBwb2ludGVycyB0byBwb2ludCB0byB0aGUgbmV3bHkgc2hpZnRlZCBsb2NhdGlvblxuICAgIHVwZGF0ZVNpbmdsZVBvaW50ZXJWYWx1ZXMoY29udGV4dCwgaW5kZXggKyBTdHlsaW5nSW5kZXguU2l6ZSk7XG4gIH1cbn1cbiJdfQ==