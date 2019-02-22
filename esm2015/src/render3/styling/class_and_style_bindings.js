/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
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
 * @param {?} attrs
 * @return {?}
 */
export function initializeStaticContext(attrs) {
    /** @type {?} */
    const context = createEmptyStylingContext();
    /** @type {?} */
    const initialClasses = context[3 /* InitialClassValuesPosition */] =
        [null, null];
    /** @type {?} */
    const initialStyles = context[2 /* InitialStyleValuesPosition */] =
        [null, null];
    // The attributes array has marker values (numbers) indicating what the subsequent
    // values represent. When we encounter a number, we set the mode to that type of attribute.
    /** @type {?} */
    let mode = -1;
    for (let i = 0; i < attrs.length; i++) {
        /** @type {?} */
        const attr = attrs[i];
        if (typeof attr == 'number') {
            mode = attr;
        }
        else if (mode === 2 /* Styles */) {
            initialStyles.push((/** @type {?} */ (attr)), (/** @type {?} */ (attrs[++i])));
        }
        else if (mode === 1 /* Classes */) {
            initialClasses.push((/** @type {?} */ (attr)), true);
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
 * @param {?} context the existing styling context
 * @param {?} attrs an array of new static styling attributes that will be
 *              assigned to the context
 * @param {?} startingIndex
 * @param {?} directiveRef the directive instance with which static data is associated with.
 * @return {?}
 */
export function patchContextWithStaticAttrs(context, attrs, startingIndex, directiveRef) {
    // If the styling context has already been patched with the given directive's bindings,
    // then there is no point in doing it again. The reason why this may happen (the directive
    // styling being patched twice) is because the `stylingBinding` function is called each time
    // an element is created (both within a template function and within directive host bindings).
    /** @type {?} */
    const directives = context[1 /* DirectiveRegistryPosition */];
    if (getDirectiveRegistryValuesIndexOf(directives, directiveRef) == -1) {
        // this is a new directive which we have not seen yet.
        allocateDirectiveIntoContext(context, directiveRef);
        /** @type {?} */
        let initialClasses = null;
        /** @type {?} */
        let initialStyles = null;
        /** @type {?} */
        let mode = -1;
        for (let i = startingIndex; i < attrs.length; i++) {
            /** @type {?} */
            const attr = attrs[i];
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
 * @param {?} initialStyling
 * @param {?} prop
 * @param {?} value
 * @return {?}
 */
function patchInitialStylingValue(initialStyling, prop, value) {
    // Even values are keys; Odd numbers are values; Search keys only
    for (let i = 2 /* KeyValueStartPosition */; i < initialStyling.length;) {
        /** @type {?} */
        const key = initialStyling[i];
        if (key === prop) {
            /** @type {?} */
            const existingValue = initialStyling[i + 1 /* ValueOffset */];
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
 * @param {?} element
 * @param {?} context
 * @param {?} renderer
 * @return {?}
 */
export function renderInitialStyles(element, context, renderer) {
    /** @type {?} */
    const initialStyles = context[2 /* InitialStyleValuesPosition */];
    renderInitialStylingValues(element, renderer, initialStyles, false);
}
/**
 * Runs through the initial class data present in the context and renders
 * them via the renderer on the element.
 * @param {?} element
 * @param {?} context
 * @param {?} renderer
 * @return {?}
 */
export function renderInitialClasses(element, context, renderer) {
    /** @type {?} */
    const initialClasses = context[3 /* InitialClassValuesPosition */];
    renderInitialStylingValues(element, renderer, initialClasses, true);
}
/**
 * This is a helper function designed to render each entry present within the
 * provided list of initialStylingValues.
 * @param {?} element
 * @param {?} renderer
 * @param {?} initialStylingValues
 * @param {?} isEntryClassBased
 * @return {?}
 */
function renderInitialStylingValues(element, renderer, initialStylingValues, isEntryClassBased) {
    for (let i = 2 /* KeyValueStartPosition */; i < initialStylingValues.length; i += 2 /* Size */) {
        /** @type {?} */
        const value = initialStylingValues[i + 1 /* ValueOffset */];
        if (value) {
            if (isEntryClassBased) {
                setClass(element, (/** @type {?} */ (initialStylingValues[i + 0 /* PropOffset */])), true, renderer, null);
            }
            else {
                setStyle(element, (/** @type {?} */ (initialStylingValues[i + 0 /* PropOffset */])), (/** @type {?} */ (value)), renderer, null);
            }
        }
    }
}
/**
 * @param {?} context
 * @return {?}
 */
export function allowNewBindingsForStylingContext(context) {
    return (context[0 /* MasterFlagPosition */] & 16 /* BindingAllocationLocked */) === 0;
}
/**
 * Adds in new binding values to a styling context.
 *
 * If a directive value is provided then all provided class/style binding names will
 * reference the provided directive.
 *
 * @param {?} context the existing styling context
 * @param {?} directiveRef the directive that the new bindings will reference
 * @param {?=} classBindingNames an array of class binding names that will be added to the context
 * @param {?=} styleBindingNames an array of style binding names that will be added to the context
 * @param {?=} styleSanitizer an optional sanitizer that handle all sanitization on for each of
 *    the bindings added to the context. Note that if a directive is provided then the sanitizer
 *    instance will only be active if and when the directive updates the bindings that it owns.
 * @return {?}
 */
export function updateContextWithBindings(context, directiveRef, classBindingNames, styleBindingNames, styleSanitizer) {
    if (context[0 /* MasterFlagPosition */] & 16 /* BindingAllocationLocked */)
        return;
    // this means the context has already been patched with the directive's bindings
    /** @type {?} */
    const directiveIndex = findOrPatchDirectiveIntoRegistry(context, directiveRef, styleSanitizer);
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
    /** @type {?} */
    const singlePropOffsetValues = context[4 /* SinglePropOffsetPositions */];
    /** @type {?} */
    const totalCurrentClassBindings = singlePropOffsetValues[1 /* ClassesCountPosition */];
    /** @type {?} */
    const totalCurrentStyleBindings = singlePropOffsetValues[0 /* StylesCountPosition */];
    /** @type {?} */
    const cachedClassMapValues = context[6 /* CachedMultiClasses */];
    /** @type {?} */
    const cachedStyleMapValues = context[7 /* CachedMultiStyles */];
    /** @type {?} */
    const classesOffset = totalCurrentClassBindings * 4 /* Size */;
    /** @type {?} */
    const stylesOffset = totalCurrentStyleBindings * 4 /* Size */;
    /** @type {?} */
    const singleStylesStartIndex = 9 /* SingleStylesStartPosition */;
    /** @type {?} */
    let singleClassesStartIndex = singleStylesStartIndex + stylesOffset;
    /** @type {?} */
    let multiStylesStartIndex = singleClassesStartIndex + classesOffset;
    /** @type {?} */
    let multiClassesStartIndex = multiStylesStartIndex + stylesOffset;
    // because we're inserting more bindings into the context, this means that the
    // binding values need to be referenced the singlePropOffsetValues array so that
    // the template/directive can easily find them inside of the `elementStyleProp`
    // and the `elementClassProp` functions without iterating through the entire context.
    // The first step to setting up these reference points is to mark how many bindings
    // are being added. Even if these bindings already exist in the context, the directive
    // or template code will still call them unknowingly. Therefore the total values need
    // to be registered so that we know how many bindings are assigned to each directive.
    /** @type {?} */
    const currentSinglePropsLength = singlePropOffsetValues.length;
    singlePropOffsetValues.push(styleBindingNames ? styleBindingNames.length : 0, classBindingNames ? classBindingNames.length : 0);
    // the code below will check to see if a new style binding already exists in the context
    // if so then there is no point in inserting it into the context again. Whether or not it
    // exists the styling offset code will now know exactly where it is
    /** @type {?} */
    let insertionOffset = 0;
    /** @type {?} */
    const filteredStyleBindingNames = [];
    if (styleBindingNames && styleBindingNames.length) {
        for (let i = 0; i < styleBindingNames.length; i++) {
            /** @type {?} */
            const name = styleBindingNames[i];
            /** @type {?} */
            let singlePropIndex = getMatchingBindingIndex(context, name, singleStylesStartIndex, singleClassesStartIndex);
            if (singlePropIndex == -1) {
                singlePropIndex = singleClassesStartIndex + insertionOffset;
                insertionOffset += 4 /* Size */;
                filteredStyleBindingNames.push(name);
            }
            singlePropOffsetValues.push(singlePropIndex);
        }
    }
    // just like with the style binding loop above, the new class bindings get the same treatment...
    /** @type {?} */
    const filteredClassBindingNames = [];
    if (classBindingNames && classBindingNames.length) {
        for (let i = 0; i < classBindingNames.length; i++) {
            /** @type {?} */
            const name = classBindingNames[i];
            /** @type {?} */
            let singlePropIndex = getMatchingBindingIndex(context, name, singleClassesStartIndex, multiStylesStartIndex);
            if (singlePropIndex == -1) {
                singlePropIndex = multiStylesStartIndex + insertionOffset;
                insertionOffset += 4 /* Size */;
                filteredClassBindingNames.push(name);
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
    /** @type {?} */
    let i = 2 /* ValueStartPosition */;
    if (filteredStyleBindingNames.length) {
        while (i < currentSinglePropsLength) {
            /** @type {?} */
            const totalStyles = singlePropOffsetValues[i + 0 /* StylesCountPosition */];
            /** @type {?} */
            const totalClasses = singlePropOffsetValues[i + 1 /* ClassesCountPosition */];
            if (totalClasses) {
                /** @type {?} */
                const start = i + 2 /* ValueStartPosition */ + totalStyles;
                for (let j = start; j < start + totalClasses; j++) {
                    singlePropOffsetValues[j] += filteredStyleBindingNames.length * 4 /* Size */;
                }
            }
            /** @type {?} */
            const total = totalStyles + totalClasses;
            i += 2 /* ValueStartPosition */ + total;
        }
    }
    /** @type {?} */
    const totalNewEntries = filteredClassBindingNames.length + filteredStyleBindingNames.length;
    // in the event that there are new style values being inserted, all existing class and style
    // bindings need to have their pointer values offsetted with the new amount of space that is
    // used for the new style/class bindings.
    for (let i = singleStylesStartIndex; i < context.length; i += 4 /* Size */) {
        /** @type {?} */
        const isMultiBased = i >= multiStylesStartIndex;
        /** @type {?} */
        const isClassBased = i >= (isMultiBased ? multiClassesStartIndex : singleClassesStartIndex);
        /** @type {?} */
        const flag = getPointers(context, i);
        /** @type {?} */
        const staticIndex = getInitialIndex(flag);
        /** @type {?} */
        let singleOrMultiIndex = getMultiOrSingleIndex(flag);
        if (isMultiBased) {
            singleOrMultiIndex +=
                isClassBased ? (filteredStyleBindingNames.length * 4 /* Size */) : 0;
        }
        else {
            singleOrMultiIndex += (totalNewEntries * 4 /* Size */) +
                ((isClassBased ? filteredStyleBindingNames.length : 0) * 4 /* Size */);
        }
        setFlag(context, i, pointers(flag, staticIndex, singleOrMultiIndex));
    }
    // this is where we make space in the context for the new style bindings
    for (let i = 0; i < filteredStyleBindingNames.length * 4 /* Size */; i++) {
        context.splice(multiClassesStartIndex, 0, null);
        context.splice(singleClassesStartIndex, 0, null);
        singleClassesStartIndex++;
        multiStylesStartIndex++;
        multiClassesStartIndex += 2; // both single + multi slots were inserted
    }
    // this is where we make space in the context for the new class bindings
    for (let i = 0; i < filteredClassBindingNames.length * 4 /* Size */; i++) {
        context.splice(multiStylesStartIndex, 0, null);
        context.push(null);
        multiStylesStartIndex++;
        multiClassesStartIndex++;
    }
    /** @type {?} */
    const initialClasses = context[3 /* InitialClassValuesPosition */];
    /** @type {?} */
    const initialStyles = context[2 /* InitialStyleValuesPosition */];
    // the code below will insert each new entry into the context and assign the appropriate
    // flags and index values to them. It's important this runs at the end of this function
    // because the context, property offset and index values have all been computed just before.
    for (let i = 0; i < totalNewEntries; i++) {
        /** @type {?} */
        const entryIsClassBased = i >= filteredStyleBindingNames.length;
        /** @type {?} */
        const adjustedIndex = entryIsClassBased ? (i - filteredStyleBindingNames.length) : i;
        /** @type {?} */
        const propName = entryIsClassBased ? filteredClassBindingNames[adjustedIndex] :
            filteredStyleBindingNames[adjustedIndex];
        /** @type {?} */
        let multiIndex;
        /** @type {?} */
        let singleIndex;
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
        /** @type {?} */
        let initialValuesToLookup = entryIsClassBased ? initialClasses : initialStyles;
        /** @type {?} */
        let indexForInitial = getInitialStylingValuesIndexOf(initialValuesToLookup, propName);
        if (indexForInitial === -1) {
            indexForInitial = initialValuesToLookup.length + 1 /* ValueOffset */;
            initialValuesToLookup.push(propName, entryIsClassBased ? false : null);
        }
        else {
            indexForInitial += 1 /* ValueOffset */;
        }
        /** @type {?} */
        const initialFlag = prepareInitialFlag(context, propName, entryIsClassBased, styleSanitizer || null);
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
    /** @type {?} */
    const newStylesSpaceAllocationSize = filteredStyleBindingNames.length * 4 /* Size */;
    /** @type {?} */
    const newClassesSpaceAllocationSize = filteredClassBindingNames.length * 4 /* Size */;
    // update the multi styles cache with a reference for the directive that was just inserted
    /** @type {?} */
    const directiveMultiStylesStartIndex = multiStylesStartIndex + totalCurrentStyleBindings * 4 /* Size */;
    /** @type {?} */
    const cachedStyleMapIndex = cachedStyleMapValues.length;
    registerMultiMapEntry(context, directiveIndex, false, directiveMultiStylesStartIndex, filteredStyleBindingNames.length);
    for (let i = 1 /* ValuesStartPosition */; i < cachedStyleMapIndex; i += 4 /* Size */) {
        // multi values start after all the single values (which is also where classes are) in the
        // context therefore the new class allocation size should be taken into account
        cachedStyleMapValues[i + 1 /* PositionStartOffset */] +=
            newClassesSpaceAllocationSize + newStylesSpaceAllocationSize;
    }
    // update the multi classes cache with a reference for the directive that was just inserted
    /** @type {?} */
    const directiveMultiClassesStartIndex = multiClassesStartIndex + totalCurrentClassBindings * 4 /* Size */;
    /** @type {?} */
    const cachedClassMapIndex = cachedClassMapValues.length;
    registerMultiMapEntry(context, directiveIndex, true, directiveMultiClassesStartIndex, filteredClassBindingNames.length);
    for (let i = 1 /* ValuesStartPosition */; i < cachedClassMapIndex; i += 4 /* Size */) {
        // the reason why both the styles + classes space is allocated to the existing offsets is
        // because the styles show up before the classes in the context and any new inserted
        // styles will offset any existing class entries in the context (even if there are no
        // new class entries added) also the reason why it's *2 is because both single + multi
        // entries for each new style have been added in the context before the multi class values
        // actually start
        cachedClassMapValues[i + 1 /* PositionStartOffset */] +=
            (newStylesSpaceAllocationSize * 2) + newClassesSpaceAllocationSize;
    }
    // there is no initial value flag for the master index since it doesn't
    // reference an initial style value
    /** @type {?} */
    const masterFlag = pointers(0, 0, multiStylesStartIndex);
    setFlag(context, 0 /* MasterFlagPosition */, masterFlag);
}
/**
 * Searches through the existing registry of directives
 * @param {?} context
 * @param {?} directiveRef
 * @param {?=} styleSanitizer
 * @return {?}
 */
export function findOrPatchDirectiveIntoRegistry(context, directiveRef, styleSanitizer) {
    /** @type {?} */
    const directiveRefs = context[1 /* DirectiveRegistryPosition */];
    /** @type {?} */
    const nextOffsetInsertionIndex = context[4 /* SinglePropOffsetPositions */].length;
    /** @type {?} */
    let directiveIndex;
    /** @type {?} */
    let detectedIndex = getDirectiveRegistryValuesIndexOf(directiveRefs, directiveRef);
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
        /** @type {?} */
        const singlePropStartPosition = detectedIndex + 1 /* SinglePropValuesIndexOffset */;
        if ((/** @type {?} */ (directiveRefs[singlePropStartPosition])) >= 0) {
            // the directive has already been patched into the context
            return -1;
        }
        directiveIndex = detectedIndex / 4 /* Size */;
        // because the directive already existed this means that it was set during elementHostAttrs or
        // elementStart which means that the binding values were not here. Therefore, the values below
        // need to be applied so that single class and style properties can be assigned later.
        /** @type {?} */
        const singlePropPositionIndex = detectedIndex + 1 /* SinglePropValuesIndexOffset */;
        directiveRefs[singlePropPositionIndex] = nextOffsetInsertionIndex;
        // the sanitizer is also apart of the binding process and will be used when bindings are
        // applied.
        /** @type {?} */
        const styleSanitizerIndex = detectedIndex + 3 /* StyleSanitizerOffset */;
        directiveRefs[styleSanitizerIndex] = styleSanitizer || null;
    }
    return directiveIndex;
}
/**
 * @param {?} context
 * @param {?} bindingName
 * @param {?} start
 * @param {?} end
 * @return {?}
 */
function getMatchingBindingIndex(context, bindingName, start, end) {
    for (let j = start; j < end; j += 4 /* Size */) {
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
 * @param {?} context The styling context that will be updated with the
 *    newly provided style values.
 * @param {?} classesInput The key/value map of CSS class names that will be used for the update.
 * @param {?=} stylesInput The key/value map of CSS styles that will be used for the update.
 * @param {?=} directiveRef an optional reference to the directive responsible
 *    for this binding change. If present then style binding will only
 *    actualize if the directive has ownership over this binding
 *    (see styling.ts#directives for more information about the algorithm).
 * @return {?}
 */
export function updateStylingMap(context, classesInput, stylesInput, directiveRef) {
    /** @type {?} */
    const directiveIndex = getDirectiveIndexFromRegistry(context, directiveRef || null);
    classesInput = classesInput || null;
    stylesInput = stylesInput || null;
    /** @type {?} */
    const ignoreAllClassUpdates = isMultiValueCacheHit(context, true, directiveIndex, classesInput);
    /** @type {?} */
    const ignoreAllStyleUpdates = isMultiValueCacheHit(context, false, directiveIndex, stylesInput);
    // early exit (this is what's done to avoid using ctx.bind() to cache the value)
    if (ignoreAllClassUpdates && ignoreAllStyleUpdates)
        return;
    classesInput =
        classesInput === NO_CHANGE ? readCachedMapValue(context, true, directiveIndex) : classesInput;
    stylesInput =
        stylesInput === NO_CHANGE ? readCachedMapValue(context, false, directiveIndex) : stylesInput;
    /** @type {?} */
    const element = (/** @type {?} */ ((/** @type {?} */ (context[5 /* ElementPosition */]))));
    /** @type {?} */
    const classesPlayerBuilder = classesInput instanceof BoundPlayerFactory ?
        new ClassAndStylePlayerBuilder((/** @type {?} */ (classesInput)), element, 1 /* Class */) :
        null;
    /** @type {?} */
    const stylesPlayerBuilder = stylesInput instanceof BoundPlayerFactory ?
        new ClassAndStylePlayerBuilder((/** @type {?} */ (stylesInput)), element, 2 /* Style */) :
        null;
    /** @type {?} */
    const classesValue = classesPlayerBuilder ?
        (/** @type {?} */ (((/** @type {?} */ (classesInput))))).value :
        classesInput;
    /** @type {?} */
    const stylesValue = stylesPlayerBuilder ? (/** @type {?} */ (stylesInput)).value : stylesInput;
    /** @type {?} */
    let classNames = EMPTY_ARRAY;
    /** @type {?} */
    let applyAllClasses = false;
    /** @type {?} */
    let playerBuildersAreDirty = false;
    /** @type {?} */
    const classesPlayerBuilderIndex = classesPlayerBuilder ? 1 /* ClassMapPlayerBuilderPosition */ : 0;
    if (hasPlayerBuilderChanged(context, classesPlayerBuilder, 1 /* ClassMapPlayerBuilderPosition */)) {
        setPlayerBuilder(context, classesPlayerBuilder, 1 /* ClassMapPlayerBuilderPosition */);
        playerBuildersAreDirty = true;
    }
    /** @type {?} */
    const stylesPlayerBuilderIndex = stylesPlayerBuilder ? 3 /* StyleMapPlayerBuilderPosition */ : 0;
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
    /** @type {?} */
    const multiStylesStartIndex = getMultiStylesStartIndex(context);
    /** @type {?} */
    let multiClassesStartIndex = getMultiClassesStartIndex(context);
    /** @type {?} */
    let multiClassesEndIndex = context.length;
    if (!ignoreAllStyleUpdates) {
        /** @type {?} */
        const styleProps = stylesValue ? Object.keys(stylesValue) : EMPTY_ARRAY;
        /** @type {?} */
        const styles = stylesValue || EMPTY_OBJ;
        /** @type {?} */
        const totalNewEntries = patchStylingMapIntoContext(context, directiveIndex, stylesPlayerBuilderIndex, multiStylesStartIndex, multiClassesStartIndex, styleProps, styles, stylesInput, false);
        if (totalNewEntries) {
            multiClassesStartIndex += totalNewEntries * 4 /* Size */;
            multiClassesEndIndex += totalNewEntries * 4 /* Size */;
        }
    }
    if (!ignoreAllClassUpdates) {
        /** @type {?} */
        const classes = (/** @type {?} */ ((classesValue || EMPTY_OBJ)));
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
 * @param {?} context
 * @param {?} directiveIndex
 * @param {?} playerBuilderIndex
 * @param {?} ctxStart
 * @param {?} ctxEnd
 * @param {?} props
 * @param {?} values
 * @param {?} cacheValue
 * @param {?} entryIsClassBased
 * @return {?} the total amount of new slots that were allocated into the context due to new styling
 *          properties that were detected.
 */
function patchStylingMapIntoContext(context, directiveIndex, playerBuilderIndex, ctxStart, ctxEnd, props, values, cacheValue, entryIsClassBased) {
    /** @type {?} */
    let dirty = false;
    /** @type {?} */
    const cacheIndex = 1 /* ValuesStartPosition */ +
        directiveIndex * 4 /* Size */;
    // the cachedValues array is the registry of all multi style values (map values). Each
    // value is stored (cached) each time is updated.
    /** @type {?} */
    const cachedValues = context[entryIsClassBased ? 6 /* CachedMultiClasses */ : 7 /* CachedMultiStyles */];
    // this is the index in which this directive has ownership access to write to this
    // value (anything before is owned by a previous directive that is more important)
    /** @type {?} */
    const ownershipValuesStartIndex = cachedValues[cacheIndex + 1 /* PositionStartOffset */];
    /** @type {?} */
    const existingCachedValue = cachedValues[cacheIndex + 2 /* ValueOffset */];
    /** @type {?} */
    const existingCachedValueCount = cachedValues[cacheIndex + 3 /* ValueCountOffset */];
    /** @type {?} */
    const existingCachedValueIsDirty = cachedValues[cacheIndex + 0 /* DirtyFlagOffset */] === 1;
    // A shape change means the provided map value has either removed or added new properties
    // compared to what were in the last time. If a shape change occurs then it means that all
    // follow-up multi-styling entries are obsolete and will be examined again when CD runs
    // them. If a shape change has not occurred then there is no reason to check any other
    // directive values if their identity has not changed. If a previous directive set this
    // value as dirty (because its own shape changed) then this means that the object has been
    // offset to a different area in the context. Because its value has been offset then it
    // can't write to a region that it wrote to before (which may have been apart of another
    // directive) and therefore its shape changes too.
    /** @type {?} */
    let valuesEntryShapeChange = existingCachedValueIsDirty || ((!existingCachedValue && cacheValue) ? true : false);
    /** @type {?} */
    let totalUniqueValues = 0;
    /** @type {?} */
    let totalNewAllocatedSlots = 0;
    // this is a trick to avoid building {key:value} map where all the values
    // are `true` (this happens when a className string is provided instead of a
    // map as an input value to this styling algorithm)
    /** @type {?} */
    const applyAllProps = values === true;
    // STEP 1:
    // loop through the earlier directives and figure out if any properties here will be placed
    // in their area (this happens when the value is null because the earlier directive erased it).
    /** @type {?} */
    let ctxIndex = ctxStart;
    /** @type {?} */
    let totalRemainingProperties = props.length;
    while (ctxIndex < ownershipValuesStartIndex) {
        /** @type {?} */
        const currentProp = getProp(context, ctxIndex);
        if (totalRemainingProperties) {
            for (let i = 0; i < props.length; i++) {
                /** @type {?} */
                const mapProp = props[i];
                /** @type {?} */
                const normalizedProp = mapProp ? (entryIsClassBased ? mapProp : hyphenate(mapProp)) : null;
                if (normalizedProp && currentProp === normalizedProp) {
                    /** @type {?} */
                    const currentValue = getValue(context, ctxIndex);
                    /** @type {?} */
                    const currentDirectiveIndex = getDirectiveIndexFromEntry(context, ctxIndex);
                    /** @type {?} */
                    const value = applyAllProps ? true : ((/** @type {?} */ (values)))[normalizedProp];
                    /** @type {?} */
                    const currentFlag = getPointers(context, ctxIndex);
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
        /** @type {?} */
        const sanitizer = entryIsClassBased ? null : getStyleSanitizer(context, directiveIndex);
        propertiesLoop: for (let i = 0; i < props.length; i++) {
            /** @type {?} */
            const mapProp = props[i];
            if (!mapProp) {
                // this is an early exit incase a value was already encountered above in the
                // previous loop (which means that the property was applied or rejected)
                continue;
            }
            /** @type {?} */
            const value = applyAllProps ? true : ((/** @type {?} */ (values)))[mapProp];
            /** @type {?} */
            const normalizedProp = entryIsClassBased ? mapProp : hyphenate(mapProp);
            /** @type {?} */
            const isInsideOwnershipArea = ctxIndex >= ownershipValuesStartIndex;
            for (let j = ctxIndex; j < ctxEnd; j += 4 /* Size */) {
                /** @type {?} */
                const distantCtxProp = getProp(context, j);
                if (distantCtxProp === normalizedProp) {
                    /** @type {?} */
                    const distantCtxDirectiveIndex = getDirectiveIndexFromEntry(context, j);
                    /** @type {?} */
                    const distantCtxPlayerBuilderIndex = getPlayerBuilderIndex(context, j);
                    /** @type {?} */
                    const distantCtxValue = getValue(context, j);
                    /** @type {?} */
                    const distantCtxFlag = getPointers(context, j);
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
                /** @type {?} */
                const flag = prepareInitialFlag(context, normalizedProp, entryIsClassBased, sanitizer) |
                    1 /* Dirty */;
                /** @type {?} */
                const insertionIndex = isInsideOwnershipArea ?
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
        // some values are missing
        /** @type {?} */
        const ctxValue = getValue(context, ctxIndex);
        /** @type {?} */
        const ctxFlag = getPointers(context, ctxIndex);
        /** @type {?} */
        const ctxDirective = getDirectiveIndexFromEntry(context, ctxIndex);
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
 * @param {?} context The styling context that will be updated with the
 *    newly provided class value.
 * @param {?} offset The index of the CSS class which is being updated.
 * @param {?} input
 * @param {?=} directiveRef an optional reference to the directive responsible
 *    for this binding change. If present then style binding will only
 *    actualize if the directive has ownership over this binding
 *    (see styling.ts#directives for more information about the algorithm).
 * @param {?=} forceOverride whether or not to skip all directive prioritization
 *    and just apply the value regardless.
 * @return {?}
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
 * @param {?} context The styling context that will be updated with the
 *    newly provided style value.
 * @param {?} offset The index of the property which is being updated.
 * @param {?} input
 * @param {?=} directiveRef an optional reference to the directive responsible
 *    for this binding change. If present then style binding will only
 *    actualize if the directive has ownership over this binding
 *    (see styling.ts#directives for more information about the algorithm).
 * @param {?=} forceOverride whether or not to skip all directive prioritization
 *    and just apply the value regardless.
 * @return {?}
 */
export function updateStyleProp(context, offset, input, directiveRef, forceOverride) {
    updateSingleStylingValue(context, offset, input, false, directiveRef, forceOverride);
}
/**
 * @param {?} context
 * @param {?} offset
 * @param {?} input
 * @param {?} isClassBased
 * @param {?} directiveRef
 * @param {?=} forceOverride
 * @return {?}
 */
function updateSingleStylingValue(context, offset, input, isClassBased, directiveRef, forceOverride) {
    /** @type {?} */
    const directiveIndex = getDirectiveIndexFromRegistry(context, directiveRef || null);
    /** @type {?} */
    const singleIndex = getSinglePropIndexValue(context, directiveIndex, offset, isClassBased);
    /** @type {?} */
    const currValue = getValue(context, singleIndex);
    /** @type {?} */
    const currFlag = getPointers(context, singleIndex);
    /** @type {?} */
    const currDirective = getDirectiveIndexFromEntry(context, singleIndex);
    /** @type {?} */
    const value = (input instanceof BoundPlayerFactory) ? input.value : input;
    if (hasValueChanged(currFlag, currValue, value) &&
        (forceOverride || allowValueChange(currValue, value, currDirective, directiveIndex))) {
        /** @type {?} */
        const isClassBased = (currFlag & 2 /* Class */) === 2 /* Class */;
        /** @type {?} */
        const element = (/** @type {?} */ ((/** @type {?} */ (context[5 /* ElementPosition */]))));
        /** @type {?} */
        const playerBuilder = input instanceof BoundPlayerFactory ?
            new ClassAndStylePlayerBuilder((/** @type {?} */ (input)), element, isClassBased ? 1 /* Class */ : 2 /* Style */) :
            null;
        /** @type {?} */
        const value = (/** @type {?} */ ((playerBuilder ? ((/** @type {?} */ (input))).value : input)));
        /** @type {?} */
        const currPlayerIndex = getPlayerBuilderIndex(context, singleIndex);
        /** @type {?} */
        let playerBuildersAreDirty = false;
        /** @type {?} */
        let playerBuilderIndex = playerBuilder ? currPlayerIndex : 0;
        if (hasPlayerBuilderChanged(context, playerBuilder, currPlayerIndex)) {
            /** @type {?} */
            const newIndex = setPlayerBuilder(context, playerBuilder, currPlayerIndex);
            playerBuilderIndex = playerBuilder ? newIndex : 0;
            playerBuildersAreDirty = true;
        }
        if (playerBuildersAreDirty || currDirective !== directiveIndex) {
            setPlayerBuilderIndex(context, singleIndex, playerBuilderIndex, directiveIndex);
        }
        if (currDirective !== directiveIndex) {
            /** @type {?} */
            const prop = getProp(context, singleIndex);
            /** @type {?} */
            const sanitizer = getStyleSanitizer(context, directiveIndex);
            setSanitizeFlag(context, singleIndex, (sanitizer && sanitizer(prop)) ? true : false);
        }
        // the value will always get updated (even if the dirty flag is skipped)
        setValue(context, singleIndex, value);
        /** @type {?} */
        const indexForMulti = getMultiOrSingleIndex(currFlag);
        // if the value is the same in the multi-area then there's no point in re-assembling
        /** @type {?} */
        const valueForMulti = getValue(context, indexForMulti);
        if (!valueForMulti || hasValueChanged(currFlag, valueForMulti, value)) {
            /** @type {?} */
            let multiDirty = false;
            /** @type {?} */
            let singleDirty = true;
            // only when the value is set to `null` should the multi-value get flagged
            if (!valueExists(value, isClassBased) && valueExists(valueForMulti, isClassBased)) {
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
 * @param {?} context The styling context that will be used to determine
 *      what styles will be rendered
 * @param {?} renderer the renderer that will be used to apply the styling
 * @param {?} rootOrView
 * @param {?} isFirstRender
 * @param {?=} classesStore if provided, the updated class values will be applied
 *    to this key/value map instead of being renderered via the renderer.
 * @param {?=} stylesStore if provided, the updated style values will be applied
 *    to this key/value map instead of being renderered via the renderer.
 * @param {?=} directiveRef an optional directive that will be used to target which
 *    styling values are rendered. If left empty, only the bindings that are
 *    registered on the template will be rendered.
 * @return {?} number the total amount of players that got queued for animation (if any)
 */
export function renderStyling(context, renderer, rootOrView, isFirstRender, classesStore, stylesStore, directiveRef) {
    /** @type {?} */
    let totalPlayersQueued = 0;
    /** @type {?} */
    const targetDirectiveIndex = getDirectiveIndexFromRegistry(context, directiveRef || null);
    if (isContextDirty(context) && isDirectiveDirty(context, targetDirectiveIndex)) {
        /** @type {?} */
        const flushPlayerBuilders = context[0 /* MasterFlagPosition */] & 8 /* PlayerBuildersDirty */;
        /** @type {?} */
        const native = (/** @type {?} */ (context[5 /* ElementPosition */]));
        /** @type {?} */
        const multiStartIndex = getMultiStylesStartIndex(context);
        /** @type {?} */
        let stillDirty = false;
        for (let i = 9 /* SingleStylesStartPosition */; i < context.length; i += 4 /* Size */) {
            // there is no point in rendering styles that have not changed on screen
            if (isDirty(context, i)) {
                /** @type {?} */
                const flag = getPointers(context, i);
                /** @type {?} */
                const directiveIndex = getDirectiveIndexFromEntry(context, i);
                if (targetDirectiveIndex !== directiveIndex) {
                    stillDirty = true;
                    continue;
                }
                /** @type {?} */
                const prop = getProp(context, i);
                /** @type {?} */
                const value = getValue(context, i);
                /** @type {?} */
                const styleSanitizer = (flag & 4 /* Sanitize */) ? getStyleSanitizer(context, directiveIndex) : null;
                /** @type {?} */
                const playerBuilder = getPlayerBuilder(context, i);
                /** @type {?} */
                const isClassBased = flag & 2 /* Class */ ? true : false;
                /** @type {?} */
                const isInSingleRegion = i < multiStartIndex;
                /** @type {?} */
                let valueToApply = value;
                // VALUE DEFER CASE 1: Use a multi value instead of a null single value
                // this check implies that a single value was removed and we
                // should now defer to a multi value and use that (if set).
                if (isInSingleRegion && !valueExists(valueToApply, isClassBased)) {
                    // single values ALWAYS have a reference to a multi index
                    /** @type {?} */
                    const multiIndex = getMultiOrSingleIndex(flag);
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
                /** @type {?} */
                const doApplyValue = isFirstRender ? valueToApply : true;
                if (doApplyValue) {
                    if (isClassBased) {
                        setClass(native, prop, valueToApply ? true : false, renderer, classesStore, playerBuilder);
                    }
                    else {
                        setStyle(native, prop, (/** @type {?} */ (valueToApply)), renderer, styleSanitizer, stylesStore, playerBuilder);
                    }
                }
                setDirty(context, i, false);
            }
        }
        if (flushPlayerBuilders) {
            /** @type {?} */
            const rootContext = Array.isArray(rootOrView) ? getRootContext(rootOrView) : (/** @type {?} */ (rootOrView));
            /** @type {?} */
            const playerContext = (/** @type {?} */ (getPlayerContext(context)));
            /** @type {?} */
            const playersStartIndex = playerContext[0 /* NonBuilderPlayersStart */];
            for (let i = 1 /* PlayerBuildersStartPosition */; i < playersStartIndex; i += 2 /* PlayerAndPlayerBuildersTupleSize */) {
                /** @type {?} */
                const builder = (/** @type {?} */ (playerContext[i]));
                /** @type {?} */
                const playerInsertionIndex = i + 1 /* PlayerOffsetPosition */;
                /** @type {?} */
                const oldPlayer = (/** @type {?} */ (playerContext[playerInsertionIndex]));
                if (builder) {
                    /** @type {?} */
                    const player = builder.buildPlayer(oldPlayer, isFirstRender);
                    if (player !== undefined) {
                        if (player != null) {
                            /** @type {?} */
                            const wasQueued = addPlayerInternal(playerContext, rootContext, (/** @type {?} */ (native)), player, playerInsertionIndex);
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
 * @param {?} native the DOM Element
 * @param {?} prop the CSS style property that will be rendered
 * @param {?} value the CSS style value that will be rendered
 * @param {?} renderer
 * @param {?} sanitizer
 * @param {?=} store an optional key/value map that will be used as a context to render styles on
 * @param {?=} playerBuilder
 * @return {?}
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
 * @param {?} native the DOM Element
 * @param {?} className
 * @param {?} add
 * @param {?} renderer
 * @param {?=} store an optional key/value map that will be used as a context to render styles on
 * @param {?=} playerBuilder
 * @return {?}
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
/**
 * @param {?} context
 * @param {?} index
 * @param {?} sanitizeYes
 * @return {?}
 */
function setSanitizeFlag(context, index, sanitizeYes) {
    if (sanitizeYes) {
        ((/** @type {?} */ (context[index]))) |= 4 /* Sanitize */;
    }
    else {
        ((/** @type {?} */ (context[index]))) &= ~4 /* Sanitize */;
    }
}
/**
 * @param {?} context
 * @param {?} index
 * @param {?} isDirtyYes
 * @return {?}
 */
function setDirty(context, index, isDirtyYes) {
    /** @type {?} */
    const adjustedIndex = index >= 9 /* SingleStylesStartPosition */ ? (index + 0 /* FlagsOffset */) : index;
    if (isDirtyYes) {
        ((/** @type {?} */ (context[adjustedIndex]))) |= 1 /* Dirty */;
    }
    else {
        ((/** @type {?} */ (context[adjustedIndex]))) &= ~1 /* Dirty */;
    }
}
/**
 * @param {?} context
 * @param {?} index
 * @return {?}
 */
function isDirty(context, index) {
    /** @type {?} */
    const adjustedIndex = index >= 9 /* SingleStylesStartPosition */ ? (index + 0 /* FlagsOffset */) : index;
    return (((/** @type {?} */ (context[adjustedIndex]))) & 1 /* Dirty */) == 1 /* Dirty */;
}
/**
 * @param {?} context
 * @param {?} index
 * @return {?}
 */
export function isClassBasedValue(context, index) {
    /** @type {?} */
    const adjustedIndex = index >= 9 /* SingleStylesStartPosition */ ? (index + 0 /* FlagsOffset */) : index;
    return (((/** @type {?} */ (context[adjustedIndex]))) & 2 /* Class */) == 2 /* Class */;
}
/**
 * @param {?} context
 * @param {?} index
 * @return {?}
 */
function isSanitizable(context, index) {
    /** @type {?} */
    const adjustedIndex = index >= 9 /* SingleStylesStartPosition */ ? (index + 0 /* FlagsOffset */) : index;
    return (((/** @type {?} */ (context[adjustedIndex]))) & 4 /* Sanitize */) == 4 /* Sanitize */;
}
/**
 * @param {?} configFlag
 * @param {?} staticIndex
 * @param {?} dynamicIndex
 * @return {?}
 */
function pointers(configFlag, staticIndex, dynamicIndex) {
    return (configFlag & 31 /* BitMask */) | (staticIndex << 5 /* BitCountSize */) |
        (dynamicIndex << (14 /* BitCountSize */ + 5 /* BitCountSize */));
}
/**
 * @param {?} context
 * @param {?} flag
 * @return {?}
 */
function getInitialValue(context, flag) {
    /** @type {?} */
    const index = getInitialIndex(flag);
    /** @type {?} */
    const entryIsClassBased = flag & 2 /* Class */;
    /** @type {?} */
    const initialValues = entryIsClassBased ? context[3 /* InitialClassValuesPosition */] :
        context[2 /* InitialStyleValuesPosition */];
    return initialValues[index];
}
/**
 * @param {?} flag
 * @return {?}
 */
function getInitialIndex(flag) {
    return (flag >> 5 /* BitCountSize */) & 16383 /* BitMask */;
}
/**
 * @param {?} flag
 * @return {?}
 */
function getMultiOrSingleIndex(flag) {
    /** @type {?} */
    const index = (flag >> (14 /* BitCountSize */ + 5 /* BitCountSize */)) & 16383 /* BitMask */;
    return index >= 9 /* SingleStylesStartPosition */ ? index : -1;
}
/**
 * @param {?} context
 * @return {?}
 */
function getMultiStartIndex(context) {
    return (/** @type {?} */ (getMultiOrSingleIndex(context[0 /* MasterFlagPosition */])));
}
/**
 * @param {?} context
 * @return {?}
 */
function getMultiClassesStartIndex(context) {
    /** @type {?} */
    const classCache = context[6 /* CachedMultiClasses */];
    return classCache[1 /* ValuesStartPosition */ +
        1 /* PositionStartOffset */];
}
/**
 * @param {?} context
 * @return {?}
 */
function getMultiStylesStartIndex(context) {
    /** @type {?} */
    const stylesCache = context[7 /* CachedMultiStyles */];
    return stylesCache[1 /* ValuesStartPosition */ +
        1 /* PositionStartOffset */];
}
/**
 * @param {?} context
 * @param {?} index
 * @param {?} prop
 * @return {?}
 */
function setProp(context, index, prop) {
    context[index + 1 /* PropertyOffset */] = prop;
}
/**
 * @param {?} context
 * @param {?} index
 * @param {?} value
 * @return {?}
 */
function setValue(context, index, value) {
    context[index + 2 /* ValueOffset */] = value;
}
/**
 * @param {?} context
 * @param {?} builder
 * @param {?} index
 * @return {?}
 */
function hasPlayerBuilderChanged(context, builder, index) {
    /** @type {?} */
    const playerContext = (/** @type {?} */ (context[8 /* PlayerContext */]));
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
/**
 * @param {?} context
 * @param {?} builder
 * @param {?} insertionIndex
 * @return {?}
 */
function setPlayerBuilder(context, builder, insertionIndex) {
    /** @type {?} */
    let playerContext = context[8 /* PlayerContext */] || allocPlayerContext(context);
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
/**
 * @param {?} directiveIndex
 * @param {?} playerIndex
 * @return {?}
 */
export function directiveOwnerPointers(directiveIndex, playerIndex) {
    return (playerIndex << 16 /* BitCountSize */) | directiveIndex;
}
/**
 * @param {?} context
 * @param {?} index
 * @param {?} playerBuilderIndex
 * @param {?} directiveIndex
 * @return {?}
 */
function setPlayerBuilderIndex(context, index, playerBuilderIndex, directiveIndex) {
    /** @type {?} */
    const value = directiveOwnerPointers(directiveIndex, playerBuilderIndex);
    context[index + 3 /* PlayerBuilderIndexOffset */] = value;
}
/**
 * @param {?} context
 * @param {?} index
 * @return {?}
 */
function getPlayerBuilderIndex(context, index) {
    /** @type {?} */
    const flag = (/** @type {?} */ (context[index + 3 /* PlayerBuilderIndexOffset */]));
    /** @type {?} */
    const playerBuilderIndex = (flag >> 16 /* BitCountSize */) &
        65535 /* BitMask */;
    return playerBuilderIndex;
}
/**
 * @param {?} context
 * @param {?} index
 * @return {?}
 */
function getPlayerBuilder(context, index) {
    /** @type {?} */
    const playerBuilderIndex = getPlayerBuilderIndex(context, index);
    if (playerBuilderIndex) {
        /** @type {?} */
        const playerContext = context[8 /* PlayerContext */];
        if (playerContext) {
            return (/** @type {?} */ (playerContext[playerBuilderIndex]));
        }
    }
    return null;
}
/**
 * @param {?} context
 * @param {?} index
 * @param {?} flag
 * @return {?}
 */
function setFlag(context, index, flag) {
    /** @type {?} */
    const adjustedIndex = index === 0 /* MasterFlagPosition */ ? index : (index + 0 /* FlagsOffset */);
    context[adjustedIndex] = flag;
}
/**
 * @param {?} context
 * @param {?} index
 * @return {?}
 */
function getPointers(context, index) {
    /** @type {?} */
    const adjustedIndex = index === 0 /* MasterFlagPosition */ ? index : (index + 0 /* FlagsOffset */);
    return (/** @type {?} */ (context[adjustedIndex]));
}
/**
 * @param {?} context
 * @param {?} index
 * @return {?}
 */
export function getValue(context, index) {
    return (/** @type {?} */ (context[index + 2 /* ValueOffset */]));
}
/**
 * @param {?} context
 * @param {?} index
 * @return {?}
 */
export function getProp(context, index) {
    return (/** @type {?} */ (context[index + 1 /* PropertyOffset */]));
}
/**
 * @param {?} context
 * @return {?}
 */
export function isContextDirty(context) {
    return isDirty(context, 0 /* MasterFlagPosition */);
}
/**
 * @param {?} context
 * @param {?} isDirtyYes
 * @return {?}
 */
export function setContextDirty(context, isDirtyYes) {
    setDirty(context, 0 /* MasterFlagPosition */, isDirtyYes);
}
/**
 * @param {?} context
 * @param {?} isDirtyYes
 * @return {?}
 */
export function setContextPlayersDirty(context, isDirtyYes) {
    if (isDirtyYes) {
        ((/** @type {?} */ (context[0 /* MasterFlagPosition */]))) |= 8 /* PlayerBuildersDirty */;
    }
    else {
        ((/** @type {?} */ (context[0 /* MasterFlagPosition */]))) &= ~8 /* PlayerBuildersDirty */;
    }
}
/**
 * @param {?} context
 * @param {?} indexA
 * @param {?} indexB
 * @return {?}
 */
function swapMultiContextEntries(context, indexA, indexB) {
    if (indexA === indexB)
        return;
    /** @type {?} */
    const tmpValue = getValue(context, indexA);
    /** @type {?} */
    const tmpProp = getProp(context, indexA);
    /** @type {?} */
    const tmpFlag = getPointers(context, indexA);
    /** @type {?} */
    const tmpPlayerBuilderIndex = getPlayerBuilderIndex(context, indexA);
    /** @type {?} */
    const tmpDirectiveIndex = getDirectiveIndexFromEntry(context, indexA);
    /** @type {?} */
    let flagA = tmpFlag;
    /** @type {?} */
    let flagB = getPointers(context, indexB);
    /** @type {?} */
    const singleIndexA = getMultiOrSingleIndex(flagA);
    if (singleIndexA >= 0) {
        /** @type {?} */
        const _flag = getPointers(context, singleIndexA);
        /** @type {?} */
        const _initial = getInitialIndex(_flag);
        setFlag(context, singleIndexA, pointers(_flag, _initial, indexB));
    }
    /** @type {?} */
    const singleIndexB = getMultiOrSingleIndex(flagB);
    if (singleIndexB >= 0) {
        /** @type {?} */
        const _flag = getPointers(context, singleIndexB);
        /** @type {?} */
        const _initial = getInitialIndex(_flag);
        setFlag(context, singleIndexB, pointers(_flag, _initial, indexA));
    }
    setValue(context, indexA, getValue(context, indexB));
    setProp(context, indexA, getProp(context, indexB));
    setFlag(context, indexA, getPointers(context, indexB));
    /** @type {?} */
    const playerIndexA = getPlayerBuilderIndex(context, indexB);
    /** @type {?} */
    const directiveIndexA = getDirectiveIndexFromEntry(context, indexB);
    setPlayerBuilderIndex(context, indexA, playerIndexA, directiveIndexA);
    setValue(context, indexB, tmpValue);
    setProp(context, indexB, tmpProp);
    setFlag(context, indexB, tmpFlag);
    setPlayerBuilderIndex(context, indexB, tmpPlayerBuilderIndex, tmpDirectiveIndex);
}
/**
 * @param {?} context
 * @param {?} indexStartPosition
 * @return {?}
 */
function updateSinglePointerValues(context, indexStartPosition) {
    for (let i = indexStartPosition; i < context.length; i += 4 /* Size */) {
        /** @type {?} */
        const multiFlag = getPointers(context, i);
        /** @type {?} */
        const singleIndex = getMultiOrSingleIndex(multiFlag);
        if (singleIndex > 0) {
            /** @type {?} */
            const singleFlag = getPointers(context, singleIndex);
            /** @type {?} */
            const initialIndexForSingle = getInitialIndex(singleFlag);
            /** @type {?} */
            const flagValue = (isDirty(context, singleIndex) ? 1 /* Dirty */ : 0 /* None */) |
                (isClassBasedValue(context, singleIndex) ? 2 /* Class */ : 0 /* None */) |
                (isSanitizable(context, singleIndex) ? 4 /* Sanitize */ : 0 /* None */);
            /** @type {?} */
            const updatedFlag = pointers(flagValue, initialIndexForSingle, i);
            setFlag(context, singleIndex, updatedFlag);
        }
    }
}
/**
 * @param {?} context
 * @param {?} index
 * @param {?} classBased
 * @param {?} name
 * @param {?} flag
 * @param {?} value
 * @param {?} directiveIndex
 * @param {?} playerIndex
 * @return {?}
 */
function insertNewMultiProperty(context, index, classBased, name, flag, value, directiveIndex, playerIndex) {
    /** @type {?} */
    const doShift = index < context.length;
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
/**
 * @param {?} value
 * @param {?=} isClassBased
 * @return {?}
 */
function valueExists(value, isClassBased) {
    return value !== null;
}
/**
 * @param {?} context
 * @param {?} prop
 * @param {?} entryIsClassBased
 * @param {?=} sanitizer
 * @return {?}
 */
function prepareInitialFlag(context, prop, entryIsClassBased, sanitizer) {
    /** @type {?} */
    let flag = (sanitizer && sanitizer(prop)) ? 4 /* Sanitize */ : 0 /* None */;
    /** @type {?} */
    let initialIndex;
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
/**
 * @param {?} context
 * @param {?} flag
 * @param {?} newValue
 * @return {?}
 */
function hasInitialValueChanged(context, flag, newValue) {
    /** @type {?} */
    const initialValue = getInitialValue(context, flag);
    return !initialValue || hasValueChanged(flag, initialValue, newValue);
}
/**
 * @param {?} flag
 * @param {?} a
 * @param {?} b
 * @return {?}
 */
function hasValueChanged(flag, a, b) {
    /** @type {?} */
    const isClassBased = flag & 2 /* Class */;
    /** @type {?} */
    const hasValues = a && b;
    /** @type {?} */
    const usesSanitizer = flag & 4 /* Sanitize */;
    // the toString() comparison ensures that a value is checked
    // ... otherwise (during sanitization bypassing) the === comparsion
    // would fail since a new String() instance is created
    if (!isClassBased && hasValues && usesSanitizer) {
        // we know for sure we're dealing with strings at this point
        return ((/** @type {?} */ (a))).toString() !== ((/** @type {?} */ (b))).toString();
    }
    // everything else is safe to check with a normal equality check
    return a !== b;
}
/**
 * @template T
 */
export class ClassAndStylePlayerBuilder {
    /**
     * @param {?} factory
     * @param {?} _element
     * @param {?} _type
     */
    constructor(factory, _element, _type) {
        this._element = _element;
        this._type = _type;
        this._values = {};
        this._dirty = false;
        this._factory = (/** @type {?} */ (factory));
    }
    /**
     * @param {?} prop
     * @param {?} value
     * @return {?}
     */
    setValue(prop, value) {
        if (this._values[prop] !== value) {
            this._values[prop] = value;
            this._dirty = true;
        }
    }
    /**
     * @param {?} currentPlayer
     * @param {?} isFirstRender
     * @return {?}
     */
    buildPlayer(currentPlayer, isFirstRender) {
        // if no values have been set here then this means the binding didn't
        // change and therefore the binding values were not updated through
        // `setValue` which means no new player will be provided.
        if (this._dirty) {
            /** @type {?} */
            const player = this._factory.fn(this._element, this._type, (/** @type {?} */ (this._values)), isFirstRender, currentPlayer || null);
            this._values = {};
            this._dirty = false;
            return player;
        }
        return undefined;
    }
}
if (false) {
    /**
     * @type {?}
     * @private
     */
    ClassAndStylePlayerBuilder.prototype._values;
    /**
     * @type {?}
     * @private
     */
    ClassAndStylePlayerBuilder.prototype._dirty;
    /**
     * @type {?}
     * @private
     */
    ClassAndStylePlayerBuilder.prototype._factory;
    /**
     * @type {?}
     * @private
     */
    ClassAndStylePlayerBuilder.prototype._element;
    /**
     * @type {?}
     * @private
     */
    ClassAndStylePlayerBuilder.prototype._type;
}
/**
 * Used to provide a summary of the state of the styling context.
 *
 * This is an internal interface that is only used inside of test tooling to
 * help summarize what's going on within the styling context. None of this code
 * is designed to be exported publicly and will, therefore, be tree-shaken away
 * during runtime.
 * @record
 */
export function LogSummary() { }
if (false) {
    /** @type {?} */
    LogSummary.prototype.name;
    /** @type {?} */
    LogSummary.prototype.staticIndex;
    /** @type {?} */
    LogSummary.prototype.dynamicIndex;
    /** @type {?} */
    LogSummary.prototype.value;
    /** @type {?} */
    LogSummary.prototype.flags;
}
/**
 * @param {?} source
 * @param {?=} index
 * @return {?}
 */
export function generateConfigSummary(source, index) {
    /** @type {?} */
    let flag;
    /** @type {?} */
    let name = 'config value for ';
    if (Array.isArray(source)) {
        if (index) {
            name += 'index: ' + index;
        }
        else {
            name += 'master config';
        }
        index = index || 0 /* MasterFlagPosition */;
        flag = (/** @type {?} */ (source[index]));
    }
    else {
        flag = source;
        name += 'index: ' + flag;
    }
    /** @type {?} */
    const dynamicIndex = getMultiOrSingleIndex(flag);
    /** @type {?} */
    const staticIndex = getInitialIndex(flag);
    return {
        name,
        staticIndex,
        dynamicIndex,
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
/**
 * @param {?} context
 * @param {?} index
 * @return {?}
 */
export function getDirectiveIndexFromEntry(context, index) {
    /** @type {?} */
    const value = (/** @type {?} */ (context[index + 3 /* PlayerBuilderIndexOffset */]));
    return value & 65535 /* BitMask */;
}
/**
 * @param {?} context
 * @param {?} directiveRef
 * @return {?}
 */
function getDirectiveIndexFromRegistry(context, directiveRef) {
    /** @type {?} */
    let directiveIndex;
    /** @type {?} */
    const dirs = context[1 /* DirectiveRegistryPosition */];
    /** @type {?} */
    let index = getDirectiveRegistryValuesIndexOf(dirs, directiveRef);
    if (index === -1) {
        // if the directive was not allocated then this means that styling is
        // being applied in a dynamic way AFTER the element was already instantiated
        index = dirs.length;
        directiveIndex = index > 0 ? index / 4 /* Size */ : 0;
        dirs.push(null, null, null, null);
        dirs[index + 0 /* DirectiveValueOffset */] = directiveRef;
        dirs[index + 2 /* DirtyFlagOffset */] = false;
        dirs[index + 1 /* SinglePropValuesIndexOffset */] = -1;
        /** @type {?} */
        const classesStartIndex = getMultiClassesStartIndex(context) || 9 /* SingleStylesStartPosition */;
        registerMultiMapEntry(context, directiveIndex, true, context.length);
        registerMultiMapEntry(context, directiveIndex, false, classesStartIndex);
    }
    else {
        directiveIndex = index > 0 ? index / 4 /* Size */ : 0;
    }
    return directiveIndex;
}
/**
 * @param {?} directives
 * @param {?} directive
 * @return {?}
 */
function getDirectiveRegistryValuesIndexOf(directives, directive) {
    for (let i = 0; i < directives.length; i += 4 /* Size */) {
        if (directives[i] === directive) {
            return i;
        }
    }
    return -1;
}
/**
 * @param {?} keyValues
 * @param {?} key
 * @return {?}
 */
function getInitialStylingValuesIndexOf(keyValues, key) {
    for (let i = 2 /* KeyValueStartPosition */; i < keyValues.length; i += 2 /* Size */) {
        if (keyValues[i] === key)
            return i;
    }
    return -1;
}
/**
 * @param {?} a
 * @param {?} b
 * @return {?}
 */
export function compareLogSummaries(a, b) {
    /** @type {?} */
    const log = [];
    /** @type {?} */
    const diffs = [];
    diffSummaryValues(diffs, 'staticIndex', 'staticIndex', a, b);
    diffSummaryValues(diffs, 'dynamicIndex', 'dynamicIndex', a, b);
    Object.keys(a.flags).forEach(name => { diffSummaryValues(diffs, 'flags.' + name, name, a.flags, b.flags); });
    if (diffs.length) {
        log.push('Log Summaries for:');
        log.push('  A: ' + a.name);
        log.push('  B: ' + b.name);
        log.push('\n  Differ in the following way (A !== B):');
        diffs.forEach(result => {
            const [name, aVal, bVal] = result;
            log.push('    => ' + name);
            log.push('    => ' + aVal + ' !== ' + bVal + '\n');
        });
    }
    return log;
}
/**
 * @param {?} result
 * @param {?} name
 * @param {?} prop
 * @param {?} a
 * @param {?} b
 * @return {?}
 */
function diffSummaryValues(result, name, prop, a, b) {
    /** @type {?} */
    const aVal = a[prop];
    /** @type {?} */
    const bVal = b[prop];
    if (aVal !== bVal) {
        result.push([name, aVal, bVal]);
    }
}
/**
 * @param {?} context
 * @param {?} directiveIndex
 * @param {?} offset
 * @param {?} isClassBased
 * @return {?}
 */
function getSinglePropIndexValue(context, directiveIndex, offset, isClassBased) {
    /** @type {?} */
    const singlePropOffsetRegistryIndex = (/** @type {?} */ (context[1 /* DirectiveRegistryPosition */][(directiveIndex * 4 /* Size */) +
        1 /* SinglePropValuesIndexOffset */]));
    /** @type {?} */
    const offsets = context[4 /* SinglePropOffsetPositions */];
    /** @type {?} */
    const indexForOffset = singlePropOffsetRegistryIndex +
        2 /* ValueStartPosition */ +
        (isClassBased ?
            offsets[singlePropOffsetRegistryIndex + 0 /* StylesCountPosition */] :
            0) +
        offset;
    return offsets[indexForOffset];
}
/**
 * @param {?} context
 * @param {?} directiveIndex
 * @return {?}
 */
function getStyleSanitizer(context, directiveIndex) {
    /** @type {?} */
    const dirs = context[1 /* DirectiveRegistryPosition */];
    /** @type {?} */
    const value = dirs[directiveIndex * 4 /* Size */ +
        3 /* StyleSanitizerOffset */] ||
        dirs[3 /* StyleSanitizerOffset */] || null;
    return (/** @type {?} */ (value));
}
/**
 * @param {?} context
 * @param {?} directiveIndex
 * @return {?}
 */
function isDirectiveDirty(context, directiveIndex) {
    /** @type {?} */
    const dirs = context[1 /* DirectiveRegistryPosition */];
    return (/** @type {?} */ (dirs[directiveIndex * 4 /* Size */ +
        2 /* DirtyFlagOffset */]));
}
/**
 * @param {?} context
 * @param {?} directiveIndex
 * @param {?} dirtyYes
 * @return {?}
 */
function setDirectiveDirty(context, directiveIndex, dirtyYes) {
    /** @type {?} */
    const dirs = context[1 /* DirectiveRegistryPosition */];
    dirs[directiveIndex * 4 /* Size */ +
        2 /* DirtyFlagOffset */] = dirtyYes;
}
/**
 * @param {?} currentValue
 * @param {?} newValue
 * @param {?} currentDirectiveOwner
 * @param {?} newDirectiveOwner
 * @return {?}
 */
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
 * @param {?} context
 * @return {?} the className string (e.g. `on active red`)
 */
export function getInitialClassNameValue(context) {
    /** @type {?} */
    const initialClassValues = context[3 /* InitialClassValuesPosition */];
    /** @type {?} */
    let className = initialClassValues[1 /* InitialClassesStringPosition */];
    if (className === null) {
        className = '';
        for (let i = 2 /* KeyValueStartPosition */; i < initialClassValues.length; i += 2 /* Size */) {
            /** @type {?} */
            const isPresent = initialClassValues[i + 1];
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
 * @param {?} context
 * @return {?} the style string (e.g. `width:100px;height:200px`)
 */
export function getInitialStyleStringValue(context) {
    /** @type {?} */
    const initialStyleValues = context[2 /* InitialStyleValuesPosition */];
    /** @type {?} */
    let styleString = initialStyleValues[1 /* InitialClassesStringPosition */];
    if (styleString === null) {
        styleString = '';
        for (let i = 2 /* KeyValueStartPosition */; i < initialStyleValues.length; i += 2 /* Size */) {
            /** @type {?} */
            const value = initialStyleValues[i + 1];
            if (value !== null) {
                styleString += (styleString.length ? ';' : '') + `${initialStyleValues[i]}:${value}`;
            }
        }
        initialStyleValues[1 /* InitialClassesStringPosition */] = styleString;
    }
    return styleString;
}
/**
 * Returns the current cached mutli-value for a given directiveIndex within the provided context.
 * @param {?} context
 * @param {?} entryIsClassBased
 * @param {?} directiveIndex
 * @return {?}
 */
function readCachedMapValue(context, entryIsClassBased, directiveIndex) {
    /** @type {?} */
    const values = context[entryIsClassBased ? 6 /* CachedMultiClasses */ : 7 /* CachedMultiStyles */];
    /** @type {?} */
    const index = 1 /* ValuesStartPosition */ +
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
 * @param {?} context
 * @param {?} entryIsClassBased
 * @param {?} directiveIndex
 * @param {?} newValue
 * @return {?}
 */
function isMultiValueCacheHit(context, entryIsClassBased, directiveIndex, newValue) {
    /** @type {?} */
    const indexOfCachedValues = entryIsClassBased ? 6 /* CachedMultiClasses */ : 7 /* CachedMultiStyles */;
    /** @type {?} */
    const cachedValues = (/** @type {?} */ (context[indexOfCachedValues]));
    /** @type {?} */
    const index = 1 /* ValuesStartPosition */ +
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
 * @param {?} context
 * @param {?} directiveIndex
 * @param {?} entryIsClassBased
 * @param {?} cacheValue
 * @param {?} startPosition
 * @param {?} endPosition
 * @param {?} totalValues
 * @param {?} dirtyFutureValues
 * @return {?}
 */
function updateCachedMapValue(context, directiveIndex, entryIsClassBased, cacheValue, startPosition, endPosition, totalValues, dirtyFutureValues) {
    /** @type {?} */
    const values = context[entryIsClassBased ? 6 /* CachedMultiClasses */ : 7 /* CachedMultiStyles */];
    /** @type {?} */
    const index = 1 /* ValuesStartPosition */ +
        directiveIndex * 4 /* Size */;
    // in the event that this is true we assume that future values are dirty and therefore
    // will be checked again in the next CD cycle
    if (dirtyFutureValues) {
        /** @type {?} */
        const nextStartPosition = startPosition + totalValues * 4 /* Size */;
        for (let i = index + 4 /* Size */; i < values.length; i += 4 /* Size */) {
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
    /** @type {?} */
    let totalStylingEntries = totalValues;
    for (let i = 1 /* ValuesStartPosition */; i < index; i += 4 /* Size */) {
        totalStylingEntries += values[i + 3 /* ValueCountOffset */];
    }
    // because style values come before class values in the context this means
    // that if any new values were inserted then the cache values array for
    // classes is out of sync. The code below will update the offsets to point
    // to their new values.
    if (!entryIsClassBased) {
        /** @type {?} */
        const classCache = context[6 /* CachedMultiClasses */];
        /** @type {?} */
        const classesStartPosition = classCache[1 /* ValuesStartPosition */ +
            1 /* PositionStartOffset */];
        /** @type {?} */
        const diffInStartPosition = endPosition - classesStartPosition;
        for (let i = 1 /* ValuesStartPosition */; i < classCache.length; i += 4 /* Size */) {
            classCache[i + 1 /* PositionStartOffset */] += diffInStartPosition;
        }
    }
    values[0 /* EntriesCountPosition */] = totalStylingEntries;
}
/**
 * @param {?} entries
 * @return {?}
 */
function hyphenateEntries(entries) {
    /** @type {?} */
    const newEntries = [];
    for (let i = 0; i < entries.length; i++) {
        newEntries.push(hyphenate(entries[i]));
    }
    return newEntries;
}
/**
 * @param {?} value
 * @return {?}
 */
function hyphenate(value) {
    return value.replace(/[a-z][A-Z]/g, match => `${match.charAt(0)}-${match.charAt(1).toLowerCase()}`);
}
/**
 * @param {?} context
 * @param {?} directiveIndex
 * @param {?} entryIsClassBased
 * @param {?} startPosition
 * @param {?=} count
 * @return {?}
 */
function registerMultiMapEntry(context, directiveIndex, entryIsClassBased, startPosition, count = 0) {
    /** @type {?} */
    const cachedValues = context[entryIsClassBased ? 6 /* CachedMultiClasses */ : 7 /* CachedMultiStyles */];
    if (directiveIndex > 0) {
        /** @type {?} */
        const limit = 1 /* ValuesStartPosition */ +
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xhc3NfYW5kX3N0eWxlX2JpbmRpbmdzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9zdHlsaW5nL2NsYXNzX2FuZF9zdHlsZV9iaW5kaW5ncy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7O0FBUUEsT0FBTyxFQUFDLFdBQVcsRUFBRSxTQUFTLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFHaEQsT0FBTyxFQUFzQixtQkFBbUIsRUFBRSxvQkFBb0IsRUFBQyxNQUFNLHdCQUF3QixDQUFDO0FBR3RHLE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxXQUFXLENBQUM7QUFDcEMsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLDhCQUE4QixDQUFDO0FBRTVELE9BQU8sRUFBQyxrQkFBa0IsRUFBQyxNQUFNLGtCQUFrQixDQUFDO0FBQ3BELE9BQU8sRUFBQyxpQkFBaUIsRUFBRSxrQkFBa0IsRUFBRSw0QkFBNEIsRUFBRSx5QkFBeUIsRUFBRSxnQkFBZ0IsRUFBQyxNQUFNLFFBQVEsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBeUJ4SSxNQUFNLFVBQVUsdUJBQXVCLENBQUMsS0FBa0I7O1VBQ2xELE9BQU8sR0FBRyx5QkFBeUIsRUFBRTs7VUFDckMsY0FBYyxHQUF5QixPQUFPLG9DQUF5QztRQUN6RixDQUFDLElBQUksRUFBRSxJQUFJLENBQUM7O1VBQ1YsYUFBYSxHQUF5QixPQUFPLG9DQUF5QztRQUN4RixDQUFDLElBQUksRUFBRSxJQUFJLENBQUM7Ozs7UUFJWixJQUFJLEdBQUcsQ0FBQyxDQUFDO0lBQ2IsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7O2NBQy9CLElBQUksR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBQ3JCLElBQUksT0FBTyxJQUFJLElBQUksUUFB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QUMsQ0FBQztTQUM5QztLQUNGO0lBQ0QsWUFBWSxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsYUFBYSxFQUFFLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQztBQUNuRCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4qIEBsaWNlbnNlXG4qIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuKlxuKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4qL1xuaW1wb3J0IHtTdHlsZVNhbml0aXplRm59IGZyb20gJy4uLy4uL3Nhbml0aXphdGlvbi9zdHlsZV9zYW5pdGl6ZXInO1xuaW1wb3J0IHtFTVBUWV9BUlJBWSwgRU1QVFlfT0JKfSBmcm9tICcuLi9lbXB0eSc7XG5pbXBvcnQge0F0dHJpYnV0ZU1hcmtlciwgVEF0dHJpYnV0ZXN9IGZyb20gJy4uL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge0JpbmRpbmdTdG9yZSwgQmluZGluZ1R5cGUsIFBsYXllciwgUGxheWVyQnVpbGRlciwgUGxheWVyRmFjdG9yeSwgUGxheWVySW5kZXh9IGZyb20gJy4uL2ludGVyZmFjZXMvcGxheWVyJztcbmltcG9ydCB7UkVsZW1lbnQsIFJlbmRlcmVyMywgUmVuZGVyZXJTdHlsZUZsYWdzMywgaXNQcm9jZWR1cmFsUmVuZGVyZXJ9IGZyb20gJy4uL2ludGVyZmFjZXMvcmVuZGVyZXInO1xuaW1wb3J0IHtEaXJlY3RpdmVPd25lckFuZFBsYXllckJ1aWxkZXJJbmRleCwgRGlyZWN0aXZlUmVnaXN0cnlWYWx1ZXMsIERpcmVjdGl2ZVJlZ2lzdHJ5VmFsdWVzSW5kZXgsIEluaXRpYWxTdHlsaW5nVmFsdWVzLCBJbml0aWFsU3R5bGluZ1ZhbHVlc0luZGV4LCBNYXBCYXNlZE9mZnNldFZhbHVlcywgTWFwQmFzZWRPZmZzZXRWYWx1ZXNJbmRleCwgU2luZ2xlUHJvcE9mZnNldFZhbHVlcywgU2luZ2xlUHJvcE9mZnNldFZhbHVlc0luZGV4LCBTdHlsaW5nQ29udGV4dCwgU3R5bGluZ0ZsYWdzLCBTdHlsaW5nSW5kZXh9IGZyb20gJy4uL2ludGVyZmFjZXMvc3R5bGluZyc7XG5pbXBvcnQge0xWaWV3LCBSb290Q29udGV4dH0gZnJvbSAnLi4vaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7Tk9fQ0hBTkdFfSBmcm9tICcuLi90b2tlbnMnO1xuaW1wb3J0IHtnZXRSb290Q29udGV4dH0gZnJvbSAnLi4vdXRpbC92aWV3X3RyYXZlcnNhbF91dGlscyc7XG5cbmltcG9ydCB7Qm91bmRQbGF5ZXJGYWN0b3J5fSBmcm9tICcuL3BsYXllcl9mYWN0b3J5JztcbmltcG9ydCB7YWRkUGxheWVySW50ZXJuYWwsIGFsbG9jUGxheWVyQ29udGV4dCwgYWxsb2NhdGVEaXJlY3RpdmVJbnRvQ29udGV4dCwgY3JlYXRlRW1wdHlTdHlsaW5nQ29udGV4dCwgZ2V0UGxheWVyQ29udGV4dH0gZnJvbSAnLi91dGlsJztcblxuXG5cbi8qKlxuICogVGhpcyBmaWxlIGluY2x1ZGVzIHRoZSBjb2RlIHRvIHBvd2VyIGFsbCBzdHlsaW5nLWJpbmRpbmcgb3BlcmF0aW9ucyBpbiBBbmd1bGFyLlxuICpcbiAqIFRoZXNlIGluY2x1ZGU6XG4gKiBbc3R5bGVdPVwibXlTdHlsZU9ialwiXG4gKiBbY2xhc3NdPVwibXlDbGFzc09ialwiXG4gKiBbc3R5bGUucHJvcF09XCJteVByb3BWYWx1ZVwiXG4gKiBbY2xhc3MubmFtZV09XCJteUNsYXNzVmFsdWVcIlxuICpcbiAqIEl0IGFsc28gaW5jbHVkZXMgY29kZSB0aGF0IHdpbGwgYWxsb3cgc3R5bGUgYmluZGluZyBjb2RlIHRvIG9wZXJhdGUgd2l0aGluIGhvc3RcbiAqIGJpbmRpbmdzIGZvciBjb21wb25lbnRzL2RpcmVjdGl2ZXMuXG4gKlxuICogVGhlcmUgYXJlIG1hbnkgZGlmZmVyZW50IHdheXMgaW4gd2hpY2ggdGhlc2UgZnVuY3Rpb25zIGJlbG93IGFyZSBjYWxsZWQuIFBsZWFzZSBzZWVcbiAqIGByZW5kZXIzL2ludGVyZmFjZXMvc3R5bGluZy50c2AgdG8gZ2V0IGEgYmV0dGVyIGlkZWEgb2YgaG93IHRoZSBzdHlsaW5nIGFsZ29yaXRobSB3b3Jrcy5cbiAqL1xuXG5cblxuLyoqXG4gKiBDcmVhdGVzIGEgbmV3IFN0eWxpbmdDb250ZXh0IGFuIGZpbGxzIGl0IHdpdGggdGhlIHByb3ZpZGVkIHN0YXRpYyBzdHlsaW5nIGF0dHJpYnV0ZSB2YWx1ZXMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbml0aWFsaXplU3RhdGljQ29udGV4dChhdHRyczogVEF0dHJpYnV0ZXMpOiBTdHlsaW5nQ29udGV4dCB7XG4gIGNvbnN0IGNvbnRleHQgPSBjcmVhdGVFbXB0eVN0eWxpbmdDb250ZXh0KCk7XG4gIGNvbnN0IGluaXRpYWxDbGFzc2VzOiBJbml0aWFsU3R5bGluZ1ZhbHVlcyA9IGNvbnRleHRbU3R5bGluZ0luZGV4LkluaXRpYWxDbGFzc1ZhbHVlc1Bvc2l0aW9uXSA9XG4gICAgICBbbnVsbCwgbnVsbF07XG4gIGNvbnN0IGluaXRpYWxTdHlsZXM6IEluaXRpYWxTdHlsaW5nVmFsdWVzID0gY29udGV4dFtTdHlsaW5nSW5kZXguSW5pdGlhbFN0eWxlVmFsdWVzUG9zaXRpb25dID1cbiAgICAgIFtudWxsLCBudWxsXTtcblxuICAvLyBUaGUgYXR0cmlidXRlcyBhcnJheSBoYXMgbWFya2VyIHZhbHVlcyAobnVtYmVycykgaW5kaWNhdGluZyB3aGF0IHRoZSBzdWJzZXF1ZW50XG4gIC8vIHZhbHVlcyByZXByZXNlbnQuIFdoZW4gd2UgZW5jb3VudGVyIGEgbnVtYmVyLCB3ZSBzZXQgdGhlIG1vZGUgdG8gdGhhdCB0eXBlIG9mIGF0dHJpYnV0ZS5cbiAgbGV0IG1vZGUgPSAtMTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBhdHRycy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IGF0dHIgPSBhdHRyc1tpXTtcbiAgICBpZiAodHlwZW9mIGF0dHIgPT0gJ251bWJlcicpIHtcbiAgICAgIG1vZGUgPSBhdHRyO1xuICAgIH0gZWxzZSBpZiAobW9kZSA9PT0gQXR0cmlidXRlTWFya2VyLlN0eWxlcykge1xuICAgICAgaW5pdGlhbFN0eWxlcy5wdXNoKGF0dHIgYXMgc3RyaW5nLCBhdHRyc1srK2ldIGFzIHN0cmluZyk7XG4gICAgfSBlbHNlIGlmIChtb2RlID09PSBBdHRyaWJ1dGVNYXJrZXIuQ2xhc3Nlcykge1xuICAgICAgaW5pdGlhbENsYXNzZXMucHVzaChhdHRyIGFzIHN0cmluZywgdHJ1ZSk7XG4gICAgfSBlbHNlIGlmIChtb2RlID09PSBBdHRyaWJ1dGVNYXJrZXIuU2VsZWN0T25seSkge1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGNvbnRleHQ7XG59XG5cbi8qKlxuICogRGVzaWduZWQgdG8gdXBkYXRlIGFuIGV4aXN0aW5nIHN0eWxpbmcgY29udGV4dCB3aXRoIG5ldyBzdGF0aWMgc3R5bGluZ1xuICogZGF0YSAoY2xhc3NlcyBhbmQgc3R5bGVzKS5cbiAqXG4gKiBAcGFyYW0gY29udGV4dCB0aGUgZXhpc3Rpbmcgc3R5bGluZyBjb250ZXh0XG4gKiBAcGFyYW0gYXR0cnMgYW4gYXJyYXkgb2YgbmV3IHN0YXRpYyBzdHlsaW5nIGF0dHJpYnV0ZXMgdGhhdCB3aWxsIGJlXG4gKiAgICAgICAgICAgICAgYXNzaWduZWQgdG8gdGhlIGNvbnRleHRcbiAqIEBwYXJhbSBkaXJlY3RpdmVSZWYgdGhlIGRpcmVjdGl2ZSBpbnN0YW5jZSB3aXRoIHdoaWNoIHN0YXRpYyBkYXRhIGlzIGFzc29jaWF0ZWQgd2l0aC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHBhdGNoQ29udGV4dFdpdGhTdGF0aWNBdHRycyhcbiAgICBjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgYXR0cnM6IFRBdHRyaWJ1dGVzLCBzdGFydGluZ0luZGV4OiBudW1iZXIsIGRpcmVjdGl2ZVJlZjogYW55KTogdm9pZCB7XG4gIC8vIElmIHRoZSBzdHlsaW5nIGNvbnRleHQgaGFzIGFscmVhZHkgYmVlbiBwYXRjaGVkIHdpdGggdGhlIGdpdmVuIGRpcmVjdGl2ZSdzIGJpbmRpbmdzLFxuICAvLyB0aGVuIHRoZXJlIGlzIG5vIHBvaW50IGluIGRvaW5nIGl0IGFnYWluLiBUaGUgcmVhc29uIHdoeSB0aGlzIG1heSBoYXBwZW4gKHRoZSBkaXJlY3RpdmVcbiAgLy8gc3R5bGluZyBiZWluZyBwYXRjaGVkIHR3aWNlKSBpcyBiZWNhdXNlIHRoZSBgc3R5bGluZ0JpbmRpbmdgIGZ1bmN0aW9uIGlzIGNhbGxlZCBlYWNoIHRpbWVcbiAgLy8gYW4gZWxlbWVudCBpcyBjcmVhdGVkIChib3RoIHdpdGhpbiBhIHRlbXBsYXRlIGZ1bmN0aW9uIGFuZCB3aXRoaW4gZGlyZWN0aXZlIGhvc3QgYmluZGluZ3MpLlxuICBjb25zdCBkaXJlY3RpdmVzID0gY29udGV4dFtTdHlsaW5nSW5kZXguRGlyZWN0aXZlUmVnaXN0cnlQb3NpdGlvbl07XG4gIGlmIChnZXREaXJlY3RpdmVSZWdpc3RyeVZhbHVlc0luZGV4T2YoZGlyZWN0aXZlcywgZGlyZWN0aXZlUmVmKSA9PSAtMSkge1xuICAgIC8vIHRoaXMgaXMgYSBuZXcgZGlyZWN0aXZlIHdoaWNoIHdlIGhhdmUgbm90IHNlZW4geWV0LlxuICAgIGFsbG9jYXRlRGlyZWN0aXZlSW50b0NvbnRleHQoY29udGV4dCwgZGlyZWN0aXZlUmVmKTtcblxuICAgIGxldCBpbml0aWFsQ2xhc3NlczogSW5pdGlhbFN0eWxpbmdWYWx1ZXN8bnVsbCA9IG51bGw7XG4gICAgbGV0IGluaXRpYWxTdHlsZXM6IEluaXRpYWxTdHlsaW5nVmFsdWVzfG51bGwgPSBudWxsO1xuXG4gICAgbGV0IG1vZGUgPSAtMTtcbiAgICBmb3IgKGxldCBpID0gc3RhcnRpbmdJbmRleDsgaSA8IGF0dHJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBhdHRyID0gYXR0cnNbaV07XG4gICAgICBpZiAodHlwZW9mIGF0dHIgPT0gJ251bWJlcicpIHtcbiAgICAgICAgbW9kZSA9IGF0dHI7XG4gICAgICB9IGVsc2UgaWYgKG1vZGUgPT0gQXR0cmlidXRlTWFya2VyLkNsYXNzZXMpIHtcbiAgICAgICAgaW5pdGlhbENsYXNzZXMgPSBpbml0aWFsQ2xhc3NlcyB8fCBjb250ZXh0W1N0eWxpbmdJbmRleC5Jbml0aWFsQ2xhc3NWYWx1ZXNQb3NpdGlvbl07XG4gICAgICAgIHBhdGNoSW5pdGlhbFN0eWxpbmdWYWx1ZShpbml0aWFsQ2xhc3NlcywgYXR0ciwgdHJ1ZSk7XG4gICAgICB9IGVsc2UgaWYgKG1vZGUgPT0gQXR0cmlidXRlTWFya2VyLlN0eWxlcykge1xuICAgICAgICBpbml0aWFsU3R5bGVzID0gaW5pdGlhbFN0eWxlcyB8fCBjb250ZXh0W1N0eWxpbmdJbmRleC5Jbml0aWFsU3R5bGVWYWx1ZXNQb3NpdGlvbl07XG4gICAgICAgIHBhdGNoSW5pdGlhbFN0eWxpbmdWYWx1ZShpbml0aWFsU3R5bGVzLCBhdHRyLCBhdHRyc1srK2ldKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBEZXNpZ25lZCB0byBhZGQgYSBzdHlsZSBvciBjbGFzcyB2YWx1ZSBpbnRvIHRoZSBleGlzdGluZyBzZXQgb2YgaW5pdGlhbCBzdHlsZXMuXG4gKlxuICogVGhlIGZ1bmN0aW9uIHdpbGwgc2VhcmNoIGFuZCBmaWd1cmUgb3V0IGlmIGEgc3R5bGUvY2xhc3MgdmFsdWUgaXMgYWxyZWFkeSBwcmVzZW50XG4gKiB3aXRoaW4gdGhlIHByb3ZpZGVkIGluaXRpYWwgc3R5bGluZyBhcnJheS4gSWYgYW5kIHdoZW4gYSBzdHlsZS9jbGFzcyB2YWx1ZSBpcyBub3RcbiAqIHByZXNlbnQgKG9yIGlmIGl0J3MgdmFsdWUgaXMgZmFsc3kpIHRoZW4gaXQgd2lsbCBiZSBpbnNlcnRlZC91cGRhdGVkIGluIHRoZSBsaXN0XG4gKiBvZiBpbml0aWFsIHN0eWxpbmcgdmFsdWVzLlxuICovXG5mdW5jdGlvbiBwYXRjaEluaXRpYWxTdHlsaW5nVmFsdWUoXG4gICAgaW5pdGlhbFN0eWxpbmc6IEluaXRpYWxTdHlsaW5nVmFsdWVzLCBwcm9wOiBzdHJpbmcsIHZhbHVlOiBhbnkpOiB2b2lkIHtcbiAgLy8gRXZlbiB2YWx1ZXMgYXJlIGtleXM7IE9kZCBudW1iZXJzIGFyZSB2YWx1ZXM7IFNlYXJjaCBrZXlzIG9ubHlcbiAgZm9yIChsZXQgaSA9IEluaXRpYWxTdHlsaW5nVmFsdWVzSW5kZXguS2V5VmFsdWVTdGFydFBvc2l0aW9uOyBpIDwgaW5pdGlhbFN0eWxpbmcubGVuZ3RoOykge1xuICAgIGNvbnN0IGtleSA9IGluaXRpYWxTdHlsaW5nW2ldO1xuICAgIGlmIChrZXkgPT09IHByb3ApIHtcbiAgICAgIGNvbnN0IGV4aXN0aW5nVmFsdWUgPSBpbml0aWFsU3R5bGluZ1tpICsgSW5pdGlhbFN0eWxpbmdWYWx1ZXNJbmRleC5WYWx1ZU9mZnNldF07XG5cbiAgICAgIC8vIElmIHRoZXJlIGlzIG5vIHByZXZpb3VzIHN0eWxlIHZhbHVlICh3aGVuIGBudWxsYCkgb3Igbm8gcHJldmlvdXMgY2xhc3NcbiAgICAgIC8vIGFwcGxpZWQgKHdoZW4gYGZhbHNlYCkgdGhlbiB3ZSB1cGRhdGUgdGhlIHRoZSBuZXdseSBnaXZlbiB2YWx1ZS5cbiAgICAgIGlmIChleGlzdGluZ1ZhbHVlID09IG51bGwgfHwgZXhpc3RpbmdWYWx1ZSA9PSBmYWxzZSkge1xuICAgICAgICBpbml0aWFsU3R5bGluZ1tpICsgSW5pdGlhbFN0eWxpbmdWYWx1ZXNJbmRleC5WYWx1ZU9mZnNldF0gPSB2YWx1ZTtcbiAgICAgIH1cbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaSA9IGkgKyBJbml0aWFsU3R5bGluZ1ZhbHVlc0luZGV4LlNpemU7XG4gIH1cbiAgLy8gV2UgZGlkIG5vdCBmaW5kIGV4aXN0aW5nIGtleSwgYWRkIGEgbmV3IG9uZS5cbiAgaW5pdGlhbFN0eWxpbmcucHVzaChwcm9wLCB2YWx1ZSk7XG59XG5cbi8qKlxuICogUnVucyB0aHJvdWdoIHRoZSBpbml0aWFsIHN0eWxlIGRhdGEgcHJlc2VudCBpbiB0aGUgY29udGV4dCBhbmQgcmVuZGVyc1xuICogdGhlbSB2aWEgdGhlIHJlbmRlcmVyIG9uIHRoZSBlbGVtZW50LlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVuZGVySW5pdGlhbFN0eWxlcyhcbiAgICBlbGVtZW50OiBSRWxlbWVudCwgY29udGV4dDogU3R5bGluZ0NvbnRleHQsIHJlbmRlcmVyOiBSZW5kZXJlcjMpIHtcbiAgY29uc3QgaW5pdGlhbFN0eWxlcyA9IGNvbnRleHRbU3R5bGluZ0luZGV4LkluaXRpYWxTdHlsZVZhbHVlc1Bvc2l0aW9uXTtcbiAgcmVuZGVySW5pdGlhbFN0eWxpbmdWYWx1ZXMoZWxlbWVudCwgcmVuZGVyZXIsIGluaXRpYWxTdHlsZXMsIGZhbHNlKTtcbn1cblxuLyoqXG4gKiBSdW5zIHRocm91Z2ggdGhlIGluaXRpYWwgY2xhc3MgZGF0YSBwcmVzZW50IGluIHRoZSBjb250ZXh0IGFuZCByZW5kZXJzXG4gKiB0aGVtIHZpYSB0aGUgcmVuZGVyZXIgb24gdGhlIGVsZW1lbnQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZW5kZXJJbml0aWFsQ2xhc3NlcyhcbiAgICBlbGVtZW50OiBSRWxlbWVudCwgY29udGV4dDogU3R5bGluZ0NvbnRleHQsIHJlbmRlcmVyOiBSZW5kZXJlcjMpIHtcbiAgY29uc3QgaW5pdGlhbENsYXNzZXMgPSBjb250ZXh0W1N0eWxpbmdJbmRleC5Jbml0aWFsQ2xhc3NWYWx1ZXNQb3NpdGlvbl07XG4gIHJlbmRlckluaXRpYWxTdHlsaW5nVmFsdWVzKGVsZW1lbnQsIHJlbmRlcmVyLCBpbml0aWFsQ2xhc3NlcywgdHJ1ZSk7XG59XG5cbi8qKlxuICogVGhpcyBpcyBhIGhlbHBlciBmdW5jdGlvbiBkZXNpZ25lZCB0byByZW5kZXIgZWFjaCBlbnRyeSBwcmVzZW50IHdpdGhpbiB0aGVcbiAqIHByb3ZpZGVkIGxpc3Qgb2YgaW5pdGlhbFN0eWxpbmdWYWx1ZXMuXG4gKi9cbmZ1bmN0aW9uIHJlbmRlckluaXRpYWxTdHlsaW5nVmFsdWVzKFxuICAgIGVsZW1lbnQ6IFJFbGVtZW50LCByZW5kZXJlcjogUmVuZGVyZXIzLCBpbml0aWFsU3R5bGluZ1ZhbHVlczogSW5pdGlhbFN0eWxpbmdWYWx1ZXMsXG4gICAgaXNFbnRyeUNsYXNzQmFzZWQ6IGJvb2xlYW4pIHtcbiAgZm9yIChsZXQgaSA9IEluaXRpYWxTdHlsaW5nVmFsdWVzSW5kZXguS2V5VmFsdWVTdGFydFBvc2l0aW9uOyBpIDwgaW5pdGlhbFN0eWxpbmdWYWx1ZXMubGVuZ3RoO1xuICAgICAgIGkgKz0gSW5pdGlhbFN0eWxpbmdWYWx1ZXNJbmRleC5TaXplKSB7XG4gICAgY29uc3QgdmFsdWUgPSBpbml0aWFsU3R5bGluZ1ZhbHVlc1tpICsgSW5pdGlhbFN0eWxpbmdWYWx1ZXNJbmRleC5WYWx1ZU9mZnNldF07XG4gICAgaWYgKHZhbHVlKSB7XG4gICAgICBpZiAoaXNFbnRyeUNsYXNzQmFzZWQpIHtcbiAgICAgICAgc2V0Q2xhc3MoXG4gICAgICAgICAgICBlbGVtZW50LCBpbml0aWFsU3R5bGluZ1ZhbHVlc1tpICsgSW5pdGlhbFN0eWxpbmdWYWx1ZXNJbmRleC5Qcm9wT2Zmc2V0XSBhcyBzdHJpbmcsIHRydWUsXG4gICAgICAgICAgICByZW5kZXJlciwgbnVsbCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzZXRTdHlsZShcbiAgICAgICAgICAgIGVsZW1lbnQsIGluaXRpYWxTdHlsaW5nVmFsdWVzW2kgKyBJbml0aWFsU3R5bGluZ1ZhbHVlc0luZGV4LlByb3BPZmZzZXRdIGFzIHN0cmluZyxcbiAgICAgICAgICAgIHZhbHVlIGFzIHN0cmluZywgcmVuZGVyZXIsIG51bGwpO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gYWxsb3dOZXdCaW5kaW5nc0ZvclN0eWxpbmdDb250ZXh0KGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0KTogYm9vbGVhbiB7XG4gIHJldHVybiAoY29udGV4dFtTdHlsaW5nSW5kZXguTWFzdGVyRmxhZ1Bvc2l0aW9uXSAmIFN0eWxpbmdGbGFncy5CaW5kaW5nQWxsb2NhdGlvbkxvY2tlZCkgPT09IDA7XG59XG5cbi8qKlxuICogQWRkcyBpbiBuZXcgYmluZGluZyB2YWx1ZXMgdG8gYSBzdHlsaW5nIGNvbnRleHQuXG4gKlxuICogSWYgYSBkaXJlY3RpdmUgdmFsdWUgaXMgcHJvdmlkZWQgdGhlbiBhbGwgcHJvdmlkZWQgY2xhc3Mvc3R5bGUgYmluZGluZyBuYW1lcyB3aWxsXG4gKiByZWZlcmVuY2UgdGhlIHByb3ZpZGVkIGRpcmVjdGl2ZS5cbiAqXG4gKiBAcGFyYW0gY29udGV4dCB0aGUgZXhpc3Rpbmcgc3R5bGluZyBjb250ZXh0XG4gKiBAcGFyYW0gZGlyZWN0aXZlUmVmIHRoZSBkaXJlY3RpdmUgdGhhdCB0aGUgbmV3IGJpbmRpbmdzIHdpbGwgcmVmZXJlbmNlXG4gKiBAcGFyYW0gY2xhc3NCaW5kaW5nTmFtZXMgYW4gYXJyYXkgb2YgY2xhc3MgYmluZGluZyBuYW1lcyB0aGF0IHdpbGwgYmUgYWRkZWQgdG8gdGhlIGNvbnRleHRcbiAqIEBwYXJhbSBzdHlsZUJpbmRpbmdOYW1lcyBhbiBhcnJheSBvZiBzdHlsZSBiaW5kaW5nIG5hbWVzIHRoYXQgd2lsbCBiZSBhZGRlZCB0byB0aGUgY29udGV4dFxuICogQHBhcmFtIHN0eWxlU2FuaXRpemVyIGFuIG9wdGlvbmFsIHNhbml0aXplciB0aGF0IGhhbmRsZSBhbGwgc2FuaXRpemF0aW9uIG9uIGZvciBlYWNoIG9mXG4gKiAgICB0aGUgYmluZGluZ3MgYWRkZWQgdG8gdGhlIGNvbnRleHQuIE5vdGUgdGhhdCBpZiBhIGRpcmVjdGl2ZSBpcyBwcm92aWRlZCB0aGVuIHRoZSBzYW5pdGl6ZXJcbiAqICAgIGluc3RhbmNlIHdpbGwgb25seSBiZSBhY3RpdmUgaWYgYW5kIHdoZW4gdGhlIGRpcmVjdGl2ZSB1cGRhdGVzIHRoZSBiaW5kaW5ncyB0aGF0IGl0IG93bnMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB1cGRhdGVDb250ZXh0V2l0aEJpbmRpbmdzKFxuICAgIGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBkaXJlY3RpdmVSZWY6IGFueSB8IG51bGwsIGNsYXNzQmluZGluZ05hbWVzPzogc3RyaW5nW10gfCBudWxsLFxuICAgIHN0eWxlQmluZGluZ05hbWVzPzogc3RyaW5nW10gfCBudWxsLCBzdHlsZVNhbml0aXplcj86IFN0eWxlU2FuaXRpemVGbiB8IG51bGwpIHtcbiAgaWYgKGNvbnRleHRbU3R5bGluZ0luZGV4Lk1hc3RlckZsYWdQb3NpdGlvbl0gJiBTdHlsaW5nRmxhZ3MuQmluZGluZ0FsbG9jYXRpb25Mb2NrZWQpIHJldHVybjtcblxuICAvLyB0aGlzIG1lYW5zIHRoZSBjb250ZXh0IGhhcyBhbHJlYWR5IGJlZW4gcGF0Y2hlZCB3aXRoIHRoZSBkaXJlY3RpdmUncyBiaW5kaW5nc1xuICBjb25zdCBkaXJlY3RpdmVJbmRleCA9IGZpbmRPclBhdGNoRGlyZWN0aXZlSW50b1JlZ2lzdHJ5KGNvbnRleHQsIGRpcmVjdGl2ZVJlZiwgc3R5bGVTYW5pdGl6ZXIpO1xuICBpZiAoZGlyZWN0aXZlSW5kZXggPT09IC0xKSB7XG4gICAgLy8gdGhpcyBtZWFucyB0aGUgZGlyZWN0aXZlIGhhcyBhbHJlYWR5IGJlZW4gcGF0Y2hlZCBpbiAuLi4gTm8gcG9pbnQgaW4gZG9pbmcgYW55dGhpbmdcbiAgICByZXR1cm47XG4gIH1cblxuICBpZiAoc3R5bGVCaW5kaW5nTmFtZXMpIHtcbiAgICBzdHlsZUJpbmRpbmdOYW1lcyA9IGh5cGhlbmF0ZUVudHJpZXMoc3R5bGVCaW5kaW5nTmFtZXMpO1xuICB9XG5cbiAgLy8gdGhlcmUgYXJlIGFsb3Qgb2YgdmFyaWFibGVzIGJlaW5nIHVzZWQgYmVsb3cgdG8gdHJhY2sgd2hlcmUgaW4gdGhlIGNvbnRleHQgdGhlIG5ld1xuICAvLyBiaW5kaW5nIHZhbHVlcyB3aWxsIGJlIHBsYWNlZC4gQmVjYXVzZSB0aGUgY29udGV4dCBjb25zaXN0cyBvZiBtdWx0aXBsZSB0eXBlcyBvZlxuICAvLyBlbnRyaWVzIChzaW5nbGUgY2xhc3Nlcy9zdHlsZXMgYW5kIG11bHRpIGNsYXNzZXMvc3R5bGVzKSBhbG90IG9mIHRoZSBpbmRleCBwb3NpdGlvbnNcbiAgLy8gbmVlZCB0byBiZSBjb21wdXRlZCBhaGVhZCBvZiB0aW1lIGFuZCB0aGUgY29udGV4dCBuZWVkcyB0byBiZSBleHRlbmRlZCBiZWZvcmUgdGhlIHZhbHVlc1xuICAvLyBhcmUgaW5zZXJ0ZWQgaW4uXG4gIGNvbnN0IHNpbmdsZVByb3BPZmZzZXRWYWx1ZXMgPSBjb250ZXh0W1N0eWxpbmdJbmRleC5TaW5nbGVQcm9wT2Zmc2V0UG9zaXRpb25zXTtcbiAgY29uc3QgdG90YWxDdXJyZW50Q2xhc3NCaW5kaW5ncyA9XG4gICAgICBzaW5nbGVQcm9wT2Zmc2V0VmFsdWVzW1NpbmdsZVByb3BPZmZzZXRWYWx1ZXNJbmRleC5DbGFzc2VzQ291bnRQb3NpdGlvbl07XG4gIGNvbnN0IHRvdGFsQ3VycmVudFN0eWxlQmluZGluZ3MgPVxuICAgICAgc2luZ2xlUHJvcE9mZnNldFZhbHVlc1tTaW5nbGVQcm9wT2Zmc2V0VmFsdWVzSW5kZXguU3R5bGVzQ291bnRQb3NpdGlvbl07XG5cbiAgY29uc3QgY2FjaGVkQ2xhc3NNYXBWYWx1ZXMgPSBjb250ZXh0W1N0eWxpbmdJbmRleC5DYWNoZWRNdWx0aUNsYXNzZXNdO1xuICBjb25zdCBjYWNoZWRTdHlsZU1hcFZhbHVlcyA9IGNvbnRleHRbU3R5bGluZ0luZGV4LkNhY2hlZE11bHRpU3R5bGVzXTtcblxuICBjb25zdCBjbGFzc2VzT2Zmc2V0ID0gdG90YWxDdXJyZW50Q2xhc3NCaW5kaW5ncyAqIFN0eWxpbmdJbmRleC5TaXplO1xuICBjb25zdCBzdHlsZXNPZmZzZXQgPSB0b3RhbEN1cnJlbnRTdHlsZUJpbmRpbmdzICogU3R5bGluZ0luZGV4LlNpemU7XG5cbiAgY29uc3Qgc2luZ2xlU3R5bGVzU3RhcnRJbmRleCA9IFN0eWxpbmdJbmRleC5TaW5nbGVTdHlsZXNTdGFydFBvc2l0aW9uO1xuICBsZXQgc2luZ2xlQ2xhc3Nlc1N0YXJ0SW5kZXggPSBzaW5nbGVTdHlsZXNTdGFydEluZGV4ICsgc3R5bGVzT2Zmc2V0O1xuICBsZXQgbXVsdGlTdHlsZXNTdGFydEluZGV4ID0gc2luZ2xlQ2xhc3Nlc1N0YXJ0SW5kZXggKyBjbGFzc2VzT2Zmc2V0O1xuICBsZXQgbXVsdGlDbGFzc2VzU3RhcnRJbmRleCA9IG11bHRpU3R5bGVzU3RhcnRJbmRleCArIHN0eWxlc09mZnNldDtcblxuICAvLyBiZWNhdXNlIHdlJ3JlIGluc2VydGluZyBtb3JlIGJpbmRpbmdzIGludG8gdGhlIGNvbnRleHQsIHRoaXMgbWVhbnMgdGhhdCB0aGVcbiAgLy8gYmluZGluZyB2YWx1ZXMgbmVlZCB0byBiZSByZWZlcmVuY2VkIHRoZSBzaW5nbGVQcm9wT2Zmc2V0VmFsdWVzIGFycmF5IHNvIHRoYXRcbiAgLy8gdGhlIHRlbXBsYXRlL2RpcmVjdGl2ZSBjYW4gZWFzaWx5IGZpbmQgdGhlbSBpbnNpZGUgb2YgdGhlIGBlbGVtZW50U3R5bGVQcm9wYFxuICAvLyBhbmQgdGhlIGBlbGVtZW50Q2xhc3NQcm9wYCBmdW5jdGlvbnMgd2l0aG91dCBpdGVyYXRpbmcgdGhyb3VnaCB0aGUgZW50aXJlIGNvbnRleHQuXG4gIC8vIFRoZSBmaXJzdCBzdGVwIHRvIHNldHRpbmcgdXAgdGhlc2UgcmVmZXJlbmNlIHBvaW50cyBpcyB0byBtYXJrIGhvdyBtYW55IGJpbmRpbmdzXG4gIC8vIGFyZSBiZWluZyBhZGRlZC4gRXZlbiBpZiB0aGVzZSBiaW5kaW5ncyBhbHJlYWR5IGV4aXN0IGluIHRoZSBjb250ZXh0LCB0aGUgZGlyZWN0aXZlXG4gIC8vIG9yIHRlbXBsYXRlIGNvZGUgd2lsbCBzdGlsbCBjYWxsIHRoZW0gdW5rbm93aW5nbHkuIFRoZXJlZm9yZSB0aGUgdG90YWwgdmFsdWVzIG5lZWRcbiAgLy8gdG8gYmUgcmVnaXN0ZXJlZCBzbyB0aGF0IHdlIGtub3cgaG93IG1hbnkgYmluZGluZ3MgYXJlIGFzc2lnbmVkIHRvIGVhY2ggZGlyZWN0aXZlLlxuICBjb25zdCBjdXJyZW50U2luZ2xlUHJvcHNMZW5ndGggPSBzaW5nbGVQcm9wT2Zmc2V0VmFsdWVzLmxlbmd0aDtcbiAgc2luZ2xlUHJvcE9mZnNldFZhbHVlcy5wdXNoKFxuICAgICAgc3R5bGVCaW5kaW5nTmFtZXMgPyBzdHlsZUJpbmRpbmdOYW1lcy5sZW5ndGggOiAwLFxuICAgICAgY2xhc3NCaW5kaW5nTmFtZXMgPyBjbGFzc0JpbmRpbmdOYW1lcy5sZW5ndGggOiAwKTtcblxuICAvLyB0aGUgY29kZSBiZWxvdyB3aWxsIGNoZWNrIHRvIHNlZSBpZiBhIG5ldyBzdHlsZSBiaW5kaW5nIGFscmVhZHkgZXhpc3RzIGluIHRoZSBjb250ZXh0XG4gIC8vIGlmIHNvIHRoZW4gdGhlcmUgaXMgbm8gcG9pbnQgaW4gaW5zZXJ0aW5nIGl0IGludG8gdGhlIGNvbnRleHQgYWdhaW4uIFdoZXRoZXIgb3Igbm90IGl0XG4gIC8vIGV4aXN0cyB0aGUgc3R5bGluZyBvZmZzZXQgY29kZSB3aWxsIG5vdyBrbm93IGV4YWN0bHkgd2hlcmUgaXQgaXNcbiAgbGV0IGluc2VydGlvbk9mZnNldCA9IDA7XG4gIGNvbnN0IGZpbHRlcmVkU3R5bGVCaW5kaW5nTmFtZXM6IHN0cmluZ1tdID0gW107XG4gIGlmIChzdHlsZUJpbmRpbmdOYW1lcyAmJiBzdHlsZUJpbmRpbmdOYW1lcy5sZW5ndGgpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHN0eWxlQmluZGluZ05hbWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBuYW1lID0gc3R5bGVCaW5kaW5nTmFtZXNbaV07XG4gICAgICBsZXQgc2luZ2xlUHJvcEluZGV4ID1cbiAgICAgICAgICBnZXRNYXRjaGluZ0JpbmRpbmdJbmRleChjb250ZXh0LCBuYW1lLCBzaW5nbGVTdHlsZXNTdGFydEluZGV4LCBzaW5nbGVDbGFzc2VzU3RhcnRJbmRleCk7XG4gICAgICBpZiAoc2luZ2xlUHJvcEluZGV4ID09IC0xKSB7XG4gICAgICAgIHNpbmdsZVByb3BJbmRleCA9IHNpbmdsZUNsYXNzZXNTdGFydEluZGV4ICsgaW5zZXJ0aW9uT2Zmc2V0O1xuICAgICAgICBpbnNlcnRpb25PZmZzZXQgKz0gU3R5bGluZ0luZGV4LlNpemU7XG4gICAgICAgIGZpbHRlcmVkU3R5bGVCaW5kaW5nTmFtZXMucHVzaChuYW1lKTtcbiAgICAgIH1cbiAgICAgIHNpbmdsZVByb3BPZmZzZXRWYWx1ZXMucHVzaChzaW5nbGVQcm9wSW5kZXgpO1xuICAgIH1cbiAgfVxuXG4gIC8vIGp1c3QgbGlrZSB3aXRoIHRoZSBzdHlsZSBiaW5kaW5nIGxvb3AgYWJvdmUsIHRoZSBuZXcgY2xhc3MgYmluZGluZ3MgZ2V0IHRoZSBzYW1lIHRyZWF0bWVudC4uLlxuICBjb25zdCBmaWx0ZXJlZENsYXNzQmluZGluZ05hbWVzOiBzdHJpbmdbXSA9IFtdO1xuICBpZiAoY2xhc3NCaW5kaW5nTmFtZXMgJiYgY2xhc3NCaW5kaW5nTmFtZXMubGVuZ3RoKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjbGFzc0JpbmRpbmdOYW1lcy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgbmFtZSA9IGNsYXNzQmluZGluZ05hbWVzW2ldO1xuICAgICAgbGV0IHNpbmdsZVByb3BJbmRleCA9XG4gICAgICAgICAgZ2V0TWF0Y2hpbmdCaW5kaW5nSW5kZXgoY29udGV4dCwgbmFtZSwgc2luZ2xlQ2xhc3Nlc1N0YXJ0SW5kZXgsIG11bHRpU3R5bGVzU3RhcnRJbmRleCk7XG4gICAgICBpZiAoc2luZ2xlUHJvcEluZGV4ID09IC0xKSB7XG4gICAgICAgIHNpbmdsZVByb3BJbmRleCA9IG11bHRpU3R5bGVzU3RhcnRJbmRleCArIGluc2VydGlvbk9mZnNldDtcbiAgICAgICAgaW5zZXJ0aW9uT2Zmc2V0ICs9IFN0eWxpbmdJbmRleC5TaXplO1xuICAgICAgICBmaWx0ZXJlZENsYXNzQmluZGluZ05hbWVzLnB1c2gobmFtZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzaW5nbGVQcm9wSW5kZXggKz0gZmlsdGVyZWRTdHlsZUJpbmRpbmdOYW1lcy5sZW5ndGggKiBTdHlsaW5nSW5kZXguU2l6ZTtcbiAgICAgIH1cbiAgICAgIHNpbmdsZVByb3BPZmZzZXRWYWx1ZXMucHVzaChzaW5nbGVQcm9wSW5kZXgpO1xuICAgIH1cbiAgfVxuXG4gIC8vIGJlY2F1c2UgbmV3IHN0eWxlcyBhcmUgYmVpbmcgaW5zZXJ0ZWQsIHRoaXMgbWVhbnMgdGhlIGV4aXN0aW5nIGNvbGxlY3Rpb24gb2Ygc3R5bGUgb2Zmc2V0XG4gIC8vIGluZGV4IHZhbHVlcyBhcmUgaW5jb3JyZWN0ICh0aGV5IHBvaW50IHRvIHRoZSB3cm9uZyB2YWx1ZXMpLiBUaGUgY29kZSBiZWxvdyB3aWxsIHJ1biB0aHJvdWdoXG4gIC8vIHRoZSBlbnRpcmUgb2Zmc2V0IGFycmF5IGFuZCB1cGRhdGUgdGhlIGV4aXN0aW5nIHNldCBvZiBpbmRleCB2YWx1ZXMgdG8gcG9pbnQgdG8gdGhlaXIgbmV3XG4gIC8vIGxvY2F0aW9ucyB3aGlsZSB0YWtpbmcgdGhlIG5ldyBiaW5kaW5nIHZhbHVlcyBpbnRvIGNvbnNpZGVyYXRpb24uXG4gIGxldCBpID0gU2luZ2xlUHJvcE9mZnNldFZhbHVlc0luZGV4LlZhbHVlU3RhcnRQb3NpdGlvbjtcbiAgaWYgKGZpbHRlcmVkU3R5bGVCaW5kaW5nTmFtZXMubGVuZ3RoKSB7XG4gICAgd2hpbGUgKGkgPCBjdXJyZW50U2luZ2xlUHJvcHNMZW5ndGgpIHtcbiAgICAgIGNvbnN0IHRvdGFsU3R5bGVzID1cbiAgICAgICAgICBzaW5nbGVQcm9wT2Zmc2V0VmFsdWVzW2kgKyBTaW5nbGVQcm9wT2Zmc2V0VmFsdWVzSW5kZXguU3R5bGVzQ291bnRQb3NpdGlvbl07XG4gICAgICBjb25zdCB0b3RhbENsYXNzZXMgPVxuICAgICAgICAgIHNpbmdsZVByb3BPZmZzZXRWYWx1ZXNbaSArIFNpbmdsZVByb3BPZmZzZXRWYWx1ZXNJbmRleC5DbGFzc2VzQ291bnRQb3NpdGlvbl07XG4gICAgICBpZiAodG90YWxDbGFzc2VzKSB7XG4gICAgICAgIGNvbnN0IHN0YXJ0ID0gaSArIFNpbmdsZVByb3BPZmZzZXRWYWx1ZXNJbmRleC5WYWx1ZVN0YXJ0UG9zaXRpb24gKyB0b3RhbFN0eWxlcztcbiAgICAgICAgZm9yIChsZXQgaiA9IHN0YXJ0OyBqIDwgc3RhcnQgKyB0b3RhbENsYXNzZXM7IGorKykge1xuICAgICAgICAgIHNpbmdsZVByb3BPZmZzZXRWYWx1ZXNbal0gKz0gZmlsdGVyZWRTdHlsZUJpbmRpbmdOYW1lcy5sZW5ndGggKiBTdHlsaW5nSW5kZXguU2l6ZTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBjb25zdCB0b3RhbCA9IHRvdGFsU3R5bGVzICsgdG90YWxDbGFzc2VzO1xuICAgICAgaSArPSBTaW5nbGVQcm9wT2Zmc2V0VmFsdWVzSW5kZXguVmFsdWVTdGFydFBvc2l0aW9uICsgdG90YWw7XG4gICAgfVxuICB9XG5cbiAgY29uc3QgdG90YWxOZXdFbnRyaWVzID0gZmlsdGVyZWRDbGFzc0JpbmRpbmdOYW1lcy5sZW5ndGggKyBmaWx0ZXJlZFN0eWxlQmluZGluZ05hbWVzLmxlbmd0aDtcblxuICAvLyBpbiB0aGUgZXZlbnQgdGhhdCB0aGVyZSBhcmUgbmV3IHN0eWxlIHZhbHVlcyBiZWluZyBpbnNlcnRlZCwgYWxsIGV4aXN0aW5nIGNsYXNzIGFuZCBzdHlsZVxuICAvLyBiaW5kaW5ncyBuZWVkIHRvIGhhdmUgdGhlaXIgcG9pbnRlciB2YWx1ZXMgb2Zmc2V0dGVkIHdpdGggdGhlIG5ldyBhbW91bnQgb2Ygc3BhY2UgdGhhdCBpc1xuICAvLyB1c2VkIGZvciB0aGUgbmV3IHN0eWxlL2NsYXNzIGJpbmRpbmdzLlxuICBmb3IgKGxldCBpID0gc2luZ2xlU3R5bGVzU3RhcnRJbmRleDsgaSA8IGNvbnRleHQubGVuZ3RoOyBpICs9IFN0eWxpbmdJbmRleC5TaXplKSB7XG4gICAgY29uc3QgaXNNdWx0aUJhc2VkID0gaSA+PSBtdWx0aVN0eWxlc1N0YXJ0SW5kZXg7XG4gICAgY29uc3QgaXNDbGFzc0Jhc2VkID0gaSA+PSAoaXNNdWx0aUJhc2VkID8gbXVsdGlDbGFzc2VzU3RhcnRJbmRleCA6IHNpbmdsZUNsYXNzZXNTdGFydEluZGV4KTtcbiAgICBjb25zdCBmbGFnID0gZ2V0UG9pbnRlcnMoY29udGV4dCwgaSk7XG4gICAgY29uc3Qgc3RhdGljSW5kZXggPSBnZXRJbml0aWFsSW5kZXgoZmxhZyk7XG4gICAgbGV0IHNpbmdsZU9yTXVsdGlJbmRleCA9IGdldE11bHRpT3JTaW5nbGVJbmRleChmbGFnKTtcbiAgICBpZiAoaXNNdWx0aUJhc2VkKSB7XG4gICAgICBzaW5nbGVPck11bHRpSW5kZXggKz1cbiAgICAgICAgICBpc0NsYXNzQmFzZWQgPyAoZmlsdGVyZWRTdHlsZUJpbmRpbmdOYW1lcy5sZW5ndGggKiBTdHlsaW5nSW5kZXguU2l6ZSkgOiAwO1xuICAgIH0gZWxzZSB7XG4gICAgICBzaW5nbGVPck11bHRpSW5kZXggKz0gKHRvdGFsTmV3RW50cmllcyAqIFN0eWxpbmdJbmRleC5TaXplKSArXG4gICAgICAgICAgKChpc0NsYXNzQmFzZWQgPyBmaWx0ZXJlZFN0eWxlQmluZGluZ05hbWVzLmxlbmd0aCA6IDApICogU3R5bGluZ0luZGV4LlNpemUpO1xuICAgIH1cbiAgICBzZXRGbGFnKGNvbnRleHQsIGksIHBvaW50ZXJzKGZsYWcsIHN0YXRpY0luZGV4LCBzaW5nbGVPck11bHRpSW5kZXgpKTtcbiAgfVxuXG4gIC8vIHRoaXMgaXMgd2hlcmUgd2UgbWFrZSBzcGFjZSBpbiB0aGUgY29udGV4dCBmb3IgdGhlIG5ldyBzdHlsZSBiaW5kaW5nc1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGZpbHRlcmVkU3R5bGVCaW5kaW5nTmFtZXMubGVuZ3RoICogU3R5bGluZ0luZGV4LlNpemU7IGkrKykge1xuICAgIGNvbnRleHQuc3BsaWNlKG11bHRpQ2xhc3Nlc1N0YXJ0SW5kZXgsIDAsIG51bGwpO1xuICAgIGNvbnRleHQuc3BsaWNlKHNpbmdsZUNsYXNzZXNTdGFydEluZGV4LCAwLCBudWxsKTtcbiAgICBzaW5nbGVDbGFzc2VzU3RhcnRJbmRleCsrO1xuICAgIG11bHRpU3R5bGVzU3RhcnRJbmRleCsrO1xuICAgIG11bHRpQ2xhc3Nlc1N0YXJ0SW5kZXggKz0gMjsgIC8vIGJvdGggc2luZ2xlICsgbXVsdGkgc2xvdHMgd2VyZSBpbnNlcnRlZFxuICB9XG5cbiAgLy8gdGhpcyBpcyB3aGVyZSB3ZSBtYWtlIHNwYWNlIGluIHRoZSBjb250ZXh0IGZvciB0aGUgbmV3IGNsYXNzIGJpbmRpbmdzXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgZmlsdGVyZWRDbGFzc0JpbmRpbmdOYW1lcy5sZW5ndGggKiBTdHlsaW5nSW5kZXguU2l6ZTsgaSsrKSB7XG4gICAgY29udGV4dC5zcGxpY2UobXVsdGlTdHlsZXNTdGFydEluZGV4LCAwLCBudWxsKTtcbiAgICBjb250ZXh0LnB1c2gobnVsbCk7XG4gICAgbXVsdGlTdHlsZXNTdGFydEluZGV4Kys7XG4gICAgbXVsdGlDbGFzc2VzU3RhcnRJbmRleCsrO1xuICB9XG5cbiAgY29uc3QgaW5pdGlhbENsYXNzZXMgPSBjb250ZXh0W1N0eWxpbmdJbmRleC5Jbml0aWFsQ2xhc3NWYWx1ZXNQb3NpdGlvbl07XG4gIGNvbnN0IGluaXRpYWxTdHlsZXMgPSBjb250ZXh0W1N0eWxpbmdJbmRleC5Jbml0aWFsU3R5bGVWYWx1ZXNQb3NpdGlvbl07XG5cbiAgLy8gdGhlIGNvZGUgYmVsb3cgd2lsbCBpbnNlcnQgZWFjaCBuZXcgZW50cnkgaW50byB0aGUgY29udGV4dCBhbmQgYXNzaWduIHRoZSBhcHByb3ByaWF0ZVxuICAvLyBmbGFncyBhbmQgaW5kZXggdmFsdWVzIHRvIHRoZW0uIEl0J3MgaW1wb3J0YW50IHRoaXMgcnVucyBhdCB0aGUgZW5kIG9mIHRoaXMgZnVuY3Rpb25cbiAgLy8gYmVjYXVzZSB0aGUgY29udGV4dCwgcHJvcGVydHkgb2Zmc2V0IGFuZCBpbmRleCB2YWx1ZXMgaGF2ZSBhbGwgYmVlbiBjb21wdXRlZCBqdXN0IGJlZm9yZS5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCB0b3RhbE5ld0VudHJpZXM7IGkrKykge1xuICAgIGNvbnN0IGVudHJ5SXNDbGFzc0Jhc2VkID0gaSA+PSBmaWx0ZXJlZFN0eWxlQmluZGluZ05hbWVzLmxlbmd0aDtcbiAgICBjb25zdCBhZGp1c3RlZEluZGV4ID0gZW50cnlJc0NsYXNzQmFzZWQgPyAoaSAtIGZpbHRlcmVkU3R5bGVCaW5kaW5nTmFtZXMubGVuZ3RoKSA6IGk7XG4gICAgY29uc3QgcHJvcE5hbWUgPSBlbnRyeUlzQ2xhc3NCYXNlZCA/IGZpbHRlcmVkQ2xhc3NCaW5kaW5nTmFtZXNbYWRqdXN0ZWRJbmRleF0gOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaWx0ZXJlZFN0eWxlQmluZGluZ05hbWVzW2FkanVzdGVkSW5kZXhdO1xuXG4gICAgbGV0IG11bHRpSW5kZXgsIHNpbmdsZUluZGV4O1xuICAgIGlmIChlbnRyeUlzQ2xhc3NCYXNlZCkge1xuICAgICAgbXVsdGlJbmRleCA9IG11bHRpQ2xhc3Nlc1N0YXJ0SW5kZXggK1xuICAgICAgICAgICgodG90YWxDdXJyZW50Q2xhc3NCaW5kaW5ncyArIGFkanVzdGVkSW5kZXgpICogU3R5bGluZ0luZGV4LlNpemUpO1xuICAgICAgc2luZ2xlSW5kZXggPSBzaW5nbGVDbGFzc2VzU3RhcnRJbmRleCArXG4gICAgICAgICAgKCh0b3RhbEN1cnJlbnRDbGFzc0JpbmRpbmdzICsgYWRqdXN0ZWRJbmRleCkgKiBTdHlsaW5nSW5kZXguU2l6ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG11bHRpSW5kZXggPVxuICAgICAgICAgIG11bHRpU3R5bGVzU3RhcnRJbmRleCArICgodG90YWxDdXJyZW50U3R5bGVCaW5kaW5ncyArIGFkanVzdGVkSW5kZXgpICogU3R5bGluZ0luZGV4LlNpemUpO1xuICAgICAgc2luZ2xlSW5kZXggPSBzaW5nbGVTdHlsZXNTdGFydEluZGV4ICtcbiAgICAgICAgICAoKHRvdGFsQ3VycmVudFN0eWxlQmluZGluZ3MgKyBhZGp1c3RlZEluZGV4KSAqIFN0eWxpbmdJbmRleC5TaXplKTtcbiAgICB9XG5cbiAgICAvLyBpZiBhIHByb3BlcnR5IGlzIG5vdCBmb3VuZCBpbiB0aGUgaW5pdGlhbCBzdHlsZSB2YWx1ZXMgbGlzdCB0aGVuIGl0XG4gICAgLy8gaXMgQUxXQVlTIGFkZGVkIGluY2FzZSBhIGZvbGxvdy11cCBkaXJlY3RpdmUgaW50cm9kdWNlcyB0aGUgc2FtZSBpbml0aWFsXG4gICAgLy8gc3R5bGUvY2xhc3MgdmFsdWUgbGF0ZXIgb24uXG4gICAgbGV0IGluaXRpYWxWYWx1ZXNUb0xvb2t1cCA9IGVudHJ5SXNDbGFzc0Jhc2VkID8gaW5pdGlhbENsYXNzZXMgOiBpbml0aWFsU3R5bGVzO1xuICAgIGxldCBpbmRleEZvckluaXRpYWwgPSBnZXRJbml0aWFsU3R5bGluZ1ZhbHVlc0luZGV4T2YoaW5pdGlhbFZhbHVlc1RvTG9va3VwLCBwcm9wTmFtZSk7XG4gICAgaWYgKGluZGV4Rm9ySW5pdGlhbCA9PT0gLTEpIHtcbiAgICAgIGluZGV4Rm9ySW5pdGlhbCA9IGluaXRpYWxWYWx1ZXNUb0xvb2t1cC5sZW5ndGggKyBJbml0aWFsU3R5bGluZ1ZhbHVlc0luZGV4LlZhbHVlT2Zmc2V0O1xuICAgICAgaW5pdGlhbFZhbHVlc1RvTG9va3VwLnB1c2gocHJvcE5hbWUsIGVudHJ5SXNDbGFzc0Jhc2VkID8gZmFsc2UgOiBudWxsKTtcbiAgICB9IGVsc2Uge1xuICAgICAgaW5kZXhGb3JJbml0aWFsICs9IEluaXRpYWxTdHlsaW5nVmFsdWVzSW5kZXguVmFsdWVPZmZzZXQ7XG4gICAgfVxuXG4gICAgY29uc3QgaW5pdGlhbEZsYWcgPVxuICAgICAgICBwcmVwYXJlSW5pdGlhbEZsYWcoY29udGV4dCwgcHJvcE5hbWUsIGVudHJ5SXNDbGFzc0Jhc2VkLCBzdHlsZVNhbml0aXplciB8fCBudWxsKTtcblxuICAgIHNldEZsYWcoY29udGV4dCwgc2luZ2xlSW5kZXgsIHBvaW50ZXJzKGluaXRpYWxGbGFnLCBpbmRleEZvckluaXRpYWwsIG11bHRpSW5kZXgpKTtcbiAgICBzZXRQcm9wKGNvbnRleHQsIHNpbmdsZUluZGV4LCBwcm9wTmFtZSk7XG4gICAgc2V0VmFsdWUoY29udGV4dCwgc2luZ2xlSW5kZXgsIG51bGwpO1xuICAgIHNldFBsYXllckJ1aWxkZXJJbmRleChjb250ZXh0LCBzaW5nbGVJbmRleCwgMCwgZGlyZWN0aXZlSW5kZXgpO1xuXG4gICAgc2V0RmxhZyhjb250ZXh0LCBtdWx0aUluZGV4LCBwb2ludGVycyhpbml0aWFsRmxhZywgaW5kZXhGb3JJbml0aWFsLCBzaW5nbGVJbmRleCkpO1xuICAgIHNldFByb3AoY29udGV4dCwgbXVsdGlJbmRleCwgcHJvcE5hbWUpO1xuICAgIHNldFZhbHVlKGNvbnRleHQsIG11bHRpSW5kZXgsIG51bGwpO1xuICAgIHNldFBsYXllckJ1aWxkZXJJbmRleChjb250ZXh0LCBtdWx0aUluZGV4LCAwLCBkaXJlY3RpdmVJbmRleCk7XG4gIH1cblxuICAvLyB0aGUgdG90YWwgY2xhc3Nlcy9zdHlsZSB2YWx1ZXMgYXJlIHVwZGF0ZWQgc28gdGhlIG5leHQgdGltZSB0aGUgY29udGV4dCBpcyBwYXRjaGVkXG4gIC8vIGFkZGl0aW9uYWwgc3R5bGUvY2xhc3MgYmluZGluZ3MgZnJvbSBhbm90aGVyIGRpcmVjdGl2ZSB0aGVuIGl0IGtub3dzIGV4YWN0bHkgd2hlcmVcbiAgLy8gdG8gaW5zZXJ0IHRoZW0gaW4gdGhlIGNvbnRleHRcbiAgc2luZ2xlUHJvcE9mZnNldFZhbHVlc1tTaW5nbGVQcm9wT2Zmc2V0VmFsdWVzSW5kZXguQ2xhc3Nlc0NvdW50UG9zaXRpb25dID1cbiAgICAgIHRvdGFsQ3VycmVudENsYXNzQmluZGluZ3MgKyBmaWx0ZXJlZENsYXNzQmluZGluZ05hbWVzLmxlbmd0aDtcbiAgc2luZ2xlUHJvcE9mZnNldFZhbHVlc1tTaW5nbGVQcm9wT2Zmc2V0VmFsdWVzSW5kZXguU3R5bGVzQ291bnRQb3NpdGlvbl0gPVxuICAgICAgdG90YWxDdXJyZW50U3R5bGVCaW5kaW5ncyArIGZpbHRlcmVkU3R5bGVCaW5kaW5nTmFtZXMubGVuZ3RoO1xuXG4gIC8vIHRoZSBtYXAtYmFzZWQgdmFsdWVzIGFsc28gbmVlZCB0byBrbm93IGhvdyBtYW55IGVudHJpZXMgZ290IGluc2VydGVkXG4gIGNhY2hlZENsYXNzTWFwVmFsdWVzW01hcEJhc2VkT2Zmc2V0VmFsdWVzSW5kZXguRW50cmllc0NvdW50UG9zaXRpb25dICs9XG4gICAgICBmaWx0ZXJlZENsYXNzQmluZGluZ05hbWVzLmxlbmd0aDtcbiAgY2FjaGVkU3R5bGVNYXBWYWx1ZXNbTWFwQmFzZWRPZmZzZXRWYWx1ZXNJbmRleC5FbnRyaWVzQ291bnRQb3NpdGlvbl0gKz1cbiAgICAgIGZpbHRlcmVkU3R5bGVCaW5kaW5nTmFtZXMubGVuZ3RoO1xuICBjb25zdCBuZXdTdHlsZXNTcGFjZUFsbG9jYXRpb25TaXplID0gZmlsdGVyZWRTdHlsZUJpbmRpbmdOYW1lcy5sZW5ndGggKiBTdHlsaW5nSW5kZXguU2l6ZTtcbiAgY29uc3QgbmV3Q2xhc3Nlc1NwYWNlQWxsb2NhdGlvblNpemUgPSBmaWx0ZXJlZENsYXNzQmluZGluZ05hbWVzLmxlbmd0aCAqIFN0eWxpbmdJbmRleC5TaXplO1xuXG4gIC8vIHVwZGF0ZSB0aGUgbXVsdGkgc3R5bGVzIGNhY2hlIHdpdGggYSByZWZlcmVuY2UgZm9yIHRoZSBkaXJlY3RpdmUgdGhhdCB3YXMganVzdCBpbnNlcnRlZFxuICBjb25zdCBkaXJlY3RpdmVNdWx0aVN0eWxlc1N0YXJ0SW5kZXggPVxuICAgICAgbXVsdGlTdHlsZXNTdGFydEluZGV4ICsgdG90YWxDdXJyZW50U3R5bGVCaW5kaW5ncyAqIFN0eWxpbmdJbmRleC5TaXplO1xuICBjb25zdCBjYWNoZWRTdHlsZU1hcEluZGV4ID0gY2FjaGVkU3R5bGVNYXBWYWx1ZXMubGVuZ3RoO1xuICByZWdpc3Rlck11bHRpTWFwRW50cnkoXG4gICAgICBjb250ZXh0LCBkaXJlY3RpdmVJbmRleCwgZmFsc2UsIGRpcmVjdGl2ZU11bHRpU3R5bGVzU3RhcnRJbmRleCxcbiAgICAgIGZpbHRlcmVkU3R5bGVCaW5kaW5nTmFtZXMubGVuZ3RoKTtcblxuICBmb3IgKGxldCBpID0gTWFwQmFzZWRPZmZzZXRWYWx1ZXNJbmRleC5WYWx1ZXNTdGFydFBvc2l0aW9uOyBpIDwgY2FjaGVkU3R5bGVNYXBJbmRleDtcbiAgICAgICBpICs9IE1hcEJhc2VkT2Zmc2V0VmFsdWVzSW5kZXguU2l6ZSkge1xuICAgIC8vIG11bHRpIHZhbHVlcyBzdGFydCBhZnRlciBhbGwgdGhlIHNpbmdsZSB2YWx1ZXMgKHdoaWNoIGlzIGFsc28gd2hlcmUgY2xhc3NlcyBhcmUpIGluIHRoZVxuICAgIC8vIGNvbnRleHQgdGhlcmVmb3JlIHRoZSBuZXcgY2xhc3MgYWxsb2NhdGlvbiBzaXplIHNob3VsZCBiZSB0YWtlbiBpbnRvIGFjY291bnRcbiAgICBjYWNoZWRTdHlsZU1hcFZhbHVlc1tpICsgTWFwQmFzZWRPZmZzZXRWYWx1ZXNJbmRleC5Qb3NpdGlvblN0YXJ0T2Zmc2V0XSArPVxuICAgICAgICBuZXdDbGFzc2VzU3BhY2VBbGxvY2F0aW9uU2l6ZSArIG5ld1N0eWxlc1NwYWNlQWxsb2NhdGlvblNpemU7XG4gIH1cblxuICAvLyB1cGRhdGUgdGhlIG11bHRpIGNsYXNzZXMgY2FjaGUgd2l0aCBhIHJlZmVyZW5jZSBmb3IgdGhlIGRpcmVjdGl2ZSB0aGF0IHdhcyBqdXN0IGluc2VydGVkXG4gIGNvbnN0IGRpcmVjdGl2ZU11bHRpQ2xhc3Nlc1N0YXJ0SW5kZXggPVxuICAgICAgbXVsdGlDbGFzc2VzU3RhcnRJbmRleCArIHRvdGFsQ3VycmVudENsYXNzQmluZGluZ3MgKiBTdHlsaW5nSW5kZXguU2l6ZTtcbiAgY29uc3QgY2FjaGVkQ2xhc3NNYXBJbmRleCA9IGNhY2hlZENsYXNzTWFwVmFsdWVzLmxlbmd0aDtcbiAgcmVnaXN0ZXJNdWx0aU1hcEVudHJ5KFxuICAgICAgY29udGV4dCwgZGlyZWN0aXZlSW5kZXgsIHRydWUsIGRpcmVjdGl2ZU11bHRpQ2xhc3Nlc1N0YXJ0SW5kZXgsXG4gICAgICBmaWx0ZXJlZENsYXNzQmluZGluZ05hbWVzLmxlbmd0aCk7XG5cbiAgZm9yIChsZXQgaSA9IE1hcEJhc2VkT2Zmc2V0VmFsdWVzSW5kZXguVmFsdWVzU3RhcnRQb3NpdGlvbjsgaSA8IGNhY2hlZENsYXNzTWFwSW5kZXg7XG4gICAgICAgaSArPSBNYXBCYXNlZE9mZnNldFZhbHVlc0luZGV4LlNpemUpIHtcbiAgICAvLyB0aGUgcmVhc29uIHdoeSBib3RoIHRoZSBzdHlsZXMgKyBjbGFzc2VzIHNwYWNlIGlzIGFsbG9jYXRlZCB0byB0aGUgZXhpc3Rpbmcgb2Zmc2V0cyBpc1xuICAgIC8vIGJlY2F1c2UgdGhlIHN0eWxlcyBzaG93IHVwIGJlZm9yZSB0aGUgY2xhc3NlcyBpbiB0aGUgY29udGV4dCBhbmQgYW55IG5ldyBpbnNlcnRlZFxuICAgIC8vIHN0eWxlcyB3aWxsIG9mZnNldCBhbnkgZXhpc3RpbmcgY2xhc3MgZW50cmllcyBpbiB0aGUgY29udGV4dCAoZXZlbiBpZiB0aGVyZSBhcmUgbm9cbiAgICAvLyBuZXcgY2xhc3MgZW50cmllcyBhZGRlZCkgYWxzbyB0aGUgcmVhc29uIHdoeSBpdCdzICoyIGlzIGJlY2F1c2UgYm90aCBzaW5nbGUgKyBtdWx0aVxuICAgIC8vIGVudHJpZXMgZm9yIGVhY2ggbmV3IHN0eWxlIGhhdmUgYmVlbiBhZGRlZCBpbiB0aGUgY29udGV4dCBiZWZvcmUgdGhlIG11bHRpIGNsYXNzIHZhbHVlc1xuICAgIC8vIGFjdHVhbGx5IHN0YXJ0XG4gICAgY2FjaGVkQ2xhc3NNYXBWYWx1ZXNbaSArIE1hcEJhc2VkT2Zmc2V0VmFsdWVzSW5kZXguUG9zaXRpb25TdGFydE9mZnNldF0gKz1cbiAgICAgICAgKG5ld1N0eWxlc1NwYWNlQWxsb2NhdGlvblNpemUgKiAyKSArIG5ld0NsYXNzZXNTcGFjZUFsbG9jYXRpb25TaXplO1xuICB9XG5cbiAgLy8gdGhlcmUgaXMgbm8gaW5pdGlhbCB2YWx1ZSBmbGFnIGZvciB0aGUgbWFzdGVyIGluZGV4IHNpbmNlIGl0IGRvZXNuJ3RcbiAgLy8gcmVmZXJlbmNlIGFuIGluaXRpYWwgc3R5bGUgdmFsdWVcbiAgY29uc3QgbWFzdGVyRmxhZyA9IHBvaW50ZXJzKDAsIDAsIG11bHRpU3R5bGVzU3RhcnRJbmRleCk7XG4gIHNldEZsYWcoY29udGV4dCwgU3R5bGluZ0luZGV4Lk1hc3RlckZsYWdQb3NpdGlvbiwgbWFzdGVyRmxhZyk7XG59XG5cbi8qKlxuICogU2VhcmNoZXMgdGhyb3VnaCB0aGUgZXhpc3RpbmcgcmVnaXN0cnkgb2YgZGlyZWN0aXZlc1xuICovXG5leHBvcnQgZnVuY3Rpb24gZmluZE9yUGF0Y2hEaXJlY3RpdmVJbnRvUmVnaXN0cnkoXG4gICAgY29udGV4dDogU3R5bGluZ0NvbnRleHQsIGRpcmVjdGl2ZVJlZjogYW55LCBzdHlsZVNhbml0aXplcj86IFN0eWxlU2FuaXRpemVGbiB8IG51bGwpIHtcbiAgY29uc3QgZGlyZWN0aXZlUmVmcyA9IGNvbnRleHRbU3R5bGluZ0luZGV4LkRpcmVjdGl2ZVJlZ2lzdHJ5UG9zaXRpb25dO1xuICBjb25zdCBuZXh0T2Zmc2V0SW5zZXJ0aW9uSW5kZXggPSBjb250ZXh0W1N0eWxpbmdJbmRleC5TaW5nbGVQcm9wT2Zmc2V0UG9zaXRpb25zXS5sZW5ndGg7XG5cbiAgbGV0IGRpcmVjdGl2ZUluZGV4OiBudW1iZXI7XG4gIGxldCBkZXRlY3RlZEluZGV4ID0gZ2V0RGlyZWN0aXZlUmVnaXN0cnlWYWx1ZXNJbmRleE9mKGRpcmVjdGl2ZVJlZnMsIGRpcmVjdGl2ZVJlZik7XG5cbiAgaWYgKGRldGVjdGVkSW5kZXggPT09IC0xKSB7XG4gICAgZGV0ZWN0ZWRJbmRleCA9IGRpcmVjdGl2ZVJlZnMubGVuZ3RoO1xuICAgIGRpcmVjdGl2ZUluZGV4ID0gZGlyZWN0aXZlUmVmcy5sZW5ndGggLyBEaXJlY3RpdmVSZWdpc3RyeVZhbHVlc0luZGV4LlNpemU7XG5cbiAgICBhbGxvY2F0ZURpcmVjdGl2ZUludG9Db250ZXh0KGNvbnRleHQsIGRpcmVjdGl2ZVJlZik7XG4gICAgZGlyZWN0aXZlUmVmc1tkZXRlY3RlZEluZGV4ICsgRGlyZWN0aXZlUmVnaXN0cnlWYWx1ZXNJbmRleC5TaW5nbGVQcm9wVmFsdWVzSW5kZXhPZmZzZXRdID1cbiAgICAgICAgbmV4dE9mZnNldEluc2VydGlvbkluZGV4O1xuICAgIGRpcmVjdGl2ZVJlZnNbZGV0ZWN0ZWRJbmRleCArIERpcmVjdGl2ZVJlZ2lzdHJ5VmFsdWVzSW5kZXguU3R5bGVTYW5pdGl6ZXJPZmZzZXRdID1cbiAgICAgICAgc3R5bGVTYW5pdGl6ZXIgfHwgbnVsbDtcbiAgfSBlbHNlIHtcbiAgICBjb25zdCBzaW5nbGVQcm9wU3RhcnRQb3NpdGlvbiA9XG4gICAgICAgIGRldGVjdGVkSW5kZXggKyBEaXJlY3RpdmVSZWdpc3RyeVZhbHVlc0luZGV4LlNpbmdsZVByb3BWYWx1ZXNJbmRleE9mZnNldDtcbiAgICBpZiAoZGlyZWN0aXZlUmVmc1tzaW5nbGVQcm9wU3RhcnRQb3NpdGlvbl0gISA+PSAwKSB7XG4gICAgICAvLyB0aGUgZGlyZWN0aXZlIGhhcyBhbHJlYWR5IGJlZW4gcGF0Y2hlZCBpbnRvIHRoZSBjb250ZXh0XG4gICAgICByZXR1cm4gLTE7XG4gICAgfVxuXG4gICAgZGlyZWN0aXZlSW5kZXggPSBkZXRlY3RlZEluZGV4IC8gRGlyZWN0aXZlUmVnaXN0cnlWYWx1ZXNJbmRleC5TaXplO1xuXG4gICAgLy8gYmVjYXVzZSB0aGUgZGlyZWN0aXZlIGFscmVhZHkgZXhpc3RlZCB0aGlzIG1lYW5zIHRoYXQgaXQgd2FzIHNldCBkdXJpbmcgZWxlbWVudEhvc3RBdHRycyBvclxuICAgIC8vIGVsZW1lbnRTdGFydCB3aGljaCBtZWFucyB0aGF0IHRoZSBiaW5kaW5nIHZhbHVlcyB3ZXJlIG5vdCBoZXJlLiBUaGVyZWZvcmUsIHRoZSB2YWx1ZXMgYmVsb3dcbiAgICAvLyBuZWVkIHRvIGJlIGFwcGxpZWQgc28gdGhhdCBzaW5nbGUgY2xhc3MgYW5kIHN0eWxlIHByb3BlcnRpZXMgY2FuIGJlIGFzc2lnbmVkIGxhdGVyLlxuICAgIGNvbnN0IHNpbmdsZVByb3BQb3NpdGlvbkluZGV4ID1cbiAgICAgICAgZGV0ZWN0ZWRJbmRleCArIERpcmVjdGl2ZVJlZ2lzdHJ5VmFsdWVzSW5kZXguU2luZ2xlUHJvcFZhbHVlc0luZGV4T2Zmc2V0O1xuICAgIGRpcmVjdGl2ZVJlZnNbc2luZ2xlUHJvcFBvc2l0aW9uSW5kZXhdID0gbmV4dE9mZnNldEluc2VydGlvbkluZGV4O1xuXG4gICAgLy8gdGhlIHNhbml0aXplciBpcyBhbHNvIGFwYXJ0IG9mIHRoZSBiaW5kaW5nIHByb2Nlc3MgYW5kIHdpbGwgYmUgdXNlZCB3aGVuIGJpbmRpbmdzIGFyZVxuICAgIC8vIGFwcGxpZWQuXG4gICAgY29uc3Qgc3R5bGVTYW5pdGl6ZXJJbmRleCA9IGRldGVjdGVkSW5kZXggKyBEaXJlY3RpdmVSZWdpc3RyeVZhbHVlc0luZGV4LlN0eWxlU2FuaXRpemVyT2Zmc2V0O1xuICAgIGRpcmVjdGl2ZVJlZnNbc3R5bGVTYW5pdGl6ZXJJbmRleF0gPSBzdHlsZVNhbml0aXplciB8fCBudWxsO1xuICB9XG5cbiAgcmV0dXJuIGRpcmVjdGl2ZUluZGV4O1xufVxuXG5mdW5jdGlvbiBnZXRNYXRjaGluZ0JpbmRpbmdJbmRleChcbiAgICBjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgYmluZGluZ05hbWU6IHN0cmluZywgc3RhcnQ6IG51bWJlciwgZW5kOiBudW1iZXIpIHtcbiAgZm9yIChsZXQgaiA9IHN0YXJ0OyBqIDwgZW5kOyBqICs9IFN0eWxpbmdJbmRleC5TaXplKSB7XG4gICAgaWYgKGdldFByb3AoY29udGV4dCwgaikgPT09IGJpbmRpbmdOYW1lKSByZXR1cm4gajtcbiAgfVxuICByZXR1cm4gLTE7XG59XG5cbi8qKlxuICogUmVnaXN0ZXJzIHRoZSBwcm92aWRlZCBtdWx0aSBzdHlsaW5nIChgW3N0eWxlXWAgYW5kIGBbY2xhc3NdYCkgdmFsdWVzIHRvIHRoZSBjb250ZXh0LlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gd2lsbCBpdGVyYXRlIG92ZXIgdGhlIHByb3ZpZGVkIGBjbGFzc2VzSW5wdXRgIGFuZCBgc3R5bGVzSW5wdXRgIG1hcFxuICogdmFsdWVzIGFuZCBpbnNlcnQvdXBkYXRlIG9yIHJlbW92ZSB0aGVtIGZyb20gdGhlIGNvbnRleHQgYXQgZXhhY3RseSB0aGUgcmlnaHRcbiAqIHNwb3QuXG4gKlxuICogVGhpcyBmdW5jdGlvbiBhbHNvIHRha2VzIGluIGEgZGlyZWN0aXZlIHdoaWNoIGltcGxpZXMgdGhhdCB0aGUgc3R5bGluZyB2YWx1ZXMgd2lsbFxuICogYmUgZXZhbHVhdGVkIGZvciB0aGF0IGRpcmVjdGl2ZSB3aXRoIHJlc3BlY3QgdG8gYW55IG90aGVyIHN0eWxpbmcgdGhhdCBhbHJlYWR5IGV4aXN0c1xuICogb24gdGhlIGNvbnRleHQuIFdoZW4gdGhlcmUgYXJlIHN0eWxlcyB0aGF0IGNvbmZsaWN0IChlLmcuIHNheSBgbmdTdHlsZWAgYW5kIGBbc3R5bGVdYFxuICogYm90aCB1cGRhdGUgdGhlIGB3aWR0aGAgcHJvcGVydHkgYXQgdGhlIHNhbWUgdGltZSkgdGhlbiB0aGUgc3R5bGluZyBhbGdvcml0aG0gY29kZSBiZWxvd1xuICogd2lsbCBkZWNpZGUgd2hpY2ggb25lIHdpbnMgYmFzZWQgb24gdGhlIGRpcmVjdGl2ZSBzdHlsaW5nIHByaW9yaXRpemF0aW9uIG1lY2hhbmlzbS4gVGhpc1xuICogbWVjaGFuaXNtIGlzIGJldHRlciBleHBsYWluZWQgaW4gcmVuZGVyMy9pbnRlcmZhY2VzL3N0eWxpbmcudHMjZGlyZWN0aXZlcykuXG4gKlxuICogVGhpcyBmdW5jdGlvbiB3aWxsIG5vdCByZW5kZXIgYW55IHN0eWxpbmcgdmFsdWVzIG9uIHNjcmVlbiwgYnV0IGlzIHJhdGhlciBkZXNpZ25lZCB0b1xuICogcHJlcGFyZSB0aGUgY29udGV4dCBmb3IgdGhhdC4gYHJlbmRlclN0eWxpbmdgIG11c3QgYmUgY2FsbGVkIGFmdGVyd2FyZHMgdG8gcmVuZGVyIGFueVxuICogc3R5bGluZyBkYXRhIHRoYXQgd2FzIHNldCBpbiB0aGlzIGZ1bmN0aW9uIChub3RlIHRoYXQgYHVwZGF0ZUNsYXNzUHJvcGAgYW5kXG4gKiBgdXBkYXRlU3R5bGVQcm9wYCBhcmUgZGVzaWduZWQgdG8gYmUgcnVuIGFmdGVyIHRoaXMgZnVuY3Rpb24gaXMgcnVuKS5cbiAqXG4gKiBAcGFyYW0gY29udGV4dCBUaGUgc3R5bGluZyBjb250ZXh0IHRoYXQgd2lsbCBiZSB1cGRhdGVkIHdpdGggdGhlXG4gKiAgICBuZXdseSBwcm92aWRlZCBzdHlsZSB2YWx1ZXMuXG4gKiBAcGFyYW0gY2xhc3Nlc0lucHV0IFRoZSBrZXkvdmFsdWUgbWFwIG9mIENTUyBjbGFzcyBuYW1lcyB0aGF0IHdpbGwgYmUgdXNlZCBmb3IgdGhlIHVwZGF0ZS5cbiAqIEBwYXJhbSBzdHlsZXNJbnB1dCBUaGUga2V5L3ZhbHVlIG1hcCBvZiBDU1Mgc3R5bGVzIHRoYXQgd2lsbCBiZSB1c2VkIGZvciB0aGUgdXBkYXRlLlxuICogQHBhcmFtIGRpcmVjdGl2ZVJlZiBhbiBvcHRpb25hbCByZWZlcmVuY2UgdG8gdGhlIGRpcmVjdGl2ZSByZXNwb25zaWJsZVxuICogICAgZm9yIHRoaXMgYmluZGluZyBjaGFuZ2UuIElmIHByZXNlbnQgdGhlbiBzdHlsZSBiaW5kaW5nIHdpbGwgb25seVxuICogICAgYWN0dWFsaXplIGlmIHRoZSBkaXJlY3RpdmUgaGFzIG93bmVyc2hpcCBvdmVyIHRoaXMgYmluZGluZ1xuICogICAgKHNlZSBzdHlsaW5nLnRzI2RpcmVjdGl2ZXMgZm9yIG1vcmUgaW5mb3JtYXRpb24gYWJvdXQgdGhlIGFsZ29yaXRobSkuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB1cGRhdGVTdHlsaW5nTWFwKFxuICAgIGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBjbGFzc2VzSW5wdXQ6IHtba2V5OiBzdHJpbmddOiBhbnl9IHwgc3RyaW5nIHxcbiAgICAgICAgQm91bmRQbGF5ZXJGYWN0b3J5PG51bGx8c3RyaW5nfHtba2V5OiBzdHJpbmddOiBhbnl9PnwgbnVsbCxcbiAgICBzdHlsZXNJbnB1dD86IHtba2V5OiBzdHJpbmddOiBhbnl9IHwgQm91bmRQbGF5ZXJGYWN0b3J5PG51bGx8e1trZXk6IHN0cmluZ106IGFueX0+fCBudWxsLFxuICAgIGRpcmVjdGl2ZVJlZj86IGFueSk6IHZvaWQge1xuICBjb25zdCBkaXJlY3RpdmVJbmRleCA9IGdldERpcmVjdGl2ZUluZGV4RnJvbVJlZ2lzdHJ5KGNvbnRleHQsIGRpcmVjdGl2ZVJlZiB8fCBudWxsKTtcblxuICBjbGFzc2VzSW5wdXQgPSBjbGFzc2VzSW5wdXQgfHwgbnVsbDtcbiAgc3R5bGVzSW5wdXQgPSBzdHlsZXNJbnB1dCB8fCBudWxsO1xuICBjb25zdCBpZ25vcmVBbGxDbGFzc1VwZGF0ZXMgPSBpc011bHRpVmFsdWVDYWNoZUhpdChjb250ZXh0LCB0cnVlLCBkaXJlY3RpdmVJbmRleCwgY2xhc3Nlc0lucHV0KTtcbiAgY29uc3QgaWdub3JlQWxsU3R5bGVVcGRhdGVzID0gaXNNdWx0aVZhbHVlQ2FjaGVIaXQoY29udGV4dCwgZmFsc2UsIGRpcmVjdGl2ZUluZGV4LCBzdHlsZXNJbnB1dCk7XG5cbiAgLy8gZWFybHkgZXhpdCAodGhpcyBpcyB3aGF0J3MgZG9uZSB0byBhdm9pZCB1c2luZyBjdHguYmluZCgpIHRvIGNhY2hlIHRoZSB2YWx1ZSlcbiAgaWYgKGlnbm9yZUFsbENsYXNzVXBkYXRlcyAmJiBpZ25vcmVBbGxTdHlsZVVwZGF0ZXMpIHJldHVybjtcblxuICBjbGFzc2VzSW5wdXQgPVxuICAgICAgY2xhc3Nlc0lucHV0ID09PSBOT19DSEFOR0UgPyByZWFkQ2FjaGVkTWFwVmFsdWUoY29udGV4dCwgdHJ1ZSwgZGlyZWN0aXZlSW5kZXgpIDogY2xhc3Nlc0lucHV0O1xuICBzdHlsZXNJbnB1dCA9XG4gICAgICBzdHlsZXNJbnB1dCA9PT0gTk9fQ0hBTkdFID8gcmVhZENhY2hlZE1hcFZhbHVlKGNvbnRleHQsIGZhbHNlLCBkaXJlY3RpdmVJbmRleCkgOiBzdHlsZXNJbnB1dDtcblxuICBjb25zdCBlbGVtZW50ID0gY29udGV4dFtTdHlsaW5nSW5kZXguRWxlbWVudFBvc2l0aW9uXSAhYXMgSFRNTEVsZW1lbnQ7XG4gIGNvbnN0IGNsYXNzZXNQbGF5ZXJCdWlsZGVyID0gY2xhc3Nlc0lucHV0IGluc3RhbmNlb2YgQm91bmRQbGF5ZXJGYWN0b3J5ID9cbiAgICAgIG5ldyBDbGFzc0FuZFN0eWxlUGxheWVyQnVpbGRlcihjbGFzc2VzSW5wdXQgYXMgYW55LCBlbGVtZW50LCBCaW5kaW5nVHlwZS5DbGFzcykgOlxuICAgICAgbnVsbDtcbiAgY29uc3Qgc3R5bGVzUGxheWVyQnVpbGRlciA9IHN0eWxlc0lucHV0IGluc3RhbmNlb2YgQm91bmRQbGF5ZXJGYWN0b3J5ID9cbiAgICAgIG5ldyBDbGFzc0FuZFN0eWxlUGxheWVyQnVpbGRlcihzdHlsZXNJbnB1dCBhcyBhbnksIGVsZW1lbnQsIEJpbmRpbmdUeXBlLlN0eWxlKSA6XG4gICAgICBudWxsO1xuXG4gIGNvbnN0IGNsYXNzZXNWYWx1ZSA9IGNsYXNzZXNQbGF5ZXJCdWlsZGVyID9cbiAgICAgIChjbGFzc2VzSW5wdXQgYXMgQm91bmRQbGF5ZXJGYWN0b3J5PHtba2V5OiBzdHJpbmddOiBhbnl9fHN0cmluZz4pICEudmFsdWUgOlxuICAgICAgY2xhc3Nlc0lucHV0O1xuICBjb25zdCBzdHlsZXNWYWx1ZSA9IHN0eWxlc1BsYXllckJ1aWxkZXIgPyBzdHlsZXNJbnB1dCAhLnZhbHVlIDogc3R5bGVzSW5wdXQ7XG5cbiAgbGV0IGNsYXNzTmFtZXM6IHN0cmluZ1tdID0gRU1QVFlfQVJSQVk7XG4gIGxldCBhcHBseUFsbENsYXNzZXMgPSBmYWxzZTtcbiAgbGV0IHBsYXllckJ1aWxkZXJzQXJlRGlydHkgPSBmYWxzZTtcblxuICBjb25zdCBjbGFzc2VzUGxheWVyQnVpbGRlckluZGV4ID1cbiAgICAgIGNsYXNzZXNQbGF5ZXJCdWlsZGVyID8gUGxheWVySW5kZXguQ2xhc3NNYXBQbGF5ZXJCdWlsZGVyUG9zaXRpb24gOiAwO1xuICBpZiAoaGFzUGxheWVyQnVpbGRlckNoYW5nZWQoXG4gICAgICAgICAgY29udGV4dCwgY2xhc3Nlc1BsYXllckJ1aWxkZXIsIFBsYXllckluZGV4LkNsYXNzTWFwUGxheWVyQnVpbGRlclBvc2l0aW9uKSkge1xuICAgIHNldFBsYXllckJ1aWxkZXIoY29udGV4dCwgY2xhc3Nlc1BsYXllckJ1aWxkZXIsIFBsYXllckluZGV4LkNsYXNzTWFwUGxheWVyQnVpbGRlclBvc2l0aW9uKTtcbiAgICBwbGF5ZXJCdWlsZGVyc0FyZURpcnR5ID0gdHJ1ZTtcbiAgfVxuXG4gIGNvbnN0IHN0eWxlc1BsYXllckJ1aWxkZXJJbmRleCA9XG4gICAgICBzdHlsZXNQbGF5ZXJCdWlsZGVyID8gUGxheWVySW5kZXguU3R5bGVNYXBQbGF5ZXJCdWlsZGVyUG9zaXRpb24gOiAwO1xuICBpZiAoaGFzUGxheWVyQnVpbGRlckNoYW5nZWQoXG4gICAgICAgICAgY29udGV4dCwgc3R5bGVzUGxheWVyQnVpbGRlciwgUGxheWVySW5kZXguU3R5bGVNYXBQbGF5ZXJCdWlsZGVyUG9zaXRpb24pKSB7XG4gICAgc2V0UGxheWVyQnVpbGRlcihjb250ZXh0LCBzdHlsZXNQbGF5ZXJCdWlsZGVyLCBQbGF5ZXJJbmRleC5TdHlsZU1hcFBsYXllckJ1aWxkZXJQb3NpdGlvbik7XG4gICAgcGxheWVyQnVpbGRlcnNBcmVEaXJ0eSA9IHRydWU7XG4gIH1cblxuICAvLyBlYWNoIHRpbWUgYSBzdHJpbmctYmFzZWQgdmFsdWUgcG9wcyB1cCB0aGVuIGl0IHNob3VsZG4ndCByZXF1aXJlIGEgZGVlcFxuICAvLyBjaGVjayBvZiB3aGF0J3MgY2hhbmdlZC5cbiAgaWYgKCFpZ25vcmVBbGxDbGFzc1VwZGF0ZXMpIHtcbiAgICBpZiAodHlwZW9mIGNsYXNzZXNWYWx1ZSA9PSAnc3RyaW5nJykge1xuICAgICAgY2xhc3NOYW1lcyA9IGNsYXNzZXNWYWx1ZS5zcGxpdCgvXFxzKy8pO1xuICAgICAgLy8gdGhpcyBib29sZWFuIGlzIHVzZWQgdG8gYXZvaWQgaGF2aW5nIHRvIGNyZWF0ZSBhIGtleS92YWx1ZSBtYXAgb2YgYHRydWVgIHZhbHVlc1xuICAgICAgLy8gc2luY2UgYSBjbGFzc25hbWUgc3RyaW5nIGltcGxpZXMgdGhhdCBhbGwgdGhvc2UgY2xhc3NlcyBhcmUgYWRkZWRcbiAgICAgIGFwcGx5QWxsQ2xhc3NlcyA9IHRydWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNsYXNzTmFtZXMgPSBjbGFzc2VzVmFsdWUgPyBPYmplY3Qua2V5cyhjbGFzc2VzVmFsdWUpIDogRU1QVFlfQVJSQVk7XG4gICAgfVxuICB9XG5cbiAgY29uc3QgbXVsdGlTdHlsZXNTdGFydEluZGV4ID0gZ2V0TXVsdGlTdHlsZXNTdGFydEluZGV4KGNvbnRleHQpO1xuICBsZXQgbXVsdGlDbGFzc2VzU3RhcnRJbmRleCA9IGdldE11bHRpQ2xhc3Nlc1N0YXJ0SW5kZXgoY29udGV4dCk7XG4gIGxldCBtdWx0aUNsYXNzZXNFbmRJbmRleCA9IGNvbnRleHQubGVuZ3RoO1xuXG4gIGlmICghaWdub3JlQWxsU3R5bGVVcGRhdGVzKSB7XG4gICAgY29uc3Qgc3R5bGVQcm9wcyA9IHN0eWxlc1ZhbHVlID8gT2JqZWN0LmtleXMoc3R5bGVzVmFsdWUpIDogRU1QVFlfQVJSQVk7XG4gICAgY29uc3Qgc3R5bGVzID0gc3R5bGVzVmFsdWUgfHwgRU1QVFlfT0JKO1xuICAgIGNvbnN0IHRvdGFsTmV3RW50cmllcyA9IHBhdGNoU3R5bGluZ01hcEludG9Db250ZXh0KFxuICAgICAgICBjb250ZXh0LCBkaXJlY3RpdmVJbmRleCwgc3R5bGVzUGxheWVyQnVpbGRlckluZGV4LCBtdWx0aVN0eWxlc1N0YXJ0SW5kZXgsXG4gICAgICAgIG11bHRpQ2xhc3Nlc1N0YXJ0SW5kZXgsIHN0eWxlUHJvcHMsIHN0eWxlcywgc3R5bGVzSW5wdXQsIGZhbHNlKTtcbiAgICBpZiAodG90YWxOZXdFbnRyaWVzKSB7XG4gICAgICBtdWx0aUNsYXNzZXNTdGFydEluZGV4ICs9IHRvdGFsTmV3RW50cmllcyAqIFN0eWxpbmdJbmRleC5TaXplO1xuICAgICAgbXVsdGlDbGFzc2VzRW5kSW5kZXggKz0gdG90YWxOZXdFbnRyaWVzICogU3R5bGluZ0luZGV4LlNpemU7XG4gICAgfVxuICB9XG5cbiAgaWYgKCFpZ25vcmVBbGxDbGFzc1VwZGF0ZXMpIHtcbiAgICBjb25zdCBjbGFzc2VzID0gKGNsYXNzZXNWYWx1ZSB8fCBFTVBUWV9PQkopIGFze1trZXk6IHN0cmluZ106IGFueX07XG4gICAgcGF0Y2hTdHlsaW5nTWFwSW50b0NvbnRleHQoXG4gICAgICAgIGNvbnRleHQsIGRpcmVjdGl2ZUluZGV4LCBjbGFzc2VzUGxheWVyQnVpbGRlckluZGV4LCBtdWx0aUNsYXNzZXNTdGFydEluZGV4LFxuICAgICAgICBtdWx0aUNsYXNzZXNFbmRJbmRleCwgY2xhc3NOYW1lcywgYXBwbHlBbGxDbGFzc2VzIHx8IGNsYXNzZXMsIGNsYXNzZXNJbnB1dCwgdHJ1ZSk7XG4gIH1cblxuICBpZiAocGxheWVyQnVpbGRlcnNBcmVEaXJ0eSkge1xuICAgIHNldENvbnRleHRQbGF5ZXJzRGlydHkoY29udGV4dCwgdHJ1ZSk7XG4gIH1cbn1cblxuLyoqXG4gKiBBcHBsaWVzIHRoZSBnaXZlbiBtdWx0aSBzdHlsaW5nIChzdHlsZXMgb3IgY2xhc3NlcykgdmFsdWVzIHRvIHRoZSBjb250ZXh0LlxuICpcbiAqIFRoZSBzdHlsaW5nIGFsZ29yaXRobSBjb2RlIHRoYXQgYXBwbGllcyBtdWx0aS1sZXZlbCBzdHlsaW5nICh0aGluZ3MgbGlrZSBgW3N0eWxlXWAgYW5kIGBbY2xhc3NdYFxuICogdmFsdWVzKSByZXNpZGVzIGhlcmUuXG4gKlxuICogQmVjYXVzZSB0aGlzIGZ1bmN0aW9uIHVuZGVyc3RhbmRzIHRoYXQgbXVsdGlwbGUgZGlyZWN0aXZlcyBtYXkgYWxsIHdyaXRlIHRvIHRoZSBgW3N0eWxlXWAgYW5kXG4gKiBgW2NsYXNzXWAgYmluZGluZ3MgKHRocm91Z2ggaG9zdCBiaW5kaW5ncyksIGl0IHJlbGllcyBvZiBlYWNoIGRpcmVjdGl2ZSBhcHBseWluZyBpdHMgYmluZGluZ1xuICogdmFsdWUgaW4gb3JkZXIuIFRoaXMgbWVhbnMgdGhhdCBhIGRpcmVjdGl2ZSBsaWtlIGBjbGFzc0FEaXJlY3RpdmVgIHdpbGwgYWx3YXlzIGZpcmUgYmVmb3JlXG4gKiBgY2xhc3NCRGlyZWN0aXZlYCBhbmQgdGhlcmVmb3JlIGl0cyBzdHlsaW5nIHZhbHVlcyAoY2xhc3NlcyBhbmQgc3R5bGVzKSB3aWxsIGFsd2F5cyBiZSBldmFsdWF0ZWRcbiAqIGluIHRoZSBzYW1lIG9yZGVyLiBCZWNhdXNlIG9mIHRoaXMgY29uc2lzdGVudCBvcmRlcmluZywgdGhlIGZpcnN0IGRpcmVjdGl2ZSBoYXMgYSBoaWdoZXIgcHJpb3JpdHlcbiAqIHRoYW4gdGhlIHNlY29uZCBvbmUuIEl0IGlzIHdpdGggdGhpcyBwcmlvcml0emF0aW9uIG1lY2hhbmlzbSB0aGF0IHRoZSBzdHlsaW5nIGFsZ29yaXRobSBrbm93cyBob3dcbiAqIHRvIG1lcmdlIGFuZCBhcHBseSByZWR1ZGFudCBzdHlsaW5nIHByb3BlcnRpZXMuXG4gKlxuICogVGhlIGZ1bmN0aW9uIGl0c2VsZiBhcHBsaWVzIHRoZSBrZXkvdmFsdWUgZW50cmllcyAob3IgYW4gYXJyYXkgb2Yga2V5cykgdG9cbiAqIHRoZSBjb250ZXh0IGluIHRoZSBmb2xsb3dpbmcgc3RlcHMuXG4gKlxuICogU1RFUCAxOlxuICogICAgRmlyc3QgY2hlY2sgdG8gc2VlIHdoYXQgcHJvcGVydGllcyBhcmUgYWxyZWFkeSBzZXQgYW5kIGluIHVzZSBieSBhbm90aGVyIGRpcmVjdGl2ZSBpbiB0aGVcbiAqICAgIGNvbnRleHQgKGUuZy4gYG5nQ2xhc3NgIHNldCB0aGUgYHdpZHRoYCB2YWx1ZSBhbmQgYFtzdHlsZS53aWR0aF09XCJ3XCJgIGluIGEgZGlyZWN0aXZlIGlzXG4gKiAgICBhdHRlbXB0aW5nIHRvIHNldCBpdCBhcyB3ZWxsKS5cbiAqXG4gKiBTVEVQIDI6XG4gKiAgICBBbGwgcmVtYWluaW5nIHByb3BlcnRpZXMgKHRoYXQgd2VyZSBub3Qgc2V0IHByaW9yIHRvIHRoaXMgZGlyZWN0aXZlKSBhcmUgbm93IHVwZGF0ZWQgaW5cbiAqICAgIHRoZSBjb250ZXh0LiBBbnkgbmV3IHByb3BlcnRpZXMgYXJlIGluc2VydGVkIGV4YWN0bHkgYXQgdGhlaXIgc3BvdCBpbiB0aGUgY29udGV4dCBhbmQgYW55XG4gKiAgICBwcmV2aW91c2x5IHNldCBwcm9wZXJ0aWVzIGFyZSBzaGlmdGVkIHRvIGV4YWN0bHkgd2hlcmUgdGhlIGN1cnNvciBzaXRzIHdoaWxlIGl0ZXJhdGluZyBvdmVyXG4gKiAgICB0aGUgY29udGV4dC4gVGhlIGVuZCByZXN1bHQgaXMgYSBiYWxhbmNlZCBjb250ZXh0IHRoYXQgaW5jbHVkZXMgdGhlIGV4YWN0IG9yZGVyaW5nIG9mIHRoZVxuICogICAgc3R5bGluZyBwcm9wZXJ0aWVzL3ZhbHVlcyBmb3IgdGhlIHByb3ZpZGVkIGlucHV0IGZyb20gdGhlIGRpcmVjdGl2ZS5cbiAqXG4gKiBTVEVQIDM6XG4gKiAgICBBbnkgdW5tYXRjaGVkIHByb3BlcnRpZXMgaW4gdGhlIGNvbnRleHQgdGhhdCBiZWxvbmcgdG8gdGhlIGRpcmVjdGl2ZSBhcmUgc2V0IHRvIG51bGxcbiAqXG4gKiBPbmNlIHRoZSB1cGRhdGluZyBwaGFzZSBpcyBkb25lLCB0aGVuIHRoZSBhbGdvcml0aG0gd2lsbCBkZWNpZGUgd2hldGhlciBvciBub3QgdG8gZmxhZyB0aGVcbiAqIGZvbGxvdy11cCBkaXJlY3RpdmVzICh0aGUgZGlyZWN0aXZlcyB0aGF0IHdpbGwgcGFzcyBpbiB0aGVpciBzdHlsaW5nIHZhbHVlcykgZGVwZW5kaW5nIG9uIGlmXG4gKiB0aGUgXCJzaGFwZVwiIG9mIHRoZSBtdWx0aS12YWx1ZSBtYXAgaGFzIGNoYW5nZWQgKGVpdGhlciBpZiBhbnkga2V5cyBhcmUgcmVtb3ZlZCBvciBhZGRlZCBvclxuICogaWYgdGhlcmUgYXJlIGFueSBuZXcgYG51bGxgIHZhbHVlcykuIElmIGFueSBmb2xsb3ctdXAgZGlyZWN0aXZlcyBhcmUgZmxhZ2dlZCBhcyBkaXJ0eSB0aGVuIHRoZVxuICogYWxnb3JpdGhtIHdpbGwgcnVuIGFnYWluIGZvciB0aGVtLiBPdGhlcndpc2UgaWYgdGhlIHNoYXBlIGRpZCBub3QgY2hhbmdlIHRoZW4gYW55IGZvbGxvdy11cFxuICogZGlyZWN0aXZlcyB3aWxsIG5vdCBydW4gKHNvIGxvbmcgYXMgdGhlaXIgYmluZGluZyB2YWx1ZXMgc3RheSB0aGUgc2FtZSkuXG4gKlxuICogQHJldHVybnMgdGhlIHRvdGFsIGFtb3VudCBvZiBuZXcgc2xvdHMgdGhhdCB3ZXJlIGFsbG9jYXRlZCBpbnRvIHRoZSBjb250ZXh0IGR1ZSB0byBuZXcgc3R5bGluZ1xuICogICAgICAgICAgcHJvcGVydGllcyB0aGF0IHdlcmUgZGV0ZWN0ZWQuXG4gKi9cbmZ1bmN0aW9uIHBhdGNoU3R5bGluZ01hcEludG9Db250ZXh0KFxuICAgIGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBkaXJlY3RpdmVJbmRleDogbnVtYmVyLCBwbGF5ZXJCdWlsZGVySW5kZXg6IG51bWJlciwgY3R4U3RhcnQ6IG51bWJlcixcbiAgICBjdHhFbmQ6IG51bWJlciwgcHJvcHM6IChzdHJpbmcgfCBudWxsKVtdLCB2YWx1ZXM6IHtba2V5OiBzdHJpbmddOiBhbnl9IHwgdHJ1ZSwgY2FjaGVWYWx1ZTogYW55LFxuICAgIGVudHJ5SXNDbGFzc0Jhc2VkOiBib29sZWFuKTogbnVtYmVyIHtcbiAgbGV0IGRpcnR5ID0gZmFsc2U7XG5cbiAgY29uc3QgY2FjaGVJbmRleCA9IE1hcEJhc2VkT2Zmc2V0VmFsdWVzSW5kZXguVmFsdWVzU3RhcnRQb3NpdGlvbiArXG4gICAgICBkaXJlY3RpdmVJbmRleCAqIE1hcEJhc2VkT2Zmc2V0VmFsdWVzSW5kZXguU2l6ZTtcblxuICAvLyB0aGUgY2FjaGVkVmFsdWVzIGFycmF5IGlzIHRoZSByZWdpc3RyeSBvZiBhbGwgbXVsdGkgc3R5bGUgdmFsdWVzIChtYXAgdmFsdWVzKS4gRWFjaFxuICAvLyB2YWx1ZSBpcyBzdG9yZWQgKGNhY2hlZCkgZWFjaCB0aW1lIGlzIHVwZGF0ZWQuXG4gIGNvbnN0IGNhY2hlZFZhbHVlcyA9XG4gICAgICBjb250ZXh0W2VudHJ5SXNDbGFzc0Jhc2VkID8gU3R5bGluZ0luZGV4LkNhY2hlZE11bHRpQ2xhc3NlcyA6IFN0eWxpbmdJbmRleC5DYWNoZWRNdWx0aVN0eWxlc107XG5cbiAgLy8gdGhpcyBpcyB0aGUgaW5kZXggaW4gd2hpY2ggdGhpcyBkaXJlY3RpdmUgaGFzIG93bmVyc2hpcCBhY2Nlc3MgdG8gd3JpdGUgdG8gdGhpc1xuICAvLyB2YWx1ZSAoYW55dGhpbmcgYmVmb3JlIGlzIG93bmVkIGJ5IGEgcHJldmlvdXMgZGlyZWN0aXZlIHRoYXQgaXMgbW9yZSBpbXBvcnRhbnQpXG4gIGNvbnN0IG93bmVyc2hpcFZhbHVlc1N0YXJ0SW5kZXggPVxuICAgICAgY2FjaGVkVmFsdWVzW2NhY2hlSW5kZXggKyBNYXBCYXNlZE9mZnNldFZhbHVlc0luZGV4LlBvc2l0aW9uU3RhcnRPZmZzZXRdO1xuXG4gIGNvbnN0IGV4aXN0aW5nQ2FjaGVkVmFsdWUgPSBjYWNoZWRWYWx1ZXNbY2FjaGVJbmRleCArIE1hcEJhc2VkT2Zmc2V0VmFsdWVzSW5kZXguVmFsdWVPZmZzZXRdO1xuICBjb25zdCBleGlzdGluZ0NhY2hlZFZhbHVlQ291bnQgPVxuICAgICAgY2FjaGVkVmFsdWVzW2NhY2hlSW5kZXggKyBNYXBCYXNlZE9mZnNldFZhbHVlc0luZGV4LlZhbHVlQ291bnRPZmZzZXRdO1xuICBjb25zdCBleGlzdGluZ0NhY2hlZFZhbHVlSXNEaXJ0eSA9XG4gICAgICBjYWNoZWRWYWx1ZXNbY2FjaGVJbmRleCArIE1hcEJhc2VkT2Zmc2V0VmFsdWVzSW5kZXguRGlydHlGbGFnT2Zmc2V0XSA9PT0gMTtcblxuICAvLyBBIHNoYXBlIGNoYW5nZSBtZWFucyB0aGUgcHJvdmlkZWQgbWFwIHZhbHVlIGhhcyBlaXRoZXIgcmVtb3ZlZCBvciBhZGRlZCBuZXcgcHJvcGVydGllc1xuICAvLyBjb21wYXJlZCB0byB3aGF0IHdlcmUgaW4gdGhlIGxhc3QgdGltZS4gSWYgYSBzaGFwZSBjaGFuZ2Ugb2NjdXJzIHRoZW4gaXQgbWVhbnMgdGhhdCBhbGxcbiAgLy8gZm9sbG93LXVwIG11bHRpLXN0eWxpbmcgZW50cmllcyBhcmUgb2Jzb2xldGUgYW5kIHdpbGwgYmUgZXhhbWluZWQgYWdhaW4gd2hlbiBDRCBydW5zXG4gIC8vIHRoZW0uIElmIGEgc2hhcGUgY2hhbmdlIGhhcyBub3Qgb2NjdXJyZWQgdGhlbiB0aGVyZSBpcyBubyByZWFzb24gdG8gY2hlY2sgYW55IG90aGVyXG4gIC8vIGRpcmVjdGl2ZSB2YWx1ZXMgaWYgdGhlaXIgaWRlbnRpdHkgaGFzIG5vdCBjaGFuZ2VkLiBJZiBhIHByZXZpb3VzIGRpcmVjdGl2ZSBzZXQgdGhpc1xuICAvLyB2YWx1ZSBhcyBkaXJ0eSAoYmVjYXVzZSBpdHMgb3duIHNoYXBlIGNoYW5nZWQpIHRoZW4gdGhpcyBtZWFucyB0aGF0IHRoZSBvYmplY3QgaGFzIGJlZW5cbiAgLy8gb2Zmc2V0IHRvIGEgZGlmZmVyZW50IGFyZWEgaW4gdGhlIGNvbnRleHQuIEJlY2F1c2UgaXRzIHZhbHVlIGhhcyBiZWVuIG9mZnNldCB0aGVuIGl0XG4gIC8vIGNhbid0IHdyaXRlIHRvIGEgcmVnaW9uIHRoYXQgaXQgd3JvdGUgdG8gYmVmb3JlICh3aGljaCBtYXkgaGF2ZSBiZWVuIGFwYXJ0IG9mIGFub3RoZXJcbiAgLy8gZGlyZWN0aXZlKSBhbmQgdGhlcmVmb3JlIGl0cyBzaGFwZSBjaGFuZ2VzIHRvby5cbiAgbGV0IHZhbHVlc0VudHJ5U2hhcGVDaGFuZ2UgPVxuICAgICAgZXhpc3RpbmdDYWNoZWRWYWx1ZUlzRGlydHkgfHwgKCghZXhpc3RpbmdDYWNoZWRWYWx1ZSAmJiBjYWNoZVZhbHVlKSA/IHRydWUgOiBmYWxzZSk7XG5cbiAgbGV0IHRvdGFsVW5pcXVlVmFsdWVzID0gMDtcbiAgbGV0IHRvdGFsTmV3QWxsb2NhdGVkU2xvdHMgPSAwO1xuXG4gIC8vIHRoaXMgaXMgYSB0cmljayB0byBhdm9pZCBidWlsZGluZyB7a2V5OnZhbHVlfSBtYXAgd2hlcmUgYWxsIHRoZSB2YWx1ZXNcbiAgLy8gYXJlIGB0cnVlYCAodGhpcyBoYXBwZW5zIHdoZW4gYSBjbGFzc05hbWUgc3RyaW5nIGlzIHByb3ZpZGVkIGluc3RlYWQgb2YgYVxuICAvLyBtYXAgYXMgYW4gaW5wdXQgdmFsdWUgdG8gdGhpcyBzdHlsaW5nIGFsZ29yaXRobSlcbiAgY29uc3QgYXBwbHlBbGxQcm9wcyA9IHZhbHVlcyA9PT0gdHJ1ZTtcblxuICAvLyBTVEVQIDE6XG4gIC8vIGxvb3AgdGhyb3VnaCB0aGUgZWFybGllciBkaXJlY3RpdmVzIGFuZCBmaWd1cmUgb3V0IGlmIGFueSBwcm9wZXJ0aWVzIGhlcmUgd2lsbCBiZSBwbGFjZWRcbiAgLy8gaW4gdGhlaXIgYXJlYSAodGhpcyBoYXBwZW5zIHdoZW4gdGhlIHZhbHVlIGlzIG51bGwgYmVjYXVzZSB0aGUgZWFybGllciBkaXJlY3RpdmUgZXJhc2VkIGl0KS5cbiAgbGV0IGN0eEluZGV4ID0gY3R4U3RhcnQ7XG4gIGxldCB0b3RhbFJlbWFpbmluZ1Byb3BlcnRpZXMgPSBwcm9wcy5sZW5ndGg7XG4gIHdoaWxlIChjdHhJbmRleCA8IG93bmVyc2hpcFZhbHVlc1N0YXJ0SW5kZXgpIHtcbiAgICBjb25zdCBjdXJyZW50UHJvcCA9IGdldFByb3AoY29udGV4dCwgY3R4SW5kZXgpO1xuICAgIGlmICh0b3RhbFJlbWFpbmluZ1Byb3BlcnRpZXMpIHtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcHJvcHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3QgbWFwUHJvcCA9IHByb3BzW2ldO1xuICAgICAgICBjb25zdCBub3JtYWxpemVkUHJvcCA9IG1hcFByb3AgPyAoZW50cnlJc0NsYXNzQmFzZWQgPyBtYXBQcm9wIDogaHlwaGVuYXRlKG1hcFByb3ApKSA6IG51bGw7XG4gICAgICAgIGlmIChub3JtYWxpemVkUHJvcCAmJiBjdXJyZW50UHJvcCA9PT0gbm9ybWFsaXplZFByb3ApIHtcbiAgICAgICAgICBjb25zdCBjdXJyZW50VmFsdWUgPSBnZXRWYWx1ZShjb250ZXh0LCBjdHhJbmRleCk7XG4gICAgICAgICAgY29uc3QgY3VycmVudERpcmVjdGl2ZUluZGV4ID0gZ2V0RGlyZWN0aXZlSW5kZXhGcm9tRW50cnkoY29udGV4dCwgY3R4SW5kZXgpO1xuICAgICAgICAgIGNvbnN0IHZhbHVlID0gYXBwbHlBbGxQcm9wcyA/IHRydWUgOiAodmFsdWVzIGFze1trZXk6IHN0cmluZ106IGFueX0pW25vcm1hbGl6ZWRQcm9wXTtcbiAgICAgICAgICBjb25zdCBjdXJyZW50RmxhZyA9IGdldFBvaW50ZXJzKGNvbnRleHQsIGN0eEluZGV4KTtcbiAgICAgICAgICBpZiAoaGFzVmFsdWVDaGFuZ2VkKGN1cnJlbnRGbGFnLCBjdXJyZW50VmFsdWUsIHZhbHVlKSAmJlxuICAgICAgICAgICAgICBhbGxvd1ZhbHVlQ2hhbmdlKGN1cnJlbnRWYWx1ZSwgdmFsdWUsIGN1cnJlbnREaXJlY3RpdmVJbmRleCwgZGlyZWN0aXZlSW5kZXgpKSB7XG4gICAgICAgICAgICBzZXRWYWx1ZShjb250ZXh0LCBjdHhJbmRleCwgdmFsdWUpO1xuICAgICAgICAgICAgc2V0UGxheWVyQnVpbGRlckluZGV4KGNvbnRleHQsIGN0eEluZGV4LCBwbGF5ZXJCdWlsZGVySW5kZXgsIGRpcmVjdGl2ZUluZGV4KTtcbiAgICAgICAgICAgIGlmIChoYXNJbml0aWFsVmFsdWVDaGFuZ2VkKGNvbnRleHQsIGN1cnJlbnRGbGFnLCB2YWx1ZSkpIHtcbiAgICAgICAgICAgICAgc2V0RGlydHkoY29udGV4dCwgY3R4SW5kZXgsIHRydWUpO1xuICAgICAgICAgICAgICBkaXJ0eSA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIHByb3BzW2ldID0gbnVsbDtcbiAgICAgICAgICB0b3RhbFJlbWFpbmluZ1Byb3BlcnRpZXMtLTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBjdHhJbmRleCArPSBTdHlsaW5nSW5kZXguU2l6ZTtcbiAgfVxuXG4gIC8vIFNURVAgMjpcbiAgLy8gYXBwbHkgdGhlIGxlZnQgb3ZlciBwcm9wZXJ0aWVzIHRvIHRoZSBjb250ZXh0IGluIHRoZSBjb3JyZWN0IG9yZGVyLlxuICBpZiAodG90YWxSZW1haW5pbmdQcm9wZXJ0aWVzKSB7XG4gICAgY29uc3Qgc2FuaXRpemVyID0gZW50cnlJc0NsYXNzQmFzZWQgPyBudWxsIDogZ2V0U3R5bGVTYW5pdGl6ZXIoY29udGV4dCwgZGlyZWN0aXZlSW5kZXgpO1xuICAgIHByb3BlcnRpZXNMb29wOiBmb3IgKGxldCBpID0gMDsgaSA8IHByb3BzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBtYXBQcm9wID0gcHJvcHNbaV07XG5cbiAgICAgIGlmICghbWFwUHJvcCkge1xuICAgICAgICAvLyB0aGlzIGlzIGFuIGVhcmx5IGV4aXQgaW5jYXNlIGEgdmFsdWUgd2FzIGFscmVhZHkgZW5jb3VudGVyZWQgYWJvdmUgaW4gdGhlXG4gICAgICAgIC8vIHByZXZpb3VzIGxvb3AgKHdoaWNoIG1lYW5zIHRoYXQgdGhlIHByb3BlcnR5IHdhcyBhcHBsaWVkIG9yIHJlamVjdGVkKVxuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgdmFsdWUgPSBhcHBseUFsbFByb3BzID8gdHJ1ZSA6ICh2YWx1ZXMgYXN7W2tleTogc3RyaW5nXTogYW55fSlbbWFwUHJvcF07XG4gICAgICBjb25zdCBub3JtYWxpemVkUHJvcCA9IGVudHJ5SXNDbGFzc0Jhc2VkID8gbWFwUHJvcCA6IGh5cGhlbmF0ZShtYXBQcm9wKTtcbiAgICAgIGNvbnN0IGlzSW5zaWRlT3duZXJzaGlwQXJlYSA9IGN0eEluZGV4ID49IG93bmVyc2hpcFZhbHVlc1N0YXJ0SW5kZXg7XG5cbiAgICAgIGZvciAobGV0IGogPSBjdHhJbmRleDsgaiA8IGN0eEVuZDsgaiArPSBTdHlsaW5nSW5kZXguU2l6ZSkge1xuICAgICAgICBjb25zdCBkaXN0YW50Q3R4UHJvcCA9IGdldFByb3AoY29udGV4dCwgaik7XG4gICAgICAgIGlmIChkaXN0YW50Q3R4UHJvcCA9PT0gbm9ybWFsaXplZFByb3ApIHtcbiAgICAgICAgICBjb25zdCBkaXN0YW50Q3R4RGlyZWN0aXZlSW5kZXggPSBnZXREaXJlY3RpdmVJbmRleEZyb21FbnRyeShjb250ZXh0LCBqKTtcbiAgICAgICAgICBjb25zdCBkaXN0YW50Q3R4UGxheWVyQnVpbGRlckluZGV4ID0gZ2V0UGxheWVyQnVpbGRlckluZGV4KGNvbnRleHQsIGopO1xuICAgICAgICAgIGNvbnN0IGRpc3RhbnRDdHhWYWx1ZSA9IGdldFZhbHVlKGNvbnRleHQsIGopO1xuICAgICAgICAgIGNvbnN0IGRpc3RhbnRDdHhGbGFnID0gZ2V0UG9pbnRlcnMoY29udGV4dCwgaik7XG5cbiAgICAgICAgICBpZiAoYWxsb3dWYWx1ZUNoYW5nZShkaXN0YW50Q3R4VmFsdWUsIHZhbHVlLCBkaXN0YW50Q3R4RGlyZWN0aXZlSW5kZXgsIGRpcmVjdGl2ZUluZGV4KSkge1xuICAgICAgICAgICAgLy8gZXZlbiBpZiB0aGUgZW50cnkgaXNuJ3QgdXBkYXRlZCAoYnkgdmFsdWUgb3IgZGlyZWN0aXZlSW5kZXgpIHRoZW5cbiAgICAgICAgICAgIC8vIGl0IHNob3VsZCBzdGlsbCBiZSBtb3ZlZCBvdmVyIHRvIHRoZSBjb3JyZWN0IHNwb3QgaW4gdGhlIGFycmF5IHNvXG4gICAgICAgICAgICAvLyB0aGUgaXRlcmF0aW9uIGxvb3AgaXMgdGlnaHRlci5cbiAgICAgICAgICAgIGlmIChpc0luc2lkZU93bmVyc2hpcEFyZWEpIHtcbiAgICAgICAgICAgICAgc3dhcE11bHRpQ29udGV4dEVudHJpZXMoY29udGV4dCwgY3R4SW5kZXgsIGopO1xuICAgICAgICAgICAgICB0b3RhbFVuaXF1ZVZhbHVlcysrO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoaGFzVmFsdWVDaGFuZ2VkKGRpc3RhbnRDdHhGbGFnLCBkaXN0YW50Q3R4VmFsdWUsIHZhbHVlKSkge1xuICAgICAgICAgICAgICBpZiAodmFsdWUgPT09IG51bGwgfHwgdmFsdWUgPT09IHVuZGVmaW5lZCAmJiB2YWx1ZSAhPT0gZGlzdGFudEN0eFZhbHVlKSB7XG4gICAgICAgICAgICAgICAgdmFsdWVzRW50cnlTaGFwZUNoYW5nZSA9IHRydWU7XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICBzZXRWYWx1ZShjb250ZXh0LCBjdHhJbmRleCwgdmFsdWUpO1xuXG4gICAgICAgICAgICAgIC8vIFNLSVAgSUYgSU5JVElBTCBDSEVDS1xuICAgICAgICAgICAgICAvLyBJZiB0aGUgZm9ybWVyIGB2YWx1ZWAgaXMgYG51bGxgIHRoZW4gaXQgbWVhbnMgdGhhdCBhbiBpbml0aWFsIHZhbHVlXG4gICAgICAgICAgICAgIC8vIGNvdWxkIGJlIGJlaW5nIHJlbmRlcmVkIG9uIHNjcmVlbi4gSWYgdGhhdCBpcyB0aGUgY2FzZSB0aGVuIHRoZXJlIGlzXG4gICAgICAgICAgICAgIC8vIG5vIHBvaW50IGluIHVwZGF0aW5nIHRoZSB2YWx1ZSBpbmNhc2UgaXQgbWF0Y2hlcy4gSW4gb3RoZXIgd29yZHMgaWYgdGhlXG4gICAgICAgICAgICAgIC8vIG5ldyB2YWx1ZSBpcyB0aGUgZXhhY3Qgc2FtZSBhcyB0aGUgcHJldmlvdXNseSByZW5kZXJlZCB2YWx1ZSAod2hpY2hcbiAgICAgICAgICAgICAgLy8gaGFwcGVucyB0byBiZSB0aGUgaW5pdGlhbCB2YWx1ZSkgdGhlbiBkbyBub3RoaW5nLlxuICAgICAgICAgICAgICBpZiAoZGlzdGFudEN0eFZhbHVlICE9PSBudWxsIHx8XG4gICAgICAgICAgICAgICAgICBoYXNJbml0aWFsVmFsdWVDaGFuZ2VkKGNvbnRleHQsIGRpc3RhbnRDdHhGbGFnLCB2YWx1ZSkpIHtcbiAgICAgICAgICAgICAgICBzZXREaXJ0eShjb250ZXh0LCBjdHhJbmRleCwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgZGlydHkgPSB0cnVlO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChkaXN0YW50Q3R4RGlyZWN0aXZlSW5kZXggIT09IGRpcmVjdGl2ZUluZGV4IHx8XG4gICAgICAgICAgICAgICAgcGxheWVyQnVpbGRlckluZGV4ICE9PSBkaXN0YW50Q3R4UGxheWVyQnVpbGRlckluZGV4KSB7XG4gICAgICAgICAgICAgIHNldFBsYXllckJ1aWxkZXJJbmRleChjb250ZXh0LCBjdHhJbmRleCwgcGxheWVyQnVpbGRlckluZGV4LCBkaXJlY3RpdmVJbmRleCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY3R4SW5kZXggKz0gU3R5bGluZ0luZGV4LlNpemU7XG4gICAgICAgICAgY29udGludWUgcHJvcGVydGllc0xvb3A7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gZmFsbGJhY2sgY2FzZSAuLi4gdmFsdWUgbm90IGZvdW5kIGF0IGFsbCBpbiB0aGUgY29udGV4dFxuICAgICAgaWYgKHZhbHVlICE9IG51bGwpIHtcbiAgICAgICAgdmFsdWVzRW50cnlTaGFwZUNoYW5nZSA9IHRydWU7XG4gICAgICAgIHRvdGFsVW5pcXVlVmFsdWVzKys7XG4gICAgICAgIGNvbnN0IGZsYWcgPSBwcmVwYXJlSW5pdGlhbEZsYWcoY29udGV4dCwgbm9ybWFsaXplZFByb3AsIGVudHJ5SXNDbGFzc0Jhc2VkLCBzYW5pdGl6ZXIpIHxcbiAgICAgICAgICAgIFN0eWxpbmdGbGFncy5EaXJ0eTtcblxuICAgICAgICBjb25zdCBpbnNlcnRpb25JbmRleCA9IGlzSW5zaWRlT3duZXJzaGlwQXJlYSA/XG4gICAgICAgICAgICBjdHhJbmRleCA6XG4gICAgICAgICAgICAob3duZXJzaGlwVmFsdWVzU3RhcnRJbmRleCArIHRvdGFsTmV3QWxsb2NhdGVkU2xvdHMgKiBTdHlsaW5nSW5kZXguU2l6ZSk7XG4gICAgICAgIGluc2VydE5ld011bHRpUHJvcGVydHkoXG4gICAgICAgICAgICBjb250ZXh0LCBpbnNlcnRpb25JbmRleCwgZW50cnlJc0NsYXNzQmFzZWQsIG5vcm1hbGl6ZWRQcm9wLCBmbGFnLCB2YWx1ZSwgZGlyZWN0aXZlSW5kZXgsXG4gICAgICAgICAgICBwbGF5ZXJCdWlsZGVySW5kZXgpO1xuXG4gICAgICAgIHRvdGFsTmV3QWxsb2NhdGVkU2xvdHMrKztcbiAgICAgICAgY3R4RW5kICs9IFN0eWxpbmdJbmRleC5TaXplO1xuICAgICAgICBjdHhJbmRleCArPSBTdHlsaW5nSW5kZXguU2l6ZTtcblxuICAgICAgICBkaXJ0eSA9IHRydWU7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8gU1RFUCAzOlxuICAvLyBSZW1vdmUgKG51bGxpZnkpIGFueSBleGlzdGluZyBlbnRyaWVzIGluIHRoZSBjb250ZXh0IHRoYXQgd2VyZSBub3QgYXBhcnQgb2YgdGhlXG4gIC8vIG1hcCBpbnB1dCB2YWx1ZSB0aGF0IHdhcyBwYXNzZWQgaW50byB0aGlzIGFsZ29yaXRobSBmb3IgdGhpcyBkaXJlY3RpdmUuXG4gIHdoaWxlIChjdHhJbmRleCA8IGN0eEVuZCkge1xuICAgIHZhbHVlc0VudHJ5U2hhcGVDaGFuZ2UgPSB0cnVlOyAgLy8gc29tZSB2YWx1ZXMgYXJlIG1pc3NpbmdcbiAgICBjb25zdCBjdHhWYWx1ZSA9IGdldFZhbHVlKGNvbnRleHQsIGN0eEluZGV4KTtcbiAgICBjb25zdCBjdHhGbGFnID0gZ2V0UG9pbnRlcnMoY29udGV4dCwgY3R4SW5kZXgpO1xuICAgIGNvbnN0IGN0eERpcmVjdGl2ZSA9IGdldERpcmVjdGl2ZUluZGV4RnJvbUVudHJ5KGNvbnRleHQsIGN0eEluZGV4KTtcbiAgICBpZiAoY3R4VmFsdWUgIT0gbnVsbCkge1xuICAgICAgdmFsdWVzRW50cnlTaGFwZUNoYW5nZSA9IHRydWU7XG4gICAgfVxuICAgIGlmIChoYXNWYWx1ZUNoYW5nZWQoY3R4RmxhZywgY3R4VmFsdWUsIG51bGwpKSB7XG4gICAgICBzZXRWYWx1ZShjb250ZXh0LCBjdHhJbmRleCwgbnVsbCk7XG4gICAgICAvLyBvbmx5IGlmIHRoZSBpbml0aWFsIHZhbHVlIGlzIGZhbHN5IHRoZW5cbiAgICAgIGlmIChoYXNJbml0aWFsVmFsdWVDaGFuZ2VkKGNvbnRleHQsIGN0eEZsYWcsIGN0eFZhbHVlKSkge1xuICAgICAgICBzZXREaXJ0eShjb250ZXh0LCBjdHhJbmRleCwgdHJ1ZSk7XG4gICAgICAgIGRpcnR5ID0gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIHNldFBsYXllckJ1aWxkZXJJbmRleChjb250ZXh0LCBjdHhJbmRleCwgcGxheWVyQnVpbGRlckluZGV4LCBkaXJlY3RpdmVJbmRleCk7XG4gICAgfVxuICAgIGN0eEluZGV4ICs9IFN0eWxpbmdJbmRleC5TaXplO1xuICB9XG5cbiAgLy8gQmVjYXVzZSB0aGUgb2JqZWN0IHNoYXBlIGhhcyBjaGFuZ2VkLCB0aGlzIG1lYW5zIHRoYXQgYWxsIGZvbGxvdy11cCBkaXJlY3RpdmVzIHdpbGwgbmVlZCB0b1xuICAvLyByZWFwcGx5IHRoZWlyIHZhbHVlcyBpbnRvIHRoZSBvYmplY3QuIEZvciB0aGlzIHRvIGhhcHBlbiwgdGhlIGNhY2hlZCBhcnJheSBuZWVkcyB0byBiZSB1cGRhdGVkXG4gIC8vIHdpdGggZGlydHkgZmxhZ3Mgc28gdGhhdCBmb2xsb3ctdXAgY2FsbHMgdG8gYHVwZGF0ZVN0eWxpbmdNYXBgIHdpbGwgcmVhcHBseSB0aGVpciBzdHlsaW5nIGNvZGUuXG4gIC8vIHRoZSByZWFwcGxpY2F0aW9uIG9mIHN0eWxpbmcgY29kZSB3aXRoaW4gdGhlIGNvbnRleHQgd2lsbCByZXNoYXBlIGl0IGFuZCB1cGRhdGUgdGhlIG9mZnNldFxuICAvLyB2YWx1ZXMgKGFsc28gZm9sbG93LXVwIGRpcmVjdGl2ZXMgY2FuIHdyaXRlIG5ldyB2YWx1ZXMgaW5jYXNlIGVhcmxpZXIgZGlyZWN0aXZlcyBzZXQgYW55dGhpbmdcbiAgLy8gdG8gbnVsbCBkdWUgdG8gcmVtb3ZhbHMgb3IgZmFsc3kgdmFsdWVzKS5cbiAgdmFsdWVzRW50cnlTaGFwZUNoYW5nZSA9IHZhbHVlc0VudHJ5U2hhcGVDaGFuZ2UgfHwgZXhpc3RpbmdDYWNoZWRWYWx1ZUNvdW50ICE9PSB0b3RhbFVuaXF1ZVZhbHVlcztcbiAgdXBkYXRlQ2FjaGVkTWFwVmFsdWUoXG4gICAgICBjb250ZXh0LCBkaXJlY3RpdmVJbmRleCwgZW50cnlJc0NsYXNzQmFzZWQsIGNhY2hlVmFsdWUsIG93bmVyc2hpcFZhbHVlc1N0YXJ0SW5kZXgsIGN0eEVuZCxcbiAgICAgIHRvdGFsVW5pcXVlVmFsdWVzLCB2YWx1ZXNFbnRyeVNoYXBlQ2hhbmdlKTtcblxuICBpZiAoZGlydHkpIHtcbiAgICBzZXRDb250ZXh0RGlydHkoY29udGV4dCwgdHJ1ZSk7XG4gICAgc2V0RGlyZWN0aXZlRGlydHkoY29udGV4dCwgZGlyZWN0aXZlSW5kZXgsIHRydWUpO1xuICB9XG5cbiAgcmV0dXJuIHRvdGFsTmV3QWxsb2NhdGVkU2xvdHM7XG59XG5cbi8qKlxuICogU2V0cyBhbmQgcmVzb2x2ZXMgYSBzaW5nbGUgY2xhc3MgdmFsdWUgb24gdGhlIHByb3ZpZGVkIGBTdHlsaW5nQ29udGV4dGAgc29cbiAqIHRoYXQgdGhleSBjYW4gYmUgYXBwbGllZCB0byB0aGUgZWxlbWVudCBvbmNlIGByZW5kZXJTdHlsaW5nYCBpcyBjYWxsZWQuXG4gKlxuICogQHBhcmFtIGNvbnRleHQgVGhlIHN0eWxpbmcgY29udGV4dCB0aGF0IHdpbGwgYmUgdXBkYXRlZCB3aXRoIHRoZVxuICogICAgbmV3bHkgcHJvdmlkZWQgY2xhc3MgdmFsdWUuXG4gKiBAcGFyYW0gb2Zmc2V0IFRoZSBpbmRleCBvZiB0aGUgQ1NTIGNsYXNzIHdoaWNoIGlzIGJlaW5nIHVwZGF0ZWQuXG4gKiBAcGFyYW0gYWRkT3JSZW1vdmUgV2hldGhlciBvciBub3QgdG8gYWRkIG9yIHJlbW92ZSB0aGUgQ1NTIGNsYXNzXG4gKiBAcGFyYW0gZGlyZWN0aXZlUmVmIGFuIG9wdGlvbmFsIHJlZmVyZW5jZSB0byB0aGUgZGlyZWN0aXZlIHJlc3BvbnNpYmxlXG4gKiAgICBmb3IgdGhpcyBiaW5kaW5nIGNoYW5nZS4gSWYgcHJlc2VudCB0aGVuIHN0eWxlIGJpbmRpbmcgd2lsbCBvbmx5XG4gKiAgICBhY3R1YWxpemUgaWYgdGhlIGRpcmVjdGl2ZSBoYXMgb3duZXJzaGlwIG92ZXIgdGhpcyBiaW5kaW5nXG4gKiAgICAoc2VlIHN0eWxpbmcudHMjZGlyZWN0aXZlcyBmb3IgbW9yZSBpbmZvcm1hdGlvbiBhYm91dCB0aGUgYWxnb3JpdGhtKS5cbiAqIEBwYXJhbSBmb3JjZU92ZXJyaWRlIHdoZXRoZXIgb3Igbm90IHRvIHNraXAgYWxsIGRpcmVjdGl2ZSBwcmlvcml0aXphdGlvblxuICogICAgYW5kIGp1c3QgYXBwbHkgdGhlIHZhbHVlIHJlZ2FyZGxlc3MuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB1cGRhdGVDbGFzc1Byb3AoXG4gICAgY29udGV4dDogU3R5bGluZ0NvbnRleHQsIG9mZnNldDogbnVtYmVyLFxuICAgIGlucHV0OiBib29sZWFuIHwgQm91bmRQbGF5ZXJGYWN0b3J5PGJvb2xlYW58bnVsbD58IG51bGwsIGRpcmVjdGl2ZVJlZj86IGFueSxcbiAgICBmb3JjZU92ZXJyaWRlPzogYm9vbGVhbik6IHZvaWQge1xuICB1cGRhdGVTaW5nbGVTdHlsaW5nVmFsdWUoY29udGV4dCwgb2Zmc2V0LCBpbnB1dCwgdHJ1ZSwgZGlyZWN0aXZlUmVmLCBmb3JjZU92ZXJyaWRlKTtcbn1cblxuLyoqXG4gKiBTZXRzIGFuZCByZXNvbHZlcyBhIHNpbmdsZSBzdHlsZSB2YWx1ZSBvbiB0aGUgcHJvdmlkZWQgYFN0eWxpbmdDb250ZXh0YCBzb1xuICogdGhhdCB0aGV5IGNhbiBiZSBhcHBsaWVkIHRvIHRoZSBlbGVtZW50IG9uY2UgYHJlbmRlclN0eWxpbmdgIGlzIGNhbGxlZC5cbiAqXG4gKiBOb3RlIHRoYXQgcHJvcC1sZXZlbCBzdHlsaW5nIHZhbHVlcyBhcmUgY29uc2lkZXJlZCBoaWdoZXIgcHJpb3JpdHkgdGhhbiBhbnkgc3R5bGluZyB0aGF0XG4gKiBoYXMgYmVlbiBhcHBsaWVkIHVzaW5nIGB1cGRhdGVTdHlsaW5nTWFwYCwgdGhlcmVmb3JlLCB3aGVuIHN0eWxpbmcgdmFsdWVzIGFyZSByZW5kZXJlZFxuICogdGhlbiBhbnkgc3R5bGVzL2NsYXNzZXMgdGhhdCBoYXZlIGJlZW4gYXBwbGllZCB1c2luZyB0aGlzIGZ1bmN0aW9uIHdpbGwgYmUgY29uc2lkZXJlZCBmaXJzdFxuICogKHRoZW4gbXVsdGkgdmFsdWVzIHNlY29uZCBhbmQgdGhlbiBpbml0aWFsIHZhbHVlcyBhcyBhIGJhY2t1cCkuXG4gKlxuICogQHBhcmFtIGNvbnRleHQgVGhlIHN0eWxpbmcgY29udGV4dCB0aGF0IHdpbGwgYmUgdXBkYXRlZCB3aXRoIHRoZVxuICogICAgbmV3bHkgcHJvdmlkZWQgc3R5bGUgdmFsdWUuXG4gKiBAcGFyYW0gb2Zmc2V0IFRoZSBpbmRleCBvZiB0aGUgcHJvcGVydHkgd2hpY2ggaXMgYmVpbmcgdXBkYXRlZC5cbiAqIEBwYXJhbSB2YWx1ZSBUaGUgQ1NTIHN0eWxlIHZhbHVlIHRoYXQgd2lsbCBiZSBhc3NpZ25lZFxuICogQHBhcmFtIGRpcmVjdGl2ZVJlZiBhbiBvcHRpb25hbCByZWZlcmVuY2UgdG8gdGhlIGRpcmVjdGl2ZSByZXNwb25zaWJsZVxuICogICAgZm9yIHRoaXMgYmluZGluZyBjaGFuZ2UuIElmIHByZXNlbnQgdGhlbiBzdHlsZSBiaW5kaW5nIHdpbGwgb25seVxuICogICAgYWN0dWFsaXplIGlmIHRoZSBkaXJlY3RpdmUgaGFzIG93bmVyc2hpcCBvdmVyIHRoaXMgYmluZGluZ1xuICogICAgKHNlZSBzdHlsaW5nLnRzI2RpcmVjdGl2ZXMgZm9yIG1vcmUgaW5mb3JtYXRpb24gYWJvdXQgdGhlIGFsZ29yaXRobSkuXG4gKiBAcGFyYW0gZm9yY2VPdmVycmlkZSB3aGV0aGVyIG9yIG5vdCB0byBza2lwIGFsbCBkaXJlY3RpdmUgcHJpb3JpdGl6YXRpb25cbiAqICAgIGFuZCBqdXN0IGFwcGx5IHRoZSB2YWx1ZSByZWdhcmRsZXNzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gdXBkYXRlU3R5bGVQcm9wKFxuICAgIGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBvZmZzZXQ6IG51bWJlcixcbiAgICBpbnB1dDogc3RyaW5nIHwgYm9vbGVhbiB8IG51bGwgfCBCb3VuZFBsYXllckZhY3Rvcnk8c3RyaW5nfGJvb2xlYW58bnVsbD4sIGRpcmVjdGl2ZVJlZj86IGFueSxcbiAgICBmb3JjZU92ZXJyaWRlPzogYm9vbGVhbik6IHZvaWQge1xuICB1cGRhdGVTaW5nbGVTdHlsaW5nVmFsdWUoY29udGV4dCwgb2Zmc2V0LCBpbnB1dCwgZmFsc2UsIGRpcmVjdGl2ZVJlZiwgZm9yY2VPdmVycmlkZSk7XG59XG5cbmZ1bmN0aW9uIHVwZGF0ZVNpbmdsZVN0eWxpbmdWYWx1ZShcbiAgICBjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgb2Zmc2V0OiBudW1iZXIsXG4gICAgaW5wdXQ6IHN0cmluZyB8IGJvb2xlYW4gfCBudWxsIHwgQm91bmRQbGF5ZXJGYWN0b3J5PHN0cmluZ3xib29sZWFufG51bGw+LCBpc0NsYXNzQmFzZWQ6IGJvb2xlYW4sXG4gICAgZGlyZWN0aXZlUmVmOiBhbnksIGZvcmNlT3ZlcnJpZGU/OiBib29sZWFuKTogdm9pZCB7XG4gIGNvbnN0IGRpcmVjdGl2ZUluZGV4ID0gZ2V0RGlyZWN0aXZlSW5kZXhGcm9tUmVnaXN0cnkoY29udGV4dCwgZGlyZWN0aXZlUmVmIHx8IG51bGwpO1xuICBjb25zdCBzaW5nbGVJbmRleCA9IGdldFNpbmdsZVByb3BJbmRleFZhbHVlKGNvbnRleHQsIGRpcmVjdGl2ZUluZGV4LCBvZmZzZXQsIGlzQ2xhc3NCYXNlZCk7XG4gIGNvbnN0IGN1cnJWYWx1ZSA9IGdldFZhbHVlKGNvbnRleHQsIHNpbmdsZUluZGV4KTtcbiAgY29uc3QgY3VyckZsYWcgPSBnZXRQb2ludGVycyhjb250ZXh0LCBzaW5nbGVJbmRleCk7XG4gIGNvbnN0IGN1cnJEaXJlY3RpdmUgPSBnZXREaXJlY3RpdmVJbmRleEZyb21FbnRyeShjb250ZXh0LCBzaW5nbGVJbmRleCk7XG4gIGNvbnN0IHZhbHVlOiBzdHJpbmd8Ym9vbGVhbnxudWxsID0gKGlucHV0IGluc3RhbmNlb2YgQm91bmRQbGF5ZXJGYWN0b3J5KSA/IGlucHV0LnZhbHVlIDogaW5wdXQ7XG5cbiAgaWYgKGhhc1ZhbHVlQ2hhbmdlZChjdXJyRmxhZywgY3VyclZhbHVlLCB2YWx1ZSkgJiZcbiAgICAgIChmb3JjZU92ZXJyaWRlIHx8IGFsbG93VmFsdWVDaGFuZ2UoY3VyclZhbHVlLCB2YWx1ZSwgY3VyckRpcmVjdGl2ZSwgZGlyZWN0aXZlSW5kZXgpKSkge1xuICAgIGNvbnN0IGlzQ2xhc3NCYXNlZCA9IChjdXJyRmxhZyAmIFN0eWxpbmdGbGFncy5DbGFzcykgPT09IFN0eWxpbmdGbGFncy5DbGFzcztcbiAgICBjb25zdCBlbGVtZW50ID0gY29udGV4dFtTdHlsaW5nSW5kZXguRWxlbWVudFBvc2l0aW9uXSAhYXMgSFRNTEVsZW1lbnQ7XG4gICAgY29uc3QgcGxheWVyQnVpbGRlciA9IGlucHV0IGluc3RhbmNlb2YgQm91bmRQbGF5ZXJGYWN0b3J5ID9cbiAgICAgICAgbmV3IENsYXNzQW5kU3R5bGVQbGF5ZXJCdWlsZGVyKFxuICAgICAgICAgICAgaW5wdXQgYXMgYW55LCBlbGVtZW50LCBpc0NsYXNzQmFzZWQgPyBCaW5kaW5nVHlwZS5DbGFzcyA6IEJpbmRpbmdUeXBlLlN0eWxlKSA6XG4gICAgICAgIG51bGw7XG4gICAgY29uc3QgdmFsdWUgPSAocGxheWVyQnVpbGRlciA/IChpbnB1dCBhcyBCb3VuZFBsYXllckZhY3Rvcnk8YW55PikudmFsdWUgOiBpbnB1dCkgYXMgc3RyaW5nIHxcbiAgICAgICAgYm9vbGVhbiB8IG51bGw7XG4gICAgY29uc3QgY3VyclBsYXllckluZGV4ID0gZ2V0UGxheWVyQnVpbGRlckluZGV4KGNvbnRleHQsIHNpbmdsZUluZGV4KTtcblxuICAgIGxldCBwbGF5ZXJCdWlsZGVyc0FyZURpcnR5ID0gZmFsc2U7XG4gICAgbGV0IHBsYXllckJ1aWxkZXJJbmRleCA9IHBsYXllckJ1aWxkZXIgPyBjdXJyUGxheWVySW5kZXggOiAwO1xuICAgIGlmIChoYXNQbGF5ZXJCdWlsZGVyQ2hhbmdlZChjb250ZXh0LCBwbGF5ZXJCdWlsZGVyLCBjdXJyUGxheWVySW5kZXgpKSB7XG4gICAgICBjb25zdCBuZXdJbmRleCA9IHNldFBsYXllckJ1aWxkZXIoY29udGV4dCwgcGxheWVyQnVpbGRlciwgY3VyclBsYXllckluZGV4KTtcbiAgICAgIHBsYXllckJ1aWxkZXJJbmRleCA9IHBsYXllckJ1aWxkZXIgPyBuZXdJbmRleCA6IDA7XG4gICAgICBwbGF5ZXJCdWlsZGVyc0FyZURpcnR5ID0gdHJ1ZTtcbiAgICB9XG5cbiAgICBpZiAocGxheWVyQnVpbGRlcnNBcmVEaXJ0eSB8fCBjdXJyRGlyZWN0aXZlICE9PSBkaXJlY3RpdmVJbmRleCkge1xuICAgICAgc2V0UGxheWVyQnVpbGRlckluZGV4KGNvbnRleHQsIHNpbmdsZUluZGV4LCBwbGF5ZXJCdWlsZGVySW5kZXgsIGRpcmVjdGl2ZUluZGV4KTtcbiAgICB9XG5cbiAgICBpZiAoY3VyckRpcmVjdGl2ZSAhPT0gZGlyZWN0aXZlSW5kZXgpIHtcbiAgICAgIGNvbnN0IHByb3AgPSBnZXRQcm9wKGNvbnRleHQsIHNpbmdsZUluZGV4KTtcbiAgICAgIGNvbnN0IHNhbml0aXplciA9IGdldFN0eWxlU2FuaXRpemVyKGNvbnRleHQsIGRpcmVjdGl2ZUluZGV4KTtcbiAgICAgIHNldFNhbml0aXplRmxhZyhjb250ZXh0LCBzaW5nbGVJbmRleCwgKHNhbml0aXplciAmJiBzYW5pdGl6ZXIocHJvcCkpID8gdHJ1ZSA6IGZhbHNlKTtcbiAgICB9XG5cbiAgICAvLyB0aGUgdmFsdWUgd2lsbCBhbHdheXMgZ2V0IHVwZGF0ZWQgKGV2ZW4gaWYgdGhlIGRpcnR5IGZsYWcgaXMgc2tpcHBlZClcbiAgICBzZXRWYWx1ZShjb250ZXh0LCBzaW5nbGVJbmRleCwgdmFsdWUpO1xuICAgIGNvbnN0IGluZGV4Rm9yTXVsdGkgPSBnZXRNdWx0aU9yU2luZ2xlSW5kZXgoY3VyckZsYWcpO1xuXG4gICAgLy8gaWYgdGhlIHZhbHVlIGlzIHRoZSBzYW1lIGluIHRoZSBtdWx0aS1hcmVhIHRoZW4gdGhlcmUncyBubyBwb2ludCBpbiByZS1hc3NlbWJsaW5nXG4gICAgY29uc3QgdmFsdWVGb3JNdWx0aSA9IGdldFZhbHVlKGNvbnRleHQsIGluZGV4Rm9yTXVsdGkpO1xuICAgIGlmICghdmFsdWVGb3JNdWx0aSB8fCBoYXNWYWx1ZUNoYW5nZWQoY3VyckZsYWcsIHZhbHVlRm9yTXVsdGksIHZhbHVlKSkge1xuICAgICAgbGV0IG11bHRpRGlydHkgPSBmYWxzZTtcbiAgICAgIGxldCBzaW5nbGVEaXJ0eSA9IHRydWU7XG5cbiAgICAgIC8vIG9ubHkgd2hlbiB0aGUgdmFsdWUgaXMgc2V0IHRvIGBudWxsYCBzaG91bGQgdGhlIG11bHRpLXZhbHVlIGdldCBmbGFnZ2VkXG4gICAgICBpZiAoIXZhbHVlRXhpc3RzKHZhbHVlLCBpc0NsYXNzQmFzZWQpICYmIHZhbHVlRXhpc3RzKHZhbHVlRm9yTXVsdGksIGlzQ2xhc3NCYXNlZCkpIHtcbiAgICAgICAgbXVsdGlEaXJ0eSA9IHRydWU7XG4gICAgICAgIHNpbmdsZURpcnR5ID0gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIHNldERpcnR5KGNvbnRleHQsIGluZGV4Rm9yTXVsdGksIG11bHRpRGlydHkpO1xuICAgICAgc2V0RGlydHkoY29udGV4dCwgc2luZ2xlSW5kZXgsIHNpbmdsZURpcnR5KTtcbiAgICAgIHNldERpcmVjdGl2ZURpcnR5KGNvbnRleHQsIGRpcmVjdGl2ZUluZGV4LCB0cnVlKTtcbiAgICAgIHNldENvbnRleHREaXJ0eShjb250ZXh0LCB0cnVlKTtcbiAgICB9XG5cbiAgICBpZiAocGxheWVyQnVpbGRlcnNBcmVEaXJ0eSkge1xuICAgICAgc2V0Q29udGV4dFBsYXllcnNEaXJ0eShjb250ZXh0LCB0cnVlKTtcbiAgICB9XG4gIH1cbn1cblxuXG4vKipcbiAqIFJlbmRlcnMgYWxsIHF1ZXVlZCBzdHlsaW5nIHVzaW5nIGEgcmVuZGVyZXIgb250byB0aGUgZ2l2ZW4gZWxlbWVudC5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIHdvcmtzIGJ5IHJlbmRlcmluZyBhbnkgc3R5bGVzICh0aGF0IGhhdmUgYmVlbiBhcHBsaWVkXG4gKiB1c2luZyBgdXBkYXRlU3R5bGluZ01hcGApIGFuZCBhbnkgY2xhc3NlcyAodGhhdCBoYXZlIGJlZW4gYXBwbGllZCB1c2luZ1xuICogYHVwZGF0ZVN0eWxlUHJvcGApIG9udG8gdGhlIHByb3ZpZGVkIGVsZW1lbnQgdXNpbmcgdGhlIHByb3ZpZGVkIHJlbmRlcmVyLlxuICogSnVzdCBiZWZvcmUgdGhlIHN0eWxlcy9jbGFzc2VzIGFyZSByZW5kZXJlZCBhIGZpbmFsIGtleS92YWx1ZSBzdHlsZSBtYXBcbiAqIHdpbGwgYmUgYXNzZW1ibGVkIChpZiBgc3R5bGVTdG9yZWAgb3IgYGNsYXNzU3RvcmVgIGFyZSBwcm92aWRlZCkuXG4gKlxuICogQHBhcmFtIGxFbGVtZW50IHRoZSBlbGVtZW50IHRoYXQgdGhlIHN0eWxlcyB3aWxsIGJlIHJlbmRlcmVkIG9uXG4gKiBAcGFyYW0gY29udGV4dCBUaGUgc3R5bGluZyBjb250ZXh0IHRoYXQgd2lsbCBiZSB1c2VkIHRvIGRldGVybWluZVxuICogICAgICB3aGF0IHN0eWxlcyB3aWxsIGJlIHJlbmRlcmVkXG4gKiBAcGFyYW0gcmVuZGVyZXIgdGhlIHJlbmRlcmVyIHRoYXQgd2lsbCBiZSB1c2VkIHRvIGFwcGx5IHRoZSBzdHlsaW5nXG4gKiBAcGFyYW0gY2xhc3Nlc1N0b3JlIGlmIHByb3ZpZGVkLCB0aGUgdXBkYXRlZCBjbGFzcyB2YWx1ZXMgd2lsbCBiZSBhcHBsaWVkXG4gKiAgICB0byB0aGlzIGtleS92YWx1ZSBtYXAgaW5zdGVhZCBvZiBiZWluZyByZW5kZXJlcmVkIHZpYSB0aGUgcmVuZGVyZXIuXG4gKiBAcGFyYW0gc3R5bGVzU3RvcmUgaWYgcHJvdmlkZWQsIHRoZSB1cGRhdGVkIHN0eWxlIHZhbHVlcyB3aWxsIGJlIGFwcGxpZWRcbiAqICAgIHRvIHRoaXMga2V5L3ZhbHVlIG1hcCBpbnN0ZWFkIG9mIGJlaW5nIHJlbmRlcmVyZWQgdmlhIHRoZSByZW5kZXJlci5cbiAqIEBwYXJhbSBkaXJlY3RpdmVSZWYgYW4gb3B0aW9uYWwgZGlyZWN0aXZlIHRoYXQgd2lsbCBiZSB1c2VkIHRvIHRhcmdldCB3aGljaFxuICogICAgc3R5bGluZyB2YWx1ZXMgYXJlIHJlbmRlcmVkLiBJZiBsZWZ0IGVtcHR5LCBvbmx5IHRoZSBiaW5kaW5ncyB0aGF0IGFyZVxuICogICAgcmVnaXN0ZXJlZCBvbiB0aGUgdGVtcGxhdGUgd2lsbCBiZSByZW5kZXJlZC5cbiAqIEByZXR1cm5zIG51bWJlciB0aGUgdG90YWwgYW1vdW50IG9mIHBsYXllcnMgdGhhdCBnb3QgcXVldWVkIGZvciBhbmltYXRpb24gKGlmIGFueSlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlbmRlclN0eWxpbmcoXG4gICAgY29udGV4dDogU3R5bGluZ0NvbnRleHQsIHJlbmRlcmVyOiBSZW5kZXJlcjMsIHJvb3RPclZpZXc6IFJvb3RDb250ZXh0IHwgTFZpZXcsXG4gICAgaXNGaXJzdFJlbmRlcjogYm9vbGVhbiwgY2xhc3Nlc1N0b3JlPzogQmluZGluZ1N0b3JlIHwgbnVsbCwgc3R5bGVzU3RvcmU/OiBCaW5kaW5nU3RvcmUgfCBudWxsLFxuICAgIGRpcmVjdGl2ZVJlZj86IGFueSk6IG51bWJlciB7XG4gIGxldCB0b3RhbFBsYXllcnNRdWV1ZWQgPSAwO1xuICBjb25zdCB0YXJnZXREaXJlY3RpdmVJbmRleCA9IGdldERpcmVjdGl2ZUluZGV4RnJvbVJlZ2lzdHJ5KGNvbnRleHQsIGRpcmVjdGl2ZVJlZiB8fCBudWxsKTtcblxuICBpZiAoaXNDb250ZXh0RGlydHkoY29udGV4dCkgJiYgaXNEaXJlY3RpdmVEaXJ0eShjb250ZXh0LCB0YXJnZXREaXJlY3RpdmVJbmRleCkpIHtcbiAgICBjb25zdCBmbHVzaFBsYXllckJ1aWxkZXJzOiBhbnkgPVxuICAgICAgICBjb250ZXh0W1N0eWxpbmdJbmRleC5NYXN0ZXJGbGFnUG9zaXRpb25dICYgU3R5bGluZ0ZsYWdzLlBsYXllckJ1aWxkZXJzRGlydHk7XG4gICAgY29uc3QgbmF0aXZlID0gY29udGV4dFtTdHlsaW5nSW5kZXguRWxlbWVudFBvc2l0aW9uXSAhO1xuICAgIGNvbnN0IG11bHRpU3RhcnRJbmRleCA9IGdldE11bHRpU3R5bGVzU3RhcnRJbmRleChjb250ZXh0KTtcblxuICAgIGxldCBzdGlsbERpcnR5ID0gZmFsc2U7XG4gICAgZm9yIChsZXQgaSA9IFN0eWxpbmdJbmRleC5TaW5nbGVTdHlsZXNTdGFydFBvc2l0aW9uOyBpIDwgY29udGV4dC5sZW5ndGg7XG4gICAgICAgICBpICs9IFN0eWxpbmdJbmRleC5TaXplKSB7XG4gICAgICAvLyB0aGVyZSBpcyBubyBwb2ludCBpbiByZW5kZXJpbmcgc3R5bGVzIHRoYXQgaGF2ZSBub3QgY2hhbmdlZCBvbiBzY3JlZW5cbiAgICAgIGlmIChpc0RpcnR5KGNvbnRleHQsIGkpKSB7XG4gICAgICAgIGNvbnN0IGZsYWcgPSBnZXRQb2ludGVycyhjb250ZXh0LCBpKTtcbiAgICAgICAgY29uc3QgZGlyZWN0aXZlSW5kZXggPSBnZXREaXJlY3RpdmVJbmRleEZyb21FbnRyeShjb250ZXh0LCBpKTtcbiAgICAgICAgaWYgKHRhcmdldERpcmVjdGl2ZUluZGV4ICE9PSBkaXJlY3RpdmVJbmRleCkge1xuICAgICAgICAgIHN0aWxsRGlydHkgPSB0cnVlO1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgcHJvcCA9IGdldFByb3AoY29udGV4dCwgaSk7XG4gICAgICAgIGNvbnN0IHZhbHVlID0gZ2V0VmFsdWUoY29udGV4dCwgaSk7XG4gICAgICAgIGNvbnN0IHN0eWxlU2FuaXRpemVyID1cbiAgICAgICAgICAgIChmbGFnICYgU3R5bGluZ0ZsYWdzLlNhbml0aXplKSA/IGdldFN0eWxlU2FuaXRpemVyKGNvbnRleHQsIGRpcmVjdGl2ZUluZGV4KSA6IG51bGw7XG4gICAgICAgIGNvbnN0IHBsYXllckJ1aWxkZXIgPSBnZXRQbGF5ZXJCdWlsZGVyKGNvbnRleHQsIGkpO1xuICAgICAgICBjb25zdCBpc0NsYXNzQmFzZWQgPSBmbGFnICYgU3R5bGluZ0ZsYWdzLkNsYXNzID8gdHJ1ZSA6IGZhbHNlO1xuICAgICAgICBjb25zdCBpc0luU2luZ2xlUmVnaW9uID0gaSA8IG11bHRpU3RhcnRJbmRleDtcblxuICAgICAgICBsZXQgdmFsdWVUb0FwcGx5OiBzdHJpbmd8Ym9vbGVhbnxudWxsID0gdmFsdWU7XG5cbiAgICAgICAgLy8gVkFMVUUgREVGRVIgQ0FTRSAxOiBVc2UgYSBtdWx0aSB2YWx1ZSBpbnN0ZWFkIG9mIGEgbnVsbCBzaW5nbGUgdmFsdWVcbiAgICAgICAgLy8gdGhpcyBjaGVjayBpbXBsaWVzIHRoYXQgYSBzaW5nbGUgdmFsdWUgd2FzIHJlbW92ZWQgYW5kIHdlXG4gICAgICAgIC8vIHNob3VsZCBub3cgZGVmZXIgdG8gYSBtdWx0aSB2YWx1ZSBhbmQgdXNlIHRoYXQgKGlmIHNldCkuXG4gICAgICAgIGlmIChpc0luU2luZ2xlUmVnaW9uICYmICF2YWx1ZUV4aXN0cyh2YWx1ZVRvQXBwbHksIGlzQ2xhc3NCYXNlZCkpIHtcbiAgICAgICAgICAvLyBzaW5nbGUgdmFsdWVzIEFMV0FZUyBoYXZlIGEgcmVmZXJlbmNlIHRvIGEgbXVsdGkgaW5kZXhcbiAgICAgICAgICBjb25zdCBtdWx0aUluZGV4ID0gZ2V0TXVsdGlPclNpbmdsZUluZGV4KGZsYWcpO1xuICAgICAgICAgIHZhbHVlVG9BcHBseSA9IGdldFZhbHVlKGNvbnRleHQsIG11bHRpSW5kZXgpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVkFMVUUgREVGRVIgQ0FTRSAyOiBVc2UgdGhlIGluaXRpYWwgdmFsdWUgaWYgYWxsIGVsc2UgZmFpbHMgKGlzIGZhbHN5KVxuICAgICAgICAvLyB0aGUgaW5pdGlhbCB2YWx1ZSB3aWxsIGFsd2F5cyBiZSBhIHN0cmluZyBvciBudWxsLFxuICAgICAgICAvLyB0aGVyZWZvcmUgd2UgY2FuIHNhZmVseSBhZG9wdCBpdCBpbmNhc2UgdGhlcmUncyBub3RoaW5nIGVsc2VcbiAgICAgICAgLy8gbm90ZSB0aGF0IHRoaXMgc2hvdWxkIGFsd2F5cyBiZSBhIGZhbHN5IGNoZWNrIHNpbmNlIGBmYWxzZWAgaXMgdXNlZFxuICAgICAgICAvLyBmb3IgYm90aCBjbGFzcyBhbmQgc3R5bGUgY29tcGFyaXNvbnMgKHN0eWxlcyBjYW4ndCBiZSBmYWxzZSBhbmQgZmFsc2VcbiAgICAgICAgLy8gY2xhc3NlcyBhcmUgdHVybmVkIG9mZiBhbmQgc2hvdWxkIHRoZXJlZm9yZSBkZWZlciB0byB0aGVpciBpbml0aWFsIHZhbHVlcylcbiAgICAgICAgLy8gTm90ZSB0aGF0IHdlIGlnbm9yZSBjbGFzcy1iYXNlZCBkZWZlcmFscyBiZWNhdXNlIG90aGVyd2lzZSBhIGNsYXNzIGNhbiBuZXZlclxuICAgICAgICAvLyBiZSByZW1vdmVkIGluIHRoZSBjYXNlIHRoYXQgaXQgZXhpc3RzIGFzIHRydWUgaW4gdGhlIGluaXRpYWwgY2xhc3NlcyBsaXN0Li4uXG4gICAgICAgIGlmICghdmFsdWVFeGlzdHModmFsdWVUb0FwcGx5LCBpc0NsYXNzQmFzZWQpKSB7XG4gICAgICAgICAgdmFsdWVUb0FwcGx5ID0gZ2V0SW5pdGlhbFZhbHVlKGNvbnRleHQsIGZsYWcpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gaWYgdGhlIGZpcnN0IHJlbmRlciBpcyB0cnVlIHRoZW4gd2UgZG8gbm90IHdhbnQgdG8gc3RhcnQgYXBwbHlpbmcgZmFsc3lcbiAgICAgICAgLy8gdmFsdWVzIHRvIHRoZSBET00gZWxlbWVudCdzIHN0eWxpbmcuIE90aGVyd2lzZSB0aGVuIHdlIGtub3cgdGhlcmUgaGFzXG4gICAgICAgIC8vIGJlZW4gYSBjaGFuZ2UgYW5kIGV2ZW4gaWYgaXQncyBmYWxzeSB0aGVuIGl0J3MgcmVtb3Zpbmcgc29tZXRoaW5nIHRoYXRcbiAgICAgICAgLy8gd2FzIHRydXRoeSBiZWZvcmUuXG4gICAgICAgIGNvbnN0IGRvQXBwbHlWYWx1ZSA9IGlzRmlyc3RSZW5kZXIgPyB2YWx1ZVRvQXBwbHkgOiB0cnVlO1xuICAgICAgICBpZiAoZG9BcHBseVZhbHVlKSB7XG4gICAgICAgICAgaWYgKGlzQ2xhc3NCYXNlZCkge1xuICAgICAgICAgICAgc2V0Q2xhc3MoXG4gICAgICAgICAgICAgICAgbmF0aXZlLCBwcm9wLCB2YWx1ZVRvQXBwbHkgPyB0cnVlIDogZmFsc2UsIHJlbmRlcmVyLCBjbGFzc2VzU3RvcmUsIHBsYXllckJ1aWxkZXIpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzZXRTdHlsZShcbiAgICAgICAgICAgICAgICBuYXRpdmUsIHByb3AsIHZhbHVlVG9BcHBseSBhcyBzdHJpbmcgfCBudWxsLCByZW5kZXJlciwgc3R5bGVTYW5pdGl6ZXIsIHN0eWxlc1N0b3JlLFxuICAgICAgICAgICAgICAgIHBsYXllckJ1aWxkZXIpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHNldERpcnR5KGNvbnRleHQsIGksIGZhbHNlKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoZmx1c2hQbGF5ZXJCdWlsZGVycykge1xuICAgICAgY29uc3Qgcm9vdENvbnRleHQgPVxuICAgICAgICAgIEFycmF5LmlzQXJyYXkocm9vdE9yVmlldykgPyBnZXRSb290Q29udGV4dChyb290T3JWaWV3KSA6IHJvb3RPclZpZXcgYXMgUm9vdENvbnRleHQ7XG4gICAgICBjb25zdCBwbGF5ZXJDb250ZXh0ID0gZ2V0UGxheWVyQ29udGV4dChjb250ZXh0KSAhO1xuICAgICAgY29uc3QgcGxheWVyc1N0YXJ0SW5kZXggPSBwbGF5ZXJDb250ZXh0W1BsYXllckluZGV4Lk5vbkJ1aWxkZXJQbGF5ZXJzU3RhcnRdO1xuICAgICAgZm9yIChsZXQgaSA9IFBsYXllckluZGV4LlBsYXllckJ1aWxkZXJzU3RhcnRQb3NpdGlvbjsgaSA8IHBsYXllcnNTdGFydEluZGV4O1xuICAgICAgICAgICBpICs9IFBsYXllckluZGV4LlBsYXllckFuZFBsYXllckJ1aWxkZXJzVHVwbGVTaXplKSB7XG4gICAgICAgIGNvbnN0IGJ1aWxkZXIgPSBwbGF5ZXJDb250ZXh0W2ldIGFzIENsYXNzQW5kU3R5bGVQbGF5ZXJCdWlsZGVyPGFueT58IG51bGw7XG4gICAgICAgIGNvbnN0IHBsYXllckluc2VydGlvbkluZGV4ID0gaSArIFBsYXllckluZGV4LlBsYXllck9mZnNldFBvc2l0aW9uO1xuICAgICAgICBjb25zdCBvbGRQbGF5ZXIgPSBwbGF5ZXJDb250ZXh0W3BsYXllckluc2VydGlvbkluZGV4XSBhcyBQbGF5ZXIgfCBudWxsO1xuICAgICAgICBpZiAoYnVpbGRlcikge1xuICAgICAgICAgIGNvbnN0IHBsYXllciA9IGJ1aWxkZXIuYnVpbGRQbGF5ZXIob2xkUGxheWVyLCBpc0ZpcnN0UmVuZGVyKTtcbiAgICAgICAgICBpZiAocGxheWVyICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGlmIChwbGF5ZXIgIT0gbnVsbCkge1xuICAgICAgICAgICAgICBjb25zdCB3YXNRdWV1ZWQgPSBhZGRQbGF5ZXJJbnRlcm5hbChcbiAgICAgICAgICAgICAgICAgIHBsYXllckNvbnRleHQsIHJvb3RDb250ZXh0LCBuYXRpdmUgYXMgSFRNTEVsZW1lbnQsIHBsYXllciwgcGxheWVySW5zZXJ0aW9uSW5kZXgpO1xuICAgICAgICAgICAgICB3YXNRdWV1ZWQgJiYgdG90YWxQbGF5ZXJzUXVldWVkKys7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAob2xkUGxheWVyKSB7XG4gICAgICAgICAgICAgIG9sZFBsYXllci5kZXN0cm95KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKG9sZFBsYXllcikge1xuICAgICAgICAgIC8vIHRoZSBwbGF5ZXIgYnVpbGRlciBoYXMgYmVlbiByZW1vdmVkIC4uLiB0aGVyZWZvcmUgd2Ugc2hvdWxkIGRlbGV0ZSB0aGUgYXNzb2NpYXRlZFxuICAgICAgICAgIC8vIHBsYXllclxuICAgICAgICAgIG9sZFBsYXllci5kZXN0cm95KCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHNldENvbnRleHRQbGF5ZXJzRGlydHkoY29udGV4dCwgZmFsc2UpO1xuICAgIH1cblxuICAgIHNldERpcmVjdGl2ZURpcnR5KGNvbnRleHQsIHRhcmdldERpcmVjdGl2ZUluZGV4LCBmYWxzZSk7XG4gICAgc2V0Q29udGV4dERpcnR5KGNvbnRleHQsIHN0aWxsRGlydHkpO1xuICB9XG5cbiAgcmV0dXJuIHRvdGFsUGxheWVyc1F1ZXVlZDtcbn1cblxuLyoqXG4gKiBBc3NpZ25zIGEgc3R5bGUgdmFsdWUgdG8gYSBzdHlsZSBwcm9wZXJ0eSBmb3IgdGhlIGdpdmVuIGVsZW1lbnQuXG4gKlxuICogVGhpcyBmdW5jdGlvbiByZW5kZXJzIGEgZ2l2ZW4gQ1NTIHByb3AvdmFsdWUgZW50cnkgdXNpbmcgdGhlXG4gKiBwcm92aWRlZCByZW5kZXJlci4gSWYgYSBgc3RvcmVgIHZhbHVlIGlzIHByb3ZpZGVkIHRoZW5cbiAqIHRoYXQgd2lsbCBiZSB1c2VkIGEgcmVuZGVyIGNvbnRleHQgaW5zdGVhZCBvZiB0aGUgcHJvdmlkZWRcbiAqIHJlbmRlcmVyLlxuICpcbiAqIEBwYXJhbSBuYXRpdmUgdGhlIERPTSBFbGVtZW50XG4gKiBAcGFyYW0gcHJvcCB0aGUgQ1NTIHN0eWxlIHByb3BlcnR5IHRoYXQgd2lsbCBiZSByZW5kZXJlZFxuICogQHBhcmFtIHZhbHVlIHRoZSBDU1Mgc3R5bGUgdmFsdWUgdGhhdCB3aWxsIGJlIHJlbmRlcmVkXG4gKiBAcGFyYW0gcmVuZGVyZXJcbiAqIEBwYXJhbSBzdG9yZSBhbiBvcHRpb25hbCBrZXkvdmFsdWUgbWFwIHRoYXQgd2lsbCBiZSB1c2VkIGFzIGEgY29udGV4dCB0byByZW5kZXIgc3R5bGVzIG9uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzZXRTdHlsZShcbiAgICBuYXRpdmU6IGFueSwgcHJvcDogc3RyaW5nLCB2YWx1ZTogc3RyaW5nIHwgbnVsbCwgcmVuZGVyZXI6IFJlbmRlcmVyMyxcbiAgICBzYW5pdGl6ZXI6IFN0eWxlU2FuaXRpemVGbiB8IG51bGwsIHN0b3JlPzogQmluZGluZ1N0b3JlIHwgbnVsbCxcbiAgICBwbGF5ZXJCdWlsZGVyPzogQ2xhc3NBbmRTdHlsZVBsYXllckJ1aWxkZXI8YW55PnwgbnVsbCkge1xuICB2YWx1ZSA9IHNhbml0aXplciAmJiB2YWx1ZSA/IHNhbml0aXplcihwcm9wLCB2YWx1ZSkgOiB2YWx1ZTtcbiAgaWYgKHN0b3JlIHx8IHBsYXllckJ1aWxkZXIpIHtcbiAgICBpZiAoc3RvcmUpIHtcbiAgICAgIHN0b3JlLnNldFZhbHVlKHByb3AsIHZhbHVlKTtcbiAgICB9XG4gICAgaWYgKHBsYXllckJ1aWxkZXIpIHtcbiAgICAgIHBsYXllckJ1aWxkZXIuc2V0VmFsdWUocHJvcCwgdmFsdWUpO1xuICAgIH1cbiAgfSBlbHNlIGlmICh2YWx1ZSkge1xuICAgIHZhbHVlID0gdmFsdWUudG9TdHJpbmcoKTsgIC8vIG9wYWNpdHksIHotaW5kZXggYW5kIGZsZXhib3ggYWxsIGhhdmUgbnVtYmVyIHZhbHVlcyB3aGljaCBtYXkgbm90XG4gICAgLy8gYXNzaWduIGFzIG51bWJlcnNcbiAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyU2V0U3R5bGUrKztcbiAgICBpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikgP1xuICAgICAgICByZW5kZXJlci5zZXRTdHlsZShuYXRpdmUsIHByb3AsIHZhbHVlLCBSZW5kZXJlclN0eWxlRmxhZ3MzLkRhc2hDYXNlKSA6XG4gICAgICAgIG5hdGl2ZS5zdHlsZS5zZXRQcm9wZXJ0eShwcm9wLCB2YWx1ZSk7XG4gIH0gZWxzZSB7XG4gICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlclJlbW92ZVN0eWxlKys7XG4gICAgaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpID9cbiAgICAgICAgcmVuZGVyZXIucmVtb3ZlU3R5bGUobmF0aXZlLCBwcm9wLCBSZW5kZXJlclN0eWxlRmxhZ3MzLkRhc2hDYXNlKSA6XG4gICAgICAgIG5hdGl2ZS5zdHlsZS5yZW1vdmVQcm9wZXJ0eShwcm9wKTtcbiAgfVxufVxuXG4vKipcbiAqIEFkZHMvcmVtb3ZlcyB0aGUgcHJvdmlkZWQgY2xhc3NOYW1lIHZhbHVlIHRvIHRoZSBwcm92aWRlZCBlbGVtZW50LlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gcmVuZGVycyBhIGdpdmVuIENTUyBjbGFzcyB2YWx1ZSB1c2luZyB0aGUgcHJvdmlkZWRcbiAqIHJlbmRlcmVyIChieSBhZGRpbmcgb3IgcmVtb3ZpbmcgaXQgZnJvbSB0aGUgcHJvdmlkZWQgZWxlbWVudCkuXG4gKiBJZiBhIGBzdG9yZWAgdmFsdWUgaXMgcHJvdmlkZWQgdGhlbiB0aGF0IHdpbGwgYmUgdXNlZCBhIHJlbmRlclxuICogY29udGV4dCBpbnN0ZWFkIG9mIHRoZSBwcm92aWRlZCByZW5kZXJlci5cbiAqXG4gKiBAcGFyYW0gbmF0aXZlIHRoZSBET00gRWxlbWVudFxuICogQHBhcmFtIHByb3AgdGhlIENTUyBzdHlsZSBwcm9wZXJ0eSB0aGF0IHdpbGwgYmUgcmVuZGVyZWRcbiAqIEBwYXJhbSB2YWx1ZSB0aGUgQ1NTIHN0eWxlIHZhbHVlIHRoYXQgd2lsbCBiZSByZW5kZXJlZFxuICogQHBhcmFtIHJlbmRlcmVyXG4gKiBAcGFyYW0gc3RvcmUgYW4gb3B0aW9uYWwga2V5L3ZhbHVlIG1hcCB0aGF0IHdpbGwgYmUgdXNlZCBhcyBhIGNvbnRleHQgdG8gcmVuZGVyIHN0eWxlcyBvblxuICovXG5mdW5jdGlvbiBzZXRDbGFzcyhcbiAgICBuYXRpdmU6IGFueSwgY2xhc3NOYW1lOiBzdHJpbmcsIGFkZDogYm9vbGVhbiwgcmVuZGVyZXI6IFJlbmRlcmVyMywgc3RvcmU/OiBCaW5kaW5nU3RvcmUgfCBudWxsLFxuICAgIHBsYXllckJ1aWxkZXI/OiBDbGFzc0FuZFN0eWxlUGxheWVyQnVpbGRlcjxhbnk+fCBudWxsKSB7XG4gIGlmIChzdG9yZSB8fCBwbGF5ZXJCdWlsZGVyKSB7XG4gICAgaWYgKHN0b3JlKSB7XG4gICAgICBzdG9yZS5zZXRWYWx1ZShjbGFzc05hbWUsIGFkZCk7XG4gICAgfVxuICAgIGlmIChwbGF5ZXJCdWlsZGVyKSB7XG4gICAgICBwbGF5ZXJCdWlsZGVyLnNldFZhbHVlKGNsYXNzTmFtZSwgYWRkKTtcbiAgICB9XG4gICAgLy8gRE9NVG9rZW5MaXN0IHdpbGwgdGhyb3cgaWYgd2UgdHJ5IHRvIGFkZCBvciByZW1vdmUgYW4gZW1wdHkgc3RyaW5nLlxuICB9IGVsc2UgaWYgKGNsYXNzTmFtZSAhPT0gJycpIHtcbiAgICBpZiAoYWRkKSB7XG4gICAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyQWRkQ2xhc3MrKztcbiAgICAgIGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSA/IHJlbmRlcmVyLmFkZENsYXNzKG5hdGl2ZSwgY2xhc3NOYW1lKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYXRpdmVbJ2NsYXNzTGlzdCddLmFkZChjbGFzc05hbWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyUmVtb3ZlQ2xhc3MrKztcbiAgICAgIGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSA/IHJlbmRlcmVyLnJlbW92ZUNsYXNzKG5hdGl2ZSwgY2xhc3NOYW1lKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYXRpdmVbJ2NsYXNzTGlzdCddLnJlbW92ZShjbGFzc05hbWUpO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBzZXRTYW5pdGl6ZUZsYWcoY29udGV4dDogU3R5bGluZ0NvbnRleHQsIGluZGV4OiBudW1iZXIsIHNhbml0aXplWWVzOiBib29sZWFuKSB7XG4gIGlmIChzYW5pdGl6ZVllcykge1xuICAgIChjb250ZXh0W2luZGV4XSBhcyBudW1iZXIpIHw9IFN0eWxpbmdGbGFncy5TYW5pdGl6ZTtcbiAgfSBlbHNlIHtcbiAgICAoY29udGV4dFtpbmRleF0gYXMgbnVtYmVyKSAmPSB+U3R5bGluZ0ZsYWdzLlNhbml0aXplO1xuICB9XG59XG5cbmZ1bmN0aW9uIHNldERpcnR5KGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBpbmRleDogbnVtYmVyLCBpc0RpcnR5WWVzOiBib29sZWFuKSB7XG4gIGNvbnN0IGFkanVzdGVkSW5kZXggPVxuICAgICAgaW5kZXggPj0gU3R5bGluZ0luZGV4LlNpbmdsZVN0eWxlc1N0YXJ0UG9zaXRpb24gPyAoaW5kZXggKyBTdHlsaW5nSW5kZXguRmxhZ3NPZmZzZXQpIDogaW5kZXg7XG4gIGlmIChpc0RpcnR5WWVzKSB7XG4gICAgKGNvbnRleHRbYWRqdXN0ZWRJbmRleF0gYXMgbnVtYmVyKSB8PSBTdHlsaW5nRmxhZ3MuRGlydHk7XG4gIH0gZWxzZSB7XG4gICAgKGNvbnRleHRbYWRqdXN0ZWRJbmRleF0gYXMgbnVtYmVyKSAmPSB+U3R5bGluZ0ZsYWdzLkRpcnR5O1xuICB9XG59XG5cbmZ1bmN0aW9uIGlzRGlydHkoY29udGV4dDogU3R5bGluZ0NvbnRleHQsIGluZGV4OiBudW1iZXIpOiBib29sZWFuIHtcbiAgY29uc3QgYWRqdXN0ZWRJbmRleCA9XG4gICAgICBpbmRleCA+PSBTdHlsaW5nSW5kZXguU2luZ2xlU3R5bGVzU3RhcnRQb3NpdGlvbiA/IChpbmRleCArIFN0eWxpbmdJbmRleC5GbGFnc09mZnNldCkgOiBpbmRleDtcbiAgcmV0dXJuICgoY29udGV4dFthZGp1c3RlZEluZGV4XSBhcyBudW1iZXIpICYgU3R5bGluZ0ZsYWdzLkRpcnR5KSA9PSBTdHlsaW5nRmxhZ3MuRGlydHk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0NsYXNzQmFzZWRWYWx1ZShjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgaW5kZXg6IG51bWJlcik6IGJvb2xlYW4ge1xuICBjb25zdCBhZGp1c3RlZEluZGV4ID1cbiAgICAgIGluZGV4ID49IFN0eWxpbmdJbmRleC5TaW5nbGVTdHlsZXNTdGFydFBvc2l0aW9uID8gKGluZGV4ICsgU3R5bGluZ0luZGV4LkZsYWdzT2Zmc2V0KSA6IGluZGV4O1xuICByZXR1cm4gKChjb250ZXh0W2FkanVzdGVkSW5kZXhdIGFzIG51bWJlcikgJiBTdHlsaW5nRmxhZ3MuQ2xhc3MpID09IFN0eWxpbmdGbGFncy5DbGFzcztcbn1cblxuZnVuY3Rpb24gaXNTYW5pdGl6YWJsZShjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgaW5kZXg6IG51bWJlcik6IGJvb2xlYW4ge1xuICBjb25zdCBhZGp1c3RlZEluZGV4ID1cbiAgICAgIGluZGV4ID49IFN0eWxpbmdJbmRleC5TaW5nbGVTdHlsZXNTdGFydFBvc2l0aW9uID8gKGluZGV4ICsgU3R5bGluZ0luZGV4LkZsYWdzT2Zmc2V0KSA6IGluZGV4O1xuICByZXR1cm4gKChjb250ZXh0W2FkanVzdGVkSW5kZXhdIGFzIG51bWJlcikgJiBTdHlsaW5nRmxhZ3MuU2FuaXRpemUpID09IFN0eWxpbmdGbGFncy5TYW5pdGl6ZTtcbn1cblxuZnVuY3Rpb24gcG9pbnRlcnMoY29uZmlnRmxhZzogbnVtYmVyLCBzdGF0aWNJbmRleDogbnVtYmVyLCBkeW5hbWljSW5kZXg6IG51bWJlcikge1xuICByZXR1cm4gKGNvbmZpZ0ZsYWcgJiBTdHlsaW5nRmxhZ3MuQml0TWFzaykgfCAoc3RhdGljSW5kZXggPDwgU3R5bGluZ0ZsYWdzLkJpdENvdW50U2l6ZSkgfFxuICAgICAgKGR5bmFtaWNJbmRleCA8PCAoU3R5bGluZ0luZGV4LkJpdENvdW50U2l6ZSArIFN0eWxpbmdGbGFncy5CaXRDb3VudFNpemUpKTtcbn1cblxuZnVuY3Rpb24gZ2V0SW5pdGlhbFZhbHVlKGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBmbGFnOiBudW1iZXIpOiBzdHJpbmd8Ym9vbGVhbnxudWxsIHtcbiAgY29uc3QgaW5kZXggPSBnZXRJbml0aWFsSW5kZXgoZmxhZyk7XG4gIGNvbnN0IGVudHJ5SXNDbGFzc0Jhc2VkID0gZmxhZyAmIFN0eWxpbmdGbGFncy5DbGFzcztcbiAgY29uc3QgaW5pdGlhbFZhbHVlcyA9IGVudHJ5SXNDbGFzc0Jhc2VkID8gY29udGV4dFtTdHlsaW5nSW5kZXguSW5pdGlhbENsYXNzVmFsdWVzUG9zaXRpb25dIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGV4dFtTdHlsaW5nSW5kZXguSW5pdGlhbFN0eWxlVmFsdWVzUG9zaXRpb25dO1xuICByZXR1cm4gaW5pdGlhbFZhbHVlc1tpbmRleF07XG59XG5cbmZ1bmN0aW9uIGdldEluaXRpYWxJbmRleChmbGFnOiBudW1iZXIpOiBudW1iZXIge1xuICByZXR1cm4gKGZsYWcgPj4gU3R5bGluZ0ZsYWdzLkJpdENvdW50U2l6ZSkgJiBTdHlsaW5nSW5kZXguQml0TWFzaztcbn1cblxuZnVuY3Rpb24gZ2V0TXVsdGlPclNpbmdsZUluZGV4KGZsYWc6IG51bWJlcik6IG51bWJlciB7XG4gIGNvbnN0IGluZGV4ID1cbiAgICAgIChmbGFnID4+IChTdHlsaW5nSW5kZXguQml0Q291bnRTaXplICsgU3R5bGluZ0ZsYWdzLkJpdENvdW50U2l6ZSkpICYgU3R5bGluZ0luZGV4LkJpdE1hc2s7XG4gIHJldHVybiBpbmRleCA+PSBTdHlsaW5nSW5kZXguU2luZ2xlU3R5bGVzU3RhcnRQb3NpdGlvbiA/IGluZGV4IDogLTE7XG59XG5cbmZ1bmN0aW9uIGdldE11bHRpU3RhcnRJbmRleChjb250ZXh0OiBTdHlsaW5nQ29udGV4dCk6IG51bWJlciB7XG4gIHJldHVybiBnZXRNdWx0aU9yU2luZ2xlSW5kZXgoY29udGV4dFtTdHlsaW5nSW5kZXguTWFzdGVyRmxhZ1Bvc2l0aW9uXSkgYXMgbnVtYmVyO1xufVxuXG5mdW5jdGlvbiBnZXRNdWx0aUNsYXNzZXNTdGFydEluZGV4KGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0KTogbnVtYmVyIHtcbiAgY29uc3QgY2xhc3NDYWNoZSA9IGNvbnRleHRbU3R5bGluZ0luZGV4LkNhY2hlZE11bHRpQ2xhc3Nlc107XG4gIHJldHVybiBjbGFzc0NhY2hlXG4gICAgICBbTWFwQmFzZWRPZmZzZXRWYWx1ZXNJbmRleC5WYWx1ZXNTdGFydFBvc2l0aW9uICtcbiAgICAgICBNYXBCYXNlZE9mZnNldFZhbHVlc0luZGV4LlBvc2l0aW9uU3RhcnRPZmZzZXRdO1xufVxuXG5mdW5jdGlvbiBnZXRNdWx0aVN0eWxlc1N0YXJ0SW5kZXgoY29udGV4dDogU3R5bGluZ0NvbnRleHQpOiBudW1iZXIge1xuICBjb25zdCBzdHlsZXNDYWNoZSA9IGNvbnRleHRbU3R5bGluZ0luZGV4LkNhY2hlZE11bHRpU3R5bGVzXTtcbiAgcmV0dXJuIHN0eWxlc0NhY2hlXG4gICAgICBbTWFwQmFzZWRPZmZzZXRWYWx1ZXNJbmRleC5WYWx1ZXNTdGFydFBvc2l0aW9uICtcbiAgICAgICBNYXBCYXNlZE9mZnNldFZhbHVlc0luZGV4LlBvc2l0aW9uU3RhcnRPZmZzZXRdO1xufVxuXG5mdW5jdGlvbiBzZXRQcm9wKGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBpbmRleDogbnVtYmVyLCBwcm9wOiBzdHJpbmcpIHtcbiAgY29udGV4dFtpbmRleCArIFN0eWxpbmdJbmRleC5Qcm9wZXJ0eU9mZnNldF0gPSBwcm9wO1xufVxuXG5mdW5jdGlvbiBzZXRWYWx1ZShjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgaW5kZXg6IG51bWJlciwgdmFsdWU6IHN0cmluZyB8IG51bGwgfCBib29sZWFuKSB7XG4gIGNvbnRleHRbaW5kZXggKyBTdHlsaW5nSW5kZXguVmFsdWVPZmZzZXRdID0gdmFsdWU7XG59XG5cbmZ1bmN0aW9uIGhhc1BsYXllckJ1aWxkZXJDaGFuZ2VkKFxuICAgIGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBidWlsZGVyOiBDbGFzc0FuZFN0eWxlUGxheWVyQnVpbGRlcjxhbnk+fCBudWxsLCBpbmRleDogbnVtYmVyKSB7XG4gIGNvbnN0IHBsYXllckNvbnRleHQgPSBjb250ZXh0W1N0eWxpbmdJbmRleC5QbGF5ZXJDb250ZXh0XSAhO1xuICBpZiAoYnVpbGRlcikge1xuICAgIGlmICghcGxheWVyQ29udGV4dCB8fCBpbmRleCA9PT0gMCkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9IGVsc2UgaWYgKCFwbGF5ZXJDb250ZXh0KSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIHJldHVybiBwbGF5ZXJDb250ZXh0W2luZGV4XSAhPT0gYnVpbGRlcjtcbn1cblxuZnVuY3Rpb24gc2V0UGxheWVyQnVpbGRlcihcbiAgICBjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgYnVpbGRlcjogQ2xhc3NBbmRTdHlsZVBsYXllckJ1aWxkZXI8YW55PnwgbnVsbCxcbiAgICBpbnNlcnRpb25JbmRleDogbnVtYmVyKTogbnVtYmVyIHtcbiAgbGV0IHBsYXllckNvbnRleHQgPSBjb250ZXh0W1N0eWxpbmdJbmRleC5QbGF5ZXJDb250ZXh0XSB8fCBhbGxvY1BsYXllckNvbnRleHQoY29udGV4dCk7XG4gIGlmIChpbnNlcnRpb25JbmRleCA+IDApIHtcbiAgICBwbGF5ZXJDb250ZXh0W2luc2VydGlvbkluZGV4XSA9IGJ1aWxkZXI7XG4gIH0gZWxzZSB7XG4gICAgaW5zZXJ0aW9uSW5kZXggPSBwbGF5ZXJDb250ZXh0W1BsYXllckluZGV4Lk5vbkJ1aWxkZXJQbGF5ZXJzU3RhcnRdO1xuICAgIHBsYXllckNvbnRleHQuc3BsaWNlKGluc2VydGlvbkluZGV4LCAwLCBidWlsZGVyLCBudWxsKTtcbiAgICBwbGF5ZXJDb250ZXh0W1BsYXllckluZGV4Lk5vbkJ1aWxkZXJQbGF5ZXJzU3RhcnRdICs9XG4gICAgICAgIFBsYXllckluZGV4LlBsYXllckFuZFBsYXllckJ1aWxkZXJzVHVwbGVTaXplO1xuICB9XG4gIHJldHVybiBpbnNlcnRpb25JbmRleDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGRpcmVjdGl2ZU93bmVyUG9pbnRlcnMoZGlyZWN0aXZlSW5kZXg6IG51bWJlciwgcGxheWVySW5kZXg6IG51bWJlcikge1xuICByZXR1cm4gKHBsYXllckluZGV4IDw8IERpcmVjdGl2ZU93bmVyQW5kUGxheWVyQnVpbGRlckluZGV4LkJpdENvdW50U2l6ZSkgfCBkaXJlY3RpdmVJbmRleDtcbn1cblxuZnVuY3Rpb24gc2V0UGxheWVyQnVpbGRlckluZGV4KFxuICAgIGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBpbmRleDogbnVtYmVyLCBwbGF5ZXJCdWlsZGVySW5kZXg6IG51bWJlciwgZGlyZWN0aXZlSW5kZXg6IG51bWJlcikge1xuICBjb25zdCB2YWx1ZSA9IGRpcmVjdGl2ZU93bmVyUG9pbnRlcnMoZGlyZWN0aXZlSW5kZXgsIHBsYXllckJ1aWxkZXJJbmRleCk7XG4gIGNvbnRleHRbaW5kZXggKyBTdHlsaW5nSW5kZXguUGxheWVyQnVpbGRlckluZGV4T2Zmc2V0XSA9IHZhbHVlO1xufVxuXG5mdW5jdGlvbiBnZXRQbGF5ZXJCdWlsZGVySW5kZXgoY29udGV4dDogU3R5bGluZ0NvbnRleHQsIGluZGV4OiBudW1iZXIpOiBudW1iZXIge1xuICBjb25zdCBmbGFnID0gY29udGV4dFtpbmRleCArIFN0eWxpbmdJbmRleC5QbGF5ZXJCdWlsZGVySW5kZXhPZmZzZXRdIGFzIG51bWJlcjtcbiAgY29uc3QgcGxheWVyQnVpbGRlckluZGV4ID0gKGZsYWcgPj4gRGlyZWN0aXZlT3duZXJBbmRQbGF5ZXJCdWlsZGVySW5kZXguQml0Q291bnRTaXplKSAmXG4gICAgICBEaXJlY3RpdmVPd25lckFuZFBsYXllckJ1aWxkZXJJbmRleC5CaXRNYXNrO1xuICByZXR1cm4gcGxheWVyQnVpbGRlckluZGV4O1xufVxuXG5mdW5jdGlvbiBnZXRQbGF5ZXJCdWlsZGVyKGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBpbmRleDogbnVtYmVyKTogQ2xhc3NBbmRTdHlsZVBsYXllckJ1aWxkZXI8YW55PnxcbiAgICBudWxsIHtcbiAgY29uc3QgcGxheWVyQnVpbGRlckluZGV4ID0gZ2V0UGxheWVyQnVpbGRlckluZGV4KGNvbnRleHQsIGluZGV4KTtcbiAgaWYgKHBsYXllckJ1aWxkZXJJbmRleCkge1xuICAgIGNvbnN0IHBsYXllckNvbnRleHQgPSBjb250ZXh0W1N0eWxpbmdJbmRleC5QbGF5ZXJDb250ZXh0XTtcbiAgICBpZiAocGxheWVyQ29udGV4dCkge1xuICAgICAgcmV0dXJuIHBsYXllckNvbnRleHRbcGxheWVyQnVpbGRlckluZGV4XSBhcyBDbGFzc0FuZFN0eWxlUGxheWVyQnVpbGRlcjxhbnk+fCBudWxsO1xuICAgIH1cbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuZnVuY3Rpb24gc2V0RmxhZyhjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgaW5kZXg6IG51bWJlciwgZmxhZzogbnVtYmVyKSB7XG4gIGNvbnN0IGFkanVzdGVkSW5kZXggPVxuICAgICAgaW5kZXggPT09IFN0eWxpbmdJbmRleC5NYXN0ZXJGbGFnUG9zaXRpb24gPyBpbmRleCA6IChpbmRleCArIFN0eWxpbmdJbmRleC5GbGFnc09mZnNldCk7XG4gIGNvbnRleHRbYWRqdXN0ZWRJbmRleF0gPSBmbGFnO1xufVxuXG5mdW5jdGlvbiBnZXRQb2ludGVycyhjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgaW5kZXg6IG51bWJlcik6IG51bWJlciB7XG4gIGNvbnN0IGFkanVzdGVkSW5kZXggPVxuICAgICAgaW5kZXggPT09IFN0eWxpbmdJbmRleC5NYXN0ZXJGbGFnUG9zaXRpb24gPyBpbmRleCA6IChpbmRleCArIFN0eWxpbmdJbmRleC5GbGFnc09mZnNldCk7XG4gIHJldHVybiBjb250ZXh0W2FkanVzdGVkSW5kZXhdIGFzIG51bWJlcjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFZhbHVlKGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBpbmRleDogbnVtYmVyKTogc3RyaW5nfGJvb2xlYW58bnVsbCB7XG4gIHJldHVybiBjb250ZXh0W2luZGV4ICsgU3R5bGluZ0luZGV4LlZhbHVlT2Zmc2V0XSBhcyBzdHJpbmcgfCBib29sZWFuIHwgbnVsbDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFByb3AoY29udGV4dDogU3R5bGluZ0NvbnRleHQsIGluZGV4OiBudW1iZXIpOiBzdHJpbmcge1xuICByZXR1cm4gY29udGV4dFtpbmRleCArIFN0eWxpbmdJbmRleC5Qcm9wZXJ0eU9mZnNldF0gYXMgc3RyaW5nO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNDb250ZXh0RGlydHkoY29udGV4dDogU3R5bGluZ0NvbnRleHQpOiBib29sZWFuIHtcbiAgcmV0dXJuIGlzRGlydHkoY29udGV4dCwgU3R5bGluZ0luZGV4Lk1hc3RlckZsYWdQb3NpdGlvbik7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRDb250ZXh0RGlydHkoY29udGV4dDogU3R5bGluZ0NvbnRleHQsIGlzRGlydHlZZXM6IGJvb2xlYW4pOiB2b2lkIHtcbiAgc2V0RGlydHkoY29udGV4dCwgU3R5bGluZ0luZGV4Lk1hc3RlckZsYWdQb3NpdGlvbiwgaXNEaXJ0eVllcyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRDb250ZXh0UGxheWVyc0RpcnR5KGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBpc0RpcnR5WWVzOiBib29sZWFuKTogdm9pZCB7XG4gIGlmIChpc0RpcnR5WWVzKSB7XG4gICAgKGNvbnRleHRbU3R5bGluZ0luZGV4Lk1hc3RlckZsYWdQb3NpdGlvbl0gYXMgbnVtYmVyKSB8PSBTdHlsaW5nRmxhZ3MuUGxheWVyQnVpbGRlcnNEaXJ0eTtcbiAgfSBlbHNlIHtcbiAgICAoY29udGV4dFtTdHlsaW5nSW5kZXguTWFzdGVyRmxhZ1Bvc2l0aW9uXSBhcyBudW1iZXIpICY9IH5TdHlsaW5nRmxhZ3MuUGxheWVyQnVpbGRlcnNEaXJ0eTtcbiAgfVxufVxuXG5mdW5jdGlvbiBzd2FwTXVsdGlDb250ZXh0RW50cmllcyhjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgaW5kZXhBOiBudW1iZXIsIGluZGV4QjogbnVtYmVyKSB7XG4gIGlmIChpbmRleEEgPT09IGluZGV4QikgcmV0dXJuO1xuXG4gIGNvbnN0IHRtcFZhbHVlID0gZ2V0VmFsdWUoY29udGV4dCwgaW5kZXhBKTtcbiAgY29uc3QgdG1wUHJvcCA9IGdldFByb3AoY29udGV4dCwgaW5kZXhBKTtcbiAgY29uc3QgdG1wRmxhZyA9IGdldFBvaW50ZXJzKGNvbnRleHQsIGluZGV4QSk7XG4gIGNvbnN0IHRtcFBsYXllckJ1aWxkZXJJbmRleCA9IGdldFBsYXllckJ1aWxkZXJJbmRleChjb250ZXh0LCBpbmRleEEpO1xuICBjb25zdCB0bXBEaXJlY3RpdmVJbmRleCA9IGdldERpcmVjdGl2ZUluZGV4RnJvbUVudHJ5KGNvbnRleHQsIGluZGV4QSk7XG5cbiAgbGV0IGZsYWdBID0gdG1wRmxhZztcbiAgbGV0IGZsYWdCID0gZ2V0UG9pbnRlcnMoY29udGV4dCwgaW5kZXhCKTtcblxuICBjb25zdCBzaW5nbGVJbmRleEEgPSBnZXRNdWx0aU9yU2luZ2xlSW5kZXgoZmxhZ0EpO1xuICBpZiAoc2luZ2xlSW5kZXhBID49IDApIHtcbiAgICBjb25zdCBfZmxhZyA9IGdldFBvaW50ZXJzKGNvbnRleHQsIHNpbmdsZUluZGV4QSk7XG4gICAgY29uc3QgX2luaXRpYWwgPSBnZXRJbml0aWFsSW5kZXgoX2ZsYWcpO1xuICAgIHNldEZsYWcoY29udGV4dCwgc2luZ2xlSW5kZXhBLCBwb2ludGVycyhfZmxhZywgX2luaXRpYWwsIGluZGV4QikpO1xuICB9XG5cbiAgY29uc3Qgc2luZ2xlSW5kZXhCID0gZ2V0TXVsdGlPclNpbmdsZUluZGV4KGZsYWdCKTtcbiAgaWYgKHNpbmdsZUluZGV4QiA+PSAwKSB7XG4gICAgY29uc3QgX2ZsYWcgPSBnZXRQb2ludGVycyhjb250ZXh0LCBzaW5nbGVJbmRleEIpO1xuICAgIGNvbnN0IF9pbml0aWFsID0gZ2V0SW5pdGlhbEluZGV4KF9mbGFnKTtcbiAgICBzZXRGbGFnKGNvbnRleHQsIHNpbmdsZUluZGV4QiwgcG9pbnRlcnMoX2ZsYWcsIF9pbml0aWFsLCBpbmRleEEpKTtcbiAgfVxuXG4gIHNldFZhbHVlKGNvbnRleHQsIGluZGV4QSwgZ2V0VmFsdWUoY29udGV4dCwgaW5kZXhCKSk7XG4gIHNldFByb3AoY29udGV4dCwgaW5kZXhBLCBnZXRQcm9wKGNvbnRleHQsIGluZGV4QikpO1xuICBzZXRGbGFnKGNvbnRleHQsIGluZGV4QSwgZ2V0UG9pbnRlcnMoY29udGV4dCwgaW5kZXhCKSk7XG4gIGNvbnN0IHBsYXllckluZGV4QSA9IGdldFBsYXllckJ1aWxkZXJJbmRleChjb250ZXh0LCBpbmRleEIpO1xuICBjb25zdCBkaXJlY3RpdmVJbmRleEEgPSBnZXREaXJlY3RpdmVJbmRleEZyb21FbnRyeShjb250ZXh0LCBpbmRleEIpO1xuICBzZXRQbGF5ZXJCdWlsZGVySW5kZXgoY29udGV4dCwgaW5kZXhBLCBwbGF5ZXJJbmRleEEsIGRpcmVjdGl2ZUluZGV4QSk7XG5cbiAgc2V0VmFsdWUoY29udGV4dCwgaW5kZXhCLCB0bXBWYWx1ZSk7XG4gIHNldFByb3AoY29udGV4dCwgaW5kZXhCLCB0bXBQcm9wKTtcbiAgc2V0RmxhZyhjb250ZXh0LCBpbmRleEIsIHRtcEZsYWcpO1xuICBzZXRQbGF5ZXJCdWlsZGVySW5kZXgoY29udGV4dCwgaW5kZXhCLCB0bXBQbGF5ZXJCdWlsZGVySW5kZXgsIHRtcERpcmVjdGl2ZUluZGV4KTtcbn1cblxuZnVuY3Rpb24gdXBkYXRlU2luZ2xlUG9pbnRlclZhbHVlcyhjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgaW5kZXhTdGFydFBvc2l0aW9uOiBudW1iZXIpIHtcbiAgZm9yIChsZXQgaSA9IGluZGV4U3RhcnRQb3NpdGlvbjsgaSA8IGNvbnRleHQubGVuZ3RoOyBpICs9IFN0eWxpbmdJbmRleC5TaXplKSB7XG4gICAgY29uc3QgbXVsdGlGbGFnID0gZ2V0UG9pbnRlcnMoY29udGV4dCwgaSk7XG4gICAgY29uc3Qgc2luZ2xlSW5kZXggPSBnZXRNdWx0aU9yU2luZ2xlSW5kZXgobXVsdGlGbGFnKTtcbiAgICBpZiAoc2luZ2xlSW5kZXggPiAwKSB7XG4gICAgICBjb25zdCBzaW5nbGVGbGFnID0gZ2V0UG9pbnRlcnMoY29udGV4dCwgc2luZ2xlSW5kZXgpO1xuICAgICAgY29uc3QgaW5pdGlhbEluZGV4Rm9yU2luZ2xlID0gZ2V0SW5pdGlhbEluZGV4KHNpbmdsZUZsYWcpO1xuICAgICAgY29uc3QgZmxhZ1ZhbHVlID0gKGlzRGlydHkoY29udGV4dCwgc2luZ2xlSW5kZXgpID8gU3R5bGluZ0ZsYWdzLkRpcnR5IDogU3R5bGluZ0ZsYWdzLk5vbmUpIHxcbiAgICAgICAgICAoaXNDbGFzc0Jhc2VkVmFsdWUoY29udGV4dCwgc2luZ2xlSW5kZXgpID8gU3R5bGluZ0ZsYWdzLkNsYXNzIDogU3R5bGluZ0ZsYWdzLk5vbmUpIHxcbiAgICAgICAgICAoaXNTYW5pdGl6YWJsZShjb250ZXh0LCBzaW5nbGVJbmRleCkgPyBTdHlsaW5nRmxhZ3MuU2FuaXRpemUgOiBTdHlsaW5nRmxhZ3MuTm9uZSk7XG4gICAgICBjb25zdCB1cGRhdGVkRmxhZyA9IHBvaW50ZXJzKGZsYWdWYWx1ZSwgaW5pdGlhbEluZGV4Rm9yU2luZ2xlLCBpKTtcbiAgICAgIHNldEZsYWcoY29udGV4dCwgc2luZ2xlSW5kZXgsIHVwZGF0ZWRGbGFnKTtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gaW5zZXJ0TmV3TXVsdGlQcm9wZXJ0eShcbiAgICBjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgaW5kZXg6IG51bWJlciwgY2xhc3NCYXNlZDogYm9vbGVhbiwgbmFtZTogc3RyaW5nLCBmbGFnOiBudW1iZXIsXG4gICAgdmFsdWU6IHN0cmluZyB8IGJvb2xlYW4sIGRpcmVjdGl2ZUluZGV4OiBudW1iZXIsIHBsYXllckluZGV4OiBudW1iZXIpOiB2b2lkIHtcbiAgY29uc3QgZG9TaGlmdCA9IGluZGV4IDwgY29udGV4dC5sZW5ndGg7XG5cbiAgLy8gcHJvcCBkb2VzIG5vdCBleGlzdCBpbiB0aGUgbGlzdCwgYWRkIGl0IGluXG4gIGNvbnRleHQuc3BsaWNlKFxuICAgICAgaW5kZXgsIDAsIGZsYWcgfCBTdHlsaW5nRmxhZ3MuRGlydHkgfCAoY2xhc3NCYXNlZCA/IFN0eWxpbmdGbGFncy5DbGFzcyA6IFN0eWxpbmdGbGFncy5Ob25lKSxcbiAgICAgIG5hbWUsIHZhbHVlLCAwKTtcbiAgc2V0UGxheWVyQnVpbGRlckluZGV4KGNvbnRleHQsIGluZGV4LCBwbGF5ZXJJbmRleCwgZGlyZWN0aXZlSW5kZXgpO1xuXG4gIGlmIChkb1NoaWZ0KSB7XG4gICAgLy8gYmVjYXVzZSB0aGUgdmFsdWUgd2FzIGluc2VydGVkIG1pZHdheSBpbnRvIHRoZSBhcnJheSB0aGVuIHdlXG4gICAgLy8gbmVlZCB0byB1cGRhdGUgYWxsIHRoZSBzaGlmdGVkIG11bHRpIHZhbHVlcycgc2luZ2xlIHZhbHVlXG4gICAgLy8gcG9pbnRlcnMgdG8gcG9pbnQgdG8gdGhlIG5ld2x5IHNoaWZ0ZWQgbG9jYXRpb25cbiAgICB1cGRhdGVTaW5nbGVQb2ludGVyVmFsdWVzKGNvbnRleHQsIGluZGV4ICsgU3R5bGluZ0luZGV4LlNpemUpO1xuICB9XG59XG5cbmZ1bmN0aW9uIHZhbHVlRXhpc3RzKHZhbHVlOiBzdHJpbmcgfCBudWxsIHwgYm9vbGVhbiwgaXNDbGFzc0Jhc2VkPzogYm9vbGVhbikge1xuICByZXR1cm4gdmFsdWUgIT09IG51bGw7XG59XG5cbmZ1bmN0aW9uIHByZXBhcmVJbml0aWFsRmxhZyhcbiAgICBjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgcHJvcDogc3RyaW5nLCBlbnRyeUlzQ2xhc3NCYXNlZDogYm9vbGVhbixcbiAgICBzYW5pdGl6ZXI/OiBTdHlsZVNhbml0aXplRm4gfCBudWxsKSB7XG4gIGxldCBmbGFnID0gKHNhbml0aXplciAmJiBzYW5pdGl6ZXIocHJvcCkpID8gU3R5bGluZ0ZsYWdzLlNhbml0aXplIDogU3R5bGluZ0ZsYWdzLk5vbmU7XG5cbiAgbGV0IGluaXRpYWxJbmRleDogbnVtYmVyO1xuICBpZiAoZW50cnlJc0NsYXNzQmFzZWQpIHtcbiAgICBmbGFnIHw9IFN0eWxpbmdGbGFncy5DbGFzcztcbiAgICBpbml0aWFsSW5kZXggPVxuICAgICAgICBnZXRJbml0aWFsU3R5bGluZ1ZhbHVlc0luZGV4T2YoY29udGV4dFtTdHlsaW5nSW5kZXguSW5pdGlhbENsYXNzVmFsdWVzUG9zaXRpb25dLCBwcm9wKTtcbiAgfSBlbHNlIHtcbiAgICBpbml0aWFsSW5kZXggPVxuICAgICAgICBnZXRJbml0aWFsU3R5bGluZ1ZhbHVlc0luZGV4T2YoY29udGV4dFtTdHlsaW5nSW5kZXguSW5pdGlhbFN0eWxlVmFsdWVzUG9zaXRpb25dLCBwcm9wKTtcbiAgfVxuXG4gIGluaXRpYWxJbmRleCA9IGluaXRpYWxJbmRleCA+IDAgPyAoaW5pdGlhbEluZGV4ICsgSW5pdGlhbFN0eWxpbmdWYWx1ZXNJbmRleC5WYWx1ZU9mZnNldCkgOiAwO1xuICByZXR1cm4gcG9pbnRlcnMoZmxhZywgaW5pdGlhbEluZGV4LCAwKTtcbn1cblxuZnVuY3Rpb24gaGFzSW5pdGlhbFZhbHVlQ2hhbmdlZChjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgZmxhZzogbnVtYmVyLCBuZXdWYWx1ZTogYW55KSB7XG4gIGNvbnN0IGluaXRpYWxWYWx1ZSA9IGdldEluaXRpYWxWYWx1ZShjb250ZXh0LCBmbGFnKTtcbiAgcmV0dXJuICFpbml0aWFsVmFsdWUgfHwgaGFzVmFsdWVDaGFuZ2VkKGZsYWcsIGluaXRpYWxWYWx1ZSwgbmV3VmFsdWUpO1xufVxuXG5mdW5jdGlvbiBoYXNWYWx1ZUNoYW5nZWQoXG4gICAgZmxhZzogbnVtYmVyLCBhOiBzdHJpbmcgfCBib29sZWFuIHwgbnVsbCwgYjogc3RyaW5nIHwgYm9vbGVhbiB8IG51bGwpOiBib29sZWFuIHtcbiAgY29uc3QgaXNDbGFzc0Jhc2VkID0gZmxhZyAmIFN0eWxpbmdGbGFncy5DbGFzcztcbiAgY29uc3QgaGFzVmFsdWVzID0gYSAmJiBiO1xuICBjb25zdCB1c2VzU2FuaXRpemVyID0gZmxhZyAmIFN0eWxpbmdGbGFncy5TYW5pdGl6ZTtcbiAgLy8gdGhlIHRvU3RyaW5nKCkgY29tcGFyaXNvbiBlbnN1cmVzIHRoYXQgYSB2YWx1ZSBpcyBjaGVja2VkXG4gIC8vIC4uLiBvdGhlcndpc2UgKGR1cmluZyBzYW5pdGl6YXRpb24gYnlwYXNzaW5nKSB0aGUgPT09IGNvbXBhcnNpb25cbiAgLy8gd291bGQgZmFpbCBzaW5jZSBhIG5ldyBTdHJpbmcoKSBpbnN0YW5jZSBpcyBjcmVhdGVkXG4gIGlmICghaXNDbGFzc0Jhc2VkICYmIGhhc1ZhbHVlcyAmJiB1c2VzU2FuaXRpemVyKSB7XG4gICAgLy8gd2Uga25vdyBmb3Igc3VyZSB3ZSdyZSBkZWFsaW5nIHdpdGggc3RyaW5ncyBhdCB0aGlzIHBvaW50XG4gICAgcmV0dXJuIChhIGFzIHN0cmluZykudG9TdHJpbmcoKSAhPT0gKGIgYXMgc3RyaW5nKS50b1N0cmluZygpO1xuICB9XG5cbiAgLy8gZXZlcnl0aGluZyBlbHNlIGlzIHNhZmUgdG8gY2hlY2sgd2l0aCBhIG5vcm1hbCBlcXVhbGl0eSBjaGVja1xuICByZXR1cm4gYSAhPT0gYjtcbn1cblxuZXhwb3J0IGNsYXNzIENsYXNzQW5kU3R5bGVQbGF5ZXJCdWlsZGVyPFQ+IGltcGxlbWVudHMgUGxheWVyQnVpbGRlciB7XG4gIHByaXZhdGUgX3ZhbHVlczoge1trZXk6IHN0cmluZ106IHN0cmluZyB8IG51bGx9ID0ge307XG4gIHByaXZhdGUgX2RpcnR5ID0gZmFsc2U7XG4gIHByaXZhdGUgX2ZhY3Rvcnk6IEJvdW5kUGxheWVyRmFjdG9yeTxUPjtcblxuICBjb25zdHJ1Y3RvcihmYWN0b3J5OiBQbGF5ZXJGYWN0b3J5LCBwcml2YXRlIF9lbGVtZW50OiBIVE1MRWxlbWVudCwgcHJpdmF0ZSBfdHlwZTogQmluZGluZ1R5cGUpIHtcbiAgICB0aGlzLl9mYWN0b3J5ID0gZmFjdG9yeSBhcyBhbnk7XG4gIH1cblxuICBzZXRWYWx1ZShwcm9wOiBzdHJpbmcsIHZhbHVlOiBhbnkpIHtcbiAgICBpZiAodGhpcy5fdmFsdWVzW3Byb3BdICE9PSB2YWx1ZSkge1xuICAgICAgdGhpcy5fdmFsdWVzW3Byb3BdID0gdmFsdWU7XG4gICAgICB0aGlzLl9kaXJ0eSA9IHRydWU7XG4gICAgfVxuICB9XG5cbiAgYnVpbGRQbGF5ZXIoY3VycmVudFBsYXllcjogUGxheWVyfG51bGwsIGlzRmlyc3RSZW5kZXI6IGJvb2xlYW4pOiBQbGF5ZXJ8dW5kZWZpbmVkfG51bGwge1xuICAgIC8vIGlmIG5vIHZhbHVlcyBoYXZlIGJlZW4gc2V0IGhlcmUgdGhlbiB0aGlzIG1lYW5zIHRoZSBiaW5kaW5nIGRpZG4ndFxuICAgIC8vIGNoYW5nZSBhbmQgdGhlcmVmb3JlIHRoZSBiaW5kaW5nIHZhbHVlcyB3ZXJlIG5vdCB1cGRhdGVkIHRocm91Z2hcbiAgICAvLyBgc2V0VmFsdWVgIHdoaWNoIG1lYW5zIG5vIG5ldyBwbGF5ZXIgd2lsbCBiZSBwcm92aWRlZC5cbiAgICBpZiAodGhpcy5fZGlydHkpIHtcbiAgICAgIGNvbnN0IHBsYXllciA9IHRoaXMuX2ZhY3RvcnkuZm4oXG4gICAgICAgICAgdGhpcy5fZWxlbWVudCwgdGhpcy5fdHlwZSwgdGhpcy5fdmFsdWVzICEsIGlzRmlyc3RSZW5kZXIsIGN1cnJlbnRQbGF5ZXIgfHwgbnVsbCk7XG4gICAgICB0aGlzLl92YWx1ZXMgPSB7fTtcbiAgICAgIHRoaXMuX2RpcnR5ID0gZmFsc2U7XG4gICAgICByZXR1cm4gcGxheWVyO1xuICAgIH1cblxuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cbn1cblxuLyoqXG4gKiBVc2VkIHRvIHByb3ZpZGUgYSBzdW1tYXJ5IG9mIHRoZSBzdGF0ZSBvZiB0aGUgc3R5bGluZyBjb250ZXh0LlxuICpcbiAqIFRoaXMgaXMgYW4gaW50ZXJuYWwgaW50ZXJmYWNlIHRoYXQgaXMgb25seSB1c2VkIGluc2lkZSBvZiB0ZXN0IHRvb2xpbmcgdG9cbiAqIGhlbHAgc3VtbWFyaXplIHdoYXQncyBnb2luZyBvbiB3aXRoaW4gdGhlIHN0eWxpbmcgY29udGV4dC4gTm9uZSBvZiB0aGlzIGNvZGVcbiAqIGlzIGRlc2lnbmVkIHRvIGJlIGV4cG9ydGVkIHB1YmxpY2x5IGFuZCB3aWxsLCB0aGVyZWZvcmUsIGJlIHRyZWUtc2hha2VuIGF3YXlcbiAqIGR1cmluZyBydW50aW1lLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIExvZ1N1bW1hcnkge1xuICBuYW1lOiBzdHJpbmc7ICAgICAgICAgIC8vXG4gIHN0YXRpY0luZGV4OiBudW1iZXI7ICAgLy9cbiAgZHluYW1pY0luZGV4OiBudW1iZXI7ICAvL1xuICB2YWx1ZTogbnVtYmVyOyAgICAgICAgIC8vXG4gIGZsYWdzOiB7XG4gICAgZGlydHk6IGJvb2xlYW47ICAgICAgICAgICAgICAgICAgICAvL1xuICAgIGNsYXNzOiBib29sZWFuOyAgICAgICAgICAgICAgICAgICAgLy9cbiAgICBzYW5pdGl6ZTogYm9vbGVhbjsgICAgICAgICAgICAgICAgIC8vXG4gICAgcGxheWVyQnVpbGRlcnNEaXJ0eTogYm9vbGVhbjsgICAgICAvL1xuICAgIGJpbmRpbmdBbGxvY2F0aW9uTG9ja2VkOiBib29sZWFuOyAgLy9cbiAgfTtcbn1cblxuLyoqXG4gKiBUaGlzIGZ1bmN0aW9uIGlzIG5vdCBkZXNpZ25lZCB0byBiZSB1c2VkIGluIHByb2R1Y3Rpb24uXG4gKiBJdCBpcyBhIHV0aWxpdHkgdG9vbCBmb3IgZGVidWdnaW5nIGFuZCB0ZXN0aW5nIGFuZCBpdFxuICogd2lsbCBhdXRvbWF0aWNhbGx5IGJlIHRyZWUtc2hha2VuIGF3YXkgZHVyaW5nIHByb2R1Y3Rpb24uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZW5lcmF0ZUNvbmZpZ1N1bW1hcnkoc291cmNlOiBudW1iZXIpOiBMb2dTdW1tYXJ5O1xuZXhwb3J0IGZ1bmN0aW9uIGdlbmVyYXRlQ29uZmlnU3VtbWFyeShzb3VyY2U6IFN0eWxpbmdDb250ZXh0KTogTG9nU3VtbWFyeTtcbmV4cG9ydCBmdW5jdGlvbiBnZW5lcmF0ZUNvbmZpZ1N1bW1hcnkoc291cmNlOiBTdHlsaW5nQ29udGV4dCwgaW5kZXg6IG51bWJlcik6IExvZ1N1bW1hcnk7XG5leHBvcnQgZnVuY3Rpb24gZ2VuZXJhdGVDb25maWdTdW1tYXJ5KHNvdXJjZTogbnVtYmVyIHwgU3R5bGluZ0NvbnRleHQsIGluZGV4PzogbnVtYmVyKTogTG9nU3VtbWFyeSB7XG4gIGxldCBmbGFnLCBuYW1lID0gJ2NvbmZpZyB2YWx1ZSBmb3IgJztcbiAgaWYgKEFycmF5LmlzQXJyYXkoc291cmNlKSkge1xuICAgIGlmIChpbmRleCkge1xuICAgICAgbmFtZSArPSAnaW5kZXg6ICcgKyBpbmRleDtcbiAgICB9IGVsc2Uge1xuICAgICAgbmFtZSArPSAnbWFzdGVyIGNvbmZpZyc7XG4gICAgfVxuICAgIGluZGV4ID0gaW5kZXggfHwgU3R5bGluZ0luZGV4Lk1hc3RlckZsYWdQb3NpdGlvbjtcbiAgICBmbGFnID0gc291cmNlW2luZGV4XSBhcyBudW1iZXI7XG4gIH0gZWxzZSB7XG4gICAgZmxhZyA9IHNvdXJjZTtcbiAgICBuYW1lICs9ICdpbmRleDogJyArIGZsYWc7XG4gIH1cbiAgY29uc3QgZHluYW1pY0luZGV4ID0gZ2V0TXVsdGlPclNpbmdsZUluZGV4KGZsYWcpO1xuICBjb25zdCBzdGF0aWNJbmRleCA9IGdldEluaXRpYWxJbmRleChmbGFnKTtcbiAgcmV0dXJuIHtcbiAgICBuYW1lLFxuICAgIHN0YXRpY0luZGV4LFxuICAgIGR5bmFtaWNJbmRleCxcbiAgICB2YWx1ZTogZmxhZyxcbiAgICBmbGFnczoge1xuICAgICAgZGlydHk6IGZsYWcgJiBTdHlsaW5nRmxhZ3MuRGlydHkgPyB0cnVlIDogZmFsc2UsXG4gICAgICBjbGFzczogZmxhZyAmIFN0eWxpbmdGbGFncy5DbGFzcyA/IHRydWUgOiBmYWxzZSxcbiAgICAgIHNhbml0aXplOiBmbGFnICYgU3R5bGluZ0ZsYWdzLlNhbml0aXplID8gdHJ1ZSA6IGZhbHNlLFxuICAgICAgcGxheWVyQnVpbGRlcnNEaXJ0eTogZmxhZyAmIFN0eWxpbmdGbGFncy5QbGF5ZXJCdWlsZGVyc0RpcnR5ID8gdHJ1ZSA6IGZhbHNlLFxuICAgICAgYmluZGluZ0FsbG9jYXRpb25Mb2NrZWQ6IGZsYWcgJiBTdHlsaW5nRmxhZ3MuQmluZGluZ0FsbG9jYXRpb25Mb2NrZWQgPyB0cnVlIDogZmFsc2UsXG4gICAgfVxuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0RGlyZWN0aXZlSW5kZXhGcm9tRW50cnkoY29udGV4dDogU3R5bGluZ0NvbnRleHQsIGluZGV4OiBudW1iZXIpIHtcbiAgY29uc3QgdmFsdWUgPSBjb250ZXh0W2luZGV4ICsgU3R5bGluZ0luZGV4LlBsYXllckJ1aWxkZXJJbmRleE9mZnNldF0gYXMgbnVtYmVyO1xuICByZXR1cm4gdmFsdWUgJiBEaXJlY3RpdmVPd25lckFuZFBsYXllckJ1aWxkZXJJbmRleC5CaXRNYXNrO1xufVxuXG5mdW5jdGlvbiBnZXREaXJlY3RpdmVJbmRleEZyb21SZWdpc3RyeShjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgZGlyZWN0aXZlUmVmOiBhbnkpIHtcbiAgbGV0IGRpcmVjdGl2ZUluZGV4OiBudW1iZXI7XG5cbiAgY29uc3QgZGlycyA9IGNvbnRleHRbU3R5bGluZ0luZGV4LkRpcmVjdGl2ZVJlZ2lzdHJ5UG9zaXRpb25dO1xuICBsZXQgaW5kZXggPSBnZXREaXJlY3RpdmVSZWdpc3RyeVZhbHVlc0luZGV4T2YoZGlycywgZGlyZWN0aXZlUmVmKTtcbiAgaWYgKGluZGV4ID09PSAtMSkge1xuICAgIC8vIGlmIHRoZSBkaXJlY3RpdmUgd2FzIG5vdCBhbGxvY2F0ZWQgdGhlbiB0aGlzIG1lYW5zIHRoYXQgc3R5bGluZyBpc1xuICAgIC8vIGJlaW5nIGFwcGxpZWQgaW4gYSBkeW5hbWljIHdheSBBRlRFUiB0aGUgZWxlbWVudCB3YXMgYWxyZWFkeSBpbnN0YW50aWF0ZWRcbiAgICBpbmRleCA9IGRpcnMubGVuZ3RoO1xuICAgIGRpcmVjdGl2ZUluZGV4ID0gaW5kZXggPiAwID8gaW5kZXggLyBEaXJlY3RpdmVSZWdpc3RyeVZhbHVlc0luZGV4LlNpemUgOiAwO1xuXG4gICAgZGlycy5wdXNoKG51bGwsIG51bGwsIG51bGwsIG51bGwpO1xuICAgIGRpcnNbaW5kZXggKyBEaXJlY3RpdmVSZWdpc3RyeVZhbHVlc0luZGV4LkRpcmVjdGl2ZVZhbHVlT2Zmc2V0XSA9IGRpcmVjdGl2ZVJlZjtcbiAgICBkaXJzW2luZGV4ICsgRGlyZWN0aXZlUmVnaXN0cnlWYWx1ZXNJbmRleC5EaXJ0eUZsYWdPZmZzZXRdID0gZmFsc2U7XG4gICAgZGlyc1tpbmRleCArIERpcmVjdGl2ZVJlZ2lzdHJ5VmFsdWVzSW5kZXguU2luZ2xlUHJvcFZhbHVlc0luZGV4T2Zmc2V0XSA9IC0xO1xuXG4gICAgY29uc3QgY2xhc3Nlc1N0YXJ0SW5kZXggPVxuICAgICAgICBnZXRNdWx0aUNsYXNzZXNTdGFydEluZGV4KGNvbnRleHQpIHx8IFN0eWxpbmdJbmRleC5TaW5nbGVTdHlsZXNTdGFydFBvc2l0aW9uO1xuICAgIHJlZ2lzdGVyTXVsdGlNYXBFbnRyeShjb250ZXh0LCBkaXJlY3RpdmVJbmRleCwgdHJ1ZSwgY29udGV4dC5sZW5ndGgpO1xuICAgIHJlZ2lzdGVyTXVsdGlNYXBFbnRyeShjb250ZXh0LCBkaXJlY3RpdmVJbmRleCwgZmFsc2UsIGNsYXNzZXNTdGFydEluZGV4KTtcbiAgfSBlbHNlIHtcbiAgICBkaXJlY3RpdmVJbmRleCA9IGluZGV4ID4gMCA/IGluZGV4IC8gRGlyZWN0aXZlUmVnaXN0cnlWYWx1ZXNJbmRleC5TaXplIDogMDtcbiAgfVxuXG4gIHJldHVybiBkaXJlY3RpdmVJbmRleDtcbn1cblxuZnVuY3Rpb24gZ2V0RGlyZWN0aXZlUmVnaXN0cnlWYWx1ZXNJbmRleE9mKFxuICAgIGRpcmVjdGl2ZXM6IERpcmVjdGl2ZVJlZ2lzdHJ5VmFsdWVzLCBkaXJlY3RpdmU6IHt9KTogbnVtYmVyIHtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBkaXJlY3RpdmVzLmxlbmd0aDsgaSArPSBEaXJlY3RpdmVSZWdpc3RyeVZhbHVlc0luZGV4LlNpemUpIHtcbiAgICBpZiAoZGlyZWN0aXZlc1tpXSA9PT0gZGlyZWN0aXZlKSB7XG4gICAgICByZXR1cm4gaTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIC0xO1xufVxuXG5mdW5jdGlvbiBnZXRJbml0aWFsU3R5bGluZ1ZhbHVlc0luZGV4T2Yoa2V5VmFsdWVzOiBJbml0aWFsU3R5bGluZ1ZhbHVlcywga2V5OiBzdHJpbmcpOiBudW1iZXIge1xuICBmb3IgKGxldCBpID0gSW5pdGlhbFN0eWxpbmdWYWx1ZXNJbmRleC5LZXlWYWx1ZVN0YXJ0UG9zaXRpb247IGkgPCBrZXlWYWx1ZXMubGVuZ3RoO1xuICAgICAgIGkgKz0gSW5pdGlhbFN0eWxpbmdWYWx1ZXNJbmRleC5TaXplKSB7XG4gICAgaWYgKGtleVZhbHVlc1tpXSA9PT0ga2V5KSByZXR1cm4gaTtcbiAgfVxuICByZXR1cm4gLTE7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjb21wYXJlTG9nU3VtbWFyaWVzKGE6IExvZ1N1bW1hcnksIGI6IExvZ1N1bW1hcnkpIHtcbiAgY29uc3QgbG9nOiBzdHJpbmdbXSA9IFtdO1xuICBjb25zdCBkaWZmczogW3N0cmluZywgYW55LCBhbnldW10gPSBbXTtcbiAgZGlmZlN1bW1hcnlWYWx1ZXMoZGlmZnMsICdzdGF0aWNJbmRleCcsICdzdGF0aWNJbmRleCcsIGEsIGIpO1xuICBkaWZmU3VtbWFyeVZhbHVlcyhkaWZmcywgJ2R5bmFtaWNJbmRleCcsICdkeW5hbWljSW5kZXgnLCBhLCBiKTtcbiAgT2JqZWN0LmtleXMoYS5mbGFncykuZm9yRWFjaChcbiAgICAgIG5hbWUgPT4geyBkaWZmU3VtbWFyeVZhbHVlcyhkaWZmcywgJ2ZsYWdzLicgKyBuYW1lLCBuYW1lLCBhLmZsYWdzLCBiLmZsYWdzKTsgfSk7XG5cbiAgaWYgKGRpZmZzLmxlbmd0aCkge1xuICAgIGxvZy5wdXNoKCdMb2cgU3VtbWFyaWVzIGZvcjonKTtcbiAgICBsb2cucHVzaCgnICBBOiAnICsgYS5uYW1lKTtcbiAgICBsb2cucHVzaCgnICBCOiAnICsgYi5uYW1lKTtcbiAgICBsb2cucHVzaCgnXFxuICBEaWZmZXIgaW4gdGhlIGZvbGxvd2luZyB3YXkgKEEgIT09IEIpOicpO1xuICAgIGRpZmZzLmZvckVhY2gocmVzdWx0ID0+IHtcbiAgICAgIGNvbnN0IFtuYW1lLCBhVmFsLCBiVmFsXSA9IHJlc3VsdDtcbiAgICAgIGxvZy5wdXNoKCcgICAgPT4gJyArIG5hbWUpO1xuICAgICAgbG9nLnB1c2goJyAgICA9PiAnICsgYVZhbCArICcgIT09ICcgKyBiVmFsICsgJ1xcbicpO1xuICAgIH0pO1xuICB9XG5cbiAgcmV0dXJuIGxvZztcbn1cblxuZnVuY3Rpb24gZGlmZlN1bW1hcnlWYWx1ZXMocmVzdWx0OiBhbnlbXSwgbmFtZTogc3RyaW5nLCBwcm9wOiBzdHJpbmcsIGE6IGFueSwgYjogYW55KSB7XG4gIGNvbnN0IGFWYWwgPSBhW3Byb3BdO1xuICBjb25zdCBiVmFsID0gYltwcm9wXTtcbiAgaWYgKGFWYWwgIT09IGJWYWwpIHtcbiAgICByZXN1bHQucHVzaChbbmFtZSwgYVZhbCwgYlZhbF0pO1xuICB9XG59XG5cbmZ1bmN0aW9uIGdldFNpbmdsZVByb3BJbmRleFZhbHVlKFxuICAgIGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBkaXJlY3RpdmVJbmRleDogbnVtYmVyLCBvZmZzZXQ6IG51bWJlciwgaXNDbGFzc0Jhc2VkOiBib29sZWFuKSB7XG4gIGNvbnN0IHNpbmdsZVByb3BPZmZzZXRSZWdpc3RyeUluZGV4ID1cbiAgICAgIGNvbnRleHRbU3R5bGluZ0luZGV4LkRpcmVjdGl2ZVJlZ2lzdHJ5UG9zaXRpb25dXG4gICAgICAgICAgICAgWyhkaXJlY3RpdmVJbmRleCAqIERpcmVjdGl2ZVJlZ2lzdHJ5VmFsdWVzSW5kZXguU2l6ZSkgK1xuICAgICAgICAgICAgICBEaXJlY3RpdmVSZWdpc3RyeVZhbHVlc0luZGV4LlNpbmdsZVByb3BWYWx1ZXNJbmRleE9mZnNldF0gYXMgbnVtYmVyO1xuICBjb25zdCBvZmZzZXRzID0gY29udGV4dFtTdHlsaW5nSW5kZXguU2luZ2xlUHJvcE9mZnNldFBvc2l0aW9uc107XG4gIGNvbnN0IGluZGV4Rm9yT2Zmc2V0ID0gc2luZ2xlUHJvcE9mZnNldFJlZ2lzdHJ5SW5kZXggK1xuICAgICAgU2luZ2xlUHJvcE9mZnNldFZhbHVlc0luZGV4LlZhbHVlU3RhcnRQb3NpdGlvbiArXG4gICAgICAoaXNDbGFzc0Jhc2VkID9cbiAgICAgICAgICAgb2Zmc2V0c1xuICAgICAgICAgICAgICAgW3NpbmdsZVByb3BPZmZzZXRSZWdpc3RyeUluZGV4ICsgU2luZ2xlUHJvcE9mZnNldFZhbHVlc0luZGV4LlN0eWxlc0NvdW50UG9zaXRpb25dIDpcbiAgICAgICAgICAgMCkgK1xuICAgICAgb2Zmc2V0O1xuICByZXR1cm4gb2Zmc2V0c1tpbmRleEZvck9mZnNldF07XG59XG5cbmZ1bmN0aW9uIGdldFN0eWxlU2FuaXRpemVyKGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBkaXJlY3RpdmVJbmRleDogbnVtYmVyKTogU3R5bGVTYW5pdGl6ZUZufG51bGwge1xuICBjb25zdCBkaXJzID0gY29udGV4dFtTdHlsaW5nSW5kZXguRGlyZWN0aXZlUmVnaXN0cnlQb3NpdGlvbl07XG4gIGNvbnN0IHZhbHVlID0gZGlyc1xuICAgICAgICAgICAgICAgICAgICBbZGlyZWN0aXZlSW5kZXggKiBEaXJlY3RpdmVSZWdpc3RyeVZhbHVlc0luZGV4LlNpemUgK1xuICAgICAgICAgICAgICAgICAgICAgRGlyZWN0aXZlUmVnaXN0cnlWYWx1ZXNJbmRleC5TdHlsZVNhbml0aXplck9mZnNldF0gfHxcbiAgICAgIGRpcnNbRGlyZWN0aXZlUmVnaXN0cnlWYWx1ZXNJbmRleC5TdHlsZVNhbml0aXplck9mZnNldF0gfHwgbnVsbDtcbiAgcmV0dXJuIHZhbHVlIGFzIFN0eWxlU2FuaXRpemVGbiB8IG51bGw7XG59XG5cbmZ1bmN0aW9uIGlzRGlyZWN0aXZlRGlydHkoY29udGV4dDogU3R5bGluZ0NvbnRleHQsIGRpcmVjdGl2ZUluZGV4OiBudW1iZXIpOiBib29sZWFuIHtcbiAgY29uc3QgZGlycyA9IGNvbnRleHRbU3R5bGluZ0luZGV4LkRpcmVjdGl2ZVJlZ2lzdHJ5UG9zaXRpb25dO1xuICByZXR1cm4gZGlyc1xuICAgICAgW2RpcmVjdGl2ZUluZGV4ICogRGlyZWN0aXZlUmVnaXN0cnlWYWx1ZXNJbmRleC5TaXplICtcbiAgICAgICBEaXJlY3RpdmVSZWdpc3RyeVZhbHVlc0luZGV4LkRpcnR5RmxhZ09mZnNldF0gYXMgYm9vbGVhbjtcbn1cblxuZnVuY3Rpb24gc2V0RGlyZWN0aXZlRGlydHkoXG4gICAgY29udGV4dDogU3R5bGluZ0NvbnRleHQsIGRpcmVjdGl2ZUluZGV4OiBudW1iZXIsIGRpcnR5WWVzOiBib29sZWFuKTogdm9pZCB7XG4gIGNvbnN0IGRpcnMgPSBjb250ZXh0W1N0eWxpbmdJbmRleC5EaXJlY3RpdmVSZWdpc3RyeVBvc2l0aW9uXTtcbiAgZGlyc1xuICAgICAgW2RpcmVjdGl2ZUluZGV4ICogRGlyZWN0aXZlUmVnaXN0cnlWYWx1ZXNJbmRleC5TaXplICtcbiAgICAgICBEaXJlY3RpdmVSZWdpc3RyeVZhbHVlc0luZGV4LkRpcnR5RmxhZ09mZnNldF0gPSBkaXJ0eVllcztcbn1cblxuZnVuY3Rpb24gYWxsb3dWYWx1ZUNoYW5nZShcbiAgICBjdXJyZW50VmFsdWU6IHN0cmluZyB8IGJvb2xlYW4gfCBudWxsLCBuZXdWYWx1ZTogc3RyaW5nIHwgYm9vbGVhbiB8IG51bGwsXG4gICAgY3VycmVudERpcmVjdGl2ZU93bmVyOiBudW1iZXIsIG5ld0RpcmVjdGl2ZU93bmVyOiBudW1iZXIpIHtcbiAgLy8gdGhlIGNvZGUgYmVsb3cgcmVsaWVzIHRoZSBpbXBvcnRhbmNlIG9mIGRpcmVjdGl2ZSdzIGJlaW5nIHRpZWQgdG8gdGhlaXJcbiAgLy8gaW5kZXggdmFsdWUuIFRoZSBpbmRleCB2YWx1ZXMgZm9yIGVhY2ggZGlyZWN0aXZlIGFyZSBkZXJpdmVkIGZyb20gYmVpbmdcbiAgLy8gcmVnaXN0ZXJlZCBpbnRvIHRoZSBzdHlsaW5nIGNvbnRleHQgZGlyZWN0aXZlIHJlZ2lzdHJ5LiBUaGUgbW9zdCBpbXBvcnRhbnRcbiAgLy8gZGlyZWN0aXZlIGlzIHRoZSBwYXJlbnQgY29tcG9uZW50IGRpcmVjdGl2ZSAodGhlIHRlbXBsYXRlKSBhbmQgZWFjaCBkaXJlY3RpdmVcbiAgLy8gdGhhdCBpcyBhZGRlZCBhZnRlciBpcyBjb25zaWRlcmVkIGxlc3MgaW1wb3J0YW50IHRoYW4gdGhlIHByZXZpb3VzIGVudHJ5LiBUaGlzXG4gIC8vIHByaW9yaXRpemF0aW9uIG9mIGRpcmVjdGl2ZXMgZW5hYmxlcyB0aGUgc3R5bGluZyBhbGdvcml0aG0gdG8gZGVjaWRlIGlmIGEgc3R5bGVcbiAgLy8gb3IgY2xhc3Mgc2hvdWxkIGJlIGFsbG93ZWQgdG8gYmUgdXBkYXRlZC9yZXBsYWNlZCBpbmNhc2UgYW4gZWFybGllciBkaXJlY3RpdmVcbiAgLy8gYWxyZWFkeSB3cm90ZSB0byB0aGUgZXhhY3Qgc2FtZSBzdHlsZS1wcm9wZXJ0eSBvciBjbGFzc05hbWUgdmFsdWUuIEluIG90aGVyIHdvcmRzXG4gIC8vIHRoaXMgZGVjaWRlcyB3aGF0IHRvIGRvIGlmIGFuZCB3aGVuIHRoZXJlIGlzIGEgY29sbGlzaW9uLlxuICBpZiAoY3VycmVudFZhbHVlICE9IG51bGwpIHtcbiAgICBpZiAobmV3VmFsdWUgIT0gbnVsbCkge1xuICAgICAgLy8gaWYgYSBkaXJlY3RpdmUgaW5kZXggaXMgbG93ZXIgdGhhbiBpdCBhbHdheXMgaGFzIHByaW9yaXR5IG92ZXIgdGhlXG4gICAgICAvLyBwcmV2aW91cyBkaXJlY3RpdmUncyB2YWx1ZS4uLlxuICAgICAgcmV0dXJuIG5ld0RpcmVjdGl2ZU93bmVyIDw9IGN1cnJlbnREaXJlY3RpdmVPd25lcjtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gb25seSB3cml0ZSBhIG51bGwgdmFsdWUgaW5jYXNlIGl0J3MgdGhlIHNhbWUgb3duZXIgd3JpdGluZyBpdC5cbiAgICAgIC8vIHRoaXMgYXZvaWRzIGhhdmluZyBhIGhpZ2hlci1wcmlvcml0eSBkaXJlY3RpdmUgd3JpdGUgdG8gbnVsbFxuICAgICAgLy8gb25seSB0byBoYXZlIGEgbGVzc2VyLXByaW9yaXR5IGRpcmVjdGl2ZSBjaGFuZ2UgcmlnaHQgdG8gYVxuICAgICAgLy8gbm9uLW51bGwgdmFsdWUgaW1tZWRpYXRlbHkgYWZ0ZXJ3YXJkcy5cbiAgICAgIHJldHVybiBjdXJyZW50RGlyZWN0aXZlT3duZXIgPT09IG5ld0RpcmVjdGl2ZU93bmVyO1xuICAgIH1cbiAgfVxuICByZXR1cm4gdHJ1ZTtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBjbGFzc05hbWUgc3RyaW5nIG9mIGFsbCB0aGUgaW5pdGlhbCBjbGFzc2VzIGZvciB0aGUgZWxlbWVudC5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIGlzIGRlc2lnbmVkIHRvIHBvcHVsYXRlIGFuZCBjYWNoZSBhbGwgdGhlIHN0YXRpYyBjbGFzc1xuICogdmFsdWVzIGludG8gYSBjbGFzc05hbWUgc3RyaW5nLiBUaGUgY2FjaGluZyBtZWNoYW5pc20gd29ya3MgYnkgcGxhY2luZ1xuICogdGhlIGNvbXBsZXRlZCBjbGFzc05hbWUgc3RyaW5nIGludG8gdGhlIGluaXRpYWwgdmFsdWVzIGFycmF5IGludG8gYVxuICogZGVkaWNhdGVkIHNsb3QuIFRoaXMgd2lsbCBwcmV2ZW50IHRoZSBmdW5jdGlvbiBmcm9tIGhhdmluZyB0byBwb3B1bGF0ZVxuICogdGhlIHN0cmluZyBlYWNoIHRpbWUgYW4gZWxlbWVudCBpcyBjcmVhdGVkIG9yIG1hdGNoZWQuXG4gKlxuICogQHJldHVybnMgdGhlIGNsYXNzTmFtZSBzdHJpbmcgKGUuZy4gYG9uIGFjdGl2ZSByZWRgKVxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0SW5pdGlhbENsYXNzTmFtZVZhbHVlKGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0KTogc3RyaW5nIHtcbiAgY29uc3QgaW5pdGlhbENsYXNzVmFsdWVzID0gY29udGV4dFtTdHlsaW5nSW5kZXguSW5pdGlhbENsYXNzVmFsdWVzUG9zaXRpb25dO1xuICBsZXQgY2xhc3NOYW1lID0gaW5pdGlhbENsYXNzVmFsdWVzW0luaXRpYWxTdHlsaW5nVmFsdWVzSW5kZXguSW5pdGlhbENsYXNzZXNTdHJpbmdQb3NpdGlvbl07XG4gIGlmIChjbGFzc05hbWUgPT09IG51bGwpIHtcbiAgICBjbGFzc05hbWUgPSAnJztcbiAgICBmb3IgKGxldCBpID0gSW5pdGlhbFN0eWxpbmdWYWx1ZXNJbmRleC5LZXlWYWx1ZVN0YXJ0UG9zaXRpb247IGkgPCBpbml0aWFsQ2xhc3NWYWx1ZXMubGVuZ3RoO1xuICAgICAgICAgaSArPSBJbml0aWFsU3R5bGluZ1ZhbHVlc0luZGV4LlNpemUpIHtcbiAgICAgIGNvbnN0IGlzUHJlc2VudCA9IGluaXRpYWxDbGFzc1ZhbHVlc1tpICsgMV07XG4gICAgICBpZiAoaXNQcmVzZW50KSB7XG4gICAgICAgIGNsYXNzTmFtZSArPSAoY2xhc3NOYW1lLmxlbmd0aCA/ICcgJyA6ICcnKSArIGluaXRpYWxDbGFzc1ZhbHVlc1tpXTtcbiAgICAgIH1cbiAgICB9XG4gICAgaW5pdGlhbENsYXNzVmFsdWVzW0luaXRpYWxTdHlsaW5nVmFsdWVzSW5kZXguSW5pdGlhbENsYXNzZXNTdHJpbmdQb3NpdGlvbl0gPSBjbGFzc05hbWU7XG4gIH1cbiAgcmV0dXJuIGNsYXNzTmFtZTtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBzdHlsZSBzdHJpbmcgb2YgYWxsIHRoZSBpbml0aWFsIHN0eWxlcyBmb3IgdGhlIGVsZW1lbnQuXG4gKlxuICogVGhpcyBmdW5jdGlvbiBpcyBkZXNpZ25lZCB0byBwb3B1bGF0ZSBhbmQgY2FjaGUgYWxsIHRoZSBzdGF0aWMgc3R5bGVcbiAqIHZhbHVlcyBpbnRvIGEgc3R5bGUgc3RyaW5nLiBUaGUgY2FjaGluZyBtZWNoYW5pc20gd29ya3MgYnkgcGxhY2luZ1xuICogdGhlIGNvbXBsZXRlZCBzdHlsZSBzdHJpbmcgaW50byB0aGUgaW5pdGlhbCB2YWx1ZXMgYXJyYXkgaW50byBhXG4gKiBkZWRpY2F0ZWQgc2xvdC4gVGhpcyB3aWxsIHByZXZlbnQgdGhlIGZ1bmN0aW9uIGZyb20gaGF2aW5nIHRvIHBvcHVsYXRlXG4gKiB0aGUgc3RyaW5nIGVhY2ggdGltZSBhbiBlbGVtZW50IGlzIGNyZWF0ZWQgb3IgbWF0Y2hlZC5cbiAqXG4gKiBAcmV0dXJucyB0aGUgc3R5bGUgc3RyaW5nIChlLmcuIGB3aWR0aDoxMDBweDtoZWlnaHQ6MjAwcHhgKVxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0SW5pdGlhbFN0eWxlU3RyaW5nVmFsdWUoY29udGV4dDogU3R5bGluZ0NvbnRleHQpOiBzdHJpbmcge1xuICBjb25zdCBpbml0aWFsU3R5bGVWYWx1ZXMgPSBjb250ZXh0W1N0eWxpbmdJbmRleC5Jbml0aWFsU3R5bGVWYWx1ZXNQb3NpdGlvbl07XG4gIGxldCBzdHlsZVN0cmluZyA9IGluaXRpYWxTdHlsZVZhbHVlc1tJbml0aWFsU3R5bGluZ1ZhbHVlc0luZGV4LkluaXRpYWxDbGFzc2VzU3RyaW5nUG9zaXRpb25dO1xuICBpZiAoc3R5bGVTdHJpbmcgPT09IG51bGwpIHtcbiAgICBzdHlsZVN0cmluZyA9ICcnO1xuICAgIGZvciAobGV0IGkgPSBJbml0aWFsU3R5bGluZ1ZhbHVlc0luZGV4LktleVZhbHVlU3RhcnRQb3NpdGlvbjsgaSA8IGluaXRpYWxTdHlsZVZhbHVlcy5sZW5ndGg7XG4gICAgICAgICBpICs9IEluaXRpYWxTdHlsaW5nVmFsdWVzSW5kZXguU2l6ZSkge1xuICAgICAgY29uc3QgdmFsdWUgPSBpbml0aWFsU3R5bGVWYWx1ZXNbaSArIDFdO1xuICAgICAgaWYgKHZhbHVlICE9PSBudWxsKSB7XG4gICAgICAgIHN0eWxlU3RyaW5nICs9IChzdHlsZVN0cmluZy5sZW5ndGggPyAnOycgOiAnJykgKyBgJHtpbml0aWFsU3R5bGVWYWx1ZXNbaV19OiR7dmFsdWV9YDtcbiAgICAgIH1cbiAgICB9XG4gICAgaW5pdGlhbFN0eWxlVmFsdWVzW0luaXRpYWxTdHlsaW5nVmFsdWVzSW5kZXguSW5pdGlhbENsYXNzZXNTdHJpbmdQb3NpdGlvbl0gPSBzdHlsZVN0cmluZztcbiAgfVxuICByZXR1cm4gc3R5bGVTdHJpbmc7XG59XG5cbi8qKlxuICogUmV0dXJucyB0aGUgY3VycmVudCBjYWNoZWQgbXV0bGktdmFsdWUgZm9yIGEgZ2l2ZW4gZGlyZWN0aXZlSW5kZXggd2l0aGluIHRoZSBwcm92aWRlZCBjb250ZXh0LlxuICovXG5mdW5jdGlvbiByZWFkQ2FjaGVkTWFwVmFsdWUoXG4gICAgY29udGV4dDogU3R5bGluZ0NvbnRleHQsIGVudHJ5SXNDbGFzc0Jhc2VkOiBib29sZWFuLCBkaXJlY3RpdmVJbmRleDogbnVtYmVyKSB7XG4gIGNvbnN0IHZhbHVlczogTWFwQmFzZWRPZmZzZXRWYWx1ZXMgPVxuICAgICAgY29udGV4dFtlbnRyeUlzQ2xhc3NCYXNlZCA/IFN0eWxpbmdJbmRleC5DYWNoZWRNdWx0aUNsYXNzZXMgOiBTdHlsaW5nSW5kZXguQ2FjaGVkTXVsdGlTdHlsZXNdO1xuICBjb25zdCBpbmRleCA9IE1hcEJhc2VkT2Zmc2V0VmFsdWVzSW5kZXguVmFsdWVzU3RhcnRQb3NpdGlvbiArXG4gICAgICBkaXJlY3RpdmVJbmRleCAqIE1hcEJhc2VkT2Zmc2V0VmFsdWVzSW5kZXguU2l6ZTtcbiAgcmV0dXJuIHZhbHVlc1tpbmRleCArIE1hcEJhc2VkT2Zmc2V0VmFsdWVzSW5kZXguVmFsdWVPZmZzZXRdIHx8IG51bGw7XG59XG5cbi8qKlxuICogRGV0ZXJtaW5lcyB3aGV0aGVyIHRoZSBwcm92aWRlZCBtdWx0aSBzdHlsaW5nIHZhbHVlIHNob3VsZCBiZSB1cGRhdGVkIG9yIG5vdC5cbiAqXG4gKiBCZWNhdXNlIGBbc3R5bGVdYCBhbmQgYFtjbGFzc11gIGJpbmRpbmdzIHJlbHkgb24gYW4gaWRlbnRpdHkgY2hhbmdlIHRvIG9jY3VyIGJlZm9yZVxuICogYXBwbHlpbmcgbmV3IHZhbHVlcywgdGhlIHN0eWxpbmcgYWxnb3JpdGhtIG1heSBub3QgdXBkYXRlIGFuIGV4aXN0aW5nIGVudHJ5IGludG9cbiAqIHRoZSBjb250ZXh0IGlmIGEgcHJldmlvdXMgZGlyZWN0aXZlJ3MgZW50cnkgY2hhbmdlZCBzaGFwZS5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIHdpbGwgZGVjaWRlIHdoZXRoZXIgb3Igbm90IGEgdmFsdWUgc2hvdWxkIGJlIGFwcGxpZWQgKGlmIHRoZXJlIGlzIGFcbiAqIGNhY2hlIG1pc3MpIHRvIHRoZSBjb250ZXh0IGJhc2VkIG9uIHRoZSBmb2xsb3dpbmcgcnVsZXM6XG4gKlxuICogLSBJZiB0aGVyZSBpcyBhbiBpZGVudGl0eSBjaGFuZ2UgYmV0d2VlbiB0aGUgZXhpc3RpbmcgdmFsdWUgYW5kIG5ldyB2YWx1ZVxuICogLSBJZiB0aGVyZSBpcyBubyBleGlzdGluZyB2YWx1ZSBjYWNoZWQgKGZpcnN0IHdyaXRlKVxuICogLSBJZiBhIHByZXZpb3VzIGRpcmVjdGl2ZSBmbGFnZ2VkIHRoZSBleGlzdGluZyBjYWNoZWQgdmFsdWUgYXMgZGlydHlcbiAqL1xuZnVuY3Rpb24gaXNNdWx0aVZhbHVlQ2FjaGVIaXQoXG4gICAgY29udGV4dDogU3R5bGluZ0NvbnRleHQsIGVudHJ5SXNDbGFzc0Jhc2VkOiBib29sZWFuLCBkaXJlY3RpdmVJbmRleDogbnVtYmVyLFxuICAgIG5ld1ZhbHVlOiBhbnkpOiBib29sZWFuIHtcbiAgY29uc3QgaW5kZXhPZkNhY2hlZFZhbHVlcyA9XG4gICAgICBlbnRyeUlzQ2xhc3NCYXNlZCA/IFN0eWxpbmdJbmRleC5DYWNoZWRNdWx0aUNsYXNzZXMgOiBTdHlsaW5nSW5kZXguQ2FjaGVkTXVsdGlTdHlsZXM7XG4gIGNvbnN0IGNhY2hlZFZhbHVlcyA9IGNvbnRleHRbaW5kZXhPZkNhY2hlZFZhbHVlc10gYXMgTWFwQmFzZWRPZmZzZXRWYWx1ZXM7XG4gIGNvbnN0IGluZGV4ID0gTWFwQmFzZWRPZmZzZXRWYWx1ZXNJbmRleC5WYWx1ZXNTdGFydFBvc2l0aW9uICtcbiAgICAgIGRpcmVjdGl2ZUluZGV4ICogTWFwQmFzZWRPZmZzZXRWYWx1ZXNJbmRleC5TaXplO1xuICBpZiAoY2FjaGVkVmFsdWVzW2luZGV4ICsgTWFwQmFzZWRPZmZzZXRWYWx1ZXNJbmRleC5EaXJ0eUZsYWdPZmZzZXRdKSByZXR1cm4gZmFsc2U7XG4gIHJldHVybiBuZXdWYWx1ZSA9PT0gTk9fQ0hBTkdFIHx8XG4gICAgICByZWFkQ2FjaGVkTWFwVmFsdWUoY29udGV4dCwgZW50cnlJc0NsYXNzQmFzZWQsIGRpcmVjdGl2ZUluZGV4KSA9PT0gbmV3VmFsdWU7XG59XG5cbi8qKlxuICogVXBkYXRlcyB0aGUgY2FjaGVkIHN0YXR1cyBvZiBhIG11bHRpLXN0eWxpbmcgdmFsdWUgaW4gdGhlIGNvbnRleHQuXG4gKlxuICogVGhlIGNhY2hlZCBtYXAgYXJyYXkgKHdoaWNoIGV4aXN0cyBpbiB0aGUgY29udGV4dCkgY29udGFpbnMgYSBtYW5pZmVzdCBvZlxuICogZWFjaCBtdWx0aS1zdHlsaW5nIGVudHJ5IChgW3N0eWxlXWAgYW5kIGBbY2xhc3NdYCBlbnRyaWVzKSBmb3IgdGhlIHRlbXBsYXRlXG4gKiBhcyB3ZWxsIGFzIGFsbCBkaXJlY3RpdmVzLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gd2lsbCB1cGRhdGUgdGhlIGNhY2hlZCBzdGF0dXMgb2YgdGhlIHByb3ZpZGVkIG11bHRpLXN0eWxlXG4gKiBlbnRyeSB3aXRoaW4gdGhlIGNhY2hlLlxuICpcbiAqIFdoZW4gY2FsbGVkLCB0aGlzIGZ1bmN0aW9uIHdpbGwgdXBkYXRlIHRoZSBmb2xsb3dpbmcgaW5mb3JtYXRpb246XG4gKiAtIFRoZSBhY3R1YWwgY2FjaGVkIHZhbHVlICh0aGUgcmF3IHZhbHVlIHRoYXQgd2FzIHBhc3NlZCBpbnRvIGBbc3R5bGVdYCBvciBgW2NsYXNzXWApXG4gKiAtIFRoZSB0b3RhbCBhbW91bnQgb2YgdW5pcXVlIHN0eWxpbmcgZW50cmllcyB0aGF0IHRoaXMgdmFsdWUgaGFzIHdyaXR0ZW4gaW50byB0aGUgY29udGV4dFxuICogLSBUaGUgZXhhY3QgcG9zaXRpb24gb2Ygd2hlcmUgdGhlIG11bHRpIHN0eWxpbmcgZW50cmllcyBzdGFydCBpbiB0aGUgY29udGV4dCBmb3IgdGhpcyBiaW5kaW5nXG4gKiAtIFRoZSBkaXJ0eSBmbGFnIHdpbGwgYmUgc2V0IHRvIHRydWVcbiAqXG4gKiBJZiB0aGUgYGRpcnR5RnV0dXJlVmFsdWVzYCBwYXJhbSBpcyBwcm92aWRlZCB0aGVuIGl0IHdpbGwgdXBkYXRlIGFsbCBmdXR1cmUgZW50cmllcyAoYmluZGluZ1xuICogZW50cmllcyB0aGF0IGV4aXN0IGFzIGFwYXJ0IG9mIG90aGVyIGRpcmVjdGl2ZXMpIHRvIGJlIGRpcnR5IGFzIHdlbGwuIFRoaXMgd2lsbCBmb3JjZSB0aGVcbiAqIHN0eWxpbmcgYWxnb3JpdGhtIHRvIHJlYXBwbHkgdGhvc2UgdmFsdWVzIG9uY2UgY2hhbmdlIGRldGVjdGlvbiBjaGVja3MgdGhlbSAod2hpY2ggd2lsbCBpblxuICogdHVybiBjYXVzZSB0aGUgc3R5bGluZyBjb250ZXh0IHRvIHVwZGF0ZSBpdHNlbGYgYW5kIHRoZSBjb3JyZWN0IHN0eWxpbmcgdmFsdWVzIHdpbGwgYmVcbiAqIHJlbmRlcmVkIG9uIHNjcmVlbikuXG4gKi9cbmZ1bmN0aW9uIHVwZGF0ZUNhY2hlZE1hcFZhbHVlKFxuICAgIGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBkaXJlY3RpdmVJbmRleDogbnVtYmVyLCBlbnRyeUlzQ2xhc3NCYXNlZDogYm9vbGVhbiwgY2FjaGVWYWx1ZTogYW55LFxuICAgIHN0YXJ0UG9zaXRpb246IG51bWJlciwgZW5kUG9zaXRpb246IG51bWJlciwgdG90YWxWYWx1ZXM6IG51bWJlciwgZGlydHlGdXR1cmVWYWx1ZXM6IGJvb2xlYW4pIHtcbiAgY29uc3QgdmFsdWVzID1cbiAgICAgIGNvbnRleHRbZW50cnlJc0NsYXNzQmFzZWQgPyBTdHlsaW5nSW5kZXguQ2FjaGVkTXVsdGlDbGFzc2VzIDogU3R5bGluZ0luZGV4LkNhY2hlZE11bHRpU3R5bGVzXTtcblxuICBjb25zdCBpbmRleCA9IE1hcEJhc2VkT2Zmc2V0VmFsdWVzSW5kZXguVmFsdWVzU3RhcnRQb3NpdGlvbiArXG4gICAgICBkaXJlY3RpdmVJbmRleCAqIE1hcEJhc2VkT2Zmc2V0VmFsdWVzSW5kZXguU2l6ZTtcblxuICAvLyBpbiB0aGUgZXZlbnQgdGhhdCB0aGlzIGlzIHRydWUgd2UgYXNzdW1lIHRoYXQgZnV0dXJlIHZhbHVlcyBhcmUgZGlydHkgYW5kIHRoZXJlZm9yZVxuICAvLyB3aWxsIGJlIGNoZWNrZWQgYWdhaW4gaW4gdGhlIG5leHQgQ0QgY3ljbGVcbiAgaWYgKGRpcnR5RnV0dXJlVmFsdWVzKSB7XG4gICAgY29uc3QgbmV4dFN0YXJ0UG9zaXRpb24gPSBzdGFydFBvc2l0aW9uICsgdG90YWxWYWx1ZXMgKiBNYXBCYXNlZE9mZnNldFZhbHVlc0luZGV4LlNpemU7XG4gICAgZm9yIChsZXQgaSA9IGluZGV4ICsgTWFwQmFzZWRPZmZzZXRWYWx1ZXNJbmRleC5TaXplOyBpIDwgdmFsdWVzLmxlbmd0aDtcbiAgICAgICAgIGkgKz0gTWFwQmFzZWRPZmZzZXRWYWx1ZXNJbmRleC5TaXplKSB7XG4gICAgICB2YWx1ZXNbaSArIE1hcEJhc2VkT2Zmc2V0VmFsdWVzSW5kZXguUG9zaXRpb25TdGFydE9mZnNldF0gPSBuZXh0U3RhcnRQb3NpdGlvbjtcbiAgICAgIHZhbHVlc1tpICsgTWFwQmFzZWRPZmZzZXRWYWx1ZXNJbmRleC5EaXJ0eUZsYWdPZmZzZXRdID0gMTtcbiAgICB9XG4gIH1cblxuICB2YWx1ZXNbaW5kZXggKyBNYXBCYXNlZE9mZnNldFZhbHVlc0luZGV4LkRpcnR5RmxhZ09mZnNldF0gPSAwO1xuICB2YWx1ZXNbaW5kZXggKyBNYXBCYXNlZE9mZnNldFZhbHVlc0luZGV4LlBvc2l0aW9uU3RhcnRPZmZzZXRdID0gc3RhcnRQb3NpdGlvbjtcbiAgdmFsdWVzW2luZGV4ICsgTWFwQmFzZWRPZmZzZXRWYWx1ZXNJbmRleC5WYWx1ZU9mZnNldF0gPSBjYWNoZVZhbHVlO1xuICB2YWx1ZXNbaW5kZXggKyBNYXBCYXNlZE9mZnNldFZhbHVlc0luZGV4LlZhbHVlQ291bnRPZmZzZXRdID0gdG90YWxWYWx1ZXM7XG5cbiAgLy8gdGhlIGNvZGUgYmVsb3cgY291bnRzIHRoZSB0b3RhbCBhbW91bnQgb2Ygc3R5bGluZyB2YWx1ZXMgdGhhdCBleGlzdCBpblxuICAvLyB0aGUgY29udGV4dCB1cCB1bnRpbCB0aGlzIGRpcmVjdGl2ZS4gVGhpcyB2YWx1ZSB3aWxsIGJlIGxhdGVyIHVzZWQgdG9cbiAgLy8gdXBkYXRlIHRoZSBjYWNoZWQgdmFsdWUgbWFwJ3MgdG90YWwgY291bnRlciB2YWx1ZS5cbiAgbGV0IHRvdGFsU3R5bGluZ0VudHJpZXMgPSB0b3RhbFZhbHVlcztcbiAgZm9yIChsZXQgaSA9IE1hcEJhc2VkT2Zmc2V0VmFsdWVzSW5kZXguVmFsdWVzU3RhcnRQb3NpdGlvbjsgaSA8IGluZGV4O1xuICAgICAgIGkgKz0gTWFwQmFzZWRPZmZzZXRWYWx1ZXNJbmRleC5TaXplKSB7XG4gICAgdG90YWxTdHlsaW5nRW50cmllcyArPSB2YWx1ZXNbaSArIE1hcEJhc2VkT2Zmc2V0VmFsdWVzSW5kZXguVmFsdWVDb3VudE9mZnNldF07XG4gIH1cblxuICAvLyBiZWNhdXNlIHN0eWxlIHZhbHVlcyBjb21lIGJlZm9yZSBjbGFzcyB2YWx1ZXMgaW4gdGhlIGNvbnRleHQgdGhpcyBtZWFuc1xuICAvLyB0aGF0IGlmIGFueSBuZXcgdmFsdWVzIHdlcmUgaW5zZXJ0ZWQgdGhlbiB0aGUgY2FjaGUgdmFsdWVzIGFycmF5IGZvclxuICAvLyBjbGFzc2VzIGlzIG91dCBvZiBzeW5jLiBUaGUgY29kZSBiZWxvdyB3aWxsIHVwZGF0ZSB0aGUgb2Zmc2V0cyB0byBwb2ludFxuICAvLyB0byB0aGVpciBuZXcgdmFsdWVzLlxuICBpZiAoIWVudHJ5SXNDbGFzc0Jhc2VkKSB7XG4gICAgY29uc3QgY2xhc3NDYWNoZSA9IGNvbnRleHRbU3R5bGluZ0luZGV4LkNhY2hlZE11bHRpQ2xhc3Nlc107XG4gICAgY29uc3QgY2xhc3Nlc1N0YXJ0UG9zaXRpb24gPSBjbGFzc0NhY2hlXG4gICAgICAgIFtNYXBCYXNlZE9mZnNldFZhbHVlc0luZGV4LlZhbHVlc1N0YXJ0UG9zaXRpb24gK1xuICAgICAgICAgTWFwQmFzZWRPZmZzZXRWYWx1ZXNJbmRleC5Qb3NpdGlvblN0YXJ0T2Zmc2V0XTtcbiAgICBjb25zdCBkaWZmSW5TdGFydFBvc2l0aW9uID0gZW5kUG9zaXRpb24gLSBjbGFzc2VzU3RhcnRQb3NpdGlvbjtcbiAgICBmb3IgKGxldCBpID0gTWFwQmFzZWRPZmZzZXRWYWx1ZXNJbmRleC5WYWx1ZXNTdGFydFBvc2l0aW9uOyBpIDwgY2xhc3NDYWNoZS5sZW5ndGg7XG4gICAgICAgICBpICs9IE1hcEJhc2VkT2Zmc2V0VmFsdWVzSW5kZXguU2l6ZSkge1xuICAgICAgY2xhc3NDYWNoZVtpICsgTWFwQmFzZWRPZmZzZXRWYWx1ZXNJbmRleC5Qb3NpdGlvblN0YXJ0T2Zmc2V0XSArPSBkaWZmSW5TdGFydFBvc2l0aW9uO1xuICAgIH1cbiAgfVxuXG4gIHZhbHVlc1tNYXBCYXNlZE9mZnNldFZhbHVlc0luZGV4LkVudHJpZXNDb3VudFBvc2l0aW9uXSA9IHRvdGFsU3R5bGluZ0VudHJpZXM7XG59XG5cbmZ1bmN0aW9uIGh5cGhlbmF0ZUVudHJpZXMoZW50cmllczogc3RyaW5nW10pOiBzdHJpbmdbXSB7XG4gIGNvbnN0IG5ld0VudHJpZXM6IHN0cmluZ1tdID0gW107XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgZW50cmllcy5sZW5ndGg7IGkrKykge1xuICAgIG5ld0VudHJpZXMucHVzaChoeXBoZW5hdGUoZW50cmllc1tpXSkpO1xuICB9XG4gIHJldHVybiBuZXdFbnRyaWVzO1xufVxuXG5mdW5jdGlvbiBoeXBoZW5hdGUodmFsdWU6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiB2YWx1ZS5yZXBsYWNlKFxuICAgICAgL1thLXpdW0EtWl0vZywgbWF0Y2ggPT4gYCR7bWF0Y2guY2hhckF0KDApfS0ke21hdGNoLmNoYXJBdCgxKS50b0xvd2VyQ2FzZSgpfWApO1xufVxuXG5mdW5jdGlvbiByZWdpc3Rlck11bHRpTWFwRW50cnkoXG4gICAgY29udGV4dDogU3R5bGluZ0NvbnRleHQsIGRpcmVjdGl2ZUluZGV4OiBudW1iZXIsIGVudHJ5SXNDbGFzc0Jhc2VkOiBib29sZWFuLFxuICAgIHN0YXJ0UG9zaXRpb246IG51bWJlciwgY291bnQgPSAwKSB7XG4gIGNvbnN0IGNhY2hlZFZhbHVlcyA9XG4gICAgICBjb250ZXh0W2VudHJ5SXNDbGFzc0Jhc2VkID8gU3R5bGluZ0luZGV4LkNhY2hlZE11bHRpQ2xhc3NlcyA6IFN0eWxpbmdJbmRleC5DYWNoZWRNdWx0aVN0eWxlc107XG4gIGlmIChkaXJlY3RpdmVJbmRleCA+IDApIHtcbiAgICBjb25zdCBsaW1pdCA9IE1hcEJhc2VkT2Zmc2V0VmFsdWVzSW5kZXguVmFsdWVzU3RhcnRQb3NpdGlvbiArXG4gICAgICAgIChkaXJlY3RpdmVJbmRleCAqIE1hcEJhc2VkT2Zmc2V0VmFsdWVzSW5kZXguU2l6ZSk7XG4gICAgd2hpbGUgKGNhY2hlZFZhbHVlcy5sZW5ndGggPCBsaW1pdCkge1xuICAgICAgLy8gdGhpcyBtZWFucyB0aGF0IE9OTFkgZGlyZWN0aXZlIGNsYXNzIHN0eWxpbmcgKGxpa2UgbmdDbGFzcykgd2FzIHVzZWRcbiAgICAgIC8vIHRoZXJlZm9yZSB0aGUgcm9vdCBkaXJlY3RpdmUgd2lsbCBzdGlsbCBuZWVkIHRvIGJlIGZpbGxlZCBpbiBhcyB3ZWxsXG4gICAgICAvLyBhcyBhbnkgb3RoZXIgZGlyZWN0aXZlIHNwYWNlcyBpbmNhc2UgdGhleSBvbmx5IHVzZWQgc3RhdGljIHZhbHVlc1xuICAgICAgY2FjaGVkVmFsdWVzLnB1c2goMCwgc3RhcnRQb3NpdGlvbiwgbnVsbCwgMCk7XG4gICAgfVxuICB9XG4gIGNhY2hlZFZhbHVlcy5wdXNoKDAsIHN0YXJ0UG9zaXRpb24sIG51bGwsIGNvdW50KTtcbn1cbiJdfQ==