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
export function initializeStaticContext(attrs, stylingStartIndex, directiveRef) {
    var context = createEmptyStylingContext();
    patchContextWithStaticAttrs(context, attrs, stylingStartIndex, directiveRef);
    return context;
}
/**
 * Designed to update an existing styling context with new static styling
 * data (classes and styles).
 *
 * @param context the existing styling context
 * @param attrs an array of new static styling attributes that will be
 *              assigned to the context
 * @param attrsStylingStartIndex what index to start iterating within the
 *              provided `attrs` array to start reading style and class values
 * @param directiveRef the directive instance with which static data is associated with.
 */
export function patchContextWithStaticAttrs(context, attrs, attrsStylingStartIndex, directiveRef) {
    // this means the context has already been set and instantiated
    if (context[1 /* MasterFlagPosition */] & 16 /* BindingAllocationLocked */)
        return;
    // If the styling context has already been patched with the given directive's bindings,
    // then there is no point in doing it again. The reason why this may happen (the directive
    // styling being patched twice) is because the `stylingBinding` function is called each time
    // an element is created (both within a template function and within directive host bindings).
    var directives = context[2 /* DirectiveRegistryPosition */];
    var detectedIndex = getDirectiveRegistryValuesIndexOf(directives, directiveRef || null);
    if (detectedIndex === -1) {
        // this is a new directive which we have not seen yet.
        detectedIndex = allocateDirectiveIntoContext(context, directiveRef);
    }
    var directiveIndex = detectedIndex / 4 /* Size */;
    var initialClasses = null;
    var initialStyles = null;
    var mode = -1;
    for (var i = attrsStylingStartIndex; i < attrs.length; i++) {
        var attr = attrs[i];
        if (typeof attr == 'number') {
            mode = attr;
        }
        else if (mode == 1 /* Classes */) {
            initialClasses = initialClasses || context[4 /* InitialClassValuesPosition */];
            patchInitialStylingValue(initialClasses, attr, true, directiveIndex);
        }
        else if (mode == 2 /* Styles */) {
            initialStyles = initialStyles || context[3 /* InitialStyleValuesPosition */];
            patchInitialStylingValue(initialStyles, attr, attrs[++i], directiveIndex);
        }
    }
}
/**
 * Designed to add a style or class value into the existing set of initial styles.
 *
 * The function will search and figure out if a style/class value is already present
 * within the provided initial styling array. If and when a style/class value is
 * present (allocated) then the code below will set the new value depending on the
 * following cases:
 *
 *  1) if the existing value is falsy (this happens because a `[class.prop]` or
 *     `[style.prop]` binding was set, but there wasn't a matching static style
 *     or class present on the context)
 *  2) if the value was set already by the template, component or directive, but the
 *     new value is set on a higher level (i.e. a sub component which extends a parent
 *     component sets its value after the parent has already set the same one)
 *  3) if the same directive provides a new set of styling values to set
 *
 * @param initialStyling the initial styling array where the new styling entry will be added to
 * @param prop the property value of the new entry (e.g. `width` (styles) or `foo` (classes))
 * @param value the styling value of the new entry (e.g. `absolute` (styles) or `true` (classes))
 * @param directiveOwnerIndex the directive owner index value of the styling source responsible
 *        for these styles (see `interfaces/styling.ts#directives` for more info)
 */
function patchInitialStylingValue(initialStyling, prop, value, directiveOwnerIndex) {
    for (var i = 2 /* KeyValueStartPosition */; i < initialStyling.length; i += 3 /* Size */) {
        var key = initialStyling[i + 0 /* PropOffset */];
        if (key === prop) {
            var existingValue = initialStyling[i + 1 /* ValueOffset */];
            var existingOwner = initialStyling[i + 2 /* DirectiveOwnerOffset */];
            if (allowValueChange(existingValue, value, existingOwner, directiveOwnerIndex)) {
                addOrUpdateStaticStyle(i, initialStyling, prop, value, directiveOwnerIndex);
            }
            return;
        }
    }
    // We did not find existing key, add a new one.
    addOrUpdateStaticStyle(null, initialStyling, prop, value, directiveOwnerIndex);
}
/**
 * Runs through the initial class values present in the provided
 * context and renders them via the provided renderer on the element.
 *
 * @param element the element the styling will be applied to
 * @param context the source styling context which contains the initial class values
 * @param renderer the renderer instance that will be used to apply the class
 * @returns the index that the classes were applied up until
 */
export function renderInitialClasses(element, context, renderer, startIndex) {
    var initialClasses = context[4 /* InitialClassValuesPosition */];
    var i = startIndex || 2 /* KeyValueStartPosition */;
    while (i < initialClasses.length) {
        var value = initialClasses[i + 1 /* ValueOffset */];
        if (value) {
            setClass(element, initialClasses[i + 0 /* PropOffset */], true, renderer, null);
        }
        i += 3 /* Size */;
    }
    return i;
}
/**
 * Runs through the initial styles values present in the provided
 * context and renders them via the provided renderer on the element.
 *
 * @param element the element the styling will be applied to
 * @param context the source styling context which contains the initial class values
 * @param renderer the renderer instance that will be used to apply the class
 * @returns the index that the styles were applied up until
 */
export function renderInitialStyles(element, context, renderer, startIndex) {
    var initialStyles = context[3 /* InitialStyleValuesPosition */];
    var i = startIndex || 2 /* KeyValueStartPosition */;
    while (i < initialStyles.length) {
        var value = initialStyles[i + 1 /* ValueOffset */];
        if (value) {
            setStyle(element, initialStyles[i + 0 /* PropOffset */], value, renderer, null);
        }
        i += 3 /* Size */;
    }
    return i;
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
        // is ALWAYS added in case a follow-up directive introduces the same initial
        // style/class value later on.
        var initialValuesToLookup = entryIsClassBased ? initialClasses : initialStyles;
        var indexForInitial = getInitialStylingValuesIndexOf(initialValuesToLookup, propName);
        if (indexForInitial === -1) {
            indexForInitial = addOrUpdateStaticStyle(null, initialValuesToLookup, propName, entryIsClassBased ? false : null, directiveIndex) +
                1 /* ValueOffset */;
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
    var stylesValue = stylesPlayerBuilder ? stylesInput['value'] : stylesInput;
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
                // this is an early exit in case a value was already encountered above in the
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
                            // no point in updating the value in case it matches. In other words if the
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
    // values (also follow-up directives can write new values in case earlier directives set anything
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
                // therefore we can safely adopt it in case there's nothing else
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
    for (var i = 2 /* KeyValueStartPosition */; i < keyValues.length; i += 3 /* Size */) {
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
    // or class should be allowed to be updated/replaced in case an earlier directive
    // already wrote to the exact same style-property or className value. In other words
    // this decides what to do if and when there is a collision.
    if (currentValue != null) {
        if (newValue != null) {
            // if a directive index is lower than it always has priority over the
            // previous directive's value...
            return newDirectiveOwner <= currentDirectiveOwner;
        }
        else {
            // only write a null value in case it's the same owner writing it.
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
    var className = initialClassValues[1 /* CachedStringValuePosition */];
    if (className === null) {
        className = '';
        for (var i = 2 /* KeyValueStartPosition */; i < initialClassValues.length; i += 3 /* Size */) {
            var isPresent = initialClassValues[i + 1];
            if (isPresent) {
                className += (className.length ? ' ' : '') + initialClassValues[i];
            }
        }
        initialClassValues[1 /* CachedStringValuePosition */] = className;
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
    var styleString = initialStyleValues[1 /* CachedStringValuePosition */];
    if (styleString === null) {
        styleString = '';
        for (var i = 2 /* KeyValueStartPosition */; i < initialStyleValues.length; i += 3 /* Size */) {
            var value = initialStyleValues[i + 1];
            if (value !== null) {
                styleString += (styleString.length ? ';' : '') + (initialStyleValues[i] + ":" + value);
            }
        }
        initialStyleValues[1 /* CachedStringValuePosition */] = styleString;
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
            // as any other directive spaces in case they only used static values
            cachedValues.push(0, startPosition, null, 0);
        }
    }
    cachedValues.push(0, startPosition, null, count);
}
/**
 * Inserts or updates an existing entry in the provided `staticStyles` collection.
 *
 * @param index the index representing an existing styling entry in the collection:
 *  if provided (numeric): then it will update the existing entry at the given position
 *  if null: then it will insert a new entry within the collection
 * @param staticStyles a collection of style or class entries where the value will
 *  be inserted or patched
 * @param prop the property value of the entry (e.g. `width` (styles) or `foo` (classes))
 * @param value the styling value of the entry (e.g. `absolute` (styles) or `true` (classes))
 * @param directiveOwnerIndex the directive owner index value of the styling source responsible
 *        for these styles (see `interfaces/styling.ts#directives` for more info)
 * @returns the index of the updated or new entry within the collection
 */
function addOrUpdateStaticStyle(index, staticStyles, prop, value, directiveOwnerIndex) {
    if (index === null) {
        index = staticStyles.length;
        staticStyles.push(null, null, null);
        staticStyles[index + 0 /* PropOffset */] = prop;
    }
    staticStyles[index + 1 /* ValueOffset */] = value;
    staticStyles[index + 2 /* DirectiveOwnerOffset */] = directiveOwnerIndex;
    return index;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xhc3NfYW5kX3N0eWxlX2JpbmRpbmdzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9zdHlsaW5nL2NsYXNzX2FuZF9zdHlsZV9iaW5kaW5ncy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBUUEsT0FBTyxFQUFDLFdBQVcsRUFBRSxTQUFTLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFHaEQsT0FBTyxFQUFzQixtQkFBbUIsRUFBRSxvQkFBb0IsRUFBQyxNQUFNLHdCQUF3QixDQUFDO0FBR3RHLE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxXQUFXLENBQUM7QUFDcEMsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLDhCQUE4QixDQUFDO0FBRTVELE9BQU8sRUFBQyxrQkFBa0IsRUFBQyxNQUFNLGtCQUFrQixDQUFDO0FBQ3BELE9BQU8sRUFBQyxpQkFBaUIsRUFBRSxrQkFBa0IsRUFBRSw0QkFBNEIsRUFBRSx5QkFBeUIsRUFBRSxnQkFBZ0IsRUFBQyxNQUFNLFFBQVEsQ0FBQztBQUl4STs7Ozs7Ozs7Ozs7Ozs7R0FjRztBQUlIOztHQUVHO0FBQ0gsTUFBTSxVQUFVLHVCQUF1QixDQUNuQyxLQUFrQixFQUFFLGlCQUF5QixFQUFFLFlBQXlCO0lBQzFFLElBQU0sT0FBTyxHQUFHLHlCQUF5QixFQUFFLENBQUM7SUFDNUMsMkJBQTJCLENBQUMsT0FBTyxFQUFFLEtBQUssRUFBRSxpQkFBaUIsRUFBRSxZQUFZLENBQUMsQ0FBQztJQUM3RSxPQUFPLE9BQU8sQ0FBQztBQUNqQixDQUFDO0FBRUQ7Ozs7Ozs7Ozs7R0FVRztBQUNILE1BQU0sVUFBVSwyQkFBMkIsQ0FDdkMsT0FBdUIsRUFBRSxLQUFrQixFQUFFLHNCQUE4QixFQUMzRSxZQUF5QjtJQUMzQiwrREFBK0Q7SUFDL0QsSUFBSSxPQUFPLDRCQUFpQyxtQ0FBdUM7UUFBRSxPQUFPO0lBRTVGLHVGQUF1RjtJQUN2RiwwRkFBMEY7SUFDMUYsNEZBQTRGO0lBQzVGLDhGQUE4RjtJQUM5RixJQUFNLFVBQVUsR0FBRyxPQUFPLG1DQUF3QyxDQUFDO0lBQ25FLElBQUksYUFBYSxHQUFHLGlDQUFpQyxDQUFDLFVBQVUsRUFBRSxZQUFZLElBQUksSUFBSSxDQUFDLENBQUM7SUFDeEYsSUFBSSxhQUFhLEtBQUssQ0FBQyxDQUFDLEVBQUU7UUFDeEIsc0RBQXNEO1FBQ3RELGFBQWEsR0FBRyw0QkFBNEIsQ0FBQyxPQUFPLEVBQUUsWUFBWSxDQUFDLENBQUM7S0FDckU7SUFDRCxJQUFNLGNBQWMsR0FBRyxhQUFhLGVBQW9DLENBQUM7SUFFekUsSUFBSSxjQUFjLEdBQThCLElBQUksQ0FBQztJQUNyRCxJQUFJLGFBQWEsR0FBOEIsSUFBSSxDQUFDO0lBQ3BELElBQUksSUFBSSxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBQ2QsS0FBSyxJQUFJLENBQUMsR0FBRyxzQkFBc0IsRUFBRSxDQUFDLEdBQUcsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtRQUMxRCxJQUFNLElBQUksR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDdEIsSUFBSSxPQUFPLElBQUksSUFBSSxRQUFRLEVBQUU7WUFDM0IsSUFBSSxHQUFHLElBQUksQ0FBQztTQUNiO2FBQU0sSUFBSSxJQUFJLG1CQUEyQixFQUFFO1lBQzFDLGNBQWMsR0FBRyxjQUFjLElBQUksT0FBTyxvQ0FBeUMsQ0FBQztZQUNwRix3QkFBd0IsQ0FBQyxjQUFjLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxjQUFjLENBQUMsQ0FBQztTQUN0RTthQUFNLElBQUksSUFBSSxrQkFBMEIsRUFBRTtZQUN6QyxhQUFhLEdBQUcsYUFBYSxJQUFJLE9BQU8sb0NBQXlDLENBQUM7WUFDbEYsd0JBQXdCLENBQUMsYUFBYSxFQUFFLElBQUksRUFBRSxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxjQUFjLENBQUMsQ0FBQztTQUMzRTtLQUNGO0FBQ0gsQ0FBQztBQUVEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0FxQkc7QUFDSCxTQUFTLHdCQUF3QixDQUM3QixjQUFvQyxFQUFFLElBQVksRUFBRSxLQUFVLEVBQzlELG1CQUEyQjtJQUM3QixLQUFLLElBQUksQ0FBQyxnQ0FBa0QsRUFBRSxDQUFDLEdBQUcsY0FBYyxDQUFDLE1BQU0sRUFDbEYsQ0FBQyxnQkFBa0MsRUFBRTtRQUN4QyxJQUFNLEdBQUcsR0FBRyxjQUFjLENBQUMsQ0FBQyxxQkFBdUMsQ0FBQyxDQUFDO1FBQ3JFLElBQUksR0FBRyxLQUFLLElBQUksRUFBRTtZQUNoQixJQUFNLGFBQWEsR0FDZixjQUFjLENBQUMsQ0FBQyxzQkFBd0MsQ0FBNEIsQ0FBQztZQUN6RixJQUFNLGFBQWEsR0FDZixjQUFjLENBQUMsQ0FBQywrQkFBaUQsQ0FBVyxDQUFDO1lBQ2pGLElBQUksZ0JBQWdCLENBQUMsYUFBYSxFQUFFLEtBQUssRUFBRSxhQUFhLEVBQUUsbUJBQW1CLENBQUMsRUFBRTtnQkFDOUUsc0JBQXNCLENBQUMsQ0FBQyxFQUFFLGNBQWMsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLG1CQUFtQixDQUFDLENBQUM7YUFDN0U7WUFDRCxPQUFPO1NBQ1I7S0FDRjtJQUVELCtDQUErQztJQUMvQyxzQkFBc0IsQ0FBQyxJQUFJLEVBQUUsY0FBYyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsbUJBQW1CLENBQUMsQ0FBQztBQUNqRixDQUFDO0FBRUQ7Ozs7Ozs7O0dBUUc7QUFDSCxNQUFNLFVBQVUsb0JBQW9CLENBQ2hDLE9BQWlCLEVBQUUsT0FBdUIsRUFBRSxRQUFtQixFQUFFLFVBQW1CO0lBQ3RGLElBQU0sY0FBYyxHQUFHLE9BQU8sb0NBQXlDLENBQUM7SUFDeEUsSUFBSSxDQUFDLEdBQUcsVUFBVSxpQ0FBbUQsQ0FBQztJQUN0RSxPQUFPLENBQUMsR0FBRyxjQUFjLENBQUMsTUFBTSxFQUFFO1FBQ2hDLElBQU0sS0FBSyxHQUFHLGNBQWMsQ0FBQyxDQUFDLHNCQUF3QyxDQUFDLENBQUM7UUFDeEUsSUFBSSxLQUFLLEVBQUU7WUFDVCxRQUFRLENBQ0osT0FBTyxFQUFFLGNBQWMsQ0FBQyxDQUFDLHFCQUF1QyxDQUFXLEVBQUUsSUFBSSxFQUNqRixRQUFRLEVBQUUsSUFBSSxDQUFDLENBQUM7U0FDckI7UUFDRCxDQUFDLGdCQUFrQyxDQUFDO0tBQ3JDO0lBQ0QsT0FBTyxDQUFDLENBQUM7QUFDWCxDQUFDO0FBRUQ7Ozs7Ozs7O0dBUUc7QUFDSCxNQUFNLFVBQVUsbUJBQW1CLENBQy9CLE9BQWlCLEVBQUUsT0FBdUIsRUFBRSxRQUFtQixFQUFFLFVBQW1CO0lBQ3RGLElBQU0sYUFBYSxHQUFHLE9BQU8sb0NBQXlDLENBQUM7SUFDdkUsSUFBSSxDQUFDLEdBQUcsVUFBVSxpQ0FBbUQsQ0FBQztJQUN0RSxPQUFPLENBQUMsR0FBRyxhQUFhLENBQUMsTUFBTSxFQUFFO1FBQy9CLElBQU0sS0FBSyxHQUFHLGFBQWEsQ0FBQyxDQUFDLHNCQUF3QyxDQUFDLENBQUM7UUFDdkUsSUFBSSxLQUFLLEVBQUU7WUFDVCxRQUFRLENBQ0osT0FBTyxFQUFFLGFBQWEsQ0FBQyxDQUFDLHFCQUF1QyxDQUFXLEVBQzFFLEtBQWUsRUFBRSxRQUFRLEVBQUUsSUFBSSxDQUFDLENBQUM7U0FDdEM7UUFDRCxDQUFDLGdCQUFrQyxDQUFDO0tBQ3JDO0lBQ0QsT0FBTyxDQUFDLENBQUM7QUFDWCxDQUFDO0FBRUQsTUFBTSxVQUFVLGlDQUFpQyxDQUFDLE9BQXVCO0lBQ3ZFLE9BQU8sQ0FBQyxPQUFPLDRCQUFpQyxtQ0FBdUMsQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUNqRyxDQUFDO0FBRUQ7Ozs7Ozs7Ozs7Ozs7R0FhRztBQUNILE1BQU0sVUFBVSx5QkFBeUIsQ0FDckMsT0FBdUIsRUFBRSxZQUF3QixFQUFFLGlCQUFtQyxFQUN0RixpQkFBbUMsRUFBRSxjQUF1QztJQUM5RSxJQUFJLE9BQU8sNEJBQWlDLG1DQUF1QztRQUFFLE9BQU87SUFFNUYsZ0ZBQWdGO0lBQ2hGLElBQU0sY0FBYyxHQUFHLGdDQUFnQyxDQUFDLE9BQU8sRUFBRSxZQUFZLEVBQUUsY0FBYyxDQUFDLENBQUM7SUFDL0YsSUFBSSxjQUFjLEtBQUssQ0FBQyxDQUFDLEVBQUU7UUFDekIsc0ZBQXNGO1FBQ3RGLE9BQU87S0FDUjtJQUVELElBQUksaUJBQWlCLEVBQUU7UUFDckIsaUJBQWlCLEdBQUcsZ0JBQWdCLENBQUMsaUJBQWlCLENBQUMsQ0FBQztLQUN6RDtJQUVELHFGQUFxRjtJQUNyRixtRkFBbUY7SUFDbkYsdUZBQXVGO0lBQ3ZGLDJGQUEyRjtJQUMzRixtQkFBbUI7SUFDbkIsSUFBTSxzQkFBc0IsR0FBRyxPQUFPLG1DQUF3QyxDQUFDO0lBQy9FLElBQU0seUJBQXlCLEdBQzNCLHNCQUFzQiw4QkFBa0QsQ0FBQztJQUM3RSxJQUFNLHlCQUF5QixHQUMzQixzQkFBc0IsNkJBQWlELENBQUM7SUFFNUUsSUFBTSxvQkFBb0IsR0FBRyxPQUFPLDRCQUFpQyxDQUFDO0lBQ3RFLElBQU0sb0JBQW9CLEdBQUcsT0FBTywyQkFBZ0MsQ0FBQztJQUVyRSxJQUFNLGFBQWEsR0FBRyx5QkFBeUIsZUFBb0IsQ0FBQztJQUNwRSxJQUFNLFlBQVksR0FBRyx5QkFBeUIsZUFBb0IsQ0FBQztJQUVuRSxJQUFNLHNCQUFzQixvQ0FBeUMsQ0FBQztJQUN0RSxJQUFJLHVCQUF1QixHQUFHLHNCQUFzQixHQUFHLFlBQVksQ0FBQztJQUNwRSxJQUFJLHFCQUFxQixHQUFHLHVCQUF1QixHQUFHLGFBQWEsQ0FBQztJQUNwRSxJQUFJLHNCQUFzQixHQUFHLHFCQUFxQixHQUFHLFlBQVksQ0FBQztJQUVsRSw4RUFBOEU7SUFDOUUsZ0ZBQWdGO0lBQ2hGLCtFQUErRTtJQUMvRSxxRkFBcUY7SUFDckYsbUZBQW1GO0lBQ25GLHNGQUFzRjtJQUN0RixxRkFBcUY7SUFDckYscUZBQXFGO0lBQ3JGLElBQU0sd0JBQXdCLEdBQUcsc0JBQXNCLENBQUMsTUFBTSxDQUFDO0lBQy9ELHNCQUFzQixDQUFDLElBQUksQ0FDdkIsaUJBQWlCLENBQUMsQ0FBQyxDQUFDLGlCQUFpQixDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUNoRCxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsaUJBQWlCLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUV0RCx3RkFBd0Y7SUFDeEYseUZBQXlGO0lBQ3pGLG1FQUFtRTtJQUNuRSxJQUFJLGVBQWUsR0FBRyxDQUFDLENBQUM7SUFDeEIsSUFBTSx5QkFBeUIsR0FBYSxFQUFFLENBQUM7SUFDL0MsSUFBSSxpQkFBaUIsSUFBSSxpQkFBaUIsQ0FBQyxNQUFNLEVBQUU7UUFDakQsS0FBSyxJQUFJLEdBQUMsR0FBRyxDQUFDLEVBQUUsR0FBQyxHQUFHLGlCQUFpQixDQUFDLE1BQU0sRUFBRSxHQUFDLEVBQUUsRUFBRTtZQUNqRCxJQUFNLE1BQUksR0FBRyxpQkFBaUIsQ0FBQyxHQUFDLENBQUMsQ0FBQztZQUNsQyxJQUFJLGVBQWUsR0FDZix1QkFBdUIsQ0FBQyxPQUFPLEVBQUUsTUFBSSxFQUFFLHNCQUFzQixFQUFFLHVCQUF1QixDQUFDLENBQUM7WUFDNUYsSUFBSSxlQUFlLElBQUksQ0FBQyxDQUFDLEVBQUU7Z0JBQ3pCLGVBQWUsR0FBRyx1QkFBdUIsR0FBRyxlQUFlLENBQUM7Z0JBQzVELGVBQWUsZ0JBQXFCLENBQUM7Z0JBQ3JDLHlCQUF5QixDQUFDLElBQUksQ0FBQyxNQUFJLENBQUMsQ0FBQzthQUN0QztZQUNELHNCQUFzQixDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsQ0FBQztTQUM5QztLQUNGO0lBRUQsZ0dBQWdHO0lBQ2hHLElBQU0seUJBQXlCLEdBQWEsRUFBRSxDQUFDO0lBQy9DLElBQUksaUJBQWlCLElBQUksaUJBQWlCLENBQUMsTUFBTSxFQUFFO1FBQ2pELEtBQUssSUFBSSxHQUFDLEdBQUcsQ0FBQyxFQUFFLEdBQUMsR0FBRyxpQkFBaUIsQ0FBQyxNQUFNLEVBQUUsR0FBQyxFQUFFLEVBQUU7WUFDakQsSUFBTSxNQUFJLEdBQUcsaUJBQWlCLENBQUMsR0FBQyxDQUFDLENBQUM7WUFDbEMsSUFBSSxlQUFlLEdBQ2YsdUJBQXVCLENBQUMsT0FBTyxFQUFFLE1BQUksRUFBRSx1QkFBdUIsRUFBRSxxQkFBcUIsQ0FBQyxDQUFDO1lBQzNGLElBQUksZUFBZSxJQUFJLENBQUMsQ0FBQyxFQUFFO2dCQUN6QixlQUFlLEdBQUcscUJBQXFCLEdBQUcsZUFBZSxDQUFDO2dCQUMxRCxlQUFlLGdCQUFxQixDQUFDO2dCQUNyQyx5QkFBeUIsQ0FBQyxJQUFJLENBQUMsTUFBSSxDQUFDLENBQUM7YUFDdEM7aUJBQU07Z0JBQ0wsZUFBZSxJQUFJLHlCQUF5QixDQUFDLE1BQU0sZUFBb0IsQ0FBQzthQUN6RTtZQUNELHNCQUFzQixDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsQ0FBQztTQUM5QztLQUNGO0lBRUQsNEZBQTRGO0lBQzVGLCtGQUErRjtJQUMvRiw0RkFBNEY7SUFDNUYsb0VBQW9FO0lBQ3BFLElBQUksQ0FBQyw2QkFBaUQsQ0FBQztJQUN2RCxJQUFJLHlCQUF5QixDQUFDLE1BQU0sRUFBRTtRQUNwQyxPQUFPLENBQUMsR0FBRyx3QkFBd0IsRUFBRTtZQUNuQyxJQUFNLFdBQVcsR0FDYixzQkFBc0IsQ0FBQyxDQUFDLDhCQUFrRCxDQUFDLENBQUM7WUFDaEYsSUFBTSxZQUFZLEdBQ2Qsc0JBQXNCLENBQUMsQ0FBQywrQkFBbUQsQ0FBQyxDQUFDO1lBQ2pGLElBQUksWUFBWSxFQUFFO2dCQUNoQixJQUFNLEtBQUssR0FBRyxDQUFDLDZCQUFpRCxHQUFHLFdBQVcsQ0FBQztnQkFDL0UsS0FBSyxJQUFJLENBQUMsR0FBRyxLQUFLLEVBQUUsQ0FBQyxHQUFHLEtBQUssR0FBRyxZQUFZLEVBQUUsQ0FBQyxFQUFFLEVBQUU7b0JBQ2pELHNCQUFzQixDQUFDLENBQUMsQ0FBQyxJQUFJLHlCQUF5QixDQUFDLE1BQU0sZUFBb0IsQ0FBQztpQkFDbkY7YUFDRjtZQUVELElBQU0sS0FBSyxHQUFHLFdBQVcsR0FBRyxZQUFZLENBQUM7WUFDekMsQ0FBQyxJQUFJLDZCQUFpRCxLQUFLLENBQUM7U0FDN0Q7S0FDRjtJQUVELElBQU0sZUFBZSxHQUFHLHlCQUF5QixDQUFDLE1BQU0sR0FBRyx5QkFBeUIsQ0FBQyxNQUFNLENBQUM7SUFFNUYsNEZBQTRGO0lBQzVGLDRGQUE0RjtJQUM1Rix5Q0FBeUM7SUFDekMsS0FBSyxJQUFJLEdBQUMsR0FBRyxzQkFBc0IsRUFBRSxHQUFDLEdBQUcsT0FBTyxDQUFDLE1BQU0sRUFBRSxHQUFDLGdCQUFxQixFQUFFO1FBQy9FLElBQU0sWUFBWSxHQUFHLEdBQUMsSUFBSSxxQkFBcUIsQ0FBQztRQUNoRCxJQUFNLFlBQVksR0FBRyxHQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLHNCQUFzQixDQUFDLENBQUMsQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDO1FBQzVGLElBQU0sSUFBSSxHQUFHLFdBQVcsQ0FBQyxPQUFPLEVBQUUsR0FBQyxDQUFDLENBQUM7UUFDckMsSUFBTSxXQUFXLEdBQUcsZUFBZSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzFDLElBQUksa0JBQWtCLEdBQUcscUJBQXFCLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDckQsSUFBSSxZQUFZLEVBQUU7WUFDaEIsa0JBQWtCO2dCQUNkLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQyx5QkFBeUIsQ0FBQyxNQUFNLGVBQW9CLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1NBQy9FO2FBQU07WUFDTCxrQkFBa0IsSUFBSSxDQUFDLGVBQWUsZUFBb0IsQ0FBQztnQkFDdkQsQ0FBQyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMseUJBQXlCLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsZUFBb0IsQ0FBQyxDQUFDO1NBQ2pGO1FBQ0QsT0FBTyxDQUFDLE9BQU8sRUFBRSxHQUFDLEVBQUUsUUFBUSxDQUFDLElBQUksRUFBRSxXQUFXLEVBQUUsa0JBQWtCLENBQUMsQ0FBQyxDQUFDO0tBQ3RFO0lBRUQsd0VBQXdFO0lBQ3hFLEtBQUssSUFBSSxHQUFDLEdBQUcsQ0FBQyxFQUFFLEdBQUMsR0FBRyx5QkFBeUIsQ0FBQyxNQUFNLGVBQW9CLEVBQUUsR0FBQyxFQUFFLEVBQUU7UUFDN0UsT0FBTyxDQUFDLE1BQU0sQ0FBQyxzQkFBc0IsRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDaEQsT0FBTyxDQUFDLE1BQU0sQ0FBQyx1QkFBdUIsRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDakQsdUJBQXVCLEVBQUUsQ0FBQztRQUMxQixxQkFBcUIsRUFBRSxDQUFDO1FBQ3hCLHNCQUFzQixJQUFJLENBQUMsQ0FBQyxDQUFFLDBDQUEwQztLQUN6RTtJQUVELHdFQUF3RTtJQUN4RSxLQUFLLElBQUksR0FBQyxHQUFHLENBQUMsRUFBRSxHQUFDLEdBQUcseUJBQXlCLENBQUMsTUFBTSxlQUFvQixFQUFFLEdBQUMsRUFBRSxFQUFFO1FBQzdFLE9BQU8sQ0FBQyxNQUFNLENBQUMscUJBQXFCLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQy9DLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDbkIscUJBQXFCLEVBQUUsQ0FBQztRQUN4QixzQkFBc0IsRUFBRSxDQUFDO0tBQzFCO0lBRUQsSUFBTSxjQUFjLEdBQUcsT0FBTyxvQ0FBeUMsQ0FBQztJQUN4RSxJQUFNLGFBQWEsR0FBRyxPQUFPLG9DQUF5QyxDQUFDO0lBRXZFLHdGQUF3RjtJQUN4Rix1RkFBdUY7SUFDdkYsNEZBQTRGO0lBQzVGLEtBQUssSUFBSSxHQUFDLEdBQUcsQ0FBQyxFQUFFLEdBQUMsR0FBRyxlQUFlLEVBQUUsR0FBQyxFQUFFLEVBQUU7UUFDeEMsSUFBTSxpQkFBaUIsR0FBRyxHQUFDLElBQUkseUJBQXlCLENBQUMsTUFBTSxDQUFDO1FBQ2hFLElBQU0sYUFBYSxHQUFHLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUMsR0FBRyx5QkFBeUIsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBQyxDQUFDO1FBQ3JGLElBQU0sUUFBUSxHQUFHLGlCQUFpQixDQUFDLENBQUMsQ0FBQyx5QkFBeUIsQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDO1lBQzFDLHlCQUF5QixDQUFDLGFBQWEsQ0FBQyxDQUFDO1FBRTlFLElBQUksVUFBVSxTQUFBLEVBQUUsV0FBVyxTQUFBLENBQUM7UUFDNUIsSUFBSSxpQkFBaUIsRUFBRTtZQUNyQixVQUFVLEdBQUcsc0JBQXNCO2dCQUMvQixDQUFDLENBQUMseUJBQXlCLEdBQUcsYUFBYSxDQUFDLGVBQW9CLENBQUMsQ0FBQztZQUN0RSxXQUFXLEdBQUcsdUJBQXVCO2dCQUNqQyxDQUFDLENBQUMseUJBQXlCLEdBQUcsYUFBYSxDQUFDLGVBQW9CLENBQUMsQ0FBQztTQUN2RTthQUFNO1lBQ0wsVUFBVTtnQkFDTixxQkFBcUIsR0FBRyxDQUFDLENBQUMseUJBQXlCLEdBQUcsYUFBYSxDQUFDLGVBQW9CLENBQUMsQ0FBQztZQUM5RixXQUFXLEdBQUcsc0JBQXNCO2dCQUNoQyxDQUFDLENBQUMseUJBQXlCLEdBQUcsYUFBYSxDQUFDLGVBQW9CLENBQUMsQ0FBQztTQUN2RTtRQUVELHNFQUFzRTtRQUN0RSw0RUFBNEU7UUFDNUUsOEJBQThCO1FBQzlCLElBQUkscUJBQXFCLEdBQUcsaUJBQWlCLENBQUMsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsYUFBYSxDQUFDO1FBQy9FLElBQUksZUFBZSxHQUFHLDhCQUE4QixDQUFDLHFCQUFxQixFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBQ3RGLElBQUksZUFBZSxLQUFLLENBQUMsQ0FBQyxFQUFFO1lBQzFCLGVBQWUsR0FBRyxzQkFBc0IsQ0FDbEIsSUFBSSxFQUFFLHFCQUFxQixFQUFFLFFBQVEsRUFBRSxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQ3ZFLGNBQWMsQ0FBQzttQ0FDSSxDQUFDO1NBQzNDO2FBQU07WUFDTCxlQUFlLHVCQUF5QyxDQUFDO1NBQzFEO1FBRUQsSUFBTSxXQUFXLEdBQ2Isa0JBQWtCLENBQUMsT0FBTyxFQUFFLFFBQVEsRUFBRSxpQkFBaUIsRUFBRSxjQUFjLElBQUksSUFBSSxDQUFDLENBQUM7UUFFckYsT0FBTyxDQUFDLE9BQU8sRUFBRSxXQUFXLEVBQUUsUUFBUSxDQUFDLFdBQVcsRUFBRSxlQUFlLEVBQUUsVUFBVSxDQUFDLENBQUMsQ0FBQztRQUNsRixPQUFPLENBQUMsT0FBTyxFQUFFLFdBQVcsRUFBRSxRQUFRLENBQUMsQ0FBQztRQUN4QyxRQUFRLENBQUMsT0FBTyxFQUFFLFdBQVcsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUNyQyxxQkFBcUIsQ0FBQyxPQUFPLEVBQUUsV0FBVyxFQUFFLENBQUMsRUFBRSxjQUFjLENBQUMsQ0FBQztRQUUvRCxPQUFPLENBQUMsT0FBTyxFQUFFLFVBQVUsRUFBRSxRQUFRLENBQUMsV0FBVyxFQUFFLGVBQWUsRUFBRSxXQUFXLENBQUMsQ0FBQyxDQUFDO1FBQ2xGLE9BQU8sQ0FBQyxPQUFPLEVBQUUsVUFBVSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBQ3ZDLFFBQVEsQ0FBQyxPQUFPLEVBQUUsVUFBVSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ3BDLHFCQUFxQixDQUFDLE9BQU8sRUFBRSxVQUFVLEVBQUUsQ0FBQyxFQUFFLGNBQWMsQ0FBQyxDQUFDO0tBQy9EO0lBRUQscUZBQXFGO0lBQ3JGLHFGQUFxRjtJQUNyRixnQ0FBZ0M7SUFDaEMsc0JBQXNCLDhCQUFrRDtRQUNwRSx5QkFBeUIsR0FBRyx5QkFBeUIsQ0FBQyxNQUFNLENBQUM7SUFDakUsc0JBQXNCLDZCQUFpRDtRQUNuRSx5QkFBeUIsR0FBRyx5QkFBeUIsQ0FBQyxNQUFNLENBQUM7SUFFakUsdUVBQXVFO0lBQ3ZFLG9CQUFvQiw4QkFBZ0Q7UUFDaEUseUJBQXlCLENBQUMsTUFBTSxDQUFDO0lBQ3JDLG9CQUFvQiw4QkFBZ0Q7UUFDaEUseUJBQXlCLENBQUMsTUFBTSxDQUFDO0lBQ3JDLElBQU0sNEJBQTRCLEdBQUcseUJBQXlCLENBQUMsTUFBTSxlQUFvQixDQUFDO0lBQzFGLElBQU0sNkJBQTZCLEdBQUcseUJBQXlCLENBQUMsTUFBTSxlQUFvQixDQUFDO0lBRTNGLDBGQUEwRjtJQUMxRixJQUFNLDhCQUE4QixHQUNoQyxxQkFBcUIsR0FBRyx5QkFBeUIsZUFBb0IsQ0FBQztJQUMxRSxJQUFNLG1CQUFtQixHQUFHLG9CQUFvQixDQUFDLE1BQU0sQ0FBQztJQUN4RCxxQkFBcUIsQ0FDakIsT0FBTyxFQUFFLGNBQWMsRUFBRSxLQUFLLEVBQUUsOEJBQThCLEVBQzlELHlCQUF5QixDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBRXRDLEtBQUssSUFBSSxHQUFDLDhCQUFnRCxFQUFFLEdBQUMsR0FBRyxtQkFBbUIsRUFDOUUsR0FBQyxnQkFBa0MsRUFBRTtRQUN4QywwRkFBMEY7UUFDMUYsK0VBQStFO1FBQy9FLG9CQUFvQixDQUFDLEdBQUMsOEJBQWdELENBQUM7WUFDbkUsNkJBQTZCLEdBQUcsNEJBQTRCLENBQUM7S0FDbEU7SUFFRCwyRkFBMkY7SUFDM0YsSUFBTSwrQkFBK0IsR0FDakMsc0JBQXNCLEdBQUcseUJBQXlCLGVBQW9CLENBQUM7SUFDM0UsSUFBTSxtQkFBbUIsR0FBRyxvQkFBb0IsQ0FBQyxNQUFNLENBQUM7SUFDeEQscUJBQXFCLENBQ2pCLE9BQU8sRUFBRSxjQUFjLEVBQUUsSUFBSSxFQUFFLCtCQUErQixFQUM5RCx5QkFBeUIsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUV0QyxLQUFLLElBQUksR0FBQyw4QkFBZ0QsRUFBRSxHQUFDLEdBQUcsbUJBQW1CLEVBQzlFLEdBQUMsZ0JBQWtDLEVBQUU7UUFDeEMseUZBQXlGO1FBQ3pGLG9GQUFvRjtRQUNwRixxRkFBcUY7UUFDckYsc0ZBQXNGO1FBQ3RGLDBGQUEwRjtRQUMxRixpQkFBaUI7UUFDakIsb0JBQW9CLENBQUMsR0FBQyw4QkFBZ0QsQ0FBQztZQUNuRSxDQUFDLDRCQUE0QixHQUFHLENBQUMsQ0FBQyxHQUFHLDZCQUE2QixDQUFDO0tBQ3hFO0lBRUQsdUVBQXVFO0lBQ3ZFLG1DQUFtQztJQUNuQyxJQUFNLFVBQVUsR0FBRyxRQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxxQkFBcUIsQ0FBQyxDQUFDO0lBQ3pELE9BQU8sQ0FBQyxPQUFPLDhCQUFtQyxVQUFVLENBQUMsQ0FBQztBQUNoRSxDQUFDO0FBRUQ7O0dBRUc7QUFDSCxNQUFNLFVBQVUsZ0NBQWdDLENBQzVDLE9BQXVCLEVBQUUsWUFBaUIsRUFBRSxjQUF1QztJQUNyRixJQUFNLGFBQWEsR0FBRyxPQUFPLG1DQUF3QyxDQUFDO0lBQ3RFLElBQU0sd0JBQXdCLEdBQUcsT0FBTyxtQ0FBd0MsQ0FBQyxNQUFNLENBQUM7SUFFeEYsSUFBSSxjQUFzQixDQUFDO0lBQzNCLElBQUksYUFBYSxHQUFHLGlDQUFpQyxDQUFDLGFBQWEsRUFBRSxZQUFZLENBQUMsQ0FBQztJQUVuRixJQUFJLGFBQWEsS0FBSyxDQUFDLENBQUMsRUFBRTtRQUN4QixhQUFhLEdBQUcsYUFBYSxDQUFDLE1BQU0sQ0FBQztRQUNyQyxjQUFjLEdBQUcsYUFBYSxDQUFDLE1BQU0sZUFBb0MsQ0FBQztRQUUxRSw0QkFBNEIsQ0FBQyxPQUFPLEVBQUUsWUFBWSxDQUFDLENBQUM7UUFDcEQsYUFBYSxDQUFDLGFBQWEsc0NBQTJELENBQUM7WUFDbkYsd0JBQXdCLENBQUM7UUFDN0IsYUFBYSxDQUFDLGFBQWEsK0JBQW9ELENBQUM7WUFDNUUsY0FBYyxJQUFJLElBQUksQ0FBQztLQUM1QjtTQUFNO1FBQ0wsSUFBTSx1QkFBdUIsR0FDekIsYUFBYSxzQ0FBMkQsQ0FBQztRQUM3RSxJQUFJLGFBQWEsQ0FBQyx1QkFBdUIsQ0FBRyxJQUFJLENBQUMsRUFBRTtZQUNqRCwwREFBMEQ7WUFDMUQsT0FBTyxDQUFDLENBQUMsQ0FBQztTQUNYO1FBRUQsY0FBYyxHQUFHLGFBQWEsZUFBb0MsQ0FBQztRQUVuRSw4RkFBOEY7UUFDOUYsOEZBQThGO1FBQzlGLHNGQUFzRjtRQUN0RixJQUFNLHVCQUF1QixHQUN6QixhQUFhLHNDQUEyRCxDQUFDO1FBQzdFLGFBQWEsQ0FBQyx1QkFBdUIsQ0FBQyxHQUFHLHdCQUF3QixDQUFDO1FBRWxFLHdGQUF3RjtRQUN4RixXQUFXO1FBQ1gsSUFBTSxtQkFBbUIsR0FBRyxhQUFhLCtCQUFvRCxDQUFDO1FBQzlGLGFBQWEsQ0FBQyxtQkFBbUIsQ0FBQyxHQUFHLGNBQWMsSUFBSSxJQUFJLENBQUM7S0FDN0Q7SUFFRCxPQUFPLGNBQWMsQ0FBQztBQUN4QixDQUFDO0FBRUQsU0FBUyx1QkFBdUIsQ0FDNUIsT0FBdUIsRUFBRSxXQUFtQixFQUFFLEtBQWEsRUFBRSxHQUFXO0lBQzFFLEtBQUssSUFBSSxDQUFDLEdBQUcsS0FBSyxFQUFFLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FBQyxnQkFBcUIsRUFBRTtRQUNuRCxJQUFJLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLEtBQUssV0FBVztZQUFFLE9BQU8sQ0FBQyxDQUFDO0tBQ25EO0lBQ0QsT0FBTyxDQUFDLENBQUMsQ0FBQztBQUNaLENBQUM7QUFFRDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBMkJHO0FBQ0gsTUFBTSxVQUFVLGdCQUFnQixDQUM1QixPQUF1QixFQUFFLFlBQ3FDLEVBQzlELFdBQXdGLEVBQ3hGLFlBQWtCO0lBQ3BCLElBQU0sY0FBYyxHQUFHLDZCQUE2QixDQUFDLE9BQU8sRUFBRSxZQUFZLElBQUksSUFBSSxDQUFDLENBQUM7SUFFcEYsWUFBWSxHQUFHLFlBQVksSUFBSSxJQUFJLENBQUM7SUFDcEMsV0FBVyxHQUFHLFdBQVcsSUFBSSxJQUFJLENBQUM7SUFDbEMsSUFBTSxxQkFBcUIsR0FBRyxvQkFBb0IsQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLGNBQWMsRUFBRSxZQUFZLENBQUMsQ0FBQztJQUNoRyxJQUFNLHFCQUFxQixHQUFHLG9CQUFvQixDQUFDLE9BQU8sRUFBRSxLQUFLLEVBQUUsY0FBYyxFQUFFLFdBQVcsQ0FBQyxDQUFDO0lBRWhHLGdGQUFnRjtJQUNoRixJQUFJLHFCQUFxQixJQUFJLHFCQUFxQjtRQUFFLE9BQU87SUFFM0QsWUFBWTtRQUNSLFlBQVksS0FBSyxTQUFTLENBQUMsQ0FBQyxDQUFDLGtCQUFrQixDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsY0FBYyxDQUFDLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQztJQUNsRyxXQUFXO1FBQ1AsV0FBVyxLQUFLLFNBQVMsQ0FBQyxDQUFDLENBQUMsa0JBQWtCLENBQUMsT0FBTyxFQUFFLEtBQUssRUFBRSxjQUFjLENBQUMsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDO0lBRWpHLElBQU0sT0FBTyxHQUFHLE9BQU8seUJBQThDLENBQUM7SUFDdEUsSUFBTSxvQkFBb0IsR0FBRyxZQUFZLFlBQVksa0JBQWtCLENBQUMsQ0FBQztRQUNyRSxJQUFJLDBCQUEwQixDQUFDLFlBQW1CLEVBQUUsT0FBTyxnQkFBb0IsQ0FBQyxDQUFDO1FBQ2pGLElBQUksQ0FBQztJQUNULElBQU0sbUJBQW1CLEdBQUcsV0FBVyxZQUFZLGtCQUFrQixDQUFDLENBQUM7UUFDbkUsSUFBSSwwQkFBMEIsQ0FBQyxXQUFrQixFQUFFLE9BQU8sZ0JBQW9CLENBQUMsQ0FBQztRQUNoRixJQUFJLENBQUM7SUFFVCxJQUFNLFlBQVksR0FBRyxvQkFBb0IsQ0FBQyxDQUFDO1FBQ3RDLFlBQWtFLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDM0UsWUFBWSxDQUFDO0lBQ2pCLElBQU0sV0FBVyxHQUFHLG1CQUFtQixDQUFDLENBQUMsQ0FBQyxXQUFhLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQztJQUUvRSxJQUFJLFVBQVUsR0FBYSxXQUFXLENBQUM7SUFDdkMsSUFBSSxlQUFlLEdBQUcsS0FBSyxDQUFDO0lBQzVCLElBQUksc0JBQXNCLEdBQUcsS0FBSyxDQUFDO0lBRW5DLElBQU0seUJBQXlCLEdBQzNCLG9CQUFvQixDQUFDLENBQUMsdUNBQTJDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDekUsSUFBSSx1QkFBdUIsQ0FDbkIsT0FBTyxFQUFFLG9CQUFvQix3Q0FBNEMsRUFBRTtRQUNqRixnQkFBZ0IsQ0FBQyxPQUFPLEVBQUUsb0JBQW9CLHdDQUE0QyxDQUFDO1FBQzNGLHNCQUFzQixHQUFHLElBQUksQ0FBQztLQUMvQjtJQUVELElBQU0sd0JBQXdCLEdBQzFCLG1CQUFtQixDQUFDLENBQUMsdUNBQTJDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDeEUsSUFBSSx1QkFBdUIsQ0FDbkIsT0FBTyxFQUFFLG1CQUFtQix3Q0FBNEMsRUFBRTtRQUNoRixnQkFBZ0IsQ0FBQyxPQUFPLEVBQUUsbUJBQW1CLHdDQUE0QyxDQUFDO1FBQzFGLHNCQUFzQixHQUFHLElBQUksQ0FBQztLQUMvQjtJQUVELDBFQUEwRTtJQUMxRSwyQkFBMkI7SUFDM0IsSUFBSSxDQUFDLHFCQUFxQixFQUFFO1FBQzFCLElBQUksT0FBTyxZQUFZLElBQUksUUFBUSxFQUFFO1lBQ25DLFVBQVUsR0FBRyxZQUFZLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3ZDLGtGQUFrRjtZQUNsRixvRUFBb0U7WUFDcEUsZUFBZSxHQUFHLElBQUksQ0FBQztTQUN4QjthQUFNO1lBQ0wsVUFBVSxHQUFHLFlBQVksQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDO1NBQ3JFO0tBQ0Y7SUFFRCxJQUFNLHFCQUFxQixHQUFHLHdCQUF3QixDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQ2hFLElBQUksc0JBQXNCLEdBQUcseUJBQXlCLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDaEUsSUFBSSxvQkFBb0IsR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDO0lBRTFDLElBQUksQ0FBQyxxQkFBcUIsRUFBRTtRQUMxQixJQUFNLFVBQVUsR0FBRyxXQUFXLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQztRQUN4RSxJQUFNLE1BQU0sR0FBRyxXQUFXLElBQUksU0FBUyxDQUFDO1FBQ3hDLElBQU0sZUFBZSxHQUFHLDBCQUEwQixDQUM5QyxPQUFPLEVBQUUsY0FBYyxFQUFFLHdCQUF3QixFQUFFLHFCQUFxQixFQUN4RSxzQkFBc0IsRUFBRSxVQUFVLEVBQUUsTUFBTSxFQUFFLFdBQVcsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUNwRSxJQUFJLGVBQWUsRUFBRTtZQUNuQixzQkFBc0IsSUFBSSxlQUFlLGVBQW9CLENBQUM7WUFDOUQsb0JBQW9CLElBQUksZUFBZSxlQUFvQixDQUFDO1NBQzdEO0tBQ0Y7SUFFRCxJQUFJLENBQUMscUJBQXFCLEVBQUU7UUFDMUIsSUFBTSxPQUFPLEdBQUcsQ0FBQyxZQUFZLElBQUksU0FBUyxDQUF3QixDQUFDO1FBQ25FLDBCQUEwQixDQUN0QixPQUFPLEVBQUUsY0FBYyxFQUFFLHlCQUF5QixFQUFFLHNCQUFzQixFQUMxRSxvQkFBb0IsRUFBRSxVQUFVLEVBQUUsZUFBZSxJQUFJLE9BQU8sRUFBRSxZQUFZLEVBQUUsSUFBSSxDQUFDLENBQUM7S0FDdkY7SUFFRCxJQUFJLHNCQUFzQixFQUFFO1FBQzFCLHNCQUFzQixDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQztLQUN2QztBQUNILENBQUM7QUFFRDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0F5Q0c7QUFDSCxTQUFTLDBCQUEwQixDQUMvQixPQUF1QixFQUFFLGNBQXNCLEVBQUUsa0JBQTBCLEVBQUUsUUFBZ0IsRUFDN0YsTUFBYyxFQUFFLEtBQXdCLEVBQUUsTUFBbUMsRUFBRSxVQUFlLEVBQzlGLGlCQUEwQjtJQUM1QixJQUFJLEtBQUssR0FBRyxLQUFLLENBQUM7SUFFbEIsSUFBTSxVQUFVLEdBQUc7UUFDZixjQUFjLGVBQWlDLENBQUM7SUFFcEQsc0ZBQXNGO0lBQ3RGLGlEQUFpRDtJQUNqRCxJQUFNLFlBQVksR0FDZCxPQUFPLENBQUMsaUJBQWlCLENBQUMsQ0FBQyw0QkFBaUMsQ0FBQywwQkFBK0IsQ0FBQyxDQUFDO0lBRWxHLGtGQUFrRjtJQUNsRixrRkFBa0Y7SUFDbEYsSUFBTSx5QkFBeUIsR0FDM0IsWUFBWSxDQUFDLFVBQVUsOEJBQWdELENBQUMsQ0FBQztJQUU3RSxJQUFNLG1CQUFtQixHQUFHLFlBQVksQ0FBQyxVQUFVLHNCQUF3QyxDQUFDLENBQUM7SUFDN0YsSUFBTSx3QkFBd0IsR0FDMUIsWUFBWSxDQUFDLFVBQVUsMkJBQTZDLENBQUMsQ0FBQztJQUMxRSxJQUFNLDBCQUEwQixHQUM1QixZQUFZLENBQUMsVUFBVSwwQkFBNEMsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUUvRSx5RkFBeUY7SUFDekYsMEZBQTBGO0lBQzFGLHVGQUF1RjtJQUN2RixzRkFBc0Y7SUFDdEYsdUZBQXVGO0lBQ3ZGLDBGQUEwRjtJQUMxRix1RkFBdUY7SUFDdkYsd0ZBQXdGO0lBQ3hGLGtEQUFrRDtJQUNsRCxJQUFJLHNCQUFzQixHQUN0QiwwQkFBMEIsSUFBSSxDQUFDLENBQUMsQ0FBQyxtQkFBbUIsSUFBSSxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUV4RixJQUFJLGlCQUFpQixHQUFHLENBQUMsQ0FBQztJQUMxQixJQUFJLHNCQUFzQixHQUFHLENBQUMsQ0FBQztJQUUvQix5RUFBeUU7SUFDekUsNEVBQTRFO0lBQzVFLG1EQUFtRDtJQUNuRCxJQUFNLGFBQWEsR0FBRyxNQUFNLEtBQUssSUFBSSxDQUFDO0lBRXRDLFVBQVU7SUFDViwyRkFBMkY7SUFDM0YsK0ZBQStGO0lBQy9GLElBQUksUUFBUSxHQUFHLFFBQVEsQ0FBQztJQUN4QixJQUFJLHdCQUF3QixHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUM7SUFDNUMsT0FBTyxRQUFRLEdBQUcseUJBQXlCLEVBQUU7UUFDM0MsSUFBTSxXQUFXLEdBQUcsT0FBTyxDQUFDLE9BQU8sRUFBRSxRQUFRLENBQUMsQ0FBQztRQUMvQyxJQUFJLHdCQUF3QixFQUFFO1lBQzVCLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO2dCQUNyQyxJQUFNLE9BQU8sR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3pCLElBQU0sY0FBYyxHQUFHLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO2dCQUMzRixJQUFJLGNBQWMsSUFBSSxXQUFXLEtBQUssY0FBYyxFQUFFO29CQUNwRCxJQUFNLFlBQVksR0FBRyxRQUFRLENBQUMsT0FBTyxFQUFFLFFBQVEsQ0FBQyxDQUFDO29CQUNqRCxJQUFNLHFCQUFxQixHQUFHLDBCQUEwQixDQUFDLE9BQU8sRUFBRSxRQUFRLENBQUMsQ0FBQztvQkFDNUUsSUFBTSxLQUFLLEdBQUcsYUFBYSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFFLE1BQThCLENBQUMsY0FBYyxDQUFDLENBQUM7b0JBQ3JGLElBQU0sV0FBVyxHQUFHLFdBQVcsQ0FBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLENBQUM7b0JBQ25ELElBQUksZUFBZSxDQUFDLFdBQVcsRUFBRSxZQUFZLEVBQUUsS0FBSyxDQUFDO3dCQUNqRCxnQkFBZ0IsQ0FBQyxZQUFZLEVBQUUsS0FBSyxFQUFFLHFCQUFxQixFQUFFLGNBQWMsQ0FBQyxFQUFFO3dCQUNoRixRQUFRLENBQUMsT0FBTyxFQUFFLFFBQVEsRUFBRSxLQUFLLENBQUMsQ0FBQzt3QkFDbkMscUJBQXFCLENBQUMsT0FBTyxFQUFFLFFBQVEsRUFBRSxrQkFBa0IsRUFBRSxjQUFjLENBQUMsQ0FBQzt3QkFDN0UsSUFBSSxzQkFBc0IsQ0FBQyxPQUFPLEVBQUUsV0FBVyxFQUFFLEtBQUssQ0FBQyxFQUFFOzRCQUN2RCxRQUFRLENBQUMsT0FBTyxFQUFFLFFBQVEsRUFBRSxJQUFJLENBQUMsQ0FBQzs0QkFDbEMsS0FBSyxHQUFHLElBQUksQ0FBQzt5QkFDZDtxQkFDRjtvQkFDRCxLQUFLLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDO29CQUNoQix3QkFBd0IsRUFBRSxDQUFDO29CQUMzQixNQUFNO2lCQUNQO2FBQ0Y7U0FDRjtRQUNELFFBQVEsZ0JBQXFCLENBQUM7S0FDL0I7SUFFRCxVQUFVO0lBQ1Ysc0VBQXNFO0lBQ3RFLElBQUksd0JBQXdCLEVBQUU7UUFDNUIsSUFBTSxTQUFTLEdBQUcsaUJBQWlCLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsaUJBQWlCLENBQUMsT0FBTyxFQUFFLGNBQWMsQ0FBQyxDQUFDO1FBQ3hGLGNBQWMsRUFBRSxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtZQUNyRCxJQUFNLE9BQU8sR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFekIsSUFBSSxDQUFDLE9BQU8sRUFBRTtnQkFDWiw2RUFBNkU7Z0JBQzdFLHdFQUF3RTtnQkFDeEUsU0FBUzthQUNWO1lBRUQsSUFBTSxLQUFLLEdBQUcsYUFBYSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFFLE1BQThCLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDOUUsSUFBTSxjQUFjLEdBQUcsaUJBQWlCLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ3hFLElBQU0scUJBQXFCLEdBQUcsUUFBUSxJQUFJLHlCQUF5QixDQUFDO1lBRXBFLEtBQUssSUFBSSxDQUFDLEdBQUcsUUFBUSxFQUFFLENBQUMsR0FBRyxNQUFNLEVBQUUsQ0FBQyxnQkFBcUIsRUFBRTtnQkFDekQsSUFBTSxjQUFjLEdBQUcsT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDM0MsSUFBSSxjQUFjLEtBQUssY0FBYyxFQUFFO29CQUNyQyxJQUFNLHdCQUF3QixHQUFHLDBCQUEwQixDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQztvQkFDeEUsSUFBTSw0QkFBNEIsR0FBRyxxQkFBcUIsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQUM7b0JBQ3ZFLElBQU0sZUFBZSxHQUFHLFFBQVEsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQUM7b0JBQzdDLElBQU0sY0FBYyxHQUFHLFdBQVcsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQUM7b0JBRS9DLElBQUksZ0JBQWdCLENBQUMsZUFBZSxFQUFFLEtBQUssRUFBRSx3QkFBd0IsRUFBRSxjQUFjLENBQUMsRUFBRTt3QkFDdEYsb0VBQW9FO3dCQUNwRSxvRUFBb0U7d0JBQ3BFLGlDQUFpQzt3QkFDakMsSUFBSSxxQkFBcUIsRUFBRTs0QkFDekIsdUJBQXVCLENBQUMsT0FBTyxFQUFFLFFBQVEsRUFBRSxDQUFDLENBQUMsQ0FBQzs0QkFDOUMsaUJBQWlCLEVBQUUsQ0FBQzt5QkFDckI7d0JBRUQsSUFBSSxlQUFlLENBQUMsY0FBYyxFQUFFLGVBQWUsRUFBRSxLQUFLLENBQUMsRUFBRTs0QkFDM0QsSUFBSSxLQUFLLEtBQUssSUFBSSxJQUFJLEtBQUssS0FBSyxTQUFTLElBQUksS0FBSyxLQUFLLGVBQWUsRUFBRTtnQ0FDdEUsc0JBQXNCLEdBQUcsSUFBSSxDQUFDOzZCQUMvQjs0QkFFRCxRQUFRLENBQUMsT0FBTyxFQUFFLFFBQVEsRUFBRSxLQUFLLENBQUMsQ0FBQzs0QkFFbkMsd0JBQXdCOzRCQUN4QixzRUFBc0U7NEJBQ3RFLHVFQUF1RTs0QkFDdkUsMkVBQTJFOzRCQUMzRSxzRUFBc0U7NEJBQ3RFLG9EQUFvRDs0QkFDcEQsSUFBSSxlQUFlLEtBQUssSUFBSTtnQ0FDeEIsc0JBQXNCLENBQUMsT0FBTyxFQUFFLGNBQWMsRUFBRSxLQUFLLENBQUMsRUFBRTtnQ0FDMUQsUUFBUSxDQUFDLE9BQU8sRUFBRSxRQUFRLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0NBQ2xDLEtBQUssR0FBRyxJQUFJLENBQUM7NkJBQ2Q7eUJBQ0Y7d0JBRUQsSUFBSSx3QkFBd0IsS0FBSyxjQUFjOzRCQUMzQyxrQkFBa0IsS0FBSyw0QkFBNEIsRUFBRTs0QkFDdkQscUJBQXFCLENBQUMsT0FBTyxFQUFFLFFBQVEsRUFBRSxrQkFBa0IsRUFBRSxjQUFjLENBQUMsQ0FBQzt5QkFDOUU7cUJBQ0Y7b0JBRUQsUUFBUSxnQkFBcUIsQ0FBQztvQkFDOUIsU0FBUyxjQUFjLENBQUM7aUJBQ3pCO2FBQ0Y7WUFFRCwwREFBMEQ7WUFDMUQsSUFBSSxLQUFLLElBQUksSUFBSSxFQUFFO2dCQUNqQixzQkFBc0IsR0FBRyxJQUFJLENBQUM7Z0JBQzlCLGlCQUFpQixFQUFFLENBQUM7Z0JBQ3BCLElBQU0sSUFBSSxHQUFHLGtCQUFrQixDQUFDLE9BQU8sRUFBRSxjQUFjLEVBQUUsaUJBQWlCLEVBQUUsU0FBUyxDQUFDO2lDQUNoRSxDQUFDO2dCQUV2QixJQUFNLGNBQWMsR0FBRyxxQkFBcUIsQ0FBQyxDQUFDO29CQUMxQyxRQUFRLENBQUMsQ0FBQztvQkFDVixDQUFDLHlCQUF5QixHQUFHLHNCQUFzQixlQUFvQixDQUFDLENBQUM7Z0JBQzdFLHNCQUFzQixDQUNsQixPQUFPLEVBQUUsY0FBYyxFQUFFLGlCQUFpQixFQUFFLGNBQWMsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLGNBQWMsRUFDdkYsa0JBQWtCLENBQUMsQ0FBQztnQkFFeEIsc0JBQXNCLEVBQUUsQ0FBQztnQkFDekIsTUFBTSxnQkFBcUIsQ0FBQztnQkFDNUIsUUFBUSxnQkFBcUIsQ0FBQztnQkFFOUIsS0FBSyxHQUFHLElBQUksQ0FBQzthQUNkO1NBQ0Y7S0FDRjtJQUVELFVBQVU7SUFDVixrRkFBa0Y7SUFDbEYsMEVBQTBFO0lBQzFFLE9BQU8sUUFBUSxHQUFHLE1BQU0sRUFBRTtRQUN4QixzQkFBc0IsR0FBRyxJQUFJLENBQUMsQ0FBRSwwQkFBMEI7UUFDMUQsSUFBTSxRQUFRLEdBQUcsUUFBUSxDQUFDLE9BQU8sRUFBRSxRQUFRLENBQUMsQ0FBQztRQUM3QyxJQUFNLE9BQU8sR0FBRyxXQUFXLENBQUMsT0FBTyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBQy9DLElBQU0sWUFBWSxHQUFHLDBCQUEwQixDQUFDLE9BQU8sRUFBRSxRQUFRLENBQUMsQ0FBQztRQUNuRSxJQUFJLFFBQVEsSUFBSSxJQUFJLEVBQUU7WUFDcEIsc0JBQXNCLEdBQUcsSUFBSSxDQUFDO1NBQy9CO1FBQ0QsSUFBSSxlQUFlLENBQUMsT0FBTyxFQUFFLFFBQVEsRUFBRSxJQUFJLENBQUMsRUFBRTtZQUM1QyxRQUFRLENBQUMsT0FBTyxFQUFFLFFBQVEsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUNsQywwQ0FBMEM7WUFDMUMsSUFBSSxzQkFBc0IsQ0FBQyxPQUFPLEVBQUUsT0FBTyxFQUFFLFFBQVEsQ0FBQyxFQUFFO2dCQUN0RCxRQUFRLENBQUMsT0FBTyxFQUFFLFFBQVEsRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFDbEMsS0FBSyxHQUFHLElBQUksQ0FBQzthQUNkO1lBQ0QscUJBQXFCLENBQUMsT0FBTyxFQUFFLFFBQVEsRUFBRSxrQkFBa0IsRUFBRSxjQUFjLENBQUMsQ0FBQztTQUM5RTtRQUNELFFBQVEsZ0JBQXFCLENBQUM7S0FDL0I7SUFFRCw4RkFBOEY7SUFDOUYsaUdBQWlHO0lBQ2pHLGtHQUFrRztJQUNsRyw2RkFBNkY7SUFDN0YsaUdBQWlHO0lBQ2pHLDRDQUE0QztJQUM1QyxzQkFBc0IsR0FBRyxzQkFBc0IsSUFBSSx3QkFBd0IsS0FBSyxpQkFBaUIsQ0FBQztJQUNsRyxvQkFBb0IsQ0FDaEIsT0FBTyxFQUFFLGNBQWMsRUFBRSxpQkFBaUIsRUFBRSxVQUFVLEVBQUUseUJBQXlCLEVBQUUsTUFBTSxFQUN6RixpQkFBaUIsRUFBRSxzQkFBc0IsQ0FBQyxDQUFDO0lBRS9DLElBQUksS0FBSyxFQUFFO1FBQ1QsZUFBZSxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQztRQUMvQixpQkFBaUIsQ0FBQyxPQUFPLEVBQUUsY0FBYyxFQUFFLElBQUksQ0FBQyxDQUFDO0tBQ2xEO0lBRUQsT0FBTyxzQkFBc0IsQ0FBQztBQUNoQyxDQUFDO0FBRUQ7Ozs7Ozs7Ozs7Ozs7O0dBY0c7QUFDSCxNQUFNLFVBQVUsZUFBZSxDQUMzQixPQUF1QixFQUFFLE1BQWMsRUFDdkMsS0FBdUQsRUFBRSxZQUFrQixFQUMzRSxhQUF1QjtJQUN6Qix3QkFBd0IsQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsWUFBWSxFQUFFLGFBQWEsQ0FBQyxDQUFDO0FBQ3RGLENBQUM7QUFFRDs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQW1CRztBQUNILE1BQU0sVUFBVSxlQUFlLENBQzNCLE9BQXVCLEVBQUUsTUFBYyxFQUN2QyxLQUF3RSxFQUFFLFlBQWtCLEVBQzVGLGFBQXVCO0lBQ3pCLHdCQUF3QixDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxZQUFZLEVBQUUsYUFBYSxDQUFDLENBQUM7QUFDdkYsQ0FBQztBQUVELFNBQVMsd0JBQXdCLENBQzdCLE9BQXVCLEVBQUUsTUFBYyxFQUN2QyxLQUF3RSxFQUFFLFlBQXFCLEVBQy9GLFlBQWlCLEVBQUUsYUFBdUI7SUFDNUMsSUFBTSxjQUFjLEdBQUcsNkJBQTZCLENBQUMsT0FBTyxFQUFFLFlBQVksSUFBSSxJQUFJLENBQUMsQ0FBQztJQUNwRixJQUFNLFdBQVcsR0FBRyx1QkFBdUIsQ0FBQyxPQUFPLEVBQUUsY0FBYyxFQUFFLE1BQU0sRUFBRSxZQUFZLENBQUMsQ0FBQztJQUMzRixJQUFNLFNBQVMsR0FBRyxRQUFRLENBQUMsT0FBTyxFQUFFLFdBQVcsQ0FBQyxDQUFDO0lBQ2pELElBQU0sUUFBUSxHQUFHLFdBQVcsQ0FBQyxPQUFPLEVBQUUsV0FBVyxDQUFDLENBQUM7SUFDbkQsSUFBTSxhQUFhLEdBQUcsMEJBQTBCLENBQUMsT0FBTyxFQUFFLFdBQVcsQ0FBQyxDQUFDO0lBQ3ZFLElBQU0sS0FBSyxHQUF3QixDQUFDLEtBQUssWUFBWSxrQkFBa0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUM7SUFFL0YsSUFBSSxlQUFlLENBQUMsUUFBUSxFQUFFLFNBQVMsRUFBRSxLQUFLLENBQUM7UUFDM0MsQ0FBQyxhQUFhLElBQUksZ0JBQWdCLENBQUMsU0FBUyxFQUFFLEtBQUssRUFBRSxhQUFhLEVBQUUsY0FBYyxDQUFDLENBQUMsRUFBRTtRQUN4RixJQUFNLGNBQVksR0FBRyxDQUFDLFFBQVEsZ0JBQXFCLENBQUMsa0JBQXVCLENBQUM7UUFDNUUsSUFBTSxPQUFPLEdBQUcsT0FBTyx5QkFBOEMsQ0FBQztRQUN0RSxJQUFNLGFBQWEsR0FBRyxLQUFLLFlBQVksa0JBQWtCLENBQUMsQ0FBQztZQUN2RCxJQUFJLDBCQUEwQixDQUMxQixLQUFZLEVBQUUsT0FBTyxFQUFFLGNBQVksQ0FBQyxDQUFDLGVBQW1CLENBQUMsY0FBa0IsQ0FBQyxDQUFDLENBQUM7WUFDbEYsSUFBSSxDQUFDO1FBQ1QsSUFBTSxPQUFLLEdBQUcsQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFFLEtBQWlDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQzdELENBQUM7UUFDbkIsSUFBTSxlQUFlLEdBQUcscUJBQXFCLENBQUMsT0FBTyxFQUFFLFdBQVcsQ0FBQyxDQUFDO1FBRXBFLElBQUksc0JBQXNCLEdBQUcsS0FBSyxDQUFDO1FBQ25DLElBQUksa0JBQWtCLEdBQUcsYUFBYSxDQUFDLENBQUMsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUM3RCxJQUFJLHVCQUF1QixDQUFDLE9BQU8sRUFBRSxhQUFhLEVBQUUsZUFBZSxDQUFDLEVBQUU7WUFDcEUsSUFBTSxRQUFRLEdBQUcsZ0JBQWdCLENBQUMsT0FBTyxFQUFFLGFBQWEsRUFBRSxlQUFlLENBQUMsQ0FBQztZQUMzRSxrQkFBa0IsR0FBRyxhQUFhLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2xELHNCQUFzQixHQUFHLElBQUksQ0FBQztTQUMvQjtRQUVELElBQUksc0JBQXNCLElBQUksYUFBYSxLQUFLLGNBQWMsRUFBRTtZQUM5RCxxQkFBcUIsQ0FBQyxPQUFPLEVBQUUsV0FBVyxFQUFFLGtCQUFrQixFQUFFLGNBQWMsQ0FBQyxDQUFDO1NBQ2pGO1FBRUQsSUFBSSxhQUFhLEtBQUssY0FBYyxFQUFFO1lBQ3BDLElBQU0sSUFBSSxHQUFHLE9BQU8sQ0FBQyxPQUFPLEVBQUUsV0FBVyxDQUFDLENBQUM7WUFDM0MsSUFBTSxTQUFTLEdBQUcsaUJBQWlCLENBQUMsT0FBTyxFQUFFLGNBQWMsQ0FBQyxDQUFDO1lBQzdELGVBQWUsQ0FBQyxPQUFPLEVBQUUsV0FBVyxFQUFFLENBQUMsU0FBUyxJQUFJLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDO1NBQ3RGO1FBRUQsd0VBQXdFO1FBQ3hFLFFBQVEsQ0FBQyxPQUFPLEVBQUUsV0FBVyxFQUFFLE9BQUssQ0FBQyxDQUFDO1FBQ3RDLElBQU0sYUFBYSxHQUFHLHFCQUFxQixDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBRXRELG9GQUFvRjtRQUNwRixJQUFNLGFBQWEsR0FBRyxRQUFRLENBQUMsT0FBTyxFQUFFLGFBQWEsQ0FBQyxDQUFDO1FBQ3ZELElBQUksQ0FBQyxhQUFhLElBQUksZUFBZSxDQUFDLFFBQVEsRUFBRSxhQUFhLEVBQUUsT0FBSyxDQUFDLEVBQUU7WUFDckUsSUFBSSxVQUFVLEdBQUcsS0FBSyxDQUFDO1lBQ3ZCLElBQUksV0FBVyxHQUFHLElBQUksQ0FBQztZQUV2QiwwRUFBMEU7WUFDMUUsSUFBSSxDQUFDLFdBQVcsQ0FBQyxPQUFLLEVBQUUsY0FBWSxDQUFDLElBQUksV0FBVyxDQUFDLGFBQWEsRUFBRSxjQUFZLENBQUMsRUFBRTtnQkFDakYsVUFBVSxHQUFHLElBQUksQ0FBQztnQkFDbEIsV0FBVyxHQUFHLEtBQUssQ0FBQzthQUNyQjtZQUVELFFBQVEsQ0FBQyxPQUFPLEVBQUUsYUFBYSxFQUFFLFVBQVUsQ0FBQyxDQUFDO1lBQzdDLFFBQVEsQ0FBQyxPQUFPLEVBQUUsV0FBVyxFQUFFLFdBQVcsQ0FBQyxDQUFDO1lBQzVDLGlCQUFpQixDQUFDLE9BQU8sRUFBRSxjQUFjLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDakQsZUFBZSxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQztTQUNoQztRQUVELElBQUksc0JBQXNCLEVBQUU7WUFDMUIsc0JBQXNCLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDO1NBQ3ZDO0tBQ0Y7QUFDSCxDQUFDO0FBR0Q7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQXFCRztBQUNILE1BQU0sVUFBVSxhQUFhLENBQ3pCLE9BQXVCLEVBQUUsUUFBbUIsRUFBRSxVQUErQixFQUM3RSxhQUFzQixFQUFFLFlBQWtDLEVBQUUsV0FBaUMsRUFDN0YsWUFBa0I7SUFDcEIsSUFBSSxrQkFBa0IsR0FBRyxDQUFDLENBQUM7SUFDM0IsSUFBTSxvQkFBb0IsR0FBRyw2QkFBNkIsQ0FBQyxPQUFPLEVBQUUsWUFBWSxJQUFJLElBQUksQ0FBQyxDQUFDO0lBRTFGLElBQUksY0FBYyxDQUFDLE9BQU8sQ0FBQyxJQUFJLGdCQUFnQixDQUFDLE9BQU8sRUFBRSxvQkFBb0IsQ0FBQyxFQUFFO1FBQzlFLElBQU0sbUJBQW1CLEdBQ3JCLE9BQU8sNEJBQWlDLDhCQUFtQyxDQUFDO1FBQ2hGLElBQU0sTUFBTSxHQUFHLE9BQU8seUJBQWdDLENBQUM7UUFDdkQsSUFBTSxlQUFlLEdBQUcsd0JBQXdCLENBQUMsT0FBTyxDQUFDLENBQUM7UUFFMUQsSUFBSSxVQUFVLEdBQUcsS0FBSyxDQUFDO1FBQ3ZCLEtBQUssSUFBSSxDQUFDLG9DQUF5QyxFQUFFLENBQUMsR0FBRyxPQUFPLENBQUMsTUFBTSxFQUNsRSxDQUFDLGdCQUFxQixFQUFFO1lBQzNCLHdFQUF3RTtZQUN4RSxJQUFJLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLEVBQUU7Z0JBQ3ZCLElBQU0sSUFBSSxHQUFHLFdBQVcsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQ3JDLElBQU0sY0FBYyxHQUFHLDBCQUEwQixDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDOUQsSUFBSSxvQkFBb0IsS0FBSyxjQUFjLEVBQUU7b0JBQzNDLFVBQVUsR0FBRyxJQUFJLENBQUM7b0JBQ2xCLFNBQVM7aUJBQ1Y7Z0JBRUQsSUFBTSxJQUFJLEdBQUcsT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDakMsSUFBTSxLQUFLLEdBQUcsUUFBUSxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDbkMsSUFBTSxjQUFjLEdBQ2hCLENBQUMsSUFBSSxtQkFBd0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxpQkFBaUIsQ0FBQyxPQUFPLEVBQUUsY0FBYyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztnQkFDdkYsSUFBTSxhQUFhLEdBQUcsZ0JBQWdCLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUNuRCxJQUFNLFlBQVksR0FBRyxJQUFJLGdCQUFxQixDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQztnQkFDOUQsSUFBTSxnQkFBZ0IsR0FBRyxDQUFDLEdBQUcsZUFBZSxDQUFDO2dCQUU3QyxJQUFJLFlBQVksR0FBd0IsS0FBSyxDQUFDO2dCQUU5Qyx1RUFBdUU7Z0JBQ3ZFLDREQUE0RDtnQkFDNUQsMkRBQTJEO2dCQUMzRCxJQUFJLGdCQUFnQixJQUFJLENBQUMsV0FBVyxDQUFDLFlBQVksRUFBRSxZQUFZLENBQUMsRUFBRTtvQkFDaEUseURBQXlEO29CQUN6RCxJQUFNLFVBQVUsR0FBRyxxQkFBcUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztvQkFDL0MsWUFBWSxHQUFHLFFBQVEsQ0FBQyxPQUFPLEVBQUUsVUFBVSxDQUFDLENBQUM7aUJBQzlDO2dCQUVELHlFQUF5RTtnQkFDekUscURBQXFEO2dCQUNyRCxnRUFBZ0U7Z0JBQ2hFLHNFQUFzRTtnQkFDdEUsd0VBQXdFO2dCQUN4RSw2RUFBNkU7Z0JBQzdFLCtFQUErRTtnQkFDL0UsK0VBQStFO2dCQUMvRSxJQUFJLENBQUMsV0FBVyxDQUFDLFlBQVksRUFBRSxZQUFZLENBQUMsRUFBRTtvQkFDNUMsWUFBWSxHQUFHLGVBQWUsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUM7aUJBQy9DO2dCQUVELDBFQUEwRTtnQkFDMUUsd0VBQXdFO2dCQUN4RSx5RUFBeUU7Z0JBQ3pFLHFCQUFxQjtnQkFDckIsSUFBTSxZQUFZLEdBQUcsYUFBYSxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztnQkFDekQsSUFBSSxZQUFZLEVBQUU7b0JBQ2hCLElBQUksWUFBWSxFQUFFO3dCQUNoQixRQUFRLENBQ0osTUFBTSxFQUFFLElBQUksRUFBRSxZQUFZLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsS0FBSyxFQUFFLFFBQVEsRUFBRSxZQUFZLEVBQUUsYUFBYSxDQUFDLENBQUM7cUJBQ3ZGO3lCQUFNO3dCQUNMLFFBQVEsQ0FDSixNQUFNLEVBQUUsSUFBSSxFQUFFLFlBQTZCLEVBQUUsUUFBUSxFQUFFLGNBQWMsRUFBRSxXQUFXLEVBQ2xGLGFBQWEsQ0FBQyxDQUFDO3FCQUNwQjtpQkFDRjtnQkFFRCxRQUFRLENBQUMsT0FBTyxFQUFFLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQzthQUM3QjtTQUNGO1FBRUQsSUFBSSxtQkFBbUIsRUFBRTtZQUN2QixJQUFNLFdBQVcsR0FDYixLQUFLLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxjQUFjLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQXlCLENBQUM7WUFDdkYsSUFBTSxhQUFhLEdBQUcsZ0JBQWdCLENBQUMsT0FBTyxDQUFHLENBQUM7WUFDbEQsSUFBTSxpQkFBaUIsR0FBRyxhQUFhLGdDQUFvQyxDQUFDO1lBQzVFLEtBQUssSUFBSSxDQUFDLHNDQUEwQyxFQUFFLENBQUMsR0FBRyxpQkFBaUIsRUFDdEUsQ0FBQyw0Q0FBZ0QsRUFBRTtnQkFDdEQsSUFBTSxPQUFPLEdBQUcsYUFBYSxDQUFDLENBQUMsQ0FBMEMsQ0FBQztnQkFDMUUsSUFBTSxvQkFBb0IsR0FBRyxDQUFDLCtCQUFtQyxDQUFDO2dCQUNsRSxJQUFNLFNBQVMsR0FBRyxhQUFhLENBQUMsb0JBQW9CLENBQWtCLENBQUM7Z0JBQ3ZFLElBQUksT0FBTyxFQUFFO29CQUNYLElBQU0sTUFBTSxHQUFHLE9BQU8sQ0FBQyxXQUFXLENBQUMsU0FBUyxFQUFFLGFBQWEsQ0FBQyxDQUFDO29CQUM3RCxJQUFJLE1BQU0sS0FBSyxTQUFTLEVBQUU7d0JBQ3hCLElBQUksTUFBTSxJQUFJLElBQUksRUFBRTs0QkFDbEIsSUFBTSxTQUFTLEdBQUcsaUJBQWlCLENBQy9CLGFBQWEsRUFBRSxXQUFXLEVBQUUsTUFBcUIsRUFBRSxNQUFNLEVBQUUsb0JBQW9CLENBQUMsQ0FBQzs0QkFDckYsU0FBUyxJQUFJLGtCQUFrQixFQUFFLENBQUM7eUJBQ25DO3dCQUNELElBQUksU0FBUyxFQUFFOzRCQUNiLFNBQVMsQ0FBQyxPQUFPLEVBQUUsQ0FBQzt5QkFDckI7cUJBQ0Y7aUJBQ0Y7cUJBQU0sSUFBSSxTQUFTLEVBQUU7b0JBQ3BCLG9GQUFvRjtvQkFDcEYsU0FBUztvQkFDVCxTQUFTLENBQUMsT0FBTyxFQUFFLENBQUM7aUJBQ3JCO2FBQ0Y7WUFDRCxzQkFBc0IsQ0FBQyxPQUFPLEVBQUUsS0FBSyxDQUFDLENBQUM7U0FDeEM7UUFFRCxpQkFBaUIsQ0FBQyxPQUFPLEVBQUUsb0JBQW9CLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDeEQsZUFBZSxDQUFDLE9BQU8sRUFBRSxVQUFVLENBQUMsQ0FBQztLQUN0QztJQUVELE9BQU8sa0JBQWtCLENBQUM7QUFDNUIsQ0FBQztBQUVEOzs7Ozs7Ozs7Ozs7O0dBYUc7QUFDSCxNQUFNLFVBQVUsUUFBUSxDQUNwQixNQUFXLEVBQUUsSUFBWSxFQUFFLEtBQW9CLEVBQUUsUUFBbUIsRUFDcEUsU0FBaUMsRUFBRSxLQUEyQixFQUM5RCxhQUFxRDtJQUN2RCxLQUFLLEdBQUcsU0FBUyxJQUFJLEtBQUssQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDO0lBQzVELElBQUksS0FBSyxJQUFJLGFBQWEsRUFBRTtRQUMxQixJQUFJLEtBQUssRUFBRTtZQUNULEtBQUssQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDO1NBQzdCO1FBQ0QsSUFBSSxhQUFhLEVBQUU7WUFDakIsYUFBYSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7U0FDckM7S0FDRjtTQUFNLElBQUksS0FBSyxFQUFFO1FBQ2hCLEtBQUssR0FBRyxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBRSxvRUFBb0U7UUFDL0Ysb0JBQW9CO1FBQ3BCLFNBQVMsSUFBSSxTQUFTLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztRQUMxQyxvQkFBb0IsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO1lBQzVCLFFBQVEsQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsbUJBQW1CLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztZQUN0RSxNQUFNLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7S0FDM0M7U0FBTTtRQUNMLFNBQVMsSUFBSSxTQUFTLENBQUMsbUJBQW1CLEVBQUUsQ0FBQztRQUM3QyxvQkFBb0IsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO1lBQzVCLFFBQVEsQ0FBQyxXQUFXLENBQUMsTUFBTSxFQUFFLElBQUksRUFBRSxtQkFBbUIsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO1lBQ2xFLE1BQU0sQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxDQUFDO0tBQ3ZDO0FBQ0gsQ0FBQztBQUVEOzs7Ozs7Ozs7Ozs7O0dBYUc7QUFDSCxTQUFTLFFBQVEsQ0FDYixNQUFXLEVBQUUsU0FBaUIsRUFBRSxHQUFZLEVBQUUsUUFBbUIsRUFBRSxLQUEyQixFQUM5RixhQUFxRDtJQUN2RCxJQUFJLEtBQUssSUFBSSxhQUFhLEVBQUU7UUFDMUIsSUFBSSxLQUFLLEVBQUU7WUFDVCxLQUFLLENBQUMsUUFBUSxDQUFDLFNBQVMsRUFBRSxHQUFHLENBQUMsQ0FBQztTQUNoQztRQUNELElBQUksYUFBYSxFQUFFO1lBQ2pCLGFBQWEsQ0FBQyxRQUFRLENBQUMsU0FBUyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1NBQ3hDO1FBQ0Qsc0VBQXNFO0tBQ3ZFO1NBQU0sSUFBSSxTQUFTLEtBQUssRUFBRSxFQUFFO1FBQzNCLElBQUksR0FBRyxFQUFFO1lBQ1AsU0FBUyxJQUFJLFNBQVMsQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO1lBQzFDLG9CQUFvQixDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRSxTQUFTLENBQUMsQ0FBQyxDQUFDO2dCQUN0QyxNQUFNLENBQUMsV0FBVyxDQUFDLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1NBQ3JFO2FBQU07WUFDTCxTQUFTLElBQUksU0FBUyxDQUFDLG1CQUFtQixFQUFFLENBQUM7WUFDN0Msb0JBQW9CLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsTUFBTSxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3pDLE1BQU0sQ0FBQyxXQUFXLENBQUMsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUM7U0FDeEU7S0FDRjtBQUNILENBQUM7QUFFRCxTQUFTLGVBQWUsQ0FBQyxPQUF1QixFQUFFLEtBQWEsRUFBRSxXQUFvQjtJQUNuRixJQUFJLFdBQVcsRUFBRTtRQUNkLE9BQU8sQ0FBQyxLQUFLLENBQVksb0JBQXlCLENBQUM7S0FDckQ7U0FBTTtRQUNKLE9BQU8sQ0FBQyxLQUFLLENBQVksSUFBSSxpQkFBc0IsQ0FBQztLQUN0RDtBQUNILENBQUM7QUFFRCxTQUFTLFFBQVEsQ0FBQyxPQUF1QixFQUFFLEtBQWEsRUFBRSxVQUFtQjtJQUMzRSxJQUFNLGFBQWEsR0FDZixLQUFLLHFDQUEwQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssc0JBQTJCLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDO0lBQ2pHLElBQUksVUFBVSxFQUFFO1FBQ2IsT0FBTyxDQUFDLGFBQWEsQ0FBWSxpQkFBc0IsQ0FBQztLQUMxRDtTQUFNO1FBQ0osT0FBTyxDQUFDLGFBQWEsQ0FBWSxJQUFJLGNBQW1CLENBQUM7S0FDM0Q7QUFDSCxDQUFDO0FBRUQsU0FBUyxPQUFPLENBQUMsT0FBdUIsRUFBRSxLQUFhO0lBQ3JELElBQU0sYUFBYSxHQUNmLEtBQUsscUNBQTBDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxzQkFBMkIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUM7SUFDakcsT0FBTyxDQUFFLE9BQU8sQ0FBQyxhQUFhLENBQVksZ0JBQXFCLENBQUMsaUJBQXNCLENBQUM7QUFDekYsQ0FBQztBQUVELE1BQU0sVUFBVSxpQkFBaUIsQ0FBQyxPQUF1QixFQUFFLEtBQWE7SUFDdEUsSUFBTSxhQUFhLEdBQ2YsS0FBSyxxQ0FBMEMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLHNCQUEyQixDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQztJQUNqRyxPQUFPLENBQUUsT0FBTyxDQUFDLGFBQWEsQ0FBWSxnQkFBcUIsQ0FBQyxpQkFBc0IsQ0FBQztBQUN6RixDQUFDO0FBRUQsU0FBUyxhQUFhLENBQUMsT0FBdUIsRUFBRSxLQUFhO0lBQzNELElBQU0sYUFBYSxHQUNmLEtBQUsscUNBQTBDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxzQkFBMkIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUM7SUFDakcsT0FBTyxDQUFFLE9BQU8sQ0FBQyxhQUFhLENBQVksbUJBQXdCLENBQUMsb0JBQXlCLENBQUM7QUFDL0YsQ0FBQztBQUVELFNBQVMsUUFBUSxDQUFDLFVBQWtCLEVBQUUsV0FBbUIsRUFBRSxZQUFvQjtJQUM3RSxPQUFPLENBQUMsVUFBVSxtQkFBdUIsQ0FBQyxHQUFHLENBQUMsV0FBVyx3QkFBNkIsQ0FBQztRQUNuRixDQUFDLFlBQVksSUFBSSxDQUFDLDRDQUFxRCxDQUFDLENBQUMsQ0FBQztBQUNoRixDQUFDO0FBRUQsU0FBUyxlQUFlLENBQUMsT0FBdUIsRUFBRSxJQUFZO0lBQzVELElBQU0sS0FBSyxHQUFHLGVBQWUsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUNwQyxJQUFNLGlCQUFpQixHQUFHLElBQUksZ0JBQXFCLENBQUM7SUFDcEQsSUFBTSxhQUFhLEdBQUcsaUJBQWlCLENBQUMsQ0FBQyxDQUFDLE9BQU8sb0NBQXlDLENBQUMsQ0FBQztRQUNsRCxPQUFPLG9DQUF5QyxDQUFDO0lBQzNGLE9BQU8sYUFBYSxDQUFDLEtBQUssQ0FBNEIsQ0FBQztBQUN6RCxDQUFDO0FBRUQsU0FBUyxlQUFlLENBQUMsSUFBWTtJQUNuQyxPQUFPLENBQUMsSUFBSSx3QkFBNkIsQ0FBQyxzQkFBdUIsQ0FBQztBQUNwRSxDQUFDO0FBRUQsU0FBUyxxQkFBcUIsQ0FBQyxJQUFZO0lBQ3pDLElBQU0sS0FBSyxHQUNQLENBQUMsSUFBSSxJQUFJLENBQUMsNENBQXFELENBQUMsQ0FBQyxzQkFBdUIsQ0FBQztJQUM3RixPQUFPLEtBQUsscUNBQTBDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDdEUsQ0FBQztBQUVELFNBQVMsa0JBQWtCLENBQUMsT0FBdUI7SUFDakQsT0FBTyxxQkFBcUIsQ0FBQyxPQUFPLDRCQUFpQyxDQUFXLENBQUM7QUFDbkYsQ0FBQztBQUVELFNBQVMseUJBQXlCLENBQUMsT0FBdUI7SUFDeEQsSUFBTSxVQUFVLEdBQUcsT0FBTyw0QkFBaUMsQ0FBQztJQUM1RCxPQUFPLFVBQVUsQ0FDWjttQ0FDNkMsQ0FBQyxDQUFDO0FBQ3RELENBQUM7QUFFRCxTQUFTLHdCQUF3QixDQUFDLE9BQXVCO0lBQ3ZELElBQU0sV0FBVyxHQUFHLE9BQU8sMkJBQWdDLENBQUM7SUFDNUQsT0FBTyxXQUFXLENBQ2I7bUNBQzZDLENBQUMsQ0FBQztBQUN0RCxDQUFDO0FBRUQsU0FBUyxPQUFPLENBQUMsT0FBdUIsRUFBRSxLQUFhLEVBQUUsSUFBWTtJQUNuRSxPQUFPLENBQUMsS0FBSyx5QkFBOEIsQ0FBQyxHQUFHLElBQUksQ0FBQztBQUN0RCxDQUFDO0FBRUQsU0FBUyxRQUFRLENBQUMsT0FBdUIsRUFBRSxLQUFhLEVBQUUsS0FBOEI7SUFDdEYsT0FBTyxDQUFDLEtBQUssc0JBQTJCLENBQUMsR0FBRyxLQUFLLENBQUM7QUFDcEQsQ0FBQztBQUVELFNBQVMsdUJBQXVCLENBQzVCLE9BQXVCLEVBQUUsT0FBOEMsRUFBRSxLQUFhO0lBQ3hGLElBQU0sYUFBYSxHQUFHLE9BQU8sdUJBQThCLENBQUM7SUFDNUQsSUFBSSxPQUFPLEVBQUU7UUFDWCxJQUFJLENBQUMsYUFBYSxJQUFJLEtBQUssS0FBSyxDQUFDLEVBQUU7WUFDakMsT0FBTyxJQUFJLENBQUM7U0FDYjtLQUNGO1NBQU0sSUFBSSxDQUFDLGFBQWEsRUFBRTtRQUN6QixPQUFPLEtBQUssQ0FBQztLQUNkO0lBQ0QsT0FBTyxhQUFhLENBQUMsS0FBSyxDQUFDLEtBQUssT0FBTyxDQUFDO0FBQzFDLENBQUM7QUFFRCxTQUFTLGdCQUFnQixDQUNyQixPQUF1QixFQUFFLE9BQThDLEVBQ3ZFLGNBQXNCO0lBQ3hCLElBQUksYUFBYSxHQUFHLE9BQU8sdUJBQTRCLElBQUksa0JBQWtCLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDdkYsSUFBSSxjQUFjLEdBQUcsQ0FBQyxFQUFFO1FBQ3RCLGFBQWEsQ0FBQyxjQUFjLENBQUMsR0FBRyxPQUFPLENBQUM7S0FDekM7U0FBTTtRQUNMLGNBQWMsR0FBRyxhQUFhLGdDQUFvQyxDQUFDO1FBQ25FLGFBQWEsQ0FBQyxNQUFNLENBQUMsY0FBYyxFQUFFLENBQUMsRUFBRSxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDdkQsYUFBYSxnQ0FBb0M7b0RBQ0QsQ0FBQztLQUNsRDtJQUNELE9BQU8sY0FBYyxDQUFDO0FBQ3hCLENBQUM7QUFFRCxNQUFNLFVBQVUsc0JBQXNCLENBQUMsY0FBc0IsRUFBRSxXQUFtQjtJQUNoRixPQUFPLENBQUMsV0FBVyx5QkFBb0QsQ0FBQyxHQUFHLGNBQWMsQ0FBQztBQUM1RixDQUFDO0FBRUQsU0FBUyxxQkFBcUIsQ0FDMUIsT0FBdUIsRUFBRSxLQUFhLEVBQUUsa0JBQTBCLEVBQUUsY0FBc0I7SUFDNUYsSUFBTSxLQUFLLEdBQUcsc0JBQXNCLENBQUMsY0FBYyxFQUFFLGtCQUFrQixDQUFDLENBQUM7SUFDekUsT0FBTyxDQUFDLEtBQUssbUNBQXdDLENBQUMsR0FBRyxLQUFLLENBQUM7QUFDakUsQ0FBQztBQUVELFNBQVMscUJBQXFCLENBQUMsT0FBdUIsRUFBRSxLQUFhO0lBQ25FLElBQU0sSUFBSSxHQUFHLE9BQU8sQ0FBQyxLQUFLLG1DQUF3QyxDQUFXLENBQUM7SUFDOUUsSUFBTSxrQkFBa0IsR0FBRyxDQUFDLElBQUkseUJBQW9ELENBQUM7MkJBQ3RDLENBQUM7SUFDaEQsT0FBTyxrQkFBa0IsQ0FBQztBQUM1QixDQUFDO0FBRUQsU0FBUyxnQkFBZ0IsQ0FBQyxPQUF1QixFQUFFLEtBQWE7SUFFOUQsSUFBTSxrQkFBa0IsR0FBRyxxQkFBcUIsQ0FBQyxPQUFPLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDakUsSUFBSSxrQkFBa0IsRUFBRTtRQUN0QixJQUFNLGFBQWEsR0FBRyxPQUFPLHVCQUE0QixDQUFDO1FBQzFELElBQUksYUFBYSxFQUFFO1lBQ2pCLE9BQU8sYUFBYSxDQUFDLGtCQUFrQixDQUEwQyxDQUFDO1NBQ25GO0tBQ0Y7SUFDRCxPQUFPLElBQUksQ0FBQztBQUNkLENBQUM7QUFFRCxTQUFTLE9BQU8sQ0FBQyxPQUF1QixFQUFFLEtBQWEsRUFBRSxJQUFZO0lBQ25FLElBQU0sYUFBYSxHQUNmLEtBQUssK0JBQW9DLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLHNCQUEyQixDQUFDLENBQUM7SUFDM0YsT0FBTyxDQUFDLGFBQWEsQ0FBQyxHQUFHLElBQUksQ0FBQztBQUNoQyxDQUFDO0FBRUQsU0FBUyxXQUFXLENBQUMsT0FBdUIsRUFBRSxLQUFhO0lBQ3pELElBQU0sYUFBYSxHQUNmLEtBQUssK0JBQW9DLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLHNCQUEyQixDQUFDLENBQUM7SUFDM0YsT0FBTyxPQUFPLENBQUMsYUFBYSxDQUFXLENBQUM7QUFDMUMsQ0FBQztBQUVELE1BQU0sVUFBVSxRQUFRLENBQUMsT0FBdUIsRUFBRSxLQUFhO0lBQzdELE9BQU8sT0FBTyxDQUFDLEtBQUssc0JBQTJCLENBQTRCLENBQUM7QUFDOUUsQ0FBQztBQUVELE1BQU0sVUFBVSxPQUFPLENBQUMsT0FBdUIsRUFBRSxLQUFhO0lBQzVELE9BQU8sT0FBTyxDQUFDLEtBQUsseUJBQThCLENBQVcsQ0FBQztBQUNoRSxDQUFDO0FBRUQsTUFBTSxVQUFVLGNBQWMsQ0FBQyxPQUF1QjtJQUNwRCxPQUFPLE9BQU8sQ0FBQyxPQUFPLDZCQUFrQyxDQUFDO0FBQzNELENBQUM7QUFFRCxNQUFNLFVBQVUsZUFBZSxDQUFDLE9BQXVCLEVBQUUsVUFBbUI7SUFDMUUsUUFBUSxDQUFDLE9BQU8sOEJBQW1DLFVBQVUsQ0FBQyxDQUFDO0FBQ2pFLENBQUM7QUFFRCxNQUFNLFVBQVUsc0JBQXNCLENBQUMsT0FBdUIsRUFBRSxVQUFtQjtJQUNqRixJQUFJLFVBQVUsRUFBRTtRQUNiLE9BQU8sNEJBQTRDLCtCQUFvQyxDQUFDO0tBQzFGO1NBQU07UUFDSixPQUFPLDRCQUE0QyxJQUFJLDRCQUFpQyxDQUFDO0tBQzNGO0FBQ0gsQ0FBQztBQUVELFNBQVMsdUJBQXVCLENBQUMsT0FBdUIsRUFBRSxNQUFjLEVBQUUsTUFBYztJQUN0RixJQUFJLE1BQU0sS0FBSyxNQUFNO1FBQUUsT0FBTztJQUU5QixJQUFNLFFBQVEsR0FBRyxRQUFRLENBQUMsT0FBTyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0lBQzNDLElBQU0sT0FBTyxHQUFHLE9BQU8sQ0FBQyxPQUFPLEVBQUUsTUFBTSxDQUFDLENBQUM7SUFDekMsSUFBTSxPQUFPLEdBQUcsV0FBVyxDQUFDLE9BQU8sRUFBRSxNQUFNLENBQUMsQ0FBQztJQUM3QyxJQUFNLHFCQUFxQixHQUFHLHFCQUFxQixDQUFDLE9BQU8sRUFBRSxNQUFNLENBQUMsQ0FBQztJQUNyRSxJQUFNLGlCQUFpQixHQUFHLDBCQUEwQixDQUFDLE9BQU8sRUFBRSxNQUFNLENBQUMsQ0FBQztJQUV0RSxJQUFJLEtBQUssR0FBRyxPQUFPLENBQUM7SUFDcEIsSUFBSSxLQUFLLEdBQUcsV0FBVyxDQUFDLE9BQU8sRUFBRSxNQUFNLENBQUMsQ0FBQztJQUV6QyxJQUFNLFlBQVksR0FBRyxxQkFBcUIsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUNsRCxJQUFJLFlBQVksSUFBSSxDQUFDLEVBQUU7UUFDckIsSUFBTSxLQUFLLEdBQUcsV0FBVyxDQUFDLE9BQU8sRUFBRSxZQUFZLENBQUMsQ0FBQztRQUNqRCxJQUFNLFFBQVEsR0FBRyxlQUFlLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDeEMsT0FBTyxDQUFDLE9BQU8sRUFBRSxZQUFZLEVBQUUsUUFBUSxDQUFDLEtBQUssRUFBRSxRQUFRLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQztLQUNuRTtJQUVELElBQU0sWUFBWSxHQUFHLHFCQUFxQixDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ2xELElBQUksWUFBWSxJQUFJLENBQUMsRUFBRTtRQUNyQixJQUFNLEtBQUssR0FBRyxXQUFXLENBQUMsT0FBTyxFQUFFLFlBQVksQ0FBQyxDQUFDO1FBQ2pELElBQU0sUUFBUSxHQUFHLGVBQWUsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUN4QyxPQUFPLENBQUMsT0FBTyxFQUFFLFlBQVksRUFBRSxRQUFRLENBQUMsS0FBSyxFQUFFLFFBQVEsRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDO0tBQ25FO0lBRUQsUUFBUSxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsUUFBUSxDQUFDLE9BQU8sRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDO0lBQ3JELE9BQU8sQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLE9BQU8sQ0FBQyxPQUFPLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQztJQUNuRCxPQUFPLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxXQUFXLENBQUMsT0FBTyxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUM7SUFDdkQsSUFBTSxZQUFZLEdBQUcscUJBQXFCLENBQUMsT0FBTyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0lBQzVELElBQU0sZUFBZSxHQUFHLDBCQUEwQixDQUFDLE9BQU8sRUFBRSxNQUFNLENBQUMsQ0FBQztJQUNwRSxxQkFBcUIsQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLFlBQVksRUFBRSxlQUFlLENBQUMsQ0FBQztJQUV0RSxRQUFRLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxRQUFRLENBQUMsQ0FBQztJQUNwQyxPQUFPLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxPQUFPLENBQUMsQ0FBQztJQUNsQyxPQUFPLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxPQUFPLENBQUMsQ0FBQztJQUNsQyxxQkFBcUIsQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLHFCQUFxQixFQUFFLGlCQUFpQixDQUFDLENBQUM7QUFDbkYsQ0FBQztBQUVELFNBQVMseUJBQXlCLENBQUMsT0FBdUIsRUFBRSxrQkFBMEI7SUFDcEYsS0FBSyxJQUFJLENBQUMsR0FBRyxrQkFBa0IsRUFBRSxDQUFDLEdBQUcsT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDLGdCQUFxQixFQUFFO1FBQzNFLElBQU0sU0FBUyxHQUFHLFdBQVcsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDMUMsSUFBTSxXQUFXLEdBQUcscUJBQXFCLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDckQsSUFBSSxXQUFXLEdBQUcsQ0FBQyxFQUFFO1lBQ25CLElBQU0sVUFBVSxHQUFHLFdBQVcsQ0FBQyxPQUFPLEVBQUUsV0FBVyxDQUFDLENBQUM7WUFDckQsSUFBTSxxQkFBcUIsR0FBRyxlQUFlLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDMUQsSUFBTSxTQUFTLEdBQUcsQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLFdBQVcsQ0FBQyxDQUFDLENBQUMsZUFBb0IsQ0FBQyxhQUFrQixDQUFDO2dCQUN0RixDQUFDLGlCQUFpQixDQUFDLE9BQU8sRUFBRSxXQUFXLENBQUMsQ0FBQyxDQUFDLGVBQW9CLENBQUMsYUFBa0IsQ0FBQztnQkFDbEYsQ0FBQyxhQUFhLENBQUMsT0FBTyxFQUFFLFdBQVcsQ0FBQyxDQUFDLENBQUMsa0JBQXVCLENBQUMsYUFBa0IsQ0FBQyxDQUFDO1lBQ3RGLElBQU0sV0FBVyxHQUFHLFFBQVEsQ0FBQyxTQUFTLEVBQUUscUJBQXFCLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDbEUsT0FBTyxDQUFDLE9BQU8sRUFBRSxXQUFXLEVBQUUsV0FBVyxDQUFDLENBQUM7U0FDNUM7S0FDRjtBQUNILENBQUM7QUFFRCxTQUFTLHNCQUFzQixDQUMzQixPQUF1QixFQUFFLEtBQWEsRUFBRSxVQUFtQixFQUFFLElBQVksRUFBRSxJQUFZLEVBQ3ZGLEtBQXVCLEVBQUUsY0FBc0IsRUFBRSxXQUFtQjtJQUN0RSxJQUFNLE9BQU8sR0FBRyxLQUFLLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQztJQUV2Qyw2Q0FBNkM7SUFDN0MsT0FBTyxDQUFDLE1BQU0sQ0FDVixLQUFLLEVBQUUsQ0FBQyxFQUFFLElBQUksZ0JBQXFCLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQyxlQUFvQixDQUFDLGFBQWtCLENBQUMsRUFDM0YsSUFBSSxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQztJQUNwQixxQkFBcUIsQ0FBQyxPQUFPLEVBQUUsS0FBSyxFQUFFLFdBQVcsRUFBRSxjQUFjLENBQUMsQ0FBQztJQUVuRSxJQUFJLE9BQU8sRUFBRTtRQUNYLCtEQUErRDtRQUMvRCw0REFBNEQ7UUFDNUQsa0RBQWtEO1FBQ2xELHlCQUF5QixDQUFDLE9BQU8sRUFBRSxLQUFLLGVBQW9CLENBQUMsQ0FBQztLQUMvRDtBQUNILENBQUM7QUFFRCxTQUFTLFdBQVcsQ0FBQyxLQUE4QixFQUFFLFlBQXNCO0lBQ3pFLE9BQU8sS0FBSyxLQUFLLElBQUksQ0FBQztBQUN4QixDQUFDO0FBRUQsU0FBUyxrQkFBa0IsQ0FDdkIsT0FBdUIsRUFBRSxJQUFZLEVBQUUsaUJBQTBCLEVBQ2pFLFNBQWtDO0lBQ3BDLElBQUksSUFBSSxHQUFHLENBQUMsU0FBUyxJQUFJLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsa0JBQXVCLENBQUMsYUFBa0IsQ0FBQztJQUV0RixJQUFJLFlBQW9CLENBQUM7SUFDekIsSUFBSSxpQkFBaUIsRUFBRTtRQUNyQixJQUFJLGlCQUFzQixDQUFDO1FBQzNCLFlBQVk7WUFDUiw4QkFBOEIsQ0FBQyxPQUFPLG9DQUF5QyxFQUFFLElBQUksQ0FBQyxDQUFDO0tBQzVGO1NBQU07UUFDTCxZQUFZO1lBQ1IsOEJBQThCLENBQUMsT0FBTyxvQ0FBeUMsRUFBRSxJQUFJLENBQUMsQ0FBQztLQUM1RjtJQUVELFlBQVksR0FBRyxZQUFZLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFlBQVksc0JBQXdDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzdGLE9BQU8sUUFBUSxDQUFDLElBQUksRUFBRSxZQUFZLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFDekMsQ0FBQztBQUVELFNBQVMsc0JBQXNCLENBQUMsT0FBdUIsRUFBRSxJQUFZLEVBQUUsUUFBYTtJQUNsRixJQUFNLFlBQVksR0FBRyxlQUFlLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQ3BELE9BQU8sQ0FBQyxZQUFZLElBQUksZUFBZSxDQUFDLElBQUksRUFBRSxZQUFZLEVBQUUsUUFBUSxDQUFDLENBQUM7QUFDeEUsQ0FBQztBQUVELFNBQVMsZUFBZSxDQUNwQixJQUFZLEVBQUUsQ0FBMEIsRUFBRSxDQUEwQjtJQUN0RSxJQUFNLFlBQVksR0FBRyxJQUFJLGdCQUFxQixDQUFDO0lBQy9DLElBQU0sU0FBUyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDekIsSUFBTSxhQUFhLEdBQUcsSUFBSSxtQkFBd0IsQ0FBQztJQUNuRCw0REFBNEQ7SUFDNUQsbUVBQW1FO0lBQ25FLHNEQUFzRDtJQUN0RCxJQUFJLENBQUMsWUFBWSxJQUFJLFNBQVMsSUFBSSxhQUFhLEVBQUU7UUFDL0MsNERBQTREO1FBQzVELE9BQVEsQ0FBWSxDQUFDLFFBQVEsRUFBRSxLQUFNLENBQVksQ0FBQyxRQUFRLEVBQUUsQ0FBQztLQUM5RDtJQUVELGdFQUFnRTtJQUNoRSxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDakIsQ0FBQztBQUVEO0lBS0Usb0NBQVksT0FBc0IsRUFBVSxRQUFxQixFQUFVLEtBQWtCO1FBQWpELGFBQVEsR0FBUixRQUFRLENBQWE7UUFBVSxVQUFLLEdBQUwsS0FBSyxDQUFhO1FBSnJGLFlBQU8sR0FBbUMsRUFBRSxDQUFDO1FBQzdDLFdBQU0sR0FBRyxLQUFLLENBQUM7UUFJckIsSUFBSSxDQUFDLFFBQVEsR0FBRyxPQUFjLENBQUM7SUFDakMsQ0FBQztJQUVELDZDQUFRLEdBQVIsVUFBUyxJQUFZLEVBQUUsS0FBVTtRQUMvQixJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssS0FBSyxFQUFFO1lBQ2hDLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsS0FBSyxDQUFDO1lBQzNCLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDO1NBQ3BCO0lBQ0gsQ0FBQztJQUVELGdEQUFXLEdBQVgsVUFBWSxhQUEwQixFQUFFLGFBQXNCO1FBQzVELHFFQUFxRTtRQUNyRSxtRUFBbUU7UUFDbkUseURBQXlEO1FBQ3pELElBQUksSUFBSSxDQUFDLE1BQU0sRUFBRTtZQUNmLElBQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUMzQixJQUFJLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLE9BQVMsRUFBRSxhQUFhLEVBQUUsYUFBYSxJQUFJLElBQUksQ0FBQyxDQUFDO1lBQ3JGLElBQUksQ0FBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO1lBQ2xCLElBQUksQ0FBQyxNQUFNLEdBQUcsS0FBSyxDQUFDO1lBQ3BCLE9BQU8sTUFBTSxDQUFDO1NBQ2Y7UUFFRCxPQUFPLFNBQVMsQ0FBQztJQUNuQixDQUFDO0lBQ0gsaUNBQUM7QUFBRCxDQUFDLEFBOUJELElBOEJDOztBQWdDRCxNQUFNLFVBQVUscUJBQXFCLENBQUMsTUFBK0IsRUFBRSxLQUFjO0lBQ25GLElBQUksSUFBSSxFQUFFLElBQUksR0FBRyxtQkFBbUIsQ0FBQztJQUNyQyxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLEVBQUU7UUFDekIsSUFBSSxLQUFLLEVBQUU7WUFDVCxJQUFJLElBQUksU0FBUyxHQUFHLEtBQUssQ0FBQztTQUMzQjthQUFNO1lBQ0wsSUFBSSxJQUFJLGVBQWUsQ0FBQztTQUN6QjtRQUNELEtBQUssR0FBRyxLQUFLLDhCQUFtQyxDQUFDO1FBQ2pELElBQUksR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFXLENBQUM7S0FDaEM7U0FBTTtRQUNMLElBQUksR0FBRyxNQUFNLENBQUM7UUFDZCxJQUFJLElBQUksU0FBUyxHQUFHLElBQUksQ0FBQztLQUMxQjtJQUNELElBQU0sWUFBWSxHQUFHLHFCQUFxQixDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ2pELElBQU0sV0FBVyxHQUFHLGVBQWUsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUMxQyxPQUFPO1FBQ0wsSUFBSSxNQUFBO1FBQ0osV0FBVyxhQUFBO1FBQ1gsWUFBWSxjQUFBO1FBQ1osS0FBSyxFQUFFLElBQUk7UUFDWCxLQUFLLEVBQUU7WUFDTCxLQUFLLEVBQUUsSUFBSSxnQkFBcUIsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxLQUFLO1lBQy9DLEtBQUssRUFBRSxJQUFJLGdCQUFxQixDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEtBQUs7WUFDL0MsUUFBUSxFQUFFLElBQUksbUJBQXdCLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsS0FBSztZQUNyRCxtQkFBbUIsRUFBRSxJQUFJLDhCQUFtQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEtBQUs7WUFDM0UsdUJBQXVCLEVBQUUsSUFBSSxtQ0FBdUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxLQUFLO1NBQ3BGO0tBQ0YsQ0FBQztBQUNKLENBQUM7QUFFRCxNQUFNLFVBQVUsMEJBQTBCLENBQUMsT0FBdUIsRUFBRSxLQUFhO0lBQy9FLElBQU0sS0FBSyxHQUFHLE9BQU8sQ0FBQyxLQUFLLG1DQUF3QyxDQUFXLENBQUM7SUFDL0UsT0FBTyxLQUFLLHNCQUE4QyxDQUFDO0FBQzdELENBQUM7QUFFRCxTQUFTLDZCQUE2QixDQUFDLE9BQXVCLEVBQUUsWUFBaUI7SUFDL0UsSUFBSSxjQUFzQixDQUFDO0lBRTNCLElBQU0sSUFBSSxHQUFHLE9BQU8sbUNBQXdDLENBQUM7SUFDN0QsSUFBSSxLQUFLLEdBQUcsaUNBQWlDLENBQUMsSUFBSSxFQUFFLFlBQVksQ0FBQyxDQUFDO0lBQ2xFLElBQUksS0FBSyxLQUFLLENBQUMsQ0FBQyxFQUFFO1FBQ2hCLHFFQUFxRTtRQUNyRSw0RUFBNEU7UUFDNUUsS0FBSyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUM7UUFDcEIsY0FBYyxHQUFHLEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssZUFBb0MsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBRTNFLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDbEMsSUFBSSxDQUFDLEtBQUssK0JBQW9ELENBQUMsR0FBRyxZQUFZLENBQUM7UUFDL0UsSUFBSSxDQUFDLEtBQUssMEJBQStDLENBQUMsR0FBRyxLQUFLLENBQUM7UUFDbkUsSUFBSSxDQUFDLEtBQUssc0NBQTJELENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztRQUU1RSxJQUFNLGlCQUFpQixHQUNuQix5QkFBeUIsQ0FBQyxPQUFPLENBQUMscUNBQTBDLENBQUM7UUFDakYscUJBQXFCLENBQUMsT0FBTyxFQUFFLGNBQWMsRUFBRSxJQUFJLEVBQUUsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ3JFLHFCQUFxQixDQUFDLE9BQU8sRUFBRSxjQUFjLEVBQUUsS0FBSyxFQUFFLGlCQUFpQixDQUFDLENBQUM7S0FDMUU7U0FBTTtRQUNMLGNBQWMsR0FBRyxLQUFLLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLGVBQW9DLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztLQUM1RTtJQUVELE9BQU8sY0FBYyxDQUFDO0FBQ3hCLENBQUM7QUFFRCxTQUFTLGlDQUFpQyxDQUN0QyxVQUFtQyxFQUFFLFNBQWE7SUFDcEQsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxnQkFBcUMsRUFBRTtRQUM3RSxJQUFJLFVBQVUsQ0FBQyxDQUFDLENBQUMsS0FBSyxTQUFTLEVBQUU7WUFDL0IsT0FBTyxDQUFDLENBQUM7U0FDVjtLQUNGO0lBQ0QsT0FBTyxDQUFDLENBQUMsQ0FBQztBQUNaLENBQUM7QUFFRCxTQUFTLDhCQUE4QixDQUFDLFNBQStCLEVBQUUsR0FBVztJQUNsRixLQUFLLElBQUksQ0FBQyxnQ0FBa0QsRUFBRSxDQUFDLEdBQUcsU0FBUyxDQUFDLE1BQU0sRUFDN0UsQ0FBQyxnQkFBa0MsRUFBRTtRQUN4QyxJQUFJLFNBQVMsQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHO1lBQUUsT0FBTyxDQUFDLENBQUM7S0FDcEM7SUFDRCxPQUFPLENBQUMsQ0FBQyxDQUFDO0FBQ1osQ0FBQztBQUVELE1BQU0sVUFBVSxtQkFBbUIsQ0FBQyxDQUFhLEVBQUUsQ0FBYTtJQUM5RCxJQUFNLEdBQUcsR0FBYSxFQUFFLENBQUM7SUFDekIsSUFBTSxLQUFLLEdBQXlCLEVBQUUsQ0FBQztJQUN2QyxpQkFBaUIsQ0FBQyxLQUFLLEVBQUUsYUFBYSxFQUFFLGFBQWEsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFDN0QsaUJBQWlCLENBQUMsS0FBSyxFQUFFLGNBQWMsRUFBRSxjQUFjLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQy9ELE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLE9BQU8sQ0FDeEIsVUFBQSxJQUFJLElBQU0saUJBQWlCLENBQUMsS0FBSyxFQUFFLFFBQVEsR0FBRyxJQUFJLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFFcEYsSUFBSSxLQUFLLENBQUMsTUFBTSxFQUFFO1FBQ2hCLEdBQUcsQ0FBQyxJQUFJLENBQUMsb0JBQW9CLENBQUMsQ0FBQztRQUMvQixHQUFHLENBQUMsSUFBSSxDQUFDLE9BQU8sR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDM0IsR0FBRyxDQUFDLElBQUksQ0FBQyxPQUFPLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzNCLEdBQUcsQ0FBQyxJQUFJLENBQUMsNENBQTRDLENBQUMsQ0FBQztRQUN2RCxLQUFLLENBQUMsT0FBTyxDQUFDLFVBQUEsTUFBTTtZQUNaLElBQUEsOEJBQTJCLEVBQTFCLFlBQUksRUFBRSxZQUFJLEVBQUUsWUFBYyxDQUFDO1lBQ2xDLEdBQUcsQ0FBQyxJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxDQUFDO1lBQzNCLEdBQUcsQ0FBQyxJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksR0FBRyxPQUFPLEdBQUcsSUFBSSxHQUFHLElBQUksQ0FBQyxDQUFDO1FBQ3JELENBQUMsQ0FBQyxDQUFDO0tBQ0o7SUFFRCxPQUFPLEdBQUcsQ0FBQztBQUNiLENBQUM7QUFFRCxTQUFTLGlCQUFpQixDQUFDLE1BQWEsRUFBRSxJQUFZLEVBQUUsSUFBWSxFQUFFLENBQU0sRUFBRSxDQUFNO0lBQ2xGLElBQU0sSUFBSSxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUNyQixJQUFNLElBQUksR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDckIsSUFBSSxJQUFJLEtBQUssSUFBSSxFQUFFO1FBQ2pCLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7S0FDakM7QUFDSCxDQUFDO0FBRUQsU0FBUyx1QkFBdUIsQ0FDNUIsT0FBdUIsRUFBRSxjQUFzQixFQUFFLE1BQWMsRUFBRSxZQUFxQjtJQUN4RixJQUFNLDZCQUE2QixHQUMvQixPQUFPLG1DQUF3QyxDQUN2QyxDQUFDLGNBQWMsZUFBb0MsQ0FBQzsyQ0FDSSxDQUFXLENBQUM7SUFDaEYsSUFBTSxPQUFPLEdBQUcsT0FBTyxtQ0FBd0MsQ0FBQztJQUNoRSxJQUFNLGNBQWMsR0FBRyw2QkFBNkI7a0NBQ0Y7UUFDOUMsQ0FBQyxZQUFZLENBQUMsQ0FBQztZQUNWLE9BQU8sQ0FDRiw2QkFBNkIsOEJBQWtELENBQUMsQ0FBQyxDQUFDO1lBQ3ZGLENBQUMsQ0FBQztRQUNQLE1BQU0sQ0FBQztJQUNYLE9BQU8sT0FBTyxDQUFDLGNBQWMsQ0FBQyxDQUFDO0FBQ2pDLENBQUM7QUFFRCxTQUFTLGlCQUFpQixDQUFDLE9BQXVCLEVBQUUsY0FBc0I7SUFDeEUsSUFBTSxJQUFJLEdBQUcsT0FBTyxtQ0FBd0MsQ0FBQztJQUM3RCxJQUFNLEtBQUssR0FBRyxJQUFJLENBQ0MsY0FBYyxlQUFvQztvQ0FDRCxDQUFDO1FBQ2pFLElBQUksOEJBQW1ELElBQUksSUFBSSxDQUFDO0lBQ3BFLE9BQU8sS0FBK0IsQ0FBQztBQUN6QyxDQUFDO0FBRUQsU0FBUyxnQkFBZ0IsQ0FBQyxPQUF1QixFQUFFLGNBQXNCO0lBQ3ZFLElBQU0sSUFBSSxHQUFHLE9BQU8sbUNBQXdDLENBQUM7SUFDN0QsT0FBTyxJQUFJLENBQ04sY0FBYyxlQUFvQzsrQkFDTixDQUFZLENBQUM7QUFDaEUsQ0FBQztBQUVELFNBQVMsaUJBQWlCLENBQ3RCLE9BQXVCLEVBQUUsY0FBc0IsRUFBRSxRQUFpQjtJQUNwRSxJQUFNLElBQUksR0FBRyxPQUFPLG1DQUF3QyxDQUFDO0lBQzdELElBQUksQ0FDQyxjQUFjLGVBQW9DOytCQUNOLENBQUMsR0FBRyxRQUFRLENBQUM7QUFDaEUsQ0FBQztBQUVELFNBQVMsZ0JBQWdCLENBQ3JCLFlBQXFDLEVBQUUsUUFBaUMsRUFDeEUscUJBQTZCLEVBQUUsaUJBQXlCO0lBQzFELDBFQUEwRTtJQUMxRSwwRUFBMEU7SUFDMUUsNkVBQTZFO0lBQzdFLGdGQUFnRjtJQUNoRixpRkFBaUY7SUFDakYsa0ZBQWtGO0lBQ2xGLGlGQUFpRjtJQUNqRixvRkFBb0Y7SUFDcEYsNERBQTREO0lBQzVELElBQUksWUFBWSxJQUFJLElBQUksRUFBRTtRQUN4QixJQUFJLFFBQVEsSUFBSSxJQUFJLEVBQUU7WUFDcEIscUVBQXFFO1lBQ3JFLGdDQUFnQztZQUNoQyxPQUFPLGlCQUFpQixJQUFJLHFCQUFxQixDQUFDO1NBQ25EO2FBQU07WUFDTCxrRUFBa0U7WUFDbEUsK0RBQStEO1lBQy9ELDZEQUE2RDtZQUM3RCx5Q0FBeUM7WUFDekMsT0FBTyxxQkFBcUIsS0FBSyxpQkFBaUIsQ0FBQztTQUNwRDtLQUNGO0lBQ0QsT0FBTyxJQUFJLENBQUM7QUFDZCxDQUFDO0FBRUQ7Ozs7Ozs7Ozs7R0FVRztBQUNILE1BQU0sVUFBVSx3QkFBd0IsQ0FBQyxPQUF1QjtJQUM5RCxJQUFNLGtCQUFrQixHQUFHLE9BQU8sb0NBQXlDLENBQUM7SUFDNUUsSUFBSSxTQUFTLEdBQUcsa0JBQWtCLG1DQUFxRCxDQUFDO0lBQ3hGLElBQUksU0FBUyxLQUFLLElBQUksRUFBRTtRQUN0QixTQUFTLEdBQUcsRUFBRSxDQUFDO1FBQ2YsS0FBSyxJQUFJLENBQUMsZ0NBQWtELEVBQUUsQ0FBQyxHQUFHLGtCQUFrQixDQUFDLE1BQU0sRUFDdEYsQ0FBQyxnQkFBa0MsRUFBRTtZQUN4QyxJQUFNLFNBQVMsR0FBRyxrQkFBa0IsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDNUMsSUFBSSxTQUFTLEVBQUU7Z0JBQ2IsU0FBUyxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxrQkFBa0IsQ0FBQyxDQUFDLENBQUMsQ0FBQzthQUNwRTtTQUNGO1FBQ0Qsa0JBQWtCLG1DQUFxRCxHQUFHLFNBQVMsQ0FBQztLQUNyRjtJQUNELE9BQU8sU0FBUyxDQUFDO0FBQ25CLENBQUM7QUFFRDs7Ozs7Ozs7OztHQVVHO0FBQ0gsTUFBTSxVQUFVLDBCQUEwQixDQUFDLE9BQXVCO0lBQ2hFLElBQU0sa0JBQWtCLEdBQUcsT0FBTyxvQ0FBeUMsQ0FBQztJQUM1RSxJQUFJLFdBQVcsR0FBRyxrQkFBa0IsbUNBQXFELENBQUM7SUFDMUYsSUFBSSxXQUFXLEtBQUssSUFBSSxFQUFFO1FBQ3hCLFdBQVcsR0FBRyxFQUFFLENBQUM7UUFDakIsS0FBSyxJQUFJLENBQUMsZ0NBQWtELEVBQUUsQ0FBQyxHQUFHLGtCQUFrQixDQUFDLE1BQU0sRUFDdEYsQ0FBQyxnQkFBa0MsRUFBRTtZQUN4QyxJQUFNLEtBQUssR0FBRyxrQkFBa0IsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDeEMsSUFBSSxLQUFLLEtBQUssSUFBSSxFQUFFO2dCQUNsQixXQUFXLElBQUksQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFNLGtCQUFrQixDQUFDLENBQUMsQ0FBQyxTQUFJLEtBQU8sQ0FBQSxDQUFDO2FBQ3RGO1NBQ0Y7UUFDRCxrQkFBa0IsbUNBQXFELEdBQUcsV0FBVyxDQUFDO0tBQ3ZGO0lBQ0QsT0FBTyxXQUFXLENBQUM7QUFDckIsQ0FBQztBQUVEOztHQUVHO0FBQ0gsU0FBUyxrQkFBa0IsQ0FDdkIsT0FBdUIsRUFBRSxpQkFBMEIsRUFBRSxjQUFzQjtJQUM3RSxJQUFNLE1BQU0sR0FDUixPQUFPLENBQUMsaUJBQWlCLENBQUMsQ0FBQyw0QkFBaUMsQ0FBQywwQkFBK0IsQ0FBQyxDQUFDO0lBQ2xHLElBQU0sS0FBSyxHQUFHO1FBQ1YsY0FBYyxlQUFpQyxDQUFDO0lBQ3BELE9BQU8sTUFBTSxDQUFDLEtBQUssc0JBQXdDLENBQUMsSUFBSSxJQUFJLENBQUM7QUFDdkUsQ0FBQztBQUVEOzs7Ozs7Ozs7Ozs7O0dBYUc7QUFDSCxTQUFTLG9CQUFvQixDQUN6QixPQUF1QixFQUFFLGlCQUEwQixFQUFFLGNBQXNCLEVBQzNFLFFBQWE7SUFDZixJQUFNLG1CQUFtQixHQUNyQixpQkFBaUIsQ0FBQyxDQUFDLDRCQUFpQyxDQUFDLDBCQUErQixDQUFDO0lBQ3pGLElBQU0sWUFBWSxHQUFHLE9BQU8sQ0FBQyxtQkFBbUIsQ0FBeUIsQ0FBQztJQUMxRSxJQUFNLEtBQUssR0FBRztRQUNWLGNBQWMsZUFBaUMsQ0FBQztJQUNwRCxJQUFJLFlBQVksQ0FBQyxLQUFLLDBCQUE0QyxDQUFDO1FBQUUsT0FBTyxLQUFLLENBQUM7SUFDbEYsT0FBTyxRQUFRLEtBQUssU0FBUztRQUN6QixrQkFBa0IsQ0FBQyxPQUFPLEVBQUUsaUJBQWlCLEVBQUUsY0FBYyxDQUFDLEtBQUssUUFBUSxDQUFDO0FBQ2xGLENBQUM7QUFFRDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBcUJHO0FBQ0gsU0FBUyxvQkFBb0IsQ0FDekIsT0FBdUIsRUFBRSxjQUFzQixFQUFFLGlCQUEwQixFQUFFLFVBQWUsRUFDNUYsYUFBcUIsRUFBRSxXQUFtQixFQUFFLFdBQW1CLEVBQUUsaUJBQTBCO0lBQzdGLElBQU0sTUFBTSxHQUNSLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLDRCQUFpQyxDQUFDLDBCQUErQixDQUFDLENBQUM7SUFFbEcsSUFBTSxLQUFLLEdBQUc7UUFDVixjQUFjLGVBQWlDLENBQUM7SUFFcEQsc0ZBQXNGO0lBQ3RGLDZDQUE2QztJQUM3QyxJQUFJLGlCQUFpQixFQUFFO1FBQ3JCLElBQU0saUJBQWlCLEdBQUcsYUFBYSxHQUFHLFdBQVcsZUFBaUMsQ0FBQztRQUN2RixLQUFLLElBQUksQ0FBQyxHQUFHLEtBQUssZUFBaUMsRUFBRSxDQUFDLEdBQUcsTUFBTSxDQUFDLE1BQU0sRUFDakUsQ0FBQyxnQkFBa0MsRUFBRTtZQUN4QyxNQUFNLENBQUMsQ0FBQyw4QkFBZ0QsQ0FBQyxHQUFHLGlCQUFpQixDQUFDO1lBQzlFLE1BQU0sQ0FBQyxDQUFDLDBCQUE0QyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1NBQzNEO0tBQ0Y7SUFFRCxNQUFNLENBQUMsS0FBSywwQkFBNEMsQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUM5RCxNQUFNLENBQUMsS0FBSyw4QkFBZ0QsQ0FBQyxHQUFHLGFBQWEsQ0FBQztJQUM5RSxNQUFNLENBQUMsS0FBSyxzQkFBd0MsQ0FBQyxHQUFHLFVBQVUsQ0FBQztJQUNuRSxNQUFNLENBQUMsS0FBSywyQkFBNkMsQ0FBQyxHQUFHLFdBQVcsQ0FBQztJQUV6RSx5RUFBeUU7SUFDekUsd0VBQXdFO0lBQ3hFLHFEQUFxRDtJQUNyRCxJQUFJLG1CQUFtQixHQUFHLFdBQVcsQ0FBQztJQUN0QyxLQUFLLElBQUksQ0FBQyw4QkFBZ0QsRUFBRSxDQUFDLEdBQUcsS0FBSyxFQUNoRSxDQUFDLGdCQUFrQyxFQUFFO1FBQ3hDLG1CQUFtQixJQUFJLE1BQU0sQ0FBQyxDQUFDLDJCQUE2QyxDQUFDLENBQUM7S0FDL0U7SUFFRCwwRUFBMEU7SUFDMUUsdUVBQXVFO0lBQ3ZFLDBFQUEwRTtJQUMxRSx1QkFBdUI7SUFDdkIsSUFBSSxDQUFDLGlCQUFpQixFQUFFO1FBQ3RCLElBQU0sVUFBVSxHQUFHLE9BQU8sNEJBQWlDLENBQUM7UUFDNUQsSUFBTSxvQkFBb0IsR0FBRyxVQUFVLENBQ2xDO3VDQUM2QyxDQUFDLENBQUM7UUFDcEQsSUFBTSxtQkFBbUIsR0FBRyxXQUFXLEdBQUcsb0JBQW9CLENBQUM7UUFDL0QsS0FBSyxJQUFJLENBQUMsOEJBQWdELEVBQUUsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxNQUFNLEVBQzVFLENBQUMsZ0JBQWtDLEVBQUU7WUFDeEMsVUFBVSxDQUFDLENBQUMsOEJBQWdELENBQUMsSUFBSSxtQkFBbUIsQ0FBQztTQUN0RjtLQUNGO0lBRUQsTUFBTSw4QkFBZ0QsR0FBRyxtQkFBbUIsQ0FBQztBQUMvRSxDQUFDO0FBRUQsU0FBUyxnQkFBZ0IsQ0FBQyxPQUFpQjtJQUN6QyxJQUFNLFVBQVUsR0FBYSxFQUFFLENBQUM7SUFDaEMsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7UUFDdkMsVUFBVSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztLQUN4QztJQUNELE9BQU8sVUFBVSxDQUFDO0FBQ3BCLENBQUM7QUFFRCxTQUFTLFNBQVMsQ0FBQyxLQUFhO0lBQzlCLE9BQU8sS0FBSyxDQUFDLE9BQU8sQ0FDaEIsYUFBYSxFQUFFLFVBQUEsS0FBSyxJQUFJLE9BQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsU0FBSSxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLFdBQVcsRUFBSSxFQUFyRCxDQUFxRCxDQUFDLENBQUM7QUFDckYsQ0FBQztBQUVELFNBQVMscUJBQXFCLENBQzFCLE9BQXVCLEVBQUUsY0FBc0IsRUFBRSxpQkFBMEIsRUFDM0UsYUFBcUIsRUFBRSxLQUFTO0lBQVQsc0JBQUEsRUFBQSxTQUFTO0lBQ2xDLElBQU0sWUFBWSxHQUNkLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLDRCQUFpQyxDQUFDLDBCQUErQixDQUFDLENBQUM7SUFDbEcsSUFBSSxjQUFjLEdBQUcsQ0FBQyxFQUFFO1FBQ3RCLElBQU0sS0FBSyxHQUFHO1lBQ1YsQ0FBQyxjQUFjLGVBQWlDLENBQUMsQ0FBQztRQUN0RCxPQUFPLFlBQVksQ0FBQyxNQUFNLEdBQUcsS0FBSyxFQUFFO1lBQ2xDLHVFQUF1RTtZQUN2RSx1RUFBdUU7WUFDdkUscUVBQXFFO1lBQ3JFLFlBQVksQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLGFBQWEsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUM7U0FDOUM7S0FDRjtJQUNELFlBQVksQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLGFBQWEsRUFBRSxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7QUFDbkQsQ0FBQztBQUVEOzs7Ozs7Ozs7Ozs7O0dBYUc7QUFDSCxTQUFTLHNCQUFzQixDQUMzQixLQUFvQixFQUFFLFlBQWtDLEVBQUUsSUFBWSxFQUN0RSxLQUE4QixFQUFFLG1CQUEyQjtJQUM3RCxJQUFJLEtBQUssS0FBSyxJQUFJLEVBQUU7UUFDbEIsS0FBSyxHQUFHLFlBQVksQ0FBQyxNQUFNLENBQUM7UUFDNUIsWUFBWSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ3BDLFlBQVksQ0FBQyxLQUFLLHFCQUF1QyxDQUFDLEdBQUcsSUFBSSxDQUFDO0tBQ25FO0lBQ0QsWUFBWSxDQUFDLEtBQUssc0JBQXdDLENBQUMsR0FBRyxLQUFLLENBQUM7SUFDcEUsWUFBWSxDQUFDLEtBQUssK0JBQWlELENBQUMsR0FBRyxtQkFBbUIsQ0FBQztJQUMzRixPQUFPLEtBQUssQ0FBQztBQUNmLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiogQGxpY2Vuc2VcbiogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4qXG4qIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4qIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiovXG5pbXBvcnQge1N0eWxlU2FuaXRpemVGbn0gZnJvbSAnLi4vLi4vc2FuaXRpemF0aW9uL3N0eWxlX3Nhbml0aXplcic7XG5pbXBvcnQge0VNUFRZX0FSUkFZLCBFTVBUWV9PQkp9IGZyb20gJy4uL2VtcHR5JztcbmltcG9ydCB7QXR0cmlidXRlTWFya2VyLCBUQXR0cmlidXRlc30gZnJvbSAnLi4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7QmluZGluZ1N0b3JlLCBCaW5kaW5nVHlwZSwgUGxheWVyLCBQbGF5ZXJCdWlsZGVyLCBQbGF5ZXJGYWN0b3J5LCBQbGF5ZXJJbmRleH0gZnJvbSAnLi4vaW50ZXJmYWNlcy9wbGF5ZXInO1xuaW1wb3J0IHtSRWxlbWVudCwgUmVuZGVyZXIzLCBSZW5kZXJlclN0eWxlRmxhZ3MzLCBpc1Byb2NlZHVyYWxSZW5kZXJlcn0gZnJvbSAnLi4vaW50ZXJmYWNlcy9yZW5kZXJlcic7XG5pbXBvcnQge0RpcmVjdGl2ZU93bmVyQW5kUGxheWVyQnVpbGRlckluZGV4LCBEaXJlY3RpdmVSZWdpc3RyeVZhbHVlcywgRGlyZWN0aXZlUmVnaXN0cnlWYWx1ZXNJbmRleCwgSW5pdGlhbFN0eWxpbmdWYWx1ZXMsIEluaXRpYWxTdHlsaW5nVmFsdWVzSW5kZXgsIE1hcEJhc2VkT2Zmc2V0VmFsdWVzLCBNYXBCYXNlZE9mZnNldFZhbHVlc0luZGV4LCBTaW5nbGVQcm9wT2Zmc2V0VmFsdWVzLCBTaW5nbGVQcm9wT2Zmc2V0VmFsdWVzSW5kZXgsIFN0eWxpbmdDb250ZXh0LCBTdHlsaW5nRmxhZ3MsIFN0eWxpbmdJbmRleH0gZnJvbSAnLi4vaW50ZXJmYWNlcy9zdHlsaW5nJztcbmltcG9ydCB7TFZpZXcsIFJvb3RDb250ZXh0fSBmcm9tICcuLi9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHtOT19DSEFOR0V9IGZyb20gJy4uL3Rva2Vucyc7XG5pbXBvcnQge2dldFJvb3RDb250ZXh0fSBmcm9tICcuLi91dGlsL3ZpZXdfdHJhdmVyc2FsX3V0aWxzJztcblxuaW1wb3J0IHtCb3VuZFBsYXllckZhY3Rvcnl9IGZyb20gJy4vcGxheWVyX2ZhY3RvcnknO1xuaW1wb3J0IHthZGRQbGF5ZXJJbnRlcm5hbCwgYWxsb2NQbGF5ZXJDb250ZXh0LCBhbGxvY2F0ZURpcmVjdGl2ZUludG9Db250ZXh0LCBjcmVhdGVFbXB0eVN0eWxpbmdDb250ZXh0LCBnZXRQbGF5ZXJDb250ZXh0fSBmcm9tICcuL3V0aWwnO1xuXG5cblxuLyoqXG4gKiBUaGlzIGZpbGUgaW5jbHVkZXMgdGhlIGNvZGUgdG8gcG93ZXIgYWxsIHN0eWxpbmctYmluZGluZyBvcGVyYXRpb25zIGluIEFuZ3VsYXIuXG4gKlxuICogVGhlc2UgaW5jbHVkZTpcbiAqIFtzdHlsZV09XCJteVN0eWxlT2JqXCJcbiAqIFtjbGFzc109XCJteUNsYXNzT2JqXCJcbiAqIFtzdHlsZS5wcm9wXT1cIm15UHJvcFZhbHVlXCJcbiAqIFtjbGFzcy5uYW1lXT1cIm15Q2xhc3NWYWx1ZVwiXG4gKlxuICogSXQgYWxzbyBpbmNsdWRlcyBjb2RlIHRoYXQgd2lsbCBhbGxvdyBzdHlsZSBiaW5kaW5nIGNvZGUgdG8gb3BlcmF0ZSB3aXRoaW4gaG9zdFxuICogYmluZGluZ3MgZm9yIGNvbXBvbmVudHMvZGlyZWN0aXZlcy5cbiAqXG4gKiBUaGVyZSBhcmUgbWFueSBkaWZmZXJlbnQgd2F5cyBpbiB3aGljaCB0aGVzZSBmdW5jdGlvbnMgYmVsb3cgYXJlIGNhbGxlZC4gUGxlYXNlIHNlZVxuICogYHJlbmRlcjMvaW50ZXJmYWNlcy9zdHlsaW5nLnRzYCB0byBnZXQgYSBiZXR0ZXIgaWRlYSBvZiBob3cgdGhlIHN0eWxpbmcgYWxnb3JpdGhtIHdvcmtzLlxuICovXG5cblxuXG4vKipcbiAqIENyZWF0ZXMgYSBuZXcgU3R5bGluZ0NvbnRleHQgYW4gZmlsbHMgaXQgd2l0aCB0aGUgcHJvdmlkZWQgc3RhdGljIHN0eWxpbmcgYXR0cmlidXRlIHZhbHVlcy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluaXRpYWxpemVTdGF0aWNDb250ZXh0KFxuICAgIGF0dHJzOiBUQXR0cmlidXRlcywgc3R5bGluZ1N0YXJ0SW5kZXg6IG51bWJlciwgZGlyZWN0aXZlUmVmPzogYW55IHwgbnVsbCk6IFN0eWxpbmdDb250ZXh0IHtcbiAgY29uc3QgY29udGV4dCA9IGNyZWF0ZUVtcHR5U3R5bGluZ0NvbnRleHQoKTtcbiAgcGF0Y2hDb250ZXh0V2l0aFN0YXRpY0F0dHJzKGNvbnRleHQsIGF0dHJzLCBzdHlsaW5nU3RhcnRJbmRleCwgZGlyZWN0aXZlUmVmKTtcbiAgcmV0dXJuIGNvbnRleHQ7XG59XG5cbi8qKlxuICogRGVzaWduZWQgdG8gdXBkYXRlIGFuIGV4aXN0aW5nIHN0eWxpbmcgY29udGV4dCB3aXRoIG5ldyBzdGF0aWMgc3R5bGluZ1xuICogZGF0YSAoY2xhc3NlcyBhbmQgc3R5bGVzKS5cbiAqXG4gKiBAcGFyYW0gY29udGV4dCB0aGUgZXhpc3Rpbmcgc3R5bGluZyBjb250ZXh0XG4gKiBAcGFyYW0gYXR0cnMgYW4gYXJyYXkgb2YgbmV3IHN0YXRpYyBzdHlsaW5nIGF0dHJpYnV0ZXMgdGhhdCB3aWxsIGJlXG4gKiAgICAgICAgICAgICAgYXNzaWduZWQgdG8gdGhlIGNvbnRleHRcbiAqIEBwYXJhbSBhdHRyc1N0eWxpbmdTdGFydEluZGV4IHdoYXQgaW5kZXggdG8gc3RhcnQgaXRlcmF0aW5nIHdpdGhpbiB0aGVcbiAqICAgICAgICAgICAgICBwcm92aWRlZCBgYXR0cnNgIGFycmF5IHRvIHN0YXJ0IHJlYWRpbmcgc3R5bGUgYW5kIGNsYXNzIHZhbHVlc1xuICogQHBhcmFtIGRpcmVjdGl2ZVJlZiB0aGUgZGlyZWN0aXZlIGluc3RhbmNlIHdpdGggd2hpY2ggc3RhdGljIGRhdGEgaXMgYXNzb2NpYXRlZCB3aXRoLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcGF0Y2hDb250ZXh0V2l0aFN0YXRpY0F0dHJzKFxuICAgIGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBhdHRyczogVEF0dHJpYnV0ZXMsIGF0dHJzU3R5bGluZ1N0YXJ0SW5kZXg6IG51bWJlcixcbiAgICBkaXJlY3RpdmVSZWY/OiBhbnkgfCBudWxsKTogdm9pZCB7XG4gIC8vIHRoaXMgbWVhbnMgdGhlIGNvbnRleHQgaGFzIGFscmVhZHkgYmVlbiBzZXQgYW5kIGluc3RhbnRpYXRlZFxuICBpZiAoY29udGV4dFtTdHlsaW5nSW5kZXguTWFzdGVyRmxhZ1Bvc2l0aW9uXSAmIFN0eWxpbmdGbGFncy5CaW5kaW5nQWxsb2NhdGlvbkxvY2tlZCkgcmV0dXJuO1xuXG4gIC8vIElmIHRoZSBzdHlsaW5nIGNvbnRleHQgaGFzIGFscmVhZHkgYmVlbiBwYXRjaGVkIHdpdGggdGhlIGdpdmVuIGRpcmVjdGl2ZSdzIGJpbmRpbmdzLFxuICAvLyB0aGVuIHRoZXJlIGlzIG5vIHBvaW50IGluIGRvaW5nIGl0IGFnYWluLiBUaGUgcmVhc29uIHdoeSB0aGlzIG1heSBoYXBwZW4gKHRoZSBkaXJlY3RpdmVcbiAgLy8gc3R5bGluZyBiZWluZyBwYXRjaGVkIHR3aWNlKSBpcyBiZWNhdXNlIHRoZSBgc3R5bGluZ0JpbmRpbmdgIGZ1bmN0aW9uIGlzIGNhbGxlZCBlYWNoIHRpbWVcbiAgLy8gYW4gZWxlbWVudCBpcyBjcmVhdGVkIChib3RoIHdpdGhpbiBhIHRlbXBsYXRlIGZ1bmN0aW9uIGFuZCB3aXRoaW4gZGlyZWN0aXZlIGhvc3QgYmluZGluZ3MpLlxuICBjb25zdCBkaXJlY3RpdmVzID0gY29udGV4dFtTdHlsaW5nSW5kZXguRGlyZWN0aXZlUmVnaXN0cnlQb3NpdGlvbl07XG4gIGxldCBkZXRlY3RlZEluZGV4ID0gZ2V0RGlyZWN0aXZlUmVnaXN0cnlWYWx1ZXNJbmRleE9mKGRpcmVjdGl2ZXMsIGRpcmVjdGl2ZVJlZiB8fCBudWxsKTtcbiAgaWYgKGRldGVjdGVkSW5kZXggPT09IC0xKSB7XG4gICAgLy8gdGhpcyBpcyBhIG5ldyBkaXJlY3RpdmUgd2hpY2ggd2UgaGF2ZSBub3Qgc2VlbiB5ZXQuXG4gICAgZGV0ZWN0ZWRJbmRleCA9IGFsbG9jYXRlRGlyZWN0aXZlSW50b0NvbnRleHQoY29udGV4dCwgZGlyZWN0aXZlUmVmKTtcbiAgfVxuICBjb25zdCBkaXJlY3RpdmVJbmRleCA9IGRldGVjdGVkSW5kZXggLyBEaXJlY3RpdmVSZWdpc3RyeVZhbHVlc0luZGV4LlNpemU7XG5cbiAgbGV0IGluaXRpYWxDbGFzc2VzOiBJbml0aWFsU3R5bGluZ1ZhbHVlc3xudWxsID0gbnVsbDtcbiAgbGV0IGluaXRpYWxTdHlsZXM6IEluaXRpYWxTdHlsaW5nVmFsdWVzfG51bGwgPSBudWxsO1xuICBsZXQgbW9kZSA9IC0xO1xuICBmb3IgKGxldCBpID0gYXR0cnNTdHlsaW5nU3RhcnRJbmRleDsgaSA8IGF0dHJzLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgYXR0ciA9IGF0dHJzW2ldO1xuICAgIGlmICh0eXBlb2YgYXR0ciA9PSAnbnVtYmVyJykge1xuICAgICAgbW9kZSA9IGF0dHI7XG4gICAgfSBlbHNlIGlmIChtb2RlID09IEF0dHJpYnV0ZU1hcmtlci5DbGFzc2VzKSB7XG4gICAgICBpbml0aWFsQ2xhc3NlcyA9IGluaXRpYWxDbGFzc2VzIHx8IGNvbnRleHRbU3R5bGluZ0luZGV4LkluaXRpYWxDbGFzc1ZhbHVlc1Bvc2l0aW9uXTtcbiAgICAgIHBhdGNoSW5pdGlhbFN0eWxpbmdWYWx1ZShpbml0aWFsQ2xhc3NlcywgYXR0ciwgdHJ1ZSwgZGlyZWN0aXZlSW5kZXgpO1xuICAgIH0gZWxzZSBpZiAobW9kZSA9PSBBdHRyaWJ1dGVNYXJrZXIuU3R5bGVzKSB7XG4gICAgICBpbml0aWFsU3R5bGVzID0gaW5pdGlhbFN0eWxlcyB8fCBjb250ZXh0W1N0eWxpbmdJbmRleC5Jbml0aWFsU3R5bGVWYWx1ZXNQb3NpdGlvbl07XG4gICAgICBwYXRjaEluaXRpYWxTdHlsaW5nVmFsdWUoaW5pdGlhbFN0eWxlcywgYXR0ciwgYXR0cnNbKytpXSwgZGlyZWN0aXZlSW5kZXgpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIERlc2lnbmVkIHRvIGFkZCBhIHN0eWxlIG9yIGNsYXNzIHZhbHVlIGludG8gdGhlIGV4aXN0aW5nIHNldCBvZiBpbml0aWFsIHN0eWxlcy5cbiAqXG4gKiBUaGUgZnVuY3Rpb24gd2lsbCBzZWFyY2ggYW5kIGZpZ3VyZSBvdXQgaWYgYSBzdHlsZS9jbGFzcyB2YWx1ZSBpcyBhbHJlYWR5IHByZXNlbnRcbiAqIHdpdGhpbiB0aGUgcHJvdmlkZWQgaW5pdGlhbCBzdHlsaW5nIGFycmF5LiBJZiBhbmQgd2hlbiBhIHN0eWxlL2NsYXNzIHZhbHVlIGlzXG4gKiBwcmVzZW50IChhbGxvY2F0ZWQpIHRoZW4gdGhlIGNvZGUgYmVsb3cgd2lsbCBzZXQgdGhlIG5ldyB2YWx1ZSBkZXBlbmRpbmcgb24gdGhlXG4gKiBmb2xsb3dpbmcgY2FzZXM6XG4gKlxuICogIDEpIGlmIHRoZSBleGlzdGluZyB2YWx1ZSBpcyBmYWxzeSAodGhpcyBoYXBwZW5zIGJlY2F1c2UgYSBgW2NsYXNzLnByb3BdYCBvclxuICogICAgIGBbc3R5bGUucHJvcF1gIGJpbmRpbmcgd2FzIHNldCwgYnV0IHRoZXJlIHdhc24ndCBhIG1hdGNoaW5nIHN0YXRpYyBzdHlsZVxuICogICAgIG9yIGNsYXNzIHByZXNlbnQgb24gdGhlIGNvbnRleHQpXG4gKiAgMikgaWYgdGhlIHZhbHVlIHdhcyBzZXQgYWxyZWFkeSBieSB0aGUgdGVtcGxhdGUsIGNvbXBvbmVudCBvciBkaXJlY3RpdmUsIGJ1dCB0aGVcbiAqICAgICBuZXcgdmFsdWUgaXMgc2V0IG9uIGEgaGlnaGVyIGxldmVsIChpLmUuIGEgc3ViIGNvbXBvbmVudCB3aGljaCBleHRlbmRzIGEgcGFyZW50XG4gKiAgICAgY29tcG9uZW50IHNldHMgaXRzIHZhbHVlIGFmdGVyIHRoZSBwYXJlbnQgaGFzIGFscmVhZHkgc2V0IHRoZSBzYW1lIG9uZSlcbiAqICAzKSBpZiB0aGUgc2FtZSBkaXJlY3RpdmUgcHJvdmlkZXMgYSBuZXcgc2V0IG9mIHN0eWxpbmcgdmFsdWVzIHRvIHNldFxuICpcbiAqIEBwYXJhbSBpbml0aWFsU3R5bGluZyB0aGUgaW5pdGlhbCBzdHlsaW5nIGFycmF5IHdoZXJlIHRoZSBuZXcgc3R5bGluZyBlbnRyeSB3aWxsIGJlIGFkZGVkIHRvXG4gKiBAcGFyYW0gcHJvcCB0aGUgcHJvcGVydHkgdmFsdWUgb2YgdGhlIG5ldyBlbnRyeSAoZS5nLiBgd2lkdGhgIChzdHlsZXMpIG9yIGBmb29gIChjbGFzc2VzKSlcbiAqIEBwYXJhbSB2YWx1ZSB0aGUgc3R5bGluZyB2YWx1ZSBvZiB0aGUgbmV3IGVudHJ5IChlLmcuIGBhYnNvbHV0ZWAgKHN0eWxlcykgb3IgYHRydWVgIChjbGFzc2VzKSlcbiAqIEBwYXJhbSBkaXJlY3RpdmVPd25lckluZGV4IHRoZSBkaXJlY3RpdmUgb3duZXIgaW5kZXggdmFsdWUgb2YgdGhlIHN0eWxpbmcgc291cmNlIHJlc3BvbnNpYmxlXG4gKiAgICAgICAgZm9yIHRoZXNlIHN0eWxlcyAoc2VlIGBpbnRlcmZhY2VzL3N0eWxpbmcudHMjZGlyZWN0aXZlc2AgZm9yIG1vcmUgaW5mbylcbiAqL1xuZnVuY3Rpb24gcGF0Y2hJbml0aWFsU3R5bGluZ1ZhbHVlKFxuICAgIGluaXRpYWxTdHlsaW5nOiBJbml0aWFsU3R5bGluZ1ZhbHVlcywgcHJvcDogc3RyaW5nLCB2YWx1ZTogYW55LFxuICAgIGRpcmVjdGl2ZU93bmVySW5kZXg6IG51bWJlcik6IHZvaWQge1xuICBmb3IgKGxldCBpID0gSW5pdGlhbFN0eWxpbmdWYWx1ZXNJbmRleC5LZXlWYWx1ZVN0YXJ0UG9zaXRpb247IGkgPCBpbml0aWFsU3R5bGluZy5sZW5ndGg7XG4gICAgICAgaSArPSBJbml0aWFsU3R5bGluZ1ZhbHVlc0luZGV4LlNpemUpIHtcbiAgICBjb25zdCBrZXkgPSBpbml0aWFsU3R5bGluZ1tpICsgSW5pdGlhbFN0eWxpbmdWYWx1ZXNJbmRleC5Qcm9wT2Zmc2V0XTtcbiAgICBpZiAoa2V5ID09PSBwcm9wKSB7XG4gICAgICBjb25zdCBleGlzdGluZ1ZhbHVlID1cbiAgICAgICAgICBpbml0aWFsU3R5bGluZ1tpICsgSW5pdGlhbFN0eWxpbmdWYWx1ZXNJbmRleC5WYWx1ZU9mZnNldF0gYXMgc3RyaW5nIHwgbnVsbCB8IGJvb2xlYW47XG4gICAgICBjb25zdCBleGlzdGluZ093bmVyID1cbiAgICAgICAgICBpbml0aWFsU3R5bGluZ1tpICsgSW5pdGlhbFN0eWxpbmdWYWx1ZXNJbmRleC5EaXJlY3RpdmVPd25lck9mZnNldF0gYXMgbnVtYmVyO1xuICAgICAgaWYgKGFsbG93VmFsdWVDaGFuZ2UoZXhpc3RpbmdWYWx1ZSwgdmFsdWUsIGV4aXN0aW5nT3duZXIsIGRpcmVjdGl2ZU93bmVySW5kZXgpKSB7XG4gICAgICAgIGFkZE9yVXBkYXRlU3RhdGljU3R5bGUoaSwgaW5pdGlhbFN0eWxpbmcsIHByb3AsIHZhbHVlLCBkaXJlY3RpdmVPd25lckluZGV4KTtcbiAgICAgIH1cbiAgICAgIHJldHVybjtcbiAgICB9XG4gIH1cblxuICAvLyBXZSBkaWQgbm90IGZpbmQgZXhpc3Rpbmcga2V5LCBhZGQgYSBuZXcgb25lLlxuICBhZGRPclVwZGF0ZVN0YXRpY1N0eWxlKG51bGwsIGluaXRpYWxTdHlsaW5nLCBwcm9wLCB2YWx1ZSwgZGlyZWN0aXZlT3duZXJJbmRleCk7XG59XG5cbi8qKlxuICogUnVucyB0aHJvdWdoIHRoZSBpbml0aWFsIGNsYXNzIHZhbHVlcyBwcmVzZW50IGluIHRoZSBwcm92aWRlZFxuICogY29udGV4dCBhbmQgcmVuZGVycyB0aGVtIHZpYSB0aGUgcHJvdmlkZWQgcmVuZGVyZXIgb24gdGhlIGVsZW1lbnQuXG4gKlxuICogQHBhcmFtIGVsZW1lbnQgdGhlIGVsZW1lbnQgdGhlIHN0eWxpbmcgd2lsbCBiZSBhcHBsaWVkIHRvXG4gKiBAcGFyYW0gY29udGV4dCB0aGUgc291cmNlIHN0eWxpbmcgY29udGV4dCB3aGljaCBjb250YWlucyB0aGUgaW5pdGlhbCBjbGFzcyB2YWx1ZXNcbiAqIEBwYXJhbSByZW5kZXJlciB0aGUgcmVuZGVyZXIgaW5zdGFuY2UgdGhhdCB3aWxsIGJlIHVzZWQgdG8gYXBwbHkgdGhlIGNsYXNzXG4gKiBAcmV0dXJucyB0aGUgaW5kZXggdGhhdCB0aGUgY2xhc3NlcyB3ZXJlIGFwcGxpZWQgdXAgdW50aWxcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlbmRlckluaXRpYWxDbGFzc2VzKFxuICAgIGVsZW1lbnQ6IFJFbGVtZW50LCBjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgcmVuZGVyZXI6IFJlbmRlcmVyMywgc3RhcnRJbmRleD86IG51bWJlcik6IG51bWJlciB7XG4gIGNvbnN0IGluaXRpYWxDbGFzc2VzID0gY29udGV4dFtTdHlsaW5nSW5kZXguSW5pdGlhbENsYXNzVmFsdWVzUG9zaXRpb25dO1xuICBsZXQgaSA9IHN0YXJ0SW5kZXggfHwgSW5pdGlhbFN0eWxpbmdWYWx1ZXNJbmRleC5LZXlWYWx1ZVN0YXJ0UG9zaXRpb247XG4gIHdoaWxlIChpIDwgaW5pdGlhbENsYXNzZXMubGVuZ3RoKSB7XG4gICAgY29uc3QgdmFsdWUgPSBpbml0aWFsQ2xhc3Nlc1tpICsgSW5pdGlhbFN0eWxpbmdWYWx1ZXNJbmRleC5WYWx1ZU9mZnNldF07XG4gICAgaWYgKHZhbHVlKSB7XG4gICAgICBzZXRDbGFzcyhcbiAgICAgICAgICBlbGVtZW50LCBpbml0aWFsQ2xhc3Nlc1tpICsgSW5pdGlhbFN0eWxpbmdWYWx1ZXNJbmRleC5Qcm9wT2Zmc2V0XSBhcyBzdHJpbmcsIHRydWUsXG4gICAgICAgICAgcmVuZGVyZXIsIG51bGwpO1xuICAgIH1cbiAgICBpICs9IEluaXRpYWxTdHlsaW5nVmFsdWVzSW5kZXguU2l6ZTtcbiAgfVxuICByZXR1cm4gaTtcbn1cblxuLyoqXG4gKiBSdW5zIHRocm91Z2ggdGhlIGluaXRpYWwgc3R5bGVzIHZhbHVlcyBwcmVzZW50IGluIHRoZSBwcm92aWRlZFxuICogY29udGV4dCBhbmQgcmVuZGVycyB0aGVtIHZpYSB0aGUgcHJvdmlkZWQgcmVuZGVyZXIgb24gdGhlIGVsZW1lbnQuXG4gKlxuICogQHBhcmFtIGVsZW1lbnQgdGhlIGVsZW1lbnQgdGhlIHN0eWxpbmcgd2lsbCBiZSBhcHBsaWVkIHRvXG4gKiBAcGFyYW0gY29udGV4dCB0aGUgc291cmNlIHN0eWxpbmcgY29udGV4dCB3aGljaCBjb250YWlucyB0aGUgaW5pdGlhbCBjbGFzcyB2YWx1ZXNcbiAqIEBwYXJhbSByZW5kZXJlciB0aGUgcmVuZGVyZXIgaW5zdGFuY2UgdGhhdCB3aWxsIGJlIHVzZWQgdG8gYXBwbHkgdGhlIGNsYXNzXG4gKiBAcmV0dXJucyB0aGUgaW5kZXggdGhhdCB0aGUgc3R5bGVzIHdlcmUgYXBwbGllZCB1cCB1bnRpbFxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVuZGVySW5pdGlhbFN0eWxlcyhcbiAgICBlbGVtZW50OiBSRWxlbWVudCwgY29udGV4dDogU3R5bGluZ0NvbnRleHQsIHJlbmRlcmVyOiBSZW5kZXJlcjMsIHN0YXJ0SW5kZXg/OiBudW1iZXIpIHtcbiAgY29uc3QgaW5pdGlhbFN0eWxlcyA9IGNvbnRleHRbU3R5bGluZ0luZGV4LkluaXRpYWxTdHlsZVZhbHVlc1Bvc2l0aW9uXTtcbiAgbGV0IGkgPSBzdGFydEluZGV4IHx8IEluaXRpYWxTdHlsaW5nVmFsdWVzSW5kZXguS2V5VmFsdWVTdGFydFBvc2l0aW9uO1xuICB3aGlsZSAoaSA8IGluaXRpYWxTdHlsZXMubGVuZ3RoKSB7XG4gICAgY29uc3QgdmFsdWUgPSBpbml0aWFsU3R5bGVzW2kgKyBJbml0aWFsU3R5bGluZ1ZhbHVlc0luZGV4LlZhbHVlT2Zmc2V0XTtcbiAgICBpZiAodmFsdWUpIHtcbiAgICAgIHNldFN0eWxlKFxuICAgICAgICAgIGVsZW1lbnQsIGluaXRpYWxTdHlsZXNbaSArIEluaXRpYWxTdHlsaW5nVmFsdWVzSW5kZXguUHJvcE9mZnNldF0gYXMgc3RyaW5nLFxuICAgICAgICAgIHZhbHVlIGFzIHN0cmluZywgcmVuZGVyZXIsIG51bGwpO1xuICAgIH1cbiAgICBpICs9IEluaXRpYWxTdHlsaW5nVmFsdWVzSW5kZXguU2l6ZTtcbiAgfVxuICByZXR1cm4gaTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGFsbG93TmV3QmluZGluZ3NGb3JTdHlsaW5nQ29udGV4dChjb250ZXh0OiBTdHlsaW5nQ29udGV4dCk6IGJvb2xlYW4ge1xuICByZXR1cm4gKGNvbnRleHRbU3R5bGluZ0luZGV4Lk1hc3RlckZsYWdQb3NpdGlvbl0gJiBTdHlsaW5nRmxhZ3MuQmluZGluZ0FsbG9jYXRpb25Mb2NrZWQpID09PSAwO1xufVxuXG4vKipcbiAqIEFkZHMgaW4gbmV3IGJpbmRpbmcgdmFsdWVzIHRvIGEgc3R5bGluZyBjb250ZXh0LlxuICpcbiAqIElmIGEgZGlyZWN0aXZlIHZhbHVlIGlzIHByb3ZpZGVkIHRoZW4gYWxsIHByb3ZpZGVkIGNsYXNzL3N0eWxlIGJpbmRpbmcgbmFtZXMgd2lsbFxuICogcmVmZXJlbmNlIHRoZSBwcm92aWRlZCBkaXJlY3RpdmUuXG4gKlxuICogQHBhcmFtIGNvbnRleHQgdGhlIGV4aXN0aW5nIHN0eWxpbmcgY29udGV4dFxuICogQHBhcmFtIGRpcmVjdGl2ZVJlZiB0aGUgZGlyZWN0aXZlIHRoYXQgdGhlIG5ldyBiaW5kaW5ncyB3aWxsIHJlZmVyZW5jZVxuICogQHBhcmFtIGNsYXNzQmluZGluZ05hbWVzIGFuIGFycmF5IG9mIGNsYXNzIGJpbmRpbmcgbmFtZXMgdGhhdCB3aWxsIGJlIGFkZGVkIHRvIHRoZSBjb250ZXh0XG4gKiBAcGFyYW0gc3R5bGVCaW5kaW5nTmFtZXMgYW4gYXJyYXkgb2Ygc3R5bGUgYmluZGluZyBuYW1lcyB0aGF0IHdpbGwgYmUgYWRkZWQgdG8gdGhlIGNvbnRleHRcbiAqIEBwYXJhbSBzdHlsZVNhbml0aXplciBhbiBvcHRpb25hbCBzYW5pdGl6ZXIgdGhhdCBoYW5kbGUgYWxsIHNhbml0aXphdGlvbiBvbiBmb3IgZWFjaCBvZlxuICogICAgdGhlIGJpbmRpbmdzIGFkZGVkIHRvIHRoZSBjb250ZXh0LiBOb3RlIHRoYXQgaWYgYSBkaXJlY3RpdmUgaXMgcHJvdmlkZWQgdGhlbiB0aGUgc2FuaXRpemVyXG4gKiAgICBpbnN0YW5jZSB3aWxsIG9ubHkgYmUgYWN0aXZlIGlmIGFuZCB3aGVuIHRoZSBkaXJlY3RpdmUgdXBkYXRlcyB0aGUgYmluZGluZ3MgdGhhdCBpdCBvd25zLlxuICovXG5leHBvcnQgZnVuY3Rpb24gdXBkYXRlQ29udGV4dFdpdGhCaW5kaW5ncyhcbiAgICBjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgZGlyZWN0aXZlUmVmOiBhbnkgfCBudWxsLCBjbGFzc0JpbmRpbmdOYW1lcz86IHN0cmluZ1tdIHwgbnVsbCxcbiAgICBzdHlsZUJpbmRpbmdOYW1lcz86IHN0cmluZ1tdIHwgbnVsbCwgc3R5bGVTYW5pdGl6ZXI/OiBTdHlsZVNhbml0aXplRm4gfCBudWxsKSB7XG4gIGlmIChjb250ZXh0W1N0eWxpbmdJbmRleC5NYXN0ZXJGbGFnUG9zaXRpb25dICYgU3R5bGluZ0ZsYWdzLkJpbmRpbmdBbGxvY2F0aW9uTG9ja2VkKSByZXR1cm47XG5cbiAgLy8gdGhpcyBtZWFucyB0aGUgY29udGV4dCBoYXMgYWxyZWFkeSBiZWVuIHBhdGNoZWQgd2l0aCB0aGUgZGlyZWN0aXZlJ3MgYmluZGluZ3NcbiAgY29uc3QgZGlyZWN0aXZlSW5kZXggPSBmaW5kT3JQYXRjaERpcmVjdGl2ZUludG9SZWdpc3RyeShjb250ZXh0LCBkaXJlY3RpdmVSZWYsIHN0eWxlU2FuaXRpemVyKTtcbiAgaWYgKGRpcmVjdGl2ZUluZGV4ID09PSAtMSkge1xuICAgIC8vIHRoaXMgbWVhbnMgdGhlIGRpcmVjdGl2ZSBoYXMgYWxyZWFkeSBiZWVuIHBhdGNoZWQgaW4gLi4uIE5vIHBvaW50IGluIGRvaW5nIGFueXRoaW5nXG4gICAgcmV0dXJuO1xuICB9XG5cbiAgaWYgKHN0eWxlQmluZGluZ05hbWVzKSB7XG4gICAgc3R5bGVCaW5kaW5nTmFtZXMgPSBoeXBoZW5hdGVFbnRyaWVzKHN0eWxlQmluZGluZ05hbWVzKTtcbiAgfVxuXG4gIC8vIHRoZXJlIGFyZSBhbG90IG9mIHZhcmlhYmxlcyBiZWluZyB1c2VkIGJlbG93IHRvIHRyYWNrIHdoZXJlIGluIHRoZSBjb250ZXh0IHRoZSBuZXdcbiAgLy8gYmluZGluZyB2YWx1ZXMgd2lsbCBiZSBwbGFjZWQuIEJlY2F1c2UgdGhlIGNvbnRleHQgY29uc2lzdHMgb2YgbXVsdGlwbGUgdHlwZXMgb2ZcbiAgLy8gZW50cmllcyAoc2luZ2xlIGNsYXNzZXMvc3R5bGVzIGFuZCBtdWx0aSBjbGFzc2VzL3N0eWxlcykgYWxvdCBvZiB0aGUgaW5kZXggcG9zaXRpb25zXG4gIC8vIG5lZWQgdG8gYmUgY29tcHV0ZWQgYWhlYWQgb2YgdGltZSBhbmQgdGhlIGNvbnRleHQgbmVlZHMgdG8gYmUgZXh0ZW5kZWQgYmVmb3JlIHRoZSB2YWx1ZXNcbiAgLy8gYXJlIGluc2VydGVkIGluLlxuICBjb25zdCBzaW5nbGVQcm9wT2Zmc2V0VmFsdWVzID0gY29udGV4dFtTdHlsaW5nSW5kZXguU2luZ2xlUHJvcE9mZnNldFBvc2l0aW9uc107XG4gIGNvbnN0IHRvdGFsQ3VycmVudENsYXNzQmluZGluZ3MgPVxuICAgICAgc2luZ2xlUHJvcE9mZnNldFZhbHVlc1tTaW5nbGVQcm9wT2Zmc2V0VmFsdWVzSW5kZXguQ2xhc3Nlc0NvdW50UG9zaXRpb25dO1xuICBjb25zdCB0b3RhbEN1cnJlbnRTdHlsZUJpbmRpbmdzID1cbiAgICAgIHNpbmdsZVByb3BPZmZzZXRWYWx1ZXNbU2luZ2xlUHJvcE9mZnNldFZhbHVlc0luZGV4LlN0eWxlc0NvdW50UG9zaXRpb25dO1xuXG4gIGNvbnN0IGNhY2hlZENsYXNzTWFwVmFsdWVzID0gY29udGV4dFtTdHlsaW5nSW5kZXguQ2FjaGVkTXVsdGlDbGFzc2VzXTtcbiAgY29uc3QgY2FjaGVkU3R5bGVNYXBWYWx1ZXMgPSBjb250ZXh0W1N0eWxpbmdJbmRleC5DYWNoZWRNdWx0aVN0eWxlc107XG5cbiAgY29uc3QgY2xhc3Nlc09mZnNldCA9IHRvdGFsQ3VycmVudENsYXNzQmluZGluZ3MgKiBTdHlsaW5nSW5kZXguU2l6ZTtcbiAgY29uc3Qgc3R5bGVzT2Zmc2V0ID0gdG90YWxDdXJyZW50U3R5bGVCaW5kaW5ncyAqIFN0eWxpbmdJbmRleC5TaXplO1xuXG4gIGNvbnN0IHNpbmdsZVN0eWxlc1N0YXJ0SW5kZXggPSBTdHlsaW5nSW5kZXguU2luZ2xlU3R5bGVzU3RhcnRQb3NpdGlvbjtcbiAgbGV0IHNpbmdsZUNsYXNzZXNTdGFydEluZGV4ID0gc2luZ2xlU3R5bGVzU3RhcnRJbmRleCArIHN0eWxlc09mZnNldDtcbiAgbGV0IG11bHRpU3R5bGVzU3RhcnRJbmRleCA9IHNpbmdsZUNsYXNzZXNTdGFydEluZGV4ICsgY2xhc3Nlc09mZnNldDtcbiAgbGV0IG11bHRpQ2xhc3Nlc1N0YXJ0SW5kZXggPSBtdWx0aVN0eWxlc1N0YXJ0SW5kZXggKyBzdHlsZXNPZmZzZXQ7XG5cbiAgLy8gYmVjYXVzZSB3ZSdyZSBpbnNlcnRpbmcgbW9yZSBiaW5kaW5ncyBpbnRvIHRoZSBjb250ZXh0LCB0aGlzIG1lYW5zIHRoYXQgdGhlXG4gIC8vIGJpbmRpbmcgdmFsdWVzIG5lZWQgdG8gYmUgcmVmZXJlbmNlZCB0aGUgc2luZ2xlUHJvcE9mZnNldFZhbHVlcyBhcnJheSBzbyB0aGF0XG4gIC8vIHRoZSB0ZW1wbGF0ZS9kaXJlY3RpdmUgY2FuIGVhc2lseSBmaW5kIHRoZW0gaW5zaWRlIG9mIHRoZSBgZWxlbWVudFN0eWxlUHJvcGBcbiAgLy8gYW5kIHRoZSBgZWxlbWVudENsYXNzUHJvcGAgZnVuY3Rpb25zIHdpdGhvdXQgaXRlcmF0aW5nIHRocm91Z2ggdGhlIGVudGlyZSBjb250ZXh0LlxuICAvLyBUaGUgZmlyc3Qgc3RlcCB0byBzZXR0aW5nIHVwIHRoZXNlIHJlZmVyZW5jZSBwb2ludHMgaXMgdG8gbWFyayBob3cgbWFueSBiaW5kaW5nc1xuICAvLyBhcmUgYmVpbmcgYWRkZWQuIEV2ZW4gaWYgdGhlc2UgYmluZGluZ3MgYWxyZWFkeSBleGlzdCBpbiB0aGUgY29udGV4dCwgdGhlIGRpcmVjdGl2ZVxuICAvLyBvciB0ZW1wbGF0ZSBjb2RlIHdpbGwgc3RpbGwgY2FsbCB0aGVtIHVua25vd2luZ2x5LiBUaGVyZWZvcmUgdGhlIHRvdGFsIHZhbHVlcyBuZWVkXG4gIC8vIHRvIGJlIHJlZ2lzdGVyZWQgc28gdGhhdCB3ZSBrbm93IGhvdyBtYW55IGJpbmRpbmdzIGFyZSBhc3NpZ25lZCB0byBlYWNoIGRpcmVjdGl2ZS5cbiAgY29uc3QgY3VycmVudFNpbmdsZVByb3BzTGVuZ3RoID0gc2luZ2xlUHJvcE9mZnNldFZhbHVlcy5sZW5ndGg7XG4gIHNpbmdsZVByb3BPZmZzZXRWYWx1ZXMucHVzaChcbiAgICAgIHN0eWxlQmluZGluZ05hbWVzID8gc3R5bGVCaW5kaW5nTmFtZXMubGVuZ3RoIDogMCxcbiAgICAgIGNsYXNzQmluZGluZ05hbWVzID8gY2xhc3NCaW5kaW5nTmFtZXMubGVuZ3RoIDogMCk7XG5cbiAgLy8gdGhlIGNvZGUgYmVsb3cgd2lsbCBjaGVjayB0byBzZWUgaWYgYSBuZXcgc3R5bGUgYmluZGluZyBhbHJlYWR5IGV4aXN0cyBpbiB0aGUgY29udGV4dFxuICAvLyBpZiBzbyB0aGVuIHRoZXJlIGlzIG5vIHBvaW50IGluIGluc2VydGluZyBpdCBpbnRvIHRoZSBjb250ZXh0IGFnYWluLiBXaGV0aGVyIG9yIG5vdCBpdFxuICAvLyBleGlzdHMgdGhlIHN0eWxpbmcgb2Zmc2V0IGNvZGUgd2lsbCBub3cga25vdyBleGFjdGx5IHdoZXJlIGl0IGlzXG4gIGxldCBpbnNlcnRpb25PZmZzZXQgPSAwO1xuICBjb25zdCBmaWx0ZXJlZFN0eWxlQmluZGluZ05hbWVzOiBzdHJpbmdbXSA9IFtdO1xuICBpZiAoc3R5bGVCaW5kaW5nTmFtZXMgJiYgc3R5bGVCaW5kaW5nTmFtZXMubGVuZ3RoKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzdHlsZUJpbmRpbmdOYW1lcy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgbmFtZSA9IHN0eWxlQmluZGluZ05hbWVzW2ldO1xuICAgICAgbGV0IHNpbmdsZVByb3BJbmRleCA9XG4gICAgICAgICAgZ2V0TWF0Y2hpbmdCaW5kaW5nSW5kZXgoY29udGV4dCwgbmFtZSwgc2luZ2xlU3R5bGVzU3RhcnRJbmRleCwgc2luZ2xlQ2xhc3Nlc1N0YXJ0SW5kZXgpO1xuICAgICAgaWYgKHNpbmdsZVByb3BJbmRleCA9PSAtMSkge1xuICAgICAgICBzaW5nbGVQcm9wSW5kZXggPSBzaW5nbGVDbGFzc2VzU3RhcnRJbmRleCArIGluc2VydGlvbk9mZnNldDtcbiAgICAgICAgaW5zZXJ0aW9uT2Zmc2V0ICs9IFN0eWxpbmdJbmRleC5TaXplO1xuICAgICAgICBmaWx0ZXJlZFN0eWxlQmluZGluZ05hbWVzLnB1c2gobmFtZSk7XG4gICAgICB9XG4gICAgICBzaW5nbGVQcm9wT2Zmc2V0VmFsdWVzLnB1c2goc2luZ2xlUHJvcEluZGV4KTtcbiAgICB9XG4gIH1cblxuICAvLyBqdXN0IGxpa2Ugd2l0aCB0aGUgc3R5bGUgYmluZGluZyBsb29wIGFib3ZlLCB0aGUgbmV3IGNsYXNzIGJpbmRpbmdzIGdldCB0aGUgc2FtZSB0cmVhdG1lbnQuLi5cbiAgY29uc3QgZmlsdGVyZWRDbGFzc0JpbmRpbmdOYW1lczogc3RyaW5nW10gPSBbXTtcbiAgaWYgKGNsYXNzQmluZGluZ05hbWVzICYmIGNsYXNzQmluZGluZ05hbWVzLmxlbmd0aCkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY2xhc3NCaW5kaW5nTmFtZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IG5hbWUgPSBjbGFzc0JpbmRpbmdOYW1lc1tpXTtcbiAgICAgIGxldCBzaW5nbGVQcm9wSW5kZXggPVxuICAgICAgICAgIGdldE1hdGNoaW5nQmluZGluZ0luZGV4KGNvbnRleHQsIG5hbWUsIHNpbmdsZUNsYXNzZXNTdGFydEluZGV4LCBtdWx0aVN0eWxlc1N0YXJ0SW5kZXgpO1xuICAgICAgaWYgKHNpbmdsZVByb3BJbmRleCA9PSAtMSkge1xuICAgICAgICBzaW5nbGVQcm9wSW5kZXggPSBtdWx0aVN0eWxlc1N0YXJ0SW5kZXggKyBpbnNlcnRpb25PZmZzZXQ7XG4gICAgICAgIGluc2VydGlvbk9mZnNldCArPSBTdHlsaW5nSW5kZXguU2l6ZTtcbiAgICAgICAgZmlsdGVyZWRDbGFzc0JpbmRpbmdOYW1lcy5wdXNoKG5hbWUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc2luZ2xlUHJvcEluZGV4ICs9IGZpbHRlcmVkU3R5bGVCaW5kaW5nTmFtZXMubGVuZ3RoICogU3R5bGluZ0luZGV4LlNpemU7XG4gICAgICB9XG4gICAgICBzaW5nbGVQcm9wT2Zmc2V0VmFsdWVzLnB1c2goc2luZ2xlUHJvcEluZGV4KTtcbiAgICB9XG4gIH1cblxuICAvLyBiZWNhdXNlIG5ldyBzdHlsZXMgYXJlIGJlaW5nIGluc2VydGVkLCB0aGlzIG1lYW5zIHRoZSBleGlzdGluZyBjb2xsZWN0aW9uIG9mIHN0eWxlIG9mZnNldFxuICAvLyBpbmRleCB2YWx1ZXMgYXJlIGluY29ycmVjdCAodGhleSBwb2ludCB0byB0aGUgd3JvbmcgdmFsdWVzKS4gVGhlIGNvZGUgYmVsb3cgd2lsbCBydW4gdGhyb3VnaFxuICAvLyB0aGUgZW50aXJlIG9mZnNldCBhcnJheSBhbmQgdXBkYXRlIHRoZSBleGlzdGluZyBzZXQgb2YgaW5kZXggdmFsdWVzIHRvIHBvaW50IHRvIHRoZWlyIG5ld1xuICAvLyBsb2NhdGlvbnMgd2hpbGUgdGFraW5nIHRoZSBuZXcgYmluZGluZyB2YWx1ZXMgaW50byBjb25zaWRlcmF0aW9uLlxuICBsZXQgaSA9IFNpbmdsZVByb3BPZmZzZXRWYWx1ZXNJbmRleC5WYWx1ZVN0YXJ0UG9zaXRpb247XG4gIGlmIChmaWx0ZXJlZFN0eWxlQmluZGluZ05hbWVzLmxlbmd0aCkge1xuICAgIHdoaWxlIChpIDwgY3VycmVudFNpbmdsZVByb3BzTGVuZ3RoKSB7XG4gICAgICBjb25zdCB0b3RhbFN0eWxlcyA9XG4gICAgICAgICAgc2luZ2xlUHJvcE9mZnNldFZhbHVlc1tpICsgU2luZ2xlUHJvcE9mZnNldFZhbHVlc0luZGV4LlN0eWxlc0NvdW50UG9zaXRpb25dO1xuICAgICAgY29uc3QgdG90YWxDbGFzc2VzID1cbiAgICAgICAgICBzaW5nbGVQcm9wT2Zmc2V0VmFsdWVzW2kgKyBTaW5nbGVQcm9wT2Zmc2V0VmFsdWVzSW5kZXguQ2xhc3Nlc0NvdW50UG9zaXRpb25dO1xuICAgICAgaWYgKHRvdGFsQ2xhc3Nlcykge1xuICAgICAgICBjb25zdCBzdGFydCA9IGkgKyBTaW5nbGVQcm9wT2Zmc2V0VmFsdWVzSW5kZXguVmFsdWVTdGFydFBvc2l0aW9uICsgdG90YWxTdHlsZXM7XG4gICAgICAgIGZvciAobGV0IGogPSBzdGFydDsgaiA8IHN0YXJ0ICsgdG90YWxDbGFzc2VzOyBqKyspIHtcbiAgICAgICAgICBzaW5nbGVQcm9wT2Zmc2V0VmFsdWVzW2pdICs9IGZpbHRlcmVkU3R5bGVCaW5kaW5nTmFtZXMubGVuZ3RoICogU3R5bGluZ0luZGV4LlNpemU7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgY29uc3QgdG90YWwgPSB0b3RhbFN0eWxlcyArIHRvdGFsQ2xhc3NlcztcbiAgICAgIGkgKz0gU2luZ2xlUHJvcE9mZnNldFZhbHVlc0luZGV4LlZhbHVlU3RhcnRQb3NpdGlvbiArIHRvdGFsO1xuICAgIH1cbiAgfVxuXG4gIGNvbnN0IHRvdGFsTmV3RW50cmllcyA9IGZpbHRlcmVkQ2xhc3NCaW5kaW5nTmFtZXMubGVuZ3RoICsgZmlsdGVyZWRTdHlsZUJpbmRpbmdOYW1lcy5sZW5ndGg7XG5cbiAgLy8gaW4gdGhlIGV2ZW50IHRoYXQgdGhlcmUgYXJlIG5ldyBzdHlsZSB2YWx1ZXMgYmVpbmcgaW5zZXJ0ZWQsIGFsbCBleGlzdGluZyBjbGFzcyBhbmQgc3R5bGVcbiAgLy8gYmluZGluZ3MgbmVlZCB0byBoYXZlIHRoZWlyIHBvaW50ZXIgdmFsdWVzIG9mZnNldHRlZCB3aXRoIHRoZSBuZXcgYW1vdW50IG9mIHNwYWNlIHRoYXQgaXNcbiAgLy8gdXNlZCBmb3IgdGhlIG5ldyBzdHlsZS9jbGFzcyBiaW5kaW5ncy5cbiAgZm9yIChsZXQgaSA9IHNpbmdsZVN0eWxlc1N0YXJ0SW5kZXg7IGkgPCBjb250ZXh0Lmxlbmd0aDsgaSArPSBTdHlsaW5nSW5kZXguU2l6ZSkge1xuICAgIGNvbnN0IGlzTXVsdGlCYXNlZCA9IGkgPj0gbXVsdGlTdHlsZXNTdGFydEluZGV4O1xuICAgIGNvbnN0IGlzQ2xhc3NCYXNlZCA9IGkgPj0gKGlzTXVsdGlCYXNlZCA/IG11bHRpQ2xhc3Nlc1N0YXJ0SW5kZXggOiBzaW5nbGVDbGFzc2VzU3RhcnRJbmRleCk7XG4gICAgY29uc3QgZmxhZyA9IGdldFBvaW50ZXJzKGNvbnRleHQsIGkpO1xuICAgIGNvbnN0IHN0YXRpY0luZGV4ID0gZ2V0SW5pdGlhbEluZGV4KGZsYWcpO1xuICAgIGxldCBzaW5nbGVPck11bHRpSW5kZXggPSBnZXRNdWx0aU9yU2luZ2xlSW5kZXgoZmxhZyk7XG4gICAgaWYgKGlzTXVsdGlCYXNlZCkge1xuICAgICAgc2luZ2xlT3JNdWx0aUluZGV4ICs9XG4gICAgICAgICAgaXNDbGFzc0Jhc2VkID8gKGZpbHRlcmVkU3R5bGVCaW5kaW5nTmFtZXMubGVuZ3RoICogU3R5bGluZ0luZGV4LlNpemUpIDogMDtcbiAgICB9IGVsc2Uge1xuICAgICAgc2luZ2xlT3JNdWx0aUluZGV4ICs9ICh0b3RhbE5ld0VudHJpZXMgKiBTdHlsaW5nSW5kZXguU2l6ZSkgK1xuICAgICAgICAgICgoaXNDbGFzc0Jhc2VkID8gZmlsdGVyZWRTdHlsZUJpbmRpbmdOYW1lcy5sZW5ndGggOiAwKSAqIFN0eWxpbmdJbmRleC5TaXplKTtcbiAgICB9XG4gICAgc2V0RmxhZyhjb250ZXh0LCBpLCBwb2ludGVycyhmbGFnLCBzdGF0aWNJbmRleCwgc2luZ2xlT3JNdWx0aUluZGV4KSk7XG4gIH1cblxuICAvLyB0aGlzIGlzIHdoZXJlIHdlIG1ha2Ugc3BhY2UgaW4gdGhlIGNvbnRleHQgZm9yIHRoZSBuZXcgc3R5bGUgYmluZGluZ3NcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBmaWx0ZXJlZFN0eWxlQmluZGluZ05hbWVzLmxlbmd0aCAqIFN0eWxpbmdJbmRleC5TaXplOyBpKyspIHtcbiAgICBjb250ZXh0LnNwbGljZShtdWx0aUNsYXNzZXNTdGFydEluZGV4LCAwLCBudWxsKTtcbiAgICBjb250ZXh0LnNwbGljZShzaW5nbGVDbGFzc2VzU3RhcnRJbmRleCwgMCwgbnVsbCk7XG4gICAgc2luZ2xlQ2xhc3Nlc1N0YXJ0SW5kZXgrKztcbiAgICBtdWx0aVN0eWxlc1N0YXJ0SW5kZXgrKztcbiAgICBtdWx0aUNsYXNzZXNTdGFydEluZGV4ICs9IDI7ICAvLyBib3RoIHNpbmdsZSArIG11bHRpIHNsb3RzIHdlcmUgaW5zZXJ0ZWRcbiAgfVxuXG4gIC8vIHRoaXMgaXMgd2hlcmUgd2UgbWFrZSBzcGFjZSBpbiB0aGUgY29udGV4dCBmb3IgdGhlIG5ldyBjbGFzcyBiaW5kaW5nc1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGZpbHRlcmVkQ2xhc3NCaW5kaW5nTmFtZXMubGVuZ3RoICogU3R5bGluZ0luZGV4LlNpemU7IGkrKykge1xuICAgIGNvbnRleHQuc3BsaWNlKG11bHRpU3R5bGVzU3RhcnRJbmRleCwgMCwgbnVsbCk7XG4gICAgY29udGV4dC5wdXNoKG51bGwpO1xuICAgIG11bHRpU3R5bGVzU3RhcnRJbmRleCsrO1xuICAgIG11bHRpQ2xhc3Nlc1N0YXJ0SW5kZXgrKztcbiAgfVxuXG4gIGNvbnN0IGluaXRpYWxDbGFzc2VzID0gY29udGV4dFtTdHlsaW5nSW5kZXguSW5pdGlhbENsYXNzVmFsdWVzUG9zaXRpb25dO1xuICBjb25zdCBpbml0aWFsU3R5bGVzID0gY29udGV4dFtTdHlsaW5nSW5kZXguSW5pdGlhbFN0eWxlVmFsdWVzUG9zaXRpb25dO1xuXG4gIC8vIHRoZSBjb2RlIGJlbG93IHdpbGwgaW5zZXJ0IGVhY2ggbmV3IGVudHJ5IGludG8gdGhlIGNvbnRleHQgYW5kIGFzc2lnbiB0aGUgYXBwcm9wcmlhdGVcbiAgLy8gZmxhZ3MgYW5kIGluZGV4IHZhbHVlcyB0byB0aGVtLiBJdCdzIGltcG9ydGFudCB0aGlzIHJ1bnMgYXQgdGhlIGVuZCBvZiB0aGlzIGZ1bmN0aW9uXG4gIC8vIGJlY2F1c2UgdGhlIGNvbnRleHQsIHByb3BlcnR5IG9mZnNldCBhbmQgaW5kZXggdmFsdWVzIGhhdmUgYWxsIGJlZW4gY29tcHV0ZWQganVzdCBiZWZvcmUuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgdG90YWxOZXdFbnRyaWVzOyBpKyspIHtcbiAgICBjb25zdCBlbnRyeUlzQ2xhc3NCYXNlZCA9IGkgPj0gZmlsdGVyZWRTdHlsZUJpbmRpbmdOYW1lcy5sZW5ndGg7XG4gICAgY29uc3QgYWRqdXN0ZWRJbmRleCA9IGVudHJ5SXNDbGFzc0Jhc2VkID8gKGkgLSBmaWx0ZXJlZFN0eWxlQmluZGluZ05hbWVzLmxlbmd0aCkgOiBpO1xuICAgIGNvbnN0IHByb3BOYW1lID0gZW50cnlJc0NsYXNzQmFzZWQgPyBmaWx0ZXJlZENsYXNzQmluZGluZ05hbWVzW2FkanVzdGVkSW5kZXhdIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZmlsdGVyZWRTdHlsZUJpbmRpbmdOYW1lc1thZGp1c3RlZEluZGV4XTtcblxuICAgIGxldCBtdWx0aUluZGV4LCBzaW5nbGVJbmRleDtcbiAgICBpZiAoZW50cnlJc0NsYXNzQmFzZWQpIHtcbiAgICAgIG11bHRpSW5kZXggPSBtdWx0aUNsYXNzZXNTdGFydEluZGV4ICtcbiAgICAgICAgICAoKHRvdGFsQ3VycmVudENsYXNzQmluZGluZ3MgKyBhZGp1c3RlZEluZGV4KSAqIFN0eWxpbmdJbmRleC5TaXplKTtcbiAgICAgIHNpbmdsZUluZGV4ID0gc2luZ2xlQ2xhc3Nlc1N0YXJ0SW5kZXggK1xuICAgICAgICAgICgodG90YWxDdXJyZW50Q2xhc3NCaW5kaW5ncyArIGFkanVzdGVkSW5kZXgpICogU3R5bGluZ0luZGV4LlNpemUpO1xuICAgIH0gZWxzZSB7XG4gICAgICBtdWx0aUluZGV4ID1cbiAgICAgICAgICBtdWx0aVN0eWxlc1N0YXJ0SW5kZXggKyAoKHRvdGFsQ3VycmVudFN0eWxlQmluZGluZ3MgKyBhZGp1c3RlZEluZGV4KSAqIFN0eWxpbmdJbmRleC5TaXplKTtcbiAgICAgIHNpbmdsZUluZGV4ID0gc2luZ2xlU3R5bGVzU3RhcnRJbmRleCArXG4gICAgICAgICAgKCh0b3RhbEN1cnJlbnRTdHlsZUJpbmRpbmdzICsgYWRqdXN0ZWRJbmRleCkgKiBTdHlsaW5nSW5kZXguU2l6ZSk7XG4gICAgfVxuXG4gICAgLy8gaWYgYSBwcm9wZXJ0eSBpcyBub3QgZm91bmQgaW4gdGhlIGluaXRpYWwgc3R5bGUgdmFsdWVzIGxpc3QgdGhlbiBpdFxuICAgIC8vIGlzIEFMV0FZUyBhZGRlZCBpbiBjYXNlIGEgZm9sbG93LXVwIGRpcmVjdGl2ZSBpbnRyb2R1Y2VzIHRoZSBzYW1lIGluaXRpYWxcbiAgICAvLyBzdHlsZS9jbGFzcyB2YWx1ZSBsYXRlciBvbi5cbiAgICBsZXQgaW5pdGlhbFZhbHVlc1RvTG9va3VwID0gZW50cnlJc0NsYXNzQmFzZWQgPyBpbml0aWFsQ2xhc3NlcyA6IGluaXRpYWxTdHlsZXM7XG4gICAgbGV0IGluZGV4Rm9ySW5pdGlhbCA9IGdldEluaXRpYWxTdHlsaW5nVmFsdWVzSW5kZXhPZihpbml0aWFsVmFsdWVzVG9Mb29rdXAsIHByb3BOYW1lKTtcbiAgICBpZiAoaW5kZXhGb3JJbml0aWFsID09PSAtMSkge1xuICAgICAgaW5kZXhGb3JJbml0aWFsID0gYWRkT3JVcGRhdGVTdGF0aWNTdHlsZShcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBudWxsLCBpbml0aWFsVmFsdWVzVG9Mb29rdXAsIHByb3BOYW1lLCBlbnRyeUlzQ2xhc3NCYXNlZCA/IGZhbHNlIDogbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkaXJlY3RpdmVJbmRleCkgK1xuICAgICAgICAgIEluaXRpYWxTdHlsaW5nVmFsdWVzSW5kZXguVmFsdWVPZmZzZXQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIGluZGV4Rm9ySW5pdGlhbCArPSBJbml0aWFsU3R5bGluZ1ZhbHVlc0luZGV4LlZhbHVlT2Zmc2V0O1xuICAgIH1cblxuICAgIGNvbnN0IGluaXRpYWxGbGFnID1cbiAgICAgICAgcHJlcGFyZUluaXRpYWxGbGFnKGNvbnRleHQsIHByb3BOYW1lLCBlbnRyeUlzQ2xhc3NCYXNlZCwgc3R5bGVTYW5pdGl6ZXIgfHwgbnVsbCk7XG5cbiAgICBzZXRGbGFnKGNvbnRleHQsIHNpbmdsZUluZGV4LCBwb2ludGVycyhpbml0aWFsRmxhZywgaW5kZXhGb3JJbml0aWFsLCBtdWx0aUluZGV4KSk7XG4gICAgc2V0UHJvcChjb250ZXh0LCBzaW5nbGVJbmRleCwgcHJvcE5hbWUpO1xuICAgIHNldFZhbHVlKGNvbnRleHQsIHNpbmdsZUluZGV4LCBudWxsKTtcbiAgICBzZXRQbGF5ZXJCdWlsZGVySW5kZXgoY29udGV4dCwgc2luZ2xlSW5kZXgsIDAsIGRpcmVjdGl2ZUluZGV4KTtcblxuICAgIHNldEZsYWcoY29udGV4dCwgbXVsdGlJbmRleCwgcG9pbnRlcnMoaW5pdGlhbEZsYWcsIGluZGV4Rm9ySW5pdGlhbCwgc2luZ2xlSW5kZXgpKTtcbiAgICBzZXRQcm9wKGNvbnRleHQsIG11bHRpSW5kZXgsIHByb3BOYW1lKTtcbiAgICBzZXRWYWx1ZShjb250ZXh0LCBtdWx0aUluZGV4LCBudWxsKTtcbiAgICBzZXRQbGF5ZXJCdWlsZGVySW5kZXgoY29udGV4dCwgbXVsdGlJbmRleCwgMCwgZGlyZWN0aXZlSW5kZXgpO1xuICB9XG5cbiAgLy8gdGhlIHRvdGFsIGNsYXNzZXMvc3R5bGUgdmFsdWVzIGFyZSB1cGRhdGVkIHNvIHRoZSBuZXh0IHRpbWUgdGhlIGNvbnRleHQgaXMgcGF0Y2hlZFxuICAvLyBhZGRpdGlvbmFsIHN0eWxlL2NsYXNzIGJpbmRpbmdzIGZyb20gYW5vdGhlciBkaXJlY3RpdmUgdGhlbiBpdCBrbm93cyBleGFjdGx5IHdoZXJlXG4gIC8vIHRvIGluc2VydCB0aGVtIGluIHRoZSBjb250ZXh0XG4gIHNpbmdsZVByb3BPZmZzZXRWYWx1ZXNbU2luZ2xlUHJvcE9mZnNldFZhbHVlc0luZGV4LkNsYXNzZXNDb3VudFBvc2l0aW9uXSA9XG4gICAgICB0b3RhbEN1cnJlbnRDbGFzc0JpbmRpbmdzICsgZmlsdGVyZWRDbGFzc0JpbmRpbmdOYW1lcy5sZW5ndGg7XG4gIHNpbmdsZVByb3BPZmZzZXRWYWx1ZXNbU2luZ2xlUHJvcE9mZnNldFZhbHVlc0luZGV4LlN0eWxlc0NvdW50UG9zaXRpb25dID1cbiAgICAgIHRvdGFsQ3VycmVudFN0eWxlQmluZGluZ3MgKyBmaWx0ZXJlZFN0eWxlQmluZGluZ05hbWVzLmxlbmd0aDtcblxuICAvLyB0aGUgbWFwLWJhc2VkIHZhbHVlcyBhbHNvIG5lZWQgdG8ga25vdyBob3cgbWFueSBlbnRyaWVzIGdvdCBpbnNlcnRlZFxuICBjYWNoZWRDbGFzc01hcFZhbHVlc1tNYXBCYXNlZE9mZnNldFZhbHVlc0luZGV4LkVudHJpZXNDb3VudFBvc2l0aW9uXSArPVxuICAgICAgZmlsdGVyZWRDbGFzc0JpbmRpbmdOYW1lcy5sZW5ndGg7XG4gIGNhY2hlZFN0eWxlTWFwVmFsdWVzW01hcEJhc2VkT2Zmc2V0VmFsdWVzSW5kZXguRW50cmllc0NvdW50UG9zaXRpb25dICs9XG4gICAgICBmaWx0ZXJlZFN0eWxlQmluZGluZ05hbWVzLmxlbmd0aDtcbiAgY29uc3QgbmV3U3R5bGVzU3BhY2VBbGxvY2F0aW9uU2l6ZSA9IGZpbHRlcmVkU3R5bGVCaW5kaW5nTmFtZXMubGVuZ3RoICogU3R5bGluZ0luZGV4LlNpemU7XG4gIGNvbnN0IG5ld0NsYXNzZXNTcGFjZUFsbG9jYXRpb25TaXplID0gZmlsdGVyZWRDbGFzc0JpbmRpbmdOYW1lcy5sZW5ndGggKiBTdHlsaW5nSW5kZXguU2l6ZTtcblxuICAvLyB1cGRhdGUgdGhlIG11bHRpIHN0eWxlcyBjYWNoZSB3aXRoIGEgcmVmZXJlbmNlIGZvciB0aGUgZGlyZWN0aXZlIHRoYXQgd2FzIGp1c3QgaW5zZXJ0ZWRcbiAgY29uc3QgZGlyZWN0aXZlTXVsdGlTdHlsZXNTdGFydEluZGV4ID1cbiAgICAgIG11bHRpU3R5bGVzU3RhcnRJbmRleCArIHRvdGFsQ3VycmVudFN0eWxlQmluZGluZ3MgKiBTdHlsaW5nSW5kZXguU2l6ZTtcbiAgY29uc3QgY2FjaGVkU3R5bGVNYXBJbmRleCA9IGNhY2hlZFN0eWxlTWFwVmFsdWVzLmxlbmd0aDtcbiAgcmVnaXN0ZXJNdWx0aU1hcEVudHJ5KFxuICAgICAgY29udGV4dCwgZGlyZWN0aXZlSW5kZXgsIGZhbHNlLCBkaXJlY3RpdmVNdWx0aVN0eWxlc1N0YXJ0SW5kZXgsXG4gICAgICBmaWx0ZXJlZFN0eWxlQmluZGluZ05hbWVzLmxlbmd0aCk7XG5cbiAgZm9yIChsZXQgaSA9IE1hcEJhc2VkT2Zmc2V0VmFsdWVzSW5kZXguVmFsdWVzU3RhcnRQb3NpdGlvbjsgaSA8IGNhY2hlZFN0eWxlTWFwSW5kZXg7XG4gICAgICAgaSArPSBNYXBCYXNlZE9mZnNldFZhbHVlc0luZGV4LlNpemUpIHtcbiAgICAvLyBtdWx0aSB2YWx1ZXMgc3RhcnQgYWZ0ZXIgYWxsIHRoZSBzaW5nbGUgdmFsdWVzICh3aGljaCBpcyBhbHNvIHdoZXJlIGNsYXNzZXMgYXJlKSBpbiB0aGVcbiAgICAvLyBjb250ZXh0IHRoZXJlZm9yZSB0aGUgbmV3IGNsYXNzIGFsbG9jYXRpb24gc2l6ZSBzaG91bGQgYmUgdGFrZW4gaW50byBhY2NvdW50XG4gICAgY2FjaGVkU3R5bGVNYXBWYWx1ZXNbaSArIE1hcEJhc2VkT2Zmc2V0VmFsdWVzSW5kZXguUG9zaXRpb25TdGFydE9mZnNldF0gKz1cbiAgICAgICAgbmV3Q2xhc3Nlc1NwYWNlQWxsb2NhdGlvblNpemUgKyBuZXdTdHlsZXNTcGFjZUFsbG9jYXRpb25TaXplO1xuICB9XG5cbiAgLy8gdXBkYXRlIHRoZSBtdWx0aSBjbGFzc2VzIGNhY2hlIHdpdGggYSByZWZlcmVuY2UgZm9yIHRoZSBkaXJlY3RpdmUgdGhhdCB3YXMganVzdCBpbnNlcnRlZFxuICBjb25zdCBkaXJlY3RpdmVNdWx0aUNsYXNzZXNTdGFydEluZGV4ID1cbiAgICAgIG11bHRpQ2xhc3Nlc1N0YXJ0SW5kZXggKyB0b3RhbEN1cnJlbnRDbGFzc0JpbmRpbmdzICogU3R5bGluZ0luZGV4LlNpemU7XG4gIGNvbnN0IGNhY2hlZENsYXNzTWFwSW5kZXggPSBjYWNoZWRDbGFzc01hcFZhbHVlcy5sZW5ndGg7XG4gIHJlZ2lzdGVyTXVsdGlNYXBFbnRyeShcbiAgICAgIGNvbnRleHQsIGRpcmVjdGl2ZUluZGV4LCB0cnVlLCBkaXJlY3RpdmVNdWx0aUNsYXNzZXNTdGFydEluZGV4LFxuICAgICAgZmlsdGVyZWRDbGFzc0JpbmRpbmdOYW1lcy5sZW5ndGgpO1xuXG4gIGZvciAobGV0IGkgPSBNYXBCYXNlZE9mZnNldFZhbHVlc0luZGV4LlZhbHVlc1N0YXJ0UG9zaXRpb247IGkgPCBjYWNoZWRDbGFzc01hcEluZGV4O1xuICAgICAgIGkgKz0gTWFwQmFzZWRPZmZzZXRWYWx1ZXNJbmRleC5TaXplKSB7XG4gICAgLy8gdGhlIHJlYXNvbiB3aHkgYm90aCB0aGUgc3R5bGVzICsgY2xhc3NlcyBzcGFjZSBpcyBhbGxvY2F0ZWQgdG8gdGhlIGV4aXN0aW5nIG9mZnNldHMgaXNcbiAgICAvLyBiZWNhdXNlIHRoZSBzdHlsZXMgc2hvdyB1cCBiZWZvcmUgdGhlIGNsYXNzZXMgaW4gdGhlIGNvbnRleHQgYW5kIGFueSBuZXcgaW5zZXJ0ZWRcbiAgICAvLyBzdHlsZXMgd2lsbCBvZmZzZXQgYW55IGV4aXN0aW5nIGNsYXNzIGVudHJpZXMgaW4gdGhlIGNvbnRleHQgKGV2ZW4gaWYgdGhlcmUgYXJlIG5vXG4gICAgLy8gbmV3IGNsYXNzIGVudHJpZXMgYWRkZWQpIGFsc28gdGhlIHJlYXNvbiB3aHkgaXQncyAqMiBpcyBiZWNhdXNlIGJvdGggc2luZ2xlICsgbXVsdGlcbiAgICAvLyBlbnRyaWVzIGZvciBlYWNoIG5ldyBzdHlsZSBoYXZlIGJlZW4gYWRkZWQgaW4gdGhlIGNvbnRleHQgYmVmb3JlIHRoZSBtdWx0aSBjbGFzcyB2YWx1ZXNcbiAgICAvLyBhY3R1YWxseSBzdGFydFxuICAgIGNhY2hlZENsYXNzTWFwVmFsdWVzW2kgKyBNYXBCYXNlZE9mZnNldFZhbHVlc0luZGV4LlBvc2l0aW9uU3RhcnRPZmZzZXRdICs9XG4gICAgICAgIChuZXdTdHlsZXNTcGFjZUFsbG9jYXRpb25TaXplICogMikgKyBuZXdDbGFzc2VzU3BhY2VBbGxvY2F0aW9uU2l6ZTtcbiAgfVxuXG4gIC8vIHRoZXJlIGlzIG5vIGluaXRpYWwgdmFsdWUgZmxhZyBmb3IgdGhlIG1hc3RlciBpbmRleCBzaW5jZSBpdCBkb2Vzbid0XG4gIC8vIHJlZmVyZW5jZSBhbiBpbml0aWFsIHN0eWxlIHZhbHVlXG4gIGNvbnN0IG1hc3RlckZsYWcgPSBwb2ludGVycygwLCAwLCBtdWx0aVN0eWxlc1N0YXJ0SW5kZXgpO1xuICBzZXRGbGFnKGNvbnRleHQsIFN0eWxpbmdJbmRleC5NYXN0ZXJGbGFnUG9zaXRpb24sIG1hc3RlckZsYWcpO1xufVxuXG4vKipcbiAqIFNlYXJjaGVzIHRocm91Z2ggdGhlIGV4aXN0aW5nIHJlZ2lzdHJ5IG9mIGRpcmVjdGl2ZXNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZpbmRPclBhdGNoRGlyZWN0aXZlSW50b1JlZ2lzdHJ5KFxuICAgIGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBkaXJlY3RpdmVSZWY6IGFueSwgc3R5bGVTYW5pdGl6ZXI/OiBTdHlsZVNhbml0aXplRm4gfCBudWxsKSB7XG4gIGNvbnN0IGRpcmVjdGl2ZVJlZnMgPSBjb250ZXh0W1N0eWxpbmdJbmRleC5EaXJlY3RpdmVSZWdpc3RyeVBvc2l0aW9uXTtcbiAgY29uc3QgbmV4dE9mZnNldEluc2VydGlvbkluZGV4ID0gY29udGV4dFtTdHlsaW5nSW5kZXguU2luZ2xlUHJvcE9mZnNldFBvc2l0aW9uc10ubGVuZ3RoO1xuXG4gIGxldCBkaXJlY3RpdmVJbmRleDogbnVtYmVyO1xuICBsZXQgZGV0ZWN0ZWRJbmRleCA9IGdldERpcmVjdGl2ZVJlZ2lzdHJ5VmFsdWVzSW5kZXhPZihkaXJlY3RpdmVSZWZzLCBkaXJlY3RpdmVSZWYpO1xuXG4gIGlmIChkZXRlY3RlZEluZGV4ID09PSAtMSkge1xuICAgIGRldGVjdGVkSW5kZXggPSBkaXJlY3RpdmVSZWZzLmxlbmd0aDtcbiAgICBkaXJlY3RpdmVJbmRleCA9IGRpcmVjdGl2ZVJlZnMubGVuZ3RoIC8gRGlyZWN0aXZlUmVnaXN0cnlWYWx1ZXNJbmRleC5TaXplO1xuXG4gICAgYWxsb2NhdGVEaXJlY3RpdmVJbnRvQ29udGV4dChjb250ZXh0LCBkaXJlY3RpdmVSZWYpO1xuICAgIGRpcmVjdGl2ZVJlZnNbZGV0ZWN0ZWRJbmRleCArIERpcmVjdGl2ZVJlZ2lzdHJ5VmFsdWVzSW5kZXguU2luZ2xlUHJvcFZhbHVlc0luZGV4T2Zmc2V0XSA9XG4gICAgICAgIG5leHRPZmZzZXRJbnNlcnRpb25JbmRleDtcbiAgICBkaXJlY3RpdmVSZWZzW2RldGVjdGVkSW5kZXggKyBEaXJlY3RpdmVSZWdpc3RyeVZhbHVlc0luZGV4LlN0eWxlU2FuaXRpemVyT2Zmc2V0XSA9XG4gICAgICAgIHN0eWxlU2FuaXRpemVyIHx8IG51bGw7XG4gIH0gZWxzZSB7XG4gICAgY29uc3Qgc2luZ2xlUHJvcFN0YXJ0UG9zaXRpb24gPVxuICAgICAgICBkZXRlY3RlZEluZGV4ICsgRGlyZWN0aXZlUmVnaXN0cnlWYWx1ZXNJbmRleC5TaW5nbGVQcm9wVmFsdWVzSW5kZXhPZmZzZXQ7XG4gICAgaWYgKGRpcmVjdGl2ZVJlZnNbc2luZ2xlUHJvcFN0YXJ0UG9zaXRpb25dICEgPj0gMCkge1xuICAgICAgLy8gdGhlIGRpcmVjdGl2ZSBoYXMgYWxyZWFkeSBiZWVuIHBhdGNoZWQgaW50byB0aGUgY29udGV4dFxuICAgICAgcmV0dXJuIC0xO1xuICAgIH1cblxuICAgIGRpcmVjdGl2ZUluZGV4ID0gZGV0ZWN0ZWRJbmRleCAvIERpcmVjdGl2ZVJlZ2lzdHJ5VmFsdWVzSW5kZXguU2l6ZTtcblxuICAgIC8vIGJlY2F1c2UgdGhlIGRpcmVjdGl2ZSBhbHJlYWR5IGV4aXN0ZWQgdGhpcyBtZWFucyB0aGF0IGl0IHdhcyBzZXQgZHVyaW5nIGVsZW1lbnRIb3N0QXR0cnMgb3JcbiAgICAvLyBlbGVtZW50U3RhcnQgd2hpY2ggbWVhbnMgdGhhdCB0aGUgYmluZGluZyB2YWx1ZXMgd2VyZSBub3QgaGVyZS4gVGhlcmVmb3JlLCB0aGUgdmFsdWVzIGJlbG93XG4gICAgLy8gbmVlZCB0byBiZSBhcHBsaWVkIHNvIHRoYXQgc2luZ2xlIGNsYXNzIGFuZCBzdHlsZSBwcm9wZXJ0aWVzIGNhbiBiZSBhc3NpZ25lZCBsYXRlci5cbiAgICBjb25zdCBzaW5nbGVQcm9wUG9zaXRpb25JbmRleCA9XG4gICAgICAgIGRldGVjdGVkSW5kZXggKyBEaXJlY3RpdmVSZWdpc3RyeVZhbHVlc0luZGV4LlNpbmdsZVByb3BWYWx1ZXNJbmRleE9mZnNldDtcbiAgICBkaXJlY3RpdmVSZWZzW3NpbmdsZVByb3BQb3NpdGlvbkluZGV4XSA9IG5leHRPZmZzZXRJbnNlcnRpb25JbmRleDtcblxuICAgIC8vIHRoZSBzYW5pdGl6ZXIgaXMgYWxzbyBhcGFydCBvZiB0aGUgYmluZGluZyBwcm9jZXNzIGFuZCB3aWxsIGJlIHVzZWQgd2hlbiBiaW5kaW5ncyBhcmVcbiAgICAvLyBhcHBsaWVkLlxuICAgIGNvbnN0IHN0eWxlU2FuaXRpemVySW5kZXggPSBkZXRlY3RlZEluZGV4ICsgRGlyZWN0aXZlUmVnaXN0cnlWYWx1ZXNJbmRleC5TdHlsZVNhbml0aXplck9mZnNldDtcbiAgICBkaXJlY3RpdmVSZWZzW3N0eWxlU2FuaXRpemVySW5kZXhdID0gc3R5bGVTYW5pdGl6ZXIgfHwgbnVsbDtcbiAgfVxuXG4gIHJldHVybiBkaXJlY3RpdmVJbmRleDtcbn1cblxuZnVuY3Rpb24gZ2V0TWF0Y2hpbmdCaW5kaW5nSW5kZXgoXG4gICAgY29udGV4dDogU3R5bGluZ0NvbnRleHQsIGJpbmRpbmdOYW1lOiBzdHJpbmcsIHN0YXJ0OiBudW1iZXIsIGVuZDogbnVtYmVyKSB7XG4gIGZvciAobGV0IGogPSBzdGFydDsgaiA8IGVuZDsgaiArPSBTdHlsaW5nSW5kZXguU2l6ZSkge1xuICAgIGlmIChnZXRQcm9wKGNvbnRleHQsIGopID09PSBiaW5kaW5nTmFtZSkgcmV0dXJuIGo7XG4gIH1cbiAgcmV0dXJuIC0xO1xufVxuXG4vKipcbiAqIFJlZ2lzdGVycyB0aGUgcHJvdmlkZWQgbXVsdGkgc3R5bGluZyAoYFtzdHlsZV1gIGFuZCBgW2NsYXNzXWApIHZhbHVlcyB0byB0aGUgY29udGV4dC5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIHdpbGwgaXRlcmF0ZSBvdmVyIHRoZSBwcm92aWRlZCBgY2xhc3Nlc0lucHV0YCBhbmQgYHN0eWxlc0lucHV0YCBtYXBcbiAqIHZhbHVlcyBhbmQgaW5zZXJ0L3VwZGF0ZSBvciByZW1vdmUgdGhlbSBmcm9tIHRoZSBjb250ZXh0IGF0IGV4YWN0bHkgdGhlIHJpZ2h0XG4gKiBzcG90LlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gYWxzbyB0YWtlcyBpbiBhIGRpcmVjdGl2ZSB3aGljaCBpbXBsaWVzIHRoYXQgdGhlIHN0eWxpbmcgdmFsdWVzIHdpbGxcbiAqIGJlIGV2YWx1YXRlZCBmb3IgdGhhdCBkaXJlY3RpdmUgd2l0aCByZXNwZWN0IHRvIGFueSBvdGhlciBzdHlsaW5nIHRoYXQgYWxyZWFkeSBleGlzdHNcbiAqIG9uIHRoZSBjb250ZXh0LiBXaGVuIHRoZXJlIGFyZSBzdHlsZXMgdGhhdCBjb25mbGljdCAoZS5nLiBzYXkgYG5nU3R5bGVgIGFuZCBgW3N0eWxlXWBcbiAqIGJvdGggdXBkYXRlIHRoZSBgd2lkdGhgIHByb3BlcnR5IGF0IHRoZSBzYW1lIHRpbWUpIHRoZW4gdGhlIHN0eWxpbmcgYWxnb3JpdGhtIGNvZGUgYmVsb3dcbiAqIHdpbGwgZGVjaWRlIHdoaWNoIG9uZSB3aW5zIGJhc2VkIG9uIHRoZSBkaXJlY3RpdmUgc3R5bGluZyBwcmlvcml0aXphdGlvbiBtZWNoYW5pc20uIFRoaXNcbiAqIG1lY2hhbmlzbSBpcyBiZXR0ZXIgZXhwbGFpbmVkIGluIHJlbmRlcjMvaW50ZXJmYWNlcy9zdHlsaW5nLnRzI2RpcmVjdGl2ZXMpLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gd2lsbCBub3QgcmVuZGVyIGFueSBzdHlsaW5nIHZhbHVlcyBvbiBzY3JlZW4sIGJ1dCBpcyByYXRoZXIgZGVzaWduZWQgdG9cbiAqIHByZXBhcmUgdGhlIGNvbnRleHQgZm9yIHRoYXQuIGByZW5kZXJTdHlsaW5nYCBtdXN0IGJlIGNhbGxlZCBhZnRlcndhcmRzIHRvIHJlbmRlciBhbnlcbiAqIHN0eWxpbmcgZGF0YSB0aGF0IHdhcyBzZXQgaW4gdGhpcyBmdW5jdGlvbiAobm90ZSB0aGF0IGB1cGRhdGVDbGFzc1Byb3BgIGFuZFxuICogYHVwZGF0ZVN0eWxlUHJvcGAgYXJlIGRlc2lnbmVkIHRvIGJlIHJ1biBhZnRlciB0aGlzIGZ1bmN0aW9uIGlzIHJ1bikuXG4gKlxuICogQHBhcmFtIGNvbnRleHQgVGhlIHN0eWxpbmcgY29udGV4dCB0aGF0IHdpbGwgYmUgdXBkYXRlZCB3aXRoIHRoZVxuICogICAgbmV3bHkgcHJvdmlkZWQgc3R5bGUgdmFsdWVzLlxuICogQHBhcmFtIGNsYXNzZXNJbnB1dCBUaGUga2V5L3ZhbHVlIG1hcCBvZiBDU1MgY2xhc3MgbmFtZXMgdGhhdCB3aWxsIGJlIHVzZWQgZm9yIHRoZSB1cGRhdGUuXG4gKiBAcGFyYW0gc3R5bGVzSW5wdXQgVGhlIGtleS92YWx1ZSBtYXAgb2YgQ1NTIHN0eWxlcyB0aGF0IHdpbGwgYmUgdXNlZCBmb3IgdGhlIHVwZGF0ZS5cbiAqIEBwYXJhbSBkaXJlY3RpdmVSZWYgYW4gb3B0aW9uYWwgcmVmZXJlbmNlIHRvIHRoZSBkaXJlY3RpdmUgcmVzcG9uc2libGVcbiAqICAgIGZvciB0aGlzIGJpbmRpbmcgY2hhbmdlLiBJZiBwcmVzZW50IHRoZW4gc3R5bGUgYmluZGluZyB3aWxsIG9ubHlcbiAqICAgIGFjdHVhbGl6ZSBpZiB0aGUgZGlyZWN0aXZlIGhhcyBvd25lcnNoaXAgb3ZlciB0aGlzIGJpbmRpbmdcbiAqICAgIChzZWUgc3R5bGluZy50cyNkaXJlY3RpdmVzIGZvciBtb3JlIGluZm9ybWF0aW9uIGFib3V0IHRoZSBhbGdvcml0aG0pLlxuICovXG5leHBvcnQgZnVuY3Rpb24gdXBkYXRlU3R5bGluZ01hcChcbiAgICBjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgY2xhc3Nlc0lucHV0OiB7W2tleTogc3RyaW5nXTogYW55fSB8IHN0cmluZyB8XG4gICAgICAgIEJvdW5kUGxheWVyRmFjdG9yeTxudWxsfHN0cmluZ3x7W2tleTogc3RyaW5nXTogYW55fT58IG51bGwsXG4gICAgc3R5bGVzSW5wdXQ/OiB7W2tleTogc3RyaW5nXTogYW55fSB8IEJvdW5kUGxheWVyRmFjdG9yeTxudWxsfHtba2V5OiBzdHJpbmddOiBhbnl9PnwgbnVsbCxcbiAgICBkaXJlY3RpdmVSZWY/OiBhbnkpOiB2b2lkIHtcbiAgY29uc3QgZGlyZWN0aXZlSW5kZXggPSBnZXREaXJlY3RpdmVJbmRleEZyb21SZWdpc3RyeShjb250ZXh0LCBkaXJlY3RpdmVSZWYgfHwgbnVsbCk7XG5cbiAgY2xhc3Nlc0lucHV0ID0gY2xhc3Nlc0lucHV0IHx8IG51bGw7XG4gIHN0eWxlc0lucHV0ID0gc3R5bGVzSW5wdXQgfHwgbnVsbDtcbiAgY29uc3QgaWdub3JlQWxsQ2xhc3NVcGRhdGVzID0gaXNNdWx0aVZhbHVlQ2FjaGVIaXQoY29udGV4dCwgdHJ1ZSwgZGlyZWN0aXZlSW5kZXgsIGNsYXNzZXNJbnB1dCk7XG4gIGNvbnN0IGlnbm9yZUFsbFN0eWxlVXBkYXRlcyA9IGlzTXVsdGlWYWx1ZUNhY2hlSGl0KGNvbnRleHQsIGZhbHNlLCBkaXJlY3RpdmVJbmRleCwgc3R5bGVzSW5wdXQpO1xuXG4gIC8vIGVhcmx5IGV4aXQgKHRoaXMgaXMgd2hhdCdzIGRvbmUgdG8gYXZvaWQgdXNpbmcgY3R4LmJpbmQoKSB0byBjYWNoZSB0aGUgdmFsdWUpXG4gIGlmIChpZ25vcmVBbGxDbGFzc1VwZGF0ZXMgJiYgaWdub3JlQWxsU3R5bGVVcGRhdGVzKSByZXR1cm47XG5cbiAgY2xhc3Nlc0lucHV0ID1cbiAgICAgIGNsYXNzZXNJbnB1dCA9PT0gTk9fQ0hBTkdFID8gcmVhZENhY2hlZE1hcFZhbHVlKGNvbnRleHQsIHRydWUsIGRpcmVjdGl2ZUluZGV4KSA6IGNsYXNzZXNJbnB1dDtcbiAgc3R5bGVzSW5wdXQgPVxuICAgICAgc3R5bGVzSW5wdXQgPT09IE5PX0NIQU5HRSA/IHJlYWRDYWNoZWRNYXBWYWx1ZShjb250ZXh0LCBmYWxzZSwgZGlyZWN0aXZlSW5kZXgpIDogc3R5bGVzSW5wdXQ7XG5cbiAgY29uc3QgZWxlbWVudCA9IGNvbnRleHRbU3R5bGluZ0luZGV4LkVsZW1lbnRQb3NpdGlvbl0gIWFzIEhUTUxFbGVtZW50O1xuICBjb25zdCBjbGFzc2VzUGxheWVyQnVpbGRlciA9IGNsYXNzZXNJbnB1dCBpbnN0YW5jZW9mIEJvdW5kUGxheWVyRmFjdG9yeSA/XG4gICAgICBuZXcgQ2xhc3NBbmRTdHlsZVBsYXllckJ1aWxkZXIoY2xhc3Nlc0lucHV0IGFzIGFueSwgZWxlbWVudCwgQmluZGluZ1R5cGUuQ2xhc3MpIDpcbiAgICAgIG51bGw7XG4gIGNvbnN0IHN0eWxlc1BsYXllckJ1aWxkZXIgPSBzdHlsZXNJbnB1dCBpbnN0YW5jZW9mIEJvdW5kUGxheWVyRmFjdG9yeSA/XG4gICAgICBuZXcgQ2xhc3NBbmRTdHlsZVBsYXllckJ1aWxkZXIoc3R5bGVzSW5wdXQgYXMgYW55LCBlbGVtZW50LCBCaW5kaW5nVHlwZS5TdHlsZSkgOlxuICAgICAgbnVsbDtcblxuICBjb25zdCBjbGFzc2VzVmFsdWUgPSBjbGFzc2VzUGxheWVyQnVpbGRlciA/XG4gICAgICAoY2xhc3Nlc0lucHV0IGFzIEJvdW5kUGxheWVyRmFjdG9yeTx7W2tleTogc3RyaW5nXTogYW55fXxzdHJpbmc+KSAhLnZhbHVlIDpcbiAgICAgIGNsYXNzZXNJbnB1dDtcbiAgY29uc3Qgc3R5bGVzVmFsdWUgPSBzdHlsZXNQbGF5ZXJCdWlsZGVyID8gc3R5bGVzSW5wdXQgIVsndmFsdWUnXSA6IHN0eWxlc0lucHV0O1xuXG4gIGxldCBjbGFzc05hbWVzOiBzdHJpbmdbXSA9IEVNUFRZX0FSUkFZO1xuICBsZXQgYXBwbHlBbGxDbGFzc2VzID0gZmFsc2U7XG4gIGxldCBwbGF5ZXJCdWlsZGVyc0FyZURpcnR5ID0gZmFsc2U7XG5cbiAgY29uc3QgY2xhc3Nlc1BsYXllckJ1aWxkZXJJbmRleCA9XG4gICAgICBjbGFzc2VzUGxheWVyQnVpbGRlciA/IFBsYXllckluZGV4LkNsYXNzTWFwUGxheWVyQnVpbGRlclBvc2l0aW9uIDogMDtcbiAgaWYgKGhhc1BsYXllckJ1aWxkZXJDaGFuZ2VkKFxuICAgICAgICAgIGNvbnRleHQsIGNsYXNzZXNQbGF5ZXJCdWlsZGVyLCBQbGF5ZXJJbmRleC5DbGFzc01hcFBsYXllckJ1aWxkZXJQb3NpdGlvbikpIHtcbiAgICBzZXRQbGF5ZXJCdWlsZGVyKGNvbnRleHQsIGNsYXNzZXNQbGF5ZXJCdWlsZGVyLCBQbGF5ZXJJbmRleC5DbGFzc01hcFBsYXllckJ1aWxkZXJQb3NpdGlvbik7XG4gICAgcGxheWVyQnVpbGRlcnNBcmVEaXJ0eSA9IHRydWU7XG4gIH1cblxuICBjb25zdCBzdHlsZXNQbGF5ZXJCdWlsZGVySW5kZXggPVxuICAgICAgc3R5bGVzUGxheWVyQnVpbGRlciA/IFBsYXllckluZGV4LlN0eWxlTWFwUGxheWVyQnVpbGRlclBvc2l0aW9uIDogMDtcbiAgaWYgKGhhc1BsYXllckJ1aWxkZXJDaGFuZ2VkKFxuICAgICAgICAgIGNvbnRleHQsIHN0eWxlc1BsYXllckJ1aWxkZXIsIFBsYXllckluZGV4LlN0eWxlTWFwUGxheWVyQnVpbGRlclBvc2l0aW9uKSkge1xuICAgIHNldFBsYXllckJ1aWxkZXIoY29udGV4dCwgc3R5bGVzUGxheWVyQnVpbGRlciwgUGxheWVySW5kZXguU3R5bGVNYXBQbGF5ZXJCdWlsZGVyUG9zaXRpb24pO1xuICAgIHBsYXllckJ1aWxkZXJzQXJlRGlydHkgPSB0cnVlO1xuICB9XG5cbiAgLy8gZWFjaCB0aW1lIGEgc3RyaW5nLWJhc2VkIHZhbHVlIHBvcHMgdXAgdGhlbiBpdCBzaG91bGRuJ3QgcmVxdWlyZSBhIGRlZXBcbiAgLy8gY2hlY2sgb2Ygd2hhdCdzIGNoYW5nZWQuXG4gIGlmICghaWdub3JlQWxsQ2xhc3NVcGRhdGVzKSB7XG4gICAgaWYgKHR5cGVvZiBjbGFzc2VzVmFsdWUgPT0gJ3N0cmluZycpIHtcbiAgICAgIGNsYXNzTmFtZXMgPSBjbGFzc2VzVmFsdWUuc3BsaXQoL1xccysvKTtcbiAgICAgIC8vIHRoaXMgYm9vbGVhbiBpcyB1c2VkIHRvIGF2b2lkIGhhdmluZyB0byBjcmVhdGUgYSBrZXkvdmFsdWUgbWFwIG9mIGB0cnVlYCB2YWx1ZXNcbiAgICAgIC8vIHNpbmNlIGEgY2xhc3NuYW1lIHN0cmluZyBpbXBsaWVzIHRoYXQgYWxsIHRob3NlIGNsYXNzZXMgYXJlIGFkZGVkXG4gICAgICBhcHBseUFsbENsYXNzZXMgPSB0cnVlO1xuICAgIH0gZWxzZSB7XG4gICAgICBjbGFzc05hbWVzID0gY2xhc3Nlc1ZhbHVlID8gT2JqZWN0LmtleXMoY2xhc3Nlc1ZhbHVlKSA6IEVNUFRZX0FSUkFZO1xuICAgIH1cbiAgfVxuXG4gIGNvbnN0IG11bHRpU3R5bGVzU3RhcnRJbmRleCA9IGdldE11bHRpU3R5bGVzU3RhcnRJbmRleChjb250ZXh0KTtcbiAgbGV0IG11bHRpQ2xhc3Nlc1N0YXJ0SW5kZXggPSBnZXRNdWx0aUNsYXNzZXNTdGFydEluZGV4KGNvbnRleHQpO1xuICBsZXQgbXVsdGlDbGFzc2VzRW5kSW5kZXggPSBjb250ZXh0Lmxlbmd0aDtcblxuICBpZiAoIWlnbm9yZUFsbFN0eWxlVXBkYXRlcykge1xuICAgIGNvbnN0IHN0eWxlUHJvcHMgPSBzdHlsZXNWYWx1ZSA/IE9iamVjdC5rZXlzKHN0eWxlc1ZhbHVlKSA6IEVNUFRZX0FSUkFZO1xuICAgIGNvbnN0IHN0eWxlcyA9IHN0eWxlc1ZhbHVlIHx8IEVNUFRZX09CSjtcbiAgICBjb25zdCB0b3RhbE5ld0VudHJpZXMgPSBwYXRjaFN0eWxpbmdNYXBJbnRvQ29udGV4dChcbiAgICAgICAgY29udGV4dCwgZGlyZWN0aXZlSW5kZXgsIHN0eWxlc1BsYXllckJ1aWxkZXJJbmRleCwgbXVsdGlTdHlsZXNTdGFydEluZGV4LFxuICAgICAgICBtdWx0aUNsYXNzZXNTdGFydEluZGV4LCBzdHlsZVByb3BzLCBzdHlsZXMsIHN0eWxlc0lucHV0LCBmYWxzZSk7XG4gICAgaWYgKHRvdGFsTmV3RW50cmllcykge1xuICAgICAgbXVsdGlDbGFzc2VzU3RhcnRJbmRleCArPSB0b3RhbE5ld0VudHJpZXMgKiBTdHlsaW5nSW5kZXguU2l6ZTtcbiAgICAgIG11bHRpQ2xhc3Nlc0VuZEluZGV4ICs9IHRvdGFsTmV3RW50cmllcyAqIFN0eWxpbmdJbmRleC5TaXplO1xuICAgIH1cbiAgfVxuXG4gIGlmICghaWdub3JlQWxsQ2xhc3NVcGRhdGVzKSB7XG4gICAgY29uc3QgY2xhc3NlcyA9IChjbGFzc2VzVmFsdWUgfHwgRU1QVFlfT0JKKSBhc3tba2V5OiBzdHJpbmddOiBhbnl9O1xuICAgIHBhdGNoU3R5bGluZ01hcEludG9Db250ZXh0KFxuICAgICAgICBjb250ZXh0LCBkaXJlY3RpdmVJbmRleCwgY2xhc3Nlc1BsYXllckJ1aWxkZXJJbmRleCwgbXVsdGlDbGFzc2VzU3RhcnRJbmRleCxcbiAgICAgICAgbXVsdGlDbGFzc2VzRW5kSW5kZXgsIGNsYXNzTmFtZXMsIGFwcGx5QWxsQ2xhc3NlcyB8fCBjbGFzc2VzLCBjbGFzc2VzSW5wdXQsIHRydWUpO1xuICB9XG5cbiAgaWYgKHBsYXllckJ1aWxkZXJzQXJlRGlydHkpIHtcbiAgICBzZXRDb250ZXh0UGxheWVyc0RpcnR5KGNvbnRleHQsIHRydWUpO1xuICB9XG59XG5cbi8qKlxuICogQXBwbGllcyB0aGUgZ2l2ZW4gbXVsdGkgc3R5bGluZyAoc3R5bGVzIG9yIGNsYXNzZXMpIHZhbHVlcyB0byB0aGUgY29udGV4dC5cbiAqXG4gKiBUaGUgc3R5bGluZyBhbGdvcml0aG0gY29kZSB0aGF0IGFwcGxpZXMgbXVsdGktbGV2ZWwgc3R5bGluZyAodGhpbmdzIGxpa2UgYFtzdHlsZV1gIGFuZCBgW2NsYXNzXWBcbiAqIHZhbHVlcykgcmVzaWRlcyBoZXJlLlxuICpcbiAqIEJlY2F1c2UgdGhpcyBmdW5jdGlvbiB1bmRlcnN0YW5kcyB0aGF0IG11bHRpcGxlIGRpcmVjdGl2ZXMgbWF5IGFsbCB3cml0ZSB0byB0aGUgYFtzdHlsZV1gIGFuZFxuICogYFtjbGFzc11gIGJpbmRpbmdzICh0aHJvdWdoIGhvc3QgYmluZGluZ3MpLCBpdCByZWxpZXMgb2YgZWFjaCBkaXJlY3RpdmUgYXBwbHlpbmcgaXRzIGJpbmRpbmdcbiAqIHZhbHVlIGluIG9yZGVyLiBUaGlzIG1lYW5zIHRoYXQgYSBkaXJlY3RpdmUgbGlrZSBgY2xhc3NBRGlyZWN0aXZlYCB3aWxsIGFsd2F5cyBmaXJlIGJlZm9yZVxuICogYGNsYXNzQkRpcmVjdGl2ZWAgYW5kIHRoZXJlZm9yZSBpdHMgc3R5bGluZyB2YWx1ZXMgKGNsYXNzZXMgYW5kIHN0eWxlcykgd2lsbCBhbHdheXMgYmUgZXZhbHVhdGVkXG4gKiBpbiB0aGUgc2FtZSBvcmRlci4gQmVjYXVzZSBvZiB0aGlzIGNvbnNpc3RlbnQgb3JkZXJpbmcsIHRoZSBmaXJzdCBkaXJlY3RpdmUgaGFzIGEgaGlnaGVyIHByaW9yaXR5XG4gKiB0aGFuIHRoZSBzZWNvbmQgb25lLiBJdCBpcyB3aXRoIHRoaXMgcHJpb3JpdHphdGlvbiBtZWNoYW5pc20gdGhhdCB0aGUgc3R5bGluZyBhbGdvcml0aG0ga25vd3MgaG93XG4gKiB0byBtZXJnZSBhbmQgYXBwbHkgcmVkdWRhbnQgc3R5bGluZyBwcm9wZXJ0aWVzLlxuICpcbiAqIFRoZSBmdW5jdGlvbiBpdHNlbGYgYXBwbGllcyB0aGUga2V5L3ZhbHVlIGVudHJpZXMgKG9yIGFuIGFycmF5IG9mIGtleXMpIHRvXG4gKiB0aGUgY29udGV4dCBpbiB0aGUgZm9sbG93aW5nIHN0ZXBzLlxuICpcbiAqIFNURVAgMTpcbiAqICAgIEZpcnN0IGNoZWNrIHRvIHNlZSB3aGF0IHByb3BlcnRpZXMgYXJlIGFscmVhZHkgc2V0IGFuZCBpbiB1c2UgYnkgYW5vdGhlciBkaXJlY3RpdmUgaW4gdGhlXG4gKiAgICBjb250ZXh0IChlLmcuIGBuZ0NsYXNzYCBzZXQgdGhlIGB3aWR0aGAgdmFsdWUgYW5kIGBbc3R5bGUud2lkdGhdPVwid1wiYCBpbiBhIGRpcmVjdGl2ZSBpc1xuICogICAgYXR0ZW1wdGluZyB0byBzZXQgaXQgYXMgd2VsbCkuXG4gKlxuICogU1RFUCAyOlxuICogICAgQWxsIHJlbWFpbmluZyBwcm9wZXJ0aWVzICh0aGF0IHdlcmUgbm90IHNldCBwcmlvciB0byB0aGlzIGRpcmVjdGl2ZSkgYXJlIG5vdyB1cGRhdGVkIGluXG4gKiAgICB0aGUgY29udGV4dC4gQW55IG5ldyBwcm9wZXJ0aWVzIGFyZSBpbnNlcnRlZCBleGFjdGx5IGF0IHRoZWlyIHNwb3QgaW4gdGhlIGNvbnRleHQgYW5kIGFueVxuICogICAgcHJldmlvdXNseSBzZXQgcHJvcGVydGllcyBhcmUgc2hpZnRlZCB0byBleGFjdGx5IHdoZXJlIHRoZSBjdXJzb3Igc2l0cyB3aGlsZSBpdGVyYXRpbmcgb3ZlclxuICogICAgdGhlIGNvbnRleHQuIFRoZSBlbmQgcmVzdWx0IGlzIGEgYmFsYW5jZWQgY29udGV4dCB0aGF0IGluY2x1ZGVzIHRoZSBleGFjdCBvcmRlcmluZyBvZiB0aGVcbiAqICAgIHN0eWxpbmcgcHJvcGVydGllcy92YWx1ZXMgZm9yIHRoZSBwcm92aWRlZCBpbnB1dCBmcm9tIHRoZSBkaXJlY3RpdmUuXG4gKlxuICogU1RFUCAzOlxuICogICAgQW55IHVubWF0Y2hlZCBwcm9wZXJ0aWVzIGluIHRoZSBjb250ZXh0IHRoYXQgYmVsb25nIHRvIHRoZSBkaXJlY3RpdmUgYXJlIHNldCB0byBudWxsXG4gKlxuICogT25jZSB0aGUgdXBkYXRpbmcgcGhhc2UgaXMgZG9uZSwgdGhlbiB0aGUgYWxnb3JpdGhtIHdpbGwgZGVjaWRlIHdoZXRoZXIgb3Igbm90IHRvIGZsYWcgdGhlXG4gKiBmb2xsb3ctdXAgZGlyZWN0aXZlcyAodGhlIGRpcmVjdGl2ZXMgdGhhdCB3aWxsIHBhc3MgaW4gdGhlaXIgc3R5bGluZyB2YWx1ZXMpIGRlcGVuZGluZyBvbiBpZlxuICogdGhlIFwic2hhcGVcIiBvZiB0aGUgbXVsdGktdmFsdWUgbWFwIGhhcyBjaGFuZ2VkIChlaXRoZXIgaWYgYW55IGtleXMgYXJlIHJlbW92ZWQgb3IgYWRkZWQgb3JcbiAqIGlmIHRoZXJlIGFyZSBhbnkgbmV3IGBudWxsYCB2YWx1ZXMpLiBJZiBhbnkgZm9sbG93LXVwIGRpcmVjdGl2ZXMgYXJlIGZsYWdnZWQgYXMgZGlydHkgdGhlbiB0aGVcbiAqIGFsZ29yaXRobSB3aWxsIHJ1biBhZ2FpbiBmb3IgdGhlbS4gT3RoZXJ3aXNlIGlmIHRoZSBzaGFwZSBkaWQgbm90IGNoYW5nZSB0aGVuIGFueSBmb2xsb3ctdXBcbiAqIGRpcmVjdGl2ZXMgd2lsbCBub3QgcnVuIChzbyBsb25nIGFzIHRoZWlyIGJpbmRpbmcgdmFsdWVzIHN0YXkgdGhlIHNhbWUpLlxuICpcbiAqIEByZXR1cm5zIHRoZSB0b3RhbCBhbW91bnQgb2YgbmV3IHNsb3RzIHRoYXQgd2VyZSBhbGxvY2F0ZWQgaW50byB0aGUgY29udGV4dCBkdWUgdG8gbmV3IHN0eWxpbmdcbiAqICAgICAgICAgIHByb3BlcnRpZXMgdGhhdCB3ZXJlIGRldGVjdGVkLlxuICovXG5mdW5jdGlvbiBwYXRjaFN0eWxpbmdNYXBJbnRvQ29udGV4dChcbiAgICBjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgZGlyZWN0aXZlSW5kZXg6IG51bWJlciwgcGxheWVyQnVpbGRlckluZGV4OiBudW1iZXIsIGN0eFN0YXJ0OiBudW1iZXIsXG4gICAgY3R4RW5kOiBudW1iZXIsIHByb3BzOiAoc3RyaW5nIHwgbnVsbClbXSwgdmFsdWVzOiB7W2tleTogc3RyaW5nXTogYW55fSB8IHRydWUsIGNhY2hlVmFsdWU6IGFueSxcbiAgICBlbnRyeUlzQ2xhc3NCYXNlZDogYm9vbGVhbik6IG51bWJlciB7XG4gIGxldCBkaXJ0eSA9IGZhbHNlO1xuXG4gIGNvbnN0IGNhY2hlSW5kZXggPSBNYXBCYXNlZE9mZnNldFZhbHVlc0luZGV4LlZhbHVlc1N0YXJ0UG9zaXRpb24gK1xuICAgICAgZGlyZWN0aXZlSW5kZXggKiBNYXBCYXNlZE9mZnNldFZhbHVlc0luZGV4LlNpemU7XG5cbiAgLy8gdGhlIGNhY2hlZFZhbHVlcyBhcnJheSBpcyB0aGUgcmVnaXN0cnkgb2YgYWxsIG11bHRpIHN0eWxlIHZhbHVlcyAobWFwIHZhbHVlcykuIEVhY2hcbiAgLy8gdmFsdWUgaXMgc3RvcmVkIChjYWNoZWQpIGVhY2ggdGltZSBpcyB1cGRhdGVkLlxuICBjb25zdCBjYWNoZWRWYWx1ZXMgPVxuICAgICAgY29udGV4dFtlbnRyeUlzQ2xhc3NCYXNlZCA/IFN0eWxpbmdJbmRleC5DYWNoZWRNdWx0aUNsYXNzZXMgOiBTdHlsaW5nSW5kZXguQ2FjaGVkTXVsdGlTdHlsZXNdO1xuXG4gIC8vIHRoaXMgaXMgdGhlIGluZGV4IGluIHdoaWNoIHRoaXMgZGlyZWN0aXZlIGhhcyBvd25lcnNoaXAgYWNjZXNzIHRvIHdyaXRlIHRvIHRoaXNcbiAgLy8gdmFsdWUgKGFueXRoaW5nIGJlZm9yZSBpcyBvd25lZCBieSBhIHByZXZpb3VzIGRpcmVjdGl2ZSB0aGF0IGlzIG1vcmUgaW1wb3J0YW50KVxuICBjb25zdCBvd25lcnNoaXBWYWx1ZXNTdGFydEluZGV4ID1cbiAgICAgIGNhY2hlZFZhbHVlc1tjYWNoZUluZGV4ICsgTWFwQmFzZWRPZmZzZXRWYWx1ZXNJbmRleC5Qb3NpdGlvblN0YXJ0T2Zmc2V0XTtcblxuICBjb25zdCBleGlzdGluZ0NhY2hlZFZhbHVlID0gY2FjaGVkVmFsdWVzW2NhY2hlSW5kZXggKyBNYXBCYXNlZE9mZnNldFZhbHVlc0luZGV4LlZhbHVlT2Zmc2V0XTtcbiAgY29uc3QgZXhpc3RpbmdDYWNoZWRWYWx1ZUNvdW50ID1cbiAgICAgIGNhY2hlZFZhbHVlc1tjYWNoZUluZGV4ICsgTWFwQmFzZWRPZmZzZXRWYWx1ZXNJbmRleC5WYWx1ZUNvdW50T2Zmc2V0XTtcbiAgY29uc3QgZXhpc3RpbmdDYWNoZWRWYWx1ZUlzRGlydHkgPVxuICAgICAgY2FjaGVkVmFsdWVzW2NhY2hlSW5kZXggKyBNYXBCYXNlZE9mZnNldFZhbHVlc0luZGV4LkRpcnR5RmxhZ09mZnNldF0gPT09IDE7XG5cbiAgLy8gQSBzaGFwZSBjaGFuZ2UgbWVhbnMgdGhlIHByb3ZpZGVkIG1hcCB2YWx1ZSBoYXMgZWl0aGVyIHJlbW92ZWQgb3IgYWRkZWQgbmV3IHByb3BlcnRpZXNcbiAgLy8gY29tcGFyZWQgdG8gd2hhdCB3ZXJlIGluIHRoZSBsYXN0IHRpbWUuIElmIGEgc2hhcGUgY2hhbmdlIG9jY3VycyB0aGVuIGl0IG1lYW5zIHRoYXQgYWxsXG4gIC8vIGZvbGxvdy11cCBtdWx0aS1zdHlsaW5nIGVudHJpZXMgYXJlIG9ic29sZXRlIGFuZCB3aWxsIGJlIGV4YW1pbmVkIGFnYWluIHdoZW4gQ0QgcnVuc1xuICAvLyB0aGVtLiBJZiBhIHNoYXBlIGNoYW5nZSBoYXMgbm90IG9jY3VycmVkIHRoZW4gdGhlcmUgaXMgbm8gcmVhc29uIHRvIGNoZWNrIGFueSBvdGhlclxuICAvLyBkaXJlY3RpdmUgdmFsdWVzIGlmIHRoZWlyIGlkZW50aXR5IGhhcyBub3QgY2hhbmdlZC4gSWYgYSBwcmV2aW91cyBkaXJlY3RpdmUgc2V0IHRoaXNcbiAgLy8gdmFsdWUgYXMgZGlydHkgKGJlY2F1c2UgaXRzIG93biBzaGFwZSBjaGFuZ2VkKSB0aGVuIHRoaXMgbWVhbnMgdGhhdCB0aGUgb2JqZWN0IGhhcyBiZWVuXG4gIC8vIG9mZnNldCB0byBhIGRpZmZlcmVudCBhcmVhIGluIHRoZSBjb250ZXh0LiBCZWNhdXNlIGl0cyB2YWx1ZSBoYXMgYmVlbiBvZmZzZXQgdGhlbiBpdFxuICAvLyBjYW4ndCB3cml0ZSB0byBhIHJlZ2lvbiB0aGF0IGl0IHdyb3RlIHRvIGJlZm9yZSAod2hpY2ggbWF5IGhhdmUgYmVlbiBhcGFydCBvZiBhbm90aGVyXG4gIC8vIGRpcmVjdGl2ZSkgYW5kIHRoZXJlZm9yZSBpdHMgc2hhcGUgY2hhbmdlcyB0b28uXG4gIGxldCB2YWx1ZXNFbnRyeVNoYXBlQ2hhbmdlID1cbiAgICAgIGV4aXN0aW5nQ2FjaGVkVmFsdWVJc0RpcnR5IHx8ICgoIWV4aXN0aW5nQ2FjaGVkVmFsdWUgJiYgY2FjaGVWYWx1ZSkgPyB0cnVlIDogZmFsc2UpO1xuXG4gIGxldCB0b3RhbFVuaXF1ZVZhbHVlcyA9IDA7XG4gIGxldCB0b3RhbE5ld0FsbG9jYXRlZFNsb3RzID0gMDtcblxuICAvLyB0aGlzIGlzIGEgdHJpY2sgdG8gYXZvaWQgYnVpbGRpbmcge2tleTp2YWx1ZX0gbWFwIHdoZXJlIGFsbCB0aGUgdmFsdWVzXG4gIC8vIGFyZSBgdHJ1ZWAgKHRoaXMgaGFwcGVucyB3aGVuIGEgY2xhc3NOYW1lIHN0cmluZyBpcyBwcm92aWRlZCBpbnN0ZWFkIG9mIGFcbiAgLy8gbWFwIGFzIGFuIGlucHV0IHZhbHVlIHRvIHRoaXMgc3R5bGluZyBhbGdvcml0aG0pXG4gIGNvbnN0IGFwcGx5QWxsUHJvcHMgPSB2YWx1ZXMgPT09IHRydWU7XG5cbiAgLy8gU1RFUCAxOlxuICAvLyBsb29wIHRocm91Z2ggdGhlIGVhcmxpZXIgZGlyZWN0aXZlcyBhbmQgZmlndXJlIG91dCBpZiBhbnkgcHJvcGVydGllcyBoZXJlIHdpbGwgYmUgcGxhY2VkXG4gIC8vIGluIHRoZWlyIGFyZWEgKHRoaXMgaGFwcGVucyB3aGVuIHRoZSB2YWx1ZSBpcyBudWxsIGJlY2F1c2UgdGhlIGVhcmxpZXIgZGlyZWN0aXZlIGVyYXNlZCBpdCkuXG4gIGxldCBjdHhJbmRleCA9IGN0eFN0YXJ0O1xuICBsZXQgdG90YWxSZW1haW5pbmdQcm9wZXJ0aWVzID0gcHJvcHMubGVuZ3RoO1xuICB3aGlsZSAoY3R4SW5kZXggPCBvd25lcnNoaXBWYWx1ZXNTdGFydEluZGV4KSB7XG4gICAgY29uc3QgY3VycmVudFByb3AgPSBnZXRQcm9wKGNvbnRleHQsIGN0eEluZGV4KTtcbiAgICBpZiAodG90YWxSZW1haW5pbmdQcm9wZXJ0aWVzKSB7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHByb3BzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IG1hcFByb3AgPSBwcm9wc1tpXTtcbiAgICAgICAgY29uc3Qgbm9ybWFsaXplZFByb3AgPSBtYXBQcm9wID8gKGVudHJ5SXNDbGFzc0Jhc2VkID8gbWFwUHJvcCA6IGh5cGhlbmF0ZShtYXBQcm9wKSkgOiBudWxsO1xuICAgICAgICBpZiAobm9ybWFsaXplZFByb3AgJiYgY3VycmVudFByb3AgPT09IG5vcm1hbGl6ZWRQcm9wKSB7XG4gICAgICAgICAgY29uc3QgY3VycmVudFZhbHVlID0gZ2V0VmFsdWUoY29udGV4dCwgY3R4SW5kZXgpO1xuICAgICAgICAgIGNvbnN0IGN1cnJlbnREaXJlY3RpdmVJbmRleCA9IGdldERpcmVjdGl2ZUluZGV4RnJvbUVudHJ5KGNvbnRleHQsIGN0eEluZGV4KTtcbiAgICAgICAgICBjb25zdCB2YWx1ZSA9IGFwcGx5QWxsUHJvcHMgPyB0cnVlIDogKHZhbHVlcyBhc3tba2V5OiBzdHJpbmddOiBhbnl9KVtub3JtYWxpemVkUHJvcF07XG4gICAgICAgICAgY29uc3QgY3VycmVudEZsYWcgPSBnZXRQb2ludGVycyhjb250ZXh0LCBjdHhJbmRleCk7XG4gICAgICAgICAgaWYgKGhhc1ZhbHVlQ2hhbmdlZChjdXJyZW50RmxhZywgY3VycmVudFZhbHVlLCB2YWx1ZSkgJiZcbiAgICAgICAgICAgICAgYWxsb3dWYWx1ZUNoYW5nZShjdXJyZW50VmFsdWUsIHZhbHVlLCBjdXJyZW50RGlyZWN0aXZlSW5kZXgsIGRpcmVjdGl2ZUluZGV4KSkge1xuICAgICAgICAgICAgc2V0VmFsdWUoY29udGV4dCwgY3R4SW5kZXgsIHZhbHVlKTtcbiAgICAgICAgICAgIHNldFBsYXllckJ1aWxkZXJJbmRleChjb250ZXh0LCBjdHhJbmRleCwgcGxheWVyQnVpbGRlckluZGV4LCBkaXJlY3RpdmVJbmRleCk7XG4gICAgICAgICAgICBpZiAoaGFzSW5pdGlhbFZhbHVlQ2hhbmdlZChjb250ZXh0LCBjdXJyZW50RmxhZywgdmFsdWUpKSB7XG4gICAgICAgICAgICAgIHNldERpcnR5KGNvbnRleHQsIGN0eEluZGV4LCB0cnVlKTtcbiAgICAgICAgICAgICAgZGlydHkgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBwcm9wc1tpXSA9IG51bGw7XG4gICAgICAgICAgdG90YWxSZW1haW5pbmdQcm9wZXJ0aWVzLS07XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgY3R4SW5kZXggKz0gU3R5bGluZ0luZGV4LlNpemU7XG4gIH1cblxuICAvLyBTVEVQIDI6XG4gIC8vIGFwcGx5IHRoZSBsZWZ0IG92ZXIgcHJvcGVydGllcyB0byB0aGUgY29udGV4dCBpbiB0aGUgY29ycmVjdCBvcmRlci5cbiAgaWYgKHRvdGFsUmVtYWluaW5nUHJvcGVydGllcykge1xuICAgIGNvbnN0IHNhbml0aXplciA9IGVudHJ5SXNDbGFzc0Jhc2VkID8gbnVsbCA6IGdldFN0eWxlU2FuaXRpemVyKGNvbnRleHQsIGRpcmVjdGl2ZUluZGV4KTtcbiAgICBwcm9wZXJ0aWVzTG9vcDogZm9yIChsZXQgaSA9IDA7IGkgPCBwcm9wcy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgbWFwUHJvcCA9IHByb3BzW2ldO1xuXG4gICAgICBpZiAoIW1hcFByb3ApIHtcbiAgICAgICAgLy8gdGhpcyBpcyBhbiBlYXJseSBleGl0IGluIGNhc2UgYSB2YWx1ZSB3YXMgYWxyZWFkeSBlbmNvdW50ZXJlZCBhYm92ZSBpbiB0aGVcbiAgICAgICAgLy8gcHJldmlvdXMgbG9vcCAod2hpY2ggbWVhbnMgdGhhdCB0aGUgcHJvcGVydHkgd2FzIGFwcGxpZWQgb3IgcmVqZWN0ZWQpXG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBjb25zdCB2YWx1ZSA9IGFwcGx5QWxsUHJvcHMgPyB0cnVlIDogKHZhbHVlcyBhc3tba2V5OiBzdHJpbmddOiBhbnl9KVttYXBQcm9wXTtcbiAgICAgIGNvbnN0IG5vcm1hbGl6ZWRQcm9wID0gZW50cnlJc0NsYXNzQmFzZWQgPyBtYXBQcm9wIDogaHlwaGVuYXRlKG1hcFByb3ApO1xuICAgICAgY29uc3QgaXNJbnNpZGVPd25lcnNoaXBBcmVhID0gY3R4SW5kZXggPj0gb3duZXJzaGlwVmFsdWVzU3RhcnRJbmRleDtcblxuICAgICAgZm9yIChsZXQgaiA9IGN0eEluZGV4OyBqIDwgY3R4RW5kOyBqICs9IFN0eWxpbmdJbmRleC5TaXplKSB7XG4gICAgICAgIGNvbnN0IGRpc3RhbnRDdHhQcm9wID0gZ2V0UHJvcChjb250ZXh0LCBqKTtcbiAgICAgICAgaWYgKGRpc3RhbnRDdHhQcm9wID09PSBub3JtYWxpemVkUHJvcCkge1xuICAgICAgICAgIGNvbnN0IGRpc3RhbnRDdHhEaXJlY3RpdmVJbmRleCA9IGdldERpcmVjdGl2ZUluZGV4RnJvbUVudHJ5KGNvbnRleHQsIGopO1xuICAgICAgICAgIGNvbnN0IGRpc3RhbnRDdHhQbGF5ZXJCdWlsZGVySW5kZXggPSBnZXRQbGF5ZXJCdWlsZGVySW5kZXgoY29udGV4dCwgaik7XG4gICAgICAgICAgY29uc3QgZGlzdGFudEN0eFZhbHVlID0gZ2V0VmFsdWUoY29udGV4dCwgaik7XG4gICAgICAgICAgY29uc3QgZGlzdGFudEN0eEZsYWcgPSBnZXRQb2ludGVycyhjb250ZXh0LCBqKTtcblxuICAgICAgICAgIGlmIChhbGxvd1ZhbHVlQ2hhbmdlKGRpc3RhbnRDdHhWYWx1ZSwgdmFsdWUsIGRpc3RhbnRDdHhEaXJlY3RpdmVJbmRleCwgZGlyZWN0aXZlSW5kZXgpKSB7XG4gICAgICAgICAgICAvLyBldmVuIGlmIHRoZSBlbnRyeSBpc24ndCB1cGRhdGVkIChieSB2YWx1ZSBvciBkaXJlY3RpdmVJbmRleCkgdGhlblxuICAgICAgICAgICAgLy8gaXQgc2hvdWxkIHN0aWxsIGJlIG1vdmVkIG92ZXIgdG8gdGhlIGNvcnJlY3Qgc3BvdCBpbiB0aGUgYXJyYXkgc29cbiAgICAgICAgICAgIC8vIHRoZSBpdGVyYXRpb24gbG9vcCBpcyB0aWdodGVyLlxuICAgICAgICAgICAgaWYgKGlzSW5zaWRlT3duZXJzaGlwQXJlYSkge1xuICAgICAgICAgICAgICBzd2FwTXVsdGlDb250ZXh0RW50cmllcyhjb250ZXh0LCBjdHhJbmRleCwgaik7XG4gICAgICAgICAgICAgIHRvdGFsVW5pcXVlVmFsdWVzKys7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChoYXNWYWx1ZUNoYW5nZWQoZGlzdGFudEN0eEZsYWcsIGRpc3RhbnRDdHhWYWx1ZSwgdmFsdWUpKSB7XG4gICAgICAgICAgICAgIGlmICh2YWx1ZSA9PT0gbnVsbCB8fCB2YWx1ZSA9PT0gdW5kZWZpbmVkICYmIHZhbHVlICE9PSBkaXN0YW50Q3R4VmFsdWUpIHtcbiAgICAgICAgICAgICAgICB2YWx1ZXNFbnRyeVNoYXBlQ2hhbmdlID0gdHJ1ZTtcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIHNldFZhbHVlKGNvbnRleHQsIGN0eEluZGV4LCB2YWx1ZSk7XG5cbiAgICAgICAgICAgICAgLy8gU0tJUCBJRiBJTklUSUFMIENIRUNLXG4gICAgICAgICAgICAgIC8vIElmIHRoZSBmb3JtZXIgYHZhbHVlYCBpcyBgbnVsbGAgdGhlbiBpdCBtZWFucyB0aGF0IGFuIGluaXRpYWwgdmFsdWVcbiAgICAgICAgICAgICAgLy8gY291bGQgYmUgYmVpbmcgcmVuZGVyZWQgb24gc2NyZWVuLiBJZiB0aGF0IGlzIHRoZSBjYXNlIHRoZW4gdGhlcmUgaXNcbiAgICAgICAgICAgICAgLy8gbm8gcG9pbnQgaW4gdXBkYXRpbmcgdGhlIHZhbHVlIGluIGNhc2UgaXQgbWF0Y2hlcy4gSW4gb3RoZXIgd29yZHMgaWYgdGhlXG4gICAgICAgICAgICAgIC8vIG5ldyB2YWx1ZSBpcyB0aGUgZXhhY3Qgc2FtZSBhcyB0aGUgcHJldmlvdXNseSByZW5kZXJlZCB2YWx1ZSAod2hpY2hcbiAgICAgICAgICAgICAgLy8gaGFwcGVucyB0byBiZSB0aGUgaW5pdGlhbCB2YWx1ZSkgdGhlbiBkbyBub3RoaW5nLlxuICAgICAgICAgICAgICBpZiAoZGlzdGFudEN0eFZhbHVlICE9PSBudWxsIHx8XG4gICAgICAgICAgICAgICAgICBoYXNJbml0aWFsVmFsdWVDaGFuZ2VkKGNvbnRleHQsIGRpc3RhbnRDdHhGbGFnLCB2YWx1ZSkpIHtcbiAgICAgICAgICAgICAgICBzZXREaXJ0eShjb250ZXh0LCBjdHhJbmRleCwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgZGlydHkgPSB0cnVlO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChkaXN0YW50Q3R4RGlyZWN0aXZlSW5kZXggIT09IGRpcmVjdGl2ZUluZGV4IHx8XG4gICAgICAgICAgICAgICAgcGxheWVyQnVpbGRlckluZGV4ICE9PSBkaXN0YW50Q3R4UGxheWVyQnVpbGRlckluZGV4KSB7XG4gICAgICAgICAgICAgIHNldFBsYXllckJ1aWxkZXJJbmRleChjb250ZXh0LCBjdHhJbmRleCwgcGxheWVyQnVpbGRlckluZGV4LCBkaXJlY3RpdmVJbmRleCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY3R4SW5kZXggKz0gU3R5bGluZ0luZGV4LlNpemU7XG4gICAgICAgICAgY29udGludWUgcHJvcGVydGllc0xvb3A7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gZmFsbGJhY2sgY2FzZSAuLi4gdmFsdWUgbm90IGZvdW5kIGF0IGFsbCBpbiB0aGUgY29udGV4dFxuICAgICAgaWYgKHZhbHVlICE9IG51bGwpIHtcbiAgICAgICAgdmFsdWVzRW50cnlTaGFwZUNoYW5nZSA9IHRydWU7XG4gICAgICAgIHRvdGFsVW5pcXVlVmFsdWVzKys7XG4gICAgICAgIGNvbnN0IGZsYWcgPSBwcmVwYXJlSW5pdGlhbEZsYWcoY29udGV4dCwgbm9ybWFsaXplZFByb3AsIGVudHJ5SXNDbGFzc0Jhc2VkLCBzYW5pdGl6ZXIpIHxcbiAgICAgICAgICAgIFN0eWxpbmdGbGFncy5EaXJ0eTtcblxuICAgICAgICBjb25zdCBpbnNlcnRpb25JbmRleCA9IGlzSW5zaWRlT3duZXJzaGlwQXJlYSA/XG4gICAgICAgICAgICBjdHhJbmRleCA6XG4gICAgICAgICAgICAob3duZXJzaGlwVmFsdWVzU3RhcnRJbmRleCArIHRvdGFsTmV3QWxsb2NhdGVkU2xvdHMgKiBTdHlsaW5nSW5kZXguU2l6ZSk7XG4gICAgICAgIGluc2VydE5ld011bHRpUHJvcGVydHkoXG4gICAgICAgICAgICBjb250ZXh0LCBpbnNlcnRpb25JbmRleCwgZW50cnlJc0NsYXNzQmFzZWQsIG5vcm1hbGl6ZWRQcm9wLCBmbGFnLCB2YWx1ZSwgZGlyZWN0aXZlSW5kZXgsXG4gICAgICAgICAgICBwbGF5ZXJCdWlsZGVySW5kZXgpO1xuXG4gICAgICAgIHRvdGFsTmV3QWxsb2NhdGVkU2xvdHMrKztcbiAgICAgICAgY3R4RW5kICs9IFN0eWxpbmdJbmRleC5TaXplO1xuICAgICAgICBjdHhJbmRleCArPSBTdHlsaW5nSW5kZXguU2l6ZTtcblxuICAgICAgICBkaXJ0eSA9IHRydWU7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8gU1RFUCAzOlxuICAvLyBSZW1vdmUgKG51bGxpZnkpIGFueSBleGlzdGluZyBlbnRyaWVzIGluIHRoZSBjb250ZXh0IHRoYXQgd2VyZSBub3QgYXBhcnQgb2YgdGhlXG4gIC8vIG1hcCBpbnB1dCB2YWx1ZSB0aGF0IHdhcyBwYXNzZWQgaW50byB0aGlzIGFsZ29yaXRobSBmb3IgdGhpcyBkaXJlY3RpdmUuXG4gIHdoaWxlIChjdHhJbmRleCA8IGN0eEVuZCkge1xuICAgIHZhbHVlc0VudHJ5U2hhcGVDaGFuZ2UgPSB0cnVlOyAgLy8gc29tZSB2YWx1ZXMgYXJlIG1pc3NpbmdcbiAgICBjb25zdCBjdHhWYWx1ZSA9IGdldFZhbHVlKGNvbnRleHQsIGN0eEluZGV4KTtcbiAgICBjb25zdCBjdHhGbGFnID0gZ2V0UG9pbnRlcnMoY29udGV4dCwgY3R4SW5kZXgpO1xuICAgIGNvbnN0IGN0eERpcmVjdGl2ZSA9IGdldERpcmVjdGl2ZUluZGV4RnJvbUVudHJ5KGNvbnRleHQsIGN0eEluZGV4KTtcbiAgICBpZiAoY3R4VmFsdWUgIT0gbnVsbCkge1xuICAgICAgdmFsdWVzRW50cnlTaGFwZUNoYW5nZSA9IHRydWU7XG4gICAgfVxuICAgIGlmIChoYXNWYWx1ZUNoYW5nZWQoY3R4RmxhZywgY3R4VmFsdWUsIG51bGwpKSB7XG4gICAgICBzZXRWYWx1ZShjb250ZXh0LCBjdHhJbmRleCwgbnVsbCk7XG4gICAgICAvLyBvbmx5IGlmIHRoZSBpbml0aWFsIHZhbHVlIGlzIGZhbHN5IHRoZW5cbiAgICAgIGlmIChoYXNJbml0aWFsVmFsdWVDaGFuZ2VkKGNvbnRleHQsIGN0eEZsYWcsIGN0eFZhbHVlKSkge1xuICAgICAgICBzZXREaXJ0eShjb250ZXh0LCBjdHhJbmRleCwgdHJ1ZSk7XG4gICAgICAgIGRpcnR5ID0gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIHNldFBsYXllckJ1aWxkZXJJbmRleChjb250ZXh0LCBjdHhJbmRleCwgcGxheWVyQnVpbGRlckluZGV4LCBkaXJlY3RpdmVJbmRleCk7XG4gICAgfVxuICAgIGN0eEluZGV4ICs9IFN0eWxpbmdJbmRleC5TaXplO1xuICB9XG5cbiAgLy8gQmVjYXVzZSB0aGUgb2JqZWN0IHNoYXBlIGhhcyBjaGFuZ2VkLCB0aGlzIG1lYW5zIHRoYXQgYWxsIGZvbGxvdy11cCBkaXJlY3RpdmVzIHdpbGwgbmVlZCB0b1xuICAvLyByZWFwcGx5IHRoZWlyIHZhbHVlcyBpbnRvIHRoZSBvYmplY3QuIEZvciB0aGlzIHRvIGhhcHBlbiwgdGhlIGNhY2hlZCBhcnJheSBuZWVkcyB0byBiZSB1cGRhdGVkXG4gIC8vIHdpdGggZGlydHkgZmxhZ3Mgc28gdGhhdCBmb2xsb3ctdXAgY2FsbHMgdG8gYHVwZGF0ZVN0eWxpbmdNYXBgIHdpbGwgcmVhcHBseSB0aGVpciBzdHlsaW5nIGNvZGUuXG4gIC8vIHRoZSByZWFwcGxpY2F0aW9uIG9mIHN0eWxpbmcgY29kZSB3aXRoaW4gdGhlIGNvbnRleHQgd2lsbCByZXNoYXBlIGl0IGFuZCB1cGRhdGUgdGhlIG9mZnNldFxuICAvLyB2YWx1ZXMgKGFsc28gZm9sbG93LXVwIGRpcmVjdGl2ZXMgY2FuIHdyaXRlIG5ldyB2YWx1ZXMgaW4gY2FzZSBlYXJsaWVyIGRpcmVjdGl2ZXMgc2V0IGFueXRoaW5nXG4gIC8vIHRvIG51bGwgZHVlIHRvIHJlbW92YWxzIG9yIGZhbHN5IHZhbHVlcykuXG4gIHZhbHVlc0VudHJ5U2hhcGVDaGFuZ2UgPSB2YWx1ZXNFbnRyeVNoYXBlQ2hhbmdlIHx8IGV4aXN0aW5nQ2FjaGVkVmFsdWVDb3VudCAhPT0gdG90YWxVbmlxdWVWYWx1ZXM7XG4gIHVwZGF0ZUNhY2hlZE1hcFZhbHVlKFxuICAgICAgY29udGV4dCwgZGlyZWN0aXZlSW5kZXgsIGVudHJ5SXNDbGFzc0Jhc2VkLCBjYWNoZVZhbHVlLCBvd25lcnNoaXBWYWx1ZXNTdGFydEluZGV4LCBjdHhFbmQsXG4gICAgICB0b3RhbFVuaXF1ZVZhbHVlcywgdmFsdWVzRW50cnlTaGFwZUNoYW5nZSk7XG5cbiAgaWYgKGRpcnR5KSB7XG4gICAgc2V0Q29udGV4dERpcnR5KGNvbnRleHQsIHRydWUpO1xuICAgIHNldERpcmVjdGl2ZURpcnR5KGNvbnRleHQsIGRpcmVjdGl2ZUluZGV4LCB0cnVlKTtcbiAgfVxuXG4gIHJldHVybiB0b3RhbE5ld0FsbG9jYXRlZFNsb3RzO1xufVxuXG4vKipcbiAqIFNldHMgYW5kIHJlc29sdmVzIGEgc2luZ2xlIGNsYXNzIHZhbHVlIG9uIHRoZSBwcm92aWRlZCBgU3R5bGluZ0NvbnRleHRgIHNvXG4gKiB0aGF0IHRoZXkgY2FuIGJlIGFwcGxpZWQgdG8gdGhlIGVsZW1lbnQgb25jZSBgcmVuZGVyU3R5bGluZ2AgaXMgY2FsbGVkLlxuICpcbiAqIEBwYXJhbSBjb250ZXh0IFRoZSBzdHlsaW5nIGNvbnRleHQgdGhhdCB3aWxsIGJlIHVwZGF0ZWQgd2l0aCB0aGVcbiAqICAgIG5ld2x5IHByb3ZpZGVkIGNsYXNzIHZhbHVlLlxuICogQHBhcmFtIG9mZnNldCBUaGUgaW5kZXggb2YgdGhlIENTUyBjbGFzcyB3aGljaCBpcyBiZWluZyB1cGRhdGVkLlxuICogQHBhcmFtIGFkZE9yUmVtb3ZlIFdoZXRoZXIgb3Igbm90IHRvIGFkZCBvciByZW1vdmUgdGhlIENTUyBjbGFzc1xuICogQHBhcmFtIGRpcmVjdGl2ZVJlZiBhbiBvcHRpb25hbCByZWZlcmVuY2UgdG8gdGhlIGRpcmVjdGl2ZSByZXNwb25zaWJsZVxuICogICAgZm9yIHRoaXMgYmluZGluZyBjaGFuZ2UuIElmIHByZXNlbnQgdGhlbiBzdHlsZSBiaW5kaW5nIHdpbGwgb25seVxuICogICAgYWN0dWFsaXplIGlmIHRoZSBkaXJlY3RpdmUgaGFzIG93bmVyc2hpcCBvdmVyIHRoaXMgYmluZGluZ1xuICogICAgKHNlZSBzdHlsaW5nLnRzI2RpcmVjdGl2ZXMgZm9yIG1vcmUgaW5mb3JtYXRpb24gYWJvdXQgdGhlIGFsZ29yaXRobSkuXG4gKiBAcGFyYW0gZm9yY2VPdmVycmlkZSB3aGV0aGVyIG9yIG5vdCB0byBza2lwIGFsbCBkaXJlY3RpdmUgcHJpb3JpdGl6YXRpb25cbiAqICAgIGFuZCBqdXN0IGFwcGx5IHRoZSB2YWx1ZSByZWdhcmRsZXNzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gdXBkYXRlQ2xhc3NQcm9wKFxuICAgIGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBvZmZzZXQ6IG51bWJlcixcbiAgICBpbnB1dDogYm9vbGVhbiB8IEJvdW5kUGxheWVyRmFjdG9yeTxib29sZWFufG51bGw+fCBudWxsLCBkaXJlY3RpdmVSZWY/OiBhbnksXG4gICAgZm9yY2VPdmVycmlkZT86IGJvb2xlYW4pOiB2b2lkIHtcbiAgdXBkYXRlU2luZ2xlU3R5bGluZ1ZhbHVlKGNvbnRleHQsIG9mZnNldCwgaW5wdXQsIHRydWUsIGRpcmVjdGl2ZVJlZiwgZm9yY2VPdmVycmlkZSk7XG59XG5cbi8qKlxuICogU2V0cyBhbmQgcmVzb2x2ZXMgYSBzaW5nbGUgc3R5bGUgdmFsdWUgb24gdGhlIHByb3ZpZGVkIGBTdHlsaW5nQ29udGV4dGAgc29cbiAqIHRoYXQgdGhleSBjYW4gYmUgYXBwbGllZCB0byB0aGUgZWxlbWVudCBvbmNlIGByZW5kZXJTdHlsaW5nYCBpcyBjYWxsZWQuXG4gKlxuICogTm90ZSB0aGF0IHByb3AtbGV2ZWwgc3R5bGluZyB2YWx1ZXMgYXJlIGNvbnNpZGVyZWQgaGlnaGVyIHByaW9yaXR5IHRoYW4gYW55IHN0eWxpbmcgdGhhdFxuICogaGFzIGJlZW4gYXBwbGllZCB1c2luZyBgdXBkYXRlU3R5bGluZ01hcGAsIHRoZXJlZm9yZSwgd2hlbiBzdHlsaW5nIHZhbHVlcyBhcmUgcmVuZGVyZWRcbiAqIHRoZW4gYW55IHN0eWxlcy9jbGFzc2VzIHRoYXQgaGF2ZSBiZWVuIGFwcGxpZWQgdXNpbmcgdGhpcyBmdW5jdGlvbiB3aWxsIGJlIGNvbnNpZGVyZWQgZmlyc3RcbiAqICh0aGVuIG11bHRpIHZhbHVlcyBzZWNvbmQgYW5kIHRoZW4gaW5pdGlhbCB2YWx1ZXMgYXMgYSBiYWNrdXApLlxuICpcbiAqIEBwYXJhbSBjb250ZXh0IFRoZSBzdHlsaW5nIGNvbnRleHQgdGhhdCB3aWxsIGJlIHVwZGF0ZWQgd2l0aCB0aGVcbiAqICAgIG5ld2x5IHByb3ZpZGVkIHN0eWxlIHZhbHVlLlxuICogQHBhcmFtIG9mZnNldCBUaGUgaW5kZXggb2YgdGhlIHByb3BlcnR5IHdoaWNoIGlzIGJlaW5nIHVwZGF0ZWQuXG4gKiBAcGFyYW0gdmFsdWUgVGhlIENTUyBzdHlsZSB2YWx1ZSB0aGF0IHdpbGwgYmUgYXNzaWduZWRcbiAqIEBwYXJhbSBkaXJlY3RpdmVSZWYgYW4gb3B0aW9uYWwgcmVmZXJlbmNlIHRvIHRoZSBkaXJlY3RpdmUgcmVzcG9uc2libGVcbiAqICAgIGZvciB0aGlzIGJpbmRpbmcgY2hhbmdlLiBJZiBwcmVzZW50IHRoZW4gc3R5bGUgYmluZGluZyB3aWxsIG9ubHlcbiAqICAgIGFjdHVhbGl6ZSBpZiB0aGUgZGlyZWN0aXZlIGhhcyBvd25lcnNoaXAgb3ZlciB0aGlzIGJpbmRpbmdcbiAqICAgIChzZWUgc3R5bGluZy50cyNkaXJlY3RpdmVzIGZvciBtb3JlIGluZm9ybWF0aW9uIGFib3V0IHRoZSBhbGdvcml0aG0pLlxuICogQHBhcmFtIGZvcmNlT3ZlcnJpZGUgd2hldGhlciBvciBub3QgdG8gc2tpcCBhbGwgZGlyZWN0aXZlIHByaW9yaXRpemF0aW9uXG4gKiAgICBhbmQganVzdCBhcHBseSB0aGUgdmFsdWUgcmVnYXJkbGVzcy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHVwZGF0ZVN0eWxlUHJvcChcbiAgICBjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgb2Zmc2V0OiBudW1iZXIsXG4gICAgaW5wdXQ6IHN0cmluZyB8IGJvb2xlYW4gfCBudWxsIHwgQm91bmRQbGF5ZXJGYWN0b3J5PHN0cmluZ3xib29sZWFufG51bGw+LCBkaXJlY3RpdmVSZWY/OiBhbnksXG4gICAgZm9yY2VPdmVycmlkZT86IGJvb2xlYW4pOiB2b2lkIHtcbiAgdXBkYXRlU2luZ2xlU3R5bGluZ1ZhbHVlKGNvbnRleHQsIG9mZnNldCwgaW5wdXQsIGZhbHNlLCBkaXJlY3RpdmVSZWYsIGZvcmNlT3ZlcnJpZGUpO1xufVxuXG5mdW5jdGlvbiB1cGRhdGVTaW5nbGVTdHlsaW5nVmFsdWUoXG4gICAgY29udGV4dDogU3R5bGluZ0NvbnRleHQsIG9mZnNldDogbnVtYmVyLFxuICAgIGlucHV0OiBzdHJpbmcgfCBib29sZWFuIHwgbnVsbCB8IEJvdW5kUGxheWVyRmFjdG9yeTxzdHJpbmd8Ym9vbGVhbnxudWxsPiwgaXNDbGFzc0Jhc2VkOiBib29sZWFuLFxuICAgIGRpcmVjdGl2ZVJlZjogYW55LCBmb3JjZU92ZXJyaWRlPzogYm9vbGVhbik6IHZvaWQge1xuICBjb25zdCBkaXJlY3RpdmVJbmRleCA9IGdldERpcmVjdGl2ZUluZGV4RnJvbVJlZ2lzdHJ5KGNvbnRleHQsIGRpcmVjdGl2ZVJlZiB8fCBudWxsKTtcbiAgY29uc3Qgc2luZ2xlSW5kZXggPSBnZXRTaW5nbGVQcm9wSW5kZXhWYWx1ZShjb250ZXh0LCBkaXJlY3RpdmVJbmRleCwgb2Zmc2V0LCBpc0NsYXNzQmFzZWQpO1xuICBjb25zdCBjdXJyVmFsdWUgPSBnZXRWYWx1ZShjb250ZXh0LCBzaW5nbGVJbmRleCk7XG4gIGNvbnN0IGN1cnJGbGFnID0gZ2V0UG9pbnRlcnMoY29udGV4dCwgc2luZ2xlSW5kZXgpO1xuICBjb25zdCBjdXJyRGlyZWN0aXZlID0gZ2V0RGlyZWN0aXZlSW5kZXhGcm9tRW50cnkoY29udGV4dCwgc2luZ2xlSW5kZXgpO1xuICBjb25zdCB2YWx1ZTogc3RyaW5nfGJvb2xlYW58bnVsbCA9IChpbnB1dCBpbnN0YW5jZW9mIEJvdW5kUGxheWVyRmFjdG9yeSkgPyBpbnB1dC52YWx1ZSA6IGlucHV0O1xuXG4gIGlmIChoYXNWYWx1ZUNoYW5nZWQoY3VyckZsYWcsIGN1cnJWYWx1ZSwgdmFsdWUpICYmXG4gICAgICAoZm9yY2VPdmVycmlkZSB8fCBhbGxvd1ZhbHVlQ2hhbmdlKGN1cnJWYWx1ZSwgdmFsdWUsIGN1cnJEaXJlY3RpdmUsIGRpcmVjdGl2ZUluZGV4KSkpIHtcbiAgICBjb25zdCBpc0NsYXNzQmFzZWQgPSAoY3VyckZsYWcgJiBTdHlsaW5nRmxhZ3MuQ2xhc3MpID09PSBTdHlsaW5nRmxhZ3MuQ2xhc3M7XG4gICAgY29uc3QgZWxlbWVudCA9IGNvbnRleHRbU3R5bGluZ0luZGV4LkVsZW1lbnRQb3NpdGlvbl0gIWFzIEhUTUxFbGVtZW50O1xuICAgIGNvbnN0IHBsYXllckJ1aWxkZXIgPSBpbnB1dCBpbnN0YW5jZW9mIEJvdW5kUGxheWVyRmFjdG9yeSA/XG4gICAgICAgIG5ldyBDbGFzc0FuZFN0eWxlUGxheWVyQnVpbGRlcihcbiAgICAgICAgICAgIGlucHV0IGFzIGFueSwgZWxlbWVudCwgaXNDbGFzc0Jhc2VkID8gQmluZGluZ1R5cGUuQ2xhc3MgOiBCaW5kaW5nVHlwZS5TdHlsZSkgOlxuICAgICAgICBudWxsO1xuICAgIGNvbnN0IHZhbHVlID0gKHBsYXllckJ1aWxkZXIgPyAoaW5wdXQgYXMgQm91bmRQbGF5ZXJGYWN0b3J5PGFueT4pLnZhbHVlIDogaW5wdXQpIGFzIHN0cmluZyB8XG4gICAgICAgIGJvb2xlYW4gfCBudWxsO1xuICAgIGNvbnN0IGN1cnJQbGF5ZXJJbmRleCA9IGdldFBsYXllckJ1aWxkZXJJbmRleChjb250ZXh0LCBzaW5nbGVJbmRleCk7XG5cbiAgICBsZXQgcGxheWVyQnVpbGRlcnNBcmVEaXJ0eSA9IGZhbHNlO1xuICAgIGxldCBwbGF5ZXJCdWlsZGVySW5kZXggPSBwbGF5ZXJCdWlsZGVyID8gY3VyclBsYXllckluZGV4IDogMDtcbiAgICBpZiAoaGFzUGxheWVyQnVpbGRlckNoYW5nZWQoY29udGV4dCwgcGxheWVyQnVpbGRlciwgY3VyclBsYXllckluZGV4KSkge1xuICAgICAgY29uc3QgbmV3SW5kZXggPSBzZXRQbGF5ZXJCdWlsZGVyKGNvbnRleHQsIHBsYXllckJ1aWxkZXIsIGN1cnJQbGF5ZXJJbmRleCk7XG4gICAgICBwbGF5ZXJCdWlsZGVySW5kZXggPSBwbGF5ZXJCdWlsZGVyID8gbmV3SW5kZXggOiAwO1xuICAgICAgcGxheWVyQnVpbGRlcnNBcmVEaXJ0eSA9IHRydWU7XG4gICAgfVxuXG4gICAgaWYgKHBsYXllckJ1aWxkZXJzQXJlRGlydHkgfHwgY3VyckRpcmVjdGl2ZSAhPT0gZGlyZWN0aXZlSW5kZXgpIHtcbiAgICAgIHNldFBsYXllckJ1aWxkZXJJbmRleChjb250ZXh0LCBzaW5nbGVJbmRleCwgcGxheWVyQnVpbGRlckluZGV4LCBkaXJlY3RpdmVJbmRleCk7XG4gICAgfVxuXG4gICAgaWYgKGN1cnJEaXJlY3RpdmUgIT09IGRpcmVjdGl2ZUluZGV4KSB7XG4gICAgICBjb25zdCBwcm9wID0gZ2V0UHJvcChjb250ZXh0LCBzaW5nbGVJbmRleCk7XG4gICAgICBjb25zdCBzYW5pdGl6ZXIgPSBnZXRTdHlsZVNhbml0aXplcihjb250ZXh0LCBkaXJlY3RpdmVJbmRleCk7XG4gICAgICBzZXRTYW5pdGl6ZUZsYWcoY29udGV4dCwgc2luZ2xlSW5kZXgsIChzYW5pdGl6ZXIgJiYgc2FuaXRpemVyKHByb3ApKSA/IHRydWUgOiBmYWxzZSk7XG4gICAgfVxuXG4gICAgLy8gdGhlIHZhbHVlIHdpbGwgYWx3YXlzIGdldCB1cGRhdGVkIChldmVuIGlmIHRoZSBkaXJ0eSBmbGFnIGlzIHNraXBwZWQpXG4gICAgc2V0VmFsdWUoY29udGV4dCwgc2luZ2xlSW5kZXgsIHZhbHVlKTtcbiAgICBjb25zdCBpbmRleEZvck11bHRpID0gZ2V0TXVsdGlPclNpbmdsZUluZGV4KGN1cnJGbGFnKTtcblxuICAgIC8vIGlmIHRoZSB2YWx1ZSBpcyB0aGUgc2FtZSBpbiB0aGUgbXVsdGktYXJlYSB0aGVuIHRoZXJlJ3Mgbm8gcG9pbnQgaW4gcmUtYXNzZW1ibGluZ1xuICAgIGNvbnN0IHZhbHVlRm9yTXVsdGkgPSBnZXRWYWx1ZShjb250ZXh0LCBpbmRleEZvck11bHRpKTtcbiAgICBpZiAoIXZhbHVlRm9yTXVsdGkgfHwgaGFzVmFsdWVDaGFuZ2VkKGN1cnJGbGFnLCB2YWx1ZUZvck11bHRpLCB2YWx1ZSkpIHtcbiAgICAgIGxldCBtdWx0aURpcnR5ID0gZmFsc2U7XG4gICAgICBsZXQgc2luZ2xlRGlydHkgPSB0cnVlO1xuXG4gICAgICAvLyBvbmx5IHdoZW4gdGhlIHZhbHVlIGlzIHNldCB0byBgbnVsbGAgc2hvdWxkIHRoZSBtdWx0aS12YWx1ZSBnZXQgZmxhZ2dlZFxuICAgICAgaWYgKCF2YWx1ZUV4aXN0cyh2YWx1ZSwgaXNDbGFzc0Jhc2VkKSAmJiB2YWx1ZUV4aXN0cyh2YWx1ZUZvck11bHRpLCBpc0NsYXNzQmFzZWQpKSB7XG4gICAgICAgIG11bHRpRGlydHkgPSB0cnVlO1xuICAgICAgICBzaW5nbGVEaXJ0eSA9IGZhbHNlO1xuICAgICAgfVxuXG4gICAgICBzZXREaXJ0eShjb250ZXh0LCBpbmRleEZvck11bHRpLCBtdWx0aURpcnR5KTtcbiAgICAgIHNldERpcnR5KGNvbnRleHQsIHNpbmdsZUluZGV4LCBzaW5nbGVEaXJ0eSk7XG4gICAgICBzZXREaXJlY3RpdmVEaXJ0eShjb250ZXh0LCBkaXJlY3RpdmVJbmRleCwgdHJ1ZSk7XG4gICAgICBzZXRDb250ZXh0RGlydHkoY29udGV4dCwgdHJ1ZSk7XG4gICAgfVxuXG4gICAgaWYgKHBsYXllckJ1aWxkZXJzQXJlRGlydHkpIHtcbiAgICAgIHNldENvbnRleHRQbGF5ZXJzRGlydHkoY29udGV4dCwgdHJ1ZSk7XG4gICAgfVxuICB9XG59XG5cblxuLyoqXG4gKiBSZW5kZXJzIGFsbCBxdWV1ZWQgc3R5bGluZyB1c2luZyBhIHJlbmRlcmVyIG9udG8gdGhlIGdpdmVuIGVsZW1lbnQuXG4gKlxuICogVGhpcyBmdW5jdGlvbiB3b3JrcyBieSByZW5kZXJpbmcgYW55IHN0eWxlcyAodGhhdCBoYXZlIGJlZW4gYXBwbGllZFxuICogdXNpbmcgYHVwZGF0ZVN0eWxpbmdNYXBgKSBhbmQgYW55IGNsYXNzZXMgKHRoYXQgaGF2ZSBiZWVuIGFwcGxpZWQgdXNpbmdcbiAqIGB1cGRhdGVTdHlsZVByb3BgKSBvbnRvIHRoZSBwcm92aWRlZCBlbGVtZW50IHVzaW5nIHRoZSBwcm92aWRlZCByZW5kZXJlci5cbiAqIEp1c3QgYmVmb3JlIHRoZSBzdHlsZXMvY2xhc3NlcyBhcmUgcmVuZGVyZWQgYSBmaW5hbCBrZXkvdmFsdWUgc3R5bGUgbWFwXG4gKiB3aWxsIGJlIGFzc2VtYmxlZCAoaWYgYHN0eWxlU3RvcmVgIG9yIGBjbGFzc1N0b3JlYCBhcmUgcHJvdmlkZWQpLlxuICpcbiAqIEBwYXJhbSBsRWxlbWVudCB0aGUgZWxlbWVudCB0aGF0IHRoZSBzdHlsZXMgd2lsbCBiZSByZW5kZXJlZCBvblxuICogQHBhcmFtIGNvbnRleHQgVGhlIHN0eWxpbmcgY29udGV4dCB0aGF0IHdpbGwgYmUgdXNlZCB0byBkZXRlcm1pbmVcbiAqICAgICAgd2hhdCBzdHlsZXMgd2lsbCBiZSByZW5kZXJlZFxuICogQHBhcmFtIHJlbmRlcmVyIHRoZSByZW5kZXJlciB0aGF0IHdpbGwgYmUgdXNlZCB0byBhcHBseSB0aGUgc3R5bGluZ1xuICogQHBhcmFtIGNsYXNzZXNTdG9yZSBpZiBwcm92aWRlZCwgdGhlIHVwZGF0ZWQgY2xhc3MgdmFsdWVzIHdpbGwgYmUgYXBwbGllZFxuICogICAgdG8gdGhpcyBrZXkvdmFsdWUgbWFwIGluc3RlYWQgb2YgYmVpbmcgcmVuZGVyZXJlZCB2aWEgdGhlIHJlbmRlcmVyLlxuICogQHBhcmFtIHN0eWxlc1N0b3JlIGlmIHByb3ZpZGVkLCB0aGUgdXBkYXRlZCBzdHlsZSB2YWx1ZXMgd2lsbCBiZSBhcHBsaWVkXG4gKiAgICB0byB0aGlzIGtleS92YWx1ZSBtYXAgaW5zdGVhZCBvZiBiZWluZyByZW5kZXJlcmVkIHZpYSB0aGUgcmVuZGVyZXIuXG4gKiBAcGFyYW0gZGlyZWN0aXZlUmVmIGFuIG9wdGlvbmFsIGRpcmVjdGl2ZSB0aGF0IHdpbGwgYmUgdXNlZCB0byB0YXJnZXQgd2hpY2hcbiAqICAgIHN0eWxpbmcgdmFsdWVzIGFyZSByZW5kZXJlZC4gSWYgbGVmdCBlbXB0eSwgb25seSB0aGUgYmluZGluZ3MgdGhhdCBhcmVcbiAqICAgIHJlZ2lzdGVyZWQgb24gdGhlIHRlbXBsYXRlIHdpbGwgYmUgcmVuZGVyZWQuXG4gKiBAcmV0dXJucyBudW1iZXIgdGhlIHRvdGFsIGFtb3VudCBvZiBwbGF5ZXJzIHRoYXQgZ290IHF1ZXVlZCBmb3IgYW5pbWF0aW9uIChpZiBhbnkpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZW5kZXJTdHlsaW5nKFxuICAgIGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCByZW5kZXJlcjogUmVuZGVyZXIzLCByb290T3JWaWV3OiBSb290Q29udGV4dCB8IExWaWV3LFxuICAgIGlzRmlyc3RSZW5kZXI6IGJvb2xlYW4sIGNsYXNzZXNTdG9yZT86IEJpbmRpbmdTdG9yZSB8IG51bGwsIHN0eWxlc1N0b3JlPzogQmluZGluZ1N0b3JlIHwgbnVsbCxcbiAgICBkaXJlY3RpdmVSZWY/OiBhbnkpOiBudW1iZXIge1xuICBsZXQgdG90YWxQbGF5ZXJzUXVldWVkID0gMDtcbiAgY29uc3QgdGFyZ2V0RGlyZWN0aXZlSW5kZXggPSBnZXREaXJlY3RpdmVJbmRleEZyb21SZWdpc3RyeShjb250ZXh0LCBkaXJlY3RpdmVSZWYgfHwgbnVsbCk7XG5cbiAgaWYgKGlzQ29udGV4dERpcnR5KGNvbnRleHQpICYmIGlzRGlyZWN0aXZlRGlydHkoY29udGV4dCwgdGFyZ2V0RGlyZWN0aXZlSW5kZXgpKSB7XG4gICAgY29uc3QgZmx1c2hQbGF5ZXJCdWlsZGVyczogYW55ID1cbiAgICAgICAgY29udGV4dFtTdHlsaW5nSW5kZXguTWFzdGVyRmxhZ1Bvc2l0aW9uXSAmIFN0eWxpbmdGbGFncy5QbGF5ZXJCdWlsZGVyc0RpcnR5O1xuICAgIGNvbnN0IG5hdGl2ZSA9IGNvbnRleHRbU3R5bGluZ0luZGV4LkVsZW1lbnRQb3NpdGlvbl0gITtcbiAgICBjb25zdCBtdWx0aVN0YXJ0SW5kZXggPSBnZXRNdWx0aVN0eWxlc1N0YXJ0SW5kZXgoY29udGV4dCk7XG5cbiAgICBsZXQgc3RpbGxEaXJ0eSA9IGZhbHNlO1xuICAgIGZvciAobGV0IGkgPSBTdHlsaW5nSW5kZXguU2luZ2xlU3R5bGVzU3RhcnRQb3NpdGlvbjsgaSA8IGNvbnRleHQubGVuZ3RoO1xuICAgICAgICAgaSArPSBTdHlsaW5nSW5kZXguU2l6ZSkge1xuICAgICAgLy8gdGhlcmUgaXMgbm8gcG9pbnQgaW4gcmVuZGVyaW5nIHN0eWxlcyB0aGF0IGhhdmUgbm90IGNoYW5nZWQgb24gc2NyZWVuXG4gICAgICBpZiAoaXNEaXJ0eShjb250ZXh0LCBpKSkge1xuICAgICAgICBjb25zdCBmbGFnID0gZ2V0UG9pbnRlcnMoY29udGV4dCwgaSk7XG4gICAgICAgIGNvbnN0IGRpcmVjdGl2ZUluZGV4ID0gZ2V0RGlyZWN0aXZlSW5kZXhGcm9tRW50cnkoY29udGV4dCwgaSk7XG4gICAgICAgIGlmICh0YXJnZXREaXJlY3RpdmVJbmRleCAhPT0gZGlyZWN0aXZlSW5kZXgpIHtcbiAgICAgICAgICBzdGlsbERpcnR5ID0gdHJ1ZTtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHByb3AgPSBnZXRQcm9wKGNvbnRleHQsIGkpO1xuICAgICAgICBjb25zdCB2YWx1ZSA9IGdldFZhbHVlKGNvbnRleHQsIGkpO1xuICAgICAgICBjb25zdCBzdHlsZVNhbml0aXplciA9XG4gICAgICAgICAgICAoZmxhZyAmIFN0eWxpbmdGbGFncy5TYW5pdGl6ZSkgPyBnZXRTdHlsZVNhbml0aXplcihjb250ZXh0LCBkaXJlY3RpdmVJbmRleCkgOiBudWxsO1xuICAgICAgICBjb25zdCBwbGF5ZXJCdWlsZGVyID0gZ2V0UGxheWVyQnVpbGRlcihjb250ZXh0LCBpKTtcbiAgICAgICAgY29uc3QgaXNDbGFzc0Jhc2VkID0gZmxhZyAmIFN0eWxpbmdGbGFncy5DbGFzcyA/IHRydWUgOiBmYWxzZTtcbiAgICAgICAgY29uc3QgaXNJblNpbmdsZVJlZ2lvbiA9IGkgPCBtdWx0aVN0YXJ0SW5kZXg7XG5cbiAgICAgICAgbGV0IHZhbHVlVG9BcHBseTogc3RyaW5nfGJvb2xlYW58bnVsbCA9IHZhbHVlO1xuXG4gICAgICAgIC8vIFZBTFVFIERFRkVSIENBU0UgMTogVXNlIGEgbXVsdGkgdmFsdWUgaW5zdGVhZCBvZiBhIG51bGwgc2luZ2xlIHZhbHVlXG4gICAgICAgIC8vIHRoaXMgY2hlY2sgaW1wbGllcyB0aGF0IGEgc2luZ2xlIHZhbHVlIHdhcyByZW1vdmVkIGFuZCB3ZVxuICAgICAgICAvLyBzaG91bGQgbm93IGRlZmVyIHRvIGEgbXVsdGkgdmFsdWUgYW5kIHVzZSB0aGF0IChpZiBzZXQpLlxuICAgICAgICBpZiAoaXNJblNpbmdsZVJlZ2lvbiAmJiAhdmFsdWVFeGlzdHModmFsdWVUb0FwcGx5LCBpc0NsYXNzQmFzZWQpKSB7XG4gICAgICAgICAgLy8gc2luZ2xlIHZhbHVlcyBBTFdBWVMgaGF2ZSBhIHJlZmVyZW5jZSB0byBhIG11bHRpIGluZGV4XG4gICAgICAgICAgY29uc3QgbXVsdGlJbmRleCA9IGdldE11bHRpT3JTaW5nbGVJbmRleChmbGFnKTtcbiAgICAgICAgICB2YWx1ZVRvQXBwbHkgPSBnZXRWYWx1ZShjb250ZXh0LCBtdWx0aUluZGV4KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFZBTFVFIERFRkVSIENBU0UgMjogVXNlIHRoZSBpbml0aWFsIHZhbHVlIGlmIGFsbCBlbHNlIGZhaWxzIChpcyBmYWxzeSlcbiAgICAgICAgLy8gdGhlIGluaXRpYWwgdmFsdWUgd2lsbCBhbHdheXMgYmUgYSBzdHJpbmcgb3IgbnVsbCxcbiAgICAgICAgLy8gdGhlcmVmb3JlIHdlIGNhbiBzYWZlbHkgYWRvcHQgaXQgaW4gY2FzZSB0aGVyZSdzIG5vdGhpbmcgZWxzZVxuICAgICAgICAvLyBub3RlIHRoYXQgdGhpcyBzaG91bGQgYWx3YXlzIGJlIGEgZmFsc3kgY2hlY2sgc2luY2UgYGZhbHNlYCBpcyB1c2VkXG4gICAgICAgIC8vIGZvciBib3RoIGNsYXNzIGFuZCBzdHlsZSBjb21wYXJpc29ucyAoc3R5bGVzIGNhbid0IGJlIGZhbHNlIGFuZCBmYWxzZVxuICAgICAgICAvLyBjbGFzc2VzIGFyZSB0dXJuZWQgb2ZmIGFuZCBzaG91bGQgdGhlcmVmb3JlIGRlZmVyIHRvIHRoZWlyIGluaXRpYWwgdmFsdWVzKVxuICAgICAgICAvLyBOb3RlIHRoYXQgd2UgaWdub3JlIGNsYXNzLWJhc2VkIGRlZmVyYWxzIGJlY2F1c2Ugb3RoZXJ3aXNlIGEgY2xhc3MgY2FuIG5ldmVyXG4gICAgICAgIC8vIGJlIHJlbW92ZWQgaW4gdGhlIGNhc2UgdGhhdCBpdCBleGlzdHMgYXMgdHJ1ZSBpbiB0aGUgaW5pdGlhbCBjbGFzc2VzIGxpc3QuLi5cbiAgICAgICAgaWYgKCF2YWx1ZUV4aXN0cyh2YWx1ZVRvQXBwbHksIGlzQ2xhc3NCYXNlZCkpIHtcbiAgICAgICAgICB2YWx1ZVRvQXBwbHkgPSBnZXRJbml0aWFsVmFsdWUoY29udGV4dCwgZmxhZyk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBpZiB0aGUgZmlyc3QgcmVuZGVyIGlzIHRydWUgdGhlbiB3ZSBkbyBub3Qgd2FudCB0byBzdGFydCBhcHBseWluZyBmYWxzeVxuICAgICAgICAvLyB2YWx1ZXMgdG8gdGhlIERPTSBlbGVtZW50J3Mgc3R5bGluZy4gT3RoZXJ3aXNlIHRoZW4gd2Uga25vdyB0aGVyZSBoYXNcbiAgICAgICAgLy8gYmVlbiBhIGNoYW5nZSBhbmQgZXZlbiBpZiBpdCdzIGZhbHN5IHRoZW4gaXQncyByZW1vdmluZyBzb21ldGhpbmcgdGhhdFxuICAgICAgICAvLyB3YXMgdHJ1dGh5IGJlZm9yZS5cbiAgICAgICAgY29uc3QgZG9BcHBseVZhbHVlID0gaXNGaXJzdFJlbmRlciA/IHZhbHVlVG9BcHBseSA6IHRydWU7XG4gICAgICAgIGlmIChkb0FwcGx5VmFsdWUpIHtcbiAgICAgICAgICBpZiAoaXNDbGFzc0Jhc2VkKSB7XG4gICAgICAgICAgICBzZXRDbGFzcyhcbiAgICAgICAgICAgICAgICBuYXRpdmUsIHByb3AsIHZhbHVlVG9BcHBseSA/IHRydWUgOiBmYWxzZSwgcmVuZGVyZXIsIGNsYXNzZXNTdG9yZSwgcGxheWVyQnVpbGRlcik7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNldFN0eWxlKFxuICAgICAgICAgICAgICAgIG5hdGl2ZSwgcHJvcCwgdmFsdWVUb0FwcGx5IGFzIHN0cmluZyB8IG51bGwsIHJlbmRlcmVyLCBzdHlsZVNhbml0aXplciwgc3R5bGVzU3RvcmUsXG4gICAgICAgICAgICAgICAgcGxheWVyQnVpbGRlcik7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgc2V0RGlydHkoY29udGV4dCwgaSwgZmFsc2UpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChmbHVzaFBsYXllckJ1aWxkZXJzKSB7XG4gICAgICBjb25zdCByb290Q29udGV4dCA9XG4gICAgICAgICAgQXJyYXkuaXNBcnJheShyb290T3JWaWV3KSA/IGdldFJvb3RDb250ZXh0KHJvb3RPclZpZXcpIDogcm9vdE9yVmlldyBhcyBSb290Q29udGV4dDtcbiAgICAgIGNvbnN0IHBsYXllckNvbnRleHQgPSBnZXRQbGF5ZXJDb250ZXh0KGNvbnRleHQpICE7XG4gICAgICBjb25zdCBwbGF5ZXJzU3RhcnRJbmRleCA9IHBsYXllckNvbnRleHRbUGxheWVySW5kZXguTm9uQnVpbGRlclBsYXllcnNTdGFydF07XG4gICAgICBmb3IgKGxldCBpID0gUGxheWVySW5kZXguUGxheWVyQnVpbGRlcnNTdGFydFBvc2l0aW9uOyBpIDwgcGxheWVyc1N0YXJ0SW5kZXg7XG4gICAgICAgICAgIGkgKz0gUGxheWVySW5kZXguUGxheWVyQW5kUGxheWVyQnVpbGRlcnNUdXBsZVNpemUpIHtcbiAgICAgICAgY29uc3QgYnVpbGRlciA9IHBsYXllckNvbnRleHRbaV0gYXMgQ2xhc3NBbmRTdHlsZVBsYXllckJ1aWxkZXI8YW55PnwgbnVsbDtcbiAgICAgICAgY29uc3QgcGxheWVySW5zZXJ0aW9uSW5kZXggPSBpICsgUGxheWVySW5kZXguUGxheWVyT2Zmc2V0UG9zaXRpb247XG4gICAgICAgIGNvbnN0IG9sZFBsYXllciA9IHBsYXllckNvbnRleHRbcGxheWVySW5zZXJ0aW9uSW5kZXhdIGFzIFBsYXllciB8IG51bGw7XG4gICAgICAgIGlmIChidWlsZGVyKSB7XG4gICAgICAgICAgY29uc3QgcGxheWVyID0gYnVpbGRlci5idWlsZFBsYXllcihvbGRQbGF5ZXIsIGlzRmlyc3RSZW5kZXIpO1xuICAgICAgICAgIGlmIChwbGF5ZXIgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgaWYgKHBsYXllciAhPSBudWxsKSB7XG4gICAgICAgICAgICAgIGNvbnN0IHdhc1F1ZXVlZCA9IGFkZFBsYXllckludGVybmFsKFxuICAgICAgICAgICAgICAgICAgcGxheWVyQ29udGV4dCwgcm9vdENvbnRleHQsIG5hdGl2ZSBhcyBIVE1MRWxlbWVudCwgcGxheWVyLCBwbGF5ZXJJbnNlcnRpb25JbmRleCk7XG4gICAgICAgICAgICAgIHdhc1F1ZXVlZCAmJiB0b3RhbFBsYXllcnNRdWV1ZWQrKztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChvbGRQbGF5ZXIpIHtcbiAgICAgICAgICAgICAgb2xkUGxheWVyLmRlc3Ryb3koKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAob2xkUGxheWVyKSB7XG4gICAgICAgICAgLy8gdGhlIHBsYXllciBidWlsZGVyIGhhcyBiZWVuIHJlbW92ZWQgLi4uIHRoZXJlZm9yZSB3ZSBzaG91bGQgZGVsZXRlIHRoZSBhc3NvY2lhdGVkXG4gICAgICAgICAgLy8gcGxheWVyXG4gICAgICAgICAgb2xkUGxheWVyLmRlc3Ryb3koKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgc2V0Q29udGV4dFBsYXllcnNEaXJ0eShjb250ZXh0LCBmYWxzZSk7XG4gICAgfVxuXG4gICAgc2V0RGlyZWN0aXZlRGlydHkoY29udGV4dCwgdGFyZ2V0RGlyZWN0aXZlSW5kZXgsIGZhbHNlKTtcbiAgICBzZXRDb250ZXh0RGlydHkoY29udGV4dCwgc3RpbGxEaXJ0eSk7XG4gIH1cblxuICByZXR1cm4gdG90YWxQbGF5ZXJzUXVldWVkO1xufVxuXG4vKipcbiAqIEFzc2lnbnMgYSBzdHlsZSB2YWx1ZSB0byBhIHN0eWxlIHByb3BlcnR5IGZvciB0aGUgZ2l2ZW4gZWxlbWVudC5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIHJlbmRlcnMgYSBnaXZlbiBDU1MgcHJvcC92YWx1ZSBlbnRyeSB1c2luZyB0aGVcbiAqIHByb3ZpZGVkIHJlbmRlcmVyLiBJZiBhIGBzdG9yZWAgdmFsdWUgaXMgcHJvdmlkZWQgdGhlblxuICogdGhhdCB3aWxsIGJlIHVzZWQgYSByZW5kZXIgY29udGV4dCBpbnN0ZWFkIG9mIHRoZSBwcm92aWRlZFxuICogcmVuZGVyZXIuXG4gKlxuICogQHBhcmFtIG5hdGl2ZSB0aGUgRE9NIEVsZW1lbnRcbiAqIEBwYXJhbSBwcm9wIHRoZSBDU1Mgc3R5bGUgcHJvcGVydHkgdGhhdCB3aWxsIGJlIHJlbmRlcmVkXG4gKiBAcGFyYW0gdmFsdWUgdGhlIENTUyBzdHlsZSB2YWx1ZSB0aGF0IHdpbGwgYmUgcmVuZGVyZWRcbiAqIEBwYXJhbSByZW5kZXJlclxuICogQHBhcmFtIHN0b3JlIGFuIG9wdGlvbmFsIGtleS92YWx1ZSBtYXAgdGhhdCB3aWxsIGJlIHVzZWQgYXMgYSBjb250ZXh0IHRvIHJlbmRlciBzdHlsZXMgb25cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNldFN0eWxlKFxuICAgIG5hdGl2ZTogYW55LCBwcm9wOiBzdHJpbmcsIHZhbHVlOiBzdHJpbmcgfCBudWxsLCByZW5kZXJlcjogUmVuZGVyZXIzLFxuICAgIHNhbml0aXplcjogU3R5bGVTYW5pdGl6ZUZuIHwgbnVsbCwgc3RvcmU/OiBCaW5kaW5nU3RvcmUgfCBudWxsLFxuICAgIHBsYXllckJ1aWxkZXI/OiBDbGFzc0FuZFN0eWxlUGxheWVyQnVpbGRlcjxhbnk+fCBudWxsKSB7XG4gIHZhbHVlID0gc2FuaXRpemVyICYmIHZhbHVlID8gc2FuaXRpemVyKHByb3AsIHZhbHVlKSA6IHZhbHVlO1xuICBpZiAoc3RvcmUgfHwgcGxheWVyQnVpbGRlcikge1xuICAgIGlmIChzdG9yZSkge1xuICAgICAgc3RvcmUuc2V0VmFsdWUocHJvcCwgdmFsdWUpO1xuICAgIH1cbiAgICBpZiAocGxheWVyQnVpbGRlcikge1xuICAgICAgcGxheWVyQnVpbGRlci5zZXRWYWx1ZShwcm9wLCB2YWx1ZSk7XG4gICAgfVxuICB9IGVsc2UgaWYgKHZhbHVlKSB7XG4gICAgdmFsdWUgPSB2YWx1ZS50b1N0cmluZygpOyAgLy8gb3BhY2l0eSwgei1pbmRleCBhbmQgZmxleGJveCBhbGwgaGF2ZSBudW1iZXIgdmFsdWVzIHdoaWNoIG1heSBub3RcbiAgICAvLyBhc3NpZ24gYXMgbnVtYmVyc1xuICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJTZXRTdHlsZSsrO1xuICAgIGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSA/XG4gICAgICAgIHJlbmRlcmVyLnNldFN0eWxlKG5hdGl2ZSwgcHJvcCwgdmFsdWUsIFJlbmRlcmVyU3R5bGVGbGFnczMuRGFzaENhc2UpIDpcbiAgICAgICAgbmF0aXZlLnN0eWxlLnNldFByb3BlcnR5KHByb3AsIHZhbHVlKTtcbiAgfSBlbHNlIHtcbiAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyUmVtb3ZlU3R5bGUrKztcbiAgICBpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikgP1xuICAgICAgICByZW5kZXJlci5yZW1vdmVTdHlsZShuYXRpdmUsIHByb3AsIFJlbmRlcmVyU3R5bGVGbGFnczMuRGFzaENhc2UpIDpcbiAgICAgICAgbmF0aXZlLnN0eWxlLnJlbW92ZVByb3BlcnR5KHByb3ApO1xuICB9XG59XG5cbi8qKlxuICogQWRkcy9yZW1vdmVzIHRoZSBwcm92aWRlZCBjbGFzc05hbWUgdmFsdWUgdG8gdGhlIHByb3ZpZGVkIGVsZW1lbnQuXG4gKlxuICogVGhpcyBmdW5jdGlvbiByZW5kZXJzIGEgZ2l2ZW4gQ1NTIGNsYXNzIHZhbHVlIHVzaW5nIHRoZSBwcm92aWRlZFxuICogcmVuZGVyZXIgKGJ5IGFkZGluZyBvciByZW1vdmluZyBpdCBmcm9tIHRoZSBwcm92aWRlZCBlbGVtZW50KS5cbiAqIElmIGEgYHN0b3JlYCB2YWx1ZSBpcyBwcm92aWRlZCB0aGVuIHRoYXQgd2lsbCBiZSB1c2VkIGEgcmVuZGVyXG4gKiBjb250ZXh0IGluc3RlYWQgb2YgdGhlIHByb3ZpZGVkIHJlbmRlcmVyLlxuICpcbiAqIEBwYXJhbSBuYXRpdmUgdGhlIERPTSBFbGVtZW50XG4gKiBAcGFyYW0gcHJvcCB0aGUgQ1NTIHN0eWxlIHByb3BlcnR5IHRoYXQgd2lsbCBiZSByZW5kZXJlZFxuICogQHBhcmFtIHZhbHVlIHRoZSBDU1Mgc3R5bGUgdmFsdWUgdGhhdCB3aWxsIGJlIHJlbmRlcmVkXG4gKiBAcGFyYW0gcmVuZGVyZXJcbiAqIEBwYXJhbSBzdG9yZSBhbiBvcHRpb25hbCBrZXkvdmFsdWUgbWFwIHRoYXQgd2lsbCBiZSB1c2VkIGFzIGEgY29udGV4dCB0byByZW5kZXIgc3R5bGVzIG9uXG4gKi9cbmZ1bmN0aW9uIHNldENsYXNzKFxuICAgIG5hdGl2ZTogYW55LCBjbGFzc05hbWU6IHN0cmluZywgYWRkOiBib29sZWFuLCByZW5kZXJlcjogUmVuZGVyZXIzLCBzdG9yZT86IEJpbmRpbmdTdG9yZSB8IG51bGwsXG4gICAgcGxheWVyQnVpbGRlcj86IENsYXNzQW5kU3R5bGVQbGF5ZXJCdWlsZGVyPGFueT58IG51bGwpIHtcbiAgaWYgKHN0b3JlIHx8IHBsYXllckJ1aWxkZXIpIHtcbiAgICBpZiAoc3RvcmUpIHtcbiAgICAgIHN0b3JlLnNldFZhbHVlKGNsYXNzTmFtZSwgYWRkKTtcbiAgICB9XG4gICAgaWYgKHBsYXllckJ1aWxkZXIpIHtcbiAgICAgIHBsYXllckJ1aWxkZXIuc2V0VmFsdWUoY2xhc3NOYW1lLCBhZGQpO1xuICAgIH1cbiAgICAvLyBET01Ub2tlbkxpc3Qgd2lsbCB0aHJvdyBpZiB3ZSB0cnkgdG8gYWRkIG9yIHJlbW92ZSBhbiBlbXB0eSBzdHJpbmcuXG4gIH0gZWxzZSBpZiAoY2xhc3NOYW1lICE9PSAnJykge1xuICAgIGlmIChhZGQpIHtcbiAgICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJBZGRDbGFzcysrO1xuICAgICAgaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpID8gcmVuZGVyZXIuYWRkQ2xhc3MobmF0aXZlLCBjbGFzc05hbWUpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hdGl2ZVsnY2xhc3NMaXN0J10uYWRkKGNsYXNzTmFtZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJSZW1vdmVDbGFzcysrO1xuICAgICAgaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpID8gcmVuZGVyZXIucmVtb3ZlQ2xhc3MobmF0aXZlLCBjbGFzc05hbWUpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hdGl2ZVsnY2xhc3NMaXN0J10ucmVtb3ZlKGNsYXNzTmFtZSk7XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIHNldFNhbml0aXplRmxhZyhjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgaW5kZXg6IG51bWJlciwgc2FuaXRpemVZZXM6IGJvb2xlYW4pIHtcbiAgaWYgKHNhbml0aXplWWVzKSB7XG4gICAgKGNvbnRleHRbaW5kZXhdIGFzIG51bWJlcikgfD0gU3R5bGluZ0ZsYWdzLlNhbml0aXplO1xuICB9IGVsc2Uge1xuICAgIChjb250ZXh0W2luZGV4XSBhcyBudW1iZXIpICY9IH5TdHlsaW5nRmxhZ3MuU2FuaXRpemU7XG4gIH1cbn1cblxuZnVuY3Rpb24gc2V0RGlydHkoY29udGV4dDogU3R5bGluZ0NvbnRleHQsIGluZGV4OiBudW1iZXIsIGlzRGlydHlZZXM6IGJvb2xlYW4pIHtcbiAgY29uc3QgYWRqdXN0ZWRJbmRleCA9XG4gICAgICBpbmRleCA+PSBTdHlsaW5nSW5kZXguU2luZ2xlU3R5bGVzU3RhcnRQb3NpdGlvbiA/IChpbmRleCArIFN0eWxpbmdJbmRleC5GbGFnc09mZnNldCkgOiBpbmRleDtcbiAgaWYgKGlzRGlydHlZZXMpIHtcbiAgICAoY29udGV4dFthZGp1c3RlZEluZGV4XSBhcyBudW1iZXIpIHw9IFN0eWxpbmdGbGFncy5EaXJ0eTtcbiAgfSBlbHNlIHtcbiAgICAoY29udGV4dFthZGp1c3RlZEluZGV4XSBhcyBudW1iZXIpICY9IH5TdHlsaW5nRmxhZ3MuRGlydHk7XG4gIH1cbn1cblxuZnVuY3Rpb24gaXNEaXJ0eShjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgaW5kZXg6IG51bWJlcik6IGJvb2xlYW4ge1xuICBjb25zdCBhZGp1c3RlZEluZGV4ID1cbiAgICAgIGluZGV4ID49IFN0eWxpbmdJbmRleC5TaW5nbGVTdHlsZXNTdGFydFBvc2l0aW9uID8gKGluZGV4ICsgU3R5bGluZ0luZGV4LkZsYWdzT2Zmc2V0KSA6IGluZGV4O1xuICByZXR1cm4gKChjb250ZXh0W2FkanVzdGVkSW5kZXhdIGFzIG51bWJlcikgJiBTdHlsaW5nRmxhZ3MuRGlydHkpID09IFN0eWxpbmdGbGFncy5EaXJ0eTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzQ2xhc3NCYXNlZFZhbHVlKGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBpbmRleDogbnVtYmVyKTogYm9vbGVhbiB7XG4gIGNvbnN0IGFkanVzdGVkSW5kZXggPVxuICAgICAgaW5kZXggPj0gU3R5bGluZ0luZGV4LlNpbmdsZVN0eWxlc1N0YXJ0UG9zaXRpb24gPyAoaW5kZXggKyBTdHlsaW5nSW5kZXguRmxhZ3NPZmZzZXQpIDogaW5kZXg7XG4gIHJldHVybiAoKGNvbnRleHRbYWRqdXN0ZWRJbmRleF0gYXMgbnVtYmVyKSAmIFN0eWxpbmdGbGFncy5DbGFzcykgPT0gU3R5bGluZ0ZsYWdzLkNsYXNzO1xufVxuXG5mdW5jdGlvbiBpc1Nhbml0aXphYmxlKGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBpbmRleDogbnVtYmVyKTogYm9vbGVhbiB7XG4gIGNvbnN0IGFkanVzdGVkSW5kZXggPVxuICAgICAgaW5kZXggPj0gU3R5bGluZ0luZGV4LlNpbmdsZVN0eWxlc1N0YXJ0UG9zaXRpb24gPyAoaW5kZXggKyBTdHlsaW5nSW5kZXguRmxhZ3NPZmZzZXQpIDogaW5kZXg7XG4gIHJldHVybiAoKGNvbnRleHRbYWRqdXN0ZWRJbmRleF0gYXMgbnVtYmVyKSAmIFN0eWxpbmdGbGFncy5TYW5pdGl6ZSkgPT0gU3R5bGluZ0ZsYWdzLlNhbml0aXplO1xufVxuXG5mdW5jdGlvbiBwb2ludGVycyhjb25maWdGbGFnOiBudW1iZXIsIHN0YXRpY0luZGV4OiBudW1iZXIsIGR5bmFtaWNJbmRleDogbnVtYmVyKSB7XG4gIHJldHVybiAoY29uZmlnRmxhZyAmIFN0eWxpbmdGbGFncy5CaXRNYXNrKSB8IChzdGF0aWNJbmRleCA8PCBTdHlsaW5nRmxhZ3MuQml0Q291bnRTaXplKSB8XG4gICAgICAoZHluYW1pY0luZGV4IDw8IChTdHlsaW5nSW5kZXguQml0Q291bnRTaXplICsgU3R5bGluZ0ZsYWdzLkJpdENvdW50U2l6ZSkpO1xufVxuXG5mdW5jdGlvbiBnZXRJbml0aWFsVmFsdWUoY29udGV4dDogU3R5bGluZ0NvbnRleHQsIGZsYWc6IG51bWJlcik6IHN0cmluZ3xib29sZWFufG51bGwge1xuICBjb25zdCBpbmRleCA9IGdldEluaXRpYWxJbmRleChmbGFnKTtcbiAgY29uc3QgZW50cnlJc0NsYXNzQmFzZWQgPSBmbGFnICYgU3R5bGluZ0ZsYWdzLkNsYXNzO1xuICBjb25zdCBpbml0aWFsVmFsdWVzID0gZW50cnlJc0NsYXNzQmFzZWQgPyBjb250ZXh0W1N0eWxpbmdJbmRleC5Jbml0aWFsQ2xhc3NWYWx1ZXNQb3NpdGlvbl0gOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250ZXh0W1N0eWxpbmdJbmRleC5Jbml0aWFsU3R5bGVWYWx1ZXNQb3NpdGlvbl07XG4gIHJldHVybiBpbml0aWFsVmFsdWVzW2luZGV4XSBhcyBzdHJpbmcgfCBib29sZWFuIHwgbnVsbDtcbn1cblxuZnVuY3Rpb24gZ2V0SW5pdGlhbEluZGV4KGZsYWc6IG51bWJlcik6IG51bWJlciB7XG4gIHJldHVybiAoZmxhZyA+PiBTdHlsaW5nRmxhZ3MuQml0Q291bnRTaXplKSAmIFN0eWxpbmdJbmRleC5CaXRNYXNrO1xufVxuXG5mdW5jdGlvbiBnZXRNdWx0aU9yU2luZ2xlSW5kZXgoZmxhZzogbnVtYmVyKTogbnVtYmVyIHtcbiAgY29uc3QgaW5kZXggPVxuICAgICAgKGZsYWcgPj4gKFN0eWxpbmdJbmRleC5CaXRDb3VudFNpemUgKyBTdHlsaW5nRmxhZ3MuQml0Q291bnRTaXplKSkgJiBTdHlsaW5nSW5kZXguQml0TWFzaztcbiAgcmV0dXJuIGluZGV4ID49IFN0eWxpbmdJbmRleC5TaW5nbGVTdHlsZXNTdGFydFBvc2l0aW9uID8gaW5kZXggOiAtMTtcbn1cblxuZnVuY3Rpb24gZ2V0TXVsdGlTdGFydEluZGV4KGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0KTogbnVtYmVyIHtcbiAgcmV0dXJuIGdldE11bHRpT3JTaW5nbGVJbmRleChjb250ZXh0W1N0eWxpbmdJbmRleC5NYXN0ZXJGbGFnUG9zaXRpb25dKSBhcyBudW1iZXI7XG59XG5cbmZ1bmN0aW9uIGdldE11bHRpQ2xhc3Nlc1N0YXJ0SW5kZXgoY29udGV4dDogU3R5bGluZ0NvbnRleHQpOiBudW1iZXIge1xuICBjb25zdCBjbGFzc0NhY2hlID0gY29udGV4dFtTdHlsaW5nSW5kZXguQ2FjaGVkTXVsdGlDbGFzc2VzXTtcbiAgcmV0dXJuIGNsYXNzQ2FjaGVcbiAgICAgIFtNYXBCYXNlZE9mZnNldFZhbHVlc0luZGV4LlZhbHVlc1N0YXJ0UG9zaXRpb24gK1xuICAgICAgIE1hcEJhc2VkT2Zmc2V0VmFsdWVzSW5kZXguUG9zaXRpb25TdGFydE9mZnNldF07XG59XG5cbmZ1bmN0aW9uIGdldE11bHRpU3R5bGVzU3RhcnRJbmRleChjb250ZXh0OiBTdHlsaW5nQ29udGV4dCk6IG51bWJlciB7XG4gIGNvbnN0IHN0eWxlc0NhY2hlID0gY29udGV4dFtTdHlsaW5nSW5kZXguQ2FjaGVkTXVsdGlTdHlsZXNdO1xuICByZXR1cm4gc3R5bGVzQ2FjaGVcbiAgICAgIFtNYXBCYXNlZE9mZnNldFZhbHVlc0luZGV4LlZhbHVlc1N0YXJ0UG9zaXRpb24gK1xuICAgICAgIE1hcEJhc2VkT2Zmc2V0VmFsdWVzSW5kZXguUG9zaXRpb25TdGFydE9mZnNldF07XG59XG5cbmZ1bmN0aW9uIHNldFByb3AoY29udGV4dDogU3R5bGluZ0NvbnRleHQsIGluZGV4OiBudW1iZXIsIHByb3A6IHN0cmluZykge1xuICBjb250ZXh0W2luZGV4ICsgU3R5bGluZ0luZGV4LlByb3BlcnR5T2Zmc2V0XSA9IHByb3A7XG59XG5cbmZ1bmN0aW9uIHNldFZhbHVlKGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBpbmRleDogbnVtYmVyLCB2YWx1ZTogc3RyaW5nIHwgbnVsbCB8IGJvb2xlYW4pIHtcbiAgY29udGV4dFtpbmRleCArIFN0eWxpbmdJbmRleC5WYWx1ZU9mZnNldF0gPSB2YWx1ZTtcbn1cblxuZnVuY3Rpb24gaGFzUGxheWVyQnVpbGRlckNoYW5nZWQoXG4gICAgY29udGV4dDogU3R5bGluZ0NvbnRleHQsIGJ1aWxkZXI6IENsYXNzQW5kU3R5bGVQbGF5ZXJCdWlsZGVyPGFueT58IG51bGwsIGluZGV4OiBudW1iZXIpIHtcbiAgY29uc3QgcGxheWVyQ29udGV4dCA9IGNvbnRleHRbU3R5bGluZ0luZGV4LlBsYXllckNvbnRleHRdICE7XG4gIGlmIChidWlsZGVyKSB7XG4gICAgaWYgKCFwbGF5ZXJDb250ZXh0IHx8IGluZGV4ID09PSAwKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH0gZWxzZSBpZiAoIXBsYXllckNvbnRleHQpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgcmV0dXJuIHBsYXllckNvbnRleHRbaW5kZXhdICE9PSBidWlsZGVyO1xufVxuXG5mdW5jdGlvbiBzZXRQbGF5ZXJCdWlsZGVyKFxuICAgIGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBidWlsZGVyOiBDbGFzc0FuZFN0eWxlUGxheWVyQnVpbGRlcjxhbnk+fCBudWxsLFxuICAgIGluc2VydGlvbkluZGV4OiBudW1iZXIpOiBudW1iZXIge1xuICBsZXQgcGxheWVyQ29udGV4dCA9IGNvbnRleHRbU3R5bGluZ0luZGV4LlBsYXllckNvbnRleHRdIHx8IGFsbG9jUGxheWVyQ29udGV4dChjb250ZXh0KTtcbiAgaWYgKGluc2VydGlvbkluZGV4ID4gMCkge1xuICAgIHBsYXllckNvbnRleHRbaW5zZXJ0aW9uSW5kZXhdID0gYnVpbGRlcjtcbiAgfSBlbHNlIHtcbiAgICBpbnNlcnRpb25JbmRleCA9IHBsYXllckNvbnRleHRbUGxheWVySW5kZXguTm9uQnVpbGRlclBsYXllcnNTdGFydF07XG4gICAgcGxheWVyQ29udGV4dC5zcGxpY2UoaW5zZXJ0aW9uSW5kZXgsIDAsIGJ1aWxkZXIsIG51bGwpO1xuICAgIHBsYXllckNvbnRleHRbUGxheWVySW5kZXguTm9uQnVpbGRlclBsYXllcnNTdGFydF0gKz1cbiAgICAgICAgUGxheWVySW5kZXguUGxheWVyQW5kUGxheWVyQnVpbGRlcnNUdXBsZVNpemU7XG4gIH1cbiAgcmV0dXJuIGluc2VydGlvbkluZGV4O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZGlyZWN0aXZlT3duZXJQb2ludGVycyhkaXJlY3RpdmVJbmRleDogbnVtYmVyLCBwbGF5ZXJJbmRleDogbnVtYmVyKSB7XG4gIHJldHVybiAocGxheWVySW5kZXggPDwgRGlyZWN0aXZlT3duZXJBbmRQbGF5ZXJCdWlsZGVySW5kZXguQml0Q291bnRTaXplKSB8IGRpcmVjdGl2ZUluZGV4O1xufVxuXG5mdW5jdGlvbiBzZXRQbGF5ZXJCdWlsZGVySW5kZXgoXG4gICAgY29udGV4dDogU3R5bGluZ0NvbnRleHQsIGluZGV4OiBudW1iZXIsIHBsYXllckJ1aWxkZXJJbmRleDogbnVtYmVyLCBkaXJlY3RpdmVJbmRleDogbnVtYmVyKSB7XG4gIGNvbnN0IHZhbHVlID0gZGlyZWN0aXZlT3duZXJQb2ludGVycyhkaXJlY3RpdmVJbmRleCwgcGxheWVyQnVpbGRlckluZGV4KTtcbiAgY29udGV4dFtpbmRleCArIFN0eWxpbmdJbmRleC5QbGF5ZXJCdWlsZGVySW5kZXhPZmZzZXRdID0gdmFsdWU7XG59XG5cbmZ1bmN0aW9uIGdldFBsYXllckJ1aWxkZXJJbmRleChjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgaW5kZXg6IG51bWJlcik6IG51bWJlciB7XG4gIGNvbnN0IGZsYWcgPSBjb250ZXh0W2luZGV4ICsgU3R5bGluZ0luZGV4LlBsYXllckJ1aWxkZXJJbmRleE9mZnNldF0gYXMgbnVtYmVyO1xuICBjb25zdCBwbGF5ZXJCdWlsZGVySW5kZXggPSAoZmxhZyA+PiBEaXJlY3RpdmVPd25lckFuZFBsYXllckJ1aWxkZXJJbmRleC5CaXRDb3VudFNpemUpICZcbiAgICAgIERpcmVjdGl2ZU93bmVyQW5kUGxheWVyQnVpbGRlckluZGV4LkJpdE1hc2s7XG4gIHJldHVybiBwbGF5ZXJCdWlsZGVySW5kZXg7XG59XG5cbmZ1bmN0aW9uIGdldFBsYXllckJ1aWxkZXIoY29udGV4dDogU3R5bGluZ0NvbnRleHQsIGluZGV4OiBudW1iZXIpOiBDbGFzc0FuZFN0eWxlUGxheWVyQnVpbGRlcjxhbnk+fFxuICAgIG51bGwge1xuICBjb25zdCBwbGF5ZXJCdWlsZGVySW5kZXggPSBnZXRQbGF5ZXJCdWlsZGVySW5kZXgoY29udGV4dCwgaW5kZXgpO1xuICBpZiAocGxheWVyQnVpbGRlckluZGV4KSB7XG4gICAgY29uc3QgcGxheWVyQ29udGV4dCA9IGNvbnRleHRbU3R5bGluZ0luZGV4LlBsYXllckNvbnRleHRdO1xuICAgIGlmIChwbGF5ZXJDb250ZXh0KSB7XG4gICAgICByZXR1cm4gcGxheWVyQ29udGV4dFtwbGF5ZXJCdWlsZGVySW5kZXhdIGFzIENsYXNzQW5kU3R5bGVQbGF5ZXJCdWlsZGVyPGFueT58IG51bGw7XG4gICAgfVxuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG5mdW5jdGlvbiBzZXRGbGFnKGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBpbmRleDogbnVtYmVyLCBmbGFnOiBudW1iZXIpIHtcbiAgY29uc3QgYWRqdXN0ZWRJbmRleCA9XG4gICAgICBpbmRleCA9PT0gU3R5bGluZ0luZGV4Lk1hc3RlckZsYWdQb3NpdGlvbiA/IGluZGV4IDogKGluZGV4ICsgU3R5bGluZ0luZGV4LkZsYWdzT2Zmc2V0KTtcbiAgY29udGV4dFthZGp1c3RlZEluZGV4XSA9IGZsYWc7XG59XG5cbmZ1bmN0aW9uIGdldFBvaW50ZXJzKGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBpbmRleDogbnVtYmVyKTogbnVtYmVyIHtcbiAgY29uc3QgYWRqdXN0ZWRJbmRleCA9XG4gICAgICBpbmRleCA9PT0gU3R5bGluZ0luZGV4Lk1hc3RlckZsYWdQb3NpdGlvbiA/IGluZGV4IDogKGluZGV4ICsgU3R5bGluZ0luZGV4LkZsYWdzT2Zmc2V0KTtcbiAgcmV0dXJuIGNvbnRleHRbYWRqdXN0ZWRJbmRleF0gYXMgbnVtYmVyO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0VmFsdWUoY29udGV4dDogU3R5bGluZ0NvbnRleHQsIGluZGV4OiBudW1iZXIpOiBzdHJpbmd8Ym9vbGVhbnxudWxsIHtcbiAgcmV0dXJuIGNvbnRleHRbaW5kZXggKyBTdHlsaW5nSW5kZXguVmFsdWVPZmZzZXRdIGFzIHN0cmluZyB8IGJvb2xlYW4gfCBudWxsO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0UHJvcChjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgaW5kZXg6IG51bWJlcik6IHN0cmluZyB7XG4gIHJldHVybiBjb250ZXh0W2luZGV4ICsgU3R5bGluZ0luZGV4LlByb3BlcnR5T2Zmc2V0XSBhcyBzdHJpbmc7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0NvbnRleHREaXJ0eShjb250ZXh0OiBTdHlsaW5nQ29udGV4dCk6IGJvb2xlYW4ge1xuICByZXR1cm4gaXNEaXJ0eShjb250ZXh0LCBTdHlsaW5nSW5kZXguTWFzdGVyRmxhZ1Bvc2l0aW9uKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNldENvbnRleHREaXJ0eShjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgaXNEaXJ0eVllczogYm9vbGVhbik6IHZvaWQge1xuICBzZXREaXJ0eShjb250ZXh0LCBTdHlsaW5nSW5kZXguTWFzdGVyRmxhZ1Bvc2l0aW9uLCBpc0RpcnR5WWVzKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNldENvbnRleHRQbGF5ZXJzRGlydHkoY29udGV4dDogU3R5bGluZ0NvbnRleHQsIGlzRGlydHlZZXM6IGJvb2xlYW4pOiB2b2lkIHtcbiAgaWYgKGlzRGlydHlZZXMpIHtcbiAgICAoY29udGV4dFtTdHlsaW5nSW5kZXguTWFzdGVyRmxhZ1Bvc2l0aW9uXSBhcyBudW1iZXIpIHw9IFN0eWxpbmdGbGFncy5QbGF5ZXJCdWlsZGVyc0RpcnR5O1xuICB9IGVsc2Uge1xuICAgIChjb250ZXh0W1N0eWxpbmdJbmRleC5NYXN0ZXJGbGFnUG9zaXRpb25dIGFzIG51bWJlcikgJj0gflN0eWxpbmdGbGFncy5QbGF5ZXJCdWlsZGVyc0RpcnR5O1xuICB9XG59XG5cbmZ1bmN0aW9uIHN3YXBNdWx0aUNvbnRleHRFbnRyaWVzKGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBpbmRleEE6IG51bWJlciwgaW5kZXhCOiBudW1iZXIpIHtcbiAgaWYgKGluZGV4QSA9PT0gaW5kZXhCKSByZXR1cm47XG5cbiAgY29uc3QgdG1wVmFsdWUgPSBnZXRWYWx1ZShjb250ZXh0LCBpbmRleEEpO1xuICBjb25zdCB0bXBQcm9wID0gZ2V0UHJvcChjb250ZXh0LCBpbmRleEEpO1xuICBjb25zdCB0bXBGbGFnID0gZ2V0UG9pbnRlcnMoY29udGV4dCwgaW5kZXhBKTtcbiAgY29uc3QgdG1wUGxheWVyQnVpbGRlckluZGV4ID0gZ2V0UGxheWVyQnVpbGRlckluZGV4KGNvbnRleHQsIGluZGV4QSk7XG4gIGNvbnN0IHRtcERpcmVjdGl2ZUluZGV4ID0gZ2V0RGlyZWN0aXZlSW5kZXhGcm9tRW50cnkoY29udGV4dCwgaW5kZXhBKTtcblxuICBsZXQgZmxhZ0EgPSB0bXBGbGFnO1xuICBsZXQgZmxhZ0IgPSBnZXRQb2ludGVycyhjb250ZXh0LCBpbmRleEIpO1xuXG4gIGNvbnN0IHNpbmdsZUluZGV4QSA9IGdldE11bHRpT3JTaW5nbGVJbmRleChmbGFnQSk7XG4gIGlmIChzaW5nbGVJbmRleEEgPj0gMCkge1xuICAgIGNvbnN0IF9mbGFnID0gZ2V0UG9pbnRlcnMoY29udGV4dCwgc2luZ2xlSW5kZXhBKTtcbiAgICBjb25zdCBfaW5pdGlhbCA9IGdldEluaXRpYWxJbmRleChfZmxhZyk7XG4gICAgc2V0RmxhZyhjb250ZXh0LCBzaW5nbGVJbmRleEEsIHBvaW50ZXJzKF9mbGFnLCBfaW5pdGlhbCwgaW5kZXhCKSk7XG4gIH1cblxuICBjb25zdCBzaW5nbGVJbmRleEIgPSBnZXRNdWx0aU9yU2luZ2xlSW5kZXgoZmxhZ0IpO1xuICBpZiAoc2luZ2xlSW5kZXhCID49IDApIHtcbiAgICBjb25zdCBfZmxhZyA9IGdldFBvaW50ZXJzKGNvbnRleHQsIHNpbmdsZUluZGV4Qik7XG4gICAgY29uc3QgX2luaXRpYWwgPSBnZXRJbml0aWFsSW5kZXgoX2ZsYWcpO1xuICAgIHNldEZsYWcoY29udGV4dCwgc2luZ2xlSW5kZXhCLCBwb2ludGVycyhfZmxhZywgX2luaXRpYWwsIGluZGV4QSkpO1xuICB9XG5cbiAgc2V0VmFsdWUoY29udGV4dCwgaW5kZXhBLCBnZXRWYWx1ZShjb250ZXh0LCBpbmRleEIpKTtcbiAgc2V0UHJvcChjb250ZXh0LCBpbmRleEEsIGdldFByb3AoY29udGV4dCwgaW5kZXhCKSk7XG4gIHNldEZsYWcoY29udGV4dCwgaW5kZXhBLCBnZXRQb2ludGVycyhjb250ZXh0LCBpbmRleEIpKTtcbiAgY29uc3QgcGxheWVySW5kZXhBID0gZ2V0UGxheWVyQnVpbGRlckluZGV4KGNvbnRleHQsIGluZGV4Qik7XG4gIGNvbnN0IGRpcmVjdGl2ZUluZGV4QSA9IGdldERpcmVjdGl2ZUluZGV4RnJvbUVudHJ5KGNvbnRleHQsIGluZGV4Qik7XG4gIHNldFBsYXllckJ1aWxkZXJJbmRleChjb250ZXh0LCBpbmRleEEsIHBsYXllckluZGV4QSwgZGlyZWN0aXZlSW5kZXhBKTtcblxuICBzZXRWYWx1ZShjb250ZXh0LCBpbmRleEIsIHRtcFZhbHVlKTtcbiAgc2V0UHJvcChjb250ZXh0LCBpbmRleEIsIHRtcFByb3ApO1xuICBzZXRGbGFnKGNvbnRleHQsIGluZGV4QiwgdG1wRmxhZyk7XG4gIHNldFBsYXllckJ1aWxkZXJJbmRleChjb250ZXh0LCBpbmRleEIsIHRtcFBsYXllckJ1aWxkZXJJbmRleCwgdG1wRGlyZWN0aXZlSW5kZXgpO1xufVxuXG5mdW5jdGlvbiB1cGRhdGVTaW5nbGVQb2ludGVyVmFsdWVzKGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBpbmRleFN0YXJ0UG9zaXRpb246IG51bWJlcikge1xuICBmb3IgKGxldCBpID0gaW5kZXhTdGFydFBvc2l0aW9uOyBpIDwgY29udGV4dC5sZW5ndGg7IGkgKz0gU3R5bGluZ0luZGV4LlNpemUpIHtcbiAgICBjb25zdCBtdWx0aUZsYWcgPSBnZXRQb2ludGVycyhjb250ZXh0LCBpKTtcbiAgICBjb25zdCBzaW5nbGVJbmRleCA9IGdldE11bHRpT3JTaW5nbGVJbmRleChtdWx0aUZsYWcpO1xuICAgIGlmIChzaW5nbGVJbmRleCA+IDApIHtcbiAgICAgIGNvbnN0IHNpbmdsZUZsYWcgPSBnZXRQb2ludGVycyhjb250ZXh0LCBzaW5nbGVJbmRleCk7XG4gICAgICBjb25zdCBpbml0aWFsSW5kZXhGb3JTaW5nbGUgPSBnZXRJbml0aWFsSW5kZXgoc2luZ2xlRmxhZyk7XG4gICAgICBjb25zdCBmbGFnVmFsdWUgPSAoaXNEaXJ0eShjb250ZXh0LCBzaW5nbGVJbmRleCkgPyBTdHlsaW5nRmxhZ3MuRGlydHkgOiBTdHlsaW5nRmxhZ3MuTm9uZSkgfFxuICAgICAgICAgIChpc0NsYXNzQmFzZWRWYWx1ZShjb250ZXh0LCBzaW5nbGVJbmRleCkgPyBTdHlsaW5nRmxhZ3MuQ2xhc3MgOiBTdHlsaW5nRmxhZ3MuTm9uZSkgfFxuICAgICAgICAgIChpc1Nhbml0aXphYmxlKGNvbnRleHQsIHNpbmdsZUluZGV4KSA/IFN0eWxpbmdGbGFncy5TYW5pdGl6ZSA6IFN0eWxpbmdGbGFncy5Ob25lKTtcbiAgICAgIGNvbnN0IHVwZGF0ZWRGbGFnID0gcG9pbnRlcnMoZmxhZ1ZhbHVlLCBpbml0aWFsSW5kZXhGb3JTaW5nbGUsIGkpO1xuICAgICAgc2V0RmxhZyhjb250ZXh0LCBzaW5nbGVJbmRleCwgdXBkYXRlZEZsYWcpO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBpbnNlcnROZXdNdWx0aVByb3BlcnR5KFxuICAgIGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBpbmRleDogbnVtYmVyLCBjbGFzc0Jhc2VkOiBib29sZWFuLCBuYW1lOiBzdHJpbmcsIGZsYWc6IG51bWJlcixcbiAgICB2YWx1ZTogc3RyaW5nIHwgYm9vbGVhbiwgZGlyZWN0aXZlSW5kZXg6IG51bWJlciwgcGxheWVySW5kZXg6IG51bWJlcik6IHZvaWQge1xuICBjb25zdCBkb1NoaWZ0ID0gaW5kZXggPCBjb250ZXh0Lmxlbmd0aDtcblxuICAvLyBwcm9wIGRvZXMgbm90IGV4aXN0IGluIHRoZSBsaXN0LCBhZGQgaXQgaW5cbiAgY29udGV4dC5zcGxpY2UoXG4gICAgICBpbmRleCwgMCwgZmxhZyB8IFN0eWxpbmdGbGFncy5EaXJ0eSB8IChjbGFzc0Jhc2VkID8gU3R5bGluZ0ZsYWdzLkNsYXNzIDogU3R5bGluZ0ZsYWdzLk5vbmUpLFxuICAgICAgbmFtZSwgdmFsdWUsIDApO1xuICBzZXRQbGF5ZXJCdWlsZGVySW5kZXgoY29udGV4dCwgaW5kZXgsIHBsYXllckluZGV4LCBkaXJlY3RpdmVJbmRleCk7XG5cbiAgaWYgKGRvU2hpZnQpIHtcbiAgICAvLyBiZWNhdXNlIHRoZSB2YWx1ZSB3YXMgaW5zZXJ0ZWQgbWlkd2F5IGludG8gdGhlIGFycmF5IHRoZW4gd2VcbiAgICAvLyBuZWVkIHRvIHVwZGF0ZSBhbGwgdGhlIHNoaWZ0ZWQgbXVsdGkgdmFsdWVzJyBzaW5nbGUgdmFsdWVcbiAgICAvLyBwb2ludGVycyB0byBwb2ludCB0byB0aGUgbmV3bHkgc2hpZnRlZCBsb2NhdGlvblxuICAgIHVwZGF0ZVNpbmdsZVBvaW50ZXJWYWx1ZXMoY29udGV4dCwgaW5kZXggKyBTdHlsaW5nSW5kZXguU2l6ZSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gdmFsdWVFeGlzdHModmFsdWU6IHN0cmluZyB8IG51bGwgfCBib29sZWFuLCBpc0NsYXNzQmFzZWQ/OiBib29sZWFuKSB7XG4gIHJldHVybiB2YWx1ZSAhPT0gbnVsbDtcbn1cblxuZnVuY3Rpb24gcHJlcGFyZUluaXRpYWxGbGFnKFxuICAgIGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBwcm9wOiBzdHJpbmcsIGVudHJ5SXNDbGFzc0Jhc2VkOiBib29sZWFuLFxuICAgIHNhbml0aXplcj86IFN0eWxlU2FuaXRpemVGbiB8IG51bGwpIHtcbiAgbGV0IGZsYWcgPSAoc2FuaXRpemVyICYmIHNhbml0aXplcihwcm9wKSkgPyBTdHlsaW5nRmxhZ3MuU2FuaXRpemUgOiBTdHlsaW5nRmxhZ3MuTm9uZTtcblxuICBsZXQgaW5pdGlhbEluZGV4OiBudW1iZXI7XG4gIGlmIChlbnRyeUlzQ2xhc3NCYXNlZCkge1xuICAgIGZsYWcgfD0gU3R5bGluZ0ZsYWdzLkNsYXNzO1xuICAgIGluaXRpYWxJbmRleCA9XG4gICAgICAgIGdldEluaXRpYWxTdHlsaW5nVmFsdWVzSW5kZXhPZihjb250ZXh0W1N0eWxpbmdJbmRleC5Jbml0aWFsQ2xhc3NWYWx1ZXNQb3NpdGlvbl0sIHByb3ApO1xuICB9IGVsc2Uge1xuICAgIGluaXRpYWxJbmRleCA9XG4gICAgICAgIGdldEluaXRpYWxTdHlsaW5nVmFsdWVzSW5kZXhPZihjb250ZXh0W1N0eWxpbmdJbmRleC5Jbml0aWFsU3R5bGVWYWx1ZXNQb3NpdGlvbl0sIHByb3ApO1xuICB9XG5cbiAgaW5pdGlhbEluZGV4ID0gaW5pdGlhbEluZGV4ID4gMCA/IChpbml0aWFsSW5kZXggKyBJbml0aWFsU3R5bGluZ1ZhbHVlc0luZGV4LlZhbHVlT2Zmc2V0KSA6IDA7XG4gIHJldHVybiBwb2ludGVycyhmbGFnLCBpbml0aWFsSW5kZXgsIDApO1xufVxuXG5mdW5jdGlvbiBoYXNJbml0aWFsVmFsdWVDaGFuZ2VkKGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBmbGFnOiBudW1iZXIsIG5ld1ZhbHVlOiBhbnkpIHtcbiAgY29uc3QgaW5pdGlhbFZhbHVlID0gZ2V0SW5pdGlhbFZhbHVlKGNvbnRleHQsIGZsYWcpO1xuICByZXR1cm4gIWluaXRpYWxWYWx1ZSB8fCBoYXNWYWx1ZUNoYW5nZWQoZmxhZywgaW5pdGlhbFZhbHVlLCBuZXdWYWx1ZSk7XG59XG5cbmZ1bmN0aW9uIGhhc1ZhbHVlQ2hhbmdlZChcbiAgICBmbGFnOiBudW1iZXIsIGE6IHN0cmluZyB8IGJvb2xlYW4gfCBudWxsLCBiOiBzdHJpbmcgfCBib29sZWFuIHwgbnVsbCk6IGJvb2xlYW4ge1xuICBjb25zdCBpc0NsYXNzQmFzZWQgPSBmbGFnICYgU3R5bGluZ0ZsYWdzLkNsYXNzO1xuICBjb25zdCBoYXNWYWx1ZXMgPSBhICYmIGI7XG4gIGNvbnN0IHVzZXNTYW5pdGl6ZXIgPSBmbGFnICYgU3R5bGluZ0ZsYWdzLlNhbml0aXplO1xuICAvLyB0aGUgdG9TdHJpbmcoKSBjb21wYXJpc29uIGVuc3VyZXMgdGhhdCBhIHZhbHVlIGlzIGNoZWNrZWRcbiAgLy8gLi4uIG90aGVyd2lzZSAoZHVyaW5nIHNhbml0aXphdGlvbiBieXBhc3NpbmcpIHRoZSA9PT0gY29tcGFyc2lvblxuICAvLyB3b3VsZCBmYWlsIHNpbmNlIGEgbmV3IFN0cmluZygpIGluc3RhbmNlIGlzIGNyZWF0ZWRcbiAgaWYgKCFpc0NsYXNzQmFzZWQgJiYgaGFzVmFsdWVzICYmIHVzZXNTYW5pdGl6ZXIpIHtcbiAgICAvLyB3ZSBrbm93IGZvciBzdXJlIHdlJ3JlIGRlYWxpbmcgd2l0aCBzdHJpbmdzIGF0IHRoaXMgcG9pbnRcbiAgICByZXR1cm4gKGEgYXMgc3RyaW5nKS50b1N0cmluZygpICE9PSAoYiBhcyBzdHJpbmcpLnRvU3RyaW5nKCk7XG4gIH1cblxuICAvLyBldmVyeXRoaW5nIGVsc2UgaXMgc2FmZSB0byBjaGVjayB3aXRoIGEgbm9ybWFsIGVxdWFsaXR5IGNoZWNrXG4gIHJldHVybiBhICE9PSBiO1xufVxuXG5leHBvcnQgY2xhc3MgQ2xhc3NBbmRTdHlsZVBsYXllckJ1aWxkZXI8VD4gaW1wbGVtZW50cyBQbGF5ZXJCdWlsZGVyIHtcbiAgcHJpdmF0ZSBfdmFsdWVzOiB7W2tleTogc3RyaW5nXTogc3RyaW5nIHwgbnVsbH0gPSB7fTtcbiAgcHJpdmF0ZSBfZGlydHkgPSBmYWxzZTtcbiAgcHJpdmF0ZSBfZmFjdG9yeTogQm91bmRQbGF5ZXJGYWN0b3J5PFQ+O1xuXG4gIGNvbnN0cnVjdG9yKGZhY3Rvcnk6IFBsYXllckZhY3RvcnksIHByaXZhdGUgX2VsZW1lbnQ6IEhUTUxFbGVtZW50LCBwcml2YXRlIF90eXBlOiBCaW5kaW5nVHlwZSkge1xuICAgIHRoaXMuX2ZhY3RvcnkgPSBmYWN0b3J5IGFzIGFueTtcbiAgfVxuXG4gIHNldFZhbHVlKHByb3A6IHN0cmluZywgdmFsdWU6IGFueSkge1xuICAgIGlmICh0aGlzLl92YWx1ZXNbcHJvcF0gIT09IHZhbHVlKSB7XG4gICAgICB0aGlzLl92YWx1ZXNbcHJvcF0gPSB2YWx1ZTtcbiAgICAgIHRoaXMuX2RpcnR5ID0gdHJ1ZTtcbiAgICB9XG4gIH1cblxuICBidWlsZFBsYXllcihjdXJyZW50UGxheWVyOiBQbGF5ZXJ8bnVsbCwgaXNGaXJzdFJlbmRlcjogYm9vbGVhbik6IFBsYXllcnx1bmRlZmluZWR8bnVsbCB7XG4gICAgLy8gaWYgbm8gdmFsdWVzIGhhdmUgYmVlbiBzZXQgaGVyZSB0aGVuIHRoaXMgbWVhbnMgdGhlIGJpbmRpbmcgZGlkbid0XG4gICAgLy8gY2hhbmdlIGFuZCB0aGVyZWZvcmUgdGhlIGJpbmRpbmcgdmFsdWVzIHdlcmUgbm90IHVwZGF0ZWQgdGhyb3VnaFxuICAgIC8vIGBzZXRWYWx1ZWAgd2hpY2ggbWVhbnMgbm8gbmV3IHBsYXllciB3aWxsIGJlIHByb3ZpZGVkLlxuICAgIGlmICh0aGlzLl9kaXJ0eSkge1xuICAgICAgY29uc3QgcGxheWVyID0gdGhpcy5fZmFjdG9yeS5mbihcbiAgICAgICAgICB0aGlzLl9lbGVtZW50LCB0aGlzLl90eXBlLCB0aGlzLl92YWx1ZXMgISwgaXNGaXJzdFJlbmRlciwgY3VycmVudFBsYXllciB8fCBudWxsKTtcbiAgICAgIHRoaXMuX3ZhbHVlcyA9IHt9O1xuICAgICAgdGhpcy5fZGlydHkgPSBmYWxzZTtcbiAgICAgIHJldHVybiBwbGF5ZXI7XG4gICAgfVxuXG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxufVxuXG4vKipcbiAqIFVzZWQgdG8gcHJvdmlkZSBhIHN1bW1hcnkgb2YgdGhlIHN0YXRlIG9mIHRoZSBzdHlsaW5nIGNvbnRleHQuXG4gKlxuICogVGhpcyBpcyBhbiBpbnRlcm5hbCBpbnRlcmZhY2UgdGhhdCBpcyBvbmx5IHVzZWQgaW5zaWRlIG9mIHRlc3QgdG9vbGluZyB0b1xuICogaGVscCBzdW1tYXJpemUgd2hhdCdzIGdvaW5nIG9uIHdpdGhpbiB0aGUgc3R5bGluZyBjb250ZXh0LiBOb25lIG9mIHRoaXMgY29kZVxuICogaXMgZGVzaWduZWQgdG8gYmUgZXhwb3J0ZWQgcHVibGljbHkgYW5kIHdpbGwsIHRoZXJlZm9yZSwgYmUgdHJlZS1zaGFrZW4gYXdheVxuICogZHVyaW5nIHJ1bnRpbWUuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgTG9nU3VtbWFyeSB7XG4gIG5hbWU6IHN0cmluZzsgICAgICAgICAgLy9cbiAgc3RhdGljSW5kZXg6IG51bWJlcjsgICAvL1xuICBkeW5hbWljSW5kZXg6IG51bWJlcjsgIC8vXG4gIHZhbHVlOiBudW1iZXI7ICAgICAgICAgLy9cbiAgZmxhZ3M6IHtcbiAgICBkaXJ0eTogYm9vbGVhbjsgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgY2xhc3M6IGJvb2xlYW47ICAgICAgICAgICAgICAgICAgICAvL1xuICAgIHNhbml0aXplOiBib29sZWFuOyAgICAgICAgICAgICAgICAgLy9cbiAgICBwbGF5ZXJCdWlsZGVyc0RpcnR5OiBib29sZWFuOyAgICAgIC8vXG4gICAgYmluZGluZ0FsbG9jYXRpb25Mb2NrZWQ6IGJvb2xlYW47ICAvL1xuICB9O1xufVxuXG4vKipcbiAqIFRoaXMgZnVuY3Rpb24gaXMgbm90IGRlc2lnbmVkIHRvIGJlIHVzZWQgaW4gcHJvZHVjdGlvbi5cbiAqIEl0IGlzIGEgdXRpbGl0eSB0b29sIGZvciBkZWJ1Z2dpbmcgYW5kIHRlc3RpbmcgYW5kIGl0XG4gKiB3aWxsIGF1dG9tYXRpY2FsbHkgYmUgdHJlZS1zaGFrZW4gYXdheSBkdXJpbmcgcHJvZHVjdGlvbi5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdlbmVyYXRlQ29uZmlnU3VtbWFyeShzb3VyY2U6IG51bWJlcik6IExvZ1N1bW1hcnk7XG5leHBvcnQgZnVuY3Rpb24gZ2VuZXJhdGVDb25maWdTdW1tYXJ5KHNvdXJjZTogU3R5bGluZ0NvbnRleHQpOiBMb2dTdW1tYXJ5O1xuZXhwb3J0IGZ1bmN0aW9uIGdlbmVyYXRlQ29uZmlnU3VtbWFyeShzb3VyY2U6IFN0eWxpbmdDb250ZXh0LCBpbmRleDogbnVtYmVyKTogTG9nU3VtbWFyeTtcbmV4cG9ydCBmdW5jdGlvbiBnZW5lcmF0ZUNvbmZpZ1N1bW1hcnkoc291cmNlOiBudW1iZXIgfCBTdHlsaW5nQ29udGV4dCwgaW5kZXg/OiBudW1iZXIpOiBMb2dTdW1tYXJ5IHtcbiAgbGV0IGZsYWcsIG5hbWUgPSAnY29uZmlnIHZhbHVlIGZvciAnO1xuICBpZiAoQXJyYXkuaXNBcnJheShzb3VyY2UpKSB7XG4gICAgaWYgKGluZGV4KSB7XG4gICAgICBuYW1lICs9ICdpbmRleDogJyArIGluZGV4O1xuICAgIH0gZWxzZSB7XG4gICAgICBuYW1lICs9ICdtYXN0ZXIgY29uZmlnJztcbiAgICB9XG4gICAgaW5kZXggPSBpbmRleCB8fCBTdHlsaW5nSW5kZXguTWFzdGVyRmxhZ1Bvc2l0aW9uO1xuICAgIGZsYWcgPSBzb3VyY2VbaW5kZXhdIGFzIG51bWJlcjtcbiAgfSBlbHNlIHtcbiAgICBmbGFnID0gc291cmNlO1xuICAgIG5hbWUgKz0gJ2luZGV4OiAnICsgZmxhZztcbiAgfVxuICBjb25zdCBkeW5hbWljSW5kZXggPSBnZXRNdWx0aU9yU2luZ2xlSW5kZXgoZmxhZyk7XG4gIGNvbnN0IHN0YXRpY0luZGV4ID0gZ2V0SW5pdGlhbEluZGV4KGZsYWcpO1xuICByZXR1cm4ge1xuICAgIG5hbWUsXG4gICAgc3RhdGljSW5kZXgsXG4gICAgZHluYW1pY0luZGV4LFxuICAgIHZhbHVlOiBmbGFnLFxuICAgIGZsYWdzOiB7XG4gICAgICBkaXJ0eTogZmxhZyAmIFN0eWxpbmdGbGFncy5EaXJ0eSA/IHRydWUgOiBmYWxzZSxcbiAgICAgIGNsYXNzOiBmbGFnICYgU3R5bGluZ0ZsYWdzLkNsYXNzID8gdHJ1ZSA6IGZhbHNlLFxuICAgICAgc2FuaXRpemU6IGZsYWcgJiBTdHlsaW5nRmxhZ3MuU2FuaXRpemUgPyB0cnVlIDogZmFsc2UsXG4gICAgICBwbGF5ZXJCdWlsZGVyc0RpcnR5OiBmbGFnICYgU3R5bGluZ0ZsYWdzLlBsYXllckJ1aWxkZXJzRGlydHkgPyB0cnVlIDogZmFsc2UsXG4gICAgICBiaW5kaW5nQWxsb2NhdGlvbkxvY2tlZDogZmxhZyAmIFN0eWxpbmdGbGFncy5CaW5kaW5nQWxsb2NhdGlvbkxvY2tlZCA/IHRydWUgOiBmYWxzZSxcbiAgICB9XG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXREaXJlY3RpdmVJbmRleEZyb21FbnRyeShjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgaW5kZXg6IG51bWJlcikge1xuICBjb25zdCB2YWx1ZSA9IGNvbnRleHRbaW5kZXggKyBTdHlsaW5nSW5kZXguUGxheWVyQnVpbGRlckluZGV4T2Zmc2V0XSBhcyBudW1iZXI7XG4gIHJldHVybiB2YWx1ZSAmIERpcmVjdGl2ZU93bmVyQW5kUGxheWVyQnVpbGRlckluZGV4LkJpdE1hc2s7XG59XG5cbmZ1bmN0aW9uIGdldERpcmVjdGl2ZUluZGV4RnJvbVJlZ2lzdHJ5KGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBkaXJlY3RpdmVSZWY6IGFueSkge1xuICBsZXQgZGlyZWN0aXZlSW5kZXg6IG51bWJlcjtcblxuICBjb25zdCBkaXJzID0gY29udGV4dFtTdHlsaW5nSW5kZXguRGlyZWN0aXZlUmVnaXN0cnlQb3NpdGlvbl07XG4gIGxldCBpbmRleCA9IGdldERpcmVjdGl2ZVJlZ2lzdHJ5VmFsdWVzSW5kZXhPZihkaXJzLCBkaXJlY3RpdmVSZWYpO1xuICBpZiAoaW5kZXggPT09IC0xKSB7XG4gICAgLy8gaWYgdGhlIGRpcmVjdGl2ZSB3YXMgbm90IGFsbG9jYXRlZCB0aGVuIHRoaXMgbWVhbnMgdGhhdCBzdHlsaW5nIGlzXG4gICAgLy8gYmVpbmcgYXBwbGllZCBpbiBhIGR5bmFtaWMgd2F5IEFGVEVSIHRoZSBlbGVtZW50IHdhcyBhbHJlYWR5IGluc3RhbnRpYXRlZFxuICAgIGluZGV4ID0gZGlycy5sZW5ndGg7XG4gICAgZGlyZWN0aXZlSW5kZXggPSBpbmRleCA+IDAgPyBpbmRleCAvIERpcmVjdGl2ZVJlZ2lzdHJ5VmFsdWVzSW5kZXguU2l6ZSA6IDA7XG5cbiAgICBkaXJzLnB1c2gobnVsbCwgbnVsbCwgbnVsbCwgbnVsbCk7XG4gICAgZGlyc1tpbmRleCArIERpcmVjdGl2ZVJlZ2lzdHJ5VmFsdWVzSW5kZXguRGlyZWN0aXZlVmFsdWVPZmZzZXRdID0gZGlyZWN0aXZlUmVmO1xuICAgIGRpcnNbaW5kZXggKyBEaXJlY3RpdmVSZWdpc3RyeVZhbHVlc0luZGV4LkRpcnR5RmxhZ09mZnNldF0gPSBmYWxzZTtcbiAgICBkaXJzW2luZGV4ICsgRGlyZWN0aXZlUmVnaXN0cnlWYWx1ZXNJbmRleC5TaW5nbGVQcm9wVmFsdWVzSW5kZXhPZmZzZXRdID0gLTE7XG5cbiAgICBjb25zdCBjbGFzc2VzU3RhcnRJbmRleCA9XG4gICAgICAgIGdldE11bHRpQ2xhc3Nlc1N0YXJ0SW5kZXgoY29udGV4dCkgfHwgU3R5bGluZ0luZGV4LlNpbmdsZVN0eWxlc1N0YXJ0UG9zaXRpb247XG4gICAgcmVnaXN0ZXJNdWx0aU1hcEVudHJ5KGNvbnRleHQsIGRpcmVjdGl2ZUluZGV4LCB0cnVlLCBjb250ZXh0Lmxlbmd0aCk7XG4gICAgcmVnaXN0ZXJNdWx0aU1hcEVudHJ5KGNvbnRleHQsIGRpcmVjdGl2ZUluZGV4LCBmYWxzZSwgY2xhc3Nlc1N0YXJ0SW5kZXgpO1xuICB9IGVsc2Uge1xuICAgIGRpcmVjdGl2ZUluZGV4ID0gaW5kZXggPiAwID8gaW5kZXggLyBEaXJlY3RpdmVSZWdpc3RyeVZhbHVlc0luZGV4LlNpemUgOiAwO1xuICB9XG5cbiAgcmV0dXJuIGRpcmVjdGl2ZUluZGV4O1xufVxuXG5mdW5jdGlvbiBnZXREaXJlY3RpdmVSZWdpc3RyeVZhbHVlc0luZGV4T2YoXG4gICAgZGlyZWN0aXZlczogRGlyZWN0aXZlUmVnaXN0cnlWYWx1ZXMsIGRpcmVjdGl2ZToge30pOiBudW1iZXIge1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGRpcmVjdGl2ZXMubGVuZ3RoOyBpICs9IERpcmVjdGl2ZVJlZ2lzdHJ5VmFsdWVzSW5kZXguU2l6ZSkge1xuICAgIGlmIChkaXJlY3RpdmVzW2ldID09PSBkaXJlY3RpdmUpIHtcbiAgICAgIHJldHVybiBpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gLTE7XG59XG5cbmZ1bmN0aW9uIGdldEluaXRpYWxTdHlsaW5nVmFsdWVzSW5kZXhPZihrZXlWYWx1ZXM6IEluaXRpYWxTdHlsaW5nVmFsdWVzLCBrZXk6IHN0cmluZyk6IG51bWJlciB7XG4gIGZvciAobGV0IGkgPSBJbml0aWFsU3R5bGluZ1ZhbHVlc0luZGV4LktleVZhbHVlU3RhcnRQb3NpdGlvbjsgaSA8IGtleVZhbHVlcy5sZW5ndGg7XG4gICAgICAgaSArPSBJbml0aWFsU3R5bGluZ1ZhbHVlc0luZGV4LlNpemUpIHtcbiAgICBpZiAoa2V5VmFsdWVzW2ldID09PSBrZXkpIHJldHVybiBpO1xuICB9XG4gIHJldHVybiAtMTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNvbXBhcmVMb2dTdW1tYXJpZXMoYTogTG9nU3VtbWFyeSwgYjogTG9nU3VtbWFyeSkge1xuICBjb25zdCBsb2c6IHN0cmluZ1tdID0gW107XG4gIGNvbnN0IGRpZmZzOiBbc3RyaW5nLCBhbnksIGFueV1bXSA9IFtdO1xuICBkaWZmU3VtbWFyeVZhbHVlcyhkaWZmcywgJ3N0YXRpY0luZGV4JywgJ3N0YXRpY0luZGV4JywgYSwgYik7XG4gIGRpZmZTdW1tYXJ5VmFsdWVzKGRpZmZzLCAnZHluYW1pY0luZGV4JywgJ2R5bmFtaWNJbmRleCcsIGEsIGIpO1xuICBPYmplY3Qua2V5cyhhLmZsYWdzKS5mb3JFYWNoKFxuICAgICAgbmFtZSA9PiB7IGRpZmZTdW1tYXJ5VmFsdWVzKGRpZmZzLCAnZmxhZ3MuJyArIG5hbWUsIG5hbWUsIGEuZmxhZ3MsIGIuZmxhZ3MpOyB9KTtcblxuICBpZiAoZGlmZnMubGVuZ3RoKSB7XG4gICAgbG9nLnB1c2goJ0xvZyBTdW1tYXJpZXMgZm9yOicpO1xuICAgIGxvZy5wdXNoKCcgIEE6ICcgKyBhLm5hbWUpO1xuICAgIGxvZy5wdXNoKCcgIEI6ICcgKyBiLm5hbWUpO1xuICAgIGxvZy5wdXNoKCdcXG4gIERpZmZlciBpbiB0aGUgZm9sbG93aW5nIHdheSAoQSAhPT0gQik6Jyk7XG4gICAgZGlmZnMuZm9yRWFjaChyZXN1bHQgPT4ge1xuICAgICAgY29uc3QgW25hbWUsIGFWYWwsIGJWYWxdID0gcmVzdWx0O1xuICAgICAgbG9nLnB1c2goJyAgICA9PiAnICsgbmFtZSk7XG4gICAgICBsb2cucHVzaCgnICAgID0+ICcgKyBhVmFsICsgJyAhPT0gJyArIGJWYWwgKyAnXFxuJyk7XG4gICAgfSk7XG4gIH1cblxuICByZXR1cm4gbG9nO1xufVxuXG5mdW5jdGlvbiBkaWZmU3VtbWFyeVZhbHVlcyhyZXN1bHQ6IGFueVtdLCBuYW1lOiBzdHJpbmcsIHByb3A6IHN0cmluZywgYTogYW55LCBiOiBhbnkpIHtcbiAgY29uc3QgYVZhbCA9IGFbcHJvcF07XG4gIGNvbnN0IGJWYWwgPSBiW3Byb3BdO1xuICBpZiAoYVZhbCAhPT0gYlZhbCkge1xuICAgIHJlc3VsdC5wdXNoKFtuYW1lLCBhVmFsLCBiVmFsXSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gZ2V0U2luZ2xlUHJvcEluZGV4VmFsdWUoXG4gICAgY29udGV4dDogU3R5bGluZ0NvbnRleHQsIGRpcmVjdGl2ZUluZGV4OiBudW1iZXIsIG9mZnNldDogbnVtYmVyLCBpc0NsYXNzQmFzZWQ6IGJvb2xlYW4pIHtcbiAgY29uc3Qgc2luZ2xlUHJvcE9mZnNldFJlZ2lzdHJ5SW5kZXggPVxuICAgICAgY29udGV4dFtTdHlsaW5nSW5kZXguRGlyZWN0aXZlUmVnaXN0cnlQb3NpdGlvbl1cbiAgICAgICAgICAgICBbKGRpcmVjdGl2ZUluZGV4ICogRGlyZWN0aXZlUmVnaXN0cnlWYWx1ZXNJbmRleC5TaXplKSArXG4gICAgICAgICAgICAgIERpcmVjdGl2ZVJlZ2lzdHJ5VmFsdWVzSW5kZXguU2luZ2xlUHJvcFZhbHVlc0luZGV4T2Zmc2V0XSBhcyBudW1iZXI7XG4gIGNvbnN0IG9mZnNldHMgPSBjb250ZXh0W1N0eWxpbmdJbmRleC5TaW5nbGVQcm9wT2Zmc2V0UG9zaXRpb25zXTtcbiAgY29uc3QgaW5kZXhGb3JPZmZzZXQgPSBzaW5nbGVQcm9wT2Zmc2V0UmVnaXN0cnlJbmRleCArXG4gICAgICBTaW5nbGVQcm9wT2Zmc2V0VmFsdWVzSW5kZXguVmFsdWVTdGFydFBvc2l0aW9uICtcbiAgICAgIChpc0NsYXNzQmFzZWQgP1xuICAgICAgICAgICBvZmZzZXRzXG4gICAgICAgICAgICAgICBbc2luZ2xlUHJvcE9mZnNldFJlZ2lzdHJ5SW5kZXggKyBTaW5nbGVQcm9wT2Zmc2V0VmFsdWVzSW5kZXguU3R5bGVzQ291bnRQb3NpdGlvbl0gOlxuICAgICAgICAgICAwKSArXG4gICAgICBvZmZzZXQ7XG4gIHJldHVybiBvZmZzZXRzW2luZGV4Rm9yT2Zmc2V0XTtcbn1cblxuZnVuY3Rpb24gZ2V0U3R5bGVTYW5pdGl6ZXIoY29udGV4dDogU3R5bGluZ0NvbnRleHQsIGRpcmVjdGl2ZUluZGV4OiBudW1iZXIpOiBTdHlsZVNhbml0aXplRm58bnVsbCB7XG4gIGNvbnN0IGRpcnMgPSBjb250ZXh0W1N0eWxpbmdJbmRleC5EaXJlY3RpdmVSZWdpc3RyeVBvc2l0aW9uXTtcbiAgY29uc3QgdmFsdWUgPSBkaXJzXG4gICAgICAgICAgICAgICAgICAgIFtkaXJlY3RpdmVJbmRleCAqIERpcmVjdGl2ZVJlZ2lzdHJ5VmFsdWVzSW5kZXguU2l6ZSArXG4gICAgICAgICAgICAgICAgICAgICBEaXJlY3RpdmVSZWdpc3RyeVZhbHVlc0luZGV4LlN0eWxlU2FuaXRpemVyT2Zmc2V0XSB8fFxuICAgICAgZGlyc1tEaXJlY3RpdmVSZWdpc3RyeVZhbHVlc0luZGV4LlN0eWxlU2FuaXRpemVyT2Zmc2V0XSB8fCBudWxsO1xuICByZXR1cm4gdmFsdWUgYXMgU3R5bGVTYW5pdGl6ZUZuIHwgbnVsbDtcbn1cblxuZnVuY3Rpb24gaXNEaXJlY3RpdmVEaXJ0eShjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgZGlyZWN0aXZlSW5kZXg6IG51bWJlcik6IGJvb2xlYW4ge1xuICBjb25zdCBkaXJzID0gY29udGV4dFtTdHlsaW5nSW5kZXguRGlyZWN0aXZlUmVnaXN0cnlQb3NpdGlvbl07XG4gIHJldHVybiBkaXJzXG4gICAgICBbZGlyZWN0aXZlSW5kZXggKiBEaXJlY3RpdmVSZWdpc3RyeVZhbHVlc0luZGV4LlNpemUgK1xuICAgICAgIERpcmVjdGl2ZVJlZ2lzdHJ5VmFsdWVzSW5kZXguRGlydHlGbGFnT2Zmc2V0XSBhcyBib29sZWFuO1xufVxuXG5mdW5jdGlvbiBzZXREaXJlY3RpdmVEaXJ0eShcbiAgICBjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgZGlyZWN0aXZlSW5kZXg6IG51bWJlciwgZGlydHlZZXM6IGJvb2xlYW4pOiB2b2lkIHtcbiAgY29uc3QgZGlycyA9IGNvbnRleHRbU3R5bGluZ0luZGV4LkRpcmVjdGl2ZVJlZ2lzdHJ5UG9zaXRpb25dO1xuICBkaXJzXG4gICAgICBbZGlyZWN0aXZlSW5kZXggKiBEaXJlY3RpdmVSZWdpc3RyeVZhbHVlc0luZGV4LlNpemUgK1xuICAgICAgIERpcmVjdGl2ZVJlZ2lzdHJ5VmFsdWVzSW5kZXguRGlydHlGbGFnT2Zmc2V0XSA9IGRpcnR5WWVzO1xufVxuXG5mdW5jdGlvbiBhbGxvd1ZhbHVlQ2hhbmdlKFxuICAgIGN1cnJlbnRWYWx1ZTogc3RyaW5nIHwgYm9vbGVhbiB8IG51bGwsIG5ld1ZhbHVlOiBzdHJpbmcgfCBib29sZWFuIHwgbnVsbCxcbiAgICBjdXJyZW50RGlyZWN0aXZlT3duZXI6IG51bWJlciwgbmV3RGlyZWN0aXZlT3duZXI6IG51bWJlcikge1xuICAvLyB0aGUgY29kZSBiZWxvdyByZWxpZXMgdGhlIGltcG9ydGFuY2Ugb2YgZGlyZWN0aXZlJ3MgYmVpbmcgdGllZCB0byB0aGVpclxuICAvLyBpbmRleCB2YWx1ZS4gVGhlIGluZGV4IHZhbHVlcyBmb3IgZWFjaCBkaXJlY3RpdmUgYXJlIGRlcml2ZWQgZnJvbSBiZWluZ1xuICAvLyByZWdpc3RlcmVkIGludG8gdGhlIHN0eWxpbmcgY29udGV4dCBkaXJlY3RpdmUgcmVnaXN0cnkuIFRoZSBtb3N0IGltcG9ydGFudFxuICAvLyBkaXJlY3RpdmUgaXMgdGhlIHBhcmVudCBjb21wb25lbnQgZGlyZWN0aXZlICh0aGUgdGVtcGxhdGUpIGFuZCBlYWNoIGRpcmVjdGl2ZVxuICAvLyB0aGF0IGlzIGFkZGVkIGFmdGVyIGlzIGNvbnNpZGVyZWQgbGVzcyBpbXBvcnRhbnQgdGhhbiB0aGUgcHJldmlvdXMgZW50cnkuIFRoaXNcbiAgLy8gcHJpb3JpdGl6YXRpb24gb2YgZGlyZWN0aXZlcyBlbmFibGVzIHRoZSBzdHlsaW5nIGFsZ29yaXRobSB0byBkZWNpZGUgaWYgYSBzdHlsZVxuICAvLyBvciBjbGFzcyBzaG91bGQgYmUgYWxsb3dlZCB0byBiZSB1cGRhdGVkL3JlcGxhY2VkIGluIGNhc2UgYW4gZWFybGllciBkaXJlY3RpdmVcbiAgLy8gYWxyZWFkeSB3cm90ZSB0byB0aGUgZXhhY3Qgc2FtZSBzdHlsZS1wcm9wZXJ0eSBvciBjbGFzc05hbWUgdmFsdWUuIEluIG90aGVyIHdvcmRzXG4gIC8vIHRoaXMgZGVjaWRlcyB3aGF0IHRvIGRvIGlmIGFuZCB3aGVuIHRoZXJlIGlzIGEgY29sbGlzaW9uLlxuICBpZiAoY3VycmVudFZhbHVlICE9IG51bGwpIHtcbiAgICBpZiAobmV3VmFsdWUgIT0gbnVsbCkge1xuICAgICAgLy8gaWYgYSBkaXJlY3RpdmUgaW5kZXggaXMgbG93ZXIgdGhhbiBpdCBhbHdheXMgaGFzIHByaW9yaXR5IG92ZXIgdGhlXG4gICAgICAvLyBwcmV2aW91cyBkaXJlY3RpdmUncyB2YWx1ZS4uLlxuICAgICAgcmV0dXJuIG5ld0RpcmVjdGl2ZU93bmVyIDw9IGN1cnJlbnREaXJlY3RpdmVPd25lcjtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gb25seSB3cml0ZSBhIG51bGwgdmFsdWUgaW4gY2FzZSBpdCdzIHRoZSBzYW1lIG93bmVyIHdyaXRpbmcgaXQuXG4gICAgICAvLyB0aGlzIGF2b2lkcyBoYXZpbmcgYSBoaWdoZXItcHJpb3JpdHkgZGlyZWN0aXZlIHdyaXRlIHRvIG51bGxcbiAgICAgIC8vIG9ubHkgdG8gaGF2ZSBhIGxlc3Nlci1wcmlvcml0eSBkaXJlY3RpdmUgY2hhbmdlIHJpZ2h0IHRvIGFcbiAgICAgIC8vIG5vbi1udWxsIHZhbHVlIGltbWVkaWF0ZWx5IGFmdGVyd2FyZHMuXG4gICAgICByZXR1cm4gY3VycmVudERpcmVjdGl2ZU93bmVyID09PSBuZXdEaXJlY3RpdmVPd25lcjtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHRydWU7XG59XG5cbi8qKlxuICogUmV0dXJucyB0aGUgY2xhc3NOYW1lIHN0cmluZyBvZiBhbGwgdGhlIGluaXRpYWwgY2xhc3NlcyBmb3IgdGhlIGVsZW1lbnQuXG4gKlxuICogVGhpcyBmdW5jdGlvbiBpcyBkZXNpZ25lZCB0byBwb3B1bGF0ZSBhbmQgY2FjaGUgYWxsIHRoZSBzdGF0aWMgY2xhc3NcbiAqIHZhbHVlcyBpbnRvIGEgY2xhc3NOYW1lIHN0cmluZy4gVGhlIGNhY2hpbmcgbWVjaGFuaXNtIHdvcmtzIGJ5IHBsYWNpbmdcbiAqIHRoZSBjb21wbGV0ZWQgY2xhc3NOYW1lIHN0cmluZyBpbnRvIHRoZSBpbml0aWFsIHZhbHVlcyBhcnJheSBpbnRvIGFcbiAqIGRlZGljYXRlZCBzbG90LiBUaGlzIHdpbGwgcHJldmVudCB0aGUgZnVuY3Rpb24gZnJvbSBoYXZpbmcgdG8gcG9wdWxhdGVcbiAqIHRoZSBzdHJpbmcgZWFjaCB0aW1lIGFuIGVsZW1lbnQgaXMgY3JlYXRlZCBvciBtYXRjaGVkLlxuICpcbiAqIEByZXR1cm5zIHRoZSBjbGFzc05hbWUgc3RyaW5nIChlLmcuIGBvbiBhY3RpdmUgcmVkYClcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldEluaXRpYWxDbGFzc05hbWVWYWx1ZShjb250ZXh0OiBTdHlsaW5nQ29udGV4dCk6IHN0cmluZyB7XG4gIGNvbnN0IGluaXRpYWxDbGFzc1ZhbHVlcyA9IGNvbnRleHRbU3R5bGluZ0luZGV4LkluaXRpYWxDbGFzc1ZhbHVlc1Bvc2l0aW9uXTtcbiAgbGV0IGNsYXNzTmFtZSA9IGluaXRpYWxDbGFzc1ZhbHVlc1tJbml0aWFsU3R5bGluZ1ZhbHVlc0luZGV4LkNhY2hlZFN0cmluZ1ZhbHVlUG9zaXRpb25dO1xuICBpZiAoY2xhc3NOYW1lID09PSBudWxsKSB7XG4gICAgY2xhc3NOYW1lID0gJyc7XG4gICAgZm9yIChsZXQgaSA9IEluaXRpYWxTdHlsaW5nVmFsdWVzSW5kZXguS2V5VmFsdWVTdGFydFBvc2l0aW9uOyBpIDwgaW5pdGlhbENsYXNzVmFsdWVzLmxlbmd0aDtcbiAgICAgICAgIGkgKz0gSW5pdGlhbFN0eWxpbmdWYWx1ZXNJbmRleC5TaXplKSB7XG4gICAgICBjb25zdCBpc1ByZXNlbnQgPSBpbml0aWFsQ2xhc3NWYWx1ZXNbaSArIDFdO1xuICAgICAgaWYgKGlzUHJlc2VudCkge1xuICAgICAgICBjbGFzc05hbWUgKz0gKGNsYXNzTmFtZS5sZW5ndGggPyAnICcgOiAnJykgKyBpbml0aWFsQ2xhc3NWYWx1ZXNbaV07XG4gICAgICB9XG4gICAgfVxuICAgIGluaXRpYWxDbGFzc1ZhbHVlc1tJbml0aWFsU3R5bGluZ1ZhbHVlc0luZGV4LkNhY2hlZFN0cmluZ1ZhbHVlUG9zaXRpb25dID0gY2xhc3NOYW1lO1xuICB9XG4gIHJldHVybiBjbGFzc05hbWU7XG59XG5cbi8qKlxuICogUmV0dXJucyB0aGUgc3R5bGUgc3RyaW5nIG9mIGFsbCB0aGUgaW5pdGlhbCBzdHlsZXMgZm9yIHRoZSBlbGVtZW50LlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gaXMgZGVzaWduZWQgdG8gcG9wdWxhdGUgYW5kIGNhY2hlIGFsbCB0aGUgc3RhdGljIHN0eWxlXG4gKiB2YWx1ZXMgaW50byBhIHN0eWxlIHN0cmluZy4gVGhlIGNhY2hpbmcgbWVjaGFuaXNtIHdvcmtzIGJ5IHBsYWNpbmdcbiAqIHRoZSBjb21wbGV0ZWQgc3R5bGUgc3RyaW5nIGludG8gdGhlIGluaXRpYWwgdmFsdWVzIGFycmF5IGludG8gYVxuICogZGVkaWNhdGVkIHNsb3QuIFRoaXMgd2lsbCBwcmV2ZW50IHRoZSBmdW5jdGlvbiBmcm9tIGhhdmluZyB0byBwb3B1bGF0ZVxuICogdGhlIHN0cmluZyBlYWNoIHRpbWUgYW4gZWxlbWVudCBpcyBjcmVhdGVkIG9yIG1hdGNoZWQuXG4gKlxuICogQHJldHVybnMgdGhlIHN0eWxlIHN0cmluZyAoZS5nLiBgd2lkdGg6MTAwcHg7aGVpZ2h0OjIwMHB4YClcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldEluaXRpYWxTdHlsZVN0cmluZ1ZhbHVlKGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0KTogc3RyaW5nIHtcbiAgY29uc3QgaW5pdGlhbFN0eWxlVmFsdWVzID0gY29udGV4dFtTdHlsaW5nSW5kZXguSW5pdGlhbFN0eWxlVmFsdWVzUG9zaXRpb25dO1xuICBsZXQgc3R5bGVTdHJpbmcgPSBpbml0aWFsU3R5bGVWYWx1ZXNbSW5pdGlhbFN0eWxpbmdWYWx1ZXNJbmRleC5DYWNoZWRTdHJpbmdWYWx1ZVBvc2l0aW9uXTtcbiAgaWYgKHN0eWxlU3RyaW5nID09PSBudWxsKSB7XG4gICAgc3R5bGVTdHJpbmcgPSAnJztcbiAgICBmb3IgKGxldCBpID0gSW5pdGlhbFN0eWxpbmdWYWx1ZXNJbmRleC5LZXlWYWx1ZVN0YXJ0UG9zaXRpb247IGkgPCBpbml0aWFsU3R5bGVWYWx1ZXMubGVuZ3RoO1xuICAgICAgICAgaSArPSBJbml0aWFsU3R5bGluZ1ZhbHVlc0luZGV4LlNpemUpIHtcbiAgICAgIGNvbnN0IHZhbHVlID0gaW5pdGlhbFN0eWxlVmFsdWVzW2kgKyAxXTtcbiAgICAgIGlmICh2YWx1ZSAhPT0gbnVsbCkge1xuICAgICAgICBzdHlsZVN0cmluZyArPSAoc3R5bGVTdHJpbmcubGVuZ3RoID8gJzsnIDogJycpICsgYCR7aW5pdGlhbFN0eWxlVmFsdWVzW2ldfToke3ZhbHVlfWA7XG4gICAgICB9XG4gICAgfVxuICAgIGluaXRpYWxTdHlsZVZhbHVlc1tJbml0aWFsU3R5bGluZ1ZhbHVlc0luZGV4LkNhY2hlZFN0cmluZ1ZhbHVlUG9zaXRpb25dID0gc3R5bGVTdHJpbmc7XG4gIH1cbiAgcmV0dXJuIHN0eWxlU3RyaW5nO1xufVxuXG4vKipcbiAqIFJldHVybnMgdGhlIGN1cnJlbnQgY2FjaGVkIG11dGxpLXZhbHVlIGZvciBhIGdpdmVuIGRpcmVjdGl2ZUluZGV4IHdpdGhpbiB0aGUgcHJvdmlkZWQgY29udGV4dC5cbiAqL1xuZnVuY3Rpb24gcmVhZENhY2hlZE1hcFZhbHVlKFxuICAgIGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBlbnRyeUlzQ2xhc3NCYXNlZDogYm9vbGVhbiwgZGlyZWN0aXZlSW5kZXg6IG51bWJlcikge1xuICBjb25zdCB2YWx1ZXM6IE1hcEJhc2VkT2Zmc2V0VmFsdWVzID1cbiAgICAgIGNvbnRleHRbZW50cnlJc0NsYXNzQmFzZWQgPyBTdHlsaW5nSW5kZXguQ2FjaGVkTXVsdGlDbGFzc2VzIDogU3R5bGluZ0luZGV4LkNhY2hlZE11bHRpU3R5bGVzXTtcbiAgY29uc3QgaW5kZXggPSBNYXBCYXNlZE9mZnNldFZhbHVlc0luZGV4LlZhbHVlc1N0YXJ0UG9zaXRpb24gK1xuICAgICAgZGlyZWN0aXZlSW5kZXggKiBNYXBCYXNlZE9mZnNldFZhbHVlc0luZGV4LlNpemU7XG4gIHJldHVybiB2YWx1ZXNbaW5kZXggKyBNYXBCYXNlZE9mZnNldFZhbHVlc0luZGV4LlZhbHVlT2Zmc2V0XSB8fCBudWxsO1xufVxuXG4vKipcbiAqIERldGVybWluZXMgd2hldGhlciB0aGUgcHJvdmlkZWQgbXVsdGkgc3R5bGluZyB2YWx1ZSBzaG91bGQgYmUgdXBkYXRlZCBvciBub3QuXG4gKlxuICogQmVjYXVzZSBgW3N0eWxlXWAgYW5kIGBbY2xhc3NdYCBiaW5kaW5ncyByZWx5IG9uIGFuIGlkZW50aXR5IGNoYW5nZSB0byBvY2N1ciBiZWZvcmVcbiAqIGFwcGx5aW5nIG5ldyB2YWx1ZXMsIHRoZSBzdHlsaW5nIGFsZ29yaXRobSBtYXkgbm90IHVwZGF0ZSBhbiBleGlzdGluZyBlbnRyeSBpbnRvXG4gKiB0aGUgY29udGV4dCBpZiBhIHByZXZpb3VzIGRpcmVjdGl2ZSdzIGVudHJ5IGNoYW5nZWQgc2hhcGUuXG4gKlxuICogVGhpcyBmdW5jdGlvbiB3aWxsIGRlY2lkZSB3aGV0aGVyIG9yIG5vdCBhIHZhbHVlIHNob3VsZCBiZSBhcHBsaWVkIChpZiB0aGVyZSBpcyBhXG4gKiBjYWNoZSBtaXNzKSB0byB0aGUgY29udGV4dCBiYXNlZCBvbiB0aGUgZm9sbG93aW5nIHJ1bGVzOlxuICpcbiAqIC0gSWYgdGhlcmUgaXMgYW4gaWRlbnRpdHkgY2hhbmdlIGJldHdlZW4gdGhlIGV4aXN0aW5nIHZhbHVlIGFuZCBuZXcgdmFsdWVcbiAqIC0gSWYgdGhlcmUgaXMgbm8gZXhpc3RpbmcgdmFsdWUgY2FjaGVkIChmaXJzdCB3cml0ZSlcbiAqIC0gSWYgYSBwcmV2aW91cyBkaXJlY3RpdmUgZmxhZ2dlZCB0aGUgZXhpc3RpbmcgY2FjaGVkIHZhbHVlIGFzIGRpcnR5XG4gKi9cbmZ1bmN0aW9uIGlzTXVsdGlWYWx1ZUNhY2hlSGl0KFxuICAgIGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBlbnRyeUlzQ2xhc3NCYXNlZDogYm9vbGVhbiwgZGlyZWN0aXZlSW5kZXg6IG51bWJlcixcbiAgICBuZXdWYWx1ZTogYW55KTogYm9vbGVhbiB7XG4gIGNvbnN0IGluZGV4T2ZDYWNoZWRWYWx1ZXMgPVxuICAgICAgZW50cnlJc0NsYXNzQmFzZWQgPyBTdHlsaW5nSW5kZXguQ2FjaGVkTXVsdGlDbGFzc2VzIDogU3R5bGluZ0luZGV4LkNhY2hlZE11bHRpU3R5bGVzO1xuICBjb25zdCBjYWNoZWRWYWx1ZXMgPSBjb250ZXh0W2luZGV4T2ZDYWNoZWRWYWx1ZXNdIGFzIE1hcEJhc2VkT2Zmc2V0VmFsdWVzO1xuICBjb25zdCBpbmRleCA9IE1hcEJhc2VkT2Zmc2V0VmFsdWVzSW5kZXguVmFsdWVzU3RhcnRQb3NpdGlvbiArXG4gICAgICBkaXJlY3RpdmVJbmRleCAqIE1hcEJhc2VkT2Zmc2V0VmFsdWVzSW5kZXguU2l6ZTtcbiAgaWYgKGNhY2hlZFZhbHVlc1tpbmRleCArIE1hcEJhc2VkT2Zmc2V0VmFsdWVzSW5kZXguRGlydHlGbGFnT2Zmc2V0XSkgcmV0dXJuIGZhbHNlO1xuICByZXR1cm4gbmV3VmFsdWUgPT09IE5PX0NIQU5HRSB8fFxuICAgICAgcmVhZENhY2hlZE1hcFZhbHVlKGNvbnRleHQsIGVudHJ5SXNDbGFzc0Jhc2VkLCBkaXJlY3RpdmVJbmRleCkgPT09IG5ld1ZhbHVlO1xufVxuXG4vKipcbiAqIFVwZGF0ZXMgdGhlIGNhY2hlZCBzdGF0dXMgb2YgYSBtdWx0aS1zdHlsaW5nIHZhbHVlIGluIHRoZSBjb250ZXh0LlxuICpcbiAqIFRoZSBjYWNoZWQgbWFwIGFycmF5ICh3aGljaCBleGlzdHMgaW4gdGhlIGNvbnRleHQpIGNvbnRhaW5zIGEgbWFuaWZlc3Qgb2ZcbiAqIGVhY2ggbXVsdGktc3R5bGluZyBlbnRyeSAoYFtzdHlsZV1gIGFuZCBgW2NsYXNzXWAgZW50cmllcykgZm9yIHRoZSB0ZW1wbGF0ZVxuICogYXMgd2VsbCBhcyBhbGwgZGlyZWN0aXZlcy5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIHdpbGwgdXBkYXRlIHRoZSBjYWNoZWQgc3RhdHVzIG9mIHRoZSBwcm92aWRlZCBtdWx0aS1zdHlsZVxuICogZW50cnkgd2l0aGluIHRoZSBjYWNoZS5cbiAqXG4gKiBXaGVuIGNhbGxlZCwgdGhpcyBmdW5jdGlvbiB3aWxsIHVwZGF0ZSB0aGUgZm9sbG93aW5nIGluZm9ybWF0aW9uOlxuICogLSBUaGUgYWN0dWFsIGNhY2hlZCB2YWx1ZSAodGhlIHJhdyB2YWx1ZSB0aGF0IHdhcyBwYXNzZWQgaW50byBgW3N0eWxlXWAgb3IgYFtjbGFzc11gKVxuICogLSBUaGUgdG90YWwgYW1vdW50IG9mIHVuaXF1ZSBzdHlsaW5nIGVudHJpZXMgdGhhdCB0aGlzIHZhbHVlIGhhcyB3cml0dGVuIGludG8gdGhlIGNvbnRleHRcbiAqIC0gVGhlIGV4YWN0IHBvc2l0aW9uIG9mIHdoZXJlIHRoZSBtdWx0aSBzdHlsaW5nIGVudHJpZXMgc3RhcnQgaW4gdGhlIGNvbnRleHQgZm9yIHRoaXMgYmluZGluZ1xuICogLSBUaGUgZGlydHkgZmxhZyB3aWxsIGJlIHNldCB0byB0cnVlXG4gKlxuICogSWYgdGhlIGBkaXJ0eUZ1dHVyZVZhbHVlc2AgcGFyYW0gaXMgcHJvdmlkZWQgdGhlbiBpdCB3aWxsIHVwZGF0ZSBhbGwgZnV0dXJlIGVudHJpZXMgKGJpbmRpbmdcbiAqIGVudHJpZXMgdGhhdCBleGlzdCBhcyBhcGFydCBvZiBvdGhlciBkaXJlY3RpdmVzKSB0byBiZSBkaXJ0eSBhcyB3ZWxsLiBUaGlzIHdpbGwgZm9yY2UgdGhlXG4gKiBzdHlsaW5nIGFsZ29yaXRobSB0byByZWFwcGx5IHRob3NlIHZhbHVlcyBvbmNlIGNoYW5nZSBkZXRlY3Rpb24gY2hlY2tzIHRoZW0gKHdoaWNoIHdpbGwgaW5cbiAqIHR1cm4gY2F1c2UgdGhlIHN0eWxpbmcgY29udGV4dCB0byB1cGRhdGUgaXRzZWxmIGFuZCB0aGUgY29ycmVjdCBzdHlsaW5nIHZhbHVlcyB3aWxsIGJlXG4gKiByZW5kZXJlZCBvbiBzY3JlZW4pLlxuICovXG5mdW5jdGlvbiB1cGRhdGVDYWNoZWRNYXBWYWx1ZShcbiAgICBjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgZGlyZWN0aXZlSW5kZXg6IG51bWJlciwgZW50cnlJc0NsYXNzQmFzZWQ6IGJvb2xlYW4sIGNhY2hlVmFsdWU6IGFueSxcbiAgICBzdGFydFBvc2l0aW9uOiBudW1iZXIsIGVuZFBvc2l0aW9uOiBudW1iZXIsIHRvdGFsVmFsdWVzOiBudW1iZXIsIGRpcnR5RnV0dXJlVmFsdWVzOiBib29sZWFuKSB7XG4gIGNvbnN0IHZhbHVlcyA9XG4gICAgICBjb250ZXh0W2VudHJ5SXNDbGFzc0Jhc2VkID8gU3R5bGluZ0luZGV4LkNhY2hlZE11bHRpQ2xhc3NlcyA6IFN0eWxpbmdJbmRleC5DYWNoZWRNdWx0aVN0eWxlc107XG5cbiAgY29uc3QgaW5kZXggPSBNYXBCYXNlZE9mZnNldFZhbHVlc0luZGV4LlZhbHVlc1N0YXJ0UG9zaXRpb24gK1xuICAgICAgZGlyZWN0aXZlSW5kZXggKiBNYXBCYXNlZE9mZnNldFZhbHVlc0luZGV4LlNpemU7XG5cbiAgLy8gaW4gdGhlIGV2ZW50IHRoYXQgdGhpcyBpcyB0cnVlIHdlIGFzc3VtZSB0aGF0IGZ1dHVyZSB2YWx1ZXMgYXJlIGRpcnR5IGFuZCB0aGVyZWZvcmVcbiAgLy8gd2lsbCBiZSBjaGVja2VkIGFnYWluIGluIHRoZSBuZXh0IENEIGN5Y2xlXG4gIGlmIChkaXJ0eUZ1dHVyZVZhbHVlcykge1xuICAgIGNvbnN0IG5leHRTdGFydFBvc2l0aW9uID0gc3RhcnRQb3NpdGlvbiArIHRvdGFsVmFsdWVzICogTWFwQmFzZWRPZmZzZXRWYWx1ZXNJbmRleC5TaXplO1xuICAgIGZvciAobGV0IGkgPSBpbmRleCArIE1hcEJhc2VkT2Zmc2V0VmFsdWVzSW5kZXguU2l6ZTsgaSA8IHZhbHVlcy5sZW5ndGg7XG4gICAgICAgICBpICs9IE1hcEJhc2VkT2Zmc2V0VmFsdWVzSW5kZXguU2l6ZSkge1xuICAgICAgdmFsdWVzW2kgKyBNYXBCYXNlZE9mZnNldFZhbHVlc0luZGV4LlBvc2l0aW9uU3RhcnRPZmZzZXRdID0gbmV4dFN0YXJ0UG9zaXRpb247XG4gICAgICB2YWx1ZXNbaSArIE1hcEJhc2VkT2Zmc2V0VmFsdWVzSW5kZXguRGlydHlGbGFnT2Zmc2V0XSA9IDE7XG4gICAgfVxuICB9XG5cbiAgdmFsdWVzW2luZGV4ICsgTWFwQmFzZWRPZmZzZXRWYWx1ZXNJbmRleC5EaXJ0eUZsYWdPZmZzZXRdID0gMDtcbiAgdmFsdWVzW2luZGV4ICsgTWFwQmFzZWRPZmZzZXRWYWx1ZXNJbmRleC5Qb3NpdGlvblN0YXJ0T2Zmc2V0XSA9IHN0YXJ0UG9zaXRpb247XG4gIHZhbHVlc1tpbmRleCArIE1hcEJhc2VkT2Zmc2V0VmFsdWVzSW5kZXguVmFsdWVPZmZzZXRdID0gY2FjaGVWYWx1ZTtcbiAgdmFsdWVzW2luZGV4ICsgTWFwQmFzZWRPZmZzZXRWYWx1ZXNJbmRleC5WYWx1ZUNvdW50T2Zmc2V0XSA9IHRvdGFsVmFsdWVzO1xuXG4gIC8vIHRoZSBjb2RlIGJlbG93IGNvdW50cyB0aGUgdG90YWwgYW1vdW50IG9mIHN0eWxpbmcgdmFsdWVzIHRoYXQgZXhpc3QgaW5cbiAgLy8gdGhlIGNvbnRleHQgdXAgdW50aWwgdGhpcyBkaXJlY3RpdmUuIFRoaXMgdmFsdWUgd2lsbCBiZSBsYXRlciB1c2VkIHRvXG4gIC8vIHVwZGF0ZSB0aGUgY2FjaGVkIHZhbHVlIG1hcCdzIHRvdGFsIGNvdW50ZXIgdmFsdWUuXG4gIGxldCB0b3RhbFN0eWxpbmdFbnRyaWVzID0gdG90YWxWYWx1ZXM7XG4gIGZvciAobGV0IGkgPSBNYXBCYXNlZE9mZnNldFZhbHVlc0luZGV4LlZhbHVlc1N0YXJ0UG9zaXRpb247IGkgPCBpbmRleDtcbiAgICAgICBpICs9IE1hcEJhc2VkT2Zmc2V0VmFsdWVzSW5kZXguU2l6ZSkge1xuICAgIHRvdGFsU3R5bGluZ0VudHJpZXMgKz0gdmFsdWVzW2kgKyBNYXBCYXNlZE9mZnNldFZhbHVlc0luZGV4LlZhbHVlQ291bnRPZmZzZXRdO1xuICB9XG5cbiAgLy8gYmVjYXVzZSBzdHlsZSB2YWx1ZXMgY29tZSBiZWZvcmUgY2xhc3MgdmFsdWVzIGluIHRoZSBjb250ZXh0IHRoaXMgbWVhbnNcbiAgLy8gdGhhdCBpZiBhbnkgbmV3IHZhbHVlcyB3ZXJlIGluc2VydGVkIHRoZW4gdGhlIGNhY2hlIHZhbHVlcyBhcnJheSBmb3JcbiAgLy8gY2xhc3NlcyBpcyBvdXQgb2Ygc3luYy4gVGhlIGNvZGUgYmVsb3cgd2lsbCB1cGRhdGUgdGhlIG9mZnNldHMgdG8gcG9pbnRcbiAgLy8gdG8gdGhlaXIgbmV3IHZhbHVlcy5cbiAgaWYgKCFlbnRyeUlzQ2xhc3NCYXNlZCkge1xuICAgIGNvbnN0IGNsYXNzQ2FjaGUgPSBjb250ZXh0W1N0eWxpbmdJbmRleC5DYWNoZWRNdWx0aUNsYXNzZXNdO1xuICAgIGNvbnN0IGNsYXNzZXNTdGFydFBvc2l0aW9uID0gY2xhc3NDYWNoZVxuICAgICAgICBbTWFwQmFzZWRPZmZzZXRWYWx1ZXNJbmRleC5WYWx1ZXNTdGFydFBvc2l0aW9uICtcbiAgICAgICAgIE1hcEJhc2VkT2Zmc2V0VmFsdWVzSW5kZXguUG9zaXRpb25TdGFydE9mZnNldF07XG4gICAgY29uc3QgZGlmZkluU3RhcnRQb3NpdGlvbiA9IGVuZFBvc2l0aW9uIC0gY2xhc3Nlc1N0YXJ0UG9zaXRpb247XG4gICAgZm9yIChsZXQgaSA9IE1hcEJhc2VkT2Zmc2V0VmFsdWVzSW5kZXguVmFsdWVzU3RhcnRQb3NpdGlvbjsgaSA8IGNsYXNzQ2FjaGUubGVuZ3RoO1xuICAgICAgICAgaSArPSBNYXBCYXNlZE9mZnNldFZhbHVlc0luZGV4LlNpemUpIHtcbiAgICAgIGNsYXNzQ2FjaGVbaSArIE1hcEJhc2VkT2Zmc2V0VmFsdWVzSW5kZXguUG9zaXRpb25TdGFydE9mZnNldF0gKz0gZGlmZkluU3RhcnRQb3NpdGlvbjtcbiAgICB9XG4gIH1cblxuICB2YWx1ZXNbTWFwQmFzZWRPZmZzZXRWYWx1ZXNJbmRleC5FbnRyaWVzQ291bnRQb3NpdGlvbl0gPSB0b3RhbFN0eWxpbmdFbnRyaWVzO1xufVxuXG5mdW5jdGlvbiBoeXBoZW5hdGVFbnRyaWVzKGVudHJpZXM6IHN0cmluZ1tdKTogc3RyaW5nW10ge1xuICBjb25zdCBuZXdFbnRyaWVzOiBzdHJpbmdbXSA9IFtdO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGVudHJpZXMubGVuZ3RoOyBpKyspIHtcbiAgICBuZXdFbnRyaWVzLnB1c2goaHlwaGVuYXRlKGVudHJpZXNbaV0pKTtcbiAgfVxuICByZXR1cm4gbmV3RW50cmllcztcbn1cblxuZnVuY3Rpb24gaHlwaGVuYXRlKHZhbHVlOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gdmFsdWUucmVwbGFjZShcbiAgICAgIC9bYS16XVtBLVpdL2csIG1hdGNoID0+IGAke21hdGNoLmNoYXJBdCgwKX0tJHttYXRjaC5jaGFyQXQoMSkudG9Mb3dlckNhc2UoKX1gKTtcbn1cblxuZnVuY3Rpb24gcmVnaXN0ZXJNdWx0aU1hcEVudHJ5KFxuICAgIGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBkaXJlY3RpdmVJbmRleDogbnVtYmVyLCBlbnRyeUlzQ2xhc3NCYXNlZDogYm9vbGVhbixcbiAgICBzdGFydFBvc2l0aW9uOiBudW1iZXIsIGNvdW50ID0gMCkge1xuICBjb25zdCBjYWNoZWRWYWx1ZXMgPVxuICAgICAgY29udGV4dFtlbnRyeUlzQ2xhc3NCYXNlZCA/IFN0eWxpbmdJbmRleC5DYWNoZWRNdWx0aUNsYXNzZXMgOiBTdHlsaW5nSW5kZXguQ2FjaGVkTXVsdGlTdHlsZXNdO1xuICBpZiAoZGlyZWN0aXZlSW5kZXggPiAwKSB7XG4gICAgY29uc3QgbGltaXQgPSBNYXBCYXNlZE9mZnNldFZhbHVlc0luZGV4LlZhbHVlc1N0YXJ0UG9zaXRpb24gK1xuICAgICAgICAoZGlyZWN0aXZlSW5kZXggKiBNYXBCYXNlZE9mZnNldFZhbHVlc0luZGV4LlNpemUpO1xuICAgIHdoaWxlIChjYWNoZWRWYWx1ZXMubGVuZ3RoIDwgbGltaXQpIHtcbiAgICAgIC8vIHRoaXMgbWVhbnMgdGhhdCBPTkxZIGRpcmVjdGl2ZSBjbGFzcyBzdHlsaW5nIChsaWtlIG5nQ2xhc3MpIHdhcyB1c2VkXG4gICAgICAvLyB0aGVyZWZvcmUgdGhlIHJvb3QgZGlyZWN0aXZlIHdpbGwgc3RpbGwgbmVlZCB0byBiZSBmaWxsZWQgaW4gYXMgd2VsbFxuICAgICAgLy8gYXMgYW55IG90aGVyIGRpcmVjdGl2ZSBzcGFjZXMgaW4gY2FzZSB0aGV5IG9ubHkgdXNlZCBzdGF0aWMgdmFsdWVzXG4gICAgICBjYWNoZWRWYWx1ZXMucHVzaCgwLCBzdGFydFBvc2l0aW9uLCBudWxsLCAwKTtcbiAgICB9XG4gIH1cbiAgY2FjaGVkVmFsdWVzLnB1c2goMCwgc3RhcnRQb3NpdGlvbiwgbnVsbCwgY291bnQpO1xufVxuXG4vKipcbiAqIEluc2VydHMgb3IgdXBkYXRlcyBhbiBleGlzdGluZyBlbnRyeSBpbiB0aGUgcHJvdmlkZWQgYHN0YXRpY1N0eWxlc2AgY29sbGVjdGlvbi5cbiAqXG4gKiBAcGFyYW0gaW5kZXggdGhlIGluZGV4IHJlcHJlc2VudGluZyBhbiBleGlzdGluZyBzdHlsaW5nIGVudHJ5IGluIHRoZSBjb2xsZWN0aW9uOlxuICogIGlmIHByb3ZpZGVkIChudW1lcmljKTogdGhlbiBpdCB3aWxsIHVwZGF0ZSB0aGUgZXhpc3RpbmcgZW50cnkgYXQgdGhlIGdpdmVuIHBvc2l0aW9uXG4gKiAgaWYgbnVsbDogdGhlbiBpdCB3aWxsIGluc2VydCBhIG5ldyBlbnRyeSB3aXRoaW4gdGhlIGNvbGxlY3Rpb25cbiAqIEBwYXJhbSBzdGF0aWNTdHlsZXMgYSBjb2xsZWN0aW9uIG9mIHN0eWxlIG9yIGNsYXNzIGVudHJpZXMgd2hlcmUgdGhlIHZhbHVlIHdpbGxcbiAqICBiZSBpbnNlcnRlZCBvciBwYXRjaGVkXG4gKiBAcGFyYW0gcHJvcCB0aGUgcHJvcGVydHkgdmFsdWUgb2YgdGhlIGVudHJ5IChlLmcuIGB3aWR0aGAgKHN0eWxlcykgb3IgYGZvb2AgKGNsYXNzZXMpKVxuICogQHBhcmFtIHZhbHVlIHRoZSBzdHlsaW5nIHZhbHVlIG9mIHRoZSBlbnRyeSAoZS5nLiBgYWJzb2x1dGVgIChzdHlsZXMpIG9yIGB0cnVlYCAoY2xhc3NlcykpXG4gKiBAcGFyYW0gZGlyZWN0aXZlT3duZXJJbmRleCB0aGUgZGlyZWN0aXZlIG93bmVyIGluZGV4IHZhbHVlIG9mIHRoZSBzdHlsaW5nIHNvdXJjZSByZXNwb25zaWJsZVxuICogICAgICAgIGZvciB0aGVzZSBzdHlsZXMgKHNlZSBgaW50ZXJmYWNlcy9zdHlsaW5nLnRzI2RpcmVjdGl2ZXNgIGZvciBtb3JlIGluZm8pXG4gKiBAcmV0dXJucyB0aGUgaW5kZXggb2YgdGhlIHVwZGF0ZWQgb3IgbmV3IGVudHJ5IHdpdGhpbiB0aGUgY29sbGVjdGlvblxuICovXG5mdW5jdGlvbiBhZGRPclVwZGF0ZVN0YXRpY1N0eWxlKFxuICAgIGluZGV4OiBudW1iZXIgfCBudWxsLCBzdGF0aWNTdHlsZXM6IEluaXRpYWxTdHlsaW5nVmFsdWVzLCBwcm9wOiBzdHJpbmcsXG4gICAgdmFsdWU6IHN0cmluZyB8IGJvb2xlYW4gfCBudWxsLCBkaXJlY3RpdmVPd25lckluZGV4OiBudW1iZXIpIHtcbiAgaWYgKGluZGV4ID09PSBudWxsKSB7XG4gICAgaW5kZXggPSBzdGF0aWNTdHlsZXMubGVuZ3RoO1xuICAgIHN0YXRpY1N0eWxlcy5wdXNoKG51bGwsIG51bGwsIG51bGwpO1xuICAgIHN0YXRpY1N0eWxlc1tpbmRleCArIEluaXRpYWxTdHlsaW5nVmFsdWVzSW5kZXguUHJvcE9mZnNldF0gPSBwcm9wO1xuICB9XG4gIHN0YXRpY1N0eWxlc1tpbmRleCArIEluaXRpYWxTdHlsaW5nVmFsdWVzSW5kZXguVmFsdWVPZmZzZXRdID0gdmFsdWU7XG4gIHN0YXRpY1N0eWxlc1tpbmRleCArIEluaXRpYWxTdHlsaW5nVmFsdWVzSW5kZXguRGlyZWN0aXZlT3duZXJPZmZzZXRdID0gZGlyZWN0aXZlT3duZXJJbmRleDtcbiAgcmV0dXJuIGluZGV4O1xufVxuIl19