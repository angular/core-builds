import * as tslib_1 from "tslib";
import { assertNotEqual } from '../../util/assert';
import { EMPTY_ARRAY, EMPTY_OBJ } from '../empty';
import { RendererStyleFlags3, isProceduralRenderer } from '../interfaces/renderer';
import { NO_CHANGE } from '../tokens';
import { getRootContext } from '../util';
import { BoundPlayerFactory } from './player_factory';
import { addPlayerInternal, allocPlayerContext, createEmptyStylingContext, getPlayerContext } from './util';
/**
 * This file includes the code to power all styling-binding operations in Angular.
 *
 * These include:
 * [style]="myStyleObj"
 * [class]="myClassObj"
 * [style.prop]="myPropValue"
 * [class.name]="myClassValue"
 *
 * There are many different ways in which these functions below are called. Please see
 * `interfaces/styles.ts` to get a better idea of how the styling algorithm works.
 */
/**
 * Creates a new StylingContext an fills it with the provided static styling attribute values.
 */
export function initializeStaticContext(attrs) {
    var context = createEmptyStylingContext();
    var initialClasses = context[3 /* InitialClassValuesPosition */] =
        [null];
    var initialStyles = context[2 /* InitialStyleValuesPosition */] =
        [null];
    // The attributes array has marker values (numbers) indicating what the subsequent
    // values represent. When we encounter a number, we set the mode to that type of attribute.
    var mode = -1;
    for (var i = 0; i < attrs.length; i++) {
        var attr = attrs[i];
        if (typeof attr == 'number') {
            mode = attr;
        }
        else if (mode === 2 /* Styles */) {
            initialStyles.push(attr, attrs[++i]);
        }
        else if (mode === 1 /* Classes */) {
            initialClasses.push(attr, true);
        }
        else if (mode === 3 /* SelectOnly */) {
            break;
        }
    }
    return context;
}
/**
 * Designed to update an existing styling context with new static styling
 * data (classes and styles).
 *
 * @param context the existing styling context
 * @param attrs an array of new static styling attributes that will be
 *              assigned to the context
 * @param directive the directive instance with which static data is associated with.
 */
export function patchContextWithStaticAttrs(context, attrs, startingIndex, directive) {
    // If the styling context has already been patched with the given directive's bindings,
    // then there is no point in doing it again. The reason why this may happen (the directive
    // styling being patched twice) is because the `stylingBinding` function is called each time
    // an element is created (both within a template function and within directive host bindings).
    var directives = context[1 /* DirectiveRegistryPosition */];
    if (getDirectiveRegistryValuesIndexOf(directives, directive) == -1) {
        // this is a new directive which we have not seen yet.
        directives.push(directive, -1, false, null);
        var initialClasses = null;
        var initialStyles = null;
        var mode = -1;
        for (var i = startingIndex; i < attrs.length; i++) {
            var attr = attrs[i];
            if (typeof attr == 'number') {
                mode = attr;
            }
            else if (mode == 1 /* Classes */) {
                initialClasses = initialClasses || context[3 /* InitialClassValuesPosition */];
                patchInitialStylingValue(initialClasses, attr, true);
            }
            else if (mode == 2 /* Styles */) {
                initialStyles = initialStyles || context[2 /* InitialStyleValuesPosition */];
                patchInitialStylingValue(initialStyles, attr, attrs[++i]);
            }
        }
    }
}
/**
 * Designed to add a style or class value into the existing set of initial styles.
 *
 * The function will search and figure out if a style/class value is already present
 * within the provided initial styling array. If and when a style/class value is not
 * present (or if it's value is falsy) then it will be inserted/updated in the list
 * of initial styling values.
 */
function patchInitialStylingValue(initialStyling, prop, value) {
    // Even values are keys; Odd numbers are values; Search keys only
    for (var i = 1 /* KeyValueStartPosition */; i < initialStyling.length;) {
        var key = initialStyling[i];
        if (key === prop) {
            var existingValue = initialStyling[i + 1 /* ValueOffset */];
            // If there is no previous style value (when `null`) or no previous class
            // applied (when `false`) then we update the the newly given value.
            if (existingValue == null || existingValue == false) {
                initialStyling[i + 1 /* ValueOffset */] = value;
            }
            return;
        }
        i = i + 2 /* Size */;
    }
    // We did not find existing key, add a new one.
    initialStyling.push(prop, value);
}
/**
 * Runs through the initial styling data present in the context and renders
 * them via the renderer on the element.
 */
export function renderInitialStylesAndClasses(element, context, renderer) {
    var initialClasses = context[3 /* InitialClassValuesPosition */];
    renderInitialStylingValues(element, renderer, initialClasses, true);
    var initialStyles = context[2 /* InitialStyleValuesPosition */];
    renderInitialStylingValues(element, renderer, initialStyles, false);
}
/**
 * This is a helper function designed to render each entry present within the
 * provided list of initialStylingValues.
 */
function renderInitialStylingValues(element, renderer, initialStylingValues, isEntryClassBased) {
    for (var i = 1 /* KeyValueStartPosition */; i < initialStylingValues.length; i += 2 /* Size */) {
        var value = initialStylingValues[i + 1 /* ValueOffset */];
        if (value) {
            if (isEntryClassBased) {
                setClass(element, initialStylingValues[i + 0 /* PropOffset */], true, renderer, null);
            }
            else {
                setStyle(element, initialStylingValues[i + 0 /* PropOffset */], value, renderer, null);
            }
        }
    }
}
export function allowNewBindingsForStylingContext(context) {
    return (context[0 /* MasterFlagPosition */] & 32 /* BindingAllocationLocked */) === 0;
}
/**
 * Adds in new binding values to a styling context.
 *
 * If a directive value is provided then all provided class/style binding names will
 * reference the provided directive.
 *
 * @param context the existing styling context
 * @param directiveRef the directive that the new bindings will reference
 * @param classBindingNames an array of class binding names that will be added to the context
 * @param styleBindingNames an array of style binding names that will be added to the context
 * @param styleSanitizer an optional sanitizer that handle all sanitization on for each of
 *    the bindings added to the context. Note that if a directive is provided then the sanitizer
 *    instance will only be active if and when the directive updates the bindings that it owns.
 */
export function updateContextWithBindings(context, directiveRef, classBindingNames, styleBindingNames, styleSanitizer, onlyProcessSingleClasses) {
    if (context[0 /* MasterFlagPosition */] & 32 /* BindingAllocationLocked */)
        return;
    // this means the context has already been patched with the directive's bindings
    var directiveIndex = findOrPatchDirectiveIntoRegistry(context, directiveRef, styleSanitizer);
    if (directiveIndex === -1) {
        // this means the directive has already been patched in ... No point in doing anything
        return;
    }
    // there are alot of variables being used below to track where in the context the new
    // binding values will be placed. Because the context consists of multiple types of
    // entries (single classes/styles and multi classes/styles) alot of the index positions
    // need to be computed ahead of time and the context needs to be extended before the values
    // are inserted in.
    var singlePropOffsetValues = context[4 /* SinglePropOffsetPositions */];
    var totalCurrentClassBindings = singlePropOffsetValues[1 /* ClassesCountPosition */];
    var totalCurrentStyleBindings = singlePropOffsetValues[0 /* StylesCountPosition */];
    var classesOffset = totalCurrentClassBindings * 4 /* Size */;
    var stylesOffset = totalCurrentStyleBindings * 4 /* Size */;
    var singleStylesStartIndex = 9 /* SingleStylesStartPosition */;
    var singleClassesStartIndex = singleStylesStartIndex + stylesOffset;
    var multiStylesStartIndex = singleClassesStartIndex + classesOffset;
    var multiClassesStartIndex = multiStylesStartIndex + stylesOffset;
    // because we're inserting more bindings into the context, this means that the
    // binding values need to be referenced the singlePropOffsetValues array so that
    // the template/directive can easily find them inside of the `elementStyleProp`
    // and the `elementClassProp` functions without iterating through the entire context.
    // The first step to setting up these reference points is to mark how many bindings
    // are being added. Even if these bindings already exist in the context, the directive
    // or template code will still call them unknowingly. Therefore the total values need
    // to be registered so that we know how many bindings are assigned to each directive.
    var currentSinglePropsLength = singlePropOffsetValues.length;
    singlePropOffsetValues.push(styleBindingNames ? styleBindingNames.length : 0, classBindingNames ? classBindingNames.length : 0);
    // the code below will check to see if a new style binding already exists in the context
    // if so then there is no point in inserting it into the context again. Whether or not it
    // exists the styling offset code will now know exactly where it is
    var insertionOffset = 0;
    var filteredStyleBindingNames = [];
    if (styleBindingNames && styleBindingNames.length) {
        for (var i_1 = 0; i_1 < styleBindingNames.length; i_1++) {
            var name_1 = styleBindingNames[i_1];
            var singlePropIndex = getMatchingBindingIndex(context, name_1, singleStylesStartIndex, singleClassesStartIndex);
            if (singlePropIndex == -1) {
                singlePropIndex = singleClassesStartIndex + insertionOffset;
                insertionOffset += 4 /* Size */;
                filteredStyleBindingNames.push(name_1);
            }
            singlePropOffsetValues.push(singlePropIndex);
        }
    }
    // just like with the style binding loop above, the new class bindings get the same treatment...
    var filteredClassBindingNames = [];
    if (classBindingNames && classBindingNames.length) {
        for (var i_2 = 0; i_2 < classBindingNames.length; i_2++) {
            var name_2 = classBindingNames[i_2];
            var singlePropIndex = getMatchingBindingIndex(context, name_2, singleClassesStartIndex, multiStylesStartIndex);
            if (singlePropIndex == -1) {
                singlePropIndex = multiStylesStartIndex + insertionOffset;
                insertionOffset += 4 /* Size */;
                filteredClassBindingNames.push(name_2);
            }
            else {
                singlePropIndex += filteredStyleBindingNames.length * 4 /* Size */;
            }
            singlePropOffsetValues.push(singlePropIndex);
        }
    }
    // because new styles are being inserted, this means the existing collection of style offset
    // index values are incorrect (they point to the wrong values). The code below will run through
    // the entire offset array and update the existing set of index values to point to their new
    // locations while taking the new binding values into consideration.
    var i = 2 /* ValueStartPosition */;
    if (filteredStyleBindingNames.length) {
        while (i < currentSinglePropsLength) {
            var totalStyles = singlePropOffsetValues[i + 0 /* StylesCountPosition */];
            var totalClasses = singlePropOffsetValues[i + 1 /* ClassesCountPosition */];
            if (totalClasses) {
                var start = i + 2 /* ValueStartPosition */ + totalStyles;
                for (var j = start; j < start + totalClasses; j++) {
                    singlePropOffsetValues[j] += filteredStyleBindingNames.length * 4 /* Size */;
                }
            }
            var total = totalStyles + totalClasses;
            i += 2 /* ValueStartPosition */ + total;
        }
    }
    var totalNewEntries = filteredClassBindingNames.length + filteredStyleBindingNames.length;
    // in the event that there are new style values being inserted, all existing class and style
    // bindings need to have their pointer values offsetted with the new amount of space that is
    // used for the new style/class bindings.
    for (var i_3 = singleStylesStartIndex; i_3 < context.length; i_3 += 4 /* Size */) {
        var isMultiBased = i_3 >= multiStylesStartIndex;
        var isClassBased = i_3 >= (isMultiBased ? multiClassesStartIndex : singleClassesStartIndex);
        var flag = getPointers(context, i_3);
        var staticIndex = getInitialIndex(flag);
        var singleOrMultiIndex = getMultiOrSingleIndex(flag);
        if (isMultiBased) {
            singleOrMultiIndex +=
                isClassBased ? (filteredStyleBindingNames.length * 4 /* Size */) : 0;
        }
        else {
            singleOrMultiIndex += (totalNewEntries * 4 /* Size */) +
                ((isClassBased ? filteredStyleBindingNames.length : 0) * 4 /* Size */);
        }
        setFlag(context, i_3, pointers(flag, staticIndex, singleOrMultiIndex));
    }
    // this is where we make space in the context for the new style bindings
    for (var i_4 = 0; i_4 < filteredStyleBindingNames.length * 4 /* Size */; i_4++) {
        context.splice(multiClassesStartIndex, 0, null);
        context.splice(singleClassesStartIndex, 0, null);
        singleClassesStartIndex++;
        multiStylesStartIndex++;
        multiClassesStartIndex += 2; // both single + multi slots were inserted
    }
    // this is where we make space in the context for the new class bindings
    for (var i_5 = 0; i_5 < filteredClassBindingNames.length * 4 /* Size */; i_5++) {
        context.splice(multiStylesStartIndex, 0, null);
        context.push(null);
        multiStylesStartIndex++;
        multiClassesStartIndex++;
    }
    var initialClasses = context[3 /* InitialClassValuesPosition */];
    var initialStyles = context[2 /* InitialStyleValuesPosition */];
    // the code below will insert each new entry into the context and assign the appropriate
    // flags and index values to them. It's important this runs at the end of this function
    // because the context, property offset and index values have all been computed just before.
    for (var i_6 = 0; i_6 < totalNewEntries; i_6++) {
        var entryIsClassBased = i_6 >= filteredStyleBindingNames.length;
        var adjustedIndex = entryIsClassBased ? (i_6 - filteredStyleBindingNames.length) : i_6;
        var propName = entryIsClassBased ? filteredClassBindingNames[adjustedIndex] :
            filteredStyleBindingNames[adjustedIndex];
        var multiIndex = void 0, singleIndex = void 0;
        if (entryIsClassBased) {
            multiIndex = multiClassesStartIndex +
                ((totalCurrentClassBindings + adjustedIndex) * 4 /* Size */);
            singleIndex = singleClassesStartIndex +
                ((totalCurrentClassBindings + adjustedIndex) * 4 /* Size */);
        }
        else {
            multiIndex =
                multiStylesStartIndex + ((totalCurrentStyleBindings + adjustedIndex) * 4 /* Size */);
            singleIndex = singleStylesStartIndex +
                ((totalCurrentStyleBindings + adjustedIndex) * 4 /* Size */);
        }
        // if a property is not found in the initial style values list then it
        // is ALWAYS added incase a follow-up directive introduces the same initial
        // style/class value later on.
        var initialValuesToLookup = entryIsClassBased ? initialClasses : initialStyles;
        var indexForInitial = getInitialStylingValuesIndexOf(initialValuesToLookup, propName);
        if (indexForInitial === -1) {
            indexForInitial = initialValuesToLookup.length + 1 /* ValueOffset */;
            initialValuesToLookup.push(propName, entryIsClassBased ? false : null);
        }
        else {
            indexForInitial += 1 /* ValueOffset */;
        }
        var initialFlag = prepareInitialFlag(context, propName, entryIsClassBased, styleSanitizer || null);
        setFlag(context, singleIndex, pointers(initialFlag, indexForInitial, multiIndex));
        setProp(context, singleIndex, propName);
        setValue(context, singleIndex, null);
        setPlayerBuilderIndex(context, singleIndex, 0, directiveIndex);
        setFlag(context, multiIndex, pointers(initialFlag, indexForInitial, singleIndex));
        setProp(context, multiIndex, propName);
        setValue(context, multiIndex, null);
        setPlayerBuilderIndex(context, multiIndex, 0, directiveIndex);
    }
    // the total classes/style values are updated so the next time the context is patched
    // additional style/class bindings from another directive then it knows exactly where
    // to insert them in the context
    singlePropOffsetValues[1 /* ClassesCountPosition */] =
        totalCurrentClassBindings + filteredClassBindingNames.length;
    singlePropOffsetValues[0 /* StylesCountPosition */] =
        totalCurrentStyleBindings + filteredStyleBindingNames.length;
    // there is no initial value flag for the master index since it doesn't
    // reference an initial style value
    var masterFlag = pointers(0, 0, multiStylesStartIndex) |
        (onlyProcessSingleClasses ? 16 /* OnlyProcessSingleClasses */ : 0);
    setFlag(context, 0 /* MasterFlagPosition */, masterFlag);
}
/**
 * Searches through the existing registry of directives
 */
function findOrPatchDirectiveIntoRegistry(context, directiveRef, styleSanitizer) {
    var directiveRefs = context[1 /* DirectiveRegistryPosition */];
    var nextOffsetInsertionIndex = context[4 /* SinglePropOffsetPositions */].length;
    var directiveIndex;
    var detectedIndex = getDirectiveRegistryValuesIndexOf(directiveRefs, directiveRef);
    if (detectedIndex === -1) {
        directiveIndex = directiveRefs.length / 4 /* Size */;
        directiveRefs.push(directiveRef, nextOffsetInsertionIndex, false, styleSanitizer || null);
    }
    else {
        var singlePropStartPosition = detectedIndex + 1 /* SinglePropValuesIndexOffset */;
        if (directiveRefs[singlePropStartPosition] >= 0) {
            // the directive has already been patched into the context
            return -1;
        }
        directiveIndex = detectedIndex / 4 /* Size */;
        // because the directive already existed this means that it was set during elementHostAttrs or
        // elementStart which means that the binding values were not here. Therefore, the values below
        // need to be applied so that single class and style properties can be assigned later.
        var singlePropPositionIndex = detectedIndex + 1 /* SinglePropValuesIndexOffset */;
        directiveRefs[singlePropPositionIndex] = nextOffsetInsertionIndex;
        // the sanitizer is also apart of the binding process and will be used when bindings are
        // applied.
        var styleSanitizerIndex = detectedIndex + 3 /* StyleSanitizerOffset */;
        directiveRefs[styleSanitizerIndex] = styleSanitizer || null;
    }
    return directiveIndex;
}
function getMatchingBindingIndex(context, bindingName, start, end) {
    for (var j = start; j < end; j += 4 /* Size */) {
        if (getProp(context, j) === bindingName)
            return j;
    }
    return -1;
}
/**
 * Sets and resolves all `multi` styling on an `StylingContext` so that they can be
 * applied to the element once `renderStyling` is called.
 *
 * All missing styles/class (any values that are not provided in the new `styles`
 * or `classes` params) will resolve to `null` within their respective positions
 * in the context.
 *
 * @param context The styling context that will be updated with the
 *    newly provided style values.
 * @param classesInput The key/value map of CSS class names that will be used for the update.
 * @param stylesInput The key/value map of CSS styles that will be used for the update.
 */
export function updateStylingMap(context, classesInput, stylesInput, directiveRef) {
    stylesInput = stylesInput || null;
    var directiveIndex = getDirectiveIndexFromRegistry(context, directiveRef || null);
    var element = context[5 /* ElementPosition */];
    var classesPlayerBuilder = classesInput instanceof BoundPlayerFactory ?
        new ClassAndStylePlayerBuilder(classesInput, element, 1 /* Class */) :
        null;
    var stylesPlayerBuilder = stylesInput instanceof BoundPlayerFactory ?
        new ClassAndStylePlayerBuilder(stylesInput, element, 2 /* Style */) :
        null;
    var classesValue = classesPlayerBuilder ?
        classesInput.value :
        classesInput;
    var stylesValue = stylesPlayerBuilder ? stylesInput.value : stylesInput;
    // early exit (this is what's done to avoid using ctx.bind() to cache the value)
    var ignoreAllClassUpdates = limitToSingleClasses(context) || classesValue === NO_CHANGE ||
        classesValue === context[6 /* CachedClassValueOrInitialClassString */];
    var ignoreAllStyleUpdates = stylesValue === NO_CHANGE || stylesValue === context[7 /* CachedStyleValue */];
    if (ignoreAllClassUpdates && ignoreAllStyleUpdates)
        return;
    context[6 /* CachedClassValueOrInitialClassString */] = classesValue;
    context[7 /* CachedStyleValue */] = stylesValue;
    var classNames = EMPTY_ARRAY;
    var applyAllClasses = false;
    var playerBuildersAreDirty = false;
    var classesPlayerBuilderIndex = classesPlayerBuilder ? 1 /* ClassMapPlayerBuilderPosition */ : 0;
    if (hasPlayerBuilderChanged(context, classesPlayerBuilder, 1 /* ClassMapPlayerBuilderPosition */)) {
        setPlayerBuilder(context, classesPlayerBuilder, 1 /* ClassMapPlayerBuilderPosition */);
        playerBuildersAreDirty = true;
    }
    var stylesPlayerBuilderIndex = stylesPlayerBuilder ? 3 /* StyleMapPlayerBuilderPosition */ : 0;
    if (hasPlayerBuilderChanged(context, stylesPlayerBuilder, 3 /* StyleMapPlayerBuilderPosition */)) {
        setPlayerBuilder(context, stylesPlayerBuilder, 3 /* StyleMapPlayerBuilderPosition */);
        playerBuildersAreDirty = true;
    }
    // each time a string-based value pops up then it shouldn't require a deep
    // check of what's changed.
    if (!ignoreAllClassUpdates) {
        if (typeof classesValue == 'string') {
            classNames = classesValue.split(/\s+/);
            // this boolean is used to avoid having to create a key/value map of `true` values
            // since a classname string implies that all those classes are added
            applyAllClasses = true;
        }
        else {
            classNames = classesValue ? Object.keys(classesValue) : EMPTY_ARRAY;
        }
    }
    var classes = (classesValue || EMPTY_OBJ);
    var styleProps = stylesValue ? Object.keys(stylesValue) : EMPTY_ARRAY;
    var styles = stylesValue || EMPTY_OBJ;
    var classesStartIndex = styleProps.length;
    var multiStartIndex = getMultiStartIndex(context);
    var dirty = false;
    var ctxIndex = multiStartIndex;
    var propIndex = 0;
    var propLimit = styleProps.length + classNames.length;
    // the main loop here will try and figure out how the shape of the provided
    // styles differ with respect to the context. Later if the context/styles/classes
    // are off-balance then they will be dealt in another loop after this one
    while (ctxIndex < context.length && propIndex < propLimit) {
        var isClassBased = propIndex >= classesStartIndex;
        var processValue = (!isClassBased && !ignoreAllStyleUpdates) || (isClassBased && !ignoreAllClassUpdates);
        // when there is a cache-hit for a string-based class then we should
        // avoid doing any work diffing any of the changes
        if (processValue) {
            var adjustedPropIndex = isClassBased ? propIndex - classesStartIndex : propIndex;
            var newProp = isClassBased ? classNames[adjustedPropIndex] : styleProps[adjustedPropIndex];
            var newValue = isClassBased ? (applyAllClasses ? true : classes[newProp]) : styles[newProp];
            var playerBuilderIndex = isClassBased ? classesPlayerBuilderIndex : stylesPlayerBuilderIndex;
            var prop = getProp(context, ctxIndex);
            if (prop === newProp) {
                var value = getValue(context, ctxIndex);
                var flag = getPointers(context, ctxIndex);
                setPlayerBuilderIndex(context, ctxIndex, playerBuilderIndex, directiveIndex);
                if (hasValueChanged(flag, value, newValue)) {
                    setValue(context, ctxIndex, newValue);
                    playerBuildersAreDirty = playerBuildersAreDirty || !!playerBuilderIndex;
                    var initialValue = getInitialValue(context, flag);
                    // SKIP IF INITIAL CHECK
                    // If the former `value` is `null` then it means that an initial value
                    // could be being rendered on screen. If that is the case then there is
                    // no point in updating the value incase it matches. In other words if the
                    // new value is the exact same as the previously rendered value (which
                    // happens to be the initial value) then do nothing.
                    if (value != null || hasValueChanged(flag, initialValue, newValue)) {
                        setDirty(context, ctxIndex, true);
                        dirty = true;
                    }
                }
            }
            else {
                var indexOfEntry = findEntryPositionByProp(context, newProp, ctxIndex);
                if (indexOfEntry > 0) {
                    // it was found at a later point ... just swap the values
                    var valueToCompare = getValue(context, indexOfEntry);
                    var flagToCompare = getPointers(context, indexOfEntry);
                    swapMultiContextEntries(context, ctxIndex, indexOfEntry);
                    if (hasValueChanged(flagToCompare, valueToCompare, newValue)) {
                        var initialValue = getInitialValue(context, flagToCompare);
                        setValue(context, ctxIndex, newValue);
                        // same if statement logic as above (look for SKIP IF INITIAL CHECK).
                        if (valueToCompare != null || hasValueChanged(flagToCompare, initialValue, newValue)) {
                            setDirty(context, ctxIndex, true);
                            playerBuildersAreDirty = playerBuildersAreDirty || !!playerBuilderIndex;
                            dirty = true;
                        }
                    }
                }
                else {
                    // we only care to do this if the insertion is in the middle
                    var newFlag = prepareInitialFlag(context, newProp, isClassBased, getStyleSanitizer(context, directiveIndex));
                    playerBuildersAreDirty = playerBuildersAreDirty || !!playerBuilderIndex;
                    insertNewMultiProperty(context, ctxIndex, isClassBased, newProp, newFlag, newValue, directiveIndex, playerBuilderIndex);
                    dirty = true;
                }
            }
        }
        ctxIndex += 4 /* Size */;
        propIndex++;
    }
    // this means that there are left-over values in the context that
    // were not included in the provided styles/classes and in this
    // case the  goal is to "remove" them from the context (by nullifying)
    while (ctxIndex < context.length) {
        var flag = getPointers(context, ctxIndex);
        var isClassBased = (flag & 2 /* Class */) === 2 /* Class */;
        var processValue = (!isClassBased && !ignoreAllStyleUpdates) || (isClassBased && !ignoreAllClassUpdates);
        if (processValue) {
            var value = getValue(context, ctxIndex);
            var doRemoveValue = valueExists(value, isClassBased);
            if (doRemoveValue) {
                setDirty(context, ctxIndex, true);
                setValue(context, ctxIndex, null);
                // we keep the player factory the same so that the `nulled` value can
                // be instructed into the player because removing a style and/or a class
                // is a valid animation player instruction.
                var playerBuilderIndex = isClassBased ? classesPlayerBuilderIndex : stylesPlayerBuilderIndex;
                setPlayerBuilderIndex(context, ctxIndex, playerBuilderIndex, directiveIndex);
                dirty = true;
            }
        }
        ctxIndex += 4 /* Size */;
    }
    // this means that there are left-over properties in the context that
    // were not detected in the context during the loop above. In that
    // case we want to add the new entries into the list
    var sanitizer = getStyleSanitizer(context, directiveIndex);
    while (propIndex < propLimit) {
        var isClassBased = propIndex >= classesStartIndex;
        var processValue = (!isClassBased && !ignoreAllStyleUpdates) || (isClassBased && !ignoreAllClassUpdates);
        if (processValue) {
            var adjustedPropIndex = isClassBased ? propIndex - classesStartIndex : propIndex;
            var prop = isClassBased ? classNames[adjustedPropIndex] : styleProps[adjustedPropIndex];
            var value = isClassBased ? (applyAllClasses ? true : classes[prop]) : styles[prop];
            var flag = prepareInitialFlag(context, prop, isClassBased, sanitizer) | 1 /* Dirty */;
            var playerBuilderIndex = isClassBased ? classesPlayerBuilderIndex : stylesPlayerBuilderIndex;
            var ctxIndex_1 = context.length;
            context.push(flag, prop, value, 0);
            setPlayerBuilderIndex(context, ctxIndex_1, playerBuilderIndex, directiveIndex);
            dirty = true;
        }
        propIndex++;
    }
    if (dirty) {
        setContextDirty(context, true);
        setDirectiveDirty(context, directiveIndex, true);
    }
    if (playerBuildersAreDirty) {
        setContextPlayersDirty(context, true);
    }
}
/**
 * This method will toggle the referenced CSS class (by the provided index)
 * within the given context.
 *
 * @param context The styling context that will be updated with the
 *    newly provided class value.
 * @param offset The index of the CSS class which is being updated.
 * @param addOrRemove Whether or not to add or remove the CSS class
 */
export function updateClassProp(context, offset, addOrRemove, directiveRef) {
    _updateSingleStylingValue(context, offset, addOrRemove, true, directiveRef);
}
/**
 * Sets and resolves a single style value on the provided `StylingContext` so
 * that they can be applied to the element once `renderStyling` is called.
 *
 * Note that prop-level styling values are considered higher priority than any styling that
 * has been applied using `updateStylingMap`, therefore, when styling values are rendered
 * then any styles/classes that have been applied using this function will be considered first
 * (then multi values second and then initial values as a backup).
 *
 * @param context The styling context that will be updated with the
 *    newly provided style value.
 * @param offset The index of the property which is being updated.
 * @param value The CSS style value that will be assigned
 * @param directiveRef an optional reference to the directive responsible
 *    for this binding change. If present then style binding will only
 *    actualize if the directive has ownership over this binding
 *    (see styling.ts#directives for more information about the algorithm).
 */
export function updateStyleProp(context, offset, input, directiveRef) {
    _updateSingleStylingValue(context, offset, input, false, directiveRef);
}
function _updateSingleStylingValue(context, offset, input, isClassBased, directiveRef) {
    var directiveIndex = getDirectiveIndexFromRegistry(context, directiveRef || null);
    var singleIndex = getSinglePropIndexValue(context, directiveIndex, offset, isClassBased);
    var currValue = getValue(context, singleIndex);
    var currFlag = getPointers(context, singleIndex);
    var currDirective = getDirectiveIndexFromEntry(context, singleIndex);
    var value = (input instanceof BoundPlayerFactory) ? input.value : input;
    if (hasValueChanged(currFlag, currValue, value) &&
        allowValueChange(currValue, value, currDirective, directiveIndex)) {
        var isClassBased_1 = (currFlag & 2 /* Class */) === 2 /* Class */;
        var element = context[5 /* ElementPosition */];
        var playerBuilder = input instanceof BoundPlayerFactory ?
            new ClassAndStylePlayerBuilder(input, element, isClassBased_1 ? 1 /* Class */ : 2 /* Style */) :
            null;
        var value_1 = (playerBuilder ? input.value : input);
        var currPlayerIndex = getPlayerBuilderIndex(context, singleIndex);
        var playerBuildersAreDirty = false;
        var playerBuilderIndex = playerBuilder ? currPlayerIndex : 0;
        if (hasPlayerBuilderChanged(context, playerBuilder, currPlayerIndex)) {
            var newIndex = setPlayerBuilder(context, playerBuilder, currPlayerIndex);
            playerBuilderIndex = playerBuilder ? newIndex : 0;
            playerBuildersAreDirty = true;
        }
        if (playerBuildersAreDirty || currDirective !== directiveIndex) {
            setPlayerBuilderIndex(context, singleIndex, playerBuilderIndex, directiveIndex);
        }
        if (currDirective !== directiveIndex) {
            var prop = getProp(context, singleIndex);
            var sanitizer = getStyleSanitizer(context, directiveIndex);
            setSanitizeFlag(context, singleIndex, (sanitizer && sanitizer(prop)) ? true : false);
        }
        // the value will always get updated (even if the dirty flag is skipped)
        setValue(context, singleIndex, value_1);
        var indexForMulti = getMultiOrSingleIndex(currFlag);
        // if the value is the same in the multi-area then there's no point in re-assembling
        var valueForMulti = getValue(context, indexForMulti);
        if (!valueForMulti || hasValueChanged(currFlag, valueForMulti, value_1)) {
            var multiDirty = false;
            var singleDirty = true;
            // only when the value is set to `null` should the multi-value get flagged
            if (!valueExists(value_1, isClassBased_1) && valueExists(valueForMulti, isClassBased_1)) {
                multiDirty = true;
                singleDirty = false;
            }
            setDirty(context, indexForMulti, multiDirty);
            setDirty(context, singleIndex, singleDirty);
            setDirectiveDirty(context, directiveIndex, true);
            setContextDirty(context, true);
        }
        if (playerBuildersAreDirty) {
            setContextPlayersDirty(context, true);
        }
    }
}
/**
 * Renders all queued styling using a renderer onto the given element.
 *
 * This function works by rendering any styles (that have been applied
 * using `updateStylingMap`) and any classes (that have been applied using
 * `updateStyleProp`) onto the provided element using the provided renderer.
 * Just before the styles/classes are rendered a final key/value style map
 * will be assembled (if `styleStore` or `classStore` are provided).
 *
 * @param lElement the element that the styles will be rendered on
 * @param context The styling context that will be used to determine
 *      what styles will be rendered
 * @param renderer the renderer that will be used to apply the styling
 * @param classesStore if provided, the updated class values will be applied
 *    to this key/value map instead of being renderered via the renderer.
 * @param stylesStore if provided, the updated style values will be applied
 *    to this key/value map instead of being renderered via the renderer.
 * @param directiveRef an optional directive that will be used to target which
 *    styling values are rendered. If left empty, only the bindings that are
 *    registered on the template will be rendered.
 * @returns number the total amount of players that got queued for animation (if any)
 */
export function renderStyling(context, renderer, rootOrView, isFirstRender, classesStore, stylesStore, directiveRef) {
    var totalPlayersQueued = 0;
    var targetDirectiveIndex = getDirectiveIndexFromRegistry(context, directiveRef || null);
    if (isContextDirty(context) && isDirectiveDirty(context, targetDirectiveIndex)) {
        var flushPlayerBuilders = context[0 /* MasterFlagPosition */] & 8 /* PlayerBuildersDirty */;
        var native = context[5 /* ElementPosition */];
        var multiStartIndex = getMultiStartIndex(context);
        var onlySingleClasses = limitToSingleClasses(context);
        var stillDirty = false;
        for (var i = 9 /* SingleStylesStartPosition */; i < context.length; i += 4 /* Size */) {
            // there is no point in rendering styles that have not changed on screen
            if (isDirty(context, i)) {
                var flag = getPointers(context, i);
                var directiveIndex = getDirectiveIndexFromEntry(context, i);
                if (targetDirectiveIndex !== directiveIndex) {
                    stillDirty = true;
                    continue;
                }
                var prop = getProp(context, i);
                var value = getValue(context, i);
                var styleSanitizer = (flag & 4 /* Sanitize */) ? getStyleSanitizer(context, directiveIndex) : null;
                var playerBuilder = getPlayerBuilder(context, i);
                var isClassBased = flag & 2 /* Class */ ? true : false;
                var isInSingleRegion = i < multiStartIndex;
                var readInitialValue = !isClassBased || !onlySingleClasses;
                var valueToApply = value;
                // VALUE DEFER CASE 1: Use a multi value instead of a null single value
                // this check implies that a single value was removed and we
                // should now defer to a multi value and use that (if set).
                if (isInSingleRegion && !valueExists(valueToApply, isClassBased)) {
                    // single values ALWAYS have a reference to a multi index
                    var multiIndex = getMultiOrSingleIndex(flag);
                    valueToApply = getValue(context, multiIndex);
                }
                // VALUE DEFER CASE 2: Use the initial value if all else fails (is falsy)
                // the initial value will always be a string or null,
                // therefore we can safely adopt it incase there's nothing else
                // note that this should always be a falsy check since `false` is used
                // for both class and style comparisons (styles can't be false and false
                // classes are turned off and should therefore defer to their initial values)
                // Note that we ignore class-based deferals because otherwise a class can never
                // be removed in the case that it exists as true in the initial classes list...
                if (!isClassBased && !valueExists(valueToApply, isClassBased) && readInitialValue) {
                    valueToApply = getInitialValue(context, flag);
                }
                // if the first render is true then we do not want to start applying falsy
                // values to the DOM element's styling. Otherwise then we know there has
                // been a change and even if it's falsy then it's removing something that
                // was truthy before.
                var doApplyValue = isFirstRender ? valueToApply : true;
                if (doApplyValue) {
                    if (isClassBased) {
                        setClass(native, prop, valueToApply ? true : false, renderer, classesStore, playerBuilder);
                    }
                    else {
                        setStyle(native, prop, valueToApply, renderer, styleSanitizer, stylesStore, playerBuilder);
                    }
                }
                setDirty(context, i, false);
            }
        }
        if (flushPlayerBuilders) {
            var rootContext = Array.isArray(rootOrView) ? getRootContext(rootOrView) : rootOrView;
            var playerContext = getPlayerContext(context);
            var playersStartIndex = playerContext[0 /* NonBuilderPlayersStart */];
            for (var i = 1 /* PlayerBuildersStartPosition */; i < playersStartIndex; i += 2 /* PlayerAndPlayerBuildersTupleSize */) {
                var builder = playerContext[i];
                var playerInsertionIndex = i + 1 /* PlayerOffsetPosition */;
                var oldPlayer = playerContext[playerInsertionIndex];
                if (builder) {
                    var player = builder.buildPlayer(oldPlayer, isFirstRender);
                    if (player !== undefined) {
                        if (player != null) {
                            var wasQueued = addPlayerInternal(playerContext, rootContext, native, player, playerInsertionIndex);
                            wasQueued && totalPlayersQueued++;
                        }
                        if (oldPlayer) {
                            oldPlayer.destroy();
                        }
                    }
                }
                else if (oldPlayer) {
                    // the player builder has been removed ... therefore we should delete the associated
                    // player
                    oldPlayer.destroy();
                }
            }
            setContextPlayersDirty(context, false);
        }
        setDirectiveDirty(context, targetDirectiveIndex, false);
        setContextDirty(context, stillDirty);
    }
    return totalPlayersQueued;
}
/**
 * This function renders a given CSS prop/value entry using the
 * provided renderer. If a `store` value is provided then
 * that will be used a render context instead of the provided
 * renderer.
 *
 * @param native the DOM Element
 * @param prop the CSS style property that will be rendered
 * @param value the CSS style value that will be rendered
 * @param renderer
 * @param store an optional key/value map that will be used as a context to render styles on
 */
export function setStyle(native, prop, value, renderer, sanitizer, store, playerBuilder) {
    value = sanitizer && value ? sanitizer(prop, value) : value;
    if (store || playerBuilder) {
        if (store) {
            store.setValue(prop, value);
        }
        if (playerBuilder) {
            playerBuilder.setValue(prop, value);
        }
    }
    else if (value) {
        value = value.toString(); // opacity, z-index and flexbox all have number values which may not
        // assign as numbers
        ngDevMode && ngDevMode.rendererSetStyle++;
        isProceduralRenderer(renderer) ?
            renderer.setStyle(native, prop, value, RendererStyleFlags3.DashCase) :
            native['style'].setProperty(prop, value);
    }
    else {
        ngDevMode && ngDevMode.rendererRemoveStyle++;
        isProceduralRenderer(renderer) ?
            renderer.removeStyle(native, prop, RendererStyleFlags3.DashCase) :
            native['style'].removeProperty(prop);
    }
}
/**
 * This function renders a given CSS class value using the provided
 * renderer (by adding or removing it from the provided element).
 * If a `store` value is provided then that will be used a render
 * context instead of the provided renderer.
 *
 * @param native the DOM Element
 * @param prop the CSS style property that will be rendered
 * @param value the CSS style value that will be rendered
 * @param renderer
 * @param store an optional key/value map that will be used as a context to render styles on
 */
function setClass(native, className, add, renderer, store, playerBuilder) {
    if (store || playerBuilder) {
        if (store) {
            store.setValue(className, add);
        }
        if (playerBuilder) {
            playerBuilder.setValue(className, add);
        }
    }
    else if (add) {
        ngDevMode && ngDevMode.rendererAddClass++;
        isProceduralRenderer(renderer) ? renderer.addClass(native, className) :
            native['classList'].add(className);
    }
    else {
        ngDevMode && ngDevMode.rendererRemoveClass++;
        isProceduralRenderer(renderer) ? renderer.removeClass(native, className) :
            native['classList'].remove(className);
    }
}
function setSanitizeFlag(context, index, sanitizeYes) {
    if (sanitizeYes) {
        context[index] |= 4 /* Sanitize */;
    }
    else {
        context[index] &= ~4 /* Sanitize */;
    }
}
function setDirty(context, index, isDirtyYes) {
    var adjustedIndex = index >= 9 /* SingleStylesStartPosition */ ? (index + 0 /* FlagsOffset */) : index;
    if (isDirtyYes) {
        context[adjustedIndex] |= 1 /* Dirty */;
    }
    else {
        context[adjustedIndex] &= ~1 /* Dirty */;
    }
}
function isDirty(context, index) {
    var adjustedIndex = index >= 9 /* SingleStylesStartPosition */ ? (index + 0 /* FlagsOffset */) : index;
    return (context[adjustedIndex] & 1 /* Dirty */) == 1 /* Dirty */;
}
export function isClassBasedValue(context, index) {
    var adjustedIndex = index >= 9 /* SingleStylesStartPosition */ ? (index + 0 /* FlagsOffset */) : index;
    return (context[adjustedIndex] & 2 /* Class */) == 2 /* Class */;
}
function isSanitizable(context, index) {
    var adjustedIndex = index >= 9 /* SingleStylesStartPosition */ ? (index + 0 /* FlagsOffset */) : index;
    return (context[adjustedIndex] & 4 /* Sanitize */) == 4 /* Sanitize */;
}
function pointers(configFlag, staticIndex, dynamicIndex) {
    return (configFlag & 63 /* BitMask */) | (staticIndex << 6 /* BitCountSize */) |
        (dynamicIndex << (14 /* BitCountSize */ + 6 /* BitCountSize */));
}
function getInitialValue(context, flag) {
    var index = getInitialIndex(flag);
    var entryIsClassBased = flag & 2 /* Class */;
    var initialValues = entryIsClassBased ? context[3 /* InitialClassValuesPosition */] :
        context[2 /* InitialStyleValuesPosition */];
    return initialValues[index];
}
function getInitialIndex(flag) {
    return (flag >> 6 /* BitCountSize */) & 16383 /* BitMask */;
}
function getMultiOrSingleIndex(flag) {
    var index = (flag >> (14 /* BitCountSize */ + 6 /* BitCountSize */)) & 16383 /* BitMask */;
    return index >= 9 /* SingleStylesStartPosition */ ? index : -1;
}
function getMultiStartIndex(context) {
    return getMultiOrSingleIndex(context[0 /* MasterFlagPosition */]);
}
function setProp(context, index, prop) {
    context[index + 1 /* PropertyOffset */] = prop;
}
function setValue(context, index, value) {
    context[index + 2 /* ValueOffset */] = value;
}
function hasPlayerBuilderChanged(context, builder, index) {
    var playerContext = context[8 /* PlayerContext */];
    if (builder) {
        if (!playerContext || index === 0) {
            return true;
        }
    }
    else if (!playerContext) {
        return false;
    }
    return playerContext[index] !== builder;
}
function setPlayerBuilder(context, builder, insertionIndex) {
    var playerContext = context[8 /* PlayerContext */] || allocPlayerContext(context);
    if (insertionIndex > 0) {
        playerContext[insertionIndex] = builder;
    }
    else {
        insertionIndex = playerContext[0 /* NonBuilderPlayersStart */];
        playerContext.splice(insertionIndex, 0, builder, null);
        playerContext[0 /* NonBuilderPlayersStart */] +=
            2 /* PlayerAndPlayerBuildersTupleSize */;
    }
    return insertionIndex;
}
export function directiveOwnerPointers(directiveIndex, playerIndex) {
    return (playerIndex << 16 /* BitCountSize */) | directiveIndex;
}
function setPlayerBuilderIndex(context, index, playerBuilderIndex, directiveIndex) {
    var value = directiveOwnerPointers(directiveIndex, playerBuilderIndex);
    context[index + 3 /* PlayerBuilderIndexOffset */] = value;
}
function getPlayerBuilderIndex(context, index) {
    var flag = context[index + 3 /* PlayerBuilderIndexOffset */];
    var playerBuilderIndex = (flag >> 16 /* BitCountSize */) &
        65535 /* BitMask */;
    return playerBuilderIndex;
}
function getPlayerBuilder(context, index) {
    var playerBuilderIndex = getPlayerBuilderIndex(context, index);
    if (playerBuilderIndex) {
        var playerContext = context[8 /* PlayerContext */];
        if (playerContext) {
            return playerContext[playerBuilderIndex];
        }
    }
    return null;
}
function setFlag(context, index, flag) {
    var adjustedIndex = index === 0 /* MasterFlagPosition */ ? index : (index + 0 /* FlagsOffset */);
    context[adjustedIndex] = flag;
}
function getPointers(context, index) {
    var adjustedIndex = index === 0 /* MasterFlagPosition */ ? index : (index + 0 /* FlagsOffset */);
    return context[adjustedIndex];
}
export function getValue(context, index) {
    return context[index + 2 /* ValueOffset */];
}
export function getProp(context, index) {
    return context[index + 1 /* PropertyOffset */];
}
export function isContextDirty(context) {
    return isDirty(context, 0 /* MasterFlagPosition */);
}
export function limitToSingleClasses(context) {
    return context[0 /* MasterFlagPosition */] & 16 /* OnlyProcessSingleClasses */;
}
export function setContextDirty(context, isDirtyYes) {
    setDirty(context, 0 /* MasterFlagPosition */, isDirtyYes);
}
export function setContextPlayersDirty(context, isDirtyYes) {
    if (isDirtyYes) {
        context[0 /* MasterFlagPosition */] |= 8 /* PlayerBuildersDirty */;
    }
    else {
        context[0 /* MasterFlagPosition */] &= ~8 /* PlayerBuildersDirty */;
    }
}
function findEntryPositionByProp(context, prop, startIndex) {
    for (var i = (startIndex || 0) + 1 /* PropertyOffset */; i < context.length; i += 4 /* Size */) {
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
    var tmpPlayerBuilderIndex = getPlayerBuilderIndex(context, indexA);
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
    var playerIndexA = getPlayerBuilderIndex(context, indexB);
    var directiveIndexA = 0;
    setPlayerBuilderIndex(context, indexA, playerIndexA, directiveIndexA);
    setValue(context, indexB, tmpValue);
    setProp(context, indexB, tmpProp);
    setFlag(context, indexB, tmpFlag);
    setPlayerBuilderIndex(context, indexB, tmpPlayerBuilderIndex, directiveIndexA);
}
function updateSinglePointerValues(context, indexStartPosition) {
    for (var i = indexStartPosition; i < context.length; i += 4 /* Size */) {
        var multiFlag = getPointers(context, i);
        var singleIndex = getMultiOrSingleIndex(multiFlag);
        if (singleIndex > 0) {
            var singleFlag = getPointers(context, singleIndex);
            var initialIndexForSingle = getInitialIndex(singleFlag);
            var flagValue = (isDirty(context, singleIndex) ? 1 /* Dirty */ : 0 /* None */) |
                (isClassBasedValue(context, singleIndex) ? 2 /* Class */ : 0 /* None */) |
                (isSanitizable(context, singleIndex) ? 4 /* Sanitize */ : 0 /* None */);
            var updatedFlag = pointers(flagValue, initialIndexForSingle, i);
            setFlag(context, singleIndex, updatedFlag);
        }
    }
}
function insertNewMultiProperty(context, index, classBased, name, flag, value, directiveIndex, playerIndex) {
    var doShift = index < context.length;
    // prop does not exist in the list, add it in
    context.splice(index, 0, flag | 1 /* Dirty */ | (classBased ? 2 /* Class */ : 0 /* None */), name, value, 0);
    setPlayerBuilderIndex(context, index, playerIndex, directiveIndex);
    if (doShift) {
        // because the value was inserted midway into the array then we
        // need to update all the shifted multi values' single value
        // pointers to point to the newly shifted location
        updateSinglePointerValues(context, index + 4 /* Size */);
    }
}
function valueExists(value, isClassBased) {
    if (isClassBased) {
        return value ? true : false;
    }
    return value !== null;
}
function prepareInitialFlag(context, prop, entryIsClassBased, sanitizer) {
    var flag = (sanitizer && sanitizer(prop)) ? 4 /* Sanitize */ : 0 /* None */;
    var initialIndex;
    if (entryIsClassBased) {
        flag |= 2 /* Class */;
        initialIndex =
            getInitialStylingValuesIndexOf(context[3 /* InitialClassValuesPosition */], prop);
    }
    else {
        initialIndex =
            getInitialStylingValuesIndexOf(context[2 /* InitialStyleValuesPosition */], prop);
    }
    initialIndex = initialIndex > 0 ? (initialIndex + 1 /* ValueOffset */) : 0;
    return pointers(flag, initialIndex, 0);
}
function hasValueChanged(flag, a, b) {
    var isClassBased = flag & 2 /* Class */;
    var hasValues = a && b;
    var usesSanitizer = flag & 4 /* Sanitize */;
    // the toString() comparison ensures that a value is checked
    // ... otherwise (during sanitization bypassing) the === comparsion
    // would fail since a new String() instance is created
    if (!isClassBased && hasValues && usesSanitizer) {
        // we know for sure we're dealing with strings at this point
        return a.toString() !== b.toString();
    }
    // everything else is safe to check with a normal equality check
    return a !== b;
}
var ClassAndStylePlayerBuilder = /** @class */ (function () {
    function ClassAndStylePlayerBuilder(factory, _element, _type) {
        this._element = _element;
        this._type = _type;
        this._values = {};
        this._dirty = false;
        this._factory = factory;
    }
    ClassAndStylePlayerBuilder.prototype.setValue = function (prop, value) {
        if (this._values[prop] !== value) {
            this._values[prop] = value;
            this._dirty = true;
        }
    };
    ClassAndStylePlayerBuilder.prototype.buildPlayer = function (currentPlayer, isFirstRender) {
        // if no values have been set here then this means the binding didn't
        // change and therefore the binding values were not updated through
        // `setValue` which means no new player will be provided.
        if (this._dirty) {
            var player = this._factory.fn(this._element, this._type, this._values, isFirstRender, currentPlayer || null);
            this._values = {};
            this._dirty = false;
            return player;
        }
        return undefined;
    };
    return ClassAndStylePlayerBuilder;
}());
export { ClassAndStylePlayerBuilder };
export function generateConfigSummary(source, index) {
    var flag, name = 'config value for ';
    if (Array.isArray(source)) {
        if (index) {
            name += 'index: ' + index;
        }
        else {
            name += 'master config';
        }
        index = index || 0 /* MasterFlagPosition */;
        flag = source[index];
    }
    else {
        flag = source;
        name += 'index: ' + flag;
    }
    var dynamicIndex = getMultiOrSingleIndex(flag);
    var staticIndex = getInitialIndex(flag);
    return {
        name: name,
        staticIndex: staticIndex,
        dynamicIndex: dynamicIndex,
        value: flag,
        flags: {
            dirty: flag & 1 /* Dirty */ ? true : false,
            class: flag & 2 /* Class */ ? true : false,
            sanitize: flag & 4 /* Sanitize */ ? true : false,
            playerBuildersDirty: flag & 8 /* PlayerBuildersDirty */ ? true : false,
            onlyProcessSingleClasses: flag & 16 /* OnlyProcessSingleClasses */ ? true : false,
            bindingAllocationLocked: flag & 32 /* BindingAllocationLocked */ ? true : false,
        }
    };
}
export function getDirectiveIndexFromEntry(context, index) {
    var value = context[index + 3 /* PlayerBuilderIndexOffset */];
    return value & 65535 /* BitMask */;
}
function getDirectiveIndexFromRegistry(context, directive) {
    var index = getDirectiveRegistryValuesIndexOf(context[1 /* DirectiveRegistryPosition */], directive);
    ngDevMode &&
        assertNotEqual(index, -1, "The provided directive " + directive + " has not been allocated to the element's style/class bindings");
    return index > 0 ? index / 4 /* Size */ : 0;
    // return index / DirectiveRegistryValuesIndex.Size;
}
function getDirectiveRegistryValuesIndexOf(directives, directive) {
    for (var i = 0; i < directives.length; i += 4 /* Size */) {
        if (directives[i] === directive) {
            return i;
        }
    }
    return -1;
}
function getInitialStylingValuesIndexOf(keyValues, key) {
    for (var i = 1 /* KeyValueStartPosition */; i < keyValues.length; i += 2 /* Size */) {
        if (keyValues[i] === key)
            return i;
    }
    return -1;
}
export function compareLogSummaries(a, b) {
    var log = [];
    var diffs = [];
    diffSummaryValues(diffs, 'staticIndex', 'staticIndex', a, b);
    diffSummaryValues(diffs, 'dynamicIndex', 'dynamicIndex', a, b);
    Object.keys(a.flags).forEach(function (name) { diffSummaryValues(diffs, 'flags.' + name, name, a.flags, b.flags); });
    if (diffs.length) {
        log.push('Log Summaries for:');
        log.push('  A: ' + a.name);
        log.push('  B: ' + b.name);
        log.push('\n  Differ in the following way (A !== B):');
        diffs.forEach(function (result) {
            var _a = tslib_1.__read(result, 3), name = _a[0], aVal = _a[1], bVal = _a[2];
            log.push('    => ' + name);
            log.push('    => ' + aVal + ' !== ' + bVal + '\n');
        });
    }
    return log;
}
function diffSummaryValues(result, name, prop, a, b) {
    var aVal = a[prop];
    var bVal = b[prop];
    if (aVal !== bVal) {
        result.push([name, aVal, bVal]);
    }
}
function getSinglePropIndexValue(context, directiveIndex, offset, isClassBased) {
    var singlePropOffsetRegistryIndex = context[1 /* DirectiveRegistryPosition */][(directiveIndex * 4 /* Size */) +
        1 /* SinglePropValuesIndexOffset */];
    var offsets = context[4 /* SinglePropOffsetPositions */];
    var indexForOffset = singlePropOffsetRegistryIndex +
        2 /* ValueStartPosition */ +
        (isClassBased ?
            offsets[singlePropOffsetRegistryIndex + 0 /* StylesCountPosition */] :
            0) +
        offset;
    return offsets[indexForOffset];
}
function getStyleSanitizer(context, directiveIndex) {
    var dirs = context[1 /* DirectiveRegistryPosition */];
    var value = dirs[directiveIndex * 4 /* Size */ +
        3 /* StyleSanitizerOffset */] ||
        dirs[3 /* StyleSanitizerOffset */] || null;
    return value;
}
function isDirectiveDirty(context, directiveIndex) {
    var dirs = context[1 /* DirectiveRegistryPosition */];
    return dirs[directiveIndex * 4 /* Size */ +
        2 /* DirtyFlagOffset */];
}
function setDirectiveDirty(context, directiveIndex, dirtyYes) {
    var dirs = context[1 /* DirectiveRegistryPosition */];
    dirs[directiveIndex * 4 /* Size */ +
        2 /* DirtyFlagOffset */] = dirtyYes;
}
function allowValueChange(currentValue, newValue, currentDirectiveOwner, newDirectiveOwner) {
    // the code below relies the importance of directive's being tied to their
    // index value. The index values for each directive are derived from being
    // registered into the styling context directive registry. The most important
    // directive is the parent component directive (the template) and each directive
    // that is added after is considered less important than the previous entry. This
    // prioritization of directives enables the styling algorithm to decide if a style
    // or class should be allowed to be updated/replaced incase an earlier directive
    // already wrote to the exact same style-property or className value. In other words
    // ... this decides what to do if and when there is a collision.
    if (currentValue) {
        if (newValue) {
            // if a directive index is lower than it always has priority over the
            // previous directive's value...
            return newDirectiveOwner <= currentDirectiveOwner;
        }
        else {
            // only write a null value incase it's the same owner writing it.
            // this avoids having a higher-priority directive write to null
            // only to have a lesser-priority directive change right to a
            // non-null value immediately afterwards.
            return currentDirectiveOwner === newDirectiveOwner;
        }
    }
    return true;
}
/**
 * This function is only designed to be called for `[class]` bindings when
 * `[ngClass]` (or something that uses `class` as an input) is present. Once
 * directive host bindings fully work for `[class]` and `[style]` inputs
 * then this can be deleted.
 */
export function getInitialClassNameValue(context) {
    var className = context[6 /* CachedClassValueOrInitialClassString */];
    if (className == null) {
        className = '';
        var initialClassValues = context[3 /* InitialClassValuesPosition */];
        for (var i = 1 /* KeyValueStartPosition */; i < initialClassValues.length; i += 2 /* Size */) {
            var isPresent = initialClassValues[i + 1];
            if (isPresent) {
                className += (className.length ? ' ' : '') + initialClassValues[i];
            }
        }
        context[6 /* CachedClassValueOrInitialClassString */] = className;
    }
    return className;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xhc3NfYW5kX3N0eWxlX2JpbmRpbmdzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9zdHlsaW5nL2NsYXNzX2FuZF9zdHlsZV9iaW5kaW5ncy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBUUEsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQ2pELE9BQU8sRUFBQyxXQUFXLEVBQUUsU0FBUyxFQUFDLE1BQU0sVUFBVSxDQUFDO0FBR2hELE9BQU8sRUFBc0IsbUJBQW1CLEVBQUUsb0JBQW9CLEVBQUMsTUFBTSx3QkFBd0IsQ0FBQztBQUd0RyxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sV0FBVyxDQUFDO0FBQ3BDLE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxTQUFTLENBQUM7QUFFdkMsT0FBTyxFQUFDLGtCQUFrQixFQUFDLE1BQU0sa0JBQWtCLENBQUM7QUFDcEQsT0FBTyxFQUFDLGlCQUFpQixFQUFFLGtCQUFrQixFQUFFLHlCQUF5QixFQUFFLGdCQUFnQixFQUFDLE1BQU0sUUFBUSxDQUFDO0FBSTFHOzs7Ozs7Ozs7OztHQVdHO0FBSUg7O0dBRUc7QUFDSCxNQUFNLFVBQVUsdUJBQXVCLENBQUMsS0FBa0I7SUFDeEQsSUFBTSxPQUFPLEdBQUcseUJBQXlCLEVBQUUsQ0FBQztJQUM1QyxJQUFNLGNBQWMsR0FBeUIsT0FBTyxvQ0FBeUM7UUFDekYsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUNYLElBQU0sYUFBYSxHQUF5QixPQUFPLG9DQUF5QztRQUN4RixDQUFDLElBQUksQ0FBQyxDQUFDO0lBRVgsa0ZBQWtGO0lBQ2xGLDJGQUEyRjtJQUMzRixJQUFJLElBQUksR0FBRyxDQUFDLENBQUMsQ0FBQztJQUNkLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxLQUFLLENBQUMsTUFBTSxF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LEVBQUUsQ0FBQyxHQUFHLGtCQUFrQixDQUFDLE1BQU0sRUFDdEYsQ0FBQyxnQkFBa0MsRUFBRTtZQUN4QyxJQUFNLFNBQVMsR0FBRyxrQkFBa0IsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDNUMsSUFBSSxTQUFTLEVBQUU7Z0JBQ2IsU0FBUyxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxrQkFBa0IsQ0FBQyxDQUFDLENBQUMsQ0FBQzthQUNwRTtTQUNGO1FBQ0QsT0FBTyw4Q0FBbUQsR0FBRyxTQUFTLENBQUM7S0FDeEU7SUFDRCxPQUFPLFNBQVMsQ0FBQztBQUNuQixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4qIEBsaWNlbnNlXG4qIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuKlxuKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4qL1xuaW1wb3J0IHtTdHlsZVNhbml0aXplRm59IGZyb20gJy4uLy4uL3Nhbml0aXphdGlvbi9zdHlsZV9zYW5pdGl6ZXInO1xuaW1wb3J0IHthc3NlcnROb3RFcXVhbH0gZnJvbSAnLi4vLi4vdXRpbC9hc3NlcnQnO1xuaW1wb3J0IHtFTVBUWV9BUlJBWSwgRU1QVFlfT0JKfSBmcm9tICcuLi9lbXB0eSc7XG5pbXBvcnQge0F0dHJpYnV0ZU1hcmtlciwgVEF0dHJpYnV0ZXN9IGZyb20gJy4uL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge0JpbmRpbmdTdG9yZSwgQmluZGluZ1R5cGUsIFBsYXllciwgUGxheWVyQnVpbGRlciwgUGxheWVyRmFjdG9yeSwgUGxheWVySW5kZXh9IGZyb20gJy4uL2ludGVyZmFjZXMvcGxheWVyJztcbmltcG9ydCB7UkVsZW1lbnQsIFJlbmRlcmVyMywgUmVuZGVyZXJTdHlsZUZsYWdzMywgaXNQcm9jZWR1cmFsUmVuZGVyZXJ9IGZyb20gJy4uL2ludGVyZmFjZXMvcmVuZGVyZXInO1xuaW1wb3J0IHtEaXJlY3RpdmVPd25lckFuZFBsYXllckJ1aWxkZXJJbmRleCwgRGlyZWN0aXZlUmVnaXN0cnlWYWx1ZXMsIERpcmVjdGl2ZVJlZ2lzdHJ5VmFsdWVzSW5kZXgsIEluaXRpYWxTdHlsaW5nVmFsdWVzLCBJbml0aWFsU3R5bGluZ1ZhbHVlc0luZGV4LCBTaW5nbGVQcm9wT2Zmc2V0VmFsdWVzLCBTaW5nbGVQcm9wT2Zmc2V0VmFsdWVzSW5kZXgsIFN0eWxpbmdDb250ZXh0LCBTdHlsaW5nRmxhZ3MsIFN0eWxpbmdJbmRleH0gZnJvbSAnLi4vaW50ZXJmYWNlcy9zdHlsaW5nJztcbmltcG9ydCB7TFZpZXcsIFJvb3RDb250ZXh0fSBmcm9tICcuLi9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHtOT19DSEFOR0V9IGZyb20gJy4uL3Rva2Vucyc7XG5pbXBvcnQge2dldFJvb3RDb250ZXh0fSBmcm9tICcuLi91dGlsJztcblxuaW1wb3J0IHtCb3VuZFBsYXllckZhY3Rvcnl9IGZyb20gJy4vcGxheWVyX2ZhY3RvcnknO1xuaW1wb3J0IHthZGRQbGF5ZXJJbnRlcm5hbCwgYWxsb2NQbGF5ZXJDb250ZXh0LCBjcmVhdGVFbXB0eVN0eWxpbmdDb250ZXh0LCBnZXRQbGF5ZXJDb250ZXh0fSBmcm9tICcuL3V0aWwnO1xuXG5cblxuLyoqXG4gKiBUaGlzIGZpbGUgaW5jbHVkZXMgdGhlIGNvZGUgdG8gcG93ZXIgYWxsIHN0eWxpbmctYmluZGluZyBvcGVyYXRpb25zIGluIEFuZ3VsYXIuXG4gKlxuICogVGhlc2UgaW5jbHVkZTpcbiAqIFtzdHlsZV09XCJteVN0eWxlT2JqXCJcbiAqIFtjbGFzc109XCJteUNsYXNzT2JqXCJcbiAqIFtzdHlsZS5wcm9wXT1cIm15UHJvcFZhbHVlXCJcbiAqIFtjbGFzcy5uYW1lXT1cIm15Q2xhc3NWYWx1ZVwiXG4gKlxuICogVGhlcmUgYXJlIG1hbnkgZGlmZmVyZW50IHdheXMgaW4gd2hpY2ggdGhlc2UgZnVuY3Rpb25zIGJlbG93IGFyZSBjYWxsZWQuIFBsZWFzZSBzZWVcbiAqIGBpbnRlcmZhY2VzL3N0eWxlcy50c2AgdG8gZ2V0IGEgYmV0dGVyIGlkZWEgb2YgaG93IHRoZSBzdHlsaW5nIGFsZ29yaXRobSB3b3Jrcy5cbiAqL1xuXG5cblxuLyoqXG4gKiBDcmVhdGVzIGEgbmV3IFN0eWxpbmdDb250ZXh0IGFuIGZpbGxzIGl0IHdpdGggdGhlIHByb3ZpZGVkIHN0YXRpYyBzdHlsaW5nIGF0dHJpYnV0ZSB2YWx1ZXMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbml0aWFsaXplU3RhdGljQ29udGV4dChhdHRyczogVEF0dHJpYnV0ZXMpIHtcbiAgY29uc3QgY29udGV4dCA9IGNyZWF0ZUVtcHR5U3R5bGluZ0NvbnRleHQoKTtcbiAgY29uc3QgaW5pdGlhbENsYXNzZXM6IEluaXRpYWxTdHlsaW5nVmFsdWVzID0gY29udGV4dFtTdHlsaW5nSW5kZXguSW5pdGlhbENsYXNzVmFsdWVzUG9zaXRpb25dID1cbiAgICAgIFtudWxsXTtcbiAgY29uc3QgaW5pdGlhbFN0eWxlczogSW5pdGlhbFN0eWxpbmdWYWx1ZXMgPSBjb250ZXh0W1N0eWxpbmdJbmRleC5Jbml0aWFsU3R5bGVWYWx1ZXNQb3NpdGlvbl0gPVxuICAgICAgW251bGxdO1xuXG4gIC8vIFRoZSBhdHRyaWJ1dGVzIGFycmF5IGhhcyBtYXJrZXIgdmFsdWVzIChudW1iZXJzKSBpbmRpY2F0aW5nIHdoYXQgdGhlIHN1YnNlcXVlbnRcbiAgLy8gdmFsdWVzIHJlcHJlc2VudC4gV2hlbiB3ZSBlbmNvdW50ZXIgYSBudW1iZXIsIHdlIHNldCB0aGUgbW9kZSB0byB0aGF0IHR5cGUgb2YgYXR0cmlidXRlLlxuICBsZXQgbW9kZSA9IC0xO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGF0dHJzLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgYXR0ciA9IGF0dHJzW2ldO1xuICAgIGlmICh0eXBlb2YgYXR0ciA9PSAnbnVtYmVyJykge1xuICAgICAgbW9kZSA9IGF0dHI7XG4gICAgfSBlbHNlIGlmIChtb2RlID09PSBBdHRyaWJ1dGVNYXJrZXIuU3R5bGVzKSB7XG4gICAgICBpbml0aWFsU3R5bGVzLnB1c2goYXR0ciBhcyBzdHJpbmcsIGF0dHJzWysraV0gYXMgc3RyaW5nKTtcbiAgICB9IGVsc2UgaWYgKG1vZGUgPT09IEF0dHJpYnV0ZU1hcmtlci5DbGFzc2VzKSB7XG4gICAgICBpbml0aWFsQ2xhc3Nlcy5wdXNoKGF0dHIgYXMgc3RyaW5nLCB0cnVlKTtcbiAgICB9IGVsc2UgaWYgKG1vZGUgPT09IEF0dHJpYnV0ZU1hcmtlci5TZWxlY3RPbmx5KSB7XG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cblxuICByZXR1cm4gY29udGV4dDtcbn1cblxuLyoqXG4gKiBEZXNpZ25lZCB0byB1cGRhdGUgYW4gZXhpc3Rpbmcgc3R5bGluZyBjb250ZXh0IHdpdGggbmV3IHN0YXRpYyBzdHlsaW5nXG4gKiBkYXRhIChjbGFzc2VzIGFuZCBzdHlsZXMpLlxuICpcbiAqIEBwYXJhbSBjb250ZXh0IHRoZSBleGlzdGluZyBzdHlsaW5nIGNvbnRleHRcbiAqIEBwYXJhbSBhdHRycyBhbiBhcnJheSBvZiBuZXcgc3RhdGljIHN0eWxpbmcgYXR0cmlidXRlcyB0aGF0IHdpbGwgYmVcbiAqICAgICAgICAgICAgICBhc3NpZ25lZCB0byB0aGUgY29udGV4dFxuICogQHBhcmFtIGRpcmVjdGl2ZSB0aGUgZGlyZWN0aXZlIGluc3RhbmNlIHdpdGggd2hpY2ggc3RhdGljIGRhdGEgaXMgYXNzb2NpYXRlZCB3aXRoLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcGF0Y2hDb250ZXh0V2l0aFN0YXRpY0F0dHJzKFxuICAgIGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBhdHRyczogVEF0dHJpYnV0ZXMsIHN0YXJ0aW5nSW5kZXg6IG51bWJlciwgZGlyZWN0aXZlOiBhbnkpOiB2b2lkIHtcbiAgLy8gSWYgdGhlIHN0eWxpbmcgY29udGV4dCBoYXMgYWxyZWFkeSBiZWVuIHBhdGNoZWQgd2l0aCB0aGUgZ2l2ZW4gZGlyZWN0aXZlJ3MgYmluZGluZ3MsXG4gIC8vIHRoZW4gdGhlcmUgaXMgbm8gcG9pbnQgaW4gZG9pbmcgaXQgYWdhaW4uIFRoZSByZWFzb24gd2h5IHRoaXMgbWF5IGhhcHBlbiAodGhlIGRpcmVjdGl2ZVxuICAvLyBzdHlsaW5nIGJlaW5nIHBhdGNoZWQgdHdpY2UpIGlzIGJlY2F1c2UgdGhlIGBzdHlsaW5nQmluZGluZ2AgZnVuY3Rpb24gaXMgY2FsbGVkIGVhY2ggdGltZVxuICAvLyBhbiBlbGVtZW50IGlzIGNyZWF0ZWQgKGJvdGggd2l0aGluIGEgdGVtcGxhdGUgZnVuY3Rpb24gYW5kIHdpdGhpbiBkaXJlY3RpdmUgaG9zdCBiaW5kaW5ncykuXG4gIGNvbnN0IGRpcmVjdGl2ZXMgPSBjb250ZXh0W1N0eWxpbmdJbmRleC5EaXJlY3RpdmVSZWdpc3RyeVBvc2l0aW9uXTtcbiAgaWYgKGdldERpcmVjdGl2ZVJlZ2lzdHJ5VmFsdWVzSW5kZXhPZihkaXJlY3RpdmVzLCBkaXJlY3RpdmUpID09IC0xKSB7XG4gICAgLy8gdGhpcyBpcyBhIG5ldyBkaXJlY3RpdmUgd2hpY2ggd2UgaGF2ZSBub3Qgc2VlbiB5ZXQuXG4gICAgZGlyZWN0aXZlcy5wdXNoKGRpcmVjdGl2ZSwgLTEsIGZhbHNlLCBudWxsKTtcblxuICAgIGxldCBpbml0aWFsQ2xhc3NlczogSW5pdGlhbFN0eWxpbmdWYWx1ZXN8bnVsbCA9IG51bGw7XG4gICAgbGV0IGluaXRpYWxTdHlsZXM6IEluaXRpYWxTdHlsaW5nVmFsdWVzfG51bGwgPSBudWxsO1xuXG4gICAgbGV0IG1vZGUgPSAtMTtcbiAgICBmb3IgKGxldCBpID0gc3RhcnRpbmdJbmRleDsgaSA8IGF0dHJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBhdHRyID0gYXR0cnNbaV07XG4gICAgICBpZiAodHlwZW9mIGF0dHIgPT0gJ251bWJlcicpIHtcbiAgICAgICAgbW9kZSA9IGF0dHI7XG4gICAgICB9IGVsc2UgaWYgKG1vZGUgPT0gQXR0cmlidXRlTWFya2VyLkNsYXNzZXMpIHtcbiAgICAgICAgaW5pdGlhbENsYXNzZXMgPSBpbml0aWFsQ2xhc3NlcyB8fCBjb250ZXh0W1N0eWxpbmdJbmRleC5Jbml0aWFsQ2xhc3NWYWx1ZXNQb3NpdGlvbl07XG4gICAgICAgIHBhdGNoSW5pdGlhbFN0eWxpbmdWYWx1ZShpbml0aWFsQ2xhc3NlcywgYXR0ciwgdHJ1ZSk7XG4gICAgICB9IGVsc2UgaWYgKG1vZGUgPT0gQXR0cmlidXRlTWFya2VyLlN0eWxlcykge1xuICAgICAgICBpbml0aWFsU3R5bGVzID0gaW5pdGlhbFN0eWxlcyB8fCBjb250ZXh0W1N0eWxpbmdJbmRleC5Jbml0aWFsU3R5bGVWYWx1ZXNQb3NpdGlvbl07XG4gICAgICAgIHBhdGNoSW5pdGlhbFN0eWxpbmdWYWx1ZShpbml0aWFsU3R5bGVzLCBhdHRyLCBhdHRyc1srK2ldKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBEZXNpZ25lZCB0byBhZGQgYSBzdHlsZSBvciBjbGFzcyB2YWx1ZSBpbnRvIHRoZSBleGlzdGluZyBzZXQgb2YgaW5pdGlhbCBzdHlsZXMuXG4gKlxuICogVGhlIGZ1bmN0aW9uIHdpbGwgc2VhcmNoIGFuZCBmaWd1cmUgb3V0IGlmIGEgc3R5bGUvY2xhc3MgdmFsdWUgaXMgYWxyZWFkeSBwcmVzZW50XG4gKiB3aXRoaW4gdGhlIHByb3ZpZGVkIGluaXRpYWwgc3R5bGluZyBhcnJheS4gSWYgYW5kIHdoZW4gYSBzdHlsZS9jbGFzcyB2YWx1ZSBpcyBub3RcbiAqIHByZXNlbnQgKG9yIGlmIGl0J3MgdmFsdWUgaXMgZmFsc3kpIHRoZW4gaXQgd2lsbCBiZSBpbnNlcnRlZC91cGRhdGVkIGluIHRoZSBsaXN0XG4gKiBvZiBpbml0aWFsIHN0eWxpbmcgdmFsdWVzLlxuICovXG5mdW5jdGlvbiBwYXRjaEluaXRpYWxTdHlsaW5nVmFsdWUoXG4gICAgaW5pdGlhbFN0eWxpbmc6IEluaXRpYWxTdHlsaW5nVmFsdWVzLCBwcm9wOiBzdHJpbmcsIHZhbHVlOiBhbnkpOiB2b2lkIHtcbiAgLy8gRXZlbiB2YWx1ZXMgYXJlIGtleXM7IE9kZCBudW1iZXJzIGFyZSB2YWx1ZXM7IFNlYXJjaCBrZXlzIG9ubHlcbiAgZm9yIChsZXQgaSA9IEluaXRpYWxTdHlsaW5nVmFsdWVzSW5kZXguS2V5VmFsdWVTdGFydFBvc2l0aW9uOyBpIDwgaW5pdGlhbFN0eWxpbmcubGVuZ3RoOykge1xuICAgIGNvbnN0IGtleSA9IGluaXRpYWxTdHlsaW5nW2ldO1xuICAgIGlmIChrZXkgPT09IHByb3ApIHtcbiAgICAgIGNvbnN0IGV4aXN0aW5nVmFsdWUgPSBpbml0aWFsU3R5bGluZ1tpICsgSW5pdGlhbFN0eWxpbmdWYWx1ZXNJbmRleC5WYWx1ZU9mZnNldF07XG5cbiAgICAgIC8vIElmIHRoZXJlIGlzIG5vIHByZXZpb3VzIHN0eWxlIHZhbHVlICh3aGVuIGBudWxsYCkgb3Igbm8gcHJldmlvdXMgY2xhc3NcbiAgICAgIC8vIGFwcGxpZWQgKHdoZW4gYGZhbHNlYCkgdGhlbiB3ZSB1cGRhdGUgdGhlIHRoZSBuZXdseSBnaXZlbiB2YWx1ZS5cbiAgICAgIGlmIChleGlzdGluZ1ZhbHVlID09IG51bGwgfHwgZXhpc3RpbmdWYWx1ZSA9PSBmYWxzZSkge1xuICAgICAgICBpbml0aWFsU3R5bGluZ1tpICsgSW5pdGlhbFN0eWxpbmdWYWx1ZXNJbmRleC5WYWx1ZU9mZnNldF0gPSB2YWx1ZTtcbiAgICAgIH1cbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaSA9IGkgKyBJbml0aWFsU3R5bGluZ1ZhbHVlc0luZGV4LlNpemU7XG4gIH1cbiAgLy8gV2UgZGlkIG5vdCBmaW5kIGV4aXN0aW5nIGtleSwgYWRkIGEgbmV3IG9uZS5cbiAgaW5pdGlhbFN0eWxpbmcucHVzaChwcm9wLCB2YWx1ZSk7XG59XG5cbi8qKlxuICogUnVucyB0aHJvdWdoIHRoZSBpbml0aWFsIHN0eWxpbmcgZGF0YSBwcmVzZW50IGluIHRoZSBjb250ZXh0IGFuZCByZW5kZXJzXG4gKiB0aGVtIHZpYSB0aGUgcmVuZGVyZXIgb24gdGhlIGVsZW1lbnQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZW5kZXJJbml0aWFsU3R5bGVzQW5kQ2xhc3NlcyhcbiAgICBlbGVtZW50OiBSRWxlbWVudCwgY29udGV4dDogU3R5bGluZ0NvbnRleHQsIHJlbmRlcmVyOiBSZW5kZXJlcjMpIHtcbiAgY29uc3QgaW5pdGlhbENsYXNzZXMgPSBjb250ZXh0W1N0eWxpbmdJbmRleC5Jbml0aWFsQ2xhc3NWYWx1ZXNQb3NpdGlvbl07XG4gIHJlbmRlckluaXRpYWxTdHlsaW5nVmFsdWVzKGVsZW1lbnQsIHJlbmRlcmVyLCBpbml0aWFsQ2xhc3NlcywgdHJ1ZSk7XG5cbiAgY29uc3QgaW5pdGlhbFN0eWxlcyA9IGNvbnRleHRbU3R5bGluZ0luZGV4LkluaXRpYWxTdHlsZVZhbHVlc1Bvc2l0aW9uXTtcbiAgcmVuZGVySW5pdGlhbFN0eWxpbmdWYWx1ZXMoZWxlbWVudCwgcmVuZGVyZXIsIGluaXRpYWxTdHlsZXMsIGZhbHNlKTtcbn1cblxuLyoqXG4gKiBUaGlzIGlzIGEgaGVscGVyIGZ1bmN0aW9uIGRlc2lnbmVkIHRvIHJlbmRlciBlYWNoIGVudHJ5IHByZXNlbnQgd2l0aGluIHRoZVxuICogcHJvdmlkZWQgbGlzdCBvZiBpbml0aWFsU3R5bGluZ1ZhbHVlcy5cbiAqL1xuZnVuY3Rpb24gcmVuZGVySW5pdGlhbFN0eWxpbmdWYWx1ZXMoXG4gICAgZWxlbWVudDogUkVsZW1lbnQsIHJlbmRlcmVyOiBSZW5kZXJlcjMsIGluaXRpYWxTdHlsaW5nVmFsdWVzOiBJbml0aWFsU3R5bGluZ1ZhbHVlcyxcbiAgICBpc0VudHJ5Q2xhc3NCYXNlZDogYm9vbGVhbikge1xuICBmb3IgKGxldCBpID0gSW5pdGlhbFN0eWxpbmdWYWx1ZXNJbmRleC5LZXlWYWx1ZVN0YXJ0UG9zaXRpb247IGkgPCBpbml0aWFsU3R5bGluZ1ZhbHVlcy5sZW5ndGg7XG4gICAgICAgaSArPSBJbml0aWFsU3R5bGluZ1ZhbHVlc0luZGV4LlNpemUpIHtcbiAgICBjb25zdCB2YWx1ZSA9IGluaXRpYWxTdHlsaW5nVmFsdWVzW2kgKyBJbml0aWFsU3R5bGluZ1ZhbHVlc0luZGV4LlZhbHVlT2Zmc2V0XTtcbiAgICBpZiAodmFsdWUpIHtcbiAgICAgIGlmIChpc0VudHJ5Q2xhc3NCYXNlZCkge1xuICAgICAgICBzZXRDbGFzcyhcbiAgICAgICAgICAgIGVsZW1lbnQsIGluaXRpYWxTdHlsaW5nVmFsdWVzW2kgKyBJbml0aWFsU3R5bGluZ1ZhbHVlc0luZGV4LlByb3BPZmZzZXRdIGFzIHN0cmluZywgdHJ1ZSxcbiAgICAgICAgICAgIHJlbmRlcmVyLCBudWxsKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNldFN0eWxlKFxuICAgICAgICAgICAgZWxlbWVudCwgaW5pdGlhbFN0eWxpbmdWYWx1ZXNbaSArIEluaXRpYWxTdHlsaW5nVmFsdWVzSW5kZXguUHJvcE9mZnNldF0gYXMgc3RyaW5nLFxuICAgICAgICAgICAgdmFsdWUgYXMgc3RyaW5nLCByZW5kZXJlciwgbnVsbCk7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhbGxvd05ld0JpbmRpbmdzRm9yU3R5bGluZ0NvbnRleHQoY29udGV4dDogU3R5bGluZ0NvbnRleHQpOiBib29sZWFuIHtcbiAgcmV0dXJuIChjb250ZXh0W1N0eWxpbmdJbmRleC5NYXN0ZXJGbGFnUG9zaXRpb25dICYgU3R5bGluZ0ZsYWdzLkJpbmRpbmdBbGxvY2F0aW9uTG9ja2VkKSA9PT0gMDtcbn1cblxuLyoqXG4gKiBBZGRzIGluIG5ldyBiaW5kaW5nIHZhbHVlcyB0byBhIHN0eWxpbmcgY29udGV4dC5cbiAqXG4gKiBJZiBhIGRpcmVjdGl2ZSB2YWx1ZSBpcyBwcm92aWRlZCB0aGVuIGFsbCBwcm92aWRlZCBjbGFzcy9zdHlsZSBiaW5kaW5nIG5hbWVzIHdpbGxcbiAqIHJlZmVyZW5jZSB0aGUgcHJvdmlkZWQgZGlyZWN0aXZlLlxuICpcbiAqIEBwYXJhbSBjb250ZXh0IHRoZSBleGlzdGluZyBzdHlsaW5nIGNvbnRleHRcbiAqIEBwYXJhbSBkaXJlY3RpdmVSZWYgdGhlIGRpcmVjdGl2ZSB0aGF0IHRoZSBuZXcgYmluZGluZ3Mgd2lsbCByZWZlcmVuY2VcbiAqIEBwYXJhbSBjbGFzc0JpbmRpbmdOYW1lcyBhbiBhcnJheSBvZiBjbGFzcyBiaW5kaW5nIG5hbWVzIHRoYXQgd2lsbCBiZSBhZGRlZCB0byB0aGUgY29udGV4dFxuICogQHBhcmFtIHN0eWxlQmluZGluZ05hbWVzIGFuIGFycmF5IG9mIHN0eWxlIGJpbmRpbmcgbmFtZXMgdGhhdCB3aWxsIGJlIGFkZGVkIHRvIHRoZSBjb250ZXh0XG4gKiBAcGFyYW0gc3R5bGVTYW5pdGl6ZXIgYW4gb3B0aW9uYWwgc2FuaXRpemVyIHRoYXQgaGFuZGxlIGFsbCBzYW5pdGl6YXRpb24gb24gZm9yIGVhY2ggb2ZcbiAqICAgIHRoZSBiaW5kaW5ncyBhZGRlZCB0byB0aGUgY29udGV4dC4gTm90ZSB0aGF0IGlmIGEgZGlyZWN0aXZlIGlzIHByb3ZpZGVkIHRoZW4gdGhlIHNhbml0aXplclxuICogICAgaW5zdGFuY2Ugd2lsbCBvbmx5IGJlIGFjdGl2ZSBpZiBhbmQgd2hlbiB0aGUgZGlyZWN0aXZlIHVwZGF0ZXMgdGhlIGJpbmRpbmdzIHRoYXQgaXQgb3ducy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHVwZGF0ZUNvbnRleHRXaXRoQmluZGluZ3MoXG4gICAgY29udGV4dDogU3R5bGluZ0NvbnRleHQsIGRpcmVjdGl2ZVJlZjogYW55IHwgbnVsbCwgY2xhc3NCaW5kaW5nTmFtZXM/OiBzdHJpbmdbXSB8IG51bGwsXG4gICAgc3R5bGVCaW5kaW5nTmFtZXM/OiBzdHJpbmdbXSB8IG51bGwsIHN0eWxlU2FuaXRpemVyPzogU3R5bGVTYW5pdGl6ZUZuIHwgbnVsbCxcbiAgICBvbmx5UHJvY2Vzc1NpbmdsZUNsYXNzZXM/OiBib29sZWFuKSB7XG4gIGlmIChjb250ZXh0W1N0eWxpbmdJbmRleC5NYXN0ZXJGbGFnUG9zaXRpb25dICYgU3R5bGluZ0ZsYWdzLkJpbmRpbmdBbGxvY2F0aW9uTG9ja2VkKSByZXR1cm47XG5cbiAgLy8gdGhpcyBtZWFucyB0aGUgY29udGV4dCBoYXMgYWxyZWFkeSBiZWVuIHBhdGNoZWQgd2l0aCB0aGUgZGlyZWN0aXZlJ3MgYmluZGluZ3NcbiAgY29uc3QgZGlyZWN0aXZlSW5kZXggPSBmaW5kT3JQYXRjaERpcmVjdGl2ZUludG9SZWdpc3RyeShjb250ZXh0LCBkaXJlY3RpdmVSZWYsIHN0eWxlU2FuaXRpemVyKTtcbiAgaWYgKGRpcmVjdGl2ZUluZGV4ID09PSAtMSkge1xuICAgIC8vIHRoaXMgbWVhbnMgdGhlIGRpcmVjdGl2ZSBoYXMgYWxyZWFkeSBiZWVuIHBhdGNoZWQgaW4gLi4uIE5vIHBvaW50IGluIGRvaW5nIGFueXRoaW5nXG4gICAgcmV0dXJuO1xuICB9XG5cbiAgLy8gdGhlcmUgYXJlIGFsb3Qgb2YgdmFyaWFibGVzIGJlaW5nIHVzZWQgYmVsb3cgdG8gdHJhY2sgd2hlcmUgaW4gdGhlIGNvbnRleHQgdGhlIG5ld1xuICAvLyBiaW5kaW5nIHZhbHVlcyB3aWxsIGJlIHBsYWNlZC4gQmVjYXVzZSB0aGUgY29udGV4dCBjb25zaXN0cyBvZiBtdWx0aXBsZSB0eXBlcyBvZlxuICAvLyBlbnRyaWVzIChzaW5nbGUgY2xhc3Nlcy9zdHlsZXMgYW5kIG11bHRpIGNsYXNzZXMvc3R5bGVzKSBhbG90IG9mIHRoZSBpbmRleCBwb3NpdGlvbnNcbiAgLy8gbmVlZCB0byBiZSBjb21wdXRlZCBhaGVhZCBvZiB0aW1lIGFuZCB0aGUgY29udGV4dCBuZWVkcyB0byBiZSBleHRlbmRlZCBiZWZvcmUgdGhlIHZhbHVlc1xuICAvLyBhcmUgaW5zZXJ0ZWQgaW4uXG4gIGNvbnN0IHNpbmdsZVByb3BPZmZzZXRWYWx1ZXMgPSBjb250ZXh0W1N0eWxpbmdJbmRleC5TaW5nbGVQcm9wT2Zmc2V0UG9zaXRpb25zXTtcbiAgY29uc3QgdG90YWxDdXJyZW50Q2xhc3NCaW5kaW5ncyA9XG4gICAgICBzaW5nbGVQcm9wT2Zmc2V0VmFsdWVzW1NpbmdsZVByb3BPZmZzZXRWYWx1ZXNJbmRleC5DbGFzc2VzQ291bnRQb3NpdGlvbl07XG4gIGNvbnN0IHRvdGFsQ3VycmVudFN0eWxlQmluZGluZ3MgPVxuICAgICAgc2luZ2xlUHJvcE9mZnNldFZhbHVlc1tTaW5nbGVQcm9wT2Zmc2V0VmFsdWVzSW5kZXguU3R5bGVzQ291bnRQb3NpdGlvbl07XG5cbiAgY29uc3QgY2xhc3Nlc09mZnNldCA9IHRvdGFsQ3VycmVudENsYXNzQmluZGluZ3MgKiBTdHlsaW5nSW5kZXguU2l6ZTtcbiAgY29uc3Qgc3R5bGVzT2Zmc2V0ID0gdG90YWxDdXJyZW50U3R5bGVCaW5kaW5ncyAqIFN0eWxpbmdJbmRleC5TaXplO1xuXG4gIGNvbnN0IHNpbmdsZVN0eWxlc1N0YXJ0SW5kZXggPSBTdHlsaW5nSW5kZXguU2luZ2xlU3R5bGVzU3RhcnRQb3NpdGlvbjtcbiAgbGV0IHNpbmdsZUNsYXNzZXNTdGFydEluZGV4ID0gc2luZ2xlU3R5bGVzU3RhcnRJbmRleCArIHN0eWxlc09mZnNldDtcbiAgbGV0IG11bHRpU3R5bGVzU3RhcnRJbmRleCA9IHNpbmdsZUNsYXNzZXNTdGFydEluZGV4ICsgY2xhc3Nlc09mZnNldDtcbiAgbGV0IG11bHRpQ2xhc3Nlc1N0YXJ0SW5kZXggPSBtdWx0aVN0eWxlc1N0YXJ0SW5kZXggKyBzdHlsZXNPZmZzZXQ7XG5cbiAgLy8gYmVjYXVzZSB3ZSdyZSBpbnNlcnRpbmcgbW9yZSBiaW5kaW5ncyBpbnRvIHRoZSBjb250ZXh0LCB0aGlzIG1lYW5zIHRoYXQgdGhlXG4gIC8vIGJpbmRpbmcgdmFsdWVzIG5lZWQgdG8gYmUgcmVmZXJlbmNlZCB0aGUgc2luZ2xlUHJvcE9mZnNldFZhbHVlcyBhcnJheSBzbyB0aGF0XG4gIC8vIHRoZSB0ZW1wbGF0ZS9kaXJlY3RpdmUgY2FuIGVhc2lseSBmaW5kIHRoZW0gaW5zaWRlIG9mIHRoZSBgZWxlbWVudFN0eWxlUHJvcGBcbiAgLy8gYW5kIHRoZSBgZWxlbWVudENsYXNzUHJvcGAgZnVuY3Rpb25zIHdpdGhvdXQgaXRlcmF0aW5nIHRocm91Z2ggdGhlIGVudGlyZSBjb250ZXh0LlxuICAvLyBUaGUgZmlyc3Qgc3RlcCB0byBzZXR0aW5nIHVwIHRoZXNlIHJlZmVyZW5jZSBwb2ludHMgaXMgdG8gbWFyayBob3cgbWFueSBiaW5kaW5nc1xuICAvLyBhcmUgYmVpbmcgYWRkZWQuIEV2ZW4gaWYgdGhlc2UgYmluZGluZ3MgYWxyZWFkeSBleGlzdCBpbiB0aGUgY29udGV4dCwgdGhlIGRpcmVjdGl2ZVxuICAvLyBvciB0ZW1wbGF0ZSBjb2RlIHdpbGwgc3RpbGwgY2FsbCB0aGVtIHVua25vd2luZ2x5LiBUaGVyZWZvcmUgdGhlIHRvdGFsIHZhbHVlcyBuZWVkXG4gIC8vIHRvIGJlIHJlZ2lzdGVyZWQgc28gdGhhdCB3ZSBrbm93IGhvdyBtYW55IGJpbmRpbmdzIGFyZSBhc3NpZ25lZCB0byBlYWNoIGRpcmVjdGl2ZS5cbiAgY29uc3QgY3VycmVudFNpbmdsZVByb3BzTGVuZ3RoID0gc2luZ2xlUHJvcE9mZnNldFZhbHVlcy5sZW5ndGg7XG4gIHNpbmdsZVByb3BPZmZzZXRWYWx1ZXMucHVzaChcbiAgICAgIHN0eWxlQmluZGluZ05hbWVzID8gc3R5bGVCaW5kaW5nTmFtZXMubGVuZ3RoIDogMCxcbiAgICAgIGNsYXNzQmluZGluZ05hbWVzID8gY2xhc3NCaW5kaW5nTmFtZXMubGVuZ3RoIDogMCk7XG5cbiAgLy8gdGhlIGNvZGUgYmVsb3cgd2lsbCBjaGVjayB0byBzZWUgaWYgYSBuZXcgc3R5bGUgYmluZGluZyBhbHJlYWR5IGV4aXN0cyBpbiB0aGUgY29udGV4dFxuICAvLyBpZiBzbyB0aGVuIHRoZXJlIGlzIG5vIHBvaW50IGluIGluc2VydGluZyBpdCBpbnRvIHRoZSBjb250ZXh0IGFnYWluLiBXaGV0aGVyIG9yIG5vdCBpdFxuICAvLyBleGlzdHMgdGhlIHN0eWxpbmcgb2Zmc2V0IGNvZGUgd2lsbCBub3cga25vdyBleGFjdGx5IHdoZXJlIGl0IGlzXG4gIGxldCBpbnNlcnRpb25PZmZzZXQgPSAwO1xuICBjb25zdCBmaWx0ZXJlZFN0eWxlQmluZGluZ05hbWVzOiBzdHJpbmdbXSA9IFtdO1xuICBpZiAoc3R5bGVCaW5kaW5nTmFtZXMgJiYgc3R5bGVCaW5kaW5nTmFtZXMubGVuZ3RoKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzdHlsZUJpbmRpbmdOYW1lcy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgbmFtZSA9IHN0eWxlQmluZGluZ05hbWVzW2ldO1xuICAgICAgbGV0IHNpbmdsZVByb3BJbmRleCA9XG4gICAgICAgICAgZ2V0TWF0Y2hpbmdCaW5kaW5nSW5kZXgoY29udGV4dCwgbmFtZSwgc2luZ2xlU3R5bGVzU3RhcnRJbmRleCwgc2luZ2xlQ2xhc3Nlc1N0YXJ0SW5kZXgpO1xuICAgICAgaWYgKHNpbmdsZVByb3BJbmRleCA9PSAtMSkge1xuICAgICAgICBzaW5nbGVQcm9wSW5kZXggPSBzaW5nbGVDbGFzc2VzU3RhcnRJbmRleCArIGluc2VydGlvbk9mZnNldDtcbiAgICAgICAgaW5zZXJ0aW9uT2Zmc2V0ICs9IFN0eWxpbmdJbmRleC5TaXplO1xuICAgICAgICBmaWx0ZXJlZFN0eWxlQmluZGluZ05hbWVzLnB1c2gobmFtZSk7XG4gICAgICB9XG4gICAgICBzaW5nbGVQcm9wT2Zmc2V0VmFsdWVzLnB1c2goc2luZ2xlUHJvcEluZGV4KTtcbiAgICB9XG4gIH1cblxuICAvLyBqdXN0IGxpa2Ugd2l0aCB0aGUgc3R5bGUgYmluZGluZyBsb29wIGFib3ZlLCB0aGUgbmV3IGNsYXNzIGJpbmRpbmdzIGdldCB0aGUgc2FtZSB0cmVhdG1lbnQuLi5cbiAgY29uc3QgZmlsdGVyZWRDbGFzc0JpbmRpbmdOYW1lczogc3RyaW5nW10gPSBbXTtcbiAgaWYgKGNsYXNzQmluZGluZ05hbWVzICYmIGNsYXNzQmluZGluZ05hbWVzLmxlbmd0aCkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY2xhc3NCaW5kaW5nTmFtZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IG5hbWUgPSBjbGFzc0JpbmRpbmdOYW1lc1tpXTtcbiAgICAgIGxldCBzaW5nbGVQcm9wSW5kZXggPVxuICAgICAgICAgIGdldE1hdGNoaW5nQmluZGluZ0luZGV4KGNvbnRleHQsIG5hbWUsIHNpbmdsZUNsYXNzZXNTdGFydEluZGV4LCBtdWx0aVN0eWxlc1N0YXJ0SW5kZXgpO1xuICAgICAgaWYgKHNpbmdsZVByb3BJbmRleCA9PSAtMSkge1xuICAgICAgICBzaW5nbGVQcm9wSW5kZXggPSBtdWx0aVN0eWxlc1N0YXJ0SW5kZXggKyBpbnNlcnRpb25PZmZzZXQ7XG4gICAgICAgIGluc2VydGlvbk9mZnNldCArPSBTdHlsaW5nSW5kZXguU2l6ZTtcbiAgICAgICAgZmlsdGVyZWRDbGFzc0JpbmRpbmdOYW1lcy5wdXNoKG5hbWUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc2luZ2xlUHJvcEluZGV4ICs9IGZpbHRlcmVkU3R5bGVCaW5kaW5nTmFtZXMubGVuZ3RoICogU3R5bGluZ0luZGV4LlNpemU7XG4gICAgICB9XG4gICAgICBzaW5nbGVQcm9wT2Zmc2V0VmFsdWVzLnB1c2goc2luZ2xlUHJvcEluZGV4KTtcbiAgICB9XG4gIH1cblxuICAvLyBiZWNhdXNlIG5ldyBzdHlsZXMgYXJlIGJlaW5nIGluc2VydGVkLCB0aGlzIG1lYW5zIHRoZSBleGlzdGluZyBjb2xsZWN0aW9uIG9mIHN0eWxlIG9mZnNldFxuICAvLyBpbmRleCB2YWx1ZXMgYXJlIGluY29ycmVjdCAodGhleSBwb2ludCB0byB0aGUgd3JvbmcgdmFsdWVzKS4gVGhlIGNvZGUgYmVsb3cgd2lsbCBydW4gdGhyb3VnaFxuICAvLyB0aGUgZW50aXJlIG9mZnNldCBhcnJheSBhbmQgdXBkYXRlIHRoZSBleGlzdGluZyBzZXQgb2YgaW5kZXggdmFsdWVzIHRvIHBvaW50IHRvIHRoZWlyIG5ld1xuICAvLyBsb2NhdGlvbnMgd2hpbGUgdGFraW5nIHRoZSBuZXcgYmluZGluZyB2YWx1ZXMgaW50byBjb25zaWRlcmF0aW9uLlxuICBsZXQgaSA9IFNpbmdsZVByb3BPZmZzZXRWYWx1ZXNJbmRleC5WYWx1ZVN0YXJ0UG9zaXRpb247XG4gIGlmIChmaWx0ZXJlZFN0eWxlQmluZGluZ05hbWVzLmxlbmd0aCkge1xuICAgIHdoaWxlIChpIDwgY3VycmVudFNpbmdsZVByb3BzTGVuZ3RoKSB7XG4gICAgICBjb25zdCB0b3RhbFN0eWxlcyA9XG4gICAgICAgICAgc2luZ2xlUHJvcE9mZnNldFZhbHVlc1tpICsgU2luZ2xlUHJvcE9mZnNldFZhbHVlc0luZGV4LlN0eWxlc0NvdW50UG9zaXRpb25dO1xuICAgICAgY29uc3QgdG90YWxDbGFzc2VzID1cbiAgICAgICAgICBzaW5nbGVQcm9wT2Zmc2V0VmFsdWVzW2kgKyBTaW5nbGVQcm9wT2Zmc2V0VmFsdWVzSW5kZXguQ2xhc3Nlc0NvdW50UG9zaXRpb25dO1xuICAgICAgaWYgKHRvdGFsQ2xhc3Nlcykge1xuICAgICAgICBjb25zdCBzdGFydCA9IGkgKyBTaW5nbGVQcm9wT2Zmc2V0VmFsdWVzSW5kZXguVmFsdWVTdGFydFBvc2l0aW9uICsgdG90YWxTdHlsZXM7XG4gICAgICAgIGZvciAobGV0IGogPSBzdGFydDsgaiA8IHN0YXJ0ICsgdG90YWxDbGFzc2VzOyBqKyspIHtcbiAgICAgICAgICBzaW5nbGVQcm9wT2Zmc2V0VmFsdWVzW2pdICs9IGZpbHRlcmVkU3R5bGVCaW5kaW5nTmFtZXMubGVuZ3RoICogU3R5bGluZ0luZGV4LlNpemU7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgY29uc3QgdG90YWwgPSB0b3RhbFN0eWxlcyArIHRvdGFsQ2xhc3NlcztcbiAgICAgIGkgKz0gU2luZ2xlUHJvcE9mZnNldFZhbHVlc0luZGV4LlZhbHVlU3RhcnRQb3NpdGlvbiArIHRvdGFsO1xuICAgIH1cbiAgfVxuXG4gIGNvbnN0IHRvdGFsTmV3RW50cmllcyA9IGZpbHRlcmVkQ2xhc3NCaW5kaW5nTmFtZXMubGVuZ3RoICsgZmlsdGVyZWRTdHlsZUJpbmRpbmdOYW1lcy5sZW5ndGg7XG5cbiAgLy8gaW4gdGhlIGV2ZW50IHRoYXQgdGhlcmUgYXJlIG5ldyBzdHlsZSB2YWx1ZXMgYmVpbmcgaW5zZXJ0ZWQsIGFsbCBleGlzdGluZyBjbGFzcyBhbmQgc3R5bGVcbiAgLy8gYmluZGluZ3MgbmVlZCB0byBoYXZlIHRoZWlyIHBvaW50ZXIgdmFsdWVzIG9mZnNldHRlZCB3aXRoIHRoZSBuZXcgYW1vdW50IG9mIHNwYWNlIHRoYXQgaXNcbiAgLy8gdXNlZCBmb3IgdGhlIG5ldyBzdHlsZS9jbGFzcyBiaW5kaW5ncy5cbiAgZm9yIChsZXQgaSA9IHNpbmdsZVN0eWxlc1N0YXJ0SW5kZXg7IGkgPCBjb250ZXh0Lmxlbmd0aDsgaSArPSBTdHlsaW5nSW5kZXguU2l6ZSkge1xuICAgIGNvbnN0IGlzTXVsdGlCYXNlZCA9IGkgPj0gbXVsdGlTdHlsZXNTdGFydEluZGV4O1xuICAgIGNvbnN0IGlzQ2xhc3NCYXNlZCA9IGkgPj0gKGlzTXVsdGlCYXNlZCA/IG11bHRpQ2xhc3Nlc1N0YXJ0SW5kZXggOiBzaW5nbGVDbGFzc2VzU3RhcnRJbmRleCk7XG4gICAgY29uc3QgZmxhZyA9IGdldFBvaW50ZXJzKGNvbnRleHQsIGkpO1xuICAgIGNvbnN0IHN0YXRpY0luZGV4ID0gZ2V0SW5pdGlhbEluZGV4KGZsYWcpO1xuICAgIGxldCBzaW5nbGVPck11bHRpSW5kZXggPSBnZXRNdWx0aU9yU2luZ2xlSW5kZXgoZmxhZyk7XG4gICAgaWYgKGlzTXVsdGlCYXNlZCkge1xuICAgICAgc2luZ2xlT3JNdWx0aUluZGV4ICs9XG4gICAgICAgICAgaXNDbGFzc0Jhc2VkID8gKGZpbHRlcmVkU3R5bGVCaW5kaW5nTmFtZXMubGVuZ3RoICogU3R5bGluZ0luZGV4LlNpemUpIDogMDtcbiAgICB9IGVsc2Uge1xuICAgICAgc2luZ2xlT3JNdWx0aUluZGV4ICs9ICh0b3RhbE5ld0VudHJpZXMgKiBTdHlsaW5nSW5kZXguU2l6ZSkgK1xuICAgICAgICAgICgoaXNDbGFzc0Jhc2VkID8gZmlsdGVyZWRTdHlsZUJpbmRpbmdOYW1lcy5sZW5ndGggOiAwKSAqIFN0eWxpbmdJbmRleC5TaXplKTtcbiAgICB9XG4gICAgc2V0RmxhZyhjb250ZXh0LCBpLCBwb2ludGVycyhmbGFnLCBzdGF0aWNJbmRleCwgc2luZ2xlT3JNdWx0aUluZGV4KSk7XG4gIH1cblxuICAvLyB0aGlzIGlzIHdoZXJlIHdlIG1ha2Ugc3BhY2UgaW4gdGhlIGNvbnRleHQgZm9yIHRoZSBuZXcgc3R5bGUgYmluZGluZ3NcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBmaWx0ZXJlZFN0eWxlQmluZGluZ05hbWVzLmxlbmd0aCAqIFN0eWxpbmdJbmRleC5TaXplOyBpKyspIHtcbiAgICBjb250ZXh0LnNwbGljZShtdWx0aUNsYXNzZXNTdGFydEluZGV4LCAwLCBudWxsKTtcbiAgICBjb250ZXh0LnNwbGljZShzaW5nbGVDbGFzc2VzU3RhcnRJbmRleCwgMCwgbnVsbCk7XG4gICAgc2luZ2xlQ2xhc3Nlc1N0YXJ0SW5kZXgrKztcbiAgICBtdWx0aVN0eWxlc1N0YXJ0SW5kZXgrKztcbiAgICBtdWx0aUNsYXNzZXNTdGFydEluZGV4ICs9IDI7ICAvLyBib3RoIHNpbmdsZSArIG11bHRpIHNsb3RzIHdlcmUgaW5zZXJ0ZWRcbiAgfVxuXG4gIC8vIHRoaXMgaXMgd2hlcmUgd2UgbWFrZSBzcGFjZSBpbiB0aGUgY29udGV4dCBmb3IgdGhlIG5ldyBjbGFzcyBiaW5kaW5nc1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGZpbHRlcmVkQ2xhc3NCaW5kaW5nTmFtZXMubGVuZ3RoICogU3R5bGluZ0luZGV4LlNpemU7IGkrKykge1xuICAgIGNvbnRleHQuc3BsaWNlKG11bHRpU3R5bGVzU3RhcnRJbmRleCwgMCwgbnVsbCk7XG4gICAgY29udGV4dC5wdXNoKG51bGwpO1xuICAgIG11bHRpU3R5bGVzU3RhcnRJbmRleCsrO1xuICAgIG11bHRpQ2xhc3Nlc1N0YXJ0SW5kZXgrKztcbiAgfVxuXG4gIGNvbnN0IGluaXRpYWxDbGFzc2VzID0gY29udGV4dFtTdHlsaW5nSW5kZXguSW5pdGlhbENsYXNzVmFsdWVzUG9zaXRpb25dO1xuICBjb25zdCBpbml0aWFsU3R5bGVzID0gY29udGV4dFtTdHlsaW5nSW5kZXguSW5pdGlhbFN0eWxlVmFsdWVzUG9zaXRpb25dO1xuXG4gIC8vIHRoZSBjb2RlIGJlbG93IHdpbGwgaW5zZXJ0IGVhY2ggbmV3IGVudHJ5IGludG8gdGhlIGNvbnRleHQgYW5kIGFzc2lnbiB0aGUgYXBwcm9wcmlhdGVcbiAgLy8gZmxhZ3MgYW5kIGluZGV4IHZhbHVlcyB0byB0aGVtLiBJdCdzIGltcG9ydGFudCB0aGlzIHJ1bnMgYXQgdGhlIGVuZCBvZiB0aGlzIGZ1bmN0aW9uXG4gIC8vIGJlY2F1c2UgdGhlIGNvbnRleHQsIHByb3BlcnR5IG9mZnNldCBhbmQgaW5kZXggdmFsdWVzIGhhdmUgYWxsIGJlZW4gY29tcHV0ZWQganVzdCBiZWZvcmUuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgdG90YWxOZXdFbnRyaWVzOyBpKyspIHtcbiAgICBjb25zdCBlbnRyeUlzQ2xhc3NCYXNlZCA9IGkgPj0gZmlsdGVyZWRTdHlsZUJpbmRpbmdOYW1lcy5sZW5ndGg7XG4gICAgY29uc3QgYWRqdXN0ZWRJbmRleCA9IGVudHJ5SXNDbGFzc0Jhc2VkID8gKGkgLSBmaWx0ZXJlZFN0eWxlQmluZGluZ05hbWVzLmxlbmd0aCkgOiBpO1xuICAgIGNvbnN0IHByb3BOYW1lID0gZW50cnlJc0NsYXNzQmFzZWQgPyBmaWx0ZXJlZENsYXNzQmluZGluZ05hbWVzW2FkanVzdGVkSW5kZXhdIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZmlsdGVyZWRTdHlsZUJpbmRpbmdOYW1lc1thZGp1c3RlZEluZGV4XTtcblxuICAgIGxldCBtdWx0aUluZGV4LCBzaW5nbGVJbmRleDtcbiAgICBpZiAoZW50cnlJc0NsYXNzQmFzZWQpIHtcbiAgICAgIG11bHRpSW5kZXggPSBtdWx0aUNsYXNzZXNTdGFydEluZGV4ICtcbiAgICAgICAgICAoKHRvdGFsQ3VycmVudENsYXNzQmluZGluZ3MgKyBhZGp1c3RlZEluZGV4KSAqIFN0eWxpbmdJbmRleC5TaXplKTtcbiAgICAgIHNpbmdsZUluZGV4ID0gc2luZ2xlQ2xhc3Nlc1N0YXJ0SW5kZXggK1xuICAgICAgICAgICgodG90YWxDdXJyZW50Q2xhc3NCaW5kaW5ncyArIGFkanVzdGVkSW5kZXgpICogU3R5bGluZ0luZGV4LlNpemUpO1xuICAgIH0gZWxzZSB7XG4gICAgICBtdWx0aUluZGV4ID1cbiAgICAgICAgICBtdWx0aVN0eWxlc1N0YXJ0SW5kZXggKyAoKHRvdGFsQ3VycmVudFN0eWxlQmluZGluZ3MgKyBhZGp1c3RlZEluZGV4KSAqIFN0eWxpbmdJbmRleC5TaXplKTtcbiAgICAgIHNpbmdsZUluZGV4ID0gc2luZ2xlU3R5bGVzU3RhcnRJbmRleCArXG4gICAgICAgICAgKCh0b3RhbEN1cnJlbnRTdHlsZUJpbmRpbmdzICsgYWRqdXN0ZWRJbmRleCkgKiBTdHlsaW5nSW5kZXguU2l6ZSk7XG4gICAgfVxuXG4gICAgLy8gaWYgYSBwcm9wZXJ0eSBpcyBub3QgZm91bmQgaW4gdGhlIGluaXRpYWwgc3R5bGUgdmFsdWVzIGxpc3QgdGhlbiBpdFxuICAgIC8vIGlzIEFMV0FZUyBhZGRlZCBpbmNhc2UgYSBmb2xsb3ctdXAgZGlyZWN0aXZlIGludHJvZHVjZXMgdGhlIHNhbWUgaW5pdGlhbFxuICAgIC8vIHN0eWxlL2NsYXNzIHZhbHVlIGxhdGVyIG9uLlxuICAgIGxldCBpbml0aWFsVmFsdWVzVG9Mb29rdXAgPSBlbnRyeUlzQ2xhc3NCYXNlZCA/IGluaXRpYWxDbGFzc2VzIDogaW5pdGlhbFN0eWxlcztcbiAgICBsZXQgaW5kZXhGb3JJbml0aWFsID0gZ2V0SW5pdGlhbFN0eWxpbmdWYWx1ZXNJbmRleE9mKGluaXRpYWxWYWx1ZXNUb0xvb2t1cCwgcHJvcE5hbWUpO1xuICAgIGlmIChpbmRleEZvckluaXRpYWwgPT09IC0xKSB7XG4gICAgICBpbmRleEZvckluaXRpYWwgPSBpbml0aWFsVmFsdWVzVG9Mb29rdXAubGVuZ3RoICsgSW5pdGlhbFN0eWxpbmdWYWx1ZXNJbmRleC5WYWx1ZU9mZnNldDtcbiAgICAgIGluaXRpYWxWYWx1ZXNUb0xvb2t1cC5wdXNoKHByb3BOYW1lLCBlbnRyeUlzQ2xhc3NCYXNlZCA/IGZhbHNlIDogbnVsbCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGluZGV4Rm9ySW5pdGlhbCArPSBJbml0aWFsU3R5bGluZ1ZhbHVlc0luZGV4LlZhbHVlT2Zmc2V0O1xuICAgIH1cblxuICAgIGNvbnN0IGluaXRpYWxGbGFnID1cbiAgICAgICAgcHJlcGFyZUluaXRpYWxGbGFnKGNvbnRleHQsIHByb3BOYW1lLCBlbnRyeUlzQ2xhc3NCYXNlZCwgc3R5bGVTYW5pdGl6ZXIgfHwgbnVsbCk7XG5cbiAgICBzZXRGbGFnKGNvbnRleHQsIHNpbmdsZUluZGV4LCBwb2ludGVycyhpbml0aWFsRmxhZywgaW5kZXhGb3JJbml0aWFsLCBtdWx0aUluZGV4KSk7XG4gICAgc2V0UHJvcChjb250ZXh0LCBzaW5nbGVJbmRleCwgcHJvcE5hbWUpO1xuICAgIHNldFZhbHVlKGNvbnRleHQsIHNpbmdsZUluZGV4LCBudWxsKTtcbiAgICBzZXRQbGF5ZXJCdWlsZGVySW5kZXgoY29udGV4dCwgc2luZ2xlSW5kZXgsIDAsIGRpcmVjdGl2ZUluZGV4KTtcblxuICAgIHNldEZsYWcoY29udGV4dCwgbXVsdGlJbmRleCwgcG9pbnRlcnMoaW5pdGlhbEZsYWcsIGluZGV4Rm9ySW5pdGlhbCwgc2luZ2xlSW5kZXgpKTtcbiAgICBzZXRQcm9wKGNvbnRleHQsIG11bHRpSW5kZXgsIHByb3BOYW1lKTtcbiAgICBzZXRWYWx1ZShjb250ZXh0LCBtdWx0aUluZGV4LCBudWxsKTtcbiAgICBzZXRQbGF5ZXJCdWlsZGVySW5kZXgoY29udGV4dCwgbXVsdGlJbmRleCwgMCwgZGlyZWN0aXZlSW5kZXgpO1xuICB9XG5cbiAgLy8gdGhlIHRvdGFsIGNsYXNzZXMvc3R5bGUgdmFsdWVzIGFyZSB1cGRhdGVkIHNvIHRoZSBuZXh0IHRpbWUgdGhlIGNvbnRleHQgaXMgcGF0Y2hlZFxuICAvLyBhZGRpdGlvbmFsIHN0eWxlL2NsYXNzIGJpbmRpbmdzIGZyb20gYW5vdGhlciBkaXJlY3RpdmUgdGhlbiBpdCBrbm93cyBleGFjdGx5IHdoZXJlXG4gIC8vIHRvIGluc2VydCB0aGVtIGluIHRoZSBjb250ZXh0XG4gIHNpbmdsZVByb3BPZmZzZXRWYWx1ZXNbU2luZ2xlUHJvcE9mZnNldFZhbHVlc0luZGV4LkNsYXNzZXNDb3VudFBvc2l0aW9uXSA9XG4gICAgICB0b3RhbEN1cnJlbnRDbGFzc0JpbmRpbmdzICsgZmlsdGVyZWRDbGFzc0JpbmRpbmdOYW1lcy5sZW5ndGg7XG4gIHNpbmdsZVByb3BPZmZzZXRWYWx1ZXNbU2luZ2xlUHJvcE9mZnNldFZhbHVlc0luZGV4LlN0eWxlc0NvdW50UG9zaXRpb25dID1cbiAgICAgIHRvdGFsQ3VycmVudFN0eWxlQmluZGluZ3MgKyBmaWx0ZXJlZFN0eWxlQmluZGluZ05hbWVzLmxlbmd0aDtcblxuICAvLyB0aGVyZSBpcyBubyBpbml0aWFsIHZhbHVlIGZsYWcgZm9yIHRoZSBtYXN0ZXIgaW5kZXggc2luY2UgaXQgZG9lc24ndFxuICAvLyByZWZlcmVuY2UgYW4gaW5pdGlhbCBzdHlsZSB2YWx1ZVxuICBjb25zdCBtYXN0ZXJGbGFnID0gcG9pbnRlcnMoMCwgMCwgbXVsdGlTdHlsZXNTdGFydEluZGV4KSB8XG4gICAgICAob25seVByb2Nlc3NTaW5nbGVDbGFzc2VzID8gU3R5bGluZ0ZsYWdzLk9ubHlQcm9jZXNzU2luZ2xlQ2xhc3NlcyA6IDApO1xuICBzZXRGbGFnKGNvbnRleHQsIFN0eWxpbmdJbmRleC5NYXN0ZXJGbGFnUG9zaXRpb24sIG1hc3RlckZsYWcpO1xufVxuXG4vKipcbiAqIFNlYXJjaGVzIHRocm91Z2ggdGhlIGV4aXN0aW5nIHJlZ2lzdHJ5IG9mIGRpcmVjdGl2ZXNcbiAqL1xuZnVuY3Rpb24gZmluZE9yUGF0Y2hEaXJlY3RpdmVJbnRvUmVnaXN0cnkoXG4gICAgY29udGV4dDogU3R5bGluZ0NvbnRleHQsIGRpcmVjdGl2ZVJlZjogYW55LCBzdHlsZVNhbml0aXplcj86IFN0eWxlU2FuaXRpemVGbiB8IG51bGwpIHtcbiAgY29uc3QgZGlyZWN0aXZlUmVmcyA9IGNvbnRleHRbU3R5bGluZ0luZGV4LkRpcmVjdGl2ZVJlZ2lzdHJ5UG9zaXRpb25dO1xuICBjb25zdCBuZXh0T2Zmc2V0SW5zZXJ0aW9uSW5kZXggPSBjb250ZXh0W1N0eWxpbmdJbmRleC5TaW5nbGVQcm9wT2Zmc2V0UG9zaXRpb25zXS5sZW5ndGg7XG5cbiAgbGV0IGRpcmVjdGl2ZUluZGV4OiBudW1iZXI7XG4gIGNvbnN0IGRldGVjdGVkSW5kZXggPSBnZXREaXJlY3RpdmVSZWdpc3RyeVZhbHVlc0luZGV4T2YoZGlyZWN0aXZlUmVmcywgZGlyZWN0aXZlUmVmKTtcblxuICBpZiAoZGV0ZWN0ZWRJbmRleCA9PT0gLTEpIHtcbiAgICBkaXJlY3RpdmVJbmRleCA9IGRpcmVjdGl2ZVJlZnMubGVuZ3RoIC8gRGlyZWN0aXZlUmVnaXN0cnlWYWx1ZXNJbmRleC5TaXplO1xuICAgIGRpcmVjdGl2ZVJlZnMucHVzaChkaXJlY3RpdmVSZWYsIG5leHRPZmZzZXRJbnNlcnRpb25JbmRleCwgZmFsc2UsIHN0eWxlU2FuaXRpemVyIHx8IG51bGwpO1xuICB9IGVsc2Uge1xuICAgIGNvbnN0IHNpbmdsZVByb3BTdGFydFBvc2l0aW9uID1cbiAgICAgICAgZGV0ZWN0ZWRJbmRleCArIERpcmVjdGl2ZVJlZ2lzdHJ5VmFsdWVzSW5kZXguU2luZ2xlUHJvcFZhbHVlc0luZGV4T2Zmc2V0O1xuICAgIGlmIChkaXJlY3RpdmVSZWZzW3NpbmdsZVByb3BTdGFydFBvc2l0aW9uXSAhID49IDApIHtcbiAgICAgIC8vIHRoZSBkaXJlY3RpdmUgaGFzIGFscmVhZHkgYmVlbiBwYXRjaGVkIGludG8gdGhlIGNvbnRleHRcbiAgICAgIHJldHVybiAtMTtcbiAgICB9XG5cbiAgICBkaXJlY3RpdmVJbmRleCA9IGRldGVjdGVkSW5kZXggLyBEaXJlY3RpdmVSZWdpc3RyeVZhbHVlc0luZGV4LlNpemU7XG5cbiAgICAvLyBiZWNhdXNlIHRoZSBkaXJlY3RpdmUgYWxyZWFkeSBleGlzdGVkIHRoaXMgbWVhbnMgdGhhdCBpdCB3YXMgc2V0IGR1cmluZyBlbGVtZW50SG9zdEF0dHJzIG9yXG4gICAgLy8gZWxlbWVudFN0YXJ0IHdoaWNoIG1lYW5zIHRoYXQgdGhlIGJpbmRpbmcgdmFsdWVzIHdlcmUgbm90IGhlcmUuIFRoZXJlZm9yZSwgdGhlIHZhbHVlcyBiZWxvd1xuICAgIC8vIG5lZWQgdG8gYmUgYXBwbGllZCBzbyB0aGF0IHNpbmdsZSBjbGFzcyBhbmQgc3R5bGUgcHJvcGVydGllcyBjYW4gYmUgYXNzaWduZWQgbGF0ZXIuXG4gICAgY29uc3Qgc2luZ2xlUHJvcFBvc2l0aW9uSW5kZXggPVxuICAgICAgICBkZXRlY3RlZEluZGV4ICsgRGlyZWN0aXZlUmVnaXN0cnlWYWx1ZXNJbmRleC5TaW5nbGVQcm9wVmFsdWVzSW5kZXhPZmZzZXQ7XG4gICAgZGlyZWN0aXZlUmVmc1tzaW5nbGVQcm9wUG9zaXRpb25JbmRleF0gPSBuZXh0T2Zmc2V0SW5zZXJ0aW9uSW5kZXg7XG5cbiAgICAvLyB0aGUgc2FuaXRpemVyIGlzIGFsc28gYXBhcnQgb2YgdGhlIGJpbmRpbmcgcHJvY2VzcyBhbmQgd2lsbCBiZSB1c2VkIHdoZW4gYmluZGluZ3MgYXJlXG4gICAgLy8gYXBwbGllZC5cbiAgICBjb25zdCBzdHlsZVNhbml0aXplckluZGV4ID0gZGV0ZWN0ZWRJbmRleCArIERpcmVjdGl2ZVJlZ2lzdHJ5VmFsdWVzSW5kZXguU3R5bGVTYW5pdGl6ZXJPZmZzZXQ7XG4gICAgZGlyZWN0aXZlUmVmc1tzdHlsZVNhbml0aXplckluZGV4XSA9IHN0eWxlU2FuaXRpemVyIHx8IG51bGw7XG4gIH1cblxuICByZXR1cm4gZGlyZWN0aXZlSW5kZXg7XG59XG5cbmZ1bmN0aW9uIGdldE1hdGNoaW5nQmluZGluZ0luZGV4KFxuICAgIGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBiaW5kaW5nTmFtZTogc3RyaW5nLCBzdGFydDogbnVtYmVyLCBlbmQ6IG51bWJlcikge1xuICBmb3IgKGxldCBqID0gc3RhcnQ7IGogPCBlbmQ7IGogKz0gU3R5bGluZ0luZGV4LlNpemUpIHtcbiAgICBpZiAoZ2V0UHJvcChjb250ZXh0LCBqKSA9PT0gYmluZGluZ05hbWUpIHJldHVybiBqO1xuICB9XG4gIHJldHVybiAtMTtcbn1cblxuLyoqXG4gKiBTZXRzIGFuZCByZXNvbHZlcyBhbGwgYG11bHRpYCBzdHlsaW5nIG9uIGFuIGBTdHlsaW5nQ29udGV4dGAgc28gdGhhdCB0aGV5IGNhbiBiZVxuICogYXBwbGllZCB0byB0aGUgZWxlbWVudCBvbmNlIGByZW5kZXJTdHlsaW5nYCBpcyBjYWxsZWQuXG4gKlxuICogQWxsIG1pc3Npbmcgc3R5bGVzL2NsYXNzIChhbnkgdmFsdWVzIHRoYXQgYXJlIG5vdCBwcm92aWRlZCBpbiB0aGUgbmV3IGBzdHlsZXNgXG4gKiBvciBgY2xhc3Nlc2AgcGFyYW1zKSB3aWxsIHJlc29sdmUgdG8gYG51bGxgIHdpdGhpbiB0aGVpciByZXNwZWN0aXZlIHBvc2l0aW9uc1xuICogaW4gdGhlIGNvbnRleHQuXG4gKlxuICogQHBhcmFtIGNvbnRleHQgVGhlIHN0eWxpbmcgY29udGV4dCB0aGF0IHdpbGwgYmUgdXBkYXRlZCB3aXRoIHRoZVxuICogICAgbmV3bHkgcHJvdmlkZWQgc3R5bGUgdmFsdWVzLlxuICogQHBhcmFtIGNsYXNzZXNJbnB1dCBUaGUga2V5L3ZhbHVlIG1hcCBvZiBDU1MgY2xhc3MgbmFtZXMgdGhhdCB3aWxsIGJlIHVzZWQgZm9yIHRoZSB1cGRhdGUuXG4gKiBAcGFyYW0gc3R5bGVzSW5wdXQgVGhlIGtleS92YWx1ZSBtYXAgb2YgQ1NTIHN0eWxlcyB0aGF0IHdpbGwgYmUgdXNlZCBmb3IgdGhlIHVwZGF0ZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHVwZGF0ZVN0eWxpbmdNYXAoXG4gICAgY29udGV4dDogU3R5bGluZ0NvbnRleHQsIGNsYXNzZXNJbnB1dDoge1trZXk6IHN0cmluZ106IGFueX0gfCBzdHJpbmcgfFxuICAgICAgICBCb3VuZFBsYXllckZhY3Rvcnk8bnVsbHxzdHJpbmd8e1trZXk6IHN0cmluZ106IGFueX0+fCBOT19DSEFOR0UgfCBudWxsLFxuICAgIHN0eWxlc0lucHV0Pzoge1trZXk6IHN0cmluZ106IGFueX0gfCBCb3VuZFBsYXllckZhY3Rvcnk8bnVsbHx7W2tleTogc3RyaW5nXTogYW55fT58IE5PX0NIQU5HRSB8XG4gICAgICAgIG51bGwsXG4gICAgZGlyZWN0aXZlUmVmPzogYW55KTogdm9pZCB7XG4gIHN0eWxlc0lucHV0ID0gc3R5bGVzSW5wdXQgfHwgbnVsbDtcblxuICBjb25zdCBkaXJlY3RpdmVJbmRleCA9IGdldERpcmVjdGl2ZUluZGV4RnJvbVJlZ2lzdHJ5KGNvbnRleHQsIGRpcmVjdGl2ZVJlZiB8fCBudWxsKTtcbiAgY29uc3QgZWxlbWVudCA9IGNvbnRleHRbU3R5bGluZ0luZGV4LkVsZW1lbnRQb3NpdGlvbl0gIWFzIEhUTUxFbGVtZW50O1xuICBjb25zdCBjbGFzc2VzUGxheWVyQnVpbGRlciA9IGNsYXNzZXNJbnB1dCBpbnN0YW5jZW9mIEJvdW5kUGxheWVyRmFjdG9yeSA/XG4gICAgICBuZXcgQ2xhc3NBbmRTdHlsZVBsYXllckJ1aWxkZXIoY2xhc3Nlc0lucHV0IGFzIGFueSwgZWxlbWVudCwgQmluZGluZ1R5cGUuQ2xhc3MpIDpcbiAgICAgIG51bGw7XG4gIGNvbnN0IHN0eWxlc1BsYXllckJ1aWxkZXIgPSBzdHlsZXNJbnB1dCBpbnN0YW5jZW9mIEJvdW5kUGxheWVyRmFjdG9yeSA/XG4gICAgICBuZXcgQ2xhc3NBbmRTdHlsZVBsYXllckJ1aWxkZXIoc3R5bGVzSW5wdXQgYXMgYW55LCBlbGVtZW50LCBCaW5kaW5nVHlwZS5TdHlsZSkgOlxuICAgICAgbnVsbDtcblxuICBjb25zdCBjbGFzc2VzVmFsdWUgPSBjbGFzc2VzUGxheWVyQnVpbGRlciA/XG4gICAgICAoY2xhc3Nlc0lucHV0IGFzIEJvdW5kUGxheWVyRmFjdG9yeTx7W2tleTogc3RyaW5nXTogYW55fXxzdHJpbmc+KSAhLnZhbHVlIDpcbiAgICAgIGNsYXNzZXNJbnB1dDtcbiAgY29uc3Qgc3R5bGVzVmFsdWUgPSBzdHlsZXNQbGF5ZXJCdWlsZGVyID8gc3R5bGVzSW5wdXQgIS52YWx1ZSA6IHN0eWxlc0lucHV0O1xuICAvLyBlYXJseSBleGl0ICh0aGlzIGlzIHdoYXQncyBkb25lIHRvIGF2b2lkIHVzaW5nIGN0eC5iaW5kKCkgdG8gY2FjaGUgdGhlIHZhbHVlKVxuICBjb25zdCBpZ25vcmVBbGxDbGFzc1VwZGF0ZXMgPSBsaW1pdFRvU2luZ2xlQ2xhc3Nlcyhjb250ZXh0KSB8fCBjbGFzc2VzVmFsdWUgPT09IE5PX0NIQU5HRSB8fFxuICAgICAgY2xhc3Nlc1ZhbHVlID09PSBjb250ZXh0W1N0eWxpbmdJbmRleC5DYWNoZWRDbGFzc1ZhbHVlT3JJbml0aWFsQ2xhc3NTdHJpbmddO1xuICBjb25zdCBpZ25vcmVBbGxTdHlsZVVwZGF0ZXMgPVxuICAgICAgc3R5bGVzVmFsdWUgPT09IE5PX0NIQU5HRSB8fCBzdHlsZXNWYWx1ZSA9PT0gY29udGV4dFtTdHlsaW5nSW5kZXguQ2FjaGVkU3R5bGVWYWx1ZV07XG4gIGlmIChpZ25vcmVBbGxDbGFzc1VwZGF0ZXMgJiYgaWdub3JlQWxsU3R5bGVVcGRhdGVzKSByZXR1cm47XG5cbiAgY29udGV4dFtTdHlsaW5nSW5kZXguQ2FjaGVkQ2xhc3NWYWx1ZU9ySW5pdGlhbENsYXNzU3RyaW5nXSA9IGNsYXNzZXNWYWx1ZTtcbiAgY29udGV4dFtTdHlsaW5nSW5kZXguQ2FjaGVkU3R5bGVWYWx1ZV0gPSBzdHlsZXNWYWx1ZTtcblxuICBsZXQgY2xhc3NOYW1lczogc3RyaW5nW10gPSBFTVBUWV9BUlJBWTtcbiAgbGV0IGFwcGx5QWxsQ2xhc3NlcyA9IGZhbHNlO1xuICBsZXQgcGxheWVyQnVpbGRlcnNBcmVEaXJ0eSA9IGZhbHNlO1xuXG4gIGNvbnN0IGNsYXNzZXNQbGF5ZXJCdWlsZGVySW5kZXggPVxuICAgICAgY2xhc3Nlc1BsYXllckJ1aWxkZXIgPyBQbGF5ZXJJbmRleC5DbGFzc01hcFBsYXllckJ1aWxkZXJQb3NpdGlvbiA6IDA7XG4gIGlmIChoYXNQbGF5ZXJCdWlsZGVyQ2hhbmdlZChcbiAgICAgICAgICBjb250ZXh0LCBjbGFzc2VzUGxheWVyQnVpbGRlciwgUGxheWVySW5kZXguQ2xhc3NNYXBQbGF5ZXJCdWlsZGVyUG9zaXRpb24pKSB7XG4gICAgc2V0UGxheWVyQnVpbGRlcihjb250ZXh0LCBjbGFzc2VzUGxheWVyQnVpbGRlciwgUGxheWVySW5kZXguQ2xhc3NNYXBQbGF5ZXJCdWlsZGVyUG9zaXRpb24pO1xuICAgIHBsYXllckJ1aWxkZXJzQXJlRGlydHkgPSB0cnVlO1xuICB9XG5cbiAgY29uc3Qgc3R5bGVzUGxheWVyQnVpbGRlckluZGV4ID1cbiAgICAgIHN0eWxlc1BsYXllckJ1aWxkZXIgPyBQbGF5ZXJJbmRleC5TdHlsZU1hcFBsYXllckJ1aWxkZXJQb3NpdGlvbiA6IDA7XG4gIGlmIChoYXNQbGF5ZXJCdWlsZGVyQ2hhbmdlZChcbiAgICAgICAgICBjb250ZXh0LCBzdHlsZXNQbGF5ZXJCdWlsZGVyLCBQbGF5ZXJJbmRleC5TdHlsZU1hcFBsYXllckJ1aWxkZXJQb3NpdGlvbikpIHtcbiAgICBzZXRQbGF5ZXJCdWlsZGVyKGNvbnRleHQsIHN0eWxlc1BsYXllckJ1aWxkZXIsIFBsYXllckluZGV4LlN0eWxlTWFwUGxheWVyQnVpbGRlclBvc2l0aW9uKTtcbiAgICBwbGF5ZXJCdWlsZGVyc0FyZURpcnR5ID0gdHJ1ZTtcbiAgfVxuXG4gIC8vIGVhY2ggdGltZSBhIHN0cmluZy1iYXNlZCB2YWx1ZSBwb3BzIHVwIHRoZW4gaXQgc2hvdWxkbid0IHJlcXVpcmUgYSBkZWVwXG4gIC8vIGNoZWNrIG9mIHdoYXQncyBjaGFuZ2VkLlxuICBpZiAoIWlnbm9yZUFsbENsYXNzVXBkYXRlcykge1xuICAgIGlmICh0eXBlb2YgY2xhc3Nlc1ZhbHVlID09ICdzdHJpbmcnKSB7XG4gICAgICBjbGFzc05hbWVzID0gY2xhc3Nlc1ZhbHVlLnNwbGl0KC9cXHMrLyk7XG4gICAgICAvLyB0aGlzIGJvb2xlYW4gaXMgdXNlZCB0byBhdm9pZCBoYXZpbmcgdG8gY3JlYXRlIGEga2V5L3ZhbHVlIG1hcCBvZiBgdHJ1ZWAgdmFsdWVzXG4gICAgICAvLyBzaW5jZSBhIGNsYXNzbmFtZSBzdHJpbmcgaW1wbGllcyB0aGF0IGFsbCB0aG9zZSBjbGFzc2VzIGFyZSBhZGRlZFxuICAgICAgYXBwbHlBbGxDbGFzc2VzID0gdHJ1ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgY2xhc3NOYW1lcyA9IGNsYXNzZXNWYWx1ZSA/IE9iamVjdC5rZXlzKGNsYXNzZXNWYWx1ZSkgOiBFTVBUWV9BUlJBWTtcbiAgICB9XG4gIH1cblxuICBjb25zdCBjbGFzc2VzID0gKGNsYXNzZXNWYWx1ZSB8fCBFTVBUWV9PQkopIGFze1trZXk6IHN0cmluZ106IGFueX07XG4gIGNvbnN0IHN0eWxlUHJvcHMgPSBzdHlsZXNWYWx1ZSA/IE9iamVjdC5rZXlzKHN0eWxlc1ZhbHVlKSA6IEVNUFRZX0FSUkFZO1xuICBjb25zdCBzdHlsZXMgPSBzdHlsZXNWYWx1ZSB8fCBFTVBUWV9PQko7XG5cbiAgY29uc3QgY2xhc3Nlc1N0YXJ0SW5kZXggPSBzdHlsZVByb3BzLmxlbmd0aDtcbiAgbGV0IG11bHRpU3RhcnRJbmRleCA9IGdldE11bHRpU3RhcnRJbmRleChjb250ZXh0KTtcblxuICBsZXQgZGlydHkgPSBmYWxzZTtcbiAgbGV0IGN0eEluZGV4ID0gbXVsdGlTdGFydEluZGV4O1xuXG4gIGxldCBwcm9wSW5kZXggPSAwO1xuICBjb25zdCBwcm9wTGltaXQgPSBzdHlsZVByb3BzLmxlbmd0aCArIGNsYXNzTmFtZXMubGVuZ3RoO1xuXG4gIC8vIHRoZSBtYWluIGxvb3AgaGVyZSB3aWxsIHRyeSBhbmQgZmlndXJlIG91dCBob3cgdGhlIHNoYXBlIG9mIHRoZSBwcm92aWRlZFxuICAvLyBzdHlsZXMgZGlmZmVyIHdpdGggcmVzcGVjdCB0byB0aGUgY29udGV4dC4gTGF0ZXIgaWYgdGhlIGNvbnRleHQvc3R5bGVzL2NsYXNzZXNcbiAgLy8gYXJlIG9mZi1iYWxhbmNlIHRoZW4gdGhleSB3aWxsIGJlIGRlYWx0IGluIGFub3RoZXIgbG9vcCBhZnRlciB0aGlzIG9uZVxuICB3aGlsZSAoY3R4SW5kZXggPCBjb250ZXh0Lmxlbmd0aCAmJiBwcm9wSW5kZXggPCBwcm9wTGltaXQpIHtcbiAgICBjb25zdCBpc0NsYXNzQmFzZWQgPSBwcm9wSW5kZXggPj0gY2xhc3Nlc1N0YXJ0SW5kZXg7XG4gICAgY29uc3QgcHJvY2Vzc1ZhbHVlID1cbiAgICAgICAgKCFpc0NsYXNzQmFzZWQgJiYgIWlnbm9yZUFsbFN0eWxlVXBkYXRlcykgfHwgKGlzQ2xhc3NCYXNlZCAmJiAhaWdub3JlQWxsQ2xhc3NVcGRhdGVzKTtcblxuICAgIC8vIHdoZW4gdGhlcmUgaXMgYSBjYWNoZS1oaXQgZm9yIGEgc3RyaW5nLWJhc2VkIGNsYXNzIHRoZW4gd2Ugc2hvdWxkXG4gICAgLy8gYXZvaWQgZG9pbmcgYW55IHdvcmsgZGlmZmluZyBhbnkgb2YgdGhlIGNoYW5nZXNcbiAgICBpZiAocHJvY2Vzc1ZhbHVlKSB7XG4gICAgICBjb25zdCBhZGp1c3RlZFByb3BJbmRleCA9IGlzQ2xhc3NCYXNlZCA/IHByb3BJbmRleCAtIGNsYXNzZXNTdGFydEluZGV4IDogcHJvcEluZGV4O1xuICAgICAgY29uc3QgbmV3UHJvcDogc3RyaW5nID1cbiAgICAgICAgICBpc0NsYXNzQmFzZWQgPyBjbGFzc05hbWVzW2FkanVzdGVkUHJvcEluZGV4XSA6IHN0eWxlUHJvcHNbYWRqdXN0ZWRQcm9wSW5kZXhdO1xuICAgICAgY29uc3QgbmV3VmFsdWU6IHN0cmluZ3xib29sZWFuID1cbiAgICAgICAgICBpc0NsYXNzQmFzZWQgPyAoYXBwbHlBbGxDbGFzc2VzID8gdHJ1ZSA6IGNsYXNzZXNbbmV3UHJvcF0pIDogc3R5bGVzW25ld1Byb3BdO1xuICAgICAgY29uc3QgcGxheWVyQnVpbGRlckluZGV4ID1cbiAgICAgICAgICBpc0NsYXNzQmFzZWQgPyBjbGFzc2VzUGxheWVyQnVpbGRlckluZGV4IDogc3R5bGVzUGxheWVyQnVpbGRlckluZGV4O1xuXG4gICAgICBjb25zdCBwcm9wID0gZ2V0UHJvcChjb250ZXh0LCBjdHhJbmRleCk7XG4gICAgICBpZiAocHJvcCA9PT0gbmV3UHJvcCkge1xuICAgICAgICBjb25zdCB2YWx1ZSA9IGdldFZhbHVlKGNvbnRleHQsIGN0eEluZGV4KTtcbiAgICAgICAgY29uc3QgZmxhZyA9IGdldFBvaW50ZXJzKGNvbnRleHQsIGN0eEluZGV4KTtcbiAgICAgICAgc2V0UGxheWVyQnVpbGRlckluZGV4KGNvbnRleHQsIGN0eEluZGV4LCBwbGF5ZXJCdWlsZGVySW5kZXgsIGRpcmVjdGl2ZUluZGV4KTtcblxuICAgICAgICBpZiAoaGFzVmFsdWVDaGFuZ2VkKGZsYWcsIHZhbHVlLCBuZXdWYWx1ZSkpIHtcbiAgICAgICAgICBzZXRWYWx1ZShjb250ZXh0LCBjdHhJbmRleCwgbmV3VmFsdWUpO1xuICAgICAgICAgIHBsYXllckJ1aWxkZXJzQXJlRGlydHkgPSBwbGF5ZXJCdWlsZGVyc0FyZURpcnR5IHx8ICEhcGxheWVyQnVpbGRlckluZGV4O1xuXG4gICAgICAgICAgY29uc3QgaW5pdGlhbFZhbHVlID0gZ2V0SW5pdGlhbFZhbHVlKGNvbnRleHQsIGZsYWcpO1xuXG4gICAgICAgICAgLy8gU0tJUCBJRiBJTklUSUFMIENIRUNLXG4gICAgICAgICAgLy8gSWYgdGhlIGZvcm1lciBgdmFsdWVgIGlzIGBudWxsYCB0aGVuIGl0IG1lYW5zIHRoYXQgYW4gaW5pdGlhbCB2YWx1ZVxuICAgICAgICAgIC8vIGNvdWxkIGJlIGJlaW5nIHJlbmRlcmVkIG9uIHNjcmVlbi4gSWYgdGhhdCBpcyB0aGUgY2FzZSB0aGVuIHRoZXJlIGlzXG4gICAgICAgICAgLy8gbm8gcG9pbnQgaW4gdXBkYXRpbmcgdGhlIHZhbHVlIGluY2FzZSBpdCBtYXRjaGVzLiBJbiBvdGhlciB3b3JkcyBpZiB0aGVcbiAgICAgICAgICAvLyBuZXcgdmFsdWUgaXMgdGhlIGV4YWN0IHNhbWUgYXMgdGhlIHByZXZpb3VzbHkgcmVuZGVyZWQgdmFsdWUgKHdoaWNoXG4gICAgICAgICAgLy8gaGFwcGVucyB0byBiZSB0aGUgaW5pdGlhbCB2YWx1ZSkgdGhlbiBkbyBub3RoaW5nLlxuICAgICAgICAgIGlmICh2YWx1ZSAhPSBudWxsIHx8IGhhc1ZhbHVlQ2hhbmdlZChmbGFnLCBpbml0aWFsVmFsdWUsIG5ld1ZhbHVlKSkge1xuICAgICAgICAgICAgc2V0RGlydHkoY29udGV4dCwgY3R4SW5kZXgsIHRydWUpO1xuICAgICAgICAgICAgZGlydHkgPSB0cnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3QgaW5kZXhPZkVudHJ5ID0gZmluZEVudHJ5UG9zaXRpb25CeVByb3AoY29udGV4dCwgbmV3UHJvcCwgY3R4SW5kZXgpO1xuICAgICAgICBpZiAoaW5kZXhPZkVudHJ5ID4gMCkge1xuICAgICAgICAgIC8vIGl0IHdhcyBmb3VuZCBhdCBhIGxhdGVyIHBvaW50IC4uLiBqdXN0IHN3YXAgdGhlIHZhbHVlc1xuICAgICAgICAgIGNvbnN0IHZhbHVlVG9Db21wYXJlID0gZ2V0VmFsdWUoY29udGV4dCwgaW5kZXhPZkVudHJ5KTtcbiAgICAgICAgICBjb25zdCBmbGFnVG9Db21wYXJlID0gZ2V0UG9pbnRlcnMoY29udGV4dCwgaW5kZXhPZkVudHJ5KTtcbiAgICAgICAgICBzd2FwTXVsdGlDb250ZXh0RW50cmllcyhjb250ZXh0LCBjdHhJbmRleCwgaW5kZXhPZkVudHJ5KTtcbiAgICAgICAgICBpZiAoaGFzVmFsdWVDaGFuZ2VkKGZsYWdUb0NvbXBhcmUsIHZhbHVlVG9Db21wYXJlLCBuZXdWYWx1ZSkpIHtcbiAgICAgICAgICAgIGNvbnN0IGluaXRpYWxWYWx1ZSA9IGdldEluaXRpYWxWYWx1ZShjb250ZXh0LCBmbGFnVG9Db21wYXJlKTtcbiAgICAgICAgICAgIHNldFZhbHVlKGNvbnRleHQsIGN0eEluZGV4LCBuZXdWYWx1ZSk7XG5cbiAgICAgICAgICAgIC8vIHNhbWUgaWYgc3RhdGVtZW50IGxvZ2ljIGFzIGFib3ZlIChsb29rIGZvciBTS0lQIElGIElOSVRJQUwgQ0hFQ0spLlxuICAgICAgICAgICAgaWYgKHZhbHVlVG9Db21wYXJlICE9IG51bGwgfHwgaGFzVmFsdWVDaGFuZ2VkKGZsYWdUb0NvbXBhcmUsIGluaXRpYWxWYWx1ZSwgbmV3VmFsdWUpKSB7XG4gICAgICAgICAgICAgIHNldERpcnR5KGNvbnRleHQsIGN0eEluZGV4LCB0cnVlKTtcbiAgICAgICAgICAgICAgcGxheWVyQnVpbGRlcnNBcmVEaXJ0eSA9IHBsYXllckJ1aWxkZXJzQXJlRGlydHkgfHwgISFwbGF5ZXJCdWlsZGVySW5kZXg7XG4gICAgICAgICAgICAgIGRpcnR5ID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gd2Ugb25seSBjYXJlIHRvIGRvIHRoaXMgaWYgdGhlIGluc2VydGlvbiBpcyBpbiB0aGUgbWlkZGxlXG4gICAgICAgICAgY29uc3QgbmV3RmxhZyA9IHByZXBhcmVJbml0aWFsRmxhZyhcbiAgICAgICAgICAgICAgY29udGV4dCwgbmV3UHJvcCwgaXNDbGFzc0Jhc2VkLCBnZXRTdHlsZVNhbml0aXplcihjb250ZXh0LCBkaXJlY3RpdmVJbmRleCkpO1xuICAgICAgICAgIHBsYXllckJ1aWxkZXJzQXJlRGlydHkgPSBwbGF5ZXJCdWlsZGVyc0FyZURpcnR5IHx8ICEhcGxheWVyQnVpbGRlckluZGV4O1xuICAgICAgICAgIGluc2VydE5ld011bHRpUHJvcGVydHkoXG4gICAgICAgICAgICAgIGNvbnRleHQsIGN0eEluZGV4LCBpc0NsYXNzQmFzZWQsIG5ld1Byb3AsIG5ld0ZsYWcsIG5ld1ZhbHVlLCBkaXJlY3RpdmVJbmRleCxcbiAgICAgICAgICAgICAgcGxheWVyQnVpbGRlckluZGV4KTtcbiAgICAgICAgICBkaXJ0eSA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBjdHhJbmRleCArPSBTdHlsaW5nSW5kZXguU2l6ZTtcbiAgICBwcm9wSW5kZXgrKztcbiAgfVxuXG4gIC8vIHRoaXMgbWVhbnMgdGhhdCB0aGVyZSBhcmUgbGVmdC1vdmVyIHZhbHVlcyBpbiB0aGUgY29udGV4dCB0aGF0XG4gIC8vIHdlcmUgbm90IGluY2x1ZGVkIGluIHRoZSBwcm92aWRlZCBzdHlsZXMvY2xhc3NlcyBhbmQgaW4gdGhpc1xuICAvLyBjYXNlIHRoZSAgZ29hbCBpcyB0byBcInJlbW92ZVwiIHRoZW0gZnJvbSB0aGUgY29udGV4dCAoYnkgbnVsbGlmeWluZylcbiAgd2hpbGUgKGN0eEluZGV4IDwgY29udGV4dC5sZW5ndGgpIHtcbiAgICBjb25zdCBmbGFnID0gZ2V0UG9pbnRlcnMoY29udGV4dCwgY3R4SW5kZXgpO1xuICAgIGNvbnN0IGlzQ2xhc3NCYXNlZCA9IChmbGFnICYgU3R5bGluZ0ZsYWdzLkNsYXNzKSA9PT0gU3R5bGluZ0ZsYWdzLkNsYXNzO1xuICAgIGNvbnN0IHByb2Nlc3NWYWx1ZSA9XG4gICAgICAgICghaXNDbGFzc0Jhc2VkICYmICFpZ25vcmVBbGxTdHlsZVVwZGF0ZXMpIHx8IChpc0NsYXNzQmFzZWQgJiYgIWlnbm9yZUFsbENsYXNzVXBkYXRlcyk7XG4gICAgaWYgKHByb2Nlc3NWYWx1ZSkge1xuICAgICAgY29uc3QgdmFsdWUgPSBnZXRWYWx1ZShjb250ZXh0LCBjdHhJbmRleCk7XG4gICAgICBjb25zdCBkb1JlbW92ZVZhbHVlID0gdmFsdWVFeGlzdHModmFsdWUsIGlzQ2xhc3NCYXNlZCk7XG4gICAgICBpZiAoZG9SZW1vdmVWYWx1ZSkge1xuICAgICAgICBzZXREaXJ0eShjb250ZXh0LCBjdHhJbmRleCwgdHJ1ZSk7XG4gICAgICAgIHNldFZhbHVlKGNvbnRleHQsIGN0eEluZGV4LCBudWxsKTtcblxuICAgICAgICAvLyB3ZSBrZWVwIHRoZSBwbGF5ZXIgZmFjdG9yeSB0aGUgc2FtZSBzbyB0aGF0IHRoZSBgbnVsbGVkYCB2YWx1ZSBjYW5cbiAgICAgICAgLy8gYmUgaW5zdHJ1Y3RlZCBpbnRvIHRoZSBwbGF5ZXIgYmVjYXVzZSByZW1vdmluZyBhIHN0eWxlIGFuZC9vciBhIGNsYXNzXG4gICAgICAgIC8vIGlzIGEgdmFsaWQgYW5pbWF0aW9uIHBsYXllciBpbnN0cnVjdGlvbi5cbiAgICAgICAgY29uc3QgcGxheWVyQnVpbGRlckluZGV4ID1cbiAgICAgICAgICAgIGlzQ2xhc3NCYXNlZCA/IGNsYXNzZXNQbGF5ZXJCdWlsZGVySW5kZXggOiBzdHlsZXNQbGF5ZXJCdWlsZGVySW5kZXg7XG4gICAgICAgIHNldFBsYXllckJ1aWxkZXJJbmRleChjb250ZXh0LCBjdHhJbmRleCwgcGxheWVyQnVpbGRlckluZGV4LCBkaXJlY3RpdmVJbmRleCk7XG4gICAgICAgIGRpcnR5ID0gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG4gICAgY3R4SW5kZXggKz0gU3R5bGluZ0luZGV4LlNpemU7XG4gIH1cblxuICAvLyB0aGlzIG1lYW5zIHRoYXQgdGhlcmUgYXJlIGxlZnQtb3ZlciBwcm9wZXJ0aWVzIGluIHRoZSBjb250ZXh0IHRoYXRcbiAgLy8gd2VyZSBub3QgZGV0ZWN0ZWQgaW4gdGhlIGNvbnRleHQgZHVyaW5nIHRoZSBsb29wIGFib3ZlLiBJbiB0aGF0XG4gIC8vIGNhc2Ugd2Ugd2FudCB0byBhZGQgdGhlIG5ldyBlbnRyaWVzIGludG8gdGhlIGxpc3RcbiAgY29uc3Qgc2FuaXRpemVyID0gZ2V0U3R5bGVTYW5pdGl6ZXIoY29udGV4dCwgZGlyZWN0aXZlSW5kZXgpO1xuICB3aGlsZSAocHJvcEluZGV4IDwgcHJvcExpbWl0KSB7XG4gICAgY29uc3QgaXNDbGFzc0Jhc2VkID0gcHJvcEluZGV4ID49IGNsYXNzZXNTdGFydEluZGV4O1xuICAgIGNvbnN0IHByb2Nlc3NWYWx1ZSA9XG4gICAgICAgICghaXNDbGFzc0Jhc2VkICYmICFpZ25vcmVBbGxTdHlsZVVwZGF0ZXMpIHx8IChpc0NsYXNzQmFzZWQgJiYgIWlnbm9yZUFsbENsYXNzVXBkYXRlcyk7XG4gICAgaWYgKHByb2Nlc3NWYWx1ZSkge1xuICAgICAgY29uc3QgYWRqdXN0ZWRQcm9wSW5kZXggPSBpc0NsYXNzQmFzZWQgPyBwcm9wSW5kZXggLSBjbGFzc2VzU3RhcnRJbmRleCA6IHByb3BJbmRleDtcbiAgICAgIGNvbnN0IHByb3AgPSBpc0NsYXNzQmFzZWQgPyBjbGFzc05hbWVzW2FkanVzdGVkUHJvcEluZGV4XSA6IHN0eWxlUHJvcHNbYWRqdXN0ZWRQcm9wSW5kZXhdO1xuICAgICAgY29uc3QgdmFsdWU6IHN0cmluZ3xib29sZWFuID1cbiAgICAgICAgICBpc0NsYXNzQmFzZWQgPyAoYXBwbHlBbGxDbGFzc2VzID8gdHJ1ZSA6IGNsYXNzZXNbcHJvcF0pIDogc3R5bGVzW3Byb3BdO1xuICAgICAgY29uc3QgZmxhZyA9IHByZXBhcmVJbml0aWFsRmxhZyhjb250ZXh0LCBwcm9wLCBpc0NsYXNzQmFzZWQsIHNhbml0aXplcikgfCBTdHlsaW5nRmxhZ3MuRGlydHk7XG4gICAgICBjb25zdCBwbGF5ZXJCdWlsZGVySW5kZXggPVxuICAgICAgICAgIGlzQ2xhc3NCYXNlZCA/IGNsYXNzZXNQbGF5ZXJCdWlsZGVySW5kZXggOiBzdHlsZXNQbGF5ZXJCdWlsZGVySW5kZXg7XG4gICAgICBjb25zdCBjdHhJbmRleCA9IGNvbnRleHQubGVuZ3RoO1xuICAgICAgY29udGV4dC5wdXNoKGZsYWcsIHByb3AsIHZhbHVlLCAwKTtcbiAgICAgIHNldFBsYXllckJ1aWxkZXJJbmRleChjb250ZXh0LCBjdHhJbmRleCwgcGxheWVyQnVpbGRlckluZGV4LCBkaXJlY3RpdmVJbmRleCk7XG4gICAgICBkaXJ0eSA9IHRydWU7XG4gICAgfVxuICAgIHByb3BJbmRleCsrO1xuICB9XG5cbiAgaWYgKGRpcnR5KSB7XG4gICAgc2V0Q29udGV4dERpcnR5KGNvbnRleHQsIHRydWUpO1xuICAgIHNldERpcmVjdGl2ZURpcnR5KGNvbnRleHQsIGRpcmVjdGl2ZUluZGV4LCB0cnVlKTtcbiAgfVxuXG4gIGlmIChwbGF5ZXJCdWlsZGVyc0FyZURpcnR5KSB7XG4gICAgc2V0Q29udGV4dFBsYXllcnNEaXJ0eShjb250ZXh0LCB0cnVlKTtcbiAgfVxufVxuXG4vKipcbiAqIFRoaXMgbWV0aG9kIHdpbGwgdG9nZ2xlIHRoZSByZWZlcmVuY2VkIENTUyBjbGFzcyAoYnkgdGhlIHByb3ZpZGVkIGluZGV4KVxuICogd2l0aGluIHRoZSBnaXZlbiBjb250ZXh0LlxuICpcbiAqIEBwYXJhbSBjb250ZXh0IFRoZSBzdHlsaW5nIGNvbnRleHQgdGhhdCB3aWxsIGJlIHVwZGF0ZWQgd2l0aCB0aGVcbiAqICAgIG5ld2x5IHByb3ZpZGVkIGNsYXNzIHZhbHVlLlxuICogQHBhcmFtIG9mZnNldCBUaGUgaW5kZXggb2YgdGhlIENTUyBjbGFzcyB3aGljaCBpcyBiZWluZyB1cGRhdGVkLlxuICogQHBhcmFtIGFkZE9yUmVtb3ZlIFdoZXRoZXIgb3Igbm90IHRvIGFkZCBvciByZW1vdmUgdGhlIENTUyBjbGFzc1xuICovXG5leHBvcnQgZnVuY3Rpb24gdXBkYXRlQ2xhc3NQcm9wKFxuICAgIGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBvZmZzZXQ6IG51bWJlciwgYWRkT3JSZW1vdmU6IGJvb2xlYW4gfCBCb3VuZFBsYXllckZhY3Rvcnk8Ym9vbGVhbj4sXG4gICAgZGlyZWN0aXZlUmVmPzogYW55KTogdm9pZCB7XG4gIF91cGRhdGVTaW5nbGVTdHlsaW5nVmFsdWUoY29udGV4dCwgb2Zmc2V0LCBhZGRPclJlbW92ZSwgdHJ1ZSwgZGlyZWN0aXZlUmVmKTtcbn1cblxuLyoqXG4gKiBTZXRzIGFuZCByZXNvbHZlcyBhIHNpbmdsZSBzdHlsZSB2YWx1ZSBvbiB0aGUgcHJvdmlkZWQgYFN0eWxpbmdDb250ZXh0YCBzb1xuICogdGhhdCB0aGV5IGNhbiBiZSBhcHBsaWVkIHRvIHRoZSBlbGVtZW50IG9uY2UgYHJlbmRlclN0eWxpbmdgIGlzIGNhbGxlZC5cbiAqXG4gKiBOb3RlIHRoYXQgcHJvcC1sZXZlbCBzdHlsaW5nIHZhbHVlcyBhcmUgY29uc2lkZXJlZCBoaWdoZXIgcHJpb3JpdHkgdGhhbiBhbnkgc3R5bGluZyB0aGF0XG4gKiBoYXMgYmVlbiBhcHBsaWVkIHVzaW5nIGB1cGRhdGVTdHlsaW5nTWFwYCwgdGhlcmVmb3JlLCB3aGVuIHN0eWxpbmcgdmFsdWVzIGFyZSByZW5kZXJlZFxuICogdGhlbiBhbnkgc3R5bGVzL2NsYXNzZXMgdGhhdCBoYXZlIGJlZW4gYXBwbGllZCB1c2luZyB0aGlzIGZ1bmN0aW9uIHdpbGwgYmUgY29uc2lkZXJlZCBmaXJzdFxuICogKHRoZW4gbXVsdGkgdmFsdWVzIHNlY29uZCBhbmQgdGhlbiBpbml0aWFsIHZhbHVlcyBhcyBhIGJhY2t1cCkuXG4gKlxuICogQHBhcmFtIGNvbnRleHQgVGhlIHN0eWxpbmcgY29udGV4dCB0aGF0IHdpbGwgYmUgdXBkYXRlZCB3aXRoIHRoZVxuICogICAgbmV3bHkgcHJvdmlkZWQgc3R5bGUgdmFsdWUuXG4gKiBAcGFyYW0gb2Zmc2V0IFRoZSBpbmRleCBvZiB0aGUgcHJvcGVydHkgd2hpY2ggaXMgYmVpbmcgdXBkYXRlZC5cbiAqIEBwYXJhbSB2YWx1ZSBUaGUgQ1NTIHN0eWxlIHZhbHVlIHRoYXQgd2lsbCBiZSBhc3NpZ25lZFxuICogQHBhcmFtIGRpcmVjdGl2ZVJlZiBhbiBvcHRpb25hbCByZWZlcmVuY2UgdG8gdGhlIGRpcmVjdGl2ZSByZXNwb25zaWJsZVxuICogICAgZm9yIHRoaXMgYmluZGluZyBjaGFuZ2UuIElmIHByZXNlbnQgdGhlbiBzdHlsZSBiaW5kaW5nIHdpbGwgb25seVxuICogICAgYWN0dWFsaXplIGlmIHRoZSBkaXJlY3RpdmUgaGFzIG93bmVyc2hpcCBvdmVyIHRoaXMgYmluZGluZ1xuICogICAgKHNlZSBzdHlsaW5nLnRzI2RpcmVjdGl2ZXMgZm9yIG1vcmUgaW5mb3JtYXRpb24gYWJvdXQgdGhlIGFsZ29yaXRobSkuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB1cGRhdGVTdHlsZVByb3AoXG4gICAgY29udGV4dDogU3R5bGluZ0NvbnRleHQsIG9mZnNldDogbnVtYmVyLFxuICAgIGlucHV0OiBzdHJpbmcgfCBib29sZWFuIHwgbnVsbCB8IEJvdW5kUGxheWVyRmFjdG9yeTxzdHJpbmd8Ym9vbGVhbnxudWxsPixcbiAgICBkaXJlY3RpdmVSZWY/OiBhbnkpOiB2b2lkIHtcbiAgX3VwZGF0ZVNpbmdsZVN0eWxpbmdWYWx1ZShjb250ZXh0LCBvZmZzZXQsIGlucHV0LCBmYWxzZSwgZGlyZWN0aXZlUmVmKTtcbn1cblxuZnVuY3Rpb24gX3VwZGF0ZVNpbmdsZVN0eWxpbmdWYWx1ZShcbiAgICBjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgb2Zmc2V0OiBudW1iZXIsXG4gICAgaW5wdXQ6IHN0cmluZyB8IGJvb2xlYW4gfCBudWxsIHwgQm91bmRQbGF5ZXJGYWN0b3J5PHN0cmluZ3xib29sZWFufG51bGw+LCBpc0NsYXNzQmFzZWQ6IGJvb2xlYW4sXG4gICAgZGlyZWN0aXZlUmVmOiBhbnkpOiB2b2lkIHtcbiAgY29uc3QgZGlyZWN0aXZlSW5kZXggPSBnZXREaXJlY3RpdmVJbmRleEZyb21SZWdpc3RyeShjb250ZXh0LCBkaXJlY3RpdmVSZWYgfHwgbnVsbCk7XG4gIGNvbnN0IHNpbmdsZUluZGV4ID0gZ2V0U2luZ2xlUHJvcEluZGV4VmFsdWUoY29udGV4dCwgZGlyZWN0aXZlSW5kZXgsIG9mZnNldCwgaXNDbGFzc0Jhc2VkKTtcbiAgY29uc3QgY3VyclZhbHVlID0gZ2V0VmFsdWUoY29udGV4dCwgc2luZ2xlSW5kZXgpO1xuICBjb25zdCBjdXJyRmxhZyA9IGdldFBvaW50ZXJzKGNvbnRleHQsIHNpbmdsZUluZGV4KTtcbiAgY29uc3QgY3VyckRpcmVjdGl2ZSA9IGdldERpcmVjdGl2ZUluZGV4RnJvbUVudHJ5KGNvbnRleHQsIHNpbmdsZUluZGV4KTtcbiAgY29uc3QgdmFsdWU6IHN0cmluZ3xib29sZWFufG51bGwgPSAoaW5wdXQgaW5zdGFuY2VvZiBCb3VuZFBsYXllckZhY3RvcnkpID8gaW5wdXQudmFsdWUgOiBpbnB1dDtcblxuICBpZiAoaGFzVmFsdWVDaGFuZ2VkKGN1cnJGbGFnLCBjdXJyVmFsdWUsIHZhbHVlKSAmJlxuICAgICAgYWxsb3dWYWx1ZUNoYW5nZShjdXJyVmFsdWUsIHZhbHVlLCBjdXJyRGlyZWN0aXZlLCBkaXJlY3RpdmVJbmRleCkpIHtcbiAgICBjb25zdCBpc0NsYXNzQmFzZWQgPSAoY3VyckZsYWcgJiBTdHlsaW5nRmxhZ3MuQ2xhc3MpID09PSBTdHlsaW5nRmxhZ3MuQ2xhc3M7XG4gICAgY29uc3QgZWxlbWVudCA9IGNvbnRleHRbU3R5bGluZ0luZGV4LkVsZW1lbnRQb3NpdGlvbl0gIWFzIEhUTUxFbGVtZW50O1xuICAgIGNvbnN0IHBsYXllckJ1aWxkZXIgPSBpbnB1dCBpbnN0YW5jZW9mIEJvdW5kUGxheWVyRmFjdG9yeSA/XG4gICAgICAgIG5ldyBDbGFzc0FuZFN0eWxlUGxheWVyQnVpbGRlcihcbiAgICAgICAgICAgIGlucHV0IGFzIGFueSwgZWxlbWVudCwgaXNDbGFzc0Jhc2VkID8gQmluZGluZ1R5cGUuQ2xhc3MgOiBCaW5kaW5nVHlwZS5TdHlsZSkgOlxuICAgICAgICBudWxsO1xuICAgIGNvbnN0IHZhbHVlID0gKHBsYXllckJ1aWxkZXIgPyAoaW5wdXQgYXMgQm91bmRQbGF5ZXJGYWN0b3J5PGFueT4pLnZhbHVlIDogaW5wdXQpIGFzIHN0cmluZyB8XG4gICAgICAgIGJvb2xlYW4gfCBudWxsO1xuICAgIGNvbnN0IGN1cnJQbGF5ZXJJbmRleCA9IGdldFBsYXllckJ1aWxkZXJJbmRleChjb250ZXh0LCBzaW5nbGVJbmRleCk7XG5cbiAgICBsZXQgcGxheWVyQnVpbGRlcnNBcmVEaXJ0eSA9IGZhbHNlO1xuICAgIGxldCBwbGF5ZXJCdWlsZGVySW5kZXggPSBwbGF5ZXJCdWlsZGVyID8gY3VyclBsYXllckluZGV4IDogMDtcbiAgICBpZiAoaGFzUGxheWVyQnVpbGRlckNoYW5nZWQoY29udGV4dCwgcGxheWVyQnVpbGRlciwgY3VyclBsYXllckluZGV4KSkge1xuICAgICAgY29uc3QgbmV3SW5kZXggPSBzZXRQbGF5ZXJCdWlsZGVyKGNvbnRleHQsIHBsYXllckJ1aWxkZXIsIGN1cnJQbGF5ZXJJbmRleCk7XG4gICAgICBwbGF5ZXJCdWlsZGVySW5kZXggPSBwbGF5ZXJCdWlsZGVyID8gbmV3SW5kZXggOiAwO1xuICAgICAgcGxheWVyQnVpbGRlcnNBcmVEaXJ0eSA9IHRydWU7XG4gICAgfVxuXG4gICAgaWYgKHBsYXllckJ1aWxkZXJzQXJlRGlydHkgfHwgY3VyckRpcmVjdGl2ZSAhPT0gZGlyZWN0aXZlSW5kZXgpIHtcbiAgICAgIHNldFBsYXllckJ1aWxkZXJJbmRleChjb250ZXh0LCBzaW5nbGVJbmRleCwgcGxheWVyQnVpbGRlckluZGV4LCBkaXJlY3RpdmVJbmRleCk7XG4gICAgfVxuXG4gICAgaWYgKGN1cnJEaXJlY3RpdmUgIT09IGRpcmVjdGl2ZUluZGV4KSB7XG4gICAgICBjb25zdCBwcm9wID0gZ2V0UHJvcChjb250ZXh0LCBzaW5nbGVJbmRleCk7XG4gICAgICBjb25zdCBzYW5pdGl6ZXIgPSBnZXRTdHlsZVNhbml0aXplcihjb250ZXh0LCBkaXJlY3RpdmVJbmRleCk7XG4gICAgICBzZXRTYW5pdGl6ZUZsYWcoY29udGV4dCwgc2luZ2xlSW5kZXgsIChzYW5pdGl6ZXIgJiYgc2FuaXRpemVyKHByb3ApKSA/IHRydWUgOiBmYWxzZSk7XG4gICAgfVxuXG4gICAgLy8gdGhlIHZhbHVlIHdpbGwgYWx3YXlzIGdldCB1cGRhdGVkIChldmVuIGlmIHRoZSBkaXJ0eSBmbGFnIGlzIHNraXBwZWQpXG4gICAgc2V0VmFsdWUoY29udGV4dCwgc2luZ2xlSW5kZXgsIHZhbHVlKTtcbiAgICBjb25zdCBpbmRleEZvck11bHRpID0gZ2V0TXVsdGlPclNpbmdsZUluZGV4KGN1cnJGbGFnKTtcblxuICAgIC8vIGlmIHRoZSB2YWx1ZSBpcyB0aGUgc2FtZSBpbiB0aGUgbXVsdGktYXJlYSB0aGVuIHRoZXJlJ3Mgbm8gcG9pbnQgaW4gcmUtYXNzZW1ibGluZ1xuICAgIGNvbnN0IHZhbHVlRm9yTXVsdGkgPSBnZXRWYWx1ZShjb250ZXh0LCBpbmRleEZvck11bHRpKTtcbiAgICBpZiAoIXZhbHVlRm9yTXVsdGkgfHwgaGFzVmFsdWVDaGFuZ2VkKGN1cnJGbGFnLCB2YWx1ZUZvck11bHRpLCB2YWx1ZSkpIHtcbiAgICAgIGxldCBtdWx0aURpcnR5ID0gZmFsc2U7XG4gICAgICBsZXQgc2luZ2xlRGlydHkgPSB0cnVlO1xuXG4gICAgICAvLyBvbmx5IHdoZW4gdGhlIHZhbHVlIGlzIHNldCB0byBgbnVsbGAgc2hvdWxkIHRoZSBtdWx0aS12YWx1ZSBnZXQgZmxhZ2dlZFxuICAgICAgaWYgKCF2YWx1ZUV4aXN0cyh2YWx1ZSwgaXNDbGFzc0Jhc2VkKSAmJiB2YWx1ZUV4aXN0cyh2YWx1ZUZvck11bHRpLCBpc0NsYXNzQmFzZWQpKSB7XG4gICAgICAgIG11bHRpRGlydHkgPSB0cnVlO1xuICAgICAgICBzaW5nbGVEaXJ0eSA9IGZhbHNlO1xuICAgICAgfVxuXG4gICAgICBzZXREaXJ0eShjb250ZXh0LCBpbmRleEZvck11bHRpLCBtdWx0aURpcnR5KTtcbiAgICAgIHNldERpcnR5KGNvbnRleHQsIHNpbmdsZUluZGV4LCBzaW5nbGVEaXJ0eSk7XG4gICAgICBzZXREaXJlY3RpdmVEaXJ0eShjb250ZXh0LCBkaXJlY3RpdmVJbmRleCwgdHJ1ZSk7XG4gICAgICBzZXRDb250ZXh0RGlydHkoY29udGV4dCwgdHJ1ZSk7XG4gICAgfVxuXG4gICAgaWYgKHBsYXllckJ1aWxkZXJzQXJlRGlydHkpIHtcbiAgICAgIHNldENvbnRleHRQbGF5ZXJzRGlydHkoY29udGV4dCwgdHJ1ZSk7XG4gICAgfVxuICB9XG59XG5cblxuLyoqXG4gKiBSZW5kZXJzIGFsbCBxdWV1ZWQgc3R5bGluZyB1c2luZyBhIHJlbmRlcmVyIG9udG8gdGhlIGdpdmVuIGVsZW1lbnQuXG4gKlxuICogVGhpcyBmdW5jdGlvbiB3b3JrcyBieSByZW5kZXJpbmcgYW55IHN0eWxlcyAodGhhdCBoYXZlIGJlZW4gYXBwbGllZFxuICogdXNpbmcgYHVwZGF0ZVN0eWxpbmdNYXBgKSBhbmQgYW55IGNsYXNzZXMgKHRoYXQgaGF2ZSBiZWVuIGFwcGxpZWQgdXNpbmdcbiAqIGB1cGRhdGVTdHlsZVByb3BgKSBvbnRvIHRoZSBwcm92aWRlZCBlbGVtZW50IHVzaW5nIHRoZSBwcm92aWRlZCByZW5kZXJlci5cbiAqIEp1c3QgYmVmb3JlIHRoZSBzdHlsZXMvY2xhc3NlcyBhcmUgcmVuZGVyZWQgYSBmaW5hbCBrZXkvdmFsdWUgc3R5bGUgbWFwXG4gKiB3aWxsIGJlIGFzc2VtYmxlZCAoaWYgYHN0eWxlU3RvcmVgIG9yIGBjbGFzc1N0b3JlYCBhcmUgcHJvdmlkZWQpLlxuICpcbiAqIEBwYXJhbSBsRWxlbWVudCB0aGUgZWxlbWVudCB0aGF0IHRoZSBzdHlsZXMgd2lsbCBiZSByZW5kZXJlZCBvblxuICogQHBhcmFtIGNvbnRleHQgVGhlIHN0eWxpbmcgY29udGV4dCB0aGF0IHdpbGwgYmUgdXNlZCB0byBkZXRlcm1pbmVcbiAqICAgICAgd2hhdCBzdHlsZXMgd2lsbCBiZSByZW5kZXJlZFxuICogQHBhcmFtIHJlbmRlcmVyIHRoZSByZW5kZXJlciB0aGF0IHdpbGwgYmUgdXNlZCB0byBhcHBseSB0aGUgc3R5bGluZ1xuICogQHBhcmFtIGNsYXNzZXNTdG9yZSBpZiBwcm92aWRlZCwgdGhlIHVwZGF0ZWQgY2xhc3MgdmFsdWVzIHdpbGwgYmUgYXBwbGllZFxuICogICAgdG8gdGhpcyBrZXkvdmFsdWUgbWFwIGluc3RlYWQgb2YgYmVpbmcgcmVuZGVyZXJlZCB2aWEgdGhlIHJlbmRlcmVyLlxuICogQHBhcmFtIHN0eWxlc1N0b3JlIGlmIHByb3ZpZGVkLCB0aGUgdXBkYXRlZCBzdHlsZSB2YWx1ZXMgd2lsbCBiZSBhcHBsaWVkXG4gKiAgICB0byB0aGlzIGtleS92YWx1ZSBtYXAgaW5zdGVhZCBvZiBiZWluZyByZW5kZXJlcmVkIHZpYSB0aGUgcmVuZGVyZXIuXG4gKiBAcGFyYW0gZGlyZWN0aXZlUmVmIGFuIG9wdGlvbmFsIGRpcmVjdGl2ZSB0aGF0IHdpbGwgYmUgdXNlZCB0byB0YXJnZXQgd2hpY2hcbiAqICAgIHN0eWxpbmcgdmFsdWVzIGFyZSByZW5kZXJlZC4gSWYgbGVmdCBlbXB0eSwgb25seSB0aGUgYmluZGluZ3MgdGhhdCBhcmVcbiAqICAgIHJlZ2lzdGVyZWQgb24gdGhlIHRlbXBsYXRlIHdpbGwgYmUgcmVuZGVyZWQuXG4gKiBAcmV0dXJucyBudW1iZXIgdGhlIHRvdGFsIGFtb3VudCBvZiBwbGF5ZXJzIHRoYXQgZ290IHF1ZXVlZCBmb3IgYW5pbWF0aW9uIChpZiBhbnkpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZW5kZXJTdHlsaW5nKFxuICAgIGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCByZW5kZXJlcjogUmVuZGVyZXIzLCByb290T3JWaWV3OiBSb290Q29udGV4dCB8IExWaWV3LFxuICAgIGlzRmlyc3RSZW5kZXI6IGJvb2xlYW4sIGNsYXNzZXNTdG9yZT86IEJpbmRpbmdTdG9yZSB8IG51bGwsIHN0eWxlc1N0b3JlPzogQmluZGluZ1N0b3JlIHwgbnVsbCxcbiAgICBkaXJlY3RpdmVSZWY/OiBhbnkpOiBudW1iZXIge1xuICBsZXQgdG90YWxQbGF5ZXJzUXVldWVkID0gMDtcbiAgY29uc3QgdGFyZ2V0RGlyZWN0aXZlSW5kZXggPSBnZXREaXJlY3RpdmVJbmRleEZyb21SZWdpc3RyeShjb250ZXh0LCBkaXJlY3RpdmVSZWYgfHwgbnVsbCk7XG5cbiAgaWYgKGlzQ29udGV4dERpcnR5KGNvbnRleHQpICYmIGlzRGlyZWN0aXZlRGlydHkoY29udGV4dCwgdGFyZ2V0RGlyZWN0aXZlSW5kZXgpKSB7XG4gICAgY29uc3QgZmx1c2hQbGF5ZXJCdWlsZGVyczogYW55ID1cbiAgICAgICAgY29udGV4dFtTdHlsaW5nSW5kZXguTWFzdGVyRmxhZ1Bvc2l0aW9uXSAmIFN0eWxpbmdGbGFncy5QbGF5ZXJCdWlsZGVyc0RpcnR5O1xuICAgIGNvbnN0IG5hdGl2ZSA9IGNvbnRleHRbU3R5bGluZ0luZGV4LkVsZW1lbnRQb3NpdGlvbl0gITtcbiAgICBjb25zdCBtdWx0aVN0YXJ0SW5kZXggPSBnZXRNdWx0aVN0YXJ0SW5kZXgoY29udGV4dCk7XG4gICAgY29uc3Qgb25seVNpbmdsZUNsYXNzZXMgPSBsaW1pdFRvU2luZ2xlQ2xhc3Nlcyhjb250ZXh0KTtcblxuICAgIGxldCBzdGlsbERpcnR5ID0gZmFsc2U7XG4gICAgZm9yIChsZXQgaSA9IFN0eWxpbmdJbmRleC5TaW5nbGVTdHlsZXNTdGFydFBvc2l0aW9uOyBpIDwgY29udGV4dC5sZW5ndGg7XG4gICAgICAgICBpICs9IFN0eWxpbmdJbmRleC5TaXplKSB7XG4gICAgICAvLyB0aGVyZSBpcyBubyBwb2ludCBpbiByZW5kZXJpbmcgc3R5bGVzIHRoYXQgaGF2ZSBub3QgY2hhbmdlZCBvbiBzY3JlZW5cbiAgICAgIGlmIChpc0RpcnR5KGNvbnRleHQsIGkpKSB7XG4gICAgICAgIGNvbnN0IGZsYWcgPSBnZXRQb2ludGVycyhjb250ZXh0LCBpKTtcbiAgICAgICAgY29uc3QgZGlyZWN0aXZlSW5kZXggPSBnZXREaXJlY3RpdmVJbmRleEZyb21FbnRyeShjb250ZXh0LCBpKTtcbiAgICAgICAgaWYgKHRhcmdldERpcmVjdGl2ZUluZGV4ICE9PSBkaXJlY3RpdmVJbmRleCkge1xuICAgICAgICAgIHN0aWxsRGlydHkgPSB0cnVlO1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgcHJvcCA9IGdldFByb3AoY29udGV4dCwgaSk7XG4gICAgICAgIGNvbnN0IHZhbHVlID0gZ2V0VmFsdWUoY29udGV4dCwgaSk7XG4gICAgICAgIGNvbnN0IHN0eWxlU2FuaXRpemVyID1cbiAgICAgICAgICAgIChmbGFnICYgU3R5bGluZ0ZsYWdzLlNhbml0aXplKSA/IGdldFN0eWxlU2FuaXRpemVyKGNvbnRleHQsIGRpcmVjdGl2ZUluZGV4KSA6IG51bGw7XG4gICAgICAgIGNvbnN0IHBsYXllckJ1aWxkZXIgPSBnZXRQbGF5ZXJCdWlsZGVyKGNvbnRleHQsIGkpO1xuICAgICAgICBjb25zdCBpc0NsYXNzQmFzZWQgPSBmbGFnICYgU3R5bGluZ0ZsYWdzLkNsYXNzID8gdHJ1ZSA6IGZhbHNlO1xuICAgICAgICBjb25zdCBpc0luU2luZ2xlUmVnaW9uID0gaSA8IG11bHRpU3RhcnRJbmRleDtcbiAgICAgICAgY29uc3QgcmVhZEluaXRpYWxWYWx1ZSA9ICFpc0NsYXNzQmFzZWQgfHwgIW9ubHlTaW5nbGVDbGFzc2VzO1xuXG4gICAgICAgIGxldCB2YWx1ZVRvQXBwbHk6IHN0cmluZ3xib29sZWFufG51bGwgPSB2YWx1ZTtcblxuICAgICAgICAvLyBWQUxVRSBERUZFUiBDQVNFIDE6IFVzZSBhIG11bHRpIHZhbHVlIGluc3RlYWQgb2YgYSBudWxsIHNpbmdsZSB2YWx1ZVxuICAgICAgICAvLyB0aGlzIGNoZWNrIGltcGxpZXMgdGhhdCBhIHNpbmdsZSB2YWx1ZSB3YXMgcmVtb3ZlZCBhbmQgd2VcbiAgICAgICAgLy8gc2hvdWxkIG5vdyBkZWZlciB0byBhIG11bHRpIHZhbHVlIGFuZCB1c2UgdGhhdCAoaWYgc2V0KS5cbiAgICAgICAgaWYgKGlzSW5TaW5nbGVSZWdpb24gJiYgIXZhbHVlRXhpc3RzKHZhbHVlVG9BcHBseSwgaXNDbGFzc0Jhc2VkKSkge1xuICAgICAgICAgIC8vIHNpbmdsZSB2YWx1ZXMgQUxXQVlTIGhhdmUgYSByZWZlcmVuY2UgdG8gYSBtdWx0aSBpbmRleFxuICAgICAgICAgIGNvbnN0IG11bHRpSW5kZXggPSBnZXRNdWx0aU9yU2luZ2xlSW5kZXgoZmxhZyk7XG4gICAgICAgICAgdmFsdWVUb0FwcGx5ID0gZ2V0VmFsdWUoY29udGV4dCwgbXVsdGlJbmRleCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBWQUxVRSBERUZFUiBDQVNFIDI6IFVzZSB0aGUgaW5pdGlhbCB2YWx1ZSBpZiBhbGwgZWxzZSBmYWlscyAoaXMgZmFsc3kpXG4gICAgICAgIC8vIHRoZSBpbml0aWFsIHZhbHVlIHdpbGwgYWx3YXlzIGJlIGEgc3RyaW5nIG9yIG51bGwsXG4gICAgICAgIC8vIHRoZXJlZm9yZSB3ZSBjYW4gc2FmZWx5IGFkb3B0IGl0IGluY2FzZSB0aGVyZSdzIG5vdGhpbmcgZWxzZVxuICAgICAgICAvLyBub3RlIHRoYXQgdGhpcyBzaG91bGQgYWx3YXlzIGJlIGEgZmFsc3kgY2hlY2sgc2luY2UgYGZhbHNlYCBpcyB1c2VkXG4gICAgICAgIC8vIGZvciBib3RoIGNsYXNzIGFuZCBzdHlsZSBjb21wYXJpc29ucyAoc3R5bGVzIGNhbid0IGJlIGZhbHNlIGFuZCBmYWxzZVxuICAgICAgICAvLyBjbGFzc2VzIGFyZSB0dXJuZWQgb2ZmIGFuZCBzaG91bGQgdGhlcmVmb3JlIGRlZmVyIHRvIHRoZWlyIGluaXRpYWwgdmFsdWVzKVxuICAgICAgICAvLyBOb3RlIHRoYXQgd2UgaWdub3JlIGNsYXNzLWJhc2VkIGRlZmVyYWxzIGJlY2F1c2Ugb3RoZXJ3aXNlIGEgY2xhc3MgY2FuIG5ldmVyXG4gICAgICAgIC8vIGJlIHJlbW92ZWQgaW4gdGhlIGNhc2UgdGhhdCBpdCBleGlzdHMgYXMgdHJ1ZSBpbiB0aGUgaW5pdGlhbCBjbGFzc2VzIGxpc3QuLi5cbiAgICAgICAgaWYgKCFpc0NsYXNzQmFzZWQgJiYgIXZhbHVlRXhpc3RzKHZhbHVlVG9BcHBseSwgaXNDbGFzc0Jhc2VkKSAmJiByZWFkSW5pdGlhbFZhbHVlKSB7XG4gICAgICAgICAgdmFsdWVUb0FwcGx5ID0gZ2V0SW5pdGlhbFZhbHVlKGNvbnRleHQsIGZsYWcpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gaWYgdGhlIGZpcnN0IHJlbmRlciBpcyB0cnVlIHRoZW4gd2UgZG8gbm90IHdhbnQgdG8gc3RhcnQgYXBwbHlpbmcgZmFsc3lcbiAgICAgICAgLy8gdmFsdWVzIHRvIHRoZSBET00gZWxlbWVudCdzIHN0eWxpbmcuIE90aGVyd2lzZSB0aGVuIHdlIGtub3cgdGhlcmUgaGFzXG4gICAgICAgIC8vIGJlZW4gYSBjaGFuZ2UgYW5kIGV2ZW4gaWYgaXQncyBmYWxzeSB0aGVuIGl0J3MgcmVtb3Zpbmcgc29tZXRoaW5nIHRoYXRcbiAgICAgICAgLy8gd2FzIHRydXRoeSBiZWZvcmUuXG4gICAgICAgIGNvbnN0IGRvQXBwbHlWYWx1ZSA9IGlzRmlyc3RSZW5kZXIgPyB2YWx1ZVRvQXBwbHkgOiB0cnVlO1xuICAgICAgICBpZiAoZG9BcHBseVZhbHVlKSB7XG4gICAgICAgICAgaWYgKGlzQ2xhc3NCYXNlZCkge1xuICAgICAgICAgICAgc2V0Q2xhc3MoXG4gICAgICAgICAgICAgICAgbmF0aXZlLCBwcm9wLCB2YWx1ZVRvQXBwbHkgPyB0cnVlIDogZmFsc2UsIHJlbmRlcmVyLCBjbGFzc2VzU3RvcmUsIHBsYXllckJ1aWxkZXIpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzZXRTdHlsZShcbiAgICAgICAgICAgICAgICBuYXRpdmUsIHByb3AsIHZhbHVlVG9BcHBseSBhcyBzdHJpbmcgfCBudWxsLCByZW5kZXJlciwgc3R5bGVTYW5pdGl6ZXIsIHN0eWxlc1N0b3JlLFxuICAgICAgICAgICAgICAgIHBsYXllckJ1aWxkZXIpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHNldERpcnR5KGNvbnRleHQsIGksIGZhbHNlKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoZmx1c2hQbGF5ZXJCdWlsZGVycykge1xuICAgICAgY29uc3Qgcm9vdENvbnRleHQgPVxuICAgICAgICAgIEFycmF5LmlzQXJyYXkocm9vdE9yVmlldykgPyBnZXRSb290Q29udGV4dChyb290T3JWaWV3KSA6IHJvb3RPclZpZXcgYXMgUm9vdENvbnRleHQ7XG4gICAgICBjb25zdCBwbGF5ZXJDb250ZXh0ID0gZ2V0UGxheWVyQ29udGV4dChjb250ZXh0KSAhO1xuICAgICAgY29uc3QgcGxheWVyc1N0YXJ0SW5kZXggPSBwbGF5ZXJDb250ZXh0W1BsYXllckluZGV4Lk5vbkJ1aWxkZXJQbGF5ZXJzU3RhcnRdO1xuICAgICAgZm9yIChsZXQgaSA9IFBsYXllckluZGV4LlBsYXllckJ1aWxkZXJzU3RhcnRQb3NpdGlvbjsgaSA8IHBsYXllcnNTdGFydEluZGV4O1xuICAgICAgICAgICBpICs9IFBsYXllckluZGV4LlBsYXllckFuZFBsYXllckJ1aWxkZXJzVHVwbGVTaXplKSB7XG4gICAgICAgIGNvbnN0IGJ1aWxkZXIgPSBwbGF5ZXJDb250ZXh0W2ldIGFzIENsYXNzQW5kU3R5bGVQbGF5ZXJCdWlsZGVyPGFueT58IG51bGw7XG4gICAgICAgIGNvbnN0IHBsYXllckluc2VydGlvbkluZGV4ID0gaSArIFBsYXllckluZGV4LlBsYXllck9mZnNldFBvc2l0aW9uO1xuICAgICAgICBjb25zdCBvbGRQbGF5ZXIgPSBwbGF5ZXJDb250ZXh0W3BsYXllckluc2VydGlvbkluZGV4XSBhcyBQbGF5ZXIgfCBudWxsO1xuICAgICAgICBpZiAoYnVpbGRlcikge1xuICAgICAgICAgIGNvbnN0IHBsYXllciA9IGJ1aWxkZXIuYnVpbGRQbGF5ZXIob2xkUGxheWVyLCBpc0ZpcnN0UmVuZGVyKTtcbiAgICAgICAgICBpZiAocGxheWVyICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGlmIChwbGF5ZXIgIT0gbnVsbCkge1xuICAgICAgICAgICAgICBjb25zdCB3YXNRdWV1ZWQgPSBhZGRQbGF5ZXJJbnRlcm5hbChcbiAgICAgICAgICAgICAgICAgIHBsYXllckNvbnRleHQsIHJvb3RDb250ZXh0LCBuYXRpdmUgYXMgSFRNTEVsZW1lbnQsIHBsYXllciwgcGxheWVySW5zZXJ0aW9uSW5kZXgpO1xuICAgICAgICAgICAgICB3YXNRdWV1ZWQgJiYgdG90YWxQbGF5ZXJzUXVldWVkKys7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAob2xkUGxheWVyKSB7XG4gICAgICAgICAgICAgIG9sZFBsYXllci5kZXN0cm95KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKG9sZFBsYXllcikge1xuICAgICAgICAgIC8vIHRoZSBwbGF5ZXIgYnVpbGRlciBoYXMgYmVlbiByZW1vdmVkIC4uLiB0aGVyZWZvcmUgd2Ugc2hvdWxkIGRlbGV0ZSB0aGUgYXNzb2NpYXRlZFxuICAgICAgICAgIC8vIHBsYXllclxuICAgICAgICAgIG9sZFBsYXllci5kZXN0cm95KCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHNldENvbnRleHRQbGF5ZXJzRGlydHkoY29udGV4dCwgZmFsc2UpO1xuICAgIH1cblxuICAgIHNldERpcmVjdGl2ZURpcnR5KGNvbnRleHQsIHRhcmdldERpcmVjdGl2ZUluZGV4LCBmYWxzZSk7XG4gICAgc2V0Q29udGV4dERpcnR5KGNvbnRleHQsIHN0aWxsRGlydHkpO1xuICB9XG5cbiAgcmV0dXJuIHRvdGFsUGxheWVyc1F1ZXVlZDtcbn1cblxuLyoqXG4gKiBUaGlzIGZ1bmN0aW9uIHJlbmRlcnMgYSBnaXZlbiBDU1MgcHJvcC92YWx1ZSBlbnRyeSB1c2luZyB0aGVcbiAqIHByb3ZpZGVkIHJlbmRlcmVyLiBJZiBhIGBzdG9yZWAgdmFsdWUgaXMgcHJvdmlkZWQgdGhlblxuICogdGhhdCB3aWxsIGJlIHVzZWQgYSByZW5kZXIgY29udGV4dCBpbnN0ZWFkIG9mIHRoZSBwcm92aWRlZFxuICogcmVuZGVyZXIuXG4gKlxuICogQHBhcmFtIG5hdGl2ZSB0aGUgRE9NIEVsZW1lbnRcbiAqIEBwYXJhbSBwcm9wIHRoZSBDU1Mgc3R5bGUgcHJvcGVydHkgdGhhdCB3aWxsIGJlIHJlbmRlcmVkXG4gKiBAcGFyYW0gdmFsdWUgdGhlIENTUyBzdHlsZSB2YWx1ZSB0aGF0IHdpbGwgYmUgcmVuZGVyZWRcbiAqIEBwYXJhbSByZW5kZXJlclxuICogQHBhcmFtIHN0b3JlIGFuIG9wdGlvbmFsIGtleS92YWx1ZSBtYXAgdGhhdCB3aWxsIGJlIHVzZWQgYXMgYSBjb250ZXh0IHRvIHJlbmRlciBzdHlsZXMgb25cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNldFN0eWxlKFxuICAgIG5hdGl2ZTogYW55LCBwcm9wOiBzdHJpbmcsIHZhbHVlOiBzdHJpbmcgfCBudWxsLCByZW5kZXJlcjogUmVuZGVyZXIzLFxuICAgIHNhbml0aXplcjogU3R5bGVTYW5pdGl6ZUZuIHwgbnVsbCwgc3RvcmU/OiBCaW5kaW5nU3RvcmUgfCBudWxsLFxuICAgIHBsYXllckJ1aWxkZXI/OiBDbGFzc0FuZFN0eWxlUGxheWVyQnVpbGRlcjxhbnk+fCBudWxsKSB7XG4gIHZhbHVlID0gc2FuaXRpemVyICYmIHZhbHVlID8gc2FuaXRpemVyKHByb3AsIHZhbHVlKSA6IHZhbHVlO1xuICBpZiAoc3RvcmUgfHwgcGxheWVyQnVpbGRlcikge1xuICAgIGlmIChzdG9yZSkge1xuICAgICAgc3RvcmUuc2V0VmFsdWUocHJvcCwgdmFsdWUpO1xuICAgIH1cbiAgICBpZiAocGxheWVyQnVpbGRlcikge1xuICAgICAgcGxheWVyQnVpbGRlci5zZXRWYWx1ZShwcm9wLCB2YWx1ZSk7XG4gICAgfVxuICB9IGVsc2UgaWYgKHZhbHVlKSB7XG4gICAgdmFsdWUgPSB2YWx1ZS50b1N0cmluZygpOyAgLy8gb3BhY2l0eSwgei1pbmRleCBhbmQgZmxleGJveCBhbGwgaGF2ZSBudW1iZXIgdmFsdWVzIHdoaWNoIG1heSBub3RcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBhc3NpZ24gYXMgbnVtYmVyc1xuICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJTZXRTdHlsZSsrO1xuICAgIGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSA/XG4gICAgICAgIHJlbmRlcmVyLnNldFN0eWxlKG5hdGl2ZSwgcHJvcCwgdmFsdWUsIFJlbmRlcmVyU3R5bGVGbGFnczMuRGFzaENhc2UpIDpcbiAgICAgICAgbmF0aXZlWydzdHlsZSddLnNldFByb3BlcnR5KHByb3AsIHZhbHVlKTtcbiAgfSBlbHNlIHtcbiAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyUmVtb3ZlU3R5bGUrKztcbiAgICBpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikgP1xuICAgICAgICByZW5kZXJlci5yZW1vdmVTdHlsZShuYXRpdmUsIHByb3AsIFJlbmRlcmVyU3R5bGVGbGFnczMuRGFzaENhc2UpIDpcbiAgICAgICAgbmF0aXZlWydzdHlsZSddLnJlbW92ZVByb3BlcnR5KHByb3ApO1xuICB9XG59XG5cbi8qKlxuICogVGhpcyBmdW5jdGlvbiByZW5kZXJzIGEgZ2l2ZW4gQ1NTIGNsYXNzIHZhbHVlIHVzaW5nIHRoZSBwcm92aWRlZFxuICogcmVuZGVyZXIgKGJ5IGFkZGluZyBvciByZW1vdmluZyBpdCBmcm9tIHRoZSBwcm92aWRlZCBlbGVtZW50KS5cbiAqIElmIGEgYHN0b3JlYCB2YWx1ZSBpcyBwcm92aWRlZCB0aGVuIHRoYXQgd2lsbCBiZSB1c2VkIGEgcmVuZGVyXG4gKiBjb250ZXh0IGluc3RlYWQgb2YgdGhlIHByb3ZpZGVkIHJlbmRlcmVyLlxuICpcbiAqIEBwYXJhbSBuYXRpdmUgdGhlIERPTSBFbGVtZW50XG4gKiBAcGFyYW0gcHJvcCB0aGUgQ1NTIHN0eWxlIHByb3BlcnR5IHRoYXQgd2lsbCBiZSByZW5kZXJlZFxuICogQHBhcmFtIHZhbHVlIHRoZSBDU1Mgc3R5bGUgdmFsdWUgdGhhdCB3aWxsIGJlIHJlbmRlcmVkXG4gKiBAcGFyYW0gcmVuZGVyZXJcbiAqIEBwYXJhbSBzdG9yZSBhbiBvcHRpb25hbCBrZXkvdmFsdWUgbWFwIHRoYXQgd2lsbCBiZSB1c2VkIGFzIGEgY29udGV4dCB0byByZW5kZXIgc3R5bGVzIG9uXG4gKi9cbmZ1bmN0aW9uIHNldENsYXNzKFxuICAgIG5hdGl2ZTogYW55LCBjbGFzc05hbWU6IHN0cmluZywgYWRkOiBib29sZWFuLCByZW5kZXJlcjogUmVuZGVyZXIzLCBzdG9yZT86IEJpbmRpbmdTdG9yZSB8IG51bGwsXG4gICAgcGxheWVyQnVpbGRlcj86IENsYXNzQW5kU3R5bGVQbGF5ZXJCdWlsZGVyPGFueT58IG51bGwpIHtcbiAgaWYgKHN0b3JlIHx8IHBsYXllckJ1aWxkZXIpIHtcbiAgICBpZiAoc3RvcmUpIHtcbiAgICAgIHN0b3JlLnNldFZhbHVlKGNsYXNzTmFtZSwgYWRkKTtcbiAgICB9XG4gICAgaWYgKHBsYXllckJ1aWxkZXIpIHtcbiAgICAgIHBsYXllckJ1aWxkZXIuc2V0VmFsdWUoY2xhc3NOYW1lLCBhZGQpO1xuICAgIH1cbiAgfSBlbHNlIGlmIChhZGQpIHtcbiAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyQWRkQ2xhc3MrKztcbiAgICBpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikgPyByZW5kZXJlci5hZGRDbGFzcyhuYXRpdmUsIGNsYXNzTmFtZSkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hdGl2ZVsnY2xhc3NMaXN0J10uYWRkKGNsYXNzTmFtZSk7XG4gIH0gZWxzZSB7XG4gICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlclJlbW92ZUNsYXNzKys7XG4gICAgaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpID8gcmVuZGVyZXIucmVtb3ZlQ2xhc3MobmF0aXZlLCBjbGFzc05hbWUpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYXRpdmVbJ2NsYXNzTGlzdCddLnJlbW92ZShjbGFzc05hbWUpO1xuICB9XG59XG5cbmZ1bmN0aW9uIHNldFNhbml0aXplRmxhZyhjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgaW5kZXg6IG51bWJlciwgc2FuaXRpemVZZXM6IGJvb2xlYW4pIHtcbiAgaWYgKHNhbml0aXplWWVzKSB7XG4gICAgKGNvbnRleHRbaW5kZXhdIGFzIG51bWJlcikgfD0gU3R5bGluZ0ZsYWdzLlNhbml0aXplO1xuICB9IGVsc2Uge1xuICAgIChjb250ZXh0W2luZGV4XSBhcyBudW1iZXIpICY9IH5TdHlsaW5nRmxhZ3MuU2FuaXRpemU7XG4gIH1cbn1cblxuZnVuY3Rpb24gc2V0RGlydHkoY29udGV4dDogU3R5bGluZ0NvbnRleHQsIGluZGV4OiBudW1iZXIsIGlzRGlydHlZZXM6IGJvb2xlYW4pIHtcbiAgY29uc3QgYWRqdXN0ZWRJbmRleCA9XG4gICAgICBpbmRleCA+PSBTdHlsaW5nSW5kZXguU2luZ2xlU3R5bGVzU3RhcnRQb3NpdGlvbiA/IChpbmRleCArIFN0eWxpbmdJbmRleC5GbGFnc09mZnNldCkgOiBpbmRleDtcbiAgaWYgKGlzRGlydHlZZXMpIHtcbiAgICAoY29udGV4dFthZGp1c3RlZEluZGV4XSBhcyBudW1iZXIpIHw9IFN0eWxpbmdGbGFncy5EaXJ0eTtcbiAgfSBlbHNlIHtcbiAgICAoY29udGV4dFthZGp1c3RlZEluZGV4XSBhcyBudW1iZXIpICY9IH5TdHlsaW5nRmxhZ3MuRGlydHk7XG4gIH1cbn1cblxuZnVuY3Rpb24gaXNEaXJ0eShjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgaW5kZXg6IG51bWJlcik6IGJvb2xlYW4ge1xuICBjb25zdCBhZGp1c3RlZEluZGV4ID1cbiAgICAgIGluZGV4ID49IFN0eWxpbmdJbmRleC5TaW5nbGVTdHlsZXNTdGFydFBvc2l0aW9uID8gKGluZGV4ICsgU3R5bGluZ0luZGV4LkZsYWdzT2Zmc2V0KSA6IGluZGV4O1xuICByZXR1cm4gKChjb250ZXh0W2FkanVzdGVkSW5kZXhdIGFzIG51bWJlcikgJiBTdHlsaW5nRmxhZ3MuRGlydHkpID09IFN0eWxpbmdGbGFncy5EaXJ0eTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzQ2xhc3NCYXNlZFZhbHVlKGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBpbmRleDogbnVtYmVyKTogYm9vbGVhbiB7XG4gIGNvbnN0IGFkanVzdGVkSW5kZXggPVxuICAgICAgaW5kZXggPj0gU3R5bGluZ0luZGV4LlNpbmdsZVN0eWxlc1N0YXJ0UG9zaXRpb24gPyAoaW5kZXggKyBTdHlsaW5nSW5kZXguRmxhZ3NPZmZzZXQpIDogaW5kZXg7XG4gIHJldHVybiAoKGNvbnRleHRbYWRqdXN0ZWRJbmRleF0gYXMgbnVtYmVyKSAmIFN0eWxpbmdGbGFncy5DbGFzcykgPT0gU3R5bGluZ0ZsYWdzLkNsYXNzO1xufVxuXG5mdW5jdGlvbiBpc1Nhbml0aXphYmxlKGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBpbmRleDogbnVtYmVyKTogYm9vbGVhbiB7XG4gIGNvbnN0IGFkanVzdGVkSW5kZXggPVxuICAgICAgaW5kZXggPj0gU3R5bGluZ0luZGV4LlNpbmdsZVN0eWxlc1N0YXJ0UG9zaXRpb24gPyAoaW5kZXggKyBTdHlsaW5nSW5kZXguRmxhZ3NPZmZzZXQpIDogaW5kZXg7XG4gIHJldHVybiAoKGNvbnRleHRbYWRqdXN0ZWRJbmRleF0gYXMgbnVtYmVyKSAmIFN0eWxpbmdGbGFncy5TYW5pdGl6ZSkgPT0gU3R5bGluZ0ZsYWdzLlNhbml0aXplO1xufVxuXG5mdW5jdGlvbiBwb2ludGVycyhjb25maWdGbGFnOiBudW1iZXIsIHN0YXRpY0luZGV4OiBudW1iZXIsIGR5bmFtaWNJbmRleDogbnVtYmVyKSB7XG4gIHJldHVybiAoY29uZmlnRmxhZyAmIFN0eWxpbmdGbGFncy5CaXRNYXNrKSB8IChzdGF0aWNJbmRleCA8PCBTdHlsaW5nRmxhZ3MuQml0Q291bnRTaXplKSB8XG4gICAgICAoZHluYW1pY0luZGV4IDw8IChTdHlsaW5nSW5kZXguQml0Q291bnRTaXplICsgU3R5bGluZ0ZsYWdzLkJpdENvdW50U2l6ZSkpO1xufVxuXG5mdW5jdGlvbiBnZXRJbml0aWFsVmFsdWUoY29udGV4dDogU3R5bGluZ0NvbnRleHQsIGZsYWc6IG51bWJlcik6IHN0cmluZ3xib29sZWFufG51bGwge1xuICBjb25zdCBpbmRleCA9IGdldEluaXRpYWxJbmRleChmbGFnKTtcbiAgY29uc3QgZW50cnlJc0NsYXNzQmFzZWQgPSBmbGFnICYgU3R5bGluZ0ZsYWdzLkNsYXNzO1xuICBjb25zdCBpbml0aWFsVmFsdWVzID0gZW50cnlJc0NsYXNzQmFzZWQgPyBjb250ZXh0W1N0eWxpbmdJbmRleC5Jbml0aWFsQ2xhc3NWYWx1ZXNQb3NpdGlvbl0gOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250ZXh0W1N0eWxpbmdJbmRleC5Jbml0aWFsU3R5bGVWYWx1ZXNQb3NpdGlvbl07XG4gIHJldHVybiBpbml0aWFsVmFsdWVzW2luZGV4XTtcbn1cblxuZnVuY3Rpb24gZ2V0SW5pdGlhbEluZGV4KGZsYWc6IG51bWJlcik6IG51bWJlciB7XG4gIHJldHVybiAoZmxhZyA+PiBTdHlsaW5nRmxhZ3MuQml0Q291bnRTaXplKSAmIFN0eWxpbmdJbmRleC5CaXRNYXNrO1xufVxuXG5mdW5jdGlvbiBnZXRNdWx0aU9yU2luZ2xlSW5kZXgoZmxhZzogbnVtYmVyKTogbnVtYmVyIHtcbiAgY29uc3QgaW5kZXggPVxuICAgICAgKGZsYWcgPj4gKFN0eWxpbmdJbmRleC5CaXRDb3VudFNpemUgKyBTdHlsaW5nRmxhZ3MuQml0Q291bnRTaXplKSkgJiBTdHlsaW5nSW5kZXguQml0TWFzaztcbiAgcmV0dXJuIGluZGV4ID49IFN0eWxpbmdJbmRleC5TaW5nbGVTdHlsZXNTdGFydFBvc2l0aW9uID8gaW5kZXggOiAtMTtcbn1cblxuZnVuY3Rpb24gZ2V0TXVsdGlTdGFydEluZGV4KGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0KTogbnVtYmVyIHtcbiAgcmV0dXJuIGdldE11bHRpT3JTaW5nbGVJbmRleChjb250ZXh0W1N0eWxpbmdJbmRleC5NYXN0ZXJGbGFnUG9zaXRpb25dKSBhcyBudW1iZXI7XG59XG5cbmZ1bmN0aW9uIHNldFByb3AoY29udGV4dDogU3R5bGluZ0NvbnRleHQsIGluZGV4OiBudW1iZXIsIHByb3A6IHN0cmluZykge1xuICBjb250ZXh0W2luZGV4ICsgU3R5bGluZ0luZGV4LlByb3BlcnR5T2Zmc2V0XSA9IHByb3A7XG59XG5cbmZ1bmN0aW9uIHNldFZhbHVlKGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBpbmRleDogbnVtYmVyLCB2YWx1ZTogc3RyaW5nIHwgbnVsbCB8IGJvb2xlYW4pIHtcbiAgY29udGV4dFtpbmRleCArIFN0eWxpbmdJbmRleC5WYWx1ZU9mZnNldF0gPSB2YWx1ZTtcbn1cblxuZnVuY3Rpb24gaGFzUGxheWVyQnVpbGRlckNoYW5nZWQoXG4gICAgY29udGV4dDogU3R5bGluZ0NvbnRleHQsIGJ1aWxkZXI6IENsYXNzQW5kU3R5bGVQbGF5ZXJCdWlsZGVyPGFueT58IG51bGwsIGluZGV4OiBudW1iZXIpIHtcbiAgY29uc3QgcGxheWVyQ29udGV4dCA9IGNvbnRleHRbU3R5bGluZ0luZGV4LlBsYXllckNvbnRleHRdICE7XG4gIGlmIChidWlsZGVyKSB7XG4gICAgaWYgKCFwbGF5ZXJDb250ZXh0IHx8IGluZGV4ID09PSAwKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH0gZWxzZSBpZiAoIXBsYXllckNvbnRleHQpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgcmV0dXJuIHBsYXllckNvbnRleHRbaW5kZXhdICE9PSBidWlsZGVyO1xufVxuXG5mdW5jdGlvbiBzZXRQbGF5ZXJCdWlsZGVyKFxuICAgIGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBidWlsZGVyOiBDbGFzc0FuZFN0eWxlUGxheWVyQnVpbGRlcjxhbnk+fCBudWxsLFxuICAgIGluc2VydGlvbkluZGV4OiBudW1iZXIpOiBudW1iZXIge1xuICBsZXQgcGxheWVyQ29udGV4dCA9IGNvbnRleHRbU3R5bGluZ0luZGV4LlBsYXllckNvbnRleHRdIHx8IGFsbG9jUGxheWVyQ29udGV4dChjb250ZXh0KTtcbiAgaWYgKGluc2VydGlvbkluZGV4ID4gMCkge1xuICAgIHBsYXllckNvbnRleHRbaW5zZXJ0aW9uSW5kZXhdID0gYnVpbGRlcjtcbiAgfSBlbHNlIHtcbiAgICBpbnNlcnRpb25JbmRleCA9IHBsYXllckNvbnRleHRbUGxheWVySW5kZXguTm9uQnVpbGRlclBsYXllcnNTdGFydF07XG4gICAgcGxheWVyQ29udGV4dC5zcGxpY2UoaW5zZXJ0aW9uSW5kZXgsIDAsIGJ1aWxkZXIsIG51bGwpO1xuICAgIHBsYXllckNvbnRleHRbUGxheWVySW5kZXguTm9uQnVpbGRlclBsYXllcnNTdGFydF0gKz1cbiAgICAgICAgUGxheWVySW5kZXguUGxheWVyQW5kUGxheWVyQnVpbGRlcnNUdXBsZVNpemU7XG4gIH1cbiAgcmV0dXJuIGluc2VydGlvbkluZGV4O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZGlyZWN0aXZlT3duZXJQb2ludGVycyhkaXJlY3RpdmVJbmRleDogbnVtYmVyLCBwbGF5ZXJJbmRleDogbnVtYmVyKSB7XG4gIHJldHVybiAocGxheWVySW5kZXggPDwgRGlyZWN0aXZlT3duZXJBbmRQbGF5ZXJCdWlsZGVySW5kZXguQml0Q291bnRTaXplKSB8IGRpcmVjdGl2ZUluZGV4O1xufVxuXG5mdW5jdGlvbiBzZXRQbGF5ZXJCdWlsZGVySW5kZXgoXG4gICAgY29udGV4dDogU3R5bGluZ0NvbnRleHQsIGluZGV4OiBudW1iZXIsIHBsYXllckJ1aWxkZXJJbmRleDogbnVtYmVyLCBkaXJlY3RpdmVJbmRleDogbnVtYmVyKSB7XG4gIGNvbnN0IHZhbHVlID0gZGlyZWN0aXZlT3duZXJQb2ludGVycyhkaXJlY3RpdmVJbmRleCwgcGxheWVyQnVpbGRlckluZGV4KTtcbiAgY29udGV4dFtpbmRleCArIFN0eWxpbmdJbmRleC5QbGF5ZXJCdWlsZGVySW5kZXhPZmZzZXRdID0gdmFsdWU7XG59XG5cbmZ1bmN0aW9uIGdldFBsYXllckJ1aWxkZXJJbmRleChjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgaW5kZXg6IG51bWJlcik6IG51bWJlciB7XG4gIGNvbnN0IGZsYWcgPSBjb250ZXh0W2luZGV4ICsgU3R5bGluZ0luZGV4LlBsYXllckJ1aWxkZXJJbmRleE9mZnNldF0gYXMgbnVtYmVyO1xuICBjb25zdCBwbGF5ZXJCdWlsZGVySW5kZXggPSAoZmxhZyA+PiBEaXJlY3RpdmVPd25lckFuZFBsYXllckJ1aWxkZXJJbmRleC5CaXRDb3VudFNpemUpICZcbiAgICAgIERpcmVjdGl2ZU93bmVyQW5kUGxheWVyQnVpbGRlckluZGV4LkJpdE1hc2s7XG4gIHJldHVybiBwbGF5ZXJCdWlsZGVySW5kZXg7XG59XG5cbmZ1bmN0aW9uIGdldFBsYXllckJ1aWxkZXIoY29udGV4dDogU3R5bGluZ0NvbnRleHQsIGluZGV4OiBudW1iZXIpOiBDbGFzc0FuZFN0eWxlUGxheWVyQnVpbGRlcjxhbnk+fFxuICAgIG51bGwge1xuICBjb25zdCBwbGF5ZXJCdWlsZGVySW5kZXggPSBnZXRQbGF5ZXJCdWlsZGVySW5kZXgoY29udGV4dCwgaW5kZXgpO1xuICBpZiAocGxheWVyQnVpbGRlckluZGV4KSB7XG4gICAgY29uc3QgcGxheWVyQ29udGV4dCA9IGNvbnRleHRbU3R5bGluZ0luZGV4LlBsYXllckNvbnRleHRdO1xuICAgIGlmIChwbGF5ZXJDb250ZXh0KSB7XG4gICAgICByZXR1cm4gcGxheWVyQ29udGV4dFtwbGF5ZXJCdWlsZGVySW5kZXhdIGFzIENsYXNzQW5kU3R5bGVQbGF5ZXJCdWlsZGVyPGFueT58IG51bGw7XG4gICAgfVxuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG5mdW5jdGlvbiBzZXRGbGFnKGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBpbmRleDogbnVtYmVyLCBmbGFnOiBudW1iZXIpIHtcbiAgY29uc3QgYWRqdXN0ZWRJbmRleCA9XG4gICAgICBpbmRleCA9PT0gU3R5bGluZ0luZGV4Lk1hc3RlckZsYWdQb3NpdGlvbiA/IGluZGV4IDogKGluZGV4ICsgU3R5bGluZ0luZGV4LkZsYWdzT2Zmc2V0KTtcbiAgY29udGV4dFthZGp1c3RlZEluZGV4XSA9IGZsYWc7XG59XG5cbmZ1bmN0aW9uIGdldFBvaW50ZXJzKGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBpbmRleDogbnVtYmVyKTogbnVtYmVyIHtcbiAgY29uc3QgYWRqdXN0ZWRJbmRleCA9XG4gICAgICBpbmRleCA9PT0gU3R5bGluZ0luZGV4Lk1hc3RlckZsYWdQb3NpdGlvbiA/IGluZGV4IDogKGluZGV4ICsgU3R5bGluZ0luZGV4LkZsYWdzT2Zmc2V0KTtcbiAgcmV0dXJuIGNvbnRleHRbYWRqdXN0ZWRJbmRleF0gYXMgbnVtYmVyO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0VmFsdWUoY29udGV4dDogU3R5bGluZ0NvbnRleHQsIGluZGV4OiBudW1iZXIpOiBzdHJpbmd8Ym9vbGVhbnxudWxsIHtcbiAgcmV0dXJuIGNvbnRleHRbaW5kZXggKyBTdHlsaW5nSW5kZXguVmFsdWVPZmZzZXRdIGFzIHN0cmluZyB8IGJvb2xlYW4gfCBudWxsO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0UHJvcChjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgaW5kZXg6IG51bWJlcik6IHN0cmluZyB7XG4gIHJldHVybiBjb250ZXh0W2luZGV4ICsgU3R5bGluZ0luZGV4LlByb3BlcnR5T2Zmc2V0XSBhcyBzdHJpbmc7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0NvbnRleHREaXJ0eShjb250ZXh0OiBTdHlsaW5nQ29udGV4dCk6IGJvb2xlYW4ge1xuICByZXR1cm4gaXNEaXJ0eShjb250ZXh0LCBTdHlsaW5nSW5kZXguTWFzdGVyRmxhZ1Bvc2l0aW9uKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGxpbWl0VG9TaW5nbGVDbGFzc2VzKGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0KSB7XG4gIHJldHVybiBjb250ZXh0W1N0eWxpbmdJbmRleC5NYXN0ZXJGbGFnUG9zaXRpb25dICYgU3R5bGluZ0ZsYWdzLk9ubHlQcm9jZXNzU2luZ2xlQ2xhc3Nlcztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNldENvbnRleHREaXJ0eShjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgaXNEaXJ0eVllczogYm9vbGVhbik6IHZvaWQge1xuICBzZXREaXJ0eShjb250ZXh0LCBTdHlsaW5nSW5kZXguTWFzdGVyRmxhZ1Bvc2l0aW9uLCBpc0RpcnR5WWVzKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNldENvbnRleHRQbGF5ZXJzRGlydHkoY29udGV4dDogU3R5bGluZ0NvbnRleHQsIGlzRGlydHlZZXM6IGJvb2xlYW4pOiB2b2lkIHtcbiAgaWYgKGlzRGlydHlZZXMpIHtcbiAgICAoY29udGV4dFtTdHlsaW5nSW5kZXguTWFzdGVyRmxhZ1Bvc2l0aW9uXSBhcyBudW1iZXIpIHw9IFN0eWxpbmdGbGFncy5QbGF5ZXJCdWlsZGVyc0RpcnR5O1xuICB9IGVsc2Uge1xuICAgIChjb250ZXh0W1N0eWxpbmdJbmRleC5NYXN0ZXJGbGFnUG9zaXRpb25dIGFzIG51bWJlcikgJj0gflN0eWxpbmdGbGFncy5QbGF5ZXJCdWlsZGVyc0RpcnR5O1xuICB9XG59XG5cbmZ1bmN0aW9uIGZpbmRFbnRyeVBvc2l0aW9uQnlQcm9wKFxuICAgIGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBwcm9wOiBzdHJpbmcsIHN0YXJ0SW5kZXg/OiBudW1iZXIpOiBudW1iZXIge1xuICBmb3IgKGxldCBpID0gKHN0YXJ0SW5kZXggfHwgMCkgKyBTdHlsaW5nSW5kZXguUHJvcGVydHlPZmZzZXQ7IGkgPCBjb250ZXh0Lmxlbmd0aDtcbiAgICAgICBpICs9IFN0eWxpbmdJbmRleC5TaXplKSB7XG4gICAgY29uc3QgdGhpc1Byb3AgPSBjb250ZXh0W2ldO1xuICAgIGlmICh0aGlzUHJvcCA9PSBwcm9wKSB7XG4gICAgICByZXR1cm4gaSAtIFN0eWxpbmdJbmRleC5Qcm9wZXJ0eU9mZnNldDtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIC0xO1xufVxuXG5mdW5jdGlvbiBzd2FwTXVsdGlDb250ZXh0RW50cmllcyhjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgaW5kZXhBOiBudW1iZXIsIGluZGV4QjogbnVtYmVyKSB7XG4gIGNvbnN0IHRtcFZhbHVlID0gZ2V0VmFsdWUoY29udGV4dCwgaW5kZXhBKTtcbiAgY29uc3QgdG1wUHJvcCA9IGdldFByb3AoY29udGV4dCwgaW5kZXhBKTtcbiAgY29uc3QgdG1wRmxhZyA9IGdldFBvaW50ZXJzKGNvbnRleHQsIGluZGV4QSk7XG4gIGNvbnN0IHRtcFBsYXllckJ1aWxkZXJJbmRleCA9IGdldFBsYXllckJ1aWxkZXJJbmRleChjb250ZXh0LCBpbmRleEEpO1xuXG4gIGxldCBmbGFnQSA9IHRtcEZsYWc7XG4gIGxldCBmbGFnQiA9IGdldFBvaW50ZXJzKGNvbnRleHQsIGluZGV4Qik7XG5cbiAgY29uc3Qgc2luZ2xlSW5kZXhBID0gZ2V0TXVsdGlPclNpbmdsZUluZGV4KGZsYWdBKTtcbiAgaWYgKHNpbmdsZUluZGV4QSA+PSAwKSB7XG4gICAgY29uc3QgX2ZsYWcgPSBnZXRQb2ludGVycyhjb250ZXh0LCBzaW5nbGVJbmRleEEpO1xuICAgIGNvbnN0IF9pbml0aWFsID0gZ2V0SW5pdGlhbEluZGV4KF9mbGFnKTtcbiAgICBzZXRGbGFnKGNvbnRleHQsIHNpbmdsZUluZGV4QSwgcG9pbnRlcnMoX2ZsYWcsIF9pbml0aWFsLCBpbmRleEIpKTtcbiAgfVxuXG4gIGNvbnN0IHNpbmdsZUluZGV4QiA9IGdldE11bHRpT3JTaW5nbGVJbmRleChmbGFnQik7XG4gIGlmIChzaW5nbGVJbmRleEIgPj0gMCkge1xuICAgIGNvbnN0IF9mbGFnID0gZ2V0UG9pbnRlcnMoY29udGV4dCwgc2luZ2xlSW5kZXhCKTtcbiAgICBjb25zdCBfaW5pdGlhbCA9IGdldEluaXRpYWxJbmRleChfZmxhZyk7XG4gICAgc2V0RmxhZyhjb250ZXh0LCBzaW5nbGVJbmRleEIsIHBvaW50ZXJzKF9mbGFnLCBfaW5pdGlhbCwgaW5kZXhBKSk7XG4gIH1cblxuICBzZXRWYWx1ZShjb250ZXh0LCBpbmRleEEsIGdldFZhbHVlKGNvbnRleHQsIGluZGV4QikpO1xuICBzZXRQcm9wKGNvbnRleHQsIGluZGV4QSwgZ2V0UHJvcChjb250ZXh0LCBpbmRleEIpKTtcbiAgc2V0RmxhZyhjb250ZXh0LCBpbmRleEEsIGdldFBvaW50ZXJzKGNvbnRleHQsIGluZGV4QikpO1xuICBjb25zdCBwbGF5ZXJJbmRleEEgPSBnZXRQbGF5ZXJCdWlsZGVySW5kZXgoY29udGV4dCwgaW5kZXhCKTtcbiAgY29uc3QgZGlyZWN0aXZlSW5kZXhBID0gMDtcbiAgc2V0UGxheWVyQnVpbGRlckluZGV4KGNvbnRleHQsIGluZGV4QSwgcGxheWVySW5kZXhBLCBkaXJlY3RpdmVJbmRleEEpO1xuXG4gIHNldFZhbHVlKGNvbnRleHQsIGluZGV4QiwgdG1wVmFsdWUpO1xuICBzZXRQcm9wKGNvbnRleHQsIGluZGV4QiwgdG1wUHJvcCk7XG4gIHNldEZsYWcoY29udGV4dCwgaW5kZXhCLCB0bXBGbGFnKTtcbiAgc2V0UGxheWVyQnVpbGRlckluZGV4KGNvbnRleHQsIGluZGV4QiwgdG1wUGxheWVyQnVpbGRlckluZGV4LCBkaXJlY3RpdmVJbmRleEEpO1xufVxuXG5mdW5jdGlvbiB1cGRhdGVTaW5nbGVQb2ludGVyVmFsdWVzKGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBpbmRleFN0YXJ0UG9zaXRpb246IG51bWJlcikge1xuICBmb3IgKGxldCBpID0gaW5kZXhTdGFydFBvc2l0aW9uOyBpIDwgY29udGV4dC5sZW5ndGg7IGkgKz0gU3R5bGluZ0luZGV4LlNpemUpIHtcbiAgICBjb25zdCBtdWx0aUZsYWcgPSBnZXRQb2ludGVycyhjb250ZXh0LCBpKTtcbiAgICBjb25zdCBzaW5nbGVJbmRleCA9IGdldE11bHRpT3JTaW5nbGVJbmRleChtdWx0aUZsYWcpO1xuICAgIGlmIChzaW5nbGVJbmRleCA+IDApIHtcbiAgICAgIGNvbnN0IHNpbmdsZUZsYWcgPSBnZXRQb2ludGVycyhjb250ZXh0LCBzaW5nbGVJbmRleCk7XG4gICAgICBjb25zdCBpbml0aWFsSW5kZXhGb3JTaW5nbGUgPSBnZXRJbml0aWFsSW5kZXgoc2luZ2xlRmxhZyk7XG4gICAgICBjb25zdCBmbGFnVmFsdWUgPSAoaXNEaXJ0eShjb250ZXh0LCBzaW5nbGVJbmRleCkgPyBTdHlsaW5nRmxhZ3MuRGlydHkgOiBTdHlsaW5nRmxhZ3MuTm9uZSkgfFxuICAgICAgICAgIChpc0NsYXNzQmFzZWRWYWx1ZShjb250ZXh0LCBzaW5nbGVJbmRleCkgPyBTdHlsaW5nRmxhZ3MuQ2xhc3MgOiBTdHlsaW5nRmxhZ3MuTm9uZSkgfFxuICAgICAgICAgIChpc1Nhbml0aXphYmxlKGNvbnRleHQsIHNpbmdsZUluZGV4KSA/IFN0eWxpbmdGbGFncy5TYW5pdGl6ZSA6IFN0eWxpbmdGbGFncy5Ob25lKTtcbiAgICAgIGNvbnN0IHVwZGF0ZWRGbGFnID0gcG9pbnRlcnMoZmxhZ1ZhbHVlLCBpbml0aWFsSW5kZXhGb3JTaW5nbGUsIGkpO1xuICAgICAgc2V0RmxhZyhjb250ZXh0LCBzaW5nbGVJbmRleCwgdXBkYXRlZEZsYWcpO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBpbnNlcnROZXdNdWx0aVByb3BlcnR5KFxuICAgIGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBpbmRleDogbnVtYmVyLCBjbGFzc0Jhc2VkOiBib29sZWFuLCBuYW1lOiBzdHJpbmcsIGZsYWc6IG51bWJlcixcbiAgICB2YWx1ZTogc3RyaW5nIHwgYm9vbGVhbiwgZGlyZWN0aXZlSW5kZXg6IG51bWJlciwgcGxheWVySW5kZXg6IG51bWJlcik6IHZvaWQge1xuICBjb25zdCBkb1NoaWZ0ID0gaW5kZXggPCBjb250ZXh0Lmxlbmd0aDtcblxuICAvLyBwcm9wIGRvZXMgbm90IGV4aXN0IGluIHRoZSBsaXN0LCBhZGQgaXQgaW5cbiAgY29udGV4dC5zcGxpY2UoXG4gICAgICBpbmRleCwgMCwgZmxhZyB8IFN0eWxpbmdGbGFncy5EaXJ0eSB8IChjbGFzc0Jhc2VkID8gU3R5bGluZ0ZsYWdzLkNsYXNzIDogU3R5bGluZ0ZsYWdzLk5vbmUpLFxuICAgICAgbmFtZSwgdmFsdWUsIDApO1xuICBzZXRQbGF5ZXJCdWlsZGVySW5kZXgoY29udGV4dCwgaW5kZXgsIHBsYXllckluZGV4LCBkaXJlY3RpdmVJbmRleCk7XG5cbiAgaWYgKGRvU2hpZnQpIHtcbiAgICAvLyBiZWNhdXNlIHRoZSB2YWx1ZSB3YXMgaW5zZXJ0ZWQgbWlkd2F5IGludG8gdGhlIGFycmF5IHRoZW4gd2VcbiAgICAvLyBuZWVkIHRvIHVwZGF0ZSBhbGwgdGhlIHNoaWZ0ZWQgbXVsdGkgdmFsdWVzJyBzaW5nbGUgdmFsdWVcbiAgICAvLyBwb2ludGVycyB0byBwb2ludCB0byB0aGUgbmV3bHkgc2hpZnRlZCBsb2NhdGlvblxuICAgIHVwZGF0ZVNpbmdsZVBvaW50ZXJWYWx1ZXMoY29udGV4dCwgaW5kZXggKyBTdHlsaW5nSW5kZXguU2l6ZSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gdmFsdWVFeGlzdHModmFsdWU6IHN0cmluZyB8IG51bGwgfCBib29sZWFuLCBpc0NsYXNzQmFzZWQ/OiBib29sZWFuKSB7XG4gIGlmIChpc0NsYXNzQmFzZWQpIHtcbiAgICByZXR1cm4gdmFsdWUgPyB0cnVlIDogZmFsc2U7XG4gIH1cbiAgcmV0dXJuIHZhbHVlICE9PSBudWxsO1xufVxuXG5mdW5jdGlvbiBwcmVwYXJlSW5pdGlhbEZsYWcoXG4gICAgY29udGV4dDogU3R5bGluZ0NvbnRleHQsIHByb3A6IHN0cmluZywgZW50cnlJc0NsYXNzQmFzZWQ6IGJvb2xlYW4sXG4gICAgc2FuaXRpemVyPzogU3R5bGVTYW5pdGl6ZUZuIHwgbnVsbCkge1xuICBsZXQgZmxhZyA9IChzYW5pdGl6ZXIgJiYgc2FuaXRpemVyKHByb3ApKSA/IFN0eWxpbmdGbGFncy5TYW5pdGl6ZSA6IFN0eWxpbmdGbGFncy5Ob25lO1xuXG4gIGxldCBpbml0aWFsSW5kZXg6IG51bWJlcjtcbiAgaWYgKGVudHJ5SXNDbGFzc0Jhc2VkKSB7XG4gICAgZmxhZyB8PSBTdHlsaW5nRmxhZ3MuQ2xhc3M7XG4gICAgaW5pdGlhbEluZGV4ID1cbiAgICAgICAgZ2V0SW5pdGlhbFN0eWxpbmdWYWx1ZXNJbmRleE9mKGNvbnRleHRbU3R5bGluZ0luZGV4LkluaXRpYWxDbGFzc1ZhbHVlc1Bvc2l0aW9uXSwgcHJvcCk7XG4gIH0gZWxzZSB7XG4gICAgaW5pdGlhbEluZGV4ID1cbiAgICAgICAgZ2V0SW5pdGlhbFN0eWxpbmdWYWx1ZXNJbmRleE9mKGNvbnRleHRbU3R5bGluZ0luZGV4LkluaXRpYWxTdHlsZVZhbHVlc1Bvc2l0aW9uXSwgcHJvcCk7XG4gIH1cblxuICBpbml0aWFsSW5kZXggPSBpbml0aWFsSW5kZXggPiAwID8gKGluaXRpYWxJbmRleCArIEluaXRpYWxTdHlsaW5nVmFsdWVzSW5kZXguVmFsdWVPZmZzZXQpIDogMDtcbiAgcmV0dXJuIHBvaW50ZXJzKGZsYWcsIGluaXRpYWxJbmRleCwgMCk7XG59XG5cbmZ1bmN0aW9uIGhhc1ZhbHVlQ2hhbmdlZChcbiAgICBmbGFnOiBudW1iZXIsIGE6IHN0cmluZyB8IGJvb2xlYW4gfCBudWxsLCBiOiBzdHJpbmcgfCBib29sZWFuIHwgbnVsbCk6IGJvb2xlYW4ge1xuICBjb25zdCBpc0NsYXNzQmFzZWQgPSBmbGFnICYgU3R5bGluZ0ZsYWdzLkNsYXNzO1xuICBjb25zdCBoYXNWYWx1ZXMgPSBhICYmIGI7XG4gIGNvbnN0IHVzZXNTYW5pdGl6ZXIgPSBmbGFnICYgU3R5bGluZ0ZsYWdzLlNhbml0aXplO1xuICAvLyB0aGUgdG9TdHJpbmcoKSBjb21wYXJpc29uIGVuc3VyZXMgdGhhdCBhIHZhbHVlIGlzIGNoZWNrZWRcbiAgLy8gLi4uIG90aGVyd2lzZSAoZHVyaW5nIHNhbml0aXphdGlvbiBieXBhc3NpbmcpIHRoZSA9PT0gY29tcGFyc2lvblxuICAvLyB3b3VsZCBmYWlsIHNpbmNlIGEgbmV3IFN0cmluZygpIGluc3RhbmNlIGlzIGNyZWF0ZWRcbiAgaWYgKCFpc0NsYXNzQmFzZWQgJiYgaGFzVmFsdWVzICYmIHVzZXNTYW5pdGl6ZXIpIHtcbiAgICAvLyB3ZSBrbm93IGZvciBzdXJlIHdlJ3JlIGRlYWxpbmcgd2l0aCBzdHJpbmdzIGF0IHRoaXMgcG9pbnRcbiAgICByZXR1cm4gKGEgYXMgc3RyaW5nKS50b1N0cmluZygpICE9PSAoYiBhcyBzdHJpbmcpLnRvU3RyaW5nKCk7XG4gIH1cblxuICAvLyBldmVyeXRoaW5nIGVsc2UgaXMgc2FmZSB0byBjaGVjayB3aXRoIGEgbm9ybWFsIGVxdWFsaXR5IGNoZWNrXG4gIHJldHVybiBhICE9PSBiO1xufVxuXG5leHBvcnQgY2xhc3MgQ2xhc3NBbmRTdHlsZVBsYXllckJ1aWxkZXI8VD4gaW1wbGVtZW50cyBQbGF5ZXJCdWlsZGVyIHtcbiAgcHJpdmF0ZSBfdmFsdWVzOiB7W2tleTogc3RyaW5nXTogc3RyaW5nIHwgbnVsbH0gPSB7fTtcbiAgcHJpdmF0ZSBfZGlydHkgPSBmYWxzZTtcbiAgcHJpdmF0ZSBfZmFjdG9yeTogQm91bmRQbGF5ZXJGYWN0b3J5PFQ+O1xuXG4gIGNvbnN0cnVjdG9yKGZhY3Rvcnk6IFBsYXllckZhY3RvcnksIHByaXZhdGUgX2VsZW1lbnQ6IEhUTUxFbGVtZW50LCBwcml2YXRlIF90eXBlOiBCaW5kaW5nVHlwZSkge1xuICAgIHRoaXMuX2ZhY3RvcnkgPSBmYWN0b3J5IGFzIGFueTtcbiAgfVxuXG4gIHNldFZhbHVlKHByb3A6IHN0cmluZywgdmFsdWU6IGFueSkge1xuICAgIGlmICh0aGlzLl92YWx1ZXNbcHJvcF0gIT09IHZhbHVlKSB7XG4gICAgICB0aGlzLl92YWx1ZXNbcHJvcF0gPSB2YWx1ZTtcbiAgICAgIHRoaXMuX2RpcnR5ID0gdHJ1ZTtcbiAgICB9XG4gIH1cblxuICBidWlsZFBsYXllcihjdXJyZW50UGxheWVyOiBQbGF5ZXJ8bnVsbCwgaXNGaXJzdFJlbmRlcjogYm9vbGVhbik6IFBsYXllcnx1bmRlZmluZWR8bnVsbCB7XG4gICAgLy8gaWYgbm8gdmFsdWVzIGhhdmUgYmVlbiBzZXQgaGVyZSB0aGVuIHRoaXMgbWVhbnMgdGhlIGJpbmRpbmcgZGlkbid0XG4gICAgLy8gY2hhbmdlIGFuZCB0aGVyZWZvcmUgdGhlIGJpbmRpbmcgdmFsdWVzIHdlcmUgbm90IHVwZGF0ZWQgdGhyb3VnaFxuICAgIC8vIGBzZXRWYWx1ZWAgd2hpY2ggbWVhbnMgbm8gbmV3IHBsYXllciB3aWxsIGJlIHByb3ZpZGVkLlxuICAgIGlmICh0aGlzLl9kaXJ0eSkge1xuICAgICAgY29uc3QgcGxheWVyID0gdGhpcy5fZmFjdG9yeS5mbihcbiAgICAgICAgICB0aGlzLl9lbGVtZW50LCB0aGlzLl90eXBlLCB0aGlzLl92YWx1ZXMgISwgaXNGaXJzdFJlbmRlciwgY3VycmVudFBsYXllciB8fCBudWxsKTtcbiAgICAgIHRoaXMuX3ZhbHVlcyA9IHt9O1xuICAgICAgdGhpcy5fZGlydHkgPSBmYWxzZTtcbiAgICAgIHJldHVybiBwbGF5ZXI7XG4gICAgfVxuXG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxufVxuXG4vKipcbiAqIFVzZWQgdG8gcHJvdmlkZSBhIHN1bW1hcnkgb2YgdGhlIHN0YXRlIG9mIHRoZSBzdHlsaW5nIGNvbnRleHQuXG4gKlxuICogVGhpcyBpcyBhbiBpbnRlcm5hbCBpbnRlcmZhY2UgdGhhdCBpcyBvbmx5IHVzZWQgaW5zaWRlIG9mIHRlc3QgdG9vbGluZyB0b1xuICogaGVscCBzdW1tYXJpemUgd2hhdCdzIGdvaW5nIG9uIHdpdGhpbiB0aGUgc3R5bGluZyBjb250ZXh0LiBOb25lIG9mIHRoaXMgY29kZVxuICogaXMgZGVzaWduZWQgdG8gYmUgZXhwb3J0ZWQgcHVibGljbHkgYW5kIHdpbGwsIHRoZXJlZm9yZSwgYmUgdHJlZS1zaGFrZW4gYXdheVxuICogZHVyaW5nIHJ1bnRpbWUuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgTG9nU3VtbWFyeSB7XG4gIG5hbWU6IHN0cmluZzsgICAgICAgICAgLy9cbiAgc3RhdGljSW5kZXg6IG51bWJlcjsgICAvL1xuICBkeW5hbWljSW5kZXg6IG51bWJlcjsgIC8vXG4gIHZhbHVlOiBudW1iZXI7ICAgICAgICAgLy9cbiAgZmxhZ3M6IHtcbiAgICBkaXJ0eTogYm9vbGVhbjsgICAgICAgICAgICAgICAgICAgICAvL1xuICAgIGNsYXNzOiBib29sZWFuOyAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgc2FuaXRpemU6IGJvb2xlYW47ICAgICAgICAgICAgICAgICAgLy9cbiAgICBwbGF5ZXJCdWlsZGVyc0RpcnR5OiBib29sZWFuOyAgICAgICAvL1xuICAgIG9ubHlQcm9jZXNzU2luZ2xlQ2xhc3NlczogYm9vbGVhbjsgIC8vXG4gICAgYmluZGluZ0FsbG9jYXRpb25Mb2NrZWQ6IGJvb2xlYW47ICAgLy9cbiAgfTtcbn1cblxuLyoqXG4gKiBUaGlzIGZ1bmN0aW9uIGlzIG5vdCBkZXNpZ25lZCB0byBiZSB1c2VkIGluIHByb2R1Y3Rpb24uXG4gKiBJdCBpcyBhIHV0aWxpdHkgdG9vbCBmb3IgZGVidWdnaW5nIGFuZCB0ZXN0aW5nIGFuZCBpdFxuICogd2lsbCBhdXRvbWF0aWNhbGx5IGJlIHRyZWUtc2hha2VuIGF3YXkgZHVyaW5nIHByb2R1Y3Rpb24uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZW5lcmF0ZUNvbmZpZ1N1bW1hcnkoc291cmNlOiBudW1iZXIpOiBMb2dTdW1tYXJ5O1xuZXhwb3J0IGZ1bmN0aW9uIGdlbmVyYXRlQ29uZmlnU3VtbWFyeShzb3VyY2U6IFN0eWxpbmdDb250ZXh0KTogTG9nU3VtbWFyeTtcbmV4cG9ydCBmdW5jdGlvbiBnZW5lcmF0ZUNvbmZpZ1N1bW1hcnkoc291cmNlOiBTdHlsaW5nQ29udGV4dCwgaW5kZXg6IG51bWJlcik6IExvZ1N1bW1hcnk7XG5leHBvcnQgZnVuY3Rpb24gZ2VuZXJhdGVDb25maWdTdW1tYXJ5KHNvdXJjZTogbnVtYmVyIHwgU3R5bGluZ0NvbnRleHQsIGluZGV4PzogbnVtYmVyKTogTG9nU3VtbWFyeSB7XG4gIGxldCBmbGFnLCBuYW1lID0gJ2NvbmZpZyB2YWx1ZSBmb3IgJztcbiAgaWYgKEFycmF5LmlzQXJyYXkoc291cmNlKSkge1xuICAgIGlmIChpbmRleCkge1xuICAgICAgbmFtZSArPSAnaW5kZXg6ICcgKyBpbmRleDtcbiAgICB9IGVsc2Uge1xuICAgICAgbmFtZSArPSAnbWFzdGVyIGNvbmZpZyc7XG4gICAgfVxuICAgIGluZGV4ID0gaW5kZXggfHwgU3R5bGluZ0luZGV4Lk1hc3RlckZsYWdQb3NpdGlvbjtcbiAgICBmbGFnID0gc291cmNlW2luZGV4XSBhcyBudW1iZXI7XG4gIH0gZWxzZSB7XG4gICAgZmxhZyA9IHNvdXJjZTtcbiAgICBuYW1lICs9ICdpbmRleDogJyArIGZsYWc7XG4gIH1cbiAgY29uc3QgZHluYW1pY0luZGV4ID0gZ2V0TXVsdGlPclNpbmdsZUluZGV4KGZsYWcpO1xuICBjb25zdCBzdGF0aWNJbmRleCA9IGdldEluaXRpYWxJbmRleChmbGFnKTtcbiAgcmV0dXJuIHtcbiAgICBuYW1lLFxuICAgIHN0YXRpY0luZGV4LFxuICAgIGR5bmFtaWNJbmRleCxcbiAgICB2YWx1ZTogZmxhZyxcbiAgICBmbGFnczoge1xuICAgICAgZGlydHk6IGZsYWcgJiBTdHlsaW5nRmxhZ3MuRGlydHkgPyB0cnVlIDogZmFsc2UsXG4gICAgICBjbGFzczogZmxhZyAmIFN0eWxpbmdGbGFncy5DbGFzcyA/IHRydWUgOiBmYWxzZSxcbiAgICAgIHNhbml0aXplOiBmbGFnICYgU3R5bGluZ0ZsYWdzLlNhbml0aXplID8gdHJ1ZSA6IGZhbHNlLFxuICAgICAgcGxheWVyQnVpbGRlcnNEaXJ0eTogZmxhZyAmIFN0eWxpbmdGbGFncy5QbGF5ZXJCdWlsZGVyc0RpcnR5ID8gdHJ1ZSA6IGZhbHNlLFxuICAgICAgb25seVByb2Nlc3NTaW5nbGVDbGFzc2VzOiBmbGFnICYgU3R5bGluZ0ZsYWdzLk9ubHlQcm9jZXNzU2luZ2xlQ2xhc3NlcyA/IHRydWUgOiBmYWxzZSxcbiAgICAgIGJpbmRpbmdBbGxvY2F0aW9uTG9ja2VkOiBmbGFnICYgU3R5bGluZ0ZsYWdzLkJpbmRpbmdBbGxvY2F0aW9uTG9ja2VkID8gdHJ1ZSA6IGZhbHNlLFxuICAgIH1cbiAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldERpcmVjdGl2ZUluZGV4RnJvbUVudHJ5KGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBpbmRleDogbnVtYmVyKSB7XG4gIGNvbnN0IHZhbHVlID0gY29udGV4dFtpbmRleCArIFN0eWxpbmdJbmRleC5QbGF5ZXJCdWlsZGVySW5kZXhPZmZzZXRdIGFzIG51bWJlcjtcbiAgcmV0dXJuIHZhbHVlICYgRGlyZWN0aXZlT3duZXJBbmRQbGF5ZXJCdWlsZGVySW5kZXguQml0TWFzaztcbn1cblxuZnVuY3Rpb24gZ2V0RGlyZWN0aXZlSW5kZXhGcm9tUmVnaXN0cnkoY29udGV4dDogU3R5bGluZ0NvbnRleHQsIGRpcmVjdGl2ZTogYW55KSB7XG4gIGNvbnN0IGluZGV4ID1cbiAgICAgIGdldERpcmVjdGl2ZVJlZ2lzdHJ5VmFsdWVzSW5kZXhPZihjb250ZXh0W1N0eWxpbmdJbmRleC5EaXJlY3RpdmVSZWdpc3RyeVBvc2l0aW9uXSwgZGlyZWN0aXZlKTtcbiAgbmdEZXZNb2RlICYmXG4gICAgICBhc3NlcnROb3RFcXVhbChcbiAgICAgICAgICBpbmRleCwgLTEsXG4gICAgICAgICAgYFRoZSBwcm92aWRlZCBkaXJlY3RpdmUgJHtkaXJlY3RpdmV9IGhhcyBub3QgYmVlbiBhbGxvY2F0ZWQgdG8gdGhlIGVsZW1lbnRcXCdzIHN0eWxlL2NsYXNzIGJpbmRpbmdzYCk7XG4gIHJldHVybiBpbmRleCA+IDAgPyBpbmRleCAvIERpcmVjdGl2ZVJlZ2lzdHJ5VmFsdWVzSW5kZXguU2l6ZSA6IDA7XG4gIC8vIHJldHVybiBpbmRleCAvIERpcmVjdGl2ZVJlZ2lzdHJ5VmFsdWVzSW5kZXguU2l6ZTtcbn1cblxuZnVuY3Rpb24gZ2V0RGlyZWN0aXZlUmVnaXN0cnlWYWx1ZXNJbmRleE9mKFxuICAgIGRpcmVjdGl2ZXM6IERpcmVjdGl2ZVJlZ2lzdHJ5VmFsdWVzLCBkaXJlY3RpdmU6IHt9KTogbnVtYmVyIHtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBkaXJlY3RpdmVzLmxlbmd0aDsgaSArPSBEaXJlY3RpdmVSZWdpc3RyeVZhbHVlc0luZGV4LlNpemUpIHtcbiAgICBpZiAoZGlyZWN0aXZlc1tpXSA9PT0gZGlyZWN0aXZlKSB7XG4gICAgICByZXR1cm4gaTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIC0xO1xufVxuXG5mdW5jdGlvbiBnZXRJbml0aWFsU3R5bGluZ1ZhbHVlc0luZGV4T2Yoa2V5VmFsdWVzOiBJbml0aWFsU3R5bGluZ1ZhbHVlcywga2V5OiBzdHJpbmcpOiBudW1iZXIge1xuICBmb3IgKGxldCBpID0gSW5pdGlhbFN0eWxpbmdWYWx1ZXNJbmRleC5LZXlWYWx1ZVN0YXJ0UG9zaXRpb247IGkgPCBrZXlWYWx1ZXMubGVuZ3RoO1xuICAgICAgIGkgKz0gSW5pdGlhbFN0eWxpbmdWYWx1ZXNJbmRleC5TaXplKSB7XG4gICAgaWYgKGtleVZhbHVlc1tpXSA9PT0ga2V5KSByZXR1cm4gaTtcbiAgfVxuICByZXR1cm4gLTE7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjb21wYXJlTG9nU3VtbWFyaWVzKGE6IExvZ1N1bW1hcnksIGI6IExvZ1N1bW1hcnkpIHtcbiAgY29uc3QgbG9nOiBzdHJpbmdbXSA9IFtdO1xuICBjb25zdCBkaWZmczogW3N0cmluZywgYW55LCBhbnldW10gPSBbXTtcbiAgZGlmZlN1bW1hcnlWYWx1ZXMoZGlmZnMsICdzdGF0aWNJbmRleCcsICdzdGF0aWNJbmRleCcsIGEsIGIpO1xuICBkaWZmU3VtbWFyeVZhbHVlcyhkaWZmcywgJ2R5bmFtaWNJbmRleCcsICdkeW5hbWljSW5kZXgnLCBhLCBiKTtcbiAgT2JqZWN0LmtleXMoYS5mbGFncykuZm9yRWFjaChcbiAgICAgIG5hbWUgPT4geyBkaWZmU3VtbWFyeVZhbHVlcyhkaWZmcywgJ2ZsYWdzLicgKyBuYW1lLCBuYW1lLCBhLmZsYWdzLCBiLmZsYWdzKTsgfSk7XG5cbiAgaWYgKGRpZmZzLmxlbmd0aCkge1xuICAgIGxvZy5wdXNoKCdMb2cgU3VtbWFyaWVzIGZvcjonKTtcbiAgICBsb2cucHVzaCgnICBBOiAnICsgYS5uYW1lKTtcbiAgICBsb2cucHVzaCgnICBCOiAnICsgYi5uYW1lKTtcbiAgICBsb2cucHVzaCgnXFxuICBEaWZmZXIgaW4gdGhlIGZvbGxvd2luZyB3YXkgKEEgIT09IEIpOicpO1xuICAgIGRpZmZzLmZvckVhY2gocmVzdWx0ID0+IHtcbiAgICAgIGNvbnN0IFtuYW1lLCBhVmFsLCBiVmFsXSA9IHJlc3VsdDtcbiAgICAgIGxvZy5wdXNoKCcgICAgPT4gJyArIG5hbWUpO1xuICAgICAgbG9nLnB1c2goJyAgICA9PiAnICsgYVZhbCArICcgIT09ICcgKyBiVmFsICsgJ1xcbicpO1xuICAgIH0pO1xuICB9XG5cbiAgcmV0dXJuIGxvZztcbn1cblxuZnVuY3Rpb24gZGlmZlN1bW1hcnlWYWx1ZXMocmVzdWx0OiBhbnlbXSwgbmFtZTogc3RyaW5nLCBwcm9wOiBzdHJpbmcsIGE6IGFueSwgYjogYW55KSB7XG4gIGNvbnN0IGFWYWwgPSBhW3Byb3BdO1xuICBjb25zdCBiVmFsID0gYltwcm9wXTtcbiAgaWYgKGFWYWwgIT09IGJWYWwpIHtcbiAgICByZXN1bHQucHVzaChbbmFtZSwgYVZhbCwgYlZhbF0pO1xuICB9XG59XG5cbmZ1bmN0aW9uIGdldFNpbmdsZVByb3BJbmRleFZhbHVlKFxuICAgIGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBkaXJlY3RpdmVJbmRleDogbnVtYmVyLCBvZmZzZXQ6IG51bWJlciwgaXNDbGFzc0Jhc2VkOiBib29sZWFuKSB7XG4gIGNvbnN0IHNpbmdsZVByb3BPZmZzZXRSZWdpc3RyeUluZGV4ID1cbiAgICAgIGNvbnRleHRbU3R5bGluZ0luZGV4LkRpcmVjdGl2ZVJlZ2lzdHJ5UG9zaXRpb25dXG4gICAgICAgICAgICAgWyhkaXJlY3RpdmVJbmRleCAqIERpcmVjdGl2ZVJlZ2lzdHJ5VmFsdWVzSW5kZXguU2l6ZSkgK1xuICAgICAgICAgICAgICBEaXJlY3RpdmVSZWdpc3RyeVZhbHVlc0luZGV4LlNpbmdsZVByb3BWYWx1ZXNJbmRleE9mZnNldF0gYXMgbnVtYmVyO1xuICBjb25zdCBvZmZzZXRzID0gY29udGV4dFtTdHlsaW5nSW5kZXguU2luZ2xlUHJvcE9mZnNldFBvc2l0aW9uc107XG4gIGNvbnN0IGluZGV4Rm9yT2Zmc2V0ID0gc2luZ2xlUHJvcE9mZnNldFJlZ2lzdHJ5SW5kZXggK1xuICAgICAgU2luZ2xlUHJvcE9mZnNldFZhbHVlc0luZGV4LlZhbHVlU3RhcnRQb3NpdGlvbiArXG4gICAgICAoaXNDbGFzc0Jhc2VkID9cbiAgICAgICAgICAgb2Zmc2V0c1xuICAgICAgICAgICAgICAgW3NpbmdsZVByb3BPZmZzZXRSZWdpc3RyeUluZGV4ICsgU2luZ2xlUHJvcE9mZnNldFZhbHVlc0luZGV4LlN0eWxlc0NvdW50UG9zaXRpb25dIDpcbiAgICAgICAgICAgMCkgK1xuICAgICAgb2Zmc2V0O1xuICByZXR1cm4gb2Zmc2V0c1tpbmRleEZvck9mZnNldF07XG59XG5cbmZ1bmN0aW9uIGdldFN0eWxlU2FuaXRpemVyKGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBkaXJlY3RpdmVJbmRleDogbnVtYmVyKTogU3R5bGVTYW5pdGl6ZUZufG51bGwge1xuICBjb25zdCBkaXJzID0gY29udGV4dFtTdHlsaW5nSW5kZXguRGlyZWN0aXZlUmVnaXN0cnlQb3NpdGlvbl07XG4gIGNvbnN0IHZhbHVlID0gZGlyc1xuICAgICAgICAgICAgICAgICAgICBbZGlyZWN0aXZlSW5kZXggKiBEaXJlY3RpdmVSZWdpc3RyeVZhbHVlc0luZGV4LlNpemUgK1xuICAgICAgICAgICAgICAgICAgICAgRGlyZWN0aXZlUmVnaXN0cnlWYWx1ZXNJbmRleC5TdHlsZVNhbml0aXplck9mZnNldF0gfHxcbiAgICAgIGRpcnNbRGlyZWN0aXZlUmVnaXN0cnlWYWx1ZXNJbmRleC5TdHlsZVNhbml0aXplck9mZnNldF0gfHwgbnVsbDtcbiAgcmV0dXJuIHZhbHVlIGFzIFN0eWxlU2FuaXRpemVGbiB8IG51bGw7XG59XG5cbmZ1bmN0aW9uIGlzRGlyZWN0aXZlRGlydHkoY29udGV4dDogU3R5bGluZ0NvbnRleHQsIGRpcmVjdGl2ZUluZGV4OiBudW1iZXIpOiBib29sZWFuIHtcbiAgY29uc3QgZGlycyA9IGNvbnRleHRbU3R5bGluZ0luZGV4LkRpcmVjdGl2ZVJlZ2lzdHJ5UG9zaXRpb25dO1xuICByZXR1cm4gZGlyc1xuICAgICAgW2RpcmVjdGl2ZUluZGV4ICogRGlyZWN0aXZlUmVnaXN0cnlWYWx1ZXNJbmRleC5TaXplICtcbiAgICAgICBEaXJlY3RpdmVSZWdpc3RyeVZhbHVlc0luZGV4LkRpcnR5RmxhZ09mZnNldF0gYXMgYm9vbGVhbjtcbn1cblxuZnVuY3Rpb24gc2V0RGlyZWN0aXZlRGlydHkoXG4gICAgY29udGV4dDogU3R5bGluZ0NvbnRleHQsIGRpcmVjdGl2ZUluZGV4OiBudW1iZXIsIGRpcnR5WWVzOiBib29sZWFuKTogdm9pZCB7XG4gIGNvbnN0IGRpcnMgPSBjb250ZXh0W1N0eWxpbmdJbmRleC5EaXJlY3RpdmVSZWdpc3RyeVBvc2l0aW9uXTtcbiAgZGlyc1xuICAgICAgW2RpcmVjdGl2ZUluZGV4ICogRGlyZWN0aXZlUmVnaXN0cnlWYWx1ZXNJbmRleC5TaXplICtcbiAgICAgICBEaXJlY3RpdmVSZWdpc3RyeVZhbHVlc0luZGV4LkRpcnR5RmxhZ09mZnNldF0gPSBkaXJ0eVllcztcbn1cblxuZnVuY3Rpb24gYWxsb3dWYWx1ZUNoYW5nZShcbiAgICBjdXJyZW50VmFsdWU6IHN0cmluZyB8IGJvb2xlYW4gfCBudWxsLCBuZXdWYWx1ZTogc3RyaW5nIHwgYm9vbGVhbiB8IG51bGwsXG4gICAgY3VycmVudERpcmVjdGl2ZU93bmVyOiBudW1iZXIsIG5ld0RpcmVjdGl2ZU93bmVyOiBudW1iZXIpIHtcbiAgLy8gdGhlIGNvZGUgYmVsb3cgcmVsaWVzIHRoZSBpbXBvcnRhbmNlIG9mIGRpcmVjdGl2ZSdzIGJlaW5nIHRpZWQgdG8gdGhlaXJcbiAgLy8gaW5kZXggdmFsdWUuIFRoZSBpbmRleCB2YWx1ZXMgZm9yIGVhY2ggZGlyZWN0aXZlIGFyZSBkZXJpdmVkIGZyb20gYmVpbmdcbiAgLy8gcmVnaXN0ZXJlZCBpbnRvIHRoZSBzdHlsaW5nIGNvbnRleHQgZGlyZWN0aXZlIHJlZ2lzdHJ5LiBUaGUgbW9zdCBpbXBvcnRhbnRcbiAgLy8gZGlyZWN0aXZlIGlzIHRoZSBwYXJlbnQgY29tcG9uZW50IGRpcmVjdGl2ZSAodGhlIHRlbXBsYXRlKSBhbmQgZWFjaCBkaXJlY3RpdmVcbiAgLy8gdGhhdCBpcyBhZGRlZCBhZnRlciBpcyBjb25zaWRlcmVkIGxlc3MgaW1wb3J0YW50IHRoYW4gdGhlIHByZXZpb3VzIGVudHJ5LiBUaGlzXG4gIC8vIHByaW9yaXRpemF0aW9uIG9mIGRpcmVjdGl2ZXMgZW5hYmxlcyB0aGUgc3R5bGluZyBhbGdvcml0aG0gdG8gZGVjaWRlIGlmIGEgc3R5bGVcbiAgLy8gb3IgY2xhc3Mgc2hvdWxkIGJlIGFsbG93ZWQgdG8gYmUgdXBkYXRlZC9yZXBsYWNlZCBpbmNhc2UgYW4gZWFybGllciBkaXJlY3RpdmVcbiAgLy8gYWxyZWFkeSB3cm90ZSB0byB0aGUgZXhhY3Qgc2FtZSBzdHlsZS1wcm9wZXJ0eSBvciBjbGFzc05hbWUgdmFsdWUuIEluIG90aGVyIHdvcmRzXG4gIC8vIC4uLiB0aGlzIGRlY2lkZXMgd2hhdCB0byBkbyBpZiBhbmQgd2hlbiB0aGVyZSBpcyBhIGNvbGxpc2lvbi5cbiAgaWYgKGN1cnJlbnRWYWx1ZSkge1xuICAgIGlmIChuZXdWYWx1ZSkge1xuICAgICAgLy8gaWYgYSBkaXJlY3RpdmUgaW5kZXggaXMgbG93ZXIgdGhhbiBpdCBhbHdheXMgaGFzIHByaW9yaXR5IG92ZXIgdGhlXG4gICAgICAvLyBwcmV2aW91cyBkaXJlY3RpdmUncyB2YWx1ZS4uLlxuICAgICAgcmV0dXJuIG5ld0RpcmVjdGl2ZU93bmVyIDw9IGN1cnJlbnREaXJlY3RpdmVPd25lcjtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gb25seSB3cml0ZSBhIG51bGwgdmFsdWUgaW5jYXNlIGl0J3MgdGhlIHNhbWUgb3duZXIgd3JpdGluZyBpdC5cbiAgICAgIC8vIHRoaXMgYXZvaWRzIGhhdmluZyBhIGhpZ2hlci1wcmlvcml0eSBkaXJlY3RpdmUgd3JpdGUgdG8gbnVsbFxuICAgICAgLy8gb25seSB0byBoYXZlIGEgbGVzc2VyLXByaW9yaXR5IGRpcmVjdGl2ZSBjaGFuZ2UgcmlnaHQgdG8gYVxuICAgICAgLy8gbm9uLW51bGwgdmFsdWUgaW1tZWRpYXRlbHkgYWZ0ZXJ3YXJkcy5cbiAgICAgIHJldHVybiBjdXJyZW50RGlyZWN0aXZlT3duZXIgPT09IG5ld0RpcmVjdGl2ZU93bmVyO1xuICAgIH1cbiAgfVxuICByZXR1cm4gdHJ1ZTtcbn1cblxuLyoqXG4gKiBUaGlzIGZ1bmN0aW9uIGlzIG9ubHkgZGVzaWduZWQgdG8gYmUgY2FsbGVkIGZvciBgW2NsYXNzXWAgYmluZGluZ3Mgd2hlblxuICogYFtuZ0NsYXNzXWAgKG9yIHNvbWV0aGluZyB0aGF0IHVzZXMgYGNsYXNzYCBhcyBhbiBpbnB1dCkgaXMgcHJlc2VudC4gT25jZVxuICogZGlyZWN0aXZlIGhvc3QgYmluZGluZ3MgZnVsbHkgd29yayBmb3IgYFtjbGFzc11gIGFuZCBgW3N0eWxlXWAgaW5wdXRzXG4gKiB0aGVuIHRoaXMgY2FuIGJlIGRlbGV0ZWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRJbml0aWFsQ2xhc3NOYW1lVmFsdWUoY29udGV4dDogU3R5bGluZ0NvbnRleHQpOiBzdHJpbmcge1xuICBsZXQgY2xhc3NOYW1lID0gY29udGV4dFtTdHlsaW5nSW5kZXguQ2FjaGVkQ2xhc3NWYWx1ZU9ySW5pdGlhbENsYXNzU3RyaW5nXSBhcyBzdHJpbmc7XG4gIGlmIChjbGFzc05hbWUgPT0gbnVsbCkge1xuICAgIGNsYXNzTmFtZSA9ICcnO1xuICAgIGNvbnN0IGluaXRpYWxDbGFzc1ZhbHVlcyA9IGNvbnRleHRbU3R5bGluZ0luZGV4LkluaXRpYWxDbGFzc1ZhbHVlc1Bvc2l0aW9uXTtcbiAgICBmb3IgKGxldCBpID0gSW5pdGlhbFN0eWxpbmdWYWx1ZXNJbmRleC5LZXlWYWx1ZVN0YXJ0UG9zaXRpb247IGkgPCBpbml0aWFsQ2xhc3NWYWx1ZXMubGVuZ3RoO1xuICAgICAgICAgaSArPSBJbml0aWFsU3R5bGluZ1ZhbHVlc0luZGV4LlNpemUpIHtcbiAgICAgIGNvbnN0IGlzUHJlc2VudCA9IGluaXRpYWxDbGFzc1ZhbHVlc1tpICsgMV07XG4gICAgICBpZiAoaXNQcmVzZW50KSB7XG4gICAgICAgIGNsYXNzTmFtZSArPSAoY2xhc3NOYW1lLmxlbmd0aCA/ICcgJyA6ICcnKSArIGluaXRpYWxDbGFzc1ZhbHVlc1tpXTtcbiAgICAgIH1cbiAgICB9XG4gICAgY29udGV4dFtTdHlsaW5nSW5kZXguQ2FjaGVkQ2xhc3NWYWx1ZU9ySW5pdGlhbENsYXNzU3RyaW5nXSA9IGNsYXNzTmFtZTtcbiAgfVxuICByZXR1cm4gY2xhc3NOYW1lO1xufVxuIl19