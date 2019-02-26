import * as tslib_1 from "tslib";
import { EMPTY_ARRAY, EMPTY_OBJ } from '../empty';
import { RendererStyleFlags3, isProceduralRenderer } from '../interfaces/renderer';
import { NO_CHANGE } from '../tokens';
import { getRootContext } from '../util/view_traversal_utils';
import { BoundPlayerFactory } from './player_factory';
import { addPlayerInternal, allocPlayerContext, allocateDirectiveIntoContext, createEmptyStylingContext, getPlayerContext } from './util';
/**
 * This file includes the code to power all styling-binding operations in Angular.
 *
 * These include:
 * [style]="myStyleObj"
 * [class]="myClassObj"
 * [style.prop]="myPropValue"
 * [class.name]="myClassValue"
 *
 * It also includes code that will allow style binding code to operate within host
 * bindings for components/directives.
 *
 * There are many different ways in which these functions below are called. Please see
 * `render3/interfaces/styling.ts` to get a better idea of how the styling algorithm works.
 */
/**
 * Creates a new StylingContext an fills it with the provided static styling attribute values.
 */
export function initializeStaticContext(attrs) {
    var context = createEmptyStylingContext();
    var initialClasses = context[4 /* InitialClassValuesPosition */] =
        [null, null];
    var initialStyles = context[3 /* InitialStyleValuesPosition */] =
        [null, null];
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
 * @param directiveRef the directive instance with which static data is associated with.
 */
export function patchContextWithStaticAttrs(context, attrs, startingIndex, directiveRef) {
    // If the styling context has already been patched with the given directive's bindings,
    // then there is no point in doing it again. The reason why this may happen (the directive
    // styling being patched twice) is because the `stylingBinding` function is called each time
    // an element is created (both within a template function and within directive host bindings).
    var directives = context[2 /* DirectiveRegistryPosition */];
    if (getDirectiveRegistryValuesIndexOf(directives, directiveRef) == -1) {
        // this is a new directive which we have not seen yet.
        allocateDirectiveIntoContext(context, directiveRef);
        var initialClasses = null;
        var initialStyles = null;
        var mode = -1;
        for (var i = startingIndex; i < attrs.length; i++) {
            var attr = attrs[i];
            if (typeof attr == 'number') {
                mode = attr;
            }
            else if (mode == 1 /* Classes */) {
                initialClasses = initialClasses || context[4 /* InitialClassValuesPosition */];
                patchInitialStylingValue(initialClasses, attr, true);
            }
            else if (mode == 2 /* Styles */) {
                initialStyles = initialStyles || context[3 /* InitialStyleValuesPosition */];
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
    for (var i = 2 /* KeyValueStartPosition */; i < initialStyling.length;) {
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
 * Runs through the initial style data present in the context and renders
 * them via the renderer on the element.
 */
export function renderInitialStyles(element, context, renderer) {
    var initialStyles = context[3 /* InitialStyleValuesPosition */];
    renderInitialStylingValues(element, renderer, initialStyles, false);
}
/**
 * Runs through the initial class data present in the context and renders
 * them via the renderer on the element.
 */
export function renderInitialClasses(element, context, renderer) {
    var initialClasses = context[4 /* InitialClassValuesPosition */];
    renderInitialStylingValues(element, renderer, initialClasses, true);
}
/**
 * This is a helper function designed to render each entry present within the
 * provided list of initialStylingValues.
 */
function renderInitialStylingValues(element, renderer, initialStylingValues, isEntryClassBased) {
    for (var i = 2 /* KeyValueStartPosition */; i < initialStylingValues.length; i += 2 /* Size */) {
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
    return (context[1 /* MasterFlagPosition */] & 16 /* BindingAllocationLocked */) === 0;
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
export function updateContextWithBindings(context, directiveRef, classBindingNames, styleBindingNames, styleSanitizer) {
    if (context[1 /* MasterFlagPosition */] & 16 /* BindingAllocationLocked */)
        return;
    // this means the context has already been patched with the directive's bindings
    var directiveIndex = findOrPatchDirectiveIntoRegistry(context, directiveRef, styleSanitizer);
    if (directiveIndex === -1) {
        // this means the directive has already been patched in ... No point in doing anything
        return;
    }
    if (styleBindingNames) {
        styleBindingNames = hyphenateEntries(styleBindingNames);
    }
    // there are alot of variables being used below to track where in the context the new
    // binding values will be placed. Because the context consists of multiple types of
    // entries (single classes/styles and multi classes/styles) alot of the index positions
    // need to be computed ahead of time and the context needs to be extended before the values
    // are inserted in.
    var singlePropOffsetValues = context[5 /* SinglePropOffsetPositions */];
    var totalCurrentClassBindings = singlePropOffsetValues[1 /* ClassesCountPosition */];
    var totalCurrentStyleBindings = singlePropOffsetValues[0 /* StylesCountPosition */];
    var cachedClassMapValues = context[6 /* CachedMultiClasses */];
    var cachedStyleMapValues = context[7 /* CachedMultiStyles */];
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
    var initialClasses = context[4 /* InitialClassValuesPosition */];
    var initialStyles = context[3 /* InitialStyleValuesPosition */];
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
    // the map-based values also need to know how many entries got inserted
    cachedClassMapValues[0 /* EntriesCountPosition */] +=
        filteredClassBindingNames.length;
    cachedStyleMapValues[0 /* EntriesCountPosition */] +=
        filteredStyleBindingNames.length;
    var newStylesSpaceAllocationSize = filteredStyleBindingNames.length * 4 /* Size */;
    var newClassesSpaceAllocationSize = filteredClassBindingNames.length * 4 /* Size */;
    // update the multi styles cache with a reference for the directive that was just inserted
    var directiveMultiStylesStartIndex = multiStylesStartIndex + totalCurrentStyleBindings * 4 /* Size */;
    var cachedStyleMapIndex = cachedStyleMapValues.length;
    registerMultiMapEntry(context, directiveIndex, false, directiveMultiStylesStartIndex, filteredStyleBindingNames.length);
    for (var i_7 = 1 /* ValuesStartPosition */; i_7 < cachedStyleMapIndex; i_7 += 4 /* Size */) {
        // multi values start after all the single values (which is also where classes are) in the
        // context therefore the new class allocation size should be taken into account
        cachedStyleMapValues[i_7 + 1 /* PositionStartOffset */] +=
            newClassesSpaceAllocationSize + newStylesSpaceAllocationSize;
    }
    // update the multi classes cache with a reference for the directive that was just inserted
    var directiveMultiClassesStartIndex = multiClassesStartIndex + totalCurrentClassBindings * 4 /* Size */;
    var cachedClassMapIndex = cachedClassMapValues.length;
    registerMultiMapEntry(context, directiveIndex, true, directiveMultiClassesStartIndex, filteredClassBindingNames.length);
    for (var i_8 = 1 /* ValuesStartPosition */; i_8 < cachedClassMapIndex; i_8 += 4 /* Size */) {
        // the reason why both the styles + classes space is allocated to the existing offsets is
        // because the styles show up before the classes in the context and any new inserted
        // styles will offset any existing class entries in the context (even if there are no
        // new class entries added) also the reason why it's *2 is because both single + multi
        // entries for each new style have been added in the context before the multi class values
        // actually start
        cachedClassMapValues[i_8 + 1 /* PositionStartOffset */] +=
            (newStylesSpaceAllocationSize * 2) + newClassesSpaceAllocationSize;
    }
    // there is no initial value flag for the master index since it doesn't
    // reference an initial style value
    var masterFlag = pointers(0, 0, multiStylesStartIndex);
    setFlag(context, 1 /* MasterFlagPosition */, masterFlag);
}
/**
 * Searches through the existing registry of directives
 */
export function findOrPatchDirectiveIntoRegistry(context, directiveRef, styleSanitizer) {
    var directiveRefs = context[2 /* DirectiveRegistryPosition */];
    var nextOffsetInsertionIndex = context[5 /* SinglePropOffsetPositions */].length;
    var directiveIndex;
    var detectedIndex = getDirectiveRegistryValuesIndexOf(directiveRefs, directiveRef);
    if (detectedIndex === -1) {
        detectedIndex = directiveRefs.length;
        directiveIndex = directiveRefs.length / 4 /* Size */;
        allocateDirectiveIntoContext(context, directiveRef);
        directiveRefs[detectedIndex + 1 /* SinglePropValuesIndexOffset */] =
            nextOffsetInsertionIndex;
        directiveRefs[detectedIndex + 3 /* StyleSanitizerOffset */] =
            styleSanitizer || null;
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
 * Registers the provided multi styling (`[style]` and `[class]`) values to the context.
 *
 * This function will iterate over the provided `classesInput` and `stylesInput` map
 * values and insert/update or remove them from the context at exactly the right
 * spot.
 *
 * This function also takes in a directive which implies that the styling values will
 * be evaluated for that directive with respect to any other styling that already exists
 * on the context. When there are styles that conflict (e.g. say `ngStyle` and `[style]`
 * both update the `width` property at the same time) then the styling algorithm code below
 * will decide which one wins based on the directive styling prioritization mechanism. This
 * mechanism is better explained in render3/interfaces/styling.ts#directives).
 *
 * This function will not render any styling values on screen, but is rather designed to
 * prepare the context for that. `renderStyling` must be called afterwards to render any
 * styling data that was set in this function (note that `updateClassProp` and
 * `updateStyleProp` are designed to be run after this function is run).
 *
 * @param context The styling context that will be updated with the
 *    newly provided style values.
 * @param classesInput The key/value map of CSS class names that will be used for the update.
 * @param stylesInput The key/value map of CSS styles that will be used for the update.
 * @param directiveRef an optional reference to the directive responsible
 *    for this binding change. If present then style binding will only
 *    actualize if the directive has ownership over this binding
 *    (see styling.ts#directives for more information about the algorithm).
 */
export function updateStylingMap(context, classesInput, stylesInput, directiveRef) {
    var directiveIndex = getDirectiveIndexFromRegistry(context, directiveRef || null);
    classesInput = classesInput || null;
    stylesInput = stylesInput || null;
    var ignoreAllClassUpdates = isMultiValueCacheHit(context, true, directiveIndex, classesInput);
    var ignoreAllStyleUpdates = isMultiValueCacheHit(context, false, directiveIndex, stylesInput);
    // early exit (this is what's done to avoid using ctx.bind() to cache the value)
    if (ignoreAllClassUpdates && ignoreAllStyleUpdates)
        return;
    classesInput =
        classesInput === NO_CHANGE ? readCachedMapValue(context, true, directiveIndex) : classesInput;
    stylesInput =
        stylesInput === NO_CHANGE ? readCachedMapValue(context, false, directiveIndex) : stylesInput;
    var element = context[0 /* ElementPosition */];
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
    var multiStylesStartIndex = getMultiStylesStartIndex(context);
    var multiClassesStartIndex = getMultiClassesStartIndex(context);
    var multiClassesEndIndex = context.length;
    if (!ignoreAllStyleUpdates) {
        var styleProps = stylesValue ? Object.keys(stylesValue) : EMPTY_ARRAY;
        var styles = stylesValue || EMPTY_OBJ;
        var totalNewEntries = patchStylingMapIntoContext(context, directiveIndex, stylesPlayerBuilderIndex, multiStylesStartIndex, multiClassesStartIndex, styleProps, styles, stylesInput, false);
        if (totalNewEntries) {
            multiClassesStartIndex += totalNewEntries * 4 /* Size */;
            multiClassesEndIndex += totalNewEntries * 4 /* Size */;
        }
    }
    if (!ignoreAllClassUpdates) {
        var classes = (classesValue || EMPTY_OBJ);
        patchStylingMapIntoContext(context, directiveIndex, classesPlayerBuilderIndex, multiClassesStartIndex, multiClassesEndIndex, classNames, applyAllClasses || classes, classesInput, true);
    }
    if (playerBuildersAreDirty) {
        setContextPlayersDirty(context, true);
    }
}
/**
 * Applies the given multi styling (styles or classes) values to the context.
 *
 * The styling algorithm code that applies multi-level styling (things like `[style]` and `[class]`
 * values) resides here.
 *
 * Because this function understands that multiple directives may all write to the `[style]` and
 * `[class]` bindings (through host bindings), it relies of each directive applying its binding
 * value in order. This means that a directive like `classADirective` will always fire before
 * `classBDirective` and therefore its styling values (classes and styles) will always be evaluated
 * in the same order. Because of this consistent ordering, the first directive has a higher priority
 * than the second one. It is with this prioritzation mechanism that the styling algorithm knows how
 * to merge and apply redudant styling properties.
 *
 * The function itself applies the key/value entries (or an array of keys) to
 * the context in the following steps.
 *
 * STEP 1:
 *    First check to see what properties are already set and in use by another directive in the
 *    context (e.g. `ngClass` set the `width` value and `[style.width]="w"` in a directive is
 *    attempting to set it as well).
 *
 * STEP 2:
 *    All remaining properties (that were not set prior to this directive) are now updated in
 *    the context. Any new properties are inserted exactly at their spot in the context and any
 *    previously set properties are shifted to exactly where the cursor sits while iterating over
 *    the context. The end result is a balanced context that includes the exact ordering of the
 *    styling properties/values for the provided input from the directive.
 *
 * STEP 3:
 *    Any unmatched properties in the context that belong to the directive are set to null
 *
 * Once the updating phase is done, then the algorithm will decide whether or not to flag the
 * follow-up directives (the directives that will pass in their styling values) depending on if
 * the "shape" of the multi-value map has changed (either if any keys are removed or added or
 * if there are any new `null` values). If any follow-up directives are flagged as dirty then the
 * algorithm will run again for them. Otherwise if the shape did not change then any follow-up
 * directives will not run (so long as their binding values stay the same).
 *
 * @returns the total amount of new slots that were allocated into the context due to new styling
 *          properties that were detected.
 */
function patchStylingMapIntoContext(context, directiveIndex, playerBuilderIndex, ctxStart, ctxEnd, props, values, cacheValue, entryIsClassBased) {
    var dirty = false;
    var cacheIndex = 1 /* ValuesStartPosition */ +
        directiveIndex * 4 /* Size */;
    // the cachedValues array is the registry of all multi style values (map values). Each
    // value is stored (cached) each time is updated.
    var cachedValues = context[entryIsClassBased ? 6 /* CachedMultiClasses */ : 7 /* CachedMultiStyles */];
    // this is the index in which this directive has ownership access to write to this
    // value (anything before is owned by a previous directive that is more important)
    var ownershipValuesStartIndex = cachedValues[cacheIndex + 1 /* PositionStartOffset */];
    var existingCachedValue = cachedValues[cacheIndex + 2 /* ValueOffset */];
    var existingCachedValueCount = cachedValues[cacheIndex + 3 /* ValueCountOffset */];
    var existingCachedValueIsDirty = cachedValues[cacheIndex + 0 /* DirtyFlagOffset */] === 1;
    // A shape change means the provided map value has either removed or added new properties
    // compared to what were in the last time. If a shape change occurs then it means that all
    // follow-up multi-styling entries are obsolete and will be examined again when CD runs
    // them. If a shape change has not occurred then there is no reason to check any other
    // directive values if their identity has not changed. If a previous directive set this
    // value as dirty (because its own shape changed) then this means that the object has been
    // offset to a different area in the context. Because its value has been offset then it
    // can't write to a region that it wrote to before (which may have been apart of another
    // directive) and therefore its shape changes too.
    var valuesEntryShapeChange = existingCachedValueIsDirty || ((!existingCachedValue && cacheValue) ? true : false);
    var totalUniqueValues = 0;
    var totalNewAllocatedSlots = 0;
    // this is a trick to avoid building {key:value} map where all the values
    // are `true` (this happens when a className string is provided instead of a
    // map as an input value to this styling algorithm)
    var applyAllProps = values === true;
    // STEP 1:
    // loop through the earlier directives and figure out if any properties here will be placed
    // in their area (this happens when the value is null because the earlier directive erased it).
    var ctxIndex = ctxStart;
    var totalRemainingProperties = props.length;
    while (ctxIndex < ownershipValuesStartIndex) {
        var currentProp = getProp(context, ctxIndex);
        if (totalRemainingProperties) {
            for (var i = 0; i < props.length; i++) {
                var mapProp = props[i];
                var normalizedProp = mapProp ? (entryIsClassBased ? mapProp : hyphenate(mapProp)) : null;
                if (normalizedProp && currentProp === normalizedProp) {
                    var currentValue = getValue(context, ctxIndex);
                    var currentDirectiveIndex = getDirectiveIndexFromEntry(context, ctxIndex);
                    var value = applyAllProps ? true : values[normalizedProp];
                    var currentFlag = getPointers(context, ctxIndex);
                    if (hasValueChanged(currentFlag, currentValue, value) &&
                        allowValueChange(currentValue, value, currentDirectiveIndex, directiveIndex)) {
                        setValue(context, ctxIndex, value);
                        setPlayerBuilderIndex(context, ctxIndex, playerBuilderIndex, directiveIndex);
                        if (hasInitialValueChanged(context, currentFlag, value)) {
                            setDirty(context, ctxIndex, true);
                            dirty = true;
                        }
                    }
                    props[i] = null;
                    totalRemainingProperties--;
                    break;
                }
            }
        }
        ctxIndex += 4 /* Size */;
    }
    // STEP 2:
    // apply the left over properties to the context in the correct order.
    if (totalRemainingProperties) {
        var sanitizer = entryIsClassBased ? null : getStyleSanitizer(context, directiveIndex);
        propertiesLoop: for (var i = 0; i < props.length; i++) {
            var mapProp = props[i];
            if (!mapProp) {
                // this is an early exit incase a value was already encountered above in the
                // previous loop (which means that the property was applied or rejected)
                continue;
            }
            var value = applyAllProps ? true : values[mapProp];
            var normalizedProp = entryIsClassBased ? mapProp : hyphenate(mapProp);
            var isInsideOwnershipArea = ctxIndex >= ownershipValuesStartIndex;
            for (var j = ctxIndex; j < ctxEnd; j += 4 /* Size */) {
                var distantCtxProp = getProp(context, j);
                if (distantCtxProp === normalizedProp) {
                    var distantCtxDirectiveIndex = getDirectiveIndexFromEntry(context, j);
                    var distantCtxPlayerBuilderIndex = getPlayerBuilderIndex(context, j);
                    var distantCtxValue = getValue(context, j);
                    var distantCtxFlag = getPointers(context, j);
                    if (allowValueChange(distantCtxValue, value, distantCtxDirectiveIndex, directiveIndex)) {
                        // even if the entry isn't updated (by value or directiveIndex) then
                        // it should still be moved over to the correct spot in the array so
                        // the iteration loop is tighter.
                        if (isInsideOwnershipArea) {
                            swapMultiContextEntries(context, ctxIndex, j);
                            totalUniqueValues++;
                        }
                        if (hasValueChanged(distantCtxFlag, distantCtxValue, value)) {
                            if (value === null || value === undefined && value !== distantCtxValue) {
                                valuesEntryShapeChange = true;
                            }
                            setValue(context, ctxIndex, value);
                            // SKIP IF INITIAL CHECK
                            // If the former `value` is `null` then it means that an initial value
                            // could be being rendered on screen. If that is the case then there is
                            // no point in updating the value incase it matches. In other words if the
                            // new value is the exact same as the previously rendered value (which
                            // happens to be the initial value) then do nothing.
                            if (distantCtxValue !== null ||
                                hasInitialValueChanged(context, distantCtxFlag, value)) {
                                setDirty(context, ctxIndex, true);
                                dirty = true;
                            }
                        }
                        if (distantCtxDirectiveIndex !== directiveIndex ||
                            playerBuilderIndex !== distantCtxPlayerBuilderIndex) {
                            setPlayerBuilderIndex(context, ctxIndex, playerBuilderIndex, directiveIndex);
                        }
                    }
                    ctxIndex += 4 /* Size */;
                    continue propertiesLoop;
                }
            }
            // fallback case ... value not found at all in the context
            if (value != null) {
                valuesEntryShapeChange = true;
                totalUniqueValues++;
                var flag = prepareInitialFlag(context, normalizedProp, entryIsClassBased, sanitizer) |
                    1 /* Dirty */;
                var insertionIndex = isInsideOwnershipArea ?
                    ctxIndex :
                    (ownershipValuesStartIndex + totalNewAllocatedSlots * 4 /* Size */);
                insertNewMultiProperty(context, insertionIndex, entryIsClassBased, normalizedProp, flag, value, directiveIndex, playerBuilderIndex);
                totalNewAllocatedSlots++;
                ctxEnd += 4 /* Size */;
                ctxIndex += 4 /* Size */;
                dirty = true;
            }
        }
    }
    // STEP 3:
    // Remove (nullify) any existing entries in the context that were not apart of the
    // map input value that was passed into this algorithm for this directive.
    while (ctxIndex < ctxEnd) {
        valuesEntryShapeChange = true; // some values are missing
        var ctxValue = getValue(context, ctxIndex);
        var ctxFlag = getPointers(context, ctxIndex);
        var ctxDirective = getDirectiveIndexFromEntry(context, ctxIndex);
        if (ctxValue != null) {
            valuesEntryShapeChange = true;
        }
        if (hasValueChanged(ctxFlag, ctxValue, null)) {
            setValue(context, ctxIndex, null);
            // only if the initial value is falsy then
            if (hasInitialValueChanged(context, ctxFlag, ctxValue)) {
                setDirty(context, ctxIndex, true);
                dirty = true;
            }
            setPlayerBuilderIndex(context, ctxIndex, playerBuilderIndex, directiveIndex);
        }
        ctxIndex += 4 /* Size */;
    }
    // Because the object shape has changed, this means that all follow-up directives will need to
    // reapply their values into the object. For this to happen, the cached array needs to be updated
    // with dirty flags so that follow-up calls to `updateStylingMap` will reapply their styling code.
    // the reapplication of styling code within the context will reshape it and update the offset
    // values (also follow-up directives can write new values incase earlier directives set anything
    // to null due to removals or falsy values).
    valuesEntryShapeChange = valuesEntryShapeChange || existingCachedValueCount !== totalUniqueValues;
    updateCachedMapValue(context, directiveIndex, entryIsClassBased, cacheValue, ownershipValuesStartIndex, ctxEnd, totalUniqueValues, valuesEntryShapeChange);
    if (dirty) {
        setContextDirty(context, true);
        setDirectiveDirty(context, directiveIndex, true);
    }
    return totalNewAllocatedSlots;
}
/**
 * Sets and resolves a single class value on the provided `StylingContext` so
 * that they can be applied to the element once `renderStyling` is called.
 *
 * @param context The styling context that will be updated with the
 *    newly provided class value.
 * @param offset The index of the CSS class which is being updated.
 * @param addOrRemove Whether or not to add or remove the CSS class
 * @param directiveRef an optional reference to the directive responsible
 *    for this binding change. If present then style binding will only
 *    actualize if the directive has ownership over this binding
 *    (see styling.ts#directives for more information about the algorithm).
 * @param forceOverride whether or not to skip all directive prioritization
 *    and just apply the value regardless.
 */
export function updateClassProp(context, offset, input, directiveRef, forceOverride) {
    updateSingleStylingValue(context, offset, input, true, directiveRef, forceOverride);
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
 * @param forceOverride whether or not to skip all directive prioritization
 *    and just apply the value regardless.
 */
export function updateStyleProp(context, offset, input, directiveRef, forceOverride) {
    updateSingleStylingValue(context, offset, input, false, directiveRef, forceOverride);
}
function updateSingleStylingValue(context, offset, input, isClassBased, directiveRef, forceOverride) {
    var directiveIndex = getDirectiveIndexFromRegistry(context, directiveRef || null);
    var singleIndex = getSinglePropIndexValue(context, directiveIndex, offset, isClassBased);
    var currValue = getValue(context, singleIndex);
    var currFlag = getPointers(context, singleIndex);
    var currDirective = getDirectiveIndexFromEntry(context, singleIndex);
    var value = (input instanceof BoundPlayerFactory) ? input.value : input;
    if (hasValueChanged(currFlag, currValue, value) &&
        (forceOverride || allowValueChange(currValue, value, currDirective, directiveIndex))) {
        var isClassBased_1 = (currFlag & 2 /* Class */) === 2 /* Class */;
        var element = context[0 /* ElementPosition */];
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
        var flushPlayerBuilders = context[1 /* MasterFlagPosition */] & 8 /* PlayerBuildersDirty */;
        var native = context[0 /* ElementPosition */];
        var multiStartIndex = getMultiStylesStartIndex(context);
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
                if (!valueExists(valueToApply, isClassBased)) {
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
 * Assigns a style value to a style property for the given element.
 *
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
            native.style.setProperty(prop, value);
    }
    else {
        ngDevMode && ngDevMode.rendererRemoveStyle++;
        isProceduralRenderer(renderer) ?
            renderer.removeStyle(native, prop, RendererStyleFlags3.DashCase) :
            native.style.removeProperty(prop);
    }
}
/**
 * Adds/removes the provided className value to the provided element.
 *
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
        // DOMTokenList will throw if we try to add or remove an empty string.
    }
    else if (className !== '') {
        if (add) {
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
    return (configFlag & 31 /* BitMask */) | (staticIndex << 5 /* BitCountSize */) |
        (dynamicIndex << (14 /* BitCountSize */ + 5 /* BitCountSize */));
}
function getInitialValue(context, flag) {
    var index = getInitialIndex(flag);
    var entryIsClassBased = flag & 2 /* Class */;
    var initialValues = entryIsClassBased ? context[4 /* InitialClassValuesPosition */] :
        context[3 /* InitialStyleValuesPosition */];
    return initialValues[index];
}
function getInitialIndex(flag) {
    return (flag >> 5 /* BitCountSize */) & 16383 /* BitMask */;
}
function getMultiOrSingleIndex(flag) {
    var index = (flag >> (14 /* BitCountSize */ + 5 /* BitCountSize */)) & 16383 /* BitMask */;
    return index >= 9 /* SingleStylesStartPosition */ ? index : -1;
}
function getMultiStartIndex(context) {
    return getMultiOrSingleIndex(context[1 /* MasterFlagPosition */]);
}
function getMultiClassesStartIndex(context) {
    var classCache = context[6 /* CachedMultiClasses */];
    return classCache[1 /* ValuesStartPosition */ +
        1 /* PositionStartOffset */];
}
function getMultiStylesStartIndex(context) {
    var stylesCache = context[7 /* CachedMultiStyles */];
    return stylesCache[1 /* ValuesStartPosition */ +
        1 /* PositionStartOffset */];
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
    var adjustedIndex = index === 1 /* MasterFlagPosition */ ? index : (index + 0 /* FlagsOffset */);
    context[adjustedIndex] = flag;
}
function getPointers(context, index) {
    var adjustedIndex = index === 1 /* MasterFlagPosition */ ? index : (index + 0 /* FlagsOffset */);
    return context[adjustedIndex];
}
export function getValue(context, index) {
    return context[index + 2 /* ValueOffset */];
}
export function getProp(context, index) {
    return context[index + 1 /* PropertyOffset */];
}
export function isContextDirty(context) {
    return isDirty(context, 1 /* MasterFlagPosition */);
}
export function setContextDirty(context, isDirtyYes) {
    setDirty(context, 1 /* MasterFlagPosition */, isDirtyYes);
}
export function setContextPlayersDirty(context, isDirtyYes) {
    if (isDirtyYes) {
        context[1 /* MasterFlagPosition */] |= 8 /* PlayerBuildersDirty */;
    }
    else {
        context[1 /* MasterFlagPosition */] &= ~8 /* PlayerBuildersDirty */;
    }
}
function swapMultiContextEntries(context, indexA, indexB) {
    if (indexA === indexB)
        return;
    var tmpValue = getValue(context, indexA);
    var tmpProp = getProp(context, indexA);
    var tmpFlag = getPointers(context, indexA);
    var tmpPlayerBuilderIndex = getPlayerBuilderIndex(context, indexA);
    var tmpDirectiveIndex = getDirectiveIndexFromEntry(context, indexA);
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
    var directiveIndexA = getDirectiveIndexFromEntry(context, indexB);
    setPlayerBuilderIndex(context, indexA, playerIndexA, directiveIndexA);
    setValue(context, indexB, tmpValue);
    setProp(context, indexB, tmpProp);
    setFlag(context, indexB, tmpFlag);
    setPlayerBuilderIndex(context, indexB, tmpPlayerBuilderIndex, tmpDirectiveIndex);
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
    return value !== null;
}
function prepareInitialFlag(context, prop, entryIsClassBased, sanitizer) {
    var flag = (sanitizer && sanitizer(prop)) ? 4 /* Sanitize */ : 0 /* None */;
    var initialIndex;
    if (entryIsClassBased) {
        flag |= 2 /* Class */;
        initialIndex =
            getInitialStylingValuesIndexOf(context[4 /* InitialClassValuesPosition */], prop);
    }
    else {
        initialIndex =
            getInitialStylingValuesIndexOf(context[3 /* InitialStyleValuesPosition */], prop);
    }
    initialIndex = initialIndex > 0 ? (initialIndex + 1 /* ValueOffset */) : 0;
    return pointers(flag, initialIndex, 0);
}
function hasInitialValueChanged(context, flag, newValue) {
    var initialValue = getInitialValue(context, flag);
    return !initialValue || hasValueChanged(flag, initialValue, newValue);
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
        index = index || 1 /* MasterFlagPosition */;
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
            bindingAllocationLocked: flag & 16 /* BindingAllocationLocked */ ? true : false,
        }
    };
}
export function getDirectiveIndexFromEntry(context, index) {
    var value = context[index + 3 /* PlayerBuilderIndexOffset */];
    return value & 65535 /* BitMask */;
}
function getDirectiveIndexFromRegistry(context, directiveRef) {
    var directiveIndex;
    var dirs = context[2 /* DirectiveRegistryPosition */];
    var index = getDirectiveRegistryValuesIndexOf(dirs, directiveRef);
    if (index === -1) {
        // if the directive was not allocated then this means that styling is
        // being applied in a dynamic way AFTER the element was already instantiated
        index = dirs.length;
        directiveIndex = index > 0 ? index / 4 /* Size */ : 0;
        dirs.push(null, null, null, null);
        dirs[index + 0 /* DirectiveValueOffset */] = directiveRef;
        dirs[index + 2 /* DirtyFlagOffset */] = false;
        dirs[index + 1 /* SinglePropValuesIndexOffset */] = -1;
        var classesStartIndex = getMultiClassesStartIndex(context) || 9 /* SingleStylesStartPosition */;
        registerMultiMapEntry(context, directiveIndex, true, context.length);
        registerMultiMapEntry(context, directiveIndex, false, classesStartIndex);
    }
    else {
        directiveIndex = index > 0 ? index / 4 /* Size */ : 0;
    }
    return directiveIndex;
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
    for (var i = 2 /* KeyValueStartPosition */; i < keyValues.length; i += 2 /* Size */) {
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
    var singlePropOffsetRegistryIndex = context[2 /* DirectiveRegistryPosition */][(directiveIndex * 4 /* Size */) +
        1 /* SinglePropValuesIndexOffset */];
    var offsets = context[5 /* SinglePropOffsetPositions */];
    var indexForOffset = singlePropOffsetRegistryIndex +
        2 /* ValueStartPosition */ +
        (isClassBased ?
            offsets[singlePropOffsetRegistryIndex + 0 /* StylesCountPosition */] :
            0) +
        offset;
    return offsets[indexForOffset];
}
function getStyleSanitizer(context, directiveIndex) {
    var dirs = context[2 /* DirectiveRegistryPosition */];
    var value = dirs[directiveIndex * 4 /* Size */ +
        3 /* StyleSanitizerOffset */] ||
        dirs[3 /* StyleSanitizerOffset */] || null;
    return value;
}
function isDirectiveDirty(context, directiveIndex) {
    var dirs = context[2 /* DirectiveRegistryPosition */];
    return dirs[directiveIndex * 4 /* Size */ +
        2 /* DirtyFlagOffset */];
}
function setDirectiveDirty(context, directiveIndex, dirtyYes) {
    var dirs = context[2 /* DirectiveRegistryPosition */];
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
    // this decides what to do if and when there is a collision.
    if (currentValue != null) {
        if (newValue != null) {
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
 * Returns the className string of all the initial classes for the element.
 *
 * This function is designed to populate and cache all the static class
 * values into a className string. The caching mechanism works by placing
 * the completed className string into the initial values array into a
 * dedicated slot. This will prevent the function from having to populate
 * the string each time an element is created or matched.
 *
 * @returns the className string (e.g. `on active red`)
 */
export function getInitialClassNameValue(context) {
    var initialClassValues = context[4 /* InitialClassValuesPosition */];
    var className = initialClassValues[1 /* InitialClassesStringPosition */];
    if (className === null) {
        className = '';
        for (var i = 2 /* KeyValueStartPosition */; i < initialClassValues.length; i += 2 /* Size */) {
            var isPresent = initialClassValues[i + 1];
            if (isPresent) {
                className += (className.length ? ' ' : '') + initialClassValues[i];
            }
        }
        initialClassValues[1 /* InitialClassesStringPosition */] = className;
    }
    return className;
}
/**
 * Returns the style string of all the initial styles for the element.
 *
 * This function is designed to populate and cache all the static style
 * values into a style string. The caching mechanism works by placing
 * the completed style string into the initial values array into a
 * dedicated slot. This will prevent the function from having to populate
 * the string each time an element is created or matched.
 *
 * @returns the style string (e.g. `width:100px;height:200px`)
 */
export function getInitialStyleStringValue(context) {
    var initialStyleValues = context[3 /* InitialStyleValuesPosition */];
    var styleString = initialStyleValues[1 /* InitialClassesStringPosition */];
    if (styleString === null) {
        styleString = '';
        for (var i = 2 /* KeyValueStartPosition */; i < initialStyleValues.length; i += 2 /* Size */) {
            var value = initialStyleValues[i + 1];
            if (value !== null) {
                styleString += (styleString.length ? ';' : '') + (initialStyleValues[i] + ":" + value);
            }
        }
        initialStyleValues[1 /* InitialClassesStringPosition */] = styleString;
    }
    return styleString;
}
/**
 * Returns the current cached mutli-value for a given directiveIndex within the provided context.
 */
function readCachedMapValue(context, entryIsClassBased, directiveIndex) {
    var values = context[entryIsClassBased ? 6 /* CachedMultiClasses */ : 7 /* CachedMultiStyles */];
    var index = 1 /* ValuesStartPosition */ +
        directiveIndex * 4 /* Size */;
    return values[index + 2 /* ValueOffset */] || null;
}
/**
 * Determines whether the provided multi styling value should be updated or not.
 *
 * Because `[style]` and `[class]` bindings rely on an identity change to occur before
 * applying new values, the styling algorithm may not update an existing entry into
 * the context if a previous directive's entry changed shape.
 *
 * This function will decide whether or not a value should be applied (if there is a
 * cache miss) to the context based on the following rules:
 *
 * - If there is an identity change between the existing value and new value
 * - If there is no existing value cached (first write)
 * - If a previous directive flagged the existing cached value as dirty
 */
function isMultiValueCacheHit(context, entryIsClassBased, directiveIndex, newValue) {
    var indexOfCachedValues = entryIsClassBased ? 6 /* CachedMultiClasses */ : 7 /* CachedMultiStyles */;
    var cachedValues = context[indexOfCachedValues];
    var index = 1 /* ValuesStartPosition */ +
        directiveIndex * 4 /* Size */;
    if (cachedValues[index + 0 /* DirtyFlagOffset */])
        return false;
    return newValue === NO_CHANGE ||
        readCachedMapValue(context, entryIsClassBased, directiveIndex) === newValue;
}
/**
 * Updates the cached status of a multi-styling value in the context.
 *
 * The cached map array (which exists in the context) contains a manifest of
 * each multi-styling entry (`[style]` and `[class]` entries) for the template
 * as well as all directives.
 *
 * This function will update the cached status of the provided multi-style
 * entry within the cache.
 *
 * When called, this function will update the following information:
 * - The actual cached value (the raw value that was passed into `[style]` or `[class]`)
 * - The total amount of unique styling entries that this value has written into the context
 * - The exact position of where the multi styling entries start in the context for this binding
 * - The dirty flag will be set to true
 *
 * If the `dirtyFutureValues` param is provided then it will update all future entries (binding
 * entries that exist as apart of other directives) to be dirty as well. This will force the
 * styling algorithm to reapply those values once change detection checks them (which will in
 * turn cause the styling context to update itself and the correct styling values will be
 * rendered on screen).
 */
function updateCachedMapValue(context, directiveIndex, entryIsClassBased, cacheValue, startPosition, endPosition, totalValues, dirtyFutureValues) {
    var values = context[entryIsClassBased ? 6 /* CachedMultiClasses */ : 7 /* CachedMultiStyles */];
    var index = 1 /* ValuesStartPosition */ +
        directiveIndex * 4 /* Size */;
    // in the event that this is true we assume that future values are dirty and therefore
    // will be checked again in the next CD cycle
    if (dirtyFutureValues) {
        var nextStartPosition = startPosition + totalValues * 4 /* Size */;
        for (var i = index + 4 /* Size */; i < values.length; i += 4 /* Size */) {
            values[i + 1 /* PositionStartOffset */] = nextStartPosition;
            values[i + 0 /* DirtyFlagOffset */] = 1;
        }
    }
    values[index + 0 /* DirtyFlagOffset */] = 0;
    values[index + 1 /* PositionStartOffset */] = startPosition;
    values[index + 2 /* ValueOffset */] = cacheValue;
    values[index + 3 /* ValueCountOffset */] = totalValues;
    // the code below counts the total amount of styling values that exist in
    // the context up until this directive. This value will be later used to
    // update the cached value map's total counter value.
    var totalStylingEntries = totalValues;
    for (var i = 1 /* ValuesStartPosition */; i < index; i += 4 /* Size */) {
        totalStylingEntries += values[i + 3 /* ValueCountOffset */];
    }
    // because style values come before class values in the context this means
    // that if any new values were inserted then the cache values array for
    // classes is out of sync. The code below will update the offsets to point
    // to their new values.
    if (!entryIsClassBased) {
        var classCache = context[6 /* CachedMultiClasses */];
        var classesStartPosition = classCache[1 /* ValuesStartPosition */ +
            1 /* PositionStartOffset */];
        var diffInStartPosition = endPosition - classesStartPosition;
        for (var i = 1 /* ValuesStartPosition */; i < classCache.length; i += 4 /* Size */) {
            classCache[i + 1 /* PositionStartOffset */] += diffInStartPosition;
        }
    }
    values[0 /* EntriesCountPosition */] = totalStylingEntries;
}
function hyphenateEntries(entries) {
    var newEntries = [];
    for (var i = 0; i < entries.length; i++) {
        newEntries.push(hyphenate(entries[i]));
    }
    return newEntries;
}
function hyphenate(value) {
    return value.replace(/[a-z][A-Z]/g, function (match) { return match.charAt(0) + "-" + match.charAt(1).toLowerCase(); });
}
function registerMultiMapEntry(context, directiveIndex, entryIsClassBased, startPosition, count) {
    if (count === void 0) { count = 0; }
    var cachedValues = context[entryIsClassBased ? 6 /* CachedMultiClasses */ : 7 /* CachedMultiStyles */];
    if (directiveIndex > 0) {
        var limit = 1 /* ValuesStartPosition */ +
            (directiveIndex * 4 /* Size */);
        while (cachedValues.length < limit) {
            // this means that ONLY directive class styling (like ngClass) was used
            // therefore the root directive will still need to be filled in as well
            // as any other directive spaces incase they only used static values
            cachedValues.push(0, startPosition, null, 0);
        }
    }
    cachedValues.push(0, startPosition, null, count);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xhc3NfYW5kX3N0eWxlX2JpbmRpbmdzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9zdHlsaW5nL2NsYXNzX2FuZF9zdHlsZV9iaW5kaW5ncy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBUUEsT0FBTyxFQUFDLFdBQVcsRUFBRSxTQUFTLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFHaEQsT0FBTyxFQUFzQixtQkFBbUIsRUFBRSxvQkFBb0IsRUFBQyxNQUFNLHdCQUF3QixDQUFDO0FBR3RHLE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxXQUFXLENBQUM7QUFDcEMsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLDhCQUE4QixDQUFDO0FBRTVELE9BQU8sRUFBQyxrQkFBa0IsRUFBQyxNQUFNLGtCQUFrQixDQUFDO0FBQ3BELE9BQU8sRUFBQyxpQkFBaUIsRUFBRSxrQkFBa0IsRUFBRSw0QkFBNEIsRUFBRSx5QkFBeUIsRUFBRSxnQkFBZ0IsRUFBQyxNQUFNLFFBQVEsQ0FBQztBQUl4STs7Ozs7Ozs7Ozs7Ozs7R0FjRztBQUlIOztHQUVHO0FBQ0gsTUFBTSxVQUFVLHVCQUF1QixDQUFDLEtBQWtCO0lBQ3hELElBQU0sT0FBTyxHQUFHLHlCQUF5QixFQUFFLENBQUM7SUFDNUMsSUFBTSxjQUFjLEdBQXlCLE9BQU8sb0NBQXlDO1FBQ3pGLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQ2pCLElBQU0sYUFBYSxHQUF5QixPQUFPLG9DQUF5QztRQUN4RixDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztJQUVqQixrRkFBa0Y7SUFDbEYsMkZBQTJGO0lBQzNGLElBQUksSUFBSSxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBQ2QsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7UUFDckMsSUFBTSxJQUFJLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3RCLElBQUksT0FBTyxJQUFJLElBQUksUUFBUSxFQUFFO1lBQzNCLElBQUksR0FBRyxJQUFJLENBQUM7U0FDYjthQUFNLElBQUksSUFBSSxtQkFBMkIsRUFBRTtZQUMxQyxhQUFhLENBQUMsSUFBSSxDQUFDLElBQWMsRUFBRSxLQUFLLENBQUMsRUFBRSxDQUFDLENBQVcsQ0FBQyxDQUFDO1NBQzFEO2FBQU0sSUFBSSxJQUFJLG9CQUE0QixFQUFFO1lBQzNDLGNBQWMsQ0FBQyxJQUFJLENBQUMsSUFBYyxFQUFFLElBQUksQ0FBQyxDQUFDO1NBQzNDO2FBQU0sSUFBSSxJQUFJLHVCQUErQixFQUFFO1lBQzlDLE1BQU07U0FDUDtLQUNGO0lBRUQsT0FBTyxPQUFPLENBQUM7QUFDakIsQ0FBQztBQUVEOzs7Ozs7OztHQVFHO0FBQ0gsTUFBTSxVQUFVLDJCQUEyQixDQUN2QyxPQUF1QixFQUFFLEtBQWtCLEVBQUUsYUFBcUIsRUFBRSxZQUFpQjtJQUN2Rix1RkFBdUY7SUFDdkYsMEZBQTBGO0lBQzFGLDRGQUE0RjtJQUM1Riw4RkFBOEY7SUFDOUYsSUFBTSxVQUFVLEdBQUcsT0FBTyxtQ0FBd0MsQ0FBQztJQUNuRSxJQUFJLGlDQUFpQyxDQUFDLFVBQVUsRUFBRSxZQUFZLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRTtRQUNyRSxzREFBc0Q7UUFDdEQsNEJBQTRCLENBQUMsT0FBTyxFQUFFLFlBQVksQ0FBQyxDQUFDO1FBRXBELElBQUksY0FBYyxHQUE4QixJQUFJLENBQUM7UUFDckQsSUFBSSxhQUFhLEdBQThCLElBQUksQ0FBQztRQUVwRCxJQUFJLElBQUksR0FBRyxDQUFDLENBQUMsQ0FBQztRQUNkLEtBQUssSUFBSSxDQUFDLEdBQUcsYUFBYSxFQUFFLENBQUMsR0FBRyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO1lBQ2pELElBQU0sSUFBSSxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN0QixJQUFJLE9BQU8sSUFBSSxJQUFJLFFBQVEsRUFBRTtnQkFDM0IsSUFBSSxHQUFHLElBQUksQ0FBQzthQUNiO2lCQUFNLElBQUksSUFBSSxtQkFBMkIsRUFBRTtnQkFDMUMsY0FBYyxHQUFHLGNBQWMsSUFBSSxPQUFPLG9DQUF5QyxDQUFDO2dCQUNwRix3QkFBd0IsQ0FBQyxjQUFjLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO2FBQ3REO2lCQUFNLElBQUksSUFBSSxrQkFBMEIsRUFBRTtnQkFDekMsYUFBYSxHQUFHLGFBQWEsSUFBSSxPQUFPLG9DQUF5QyxDQUFDO2dCQUNsRix3QkFBd0IsQ0FBQyxhQUFhLEVBQUUsSUFBSSxFQUFFLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7YUFDM0Q7U0FDRjtLQUNGO0FBQ0gsQ0FBQztBQUVEOzs7Ozs7O0dBT0c7QUFDSCxTQUFTLHdCQUF3QixDQUM3QixjQUFvQyxFQUFFLElBQVksRUFBRSxLQUFVO0lBQ2hFLGlFQUFpRTtJQUNqRSxLQUFLLElBQUksQ0FBQyxnQ0FBa0QsRUFBRSxDQUFDLEdBQUcsY0FBYyxDQUFDLE1BQU0sR0FBRztRQUN4RixJQUFNLEdBQUcsR0FBRyxjQUFjLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDOUIsSUFBSSxHQUFHLEtBQUssSUFBSSxFQUFFO1lBQ2hCLElBQU0sYUFBYSxHQUFHLGNBQWMsQ0FBQyxDQUFDLHNCQUF3QyxDQUFDLENBQUM7WUFFaEYseUVBQXlFO1lBQ3pFLG1FQUFtRTtZQUNuRSxJQUFJLGFBQWEsSUFBSSxJQUFJLElBQUksYUFBYSxJQUFJLEtBQUssRUFBRTtnQkFDbkQsY0FBYyxDQUFDLENBQUMsc0JBQXdDLENBQUMsR0FBRyxLQUFLLENBQUM7YUFDbkU7WUFDRCxPQUFPO1NBQ1I7UUFDRCxDQUFDLEdBQUcsQ0FBQyxlQUFpQyxDQUFDO0tBQ3hDO0lBQ0QsK0NBQStDO0lBQy9DLGNBQWMsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDO0FBQ25DLENBQUM7QUFFRDs7O0dBR0c7QUFDSCxNQUFNLFVBQVUsbUJBQW1CLENBQy9CLE9BQWlCLEVBQUUsT0FBdUIsRUFBRSxRQUFtQjtJQUNqRSxJQUFNLGFBQWEsR0FBRyxPQUFPLG9DQUF5QyxDQUFDO0lBQ3ZFLDBCQUEwQixDQUFDLE9BQU8sRUFBRSxRQUFRLEVBQUUsYUFBYSxFQUFFLEtBQUssQ0FBQyxDQUFDO0FBQ3RFLENBQUM7QUFFRDs7O0dBR0c7QUFDSCxNQUFNLFVBQVUsb0JBQW9CLENBQ2hDLE9BQWlCLEVBQUUsT0FBdUIsRUFBRSxRQUFtQjtJQUNqRSxJQUFNLGNBQWMsR0FBRyxPQUFPLG9DQUF5QyxDQUFDO0lBQ3hFLDBCQUEwQixDQUFDLE9BQU8sRUFBRSxRQUFRLEVBQUUsY0FBYyxFQUFFLElBQUksQ0FBQyxDQUFDO0FBQ3RFLENBQUM7QUFFRDs7O0dBR0c7QUFDSCxTQUFTLDBCQUEwQixDQUMvQixPQUFpQixFQUFFLFFBQW1CLEVBQUUsb0JBQTBDLEVBQ2xGLGlCQUEwQjtJQUM1QixLQUFLLElBQUksQ0FBQyxnQ0FBa0QsRUFBRSxDQUFDLEdBQUcsb0JBQW9CLENBQUMsTUFBTSxFQUN4RixDQUFDLGdCQUFrQyxFQUFFO1FBQ3hDLElBQU0sS0FBSyxHQUFHLG9CQUFvQixDQUFDLENBQUMsc0JBQXdDLENBQUMsQ0FBQztRQUM5RSxJQUFJLEtBQUssRUFBRTtZQUNULElBQUksaUJBQWlCLEVBQUU7Z0JBQ3JCLFFBQVEsQ0FDSixPQUFPLEVBQUUsb0JBQW9CLENBQUMsQ0FBQyxxQkFBdUMsQ0FBVyxFQUFFLElBQUksRUFDdkYsUUFBUSxFQUFFLElBQUksQ0FBQyxDQUFDO2FBQ3JCO2lCQUFNO2dCQUNMLFFBQVEsQ0FDSixPQUFPLEVBQUUsb0JBQW9CLENBQUMsQ0FBQyxxQkFBdUMsQ0FBVyxFQUNqRixLQUFlLEVBQUUsUUFBUSxFQUFFLElBQUksQ0FBQyxDQUFDO2FBQ3RDO1NBQ0Y7S0FDRjtBQUNILENBQUM7QUFFRCxNQUFNLFVBQVUsaUNBQWlDLENBQUMsT0FBdUI7SUFDdkUsT0FBTyxDQUFDLE9BQU8sNEJBQWlDLG1DQUF1QyxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQ2pHLENBQUM7QUFFRDs7Ozs7Ozs7Ozs7OztHQWFHO0FBQ0gsTUFBTSxVQUFVLHlCQUF5QixDQUNyQyxPQUF1QixFQUFFLFlBQXdCLEVBQUUsaUJBQW1DLEVBQ3RGLGlCQUFtQyxFQUFFLGNBQXVDO0lBQzlFLElBQUksT0FBTyw0QkFBaUMsbUNBQXVDO1FBQUUsT0FBTztJQUU1RixnRkFBZ0Y7SUFDaEYsSUFBTSxjQUFjLEdBQUcsZ0NBQWdDLENBQUMsT0FBTyxFQUFFLFlBQVksRUFBRSxjQUFjLENBQUMsQ0FBQztJQUMvRixJQUFJLGNBQWMsS0FBSyxDQUFDLENBQUMsRUFBRTtRQUN6QixzRkFBc0Y7UUFDdEYsT0FBTztLQUNSO0lBRUQsSUFBSSxpQkFBaUIsRUFBRTtRQUNyQixpQkFBaUIsR0FBRyxnQkFBZ0IsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO0tBQ3pEO0lBRUQscUZBQXFGO0lBQ3JGLG1GQUFtRjtJQUNuRix1RkFBdUY7SUFDdkYsMkZBQTJGO0lBQzNGLG1CQUFtQjtJQUNuQixJQUFNLHNCQUFzQixHQUFHLE9BQU8sbUNBQXdDLENBQUM7SUFDL0UsSUFBTSx5QkFBeUIsR0FDM0Isc0JBQXNCLDhCQUFrRCxDQUFDO0lBQzdFLElBQU0seUJBQXlCLEdBQzNCLHNCQUFzQiw2QkFBaUQsQ0FBQztJQUU1RSxJQUFNLG9CQUFvQixHQUFHLE9BQU8sNEJBQWlDLENBQUM7SUFDdEUsSUFBTSxvQkFBb0IsR0FBRyxPQUFPLDJCQUFnQyxDQUFDO0lBRXJFLElBQU0sYUFBYSxHQUFHLHlCQUF5QixlQUFvQixDQUFDO0lBQ3BFLElBQU0sWUFBWSxHQUFHLHlCQUF5QixlQUFvQixDQUFDO0lBRW5FLElBQU0sc0JBQXNCLG9DQUF5QyxDQUFDO0lBQ3RFLElBQUksdUJBQXVCLEdBQUcsc0JBQXNCLEdBQUcsWUFBWSxDQUFDO0lBQ3BFLElBQUkscUJBQXFCLEdBQUcsdUJBQXVCLEdBQUcsYUFBYSxDQUFDO0lBQ3BFLElBQUksc0JBQXNCLEdBQUcscUJBQXFCLEdBQUcsWUFBWSxDQUFDO0lBRWxFLDhFQUE4RTtJQUM5RSxnRkFBZ0Y7SUFDaEYsK0VBQStFO0lBQy9FLHFGQUFxRjtJQUNyRixtRkFBbUY7SUFDbkYsc0ZBQXNGO0lBQ3RGLHFGQUFxRjtJQUNyRixxRkFBcUY7SUFDckYsSUFBTSx3QkFBd0IsR0FBRyxzQkFBc0IsQ0FBQyxNQUFNLENBQUM7SUFDL0Qsc0JBQXNCLENBQUMsSUFBSSxDQUN2QixpQkFBaUIsQ0FBQyxDQUFDLENBQUMsaUJBQWlCLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQ2hELGlCQUFpQixDQUFDLENBQUMsQ0FBQyxpQkFBaUIsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBRXRELHdGQUF3RjtJQUN4Rix5RkFBeUY7SUFDekYsbUVBQW1FO0lBQ25FLElBQUksZUFBZSxHQUFHLENBQUMsQ0FBQztJQUN4QixJQUFNLHlCQUF5QixHQUFhLEVBQUUsQ0FBQztJQUMvQyxJQUFJLGlCQUFpQixJQUFJLGlCQUFpQixDQUFDLE1BQU0sRUFBRTtRQUNqRCxLQUFLLElBQUksR0FBQyxHQUFHLENBQUMsRUFBRSxHQUFDLEdBQUcsaUJBQWlCLENBQUMsTUFBTSxFQUFFLEdBQUMsRUFBRSxFQUFFO1lBQ2pELElBQU0sTUFBSSxHQUFHLGlCQUFpQixDQUFDLEdBQUMsQ0FBQyxDQUFDO1lBQ2xDLElBQUksZUFBZSxHQUNmLHVCQUF1QixDQUFDLE9BQU8sRUFBRSxNQUFJLEVBQUUsc0JBQXNCLEVBQUUsdUJBQXVCLENBQUMsQ0FBQztZQUM1RixJQUFJLGVBQWUsSUFBSSxDQUFDLENBQUMsRUFBRTtnQkFDekIsZUFBZSxHQUFHLHVCQUF1QixHQUFHLGVBQWUsQ0FBQztnQkFDNUQsZUFBZSxnQkFBcUIsQ0FBQztnQkFDckMseUJBQXlCLENBQUMsSUFBSSxDQUFDLE1BQUksQ0FBQyxDQUFDO2FBQ3RDO1lBQ0Qsc0JBQXNCLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDO1NBQzlDO0tBQ0Y7SUFFRCxnR0FBZ0c7SUFDaEcsSUFBTSx5QkFBeUIsR0FBYSxFQUFFLENBQUM7SUFDL0MsSUFBSSxpQkFBaUIsSUFBSSxpQkFBaUIsQ0FBQyxNQUFNLEVBQUU7UUFDakQsS0FBSyxJQUFJLEdBQUMsR0FBRyxDQUFDLEVBQUUsR0FBQyxHQUFHLGlCQUFpQixDQUFDLE1BQU0sRUFBRSxHQUFDLEVBQUUsRUFBRTtZQUNqRCxJQUFNLE1BQUksR0FBRyxpQkFBaUIsQ0FBQyxHQUFDLENBQUMsQ0FBQztZQUNsQyxJQUFJLGVBQWUsR0FDZix1QkFBdUIsQ0FBQyxPQUFPLEVBQUUsTUFBSSxFQUFFLHVCQUF1QixFQUFFLHFCQUFxQixDQUFDLENBQUM7WUFDM0YsSUFBSSxlQUFlLElBQUksQ0FBQyxDQUFDLEVBQUU7Z0JBQ3pCLGVBQWUsR0FBRyxxQkFBcUIsR0FBRyxlQUFlLENBQUM7Z0JBQzFELGVBQWUsZ0JBQXFCLENBQUM7Z0JBQ3JDLHlCQUF5QixDQUFDLElBQUksQ0FBQyxNQUFJLENBQUMsQ0FBQzthQUN0QztpQkFBTTtnQkFDTCxlQUFlLElBQUkseUJBQXlCLENBQUMsTUFBTSxlQUFvQixDQUFDO2FBQ3pFO1lBQ0Qsc0JBQXNCLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDO1NBQzlDO0tBQ0Y7SUFFRCw0RkFBNEY7SUFDNUYsK0ZBQStGO0lBQy9GLDRGQUE0RjtJQUM1RixvRUFBb0U7SUFDcEUsSUFBSSxDQUFDLDZCQUFpRCxDQUFDO0lBQ3ZELElBQUkseUJBQXlCLENBQUMsTUFBTSxFQUFFO1FBQ3BDLE9BQU8sQ0FBQyxHQUFHLHdCQUF3QixFQUFFO1lBQ25DLElBQU0sV0FBVyxHQUNiLHNCQUFzQixDQUFDLENBQUMsOEJBQWtELENBQUMsQ0FBQztZQUNoRixJQUFNLFlBQVksR0FDZCxzQkFBc0IsQ0FBQyxDQUFDLCtCQUFtRCxDQUFDLENBQUM7WUFDakYsSUFBSSxZQUFZLEVBQUU7Z0JBQ2hCLElBQU0sS0FBSyxHQUFHLENBQUMsNkJBQWlELEdBQUcsV0FBVyxDQUFDO2dCQUMvRSxLQUFLLElBQUksQ0FBQyxHQUFHLEtBQUssRUFBRSxDQUFDLEdBQUcsS0FBSyxHQUFHLFlBQVksRUFBRSxDQUFDLEVBQUUsRUFBRTtvQkFDakQsc0JBQXNCLENBQUMsQ0FBQyxDQUFDLElBQUkseUJBQXlCLENBQUMsTUFBTSxlQUFvQixDQUFDO2lCQUNuRjthQUNGO1lBRUQsSUFBTSxLQUFLLEdBQUcsV0FBVyxHQUFHLFlBQVksQ0FBQztZQUN6QyxDQUFDLElBQUksNkJBQWlELEtBQUssQ0FBQztTQUM3RDtLQUNGO0lBRUQsSUFBTSxlQUFlLEdBQUcseUJBQXlCLENBQUMsTUFBTSxHQUFHLHlCQUF5QixDQUFDLE1BQU0sQ0FBQztJQUU1Riw0RkFBNEY7SUFDNUYsNEZBQTRGO0lBQzVGLHlDQUF5QztJQUN6QyxLQUFLLElBQUksR0FBQyxHQUFHLHNCQUFzQixFQUFFLEdBQUMsR0FBRyxPQUFPLENBQUMsTUFBTSxFQUFFLEdBQUMsZ0JBQXFCLEVBQUU7UUFDL0UsSUFBTSxZQUFZLEdBQUcsR0FBQyxJQUFJLHFCQUFxQixDQUFDO1FBQ2hELElBQU0sWUFBWSxHQUFHLEdBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsc0JBQXNCLENBQUMsQ0FBQyxDQUFDLHVCQUF1QixDQUFDLENBQUM7UUFDNUYsSUFBTSxJQUFJLEdBQUcsV0FBVyxDQUFDLE9BQU8sRUFBRSxHQUFDLENBQUMsQ0FBQztRQUNyQyxJQUFNLFdBQVcsR0FBRyxlQUFlLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDMUMsSUFBSSxrQkFBa0IsR0FBRyxxQkFBcUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNyRCxJQUFJLFlBQVksRUFBRTtZQUNoQixrQkFBa0I7Z0JBQ2QsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDLHlCQUF5QixDQUFDLE1BQU0sZUFBb0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7U0FDL0U7YUFBTTtZQUNMLGtCQUFrQixJQUFJLENBQUMsZUFBZSxlQUFvQixDQUFDO2dCQUN2RCxDQUFDLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyx5QkFBeUIsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxlQUFvQixDQUFDLENBQUM7U0FDakY7UUFDRCxPQUFPLENBQUMsT0FBTyxFQUFFLEdBQUMsRUFBRSxRQUFRLENBQUMsSUFBSSxFQUFFLFdBQVcsRUFBRSxrQkFBa0IsQ0FBQyxDQUFDLENBQUM7S0FDdEU7SUFFRCx3RUFBd0U7SUFDeEUsS0FBSyxJQUFJLEdBQUMsR0FBRyxDQUFDLEVBQUUsR0FBQyxHQUFHLHlCQUF5QixDQUFDLE1BQU0sZUFBb0IsRUFBRSxHQUFDLEVBQUUsRUFBRTtRQUM3RSxPQUFPLENBQUMsTUFBTSxDQUFDLHNCQUFzQixFQUFFLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUNoRCxPQUFPLENBQUMsTUFBTSxDQUFDLHVCQUF1QixFQUFFLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUNqRCx1QkFBdUIsRUFBRSxDQUFDO1FBQzFCLHFCQUFxQixFQUFFLENBQUM7UUFDeEIsc0JBQXNCLElBQUksQ0FBQyxDQUFDLENBQUUsMENBQTBDO0tBQ3pFO0lBRUQsd0VBQXdFO0lBQ3hFLEtBQUssSUFBSSxHQUFDLEdBQUcsQ0FBQyxFQUFFLEdBQUMsR0FBRyx5QkFBeUIsQ0FBQyxNQUFNLGVBQW9CLEVBQUUsR0FBQyxFQUFFLEVBQUU7UUFDN0UsT0FBTyxDQUFDLE1BQU0sQ0FBQyxxQkFBcUIsRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDL0MsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNuQixxQkFBcUIsRUFBRSxDQUFDO1FBQ3hCLHNCQUFzQixFQUFFLENBQUM7S0FDMUI7SUFFRCxJQUFNLGNBQWMsR0FBRyxPQUFPLG9DQUF5QyxDQUFDO0lBQ3hFLElBQU0sYUFBYSxHQUFHLE9BQU8sb0NBQXlDLENBQUM7SUFFdkUsd0ZBQXdGO0lBQ3hGLHVGQUF1RjtJQUN2Riw0RkFBNEY7SUFDNUYsS0FBSyxJQUFJLEdBQUMsR0FBRyxDQUFDLEVBQUUsR0FBQyxHQUFHLGVBQWUsRUFBRSxHQUFDLEVBQUUsRUFBRTtRQUN4QyxJQUFNLGlCQUFpQixHQUFHLEdBQUMsSUFBSSx5QkFBeUIsQ0FBQyxNQUFNLENBQUM7UUFDaEUsSUFBTSxhQUFhLEdBQUcsaUJBQWlCLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBQyxHQUFHLHlCQUF5QixDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFDLENBQUM7UUFDckYsSUFBTSxRQUFRLEdBQUcsaUJBQWlCLENBQUMsQ0FBQyxDQUFDLHlCQUF5QixDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUM7WUFDMUMseUJBQXlCLENBQUMsYUFBYSxDQUFDLENBQUM7UUFFOUUsSUFBSSxVQUFVLFNBQUEsRUFBRSxXQUFXLFNBQUEsQ0FBQztRQUM1QixJQUFJLGlCQUFpQixFQUFFO1lBQ3JCLFVBQVUsR0FBRyxzQkFBc0I7Z0JBQy9CLENBQUMsQ0FBQyx5QkFBeUIsR0FBRyxhQUFhLENBQUMsZUFBb0IsQ0FBQyxDQUFDO1lBQ3RFLFdBQVcsR0FBRyx1QkFBdUI7Z0JBQ2pDLENBQUMsQ0FBQyx5QkFBeUIsR0FBRyxhQUFhLENBQUMsZUFBb0IsQ0FBQyxDQUFDO1NBQ3ZFO2FBQU07WUFDTCxVQUFVO2dCQUNOLHFCQUFxQixHQUFHLENBQUMsQ0FBQyx5QkFBeUIsR0FBRyxhQUFhLENBQUMsZUFBb0IsQ0FBQyxDQUFDO1lBQzlGLFdBQVcsR0FBRyxzQkFBc0I7Z0JBQ2hDLENBQUMsQ0FBQyx5QkFBeUIsR0FBRyxhQUFhLENBQUMsZUFBb0IsQ0FBQyxDQUFDO1NBQ3ZFO1FBRUQsc0VBQXNFO1FBQ3RFLDJFQUEyRTtRQUMzRSw4QkFBOEI7UUFDOUIsSUFBSSxxQkFBcUIsR0FBRyxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxhQUFhLENBQUM7UUFDL0UsSUFBSSxlQUFlLEdBQUcsOEJBQThCLENBQUMscUJBQXFCLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFDdEYsSUFBSSxlQUFlLEtBQUssQ0FBQyxDQUFDLEVBQUU7WUFDMUIsZUFBZSxHQUFHLHFCQUFxQixDQUFDLE1BQU0sc0JBQXdDLENBQUM7WUFDdkYscUJBQXFCLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQztTQUN4RTthQUFNO1lBQ0wsZUFBZSx1QkFBeUMsQ0FBQztTQUMxRDtRQUVELElBQU0sV0FBVyxHQUNiLGtCQUFrQixDQUFDLE9BQU8sRUFBRSxRQUFRLEVBQUUsaUJBQWlCLEVBQUUsY0FBYyxJQUFJLElBQUksQ0FBQyxDQUFDO1FBRXJGLE9BQU8sQ0FBQyxPQUFPLEVBQUUsV0FBVyxFQUFFLFFBQVEsQ0FBQyxXQUFXLEVBQUUsZUFBZSxFQUFFLFVBQVUsQ0FBQyxDQUFDLENBQUM7UUFDbEYsT0FBTyxDQUFDLE9BQU8sRUFBRSxXQUFXLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFDeEMsUUFBUSxDQUFDLE9BQU8sRUFBRSxXQUFXLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDckMscUJBQXFCLENBQUMsT0FBTyxFQUFFLFdBQVcsRUFBRSxDQUFDLEVBQUUsY0FBYyxDQUFDLENBQUM7UUFFL0QsT0FBTyxDQUFDLE9BQU8sRUFBRSxVQUFVLEVBQUUsUUFBUSxDQUFDLFdBQVcsRUFBRSxlQUFlLEVBQUUsV0FBVyxDQUFDLENBQUMsQ0FBQztRQUNsRixPQUFPLENBQUMsT0FBTyxFQUFFLFVBQVUsRUFBRSxRQUFRLENBQUMsQ0FBQztRQUN2QyxRQUFRLENBQUMsT0FBTyxFQUFFLFVBQVUsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUNwQyxxQkFBcUIsQ0FBQyxPQUFPLEVBQUUsVUFBVSxFQUFFLENBQUMsRUFBRSxjQUFjLENBQUMsQ0FBQztLQUMvRDtJQUVELHFGQUFxRjtJQUNyRixxRkFBcUY7SUFDckYsZ0NBQWdDO0lBQ2hDLHNCQUFzQiw4QkFBa0Q7UUFDcEUseUJBQXlCLEdBQUcseUJBQXlCLENBQUMsTUFBTSxDQUFDO0lBQ2pFLHNCQUFzQiw2QkFBaUQ7UUFDbkUseUJBQXlCLEdBQUcseUJBQXlCLENBQUMsTUFBTSxDQUFDO0lBRWpFLHVFQUF1RTtJQUN2RSxvQkFBb0IsOEJBQWdEO1FBQ2hFLHlCQUF5QixDQUFDLE1BQU0sQ0FBQztJQUNyQyxvQkFBb0IsOEJBQWdEO1FBQ2hFLHlCQUF5QixDQUFDLE1BQU0sQ0FBQztJQUNyQyxJQUFNLDRCQUE0QixHQUFHLHlCQUF5QixDQUFDLE1BQU0sZUFBb0IsQ0FBQztJQUMxRixJQUFNLDZCQUE2QixHQUFHLHlCQUF5QixDQUFDLE1BQU0sZUFBb0IsQ0FBQztJQUUzRiwwRkFBMEY7SUFDMUYsSUFBTSw4QkFBOEIsR0FDaEMscUJBQXFCLEdBQUcseUJBQXlCLGVBQW9CLENBQUM7SUFDMUUsSUFBTSxtQkFBbUIsR0FBRyxvQkFBb0IsQ0FBQyxNQUFNLENBQUM7SUFDeEQscUJBQXFCLENBQ2pCLE9BQU8sRUFBRSxjQUFjLEVBQUUsS0FBSyxFQUFFLDhCQUE4QixFQUM5RCx5QkFBeUIsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUV0QyxLQUFLLElBQUksR0FBQyw4QkFBZ0QsRUFBRSxHQUFDLEdBQUcsbUJBQW1CLEVBQzlFLEdBQUMsZ0JBQWtDLEVBQUU7UUFDeEMsMEZBQTBGO1FBQzFGLCtFQUErRTtRQUMvRSxvQkFBb0IsQ0FBQyxHQUFDLDhCQUFnRCxDQUFDO1lBQ25FLDZCQUE2QixHQUFHLDRCQUE0QixDQUFDO0tBQ2xFO0lBRUQsMkZBQTJGO0lBQzNGLElBQU0sK0JBQStCLEdBQ2pDLHNCQUFzQixHQUFHLHlCQUF5QixlQUFvQixDQUFDO0lBQzNFLElBQU0sbUJBQW1CLEdBQUcsb0JBQW9CLENBQUMsTUFBTSxDQUFDO0lBQ3hELHFCQUFxQixDQUNqQixPQUFPLEVBQUUsY0FBYyxFQUFFLElBQUksRUFBRSwrQkFBK0IsRUFDOUQseUJBQXlCLENBQUMsTUFBTSxDQUFDLENBQUM7SUFFdEMsS0FBSyxJQUFJLEdBQUMsOEJBQWdELEVBQUUsR0FBQyxHQUFHLG1CQUFtQixFQUM5RSxHQUFDLGdCQUFrQyxFQUFFO1FBQ3hDLHlGQUF5RjtRQUN6RixvRkFBb0Y7UUFDcEYscUZBQXFGO1FBQ3JGLHNGQUFzRjtRQUN0RiwwRkFBMEY7UUFDMUYsaUJBQWlCO1FBQ2pCLG9CQUFvQixDQUFDLEdBQUMsOEJBQWdELENBQUM7WUFDbkUsQ0FBQyw0QkFBNEIsR0FBRyxDQUFDLENBQUMsR0FBRyw2QkFBNkIsQ0FBQztLQUN4RTtJQUVELHVFQUF1RTtJQUN2RSxtQ0FBbUM7SUFDbkMsSUFBTSxVQUFVLEdBQUcsUUFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUscUJBQXFCLENBQUMsQ0FBQztJQUN6RCxPQUFPLENBQUMsT0FBTyw4QkFBbUMsVUFBVSxDQUFDLENBQUM7QUFDaEUsQ0FBQztBQUVEOztHQUVHO0FBQ0gsTUFBTSxVQUFVLGdDQUFnQyxDQUM1QyxPQUF1QixFQUFFLFlBQWlCLEVBQUUsY0FBdUM7SUFDckYsSUFBTSxhQUFhLEdBQUcsT0FBTyxtQ0FBd0MsQ0FBQztJQUN0RSxJQUFNLHdCQUF3QixHQUFHLE9BQU8sbUNBQXdDLENBQUMsTUFBTSxDQUFDO0lBRXhGLElBQUksY0FBc0IsQ0FBQztJQUMzQixJQUFJLGFBQWEsR0FBRyxpQ0FBaUMsQ0FBQyxhQUFhLEVBQUUsWUFBWSxDQUFDLENBQUM7SUFFbkYsSUFBSSxhQUFhLEtBQUssQ0FBQyxDQUFDLEVBQUU7UUFDeEIsYUFBYSxHQUFHLGFBQWEsQ0FBQyxNQUFNLENBQUM7UUFDckMsY0FBYyxHQUFHLGFBQWEsQ0FBQyxNQUFNLGVBQW9DLENBQUM7UUFFMUUsNEJBQTRCLENBQUMsT0FBTyxFQUFFLFlBQVksQ0FBQyxDQUFDO1FBQ3BELGFBQWEsQ0FBQyxhQUFhLHNDQUEyRCxDQUFDO1lBQ25GLHdCQUF3QixDQUFDO1FBQzdCLGFBQWEsQ0FBQyxhQUFhLCtCQUFvRCxDQUFDO1lBQzVFLGNBQWMsSUFBSSxJQUFJLENBQUM7S0FDNUI7U0FBTTtRQUNMLElBQU0sdUJBQXVCLEdBQ3pCLGFBQWEsc0NBQTJELENBQUM7UUFDN0UsSUFBSSxhQUFhLENBQUMsdUJBQXVCLENBQUcsSUFBSSxDQUFDLEVBQUU7WUFDakQsMERBQTBEO1lBQzFELE9BQU8sQ0FBQyxDQUFDLENBQUM7U0FDWDtRQUVELGNBQWMsR0FBRyxhQUFhLGVBQW9DLENBQUM7UUFFbkUsOEZBQThGO1FBQzlGLDhGQUE4RjtRQUM5RixzRkFBc0Y7UUFDdEYsSUFBTSx1QkFBdUIsR0FDekIsYUFBYSxzQ0FBMkQsQ0FBQztRQUM3RSxhQUFhLENBQUMsdUJBQXVCLENBQUMsR0FBRyx3QkFBd0IsQ0FBQztRQUVsRSx3RkFBd0Y7UUFDeEYsV0FBVztRQUNYLElBQU0sbUJBQW1CLEdBQUcsYUFBYSwrQkFBb0QsQ0FBQztRQUM5RixhQUFhLENBQUMsbUJBQW1CLENBQUMsR0FBRyxjQUFjLElBQUksSUFBSSxDQUFDO0tBQzdEO0lBRUQsT0FBTyxjQUFjLENBQUM7QUFDeEIsQ0FBQztBQUVELFNBQVMsdUJBQXVCLENBQzVCLE9BQXVCLEVBQUUsV0FBbUIsRUFBRSxLQUFhLEVBQUUsR0FBVztJQUMxRSxLQUFLLElBQUksQ0FBQyxHQUFHLEtBQUssRUFBRSxDQUFDLEdBQUcsR0FBRyxFQUFFLENBQUMsZ0JBQXFCLEVBQUU7UUFDbkQsSUFBSSxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxLQUFLLFdBQVc7WUFBRSxPQUFPLENBQUMsQ0FBQztLQUNuRDtJQUNELE9BQU8sQ0FBQyxDQUFDLENBQUM7QUFDWixDQUFDO0FBRUQ7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQTJCRztBQUNILE1BQU0sVUFBVSxnQkFBZ0IsQ0FDNUIsT0FBdUIsRUFBRSxZQUNxQyxFQUM5RCxXQUF3RixFQUN4RixZQUFrQjtJQUNwQixJQUFNLGNBQWMsR0FBRyw2QkFBNkIsQ0FBQyxPQUFPLEVBQUUsWUFBWSxJQUFJLElBQUksQ0FBQyxDQUFDO0lBRXBGLFlBQVksR0FBRyxZQUFZLElBQUksSUFBSSxDQUFDO0lBQ3BDLFdBQVcsR0FBRyxXQUFXLElBQUksSUFBSSxDQUFDO0lBQ2xDLElBQU0scUJBQXFCLEdBQUcsb0JBQW9CLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxjQUFjLEVBQUUsWUFBWSxDQUFDLENBQUM7SUFDaEcsSUFBTSxxQkFBcUIsR0FBRyxvQkFBb0IsQ0FBQyxPQUFPLEVBQUUsS0FBSyxFQUFFLGNBQWMsRUFBRSxXQUFXLENBQUMsQ0FBQztJQUVoRyxnRkFBZ0Y7SUFDaEYsSUFBSSxxQkFBcUIsSUFBSSxxQkFBcUI7UUFBRSxPQUFPO0lBRTNELFlBQVk7UUFDUixZQUFZLEtBQUssU0FBUyxDQUFDLENBQUMsQ0FBQyxrQkFBa0IsQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLGNBQWMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUM7SUFDbEcsV0FBVztRQUNQLFdBQVcsS0FBSyxTQUFTLENBQUMsQ0FBQyxDQUFDLGtCQUFrQixDQUFDLE9BQU8sRUFBRSxLQUFLLEVBQUUsY0FBYyxDQUFDLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQztJQUVqRyxJQUFNLE9BQU8sR0FBRyxPQUFPLHlCQUE4QyxDQUFDO0lBQ3RFLElBQU0sb0JBQW9CLEdBQUcsWUFBWSxZQUFZLGtCQUFrQixDQUFDLENBQUM7UUFDckUsSUFBSSwwQkFBMEIsQ0FBQyxZQUFtQixFQUFFLE9BQU8sZ0JBQW9CLENBQUMsQ0FBQztRQUNqRixJQUFJLENBQUM7SUFDVCxJQUFNLG1CQUFtQixHQUFHLFdBQVcsWUFBWSxrQkFBa0IsQ0FBQyxDQUFDO1FBQ25FLElBQUksMEJBQTBCLENBQUMsV0FBa0IsRUFBRSxPQUFPLGdCQUFvQixDQUFDLENBQUM7UUFDaEYsSUFBSSxDQUFDO0lBRVQsSUFBTSxZQUFZLEdBQUcsb0JBQW9CLENBQUMsQ0FBQztRQUN0QyxZQUFrRSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQzNFLFlBQVksQ0FBQztJQUNqQixJQUFNLFdBQVcsR0FBRyxtQkFBbUIsQ0FBQyxDQUFDLENBQUMsV0FBYSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDO0lBRTVFLElBQUksVUFBVSxHQUFhLFdBQVcsQ0FBQztJQUN2QyxJQUFJLGVBQWUsR0FBRyxLQUFLLENBQUM7SUFDNUIsSUFBSSxzQkFBc0IsR0FBRyxLQUFLLENBQUM7SUFFbkMsSUFBTSx5QkFBeUIsR0FDM0Isb0JBQW9CLENBQUMsQ0FBQyx1Q0FBMkMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUN6RSxJQUFJLHVCQUF1QixDQUNuQixPQUFPLEVBQUUsb0JBQW9CLHdDQUE0QyxFQUFFO1FBQ2pGLGdCQUFnQixDQUFDLE9BQU8sRUFBRSxvQkFBb0Isd0NBQTRDLENBQUM7UUFDM0Ysc0JBQXNCLEdBQUcsSUFBSSxDQUFDO0tBQy9CO0lBRUQsSUFBTSx3QkFBd0IsR0FDMUIsbUJBQW1CLENBQUMsQ0FBQyx1Q0FBMkMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUN4RSxJQUFJLHVCQUF1QixDQUNuQixPQUFPLEVBQUUsbUJBQW1CLHdDQUE0QyxFQUFFO1FBQ2hGLGdCQUFnQixDQUFDLE9BQU8sRUFBRSxtQkFBbUIsd0NBQTRDLENBQUM7UUFDMUYsc0JBQXNCLEdBQUcsSUFBSSxDQUFDO0tBQy9CO0lBRUQsMEVBQTBFO0lBQzFFLDJCQUEyQjtJQUMzQixJQUFJLENBQUMscUJBQXFCLEVBQUU7UUFDMUIsSUFBSSxPQUFPLFlBQVksSUFBSSxRQUFRLEVBQUU7WUFDbkMsVUFBVSxHQUFHLFlBQVksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDdkMsa0ZBQWtGO1lBQ2xGLG9FQUFvRTtZQUNwRSxlQUFlLEdBQUcsSUFBSSxDQUFDO1NBQ3hCO2FBQU07WUFDTCxVQUFVLEdBQUcsWUFBWSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUM7U0FDckU7S0FDRjtJQUVELElBQU0scUJBQXFCLEdBQUcsd0JBQXdCLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDaEUsSUFBSSxzQkFBc0IsR0FBRyx5QkFBeUIsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUNoRSxJQUFJLG9CQUFvQixHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUM7SUFFMUMsSUFBSSxDQUFDLHFCQUFxQixFQUFFO1FBQzFCLElBQU0sVUFBVSxHQUFHLFdBQVcsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDO1FBQ3hFLElBQU0sTUFBTSxHQUFHLFdBQVcsSUFBSSxTQUFTLENBQUM7UUFDeEMsSUFBTSxlQUFlLEdBQUcsMEJBQTBCLENBQzlDLE9BQU8sRUFBRSxjQUFjLEVBQUUsd0JBQXdCLEVBQUUscUJBQXFCLEVBQ3hFLHNCQUFzQixFQUFFLFVBQVUsRUFBRSxNQUFNLEVBQUUsV0FBVyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ3BFLElBQUksZUFBZSxFQUFFO1lBQ25CLHNCQUFzQixJQUFJLGVBQWUsZUFBb0IsQ0FBQztZQUM5RCxvQkFBb0IsSUFBSSxlQUFlLGVBQW9CLENBQUM7U0FDN0Q7S0FDRjtJQUVELElBQUksQ0FBQyxxQkFBcUIsRUFBRTtRQUMxQixJQUFNLE9BQU8sR0FBRyxDQUFDLFlBQVksSUFBSSxTQUFTLENBQXdCLENBQUM7UUFDbkUsMEJBQTBCLENBQ3RCLE9BQU8sRUFBRSxjQUFjLEVBQUUseUJBQXlCLEVBQUUsc0JBQXNCLEVBQzFFLG9CQUFvQixFQUFFLFVBQVUsRUFBRSxlQUFlLElBQUksT0FBTyxFQUFFLFlBQVksRUFBRSxJQUFJLENBQUMsQ0FBQztLQUN2RjtJQUVELElBQUksc0JBQXNCLEVBQUU7UUFDMUIsc0JBQXNCLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDO0tBQ3ZDO0FBQ0gsQ0FBQztBQUVEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQXlDRztBQUNILFNBQVMsMEJBQTBCLENBQy9CLE9BQXVCLEVBQUUsY0FBc0IsRUFBRSxrQkFBMEIsRUFBRSxRQUFnQixFQUM3RixNQUFjLEVBQUUsS0FBd0IsRUFBRSxNQUFtQyxFQUFFLFVBQWUsRUFDOUYsaUJBQTBCO0lBQzVCLElBQUksS0FBSyxHQUFHLEtBQUssQ0FBQztJQUVsQixJQUFNLFVBQVUsR0FBRztRQUNmLGNBQWMsZUFBaUMsQ0FBQztJQUVwRCxzRkFBc0Y7SUFDdEYsaURBQWlEO0lBQ2pELElBQU0sWUFBWSxHQUNkLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLDRCQUFpQyxDQUFDLDBCQUErQixDQUFDLENBQUM7SUFFbEcsa0ZBQWtGO0lBQ2xGLGtGQUFrRjtJQUNsRixJQUFNLHlCQUF5QixHQUMzQixZQUFZLENBQUMsVUFBVSw4QkFBZ0QsQ0FBQyxDQUFDO0lBRTdFLElBQU0sbUJBQW1CLEdBQUcsWUFBWSxDQUFDLFVBQVUsc0JBQXdDLENBQUMsQ0FBQztJQUM3RixJQUFNLHdCQUF3QixHQUMxQixZQUFZLENBQUMsVUFBVSwyQkFBNkMsQ0FBQyxDQUFDO0lBQzFFLElBQU0sMEJBQTBCLEdBQzVCLFlBQVksQ0FBQyxVQUFVLDBCQUE0QyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBRS9FLHlGQUF5RjtJQUN6RiwwRkFBMEY7SUFDMUYsdUZBQXVGO0lBQ3ZGLHNGQUFzRjtJQUN0Rix1RkFBdUY7SUFDdkYsMEZBQTBGO0lBQzFGLHVGQUF1RjtJQUN2Rix3RkFBd0Y7SUFDeEYsa0RBQWtEO0lBQ2xELElBQUksc0JBQXNCLEdBQ3RCLDBCQUEwQixJQUFJLENBQUMsQ0FBQyxDQUFDLG1CQUFtQixJQUFJLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBRXhGLElBQUksaUJBQWlCLEdBQUcsQ0FBQyxDQUFDO0lBQzFCLElBQUksc0JBQXNCLEdBQUcsQ0FBQyxDQUFDO0lBRS9CLHlFQUF5RTtJQUN6RSw0RUFBNEU7SUFDNUUsbURBQW1EO0lBQ25ELElBQU0sYUFBYSxHQUFHLE1BQU0sS0FBSyxJQUFJLENBQUM7SUFFdEMsVUFBVTtJQUNWLDJGQUEyRjtJQUMzRiwrRkFBK0Y7SUFDL0YsSUFBSSxRQUFRLEdBQUcsUUFBUSxDQUFDO0lBQ3hCLElBQUksd0JBQXdCLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQztJQUM1QyxPQUFPLFFBQVEsR0FBRyx5QkFBeUIsRUFBRTtRQUMzQyxJQUFNLFdBQVcsR0FBRyxPQUFPLENBQUMsT0FBTyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBQy9DLElBQUksd0JBQXdCLEVBQUU7WUFDNUIsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7Z0JBQ3JDLElBQU0sT0FBTyxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDekIsSUFBTSxjQUFjLEdBQUcsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7Z0JBQzNGLElBQUksY0FBYyxJQUFJLFdBQVcsS0FBSyxjQUFjLEVBQUU7b0JBQ3BELElBQU0sWUFBWSxHQUFHLFFBQVEsQ0FBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLENBQUM7b0JBQ2pELElBQU0scUJBQXFCLEdBQUcsMEJBQTBCLENBQUMsT0FBTyxFQUFFLFFBQVEsQ0FBQyxDQUFDO29CQUM1RSxJQUFNLEtBQUssR0FBRyxhQUFhLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUUsTUFBOEIsQ0FBQyxjQUFjLENBQUMsQ0FBQztvQkFDckYsSUFBTSxXQUFXLEdBQUcsV0FBVyxDQUFDLE9BQU8sRUFBRSxRQUFRLENBQUMsQ0FBQztvQkFDbkQsSUFBSSxlQUFlLENBQUMsV0FBVyxFQUFFLFlBQVksRUFBRSxLQUFLLENBQUM7d0JBQ2pELGdCQUFnQixDQUFDLFlBQVksRUFBRSxLQUFLLEVBQUUscUJBQXFCLEVBQUUsY0FBYyxDQUFDLEVBQUU7d0JBQ2hGLFFBQVEsQ0FBQyxPQUFPLEVBQUUsUUFBUSxFQUFFLEtBQUssQ0FBQyxDQUFDO3dCQUNuQyxxQkFBcUIsQ0FBQyxPQUFPLEVBQUUsUUFBUSxFQUFFLGtCQUFrQixFQUFFLGNBQWMsQ0FBQyxDQUFDO3dCQUM3RSxJQUFJLHNCQUFzQixDQUFDLE9BQU8sRUFBRSxXQUFXLEVBQUUsS0FBSyxDQUFDLEVBQUU7NEJBQ3ZELFFBQVEsQ0FBQyxPQUFPLEVBQUUsUUFBUSxFQUFFLElBQUksQ0FBQyxDQUFDOzRCQUNsQyxLQUFLLEdBQUcsSUFBSSxDQUFDO3lCQUNkO3FCQUNGO29CQUNELEtBQUssQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUM7b0JBQ2hCLHdCQUF3QixFQUFFLENBQUM7b0JBQzNCLE1BQU07aUJBQ1A7YUFDRjtTQUNGO1FBQ0QsUUFBUSxnQkFBcUIsQ0FBQztLQUMvQjtJQUVELFVBQVU7SUFDVixzRUFBc0U7SUFDdEUsSUFBSSx3QkFBd0IsRUFBRTtRQUM1QixJQUFNLFNBQVMsR0FBRyxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxpQkFBaUIsQ0FBQyxPQUFPLEVBQUUsY0FBYyxDQUFDLENBQUM7UUFDeEYsY0FBYyxFQUFFLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO1lBQ3JELElBQU0sT0FBTyxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUV6QixJQUFJLENBQUMsT0FBTyxFQUFFO2dCQUNaLDRFQUE0RTtnQkFDNUUsd0VBQXdFO2dCQUN4RSxTQUFTO2FBQ1Y7WUFFRCxJQUFNLEtBQUssR0FBRyxhQUFhLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUUsTUFBOEIsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUM5RSxJQUFNLGNBQWMsR0FBRyxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDeEUsSUFBTSxxQkFBcUIsR0FBRyxRQUFRLElBQUkseUJBQXlCLENBQUM7WUFFcEUsS0FBSyxJQUFJLENBQUMsR0FBRyxRQUFRLEVBQUUsQ0FBQyxHQUFHLE1BQU0sRUFBRSxDQUFDLGdCQUFxQixFQUFFO2dCQUN6RCxJQUFNLGNBQWMsR0FBRyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUMzQyxJQUFJLGNBQWMsS0FBSyxjQUFjLEVBQUU7b0JBQ3JDLElBQU0sd0JBQXdCLEdBQUcsMEJBQTBCLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDO29CQUN4RSxJQUFNLDRCQUE0QixHQUFHLHFCQUFxQixDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQztvQkFDdkUsSUFBTSxlQUFlLEdBQUcsUUFBUSxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQztvQkFDN0MsSUFBTSxjQUFjLEdBQUcsV0FBVyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQztvQkFFL0MsSUFBSSxnQkFBZ0IsQ0FBQyxlQUFlLEVBQUUsS0FBSyxFQUFFLHdCQUF3QixFQUFFLGNBQWMsQ0FBQyxFQUFFO3dCQUN0RixvRUFBb0U7d0JBQ3BFLG9FQUFvRTt3QkFDcEUsaUNBQWlDO3dCQUNqQyxJQUFJLHFCQUFxQixFQUFFOzRCQUN6Qix1QkFBdUIsQ0FBQyxPQUFPLEVBQUUsUUFBUSxFQUFFLENBQUMsQ0FBQyxDQUFDOzRCQUM5QyxpQkFBaUIsRUFBRSxDQUFDO3lCQUNyQjt3QkFFRCxJQUFJLGVBQWUsQ0FBQyxjQUFjLEVBQUUsZUFBZSxFQUFFLEtBQUssQ0FBQyxFQUFFOzRCQUMzRCxJQUFJLEtBQUssS0FBSyxJQUFJLElBQUksS0FBSyxLQUFLLFNBQVMsSUFBSSxLQUFLLEtBQUssZUFBZSxFQUFFO2dDQUN0RSxzQkFBc0IsR0FBRyxJQUFJLENBQUM7NkJBQy9COzRCQUVELFFBQVEsQ0FBQyxPQUFPLEVBQUUsUUFBUSxFQUFFLEtBQUssQ0FBQyxDQUFDOzRCQUVuQyx3QkFBd0I7NEJBQ3hCLHNFQUFzRTs0QkFDdEUsdUVBQXVFOzRCQUN2RSwwRUFBMEU7NEJBQzFFLHNFQUFzRTs0QkFDdEUsb0RBQW9EOzRCQUNwRCxJQUFJLGVBQWUsS0FBSyxJQUFJO2dDQUN4QixzQkFBc0IsQ0FBQyxPQUFPLEVBQUUsY0FBYyxFQUFFLEtBQUssQ0FBQyxFQUFFO2dDQUMxRCxRQUFRLENBQUMsT0FBTyxFQUFFLFFBQVEsRUFBRSxJQUFJLENBQUMsQ0FBQztnQ0FDbEMsS0FBSyxHQUFHLElBQUksQ0FBQzs2QkFDZDt5QkFDRjt3QkFFRCxJQUFJLHdCQUF3QixLQUFLLGNBQWM7NEJBQzNDLGtCQUFrQixLQUFLLDRCQUE0QixFQUFFOzRCQUN2RCxxQkFBcUIsQ0FBQyxPQUFPLEVBQUUsUUFBUSxFQUFFLGtCQUFrQixFQUFFLGNBQWMsQ0FBQyxDQUFDO3lCQUM5RTtxQkFDRjtvQkFFRCxRQUFRLGdCQUFxQixDQUFDO29CQUM5QixTQUFTLGNBQWMsQ0FBQztpQkFDekI7YUFDRjtZQUVELDBEQUEwRDtZQUMxRCxJQUFJLEtBQUssSUFBSSxJQUFJLEVBQUU7Z0JBQ2pCLHNCQUFzQixHQUFHLElBQUksQ0FBQztnQkFDOUIsaUJBQWlCLEVBQUUsQ0FBQztnQkFDcEIsSUFBTSxJQUFJLEdBQUcsa0JBQWtCLENBQUMsT0FBTyxFQUFFLGNBQWMsRUFBRSxpQkFBaUIsRUFBRSxTQUFTLENBQUM7aUNBQ2hFLENBQUM7Z0JBRXZCLElBQU0sY0FBYyxHQUFHLHFCQUFxQixDQUFDLENBQUM7b0JBQzFDLFFBQVEsQ0FBQyxDQUFDO29CQUNWLENBQUMseUJBQXlCLEdBQUcsc0JBQXNCLGVBQW9CLENBQUMsQ0FBQztnQkFDN0Usc0JBQXNCLENBQ2xCLE9BQU8sRUFBRSxjQUFjLEVBQUUsaUJBQWlCLEVBQUUsY0FBYyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsY0FBYyxFQUN2RixrQkFBa0IsQ0FBQyxDQUFDO2dCQUV4QixzQkFBc0IsRUFBRSxDQUFDO2dCQUN6QixNQUFNLGdCQUFxQixDQUFDO2dCQUM1QixRQUFRLGdCQUFxQixDQUFDO2dCQUU5QixLQUFLLEdBQUcsSUFBSSxDQUFDO2FBQ2Q7U0FDRjtLQUNGO0lBRUQsVUFBVTtJQUNWLGtGQUFrRjtJQUNsRiwwRUFBMEU7SUFDMUUsT0FBTyxRQUFRLEdBQUcsTUFBTSxFQUFFO1FBQ3hCLHNCQUFzQixHQUFHLElBQUksQ0FBQyxDQUFFLDBCQUEwQjtRQUMxRCxJQUFNLFFBQVEsR0FBRyxRQUFRLENBQUMsT0FBTyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBQzdDLElBQU0sT0FBTyxHQUFHLFdBQVcsQ0FBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFDL0MsSUFBTSxZQUFZLEdBQUcsMEJBQTBCLENBQUMsT0FBTyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBQ25FLElBQUksUUFBUSxJQUFJLElBQUksRUFBRTtZQUNwQixzQkFBc0IsR0FBRyxJQUFJLENBQUM7U0FDL0I7UUFDRCxJQUFJLGVBQWUsQ0FBQyxPQUFPLEVBQUUsUUFBUSxFQUFFLElBQUksQ0FBQyxFQUFFO1lBQzVDLFFBQVEsQ0FBQyxPQUFPLEVBQUUsUUFBUSxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ2xDLDBDQUEwQztZQUMxQyxJQUFJLHNCQUFzQixDQUFDLE9BQU8sRUFBRSxPQUFPLEVBQUUsUUFBUSxDQUFDLEVBQUU7Z0JBQ3RELFFBQVEsQ0FBQyxPQUFPLEVBQUUsUUFBUSxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUNsQyxLQUFLLEdBQUcsSUFBSSxDQUFDO2FBQ2Q7WUFDRCxxQkFBcUIsQ0FBQyxPQUFPLEVBQUUsUUFBUSxFQUFFLGtCQUFrQixFQUFFLGNBQWMsQ0FBQyxDQUFDO1NBQzlFO1FBQ0QsUUFBUSxnQkFBcUIsQ0FBQztLQUMvQjtJQUVELDhGQUE4RjtJQUM5RixpR0FBaUc7SUFDakcsa0dBQWtHO0lBQ2xHLDZGQUE2RjtJQUM3RixnR0FBZ0c7SUFDaEcsNENBQTRDO0lBQzVDLHNCQUFzQixHQUFHLHNCQUFzQixJQUFJLHdCQUF3QixLQUFLLGlCQUFpQixDQUFDO0lBQ2xHLG9CQUFvQixDQUNoQixPQUFPLEVBQUUsY0FBYyxFQUFFLGlCQUFpQixFQUFFLFVBQVUsRUFBRSx5QkFBeUIsRUFBRSxNQUFNLEVBQ3pGLGlCQUFpQixFQUFFLHNCQUFzQixDQUFDLENBQUM7SUFFL0MsSUFBSSxLQUFLLEVBQUU7UUFDVCxlQUFlLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQy9CLGlCQUFpQixDQUFDLE9BQU8sRUFBRSxjQUFjLEVBQUUsSUFBSSxDQUFDLENBQUM7S0FDbEQ7SUFFRCxPQUFPLHNCQUFzQixDQUFDO0FBQ2hDLENBQUM7QUFFRDs7Ozs7Ozs7Ozs7Ozs7R0FjRztBQUNILE1BQU0sVUFBVSxlQUFlLENBQzNCLE9BQXVCLEVBQUUsTUFBYyxFQUN2QyxLQUF1RCxFQUFFLFlBQWtCLEVBQzNFLGFBQXVCO0lBQ3pCLHdCQUF3QixDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxZQUFZLEVBQUUsYUFBYSxDQUFDLENBQUM7QUFDdEYsQ0FBQztBQUVEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBbUJHO0FBQ0gsTUFBTSxVQUFVLGVBQWUsQ0FDM0IsT0FBdUIsRUFBRSxNQUFjLEVBQ3ZDLEtBQXdFLEVBQUUsWUFBa0IsRUFDNUYsYUFBdUI7SUFDekIsd0JBQXdCLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLFlBQVksRUFBRSxhQUFhLENBQUMsQ0FBQztBQUN2RixDQUFDO0FBRUQsU0FBUyx3QkFBd0IsQ0FDN0IsT0FBdUIsRUFBRSxNQUFjLEVBQ3ZDLEtBQXdFLEVBQUUsWUFBcUIsRUFDL0YsWUFBaUIsRUFBRSxhQUF1QjtJQUM1QyxJQUFNLGNBQWMsR0FBRyw2QkFBNkIsQ0FBQyxPQUFPLEVBQUUsWUFBWSxJQUFJLElBQUksQ0FBQyxDQUFDO0lBQ3BGLElBQU0sV0FBVyxHQUFHLHVCQUF1QixDQUFDLE9BQU8sRUFBRSxjQUFjLEVBQUUsTUFBTSxFQUFFLFlBQVksQ0FBQyxDQUFDO0lBQzNGLElBQU0sU0FBUyxHQUFHLFFBQVEsQ0FBQyxPQUFPLEVBQUUsV0FBVyxDQUFDLENBQUM7SUFDakQsSUFBTSxRQUFRLEdBQUcsV0FBVyxDQUFDLE9BQU8sRUFBRSxXQUFXLENBQUMsQ0FBQztJQUNuRCxJQUFNLGFBQWEsR0FBRywwQkFBMEIsQ0FBQyxPQUFPLEVBQUUsV0FBVyxDQUFDLENBQUM7SUFDdkUsSUFBTSxLQUFLLEdBQXdCLENBQUMsS0FBSyxZQUFZLGtCQUFrQixDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQztJQUUvRixJQUFJLGVBQWUsQ0FBQyxRQUFRLEVBQUUsU0FBUyxFQUFFLEtBQUssQ0FBQztRQUMzQyxDQUFDLGFBQWEsSUFBSSxnQkFBZ0IsQ0FBQyxTQUFTLEVBQUUsS0FBSyxFQUFFLGFBQWEsRUFBRSxjQUFjLENBQUMsQ0FBQyxFQUFFO1FBQ3hGLElBQU0sY0FBWSxHQUFHLENBQUMsUUFBUSxnQkFBcUIsQ0FBQyxrQkFBdUIsQ0FBQztRQUM1RSxJQUFNLE9BQU8sR0FBRyxPQUFPLHlCQUE4QyxDQUFDO1FBQ3RFLElBQU0sYUFBYSxHQUFHLEtBQUssWUFBWSxrQkFBa0IsQ0FBQyxDQUFDO1lBQ3ZELElBQUksMEJBQTBCLENBQzFCLEtBQVksRUFBRSxPQUFPLEVBQUUsY0FBWSxDQUFDLENBQUMsZUFBbUIsQ0FBQyxjQUFrQixDQUFDLENBQUMsQ0FBQztZQUNsRixJQUFJLENBQUM7UUFDVCxJQUFNLE9BQUssR0FBRyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUUsS0FBaUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FDN0QsQ0FBQztRQUNuQixJQUFNLGVBQWUsR0FBRyxxQkFBcUIsQ0FBQyxPQUFPLEVBQUUsV0FBVyxDQUFDLENBQUM7UUFFcEUsSUFBSSxzQkFBc0IsR0FBRyxLQUFLLENBQUM7UUFDbkMsSUFBSSxrQkFBa0IsR0FBRyxhQUFhLENBQUMsQ0FBQyxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzdELElBQUksdUJBQXVCLENBQUMsT0FBTyxFQUFFLGFBQWEsRUFBRSxlQUFlLENBQUMsRUFBRTtZQUNwRSxJQUFNLFFBQVEsR0FBRyxnQkFBZ0IsQ0FBQyxPQUFPLEVBQUUsYUFBYSxFQUFFLGVBQWUsQ0FBQyxDQUFDO1lBQzNFLGtCQUFrQixHQUFHLGFBQWEsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDbEQsc0JBQXNCLEdBQUcsSUFBSSxDQUFDO1NBQy9CO1FBRUQsSUFBSSxzQkFBc0IsSUFBSSxhQUFhLEtBQUssY0FBYyxFQUFFO1lBQzlELHFCQUFxQixDQUFDLE9BQU8sRUFBRSxXQUFXLEVBQUUsa0JBQWtCLEVBQUUsY0FBYyxDQUFDLENBQUM7U0FDakY7UUFFRCxJQUFJLGFBQWEsS0FBSyxjQUFjLEVBQUU7WUFDcEMsSUFBTSxJQUFJLEdBQUcsT0FBTyxDQUFDLE9BQU8sRUFBRSxXQUFXLENBQUMsQ0FBQztZQUMzQyxJQUFNLFNBQVMsR0FBRyxpQkFBaUIsQ0FBQyxPQUFPLEVBQUUsY0FBYyxDQUFDLENBQUM7WUFDN0QsZUFBZSxDQUFDLE9BQU8sRUFBRSxXQUFXLEVBQUUsQ0FBQyxTQUFTLElBQUksU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUM7U0FDdEY7UUFFRCx3RUFBd0U7UUFDeEUsUUFBUSxDQUFDLE9BQU8sRUFBRSxXQUFXLEVBQUUsT0FBSyxDQUFDLENBQUM7UUFDdEMsSUFBTSxhQUFhLEdBQUcscUJBQXFCLENBQUMsUUFBUSxDQUFDLENBQUM7UUFFdEQsb0ZBQW9GO1FBQ3BGLElBQU0sYUFBYSxHQUFHLFFBQVEsQ0FBQyxPQUFPLEVBQUUsYUFBYSxDQUFDLENBQUM7UUFDdkQsSUFBSSxDQUFDLGFBQWEsSUFBSSxlQUFlLENBQUMsUUFBUSxFQUFFLGFBQWEsRUFBRSxPQUFLLENBQUMsRUFBRTtZQUNyRSxJQUFJLFVBQVUsR0FBRyxLQUFLLENBQUM7WUFDdkIsSUFBSSxXQUFXLEdBQUcsSUFBSSxDQUFDO1lBRXZCLDBFQUEwRTtZQUMxRSxJQUFJLENBQUMsV0FBVyxDQUFDLE9BQUssRUFBRSxjQUFZLENBQUMsSUFBSSxXQUFXLENBQUMsYUFBYSxFQUFFLGNBQVksQ0FBQyxFQUFFO2dCQUNqRixVQUFVLEdBQUcsSUFBSSxDQUFDO2dCQUNsQixXQUFXLEdBQUcsS0FBSyxDQUFDO2FBQ3JCO1lBRUQsUUFBUSxDQUFDLE9BQU8sRUFBRSxhQUFhLEVBQUUsVUFBVSxDQUFDLENBQUM7WUFDN0MsUUFBUSxDQUFDLE9BQU8sRUFBRSxXQUFXLEVBQUUsV0FBVyxDQUFDLENBQUM7WUFDNUMsaUJBQWlCLENBQUMsT0FBTyxFQUFFLGNBQWMsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUNqRCxlQUFlLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDO1NBQ2hDO1FBRUQsSUFBSSxzQkFBc0IsRUFBRTtZQUMxQixzQkFBc0IsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUM7U0FDdkM7S0FDRjtBQUNILENBQUM7QUFHRDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBcUJHO0FBQ0gsTUFBTSxVQUFVLGFBQWEsQ0FDekIsT0FBdUIsRUFBRSxRQUFtQixFQUFFLFVBQStCLEVBQzdFLGFBQXNCLEVBQUUsWUFBa0MsRUFBRSxXQUFpQyxFQUM3RixZQUFrQjtJQUNwQixJQUFJLGtCQUFrQixHQUFHLENBQUMsQ0FBQztJQUMzQixJQUFNLG9CQUFvQixHQUFHLDZCQUE2QixDQUFDLE9BQU8sRUFBRSxZQUFZLElBQUksSUFBSSxDQUFDLENBQUM7SUFFMUYsSUFBSSxjQUFjLENBQUMsT0FBTyxDQUFDLElBQUksZ0JBQWdCLENBQUMsT0FBTyxFQUFFLG9CQUFvQixDQUFDLEVBQUU7UUFDOUUsSUFBTSxtQkFBbUIsR0FDckIsT0FBTyw0QkFBaUMsOEJBQW1DLENBQUM7UUFDaEYsSUFBTSxNQUFNLEdBQUcsT0FBTyx5QkFBZ0MsQ0FBQztRQUN2RCxJQUFNLGVBQWUsR0FBRyx3QkFBd0IsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUUxRCxJQUFJLFVBQVUsR0FBRyxLQUFLLENBQUM7UUFDdkIsS0FBSyxJQUFJLENBQUMsb0NBQXlDLEVBQUUsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxNQUFNLEVBQ2xFLENBQUMsZ0JBQXFCLEVBQUU7WUFDM0Isd0VBQXdFO1lBQ3hFLElBQUksT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsRUFBRTtnQkFDdkIsSUFBTSxJQUFJLEdBQUcsV0FBVyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDckMsSUFBTSxjQUFjLEdBQUcsMEJBQTBCLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUM5RCxJQUFJLG9CQUFvQixLQUFLLGNBQWMsRUFBRTtvQkFDM0MsVUFBVSxHQUFHLElBQUksQ0FBQztvQkFDbEIsU0FBUztpQkFDVjtnQkFFRCxJQUFNLElBQUksR0FBRyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUNqQyxJQUFNLEtBQUssR0FBRyxRQUFRLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUNuQyxJQUFNLGNBQWMsR0FDaEIsQ0FBQyxJQUFJLG1CQUF3QixDQUFDLENBQUMsQ0FBQyxDQUFDLGlCQUFpQixDQUFDLE9BQU8sRUFBRSxjQUFjLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO2dCQUN2RixJQUFNLGFBQWEsR0FBRyxnQkFBZ0IsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQ25ELElBQU0sWUFBWSxHQUFHLElBQUksZ0JBQXFCLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDO2dCQUM5RCxJQUFNLGdCQUFnQixHQUFHLENBQUMsR0FBRyxlQUFlLENBQUM7Z0JBRTdDLElBQUksWUFBWSxHQUF3QixLQUFLLENBQUM7Z0JBRTlDLHVFQUF1RTtnQkFDdkUsNERBQTREO2dCQUM1RCwyREFBMkQ7Z0JBQzNELElBQUksZ0JBQWdCLElBQUksQ0FBQyxXQUFXLENBQUMsWUFBWSxFQUFFLFlBQVksQ0FBQyxFQUFFO29CQUNoRSx5REFBeUQ7b0JBQ3pELElBQU0sVUFBVSxHQUFHLHFCQUFxQixDQUFDLElBQUksQ0FBQyxDQUFDO29CQUMvQyxZQUFZLEdBQUcsUUFBUSxDQUFDLE9BQU8sRUFBRSxVQUFVLENBQUMsQ0FBQztpQkFDOUM7Z0JBRUQseUVBQXlFO2dCQUN6RSxxREFBcUQ7Z0JBQ3JELCtEQUErRDtnQkFDL0Qsc0VBQXNFO2dCQUN0RSx3RUFBd0U7Z0JBQ3hFLDZFQUE2RTtnQkFDN0UsK0VBQStFO2dCQUMvRSwrRUFBK0U7Z0JBQy9FLElBQUksQ0FBQyxXQUFXLENBQUMsWUFBWSxFQUFFLFlBQVksQ0FBQyxFQUFFO29CQUM1QyxZQUFZLEdBQUcsZUFBZSxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQztpQkFDL0M7Z0JBRUQsMEVBQTBFO2dCQUMxRSx3RUFBd0U7Z0JBQ3hFLHlFQUF5RTtnQkFDekUscUJBQXFCO2dCQUNyQixJQUFNLFlBQVksR0FBRyxhQUFhLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO2dCQUN6RCxJQUFJLFlBQVksRUFBRTtvQkFDaEIsSUFBSSxZQUFZLEVBQUU7d0JBQ2hCLFFBQVEsQ0FDSixNQUFNLEVBQUUsSUFBSSxFQUFFLFlBQVksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxLQUFLLEVBQUUsUUFBUSxFQUFFLFlBQVksRUFBRSxhQUFhLENBQUMsQ0FBQztxQkFDdkY7eUJBQU07d0JBQ0wsUUFBUSxDQUNKLE1BQU0sRUFBRSxJQUFJLEVBQUUsWUFBNkIsRUFBRSxRQUFRLEVBQUUsY0FBYyxFQUFFLFdBQVcsRUFDbEYsYUFBYSxDQUFDLENBQUM7cUJBQ3BCO2lCQUNGO2dCQUVELFFBQVEsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO2FBQzdCO1NBQ0Y7UUFFRCxJQUFJLG1CQUFtQixFQUFFO1lBQ3ZCLElBQU0sV0FBVyxHQUNiLEtBQUssQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBeUIsQ0FBQztZQUN2RixJQUFNLGFBQWEsR0FBRyxnQkFBZ0IsQ0FBQyxPQUFPLENBQUcsQ0FBQztZQUNsRCxJQUFNLGlCQUFpQixHQUFHLGFBQWEsZ0NBQW9DLENBQUM7WUFDNUUsS0FBSyxJQUFJLENBQUMsc0NBQTBDLEVBQUUsQ0FBQyxHQUFHLGlCQUFpQixFQUN0RSxDQUFDLDRDQUFnRCxFQUFFO2dCQUN0RCxJQUFNLE9BQU8sR0FBRyxhQUFhLENBQUMsQ0FBQyxDQUEwQyxDQUFDO2dCQUMxRSxJQUFNLG9CQUFvQixHQUFHLENBQUMsK0JBQW1DLENBQUM7Z0JBQ2xFLElBQU0sU0FBUyxHQUFHLGFBQWEsQ0FBQyxvQkFBb0IsQ0FBa0IsQ0FBQztnQkFDdkUsSUFBSSxPQUFPLEVBQUU7b0JBQ1gsSUFBTSxNQUFNLEdBQUcsT0FBTyxDQUFDLFdBQVcsQ0FBQyxTQUFTLEVBQUUsYUFBYSxDQUFDLENBQUM7b0JBQzdELElBQUksTUFBTSxLQUFLLFNBQVMsRUFBRTt3QkFDeEIsSUFBSSxNQUFNLElBQUksSUFBSSxFQUFFOzRCQUNsQixJQUFNLFNBQVMsR0FBRyxpQkFBaUIsQ0FDL0IsYUFBYSxFQUFFLFdBQVcsRUFBRSxNQUFxQixFQUFFLE1BQU0sRUFBRSxvQkFBb0IsQ0FBQyxDQUFDOzRCQUNyRixTQUFTLElBQUksa0JBQWtCLEVBQUUsQ0FBQzt5QkFDbkM7d0JBQ0QsSUFBSSxTQUFTLEVBQUU7NEJBQ2IsU0FBUyxDQUFDLE9BQU8sRUFBRSxDQUFDO3lCQUNyQjtxQkFDRjtpQkFDRjtxQkFBTSxJQUFJLFNBQVMsRUFBRTtvQkFDcEIsb0ZBQW9GO29CQUNwRixTQUFTO29CQUNULFNBQVMsQ0FBQyxPQUFPLEVBQUUsQ0FBQztpQkFDckI7YUFDRjtZQUNELHNCQUFzQixDQUFDLE9BQU8sRUFBRSxLQUFLLENBQUMsQ0FBQztTQUN4QztRQUVELGlCQUFpQixDQUFDLE9BQU8sRUFBRSxvQkFBb0IsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUN4RCxlQUFlLENBQUMsT0FBTyxFQUFFLFVBQVUsQ0FBQyxDQUFDO0tBQ3RDO0lBRUQsT0FBTyxrQkFBa0IsQ0FBQztBQUM1QixDQUFDO0FBRUQ7Ozs7Ozs7Ozs7Ozs7R0FhRztBQUNILE1BQU0sVUFBVSxRQUFRLENBQ3BCLE1BQVcsRUFBRSxJQUFZLEVBQUUsS0FBb0IsRUFBRSxRQUFtQixFQUNwRSxTQUFpQyxFQUFFLEtBQTJCLEVBQzlELGFBQXFEO0lBQ3ZELEtBQUssR0FBRyxTQUFTLElBQUksS0FBSyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUM7SUFDNUQsSUFBSSxLQUFLLElBQUksYUFBYSxFQUFFO1FBQzFCLElBQUksS0FBSyxFQUFFO1lBQ1QsS0FBSyxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7U0FDN0I7UUFDRCxJQUFJLGFBQWEsRUFBRTtZQUNqQixhQUFhLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQztTQUNyQztLQUNGO1NBQU0sSUFBSSxLQUFLLEVBQUU7UUFDaEIsS0FBSyxHQUFHLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFFLG9FQUFvRTtRQUMvRixvQkFBb0I7UUFDcEIsU0FBUyxJQUFJLFNBQVMsQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO1FBQzFDLG9CQUFvQixDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7WUFDNUIsUUFBUSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxtQkFBbUIsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO1lBQ3RFLE1BQU0sQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQztLQUMzQztTQUFNO1FBQ0wsU0FBUyxJQUFJLFNBQVMsQ0FBQyxtQkFBbUIsRUFBRSxDQUFDO1FBQzdDLG9CQUFvQixDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7WUFDNUIsUUFBUSxDQUFDLFdBQVcsQ0FBQyxNQUFNLEVBQUUsSUFBSSxFQUFFLG1CQUFtQixDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7WUFDbEUsTUFBTSxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLENBQUM7S0FDdkM7QUFDSCxDQUFDO0FBRUQ7Ozs7Ozs7Ozs7Ozs7R0FhRztBQUNILFNBQVMsUUFBUSxDQUNiLE1BQVcsRUFBRSxTQUFpQixFQUFFLEdBQVksRUFBRSxRQUFtQixFQUFFLEtBQTJCLEVBQzlGLGFBQXFEO0lBQ3ZELElBQUksS0FBSyxJQUFJLGFBQWEsRUFBRTtRQUMxQixJQUFJLEtBQUssRUFBRTtZQUNULEtBQUssQ0FBQyxRQUFRLENBQUMsU0FBUyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1NBQ2hDO1FBQ0QsSUFBSSxhQUFhLEVBQUU7WUFDakIsYUFBYSxDQUFDLFFBQVEsQ0FBQyxTQUFTLEVBQUUsR0FBRyxDQUFDLENBQUM7U0FDeEM7UUFDRCxzRUFBc0U7S0FDdkU7U0FBTSxJQUFJLFNBQVMsS0FBSyxFQUFFLEVBQUU7UUFDM0IsSUFBSSxHQUFHLEVBQUU7WUFDUCxTQUFTLElBQUksU0FBUyxDQUFDLGdCQUFnQixFQUFFLENBQUM7WUFDMUMsb0JBQW9CLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3RDLE1BQU0sQ0FBQyxXQUFXLENBQUMsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUM7U0FDckU7YUFBTTtZQUNMLFNBQVMsSUFBSSxTQUFTLENBQUMsbUJBQW1CLEVBQUUsQ0FBQztZQUM3QyxvQkFBb0IsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxNQUFNLEVBQUUsU0FBUyxDQUFDLENBQUMsQ0FBQztnQkFDekMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQztTQUN4RTtLQUNGO0FBQ0gsQ0FBQztBQUVELFNBQVMsZUFBZSxDQUFDLE9BQXVCLEVBQUUsS0FBYSxFQUFFLFdBQW9CO0lBQ25GLElBQUksV0FBVyxFQUFFO1FBQ2QsT0FBTyxDQUFDLEtBQUssQ0FBWSxvQkFBeUIsQ0FBQztLQUNyRDtTQUFNO1FBQ0osT0FBTyxDQUFDLEtBQUssQ0FBWSxJQUFJLGlCQUFzQixDQUFDO0tBQ3REO0FBQ0gsQ0FBQztBQUVELFNBQVMsUUFBUSxDQUFDLE9BQXVCLEVBQUUsS0FBYSxFQUFFLFVBQW1CO0lBQzNFLElBQU0sYUFBYSxHQUNmLEtBQUsscUNBQTBDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxzQkFBMkIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUM7SUFDakcsSUFBSSxVQUFVLEVBQUU7UUFDYixPQUFPLENBQUMsYUFBYSxDQUFZLGlCQUFzQixDQUFDO0tBQzFEO1NBQU07UUFDSixPQUFPLENBQUMsYUFBYSxDQUFZLElBQUksY0FBbUIsQ0FBQztLQUMzRDtBQUNILENBQUM7QUFFRCxTQUFTLE9BQU8sQ0FBQyxPQUF1QixFQUFFLEtBQWE7SUFDckQsSUFBTSxhQUFhLEdBQ2YsS0FBSyxxQ0FBMEMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLHNCQUEyQixDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQztJQUNqRyxPQUFPLENBQUUsT0FBTyxDQUFDLGFBQWEsQ0FBWSxnQkFBcUIsQ0FBQyxpQkFBc0IsQ0FBQztBQUN6RixDQUFDO0FBRUQsTUFBTSxVQUFVLGlCQUFpQixDQUFDLE9BQXVCLEVBQUUsS0FBYTtJQUN0RSxJQUFNLGFBQWEsR0FDZixLQUFLLHFDQUEwQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssc0JBQTJCLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDO0lBQ2pHLE9BQU8sQ0FBRSxPQUFPLENBQUMsYUFBYSxDQUFZLGdCQUFxQixDQUFDLGlCQUFzQixDQUFDO0FBQ3pGLENBQUM7QUFFRCxTQUFTLGFBQWEsQ0FBQyxPQUF1QixFQUFFLEtBQWE7SUFDM0QsSUFBTSxhQUFhLEdBQ2YsS0FBSyxxQ0FBMEMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLHNCQUEyQixDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQztJQUNqRyxPQUFPLENBQUUsT0FBTyxDQUFDLGFBQWEsQ0FBWSxtQkFBd0IsQ0FBQyxvQkFBeUIsQ0FBQztBQUMvRixDQUFDO0FBRUQsU0FBUyxRQUFRLENBQUMsVUFBa0IsRUFBRSxXQUFtQixFQUFFLFlBQW9CO0lBQzdFLE9BQU8sQ0FBQyxVQUFVLG1CQUF1QixDQUFDLEdBQUcsQ0FBQyxXQUFXLHdCQUE2QixDQUFDO1FBQ25GLENBQUMsWUFBWSxJQUFJLENBQUMsNENBQXFELENBQUMsQ0FBQyxDQUFDO0FBQ2hGLENBQUM7QUFFRCxTQUFTLGVBQWUsQ0FBQyxPQUF1QixFQUFFLElBQVk7SUFDNUQsSUFBTSxLQUFLLEdBQUcsZUFBZSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3BDLElBQU0saUJBQWlCLEdBQUcsSUFBSSxnQkFBcUIsQ0FBQztJQUNwRCxJQUFNLGFBQWEsR0FBRyxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsT0FBTyxvQ0FBeUMsQ0FBQyxDQUFDO1FBQ2xELE9BQU8sb0NBQXlDLENBQUM7SUFDM0YsT0FBTyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDOUIsQ0FBQztBQUVELFNBQVMsZUFBZSxDQUFDLElBQVk7SUFDbkMsT0FBTyxDQUFDLElBQUksd0JBQTZCLENBQUMsc0JBQXVCLENBQUM7QUFDcEUsQ0FBQztBQUVELFNBQVMscUJBQXFCLENBQUMsSUFBWTtJQUN6QyxJQUFNLEtBQUssR0FDUCxDQUFDLElBQUksSUFBSSxDQUFDLDRDQUFxRCxDQUFDLENBQUMsc0JBQXVCLENBQUM7SUFDN0YsT0FBTyxLQUFLLHFDQUEwQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3RFLENBQUM7QUFFRCxTQUFTLGtCQUFrQixDQUFDLE9BQXVCO0lBQ2pELE9BQU8scUJBQXFCLENBQUMsT0FBTyw0QkFBaUMsQ0FBVyxDQUFDO0FBQ25GLENBQUM7QUFFRCxTQUFTLHlCQUF5QixDQUFDLE9BQXVCO0lBQ3hELElBQU0sVUFBVSxHQUFHLE9BQU8sNEJBQWlDLENBQUM7SUFDNUQsT0FBTyxVQUFVLENBQ1o7bUNBQzZDLENBQUMsQ0FBQztBQUN0RCxDQUFDO0FBRUQsU0FBUyx3QkFBd0IsQ0FBQyxPQUF1QjtJQUN2RCxJQUFNLFdBQVcsR0FBRyxPQUFPLDJCQUFnQyxDQUFDO0lBQzVELE9BQU8sV0FBVyxDQUNiO21DQUM2QyxDQUFDLENBQUM7QUFDdEQsQ0FBQztBQUVELFNBQVMsT0FBTyxDQUFDLE9BQXVCLEVBQUUsS0FBYSxFQUFFLElBQVk7SUFDbkUsT0FBTyxDQUFDLEtBQUsseUJBQThCLENBQUMsR0FBRyxJQUFJLENBQUM7QUFDdEQsQ0FBQztBQUVELFNBQVMsUUFBUSxDQUFDLE9BQXVCLEVBQUUsS0FBYSxFQUFFLEtBQThCO0lBQ3RGLE9BQU8sQ0FBQyxLQUFLLHNCQUEyQixDQUFDLEdBQUcsS0FBSyxDQUFDO0FBQ3BELENBQUM7QUFFRCxTQUFTLHVCQUF1QixDQUM1QixPQUF1QixFQUFFLE9BQThDLEVBQUUsS0FBYTtJQUN4RixJQUFNLGFBQWEsR0FBRyxPQUFPLHVCQUE4QixDQUFDO0lBQzVELElBQUksT0FBTyxFQUFFO1FBQ1gsSUFBSSxDQUFDLGFBQWEsSUFBSSxLQUFLLEtBQUssQ0FBQyxFQUFFO1lBQ2pDLE9BQU8sSUFBSSxDQUFDO1NBQ2I7S0FDRjtTQUFNLElBQUksQ0FBQyxhQUFhLEVBQUU7UUFDekIsT0FBTyxLQUFLLENBQUM7S0FDZDtJQUNELE9BQU8sYUFBYSxDQUFDLEtBQUssQ0FBQyxLQUFLLE9BQU8sQ0FBQztBQUMxQyxDQUFDO0FBRUQsU0FBUyxnQkFBZ0IsQ0FDckIsT0FBdUIsRUFBRSxPQUE4QyxFQUN2RSxjQUFzQjtJQUN4QixJQUFJLGFBQWEsR0FBRyxPQUFPLHVCQUE0QixJQUFJLGtCQUFrQixDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQ3ZGLElBQUksY0FBYyxHQUFHLENBQUMsRUFBRTtRQUN0QixhQUFhLENBQUMsY0FBYyxDQUFDLEdBQUcsT0FBTyxDQUFDO0tBQ3pDO1NBQU07UUFDTCxjQUFjLEdBQUcsYUFBYSxnQ0FBb0MsQ0FBQztRQUNuRSxhQUFhLENBQUMsTUFBTSxDQUFDLGNBQWMsRUFBRSxDQUFDLEVBQUUsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ3ZELGFBQWEsZ0NBQW9DO29EQUNELENBQUM7S0FDbEQ7SUFDRCxPQUFPLGNBQWMsQ0FBQztBQUN4QixDQUFDO0FBRUQsTUFBTSxVQUFVLHNCQUFzQixDQUFDLGNBQXNCLEVBQUUsV0FBbUI7SUFDaEYsT0FBTyxDQUFDLFdBQVcseUJBQW9ELENBQUMsR0FBRyxjQUFjLENBQUM7QUFDNUYsQ0FBQztBQUVELFNBQVMscUJBQXFCLENBQzFCLE9BQXVCLEVBQUUsS0FBYSxFQUFFLGtCQUEwQixFQUFFLGNBQXNCO0lBQzVGLElBQU0sS0FBSyxHQUFHLHNCQUFzQixDQUFDLGNBQWMsRUFBRSxrQkFBa0IsQ0FBQyxDQUFDO0lBQ3pFLE9BQU8sQ0FBQyxLQUFLLG1DQUF3QyxDQUFDLEdBQUcsS0FBSyxDQUFDO0FBQ2pFLENBQUM7QUFFRCxTQUFTLHFCQUFxQixDQUFDLE9BQXVCLEVBQUUsS0FBYTtJQUNuRSxJQUFNLElBQUksR0FBRyxPQUFPLENBQUMsS0FBSyxtQ0FBd0MsQ0FBVyxDQUFDO0lBQzlFLElBQU0sa0JBQWtCLEdBQUcsQ0FBQyxJQUFJLHlCQUFvRCxDQUFDOzJCQUN0QyxDQUFDO0lBQ2hELE9BQU8sa0JBQWtCLENBQUM7QUFDNUIsQ0FBQztBQUVELFNBQVMsZ0JBQWdCLENBQUMsT0FBdUIsRUFBRSxLQUFhO0lBRTlELElBQU0sa0JBQWtCLEdBQUcscUJBQXFCLENBQUMsT0FBTyxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQ2pFLElBQUksa0JBQWtCLEVBQUU7UUFDdEIsSUFBTSxhQUFhLEdBQUcsT0FBTyx1QkFBNEIsQ0FBQztRQUMxRCxJQUFJLGFBQWEsRUFBRTtZQUNqQixPQUFPLGFBQWEsQ0FBQyxrQkFBa0IsQ0FBMEMsQ0FBQztTQUNuRjtLQUNGO0lBQ0QsT0FBTyxJQUFJLENBQUM7QUFDZCxDQUFDO0FBRUQsU0FBUyxPQUFPLENBQUMsT0FBdUIsRUFBRSxLQUFhLEVBQUUsSUFBWTtJQUNuRSxJQUFNLGFBQWEsR0FDZixLQUFLLCtCQUFvQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxzQkFBMkIsQ0FBQyxDQUFDO0lBQzNGLE9BQU8sQ0FBQyxhQUFhLENBQUMsR0FBRyxJQUFJLENBQUM7QUFDaEMsQ0FBQztBQUVELFNBQVMsV0FBVyxDQUFDLE9BQXVCLEVBQUUsS0FBYTtJQUN6RCxJQUFNLGFBQWEsR0FDZixLQUFLLCtCQUFvQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxzQkFBMkIsQ0FBQyxDQUFDO0lBQzNGLE9BQU8sT0FBTyxDQUFDLGFBQWEsQ0FBVyxDQUFDO0FBQzFDLENBQUM7QUFFRCxNQUFNLFVBQVUsUUFBUSxDQUFDLE9BQXVCLEVBQUUsS0FBYTtJQUM3RCxPQUFPLE9BQU8sQ0FBQyxLQUFLLHNCQUEyQixDQUE0QixDQUFDO0FBQzlFLENBQUM7QUFFRCxNQUFNLFVBQVUsT0FBTyxDQUFDLE9BQXVCLEVBQUUsS0FBYTtJQUM1RCxPQUFPLE9BQU8sQ0FBQyxLQUFLLHlCQUE4QixDQUFXLENBQUM7QUFDaEUsQ0FBQztBQUVELE1BQU0sVUFBVSxjQUFjLENBQUMsT0FBdUI7SUFDcEQsT0FBTyxPQUFPLENBQUMsT0FBTyw2QkFBa0MsQ0FBQztBQUMzRCxDQUFDO0FBRUQsTUFBTSxVQUFVLGVBQWUsQ0FBQyxPQUF1QixFQUFFLFVBQW1CO0lBQzFFLFFBQVEsQ0FBQyxPQUFPLDhCQUFtQyxVQUFVLENBQUMsQ0FBQztBQUNqRSxDQUFDO0FBRUQsTUFBTSxVQUFVLHNCQUFzQixDQUFDLE9BQXVCLEVBQUUsVUFBbUI7SUFDakYsSUFBSSxVQUFVLEVBQUU7UUFDYixPQUFPLDRCQUE0QywrQkFBb0MsQ0FBQztLQUMxRjtTQUFNO1FBQ0osT0FBTyw0QkFBNEMsSUFBSSw0QkFBaUMsQ0FBQztLQUMzRjtBQUNILENBQUM7QUFFRCxTQUFTLHVCQUF1QixDQUFDLE9BQXVCLEVBQUUsTUFBYyxFQUFFLE1BQWM7SUFDdEYsSUFBSSxNQUFNLEtBQUssTUFBTTtRQUFFLE9BQU87SUFFOUIsSUFBTSxRQUFRLEdBQUcsUUFBUSxDQUFDLE9BQU8sRUFBRSxNQUFNLENBQUMsQ0FBQztJQUMzQyxJQUFNLE9BQU8sR0FBRyxPQUFPLENBQUMsT0FBTyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0lBQ3pDLElBQU0sT0FBTyxHQUFHLFdBQVcsQ0FBQyxPQUFPLEVBQUUsTUFBTSxDQUFDLENBQUM7SUFDN0MsSUFBTSxxQkFBcUIsR0FBRyxxQkFBcUIsQ0FBQyxPQUFPLEVBQUUsTUFBTSxDQUFDLENBQUM7SUFDckUsSUFBTSxpQkFBaUIsR0FBRywwQkFBMEIsQ0FBQyxPQUFPLEVBQUUsTUFBTSxDQUFDLENBQUM7SUFFdEUsSUFBSSxLQUFLLEdBQUcsT0FBTyxDQUFDO0lBQ3BCLElBQUksS0FBSyxHQUFHLFdBQVcsQ0FBQyxPQUFPLEVBQUUsTUFBTSxDQUFDLENBQUM7SUFFekMsSUFBTSxZQUFZLEdBQUcscUJBQXFCLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDbEQsSUFBSSxZQUFZLElBQUksQ0FBQyxFQUFFO1FBQ3JCLElBQU0sS0FBSyxHQUFHLFdBQVcsQ0FBQyxPQUFPLEVBQUUsWUFBWSxDQUFDLENBQUM7UUFDakQsSUFBTSxRQUFRLEdBQUcsZUFBZSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3hDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsWUFBWSxFQUFFLFFBQVEsQ0FBQyxLQUFLLEVBQUUsUUFBUSxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUM7S0FDbkU7SUFFRCxJQUFNLFlBQVksR0FBRyxxQkFBcUIsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUNsRCxJQUFJLFlBQVksSUFBSSxDQUFDLEVBQUU7UUFDckIsSUFBTSxLQUFLLEdBQUcsV0FBVyxDQUFDLE9BQU8sRUFBRSxZQUFZLENBQUMsQ0FBQztRQUNqRCxJQUFNLFFBQVEsR0FBRyxlQUFlLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDeEMsT0FBTyxDQUFDLE9BQU8sRUFBRSxZQUFZLEVBQUUsUUFBUSxDQUFDLEtBQUssRUFBRSxRQUFRLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQztLQUNuRTtJQUVELFFBQVEsQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLFFBQVEsQ0FBQyxPQUFPLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQztJQUNyRCxPQUFPLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxPQUFPLENBQUMsT0FBTyxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUM7SUFDbkQsT0FBTyxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsV0FBVyxDQUFDLE9BQU8sRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDO0lBQ3ZELElBQU0sWUFBWSxHQUFHLHFCQUFxQixDQUFDLE9BQU8sRUFBRSxNQUFNLENBQUMsQ0FBQztJQUM1RCxJQUFNLGVBQWUsR0FBRywwQkFBMEIsQ0FBQyxPQUFPLEVBQUUsTUFBTSxDQUFDLENBQUM7SUFDcEUscUJBQXFCLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxZQUFZLEVBQUUsZUFBZSxDQUFDLENBQUM7SUFFdEUsUUFBUSxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsUUFBUSxDQUFDLENBQUM7SUFDcEMsT0FBTyxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsT0FBTyxDQUFDLENBQUM7SUFDbEMsT0FBTyxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsT0FBTyxDQUFDLENBQUM7SUFDbEMscUJBQXFCLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxxQkFBcUIsRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO0FBQ25GLENBQUM7QUFFRCxTQUFTLHlCQUF5QixDQUFDLE9BQXVCLEVBQUUsa0JBQTBCO0lBQ3BGLEtBQUssSUFBSSxDQUFDLEdBQUcsa0JBQWtCLEVBQUUsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxnQkFBcUIsRUFBRTtRQUMzRSxJQUFNLFNBQVMsR0FBRyxXQUFXLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQzFDLElBQU0sV0FBVyxHQUFHLHFCQUFxQixDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQ3JELElBQUksV0FBVyxHQUFHLENBQUMsRUFBRTtZQUNuQixJQUFNLFVBQVUsR0FBRyxXQUFXLENBQUMsT0FBTyxFQUFFLFdBQVcsQ0FBQyxDQUFDO1lBQ3JELElBQU0scUJBQXFCLEdBQUcsZUFBZSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQzFELElBQU0sU0FBUyxHQUFHLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxXQUFXLENBQUMsQ0FBQyxDQUFDLGVBQW9CLENBQUMsYUFBa0IsQ0FBQztnQkFDdEYsQ0FBQyxpQkFBaUIsQ0FBQyxPQUFPLEVBQUUsV0FBVyxDQUFDLENBQUMsQ0FBQyxlQUFvQixDQUFDLGFBQWtCLENBQUM7Z0JBQ2xGLENBQUMsYUFBYSxDQUFDLE9BQU8sRUFBRSxXQUFXLENBQUMsQ0FBQyxDQUFDLGtCQUF1QixDQUFDLGFBQWtCLENBQUMsQ0FBQztZQUN0RixJQUFNLFdBQVcsR0FBRyxRQUFRLENBQUMsU0FBUyxFQUFFLHFCQUFxQixFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2xFLE9BQU8sQ0FBQyxPQUFPLEVBQUUsV0FBVyxFQUFFLFdBQVcsQ0FBQyxDQUFDO1NBQzVDO0tBQ0Y7QUFDSCxDQUFDO0FBRUQsU0FBUyxzQkFBc0IsQ0FDM0IsT0FBdUIsRUFBRSxLQUFhLEVBQUUsVUFBbUIsRUFBRSxJQUFZLEVBQUUsSUFBWSxFQUN2RixLQUF1QixFQUFFLGNBQXNCLEVBQUUsV0FBbUI7SUFDdEUsSUFBTSxPQUFPLEdBQUcsS0FBSyxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUM7SUFFdkMsNkNBQTZDO0lBQzdDLE9BQU8sQ0FBQyxNQUFNLENBQ1YsS0FBSyxFQUFFLENBQUMsRUFBRSxJQUFJLGdCQUFxQixHQUFHLENBQUMsVUFBVSxDQUFDLENBQUMsZUFBb0IsQ0FBQyxhQUFrQixDQUFDLEVBQzNGLElBQUksRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFDcEIscUJBQXFCLENBQUMsT0FBTyxFQUFFLEtBQUssRUFBRSxXQUFXLEVBQUUsY0FBYyxDQUFDLENBQUM7SUFFbkUsSUFBSSxPQUFPLEVBQUU7UUFDWCwrREFBK0Q7UUFDL0QsNERBQTREO1FBQzVELGtEQUFrRDtRQUNsRCx5QkFBeUIsQ0FBQyxPQUFPLEVBQUUsS0FBSyxlQUFvQixDQUFDLENBQUM7S0FDL0Q7QUFDSCxDQUFDO0FBRUQsU0FBUyxXQUFXLENBQUMsS0FBOEIsRUFBRSxZQUFzQjtJQUN6RSxPQUFPLEtBQUssS0FBSyxJQUFJLENBQUM7QUFDeEIsQ0FBQztBQUVELFNBQVMsa0JBQWtCLENBQ3ZCLE9BQXVCLEVBQUUsSUFBWSxFQUFFLGlCQUEwQixFQUNqRSxTQUFrQztJQUNwQyxJQUFJLElBQUksR0FBRyxDQUFDLFNBQVMsSUFBSSxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLGtCQUF1QixDQUFDLGFBQWtCLENBQUM7SUFFdEYsSUFBSSxZQUFvQixDQUFDO0lBQ3pCLElBQUksaUJBQWlCLEVBQUU7UUFDckIsSUFBSSxpQkFBc0IsQ0FBQztRQUMzQixZQUFZO1lBQ1IsOEJBQThCLENBQUMsT0FBTyxvQ0FBeUMsRUFBRSxJQUFJLENBQUMsQ0FBQztLQUM1RjtTQUFNO1FBQ0wsWUFBWTtZQUNSLDhCQUE4QixDQUFDLE9BQU8sb0NBQXlDLEVBQUUsSUFBSSxDQUFDLENBQUM7S0FDNUY7SUFFRCxZQUFZLEdBQUcsWUFBWSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxZQUFZLHNCQUF3QyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUM3RixPQUFPLFFBQVEsQ0FBQyxJQUFJLEVBQUUsWUFBWSxFQUFFLENBQUMsQ0FBQyxDQUFDO0FBQ3pDLENBQUM7QUFFRCxTQUFTLHNCQUFzQixDQUFDLE9BQXVCLEVBQUUsSUFBWSxFQUFFLFFBQWE7SUFDbEYsSUFBTSxZQUFZLEdBQUcsZUFBZSxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQztJQUNwRCxPQUFPLENBQUMsWUFBWSxJQUFJLGVBQWUsQ0FBQyxJQUFJLEVBQUUsWUFBWSxFQUFFLFFBQVEsQ0FBQyxDQUFDO0FBQ3hFLENBQUM7QUFFRCxTQUFTLGVBQWUsQ0FDcEIsSUFBWSxFQUFFLENBQTBCLEVBQUUsQ0FBMEI7SUFDdEUsSUFBTSxZQUFZLEdBQUcsSUFBSSxnQkFBcUIsQ0FBQztJQUMvQyxJQUFNLFNBQVMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3pCLElBQU0sYUFBYSxHQUFHLElBQUksbUJBQXdCLENBQUM7SUFDbkQsNERBQTREO0lBQzVELG1FQUFtRTtJQUNuRSxzREFBc0Q7SUFDdEQsSUFBSSxDQUFDLFlBQVksSUFBSSxTQUFTLElBQUksYUFBYSxFQUFFO1FBQy9DLDREQUE0RDtRQUM1RCxPQUFRLENBQVksQ0FBQyxRQUFRLEVBQUUsS0FBTSxDQUFZLENBQUMsUUFBUSxFQUFFLENBQUM7S0FDOUQ7SUFFRCxnRUFBZ0U7SUFDaEUsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQ2pCLENBQUM7QUFFRDtJQUtFLG9DQUFZLE9BQXNCLEVBQVUsUUFBcUIsRUFBVSxLQUFrQjtRQUFqRCxhQUFRLEdBQVIsUUFBUSxDQUFhO1FBQVUsVUFBSyxHQUFMLEtBQUssQ0FBYTtRQUpyRixZQUFPLEdBQW1DLEVBQUUsQ0FBQztRQUM3QyxXQUFNLEdBQUcsS0FBSyxDQUFDO1FBSXJCLElBQUksQ0FBQyxRQUFRLEdBQUcsT0FBYyxDQUFDO0lBQ2pDLENBQUM7SUFFRCw2Q0FBUSxHQUFSLFVBQVMsSUFBWSxFQUFFLEtBQVU7UUFDL0IsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxLQUFLLEtBQUssRUFBRTtZQUNoQyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxHQUFHLEtBQUssQ0FBQztZQUMzQixJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQztTQUNwQjtJQUNILENBQUM7SUFFRCxnREFBVyxHQUFYLFVBQVksYUFBMEIsRUFBRSxhQUFzQjtRQUM1RCxxRUFBcUU7UUFDckUsbUVBQW1FO1FBQ25FLHlEQUF5RDtRQUN6RCxJQUFJLElBQUksQ0FBQyxNQUFNLEVBQUU7WUFDZixJQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FDM0IsSUFBSSxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxPQUFTLEVBQUUsYUFBYSxFQUFFLGFBQWEsSUFBSSxJQUFJLENBQUMsQ0FBQztZQUNyRixJQUFJLENBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztZQUNsQixJQUFJLENBQUMsTUFBTSxHQUFHLEtBQUssQ0FBQztZQUNwQixPQUFPLE1BQU0sQ0FBQztTQUNmO1FBRUQsT0FBTyxTQUFTLENBQUM7SUFDbkIsQ0FBQztJQUNILGlDQUFDO0FBQUQsQ0FBQyxBQTlCRCxJQThCQzs7QUFnQ0QsTUFBTSxVQUFVLHFCQUFxQixDQUFDLE1BQStCLEVBQUUsS0FBYztJQUNuRixJQUFJLElBQUksRUFBRSxJQUFJLEdBQUcsbUJBQW1CLENBQUM7SUFDckMsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxFQUFFO1FBQ3pCLElBQUksS0FBSyxFQUFFO1lBQ1QsSUFBSSxJQUFJLFNBQVMsR0FBRyxLQUFLLENBQUM7U0FDM0I7YUFBTTtZQUNMLElBQUksSUFBSSxlQUFlLENBQUM7U0FDekI7UUFDRCxLQUFLLEdBQUcsS0FBSyw4QkFBbUMsQ0FBQztRQUNqRCxJQUFJLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBVyxDQUFDO0tBQ2hDO1NBQU07UUFDTCxJQUFJLEdBQUcsTUFBTSxDQUFDO1FBQ2QsSUFBSSxJQUFJLFNBQVMsR0FBRyxJQUFJLENBQUM7S0FDMUI7SUFDRCxJQUFNLFlBQVksR0FBRyxxQkFBcUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUNqRCxJQUFNLFdBQVcsR0FBRyxlQUFlLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDMUMsT0FBTztRQUNMLElBQUksTUFBQTtRQUNKLFdBQVcsYUFBQTtRQUNYLFlBQVksY0FBQTtRQUNaLEtBQUssRUFBRSxJQUFJO1FBQ1gsS0FBSyxFQUFFO1lBQ0wsS0FBSyxFQUFFLElBQUksZ0JBQXFCLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsS0FBSztZQUMvQyxLQUFLLEVBQUUsSUFBSSxnQkFBcUIsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxLQUFLO1lBQy9DLFFBQVEsRUFBRSxJQUFJLG1CQUF3QixDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEtBQUs7WUFDckQsbUJBQW1CLEVBQUUsSUFBSSw4QkFBbUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxLQUFLO1lBQzNFLHVCQUF1QixFQUFFLElBQUksbUNBQXVDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsS0FBSztTQUNwRjtLQUNGLENBQUM7QUFDSixDQUFDO0FBRUQsTUFBTSxVQUFVLDBCQUEwQixDQUFDLE9BQXVCLEVBQUUsS0FBYTtJQUMvRSxJQUFNLEtBQUssR0FBRyxPQUFPLENBQUMsS0FBSyxtQ0FBd0MsQ0FBVyxDQUFDO0lBQy9FLE9BQU8sS0FBSyxzQkFBOEMsQ0FBQztBQUM3RCxDQUFDO0FBRUQsU0FBUyw2QkFBNkIsQ0FBQyxPQUF1QixFQUFFLFlBQWlCO0lBQy9FLElBQUksY0FBc0IsQ0FBQztJQUUzQixJQUFNLElBQUksR0FBRyxPQUFPLG1DQUF3QyxDQUFDO0lBQzdELElBQUksS0FBSyxHQUFHLGlDQUFpQyxDQUFDLElBQUksRUFBRSxZQUFZLENBQUMsQ0FBQztJQUNsRSxJQUFJLEtBQUssS0FBSyxDQUFDLENBQUMsRUFBRTtRQUNoQixxRUFBcUU7UUFDckUsNEVBQTRFO1FBQzVFLEtBQUssR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDO1FBQ3BCLGNBQWMsR0FBRyxLQUFLLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLGVBQW9DLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUUzRSxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ2xDLElBQUksQ0FBQyxLQUFLLCtCQUFvRCxDQUFDLEdBQUcsWUFBWSxDQUFDO1FBQy9FLElBQUksQ0FBQyxLQUFLLDBCQUErQyxDQUFDLEdBQUcsS0FBSyxDQUFDO1FBQ25FLElBQUksQ0FBQyxLQUFLLHNDQUEyRCxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFFNUUsSUFBTSxpQkFBaUIsR0FDbkIseUJBQXlCLENBQUMsT0FBTyxDQUFDLHFDQUEwQyxDQUFDO1FBQ2pGLHFCQUFxQixDQUFDLE9BQU8sRUFBRSxjQUFjLEVBQUUsSUFBSSxFQUFFLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUNyRSxxQkFBcUIsQ0FBQyxPQUFPLEVBQUUsY0FBYyxFQUFFLEtBQUssRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO0tBQzFFO1NBQU07UUFDTCxjQUFjLEdBQUcsS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxlQUFvQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7S0FDNUU7SUFFRCxPQUFPLGNBQWMsQ0FBQztBQUN4QixDQUFDO0FBRUQsU0FBUyxpQ0FBaUMsQ0FDdEMsVUFBbUMsRUFBRSxTQUFhO0lBQ3BELEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxVQUFVLENBQUMsTUFBTSxFQUFFLENBQUMsZ0JBQXFDLEVBQUU7UUFDN0UsSUFBSSxVQUFVLENBQUMsQ0FBQyxDQUFDLEtBQUssU0FBUyxFQUFFO1lBQy9CLE9BQU8sQ0FBQyxDQUFDO1NBQ1Y7S0FDRjtJQUNELE9BQU8sQ0FBQyxDQUFDLENBQUM7QUFDWixDQUFDO0FBRUQsU0FBUyw4QkFBOEIsQ0FBQyxTQUErQixFQUFFLEdBQVc7SUFDbEYsS0FBSyxJQUFJLENBQUMsZ0NBQWtELEVBQUUsQ0FBQyxHQUFHLFNBQVMsQ0FBQyxNQUFNLEVBQzdFLENBQUMsZ0JBQWtDLEVBQUU7UUFDeEMsSUFBSSxTQUFTLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRztZQUFFLE9BQU8sQ0FBQyxDQUFDO0tBQ3BDO0lBQ0QsT0FBTyxDQUFDLENBQUMsQ0FBQztBQUNaLENBQUM7QUFFRCxNQUFNLFVBQVUsbUJBQW1CLENBQUMsQ0FBYSxFQUFFLENBQWE7SUFDOUQsSUFBTSxHQUFHLEdBQWEsRUFBRSxDQUFDO0lBQ3pCLElBQU0sS0FBSyxHQUF5QixFQUFFLENBQUM7SUFDdkMsaUJBQWlCLENBQUMsS0FBSyxFQUFFLGFBQWEsRUFBRSxhQUFhLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQzdELGlCQUFpQixDQUFDLEtBQUssRUFBRSxjQUFjLEVBQUUsY0FBYyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztJQUMvRCxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxPQUFPLENBQ3hCLFVBQUEsSUFBSSxJQUFNLGlCQUFpQixDQUFDLEtBQUssRUFBRSxRQUFRLEdBQUcsSUFBSSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBRXBGLElBQUksS0FBSyxDQUFDLE1BQU0sRUFBRTtRQUNoQixHQUFHLENBQUMsSUFBSSxDQUFDLG9CQUFvQixDQUFDLENBQUM7UUFDL0IsR0FBRyxDQUFDLElBQUksQ0FBQyxPQUFPLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzNCLEdBQUcsQ0FBQyxJQUFJLENBQUMsT0FBTyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUMzQixHQUFHLENBQUMsSUFBSSxDQUFDLDRDQUE0QyxDQUFDLENBQUM7UUFDdkQsS0FBSyxDQUFDLE9BQU8sQ0FBQyxVQUFBLE1BQU07WUFDWixJQUFBLDhCQUEyQixFQUExQixZQUFJLEVBQUUsWUFBSSxFQUFFLFlBQWMsQ0FBQztZQUNsQyxHQUFHLENBQUMsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsQ0FBQztZQUMzQixHQUFHLENBQUMsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLEdBQUcsT0FBTyxHQUFHLElBQUksR0FBRyxJQUFJLENBQUMsQ0FBQztRQUNyRCxDQUFDLENBQUMsQ0FBQztLQUNKO0lBRUQsT0FBTyxHQUFHLENBQUM7QUFDYixDQUFDO0FBRUQsU0FBUyxpQkFBaUIsQ0FBQyxNQUFhLEVBQUUsSUFBWSxFQUFFLElBQVksRUFBRSxDQUFNLEVBQUUsQ0FBTTtJQUNsRixJQUFNLElBQUksR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDckIsSUFBTSxJQUFJLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3JCLElBQUksSUFBSSxLQUFLLElBQUksRUFBRTtRQUNqQixNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO0tBQ2pDO0FBQ0gsQ0FBQztBQUVELFNBQVMsdUJBQXVCLENBQzVCLE9BQXVCLEVBQUUsY0FBc0IsRUFBRSxNQUFjLEVBQUUsWUFBcUI7SUFDeEYsSUFBTSw2QkFBNkIsR0FDL0IsT0FBTyxtQ0FBd0MsQ0FDdkMsQ0FBQyxjQUFjLGVBQW9DLENBQUM7MkNBQ0ksQ0FBVyxDQUFDO0lBQ2hGLElBQU0sT0FBTyxHQUFHLE9BQU8sbUNBQXdDLENBQUM7SUFDaEUsSUFBTSxjQUFjLEdBQUcsNkJBQTZCO2tDQUNGO1FBQzlDLENBQUMsWUFBWSxDQUFDLENBQUM7WUFDVixPQUFPLENBQ0YsNkJBQTZCLDhCQUFrRCxDQUFDLENBQUMsQ0FBQztZQUN2RixDQUFDLENBQUM7UUFDUCxNQUFNLENBQUM7SUFDWCxPQUFPLE9BQU8sQ0FBQyxjQUFjLENBQUMsQ0FBQztBQUNqQyxDQUFDO0FBRUQsU0FBUyxpQkFBaUIsQ0FBQyxPQUF1QixFQUFFLGNBQXNCO0lBQ3hFLElBQU0sSUFBSSxHQUFHLE9BQU8sbUNBQXdDLENBQUM7SUFDN0QsSUFBTSxLQUFLLEdBQUcsSUFBSSxDQUNDLGNBQWMsZUFBb0M7b0NBQ0QsQ0FBQztRQUNqRSxJQUFJLDhCQUFtRCxJQUFJLElBQUksQ0FBQztJQUNwRSxPQUFPLEtBQStCLENBQUM7QUFDekMsQ0FBQztBQUVELFNBQVMsZ0JBQWdCLENBQUMsT0FBdUIsRUFBRSxjQUFzQjtJQUN2RSxJQUFNLElBQUksR0FBRyxPQUFPLG1DQUF3QyxDQUFDO0lBQzdELE9BQU8sSUFBSSxDQUNOLGNBQWMsZUFBb0M7K0JBQ04sQ0FBWSxDQUFDO0FBQ2hFLENBQUM7QUFFRCxTQUFTLGlCQUFpQixDQUN0QixPQUF1QixFQUFFLGNBQXNCLEVBQUUsUUFBaUI7SUFDcEUsSUFBTSxJQUFJLEdBQUcsT0FBTyxtQ0FBd0MsQ0FBQztJQUM3RCxJQUFJLENBQ0MsY0FBYyxlQUFvQzsrQkFDTixDQUFDLEdBQUcsUUFBUSxDQUFDO0FBQ2hFLENBQUM7QUFFRCxTQUFTLGdCQUFnQixDQUNyQixZQUFxQyxFQUFFLFFBQWlDLEVBQ3hFLHFCQUE2QixFQUFFLGlCQUF5QjtJQUMxRCwwRUFBMEU7SUFDMUUsMEVBQTBFO0lBQzFFLDZFQUE2RTtJQUM3RSxnRkFBZ0Y7SUFDaEYsaUZBQWlGO0lBQ2pGLGtGQUFrRjtJQUNsRixnRkFBZ0Y7SUFDaEYsb0ZBQW9GO0lBQ3BGLDREQUE0RDtJQUM1RCxJQUFJLFlBQVksSUFBSSxJQUFJLEVBQUU7UUFDeEIsSUFBSSxRQUFRLElBQUksSUFBSSxFQUFFO1lBQ3BCLHFFQUFxRTtZQUNyRSxnQ0FBZ0M7WUFDaEMsT0FBTyxpQkFBaUIsSUFBSSxxQkFBcUIsQ0FBQztTQUNuRDthQUFNO1lBQ0wsaUVBQWlFO1lBQ2pFLCtEQUErRDtZQUMvRCw2REFBNkQ7WUFDN0QseUNBQXlDO1lBQ3pDLE9BQU8scUJBQXFCLEtBQUssaUJBQWlCLENBQUM7U0FDcEQ7S0FDRjtJQUNELE9BQU8sSUFBSSxDQUFDO0FBQ2QsQ0FBQztBQUVEOzs7Ozs7Ozs7O0dBVUc7QUFDSCxNQUFNLFVBQVUsd0JBQXdCLENBQUMsT0FBdUI7SUFDOUQsSUFBTSxrQkFBa0IsR0FBRyxPQUFPLG9DQUF5QyxDQUFDO0lBQzVFLElBQUksU0FBUyxHQUFHLGtCQUFrQixzQ0FBd0QsQ0FBQztJQUMzRixJQUFJLFNBQVMsS0FBSyxJQUFJLEVBQUU7UUFDdEIsU0FBUyxHQUFHLEVBQUUsQ0FBQztRQUNmLEtBQUssSUFBSSxDQUFDLGdDQUFrRCxFQUFFLENBQUMsR0FBRyxrQkFBa0IsQ0FBQyxNQUFNLEVBQ3RGLENBQUMsZ0JBQWtDLEVBQUU7WUFDeEMsSUFBTSxTQUFTLEdBQUcsa0JBQWtCLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQzVDLElBQUksU0FBUyxFQUFFO2dCQUNiLFNBQVMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsa0JBQWtCLENBQUMsQ0FBQyxDQUFDLENBQUM7YUFDcEU7U0FDRjtRQUNELGtCQUFrQixzQ0FBd0QsR0FBRyxTQUFTLENBQUM7S0FDeEY7SUFDRCxPQUFPLFNBQVMsQ0FBQztBQUNuQixDQUFDO0FBRUQ7Ozs7Ozs7Ozs7R0FVRztBQUNILE1BQU0sVUFBVSwwQkFBMEIsQ0FBQyxPQUF1QjtJQUNoRSxJQUFNLGtCQUFrQixHQUFHLE9BQU8sb0NBQXlDLENBQUM7SUFDNUUsSUFBSSxXQUFXLEdBQUcsa0JBQWtCLHNDQUF3RCxDQUFDO0lBQzdGLElBQUksV0FBVyxLQUFLLElBQUksRUFBRTtRQUN4QixXQUFXLEdBQUcsRUFBRSxDQUFDO1FBQ2pCLEtBQUssSUFBSSxDQUFDLGdDQUFrRCxFQUFFLENBQUMsR0FBRyxrQkFBa0IsQ0FBQyxNQUFNLEVBQ3RGLENBQUMsZ0JBQWtDLEVBQUU7WUFDeEMsSUFBTSxLQUFLLEdBQUcsa0JBQWtCLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQ3hDLElBQUksS0FBSyxLQUFLLElBQUksRUFBRTtnQkFDbEIsV0FBVyxJQUFJLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBTSxrQkFBa0IsQ0FBQyxDQUFDLENBQUMsU0FBSSxLQUFPLENBQUEsQ0FBQzthQUN0RjtTQUNGO1FBQ0Qsa0JBQWtCLHNDQUF3RCxHQUFHLFdBQVcsQ0FBQztLQUMxRjtJQUNELE9BQU8sV0FBVyxDQUFDO0FBQ3JCLENBQUM7QUFFRDs7R0FFRztBQUNILFNBQVMsa0JBQWtCLENBQ3ZCLE9BQXVCLEVBQUUsaUJBQTBCLEVBQUUsY0FBc0I7SUFDN0UsSUFBTSxNQUFNLEdBQ1IsT0FBTyxDQUFDLGlCQUFpQixDQUFDLENBQUMsNEJBQWlDLENBQUMsMEJBQStCLENBQUMsQ0FBQztJQUNsRyxJQUFNLEtBQUssR0FBRztRQUNWLGNBQWMsZUFBaUMsQ0FBQztJQUNwRCxPQUFPLE1BQU0sQ0FBQyxLQUFLLHNCQUF3QyxDQUFDLElBQUksSUFBSSxDQUFDO0FBQ3ZFLENBQUM7QUFFRDs7Ozs7Ozs7Ozs7OztHQWFHO0FBQ0gsU0FBUyxvQkFBb0IsQ0FDekIsT0FBdUIsRUFBRSxpQkFBMEIsRUFBRSxjQUFzQixFQUMzRSxRQUFhO0lBQ2YsSUFBTSxtQkFBbUIsR0FDckIsaUJBQWlCLENBQUMsQ0FBQyw0QkFBaUMsQ0FBQywwQkFBK0IsQ0FBQztJQUN6RixJQUFNLFlBQVksR0FBRyxPQUFPLENBQUMsbUJBQW1CLENBQXlCLENBQUM7SUFDMUUsSUFBTSxLQUFLLEdBQUc7UUFDVixjQUFjLGVBQWlDLENBQUM7SUFDcEQsSUFBSSxZQUFZLENBQUMsS0FBSywwQkFBNEMsQ0FBQztRQUFFLE9BQU8sS0FBSyxDQUFDO0lBQ2xGLE9BQU8sUUFBUSxLQUFLLFNBQVM7UUFDekIsa0JBQWtCLENBQUMsT0FBTyxFQUFFLGlCQUFpQixFQUFFLGNBQWMsQ0FBQyxLQUFLLFFBQVEsQ0FBQztBQUNsRixDQUFDO0FBRUQ7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQXFCRztBQUNILFNBQVMsb0JBQW9CLENBQ3pCLE9BQXVCLEVBQUUsY0FBc0IsRUFBRSxpQkFBMEIsRUFBRSxVQUFlLEVBQzVGLGFBQXFCLEVBQUUsV0FBbUIsRUFBRSxXQUFtQixFQUFFLGlCQUEwQjtJQUM3RixJQUFNLE1BQU0sR0FDUixPQUFPLENBQUMsaUJBQWlCLENBQUMsQ0FBQyw0QkFBaUMsQ0FBQywwQkFBK0IsQ0FBQyxDQUFDO0lBRWxHLElBQU0sS0FBSyxHQUFHO1FBQ1YsY0FBYyxlQUFpQyxDQUFDO0lBRXBELHNGQUFzRjtJQUN0Riw2Q0FBNkM7SUFDN0MsSUFBSSxpQkFBaUIsRUFBRTtRQUNyQixJQUFNLGlCQUFpQixHQUFHLGFBQWEsR0FBRyxXQUFXLGVBQWlDLENBQUM7UUFDdkYsS0FBSyxJQUFJLENBQUMsR0FBRyxLQUFLLGVBQWlDLEVBQUUsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxNQUFNLEVBQ2pFLENBQUMsZ0JBQWtDLEVBQUU7WUFDeEMsTUFBTSxDQUFDLENBQUMsOEJBQWdELENBQUMsR0FBRyxpQkFBaUIsQ0FBQztZQUM5RSxNQUFNLENBQUMsQ0FBQywwQkFBNEMsQ0FBQyxHQUFHLENBQUMsQ0FBQztTQUMzRDtLQUNGO0lBRUQsTUFBTSxDQUFDLEtBQUssMEJBQTRDLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDOUQsTUFBTSxDQUFDLEtBQUssOEJBQWdELENBQUMsR0FBRyxhQUFhLENBQUM7SUFDOUUsTUFBTSxDQUFDLEtBQUssc0JBQXdDLENBQUMsR0FBRyxVQUFVLENBQUM7SUFDbkUsTUFBTSxDQUFDLEtBQUssMkJBQTZDLENBQUMsR0FBRyxXQUFXLENBQUM7SUFFekUseUVBQXlFO0lBQ3pFLHdFQUF3RTtJQUN4RSxxREFBcUQ7SUFDckQsSUFBSSxtQkFBbUIsR0FBRyxXQUFXLENBQUM7SUFDdEMsS0FBSyxJQUFJLENBQUMsOEJBQWdELEVBQUUsQ0FBQyxHQUFHLEtBQUssRUFDaEUsQ0FBQyxnQkFBa0MsRUFBRTtRQUN4QyxtQkFBbUIsSUFBSSxNQUFNLENBQUMsQ0FBQywyQkFBNkMsQ0FBQyxDQUFDO0tBQy9FO0lBRUQsMEVBQTBFO0lBQzFFLHVFQUF1RTtJQUN2RSwwRUFBMEU7SUFDMUUsdUJBQXVCO0lBQ3ZCLElBQUksQ0FBQyxpQkFBaUIsRUFBRTtRQUN0QixJQUFNLFVBQVUsR0FBRyxPQUFPLDRCQUFpQyxDQUFDO1FBQzVELElBQU0sb0JBQW9CLEdBQUcsVUFBVSxDQUNsQzt1Q0FDNkMsQ0FBQyxDQUFDO1FBQ3BELElBQU0sbUJBQW1CLEdBQUcsV0FBVyxHQUFHLG9CQUFvQixDQUFDO1FBQy9ELEtBQUssSUFBSSxDQUFDLDhCQUFnRCxFQUFFLENBQUMsR0FBRyxVQUFVLENBQUMsTUFBTSxFQUM1RSxDQUFDLGdCQUFrQyxFQUFFO1lBQ3hDLFVBQVUsQ0FBQyxDQUFDLDhCQUFnRCxDQUFDLElBQUksbUJBQW1CLENBQUM7U0FDdEY7S0FDRjtJQUVELE1BQU0sOEJBQWdELEdBQUcsbUJBQW1CLENBQUM7QUFDL0UsQ0FBQztBQUVELFNBQVMsZ0JBQWdCLENBQUMsT0FBaUI7SUFDekMsSUFBTSxVQUFVLEdBQWEsRUFBRSxDQUFDO0lBQ2hDLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO1FBQ3ZDLFVBQVUsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7S0FDeEM7SUFDRCxPQUFPLFVBQVUsQ0FBQztBQUNwQixDQUFDO0FBRUQsU0FBUyxTQUFTLENBQUMsS0FBYTtJQUM5QixPQUFPLEtBQUssQ0FBQyxPQUFPLENBQ2hCLGFBQWEsRUFBRSxVQUFBLEtBQUssSUFBSSxPQUFHLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLFNBQUksS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxXQUFXLEVBQUksRUFBckQsQ0FBcUQsQ0FBQyxDQUFDO0FBQ3JGLENBQUM7QUFFRCxTQUFTLHFCQUFxQixDQUMxQixPQUF1QixFQUFFLGNBQXNCLEVBQUUsaUJBQTBCLEVBQzNFLGFBQXFCLEVBQUUsS0FBUztJQUFULHNCQUFBLEVBQUEsU0FBUztJQUNsQyxJQUFNLFlBQVksR0FDZCxPQUFPLENBQUMsaUJBQWlCLENBQUMsQ0FBQyw0QkFBaUMsQ0FBQywwQkFBK0IsQ0FBQyxDQUFDO0lBQ2xHLElBQUksY0FBYyxHQUFHLENBQUMsRUFBRTtRQUN0QixJQUFNLEtBQUssR0FBRztZQUNWLENBQUMsY0FBYyxlQUFpQyxDQUFDLENBQUM7UUFDdEQsT0FBTyxZQUFZLENBQUMsTUFBTSxHQUFHLEtBQUssRUFBRTtZQUNsQyx1RUFBdUU7WUFDdkUsdUVBQXVFO1lBQ3ZFLG9FQUFvRTtZQUNwRSxZQUFZLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxhQUFhLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDO1NBQzlDO0tBQ0Y7SUFDRCxZQUFZLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxhQUFhLEVBQUUsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDO0FBQ25ELENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiogQGxpY2Vuc2VcbiogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4qXG4qIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4qIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiovXG5pbXBvcnQge1N0eWxlU2FuaXRpemVGbn0gZnJvbSAnLi4vLi4vc2FuaXRpemF0aW9uL3N0eWxlX3Nhbml0aXplcic7XG5pbXBvcnQge0VNUFRZX0FSUkFZLCBFTVBUWV9PQkp9IGZyb20gJy4uL2VtcHR5JztcbmltcG9ydCB7QXR0cmlidXRlTWFya2VyLCBUQXR0cmlidXRlc30gZnJvbSAnLi4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7QmluZGluZ1N0b3JlLCBCaW5kaW5nVHlwZSwgUGxheWVyLCBQbGF5ZXJCdWlsZGVyLCBQbGF5ZXJGYWN0b3J5LCBQbGF5ZXJJbmRleH0gZnJvbSAnLi4vaW50ZXJmYWNlcy9wbGF5ZXInO1xuaW1wb3J0IHtSRWxlbWVudCwgUmVuZGVyZXIzLCBSZW5kZXJlclN0eWxlRmxhZ3MzLCBpc1Byb2NlZHVyYWxSZW5kZXJlcn0gZnJvbSAnLi4vaW50ZXJmYWNlcy9yZW5kZXJlcic7XG5pbXBvcnQge0RpcmVjdGl2ZU93bmVyQW5kUGxheWVyQnVpbGRlckluZGV4LCBEaXJlY3RpdmVSZWdpc3RyeVZhbHVlcywgRGlyZWN0aXZlUmVnaXN0cnlWYWx1ZXNJbmRleCwgSW5pdGlhbFN0eWxpbmdWYWx1ZXMsIEluaXRpYWxTdHlsaW5nVmFsdWVzSW5kZXgsIE1hcEJhc2VkT2Zmc2V0VmFsdWVzLCBNYXBCYXNlZE9mZnNldFZhbHVlc0luZGV4LCBTaW5nbGVQcm9wT2Zmc2V0VmFsdWVzLCBTaW5nbGVQcm9wT2Zmc2V0VmFsdWVzSW5kZXgsIFN0eWxpbmdDb250ZXh0LCBTdHlsaW5nRmxhZ3MsIFN0eWxpbmdJbmRleH0gZnJvbSAnLi4vaW50ZXJmYWNlcy9zdHlsaW5nJztcbmltcG9ydCB7TFZpZXcsIFJvb3RDb250ZXh0fSBmcm9tICcuLi9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHtOT19DSEFOR0V9IGZyb20gJy4uL3Rva2Vucyc7XG5pbXBvcnQge2dldFJvb3RDb250ZXh0fSBmcm9tICcuLi91dGlsL3ZpZXdfdHJhdmVyc2FsX3V0aWxzJztcblxuaW1wb3J0IHtCb3VuZFBsYXllckZhY3Rvcnl9IGZyb20gJy4vcGxheWVyX2ZhY3RvcnknO1xuaW1wb3J0IHthZGRQbGF5ZXJJbnRlcm5hbCwgYWxsb2NQbGF5ZXJDb250ZXh0LCBhbGxvY2F0ZURpcmVjdGl2ZUludG9Db250ZXh0LCBjcmVhdGVFbXB0eVN0eWxpbmdDb250ZXh0LCBnZXRQbGF5ZXJDb250ZXh0fSBmcm9tICcuL3V0aWwnO1xuXG5cblxuLyoqXG4gKiBUaGlzIGZpbGUgaW5jbHVkZXMgdGhlIGNvZGUgdG8gcG93ZXIgYWxsIHN0eWxpbmctYmluZGluZyBvcGVyYXRpb25zIGluIEFuZ3VsYXIuXG4gKlxuICogVGhlc2UgaW5jbHVkZTpcbiAqIFtzdHlsZV09XCJteVN0eWxlT2JqXCJcbiAqIFtjbGFzc109XCJteUNsYXNzT2JqXCJcbiAqIFtzdHlsZS5wcm9wXT1cIm15UHJvcFZhbHVlXCJcbiAqIFtjbGFzcy5uYW1lXT1cIm15Q2xhc3NWYWx1ZVwiXG4gKlxuICogSXQgYWxzbyBpbmNsdWRlcyBjb2RlIHRoYXQgd2lsbCBhbGxvdyBzdHlsZSBiaW5kaW5nIGNvZGUgdG8gb3BlcmF0ZSB3aXRoaW4gaG9zdFxuICogYmluZGluZ3MgZm9yIGNvbXBvbmVudHMvZGlyZWN0aXZlcy5cbiAqXG4gKiBUaGVyZSBhcmUgbWFueSBkaWZmZXJlbnQgd2F5cyBpbiB3aGljaCB0aGVzZSBmdW5jdGlvbnMgYmVsb3cgYXJlIGNhbGxlZC4gUGxlYXNlIHNlZVxuICogYHJlbmRlcjMvaW50ZXJmYWNlcy9zdHlsaW5nLnRzYCB0byBnZXQgYSBiZXR0ZXIgaWRlYSBvZiBob3cgdGhlIHN0eWxpbmcgYWxnb3JpdGhtIHdvcmtzLlxuICovXG5cblxuXG4vKipcbiAqIENyZWF0ZXMgYSBuZXcgU3R5bGluZ0NvbnRleHQgYW4gZmlsbHMgaXQgd2l0aCB0aGUgcHJvdmlkZWQgc3RhdGljIHN0eWxpbmcgYXR0cmlidXRlIHZhbHVlcy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluaXRpYWxpemVTdGF0aWNDb250ZXh0KGF0dHJzOiBUQXR0cmlidXRlcyk6IFN0eWxpbmdDb250ZXh0IHtcbiAgY29uc3QgY29udGV4dCA9IGNyZWF0ZUVtcHR5U3R5bGluZ0NvbnRleHQoKTtcbiAgY29uc3QgaW5pdGlhbENsYXNzZXM6IEluaXRpYWxTdHlsaW5nVmFsdWVzID0gY29udGV4dFtTdHlsaW5nSW5kZXguSW5pdGlhbENsYXNzVmFsdWVzUG9zaXRpb25dID1cbiAgICAgIFtudWxsLCBudWxsXTtcbiAgY29uc3QgaW5pdGlhbFN0eWxlczogSW5pdGlhbFN0eWxpbmdWYWx1ZXMgPSBjb250ZXh0W1N0eWxpbmdJbmRleC5Jbml0aWFsU3R5bGVWYWx1ZXNQb3NpdGlvbl0gPVxuICAgICAgW251bGwsIG51bGxdO1xuXG4gIC8vIFRoZSBhdHRyaWJ1dGVzIGFycmF5IGhhcyBtYXJrZXIgdmFsdWVzIChudW1iZXJzKSBpbmRpY2F0aW5nIHdoYXQgdGhlIHN1YnNlcXVlbnRcbiAgLy8gdmFsdWVzIHJlcHJlc2VudC4gV2hlbiB3ZSBlbmNvdW50ZXIgYSBudW1iZXIsIHdlIHNldCB0aGUgbW9kZSB0byB0aGF0IHR5cGUgb2YgYXR0cmlidXRlLlxuICBsZXQgbW9kZSA9IC0xO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGF0dHJzLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgYXR0ciA9IGF0dHJzW2ldO1xuICAgIGlmICh0eXBlb2YgYXR0ciA9PSAnbnVtYmVyJykge1xuICAgICAgbW9kZSA9IGF0dHI7XG4gICAgfSBlbHNlIGlmIChtb2RlID09PSBBdHRyaWJ1dGVNYXJrZXIuU3R5bGVzKSB7XG4gICAgICBpbml0aWFsU3R5bGVzLnB1c2goYXR0ciBhcyBzdHJpbmcsIGF0dHJzWysraV0gYXMgc3RyaW5nKTtcbiAgICB9IGVsc2UgaWYgKG1vZGUgPT09IEF0dHJpYnV0ZU1hcmtlci5DbGFzc2VzKSB7XG4gICAgICBpbml0aWFsQ2xhc3Nlcy5wdXNoKGF0dHIgYXMgc3RyaW5nLCB0cnVlKTtcbiAgICB9IGVsc2UgaWYgKG1vZGUgPT09IEF0dHJpYnV0ZU1hcmtlci5TZWxlY3RPbmx5KSB7XG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cblxuICByZXR1cm4gY29udGV4dDtcbn1cblxuLyoqXG4gKiBEZXNpZ25lZCB0byB1cGRhdGUgYW4gZXhpc3Rpbmcgc3R5bGluZyBjb250ZXh0IHdpdGggbmV3IHN0YXRpYyBzdHlsaW5nXG4gKiBkYXRhIChjbGFzc2VzIGFuZCBzdHlsZXMpLlxuICpcbiAqIEBwYXJhbSBjb250ZXh0IHRoZSBleGlzdGluZyBzdHlsaW5nIGNvbnRleHRcbiAqIEBwYXJhbSBhdHRycyBhbiBhcnJheSBvZiBuZXcgc3RhdGljIHN0eWxpbmcgYXR0cmlidXRlcyB0aGF0IHdpbGwgYmVcbiAqICAgICAgICAgICAgICBhc3NpZ25lZCB0byB0aGUgY29udGV4dFxuICogQHBhcmFtIGRpcmVjdGl2ZVJlZiB0aGUgZGlyZWN0aXZlIGluc3RhbmNlIHdpdGggd2hpY2ggc3RhdGljIGRhdGEgaXMgYXNzb2NpYXRlZCB3aXRoLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcGF0Y2hDb250ZXh0V2l0aFN0YXRpY0F0dHJzKFxuICAgIGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBhdHRyczogVEF0dHJpYnV0ZXMsIHN0YXJ0aW5nSW5kZXg6IG51bWJlciwgZGlyZWN0aXZlUmVmOiBhbnkpOiB2b2lkIHtcbiAgLy8gSWYgdGhlIHN0eWxpbmcgY29udGV4dCBoYXMgYWxyZWFkeSBiZWVuIHBhdGNoZWQgd2l0aCB0aGUgZ2l2ZW4gZGlyZWN0aXZlJ3MgYmluZGluZ3MsXG4gIC8vIHRoZW4gdGhlcmUgaXMgbm8gcG9pbnQgaW4gZG9pbmcgaXQgYWdhaW4uIFRoZSByZWFzb24gd2h5IHRoaXMgbWF5IGhhcHBlbiAodGhlIGRpcmVjdGl2ZVxuICAvLyBzdHlsaW5nIGJlaW5nIHBhdGNoZWQgdHdpY2UpIGlzIGJlY2F1c2UgdGhlIGBzdHlsaW5nQmluZGluZ2AgZnVuY3Rpb24gaXMgY2FsbGVkIGVhY2ggdGltZVxuICAvLyBhbiBlbGVtZW50IGlzIGNyZWF0ZWQgKGJvdGggd2l0aGluIGEgdGVtcGxhdGUgZnVuY3Rpb24gYW5kIHdpdGhpbiBkaXJlY3RpdmUgaG9zdCBiaW5kaW5ncykuXG4gIGNvbnN0IGRpcmVjdGl2ZXMgPSBjb250ZXh0W1N0eWxpbmdJbmRleC5EaXJlY3RpdmVSZWdpc3RyeVBvc2l0aW9uXTtcbiAgaWYgKGdldERpcmVjdGl2ZVJlZ2lzdHJ5VmFsdWVzSW5kZXhPZihkaXJlY3RpdmVzLCBkaXJlY3RpdmVSZWYpID09IC0xKSB7XG4gICAgLy8gdGhpcyBpcyBhIG5ldyBkaXJlY3RpdmUgd2hpY2ggd2UgaGF2ZSBub3Qgc2VlbiB5ZXQuXG4gICAgYWxsb2NhdGVEaXJlY3RpdmVJbnRvQ29udGV4dChjb250ZXh0LCBkaXJlY3RpdmVSZWYpO1xuXG4gICAgbGV0IGluaXRpYWxDbGFzc2VzOiBJbml0aWFsU3R5bGluZ1ZhbHVlc3xudWxsID0gbnVsbDtcbiAgICBsZXQgaW5pdGlhbFN0eWxlczogSW5pdGlhbFN0eWxpbmdWYWx1ZXN8bnVsbCA9IG51bGw7XG5cbiAgICBsZXQgbW9kZSA9IC0xO1xuICAgIGZvciAobGV0IGkgPSBzdGFydGluZ0luZGV4OyBpIDwgYXR0cnMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGF0dHIgPSBhdHRyc1tpXTtcbiAgICAgIGlmICh0eXBlb2YgYXR0ciA9PSAnbnVtYmVyJykge1xuICAgICAgICBtb2RlID0gYXR0cjtcbiAgICAgIH0gZWxzZSBpZiAobW9kZSA9PSBBdHRyaWJ1dGVNYXJrZXIuQ2xhc3Nlcykge1xuICAgICAgICBpbml0aWFsQ2xhc3NlcyA9IGluaXRpYWxDbGFzc2VzIHx8IGNvbnRleHRbU3R5bGluZ0luZGV4LkluaXRpYWxDbGFzc1ZhbHVlc1Bvc2l0aW9uXTtcbiAgICAgICAgcGF0Y2hJbml0aWFsU3R5bGluZ1ZhbHVlKGluaXRpYWxDbGFzc2VzLCBhdHRyLCB0cnVlKTtcbiAgICAgIH0gZWxzZSBpZiAobW9kZSA9PSBBdHRyaWJ1dGVNYXJrZXIuU3R5bGVzKSB7XG4gICAgICAgIGluaXRpYWxTdHlsZXMgPSBpbml0aWFsU3R5bGVzIHx8IGNvbnRleHRbU3R5bGluZ0luZGV4LkluaXRpYWxTdHlsZVZhbHVlc1Bvc2l0aW9uXTtcbiAgICAgICAgcGF0Y2hJbml0aWFsU3R5bGluZ1ZhbHVlKGluaXRpYWxTdHlsZXMsIGF0dHIsIGF0dHJzWysraV0pO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIERlc2lnbmVkIHRvIGFkZCBhIHN0eWxlIG9yIGNsYXNzIHZhbHVlIGludG8gdGhlIGV4aXN0aW5nIHNldCBvZiBpbml0aWFsIHN0eWxlcy5cbiAqXG4gKiBUaGUgZnVuY3Rpb24gd2lsbCBzZWFyY2ggYW5kIGZpZ3VyZSBvdXQgaWYgYSBzdHlsZS9jbGFzcyB2YWx1ZSBpcyBhbHJlYWR5IHByZXNlbnRcbiAqIHdpdGhpbiB0aGUgcHJvdmlkZWQgaW5pdGlhbCBzdHlsaW5nIGFycmF5LiBJZiBhbmQgd2hlbiBhIHN0eWxlL2NsYXNzIHZhbHVlIGlzIG5vdFxuICogcHJlc2VudCAob3IgaWYgaXQncyB2YWx1ZSBpcyBmYWxzeSkgdGhlbiBpdCB3aWxsIGJlIGluc2VydGVkL3VwZGF0ZWQgaW4gdGhlIGxpc3RcbiAqIG9mIGluaXRpYWwgc3R5bGluZyB2YWx1ZXMuXG4gKi9cbmZ1bmN0aW9uIHBhdGNoSW5pdGlhbFN0eWxpbmdWYWx1ZShcbiAgICBpbml0aWFsU3R5bGluZzogSW5pdGlhbFN0eWxpbmdWYWx1ZXMsIHByb3A6IHN0cmluZywgdmFsdWU6IGFueSk6IHZvaWQge1xuICAvLyBFdmVuIHZhbHVlcyBhcmUga2V5czsgT2RkIG51bWJlcnMgYXJlIHZhbHVlczsgU2VhcmNoIGtleXMgb25seVxuICBmb3IgKGxldCBpID0gSW5pdGlhbFN0eWxpbmdWYWx1ZXNJbmRleC5LZXlWYWx1ZVN0YXJ0UG9zaXRpb247IGkgPCBpbml0aWFsU3R5bGluZy5sZW5ndGg7KSB7XG4gICAgY29uc3Qga2V5ID0gaW5pdGlhbFN0eWxpbmdbaV07XG4gICAgaWYgKGtleSA9PT0gcHJvcCkge1xuICAgICAgY29uc3QgZXhpc3RpbmdWYWx1ZSA9IGluaXRpYWxTdHlsaW5nW2kgKyBJbml0aWFsU3R5bGluZ1ZhbHVlc0luZGV4LlZhbHVlT2Zmc2V0XTtcblxuICAgICAgLy8gSWYgdGhlcmUgaXMgbm8gcHJldmlvdXMgc3R5bGUgdmFsdWUgKHdoZW4gYG51bGxgKSBvciBubyBwcmV2aW91cyBjbGFzc1xuICAgICAgLy8gYXBwbGllZCAod2hlbiBgZmFsc2VgKSB0aGVuIHdlIHVwZGF0ZSB0aGUgdGhlIG5ld2x5IGdpdmVuIHZhbHVlLlxuICAgICAgaWYgKGV4aXN0aW5nVmFsdWUgPT0gbnVsbCB8fCBleGlzdGluZ1ZhbHVlID09IGZhbHNlKSB7XG4gICAgICAgIGluaXRpYWxTdHlsaW5nW2kgKyBJbml0aWFsU3R5bGluZ1ZhbHVlc0luZGV4LlZhbHVlT2Zmc2V0XSA9IHZhbHVlO1xuICAgICAgfVxuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpID0gaSArIEluaXRpYWxTdHlsaW5nVmFsdWVzSW5kZXguU2l6ZTtcbiAgfVxuICAvLyBXZSBkaWQgbm90IGZpbmQgZXhpc3Rpbmcga2V5LCBhZGQgYSBuZXcgb25lLlxuICBpbml0aWFsU3R5bGluZy5wdXNoKHByb3AsIHZhbHVlKTtcbn1cblxuLyoqXG4gKiBSdW5zIHRocm91Z2ggdGhlIGluaXRpYWwgc3R5bGUgZGF0YSBwcmVzZW50IGluIHRoZSBjb250ZXh0IGFuZCByZW5kZXJzXG4gKiB0aGVtIHZpYSB0aGUgcmVuZGVyZXIgb24gdGhlIGVsZW1lbnQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZW5kZXJJbml0aWFsU3R5bGVzKFxuICAgIGVsZW1lbnQ6IFJFbGVtZW50LCBjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgcmVuZGVyZXI6IFJlbmRlcmVyMykge1xuICBjb25zdCBpbml0aWFsU3R5bGVzID0gY29udGV4dFtTdHlsaW5nSW5kZXguSW5pdGlhbFN0eWxlVmFsdWVzUG9zaXRpb25dO1xuICByZW5kZXJJbml0aWFsU3R5bGluZ1ZhbHVlcyhlbGVtZW50LCByZW5kZXJlciwgaW5pdGlhbFN0eWxlcywgZmFsc2UpO1xufVxuXG4vKipcbiAqIFJ1bnMgdGhyb3VnaCB0aGUgaW5pdGlhbCBjbGFzcyBkYXRhIHByZXNlbnQgaW4gdGhlIGNvbnRleHQgYW5kIHJlbmRlcnNcbiAqIHRoZW0gdmlhIHRoZSByZW5kZXJlciBvbiB0aGUgZWxlbWVudC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlbmRlckluaXRpYWxDbGFzc2VzKFxuICAgIGVsZW1lbnQ6IFJFbGVtZW50LCBjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgcmVuZGVyZXI6IFJlbmRlcmVyMykge1xuICBjb25zdCBpbml0aWFsQ2xhc3NlcyA9IGNvbnRleHRbU3R5bGluZ0luZGV4LkluaXRpYWxDbGFzc1ZhbHVlc1Bvc2l0aW9uXTtcbiAgcmVuZGVySW5pdGlhbFN0eWxpbmdWYWx1ZXMoZWxlbWVudCwgcmVuZGVyZXIsIGluaXRpYWxDbGFzc2VzLCB0cnVlKTtcbn1cblxuLyoqXG4gKiBUaGlzIGlzIGEgaGVscGVyIGZ1bmN0aW9uIGRlc2lnbmVkIHRvIHJlbmRlciBlYWNoIGVudHJ5IHByZXNlbnQgd2l0aGluIHRoZVxuICogcHJvdmlkZWQgbGlzdCBvZiBpbml0aWFsU3R5bGluZ1ZhbHVlcy5cbiAqL1xuZnVuY3Rpb24gcmVuZGVySW5pdGlhbFN0eWxpbmdWYWx1ZXMoXG4gICAgZWxlbWVudDogUkVsZW1lbnQsIHJlbmRlcmVyOiBSZW5kZXJlcjMsIGluaXRpYWxTdHlsaW5nVmFsdWVzOiBJbml0aWFsU3R5bGluZ1ZhbHVlcyxcbiAgICBpc0VudHJ5Q2xhc3NCYXNlZDogYm9vbGVhbikge1xuICBmb3IgKGxldCBpID0gSW5pdGlhbFN0eWxpbmdWYWx1ZXNJbmRleC5LZXlWYWx1ZVN0YXJ0UG9zaXRpb247IGkgPCBpbml0aWFsU3R5bGluZ1ZhbHVlcy5sZW5ndGg7XG4gICAgICAgaSArPSBJbml0aWFsU3R5bGluZ1ZhbHVlc0luZGV4LlNpemUpIHtcbiAgICBjb25zdCB2YWx1ZSA9IGluaXRpYWxTdHlsaW5nVmFsdWVzW2kgKyBJbml0aWFsU3R5bGluZ1ZhbHVlc0luZGV4LlZhbHVlT2Zmc2V0XTtcbiAgICBpZiAodmFsdWUpIHtcbiAgICAgIGlmIChpc0VudHJ5Q2xhc3NCYXNlZCkge1xuICAgICAgICBzZXRDbGFzcyhcbiAgICAgICAgICAgIGVsZW1lbnQsIGluaXRpYWxTdHlsaW5nVmFsdWVzW2kgKyBJbml0aWFsU3R5bGluZ1ZhbHVlc0luZGV4LlByb3BPZmZzZXRdIGFzIHN0cmluZywgdHJ1ZSxcbiAgICAgICAgICAgIHJlbmRlcmVyLCBudWxsKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNldFN0eWxlKFxuICAgICAgICAgICAgZWxlbWVudCwgaW5pdGlhbFN0eWxpbmdWYWx1ZXNbaSArIEluaXRpYWxTdHlsaW5nVmFsdWVzSW5kZXguUHJvcE9mZnNldF0gYXMgc3RyaW5nLFxuICAgICAgICAgICAgdmFsdWUgYXMgc3RyaW5nLCByZW5kZXJlciwgbnVsbCk7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhbGxvd05ld0JpbmRpbmdzRm9yU3R5bGluZ0NvbnRleHQoY29udGV4dDogU3R5bGluZ0NvbnRleHQpOiBib29sZWFuIHtcbiAgcmV0dXJuIChjb250ZXh0W1N0eWxpbmdJbmRleC5NYXN0ZXJGbGFnUG9zaXRpb25dICYgU3R5bGluZ0ZsYWdzLkJpbmRpbmdBbGxvY2F0aW9uTG9ja2VkKSA9PT0gMDtcbn1cblxuLyoqXG4gKiBBZGRzIGluIG5ldyBiaW5kaW5nIHZhbHVlcyB0byBhIHN0eWxpbmcgY29udGV4dC5cbiAqXG4gKiBJZiBhIGRpcmVjdGl2ZSB2YWx1ZSBpcyBwcm92aWRlZCB0aGVuIGFsbCBwcm92aWRlZCBjbGFzcy9zdHlsZSBiaW5kaW5nIG5hbWVzIHdpbGxcbiAqIHJlZmVyZW5jZSB0aGUgcHJvdmlkZWQgZGlyZWN0aXZlLlxuICpcbiAqIEBwYXJhbSBjb250ZXh0IHRoZSBleGlzdGluZyBzdHlsaW5nIGNvbnRleHRcbiAqIEBwYXJhbSBkaXJlY3RpdmVSZWYgdGhlIGRpcmVjdGl2ZSB0aGF0IHRoZSBuZXcgYmluZGluZ3Mgd2lsbCByZWZlcmVuY2VcbiAqIEBwYXJhbSBjbGFzc0JpbmRpbmdOYW1lcyBhbiBhcnJheSBvZiBjbGFzcyBiaW5kaW5nIG5hbWVzIHRoYXQgd2lsbCBiZSBhZGRlZCB0byB0aGUgY29udGV4dFxuICogQHBhcmFtIHN0eWxlQmluZGluZ05hbWVzIGFuIGFycmF5IG9mIHN0eWxlIGJpbmRpbmcgbmFtZXMgdGhhdCB3aWxsIGJlIGFkZGVkIHRvIHRoZSBjb250ZXh0XG4gKiBAcGFyYW0gc3R5bGVTYW5pdGl6ZXIgYW4gb3B0aW9uYWwgc2FuaXRpemVyIHRoYXQgaGFuZGxlIGFsbCBzYW5pdGl6YXRpb24gb24gZm9yIGVhY2ggb2ZcbiAqICAgIHRoZSBiaW5kaW5ncyBhZGRlZCB0byB0aGUgY29udGV4dC4gTm90ZSB0aGF0IGlmIGEgZGlyZWN0aXZlIGlzIHByb3ZpZGVkIHRoZW4gdGhlIHNhbml0aXplclxuICogICAgaW5zdGFuY2Ugd2lsbCBvbmx5IGJlIGFjdGl2ZSBpZiBhbmQgd2hlbiB0aGUgZGlyZWN0aXZlIHVwZGF0ZXMgdGhlIGJpbmRpbmdzIHRoYXQgaXQgb3ducy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHVwZGF0ZUNvbnRleHRXaXRoQmluZGluZ3MoXG4gICAgY29udGV4dDogU3R5bGluZ0NvbnRleHQsIGRpcmVjdGl2ZVJlZjogYW55IHwgbnVsbCwgY2xhc3NCaW5kaW5nTmFtZXM/OiBzdHJpbmdbXSB8IG51bGwsXG4gICAgc3R5bGVCaW5kaW5nTmFtZXM/OiBzdHJpbmdbXSB8IG51bGwsIHN0eWxlU2FuaXRpemVyPzogU3R5bGVTYW5pdGl6ZUZuIHwgbnVsbCkge1xuICBpZiAoY29udGV4dFtTdHlsaW5nSW5kZXguTWFzdGVyRmxhZ1Bvc2l0aW9uXSAmIFN0eWxpbmdGbGFncy5CaW5kaW5nQWxsb2NhdGlvbkxvY2tlZCkgcmV0dXJuO1xuXG4gIC8vIHRoaXMgbWVhbnMgdGhlIGNvbnRleHQgaGFzIGFscmVhZHkgYmVlbiBwYXRjaGVkIHdpdGggdGhlIGRpcmVjdGl2ZSdzIGJpbmRpbmdzXG4gIGNvbnN0IGRpcmVjdGl2ZUluZGV4ID0gZmluZE9yUGF0Y2hEaXJlY3RpdmVJbnRvUmVnaXN0cnkoY29udGV4dCwgZGlyZWN0aXZlUmVmLCBzdHlsZVNhbml0aXplcik7XG4gIGlmIChkaXJlY3RpdmVJbmRleCA9PT0gLTEpIHtcbiAgICAvLyB0aGlzIG1lYW5zIHRoZSBkaXJlY3RpdmUgaGFzIGFscmVhZHkgYmVlbiBwYXRjaGVkIGluIC4uLiBObyBwb2ludCBpbiBkb2luZyBhbnl0aGluZ1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGlmIChzdHlsZUJpbmRpbmdOYW1lcykge1xuICAgIHN0eWxlQmluZGluZ05hbWVzID0gaHlwaGVuYXRlRW50cmllcyhzdHlsZUJpbmRpbmdOYW1lcyk7XG4gIH1cblxuICAvLyB0aGVyZSBhcmUgYWxvdCBvZiB2YXJpYWJsZXMgYmVpbmcgdXNlZCBiZWxvdyB0byB0cmFjayB3aGVyZSBpbiB0aGUgY29udGV4dCB0aGUgbmV3XG4gIC8vIGJpbmRpbmcgdmFsdWVzIHdpbGwgYmUgcGxhY2VkLiBCZWNhdXNlIHRoZSBjb250ZXh0IGNvbnNpc3RzIG9mIG11bHRpcGxlIHR5cGVzIG9mXG4gIC8vIGVudHJpZXMgKHNpbmdsZSBjbGFzc2VzL3N0eWxlcyBhbmQgbXVsdGkgY2xhc3Nlcy9zdHlsZXMpIGFsb3Qgb2YgdGhlIGluZGV4IHBvc2l0aW9uc1xuICAvLyBuZWVkIHRvIGJlIGNvbXB1dGVkIGFoZWFkIG9mIHRpbWUgYW5kIHRoZSBjb250ZXh0IG5lZWRzIHRvIGJlIGV4dGVuZGVkIGJlZm9yZSB0aGUgdmFsdWVzXG4gIC8vIGFyZSBpbnNlcnRlZCBpbi5cbiAgY29uc3Qgc2luZ2xlUHJvcE9mZnNldFZhbHVlcyA9IGNvbnRleHRbU3R5bGluZ0luZGV4LlNpbmdsZVByb3BPZmZzZXRQb3NpdGlvbnNdO1xuICBjb25zdCB0b3RhbEN1cnJlbnRDbGFzc0JpbmRpbmdzID1cbiAgICAgIHNpbmdsZVByb3BPZmZzZXRWYWx1ZXNbU2luZ2xlUHJvcE9mZnNldFZhbHVlc0luZGV4LkNsYXNzZXNDb3VudFBvc2l0aW9uXTtcbiAgY29uc3QgdG90YWxDdXJyZW50U3R5bGVCaW5kaW5ncyA9XG4gICAgICBzaW5nbGVQcm9wT2Zmc2V0VmFsdWVzW1NpbmdsZVByb3BPZmZzZXRWYWx1ZXNJbmRleC5TdHlsZXNDb3VudFBvc2l0aW9uXTtcblxuICBjb25zdCBjYWNoZWRDbGFzc01hcFZhbHVlcyA9IGNvbnRleHRbU3R5bGluZ0luZGV4LkNhY2hlZE11bHRpQ2xhc3Nlc107XG4gIGNvbnN0IGNhY2hlZFN0eWxlTWFwVmFsdWVzID0gY29udGV4dFtTdHlsaW5nSW5kZXguQ2FjaGVkTXVsdGlTdHlsZXNdO1xuXG4gIGNvbnN0IGNsYXNzZXNPZmZzZXQgPSB0b3RhbEN1cnJlbnRDbGFzc0JpbmRpbmdzICogU3R5bGluZ0luZGV4LlNpemU7XG4gIGNvbnN0IHN0eWxlc09mZnNldCA9IHRvdGFsQ3VycmVudFN0eWxlQmluZGluZ3MgKiBTdHlsaW5nSW5kZXguU2l6ZTtcblxuICBjb25zdCBzaW5nbGVTdHlsZXNTdGFydEluZGV4ID0gU3R5bGluZ0luZGV4LlNpbmdsZVN0eWxlc1N0YXJ0UG9zaXRpb247XG4gIGxldCBzaW5nbGVDbGFzc2VzU3RhcnRJbmRleCA9IHNpbmdsZVN0eWxlc1N0YXJ0SW5kZXggKyBzdHlsZXNPZmZzZXQ7XG4gIGxldCBtdWx0aVN0eWxlc1N0YXJ0SW5kZXggPSBzaW5nbGVDbGFzc2VzU3RhcnRJbmRleCArIGNsYXNzZXNPZmZzZXQ7XG4gIGxldCBtdWx0aUNsYXNzZXNTdGFydEluZGV4ID0gbXVsdGlTdHlsZXNTdGFydEluZGV4ICsgc3R5bGVzT2Zmc2V0O1xuXG4gIC8vIGJlY2F1c2Ugd2UncmUgaW5zZXJ0aW5nIG1vcmUgYmluZGluZ3MgaW50byB0aGUgY29udGV4dCwgdGhpcyBtZWFucyB0aGF0IHRoZVxuICAvLyBiaW5kaW5nIHZhbHVlcyBuZWVkIHRvIGJlIHJlZmVyZW5jZWQgdGhlIHNpbmdsZVByb3BPZmZzZXRWYWx1ZXMgYXJyYXkgc28gdGhhdFxuICAvLyB0aGUgdGVtcGxhdGUvZGlyZWN0aXZlIGNhbiBlYXNpbHkgZmluZCB0aGVtIGluc2lkZSBvZiB0aGUgYGVsZW1lbnRTdHlsZVByb3BgXG4gIC8vIGFuZCB0aGUgYGVsZW1lbnRDbGFzc1Byb3BgIGZ1bmN0aW9ucyB3aXRob3V0IGl0ZXJhdGluZyB0aHJvdWdoIHRoZSBlbnRpcmUgY29udGV4dC5cbiAgLy8gVGhlIGZpcnN0IHN0ZXAgdG8gc2V0dGluZyB1cCB0aGVzZSByZWZlcmVuY2UgcG9pbnRzIGlzIHRvIG1hcmsgaG93IG1hbnkgYmluZGluZ3NcbiAgLy8gYXJlIGJlaW5nIGFkZGVkLiBFdmVuIGlmIHRoZXNlIGJpbmRpbmdzIGFscmVhZHkgZXhpc3QgaW4gdGhlIGNvbnRleHQsIHRoZSBkaXJlY3RpdmVcbiAgLy8gb3IgdGVtcGxhdGUgY29kZSB3aWxsIHN0aWxsIGNhbGwgdGhlbSB1bmtub3dpbmdseS4gVGhlcmVmb3JlIHRoZSB0b3RhbCB2YWx1ZXMgbmVlZFxuICAvLyB0byBiZSByZWdpc3RlcmVkIHNvIHRoYXQgd2Uga25vdyBob3cgbWFueSBiaW5kaW5ncyBhcmUgYXNzaWduZWQgdG8gZWFjaCBkaXJlY3RpdmUuXG4gIGNvbnN0IGN1cnJlbnRTaW5nbGVQcm9wc0xlbmd0aCA9IHNpbmdsZVByb3BPZmZzZXRWYWx1ZXMubGVuZ3RoO1xuICBzaW5nbGVQcm9wT2Zmc2V0VmFsdWVzLnB1c2goXG4gICAgICBzdHlsZUJpbmRpbmdOYW1lcyA/IHN0eWxlQmluZGluZ05hbWVzLmxlbmd0aCA6IDAsXG4gICAgICBjbGFzc0JpbmRpbmdOYW1lcyA/IGNsYXNzQmluZGluZ05hbWVzLmxlbmd0aCA6IDApO1xuXG4gIC8vIHRoZSBjb2RlIGJlbG93IHdpbGwgY2hlY2sgdG8gc2VlIGlmIGEgbmV3IHN0eWxlIGJpbmRpbmcgYWxyZWFkeSBleGlzdHMgaW4gdGhlIGNvbnRleHRcbiAgLy8gaWYgc28gdGhlbiB0aGVyZSBpcyBubyBwb2ludCBpbiBpbnNlcnRpbmcgaXQgaW50byB0aGUgY29udGV4dCBhZ2Fpbi4gV2hldGhlciBvciBub3QgaXRcbiAgLy8gZXhpc3RzIHRoZSBzdHlsaW5nIG9mZnNldCBjb2RlIHdpbGwgbm93IGtub3cgZXhhY3RseSB3aGVyZSBpdCBpc1xuICBsZXQgaW5zZXJ0aW9uT2Zmc2V0ID0gMDtcbiAgY29uc3QgZmlsdGVyZWRTdHlsZUJpbmRpbmdOYW1lczogc3RyaW5nW10gPSBbXTtcbiAgaWYgKHN0eWxlQmluZGluZ05hbWVzICYmIHN0eWxlQmluZGluZ05hbWVzLmxlbmd0aCkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc3R5bGVCaW5kaW5nTmFtZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IG5hbWUgPSBzdHlsZUJpbmRpbmdOYW1lc1tpXTtcbiAgICAgIGxldCBzaW5nbGVQcm9wSW5kZXggPVxuICAgICAgICAgIGdldE1hdGNoaW5nQmluZGluZ0luZGV4KGNvbnRleHQsIG5hbWUsIHNpbmdsZVN0eWxlc1N0YXJ0SW5kZXgsIHNpbmdsZUNsYXNzZXNTdGFydEluZGV4KTtcbiAgICAgIGlmIChzaW5nbGVQcm9wSW5kZXggPT0gLTEpIHtcbiAgICAgICAgc2luZ2xlUHJvcEluZGV4ID0gc2luZ2xlQ2xhc3Nlc1N0YXJ0SW5kZXggKyBpbnNlcnRpb25PZmZzZXQ7XG4gICAgICAgIGluc2VydGlvbk9mZnNldCArPSBTdHlsaW5nSW5kZXguU2l6ZTtcbiAgICAgICAgZmlsdGVyZWRTdHlsZUJpbmRpbmdOYW1lcy5wdXNoKG5hbWUpO1xuICAgICAgfVxuICAgICAgc2luZ2xlUHJvcE9mZnNldFZhbHVlcy5wdXNoKHNpbmdsZVByb3BJbmRleCk7XG4gICAgfVxuICB9XG5cbiAgLy8ganVzdCBsaWtlIHdpdGggdGhlIHN0eWxlIGJpbmRpbmcgbG9vcCBhYm92ZSwgdGhlIG5ldyBjbGFzcyBiaW5kaW5ncyBnZXQgdGhlIHNhbWUgdHJlYXRtZW50Li4uXG4gIGNvbnN0IGZpbHRlcmVkQ2xhc3NCaW5kaW5nTmFtZXM6IHN0cmluZ1tdID0gW107XG4gIGlmIChjbGFzc0JpbmRpbmdOYW1lcyAmJiBjbGFzc0JpbmRpbmdOYW1lcy5sZW5ndGgpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNsYXNzQmluZGluZ05hbWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBuYW1lID0gY2xhc3NCaW5kaW5nTmFtZXNbaV07XG4gICAgICBsZXQgc2luZ2xlUHJvcEluZGV4ID1cbiAgICAgICAgICBnZXRNYXRjaGluZ0JpbmRpbmdJbmRleChjb250ZXh0LCBuYW1lLCBzaW5nbGVDbGFzc2VzU3RhcnRJbmRleCwgbXVsdGlTdHlsZXNTdGFydEluZGV4KTtcbiAgICAgIGlmIChzaW5nbGVQcm9wSW5kZXggPT0gLTEpIHtcbiAgICAgICAgc2luZ2xlUHJvcEluZGV4ID0gbXVsdGlTdHlsZXNTdGFydEluZGV4ICsgaW5zZXJ0aW9uT2Zmc2V0O1xuICAgICAgICBpbnNlcnRpb25PZmZzZXQgKz0gU3R5bGluZ0luZGV4LlNpemU7XG4gICAgICAgIGZpbHRlcmVkQ2xhc3NCaW5kaW5nTmFtZXMucHVzaChuYW1lKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNpbmdsZVByb3BJbmRleCArPSBmaWx0ZXJlZFN0eWxlQmluZGluZ05hbWVzLmxlbmd0aCAqIFN0eWxpbmdJbmRleC5TaXplO1xuICAgICAgfVxuICAgICAgc2luZ2xlUHJvcE9mZnNldFZhbHVlcy5wdXNoKHNpbmdsZVByb3BJbmRleCk7XG4gICAgfVxuICB9XG5cbiAgLy8gYmVjYXVzZSBuZXcgc3R5bGVzIGFyZSBiZWluZyBpbnNlcnRlZCwgdGhpcyBtZWFucyB0aGUgZXhpc3RpbmcgY29sbGVjdGlvbiBvZiBzdHlsZSBvZmZzZXRcbiAgLy8gaW5kZXggdmFsdWVzIGFyZSBpbmNvcnJlY3QgKHRoZXkgcG9pbnQgdG8gdGhlIHdyb25nIHZhbHVlcykuIFRoZSBjb2RlIGJlbG93IHdpbGwgcnVuIHRocm91Z2hcbiAgLy8gdGhlIGVudGlyZSBvZmZzZXQgYXJyYXkgYW5kIHVwZGF0ZSB0aGUgZXhpc3Rpbmcgc2V0IG9mIGluZGV4IHZhbHVlcyB0byBwb2ludCB0byB0aGVpciBuZXdcbiAgLy8gbG9jYXRpb25zIHdoaWxlIHRha2luZyB0aGUgbmV3IGJpbmRpbmcgdmFsdWVzIGludG8gY29uc2lkZXJhdGlvbi5cbiAgbGV0IGkgPSBTaW5nbGVQcm9wT2Zmc2V0VmFsdWVzSW5kZXguVmFsdWVTdGFydFBvc2l0aW9uO1xuICBpZiAoZmlsdGVyZWRTdHlsZUJpbmRpbmdOYW1lcy5sZW5ndGgpIHtcbiAgICB3aGlsZSAoaSA8IGN1cnJlbnRTaW5nbGVQcm9wc0xlbmd0aCkge1xuICAgICAgY29uc3QgdG90YWxTdHlsZXMgPVxuICAgICAgICAgIHNpbmdsZVByb3BPZmZzZXRWYWx1ZXNbaSArIFNpbmdsZVByb3BPZmZzZXRWYWx1ZXNJbmRleC5TdHlsZXNDb3VudFBvc2l0aW9uXTtcbiAgICAgIGNvbnN0IHRvdGFsQ2xhc3NlcyA9XG4gICAgICAgICAgc2luZ2xlUHJvcE9mZnNldFZhbHVlc1tpICsgU2luZ2xlUHJvcE9mZnNldFZhbHVlc0luZGV4LkNsYXNzZXNDb3VudFBvc2l0aW9uXTtcbiAgICAgIGlmICh0b3RhbENsYXNzZXMpIHtcbiAgICAgICAgY29uc3Qgc3RhcnQgPSBpICsgU2luZ2xlUHJvcE9mZnNldFZhbHVlc0luZGV4LlZhbHVlU3RhcnRQb3NpdGlvbiArIHRvdGFsU3R5bGVzO1xuICAgICAgICBmb3IgKGxldCBqID0gc3RhcnQ7IGogPCBzdGFydCArIHRvdGFsQ2xhc3NlczsgaisrKSB7XG4gICAgICAgICAgc2luZ2xlUHJvcE9mZnNldFZhbHVlc1tqXSArPSBmaWx0ZXJlZFN0eWxlQmluZGluZ05hbWVzLmxlbmd0aCAqIFN0eWxpbmdJbmRleC5TaXplO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHRvdGFsID0gdG90YWxTdHlsZXMgKyB0b3RhbENsYXNzZXM7XG4gICAgICBpICs9IFNpbmdsZVByb3BPZmZzZXRWYWx1ZXNJbmRleC5WYWx1ZVN0YXJ0UG9zaXRpb24gKyB0b3RhbDtcbiAgICB9XG4gIH1cblxuICBjb25zdCB0b3RhbE5ld0VudHJpZXMgPSBmaWx0ZXJlZENsYXNzQmluZGluZ05hbWVzLmxlbmd0aCArIGZpbHRlcmVkU3R5bGVCaW5kaW5nTmFtZXMubGVuZ3RoO1xuXG4gIC8vIGluIHRoZSBldmVudCB0aGF0IHRoZXJlIGFyZSBuZXcgc3R5bGUgdmFsdWVzIGJlaW5nIGluc2VydGVkLCBhbGwgZXhpc3RpbmcgY2xhc3MgYW5kIHN0eWxlXG4gIC8vIGJpbmRpbmdzIG5lZWQgdG8gaGF2ZSB0aGVpciBwb2ludGVyIHZhbHVlcyBvZmZzZXR0ZWQgd2l0aCB0aGUgbmV3IGFtb3VudCBvZiBzcGFjZSB0aGF0IGlzXG4gIC8vIHVzZWQgZm9yIHRoZSBuZXcgc3R5bGUvY2xhc3MgYmluZGluZ3MuXG4gIGZvciAobGV0IGkgPSBzaW5nbGVTdHlsZXNTdGFydEluZGV4OyBpIDwgY29udGV4dC5sZW5ndGg7IGkgKz0gU3R5bGluZ0luZGV4LlNpemUpIHtcbiAgICBjb25zdCBpc011bHRpQmFzZWQgPSBpID49IG11bHRpU3R5bGVzU3RhcnRJbmRleDtcbiAgICBjb25zdCBpc0NsYXNzQmFzZWQgPSBpID49IChpc011bHRpQmFzZWQgPyBtdWx0aUNsYXNzZXNTdGFydEluZGV4IDogc2luZ2xlQ2xhc3Nlc1N0YXJ0SW5kZXgpO1xuICAgIGNvbnN0IGZsYWcgPSBnZXRQb2ludGVycyhjb250ZXh0LCBpKTtcbiAgICBjb25zdCBzdGF0aWNJbmRleCA9IGdldEluaXRpYWxJbmRleChmbGFnKTtcbiAgICBsZXQgc2luZ2xlT3JNdWx0aUluZGV4ID0gZ2V0TXVsdGlPclNpbmdsZUluZGV4KGZsYWcpO1xuICAgIGlmIChpc011bHRpQmFzZWQpIHtcbiAgICAgIHNpbmdsZU9yTXVsdGlJbmRleCArPVxuICAgICAgICAgIGlzQ2xhc3NCYXNlZCA/IChmaWx0ZXJlZFN0eWxlQmluZGluZ05hbWVzLmxlbmd0aCAqIFN0eWxpbmdJbmRleC5TaXplKSA6IDA7XG4gICAgfSBlbHNlIHtcbiAgICAgIHNpbmdsZU9yTXVsdGlJbmRleCArPSAodG90YWxOZXdFbnRyaWVzICogU3R5bGluZ0luZGV4LlNpemUpICtcbiAgICAgICAgICAoKGlzQ2xhc3NCYXNlZCA/IGZpbHRlcmVkU3R5bGVCaW5kaW5nTmFtZXMubGVuZ3RoIDogMCkgKiBTdHlsaW5nSW5kZXguU2l6ZSk7XG4gICAgfVxuICAgIHNldEZsYWcoY29udGV4dCwgaSwgcG9pbnRlcnMoZmxhZywgc3RhdGljSW5kZXgsIHNpbmdsZU9yTXVsdGlJbmRleCkpO1xuICB9XG5cbiAgLy8gdGhpcyBpcyB3aGVyZSB3ZSBtYWtlIHNwYWNlIGluIHRoZSBjb250ZXh0IGZvciB0aGUgbmV3IHN0eWxlIGJpbmRpbmdzXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgZmlsdGVyZWRTdHlsZUJpbmRpbmdOYW1lcy5sZW5ndGggKiBTdHlsaW5nSW5kZXguU2l6ZTsgaSsrKSB7XG4gICAgY29udGV4dC5zcGxpY2UobXVsdGlDbGFzc2VzU3RhcnRJbmRleCwgMCwgbnVsbCk7XG4gICAgY29udGV4dC5zcGxpY2Uoc2luZ2xlQ2xhc3Nlc1N0YXJ0SW5kZXgsIDAsIG51bGwpO1xuICAgIHNpbmdsZUNsYXNzZXNTdGFydEluZGV4Kys7XG4gICAgbXVsdGlTdHlsZXNTdGFydEluZGV4Kys7XG4gICAgbXVsdGlDbGFzc2VzU3RhcnRJbmRleCArPSAyOyAgLy8gYm90aCBzaW5nbGUgKyBtdWx0aSBzbG90cyB3ZXJlIGluc2VydGVkXG4gIH1cblxuICAvLyB0aGlzIGlzIHdoZXJlIHdlIG1ha2Ugc3BhY2UgaW4gdGhlIGNvbnRleHQgZm9yIHRoZSBuZXcgY2xhc3MgYmluZGluZ3NcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBmaWx0ZXJlZENsYXNzQmluZGluZ05hbWVzLmxlbmd0aCAqIFN0eWxpbmdJbmRleC5TaXplOyBpKyspIHtcbiAgICBjb250ZXh0LnNwbGljZShtdWx0aVN0eWxlc1N0YXJ0SW5kZXgsIDAsIG51bGwpO1xuICAgIGNvbnRleHQucHVzaChudWxsKTtcbiAgICBtdWx0aVN0eWxlc1N0YXJ0SW5kZXgrKztcbiAgICBtdWx0aUNsYXNzZXNTdGFydEluZGV4Kys7XG4gIH1cblxuICBjb25zdCBpbml0aWFsQ2xhc3NlcyA9IGNvbnRleHRbU3R5bGluZ0luZGV4LkluaXRpYWxDbGFzc1ZhbHVlc1Bvc2l0aW9uXTtcbiAgY29uc3QgaW5pdGlhbFN0eWxlcyA9IGNvbnRleHRbU3R5bGluZ0luZGV4LkluaXRpYWxTdHlsZVZhbHVlc1Bvc2l0aW9uXTtcblxuICAvLyB0aGUgY29kZSBiZWxvdyB3aWxsIGluc2VydCBlYWNoIG5ldyBlbnRyeSBpbnRvIHRoZSBjb250ZXh0IGFuZCBhc3NpZ24gdGhlIGFwcHJvcHJpYXRlXG4gIC8vIGZsYWdzIGFuZCBpbmRleCB2YWx1ZXMgdG8gdGhlbS4gSXQncyBpbXBvcnRhbnQgdGhpcyBydW5zIGF0IHRoZSBlbmQgb2YgdGhpcyBmdW5jdGlvblxuICAvLyBiZWNhdXNlIHRoZSBjb250ZXh0LCBwcm9wZXJ0eSBvZmZzZXQgYW5kIGluZGV4IHZhbHVlcyBoYXZlIGFsbCBiZWVuIGNvbXB1dGVkIGp1c3QgYmVmb3JlLlxuICBmb3IgKGxldCBpID0gMDsgaSA8IHRvdGFsTmV3RW50cmllczsgaSsrKSB7XG4gICAgY29uc3QgZW50cnlJc0NsYXNzQmFzZWQgPSBpID49IGZpbHRlcmVkU3R5bGVCaW5kaW5nTmFtZXMubGVuZ3RoO1xuICAgIGNvbnN0IGFkanVzdGVkSW5kZXggPSBlbnRyeUlzQ2xhc3NCYXNlZCA/IChpIC0gZmlsdGVyZWRTdHlsZUJpbmRpbmdOYW1lcy5sZW5ndGgpIDogaTtcbiAgICBjb25zdCBwcm9wTmFtZSA9IGVudHJ5SXNDbGFzc0Jhc2VkID8gZmlsdGVyZWRDbGFzc0JpbmRpbmdOYW1lc1thZGp1c3RlZEluZGV4XSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpbHRlcmVkU3R5bGVCaW5kaW5nTmFtZXNbYWRqdXN0ZWRJbmRleF07XG5cbiAgICBsZXQgbXVsdGlJbmRleCwgc2luZ2xlSW5kZXg7XG4gICAgaWYgKGVudHJ5SXNDbGFzc0Jhc2VkKSB7XG4gICAgICBtdWx0aUluZGV4ID0gbXVsdGlDbGFzc2VzU3RhcnRJbmRleCArXG4gICAgICAgICAgKCh0b3RhbEN1cnJlbnRDbGFzc0JpbmRpbmdzICsgYWRqdXN0ZWRJbmRleCkgKiBTdHlsaW5nSW5kZXguU2l6ZSk7XG4gICAgICBzaW5nbGVJbmRleCA9IHNpbmdsZUNsYXNzZXNTdGFydEluZGV4ICtcbiAgICAgICAgICAoKHRvdGFsQ3VycmVudENsYXNzQmluZGluZ3MgKyBhZGp1c3RlZEluZGV4KSAqIFN0eWxpbmdJbmRleC5TaXplKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbXVsdGlJbmRleCA9XG4gICAgICAgICAgbXVsdGlTdHlsZXNTdGFydEluZGV4ICsgKCh0b3RhbEN1cnJlbnRTdHlsZUJpbmRpbmdzICsgYWRqdXN0ZWRJbmRleCkgKiBTdHlsaW5nSW5kZXguU2l6ZSk7XG4gICAgICBzaW5nbGVJbmRleCA9IHNpbmdsZVN0eWxlc1N0YXJ0SW5kZXggK1xuICAgICAgICAgICgodG90YWxDdXJyZW50U3R5bGVCaW5kaW5ncyArIGFkanVzdGVkSW5kZXgpICogU3R5bGluZ0luZGV4LlNpemUpO1xuICAgIH1cblxuICAgIC8vIGlmIGEgcHJvcGVydHkgaXMgbm90IGZvdW5kIGluIHRoZSBpbml0aWFsIHN0eWxlIHZhbHVlcyBsaXN0IHRoZW4gaXRcbiAgICAvLyBpcyBBTFdBWVMgYWRkZWQgaW5jYXNlIGEgZm9sbG93LXVwIGRpcmVjdGl2ZSBpbnRyb2R1Y2VzIHRoZSBzYW1lIGluaXRpYWxcbiAgICAvLyBzdHlsZS9jbGFzcyB2YWx1ZSBsYXRlciBvbi5cbiAgICBsZXQgaW5pdGlhbFZhbHVlc1RvTG9va3VwID0gZW50cnlJc0NsYXNzQmFzZWQgPyBpbml0aWFsQ2xhc3NlcyA6IGluaXRpYWxTdHlsZXM7XG4gICAgbGV0IGluZGV4Rm9ySW5pdGlhbCA9IGdldEluaXRpYWxTdHlsaW5nVmFsdWVzSW5kZXhPZihpbml0aWFsVmFsdWVzVG9Mb29rdXAsIHByb3BOYW1lKTtcbiAgICBpZiAoaW5kZXhGb3JJbml0aWFsID09PSAtMSkge1xuICAgICAgaW5kZXhGb3JJbml0aWFsID0gaW5pdGlhbFZhbHVlc1RvTG9va3VwLmxlbmd0aCArIEluaXRpYWxTdHlsaW5nVmFsdWVzSW5kZXguVmFsdWVPZmZzZXQ7XG4gICAgICBpbml0aWFsVmFsdWVzVG9Mb29rdXAucHVzaChwcm9wTmFtZSwgZW50cnlJc0NsYXNzQmFzZWQgPyBmYWxzZSA6IG51bGwpO1xuICAgIH0gZWxzZSB7XG4gICAgICBpbmRleEZvckluaXRpYWwgKz0gSW5pdGlhbFN0eWxpbmdWYWx1ZXNJbmRleC5WYWx1ZU9mZnNldDtcbiAgICB9XG5cbiAgICBjb25zdCBpbml0aWFsRmxhZyA9XG4gICAgICAgIHByZXBhcmVJbml0aWFsRmxhZyhjb250ZXh0LCBwcm9wTmFtZSwgZW50cnlJc0NsYXNzQmFzZWQsIHN0eWxlU2FuaXRpemVyIHx8IG51bGwpO1xuXG4gICAgc2V0RmxhZyhjb250ZXh0LCBzaW5nbGVJbmRleCwgcG9pbnRlcnMoaW5pdGlhbEZsYWcsIGluZGV4Rm9ySW5pdGlhbCwgbXVsdGlJbmRleCkpO1xuICAgIHNldFByb3AoY29udGV4dCwgc2luZ2xlSW5kZXgsIHByb3BOYW1lKTtcbiAgICBzZXRWYWx1ZShjb250ZXh0LCBzaW5nbGVJbmRleCwgbnVsbCk7XG4gICAgc2V0UGxheWVyQnVpbGRlckluZGV4KGNvbnRleHQsIHNpbmdsZUluZGV4LCAwLCBkaXJlY3RpdmVJbmRleCk7XG5cbiAgICBzZXRGbGFnKGNvbnRleHQsIG11bHRpSW5kZXgsIHBvaW50ZXJzKGluaXRpYWxGbGFnLCBpbmRleEZvckluaXRpYWwsIHNpbmdsZUluZGV4KSk7XG4gICAgc2V0UHJvcChjb250ZXh0LCBtdWx0aUluZGV4LCBwcm9wTmFtZSk7XG4gICAgc2V0VmFsdWUoY29udGV4dCwgbXVsdGlJbmRleCwgbnVsbCk7XG4gICAgc2V0UGxheWVyQnVpbGRlckluZGV4KGNvbnRleHQsIG11bHRpSW5kZXgsIDAsIGRpcmVjdGl2ZUluZGV4KTtcbiAgfVxuXG4gIC8vIHRoZSB0b3RhbCBjbGFzc2VzL3N0eWxlIHZhbHVlcyBhcmUgdXBkYXRlZCBzbyB0aGUgbmV4dCB0aW1lIHRoZSBjb250ZXh0IGlzIHBhdGNoZWRcbiAgLy8gYWRkaXRpb25hbCBzdHlsZS9jbGFzcyBiaW5kaW5ncyBmcm9tIGFub3RoZXIgZGlyZWN0aXZlIHRoZW4gaXQga25vd3MgZXhhY3RseSB3aGVyZVxuICAvLyB0byBpbnNlcnQgdGhlbSBpbiB0aGUgY29udGV4dFxuICBzaW5nbGVQcm9wT2Zmc2V0VmFsdWVzW1NpbmdsZVByb3BPZmZzZXRWYWx1ZXNJbmRleC5DbGFzc2VzQ291bnRQb3NpdGlvbl0gPVxuICAgICAgdG90YWxDdXJyZW50Q2xhc3NCaW5kaW5ncyArIGZpbHRlcmVkQ2xhc3NCaW5kaW5nTmFtZXMubGVuZ3RoO1xuICBzaW5nbGVQcm9wT2Zmc2V0VmFsdWVzW1NpbmdsZVByb3BPZmZzZXRWYWx1ZXNJbmRleC5TdHlsZXNDb3VudFBvc2l0aW9uXSA9XG4gICAgICB0b3RhbEN1cnJlbnRTdHlsZUJpbmRpbmdzICsgZmlsdGVyZWRTdHlsZUJpbmRpbmdOYW1lcy5sZW5ndGg7XG5cbiAgLy8gdGhlIG1hcC1iYXNlZCB2YWx1ZXMgYWxzbyBuZWVkIHRvIGtub3cgaG93IG1hbnkgZW50cmllcyBnb3QgaW5zZXJ0ZWRcbiAgY2FjaGVkQ2xhc3NNYXBWYWx1ZXNbTWFwQmFzZWRPZmZzZXRWYWx1ZXNJbmRleC5FbnRyaWVzQ291bnRQb3NpdGlvbl0gKz1cbiAgICAgIGZpbHRlcmVkQ2xhc3NCaW5kaW5nTmFtZXMubGVuZ3RoO1xuICBjYWNoZWRTdHlsZU1hcFZhbHVlc1tNYXBCYXNlZE9mZnNldFZhbHVlc0luZGV4LkVudHJpZXNDb3VudFBvc2l0aW9uXSArPVxuICAgICAgZmlsdGVyZWRTdHlsZUJpbmRpbmdOYW1lcy5sZW5ndGg7XG4gIGNvbnN0IG5ld1N0eWxlc1NwYWNlQWxsb2NhdGlvblNpemUgPSBmaWx0ZXJlZFN0eWxlQmluZGluZ05hbWVzLmxlbmd0aCAqIFN0eWxpbmdJbmRleC5TaXplO1xuICBjb25zdCBuZXdDbGFzc2VzU3BhY2VBbGxvY2F0aW9uU2l6ZSA9IGZpbHRlcmVkQ2xhc3NCaW5kaW5nTmFtZXMubGVuZ3RoICogU3R5bGluZ0luZGV4LlNpemU7XG5cbiAgLy8gdXBkYXRlIHRoZSBtdWx0aSBzdHlsZXMgY2FjaGUgd2l0aCBhIHJlZmVyZW5jZSBmb3IgdGhlIGRpcmVjdGl2ZSB0aGF0IHdhcyBqdXN0IGluc2VydGVkXG4gIGNvbnN0IGRpcmVjdGl2ZU11bHRpU3R5bGVzU3RhcnRJbmRleCA9XG4gICAgICBtdWx0aVN0eWxlc1N0YXJ0SW5kZXggKyB0b3RhbEN1cnJlbnRTdHlsZUJpbmRpbmdzICogU3R5bGluZ0luZGV4LlNpemU7XG4gIGNvbnN0IGNhY2hlZFN0eWxlTWFwSW5kZXggPSBjYWNoZWRTdHlsZU1hcFZhbHVlcy5sZW5ndGg7XG4gIHJlZ2lzdGVyTXVsdGlNYXBFbnRyeShcbiAgICAgIGNvbnRleHQsIGRpcmVjdGl2ZUluZGV4LCBmYWxzZSwgZGlyZWN0aXZlTXVsdGlTdHlsZXNTdGFydEluZGV4LFxuICAgICAgZmlsdGVyZWRTdHlsZUJpbmRpbmdOYW1lcy5sZW5ndGgpO1xuXG4gIGZvciAobGV0IGkgPSBNYXBCYXNlZE9mZnNldFZhbHVlc0luZGV4LlZhbHVlc1N0YXJ0UG9zaXRpb247IGkgPCBjYWNoZWRTdHlsZU1hcEluZGV4O1xuICAgICAgIGkgKz0gTWFwQmFzZWRPZmZzZXRWYWx1ZXNJbmRleC5TaXplKSB7XG4gICAgLy8gbXVsdGkgdmFsdWVzIHN0YXJ0IGFmdGVyIGFsbCB0aGUgc2luZ2xlIHZhbHVlcyAod2hpY2ggaXMgYWxzbyB3aGVyZSBjbGFzc2VzIGFyZSkgaW4gdGhlXG4gICAgLy8gY29udGV4dCB0aGVyZWZvcmUgdGhlIG5ldyBjbGFzcyBhbGxvY2F0aW9uIHNpemUgc2hvdWxkIGJlIHRha2VuIGludG8gYWNjb3VudFxuICAgIGNhY2hlZFN0eWxlTWFwVmFsdWVzW2kgKyBNYXBCYXNlZE9mZnNldFZhbHVlc0luZGV4LlBvc2l0aW9uU3RhcnRPZmZzZXRdICs9XG4gICAgICAgIG5ld0NsYXNzZXNTcGFjZUFsbG9jYXRpb25TaXplICsgbmV3U3R5bGVzU3BhY2VBbGxvY2F0aW9uU2l6ZTtcbiAgfVxuXG4gIC8vIHVwZGF0ZSB0aGUgbXVsdGkgY2xhc3NlcyBjYWNoZSB3aXRoIGEgcmVmZXJlbmNlIGZvciB0aGUgZGlyZWN0aXZlIHRoYXQgd2FzIGp1c3QgaW5zZXJ0ZWRcbiAgY29uc3QgZGlyZWN0aXZlTXVsdGlDbGFzc2VzU3RhcnRJbmRleCA9XG4gICAgICBtdWx0aUNsYXNzZXNTdGFydEluZGV4ICsgdG90YWxDdXJyZW50Q2xhc3NCaW5kaW5ncyAqIFN0eWxpbmdJbmRleC5TaXplO1xuICBjb25zdCBjYWNoZWRDbGFzc01hcEluZGV4ID0gY2FjaGVkQ2xhc3NNYXBWYWx1ZXMubGVuZ3RoO1xuICByZWdpc3Rlck11bHRpTWFwRW50cnkoXG4gICAgICBjb250ZXh0LCBkaXJlY3RpdmVJbmRleCwgdHJ1ZSwgZGlyZWN0aXZlTXVsdGlDbGFzc2VzU3RhcnRJbmRleCxcbiAgICAgIGZpbHRlcmVkQ2xhc3NCaW5kaW5nTmFtZXMubGVuZ3RoKTtcblxuICBmb3IgKGxldCBpID0gTWFwQmFzZWRPZmZzZXRWYWx1ZXNJbmRleC5WYWx1ZXNTdGFydFBvc2l0aW9uOyBpIDwgY2FjaGVkQ2xhc3NNYXBJbmRleDtcbiAgICAgICBpICs9IE1hcEJhc2VkT2Zmc2V0VmFsdWVzSW5kZXguU2l6ZSkge1xuICAgIC8vIHRoZSByZWFzb24gd2h5IGJvdGggdGhlIHN0eWxlcyArIGNsYXNzZXMgc3BhY2UgaXMgYWxsb2NhdGVkIHRvIHRoZSBleGlzdGluZyBvZmZzZXRzIGlzXG4gICAgLy8gYmVjYXVzZSB0aGUgc3R5bGVzIHNob3cgdXAgYmVmb3JlIHRoZSBjbGFzc2VzIGluIHRoZSBjb250ZXh0IGFuZCBhbnkgbmV3IGluc2VydGVkXG4gICAgLy8gc3R5bGVzIHdpbGwgb2Zmc2V0IGFueSBleGlzdGluZyBjbGFzcyBlbnRyaWVzIGluIHRoZSBjb250ZXh0IChldmVuIGlmIHRoZXJlIGFyZSBub1xuICAgIC8vIG5ldyBjbGFzcyBlbnRyaWVzIGFkZGVkKSBhbHNvIHRoZSByZWFzb24gd2h5IGl0J3MgKjIgaXMgYmVjYXVzZSBib3RoIHNpbmdsZSArIG11bHRpXG4gICAgLy8gZW50cmllcyBmb3IgZWFjaCBuZXcgc3R5bGUgaGF2ZSBiZWVuIGFkZGVkIGluIHRoZSBjb250ZXh0IGJlZm9yZSB0aGUgbXVsdGkgY2xhc3MgdmFsdWVzXG4gICAgLy8gYWN0dWFsbHkgc3RhcnRcbiAgICBjYWNoZWRDbGFzc01hcFZhbHVlc1tpICsgTWFwQmFzZWRPZmZzZXRWYWx1ZXNJbmRleC5Qb3NpdGlvblN0YXJ0T2Zmc2V0XSArPVxuICAgICAgICAobmV3U3R5bGVzU3BhY2VBbGxvY2F0aW9uU2l6ZSAqIDIpICsgbmV3Q2xhc3Nlc1NwYWNlQWxsb2NhdGlvblNpemU7XG4gIH1cblxuICAvLyB0aGVyZSBpcyBubyBpbml0aWFsIHZhbHVlIGZsYWcgZm9yIHRoZSBtYXN0ZXIgaW5kZXggc2luY2UgaXQgZG9lc24ndFxuICAvLyByZWZlcmVuY2UgYW4gaW5pdGlhbCBzdHlsZSB2YWx1ZVxuICBjb25zdCBtYXN0ZXJGbGFnID0gcG9pbnRlcnMoMCwgMCwgbXVsdGlTdHlsZXNTdGFydEluZGV4KTtcbiAgc2V0RmxhZyhjb250ZXh0LCBTdHlsaW5nSW5kZXguTWFzdGVyRmxhZ1Bvc2l0aW9uLCBtYXN0ZXJGbGFnKTtcbn1cblxuLyoqXG4gKiBTZWFyY2hlcyB0aHJvdWdoIHRoZSBleGlzdGluZyByZWdpc3RyeSBvZiBkaXJlY3RpdmVzXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBmaW5kT3JQYXRjaERpcmVjdGl2ZUludG9SZWdpc3RyeShcbiAgICBjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgZGlyZWN0aXZlUmVmOiBhbnksIHN0eWxlU2FuaXRpemVyPzogU3R5bGVTYW5pdGl6ZUZuIHwgbnVsbCkge1xuICBjb25zdCBkaXJlY3RpdmVSZWZzID0gY29udGV4dFtTdHlsaW5nSW5kZXguRGlyZWN0aXZlUmVnaXN0cnlQb3NpdGlvbl07XG4gIGNvbnN0IG5leHRPZmZzZXRJbnNlcnRpb25JbmRleCA9IGNvbnRleHRbU3R5bGluZ0luZGV4LlNpbmdsZVByb3BPZmZzZXRQb3NpdGlvbnNdLmxlbmd0aDtcblxuICBsZXQgZGlyZWN0aXZlSW5kZXg6IG51bWJlcjtcbiAgbGV0IGRldGVjdGVkSW5kZXggPSBnZXREaXJlY3RpdmVSZWdpc3RyeVZhbHVlc0luZGV4T2YoZGlyZWN0aXZlUmVmcywgZGlyZWN0aXZlUmVmKTtcblxuICBpZiAoZGV0ZWN0ZWRJbmRleCA9PT0gLTEpIHtcbiAgICBkZXRlY3RlZEluZGV4ID0gZGlyZWN0aXZlUmVmcy5sZW5ndGg7XG4gICAgZGlyZWN0aXZlSW5kZXggPSBkaXJlY3RpdmVSZWZzLmxlbmd0aCAvIERpcmVjdGl2ZVJlZ2lzdHJ5VmFsdWVzSW5kZXguU2l6ZTtcblxuICAgIGFsbG9jYXRlRGlyZWN0aXZlSW50b0NvbnRleHQoY29udGV4dCwgZGlyZWN0aXZlUmVmKTtcbiAgICBkaXJlY3RpdmVSZWZzW2RldGVjdGVkSW5kZXggKyBEaXJlY3RpdmVSZWdpc3RyeVZhbHVlc0luZGV4LlNpbmdsZVByb3BWYWx1ZXNJbmRleE9mZnNldF0gPVxuICAgICAgICBuZXh0T2Zmc2V0SW5zZXJ0aW9uSW5kZXg7XG4gICAgZGlyZWN0aXZlUmVmc1tkZXRlY3RlZEluZGV4ICsgRGlyZWN0aXZlUmVnaXN0cnlWYWx1ZXNJbmRleC5TdHlsZVNhbml0aXplck9mZnNldF0gPVxuICAgICAgICBzdHlsZVNhbml0aXplciB8fCBudWxsO1xuICB9IGVsc2Uge1xuICAgIGNvbnN0IHNpbmdsZVByb3BTdGFydFBvc2l0aW9uID1cbiAgICAgICAgZGV0ZWN0ZWRJbmRleCArIERpcmVjdGl2ZVJlZ2lzdHJ5VmFsdWVzSW5kZXguU2luZ2xlUHJvcFZhbHVlc0luZGV4T2Zmc2V0O1xuICAgIGlmIChkaXJlY3RpdmVSZWZzW3NpbmdsZVByb3BTdGFydFBvc2l0aW9uXSAhID49IDApIHtcbiAgICAgIC8vIHRoZSBkaXJlY3RpdmUgaGFzIGFscmVhZHkgYmVlbiBwYXRjaGVkIGludG8gdGhlIGNvbnRleHRcbiAgICAgIHJldHVybiAtMTtcbiAgICB9XG5cbiAgICBkaXJlY3RpdmVJbmRleCA9IGRldGVjdGVkSW5kZXggLyBEaXJlY3RpdmVSZWdpc3RyeVZhbHVlc0luZGV4LlNpemU7XG5cbiAgICAvLyBiZWNhdXNlIHRoZSBkaXJlY3RpdmUgYWxyZWFkeSBleGlzdGVkIHRoaXMgbWVhbnMgdGhhdCBpdCB3YXMgc2V0IGR1cmluZyBlbGVtZW50SG9zdEF0dHJzIG9yXG4gICAgLy8gZWxlbWVudFN0YXJ0IHdoaWNoIG1lYW5zIHRoYXQgdGhlIGJpbmRpbmcgdmFsdWVzIHdlcmUgbm90IGhlcmUuIFRoZXJlZm9yZSwgdGhlIHZhbHVlcyBiZWxvd1xuICAgIC8vIG5lZWQgdG8gYmUgYXBwbGllZCBzbyB0aGF0IHNpbmdsZSBjbGFzcyBhbmQgc3R5bGUgcHJvcGVydGllcyBjYW4gYmUgYXNzaWduZWQgbGF0ZXIuXG4gICAgY29uc3Qgc2luZ2xlUHJvcFBvc2l0aW9uSW5kZXggPVxuICAgICAgICBkZXRlY3RlZEluZGV4ICsgRGlyZWN0aXZlUmVnaXN0cnlWYWx1ZXNJbmRleC5TaW5nbGVQcm9wVmFsdWVzSW5kZXhPZmZzZXQ7XG4gICAgZGlyZWN0aXZlUmVmc1tzaW5nbGVQcm9wUG9zaXRpb25JbmRleF0gPSBuZXh0T2Zmc2V0SW5zZXJ0aW9uSW5kZXg7XG5cbiAgICAvLyB0aGUgc2FuaXRpemVyIGlzIGFsc28gYXBhcnQgb2YgdGhlIGJpbmRpbmcgcHJvY2VzcyBhbmQgd2lsbCBiZSB1c2VkIHdoZW4gYmluZGluZ3MgYXJlXG4gICAgLy8gYXBwbGllZC5cbiAgICBjb25zdCBzdHlsZVNhbml0aXplckluZGV4ID0gZGV0ZWN0ZWRJbmRleCArIERpcmVjdGl2ZVJlZ2lzdHJ5VmFsdWVzSW5kZXguU3R5bGVTYW5pdGl6ZXJPZmZzZXQ7XG4gICAgZGlyZWN0aXZlUmVmc1tzdHlsZVNhbml0aXplckluZGV4XSA9IHN0eWxlU2FuaXRpemVyIHx8IG51bGw7XG4gIH1cblxuICByZXR1cm4gZGlyZWN0aXZlSW5kZXg7XG59XG5cbmZ1bmN0aW9uIGdldE1hdGNoaW5nQmluZGluZ0luZGV4KFxuICAgIGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBiaW5kaW5nTmFtZTogc3RyaW5nLCBzdGFydDogbnVtYmVyLCBlbmQ6IG51bWJlcikge1xuICBmb3IgKGxldCBqID0gc3RhcnQ7IGogPCBlbmQ7IGogKz0gU3R5bGluZ0luZGV4LlNpemUpIHtcbiAgICBpZiAoZ2V0UHJvcChjb250ZXh0LCBqKSA9PT0gYmluZGluZ05hbWUpIHJldHVybiBqO1xuICB9XG4gIHJldHVybiAtMTtcbn1cblxuLyoqXG4gKiBSZWdpc3RlcnMgdGhlIHByb3ZpZGVkIG11bHRpIHN0eWxpbmcgKGBbc3R5bGVdYCBhbmQgYFtjbGFzc11gKSB2YWx1ZXMgdG8gdGhlIGNvbnRleHQuXG4gKlxuICogVGhpcyBmdW5jdGlvbiB3aWxsIGl0ZXJhdGUgb3ZlciB0aGUgcHJvdmlkZWQgYGNsYXNzZXNJbnB1dGAgYW5kIGBzdHlsZXNJbnB1dGAgbWFwXG4gKiB2YWx1ZXMgYW5kIGluc2VydC91cGRhdGUgb3IgcmVtb3ZlIHRoZW0gZnJvbSB0aGUgY29udGV4dCBhdCBleGFjdGx5IHRoZSByaWdodFxuICogc3BvdC5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIGFsc28gdGFrZXMgaW4gYSBkaXJlY3RpdmUgd2hpY2ggaW1wbGllcyB0aGF0IHRoZSBzdHlsaW5nIHZhbHVlcyB3aWxsXG4gKiBiZSBldmFsdWF0ZWQgZm9yIHRoYXQgZGlyZWN0aXZlIHdpdGggcmVzcGVjdCB0byBhbnkgb3RoZXIgc3R5bGluZyB0aGF0IGFscmVhZHkgZXhpc3RzXG4gKiBvbiB0aGUgY29udGV4dC4gV2hlbiB0aGVyZSBhcmUgc3R5bGVzIHRoYXQgY29uZmxpY3QgKGUuZy4gc2F5IGBuZ1N0eWxlYCBhbmQgYFtzdHlsZV1gXG4gKiBib3RoIHVwZGF0ZSB0aGUgYHdpZHRoYCBwcm9wZXJ0eSBhdCB0aGUgc2FtZSB0aW1lKSB0aGVuIHRoZSBzdHlsaW5nIGFsZ29yaXRobSBjb2RlIGJlbG93XG4gKiB3aWxsIGRlY2lkZSB3aGljaCBvbmUgd2lucyBiYXNlZCBvbiB0aGUgZGlyZWN0aXZlIHN0eWxpbmcgcHJpb3JpdGl6YXRpb24gbWVjaGFuaXNtLiBUaGlzXG4gKiBtZWNoYW5pc20gaXMgYmV0dGVyIGV4cGxhaW5lZCBpbiByZW5kZXIzL2ludGVyZmFjZXMvc3R5bGluZy50cyNkaXJlY3RpdmVzKS5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIHdpbGwgbm90IHJlbmRlciBhbnkgc3R5bGluZyB2YWx1ZXMgb24gc2NyZWVuLCBidXQgaXMgcmF0aGVyIGRlc2lnbmVkIHRvXG4gKiBwcmVwYXJlIHRoZSBjb250ZXh0IGZvciB0aGF0LiBgcmVuZGVyU3R5bGluZ2AgbXVzdCBiZSBjYWxsZWQgYWZ0ZXJ3YXJkcyB0byByZW5kZXIgYW55XG4gKiBzdHlsaW5nIGRhdGEgdGhhdCB3YXMgc2V0IGluIHRoaXMgZnVuY3Rpb24gKG5vdGUgdGhhdCBgdXBkYXRlQ2xhc3NQcm9wYCBhbmRcbiAqIGB1cGRhdGVTdHlsZVByb3BgIGFyZSBkZXNpZ25lZCB0byBiZSBydW4gYWZ0ZXIgdGhpcyBmdW5jdGlvbiBpcyBydW4pLlxuICpcbiAqIEBwYXJhbSBjb250ZXh0IFRoZSBzdHlsaW5nIGNvbnRleHQgdGhhdCB3aWxsIGJlIHVwZGF0ZWQgd2l0aCB0aGVcbiAqICAgIG5ld2x5IHByb3ZpZGVkIHN0eWxlIHZhbHVlcy5cbiAqIEBwYXJhbSBjbGFzc2VzSW5wdXQgVGhlIGtleS92YWx1ZSBtYXAgb2YgQ1NTIGNsYXNzIG5hbWVzIHRoYXQgd2lsbCBiZSB1c2VkIGZvciB0aGUgdXBkYXRlLlxuICogQHBhcmFtIHN0eWxlc0lucHV0IFRoZSBrZXkvdmFsdWUgbWFwIG9mIENTUyBzdHlsZXMgdGhhdCB3aWxsIGJlIHVzZWQgZm9yIHRoZSB1cGRhdGUuXG4gKiBAcGFyYW0gZGlyZWN0aXZlUmVmIGFuIG9wdGlvbmFsIHJlZmVyZW5jZSB0byB0aGUgZGlyZWN0aXZlIHJlc3BvbnNpYmxlXG4gKiAgICBmb3IgdGhpcyBiaW5kaW5nIGNoYW5nZS4gSWYgcHJlc2VudCB0aGVuIHN0eWxlIGJpbmRpbmcgd2lsbCBvbmx5XG4gKiAgICBhY3R1YWxpemUgaWYgdGhlIGRpcmVjdGl2ZSBoYXMgb3duZXJzaGlwIG92ZXIgdGhpcyBiaW5kaW5nXG4gKiAgICAoc2VlIHN0eWxpbmcudHMjZGlyZWN0aXZlcyBmb3IgbW9yZSBpbmZvcm1hdGlvbiBhYm91dCB0aGUgYWxnb3JpdGhtKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHVwZGF0ZVN0eWxpbmdNYXAoXG4gICAgY29udGV4dDogU3R5bGluZ0NvbnRleHQsIGNsYXNzZXNJbnB1dDoge1trZXk6IHN0cmluZ106IGFueX0gfCBzdHJpbmcgfFxuICAgICAgICBCb3VuZFBsYXllckZhY3Rvcnk8bnVsbHxzdHJpbmd8e1trZXk6IHN0cmluZ106IGFueX0+fCBudWxsLFxuICAgIHN0eWxlc0lucHV0Pzoge1trZXk6IHN0cmluZ106IGFueX0gfCBCb3VuZFBsYXllckZhY3Rvcnk8bnVsbHx7W2tleTogc3RyaW5nXTogYW55fT58IG51bGwsXG4gICAgZGlyZWN0aXZlUmVmPzogYW55KTogdm9pZCB7XG4gIGNvbnN0IGRpcmVjdGl2ZUluZGV4ID0gZ2V0RGlyZWN0aXZlSW5kZXhGcm9tUmVnaXN0cnkoY29udGV4dCwgZGlyZWN0aXZlUmVmIHx8IG51bGwpO1xuXG4gIGNsYXNzZXNJbnB1dCA9IGNsYXNzZXNJbnB1dCB8fCBudWxsO1xuICBzdHlsZXNJbnB1dCA9IHN0eWxlc0lucHV0IHx8IG51bGw7XG4gIGNvbnN0IGlnbm9yZUFsbENsYXNzVXBkYXRlcyA9IGlzTXVsdGlWYWx1ZUNhY2hlSGl0KGNvbnRleHQsIHRydWUsIGRpcmVjdGl2ZUluZGV4LCBjbGFzc2VzSW5wdXQpO1xuICBjb25zdCBpZ25vcmVBbGxTdHlsZVVwZGF0ZXMgPSBpc011bHRpVmFsdWVDYWNoZUhpdChjb250ZXh0LCBmYWxzZSwgZGlyZWN0aXZlSW5kZXgsIHN0eWxlc0lucHV0KTtcblxuICAvLyBlYXJseSBleGl0ICh0aGlzIGlzIHdoYXQncyBkb25lIHRvIGF2b2lkIHVzaW5nIGN0eC5iaW5kKCkgdG8gY2FjaGUgdGhlIHZhbHVlKVxuICBpZiAoaWdub3JlQWxsQ2xhc3NVcGRhdGVzICYmIGlnbm9yZUFsbFN0eWxlVXBkYXRlcykgcmV0dXJuO1xuXG4gIGNsYXNzZXNJbnB1dCA9XG4gICAgICBjbGFzc2VzSW5wdXQgPT09IE5PX0NIQU5HRSA/IHJlYWRDYWNoZWRNYXBWYWx1ZShjb250ZXh0LCB0cnVlLCBkaXJlY3RpdmVJbmRleCkgOiBjbGFzc2VzSW5wdXQ7XG4gIHN0eWxlc0lucHV0ID1cbiAgICAgIHN0eWxlc0lucHV0ID09PSBOT19DSEFOR0UgPyByZWFkQ2FjaGVkTWFwVmFsdWUoY29udGV4dCwgZmFsc2UsIGRpcmVjdGl2ZUluZGV4KSA6IHN0eWxlc0lucHV0O1xuXG4gIGNvbnN0IGVsZW1lbnQgPSBjb250ZXh0W1N0eWxpbmdJbmRleC5FbGVtZW50UG9zaXRpb25dICFhcyBIVE1MRWxlbWVudDtcbiAgY29uc3QgY2xhc3Nlc1BsYXllckJ1aWxkZXIgPSBjbGFzc2VzSW5wdXQgaW5zdGFuY2VvZiBCb3VuZFBsYXllckZhY3RvcnkgP1xuICAgICAgbmV3IENsYXNzQW5kU3R5bGVQbGF5ZXJCdWlsZGVyKGNsYXNzZXNJbnB1dCBhcyBhbnksIGVsZW1lbnQsIEJpbmRpbmdUeXBlLkNsYXNzKSA6XG4gICAgICBudWxsO1xuICBjb25zdCBzdHlsZXNQbGF5ZXJCdWlsZGVyID0gc3R5bGVzSW5wdXQgaW5zdGFuY2VvZiBCb3VuZFBsYXllckZhY3RvcnkgP1xuICAgICAgbmV3IENsYXNzQW5kU3R5bGVQbGF5ZXJCdWlsZGVyKHN0eWxlc0lucHV0IGFzIGFueSwgZWxlbWVudCwgQmluZGluZ1R5cGUuU3R5bGUpIDpcbiAgICAgIG51bGw7XG5cbiAgY29uc3QgY2xhc3Nlc1ZhbHVlID0gY2xhc3Nlc1BsYXllckJ1aWxkZXIgP1xuICAgICAgKGNsYXNzZXNJbnB1dCBhcyBCb3VuZFBsYXllckZhY3Rvcnk8e1trZXk6IHN0cmluZ106IGFueX18c3RyaW5nPikgIS52YWx1ZSA6XG4gICAgICBjbGFzc2VzSW5wdXQ7XG4gIGNvbnN0IHN0eWxlc1ZhbHVlID0gc3R5bGVzUGxheWVyQnVpbGRlciA/IHN0eWxlc0lucHV0ICEudmFsdWUgOiBzdHlsZXNJbnB1dDtcblxuICBsZXQgY2xhc3NOYW1lczogc3RyaW5nW10gPSBFTVBUWV9BUlJBWTtcbiAgbGV0IGFwcGx5QWxsQ2xhc3NlcyA9IGZhbHNlO1xuICBsZXQgcGxheWVyQnVpbGRlcnNBcmVEaXJ0eSA9IGZhbHNlO1xuXG4gIGNvbnN0IGNsYXNzZXNQbGF5ZXJCdWlsZGVySW5kZXggPVxuICAgICAgY2xhc3Nlc1BsYXllckJ1aWxkZXIgPyBQbGF5ZXJJbmRleC5DbGFzc01hcFBsYXllckJ1aWxkZXJQb3NpdGlvbiA6IDA7XG4gIGlmIChoYXNQbGF5ZXJCdWlsZGVyQ2hhbmdlZChcbiAgICAgICAgICBjb250ZXh0LCBjbGFzc2VzUGxheWVyQnVpbGRlciwgUGxheWVySW5kZXguQ2xhc3NNYXBQbGF5ZXJCdWlsZGVyUG9zaXRpb24pKSB7XG4gICAgc2V0UGxheWVyQnVpbGRlcihjb250ZXh0LCBjbGFzc2VzUGxheWVyQnVpbGRlciwgUGxheWVySW5kZXguQ2xhc3NNYXBQbGF5ZXJCdWlsZGVyUG9zaXRpb24pO1xuICAgIHBsYXllckJ1aWxkZXJzQXJlRGlydHkgPSB0cnVlO1xuICB9XG5cbiAgY29uc3Qgc3R5bGVzUGxheWVyQnVpbGRlckluZGV4ID1cbiAgICAgIHN0eWxlc1BsYXllckJ1aWxkZXIgPyBQbGF5ZXJJbmRleC5TdHlsZU1hcFBsYXllckJ1aWxkZXJQb3NpdGlvbiA6IDA7XG4gIGlmIChoYXNQbGF5ZXJCdWlsZGVyQ2hhbmdlZChcbiAgICAgICAgICBjb250ZXh0LCBzdHlsZXNQbGF5ZXJCdWlsZGVyLCBQbGF5ZXJJbmRleC5TdHlsZU1hcFBsYXllckJ1aWxkZXJQb3NpdGlvbikpIHtcbiAgICBzZXRQbGF5ZXJCdWlsZGVyKGNvbnRleHQsIHN0eWxlc1BsYXllckJ1aWxkZXIsIFBsYXllckluZGV4LlN0eWxlTWFwUGxheWVyQnVpbGRlclBvc2l0aW9uKTtcbiAgICBwbGF5ZXJCdWlsZGVyc0FyZURpcnR5ID0gdHJ1ZTtcbiAgfVxuXG4gIC8vIGVhY2ggdGltZSBhIHN0cmluZy1iYXNlZCB2YWx1ZSBwb3BzIHVwIHRoZW4gaXQgc2hvdWxkbid0IHJlcXVpcmUgYSBkZWVwXG4gIC8vIGNoZWNrIG9mIHdoYXQncyBjaGFuZ2VkLlxuICBpZiAoIWlnbm9yZUFsbENsYXNzVXBkYXRlcykge1xuICAgIGlmICh0eXBlb2YgY2xhc3Nlc1ZhbHVlID09ICdzdHJpbmcnKSB7XG4gICAgICBjbGFzc05hbWVzID0gY2xhc3Nlc1ZhbHVlLnNwbGl0KC9cXHMrLyk7XG4gICAgICAvLyB0aGlzIGJvb2xlYW4gaXMgdXNlZCB0byBhdm9pZCBoYXZpbmcgdG8gY3JlYXRlIGEga2V5L3ZhbHVlIG1hcCBvZiBgdHJ1ZWAgdmFsdWVzXG4gICAgICAvLyBzaW5jZSBhIGNsYXNzbmFtZSBzdHJpbmcgaW1wbGllcyB0aGF0IGFsbCB0aG9zZSBjbGFzc2VzIGFyZSBhZGRlZFxuICAgICAgYXBwbHlBbGxDbGFzc2VzID0gdHJ1ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgY2xhc3NOYW1lcyA9IGNsYXNzZXNWYWx1ZSA/IE9iamVjdC5rZXlzKGNsYXNzZXNWYWx1ZSkgOiBFTVBUWV9BUlJBWTtcbiAgICB9XG4gIH1cblxuICBjb25zdCBtdWx0aVN0eWxlc1N0YXJ0SW5kZXggPSBnZXRNdWx0aVN0eWxlc1N0YXJ0SW5kZXgoY29udGV4dCk7XG4gIGxldCBtdWx0aUNsYXNzZXNTdGFydEluZGV4ID0gZ2V0TXVsdGlDbGFzc2VzU3RhcnRJbmRleChjb250ZXh0KTtcbiAgbGV0IG11bHRpQ2xhc3Nlc0VuZEluZGV4ID0gY29udGV4dC5sZW5ndGg7XG5cbiAgaWYgKCFpZ25vcmVBbGxTdHlsZVVwZGF0ZXMpIHtcbiAgICBjb25zdCBzdHlsZVByb3BzID0gc3R5bGVzVmFsdWUgPyBPYmplY3Qua2V5cyhzdHlsZXNWYWx1ZSkgOiBFTVBUWV9BUlJBWTtcbiAgICBjb25zdCBzdHlsZXMgPSBzdHlsZXNWYWx1ZSB8fCBFTVBUWV9PQko7XG4gICAgY29uc3QgdG90YWxOZXdFbnRyaWVzID0gcGF0Y2hTdHlsaW5nTWFwSW50b0NvbnRleHQoXG4gICAgICAgIGNvbnRleHQsIGRpcmVjdGl2ZUluZGV4LCBzdHlsZXNQbGF5ZXJCdWlsZGVySW5kZXgsIG11bHRpU3R5bGVzU3RhcnRJbmRleCxcbiAgICAgICAgbXVsdGlDbGFzc2VzU3RhcnRJbmRleCwgc3R5bGVQcm9wcywgc3R5bGVzLCBzdHlsZXNJbnB1dCwgZmFsc2UpO1xuICAgIGlmICh0b3RhbE5ld0VudHJpZXMpIHtcbiAgICAgIG11bHRpQ2xhc3Nlc1N0YXJ0SW5kZXggKz0gdG90YWxOZXdFbnRyaWVzICogU3R5bGluZ0luZGV4LlNpemU7XG4gICAgICBtdWx0aUNsYXNzZXNFbmRJbmRleCArPSB0b3RhbE5ld0VudHJpZXMgKiBTdHlsaW5nSW5kZXguU2l6ZTtcbiAgICB9XG4gIH1cblxuICBpZiAoIWlnbm9yZUFsbENsYXNzVXBkYXRlcykge1xuICAgIGNvbnN0IGNsYXNzZXMgPSAoY2xhc3Nlc1ZhbHVlIHx8IEVNUFRZX09CSikgYXN7W2tleTogc3RyaW5nXTogYW55fTtcbiAgICBwYXRjaFN0eWxpbmdNYXBJbnRvQ29udGV4dChcbiAgICAgICAgY29udGV4dCwgZGlyZWN0aXZlSW5kZXgsIGNsYXNzZXNQbGF5ZXJCdWlsZGVySW5kZXgsIG11bHRpQ2xhc3Nlc1N0YXJ0SW5kZXgsXG4gICAgICAgIG11bHRpQ2xhc3Nlc0VuZEluZGV4LCBjbGFzc05hbWVzLCBhcHBseUFsbENsYXNzZXMgfHwgY2xhc3NlcywgY2xhc3Nlc0lucHV0LCB0cnVlKTtcbiAgfVxuXG4gIGlmIChwbGF5ZXJCdWlsZGVyc0FyZURpcnR5KSB7XG4gICAgc2V0Q29udGV4dFBsYXllcnNEaXJ0eShjb250ZXh0LCB0cnVlKTtcbiAgfVxufVxuXG4vKipcbiAqIEFwcGxpZXMgdGhlIGdpdmVuIG11bHRpIHN0eWxpbmcgKHN0eWxlcyBvciBjbGFzc2VzKSB2YWx1ZXMgdG8gdGhlIGNvbnRleHQuXG4gKlxuICogVGhlIHN0eWxpbmcgYWxnb3JpdGhtIGNvZGUgdGhhdCBhcHBsaWVzIG11bHRpLWxldmVsIHN0eWxpbmcgKHRoaW5ncyBsaWtlIGBbc3R5bGVdYCBhbmQgYFtjbGFzc11gXG4gKiB2YWx1ZXMpIHJlc2lkZXMgaGVyZS5cbiAqXG4gKiBCZWNhdXNlIHRoaXMgZnVuY3Rpb24gdW5kZXJzdGFuZHMgdGhhdCBtdWx0aXBsZSBkaXJlY3RpdmVzIG1heSBhbGwgd3JpdGUgdG8gdGhlIGBbc3R5bGVdYCBhbmRcbiAqIGBbY2xhc3NdYCBiaW5kaW5ncyAodGhyb3VnaCBob3N0IGJpbmRpbmdzKSwgaXQgcmVsaWVzIG9mIGVhY2ggZGlyZWN0aXZlIGFwcGx5aW5nIGl0cyBiaW5kaW5nXG4gKiB2YWx1ZSBpbiBvcmRlci4gVGhpcyBtZWFucyB0aGF0IGEgZGlyZWN0aXZlIGxpa2UgYGNsYXNzQURpcmVjdGl2ZWAgd2lsbCBhbHdheXMgZmlyZSBiZWZvcmVcbiAqIGBjbGFzc0JEaXJlY3RpdmVgIGFuZCB0aGVyZWZvcmUgaXRzIHN0eWxpbmcgdmFsdWVzIChjbGFzc2VzIGFuZCBzdHlsZXMpIHdpbGwgYWx3YXlzIGJlIGV2YWx1YXRlZFxuICogaW4gdGhlIHNhbWUgb3JkZXIuIEJlY2F1c2Ugb2YgdGhpcyBjb25zaXN0ZW50IG9yZGVyaW5nLCB0aGUgZmlyc3QgZGlyZWN0aXZlIGhhcyBhIGhpZ2hlciBwcmlvcml0eVxuICogdGhhbiB0aGUgc2Vjb25kIG9uZS4gSXQgaXMgd2l0aCB0aGlzIHByaW9yaXR6YXRpb24gbWVjaGFuaXNtIHRoYXQgdGhlIHN0eWxpbmcgYWxnb3JpdGhtIGtub3dzIGhvd1xuICogdG8gbWVyZ2UgYW5kIGFwcGx5IHJlZHVkYW50IHN0eWxpbmcgcHJvcGVydGllcy5cbiAqXG4gKiBUaGUgZnVuY3Rpb24gaXRzZWxmIGFwcGxpZXMgdGhlIGtleS92YWx1ZSBlbnRyaWVzIChvciBhbiBhcnJheSBvZiBrZXlzKSB0b1xuICogdGhlIGNvbnRleHQgaW4gdGhlIGZvbGxvd2luZyBzdGVwcy5cbiAqXG4gKiBTVEVQIDE6XG4gKiAgICBGaXJzdCBjaGVjayB0byBzZWUgd2hhdCBwcm9wZXJ0aWVzIGFyZSBhbHJlYWR5IHNldCBhbmQgaW4gdXNlIGJ5IGFub3RoZXIgZGlyZWN0aXZlIGluIHRoZVxuICogICAgY29udGV4dCAoZS5nLiBgbmdDbGFzc2Agc2V0IHRoZSBgd2lkdGhgIHZhbHVlIGFuZCBgW3N0eWxlLndpZHRoXT1cIndcImAgaW4gYSBkaXJlY3RpdmUgaXNcbiAqICAgIGF0dGVtcHRpbmcgdG8gc2V0IGl0IGFzIHdlbGwpLlxuICpcbiAqIFNURVAgMjpcbiAqICAgIEFsbCByZW1haW5pbmcgcHJvcGVydGllcyAodGhhdCB3ZXJlIG5vdCBzZXQgcHJpb3IgdG8gdGhpcyBkaXJlY3RpdmUpIGFyZSBub3cgdXBkYXRlZCBpblxuICogICAgdGhlIGNvbnRleHQuIEFueSBuZXcgcHJvcGVydGllcyBhcmUgaW5zZXJ0ZWQgZXhhY3RseSBhdCB0aGVpciBzcG90IGluIHRoZSBjb250ZXh0IGFuZCBhbnlcbiAqICAgIHByZXZpb3VzbHkgc2V0IHByb3BlcnRpZXMgYXJlIHNoaWZ0ZWQgdG8gZXhhY3RseSB3aGVyZSB0aGUgY3Vyc29yIHNpdHMgd2hpbGUgaXRlcmF0aW5nIG92ZXJcbiAqICAgIHRoZSBjb250ZXh0LiBUaGUgZW5kIHJlc3VsdCBpcyBhIGJhbGFuY2VkIGNvbnRleHQgdGhhdCBpbmNsdWRlcyB0aGUgZXhhY3Qgb3JkZXJpbmcgb2YgdGhlXG4gKiAgICBzdHlsaW5nIHByb3BlcnRpZXMvdmFsdWVzIGZvciB0aGUgcHJvdmlkZWQgaW5wdXQgZnJvbSB0aGUgZGlyZWN0aXZlLlxuICpcbiAqIFNURVAgMzpcbiAqICAgIEFueSB1bm1hdGNoZWQgcHJvcGVydGllcyBpbiB0aGUgY29udGV4dCB0aGF0IGJlbG9uZyB0byB0aGUgZGlyZWN0aXZlIGFyZSBzZXQgdG8gbnVsbFxuICpcbiAqIE9uY2UgdGhlIHVwZGF0aW5nIHBoYXNlIGlzIGRvbmUsIHRoZW4gdGhlIGFsZ29yaXRobSB3aWxsIGRlY2lkZSB3aGV0aGVyIG9yIG5vdCB0byBmbGFnIHRoZVxuICogZm9sbG93LXVwIGRpcmVjdGl2ZXMgKHRoZSBkaXJlY3RpdmVzIHRoYXQgd2lsbCBwYXNzIGluIHRoZWlyIHN0eWxpbmcgdmFsdWVzKSBkZXBlbmRpbmcgb24gaWZcbiAqIHRoZSBcInNoYXBlXCIgb2YgdGhlIG11bHRpLXZhbHVlIG1hcCBoYXMgY2hhbmdlZCAoZWl0aGVyIGlmIGFueSBrZXlzIGFyZSByZW1vdmVkIG9yIGFkZGVkIG9yXG4gKiBpZiB0aGVyZSBhcmUgYW55IG5ldyBgbnVsbGAgdmFsdWVzKS4gSWYgYW55IGZvbGxvdy11cCBkaXJlY3RpdmVzIGFyZSBmbGFnZ2VkIGFzIGRpcnR5IHRoZW4gdGhlXG4gKiBhbGdvcml0aG0gd2lsbCBydW4gYWdhaW4gZm9yIHRoZW0uIE90aGVyd2lzZSBpZiB0aGUgc2hhcGUgZGlkIG5vdCBjaGFuZ2UgdGhlbiBhbnkgZm9sbG93LXVwXG4gKiBkaXJlY3RpdmVzIHdpbGwgbm90IHJ1biAoc28gbG9uZyBhcyB0aGVpciBiaW5kaW5nIHZhbHVlcyBzdGF5IHRoZSBzYW1lKS5cbiAqXG4gKiBAcmV0dXJucyB0aGUgdG90YWwgYW1vdW50IG9mIG5ldyBzbG90cyB0aGF0IHdlcmUgYWxsb2NhdGVkIGludG8gdGhlIGNvbnRleHQgZHVlIHRvIG5ldyBzdHlsaW5nXG4gKiAgICAgICAgICBwcm9wZXJ0aWVzIHRoYXQgd2VyZSBkZXRlY3RlZC5cbiAqL1xuZnVuY3Rpb24gcGF0Y2hTdHlsaW5nTWFwSW50b0NvbnRleHQoXG4gICAgY29udGV4dDogU3R5bGluZ0NvbnRleHQsIGRpcmVjdGl2ZUluZGV4OiBudW1iZXIsIHBsYXllckJ1aWxkZXJJbmRleDogbnVtYmVyLCBjdHhTdGFydDogbnVtYmVyLFxuICAgIGN0eEVuZDogbnVtYmVyLCBwcm9wczogKHN0cmluZyB8IG51bGwpW10sIHZhbHVlczoge1trZXk6IHN0cmluZ106IGFueX0gfCB0cnVlLCBjYWNoZVZhbHVlOiBhbnksXG4gICAgZW50cnlJc0NsYXNzQmFzZWQ6IGJvb2xlYW4pOiBudW1iZXIge1xuICBsZXQgZGlydHkgPSBmYWxzZTtcblxuICBjb25zdCBjYWNoZUluZGV4ID0gTWFwQmFzZWRPZmZzZXRWYWx1ZXNJbmRleC5WYWx1ZXNTdGFydFBvc2l0aW9uICtcbiAgICAgIGRpcmVjdGl2ZUluZGV4ICogTWFwQmFzZWRPZmZzZXRWYWx1ZXNJbmRleC5TaXplO1xuXG4gIC8vIHRoZSBjYWNoZWRWYWx1ZXMgYXJyYXkgaXMgdGhlIHJlZ2lzdHJ5IG9mIGFsbCBtdWx0aSBzdHlsZSB2YWx1ZXMgKG1hcCB2YWx1ZXMpLiBFYWNoXG4gIC8vIHZhbHVlIGlzIHN0b3JlZCAoY2FjaGVkKSBlYWNoIHRpbWUgaXMgdXBkYXRlZC5cbiAgY29uc3QgY2FjaGVkVmFsdWVzID1cbiAgICAgIGNvbnRleHRbZW50cnlJc0NsYXNzQmFzZWQgPyBTdHlsaW5nSW5kZXguQ2FjaGVkTXVsdGlDbGFzc2VzIDogU3R5bGluZ0luZGV4LkNhY2hlZE11bHRpU3R5bGVzXTtcblxuICAvLyB0aGlzIGlzIHRoZSBpbmRleCBpbiB3aGljaCB0aGlzIGRpcmVjdGl2ZSBoYXMgb3duZXJzaGlwIGFjY2VzcyB0byB3cml0ZSB0byB0aGlzXG4gIC8vIHZhbHVlIChhbnl0aGluZyBiZWZvcmUgaXMgb3duZWQgYnkgYSBwcmV2aW91cyBkaXJlY3RpdmUgdGhhdCBpcyBtb3JlIGltcG9ydGFudClcbiAgY29uc3Qgb3duZXJzaGlwVmFsdWVzU3RhcnRJbmRleCA9XG4gICAgICBjYWNoZWRWYWx1ZXNbY2FjaGVJbmRleCArIE1hcEJhc2VkT2Zmc2V0VmFsdWVzSW5kZXguUG9zaXRpb25TdGFydE9mZnNldF07XG5cbiAgY29uc3QgZXhpc3RpbmdDYWNoZWRWYWx1ZSA9IGNhY2hlZFZhbHVlc1tjYWNoZUluZGV4ICsgTWFwQmFzZWRPZmZzZXRWYWx1ZXNJbmRleC5WYWx1ZU9mZnNldF07XG4gIGNvbnN0IGV4aXN0aW5nQ2FjaGVkVmFsdWVDb3VudCA9XG4gICAgICBjYWNoZWRWYWx1ZXNbY2FjaGVJbmRleCArIE1hcEJhc2VkT2Zmc2V0VmFsdWVzSW5kZXguVmFsdWVDb3VudE9mZnNldF07XG4gIGNvbnN0IGV4aXN0aW5nQ2FjaGVkVmFsdWVJc0RpcnR5ID1cbiAgICAgIGNhY2hlZFZhbHVlc1tjYWNoZUluZGV4ICsgTWFwQmFzZWRPZmZzZXRWYWx1ZXNJbmRleC5EaXJ0eUZsYWdPZmZzZXRdID09PSAxO1xuXG4gIC8vIEEgc2hhcGUgY2hhbmdlIG1lYW5zIHRoZSBwcm92aWRlZCBtYXAgdmFsdWUgaGFzIGVpdGhlciByZW1vdmVkIG9yIGFkZGVkIG5ldyBwcm9wZXJ0aWVzXG4gIC8vIGNvbXBhcmVkIHRvIHdoYXQgd2VyZSBpbiB0aGUgbGFzdCB0aW1lLiBJZiBhIHNoYXBlIGNoYW5nZSBvY2N1cnMgdGhlbiBpdCBtZWFucyB0aGF0IGFsbFxuICAvLyBmb2xsb3ctdXAgbXVsdGktc3R5bGluZyBlbnRyaWVzIGFyZSBvYnNvbGV0ZSBhbmQgd2lsbCBiZSBleGFtaW5lZCBhZ2FpbiB3aGVuIENEIHJ1bnNcbiAgLy8gdGhlbS4gSWYgYSBzaGFwZSBjaGFuZ2UgaGFzIG5vdCBvY2N1cnJlZCB0aGVuIHRoZXJlIGlzIG5vIHJlYXNvbiB0byBjaGVjayBhbnkgb3RoZXJcbiAgLy8gZGlyZWN0aXZlIHZhbHVlcyBpZiB0aGVpciBpZGVudGl0eSBoYXMgbm90IGNoYW5nZWQuIElmIGEgcHJldmlvdXMgZGlyZWN0aXZlIHNldCB0aGlzXG4gIC8vIHZhbHVlIGFzIGRpcnR5IChiZWNhdXNlIGl0cyBvd24gc2hhcGUgY2hhbmdlZCkgdGhlbiB0aGlzIG1lYW5zIHRoYXQgdGhlIG9iamVjdCBoYXMgYmVlblxuICAvLyBvZmZzZXQgdG8gYSBkaWZmZXJlbnQgYXJlYSBpbiB0aGUgY29udGV4dC4gQmVjYXVzZSBpdHMgdmFsdWUgaGFzIGJlZW4gb2Zmc2V0IHRoZW4gaXRcbiAgLy8gY2FuJ3Qgd3JpdGUgdG8gYSByZWdpb24gdGhhdCBpdCB3cm90ZSB0byBiZWZvcmUgKHdoaWNoIG1heSBoYXZlIGJlZW4gYXBhcnQgb2YgYW5vdGhlclxuICAvLyBkaXJlY3RpdmUpIGFuZCB0aGVyZWZvcmUgaXRzIHNoYXBlIGNoYW5nZXMgdG9vLlxuICBsZXQgdmFsdWVzRW50cnlTaGFwZUNoYW5nZSA9XG4gICAgICBleGlzdGluZ0NhY2hlZFZhbHVlSXNEaXJ0eSB8fCAoKCFleGlzdGluZ0NhY2hlZFZhbHVlICYmIGNhY2hlVmFsdWUpID8gdHJ1ZSA6IGZhbHNlKTtcblxuICBsZXQgdG90YWxVbmlxdWVWYWx1ZXMgPSAwO1xuICBsZXQgdG90YWxOZXdBbGxvY2F0ZWRTbG90cyA9IDA7XG5cbiAgLy8gdGhpcyBpcyBhIHRyaWNrIHRvIGF2b2lkIGJ1aWxkaW5nIHtrZXk6dmFsdWV9IG1hcCB3aGVyZSBhbGwgdGhlIHZhbHVlc1xuICAvLyBhcmUgYHRydWVgICh0aGlzIGhhcHBlbnMgd2hlbiBhIGNsYXNzTmFtZSBzdHJpbmcgaXMgcHJvdmlkZWQgaW5zdGVhZCBvZiBhXG4gIC8vIG1hcCBhcyBhbiBpbnB1dCB2YWx1ZSB0byB0aGlzIHN0eWxpbmcgYWxnb3JpdGhtKVxuICBjb25zdCBhcHBseUFsbFByb3BzID0gdmFsdWVzID09PSB0cnVlO1xuXG4gIC8vIFNURVAgMTpcbiAgLy8gbG9vcCB0aHJvdWdoIHRoZSBlYXJsaWVyIGRpcmVjdGl2ZXMgYW5kIGZpZ3VyZSBvdXQgaWYgYW55IHByb3BlcnRpZXMgaGVyZSB3aWxsIGJlIHBsYWNlZFxuICAvLyBpbiB0aGVpciBhcmVhICh0aGlzIGhhcHBlbnMgd2hlbiB0aGUgdmFsdWUgaXMgbnVsbCBiZWNhdXNlIHRoZSBlYXJsaWVyIGRpcmVjdGl2ZSBlcmFzZWQgaXQpLlxuICBsZXQgY3R4SW5kZXggPSBjdHhTdGFydDtcbiAgbGV0IHRvdGFsUmVtYWluaW5nUHJvcGVydGllcyA9IHByb3BzLmxlbmd0aDtcbiAgd2hpbGUgKGN0eEluZGV4IDwgb3duZXJzaGlwVmFsdWVzU3RhcnRJbmRleCkge1xuICAgIGNvbnN0IGN1cnJlbnRQcm9wID0gZ2V0UHJvcChjb250ZXh0LCBjdHhJbmRleCk7XG4gICAgaWYgKHRvdGFsUmVtYWluaW5nUHJvcGVydGllcykge1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwcm9wcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBjb25zdCBtYXBQcm9wID0gcHJvcHNbaV07XG4gICAgICAgIGNvbnN0IG5vcm1hbGl6ZWRQcm9wID0gbWFwUHJvcCA/IChlbnRyeUlzQ2xhc3NCYXNlZCA/IG1hcFByb3AgOiBoeXBoZW5hdGUobWFwUHJvcCkpIDogbnVsbDtcbiAgICAgICAgaWYgKG5vcm1hbGl6ZWRQcm9wICYmIGN1cnJlbnRQcm9wID09PSBub3JtYWxpemVkUHJvcCkge1xuICAgICAgICAgIGNvbnN0IGN1cnJlbnRWYWx1ZSA9IGdldFZhbHVlKGNvbnRleHQsIGN0eEluZGV4KTtcbiAgICAgICAgICBjb25zdCBjdXJyZW50RGlyZWN0aXZlSW5kZXggPSBnZXREaXJlY3RpdmVJbmRleEZyb21FbnRyeShjb250ZXh0LCBjdHhJbmRleCk7XG4gICAgICAgICAgY29uc3QgdmFsdWUgPSBhcHBseUFsbFByb3BzID8gdHJ1ZSA6ICh2YWx1ZXMgYXN7W2tleTogc3RyaW5nXTogYW55fSlbbm9ybWFsaXplZFByb3BdO1xuICAgICAgICAgIGNvbnN0IGN1cnJlbnRGbGFnID0gZ2V0UG9pbnRlcnMoY29udGV4dCwgY3R4SW5kZXgpO1xuICAgICAgICAgIGlmIChoYXNWYWx1ZUNoYW5nZWQoY3VycmVudEZsYWcsIGN1cnJlbnRWYWx1ZSwgdmFsdWUpICYmXG4gICAgICAgICAgICAgIGFsbG93VmFsdWVDaGFuZ2UoY3VycmVudFZhbHVlLCB2YWx1ZSwgY3VycmVudERpcmVjdGl2ZUluZGV4LCBkaXJlY3RpdmVJbmRleCkpIHtcbiAgICAgICAgICAgIHNldFZhbHVlKGNvbnRleHQsIGN0eEluZGV4LCB2YWx1ZSk7XG4gICAgICAgICAgICBzZXRQbGF5ZXJCdWlsZGVySW5kZXgoY29udGV4dCwgY3R4SW5kZXgsIHBsYXllckJ1aWxkZXJJbmRleCwgZGlyZWN0aXZlSW5kZXgpO1xuICAgICAgICAgICAgaWYgKGhhc0luaXRpYWxWYWx1ZUNoYW5nZWQoY29udGV4dCwgY3VycmVudEZsYWcsIHZhbHVlKSkge1xuICAgICAgICAgICAgICBzZXREaXJ0eShjb250ZXh0LCBjdHhJbmRleCwgdHJ1ZSk7XG4gICAgICAgICAgICAgIGRpcnR5ID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgcHJvcHNbaV0gPSBudWxsO1xuICAgICAgICAgIHRvdGFsUmVtYWluaW5nUHJvcGVydGllcy0tO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIGN0eEluZGV4ICs9IFN0eWxpbmdJbmRleC5TaXplO1xuICB9XG5cbiAgLy8gU1RFUCAyOlxuICAvLyBhcHBseSB0aGUgbGVmdCBvdmVyIHByb3BlcnRpZXMgdG8gdGhlIGNvbnRleHQgaW4gdGhlIGNvcnJlY3Qgb3JkZXIuXG4gIGlmICh0b3RhbFJlbWFpbmluZ1Byb3BlcnRpZXMpIHtcbiAgICBjb25zdCBzYW5pdGl6ZXIgPSBlbnRyeUlzQ2xhc3NCYXNlZCA/IG51bGwgOiBnZXRTdHlsZVNhbml0aXplcihjb250ZXh0LCBkaXJlY3RpdmVJbmRleCk7XG4gICAgcHJvcGVydGllc0xvb3A6IGZvciAobGV0IGkgPSAwOyBpIDwgcHJvcHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IG1hcFByb3AgPSBwcm9wc1tpXTtcblxuICAgICAgaWYgKCFtYXBQcm9wKSB7XG4gICAgICAgIC8vIHRoaXMgaXMgYW4gZWFybHkgZXhpdCBpbmNhc2UgYSB2YWx1ZSB3YXMgYWxyZWFkeSBlbmNvdW50ZXJlZCBhYm92ZSBpbiB0aGVcbiAgICAgICAgLy8gcHJldmlvdXMgbG9vcCAod2hpY2ggbWVhbnMgdGhhdCB0aGUgcHJvcGVydHkgd2FzIGFwcGxpZWQgb3IgcmVqZWN0ZWQpXG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBjb25zdCB2YWx1ZSA9IGFwcGx5QWxsUHJvcHMgPyB0cnVlIDogKHZhbHVlcyBhc3tba2V5OiBzdHJpbmddOiBhbnl9KVttYXBQcm9wXTtcbiAgICAgIGNvbnN0IG5vcm1hbGl6ZWRQcm9wID0gZW50cnlJc0NsYXNzQmFzZWQgPyBtYXBQcm9wIDogaHlwaGVuYXRlKG1hcFByb3ApO1xuICAgICAgY29uc3QgaXNJbnNpZGVPd25lcnNoaXBBcmVhID0gY3R4SW5kZXggPj0gb3duZXJzaGlwVmFsdWVzU3RhcnRJbmRleDtcblxuICAgICAgZm9yIChsZXQgaiA9IGN0eEluZGV4OyBqIDwgY3R4RW5kOyBqICs9IFN0eWxpbmdJbmRleC5TaXplKSB7XG4gICAgICAgIGNvbnN0IGRpc3RhbnRDdHhQcm9wID0gZ2V0UHJvcChjb250ZXh0LCBqKTtcbiAgICAgICAgaWYgKGRpc3RhbnRDdHhQcm9wID09PSBub3JtYWxpemVkUHJvcCkge1xuICAgICAgICAgIGNvbnN0IGRpc3RhbnRDdHhEaXJlY3RpdmVJbmRleCA9IGdldERpcmVjdGl2ZUluZGV4RnJvbUVudHJ5KGNvbnRleHQsIGopO1xuICAgICAgICAgIGNvbnN0IGRpc3RhbnRDdHhQbGF5ZXJCdWlsZGVySW5kZXggPSBnZXRQbGF5ZXJCdWlsZGVySW5kZXgoY29udGV4dCwgaik7XG4gICAgICAgICAgY29uc3QgZGlzdGFudEN0eFZhbHVlID0gZ2V0VmFsdWUoY29udGV4dCwgaik7XG4gICAgICAgICAgY29uc3QgZGlzdGFudEN0eEZsYWcgPSBnZXRQb2ludGVycyhjb250ZXh0LCBqKTtcblxuICAgICAgICAgIGlmIChhbGxvd1ZhbHVlQ2hhbmdlKGRpc3RhbnRDdHhWYWx1ZSwgdmFsdWUsIGRpc3RhbnRDdHhEaXJlY3RpdmVJbmRleCwgZGlyZWN0aXZlSW5kZXgpKSB7XG4gICAgICAgICAgICAvLyBldmVuIGlmIHRoZSBlbnRyeSBpc24ndCB1cGRhdGVkIChieSB2YWx1ZSBvciBkaXJlY3RpdmVJbmRleCkgdGhlblxuICAgICAgICAgICAgLy8gaXQgc2hvdWxkIHN0aWxsIGJlIG1vdmVkIG92ZXIgdG8gdGhlIGNvcnJlY3Qgc3BvdCBpbiB0aGUgYXJyYXkgc29cbiAgICAgICAgICAgIC8vIHRoZSBpdGVyYXRpb24gbG9vcCBpcyB0aWdodGVyLlxuICAgICAgICAgICAgaWYgKGlzSW5zaWRlT3duZXJzaGlwQXJlYSkge1xuICAgICAgICAgICAgICBzd2FwTXVsdGlDb250ZXh0RW50cmllcyhjb250ZXh0LCBjdHhJbmRleCwgaik7XG4gICAgICAgICAgICAgIHRvdGFsVW5pcXVlVmFsdWVzKys7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChoYXNWYWx1ZUNoYW5nZWQoZGlzdGFudEN0eEZsYWcsIGRpc3RhbnRDdHhWYWx1ZSwgdmFsdWUpKSB7XG4gICAgICAgICAgICAgIGlmICh2YWx1ZSA9PT0gbnVsbCB8fCB2YWx1ZSA9PT0gdW5kZWZpbmVkICYmIHZhbHVlICE9PSBkaXN0YW50Q3R4VmFsdWUpIHtcbiAgICAgICAgICAgICAgICB2YWx1ZXNFbnRyeVNoYXBlQ2hhbmdlID0gdHJ1ZTtcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIHNldFZhbHVlKGNvbnRleHQsIGN0eEluZGV4LCB2YWx1ZSk7XG5cbiAgICAgICAgICAgICAgLy8gU0tJUCBJRiBJTklUSUFMIENIRUNLXG4gICAgICAgICAgICAgIC8vIElmIHRoZSBmb3JtZXIgYHZhbHVlYCBpcyBgbnVsbGAgdGhlbiBpdCBtZWFucyB0aGF0IGFuIGluaXRpYWwgdmFsdWVcbiAgICAgICAgICAgICAgLy8gY291bGQgYmUgYmVpbmcgcmVuZGVyZWQgb24gc2NyZWVuLiBJZiB0aGF0IGlzIHRoZSBjYXNlIHRoZW4gdGhlcmUgaXNcbiAgICAgICAgICAgICAgLy8gbm8gcG9pbnQgaW4gdXBkYXRpbmcgdGhlIHZhbHVlIGluY2FzZSBpdCBtYXRjaGVzLiBJbiBvdGhlciB3b3JkcyBpZiB0aGVcbiAgICAgICAgICAgICAgLy8gbmV3IHZhbHVlIGlzIHRoZSBleGFjdCBzYW1lIGFzIHRoZSBwcmV2aW91c2x5IHJlbmRlcmVkIHZhbHVlICh3aGljaFxuICAgICAgICAgICAgICAvLyBoYXBwZW5zIHRvIGJlIHRoZSBpbml0aWFsIHZhbHVlKSB0aGVuIGRvIG5vdGhpbmcuXG4gICAgICAgICAgICAgIGlmIChkaXN0YW50Q3R4VmFsdWUgIT09IG51bGwgfHxcbiAgICAgICAgICAgICAgICAgIGhhc0luaXRpYWxWYWx1ZUNoYW5nZWQoY29udGV4dCwgZGlzdGFudEN0eEZsYWcsIHZhbHVlKSkge1xuICAgICAgICAgICAgICAgIHNldERpcnR5KGNvbnRleHQsIGN0eEluZGV4LCB0cnVlKTtcbiAgICAgICAgICAgICAgICBkaXJ0eSA9IHRydWU7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGRpc3RhbnRDdHhEaXJlY3RpdmVJbmRleCAhPT0gZGlyZWN0aXZlSW5kZXggfHxcbiAgICAgICAgICAgICAgICBwbGF5ZXJCdWlsZGVySW5kZXggIT09IGRpc3RhbnRDdHhQbGF5ZXJCdWlsZGVySW5kZXgpIHtcbiAgICAgICAgICAgICAgc2V0UGxheWVyQnVpbGRlckluZGV4KGNvbnRleHQsIGN0eEluZGV4LCBwbGF5ZXJCdWlsZGVySW5kZXgsIGRpcmVjdGl2ZUluZGV4KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgICBjdHhJbmRleCArPSBTdHlsaW5nSW5kZXguU2l6ZTtcbiAgICAgICAgICBjb250aW51ZSBwcm9wZXJ0aWVzTG9vcDtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBmYWxsYmFjayBjYXNlIC4uLiB2YWx1ZSBub3QgZm91bmQgYXQgYWxsIGluIHRoZSBjb250ZXh0XG4gICAgICBpZiAodmFsdWUgIT0gbnVsbCkge1xuICAgICAgICB2YWx1ZXNFbnRyeVNoYXBlQ2hhbmdlID0gdHJ1ZTtcbiAgICAgICAgdG90YWxVbmlxdWVWYWx1ZXMrKztcbiAgICAgICAgY29uc3QgZmxhZyA9IHByZXBhcmVJbml0aWFsRmxhZyhjb250ZXh0LCBub3JtYWxpemVkUHJvcCwgZW50cnlJc0NsYXNzQmFzZWQsIHNhbml0aXplcikgfFxuICAgICAgICAgICAgU3R5bGluZ0ZsYWdzLkRpcnR5O1xuXG4gICAgICAgIGNvbnN0IGluc2VydGlvbkluZGV4ID0gaXNJbnNpZGVPd25lcnNoaXBBcmVhID9cbiAgICAgICAgICAgIGN0eEluZGV4IDpcbiAgICAgICAgICAgIChvd25lcnNoaXBWYWx1ZXNTdGFydEluZGV4ICsgdG90YWxOZXdBbGxvY2F0ZWRTbG90cyAqIFN0eWxpbmdJbmRleC5TaXplKTtcbiAgICAgICAgaW5zZXJ0TmV3TXVsdGlQcm9wZXJ0eShcbiAgICAgICAgICAgIGNvbnRleHQsIGluc2VydGlvbkluZGV4LCBlbnRyeUlzQ2xhc3NCYXNlZCwgbm9ybWFsaXplZFByb3AsIGZsYWcsIHZhbHVlLCBkaXJlY3RpdmVJbmRleCxcbiAgICAgICAgICAgIHBsYXllckJ1aWxkZXJJbmRleCk7XG5cbiAgICAgICAgdG90YWxOZXdBbGxvY2F0ZWRTbG90cysrO1xuICAgICAgICBjdHhFbmQgKz0gU3R5bGluZ0luZGV4LlNpemU7XG4gICAgICAgIGN0eEluZGV4ICs9IFN0eWxpbmdJbmRleC5TaXplO1xuXG4gICAgICAgIGRpcnR5ID0gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvLyBTVEVQIDM6XG4gIC8vIFJlbW92ZSAobnVsbGlmeSkgYW55IGV4aXN0aW5nIGVudHJpZXMgaW4gdGhlIGNvbnRleHQgdGhhdCB3ZXJlIG5vdCBhcGFydCBvZiB0aGVcbiAgLy8gbWFwIGlucHV0IHZhbHVlIHRoYXQgd2FzIHBhc3NlZCBpbnRvIHRoaXMgYWxnb3JpdGhtIGZvciB0aGlzIGRpcmVjdGl2ZS5cbiAgd2hpbGUgKGN0eEluZGV4IDwgY3R4RW5kKSB7XG4gICAgdmFsdWVzRW50cnlTaGFwZUNoYW5nZSA9IHRydWU7ICAvLyBzb21lIHZhbHVlcyBhcmUgbWlzc2luZ1xuICAgIGNvbnN0IGN0eFZhbHVlID0gZ2V0VmFsdWUoY29udGV4dCwgY3R4SW5kZXgpO1xuICAgIGNvbnN0IGN0eEZsYWcgPSBnZXRQb2ludGVycyhjb250ZXh0LCBjdHhJbmRleCk7XG4gICAgY29uc3QgY3R4RGlyZWN0aXZlID0gZ2V0RGlyZWN0aXZlSW5kZXhGcm9tRW50cnkoY29udGV4dCwgY3R4SW5kZXgpO1xuICAgIGlmIChjdHhWYWx1ZSAhPSBudWxsKSB7XG4gICAgICB2YWx1ZXNFbnRyeVNoYXBlQ2hhbmdlID0gdHJ1ZTtcbiAgICB9XG4gICAgaWYgKGhhc1ZhbHVlQ2hhbmdlZChjdHhGbGFnLCBjdHhWYWx1ZSwgbnVsbCkpIHtcbiAgICAgIHNldFZhbHVlKGNvbnRleHQsIGN0eEluZGV4LCBudWxsKTtcbiAgICAgIC8vIG9ubHkgaWYgdGhlIGluaXRpYWwgdmFsdWUgaXMgZmFsc3kgdGhlblxuICAgICAgaWYgKGhhc0luaXRpYWxWYWx1ZUNoYW5nZWQoY29udGV4dCwgY3R4RmxhZywgY3R4VmFsdWUpKSB7XG4gICAgICAgIHNldERpcnR5KGNvbnRleHQsIGN0eEluZGV4LCB0cnVlKTtcbiAgICAgICAgZGlydHkgPSB0cnVlO1xuICAgICAgfVxuICAgICAgc2V0UGxheWVyQnVpbGRlckluZGV4KGNvbnRleHQsIGN0eEluZGV4LCBwbGF5ZXJCdWlsZGVySW5kZXgsIGRpcmVjdGl2ZUluZGV4KTtcbiAgICB9XG4gICAgY3R4SW5kZXggKz0gU3R5bGluZ0luZGV4LlNpemU7XG4gIH1cblxuICAvLyBCZWNhdXNlIHRoZSBvYmplY3Qgc2hhcGUgaGFzIGNoYW5nZWQsIHRoaXMgbWVhbnMgdGhhdCBhbGwgZm9sbG93LXVwIGRpcmVjdGl2ZXMgd2lsbCBuZWVkIHRvXG4gIC8vIHJlYXBwbHkgdGhlaXIgdmFsdWVzIGludG8gdGhlIG9iamVjdC4gRm9yIHRoaXMgdG8gaGFwcGVuLCB0aGUgY2FjaGVkIGFycmF5IG5lZWRzIHRvIGJlIHVwZGF0ZWRcbiAgLy8gd2l0aCBkaXJ0eSBmbGFncyBzbyB0aGF0IGZvbGxvdy11cCBjYWxscyB0byBgdXBkYXRlU3R5bGluZ01hcGAgd2lsbCByZWFwcGx5IHRoZWlyIHN0eWxpbmcgY29kZS5cbiAgLy8gdGhlIHJlYXBwbGljYXRpb24gb2Ygc3R5bGluZyBjb2RlIHdpdGhpbiB0aGUgY29udGV4dCB3aWxsIHJlc2hhcGUgaXQgYW5kIHVwZGF0ZSB0aGUgb2Zmc2V0XG4gIC8vIHZhbHVlcyAoYWxzbyBmb2xsb3ctdXAgZGlyZWN0aXZlcyBjYW4gd3JpdGUgbmV3IHZhbHVlcyBpbmNhc2UgZWFybGllciBkaXJlY3RpdmVzIHNldCBhbnl0aGluZ1xuICAvLyB0byBudWxsIGR1ZSB0byByZW1vdmFscyBvciBmYWxzeSB2YWx1ZXMpLlxuICB2YWx1ZXNFbnRyeVNoYXBlQ2hhbmdlID0gdmFsdWVzRW50cnlTaGFwZUNoYW5nZSB8fCBleGlzdGluZ0NhY2hlZFZhbHVlQ291bnQgIT09IHRvdGFsVW5pcXVlVmFsdWVzO1xuICB1cGRhdGVDYWNoZWRNYXBWYWx1ZShcbiAgICAgIGNvbnRleHQsIGRpcmVjdGl2ZUluZGV4LCBlbnRyeUlzQ2xhc3NCYXNlZCwgY2FjaGVWYWx1ZSwgb3duZXJzaGlwVmFsdWVzU3RhcnRJbmRleCwgY3R4RW5kLFxuICAgICAgdG90YWxVbmlxdWVWYWx1ZXMsIHZhbHVlc0VudHJ5U2hhcGVDaGFuZ2UpO1xuXG4gIGlmIChkaXJ0eSkge1xuICAgIHNldENvbnRleHREaXJ0eShjb250ZXh0LCB0cnVlKTtcbiAgICBzZXREaXJlY3RpdmVEaXJ0eShjb250ZXh0LCBkaXJlY3RpdmVJbmRleCwgdHJ1ZSk7XG4gIH1cblxuICByZXR1cm4gdG90YWxOZXdBbGxvY2F0ZWRTbG90cztcbn1cblxuLyoqXG4gKiBTZXRzIGFuZCByZXNvbHZlcyBhIHNpbmdsZSBjbGFzcyB2YWx1ZSBvbiB0aGUgcHJvdmlkZWQgYFN0eWxpbmdDb250ZXh0YCBzb1xuICogdGhhdCB0aGV5IGNhbiBiZSBhcHBsaWVkIHRvIHRoZSBlbGVtZW50IG9uY2UgYHJlbmRlclN0eWxpbmdgIGlzIGNhbGxlZC5cbiAqXG4gKiBAcGFyYW0gY29udGV4dCBUaGUgc3R5bGluZyBjb250ZXh0IHRoYXQgd2lsbCBiZSB1cGRhdGVkIHdpdGggdGhlXG4gKiAgICBuZXdseSBwcm92aWRlZCBjbGFzcyB2YWx1ZS5cbiAqIEBwYXJhbSBvZmZzZXQgVGhlIGluZGV4IG9mIHRoZSBDU1MgY2xhc3Mgd2hpY2ggaXMgYmVpbmcgdXBkYXRlZC5cbiAqIEBwYXJhbSBhZGRPclJlbW92ZSBXaGV0aGVyIG9yIG5vdCB0byBhZGQgb3IgcmVtb3ZlIHRoZSBDU1MgY2xhc3NcbiAqIEBwYXJhbSBkaXJlY3RpdmVSZWYgYW4gb3B0aW9uYWwgcmVmZXJlbmNlIHRvIHRoZSBkaXJlY3RpdmUgcmVzcG9uc2libGVcbiAqICAgIGZvciB0aGlzIGJpbmRpbmcgY2hhbmdlLiBJZiBwcmVzZW50IHRoZW4gc3R5bGUgYmluZGluZyB3aWxsIG9ubHlcbiAqICAgIGFjdHVhbGl6ZSBpZiB0aGUgZGlyZWN0aXZlIGhhcyBvd25lcnNoaXAgb3ZlciB0aGlzIGJpbmRpbmdcbiAqICAgIChzZWUgc3R5bGluZy50cyNkaXJlY3RpdmVzIGZvciBtb3JlIGluZm9ybWF0aW9uIGFib3V0IHRoZSBhbGdvcml0aG0pLlxuICogQHBhcmFtIGZvcmNlT3ZlcnJpZGUgd2hldGhlciBvciBub3QgdG8gc2tpcCBhbGwgZGlyZWN0aXZlIHByaW9yaXRpemF0aW9uXG4gKiAgICBhbmQganVzdCBhcHBseSB0aGUgdmFsdWUgcmVnYXJkbGVzcy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHVwZGF0ZUNsYXNzUHJvcChcbiAgICBjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgb2Zmc2V0OiBudW1iZXIsXG4gICAgaW5wdXQ6IGJvb2xlYW4gfCBCb3VuZFBsYXllckZhY3Rvcnk8Ym9vbGVhbnxudWxsPnwgbnVsbCwgZGlyZWN0aXZlUmVmPzogYW55LFxuICAgIGZvcmNlT3ZlcnJpZGU/OiBib29sZWFuKTogdm9pZCB7XG4gIHVwZGF0ZVNpbmdsZVN0eWxpbmdWYWx1ZShjb250ZXh0LCBvZmZzZXQsIGlucHV0LCB0cnVlLCBkaXJlY3RpdmVSZWYsIGZvcmNlT3ZlcnJpZGUpO1xufVxuXG4vKipcbiAqIFNldHMgYW5kIHJlc29sdmVzIGEgc2luZ2xlIHN0eWxlIHZhbHVlIG9uIHRoZSBwcm92aWRlZCBgU3R5bGluZ0NvbnRleHRgIHNvXG4gKiB0aGF0IHRoZXkgY2FuIGJlIGFwcGxpZWQgdG8gdGhlIGVsZW1lbnQgb25jZSBgcmVuZGVyU3R5bGluZ2AgaXMgY2FsbGVkLlxuICpcbiAqIE5vdGUgdGhhdCBwcm9wLWxldmVsIHN0eWxpbmcgdmFsdWVzIGFyZSBjb25zaWRlcmVkIGhpZ2hlciBwcmlvcml0eSB0aGFuIGFueSBzdHlsaW5nIHRoYXRcbiAqIGhhcyBiZWVuIGFwcGxpZWQgdXNpbmcgYHVwZGF0ZVN0eWxpbmdNYXBgLCB0aGVyZWZvcmUsIHdoZW4gc3R5bGluZyB2YWx1ZXMgYXJlIHJlbmRlcmVkXG4gKiB0aGVuIGFueSBzdHlsZXMvY2xhc3NlcyB0aGF0IGhhdmUgYmVlbiBhcHBsaWVkIHVzaW5nIHRoaXMgZnVuY3Rpb24gd2lsbCBiZSBjb25zaWRlcmVkIGZpcnN0XG4gKiAodGhlbiBtdWx0aSB2YWx1ZXMgc2Vjb25kIGFuZCB0aGVuIGluaXRpYWwgdmFsdWVzIGFzIGEgYmFja3VwKS5cbiAqXG4gKiBAcGFyYW0gY29udGV4dCBUaGUgc3R5bGluZyBjb250ZXh0IHRoYXQgd2lsbCBiZSB1cGRhdGVkIHdpdGggdGhlXG4gKiAgICBuZXdseSBwcm92aWRlZCBzdHlsZSB2YWx1ZS5cbiAqIEBwYXJhbSBvZmZzZXQgVGhlIGluZGV4IG9mIHRoZSBwcm9wZXJ0eSB3aGljaCBpcyBiZWluZyB1cGRhdGVkLlxuICogQHBhcmFtIHZhbHVlIFRoZSBDU1Mgc3R5bGUgdmFsdWUgdGhhdCB3aWxsIGJlIGFzc2lnbmVkXG4gKiBAcGFyYW0gZGlyZWN0aXZlUmVmIGFuIG9wdGlvbmFsIHJlZmVyZW5jZSB0byB0aGUgZGlyZWN0aXZlIHJlc3BvbnNpYmxlXG4gKiAgICBmb3IgdGhpcyBiaW5kaW5nIGNoYW5nZS4gSWYgcHJlc2VudCB0aGVuIHN0eWxlIGJpbmRpbmcgd2lsbCBvbmx5XG4gKiAgICBhY3R1YWxpemUgaWYgdGhlIGRpcmVjdGl2ZSBoYXMgb3duZXJzaGlwIG92ZXIgdGhpcyBiaW5kaW5nXG4gKiAgICAoc2VlIHN0eWxpbmcudHMjZGlyZWN0aXZlcyBmb3IgbW9yZSBpbmZvcm1hdGlvbiBhYm91dCB0aGUgYWxnb3JpdGhtKS5cbiAqIEBwYXJhbSBmb3JjZU92ZXJyaWRlIHdoZXRoZXIgb3Igbm90IHRvIHNraXAgYWxsIGRpcmVjdGl2ZSBwcmlvcml0aXphdGlvblxuICogICAgYW5kIGp1c3QgYXBwbHkgdGhlIHZhbHVlIHJlZ2FyZGxlc3MuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB1cGRhdGVTdHlsZVByb3AoXG4gICAgY29udGV4dDogU3R5bGluZ0NvbnRleHQsIG9mZnNldDogbnVtYmVyLFxuICAgIGlucHV0OiBzdHJpbmcgfCBib29sZWFuIHwgbnVsbCB8IEJvdW5kUGxheWVyRmFjdG9yeTxzdHJpbmd8Ym9vbGVhbnxudWxsPiwgZGlyZWN0aXZlUmVmPzogYW55LFxuICAgIGZvcmNlT3ZlcnJpZGU/OiBib29sZWFuKTogdm9pZCB7XG4gIHVwZGF0ZVNpbmdsZVN0eWxpbmdWYWx1ZShjb250ZXh0LCBvZmZzZXQsIGlucHV0LCBmYWxzZSwgZGlyZWN0aXZlUmVmLCBmb3JjZU92ZXJyaWRlKTtcbn1cblxuZnVuY3Rpb24gdXBkYXRlU2luZ2xlU3R5bGluZ1ZhbHVlKFxuICAgIGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBvZmZzZXQ6IG51bWJlcixcbiAgICBpbnB1dDogc3RyaW5nIHwgYm9vbGVhbiB8IG51bGwgfCBCb3VuZFBsYXllckZhY3Rvcnk8c3RyaW5nfGJvb2xlYW58bnVsbD4sIGlzQ2xhc3NCYXNlZDogYm9vbGVhbixcbiAgICBkaXJlY3RpdmVSZWY6IGFueSwgZm9yY2VPdmVycmlkZT86IGJvb2xlYW4pOiB2b2lkIHtcbiAgY29uc3QgZGlyZWN0aXZlSW5kZXggPSBnZXREaXJlY3RpdmVJbmRleEZyb21SZWdpc3RyeShjb250ZXh0LCBkaXJlY3RpdmVSZWYgfHwgbnVsbCk7XG4gIGNvbnN0IHNpbmdsZUluZGV4ID0gZ2V0U2luZ2xlUHJvcEluZGV4VmFsdWUoY29udGV4dCwgZGlyZWN0aXZlSW5kZXgsIG9mZnNldCwgaXNDbGFzc0Jhc2VkKTtcbiAgY29uc3QgY3VyclZhbHVlID0gZ2V0VmFsdWUoY29udGV4dCwgc2luZ2xlSW5kZXgpO1xuICBjb25zdCBjdXJyRmxhZyA9IGdldFBvaW50ZXJzKGNvbnRleHQsIHNpbmdsZUluZGV4KTtcbiAgY29uc3QgY3VyckRpcmVjdGl2ZSA9IGdldERpcmVjdGl2ZUluZGV4RnJvbUVudHJ5KGNvbnRleHQsIHNpbmdsZUluZGV4KTtcbiAgY29uc3QgdmFsdWU6IHN0cmluZ3xib29sZWFufG51bGwgPSAoaW5wdXQgaW5zdGFuY2VvZiBCb3VuZFBsYXllckZhY3RvcnkpID8gaW5wdXQudmFsdWUgOiBpbnB1dDtcblxuICBpZiAoaGFzVmFsdWVDaGFuZ2VkKGN1cnJGbGFnLCBjdXJyVmFsdWUsIHZhbHVlKSAmJlxuICAgICAgKGZvcmNlT3ZlcnJpZGUgfHwgYWxsb3dWYWx1ZUNoYW5nZShjdXJyVmFsdWUsIHZhbHVlLCBjdXJyRGlyZWN0aXZlLCBkaXJlY3RpdmVJbmRleCkpKSB7XG4gICAgY29uc3QgaXNDbGFzc0Jhc2VkID0gKGN1cnJGbGFnICYgU3R5bGluZ0ZsYWdzLkNsYXNzKSA9PT0gU3R5bGluZ0ZsYWdzLkNsYXNzO1xuICAgIGNvbnN0IGVsZW1lbnQgPSBjb250ZXh0W1N0eWxpbmdJbmRleC5FbGVtZW50UG9zaXRpb25dICFhcyBIVE1MRWxlbWVudDtcbiAgICBjb25zdCBwbGF5ZXJCdWlsZGVyID0gaW5wdXQgaW5zdGFuY2VvZiBCb3VuZFBsYXllckZhY3RvcnkgP1xuICAgICAgICBuZXcgQ2xhc3NBbmRTdHlsZVBsYXllckJ1aWxkZXIoXG4gICAgICAgICAgICBpbnB1dCBhcyBhbnksIGVsZW1lbnQsIGlzQ2xhc3NCYXNlZCA/IEJpbmRpbmdUeXBlLkNsYXNzIDogQmluZGluZ1R5cGUuU3R5bGUpIDpcbiAgICAgICAgbnVsbDtcbiAgICBjb25zdCB2YWx1ZSA9IChwbGF5ZXJCdWlsZGVyID8gKGlucHV0IGFzIEJvdW5kUGxheWVyRmFjdG9yeTxhbnk+KS52YWx1ZSA6IGlucHV0KSBhcyBzdHJpbmcgfFxuICAgICAgICBib29sZWFuIHwgbnVsbDtcbiAgICBjb25zdCBjdXJyUGxheWVySW5kZXggPSBnZXRQbGF5ZXJCdWlsZGVySW5kZXgoY29udGV4dCwgc2luZ2xlSW5kZXgpO1xuXG4gICAgbGV0IHBsYXllckJ1aWxkZXJzQXJlRGlydHkgPSBmYWxzZTtcbiAgICBsZXQgcGxheWVyQnVpbGRlckluZGV4ID0gcGxheWVyQnVpbGRlciA/IGN1cnJQbGF5ZXJJbmRleCA6IDA7XG4gICAgaWYgKGhhc1BsYXllckJ1aWxkZXJDaGFuZ2VkKGNvbnRleHQsIHBsYXllckJ1aWxkZXIsIGN1cnJQbGF5ZXJJbmRleCkpIHtcbiAgICAgIGNvbnN0IG5ld0luZGV4ID0gc2V0UGxheWVyQnVpbGRlcihjb250ZXh0LCBwbGF5ZXJCdWlsZGVyLCBjdXJyUGxheWVySW5kZXgpO1xuICAgICAgcGxheWVyQnVpbGRlckluZGV4ID0gcGxheWVyQnVpbGRlciA/IG5ld0luZGV4IDogMDtcbiAgICAgIHBsYXllckJ1aWxkZXJzQXJlRGlydHkgPSB0cnVlO1xuICAgIH1cblxuICAgIGlmIChwbGF5ZXJCdWlsZGVyc0FyZURpcnR5IHx8IGN1cnJEaXJlY3RpdmUgIT09IGRpcmVjdGl2ZUluZGV4KSB7XG4gICAgICBzZXRQbGF5ZXJCdWlsZGVySW5kZXgoY29udGV4dCwgc2luZ2xlSW5kZXgsIHBsYXllckJ1aWxkZXJJbmRleCwgZGlyZWN0aXZlSW5kZXgpO1xuICAgIH1cblxuICAgIGlmIChjdXJyRGlyZWN0aXZlICE9PSBkaXJlY3RpdmVJbmRleCkge1xuICAgICAgY29uc3QgcHJvcCA9IGdldFByb3AoY29udGV4dCwgc2luZ2xlSW5kZXgpO1xuICAgICAgY29uc3Qgc2FuaXRpemVyID0gZ2V0U3R5bGVTYW5pdGl6ZXIoY29udGV4dCwgZGlyZWN0aXZlSW5kZXgpO1xuICAgICAgc2V0U2FuaXRpemVGbGFnKGNvbnRleHQsIHNpbmdsZUluZGV4LCAoc2FuaXRpemVyICYmIHNhbml0aXplcihwcm9wKSkgPyB0cnVlIDogZmFsc2UpO1xuICAgIH1cblxuICAgIC8vIHRoZSB2YWx1ZSB3aWxsIGFsd2F5cyBnZXQgdXBkYXRlZCAoZXZlbiBpZiB0aGUgZGlydHkgZmxhZyBpcyBza2lwcGVkKVxuICAgIHNldFZhbHVlKGNvbnRleHQsIHNpbmdsZUluZGV4LCB2YWx1ZSk7XG4gICAgY29uc3QgaW5kZXhGb3JNdWx0aSA9IGdldE11bHRpT3JTaW5nbGVJbmRleChjdXJyRmxhZyk7XG5cbiAgICAvLyBpZiB0aGUgdmFsdWUgaXMgdGhlIHNhbWUgaW4gdGhlIG11bHRpLWFyZWEgdGhlbiB0aGVyZSdzIG5vIHBvaW50IGluIHJlLWFzc2VtYmxpbmdcbiAgICBjb25zdCB2YWx1ZUZvck11bHRpID0gZ2V0VmFsdWUoY29udGV4dCwgaW5kZXhGb3JNdWx0aSk7XG4gICAgaWYgKCF2YWx1ZUZvck11bHRpIHx8IGhhc1ZhbHVlQ2hhbmdlZChjdXJyRmxhZywgdmFsdWVGb3JNdWx0aSwgdmFsdWUpKSB7XG4gICAgICBsZXQgbXVsdGlEaXJ0eSA9IGZhbHNlO1xuICAgICAgbGV0IHNpbmdsZURpcnR5ID0gdHJ1ZTtcblxuICAgICAgLy8gb25seSB3aGVuIHRoZSB2YWx1ZSBpcyBzZXQgdG8gYG51bGxgIHNob3VsZCB0aGUgbXVsdGktdmFsdWUgZ2V0IGZsYWdnZWRcbiAgICAgIGlmICghdmFsdWVFeGlzdHModmFsdWUsIGlzQ2xhc3NCYXNlZCkgJiYgdmFsdWVFeGlzdHModmFsdWVGb3JNdWx0aSwgaXNDbGFzc0Jhc2VkKSkge1xuICAgICAgICBtdWx0aURpcnR5ID0gdHJ1ZTtcbiAgICAgICAgc2luZ2xlRGlydHkgPSBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgc2V0RGlydHkoY29udGV4dCwgaW5kZXhGb3JNdWx0aSwgbXVsdGlEaXJ0eSk7XG4gICAgICBzZXREaXJ0eShjb250ZXh0LCBzaW5nbGVJbmRleCwgc2luZ2xlRGlydHkpO1xuICAgICAgc2V0RGlyZWN0aXZlRGlydHkoY29udGV4dCwgZGlyZWN0aXZlSW5kZXgsIHRydWUpO1xuICAgICAgc2V0Q29udGV4dERpcnR5KGNvbnRleHQsIHRydWUpO1xuICAgIH1cblxuICAgIGlmIChwbGF5ZXJCdWlsZGVyc0FyZURpcnR5KSB7XG4gICAgICBzZXRDb250ZXh0UGxheWVyc0RpcnR5KGNvbnRleHQsIHRydWUpO1xuICAgIH1cbiAgfVxufVxuXG5cbi8qKlxuICogUmVuZGVycyBhbGwgcXVldWVkIHN0eWxpbmcgdXNpbmcgYSByZW5kZXJlciBvbnRvIHRoZSBnaXZlbiBlbGVtZW50LlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gd29ya3MgYnkgcmVuZGVyaW5nIGFueSBzdHlsZXMgKHRoYXQgaGF2ZSBiZWVuIGFwcGxpZWRcbiAqIHVzaW5nIGB1cGRhdGVTdHlsaW5nTWFwYCkgYW5kIGFueSBjbGFzc2VzICh0aGF0IGhhdmUgYmVlbiBhcHBsaWVkIHVzaW5nXG4gKiBgdXBkYXRlU3R5bGVQcm9wYCkgb250byB0aGUgcHJvdmlkZWQgZWxlbWVudCB1c2luZyB0aGUgcHJvdmlkZWQgcmVuZGVyZXIuXG4gKiBKdXN0IGJlZm9yZSB0aGUgc3R5bGVzL2NsYXNzZXMgYXJlIHJlbmRlcmVkIGEgZmluYWwga2V5L3ZhbHVlIHN0eWxlIG1hcFxuICogd2lsbCBiZSBhc3NlbWJsZWQgKGlmIGBzdHlsZVN0b3JlYCBvciBgY2xhc3NTdG9yZWAgYXJlIHByb3ZpZGVkKS5cbiAqXG4gKiBAcGFyYW0gbEVsZW1lbnQgdGhlIGVsZW1lbnQgdGhhdCB0aGUgc3R5bGVzIHdpbGwgYmUgcmVuZGVyZWQgb25cbiAqIEBwYXJhbSBjb250ZXh0IFRoZSBzdHlsaW5nIGNvbnRleHQgdGhhdCB3aWxsIGJlIHVzZWQgdG8gZGV0ZXJtaW5lXG4gKiAgICAgIHdoYXQgc3R5bGVzIHdpbGwgYmUgcmVuZGVyZWRcbiAqIEBwYXJhbSByZW5kZXJlciB0aGUgcmVuZGVyZXIgdGhhdCB3aWxsIGJlIHVzZWQgdG8gYXBwbHkgdGhlIHN0eWxpbmdcbiAqIEBwYXJhbSBjbGFzc2VzU3RvcmUgaWYgcHJvdmlkZWQsIHRoZSB1cGRhdGVkIGNsYXNzIHZhbHVlcyB3aWxsIGJlIGFwcGxpZWRcbiAqICAgIHRvIHRoaXMga2V5L3ZhbHVlIG1hcCBpbnN0ZWFkIG9mIGJlaW5nIHJlbmRlcmVyZWQgdmlhIHRoZSByZW5kZXJlci5cbiAqIEBwYXJhbSBzdHlsZXNTdG9yZSBpZiBwcm92aWRlZCwgdGhlIHVwZGF0ZWQgc3R5bGUgdmFsdWVzIHdpbGwgYmUgYXBwbGllZFxuICogICAgdG8gdGhpcyBrZXkvdmFsdWUgbWFwIGluc3RlYWQgb2YgYmVpbmcgcmVuZGVyZXJlZCB2aWEgdGhlIHJlbmRlcmVyLlxuICogQHBhcmFtIGRpcmVjdGl2ZVJlZiBhbiBvcHRpb25hbCBkaXJlY3RpdmUgdGhhdCB3aWxsIGJlIHVzZWQgdG8gdGFyZ2V0IHdoaWNoXG4gKiAgICBzdHlsaW5nIHZhbHVlcyBhcmUgcmVuZGVyZWQuIElmIGxlZnQgZW1wdHksIG9ubHkgdGhlIGJpbmRpbmdzIHRoYXQgYXJlXG4gKiAgICByZWdpc3RlcmVkIG9uIHRoZSB0ZW1wbGF0ZSB3aWxsIGJlIHJlbmRlcmVkLlxuICogQHJldHVybnMgbnVtYmVyIHRoZSB0b3RhbCBhbW91bnQgb2YgcGxheWVycyB0aGF0IGdvdCBxdWV1ZWQgZm9yIGFuaW1hdGlvbiAoaWYgYW55KVxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVuZGVyU3R5bGluZyhcbiAgICBjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgcmVuZGVyZXI6IFJlbmRlcmVyMywgcm9vdE9yVmlldzogUm9vdENvbnRleHQgfCBMVmlldyxcbiAgICBpc0ZpcnN0UmVuZGVyOiBib29sZWFuLCBjbGFzc2VzU3RvcmU/OiBCaW5kaW5nU3RvcmUgfCBudWxsLCBzdHlsZXNTdG9yZT86IEJpbmRpbmdTdG9yZSB8IG51bGwsXG4gICAgZGlyZWN0aXZlUmVmPzogYW55KTogbnVtYmVyIHtcbiAgbGV0IHRvdGFsUGxheWVyc1F1ZXVlZCA9IDA7XG4gIGNvbnN0IHRhcmdldERpcmVjdGl2ZUluZGV4ID0gZ2V0RGlyZWN0aXZlSW5kZXhGcm9tUmVnaXN0cnkoY29udGV4dCwgZGlyZWN0aXZlUmVmIHx8IG51bGwpO1xuXG4gIGlmIChpc0NvbnRleHREaXJ0eShjb250ZXh0KSAmJiBpc0RpcmVjdGl2ZURpcnR5KGNvbnRleHQsIHRhcmdldERpcmVjdGl2ZUluZGV4KSkge1xuICAgIGNvbnN0IGZsdXNoUGxheWVyQnVpbGRlcnM6IGFueSA9XG4gICAgICAgIGNvbnRleHRbU3R5bGluZ0luZGV4Lk1hc3RlckZsYWdQb3NpdGlvbl0gJiBTdHlsaW5nRmxhZ3MuUGxheWVyQnVpbGRlcnNEaXJ0eTtcbiAgICBjb25zdCBuYXRpdmUgPSBjb250ZXh0W1N0eWxpbmdJbmRleC5FbGVtZW50UG9zaXRpb25dICE7XG4gICAgY29uc3QgbXVsdGlTdGFydEluZGV4ID0gZ2V0TXVsdGlTdHlsZXNTdGFydEluZGV4KGNvbnRleHQpO1xuXG4gICAgbGV0IHN0aWxsRGlydHkgPSBmYWxzZTtcbiAgICBmb3IgKGxldCBpID0gU3R5bGluZ0luZGV4LlNpbmdsZVN0eWxlc1N0YXJ0UG9zaXRpb247IGkgPCBjb250ZXh0Lmxlbmd0aDtcbiAgICAgICAgIGkgKz0gU3R5bGluZ0luZGV4LlNpemUpIHtcbiAgICAgIC8vIHRoZXJlIGlzIG5vIHBvaW50IGluIHJlbmRlcmluZyBzdHlsZXMgdGhhdCBoYXZlIG5vdCBjaGFuZ2VkIG9uIHNjcmVlblxuICAgICAgaWYgKGlzRGlydHkoY29udGV4dCwgaSkpIHtcbiAgICAgICAgY29uc3QgZmxhZyA9IGdldFBvaW50ZXJzKGNvbnRleHQsIGkpO1xuICAgICAgICBjb25zdCBkaXJlY3RpdmVJbmRleCA9IGdldERpcmVjdGl2ZUluZGV4RnJvbUVudHJ5KGNvbnRleHQsIGkpO1xuICAgICAgICBpZiAodGFyZ2V0RGlyZWN0aXZlSW5kZXggIT09IGRpcmVjdGl2ZUluZGV4KSB7XG4gICAgICAgICAgc3RpbGxEaXJ0eSA9IHRydWU7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBwcm9wID0gZ2V0UHJvcChjb250ZXh0LCBpKTtcbiAgICAgICAgY29uc3QgdmFsdWUgPSBnZXRWYWx1ZShjb250ZXh0LCBpKTtcbiAgICAgICAgY29uc3Qgc3R5bGVTYW5pdGl6ZXIgPVxuICAgICAgICAgICAgKGZsYWcgJiBTdHlsaW5nRmxhZ3MuU2FuaXRpemUpID8gZ2V0U3R5bGVTYW5pdGl6ZXIoY29udGV4dCwgZGlyZWN0aXZlSW5kZXgpIDogbnVsbDtcbiAgICAgICAgY29uc3QgcGxheWVyQnVpbGRlciA9IGdldFBsYXllckJ1aWxkZXIoY29udGV4dCwgaSk7XG4gICAgICAgIGNvbnN0IGlzQ2xhc3NCYXNlZCA9IGZsYWcgJiBTdHlsaW5nRmxhZ3MuQ2xhc3MgPyB0cnVlIDogZmFsc2U7XG4gICAgICAgIGNvbnN0IGlzSW5TaW5nbGVSZWdpb24gPSBpIDwgbXVsdGlTdGFydEluZGV4O1xuXG4gICAgICAgIGxldCB2YWx1ZVRvQXBwbHk6IHN0cmluZ3xib29sZWFufG51bGwgPSB2YWx1ZTtcblxuICAgICAgICAvLyBWQUxVRSBERUZFUiBDQVNFIDE6IFVzZSBhIG11bHRpIHZhbHVlIGluc3RlYWQgb2YgYSBudWxsIHNpbmdsZSB2YWx1ZVxuICAgICAgICAvLyB0aGlzIGNoZWNrIGltcGxpZXMgdGhhdCBhIHNpbmdsZSB2YWx1ZSB3YXMgcmVtb3ZlZCBhbmQgd2VcbiAgICAgICAgLy8gc2hvdWxkIG5vdyBkZWZlciB0byBhIG11bHRpIHZhbHVlIGFuZCB1c2UgdGhhdCAoaWYgc2V0KS5cbiAgICAgICAgaWYgKGlzSW5TaW5nbGVSZWdpb24gJiYgIXZhbHVlRXhpc3RzKHZhbHVlVG9BcHBseSwgaXNDbGFzc0Jhc2VkKSkge1xuICAgICAgICAgIC8vIHNpbmdsZSB2YWx1ZXMgQUxXQVlTIGhhdmUgYSByZWZlcmVuY2UgdG8gYSBtdWx0aSBpbmRleFxuICAgICAgICAgIGNvbnN0IG11bHRpSW5kZXggPSBnZXRNdWx0aU9yU2luZ2xlSW5kZXgoZmxhZyk7XG4gICAgICAgICAgdmFsdWVUb0FwcGx5ID0gZ2V0VmFsdWUoY29udGV4dCwgbXVsdGlJbmRleCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBWQUxVRSBERUZFUiBDQVNFIDI6IFVzZSB0aGUgaW5pdGlhbCB2YWx1ZSBpZiBhbGwgZWxzZSBmYWlscyAoaXMgZmFsc3kpXG4gICAgICAgIC8vIHRoZSBpbml0aWFsIHZhbHVlIHdpbGwgYWx3YXlzIGJlIGEgc3RyaW5nIG9yIG51bGwsXG4gICAgICAgIC8vIHRoZXJlZm9yZSB3ZSBjYW4gc2FmZWx5IGFkb3B0IGl0IGluY2FzZSB0aGVyZSdzIG5vdGhpbmcgZWxzZVxuICAgICAgICAvLyBub3RlIHRoYXQgdGhpcyBzaG91bGQgYWx3YXlzIGJlIGEgZmFsc3kgY2hlY2sgc2luY2UgYGZhbHNlYCBpcyB1c2VkXG4gICAgICAgIC8vIGZvciBib3RoIGNsYXNzIGFuZCBzdHlsZSBjb21wYXJpc29ucyAoc3R5bGVzIGNhbid0IGJlIGZhbHNlIGFuZCBmYWxzZVxuICAgICAgICAvLyBjbGFzc2VzIGFyZSB0dXJuZWQgb2ZmIGFuZCBzaG91bGQgdGhlcmVmb3JlIGRlZmVyIHRvIHRoZWlyIGluaXRpYWwgdmFsdWVzKVxuICAgICAgICAvLyBOb3RlIHRoYXQgd2UgaWdub3JlIGNsYXNzLWJhc2VkIGRlZmVyYWxzIGJlY2F1c2Ugb3RoZXJ3aXNlIGEgY2xhc3MgY2FuIG5ldmVyXG4gICAgICAgIC8vIGJlIHJlbW92ZWQgaW4gdGhlIGNhc2UgdGhhdCBpdCBleGlzdHMgYXMgdHJ1ZSBpbiB0aGUgaW5pdGlhbCBjbGFzc2VzIGxpc3QuLi5cbiAgICAgICAgaWYgKCF2YWx1ZUV4aXN0cyh2YWx1ZVRvQXBwbHksIGlzQ2xhc3NCYXNlZCkpIHtcbiAgICAgICAgICB2YWx1ZVRvQXBwbHkgPSBnZXRJbml0aWFsVmFsdWUoY29udGV4dCwgZmxhZyk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBpZiB0aGUgZmlyc3QgcmVuZGVyIGlzIHRydWUgdGhlbiB3ZSBkbyBub3Qgd2FudCB0byBzdGFydCBhcHBseWluZyBmYWxzeVxuICAgICAgICAvLyB2YWx1ZXMgdG8gdGhlIERPTSBlbGVtZW50J3Mgc3R5bGluZy4gT3RoZXJ3aXNlIHRoZW4gd2Uga25vdyB0aGVyZSBoYXNcbiAgICAgICAgLy8gYmVlbiBhIGNoYW5nZSBhbmQgZXZlbiBpZiBpdCdzIGZhbHN5IHRoZW4gaXQncyByZW1vdmluZyBzb21ldGhpbmcgdGhhdFxuICAgICAgICAvLyB3YXMgdHJ1dGh5IGJlZm9yZS5cbiAgICAgICAgY29uc3QgZG9BcHBseVZhbHVlID0gaXNGaXJzdFJlbmRlciA/IHZhbHVlVG9BcHBseSA6IHRydWU7XG4gICAgICAgIGlmIChkb0FwcGx5VmFsdWUpIHtcbiAgICAgICAgICBpZiAoaXNDbGFzc0Jhc2VkKSB7XG4gICAgICAgICAgICBzZXRDbGFzcyhcbiAgICAgICAgICAgICAgICBuYXRpdmUsIHByb3AsIHZhbHVlVG9BcHBseSA/IHRydWUgOiBmYWxzZSwgcmVuZGVyZXIsIGNsYXNzZXNTdG9yZSwgcGxheWVyQnVpbGRlcik7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNldFN0eWxlKFxuICAgICAgICAgICAgICAgIG5hdGl2ZSwgcHJvcCwgdmFsdWVUb0FwcGx5IGFzIHN0cmluZyB8IG51bGwsIHJlbmRlcmVyLCBzdHlsZVNhbml0aXplciwgc3R5bGVzU3RvcmUsXG4gICAgICAgICAgICAgICAgcGxheWVyQnVpbGRlcik7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgc2V0RGlydHkoY29udGV4dCwgaSwgZmFsc2UpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChmbHVzaFBsYXllckJ1aWxkZXJzKSB7XG4gICAgICBjb25zdCByb290Q29udGV4dCA9XG4gICAgICAgICAgQXJyYXkuaXNBcnJheShyb290T3JWaWV3KSA/IGdldFJvb3RDb250ZXh0KHJvb3RPclZpZXcpIDogcm9vdE9yVmlldyBhcyBSb290Q29udGV4dDtcbiAgICAgIGNvbnN0IHBsYXllckNvbnRleHQgPSBnZXRQbGF5ZXJDb250ZXh0KGNvbnRleHQpICE7XG4gICAgICBjb25zdCBwbGF5ZXJzU3RhcnRJbmRleCA9IHBsYXllckNvbnRleHRbUGxheWVySW5kZXguTm9uQnVpbGRlclBsYXllcnNTdGFydF07XG4gICAgICBmb3IgKGxldCBpID0gUGxheWVySW5kZXguUGxheWVyQnVpbGRlcnNTdGFydFBvc2l0aW9uOyBpIDwgcGxheWVyc1N0YXJ0SW5kZXg7XG4gICAgICAgICAgIGkgKz0gUGxheWVySW5kZXguUGxheWVyQW5kUGxheWVyQnVpbGRlcnNUdXBsZVNpemUpIHtcbiAgICAgICAgY29uc3QgYnVpbGRlciA9IHBsYXllckNvbnRleHRbaV0gYXMgQ2xhc3NBbmRTdHlsZVBsYXllckJ1aWxkZXI8YW55PnwgbnVsbDtcbiAgICAgICAgY29uc3QgcGxheWVySW5zZXJ0aW9uSW5kZXggPSBpICsgUGxheWVySW5kZXguUGxheWVyT2Zmc2V0UG9zaXRpb247XG4gICAgICAgIGNvbnN0IG9sZFBsYXllciA9IHBsYXllckNvbnRleHRbcGxheWVySW5zZXJ0aW9uSW5kZXhdIGFzIFBsYXllciB8IG51bGw7XG4gICAgICAgIGlmIChidWlsZGVyKSB7XG4gICAgICAgICAgY29uc3QgcGxheWVyID0gYnVpbGRlci5idWlsZFBsYXllcihvbGRQbGF5ZXIsIGlzRmlyc3RSZW5kZXIpO1xuICAgICAgICAgIGlmIChwbGF5ZXIgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgaWYgKHBsYXllciAhPSBudWxsKSB7XG4gICAgICAgICAgICAgIGNvbnN0IHdhc1F1ZXVlZCA9IGFkZFBsYXllckludGVybmFsKFxuICAgICAgICAgICAgICAgICAgcGxheWVyQ29udGV4dCwgcm9vdENvbnRleHQsIG5hdGl2ZSBhcyBIVE1MRWxlbWVudCwgcGxheWVyLCBwbGF5ZXJJbnNlcnRpb25JbmRleCk7XG4gICAgICAgICAgICAgIHdhc1F1ZXVlZCAmJiB0b3RhbFBsYXllcnNRdWV1ZWQrKztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChvbGRQbGF5ZXIpIHtcbiAgICAgICAgICAgICAgb2xkUGxheWVyLmRlc3Ryb3koKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAob2xkUGxheWVyKSB7XG4gICAgICAgICAgLy8gdGhlIHBsYXllciBidWlsZGVyIGhhcyBiZWVuIHJlbW92ZWQgLi4uIHRoZXJlZm9yZSB3ZSBzaG91bGQgZGVsZXRlIHRoZSBhc3NvY2lhdGVkXG4gICAgICAgICAgLy8gcGxheWVyXG4gICAgICAgICAgb2xkUGxheWVyLmRlc3Ryb3koKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgc2V0Q29udGV4dFBsYXllcnNEaXJ0eShjb250ZXh0LCBmYWxzZSk7XG4gICAgfVxuXG4gICAgc2V0RGlyZWN0aXZlRGlydHkoY29udGV4dCwgdGFyZ2V0RGlyZWN0aXZlSW5kZXgsIGZhbHNlKTtcbiAgICBzZXRDb250ZXh0RGlydHkoY29udGV4dCwgc3RpbGxEaXJ0eSk7XG4gIH1cblxuICByZXR1cm4gdG90YWxQbGF5ZXJzUXVldWVkO1xufVxuXG4vKipcbiAqIEFzc2lnbnMgYSBzdHlsZSB2YWx1ZSB0byBhIHN0eWxlIHByb3BlcnR5IGZvciB0aGUgZ2l2ZW4gZWxlbWVudC5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIHJlbmRlcnMgYSBnaXZlbiBDU1MgcHJvcC92YWx1ZSBlbnRyeSB1c2luZyB0aGVcbiAqIHByb3ZpZGVkIHJlbmRlcmVyLiBJZiBhIGBzdG9yZWAgdmFsdWUgaXMgcHJvdmlkZWQgdGhlblxuICogdGhhdCB3aWxsIGJlIHVzZWQgYSByZW5kZXIgY29udGV4dCBpbnN0ZWFkIG9mIHRoZSBwcm92aWRlZFxuICogcmVuZGVyZXIuXG4gKlxuICogQHBhcmFtIG5hdGl2ZSB0aGUgRE9NIEVsZW1lbnRcbiAqIEBwYXJhbSBwcm9wIHRoZSBDU1Mgc3R5bGUgcHJvcGVydHkgdGhhdCB3aWxsIGJlIHJlbmRlcmVkXG4gKiBAcGFyYW0gdmFsdWUgdGhlIENTUyBzdHlsZSB2YWx1ZSB0aGF0IHdpbGwgYmUgcmVuZGVyZWRcbiAqIEBwYXJhbSByZW5kZXJlclxuICogQHBhcmFtIHN0b3JlIGFuIG9wdGlvbmFsIGtleS92YWx1ZSBtYXAgdGhhdCB3aWxsIGJlIHVzZWQgYXMgYSBjb250ZXh0IHRvIHJlbmRlciBzdHlsZXMgb25cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNldFN0eWxlKFxuICAgIG5hdGl2ZTogYW55LCBwcm9wOiBzdHJpbmcsIHZhbHVlOiBzdHJpbmcgfCBudWxsLCByZW5kZXJlcjogUmVuZGVyZXIzLFxuICAgIHNhbml0aXplcjogU3R5bGVTYW5pdGl6ZUZuIHwgbnVsbCwgc3RvcmU/OiBCaW5kaW5nU3RvcmUgfCBudWxsLFxuICAgIHBsYXllckJ1aWxkZXI/OiBDbGFzc0FuZFN0eWxlUGxheWVyQnVpbGRlcjxhbnk+fCBudWxsKSB7XG4gIHZhbHVlID0gc2FuaXRpemVyICYmIHZhbHVlID8gc2FuaXRpemVyKHByb3AsIHZhbHVlKSA6IHZhbHVlO1xuICBpZiAoc3RvcmUgfHwgcGxheWVyQnVpbGRlcikge1xuICAgIGlmIChzdG9yZSkge1xuICAgICAgc3RvcmUuc2V0VmFsdWUocHJvcCwgdmFsdWUpO1xuICAgIH1cbiAgICBpZiAocGxheWVyQnVpbGRlcikge1xuICAgICAgcGxheWVyQnVpbGRlci5zZXRWYWx1ZShwcm9wLCB2YWx1ZSk7XG4gICAgfVxuICB9IGVsc2UgaWYgKHZhbHVlKSB7XG4gICAgdmFsdWUgPSB2YWx1ZS50b1N0cmluZygpOyAgLy8gb3BhY2l0eSwgei1pbmRleCBhbmQgZmxleGJveCBhbGwgaGF2ZSBudW1iZXIgdmFsdWVzIHdoaWNoIG1heSBub3RcbiAgICAvLyBhc3NpZ24gYXMgbnVtYmVyc1xuICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJTZXRTdHlsZSsrO1xuICAgIGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSA/XG4gICAgICAgIHJlbmRlcmVyLnNldFN0eWxlKG5hdGl2ZSwgcHJvcCwgdmFsdWUsIFJlbmRlcmVyU3R5bGVGbGFnczMuRGFzaENhc2UpIDpcbiAgICAgICAgbmF0aXZlLnN0eWxlLnNldFByb3BlcnR5KHByb3AsIHZhbHVlKTtcbiAgfSBlbHNlIHtcbiAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyUmVtb3ZlU3R5bGUrKztcbiAgICBpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikgP1xuICAgICAgICByZW5kZXJlci5yZW1vdmVTdHlsZShuYXRpdmUsIHByb3AsIFJlbmRlcmVyU3R5bGVGbGFnczMuRGFzaENhc2UpIDpcbiAgICAgICAgbmF0aXZlLnN0eWxlLnJlbW92ZVByb3BlcnR5KHByb3ApO1xuICB9XG59XG5cbi8qKlxuICogQWRkcy9yZW1vdmVzIHRoZSBwcm92aWRlZCBjbGFzc05hbWUgdmFsdWUgdG8gdGhlIHByb3ZpZGVkIGVsZW1lbnQuXG4gKlxuICogVGhpcyBmdW5jdGlvbiByZW5kZXJzIGEgZ2l2ZW4gQ1NTIGNsYXNzIHZhbHVlIHVzaW5nIHRoZSBwcm92aWRlZFxuICogcmVuZGVyZXIgKGJ5IGFkZGluZyBvciByZW1vdmluZyBpdCBmcm9tIHRoZSBwcm92aWRlZCBlbGVtZW50KS5cbiAqIElmIGEgYHN0b3JlYCB2YWx1ZSBpcyBwcm92aWRlZCB0aGVuIHRoYXQgd2lsbCBiZSB1c2VkIGEgcmVuZGVyXG4gKiBjb250ZXh0IGluc3RlYWQgb2YgdGhlIHByb3ZpZGVkIHJlbmRlcmVyLlxuICpcbiAqIEBwYXJhbSBuYXRpdmUgdGhlIERPTSBFbGVtZW50XG4gKiBAcGFyYW0gcHJvcCB0aGUgQ1NTIHN0eWxlIHByb3BlcnR5IHRoYXQgd2lsbCBiZSByZW5kZXJlZFxuICogQHBhcmFtIHZhbHVlIHRoZSBDU1Mgc3R5bGUgdmFsdWUgdGhhdCB3aWxsIGJlIHJlbmRlcmVkXG4gKiBAcGFyYW0gcmVuZGVyZXJcbiAqIEBwYXJhbSBzdG9yZSBhbiBvcHRpb25hbCBrZXkvdmFsdWUgbWFwIHRoYXQgd2lsbCBiZSB1c2VkIGFzIGEgY29udGV4dCB0byByZW5kZXIgc3R5bGVzIG9uXG4gKi9cbmZ1bmN0aW9uIHNldENsYXNzKFxuICAgIG5hdGl2ZTogYW55LCBjbGFzc05hbWU6IHN0cmluZywgYWRkOiBib29sZWFuLCByZW5kZXJlcjogUmVuZGVyZXIzLCBzdG9yZT86IEJpbmRpbmdTdG9yZSB8IG51bGwsXG4gICAgcGxheWVyQnVpbGRlcj86IENsYXNzQW5kU3R5bGVQbGF5ZXJCdWlsZGVyPGFueT58IG51bGwpIHtcbiAgaWYgKHN0b3JlIHx8IHBsYXllckJ1aWxkZXIpIHtcbiAgICBpZiAoc3RvcmUpIHtcbiAgICAgIHN0b3JlLnNldFZhbHVlKGNsYXNzTmFtZSwgYWRkKTtcbiAgICB9XG4gICAgaWYgKHBsYXllckJ1aWxkZXIpIHtcbiAgICAgIHBsYXllckJ1aWxkZXIuc2V0VmFsdWUoY2xhc3NOYW1lLCBhZGQpO1xuICAgIH1cbiAgICAvLyBET01Ub2tlbkxpc3Qgd2lsbCB0aHJvdyBpZiB3ZSB0cnkgdG8gYWRkIG9yIHJlbW92ZSBhbiBlbXB0eSBzdHJpbmcuXG4gIH0gZWxzZSBpZiAoY2xhc3NOYW1lICE9PSAnJykge1xuICAgIGlmIChhZGQpIHtcbiAgICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJBZGRDbGFzcysrO1xuICAgICAgaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpID8gcmVuZGVyZXIuYWRkQ2xhc3MobmF0aXZlLCBjbGFzc05hbWUpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hdGl2ZVsnY2xhc3NMaXN0J10uYWRkKGNsYXNzTmFtZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJSZW1vdmVDbGFzcysrO1xuICAgICAgaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpID8gcmVuZGVyZXIucmVtb3ZlQ2xhc3MobmF0aXZlLCBjbGFzc05hbWUpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hdGl2ZVsnY2xhc3NMaXN0J10ucmVtb3ZlKGNsYXNzTmFtZSk7XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIHNldFNhbml0aXplRmxhZyhjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgaW5kZXg6IG51bWJlciwgc2FuaXRpemVZZXM6IGJvb2xlYW4pIHtcbiAgaWYgKHNhbml0aXplWWVzKSB7XG4gICAgKGNvbnRleHRbaW5kZXhdIGFzIG51bWJlcikgfD0gU3R5bGluZ0ZsYWdzLlNhbml0aXplO1xuICB9IGVsc2Uge1xuICAgIChjb250ZXh0W2luZGV4XSBhcyBudW1iZXIpICY9IH5TdHlsaW5nRmxhZ3MuU2FuaXRpemU7XG4gIH1cbn1cblxuZnVuY3Rpb24gc2V0RGlydHkoY29udGV4dDogU3R5bGluZ0NvbnRleHQsIGluZGV4OiBudW1iZXIsIGlzRGlydHlZZXM6IGJvb2xlYW4pIHtcbiAgY29uc3QgYWRqdXN0ZWRJbmRleCA9XG4gICAgICBpbmRleCA+PSBTdHlsaW5nSW5kZXguU2luZ2xlU3R5bGVzU3RhcnRQb3NpdGlvbiA/IChpbmRleCArIFN0eWxpbmdJbmRleC5GbGFnc09mZnNldCkgOiBpbmRleDtcbiAgaWYgKGlzRGlydHlZZXMpIHtcbiAgICAoY29udGV4dFthZGp1c3RlZEluZGV4XSBhcyBudW1iZXIpIHw9IFN0eWxpbmdGbGFncy5EaXJ0eTtcbiAgfSBlbHNlIHtcbiAgICAoY29udGV4dFthZGp1c3RlZEluZGV4XSBhcyBudW1iZXIpICY9IH5TdHlsaW5nRmxhZ3MuRGlydHk7XG4gIH1cbn1cblxuZnVuY3Rpb24gaXNEaXJ0eShjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgaW5kZXg6IG51bWJlcik6IGJvb2xlYW4ge1xuICBjb25zdCBhZGp1c3RlZEluZGV4ID1cbiAgICAgIGluZGV4ID49IFN0eWxpbmdJbmRleC5TaW5nbGVTdHlsZXNTdGFydFBvc2l0aW9uID8gKGluZGV4ICsgU3R5bGluZ0luZGV4LkZsYWdzT2Zmc2V0KSA6IGluZGV4O1xuICByZXR1cm4gKChjb250ZXh0W2FkanVzdGVkSW5kZXhdIGFzIG51bWJlcikgJiBTdHlsaW5nRmxhZ3MuRGlydHkpID09IFN0eWxpbmdGbGFncy5EaXJ0eTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzQ2xhc3NCYXNlZFZhbHVlKGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBpbmRleDogbnVtYmVyKTogYm9vbGVhbiB7XG4gIGNvbnN0IGFkanVzdGVkSW5kZXggPVxuICAgICAgaW5kZXggPj0gU3R5bGluZ0luZGV4LlNpbmdsZVN0eWxlc1N0YXJ0UG9zaXRpb24gPyAoaW5kZXggKyBTdHlsaW5nSW5kZXguRmxhZ3NPZmZzZXQpIDogaW5kZXg7XG4gIHJldHVybiAoKGNvbnRleHRbYWRqdXN0ZWRJbmRleF0gYXMgbnVtYmVyKSAmIFN0eWxpbmdGbGFncy5DbGFzcykgPT0gU3R5bGluZ0ZsYWdzLkNsYXNzO1xufVxuXG5mdW5jdGlvbiBpc1Nhbml0aXphYmxlKGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBpbmRleDogbnVtYmVyKTogYm9vbGVhbiB7XG4gIGNvbnN0IGFkanVzdGVkSW5kZXggPVxuICAgICAgaW5kZXggPj0gU3R5bGluZ0luZGV4LlNpbmdsZVN0eWxlc1N0YXJ0UG9zaXRpb24gPyAoaW5kZXggKyBTdHlsaW5nSW5kZXguRmxhZ3NPZmZzZXQpIDogaW5kZXg7XG4gIHJldHVybiAoKGNvbnRleHRbYWRqdXN0ZWRJbmRleF0gYXMgbnVtYmVyKSAmIFN0eWxpbmdGbGFncy5TYW5pdGl6ZSkgPT0gU3R5bGluZ0ZsYWdzLlNhbml0aXplO1xufVxuXG5mdW5jdGlvbiBwb2ludGVycyhjb25maWdGbGFnOiBudW1iZXIsIHN0YXRpY0luZGV4OiBudW1iZXIsIGR5bmFtaWNJbmRleDogbnVtYmVyKSB7XG4gIHJldHVybiAoY29uZmlnRmxhZyAmIFN0eWxpbmdGbGFncy5CaXRNYXNrKSB8IChzdGF0aWNJbmRleCA8PCBTdHlsaW5nRmxhZ3MuQml0Q291bnRTaXplKSB8XG4gICAgICAoZHluYW1pY0luZGV4IDw8IChTdHlsaW5nSW5kZXguQml0Q291bnRTaXplICsgU3R5bGluZ0ZsYWdzLkJpdENvdW50U2l6ZSkpO1xufVxuXG5mdW5jdGlvbiBnZXRJbml0aWFsVmFsdWUoY29udGV4dDogU3R5bGluZ0NvbnRleHQsIGZsYWc6IG51bWJlcik6IHN0cmluZ3xib29sZWFufG51bGwge1xuICBjb25zdCBpbmRleCA9IGdldEluaXRpYWxJbmRleChmbGFnKTtcbiAgY29uc3QgZW50cnlJc0NsYXNzQmFzZWQgPSBmbGFnICYgU3R5bGluZ0ZsYWdzLkNsYXNzO1xuICBjb25zdCBpbml0aWFsVmFsdWVzID0gZW50cnlJc0NsYXNzQmFzZWQgPyBjb250ZXh0W1N0eWxpbmdJbmRleC5Jbml0aWFsQ2xhc3NWYWx1ZXNQb3NpdGlvbl0gOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250ZXh0W1N0eWxpbmdJbmRleC5Jbml0aWFsU3R5bGVWYWx1ZXNQb3NpdGlvbl07XG4gIHJldHVybiBpbml0aWFsVmFsdWVzW2luZGV4XTtcbn1cblxuZnVuY3Rpb24gZ2V0SW5pdGlhbEluZGV4KGZsYWc6IG51bWJlcik6IG51bWJlciB7XG4gIHJldHVybiAoZmxhZyA+PiBTdHlsaW5nRmxhZ3MuQml0Q291bnRTaXplKSAmIFN0eWxpbmdJbmRleC5CaXRNYXNrO1xufVxuXG5mdW5jdGlvbiBnZXRNdWx0aU9yU2luZ2xlSW5kZXgoZmxhZzogbnVtYmVyKTogbnVtYmVyIHtcbiAgY29uc3QgaW5kZXggPVxuICAgICAgKGZsYWcgPj4gKFN0eWxpbmdJbmRleC5CaXRDb3VudFNpemUgKyBTdHlsaW5nRmxhZ3MuQml0Q291bnRTaXplKSkgJiBTdHlsaW5nSW5kZXguQml0TWFzaztcbiAgcmV0dXJuIGluZGV4ID49IFN0eWxpbmdJbmRleC5TaW5nbGVTdHlsZXNTdGFydFBvc2l0aW9uID8gaW5kZXggOiAtMTtcbn1cblxuZnVuY3Rpb24gZ2V0TXVsdGlTdGFydEluZGV4KGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0KTogbnVtYmVyIHtcbiAgcmV0dXJuIGdldE11bHRpT3JTaW5nbGVJbmRleChjb250ZXh0W1N0eWxpbmdJbmRleC5NYXN0ZXJGbGFnUG9zaXRpb25dKSBhcyBudW1iZXI7XG59XG5cbmZ1bmN0aW9uIGdldE11bHRpQ2xhc3Nlc1N0YXJ0SW5kZXgoY29udGV4dDogU3R5bGluZ0NvbnRleHQpOiBudW1iZXIge1xuICBjb25zdCBjbGFzc0NhY2hlID0gY29udGV4dFtTdHlsaW5nSW5kZXguQ2FjaGVkTXVsdGlDbGFzc2VzXTtcbiAgcmV0dXJuIGNsYXNzQ2FjaGVcbiAgICAgIFtNYXBCYXNlZE9mZnNldFZhbHVlc0luZGV4LlZhbHVlc1N0YXJ0UG9zaXRpb24gK1xuICAgICAgIE1hcEJhc2VkT2Zmc2V0VmFsdWVzSW5kZXguUG9zaXRpb25TdGFydE9mZnNldF07XG59XG5cbmZ1bmN0aW9uIGdldE11bHRpU3R5bGVzU3RhcnRJbmRleChjb250ZXh0OiBTdHlsaW5nQ29udGV4dCk6IG51bWJlciB7XG4gIGNvbnN0IHN0eWxlc0NhY2hlID0gY29udGV4dFtTdHlsaW5nSW5kZXguQ2FjaGVkTXVsdGlTdHlsZXNdO1xuICByZXR1cm4gc3R5bGVzQ2FjaGVcbiAgICAgIFtNYXBCYXNlZE9mZnNldFZhbHVlc0luZGV4LlZhbHVlc1N0YXJ0UG9zaXRpb24gK1xuICAgICAgIE1hcEJhc2VkT2Zmc2V0VmFsdWVzSW5kZXguUG9zaXRpb25TdGFydE9mZnNldF07XG59XG5cbmZ1bmN0aW9uIHNldFByb3AoY29udGV4dDogU3R5bGluZ0NvbnRleHQsIGluZGV4OiBudW1iZXIsIHByb3A6IHN0cmluZykge1xuICBjb250ZXh0W2luZGV4ICsgU3R5bGluZ0luZGV4LlByb3BlcnR5T2Zmc2V0XSA9IHByb3A7XG59XG5cbmZ1bmN0aW9uIHNldFZhbHVlKGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBpbmRleDogbnVtYmVyLCB2YWx1ZTogc3RyaW5nIHwgbnVsbCB8IGJvb2xlYW4pIHtcbiAgY29udGV4dFtpbmRleCArIFN0eWxpbmdJbmRleC5WYWx1ZU9mZnNldF0gPSB2YWx1ZTtcbn1cblxuZnVuY3Rpb24gaGFzUGxheWVyQnVpbGRlckNoYW5nZWQoXG4gICAgY29udGV4dDogU3R5bGluZ0NvbnRleHQsIGJ1aWxkZXI6IENsYXNzQW5kU3R5bGVQbGF5ZXJCdWlsZGVyPGFueT58IG51bGwsIGluZGV4OiBudW1iZXIpIHtcbiAgY29uc3QgcGxheWVyQ29udGV4dCA9IGNvbnRleHRbU3R5bGluZ0luZGV4LlBsYXllckNvbnRleHRdICE7XG4gIGlmIChidWlsZGVyKSB7XG4gICAgaWYgKCFwbGF5ZXJDb250ZXh0IHx8IGluZGV4ID09PSAwKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH0gZWxzZSBpZiAoIXBsYXllckNvbnRleHQpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgcmV0dXJuIHBsYXllckNvbnRleHRbaW5kZXhdICE9PSBidWlsZGVyO1xufVxuXG5mdW5jdGlvbiBzZXRQbGF5ZXJCdWlsZGVyKFxuICAgIGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBidWlsZGVyOiBDbGFzc0FuZFN0eWxlUGxheWVyQnVpbGRlcjxhbnk+fCBudWxsLFxuICAgIGluc2VydGlvbkluZGV4OiBudW1iZXIpOiBudW1iZXIge1xuICBsZXQgcGxheWVyQ29udGV4dCA9IGNvbnRleHRbU3R5bGluZ0luZGV4LlBsYXllckNvbnRleHRdIHx8IGFsbG9jUGxheWVyQ29udGV4dChjb250ZXh0KTtcbiAgaWYgKGluc2VydGlvbkluZGV4ID4gMCkge1xuICAgIHBsYXllckNvbnRleHRbaW5zZXJ0aW9uSW5kZXhdID0gYnVpbGRlcjtcbiAgfSBlbHNlIHtcbiAgICBpbnNlcnRpb25JbmRleCA9IHBsYXllckNvbnRleHRbUGxheWVySW5kZXguTm9uQnVpbGRlclBsYXllcnNTdGFydF07XG4gICAgcGxheWVyQ29udGV4dC5zcGxpY2UoaW5zZXJ0aW9uSW5kZXgsIDAsIGJ1aWxkZXIsIG51bGwpO1xuICAgIHBsYXllckNvbnRleHRbUGxheWVySW5kZXguTm9uQnVpbGRlclBsYXllcnNTdGFydF0gKz1cbiAgICAgICAgUGxheWVySW5kZXguUGxheWVyQW5kUGxheWVyQnVpbGRlcnNUdXBsZVNpemU7XG4gIH1cbiAgcmV0dXJuIGluc2VydGlvbkluZGV4O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZGlyZWN0aXZlT3duZXJQb2ludGVycyhkaXJlY3RpdmVJbmRleDogbnVtYmVyLCBwbGF5ZXJJbmRleDogbnVtYmVyKSB7XG4gIHJldHVybiAocGxheWVySW5kZXggPDwgRGlyZWN0aXZlT3duZXJBbmRQbGF5ZXJCdWlsZGVySW5kZXguQml0Q291bnRTaXplKSB8IGRpcmVjdGl2ZUluZGV4O1xufVxuXG5mdW5jdGlvbiBzZXRQbGF5ZXJCdWlsZGVySW5kZXgoXG4gICAgY29udGV4dDogU3R5bGluZ0NvbnRleHQsIGluZGV4OiBudW1iZXIsIHBsYXllckJ1aWxkZXJJbmRleDogbnVtYmVyLCBkaXJlY3RpdmVJbmRleDogbnVtYmVyKSB7XG4gIGNvbnN0IHZhbHVlID0gZGlyZWN0aXZlT3duZXJQb2ludGVycyhkaXJlY3RpdmVJbmRleCwgcGxheWVyQnVpbGRlckluZGV4KTtcbiAgY29udGV4dFtpbmRleCArIFN0eWxpbmdJbmRleC5QbGF5ZXJCdWlsZGVySW5kZXhPZmZzZXRdID0gdmFsdWU7XG59XG5cbmZ1bmN0aW9uIGdldFBsYXllckJ1aWxkZXJJbmRleChjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgaW5kZXg6IG51bWJlcik6IG51bWJlciB7XG4gIGNvbnN0IGZsYWcgPSBjb250ZXh0W2luZGV4ICsgU3R5bGluZ0luZGV4LlBsYXllckJ1aWxkZXJJbmRleE9mZnNldF0gYXMgbnVtYmVyO1xuICBjb25zdCBwbGF5ZXJCdWlsZGVySW5kZXggPSAoZmxhZyA+PiBEaXJlY3RpdmVPd25lckFuZFBsYXllckJ1aWxkZXJJbmRleC5CaXRDb3VudFNpemUpICZcbiAgICAgIERpcmVjdGl2ZU93bmVyQW5kUGxheWVyQnVpbGRlckluZGV4LkJpdE1hc2s7XG4gIHJldHVybiBwbGF5ZXJCdWlsZGVySW5kZXg7XG59XG5cbmZ1bmN0aW9uIGdldFBsYXllckJ1aWxkZXIoY29udGV4dDogU3R5bGluZ0NvbnRleHQsIGluZGV4OiBudW1iZXIpOiBDbGFzc0FuZFN0eWxlUGxheWVyQnVpbGRlcjxhbnk+fFxuICAgIG51bGwge1xuICBjb25zdCBwbGF5ZXJCdWlsZGVySW5kZXggPSBnZXRQbGF5ZXJCdWlsZGVySW5kZXgoY29udGV4dCwgaW5kZXgpO1xuICBpZiAocGxheWVyQnVpbGRlckluZGV4KSB7XG4gICAgY29uc3QgcGxheWVyQ29udGV4dCA9IGNvbnRleHRbU3R5bGluZ0luZGV4LlBsYXllckNvbnRleHRdO1xuICAgIGlmIChwbGF5ZXJDb250ZXh0KSB7XG4gICAgICByZXR1cm4gcGxheWVyQ29udGV4dFtwbGF5ZXJCdWlsZGVySW5kZXhdIGFzIENsYXNzQW5kU3R5bGVQbGF5ZXJCdWlsZGVyPGFueT58IG51bGw7XG4gICAgfVxuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG5mdW5jdGlvbiBzZXRGbGFnKGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBpbmRleDogbnVtYmVyLCBmbGFnOiBudW1iZXIpIHtcbiAgY29uc3QgYWRqdXN0ZWRJbmRleCA9XG4gICAgICBpbmRleCA9PT0gU3R5bGluZ0luZGV4Lk1hc3RlckZsYWdQb3NpdGlvbiA/IGluZGV4IDogKGluZGV4ICsgU3R5bGluZ0luZGV4LkZsYWdzT2Zmc2V0KTtcbiAgY29udGV4dFthZGp1c3RlZEluZGV4XSA9IGZsYWc7XG59XG5cbmZ1bmN0aW9uIGdldFBvaW50ZXJzKGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBpbmRleDogbnVtYmVyKTogbnVtYmVyIHtcbiAgY29uc3QgYWRqdXN0ZWRJbmRleCA9XG4gICAgICBpbmRleCA9PT0gU3R5bGluZ0luZGV4Lk1hc3RlckZsYWdQb3NpdGlvbiA/IGluZGV4IDogKGluZGV4ICsgU3R5bGluZ0luZGV4LkZsYWdzT2Zmc2V0KTtcbiAgcmV0dXJuIGNvbnRleHRbYWRqdXN0ZWRJbmRleF0gYXMgbnVtYmVyO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0VmFsdWUoY29udGV4dDogU3R5bGluZ0NvbnRleHQsIGluZGV4OiBudW1iZXIpOiBzdHJpbmd8Ym9vbGVhbnxudWxsIHtcbiAgcmV0dXJuIGNvbnRleHRbaW5kZXggKyBTdHlsaW5nSW5kZXguVmFsdWVPZmZzZXRdIGFzIHN0cmluZyB8IGJvb2xlYW4gfCBudWxsO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0UHJvcChjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgaW5kZXg6IG51bWJlcik6IHN0cmluZyB7XG4gIHJldHVybiBjb250ZXh0W2luZGV4ICsgU3R5bGluZ0luZGV4LlByb3BlcnR5T2Zmc2V0XSBhcyBzdHJpbmc7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0NvbnRleHREaXJ0eShjb250ZXh0OiBTdHlsaW5nQ29udGV4dCk6IGJvb2xlYW4ge1xuICByZXR1cm4gaXNEaXJ0eShjb250ZXh0LCBTdHlsaW5nSW5kZXguTWFzdGVyRmxhZ1Bvc2l0aW9uKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNldENvbnRleHREaXJ0eShjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgaXNEaXJ0eVllczogYm9vbGVhbik6IHZvaWQge1xuICBzZXREaXJ0eShjb250ZXh0LCBTdHlsaW5nSW5kZXguTWFzdGVyRmxhZ1Bvc2l0aW9uLCBpc0RpcnR5WWVzKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNldENvbnRleHRQbGF5ZXJzRGlydHkoY29udGV4dDogU3R5bGluZ0NvbnRleHQsIGlzRGlydHlZZXM6IGJvb2xlYW4pOiB2b2lkIHtcbiAgaWYgKGlzRGlydHlZZXMpIHtcbiAgICAoY29udGV4dFtTdHlsaW5nSW5kZXguTWFzdGVyRmxhZ1Bvc2l0aW9uXSBhcyBudW1iZXIpIHw9IFN0eWxpbmdGbGFncy5QbGF5ZXJCdWlsZGVyc0RpcnR5O1xuICB9IGVsc2Uge1xuICAgIChjb250ZXh0W1N0eWxpbmdJbmRleC5NYXN0ZXJGbGFnUG9zaXRpb25dIGFzIG51bWJlcikgJj0gflN0eWxpbmdGbGFncy5QbGF5ZXJCdWlsZGVyc0RpcnR5O1xuICB9XG59XG5cbmZ1bmN0aW9uIHN3YXBNdWx0aUNvbnRleHRFbnRyaWVzKGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBpbmRleEE6IG51bWJlciwgaW5kZXhCOiBudW1iZXIpIHtcbiAgaWYgKGluZGV4QSA9PT0gaW5kZXhCKSByZXR1cm47XG5cbiAgY29uc3QgdG1wVmFsdWUgPSBnZXRWYWx1ZShjb250ZXh0LCBpbmRleEEpO1xuICBjb25zdCB0bXBQcm9wID0gZ2V0UHJvcChjb250ZXh0LCBpbmRleEEpO1xuICBjb25zdCB0bXBGbGFnID0gZ2V0UG9pbnRlcnMoY29udGV4dCwgaW5kZXhBKTtcbiAgY29uc3QgdG1wUGxheWVyQnVpbGRlckluZGV4ID0gZ2V0UGxheWVyQnVpbGRlckluZGV4KGNvbnRleHQsIGluZGV4QSk7XG4gIGNvbnN0IHRtcERpcmVjdGl2ZUluZGV4ID0gZ2V0RGlyZWN0aXZlSW5kZXhGcm9tRW50cnkoY29udGV4dCwgaW5kZXhBKTtcblxuICBsZXQgZmxhZ0EgPSB0bXBGbGFnO1xuICBsZXQgZmxhZ0IgPSBnZXRQb2ludGVycyhjb250ZXh0LCBpbmRleEIpO1xuXG4gIGNvbnN0IHNpbmdsZUluZGV4QSA9IGdldE11bHRpT3JTaW5nbGVJbmRleChmbGFnQSk7XG4gIGlmIChzaW5nbGVJbmRleEEgPj0gMCkge1xuICAgIGNvbnN0IF9mbGFnID0gZ2V0UG9pbnRlcnMoY29udGV4dCwgc2luZ2xlSW5kZXhBKTtcbiAgICBjb25zdCBfaW5pdGlhbCA9IGdldEluaXRpYWxJbmRleChfZmxhZyk7XG4gICAgc2V0RmxhZyhjb250ZXh0LCBzaW5nbGVJbmRleEEsIHBvaW50ZXJzKF9mbGFnLCBfaW5pdGlhbCwgaW5kZXhCKSk7XG4gIH1cblxuICBjb25zdCBzaW5nbGVJbmRleEIgPSBnZXRNdWx0aU9yU2luZ2xlSW5kZXgoZmxhZ0IpO1xuICBpZiAoc2luZ2xlSW5kZXhCID49IDApIHtcbiAgICBjb25zdCBfZmxhZyA9IGdldFBvaW50ZXJzKGNvbnRleHQsIHNpbmdsZUluZGV4Qik7XG4gICAgY29uc3QgX2luaXRpYWwgPSBnZXRJbml0aWFsSW5kZXgoX2ZsYWcpO1xuICAgIHNldEZsYWcoY29udGV4dCwgc2luZ2xlSW5kZXhCLCBwb2ludGVycyhfZmxhZywgX2luaXRpYWwsIGluZGV4QSkpO1xuICB9XG5cbiAgc2V0VmFsdWUoY29udGV4dCwgaW5kZXhBLCBnZXRWYWx1ZShjb250ZXh0LCBpbmRleEIpKTtcbiAgc2V0UHJvcChjb250ZXh0LCBpbmRleEEsIGdldFByb3AoY29udGV4dCwgaW5kZXhCKSk7XG4gIHNldEZsYWcoY29udGV4dCwgaW5kZXhBLCBnZXRQb2ludGVycyhjb250ZXh0LCBpbmRleEIpKTtcbiAgY29uc3QgcGxheWVySW5kZXhBID0gZ2V0UGxheWVyQnVpbGRlckluZGV4KGNvbnRleHQsIGluZGV4Qik7XG4gIGNvbnN0IGRpcmVjdGl2ZUluZGV4QSA9IGdldERpcmVjdGl2ZUluZGV4RnJvbUVudHJ5KGNvbnRleHQsIGluZGV4Qik7XG4gIHNldFBsYXllckJ1aWxkZXJJbmRleChjb250ZXh0LCBpbmRleEEsIHBsYXllckluZGV4QSwgZGlyZWN0aXZlSW5kZXhBKTtcblxuICBzZXRWYWx1ZShjb250ZXh0LCBpbmRleEIsIHRtcFZhbHVlKTtcbiAgc2V0UHJvcChjb250ZXh0LCBpbmRleEIsIHRtcFByb3ApO1xuICBzZXRGbGFnKGNvbnRleHQsIGluZGV4QiwgdG1wRmxhZyk7XG4gIHNldFBsYXllckJ1aWxkZXJJbmRleChjb250ZXh0LCBpbmRleEIsIHRtcFBsYXllckJ1aWxkZXJJbmRleCwgdG1wRGlyZWN0aXZlSW5kZXgpO1xufVxuXG5mdW5jdGlvbiB1cGRhdGVTaW5nbGVQb2ludGVyVmFsdWVzKGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBpbmRleFN0YXJ0UG9zaXRpb246IG51bWJlcikge1xuICBmb3IgKGxldCBpID0gaW5kZXhTdGFydFBvc2l0aW9uOyBpIDwgY29udGV4dC5sZW5ndGg7IGkgKz0gU3R5bGluZ0luZGV4LlNpemUpIHtcbiAgICBjb25zdCBtdWx0aUZsYWcgPSBnZXRQb2ludGVycyhjb250ZXh0LCBpKTtcbiAgICBjb25zdCBzaW5nbGVJbmRleCA9IGdldE11bHRpT3JTaW5nbGVJbmRleChtdWx0aUZsYWcpO1xuICAgIGlmIChzaW5nbGVJbmRleCA+IDApIHtcbiAgICAgIGNvbnN0IHNpbmdsZUZsYWcgPSBnZXRQb2ludGVycyhjb250ZXh0LCBzaW5nbGVJbmRleCk7XG4gICAgICBjb25zdCBpbml0aWFsSW5kZXhGb3JTaW5nbGUgPSBnZXRJbml0aWFsSW5kZXgoc2luZ2xlRmxhZyk7XG4gICAgICBjb25zdCBmbGFnVmFsdWUgPSAoaXNEaXJ0eShjb250ZXh0LCBzaW5nbGVJbmRleCkgPyBTdHlsaW5nRmxhZ3MuRGlydHkgOiBTdHlsaW5nRmxhZ3MuTm9uZSkgfFxuICAgICAgICAgIChpc0NsYXNzQmFzZWRWYWx1ZShjb250ZXh0LCBzaW5nbGVJbmRleCkgPyBTdHlsaW5nRmxhZ3MuQ2xhc3MgOiBTdHlsaW5nRmxhZ3MuTm9uZSkgfFxuICAgICAgICAgIChpc1Nhbml0aXphYmxlKGNvbnRleHQsIHNpbmdsZUluZGV4KSA/IFN0eWxpbmdGbGFncy5TYW5pdGl6ZSA6IFN0eWxpbmdGbGFncy5Ob25lKTtcbiAgICAgIGNvbnN0IHVwZGF0ZWRGbGFnID0gcG9pbnRlcnMoZmxhZ1ZhbHVlLCBpbml0aWFsSW5kZXhGb3JTaW5nbGUsIGkpO1xuICAgICAgc2V0RmxhZyhjb250ZXh0LCBzaW5nbGVJbmRleCwgdXBkYXRlZEZsYWcpO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBpbnNlcnROZXdNdWx0aVByb3BlcnR5KFxuICAgIGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBpbmRleDogbnVtYmVyLCBjbGFzc0Jhc2VkOiBib29sZWFuLCBuYW1lOiBzdHJpbmcsIGZsYWc6IG51bWJlcixcbiAgICB2YWx1ZTogc3RyaW5nIHwgYm9vbGVhbiwgZGlyZWN0aXZlSW5kZXg6IG51bWJlciwgcGxheWVySW5kZXg6IG51bWJlcik6IHZvaWQge1xuICBjb25zdCBkb1NoaWZ0ID0gaW5kZXggPCBjb250ZXh0Lmxlbmd0aDtcblxuICAvLyBwcm9wIGRvZXMgbm90IGV4aXN0IGluIHRoZSBsaXN0LCBhZGQgaXQgaW5cbiAgY29udGV4dC5zcGxpY2UoXG4gICAgICBpbmRleCwgMCwgZmxhZyB8IFN0eWxpbmdGbGFncy5EaXJ0eSB8IChjbGFzc0Jhc2VkID8gU3R5bGluZ0ZsYWdzLkNsYXNzIDogU3R5bGluZ0ZsYWdzLk5vbmUpLFxuICAgICAgbmFtZSwgdmFsdWUsIDApO1xuICBzZXRQbGF5ZXJCdWlsZGVySW5kZXgoY29udGV4dCwgaW5kZXgsIHBsYXllckluZGV4LCBkaXJlY3RpdmVJbmRleCk7XG5cbiAgaWYgKGRvU2hpZnQpIHtcbiAgICAvLyBiZWNhdXNlIHRoZSB2YWx1ZSB3YXMgaW5zZXJ0ZWQgbWlkd2F5IGludG8gdGhlIGFycmF5IHRoZW4gd2VcbiAgICAvLyBuZWVkIHRvIHVwZGF0ZSBhbGwgdGhlIHNoaWZ0ZWQgbXVsdGkgdmFsdWVzJyBzaW5nbGUgdmFsdWVcbiAgICAvLyBwb2ludGVycyB0byBwb2ludCB0byB0aGUgbmV3bHkgc2hpZnRlZCBsb2NhdGlvblxuICAgIHVwZGF0ZVNpbmdsZVBvaW50ZXJWYWx1ZXMoY29udGV4dCwgaW5kZXggKyBTdHlsaW5nSW5kZXguU2l6ZSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gdmFsdWVFeGlzdHModmFsdWU6IHN0cmluZyB8IG51bGwgfCBib29sZWFuLCBpc0NsYXNzQmFzZWQ/OiBib29sZWFuKSB7XG4gIHJldHVybiB2YWx1ZSAhPT0gbnVsbDtcbn1cblxuZnVuY3Rpb24gcHJlcGFyZUluaXRpYWxGbGFnKFxuICAgIGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBwcm9wOiBzdHJpbmcsIGVudHJ5SXNDbGFzc0Jhc2VkOiBib29sZWFuLFxuICAgIHNhbml0aXplcj86IFN0eWxlU2FuaXRpemVGbiB8IG51bGwpIHtcbiAgbGV0IGZsYWcgPSAoc2FuaXRpemVyICYmIHNhbml0aXplcihwcm9wKSkgPyBTdHlsaW5nRmxhZ3MuU2FuaXRpemUgOiBTdHlsaW5nRmxhZ3MuTm9uZTtcblxuICBsZXQgaW5pdGlhbEluZGV4OiBudW1iZXI7XG4gIGlmIChlbnRyeUlzQ2xhc3NCYXNlZCkge1xuICAgIGZsYWcgfD0gU3R5bGluZ0ZsYWdzLkNsYXNzO1xuICAgIGluaXRpYWxJbmRleCA9XG4gICAgICAgIGdldEluaXRpYWxTdHlsaW5nVmFsdWVzSW5kZXhPZihjb250ZXh0W1N0eWxpbmdJbmRleC5Jbml0aWFsQ2xhc3NWYWx1ZXNQb3NpdGlvbl0sIHByb3ApO1xuICB9IGVsc2Uge1xuICAgIGluaXRpYWxJbmRleCA9XG4gICAgICAgIGdldEluaXRpYWxTdHlsaW5nVmFsdWVzSW5kZXhPZihjb250ZXh0W1N0eWxpbmdJbmRleC5Jbml0aWFsU3R5bGVWYWx1ZXNQb3NpdGlvbl0sIHByb3ApO1xuICB9XG5cbiAgaW5pdGlhbEluZGV4ID0gaW5pdGlhbEluZGV4ID4gMCA/IChpbml0aWFsSW5kZXggKyBJbml0aWFsU3R5bGluZ1ZhbHVlc0luZGV4LlZhbHVlT2Zmc2V0KSA6IDA7XG4gIHJldHVybiBwb2ludGVycyhmbGFnLCBpbml0aWFsSW5kZXgsIDApO1xufVxuXG5mdW5jdGlvbiBoYXNJbml0aWFsVmFsdWVDaGFuZ2VkKGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBmbGFnOiBudW1iZXIsIG5ld1ZhbHVlOiBhbnkpIHtcbiAgY29uc3QgaW5pdGlhbFZhbHVlID0gZ2V0SW5pdGlhbFZhbHVlKGNvbnRleHQsIGZsYWcpO1xuICByZXR1cm4gIWluaXRpYWxWYWx1ZSB8fCBoYXNWYWx1ZUNoYW5nZWQoZmxhZywgaW5pdGlhbFZhbHVlLCBuZXdWYWx1ZSk7XG59XG5cbmZ1bmN0aW9uIGhhc1ZhbHVlQ2hhbmdlZChcbiAgICBmbGFnOiBudW1iZXIsIGE6IHN0cmluZyB8IGJvb2xlYW4gfCBudWxsLCBiOiBzdHJpbmcgfCBib29sZWFuIHwgbnVsbCk6IGJvb2xlYW4ge1xuICBjb25zdCBpc0NsYXNzQmFzZWQgPSBmbGFnICYgU3R5bGluZ0ZsYWdzLkNsYXNzO1xuICBjb25zdCBoYXNWYWx1ZXMgPSBhICYmIGI7XG4gIGNvbnN0IHVzZXNTYW5pdGl6ZXIgPSBmbGFnICYgU3R5bGluZ0ZsYWdzLlNhbml0aXplO1xuICAvLyB0aGUgdG9TdHJpbmcoKSBjb21wYXJpc29uIGVuc3VyZXMgdGhhdCBhIHZhbHVlIGlzIGNoZWNrZWRcbiAgLy8gLi4uIG90aGVyd2lzZSAoZHVyaW5nIHNhbml0aXphdGlvbiBieXBhc3NpbmcpIHRoZSA9PT0gY29tcGFyc2lvblxuICAvLyB3b3VsZCBmYWlsIHNpbmNlIGEgbmV3IFN0cmluZygpIGluc3RhbmNlIGlzIGNyZWF0ZWRcbiAgaWYgKCFpc0NsYXNzQmFzZWQgJiYgaGFzVmFsdWVzICYmIHVzZXNTYW5pdGl6ZXIpIHtcbiAgICAvLyB3ZSBrbm93IGZvciBzdXJlIHdlJ3JlIGRlYWxpbmcgd2l0aCBzdHJpbmdzIGF0IHRoaXMgcG9pbnRcbiAgICByZXR1cm4gKGEgYXMgc3RyaW5nKS50b1N0cmluZygpICE9PSAoYiBhcyBzdHJpbmcpLnRvU3RyaW5nKCk7XG4gIH1cblxuICAvLyBldmVyeXRoaW5nIGVsc2UgaXMgc2FmZSB0byBjaGVjayB3aXRoIGEgbm9ybWFsIGVxdWFsaXR5IGNoZWNrXG4gIHJldHVybiBhICE9PSBiO1xufVxuXG5leHBvcnQgY2xhc3MgQ2xhc3NBbmRTdHlsZVBsYXllckJ1aWxkZXI8VD4gaW1wbGVtZW50cyBQbGF5ZXJCdWlsZGVyIHtcbiAgcHJpdmF0ZSBfdmFsdWVzOiB7W2tleTogc3RyaW5nXTogc3RyaW5nIHwgbnVsbH0gPSB7fTtcbiAgcHJpdmF0ZSBfZGlydHkgPSBmYWxzZTtcbiAgcHJpdmF0ZSBfZmFjdG9yeTogQm91bmRQbGF5ZXJGYWN0b3J5PFQ+O1xuXG4gIGNvbnN0cnVjdG9yKGZhY3Rvcnk6IFBsYXllckZhY3RvcnksIHByaXZhdGUgX2VsZW1lbnQ6IEhUTUxFbGVtZW50LCBwcml2YXRlIF90eXBlOiBCaW5kaW5nVHlwZSkge1xuICAgIHRoaXMuX2ZhY3RvcnkgPSBmYWN0b3J5IGFzIGFueTtcbiAgfVxuXG4gIHNldFZhbHVlKHByb3A6IHN0cmluZywgdmFsdWU6IGFueSkge1xuICAgIGlmICh0aGlzLl92YWx1ZXNbcHJvcF0gIT09IHZhbHVlKSB7XG4gICAgICB0aGlzLl92YWx1ZXNbcHJvcF0gPSB2YWx1ZTtcbiAgICAgIHRoaXMuX2RpcnR5ID0gdHJ1ZTtcbiAgICB9XG4gIH1cblxuICBidWlsZFBsYXllcihjdXJyZW50UGxheWVyOiBQbGF5ZXJ8bnVsbCwgaXNGaXJzdFJlbmRlcjogYm9vbGVhbik6IFBsYXllcnx1bmRlZmluZWR8bnVsbCB7XG4gICAgLy8gaWYgbm8gdmFsdWVzIGhhdmUgYmVlbiBzZXQgaGVyZSB0aGVuIHRoaXMgbWVhbnMgdGhlIGJpbmRpbmcgZGlkbid0XG4gICAgLy8gY2hhbmdlIGFuZCB0aGVyZWZvcmUgdGhlIGJpbmRpbmcgdmFsdWVzIHdlcmUgbm90IHVwZGF0ZWQgdGhyb3VnaFxuICAgIC8vIGBzZXRWYWx1ZWAgd2hpY2ggbWVhbnMgbm8gbmV3IHBsYXllciB3aWxsIGJlIHByb3ZpZGVkLlxuICAgIGlmICh0aGlzLl9kaXJ0eSkge1xuICAgICAgY29uc3QgcGxheWVyID0gdGhpcy5fZmFjdG9yeS5mbihcbiAgICAgICAgICB0aGlzLl9lbGVtZW50LCB0aGlzLl90eXBlLCB0aGlzLl92YWx1ZXMgISwgaXNGaXJzdFJlbmRlciwgY3VycmVudFBsYXllciB8fCBudWxsKTtcbiAgICAgIHRoaXMuX3ZhbHVlcyA9IHt9O1xuICAgICAgdGhpcy5fZGlydHkgPSBmYWxzZTtcbiAgICAgIHJldHVybiBwbGF5ZXI7XG4gICAgfVxuXG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxufVxuXG4vKipcbiAqIFVzZWQgdG8gcHJvdmlkZSBhIHN1bW1hcnkgb2YgdGhlIHN0YXRlIG9mIHRoZSBzdHlsaW5nIGNvbnRleHQuXG4gKlxuICogVGhpcyBpcyBhbiBpbnRlcm5hbCBpbnRlcmZhY2UgdGhhdCBpcyBvbmx5IHVzZWQgaW5zaWRlIG9mIHRlc3QgdG9vbGluZyB0b1xuICogaGVscCBzdW1tYXJpemUgd2hhdCdzIGdvaW5nIG9uIHdpdGhpbiB0aGUgc3R5bGluZyBjb250ZXh0LiBOb25lIG9mIHRoaXMgY29kZVxuICogaXMgZGVzaWduZWQgdG8gYmUgZXhwb3J0ZWQgcHVibGljbHkgYW5kIHdpbGwsIHRoZXJlZm9yZSwgYmUgdHJlZS1zaGFrZW4gYXdheVxuICogZHVyaW5nIHJ1bnRpbWUuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgTG9nU3VtbWFyeSB7XG4gIG5hbWU6IHN0cmluZzsgICAgICAgICAgLy9cbiAgc3RhdGljSW5kZXg6IG51bWJlcjsgICAvL1xuICBkeW5hbWljSW5kZXg6IG51bWJlcjsgIC8vXG4gIHZhbHVlOiBudW1iZXI7ICAgICAgICAgLy9cbiAgZmxhZ3M6IHtcbiAgICBkaXJ0eTogYm9vbGVhbjsgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgY2xhc3M6IGJvb2xlYW47ICAgICAgICAgICAgICAgICAgICAvL1xuICAgIHNhbml0aXplOiBib29sZWFuOyAgICAgICAgICAgICAgICAgLy9cbiAgICBwbGF5ZXJCdWlsZGVyc0RpcnR5OiBib29sZWFuOyAgICAgIC8vXG4gICAgYmluZGluZ0FsbG9jYXRpb25Mb2NrZWQ6IGJvb2xlYW47ICAvL1xuICB9O1xufVxuXG4vKipcbiAqIFRoaXMgZnVuY3Rpb24gaXMgbm90IGRlc2lnbmVkIHRvIGJlIHVzZWQgaW4gcHJvZHVjdGlvbi5cbiAqIEl0IGlzIGEgdXRpbGl0eSB0b29sIGZvciBkZWJ1Z2dpbmcgYW5kIHRlc3RpbmcgYW5kIGl0XG4gKiB3aWxsIGF1dG9tYXRpY2FsbHkgYmUgdHJlZS1zaGFrZW4gYXdheSBkdXJpbmcgcHJvZHVjdGlvbi5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdlbmVyYXRlQ29uZmlnU3VtbWFyeShzb3VyY2U6IG51bWJlcik6IExvZ1N1bW1hcnk7XG5leHBvcnQgZnVuY3Rpb24gZ2VuZXJhdGVDb25maWdTdW1tYXJ5KHNvdXJjZTogU3R5bGluZ0NvbnRleHQpOiBMb2dTdW1tYXJ5O1xuZXhwb3J0IGZ1bmN0aW9uIGdlbmVyYXRlQ29uZmlnU3VtbWFyeShzb3VyY2U6IFN0eWxpbmdDb250ZXh0LCBpbmRleDogbnVtYmVyKTogTG9nU3VtbWFyeTtcbmV4cG9ydCBmdW5jdGlvbiBnZW5lcmF0ZUNvbmZpZ1N1bW1hcnkoc291cmNlOiBudW1iZXIgfCBTdHlsaW5nQ29udGV4dCwgaW5kZXg/OiBudW1iZXIpOiBMb2dTdW1tYXJ5IHtcbiAgbGV0IGZsYWcsIG5hbWUgPSAnY29uZmlnIHZhbHVlIGZvciAnO1xuICBpZiAoQXJyYXkuaXNBcnJheShzb3VyY2UpKSB7XG4gICAgaWYgKGluZGV4KSB7XG4gICAgICBuYW1lICs9ICdpbmRleDogJyArIGluZGV4O1xuICAgIH0gZWxzZSB7XG4gICAgICBuYW1lICs9ICdtYXN0ZXIgY29uZmlnJztcbiAgICB9XG4gICAgaW5kZXggPSBpbmRleCB8fCBTdHlsaW5nSW5kZXguTWFzdGVyRmxhZ1Bvc2l0aW9uO1xuICAgIGZsYWcgPSBzb3VyY2VbaW5kZXhdIGFzIG51bWJlcjtcbiAgfSBlbHNlIHtcbiAgICBmbGFnID0gc291cmNlO1xuICAgIG5hbWUgKz0gJ2luZGV4OiAnICsgZmxhZztcbiAgfVxuICBjb25zdCBkeW5hbWljSW5kZXggPSBnZXRNdWx0aU9yU2luZ2xlSW5kZXgoZmxhZyk7XG4gIGNvbnN0IHN0YXRpY0luZGV4ID0gZ2V0SW5pdGlhbEluZGV4KGZsYWcpO1xuICByZXR1cm4ge1xuICAgIG5hbWUsXG4gICAgc3RhdGljSW5kZXgsXG4gICAgZHluYW1pY0luZGV4LFxuICAgIHZhbHVlOiBmbGFnLFxuICAgIGZsYWdzOiB7XG4gICAgICBkaXJ0eTogZmxhZyAmIFN0eWxpbmdGbGFncy5EaXJ0eSA/IHRydWUgOiBmYWxzZSxcbiAgICAgIGNsYXNzOiBmbGFnICYgU3R5bGluZ0ZsYWdzLkNsYXNzID8gdHJ1ZSA6IGZhbHNlLFxuICAgICAgc2FuaXRpemU6IGZsYWcgJiBTdHlsaW5nRmxhZ3MuU2FuaXRpemUgPyB0cnVlIDogZmFsc2UsXG4gICAgICBwbGF5ZXJCdWlsZGVyc0RpcnR5OiBmbGFnICYgU3R5bGluZ0ZsYWdzLlBsYXllckJ1aWxkZXJzRGlydHkgPyB0cnVlIDogZmFsc2UsXG4gICAgICBiaW5kaW5nQWxsb2NhdGlvbkxvY2tlZDogZmxhZyAmIFN0eWxpbmdGbGFncy5CaW5kaW5nQWxsb2NhdGlvbkxvY2tlZCA/IHRydWUgOiBmYWxzZSxcbiAgICB9XG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXREaXJlY3RpdmVJbmRleEZyb21FbnRyeShjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgaW5kZXg6IG51bWJlcikge1xuICBjb25zdCB2YWx1ZSA9IGNvbnRleHRbaW5kZXggKyBTdHlsaW5nSW5kZXguUGxheWVyQnVpbGRlckluZGV4T2Zmc2V0XSBhcyBudW1iZXI7XG4gIHJldHVybiB2YWx1ZSAmIERpcmVjdGl2ZU93bmVyQW5kUGxheWVyQnVpbGRlckluZGV4LkJpdE1hc2s7XG59XG5cbmZ1bmN0aW9uIGdldERpcmVjdGl2ZUluZGV4RnJvbVJlZ2lzdHJ5KGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBkaXJlY3RpdmVSZWY6IGFueSkge1xuICBsZXQgZGlyZWN0aXZlSW5kZXg6IG51bWJlcjtcblxuICBjb25zdCBkaXJzID0gY29udGV4dFtTdHlsaW5nSW5kZXguRGlyZWN0aXZlUmVnaXN0cnlQb3NpdGlvbl07XG4gIGxldCBpbmRleCA9IGdldERpcmVjdGl2ZVJlZ2lzdHJ5VmFsdWVzSW5kZXhPZihkaXJzLCBkaXJlY3RpdmVSZWYpO1xuICBpZiAoaW5kZXggPT09IC0xKSB7XG4gICAgLy8gaWYgdGhlIGRpcmVjdGl2ZSB3YXMgbm90IGFsbG9jYXRlZCB0aGVuIHRoaXMgbWVhbnMgdGhhdCBzdHlsaW5nIGlzXG4gICAgLy8gYmVpbmcgYXBwbGllZCBpbiBhIGR5bmFtaWMgd2F5IEFGVEVSIHRoZSBlbGVtZW50IHdhcyBhbHJlYWR5IGluc3RhbnRpYXRlZFxuICAgIGluZGV4ID0gZGlycy5sZW5ndGg7XG4gICAgZGlyZWN0aXZlSW5kZXggPSBpbmRleCA+IDAgPyBpbmRleCAvIERpcmVjdGl2ZVJlZ2lzdHJ5VmFsdWVzSW5kZXguU2l6ZSA6IDA7XG5cbiAgICBkaXJzLnB1c2gobnVsbCwgbnVsbCwgbnVsbCwgbnVsbCk7XG4gICAgZGlyc1tpbmRleCArIERpcmVjdGl2ZVJlZ2lzdHJ5VmFsdWVzSW5kZXguRGlyZWN0aXZlVmFsdWVPZmZzZXRdID0gZGlyZWN0aXZlUmVmO1xuICAgIGRpcnNbaW5kZXggKyBEaXJlY3RpdmVSZWdpc3RyeVZhbHVlc0luZGV4LkRpcnR5RmxhZ09mZnNldF0gPSBmYWxzZTtcbiAgICBkaXJzW2luZGV4ICsgRGlyZWN0aXZlUmVnaXN0cnlWYWx1ZXNJbmRleC5TaW5nbGVQcm9wVmFsdWVzSW5kZXhPZmZzZXRdID0gLTE7XG5cbiAgICBjb25zdCBjbGFzc2VzU3RhcnRJbmRleCA9XG4gICAgICAgIGdldE11bHRpQ2xhc3Nlc1N0YXJ0SW5kZXgoY29udGV4dCkgfHwgU3R5bGluZ0luZGV4LlNpbmdsZVN0eWxlc1N0YXJ0UG9zaXRpb247XG4gICAgcmVnaXN0ZXJNdWx0aU1hcEVudHJ5KGNvbnRleHQsIGRpcmVjdGl2ZUluZGV4LCB0cnVlLCBjb250ZXh0Lmxlbmd0aCk7XG4gICAgcmVnaXN0ZXJNdWx0aU1hcEVudHJ5KGNvbnRleHQsIGRpcmVjdGl2ZUluZGV4LCBmYWxzZSwgY2xhc3Nlc1N0YXJ0SW5kZXgpO1xuICB9IGVsc2Uge1xuICAgIGRpcmVjdGl2ZUluZGV4ID0gaW5kZXggPiAwID8gaW5kZXggLyBEaXJlY3RpdmVSZWdpc3RyeVZhbHVlc0luZGV4LlNpemUgOiAwO1xuICB9XG5cbiAgcmV0dXJuIGRpcmVjdGl2ZUluZGV4O1xufVxuXG5mdW5jdGlvbiBnZXREaXJlY3RpdmVSZWdpc3RyeVZhbHVlc0luZGV4T2YoXG4gICAgZGlyZWN0aXZlczogRGlyZWN0aXZlUmVnaXN0cnlWYWx1ZXMsIGRpcmVjdGl2ZToge30pOiBudW1iZXIge1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGRpcmVjdGl2ZXMubGVuZ3RoOyBpICs9IERpcmVjdGl2ZVJlZ2lzdHJ5VmFsdWVzSW5kZXguU2l6ZSkge1xuICAgIGlmIChkaXJlY3RpdmVzW2ldID09PSBkaXJlY3RpdmUpIHtcbiAgICAgIHJldHVybiBpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gLTE7XG59XG5cbmZ1bmN0aW9uIGdldEluaXRpYWxTdHlsaW5nVmFsdWVzSW5kZXhPZihrZXlWYWx1ZXM6IEluaXRpYWxTdHlsaW5nVmFsdWVzLCBrZXk6IHN0cmluZyk6IG51bWJlciB7XG4gIGZvciAobGV0IGkgPSBJbml0aWFsU3R5bGluZ1ZhbHVlc0luZGV4LktleVZhbHVlU3RhcnRQb3NpdGlvbjsgaSA8IGtleVZhbHVlcy5sZW5ndGg7XG4gICAgICAgaSArPSBJbml0aWFsU3R5bGluZ1ZhbHVlc0luZGV4LlNpemUpIHtcbiAgICBpZiAoa2V5VmFsdWVzW2ldID09PSBrZXkpIHJldHVybiBpO1xuICB9XG4gIHJldHVybiAtMTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNvbXBhcmVMb2dTdW1tYXJpZXMoYTogTG9nU3VtbWFyeSwgYjogTG9nU3VtbWFyeSkge1xuICBjb25zdCBsb2c6IHN0cmluZ1tdID0gW107XG4gIGNvbnN0IGRpZmZzOiBbc3RyaW5nLCBhbnksIGFueV1bXSA9IFtdO1xuICBkaWZmU3VtbWFyeVZhbHVlcyhkaWZmcywgJ3N0YXRpY0luZGV4JywgJ3N0YXRpY0luZGV4JywgYSwgYik7XG4gIGRpZmZTdW1tYXJ5VmFsdWVzKGRpZmZzLCAnZHluYW1pY0luZGV4JywgJ2R5bmFtaWNJbmRleCcsIGEsIGIpO1xuICBPYmplY3Qua2V5cyhhLmZsYWdzKS5mb3JFYWNoKFxuICAgICAgbmFtZSA9PiB7IGRpZmZTdW1tYXJ5VmFsdWVzKGRpZmZzLCAnZmxhZ3MuJyArIG5hbWUsIG5hbWUsIGEuZmxhZ3MsIGIuZmxhZ3MpOyB9KTtcblxuICBpZiAoZGlmZnMubGVuZ3RoKSB7XG4gICAgbG9nLnB1c2goJ0xvZyBTdW1tYXJpZXMgZm9yOicpO1xuICAgIGxvZy5wdXNoKCcgIEE6ICcgKyBhLm5hbWUpO1xuICAgIGxvZy5wdXNoKCcgIEI6ICcgKyBiLm5hbWUpO1xuICAgIGxvZy5wdXNoKCdcXG4gIERpZmZlciBpbiB0aGUgZm9sbG93aW5nIHdheSAoQSAhPT0gQik6Jyk7XG4gICAgZGlmZnMuZm9yRWFjaChyZXN1bHQgPT4ge1xuICAgICAgY29uc3QgW25hbWUsIGFWYWwsIGJWYWxdID0gcmVzdWx0O1xuICAgICAgbG9nLnB1c2goJyAgICA9PiAnICsgbmFtZSk7XG4gICAgICBsb2cucHVzaCgnICAgID0+ICcgKyBhVmFsICsgJyAhPT0gJyArIGJWYWwgKyAnXFxuJyk7XG4gICAgfSk7XG4gIH1cblxuICByZXR1cm4gbG9nO1xufVxuXG5mdW5jdGlvbiBkaWZmU3VtbWFyeVZhbHVlcyhyZXN1bHQ6IGFueVtdLCBuYW1lOiBzdHJpbmcsIHByb3A6IHN0cmluZywgYTogYW55LCBiOiBhbnkpIHtcbiAgY29uc3QgYVZhbCA9IGFbcHJvcF07XG4gIGNvbnN0IGJWYWwgPSBiW3Byb3BdO1xuICBpZiAoYVZhbCAhPT0gYlZhbCkge1xuICAgIHJlc3VsdC5wdXNoKFtuYW1lLCBhVmFsLCBiVmFsXSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gZ2V0U2luZ2xlUHJvcEluZGV4VmFsdWUoXG4gICAgY29udGV4dDogU3R5bGluZ0NvbnRleHQsIGRpcmVjdGl2ZUluZGV4OiBudW1iZXIsIG9mZnNldDogbnVtYmVyLCBpc0NsYXNzQmFzZWQ6IGJvb2xlYW4pIHtcbiAgY29uc3Qgc2luZ2xlUHJvcE9mZnNldFJlZ2lzdHJ5SW5kZXggPVxuICAgICAgY29udGV4dFtTdHlsaW5nSW5kZXguRGlyZWN0aXZlUmVnaXN0cnlQb3NpdGlvbl1cbiAgICAgICAgICAgICBbKGRpcmVjdGl2ZUluZGV4ICogRGlyZWN0aXZlUmVnaXN0cnlWYWx1ZXNJbmRleC5TaXplKSArXG4gICAgICAgICAgICAgIERpcmVjdGl2ZVJlZ2lzdHJ5VmFsdWVzSW5kZXguU2luZ2xlUHJvcFZhbHVlc0luZGV4T2Zmc2V0XSBhcyBudW1iZXI7XG4gIGNvbnN0IG9mZnNldHMgPSBjb250ZXh0W1N0eWxpbmdJbmRleC5TaW5nbGVQcm9wT2Zmc2V0UG9zaXRpb25zXTtcbiAgY29uc3QgaW5kZXhGb3JPZmZzZXQgPSBzaW5nbGVQcm9wT2Zmc2V0UmVnaXN0cnlJbmRleCArXG4gICAgICBTaW5nbGVQcm9wT2Zmc2V0VmFsdWVzSW5kZXguVmFsdWVTdGFydFBvc2l0aW9uICtcbiAgICAgIChpc0NsYXNzQmFzZWQgP1xuICAgICAgICAgICBvZmZzZXRzXG4gICAgICAgICAgICAgICBbc2luZ2xlUHJvcE9mZnNldFJlZ2lzdHJ5SW5kZXggKyBTaW5nbGVQcm9wT2Zmc2V0VmFsdWVzSW5kZXguU3R5bGVzQ291bnRQb3NpdGlvbl0gOlxuICAgICAgICAgICAwKSArXG4gICAgICBvZmZzZXQ7XG4gIHJldHVybiBvZmZzZXRzW2luZGV4Rm9yT2Zmc2V0XTtcbn1cblxuZnVuY3Rpb24gZ2V0U3R5bGVTYW5pdGl6ZXIoY29udGV4dDogU3R5bGluZ0NvbnRleHQsIGRpcmVjdGl2ZUluZGV4OiBudW1iZXIpOiBTdHlsZVNhbml0aXplRm58bnVsbCB7XG4gIGNvbnN0IGRpcnMgPSBjb250ZXh0W1N0eWxpbmdJbmRleC5EaXJlY3RpdmVSZWdpc3RyeVBvc2l0aW9uXTtcbiAgY29uc3QgdmFsdWUgPSBkaXJzXG4gICAgICAgICAgICAgICAgICAgIFtkaXJlY3RpdmVJbmRleCAqIERpcmVjdGl2ZVJlZ2lzdHJ5VmFsdWVzSW5kZXguU2l6ZSArXG4gICAgICAgICAgICAgICAgICAgICBEaXJlY3RpdmVSZWdpc3RyeVZhbHVlc0luZGV4LlN0eWxlU2FuaXRpemVyT2Zmc2V0XSB8fFxuICAgICAgZGlyc1tEaXJlY3RpdmVSZWdpc3RyeVZhbHVlc0luZGV4LlN0eWxlU2FuaXRpemVyT2Zmc2V0XSB8fCBudWxsO1xuICByZXR1cm4gdmFsdWUgYXMgU3R5bGVTYW5pdGl6ZUZuIHwgbnVsbDtcbn1cblxuZnVuY3Rpb24gaXNEaXJlY3RpdmVEaXJ0eShjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgZGlyZWN0aXZlSW5kZXg6IG51bWJlcik6IGJvb2xlYW4ge1xuICBjb25zdCBkaXJzID0gY29udGV4dFtTdHlsaW5nSW5kZXguRGlyZWN0aXZlUmVnaXN0cnlQb3NpdGlvbl07XG4gIHJldHVybiBkaXJzXG4gICAgICBbZGlyZWN0aXZlSW5kZXggKiBEaXJlY3RpdmVSZWdpc3RyeVZhbHVlc0luZGV4LlNpemUgK1xuICAgICAgIERpcmVjdGl2ZVJlZ2lzdHJ5VmFsdWVzSW5kZXguRGlydHlGbGFnT2Zmc2V0XSBhcyBib29sZWFuO1xufVxuXG5mdW5jdGlvbiBzZXREaXJlY3RpdmVEaXJ0eShcbiAgICBjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgZGlyZWN0aXZlSW5kZXg6IG51bWJlciwgZGlydHlZZXM6IGJvb2xlYW4pOiB2b2lkIHtcbiAgY29uc3QgZGlycyA9IGNvbnRleHRbU3R5bGluZ0luZGV4LkRpcmVjdGl2ZVJlZ2lzdHJ5UG9zaXRpb25dO1xuICBkaXJzXG4gICAgICBbZGlyZWN0aXZlSW5kZXggKiBEaXJlY3RpdmVSZWdpc3RyeVZhbHVlc0luZGV4LlNpemUgK1xuICAgICAgIERpcmVjdGl2ZVJlZ2lzdHJ5VmFsdWVzSW5kZXguRGlydHlGbGFnT2Zmc2V0XSA9IGRpcnR5WWVzO1xufVxuXG5mdW5jdGlvbiBhbGxvd1ZhbHVlQ2hhbmdlKFxuICAgIGN1cnJlbnRWYWx1ZTogc3RyaW5nIHwgYm9vbGVhbiB8IG51bGwsIG5ld1ZhbHVlOiBzdHJpbmcgfCBib29sZWFuIHwgbnVsbCxcbiAgICBjdXJyZW50RGlyZWN0aXZlT3duZXI6IG51bWJlciwgbmV3RGlyZWN0aXZlT3duZXI6IG51bWJlcikge1xuICAvLyB0aGUgY29kZSBiZWxvdyByZWxpZXMgdGhlIGltcG9ydGFuY2Ugb2YgZGlyZWN0aXZlJ3MgYmVpbmcgdGllZCB0byB0aGVpclxuICAvLyBpbmRleCB2YWx1ZS4gVGhlIGluZGV4IHZhbHVlcyBmb3IgZWFjaCBkaXJlY3RpdmUgYXJlIGRlcml2ZWQgZnJvbSBiZWluZ1xuICAvLyByZWdpc3RlcmVkIGludG8gdGhlIHN0eWxpbmcgY29udGV4dCBkaXJlY3RpdmUgcmVnaXN0cnkuIFRoZSBtb3N0IGltcG9ydGFudFxuICAvLyBkaXJlY3RpdmUgaXMgdGhlIHBhcmVudCBjb21wb25lbnQgZGlyZWN0aXZlICh0aGUgdGVtcGxhdGUpIGFuZCBlYWNoIGRpcmVjdGl2ZVxuICAvLyB0aGF0IGlzIGFkZGVkIGFmdGVyIGlzIGNvbnNpZGVyZWQgbGVzcyBpbXBvcnRhbnQgdGhhbiB0aGUgcHJldmlvdXMgZW50cnkuIFRoaXNcbiAgLy8gcHJpb3JpdGl6YXRpb24gb2YgZGlyZWN0aXZlcyBlbmFibGVzIHRoZSBzdHlsaW5nIGFsZ29yaXRobSB0byBkZWNpZGUgaWYgYSBzdHlsZVxuICAvLyBvciBjbGFzcyBzaG91bGQgYmUgYWxsb3dlZCB0byBiZSB1cGRhdGVkL3JlcGxhY2VkIGluY2FzZSBhbiBlYXJsaWVyIGRpcmVjdGl2ZVxuICAvLyBhbHJlYWR5IHdyb3RlIHRvIHRoZSBleGFjdCBzYW1lIHN0eWxlLXByb3BlcnR5IG9yIGNsYXNzTmFtZSB2YWx1ZS4gSW4gb3RoZXIgd29yZHNcbiAgLy8gdGhpcyBkZWNpZGVzIHdoYXQgdG8gZG8gaWYgYW5kIHdoZW4gdGhlcmUgaXMgYSBjb2xsaXNpb24uXG4gIGlmIChjdXJyZW50VmFsdWUgIT0gbnVsbCkge1xuICAgIGlmIChuZXdWYWx1ZSAhPSBudWxsKSB7XG4gICAgICAvLyBpZiBhIGRpcmVjdGl2ZSBpbmRleCBpcyBsb3dlciB0aGFuIGl0IGFsd2F5cyBoYXMgcHJpb3JpdHkgb3ZlciB0aGVcbiAgICAgIC8vIHByZXZpb3VzIGRpcmVjdGl2ZSdzIHZhbHVlLi4uXG4gICAgICByZXR1cm4gbmV3RGlyZWN0aXZlT3duZXIgPD0gY3VycmVudERpcmVjdGl2ZU93bmVyO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBvbmx5IHdyaXRlIGEgbnVsbCB2YWx1ZSBpbmNhc2UgaXQncyB0aGUgc2FtZSBvd25lciB3cml0aW5nIGl0LlxuICAgICAgLy8gdGhpcyBhdm9pZHMgaGF2aW5nIGEgaGlnaGVyLXByaW9yaXR5IGRpcmVjdGl2ZSB3cml0ZSB0byBudWxsXG4gICAgICAvLyBvbmx5IHRvIGhhdmUgYSBsZXNzZXItcHJpb3JpdHkgZGlyZWN0aXZlIGNoYW5nZSByaWdodCB0byBhXG4gICAgICAvLyBub24tbnVsbCB2YWx1ZSBpbW1lZGlhdGVseSBhZnRlcndhcmRzLlxuICAgICAgcmV0dXJuIGN1cnJlbnREaXJlY3RpdmVPd25lciA9PT0gbmV3RGlyZWN0aXZlT3duZXI7XG4gICAgfVxuICB9XG4gIHJldHVybiB0cnVlO1xufVxuXG4vKipcbiAqIFJldHVybnMgdGhlIGNsYXNzTmFtZSBzdHJpbmcgb2YgYWxsIHRoZSBpbml0aWFsIGNsYXNzZXMgZm9yIHRoZSBlbGVtZW50LlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gaXMgZGVzaWduZWQgdG8gcG9wdWxhdGUgYW5kIGNhY2hlIGFsbCB0aGUgc3RhdGljIGNsYXNzXG4gKiB2YWx1ZXMgaW50byBhIGNsYXNzTmFtZSBzdHJpbmcuIFRoZSBjYWNoaW5nIG1lY2hhbmlzbSB3b3JrcyBieSBwbGFjaW5nXG4gKiB0aGUgY29tcGxldGVkIGNsYXNzTmFtZSBzdHJpbmcgaW50byB0aGUgaW5pdGlhbCB2YWx1ZXMgYXJyYXkgaW50byBhXG4gKiBkZWRpY2F0ZWQgc2xvdC4gVGhpcyB3aWxsIHByZXZlbnQgdGhlIGZ1bmN0aW9uIGZyb20gaGF2aW5nIHRvIHBvcHVsYXRlXG4gKiB0aGUgc3RyaW5nIGVhY2ggdGltZSBhbiBlbGVtZW50IGlzIGNyZWF0ZWQgb3IgbWF0Y2hlZC5cbiAqXG4gKiBAcmV0dXJucyB0aGUgY2xhc3NOYW1lIHN0cmluZyAoZS5nLiBgb24gYWN0aXZlIHJlZGApXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRJbml0aWFsQ2xhc3NOYW1lVmFsdWUoY29udGV4dDogU3R5bGluZ0NvbnRleHQpOiBzdHJpbmcge1xuICBjb25zdCBpbml0aWFsQ2xhc3NWYWx1ZXMgPSBjb250ZXh0W1N0eWxpbmdJbmRleC5Jbml0aWFsQ2xhc3NWYWx1ZXNQb3NpdGlvbl07XG4gIGxldCBjbGFzc05hbWUgPSBpbml0aWFsQ2xhc3NWYWx1ZXNbSW5pdGlhbFN0eWxpbmdWYWx1ZXNJbmRleC5Jbml0aWFsQ2xhc3Nlc1N0cmluZ1Bvc2l0aW9uXTtcbiAgaWYgKGNsYXNzTmFtZSA9PT0gbnVsbCkge1xuICAgIGNsYXNzTmFtZSA9ICcnO1xuICAgIGZvciAobGV0IGkgPSBJbml0aWFsU3R5bGluZ1ZhbHVlc0luZGV4LktleVZhbHVlU3RhcnRQb3NpdGlvbjsgaSA8IGluaXRpYWxDbGFzc1ZhbHVlcy5sZW5ndGg7XG4gICAgICAgICBpICs9IEluaXRpYWxTdHlsaW5nVmFsdWVzSW5kZXguU2l6ZSkge1xuICAgICAgY29uc3QgaXNQcmVzZW50ID0gaW5pdGlhbENsYXNzVmFsdWVzW2kgKyAxXTtcbiAgICAgIGlmIChpc1ByZXNlbnQpIHtcbiAgICAgICAgY2xhc3NOYW1lICs9IChjbGFzc05hbWUubGVuZ3RoID8gJyAnIDogJycpICsgaW5pdGlhbENsYXNzVmFsdWVzW2ldO1xuICAgICAgfVxuICAgIH1cbiAgICBpbml0aWFsQ2xhc3NWYWx1ZXNbSW5pdGlhbFN0eWxpbmdWYWx1ZXNJbmRleC5Jbml0aWFsQ2xhc3Nlc1N0cmluZ1Bvc2l0aW9uXSA9IGNsYXNzTmFtZTtcbiAgfVxuICByZXR1cm4gY2xhc3NOYW1lO1xufVxuXG4vKipcbiAqIFJldHVybnMgdGhlIHN0eWxlIHN0cmluZyBvZiBhbGwgdGhlIGluaXRpYWwgc3R5bGVzIGZvciB0aGUgZWxlbWVudC5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIGlzIGRlc2lnbmVkIHRvIHBvcHVsYXRlIGFuZCBjYWNoZSBhbGwgdGhlIHN0YXRpYyBzdHlsZVxuICogdmFsdWVzIGludG8gYSBzdHlsZSBzdHJpbmcuIFRoZSBjYWNoaW5nIG1lY2hhbmlzbSB3b3JrcyBieSBwbGFjaW5nXG4gKiB0aGUgY29tcGxldGVkIHN0eWxlIHN0cmluZyBpbnRvIHRoZSBpbml0aWFsIHZhbHVlcyBhcnJheSBpbnRvIGFcbiAqIGRlZGljYXRlZCBzbG90LiBUaGlzIHdpbGwgcHJldmVudCB0aGUgZnVuY3Rpb24gZnJvbSBoYXZpbmcgdG8gcG9wdWxhdGVcbiAqIHRoZSBzdHJpbmcgZWFjaCB0aW1lIGFuIGVsZW1lbnQgaXMgY3JlYXRlZCBvciBtYXRjaGVkLlxuICpcbiAqIEByZXR1cm5zIHRoZSBzdHlsZSBzdHJpbmcgKGUuZy4gYHdpZHRoOjEwMHB4O2hlaWdodDoyMDBweGApXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRJbml0aWFsU3R5bGVTdHJpbmdWYWx1ZShjb250ZXh0OiBTdHlsaW5nQ29udGV4dCk6IHN0cmluZyB7XG4gIGNvbnN0IGluaXRpYWxTdHlsZVZhbHVlcyA9IGNvbnRleHRbU3R5bGluZ0luZGV4LkluaXRpYWxTdHlsZVZhbHVlc1Bvc2l0aW9uXTtcbiAgbGV0IHN0eWxlU3RyaW5nID0gaW5pdGlhbFN0eWxlVmFsdWVzW0luaXRpYWxTdHlsaW5nVmFsdWVzSW5kZXguSW5pdGlhbENsYXNzZXNTdHJpbmdQb3NpdGlvbl07XG4gIGlmIChzdHlsZVN0cmluZyA9PT0gbnVsbCkge1xuICAgIHN0eWxlU3RyaW5nID0gJyc7XG4gICAgZm9yIChsZXQgaSA9IEluaXRpYWxTdHlsaW5nVmFsdWVzSW5kZXguS2V5VmFsdWVTdGFydFBvc2l0aW9uOyBpIDwgaW5pdGlhbFN0eWxlVmFsdWVzLmxlbmd0aDtcbiAgICAgICAgIGkgKz0gSW5pdGlhbFN0eWxpbmdWYWx1ZXNJbmRleC5TaXplKSB7XG4gICAgICBjb25zdCB2YWx1ZSA9IGluaXRpYWxTdHlsZVZhbHVlc1tpICsgMV07XG4gICAgICBpZiAodmFsdWUgIT09IG51bGwpIHtcbiAgICAgICAgc3R5bGVTdHJpbmcgKz0gKHN0eWxlU3RyaW5nLmxlbmd0aCA/ICc7JyA6ICcnKSArIGAke2luaXRpYWxTdHlsZVZhbHVlc1tpXX06JHt2YWx1ZX1gO1xuICAgICAgfVxuICAgIH1cbiAgICBpbml0aWFsU3R5bGVWYWx1ZXNbSW5pdGlhbFN0eWxpbmdWYWx1ZXNJbmRleC5Jbml0aWFsQ2xhc3Nlc1N0cmluZ1Bvc2l0aW9uXSA9IHN0eWxlU3RyaW5nO1xuICB9XG4gIHJldHVybiBzdHlsZVN0cmluZztcbn1cblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBjdXJyZW50IGNhY2hlZCBtdXRsaS12YWx1ZSBmb3IgYSBnaXZlbiBkaXJlY3RpdmVJbmRleCB3aXRoaW4gdGhlIHByb3ZpZGVkIGNvbnRleHQuXG4gKi9cbmZ1bmN0aW9uIHJlYWRDYWNoZWRNYXBWYWx1ZShcbiAgICBjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgZW50cnlJc0NsYXNzQmFzZWQ6IGJvb2xlYW4sIGRpcmVjdGl2ZUluZGV4OiBudW1iZXIpIHtcbiAgY29uc3QgdmFsdWVzOiBNYXBCYXNlZE9mZnNldFZhbHVlcyA9XG4gICAgICBjb250ZXh0W2VudHJ5SXNDbGFzc0Jhc2VkID8gU3R5bGluZ0luZGV4LkNhY2hlZE11bHRpQ2xhc3NlcyA6IFN0eWxpbmdJbmRleC5DYWNoZWRNdWx0aVN0eWxlc107XG4gIGNvbnN0IGluZGV4ID0gTWFwQmFzZWRPZmZzZXRWYWx1ZXNJbmRleC5WYWx1ZXNTdGFydFBvc2l0aW9uICtcbiAgICAgIGRpcmVjdGl2ZUluZGV4ICogTWFwQmFzZWRPZmZzZXRWYWx1ZXNJbmRleC5TaXplO1xuICByZXR1cm4gdmFsdWVzW2luZGV4ICsgTWFwQmFzZWRPZmZzZXRWYWx1ZXNJbmRleC5WYWx1ZU9mZnNldF0gfHwgbnVsbDtcbn1cblxuLyoqXG4gKiBEZXRlcm1pbmVzIHdoZXRoZXIgdGhlIHByb3ZpZGVkIG11bHRpIHN0eWxpbmcgdmFsdWUgc2hvdWxkIGJlIHVwZGF0ZWQgb3Igbm90LlxuICpcbiAqIEJlY2F1c2UgYFtzdHlsZV1gIGFuZCBgW2NsYXNzXWAgYmluZGluZ3MgcmVseSBvbiBhbiBpZGVudGl0eSBjaGFuZ2UgdG8gb2NjdXIgYmVmb3JlXG4gKiBhcHBseWluZyBuZXcgdmFsdWVzLCB0aGUgc3R5bGluZyBhbGdvcml0aG0gbWF5IG5vdCB1cGRhdGUgYW4gZXhpc3RpbmcgZW50cnkgaW50b1xuICogdGhlIGNvbnRleHQgaWYgYSBwcmV2aW91cyBkaXJlY3RpdmUncyBlbnRyeSBjaGFuZ2VkIHNoYXBlLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gd2lsbCBkZWNpZGUgd2hldGhlciBvciBub3QgYSB2YWx1ZSBzaG91bGQgYmUgYXBwbGllZCAoaWYgdGhlcmUgaXMgYVxuICogY2FjaGUgbWlzcykgdG8gdGhlIGNvbnRleHQgYmFzZWQgb24gdGhlIGZvbGxvd2luZyBydWxlczpcbiAqXG4gKiAtIElmIHRoZXJlIGlzIGFuIGlkZW50aXR5IGNoYW5nZSBiZXR3ZWVuIHRoZSBleGlzdGluZyB2YWx1ZSBhbmQgbmV3IHZhbHVlXG4gKiAtIElmIHRoZXJlIGlzIG5vIGV4aXN0aW5nIHZhbHVlIGNhY2hlZCAoZmlyc3Qgd3JpdGUpXG4gKiAtIElmIGEgcHJldmlvdXMgZGlyZWN0aXZlIGZsYWdnZWQgdGhlIGV4aXN0aW5nIGNhY2hlZCB2YWx1ZSBhcyBkaXJ0eVxuICovXG5mdW5jdGlvbiBpc011bHRpVmFsdWVDYWNoZUhpdChcbiAgICBjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgZW50cnlJc0NsYXNzQmFzZWQ6IGJvb2xlYW4sIGRpcmVjdGl2ZUluZGV4OiBudW1iZXIsXG4gICAgbmV3VmFsdWU6IGFueSk6IGJvb2xlYW4ge1xuICBjb25zdCBpbmRleE9mQ2FjaGVkVmFsdWVzID1cbiAgICAgIGVudHJ5SXNDbGFzc0Jhc2VkID8gU3R5bGluZ0luZGV4LkNhY2hlZE11bHRpQ2xhc3NlcyA6IFN0eWxpbmdJbmRleC5DYWNoZWRNdWx0aVN0eWxlcztcbiAgY29uc3QgY2FjaGVkVmFsdWVzID0gY29udGV4dFtpbmRleE9mQ2FjaGVkVmFsdWVzXSBhcyBNYXBCYXNlZE9mZnNldFZhbHVlcztcbiAgY29uc3QgaW5kZXggPSBNYXBCYXNlZE9mZnNldFZhbHVlc0luZGV4LlZhbHVlc1N0YXJ0UG9zaXRpb24gK1xuICAgICAgZGlyZWN0aXZlSW5kZXggKiBNYXBCYXNlZE9mZnNldFZhbHVlc0luZGV4LlNpemU7XG4gIGlmIChjYWNoZWRWYWx1ZXNbaW5kZXggKyBNYXBCYXNlZE9mZnNldFZhbHVlc0luZGV4LkRpcnR5RmxhZ09mZnNldF0pIHJldHVybiBmYWxzZTtcbiAgcmV0dXJuIG5ld1ZhbHVlID09PSBOT19DSEFOR0UgfHxcbiAgICAgIHJlYWRDYWNoZWRNYXBWYWx1ZShjb250ZXh0LCBlbnRyeUlzQ2xhc3NCYXNlZCwgZGlyZWN0aXZlSW5kZXgpID09PSBuZXdWYWx1ZTtcbn1cblxuLyoqXG4gKiBVcGRhdGVzIHRoZSBjYWNoZWQgc3RhdHVzIG9mIGEgbXVsdGktc3R5bGluZyB2YWx1ZSBpbiB0aGUgY29udGV4dC5cbiAqXG4gKiBUaGUgY2FjaGVkIG1hcCBhcnJheSAod2hpY2ggZXhpc3RzIGluIHRoZSBjb250ZXh0KSBjb250YWlucyBhIG1hbmlmZXN0IG9mXG4gKiBlYWNoIG11bHRpLXN0eWxpbmcgZW50cnkgKGBbc3R5bGVdYCBhbmQgYFtjbGFzc11gIGVudHJpZXMpIGZvciB0aGUgdGVtcGxhdGVcbiAqIGFzIHdlbGwgYXMgYWxsIGRpcmVjdGl2ZXMuXG4gKlxuICogVGhpcyBmdW5jdGlvbiB3aWxsIHVwZGF0ZSB0aGUgY2FjaGVkIHN0YXR1cyBvZiB0aGUgcHJvdmlkZWQgbXVsdGktc3R5bGVcbiAqIGVudHJ5IHdpdGhpbiB0aGUgY2FjaGUuXG4gKlxuICogV2hlbiBjYWxsZWQsIHRoaXMgZnVuY3Rpb24gd2lsbCB1cGRhdGUgdGhlIGZvbGxvd2luZyBpbmZvcm1hdGlvbjpcbiAqIC0gVGhlIGFjdHVhbCBjYWNoZWQgdmFsdWUgKHRoZSByYXcgdmFsdWUgdGhhdCB3YXMgcGFzc2VkIGludG8gYFtzdHlsZV1gIG9yIGBbY2xhc3NdYClcbiAqIC0gVGhlIHRvdGFsIGFtb3VudCBvZiB1bmlxdWUgc3R5bGluZyBlbnRyaWVzIHRoYXQgdGhpcyB2YWx1ZSBoYXMgd3JpdHRlbiBpbnRvIHRoZSBjb250ZXh0XG4gKiAtIFRoZSBleGFjdCBwb3NpdGlvbiBvZiB3aGVyZSB0aGUgbXVsdGkgc3R5bGluZyBlbnRyaWVzIHN0YXJ0IGluIHRoZSBjb250ZXh0IGZvciB0aGlzIGJpbmRpbmdcbiAqIC0gVGhlIGRpcnR5IGZsYWcgd2lsbCBiZSBzZXQgdG8gdHJ1ZVxuICpcbiAqIElmIHRoZSBgZGlydHlGdXR1cmVWYWx1ZXNgIHBhcmFtIGlzIHByb3ZpZGVkIHRoZW4gaXQgd2lsbCB1cGRhdGUgYWxsIGZ1dHVyZSBlbnRyaWVzIChiaW5kaW5nXG4gKiBlbnRyaWVzIHRoYXQgZXhpc3QgYXMgYXBhcnQgb2Ygb3RoZXIgZGlyZWN0aXZlcykgdG8gYmUgZGlydHkgYXMgd2VsbC4gVGhpcyB3aWxsIGZvcmNlIHRoZVxuICogc3R5bGluZyBhbGdvcml0aG0gdG8gcmVhcHBseSB0aG9zZSB2YWx1ZXMgb25jZSBjaGFuZ2UgZGV0ZWN0aW9uIGNoZWNrcyB0aGVtICh3aGljaCB3aWxsIGluXG4gKiB0dXJuIGNhdXNlIHRoZSBzdHlsaW5nIGNvbnRleHQgdG8gdXBkYXRlIGl0c2VsZiBhbmQgdGhlIGNvcnJlY3Qgc3R5bGluZyB2YWx1ZXMgd2lsbCBiZVxuICogcmVuZGVyZWQgb24gc2NyZWVuKS5cbiAqL1xuZnVuY3Rpb24gdXBkYXRlQ2FjaGVkTWFwVmFsdWUoXG4gICAgY29udGV4dDogU3R5bGluZ0NvbnRleHQsIGRpcmVjdGl2ZUluZGV4OiBudW1iZXIsIGVudHJ5SXNDbGFzc0Jhc2VkOiBib29sZWFuLCBjYWNoZVZhbHVlOiBhbnksXG4gICAgc3RhcnRQb3NpdGlvbjogbnVtYmVyLCBlbmRQb3NpdGlvbjogbnVtYmVyLCB0b3RhbFZhbHVlczogbnVtYmVyLCBkaXJ0eUZ1dHVyZVZhbHVlczogYm9vbGVhbikge1xuICBjb25zdCB2YWx1ZXMgPVxuICAgICAgY29udGV4dFtlbnRyeUlzQ2xhc3NCYXNlZCA/IFN0eWxpbmdJbmRleC5DYWNoZWRNdWx0aUNsYXNzZXMgOiBTdHlsaW5nSW5kZXguQ2FjaGVkTXVsdGlTdHlsZXNdO1xuXG4gIGNvbnN0IGluZGV4ID0gTWFwQmFzZWRPZmZzZXRWYWx1ZXNJbmRleC5WYWx1ZXNTdGFydFBvc2l0aW9uICtcbiAgICAgIGRpcmVjdGl2ZUluZGV4ICogTWFwQmFzZWRPZmZzZXRWYWx1ZXNJbmRleC5TaXplO1xuXG4gIC8vIGluIHRoZSBldmVudCB0aGF0IHRoaXMgaXMgdHJ1ZSB3ZSBhc3N1bWUgdGhhdCBmdXR1cmUgdmFsdWVzIGFyZSBkaXJ0eSBhbmQgdGhlcmVmb3JlXG4gIC8vIHdpbGwgYmUgY2hlY2tlZCBhZ2FpbiBpbiB0aGUgbmV4dCBDRCBjeWNsZVxuICBpZiAoZGlydHlGdXR1cmVWYWx1ZXMpIHtcbiAgICBjb25zdCBuZXh0U3RhcnRQb3NpdGlvbiA9IHN0YXJ0UG9zaXRpb24gKyB0b3RhbFZhbHVlcyAqIE1hcEJhc2VkT2Zmc2V0VmFsdWVzSW5kZXguU2l6ZTtcbiAgICBmb3IgKGxldCBpID0gaW5kZXggKyBNYXBCYXNlZE9mZnNldFZhbHVlc0luZGV4LlNpemU7IGkgPCB2YWx1ZXMubGVuZ3RoO1xuICAgICAgICAgaSArPSBNYXBCYXNlZE9mZnNldFZhbHVlc0luZGV4LlNpemUpIHtcbiAgICAgIHZhbHVlc1tpICsgTWFwQmFzZWRPZmZzZXRWYWx1ZXNJbmRleC5Qb3NpdGlvblN0YXJ0T2Zmc2V0XSA9IG5leHRTdGFydFBvc2l0aW9uO1xuICAgICAgdmFsdWVzW2kgKyBNYXBCYXNlZE9mZnNldFZhbHVlc0luZGV4LkRpcnR5RmxhZ09mZnNldF0gPSAxO1xuICAgIH1cbiAgfVxuXG4gIHZhbHVlc1tpbmRleCArIE1hcEJhc2VkT2Zmc2V0VmFsdWVzSW5kZXguRGlydHlGbGFnT2Zmc2V0XSA9IDA7XG4gIHZhbHVlc1tpbmRleCArIE1hcEJhc2VkT2Zmc2V0VmFsdWVzSW5kZXguUG9zaXRpb25TdGFydE9mZnNldF0gPSBzdGFydFBvc2l0aW9uO1xuICB2YWx1ZXNbaW5kZXggKyBNYXBCYXNlZE9mZnNldFZhbHVlc0luZGV4LlZhbHVlT2Zmc2V0XSA9IGNhY2hlVmFsdWU7XG4gIHZhbHVlc1tpbmRleCArIE1hcEJhc2VkT2Zmc2V0VmFsdWVzSW5kZXguVmFsdWVDb3VudE9mZnNldF0gPSB0b3RhbFZhbHVlcztcblxuICAvLyB0aGUgY29kZSBiZWxvdyBjb3VudHMgdGhlIHRvdGFsIGFtb3VudCBvZiBzdHlsaW5nIHZhbHVlcyB0aGF0IGV4aXN0IGluXG4gIC8vIHRoZSBjb250ZXh0IHVwIHVudGlsIHRoaXMgZGlyZWN0aXZlLiBUaGlzIHZhbHVlIHdpbGwgYmUgbGF0ZXIgdXNlZCB0b1xuICAvLyB1cGRhdGUgdGhlIGNhY2hlZCB2YWx1ZSBtYXAncyB0b3RhbCBjb3VudGVyIHZhbHVlLlxuICBsZXQgdG90YWxTdHlsaW5nRW50cmllcyA9IHRvdGFsVmFsdWVzO1xuICBmb3IgKGxldCBpID0gTWFwQmFzZWRPZmZzZXRWYWx1ZXNJbmRleC5WYWx1ZXNTdGFydFBvc2l0aW9uOyBpIDwgaW5kZXg7XG4gICAgICAgaSArPSBNYXBCYXNlZE9mZnNldFZhbHVlc0luZGV4LlNpemUpIHtcbiAgICB0b3RhbFN0eWxpbmdFbnRyaWVzICs9IHZhbHVlc1tpICsgTWFwQmFzZWRPZmZzZXRWYWx1ZXNJbmRleC5WYWx1ZUNvdW50T2Zmc2V0XTtcbiAgfVxuXG4gIC8vIGJlY2F1c2Ugc3R5bGUgdmFsdWVzIGNvbWUgYmVmb3JlIGNsYXNzIHZhbHVlcyBpbiB0aGUgY29udGV4dCB0aGlzIG1lYW5zXG4gIC8vIHRoYXQgaWYgYW55IG5ldyB2YWx1ZXMgd2VyZSBpbnNlcnRlZCB0aGVuIHRoZSBjYWNoZSB2YWx1ZXMgYXJyYXkgZm9yXG4gIC8vIGNsYXNzZXMgaXMgb3V0IG9mIHN5bmMuIFRoZSBjb2RlIGJlbG93IHdpbGwgdXBkYXRlIHRoZSBvZmZzZXRzIHRvIHBvaW50XG4gIC8vIHRvIHRoZWlyIG5ldyB2YWx1ZXMuXG4gIGlmICghZW50cnlJc0NsYXNzQmFzZWQpIHtcbiAgICBjb25zdCBjbGFzc0NhY2hlID0gY29udGV4dFtTdHlsaW5nSW5kZXguQ2FjaGVkTXVsdGlDbGFzc2VzXTtcbiAgICBjb25zdCBjbGFzc2VzU3RhcnRQb3NpdGlvbiA9IGNsYXNzQ2FjaGVcbiAgICAgICAgW01hcEJhc2VkT2Zmc2V0VmFsdWVzSW5kZXguVmFsdWVzU3RhcnRQb3NpdGlvbiArXG4gICAgICAgICBNYXBCYXNlZE9mZnNldFZhbHVlc0luZGV4LlBvc2l0aW9uU3RhcnRPZmZzZXRdO1xuICAgIGNvbnN0IGRpZmZJblN0YXJ0UG9zaXRpb24gPSBlbmRQb3NpdGlvbiAtIGNsYXNzZXNTdGFydFBvc2l0aW9uO1xuICAgIGZvciAobGV0IGkgPSBNYXBCYXNlZE9mZnNldFZhbHVlc0luZGV4LlZhbHVlc1N0YXJ0UG9zaXRpb247IGkgPCBjbGFzc0NhY2hlLmxlbmd0aDtcbiAgICAgICAgIGkgKz0gTWFwQmFzZWRPZmZzZXRWYWx1ZXNJbmRleC5TaXplKSB7XG4gICAgICBjbGFzc0NhY2hlW2kgKyBNYXBCYXNlZE9mZnNldFZhbHVlc0luZGV4LlBvc2l0aW9uU3RhcnRPZmZzZXRdICs9IGRpZmZJblN0YXJ0UG9zaXRpb247XG4gICAgfVxuICB9XG5cbiAgdmFsdWVzW01hcEJhc2VkT2Zmc2V0VmFsdWVzSW5kZXguRW50cmllc0NvdW50UG9zaXRpb25dID0gdG90YWxTdHlsaW5nRW50cmllcztcbn1cblxuZnVuY3Rpb24gaHlwaGVuYXRlRW50cmllcyhlbnRyaWVzOiBzdHJpbmdbXSk6IHN0cmluZ1tdIHtcbiAgY29uc3QgbmV3RW50cmllczogc3RyaW5nW10gPSBbXTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBlbnRyaWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgbmV3RW50cmllcy5wdXNoKGh5cGhlbmF0ZShlbnRyaWVzW2ldKSk7XG4gIH1cbiAgcmV0dXJuIG5ld0VudHJpZXM7XG59XG5cbmZ1bmN0aW9uIGh5cGhlbmF0ZSh2YWx1ZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHZhbHVlLnJlcGxhY2UoXG4gICAgICAvW2Etel1bQS1aXS9nLCBtYXRjaCA9PiBgJHttYXRjaC5jaGFyQXQoMCl9LSR7bWF0Y2guY2hhckF0KDEpLnRvTG93ZXJDYXNlKCl9YCk7XG59XG5cbmZ1bmN0aW9uIHJlZ2lzdGVyTXVsdGlNYXBFbnRyeShcbiAgICBjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgZGlyZWN0aXZlSW5kZXg6IG51bWJlciwgZW50cnlJc0NsYXNzQmFzZWQ6IGJvb2xlYW4sXG4gICAgc3RhcnRQb3NpdGlvbjogbnVtYmVyLCBjb3VudCA9IDApIHtcbiAgY29uc3QgY2FjaGVkVmFsdWVzID1cbiAgICAgIGNvbnRleHRbZW50cnlJc0NsYXNzQmFzZWQgPyBTdHlsaW5nSW5kZXguQ2FjaGVkTXVsdGlDbGFzc2VzIDogU3R5bGluZ0luZGV4LkNhY2hlZE11bHRpU3R5bGVzXTtcbiAgaWYgKGRpcmVjdGl2ZUluZGV4ID4gMCkge1xuICAgIGNvbnN0IGxpbWl0ID0gTWFwQmFzZWRPZmZzZXRWYWx1ZXNJbmRleC5WYWx1ZXNTdGFydFBvc2l0aW9uICtcbiAgICAgICAgKGRpcmVjdGl2ZUluZGV4ICogTWFwQmFzZWRPZmZzZXRWYWx1ZXNJbmRleC5TaXplKTtcbiAgICB3aGlsZSAoY2FjaGVkVmFsdWVzLmxlbmd0aCA8IGxpbWl0KSB7XG4gICAgICAvLyB0aGlzIG1lYW5zIHRoYXQgT05MWSBkaXJlY3RpdmUgY2xhc3Mgc3R5bGluZyAobGlrZSBuZ0NsYXNzKSB3YXMgdXNlZFxuICAgICAgLy8gdGhlcmVmb3JlIHRoZSByb290IGRpcmVjdGl2ZSB3aWxsIHN0aWxsIG5lZWQgdG8gYmUgZmlsbGVkIGluIGFzIHdlbGxcbiAgICAgIC8vIGFzIGFueSBvdGhlciBkaXJlY3RpdmUgc3BhY2VzIGluY2FzZSB0aGV5IG9ubHkgdXNlZCBzdGF0aWMgdmFsdWVzXG4gICAgICBjYWNoZWRWYWx1ZXMucHVzaCgwLCBzdGFydFBvc2l0aW9uLCBudWxsLCAwKTtcbiAgICB9XG4gIH1cbiAgY2FjaGVkVmFsdWVzLnB1c2goMCwgc3RhcnRQb3NpdGlvbiwgbnVsbCwgY291bnQpO1xufVxuIl19