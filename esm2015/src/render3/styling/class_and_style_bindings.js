/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
import { EMPTY_ARRAY, EMPTY_OBJ } from '../empty';
import { RendererStyleFlags3, isProceduralRenderer } from '../interfaces/renderer';
import { NO_CHANGE } from '../tokens';
import { getRootContext } from '../util/view_traversal_utils';
import { allowFlush as allowHostInstructionsQueueFlush, flushQueue as flushHostInstructionsQueue } from './host_instructions_queue';
import { BoundPlayerFactory } from './player_factory';
import { addPlayerInternal, allocPlayerContext, allocateOrUpdateDirectiveIntoContext, createEmptyStylingContext, getPlayerContext } from './util';
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
 * @param {?=} directiveIndex
 * @return {?}
 */
export function initializeStaticContext(attrs, stylingStartIndex, directiveIndex = 0) {
    /** @type {?} */
    const context = createEmptyStylingContext();
    patchContextWithStaticAttrs(context, attrs, stylingStartIndex, directiveIndex);
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
 * @param {?} directiveIndex
 * @return {?}
 */
export function patchContextWithStaticAttrs(context, attrs, attrsStylingStartIndex, directiveIndex) {
    // this means the context has already been set and instantiated
    if (context[1 /* MasterFlagPosition */] & 16 /* BindingAllocationLocked */)
        return;
    allocateOrUpdateDirectiveIntoContext(context, directiveIndex);
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
 * Runs through the initial class values present in the provided
 * context and renders them via the provided renderer on the element.
 *
 * @param {?} element the element the styling will be applied to
 * @param {?} context the source styling context which contains the initial class values
 * @param {?} renderer the renderer instance that will be used to apply the class
 * @param {?=} startIndex
 * @return {?} the index that the classes were applied up until
 */
export function renderInitialClasses(element, context, renderer, startIndex) {
    /** @type {?} */
    const initialClasses = context[4 /* InitialClassValuesPosition */];
    /** @type {?} */
    let i = startIndex || 2 /* KeyValueStartPosition */;
    while (i < initialClasses.length) {
        /** @type {?} */
        const value = initialClasses[i + 1 /* ValueOffset */];
        if (value) {
            setClass(element, (/** @type {?} */ (initialClasses[i + 0 /* PropOffset */])), true, renderer, null);
        }
        i += 3 /* Size */;
    }
    return i;
}
/**
 * Runs through the initial styles values present in the provided
 * context and renders them via the provided renderer on the element.
 *
 * @param {?} element the element the styling will be applied to
 * @param {?} context the source styling context which contains the initial class values
 * @param {?} renderer the renderer instance that will be used to apply the class
 * @param {?=} startIndex
 * @return {?} the index that the styles were applied up until
 */
export function renderInitialStyles(element, context, renderer, startIndex) {
    /** @type {?} */
    const initialStyles = context[3 /* InitialStyleValuesPosition */];
    /** @type {?} */
    let i = startIndex || 2 /* KeyValueStartPosition */;
    while (i < initialStyles.length) {
        /** @type {?} */
        const value = initialStyles[i + 1 /* ValueOffset */];
        if (value) {
            setStyle(element, (/** @type {?} */ (initialStyles[i + 0 /* PropOffset */])), (/** @type {?} */ (value)), renderer, null);
        }
        i += 3 /* Size */;
    }
    return i;
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
 * @param {?} directiveIndex
 * @param {?=} classBindingNames an array of class binding names that will be added to the context
 * @param {?=} styleBindingNames an array of style binding names that will be added to the context
 * @param {?=} styleSanitizer an optional sanitizer that handle all sanitization on for each of
 *    the bindings added to the context. Note that if a directive is provided then the sanitizer
 *    instance will only be active if and when the directive updates the bindings that it owns.
 * @return {?}
 */
export function updateContextWithBindings(context, directiveIndex, classBindingNames, styleBindingNames, styleSanitizer) {
    if (context[1 /* MasterFlagPosition */] & 16 /* BindingAllocationLocked */)
        return;
    // this means the context has already been patched with the directive's bindings
    /** @type {?} */
    const isNewDirective = findOrPatchDirectiveIntoRegistry(context, directiveIndex, false, styleSanitizer);
    if (!isNewDirective) {
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
    const singleStylesStartIndex = 10 /* SingleStylesStartPosition */;
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
        // is ALWAYS added in case a follow-up directive introduces the same initial
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
 * @param {?} directiveIndex
 * @param {?} staticModeOnly
 * @param {?=} styleSanitizer
 * @return {?}
 */
export function findOrPatchDirectiveIntoRegistry(context, directiveIndex, staticModeOnly, styleSanitizer) {
    /** @type {?} */
    const directiveRegistry = context[2 /* DirectiveRegistryPosition */];
    /** @type {?} */
    const index = directiveIndex * 2 /* Size */;
    /** @type {?} */
    const singlePropStartPosition = index + 0 /* SinglePropValuesIndexOffset */;
    // this means that the directive has already been registered into the registry
    if (index < directiveRegistry.length &&
        ((/** @type {?} */ (directiveRegistry[singlePropStartPosition]))) >= 0)
        return false;
    /** @type {?} */
    const singlePropsStartIndex = staticModeOnly ? -1 : context[5 /* SinglePropOffsetPositions */].length;
    allocateOrUpdateDirectiveIntoContext(context, directiveIndex, singlePropsStartIndex, styleSanitizer);
    return true;
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
 * @param {?=} directiveIndex
 * @return {?}
 */
export function updateStylingMap(context, classesInput, stylesInput, directiveIndex = 0) {
    ngDevMode && ngDevMode.stylingMap++;
    ngDevMode && assertValidDirectiveIndex(context, directiveIndex);
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
    ngDevMode && ngDevMode.stylingMapCacheMiss++;
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
                // this is an early exit in case a value was already encountered above in the
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
    // values (also follow-up directives can write new values in case earlier directives set anything
    // to null due to removals or falsy values).
    valuesEntryShapeChange = valuesEntryShapeChange || existingCachedValueCount !== totalUniqueValues;
    updateCachedMapValue(context, directiveIndex, entryIsClassBased, cacheValue, ownershipValuesStartIndex, ctxEnd, totalUniqueValues, valuesEntryShapeChange);
    if (dirty) {
        setContextDirty(context, true);
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
 * @param {?=} directiveIndex
 * @param {?=} forceOverride whether or not to skip all directive prioritization
 *    and just apply the value regardless.
 * @return {?}
 */
export function updateClassProp(context, offset, input, directiveIndex = 0, forceOverride) {
    updateSingleStylingValue(context, offset, input, true, directiveIndex, forceOverride);
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
 * @param {?=} directiveIndex
 * @param {?=} forceOverride whether or not to skip all directive prioritization
 *    and just apply the value regardless.
 * @return {?}
 */
export function updateStyleProp(context, offset, input, directiveIndex = 0, forceOverride) {
    updateSingleStylingValue(context, offset, input, false, directiveIndex, forceOverride);
}
/**
 * @param {?} context
 * @param {?} offset
 * @param {?} input
 * @param {?} isClassBased
 * @param {?} directiveIndex
 * @param {?=} forceOverride
 * @return {?}
 */
function updateSingleStylingValue(context, offset, input, isClassBased, directiveIndex, forceOverride) {
    ngDevMode && assertValidDirectiveIndex(context, directiveIndex);
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
    ngDevMode && ngDevMode.stylingProp++;
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
            setContextDirty(context, true);
        }
        if (playerBuildersAreDirty) {
            setContextPlayersDirty(context, true);
        }
        ngDevMode && ngDevMode.stylingPropCacheMiss++;
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
 * @param {?=} directiveIndex
 * @return {?} number the total amount of players that got queued for animation (if any)
 */
export function renderStyling(context, renderer, rootOrView, isFirstRender, classesStore, stylesStore, directiveIndex = 0) {
    /** @type {?} */
    let totalPlayersQueued = 0;
    ngDevMode && ngDevMode.stylingApply++;
    // this prevents multiple attempts to render style/class values on
    // the same element...
    if (allowHostInstructionsQueueFlush(context, directiveIndex)) {
        // all styling instructions present within any hostBindings functions
        // do not update the context immediately when called. They are instead
        // queued up and applied to the context right at this point. Why? This
        // is because Angular evaluates component/directive and directive
        // sub-class code at different points and it's important that the
        // styling values are applied to the context in the right order
        // (see `interfaces/styling.ts` for more information).
        flushHostInstructionsQueue(context);
        if (isContextDirty(context)) {
            ngDevMode && ngDevMode.stylingApplyCacheMiss++;
            // this is here to prevent things like <ng-container [style] [class]>...</ng-container>
            // or if there are any host style or class bindings present in a directive set on
            // a container node
            /** @type {?} */
            const native = (/** @type {?} */ ((/** @type {?} */ (context[0 /* ElementPosition */]))));
            /** @type {?} */
            const flushPlayerBuilders = context[1 /* MasterFlagPosition */] & 8 /* PlayerBuildersDirty */;
            /** @type {?} */
            const multiStartIndex = getMultiStylesStartIndex(context);
            for (let i = 10 /* SingleStylesStartPosition */; i < context.length; i += 4 /* Size */) {
                // there is no point in rendering styles that have not changed on screen
                if (isDirty(context, i)) {
                    /** @type {?} */
                    const flag = getPointers(context, i);
                    /** @type {?} */
                    const directiveIndex = getDirectiveIndexFromEntry(context, i);
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
                    /** @type {?} */
                    const doApplyValue = renderer && (isFirstRender ? valueToApply : true);
                    if (doApplyValue) {
                        if (isClassBased) {
                            setClass(native, prop, valueToApply ? true : false, (/** @type {?} */ (renderer)), classesStore, playerBuilder);
                        }
                        else {
                            setStyle(native, prop, (/** @type {?} */ (valueToApply)), (/** @type {?} */ (renderer)), styleSanitizer, stylesStore, playerBuilder);
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
            setContextDirty(context, false);
        }
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
    const adjustedIndex = index >= 10 /* SingleStylesStartPosition */ ? (index + 0 /* FlagsOffset */) : index;
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
    const adjustedIndex = index >= 10 /* SingleStylesStartPosition */ ? (index + 0 /* FlagsOffset */) : index;
    return (((/** @type {?} */ (context[adjustedIndex]))) & 1 /* Dirty */) == 1 /* Dirty */;
}
/**
 * @param {?} context
 * @param {?} index
 * @return {?}
 */
export function isClassBasedValue(context, index) {
    /** @type {?} */
    const adjustedIndex = index >= 10 /* SingleStylesStartPosition */ ? (index + 0 /* FlagsOffset */) : index;
    return (((/** @type {?} */ (context[adjustedIndex]))) & 2 /* Class */) == 2 /* Class */;
}
/**
 * @param {?} context
 * @param {?} index
 * @return {?}
 */
function isSanitizable(context, index) {
    /** @type {?} */
    const adjustedIndex = index >= 10 /* SingleStylesStartPosition */ ? (index + 0 /* FlagsOffset */) : index;
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
    return index >= 10 /* SingleStylesStartPosition */ ? index : -1;
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
    const playerContext = (/** @type {?} */ (context[9 /* PlayerContext */]));
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
    let playerContext = context[9 /* PlayerContext */] || allocPlayerContext(context);
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
        const playerContext = context[9 /* PlayerContext */];
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
    Object.keys(a.flags).forEach((/**
     * @param {?} name
     * @return {?}
     */
    name => { diffSummaryValues(diffs, 'flags.' + name, name, a.flags, b.flags); }));
    if (diffs.length) {
        log.push('Log Summaries for:');
        log.push('  A: ' + a.name);
        log.push('  B: ' + b.name);
        log.push('\n  Differ in the following way (A !== B):');
        diffs.forEach((/**
         * @param {?} result
         * @return {?}
         */
        result => {
            const [name, aVal, bVal] = result;
            log.push('    => ' + name);
            log.push('    => ' + aVal + ' !== ' + bVal + '\n');
        }));
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
    const singlePropOffsetRegistryIndex = (/** @type {?} */ (context[2 /* DirectiveRegistryPosition */][(directiveIndex * 2 /* Size */) +
        0 /* SinglePropValuesIndexOffset */]));
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
    const value = dirs[directiveIndex * 2 /* Size */ +
        1 /* StyleSanitizerOffset */] ||
        dirs[1 /* StyleSanitizerOffset */] || null;
    return (/** @type {?} */ (value));
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
    return value.replace(/[a-z][A-Z]/g, (/**
     * @param {?} match
     * @return {?}
     */
    match => `${match.charAt(0)}-${match.charAt(1).toLowerCase()}`));
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
            // as any other directive spaces in case they only used static values
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
/**
 * @param {?} context
 * @param {?} directiveIndex
 * @return {?}
 */
function assertValidDirectiveIndex(context, directiveIndex) {
    /** @type {?} */
    const dirs = context[2 /* DirectiveRegistryPosition */];
    /** @type {?} */
    const index = directiveIndex * 2 /* Size */;
    if (index >= dirs.length ||
        dirs[index + 0 /* SinglePropValuesIndexOffset */] === -1) {
        throw new Error('The provided directive is not registered with the styling context');
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xhc3NfYW5kX3N0eWxlX2JpbmRpbmdzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9zdHlsaW5nL2NsYXNzX2FuZF9zdHlsZV9iaW5kaW5ncy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7O0FBUUEsT0FBTyxFQUFDLFdBQVcsRUFBRSxTQUFTLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFHaEQsT0FBTyxFQUFzQixtQkFBbUIsRUFBRSxvQkFBb0IsRUFBQyxNQUFNLHdCQUF3QixDQUFDO0FBR3RHLE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxXQUFXLENBQUM7QUFDcEMsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLDhCQUE4QixDQUFDO0FBRTVELE9BQU8sRUFBQyxVQUFVLElBQUksK0JBQStCLEVBQUUsVUFBVSxJQUFJLDBCQUEwQixFQUFDLE1BQU0sMkJBQTJCLENBQUM7QUFDbEksT0FBTyxFQUFDLGtCQUFrQixFQUFDLE1BQU0sa0JBQWtCLENBQUM7QUFDcEQsT0FBTyxFQUFDLGlCQUFpQixFQUFFLGtCQUFrQixFQUFFLG9DQUFvQyxFQUFFLHlCQUF5QixFQUFFLGdCQUFnQixFQUFDLE1BQU0sUUFBUSxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQXdCaEosTUFBTSxVQUFVLHVCQUF1QixDQUNuQyxLQUFrQixFQUFFLGlCQUF5QixFQUFFLGlCQUF5QixDQUFDOztVQUNyRSxPQUFPLEdBQUcseUJBQXlCLEVBQUU7SUFDM0MsMkJBQTJCLENBQUMsT0FBTyxFQUFFLEtBQUssRUFBRSxpQkFBaUIsRUFBRSxjQUFjLENBQUMsQ0FBQztJQUMvRSxPQUFPLE9BQU8sQ0FBQztBQUNqQixDQUFDOzs7Ozs7Ozs7Ozs7O0FBWUQsTUFBTSxVQUFVLDJCQUEyQixDQUN2QyxPQUF1QixFQUFFLEtBQWtCLEVBQUUsc0JBQThCLEVBQzNFLGNBQXNCO0lBQ3hCLCtEQUErRDtJQUMvRCxJQUFJLE9BQU8sNEJBQWlDLG1DQUF1QztRQUFFLE9BQU87SUFFNUYsb0NBQW9DLENBQUMsT0FBTyxFQUFFLGNBQWMsQ0FBQyxDQUFDOztRQUUxRCxjQUFjLEdBQThCLElBQUk7O1FBQ2hELGFBQWEsR0FBOEIsSUFBSTs7UUFDL0MsSUFBSSxHQUFHLENBQUMsQ0FBQztJQUNiLEtBQUssSUFBSSxDQUFDLEdBQUcsc0JBQXNCLEVBQUUsQ0FBQyxHQUFHLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7O2NBQ3BELElBQUksR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBQ3JCLElBQUksT0FBTyxJQUFJLElBQUksUUFBUSxFQUFFO1lBQzNCLElBQUksR0FBRyxJQUFJLENBQUM7U0FDYjthQUFNLElBQUksSUFBSSxtQkFBMkIsRUFBRTtZQUMxQyxjQUFjLEdBQUcsY0FBYyxJQUFJLE9BQU8sb0NBQXlDLENBQUM7WUFDcEYsd0JBQXdCLENBQUMsY0FBYyxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsY0FBYyxDQUFDLENBQUM7U0FDdEU7YUFBTSxJQUFJLElBQUksa0JBQTBCLEVBQUU7WUFDekMsYUFBYSxHQUFHLGFBQWEsSUFBSSxPQUFPLG9DQUF5QyxDQUFDO1lBQ2xGLHdCQUF3QixDQUFDLGFBQWEsRUFBRSxJQUFJLEVBQUUsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsY0FBYyxDQUFDLENBQUM7U0FDM0U7S0FDRjtBQUNILENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQXdCRCxTQUFTLHdCQUF3QixDQUM3QixjQUFvQyxFQUFFLElBQVksRUFBRSxLQUFVLEVBQzlELG1CQUEyQjtJQUM3QixLQUFLLElBQUksQ0FBQyxnQ0FBa0QsRUFBRSxDQUFDLEdBQUcsY0FBYyxDQUFDLE1BQU0sRUFDbEYsQ0FBQyxnQkFBa0MsRUFBRTs7Y0FDbEMsR0FBRyxHQUFHLGNBQWMsQ0FBQyxDQUFDLHFCQUF1QyxDQUFDO1FBQ3BFLElBQUksR0FBRyxLQUFLLElBQUksRUFBRTs7a0JBQ1YsYUFBYSxHQUNmLG1CQUFBLGNBQWMsQ0FBQyxDQUFDLHNCQUF3QyxDQUFDLEVBQTJCOztrQkFDbEYsYUFBYSxHQUNmLG1CQUFBLGNBQWMsQ0FBQyxDQUFDLCtCQUFpRCxDQUFDLEVBQVU7WUFDaEYsSUFBSSxnQkFBZ0IsQ0FBQyxhQUFhLEVBQUUsS0FBSyxFQUFFLGFBQWEsRUFBRSxtQkFBbUIsQ0FBQyxFQUFFO2dCQUM5RSxzQkFBc0IsQ0FBQyxDQUFDLEVBQUUsY0FBYyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsbUJBQW1CLENBQUMsQ0FBQzthQUM3RTtZQUNELE9BQU87U0FDUjtLQUNGO0lBRUQsK0NBQStDO0lBQy9DLHNCQUFzQixDQUFDLElBQUksRUFBRSxjQUFjLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxtQkFBbUIsQ0FBQyxDQUFDO0FBQ2pGLENBQUM7Ozs7Ozs7Ozs7O0FBV0QsTUFBTSxVQUFVLG9CQUFvQixDQUNoQyxPQUFpQixFQUFFLE9BQXVCLEVBQUUsUUFBbUIsRUFBRSxVQUFtQjs7VUFDaEYsY0FBYyxHQUFHLE9BQU8sb0NBQXlDOztRQUNuRSxDQUFDLEdBQUcsVUFBVSxpQ0FBbUQ7SUFDckUsT0FBTyxDQUFDLEdBQUcsY0FBYyxDQUFDLE1BQU0sRUFBRTs7Y0FDMUIsS0FBSyxHQUFHLGNBQWMsQ0FBQyxDQUFDLHNCQUF3QyxDQUFDO1FBQ3ZFLElBQUksS0FBSyxFQUFFO1lBQ1QsUUFBUSxDQUNKLE9BQU8sRUFBRSxtQkFBQSxjQUFjLENBQUMsQ0FBQyxxQkFBdUMsQ0FBQyxFQUFVLEVBQUUsSUFBSSxFQUNqRixRQUFRLEVBQUUsSUFBSSxDQUFDLENBQUM7U0FDckI7UUFDRCxDQUFDLGdCQUFrQyxDQUFDO0tBQ3JDO0lBQ0QsT0FBTyxDQUFDLENBQUM7QUFDWCxDQUFDOzs7Ozs7Ozs7OztBQVdELE1BQU0sVUFBVSxtQkFBbUIsQ0FDL0IsT0FBaUIsRUFBRSxPQUF1QixFQUFFLFFBQW1CLEVBQUUsVUFBbUI7O1VBQ2hGLGFBQWEsR0FBRyxPQUFPLG9DQUF5Qzs7UUFDbEUsQ0FBQyxHQUFHLFVBQVUsaUNBQW1EO0lBQ3JFLE9BQU8sQ0FBQyxHQUFHLGFBQWEsQ0FBQyxNQUFNLEVBQUU7O2NBQ3pCLEtBQUssR0FBRyxhQUFhLENBQUMsQ0FBQyxzQkFBd0MsQ0FBQztRQUN0RSxJQUFJLEtBQUssRUFBRTtZQUNULFFBQVEsQ0FDSixPQUFPLEVBQUUsbUJBQUEsYUFBYSxDQUFDLENBQUMscUJBQXVDLENBQUMsRUFBVSxFQUMxRSxtQkFBQSxLQUFLLEVBQVUsRUFBRSxRQUFRLEVBQUUsSUFBSSxDQUFDLENBQUM7U0FDdEM7UUFDRCxDQUFDLGdCQUFrQyxDQUFDO0tBQ3JDO0lBQ0QsT0FBTyxDQUFDLENBQUM7QUFDWCxDQUFDOzs7OztBQUVELE1BQU0sVUFBVSxpQ0FBaUMsQ0FBQyxPQUF1QjtJQUN2RSxPQUFPLENBQUMsT0FBTyw0QkFBaUMsbUNBQXVDLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDakcsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7OztBQWVELE1BQU0sVUFBVSx5QkFBeUIsQ0FDckMsT0FBdUIsRUFBRSxjQUFzQixFQUFFLGlCQUFtQyxFQUNwRixpQkFBbUMsRUFBRSxjQUF1QztJQUM5RSxJQUFJLE9BQU8sNEJBQWlDLG1DQUF1QztRQUFFLE9BQU87OztVQUd0RixjQUFjLEdBQ2hCLGdDQUFnQyxDQUFDLE9BQU8sRUFBRSxjQUFjLEVBQUUsS0FBSyxFQUFFLGNBQWMsQ0FBQztJQUNwRixJQUFJLENBQUMsY0FBYyxFQUFFO1FBQ25CLHNGQUFzRjtRQUN0RixPQUFPO0tBQ1I7SUFFRCxJQUFJLGlCQUFpQixFQUFFO1FBQ3JCLGlCQUFpQixHQUFHLGdCQUFnQixDQUFDLGlCQUFpQixDQUFDLENBQUM7S0FDekQ7Ozs7Ozs7VUFPSyxzQkFBc0IsR0FBRyxPQUFPLG1DQUF3Qzs7VUFDeEUseUJBQXlCLEdBQzNCLHNCQUFzQiw4QkFBa0Q7O1VBQ3RFLHlCQUF5QixHQUMzQixzQkFBc0IsNkJBQWlEOztVQUVyRSxvQkFBb0IsR0FBRyxPQUFPLDRCQUFpQzs7VUFDL0Qsb0JBQW9CLEdBQUcsT0FBTywyQkFBZ0M7O1VBRTlELGFBQWEsR0FBRyx5QkFBeUIsZUFBb0I7O1VBQzdELFlBQVksR0FBRyx5QkFBeUIsZUFBb0I7O1VBRTVELHNCQUFzQixxQ0FBeUM7O1FBQ2pFLHVCQUF1QixHQUFHLHNCQUFzQixHQUFHLFlBQVk7O1FBQy9ELHFCQUFxQixHQUFHLHVCQUF1QixHQUFHLGFBQWE7O1FBQy9ELHNCQUFzQixHQUFHLHFCQUFxQixHQUFHLFlBQVk7Ozs7Ozs7Ozs7VUFVM0Qsd0JBQXdCLEdBQUcsc0JBQXNCLENBQUMsTUFBTTtJQUM5RCxzQkFBc0IsQ0FBQyxJQUFJLENBQ3ZCLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxpQkFBaUIsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFDaEQsaUJBQWlCLENBQUMsQ0FBQyxDQUFDLGlCQUFpQixDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Ozs7O1FBS2xELGVBQWUsR0FBRyxDQUFDOztVQUNqQix5QkFBeUIsR0FBYSxFQUFFO0lBQzlDLElBQUksaUJBQWlCLElBQUksaUJBQWlCLENBQUMsTUFBTSxFQUFFO1FBQ2pELEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxpQkFBaUIsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7O2tCQUMzQyxJQUFJLEdBQUcsaUJBQWlCLENBQUMsQ0FBQyxDQUFDOztnQkFDN0IsZUFBZSxHQUNmLHVCQUF1QixDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsc0JBQXNCLEVBQUUsdUJBQXVCLENBQUM7WUFDM0YsSUFBSSxlQUFlLElBQUksQ0FBQyxDQUFDLEVBQUU7Z0JBQ3pCLGVBQWUsR0FBRyx1QkFBdUIsR0FBRyxlQUFlLENBQUM7Z0JBQzVELGVBQWUsZ0JBQXFCLENBQUM7Z0JBQ3JDLHlCQUF5QixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQzthQUN0QztZQUNELHNCQUFzQixDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsQ0FBQztTQUM5QztLQUNGOzs7VUFHSyx5QkFBeUIsR0FBYSxFQUFFO0lBQzlDLElBQUksaUJBQWlCLElBQUksaUJBQWlCLENBQUMsTUFBTSxFQUFFO1FBQ2pELEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxpQkFBaUIsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7O2tCQUMzQyxJQUFJLEdBQUcsaUJBQWlCLENBQUMsQ0FBQyxDQUFDOztnQkFDN0IsZUFBZSxHQUNmLHVCQUF1QixDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsdUJBQXVCLEVBQUUscUJBQXFCLENBQUM7WUFDMUYsSUFBSSxlQUFlLElBQUksQ0FBQyxDQUFDLEVBQUU7Z0JBQ3pCLGVBQWUsR0FBRyxxQkFBcUIsR0FBRyxlQUFlLENBQUM7Z0JBQzFELGVBQWUsZ0JBQXFCLENBQUM7Z0JBQ3JDLHlCQUF5QixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQzthQUN0QztpQkFBTTtnQkFDTCxlQUFlLElBQUkseUJBQXlCLENBQUMsTUFBTSxlQUFvQixDQUFDO2FBQ3pFO1lBQ0Qsc0JBQXNCLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDO1NBQzlDO0tBQ0Y7Ozs7OztRQU1HLENBQUMsNkJBQWlEO0lBQ3RELElBQUkseUJBQXlCLENBQUMsTUFBTSxFQUFFO1FBQ3BDLE9BQU8sQ0FBQyxHQUFHLHdCQUF3QixFQUFFOztrQkFDN0IsV0FBVyxHQUNiLHNCQUFzQixDQUFDLENBQUMsOEJBQWtELENBQUM7O2tCQUN6RSxZQUFZLEdBQ2Qsc0JBQXNCLENBQUMsQ0FBQywrQkFBbUQsQ0FBQztZQUNoRixJQUFJLFlBQVksRUFBRTs7c0JBQ1YsS0FBSyxHQUFHLENBQUMsNkJBQWlELEdBQUcsV0FBVztnQkFDOUUsS0FBSyxJQUFJLENBQUMsR0FBRyxLQUFLLEVBQUUsQ0FBQyxHQUFHLEtBQUssR0FBRyxZQUFZLEVBQUUsQ0FBQyxFQUFFLEVBQUU7b0JBQ2pELHNCQUFzQixDQUFDLENBQUMsQ0FBQyxJQUFJLHlCQUF5QixDQUFDLE1BQU0sZUFBb0IsQ0FBQztpQkFDbkY7YUFDRjs7a0JBRUssS0FBSyxHQUFHLFdBQVcsR0FBRyxZQUFZO1lBQ3hDLENBQUMsSUFBSSw2QkFBaUQsS0FBSyxDQUFDO1NBQzdEO0tBQ0Y7O1VBRUssZUFBZSxHQUFHLHlCQUF5QixDQUFDLE1BQU0sR0FBRyx5QkFBeUIsQ0FBQyxNQUFNO0lBRTNGLDRGQUE0RjtJQUM1Riw0RkFBNEY7SUFDNUYseUNBQXlDO0lBQ3pDLEtBQUssSUFBSSxDQUFDLEdBQUcsc0JBQXNCLEVBQUUsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxnQkFBcUIsRUFBRTs7Y0FDekUsWUFBWSxHQUFHLENBQUMsSUFBSSxxQkFBcUI7O2NBQ3pDLFlBQVksR0FBRyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLHNCQUFzQixDQUFDLENBQUMsQ0FBQyx1QkFBdUIsQ0FBQzs7Y0FDckYsSUFBSSxHQUFHLFdBQVcsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDOztjQUM5QixXQUFXLEdBQUcsZUFBZSxDQUFDLElBQUksQ0FBQzs7WUFDckMsa0JBQWtCLEdBQUcscUJBQXFCLENBQUMsSUFBSSxDQUFDO1FBQ3BELElBQUksWUFBWSxFQUFFO1lBQ2hCLGtCQUFrQjtnQkFDZCxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUMseUJBQXlCLENBQUMsTUFBTSxlQUFvQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztTQUMvRTthQUFNO1lBQ0wsa0JBQWtCLElBQUksQ0FBQyxlQUFlLGVBQW9CLENBQUM7Z0JBQ3ZELENBQUMsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLHlCQUF5QixDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLGVBQW9CLENBQUMsQ0FBQztTQUNqRjtRQUNELE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQyxFQUFFLFFBQVEsQ0FBQyxJQUFJLEVBQUUsV0FBVyxFQUFFLGtCQUFrQixDQUFDLENBQUMsQ0FBQztLQUN0RTtJQUVELHdFQUF3RTtJQUN4RSxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcseUJBQXlCLENBQUMsTUFBTSxlQUFvQixFQUFFLENBQUMsRUFBRSxFQUFFO1FBQzdFLE9BQU8sQ0FBQyxNQUFNLENBQUMsc0JBQXNCLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ2hELE9BQU8sQ0FBQyxNQUFNLENBQUMsdUJBQXVCLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ2pELHVCQUF1QixFQUFFLENBQUM7UUFDMUIscUJBQXFCLEVBQUUsQ0FBQztRQUN4QixzQkFBc0IsSUFBSSxDQUFDLENBQUMsQ0FBRSwwQ0FBMEM7S0FDekU7SUFFRCx3RUFBd0U7SUFDeEUsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLHlCQUF5QixDQUFDLE1BQU0sZUFBb0IsRUFBRSxDQUFDLEVBQUUsRUFBRTtRQUM3RSxPQUFPLENBQUMsTUFBTSxDQUFDLHFCQUFxQixFQUFFLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUMvQyxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ25CLHFCQUFxQixFQUFFLENBQUM7UUFDeEIsc0JBQXNCLEVBQUUsQ0FBQztLQUMxQjs7VUFFSyxjQUFjLEdBQUcsT0FBTyxvQ0FBeUM7O1VBQ2pFLGFBQWEsR0FBRyxPQUFPLG9DQUF5QztJQUV0RSx3RkFBd0Y7SUFDeEYsdUZBQXVGO0lBQ3ZGLDRGQUE0RjtJQUM1RixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsZUFBZSxFQUFFLENBQUMsRUFBRSxFQUFFOztjQUNsQyxpQkFBaUIsR0FBRyxDQUFDLElBQUkseUJBQXlCLENBQUMsTUFBTTs7Y0FDekQsYUFBYSxHQUFHLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyx5QkFBeUIsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQzs7Y0FDOUUsUUFBUSxHQUFHLGlCQUFpQixDQUFDLENBQUMsQ0FBQyx5QkFBeUIsQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDO1lBQzFDLHlCQUF5QixDQUFDLGFBQWEsQ0FBQzs7WUFFekUsVUFBVTs7WUFBRSxXQUFXO1FBQzNCLElBQUksaUJBQWlCLEVBQUU7WUFDckIsVUFBVSxHQUFHLHNCQUFzQjtnQkFDL0IsQ0FBQyxDQUFDLHlCQUF5QixHQUFHLGFBQWEsQ0FBQyxlQUFvQixDQUFDLENBQUM7WUFDdEUsV0FBVyxHQUFHLHVCQUF1QjtnQkFDakMsQ0FBQyxDQUFDLHlCQUF5QixHQUFHLGFBQWEsQ0FBQyxlQUFvQixDQUFDLENBQUM7U0FDdkU7YUFBTTtZQUNMLFVBQVU7Z0JBQ04scUJBQXFCLEdBQUcsQ0FBQyxDQUFDLHlCQUF5QixHQUFHLGFBQWEsQ0FBQyxlQUFvQixDQUFDLENBQUM7WUFDOUYsV0FBVyxHQUFHLHNCQUFzQjtnQkFDaEMsQ0FBQyxDQUFDLHlCQUF5QixHQUFHLGFBQWEsQ0FBQyxlQUFvQixDQUFDLENBQUM7U0FDdkU7Ozs7O1lBS0cscUJBQXFCLEdBQUcsaUJBQWlCLENBQUMsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsYUFBYTs7WUFDMUUsZUFBZSxHQUFHLDhCQUE4QixDQUFDLHFCQUFxQixFQUFFLFFBQVEsQ0FBQztRQUNyRixJQUFJLGVBQWUsS0FBSyxDQUFDLENBQUMsRUFBRTtZQUMxQixlQUFlLEdBQUcsc0JBQXNCLENBQ2xCLElBQUksRUFBRSxxQkFBcUIsRUFBRSxRQUFRLEVBQUUsaUJBQWlCLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUN2RSxjQUFjLENBQUM7bUNBQ0ksQ0FBQztTQUMzQzthQUFNO1lBQ0wsZUFBZSx1QkFBeUMsQ0FBQztTQUMxRDs7Y0FFSyxXQUFXLEdBQ2Isa0JBQWtCLENBQUMsT0FBTyxFQUFFLFFBQVEsRUFBRSxpQkFBaUIsRUFBRSxjQUFjLElBQUksSUFBSSxDQUFDO1FBRXBGLE9BQU8sQ0FBQyxPQUFPLEVBQUUsV0FBVyxFQUFFLFFBQVEsQ0FBQyxXQUFXLEVBQUUsZUFBZSxFQUFFLFVBQVUsQ0FBQyxDQUFDLENBQUM7UUFDbEYsT0FBTyxDQUFDLE9BQU8sRUFBRSxXQUFXLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFDeEMsUUFBUSxDQUFDLE9BQU8sRUFBRSxXQUFXLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDckMscUJBQXFCLENBQUMsT0FBTyxFQUFFLFdBQVcsRUFBRSxDQUFDLEVBQUUsY0FBYyxDQUFDLENBQUM7UUFFL0QsT0FBTyxDQUFDLE9BQU8sRUFBRSxVQUFVLEVBQUUsUUFBUSxDQUFDLFdBQVcsRUFBRSxlQUFlLEVBQUUsV0FBVyxDQUFDLENBQUMsQ0FBQztRQUNsRixPQUFPLENBQUMsT0FBTyxFQUFFLFVBQVUsRUFBRSxRQUFRLENBQUMsQ0FBQztRQUN2QyxRQUFRLENBQUMsT0FBTyxFQUFFLFVBQVUsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUNwQyxxQkFBcUIsQ0FBQyxPQUFPLEVBQUUsVUFBVSxFQUFFLENBQUMsRUFBRSxjQUFjLENBQUMsQ0FBQztLQUMvRDtJQUVELHFGQUFxRjtJQUNyRixxRkFBcUY7SUFDckYsZ0NBQWdDO0lBQ2hDLHNCQUFzQiw4QkFBa0Q7UUFDcEUseUJBQXlCLEdBQUcseUJBQXlCLENBQUMsTUFBTSxDQUFDO0lBQ2pFLHNCQUFzQiw2QkFBaUQ7UUFDbkUseUJBQXlCLEdBQUcseUJBQXlCLENBQUMsTUFBTSxDQUFDO0lBRWpFLHVFQUF1RTtJQUN2RSxvQkFBb0IsOEJBQWdEO1FBQ2hFLHlCQUF5QixDQUFDLE1BQU0sQ0FBQztJQUNyQyxvQkFBb0IsOEJBQWdEO1FBQ2hFLHlCQUF5QixDQUFDLE1BQU0sQ0FBQzs7VUFDL0IsNEJBQTRCLEdBQUcseUJBQXlCLENBQUMsTUFBTSxlQUFvQjs7VUFDbkYsNkJBQTZCLEdBQUcseUJBQXlCLENBQUMsTUFBTSxlQUFvQjs7O1VBR3BGLDhCQUE4QixHQUNoQyxxQkFBcUIsR0FBRyx5QkFBeUIsZUFBb0I7O1VBQ25FLG1CQUFtQixHQUFHLG9CQUFvQixDQUFDLE1BQU07SUFDdkQscUJBQXFCLENBQ2pCLE9BQU8sRUFBRSxjQUFjLEVBQUUsS0FBSyxFQUFFLDhCQUE4QixFQUM5RCx5QkFBeUIsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUV0QyxLQUFLLElBQUksQ0FBQyw4QkFBZ0QsRUFBRSxDQUFDLEdBQUcsbUJBQW1CLEVBQzlFLENBQUMsZ0JBQWtDLEVBQUU7UUFDeEMsMEZBQTBGO1FBQzFGLCtFQUErRTtRQUMvRSxvQkFBb0IsQ0FBQyxDQUFDLDhCQUFnRCxDQUFDO1lBQ25FLDZCQUE2QixHQUFHLDRCQUE0QixDQUFDO0tBQ2xFOzs7VUFHSywrQkFBK0IsR0FDakMsc0JBQXNCLEdBQUcseUJBQXlCLGVBQW9COztVQUNwRSxtQkFBbUIsR0FBRyxvQkFBb0IsQ0FBQyxNQUFNO0lBQ3ZELHFCQUFxQixDQUNqQixPQUFPLEVBQUUsY0FBYyxFQUFFLElBQUksRUFBRSwrQkFBK0IsRUFDOUQseUJBQXlCLENBQUMsTUFBTSxDQUFDLENBQUM7SUFFdEMsS0FBSyxJQUFJLENBQUMsOEJBQWdELEVBQUUsQ0FBQyxHQUFHLG1CQUFtQixFQUM5RSxDQUFDLGdCQUFrQyxFQUFFO1FBQ3hDLHlGQUF5RjtRQUN6RixvRkFBb0Y7UUFDcEYscUZBQXFGO1FBQ3JGLHNGQUFzRjtRQUN0RiwwRkFBMEY7UUFDMUYsaUJBQWlCO1FBQ2pCLG9CQUFvQixDQUFDLENBQUMsOEJBQWdELENBQUM7WUFDbkUsQ0FBQyw0QkFBNEIsR0FBRyxDQUFDLENBQUMsR0FBRyw2QkFBNkIsQ0FBQztLQUN4RTs7OztVQUlLLFVBQVUsR0FBRyxRQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxxQkFBcUIsQ0FBQztJQUN4RCxPQUFPLENBQUMsT0FBTyw4QkFBbUMsVUFBVSxDQUFDLENBQUM7QUFDaEUsQ0FBQzs7Ozs7Ozs7O0FBS0QsTUFBTSxVQUFVLGdDQUFnQyxDQUM1QyxPQUF1QixFQUFFLGNBQXNCLEVBQUUsY0FBdUIsRUFDeEUsY0FBdUM7O1VBQ25DLGlCQUFpQixHQUFHLE9BQU8sbUNBQXdDOztVQUNuRSxLQUFLLEdBQUcsY0FBYyxlQUFvQzs7VUFDMUQsdUJBQXVCLEdBQUcsS0FBSyxzQ0FBMkQ7SUFFaEcsOEVBQThFO0lBQzlFLElBQUksS0FBSyxHQUFHLGlCQUFpQixDQUFDLE1BQU07UUFDaEMsQ0FBQyxtQkFBQSxpQkFBaUIsQ0FBQyx1QkFBdUIsQ0FBQyxFQUFVLENBQUMsSUFBSSxDQUFDO1FBQzdELE9BQU8sS0FBSyxDQUFDOztVQUVULHFCQUFxQixHQUN2QixjQUFjLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLG1DQUF3QyxDQUFDLE1BQU07SUFDaEYsb0NBQW9DLENBQ2hDLE9BQU8sRUFBRSxjQUFjLEVBQUUscUJBQXFCLEVBQUUsY0FBYyxDQUFDLENBQUM7SUFDcEUsT0FBTyxJQUFJLENBQUM7QUFDZCxDQUFDOzs7Ozs7OztBQUVELFNBQVMsdUJBQXVCLENBQzVCLE9BQXVCLEVBQUUsV0FBbUIsRUFBRSxLQUFhLEVBQUUsR0FBVztJQUMxRSxLQUFLLElBQUksQ0FBQyxHQUFHLEtBQUssRUFBRSxDQUFDLEdBQUcsR0FBRyxFQUFFLENBQUMsZ0JBQXFCLEVBQUU7UUFDbkQsSUFBSSxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxLQUFLLFdBQVc7WUFBRSxPQUFPLENBQUMsQ0FBQztLQUNuRDtJQUNELE9BQU8sQ0FBQyxDQUFDLENBQUM7QUFDWixDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUEwQkQsTUFBTSxVQUFVLGdCQUFnQixDQUM1QixPQUF1QixFQUFFLFlBQ3FDLEVBQzlELFdBQXdGLEVBQ3hGLGlCQUF5QixDQUFDO0lBQzVCLFNBQVMsSUFBSSxTQUFTLENBQUMsVUFBVSxFQUFFLENBQUM7SUFDcEMsU0FBUyxJQUFJLHlCQUF5QixDQUFDLE9BQU8sRUFBRSxjQUFjLENBQUMsQ0FBQztJQUNoRSxZQUFZLEdBQUcsWUFBWSxJQUFJLElBQUksQ0FBQztJQUNwQyxXQUFXLEdBQUcsV0FBVyxJQUFJLElBQUksQ0FBQzs7VUFDNUIscUJBQXFCLEdBQUcsb0JBQW9CLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxjQUFjLEVBQUUsWUFBWSxDQUFDOztVQUN6RixxQkFBcUIsR0FBRyxvQkFBb0IsQ0FBQyxPQUFPLEVBQUUsS0FBSyxFQUFFLGNBQWMsRUFBRSxXQUFXLENBQUM7SUFFL0YsZ0ZBQWdGO0lBQ2hGLElBQUkscUJBQXFCLElBQUkscUJBQXFCO1FBQUUsT0FBTztJQUUzRCxZQUFZO1FBQ1IsWUFBWSxLQUFLLFNBQVMsQ0FBQyxDQUFDLENBQUMsa0JBQWtCLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxjQUFjLENBQUMsQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFDO0lBQ2xHLFdBQVc7UUFDUCxXQUFXLEtBQUssU0FBUyxDQUFDLENBQUMsQ0FBQyxrQkFBa0IsQ0FBQyxPQUFPLEVBQUUsS0FBSyxFQUFFLGNBQWMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUM7O1VBRTNGLE9BQU8sR0FBRyxtQkFBQSxtQkFBQSxPQUFPLHlCQUE4QixFQUFFLEVBQWM7O1VBQy9ELG9CQUFvQixHQUFHLFlBQVksWUFBWSxrQkFBa0IsQ0FBQyxDQUFDO1FBQ3JFLElBQUksMEJBQTBCLENBQUMsbUJBQUEsWUFBWSxFQUFPLEVBQUUsT0FBTyxnQkFBb0IsQ0FBQyxDQUFDO1FBQ2pGLElBQUk7O1VBQ0YsbUJBQW1CLEdBQUcsV0FBVyxZQUFZLGtCQUFrQixDQUFDLENBQUM7UUFDbkUsSUFBSSwwQkFBMEIsQ0FBQyxtQkFBQSxXQUFXLEVBQU8sRUFBRSxPQUFPLGdCQUFvQixDQUFDLENBQUM7UUFDaEYsSUFBSTs7VUFFRixZQUFZLEdBQUcsb0JBQW9CLENBQUMsQ0FBQztRQUN2QyxtQkFBQSxDQUFDLG1CQUFBLFlBQVksRUFBbUQsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDM0UsWUFBWTs7VUFDVixXQUFXLEdBQUcsbUJBQW1CLENBQUMsQ0FBQyxDQUFDLG1CQUFBLFdBQVcsRUFBRSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxXQUFXOztRQUUxRSxVQUFVLEdBQWEsV0FBVzs7UUFDbEMsZUFBZSxHQUFHLEtBQUs7O1FBQ3ZCLHNCQUFzQixHQUFHLEtBQUs7O1VBRTVCLHlCQUF5QixHQUMzQixvQkFBb0IsQ0FBQyxDQUFDLHVDQUEyQyxDQUFDLENBQUMsQ0FBQztJQUN4RSxJQUFJLHVCQUF1QixDQUNuQixPQUFPLEVBQUUsb0JBQW9CLHdDQUE0QyxFQUFFO1FBQ2pGLGdCQUFnQixDQUFDLE9BQU8sRUFBRSxvQkFBb0Isd0NBQTRDLENBQUM7UUFDM0Ysc0JBQXNCLEdBQUcsSUFBSSxDQUFDO0tBQy9COztVQUVLLHdCQUF3QixHQUMxQixtQkFBbUIsQ0FBQyxDQUFDLHVDQUEyQyxDQUFDLENBQUMsQ0FBQztJQUN2RSxJQUFJLHVCQUF1QixDQUNuQixPQUFPLEVBQUUsbUJBQW1CLHdDQUE0QyxFQUFFO1FBQ2hGLGdCQUFnQixDQUFDLE9BQU8sRUFBRSxtQkFBbUIsd0NBQTRDLENBQUM7UUFDMUYsc0JBQXNCLEdBQUcsSUFBSSxDQUFDO0tBQy9CO0lBRUQsMEVBQTBFO0lBQzFFLDJCQUEyQjtJQUMzQixJQUFJLENBQUMscUJBQXFCLEVBQUU7UUFDMUIsSUFBSSxPQUFPLFlBQVksSUFBSSxRQUFRLEVBQUU7WUFDbkMsVUFBVSxHQUFHLFlBQVksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDdkMsa0ZBQWtGO1lBQ2xGLG9FQUFvRTtZQUNwRSxlQUFlLEdBQUcsSUFBSSxDQUFDO1NBQ3hCO2FBQU07WUFDTCxVQUFVLEdBQUcsWUFBWSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUM7U0FDckU7S0FDRjs7VUFFSyxxQkFBcUIsR0FBRyx3QkFBd0IsQ0FBQyxPQUFPLENBQUM7O1FBQzNELHNCQUFzQixHQUFHLHlCQUF5QixDQUFDLE9BQU8sQ0FBQzs7UUFDM0Qsb0JBQW9CLEdBQUcsT0FBTyxDQUFDLE1BQU07SUFFekMsSUFBSSxDQUFDLHFCQUFxQixFQUFFOztjQUNwQixVQUFVLEdBQUcsV0FBVyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxXQUFXOztjQUNqRSxNQUFNLEdBQUcsV0FBVyxJQUFJLFNBQVM7O2NBQ2pDLGVBQWUsR0FBRywwQkFBMEIsQ0FDOUMsT0FBTyxFQUFFLGNBQWMsRUFBRSx3QkFBd0IsRUFBRSxxQkFBcUIsRUFDeEUsc0JBQXNCLEVBQUUsVUFBVSxFQUFFLE1BQU0sRUFBRSxXQUFXLEVBQUUsS0FBSyxDQUFDO1FBQ25FLElBQUksZUFBZSxFQUFFO1lBQ25CLHNCQUFzQixJQUFJLGVBQWUsZUFBb0IsQ0FBQztZQUM5RCxvQkFBb0IsSUFBSSxlQUFlLGVBQW9CLENBQUM7U0FDN0Q7S0FDRjtJQUVELElBQUksQ0FBQyxxQkFBcUIsRUFBRTs7Y0FDcEIsT0FBTyxHQUFHLG1CQUFBLENBQUMsWUFBWSxJQUFJLFNBQVMsQ0FBQyxFQUF1QjtRQUNsRSwwQkFBMEIsQ0FDdEIsT0FBTyxFQUFFLGNBQWMsRUFBRSx5QkFBeUIsRUFBRSxzQkFBc0IsRUFDMUUsb0JBQW9CLEVBQUUsVUFBVSxFQUFFLGVBQWUsSUFBSSxPQUFPLEVBQUUsWUFBWSxFQUFFLElBQUksQ0FBQyxDQUFDO0tBQ3ZGO0lBRUQsSUFBSSxzQkFBc0IsRUFBRTtRQUMxQixzQkFBc0IsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUM7S0FDdkM7SUFFRCxTQUFTLElBQUksU0FBUyxDQUFDLG1CQUFtQixFQUFFLENBQUM7QUFDL0MsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQTRDRCxTQUFTLDBCQUEwQixDQUMvQixPQUF1QixFQUFFLGNBQXNCLEVBQUUsa0JBQTBCLEVBQUUsUUFBZ0IsRUFDN0YsTUFBYyxFQUFFLEtBQXdCLEVBQUUsTUFBbUMsRUFBRSxVQUFlLEVBQzlGLGlCQUEwQjs7UUFDeEIsS0FBSyxHQUFHLEtBQUs7O1VBRVgsVUFBVSxHQUFHO1FBQ2YsY0FBYyxlQUFpQzs7OztVQUk3QyxZQUFZLEdBQ2QsT0FBTyxDQUFDLGlCQUFpQixDQUFDLENBQUMsNEJBQWlDLENBQUMsMEJBQStCLENBQUM7Ozs7VUFJM0YseUJBQXlCLEdBQzNCLFlBQVksQ0FBQyxVQUFVLDhCQUFnRCxDQUFDOztVQUV0RSxtQkFBbUIsR0FBRyxZQUFZLENBQUMsVUFBVSxzQkFBd0MsQ0FBQzs7VUFDdEYsd0JBQXdCLEdBQzFCLFlBQVksQ0FBQyxVQUFVLDJCQUE2QyxDQUFDOztVQUNuRSwwQkFBMEIsR0FDNUIsWUFBWSxDQUFDLFVBQVUsMEJBQTRDLENBQUMsS0FBSyxDQUFDOzs7Ozs7Ozs7OztRQVcxRSxzQkFBc0IsR0FDdEIsMEJBQTBCLElBQUksQ0FBQyxDQUFDLENBQUMsbUJBQW1CLElBQUksVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDOztRQUVuRixpQkFBaUIsR0FBRyxDQUFDOztRQUNyQixzQkFBc0IsR0FBRyxDQUFDOzs7OztVQUt4QixhQUFhLEdBQUcsTUFBTSxLQUFLLElBQUk7Ozs7O1FBS2pDLFFBQVEsR0FBRyxRQUFROztRQUNuQix3QkFBd0IsR0FBRyxLQUFLLENBQUMsTUFBTTtJQUMzQyxPQUFPLFFBQVEsR0FBRyx5QkFBeUIsRUFBRTs7Y0FDckMsV0FBVyxHQUFHLE9BQU8sQ0FBQyxPQUFPLEVBQUUsUUFBUSxDQUFDO1FBQzlDLElBQUksd0JBQXdCLEVBQUU7WUFDNUIsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7O3NCQUMvQixPQUFPLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQzs7c0JBQ2xCLGNBQWMsR0FBRyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUk7Z0JBQzFGLElBQUksY0FBYyxJQUFJLFdBQVcsS0FBSyxjQUFjLEVBQUU7OzBCQUM5QyxZQUFZLEdBQUcsUUFBUSxDQUFDLE9BQU8sRUFBRSxRQUFRLENBQUM7OzBCQUMxQyxxQkFBcUIsR0FBRywwQkFBMEIsQ0FBQyxPQUFPLEVBQUUsUUFBUSxDQUFDOzswQkFDckUsS0FBSyxHQUFHLGFBQWEsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLG1CQUFBLE1BQU0sRUFBdUIsQ0FBQyxDQUFDLGNBQWMsQ0FBQzs7MEJBQzlFLFdBQVcsR0FBRyxXQUFXLENBQUMsT0FBTyxFQUFFLFFBQVEsQ0FBQztvQkFDbEQsSUFBSSxlQUFlLENBQUMsV0FBVyxFQUFFLFlBQVksRUFBRSxLQUFLLENBQUM7d0JBQ2pELGdCQUFnQixDQUFDLFlBQVksRUFBRSxLQUFLLEVBQUUscUJBQXFCLEVBQUUsY0FBYyxDQUFDLEVBQUU7d0JBQ2hGLFFBQVEsQ0FBQyxPQUFPLEVBQUUsUUFBUSxFQUFFLEtBQUssQ0FBQyxDQUFDO3dCQUNuQyxxQkFBcUIsQ0FBQyxPQUFPLEVBQUUsUUFBUSxFQUFFLGtCQUFrQixFQUFFLGNBQWMsQ0FBQyxDQUFDO3dCQUM3RSxJQUFJLHNCQUFzQixDQUFDLE9BQU8sRUFBRSxXQUFXLEVBQUUsS0FBSyxDQUFDLEVBQUU7NEJBQ3ZELFFBQVEsQ0FBQyxPQUFPLEVBQUUsUUFBUSxFQUFFLElBQUksQ0FBQyxDQUFDOzRCQUNsQyxLQUFLLEdBQUcsSUFBSSxDQUFDO3lCQUNkO3FCQUNGO29CQUNELEtBQUssQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUM7b0JBQ2hCLHdCQUF3QixFQUFFLENBQUM7b0JBQzNCLE1BQU07aUJBQ1A7YUFDRjtTQUNGO1FBQ0QsUUFBUSxnQkFBcUIsQ0FBQztLQUMvQjtJQUVELFVBQVU7SUFDVixzRUFBc0U7SUFDdEUsSUFBSSx3QkFBd0IsRUFBRTs7Y0FDdEIsU0FBUyxHQUFHLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLGlCQUFpQixDQUFDLE9BQU8sRUFBRSxjQUFjLENBQUM7UUFDdkYsY0FBYyxFQUFFLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFOztrQkFDL0MsT0FBTyxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUM7WUFFeEIsSUFBSSxDQUFDLE9BQU8sRUFBRTtnQkFDWiw2RUFBNkU7Z0JBQzdFLHdFQUF3RTtnQkFDeEUsU0FBUzthQUNWOztrQkFFSyxLQUFLLEdBQUcsYUFBYSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsbUJBQUEsTUFBTSxFQUF1QixDQUFDLENBQUMsT0FBTyxDQUFDOztrQkFDdkUsY0FBYyxHQUFHLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUM7O2tCQUNqRSxxQkFBcUIsR0FBRyxRQUFRLElBQUkseUJBQXlCO1lBRW5FLEtBQUssSUFBSSxDQUFDLEdBQUcsUUFBUSxFQUFFLENBQUMsR0FBRyxNQUFNLEVBQUUsQ0FBQyxnQkFBcUIsRUFBRTs7c0JBQ25ELGNBQWMsR0FBRyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQztnQkFDMUMsSUFBSSxjQUFjLEtBQUssY0FBYyxFQUFFOzswQkFDL0Isd0JBQXdCLEdBQUcsMEJBQTBCLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQzs7MEJBQ2pFLDRCQUE0QixHQUFHLHFCQUFxQixDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUM7OzBCQUNoRSxlQUFlLEdBQUcsUUFBUSxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUM7OzBCQUN0QyxjQUFjLEdBQUcsV0FBVyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUM7b0JBRTlDLElBQUksZ0JBQWdCLENBQUMsZUFBZSxFQUFFLEtBQUssRUFBRSx3QkFBd0IsRUFBRSxjQUFjLENBQUMsRUFBRTt3QkFDdEYsb0VBQW9FO3dCQUNwRSxvRUFBb0U7d0JBQ3BFLGlDQUFpQzt3QkFDakMsSUFBSSxxQkFBcUIsRUFBRTs0QkFDekIsdUJBQXVCLENBQUMsT0FBTyxFQUFFLFFBQVEsRUFBRSxDQUFDLENBQUMsQ0FBQzs0QkFDOUMsaUJBQWlCLEVBQUUsQ0FBQzt5QkFDckI7d0JBRUQsSUFBSSxlQUFlLENBQUMsY0FBYyxFQUFFLGVBQWUsRUFBRSxLQUFLLENBQUMsRUFBRTs0QkFDM0QsSUFBSSxLQUFLLEtBQUssSUFBSSxJQUFJLEtBQUssS0FBSyxTQUFTLElBQUksS0FBSyxLQUFLLGVBQWUsRUFBRTtnQ0FDdEUsc0JBQXNCLEdBQUcsSUFBSSxDQUFDOzZCQUMvQjs0QkFFRCxRQUFRLENBQUMsT0FBTyxFQUFFLFFBQVEsRUFBRSxLQUFLLENBQUMsQ0FBQzs0QkFFbkMsd0JBQXdCOzRCQUN4QixzRUFBc0U7NEJBQ3RFLHVFQUF1RTs0QkFDdkUsMkVBQTJFOzRCQUMzRSxzRUFBc0U7NEJBQ3RFLG9EQUFvRDs0QkFDcEQsSUFBSSxlQUFlLEtBQUssSUFBSTtnQ0FDeEIsc0JBQXNCLENBQUMsT0FBTyxFQUFFLGNBQWMsRUFBRSxLQUFLLENBQUMsRUFBRTtnQ0FDMUQsUUFBUSxDQUFDLE9BQU8sRUFBRSxRQUFRLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0NBQ2xDLEtBQUssR0FBRyxJQUFJLENBQUM7NkJBQ2Q7eUJBQ0Y7d0JBRUQsSUFBSSx3QkFBd0IsS0FBSyxjQUFjOzRCQUMzQyxrQkFBa0IsS0FBSyw0QkFBNEIsRUFBRTs0QkFDdkQscUJBQXFCLENBQUMsT0FBTyxFQUFFLFFBQVEsRUFBRSxrQkFBa0IsRUFBRSxjQUFjLENBQUMsQ0FBQzt5QkFDOUU7cUJBQ0Y7b0JBRUQsUUFBUSxnQkFBcUIsQ0FBQztvQkFDOUIsU0FBUyxjQUFjLENBQUM7aUJBQ3pCO2FBQ0Y7WUFFRCwwREFBMEQ7WUFDMUQsSUFBSSxLQUFLLElBQUksSUFBSSxFQUFFO2dCQUNqQixzQkFBc0IsR0FBRyxJQUFJLENBQUM7Z0JBQzlCLGlCQUFpQixFQUFFLENBQUM7O3NCQUNkLElBQUksR0FBRyxrQkFBa0IsQ0FBQyxPQUFPLEVBQUUsY0FBYyxFQUFFLGlCQUFpQixFQUFFLFNBQVMsQ0FBQztpQ0FDaEU7O3NCQUVoQixjQUFjLEdBQUcscUJBQXFCLENBQUMsQ0FBQztvQkFDMUMsUUFBUSxDQUFDLENBQUM7b0JBQ1YsQ0FBQyx5QkFBeUIsR0FBRyxzQkFBc0IsZUFBb0IsQ0FBQztnQkFDNUUsc0JBQXNCLENBQ2xCLE9BQU8sRUFBRSxjQUFjLEVBQUUsaUJBQWlCLEVBQUUsY0FBYyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsY0FBYyxFQUN2RixrQkFBa0IsQ0FBQyxDQUFDO2dCQUV4QixzQkFBc0IsRUFBRSxDQUFDO2dCQUN6QixNQUFNLGdCQUFxQixDQUFDO2dCQUM1QixRQUFRLGdCQUFxQixDQUFDO2dCQUU5QixLQUFLLEdBQUcsSUFBSSxDQUFDO2FBQ2Q7U0FDRjtLQUNGO0lBRUQsVUFBVTtJQUNWLGtGQUFrRjtJQUNsRiwwRUFBMEU7SUFDMUUsT0FBTyxRQUFRLEdBQUcsTUFBTSxFQUFFO1FBQ3hCLHNCQUFzQixHQUFHLElBQUksQ0FBQyxDQUFFLDBCQUEwQjs7O2NBQ3BELFFBQVEsR0FBRyxRQUFRLENBQUMsT0FBTyxFQUFFLFFBQVEsQ0FBQzs7Y0FDdEMsT0FBTyxHQUFHLFdBQVcsQ0FBQyxPQUFPLEVBQUUsUUFBUSxDQUFDOztjQUN4QyxZQUFZLEdBQUcsMEJBQTBCLENBQUMsT0FBTyxFQUFFLFFBQVEsQ0FBQztRQUNsRSxJQUFJLFFBQVEsSUFBSSxJQUFJLEVBQUU7WUFDcEIsc0JBQXNCLEdBQUcsSUFBSSxDQUFDO1NBQy9CO1FBQ0QsSUFBSSxlQUFlLENBQUMsT0FBTyxFQUFFLFFBQVEsRUFBRSxJQUFJLENBQUMsRUFBRTtZQUM1QyxRQUFRLENBQUMsT0FBTyxFQUFFLFFBQVEsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUNsQywwQ0FBMEM7WUFDMUMsSUFBSSxzQkFBc0IsQ0FBQyxPQUFPLEVBQUUsT0FBTyxFQUFFLFFBQVEsQ0FBQyxFQUFFO2dCQUN0RCxRQUFRLENBQUMsT0FBTyxFQUFFLFFBQVEsRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFDbEMsS0FBSyxHQUFHLElBQUksQ0FBQzthQUNkO1lBQ0QscUJBQXFCLENBQUMsT0FBTyxFQUFFLFFBQVEsRUFBRSxrQkFBa0IsRUFBRSxjQUFjLENBQUMsQ0FBQztTQUM5RTtRQUNELFFBQVEsZ0JBQXFCLENBQUM7S0FDL0I7SUFFRCw4RkFBOEY7SUFDOUYsaUdBQWlHO0lBQ2pHLGtHQUFrRztJQUNsRyw2RkFBNkY7SUFDN0YsaUdBQWlHO0lBQ2pHLDRDQUE0QztJQUM1QyxzQkFBc0IsR0FBRyxzQkFBc0IsSUFBSSx3QkFBd0IsS0FBSyxpQkFBaUIsQ0FBQztJQUNsRyxvQkFBb0IsQ0FDaEIsT0FBTyxFQUFFLGNBQWMsRUFBRSxpQkFBaUIsRUFBRSxVQUFVLEVBQUUseUJBQXlCLEVBQUUsTUFBTSxFQUN6RixpQkFBaUIsRUFBRSxzQkFBc0IsQ0FBQyxDQUFDO0lBRS9DLElBQUksS0FBSyxFQUFFO1FBQ1QsZUFBZSxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQztLQUNoQztJQUVELE9BQU8sc0JBQXNCLENBQUM7QUFDaEMsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7QUFhRCxNQUFNLFVBQVUsZUFBZSxDQUMzQixPQUF1QixFQUFFLE1BQWMsRUFDdkMsS0FBdUQsRUFBRSxpQkFBeUIsQ0FBQyxFQUNuRixhQUF1QjtJQUN6Qix3QkFBd0IsQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsY0FBYyxFQUFFLGFBQWEsQ0FBQyxDQUFDO0FBQ3hGLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFrQkQsTUFBTSxVQUFVLGVBQWUsQ0FDM0IsT0FBdUIsRUFBRSxNQUFjLEVBQ3ZDLEtBQXdFLEVBQ3hFLGlCQUF5QixDQUFDLEVBQUUsYUFBdUI7SUFDckQsd0JBQXdCLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLGNBQWMsRUFBRSxhQUFhLENBQUMsQ0FBQztBQUN6RixDQUFDOzs7Ozs7Ozs7O0FBRUQsU0FBUyx3QkFBd0IsQ0FDN0IsT0FBdUIsRUFBRSxNQUFjLEVBQ3ZDLEtBQXdFLEVBQUUsWUFBcUIsRUFDL0YsY0FBc0IsRUFBRSxhQUF1QjtJQUNqRCxTQUFTLElBQUkseUJBQXlCLENBQUMsT0FBTyxFQUFFLGNBQWMsQ0FBQyxDQUFDOztVQUMxRCxXQUFXLEdBQUcsdUJBQXVCLENBQUMsT0FBTyxFQUFFLGNBQWMsRUFBRSxNQUFNLEVBQUUsWUFBWSxDQUFDOztVQUNwRixTQUFTLEdBQUcsUUFBUSxDQUFDLE9BQU8sRUFBRSxXQUFXLENBQUM7O1VBQzFDLFFBQVEsR0FBRyxXQUFXLENBQUMsT0FBTyxFQUFFLFdBQVcsQ0FBQzs7VUFDNUMsYUFBYSxHQUFHLDBCQUEwQixDQUFDLE9BQU8sRUFBRSxXQUFXLENBQUM7O1VBQ2hFLEtBQUssR0FBd0IsQ0FBQyxLQUFLLFlBQVksa0JBQWtCLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSztJQUU5RixTQUFTLElBQUksU0FBUyxDQUFDLFdBQVcsRUFBRSxDQUFDO0lBRXJDLElBQUksZUFBZSxDQUFDLFFBQVEsRUFBRSxTQUFTLEVBQUUsS0FBSyxDQUFDO1FBQzNDLENBQUMsYUFBYSxJQUFJLGdCQUFnQixDQUFDLFNBQVMsRUFBRSxLQUFLLEVBQUUsYUFBYSxFQUFFLGNBQWMsQ0FBQyxDQUFDLEVBQUU7O2NBQ2xGLFlBQVksR0FBRyxDQUFDLFFBQVEsZ0JBQXFCLENBQUMsa0JBQXVCOztjQUNyRSxPQUFPLEdBQUcsbUJBQUEsbUJBQUEsT0FBTyx5QkFBOEIsRUFBRSxFQUFjOztjQUMvRCxhQUFhLEdBQUcsS0FBSyxZQUFZLGtCQUFrQixDQUFDLENBQUM7WUFDdkQsSUFBSSwwQkFBMEIsQ0FDMUIsbUJBQUEsS0FBSyxFQUFPLEVBQUUsT0FBTyxFQUFFLFlBQVksQ0FBQyxDQUFDLGVBQW1CLENBQUMsY0FBa0IsQ0FBQyxDQUFDLENBQUM7WUFDbEYsSUFBSTs7Y0FDRixLQUFLLEdBQUcsbUJBQUEsQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUMsbUJBQUEsS0FBSyxFQUEyQixDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsRUFDOUQ7O2NBQ1osZUFBZSxHQUFHLHFCQUFxQixDQUFDLE9BQU8sRUFBRSxXQUFXLENBQUM7O1lBRS9ELHNCQUFzQixHQUFHLEtBQUs7O1lBQzlCLGtCQUFrQixHQUFHLGFBQWEsQ0FBQyxDQUFDLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzVELElBQUksdUJBQXVCLENBQUMsT0FBTyxFQUFFLGFBQWEsRUFBRSxlQUFlLENBQUMsRUFBRTs7a0JBQzlELFFBQVEsR0FBRyxnQkFBZ0IsQ0FBQyxPQUFPLEVBQUUsYUFBYSxFQUFFLGVBQWUsQ0FBQztZQUMxRSxrQkFBa0IsR0FBRyxhQUFhLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2xELHNCQUFzQixHQUFHLElBQUksQ0FBQztTQUMvQjtRQUVELElBQUksc0JBQXNCLElBQUksYUFBYSxLQUFLLGNBQWMsRUFBRTtZQUM5RCxxQkFBcUIsQ0FBQyxPQUFPLEVBQUUsV0FBVyxFQUFFLGtCQUFrQixFQUFFLGNBQWMsQ0FBQyxDQUFDO1NBQ2pGO1FBRUQsSUFBSSxhQUFhLEtBQUssY0FBYyxFQUFFOztrQkFDOUIsSUFBSSxHQUFHLE9BQU8sQ0FBQyxPQUFPLEVBQUUsV0FBVyxDQUFDOztrQkFDcEMsU0FBUyxHQUFHLGlCQUFpQixDQUFDLE9BQU8sRUFBRSxjQUFjLENBQUM7WUFDNUQsZUFBZSxDQUFDLE9BQU8sRUFBRSxXQUFXLEVBQUUsQ0FBQyxTQUFTLElBQUksU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUM7U0FDdEY7UUFFRCx3RUFBd0U7UUFDeEUsUUFBUSxDQUFDLE9BQU8sRUFBRSxXQUFXLEVBQUUsS0FBSyxDQUFDLENBQUM7O2NBQ2hDLGFBQWEsR0FBRyxxQkFBcUIsQ0FBQyxRQUFRLENBQUM7OztjQUcvQyxhQUFhLEdBQUcsUUFBUSxDQUFDLE9BQU8sRUFBRSxhQUFhLENBQUM7UUFDdEQsSUFBSSxDQUFDLGFBQWEsSUFBSSxlQUFlLENBQUMsUUFBUSxFQUFFLGFBQWEsRUFBRSxLQUFLLENBQUMsRUFBRTs7Z0JBQ2pFLFVBQVUsR0FBRyxLQUFLOztnQkFDbEIsV0FBVyxHQUFHLElBQUk7WUFFdEIsMEVBQTBFO1lBQzFFLElBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxFQUFFLFlBQVksQ0FBQyxJQUFJLFdBQVcsQ0FBQyxhQUFhLEVBQUUsWUFBWSxDQUFDLEVBQUU7Z0JBQ2pGLFVBQVUsR0FBRyxJQUFJLENBQUM7Z0JBQ2xCLFdBQVcsR0FBRyxLQUFLLENBQUM7YUFDckI7WUFFRCxRQUFRLENBQUMsT0FBTyxFQUFFLGFBQWEsRUFBRSxVQUFVLENBQUMsQ0FBQztZQUM3QyxRQUFRLENBQUMsT0FBTyxFQUFFLFdBQVcsRUFBRSxXQUFXLENBQUMsQ0FBQztZQUM1QyxlQUFlLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDO1NBQ2hDO1FBRUQsSUFBSSxzQkFBc0IsRUFBRTtZQUMxQixzQkFBc0IsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUM7U0FDdkM7UUFFRCxTQUFTLElBQUksU0FBUyxDQUFDLG9CQUFvQixFQUFFLENBQUM7S0FDL0M7QUFDSCxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBc0JELE1BQU0sVUFBVSxhQUFhLENBQ3pCLE9BQXVCLEVBQUUsUUFBMEIsRUFBRSxVQUErQixFQUNwRixhQUFzQixFQUFFLFlBQWtDLEVBQUUsV0FBaUMsRUFDN0YsaUJBQXlCLENBQUM7O1FBQ3hCLGtCQUFrQixHQUFHLENBQUM7SUFDMUIsU0FBUyxJQUFJLFNBQVMsQ0FBQyxZQUFZLEVBQUUsQ0FBQztJQUV0QyxrRUFBa0U7SUFDbEUsc0JBQXNCO0lBQ3RCLElBQUksK0JBQStCLENBQUMsT0FBTyxFQUFFLGNBQWMsQ0FBQyxFQUFFO1FBQzVELHFFQUFxRTtRQUNyRSxzRUFBc0U7UUFDdEUsc0VBQXNFO1FBQ3RFLGlFQUFpRTtRQUNqRSxpRUFBaUU7UUFDakUsK0RBQStEO1FBQy9ELHNEQUFzRDtRQUN0RCwwQkFBMEIsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUVwQyxJQUFJLGNBQWMsQ0FBQyxPQUFPLENBQUMsRUFBRTtZQUMzQixTQUFTLElBQUksU0FBUyxDQUFDLHFCQUFxQixFQUFFLENBQUM7Ozs7O2tCQUt6QyxNQUFNLEdBQUcsbUJBQUEsbUJBQUEsT0FBTyx5QkFBOEIsRUFBRSxFQUFjOztrQkFFOUQsbUJBQW1CLEdBQ3JCLE9BQU8sNEJBQWlDLDhCQUFtQzs7a0JBQ3pFLGVBQWUsR0FBRyx3QkFBd0IsQ0FBQyxPQUFPLENBQUM7WUFFekQsS0FBSyxJQUFJLENBQUMscUNBQXlDLEVBQUUsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxNQUFNLEVBQ2xFLENBQUMsZ0JBQXFCLEVBQUU7Z0JBQzNCLHdFQUF3RTtnQkFDeEUsSUFBSSxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxFQUFFOzswQkFDakIsSUFBSSxHQUFHLFdBQVcsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDOzswQkFDOUIsY0FBYyxHQUFHLDBCQUEwQixDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUM7OzBCQUN2RCxJQUFJLEdBQUcsT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUM7OzBCQUMxQixLQUFLLEdBQUcsUUFBUSxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUM7OzBCQUM1QixjQUFjLEdBQ2hCLENBQUMsSUFBSSxtQkFBd0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxpQkFBaUIsQ0FBQyxPQUFPLEVBQUUsY0FBYyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUk7OzBCQUNoRixhQUFhLEdBQUcsZ0JBQWdCLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQzs7MEJBQzVDLFlBQVksR0FBRyxJQUFJLGdCQUFxQixDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEtBQUs7OzBCQUN2RCxnQkFBZ0IsR0FBRyxDQUFDLEdBQUcsZUFBZTs7d0JBRXhDLFlBQVksR0FBd0IsS0FBSztvQkFFN0MsdUVBQXVFO29CQUN2RSw0REFBNEQ7b0JBQzVELDJEQUEyRDtvQkFDM0QsSUFBSSxnQkFBZ0IsSUFBSSxDQUFDLFdBQVcsQ0FBQyxZQUFZLEVBQUUsWUFBWSxDQUFDLEVBQUU7Ozs4QkFFMUQsVUFBVSxHQUFHLHFCQUFxQixDQUFDLElBQUksQ0FBQzt3QkFDOUMsWUFBWSxHQUFHLFFBQVEsQ0FBQyxPQUFPLEVBQUUsVUFBVSxDQUFDLENBQUM7cUJBQzlDO29CQUVELHlFQUF5RTtvQkFDekUscURBQXFEO29CQUNyRCxnRUFBZ0U7b0JBQ2hFLHNFQUFzRTtvQkFDdEUsd0VBQXdFO29CQUN4RSw2RUFBNkU7b0JBQzdFLCtFQUErRTtvQkFDL0UsK0VBQStFO29CQUMvRSxJQUFJLENBQUMsV0FBVyxDQUFDLFlBQVksRUFBRSxZQUFZLENBQUMsRUFBRTt3QkFDNUMsWUFBWSxHQUFHLGVBQWUsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUM7cUJBQy9DOzs7Ozs7MEJBTUssWUFBWSxHQUFHLFFBQVEsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7b0JBQ3RFLElBQUksWUFBWSxFQUFFO3dCQUNoQixJQUFJLFlBQVksRUFBRTs0QkFDaEIsUUFBUSxDQUNKLE1BQU0sRUFBRSxJQUFJLEVBQUUsWUFBWSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEtBQUssRUFBRSxtQkFBQSxRQUFRLEVBQUUsRUFBRSxZQUFZLEVBQ25FLGFBQWEsQ0FBQyxDQUFDO3lCQUNwQjs2QkFBTTs0QkFDTCxRQUFRLENBQ0osTUFBTSxFQUFFLElBQUksRUFBRSxtQkFBQSxZQUFZLEVBQWlCLEVBQUUsbUJBQUEsUUFBUSxFQUFFLEVBQUUsY0FBYyxFQUN2RSxXQUFXLEVBQUUsYUFBYSxDQUFDLENBQUM7eUJBQ2pDO3FCQUNGO29CQUVELFFBQVEsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO2lCQUM3QjthQUNGO1lBRUQsSUFBSSxtQkFBbUIsRUFBRTs7c0JBQ2pCLFdBQVcsR0FDYixLQUFLLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxjQUFjLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLG1CQUFBLFVBQVUsRUFBZTs7c0JBQ2hGLGFBQWEsR0FBRyxtQkFBQSxnQkFBZ0IsQ0FBQyxPQUFPLENBQUMsRUFBRTs7c0JBQzNDLGlCQUFpQixHQUFHLGFBQWEsZ0NBQW9DO2dCQUMzRSxLQUFLLElBQUksQ0FBQyxzQ0FBMEMsRUFBRSxDQUFDLEdBQUcsaUJBQWlCLEVBQ3RFLENBQUMsNENBQWdELEVBQUU7OzBCQUNoRCxPQUFPLEdBQUcsbUJBQUEsYUFBYSxDQUFDLENBQUMsQ0FBQyxFQUF5Qzs7MEJBQ25FLG9CQUFvQixHQUFHLENBQUMsK0JBQW1DOzswQkFDM0QsU0FBUyxHQUFHLG1CQUFBLGFBQWEsQ0FBQyxvQkFBb0IsQ0FBQyxFQUFpQjtvQkFDdEUsSUFBSSxPQUFPLEVBQUU7OzhCQUNMLE1BQU0sR0FBRyxPQUFPLENBQUMsV0FBVyxDQUFDLFNBQVMsRUFBRSxhQUFhLENBQUM7d0JBQzVELElBQUksTUFBTSxLQUFLLFNBQVMsRUFBRTs0QkFDeEIsSUFBSSxNQUFNLElBQUksSUFBSSxFQUFFOztzQ0FDWixTQUFTLEdBQUcsaUJBQWlCLENBQy9CLGFBQWEsRUFBRSxXQUFXLEVBQUUsbUJBQUEsTUFBTSxFQUFlLEVBQUUsTUFBTSxFQUN6RCxvQkFBb0IsQ0FBQztnQ0FDekIsU0FBUyxJQUFJLGtCQUFrQixFQUFFLENBQUM7NkJBQ25DOzRCQUNELElBQUksU0FBUyxFQUFFO2dDQUNiLFNBQVMsQ0FBQyxPQUFPLEVBQUUsQ0FBQzs2QkFDckI7eUJBQ0Y7cUJBQ0Y7eUJBQU0sSUFBSSxTQUFTLEVBQUU7d0JBQ3BCLG9GQUFvRjt3QkFDcEYsU0FBUzt3QkFDVCxTQUFTLENBQUMsT0FBTyxFQUFFLENBQUM7cUJBQ3JCO2lCQUNGO2dCQUNELHNCQUFzQixDQUFDLE9BQU8sRUFBRSxLQUFLLENBQUMsQ0FBQzthQUN4QztZQUVELGVBQWUsQ0FBQyxPQUFPLEVBQUUsS0FBSyxDQUFDLENBQUM7U0FDakM7S0FDRjtJQUVELE9BQU8sa0JBQWtCLENBQUM7QUFDNUIsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBZ0JELE1BQU0sVUFBVSxRQUFRLENBQ3BCLE1BQVcsRUFBRSxJQUFZLEVBQUUsS0FBb0IsRUFBRSxRQUFtQixFQUNwRSxTQUFpQyxFQUFFLEtBQTJCLEVBQzlELGFBQXFEO0lBQ3ZELEtBQUssR0FBRyxTQUFTLElBQUksS0FBSyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUM7SUFDNUQsSUFBSSxLQUFLLElBQUksYUFBYSxFQUFFO1FBQzFCLElBQUksS0FBSyxFQUFFO1lBQ1QsS0FBSyxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7U0FDN0I7UUFDRCxJQUFJLGFBQWEsRUFBRTtZQUNqQixhQUFhLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQztTQUNyQztLQUNGO1NBQU0sSUFBSSxLQUFLLEVBQUU7UUFDaEIsS0FBSyxHQUFHLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFFLG9FQUFvRTtRQUMvRixvQkFBb0I7UUFDcEIsU0FBUyxJQUFJLFNBQVMsQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO1FBQzFDLG9CQUFvQixDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7WUFDNUIsUUFBUSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxtQkFBbUIsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO1lBQ3RFLE1BQU0sQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQztLQUMzQztTQUFNO1FBQ0wsU0FBUyxJQUFJLFNBQVMsQ0FBQyxtQkFBbUIsRUFBRSxDQUFDO1FBQzdDLG9CQUFvQixDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7WUFDNUIsUUFBUSxDQUFDLFdBQVcsQ0FBQyxNQUFNLEVBQUUsSUFBSSxFQUFFLG1CQUFtQixDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7WUFDbEUsTUFBTSxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLENBQUM7S0FDdkM7QUFDSCxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7OztBQWdCRCxTQUFTLFFBQVEsQ0FDYixNQUFXLEVBQUUsU0FBaUIsRUFBRSxHQUFZLEVBQUUsUUFBbUIsRUFBRSxLQUEyQixFQUM5RixhQUFxRDtJQUN2RCxJQUFJLEtBQUssSUFBSSxhQUFhLEVBQUU7UUFDMUIsSUFBSSxLQUFLLEVBQUU7WUFDVCxLQUFLLENBQUMsUUFBUSxDQUFDLFNBQVMsRUFBRSxHQUFHLENBQUMsQ0FBQztTQUNoQztRQUNELElBQUksYUFBYSxFQUFFO1lBQ2pCLGFBQWEsQ0FBQyxRQUFRLENBQUMsU0FBUyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1NBQ3hDO1FBQ0Qsc0VBQXNFO0tBQ3ZFO1NBQU0sSUFBSSxTQUFTLEtBQUssRUFBRSxFQUFFO1FBQzNCLElBQUksR0FBRyxFQUFFO1lBQ1AsU0FBUyxJQUFJLFNBQVMsQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO1lBQzFDLG9CQUFvQixDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRSxTQUFTLENBQUMsQ0FBQyxDQUFDO2dCQUN0QyxNQUFNLENBQUMsV0FBVyxDQUFDLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1NBQ3JFO2FBQU07WUFDTCxTQUFTLElBQUksU0FBUyxDQUFDLG1CQUFtQixFQUFFLENBQUM7WUFDN0Msb0JBQW9CLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsTUFBTSxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3pDLE1BQU0sQ0FBQyxXQUFXLENBQUMsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUM7U0FDeEU7S0FDRjtBQUNILENBQUM7Ozs7Ozs7QUFFRCxTQUFTLGVBQWUsQ0FBQyxPQUF1QixFQUFFLEtBQWEsRUFBRSxXQUFvQjtJQUNuRixJQUFJLFdBQVcsRUFBRTtRQUNmLENBQUMsbUJBQUEsT0FBTyxDQUFDLEtBQUssQ0FBQyxFQUFVLENBQUMsb0JBQXlCLENBQUM7S0FDckQ7U0FBTTtRQUNMLENBQUMsbUJBQUEsT0FBTyxDQUFDLEtBQUssQ0FBQyxFQUFVLENBQUMsSUFBSSxpQkFBc0IsQ0FBQztLQUN0RDtBQUNILENBQUM7Ozs7Ozs7QUFFRCxTQUFTLFFBQVEsQ0FBQyxPQUF1QixFQUFFLEtBQWEsRUFBRSxVQUFtQjs7VUFDckUsYUFBYSxHQUNmLEtBQUssc0NBQTBDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxzQkFBMkIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLO0lBQ2hHLElBQUksVUFBVSxFQUFFO1FBQ2QsQ0FBQyxtQkFBQSxPQUFPLENBQUMsYUFBYSxDQUFDLEVBQVUsQ0FBQyxpQkFBc0IsQ0FBQztLQUMxRDtTQUFNO1FBQ0wsQ0FBQyxtQkFBQSxPQUFPLENBQUMsYUFBYSxDQUFDLEVBQVUsQ0FBQyxJQUFJLGNBQW1CLENBQUM7S0FDM0Q7QUFDSCxDQUFDOzs7Ozs7QUFFRCxTQUFTLE9BQU8sQ0FBQyxPQUF1QixFQUFFLEtBQWE7O1VBQy9DLGFBQWEsR0FDZixLQUFLLHNDQUEwQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssc0JBQTJCLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSztJQUNoRyxPQUFPLENBQUMsQ0FBQyxtQkFBQSxPQUFPLENBQUMsYUFBYSxDQUFDLEVBQVUsQ0FBQyxnQkFBcUIsQ0FBQyxpQkFBc0IsQ0FBQztBQUN6RixDQUFDOzs7Ozs7QUFFRCxNQUFNLFVBQVUsaUJBQWlCLENBQUMsT0FBdUIsRUFBRSxLQUFhOztVQUNoRSxhQUFhLEdBQ2YsS0FBSyxzQ0FBMEMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLHNCQUEyQixDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUs7SUFDaEcsT0FBTyxDQUFDLENBQUMsbUJBQUEsT0FBTyxDQUFDLGFBQWEsQ0FBQyxFQUFVLENBQUMsZ0JBQXFCLENBQUMsaUJBQXNCLENBQUM7QUFDekYsQ0FBQzs7Ozs7O0FBRUQsU0FBUyxhQUFhLENBQUMsT0FBdUIsRUFBRSxLQUFhOztVQUNyRCxhQUFhLEdBQ2YsS0FBSyxzQ0FBMEMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLHNCQUEyQixDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUs7SUFDaEcsT0FBTyxDQUFDLENBQUMsbUJBQUEsT0FBTyxDQUFDLGFBQWEsQ0FBQyxFQUFVLENBQUMsbUJBQXdCLENBQUMsb0JBQXlCLENBQUM7QUFDL0YsQ0FBQzs7Ozs7OztBQUVELFNBQVMsUUFBUSxDQUFDLFVBQWtCLEVBQUUsV0FBbUIsRUFBRSxZQUFvQjtJQUM3RSxPQUFPLENBQUMsVUFBVSxtQkFBdUIsQ0FBQyxHQUFHLENBQUMsV0FBVyx3QkFBNkIsQ0FBQztRQUNuRixDQUFDLFlBQVksSUFBSSxDQUFDLDRDQUFxRCxDQUFDLENBQUMsQ0FBQztBQUNoRixDQUFDOzs7Ozs7QUFFRCxTQUFTLGVBQWUsQ0FBQyxPQUF1QixFQUFFLElBQVk7O1VBQ3RELEtBQUssR0FBRyxlQUFlLENBQUMsSUFBSSxDQUFDOztVQUM3QixpQkFBaUIsR0FBRyxJQUFJLGdCQUFxQjs7VUFDN0MsYUFBYSxHQUFHLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxPQUFPLG9DQUF5QyxDQUFDLENBQUM7UUFDbEQsT0FBTyxvQ0FBeUM7SUFDMUYsT0FBTyxtQkFBQSxhQUFhLENBQUMsS0FBSyxDQUFDLEVBQTJCLENBQUM7QUFDekQsQ0FBQzs7Ozs7QUFFRCxTQUFTLGVBQWUsQ0FBQyxJQUFZO0lBQ25DLE9BQU8sQ0FBQyxJQUFJLHdCQUE2QixDQUFDLHNCQUF1QixDQUFDO0FBQ3BFLENBQUM7Ozs7O0FBRUQsU0FBUyxxQkFBcUIsQ0FBQyxJQUFZOztVQUNuQyxLQUFLLEdBQ1AsQ0FBQyxJQUFJLElBQUksQ0FBQyw0Q0FBcUQsQ0FBQyxDQUFDLHNCQUF1QjtJQUM1RixPQUFPLEtBQUssc0NBQTBDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDdEUsQ0FBQzs7Ozs7QUFFRCxTQUFTLGtCQUFrQixDQUFDLE9BQXVCO0lBQ2pELE9BQU8sbUJBQUEscUJBQXFCLENBQUMsT0FBTyw0QkFBaUMsQ0FBQyxFQUFVLENBQUM7QUFDbkYsQ0FBQzs7Ozs7QUFFRCxTQUFTLHlCQUF5QixDQUFDLE9BQXVCOztVQUNsRCxVQUFVLEdBQUcsT0FBTyw0QkFBaUM7SUFDM0QsT0FBTyxVQUFVLENBQ1o7bUNBQzZDLENBQUMsQ0FBQztBQUN0RCxDQUFDOzs7OztBQUVELFNBQVMsd0JBQXdCLENBQUMsT0FBdUI7O1VBQ2pELFdBQVcsR0FBRyxPQUFPLDJCQUFnQztJQUMzRCxPQUFPLFdBQVcsQ0FDYjttQ0FDNkMsQ0FBQyxDQUFDO0FBQ3RELENBQUM7Ozs7Ozs7QUFFRCxTQUFTLE9BQU8sQ0FBQyxPQUF1QixFQUFFLEtBQWEsRUFBRSxJQUFZO0lBQ25FLE9BQU8sQ0FBQyxLQUFLLHlCQUE4QixDQUFDLEdBQUcsSUFBSSxDQUFDO0FBQ3RELENBQUM7Ozs7Ozs7QUFFRCxTQUFTLFFBQVEsQ0FBQyxPQUF1QixFQUFFLEtBQWEsRUFBRSxLQUE4QjtJQUN0RixPQUFPLENBQUMsS0FBSyxzQkFBMkIsQ0FBQyxHQUFHLEtBQUssQ0FBQztBQUNwRCxDQUFDOzs7Ozs7O0FBRUQsU0FBUyx1QkFBdUIsQ0FDNUIsT0FBdUIsRUFBRSxPQUE4QyxFQUFFLEtBQWE7O1VBQ2xGLGFBQWEsR0FBRyxtQkFBQSxPQUFPLHVCQUE0QixFQUFFO0lBQzNELElBQUksT0FBTyxFQUFFO1FBQ1gsSUFBSSxDQUFDLGFBQWEsSUFBSSxLQUFLLEtBQUssQ0FBQyxFQUFFO1lBQ2pDLE9BQU8sSUFBSSxDQUFDO1NBQ2I7S0FDRjtTQUFNLElBQUksQ0FBQyxhQUFhLEVBQUU7UUFDekIsT0FBTyxLQUFLLENBQUM7S0FDZDtJQUNELE9BQU8sYUFBYSxDQUFDLEtBQUssQ0FBQyxLQUFLLE9BQU8sQ0FBQztBQUMxQyxDQUFDOzs7Ozs7O0FBRUQsU0FBUyxnQkFBZ0IsQ0FDckIsT0FBdUIsRUFBRSxPQUE4QyxFQUN2RSxjQUFzQjs7UUFDcEIsYUFBYSxHQUFHLE9BQU8sdUJBQTRCLElBQUksa0JBQWtCLENBQUMsT0FBTyxDQUFDO0lBQ3RGLElBQUksY0FBYyxHQUFHLENBQUMsRUFBRTtRQUN0QixhQUFhLENBQUMsY0FBYyxDQUFDLEdBQUcsT0FBTyxDQUFDO0tBQ3pDO1NBQU07UUFDTCxjQUFjLEdBQUcsYUFBYSxnQ0FBb0MsQ0FBQztRQUNuRSxhQUFhLENBQUMsTUFBTSxDQUFDLGNBQWMsRUFBRSxDQUFDLEVBQUUsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ3ZELGFBQWEsZ0NBQW9DO29EQUNELENBQUM7S0FDbEQ7SUFDRCxPQUFPLGNBQWMsQ0FBQztBQUN4QixDQUFDOzs7Ozs7QUFFRCxNQUFNLFVBQVUsc0JBQXNCLENBQUMsY0FBc0IsRUFBRSxXQUFtQjtJQUNoRixPQUFPLENBQUMsV0FBVyx5QkFBb0QsQ0FBQyxHQUFHLGNBQWMsQ0FBQztBQUM1RixDQUFDOzs7Ozs7OztBQUVELFNBQVMscUJBQXFCLENBQzFCLE9BQXVCLEVBQUUsS0FBYSxFQUFFLGtCQUEwQixFQUFFLGNBQXNCOztVQUN0RixLQUFLLEdBQUcsc0JBQXNCLENBQUMsY0FBYyxFQUFFLGtCQUFrQixDQUFDO0lBQ3hFLE9BQU8sQ0FBQyxLQUFLLG1DQUF3QyxDQUFDLEdBQUcsS0FBSyxDQUFDO0FBQ2pFLENBQUM7Ozs7OztBQUVELFNBQVMscUJBQXFCLENBQUMsT0FBdUIsRUFBRSxLQUFhOztVQUM3RCxJQUFJLEdBQUcsbUJBQUEsT0FBTyxDQUFDLEtBQUssbUNBQXdDLENBQUMsRUFBVTs7VUFDdkUsa0JBQWtCLEdBQUcsQ0FBQyxJQUFJLHlCQUFvRCxDQUFDOzJCQUN0QztJQUMvQyxPQUFPLGtCQUFrQixDQUFDO0FBQzVCLENBQUM7Ozs7OztBQUVELFNBQVMsZ0JBQWdCLENBQUMsT0FBdUIsRUFBRSxLQUFhOztVQUV4RCxrQkFBa0IsR0FBRyxxQkFBcUIsQ0FBQyxPQUFPLEVBQUUsS0FBSyxDQUFDO0lBQ2hFLElBQUksa0JBQWtCLEVBQUU7O2NBQ2hCLGFBQWEsR0FBRyxPQUFPLHVCQUE0QjtRQUN6RCxJQUFJLGFBQWEsRUFBRTtZQUNqQixPQUFPLG1CQUFBLGFBQWEsQ0FBQyxrQkFBa0IsQ0FBQyxFQUF5QyxDQUFDO1NBQ25GO0tBQ0Y7SUFDRCxPQUFPLElBQUksQ0FBQztBQUNkLENBQUM7Ozs7Ozs7QUFFRCxTQUFTLE9BQU8sQ0FBQyxPQUF1QixFQUFFLEtBQWEsRUFBRSxJQUFZOztVQUM3RCxhQUFhLEdBQ2YsS0FBSywrQkFBb0MsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssc0JBQTJCLENBQUM7SUFDMUYsT0FBTyxDQUFDLGFBQWEsQ0FBQyxHQUFHLElBQUksQ0FBQztBQUNoQyxDQUFDOzs7Ozs7QUFFRCxTQUFTLFdBQVcsQ0FBQyxPQUF1QixFQUFFLEtBQWE7O1VBQ25ELGFBQWEsR0FDZixLQUFLLCtCQUFvQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxzQkFBMkIsQ0FBQztJQUMxRixPQUFPLG1CQUFBLE9BQU8sQ0FBQyxhQUFhLENBQUMsRUFBVSxDQUFDO0FBQzFDLENBQUM7Ozs7OztBQUVELE1BQU0sVUFBVSxRQUFRLENBQUMsT0FBdUIsRUFBRSxLQUFhO0lBQzdELE9BQU8sbUJBQUEsT0FBTyxDQUFDLEtBQUssc0JBQTJCLENBQUMsRUFBMkIsQ0FBQztBQUM5RSxDQUFDOzs7Ozs7QUFFRCxNQUFNLFVBQVUsT0FBTyxDQUFDLE9BQXVCLEVBQUUsS0FBYTtJQUM1RCxPQUFPLG1CQUFBLE9BQU8sQ0FBQyxLQUFLLHlCQUE4QixDQUFDLEVBQVUsQ0FBQztBQUNoRSxDQUFDOzs7OztBQUVELE1BQU0sVUFBVSxjQUFjLENBQUMsT0FBdUI7SUFDcEQsT0FBTyxPQUFPLENBQUMsT0FBTyw2QkFBa0MsQ0FBQztBQUMzRCxDQUFDOzs7Ozs7QUFFRCxNQUFNLFVBQVUsZUFBZSxDQUFDLE9BQXVCLEVBQUUsVUFBbUI7SUFDMUUsUUFBUSxDQUFDLE9BQU8sOEJBQW1DLFVBQVUsQ0FBQyxDQUFDO0FBQ2pFLENBQUM7Ozs7OztBQUVELE1BQU0sVUFBVSxzQkFBc0IsQ0FBQyxPQUF1QixFQUFFLFVBQW1CO0lBQ2pGLElBQUksVUFBVSxFQUFFO1FBQ2QsQ0FBQyxtQkFBQSxPQUFPLDRCQUFpQyxFQUFVLENBQUMsK0JBQW9DLENBQUM7S0FDMUY7U0FBTTtRQUNMLENBQUMsbUJBQUEsT0FBTyw0QkFBaUMsRUFBVSxDQUFDLElBQUksNEJBQWlDLENBQUM7S0FDM0Y7QUFDSCxDQUFDOzs7Ozs7O0FBRUQsU0FBUyx1QkFBdUIsQ0FBQyxPQUF1QixFQUFFLE1BQWMsRUFBRSxNQUFjO0lBQ3RGLElBQUksTUFBTSxLQUFLLE1BQU07UUFBRSxPQUFPOztVQUV4QixRQUFRLEdBQUcsUUFBUSxDQUFDLE9BQU8sRUFBRSxNQUFNLENBQUM7O1VBQ3BDLE9BQU8sR0FBRyxPQUFPLENBQUMsT0FBTyxFQUFFLE1BQU0sQ0FBQzs7VUFDbEMsT0FBTyxHQUFHLFdBQVcsQ0FBQyxPQUFPLEVBQUUsTUFBTSxDQUFDOztVQUN0QyxxQkFBcUIsR0FBRyxxQkFBcUIsQ0FBQyxPQUFPLEVBQUUsTUFBTSxDQUFDOztVQUM5RCxpQkFBaUIsR0FBRywwQkFBMEIsQ0FBQyxPQUFPLEVBQUUsTUFBTSxDQUFDOztRQUVqRSxLQUFLLEdBQUcsT0FBTzs7UUFDZixLQUFLLEdBQUcsV0FBVyxDQUFDLE9BQU8sRUFBRSxNQUFNLENBQUM7O1VBRWxDLFlBQVksR0FBRyxxQkFBcUIsQ0FBQyxLQUFLLENBQUM7SUFDakQsSUFBSSxZQUFZLElBQUksQ0FBQyxFQUFFOztjQUNmLEtBQUssR0FBRyxXQUFXLENBQUMsT0FBTyxFQUFFLFlBQVksQ0FBQzs7Y0FDMUMsUUFBUSxHQUFHLGVBQWUsQ0FBQyxLQUFLLENBQUM7UUFDdkMsT0FBTyxDQUFDLE9BQU8sRUFBRSxZQUFZLEVBQUUsUUFBUSxDQUFDLEtBQUssRUFBRSxRQUFRLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQztLQUNuRTs7VUFFSyxZQUFZLEdBQUcscUJBQXFCLENBQUMsS0FBSyxDQUFDO0lBQ2pELElBQUksWUFBWSxJQUFJLENBQUMsRUFBRTs7Y0FDZixLQUFLLEdBQUcsV0FBVyxDQUFDLE9BQU8sRUFBRSxZQUFZLENBQUM7O2NBQzFDLFFBQVEsR0FBRyxlQUFlLENBQUMsS0FBSyxDQUFDO1FBQ3ZDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsWUFBWSxFQUFFLFFBQVEsQ0FBQyxLQUFLLEVBQUUsUUFBUSxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUM7S0FDbkU7SUFFRCxRQUFRLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxRQUFRLENBQUMsT0FBTyxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUM7SUFDckQsT0FBTyxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsT0FBTyxDQUFDLE9BQU8sRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDO0lBQ25ELE9BQU8sQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLFdBQVcsQ0FBQyxPQUFPLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQzs7VUFDakQsWUFBWSxHQUFHLHFCQUFxQixDQUFDLE9BQU8sRUFBRSxNQUFNLENBQUM7O1VBQ3JELGVBQWUsR0FBRywwQkFBMEIsQ0FBQyxPQUFPLEVBQUUsTUFBTSxDQUFDO0lBQ25FLHFCQUFxQixDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsWUFBWSxFQUFFLGVBQWUsQ0FBQyxDQUFDO0lBRXRFLFFBQVEsQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLFFBQVEsQ0FBQyxDQUFDO0lBQ3BDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0lBQ2xDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0lBQ2xDLHFCQUFxQixDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUscUJBQXFCLEVBQUUsaUJBQWlCLENBQUMsQ0FBQztBQUNuRixDQUFDOzs7Ozs7QUFFRCxTQUFTLHlCQUF5QixDQUFDLE9BQXVCLEVBQUUsa0JBQTBCO0lBQ3BGLEtBQUssSUFBSSxDQUFDLEdBQUcsa0JBQWtCLEVBQUUsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxnQkFBcUIsRUFBRTs7Y0FDckUsU0FBUyxHQUFHLFdBQVcsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDOztjQUNuQyxXQUFXLEdBQUcscUJBQXFCLENBQUMsU0FBUyxDQUFDO1FBQ3BELElBQUksV0FBVyxHQUFHLENBQUMsRUFBRTs7a0JBQ2IsVUFBVSxHQUFHLFdBQVcsQ0FBQyxPQUFPLEVBQUUsV0FBVyxDQUFDOztrQkFDOUMscUJBQXFCLEdBQUcsZUFBZSxDQUFDLFVBQVUsQ0FBQzs7a0JBQ25ELFNBQVMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsV0FBVyxDQUFDLENBQUMsQ0FBQyxlQUFvQixDQUFDLGFBQWtCLENBQUM7Z0JBQ3RGLENBQUMsaUJBQWlCLENBQUMsT0FBTyxFQUFFLFdBQVcsQ0FBQyxDQUFDLENBQUMsZUFBb0IsQ0FBQyxhQUFrQixDQUFDO2dCQUNsRixDQUFDLGFBQWEsQ0FBQyxPQUFPLEVBQUUsV0FBVyxDQUFDLENBQUMsQ0FBQyxrQkFBdUIsQ0FBQyxhQUFrQixDQUFDOztrQkFDL0UsV0FBVyxHQUFHLFFBQVEsQ0FBQyxTQUFTLEVBQUUscUJBQXFCLEVBQUUsQ0FBQyxDQUFDO1lBQ2pFLE9BQU8sQ0FBQyxPQUFPLEVBQUUsV0FBVyxFQUFFLFdBQVcsQ0FBQyxDQUFDO1NBQzVDO0tBQ0Y7QUFDSCxDQUFDOzs7Ozs7Ozs7Ozs7QUFFRCxTQUFTLHNCQUFzQixDQUMzQixPQUF1QixFQUFFLEtBQWEsRUFBRSxVQUFtQixFQUFFLElBQVksRUFBRSxJQUFZLEVBQ3ZGLEtBQXVCLEVBQUUsY0FBc0IsRUFBRSxXQUFtQjs7VUFDaEUsT0FBTyxHQUFHLEtBQUssR0FBRyxPQUFPLENBQUMsTUFBTTtJQUV0Qyw2Q0FBNkM7SUFDN0MsT0FBTyxDQUFDLE1BQU0sQ0FDVixLQUFLLEVBQUUsQ0FBQyxFQUFFLElBQUksZ0JBQXFCLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQyxlQUFvQixDQUFDLGFBQWtCLENBQUMsRUFDM0YsSUFBSSxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQztJQUNwQixxQkFBcUIsQ0FBQyxPQUFPLEVBQUUsS0FBSyxFQUFFLFdBQVcsRUFBRSxjQUFjLENBQUMsQ0FBQztJQUVuRSxJQUFJLE9BQU8sRUFBRTtRQUNYLCtEQUErRDtRQUMvRCw0REFBNEQ7UUFDNUQsa0RBQWtEO1FBQ2xELHlCQUF5QixDQUFDLE9BQU8sRUFBRSxLQUFLLGVBQW9CLENBQUMsQ0FBQztLQUMvRDtBQUNILENBQUM7Ozs7OztBQUVELFNBQVMsV0FBVyxDQUFDLEtBQThCLEVBQUUsWUFBc0I7SUFDekUsT0FBTyxLQUFLLEtBQUssSUFBSSxDQUFDO0FBQ3hCLENBQUM7Ozs7Ozs7O0FBRUQsU0FBUyxrQkFBa0IsQ0FDdkIsT0FBdUIsRUFBRSxJQUFZLEVBQUUsaUJBQTBCLEVBQ2pFLFNBQWtDOztRQUNoQyxJQUFJLEdBQUcsQ0FBQyxTQUFTLElBQUksU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxrQkFBdUIsQ0FBQyxhQUFrQjs7UUFFakYsWUFBb0I7SUFDeEIsSUFBSSxpQkFBaUIsRUFBRTtRQUNyQixJQUFJLGlCQUFzQixDQUFDO1FBQzNCLFlBQVk7WUFDUiw4QkFBOEIsQ0FBQyxPQUFPLG9DQUF5QyxFQUFFLElBQUksQ0FBQyxDQUFDO0tBQzVGO1NBQU07UUFDTCxZQUFZO1lBQ1IsOEJBQThCLENBQUMsT0FBTyxvQ0FBeUMsRUFBRSxJQUFJLENBQUMsQ0FBQztLQUM1RjtJQUVELFlBQVksR0FBRyxZQUFZLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFlBQVksc0JBQXdDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzdGLE9BQU8sUUFBUSxDQUFDLElBQUksRUFBRSxZQUFZLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFDekMsQ0FBQzs7Ozs7OztBQUVELFNBQVMsc0JBQXNCLENBQUMsT0FBdUIsRUFBRSxJQUFZLEVBQUUsUUFBYTs7VUFDNUUsWUFBWSxHQUFHLGVBQWUsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDO0lBQ25ELE9BQU8sQ0FBQyxZQUFZLElBQUksZUFBZSxDQUFDLElBQUksRUFBRSxZQUFZLEVBQUUsUUFBUSxDQUFDLENBQUM7QUFDeEUsQ0FBQzs7Ozs7OztBQUVELFNBQVMsZUFBZSxDQUNwQixJQUFZLEVBQUUsQ0FBMEIsRUFBRSxDQUEwQjs7VUFDaEUsWUFBWSxHQUFHLElBQUksZ0JBQXFCOztVQUN4QyxTQUFTLEdBQUcsQ0FBQyxJQUFJLENBQUM7O1VBQ2xCLGFBQWEsR0FBRyxJQUFJLG1CQUF3QjtJQUNsRCw0REFBNEQ7SUFDNUQsbUVBQW1FO0lBQ25FLHNEQUFzRDtJQUN0RCxJQUFJLENBQUMsWUFBWSxJQUFJLFNBQVMsSUFBSSxhQUFhLEVBQUU7UUFDL0MsNERBQTREO1FBQzVELE9BQU8sQ0FBQyxtQkFBQSxDQUFDLEVBQVUsQ0FBQyxDQUFDLFFBQVEsRUFBRSxLQUFLLENBQUMsbUJBQUEsQ0FBQyxFQUFVLENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FBQztLQUM5RDtJQUVELGdFQUFnRTtJQUNoRSxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDakIsQ0FBQzs7OztBQUVELE1BQU0sT0FBTywwQkFBMEI7Ozs7OztJQUtyQyxZQUFZLE9BQXNCLEVBQVUsUUFBcUIsRUFBVSxLQUFrQjtRQUFqRCxhQUFRLEdBQVIsUUFBUSxDQUFhO1FBQVUsVUFBSyxHQUFMLEtBQUssQ0FBYTtRQUpyRixZQUFPLEdBQW1DLEVBQUUsQ0FBQztRQUM3QyxXQUFNLEdBQUcsS0FBSyxDQUFDO1FBSXJCLElBQUksQ0FBQyxRQUFRLEdBQUcsbUJBQUEsT0FBTyxFQUFPLENBQUM7SUFDakMsQ0FBQzs7Ozs7O0lBRUQsUUFBUSxDQUFDLElBQVksRUFBRSxLQUFVO1FBQy9CLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsS0FBSyxLQUFLLEVBQUU7WUFDaEMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxLQUFLLENBQUM7WUFDM0IsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUM7U0FDcEI7SUFDSCxDQUFDOzs7Ozs7SUFFRCxXQUFXLENBQUMsYUFBMEIsRUFBRSxhQUFzQjtRQUM1RCxxRUFBcUU7UUFDckUsbUVBQW1FO1FBQ25FLHlEQUF5RDtRQUN6RCxJQUFJLElBQUksQ0FBQyxNQUFNLEVBQUU7O2tCQUNULE1BQU0sR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FDM0IsSUFBSSxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsS0FBSyxFQUFFLG1CQUFBLElBQUksQ0FBQyxPQUFPLEVBQUUsRUFBRSxhQUFhLEVBQUUsYUFBYSxJQUFJLElBQUksQ0FBQztZQUNwRixJQUFJLENBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztZQUNsQixJQUFJLENBQUMsTUFBTSxHQUFHLEtBQUssQ0FBQztZQUNwQixPQUFPLE1BQU0sQ0FBQztTQUNmO1FBRUQsT0FBTyxTQUFTLENBQUM7SUFDbkIsQ0FBQztDQUNGOzs7Ozs7SUE3QkMsNkNBQXFEOzs7OztJQUNyRCw0Q0FBdUI7Ozs7O0lBQ3ZCLDhDQUF3Qzs7Ozs7SUFFSiw4Q0FBNkI7Ozs7O0lBQUUsMkNBQTBCOzs7Ozs7Ozs7OztBQW1DL0YsZ0NBWUM7OztJQVhDLDBCQUFhOztJQUNiLGlDQUFvQjs7SUFDcEIsa0NBQXFCOztJQUNyQiwyQkFBYzs7SUFDZCwyQkFNRTs7Ozs7OztBQVdKLE1BQU0sVUFBVSxxQkFBcUIsQ0FBQyxNQUErQixFQUFFLEtBQWM7O1FBQy9FLElBQUk7O1FBQUUsSUFBSSxHQUFHLG1CQUFtQjtJQUNwQyxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLEVBQUU7UUFDekIsSUFBSSxLQUFLLEVBQUU7WUFDVCxJQUFJLElBQUksU0FBUyxHQUFHLEtBQUssQ0FBQztTQUMzQjthQUFNO1lBQ0wsSUFBSSxJQUFJLGVBQWUsQ0FBQztTQUN6QjtRQUNELEtBQUssR0FBRyxLQUFLLDhCQUFtQyxDQUFDO1FBQ2pELElBQUksR0FBRyxtQkFBQSxNQUFNLENBQUMsS0FBSyxDQUFDLEVBQVUsQ0FBQztLQUNoQztTQUFNO1FBQ0wsSUFBSSxHQUFHLE1BQU0sQ0FBQztRQUNkLElBQUksSUFBSSxTQUFTLEdBQUcsSUFBSSxDQUFDO0tBQzFCOztVQUNLLFlBQVksR0FBRyxxQkFBcUIsQ0FBQyxJQUFJLENBQUM7O1VBQzFDLFdBQVcsR0FBRyxlQUFlLENBQUMsSUFBSSxDQUFDO0lBQ3pDLE9BQU87UUFDTCxJQUFJO1FBQ0osV0FBVztRQUNYLFlBQVk7UUFDWixLQUFLLEVBQUUsSUFBSTtRQUNYLEtBQUssRUFBRTtZQUNMLEtBQUssRUFBRSxJQUFJLGdCQUFxQixDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEtBQUs7WUFDL0MsS0FBSyxFQUFFLElBQUksZ0JBQXFCLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsS0FBSztZQUMvQyxRQUFRLEVBQUUsSUFBSSxtQkFBd0IsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxLQUFLO1lBQ3JELG1CQUFtQixFQUFFLElBQUksOEJBQW1DLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsS0FBSztZQUMzRSx1QkFBdUIsRUFBRSxJQUFJLG1DQUF1QyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEtBQUs7U0FDcEY7S0FDRixDQUFDO0FBQ0osQ0FBQzs7Ozs7O0FBRUQsTUFBTSxVQUFVLDBCQUEwQixDQUFDLE9BQXVCLEVBQUUsS0FBYTs7VUFDekUsS0FBSyxHQUFHLG1CQUFBLE9BQU8sQ0FBQyxLQUFLLG1DQUF3QyxDQUFDLEVBQVU7SUFDOUUsT0FBTyxLQUFLLHNCQUE4QyxDQUFDO0FBQzdELENBQUM7Ozs7OztBQUVELFNBQVMsOEJBQThCLENBQUMsU0FBK0IsRUFBRSxHQUFXO0lBQ2xGLEtBQUssSUFBSSxDQUFDLGdDQUFrRCxFQUFFLENBQUMsR0FBRyxTQUFTLENBQUMsTUFBTSxFQUM3RSxDQUFDLGdCQUFrQyxFQUFFO1FBQ3hDLElBQUksU0FBUyxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUc7WUFBRSxPQUFPLENBQUMsQ0FBQztLQUNwQztJQUNELE9BQU8sQ0FBQyxDQUFDLENBQUM7QUFDWixDQUFDOzs7Ozs7QUFFRCxNQUFNLFVBQVUsbUJBQW1CLENBQUMsQ0FBYSxFQUFFLENBQWE7O1VBQ3hELEdBQUcsR0FBYSxFQUFFOztVQUNsQixLQUFLLEdBQXlCLEVBQUU7SUFDdEMsaUJBQWlCLENBQUMsS0FBSyxFQUFFLGFBQWEsRUFBRSxhQUFhLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQzdELGlCQUFpQixDQUFDLEtBQUssRUFBRSxjQUFjLEVBQUUsY0FBYyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztJQUMvRCxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxPQUFPOzs7O0lBQ3hCLElBQUksQ0FBQyxFQUFFLEdBQUcsaUJBQWlCLENBQUMsS0FBSyxFQUFFLFFBQVEsR0FBRyxJQUFJLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUM7SUFFcEYsSUFBSSxLQUFLLENBQUMsTUFBTSxFQUFFO1FBQ2hCLEdBQUcsQ0FBQyxJQUFJLENBQUMsb0JBQW9CLENBQUMsQ0FBQztRQUMvQixHQUFHLENBQUMsSUFBSSxDQUFDLE9BQU8sR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDM0IsR0FBRyxDQUFDLElBQUksQ0FBQyxPQUFPLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzNCLEdBQUcsQ0FBQyxJQUFJLENBQUMsNENBQTRDLENBQUMsQ0FBQztRQUN2RCxLQUFLLENBQUMsT0FBTzs7OztRQUFDLE1BQU0sQ0FBQyxFQUFFO2tCQUNmLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsR0FBRyxNQUFNO1lBQ2pDLEdBQUcsQ0FBQyxJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxDQUFDO1lBQzNCLEdBQUcsQ0FBQyxJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksR0FBRyxPQUFPLEdBQUcsSUFBSSxHQUFHLElBQUksQ0FBQyxDQUFDO1FBQ3JELENBQUMsRUFBQyxDQUFDO0tBQ0o7SUFFRCxPQUFPLEdBQUcsQ0FBQztBQUNiLENBQUM7Ozs7Ozs7OztBQUVELFNBQVMsaUJBQWlCLENBQUMsTUFBYSxFQUFFLElBQVksRUFBRSxJQUFZLEVBQUUsQ0FBTSxFQUFFLENBQU07O1VBQzVFLElBQUksR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDOztVQUNkLElBQUksR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDO0lBQ3BCLElBQUksSUFBSSxLQUFLLElBQUksRUFBRTtRQUNqQixNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO0tBQ2pDO0FBQ0gsQ0FBQzs7Ozs7Ozs7QUFFRCxTQUFTLHVCQUF1QixDQUM1QixPQUF1QixFQUFFLGNBQXNCLEVBQUUsTUFBYyxFQUFFLFlBQXFCOztVQUNsRiw2QkFBNkIsR0FDL0IsbUJBQUEsT0FBTyxtQ0FBd0MsQ0FDdkMsQ0FBQyxjQUFjLGVBQW9DLENBQUM7MkNBQ0ksQ0FBQyxFQUFVOztVQUN6RSxPQUFPLEdBQUcsT0FBTyxtQ0FBd0M7O1VBQ3pELGNBQWMsR0FBRyw2QkFBNkI7a0NBQ0Y7UUFDOUMsQ0FBQyxZQUFZLENBQUMsQ0FBQztZQUNWLE9BQU8sQ0FDRiw2QkFBNkIsOEJBQWtELENBQUMsQ0FBQyxDQUFDO1lBQ3ZGLENBQUMsQ0FBQztRQUNQLE1BQU07SUFDVixPQUFPLE9BQU8sQ0FBQyxjQUFjLENBQUMsQ0FBQztBQUNqQyxDQUFDOzs7Ozs7QUFFRCxTQUFTLGlCQUFpQixDQUFDLE9BQXVCLEVBQUUsY0FBc0I7O1VBQ2xFLElBQUksR0FBRyxPQUFPLG1DQUF3Qzs7VUFDdEQsS0FBSyxHQUFHLElBQUksQ0FDQyxjQUFjLGVBQW9DO29DQUNELENBQUM7UUFDakUsSUFBSSw4QkFBbUQsSUFBSSxJQUFJO0lBQ25FLE9BQU8sbUJBQUEsS0FBSyxFQUEwQixDQUFDO0FBQ3pDLENBQUM7Ozs7Ozs7O0FBRUQsU0FBUyxnQkFBZ0IsQ0FDckIsWUFBcUMsRUFBRSxRQUFpQyxFQUN4RSxxQkFBNkIsRUFBRSxpQkFBeUI7SUFDMUQsMEVBQTBFO0lBQzFFLDBFQUEwRTtJQUMxRSw2RUFBNkU7SUFDN0UsZ0ZBQWdGO0lBQ2hGLGlGQUFpRjtJQUNqRixrRkFBa0Y7SUFDbEYsaUZBQWlGO0lBQ2pGLG9GQUFvRjtJQUNwRiw0REFBNEQ7SUFDNUQsSUFBSSxZQUFZLElBQUksSUFBSSxFQUFFO1FBQ3hCLElBQUksUUFBUSxJQUFJLElBQUksRUFBRTtZQUNwQixxRUFBcUU7WUFDckUsZ0NBQWdDO1lBQ2hDLE9BQU8saUJBQWlCLElBQUkscUJBQXFCLENBQUM7U0FDbkQ7YUFBTTtZQUNMLGtFQUFrRTtZQUNsRSwrREFBK0Q7WUFDL0QsNkRBQTZEO1lBQzdELHlDQUF5QztZQUN6QyxPQUFPLHFCQUFxQixLQUFLLGlCQUFpQixDQUFDO1NBQ3BEO0tBQ0Y7SUFDRCxPQUFPLElBQUksQ0FBQztBQUNkLENBQUM7Ozs7Ozs7Ozs7Ozs7QUFhRCxNQUFNLFVBQVUsd0JBQXdCLENBQUMsT0FBdUI7O1VBQ3hELGtCQUFrQixHQUFHLE9BQU8sb0NBQXlDOztRQUN2RSxTQUFTLEdBQUcsa0JBQWtCLG1DQUFxRDtJQUN2RixJQUFJLFNBQVMsS0FBSyxJQUFJLEVBQUU7UUFDdEIsU0FBUyxHQUFHLEVBQUUsQ0FBQztRQUNmLEtBQUssSUFBSSxDQUFDLGdDQUFrRCxFQUFFLENBQUMsR0FBRyxrQkFBa0IsQ0FBQyxNQUFNLEVBQ3RGLENBQUMsZ0JBQWtDLEVBQUU7O2tCQUNsQyxTQUFTLEdBQUcsa0JBQWtCLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUMzQyxJQUFJLFNBQVMsRUFBRTtnQkFDYixTQUFTLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLGtCQUFrQixDQUFDLENBQUMsQ0FBQyxDQUFDO2FBQ3BFO1NBQ0Y7UUFDRCxrQkFBa0IsbUNBQXFELEdBQUcsU0FBUyxDQUFDO0tBQ3JGO0lBQ0QsT0FBTyxTQUFTLENBQUM7QUFDbkIsQ0FBQzs7Ozs7Ozs7Ozs7OztBQWFELE1BQU0sVUFBVSwwQkFBMEIsQ0FBQyxPQUF1Qjs7VUFDMUQsa0JBQWtCLEdBQUcsT0FBTyxvQ0FBeUM7O1FBQ3ZFLFdBQVcsR0FBRyxrQkFBa0IsbUNBQXFEO0lBQ3pGLElBQUksV0FBVyxLQUFLLElBQUksRUFBRTtRQUN4QixXQUFXLEdBQUcsRUFBRSxDQUFDO1FBQ2pCLEtBQUssSUFBSSxDQUFDLGdDQUFrRCxFQUFFLENBQUMsR0FBRyxrQkFBa0IsQ0FBQyxNQUFNLEVBQ3RGLENBQUMsZ0JBQWtDLEVBQUU7O2tCQUNsQyxLQUFLLEdBQUcsa0JBQWtCLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUN2QyxJQUFJLEtBQUssS0FBSyxJQUFJLEVBQUU7Z0JBQ2xCLFdBQVcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsR0FBRyxrQkFBa0IsQ0FBQyxDQUFDLENBQUMsSUFBSSxLQUFLLEVBQUUsQ0FBQzthQUN0RjtTQUNGO1FBQ0Qsa0JBQWtCLG1DQUFxRCxHQUFHLFdBQVcsQ0FBQztLQUN2RjtJQUNELE9BQU8sV0FBVyxDQUFDO0FBQ3JCLENBQUM7Ozs7Ozs7O0FBS0QsU0FBUyxrQkFBa0IsQ0FDdkIsT0FBdUIsRUFBRSxpQkFBMEIsRUFBRSxjQUFzQjs7VUFDdkUsTUFBTSxHQUNSLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLDRCQUFpQyxDQUFDLDBCQUErQixDQUFDOztVQUMzRixLQUFLLEdBQUc7UUFDVixjQUFjLGVBQWlDO0lBQ25ELE9BQU8sTUFBTSxDQUFDLEtBQUssc0JBQXdDLENBQUMsSUFBSSxJQUFJLENBQUM7QUFDdkUsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFnQkQsU0FBUyxvQkFBb0IsQ0FDekIsT0FBdUIsRUFBRSxpQkFBMEIsRUFBRSxjQUFzQixFQUMzRSxRQUFhOztVQUNULG1CQUFtQixHQUNyQixpQkFBaUIsQ0FBQyxDQUFDLDRCQUFpQyxDQUFDLDBCQUErQjs7VUFDbEYsWUFBWSxHQUFHLG1CQUFBLE9BQU8sQ0FBQyxtQkFBbUIsQ0FBQyxFQUF3Qjs7VUFDbkUsS0FBSyxHQUFHO1FBQ1YsY0FBYyxlQUFpQztJQUNuRCxJQUFJLFlBQVksQ0FBQyxLQUFLLDBCQUE0QyxDQUFDO1FBQUUsT0FBTyxLQUFLLENBQUM7SUFDbEYsT0FBTyxRQUFRLEtBQUssU0FBUztRQUN6QixrQkFBa0IsQ0FBQyxPQUFPLEVBQUUsaUJBQWlCLEVBQUUsY0FBYyxDQUFDLEtBQUssUUFBUSxDQUFDO0FBQ2xGLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBd0JELFNBQVMsb0JBQW9CLENBQ3pCLE9BQXVCLEVBQUUsY0FBc0IsRUFBRSxpQkFBMEIsRUFBRSxVQUFlLEVBQzVGLGFBQXFCLEVBQUUsV0FBbUIsRUFBRSxXQUFtQixFQUFFLGlCQUEwQjs7VUFDdkYsTUFBTSxHQUNSLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLDRCQUFpQyxDQUFDLDBCQUErQixDQUFDOztVQUUzRixLQUFLLEdBQUc7UUFDVixjQUFjLGVBQWlDO0lBRW5ELHNGQUFzRjtJQUN0Riw2Q0FBNkM7SUFDN0MsSUFBSSxpQkFBaUIsRUFBRTs7Y0FDZixpQkFBaUIsR0FBRyxhQUFhLEdBQUcsV0FBVyxlQUFpQztRQUN0RixLQUFLLElBQUksQ0FBQyxHQUFHLEtBQUssZUFBaUMsRUFBRSxDQUFDLEdBQUcsTUFBTSxDQUFDLE1BQU0sRUFDakUsQ0FBQyxnQkFBa0MsRUFBRTtZQUN4QyxNQUFNLENBQUMsQ0FBQyw4QkFBZ0QsQ0FBQyxHQUFHLGlCQUFpQixDQUFDO1lBQzlFLE1BQU0sQ0FBQyxDQUFDLDBCQUE0QyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1NBQzNEO0tBQ0Y7SUFFRCxNQUFNLENBQUMsS0FBSywwQkFBNEMsQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUM5RCxNQUFNLENBQUMsS0FBSyw4QkFBZ0QsQ0FBQyxHQUFHLGFBQWEsQ0FBQztJQUM5RSxNQUFNLENBQUMsS0FBSyxzQkFBd0MsQ0FBQyxHQUFHLFVBQVUsQ0FBQztJQUNuRSxNQUFNLENBQUMsS0FBSywyQkFBNkMsQ0FBQyxHQUFHLFdBQVcsQ0FBQzs7Ozs7UUFLckUsbUJBQW1CLEdBQUcsV0FBVztJQUNyQyxLQUFLLElBQUksQ0FBQyw4QkFBZ0QsRUFBRSxDQUFDLEdBQUcsS0FBSyxFQUNoRSxDQUFDLGdCQUFrQyxFQUFFO1FBQ3hDLG1CQUFtQixJQUFJLE1BQU0sQ0FBQyxDQUFDLDJCQUE2QyxDQUFDLENBQUM7S0FDL0U7SUFFRCwwRUFBMEU7SUFDMUUsdUVBQXVFO0lBQ3ZFLDBFQUEwRTtJQUMxRSx1QkFBdUI7SUFDdkIsSUFBSSxDQUFDLGlCQUFpQixFQUFFOztjQUNoQixVQUFVLEdBQUcsT0FBTyw0QkFBaUM7O2NBQ3JELG9CQUFvQixHQUFHLFVBQVUsQ0FDbEM7dUNBQzZDLENBQUM7O2NBQzdDLG1CQUFtQixHQUFHLFdBQVcsR0FBRyxvQkFBb0I7UUFDOUQsS0FBSyxJQUFJLENBQUMsOEJBQWdELEVBQUUsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxNQUFNLEVBQzVFLENBQUMsZ0JBQWtDLEVBQUU7WUFDeEMsVUFBVSxDQUFDLENBQUMsOEJBQWdELENBQUMsSUFBSSxtQkFBbUIsQ0FBQztTQUN0RjtLQUNGO0lBRUQsTUFBTSw4QkFBZ0QsR0FBRyxtQkFBbUIsQ0FBQztBQUMvRSxDQUFDOzs7OztBQUVELFNBQVMsZ0JBQWdCLENBQUMsT0FBaUI7O1VBQ25DLFVBQVUsR0FBYSxFQUFFO0lBQy9CLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO1FBQ3ZDLFVBQVUsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7S0FDeEM7SUFDRCxPQUFPLFVBQVUsQ0FBQztBQUNwQixDQUFDOzs7OztBQUVELFNBQVMsU0FBUyxDQUFDLEtBQWE7SUFDOUIsT0FBTyxLQUFLLENBQUMsT0FBTyxDQUNoQixhQUFhOzs7O0lBQUUsS0FBSyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLElBQUksS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxXQUFXLEVBQUUsRUFBRSxFQUFDLENBQUM7QUFDckYsQ0FBQzs7Ozs7Ozs7O0FBRUQsU0FBUyxxQkFBcUIsQ0FDMUIsT0FBdUIsRUFBRSxjQUFzQixFQUFFLGlCQUEwQixFQUMzRSxhQUFxQixFQUFFLEtBQUssR0FBRyxDQUFDOztVQUM1QixZQUFZLEdBQ2QsT0FBTyxDQUFDLGlCQUFpQixDQUFDLENBQUMsNEJBQWlDLENBQUMsMEJBQStCLENBQUM7SUFDakcsSUFBSSxjQUFjLEdBQUcsQ0FBQyxFQUFFOztjQUNoQixLQUFLLEdBQUc7WUFDVixDQUFDLGNBQWMsZUFBaUMsQ0FBQztRQUNyRCxPQUFPLFlBQVksQ0FBQyxNQUFNLEdBQUcsS0FBSyxFQUFFO1lBQ2xDLHVFQUF1RTtZQUN2RSx1RUFBdUU7WUFDdkUscUVBQXFFO1lBQ3JFLFlBQVksQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLGFBQWEsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUM7U0FDOUM7S0FDRjtJQUNELFlBQVksQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLGFBQWEsRUFBRSxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7QUFDbkQsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7O0FBZ0JELFNBQVMsc0JBQXNCLENBQzNCLEtBQW9CLEVBQUUsWUFBa0MsRUFBRSxJQUFZLEVBQ3RFLEtBQThCLEVBQUUsbUJBQTJCO0lBQzdELElBQUksS0FBSyxLQUFLLElBQUksRUFBRTtRQUNsQixLQUFLLEdBQUcsWUFBWSxDQUFDLE1BQU0sQ0FBQztRQUM1QixZQUFZLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDcEMsWUFBWSxDQUFDLEtBQUsscUJBQXVDLENBQUMsR0FBRyxJQUFJLENBQUM7S0FDbkU7SUFDRCxZQUFZLENBQUMsS0FBSyxzQkFBd0MsQ0FBQyxHQUFHLEtBQUssQ0FBQztJQUNwRSxZQUFZLENBQUMsS0FBSywrQkFBaUQsQ0FBQyxHQUFHLG1CQUFtQixDQUFDO0lBQzNGLE9BQU8sS0FBSyxDQUFDO0FBQ2YsQ0FBQzs7Ozs7O0FBRUQsU0FBUyx5QkFBeUIsQ0FBQyxPQUF1QixFQUFFLGNBQXNCOztVQUMxRSxJQUFJLEdBQUcsT0FBTyxtQ0FBd0M7O1VBQ3RELEtBQUssR0FBRyxjQUFjLGVBQW9DO0lBQ2hFLElBQUksS0FBSyxJQUFJLElBQUksQ0FBQyxNQUFNO1FBQ3BCLElBQUksQ0FBQyxLQUFLLHNDQUEyRCxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUU7UUFDakYsTUFBTSxJQUFJLEtBQUssQ0FBQyxtRUFBbUUsQ0FBQyxDQUFDO0tBQ3RGO0FBQ0gsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuKiBAbGljZW5zZVxuKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbipcbiogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuKi9cbmltcG9ydCB7U3R5bGVTYW5pdGl6ZUZufSBmcm9tICcuLi8uLi9zYW5pdGl6YXRpb24vc3R5bGVfc2FuaXRpemVyJztcbmltcG9ydCB7RU1QVFlfQVJSQVksIEVNUFRZX09CSn0gZnJvbSAnLi4vZW1wdHknO1xuaW1wb3J0IHtBdHRyaWJ1dGVNYXJrZXIsIFRBdHRyaWJ1dGVzfSBmcm9tICcuLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtCaW5kaW5nU3RvcmUsIEJpbmRpbmdUeXBlLCBQbGF5ZXIsIFBsYXllckJ1aWxkZXIsIFBsYXllckZhY3RvcnksIFBsYXllckluZGV4fSBmcm9tICcuLi9pbnRlcmZhY2VzL3BsYXllcic7XG5pbXBvcnQge1JFbGVtZW50LCBSZW5kZXJlcjMsIFJlbmRlcmVyU3R5bGVGbGFnczMsIGlzUHJvY2VkdXJhbFJlbmRlcmVyfSBmcm9tICcuLi9pbnRlcmZhY2VzL3JlbmRlcmVyJztcbmltcG9ydCB7RGlyZWN0aXZlT3duZXJBbmRQbGF5ZXJCdWlsZGVySW5kZXgsIERpcmVjdGl2ZVJlZ2lzdHJ5VmFsdWVzSW5kZXgsIEluaXRpYWxTdHlsaW5nVmFsdWVzLCBJbml0aWFsU3R5bGluZ1ZhbHVlc0luZGV4LCBNYXBCYXNlZE9mZnNldFZhbHVlcywgTWFwQmFzZWRPZmZzZXRWYWx1ZXNJbmRleCwgU2luZ2xlUHJvcE9mZnNldFZhbHVlcywgU2luZ2xlUHJvcE9mZnNldFZhbHVlc0luZGV4LCBTdHlsaW5nQ29udGV4dCwgU3R5bGluZ0ZsYWdzLCBTdHlsaW5nSW5kZXh9IGZyb20gJy4uL2ludGVyZmFjZXMvc3R5bGluZyc7XG5pbXBvcnQge0xWaWV3LCBSb290Q29udGV4dH0gZnJvbSAnLi4vaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7Tk9fQ0hBTkdFfSBmcm9tICcuLi90b2tlbnMnO1xuaW1wb3J0IHtnZXRSb290Q29udGV4dH0gZnJvbSAnLi4vdXRpbC92aWV3X3RyYXZlcnNhbF91dGlscyc7XG5cbmltcG9ydCB7YWxsb3dGbHVzaCBhcyBhbGxvd0hvc3RJbnN0cnVjdGlvbnNRdWV1ZUZsdXNoLCBmbHVzaFF1ZXVlIGFzIGZsdXNoSG9zdEluc3RydWN0aW9uc1F1ZXVlfSBmcm9tICcuL2hvc3RfaW5zdHJ1Y3Rpb25zX3F1ZXVlJztcbmltcG9ydCB7Qm91bmRQbGF5ZXJGYWN0b3J5fSBmcm9tICcuL3BsYXllcl9mYWN0b3J5JztcbmltcG9ydCB7YWRkUGxheWVySW50ZXJuYWwsIGFsbG9jUGxheWVyQ29udGV4dCwgYWxsb2NhdGVPclVwZGF0ZURpcmVjdGl2ZUludG9Db250ZXh0LCBjcmVhdGVFbXB0eVN0eWxpbmdDb250ZXh0LCBnZXRQbGF5ZXJDb250ZXh0fSBmcm9tICcuL3V0aWwnO1xuXG5cbi8qKlxuICogVGhpcyBmaWxlIGluY2x1ZGVzIHRoZSBjb2RlIHRvIHBvd2VyIGFsbCBzdHlsaW5nLWJpbmRpbmcgb3BlcmF0aW9ucyBpbiBBbmd1bGFyLlxuICpcbiAqIFRoZXNlIGluY2x1ZGU6XG4gKiBbc3R5bGVdPVwibXlTdHlsZU9ialwiXG4gKiBbY2xhc3NdPVwibXlDbGFzc09ialwiXG4gKiBbc3R5bGUucHJvcF09XCJteVByb3BWYWx1ZVwiXG4gKiBbY2xhc3MubmFtZV09XCJteUNsYXNzVmFsdWVcIlxuICpcbiAqIEl0IGFsc28gaW5jbHVkZXMgY29kZSB0aGF0IHdpbGwgYWxsb3cgc3R5bGUgYmluZGluZyBjb2RlIHRvIG9wZXJhdGUgd2l0aGluIGhvc3RcbiAqIGJpbmRpbmdzIGZvciBjb21wb25lbnRzL2RpcmVjdGl2ZXMuXG4gKlxuICogVGhlcmUgYXJlIG1hbnkgZGlmZmVyZW50IHdheXMgaW4gd2hpY2ggdGhlc2UgZnVuY3Rpb25zIGJlbG93IGFyZSBjYWxsZWQuIFBsZWFzZSBzZWVcbiAqIGByZW5kZXIzL2ludGVyZmFjZXMvc3R5bGluZy50c2AgdG8gZ2V0IGEgYmV0dGVyIGlkZWEgb2YgaG93IHRoZSBzdHlsaW5nIGFsZ29yaXRobSB3b3Jrcy5cbiAqL1xuXG5cblxuLyoqXG4gKiBDcmVhdGVzIGEgbmV3IFN0eWxpbmdDb250ZXh0IGFuIGZpbGxzIGl0IHdpdGggdGhlIHByb3ZpZGVkIHN0YXRpYyBzdHlsaW5nIGF0dHJpYnV0ZSB2YWx1ZXMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbml0aWFsaXplU3RhdGljQ29udGV4dChcbiAgICBhdHRyczogVEF0dHJpYnV0ZXMsIHN0eWxpbmdTdGFydEluZGV4OiBudW1iZXIsIGRpcmVjdGl2ZUluZGV4OiBudW1iZXIgPSAwKTogU3R5bGluZ0NvbnRleHQge1xuICBjb25zdCBjb250ZXh0ID0gY3JlYXRlRW1wdHlTdHlsaW5nQ29udGV4dCgpO1xuICBwYXRjaENvbnRleHRXaXRoU3RhdGljQXR0cnMoY29udGV4dCwgYXR0cnMsIHN0eWxpbmdTdGFydEluZGV4LCBkaXJlY3RpdmVJbmRleCk7XG4gIHJldHVybiBjb250ZXh0O1xufVxuXG4vKipcbiAqIERlc2lnbmVkIHRvIHVwZGF0ZSBhbiBleGlzdGluZyBzdHlsaW5nIGNvbnRleHQgd2l0aCBuZXcgc3RhdGljIHN0eWxpbmdcbiAqIGRhdGEgKGNsYXNzZXMgYW5kIHN0eWxlcykuXG4gKlxuICogQHBhcmFtIGNvbnRleHQgdGhlIGV4aXN0aW5nIHN0eWxpbmcgY29udGV4dFxuICogQHBhcmFtIGF0dHJzIGFuIGFycmF5IG9mIG5ldyBzdGF0aWMgc3R5bGluZyBhdHRyaWJ1dGVzIHRoYXQgd2lsbCBiZVxuICogICAgICAgICAgICAgIGFzc2lnbmVkIHRvIHRoZSBjb250ZXh0XG4gKiBAcGFyYW0gYXR0cnNTdHlsaW5nU3RhcnRJbmRleCB3aGF0IGluZGV4IHRvIHN0YXJ0IGl0ZXJhdGluZyB3aXRoaW4gdGhlXG4gKiAgICAgICAgICAgICAgcHJvdmlkZWQgYGF0dHJzYCBhcnJheSB0byBzdGFydCByZWFkaW5nIHN0eWxlIGFuZCBjbGFzcyB2YWx1ZXNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHBhdGNoQ29udGV4dFdpdGhTdGF0aWNBdHRycyhcbiAgICBjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgYXR0cnM6IFRBdHRyaWJ1dGVzLCBhdHRyc1N0eWxpbmdTdGFydEluZGV4OiBudW1iZXIsXG4gICAgZGlyZWN0aXZlSW5kZXg6IG51bWJlcik6IHZvaWQge1xuICAvLyB0aGlzIG1lYW5zIHRoZSBjb250ZXh0IGhhcyBhbHJlYWR5IGJlZW4gc2V0IGFuZCBpbnN0YW50aWF0ZWRcbiAgaWYgKGNvbnRleHRbU3R5bGluZ0luZGV4Lk1hc3RlckZsYWdQb3NpdGlvbl0gJiBTdHlsaW5nRmxhZ3MuQmluZGluZ0FsbG9jYXRpb25Mb2NrZWQpIHJldHVybjtcblxuICBhbGxvY2F0ZU9yVXBkYXRlRGlyZWN0aXZlSW50b0NvbnRleHQoY29udGV4dCwgZGlyZWN0aXZlSW5kZXgpO1xuXG4gIGxldCBpbml0aWFsQ2xhc3NlczogSW5pdGlhbFN0eWxpbmdWYWx1ZXN8bnVsbCA9IG51bGw7XG4gIGxldCBpbml0aWFsU3R5bGVzOiBJbml0aWFsU3R5bGluZ1ZhbHVlc3xudWxsID0gbnVsbDtcbiAgbGV0IG1vZGUgPSAtMTtcbiAgZm9yIChsZXQgaSA9IGF0dHJzU3R5bGluZ1N0YXJ0SW5kZXg7IGkgPCBhdHRycy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IGF0dHIgPSBhdHRyc1tpXTtcbiAgICBpZiAodHlwZW9mIGF0dHIgPT0gJ251bWJlcicpIHtcbiAgICAgIG1vZGUgPSBhdHRyO1xuICAgIH0gZWxzZSBpZiAobW9kZSA9PSBBdHRyaWJ1dGVNYXJrZXIuQ2xhc3Nlcykge1xuICAgICAgaW5pdGlhbENsYXNzZXMgPSBpbml0aWFsQ2xhc3NlcyB8fCBjb250ZXh0W1N0eWxpbmdJbmRleC5Jbml0aWFsQ2xhc3NWYWx1ZXNQb3NpdGlvbl07XG4gICAgICBwYXRjaEluaXRpYWxTdHlsaW5nVmFsdWUoaW5pdGlhbENsYXNzZXMsIGF0dHIsIHRydWUsIGRpcmVjdGl2ZUluZGV4KTtcbiAgICB9IGVsc2UgaWYgKG1vZGUgPT0gQXR0cmlidXRlTWFya2VyLlN0eWxlcykge1xuICAgICAgaW5pdGlhbFN0eWxlcyA9IGluaXRpYWxTdHlsZXMgfHwgY29udGV4dFtTdHlsaW5nSW5kZXguSW5pdGlhbFN0eWxlVmFsdWVzUG9zaXRpb25dO1xuICAgICAgcGF0Y2hJbml0aWFsU3R5bGluZ1ZhbHVlKGluaXRpYWxTdHlsZXMsIGF0dHIsIGF0dHJzWysraV0sIGRpcmVjdGl2ZUluZGV4KTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBEZXNpZ25lZCB0byBhZGQgYSBzdHlsZSBvciBjbGFzcyB2YWx1ZSBpbnRvIHRoZSBleGlzdGluZyBzZXQgb2YgaW5pdGlhbCBzdHlsZXMuXG4gKlxuICogVGhlIGZ1bmN0aW9uIHdpbGwgc2VhcmNoIGFuZCBmaWd1cmUgb3V0IGlmIGEgc3R5bGUvY2xhc3MgdmFsdWUgaXMgYWxyZWFkeSBwcmVzZW50XG4gKiB3aXRoaW4gdGhlIHByb3ZpZGVkIGluaXRpYWwgc3R5bGluZyBhcnJheS4gSWYgYW5kIHdoZW4gYSBzdHlsZS9jbGFzcyB2YWx1ZSBpc1xuICogcHJlc2VudCAoYWxsb2NhdGVkKSB0aGVuIHRoZSBjb2RlIGJlbG93IHdpbGwgc2V0IHRoZSBuZXcgdmFsdWUgZGVwZW5kaW5nIG9uIHRoZVxuICogZm9sbG93aW5nIGNhc2VzOlxuICpcbiAqICAxKSBpZiB0aGUgZXhpc3RpbmcgdmFsdWUgaXMgZmFsc3kgKHRoaXMgaGFwcGVucyBiZWNhdXNlIGEgYFtjbGFzcy5wcm9wXWAgb3JcbiAqICAgICBgW3N0eWxlLnByb3BdYCBiaW5kaW5nIHdhcyBzZXQsIGJ1dCB0aGVyZSB3YXNuJ3QgYSBtYXRjaGluZyBzdGF0aWMgc3R5bGVcbiAqICAgICBvciBjbGFzcyBwcmVzZW50IG9uIHRoZSBjb250ZXh0KVxuICogIDIpIGlmIHRoZSB2YWx1ZSB3YXMgc2V0IGFscmVhZHkgYnkgdGhlIHRlbXBsYXRlLCBjb21wb25lbnQgb3IgZGlyZWN0aXZlLCBidXQgdGhlXG4gKiAgICAgbmV3IHZhbHVlIGlzIHNldCBvbiBhIGhpZ2hlciBsZXZlbCAoaS5lLiBhIHN1YiBjb21wb25lbnQgd2hpY2ggZXh0ZW5kcyBhIHBhcmVudFxuICogICAgIGNvbXBvbmVudCBzZXRzIGl0cyB2YWx1ZSBhZnRlciB0aGUgcGFyZW50IGhhcyBhbHJlYWR5IHNldCB0aGUgc2FtZSBvbmUpXG4gKiAgMykgaWYgdGhlIHNhbWUgZGlyZWN0aXZlIHByb3ZpZGVzIGEgbmV3IHNldCBvZiBzdHlsaW5nIHZhbHVlcyB0byBzZXRcbiAqXG4gKiBAcGFyYW0gaW5pdGlhbFN0eWxpbmcgdGhlIGluaXRpYWwgc3R5bGluZyBhcnJheSB3aGVyZSB0aGUgbmV3IHN0eWxpbmcgZW50cnkgd2lsbCBiZSBhZGRlZCB0b1xuICogQHBhcmFtIHByb3AgdGhlIHByb3BlcnR5IHZhbHVlIG9mIHRoZSBuZXcgZW50cnkgKGUuZy4gYHdpZHRoYCAoc3R5bGVzKSBvciBgZm9vYCAoY2xhc3NlcykpXG4gKiBAcGFyYW0gdmFsdWUgdGhlIHN0eWxpbmcgdmFsdWUgb2YgdGhlIG5ldyBlbnRyeSAoZS5nLiBgYWJzb2x1dGVgIChzdHlsZXMpIG9yIGB0cnVlYCAoY2xhc3NlcykpXG4gKiBAcGFyYW0gZGlyZWN0aXZlT3duZXJJbmRleCB0aGUgZGlyZWN0aXZlIG93bmVyIGluZGV4IHZhbHVlIG9mIHRoZSBzdHlsaW5nIHNvdXJjZSByZXNwb25zaWJsZVxuICogICAgICAgIGZvciB0aGVzZSBzdHlsZXMgKHNlZSBgaW50ZXJmYWNlcy9zdHlsaW5nLnRzI2RpcmVjdGl2ZXNgIGZvciBtb3JlIGluZm8pXG4gKi9cbmZ1bmN0aW9uIHBhdGNoSW5pdGlhbFN0eWxpbmdWYWx1ZShcbiAgICBpbml0aWFsU3R5bGluZzogSW5pdGlhbFN0eWxpbmdWYWx1ZXMsIHByb3A6IHN0cmluZywgdmFsdWU6IGFueSxcbiAgICBkaXJlY3RpdmVPd25lckluZGV4OiBudW1iZXIpOiB2b2lkIHtcbiAgZm9yIChsZXQgaSA9IEluaXRpYWxTdHlsaW5nVmFsdWVzSW5kZXguS2V5VmFsdWVTdGFydFBvc2l0aW9uOyBpIDwgaW5pdGlhbFN0eWxpbmcubGVuZ3RoO1xuICAgICAgIGkgKz0gSW5pdGlhbFN0eWxpbmdWYWx1ZXNJbmRleC5TaXplKSB7XG4gICAgY29uc3Qga2V5ID0gaW5pdGlhbFN0eWxpbmdbaSArIEluaXRpYWxTdHlsaW5nVmFsdWVzSW5kZXguUHJvcE9mZnNldF07XG4gICAgaWYgKGtleSA9PT0gcHJvcCkge1xuICAgICAgY29uc3QgZXhpc3RpbmdWYWx1ZSA9XG4gICAgICAgICAgaW5pdGlhbFN0eWxpbmdbaSArIEluaXRpYWxTdHlsaW5nVmFsdWVzSW5kZXguVmFsdWVPZmZzZXRdIGFzIHN0cmluZyB8IG51bGwgfCBib29sZWFuO1xuICAgICAgY29uc3QgZXhpc3RpbmdPd25lciA9XG4gICAgICAgICAgaW5pdGlhbFN0eWxpbmdbaSArIEluaXRpYWxTdHlsaW5nVmFsdWVzSW5kZXguRGlyZWN0aXZlT3duZXJPZmZzZXRdIGFzIG51bWJlcjtcbiAgICAgIGlmIChhbGxvd1ZhbHVlQ2hhbmdlKGV4aXN0aW5nVmFsdWUsIHZhbHVlLCBleGlzdGluZ093bmVyLCBkaXJlY3RpdmVPd25lckluZGV4KSkge1xuICAgICAgICBhZGRPclVwZGF0ZVN0YXRpY1N0eWxlKGksIGluaXRpYWxTdHlsaW5nLCBwcm9wLCB2YWx1ZSwgZGlyZWN0aXZlT3duZXJJbmRleCk7XG4gICAgICB9XG4gICAgICByZXR1cm47XG4gICAgfVxuICB9XG5cbiAgLy8gV2UgZGlkIG5vdCBmaW5kIGV4aXN0aW5nIGtleSwgYWRkIGEgbmV3IG9uZS5cbiAgYWRkT3JVcGRhdGVTdGF0aWNTdHlsZShudWxsLCBpbml0aWFsU3R5bGluZywgcHJvcCwgdmFsdWUsIGRpcmVjdGl2ZU93bmVySW5kZXgpO1xufVxuXG4vKipcbiAqIFJ1bnMgdGhyb3VnaCB0aGUgaW5pdGlhbCBjbGFzcyB2YWx1ZXMgcHJlc2VudCBpbiB0aGUgcHJvdmlkZWRcbiAqIGNvbnRleHQgYW5kIHJlbmRlcnMgdGhlbSB2aWEgdGhlIHByb3ZpZGVkIHJlbmRlcmVyIG9uIHRoZSBlbGVtZW50LlxuICpcbiAqIEBwYXJhbSBlbGVtZW50IHRoZSBlbGVtZW50IHRoZSBzdHlsaW5nIHdpbGwgYmUgYXBwbGllZCB0b1xuICogQHBhcmFtIGNvbnRleHQgdGhlIHNvdXJjZSBzdHlsaW5nIGNvbnRleHQgd2hpY2ggY29udGFpbnMgdGhlIGluaXRpYWwgY2xhc3MgdmFsdWVzXG4gKiBAcGFyYW0gcmVuZGVyZXIgdGhlIHJlbmRlcmVyIGluc3RhbmNlIHRoYXQgd2lsbCBiZSB1c2VkIHRvIGFwcGx5IHRoZSBjbGFzc1xuICogQHJldHVybnMgdGhlIGluZGV4IHRoYXQgdGhlIGNsYXNzZXMgd2VyZSBhcHBsaWVkIHVwIHVudGlsXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZW5kZXJJbml0aWFsQ2xhc3NlcyhcbiAgICBlbGVtZW50OiBSRWxlbWVudCwgY29udGV4dDogU3R5bGluZ0NvbnRleHQsIHJlbmRlcmVyOiBSZW5kZXJlcjMsIHN0YXJ0SW5kZXg/OiBudW1iZXIpOiBudW1iZXIge1xuICBjb25zdCBpbml0aWFsQ2xhc3NlcyA9IGNvbnRleHRbU3R5bGluZ0luZGV4LkluaXRpYWxDbGFzc1ZhbHVlc1Bvc2l0aW9uXTtcbiAgbGV0IGkgPSBzdGFydEluZGV4IHx8IEluaXRpYWxTdHlsaW5nVmFsdWVzSW5kZXguS2V5VmFsdWVTdGFydFBvc2l0aW9uO1xuICB3aGlsZSAoaSA8IGluaXRpYWxDbGFzc2VzLmxlbmd0aCkge1xuICAgIGNvbnN0IHZhbHVlID0gaW5pdGlhbENsYXNzZXNbaSArIEluaXRpYWxTdHlsaW5nVmFsdWVzSW5kZXguVmFsdWVPZmZzZXRdO1xuICAgIGlmICh2YWx1ZSkge1xuICAgICAgc2V0Q2xhc3MoXG4gICAgICAgICAgZWxlbWVudCwgaW5pdGlhbENsYXNzZXNbaSArIEluaXRpYWxTdHlsaW5nVmFsdWVzSW5kZXguUHJvcE9mZnNldF0gYXMgc3RyaW5nLCB0cnVlLFxuICAgICAgICAgIHJlbmRlcmVyLCBudWxsKTtcbiAgICB9XG4gICAgaSArPSBJbml0aWFsU3R5bGluZ1ZhbHVlc0luZGV4LlNpemU7XG4gIH1cbiAgcmV0dXJuIGk7XG59XG5cbi8qKlxuICogUnVucyB0aHJvdWdoIHRoZSBpbml0aWFsIHN0eWxlcyB2YWx1ZXMgcHJlc2VudCBpbiB0aGUgcHJvdmlkZWRcbiAqIGNvbnRleHQgYW5kIHJlbmRlcnMgdGhlbSB2aWEgdGhlIHByb3ZpZGVkIHJlbmRlcmVyIG9uIHRoZSBlbGVtZW50LlxuICpcbiAqIEBwYXJhbSBlbGVtZW50IHRoZSBlbGVtZW50IHRoZSBzdHlsaW5nIHdpbGwgYmUgYXBwbGllZCB0b1xuICogQHBhcmFtIGNvbnRleHQgdGhlIHNvdXJjZSBzdHlsaW5nIGNvbnRleHQgd2hpY2ggY29udGFpbnMgdGhlIGluaXRpYWwgY2xhc3MgdmFsdWVzXG4gKiBAcGFyYW0gcmVuZGVyZXIgdGhlIHJlbmRlcmVyIGluc3RhbmNlIHRoYXQgd2lsbCBiZSB1c2VkIHRvIGFwcGx5IHRoZSBjbGFzc1xuICogQHJldHVybnMgdGhlIGluZGV4IHRoYXQgdGhlIHN0eWxlcyB3ZXJlIGFwcGxpZWQgdXAgdW50aWxcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlbmRlckluaXRpYWxTdHlsZXMoXG4gICAgZWxlbWVudDogUkVsZW1lbnQsIGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCByZW5kZXJlcjogUmVuZGVyZXIzLCBzdGFydEluZGV4PzogbnVtYmVyKSB7XG4gIGNvbnN0IGluaXRpYWxTdHlsZXMgPSBjb250ZXh0W1N0eWxpbmdJbmRleC5Jbml0aWFsU3R5bGVWYWx1ZXNQb3NpdGlvbl07XG4gIGxldCBpID0gc3RhcnRJbmRleCB8fCBJbml0aWFsU3R5bGluZ1ZhbHVlc0luZGV4LktleVZhbHVlU3RhcnRQb3NpdGlvbjtcbiAgd2hpbGUgKGkgPCBpbml0aWFsU3R5bGVzLmxlbmd0aCkge1xuICAgIGNvbnN0IHZhbHVlID0gaW5pdGlhbFN0eWxlc1tpICsgSW5pdGlhbFN0eWxpbmdWYWx1ZXNJbmRleC5WYWx1ZU9mZnNldF07XG4gICAgaWYgKHZhbHVlKSB7XG4gICAgICBzZXRTdHlsZShcbiAgICAgICAgICBlbGVtZW50LCBpbml0aWFsU3R5bGVzW2kgKyBJbml0aWFsU3R5bGluZ1ZhbHVlc0luZGV4LlByb3BPZmZzZXRdIGFzIHN0cmluZyxcbiAgICAgICAgICB2YWx1ZSBhcyBzdHJpbmcsIHJlbmRlcmVyLCBudWxsKTtcbiAgICB9XG4gICAgaSArPSBJbml0aWFsU3R5bGluZ1ZhbHVlc0luZGV4LlNpemU7XG4gIH1cbiAgcmV0dXJuIGk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhbGxvd05ld0JpbmRpbmdzRm9yU3R5bGluZ0NvbnRleHQoY29udGV4dDogU3R5bGluZ0NvbnRleHQpOiBib29sZWFuIHtcbiAgcmV0dXJuIChjb250ZXh0W1N0eWxpbmdJbmRleC5NYXN0ZXJGbGFnUG9zaXRpb25dICYgU3R5bGluZ0ZsYWdzLkJpbmRpbmdBbGxvY2F0aW9uTG9ja2VkKSA9PT0gMDtcbn1cblxuLyoqXG4gKiBBZGRzIGluIG5ldyBiaW5kaW5nIHZhbHVlcyB0byBhIHN0eWxpbmcgY29udGV4dC5cbiAqXG4gKiBJZiBhIGRpcmVjdGl2ZSB2YWx1ZSBpcyBwcm92aWRlZCB0aGVuIGFsbCBwcm92aWRlZCBjbGFzcy9zdHlsZSBiaW5kaW5nIG5hbWVzIHdpbGxcbiAqIHJlZmVyZW5jZSB0aGUgcHJvdmlkZWQgZGlyZWN0aXZlLlxuICpcbiAqIEBwYXJhbSBjb250ZXh0IHRoZSBleGlzdGluZyBzdHlsaW5nIGNvbnRleHRcbiAqIEBwYXJhbSBjbGFzc0JpbmRpbmdOYW1lcyBhbiBhcnJheSBvZiBjbGFzcyBiaW5kaW5nIG5hbWVzIHRoYXQgd2lsbCBiZSBhZGRlZCB0byB0aGUgY29udGV4dFxuICogQHBhcmFtIHN0eWxlQmluZGluZ05hbWVzIGFuIGFycmF5IG9mIHN0eWxlIGJpbmRpbmcgbmFtZXMgdGhhdCB3aWxsIGJlIGFkZGVkIHRvIHRoZSBjb250ZXh0XG4gKiBAcGFyYW0gc3R5bGVTYW5pdGl6ZXIgYW4gb3B0aW9uYWwgc2FuaXRpemVyIHRoYXQgaGFuZGxlIGFsbCBzYW5pdGl6YXRpb24gb24gZm9yIGVhY2ggb2ZcbiAqICAgIHRoZSBiaW5kaW5ncyBhZGRlZCB0byB0aGUgY29udGV4dC4gTm90ZSB0aGF0IGlmIGEgZGlyZWN0aXZlIGlzIHByb3ZpZGVkIHRoZW4gdGhlIHNhbml0aXplclxuICogICAgaW5zdGFuY2Ugd2lsbCBvbmx5IGJlIGFjdGl2ZSBpZiBhbmQgd2hlbiB0aGUgZGlyZWN0aXZlIHVwZGF0ZXMgdGhlIGJpbmRpbmdzIHRoYXQgaXQgb3ducy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHVwZGF0ZUNvbnRleHRXaXRoQmluZGluZ3MoXG4gICAgY29udGV4dDogU3R5bGluZ0NvbnRleHQsIGRpcmVjdGl2ZUluZGV4OiBudW1iZXIsIGNsYXNzQmluZGluZ05hbWVzPzogc3RyaW5nW10gfCBudWxsLFxuICAgIHN0eWxlQmluZGluZ05hbWVzPzogc3RyaW5nW10gfCBudWxsLCBzdHlsZVNhbml0aXplcj86IFN0eWxlU2FuaXRpemVGbiB8IG51bGwpIHtcbiAgaWYgKGNvbnRleHRbU3R5bGluZ0luZGV4Lk1hc3RlckZsYWdQb3NpdGlvbl0gJiBTdHlsaW5nRmxhZ3MuQmluZGluZ0FsbG9jYXRpb25Mb2NrZWQpIHJldHVybjtcblxuICAvLyB0aGlzIG1lYW5zIHRoZSBjb250ZXh0IGhhcyBhbHJlYWR5IGJlZW4gcGF0Y2hlZCB3aXRoIHRoZSBkaXJlY3RpdmUncyBiaW5kaW5nc1xuICBjb25zdCBpc05ld0RpcmVjdGl2ZSA9XG4gICAgICBmaW5kT3JQYXRjaERpcmVjdGl2ZUludG9SZWdpc3RyeShjb250ZXh0LCBkaXJlY3RpdmVJbmRleCwgZmFsc2UsIHN0eWxlU2FuaXRpemVyKTtcbiAgaWYgKCFpc05ld0RpcmVjdGl2ZSkge1xuICAgIC8vIHRoaXMgbWVhbnMgdGhlIGRpcmVjdGl2ZSBoYXMgYWxyZWFkeSBiZWVuIHBhdGNoZWQgaW4gLi4uIE5vIHBvaW50IGluIGRvaW5nIGFueXRoaW5nXG4gICAgcmV0dXJuO1xuICB9XG5cbiAgaWYgKHN0eWxlQmluZGluZ05hbWVzKSB7XG4gICAgc3R5bGVCaW5kaW5nTmFtZXMgPSBoeXBoZW5hdGVFbnRyaWVzKHN0eWxlQmluZGluZ05hbWVzKTtcbiAgfVxuXG4gIC8vIHRoZXJlIGFyZSBhbG90IG9mIHZhcmlhYmxlcyBiZWluZyB1c2VkIGJlbG93IHRvIHRyYWNrIHdoZXJlIGluIHRoZSBjb250ZXh0IHRoZSBuZXdcbiAgLy8gYmluZGluZyB2YWx1ZXMgd2lsbCBiZSBwbGFjZWQuIEJlY2F1c2UgdGhlIGNvbnRleHQgY29uc2lzdHMgb2YgbXVsdGlwbGUgdHlwZXMgb2ZcbiAgLy8gZW50cmllcyAoc2luZ2xlIGNsYXNzZXMvc3R5bGVzIGFuZCBtdWx0aSBjbGFzc2VzL3N0eWxlcykgYWxvdCBvZiB0aGUgaW5kZXggcG9zaXRpb25zXG4gIC8vIG5lZWQgdG8gYmUgY29tcHV0ZWQgYWhlYWQgb2YgdGltZSBhbmQgdGhlIGNvbnRleHQgbmVlZHMgdG8gYmUgZXh0ZW5kZWQgYmVmb3JlIHRoZSB2YWx1ZXNcbiAgLy8gYXJlIGluc2VydGVkIGluLlxuICBjb25zdCBzaW5nbGVQcm9wT2Zmc2V0VmFsdWVzID0gY29udGV4dFtTdHlsaW5nSW5kZXguU2luZ2xlUHJvcE9mZnNldFBvc2l0aW9uc107XG4gIGNvbnN0IHRvdGFsQ3VycmVudENsYXNzQmluZGluZ3MgPVxuICAgICAgc2luZ2xlUHJvcE9mZnNldFZhbHVlc1tTaW5nbGVQcm9wT2Zmc2V0VmFsdWVzSW5kZXguQ2xhc3Nlc0NvdW50UG9zaXRpb25dO1xuICBjb25zdCB0b3RhbEN1cnJlbnRTdHlsZUJpbmRpbmdzID1cbiAgICAgIHNpbmdsZVByb3BPZmZzZXRWYWx1ZXNbU2luZ2xlUHJvcE9mZnNldFZhbHVlc0luZGV4LlN0eWxlc0NvdW50UG9zaXRpb25dO1xuXG4gIGNvbnN0IGNhY2hlZENsYXNzTWFwVmFsdWVzID0gY29udGV4dFtTdHlsaW5nSW5kZXguQ2FjaGVkTXVsdGlDbGFzc2VzXTtcbiAgY29uc3QgY2FjaGVkU3R5bGVNYXBWYWx1ZXMgPSBjb250ZXh0W1N0eWxpbmdJbmRleC5DYWNoZWRNdWx0aVN0eWxlc107XG5cbiAgY29uc3QgY2xhc3Nlc09mZnNldCA9IHRvdGFsQ3VycmVudENsYXNzQmluZGluZ3MgKiBTdHlsaW5nSW5kZXguU2l6ZTtcbiAgY29uc3Qgc3R5bGVzT2Zmc2V0ID0gdG90YWxDdXJyZW50U3R5bGVCaW5kaW5ncyAqIFN0eWxpbmdJbmRleC5TaXplO1xuXG4gIGNvbnN0IHNpbmdsZVN0eWxlc1N0YXJ0SW5kZXggPSBTdHlsaW5nSW5kZXguU2luZ2xlU3R5bGVzU3RhcnRQb3NpdGlvbjtcbiAgbGV0IHNpbmdsZUNsYXNzZXNTdGFydEluZGV4ID0gc2luZ2xlU3R5bGVzU3RhcnRJbmRleCArIHN0eWxlc09mZnNldDtcbiAgbGV0IG11bHRpU3R5bGVzU3RhcnRJbmRleCA9IHNpbmdsZUNsYXNzZXNTdGFydEluZGV4ICsgY2xhc3Nlc09mZnNldDtcbiAgbGV0IG11bHRpQ2xhc3Nlc1N0YXJ0SW5kZXggPSBtdWx0aVN0eWxlc1N0YXJ0SW5kZXggKyBzdHlsZXNPZmZzZXQ7XG5cbiAgLy8gYmVjYXVzZSB3ZSdyZSBpbnNlcnRpbmcgbW9yZSBiaW5kaW5ncyBpbnRvIHRoZSBjb250ZXh0LCB0aGlzIG1lYW5zIHRoYXQgdGhlXG4gIC8vIGJpbmRpbmcgdmFsdWVzIG5lZWQgdG8gYmUgcmVmZXJlbmNlZCB0aGUgc2luZ2xlUHJvcE9mZnNldFZhbHVlcyBhcnJheSBzbyB0aGF0XG4gIC8vIHRoZSB0ZW1wbGF0ZS9kaXJlY3RpdmUgY2FuIGVhc2lseSBmaW5kIHRoZW0gaW5zaWRlIG9mIHRoZSBgZWxlbWVudFN0eWxlUHJvcGBcbiAgLy8gYW5kIHRoZSBgZWxlbWVudENsYXNzUHJvcGAgZnVuY3Rpb25zIHdpdGhvdXQgaXRlcmF0aW5nIHRocm91Z2ggdGhlIGVudGlyZSBjb250ZXh0LlxuICAvLyBUaGUgZmlyc3Qgc3RlcCB0byBzZXR0aW5nIHVwIHRoZXNlIHJlZmVyZW5jZSBwb2ludHMgaXMgdG8gbWFyayBob3cgbWFueSBiaW5kaW5nc1xuICAvLyBhcmUgYmVpbmcgYWRkZWQuIEV2ZW4gaWYgdGhlc2UgYmluZGluZ3MgYWxyZWFkeSBleGlzdCBpbiB0aGUgY29udGV4dCwgdGhlIGRpcmVjdGl2ZVxuICAvLyBvciB0ZW1wbGF0ZSBjb2RlIHdpbGwgc3RpbGwgY2FsbCB0aGVtIHVua25vd2luZ2x5LiBUaGVyZWZvcmUgdGhlIHRvdGFsIHZhbHVlcyBuZWVkXG4gIC8vIHRvIGJlIHJlZ2lzdGVyZWQgc28gdGhhdCB3ZSBrbm93IGhvdyBtYW55IGJpbmRpbmdzIGFyZSBhc3NpZ25lZCB0byBlYWNoIGRpcmVjdGl2ZS5cbiAgY29uc3QgY3VycmVudFNpbmdsZVByb3BzTGVuZ3RoID0gc2luZ2xlUHJvcE9mZnNldFZhbHVlcy5sZW5ndGg7XG4gIHNpbmdsZVByb3BPZmZzZXRWYWx1ZXMucHVzaChcbiAgICAgIHN0eWxlQmluZGluZ05hbWVzID8gc3R5bGVCaW5kaW5nTmFtZXMubGVuZ3RoIDogMCxcbiAgICAgIGNsYXNzQmluZGluZ05hbWVzID8gY2xhc3NCaW5kaW5nTmFtZXMubGVuZ3RoIDogMCk7XG5cbiAgLy8gdGhlIGNvZGUgYmVsb3cgd2lsbCBjaGVjayB0byBzZWUgaWYgYSBuZXcgc3R5bGUgYmluZGluZyBhbHJlYWR5IGV4aXN0cyBpbiB0aGUgY29udGV4dFxuICAvLyBpZiBzbyB0aGVuIHRoZXJlIGlzIG5vIHBvaW50IGluIGluc2VydGluZyBpdCBpbnRvIHRoZSBjb250ZXh0IGFnYWluLiBXaGV0aGVyIG9yIG5vdCBpdFxuICAvLyBleGlzdHMgdGhlIHN0eWxpbmcgb2Zmc2V0IGNvZGUgd2lsbCBub3cga25vdyBleGFjdGx5IHdoZXJlIGl0IGlzXG4gIGxldCBpbnNlcnRpb25PZmZzZXQgPSAwO1xuICBjb25zdCBmaWx0ZXJlZFN0eWxlQmluZGluZ05hbWVzOiBzdHJpbmdbXSA9IFtdO1xuICBpZiAoc3R5bGVCaW5kaW5nTmFtZXMgJiYgc3R5bGVCaW5kaW5nTmFtZXMubGVuZ3RoKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzdHlsZUJpbmRpbmdOYW1lcy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgbmFtZSA9IHN0eWxlQmluZGluZ05hbWVzW2ldO1xuICAgICAgbGV0IHNpbmdsZVByb3BJbmRleCA9XG4gICAgICAgICAgZ2V0TWF0Y2hpbmdCaW5kaW5nSW5kZXgoY29udGV4dCwgbmFtZSwgc2luZ2xlU3R5bGVzU3RhcnRJbmRleCwgc2luZ2xlQ2xhc3Nlc1N0YXJ0SW5kZXgpO1xuICAgICAgaWYgKHNpbmdsZVByb3BJbmRleCA9PSAtMSkge1xuICAgICAgICBzaW5nbGVQcm9wSW5kZXggPSBzaW5nbGVDbGFzc2VzU3RhcnRJbmRleCArIGluc2VydGlvbk9mZnNldDtcbiAgICAgICAgaW5zZXJ0aW9uT2Zmc2V0ICs9IFN0eWxpbmdJbmRleC5TaXplO1xuICAgICAgICBmaWx0ZXJlZFN0eWxlQmluZGluZ05hbWVzLnB1c2gobmFtZSk7XG4gICAgICB9XG4gICAgICBzaW5nbGVQcm9wT2Zmc2V0VmFsdWVzLnB1c2goc2luZ2xlUHJvcEluZGV4KTtcbiAgICB9XG4gIH1cblxuICAvLyBqdXN0IGxpa2Ugd2l0aCB0aGUgc3R5bGUgYmluZGluZyBsb29wIGFib3ZlLCB0aGUgbmV3IGNsYXNzIGJpbmRpbmdzIGdldCB0aGUgc2FtZSB0cmVhdG1lbnQuLi5cbiAgY29uc3QgZmlsdGVyZWRDbGFzc0JpbmRpbmdOYW1lczogc3RyaW5nW10gPSBbXTtcbiAgaWYgKGNsYXNzQmluZGluZ05hbWVzICYmIGNsYXNzQmluZGluZ05hbWVzLmxlbmd0aCkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY2xhc3NCaW5kaW5nTmFtZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IG5hbWUgPSBjbGFzc0JpbmRpbmdOYW1lc1tpXTtcbiAgICAgIGxldCBzaW5nbGVQcm9wSW5kZXggPVxuICAgICAgICAgIGdldE1hdGNoaW5nQmluZGluZ0luZGV4KGNvbnRleHQsIG5hbWUsIHNpbmdsZUNsYXNzZXNTdGFydEluZGV4LCBtdWx0aVN0eWxlc1N0YXJ0SW5kZXgpO1xuICAgICAgaWYgKHNpbmdsZVByb3BJbmRleCA9PSAtMSkge1xuICAgICAgICBzaW5nbGVQcm9wSW5kZXggPSBtdWx0aVN0eWxlc1N0YXJ0SW5kZXggKyBpbnNlcnRpb25PZmZzZXQ7XG4gICAgICAgIGluc2VydGlvbk9mZnNldCArPSBTdHlsaW5nSW5kZXguU2l6ZTtcbiAgICAgICAgZmlsdGVyZWRDbGFzc0JpbmRpbmdOYW1lcy5wdXNoKG5hbWUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc2luZ2xlUHJvcEluZGV4ICs9IGZpbHRlcmVkU3R5bGVCaW5kaW5nTmFtZXMubGVuZ3RoICogU3R5bGluZ0luZGV4LlNpemU7XG4gICAgICB9XG4gICAgICBzaW5nbGVQcm9wT2Zmc2V0VmFsdWVzLnB1c2goc2luZ2xlUHJvcEluZGV4KTtcbiAgICB9XG4gIH1cblxuICAvLyBiZWNhdXNlIG5ldyBzdHlsZXMgYXJlIGJlaW5nIGluc2VydGVkLCB0aGlzIG1lYW5zIHRoZSBleGlzdGluZyBjb2xsZWN0aW9uIG9mIHN0eWxlIG9mZnNldFxuICAvLyBpbmRleCB2YWx1ZXMgYXJlIGluY29ycmVjdCAodGhleSBwb2ludCB0byB0aGUgd3JvbmcgdmFsdWVzKS4gVGhlIGNvZGUgYmVsb3cgd2lsbCBydW4gdGhyb3VnaFxuICAvLyB0aGUgZW50aXJlIG9mZnNldCBhcnJheSBhbmQgdXBkYXRlIHRoZSBleGlzdGluZyBzZXQgb2YgaW5kZXggdmFsdWVzIHRvIHBvaW50IHRvIHRoZWlyIG5ld1xuICAvLyBsb2NhdGlvbnMgd2hpbGUgdGFraW5nIHRoZSBuZXcgYmluZGluZyB2YWx1ZXMgaW50byBjb25zaWRlcmF0aW9uLlxuICBsZXQgaSA9IFNpbmdsZVByb3BPZmZzZXRWYWx1ZXNJbmRleC5WYWx1ZVN0YXJ0UG9zaXRpb247XG4gIGlmIChmaWx0ZXJlZFN0eWxlQmluZGluZ05hbWVzLmxlbmd0aCkge1xuICAgIHdoaWxlIChpIDwgY3VycmVudFNpbmdsZVByb3BzTGVuZ3RoKSB7XG4gICAgICBjb25zdCB0b3RhbFN0eWxlcyA9XG4gICAgICAgICAgc2luZ2xlUHJvcE9mZnNldFZhbHVlc1tpICsgU2luZ2xlUHJvcE9mZnNldFZhbHVlc0luZGV4LlN0eWxlc0NvdW50UG9zaXRpb25dO1xuICAgICAgY29uc3QgdG90YWxDbGFzc2VzID1cbiAgICAgICAgICBzaW5nbGVQcm9wT2Zmc2V0VmFsdWVzW2kgKyBTaW5nbGVQcm9wT2Zmc2V0VmFsdWVzSW5kZXguQ2xhc3Nlc0NvdW50UG9zaXRpb25dO1xuICAgICAgaWYgKHRvdGFsQ2xhc3Nlcykge1xuICAgICAgICBjb25zdCBzdGFydCA9IGkgKyBTaW5nbGVQcm9wT2Zmc2V0VmFsdWVzSW5kZXguVmFsdWVTdGFydFBvc2l0aW9uICsgdG90YWxTdHlsZXM7XG4gICAgICAgIGZvciAobGV0IGogPSBzdGFydDsgaiA8IHN0YXJ0ICsgdG90YWxDbGFzc2VzOyBqKyspIHtcbiAgICAgICAgICBzaW5nbGVQcm9wT2Zmc2V0VmFsdWVzW2pdICs9IGZpbHRlcmVkU3R5bGVCaW5kaW5nTmFtZXMubGVuZ3RoICogU3R5bGluZ0luZGV4LlNpemU7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgY29uc3QgdG90YWwgPSB0b3RhbFN0eWxlcyArIHRvdGFsQ2xhc3NlcztcbiAgICAgIGkgKz0gU2luZ2xlUHJvcE9mZnNldFZhbHVlc0luZGV4LlZhbHVlU3RhcnRQb3NpdGlvbiArIHRvdGFsO1xuICAgIH1cbiAgfVxuXG4gIGNvbnN0IHRvdGFsTmV3RW50cmllcyA9IGZpbHRlcmVkQ2xhc3NCaW5kaW5nTmFtZXMubGVuZ3RoICsgZmlsdGVyZWRTdHlsZUJpbmRpbmdOYW1lcy5sZW5ndGg7XG5cbiAgLy8gaW4gdGhlIGV2ZW50IHRoYXQgdGhlcmUgYXJlIG5ldyBzdHlsZSB2YWx1ZXMgYmVpbmcgaW5zZXJ0ZWQsIGFsbCBleGlzdGluZyBjbGFzcyBhbmQgc3R5bGVcbiAgLy8gYmluZGluZ3MgbmVlZCB0byBoYXZlIHRoZWlyIHBvaW50ZXIgdmFsdWVzIG9mZnNldHRlZCB3aXRoIHRoZSBuZXcgYW1vdW50IG9mIHNwYWNlIHRoYXQgaXNcbiAgLy8gdXNlZCBmb3IgdGhlIG5ldyBzdHlsZS9jbGFzcyBiaW5kaW5ncy5cbiAgZm9yIChsZXQgaSA9IHNpbmdsZVN0eWxlc1N0YXJ0SW5kZXg7IGkgPCBjb250ZXh0Lmxlbmd0aDsgaSArPSBTdHlsaW5nSW5kZXguU2l6ZSkge1xuICAgIGNvbnN0IGlzTXVsdGlCYXNlZCA9IGkgPj0gbXVsdGlTdHlsZXNTdGFydEluZGV4O1xuICAgIGNvbnN0IGlzQ2xhc3NCYXNlZCA9IGkgPj0gKGlzTXVsdGlCYXNlZCA/IG11bHRpQ2xhc3Nlc1N0YXJ0SW5kZXggOiBzaW5nbGVDbGFzc2VzU3RhcnRJbmRleCk7XG4gICAgY29uc3QgZmxhZyA9IGdldFBvaW50ZXJzKGNvbnRleHQsIGkpO1xuICAgIGNvbnN0IHN0YXRpY0luZGV4ID0gZ2V0SW5pdGlhbEluZGV4KGZsYWcpO1xuICAgIGxldCBzaW5nbGVPck11bHRpSW5kZXggPSBnZXRNdWx0aU9yU2luZ2xlSW5kZXgoZmxhZyk7XG4gICAgaWYgKGlzTXVsdGlCYXNlZCkge1xuICAgICAgc2luZ2xlT3JNdWx0aUluZGV4ICs9XG4gICAgICAgICAgaXNDbGFzc0Jhc2VkID8gKGZpbHRlcmVkU3R5bGVCaW5kaW5nTmFtZXMubGVuZ3RoICogU3R5bGluZ0luZGV4LlNpemUpIDogMDtcbiAgICB9IGVsc2Uge1xuICAgICAgc2luZ2xlT3JNdWx0aUluZGV4ICs9ICh0b3RhbE5ld0VudHJpZXMgKiBTdHlsaW5nSW5kZXguU2l6ZSkgK1xuICAgICAgICAgICgoaXNDbGFzc0Jhc2VkID8gZmlsdGVyZWRTdHlsZUJpbmRpbmdOYW1lcy5sZW5ndGggOiAwKSAqIFN0eWxpbmdJbmRleC5TaXplKTtcbiAgICB9XG4gICAgc2V0RmxhZyhjb250ZXh0LCBpLCBwb2ludGVycyhmbGFnLCBzdGF0aWNJbmRleCwgc2luZ2xlT3JNdWx0aUluZGV4KSk7XG4gIH1cblxuICAvLyB0aGlzIGlzIHdoZXJlIHdlIG1ha2Ugc3BhY2UgaW4gdGhlIGNvbnRleHQgZm9yIHRoZSBuZXcgc3R5bGUgYmluZGluZ3NcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBmaWx0ZXJlZFN0eWxlQmluZGluZ05hbWVzLmxlbmd0aCAqIFN0eWxpbmdJbmRleC5TaXplOyBpKyspIHtcbiAgICBjb250ZXh0LnNwbGljZShtdWx0aUNsYXNzZXNTdGFydEluZGV4LCAwLCBudWxsKTtcbiAgICBjb250ZXh0LnNwbGljZShzaW5nbGVDbGFzc2VzU3RhcnRJbmRleCwgMCwgbnVsbCk7XG4gICAgc2luZ2xlQ2xhc3Nlc1N0YXJ0SW5kZXgrKztcbiAgICBtdWx0aVN0eWxlc1N0YXJ0SW5kZXgrKztcbiAgICBtdWx0aUNsYXNzZXNTdGFydEluZGV4ICs9IDI7ICAvLyBib3RoIHNpbmdsZSArIG11bHRpIHNsb3RzIHdlcmUgaW5zZXJ0ZWRcbiAgfVxuXG4gIC8vIHRoaXMgaXMgd2hlcmUgd2UgbWFrZSBzcGFjZSBpbiB0aGUgY29udGV4dCBmb3IgdGhlIG5ldyBjbGFzcyBiaW5kaW5nc1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGZpbHRlcmVkQ2xhc3NCaW5kaW5nTmFtZXMubGVuZ3RoICogU3R5bGluZ0luZGV4LlNpemU7IGkrKykge1xuICAgIGNvbnRleHQuc3BsaWNlKG11bHRpU3R5bGVzU3RhcnRJbmRleCwgMCwgbnVsbCk7XG4gICAgY29udGV4dC5wdXNoKG51bGwpO1xuICAgIG11bHRpU3R5bGVzU3RhcnRJbmRleCsrO1xuICAgIG11bHRpQ2xhc3Nlc1N0YXJ0SW5kZXgrKztcbiAgfVxuXG4gIGNvbnN0IGluaXRpYWxDbGFzc2VzID0gY29udGV4dFtTdHlsaW5nSW5kZXguSW5pdGlhbENsYXNzVmFsdWVzUG9zaXRpb25dO1xuICBjb25zdCBpbml0aWFsU3R5bGVzID0gY29udGV4dFtTdHlsaW5nSW5kZXguSW5pdGlhbFN0eWxlVmFsdWVzUG9zaXRpb25dO1xuXG4gIC8vIHRoZSBjb2RlIGJlbG93IHdpbGwgaW5zZXJ0IGVhY2ggbmV3IGVudHJ5IGludG8gdGhlIGNvbnRleHQgYW5kIGFzc2lnbiB0aGUgYXBwcm9wcmlhdGVcbiAgLy8gZmxhZ3MgYW5kIGluZGV4IHZhbHVlcyB0byB0aGVtLiBJdCdzIGltcG9ydGFudCB0aGlzIHJ1bnMgYXQgdGhlIGVuZCBvZiB0aGlzIGZ1bmN0aW9uXG4gIC8vIGJlY2F1c2UgdGhlIGNvbnRleHQsIHByb3BlcnR5IG9mZnNldCBhbmQgaW5kZXggdmFsdWVzIGhhdmUgYWxsIGJlZW4gY29tcHV0ZWQganVzdCBiZWZvcmUuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgdG90YWxOZXdFbnRyaWVzOyBpKyspIHtcbiAgICBjb25zdCBlbnRyeUlzQ2xhc3NCYXNlZCA9IGkgPj0gZmlsdGVyZWRTdHlsZUJpbmRpbmdOYW1lcy5sZW5ndGg7XG4gICAgY29uc3QgYWRqdXN0ZWRJbmRleCA9IGVudHJ5SXNDbGFzc0Jhc2VkID8gKGkgLSBmaWx0ZXJlZFN0eWxlQmluZGluZ05hbWVzLmxlbmd0aCkgOiBpO1xuICAgIGNvbnN0IHByb3BOYW1lID0gZW50cnlJc0NsYXNzQmFzZWQgPyBmaWx0ZXJlZENsYXNzQmluZGluZ05hbWVzW2FkanVzdGVkSW5kZXhdIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZmlsdGVyZWRTdHlsZUJpbmRpbmdOYW1lc1thZGp1c3RlZEluZGV4XTtcblxuICAgIGxldCBtdWx0aUluZGV4LCBzaW5nbGVJbmRleDtcbiAgICBpZiAoZW50cnlJc0NsYXNzQmFzZWQpIHtcbiAgICAgIG11bHRpSW5kZXggPSBtdWx0aUNsYXNzZXNTdGFydEluZGV4ICtcbiAgICAgICAgICAoKHRvdGFsQ3VycmVudENsYXNzQmluZGluZ3MgKyBhZGp1c3RlZEluZGV4KSAqIFN0eWxpbmdJbmRleC5TaXplKTtcbiAgICAgIHNpbmdsZUluZGV4ID0gc2luZ2xlQ2xhc3Nlc1N0YXJ0SW5kZXggK1xuICAgICAgICAgICgodG90YWxDdXJyZW50Q2xhc3NCaW5kaW5ncyArIGFkanVzdGVkSW5kZXgpICogU3R5bGluZ0luZGV4LlNpemUpO1xuICAgIH0gZWxzZSB7XG4gICAgICBtdWx0aUluZGV4ID1cbiAgICAgICAgICBtdWx0aVN0eWxlc1N0YXJ0SW5kZXggKyAoKHRvdGFsQ3VycmVudFN0eWxlQmluZGluZ3MgKyBhZGp1c3RlZEluZGV4KSAqIFN0eWxpbmdJbmRleC5TaXplKTtcbiAgICAgIHNpbmdsZUluZGV4ID0gc2luZ2xlU3R5bGVzU3RhcnRJbmRleCArXG4gICAgICAgICAgKCh0b3RhbEN1cnJlbnRTdHlsZUJpbmRpbmdzICsgYWRqdXN0ZWRJbmRleCkgKiBTdHlsaW5nSW5kZXguU2l6ZSk7XG4gICAgfVxuXG4gICAgLy8gaWYgYSBwcm9wZXJ0eSBpcyBub3QgZm91bmQgaW4gdGhlIGluaXRpYWwgc3R5bGUgdmFsdWVzIGxpc3QgdGhlbiBpdFxuICAgIC8vIGlzIEFMV0FZUyBhZGRlZCBpbiBjYXNlIGEgZm9sbG93LXVwIGRpcmVjdGl2ZSBpbnRyb2R1Y2VzIHRoZSBzYW1lIGluaXRpYWxcbiAgICAvLyBzdHlsZS9jbGFzcyB2YWx1ZSBsYXRlciBvbi5cbiAgICBsZXQgaW5pdGlhbFZhbHVlc1RvTG9va3VwID0gZW50cnlJc0NsYXNzQmFzZWQgPyBpbml0aWFsQ2xhc3NlcyA6IGluaXRpYWxTdHlsZXM7XG4gICAgbGV0IGluZGV4Rm9ySW5pdGlhbCA9IGdldEluaXRpYWxTdHlsaW5nVmFsdWVzSW5kZXhPZihpbml0aWFsVmFsdWVzVG9Mb29rdXAsIHByb3BOYW1lKTtcbiAgICBpZiAoaW5kZXhGb3JJbml0aWFsID09PSAtMSkge1xuICAgICAgaW5kZXhGb3JJbml0aWFsID0gYWRkT3JVcGRhdGVTdGF0aWNTdHlsZShcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBudWxsLCBpbml0aWFsVmFsdWVzVG9Mb29rdXAsIHByb3BOYW1lLCBlbnRyeUlzQ2xhc3NCYXNlZCA/IGZhbHNlIDogbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkaXJlY3RpdmVJbmRleCkgK1xuICAgICAgICAgIEluaXRpYWxTdHlsaW5nVmFsdWVzSW5kZXguVmFsdWVPZmZzZXQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIGluZGV4Rm9ySW5pdGlhbCArPSBJbml0aWFsU3R5bGluZ1ZhbHVlc0luZGV4LlZhbHVlT2Zmc2V0O1xuICAgIH1cblxuICAgIGNvbnN0IGluaXRpYWxGbGFnID1cbiAgICAgICAgcHJlcGFyZUluaXRpYWxGbGFnKGNvbnRleHQsIHByb3BOYW1lLCBlbnRyeUlzQ2xhc3NCYXNlZCwgc3R5bGVTYW5pdGl6ZXIgfHwgbnVsbCk7XG5cbiAgICBzZXRGbGFnKGNvbnRleHQsIHNpbmdsZUluZGV4LCBwb2ludGVycyhpbml0aWFsRmxhZywgaW5kZXhGb3JJbml0aWFsLCBtdWx0aUluZGV4KSk7XG4gICAgc2V0UHJvcChjb250ZXh0LCBzaW5nbGVJbmRleCwgcHJvcE5hbWUpO1xuICAgIHNldFZhbHVlKGNvbnRleHQsIHNpbmdsZUluZGV4LCBudWxsKTtcbiAgICBzZXRQbGF5ZXJCdWlsZGVySW5kZXgoY29udGV4dCwgc2luZ2xlSW5kZXgsIDAsIGRpcmVjdGl2ZUluZGV4KTtcblxuICAgIHNldEZsYWcoY29udGV4dCwgbXVsdGlJbmRleCwgcG9pbnRlcnMoaW5pdGlhbEZsYWcsIGluZGV4Rm9ySW5pdGlhbCwgc2luZ2xlSW5kZXgpKTtcbiAgICBzZXRQcm9wKGNvbnRleHQsIG11bHRpSW5kZXgsIHByb3BOYW1lKTtcbiAgICBzZXRWYWx1ZShjb250ZXh0LCBtdWx0aUluZGV4LCBudWxsKTtcbiAgICBzZXRQbGF5ZXJCdWlsZGVySW5kZXgoY29udGV4dCwgbXVsdGlJbmRleCwgMCwgZGlyZWN0aXZlSW5kZXgpO1xuICB9XG5cbiAgLy8gdGhlIHRvdGFsIGNsYXNzZXMvc3R5bGUgdmFsdWVzIGFyZSB1cGRhdGVkIHNvIHRoZSBuZXh0IHRpbWUgdGhlIGNvbnRleHQgaXMgcGF0Y2hlZFxuICAvLyBhZGRpdGlvbmFsIHN0eWxlL2NsYXNzIGJpbmRpbmdzIGZyb20gYW5vdGhlciBkaXJlY3RpdmUgdGhlbiBpdCBrbm93cyBleGFjdGx5IHdoZXJlXG4gIC8vIHRvIGluc2VydCB0aGVtIGluIHRoZSBjb250ZXh0XG4gIHNpbmdsZVByb3BPZmZzZXRWYWx1ZXNbU2luZ2xlUHJvcE9mZnNldFZhbHVlc0luZGV4LkNsYXNzZXNDb3VudFBvc2l0aW9uXSA9XG4gICAgICB0b3RhbEN1cnJlbnRDbGFzc0JpbmRpbmdzICsgZmlsdGVyZWRDbGFzc0JpbmRpbmdOYW1lcy5sZW5ndGg7XG4gIHNpbmdsZVByb3BPZmZzZXRWYWx1ZXNbU2luZ2xlUHJvcE9mZnNldFZhbHVlc0luZGV4LlN0eWxlc0NvdW50UG9zaXRpb25dID1cbiAgICAgIHRvdGFsQ3VycmVudFN0eWxlQmluZGluZ3MgKyBmaWx0ZXJlZFN0eWxlQmluZGluZ05hbWVzLmxlbmd0aDtcblxuICAvLyB0aGUgbWFwLWJhc2VkIHZhbHVlcyBhbHNvIG5lZWQgdG8ga25vdyBob3cgbWFueSBlbnRyaWVzIGdvdCBpbnNlcnRlZFxuICBjYWNoZWRDbGFzc01hcFZhbHVlc1tNYXBCYXNlZE9mZnNldFZhbHVlc0luZGV4LkVudHJpZXNDb3VudFBvc2l0aW9uXSArPVxuICAgICAgZmlsdGVyZWRDbGFzc0JpbmRpbmdOYW1lcy5sZW5ndGg7XG4gIGNhY2hlZFN0eWxlTWFwVmFsdWVzW01hcEJhc2VkT2Zmc2V0VmFsdWVzSW5kZXguRW50cmllc0NvdW50UG9zaXRpb25dICs9XG4gICAgICBmaWx0ZXJlZFN0eWxlQmluZGluZ05hbWVzLmxlbmd0aDtcbiAgY29uc3QgbmV3U3R5bGVzU3BhY2VBbGxvY2F0aW9uU2l6ZSA9IGZpbHRlcmVkU3R5bGVCaW5kaW5nTmFtZXMubGVuZ3RoICogU3R5bGluZ0luZGV4LlNpemU7XG4gIGNvbnN0IG5ld0NsYXNzZXNTcGFjZUFsbG9jYXRpb25TaXplID0gZmlsdGVyZWRDbGFzc0JpbmRpbmdOYW1lcy5sZW5ndGggKiBTdHlsaW5nSW5kZXguU2l6ZTtcblxuICAvLyB1cGRhdGUgdGhlIG11bHRpIHN0eWxlcyBjYWNoZSB3aXRoIGEgcmVmZXJlbmNlIGZvciB0aGUgZGlyZWN0aXZlIHRoYXQgd2FzIGp1c3QgaW5zZXJ0ZWRcbiAgY29uc3QgZGlyZWN0aXZlTXVsdGlTdHlsZXNTdGFydEluZGV4ID1cbiAgICAgIG11bHRpU3R5bGVzU3RhcnRJbmRleCArIHRvdGFsQ3VycmVudFN0eWxlQmluZGluZ3MgKiBTdHlsaW5nSW5kZXguU2l6ZTtcbiAgY29uc3QgY2FjaGVkU3R5bGVNYXBJbmRleCA9IGNhY2hlZFN0eWxlTWFwVmFsdWVzLmxlbmd0aDtcbiAgcmVnaXN0ZXJNdWx0aU1hcEVudHJ5KFxuICAgICAgY29udGV4dCwgZGlyZWN0aXZlSW5kZXgsIGZhbHNlLCBkaXJlY3RpdmVNdWx0aVN0eWxlc1N0YXJ0SW5kZXgsXG4gICAgICBmaWx0ZXJlZFN0eWxlQmluZGluZ05hbWVzLmxlbmd0aCk7XG5cbiAgZm9yIChsZXQgaSA9IE1hcEJhc2VkT2Zmc2V0VmFsdWVzSW5kZXguVmFsdWVzU3RhcnRQb3NpdGlvbjsgaSA8IGNhY2hlZFN0eWxlTWFwSW5kZXg7XG4gICAgICAgaSArPSBNYXBCYXNlZE9mZnNldFZhbHVlc0luZGV4LlNpemUpIHtcbiAgICAvLyBtdWx0aSB2YWx1ZXMgc3RhcnQgYWZ0ZXIgYWxsIHRoZSBzaW5nbGUgdmFsdWVzICh3aGljaCBpcyBhbHNvIHdoZXJlIGNsYXNzZXMgYXJlKSBpbiB0aGVcbiAgICAvLyBjb250ZXh0IHRoZXJlZm9yZSB0aGUgbmV3IGNsYXNzIGFsbG9jYXRpb24gc2l6ZSBzaG91bGQgYmUgdGFrZW4gaW50byBhY2NvdW50XG4gICAgY2FjaGVkU3R5bGVNYXBWYWx1ZXNbaSArIE1hcEJhc2VkT2Zmc2V0VmFsdWVzSW5kZXguUG9zaXRpb25TdGFydE9mZnNldF0gKz1cbiAgICAgICAgbmV3Q2xhc3Nlc1NwYWNlQWxsb2NhdGlvblNpemUgKyBuZXdTdHlsZXNTcGFjZUFsbG9jYXRpb25TaXplO1xuICB9XG5cbiAgLy8gdXBkYXRlIHRoZSBtdWx0aSBjbGFzc2VzIGNhY2hlIHdpdGggYSByZWZlcmVuY2UgZm9yIHRoZSBkaXJlY3RpdmUgdGhhdCB3YXMganVzdCBpbnNlcnRlZFxuICBjb25zdCBkaXJlY3RpdmVNdWx0aUNsYXNzZXNTdGFydEluZGV4ID1cbiAgICAgIG11bHRpQ2xhc3Nlc1N0YXJ0SW5kZXggKyB0b3RhbEN1cnJlbnRDbGFzc0JpbmRpbmdzICogU3R5bGluZ0luZGV4LlNpemU7XG4gIGNvbnN0IGNhY2hlZENsYXNzTWFwSW5kZXggPSBjYWNoZWRDbGFzc01hcFZhbHVlcy5sZW5ndGg7XG4gIHJlZ2lzdGVyTXVsdGlNYXBFbnRyeShcbiAgICAgIGNvbnRleHQsIGRpcmVjdGl2ZUluZGV4LCB0cnVlLCBkaXJlY3RpdmVNdWx0aUNsYXNzZXNTdGFydEluZGV4LFxuICAgICAgZmlsdGVyZWRDbGFzc0JpbmRpbmdOYW1lcy5sZW5ndGgpO1xuXG4gIGZvciAobGV0IGkgPSBNYXBCYXNlZE9mZnNldFZhbHVlc0luZGV4LlZhbHVlc1N0YXJ0UG9zaXRpb247IGkgPCBjYWNoZWRDbGFzc01hcEluZGV4O1xuICAgICAgIGkgKz0gTWFwQmFzZWRPZmZzZXRWYWx1ZXNJbmRleC5TaXplKSB7XG4gICAgLy8gdGhlIHJlYXNvbiB3aHkgYm90aCB0aGUgc3R5bGVzICsgY2xhc3NlcyBzcGFjZSBpcyBhbGxvY2F0ZWQgdG8gdGhlIGV4aXN0aW5nIG9mZnNldHMgaXNcbiAgICAvLyBiZWNhdXNlIHRoZSBzdHlsZXMgc2hvdyB1cCBiZWZvcmUgdGhlIGNsYXNzZXMgaW4gdGhlIGNvbnRleHQgYW5kIGFueSBuZXcgaW5zZXJ0ZWRcbiAgICAvLyBzdHlsZXMgd2lsbCBvZmZzZXQgYW55IGV4aXN0aW5nIGNsYXNzIGVudHJpZXMgaW4gdGhlIGNvbnRleHQgKGV2ZW4gaWYgdGhlcmUgYXJlIG5vXG4gICAgLy8gbmV3IGNsYXNzIGVudHJpZXMgYWRkZWQpIGFsc28gdGhlIHJlYXNvbiB3aHkgaXQncyAqMiBpcyBiZWNhdXNlIGJvdGggc2luZ2xlICsgbXVsdGlcbiAgICAvLyBlbnRyaWVzIGZvciBlYWNoIG5ldyBzdHlsZSBoYXZlIGJlZW4gYWRkZWQgaW4gdGhlIGNvbnRleHQgYmVmb3JlIHRoZSBtdWx0aSBjbGFzcyB2YWx1ZXNcbiAgICAvLyBhY3R1YWxseSBzdGFydFxuICAgIGNhY2hlZENsYXNzTWFwVmFsdWVzW2kgKyBNYXBCYXNlZE9mZnNldFZhbHVlc0luZGV4LlBvc2l0aW9uU3RhcnRPZmZzZXRdICs9XG4gICAgICAgIChuZXdTdHlsZXNTcGFjZUFsbG9jYXRpb25TaXplICogMikgKyBuZXdDbGFzc2VzU3BhY2VBbGxvY2F0aW9uU2l6ZTtcbiAgfVxuXG4gIC8vIHRoZXJlIGlzIG5vIGluaXRpYWwgdmFsdWUgZmxhZyBmb3IgdGhlIG1hc3RlciBpbmRleCBzaW5jZSBpdCBkb2Vzbid0XG4gIC8vIHJlZmVyZW5jZSBhbiBpbml0aWFsIHN0eWxlIHZhbHVlXG4gIGNvbnN0IG1hc3RlckZsYWcgPSBwb2ludGVycygwLCAwLCBtdWx0aVN0eWxlc1N0YXJ0SW5kZXgpO1xuICBzZXRGbGFnKGNvbnRleHQsIFN0eWxpbmdJbmRleC5NYXN0ZXJGbGFnUG9zaXRpb24sIG1hc3RlckZsYWcpO1xufVxuXG4vKipcbiAqIFNlYXJjaGVzIHRocm91Z2ggdGhlIGV4aXN0aW5nIHJlZ2lzdHJ5IG9mIGRpcmVjdGl2ZXNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZpbmRPclBhdGNoRGlyZWN0aXZlSW50b1JlZ2lzdHJ5KFxuICAgIGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBkaXJlY3RpdmVJbmRleDogbnVtYmVyLCBzdGF0aWNNb2RlT25seTogYm9vbGVhbixcbiAgICBzdHlsZVNhbml0aXplcj86IFN0eWxlU2FuaXRpemVGbiB8IG51bGwpOiBib29sZWFuIHtcbiAgY29uc3QgZGlyZWN0aXZlUmVnaXN0cnkgPSBjb250ZXh0W1N0eWxpbmdJbmRleC5EaXJlY3RpdmVSZWdpc3RyeVBvc2l0aW9uXTtcbiAgY29uc3QgaW5kZXggPSBkaXJlY3RpdmVJbmRleCAqIERpcmVjdGl2ZVJlZ2lzdHJ5VmFsdWVzSW5kZXguU2l6ZTtcbiAgY29uc3Qgc2luZ2xlUHJvcFN0YXJ0UG9zaXRpb24gPSBpbmRleCArIERpcmVjdGl2ZVJlZ2lzdHJ5VmFsdWVzSW5kZXguU2luZ2xlUHJvcFZhbHVlc0luZGV4T2Zmc2V0O1xuXG4gIC8vIHRoaXMgbWVhbnMgdGhhdCB0aGUgZGlyZWN0aXZlIGhhcyBhbHJlYWR5IGJlZW4gcmVnaXN0ZXJlZCBpbnRvIHRoZSByZWdpc3RyeVxuICBpZiAoaW5kZXggPCBkaXJlY3RpdmVSZWdpc3RyeS5sZW5ndGggJiZcbiAgICAgIChkaXJlY3RpdmVSZWdpc3RyeVtzaW5nbGVQcm9wU3RhcnRQb3NpdGlvbl0gYXMgbnVtYmVyKSA+PSAwKVxuICAgIHJldHVybiBmYWxzZTtcblxuICBjb25zdCBzaW5nbGVQcm9wc1N0YXJ0SW5kZXggPVxuICAgICAgc3RhdGljTW9kZU9ubHkgPyAtMSA6IGNvbnRleHRbU3R5bGluZ0luZGV4LlNpbmdsZVByb3BPZmZzZXRQb3NpdGlvbnNdLmxlbmd0aDtcbiAgYWxsb2NhdGVPclVwZGF0ZURpcmVjdGl2ZUludG9Db250ZXh0KFxuICAgICAgY29udGV4dCwgZGlyZWN0aXZlSW5kZXgsIHNpbmdsZVByb3BzU3RhcnRJbmRleCwgc3R5bGVTYW5pdGl6ZXIpO1xuICByZXR1cm4gdHJ1ZTtcbn1cblxuZnVuY3Rpb24gZ2V0TWF0Y2hpbmdCaW5kaW5nSW5kZXgoXG4gICAgY29udGV4dDogU3R5bGluZ0NvbnRleHQsIGJpbmRpbmdOYW1lOiBzdHJpbmcsIHN0YXJ0OiBudW1iZXIsIGVuZDogbnVtYmVyKSB7XG4gIGZvciAobGV0IGogPSBzdGFydDsgaiA8IGVuZDsgaiArPSBTdHlsaW5nSW5kZXguU2l6ZSkge1xuICAgIGlmIChnZXRQcm9wKGNvbnRleHQsIGopID09PSBiaW5kaW5nTmFtZSkgcmV0dXJuIGo7XG4gIH1cbiAgcmV0dXJuIC0xO1xufVxuXG4vKipcbiAqIFJlZ2lzdGVycyB0aGUgcHJvdmlkZWQgbXVsdGkgc3R5bGluZyAoYFtzdHlsZV1gIGFuZCBgW2NsYXNzXWApIHZhbHVlcyB0byB0aGUgY29udGV4dC5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIHdpbGwgaXRlcmF0ZSBvdmVyIHRoZSBwcm92aWRlZCBgY2xhc3Nlc0lucHV0YCBhbmQgYHN0eWxlc0lucHV0YCBtYXBcbiAqIHZhbHVlcyBhbmQgaW5zZXJ0L3VwZGF0ZSBvciByZW1vdmUgdGhlbSBmcm9tIHRoZSBjb250ZXh0IGF0IGV4YWN0bHkgdGhlIHJpZ2h0XG4gKiBzcG90LlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gYWxzbyB0YWtlcyBpbiBhIGRpcmVjdGl2ZSB3aGljaCBpbXBsaWVzIHRoYXQgdGhlIHN0eWxpbmcgdmFsdWVzIHdpbGxcbiAqIGJlIGV2YWx1YXRlZCBmb3IgdGhhdCBkaXJlY3RpdmUgd2l0aCByZXNwZWN0IHRvIGFueSBvdGhlciBzdHlsaW5nIHRoYXQgYWxyZWFkeSBleGlzdHNcbiAqIG9uIHRoZSBjb250ZXh0LiBXaGVuIHRoZXJlIGFyZSBzdHlsZXMgdGhhdCBjb25mbGljdCAoZS5nLiBzYXkgYG5nU3R5bGVgIGFuZCBgW3N0eWxlXWBcbiAqIGJvdGggdXBkYXRlIHRoZSBgd2lkdGhgIHByb3BlcnR5IGF0IHRoZSBzYW1lIHRpbWUpIHRoZW4gdGhlIHN0eWxpbmcgYWxnb3JpdGhtIGNvZGUgYmVsb3dcbiAqIHdpbGwgZGVjaWRlIHdoaWNoIG9uZSB3aW5zIGJhc2VkIG9uIHRoZSBkaXJlY3RpdmUgc3R5bGluZyBwcmlvcml0aXphdGlvbiBtZWNoYW5pc20uIFRoaXNcbiAqIG1lY2hhbmlzbSBpcyBiZXR0ZXIgZXhwbGFpbmVkIGluIHJlbmRlcjMvaW50ZXJmYWNlcy9zdHlsaW5nLnRzI2RpcmVjdGl2ZXMpLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gd2lsbCBub3QgcmVuZGVyIGFueSBzdHlsaW5nIHZhbHVlcyBvbiBzY3JlZW4sIGJ1dCBpcyByYXRoZXIgZGVzaWduZWQgdG9cbiAqIHByZXBhcmUgdGhlIGNvbnRleHQgZm9yIHRoYXQuIGByZW5kZXJTdHlsaW5nYCBtdXN0IGJlIGNhbGxlZCBhZnRlcndhcmRzIHRvIHJlbmRlciBhbnlcbiAqIHN0eWxpbmcgZGF0YSB0aGF0IHdhcyBzZXQgaW4gdGhpcyBmdW5jdGlvbiAobm90ZSB0aGF0IGB1cGRhdGVDbGFzc1Byb3BgIGFuZFxuICogYHVwZGF0ZVN0eWxlUHJvcGAgYXJlIGRlc2lnbmVkIHRvIGJlIHJ1biBhZnRlciB0aGlzIGZ1bmN0aW9uIGlzIHJ1bikuXG4gKlxuICogQHBhcmFtIGNvbnRleHQgVGhlIHN0eWxpbmcgY29udGV4dCB0aGF0IHdpbGwgYmUgdXBkYXRlZCB3aXRoIHRoZVxuICogICAgbmV3bHkgcHJvdmlkZWQgc3R5bGUgdmFsdWVzLlxuICogQHBhcmFtIGNsYXNzZXNJbnB1dCBUaGUga2V5L3ZhbHVlIG1hcCBvZiBDU1MgY2xhc3MgbmFtZXMgdGhhdCB3aWxsIGJlIHVzZWQgZm9yIHRoZSB1cGRhdGUuXG4gKiBAcGFyYW0gc3R5bGVzSW5wdXQgVGhlIGtleS92YWx1ZSBtYXAgb2YgQ1NTIHN0eWxlcyB0aGF0IHdpbGwgYmUgdXNlZCBmb3IgdGhlIHVwZGF0ZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHVwZGF0ZVN0eWxpbmdNYXAoXG4gICAgY29udGV4dDogU3R5bGluZ0NvbnRleHQsIGNsYXNzZXNJbnB1dDoge1trZXk6IHN0cmluZ106IGFueX0gfCBzdHJpbmcgfFxuICAgICAgICBCb3VuZFBsYXllckZhY3Rvcnk8bnVsbHxzdHJpbmd8e1trZXk6IHN0cmluZ106IGFueX0+fCBudWxsLFxuICAgIHN0eWxlc0lucHV0Pzoge1trZXk6IHN0cmluZ106IGFueX0gfCBCb3VuZFBsYXllckZhY3Rvcnk8bnVsbHx7W2tleTogc3RyaW5nXTogYW55fT58IG51bGwsXG4gICAgZGlyZWN0aXZlSW5kZXg6IG51bWJlciA9IDApOiB2b2lkIHtcbiAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5zdHlsaW5nTWFwKys7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRWYWxpZERpcmVjdGl2ZUluZGV4KGNvbnRleHQsIGRpcmVjdGl2ZUluZGV4KTtcbiAgY2xhc3Nlc0lucHV0ID0gY2xhc3Nlc0lucHV0IHx8IG51bGw7XG4gIHN0eWxlc0lucHV0ID0gc3R5bGVzSW5wdXQgfHwgbnVsbDtcbiAgY29uc3QgaWdub3JlQWxsQ2xhc3NVcGRhdGVzID0gaXNNdWx0aVZhbHVlQ2FjaGVIaXQoY29udGV4dCwgdHJ1ZSwgZGlyZWN0aXZlSW5kZXgsIGNsYXNzZXNJbnB1dCk7XG4gIGNvbnN0IGlnbm9yZUFsbFN0eWxlVXBkYXRlcyA9IGlzTXVsdGlWYWx1ZUNhY2hlSGl0KGNvbnRleHQsIGZhbHNlLCBkaXJlY3RpdmVJbmRleCwgc3R5bGVzSW5wdXQpO1xuXG4gIC8vIGVhcmx5IGV4aXQgKHRoaXMgaXMgd2hhdCdzIGRvbmUgdG8gYXZvaWQgdXNpbmcgY3R4LmJpbmQoKSB0byBjYWNoZSB0aGUgdmFsdWUpXG4gIGlmIChpZ25vcmVBbGxDbGFzc1VwZGF0ZXMgJiYgaWdub3JlQWxsU3R5bGVVcGRhdGVzKSByZXR1cm47XG5cbiAgY2xhc3Nlc0lucHV0ID1cbiAgICAgIGNsYXNzZXNJbnB1dCA9PT0gTk9fQ0hBTkdFID8gcmVhZENhY2hlZE1hcFZhbHVlKGNvbnRleHQsIHRydWUsIGRpcmVjdGl2ZUluZGV4KSA6IGNsYXNzZXNJbnB1dDtcbiAgc3R5bGVzSW5wdXQgPVxuICAgICAgc3R5bGVzSW5wdXQgPT09IE5PX0NIQU5HRSA/IHJlYWRDYWNoZWRNYXBWYWx1ZShjb250ZXh0LCBmYWxzZSwgZGlyZWN0aXZlSW5kZXgpIDogc3R5bGVzSW5wdXQ7XG5cbiAgY29uc3QgZWxlbWVudCA9IGNvbnRleHRbU3R5bGluZ0luZGV4LkVsZW1lbnRQb3NpdGlvbl0gIWFzIEhUTUxFbGVtZW50O1xuICBjb25zdCBjbGFzc2VzUGxheWVyQnVpbGRlciA9IGNsYXNzZXNJbnB1dCBpbnN0YW5jZW9mIEJvdW5kUGxheWVyRmFjdG9yeSA/XG4gICAgICBuZXcgQ2xhc3NBbmRTdHlsZVBsYXllckJ1aWxkZXIoY2xhc3Nlc0lucHV0IGFzIGFueSwgZWxlbWVudCwgQmluZGluZ1R5cGUuQ2xhc3MpIDpcbiAgICAgIG51bGw7XG4gIGNvbnN0IHN0eWxlc1BsYXllckJ1aWxkZXIgPSBzdHlsZXNJbnB1dCBpbnN0YW5jZW9mIEJvdW5kUGxheWVyRmFjdG9yeSA/XG4gICAgICBuZXcgQ2xhc3NBbmRTdHlsZVBsYXllckJ1aWxkZXIoc3R5bGVzSW5wdXQgYXMgYW55LCBlbGVtZW50LCBCaW5kaW5nVHlwZS5TdHlsZSkgOlxuICAgICAgbnVsbDtcblxuICBjb25zdCBjbGFzc2VzVmFsdWUgPSBjbGFzc2VzUGxheWVyQnVpbGRlciA/XG4gICAgICAoY2xhc3Nlc0lucHV0IGFzIEJvdW5kUGxheWVyRmFjdG9yeTx7W2tleTogc3RyaW5nXTogYW55fXxzdHJpbmc+KSAhLnZhbHVlIDpcbiAgICAgIGNsYXNzZXNJbnB1dDtcbiAgY29uc3Qgc3R5bGVzVmFsdWUgPSBzdHlsZXNQbGF5ZXJCdWlsZGVyID8gc3R5bGVzSW5wdXQgIVsndmFsdWUnXSA6IHN0eWxlc0lucHV0O1xuXG4gIGxldCBjbGFzc05hbWVzOiBzdHJpbmdbXSA9IEVNUFRZX0FSUkFZO1xuICBsZXQgYXBwbHlBbGxDbGFzc2VzID0gZmFsc2U7XG4gIGxldCBwbGF5ZXJCdWlsZGVyc0FyZURpcnR5ID0gZmFsc2U7XG5cbiAgY29uc3QgY2xhc3Nlc1BsYXllckJ1aWxkZXJJbmRleCA9XG4gICAgICBjbGFzc2VzUGxheWVyQnVpbGRlciA/IFBsYXllckluZGV4LkNsYXNzTWFwUGxheWVyQnVpbGRlclBvc2l0aW9uIDogMDtcbiAgaWYgKGhhc1BsYXllckJ1aWxkZXJDaGFuZ2VkKFxuICAgICAgICAgIGNvbnRleHQsIGNsYXNzZXNQbGF5ZXJCdWlsZGVyLCBQbGF5ZXJJbmRleC5DbGFzc01hcFBsYXllckJ1aWxkZXJQb3NpdGlvbikpIHtcbiAgICBzZXRQbGF5ZXJCdWlsZGVyKGNvbnRleHQsIGNsYXNzZXNQbGF5ZXJCdWlsZGVyLCBQbGF5ZXJJbmRleC5DbGFzc01hcFBsYXllckJ1aWxkZXJQb3NpdGlvbik7XG4gICAgcGxheWVyQnVpbGRlcnNBcmVEaXJ0eSA9IHRydWU7XG4gIH1cblxuICBjb25zdCBzdHlsZXNQbGF5ZXJCdWlsZGVySW5kZXggPVxuICAgICAgc3R5bGVzUGxheWVyQnVpbGRlciA/IFBsYXllckluZGV4LlN0eWxlTWFwUGxheWVyQnVpbGRlclBvc2l0aW9uIDogMDtcbiAgaWYgKGhhc1BsYXllckJ1aWxkZXJDaGFuZ2VkKFxuICAgICAgICAgIGNvbnRleHQsIHN0eWxlc1BsYXllckJ1aWxkZXIsIFBsYXllckluZGV4LlN0eWxlTWFwUGxheWVyQnVpbGRlclBvc2l0aW9uKSkge1xuICAgIHNldFBsYXllckJ1aWxkZXIoY29udGV4dCwgc3R5bGVzUGxheWVyQnVpbGRlciwgUGxheWVySW5kZXguU3R5bGVNYXBQbGF5ZXJCdWlsZGVyUG9zaXRpb24pO1xuICAgIHBsYXllckJ1aWxkZXJzQXJlRGlydHkgPSB0cnVlO1xuICB9XG5cbiAgLy8gZWFjaCB0aW1lIGEgc3RyaW5nLWJhc2VkIHZhbHVlIHBvcHMgdXAgdGhlbiBpdCBzaG91bGRuJ3QgcmVxdWlyZSBhIGRlZXBcbiAgLy8gY2hlY2sgb2Ygd2hhdCdzIGNoYW5nZWQuXG4gIGlmICghaWdub3JlQWxsQ2xhc3NVcGRhdGVzKSB7XG4gICAgaWYgKHR5cGVvZiBjbGFzc2VzVmFsdWUgPT0gJ3N0cmluZycpIHtcbiAgICAgIGNsYXNzTmFtZXMgPSBjbGFzc2VzVmFsdWUuc3BsaXQoL1xccysvKTtcbiAgICAgIC8vIHRoaXMgYm9vbGVhbiBpcyB1c2VkIHRvIGF2b2lkIGhhdmluZyB0byBjcmVhdGUgYSBrZXkvdmFsdWUgbWFwIG9mIGB0cnVlYCB2YWx1ZXNcbiAgICAgIC8vIHNpbmNlIGEgY2xhc3NuYW1lIHN0cmluZyBpbXBsaWVzIHRoYXQgYWxsIHRob3NlIGNsYXNzZXMgYXJlIGFkZGVkXG4gICAgICBhcHBseUFsbENsYXNzZXMgPSB0cnVlO1xuICAgIH0gZWxzZSB7XG4gICAgICBjbGFzc05hbWVzID0gY2xhc3Nlc1ZhbHVlID8gT2JqZWN0LmtleXMoY2xhc3Nlc1ZhbHVlKSA6IEVNUFRZX0FSUkFZO1xuICAgIH1cbiAgfVxuXG4gIGNvbnN0IG11bHRpU3R5bGVzU3RhcnRJbmRleCA9IGdldE11bHRpU3R5bGVzU3RhcnRJbmRleChjb250ZXh0KTtcbiAgbGV0IG11bHRpQ2xhc3Nlc1N0YXJ0SW5kZXggPSBnZXRNdWx0aUNsYXNzZXNTdGFydEluZGV4KGNvbnRleHQpO1xuICBsZXQgbXVsdGlDbGFzc2VzRW5kSW5kZXggPSBjb250ZXh0Lmxlbmd0aDtcblxuICBpZiAoIWlnbm9yZUFsbFN0eWxlVXBkYXRlcykge1xuICAgIGNvbnN0IHN0eWxlUHJvcHMgPSBzdHlsZXNWYWx1ZSA/IE9iamVjdC5rZXlzKHN0eWxlc1ZhbHVlKSA6IEVNUFRZX0FSUkFZO1xuICAgIGNvbnN0IHN0eWxlcyA9IHN0eWxlc1ZhbHVlIHx8IEVNUFRZX09CSjtcbiAgICBjb25zdCB0b3RhbE5ld0VudHJpZXMgPSBwYXRjaFN0eWxpbmdNYXBJbnRvQ29udGV4dChcbiAgICAgICAgY29udGV4dCwgZGlyZWN0aXZlSW5kZXgsIHN0eWxlc1BsYXllckJ1aWxkZXJJbmRleCwgbXVsdGlTdHlsZXNTdGFydEluZGV4LFxuICAgICAgICBtdWx0aUNsYXNzZXNTdGFydEluZGV4LCBzdHlsZVByb3BzLCBzdHlsZXMsIHN0eWxlc0lucHV0LCBmYWxzZSk7XG4gICAgaWYgKHRvdGFsTmV3RW50cmllcykge1xuICAgICAgbXVsdGlDbGFzc2VzU3RhcnRJbmRleCArPSB0b3RhbE5ld0VudHJpZXMgKiBTdHlsaW5nSW5kZXguU2l6ZTtcbiAgICAgIG11bHRpQ2xhc3Nlc0VuZEluZGV4ICs9IHRvdGFsTmV3RW50cmllcyAqIFN0eWxpbmdJbmRleC5TaXplO1xuICAgIH1cbiAgfVxuXG4gIGlmICghaWdub3JlQWxsQ2xhc3NVcGRhdGVzKSB7XG4gICAgY29uc3QgY2xhc3NlcyA9IChjbGFzc2VzVmFsdWUgfHwgRU1QVFlfT0JKKSBhc3tba2V5OiBzdHJpbmddOiBhbnl9O1xuICAgIHBhdGNoU3R5bGluZ01hcEludG9Db250ZXh0KFxuICAgICAgICBjb250ZXh0LCBkaXJlY3RpdmVJbmRleCwgY2xhc3Nlc1BsYXllckJ1aWxkZXJJbmRleCwgbXVsdGlDbGFzc2VzU3RhcnRJbmRleCxcbiAgICAgICAgbXVsdGlDbGFzc2VzRW5kSW5kZXgsIGNsYXNzTmFtZXMsIGFwcGx5QWxsQ2xhc3NlcyB8fCBjbGFzc2VzLCBjbGFzc2VzSW5wdXQsIHRydWUpO1xuICB9XG5cbiAgaWYgKHBsYXllckJ1aWxkZXJzQXJlRGlydHkpIHtcbiAgICBzZXRDb250ZXh0UGxheWVyc0RpcnR5KGNvbnRleHQsIHRydWUpO1xuICB9XG5cbiAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5zdHlsaW5nTWFwQ2FjaGVNaXNzKys7XG59XG5cbi8qKlxuICogQXBwbGllcyB0aGUgZ2l2ZW4gbXVsdGkgc3R5bGluZyAoc3R5bGVzIG9yIGNsYXNzZXMpIHZhbHVlcyB0byB0aGUgY29udGV4dC5cbiAqXG4gKiBUaGUgc3R5bGluZyBhbGdvcml0aG0gY29kZSB0aGF0IGFwcGxpZXMgbXVsdGktbGV2ZWwgc3R5bGluZyAodGhpbmdzIGxpa2UgYFtzdHlsZV1gIGFuZCBgW2NsYXNzXWBcbiAqIHZhbHVlcykgcmVzaWRlcyBoZXJlLlxuICpcbiAqIEJlY2F1c2UgdGhpcyBmdW5jdGlvbiB1bmRlcnN0YW5kcyB0aGF0IG11bHRpcGxlIGRpcmVjdGl2ZXMgbWF5IGFsbCB3cml0ZSB0byB0aGUgYFtzdHlsZV1gIGFuZFxuICogYFtjbGFzc11gIGJpbmRpbmdzICh0aHJvdWdoIGhvc3QgYmluZGluZ3MpLCBpdCByZWxpZXMgb2YgZWFjaCBkaXJlY3RpdmUgYXBwbHlpbmcgaXRzIGJpbmRpbmdcbiAqIHZhbHVlIGluIG9yZGVyLiBUaGlzIG1lYW5zIHRoYXQgYSBkaXJlY3RpdmUgbGlrZSBgY2xhc3NBRGlyZWN0aXZlYCB3aWxsIGFsd2F5cyBmaXJlIGJlZm9yZVxuICogYGNsYXNzQkRpcmVjdGl2ZWAgYW5kIHRoZXJlZm9yZSBpdHMgc3R5bGluZyB2YWx1ZXMgKGNsYXNzZXMgYW5kIHN0eWxlcykgd2lsbCBhbHdheXMgYmUgZXZhbHVhdGVkXG4gKiBpbiB0aGUgc2FtZSBvcmRlci4gQmVjYXVzZSBvZiB0aGlzIGNvbnNpc3RlbnQgb3JkZXJpbmcsIHRoZSBmaXJzdCBkaXJlY3RpdmUgaGFzIGEgaGlnaGVyIHByaW9yaXR5XG4gKiB0aGFuIHRoZSBzZWNvbmQgb25lLiBJdCBpcyB3aXRoIHRoaXMgcHJpb3JpdHphdGlvbiBtZWNoYW5pc20gdGhhdCB0aGUgc3R5bGluZyBhbGdvcml0aG0ga25vd3MgaG93XG4gKiB0byBtZXJnZSBhbmQgYXBwbHkgcmVkdWRhbnQgc3R5bGluZyBwcm9wZXJ0aWVzLlxuICpcbiAqIFRoZSBmdW5jdGlvbiBpdHNlbGYgYXBwbGllcyB0aGUga2V5L3ZhbHVlIGVudHJpZXMgKG9yIGFuIGFycmF5IG9mIGtleXMpIHRvXG4gKiB0aGUgY29udGV4dCBpbiB0aGUgZm9sbG93aW5nIHN0ZXBzLlxuICpcbiAqIFNURVAgMTpcbiAqICAgIEZpcnN0IGNoZWNrIHRvIHNlZSB3aGF0IHByb3BlcnRpZXMgYXJlIGFscmVhZHkgc2V0IGFuZCBpbiB1c2UgYnkgYW5vdGhlciBkaXJlY3RpdmUgaW4gdGhlXG4gKiAgICBjb250ZXh0IChlLmcuIGBuZ0NsYXNzYCBzZXQgdGhlIGB3aWR0aGAgdmFsdWUgYW5kIGBbc3R5bGUud2lkdGhdPVwid1wiYCBpbiBhIGRpcmVjdGl2ZSBpc1xuICogICAgYXR0ZW1wdGluZyB0byBzZXQgaXQgYXMgd2VsbCkuXG4gKlxuICogU1RFUCAyOlxuICogICAgQWxsIHJlbWFpbmluZyBwcm9wZXJ0aWVzICh0aGF0IHdlcmUgbm90IHNldCBwcmlvciB0byB0aGlzIGRpcmVjdGl2ZSkgYXJlIG5vdyB1cGRhdGVkIGluXG4gKiAgICB0aGUgY29udGV4dC4gQW55IG5ldyBwcm9wZXJ0aWVzIGFyZSBpbnNlcnRlZCBleGFjdGx5IGF0IHRoZWlyIHNwb3QgaW4gdGhlIGNvbnRleHQgYW5kIGFueVxuICogICAgcHJldmlvdXNseSBzZXQgcHJvcGVydGllcyBhcmUgc2hpZnRlZCB0byBleGFjdGx5IHdoZXJlIHRoZSBjdXJzb3Igc2l0cyB3aGlsZSBpdGVyYXRpbmcgb3ZlclxuICogICAgdGhlIGNvbnRleHQuIFRoZSBlbmQgcmVzdWx0IGlzIGEgYmFsYW5jZWQgY29udGV4dCB0aGF0IGluY2x1ZGVzIHRoZSBleGFjdCBvcmRlcmluZyBvZiB0aGVcbiAqICAgIHN0eWxpbmcgcHJvcGVydGllcy92YWx1ZXMgZm9yIHRoZSBwcm92aWRlZCBpbnB1dCBmcm9tIHRoZSBkaXJlY3RpdmUuXG4gKlxuICogU1RFUCAzOlxuICogICAgQW55IHVubWF0Y2hlZCBwcm9wZXJ0aWVzIGluIHRoZSBjb250ZXh0IHRoYXQgYmVsb25nIHRvIHRoZSBkaXJlY3RpdmUgYXJlIHNldCB0byBudWxsXG4gKlxuICogT25jZSB0aGUgdXBkYXRpbmcgcGhhc2UgaXMgZG9uZSwgdGhlbiB0aGUgYWxnb3JpdGhtIHdpbGwgZGVjaWRlIHdoZXRoZXIgb3Igbm90IHRvIGZsYWcgdGhlXG4gKiBmb2xsb3ctdXAgZGlyZWN0aXZlcyAodGhlIGRpcmVjdGl2ZXMgdGhhdCB3aWxsIHBhc3MgaW4gdGhlaXIgc3R5bGluZyB2YWx1ZXMpIGRlcGVuZGluZyBvbiBpZlxuICogdGhlIFwic2hhcGVcIiBvZiB0aGUgbXVsdGktdmFsdWUgbWFwIGhhcyBjaGFuZ2VkIChlaXRoZXIgaWYgYW55IGtleXMgYXJlIHJlbW92ZWQgb3IgYWRkZWQgb3JcbiAqIGlmIHRoZXJlIGFyZSBhbnkgbmV3IGBudWxsYCB2YWx1ZXMpLiBJZiBhbnkgZm9sbG93LXVwIGRpcmVjdGl2ZXMgYXJlIGZsYWdnZWQgYXMgZGlydHkgdGhlbiB0aGVcbiAqIGFsZ29yaXRobSB3aWxsIHJ1biBhZ2FpbiBmb3IgdGhlbS4gT3RoZXJ3aXNlIGlmIHRoZSBzaGFwZSBkaWQgbm90IGNoYW5nZSB0aGVuIGFueSBmb2xsb3ctdXBcbiAqIGRpcmVjdGl2ZXMgd2lsbCBub3QgcnVuIChzbyBsb25nIGFzIHRoZWlyIGJpbmRpbmcgdmFsdWVzIHN0YXkgdGhlIHNhbWUpLlxuICpcbiAqIEByZXR1cm5zIHRoZSB0b3RhbCBhbW91bnQgb2YgbmV3IHNsb3RzIHRoYXQgd2VyZSBhbGxvY2F0ZWQgaW50byB0aGUgY29udGV4dCBkdWUgdG8gbmV3IHN0eWxpbmdcbiAqICAgICAgICAgIHByb3BlcnRpZXMgdGhhdCB3ZXJlIGRldGVjdGVkLlxuICovXG5mdW5jdGlvbiBwYXRjaFN0eWxpbmdNYXBJbnRvQ29udGV4dChcbiAgICBjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgZGlyZWN0aXZlSW5kZXg6IG51bWJlciwgcGxheWVyQnVpbGRlckluZGV4OiBudW1iZXIsIGN0eFN0YXJ0OiBudW1iZXIsXG4gICAgY3R4RW5kOiBudW1iZXIsIHByb3BzOiAoc3RyaW5nIHwgbnVsbClbXSwgdmFsdWVzOiB7W2tleTogc3RyaW5nXTogYW55fSB8IHRydWUsIGNhY2hlVmFsdWU6IGFueSxcbiAgICBlbnRyeUlzQ2xhc3NCYXNlZDogYm9vbGVhbik6IG51bWJlciB7XG4gIGxldCBkaXJ0eSA9IGZhbHNlO1xuXG4gIGNvbnN0IGNhY2hlSW5kZXggPSBNYXBCYXNlZE9mZnNldFZhbHVlc0luZGV4LlZhbHVlc1N0YXJ0UG9zaXRpb24gK1xuICAgICAgZGlyZWN0aXZlSW5kZXggKiBNYXBCYXNlZE9mZnNldFZhbHVlc0luZGV4LlNpemU7XG5cbiAgLy8gdGhlIGNhY2hlZFZhbHVlcyBhcnJheSBpcyB0aGUgcmVnaXN0cnkgb2YgYWxsIG11bHRpIHN0eWxlIHZhbHVlcyAobWFwIHZhbHVlcykuIEVhY2hcbiAgLy8gdmFsdWUgaXMgc3RvcmVkIChjYWNoZWQpIGVhY2ggdGltZSBpcyB1cGRhdGVkLlxuICBjb25zdCBjYWNoZWRWYWx1ZXMgPVxuICAgICAgY29udGV4dFtlbnRyeUlzQ2xhc3NCYXNlZCA/IFN0eWxpbmdJbmRleC5DYWNoZWRNdWx0aUNsYXNzZXMgOiBTdHlsaW5nSW5kZXguQ2FjaGVkTXVsdGlTdHlsZXNdO1xuXG4gIC8vIHRoaXMgaXMgdGhlIGluZGV4IGluIHdoaWNoIHRoaXMgZGlyZWN0aXZlIGhhcyBvd25lcnNoaXAgYWNjZXNzIHRvIHdyaXRlIHRvIHRoaXNcbiAgLy8gdmFsdWUgKGFueXRoaW5nIGJlZm9yZSBpcyBvd25lZCBieSBhIHByZXZpb3VzIGRpcmVjdGl2ZSB0aGF0IGlzIG1vcmUgaW1wb3J0YW50KVxuICBjb25zdCBvd25lcnNoaXBWYWx1ZXNTdGFydEluZGV4ID1cbiAgICAgIGNhY2hlZFZhbHVlc1tjYWNoZUluZGV4ICsgTWFwQmFzZWRPZmZzZXRWYWx1ZXNJbmRleC5Qb3NpdGlvblN0YXJ0T2Zmc2V0XTtcblxuICBjb25zdCBleGlzdGluZ0NhY2hlZFZhbHVlID0gY2FjaGVkVmFsdWVzW2NhY2hlSW5kZXggKyBNYXBCYXNlZE9mZnNldFZhbHVlc0luZGV4LlZhbHVlT2Zmc2V0XTtcbiAgY29uc3QgZXhpc3RpbmdDYWNoZWRWYWx1ZUNvdW50ID1cbiAgICAgIGNhY2hlZFZhbHVlc1tjYWNoZUluZGV4ICsgTWFwQmFzZWRPZmZzZXRWYWx1ZXNJbmRleC5WYWx1ZUNvdW50T2Zmc2V0XTtcbiAgY29uc3QgZXhpc3RpbmdDYWNoZWRWYWx1ZUlzRGlydHkgPVxuICAgICAgY2FjaGVkVmFsdWVzW2NhY2hlSW5kZXggKyBNYXBCYXNlZE9mZnNldFZhbHVlc0luZGV4LkRpcnR5RmxhZ09mZnNldF0gPT09IDE7XG5cbiAgLy8gQSBzaGFwZSBjaGFuZ2UgbWVhbnMgdGhlIHByb3ZpZGVkIG1hcCB2YWx1ZSBoYXMgZWl0aGVyIHJlbW92ZWQgb3IgYWRkZWQgbmV3IHByb3BlcnRpZXNcbiAgLy8gY29tcGFyZWQgdG8gd2hhdCB3ZXJlIGluIHRoZSBsYXN0IHRpbWUuIElmIGEgc2hhcGUgY2hhbmdlIG9jY3VycyB0aGVuIGl0IG1lYW5zIHRoYXQgYWxsXG4gIC8vIGZvbGxvdy11cCBtdWx0aS1zdHlsaW5nIGVudHJpZXMgYXJlIG9ic29sZXRlIGFuZCB3aWxsIGJlIGV4YW1pbmVkIGFnYWluIHdoZW4gQ0QgcnVuc1xuICAvLyB0aGVtLiBJZiBhIHNoYXBlIGNoYW5nZSBoYXMgbm90IG9jY3VycmVkIHRoZW4gdGhlcmUgaXMgbm8gcmVhc29uIHRvIGNoZWNrIGFueSBvdGhlclxuICAvLyBkaXJlY3RpdmUgdmFsdWVzIGlmIHRoZWlyIGlkZW50aXR5IGhhcyBub3QgY2hhbmdlZC4gSWYgYSBwcmV2aW91cyBkaXJlY3RpdmUgc2V0IHRoaXNcbiAgLy8gdmFsdWUgYXMgZGlydHkgKGJlY2F1c2UgaXRzIG93biBzaGFwZSBjaGFuZ2VkKSB0aGVuIHRoaXMgbWVhbnMgdGhhdCB0aGUgb2JqZWN0IGhhcyBiZWVuXG4gIC8vIG9mZnNldCB0byBhIGRpZmZlcmVudCBhcmVhIGluIHRoZSBjb250ZXh0LiBCZWNhdXNlIGl0cyB2YWx1ZSBoYXMgYmVlbiBvZmZzZXQgdGhlbiBpdFxuICAvLyBjYW4ndCB3cml0ZSB0byBhIHJlZ2lvbiB0aGF0IGl0IHdyb3RlIHRvIGJlZm9yZSAod2hpY2ggbWF5IGhhdmUgYmVlbiBhcGFydCBvZiBhbm90aGVyXG4gIC8vIGRpcmVjdGl2ZSkgYW5kIHRoZXJlZm9yZSBpdHMgc2hhcGUgY2hhbmdlcyB0b28uXG4gIGxldCB2YWx1ZXNFbnRyeVNoYXBlQ2hhbmdlID1cbiAgICAgIGV4aXN0aW5nQ2FjaGVkVmFsdWVJc0RpcnR5IHx8ICgoIWV4aXN0aW5nQ2FjaGVkVmFsdWUgJiYgY2FjaGVWYWx1ZSkgPyB0cnVlIDogZmFsc2UpO1xuXG4gIGxldCB0b3RhbFVuaXF1ZVZhbHVlcyA9IDA7XG4gIGxldCB0b3RhbE5ld0FsbG9jYXRlZFNsb3RzID0gMDtcblxuICAvLyB0aGlzIGlzIGEgdHJpY2sgdG8gYXZvaWQgYnVpbGRpbmcge2tleTp2YWx1ZX0gbWFwIHdoZXJlIGFsbCB0aGUgdmFsdWVzXG4gIC8vIGFyZSBgdHJ1ZWAgKHRoaXMgaGFwcGVucyB3aGVuIGEgY2xhc3NOYW1lIHN0cmluZyBpcyBwcm92aWRlZCBpbnN0ZWFkIG9mIGFcbiAgLy8gbWFwIGFzIGFuIGlucHV0IHZhbHVlIHRvIHRoaXMgc3R5bGluZyBhbGdvcml0aG0pXG4gIGNvbnN0IGFwcGx5QWxsUHJvcHMgPSB2YWx1ZXMgPT09IHRydWU7XG5cbiAgLy8gU1RFUCAxOlxuICAvLyBsb29wIHRocm91Z2ggdGhlIGVhcmxpZXIgZGlyZWN0aXZlcyBhbmQgZmlndXJlIG91dCBpZiBhbnkgcHJvcGVydGllcyBoZXJlIHdpbGwgYmUgcGxhY2VkXG4gIC8vIGluIHRoZWlyIGFyZWEgKHRoaXMgaGFwcGVucyB3aGVuIHRoZSB2YWx1ZSBpcyBudWxsIGJlY2F1c2UgdGhlIGVhcmxpZXIgZGlyZWN0aXZlIGVyYXNlZCBpdCkuXG4gIGxldCBjdHhJbmRleCA9IGN0eFN0YXJ0O1xuICBsZXQgdG90YWxSZW1haW5pbmdQcm9wZXJ0aWVzID0gcHJvcHMubGVuZ3RoO1xuICB3aGlsZSAoY3R4SW5kZXggPCBvd25lcnNoaXBWYWx1ZXNTdGFydEluZGV4KSB7XG4gICAgY29uc3QgY3VycmVudFByb3AgPSBnZXRQcm9wKGNvbnRleHQsIGN0eEluZGV4KTtcbiAgICBpZiAodG90YWxSZW1haW5pbmdQcm9wZXJ0aWVzKSB7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHByb3BzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IG1hcFByb3AgPSBwcm9wc1tpXTtcbiAgICAgICAgY29uc3Qgbm9ybWFsaXplZFByb3AgPSBtYXBQcm9wID8gKGVudHJ5SXNDbGFzc0Jhc2VkID8gbWFwUHJvcCA6IGh5cGhlbmF0ZShtYXBQcm9wKSkgOiBudWxsO1xuICAgICAgICBpZiAobm9ybWFsaXplZFByb3AgJiYgY3VycmVudFByb3AgPT09IG5vcm1hbGl6ZWRQcm9wKSB7XG4gICAgICAgICAgY29uc3QgY3VycmVudFZhbHVlID0gZ2V0VmFsdWUoY29udGV4dCwgY3R4SW5kZXgpO1xuICAgICAgICAgIGNvbnN0IGN1cnJlbnREaXJlY3RpdmVJbmRleCA9IGdldERpcmVjdGl2ZUluZGV4RnJvbUVudHJ5KGNvbnRleHQsIGN0eEluZGV4KTtcbiAgICAgICAgICBjb25zdCB2YWx1ZSA9IGFwcGx5QWxsUHJvcHMgPyB0cnVlIDogKHZhbHVlcyBhc3tba2V5OiBzdHJpbmddOiBhbnl9KVtub3JtYWxpemVkUHJvcF07XG4gICAgICAgICAgY29uc3QgY3VycmVudEZsYWcgPSBnZXRQb2ludGVycyhjb250ZXh0LCBjdHhJbmRleCk7XG4gICAgICAgICAgaWYgKGhhc1ZhbHVlQ2hhbmdlZChjdXJyZW50RmxhZywgY3VycmVudFZhbHVlLCB2YWx1ZSkgJiZcbiAgICAgICAgICAgICAgYWxsb3dWYWx1ZUNoYW5nZShjdXJyZW50VmFsdWUsIHZhbHVlLCBjdXJyZW50RGlyZWN0aXZlSW5kZXgsIGRpcmVjdGl2ZUluZGV4KSkge1xuICAgICAgICAgICAgc2V0VmFsdWUoY29udGV4dCwgY3R4SW5kZXgsIHZhbHVlKTtcbiAgICAgICAgICAgIHNldFBsYXllckJ1aWxkZXJJbmRleChjb250ZXh0LCBjdHhJbmRleCwgcGxheWVyQnVpbGRlckluZGV4LCBkaXJlY3RpdmVJbmRleCk7XG4gICAgICAgICAgICBpZiAoaGFzSW5pdGlhbFZhbHVlQ2hhbmdlZChjb250ZXh0LCBjdXJyZW50RmxhZywgdmFsdWUpKSB7XG4gICAgICAgICAgICAgIHNldERpcnR5KGNvbnRleHQsIGN0eEluZGV4LCB0cnVlKTtcbiAgICAgICAgICAgICAgZGlydHkgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBwcm9wc1tpXSA9IG51bGw7XG4gICAgICAgICAgdG90YWxSZW1haW5pbmdQcm9wZXJ0aWVzLS07XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgY3R4SW5kZXggKz0gU3R5bGluZ0luZGV4LlNpemU7XG4gIH1cblxuICAvLyBTVEVQIDI6XG4gIC8vIGFwcGx5IHRoZSBsZWZ0IG92ZXIgcHJvcGVydGllcyB0byB0aGUgY29udGV4dCBpbiB0aGUgY29ycmVjdCBvcmRlci5cbiAgaWYgKHRvdGFsUmVtYWluaW5nUHJvcGVydGllcykge1xuICAgIGNvbnN0IHNhbml0aXplciA9IGVudHJ5SXNDbGFzc0Jhc2VkID8gbnVsbCA6IGdldFN0eWxlU2FuaXRpemVyKGNvbnRleHQsIGRpcmVjdGl2ZUluZGV4KTtcbiAgICBwcm9wZXJ0aWVzTG9vcDogZm9yIChsZXQgaSA9IDA7IGkgPCBwcm9wcy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgbWFwUHJvcCA9IHByb3BzW2ldO1xuXG4gICAgICBpZiAoIW1hcFByb3ApIHtcbiAgICAgICAgLy8gdGhpcyBpcyBhbiBlYXJseSBleGl0IGluIGNhc2UgYSB2YWx1ZSB3YXMgYWxyZWFkeSBlbmNvdW50ZXJlZCBhYm92ZSBpbiB0aGVcbiAgICAgICAgLy8gcHJldmlvdXMgbG9vcCAod2hpY2ggbWVhbnMgdGhhdCB0aGUgcHJvcGVydHkgd2FzIGFwcGxpZWQgb3IgcmVqZWN0ZWQpXG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBjb25zdCB2YWx1ZSA9IGFwcGx5QWxsUHJvcHMgPyB0cnVlIDogKHZhbHVlcyBhc3tba2V5OiBzdHJpbmddOiBhbnl9KVttYXBQcm9wXTtcbiAgICAgIGNvbnN0IG5vcm1hbGl6ZWRQcm9wID0gZW50cnlJc0NsYXNzQmFzZWQgPyBtYXBQcm9wIDogaHlwaGVuYXRlKG1hcFByb3ApO1xuICAgICAgY29uc3QgaXNJbnNpZGVPd25lcnNoaXBBcmVhID0gY3R4SW5kZXggPj0gb3duZXJzaGlwVmFsdWVzU3RhcnRJbmRleDtcblxuICAgICAgZm9yIChsZXQgaiA9IGN0eEluZGV4OyBqIDwgY3R4RW5kOyBqICs9IFN0eWxpbmdJbmRleC5TaXplKSB7XG4gICAgICAgIGNvbnN0IGRpc3RhbnRDdHhQcm9wID0gZ2V0UHJvcChjb250ZXh0LCBqKTtcbiAgICAgICAgaWYgKGRpc3RhbnRDdHhQcm9wID09PSBub3JtYWxpemVkUHJvcCkge1xuICAgICAgICAgIGNvbnN0IGRpc3RhbnRDdHhEaXJlY3RpdmVJbmRleCA9IGdldERpcmVjdGl2ZUluZGV4RnJvbUVudHJ5KGNvbnRleHQsIGopO1xuICAgICAgICAgIGNvbnN0IGRpc3RhbnRDdHhQbGF5ZXJCdWlsZGVySW5kZXggPSBnZXRQbGF5ZXJCdWlsZGVySW5kZXgoY29udGV4dCwgaik7XG4gICAgICAgICAgY29uc3QgZGlzdGFudEN0eFZhbHVlID0gZ2V0VmFsdWUoY29udGV4dCwgaik7XG4gICAgICAgICAgY29uc3QgZGlzdGFudEN0eEZsYWcgPSBnZXRQb2ludGVycyhjb250ZXh0LCBqKTtcblxuICAgICAgICAgIGlmIChhbGxvd1ZhbHVlQ2hhbmdlKGRpc3RhbnRDdHhWYWx1ZSwgdmFsdWUsIGRpc3RhbnRDdHhEaXJlY3RpdmVJbmRleCwgZGlyZWN0aXZlSW5kZXgpKSB7XG4gICAgICAgICAgICAvLyBldmVuIGlmIHRoZSBlbnRyeSBpc24ndCB1cGRhdGVkIChieSB2YWx1ZSBvciBkaXJlY3RpdmVJbmRleCkgdGhlblxuICAgICAgICAgICAgLy8gaXQgc2hvdWxkIHN0aWxsIGJlIG1vdmVkIG92ZXIgdG8gdGhlIGNvcnJlY3Qgc3BvdCBpbiB0aGUgYXJyYXkgc29cbiAgICAgICAgICAgIC8vIHRoZSBpdGVyYXRpb24gbG9vcCBpcyB0aWdodGVyLlxuICAgICAgICAgICAgaWYgKGlzSW5zaWRlT3duZXJzaGlwQXJlYSkge1xuICAgICAgICAgICAgICBzd2FwTXVsdGlDb250ZXh0RW50cmllcyhjb250ZXh0LCBjdHhJbmRleCwgaik7XG4gICAgICAgICAgICAgIHRvdGFsVW5pcXVlVmFsdWVzKys7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChoYXNWYWx1ZUNoYW5nZWQoZGlzdGFudEN0eEZsYWcsIGRpc3RhbnRDdHhWYWx1ZSwgdmFsdWUpKSB7XG4gICAgICAgICAgICAgIGlmICh2YWx1ZSA9PT0gbnVsbCB8fCB2YWx1ZSA9PT0gdW5kZWZpbmVkICYmIHZhbHVlICE9PSBkaXN0YW50Q3R4VmFsdWUpIHtcbiAgICAgICAgICAgICAgICB2YWx1ZXNFbnRyeVNoYXBlQ2hhbmdlID0gdHJ1ZTtcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIHNldFZhbHVlKGNvbnRleHQsIGN0eEluZGV4LCB2YWx1ZSk7XG5cbiAgICAgICAgICAgICAgLy8gU0tJUCBJRiBJTklUSUFMIENIRUNLXG4gICAgICAgICAgICAgIC8vIElmIHRoZSBmb3JtZXIgYHZhbHVlYCBpcyBgbnVsbGAgdGhlbiBpdCBtZWFucyB0aGF0IGFuIGluaXRpYWwgdmFsdWVcbiAgICAgICAgICAgICAgLy8gY291bGQgYmUgYmVpbmcgcmVuZGVyZWQgb24gc2NyZWVuLiBJZiB0aGF0IGlzIHRoZSBjYXNlIHRoZW4gdGhlcmUgaXNcbiAgICAgICAgICAgICAgLy8gbm8gcG9pbnQgaW4gdXBkYXRpbmcgdGhlIHZhbHVlIGluIGNhc2UgaXQgbWF0Y2hlcy4gSW4gb3RoZXIgd29yZHMgaWYgdGhlXG4gICAgICAgICAgICAgIC8vIG5ldyB2YWx1ZSBpcyB0aGUgZXhhY3Qgc2FtZSBhcyB0aGUgcHJldmlvdXNseSByZW5kZXJlZCB2YWx1ZSAod2hpY2hcbiAgICAgICAgICAgICAgLy8gaGFwcGVucyB0byBiZSB0aGUgaW5pdGlhbCB2YWx1ZSkgdGhlbiBkbyBub3RoaW5nLlxuICAgICAgICAgICAgICBpZiAoZGlzdGFudEN0eFZhbHVlICE9PSBudWxsIHx8XG4gICAgICAgICAgICAgICAgICBoYXNJbml0aWFsVmFsdWVDaGFuZ2VkKGNvbnRleHQsIGRpc3RhbnRDdHhGbGFnLCB2YWx1ZSkpIHtcbiAgICAgICAgICAgICAgICBzZXREaXJ0eShjb250ZXh0LCBjdHhJbmRleCwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgZGlydHkgPSB0cnVlO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChkaXN0YW50Q3R4RGlyZWN0aXZlSW5kZXggIT09IGRpcmVjdGl2ZUluZGV4IHx8XG4gICAgICAgICAgICAgICAgcGxheWVyQnVpbGRlckluZGV4ICE9PSBkaXN0YW50Q3R4UGxheWVyQnVpbGRlckluZGV4KSB7XG4gICAgICAgICAgICAgIHNldFBsYXllckJ1aWxkZXJJbmRleChjb250ZXh0LCBjdHhJbmRleCwgcGxheWVyQnVpbGRlckluZGV4LCBkaXJlY3RpdmVJbmRleCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY3R4SW5kZXggKz0gU3R5bGluZ0luZGV4LlNpemU7XG4gICAgICAgICAgY29udGludWUgcHJvcGVydGllc0xvb3A7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gZmFsbGJhY2sgY2FzZSAuLi4gdmFsdWUgbm90IGZvdW5kIGF0IGFsbCBpbiB0aGUgY29udGV4dFxuICAgICAgaWYgKHZhbHVlICE9IG51bGwpIHtcbiAgICAgICAgdmFsdWVzRW50cnlTaGFwZUNoYW5nZSA9IHRydWU7XG4gICAgICAgIHRvdGFsVW5pcXVlVmFsdWVzKys7XG4gICAgICAgIGNvbnN0IGZsYWcgPSBwcmVwYXJlSW5pdGlhbEZsYWcoY29udGV4dCwgbm9ybWFsaXplZFByb3AsIGVudHJ5SXNDbGFzc0Jhc2VkLCBzYW5pdGl6ZXIpIHxcbiAgICAgICAgICAgIFN0eWxpbmdGbGFncy5EaXJ0eTtcblxuICAgICAgICBjb25zdCBpbnNlcnRpb25JbmRleCA9IGlzSW5zaWRlT3duZXJzaGlwQXJlYSA/XG4gICAgICAgICAgICBjdHhJbmRleCA6XG4gICAgICAgICAgICAob3duZXJzaGlwVmFsdWVzU3RhcnRJbmRleCArIHRvdGFsTmV3QWxsb2NhdGVkU2xvdHMgKiBTdHlsaW5nSW5kZXguU2l6ZSk7XG4gICAgICAgIGluc2VydE5ld011bHRpUHJvcGVydHkoXG4gICAgICAgICAgICBjb250ZXh0LCBpbnNlcnRpb25JbmRleCwgZW50cnlJc0NsYXNzQmFzZWQsIG5vcm1hbGl6ZWRQcm9wLCBmbGFnLCB2YWx1ZSwgZGlyZWN0aXZlSW5kZXgsXG4gICAgICAgICAgICBwbGF5ZXJCdWlsZGVySW5kZXgpO1xuXG4gICAgICAgIHRvdGFsTmV3QWxsb2NhdGVkU2xvdHMrKztcbiAgICAgICAgY3R4RW5kICs9IFN0eWxpbmdJbmRleC5TaXplO1xuICAgICAgICBjdHhJbmRleCArPSBTdHlsaW5nSW5kZXguU2l6ZTtcblxuICAgICAgICBkaXJ0eSA9IHRydWU7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8gU1RFUCAzOlxuICAvLyBSZW1vdmUgKG51bGxpZnkpIGFueSBleGlzdGluZyBlbnRyaWVzIGluIHRoZSBjb250ZXh0IHRoYXQgd2VyZSBub3QgYXBhcnQgb2YgdGhlXG4gIC8vIG1hcCBpbnB1dCB2YWx1ZSB0aGF0IHdhcyBwYXNzZWQgaW50byB0aGlzIGFsZ29yaXRobSBmb3IgdGhpcyBkaXJlY3RpdmUuXG4gIHdoaWxlIChjdHhJbmRleCA8IGN0eEVuZCkge1xuICAgIHZhbHVlc0VudHJ5U2hhcGVDaGFuZ2UgPSB0cnVlOyAgLy8gc29tZSB2YWx1ZXMgYXJlIG1pc3NpbmdcbiAgICBjb25zdCBjdHhWYWx1ZSA9IGdldFZhbHVlKGNvbnRleHQsIGN0eEluZGV4KTtcbiAgICBjb25zdCBjdHhGbGFnID0gZ2V0UG9pbnRlcnMoY29udGV4dCwgY3R4SW5kZXgpO1xuICAgIGNvbnN0IGN0eERpcmVjdGl2ZSA9IGdldERpcmVjdGl2ZUluZGV4RnJvbUVudHJ5KGNvbnRleHQsIGN0eEluZGV4KTtcbiAgICBpZiAoY3R4VmFsdWUgIT0gbnVsbCkge1xuICAgICAgdmFsdWVzRW50cnlTaGFwZUNoYW5nZSA9IHRydWU7XG4gICAgfVxuICAgIGlmIChoYXNWYWx1ZUNoYW5nZWQoY3R4RmxhZywgY3R4VmFsdWUsIG51bGwpKSB7XG4gICAgICBzZXRWYWx1ZShjb250ZXh0LCBjdHhJbmRleCwgbnVsbCk7XG4gICAgICAvLyBvbmx5IGlmIHRoZSBpbml0aWFsIHZhbHVlIGlzIGZhbHN5IHRoZW5cbiAgICAgIGlmIChoYXNJbml0aWFsVmFsdWVDaGFuZ2VkKGNvbnRleHQsIGN0eEZsYWcsIGN0eFZhbHVlKSkge1xuICAgICAgICBzZXREaXJ0eShjb250ZXh0LCBjdHhJbmRleCwgdHJ1ZSk7XG4gICAgICAgIGRpcnR5ID0gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIHNldFBsYXllckJ1aWxkZXJJbmRleChjb250ZXh0LCBjdHhJbmRleCwgcGxheWVyQnVpbGRlckluZGV4LCBkaXJlY3RpdmVJbmRleCk7XG4gICAgfVxuICAgIGN0eEluZGV4ICs9IFN0eWxpbmdJbmRleC5TaXplO1xuICB9XG5cbiAgLy8gQmVjYXVzZSB0aGUgb2JqZWN0IHNoYXBlIGhhcyBjaGFuZ2VkLCB0aGlzIG1lYW5zIHRoYXQgYWxsIGZvbGxvdy11cCBkaXJlY3RpdmVzIHdpbGwgbmVlZCB0b1xuICAvLyByZWFwcGx5IHRoZWlyIHZhbHVlcyBpbnRvIHRoZSBvYmplY3QuIEZvciB0aGlzIHRvIGhhcHBlbiwgdGhlIGNhY2hlZCBhcnJheSBuZWVkcyB0byBiZSB1cGRhdGVkXG4gIC8vIHdpdGggZGlydHkgZmxhZ3Mgc28gdGhhdCBmb2xsb3ctdXAgY2FsbHMgdG8gYHVwZGF0ZVN0eWxpbmdNYXBgIHdpbGwgcmVhcHBseSB0aGVpciBzdHlsaW5nIGNvZGUuXG4gIC8vIHRoZSByZWFwcGxpY2F0aW9uIG9mIHN0eWxpbmcgY29kZSB3aXRoaW4gdGhlIGNvbnRleHQgd2lsbCByZXNoYXBlIGl0IGFuZCB1cGRhdGUgdGhlIG9mZnNldFxuICAvLyB2YWx1ZXMgKGFsc28gZm9sbG93LXVwIGRpcmVjdGl2ZXMgY2FuIHdyaXRlIG5ldyB2YWx1ZXMgaW4gY2FzZSBlYXJsaWVyIGRpcmVjdGl2ZXMgc2V0IGFueXRoaW5nXG4gIC8vIHRvIG51bGwgZHVlIHRvIHJlbW92YWxzIG9yIGZhbHN5IHZhbHVlcykuXG4gIHZhbHVlc0VudHJ5U2hhcGVDaGFuZ2UgPSB2YWx1ZXNFbnRyeVNoYXBlQ2hhbmdlIHx8IGV4aXN0aW5nQ2FjaGVkVmFsdWVDb3VudCAhPT0gdG90YWxVbmlxdWVWYWx1ZXM7XG4gIHVwZGF0ZUNhY2hlZE1hcFZhbHVlKFxuICAgICAgY29udGV4dCwgZGlyZWN0aXZlSW5kZXgsIGVudHJ5SXNDbGFzc0Jhc2VkLCBjYWNoZVZhbHVlLCBvd25lcnNoaXBWYWx1ZXNTdGFydEluZGV4LCBjdHhFbmQsXG4gICAgICB0b3RhbFVuaXF1ZVZhbHVlcywgdmFsdWVzRW50cnlTaGFwZUNoYW5nZSk7XG5cbiAgaWYgKGRpcnR5KSB7XG4gICAgc2V0Q29udGV4dERpcnR5KGNvbnRleHQsIHRydWUpO1xuICB9XG5cbiAgcmV0dXJuIHRvdGFsTmV3QWxsb2NhdGVkU2xvdHM7XG59XG5cbi8qKlxuICogU2V0cyBhbmQgcmVzb2x2ZXMgYSBzaW5nbGUgY2xhc3MgdmFsdWUgb24gdGhlIHByb3ZpZGVkIGBTdHlsaW5nQ29udGV4dGAgc29cbiAqIHRoYXQgdGhleSBjYW4gYmUgYXBwbGllZCB0byB0aGUgZWxlbWVudCBvbmNlIGByZW5kZXJTdHlsaW5nYCBpcyBjYWxsZWQuXG4gKlxuICogQHBhcmFtIGNvbnRleHQgVGhlIHN0eWxpbmcgY29udGV4dCB0aGF0IHdpbGwgYmUgdXBkYXRlZCB3aXRoIHRoZVxuICogICAgbmV3bHkgcHJvdmlkZWQgY2xhc3MgdmFsdWUuXG4gKiBAcGFyYW0gb2Zmc2V0IFRoZSBpbmRleCBvZiB0aGUgQ1NTIGNsYXNzIHdoaWNoIGlzIGJlaW5nIHVwZGF0ZWQuXG4gKiBAcGFyYW0gYWRkT3JSZW1vdmUgV2hldGhlciBvciBub3QgdG8gYWRkIG9yIHJlbW92ZSB0aGUgQ1NTIGNsYXNzXG4gKiBAcGFyYW0gZm9yY2VPdmVycmlkZSB3aGV0aGVyIG9yIG5vdCB0byBza2lwIGFsbCBkaXJlY3RpdmUgcHJpb3JpdGl6YXRpb25cbiAqICAgIGFuZCBqdXN0IGFwcGx5IHRoZSB2YWx1ZSByZWdhcmRsZXNzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gdXBkYXRlQ2xhc3NQcm9wKFxuICAgIGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBvZmZzZXQ6IG51bWJlcixcbiAgICBpbnB1dDogYm9vbGVhbiB8IEJvdW5kUGxheWVyRmFjdG9yeTxib29sZWFufG51bGw+fCBudWxsLCBkaXJlY3RpdmVJbmRleDogbnVtYmVyID0gMCxcbiAgICBmb3JjZU92ZXJyaWRlPzogYm9vbGVhbik6IHZvaWQge1xuICB1cGRhdGVTaW5nbGVTdHlsaW5nVmFsdWUoY29udGV4dCwgb2Zmc2V0LCBpbnB1dCwgdHJ1ZSwgZGlyZWN0aXZlSW5kZXgsIGZvcmNlT3ZlcnJpZGUpO1xufVxuXG4vKipcbiAqIFNldHMgYW5kIHJlc29sdmVzIGEgc2luZ2xlIHN0eWxlIHZhbHVlIG9uIHRoZSBwcm92aWRlZCBgU3R5bGluZ0NvbnRleHRgIHNvXG4gKiB0aGF0IHRoZXkgY2FuIGJlIGFwcGxpZWQgdG8gdGhlIGVsZW1lbnQgb25jZSBgcmVuZGVyU3R5bGluZ2AgaXMgY2FsbGVkLlxuICpcbiAqIE5vdGUgdGhhdCBwcm9wLWxldmVsIHN0eWxpbmcgdmFsdWVzIGFyZSBjb25zaWRlcmVkIGhpZ2hlciBwcmlvcml0eSB0aGFuIGFueSBzdHlsaW5nIHRoYXRcbiAqIGhhcyBiZWVuIGFwcGxpZWQgdXNpbmcgYHVwZGF0ZVN0eWxpbmdNYXBgLCB0aGVyZWZvcmUsIHdoZW4gc3R5bGluZyB2YWx1ZXMgYXJlIHJlbmRlcmVkXG4gKiB0aGVuIGFueSBzdHlsZXMvY2xhc3NlcyB0aGF0IGhhdmUgYmVlbiBhcHBsaWVkIHVzaW5nIHRoaXMgZnVuY3Rpb24gd2lsbCBiZSBjb25zaWRlcmVkIGZpcnN0XG4gKiAodGhlbiBtdWx0aSB2YWx1ZXMgc2Vjb25kIGFuZCB0aGVuIGluaXRpYWwgdmFsdWVzIGFzIGEgYmFja3VwKS5cbiAqXG4gKiBAcGFyYW0gY29udGV4dCBUaGUgc3R5bGluZyBjb250ZXh0IHRoYXQgd2lsbCBiZSB1cGRhdGVkIHdpdGggdGhlXG4gKiAgICBuZXdseSBwcm92aWRlZCBzdHlsZSB2YWx1ZS5cbiAqIEBwYXJhbSBvZmZzZXQgVGhlIGluZGV4IG9mIHRoZSBwcm9wZXJ0eSB3aGljaCBpcyBiZWluZyB1cGRhdGVkLlxuICogQHBhcmFtIHZhbHVlIFRoZSBDU1Mgc3R5bGUgdmFsdWUgdGhhdCB3aWxsIGJlIGFzc2lnbmVkXG4gKiBAcGFyYW0gZm9yY2VPdmVycmlkZSB3aGV0aGVyIG9yIG5vdCB0byBza2lwIGFsbCBkaXJlY3RpdmUgcHJpb3JpdGl6YXRpb25cbiAqICAgIGFuZCBqdXN0IGFwcGx5IHRoZSB2YWx1ZSByZWdhcmRsZXNzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gdXBkYXRlU3R5bGVQcm9wKFxuICAgIGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBvZmZzZXQ6IG51bWJlcixcbiAgICBpbnB1dDogc3RyaW5nIHwgYm9vbGVhbiB8IG51bGwgfCBCb3VuZFBsYXllckZhY3Rvcnk8c3RyaW5nfGJvb2xlYW58bnVsbD4sXG4gICAgZGlyZWN0aXZlSW5kZXg6IG51bWJlciA9IDAsIGZvcmNlT3ZlcnJpZGU/OiBib29sZWFuKTogdm9pZCB7XG4gIHVwZGF0ZVNpbmdsZVN0eWxpbmdWYWx1ZShjb250ZXh0LCBvZmZzZXQsIGlucHV0LCBmYWxzZSwgZGlyZWN0aXZlSW5kZXgsIGZvcmNlT3ZlcnJpZGUpO1xufVxuXG5mdW5jdGlvbiB1cGRhdGVTaW5nbGVTdHlsaW5nVmFsdWUoXG4gICAgY29udGV4dDogU3R5bGluZ0NvbnRleHQsIG9mZnNldDogbnVtYmVyLFxuICAgIGlucHV0OiBzdHJpbmcgfCBib29sZWFuIHwgbnVsbCB8IEJvdW5kUGxheWVyRmFjdG9yeTxzdHJpbmd8Ym9vbGVhbnxudWxsPiwgaXNDbGFzc0Jhc2VkOiBib29sZWFuLFxuICAgIGRpcmVjdGl2ZUluZGV4OiBudW1iZXIsIGZvcmNlT3ZlcnJpZGU/OiBib29sZWFuKTogdm9pZCB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRWYWxpZERpcmVjdGl2ZUluZGV4KGNvbnRleHQsIGRpcmVjdGl2ZUluZGV4KTtcbiAgY29uc3Qgc2luZ2xlSW5kZXggPSBnZXRTaW5nbGVQcm9wSW5kZXhWYWx1ZShjb250ZXh0LCBkaXJlY3RpdmVJbmRleCwgb2Zmc2V0LCBpc0NsYXNzQmFzZWQpO1xuICBjb25zdCBjdXJyVmFsdWUgPSBnZXRWYWx1ZShjb250ZXh0LCBzaW5nbGVJbmRleCk7XG4gIGNvbnN0IGN1cnJGbGFnID0gZ2V0UG9pbnRlcnMoY29udGV4dCwgc2luZ2xlSW5kZXgpO1xuICBjb25zdCBjdXJyRGlyZWN0aXZlID0gZ2V0RGlyZWN0aXZlSW5kZXhGcm9tRW50cnkoY29udGV4dCwgc2luZ2xlSW5kZXgpO1xuICBjb25zdCB2YWx1ZTogc3RyaW5nfGJvb2xlYW58bnVsbCA9IChpbnB1dCBpbnN0YW5jZW9mIEJvdW5kUGxheWVyRmFjdG9yeSkgPyBpbnB1dC52YWx1ZSA6IGlucHV0O1xuXG4gIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUuc3R5bGluZ1Byb3ArKztcblxuICBpZiAoaGFzVmFsdWVDaGFuZ2VkKGN1cnJGbGFnLCBjdXJyVmFsdWUsIHZhbHVlKSAmJlxuICAgICAgKGZvcmNlT3ZlcnJpZGUgfHwgYWxsb3dWYWx1ZUNoYW5nZShjdXJyVmFsdWUsIHZhbHVlLCBjdXJyRGlyZWN0aXZlLCBkaXJlY3RpdmVJbmRleCkpKSB7XG4gICAgY29uc3QgaXNDbGFzc0Jhc2VkID0gKGN1cnJGbGFnICYgU3R5bGluZ0ZsYWdzLkNsYXNzKSA9PT0gU3R5bGluZ0ZsYWdzLkNsYXNzO1xuICAgIGNvbnN0IGVsZW1lbnQgPSBjb250ZXh0W1N0eWxpbmdJbmRleC5FbGVtZW50UG9zaXRpb25dICFhcyBIVE1MRWxlbWVudDtcbiAgICBjb25zdCBwbGF5ZXJCdWlsZGVyID0gaW5wdXQgaW5zdGFuY2VvZiBCb3VuZFBsYXllckZhY3RvcnkgP1xuICAgICAgICBuZXcgQ2xhc3NBbmRTdHlsZVBsYXllckJ1aWxkZXIoXG4gICAgICAgICAgICBpbnB1dCBhcyBhbnksIGVsZW1lbnQsIGlzQ2xhc3NCYXNlZCA/IEJpbmRpbmdUeXBlLkNsYXNzIDogQmluZGluZ1R5cGUuU3R5bGUpIDpcbiAgICAgICAgbnVsbDtcbiAgICBjb25zdCB2YWx1ZSA9IChwbGF5ZXJCdWlsZGVyID8gKGlucHV0IGFzIEJvdW5kUGxheWVyRmFjdG9yeTxhbnk+KS52YWx1ZSA6IGlucHV0KSBhcyBzdHJpbmcgfFxuICAgICAgICBib29sZWFuIHwgbnVsbDtcbiAgICBjb25zdCBjdXJyUGxheWVySW5kZXggPSBnZXRQbGF5ZXJCdWlsZGVySW5kZXgoY29udGV4dCwgc2luZ2xlSW5kZXgpO1xuXG4gICAgbGV0IHBsYXllckJ1aWxkZXJzQXJlRGlydHkgPSBmYWxzZTtcbiAgICBsZXQgcGxheWVyQnVpbGRlckluZGV4ID0gcGxheWVyQnVpbGRlciA/IGN1cnJQbGF5ZXJJbmRleCA6IDA7XG4gICAgaWYgKGhhc1BsYXllckJ1aWxkZXJDaGFuZ2VkKGNvbnRleHQsIHBsYXllckJ1aWxkZXIsIGN1cnJQbGF5ZXJJbmRleCkpIHtcbiAgICAgIGNvbnN0IG5ld0luZGV4ID0gc2V0UGxheWVyQnVpbGRlcihjb250ZXh0LCBwbGF5ZXJCdWlsZGVyLCBjdXJyUGxheWVySW5kZXgpO1xuICAgICAgcGxheWVyQnVpbGRlckluZGV4ID0gcGxheWVyQnVpbGRlciA/IG5ld0luZGV4IDogMDtcbiAgICAgIHBsYXllckJ1aWxkZXJzQXJlRGlydHkgPSB0cnVlO1xuICAgIH1cblxuICAgIGlmIChwbGF5ZXJCdWlsZGVyc0FyZURpcnR5IHx8IGN1cnJEaXJlY3RpdmUgIT09IGRpcmVjdGl2ZUluZGV4KSB7XG4gICAgICBzZXRQbGF5ZXJCdWlsZGVySW5kZXgoY29udGV4dCwgc2luZ2xlSW5kZXgsIHBsYXllckJ1aWxkZXJJbmRleCwgZGlyZWN0aXZlSW5kZXgpO1xuICAgIH1cblxuICAgIGlmIChjdXJyRGlyZWN0aXZlICE9PSBkaXJlY3RpdmVJbmRleCkge1xuICAgICAgY29uc3QgcHJvcCA9IGdldFByb3AoY29udGV4dCwgc2luZ2xlSW5kZXgpO1xuICAgICAgY29uc3Qgc2FuaXRpemVyID0gZ2V0U3R5bGVTYW5pdGl6ZXIoY29udGV4dCwgZGlyZWN0aXZlSW5kZXgpO1xuICAgICAgc2V0U2FuaXRpemVGbGFnKGNvbnRleHQsIHNpbmdsZUluZGV4LCAoc2FuaXRpemVyICYmIHNhbml0aXplcihwcm9wKSkgPyB0cnVlIDogZmFsc2UpO1xuICAgIH1cblxuICAgIC8vIHRoZSB2YWx1ZSB3aWxsIGFsd2F5cyBnZXQgdXBkYXRlZCAoZXZlbiBpZiB0aGUgZGlydHkgZmxhZyBpcyBza2lwcGVkKVxuICAgIHNldFZhbHVlKGNvbnRleHQsIHNpbmdsZUluZGV4LCB2YWx1ZSk7XG4gICAgY29uc3QgaW5kZXhGb3JNdWx0aSA9IGdldE11bHRpT3JTaW5nbGVJbmRleChjdXJyRmxhZyk7XG5cbiAgICAvLyBpZiB0aGUgdmFsdWUgaXMgdGhlIHNhbWUgaW4gdGhlIG11bHRpLWFyZWEgdGhlbiB0aGVyZSdzIG5vIHBvaW50IGluIHJlLWFzc2VtYmxpbmdcbiAgICBjb25zdCB2YWx1ZUZvck11bHRpID0gZ2V0VmFsdWUoY29udGV4dCwgaW5kZXhGb3JNdWx0aSk7XG4gICAgaWYgKCF2YWx1ZUZvck11bHRpIHx8IGhhc1ZhbHVlQ2hhbmdlZChjdXJyRmxhZywgdmFsdWVGb3JNdWx0aSwgdmFsdWUpKSB7XG4gICAgICBsZXQgbXVsdGlEaXJ0eSA9IGZhbHNlO1xuICAgICAgbGV0IHNpbmdsZURpcnR5ID0gdHJ1ZTtcblxuICAgICAgLy8gb25seSB3aGVuIHRoZSB2YWx1ZSBpcyBzZXQgdG8gYG51bGxgIHNob3VsZCB0aGUgbXVsdGktdmFsdWUgZ2V0IGZsYWdnZWRcbiAgICAgIGlmICghdmFsdWVFeGlzdHModmFsdWUsIGlzQ2xhc3NCYXNlZCkgJiYgdmFsdWVFeGlzdHModmFsdWVGb3JNdWx0aSwgaXNDbGFzc0Jhc2VkKSkge1xuICAgICAgICBtdWx0aURpcnR5ID0gdHJ1ZTtcbiAgICAgICAgc2luZ2xlRGlydHkgPSBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgc2V0RGlydHkoY29udGV4dCwgaW5kZXhGb3JNdWx0aSwgbXVsdGlEaXJ0eSk7XG4gICAgICBzZXREaXJ0eShjb250ZXh0LCBzaW5nbGVJbmRleCwgc2luZ2xlRGlydHkpO1xuICAgICAgc2V0Q29udGV4dERpcnR5KGNvbnRleHQsIHRydWUpO1xuICAgIH1cblxuICAgIGlmIChwbGF5ZXJCdWlsZGVyc0FyZURpcnR5KSB7XG4gICAgICBzZXRDb250ZXh0UGxheWVyc0RpcnR5KGNvbnRleHQsIHRydWUpO1xuICAgIH1cblxuICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUuc3R5bGluZ1Byb3BDYWNoZU1pc3MrKztcbiAgfVxufVxuXG5cbi8qKlxuICogUmVuZGVycyBhbGwgcXVldWVkIHN0eWxpbmcgdXNpbmcgYSByZW5kZXJlciBvbnRvIHRoZSBnaXZlbiBlbGVtZW50LlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gd29ya3MgYnkgcmVuZGVyaW5nIGFueSBzdHlsZXMgKHRoYXQgaGF2ZSBiZWVuIGFwcGxpZWRcbiAqIHVzaW5nIGB1cGRhdGVTdHlsaW5nTWFwYCkgYW5kIGFueSBjbGFzc2VzICh0aGF0IGhhdmUgYmVlbiBhcHBsaWVkIHVzaW5nXG4gKiBgdXBkYXRlU3R5bGVQcm9wYCkgb250byB0aGUgcHJvdmlkZWQgZWxlbWVudCB1c2luZyB0aGUgcHJvdmlkZWQgcmVuZGVyZXIuXG4gKiBKdXN0IGJlZm9yZSB0aGUgc3R5bGVzL2NsYXNzZXMgYXJlIHJlbmRlcmVkIGEgZmluYWwga2V5L3ZhbHVlIHN0eWxlIG1hcFxuICogd2lsbCBiZSBhc3NlbWJsZWQgKGlmIGBzdHlsZVN0b3JlYCBvciBgY2xhc3NTdG9yZWAgYXJlIHByb3ZpZGVkKS5cbiAqXG4gKiBAcGFyYW0gbEVsZW1lbnQgdGhlIGVsZW1lbnQgdGhhdCB0aGUgc3R5bGVzIHdpbGwgYmUgcmVuZGVyZWQgb25cbiAqIEBwYXJhbSBjb250ZXh0IFRoZSBzdHlsaW5nIGNvbnRleHQgdGhhdCB3aWxsIGJlIHVzZWQgdG8gZGV0ZXJtaW5lXG4gKiAgICAgIHdoYXQgc3R5bGVzIHdpbGwgYmUgcmVuZGVyZWRcbiAqIEBwYXJhbSByZW5kZXJlciB0aGUgcmVuZGVyZXIgdGhhdCB3aWxsIGJlIHVzZWQgdG8gYXBwbHkgdGhlIHN0eWxpbmdcbiAqIEBwYXJhbSBjbGFzc2VzU3RvcmUgaWYgcHJvdmlkZWQsIHRoZSB1cGRhdGVkIGNsYXNzIHZhbHVlcyB3aWxsIGJlIGFwcGxpZWRcbiAqICAgIHRvIHRoaXMga2V5L3ZhbHVlIG1hcCBpbnN0ZWFkIG9mIGJlaW5nIHJlbmRlcmVyZWQgdmlhIHRoZSByZW5kZXJlci5cbiAqIEBwYXJhbSBzdHlsZXNTdG9yZSBpZiBwcm92aWRlZCwgdGhlIHVwZGF0ZWQgc3R5bGUgdmFsdWVzIHdpbGwgYmUgYXBwbGllZFxuICogICAgdG8gdGhpcyBrZXkvdmFsdWUgbWFwIGluc3RlYWQgb2YgYmVpbmcgcmVuZGVyZXJlZCB2aWEgdGhlIHJlbmRlcmVyLlxuICogQHJldHVybnMgbnVtYmVyIHRoZSB0b3RhbCBhbW91bnQgb2YgcGxheWVycyB0aGF0IGdvdCBxdWV1ZWQgZm9yIGFuaW1hdGlvbiAoaWYgYW55KVxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVuZGVyU3R5bGluZyhcbiAgICBjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgcmVuZGVyZXI6IFJlbmRlcmVyMyB8IG51bGwsIHJvb3RPclZpZXc6IFJvb3RDb250ZXh0IHwgTFZpZXcsXG4gICAgaXNGaXJzdFJlbmRlcjogYm9vbGVhbiwgY2xhc3Nlc1N0b3JlPzogQmluZGluZ1N0b3JlIHwgbnVsbCwgc3R5bGVzU3RvcmU/OiBCaW5kaW5nU3RvcmUgfCBudWxsLFxuICAgIGRpcmVjdGl2ZUluZGV4OiBudW1iZXIgPSAwKTogbnVtYmVyIHtcbiAgbGV0IHRvdGFsUGxheWVyc1F1ZXVlZCA9IDA7XG4gIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUuc3R5bGluZ0FwcGx5Kys7XG5cbiAgLy8gdGhpcyBwcmV2ZW50cyBtdWx0aXBsZSBhdHRlbXB0cyB0byByZW5kZXIgc3R5bGUvY2xhc3MgdmFsdWVzIG9uXG4gIC8vIHRoZSBzYW1lIGVsZW1lbnQuLi5cbiAgaWYgKGFsbG93SG9zdEluc3RydWN0aW9uc1F1ZXVlRmx1c2goY29udGV4dCwgZGlyZWN0aXZlSW5kZXgpKSB7XG4gICAgLy8gYWxsIHN0eWxpbmcgaW5zdHJ1Y3Rpb25zIHByZXNlbnQgd2l0aGluIGFueSBob3N0QmluZGluZ3MgZnVuY3Rpb25zXG4gICAgLy8gZG8gbm90IHVwZGF0ZSB0aGUgY29udGV4dCBpbW1lZGlhdGVseSB3aGVuIGNhbGxlZC4gVGhleSBhcmUgaW5zdGVhZFxuICAgIC8vIHF1ZXVlZCB1cCBhbmQgYXBwbGllZCB0byB0aGUgY29udGV4dCByaWdodCBhdCB0aGlzIHBvaW50LiBXaHk/IFRoaXNcbiAgICAvLyBpcyBiZWNhdXNlIEFuZ3VsYXIgZXZhbHVhdGVzIGNvbXBvbmVudC9kaXJlY3RpdmUgYW5kIGRpcmVjdGl2ZVxuICAgIC8vIHN1Yi1jbGFzcyBjb2RlIGF0IGRpZmZlcmVudCBwb2ludHMgYW5kIGl0J3MgaW1wb3J0YW50IHRoYXQgdGhlXG4gICAgLy8gc3R5bGluZyB2YWx1ZXMgYXJlIGFwcGxpZWQgdG8gdGhlIGNvbnRleHQgaW4gdGhlIHJpZ2h0IG9yZGVyXG4gICAgLy8gKHNlZSBgaW50ZXJmYWNlcy9zdHlsaW5nLnRzYCBmb3IgbW9yZSBpbmZvcm1hdGlvbikuXG4gICAgZmx1c2hIb3N0SW5zdHJ1Y3Rpb25zUXVldWUoY29udGV4dCk7XG5cbiAgICBpZiAoaXNDb250ZXh0RGlydHkoY29udGV4dCkpIHtcbiAgICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUuc3R5bGluZ0FwcGx5Q2FjaGVNaXNzKys7XG5cbiAgICAgIC8vIHRoaXMgaXMgaGVyZSB0byBwcmV2ZW50IHRoaW5ncyBsaWtlIDxuZy1jb250YWluZXIgW3N0eWxlXSBbY2xhc3NdPi4uLjwvbmctY29udGFpbmVyPlxuICAgICAgLy8gb3IgaWYgdGhlcmUgYXJlIGFueSBob3N0IHN0eWxlIG9yIGNsYXNzIGJpbmRpbmdzIHByZXNlbnQgaW4gYSBkaXJlY3RpdmUgc2V0IG9uXG4gICAgICAvLyBhIGNvbnRhaW5lciBub2RlXG4gICAgICBjb25zdCBuYXRpdmUgPSBjb250ZXh0W1N0eWxpbmdJbmRleC5FbGVtZW50UG9zaXRpb25dICFhcyBIVE1MRWxlbWVudDtcblxuICAgICAgY29uc3QgZmx1c2hQbGF5ZXJCdWlsZGVyczogYW55ID1cbiAgICAgICAgICBjb250ZXh0W1N0eWxpbmdJbmRleC5NYXN0ZXJGbGFnUG9zaXRpb25dICYgU3R5bGluZ0ZsYWdzLlBsYXllckJ1aWxkZXJzRGlydHk7XG4gICAgICBjb25zdCBtdWx0aVN0YXJ0SW5kZXggPSBnZXRNdWx0aVN0eWxlc1N0YXJ0SW5kZXgoY29udGV4dCk7XG5cbiAgICAgIGZvciAobGV0IGkgPSBTdHlsaW5nSW5kZXguU2luZ2xlU3R5bGVzU3RhcnRQb3NpdGlvbjsgaSA8IGNvbnRleHQubGVuZ3RoO1xuICAgICAgICAgICBpICs9IFN0eWxpbmdJbmRleC5TaXplKSB7XG4gICAgICAgIC8vIHRoZXJlIGlzIG5vIHBvaW50IGluIHJlbmRlcmluZyBzdHlsZXMgdGhhdCBoYXZlIG5vdCBjaGFuZ2VkIG9uIHNjcmVlblxuICAgICAgICBpZiAoaXNEaXJ0eShjb250ZXh0LCBpKSkge1xuICAgICAgICAgIGNvbnN0IGZsYWcgPSBnZXRQb2ludGVycyhjb250ZXh0LCBpKTtcbiAgICAgICAgICBjb25zdCBkaXJlY3RpdmVJbmRleCA9IGdldERpcmVjdGl2ZUluZGV4RnJvbUVudHJ5KGNvbnRleHQsIGkpO1xuICAgICAgICAgIGNvbnN0IHByb3AgPSBnZXRQcm9wKGNvbnRleHQsIGkpO1xuICAgICAgICAgIGNvbnN0IHZhbHVlID0gZ2V0VmFsdWUoY29udGV4dCwgaSk7XG4gICAgICAgICAgY29uc3Qgc3R5bGVTYW5pdGl6ZXIgPVxuICAgICAgICAgICAgICAoZmxhZyAmIFN0eWxpbmdGbGFncy5TYW5pdGl6ZSkgPyBnZXRTdHlsZVNhbml0aXplcihjb250ZXh0LCBkaXJlY3RpdmVJbmRleCkgOiBudWxsO1xuICAgICAgICAgIGNvbnN0IHBsYXllckJ1aWxkZXIgPSBnZXRQbGF5ZXJCdWlsZGVyKGNvbnRleHQsIGkpO1xuICAgICAgICAgIGNvbnN0IGlzQ2xhc3NCYXNlZCA9IGZsYWcgJiBTdHlsaW5nRmxhZ3MuQ2xhc3MgPyB0cnVlIDogZmFsc2U7XG4gICAgICAgICAgY29uc3QgaXNJblNpbmdsZVJlZ2lvbiA9IGkgPCBtdWx0aVN0YXJ0SW5kZXg7XG5cbiAgICAgICAgICBsZXQgdmFsdWVUb0FwcGx5OiBzdHJpbmd8Ym9vbGVhbnxudWxsID0gdmFsdWU7XG5cbiAgICAgICAgICAvLyBWQUxVRSBERUZFUiBDQVNFIDE6IFVzZSBhIG11bHRpIHZhbHVlIGluc3RlYWQgb2YgYSBudWxsIHNpbmdsZSB2YWx1ZVxuICAgICAgICAgIC8vIHRoaXMgY2hlY2sgaW1wbGllcyB0aGF0IGEgc2luZ2xlIHZhbHVlIHdhcyByZW1vdmVkIGFuZCB3ZVxuICAgICAgICAgIC8vIHNob3VsZCBub3cgZGVmZXIgdG8gYSBtdWx0aSB2YWx1ZSBhbmQgdXNlIHRoYXQgKGlmIHNldCkuXG4gICAgICAgICAgaWYgKGlzSW5TaW5nbGVSZWdpb24gJiYgIXZhbHVlRXhpc3RzKHZhbHVlVG9BcHBseSwgaXNDbGFzc0Jhc2VkKSkge1xuICAgICAgICAgICAgLy8gc2luZ2xlIHZhbHVlcyBBTFdBWVMgaGF2ZSBhIHJlZmVyZW5jZSB0byBhIG11bHRpIGluZGV4XG4gICAgICAgICAgICBjb25zdCBtdWx0aUluZGV4ID0gZ2V0TXVsdGlPclNpbmdsZUluZGV4KGZsYWcpO1xuICAgICAgICAgICAgdmFsdWVUb0FwcGx5ID0gZ2V0VmFsdWUoY29udGV4dCwgbXVsdGlJbmRleCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gVkFMVUUgREVGRVIgQ0FTRSAyOiBVc2UgdGhlIGluaXRpYWwgdmFsdWUgaWYgYWxsIGVsc2UgZmFpbHMgKGlzIGZhbHN5KVxuICAgICAgICAgIC8vIHRoZSBpbml0aWFsIHZhbHVlIHdpbGwgYWx3YXlzIGJlIGEgc3RyaW5nIG9yIG51bGwsXG4gICAgICAgICAgLy8gdGhlcmVmb3JlIHdlIGNhbiBzYWZlbHkgYWRvcHQgaXQgaW4gY2FzZSB0aGVyZSdzIG5vdGhpbmcgZWxzZVxuICAgICAgICAgIC8vIG5vdGUgdGhhdCB0aGlzIHNob3VsZCBhbHdheXMgYmUgYSBmYWxzeSBjaGVjayBzaW5jZSBgZmFsc2VgIGlzIHVzZWRcbiAgICAgICAgICAvLyBmb3IgYm90aCBjbGFzcyBhbmQgc3R5bGUgY29tcGFyaXNvbnMgKHN0eWxlcyBjYW4ndCBiZSBmYWxzZSBhbmQgZmFsc2VcbiAgICAgICAgICAvLyBjbGFzc2VzIGFyZSB0dXJuZWQgb2ZmIGFuZCBzaG91bGQgdGhlcmVmb3JlIGRlZmVyIHRvIHRoZWlyIGluaXRpYWwgdmFsdWVzKVxuICAgICAgICAgIC8vIE5vdGUgdGhhdCB3ZSBpZ25vcmUgY2xhc3MtYmFzZWQgZGVmZXJhbHMgYmVjYXVzZSBvdGhlcndpc2UgYSBjbGFzcyBjYW4gbmV2ZXJcbiAgICAgICAgICAvLyBiZSByZW1vdmVkIGluIHRoZSBjYXNlIHRoYXQgaXQgZXhpc3RzIGFzIHRydWUgaW4gdGhlIGluaXRpYWwgY2xhc3NlcyBsaXN0Li4uXG4gICAgICAgICAgaWYgKCF2YWx1ZUV4aXN0cyh2YWx1ZVRvQXBwbHksIGlzQ2xhc3NCYXNlZCkpIHtcbiAgICAgICAgICAgIHZhbHVlVG9BcHBseSA9IGdldEluaXRpYWxWYWx1ZShjb250ZXh0LCBmbGFnKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBpZiB0aGUgZmlyc3QgcmVuZGVyIGlzIHRydWUgdGhlbiB3ZSBkbyBub3Qgd2FudCB0byBzdGFydCBhcHBseWluZyBmYWxzeVxuICAgICAgICAgIC8vIHZhbHVlcyB0byB0aGUgRE9NIGVsZW1lbnQncyBzdHlsaW5nLiBPdGhlcndpc2UgdGhlbiB3ZSBrbm93IHRoZXJlIGhhc1xuICAgICAgICAgIC8vIGJlZW4gYSBjaGFuZ2UgYW5kIGV2ZW4gaWYgaXQncyBmYWxzeSB0aGVuIGl0J3MgcmVtb3Zpbmcgc29tZXRoaW5nIHRoYXRcbiAgICAgICAgICAvLyB3YXMgdHJ1dGh5IGJlZm9yZS5cbiAgICAgICAgICBjb25zdCBkb0FwcGx5VmFsdWUgPSByZW5kZXJlciAmJiAoaXNGaXJzdFJlbmRlciA/IHZhbHVlVG9BcHBseSA6IHRydWUpO1xuICAgICAgICAgIGlmIChkb0FwcGx5VmFsdWUpIHtcbiAgICAgICAgICAgIGlmIChpc0NsYXNzQmFzZWQpIHtcbiAgICAgICAgICAgICAgc2V0Q2xhc3MoXG4gICAgICAgICAgICAgICAgICBuYXRpdmUsIHByb3AsIHZhbHVlVG9BcHBseSA/IHRydWUgOiBmYWxzZSwgcmVuZGVyZXIgISwgY2xhc3Nlc1N0b3JlLFxuICAgICAgICAgICAgICAgICAgcGxheWVyQnVpbGRlcik7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBzZXRTdHlsZShcbiAgICAgICAgICAgICAgICAgIG5hdGl2ZSwgcHJvcCwgdmFsdWVUb0FwcGx5IGFzIHN0cmluZyB8IG51bGwsIHJlbmRlcmVyICEsIHN0eWxlU2FuaXRpemVyLFxuICAgICAgICAgICAgICAgICAgc3R5bGVzU3RvcmUsIHBsYXllckJ1aWxkZXIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIHNldERpcnR5KGNvbnRleHQsIGksIGZhbHNlKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoZmx1c2hQbGF5ZXJCdWlsZGVycykge1xuICAgICAgICBjb25zdCByb290Q29udGV4dCA9XG4gICAgICAgICAgICBBcnJheS5pc0FycmF5KHJvb3RPclZpZXcpID8gZ2V0Um9vdENvbnRleHQocm9vdE9yVmlldykgOiByb290T3JWaWV3IGFzIFJvb3RDb250ZXh0O1xuICAgICAgICBjb25zdCBwbGF5ZXJDb250ZXh0ID0gZ2V0UGxheWVyQ29udGV4dChjb250ZXh0KSAhO1xuICAgICAgICBjb25zdCBwbGF5ZXJzU3RhcnRJbmRleCA9IHBsYXllckNvbnRleHRbUGxheWVySW5kZXguTm9uQnVpbGRlclBsYXllcnNTdGFydF07XG4gICAgICAgIGZvciAobGV0IGkgPSBQbGF5ZXJJbmRleC5QbGF5ZXJCdWlsZGVyc1N0YXJ0UG9zaXRpb247IGkgPCBwbGF5ZXJzU3RhcnRJbmRleDtcbiAgICAgICAgICAgICBpICs9IFBsYXllckluZGV4LlBsYXllckFuZFBsYXllckJ1aWxkZXJzVHVwbGVTaXplKSB7XG4gICAgICAgICAgY29uc3QgYnVpbGRlciA9IHBsYXllckNvbnRleHRbaV0gYXMgQ2xhc3NBbmRTdHlsZVBsYXllckJ1aWxkZXI8YW55PnwgbnVsbDtcbiAgICAgICAgICBjb25zdCBwbGF5ZXJJbnNlcnRpb25JbmRleCA9IGkgKyBQbGF5ZXJJbmRleC5QbGF5ZXJPZmZzZXRQb3NpdGlvbjtcbiAgICAgICAgICBjb25zdCBvbGRQbGF5ZXIgPSBwbGF5ZXJDb250ZXh0W3BsYXllckluc2VydGlvbkluZGV4XSBhcyBQbGF5ZXIgfCBudWxsO1xuICAgICAgICAgIGlmIChidWlsZGVyKSB7XG4gICAgICAgICAgICBjb25zdCBwbGF5ZXIgPSBidWlsZGVyLmJ1aWxkUGxheWVyKG9sZFBsYXllciwgaXNGaXJzdFJlbmRlcik7XG4gICAgICAgICAgICBpZiAocGxheWVyICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgaWYgKHBsYXllciAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgd2FzUXVldWVkID0gYWRkUGxheWVySW50ZXJuYWwoXG4gICAgICAgICAgICAgICAgICAgIHBsYXllckNvbnRleHQsIHJvb3RDb250ZXh0LCBuYXRpdmUgYXMgSFRNTEVsZW1lbnQsIHBsYXllcixcbiAgICAgICAgICAgICAgICAgICAgcGxheWVySW5zZXJ0aW9uSW5kZXgpO1xuICAgICAgICAgICAgICAgIHdhc1F1ZXVlZCAmJiB0b3RhbFBsYXllcnNRdWV1ZWQrKztcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBpZiAob2xkUGxheWVyKSB7XG4gICAgICAgICAgICAgICAgb2xkUGxheWVyLmRlc3Ryb3koKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSBpZiAob2xkUGxheWVyKSB7XG4gICAgICAgICAgICAvLyB0aGUgcGxheWVyIGJ1aWxkZXIgaGFzIGJlZW4gcmVtb3ZlZCAuLi4gdGhlcmVmb3JlIHdlIHNob3VsZCBkZWxldGUgdGhlIGFzc29jaWF0ZWRcbiAgICAgICAgICAgIC8vIHBsYXllclxuICAgICAgICAgICAgb2xkUGxheWVyLmRlc3Ryb3koKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgc2V0Q29udGV4dFBsYXllcnNEaXJ0eShjb250ZXh0LCBmYWxzZSk7XG4gICAgICB9XG5cbiAgICAgIHNldENvbnRleHREaXJ0eShjb250ZXh0LCBmYWxzZSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRvdGFsUGxheWVyc1F1ZXVlZDtcbn1cblxuLyoqXG4gKiBBc3NpZ25zIGEgc3R5bGUgdmFsdWUgdG8gYSBzdHlsZSBwcm9wZXJ0eSBmb3IgdGhlIGdpdmVuIGVsZW1lbnQuXG4gKlxuICogVGhpcyBmdW5jdGlvbiByZW5kZXJzIGEgZ2l2ZW4gQ1NTIHByb3AvdmFsdWUgZW50cnkgdXNpbmcgdGhlXG4gKiBwcm92aWRlZCByZW5kZXJlci4gSWYgYSBgc3RvcmVgIHZhbHVlIGlzIHByb3ZpZGVkIHRoZW5cbiAqIHRoYXQgd2lsbCBiZSB1c2VkIGEgcmVuZGVyIGNvbnRleHQgaW5zdGVhZCBvZiB0aGUgcHJvdmlkZWRcbiAqIHJlbmRlcmVyLlxuICpcbiAqIEBwYXJhbSBuYXRpdmUgdGhlIERPTSBFbGVtZW50XG4gKiBAcGFyYW0gcHJvcCB0aGUgQ1NTIHN0eWxlIHByb3BlcnR5IHRoYXQgd2lsbCBiZSByZW5kZXJlZFxuICogQHBhcmFtIHZhbHVlIHRoZSBDU1Mgc3R5bGUgdmFsdWUgdGhhdCB3aWxsIGJlIHJlbmRlcmVkXG4gKiBAcGFyYW0gcmVuZGVyZXJcbiAqIEBwYXJhbSBzdG9yZSBhbiBvcHRpb25hbCBrZXkvdmFsdWUgbWFwIHRoYXQgd2lsbCBiZSB1c2VkIGFzIGEgY29udGV4dCB0byByZW5kZXIgc3R5bGVzIG9uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzZXRTdHlsZShcbiAgICBuYXRpdmU6IGFueSwgcHJvcDogc3RyaW5nLCB2YWx1ZTogc3RyaW5nIHwgbnVsbCwgcmVuZGVyZXI6IFJlbmRlcmVyMyxcbiAgICBzYW5pdGl6ZXI6IFN0eWxlU2FuaXRpemVGbiB8IG51bGwsIHN0b3JlPzogQmluZGluZ1N0b3JlIHwgbnVsbCxcbiAgICBwbGF5ZXJCdWlsZGVyPzogQ2xhc3NBbmRTdHlsZVBsYXllckJ1aWxkZXI8YW55PnwgbnVsbCkge1xuICB2YWx1ZSA9IHNhbml0aXplciAmJiB2YWx1ZSA/IHNhbml0aXplcihwcm9wLCB2YWx1ZSkgOiB2YWx1ZTtcbiAgaWYgKHN0b3JlIHx8IHBsYXllckJ1aWxkZXIpIHtcbiAgICBpZiAoc3RvcmUpIHtcbiAgICAgIHN0b3JlLnNldFZhbHVlKHByb3AsIHZhbHVlKTtcbiAgICB9XG4gICAgaWYgKHBsYXllckJ1aWxkZXIpIHtcbiAgICAgIHBsYXllckJ1aWxkZXIuc2V0VmFsdWUocHJvcCwgdmFsdWUpO1xuICAgIH1cbiAgfSBlbHNlIGlmICh2YWx1ZSkge1xuICAgIHZhbHVlID0gdmFsdWUudG9TdHJpbmcoKTsgIC8vIG9wYWNpdHksIHotaW5kZXggYW5kIGZsZXhib3ggYWxsIGhhdmUgbnVtYmVyIHZhbHVlcyB3aGljaCBtYXkgbm90XG4gICAgLy8gYXNzaWduIGFzIG51bWJlcnNcbiAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyU2V0U3R5bGUrKztcbiAgICBpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikgP1xuICAgICAgICByZW5kZXJlci5zZXRTdHlsZShuYXRpdmUsIHByb3AsIHZhbHVlLCBSZW5kZXJlclN0eWxlRmxhZ3MzLkRhc2hDYXNlKSA6XG4gICAgICAgIG5hdGl2ZS5zdHlsZS5zZXRQcm9wZXJ0eShwcm9wLCB2YWx1ZSk7XG4gIH0gZWxzZSB7XG4gICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlclJlbW92ZVN0eWxlKys7XG4gICAgaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpID9cbiAgICAgICAgcmVuZGVyZXIucmVtb3ZlU3R5bGUobmF0aXZlLCBwcm9wLCBSZW5kZXJlclN0eWxlRmxhZ3MzLkRhc2hDYXNlKSA6XG4gICAgICAgIG5hdGl2ZS5zdHlsZS5yZW1vdmVQcm9wZXJ0eShwcm9wKTtcbiAgfVxufVxuXG4vKipcbiAqIEFkZHMvcmVtb3ZlcyB0aGUgcHJvdmlkZWQgY2xhc3NOYW1lIHZhbHVlIHRvIHRoZSBwcm92aWRlZCBlbGVtZW50LlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gcmVuZGVycyBhIGdpdmVuIENTUyBjbGFzcyB2YWx1ZSB1c2luZyB0aGUgcHJvdmlkZWRcbiAqIHJlbmRlcmVyIChieSBhZGRpbmcgb3IgcmVtb3ZpbmcgaXQgZnJvbSB0aGUgcHJvdmlkZWQgZWxlbWVudCkuXG4gKiBJZiBhIGBzdG9yZWAgdmFsdWUgaXMgcHJvdmlkZWQgdGhlbiB0aGF0IHdpbGwgYmUgdXNlZCBhIHJlbmRlclxuICogY29udGV4dCBpbnN0ZWFkIG9mIHRoZSBwcm92aWRlZCByZW5kZXJlci5cbiAqXG4gKiBAcGFyYW0gbmF0aXZlIHRoZSBET00gRWxlbWVudFxuICogQHBhcmFtIHByb3AgdGhlIENTUyBzdHlsZSBwcm9wZXJ0eSB0aGF0IHdpbGwgYmUgcmVuZGVyZWRcbiAqIEBwYXJhbSB2YWx1ZSB0aGUgQ1NTIHN0eWxlIHZhbHVlIHRoYXQgd2lsbCBiZSByZW5kZXJlZFxuICogQHBhcmFtIHJlbmRlcmVyXG4gKiBAcGFyYW0gc3RvcmUgYW4gb3B0aW9uYWwga2V5L3ZhbHVlIG1hcCB0aGF0IHdpbGwgYmUgdXNlZCBhcyBhIGNvbnRleHQgdG8gcmVuZGVyIHN0eWxlcyBvblxuICovXG5mdW5jdGlvbiBzZXRDbGFzcyhcbiAgICBuYXRpdmU6IGFueSwgY2xhc3NOYW1lOiBzdHJpbmcsIGFkZDogYm9vbGVhbiwgcmVuZGVyZXI6IFJlbmRlcmVyMywgc3RvcmU/OiBCaW5kaW5nU3RvcmUgfCBudWxsLFxuICAgIHBsYXllckJ1aWxkZXI/OiBDbGFzc0FuZFN0eWxlUGxheWVyQnVpbGRlcjxhbnk+fCBudWxsKSB7XG4gIGlmIChzdG9yZSB8fCBwbGF5ZXJCdWlsZGVyKSB7XG4gICAgaWYgKHN0b3JlKSB7XG4gICAgICBzdG9yZS5zZXRWYWx1ZShjbGFzc05hbWUsIGFkZCk7XG4gICAgfVxuICAgIGlmIChwbGF5ZXJCdWlsZGVyKSB7XG4gICAgICBwbGF5ZXJCdWlsZGVyLnNldFZhbHVlKGNsYXNzTmFtZSwgYWRkKTtcbiAgICB9XG4gICAgLy8gRE9NVG9rZW5MaXN0IHdpbGwgdGhyb3cgaWYgd2UgdHJ5IHRvIGFkZCBvciByZW1vdmUgYW4gZW1wdHkgc3RyaW5nLlxuICB9IGVsc2UgaWYgKGNsYXNzTmFtZSAhPT0gJycpIHtcbiAgICBpZiAoYWRkKSB7XG4gICAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyQWRkQ2xhc3MrKztcbiAgICAgIGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSA/IHJlbmRlcmVyLmFkZENsYXNzKG5hdGl2ZSwgY2xhc3NOYW1lKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYXRpdmVbJ2NsYXNzTGlzdCddLmFkZChjbGFzc05hbWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyUmVtb3ZlQ2xhc3MrKztcbiAgICAgIGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSA/IHJlbmRlcmVyLnJlbW92ZUNsYXNzKG5hdGl2ZSwgY2xhc3NOYW1lKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYXRpdmVbJ2NsYXNzTGlzdCddLnJlbW92ZShjbGFzc05hbWUpO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBzZXRTYW5pdGl6ZUZsYWcoY29udGV4dDogU3R5bGluZ0NvbnRleHQsIGluZGV4OiBudW1iZXIsIHNhbml0aXplWWVzOiBib29sZWFuKSB7XG4gIGlmIChzYW5pdGl6ZVllcykge1xuICAgIChjb250ZXh0W2luZGV4XSBhcyBudW1iZXIpIHw9IFN0eWxpbmdGbGFncy5TYW5pdGl6ZTtcbiAgfSBlbHNlIHtcbiAgICAoY29udGV4dFtpbmRleF0gYXMgbnVtYmVyKSAmPSB+U3R5bGluZ0ZsYWdzLlNhbml0aXplO1xuICB9XG59XG5cbmZ1bmN0aW9uIHNldERpcnR5KGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBpbmRleDogbnVtYmVyLCBpc0RpcnR5WWVzOiBib29sZWFuKSB7XG4gIGNvbnN0IGFkanVzdGVkSW5kZXggPVxuICAgICAgaW5kZXggPj0gU3R5bGluZ0luZGV4LlNpbmdsZVN0eWxlc1N0YXJ0UG9zaXRpb24gPyAoaW5kZXggKyBTdHlsaW5nSW5kZXguRmxhZ3NPZmZzZXQpIDogaW5kZXg7XG4gIGlmIChpc0RpcnR5WWVzKSB7XG4gICAgKGNvbnRleHRbYWRqdXN0ZWRJbmRleF0gYXMgbnVtYmVyKSB8PSBTdHlsaW5nRmxhZ3MuRGlydHk7XG4gIH0gZWxzZSB7XG4gICAgKGNvbnRleHRbYWRqdXN0ZWRJbmRleF0gYXMgbnVtYmVyKSAmPSB+U3R5bGluZ0ZsYWdzLkRpcnR5O1xuICB9XG59XG5cbmZ1bmN0aW9uIGlzRGlydHkoY29udGV4dDogU3R5bGluZ0NvbnRleHQsIGluZGV4OiBudW1iZXIpOiBib29sZWFuIHtcbiAgY29uc3QgYWRqdXN0ZWRJbmRleCA9XG4gICAgICBpbmRleCA+PSBTdHlsaW5nSW5kZXguU2luZ2xlU3R5bGVzU3RhcnRQb3NpdGlvbiA/IChpbmRleCArIFN0eWxpbmdJbmRleC5GbGFnc09mZnNldCkgOiBpbmRleDtcbiAgcmV0dXJuICgoY29udGV4dFthZGp1c3RlZEluZGV4XSBhcyBudW1iZXIpICYgU3R5bGluZ0ZsYWdzLkRpcnR5KSA9PSBTdHlsaW5nRmxhZ3MuRGlydHk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0NsYXNzQmFzZWRWYWx1ZShjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgaW5kZXg6IG51bWJlcik6IGJvb2xlYW4ge1xuICBjb25zdCBhZGp1c3RlZEluZGV4ID1cbiAgICAgIGluZGV4ID49IFN0eWxpbmdJbmRleC5TaW5nbGVTdHlsZXNTdGFydFBvc2l0aW9uID8gKGluZGV4ICsgU3R5bGluZ0luZGV4LkZsYWdzT2Zmc2V0KSA6IGluZGV4O1xuICByZXR1cm4gKChjb250ZXh0W2FkanVzdGVkSW5kZXhdIGFzIG51bWJlcikgJiBTdHlsaW5nRmxhZ3MuQ2xhc3MpID09IFN0eWxpbmdGbGFncy5DbGFzcztcbn1cblxuZnVuY3Rpb24gaXNTYW5pdGl6YWJsZShjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgaW5kZXg6IG51bWJlcik6IGJvb2xlYW4ge1xuICBjb25zdCBhZGp1c3RlZEluZGV4ID1cbiAgICAgIGluZGV4ID49IFN0eWxpbmdJbmRleC5TaW5nbGVTdHlsZXNTdGFydFBvc2l0aW9uID8gKGluZGV4ICsgU3R5bGluZ0luZGV4LkZsYWdzT2Zmc2V0KSA6IGluZGV4O1xuICByZXR1cm4gKChjb250ZXh0W2FkanVzdGVkSW5kZXhdIGFzIG51bWJlcikgJiBTdHlsaW5nRmxhZ3MuU2FuaXRpemUpID09IFN0eWxpbmdGbGFncy5TYW5pdGl6ZTtcbn1cblxuZnVuY3Rpb24gcG9pbnRlcnMoY29uZmlnRmxhZzogbnVtYmVyLCBzdGF0aWNJbmRleDogbnVtYmVyLCBkeW5hbWljSW5kZXg6IG51bWJlcikge1xuICByZXR1cm4gKGNvbmZpZ0ZsYWcgJiBTdHlsaW5nRmxhZ3MuQml0TWFzaykgfCAoc3RhdGljSW5kZXggPDwgU3R5bGluZ0ZsYWdzLkJpdENvdW50U2l6ZSkgfFxuICAgICAgKGR5bmFtaWNJbmRleCA8PCAoU3R5bGluZ0luZGV4LkJpdENvdW50U2l6ZSArIFN0eWxpbmdGbGFncy5CaXRDb3VudFNpemUpKTtcbn1cblxuZnVuY3Rpb24gZ2V0SW5pdGlhbFZhbHVlKGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBmbGFnOiBudW1iZXIpOiBzdHJpbmd8Ym9vbGVhbnxudWxsIHtcbiAgY29uc3QgaW5kZXggPSBnZXRJbml0aWFsSW5kZXgoZmxhZyk7XG4gIGNvbnN0IGVudHJ5SXNDbGFzc0Jhc2VkID0gZmxhZyAmIFN0eWxpbmdGbGFncy5DbGFzcztcbiAgY29uc3QgaW5pdGlhbFZhbHVlcyA9IGVudHJ5SXNDbGFzc0Jhc2VkID8gY29udGV4dFtTdHlsaW5nSW5kZXguSW5pdGlhbENsYXNzVmFsdWVzUG9zaXRpb25dIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGV4dFtTdHlsaW5nSW5kZXguSW5pdGlhbFN0eWxlVmFsdWVzUG9zaXRpb25dO1xuICByZXR1cm4gaW5pdGlhbFZhbHVlc1tpbmRleF0gYXMgc3RyaW5nIHwgYm9vbGVhbiB8IG51bGw7XG59XG5cbmZ1bmN0aW9uIGdldEluaXRpYWxJbmRleChmbGFnOiBudW1iZXIpOiBudW1iZXIge1xuICByZXR1cm4gKGZsYWcgPj4gU3R5bGluZ0ZsYWdzLkJpdENvdW50U2l6ZSkgJiBTdHlsaW5nSW5kZXguQml0TWFzaztcbn1cblxuZnVuY3Rpb24gZ2V0TXVsdGlPclNpbmdsZUluZGV4KGZsYWc6IG51bWJlcik6IG51bWJlciB7XG4gIGNvbnN0IGluZGV4ID1cbiAgICAgIChmbGFnID4+IChTdHlsaW5nSW5kZXguQml0Q291bnRTaXplICsgU3R5bGluZ0ZsYWdzLkJpdENvdW50U2l6ZSkpICYgU3R5bGluZ0luZGV4LkJpdE1hc2s7XG4gIHJldHVybiBpbmRleCA+PSBTdHlsaW5nSW5kZXguU2luZ2xlU3R5bGVzU3RhcnRQb3NpdGlvbiA/IGluZGV4IDogLTE7XG59XG5cbmZ1bmN0aW9uIGdldE11bHRpU3RhcnRJbmRleChjb250ZXh0OiBTdHlsaW5nQ29udGV4dCk6IG51bWJlciB7XG4gIHJldHVybiBnZXRNdWx0aU9yU2luZ2xlSW5kZXgoY29udGV4dFtTdHlsaW5nSW5kZXguTWFzdGVyRmxhZ1Bvc2l0aW9uXSkgYXMgbnVtYmVyO1xufVxuXG5mdW5jdGlvbiBnZXRNdWx0aUNsYXNzZXNTdGFydEluZGV4KGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0KTogbnVtYmVyIHtcbiAgY29uc3QgY2xhc3NDYWNoZSA9IGNvbnRleHRbU3R5bGluZ0luZGV4LkNhY2hlZE11bHRpQ2xhc3Nlc107XG4gIHJldHVybiBjbGFzc0NhY2hlXG4gICAgICBbTWFwQmFzZWRPZmZzZXRWYWx1ZXNJbmRleC5WYWx1ZXNTdGFydFBvc2l0aW9uICtcbiAgICAgICBNYXBCYXNlZE9mZnNldFZhbHVlc0luZGV4LlBvc2l0aW9uU3RhcnRPZmZzZXRdO1xufVxuXG5mdW5jdGlvbiBnZXRNdWx0aVN0eWxlc1N0YXJ0SW5kZXgoY29udGV4dDogU3R5bGluZ0NvbnRleHQpOiBudW1iZXIge1xuICBjb25zdCBzdHlsZXNDYWNoZSA9IGNvbnRleHRbU3R5bGluZ0luZGV4LkNhY2hlZE11bHRpU3R5bGVzXTtcbiAgcmV0dXJuIHN0eWxlc0NhY2hlXG4gICAgICBbTWFwQmFzZWRPZmZzZXRWYWx1ZXNJbmRleC5WYWx1ZXNTdGFydFBvc2l0aW9uICtcbiAgICAgICBNYXBCYXNlZE9mZnNldFZhbHVlc0luZGV4LlBvc2l0aW9uU3RhcnRPZmZzZXRdO1xufVxuXG5mdW5jdGlvbiBzZXRQcm9wKGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBpbmRleDogbnVtYmVyLCBwcm9wOiBzdHJpbmcpIHtcbiAgY29udGV4dFtpbmRleCArIFN0eWxpbmdJbmRleC5Qcm9wZXJ0eU9mZnNldF0gPSBwcm9wO1xufVxuXG5mdW5jdGlvbiBzZXRWYWx1ZShjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgaW5kZXg6IG51bWJlciwgdmFsdWU6IHN0cmluZyB8IG51bGwgfCBib29sZWFuKSB7XG4gIGNvbnRleHRbaW5kZXggKyBTdHlsaW5nSW5kZXguVmFsdWVPZmZzZXRdID0gdmFsdWU7XG59XG5cbmZ1bmN0aW9uIGhhc1BsYXllckJ1aWxkZXJDaGFuZ2VkKFxuICAgIGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBidWlsZGVyOiBDbGFzc0FuZFN0eWxlUGxheWVyQnVpbGRlcjxhbnk+fCBudWxsLCBpbmRleDogbnVtYmVyKSB7XG4gIGNvbnN0IHBsYXllckNvbnRleHQgPSBjb250ZXh0W1N0eWxpbmdJbmRleC5QbGF5ZXJDb250ZXh0XSAhO1xuICBpZiAoYnVpbGRlcikge1xuICAgIGlmICghcGxheWVyQ29udGV4dCB8fCBpbmRleCA9PT0gMCkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9IGVsc2UgaWYgKCFwbGF5ZXJDb250ZXh0KSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIHJldHVybiBwbGF5ZXJDb250ZXh0W2luZGV4XSAhPT0gYnVpbGRlcjtcbn1cblxuZnVuY3Rpb24gc2V0UGxheWVyQnVpbGRlcihcbiAgICBjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgYnVpbGRlcjogQ2xhc3NBbmRTdHlsZVBsYXllckJ1aWxkZXI8YW55PnwgbnVsbCxcbiAgICBpbnNlcnRpb25JbmRleDogbnVtYmVyKTogbnVtYmVyIHtcbiAgbGV0IHBsYXllckNvbnRleHQgPSBjb250ZXh0W1N0eWxpbmdJbmRleC5QbGF5ZXJDb250ZXh0XSB8fCBhbGxvY1BsYXllckNvbnRleHQoY29udGV4dCk7XG4gIGlmIChpbnNlcnRpb25JbmRleCA+IDApIHtcbiAgICBwbGF5ZXJDb250ZXh0W2luc2VydGlvbkluZGV4XSA9IGJ1aWxkZXI7XG4gIH0gZWxzZSB7XG4gICAgaW5zZXJ0aW9uSW5kZXggPSBwbGF5ZXJDb250ZXh0W1BsYXllckluZGV4Lk5vbkJ1aWxkZXJQbGF5ZXJzU3RhcnRdO1xuICAgIHBsYXllckNvbnRleHQuc3BsaWNlKGluc2VydGlvbkluZGV4LCAwLCBidWlsZGVyLCBudWxsKTtcbiAgICBwbGF5ZXJDb250ZXh0W1BsYXllckluZGV4Lk5vbkJ1aWxkZXJQbGF5ZXJzU3RhcnRdICs9XG4gICAgICAgIFBsYXllckluZGV4LlBsYXllckFuZFBsYXllckJ1aWxkZXJzVHVwbGVTaXplO1xuICB9XG4gIHJldHVybiBpbnNlcnRpb25JbmRleDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGRpcmVjdGl2ZU93bmVyUG9pbnRlcnMoZGlyZWN0aXZlSW5kZXg6IG51bWJlciwgcGxheWVySW5kZXg6IG51bWJlcikge1xuICByZXR1cm4gKHBsYXllckluZGV4IDw8IERpcmVjdGl2ZU93bmVyQW5kUGxheWVyQnVpbGRlckluZGV4LkJpdENvdW50U2l6ZSkgfCBkaXJlY3RpdmVJbmRleDtcbn1cblxuZnVuY3Rpb24gc2V0UGxheWVyQnVpbGRlckluZGV4KFxuICAgIGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBpbmRleDogbnVtYmVyLCBwbGF5ZXJCdWlsZGVySW5kZXg6IG51bWJlciwgZGlyZWN0aXZlSW5kZXg6IG51bWJlcikge1xuICBjb25zdCB2YWx1ZSA9IGRpcmVjdGl2ZU93bmVyUG9pbnRlcnMoZGlyZWN0aXZlSW5kZXgsIHBsYXllckJ1aWxkZXJJbmRleCk7XG4gIGNvbnRleHRbaW5kZXggKyBTdHlsaW5nSW5kZXguUGxheWVyQnVpbGRlckluZGV4T2Zmc2V0XSA9IHZhbHVlO1xufVxuXG5mdW5jdGlvbiBnZXRQbGF5ZXJCdWlsZGVySW5kZXgoY29udGV4dDogU3R5bGluZ0NvbnRleHQsIGluZGV4OiBudW1iZXIpOiBudW1iZXIge1xuICBjb25zdCBmbGFnID0gY29udGV4dFtpbmRleCArIFN0eWxpbmdJbmRleC5QbGF5ZXJCdWlsZGVySW5kZXhPZmZzZXRdIGFzIG51bWJlcjtcbiAgY29uc3QgcGxheWVyQnVpbGRlckluZGV4ID0gKGZsYWcgPj4gRGlyZWN0aXZlT3duZXJBbmRQbGF5ZXJCdWlsZGVySW5kZXguQml0Q291bnRTaXplKSAmXG4gICAgICBEaXJlY3RpdmVPd25lckFuZFBsYXllckJ1aWxkZXJJbmRleC5CaXRNYXNrO1xuICByZXR1cm4gcGxheWVyQnVpbGRlckluZGV4O1xufVxuXG5mdW5jdGlvbiBnZXRQbGF5ZXJCdWlsZGVyKGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBpbmRleDogbnVtYmVyKTogQ2xhc3NBbmRTdHlsZVBsYXllckJ1aWxkZXI8YW55PnxcbiAgICBudWxsIHtcbiAgY29uc3QgcGxheWVyQnVpbGRlckluZGV4ID0gZ2V0UGxheWVyQnVpbGRlckluZGV4KGNvbnRleHQsIGluZGV4KTtcbiAgaWYgKHBsYXllckJ1aWxkZXJJbmRleCkge1xuICAgIGNvbnN0IHBsYXllckNvbnRleHQgPSBjb250ZXh0W1N0eWxpbmdJbmRleC5QbGF5ZXJDb250ZXh0XTtcbiAgICBpZiAocGxheWVyQ29udGV4dCkge1xuICAgICAgcmV0dXJuIHBsYXllckNvbnRleHRbcGxheWVyQnVpbGRlckluZGV4XSBhcyBDbGFzc0FuZFN0eWxlUGxheWVyQnVpbGRlcjxhbnk+fCBudWxsO1xuICAgIH1cbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuZnVuY3Rpb24gc2V0RmxhZyhjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgaW5kZXg6IG51bWJlciwgZmxhZzogbnVtYmVyKSB7XG4gIGNvbnN0IGFkanVzdGVkSW5kZXggPVxuICAgICAgaW5kZXggPT09IFN0eWxpbmdJbmRleC5NYXN0ZXJGbGFnUG9zaXRpb24gPyBpbmRleCA6IChpbmRleCArIFN0eWxpbmdJbmRleC5GbGFnc09mZnNldCk7XG4gIGNvbnRleHRbYWRqdXN0ZWRJbmRleF0gPSBmbGFnO1xufVxuXG5mdW5jdGlvbiBnZXRQb2ludGVycyhjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgaW5kZXg6IG51bWJlcik6IG51bWJlciB7XG4gIGNvbnN0IGFkanVzdGVkSW5kZXggPVxuICAgICAgaW5kZXggPT09IFN0eWxpbmdJbmRleC5NYXN0ZXJGbGFnUG9zaXRpb24gPyBpbmRleCA6IChpbmRleCArIFN0eWxpbmdJbmRleC5GbGFnc09mZnNldCk7XG4gIHJldHVybiBjb250ZXh0W2FkanVzdGVkSW5kZXhdIGFzIG51bWJlcjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFZhbHVlKGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBpbmRleDogbnVtYmVyKTogc3RyaW5nfGJvb2xlYW58bnVsbCB7XG4gIHJldHVybiBjb250ZXh0W2luZGV4ICsgU3R5bGluZ0luZGV4LlZhbHVlT2Zmc2V0XSBhcyBzdHJpbmcgfCBib29sZWFuIHwgbnVsbDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFByb3AoY29udGV4dDogU3R5bGluZ0NvbnRleHQsIGluZGV4OiBudW1iZXIpOiBzdHJpbmcge1xuICByZXR1cm4gY29udGV4dFtpbmRleCArIFN0eWxpbmdJbmRleC5Qcm9wZXJ0eU9mZnNldF0gYXMgc3RyaW5nO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNDb250ZXh0RGlydHkoY29udGV4dDogU3R5bGluZ0NvbnRleHQpOiBib29sZWFuIHtcbiAgcmV0dXJuIGlzRGlydHkoY29udGV4dCwgU3R5bGluZ0luZGV4Lk1hc3RlckZsYWdQb3NpdGlvbik7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRDb250ZXh0RGlydHkoY29udGV4dDogU3R5bGluZ0NvbnRleHQsIGlzRGlydHlZZXM6IGJvb2xlYW4pOiB2b2lkIHtcbiAgc2V0RGlydHkoY29udGV4dCwgU3R5bGluZ0luZGV4Lk1hc3RlckZsYWdQb3NpdGlvbiwgaXNEaXJ0eVllcyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRDb250ZXh0UGxheWVyc0RpcnR5KGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBpc0RpcnR5WWVzOiBib29sZWFuKTogdm9pZCB7XG4gIGlmIChpc0RpcnR5WWVzKSB7XG4gICAgKGNvbnRleHRbU3R5bGluZ0luZGV4Lk1hc3RlckZsYWdQb3NpdGlvbl0gYXMgbnVtYmVyKSB8PSBTdHlsaW5nRmxhZ3MuUGxheWVyQnVpbGRlcnNEaXJ0eTtcbiAgfSBlbHNlIHtcbiAgICAoY29udGV4dFtTdHlsaW5nSW5kZXguTWFzdGVyRmxhZ1Bvc2l0aW9uXSBhcyBudW1iZXIpICY9IH5TdHlsaW5nRmxhZ3MuUGxheWVyQnVpbGRlcnNEaXJ0eTtcbiAgfVxufVxuXG5mdW5jdGlvbiBzd2FwTXVsdGlDb250ZXh0RW50cmllcyhjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgaW5kZXhBOiBudW1iZXIsIGluZGV4QjogbnVtYmVyKSB7XG4gIGlmIChpbmRleEEgPT09IGluZGV4QikgcmV0dXJuO1xuXG4gIGNvbnN0IHRtcFZhbHVlID0gZ2V0VmFsdWUoY29udGV4dCwgaW5kZXhBKTtcbiAgY29uc3QgdG1wUHJvcCA9IGdldFByb3AoY29udGV4dCwgaW5kZXhBKTtcbiAgY29uc3QgdG1wRmxhZyA9IGdldFBvaW50ZXJzKGNvbnRleHQsIGluZGV4QSk7XG4gIGNvbnN0IHRtcFBsYXllckJ1aWxkZXJJbmRleCA9IGdldFBsYXllckJ1aWxkZXJJbmRleChjb250ZXh0LCBpbmRleEEpO1xuICBjb25zdCB0bXBEaXJlY3RpdmVJbmRleCA9IGdldERpcmVjdGl2ZUluZGV4RnJvbUVudHJ5KGNvbnRleHQsIGluZGV4QSk7XG5cbiAgbGV0IGZsYWdBID0gdG1wRmxhZztcbiAgbGV0IGZsYWdCID0gZ2V0UG9pbnRlcnMoY29udGV4dCwgaW5kZXhCKTtcblxuICBjb25zdCBzaW5nbGVJbmRleEEgPSBnZXRNdWx0aU9yU2luZ2xlSW5kZXgoZmxhZ0EpO1xuICBpZiAoc2luZ2xlSW5kZXhBID49IDApIHtcbiAgICBjb25zdCBfZmxhZyA9IGdldFBvaW50ZXJzKGNvbnRleHQsIHNpbmdsZUluZGV4QSk7XG4gICAgY29uc3QgX2luaXRpYWwgPSBnZXRJbml0aWFsSW5kZXgoX2ZsYWcpO1xuICAgIHNldEZsYWcoY29udGV4dCwgc2luZ2xlSW5kZXhBLCBwb2ludGVycyhfZmxhZywgX2luaXRpYWwsIGluZGV4QikpO1xuICB9XG5cbiAgY29uc3Qgc2luZ2xlSW5kZXhCID0gZ2V0TXVsdGlPclNpbmdsZUluZGV4KGZsYWdCKTtcbiAgaWYgKHNpbmdsZUluZGV4QiA+PSAwKSB7XG4gICAgY29uc3QgX2ZsYWcgPSBnZXRQb2ludGVycyhjb250ZXh0LCBzaW5nbGVJbmRleEIpO1xuICAgIGNvbnN0IF9pbml0aWFsID0gZ2V0SW5pdGlhbEluZGV4KF9mbGFnKTtcbiAgICBzZXRGbGFnKGNvbnRleHQsIHNpbmdsZUluZGV4QiwgcG9pbnRlcnMoX2ZsYWcsIF9pbml0aWFsLCBpbmRleEEpKTtcbiAgfVxuXG4gIHNldFZhbHVlKGNvbnRleHQsIGluZGV4QSwgZ2V0VmFsdWUoY29udGV4dCwgaW5kZXhCKSk7XG4gIHNldFByb3AoY29udGV4dCwgaW5kZXhBLCBnZXRQcm9wKGNvbnRleHQsIGluZGV4QikpO1xuICBzZXRGbGFnKGNvbnRleHQsIGluZGV4QSwgZ2V0UG9pbnRlcnMoY29udGV4dCwgaW5kZXhCKSk7XG4gIGNvbnN0IHBsYXllckluZGV4QSA9IGdldFBsYXllckJ1aWxkZXJJbmRleChjb250ZXh0LCBpbmRleEIpO1xuICBjb25zdCBkaXJlY3RpdmVJbmRleEEgPSBnZXREaXJlY3RpdmVJbmRleEZyb21FbnRyeShjb250ZXh0LCBpbmRleEIpO1xuICBzZXRQbGF5ZXJCdWlsZGVySW5kZXgoY29udGV4dCwgaW5kZXhBLCBwbGF5ZXJJbmRleEEsIGRpcmVjdGl2ZUluZGV4QSk7XG5cbiAgc2V0VmFsdWUoY29udGV4dCwgaW5kZXhCLCB0bXBWYWx1ZSk7XG4gIHNldFByb3AoY29udGV4dCwgaW5kZXhCLCB0bXBQcm9wKTtcbiAgc2V0RmxhZyhjb250ZXh0LCBpbmRleEIsIHRtcEZsYWcpO1xuICBzZXRQbGF5ZXJCdWlsZGVySW5kZXgoY29udGV4dCwgaW5kZXhCLCB0bXBQbGF5ZXJCdWlsZGVySW5kZXgsIHRtcERpcmVjdGl2ZUluZGV4KTtcbn1cblxuZnVuY3Rpb24gdXBkYXRlU2luZ2xlUG9pbnRlclZhbHVlcyhjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgaW5kZXhTdGFydFBvc2l0aW9uOiBudW1iZXIpIHtcbiAgZm9yIChsZXQgaSA9IGluZGV4U3RhcnRQb3NpdGlvbjsgaSA8IGNvbnRleHQubGVuZ3RoOyBpICs9IFN0eWxpbmdJbmRleC5TaXplKSB7XG4gICAgY29uc3QgbXVsdGlGbGFnID0gZ2V0UG9pbnRlcnMoY29udGV4dCwgaSk7XG4gICAgY29uc3Qgc2luZ2xlSW5kZXggPSBnZXRNdWx0aU9yU2luZ2xlSW5kZXgobXVsdGlGbGFnKTtcbiAgICBpZiAoc2luZ2xlSW5kZXggPiAwKSB7XG4gICAgICBjb25zdCBzaW5nbGVGbGFnID0gZ2V0UG9pbnRlcnMoY29udGV4dCwgc2luZ2xlSW5kZXgpO1xuICAgICAgY29uc3QgaW5pdGlhbEluZGV4Rm9yU2luZ2xlID0gZ2V0SW5pdGlhbEluZGV4KHNpbmdsZUZsYWcpO1xuICAgICAgY29uc3QgZmxhZ1ZhbHVlID0gKGlzRGlydHkoY29udGV4dCwgc2luZ2xlSW5kZXgpID8gU3R5bGluZ0ZsYWdzLkRpcnR5IDogU3R5bGluZ0ZsYWdzLk5vbmUpIHxcbiAgICAgICAgICAoaXNDbGFzc0Jhc2VkVmFsdWUoY29udGV4dCwgc2luZ2xlSW5kZXgpID8gU3R5bGluZ0ZsYWdzLkNsYXNzIDogU3R5bGluZ0ZsYWdzLk5vbmUpIHxcbiAgICAgICAgICAoaXNTYW5pdGl6YWJsZShjb250ZXh0LCBzaW5nbGVJbmRleCkgPyBTdHlsaW5nRmxhZ3MuU2FuaXRpemUgOiBTdHlsaW5nRmxhZ3MuTm9uZSk7XG4gICAgICBjb25zdCB1cGRhdGVkRmxhZyA9IHBvaW50ZXJzKGZsYWdWYWx1ZSwgaW5pdGlhbEluZGV4Rm9yU2luZ2xlLCBpKTtcbiAgICAgIHNldEZsYWcoY29udGV4dCwgc2luZ2xlSW5kZXgsIHVwZGF0ZWRGbGFnKTtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gaW5zZXJ0TmV3TXVsdGlQcm9wZXJ0eShcbiAgICBjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgaW5kZXg6IG51bWJlciwgY2xhc3NCYXNlZDogYm9vbGVhbiwgbmFtZTogc3RyaW5nLCBmbGFnOiBudW1iZXIsXG4gICAgdmFsdWU6IHN0cmluZyB8IGJvb2xlYW4sIGRpcmVjdGl2ZUluZGV4OiBudW1iZXIsIHBsYXllckluZGV4OiBudW1iZXIpOiB2b2lkIHtcbiAgY29uc3QgZG9TaGlmdCA9IGluZGV4IDwgY29udGV4dC5sZW5ndGg7XG5cbiAgLy8gcHJvcCBkb2VzIG5vdCBleGlzdCBpbiB0aGUgbGlzdCwgYWRkIGl0IGluXG4gIGNvbnRleHQuc3BsaWNlKFxuICAgICAgaW5kZXgsIDAsIGZsYWcgfCBTdHlsaW5nRmxhZ3MuRGlydHkgfCAoY2xhc3NCYXNlZCA/IFN0eWxpbmdGbGFncy5DbGFzcyA6IFN0eWxpbmdGbGFncy5Ob25lKSxcbiAgICAgIG5hbWUsIHZhbHVlLCAwKTtcbiAgc2V0UGxheWVyQnVpbGRlckluZGV4KGNvbnRleHQsIGluZGV4LCBwbGF5ZXJJbmRleCwgZGlyZWN0aXZlSW5kZXgpO1xuXG4gIGlmIChkb1NoaWZ0KSB7XG4gICAgLy8gYmVjYXVzZSB0aGUgdmFsdWUgd2FzIGluc2VydGVkIG1pZHdheSBpbnRvIHRoZSBhcnJheSB0aGVuIHdlXG4gICAgLy8gbmVlZCB0byB1cGRhdGUgYWxsIHRoZSBzaGlmdGVkIG11bHRpIHZhbHVlcycgc2luZ2xlIHZhbHVlXG4gICAgLy8gcG9pbnRlcnMgdG8gcG9pbnQgdG8gdGhlIG5ld2x5IHNoaWZ0ZWQgbG9jYXRpb25cbiAgICB1cGRhdGVTaW5nbGVQb2ludGVyVmFsdWVzKGNvbnRleHQsIGluZGV4ICsgU3R5bGluZ0luZGV4LlNpemUpO1xuICB9XG59XG5cbmZ1bmN0aW9uIHZhbHVlRXhpc3RzKHZhbHVlOiBzdHJpbmcgfCBudWxsIHwgYm9vbGVhbiwgaXNDbGFzc0Jhc2VkPzogYm9vbGVhbikge1xuICByZXR1cm4gdmFsdWUgIT09IG51bGw7XG59XG5cbmZ1bmN0aW9uIHByZXBhcmVJbml0aWFsRmxhZyhcbiAgICBjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgcHJvcDogc3RyaW5nLCBlbnRyeUlzQ2xhc3NCYXNlZDogYm9vbGVhbixcbiAgICBzYW5pdGl6ZXI/OiBTdHlsZVNhbml0aXplRm4gfCBudWxsKSB7XG4gIGxldCBmbGFnID0gKHNhbml0aXplciAmJiBzYW5pdGl6ZXIocHJvcCkpID8gU3R5bGluZ0ZsYWdzLlNhbml0aXplIDogU3R5bGluZ0ZsYWdzLk5vbmU7XG5cbiAgbGV0IGluaXRpYWxJbmRleDogbnVtYmVyO1xuICBpZiAoZW50cnlJc0NsYXNzQmFzZWQpIHtcbiAgICBmbGFnIHw9IFN0eWxpbmdGbGFncy5DbGFzcztcbiAgICBpbml0aWFsSW5kZXggPVxuICAgICAgICBnZXRJbml0aWFsU3R5bGluZ1ZhbHVlc0luZGV4T2YoY29udGV4dFtTdHlsaW5nSW5kZXguSW5pdGlhbENsYXNzVmFsdWVzUG9zaXRpb25dLCBwcm9wKTtcbiAgfSBlbHNlIHtcbiAgICBpbml0aWFsSW5kZXggPVxuICAgICAgICBnZXRJbml0aWFsU3R5bGluZ1ZhbHVlc0luZGV4T2YoY29udGV4dFtTdHlsaW5nSW5kZXguSW5pdGlhbFN0eWxlVmFsdWVzUG9zaXRpb25dLCBwcm9wKTtcbiAgfVxuXG4gIGluaXRpYWxJbmRleCA9IGluaXRpYWxJbmRleCA+IDAgPyAoaW5pdGlhbEluZGV4ICsgSW5pdGlhbFN0eWxpbmdWYWx1ZXNJbmRleC5WYWx1ZU9mZnNldCkgOiAwO1xuICByZXR1cm4gcG9pbnRlcnMoZmxhZywgaW5pdGlhbEluZGV4LCAwKTtcbn1cblxuZnVuY3Rpb24gaGFzSW5pdGlhbFZhbHVlQ2hhbmdlZChjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgZmxhZzogbnVtYmVyLCBuZXdWYWx1ZTogYW55KSB7XG4gIGNvbnN0IGluaXRpYWxWYWx1ZSA9IGdldEluaXRpYWxWYWx1ZShjb250ZXh0LCBmbGFnKTtcbiAgcmV0dXJuICFpbml0aWFsVmFsdWUgfHwgaGFzVmFsdWVDaGFuZ2VkKGZsYWcsIGluaXRpYWxWYWx1ZSwgbmV3VmFsdWUpO1xufVxuXG5mdW5jdGlvbiBoYXNWYWx1ZUNoYW5nZWQoXG4gICAgZmxhZzogbnVtYmVyLCBhOiBzdHJpbmcgfCBib29sZWFuIHwgbnVsbCwgYjogc3RyaW5nIHwgYm9vbGVhbiB8IG51bGwpOiBib29sZWFuIHtcbiAgY29uc3QgaXNDbGFzc0Jhc2VkID0gZmxhZyAmIFN0eWxpbmdGbGFncy5DbGFzcztcbiAgY29uc3QgaGFzVmFsdWVzID0gYSAmJiBiO1xuICBjb25zdCB1c2VzU2FuaXRpemVyID0gZmxhZyAmIFN0eWxpbmdGbGFncy5TYW5pdGl6ZTtcbiAgLy8gdGhlIHRvU3RyaW5nKCkgY29tcGFyaXNvbiBlbnN1cmVzIHRoYXQgYSB2YWx1ZSBpcyBjaGVja2VkXG4gIC8vIC4uLiBvdGhlcndpc2UgKGR1cmluZyBzYW5pdGl6YXRpb24gYnlwYXNzaW5nKSB0aGUgPT09IGNvbXBhcnNpb25cbiAgLy8gd291bGQgZmFpbCBzaW5jZSBhIG5ldyBTdHJpbmcoKSBpbnN0YW5jZSBpcyBjcmVhdGVkXG4gIGlmICghaXNDbGFzc0Jhc2VkICYmIGhhc1ZhbHVlcyAmJiB1c2VzU2FuaXRpemVyKSB7XG4gICAgLy8gd2Uga25vdyBmb3Igc3VyZSB3ZSdyZSBkZWFsaW5nIHdpdGggc3RyaW5ncyBhdCB0aGlzIHBvaW50XG4gICAgcmV0dXJuIChhIGFzIHN0cmluZykudG9TdHJpbmcoKSAhPT0gKGIgYXMgc3RyaW5nKS50b1N0cmluZygpO1xuICB9XG5cbiAgLy8gZXZlcnl0aGluZyBlbHNlIGlzIHNhZmUgdG8gY2hlY2sgd2l0aCBhIG5vcm1hbCBlcXVhbGl0eSBjaGVja1xuICByZXR1cm4gYSAhPT0gYjtcbn1cblxuZXhwb3J0IGNsYXNzIENsYXNzQW5kU3R5bGVQbGF5ZXJCdWlsZGVyPFQ+IGltcGxlbWVudHMgUGxheWVyQnVpbGRlciB7XG4gIHByaXZhdGUgX3ZhbHVlczoge1trZXk6IHN0cmluZ106IHN0cmluZyB8IG51bGx9ID0ge307XG4gIHByaXZhdGUgX2RpcnR5ID0gZmFsc2U7XG4gIHByaXZhdGUgX2ZhY3Rvcnk6IEJvdW5kUGxheWVyRmFjdG9yeTxUPjtcblxuICBjb25zdHJ1Y3RvcihmYWN0b3J5OiBQbGF5ZXJGYWN0b3J5LCBwcml2YXRlIF9lbGVtZW50OiBIVE1MRWxlbWVudCwgcHJpdmF0ZSBfdHlwZTogQmluZGluZ1R5cGUpIHtcbiAgICB0aGlzLl9mYWN0b3J5ID0gZmFjdG9yeSBhcyBhbnk7XG4gIH1cblxuICBzZXRWYWx1ZShwcm9wOiBzdHJpbmcsIHZhbHVlOiBhbnkpIHtcbiAgICBpZiAodGhpcy5fdmFsdWVzW3Byb3BdICE9PSB2YWx1ZSkge1xuICAgICAgdGhpcy5fdmFsdWVzW3Byb3BdID0gdmFsdWU7XG4gICAgICB0aGlzLl9kaXJ0eSA9IHRydWU7XG4gICAgfVxuICB9XG5cbiAgYnVpbGRQbGF5ZXIoY3VycmVudFBsYXllcjogUGxheWVyfG51bGwsIGlzRmlyc3RSZW5kZXI6IGJvb2xlYW4pOiBQbGF5ZXJ8dW5kZWZpbmVkfG51bGwge1xuICAgIC8vIGlmIG5vIHZhbHVlcyBoYXZlIGJlZW4gc2V0IGhlcmUgdGhlbiB0aGlzIG1lYW5zIHRoZSBiaW5kaW5nIGRpZG4ndFxuICAgIC8vIGNoYW5nZSBhbmQgdGhlcmVmb3JlIHRoZSBiaW5kaW5nIHZhbHVlcyB3ZXJlIG5vdCB1cGRhdGVkIHRocm91Z2hcbiAgICAvLyBgc2V0VmFsdWVgIHdoaWNoIG1lYW5zIG5vIG5ldyBwbGF5ZXIgd2lsbCBiZSBwcm92aWRlZC5cbiAgICBpZiAodGhpcy5fZGlydHkpIHtcbiAgICAgIGNvbnN0IHBsYXllciA9IHRoaXMuX2ZhY3RvcnkuZm4oXG4gICAgICAgICAgdGhpcy5fZWxlbWVudCwgdGhpcy5fdHlwZSwgdGhpcy5fdmFsdWVzICEsIGlzRmlyc3RSZW5kZXIsIGN1cnJlbnRQbGF5ZXIgfHwgbnVsbCk7XG4gICAgICB0aGlzLl92YWx1ZXMgPSB7fTtcbiAgICAgIHRoaXMuX2RpcnR5ID0gZmFsc2U7XG4gICAgICByZXR1cm4gcGxheWVyO1xuICAgIH1cblxuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cbn1cblxuLyoqXG4gKiBVc2VkIHRvIHByb3ZpZGUgYSBzdW1tYXJ5IG9mIHRoZSBzdGF0ZSBvZiB0aGUgc3R5bGluZyBjb250ZXh0LlxuICpcbiAqIFRoaXMgaXMgYW4gaW50ZXJuYWwgaW50ZXJmYWNlIHRoYXQgaXMgb25seSB1c2VkIGluc2lkZSBvZiB0ZXN0IHRvb2xpbmcgdG9cbiAqIGhlbHAgc3VtbWFyaXplIHdoYXQncyBnb2luZyBvbiB3aXRoaW4gdGhlIHN0eWxpbmcgY29udGV4dC4gTm9uZSBvZiB0aGlzIGNvZGVcbiAqIGlzIGRlc2lnbmVkIHRvIGJlIGV4cG9ydGVkIHB1YmxpY2x5IGFuZCB3aWxsLCB0aGVyZWZvcmUsIGJlIHRyZWUtc2hha2VuIGF3YXlcbiAqIGR1cmluZyBydW50aW1lLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIExvZ1N1bW1hcnkge1xuICBuYW1lOiBzdHJpbmc7ICAgICAgICAgIC8vXG4gIHN0YXRpY0luZGV4OiBudW1iZXI7ICAgLy9cbiAgZHluYW1pY0luZGV4OiBudW1iZXI7ICAvL1xuICB2YWx1ZTogbnVtYmVyOyAgICAgICAgIC8vXG4gIGZsYWdzOiB7XG4gICAgZGlydHk6IGJvb2xlYW47ICAgICAgICAgICAgICAgICAgICAvL1xuICAgIGNsYXNzOiBib29sZWFuOyAgICAgICAgICAgICAgICAgICAgLy9cbiAgICBzYW5pdGl6ZTogYm9vbGVhbjsgICAgICAgICAgICAgICAgIC8vXG4gICAgcGxheWVyQnVpbGRlcnNEaXJ0eTogYm9vbGVhbjsgICAgICAvL1xuICAgIGJpbmRpbmdBbGxvY2F0aW9uTG9ja2VkOiBib29sZWFuOyAgLy9cbiAgfTtcbn1cblxuLyoqXG4gKiBUaGlzIGZ1bmN0aW9uIGlzIG5vdCBkZXNpZ25lZCB0byBiZSB1c2VkIGluIHByb2R1Y3Rpb24uXG4gKiBJdCBpcyBhIHV0aWxpdHkgdG9vbCBmb3IgZGVidWdnaW5nIGFuZCB0ZXN0aW5nIGFuZCBpdFxuICogd2lsbCBhdXRvbWF0aWNhbGx5IGJlIHRyZWUtc2hha2VuIGF3YXkgZHVyaW5nIHByb2R1Y3Rpb24uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZW5lcmF0ZUNvbmZpZ1N1bW1hcnkoc291cmNlOiBudW1iZXIpOiBMb2dTdW1tYXJ5O1xuZXhwb3J0IGZ1bmN0aW9uIGdlbmVyYXRlQ29uZmlnU3VtbWFyeShzb3VyY2U6IFN0eWxpbmdDb250ZXh0KTogTG9nU3VtbWFyeTtcbmV4cG9ydCBmdW5jdGlvbiBnZW5lcmF0ZUNvbmZpZ1N1bW1hcnkoc291cmNlOiBTdHlsaW5nQ29udGV4dCwgaW5kZXg6IG51bWJlcik6IExvZ1N1bW1hcnk7XG5leHBvcnQgZnVuY3Rpb24gZ2VuZXJhdGVDb25maWdTdW1tYXJ5KHNvdXJjZTogbnVtYmVyIHwgU3R5bGluZ0NvbnRleHQsIGluZGV4PzogbnVtYmVyKTogTG9nU3VtbWFyeSB7XG4gIGxldCBmbGFnLCBuYW1lID0gJ2NvbmZpZyB2YWx1ZSBmb3IgJztcbiAgaWYgKEFycmF5LmlzQXJyYXkoc291cmNlKSkge1xuICAgIGlmIChpbmRleCkge1xuICAgICAgbmFtZSArPSAnaW5kZXg6ICcgKyBpbmRleDtcbiAgICB9IGVsc2Uge1xuICAgICAgbmFtZSArPSAnbWFzdGVyIGNvbmZpZyc7XG4gICAgfVxuICAgIGluZGV4ID0gaW5kZXggfHwgU3R5bGluZ0luZGV4Lk1hc3RlckZsYWdQb3NpdGlvbjtcbiAgICBmbGFnID0gc291cmNlW2luZGV4XSBhcyBudW1iZXI7XG4gIH0gZWxzZSB7XG4gICAgZmxhZyA9IHNvdXJjZTtcbiAgICBuYW1lICs9ICdpbmRleDogJyArIGZsYWc7XG4gIH1cbiAgY29uc3QgZHluYW1pY0luZGV4ID0gZ2V0TXVsdGlPclNpbmdsZUluZGV4KGZsYWcpO1xuICBjb25zdCBzdGF0aWNJbmRleCA9IGdldEluaXRpYWxJbmRleChmbGFnKTtcbiAgcmV0dXJuIHtcbiAgICBuYW1lLFxuICAgIHN0YXRpY0luZGV4LFxuICAgIGR5bmFtaWNJbmRleCxcbiAgICB2YWx1ZTogZmxhZyxcbiAgICBmbGFnczoge1xuICAgICAgZGlydHk6IGZsYWcgJiBTdHlsaW5nRmxhZ3MuRGlydHkgPyB0cnVlIDogZmFsc2UsXG4gICAgICBjbGFzczogZmxhZyAmIFN0eWxpbmdGbGFncy5DbGFzcyA/IHRydWUgOiBmYWxzZSxcbiAgICAgIHNhbml0aXplOiBmbGFnICYgU3R5bGluZ0ZsYWdzLlNhbml0aXplID8gdHJ1ZSA6IGZhbHNlLFxuICAgICAgcGxheWVyQnVpbGRlcnNEaXJ0eTogZmxhZyAmIFN0eWxpbmdGbGFncy5QbGF5ZXJCdWlsZGVyc0RpcnR5ID8gdHJ1ZSA6IGZhbHNlLFxuICAgICAgYmluZGluZ0FsbG9jYXRpb25Mb2NrZWQ6IGZsYWcgJiBTdHlsaW5nRmxhZ3MuQmluZGluZ0FsbG9jYXRpb25Mb2NrZWQgPyB0cnVlIDogZmFsc2UsXG4gICAgfVxuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0RGlyZWN0aXZlSW5kZXhGcm9tRW50cnkoY29udGV4dDogU3R5bGluZ0NvbnRleHQsIGluZGV4OiBudW1iZXIpIHtcbiAgY29uc3QgdmFsdWUgPSBjb250ZXh0W2luZGV4ICsgU3R5bGluZ0luZGV4LlBsYXllckJ1aWxkZXJJbmRleE9mZnNldF0gYXMgbnVtYmVyO1xuICByZXR1cm4gdmFsdWUgJiBEaXJlY3RpdmVPd25lckFuZFBsYXllckJ1aWxkZXJJbmRleC5CaXRNYXNrO1xufVxuXG5mdW5jdGlvbiBnZXRJbml0aWFsU3R5bGluZ1ZhbHVlc0luZGV4T2Yoa2V5VmFsdWVzOiBJbml0aWFsU3R5bGluZ1ZhbHVlcywga2V5OiBzdHJpbmcpOiBudW1iZXIge1xuICBmb3IgKGxldCBpID0gSW5pdGlhbFN0eWxpbmdWYWx1ZXNJbmRleC5LZXlWYWx1ZVN0YXJ0UG9zaXRpb247IGkgPCBrZXlWYWx1ZXMubGVuZ3RoO1xuICAgICAgIGkgKz0gSW5pdGlhbFN0eWxpbmdWYWx1ZXNJbmRleC5TaXplKSB7XG4gICAgaWYgKGtleVZhbHVlc1tpXSA9PT0ga2V5KSByZXR1cm4gaTtcbiAgfVxuICByZXR1cm4gLTE7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjb21wYXJlTG9nU3VtbWFyaWVzKGE6IExvZ1N1bW1hcnksIGI6IExvZ1N1bW1hcnkpIHtcbiAgY29uc3QgbG9nOiBzdHJpbmdbXSA9IFtdO1xuICBjb25zdCBkaWZmczogW3N0cmluZywgYW55LCBhbnldW10gPSBbXTtcbiAgZGlmZlN1bW1hcnlWYWx1ZXMoZGlmZnMsICdzdGF0aWNJbmRleCcsICdzdGF0aWNJbmRleCcsIGEsIGIpO1xuICBkaWZmU3VtbWFyeVZhbHVlcyhkaWZmcywgJ2R5bmFtaWNJbmRleCcsICdkeW5hbWljSW5kZXgnLCBhLCBiKTtcbiAgT2JqZWN0LmtleXMoYS5mbGFncykuZm9yRWFjaChcbiAgICAgIG5hbWUgPT4geyBkaWZmU3VtbWFyeVZhbHVlcyhkaWZmcywgJ2ZsYWdzLicgKyBuYW1lLCBuYW1lLCBhLmZsYWdzLCBiLmZsYWdzKTsgfSk7XG5cbiAgaWYgKGRpZmZzLmxlbmd0aCkge1xuICAgIGxvZy5wdXNoKCdMb2cgU3VtbWFyaWVzIGZvcjonKTtcbiAgICBsb2cucHVzaCgnICBBOiAnICsgYS5uYW1lKTtcbiAgICBsb2cucHVzaCgnICBCOiAnICsgYi5uYW1lKTtcbiAgICBsb2cucHVzaCgnXFxuICBEaWZmZXIgaW4gdGhlIGZvbGxvd2luZyB3YXkgKEEgIT09IEIpOicpO1xuICAgIGRpZmZzLmZvckVhY2gocmVzdWx0ID0+IHtcbiAgICAgIGNvbnN0IFtuYW1lLCBhVmFsLCBiVmFsXSA9IHJlc3VsdDtcbiAgICAgIGxvZy5wdXNoKCcgICAgPT4gJyArIG5hbWUpO1xuICAgICAgbG9nLnB1c2goJyAgICA9PiAnICsgYVZhbCArICcgIT09ICcgKyBiVmFsICsgJ1xcbicpO1xuICAgIH0pO1xuICB9XG5cbiAgcmV0dXJuIGxvZztcbn1cblxuZnVuY3Rpb24gZGlmZlN1bW1hcnlWYWx1ZXMocmVzdWx0OiBhbnlbXSwgbmFtZTogc3RyaW5nLCBwcm9wOiBzdHJpbmcsIGE6IGFueSwgYjogYW55KSB7XG4gIGNvbnN0IGFWYWwgPSBhW3Byb3BdO1xuICBjb25zdCBiVmFsID0gYltwcm9wXTtcbiAgaWYgKGFWYWwgIT09IGJWYWwpIHtcbiAgICByZXN1bHQucHVzaChbbmFtZSwgYVZhbCwgYlZhbF0pO1xuICB9XG59XG5cbmZ1bmN0aW9uIGdldFNpbmdsZVByb3BJbmRleFZhbHVlKFxuICAgIGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBkaXJlY3RpdmVJbmRleDogbnVtYmVyLCBvZmZzZXQ6IG51bWJlciwgaXNDbGFzc0Jhc2VkOiBib29sZWFuKSB7XG4gIGNvbnN0IHNpbmdsZVByb3BPZmZzZXRSZWdpc3RyeUluZGV4ID1cbiAgICAgIGNvbnRleHRbU3R5bGluZ0luZGV4LkRpcmVjdGl2ZVJlZ2lzdHJ5UG9zaXRpb25dXG4gICAgICAgICAgICAgWyhkaXJlY3RpdmVJbmRleCAqIERpcmVjdGl2ZVJlZ2lzdHJ5VmFsdWVzSW5kZXguU2l6ZSkgK1xuICAgICAgICAgICAgICBEaXJlY3RpdmVSZWdpc3RyeVZhbHVlc0luZGV4LlNpbmdsZVByb3BWYWx1ZXNJbmRleE9mZnNldF0gYXMgbnVtYmVyO1xuICBjb25zdCBvZmZzZXRzID0gY29udGV4dFtTdHlsaW5nSW5kZXguU2luZ2xlUHJvcE9mZnNldFBvc2l0aW9uc107XG4gIGNvbnN0IGluZGV4Rm9yT2Zmc2V0ID0gc2luZ2xlUHJvcE9mZnNldFJlZ2lzdHJ5SW5kZXggK1xuICAgICAgU2luZ2xlUHJvcE9mZnNldFZhbHVlc0luZGV4LlZhbHVlU3RhcnRQb3NpdGlvbiArXG4gICAgICAoaXNDbGFzc0Jhc2VkID9cbiAgICAgICAgICAgb2Zmc2V0c1xuICAgICAgICAgICAgICAgW3NpbmdsZVByb3BPZmZzZXRSZWdpc3RyeUluZGV4ICsgU2luZ2xlUHJvcE9mZnNldFZhbHVlc0luZGV4LlN0eWxlc0NvdW50UG9zaXRpb25dIDpcbiAgICAgICAgICAgMCkgK1xuICAgICAgb2Zmc2V0O1xuICByZXR1cm4gb2Zmc2V0c1tpbmRleEZvck9mZnNldF07XG59XG5cbmZ1bmN0aW9uIGdldFN0eWxlU2FuaXRpemVyKGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBkaXJlY3RpdmVJbmRleDogbnVtYmVyKTogU3R5bGVTYW5pdGl6ZUZufG51bGwge1xuICBjb25zdCBkaXJzID0gY29udGV4dFtTdHlsaW5nSW5kZXguRGlyZWN0aXZlUmVnaXN0cnlQb3NpdGlvbl07XG4gIGNvbnN0IHZhbHVlID0gZGlyc1xuICAgICAgICAgICAgICAgICAgICBbZGlyZWN0aXZlSW5kZXggKiBEaXJlY3RpdmVSZWdpc3RyeVZhbHVlc0luZGV4LlNpemUgK1xuICAgICAgICAgICAgICAgICAgICAgRGlyZWN0aXZlUmVnaXN0cnlWYWx1ZXNJbmRleC5TdHlsZVNhbml0aXplck9mZnNldF0gfHxcbiAgICAgIGRpcnNbRGlyZWN0aXZlUmVnaXN0cnlWYWx1ZXNJbmRleC5TdHlsZVNhbml0aXplck9mZnNldF0gfHwgbnVsbDtcbiAgcmV0dXJuIHZhbHVlIGFzIFN0eWxlU2FuaXRpemVGbiB8IG51bGw7XG59XG5cbmZ1bmN0aW9uIGFsbG93VmFsdWVDaGFuZ2UoXG4gICAgY3VycmVudFZhbHVlOiBzdHJpbmcgfCBib29sZWFuIHwgbnVsbCwgbmV3VmFsdWU6IHN0cmluZyB8IGJvb2xlYW4gfCBudWxsLFxuICAgIGN1cnJlbnREaXJlY3RpdmVPd25lcjogbnVtYmVyLCBuZXdEaXJlY3RpdmVPd25lcjogbnVtYmVyKSB7XG4gIC8vIHRoZSBjb2RlIGJlbG93IHJlbGllcyB0aGUgaW1wb3J0YW5jZSBvZiBkaXJlY3RpdmUncyBiZWluZyB0aWVkIHRvIHRoZWlyXG4gIC8vIGluZGV4IHZhbHVlLiBUaGUgaW5kZXggdmFsdWVzIGZvciBlYWNoIGRpcmVjdGl2ZSBhcmUgZGVyaXZlZCBmcm9tIGJlaW5nXG4gIC8vIHJlZ2lzdGVyZWQgaW50byB0aGUgc3R5bGluZyBjb250ZXh0IGRpcmVjdGl2ZSByZWdpc3RyeS4gVGhlIG1vc3QgaW1wb3J0YW50XG4gIC8vIGRpcmVjdGl2ZSBpcyB0aGUgcGFyZW50IGNvbXBvbmVudCBkaXJlY3RpdmUgKHRoZSB0ZW1wbGF0ZSkgYW5kIGVhY2ggZGlyZWN0aXZlXG4gIC8vIHRoYXQgaXMgYWRkZWQgYWZ0ZXIgaXMgY29uc2lkZXJlZCBsZXNzIGltcG9ydGFudCB0aGFuIHRoZSBwcmV2aW91cyBlbnRyeS4gVGhpc1xuICAvLyBwcmlvcml0aXphdGlvbiBvZiBkaXJlY3RpdmVzIGVuYWJsZXMgdGhlIHN0eWxpbmcgYWxnb3JpdGhtIHRvIGRlY2lkZSBpZiBhIHN0eWxlXG4gIC8vIG9yIGNsYXNzIHNob3VsZCBiZSBhbGxvd2VkIHRvIGJlIHVwZGF0ZWQvcmVwbGFjZWQgaW4gY2FzZSBhbiBlYXJsaWVyIGRpcmVjdGl2ZVxuICAvLyBhbHJlYWR5IHdyb3RlIHRvIHRoZSBleGFjdCBzYW1lIHN0eWxlLXByb3BlcnR5IG9yIGNsYXNzTmFtZSB2YWx1ZS4gSW4gb3RoZXIgd29yZHNcbiAgLy8gdGhpcyBkZWNpZGVzIHdoYXQgdG8gZG8gaWYgYW5kIHdoZW4gdGhlcmUgaXMgYSBjb2xsaXNpb24uXG4gIGlmIChjdXJyZW50VmFsdWUgIT0gbnVsbCkge1xuICAgIGlmIChuZXdWYWx1ZSAhPSBudWxsKSB7XG4gICAgICAvLyBpZiBhIGRpcmVjdGl2ZSBpbmRleCBpcyBsb3dlciB0aGFuIGl0IGFsd2F5cyBoYXMgcHJpb3JpdHkgb3ZlciB0aGVcbiAgICAgIC8vIHByZXZpb3VzIGRpcmVjdGl2ZSdzIHZhbHVlLi4uXG4gICAgICByZXR1cm4gbmV3RGlyZWN0aXZlT3duZXIgPD0gY3VycmVudERpcmVjdGl2ZU93bmVyO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBvbmx5IHdyaXRlIGEgbnVsbCB2YWx1ZSBpbiBjYXNlIGl0J3MgdGhlIHNhbWUgb3duZXIgd3JpdGluZyBpdC5cbiAgICAgIC8vIHRoaXMgYXZvaWRzIGhhdmluZyBhIGhpZ2hlci1wcmlvcml0eSBkaXJlY3RpdmUgd3JpdGUgdG8gbnVsbFxuICAgICAgLy8gb25seSB0byBoYXZlIGEgbGVzc2VyLXByaW9yaXR5IGRpcmVjdGl2ZSBjaGFuZ2UgcmlnaHQgdG8gYVxuICAgICAgLy8gbm9uLW51bGwgdmFsdWUgaW1tZWRpYXRlbHkgYWZ0ZXJ3YXJkcy5cbiAgICAgIHJldHVybiBjdXJyZW50RGlyZWN0aXZlT3duZXIgPT09IG5ld0RpcmVjdGl2ZU93bmVyO1xuICAgIH1cbiAgfVxuICByZXR1cm4gdHJ1ZTtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBjbGFzc05hbWUgc3RyaW5nIG9mIGFsbCB0aGUgaW5pdGlhbCBjbGFzc2VzIGZvciB0aGUgZWxlbWVudC5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIGlzIGRlc2lnbmVkIHRvIHBvcHVsYXRlIGFuZCBjYWNoZSBhbGwgdGhlIHN0YXRpYyBjbGFzc1xuICogdmFsdWVzIGludG8gYSBjbGFzc05hbWUgc3RyaW5nLiBUaGUgY2FjaGluZyBtZWNoYW5pc20gd29ya3MgYnkgcGxhY2luZ1xuICogdGhlIGNvbXBsZXRlZCBjbGFzc05hbWUgc3RyaW5nIGludG8gdGhlIGluaXRpYWwgdmFsdWVzIGFycmF5IGludG8gYVxuICogZGVkaWNhdGVkIHNsb3QuIFRoaXMgd2lsbCBwcmV2ZW50IHRoZSBmdW5jdGlvbiBmcm9tIGhhdmluZyB0byBwb3B1bGF0ZVxuICogdGhlIHN0cmluZyBlYWNoIHRpbWUgYW4gZWxlbWVudCBpcyBjcmVhdGVkIG9yIG1hdGNoZWQuXG4gKlxuICogQHJldHVybnMgdGhlIGNsYXNzTmFtZSBzdHJpbmcgKGUuZy4gYG9uIGFjdGl2ZSByZWRgKVxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0SW5pdGlhbENsYXNzTmFtZVZhbHVlKGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0KTogc3RyaW5nIHtcbiAgY29uc3QgaW5pdGlhbENsYXNzVmFsdWVzID0gY29udGV4dFtTdHlsaW5nSW5kZXguSW5pdGlhbENsYXNzVmFsdWVzUG9zaXRpb25dO1xuICBsZXQgY2xhc3NOYW1lID0gaW5pdGlhbENsYXNzVmFsdWVzW0luaXRpYWxTdHlsaW5nVmFsdWVzSW5kZXguQ2FjaGVkU3RyaW5nVmFsdWVQb3NpdGlvbl07XG4gIGlmIChjbGFzc05hbWUgPT09IG51bGwpIHtcbiAgICBjbGFzc05hbWUgPSAnJztcbiAgICBmb3IgKGxldCBpID0gSW5pdGlhbFN0eWxpbmdWYWx1ZXNJbmRleC5LZXlWYWx1ZVN0YXJ0UG9zaXRpb247IGkgPCBpbml0aWFsQ2xhc3NWYWx1ZXMubGVuZ3RoO1xuICAgICAgICAgaSArPSBJbml0aWFsU3R5bGluZ1ZhbHVlc0luZGV4LlNpemUpIHtcbiAgICAgIGNvbnN0IGlzUHJlc2VudCA9IGluaXRpYWxDbGFzc1ZhbHVlc1tpICsgMV07XG4gICAgICBpZiAoaXNQcmVzZW50KSB7XG4gICAgICAgIGNsYXNzTmFtZSArPSAoY2xhc3NOYW1lLmxlbmd0aCA/ICcgJyA6ICcnKSArIGluaXRpYWxDbGFzc1ZhbHVlc1tpXTtcbiAgICAgIH1cbiAgICB9XG4gICAgaW5pdGlhbENsYXNzVmFsdWVzW0luaXRpYWxTdHlsaW5nVmFsdWVzSW5kZXguQ2FjaGVkU3RyaW5nVmFsdWVQb3NpdGlvbl0gPSBjbGFzc05hbWU7XG4gIH1cbiAgcmV0dXJuIGNsYXNzTmFtZTtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBzdHlsZSBzdHJpbmcgb2YgYWxsIHRoZSBpbml0aWFsIHN0eWxlcyBmb3IgdGhlIGVsZW1lbnQuXG4gKlxuICogVGhpcyBmdW5jdGlvbiBpcyBkZXNpZ25lZCB0byBwb3B1bGF0ZSBhbmQgY2FjaGUgYWxsIHRoZSBzdGF0aWMgc3R5bGVcbiAqIHZhbHVlcyBpbnRvIGEgc3R5bGUgc3RyaW5nLiBUaGUgY2FjaGluZyBtZWNoYW5pc20gd29ya3MgYnkgcGxhY2luZ1xuICogdGhlIGNvbXBsZXRlZCBzdHlsZSBzdHJpbmcgaW50byB0aGUgaW5pdGlhbCB2YWx1ZXMgYXJyYXkgaW50byBhXG4gKiBkZWRpY2F0ZWQgc2xvdC4gVGhpcyB3aWxsIHByZXZlbnQgdGhlIGZ1bmN0aW9uIGZyb20gaGF2aW5nIHRvIHBvcHVsYXRlXG4gKiB0aGUgc3RyaW5nIGVhY2ggdGltZSBhbiBlbGVtZW50IGlzIGNyZWF0ZWQgb3IgbWF0Y2hlZC5cbiAqXG4gKiBAcmV0dXJucyB0aGUgc3R5bGUgc3RyaW5nIChlLmcuIGB3aWR0aDoxMDBweDtoZWlnaHQ6MjAwcHhgKVxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0SW5pdGlhbFN0eWxlU3RyaW5nVmFsdWUoY29udGV4dDogU3R5bGluZ0NvbnRleHQpOiBzdHJpbmcge1xuICBjb25zdCBpbml0aWFsU3R5bGVWYWx1ZXMgPSBjb250ZXh0W1N0eWxpbmdJbmRleC5Jbml0aWFsU3R5bGVWYWx1ZXNQb3NpdGlvbl07XG4gIGxldCBzdHlsZVN0cmluZyA9IGluaXRpYWxTdHlsZVZhbHVlc1tJbml0aWFsU3R5bGluZ1ZhbHVlc0luZGV4LkNhY2hlZFN0cmluZ1ZhbHVlUG9zaXRpb25dO1xuICBpZiAoc3R5bGVTdHJpbmcgPT09IG51bGwpIHtcbiAgICBzdHlsZVN0cmluZyA9ICcnO1xuICAgIGZvciAobGV0IGkgPSBJbml0aWFsU3R5bGluZ1ZhbHVlc0luZGV4LktleVZhbHVlU3RhcnRQb3NpdGlvbjsgaSA8IGluaXRpYWxTdHlsZVZhbHVlcy5sZW5ndGg7XG4gICAgICAgICBpICs9IEluaXRpYWxTdHlsaW5nVmFsdWVzSW5kZXguU2l6ZSkge1xuICAgICAgY29uc3QgdmFsdWUgPSBpbml0aWFsU3R5bGVWYWx1ZXNbaSArIDFdO1xuICAgICAgaWYgKHZhbHVlICE9PSBudWxsKSB7XG4gICAgICAgIHN0eWxlU3RyaW5nICs9IChzdHlsZVN0cmluZy5sZW5ndGggPyAnOycgOiAnJykgKyBgJHtpbml0aWFsU3R5bGVWYWx1ZXNbaV19OiR7dmFsdWV9YDtcbiAgICAgIH1cbiAgICB9XG4gICAgaW5pdGlhbFN0eWxlVmFsdWVzW0luaXRpYWxTdHlsaW5nVmFsdWVzSW5kZXguQ2FjaGVkU3RyaW5nVmFsdWVQb3NpdGlvbl0gPSBzdHlsZVN0cmluZztcbiAgfVxuICByZXR1cm4gc3R5bGVTdHJpbmc7XG59XG5cbi8qKlxuICogUmV0dXJucyB0aGUgY3VycmVudCBjYWNoZWQgbXV0bGktdmFsdWUgZm9yIGEgZ2l2ZW4gZGlyZWN0aXZlSW5kZXggd2l0aGluIHRoZSBwcm92aWRlZCBjb250ZXh0LlxuICovXG5mdW5jdGlvbiByZWFkQ2FjaGVkTWFwVmFsdWUoXG4gICAgY29udGV4dDogU3R5bGluZ0NvbnRleHQsIGVudHJ5SXNDbGFzc0Jhc2VkOiBib29sZWFuLCBkaXJlY3RpdmVJbmRleDogbnVtYmVyKSB7XG4gIGNvbnN0IHZhbHVlczogTWFwQmFzZWRPZmZzZXRWYWx1ZXMgPVxuICAgICAgY29udGV4dFtlbnRyeUlzQ2xhc3NCYXNlZCA/IFN0eWxpbmdJbmRleC5DYWNoZWRNdWx0aUNsYXNzZXMgOiBTdHlsaW5nSW5kZXguQ2FjaGVkTXVsdGlTdHlsZXNdO1xuICBjb25zdCBpbmRleCA9IE1hcEJhc2VkT2Zmc2V0VmFsdWVzSW5kZXguVmFsdWVzU3RhcnRQb3NpdGlvbiArXG4gICAgICBkaXJlY3RpdmVJbmRleCAqIE1hcEJhc2VkT2Zmc2V0VmFsdWVzSW5kZXguU2l6ZTtcbiAgcmV0dXJuIHZhbHVlc1tpbmRleCArIE1hcEJhc2VkT2Zmc2V0VmFsdWVzSW5kZXguVmFsdWVPZmZzZXRdIHx8IG51bGw7XG59XG5cbi8qKlxuICogRGV0ZXJtaW5lcyB3aGV0aGVyIHRoZSBwcm92aWRlZCBtdWx0aSBzdHlsaW5nIHZhbHVlIHNob3VsZCBiZSB1cGRhdGVkIG9yIG5vdC5cbiAqXG4gKiBCZWNhdXNlIGBbc3R5bGVdYCBhbmQgYFtjbGFzc11gIGJpbmRpbmdzIHJlbHkgb24gYW4gaWRlbnRpdHkgY2hhbmdlIHRvIG9jY3VyIGJlZm9yZVxuICogYXBwbHlpbmcgbmV3IHZhbHVlcywgdGhlIHN0eWxpbmcgYWxnb3JpdGhtIG1heSBub3QgdXBkYXRlIGFuIGV4aXN0aW5nIGVudHJ5IGludG9cbiAqIHRoZSBjb250ZXh0IGlmIGEgcHJldmlvdXMgZGlyZWN0aXZlJ3MgZW50cnkgY2hhbmdlZCBzaGFwZS5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIHdpbGwgZGVjaWRlIHdoZXRoZXIgb3Igbm90IGEgdmFsdWUgc2hvdWxkIGJlIGFwcGxpZWQgKGlmIHRoZXJlIGlzIGFcbiAqIGNhY2hlIG1pc3MpIHRvIHRoZSBjb250ZXh0IGJhc2VkIG9uIHRoZSBmb2xsb3dpbmcgcnVsZXM6XG4gKlxuICogLSBJZiB0aGVyZSBpcyBhbiBpZGVudGl0eSBjaGFuZ2UgYmV0d2VlbiB0aGUgZXhpc3RpbmcgdmFsdWUgYW5kIG5ldyB2YWx1ZVxuICogLSBJZiB0aGVyZSBpcyBubyBleGlzdGluZyB2YWx1ZSBjYWNoZWQgKGZpcnN0IHdyaXRlKVxuICogLSBJZiBhIHByZXZpb3VzIGRpcmVjdGl2ZSBmbGFnZ2VkIHRoZSBleGlzdGluZyBjYWNoZWQgdmFsdWUgYXMgZGlydHlcbiAqL1xuZnVuY3Rpb24gaXNNdWx0aVZhbHVlQ2FjaGVIaXQoXG4gICAgY29udGV4dDogU3R5bGluZ0NvbnRleHQsIGVudHJ5SXNDbGFzc0Jhc2VkOiBib29sZWFuLCBkaXJlY3RpdmVJbmRleDogbnVtYmVyLFxuICAgIG5ld1ZhbHVlOiBhbnkpOiBib29sZWFuIHtcbiAgY29uc3QgaW5kZXhPZkNhY2hlZFZhbHVlcyA9XG4gICAgICBlbnRyeUlzQ2xhc3NCYXNlZCA/IFN0eWxpbmdJbmRleC5DYWNoZWRNdWx0aUNsYXNzZXMgOiBTdHlsaW5nSW5kZXguQ2FjaGVkTXVsdGlTdHlsZXM7XG4gIGNvbnN0IGNhY2hlZFZhbHVlcyA9IGNvbnRleHRbaW5kZXhPZkNhY2hlZFZhbHVlc10gYXMgTWFwQmFzZWRPZmZzZXRWYWx1ZXM7XG4gIGNvbnN0IGluZGV4ID0gTWFwQmFzZWRPZmZzZXRWYWx1ZXNJbmRleC5WYWx1ZXNTdGFydFBvc2l0aW9uICtcbiAgICAgIGRpcmVjdGl2ZUluZGV4ICogTWFwQmFzZWRPZmZzZXRWYWx1ZXNJbmRleC5TaXplO1xuICBpZiAoY2FjaGVkVmFsdWVzW2luZGV4ICsgTWFwQmFzZWRPZmZzZXRWYWx1ZXNJbmRleC5EaXJ0eUZsYWdPZmZzZXRdKSByZXR1cm4gZmFsc2U7XG4gIHJldHVybiBuZXdWYWx1ZSA9PT0gTk9fQ0hBTkdFIHx8XG4gICAgICByZWFkQ2FjaGVkTWFwVmFsdWUoY29udGV4dCwgZW50cnlJc0NsYXNzQmFzZWQsIGRpcmVjdGl2ZUluZGV4KSA9PT0gbmV3VmFsdWU7XG59XG5cbi8qKlxuICogVXBkYXRlcyB0aGUgY2FjaGVkIHN0YXR1cyBvZiBhIG11bHRpLXN0eWxpbmcgdmFsdWUgaW4gdGhlIGNvbnRleHQuXG4gKlxuICogVGhlIGNhY2hlZCBtYXAgYXJyYXkgKHdoaWNoIGV4aXN0cyBpbiB0aGUgY29udGV4dCkgY29udGFpbnMgYSBtYW5pZmVzdCBvZlxuICogZWFjaCBtdWx0aS1zdHlsaW5nIGVudHJ5IChgW3N0eWxlXWAgYW5kIGBbY2xhc3NdYCBlbnRyaWVzKSBmb3IgdGhlIHRlbXBsYXRlXG4gKiBhcyB3ZWxsIGFzIGFsbCBkaXJlY3RpdmVzLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gd2lsbCB1cGRhdGUgdGhlIGNhY2hlZCBzdGF0dXMgb2YgdGhlIHByb3ZpZGVkIG11bHRpLXN0eWxlXG4gKiBlbnRyeSB3aXRoaW4gdGhlIGNhY2hlLlxuICpcbiAqIFdoZW4gY2FsbGVkLCB0aGlzIGZ1bmN0aW9uIHdpbGwgdXBkYXRlIHRoZSBmb2xsb3dpbmcgaW5mb3JtYXRpb246XG4gKiAtIFRoZSBhY3R1YWwgY2FjaGVkIHZhbHVlICh0aGUgcmF3IHZhbHVlIHRoYXQgd2FzIHBhc3NlZCBpbnRvIGBbc3R5bGVdYCBvciBgW2NsYXNzXWApXG4gKiAtIFRoZSB0b3RhbCBhbW91bnQgb2YgdW5pcXVlIHN0eWxpbmcgZW50cmllcyB0aGF0IHRoaXMgdmFsdWUgaGFzIHdyaXR0ZW4gaW50byB0aGUgY29udGV4dFxuICogLSBUaGUgZXhhY3QgcG9zaXRpb24gb2Ygd2hlcmUgdGhlIG11bHRpIHN0eWxpbmcgZW50cmllcyBzdGFydCBpbiB0aGUgY29udGV4dCBmb3IgdGhpcyBiaW5kaW5nXG4gKiAtIFRoZSBkaXJ0eSBmbGFnIHdpbGwgYmUgc2V0IHRvIHRydWVcbiAqXG4gKiBJZiB0aGUgYGRpcnR5RnV0dXJlVmFsdWVzYCBwYXJhbSBpcyBwcm92aWRlZCB0aGVuIGl0IHdpbGwgdXBkYXRlIGFsbCBmdXR1cmUgZW50cmllcyAoYmluZGluZ1xuICogZW50cmllcyB0aGF0IGV4aXN0IGFzIGFwYXJ0IG9mIG90aGVyIGRpcmVjdGl2ZXMpIHRvIGJlIGRpcnR5IGFzIHdlbGwuIFRoaXMgd2lsbCBmb3JjZSB0aGVcbiAqIHN0eWxpbmcgYWxnb3JpdGhtIHRvIHJlYXBwbHkgdGhvc2UgdmFsdWVzIG9uY2UgY2hhbmdlIGRldGVjdGlvbiBjaGVja3MgdGhlbSAod2hpY2ggd2lsbCBpblxuICogdHVybiBjYXVzZSB0aGUgc3R5bGluZyBjb250ZXh0IHRvIHVwZGF0ZSBpdHNlbGYgYW5kIHRoZSBjb3JyZWN0IHN0eWxpbmcgdmFsdWVzIHdpbGwgYmVcbiAqIHJlbmRlcmVkIG9uIHNjcmVlbikuXG4gKi9cbmZ1bmN0aW9uIHVwZGF0ZUNhY2hlZE1hcFZhbHVlKFxuICAgIGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBkaXJlY3RpdmVJbmRleDogbnVtYmVyLCBlbnRyeUlzQ2xhc3NCYXNlZDogYm9vbGVhbiwgY2FjaGVWYWx1ZTogYW55LFxuICAgIHN0YXJ0UG9zaXRpb246IG51bWJlciwgZW5kUG9zaXRpb246IG51bWJlciwgdG90YWxWYWx1ZXM6IG51bWJlciwgZGlydHlGdXR1cmVWYWx1ZXM6IGJvb2xlYW4pIHtcbiAgY29uc3QgdmFsdWVzID1cbiAgICAgIGNvbnRleHRbZW50cnlJc0NsYXNzQmFzZWQgPyBTdHlsaW5nSW5kZXguQ2FjaGVkTXVsdGlDbGFzc2VzIDogU3R5bGluZ0luZGV4LkNhY2hlZE11bHRpU3R5bGVzXTtcblxuICBjb25zdCBpbmRleCA9IE1hcEJhc2VkT2Zmc2V0VmFsdWVzSW5kZXguVmFsdWVzU3RhcnRQb3NpdGlvbiArXG4gICAgICBkaXJlY3RpdmVJbmRleCAqIE1hcEJhc2VkT2Zmc2V0VmFsdWVzSW5kZXguU2l6ZTtcblxuICAvLyBpbiB0aGUgZXZlbnQgdGhhdCB0aGlzIGlzIHRydWUgd2UgYXNzdW1lIHRoYXQgZnV0dXJlIHZhbHVlcyBhcmUgZGlydHkgYW5kIHRoZXJlZm9yZVxuICAvLyB3aWxsIGJlIGNoZWNrZWQgYWdhaW4gaW4gdGhlIG5leHQgQ0QgY3ljbGVcbiAgaWYgKGRpcnR5RnV0dXJlVmFsdWVzKSB7XG4gICAgY29uc3QgbmV4dFN0YXJ0UG9zaXRpb24gPSBzdGFydFBvc2l0aW9uICsgdG90YWxWYWx1ZXMgKiBNYXBCYXNlZE9mZnNldFZhbHVlc0luZGV4LlNpemU7XG4gICAgZm9yIChsZXQgaSA9IGluZGV4ICsgTWFwQmFzZWRPZmZzZXRWYWx1ZXNJbmRleC5TaXplOyBpIDwgdmFsdWVzLmxlbmd0aDtcbiAgICAgICAgIGkgKz0gTWFwQmFzZWRPZmZzZXRWYWx1ZXNJbmRleC5TaXplKSB7XG4gICAgICB2YWx1ZXNbaSArIE1hcEJhc2VkT2Zmc2V0VmFsdWVzSW5kZXguUG9zaXRpb25TdGFydE9mZnNldF0gPSBuZXh0U3RhcnRQb3NpdGlvbjtcbiAgICAgIHZhbHVlc1tpICsgTWFwQmFzZWRPZmZzZXRWYWx1ZXNJbmRleC5EaXJ0eUZsYWdPZmZzZXRdID0gMTtcbiAgICB9XG4gIH1cblxuICB2YWx1ZXNbaW5kZXggKyBNYXBCYXNlZE9mZnNldFZhbHVlc0luZGV4LkRpcnR5RmxhZ09mZnNldF0gPSAwO1xuICB2YWx1ZXNbaW5kZXggKyBNYXBCYXNlZE9mZnNldFZhbHVlc0luZGV4LlBvc2l0aW9uU3RhcnRPZmZzZXRdID0gc3RhcnRQb3NpdGlvbjtcbiAgdmFsdWVzW2luZGV4ICsgTWFwQmFzZWRPZmZzZXRWYWx1ZXNJbmRleC5WYWx1ZU9mZnNldF0gPSBjYWNoZVZhbHVlO1xuICB2YWx1ZXNbaW5kZXggKyBNYXBCYXNlZE9mZnNldFZhbHVlc0luZGV4LlZhbHVlQ291bnRPZmZzZXRdID0gdG90YWxWYWx1ZXM7XG5cbiAgLy8gdGhlIGNvZGUgYmVsb3cgY291bnRzIHRoZSB0b3RhbCBhbW91bnQgb2Ygc3R5bGluZyB2YWx1ZXMgdGhhdCBleGlzdCBpblxuICAvLyB0aGUgY29udGV4dCB1cCB1bnRpbCB0aGlzIGRpcmVjdGl2ZS4gVGhpcyB2YWx1ZSB3aWxsIGJlIGxhdGVyIHVzZWQgdG9cbiAgLy8gdXBkYXRlIHRoZSBjYWNoZWQgdmFsdWUgbWFwJ3MgdG90YWwgY291bnRlciB2YWx1ZS5cbiAgbGV0IHRvdGFsU3R5bGluZ0VudHJpZXMgPSB0b3RhbFZhbHVlcztcbiAgZm9yIChsZXQgaSA9IE1hcEJhc2VkT2Zmc2V0VmFsdWVzSW5kZXguVmFsdWVzU3RhcnRQb3NpdGlvbjsgaSA8IGluZGV4O1xuICAgICAgIGkgKz0gTWFwQmFzZWRPZmZzZXRWYWx1ZXNJbmRleC5TaXplKSB7XG4gICAgdG90YWxTdHlsaW5nRW50cmllcyArPSB2YWx1ZXNbaSArIE1hcEJhc2VkT2Zmc2V0VmFsdWVzSW5kZXguVmFsdWVDb3VudE9mZnNldF07XG4gIH1cblxuICAvLyBiZWNhdXNlIHN0eWxlIHZhbHVlcyBjb21lIGJlZm9yZSBjbGFzcyB2YWx1ZXMgaW4gdGhlIGNvbnRleHQgdGhpcyBtZWFuc1xuICAvLyB0aGF0IGlmIGFueSBuZXcgdmFsdWVzIHdlcmUgaW5zZXJ0ZWQgdGhlbiB0aGUgY2FjaGUgdmFsdWVzIGFycmF5IGZvclxuICAvLyBjbGFzc2VzIGlzIG91dCBvZiBzeW5jLiBUaGUgY29kZSBiZWxvdyB3aWxsIHVwZGF0ZSB0aGUgb2Zmc2V0cyB0byBwb2ludFxuICAvLyB0byB0aGVpciBuZXcgdmFsdWVzLlxuICBpZiAoIWVudHJ5SXNDbGFzc0Jhc2VkKSB7XG4gICAgY29uc3QgY2xhc3NDYWNoZSA9IGNvbnRleHRbU3R5bGluZ0luZGV4LkNhY2hlZE11bHRpQ2xhc3Nlc107XG4gICAgY29uc3QgY2xhc3Nlc1N0YXJ0UG9zaXRpb24gPSBjbGFzc0NhY2hlXG4gICAgICAgIFtNYXBCYXNlZE9mZnNldFZhbHVlc0luZGV4LlZhbHVlc1N0YXJ0UG9zaXRpb24gK1xuICAgICAgICAgTWFwQmFzZWRPZmZzZXRWYWx1ZXNJbmRleC5Qb3NpdGlvblN0YXJ0T2Zmc2V0XTtcbiAgICBjb25zdCBkaWZmSW5TdGFydFBvc2l0aW9uID0gZW5kUG9zaXRpb24gLSBjbGFzc2VzU3RhcnRQb3NpdGlvbjtcbiAgICBmb3IgKGxldCBpID0gTWFwQmFzZWRPZmZzZXRWYWx1ZXNJbmRleC5WYWx1ZXNTdGFydFBvc2l0aW9uOyBpIDwgY2xhc3NDYWNoZS5sZW5ndGg7XG4gICAgICAgICBpICs9IE1hcEJhc2VkT2Zmc2V0VmFsdWVzSW5kZXguU2l6ZSkge1xuICAgICAgY2xhc3NDYWNoZVtpICsgTWFwQmFzZWRPZmZzZXRWYWx1ZXNJbmRleC5Qb3NpdGlvblN0YXJ0T2Zmc2V0XSArPSBkaWZmSW5TdGFydFBvc2l0aW9uO1xuICAgIH1cbiAgfVxuXG4gIHZhbHVlc1tNYXBCYXNlZE9mZnNldFZhbHVlc0luZGV4LkVudHJpZXNDb3VudFBvc2l0aW9uXSA9IHRvdGFsU3R5bGluZ0VudHJpZXM7XG59XG5cbmZ1bmN0aW9uIGh5cGhlbmF0ZUVudHJpZXMoZW50cmllczogc3RyaW5nW10pOiBzdHJpbmdbXSB7XG4gIGNvbnN0IG5ld0VudHJpZXM6IHN0cmluZ1tdID0gW107XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgZW50cmllcy5sZW5ndGg7IGkrKykge1xuICAgIG5ld0VudHJpZXMucHVzaChoeXBoZW5hdGUoZW50cmllc1tpXSkpO1xuICB9XG4gIHJldHVybiBuZXdFbnRyaWVzO1xufVxuXG5mdW5jdGlvbiBoeXBoZW5hdGUodmFsdWU6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiB2YWx1ZS5yZXBsYWNlKFxuICAgICAgL1thLXpdW0EtWl0vZywgbWF0Y2ggPT4gYCR7bWF0Y2guY2hhckF0KDApfS0ke21hdGNoLmNoYXJBdCgxKS50b0xvd2VyQ2FzZSgpfWApO1xufVxuXG5mdW5jdGlvbiByZWdpc3Rlck11bHRpTWFwRW50cnkoXG4gICAgY29udGV4dDogU3R5bGluZ0NvbnRleHQsIGRpcmVjdGl2ZUluZGV4OiBudW1iZXIsIGVudHJ5SXNDbGFzc0Jhc2VkOiBib29sZWFuLFxuICAgIHN0YXJ0UG9zaXRpb246IG51bWJlciwgY291bnQgPSAwKSB7XG4gIGNvbnN0IGNhY2hlZFZhbHVlcyA9XG4gICAgICBjb250ZXh0W2VudHJ5SXNDbGFzc0Jhc2VkID8gU3R5bGluZ0luZGV4LkNhY2hlZE11bHRpQ2xhc3NlcyA6IFN0eWxpbmdJbmRleC5DYWNoZWRNdWx0aVN0eWxlc107XG4gIGlmIChkaXJlY3RpdmVJbmRleCA+IDApIHtcbiAgICBjb25zdCBsaW1pdCA9IE1hcEJhc2VkT2Zmc2V0VmFsdWVzSW5kZXguVmFsdWVzU3RhcnRQb3NpdGlvbiArXG4gICAgICAgIChkaXJlY3RpdmVJbmRleCAqIE1hcEJhc2VkT2Zmc2V0VmFsdWVzSW5kZXguU2l6ZSk7XG4gICAgd2hpbGUgKGNhY2hlZFZhbHVlcy5sZW5ndGggPCBsaW1pdCkge1xuICAgICAgLy8gdGhpcyBtZWFucyB0aGF0IE9OTFkgZGlyZWN0aXZlIGNsYXNzIHN0eWxpbmcgKGxpa2UgbmdDbGFzcykgd2FzIHVzZWRcbiAgICAgIC8vIHRoZXJlZm9yZSB0aGUgcm9vdCBkaXJlY3RpdmUgd2lsbCBzdGlsbCBuZWVkIHRvIGJlIGZpbGxlZCBpbiBhcyB3ZWxsXG4gICAgICAvLyBhcyBhbnkgb3RoZXIgZGlyZWN0aXZlIHNwYWNlcyBpbiBjYXNlIHRoZXkgb25seSB1c2VkIHN0YXRpYyB2YWx1ZXNcbiAgICAgIGNhY2hlZFZhbHVlcy5wdXNoKDAsIHN0YXJ0UG9zaXRpb24sIG51bGwsIDApO1xuICAgIH1cbiAgfVxuICBjYWNoZWRWYWx1ZXMucHVzaCgwLCBzdGFydFBvc2l0aW9uLCBudWxsLCBjb3VudCk7XG59XG5cbi8qKlxuICogSW5zZXJ0cyBvciB1cGRhdGVzIGFuIGV4aXN0aW5nIGVudHJ5IGluIHRoZSBwcm92aWRlZCBgc3RhdGljU3R5bGVzYCBjb2xsZWN0aW9uLlxuICpcbiAqIEBwYXJhbSBpbmRleCB0aGUgaW5kZXggcmVwcmVzZW50aW5nIGFuIGV4aXN0aW5nIHN0eWxpbmcgZW50cnkgaW4gdGhlIGNvbGxlY3Rpb246XG4gKiAgaWYgcHJvdmlkZWQgKG51bWVyaWMpOiB0aGVuIGl0IHdpbGwgdXBkYXRlIHRoZSBleGlzdGluZyBlbnRyeSBhdCB0aGUgZ2l2ZW4gcG9zaXRpb25cbiAqICBpZiBudWxsOiB0aGVuIGl0IHdpbGwgaW5zZXJ0IGEgbmV3IGVudHJ5IHdpdGhpbiB0aGUgY29sbGVjdGlvblxuICogQHBhcmFtIHN0YXRpY1N0eWxlcyBhIGNvbGxlY3Rpb24gb2Ygc3R5bGUgb3IgY2xhc3MgZW50cmllcyB3aGVyZSB0aGUgdmFsdWUgd2lsbFxuICogIGJlIGluc2VydGVkIG9yIHBhdGNoZWRcbiAqIEBwYXJhbSBwcm9wIHRoZSBwcm9wZXJ0eSB2YWx1ZSBvZiB0aGUgZW50cnkgKGUuZy4gYHdpZHRoYCAoc3R5bGVzKSBvciBgZm9vYCAoY2xhc3NlcykpXG4gKiBAcGFyYW0gdmFsdWUgdGhlIHN0eWxpbmcgdmFsdWUgb2YgdGhlIGVudHJ5IChlLmcuIGBhYnNvbHV0ZWAgKHN0eWxlcykgb3IgYHRydWVgIChjbGFzc2VzKSlcbiAqIEBwYXJhbSBkaXJlY3RpdmVPd25lckluZGV4IHRoZSBkaXJlY3RpdmUgb3duZXIgaW5kZXggdmFsdWUgb2YgdGhlIHN0eWxpbmcgc291cmNlIHJlc3BvbnNpYmxlXG4gKiAgICAgICAgZm9yIHRoZXNlIHN0eWxlcyAoc2VlIGBpbnRlcmZhY2VzL3N0eWxpbmcudHMjZGlyZWN0aXZlc2AgZm9yIG1vcmUgaW5mbylcbiAqIEByZXR1cm5zIHRoZSBpbmRleCBvZiB0aGUgdXBkYXRlZCBvciBuZXcgZW50cnkgd2l0aGluIHRoZSBjb2xsZWN0aW9uXG4gKi9cbmZ1bmN0aW9uIGFkZE9yVXBkYXRlU3RhdGljU3R5bGUoXG4gICAgaW5kZXg6IG51bWJlciB8IG51bGwsIHN0YXRpY1N0eWxlczogSW5pdGlhbFN0eWxpbmdWYWx1ZXMsIHByb3A6IHN0cmluZyxcbiAgICB2YWx1ZTogc3RyaW5nIHwgYm9vbGVhbiB8IG51bGwsIGRpcmVjdGl2ZU93bmVySW5kZXg6IG51bWJlcikge1xuICBpZiAoaW5kZXggPT09IG51bGwpIHtcbiAgICBpbmRleCA9IHN0YXRpY1N0eWxlcy5sZW5ndGg7XG4gICAgc3RhdGljU3R5bGVzLnB1c2gobnVsbCwgbnVsbCwgbnVsbCk7XG4gICAgc3RhdGljU3R5bGVzW2luZGV4ICsgSW5pdGlhbFN0eWxpbmdWYWx1ZXNJbmRleC5Qcm9wT2Zmc2V0XSA9IHByb3A7XG4gIH1cbiAgc3RhdGljU3R5bGVzW2luZGV4ICsgSW5pdGlhbFN0eWxpbmdWYWx1ZXNJbmRleC5WYWx1ZU9mZnNldF0gPSB2YWx1ZTtcbiAgc3RhdGljU3R5bGVzW2luZGV4ICsgSW5pdGlhbFN0eWxpbmdWYWx1ZXNJbmRleC5EaXJlY3RpdmVPd25lck9mZnNldF0gPSBkaXJlY3RpdmVPd25lckluZGV4O1xuICByZXR1cm4gaW5kZXg7XG59XG5cbmZ1bmN0aW9uIGFzc2VydFZhbGlkRGlyZWN0aXZlSW5kZXgoY29udGV4dDogU3R5bGluZ0NvbnRleHQsIGRpcmVjdGl2ZUluZGV4OiBudW1iZXIpIHtcbiAgY29uc3QgZGlycyA9IGNvbnRleHRbU3R5bGluZ0luZGV4LkRpcmVjdGl2ZVJlZ2lzdHJ5UG9zaXRpb25dO1xuICBjb25zdCBpbmRleCA9IGRpcmVjdGl2ZUluZGV4ICogRGlyZWN0aXZlUmVnaXN0cnlWYWx1ZXNJbmRleC5TaXplO1xuICBpZiAoaW5kZXggPj0gZGlycy5sZW5ndGggfHxcbiAgICAgIGRpcnNbaW5kZXggKyBEaXJlY3RpdmVSZWdpc3RyeVZhbHVlc0luZGV4LlNpbmdsZVByb3BWYWx1ZXNJbmRleE9mZnNldF0gPT09IC0xKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdUaGUgcHJvdmlkZWQgZGlyZWN0aXZlIGlzIG5vdCByZWdpc3RlcmVkIHdpdGggdGhlIHN0eWxpbmcgY29udGV4dCcpO1xuICB9XG59Il19