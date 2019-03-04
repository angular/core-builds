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
 * @param {?} stylingStartIndex
 * @param {?=} directiveRef
 * @return {?}
 */
export function initializeStaticContext(attrs, stylingStartIndex, directiveRef) {
    /** @type {?} */
    const context = createEmptyStylingContext();
    patchContextWithStaticAttrs(context, attrs, stylingStartIndex, directiveRef);
    return context;
}
/**
 * Designed to update an existing styling context with new static styling
 * data (classes and styles).
 *
 * @param {?} context the existing styling context
 * @param {?} attrs an array of new static styling attributes that will be
 *              assigned to the context
 * @param {?} attrsStylingStartIndex what index to start iterating within the
 *              provided `attrs` array to start reading style and class values
 * @param {?=} directiveRef the directive instance with which static data is associated with.
 * @return {?}
 */
export function patchContextWithStaticAttrs(context, attrs, attrsStylingStartIndex, directiveRef) {
    // this means the context has already been set and instantiated
    if (context[1 /* MasterFlagPosition */] & 16 /* BindingAllocationLocked */)
        return;
    // If the styling context has already been patched with the given directive's bindings,
    // then there is no point in doing it again. The reason why this may happen (the directive
    // styling being patched twice) is because the `stylingBinding` function is called each time
    // an element is created (both within a template function and within directive host bindings).
    /** @type {?} */
    const directives = context[2 /* DirectiveRegistryPosition */];
    /** @type {?} */
    let detectedIndex = getDirectiveRegistryValuesIndexOf(directives, directiveRef || null);
    if (detectedIndex === -1) {
        // this is a new directive which we have not seen yet.
        detectedIndex = allocateDirectiveIntoContext(context, directiveRef);
    }
    /** @type {?} */
    const directiveIndex = detectedIndex / 4 /* Size */;
    /** @type {?} */
    let initialClasses = null;
    /** @type {?} */
    let initialStyles = null;
    /** @type {?} */
    let mode = -1;
    for (let i = attrsStylingStartIndex; i < attrs.length; i++) {
        /** @type {?} */
        const attr = attrs[i];
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
 * @param {?} initialStyling the initial styling array where the new styling entry will be added to
 * @param {?} prop the property value of the new entry (e.g. `width` (styles) or `foo` (classes))
 * @param {?} value the styling value of the new entry (e.g. `absolute` (styles) or `true` (classes))
 * @param {?} directiveOwnerIndex the directive owner index value of the styling source responsible
 *        for these styles (see `interfaces/styling.ts#directives` for more info)
 * @return {?}
 */
function patchInitialStylingValue(initialStyling, prop, value, directiveOwnerIndex) {
    for (let i = 2 /* KeyValueStartPosition */; i < initialStyling.length; i += 3 /* Size */) {
        /** @type {?} */
        const key = initialStyling[i + 0 /* PropOffset */];
        if (key === prop) {
            /** @type {?} */
            const existingValue = (/** @type {?} */ (initialStyling[i + 1 /* ValueOffset */]));
            /** @type {?} */
            const existingOwner = (/** @type {?} */ (initialStyling[i + 2 /* DirectiveOwnerOffset */]));
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
 * Runs through the initial style data present in the context and renders
 * them via the renderer on the element.
 * @param {?} element
 * @param {?} context
 * @param {?} renderer
 * @return {?}
 */
export function renderInitialStyles(element, context, renderer) {
    /** @type {?} */
    const initialStyles = context[3 /* InitialStyleValuesPosition */];
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
    const initialClasses = context[4 /* InitialClassValuesPosition */];
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
    for (let i = 2 /* KeyValueStartPosition */; i < initialStylingValues.length; i += 3 /* Size */) {
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
    return (context[1 /* MasterFlagPosition */] & 16 /* BindingAllocationLocked */) === 0;
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
    if (context[1 /* MasterFlagPosition */] & 16 /* BindingAllocationLocked */)
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
    const singlePropOffsetValues = context[5 /* SinglePropOffsetPositions */];
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
    const initialClasses = context[4 /* InitialClassValuesPosition */];
    /** @type {?} */
    const initialStyles = context[3 /* InitialStyleValuesPosition */];
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
            indexForInitial = addOrUpdateStaticStyle(null, initialValuesToLookup, propName, entryIsClassBased ? false : null, directiveIndex) +
                1 /* ValueOffset */;
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
    setFlag(context, 1 /* MasterFlagPosition */, masterFlag);
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
    const directiveRefs = context[2 /* DirectiveRegistryPosition */];
    /** @type {?} */
    const nextOffsetInsertionIndex = context[5 /* SinglePropOffsetPositions */].length;
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
    const element = (/** @type {?} */ ((/** @type {?} */ (context[0 /* ElementPosition */]))));
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
    const stylesValue = stylesPlayerBuilder ? (/** @type {?} */ (stylesInput))['value'] : stylesInput;
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
        const element = (/** @type {?} */ ((/** @type {?} */ (context[0 /* ElementPosition */]))));
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
        const flushPlayerBuilders = context[1 /* MasterFlagPosition */] & 8 /* PlayerBuildersDirty */;
        /** @type {?} */
        const native = (/** @type {?} */ (context[0 /* ElementPosition */]));
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
    const initialValues = entryIsClassBased ? context[4 /* InitialClassValuesPosition */] :
        context[3 /* InitialStyleValuesPosition */];
    return (/** @type {?} */ (initialValues[index]));
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
    return (/** @type {?} */ (getMultiOrSingleIndex(context[1 /* MasterFlagPosition */])));
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
    const adjustedIndex = index === 1 /* MasterFlagPosition */ ? index : (index + 0 /* FlagsOffset */);
    context[adjustedIndex] = flag;
}
/**
 * @param {?} context
 * @param {?} index
 * @return {?}
 */
function getPointers(context, index) {
    /** @type {?} */
    const adjustedIndex = index === 1 /* MasterFlagPosition */ ? index : (index + 0 /* FlagsOffset */);
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
    return isDirty(context, 1 /* MasterFlagPosition */);
}
/**
 * @param {?} context
 * @param {?} isDirtyYes
 * @return {?}
 */
export function setContextDirty(context, isDirtyYes) {
    setDirty(context, 1 /* MasterFlagPosition */, isDirtyYes);
}
/**
 * @param {?} context
 * @param {?} isDirtyYes
 * @return {?}
 */
export function setContextPlayersDirty(context, isDirtyYes) {
    if (isDirtyYes) {
        ((/** @type {?} */ (context[1 /* MasterFlagPosition */]))) |= 8 /* PlayerBuildersDirty */;
    }
    else {
        ((/** @type {?} */ (context[1 /* MasterFlagPosition */]))) &= ~8 /* PlayerBuildersDirty */;
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
            getInitialStylingValuesIndexOf(context[4 /* InitialClassValuesPosition */], prop);
    }
    else {
        initialIndex =
            getInitialStylingValuesIndexOf(context[3 /* InitialStyleValuesPosition */], prop);
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
        index = index || 1 /* MasterFlagPosition */;
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
    const dirs = context[2 /* DirectiveRegistryPosition */];
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
    for (let i = 2 /* KeyValueStartPosition */; i < keyValues.length; i += 3 /* Size */) {
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
    const singlePropOffsetRegistryIndex = (/** @type {?} */ (context[2 /* DirectiveRegistryPosition */][(directiveIndex * 4 /* Size */) +
        1 /* SinglePropValuesIndexOffset */]));
    /** @type {?} */
    const offsets = context[5 /* SinglePropOffsetPositions */];
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
    const dirs = context[2 /* DirectiveRegistryPosition */];
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
    const dirs = context[2 /* DirectiveRegistryPosition */];
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
    const dirs = context[2 /* DirectiveRegistryPosition */];
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
    const initialClassValues = context[4 /* InitialClassValuesPosition */];
    /** @type {?} */
    let className = initialClassValues[1 /* CachedStringValuePosition */];
    if (className === null) {
        className = '';
        for (let i = 2 /* KeyValueStartPosition */; i < initialClassValues.length; i += 3 /* Size */) {
            /** @type {?} */
            const isPresent = initialClassValues[i + 1];
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
 * @param {?} context
 * @return {?} the style string (e.g. `width:100px;height:200px`)
 */
export function getInitialStyleStringValue(context) {
    /** @type {?} */
    const initialStyleValues = context[3 /* InitialStyleValuesPosition */];
    /** @type {?} */
    let styleString = initialStyleValues[1 /* CachedStringValuePosition */];
    if (styleString === null) {
        styleString = '';
        for (let i = 2 /* KeyValueStartPosition */; i < initialStyleValues.length; i += 3 /* Size */) {
            /** @type {?} */
            const value = initialStyleValues[i + 1];
            if (value !== null) {
                styleString += (styleString.length ? ';' : '') + `${initialStyleValues[i]}:${value}`;
            }
        }
        initialStyleValues[1 /* CachedStringValuePosition */] = styleString;
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
/**
 * Inserts or updates an existing entry in the provided `staticStyles` collection.
 *
 * @param {?} index the index representing an existing styling entry in the collection:
 *  if provided (numeric): then it will update the existing entry at the given position
 *  if null: then it will insert a new entry within the collection
 * @param {?} staticStyles a collection of style or class entries where the value will
 *  be inserted or patched
 * @param {?} prop the property value of the entry (e.g. `width` (styles) or `foo` (classes))
 * @param {?} value the styling value of the entry (e.g. `absolute` (styles) or `true` (classes))
 * @param {?} directiveOwnerIndex the directive owner index value of the styling source responsible
 *        for these styles (see `interfaces/styling.ts#directives` for more info)
 * @return {?} the index of the updated or new entry within the collection
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xhc3NfYW5kX3N0eWxlX2JpbmRpbmdzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9zdHlsaW5nL2NsYXNzX2FuZF9zdHlsZV9iaW5kaW5ncy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7O0FBUUEsT0FBTyxFQUFDLFdBQVcsRUFBRSxTQUFTLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFHaEQsT0FBTyxFQUFzQixtQkFBbUIsRUFBRSxvQkFBb0IsRUFBQyxNQUFNLHdCQUF3QixDQUFDO0FBR3RHLE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxXQUFXLENBQUM7QUFDcEMsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLDhCQUE4QixDQUFDO0FBRTVELE9BQU8sRUFBQyxrQkFBa0IsRUFBQyxNQUFNLGtCQUFrQixDQUFDO0FBQ3BELE9BQU8sRUFBQyxpQkFBaUIsRUFBRSxrQkFBa0IsRUFBRSw0QkFBNEIsRUFBRSx5QkFBeUIsRUFBRSxnQkFBZ0IsRUFBQyxNQUFNLFFBQVEsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUF5QnhJLE1BQU0sVUFBVSx1QkFBdUIsQ0FDbkMsS0FBa0IsRUFBRSxpQkFBeUIsRUFBRSxZQUF5Qjs7VUFDcEUsT0FBTyxHQUFHLHlCQUF5QixFQUFFO0lBQzNDLDJCQUEyQixDQUFDLE9BQU8sRUFBRSxLQUFLLEVBQUUsaUJBQWlCLEVBQUUsWUFBWSxDQUFDLENBQUM7SUFDN0UsT0FBTyxPQUFPLENBQUM7QUFDakIsQ0FBQzs7Ozs7Ozs7Ozs7OztBQWFELE1BQU0sVUFBVSwyQkFBMkIsQ0FDdkMsT0FBdUIsRUFBRSxLQUFrQixFQUFFLHNCQUE4QixFQUMzRSxZQUF5QjtJQUMzQiwrREFBK0Q7SUFDL0QsSUFBSSxPQUFPLDRCQUFpQyxtQ0FBdUM7UUFBRSxPQUFPOzs7Ozs7VUFNdEYsVUFBVSxHQUFHLE9BQU8sbUNBQXdDOztRQUM5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Q0FBQyxNQUFNLENBQUM7UUFDNUIsWUFBWSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ3BDLFlBQVksQ0FBQyxLQUFLLHFCQUF1QyxDQUFDLEdBQUcsSUFBSSxDQUFDO0tBQ25FO0lBQ0QsWUFBWSxDQUFDLEtBQUssc0JBQXdDLENBQUMsR0FBRyxLQUFLLENBQUM7SUFDcEUsWUFBWSxDQUFDLEtBQUssK0JBQWlELENBQUMsR0FBRyxtQkFBbUIsQ0FBQztJQUMzRixPQUFPLEtBQUssQ0FBQztBQUNmLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiogQGxpY2Vuc2VcbiogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4qXG4qIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4qIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiovXG5pbXBvcnQge1N0eWxlU2FuaXRpemVGbn0gZnJvbSAnLi4vLi4vc2FuaXRpemF0aW9uL3N0eWxlX3Nhbml0aXplcic7XG5pbXBvcnQge0VNUFRZX0FSUkFZLCBFTVBUWV9PQkp9IGZyb20gJy4uL2VtcHR5JztcbmltcG9ydCB7QXR0cmlidXRlTWFya2VyLCBUQXR0cmlidXRlc30gZnJvbSAnLi4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7QmluZGluZ1N0b3JlLCBCaW5kaW5nVHlwZSwgUGxheWVyLCBQbGF5ZXJCdWlsZGVyLCBQbGF5ZXJGYWN0b3J5LCBQbGF5ZXJJbmRleH0gZnJvbSAnLi4vaW50ZXJmYWNlcy9wbGF5ZXInO1xuaW1wb3J0IHtSRWxlbWVudCwgUmVuZGVyZXIzLCBSZW5kZXJlclN0eWxlRmxhZ3MzLCBpc1Byb2NlZHVyYWxSZW5kZXJlcn0gZnJvbSAnLi4vaW50ZXJmYWNlcy9yZW5kZXJlcic7XG5pbXBvcnQge0RpcmVjdGl2ZU93bmVyQW5kUGxheWVyQnVpbGRlckluZGV4LCBEaXJlY3RpdmVSZWdpc3RyeVZhbHVlcywgRGlyZWN0aXZlUmVnaXN0cnlWYWx1ZXNJbmRleCwgSW5pdGlhbFN0eWxpbmdWYWx1ZXMsIEluaXRpYWxTdHlsaW5nVmFsdWVzSW5kZXgsIE1hcEJhc2VkT2Zmc2V0VmFsdWVzLCBNYXBCYXNlZE9mZnNldFZhbHVlc0luZGV4LCBTaW5nbGVQcm9wT2Zmc2V0VmFsdWVzLCBTaW5nbGVQcm9wT2Zmc2V0VmFsdWVzSW5kZXgsIFN0eWxpbmdDb250ZXh0LCBTdHlsaW5nRmxhZ3MsIFN0eWxpbmdJbmRleH0gZnJvbSAnLi4vaW50ZXJmYWNlcy9zdHlsaW5nJztcbmltcG9ydCB7TFZpZXcsIFJvb3RDb250ZXh0fSBmcm9tICcuLi9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHtOT19DSEFOR0V9IGZyb20gJy4uL3Rva2Vucyc7XG5pbXBvcnQge2dldFJvb3RDb250ZXh0fSBmcm9tICcuLi91dGlsL3ZpZXdfdHJhdmVyc2FsX3V0aWxzJztcblxuaW1wb3J0IHtCb3VuZFBsYXllckZhY3Rvcnl9IGZyb20gJy4vcGxheWVyX2ZhY3RvcnknO1xuaW1wb3J0IHthZGRQbGF5ZXJJbnRlcm5hbCwgYWxsb2NQbGF5ZXJDb250ZXh0LCBhbGxvY2F0ZURpcmVjdGl2ZUludG9Db250ZXh0LCBjcmVhdGVFbXB0eVN0eWxpbmdDb250ZXh0LCBnZXRQbGF5ZXJDb250ZXh0fSBmcm9tICcuL3V0aWwnO1xuXG5cblxuLyoqXG4gKiBUaGlzIGZpbGUgaW5jbHVkZXMgdGhlIGNvZGUgdG8gcG93ZXIgYWxsIHN0eWxpbmctYmluZGluZyBvcGVyYXRpb25zIGluIEFuZ3VsYXIuXG4gKlxuICogVGhlc2UgaW5jbHVkZTpcbiAqIFtzdHlsZV09XCJteVN0eWxlT2JqXCJcbiAqIFtjbGFzc109XCJteUNsYXNzT2JqXCJcbiAqIFtzdHlsZS5wcm9wXT1cIm15UHJvcFZhbHVlXCJcbiAqIFtjbGFzcy5uYW1lXT1cIm15Q2xhc3NWYWx1ZVwiXG4gKlxuICogSXQgYWxzbyBpbmNsdWRlcyBjb2RlIHRoYXQgd2lsbCBhbGxvdyBzdHlsZSBiaW5kaW5nIGNvZGUgdG8gb3BlcmF0ZSB3aXRoaW4gaG9zdFxuICogYmluZGluZ3MgZm9yIGNvbXBvbmVudHMvZGlyZWN0aXZlcy5cbiAqXG4gKiBUaGVyZSBhcmUgbWFueSBkaWZmZXJlbnQgd2F5cyBpbiB3aGljaCB0aGVzZSBmdW5jdGlvbnMgYmVsb3cgYXJlIGNhbGxlZC4gUGxlYXNlIHNlZVxuICogYHJlbmRlcjMvaW50ZXJmYWNlcy9zdHlsaW5nLnRzYCB0byBnZXQgYSBiZXR0ZXIgaWRlYSBvZiBob3cgdGhlIHN0eWxpbmcgYWxnb3JpdGhtIHdvcmtzLlxuICovXG5cblxuXG4vKipcbiAqIENyZWF0ZXMgYSBuZXcgU3R5bGluZ0NvbnRleHQgYW4gZmlsbHMgaXQgd2l0aCB0aGUgcHJvdmlkZWQgc3RhdGljIHN0eWxpbmcgYXR0cmlidXRlIHZhbHVlcy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluaXRpYWxpemVTdGF0aWNDb250ZXh0KFxuICAgIGF0dHJzOiBUQXR0cmlidXRlcywgc3R5bGluZ1N0YXJ0SW5kZXg6IG51bWJlciwgZGlyZWN0aXZlUmVmPzogYW55IHwgbnVsbCk6IFN0eWxpbmdDb250ZXh0IHtcbiAgY29uc3QgY29udGV4dCA9IGNyZWF0ZUVtcHR5U3R5bGluZ0NvbnRleHQoKTtcbiAgcGF0Y2hDb250ZXh0V2l0aFN0YXRpY0F0dHJzKGNvbnRleHQsIGF0dHJzLCBzdHlsaW5nU3RhcnRJbmRleCwgZGlyZWN0aXZlUmVmKTtcbiAgcmV0dXJuIGNvbnRleHQ7XG59XG5cbi8qKlxuICogRGVzaWduZWQgdG8gdXBkYXRlIGFuIGV4aXN0aW5nIHN0eWxpbmcgY29udGV4dCB3aXRoIG5ldyBzdGF0aWMgc3R5bGluZ1xuICogZGF0YSAoY2xhc3NlcyBhbmQgc3R5bGVzKS5cbiAqXG4gKiBAcGFyYW0gY29udGV4dCB0aGUgZXhpc3Rpbmcgc3R5bGluZyBjb250ZXh0XG4gKiBAcGFyYW0gYXR0cnMgYW4gYXJyYXkgb2YgbmV3IHN0YXRpYyBzdHlsaW5nIGF0dHJpYnV0ZXMgdGhhdCB3aWxsIGJlXG4gKiAgICAgICAgICAgICAgYXNzaWduZWQgdG8gdGhlIGNvbnRleHRcbiAqIEBwYXJhbSBhdHRyc1N0eWxpbmdTdGFydEluZGV4IHdoYXQgaW5kZXggdG8gc3RhcnQgaXRlcmF0aW5nIHdpdGhpbiB0aGVcbiAqICAgICAgICAgICAgICBwcm92aWRlZCBgYXR0cnNgIGFycmF5IHRvIHN0YXJ0IHJlYWRpbmcgc3R5bGUgYW5kIGNsYXNzIHZhbHVlc1xuICogQHBhcmFtIGRpcmVjdGl2ZVJlZiB0aGUgZGlyZWN0aXZlIGluc3RhbmNlIHdpdGggd2hpY2ggc3RhdGljIGRhdGEgaXMgYXNzb2NpYXRlZCB3aXRoLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcGF0Y2hDb250ZXh0V2l0aFN0YXRpY0F0dHJzKFxuICAgIGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBhdHRyczogVEF0dHJpYnV0ZXMsIGF0dHJzU3R5bGluZ1N0YXJ0SW5kZXg6IG51bWJlcixcbiAgICBkaXJlY3RpdmVSZWY/OiBhbnkgfCBudWxsKTogdm9pZCB7XG4gIC8vIHRoaXMgbWVhbnMgdGhlIGNvbnRleHQgaGFzIGFscmVhZHkgYmVlbiBzZXQgYW5kIGluc3RhbnRpYXRlZFxuICBpZiAoY29udGV4dFtTdHlsaW5nSW5kZXguTWFzdGVyRmxhZ1Bvc2l0aW9uXSAmIFN0eWxpbmdGbGFncy5CaW5kaW5nQWxsb2NhdGlvbkxvY2tlZCkgcmV0dXJuO1xuXG4gIC8vIElmIHRoZSBzdHlsaW5nIGNvbnRleHQgaGFzIGFscmVhZHkgYmVlbiBwYXRjaGVkIHdpdGggdGhlIGdpdmVuIGRpcmVjdGl2ZSdzIGJpbmRpbmdzLFxuICAvLyB0aGVuIHRoZXJlIGlzIG5vIHBvaW50IGluIGRvaW5nIGl0IGFnYWluLiBUaGUgcmVhc29uIHdoeSB0aGlzIG1heSBoYXBwZW4gKHRoZSBkaXJlY3RpdmVcbiAgLy8gc3R5bGluZyBiZWluZyBwYXRjaGVkIHR3aWNlKSBpcyBiZWNhdXNlIHRoZSBgc3R5bGluZ0JpbmRpbmdgIGZ1bmN0aW9uIGlzIGNhbGxlZCBlYWNoIHRpbWVcbiAgLy8gYW4gZWxlbWVudCBpcyBjcmVhdGVkIChib3RoIHdpdGhpbiBhIHRlbXBsYXRlIGZ1bmN0aW9uIGFuZCB3aXRoaW4gZGlyZWN0aXZlIGhvc3QgYmluZGluZ3MpLlxuICBjb25zdCBkaXJlY3RpdmVzID0gY29udGV4dFtTdHlsaW5nSW5kZXguRGlyZWN0aXZlUmVnaXN0cnlQb3NpdGlvbl07XG4gIGxldCBkZXRlY3RlZEluZGV4ID0gZ2V0RGlyZWN0aXZlUmVnaXN0cnlWYWx1ZXNJbmRleE9mKGRpcmVjdGl2ZXMsIGRpcmVjdGl2ZVJlZiB8fCBudWxsKTtcbiAgaWYgKGRldGVjdGVkSW5kZXggPT09IC0xKSB7XG4gICAgLy8gdGhpcyBpcyBhIG5ldyBkaXJlY3RpdmUgd2hpY2ggd2UgaGF2ZSBub3Qgc2VlbiB5ZXQuXG4gICAgZGV0ZWN0ZWRJbmRleCA9IGFsbG9jYXRlRGlyZWN0aXZlSW50b0NvbnRleHQoY29udGV4dCwgZGlyZWN0aXZlUmVmKTtcbiAgfVxuICBjb25zdCBkaXJlY3RpdmVJbmRleCA9IGRldGVjdGVkSW5kZXggLyBEaXJlY3RpdmVSZWdpc3RyeVZhbHVlc0luZGV4LlNpemU7XG5cbiAgbGV0IGluaXRpYWxDbGFzc2VzOiBJbml0aWFsU3R5bGluZ1ZhbHVlc3xudWxsID0gbnVsbDtcbiAgbGV0IGluaXRpYWxTdHlsZXM6IEluaXRpYWxTdHlsaW5nVmFsdWVzfG51bGwgPSBudWxsO1xuICBsZXQgbW9kZSA9IC0xO1xuICBmb3IgKGxldCBpID0gYXR0cnNTdHlsaW5nU3RhcnRJbmRleDsgaSA8IGF0dHJzLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgYXR0ciA9IGF0dHJzW2ldO1xuICAgIGlmICh0eXBlb2YgYXR0ciA9PSAnbnVtYmVyJykge1xuICAgICAgbW9kZSA9IGF0dHI7XG4gICAgfSBlbHNlIGlmIChtb2RlID09IEF0dHJpYnV0ZU1hcmtlci5DbGFzc2VzKSB7XG4gICAgICBpbml0aWFsQ2xhc3NlcyA9IGluaXRpYWxDbGFzc2VzIHx8IGNvbnRleHRbU3R5bGluZ0luZGV4LkluaXRpYWxDbGFzc1ZhbHVlc1Bvc2l0aW9uXTtcbiAgICAgIHBhdGNoSW5pdGlhbFN0eWxpbmdWYWx1ZShpbml0aWFsQ2xhc3NlcywgYXR0ciwgdHJ1ZSwgZGlyZWN0aXZlSW5kZXgpO1xuICAgIH0gZWxzZSBpZiAobW9kZSA9PSBBdHRyaWJ1dGVNYXJrZXIuU3R5bGVzKSB7XG4gICAgICBpbml0aWFsU3R5bGVzID0gaW5pdGlhbFN0eWxlcyB8fCBjb250ZXh0W1N0eWxpbmdJbmRleC5Jbml0aWFsU3R5bGVWYWx1ZXNQb3NpdGlvbl07XG4gICAgICBwYXRjaEluaXRpYWxTdHlsaW5nVmFsdWUoaW5pdGlhbFN0eWxlcywgYXR0ciwgYXR0cnNbKytpXSwgZGlyZWN0aXZlSW5kZXgpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIERlc2lnbmVkIHRvIGFkZCBhIHN0eWxlIG9yIGNsYXNzIHZhbHVlIGludG8gdGhlIGV4aXN0aW5nIHNldCBvZiBpbml0aWFsIHN0eWxlcy5cbiAqXG4gKiBUaGUgZnVuY3Rpb24gd2lsbCBzZWFyY2ggYW5kIGZpZ3VyZSBvdXQgaWYgYSBzdHlsZS9jbGFzcyB2YWx1ZSBpcyBhbHJlYWR5IHByZXNlbnRcbiAqIHdpdGhpbiB0aGUgcHJvdmlkZWQgaW5pdGlhbCBzdHlsaW5nIGFycmF5LiBJZiBhbmQgd2hlbiBhIHN0eWxlL2NsYXNzIHZhbHVlIGlzXG4gKiBwcmVzZW50IChhbGxvY2F0ZWQpIHRoZW4gdGhlIGNvZGUgYmVsb3cgd2lsbCBzZXQgdGhlIG5ldyB2YWx1ZSBkZXBlbmRpbmcgb24gdGhlXG4gKiBmb2xsb3dpbmcgY2FzZXM6XG4gKlxuICogIDEpIGlmIHRoZSBleGlzdGluZyB2YWx1ZSBpcyBmYWxzeSAodGhpcyBoYXBwZW5zIGJlY2F1c2UgYSBgW2NsYXNzLnByb3BdYCBvclxuICogICAgIGBbc3R5bGUucHJvcF1gIGJpbmRpbmcgd2FzIHNldCwgYnV0IHRoZXJlIHdhc24ndCBhIG1hdGNoaW5nIHN0YXRpYyBzdHlsZVxuICogICAgIG9yIGNsYXNzIHByZXNlbnQgb24gdGhlIGNvbnRleHQpXG4gKiAgMikgaWYgdGhlIHZhbHVlIHdhcyBzZXQgYWxyZWFkeSBieSB0aGUgdGVtcGxhdGUsIGNvbXBvbmVudCBvciBkaXJlY3RpdmUsIGJ1dCB0aGVcbiAqICAgICBuZXcgdmFsdWUgaXMgc2V0IG9uIGEgaGlnaGVyIGxldmVsIChpLmUuIGEgc3ViIGNvbXBvbmVudCB3aGljaCBleHRlbmRzIGEgcGFyZW50XG4gKiAgICAgY29tcG9uZW50IHNldHMgaXRzIHZhbHVlIGFmdGVyIHRoZSBwYXJlbnQgaGFzIGFscmVhZHkgc2V0IHRoZSBzYW1lIG9uZSlcbiAqICAzKSBpZiB0aGUgc2FtZSBkaXJlY3RpdmUgcHJvdmlkZXMgYSBuZXcgc2V0IG9mIHN0eWxpbmcgdmFsdWVzIHRvIHNldFxuICpcbiAqIEBwYXJhbSBpbml0aWFsU3R5bGluZyB0aGUgaW5pdGlhbCBzdHlsaW5nIGFycmF5IHdoZXJlIHRoZSBuZXcgc3R5bGluZyBlbnRyeSB3aWxsIGJlIGFkZGVkIHRvXG4gKiBAcGFyYW0gcHJvcCB0aGUgcHJvcGVydHkgdmFsdWUgb2YgdGhlIG5ldyBlbnRyeSAoZS5nLiBgd2lkdGhgIChzdHlsZXMpIG9yIGBmb29gIChjbGFzc2VzKSlcbiAqIEBwYXJhbSB2YWx1ZSB0aGUgc3R5bGluZyB2YWx1ZSBvZiB0aGUgbmV3IGVudHJ5IChlLmcuIGBhYnNvbHV0ZWAgKHN0eWxlcykgb3IgYHRydWVgIChjbGFzc2VzKSlcbiAqIEBwYXJhbSBkaXJlY3RpdmVPd25lckluZGV4IHRoZSBkaXJlY3RpdmUgb3duZXIgaW5kZXggdmFsdWUgb2YgdGhlIHN0eWxpbmcgc291cmNlIHJlc3BvbnNpYmxlXG4gKiAgICAgICAgZm9yIHRoZXNlIHN0eWxlcyAoc2VlIGBpbnRlcmZhY2VzL3N0eWxpbmcudHMjZGlyZWN0aXZlc2AgZm9yIG1vcmUgaW5mbylcbiAqL1xuZnVuY3Rpb24gcGF0Y2hJbml0aWFsU3R5bGluZ1ZhbHVlKFxuICAgIGluaXRpYWxTdHlsaW5nOiBJbml0aWFsU3R5bGluZ1ZhbHVlcywgcHJvcDogc3RyaW5nLCB2YWx1ZTogYW55LFxuICAgIGRpcmVjdGl2ZU93bmVySW5kZXg6IG51bWJlcik6IHZvaWQge1xuICBmb3IgKGxldCBpID0gSW5pdGlhbFN0eWxpbmdWYWx1ZXNJbmRleC5LZXlWYWx1ZVN0YXJ0UG9zaXRpb247IGkgPCBpbml0aWFsU3R5bGluZy5sZW5ndGg7XG4gICAgICAgaSArPSBJbml0aWFsU3R5bGluZ1ZhbHVlc0luZGV4LlNpemUpIHtcbiAgICBjb25zdCBrZXkgPSBpbml0aWFsU3R5bGluZ1tpICsgSW5pdGlhbFN0eWxpbmdWYWx1ZXNJbmRleC5Qcm9wT2Zmc2V0XTtcbiAgICBpZiAoa2V5ID09PSBwcm9wKSB7XG4gICAgICBjb25zdCBleGlzdGluZ1ZhbHVlID1cbiAgICAgICAgICBpbml0aWFsU3R5bGluZ1tpICsgSW5pdGlhbFN0eWxpbmdWYWx1ZXNJbmRleC5WYWx1ZU9mZnNldF0gYXMgc3RyaW5nIHwgbnVsbCB8IGJvb2xlYW47XG4gICAgICBjb25zdCBleGlzdGluZ093bmVyID1cbiAgICAgICAgICBpbml0aWFsU3R5bGluZ1tpICsgSW5pdGlhbFN0eWxpbmdWYWx1ZXNJbmRleC5EaXJlY3RpdmVPd25lck9mZnNldF0gYXMgbnVtYmVyO1xuICAgICAgaWYgKGFsbG93VmFsdWVDaGFuZ2UoZXhpc3RpbmdWYWx1ZSwgdmFsdWUsIGV4aXN0aW5nT3duZXIsIGRpcmVjdGl2ZU93bmVySW5kZXgpKSB7XG4gICAgICAgIGFkZE9yVXBkYXRlU3RhdGljU3R5bGUoaSwgaW5pdGlhbFN0eWxpbmcsIHByb3AsIHZhbHVlLCBkaXJlY3RpdmVPd25lckluZGV4KTtcbiAgICAgIH1cbiAgICAgIHJldHVybjtcbiAgICB9XG4gIH1cblxuICAvLyBXZSBkaWQgbm90IGZpbmQgZXhpc3Rpbmcga2V5LCBhZGQgYSBuZXcgb25lLlxuICBhZGRPclVwZGF0ZVN0YXRpY1N0eWxlKG51bGwsIGluaXRpYWxTdHlsaW5nLCBwcm9wLCB2YWx1ZSwgZGlyZWN0aXZlT3duZXJJbmRleCk7XG59XG5cbi8qKlxuICogUnVucyB0aHJvdWdoIHRoZSBpbml0aWFsIHN0eWxlIGRhdGEgcHJlc2VudCBpbiB0aGUgY29udGV4dCBhbmQgcmVuZGVyc1xuICogdGhlbSB2aWEgdGhlIHJlbmRlcmVyIG9uIHRoZSBlbGVtZW50LlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVuZGVySW5pdGlhbFN0eWxlcyhcbiAgICBlbGVtZW50OiBSRWxlbWVudCwgY29udGV4dDogU3R5bGluZ0NvbnRleHQsIHJlbmRlcmVyOiBSZW5kZXJlcjMpIHtcbiAgY29uc3QgaW5pdGlhbFN0eWxlcyA9IGNvbnRleHRbU3R5bGluZ0luZGV4LkluaXRpYWxTdHlsZVZhbHVlc1Bvc2l0aW9uXTtcbiAgcmVuZGVySW5pdGlhbFN0eWxpbmdWYWx1ZXMoZWxlbWVudCwgcmVuZGVyZXIsIGluaXRpYWxTdHlsZXMsIGZhbHNlKTtcbn1cblxuLyoqXG4gKiBSdW5zIHRocm91Z2ggdGhlIGluaXRpYWwgY2xhc3MgZGF0YSBwcmVzZW50IGluIHRoZSBjb250ZXh0IGFuZCByZW5kZXJzXG4gKiB0aGVtIHZpYSB0aGUgcmVuZGVyZXIgb24gdGhlIGVsZW1lbnQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZW5kZXJJbml0aWFsQ2xhc3NlcyhcbiAgICBlbGVtZW50OiBSRWxlbWVudCwgY29udGV4dDogU3R5bGluZ0NvbnRleHQsIHJlbmRlcmVyOiBSZW5kZXJlcjMpIHtcbiAgY29uc3QgaW5pdGlhbENsYXNzZXMgPSBjb250ZXh0W1N0eWxpbmdJbmRleC5Jbml0aWFsQ2xhc3NWYWx1ZXNQb3NpdGlvbl07XG4gIHJlbmRlckluaXRpYWxTdHlsaW5nVmFsdWVzKGVsZW1lbnQsIHJlbmRlcmVyLCBpbml0aWFsQ2xhc3NlcywgdHJ1ZSk7XG59XG5cbi8qKlxuICogVGhpcyBpcyBhIGhlbHBlciBmdW5jdGlvbiBkZXNpZ25lZCB0byByZW5kZXIgZWFjaCBlbnRyeSBwcmVzZW50IHdpdGhpbiB0aGVcbiAqIHByb3ZpZGVkIGxpc3Qgb2YgaW5pdGlhbFN0eWxpbmdWYWx1ZXMuXG4gKi9cbmZ1bmN0aW9uIHJlbmRlckluaXRpYWxTdHlsaW5nVmFsdWVzKFxuICAgIGVsZW1lbnQ6IFJFbGVtZW50LCByZW5kZXJlcjogUmVuZGVyZXIzLCBpbml0aWFsU3R5bGluZ1ZhbHVlczogSW5pdGlhbFN0eWxpbmdWYWx1ZXMsXG4gICAgaXNFbnRyeUNsYXNzQmFzZWQ6IGJvb2xlYW4pIHtcbiAgZm9yIChsZXQgaSA9IEluaXRpYWxTdHlsaW5nVmFsdWVzSW5kZXguS2V5VmFsdWVTdGFydFBvc2l0aW9uOyBpIDwgaW5pdGlhbFN0eWxpbmdWYWx1ZXMubGVuZ3RoO1xuICAgICAgIGkgKz0gSW5pdGlhbFN0eWxpbmdWYWx1ZXNJbmRleC5TaXplKSB7XG4gICAgY29uc3QgdmFsdWUgPSBpbml0aWFsU3R5bGluZ1ZhbHVlc1tpICsgSW5pdGlhbFN0eWxpbmdWYWx1ZXNJbmRleC5WYWx1ZU9mZnNldF07XG4gICAgaWYgKHZhbHVlKSB7XG4gICAgICBpZiAoaXNFbnRyeUNsYXNzQmFzZWQpIHtcbiAgICAgICAgc2V0Q2xhc3MoXG4gICAgICAgICAgICBlbGVtZW50LCBpbml0aWFsU3R5bGluZ1ZhbHVlc1tpICsgSW5pdGlhbFN0eWxpbmdWYWx1ZXNJbmRleC5Qcm9wT2Zmc2V0XSBhcyBzdHJpbmcsIHRydWUsXG4gICAgICAgICAgICByZW5kZXJlciwgbnVsbCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzZXRTdHlsZShcbiAgICAgICAgICAgIGVsZW1lbnQsIGluaXRpYWxTdHlsaW5nVmFsdWVzW2kgKyBJbml0aWFsU3R5bGluZ1ZhbHVlc0luZGV4LlByb3BPZmZzZXRdIGFzIHN0cmluZyxcbiAgICAgICAgICAgIHZhbHVlIGFzIHN0cmluZywgcmVuZGVyZXIsIG51bGwpO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gYWxsb3dOZXdCaW5kaW5nc0ZvclN0eWxpbmdDb250ZXh0KGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0KTogYm9vbGVhbiB7XG4gIHJldHVybiAoY29udGV4dFtTdHlsaW5nSW5kZXguTWFzdGVyRmxhZ1Bvc2l0aW9uXSAmIFN0eWxpbmdGbGFncy5CaW5kaW5nQWxsb2NhdGlvbkxvY2tlZCkgPT09IDA7XG59XG5cbi8qKlxuICogQWRkcyBpbiBuZXcgYmluZGluZyB2YWx1ZXMgdG8gYSBzdHlsaW5nIGNvbnRleHQuXG4gKlxuICogSWYgYSBkaXJlY3RpdmUgdmFsdWUgaXMgcHJvdmlkZWQgdGhlbiBhbGwgcHJvdmlkZWQgY2xhc3Mvc3R5bGUgYmluZGluZyBuYW1lcyB3aWxsXG4gKiByZWZlcmVuY2UgdGhlIHByb3ZpZGVkIGRpcmVjdGl2ZS5cbiAqXG4gKiBAcGFyYW0gY29udGV4dCB0aGUgZXhpc3Rpbmcgc3R5bGluZyBjb250ZXh0XG4gKiBAcGFyYW0gZGlyZWN0aXZlUmVmIHRoZSBkaXJlY3RpdmUgdGhhdCB0aGUgbmV3IGJpbmRpbmdzIHdpbGwgcmVmZXJlbmNlXG4gKiBAcGFyYW0gY2xhc3NCaW5kaW5nTmFtZXMgYW4gYXJyYXkgb2YgY2xhc3MgYmluZGluZyBuYW1lcyB0aGF0IHdpbGwgYmUgYWRkZWQgdG8gdGhlIGNvbnRleHRcbiAqIEBwYXJhbSBzdHlsZUJpbmRpbmdOYW1lcyBhbiBhcnJheSBvZiBzdHlsZSBiaW5kaW5nIG5hbWVzIHRoYXQgd2lsbCBiZSBhZGRlZCB0byB0aGUgY29udGV4dFxuICogQHBhcmFtIHN0eWxlU2FuaXRpemVyIGFuIG9wdGlvbmFsIHNhbml0aXplciB0aGF0IGhhbmRsZSBhbGwgc2FuaXRpemF0aW9uIG9uIGZvciBlYWNoIG9mXG4gKiAgICB0aGUgYmluZGluZ3MgYWRkZWQgdG8gdGhlIGNvbnRleHQuIE5vdGUgdGhhdCBpZiBhIGRpcmVjdGl2ZSBpcyBwcm92aWRlZCB0aGVuIHRoZSBzYW5pdGl6ZXJcbiAqICAgIGluc3RhbmNlIHdpbGwgb25seSBiZSBhY3RpdmUgaWYgYW5kIHdoZW4gdGhlIGRpcmVjdGl2ZSB1cGRhdGVzIHRoZSBiaW5kaW5ncyB0aGF0IGl0IG93bnMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB1cGRhdGVDb250ZXh0V2l0aEJpbmRpbmdzKFxuICAgIGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBkaXJlY3RpdmVSZWY6IGFueSB8IG51bGwsIGNsYXNzQmluZGluZ05hbWVzPzogc3RyaW5nW10gfCBudWxsLFxuICAgIHN0eWxlQmluZGluZ05hbWVzPzogc3RyaW5nW10gfCBudWxsLCBzdHlsZVNhbml0aXplcj86IFN0eWxlU2FuaXRpemVGbiB8IG51bGwpIHtcbiAgaWYgKGNvbnRleHRbU3R5bGluZ0luZGV4Lk1hc3RlckZsYWdQb3NpdGlvbl0gJiBTdHlsaW5nRmxhZ3MuQmluZGluZ0FsbG9jYXRpb25Mb2NrZWQpIHJldHVybjtcblxuICAvLyB0aGlzIG1lYW5zIHRoZSBjb250ZXh0IGhhcyBhbHJlYWR5IGJlZW4gcGF0Y2hlZCB3aXRoIHRoZSBkaXJlY3RpdmUncyBiaW5kaW5nc1xuICBjb25zdCBkaXJlY3RpdmVJbmRleCA9IGZpbmRPclBhdGNoRGlyZWN0aXZlSW50b1JlZ2lzdHJ5KGNvbnRleHQsIGRpcmVjdGl2ZVJlZiwgc3R5bGVTYW5pdGl6ZXIpO1xuICBpZiAoZGlyZWN0aXZlSW5kZXggPT09IC0xKSB7XG4gICAgLy8gdGhpcyBtZWFucyB0aGUgZGlyZWN0aXZlIGhhcyBhbHJlYWR5IGJlZW4gcGF0Y2hlZCBpbiAuLi4gTm8gcG9pbnQgaW4gZG9pbmcgYW55dGhpbmdcbiAgICByZXR1cm47XG4gIH1cblxuICBpZiAoc3R5bGVCaW5kaW5nTmFtZXMpIHtcbiAgICBzdHlsZUJpbmRpbmdOYW1lcyA9IGh5cGhlbmF0ZUVudHJpZXMoc3R5bGVCaW5kaW5nTmFtZXMpO1xuICB9XG5cbiAgLy8gdGhlcmUgYXJlIGFsb3Qgb2YgdmFyaWFibGVzIGJlaW5nIHVzZWQgYmVsb3cgdG8gdHJhY2sgd2hlcmUgaW4gdGhlIGNvbnRleHQgdGhlIG5ld1xuICAvLyBiaW5kaW5nIHZhbHVlcyB3aWxsIGJlIHBsYWNlZC4gQmVjYXVzZSB0aGUgY29udGV4dCBjb25zaXN0cyBvZiBtdWx0aXBsZSB0eXBlcyBvZlxuICAvLyBlbnRyaWVzIChzaW5nbGUgY2xhc3Nlcy9zdHlsZXMgYW5kIG11bHRpIGNsYXNzZXMvc3R5bGVzKSBhbG90IG9mIHRoZSBpbmRleCBwb3NpdGlvbnNcbiAgLy8gbmVlZCB0byBiZSBjb21wdXRlZCBhaGVhZCBvZiB0aW1lIGFuZCB0aGUgY29udGV4dCBuZWVkcyB0byBiZSBleHRlbmRlZCBiZWZvcmUgdGhlIHZhbHVlc1xuICAvLyBhcmUgaW5zZXJ0ZWQgaW4uXG4gIGNvbnN0IHNpbmdsZVByb3BPZmZzZXRWYWx1ZXMgPSBjb250ZXh0W1N0eWxpbmdJbmRleC5TaW5nbGVQcm9wT2Zmc2V0UG9zaXRpb25zXTtcbiAgY29uc3QgdG90YWxDdXJyZW50Q2xhc3NCaW5kaW5ncyA9XG4gICAgICBzaW5nbGVQcm9wT2Zmc2V0VmFsdWVzW1NpbmdsZVByb3BPZmZzZXRWYWx1ZXNJbmRleC5DbGFzc2VzQ291bnRQb3NpdGlvbl07XG4gIGNvbnN0IHRvdGFsQ3VycmVudFN0eWxlQmluZGluZ3MgPVxuICAgICAgc2luZ2xlUHJvcE9mZnNldFZhbHVlc1tTaW5nbGVQcm9wT2Zmc2V0VmFsdWVzSW5kZXguU3R5bGVzQ291bnRQb3NpdGlvbl07XG5cbiAgY29uc3QgY2FjaGVkQ2xhc3NNYXBWYWx1ZXMgPSBjb250ZXh0W1N0eWxpbmdJbmRleC5DYWNoZWRNdWx0aUNsYXNzZXNdO1xuICBjb25zdCBjYWNoZWRTdHlsZU1hcFZhbHVlcyA9IGNvbnRleHRbU3R5bGluZ0luZGV4LkNhY2hlZE11bHRpU3R5bGVzXTtcblxuICBjb25zdCBjbGFzc2VzT2Zmc2V0ID0gdG90YWxDdXJyZW50Q2xhc3NCaW5kaW5ncyAqIFN0eWxpbmdJbmRleC5TaXplO1xuICBjb25zdCBzdHlsZXNPZmZzZXQgPSB0b3RhbEN1cnJlbnRTdHlsZUJpbmRpbmdzICogU3R5bGluZ0luZGV4LlNpemU7XG5cbiAgY29uc3Qgc2luZ2xlU3R5bGVzU3RhcnRJbmRleCA9IFN0eWxpbmdJbmRleC5TaW5nbGVTdHlsZXNTdGFydFBvc2l0aW9uO1xuICBsZXQgc2luZ2xlQ2xhc3Nlc1N0YXJ0SW5kZXggPSBzaW5nbGVTdHlsZXNTdGFydEluZGV4ICsgc3R5bGVzT2Zmc2V0O1xuICBsZXQgbXVsdGlTdHlsZXNTdGFydEluZGV4ID0gc2luZ2xlQ2xhc3Nlc1N0YXJ0SW5kZXggKyBjbGFzc2VzT2Zmc2V0O1xuICBsZXQgbXVsdGlDbGFzc2VzU3RhcnRJbmRleCA9IG11bHRpU3R5bGVzU3RhcnRJbmRleCArIHN0eWxlc09mZnNldDtcblxuICAvLyBiZWNhdXNlIHdlJ3JlIGluc2VydGluZyBtb3JlIGJpbmRpbmdzIGludG8gdGhlIGNvbnRleHQsIHRoaXMgbWVhbnMgdGhhdCB0aGVcbiAgLy8gYmluZGluZyB2YWx1ZXMgbmVlZCB0byBiZSByZWZlcmVuY2VkIHRoZSBzaW5nbGVQcm9wT2Zmc2V0VmFsdWVzIGFycmF5IHNvIHRoYXRcbiAgLy8gdGhlIHRlbXBsYXRlL2RpcmVjdGl2ZSBjYW4gZWFzaWx5IGZpbmQgdGhlbSBpbnNpZGUgb2YgdGhlIGBlbGVtZW50U3R5bGVQcm9wYFxuICAvLyBhbmQgdGhlIGBlbGVtZW50Q2xhc3NQcm9wYCBmdW5jdGlvbnMgd2l0aG91dCBpdGVyYXRpbmcgdGhyb3VnaCB0aGUgZW50aXJlIGNvbnRleHQuXG4gIC8vIFRoZSBmaXJzdCBzdGVwIHRvIHNldHRpbmcgdXAgdGhlc2UgcmVmZXJlbmNlIHBvaW50cyBpcyB0byBtYXJrIGhvdyBtYW55IGJpbmRpbmdzXG4gIC8vIGFyZSBiZWluZyBhZGRlZC4gRXZlbiBpZiB0aGVzZSBiaW5kaW5ncyBhbHJlYWR5IGV4aXN0IGluIHRoZSBjb250ZXh0LCB0aGUgZGlyZWN0aXZlXG4gIC8vIG9yIHRlbXBsYXRlIGNvZGUgd2lsbCBzdGlsbCBjYWxsIHRoZW0gdW5rbm93aW5nbHkuIFRoZXJlZm9yZSB0aGUgdG90YWwgdmFsdWVzIG5lZWRcbiAgLy8gdG8gYmUgcmVnaXN0ZXJlZCBzbyB0aGF0IHdlIGtub3cgaG93IG1hbnkgYmluZGluZ3MgYXJlIGFzc2lnbmVkIHRvIGVhY2ggZGlyZWN0aXZlLlxuICBjb25zdCBjdXJyZW50U2luZ2xlUHJvcHNMZW5ndGggPSBzaW5nbGVQcm9wT2Zmc2V0VmFsdWVzLmxlbmd0aDtcbiAgc2luZ2xlUHJvcE9mZnNldFZhbHVlcy5wdXNoKFxuICAgICAgc3R5bGVCaW5kaW5nTmFtZXMgPyBzdHlsZUJpbmRpbmdOYW1lcy5sZW5ndGggOiAwLFxuICAgICAgY2xhc3NCaW5kaW5nTmFtZXMgPyBjbGFzc0JpbmRpbmdOYW1lcy5sZW5ndGggOiAwKTtcblxuICAvLyB0aGUgY29kZSBiZWxvdyB3aWxsIGNoZWNrIHRvIHNlZSBpZiBhIG5ldyBzdHlsZSBiaW5kaW5nIGFscmVhZHkgZXhpc3RzIGluIHRoZSBjb250ZXh0XG4gIC8vIGlmIHNvIHRoZW4gdGhlcmUgaXMgbm8gcG9pbnQgaW4gaW5zZXJ0aW5nIGl0IGludG8gdGhlIGNvbnRleHQgYWdhaW4uIFdoZXRoZXIgb3Igbm90IGl0XG4gIC8vIGV4aXN0cyB0aGUgc3R5bGluZyBvZmZzZXQgY29kZSB3aWxsIG5vdyBrbm93IGV4YWN0bHkgd2hlcmUgaXQgaXNcbiAgbGV0IGluc2VydGlvbk9mZnNldCA9IDA7XG4gIGNvbnN0IGZpbHRlcmVkU3R5bGVCaW5kaW5nTmFtZXM6IHN0cmluZ1tdID0gW107XG4gIGlmIChzdHlsZUJpbmRpbmdOYW1lcyAmJiBzdHlsZUJpbmRpbmdOYW1lcy5sZW5ndGgpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHN0eWxlQmluZGluZ05hbWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBuYW1lID0gc3R5bGVCaW5kaW5nTmFtZXNbaV07XG4gICAgICBsZXQgc2luZ2xlUHJvcEluZGV4ID1cbiAgICAgICAgICBnZXRNYXRjaGluZ0JpbmRpbmdJbmRleChjb250ZXh0LCBuYW1lLCBzaW5nbGVTdHlsZXNTdGFydEluZGV4LCBzaW5nbGVDbGFzc2VzU3RhcnRJbmRleCk7XG4gICAgICBpZiAoc2luZ2xlUHJvcEluZGV4ID09IC0xKSB7XG4gICAgICAgIHNpbmdsZVByb3BJbmRleCA9IHNpbmdsZUNsYXNzZXNTdGFydEluZGV4ICsgaW5zZXJ0aW9uT2Zmc2V0O1xuICAgICAgICBpbnNlcnRpb25PZmZzZXQgKz0gU3R5bGluZ0luZGV4LlNpemU7XG4gICAgICAgIGZpbHRlcmVkU3R5bGVCaW5kaW5nTmFtZXMucHVzaChuYW1lKTtcbiAgICAgIH1cbiAgICAgIHNpbmdsZVByb3BPZmZzZXRWYWx1ZXMucHVzaChzaW5nbGVQcm9wSW5kZXgpO1xuICAgIH1cbiAgfVxuXG4gIC8vIGp1c3QgbGlrZSB3aXRoIHRoZSBzdHlsZSBiaW5kaW5nIGxvb3AgYWJvdmUsIHRoZSBuZXcgY2xhc3MgYmluZGluZ3MgZ2V0IHRoZSBzYW1lIHRyZWF0bWVudC4uLlxuICBjb25zdCBmaWx0ZXJlZENsYXNzQmluZGluZ05hbWVzOiBzdHJpbmdbXSA9IFtdO1xuICBpZiAoY2xhc3NCaW5kaW5nTmFtZXMgJiYgY2xhc3NCaW5kaW5nTmFtZXMubGVuZ3RoKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjbGFzc0JpbmRpbmdOYW1lcy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgbmFtZSA9IGNsYXNzQmluZGluZ05hbWVzW2ldO1xuICAgICAgbGV0IHNpbmdsZVByb3BJbmRleCA9XG4gICAgICAgICAgZ2V0TWF0Y2hpbmdCaW5kaW5nSW5kZXgoY29udGV4dCwgbmFtZSwgc2luZ2xlQ2xhc3Nlc1N0YXJ0SW5kZXgsIG11bHRpU3R5bGVzU3RhcnRJbmRleCk7XG4gICAgICBpZiAoc2luZ2xlUHJvcEluZGV4ID09IC0xKSB7XG4gICAgICAgIHNpbmdsZVByb3BJbmRleCA9IG11bHRpU3R5bGVzU3RhcnRJbmRleCArIGluc2VydGlvbk9mZnNldDtcbiAgICAgICAgaW5zZXJ0aW9uT2Zmc2V0ICs9IFN0eWxpbmdJbmRleC5TaXplO1xuICAgICAgICBmaWx0ZXJlZENsYXNzQmluZGluZ05hbWVzLnB1c2gobmFtZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzaW5nbGVQcm9wSW5kZXggKz0gZmlsdGVyZWRTdHlsZUJpbmRpbmdOYW1lcy5sZW5ndGggKiBTdHlsaW5nSW5kZXguU2l6ZTtcbiAgICAgIH1cbiAgICAgIHNpbmdsZVByb3BPZmZzZXRWYWx1ZXMucHVzaChzaW5nbGVQcm9wSW5kZXgpO1xuICAgIH1cbiAgfVxuXG4gIC8vIGJlY2F1c2UgbmV3IHN0eWxlcyBhcmUgYmVpbmcgaW5zZXJ0ZWQsIHRoaXMgbWVhbnMgdGhlIGV4aXN0aW5nIGNvbGxlY3Rpb24gb2Ygc3R5bGUgb2Zmc2V0XG4gIC8vIGluZGV4IHZhbHVlcyBhcmUgaW5jb3JyZWN0ICh0aGV5IHBvaW50IHRvIHRoZSB3cm9uZyB2YWx1ZXMpLiBUaGUgY29kZSBiZWxvdyB3aWxsIHJ1biB0aHJvdWdoXG4gIC8vIHRoZSBlbnRpcmUgb2Zmc2V0IGFycmF5IGFuZCB1cGRhdGUgdGhlIGV4aXN0aW5nIHNldCBvZiBpbmRleCB2YWx1ZXMgdG8gcG9pbnQgdG8gdGhlaXIgbmV3XG4gIC8vIGxvY2F0aW9ucyB3aGlsZSB0YWtpbmcgdGhlIG5ldyBiaW5kaW5nIHZhbHVlcyBpbnRvIGNvbnNpZGVyYXRpb24uXG4gIGxldCBpID0gU2luZ2xlUHJvcE9mZnNldFZhbHVlc0luZGV4LlZhbHVlU3RhcnRQb3NpdGlvbjtcbiAgaWYgKGZpbHRlcmVkU3R5bGVCaW5kaW5nTmFtZXMubGVuZ3RoKSB7XG4gICAgd2hpbGUgKGkgPCBjdXJyZW50U2luZ2xlUHJvcHNMZW5ndGgpIHtcbiAgICAgIGNvbnN0IHRvdGFsU3R5bGVzID1cbiAgICAgICAgICBzaW5nbGVQcm9wT2Zmc2V0VmFsdWVzW2kgKyBTaW5nbGVQcm9wT2Zmc2V0VmFsdWVzSW5kZXguU3R5bGVzQ291bnRQb3NpdGlvbl07XG4gICAgICBjb25zdCB0b3RhbENsYXNzZXMgPVxuICAgICAgICAgIHNpbmdsZVByb3BPZmZzZXRWYWx1ZXNbaSArIFNpbmdsZVByb3BPZmZzZXRWYWx1ZXNJbmRleC5DbGFzc2VzQ291bnRQb3NpdGlvbl07XG4gICAgICBpZiAodG90YWxDbGFzc2VzKSB7XG4gICAgICAgIGNvbnN0IHN0YXJ0ID0gaSArIFNpbmdsZVByb3BPZmZzZXRWYWx1ZXNJbmRleC5WYWx1ZVN0YXJ0UG9zaXRpb24gKyB0b3RhbFN0eWxlcztcbiAgICAgICAgZm9yIChsZXQgaiA9IHN0YXJ0OyBqIDwgc3RhcnQgKyB0b3RhbENsYXNzZXM7IGorKykge1xuICAgICAgICAgIHNpbmdsZVByb3BPZmZzZXRWYWx1ZXNbal0gKz0gZmlsdGVyZWRTdHlsZUJpbmRpbmdOYW1lcy5sZW5ndGggKiBTdHlsaW5nSW5kZXguU2l6ZTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBjb25zdCB0b3RhbCA9IHRvdGFsU3R5bGVzICsgdG90YWxDbGFzc2VzO1xuICAgICAgaSArPSBTaW5nbGVQcm9wT2Zmc2V0VmFsdWVzSW5kZXguVmFsdWVTdGFydFBvc2l0aW9uICsgdG90YWw7XG4gICAgfVxuICB9XG5cbiAgY29uc3QgdG90YWxOZXdFbnRyaWVzID0gZmlsdGVyZWRDbGFzc0JpbmRpbmdOYW1lcy5sZW5ndGggKyBmaWx0ZXJlZFN0eWxlQmluZGluZ05hbWVzLmxlbmd0aDtcblxuICAvLyBpbiB0aGUgZXZlbnQgdGhhdCB0aGVyZSBhcmUgbmV3IHN0eWxlIHZhbHVlcyBiZWluZyBpbnNlcnRlZCwgYWxsIGV4aXN0aW5nIGNsYXNzIGFuZCBzdHlsZVxuICAvLyBiaW5kaW5ncyBuZWVkIHRvIGhhdmUgdGhlaXIgcG9pbnRlciB2YWx1ZXMgb2Zmc2V0dGVkIHdpdGggdGhlIG5ldyBhbW91bnQgb2Ygc3BhY2UgdGhhdCBpc1xuICAvLyB1c2VkIGZvciB0aGUgbmV3IHN0eWxlL2NsYXNzIGJpbmRpbmdzLlxuICBmb3IgKGxldCBpID0gc2luZ2xlU3R5bGVzU3RhcnRJbmRleDsgaSA8IGNvbnRleHQubGVuZ3RoOyBpICs9IFN0eWxpbmdJbmRleC5TaXplKSB7XG4gICAgY29uc3QgaXNNdWx0aUJhc2VkID0gaSA+PSBtdWx0aVN0eWxlc1N0YXJ0SW5kZXg7XG4gICAgY29uc3QgaXNDbGFzc0Jhc2VkID0gaSA+PSAoaXNNdWx0aUJhc2VkID8gbXVsdGlDbGFzc2VzU3RhcnRJbmRleCA6IHNpbmdsZUNsYXNzZXNTdGFydEluZGV4KTtcbiAgICBjb25zdCBmbGFnID0gZ2V0UG9pbnRlcnMoY29udGV4dCwgaSk7XG4gICAgY29uc3Qgc3RhdGljSW5kZXggPSBnZXRJbml0aWFsSW5kZXgoZmxhZyk7XG4gICAgbGV0IHNpbmdsZU9yTXVsdGlJbmRleCA9IGdldE11bHRpT3JTaW5nbGVJbmRleChmbGFnKTtcbiAgICBpZiAoaXNNdWx0aUJhc2VkKSB7XG4gICAgICBzaW5nbGVPck11bHRpSW5kZXggKz1cbiAgICAgICAgICBpc0NsYXNzQmFzZWQgPyAoZmlsdGVyZWRTdHlsZUJpbmRpbmdOYW1lcy5sZW5ndGggKiBTdHlsaW5nSW5kZXguU2l6ZSkgOiAwO1xuICAgIH0gZWxzZSB7XG4gICAgICBzaW5nbGVPck11bHRpSW5kZXggKz0gKHRvdGFsTmV3RW50cmllcyAqIFN0eWxpbmdJbmRleC5TaXplKSArXG4gICAgICAgICAgKChpc0NsYXNzQmFzZWQgPyBmaWx0ZXJlZFN0eWxlQmluZGluZ05hbWVzLmxlbmd0aCA6IDApICogU3R5bGluZ0luZGV4LlNpemUpO1xuICAgIH1cbiAgICBzZXRGbGFnKGNvbnRleHQsIGksIHBvaW50ZXJzKGZsYWcsIHN0YXRpY0luZGV4LCBzaW5nbGVPck11bHRpSW5kZXgpKTtcbiAgfVxuXG4gIC8vIHRoaXMgaXMgd2hlcmUgd2UgbWFrZSBzcGFjZSBpbiB0aGUgY29udGV4dCBmb3IgdGhlIG5ldyBzdHlsZSBiaW5kaW5nc1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGZpbHRlcmVkU3R5bGVCaW5kaW5nTmFtZXMubGVuZ3RoICogU3R5bGluZ0luZGV4LlNpemU7IGkrKykge1xuICAgIGNvbnRleHQuc3BsaWNlKG11bHRpQ2xhc3Nlc1N0YXJ0SW5kZXgsIDAsIG51bGwpO1xuICAgIGNvbnRleHQuc3BsaWNlKHNpbmdsZUNsYXNzZXNTdGFydEluZGV4LCAwLCBudWxsKTtcbiAgICBzaW5nbGVDbGFzc2VzU3RhcnRJbmRleCsrO1xuICAgIG11bHRpU3R5bGVzU3RhcnRJbmRleCsrO1xuICAgIG11bHRpQ2xhc3Nlc1N0YXJ0SW5kZXggKz0gMjsgIC8vIGJvdGggc2luZ2xlICsgbXVsdGkgc2xvdHMgd2VyZSBpbnNlcnRlZFxuICB9XG5cbiAgLy8gdGhpcyBpcyB3aGVyZSB3ZSBtYWtlIHNwYWNlIGluIHRoZSBjb250ZXh0IGZvciB0aGUgbmV3IGNsYXNzIGJpbmRpbmdzXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgZmlsdGVyZWRDbGFzc0JpbmRpbmdOYW1lcy5sZW5ndGggKiBTdHlsaW5nSW5kZXguU2l6ZTsgaSsrKSB7XG4gICAgY29udGV4dC5zcGxpY2UobXVsdGlTdHlsZXNTdGFydEluZGV4LCAwLCBudWxsKTtcbiAgICBjb250ZXh0LnB1c2gobnVsbCk7XG4gICAgbXVsdGlTdHlsZXNTdGFydEluZGV4Kys7XG4gICAgbXVsdGlDbGFzc2VzU3RhcnRJbmRleCsrO1xuICB9XG5cbiAgY29uc3QgaW5pdGlhbENsYXNzZXMgPSBjb250ZXh0W1N0eWxpbmdJbmRleC5Jbml0aWFsQ2xhc3NWYWx1ZXNQb3NpdGlvbl07XG4gIGNvbnN0IGluaXRpYWxTdHlsZXMgPSBjb250ZXh0W1N0eWxpbmdJbmRleC5Jbml0aWFsU3R5bGVWYWx1ZXNQb3NpdGlvbl07XG5cbiAgLy8gdGhlIGNvZGUgYmVsb3cgd2lsbCBpbnNlcnQgZWFjaCBuZXcgZW50cnkgaW50byB0aGUgY29udGV4dCBhbmQgYXNzaWduIHRoZSBhcHByb3ByaWF0ZVxuICAvLyBmbGFncyBhbmQgaW5kZXggdmFsdWVzIHRvIHRoZW0uIEl0J3MgaW1wb3J0YW50IHRoaXMgcnVucyBhdCB0aGUgZW5kIG9mIHRoaXMgZnVuY3Rpb25cbiAgLy8gYmVjYXVzZSB0aGUgY29udGV4dCwgcHJvcGVydHkgb2Zmc2V0IGFuZCBpbmRleCB2YWx1ZXMgaGF2ZSBhbGwgYmVlbiBjb21wdXRlZCBqdXN0IGJlZm9yZS5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCB0b3RhbE5ld0VudHJpZXM7IGkrKykge1xuICAgIGNvbnN0IGVudHJ5SXNDbGFzc0Jhc2VkID0gaSA+PSBmaWx0ZXJlZFN0eWxlQmluZGluZ05hbWVzLmxlbmd0aDtcbiAgICBjb25zdCBhZGp1c3RlZEluZGV4ID0gZW50cnlJc0NsYXNzQmFzZWQgPyAoaSAtIGZpbHRlcmVkU3R5bGVCaW5kaW5nTmFtZXMubGVuZ3RoKSA6IGk7XG4gICAgY29uc3QgcHJvcE5hbWUgPSBlbnRyeUlzQ2xhc3NCYXNlZCA/IGZpbHRlcmVkQ2xhc3NCaW5kaW5nTmFtZXNbYWRqdXN0ZWRJbmRleF0gOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaWx0ZXJlZFN0eWxlQmluZGluZ05hbWVzW2FkanVzdGVkSW5kZXhdO1xuXG4gICAgbGV0IG11bHRpSW5kZXgsIHNpbmdsZUluZGV4O1xuICAgIGlmIChlbnRyeUlzQ2xhc3NCYXNlZCkge1xuICAgICAgbXVsdGlJbmRleCA9IG11bHRpQ2xhc3Nlc1N0YXJ0SW5kZXggK1xuICAgICAgICAgICgodG90YWxDdXJyZW50Q2xhc3NCaW5kaW5ncyArIGFkanVzdGVkSW5kZXgpICogU3R5bGluZ0luZGV4LlNpemUpO1xuICAgICAgc2luZ2xlSW5kZXggPSBzaW5nbGVDbGFzc2VzU3RhcnRJbmRleCArXG4gICAgICAgICAgKCh0b3RhbEN1cnJlbnRDbGFzc0JpbmRpbmdzICsgYWRqdXN0ZWRJbmRleCkgKiBTdHlsaW5nSW5kZXguU2l6ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG11bHRpSW5kZXggPVxuICAgICAgICAgIG11bHRpU3R5bGVzU3RhcnRJbmRleCArICgodG90YWxDdXJyZW50U3R5bGVCaW5kaW5ncyArIGFkanVzdGVkSW5kZXgpICogU3R5bGluZ0luZGV4LlNpemUpO1xuICAgICAgc2luZ2xlSW5kZXggPSBzaW5nbGVTdHlsZXNTdGFydEluZGV4ICtcbiAgICAgICAgICAoKHRvdGFsQ3VycmVudFN0eWxlQmluZGluZ3MgKyBhZGp1c3RlZEluZGV4KSAqIFN0eWxpbmdJbmRleC5TaXplKTtcbiAgICB9XG5cbiAgICAvLyBpZiBhIHByb3BlcnR5IGlzIG5vdCBmb3VuZCBpbiB0aGUgaW5pdGlhbCBzdHlsZSB2YWx1ZXMgbGlzdCB0aGVuIGl0XG4gICAgLy8gaXMgQUxXQVlTIGFkZGVkIGluY2FzZSBhIGZvbGxvdy11cCBkaXJlY3RpdmUgaW50cm9kdWNlcyB0aGUgc2FtZSBpbml0aWFsXG4gICAgLy8gc3R5bGUvY2xhc3MgdmFsdWUgbGF0ZXIgb24uXG4gICAgbGV0IGluaXRpYWxWYWx1ZXNUb0xvb2t1cCA9IGVudHJ5SXNDbGFzc0Jhc2VkID8gaW5pdGlhbENsYXNzZXMgOiBpbml0aWFsU3R5bGVzO1xuICAgIGxldCBpbmRleEZvckluaXRpYWwgPSBnZXRJbml0aWFsU3R5bGluZ1ZhbHVlc0luZGV4T2YoaW5pdGlhbFZhbHVlc1RvTG9va3VwLCBwcm9wTmFtZSk7XG4gICAgaWYgKGluZGV4Rm9ySW5pdGlhbCA9PT0gLTEpIHtcbiAgICAgIGluZGV4Rm9ySW5pdGlhbCA9IGFkZE9yVXBkYXRlU3RhdGljU3R5bGUoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbnVsbCwgaW5pdGlhbFZhbHVlc1RvTG9va3VwLCBwcm9wTmFtZSwgZW50cnlJc0NsYXNzQmFzZWQgPyBmYWxzZSA6IG51bGwsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGlyZWN0aXZlSW5kZXgpICtcbiAgICAgICAgICBJbml0aWFsU3R5bGluZ1ZhbHVlc0luZGV4LlZhbHVlT2Zmc2V0O1xuICAgIH0gZWxzZSB7XG4gICAgICBpbmRleEZvckluaXRpYWwgKz0gSW5pdGlhbFN0eWxpbmdWYWx1ZXNJbmRleC5WYWx1ZU9mZnNldDtcbiAgICB9XG5cbiAgICBjb25zdCBpbml0aWFsRmxhZyA9XG4gICAgICAgIHByZXBhcmVJbml0aWFsRmxhZyhjb250ZXh0LCBwcm9wTmFtZSwgZW50cnlJc0NsYXNzQmFzZWQsIHN0eWxlU2FuaXRpemVyIHx8IG51bGwpO1xuXG4gICAgc2V0RmxhZyhjb250ZXh0LCBzaW5nbGVJbmRleCwgcG9pbnRlcnMoaW5pdGlhbEZsYWcsIGluZGV4Rm9ySW5pdGlhbCwgbXVsdGlJbmRleCkpO1xuICAgIHNldFByb3AoY29udGV4dCwgc2luZ2xlSW5kZXgsIHByb3BOYW1lKTtcbiAgICBzZXRWYWx1ZShjb250ZXh0LCBzaW5nbGVJbmRleCwgbnVsbCk7XG4gICAgc2V0UGxheWVyQnVpbGRlckluZGV4KGNvbnRleHQsIHNpbmdsZUluZGV4LCAwLCBkaXJlY3RpdmVJbmRleCk7XG5cbiAgICBzZXRGbGFnKGNvbnRleHQsIG11bHRpSW5kZXgsIHBvaW50ZXJzKGluaXRpYWxGbGFnLCBpbmRleEZvckluaXRpYWwsIHNpbmdsZUluZGV4KSk7XG4gICAgc2V0UHJvcChjb250ZXh0LCBtdWx0aUluZGV4LCBwcm9wTmFtZSk7XG4gICAgc2V0VmFsdWUoY29udGV4dCwgbXVsdGlJbmRleCwgbnVsbCk7XG4gICAgc2V0UGxheWVyQnVpbGRlckluZGV4KGNvbnRleHQsIG11bHRpSW5kZXgsIDAsIGRpcmVjdGl2ZUluZGV4KTtcbiAgfVxuXG4gIC8vIHRoZSB0b3RhbCBjbGFzc2VzL3N0eWxlIHZhbHVlcyBhcmUgdXBkYXRlZCBzbyB0aGUgbmV4dCB0aW1lIHRoZSBjb250ZXh0IGlzIHBhdGNoZWRcbiAgLy8gYWRkaXRpb25hbCBzdHlsZS9jbGFzcyBiaW5kaW5ncyBmcm9tIGFub3RoZXIgZGlyZWN0aXZlIHRoZW4gaXQga25vd3MgZXhhY3RseSB3aGVyZVxuICAvLyB0byBpbnNlcnQgdGhlbSBpbiB0aGUgY29udGV4dFxuICBzaW5nbGVQcm9wT2Zmc2V0VmFsdWVzW1NpbmdsZVByb3BPZmZzZXRWYWx1ZXNJbmRleC5DbGFzc2VzQ291bnRQb3NpdGlvbl0gPVxuICAgICAgdG90YWxDdXJyZW50Q2xhc3NCaW5kaW5ncyArIGZpbHRlcmVkQ2xhc3NCaW5kaW5nTmFtZXMubGVuZ3RoO1xuICBzaW5nbGVQcm9wT2Zmc2V0VmFsdWVzW1NpbmdsZVByb3BPZmZzZXRWYWx1ZXNJbmRleC5TdHlsZXNDb3VudFBvc2l0aW9uXSA9XG4gICAgICB0b3RhbEN1cnJlbnRTdHlsZUJpbmRpbmdzICsgZmlsdGVyZWRTdHlsZUJpbmRpbmdOYW1lcy5sZW5ndGg7XG5cbiAgLy8gdGhlIG1hcC1iYXNlZCB2YWx1ZXMgYWxzbyBuZWVkIHRvIGtub3cgaG93IG1hbnkgZW50cmllcyBnb3QgaW5zZXJ0ZWRcbiAgY2FjaGVkQ2xhc3NNYXBWYWx1ZXNbTWFwQmFzZWRPZmZzZXRWYWx1ZXNJbmRleC5FbnRyaWVzQ291bnRQb3NpdGlvbl0gKz1cbiAgICAgIGZpbHRlcmVkQ2xhc3NCaW5kaW5nTmFtZXMubGVuZ3RoO1xuICBjYWNoZWRTdHlsZU1hcFZhbHVlc1tNYXBCYXNlZE9mZnNldFZhbHVlc0luZGV4LkVudHJpZXNDb3VudFBvc2l0aW9uXSArPVxuICAgICAgZmlsdGVyZWRTdHlsZUJpbmRpbmdOYW1lcy5sZW5ndGg7XG4gIGNvbnN0IG5ld1N0eWxlc1NwYWNlQWxsb2NhdGlvblNpemUgPSBmaWx0ZXJlZFN0eWxlQmluZGluZ05hbWVzLmxlbmd0aCAqIFN0eWxpbmdJbmRleC5TaXplO1xuICBjb25zdCBuZXdDbGFzc2VzU3BhY2VBbGxvY2F0aW9uU2l6ZSA9IGZpbHRlcmVkQ2xhc3NCaW5kaW5nTmFtZXMubGVuZ3RoICogU3R5bGluZ0luZGV4LlNpemU7XG5cbiAgLy8gdXBkYXRlIHRoZSBtdWx0aSBzdHlsZXMgY2FjaGUgd2l0aCBhIHJlZmVyZW5jZSBmb3IgdGhlIGRpcmVjdGl2ZSB0aGF0IHdhcyBqdXN0IGluc2VydGVkXG4gIGNvbnN0IGRpcmVjdGl2ZU11bHRpU3R5bGVzU3RhcnRJbmRleCA9XG4gICAgICBtdWx0aVN0eWxlc1N0YXJ0SW5kZXggKyB0b3RhbEN1cnJlbnRTdHlsZUJpbmRpbmdzICogU3R5bGluZ0luZGV4LlNpemU7XG4gIGNvbnN0IGNhY2hlZFN0eWxlTWFwSW5kZXggPSBjYWNoZWRTdHlsZU1hcFZhbHVlcy5sZW5ndGg7XG4gIHJlZ2lzdGVyTXVsdGlNYXBFbnRyeShcbiAgICAgIGNvbnRleHQsIGRpcmVjdGl2ZUluZGV4LCBmYWxzZSwgZGlyZWN0aXZlTXVsdGlTdHlsZXNTdGFydEluZGV4LFxuICAgICAgZmlsdGVyZWRTdHlsZUJpbmRpbmdOYW1lcy5sZW5ndGgpO1xuXG4gIGZvciAobGV0IGkgPSBNYXBCYXNlZE9mZnNldFZhbHVlc0luZGV4LlZhbHVlc1N0YXJ0UG9zaXRpb247IGkgPCBjYWNoZWRTdHlsZU1hcEluZGV4O1xuICAgICAgIGkgKz0gTWFwQmFzZWRPZmZzZXRWYWx1ZXNJbmRleC5TaXplKSB7XG4gICAgLy8gbXVsdGkgdmFsdWVzIHN0YXJ0IGFmdGVyIGFsbCB0aGUgc2luZ2xlIHZhbHVlcyAod2hpY2ggaXMgYWxzbyB3aGVyZSBjbGFzc2VzIGFyZSkgaW4gdGhlXG4gICAgLy8gY29udGV4dCB0aGVyZWZvcmUgdGhlIG5ldyBjbGFzcyBhbGxvY2F0aW9uIHNpemUgc2hvdWxkIGJlIHRha2VuIGludG8gYWNjb3VudFxuICAgIGNhY2hlZFN0eWxlTWFwVmFsdWVzW2kgKyBNYXBCYXNlZE9mZnNldFZhbHVlc0luZGV4LlBvc2l0aW9uU3RhcnRPZmZzZXRdICs9XG4gICAgICAgIG5ld0NsYXNzZXNTcGFjZUFsbG9jYXRpb25TaXplICsgbmV3U3R5bGVzU3BhY2VBbGxvY2F0aW9uU2l6ZTtcbiAgfVxuXG4gIC8vIHVwZGF0ZSB0aGUgbXVsdGkgY2xhc3NlcyBjYWNoZSB3aXRoIGEgcmVmZXJlbmNlIGZvciB0aGUgZGlyZWN0aXZlIHRoYXQgd2FzIGp1c3QgaW5zZXJ0ZWRcbiAgY29uc3QgZGlyZWN0aXZlTXVsdGlDbGFzc2VzU3RhcnRJbmRleCA9XG4gICAgICBtdWx0aUNsYXNzZXNTdGFydEluZGV4ICsgdG90YWxDdXJyZW50Q2xhc3NCaW5kaW5ncyAqIFN0eWxpbmdJbmRleC5TaXplO1xuICBjb25zdCBjYWNoZWRDbGFzc01hcEluZGV4ID0gY2FjaGVkQ2xhc3NNYXBWYWx1ZXMubGVuZ3RoO1xuICByZWdpc3Rlck11bHRpTWFwRW50cnkoXG4gICAgICBjb250ZXh0LCBkaXJlY3RpdmVJbmRleCwgdHJ1ZSwgZGlyZWN0aXZlTXVsdGlDbGFzc2VzU3RhcnRJbmRleCxcbiAgICAgIGZpbHRlcmVkQ2xhc3NCaW5kaW5nTmFtZXMubGVuZ3RoKTtcblxuICBmb3IgKGxldCBpID0gTWFwQmFzZWRPZmZzZXRWYWx1ZXNJbmRleC5WYWx1ZXNTdGFydFBvc2l0aW9uOyBpIDwgY2FjaGVkQ2xhc3NNYXBJbmRleDtcbiAgICAgICBpICs9IE1hcEJhc2VkT2Zmc2V0VmFsdWVzSW5kZXguU2l6ZSkge1xuICAgIC8vIHRoZSByZWFzb24gd2h5IGJvdGggdGhlIHN0eWxlcyArIGNsYXNzZXMgc3BhY2UgaXMgYWxsb2NhdGVkIHRvIHRoZSBleGlzdGluZyBvZmZzZXRzIGlzXG4gICAgLy8gYmVjYXVzZSB0aGUgc3R5bGVzIHNob3cgdXAgYmVmb3JlIHRoZSBjbGFzc2VzIGluIHRoZSBjb250ZXh0IGFuZCBhbnkgbmV3IGluc2VydGVkXG4gICAgLy8gc3R5bGVzIHdpbGwgb2Zmc2V0IGFueSBleGlzdGluZyBjbGFzcyBlbnRyaWVzIGluIHRoZSBjb250ZXh0IChldmVuIGlmIHRoZXJlIGFyZSBub1xuICAgIC8vIG5ldyBjbGFzcyBlbnRyaWVzIGFkZGVkKSBhbHNvIHRoZSByZWFzb24gd2h5IGl0J3MgKjIgaXMgYmVjYXVzZSBib3RoIHNpbmdsZSArIG11bHRpXG4gICAgLy8gZW50cmllcyBmb3IgZWFjaCBuZXcgc3R5bGUgaGF2ZSBiZWVuIGFkZGVkIGluIHRoZSBjb250ZXh0IGJlZm9yZSB0aGUgbXVsdGkgY2xhc3MgdmFsdWVzXG4gICAgLy8gYWN0dWFsbHkgc3RhcnRcbiAgICBjYWNoZWRDbGFzc01hcFZhbHVlc1tpICsgTWFwQmFzZWRPZmZzZXRWYWx1ZXNJbmRleC5Qb3NpdGlvblN0YXJ0T2Zmc2V0XSArPVxuICAgICAgICAobmV3U3R5bGVzU3BhY2VBbGxvY2F0aW9uU2l6ZSAqIDIpICsgbmV3Q2xhc3Nlc1NwYWNlQWxsb2NhdGlvblNpemU7XG4gIH1cblxuICAvLyB0aGVyZSBpcyBubyBpbml0aWFsIHZhbHVlIGZsYWcgZm9yIHRoZSBtYXN0ZXIgaW5kZXggc2luY2UgaXQgZG9lc24ndFxuICAvLyByZWZlcmVuY2UgYW4gaW5pdGlhbCBzdHlsZSB2YWx1ZVxuICBjb25zdCBtYXN0ZXJGbGFnID0gcG9pbnRlcnMoMCwgMCwgbXVsdGlTdHlsZXNTdGFydEluZGV4KTtcbiAgc2V0RmxhZyhjb250ZXh0LCBTdHlsaW5nSW5kZXguTWFzdGVyRmxhZ1Bvc2l0aW9uLCBtYXN0ZXJGbGFnKTtcbn1cblxuLyoqXG4gKiBTZWFyY2hlcyB0aHJvdWdoIHRoZSBleGlzdGluZyByZWdpc3RyeSBvZiBkaXJlY3RpdmVzXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBmaW5kT3JQYXRjaERpcmVjdGl2ZUludG9SZWdpc3RyeShcbiAgICBjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgZGlyZWN0aXZlUmVmOiBhbnksIHN0eWxlU2FuaXRpemVyPzogU3R5bGVTYW5pdGl6ZUZuIHwgbnVsbCkge1xuICBjb25zdCBkaXJlY3RpdmVSZWZzID0gY29udGV4dFtTdHlsaW5nSW5kZXguRGlyZWN0aXZlUmVnaXN0cnlQb3NpdGlvbl07XG4gIGNvbnN0IG5leHRPZmZzZXRJbnNlcnRpb25JbmRleCA9IGNvbnRleHRbU3R5bGluZ0luZGV4LlNpbmdsZVByb3BPZmZzZXRQb3NpdGlvbnNdLmxlbmd0aDtcblxuICBsZXQgZGlyZWN0aXZlSW5kZXg6IG51bWJlcjtcbiAgbGV0IGRldGVjdGVkSW5kZXggPSBnZXREaXJlY3RpdmVSZWdpc3RyeVZhbHVlc0luZGV4T2YoZGlyZWN0aXZlUmVmcywgZGlyZWN0aXZlUmVmKTtcblxuICBpZiAoZGV0ZWN0ZWRJbmRleCA9PT0gLTEpIHtcbiAgICBkZXRlY3RlZEluZGV4ID0gZGlyZWN0aXZlUmVmcy5sZW5ndGg7XG4gICAgZGlyZWN0aXZlSW5kZXggPSBkaXJlY3RpdmVSZWZzLmxlbmd0aCAvIERpcmVjdGl2ZVJlZ2lzdHJ5VmFsdWVzSW5kZXguU2l6ZTtcblxuICAgIGFsbG9jYXRlRGlyZWN0aXZlSW50b0NvbnRleHQoY29udGV4dCwgZGlyZWN0aXZlUmVmKTtcbiAgICBkaXJlY3RpdmVSZWZzW2RldGVjdGVkSW5kZXggKyBEaXJlY3RpdmVSZWdpc3RyeVZhbHVlc0luZGV4LlNpbmdsZVByb3BWYWx1ZXNJbmRleE9mZnNldF0gPVxuICAgICAgICBuZXh0T2Zmc2V0SW5zZXJ0aW9uSW5kZXg7XG4gICAgZGlyZWN0aXZlUmVmc1tkZXRlY3RlZEluZGV4ICsgRGlyZWN0aXZlUmVnaXN0cnlWYWx1ZXNJbmRleC5TdHlsZVNhbml0aXplck9mZnNldF0gPVxuICAgICAgICBzdHlsZVNhbml0aXplciB8fCBudWxsO1xuICB9IGVsc2Uge1xuICAgIGNvbnN0IHNpbmdsZVByb3BTdGFydFBvc2l0aW9uID1cbiAgICAgICAgZGV0ZWN0ZWRJbmRleCArIERpcmVjdGl2ZVJlZ2lzdHJ5VmFsdWVzSW5kZXguU2luZ2xlUHJvcFZhbHVlc0luZGV4T2Zmc2V0O1xuICAgIGlmIChkaXJlY3RpdmVSZWZzW3NpbmdsZVByb3BTdGFydFBvc2l0aW9uXSAhID49IDApIHtcbiAgICAgIC8vIHRoZSBkaXJlY3RpdmUgaGFzIGFscmVhZHkgYmVlbiBwYXRjaGVkIGludG8gdGhlIGNvbnRleHRcbiAgICAgIHJldHVybiAtMTtcbiAgICB9XG5cbiAgICBkaXJlY3RpdmVJbmRleCA9IGRldGVjdGVkSW5kZXggLyBEaXJlY3RpdmVSZWdpc3RyeVZhbHVlc0luZGV4LlNpemU7XG5cbiAgICAvLyBiZWNhdXNlIHRoZSBkaXJlY3RpdmUgYWxyZWFkeSBleGlzdGVkIHRoaXMgbWVhbnMgdGhhdCBpdCB3YXMgc2V0IGR1cmluZyBlbGVtZW50SG9zdEF0dHJzIG9yXG4gICAgLy8gZWxlbWVudFN0YXJ0IHdoaWNoIG1lYW5zIHRoYXQgdGhlIGJpbmRpbmcgdmFsdWVzIHdlcmUgbm90IGhlcmUuIFRoZXJlZm9yZSwgdGhlIHZhbHVlcyBiZWxvd1xuICAgIC8vIG5lZWQgdG8gYmUgYXBwbGllZCBzbyB0aGF0IHNpbmdsZSBjbGFzcyBhbmQgc3R5bGUgcHJvcGVydGllcyBjYW4gYmUgYXNzaWduZWQgbGF0ZXIuXG4gICAgY29uc3Qgc2luZ2xlUHJvcFBvc2l0aW9uSW5kZXggPVxuICAgICAgICBkZXRlY3RlZEluZGV4ICsgRGlyZWN0aXZlUmVnaXN0cnlWYWx1ZXNJbmRleC5TaW5nbGVQcm9wVmFsdWVzSW5kZXhPZmZzZXQ7XG4gICAgZGlyZWN0aXZlUmVmc1tzaW5nbGVQcm9wUG9zaXRpb25JbmRleF0gPSBuZXh0T2Zmc2V0SW5zZXJ0aW9uSW5kZXg7XG5cbiAgICAvLyB0aGUgc2FuaXRpemVyIGlzIGFsc28gYXBhcnQgb2YgdGhlIGJpbmRpbmcgcHJvY2VzcyBhbmQgd2lsbCBiZSB1c2VkIHdoZW4gYmluZGluZ3MgYXJlXG4gICAgLy8gYXBwbGllZC5cbiAgICBjb25zdCBzdHlsZVNhbml0aXplckluZGV4ID0gZGV0ZWN0ZWRJbmRleCArIERpcmVjdGl2ZVJlZ2lzdHJ5VmFsdWVzSW5kZXguU3R5bGVTYW5pdGl6ZXJPZmZzZXQ7XG4gICAgZGlyZWN0aXZlUmVmc1tzdHlsZVNhbml0aXplckluZGV4XSA9IHN0eWxlU2FuaXRpemVyIHx8IG51bGw7XG4gIH1cblxuICByZXR1cm4gZGlyZWN0aXZlSW5kZXg7XG59XG5cbmZ1bmN0aW9uIGdldE1hdGNoaW5nQmluZGluZ0luZGV4KFxuICAgIGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBiaW5kaW5nTmFtZTogc3RyaW5nLCBzdGFydDogbnVtYmVyLCBlbmQ6IG51bWJlcikge1xuICBmb3IgKGxldCBqID0gc3RhcnQ7IGogPCBlbmQ7IGogKz0gU3R5bGluZ0luZGV4LlNpemUpIHtcbiAgICBpZiAoZ2V0UHJvcChjb250ZXh0LCBqKSA9PT0gYmluZGluZ05hbWUpIHJldHVybiBqO1xuICB9XG4gIHJldHVybiAtMTtcbn1cblxuLyoqXG4gKiBSZWdpc3RlcnMgdGhlIHByb3ZpZGVkIG11bHRpIHN0eWxpbmcgKGBbc3R5bGVdYCBhbmQgYFtjbGFzc11gKSB2YWx1ZXMgdG8gdGhlIGNvbnRleHQuXG4gKlxuICogVGhpcyBmdW5jdGlvbiB3aWxsIGl0ZXJhdGUgb3ZlciB0aGUgcHJvdmlkZWQgYGNsYXNzZXNJbnB1dGAgYW5kIGBzdHlsZXNJbnB1dGAgbWFwXG4gKiB2YWx1ZXMgYW5kIGluc2VydC91cGRhdGUgb3IgcmVtb3ZlIHRoZW0gZnJvbSB0aGUgY29udGV4dCBhdCBleGFjdGx5IHRoZSByaWdodFxuICogc3BvdC5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIGFsc28gdGFrZXMgaW4gYSBkaXJlY3RpdmUgd2hpY2ggaW1wbGllcyB0aGF0IHRoZSBzdHlsaW5nIHZhbHVlcyB3aWxsXG4gKiBiZSBldmFsdWF0ZWQgZm9yIHRoYXQgZGlyZWN0aXZlIHdpdGggcmVzcGVjdCB0byBhbnkgb3RoZXIgc3R5bGluZyB0aGF0IGFscmVhZHkgZXhpc3RzXG4gKiBvbiB0aGUgY29udGV4dC4gV2hlbiB0aGVyZSBhcmUgc3R5bGVzIHRoYXQgY29uZmxpY3QgKGUuZy4gc2F5IGBuZ1N0eWxlYCBhbmQgYFtzdHlsZV1gXG4gKiBib3RoIHVwZGF0ZSB0aGUgYHdpZHRoYCBwcm9wZXJ0eSBhdCB0aGUgc2FtZSB0aW1lKSB0aGVuIHRoZSBzdHlsaW5nIGFsZ29yaXRobSBjb2RlIGJlbG93XG4gKiB3aWxsIGRlY2lkZSB3aGljaCBvbmUgd2lucyBiYXNlZCBvbiB0aGUgZGlyZWN0aXZlIHN0eWxpbmcgcHJpb3JpdGl6YXRpb24gbWVjaGFuaXNtLiBUaGlzXG4gKiBtZWNoYW5pc20gaXMgYmV0dGVyIGV4cGxhaW5lZCBpbiByZW5kZXIzL2ludGVyZmFjZXMvc3R5bGluZy50cyNkaXJlY3RpdmVzKS5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIHdpbGwgbm90IHJlbmRlciBhbnkgc3R5bGluZyB2YWx1ZXMgb24gc2NyZWVuLCBidXQgaXMgcmF0aGVyIGRlc2lnbmVkIHRvXG4gKiBwcmVwYXJlIHRoZSBjb250ZXh0IGZvciB0aGF0LiBgcmVuZGVyU3R5bGluZ2AgbXVzdCBiZSBjYWxsZWQgYWZ0ZXJ3YXJkcyB0byByZW5kZXIgYW55XG4gKiBzdHlsaW5nIGRhdGEgdGhhdCB3YXMgc2V0IGluIHRoaXMgZnVuY3Rpb24gKG5vdGUgdGhhdCBgdXBkYXRlQ2xhc3NQcm9wYCBhbmRcbiAqIGB1cGRhdGVTdHlsZVByb3BgIGFyZSBkZXNpZ25lZCB0byBiZSBydW4gYWZ0ZXIgdGhpcyBmdW5jdGlvbiBpcyBydW4pLlxuICpcbiAqIEBwYXJhbSBjb250ZXh0IFRoZSBzdHlsaW5nIGNvbnRleHQgdGhhdCB3aWxsIGJlIHVwZGF0ZWQgd2l0aCB0aGVcbiAqICAgIG5ld2x5IHByb3ZpZGVkIHN0eWxlIHZhbHVlcy5cbiAqIEBwYXJhbSBjbGFzc2VzSW5wdXQgVGhlIGtleS92YWx1ZSBtYXAgb2YgQ1NTIGNsYXNzIG5hbWVzIHRoYXQgd2lsbCBiZSB1c2VkIGZvciB0aGUgdXBkYXRlLlxuICogQHBhcmFtIHN0eWxlc0lucHV0IFRoZSBrZXkvdmFsdWUgbWFwIG9mIENTUyBzdHlsZXMgdGhhdCB3aWxsIGJlIHVzZWQgZm9yIHRoZSB1cGRhdGUuXG4gKiBAcGFyYW0gZGlyZWN0aXZlUmVmIGFuIG9wdGlvbmFsIHJlZmVyZW5jZSB0byB0aGUgZGlyZWN0aXZlIHJlc3BvbnNpYmxlXG4gKiAgICBmb3IgdGhpcyBiaW5kaW5nIGNoYW5nZS4gSWYgcHJlc2VudCB0aGVuIHN0eWxlIGJpbmRpbmcgd2lsbCBvbmx5XG4gKiAgICBhY3R1YWxpemUgaWYgdGhlIGRpcmVjdGl2ZSBoYXMgb3duZXJzaGlwIG92ZXIgdGhpcyBiaW5kaW5nXG4gKiAgICAoc2VlIHN0eWxpbmcudHMjZGlyZWN0aXZlcyBmb3IgbW9yZSBpbmZvcm1hdGlvbiBhYm91dCB0aGUgYWxnb3JpdGhtKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHVwZGF0ZVN0eWxpbmdNYXAoXG4gICAgY29udGV4dDogU3R5bGluZ0NvbnRleHQsIGNsYXNzZXNJbnB1dDoge1trZXk6IHN0cmluZ106IGFueX0gfCBzdHJpbmcgfFxuICAgICAgICBCb3VuZFBsYXllckZhY3Rvcnk8bnVsbHxzdHJpbmd8e1trZXk6IHN0cmluZ106IGFueX0+fCBudWxsLFxuICAgIHN0eWxlc0lucHV0Pzoge1trZXk6IHN0cmluZ106IGFueX0gfCBCb3VuZFBsYXllckZhY3Rvcnk8bnVsbHx7W2tleTogc3RyaW5nXTogYW55fT58IG51bGwsXG4gICAgZGlyZWN0aXZlUmVmPzogYW55KTogdm9pZCB7XG4gIGNvbnN0IGRpcmVjdGl2ZUluZGV4ID0gZ2V0RGlyZWN0aXZlSW5kZXhGcm9tUmVnaXN0cnkoY29udGV4dCwgZGlyZWN0aXZlUmVmIHx8IG51bGwpO1xuXG4gIGNsYXNzZXNJbnB1dCA9IGNsYXNzZXNJbnB1dCB8fCBudWxsO1xuICBzdHlsZXNJbnB1dCA9IHN0eWxlc0lucHV0IHx8IG51bGw7XG4gIGNvbnN0IGlnbm9yZUFsbENsYXNzVXBkYXRlcyA9IGlzTXVsdGlWYWx1ZUNhY2hlSGl0KGNvbnRleHQsIHRydWUsIGRpcmVjdGl2ZUluZGV4LCBjbGFzc2VzSW5wdXQpO1xuICBjb25zdCBpZ25vcmVBbGxTdHlsZVVwZGF0ZXMgPSBpc011bHRpVmFsdWVDYWNoZUhpdChjb250ZXh0LCBmYWxzZSwgZGlyZWN0aXZlSW5kZXgsIHN0eWxlc0lucHV0KTtcblxuICAvLyBlYXJseSBleGl0ICh0aGlzIGlzIHdoYXQncyBkb25lIHRvIGF2b2lkIHVzaW5nIGN0eC5iaW5kKCkgdG8gY2FjaGUgdGhlIHZhbHVlKVxuICBpZiAoaWdub3JlQWxsQ2xhc3NVcGRhdGVzICYmIGlnbm9yZUFsbFN0eWxlVXBkYXRlcykgcmV0dXJuO1xuXG4gIGNsYXNzZXNJbnB1dCA9XG4gICAgICBjbGFzc2VzSW5wdXQgPT09IE5PX0NIQU5HRSA/IHJlYWRDYWNoZWRNYXBWYWx1ZShjb250ZXh0LCB0cnVlLCBkaXJlY3RpdmVJbmRleCkgOiBjbGFzc2VzSW5wdXQ7XG4gIHN0eWxlc0lucHV0ID1cbiAgICAgIHN0eWxlc0lucHV0ID09PSBOT19DSEFOR0UgPyByZWFkQ2FjaGVkTWFwVmFsdWUoY29udGV4dCwgZmFsc2UsIGRpcmVjdGl2ZUluZGV4KSA6IHN0eWxlc0lucHV0O1xuXG4gIGNvbnN0IGVsZW1lbnQgPSBjb250ZXh0W1N0eWxpbmdJbmRleC5FbGVtZW50UG9zaXRpb25dICFhcyBIVE1MRWxlbWVudDtcbiAgY29uc3QgY2xhc3Nlc1BsYXllckJ1aWxkZXIgPSBjbGFzc2VzSW5wdXQgaW5zdGFuY2VvZiBCb3VuZFBsYXllckZhY3RvcnkgP1xuICAgICAgbmV3IENsYXNzQW5kU3R5bGVQbGF5ZXJCdWlsZGVyKGNsYXNzZXNJbnB1dCBhcyBhbnksIGVsZW1lbnQsIEJpbmRpbmdUeXBlLkNsYXNzKSA6XG4gICAgICBudWxsO1xuICBjb25zdCBzdHlsZXNQbGF5ZXJCdWlsZGVyID0gc3R5bGVzSW5wdXQgaW5zdGFuY2VvZiBCb3VuZFBsYXllckZhY3RvcnkgP1xuICAgICAgbmV3IENsYXNzQW5kU3R5bGVQbGF5ZXJCdWlsZGVyKHN0eWxlc0lucHV0IGFzIGFueSwgZWxlbWVudCwgQmluZGluZ1R5cGUuU3R5bGUpIDpcbiAgICAgIG51bGw7XG5cbiAgY29uc3QgY2xhc3Nlc1ZhbHVlID0gY2xhc3Nlc1BsYXllckJ1aWxkZXIgP1xuICAgICAgKGNsYXNzZXNJbnB1dCBhcyBCb3VuZFBsYXllckZhY3Rvcnk8e1trZXk6IHN0cmluZ106IGFueX18c3RyaW5nPikgIS52YWx1ZSA6XG4gICAgICBjbGFzc2VzSW5wdXQ7XG4gIGNvbnN0IHN0eWxlc1ZhbHVlID0gc3R5bGVzUGxheWVyQnVpbGRlciA/IHN0eWxlc0lucHV0ICFbJ3ZhbHVlJ10gOiBzdHlsZXNJbnB1dDtcblxuICBsZXQgY2xhc3NOYW1lczogc3RyaW5nW10gPSBFTVBUWV9BUlJBWTtcbiAgbGV0IGFwcGx5QWxsQ2xhc3NlcyA9IGZhbHNlO1xuICBsZXQgcGxheWVyQnVpbGRlcnNBcmVEaXJ0eSA9IGZhbHNlO1xuXG4gIGNvbnN0IGNsYXNzZXNQbGF5ZXJCdWlsZGVySW5kZXggPVxuICAgICAgY2xhc3Nlc1BsYXllckJ1aWxkZXIgPyBQbGF5ZXJJbmRleC5DbGFzc01hcFBsYXllckJ1aWxkZXJQb3NpdGlvbiA6IDA7XG4gIGlmIChoYXNQbGF5ZXJCdWlsZGVyQ2hhbmdlZChcbiAgICAgICAgICBjb250ZXh0LCBjbGFzc2VzUGxheWVyQnVpbGRlciwgUGxheWVySW5kZXguQ2xhc3NNYXBQbGF5ZXJCdWlsZGVyUG9zaXRpb24pKSB7XG4gICAgc2V0UGxheWVyQnVpbGRlcihjb250ZXh0LCBjbGFzc2VzUGxheWVyQnVpbGRlciwgUGxheWVySW5kZXguQ2xhc3NNYXBQbGF5ZXJCdWlsZGVyUG9zaXRpb24pO1xuICAgIHBsYXllckJ1aWxkZXJzQXJlRGlydHkgPSB0cnVlO1xuICB9XG5cbiAgY29uc3Qgc3R5bGVzUGxheWVyQnVpbGRlckluZGV4ID1cbiAgICAgIHN0eWxlc1BsYXllckJ1aWxkZXIgPyBQbGF5ZXJJbmRleC5TdHlsZU1hcFBsYXllckJ1aWxkZXJQb3NpdGlvbiA6IDA7XG4gIGlmIChoYXNQbGF5ZXJCdWlsZGVyQ2hhbmdlZChcbiAgICAgICAgICBjb250ZXh0LCBzdHlsZXNQbGF5ZXJCdWlsZGVyLCBQbGF5ZXJJbmRleC5TdHlsZU1hcFBsYXllckJ1aWxkZXJQb3NpdGlvbikpIHtcbiAgICBzZXRQbGF5ZXJCdWlsZGVyKGNvbnRleHQsIHN0eWxlc1BsYXllckJ1aWxkZXIsIFBsYXllckluZGV4LlN0eWxlTWFwUGxheWVyQnVpbGRlclBvc2l0aW9uKTtcbiAgICBwbGF5ZXJCdWlsZGVyc0FyZURpcnR5ID0gdHJ1ZTtcbiAgfVxuXG4gIC8vIGVhY2ggdGltZSBhIHN0cmluZy1iYXNlZCB2YWx1ZSBwb3BzIHVwIHRoZW4gaXQgc2hvdWxkbid0IHJlcXVpcmUgYSBkZWVwXG4gIC8vIGNoZWNrIG9mIHdoYXQncyBjaGFuZ2VkLlxuICBpZiAoIWlnbm9yZUFsbENsYXNzVXBkYXRlcykge1xuICAgIGlmICh0eXBlb2YgY2xhc3Nlc1ZhbHVlID09ICdzdHJpbmcnKSB7XG4gICAgICBjbGFzc05hbWVzID0gY2xhc3Nlc1ZhbHVlLnNwbGl0KC9cXHMrLyk7XG4gICAgICAvLyB0aGlzIGJvb2xlYW4gaXMgdXNlZCB0byBhdm9pZCBoYXZpbmcgdG8gY3JlYXRlIGEga2V5L3ZhbHVlIG1hcCBvZiBgdHJ1ZWAgdmFsdWVzXG4gICAgICAvLyBzaW5jZSBhIGNsYXNzbmFtZSBzdHJpbmcgaW1wbGllcyB0aGF0IGFsbCB0aG9zZSBjbGFzc2VzIGFyZSBhZGRlZFxuICAgICAgYXBwbHlBbGxDbGFzc2VzID0gdHJ1ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgY2xhc3NOYW1lcyA9IGNsYXNzZXNWYWx1ZSA/IE9iamVjdC5rZXlzKGNsYXNzZXNWYWx1ZSkgOiBFTVBUWV9BUlJBWTtcbiAgICB9XG4gIH1cblxuICBjb25zdCBtdWx0aVN0eWxlc1N0YXJ0SW5kZXggPSBnZXRNdWx0aVN0eWxlc1N0YXJ0SW5kZXgoY29udGV4dCk7XG4gIGxldCBtdWx0aUNsYXNzZXNTdGFydEluZGV4ID0gZ2V0TXVsdGlDbGFzc2VzU3RhcnRJbmRleChjb250ZXh0KTtcbiAgbGV0IG11bHRpQ2xhc3Nlc0VuZEluZGV4ID0gY29udGV4dC5sZW5ndGg7XG5cbiAgaWYgKCFpZ25vcmVBbGxTdHlsZVVwZGF0ZXMpIHtcbiAgICBjb25zdCBzdHlsZVByb3BzID0gc3R5bGVzVmFsdWUgPyBPYmplY3Qua2V5cyhzdHlsZXNWYWx1ZSkgOiBFTVBUWV9BUlJBWTtcbiAgICBjb25zdCBzdHlsZXMgPSBzdHlsZXNWYWx1ZSB8fCBFTVBUWV9PQko7XG4gICAgY29uc3QgdG90YWxOZXdFbnRyaWVzID0gcGF0Y2hTdHlsaW5nTWFwSW50b0NvbnRleHQoXG4gICAgICAgIGNvbnRleHQsIGRpcmVjdGl2ZUluZGV4LCBzdHlsZXNQbGF5ZXJCdWlsZGVySW5kZXgsIG11bHRpU3R5bGVzU3RhcnRJbmRleCxcbiAgICAgICAgbXVsdGlDbGFzc2VzU3RhcnRJbmRleCwgc3R5bGVQcm9wcywgc3R5bGVzLCBzdHlsZXNJbnB1dCwgZmFsc2UpO1xuICAgIGlmICh0b3RhbE5ld0VudHJpZXMpIHtcbiAgICAgIG11bHRpQ2xhc3Nlc1N0YXJ0SW5kZXggKz0gdG90YWxOZXdFbnRyaWVzICogU3R5bGluZ0luZGV4LlNpemU7XG4gICAgICBtdWx0aUNsYXNzZXNFbmRJbmRleCArPSB0b3RhbE5ld0VudHJpZXMgKiBTdHlsaW5nSW5kZXguU2l6ZTtcbiAgICB9XG4gIH1cblxuICBpZiAoIWlnbm9yZUFsbENsYXNzVXBkYXRlcykge1xuICAgIGNvbnN0IGNsYXNzZXMgPSAoY2xhc3Nlc1ZhbHVlIHx8IEVNUFRZX09CSikgYXN7W2tleTogc3RyaW5nXTogYW55fTtcbiAgICBwYXRjaFN0eWxpbmdNYXBJbnRvQ29udGV4dChcbiAgICAgICAgY29udGV4dCwgZGlyZWN0aXZlSW5kZXgsIGNsYXNzZXNQbGF5ZXJCdWlsZGVySW5kZXgsIG11bHRpQ2xhc3Nlc1N0YXJ0SW5kZXgsXG4gICAgICAgIG11bHRpQ2xhc3Nlc0VuZEluZGV4LCBjbGFzc05hbWVzLCBhcHBseUFsbENsYXNzZXMgfHwgY2xhc3NlcywgY2xhc3Nlc0lucHV0LCB0cnVlKTtcbiAgfVxuXG4gIGlmIChwbGF5ZXJCdWlsZGVyc0FyZURpcnR5KSB7XG4gICAgc2V0Q29udGV4dFBsYXllcnNEaXJ0eShjb250ZXh0LCB0cnVlKTtcbiAgfVxufVxuXG4vKipcbiAqIEFwcGxpZXMgdGhlIGdpdmVuIG11bHRpIHN0eWxpbmcgKHN0eWxlcyBvciBjbGFzc2VzKSB2YWx1ZXMgdG8gdGhlIGNvbnRleHQuXG4gKlxuICogVGhlIHN0eWxpbmcgYWxnb3JpdGhtIGNvZGUgdGhhdCBhcHBsaWVzIG11bHRpLWxldmVsIHN0eWxpbmcgKHRoaW5ncyBsaWtlIGBbc3R5bGVdYCBhbmQgYFtjbGFzc11gXG4gKiB2YWx1ZXMpIHJlc2lkZXMgaGVyZS5cbiAqXG4gKiBCZWNhdXNlIHRoaXMgZnVuY3Rpb24gdW5kZXJzdGFuZHMgdGhhdCBtdWx0aXBsZSBkaXJlY3RpdmVzIG1heSBhbGwgd3JpdGUgdG8gdGhlIGBbc3R5bGVdYCBhbmRcbiAqIGBbY2xhc3NdYCBiaW5kaW5ncyAodGhyb3VnaCBob3N0IGJpbmRpbmdzKSwgaXQgcmVsaWVzIG9mIGVhY2ggZGlyZWN0aXZlIGFwcGx5aW5nIGl0cyBiaW5kaW5nXG4gKiB2YWx1ZSBpbiBvcmRlci4gVGhpcyBtZWFucyB0aGF0IGEgZGlyZWN0aXZlIGxpa2UgYGNsYXNzQURpcmVjdGl2ZWAgd2lsbCBhbHdheXMgZmlyZSBiZWZvcmVcbiAqIGBjbGFzc0JEaXJlY3RpdmVgIGFuZCB0aGVyZWZvcmUgaXRzIHN0eWxpbmcgdmFsdWVzIChjbGFzc2VzIGFuZCBzdHlsZXMpIHdpbGwgYWx3YXlzIGJlIGV2YWx1YXRlZFxuICogaW4gdGhlIHNhbWUgb3JkZXIuIEJlY2F1c2Ugb2YgdGhpcyBjb25zaXN0ZW50IG9yZGVyaW5nLCB0aGUgZmlyc3QgZGlyZWN0aXZlIGhhcyBhIGhpZ2hlciBwcmlvcml0eVxuICogdGhhbiB0aGUgc2Vjb25kIG9uZS4gSXQgaXMgd2l0aCB0aGlzIHByaW9yaXR6YXRpb24gbWVjaGFuaXNtIHRoYXQgdGhlIHN0eWxpbmcgYWxnb3JpdGhtIGtub3dzIGhvd1xuICogdG8gbWVyZ2UgYW5kIGFwcGx5IHJlZHVkYW50IHN0eWxpbmcgcHJvcGVydGllcy5cbiAqXG4gKiBUaGUgZnVuY3Rpb24gaXRzZWxmIGFwcGxpZXMgdGhlIGtleS92YWx1ZSBlbnRyaWVzIChvciBhbiBhcnJheSBvZiBrZXlzKSB0b1xuICogdGhlIGNvbnRleHQgaW4gdGhlIGZvbGxvd2luZyBzdGVwcy5cbiAqXG4gKiBTVEVQIDE6XG4gKiAgICBGaXJzdCBjaGVjayB0byBzZWUgd2hhdCBwcm9wZXJ0aWVzIGFyZSBhbHJlYWR5IHNldCBhbmQgaW4gdXNlIGJ5IGFub3RoZXIgZGlyZWN0aXZlIGluIHRoZVxuICogICAgY29udGV4dCAoZS5nLiBgbmdDbGFzc2Agc2V0IHRoZSBgd2lkdGhgIHZhbHVlIGFuZCBgW3N0eWxlLndpZHRoXT1cIndcImAgaW4gYSBkaXJlY3RpdmUgaXNcbiAqICAgIGF0dGVtcHRpbmcgdG8gc2V0IGl0IGFzIHdlbGwpLlxuICpcbiAqIFNURVAgMjpcbiAqICAgIEFsbCByZW1haW5pbmcgcHJvcGVydGllcyAodGhhdCB3ZXJlIG5vdCBzZXQgcHJpb3IgdG8gdGhpcyBkaXJlY3RpdmUpIGFyZSBub3cgdXBkYXRlZCBpblxuICogICAgdGhlIGNvbnRleHQuIEFueSBuZXcgcHJvcGVydGllcyBhcmUgaW5zZXJ0ZWQgZXhhY3RseSBhdCB0aGVpciBzcG90IGluIHRoZSBjb250ZXh0IGFuZCBhbnlcbiAqICAgIHByZXZpb3VzbHkgc2V0IHByb3BlcnRpZXMgYXJlIHNoaWZ0ZWQgdG8gZXhhY3RseSB3aGVyZSB0aGUgY3Vyc29yIHNpdHMgd2hpbGUgaXRlcmF0aW5nIG92ZXJcbiAqICAgIHRoZSBjb250ZXh0LiBUaGUgZW5kIHJlc3VsdCBpcyBhIGJhbGFuY2VkIGNvbnRleHQgdGhhdCBpbmNsdWRlcyB0aGUgZXhhY3Qgb3JkZXJpbmcgb2YgdGhlXG4gKiAgICBzdHlsaW5nIHByb3BlcnRpZXMvdmFsdWVzIGZvciB0aGUgcHJvdmlkZWQgaW5wdXQgZnJvbSB0aGUgZGlyZWN0aXZlLlxuICpcbiAqIFNURVAgMzpcbiAqICAgIEFueSB1bm1hdGNoZWQgcHJvcGVydGllcyBpbiB0aGUgY29udGV4dCB0aGF0IGJlbG9uZyB0byB0aGUgZGlyZWN0aXZlIGFyZSBzZXQgdG8gbnVsbFxuICpcbiAqIE9uY2UgdGhlIHVwZGF0aW5nIHBoYXNlIGlzIGRvbmUsIHRoZW4gdGhlIGFsZ29yaXRobSB3aWxsIGRlY2lkZSB3aGV0aGVyIG9yIG5vdCB0byBmbGFnIHRoZVxuICogZm9sbG93LXVwIGRpcmVjdGl2ZXMgKHRoZSBkaXJlY3RpdmVzIHRoYXQgd2lsbCBwYXNzIGluIHRoZWlyIHN0eWxpbmcgdmFsdWVzKSBkZXBlbmRpbmcgb24gaWZcbiAqIHRoZSBcInNoYXBlXCIgb2YgdGhlIG11bHRpLXZhbHVlIG1hcCBoYXMgY2hhbmdlZCAoZWl0aGVyIGlmIGFueSBrZXlzIGFyZSByZW1vdmVkIG9yIGFkZGVkIG9yXG4gKiBpZiB0aGVyZSBhcmUgYW55IG5ldyBgbnVsbGAgdmFsdWVzKS4gSWYgYW55IGZvbGxvdy11cCBkaXJlY3RpdmVzIGFyZSBmbGFnZ2VkIGFzIGRpcnR5IHRoZW4gdGhlXG4gKiBhbGdvcml0aG0gd2lsbCBydW4gYWdhaW4gZm9yIHRoZW0uIE90aGVyd2lzZSBpZiB0aGUgc2hhcGUgZGlkIG5vdCBjaGFuZ2UgdGhlbiBhbnkgZm9sbG93LXVwXG4gKiBkaXJlY3RpdmVzIHdpbGwgbm90IHJ1biAoc28gbG9uZyBhcyB0aGVpciBiaW5kaW5nIHZhbHVlcyBzdGF5IHRoZSBzYW1lKS5cbiAqXG4gKiBAcmV0dXJucyB0aGUgdG90YWwgYW1vdW50IG9mIG5ldyBzbG90cyB0aGF0IHdlcmUgYWxsb2NhdGVkIGludG8gdGhlIGNvbnRleHQgZHVlIHRvIG5ldyBzdHlsaW5nXG4gKiAgICAgICAgICBwcm9wZXJ0aWVzIHRoYXQgd2VyZSBkZXRlY3RlZC5cbiAqL1xuZnVuY3Rpb24gcGF0Y2hTdHlsaW5nTWFwSW50b0NvbnRleHQoXG4gICAgY29udGV4dDogU3R5bGluZ0NvbnRleHQsIGRpcmVjdGl2ZUluZGV4OiBudW1iZXIsIHBsYXllckJ1aWxkZXJJbmRleDogbnVtYmVyLCBjdHhTdGFydDogbnVtYmVyLFxuICAgIGN0eEVuZDogbnVtYmVyLCBwcm9wczogKHN0cmluZyB8IG51bGwpW10sIHZhbHVlczoge1trZXk6IHN0cmluZ106IGFueX0gfCB0cnVlLCBjYWNoZVZhbHVlOiBhbnksXG4gICAgZW50cnlJc0NsYXNzQmFzZWQ6IGJvb2xlYW4pOiBudW1iZXIge1xuICBsZXQgZGlydHkgPSBmYWxzZTtcblxuICBjb25zdCBjYWNoZUluZGV4ID0gTWFwQmFzZWRPZmZzZXRWYWx1ZXNJbmRleC5WYWx1ZXNTdGFydFBvc2l0aW9uICtcbiAgICAgIGRpcmVjdGl2ZUluZGV4ICogTWFwQmFzZWRPZmZzZXRWYWx1ZXNJbmRleC5TaXplO1xuXG4gIC8vIHRoZSBjYWNoZWRWYWx1ZXMgYXJyYXkgaXMgdGhlIHJlZ2lzdHJ5IG9mIGFsbCBtdWx0aSBzdHlsZSB2YWx1ZXMgKG1hcCB2YWx1ZXMpLiBFYWNoXG4gIC8vIHZhbHVlIGlzIHN0b3JlZCAoY2FjaGVkKSBlYWNoIHRpbWUgaXMgdXBkYXRlZC5cbiAgY29uc3QgY2FjaGVkVmFsdWVzID1cbiAgICAgIGNvbnRleHRbZW50cnlJc0NsYXNzQmFzZWQgPyBTdHlsaW5nSW5kZXguQ2FjaGVkTXVsdGlDbGFzc2VzIDogU3R5bGluZ0luZGV4LkNhY2hlZE11bHRpU3R5bGVzXTtcblxuICAvLyB0aGlzIGlzIHRoZSBpbmRleCBpbiB3aGljaCB0aGlzIGRpcmVjdGl2ZSBoYXMgb3duZXJzaGlwIGFjY2VzcyB0byB3cml0ZSB0byB0aGlzXG4gIC8vIHZhbHVlIChhbnl0aGluZyBiZWZvcmUgaXMgb3duZWQgYnkgYSBwcmV2aW91cyBkaXJlY3RpdmUgdGhhdCBpcyBtb3JlIGltcG9ydGFudClcbiAgY29uc3Qgb3duZXJzaGlwVmFsdWVzU3RhcnRJbmRleCA9XG4gICAgICBjYWNoZWRWYWx1ZXNbY2FjaGVJbmRleCArIE1hcEJhc2VkT2Zmc2V0VmFsdWVzSW5kZXguUG9zaXRpb25TdGFydE9mZnNldF07XG5cbiAgY29uc3QgZXhpc3RpbmdDYWNoZWRWYWx1ZSA9IGNhY2hlZFZhbHVlc1tjYWNoZUluZGV4ICsgTWFwQmFzZWRPZmZzZXRWYWx1ZXNJbmRleC5WYWx1ZU9mZnNldF07XG4gIGNvbnN0IGV4aXN0aW5nQ2FjaGVkVmFsdWVDb3VudCA9XG4gICAgICBjYWNoZWRWYWx1ZXNbY2FjaGVJbmRleCArIE1hcEJhc2VkT2Zmc2V0VmFsdWVzSW5kZXguVmFsdWVDb3VudE9mZnNldF07XG4gIGNvbnN0IGV4aXN0aW5nQ2FjaGVkVmFsdWVJc0RpcnR5ID1cbiAgICAgIGNhY2hlZFZhbHVlc1tjYWNoZUluZGV4ICsgTWFwQmFzZWRPZmZzZXRWYWx1ZXNJbmRleC5EaXJ0eUZsYWdPZmZzZXRdID09PSAxO1xuXG4gIC8vIEEgc2hhcGUgY2hhbmdlIG1lYW5zIHRoZSBwcm92aWRlZCBtYXAgdmFsdWUgaGFzIGVpdGhlciByZW1vdmVkIG9yIGFkZGVkIG5ldyBwcm9wZXJ0aWVzXG4gIC8vIGNvbXBhcmVkIHRvIHdoYXQgd2VyZSBpbiB0aGUgbGFzdCB0aW1lLiBJZiBhIHNoYXBlIGNoYW5nZSBvY2N1cnMgdGhlbiBpdCBtZWFucyB0aGF0IGFsbFxuICAvLyBmb2xsb3ctdXAgbXVsdGktc3R5bGluZyBlbnRyaWVzIGFyZSBvYnNvbGV0ZSBhbmQgd2lsbCBiZSBleGFtaW5lZCBhZ2FpbiB3aGVuIENEIHJ1bnNcbiAgLy8gdGhlbS4gSWYgYSBzaGFwZSBjaGFuZ2UgaGFzIG5vdCBvY2N1cnJlZCB0aGVuIHRoZXJlIGlzIG5vIHJlYXNvbiB0byBjaGVjayBhbnkgb3RoZXJcbiAgLy8gZGlyZWN0aXZlIHZhbHVlcyBpZiB0aGVpciBpZGVudGl0eSBoYXMgbm90IGNoYW5nZWQuIElmIGEgcHJldmlvdXMgZGlyZWN0aXZlIHNldCB0aGlzXG4gIC8vIHZhbHVlIGFzIGRpcnR5IChiZWNhdXNlIGl0cyBvd24gc2hhcGUgY2hhbmdlZCkgdGhlbiB0aGlzIG1lYW5zIHRoYXQgdGhlIG9iamVjdCBoYXMgYmVlblxuICAvLyBvZmZzZXQgdG8gYSBkaWZmZXJlbnQgYXJlYSBpbiB0aGUgY29udGV4dC4gQmVjYXVzZSBpdHMgdmFsdWUgaGFzIGJlZW4gb2Zmc2V0IHRoZW4gaXRcbiAgLy8gY2FuJ3Qgd3JpdGUgdG8gYSByZWdpb24gdGhhdCBpdCB3cm90ZSB0byBiZWZvcmUgKHdoaWNoIG1heSBoYXZlIGJlZW4gYXBhcnQgb2YgYW5vdGhlclxuICAvLyBkaXJlY3RpdmUpIGFuZCB0aGVyZWZvcmUgaXRzIHNoYXBlIGNoYW5nZXMgdG9vLlxuICBsZXQgdmFsdWVzRW50cnlTaGFwZUNoYW5nZSA9XG4gICAgICBleGlzdGluZ0NhY2hlZFZhbHVlSXNEaXJ0eSB8fCAoKCFleGlzdGluZ0NhY2hlZFZhbHVlICYmIGNhY2hlVmFsdWUpID8gdHJ1ZSA6IGZhbHNlKTtcblxuICBsZXQgdG90YWxVbmlxdWVWYWx1ZXMgPSAwO1xuICBsZXQgdG90YWxOZXdBbGxvY2F0ZWRTbG90cyA9IDA7XG5cbiAgLy8gdGhpcyBpcyBhIHRyaWNrIHRvIGF2b2lkIGJ1aWxkaW5nIHtrZXk6dmFsdWV9IG1hcCB3aGVyZSBhbGwgdGhlIHZhbHVlc1xuICAvLyBhcmUgYHRydWVgICh0aGlzIGhhcHBlbnMgd2hlbiBhIGNsYXNzTmFtZSBzdHJpbmcgaXMgcHJvdmlkZWQgaW5zdGVhZCBvZiBhXG4gIC8vIG1hcCBhcyBhbiBpbnB1dCB2YWx1ZSB0byB0aGlzIHN0eWxpbmcgYWxnb3JpdGhtKVxuICBjb25zdCBhcHBseUFsbFByb3BzID0gdmFsdWVzID09PSB0cnVlO1xuXG4gIC8vIFNURVAgMTpcbiAgLy8gbG9vcCB0aHJvdWdoIHRoZSBlYXJsaWVyIGRpcmVjdGl2ZXMgYW5kIGZpZ3VyZSBvdXQgaWYgYW55IHByb3BlcnRpZXMgaGVyZSB3aWxsIGJlIHBsYWNlZFxuICAvLyBpbiB0aGVpciBhcmVhICh0aGlzIGhhcHBlbnMgd2hlbiB0aGUgdmFsdWUgaXMgbnVsbCBiZWNhdXNlIHRoZSBlYXJsaWVyIGRpcmVjdGl2ZSBlcmFzZWQgaXQpLlxuICBsZXQgY3R4SW5kZXggPSBjdHhTdGFydDtcbiAgbGV0IHRvdGFsUmVtYWluaW5nUHJvcGVydGllcyA9IHByb3BzLmxlbmd0aDtcbiAgd2hpbGUgKGN0eEluZGV4IDwgb3duZXJzaGlwVmFsdWVzU3RhcnRJbmRleCkge1xuICAgIGNvbnN0IGN1cnJlbnRQcm9wID0gZ2V0UHJvcChjb250ZXh0LCBjdHhJbmRleCk7XG4gICAgaWYgKHRvdGFsUmVtYWluaW5nUHJvcGVydGllcykge1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwcm9wcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBjb25zdCBtYXBQcm9wID0gcHJvcHNbaV07XG4gICAgICAgIGNvbnN0IG5vcm1hbGl6ZWRQcm9wID0gbWFwUHJvcCA/IChlbnRyeUlzQ2xhc3NCYXNlZCA/IG1hcFByb3AgOiBoeXBoZW5hdGUobWFwUHJvcCkpIDogbnVsbDtcbiAgICAgICAgaWYgKG5vcm1hbGl6ZWRQcm9wICYmIGN1cnJlbnRQcm9wID09PSBub3JtYWxpemVkUHJvcCkge1xuICAgICAgICAgIGNvbnN0IGN1cnJlbnRWYWx1ZSA9IGdldFZhbHVlKGNvbnRleHQsIGN0eEluZGV4KTtcbiAgICAgICAgICBjb25zdCBjdXJyZW50RGlyZWN0aXZlSW5kZXggPSBnZXREaXJlY3RpdmVJbmRleEZyb21FbnRyeShjb250ZXh0LCBjdHhJbmRleCk7XG4gICAgICAgICAgY29uc3QgdmFsdWUgPSBhcHBseUFsbFByb3BzID8gdHJ1ZSA6ICh2YWx1ZXMgYXN7W2tleTogc3RyaW5nXTogYW55fSlbbm9ybWFsaXplZFByb3BdO1xuICAgICAgICAgIGNvbnN0IGN1cnJlbnRGbGFnID0gZ2V0UG9pbnRlcnMoY29udGV4dCwgY3R4SW5kZXgpO1xuICAgICAgICAgIGlmIChoYXNWYWx1ZUNoYW5nZWQoY3VycmVudEZsYWcsIGN1cnJlbnRWYWx1ZSwgdmFsdWUpICYmXG4gICAgICAgICAgICAgIGFsbG93VmFsdWVDaGFuZ2UoY3VycmVudFZhbHVlLCB2YWx1ZSwgY3VycmVudERpcmVjdGl2ZUluZGV4LCBkaXJlY3RpdmVJbmRleCkpIHtcbiAgICAgICAgICAgIHNldFZhbHVlKGNvbnRleHQsIGN0eEluZGV4LCB2YWx1ZSk7XG4gICAgICAgICAgICBzZXRQbGF5ZXJCdWlsZGVySW5kZXgoY29udGV4dCwgY3R4SW5kZXgsIHBsYXllckJ1aWxkZXJJbmRleCwgZGlyZWN0aXZlSW5kZXgpO1xuICAgICAgICAgICAgaWYgKGhhc0luaXRpYWxWYWx1ZUNoYW5nZWQoY29udGV4dCwgY3VycmVudEZsYWcsIHZhbHVlKSkge1xuICAgICAgICAgICAgICBzZXREaXJ0eShjb250ZXh0LCBjdHhJbmRleCwgdHJ1ZSk7XG4gICAgICAgICAgICAgIGRpcnR5ID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgcHJvcHNbaV0gPSBudWxsO1xuICAgICAgICAgIHRvdGFsUmVtYWluaW5nUHJvcGVydGllcy0tO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIGN0eEluZGV4ICs9IFN0eWxpbmdJbmRleC5TaXplO1xuICB9XG5cbiAgLy8gU1RFUCAyOlxuICAvLyBhcHBseSB0aGUgbGVmdCBvdmVyIHByb3BlcnRpZXMgdG8gdGhlIGNvbnRleHQgaW4gdGhlIGNvcnJlY3Qgb3JkZXIuXG4gIGlmICh0b3RhbFJlbWFpbmluZ1Byb3BlcnRpZXMpIHtcbiAgICBjb25zdCBzYW5pdGl6ZXIgPSBlbnRyeUlzQ2xhc3NCYXNlZCA/IG51bGwgOiBnZXRTdHlsZVNhbml0aXplcihjb250ZXh0LCBkaXJlY3RpdmVJbmRleCk7XG4gICAgcHJvcGVydGllc0xvb3A6IGZvciAobGV0IGkgPSAwOyBpIDwgcHJvcHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IG1hcFByb3AgPSBwcm9wc1tpXTtcblxuICAgICAgaWYgKCFtYXBQcm9wKSB7XG4gICAgICAgIC8vIHRoaXMgaXMgYW4gZWFybHkgZXhpdCBpbmNhc2UgYSB2YWx1ZSB3YXMgYWxyZWFkeSBlbmNvdW50ZXJlZCBhYm92ZSBpbiB0aGVcbiAgICAgICAgLy8gcHJldmlvdXMgbG9vcCAod2hpY2ggbWVhbnMgdGhhdCB0aGUgcHJvcGVydHkgd2FzIGFwcGxpZWQgb3IgcmVqZWN0ZWQpXG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBjb25zdCB2YWx1ZSA9IGFwcGx5QWxsUHJvcHMgPyB0cnVlIDogKHZhbHVlcyBhc3tba2V5OiBzdHJpbmddOiBhbnl9KVttYXBQcm9wXTtcbiAgICAgIGNvbnN0IG5vcm1hbGl6ZWRQcm9wID0gZW50cnlJc0NsYXNzQmFzZWQgPyBtYXBQcm9wIDogaHlwaGVuYXRlKG1hcFByb3ApO1xuICAgICAgY29uc3QgaXNJbnNpZGVPd25lcnNoaXBBcmVhID0gY3R4SW5kZXggPj0gb3duZXJzaGlwVmFsdWVzU3RhcnRJbmRleDtcblxuICAgICAgZm9yIChsZXQgaiA9IGN0eEluZGV4OyBqIDwgY3R4RW5kOyBqICs9IFN0eWxpbmdJbmRleC5TaXplKSB7XG4gICAgICAgIGNvbnN0IGRpc3RhbnRDdHhQcm9wID0gZ2V0UHJvcChjb250ZXh0LCBqKTtcbiAgICAgICAgaWYgKGRpc3RhbnRDdHhQcm9wID09PSBub3JtYWxpemVkUHJvcCkge1xuICAgICAgICAgIGNvbnN0IGRpc3RhbnRDdHhEaXJlY3RpdmVJbmRleCA9IGdldERpcmVjdGl2ZUluZGV4RnJvbUVudHJ5KGNvbnRleHQsIGopO1xuICAgICAgICAgIGNvbnN0IGRpc3RhbnRDdHhQbGF5ZXJCdWlsZGVySW5kZXggPSBnZXRQbGF5ZXJCdWlsZGVySW5kZXgoY29udGV4dCwgaik7XG4gICAgICAgICAgY29uc3QgZGlzdGFudEN0eFZhbHVlID0gZ2V0VmFsdWUoY29udGV4dCwgaik7XG4gICAgICAgICAgY29uc3QgZGlzdGFudEN0eEZsYWcgPSBnZXRQb2ludGVycyhjb250ZXh0LCBqKTtcblxuICAgICAgICAgIGlmIChhbGxvd1ZhbHVlQ2hhbmdlKGRpc3RhbnRDdHhWYWx1ZSwgdmFsdWUsIGRpc3RhbnRDdHhEaXJlY3RpdmVJbmRleCwgZGlyZWN0aXZlSW5kZXgpKSB7XG4gICAgICAgICAgICAvLyBldmVuIGlmIHRoZSBlbnRyeSBpc24ndCB1cGRhdGVkIChieSB2YWx1ZSBvciBkaXJlY3RpdmVJbmRleCkgdGhlblxuICAgICAgICAgICAgLy8gaXQgc2hvdWxkIHN0aWxsIGJlIG1vdmVkIG92ZXIgdG8gdGhlIGNvcnJlY3Qgc3BvdCBpbiB0aGUgYXJyYXkgc29cbiAgICAgICAgICAgIC8vIHRoZSBpdGVyYXRpb24gbG9vcCBpcyB0aWdodGVyLlxuICAgICAgICAgICAgaWYgKGlzSW5zaWRlT3duZXJzaGlwQXJlYSkge1xuICAgICAgICAgICAgICBzd2FwTXVsdGlDb250ZXh0RW50cmllcyhjb250ZXh0LCBjdHhJbmRleCwgaik7XG4gICAgICAgICAgICAgIHRvdGFsVW5pcXVlVmFsdWVzKys7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChoYXNWYWx1ZUNoYW5nZWQoZGlzdGFudEN0eEZsYWcsIGRpc3RhbnRDdHhWYWx1ZSwgdmFsdWUpKSB7XG4gICAgICAgICAgICAgIGlmICh2YWx1ZSA9PT0gbnVsbCB8fCB2YWx1ZSA9PT0gdW5kZWZpbmVkICYmIHZhbHVlICE9PSBkaXN0YW50Q3R4VmFsdWUpIHtcbiAgICAgICAgICAgICAgICB2YWx1ZXNFbnRyeVNoYXBlQ2hhbmdlID0gdHJ1ZTtcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIHNldFZhbHVlKGNvbnRleHQsIGN0eEluZGV4LCB2YWx1ZSk7XG5cbiAgICAgICAgICAgICAgLy8gU0tJUCBJRiBJTklUSUFMIENIRUNLXG4gICAgICAgICAgICAgIC8vIElmIHRoZSBmb3JtZXIgYHZhbHVlYCBpcyBgbnVsbGAgdGhlbiBpdCBtZWFucyB0aGF0IGFuIGluaXRpYWwgdmFsdWVcbiAgICAgICAgICAgICAgLy8gY291bGQgYmUgYmVpbmcgcmVuZGVyZWQgb24gc2NyZWVuLiBJZiB0aGF0IGlzIHRoZSBjYXNlIHRoZW4gdGhlcmUgaXNcbiAgICAgICAgICAgICAgLy8gbm8gcG9pbnQgaW4gdXBkYXRpbmcgdGhlIHZhbHVlIGluY2FzZSBpdCBtYXRjaGVzLiBJbiBvdGhlciB3b3JkcyBpZiB0aGVcbiAgICAgICAgICAgICAgLy8gbmV3IHZhbHVlIGlzIHRoZSBleGFjdCBzYW1lIGFzIHRoZSBwcmV2aW91c2x5IHJlbmRlcmVkIHZhbHVlICh3aGljaFxuICAgICAgICAgICAgICAvLyBoYXBwZW5zIHRvIGJlIHRoZSBpbml0aWFsIHZhbHVlKSB0aGVuIGRvIG5vdGhpbmcuXG4gICAgICAgICAgICAgIGlmIChkaXN0YW50Q3R4VmFsdWUgIT09IG51bGwgfHxcbiAgICAgICAgICAgICAgICAgIGhhc0luaXRpYWxWYWx1ZUNoYW5nZWQoY29udGV4dCwgZGlzdGFudEN0eEZsYWcsIHZhbHVlKSkge1xuICAgICAgICAgICAgICAgIHNldERpcnR5KGNvbnRleHQsIGN0eEluZGV4LCB0cnVlKTtcbiAgICAgICAgICAgICAgICBkaXJ0eSA9IHRydWU7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGRpc3RhbnRDdHhEaXJlY3RpdmVJbmRleCAhPT0gZGlyZWN0aXZlSW5kZXggfHxcbiAgICAgICAgICAgICAgICBwbGF5ZXJCdWlsZGVySW5kZXggIT09IGRpc3RhbnRDdHhQbGF5ZXJCdWlsZGVySW5kZXgpIHtcbiAgICAgICAgICAgICAgc2V0UGxheWVyQnVpbGRlckluZGV4KGNvbnRleHQsIGN0eEluZGV4LCBwbGF5ZXJCdWlsZGVySW5kZXgsIGRpcmVjdGl2ZUluZGV4KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgICBjdHhJbmRleCArPSBTdHlsaW5nSW5kZXguU2l6ZTtcbiAgICAgICAgICBjb250aW51ZSBwcm9wZXJ0aWVzTG9vcDtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBmYWxsYmFjayBjYXNlIC4uLiB2YWx1ZSBub3QgZm91bmQgYXQgYWxsIGluIHRoZSBjb250ZXh0XG4gICAgICBpZiAodmFsdWUgIT0gbnVsbCkge1xuICAgICAgICB2YWx1ZXNFbnRyeVNoYXBlQ2hhbmdlID0gdHJ1ZTtcbiAgICAgICAgdG90YWxVbmlxdWVWYWx1ZXMrKztcbiAgICAgICAgY29uc3QgZmxhZyA9IHByZXBhcmVJbml0aWFsRmxhZyhjb250ZXh0LCBub3JtYWxpemVkUHJvcCwgZW50cnlJc0NsYXNzQmFzZWQsIHNhbml0aXplcikgfFxuICAgICAgICAgICAgU3R5bGluZ0ZsYWdzLkRpcnR5O1xuXG4gICAgICAgIGNvbnN0IGluc2VydGlvbkluZGV4ID0gaXNJbnNpZGVPd25lcnNoaXBBcmVhID9cbiAgICAgICAgICAgIGN0eEluZGV4IDpcbiAgICAgICAgICAgIChvd25lcnNoaXBWYWx1ZXNTdGFydEluZGV4ICsgdG90YWxOZXdBbGxvY2F0ZWRTbG90cyAqIFN0eWxpbmdJbmRleC5TaXplKTtcbiAgICAgICAgaW5zZXJ0TmV3TXVsdGlQcm9wZXJ0eShcbiAgICAgICAgICAgIGNvbnRleHQsIGluc2VydGlvbkluZGV4LCBlbnRyeUlzQ2xhc3NCYXNlZCwgbm9ybWFsaXplZFByb3AsIGZsYWcsIHZhbHVlLCBkaXJlY3RpdmVJbmRleCxcbiAgICAgICAgICAgIHBsYXllckJ1aWxkZXJJbmRleCk7XG5cbiAgICAgICAgdG90YWxOZXdBbGxvY2F0ZWRTbG90cysrO1xuICAgICAgICBjdHhFbmQgKz0gU3R5bGluZ0luZGV4LlNpemU7XG4gICAgICAgIGN0eEluZGV4ICs9IFN0eWxpbmdJbmRleC5TaXplO1xuXG4gICAgICAgIGRpcnR5ID0gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvLyBTVEVQIDM6XG4gIC8vIFJlbW92ZSAobnVsbGlmeSkgYW55IGV4aXN0aW5nIGVudHJpZXMgaW4gdGhlIGNvbnRleHQgdGhhdCB3ZXJlIG5vdCBhcGFydCBvZiB0aGVcbiAgLy8gbWFwIGlucHV0IHZhbHVlIHRoYXQgd2FzIHBhc3NlZCBpbnRvIHRoaXMgYWxnb3JpdGhtIGZvciB0aGlzIGRpcmVjdGl2ZS5cbiAgd2hpbGUgKGN0eEluZGV4IDwgY3R4RW5kKSB7XG4gICAgdmFsdWVzRW50cnlTaGFwZUNoYW5nZSA9IHRydWU7ICAvLyBzb21lIHZhbHVlcyBhcmUgbWlzc2luZ1xuICAgIGNvbnN0IGN0eFZhbHVlID0gZ2V0VmFsdWUoY29udGV4dCwgY3R4SW5kZXgpO1xuICAgIGNvbnN0IGN0eEZsYWcgPSBnZXRQb2ludGVycyhjb250ZXh0LCBjdHhJbmRleCk7XG4gICAgY29uc3QgY3R4RGlyZWN0aXZlID0gZ2V0RGlyZWN0aXZlSW5kZXhGcm9tRW50cnkoY29udGV4dCwgY3R4SW5kZXgpO1xuICAgIGlmIChjdHhWYWx1ZSAhPSBudWxsKSB7XG4gICAgICB2YWx1ZXNFbnRyeVNoYXBlQ2hhbmdlID0gdHJ1ZTtcbiAgICB9XG4gICAgaWYgKGhhc1ZhbHVlQ2hhbmdlZChjdHhGbGFnLCBjdHhWYWx1ZSwgbnVsbCkpIHtcbiAgICAgIHNldFZhbHVlKGNvbnRleHQsIGN0eEluZGV4LCBudWxsKTtcbiAgICAgIC8vIG9ubHkgaWYgdGhlIGluaXRpYWwgdmFsdWUgaXMgZmFsc3kgdGhlblxuICAgICAgaWYgKGhhc0luaXRpYWxWYWx1ZUNoYW5nZWQoY29udGV4dCwgY3R4RmxhZywgY3R4VmFsdWUpKSB7XG4gICAgICAgIHNldERpcnR5KGNvbnRleHQsIGN0eEluZGV4LCB0cnVlKTtcbiAgICAgICAgZGlydHkgPSB0cnVlO1xuICAgICAgfVxuICAgICAgc2V0UGxheWVyQnVpbGRlckluZGV4KGNvbnRleHQsIGN0eEluZGV4LCBwbGF5ZXJCdWlsZGVySW5kZXgsIGRpcmVjdGl2ZUluZGV4KTtcbiAgICB9XG4gICAgY3R4SW5kZXggKz0gU3R5bGluZ0luZGV4LlNpemU7XG4gIH1cblxuICAvLyBCZWNhdXNlIHRoZSBvYmplY3Qgc2hhcGUgaGFzIGNoYW5nZWQsIHRoaXMgbWVhbnMgdGhhdCBhbGwgZm9sbG93LXVwIGRpcmVjdGl2ZXMgd2lsbCBuZWVkIHRvXG4gIC8vIHJlYXBwbHkgdGhlaXIgdmFsdWVzIGludG8gdGhlIG9iamVjdC4gRm9yIHRoaXMgdG8gaGFwcGVuLCB0aGUgY2FjaGVkIGFycmF5IG5lZWRzIHRvIGJlIHVwZGF0ZWRcbiAgLy8gd2l0aCBkaXJ0eSBmbGFncyBzbyB0aGF0IGZvbGxvdy11cCBjYWxscyB0byBgdXBkYXRlU3R5bGluZ01hcGAgd2lsbCByZWFwcGx5IHRoZWlyIHN0eWxpbmcgY29kZS5cbiAgLy8gdGhlIHJlYXBwbGljYXRpb24gb2Ygc3R5bGluZyBjb2RlIHdpdGhpbiB0aGUgY29udGV4dCB3aWxsIHJlc2hhcGUgaXQgYW5kIHVwZGF0ZSB0aGUgb2Zmc2V0XG4gIC8vIHZhbHVlcyAoYWxzbyBmb2xsb3ctdXAgZGlyZWN0aXZlcyBjYW4gd3JpdGUgbmV3IHZhbHVlcyBpbmNhc2UgZWFybGllciBkaXJlY3RpdmVzIHNldCBhbnl0aGluZ1xuICAvLyB0byBudWxsIGR1ZSB0byByZW1vdmFscyBvciBmYWxzeSB2YWx1ZXMpLlxuICB2YWx1ZXNFbnRyeVNoYXBlQ2hhbmdlID0gdmFsdWVzRW50cnlTaGFwZUNoYW5nZSB8fCBleGlzdGluZ0NhY2hlZFZhbHVlQ291bnQgIT09IHRvdGFsVW5pcXVlVmFsdWVzO1xuICB1cGRhdGVDYWNoZWRNYXBWYWx1ZShcbiAgICAgIGNvbnRleHQsIGRpcmVjdGl2ZUluZGV4LCBlbnRyeUlzQ2xhc3NCYXNlZCwgY2FjaGVWYWx1ZSwgb3duZXJzaGlwVmFsdWVzU3RhcnRJbmRleCwgY3R4RW5kLFxuICAgICAgdG90YWxVbmlxdWVWYWx1ZXMsIHZhbHVlc0VudHJ5U2hhcGVDaGFuZ2UpO1xuXG4gIGlmIChkaXJ0eSkge1xuICAgIHNldENvbnRleHREaXJ0eShjb250ZXh0LCB0cnVlKTtcbiAgICBzZXREaXJlY3RpdmVEaXJ0eShjb250ZXh0LCBkaXJlY3RpdmVJbmRleCwgdHJ1ZSk7XG4gIH1cblxuICByZXR1cm4gdG90YWxOZXdBbGxvY2F0ZWRTbG90cztcbn1cblxuLyoqXG4gKiBTZXRzIGFuZCByZXNvbHZlcyBhIHNpbmdsZSBjbGFzcyB2YWx1ZSBvbiB0aGUgcHJvdmlkZWQgYFN0eWxpbmdDb250ZXh0YCBzb1xuICogdGhhdCB0aGV5IGNhbiBiZSBhcHBsaWVkIHRvIHRoZSBlbGVtZW50IG9uY2UgYHJlbmRlclN0eWxpbmdgIGlzIGNhbGxlZC5cbiAqXG4gKiBAcGFyYW0gY29udGV4dCBUaGUgc3R5bGluZyBjb250ZXh0IHRoYXQgd2lsbCBiZSB1cGRhdGVkIHdpdGggdGhlXG4gKiAgICBuZXdseSBwcm92aWRlZCBjbGFzcyB2YWx1ZS5cbiAqIEBwYXJhbSBvZmZzZXQgVGhlIGluZGV4IG9mIHRoZSBDU1MgY2xhc3Mgd2hpY2ggaXMgYmVpbmcgdXBkYXRlZC5cbiAqIEBwYXJhbSBhZGRPclJlbW92ZSBXaGV0aGVyIG9yIG5vdCB0byBhZGQgb3IgcmVtb3ZlIHRoZSBDU1MgY2xhc3NcbiAqIEBwYXJhbSBkaXJlY3RpdmVSZWYgYW4gb3B0aW9uYWwgcmVmZXJlbmNlIHRvIHRoZSBkaXJlY3RpdmUgcmVzcG9uc2libGVcbiAqICAgIGZvciB0aGlzIGJpbmRpbmcgY2hhbmdlLiBJZiBwcmVzZW50IHRoZW4gc3R5bGUgYmluZGluZyB3aWxsIG9ubHlcbiAqICAgIGFjdHVhbGl6ZSBpZiB0aGUgZGlyZWN0aXZlIGhhcyBvd25lcnNoaXAgb3ZlciB0aGlzIGJpbmRpbmdcbiAqICAgIChzZWUgc3R5bGluZy50cyNkaXJlY3RpdmVzIGZvciBtb3JlIGluZm9ybWF0aW9uIGFib3V0IHRoZSBhbGdvcml0aG0pLlxuICogQHBhcmFtIGZvcmNlT3ZlcnJpZGUgd2hldGhlciBvciBub3QgdG8gc2tpcCBhbGwgZGlyZWN0aXZlIHByaW9yaXRpemF0aW9uXG4gKiAgICBhbmQganVzdCBhcHBseSB0aGUgdmFsdWUgcmVnYXJkbGVzcy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHVwZGF0ZUNsYXNzUHJvcChcbiAgICBjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgb2Zmc2V0OiBudW1iZXIsXG4gICAgaW5wdXQ6IGJvb2xlYW4gfCBCb3VuZFBsYXllckZhY3Rvcnk8Ym9vbGVhbnxudWxsPnwgbnVsbCwgZGlyZWN0aXZlUmVmPzogYW55LFxuICAgIGZvcmNlT3ZlcnJpZGU/OiBib29sZWFuKTogdm9pZCB7XG4gIHVwZGF0ZVNpbmdsZVN0eWxpbmdWYWx1ZShjb250ZXh0LCBvZmZzZXQsIGlucHV0LCB0cnVlLCBkaXJlY3RpdmVSZWYsIGZvcmNlT3ZlcnJpZGUpO1xufVxuXG4vKipcbiAqIFNldHMgYW5kIHJlc29sdmVzIGEgc2luZ2xlIHN0eWxlIHZhbHVlIG9uIHRoZSBwcm92aWRlZCBgU3R5bGluZ0NvbnRleHRgIHNvXG4gKiB0aGF0IHRoZXkgY2FuIGJlIGFwcGxpZWQgdG8gdGhlIGVsZW1lbnQgb25jZSBgcmVuZGVyU3R5bGluZ2AgaXMgY2FsbGVkLlxuICpcbiAqIE5vdGUgdGhhdCBwcm9wLWxldmVsIHN0eWxpbmcgdmFsdWVzIGFyZSBjb25zaWRlcmVkIGhpZ2hlciBwcmlvcml0eSB0aGFuIGFueSBzdHlsaW5nIHRoYXRcbiAqIGhhcyBiZWVuIGFwcGxpZWQgdXNpbmcgYHVwZGF0ZVN0eWxpbmdNYXBgLCB0aGVyZWZvcmUsIHdoZW4gc3R5bGluZyB2YWx1ZXMgYXJlIHJlbmRlcmVkXG4gKiB0aGVuIGFueSBzdHlsZXMvY2xhc3NlcyB0aGF0IGhhdmUgYmVlbiBhcHBsaWVkIHVzaW5nIHRoaXMgZnVuY3Rpb24gd2lsbCBiZSBjb25zaWRlcmVkIGZpcnN0XG4gKiAodGhlbiBtdWx0aSB2YWx1ZXMgc2Vjb25kIGFuZCB0aGVuIGluaXRpYWwgdmFsdWVzIGFzIGEgYmFja3VwKS5cbiAqXG4gKiBAcGFyYW0gY29udGV4dCBUaGUgc3R5bGluZyBjb250ZXh0IHRoYXQgd2lsbCBiZSB1cGRhdGVkIHdpdGggdGhlXG4gKiAgICBuZXdseSBwcm92aWRlZCBzdHlsZSB2YWx1ZS5cbiAqIEBwYXJhbSBvZmZzZXQgVGhlIGluZGV4IG9mIHRoZSBwcm9wZXJ0eSB3aGljaCBpcyBiZWluZyB1cGRhdGVkLlxuICogQHBhcmFtIHZhbHVlIFRoZSBDU1Mgc3R5bGUgdmFsdWUgdGhhdCB3aWxsIGJlIGFzc2lnbmVkXG4gKiBAcGFyYW0gZGlyZWN0aXZlUmVmIGFuIG9wdGlvbmFsIHJlZmVyZW5jZSB0byB0aGUgZGlyZWN0aXZlIHJlc3BvbnNpYmxlXG4gKiAgICBmb3IgdGhpcyBiaW5kaW5nIGNoYW5nZS4gSWYgcHJlc2VudCB0aGVuIHN0eWxlIGJpbmRpbmcgd2lsbCBvbmx5XG4gKiAgICBhY3R1YWxpemUgaWYgdGhlIGRpcmVjdGl2ZSBoYXMgb3duZXJzaGlwIG92ZXIgdGhpcyBiaW5kaW5nXG4gKiAgICAoc2VlIHN0eWxpbmcudHMjZGlyZWN0aXZlcyBmb3IgbW9yZSBpbmZvcm1hdGlvbiBhYm91dCB0aGUgYWxnb3JpdGhtKS5cbiAqIEBwYXJhbSBmb3JjZU92ZXJyaWRlIHdoZXRoZXIgb3Igbm90IHRvIHNraXAgYWxsIGRpcmVjdGl2ZSBwcmlvcml0aXphdGlvblxuICogICAgYW5kIGp1c3QgYXBwbHkgdGhlIHZhbHVlIHJlZ2FyZGxlc3MuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB1cGRhdGVTdHlsZVByb3AoXG4gICAgY29udGV4dDogU3R5bGluZ0NvbnRleHQsIG9mZnNldDogbnVtYmVyLFxuICAgIGlucHV0OiBzdHJpbmcgfCBib29sZWFuIHwgbnVsbCB8IEJvdW5kUGxheWVyRmFjdG9yeTxzdHJpbmd8Ym9vbGVhbnxudWxsPiwgZGlyZWN0aXZlUmVmPzogYW55LFxuICAgIGZvcmNlT3ZlcnJpZGU/OiBib29sZWFuKTogdm9pZCB7XG4gIHVwZGF0ZVNpbmdsZVN0eWxpbmdWYWx1ZShjb250ZXh0LCBvZmZzZXQsIGlucHV0LCBmYWxzZSwgZGlyZWN0aXZlUmVmLCBmb3JjZU92ZXJyaWRlKTtcbn1cblxuZnVuY3Rpb24gdXBkYXRlU2luZ2xlU3R5bGluZ1ZhbHVlKFxuICAgIGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBvZmZzZXQ6IG51bWJlcixcbiAgICBpbnB1dDogc3RyaW5nIHwgYm9vbGVhbiB8IG51bGwgfCBCb3VuZFBsYXllckZhY3Rvcnk8c3RyaW5nfGJvb2xlYW58bnVsbD4sIGlzQ2xhc3NCYXNlZDogYm9vbGVhbixcbiAgICBkaXJlY3RpdmVSZWY6IGFueSwgZm9yY2VPdmVycmlkZT86IGJvb2xlYW4pOiB2b2lkIHtcbiAgY29uc3QgZGlyZWN0aXZlSW5kZXggPSBnZXREaXJlY3RpdmVJbmRleEZyb21SZWdpc3RyeShjb250ZXh0LCBkaXJlY3RpdmVSZWYgfHwgbnVsbCk7XG4gIGNvbnN0IHNpbmdsZUluZGV4ID0gZ2V0U2luZ2xlUHJvcEluZGV4VmFsdWUoY29udGV4dCwgZGlyZWN0aXZlSW5kZXgsIG9mZnNldCwgaXNDbGFzc0Jhc2VkKTtcbiAgY29uc3QgY3VyclZhbHVlID0gZ2V0VmFsdWUoY29udGV4dCwgc2luZ2xlSW5kZXgpO1xuICBjb25zdCBjdXJyRmxhZyA9IGdldFBvaW50ZXJzKGNvbnRleHQsIHNpbmdsZUluZGV4KTtcbiAgY29uc3QgY3VyckRpcmVjdGl2ZSA9IGdldERpcmVjdGl2ZUluZGV4RnJvbUVudHJ5KGNvbnRleHQsIHNpbmdsZUluZGV4KTtcbiAgY29uc3QgdmFsdWU6IHN0cmluZ3xib29sZWFufG51bGwgPSAoaW5wdXQgaW5zdGFuY2VvZiBCb3VuZFBsYXllckZhY3RvcnkpID8gaW5wdXQudmFsdWUgOiBpbnB1dDtcblxuICBpZiAoaGFzVmFsdWVDaGFuZ2VkKGN1cnJGbGFnLCBjdXJyVmFsdWUsIHZhbHVlKSAmJlxuICAgICAgKGZvcmNlT3ZlcnJpZGUgfHwgYWxsb3dWYWx1ZUNoYW5nZShjdXJyVmFsdWUsIHZhbHVlLCBjdXJyRGlyZWN0aXZlLCBkaXJlY3RpdmVJbmRleCkpKSB7XG4gICAgY29uc3QgaXNDbGFzc0Jhc2VkID0gKGN1cnJGbGFnICYgU3R5bGluZ0ZsYWdzLkNsYXNzKSA9PT0gU3R5bGluZ0ZsYWdzLkNsYXNzO1xuICAgIGNvbnN0IGVsZW1lbnQgPSBjb250ZXh0W1N0eWxpbmdJbmRleC5FbGVtZW50UG9zaXRpb25dICFhcyBIVE1MRWxlbWVudDtcbiAgICBjb25zdCBwbGF5ZXJCdWlsZGVyID0gaW5wdXQgaW5zdGFuY2VvZiBCb3VuZFBsYXllckZhY3RvcnkgP1xuICAgICAgICBuZXcgQ2xhc3NBbmRTdHlsZVBsYXllckJ1aWxkZXIoXG4gICAgICAgICAgICBpbnB1dCBhcyBhbnksIGVsZW1lbnQsIGlzQ2xhc3NCYXNlZCA/IEJpbmRpbmdUeXBlLkNsYXNzIDogQmluZGluZ1R5cGUuU3R5bGUpIDpcbiAgICAgICAgbnVsbDtcbiAgICBjb25zdCB2YWx1ZSA9IChwbGF5ZXJCdWlsZGVyID8gKGlucHV0IGFzIEJvdW5kUGxheWVyRmFjdG9yeTxhbnk+KS52YWx1ZSA6IGlucHV0KSBhcyBzdHJpbmcgfFxuICAgICAgICBib29sZWFuIHwgbnVsbDtcbiAgICBjb25zdCBjdXJyUGxheWVySW5kZXggPSBnZXRQbGF5ZXJCdWlsZGVySW5kZXgoY29udGV4dCwgc2luZ2xlSW5kZXgpO1xuXG4gICAgbGV0IHBsYXllckJ1aWxkZXJzQXJlRGlydHkgPSBmYWxzZTtcbiAgICBsZXQgcGxheWVyQnVpbGRlckluZGV4ID0gcGxheWVyQnVpbGRlciA/IGN1cnJQbGF5ZXJJbmRleCA6IDA7XG4gICAgaWYgKGhhc1BsYXllckJ1aWxkZXJDaGFuZ2VkKGNvbnRleHQsIHBsYXllckJ1aWxkZXIsIGN1cnJQbGF5ZXJJbmRleCkpIHtcbiAgICAgIGNvbnN0IG5ld0luZGV4ID0gc2V0UGxheWVyQnVpbGRlcihjb250ZXh0LCBwbGF5ZXJCdWlsZGVyLCBjdXJyUGxheWVySW5kZXgpO1xuICAgICAgcGxheWVyQnVpbGRlckluZGV4ID0gcGxheWVyQnVpbGRlciA/IG5ld0luZGV4IDogMDtcbiAgICAgIHBsYXllckJ1aWxkZXJzQXJlRGlydHkgPSB0cnVlO1xuICAgIH1cblxuICAgIGlmIChwbGF5ZXJCdWlsZGVyc0FyZURpcnR5IHx8IGN1cnJEaXJlY3RpdmUgIT09IGRpcmVjdGl2ZUluZGV4KSB7XG4gICAgICBzZXRQbGF5ZXJCdWlsZGVySW5kZXgoY29udGV4dCwgc2luZ2xlSW5kZXgsIHBsYXllckJ1aWxkZXJJbmRleCwgZGlyZWN0aXZlSW5kZXgpO1xuICAgIH1cblxuICAgIGlmIChjdXJyRGlyZWN0aXZlICE9PSBkaXJlY3RpdmVJbmRleCkge1xuICAgICAgY29uc3QgcHJvcCA9IGdldFByb3AoY29udGV4dCwgc2luZ2xlSW5kZXgpO1xuICAgICAgY29uc3Qgc2FuaXRpemVyID0gZ2V0U3R5bGVTYW5pdGl6ZXIoY29udGV4dCwgZGlyZWN0aXZlSW5kZXgpO1xuICAgICAgc2V0U2FuaXRpemVGbGFnKGNvbnRleHQsIHNpbmdsZUluZGV4LCAoc2FuaXRpemVyICYmIHNhbml0aXplcihwcm9wKSkgPyB0cnVlIDogZmFsc2UpO1xuICAgIH1cblxuICAgIC8vIHRoZSB2YWx1ZSB3aWxsIGFsd2F5cyBnZXQgdXBkYXRlZCAoZXZlbiBpZiB0aGUgZGlydHkgZmxhZyBpcyBza2lwcGVkKVxuICAgIHNldFZhbHVlKGNvbnRleHQsIHNpbmdsZUluZGV4LCB2YWx1ZSk7XG4gICAgY29uc3QgaW5kZXhGb3JNdWx0aSA9IGdldE11bHRpT3JTaW5nbGVJbmRleChjdXJyRmxhZyk7XG5cbiAgICAvLyBpZiB0aGUgdmFsdWUgaXMgdGhlIHNhbWUgaW4gdGhlIG11bHRpLWFyZWEgdGhlbiB0aGVyZSdzIG5vIHBvaW50IGluIHJlLWFzc2VtYmxpbmdcbiAgICBjb25zdCB2YWx1ZUZvck11bHRpID0gZ2V0VmFsdWUoY29udGV4dCwgaW5kZXhGb3JNdWx0aSk7XG4gICAgaWYgKCF2YWx1ZUZvck11bHRpIHx8IGhhc1ZhbHVlQ2hhbmdlZChjdXJyRmxhZywgdmFsdWVGb3JNdWx0aSwgdmFsdWUpKSB7XG4gICAgICBsZXQgbXVsdGlEaXJ0eSA9IGZhbHNlO1xuICAgICAgbGV0IHNpbmdsZURpcnR5ID0gdHJ1ZTtcblxuICAgICAgLy8gb25seSB3aGVuIHRoZSB2YWx1ZSBpcyBzZXQgdG8gYG51bGxgIHNob3VsZCB0aGUgbXVsdGktdmFsdWUgZ2V0IGZsYWdnZWRcbiAgICAgIGlmICghdmFsdWVFeGlzdHModmFsdWUsIGlzQ2xhc3NCYXNlZCkgJiYgdmFsdWVFeGlzdHModmFsdWVGb3JNdWx0aSwgaXNDbGFzc0Jhc2VkKSkge1xuICAgICAgICBtdWx0aURpcnR5ID0gdHJ1ZTtcbiAgICAgICAgc2luZ2xlRGlydHkgPSBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgc2V0RGlydHkoY29udGV4dCwgaW5kZXhGb3JNdWx0aSwgbXVsdGlEaXJ0eSk7XG4gICAgICBzZXREaXJ0eShjb250ZXh0LCBzaW5nbGVJbmRleCwgc2luZ2xlRGlydHkpO1xuICAgICAgc2V0RGlyZWN0aXZlRGlydHkoY29udGV4dCwgZGlyZWN0aXZlSW5kZXgsIHRydWUpO1xuICAgICAgc2V0Q29udGV4dERpcnR5KGNvbnRleHQsIHRydWUpO1xuICAgIH1cblxuICAgIGlmIChwbGF5ZXJCdWlsZGVyc0FyZURpcnR5KSB7XG4gICAgICBzZXRDb250ZXh0UGxheWVyc0RpcnR5KGNvbnRleHQsIHRydWUpO1xuICAgIH1cbiAgfVxufVxuXG5cbi8qKlxuICogUmVuZGVycyBhbGwgcXVldWVkIHN0eWxpbmcgdXNpbmcgYSByZW5kZXJlciBvbnRvIHRoZSBnaXZlbiBlbGVtZW50LlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gd29ya3MgYnkgcmVuZGVyaW5nIGFueSBzdHlsZXMgKHRoYXQgaGF2ZSBiZWVuIGFwcGxpZWRcbiAqIHVzaW5nIGB1cGRhdGVTdHlsaW5nTWFwYCkgYW5kIGFueSBjbGFzc2VzICh0aGF0IGhhdmUgYmVlbiBhcHBsaWVkIHVzaW5nXG4gKiBgdXBkYXRlU3R5bGVQcm9wYCkgb250byB0aGUgcHJvdmlkZWQgZWxlbWVudCB1c2luZyB0aGUgcHJvdmlkZWQgcmVuZGVyZXIuXG4gKiBKdXN0IGJlZm9yZSB0aGUgc3R5bGVzL2NsYXNzZXMgYXJlIHJlbmRlcmVkIGEgZmluYWwga2V5L3ZhbHVlIHN0eWxlIG1hcFxuICogd2lsbCBiZSBhc3NlbWJsZWQgKGlmIGBzdHlsZVN0b3JlYCBvciBgY2xhc3NTdG9yZWAgYXJlIHByb3ZpZGVkKS5cbiAqXG4gKiBAcGFyYW0gbEVsZW1lbnQgdGhlIGVsZW1lbnQgdGhhdCB0aGUgc3R5bGVzIHdpbGwgYmUgcmVuZGVyZWQgb25cbiAqIEBwYXJhbSBjb250ZXh0IFRoZSBzdHlsaW5nIGNvbnRleHQgdGhhdCB3aWxsIGJlIHVzZWQgdG8gZGV0ZXJtaW5lXG4gKiAgICAgIHdoYXQgc3R5bGVzIHdpbGwgYmUgcmVuZGVyZWRcbiAqIEBwYXJhbSByZW5kZXJlciB0aGUgcmVuZGVyZXIgdGhhdCB3aWxsIGJlIHVzZWQgdG8gYXBwbHkgdGhlIHN0eWxpbmdcbiAqIEBwYXJhbSBjbGFzc2VzU3RvcmUgaWYgcHJvdmlkZWQsIHRoZSB1cGRhdGVkIGNsYXNzIHZhbHVlcyB3aWxsIGJlIGFwcGxpZWRcbiAqICAgIHRvIHRoaXMga2V5L3ZhbHVlIG1hcCBpbnN0ZWFkIG9mIGJlaW5nIHJlbmRlcmVyZWQgdmlhIHRoZSByZW5kZXJlci5cbiAqIEBwYXJhbSBzdHlsZXNTdG9yZSBpZiBwcm92aWRlZCwgdGhlIHVwZGF0ZWQgc3R5bGUgdmFsdWVzIHdpbGwgYmUgYXBwbGllZFxuICogICAgdG8gdGhpcyBrZXkvdmFsdWUgbWFwIGluc3RlYWQgb2YgYmVpbmcgcmVuZGVyZXJlZCB2aWEgdGhlIHJlbmRlcmVyLlxuICogQHBhcmFtIGRpcmVjdGl2ZVJlZiBhbiBvcHRpb25hbCBkaXJlY3RpdmUgdGhhdCB3aWxsIGJlIHVzZWQgdG8gdGFyZ2V0IHdoaWNoXG4gKiAgICBzdHlsaW5nIHZhbHVlcyBhcmUgcmVuZGVyZWQuIElmIGxlZnQgZW1wdHksIG9ubHkgdGhlIGJpbmRpbmdzIHRoYXQgYXJlXG4gKiAgICByZWdpc3RlcmVkIG9uIHRoZSB0ZW1wbGF0ZSB3aWxsIGJlIHJlbmRlcmVkLlxuICogQHJldHVybnMgbnVtYmVyIHRoZSB0b3RhbCBhbW91bnQgb2YgcGxheWVycyB0aGF0IGdvdCBxdWV1ZWQgZm9yIGFuaW1hdGlvbiAoaWYgYW55KVxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVuZGVyU3R5bGluZyhcbiAgICBjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgcmVuZGVyZXI6IFJlbmRlcmVyMywgcm9vdE9yVmlldzogUm9vdENvbnRleHQgfCBMVmlldyxcbiAgICBpc0ZpcnN0UmVuZGVyOiBib29sZWFuLCBjbGFzc2VzU3RvcmU/OiBCaW5kaW5nU3RvcmUgfCBudWxsLCBzdHlsZXNTdG9yZT86IEJpbmRpbmdTdG9yZSB8IG51bGwsXG4gICAgZGlyZWN0aXZlUmVmPzogYW55KTogbnVtYmVyIHtcbiAgbGV0IHRvdGFsUGxheWVyc1F1ZXVlZCA9IDA7XG4gIGNvbnN0IHRhcmdldERpcmVjdGl2ZUluZGV4ID0gZ2V0RGlyZWN0aXZlSW5kZXhGcm9tUmVnaXN0cnkoY29udGV4dCwgZGlyZWN0aXZlUmVmIHx8IG51bGwpO1xuXG4gIGlmIChpc0NvbnRleHREaXJ0eShjb250ZXh0KSAmJiBpc0RpcmVjdGl2ZURpcnR5KGNvbnRleHQsIHRhcmdldERpcmVjdGl2ZUluZGV4KSkge1xuICAgIGNvbnN0IGZsdXNoUGxheWVyQnVpbGRlcnM6IGFueSA9XG4gICAgICAgIGNvbnRleHRbU3R5bGluZ0luZGV4Lk1hc3RlckZsYWdQb3NpdGlvbl0gJiBTdHlsaW5nRmxhZ3MuUGxheWVyQnVpbGRlcnNEaXJ0eTtcbiAgICBjb25zdCBuYXRpdmUgPSBjb250ZXh0W1N0eWxpbmdJbmRleC5FbGVtZW50UG9zaXRpb25dICE7XG4gICAgY29uc3QgbXVsdGlTdGFydEluZGV4ID0gZ2V0TXVsdGlTdHlsZXNTdGFydEluZGV4KGNvbnRleHQpO1xuXG4gICAgbGV0IHN0aWxsRGlydHkgPSBmYWxzZTtcbiAgICBmb3IgKGxldCBpID0gU3R5bGluZ0luZGV4LlNpbmdsZVN0eWxlc1N0YXJ0UG9zaXRpb247IGkgPCBjb250ZXh0Lmxlbmd0aDtcbiAgICAgICAgIGkgKz0gU3R5bGluZ0luZGV4LlNpemUpIHtcbiAgICAgIC8vIHRoZXJlIGlzIG5vIHBvaW50IGluIHJlbmRlcmluZyBzdHlsZXMgdGhhdCBoYXZlIG5vdCBjaGFuZ2VkIG9uIHNjcmVlblxuICAgICAgaWYgKGlzRGlydHkoY29udGV4dCwgaSkpIHtcbiAgICAgICAgY29uc3QgZmxhZyA9IGdldFBvaW50ZXJzKGNvbnRleHQsIGkpO1xuICAgICAgICBjb25zdCBkaXJlY3RpdmVJbmRleCA9IGdldERpcmVjdGl2ZUluZGV4RnJvbUVudHJ5KGNvbnRleHQsIGkpO1xuICAgICAgICBpZiAodGFyZ2V0RGlyZWN0aXZlSW5kZXggIT09IGRpcmVjdGl2ZUluZGV4KSB7XG4gICAgICAgICAgc3RpbGxEaXJ0eSA9IHRydWU7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBwcm9wID0gZ2V0UHJvcChjb250ZXh0LCBpKTtcbiAgICAgICAgY29uc3QgdmFsdWUgPSBnZXRWYWx1ZShjb250ZXh0LCBpKTtcbiAgICAgICAgY29uc3Qgc3R5bGVTYW5pdGl6ZXIgPVxuICAgICAgICAgICAgKGZsYWcgJiBTdHlsaW5nRmxhZ3MuU2FuaXRpemUpID8gZ2V0U3R5bGVTYW5pdGl6ZXIoY29udGV4dCwgZGlyZWN0aXZlSW5kZXgpIDogbnVsbDtcbiAgICAgICAgY29uc3QgcGxheWVyQnVpbGRlciA9IGdldFBsYXllckJ1aWxkZXIoY29udGV4dCwgaSk7XG4gICAgICAgIGNvbnN0IGlzQ2xhc3NCYXNlZCA9IGZsYWcgJiBTdHlsaW5nRmxhZ3MuQ2xhc3MgPyB0cnVlIDogZmFsc2U7XG4gICAgICAgIGNvbnN0IGlzSW5TaW5nbGVSZWdpb24gPSBpIDwgbXVsdGlTdGFydEluZGV4O1xuXG4gICAgICAgIGxldCB2YWx1ZVRvQXBwbHk6IHN0cmluZ3xib29sZWFufG51bGwgPSB2YWx1ZTtcblxuICAgICAgICAvLyBWQUxVRSBERUZFUiBDQVNFIDE6IFVzZSBhIG11bHRpIHZhbHVlIGluc3RlYWQgb2YgYSBudWxsIHNpbmdsZSB2YWx1ZVxuICAgICAgICAvLyB0aGlzIGNoZWNrIGltcGxpZXMgdGhhdCBhIHNpbmdsZSB2YWx1ZSB3YXMgcmVtb3ZlZCBhbmQgd2VcbiAgICAgICAgLy8gc2hvdWxkIG5vdyBkZWZlciB0byBhIG11bHRpIHZhbHVlIGFuZCB1c2UgdGhhdCAoaWYgc2V0KS5cbiAgICAgICAgaWYgKGlzSW5TaW5nbGVSZWdpb24gJiYgIXZhbHVlRXhpc3RzKHZhbHVlVG9BcHBseSwgaXNDbGFzc0Jhc2VkKSkge1xuICAgICAgICAgIC8vIHNpbmdsZSB2YWx1ZXMgQUxXQVlTIGhhdmUgYSByZWZlcmVuY2UgdG8gYSBtdWx0aSBpbmRleFxuICAgICAgICAgIGNvbnN0IG11bHRpSW5kZXggPSBnZXRNdWx0aU9yU2luZ2xlSW5kZXgoZmxhZyk7XG4gICAgICAgICAgdmFsdWVUb0FwcGx5ID0gZ2V0VmFsdWUoY29udGV4dCwgbXVsdGlJbmRleCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBWQUxVRSBERUZFUiBDQVNFIDI6IFVzZSB0aGUgaW5pdGlhbCB2YWx1ZSBpZiBhbGwgZWxzZSBmYWlscyAoaXMgZmFsc3kpXG4gICAgICAgIC8vIHRoZSBpbml0aWFsIHZhbHVlIHdpbGwgYWx3YXlzIGJlIGEgc3RyaW5nIG9yIG51bGwsXG4gICAgICAgIC8vIHRoZXJlZm9yZSB3ZSBjYW4gc2FmZWx5IGFkb3B0IGl0IGluY2FzZSB0aGVyZSdzIG5vdGhpbmcgZWxzZVxuICAgICAgICAvLyBub3RlIHRoYXQgdGhpcyBzaG91bGQgYWx3YXlzIGJlIGEgZmFsc3kgY2hlY2sgc2luY2UgYGZhbHNlYCBpcyB1c2VkXG4gICAgICAgIC8vIGZvciBib3RoIGNsYXNzIGFuZCBzdHlsZSBjb21wYXJpc29ucyAoc3R5bGVzIGNhbid0IGJlIGZhbHNlIGFuZCBmYWxzZVxuICAgICAgICAvLyBjbGFzc2VzIGFyZSB0dXJuZWQgb2ZmIGFuZCBzaG91bGQgdGhlcmVmb3JlIGRlZmVyIHRvIHRoZWlyIGluaXRpYWwgdmFsdWVzKVxuICAgICAgICAvLyBOb3RlIHRoYXQgd2UgaWdub3JlIGNsYXNzLWJhc2VkIGRlZmVyYWxzIGJlY2F1c2Ugb3RoZXJ3aXNlIGEgY2xhc3MgY2FuIG5ldmVyXG4gICAgICAgIC8vIGJlIHJlbW92ZWQgaW4gdGhlIGNhc2UgdGhhdCBpdCBleGlzdHMgYXMgdHJ1ZSBpbiB0aGUgaW5pdGlhbCBjbGFzc2VzIGxpc3QuLi5cbiAgICAgICAgaWYgKCF2YWx1ZUV4aXN0cyh2YWx1ZVRvQXBwbHksIGlzQ2xhc3NCYXNlZCkpIHtcbiAgICAgICAgICB2YWx1ZVRvQXBwbHkgPSBnZXRJbml0aWFsVmFsdWUoY29udGV4dCwgZmxhZyk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBpZiB0aGUgZmlyc3QgcmVuZGVyIGlzIHRydWUgdGhlbiB3ZSBkbyBub3Qgd2FudCB0byBzdGFydCBhcHBseWluZyBmYWxzeVxuICAgICAgICAvLyB2YWx1ZXMgdG8gdGhlIERPTSBlbGVtZW50J3Mgc3R5bGluZy4gT3RoZXJ3aXNlIHRoZW4gd2Uga25vdyB0aGVyZSBoYXNcbiAgICAgICAgLy8gYmVlbiBhIGNoYW5nZSBhbmQgZXZlbiBpZiBpdCdzIGZhbHN5IHRoZW4gaXQncyByZW1vdmluZyBzb21ldGhpbmcgdGhhdFxuICAgICAgICAvLyB3YXMgdHJ1dGh5IGJlZm9yZS5cbiAgICAgICAgY29uc3QgZG9BcHBseVZhbHVlID0gaXNGaXJzdFJlbmRlciA/IHZhbHVlVG9BcHBseSA6IHRydWU7XG4gICAgICAgIGlmIChkb0FwcGx5VmFsdWUpIHtcbiAgICAgICAgICBpZiAoaXNDbGFzc0Jhc2VkKSB7XG4gICAgICAgICAgICBzZXRDbGFzcyhcbiAgICAgICAgICAgICAgICBuYXRpdmUsIHByb3AsIHZhbHVlVG9BcHBseSA/IHRydWUgOiBmYWxzZSwgcmVuZGVyZXIsIGNsYXNzZXNTdG9yZSwgcGxheWVyQnVpbGRlcik7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNldFN0eWxlKFxuICAgICAgICAgICAgICAgIG5hdGl2ZSwgcHJvcCwgdmFsdWVUb0FwcGx5IGFzIHN0cmluZyB8IG51bGwsIHJlbmRlcmVyLCBzdHlsZVNhbml0aXplciwgc3R5bGVzU3RvcmUsXG4gICAgICAgICAgICAgICAgcGxheWVyQnVpbGRlcik7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgc2V0RGlydHkoY29udGV4dCwgaSwgZmFsc2UpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChmbHVzaFBsYXllckJ1aWxkZXJzKSB7XG4gICAgICBjb25zdCByb290Q29udGV4dCA9XG4gICAgICAgICAgQXJyYXkuaXNBcnJheShyb290T3JWaWV3KSA/IGdldFJvb3RDb250ZXh0KHJvb3RPclZpZXcpIDogcm9vdE9yVmlldyBhcyBSb290Q29udGV4dDtcbiAgICAgIGNvbnN0IHBsYXllckNvbnRleHQgPSBnZXRQbGF5ZXJDb250ZXh0KGNvbnRleHQpICE7XG4gICAgICBjb25zdCBwbGF5ZXJzU3RhcnRJbmRleCA9IHBsYXllckNvbnRleHRbUGxheWVySW5kZXguTm9uQnVpbGRlclBsYXllcnNTdGFydF07XG4gICAgICBmb3IgKGxldCBpID0gUGxheWVySW5kZXguUGxheWVyQnVpbGRlcnNTdGFydFBvc2l0aW9uOyBpIDwgcGxheWVyc1N0YXJ0SW5kZXg7XG4gICAgICAgICAgIGkgKz0gUGxheWVySW5kZXguUGxheWVyQW5kUGxheWVyQnVpbGRlcnNUdXBsZVNpemUpIHtcbiAgICAgICAgY29uc3QgYnVpbGRlciA9IHBsYXllckNvbnRleHRbaV0gYXMgQ2xhc3NBbmRTdHlsZVBsYXllckJ1aWxkZXI8YW55PnwgbnVsbDtcbiAgICAgICAgY29uc3QgcGxheWVySW5zZXJ0aW9uSW5kZXggPSBpICsgUGxheWVySW5kZXguUGxheWVyT2Zmc2V0UG9zaXRpb247XG4gICAgICAgIGNvbnN0IG9sZFBsYXllciA9IHBsYXllckNvbnRleHRbcGxheWVySW5zZXJ0aW9uSW5kZXhdIGFzIFBsYXllciB8IG51bGw7XG4gICAgICAgIGlmIChidWlsZGVyKSB7XG4gICAgICAgICAgY29uc3QgcGxheWVyID0gYnVpbGRlci5idWlsZFBsYXllcihvbGRQbGF5ZXIsIGlzRmlyc3RSZW5kZXIpO1xuICAgICAgICAgIGlmIChwbGF5ZXIgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgaWYgKHBsYXllciAhPSBudWxsKSB7XG4gICAgICAgICAgICAgIGNvbnN0IHdhc1F1ZXVlZCA9IGFkZFBsYXllckludGVybmFsKFxuICAgICAgICAgICAgICAgICAgcGxheWVyQ29udGV4dCwgcm9vdENvbnRleHQsIG5hdGl2ZSBhcyBIVE1MRWxlbWVudCwgcGxheWVyLCBwbGF5ZXJJbnNlcnRpb25JbmRleCk7XG4gICAgICAgICAgICAgIHdhc1F1ZXVlZCAmJiB0b3RhbFBsYXllcnNRdWV1ZWQrKztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChvbGRQbGF5ZXIpIHtcbiAgICAgICAgICAgICAgb2xkUGxheWVyLmRlc3Ryb3koKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAob2xkUGxheWVyKSB7XG4gICAgICAgICAgLy8gdGhlIHBsYXllciBidWlsZGVyIGhhcyBiZWVuIHJlbW92ZWQgLi4uIHRoZXJlZm9yZSB3ZSBzaG91bGQgZGVsZXRlIHRoZSBhc3NvY2lhdGVkXG4gICAgICAgICAgLy8gcGxheWVyXG4gICAgICAgICAgb2xkUGxheWVyLmRlc3Ryb3koKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgc2V0Q29udGV4dFBsYXllcnNEaXJ0eShjb250ZXh0LCBmYWxzZSk7XG4gICAgfVxuXG4gICAgc2V0RGlyZWN0aXZlRGlydHkoY29udGV4dCwgdGFyZ2V0RGlyZWN0aXZlSW5kZXgsIGZhbHNlKTtcbiAgICBzZXRDb250ZXh0RGlydHkoY29udGV4dCwgc3RpbGxEaXJ0eSk7XG4gIH1cblxuICByZXR1cm4gdG90YWxQbGF5ZXJzUXVldWVkO1xufVxuXG4vKipcbiAqIEFzc2lnbnMgYSBzdHlsZSB2YWx1ZSB0byBhIHN0eWxlIHByb3BlcnR5IGZvciB0aGUgZ2l2ZW4gZWxlbWVudC5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIHJlbmRlcnMgYSBnaXZlbiBDU1MgcHJvcC92YWx1ZSBlbnRyeSB1c2luZyB0aGVcbiAqIHByb3ZpZGVkIHJlbmRlcmVyLiBJZiBhIGBzdG9yZWAgdmFsdWUgaXMgcHJvdmlkZWQgdGhlblxuICogdGhhdCB3aWxsIGJlIHVzZWQgYSByZW5kZXIgY29udGV4dCBpbnN0ZWFkIG9mIHRoZSBwcm92aWRlZFxuICogcmVuZGVyZXIuXG4gKlxuICogQHBhcmFtIG5hdGl2ZSB0aGUgRE9NIEVsZW1lbnRcbiAqIEBwYXJhbSBwcm9wIHRoZSBDU1Mgc3R5bGUgcHJvcGVydHkgdGhhdCB3aWxsIGJlIHJlbmRlcmVkXG4gKiBAcGFyYW0gdmFsdWUgdGhlIENTUyBzdHlsZSB2YWx1ZSB0aGF0IHdpbGwgYmUgcmVuZGVyZWRcbiAqIEBwYXJhbSByZW5kZXJlclxuICogQHBhcmFtIHN0b3JlIGFuIG9wdGlvbmFsIGtleS92YWx1ZSBtYXAgdGhhdCB3aWxsIGJlIHVzZWQgYXMgYSBjb250ZXh0IHRvIHJlbmRlciBzdHlsZXMgb25cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNldFN0eWxlKFxuICAgIG5hdGl2ZTogYW55LCBwcm9wOiBzdHJpbmcsIHZhbHVlOiBzdHJpbmcgfCBudWxsLCByZW5kZXJlcjogUmVuZGVyZXIzLFxuICAgIHNhbml0aXplcjogU3R5bGVTYW5pdGl6ZUZuIHwgbnVsbCwgc3RvcmU/OiBCaW5kaW5nU3RvcmUgfCBudWxsLFxuICAgIHBsYXllckJ1aWxkZXI/OiBDbGFzc0FuZFN0eWxlUGxheWVyQnVpbGRlcjxhbnk+fCBudWxsKSB7XG4gIHZhbHVlID0gc2FuaXRpemVyICYmIHZhbHVlID8gc2FuaXRpemVyKHByb3AsIHZhbHVlKSA6IHZhbHVlO1xuICBpZiAoc3RvcmUgfHwgcGxheWVyQnVpbGRlcikge1xuICAgIGlmIChzdG9yZSkge1xuICAgICAgc3RvcmUuc2V0VmFsdWUocHJvcCwgdmFsdWUpO1xuICAgIH1cbiAgICBpZiAocGxheWVyQnVpbGRlcikge1xuICAgICAgcGxheWVyQnVpbGRlci5zZXRWYWx1ZShwcm9wLCB2YWx1ZSk7XG4gICAgfVxuICB9IGVsc2UgaWYgKHZhbHVlKSB7XG4gICAgdmFsdWUgPSB2YWx1ZS50b1N0cmluZygpOyAgLy8gb3BhY2l0eSwgei1pbmRleCBhbmQgZmxleGJveCBhbGwgaGF2ZSBudW1iZXIgdmFsdWVzIHdoaWNoIG1heSBub3RcbiAgICAvLyBhc3NpZ24gYXMgbnVtYmVyc1xuICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJTZXRTdHlsZSsrO1xuICAgIGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSA/XG4gICAgICAgIHJlbmRlcmVyLnNldFN0eWxlKG5hdGl2ZSwgcHJvcCwgdmFsdWUsIFJlbmRlcmVyU3R5bGVGbGFnczMuRGFzaENhc2UpIDpcbiAgICAgICAgbmF0aXZlLnN0eWxlLnNldFByb3BlcnR5KHByb3AsIHZhbHVlKTtcbiAgfSBlbHNlIHtcbiAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyUmVtb3ZlU3R5bGUrKztcbiAgICBpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikgP1xuICAgICAgICByZW5kZXJlci5yZW1vdmVTdHlsZShuYXRpdmUsIHByb3AsIFJlbmRlcmVyU3R5bGVGbGFnczMuRGFzaENhc2UpIDpcbiAgICAgICAgbmF0aXZlLnN0eWxlLnJlbW92ZVByb3BlcnR5KHByb3ApO1xuICB9XG59XG5cbi8qKlxuICogQWRkcy9yZW1vdmVzIHRoZSBwcm92aWRlZCBjbGFzc05hbWUgdmFsdWUgdG8gdGhlIHByb3ZpZGVkIGVsZW1lbnQuXG4gKlxuICogVGhpcyBmdW5jdGlvbiByZW5kZXJzIGEgZ2l2ZW4gQ1NTIGNsYXNzIHZhbHVlIHVzaW5nIHRoZSBwcm92aWRlZFxuICogcmVuZGVyZXIgKGJ5IGFkZGluZyBvciByZW1vdmluZyBpdCBmcm9tIHRoZSBwcm92aWRlZCBlbGVtZW50KS5cbiAqIElmIGEgYHN0b3JlYCB2YWx1ZSBpcyBwcm92aWRlZCB0aGVuIHRoYXQgd2lsbCBiZSB1c2VkIGEgcmVuZGVyXG4gKiBjb250ZXh0IGluc3RlYWQgb2YgdGhlIHByb3ZpZGVkIHJlbmRlcmVyLlxuICpcbiAqIEBwYXJhbSBuYXRpdmUgdGhlIERPTSBFbGVtZW50XG4gKiBAcGFyYW0gcHJvcCB0aGUgQ1NTIHN0eWxlIHByb3BlcnR5IHRoYXQgd2lsbCBiZSByZW5kZXJlZFxuICogQHBhcmFtIHZhbHVlIHRoZSBDU1Mgc3R5bGUgdmFsdWUgdGhhdCB3aWxsIGJlIHJlbmRlcmVkXG4gKiBAcGFyYW0gcmVuZGVyZXJcbiAqIEBwYXJhbSBzdG9yZSBhbiBvcHRpb25hbCBrZXkvdmFsdWUgbWFwIHRoYXQgd2lsbCBiZSB1c2VkIGFzIGEgY29udGV4dCB0byByZW5kZXIgc3R5bGVzIG9uXG4gKi9cbmZ1bmN0aW9uIHNldENsYXNzKFxuICAgIG5hdGl2ZTogYW55LCBjbGFzc05hbWU6IHN0cmluZywgYWRkOiBib29sZWFuLCByZW5kZXJlcjogUmVuZGVyZXIzLCBzdG9yZT86IEJpbmRpbmdTdG9yZSB8IG51bGwsXG4gICAgcGxheWVyQnVpbGRlcj86IENsYXNzQW5kU3R5bGVQbGF5ZXJCdWlsZGVyPGFueT58IG51bGwpIHtcbiAgaWYgKHN0b3JlIHx8IHBsYXllckJ1aWxkZXIpIHtcbiAgICBpZiAoc3RvcmUpIHtcbiAgICAgIHN0b3JlLnNldFZhbHVlKGNsYXNzTmFtZSwgYWRkKTtcbiAgICB9XG4gICAgaWYgKHBsYXllckJ1aWxkZXIpIHtcbiAgICAgIHBsYXllckJ1aWxkZXIuc2V0VmFsdWUoY2xhc3NOYW1lLCBhZGQpO1xuICAgIH1cbiAgICAvLyBET01Ub2tlbkxpc3Qgd2lsbCB0aHJvdyBpZiB3ZSB0cnkgdG8gYWRkIG9yIHJlbW92ZSBhbiBlbXB0eSBzdHJpbmcuXG4gIH0gZWxzZSBpZiAoY2xhc3NOYW1lICE9PSAnJykge1xuICAgIGlmIChhZGQpIHtcbiAgICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJBZGRDbGFzcysrO1xuICAgICAgaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpID8gcmVuZGVyZXIuYWRkQ2xhc3MobmF0aXZlLCBjbGFzc05hbWUpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hdGl2ZVsnY2xhc3NMaXN0J10uYWRkKGNsYXNzTmFtZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJSZW1vdmVDbGFzcysrO1xuICAgICAgaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpID8gcmVuZGVyZXIucmVtb3ZlQ2xhc3MobmF0aXZlLCBjbGFzc05hbWUpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hdGl2ZVsnY2xhc3NMaXN0J10ucmVtb3ZlKGNsYXNzTmFtZSk7XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIHNldFNhbml0aXplRmxhZyhjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgaW5kZXg6IG51bWJlciwgc2FuaXRpemVZZXM6IGJvb2xlYW4pIHtcbiAgaWYgKHNhbml0aXplWWVzKSB7XG4gICAgKGNvbnRleHRbaW5kZXhdIGFzIG51bWJlcikgfD0gU3R5bGluZ0ZsYWdzLlNhbml0aXplO1xuICB9IGVsc2Uge1xuICAgIChjb250ZXh0W2luZGV4XSBhcyBudW1iZXIpICY9IH5TdHlsaW5nRmxhZ3MuU2FuaXRpemU7XG4gIH1cbn1cblxuZnVuY3Rpb24gc2V0RGlydHkoY29udGV4dDogU3R5bGluZ0NvbnRleHQsIGluZGV4OiBudW1iZXIsIGlzRGlydHlZZXM6IGJvb2xlYW4pIHtcbiAgY29uc3QgYWRqdXN0ZWRJbmRleCA9XG4gICAgICBpbmRleCA+PSBTdHlsaW5nSW5kZXguU2luZ2xlU3R5bGVzU3RhcnRQb3NpdGlvbiA/IChpbmRleCArIFN0eWxpbmdJbmRleC5GbGFnc09mZnNldCkgOiBpbmRleDtcbiAgaWYgKGlzRGlydHlZZXMpIHtcbiAgICAoY29udGV4dFthZGp1c3RlZEluZGV4XSBhcyBudW1iZXIpIHw9IFN0eWxpbmdGbGFncy5EaXJ0eTtcbiAgfSBlbHNlIHtcbiAgICAoY29udGV4dFthZGp1c3RlZEluZGV4XSBhcyBudW1iZXIpICY9IH5TdHlsaW5nRmxhZ3MuRGlydHk7XG4gIH1cbn1cblxuZnVuY3Rpb24gaXNEaXJ0eShjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgaW5kZXg6IG51bWJlcik6IGJvb2xlYW4ge1xuICBjb25zdCBhZGp1c3RlZEluZGV4ID1cbiAgICAgIGluZGV4ID49IFN0eWxpbmdJbmRleC5TaW5nbGVTdHlsZXNTdGFydFBvc2l0aW9uID8gKGluZGV4ICsgU3R5bGluZ0luZGV4LkZsYWdzT2Zmc2V0KSA6IGluZGV4O1xuICByZXR1cm4gKChjb250ZXh0W2FkanVzdGVkSW5kZXhdIGFzIG51bWJlcikgJiBTdHlsaW5nRmxhZ3MuRGlydHkpID09IFN0eWxpbmdGbGFncy5EaXJ0eTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzQ2xhc3NCYXNlZFZhbHVlKGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBpbmRleDogbnVtYmVyKTogYm9vbGVhbiB7XG4gIGNvbnN0IGFkanVzdGVkSW5kZXggPVxuICAgICAgaW5kZXggPj0gU3R5bGluZ0luZGV4LlNpbmdsZVN0eWxlc1N0YXJ0UG9zaXRpb24gPyAoaW5kZXggKyBTdHlsaW5nSW5kZXguRmxhZ3NPZmZzZXQpIDogaW5kZXg7XG4gIHJldHVybiAoKGNvbnRleHRbYWRqdXN0ZWRJbmRleF0gYXMgbnVtYmVyKSAmIFN0eWxpbmdGbGFncy5DbGFzcykgPT0gU3R5bGluZ0ZsYWdzLkNsYXNzO1xufVxuXG5mdW5jdGlvbiBpc1Nhbml0aXphYmxlKGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBpbmRleDogbnVtYmVyKTogYm9vbGVhbiB7XG4gIGNvbnN0IGFkanVzdGVkSW5kZXggPVxuICAgICAgaW5kZXggPj0gU3R5bGluZ0luZGV4LlNpbmdsZVN0eWxlc1N0YXJ0UG9zaXRpb24gPyAoaW5kZXggKyBTdHlsaW5nSW5kZXguRmxhZ3NPZmZzZXQpIDogaW5kZXg7XG4gIHJldHVybiAoKGNvbnRleHRbYWRqdXN0ZWRJbmRleF0gYXMgbnVtYmVyKSAmIFN0eWxpbmdGbGFncy5TYW5pdGl6ZSkgPT0gU3R5bGluZ0ZsYWdzLlNhbml0aXplO1xufVxuXG5mdW5jdGlvbiBwb2ludGVycyhjb25maWdGbGFnOiBudW1iZXIsIHN0YXRpY0luZGV4OiBudW1iZXIsIGR5bmFtaWNJbmRleDogbnVtYmVyKSB7XG4gIHJldHVybiAoY29uZmlnRmxhZyAmIFN0eWxpbmdGbGFncy5CaXRNYXNrKSB8IChzdGF0aWNJbmRleCA8PCBTdHlsaW5nRmxhZ3MuQml0Q291bnRTaXplKSB8XG4gICAgICAoZHluYW1pY0luZGV4IDw8IChTdHlsaW5nSW5kZXguQml0Q291bnRTaXplICsgU3R5bGluZ0ZsYWdzLkJpdENvdW50U2l6ZSkpO1xufVxuXG5mdW5jdGlvbiBnZXRJbml0aWFsVmFsdWUoY29udGV4dDogU3R5bGluZ0NvbnRleHQsIGZsYWc6IG51bWJlcik6IHN0cmluZ3xib29sZWFufG51bGwge1xuICBjb25zdCBpbmRleCA9IGdldEluaXRpYWxJbmRleChmbGFnKTtcbiAgY29uc3QgZW50cnlJc0NsYXNzQmFzZWQgPSBmbGFnICYgU3R5bGluZ0ZsYWdzLkNsYXNzO1xuICBjb25zdCBpbml0aWFsVmFsdWVzID0gZW50cnlJc0NsYXNzQmFzZWQgPyBjb250ZXh0W1N0eWxpbmdJbmRleC5Jbml0aWFsQ2xhc3NWYWx1ZXNQb3NpdGlvbl0gOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250ZXh0W1N0eWxpbmdJbmRleC5Jbml0aWFsU3R5bGVWYWx1ZXNQb3NpdGlvbl07XG4gIHJldHVybiBpbml0aWFsVmFsdWVzW2luZGV4XSBhcyBzdHJpbmcgfCBib29sZWFuIHwgbnVsbDtcbn1cblxuZnVuY3Rpb24gZ2V0SW5pdGlhbEluZGV4KGZsYWc6IG51bWJlcik6IG51bWJlciB7XG4gIHJldHVybiAoZmxhZyA+PiBTdHlsaW5nRmxhZ3MuQml0Q291bnRTaXplKSAmIFN0eWxpbmdJbmRleC5CaXRNYXNrO1xufVxuXG5mdW5jdGlvbiBnZXRNdWx0aU9yU2luZ2xlSW5kZXgoZmxhZzogbnVtYmVyKTogbnVtYmVyIHtcbiAgY29uc3QgaW5kZXggPVxuICAgICAgKGZsYWcgPj4gKFN0eWxpbmdJbmRleC5CaXRDb3VudFNpemUgKyBTdHlsaW5nRmxhZ3MuQml0Q291bnRTaXplKSkgJiBTdHlsaW5nSW5kZXguQml0TWFzaztcbiAgcmV0dXJuIGluZGV4ID49IFN0eWxpbmdJbmRleC5TaW5nbGVTdHlsZXNTdGFydFBvc2l0aW9uID8gaW5kZXggOiAtMTtcbn1cblxuZnVuY3Rpb24gZ2V0TXVsdGlTdGFydEluZGV4KGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0KTogbnVtYmVyIHtcbiAgcmV0dXJuIGdldE11bHRpT3JTaW5nbGVJbmRleChjb250ZXh0W1N0eWxpbmdJbmRleC5NYXN0ZXJGbGFnUG9zaXRpb25dKSBhcyBudW1iZXI7XG59XG5cbmZ1bmN0aW9uIGdldE11bHRpQ2xhc3Nlc1N0YXJ0SW5kZXgoY29udGV4dDogU3R5bGluZ0NvbnRleHQpOiBudW1iZXIge1xuICBjb25zdCBjbGFzc0NhY2hlID0gY29udGV4dFtTdHlsaW5nSW5kZXguQ2FjaGVkTXVsdGlDbGFzc2VzXTtcbiAgcmV0dXJuIGNsYXNzQ2FjaGVcbiAgICAgIFtNYXBCYXNlZE9mZnNldFZhbHVlc0luZGV4LlZhbHVlc1N0YXJ0UG9zaXRpb24gK1xuICAgICAgIE1hcEJhc2VkT2Zmc2V0VmFsdWVzSW5kZXguUG9zaXRpb25TdGFydE9mZnNldF07XG59XG5cbmZ1bmN0aW9uIGdldE11bHRpU3R5bGVzU3RhcnRJbmRleChjb250ZXh0OiBTdHlsaW5nQ29udGV4dCk6IG51bWJlciB7XG4gIGNvbnN0IHN0eWxlc0NhY2hlID0gY29udGV4dFtTdHlsaW5nSW5kZXguQ2FjaGVkTXVsdGlTdHlsZXNdO1xuICByZXR1cm4gc3R5bGVzQ2FjaGVcbiAgICAgIFtNYXBCYXNlZE9mZnNldFZhbHVlc0luZGV4LlZhbHVlc1N0YXJ0UG9zaXRpb24gK1xuICAgICAgIE1hcEJhc2VkT2Zmc2V0VmFsdWVzSW5kZXguUG9zaXRpb25TdGFydE9mZnNldF07XG59XG5cbmZ1bmN0aW9uIHNldFByb3AoY29udGV4dDogU3R5bGluZ0NvbnRleHQsIGluZGV4OiBudW1iZXIsIHByb3A6IHN0cmluZykge1xuICBjb250ZXh0W2luZGV4ICsgU3R5bGluZ0luZGV4LlByb3BlcnR5T2Zmc2V0XSA9IHByb3A7XG59XG5cbmZ1bmN0aW9uIHNldFZhbHVlKGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBpbmRleDogbnVtYmVyLCB2YWx1ZTogc3RyaW5nIHwgbnVsbCB8IGJvb2xlYW4pIHtcbiAgY29udGV4dFtpbmRleCArIFN0eWxpbmdJbmRleC5WYWx1ZU9mZnNldF0gPSB2YWx1ZTtcbn1cblxuZnVuY3Rpb24gaGFzUGxheWVyQnVpbGRlckNoYW5nZWQoXG4gICAgY29udGV4dDogU3R5bGluZ0NvbnRleHQsIGJ1aWxkZXI6IENsYXNzQW5kU3R5bGVQbGF5ZXJCdWlsZGVyPGFueT58IG51bGwsIGluZGV4OiBudW1iZXIpIHtcbiAgY29uc3QgcGxheWVyQ29udGV4dCA9IGNvbnRleHRbU3R5bGluZ0luZGV4LlBsYXllckNvbnRleHRdICE7XG4gIGlmIChidWlsZGVyKSB7XG4gICAgaWYgKCFwbGF5ZXJDb250ZXh0IHx8IGluZGV4ID09PSAwKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH0gZWxzZSBpZiAoIXBsYXllckNvbnRleHQpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgcmV0dXJuIHBsYXllckNvbnRleHRbaW5kZXhdICE9PSBidWlsZGVyO1xufVxuXG5mdW5jdGlvbiBzZXRQbGF5ZXJCdWlsZGVyKFxuICAgIGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBidWlsZGVyOiBDbGFzc0FuZFN0eWxlUGxheWVyQnVpbGRlcjxhbnk+fCBudWxsLFxuICAgIGluc2VydGlvbkluZGV4OiBudW1iZXIpOiBudW1iZXIge1xuICBsZXQgcGxheWVyQ29udGV4dCA9IGNvbnRleHRbU3R5bGluZ0luZGV4LlBsYXllckNvbnRleHRdIHx8IGFsbG9jUGxheWVyQ29udGV4dChjb250ZXh0KTtcbiAgaWYgKGluc2VydGlvbkluZGV4ID4gMCkge1xuICAgIHBsYXllckNvbnRleHRbaW5zZXJ0aW9uSW5kZXhdID0gYnVpbGRlcjtcbiAgfSBlbHNlIHtcbiAgICBpbnNlcnRpb25JbmRleCA9IHBsYXllckNvbnRleHRbUGxheWVySW5kZXguTm9uQnVpbGRlclBsYXllcnNTdGFydF07XG4gICAgcGxheWVyQ29udGV4dC5zcGxpY2UoaW5zZXJ0aW9uSW5kZXgsIDAsIGJ1aWxkZXIsIG51bGwpO1xuICAgIHBsYXllckNvbnRleHRbUGxheWVySW5kZXguTm9uQnVpbGRlclBsYXllcnNTdGFydF0gKz1cbiAgICAgICAgUGxheWVySW5kZXguUGxheWVyQW5kUGxheWVyQnVpbGRlcnNUdXBsZVNpemU7XG4gIH1cbiAgcmV0dXJuIGluc2VydGlvbkluZGV4O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZGlyZWN0aXZlT3duZXJQb2ludGVycyhkaXJlY3RpdmVJbmRleDogbnVtYmVyLCBwbGF5ZXJJbmRleDogbnVtYmVyKSB7XG4gIHJldHVybiAocGxheWVySW5kZXggPDwgRGlyZWN0aXZlT3duZXJBbmRQbGF5ZXJCdWlsZGVySW5kZXguQml0Q291bnRTaXplKSB8IGRpcmVjdGl2ZUluZGV4O1xufVxuXG5mdW5jdGlvbiBzZXRQbGF5ZXJCdWlsZGVySW5kZXgoXG4gICAgY29udGV4dDogU3R5bGluZ0NvbnRleHQsIGluZGV4OiBudW1iZXIsIHBsYXllckJ1aWxkZXJJbmRleDogbnVtYmVyLCBkaXJlY3RpdmVJbmRleDogbnVtYmVyKSB7XG4gIGNvbnN0IHZhbHVlID0gZGlyZWN0aXZlT3duZXJQb2ludGVycyhkaXJlY3RpdmVJbmRleCwgcGxheWVyQnVpbGRlckluZGV4KTtcbiAgY29udGV4dFtpbmRleCArIFN0eWxpbmdJbmRleC5QbGF5ZXJCdWlsZGVySW5kZXhPZmZzZXRdID0gdmFsdWU7XG59XG5cbmZ1bmN0aW9uIGdldFBsYXllckJ1aWxkZXJJbmRleChjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgaW5kZXg6IG51bWJlcik6IG51bWJlciB7XG4gIGNvbnN0IGZsYWcgPSBjb250ZXh0W2luZGV4ICsgU3R5bGluZ0luZGV4LlBsYXllckJ1aWxkZXJJbmRleE9mZnNldF0gYXMgbnVtYmVyO1xuICBjb25zdCBwbGF5ZXJCdWlsZGVySW5kZXggPSAoZmxhZyA+PiBEaXJlY3RpdmVPd25lckFuZFBsYXllckJ1aWxkZXJJbmRleC5CaXRDb3VudFNpemUpICZcbiAgICAgIERpcmVjdGl2ZU93bmVyQW5kUGxheWVyQnVpbGRlckluZGV4LkJpdE1hc2s7XG4gIHJldHVybiBwbGF5ZXJCdWlsZGVySW5kZXg7XG59XG5cbmZ1bmN0aW9uIGdldFBsYXllckJ1aWxkZXIoY29udGV4dDogU3R5bGluZ0NvbnRleHQsIGluZGV4OiBudW1iZXIpOiBDbGFzc0FuZFN0eWxlUGxheWVyQnVpbGRlcjxhbnk+fFxuICAgIG51bGwge1xuICBjb25zdCBwbGF5ZXJCdWlsZGVySW5kZXggPSBnZXRQbGF5ZXJCdWlsZGVySW5kZXgoY29udGV4dCwgaW5kZXgpO1xuICBpZiAocGxheWVyQnVpbGRlckluZGV4KSB7XG4gICAgY29uc3QgcGxheWVyQ29udGV4dCA9IGNvbnRleHRbU3R5bGluZ0luZGV4LlBsYXllckNvbnRleHRdO1xuICAgIGlmIChwbGF5ZXJDb250ZXh0KSB7XG4gICAgICByZXR1cm4gcGxheWVyQ29udGV4dFtwbGF5ZXJCdWlsZGVySW5kZXhdIGFzIENsYXNzQW5kU3R5bGVQbGF5ZXJCdWlsZGVyPGFueT58IG51bGw7XG4gICAgfVxuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG5mdW5jdGlvbiBzZXRGbGFnKGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBpbmRleDogbnVtYmVyLCBmbGFnOiBudW1iZXIpIHtcbiAgY29uc3QgYWRqdXN0ZWRJbmRleCA9XG4gICAgICBpbmRleCA9PT0gU3R5bGluZ0luZGV4Lk1hc3RlckZsYWdQb3NpdGlvbiA/IGluZGV4IDogKGluZGV4ICsgU3R5bGluZ0luZGV4LkZsYWdzT2Zmc2V0KTtcbiAgY29udGV4dFthZGp1c3RlZEluZGV4XSA9IGZsYWc7XG59XG5cbmZ1bmN0aW9uIGdldFBvaW50ZXJzKGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBpbmRleDogbnVtYmVyKTogbnVtYmVyIHtcbiAgY29uc3QgYWRqdXN0ZWRJbmRleCA9XG4gICAgICBpbmRleCA9PT0gU3R5bGluZ0luZGV4Lk1hc3RlckZsYWdQb3NpdGlvbiA/IGluZGV4IDogKGluZGV4ICsgU3R5bGluZ0luZGV4LkZsYWdzT2Zmc2V0KTtcbiAgcmV0dXJuIGNvbnRleHRbYWRqdXN0ZWRJbmRleF0gYXMgbnVtYmVyO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0VmFsdWUoY29udGV4dDogU3R5bGluZ0NvbnRleHQsIGluZGV4OiBudW1iZXIpOiBzdHJpbmd8Ym9vbGVhbnxudWxsIHtcbiAgcmV0dXJuIGNvbnRleHRbaW5kZXggKyBTdHlsaW5nSW5kZXguVmFsdWVPZmZzZXRdIGFzIHN0cmluZyB8IGJvb2xlYW4gfCBudWxsO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0UHJvcChjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgaW5kZXg6IG51bWJlcik6IHN0cmluZyB7XG4gIHJldHVybiBjb250ZXh0W2luZGV4ICsgU3R5bGluZ0luZGV4LlByb3BlcnR5T2Zmc2V0XSBhcyBzdHJpbmc7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0NvbnRleHREaXJ0eShjb250ZXh0OiBTdHlsaW5nQ29udGV4dCk6IGJvb2xlYW4ge1xuICByZXR1cm4gaXNEaXJ0eShjb250ZXh0LCBTdHlsaW5nSW5kZXguTWFzdGVyRmxhZ1Bvc2l0aW9uKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNldENvbnRleHREaXJ0eShjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgaXNEaXJ0eVllczogYm9vbGVhbik6IHZvaWQge1xuICBzZXREaXJ0eShjb250ZXh0LCBTdHlsaW5nSW5kZXguTWFzdGVyRmxhZ1Bvc2l0aW9uLCBpc0RpcnR5WWVzKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNldENvbnRleHRQbGF5ZXJzRGlydHkoY29udGV4dDogU3R5bGluZ0NvbnRleHQsIGlzRGlydHlZZXM6IGJvb2xlYW4pOiB2b2lkIHtcbiAgaWYgKGlzRGlydHlZZXMpIHtcbiAgICAoY29udGV4dFtTdHlsaW5nSW5kZXguTWFzdGVyRmxhZ1Bvc2l0aW9uXSBhcyBudW1iZXIpIHw9IFN0eWxpbmdGbGFncy5QbGF5ZXJCdWlsZGVyc0RpcnR5O1xuICB9IGVsc2Uge1xuICAgIChjb250ZXh0W1N0eWxpbmdJbmRleC5NYXN0ZXJGbGFnUG9zaXRpb25dIGFzIG51bWJlcikgJj0gflN0eWxpbmdGbGFncy5QbGF5ZXJCdWlsZGVyc0RpcnR5O1xuICB9XG59XG5cbmZ1bmN0aW9uIHN3YXBNdWx0aUNvbnRleHRFbnRyaWVzKGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBpbmRleEE6IG51bWJlciwgaW5kZXhCOiBudW1iZXIpIHtcbiAgaWYgKGluZGV4QSA9PT0gaW5kZXhCKSByZXR1cm47XG5cbiAgY29uc3QgdG1wVmFsdWUgPSBnZXRWYWx1ZShjb250ZXh0LCBpbmRleEEpO1xuICBjb25zdCB0bXBQcm9wID0gZ2V0UHJvcChjb250ZXh0LCBpbmRleEEpO1xuICBjb25zdCB0bXBGbGFnID0gZ2V0UG9pbnRlcnMoY29udGV4dCwgaW5kZXhBKTtcbiAgY29uc3QgdG1wUGxheWVyQnVpbGRlckluZGV4ID0gZ2V0UGxheWVyQnVpbGRlckluZGV4KGNvbnRleHQsIGluZGV4QSk7XG4gIGNvbnN0IHRtcERpcmVjdGl2ZUluZGV4ID0gZ2V0RGlyZWN0aXZlSW5kZXhGcm9tRW50cnkoY29udGV4dCwgaW5kZXhBKTtcblxuICBsZXQgZmxhZ0EgPSB0bXBGbGFnO1xuICBsZXQgZmxhZ0IgPSBnZXRQb2ludGVycyhjb250ZXh0LCBpbmRleEIpO1xuXG4gIGNvbnN0IHNpbmdsZUluZGV4QSA9IGdldE11bHRpT3JTaW5nbGVJbmRleChmbGFnQSk7XG4gIGlmIChzaW5nbGVJbmRleEEgPj0gMCkge1xuICAgIGNvbnN0IF9mbGFnID0gZ2V0UG9pbnRlcnMoY29udGV4dCwgc2luZ2xlSW5kZXhBKTtcbiAgICBjb25zdCBfaW5pdGlhbCA9IGdldEluaXRpYWxJbmRleChfZmxhZyk7XG4gICAgc2V0RmxhZyhjb250ZXh0LCBzaW5nbGVJbmRleEEsIHBvaW50ZXJzKF9mbGFnLCBfaW5pdGlhbCwgaW5kZXhCKSk7XG4gIH1cblxuICBjb25zdCBzaW5nbGVJbmRleEIgPSBnZXRNdWx0aU9yU2luZ2xlSW5kZXgoZmxhZ0IpO1xuICBpZiAoc2luZ2xlSW5kZXhCID49IDApIHtcbiAgICBjb25zdCBfZmxhZyA9IGdldFBvaW50ZXJzKGNvbnRleHQsIHNpbmdsZUluZGV4Qik7XG4gICAgY29uc3QgX2luaXRpYWwgPSBnZXRJbml0aWFsSW5kZXgoX2ZsYWcpO1xuICAgIHNldEZsYWcoY29udGV4dCwgc2luZ2xlSW5kZXhCLCBwb2ludGVycyhfZmxhZywgX2luaXRpYWwsIGluZGV4QSkpO1xuICB9XG5cbiAgc2V0VmFsdWUoY29udGV4dCwgaW5kZXhBLCBnZXRWYWx1ZShjb250ZXh0LCBpbmRleEIpKTtcbiAgc2V0UHJvcChjb250ZXh0LCBpbmRleEEsIGdldFByb3AoY29udGV4dCwgaW5kZXhCKSk7XG4gIHNldEZsYWcoY29udGV4dCwgaW5kZXhBLCBnZXRQb2ludGVycyhjb250ZXh0LCBpbmRleEIpKTtcbiAgY29uc3QgcGxheWVySW5kZXhBID0gZ2V0UGxheWVyQnVpbGRlckluZGV4KGNvbnRleHQsIGluZGV4Qik7XG4gIGNvbnN0IGRpcmVjdGl2ZUluZGV4QSA9IGdldERpcmVjdGl2ZUluZGV4RnJvbUVudHJ5KGNvbnRleHQsIGluZGV4Qik7XG4gIHNldFBsYXllckJ1aWxkZXJJbmRleChjb250ZXh0LCBpbmRleEEsIHBsYXllckluZGV4QSwgZGlyZWN0aXZlSW5kZXhBKTtcblxuICBzZXRWYWx1ZShjb250ZXh0LCBpbmRleEIsIHRtcFZhbHVlKTtcbiAgc2V0UHJvcChjb250ZXh0LCBpbmRleEIsIHRtcFByb3ApO1xuICBzZXRGbGFnKGNvbnRleHQsIGluZGV4QiwgdG1wRmxhZyk7XG4gIHNldFBsYXllckJ1aWxkZXJJbmRleChjb250ZXh0LCBpbmRleEIsIHRtcFBsYXllckJ1aWxkZXJJbmRleCwgdG1wRGlyZWN0aXZlSW5kZXgpO1xufVxuXG5mdW5jdGlvbiB1cGRhdGVTaW5nbGVQb2ludGVyVmFsdWVzKGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBpbmRleFN0YXJ0UG9zaXRpb246IG51bWJlcikge1xuICBmb3IgKGxldCBpID0gaW5kZXhTdGFydFBvc2l0aW9uOyBpIDwgY29udGV4dC5sZW5ndGg7IGkgKz0gU3R5bGluZ0luZGV4LlNpemUpIHtcbiAgICBjb25zdCBtdWx0aUZsYWcgPSBnZXRQb2ludGVycyhjb250ZXh0LCBpKTtcbiAgICBjb25zdCBzaW5nbGVJbmRleCA9IGdldE11bHRpT3JTaW5nbGVJbmRleChtdWx0aUZsYWcpO1xuICAgIGlmIChzaW5nbGVJbmRleCA+IDApIHtcbiAgICAgIGNvbnN0IHNpbmdsZUZsYWcgPSBnZXRQb2ludGVycyhjb250ZXh0LCBzaW5nbGVJbmRleCk7XG4gICAgICBjb25zdCBpbml0aWFsSW5kZXhGb3JTaW5nbGUgPSBnZXRJbml0aWFsSW5kZXgoc2luZ2xlRmxhZyk7XG4gICAgICBjb25zdCBmbGFnVmFsdWUgPSAoaXNEaXJ0eShjb250ZXh0LCBzaW5nbGVJbmRleCkgPyBTdHlsaW5nRmxhZ3MuRGlydHkgOiBTdHlsaW5nRmxhZ3MuTm9uZSkgfFxuICAgICAgICAgIChpc0NsYXNzQmFzZWRWYWx1ZShjb250ZXh0LCBzaW5nbGVJbmRleCkgPyBTdHlsaW5nRmxhZ3MuQ2xhc3MgOiBTdHlsaW5nRmxhZ3MuTm9uZSkgfFxuICAgICAgICAgIChpc1Nhbml0aXphYmxlKGNvbnRleHQsIHNpbmdsZUluZGV4KSA/IFN0eWxpbmdGbGFncy5TYW5pdGl6ZSA6IFN0eWxpbmdGbGFncy5Ob25lKTtcbiAgICAgIGNvbnN0IHVwZGF0ZWRGbGFnID0gcG9pbnRlcnMoZmxhZ1ZhbHVlLCBpbml0aWFsSW5kZXhGb3JTaW5nbGUsIGkpO1xuICAgICAgc2V0RmxhZyhjb250ZXh0LCBzaW5nbGVJbmRleCwgdXBkYXRlZEZsYWcpO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBpbnNlcnROZXdNdWx0aVByb3BlcnR5KFxuICAgIGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBpbmRleDogbnVtYmVyLCBjbGFzc0Jhc2VkOiBib29sZWFuLCBuYW1lOiBzdHJpbmcsIGZsYWc6IG51bWJlcixcbiAgICB2YWx1ZTogc3RyaW5nIHwgYm9vbGVhbiwgZGlyZWN0aXZlSW5kZXg6IG51bWJlciwgcGxheWVySW5kZXg6IG51bWJlcik6IHZvaWQge1xuICBjb25zdCBkb1NoaWZ0ID0gaW5kZXggPCBjb250ZXh0Lmxlbmd0aDtcblxuICAvLyBwcm9wIGRvZXMgbm90IGV4aXN0IGluIHRoZSBsaXN0LCBhZGQgaXQgaW5cbiAgY29udGV4dC5zcGxpY2UoXG4gICAgICBpbmRleCwgMCwgZmxhZyB8IFN0eWxpbmdGbGFncy5EaXJ0eSB8IChjbGFzc0Jhc2VkID8gU3R5bGluZ0ZsYWdzLkNsYXNzIDogU3R5bGluZ0ZsYWdzLk5vbmUpLFxuICAgICAgbmFtZSwgdmFsdWUsIDApO1xuICBzZXRQbGF5ZXJCdWlsZGVySW5kZXgoY29udGV4dCwgaW5kZXgsIHBsYXllckluZGV4LCBkaXJlY3RpdmVJbmRleCk7XG5cbiAgaWYgKGRvU2hpZnQpIHtcbiAgICAvLyBiZWNhdXNlIHRoZSB2YWx1ZSB3YXMgaW5zZXJ0ZWQgbWlkd2F5IGludG8gdGhlIGFycmF5IHRoZW4gd2VcbiAgICAvLyBuZWVkIHRvIHVwZGF0ZSBhbGwgdGhlIHNoaWZ0ZWQgbXVsdGkgdmFsdWVzJyBzaW5nbGUgdmFsdWVcbiAgICAvLyBwb2ludGVycyB0byBwb2ludCB0byB0aGUgbmV3bHkgc2hpZnRlZCBsb2NhdGlvblxuICAgIHVwZGF0ZVNpbmdsZVBvaW50ZXJWYWx1ZXMoY29udGV4dCwgaW5kZXggKyBTdHlsaW5nSW5kZXguU2l6ZSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gdmFsdWVFeGlzdHModmFsdWU6IHN0cmluZyB8IG51bGwgfCBib29sZWFuLCBpc0NsYXNzQmFzZWQ/OiBib29sZWFuKSB7XG4gIHJldHVybiB2YWx1ZSAhPT0gbnVsbDtcbn1cblxuZnVuY3Rpb24gcHJlcGFyZUluaXRpYWxGbGFnKFxuICAgIGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBwcm9wOiBzdHJpbmcsIGVudHJ5SXNDbGFzc0Jhc2VkOiBib29sZWFuLFxuICAgIHNhbml0aXplcj86IFN0eWxlU2FuaXRpemVGbiB8IG51bGwpIHtcbiAgbGV0IGZsYWcgPSAoc2FuaXRpemVyICYmIHNhbml0aXplcihwcm9wKSkgPyBTdHlsaW5nRmxhZ3MuU2FuaXRpemUgOiBTdHlsaW5nRmxhZ3MuTm9uZTtcblxuICBsZXQgaW5pdGlhbEluZGV4OiBudW1iZXI7XG4gIGlmIChlbnRyeUlzQ2xhc3NCYXNlZCkge1xuICAgIGZsYWcgfD0gU3R5bGluZ0ZsYWdzLkNsYXNzO1xuICAgIGluaXRpYWxJbmRleCA9XG4gICAgICAgIGdldEluaXRpYWxTdHlsaW5nVmFsdWVzSW5kZXhPZihjb250ZXh0W1N0eWxpbmdJbmRleC5Jbml0aWFsQ2xhc3NWYWx1ZXNQb3NpdGlvbl0sIHByb3ApO1xuICB9IGVsc2Uge1xuICAgIGluaXRpYWxJbmRleCA9XG4gICAgICAgIGdldEluaXRpYWxTdHlsaW5nVmFsdWVzSW5kZXhPZihjb250ZXh0W1N0eWxpbmdJbmRleC5Jbml0aWFsU3R5bGVWYWx1ZXNQb3NpdGlvbl0sIHByb3ApO1xuICB9XG5cbiAgaW5pdGlhbEluZGV4ID0gaW5pdGlhbEluZGV4ID4gMCA/IChpbml0aWFsSW5kZXggKyBJbml0aWFsU3R5bGluZ1ZhbHVlc0luZGV4LlZhbHVlT2Zmc2V0KSA6IDA7XG4gIHJldHVybiBwb2ludGVycyhmbGFnLCBpbml0aWFsSW5kZXgsIDApO1xufVxuXG5mdW5jdGlvbiBoYXNJbml0aWFsVmFsdWVDaGFuZ2VkKGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBmbGFnOiBudW1iZXIsIG5ld1ZhbHVlOiBhbnkpIHtcbiAgY29uc3QgaW5pdGlhbFZhbHVlID0gZ2V0SW5pdGlhbFZhbHVlKGNvbnRleHQsIGZsYWcpO1xuICByZXR1cm4gIWluaXRpYWxWYWx1ZSB8fCBoYXNWYWx1ZUNoYW5nZWQoZmxhZywgaW5pdGlhbFZhbHVlLCBuZXdWYWx1ZSk7XG59XG5cbmZ1bmN0aW9uIGhhc1ZhbHVlQ2hhbmdlZChcbiAgICBmbGFnOiBudW1iZXIsIGE6IHN0cmluZyB8IGJvb2xlYW4gfCBudWxsLCBiOiBzdHJpbmcgfCBib29sZWFuIHwgbnVsbCk6IGJvb2xlYW4ge1xuICBjb25zdCBpc0NsYXNzQmFzZWQgPSBmbGFnICYgU3R5bGluZ0ZsYWdzLkNsYXNzO1xuICBjb25zdCBoYXNWYWx1ZXMgPSBhICYmIGI7XG4gIGNvbnN0IHVzZXNTYW5pdGl6ZXIgPSBmbGFnICYgU3R5bGluZ0ZsYWdzLlNhbml0aXplO1xuICAvLyB0aGUgdG9TdHJpbmcoKSBjb21wYXJpc29uIGVuc3VyZXMgdGhhdCBhIHZhbHVlIGlzIGNoZWNrZWRcbiAgLy8gLi4uIG90aGVyd2lzZSAoZHVyaW5nIHNhbml0aXphdGlvbiBieXBhc3NpbmcpIHRoZSA9PT0gY29tcGFyc2lvblxuICAvLyB3b3VsZCBmYWlsIHNpbmNlIGEgbmV3IFN0cmluZygpIGluc3RhbmNlIGlzIGNyZWF0ZWRcbiAgaWYgKCFpc0NsYXNzQmFzZWQgJiYgaGFzVmFsdWVzICYmIHVzZXNTYW5pdGl6ZXIpIHtcbiAgICAvLyB3ZSBrbm93IGZvciBzdXJlIHdlJ3JlIGRlYWxpbmcgd2l0aCBzdHJpbmdzIGF0IHRoaXMgcG9pbnRcbiAgICByZXR1cm4gKGEgYXMgc3RyaW5nKS50b1N0cmluZygpICE9PSAoYiBhcyBzdHJpbmcpLnRvU3RyaW5nKCk7XG4gIH1cblxuICAvLyBldmVyeXRoaW5nIGVsc2UgaXMgc2FmZSB0byBjaGVjayB3aXRoIGEgbm9ybWFsIGVxdWFsaXR5IGNoZWNrXG4gIHJldHVybiBhICE9PSBiO1xufVxuXG5leHBvcnQgY2xhc3MgQ2xhc3NBbmRTdHlsZVBsYXllckJ1aWxkZXI8VD4gaW1wbGVtZW50cyBQbGF5ZXJCdWlsZGVyIHtcbiAgcHJpdmF0ZSBfdmFsdWVzOiB7W2tleTogc3RyaW5nXTogc3RyaW5nIHwgbnVsbH0gPSB7fTtcbiAgcHJpdmF0ZSBfZGlydHkgPSBmYWxzZTtcbiAgcHJpdmF0ZSBfZmFjdG9yeTogQm91bmRQbGF5ZXJGYWN0b3J5PFQ+O1xuXG4gIGNvbnN0cnVjdG9yKGZhY3Rvcnk6IFBsYXllckZhY3RvcnksIHByaXZhdGUgX2VsZW1lbnQ6IEhUTUxFbGVtZW50LCBwcml2YXRlIF90eXBlOiBCaW5kaW5nVHlwZSkge1xuICAgIHRoaXMuX2ZhY3RvcnkgPSBmYWN0b3J5IGFzIGFueTtcbiAgfVxuXG4gIHNldFZhbHVlKHByb3A6IHN0cmluZywgdmFsdWU6IGFueSkge1xuICAgIGlmICh0aGlzLl92YWx1ZXNbcHJvcF0gIT09IHZhbHVlKSB7XG4gICAgICB0aGlzLl92YWx1ZXNbcHJvcF0gPSB2YWx1ZTtcbiAgICAgIHRoaXMuX2RpcnR5ID0gdHJ1ZTtcbiAgICB9XG4gIH1cblxuICBidWlsZFBsYXllcihjdXJyZW50UGxheWVyOiBQbGF5ZXJ8bnVsbCwgaXNGaXJzdFJlbmRlcjogYm9vbGVhbik6IFBsYXllcnx1bmRlZmluZWR8bnVsbCB7XG4gICAgLy8gaWYgbm8gdmFsdWVzIGhhdmUgYmVlbiBzZXQgaGVyZSB0aGVuIHRoaXMgbWVhbnMgdGhlIGJpbmRpbmcgZGlkbid0XG4gICAgLy8gY2hhbmdlIGFuZCB0aGVyZWZvcmUgdGhlIGJpbmRpbmcgdmFsdWVzIHdlcmUgbm90IHVwZGF0ZWQgdGhyb3VnaFxuICAgIC8vIGBzZXRWYWx1ZWAgd2hpY2ggbWVhbnMgbm8gbmV3IHBsYXllciB3aWxsIGJlIHByb3ZpZGVkLlxuICAgIGlmICh0aGlzLl9kaXJ0eSkge1xuICAgICAgY29uc3QgcGxheWVyID0gdGhpcy5fZmFjdG9yeS5mbihcbiAgICAgICAgICB0aGlzLl9lbGVtZW50LCB0aGlzLl90eXBlLCB0aGlzLl92YWx1ZXMgISwgaXNGaXJzdFJlbmRlciwgY3VycmVudFBsYXllciB8fCBudWxsKTtcbiAgICAgIHRoaXMuX3ZhbHVlcyA9IHt9O1xuICAgICAgdGhpcy5fZGlydHkgPSBmYWxzZTtcbiAgICAgIHJldHVybiBwbGF5ZXI7XG4gICAgfVxuXG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxufVxuXG4vKipcbiAqIFVzZWQgdG8gcHJvdmlkZSBhIHN1bW1hcnkgb2YgdGhlIHN0YXRlIG9mIHRoZSBzdHlsaW5nIGNvbnRleHQuXG4gKlxuICogVGhpcyBpcyBhbiBpbnRlcm5hbCBpbnRlcmZhY2UgdGhhdCBpcyBvbmx5IHVzZWQgaW5zaWRlIG9mIHRlc3QgdG9vbGluZyB0b1xuICogaGVscCBzdW1tYXJpemUgd2hhdCdzIGdvaW5nIG9uIHdpdGhpbiB0aGUgc3R5bGluZyBjb250ZXh0LiBOb25lIG9mIHRoaXMgY29kZVxuICogaXMgZGVzaWduZWQgdG8gYmUgZXhwb3J0ZWQgcHVibGljbHkgYW5kIHdpbGwsIHRoZXJlZm9yZSwgYmUgdHJlZS1zaGFrZW4gYXdheVxuICogZHVyaW5nIHJ1bnRpbWUuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgTG9nU3VtbWFyeSB7XG4gIG5hbWU6IHN0cmluZzsgICAgICAgICAgLy9cbiAgc3RhdGljSW5kZXg6IG51bWJlcjsgICAvL1xuICBkeW5hbWljSW5kZXg6IG51bWJlcjsgIC8vXG4gIHZhbHVlOiBudW1iZXI7ICAgICAgICAgLy9cbiAgZmxhZ3M6IHtcbiAgICBkaXJ0eTogYm9vbGVhbjsgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgY2xhc3M6IGJvb2xlYW47ICAgICAgICAgICAgICAgICAgICAvL1xuICAgIHNhbml0aXplOiBib29sZWFuOyAgICAgICAgICAgICAgICAgLy9cbiAgICBwbGF5ZXJCdWlsZGVyc0RpcnR5OiBib29sZWFuOyAgICAgIC8vXG4gICAgYmluZGluZ0FsbG9jYXRpb25Mb2NrZWQ6IGJvb2xlYW47ICAvL1xuICB9O1xufVxuXG4vKipcbiAqIFRoaXMgZnVuY3Rpb24gaXMgbm90IGRlc2lnbmVkIHRvIGJlIHVzZWQgaW4gcHJvZHVjdGlvbi5cbiAqIEl0IGlzIGEgdXRpbGl0eSB0b29sIGZvciBkZWJ1Z2dpbmcgYW5kIHRlc3RpbmcgYW5kIGl0XG4gKiB3aWxsIGF1dG9tYXRpY2FsbHkgYmUgdHJlZS1zaGFrZW4gYXdheSBkdXJpbmcgcHJvZHVjdGlvbi5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdlbmVyYXRlQ29uZmlnU3VtbWFyeShzb3VyY2U6IG51bWJlcik6IExvZ1N1bW1hcnk7XG5leHBvcnQgZnVuY3Rpb24gZ2VuZXJhdGVDb25maWdTdW1tYXJ5KHNvdXJjZTogU3R5bGluZ0NvbnRleHQpOiBMb2dTdW1tYXJ5O1xuZXhwb3J0IGZ1bmN0aW9uIGdlbmVyYXRlQ29uZmlnU3VtbWFyeShzb3VyY2U6IFN0eWxpbmdDb250ZXh0LCBpbmRleDogbnVtYmVyKTogTG9nU3VtbWFyeTtcbmV4cG9ydCBmdW5jdGlvbiBnZW5lcmF0ZUNvbmZpZ1N1bW1hcnkoc291cmNlOiBudW1iZXIgfCBTdHlsaW5nQ29udGV4dCwgaW5kZXg/OiBudW1iZXIpOiBMb2dTdW1tYXJ5IHtcbiAgbGV0IGZsYWcsIG5hbWUgPSAnY29uZmlnIHZhbHVlIGZvciAnO1xuICBpZiAoQXJyYXkuaXNBcnJheShzb3VyY2UpKSB7XG4gICAgaWYgKGluZGV4KSB7XG4gICAgICBuYW1lICs9ICdpbmRleDogJyArIGluZGV4O1xuICAgIH0gZWxzZSB7XG4gICAgICBuYW1lICs9ICdtYXN0ZXIgY29uZmlnJztcbiAgICB9XG4gICAgaW5kZXggPSBpbmRleCB8fCBTdHlsaW5nSW5kZXguTWFzdGVyRmxhZ1Bvc2l0aW9uO1xuICAgIGZsYWcgPSBzb3VyY2VbaW5kZXhdIGFzIG51bWJlcjtcbiAgfSBlbHNlIHtcbiAgICBmbGFnID0gc291cmNlO1xuICAgIG5hbWUgKz0gJ2luZGV4OiAnICsgZmxhZztcbiAgfVxuICBjb25zdCBkeW5hbWljSW5kZXggPSBnZXRNdWx0aU9yU2luZ2xlSW5kZXgoZmxhZyk7XG4gIGNvbnN0IHN0YXRpY0luZGV4ID0gZ2V0SW5pdGlhbEluZGV4KGZsYWcpO1xuICByZXR1cm4ge1xuICAgIG5hbWUsXG4gICAgc3RhdGljSW5kZXgsXG4gICAgZHluYW1pY0luZGV4LFxuICAgIHZhbHVlOiBmbGFnLFxuICAgIGZsYWdzOiB7XG4gICAgICBkaXJ0eTogZmxhZyAmIFN0eWxpbmdGbGFncy5EaXJ0eSA/IHRydWUgOiBmYWxzZSxcbiAgICAgIGNsYXNzOiBmbGFnICYgU3R5bGluZ0ZsYWdzLkNsYXNzID8gdHJ1ZSA6IGZhbHNlLFxuICAgICAgc2FuaXRpemU6IGZsYWcgJiBTdHlsaW5nRmxhZ3MuU2FuaXRpemUgPyB0cnVlIDogZmFsc2UsXG4gICAgICBwbGF5ZXJCdWlsZGVyc0RpcnR5OiBmbGFnICYgU3R5bGluZ0ZsYWdzLlBsYXllckJ1aWxkZXJzRGlydHkgPyB0cnVlIDogZmFsc2UsXG4gICAgICBiaW5kaW5nQWxsb2NhdGlvbkxvY2tlZDogZmxhZyAmIFN0eWxpbmdGbGFncy5CaW5kaW5nQWxsb2NhdGlvbkxvY2tlZCA/IHRydWUgOiBmYWxzZSxcbiAgICB9XG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXREaXJlY3RpdmVJbmRleEZyb21FbnRyeShjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgaW5kZXg6IG51bWJlcikge1xuICBjb25zdCB2YWx1ZSA9IGNvbnRleHRbaW5kZXggKyBTdHlsaW5nSW5kZXguUGxheWVyQnVpbGRlckluZGV4T2Zmc2V0XSBhcyBudW1iZXI7XG4gIHJldHVybiB2YWx1ZSAmIERpcmVjdGl2ZU93bmVyQW5kUGxheWVyQnVpbGRlckluZGV4LkJpdE1hc2s7XG59XG5cbmZ1bmN0aW9uIGdldERpcmVjdGl2ZUluZGV4RnJvbVJlZ2lzdHJ5KGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBkaXJlY3RpdmVSZWY6IGFueSkge1xuICBsZXQgZGlyZWN0aXZlSW5kZXg6IG51bWJlcjtcblxuICBjb25zdCBkaXJzID0gY29udGV4dFtTdHlsaW5nSW5kZXguRGlyZWN0aXZlUmVnaXN0cnlQb3NpdGlvbl07XG4gIGxldCBpbmRleCA9IGdldERpcmVjdGl2ZVJlZ2lzdHJ5VmFsdWVzSW5kZXhPZihkaXJzLCBkaXJlY3RpdmVSZWYpO1xuICBpZiAoaW5kZXggPT09IC0xKSB7XG4gICAgLy8gaWYgdGhlIGRpcmVjdGl2ZSB3YXMgbm90IGFsbG9jYXRlZCB0aGVuIHRoaXMgbWVhbnMgdGhhdCBzdHlsaW5nIGlzXG4gICAgLy8gYmVpbmcgYXBwbGllZCBpbiBhIGR5bmFtaWMgd2F5IEFGVEVSIHRoZSBlbGVtZW50IHdhcyBhbHJlYWR5IGluc3RhbnRpYXRlZFxuICAgIGluZGV4ID0gZGlycy5sZW5ndGg7XG4gICAgZGlyZWN0aXZlSW5kZXggPSBpbmRleCA+IDAgPyBpbmRleCAvIERpcmVjdGl2ZVJlZ2lzdHJ5VmFsdWVzSW5kZXguU2l6ZSA6IDA7XG5cbiAgICBkaXJzLnB1c2gobnVsbCwgbnVsbCwgbnVsbCwgbnVsbCk7XG4gICAgZGlyc1tpbmRleCArIERpcmVjdGl2ZVJlZ2lzdHJ5VmFsdWVzSW5kZXguRGlyZWN0aXZlVmFsdWVPZmZzZXRdID0gZGlyZWN0aXZlUmVmO1xuICAgIGRpcnNbaW5kZXggKyBEaXJlY3RpdmVSZWdpc3RyeVZhbHVlc0luZGV4LkRpcnR5RmxhZ09mZnNldF0gPSBmYWxzZTtcbiAgICBkaXJzW2luZGV4ICsgRGlyZWN0aXZlUmVnaXN0cnlWYWx1ZXNJbmRleC5TaW5nbGVQcm9wVmFsdWVzSW5kZXhPZmZzZXRdID0gLTE7XG5cbiAgICBjb25zdCBjbGFzc2VzU3RhcnRJbmRleCA9XG4gICAgICAgIGdldE11bHRpQ2xhc3Nlc1N0YXJ0SW5kZXgoY29udGV4dCkgfHwgU3R5bGluZ0luZGV4LlNpbmdsZVN0eWxlc1N0YXJ0UG9zaXRpb247XG4gICAgcmVnaXN0ZXJNdWx0aU1hcEVudHJ5KGNvbnRleHQsIGRpcmVjdGl2ZUluZGV4LCB0cnVlLCBjb250ZXh0Lmxlbmd0aCk7XG4gICAgcmVnaXN0ZXJNdWx0aU1hcEVudHJ5KGNvbnRleHQsIGRpcmVjdGl2ZUluZGV4LCBmYWxzZSwgY2xhc3Nlc1N0YXJ0SW5kZXgpO1xuICB9IGVsc2Uge1xuICAgIGRpcmVjdGl2ZUluZGV4ID0gaW5kZXggPiAwID8gaW5kZXggLyBEaXJlY3RpdmVSZWdpc3RyeVZhbHVlc0luZGV4LlNpemUgOiAwO1xuICB9XG5cbiAgcmV0dXJuIGRpcmVjdGl2ZUluZGV4O1xufVxuXG5mdW5jdGlvbiBnZXREaXJlY3RpdmVSZWdpc3RyeVZhbHVlc0luZGV4T2YoXG4gICAgZGlyZWN0aXZlczogRGlyZWN0aXZlUmVnaXN0cnlWYWx1ZXMsIGRpcmVjdGl2ZToge30pOiBudW1iZXIge1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGRpcmVjdGl2ZXMubGVuZ3RoOyBpICs9IERpcmVjdGl2ZVJlZ2lzdHJ5VmFsdWVzSW5kZXguU2l6ZSkge1xuICAgIGlmIChkaXJlY3RpdmVzW2ldID09PSBkaXJlY3RpdmUpIHtcbiAgICAgIHJldHVybiBpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gLTE7XG59XG5cbmZ1bmN0aW9uIGdldEluaXRpYWxTdHlsaW5nVmFsdWVzSW5kZXhPZihrZXlWYWx1ZXM6IEluaXRpYWxTdHlsaW5nVmFsdWVzLCBrZXk6IHN0cmluZyk6IG51bWJlciB7XG4gIGZvciAobGV0IGkgPSBJbml0aWFsU3R5bGluZ1ZhbHVlc0luZGV4LktleVZhbHVlU3RhcnRQb3NpdGlvbjsgaSA8IGtleVZhbHVlcy5sZW5ndGg7XG4gICAgICAgaSArPSBJbml0aWFsU3R5bGluZ1ZhbHVlc0luZGV4LlNpemUpIHtcbiAgICBpZiAoa2V5VmFsdWVzW2ldID09PSBrZXkpIHJldHVybiBpO1xuICB9XG4gIHJldHVybiAtMTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNvbXBhcmVMb2dTdW1tYXJpZXMoYTogTG9nU3VtbWFyeSwgYjogTG9nU3VtbWFyeSkge1xuICBjb25zdCBsb2c6IHN0cmluZ1tdID0gW107XG4gIGNvbnN0IGRpZmZzOiBbc3RyaW5nLCBhbnksIGFueV1bXSA9IFtdO1xuICBkaWZmU3VtbWFyeVZhbHVlcyhkaWZmcywgJ3N0YXRpY0luZGV4JywgJ3N0YXRpY0luZGV4JywgYSwgYik7XG4gIGRpZmZTdW1tYXJ5VmFsdWVzKGRpZmZzLCAnZHluYW1pY0luZGV4JywgJ2R5bmFtaWNJbmRleCcsIGEsIGIpO1xuICBPYmplY3Qua2V5cyhhLmZsYWdzKS5mb3JFYWNoKFxuICAgICAgbmFtZSA9PiB7IGRpZmZTdW1tYXJ5VmFsdWVzKGRpZmZzLCAnZmxhZ3MuJyArIG5hbWUsIG5hbWUsIGEuZmxhZ3MsIGIuZmxhZ3MpOyB9KTtcblxuICBpZiAoZGlmZnMubGVuZ3RoKSB7XG4gICAgbG9nLnB1c2goJ0xvZyBTdW1tYXJpZXMgZm9yOicpO1xuICAgIGxvZy5wdXNoKCcgIEE6ICcgKyBhLm5hbWUpO1xuICAgIGxvZy5wdXNoKCcgIEI6ICcgKyBiLm5hbWUpO1xuICAgIGxvZy5wdXNoKCdcXG4gIERpZmZlciBpbiB0aGUgZm9sbG93aW5nIHdheSAoQSAhPT0gQik6Jyk7XG4gICAgZGlmZnMuZm9yRWFjaChyZXN1bHQgPT4ge1xuICAgICAgY29uc3QgW25hbWUsIGFWYWwsIGJWYWxdID0gcmVzdWx0O1xuICAgICAgbG9nLnB1c2goJyAgICA9PiAnICsgbmFtZSk7XG4gICAgICBsb2cucHVzaCgnICAgID0+ICcgKyBhVmFsICsgJyAhPT0gJyArIGJWYWwgKyAnXFxuJyk7XG4gICAgfSk7XG4gIH1cblxuICByZXR1cm4gbG9nO1xufVxuXG5mdW5jdGlvbiBkaWZmU3VtbWFyeVZhbHVlcyhyZXN1bHQ6IGFueVtdLCBuYW1lOiBzdHJpbmcsIHByb3A6IHN0cmluZywgYTogYW55LCBiOiBhbnkpIHtcbiAgY29uc3QgYVZhbCA9IGFbcHJvcF07XG4gIGNvbnN0IGJWYWwgPSBiW3Byb3BdO1xuICBpZiAoYVZhbCAhPT0gYlZhbCkge1xuICAgIHJlc3VsdC5wdXNoKFtuYW1lLCBhVmFsLCBiVmFsXSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gZ2V0U2luZ2xlUHJvcEluZGV4VmFsdWUoXG4gICAgY29udGV4dDogU3R5bGluZ0NvbnRleHQsIGRpcmVjdGl2ZUluZGV4OiBudW1iZXIsIG9mZnNldDogbnVtYmVyLCBpc0NsYXNzQmFzZWQ6IGJvb2xlYW4pIHtcbiAgY29uc3Qgc2luZ2xlUHJvcE9mZnNldFJlZ2lzdHJ5SW5kZXggPVxuICAgICAgY29udGV4dFtTdHlsaW5nSW5kZXguRGlyZWN0aXZlUmVnaXN0cnlQb3NpdGlvbl1cbiAgICAgICAgICAgICBbKGRpcmVjdGl2ZUluZGV4ICogRGlyZWN0aXZlUmVnaXN0cnlWYWx1ZXNJbmRleC5TaXplKSArXG4gICAgICAgICAgICAgIERpcmVjdGl2ZVJlZ2lzdHJ5VmFsdWVzSW5kZXguU2luZ2xlUHJvcFZhbHVlc0luZGV4T2Zmc2V0XSBhcyBudW1iZXI7XG4gIGNvbnN0IG9mZnNldHMgPSBjb250ZXh0W1N0eWxpbmdJbmRleC5TaW5nbGVQcm9wT2Zmc2V0UG9zaXRpb25zXTtcbiAgY29uc3QgaW5kZXhGb3JPZmZzZXQgPSBzaW5nbGVQcm9wT2Zmc2V0UmVnaXN0cnlJbmRleCArXG4gICAgICBTaW5nbGVQcm9wT2Zmc2V0VmFsdWVzSW5kZXguVmFsdWVTdGFydFBvc2l0aW9uICtcbiAgICAgIChpc0NsYXNzQmFzZWQgP1xuICAgICAgICAgICBvZmZzZXRzXG4gICAgICAgICAgICAgICBbc2luZ2xlUHJvcE9mZnNldFJlZ2lzdHJ5SW5kZXggKyBTaW5nbGVQcm9wT2Zmc2V0VmFsdWVzSW5kZXguU3R5bGVzQ291bnRQb3NpdGlvbl0gOlxuICAgICAgICAgICAwKSArXG4gICAgICBvZmZzZXQ7XG4gIHJldHVybiBvZmZzZXRzW2luZGV4Rm9yT2Zmc2V0XTtcbn1cblxuZnVuY3Rpb24gZ2V0U3R5bGVTYW5pdGl6ZXIoY29udGV4dDogU3R5bGluZ0NvbnRleHQsIGRpcmVjdGl2ZUluZGV4OiBudW1iZXIpOiBTdHlsZVNhbml0aXplRm58bnVsbCB7XG4gIGNvbnN0IGRpcnMgPSBjb250ZXh0W1N0eWxpbmdJbmRleC5EaXJlY3RpdmVSZWdpc3RyeVBvc2l0aW9uXTtcbiAgY29uc3QgdmFsdWUgPSBkaXJzXG4gICAgICAgICAgICAgICAgICAgIFtkaXJlY3RpdmVJbmRleCAqIERpcmVjdGl2ZVJlZ2lzdHJ5VmFsdWVzSW5kZXguU2l6ZSArXG4gICAgICAgICAgICAgICAgICAgICBEaXJlY3RpdmVSZWdpc3RyeVZhbHVlc0luZGV4LlN0eWxlU2FuaXRpemVyT2Zmc2V0XSB8fFxuICAgICAgZGlyc1tEaXJlY3RpdmVSZWdpc3RyeVZhbHVlc0luZGV4LlN0eWxlU2FuaXRpemVyT2Zmc2V0XSB8fCBudWxsO1xuICByZXR1cm4gdmFsdWUgYXMgU3R5bGVTYW5pdGl6ZUZuIHwgbnVsbDtcbn1cblxuZnVuY3Rpb24gaXNEaXJlY3RpdmVEaXJ0eShjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgZGlyZWN0aXZlSW5kZXg6IG51bWJlcik6IGJvb2xlYW4ge1xuICBjb25zdCBkaXJzID0gY29udGV4dFtTdHlsaW5nSW5kZXguRGlyZWN0aXZlUmVnaXN0cnlQb3NpdGlvbl07XG4gIHJldHVybiBkaXJzXG4gICAgICBbZGlyZWN0aXZlSW5kZXggKiBEaXJlY3RpdmVSZWdpc3RyeVZhbHVlc0luZGV4LlNpemUgK1xuICAgICAgIERpcmVjdGl2ZVJlZ2lzdHJ5VmFsdWVzSW5kZXguRGlydHlGbGFnT2Zmc2V0XSBhcyBib29sZWFuO1xufVxuXG5mdW5jdGlvbiBzZXREaXJlY3RpdmVEaXJ0eShcbiAgICBjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgZGlyZWN0aXZlSW5kZXg6IG51bWJlciwgZGlydHlZZXM6IGJvb2xlYW4pOiB2b2lkIHtcbiAgY29uc3QgZGlycyA9IGNvbnRleHRbU3R5bGluZ0luZGV4LkRpcmVjdGl2ZVJlZ2lzdHJ5UG9zaXRpb25dO1xuICBkaXJzXG4gICAgICBbZGlyZWN0aXZlSW5kZXggKiBEaXJlY3RpdmVSZWdpc3RyeVZhbHVlc0luZGV4LlNpemUgK1xuICAgICAgIERpcmVjdGl2ZVJlZ2lzdHJ5VmFsdWVzSW5kZXguRGlydHlGbGFnT2Zmc2V0XSA9IGRpcnR5WWVzO1xufVxuXG5mdW5jdGlvbiBhbGxvd1ZhbHVlQ2hhbmdlKFxuICAgIGN1cnJlbnRWYWx1ZTogc3RyaW5nIHwgYm9vbGVhbiB8IG51bGwsIG5ld1ZhbHVlOiBzdHJpbmcgfCBib29sZWFuIHwgbnVsbCxcbiAgICBjdXJyZW50RGlyZWN0aXZlT3duZXI6IG51bWJlciwgbmV3RGlyZWN0aXZlT3duZXI6IG51bWJlcikge1xuICAvLyB0aGUgY29kZSBiZWxvdyByZWxpZXMgdGhlIGltcG9ydGFuY2Ugb2YgZGlyZWN0aXZlJ3MgYmVpbmcgdGllZCB0byB0aGVpclxuICAvLyBpbmRleCB2YWx1ZS4gVGhlIGluZGV4IHZhbHVlcyBmb3IgZWFjaCBkaXJlY3RpdmUgYXJlIGRlcml2ZWQgZnJvbSBiZWluZ1xuICAvLyByZWdpc3RlcmVkIGludG8gdGhlIHN0eWxpbmcgY29udGV4dCBkaXJlY3RpdmUgcmVnaXN0cnkuIFRoZSBtb3N0IGltcG9ydGFudFxuICAvLyBkaXJlY3RpdmUgaXMgdGhlIHBhcmVudCBjb21wb25lbnQgZGlyZWN0aXZlICh0aGUgdGVtcGxhdGUpIGFuZCBlYWNoIGRpcmVjdGl2ZVxuICAvLyB0aGF0IGlzIGFkZGVkIGFmdGVyIGlzIGNvbnNpZGVyZWQgbGVzcyBpbXBvcnRhbnQgdGhhbiB0aGUgcHJldmlvdXMgZW50cnkuIFRoaXNcbiAgLy8gcHJpb3JpdGl6YXRpb24gb2YgZGlyZWN0aXZlcyBlbmFibGVzIHRoZSBzdHlsaW5nIGFsZ29yaXRobSB0byBkZWNpZGUgaWYgYSBzdHlsZVxuICAvLyBvciBjbGFzcyBzaG91bGQgYmUgYWxsb3dlZCB0byBiZSB1cGRhdGVkL3JlcGxhY2VkIGluY2FzZSBhbiBlYXJsaWVyIGRpcmVjdGl2ZVxuICAvLyBhbHJlYWR5IHdyb3RlIHRvIHRoZSBleGFjdCBzYW1lIHN0eWxlLXByb3BlcnR5IG9yIGNsYXNzTmFtZSB2YWx1ZS4gSW4gb3RoZXIgd29yZHNcbiAgLy8gdGhpcyBkZWNpZGVzIHdoYXQgdG8gZG8gaWYgYW5kIHdoZW4gdGhlcmUgaXMgYSBjb2xsaXNpb24uXG4gIGlmIChjdXJyZW50VmFsdWUgIT0gbnVsbCkge1xuICAgIGlmIChuZXdWYWx1ZSAhPSBudWxsKSB7XG4gICAgICAvLyBpZiBhIGRpcmVjdGl2ZSBpbmRleCBpcyBsb3dlciB0aGFuIGl0IGFsd2F5cyBoYXMgcHJpb3JpdHkgb3ZlciB0aGVcbiAgICAgIC8vIHByZXZpb3VzIGRpcmVjdGl2ZSdzIHZhbHVlLi4uXG4gICAgICByZXR1cm4gbmV3RGlyZWN0aXZlT3duZXIgPD0gY3VycmVudERpcmVjdGl2ZU93bmVyO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBvbmx5IHdyaXRlIGEgbnVsbCB2YWx1ZSBpbmNhc2UgaXQncyB0aGUgc2FtZSBvd25lciB3cml0aW5nIGl0LlxuICAgICAgLy8gdGhpcyBhdm9pZHMgaGF2aW5nIGEgaGlnaGVyLXByaW9yaXR5IGRpcmVjdGl2ZSB3cml0ZSB0byBudWxsXG4gICAgICAvLyBvbmx5IHRvIGhhdmUgYSBsZXNzZXItcHJpb3JpdHkgZGlyZWN0aXZlIGNoYW5nZSByaWdodCB0byBhXG4gICAgICAvLyBub24tbnVsbCB2YWx1ZSBpbW1lZGlhdGVseSBhZnRlcndhcmRzLlxuICAgICAgcmV0dXJuIGN1cnJlbnREaXJlY3RpdmVPd25lciA9PT0gbmV3RGlyZWN0aXZlT3duZXI7XG4gICAgfVxuICB9XG4gIHJldHVybiB0cnVlO1xufVxuXG4vKipcbiAqIFJldHVybnMgdGhlIGNsYXNzTmFtZSBzdHJpbmcgb2YgYWxsIHRoZSBpbml0aWFsIGNsYXNzZXMgZm9yIHRoZSBlbGVtZW50LlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gaXMgZGVzaWduZWQgdG8gcG9wdWxhdGUgYW5kIGNhY2hlIGFsbCB0aGUgc3RhdGljIGNsYXNzXG4gKiB2YWx1ZXMgaW50byBhIGNsYXNzTmFtZSBzdHJpbmcuIFRoZSBjYWNoaW5nIG1lY2hhbmlzbSB3b3JrcyBieSBwbGFjaW5nXG4gKiB0aGUgY29tcGxldGVkIGNsYXNzTmFtZSBzdHJpbmcgaW50byB0aGUgaW5pdGlhbCB2YWx1ZXMgYXJyYXkgaW50byBhXG4gKiBkZWRpY2F0ZWQgc2xvdC4gVGhpcyB3aWxsIHByZXZlbnQgdGhlIGZ1bmN0aW9uIGZyb20gaGF2aW5nIHRvIHBvcHVsYXRlXG4gKiB0aGUgc3RyaW5nIGVhY2ggdGltZSBhbiBlbGVtZW50IGlzIGNyZWF0ZWQgb3IgbWF0Y2hlZC5cbiAqXG4gKiBAcmV0dXJucyB0aGUgY2xhc3NOYW1lIHN0cmluZyAoZS5nLiBgb24gYWN0aXZlIHJlZGApXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRJbml0aWFsQ2xhc3NOYW1lVmFsdWUoY29udGV4dDogU3R5bGluZ0NvbnRleHQpOiBzdHJpbmcge1xuICBjb25zdCBpbml0aWFsQ2xhc3NWYWx1ZXMgPSBjb250ZXh0W1N0eWxpbmdJbmRleC5Jbml0aWFsQ2xhc3NWYWx1ZXNQb3NpdGlvbl07XG4gIGxldCBjbGFzc05hbWUgPSBpbml0aWFsQ2xhc3NWYWx1ZXNbSW5pdGlhbFN0eWxpbmdWYWx1ZXNJbmRleC5DYWNoZWRTdHJpbmdWYWx1ZVBvc2l0aW9uXTtcbiAgaWYgKGNsYXNzTmFtZSA9PT0gbnVsbCkge1xuICAgIGNsYXNzTmFtZSA9ICcnO1xuICAgIGZvciAobGV0IGkgPSBJbml0aWFsU3R5bGluZ1ZhbHVlc0luZGV4LktleVZhbHVlU3RhcnRQb3NpdGlvbjsgaSA8IGluaXRpYWxDbGFzc1ZhbHVlcy5sZW5ndGg7XG4gICAgICAgICBpICs9IEluaXRpYWxTdHlsaW5nVmFsdWVzSW5kZXguU2l6ZSkge1xuICAgICAgY29uc3QgaXNQcmVzZW50ID0gaW5pdGlhbENsYXNzVmFsdWVzW2kgKyAxXTtcbiAgICAgIGlmIChpc1ByZXNlbnQpIHtcbiAgICAgICAgY2xhc3NOYW1lICs9IChjbGFzc05hbWUubGVuZ3RoID8gJyAnIDogJycpICsgaW5pdGlhbENsYXNzVmFsdWVzW2ldO1xuICAgICAgfVxuICAgIH1cbiAgICBpbml0aWFsQ2xhc3NWYWx1ZXNbSW5pdGlhbFN0eWxpbmdWYWx1ZXNJbmRleC5DYWNoZWRTdHJpbmdWYWx1ZVBvc2l0aW9uXSA9IGNsYXNzTmFtZTtcbiAgfVxuICByZXR1cm4gY2xhc3NOYW1lO1xufVxuXG4vKipcbiAqIFJldHVybnMgdGhlIHN0eWxlIHN0cmluZyBvZiBhbGwgdGhlIGluaXRpYWwgc3R5bGVzIGZvciB0aGUgZWxlbWVudC5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIGlzIGRlc2lnbmVkIHRvIHBvcHVsYXRlIGFuZCBjYWNoZSBhbGwgdGhlIHN0YXRpYyBzdHlsZVxuICogdmFsdWVzIGludG8gYSBzdHlsZSBzdHJpbmcuIFRoZSBjYWNoaW5nIG1lY2hhbmlzbSB3b3JrcyBieSBwbGFjaW5nXG4gKiB0aGUgY29tcGxldGVkIHN0eWxlIHN0cmluZyBpbnRvIHRoZSBpbml0aWFsIHZhbHVlcyBhcnJheSBpbnRvIGFcbiAqIGRlZGljYXRlZCBzbG90LiBUaGlzIHdpbGwgcHJldmVudCB0aGUgZnVuY3Rpb24gZnJvbSBoYXZpbmcgdG8gcG9wdWxhdGVcbiAqIHRoZSBzdHJpbmcgZWFjaCB0aW1lIGFuIGVsZW1lbnQgaXMgY3JlYXRlZCBvciBtYXRjaGVkLlxuICpcbiAqIEByZXR1cm5zIHRoZSBzdHlsZSBzdHJpbmcgKGUuZy4gYHdpZHRoOjEwMHB4O2hlaWdodDoyMDBweGApXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRJbml0aWFsU3R5bGVTdHJpbmdWYWx1ZShjb250ZXh0OiBTdHlsaW5nQ29udGV4dCk6IHN0cmluZyB7XG4gIGNvbnN0IGluaXRpYWxTdHlsZVZhbHVlcyA9IGNvbnRleHRbU3R5bGluZ0luZGV4LkluaXRpYWxTdHlsZVZhbHVlc1Bvc2l0aW9uXTtcbiAgbGV0IHN0eWxlU3RyaW5nID0gaW5pdGlhbFN0eWxlVmFsdWVzW0luaXRpYWxTdHlsaW5nVmFsdWVzSW5kZXguQ2FjaGVkU3RyaW5nVmFsdWVQb3NpdGlvbl07XG4gIGlmIChzdHlsZVN0cmluZyA9PT0gbnVsbCkge1xuICAgIHN0eWxlU3RyaW5nID0gJyc7XG4gICAgZm9yIChsZXQgaSA9IEluaXRpYWxTdHlsaW5nVmFsdWVzSW5kZXguS2V5VmFsdWVTdGFydFBvc2l0aW9uOyBpIDwgaW5pdGlhbFN0eWxlVmFsdWVzLmxlbmd0aDtcbiAgICAgICAgIGkgKz0gSW5pdGlhbFN0eWxpbmdWYWx1ZXNJbmRleC5TaXplKSB7XG4gICAgICBjb25zdCB2YWx1ZSA9IGluaXRpYWxTdHlsZVZhbHVlc1tpICsgMV07XG4gICAgICBpZiAodmFsdWUgIT09IG51bGwpIHtcbiAgICAgICAgc3R5bGVTdHJpbmcgKz0gKHN0eWxlU3RyaW5nLmxlbmd0aCA/ICc7JyA6ICcnKSArIGAke2luaXRpYWxTdHlsZVZhbHVlc1tpXX06JHt2YWx1ZX1gO1xuICAgICAgfVxuICAgIH1cbiAgICBpbml0aWFsU3R5bGVWYWx1ZXNbSW5pdGlhbFN0eWxpbmdWYWx1ZXNJbmRleC5DYWNoZWRTdHJpbmdWYWx1ZVBvc2l0aW9uXSA9IHN0eWxlU3RyaW5nO1xuICB9XG4gIHJldHVybiBzdHlsZVN0cmluZztcbn1cblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBjdXJyZW50IGNhY2hlZCBtdXRsaS12YWx1ZSBmb3IgYSBnaXZlbiBkaXJlY3RpdmVJbmRleCB3aXRoaW4gdGhlIHByb3ZpZGVkIGNvbnRleHQuXG4gKi9cbmZ1bmN0aW9uIHJlYWRDYWNoZWRNYXBWYWx1ZShcbiAgICBjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgZW50cnlJc0NsYXNzQmFzZWQ6IGJvb2xlYW4sIGRpcmVjdGl2ZUluZGV4OiBudW1iZXIpIHtcbiAgY29uc3QgdmFsdWVzOiBNYXBCYXNlZE9mZnNldFZhbHVlcyA9XG4gICAgICBjb250ZXh0W2VudHJ5SXNDbGFzc0Jhc2VkID8gU3R5bGluZ0luZGV4LkNhY2hlZE11bHRpQ2xhc3NlcyA6IFN0eWxpbmdJbmRleC5DYWNoZWRNdWx0aVN0eWxlc107XG4gIGNvbnN0IGluZGV4ID0gTWFwQmFzZWRPZmZzZXRWYWx1ZXNJbmRleC5WYWx1ZXNTdGFydFBvc2l0aW9uICtcbiAgICAgIGRpcmVjdGl2ZUluZGV4ICogTWFwQmFzZWRPZmZzZXRWYWx1ZXNJbmRleC5TaXplO1xuICByZXR1cm4gdmFsdWVzW2luZGV4ICsgTWFwQmFzZWRPZmZzZXRWYWx1ZXNJbmRleC5WYWx1ZU9mZnNldF0gfHwgbnVsbDtcbn1cblxuLyoqXG4gKiBEZXRlcm1pbmVzIHdoZXRoZXIgdGhlIHByb3ZpZGVkIG11bHRpIHN0eWxpbmcgdmFsdWUgc2hvdWxkIGJlIHVwZGF0ZWQgb3Igbm90LlxuICpcbiAqIEJlY2F1c2UgYFtzdHlsZV1gIGFuZCBgW2NsYXNzXWAgYmluZGluZ3MgcmVseSBvbiBhbiBpZGVudGl0eSBjaGFuZ2UgdG8gb2NjdXIgYmVmb3JlXG4gKiBhcHBseWluZyBuZXcgdmFsdWVzLCB0aGUgc3R5bGluZyBhbGdvcml0aG0gbWF5IG5vdCB1cGRhdGUgYW4gZXhpc3RpbmcgZW50cnkgaW50b1xuICogdGhlIGNvbnRleHQgaWYgYSBwcmV2aW91cyBkaXJlY3RpdmUncyBlbnRyeSBjaGFuZ2VkIHNoYXBlLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gd2lsbCBkZWNpZGUgd2hldGhlciBvciBub3QgYSB2YWx1ZSBzaG91bGQgYmUgYXBwbGllZCAoaWYgdGhlcmUgaXMgYVxuICogY2FjaGUgbWlzcykgdG8gdGhlIGNvbnRleHQgYmFzZWQgb24gdGhlIGZvbGxvd2luZyBydWxlczpcbiAqXG4gKiAtIElmIHRoZXJlIGlzIGFuIGlkZW50aXR5IGNoYW5nZSBiZXR3ZWVuIHRoZSBleGlzdGluZyB2YWx1ZSBhbmQgbmV3IHZhbHVlXG4gKiAtIElmIHRoZXJlIGlzIG5vIGV4aXN0aW5nIHZhbHVlIGNhY2hlZCAoZmlyc3Qgd3JpdGUpXG4gKiAtIElmIGEgcHJldmlvdXMgZGlyZWN0aXZlIGZsYWdnZWQgdGhlIGV4aXN0aW5nIGNhY2hlZCB2YWx1ZSBhcyBkaXJ0eVxuICovXG5mdW5jdGlvbiBpc011bHRpVmFsdWVDYWNoZUhpdChcbiAgICBjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgZW50cnlJc0NsYXNzQmFzZWQ6IGJvb2xlYW4sIGRpcmVjdGl2ZUluZGV4OiBudW1iZXIsXG4gICAgbmV3VmFsdWU6IGFueSk6IGJvb2xlYW4ge1xuICBjb25zdCBpbmRleE9mQ2FjaGVkVmFsdWVzID1cbiAgICAgIGVudHJ5SXNDbGFzc0Jhc2VkID8gU3R5bGluZ0luZGV4LkNhY2hlZE11bHRpQ2xhc3NlcyA6IFN0eWxpbmdJbmRleC5DYWNoZWRNdWx0aVN0eWxlcztcbiAgY29uc3QgY2FjaGVkVmFsdWVzID0gY29udGV4dFtpbmRleE9mQ2FjaGVkVmFsdWVzXSBhcyBNYXBCYXNlZE9mZnNldFZhbHVlcztcbiAgY29uc3QgaW5kZXggPSBNYXBCYXNlZE9mZnNldFZhbHVlc0luZGV4LlZhbHVlc1N0YXJ0UG9zaXRpb24gK1xuICAgICAgZGlyZWN0aXZlSW5kZXggKiBNYXBCYXNlZE9mZnNldFZhbHVlc0luZGV4LlNpemU7XG4gIGlmIChjYWNoZWRWYWx1ZXNbaW5kZXggKyBNYXBCYXNlZE9mZnNldFZhbHVlc0luZGV4LkRpcnR5RmxhZ09mZnNldF0pIHJldHVybiBmYWxzZTtcbiAgcmV0dXJuIG5ld1ZhbHVlID09PSBOT19DSEFOR0UgfHxcbiAgICAgIHJlYWRDYWNoZWRNYXBWYWx1ZShjb250ZXh0LCBlbnRyeUlzQ2xhc3NCYXNlZCwgZGlyZWN0aXZlSW5kZXgpID09PSBuZXdWYWx1ZTtcbn1cblxuLyoqXG4gKiBVcGRhdGVzIHRoZSBjYWNoZWQgc3RhdHVzIG9mIGEgbXVsdGktc3R5bGluZyB2YWx1ZSBpbiB0aGUgY29udGV4dC5cbiAqXG4gKiBUaGUgY2FjaGVkIG1hcCBhcnJheSAod2hpY2ggZXhpc3RzIGluIHRoZSBjb250ZXh0KSBjb250YWlucyBhIG1hbmlmZXN0IG9mXG4gKiBlYWNoIG11bHRpLXN0eWxpbmcgZW50cnkgKGBbc3R5bGVdYCBhbmQgYFtjbGFzc11gIGVudHJpZXMpIGZvciB0aGUgdGVtcGxhdGVcbiAqIGFzIHdlbGwgYXMgYWxsIGRpcmVjdGl2ZXMuXG4gKlxuICogVGhpcyBmdW5jdGlvbiB3aWxsIHVwZGF0ZSB0aGUgY2FjaGVkIHN0YXR1cyBvZiB0aGUgcHJvdmlkZWQgbXVsdGktc3R5bGVcbiAqIGVudHJ5IHdpdGhpbiB0aGUgY2FjaGUuXG4gKlxuICogV2hlbiBjYWxsZWQsIHRoaXMgZnVuY3Rpb24gd2lsbCB1cGRhdGUgdGhlIGZvbGxvd2luZyBpbmZvcm1hdGlvbjpcbiAqIC0gVGhlIGFjdHVhbCBjYWNoZWQgdmFsdWUgKHRoZSByYXcgdmFsdWUgdGhhdCB3YXMgcGFzc2VkIGludG8gYFtzdHlsZV1gIG9yIGBbY2xhc3NdYClcbiAqIC0gVGhlIHRvdGFsIGFtb3VudCBvZiB1bmlxdWUgc3R5bGluZyBlbnRyaWVzIHRoYXQgdGhpcyB2YWx1ZSBoYXMgd3JpdHRlbiBpbnRvIHRoZSBjb250ZXh0XG4gKiAtIFRoZSBleGFjdCBwb3NpdGlvbiBvZiB3aGVyZSB0aGUgbXVsdGkgc3R5bGluZyBlbnRyaWVzIHN0YXJ0IGluIHRoZSBjb250ZXh0IGZvciB0aGlzIGJpbmRpbmdcbiAqIC0gVGhlIGRpcnR5IGZsYWcgd2lsbCBiZSBzZXQgdG8gdHJ1ZVxuICpcbiAqIElmIHRoZSBgZGlydHlGdXR1cmVWYWx1ZXNgIHBhcmFtIGlzIHByb3ZpZGVkIHRoZW4gaXQgd2lsbCB1cGRhdGUgYWxsIGZ1dHVyZSBlbnRyaWVzIChiaW5kaW5nXG4gKiBlbnRyaWVzIHRoYXQgZXhpc3QgYXMgYXBhcnQgb2Ygb3RoZXIgZGlyZWN0aXZlcykgdG8gYmUgZGlydHkgYXMgd2VsbC4gVGhpcyB3aWxsIGZvcmNlIHRoZVxuICogc3R5bGluZyBhbGdvcml0aG0gdG8gcmVhcHBseSB0aG9zZSB2YWx1ZXMgb25jZSBjaGFuZ2UgZGV0ZWN0aW9uIGNoZWNrcyB0aGVtICh3aGljaCB3aWxsIGluXG4gKiB0dXJuIGNhdXNlIHRoZSBzdHlsaW5nIGNvbnRleHQgdG8gdXBkYXRlIGl0c2VsZiBhbmQgdGhlIGNvcnJlY3Qgc3R5bGluZyB2YWx1ZXMgd2lsbCBiZVxuICogcmVuZGVyZWQgb24gc2NyZWVuKS5cbiAqL1xuZnVuY3Rpb24gdXBkYXRlQ2FjaGVkTWFwVmFsdWUoXG4gICAgY29udGV4dDogU3R5bGluZ0NvbnRleHQsIGRpcmVjdGl2ZUluZGV4OiBudW1iZXIsIGVudHJ5SXNDbGFzc0Jhc2VkOiBib29sZWFuLCBjYWNoZVZhbHVlOiBhbnksXG4gICAgc3RhcnRQb3NpdGlvbjogbnVtYmVyLCBlbmRQb3NpdGlvbjogbnVtYmVyLCB0b3RhbFZhbHVlczogbnVtYmVyLCBkaXJ0eUZ1dHVyZVZhbHVlczogYm9vbGVhbikge1xuICBjb25zdCB2YWx1ZXMgPVxuICAgICAgY29udGV4dFtlbnRyeUlzQ2xhc3NCYXNlZCA/IFN0eWxpbmdJbmRleC5DYWNoZWRNdWx0aUNsYXNzZXMgOiBTdHlsaW5nSW5kZXguQ2FjaGVkTXVsdGlTdHlsZXNdO1xuXG4gIGNvbnN0IGluZGV4ID0gTWFwQmFzZWRPZmZzZXRWYWx1ZXNJbmRleC5WYWx1ZXNTdGFydFBvc2l0aW9uICtcbiAgICAgIGRpcmVjdGl2ZUluZGV4ICogTWFwQmFzZWRPZmZzZXRWYWx1ZXNJbmRleC5TaXplO1xuXG4gIC8vIGluIHRoZSBldmVudCB0aGF0IHRoaXMgaXMgdHJ1ZSB3ZSBhc3N1bWUgdGhhdCBmdXR1cmUgdmFsdWVzIGFyZSBkaXJ0eSBhbmQgdGhlcmVmb3JlXG4gIC8vIHdpbGwgYmUgY2hlY2tlZCBhZ2FpbiBpbiB0aGUgbmV4dCBDRCBjeWNsZVxuICBpZiAoZGlydHlGdXR1cmVWYWx1ZXMpIHtcbiAgICBjb25zdCBuZXh0U3RhcnRQb3NpdGlvbiA9IHN0YXJ0UG9zaXRpb24gKyB0b3RhbFZhbHVlcyAqIE1hcEJhc2VkT2Zmc2V0VmFsdWVzSW5kZXguU2l6ZTtcbiAgICBmb3IgKGxldCBpID0gaW5kZXggKyBNYXBCYXNlZE9mZnNldFZhbHVlc0luZGV4LlNpemU7IGkgPCB2YWx1ZXMubGVuZ3RoO1xuICAgICAgICAgaSArPSBNYXBCYXNlZE9mZnNldFZhbHVlc0luZGV4LlNpemUpIHtcbiAgICAgIHZhbHVlc1tpICsgTWFwQmFzZWRPZmZzZXRWYWx1ZXNJbmRleC5Qb3NpdGlvblN0YXJ0T2Zmc2V0XSA9IG5leHRTdGFydFBvc2l0aW9uO1xuICAgICAgdmFsdWVzW2kgKyBNYXBCYXNlZE9mZnNldFZhbHVlc0luZGV4LkRpcnR5RmxhZ09mZnNldF0gPSAxO1xuICAgIH1cbiAgfVxuXG4gIHZhbHVlc1tpbmRleCArIE1hcEJhc2VkT2Zmc2V0VmFsdWVzSW5kZXguRGlydHlGbGFnT2Zmc2V0XSA9IDA7XG4gIHZhbHVlc1tpbmRleCArIE1hcEJhc2VkT2Zmc2V0VmFsdWVzSW5kZXguUG9zaXRpb25TdGFydE9mZnNldF0gPSBzdGFydFBvc2l0aW9uO1xuICB2YWx1ZXNbaW5kZXggKyBNYXBCYXNlZE9mZnNldFZhbHVlc0luZGV4LlZhbHVlT2Zmc2V0XSA9IGNhY2hlVmFsdWU7XG4gIHZhbHVlc1tpbmRleCArIE1hcEJhc2VkT2Zmc2V0VmFsdWVzSW5kZXguVmFsdWVDb3VudE9mZnNldF0gPSB0b3RhbFZhbHVlcztcblxuICAvLyB0aGUgY29kZSBiZWxvdyBjb3VudHMgdGhlIHRvdGFsIGFtb3VudCBvZiBzdHlsaW5nIHZhbHVlcyB0aGF0IGV4aXN0IGluXG4gIC8vIHRoZSBjb250ZXh0IHVwIHVudGlsIHRoaXMgZGlyZWN0aXZlLiBUaGlzIHZhbHVlIHdpbGwgYmUgbGF0ZXIgdXNlZCB0b1xuICAvLyB1cGRhdGUgdGhlIGNhY2hlZCB2YWx1ZSBtYXAncyB0b3RhbCBjb3VudGVyIHZhbHVlLlxuICBsZXQgdG90YWxTdHlsaW5nRW50cmllcyA9IHRvdGFsVmFsdWVzO1xuICBmb3IgKGxldCBpID0gTWFwQmFzZWRPZmZzZXRWYWx1ZXNJbmRleC5WYWx1ZXNTdGFydFBvc2l0aW9uOyBpIDwgaW5kZXg7XG4gICAgICAgaSArPSBNYXBCYXNlZE9mZnNldFZhbHVlc0luZGV4LlNpemUpIHtcbiAgICB0b3RhbFN0eWxpbmdFbnRyaWVzICs9IHZhbHVlc1tpICsgTWFwQmFzZWRPZmZzZXRWYWx1ZXNJbmRleC5WYWx1ZUNvdW50T2Zmc2V0XTtcbiAgfVxuXG4gIC8vIGJlY2F1c2Ugc3R5bGUgdmFsdWVzIGNvbWUgYmVmb3JlIGNsYXNzIHZhbHVlcyBpbiB0aGUgY29udGV4dCB0aGlzIG1lYW5zXG4gIC8vIHRoYXQgaWYgYW55IG5ldyB2YWx1ZXMgd2VyZSBpbnNlcnRlZCB0aGVuIHRoZSBjYWNoZSB2YWx1ZXMgYXJyYXkgZm9yXG4gIC8vIGNsYXNzZXMgaXMgb3V0IG9mIHN5bmMuIFRoZSBjb2RlIGJlbG93IHdpbGwgdXBkYXRlIHRoZSBvZmZzZXRzIHRvIHBvaW50XG4gIC8vIHRvIHRoZWlyIG5ldyB2YWx1ZXMuXG4gIGlmICghZW50cnlJc0NsYXNzQmFzZWQpIHtcbiAgICBjb25zdCBjbGFzc0NhY2hlID0gY29udGV4dFtTdHlsaW5nSW5kZXguQ2FjaGVkTXVsdGlDbGFzc2VzXTtcbiAgICBjb25zdCBjbGFzc2VzU3RhcnRQb3NpdGlvbiA9IGNsYXNzQ2FjaGVcbiAgICAgICAgW01hcEJhc2VkT2Zmc2V0VmFsdWVzSW5kZXguVmFsdWVzU3RhcnRQb3NpdGlvbiArXG4gICAgICAgICBNYXBCYXNlZE9mZnNldFZhbHVlc0luZGV4LlBvc2l0aW9uU3RhcnRPZmZzZXRdO1xuICAgIGNvbnN0IGRpZmZJblN0YXJ0UG9zaXRpb24gPSBlbmRQb3NpdGlvbiAtIGNsYXNzZXNTdGFydFBvc2l0aW9uO1xuICAgIGZvciAobGV0IGkgPSBNYXBCYXNlZE9mZnNldFZhbHVlc0luZGV4LlZhbHVlc1N0YXJ0UG9zaXRpb247IGkgPCBjbGFzc0NhY2hlLmxlbmd0aDtcbiAgICAgICAgIGkgKz0gTWFwQmFzZWRPZmZzZXRWYWx1ZXNJbmRleC5TaXplKSB7XG4gICAgICBjbGFzc0NhY2hlW2kgKyBNYXBCYXNlZE9mZnNldFZhbHVlc0luZGV4LlBvc2l0aW9uU3RhcnRPZmZzZXRdICs9IGRpZmZJblN0YXJ0UG9zaXRpb247XG4gICAgfVxuICB9XG5cbiAgdmFsdWVzW01hcEJhc2VkT2Zmc2V0VmFsdWVzSW5kZXguRW50cmllc0NvdW50UG9zaXRpb25dID0gdG90YWxTdHlsaW5nRW50cmllcztcbn1cblxuZnVuY3Rpb24gaHlwaGVuYXRlRW50cmllcyhlbnRyaWVzOiBzdHJpbmdbXSk6IHN0cmluZ1tdIHtcbiAgY29uc3QgbmV3RW50cmllczogc3RyaW5nW10gPSBbXTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBlbnRyaWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgbmV3RW50cmllcy5wdXNoKGh5cGhlbmF0ZShlbnRyaWVzW2ldKSk7XG4gIH1cbiAgcmV0dXJuIG5ld0VudHJpZXM7XG59XG5cbmZ1bmN0aW9uIGh5cGhlbmF0ZSh2YWx1ZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHZhbHVlLnJlcGxhY2UoXG4gICAgICAvW2Etel1bQS1aXS9nLCBtYXRjaCA9PiBgJHttYXRjaC5jaGFyQXQoMCl9LSR7bWF0Y2guY2hhckF0KDEpLnRvTG93ZXJDYXNlKCl9YCk7XG59XG5cbmZ1bmN0aW9uIHJlZ2lzdGVyTXVsdGlNYXBFbnRyeShcbiAgICBjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgZGlyZWN0aXZlSW5kZXg6IG51bWJlciwgZW50cnlJc0NsYXNzQmFzZWQ6IGJvb2xlYW4sXG4gICAgc3RhcnRQb3NpdGlvbjogbnVtYmVyLCBjb3VudCA9IDApIHtcbiAgY29uc3QgY2FjaGVkVmFsdWVzID1cbiAgICAgIGNvbnRleHRbZW50cnlJc0NsYXNzQmFzZWQgPyBTdHlsaW5nSW5kZXguQ2FjaGVkTXVsdGlDbGFzc2VzIDogU3R5bGluZ0luZGV4LkNhY2hlZE11bHRpU3R5bGVzXTtcbiAgaWYgKGRpcmVjdGl2ZUluZGV4ID4gMCkge1xuICAgIGNvbnN0IGxpbWl0ID0gTWFwQmFzZWRPZmZzZXRWYWx1ZXNJbmRleC5WYWx1ZXNTdGFydFBvc2l0aW9uICtcbiAgICAgICAgKGRpcmVjdGl2ZUluZGV4ICogTWFwQmFzZWRPZmZzZXRWYWx1ZXNJbmRleC5TaXplKTtcbiAgICB3aGlsZSAoY2FjaGVkVmFsdWVzLmxlbmd0aCA8IGxpbWl0KSB7XG4gICAgICAvLyB0aGlzIG1lYW5zIHRoYXQgT05MWSBkaXJlY3RpdmUgY2xhc3Mgc3R5bGluZyAobGlrZSBuZ0NsYXNzKSB3YXMgdXNlZFxuICAgICAgLy8gdGhlcmVmb3JlIHRoZSByb290IGRpcmVjdGl2ZSB3aWxsIHN0aWxsIG5lZWQgdG8gYmUgZmlsbGVkIGluIGFzIHdlbGxcbiAgICAgIC8vIGFzIGFueSBvdGhlciBkaXJlY3RpdmUgc3BhY2VzIGluY2FzZSB0aGV5IG9ubHkgdXNlZCBzdGF0aWMgdmFsdWVzXG4gICAgICBjYWNoZWRWYWx1ZXMucHVzaCgwLCBzdGFydFBvc2l0aW9uLCBudWxsLCAwKTtcbiAgICB9XG4gIH1cbiAgY2FjaGVkVmFsdWVzLnB1c2goMCwgc3RhcnRQb3NpdGlvbiwgbnVsbCwgY291bnQpO1xufVxuXG4vKipcbiAqIEluc2VydHMgb3IgdXBkYXRlcyBhbiBleGlzdGluZyBlbnRyeSBpbiB0aGUgcHJvdmlkZWQgYHN0YXRpY1N0eWxlc2AgY29sbGVjdGlvbi5cbiAqXG4gKiBAcGFyYW0gaW5kZXggdGhlIGluZGV4IHJlcHJlc2VudGluZyBhbiBleGlzdGluZyBzdHlsaW5nIGVudHJ5IGluIHRoZSBjb2xsZWN0aW9uOlxuICogIGlmIHByb3ZpZGVkIChudW1lcmljKTogdGhlbiBpdCB3aWxsIHVwZGF0ZSB0aGUgZXhpc3RpbmcgZW50cnkgYXQgdGhlIGdpdmVuIHBvc2l0aW9uXG4gKiAgaWYgbnVsbDogdGhlbiBpdCB3aWxsIGluc2VydCBhIG5ldyBlbnRyeSB3aXRoaW4gdGhlIGNvbGxlY3Rpb25cbiAqIEBwYXJhbSBzdGF0aWNTdHlsZXMgYSBjb2xsZWN0aW9uIG9mIHN0eWxlIG9yIGNsYXNzIGVudHJpZXMgd2hlcmUgdGhlIHZhbHVlIHdpbGxcbiAqICBiZSBpbnNlcnRlZCBvciBwYXRjaGVkXG4gKiBAcGFyYW0gcHJvcCB0aGUgcHJvcGVydHkgdmFsdWUgb2YgdGhlIGVudHJ5IChlLmcuIGB3aWR0aGAgKHN0eWxlcykgb3IgYGZvb2AgKGNsYXNzZXMpKVxuICogQHBhcmFtIHZhbHVlIHRoZSBzdHlsaW5nIHZhbHVlIG9mIHRoZSBlbnRyeSAoZS5nLiBgYWJzb2x1dGVgIChzdHlsZXMpIG9yIGB0cnVlYCAoY2xhc3NlcykpXG4gKiBAcGFyYW0gZGlyZWN0aXZlT3duZXJJbmRleCB0aGUgZGlyZWN0aXZlIG93bmVyIGluZGV4IHZhbHVlIG9mIHRoZSBzdHlsaW5nIHNvdXJjZSByZXNwb25zaWJsZVxuICogICAgICAgIGZvciB0aGVzZSBzdHlsZXMgKHNlZSBgaW50ZXJmYWNlcy9zdHlsaW5nLnRzI2RpcmVjdGl2ZXNgIGZvciBtb3JlIGluZm8pXG4gKiBAcmV0dXJucyB0aGUgaW5kZXggb2YgdGhlIHVwZGF0ZWQgb3IgbmV3IGVudHJ5IHdpdGhpbiB0aGUgY29sbGVjdGlvblxuICovXG5mdW5jdGlvbiBhZGRPclVwZGF0ZVN0YXRpY1N0eWxlKFxuICAgIGluZGV4OiBudW1iZXIgfCBudWxsLCBzdGF0aWNTdHlsZXM6IEluaXRpYWxTdHlsaW5nVmFsdWVzLCBwcm9wOiBzdHJpbmcsXG4gICAgdmFsdWU6IHN0cmluZyB8IGJvb2xlYW4gfCBudWxsLCBkaXJlY3RpdmVPd25lckluZGV4OiBudW1iZXIpIHtcbiAgaWYgKGluZGV4ID09PSBudWxsKSB7XG4gICAgaW5kZXggPSBzdGF0aWNTdHlsZXMubGVuZ3RoO1xuICAgIHN0YXRpY1N0eWxlcy5wdXNoKG51bGwsIG51bGwsIG51bGwpO1xuICAgIHN0YXRpY1N0eWxlc1tpbmRleCArIEluaXRpYWxTdHlsaW5nVmFsdWVzSW5kZXguUHJvcE9mZnNldF0gPSBwcm9wO1xuICB9XG4gIHN0YXRpY1N0eWxlc1tpbmRleCArIEluaXRpYWxTdHlsaW5nVmFsdWVzSW5kZXguVmFsdWVPZmZzZXRdID0gdmFsdWU7XG4gIHN0YXRpY1N0eWxlc1tpbmRleCArIEluaXRpYWxTdHlsaW5nVmFsdWVzSW5kZXguRGlyZWN0aXZlT3duZXJPZmZzZXRdID0gZGlyZWN0aXZlT3duZXJJbmRleDtcbiAgcmV0dXJuIGluZGV4O1xufVxuIl19