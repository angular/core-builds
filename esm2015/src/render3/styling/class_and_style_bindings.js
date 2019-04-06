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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xhc3NfYW5kX3N0eWxlX2JpbmRpbmdzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9zdHlsaW5nL2NsYXNzX2FuZF9zdHlsZV9iaW5kaW5ncy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7O0FBUUEsT0FBTyxFQUFDLFdBQVcsRUFBRSxTQUFTLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFHaEQsT0FBTyxFQUFzQixtQkFBbUIsRUFBRSxvQkFBb0IsRUFBQyxNQUFNLHdCQUF3QixDQUFDO0FBR3RHLE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxXQUFXLENBQUM7QUFDcEMsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLDhCQUE4QixDQUFDO0FBRTVELE9BQU8sRUFBQyxVQUFVLElBQUksK0JBQStCLEVBQUUsVUFBVSxJQUFJLDBCQUEwQixFQUFDLE1BQU0sMkJBQTJCLENBQUM7QUFDbEksT0FBTyxFQUFDLGtCQUFrQixFQUFDLE1BQU0sa0JBQWtCLENBQUM7QUFDcEQsT0FBTyxFQUFDLGlCQUFpQixFQUFFLGtCQUFrQixFQUFFLG9DQUFvQyxFQUFFLHlCQUF5QixFQUFFLGdCQUFnQixFQUFDLE1BQU0sUUFBUSxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQXdCaEosTUFBTSxVQUFVLHVCQUF1QixDQUNuQyxLQUFrQixFQUFFLGlCQUF5QixFQUFFLGlCQUF5QixDQUFDOztVQUNyRSxPQUFPLEdBQUcseUJBQXlCLEVBQUU7SUFDM0MsMkJBQTJCLENBQUMsT0FBTyxFQUFFLEtBQUssRUFBRSxpQkFBaUIsRUFBRSxjQUFjLENBQUMsQ0FBQztJQUMvRSxPQUFPLE9BQU8sQ0FBQztBQUNqQixDQUFDOzs7Ozs7Ozs7Ozs7O0FBWUQsTUFBTSxVQUFVLDJCQUEyQixDQUN2QyxPQUF1QixFQUFFLEtBQWtCLEVBQUUsc0JBQThCLEVBQzNFLGNBQXNCO0lBQ3hCLCtE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LENBQUMsS0FBSyxzQkFBd0MsQ0FBQyxHQUFHLEtBQUssQ0FBQztJQUNwRSxZQUFZLENBQUMsS0FBSywrQkFBaUQsQ0FBQyxHQUFHLG1CQUFtQixDQUFDO0lBQzNGLE9BQU8sS0FBSyxDQUFDO0FBQ2YsQ0FBQzs7Ozs7O0FBRUQsU0FBUyx5QkFBeUIsQ0FBQyxPQUF1QixFQUFFLGNBQXNCOztVQUMxRSxJQUFJLEdBQUcsT0FBTyxtQ0FBd0M7O1VBQ3RELEtBQUssR0FBRyxjQUFjLGVBQW9DO0lBQ2hFLElBQUksS0FBSyxJQUFJLElBQUksQ0FBQyxNQUFNO1FBQ3BCLElBQUksQ0FBQyxLQUFLLHNDQUEyRCxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUU7UUFDakYsTUFBTSxJQUFJLEtBQUssQ0FBQyxtRUFBbUUsQ0FBQyxDQUFDO0tBQ3RGO0FBQ0gsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuKiBAbGljZW5zZVxuKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbipcbiogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuKi9cbmltcG9ydCB7U3R5bGVTYW5pdGl6ZUZufSBmcm9tICcuLi8uLi9zYW5pdGl6YXRpb24vc3R5bGVfc2FuaXRpemVyJztcbmltcG9ydCB7RU1QVFlfQVJSQVksIEVNUFRZX09CSn0gZnJvbSAnLi4vZW1wdHknO1xuaW1wb3J0IHtBdHRyaWJ1dGVNYXJrZXIsIFRBdHRyaWJ1dGVzfSBmcm9tICcuLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtCaW5kaW5nU3RvcmUsIEJpbmRpbmdUeXBlLCBQbGF5ZXIsIFBsYXllckJ1aWxkZXIsIFBsYXllckZhY3RvcnksIFBsYXllckluZGV4fSBmcm9tICcuLi9pbnRlcmZhY2VzL3BsYXllcic7XG5pbXBvcnQge1JFbGVtZW50LCBSZW5kZXJlcjMsIFJlbmRlcmVyU3R5bGVGbGFnczMsIGlzUHJvY2VkdXJhbFJlbmRlcmVyfSBmcm9tICcuLi9pbnRlcmZhY2VzL3JlbmRlcmVyJztcbmltcG9ydCB7RGlyZWN0aXZlT3duZXJBbmRQbGF5ZXJCdWlsZGVySW5kZXgsIERpcmVjdGl2ZVJlZ2lzdHJ5VmFsdWVzSW5kZXgsIEluaXRpYWxTdHlsaW5nVmFsdWVzLCBJbml0aWFsU3R5bGluZ1ZhbHVlc0luZGV4LCBNYXBCYXNlZE9mZnNldFZhbHVlcywgTWFwQmFzZWRPZmZzZXRWYWx1ZXNJbmRleCwgU2luZ2xlUHJvcE9mZnNldFZhbHVlcywgU2luZ2xlUHJvcE9mZnNldFZhbHVlc0luZGV4LCBTdHlsaW5nQ29udGV4dCwgU3R5bGluZ0ZsYWdzLCBTdHlsaW5nSW5kZXh9IGZyb20gJy4uL2ludGVyZmFjZXMvc3R5bGluZyc7XG5pbXBvcnQge0xWaWV3LCBSb290Q29udGV4dH0gZnJvbSAnLi4vaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7Tk9fQ0hBTkdFfSBmcm9tICcuLi90b2tlbnMnO1xuaW1wb3J0IHtnZXRSb290Q29udGV4dH0gZnJvbSAnLi4vdXRpbC92aWV3X3RyYXZlcnNhbF91dGlscyc7XG5cbmltcG9ydCB7YWxsb3dGbHVzaCBhcyBhbGxvd0hvc3RJbnN0cnVjdGlvbnNRdWV1ZUZsdXNoLCBmbHVzaFF1ZXVlIGFzIGZsdXNoSG9zdEluc3RydWN0aW9uc1F1ZXVlfSBmcm9tICcuL2hvc3RfaW5zdHJ1Y3Rpb25zX3F1ZXVlJztcbmltcG9ydCB7Qm91bmRQbGF5ZXJGYWN0b3J5fSBmcm9tICcuL3BsYXllcl9mYWN0b3J5JztcbmltcG9ydCB7YWRkUGxheWVySW50ZXJuYWwsIGFsbG9jUGxheWVyQ29udGV4dCwgYWxsb2NhdGVPclVwZGF0ZURpcmVjdGl2ZUludG9Db250ZXh0LCBjcmVhdGVFbXB0eVN0eWxpbmdDb250ZXh0LCBnZXRQbGF5ZXJDb250ZXh0fSBmcm9tICcuL3V0aWwnO1xuXG5cbi8qKlxuICogVGhpcyBmaWxlIGluY2x1ZGVzIHRoZSBjb2RlIHRvIHBvd2VyIGFsbCBzdHlsaW5nLWJpbmRpbmcgb3BlcmF0aW9ucyBpbiBBbmd1bGFyLlxuICpcbiAqIFRoZXNlIGluY2x1ZGU6XG4gKiBbc3R5bGVdPVwibXlTdHlsZU9ialwiXG4gKiBbY2xhc3NdPVwibXlDbGFzc09ialwiXG4gKiBbc3R5bGUucHJvcF09XCJteVByb3BWYWx1ZVwiXG4gKiBbY2xhc3MubmFtZV09XCJteUNsYXNzVmFsdWVcIlxuICpcbiAqIEl0IGFsc28gaW5jbHVkZXMgY29kZSB0aGF0IHdpbGwgYWxsb3cgc3R5bGUgYmluZGluZyBjb2RlIHRvIG9wZXJhdGUgd2l0aGluIGhvc3RcbiAqIGJpbmRpbmdzIGZvciBjb21wb25lbnRzL2RpcmVjdGl2ZXMuXG4gKlxuICogVGhlcmUgYXJlIG1hbnkgZGlmZmVyZW50IHdheXMgaW4gd2hpY2ggdGhlc2UgZnVuY3Rpb25zIGJlbG93IGFyZSBjYWxsZWQuIFBsZWFzZSBzZWVcbiAqIGByZW5kZXIzL2ludGVyZmFjZXMvc3R5bGluZy50c2AgdG8gZ2V0IGEgYmV0dGVyIGlkZWEgb2YgaG93IHRoZSBzdHlsaW5nIGFsZ29yaXRobSB3b3Jrcy5cbiAqL1xuXG5cblxuLyoqXG4gKiBDcmVhdGVzIGEgbmV3IFN0eWxpbmdDb250ZXh0IGFuIGZpbGxzIGl0IHdpdGggdGhlIHByb3ZpZGVkIHN0YXRpYyBzdHlsaW5nIGF0dHJpYnV0ZSB2YWx1ZXMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbml0aWFsaXplU3RhdGljQ29udGV4dChcbiAgICBhdHRyczogVEF0dHJpYnV0ZXMsIHN0eWxpbmdTdGFydEluZGV4OiBudW1iZXIsIGRpcmVjdGl2ZUluZGV4OiBudW1iZXIgPSAwKTogU3R5bGluZ0NvbnRleHQge1xuICBjb25zdCBjb250ZXh0ID0gY3JlYXRlRW1wdHlTdHlsaW5nQ29udGV4dCgpO1xuICBwYXRjaENvbnRleHRXaXRoU3RhdGljQXR0cnMoY29udGV4dCwgYXR0cnMsIHN0eWxpbmdTdGFydEluZGV4LCBkaXJlY3RpdmVJbmRleCk7XG4gIHJldHVybiBjb250ZXh0O1xufVxuXG4vKipcbiAqIERlc2lnbmVkIHRvIHVwZGF0ZSBhbiBleGlzdGluZyBzdHlsaW5nIGNvbnRleHQgd2l0aCBuZXcgc3RhdGljIHN0eWxpbmdcbiAqIGRhdGEgKGNsYXNzZXMgYW5kIHN0eWxlcykuXG4gKlxuICogQHBhcmFtIGNvbnRleHQgdGhlIGV4aXN0aW5nIHN0eWxpbmcgY29udGV4dFxuICogQHBhcmFtIGF0dHJzIGFuIGFycmF5IG9mIG5ldyBzdGF0aWMgc3R5bGluZyBhdHRyaWJ1dGVzIHRoYXQgd2lsbCBiZVxuICogICAgICAgICAgICAgIGFzc2lnbmVkIHRvIHRoZSBjb250ZXh0XG4gKiBAcGFyYW0gYXR0cnNTdHlsaW5nU3RhcnRJbmRleCB3aGF0IGluZGV4IHRvIHN0YXJ0IGl0ZXJhdGluZyB3aXRoaW4gdGhlXG4gKiAgICAgICAgICAgICAgcHJvdmlkZWQgYGF0dHJzYCBhcnJheSB0byBzdGFydCByZWFkaW5nIHN0eWxlIGFuZCBjbGFzcyB2YWx1ZXNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHBhdGNoQ29udGV4dFdpdGhTdGF0aWNBdHRycyhcbiAgICBjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgYXR0cnM6IFRBdHRyaWJ1dGVzLCBhdHRyc1N0eWxpbmdTdGFydEluZGV4OiBudW1iZXIsXG4gICAgZGlyZWN0aXZlSW5kZXg6IG51bWJlcik6IHZvaWQge1xuICAvLyB0aGlzIG1lYW5zIHRoZSBjb250ZXh0IGhhcyBhbHJlYWR5IGJlZW4gc2V0IGFuZCBpbnN0YW50aWF0ZWRcbiAgaWYgKGNvbnRleHRbU3R5bGluZ0luZGV4Lk1hc3RlckZsYWdQb3NpdGlvbl0gJiBTdHlsaW5nRmxhZ3MuQmluZGluZ0FsbG9jYXRpb25Mb2NrZWQpIHJldHVybjtcblxuICBhbGxvY2F0ZU9yVXBkYXRlRGlyZWN0aXZlSW50b0NvbnRleHQoY29udGV4dCwgZGlyZWN0aXZlSW5kZXgpO1xuXG4gIGxldCBpbml0aWFsQ2xhc3NlczogSW5pdGlhbFN0eWxpbmdWYWx1ZXN8bnVsbCA9IG51bGw7XG4gIGxldCBpbml0aWFsU3R5bGVzOiBJbml0aWFsU3R5bGluZ1ZhbHVlc3xudWxsID0gbnVsbDtcbiAgbGV0IG1vZGUgPSAtMTtcbiAgZm9yIChsZXQgaSA9IGF0dHJzU3R5bGluZ1N0YXJ0SW5kZXg7IGkgPCBhdHRycy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IGF0dHIgPSBhdHRyc1tpXTtcbiAgICBpZiAodHlwZW9mIGF0dHIgPT0gJ251bWJlcicpIHtcbiAgICAgIG1vZGUgPSBhdHRyO1xuICAgIH0gZWxzZSBpZiAobW9kZSA9PSBBdHRyaWJ1dGVNYXJrZXIuQ2xhc3Nlcykge1xuICAgICAgaW5pdGlhbENsYXNzZXMgPSBpbml0aWFsQ2xhc3NlcyB8fCBjb250ZXh0W1N0eWxpbmdJbmRleC5Jbml0aWFsQ2xhc3NWYWx1ZXNQb3NpdGlvbl07XG4gICAgICBwYXRjaEluaXRpYWxTdHlsaW5nVmFsdWUoaW5pdGlhbENsYXNzZXMsIGF0dHIsIHRydWUsIGRpcmVjdGl2ZUluZGV4KTtcbiAgICB9IGVsc2UgaWYgKG1vZGUgPT0gQXR0cmlidXRlTWFya2VyLlN0eWxlcykge1xuICAgICAgaW5pdGlhbFN0eWxlcyA9IGluaXRpYWxTdHlsZXMgfHwgY29udGV4dFtTdHlsaW5nSW5kZXguSW5pdGlhbFN0eWxlVmFsdWVzUG9zaXRpb25dO1xuICAgICAgcGF0Y2hJbml0aWFsU3R5bGluZ1ZhbHVlKGluaXRpYWxTdHlsZXMsIGF0dHIsIGF0dHJzWysraV0sIGRpcmVjdGl2ZUluZGV4KTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBEZXNpZ25lZCB0byBhZGQgYSBzdHlsZSBvciBjbGFzcyB2YWx1ZSBpbnRvIHRoZSBleGlzdGluZyBzZXQgb2YgaW5pdGlhbCBzdHlsZXMuXG4gKlxuICogVGhlIGZ1bmN0aW9uIHdpbGwgc2VhcmNoIGFuZCBmaWd1cmUgb3V0IGlmIGEgc3R5bGUvY2xhc3MgdmFsdWUgaXMgYWxyZWFkeSBwcmVzZW50XG4gKiB3aXRoaW4gdGhlIHByb3ZpZGVkIGluaXRpYWwgc3R5bGluZyBhcnJheS4gSWYgYW5kIHdoZW4gYSBzdHlsZS9jbGFzcyB2YWx1ZSBpc1xuICogcHJlc2VudCAoYWxsb2NhdGVkKSB0aGVuIHRoZSBjb2RlIGJlbG93IHdpbGwgc2V0IHRoZSBuZXcgdmFsdWUgZGVwZW5kaW5nIG9uIHRoZVxuICogZm9sbG93aW5nIGNhc2VzOlxuICpcbiAqICAxKSBpZiB0aGUgZXhpc3RpbmcgdmFsdWUgaXMgZmFsc3kgKHRoaXMgaGFwcGVucyBiZWNhdXNlIGEgYFtjbGFzcy5wcm9wXWAgb3JcbiAqICAgICBgW3N0eWxlLnByb3BdYCBiaW5kaW5nIHdhcyBzZXQsIGJ1dCB0aGVyZSB3YXNuJ3QgYSBtYXRjaGluZyBzdGF0aWMgc3R5bGVcbiAqICAgICBvciBjbGFzcyBwcmVzZW50IG9uIHRoZSBjb250ZXh0KVxuICogIDIpIGlmIHRoZSB2YWx1ZSB3YXMgc2V0IGFscmVhZHkgYnkgdGhlIHRlbXBsYXRlLCBjb21wb25lbnQgb3IgZGlyZWN0aXZlLCBidXQgdGhlXG4gKiAgICAgbmV3IHZhbHVlIGlzIHNldCBvbiBhIGhpZ2hlciBsZXZlbCAoaS5lLiBhIHN1YiBjb21wb25lbnQgd2hpY2ggZXh0ZW5kcyBhIHBhcmVudFxuICogICAgIGNvbXBvbmVudCBzZXRzIGl0cyB2YWx1ZSBhZnRlciB0aGUgcGFyZW50IGhhcyBhbHJlYWR5IHNldCB0aGUgc2FtZSBvbmUpXG4gKiAgMykgaWYgdGhlIHNhbWUgZGlyZWN0aXZlIHByb3ZpZGVzIGEgbmV3IHNldCBvZiBzdHlsaW5nIHZhbHVlcyB0byBzZXRcbiAqXG4gKiBAcGFyYW0gaW5pdGlhbFN0eWxpbmcgdGhlIGluaXRpYWwgc3R5bGluZyBhcnJheSB3aGVyZSB0aGUgbmV3IHN0eWxpbmcgZW50cnkgd2lsbCBiZSBhZGRlZCB0b1xuICogQHBhcmFtIHByb3AgdGhlIHByb3BlcnR5IHZhbHVlIG9mIHRoZSBuZXcgZW50cnkgKGUuZy4gYHdpZHRoYCAoc3R5bGVzKSBvciBgZm9vYCAoY2xhc3NlcykpXG4gKiBAcGFyYW0gdmFsdWUgdGhlIHN0eWxpbmcgdmFsdWUgb2YgdGhlIG5ldyBlbnRyeSAoZS5nLiBgYWJzb2x1dGVgIChzdHlsZXMpIG9yIGB0cnVlYCAoY2xhc3NlcykpXG4gKiBAcGFyYW0gZGlyZWN0aXZlT3duZXJJbmRleCB0aGUgZGlyZWN0aXZlIG93bmVyIGluZGV4IHZhbHVlIG9mIHRoZSBzdHlsaW5nIHNvdXJjZSByZXNwb25zaWJsZVxuICogICAgICAgIGZvciB0aGVzZSBzdHlsZXMgKHNlZSBgaW50ZXJmYWNlcy9zdHlsaW5nLnRzI2RpcmVjdGl2ZXNgIGZvciBtb3JlIGluZm8pXG4gKi9cbmZ1bmN0aW9uIHBhdGNoSW5pdGlhbFN0eWxpbmdWYWx1ZShcbiAgICBpbml0aWFsU3R5bGluZzogSW5pdGlhbFN0eWxpbmdWYWx1ZXMsIHByb3A6IHN0cmluZywgdmFsdWU6IGFueSxcbiAgICBkaXJlY3RpdmVPd25lckluZGV4OiBudW1iZXIpOiB2b2lkIHtcbiAgZm9yIChsZXQgaSA9IEluaXRpYWxTdHlsaW5nVmFsdWVzSW5kZXguS2V5VmFsdWVTdGFydFBvc2l0aW9uOyBpIDwgaW5pdGlhbFN0eWxpbmcubGVuZ3RoO1xuICAgICAgIGkgKz0gSW5pdGlhbFN0eWxpbmdWYWx1ZXNJbmRleC5TaXplKSB7XG4gICAgY29uc3Qga2V5ID0gaW5pdGlhbFN0eWxpbmdbaSArIEluaXRpYWxTdHlsaW5nVmFsdWVzSW5kZXguUHJvcE9mZnNldF07XG4gICAgaWYgKGtleSA9PT0gcHJvcCkge1xuICAgICAgY29uc3QgZXhpc3RpbmdWYWx1ZSA9XG4gICAgICAgICAgaW5pdGlhbFN0eWxpbmdbaSArIEluaXRpYWxTdHlsaW5nVmFsdWVzSW5kZXguVmFsdWVPZmZzZXRdIGFzIHN0cmluZyB8IG51bGwgfCBib29sZWFuO1xuICAgICAgY29uc3QgZXhpc3RpbmdPd25lciA9XG4gICAgICAgICAgaW5pdGlhbFN0eWxpbmdbaSArIEluaXRpYWxTdHlsaW5nVmFsdWVzSW5kZXguRGlyZWN0aXZlT3duZXJPZmZzZXRdIGFzIG51bWJlcjtcbiAgICAgIGlmIChhbGxvd1ZhbHVlQ2hhbmdlKGV4aXN0aW5nVmFsdWUsIHZhbHVlLCBleGlzdGluZ093bmVyLCBkaXJlY3RpdmVPd25lckluZGV4KSkge1xuICAgICAgICBhZGRPclVwZGF0ZVN0YXRpY1N0eWxlKGksIGluaXRpYWxTdHlsaW5nLCBwcm9wLCB2YWx1ZSwgZGlyZWN0aXZlT3duZXJJbmRleCk7XG4gICAgICB9XG4gICAgICByZXR1cm47XG4gICAgfVxuICB9XG5cbiAgLy8gV2UgZGlkIG5vdCBmaW5kIGV4aXN0aW5nIGtleSwgYWRkIGEgbmV3IG9uZS5cbiAgYWRkT3JVcGRhdGVTdGF0aWNTdHlsZShudWxsLCBpbml0aWFsU3R5bGluZywgcHJvcCwgdmFsdWUsIGRpcmVjdGl2ZU93bmVySW5kZXgpO1xufVxuXG4vKipcbiAqIFJ1bnMgdGhyb3VnaCB0aGUgaW5pdGlhbCBjbGFzcyB2YWx1ZXMgcHJlc2VudCBpbiB0aGUgcHJvdmlkZWRcbiAqIGNvbnRleHQgYW5kIHJlbmRlcnMgdGhlbSB2aWEgdGhlIHByb3ZpZGVkIHJlbmRlcmVyIG9uIHRoZSBlbGVtZW50LlxuICpcbiAqIEBwYXJhbSBlbGVtZW50IHRoZSBlbGVtZW50IHRoZSBzdHlsaW5nIHdpbGwgYmUgYXBwbGllZCB0b1xuICogQHBhcmFtIGNvbnRleHQgdGhlIHNvdXJjZSBzdHlsaW5nIGNvbnRleHQgd2hpY2ggY29udGFpbnMgdGhlIGluaXRpYWwgY2xhc3MgdmFsdWVzXG4gKiBAcGFyYW0gcmVuZGVyZXIgdGhlIHJlbmRlcmVyIGluc3RhbmNlIHRoYXQgd2lsbCBiZSB1c2VkIHRvIGFwcGx5IHRoZSBjbGFzc1xuICogQHJldHVybnMgdGhlIGluZGV4IHRoYXQgdGhlIGNsYXNzZXMgd2VyZSBhcHBsaWVkIHVwIHVudGlsXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZW5kZXJJbml0aWFsQ2xhc3NlcyhcbiAgICBlbGVtZW50OiBSRWxlbWVudCwgY29udGV4dDogU3R5bGluZ0NvbnRleHQsIHJlbmRlcmVyOiBSZW5kZXJlcjMsIHN0YXJ0SW5kZXg/OiBudW1iZXIpOiBudW1iZXIge1xuICBjb25zdCBpbml0aWFsQ2xhc3NlcyA9IGNvbnRleHRbU3R5bGluZ0luZGV4LkluaXRpYWxDbGFzc1ZhbHVlc1Bvc2l0aW9uXTtcbiAgbGV0IGkgPSBzdGFydEluZGV4IHx8IEluaXRpYWxTdHlsaW5nVmFsdWVzSW5kZXguS2V5VmFsdWVTdGFydFBvc2l0aW9uO1xuICB3aGlsZSAoaSA8IGluaXRpYWxDbGFzc2VzLmxlbmd0aCkge1xuICAgIGNvbnN0IHZhbHVlID0gaW5pdGlhbENsYXNzZXNbaSArIEluaXRpYWxTdHlsaW5nVmFsdWVzSW5kZXguVmFsdWVPZmZzZXRdO1xuICAgIGlmICh2YWx1ZSkge1xuICAgICAgc2V0Q2xhc3MoXG4gICAgICAgICAgZWxlbWVudCwgaW5pdGlhbENsYXNzZXNbaSArIEluaXRpYWxTdHlsaW5nVmFsdWVzSW5kZXguUHJvcE9mZnNldF0gYXMgc3RyaW5nLCB0cnVlLFxuICAgICAgICAgIHJlbmRlcmVyLCBudWxsKTtcbiAgICB9XG4gICAgaSArPSBJbml0aWFsU3R5bGluZ1ZhbHVlc0luZGV4LlNpemU7XG4gIH1cbiAgcmV0dXJuIGk7XG59XG5cbi8qKlxuICogUnVucyB0aHJvdWdoIHRoZSBpbml0aWFsIHN0eWxlcyB2YWx1ZXMgcHJlc2VudCBpbiB0aGUgcHJvdmlkZWRcbiAqIGNvbnRleHQgYW5kIHJlbmRlcnMgdGhlbSB2aWEgdGhlIHByb3ZpZGVkIHJlbmRlcmVyIG9uIHRoZSBlbGVtZW50LlxuICpcbiAqIEBwYXJhbSBlbGVtZW50IHRoZSBlbGVtZW50IHRoZSBzdHlsaW5nIHdpbGwgYmUgYXBwbGllZCB0b1xuICogQHBhcmFtIGNvbnRleHQgdGhlIHNvdXJjZSBzdHlsaW5nIGNvbnRleHQgd2hpY2ggY29udGFpbnMgdGhlIGluaXRpYWwgY2xhc3MgdmFsdWVzXG4gKiBAcGFyYW0gcmVuZGVyZXIgdGhlIHJlbmRlcmVyIGluc3RhbmNlIHRoYXQgd2lsbCBiZSB1c2VkIHRvIGFwcGx5IHRoZSBjbGFzc1xuICogQHJldHVybnMgdGhlIGluZGV4IHRoYXQgdGhlIHN0eWxlcyB3ZXJlIGFwcGxpZWQgdXAgdW50aWxcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlbmRlckluaXRpYWxTdHlsZXMoXG4gICAgZWxlbWVudDogUkVsZW1lbnQsIGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCByZW5kZXJlcjogUmVuZGVyZXIzLCBzdGFydEluZGV4PzogbnVtYmVyKSB7XG4gIGNvbnN0IGluaXRpYWxTdHlsZXMgPSBjb250ZXh0W1N0eWxpbmdJbmRleC5Jbml0aWFsU3R5bGVWYWx1ZXNQb3NpdGlvbl07XG4gIGxldCBpID0gc3RhcnRJbmRleCB8fCBJbml0aWFsU3R5bGluZ1ZhbHVlc0luZGV4LktleVZhbHVlU3RhcnRQb3NpdGlvbjtcbiAgd2hpbGUgKGkgPCBpbml0aWFsU3R5bGVzLmxlbmd0aCkge1xuICAgIGNvbnN0IHZhbHVlID0gaW5pdGlhbFN0eWxlc1tpICsgSW5pdGlhbFN0eWxpbmdWYWx1ZXNJbmRleC5WYWx1ZU9mZnNldF07XG4gICAgaWYgKHZhbHVlKSB7XG4gICAgICBzZXRTdHlsZShcbiAgICAgICAgICBlbGVtZW50LCBpbml0aWFsU3R5bGVzW2kgKyBJbml0aWFsU3R5bGluZ1ZhbHVlc0luZGV4LlByb3BPZmZzZXRdIGFzIHN0cmluZyxcbiAgICAgICAgICB2YWx1ZSBhcyBzdHJpbmcsIHJlbmRlcmVyLCBudWxsKTtcbiAgICB9XG4gICAgaSArPSBJbml0aWFsU3R5bGluZ1ZhbHVlc0luZGV4LlNpemU7XG4gIH1cbiAgcmV0dXJuIGk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhbGxvd05ld0JpbmRpbmdzRm9yU3R5bGluZ0NvbnRleHQoY29udGV4dDogU3R5bGluZ0NvbnRleHQpOiBib29sZWFuIHtcbiAgcmV0dXJuIChjb250ZXh0W1N0eWxpbmdJbmRleC5NYXN0ZXJGbGFnUG9zaXRpb25dICYgU3R5bGluZ0ZsYWdzLkJpbmRpbmdBbGxvY2F0aW9uTG9ja2VkKSA9PT0gMDtcbn1cblxuLyoqXG4gKiBBZGRzIGluIG5ldyBiaW5kaW5nIHZhbHVlcyB0byBhIHN0eWxpbmcgY29udGV4dC5cbiAqXG4gKiBJZiBhIGRpcmVjdGl2ZSB2YWx1ZSBpcyBwcm92aWRlZCB0aGVuIGFsbCBwcm92aWRlZCBjbGFzcy9zdHlsZSBiaW5kaW5nIG5hbWVzIHdpbGxcbiAqIHJlZmVyZW5jZSB0aGUgcHJvdmlkZWQgZGlyZWN0aXZlLlxuICpcbiAqIEBwYXJhbSBjb250ZXh0IHRoZSBleGlzdGluZyBzdHlsaW5nIGNvbnRleHRcbiAqIEBwYXJhbSBjbGFzc0JpbmRpbmdOYW1lcyBhbiBhcnJheSBvZiBjbGFzcyBiaW5kaW5nIG5hbWVzIHRoYXQgd2lsbCBiZSBhZGRlZCB0byB0aGUgY29udGV4dFxuICogQHBhcmFtIHN0eWxlQmluZGluZ05hbWVzIGFuIGFycmF5IG9mIHN0eWxlIGJpbmRpbmcgbmFtZXMgdGhhdCB3aWxsIGJlIGFkZGVkIHRvIHRoZSBjb250ZXh0XG4gKiBAcGFyYW0gc3R5bGVTYW5pdGl6ZXIgYW4gb3B0aW9uYWwgc2FuaXRpemVyIHRoYXQgaGFuZGxlIGFsbCBzYW5pdGl6YXRpb24gb24gZm9yIGVhY2ggb2ZcbiAqICAgIHRoZSBiaW5kaW5ncyBhZGRlZCB0byB0aGUgY29udGV4dC4gTm90ZSB0aGF0IGlmIGEgZGlyZWN0aXZlIGlzIHByb3ZpZGVkIHRoZW4gdGhlIHNhbml0aXplclxuICogICAgaW5zdGFuY2Ugd2lsbCBvbmx5IGJlIGFjdGl2ZSBpZiBhbmQgd2hlbiB0aGUgZGlyZWN0aXZlIHVwZGF0ZXMgdGhlIGJpbmRpbmdzIHRoYXQgaXQgb3ducy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHVwZGF0ZUNvbnRleHRXaXRoQmluZGluZ3MoXG4gICAgY29udGV4dDogU3R5bGluZ0NvbnRleHQsIGRpcmVjdGl2ZUluZGV4OiBudW1iZXIsIGNsYXNzQmluZGluZ05hbWVzPzogc3RyaW5nW10gfCBudWxsLFxuICAgIHN0eWxlQmluZGluZ05hbWVzPzogc3RyaW5nW10gfCBudWxsLCBzdHlsZVNhbml0aXplcj86IFN0eWxlU2FuaXRpemVGbiB8IG51bGwpIHtcbiAgaWYgKGNvbnRleHRbU3R5bGluZ0luZGV4Lk1hc3RlckZsYWdQb3NpdGlvbl0gJiBTdHlsaW5nRmxhZ3MuQmluZGluZ0FsbG9jYXRpb25Mb2NrZWQpIHJldHVybjtcblxuICAvLyB0aGlzIG1lYW5zIHRoZSBjb250ZXh0IGhhcyBhbHJlYWR5IGJlZW4gcGF0Y2hlZCB3aXRoIHRoZSBkaXJlY3RpdmUncyBiaW5kaW5nc1xuICBjb25zdCBpc05ld0RpcmVjdGl2ZSA9XG4gICAgICBmaW5kT3JQYXRjaERpcmVjdGl2ZUludG9SZWdpc3RyeShjb250ZXh0LCBkaXJlY3RpdmVJbmRleCwgZmFsc2UsIHN0eWxlU2FuaXRpemVyKTtcbiAgaWYgKCFpc05ld0RpcmVjdGl2ZSkge1xuICAgIC8vIHRoaXMgbWVhbnMgdGhlIGRpcmVjdGl2ZSBoYXMgYWxyZWFkeSBiZWVuIHBhdGNoZWQgaW4gLi4uIE5vIHBvaW50IGluIGRvaW5nIGFueXRoaW5nXG4gICAgcmV0dXJuO1xuICB9XG5cbiAgaWYgKHN0eWxlQmluZGluZ05hbWVzKSB7XG4gICAgc3R5bGVCaW5kaW5nTmFtZXMgPSBoeXBoZW5hdGVFbnRyaWVzKHN0eWxlQmluZGluZ05hbWVzKTtcbiAgfVxuXG4gIC8vIHRoZXJlIGFyZSBhbG90IG9mIHZhcmlhYmxlcyBiZWluZyB1c2VkIGJlbG93IHRvIHRyYWNrIHdoZXJlIGluIHRoZSBjb250ZXh0IHRoZSBuZXdcbiAgLy8gYmluZGluZyB2YWx1ZXMgd2lsbCBiZSBwbGFjZWQuIEJlY2F1c2UgdGhlIGNvbnRleHQgY29uc2lzdHMgb2YgbXVsdGlwbGUgdHlwZXMgb2ZcbiAgLy8gZW50cmllcyAoc2luZ2xlIGNsYXNzZXMvc3R5bGVzIGFuZCBtdWx0aSBjbGFzc2VzL3N0eWxlcykgYWxvdCBvZiB0aGUgaW5kZXggcG9zaXRpb25zXG4gIC8vIG5lZWQgdG8gYmUgY29tcHV0ZWQgYWhlYWQgb2YgdGltZSBhbmQgdGhlIGNvbnRleHQgbmVlZHMgdG8gYmUgZXh0ZW5kZWQgYmVmb3JlIHRoZSB2YWx1ZXNcbiAgLy8gYXJlIGluc2VydGVkIGluLlxuICBjb25zdCBzaW5nbGVQcm9wT2Zmc2V0VmFsdWVzID0gY29udGV4dFtTdHlsaW5nSW5kZXguU2luZ2xlUHJvcE9mZnNldFBvc2l0aW9uc107XG4gIGNvbnN0IHRvdGFsQ3VycmVudENsYXNzQmluZGluZ3MgPVxuICAgICAgc2luZ2xlUHJvcE9mZnNldFZhbHVlc1tTaW5nbGVQcm9wT2Zmc2V0VmFsdWVzSW5kZXguQ2xhc3Nlc0NvdW50UG9zaXRpb25dO1xuICBjb25zdCB0b3RhbEN1cnJlbnRTdHlsZUJpbmRpbmdzID1cbiAgICAgIHNpbmdsZVByb3BPZmZzZXRWYWx1ZXNbU2luZ2xlUHJvcE9mZnNldFZhbHVlc0luZGV4LlN0eWxlc0NvdW50UG9zaXRpb25dO1xuXG4gIGNvbnN0IGNhY2hlZENsYXNzTWFwVmFsdWVzID0gY29udGV4dFtTdHlsaW5nSW5kZXguQ2FjaGVkTXVsdGlDbGFzc2VzXTtcbiAgY29uc3QgY2FjaGVkU3R5bGVNYXBWYWx1ZXMgPSBjb250ZXh0W1N0eWxpbmdJbmRleC5DYWNoZWRNdWx0aVN0eWxlc107XG5cbiAgY29uc3QgY2xhc3Nlc09mZnNldCA9IHRvdGFsQ3VycmVudENsYXNzQmluZGluZ3MgKiBTdHlsaW5nSW5kZXguU2l6ZTtcbiAgY29uc3Qgc3R5bGVzT2Zmc2V0ID0gdG90YWxDdXJyZW50U3R5bGVCaW5kaW5ncyAqIFN0eWxpbmdJbmRleC5TaXplO1xuXG4gIGNvbnN0IHNpbmdsZVN0eWxlc1N0YXJ0SW5kZXggPSBTdHlsaW5nSW5kZXguU2luZ2xlU3R5bGVzU3RhcnRQb3NpdGlvbjtcbiAgbGV0IHNpbmdsZUNsYXNzZXNTdGFydEluZGV4ID0gc2luZ2xlU3R5bGVzU3RhcnRJbmRleCArIHN0eWxlc09mZnNldDtcbiAgbGV0IG11bHRpU3R5bGVzU3RhcnRJbmRleCA9IHNpbmdsZUNsYXNzZXNTdGFydEluZGV4ICsgY2xhc3Nlc09mZnNldDtcbiAgbGV0IG11bHRpQ2xhc3Nlc1N0YXJ0SW5kZXggPSBtdWx0aVN0eWxlc1N0YXJ0SW5kZXggKyBzdHlsZXNPZmZzZXQ7XG5cbiAgLy8gYmVjYXVzZSB3ZSdyZSBpbnNlcnRpbmcgbW9yZSBiaW5kaW5ncyBpbnRvIHRoZSBjb250ZXh0LCB0aGlzIG1lYW5zIHRoYXQgdGhlXG4gIC8vIGJpbmRpbmcgdmFsdWVzIG5lZWQgdG8gYmUgcmVmZXJlbmNlZCB0aGUgc2luZ2xlUHJvcE9mZnNldFZhbHVlcyBhcnJheSBzbyB0aGF0XG4gIC8vIHRoZSB0ZW1wbGF0ZS9kaXJlY3RpdmUgY2FuIGVhc2lseSBmaW5kIHRoZW0gaW5zaWRlIG9mIHRoZSBgZWxlbWVudFN0eWxlUHJvcGBcbiAgLy8gYW5kIHRoZSBgZWxlbWVudENsYXNzUHJvcGAgZnVuY3Rpb25zIHdpdGhvdXQgaXRlcmF0aW5nIHRocm91Z2ggdGhlIGVudGlyZSBjb250ZXh0LlxuICAvLyBUaGUgZmlyc3Qgc3RlcCB0byBzZXR0aW5nIHVwIHRoZXNlIHJlZmVyZW5jZSBwb2ludHMgaXMgdG8gbWFyayBob3cgbWFueSBiaW5kaW5nc1xuICAvLyBhcmUgYmVpbmcgYWRkZWQuIEV2ZW4gaWYgdGhlc2UgYmluZGluZ3MgYWxyZWFkeSBleGlzdCBpbiB0aGUgY29udGV4dCwgdGhlIGRpcmVjdGl2ZVxuICAvLyBvciB0ZW1wbGF0ZSBjb2RlIHdpbGwgc3RpbGwgY2FsbCB0aGVtIHVua25vd2luZ2x5LiBUaGVyZWZvcmUgdGhlIHRvdGFsIHZhbHVlcyBuZWVkXG4gIC8vIHRvIGJlIHJlZ2lzdGVyZWQgc28gdGhhdCB3ZSBrbm93IGhvdyBtYW55IGJpbmRpbmdzIGFyZSBhc3NpZ25lZCB0byBlYWNoIGRpcmVjdGl2ZS5cbiAgY29uc3QgY3VycmVudFNpbmdsZVByb3BzTGVuZ3RoID0gc2luZ2xlUHJvcE9mZnNldFZhbHVlcy5sZW5ndGg7XG4gIHNpbmdsZVByb3BPZmZzZXRWYWx1ZXMucHVzaChcbiAgICAgIHN0eWxlQmluZGluZ05hbWVzID8gc3R5bGVCaW5kaW5nTmFtZXMubGVuZ3RoIDogMCxcbiAgICAgIGNsYXNzQmluZGluZ05hbWVzID8gY2xhc3NCaW5kaW5nTmFtZXMubGVuZ3RoIDogMCk7XG5cbiAgLy8gdGhlIGNvZGUgYmVsb3cgd2lsbCBjaGVjayB0byBzZWUgaWYgYSBuZXcgc3R5bGUgYmluZGluZyBhbHJlYWR5IGV4aXN0cyBpbiB0aGUgY29udGV4dFxuICAvLyBpZiBzbyB0aGVuIHRoZXJlIGlzIG5vIHBvaW50IGluIGluc2VydGluZyBpdCBpbnRvIHRoZSBjb250ZXh0IGFnYWluLiBXaGV0aGVyIG9yIG5vdCBpdFxuICAvLyBleGlzdHMgdGhlIHN0eWxpbmcgb2Zmc2V0IGNvZGUgd2lsbCBub3cga25vdyBleGFjdGx5IHdoZXJlIGl0IGlzXG4gIGxldCBpbnNlcnRpb25PZmZzZXQgPSAwO1xuICBjb25zdCBmaWx0ZXJlZFN0eWxlQmluZGluZ05hbWVzOiBzdHJpbmdbXSA9IFtdO1xuICBpZiAoc3R5bGVCaW5kaW5nTmFtZXMgJiYgc3R5bGVCaW5kaW5nTmFtZXMubGVuZ3RoKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzdHlsZUJpbmRpbmdOYW1lcy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgbmFtZSA9IHN0eWxlQmluZGluZ05hbWVzW2ldO1xuICAgICAgbGV0IHNpbmdsZVByb3BJbmRleCA9XG4gICAgICAgICAgZ2V0TWF0Y2hpbmdCaW5kaW5nSW5kZXgoY29udGV4dCwgbmFtZSwgc2luZ2xlU3R5bGVzU3RhcnRJbmRleCwgc2luZ2xlQ2xhc3Nlc1N0YXJ0SW5kZXgpO1xuICAgICAgaWYgKHNpbmdsZVByb3BJbmRleCA9PSAtMSkge1xuICAgICAgICBzaW5nbGVQcm9wSW5kZXggPSBzaW5nbGVDbGFzc2VzU3RhcnRJbmRleCArIGluc2VydGlvbk9mZnNldDtcbiAgICAgICAgaW5zZXJ0aW9uT2Zmc2V0ICs9IFN0eWxpbmdJbmRleC5TaXplO1xuICAgICAgICBmaWx0ZXJlZFN0eWxlQmluZGluZ05hbWVzLnB1c2gobmFtZSk7XG4gICAgICB9XG4gICAgICBzaW5nbGVQcm9wT2Zmc2V0VmFsdWVzLnB1c2goc2luZ2xlUHJvcEluZGV4KTtcbiAgICB9XG4gIH1cblxuICAvLyBqdXN0IGxpa2Ugd2l0aCB0aGUgc3R5bGUgYmluZGluZyBsb29wIGFib3ZlLCB0aGUgbmV3IGNsYXNzIGJpbmRpbmdzIGdldCB0aGUgc2FtZSB0cmVhdG1lbnQuLi5cbiAgY29uc3QgZmlsdGVyZWRDbGFzc0JpbmRpbmdOYW1lczogc3RyaW5nW10gPSBbXTtcbiAgaWYgKGNsYXNzQmluZGluZ05hbWVzICYmIGNsYXNzQmluZGluZ05hbWVzLmxlbmd0aCkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY2xhc3NCaW5kaW5nTmFtZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IG5hbWUgPSBjbGFzc0JpbmRpbmdOYW1lc1tpXTtcbiAgICAgIGxldCBzaW5nbGVQcm9wSW5kZXggPVxuICAgICAgICAgIGdldE1hdGNoaW5nQmluZGluZ0luZGV4KGNvbnRleHQsIG5hbWUsIHNpbmdsZUNsYXNzZXNTdGFydEluZGV4LCBtdWx0aVN0eWxlc1N0YXJ0SW5kZXgpO1xuICAgICAgaWYgKHNpbmdsZVByb3BJbmRleCA9PSAtMSkge1xuICAgICAgICBzaW5nbGVQcm9wSW5kZXggPSBtdWx0aVN0eWxlc1N0YXJ0SW5kZXggKyBpbnNlcnRpb25PZmZzZXQ7XG4gICAgICAgIGluc2VydGlvbk9mZnNldCArPSBTdHlsaW5nSW5kZXguU2l6ZTtcbiAgICAgICAgZmlsdGVyZWRDbGFzc0JpbmRpbmdOYW1lcy5wdXNoKG5hbWUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc2luZ2xlUHJvcEluZGV4ICs9IGZpbHRlcmVkU3R5bGVCaW5kaW5nTmFtZXMubGVuZ3RoICogU3R5bGluZ0luZGV4LlNpemU7XG4gICAgICB9XG4gICAgICBzaW5nbGVQcm9wT2Zmc2V0VmFsdWVzLnB1c2goc2luZ2xlUHJvcEluZGV4KTtcbiAgICB9XG4gIH1cblxuICAvLyBiZWNhdXNlIG5ldyBzdHlsZXMgYXJlIGJlaW5nIGluc2VydGVkLCB0aGlzIG1lYW5zIHRoZSBleGlzdGluZyBjb2xsZWN0aW9uIG9mIHN0eWxlIG9mZnNldFxuICAvLyBpbmRleCB2YWx1ZXMgYXJlIGluY29ycmVjdCAodGhleSBwb2ludCB0byB0aGUgd3JvbmcgdmFsdWVzKS4gVGhlIGNvZGUgYmVsb3cgd2lsbCBydW4gdGhyb3VnaFxuICAvLyB0aGUgZW50aXJlIG9mZnNldCBhcnJheSBhbmQgdXBkYXRlIHRoZSBleGlzdGluZyBzZXQgb2YgaW5kZXggdmFsdWVzIHRvIHBvaW50IHRvIHRoZWlyIG5ld1xuICAvLyBsb2NhdGlvbnMgd2hpbGUgdGFraW5nIHRoZSBuZXcgYmluZGluZyB2YWx1ZXMgaW50byBjb25zaWRlcmF0aW9uLlxuICBsZXQgaSA9IFNpbmdsZVByb3BPZmZzZXRWYWx1ZXNJbmRleC5WYWx1ZVN0YXJ0UG9zaXRpb247XG4gIGlmIChmaWx0ZXJlZFN0eWxlQmluZGluZ05hbWVzLmxlbmd0aCkge1xuICAgIHdoaWxlIChpIDwgY3VycmVudFNpbmdsZVByb3BzTGVuZ3RoKSB7XG4gICAgICBjb25zdCB0b3RhbFN0eWxlcyA9XG4gICAgICAgICAgc2luZ2xlUHJvcE9mZnNldFZhbHVlc1tpICsgU2luZ2xlUHJvcE9mZnNldFZhbHVlc0luZGV4LlN0eWxlc0NvdW50UG9zaXRpb25dO1xuICAgICAgY29uc3QgdG90YWxDbGFzc2VzID1cbiAgICAgICAgICBzaW5nbGVQcm9wT2Zmc2V0VmFsdWVzW2kgKyBTaW5nbGVQcm9wT2Zmc2V0VmFsdWVzSW5kZXguQ2xhc3Nlc0NvdW50UG9zaXRpb25dO1xuICAgICAgaWYgKHRvdGFsQ2xhc3Nlcykge1xuICAgICAgICBjb25zdCBzdGFydCA9IGkgKyBTaW5nbGVQcm9wT2Zmc2V0VmFsdWVzSW5kZXguVmFsdWVTdGFydFBvc2l0aW9uICsgdG90YWxTdHlsZXM7XG4gICAgICAgIGZvciAobGV0IGogPSBzdGFydDsgaiA8IHN0YXJ0ICsgdG90YWxDbGFzc2VzOyBqKyspIHtcbiAgICAgICAgICBzaW5nbGVQcm9wT2Zmc2V0VmFsdWVzW2pdICs9IGZpbHRlcmVkU3R5bGVCaW5kaW5nTmFtZXMubGVuZ3RoICogU3R5bGluZ0luZGV4LlNpemU7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgY29uc3QgdG90YWwgPSB0b3RhbFN0eWxlcyArIHRvdGFsQ2xhc3NlcztcbiAgICAgIGkgKz0gU2luZ2xlUHJvcE9mZnNldFZhbHVlc0luZGV4LlZhbHVlU3RhcnRQb3NpdGlvbiArIHRvdGFsO1xuICAgIH1cbiAgfVxuXG4gIGNvbnN0IHRvdGFsTmV3RW50cmllcyA9IGZpbHRlcmVkQ2xhc3NCaW5kaW5nTmFtZXMubGVuZ3RoICsgZmlsdGVyZWRTdHlsZUJpbmRpbmdOYW1lcy5sZW5ndGg7XG5cbiAgLy8gaW4gdGhlIGV2ZW50IHRoYXQgdGhlcmUgYXJlIG5ldyBzdHlsZSB2YWx1ZXMgYmVpbmcgaW5zZXJ0ZWQsIGFsbCBleGlzdGluZyBjbGFzcyBhbmQgc3R5bGVcbiAgLy8gYmluZGluZ3MgbmVlZCB0byBoYXZlIHRoZWlyIHBvaW50ZXIgdmFsdWVzIG9mZnNldHRlZCB3aXRoIHRoZSBuZXcgYW1vdW50IG9mIHNwYWNlIHRoYXQgaXNcbiAgLy8gdXNlZCBmb3IgdGhlIG5ldyBzdHlsZS9jbGFzcyBiaW5kaW5ncy5cbiAgZm9yIChsZXQgaSA9IHNpbmdsZVN0eWxlc1N0YXJ0SW5kZXg7IGkgPCBjb250ZXh0Lmxlbmd0aDsgaSArPSBTdHlsaW5nSW5kZXguU2l6ZSkge1xuICAgIGNvbnN0IGlzTXVsdGlCYXNlZCA9IGkgPj0gbXVsdGlTdHlsZXNTdGFydEluZGV4O1xuICAgIGNvbnN0IGlzQ2xhc3NCYXNlZCA9IGkgPj0gKGlzTXVsdGlCYXNlZCA/IG11bHRpQ2xhc3Nlc1N0YXJ0SW5kZXggOiBzaW5nbGVDbGFzc2VzU3RhcnRJbmRleCk7XG4gICAgY29uc3QgZmxhZyA9IGdldFBvaW50ZXJzKGNvbnRleHQsIGkpO1xuICAgIGNvbnN0IHN0YXRpY0luZGV4ID0gZ2V0SW5pdGlhbEluZGV4KGZsYWcpO1xuICAgIGxldCBzaW5nbGVPck11bHRpSW5kZXggPSBnZXRNdWx0aU9yU2luZ2xlSW5kZXgoZmxhZyk7XG4gICAgaWYgKGlzTXVsdGlCYXNlZCkge1xuICAgICAgc2luZ2xlT3JNdWx0aUluZGV4ICs9XG4gICAgICAgICAgaXNDbGFzc0Jhc2VkID8gKGZpbHRlcmVkU3R5bGVCaW5kaW5nTmFtZXMubGVuZ3RoICogU3R5bGluZ0luZGV4LlNpemUpIDogMDtcbiAgICB9IGVsc2Uge1xuICAgICAgc2luZ2xlT3JNdWx0aUluZGV4ICs9ICh0b3RhbE5ld0VudHJpZXMgKiBTdHlsaW5nSW5kZXguU2l6ZSkgK1xuICAgICAgICAgICgoaXNDbGFzc0Jhc2VkID8gZmlsdGVyZWRTdHlsZUJpbmRpbmdOYW1lcy5sZW5ndGggOiAwKSAqIFN0eWxpbmdJbmRleC5TaXplKTtcbiAgICB9XG4gICAgc2V0RmxhZyhjb250ZXh0LCBpLCBwb2ludGVycyhmbGFnLCBzdGF0aWNJbmRleCwgc2luZ2xlT3JNdWx0aUluZGV4KSk7XG4gIH1cblxuICAvLyB0aGlzIGlzIHdoZXJlIHdlIG1ha2Ugc3BhY2UgaW4gdGhlIGNvbnRleHQgZm9yIHRoZSBuZXcgc3R5bGUgYmluZGluZ3NcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBmaWx0ZXJlZFN0eWxlQmluZGluZ05hbWVzLmxlbmd0aCAqIFN0eWxpbmdJbmRleC5TaXplOyBpKyspIHtcbiAgICBjb250ZXh0LnNwbGljZShtdWx0aUNsYXNzZXNTdGFydEluZGV4LCAwLCBudWxsKTtcbiAgICBjb250ZXh0LnNwbGljZShzaW5nbGVDbGFzc2VzU3RhcnRJbmRleCwgMCwgbnVsbCk7XG4gICAgc2luZ2xlQ2xhc3Nlc1N0YXJ0SW5kZXgrKztcbiAgICBtdWx0aVN0eWxlc1N0YXJ0SW5kZXgrKztcbiAgICBtdWx0aUNsYXNzZXNTdGFydEluZGV4ICs9IDI7ICAvLyBib3RoIHNpbmdsZSArIG11bHRpIHNsb3RzIHdlcmUgaW5zZXJ0ZWRcbiAgfVxuXG4gIC8vIHRoaXMgaXMgd2hlcmUgd2UgbWFrZSBzcGFjZSBpbiB0aGUgY29udGV4dCBmb3IgdGhlIG5ldyBjbGFzcyBiaW5kaW5nc1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGZpbHRlcmVkQ2xhc3NCaW5kaW5nTmFtZXMubGVuZ3RoICogU3R5bGluZ0luZGV4LlNpemU7IGkrKykge1xuICAgIGNvbnRleHQuc3BsaWNlKG11bHRpU3R5bGVzU3RhcnRJbmRleCwgMCwgbnVsbCk7XG4gICAgY29udGV4dC5wdXNoKG51bGwpO1xuICAgIG11bHRpU3R5bGVzU3RhcnRJbmRleCsrO1xuICAgIG11bHRpQ2xhc3Nlc1N0YXJ0SW5kZXgrKztcbiAgfVxuXG4gIGNvbnN0IGluaXRpYWxDbGFzc2VzID0gY29udGV4dFtTdHlsaW5nSW5kZXguSW5pdGlhbENsYXNzVmFsdWVzUG9zaXRpb25dO1xuICBjb25zdCBpbml0aWFsU3R5bGVzID0gY29udGV4dFtTdHlsaW5nSW5kZXguSW5pdGlhbFN0eWxlVmFsdWVzUG9zaXRpb25dO1xuXG4gIC8vIHRoZSBjb2RlIGJlbG93IHdpbGwgaW5zZXJ0IGVhY2ggbmV3IGVudHJ5IGludG8gdGhlIGNvbnRleHQgYW5kIGFzc2lnbiB0aGUgYXBwcm9wcmlhdGVcbiAgLy8gZmxhZ3MgYW5kIGluZGV4IHZhbHVlcyB0byB0aGVtLiBJdCdzIGltcG9ydGFudCB0aGlzIHJ1bnMgYXQgdGhlIGVuZCBvZiB0aGlzIGZ1bmN0aW9uXG4gIC8vIGJlY2F1c2UgdGhlIGNvbnRleHQsIHByb3BlcnR5IG9mZnNldCBhbmQgaW5kZXggdmFsdWVzIGhhdmUgYWxsIGJlZW4gY29tcHV0ZWQganVzdCBiZWZvcmUuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgdG90YWxOZXdFbnRyaWVzOyBpKyspIHtcbiAgICBjb25zdCBlbnRyeUlzQ2xhc3NCYXNlZCA9IGkgPj0gZmlsdGVyZWRTdHlsZUJpbmRpbmdOYW1lcy5sZW5ndGg7XG4gICAgY29uc3QgYWRqdXN0ZWRJbmRleCA9IGVudHJ5SXNDbGFzc0Jhc2VkID8gKGkgLSBmaWx0ZXJlZFN0eWxlQmluZGluZ05hbWVzLmxlbmd0aCkgOiBpO1xuICAgIGNvbnN0IHByb3BOYW1lID0gZW50cnlJc0NsYXNzQmFzZWQgPyBmaWx0ZXJlZENsYXNzQmluZGluZ05hbWVzW2FkanVzdGVkSW5kZXhdIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZmlsdGVyZWRTdHlsZUJpbmRpbmdOYW1lc1thZGp1c3RlZEluZGV4XTtcblxuICAgIGxldCBtdWx0aUluZGV4LCBzaW5nbGVJbmRleDtcbiAgICBpZiAoZW50cnlJc0NsYXNzQmFzZWQpIHtcbiAgICAgIG11bHRpSW5kZXggPSBtdWx0aUNsYXNzZXNTdGFydEluZGV4ICtcbiAgICAgICAgICAoKHRvdGFsQ3VycmVudENsYXNzQmluZGluZ3MgKyBhZGp1c3RlZEluZGV4KSAqIFN0eWxpbmdJbmRleC5TaXplKTtcbiAgICAgIHNpbmdsZUluZGV4ID0gc2luZ2xlQ2xhc3Nlc1N0YXJ0SW5kZXggK1xuICAgICAgICAgICgodG90YWxDdXJyZW50Q2xhc3NCaW5kaW5ncyArIGFkanVzdGVkSW5kZXgpICogU3R5bGluZ0luZGV4LlNpemUpO1xuICAgIH0gZWxzZSB7XG4gICAgICBtdWx0aUluZGV4ID1cbiAgICAgICAgICBtdWx0aVN0eWxlc1N0YXJ0SW5kZXggKyAoKHRvdGFsQ3VycmVudFN0eWxlQmluZGluZ3MgKyBhZGp1c3RlZEluZGV4KSAqIFN0eWxpbmdJbmRleC5TaXplKTtcbiAgICAgIHNpbmdsZUluZGV4ID0gc2luZ2xlU3R5bGVzU3RhcnRJbmRleCArXG4gICAgICAgICAgKCh0b3RhbEN1cnJlbnRTdHlsZUJpbmRpbmdzICsgYWRqdXN0ZWRJbmRleCkgKiBTdHlsaW5nSW5kZXguU2l6ZSk7XG4gICAgfVxuXG4gICAgLy8gaWYgYSBwcm9wZXJ0eSBpcyBub3QgZm91bmQgaW4gdGhlIGluaXRpYWwgc3R5bGUgdmFsdWVzIGxpc3QgdGhlbiBpdFxuICAgIC8vIGlzIEFMV0FZUyBhZGRlZCBpbiBjYXNlIGEgZm9sbG93LXVwIGRpcmVjdGl2ZSBpbnRyb2R1Y2VzIHRoZSBzYW1lIGluaXRpYWxcbiAgICAvLyBzdHlsZS9jbGFzcyB2YWx1ZSBsYXRlciBvbi5cbiAgICBsZXQgaW5pdGlhbFZhbHVlc1RvTG9va3VwID0gZW50cnlJc0NsYXNzQmFzZWQgPyBpbml0aWFsQ2xhc3NlcyA6IGluaXRpYWxTdHlsZXM7XG4gICAgbGV0IGluZGV4Rm9ySW5pdGlhbCA9IGdldEluaXRpYWxTdHlsaW5nVmFsdWVzSW5kZXhPZihpbml0aWFsVmFsdWVzVG9Mb29rdXAsIHByb3BOYW1lKTtcbiAgICBpZiAoaW5kZXhGb3JJbml0aWFsID09PSAtMSkge1xuICAgICAgaW5kZXhGb3JJbml0aWFsID0gYWRkT3JVcGRhdGVTdGF0aWNTdHlsZShcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBudWxsLCBpbml0aWFsVmFsdWVzVG9Mb29rdXAsIHByb3BOYW1lLCBlbnRyeUlzQ2xhc3NCYXNlZCA/IGZhbHNlIDogbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkaXJlY3RpdmVJbmRleCkgK1xuICAgICAgICAgIEluaXRpYWxTdHlsaW5nVmFsdWVzSW5kZXguVmFsdWVPZmZzZXQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIGluZGV4Rm9ySW5pdGlhbCArPSBJbml0aWFsU3R5bGluZ1ZhbHVlc0luZGV4LlZhbHVlT2Zmc2V0O1xuICAgIH1cblxuICAgIGNvbnN0IGluaXRpYWxGbGFnID1cbiAgICAgICAgcHJlcGFyZUluaXRpYWxGbGFnKGNvbnRleHQsIHByb3BOYW1lLCBlbnRyeUlzQ2xhc3NCYXNlZCwgc3R5bGVTYW5pdGl6ZXIgfHwgbnVsbCk7XG5cbiAgICBzZXRGbGFnKGNvbnRleHQsIHNpbmdsZUluZGV4LCBwb2ludGVycyhpbml0aWFsRmxhZywgaW5kZXhGb3JJbml0aWFsLCBtdWx0aUluZGV4KSk7XG4gICAgc2V0UHJvcChjb250ZXh0LCBzaW5nbGVJbmRleCwgcHJvcE5hbWUpO1xuICAgIHNldFZhbHVlKGNvbnRleHQsIHNpbmdsZUluZGV4LCBudWxsKTtcbiAgICBzZXRQbGF5ZXJCdWlsZGVySW5kZXgoY29udGV4dCwgc2luZ2xlSW5kZXgsIDAsIGRpcmVjdGl2ZUluZGV4KTtcblxuICAgIHNldEZsYWcoY29udGV4dCwgbXVsdGlJbmRleCwgcG9pbnRlcnMoaW5pdGlhbEZsYWcsIGluZGV4Rm9ySW5pdGlhbCwgc2luZ2xlSW5kZXgpKTtcbiAgICBzZXRQcm9wKGNvbnRleHQsIG11bHRpSW5kZXgsIHByb3BOYW1lKTtcbiAgICBzZXRWYWx1ZShjb250ZXh0LCBtdWx0aUluZGV4LCBudWxsKTtcbiAgICBzZXRQbGF5ZXJCdWlsZGVySW5kZXgoY29udGV4dCwgbXVsdGlJbmRleCwgMCwgZGlyZWN0aXZlSW5kZXgpO1xuICB9XG5cbiAgLy8gdGhlIHRvdGFsIGNsYXNzZXMvc3R5bGUgdmFsdWVzIGFyZSB1cGRhdGVkIHNvIHRoZSBuZXh0IHRpbWUgdGhlIGNvbnRleHQgaXMgcGF0Y2hlZFxuICAvLyBhZGRpdGlvbmFsIHN0eWxlL2NsYXNzIGJpbmRpbmdzIGZyb20gYW5vdGhlciBkaXJlY3RpdmUgdGhlbiBpdCBrbm93cyBleGFjdGx5IHdoZXJlXG4gIC8vIHRvIGluc2VydCB0aGVtIGluIHRoZSBjb250ZXh0XG4gIHNpbmdsZVByb3BPZmZzZXRWYWx1ZXNbU2luZ2xlUHJvcE9mZnNldFZhbHVlc0luZGV4LkNsYXNzZXNDb3VudFBvc2l0aW9uXSA9XG4gICAgICB0b3RhbEN1cnJlbnRDbGFzc0JpbmRpbmdzICsgZmlsdGVyZWRDbGFzc0JpbmRpbmdOYW1lcy5sZW5ndGg7XG4gIHNpbmdsZVByb3BPZmZzZXRWYWx1ZXNbU2luZ2xlUHJvcE9mZnNldFZhbHVlc0luZGV4LlN0eWxlc0NvdW50UG9zaXRpb25dID1cbiAgICAgIHRvdGFsQ3VycmVudFN0eWxlQmluZGluZ3MgKyBmaWx0ZXJlZFN0eWxlQmluZGluZ05hbWVzLmxlbmd0aDtcblxuICAvLyB0aGUgbWFwLWJhc2VkIHZhbHVlcyBhbHNvIG5lZWQgdG8ga25vdyBob3cgbWFueSBlbnRyaWVzIGdvdCBpbnNlcnRlZFxuICBjYWNoZWRDbGFzc01hcFZhbHVlc1tNYXBCYXNlZE9mZnNldFZhbHVlc0luZGV4LkVudHJpZXNDb3VudFBvc2l0aW9uXSArPVxuICAgICAgZmlsdGVyZWRDbGFzc0JpbmRpbmdOYW1lcy5sZW5ndGg7XG4gIGNhY2hlZFN0eWxlTWFwVmFsdWVzW01hcEJhc2VkT2Zmc2V0VmFsdWVzSW5kZXguRW50cmllc0NvdW50UG9zaXRpb25dICs9XG4gICAgICBmaWx0ZXJlZFN0eWxlQmluZGluZ05hbWVzLmxlbmd0aDtcbiAgY29uc3QgbmV3U3R5bGVzU3BhY2VBbGxvY2F0aW9uU2l6ZSA9IGZpbHRlcmVkU3R5bGVCaW5kaW5nTmFtZXMubGVuZ3RoICogU3R5bGluZ0luZGV4LlNpemU7XG4gIGNvbnN0IG5ld0NsYXNzZXNTcGFjZUFsbG9jYXRpb25TaXplID0gZmlsdGVyZWRDbGFzc0JpbmRpbmdOYW1lcy5sZW5ndGggKiBTdHlsaW5nSW5kZXguU2l6ZTtcblxuICAvLyB1cGRhdGUgdGhlIG11bHRpIHN0eWxlcyBjYWNoZSB3aXRoIGEgcmVmZXJlbmNlIGZvciB0aGUgZGlyZWN0aXZlIHRoYXQgd2FzIGp1c3QgaW5zZXJ0ZWRcbiAgY29uc3QgZGlyZWN0aXZlTXVsdGlTdHlsZXNTdGFydEluZGV4ID1cbiAgICAgIG11bHRpU3R5bGVzU3RhcnRJbmRleCArIHRvdGFsQ3VycmVudFN0eWxlQmluZGluZ3MgKiBTdHlsaW5nSW5kZXguU2l6ZTtcbiAgY29uc3QgY2FjaGVkU3R5bGVNYXBJbmRleCA9IGNhY2hlZFN0eWxlTWFwVmFsdWVzLmxlbmd0aDtcbiAgcmVnaXN0ZXJNdWx0aU1hcEVudHJ5KFxuICAgICAgY29udGV4dCwgZGlyZWN0aXZlSW5kZXgsIGZhbHNlLCBkaXJlY3RpdmVNdWx0aVN0eWxlc1N0YXJ0SW5kZXgsXG4gICAgICBmaWx0ZXJlZFN0eWxlQmluZGluZ05hbWVzLmxlbmd0aCk7XG5cbiAgZm9yIChsZXQgaSA9IE1hcEJhc2VkT2Zmc2V0VmFsdWVzSW5kZXguVmFsdWVzU3RhcnRQb3NpdGlvbjsgaSA8IGNhY2hlZFN0eWxlTWFwSW5kZXg7XG4gICAgICAgaSArPSBNYXBCYXNlZE9mZnNldFZhbHVlc0luZGV4LlNpemUpIHtcbiAgICAvLyBtdWx0aSB2YWx1ZXMgc3RhcnQgYWZ0ZXIgYWxsIHRoZSBzaW5nbGUgdmFsdWVzICh3aGljaCBpcyBhbHNvIHdoZXJlIGNsYXNzZXMgYXJlKSBpbiB0aGVcbiAgICAvLyBjb250ZXh0IHRoZXJlZm9yZSB0aGUgbmV3IGNsYXNzIGFsbG9jYXRpb24gc2l6ZSBzaG91bGQgYmUgdGFrZW4gaW50byBhY2NvdW50XG4gICAgY2FjaGVkU3R5bGVNYXBWYWx1ZXNbaSArIE1hcEJhc2VkT2Zmc2V0VmFsdWVzSW5kZXguUG9zaXRpb25TdGFydE9mZnNldF0gKz1cbiAgICAgICAgbmV3Q2xhc3Nlc1NwYWNlQWxsb2NhdGlvblNpemUgKyBuZXdTdHlsZXNTcGFjZUFsbG9jYXRpb25TaXplO1xuICB9XG5cbiAgLy8gdXBkYXRlIHRoZSBtdWx0aSBjbGFzc2VzIGNhY2hlIHdpdGggYSByZWZlcmVuY2UgZm9yIHRoZSBkaXJlY3RpdmUgdGhhdCB3YXMganVzdCBpbnNlcnRlZFxuICBjb25zdCBkaXJlY3RpdmVNdWx0aUNsYXNzZXNTdGFydEluZGV4ID1cbiAgICAgIG11bHRpQ2xhc3Nlc1N0YXJ0SW5kZXggKyB0b3RhbEN1cnJlbnRDbGFzc0JpbmRpbmdzICogU3R5bGluZ0luZGV4LlNpemU7XG4gIGNvbnN0IGNhY2hlZENsYXNzTWFwSW5kZXggPSBjYWNoZWRDbGFzc01hcFZhbHVlcy5sZW5ndGg7XG4gIHJlZ2lzdGVyTXVsdGlNYXBFbnRyeShcbiAgICAgIGNvbnRleHQsIGRpcmVjdGl2ZUluZGV4LCB0cnVlLCBkaXJlY3RpdmVNdWx0aUNsYXNzZXNTdGFydEluZGV4LFxuICAgICAgZmlsdGVyZWRDbGFzc0JpbmRpbmdOYW1lcy5sZW5ndGgpO1xuXG4gIGZvciAobGV0IGkgPSBNYXBCYXNlZE9mZnNldFZhbHVlc0luZGV4LlZhbHVlc1N0YXJ0UG9zaXRpb247IGkgPCBjYWNoZWRDbGFzc01hcEluZGV4O1xuICAgICAgIGkgKz0gTWFwQmFzZWRPZmZzZXRWYWx1ZXNJbmRleC5TaXplKSB7XG4gICAgLy8gdGhlIHJlYXNvbiB3aHkgYm90aCB0aGUgc3R5bGVzICsgY2xhc3NlcyBzcGFjZSBpcyBhbGxvY2F0ZWQgdG8gdGhlIGV4aXN0aW5nIG9mZnNldHMgaXNcbiAgICAvLyBiZWNhdXNlIHRoZSBzdHlsZXMgc2hvdyB1cCBiZWZvcmUgdGhlIGNsYXNzZXMgaW4gdGhlIGNvbnRleHQgYW5kIGFueSBuZXcgaW5zZXJ0ZWRcbiAgICAvLyBzdHlsZXMgd2lsbCBvZmZzZXQgYW55IGV4aXN0aW5nIGNsYXNzIGVudHJpZXMgaW4gdGhlIGNvbnRleHQgKGV2ZW4gaWYgdGhlcmUgYXJlIG5vXG4gICAgLy8gbmV3IGNsYXNzIGVudHJpZXMgYWRkZWQpIGFsc28gdGhlIHJlYXNvbiB3aHkgaXQncyAqMiBpcyBiZWNhdXNlIGJvdGggc2luZ2xlICsgbXVsdGlcbiAgICAvLyBlbnRyaWVzIGZvciBlYWNoIG5ldyBzdHlsZSBoYXZlIGJlZW4gYWRkZWQgaW4gdGhlIGNvbnRleHQgYmVmb3JlIHRoZSBtdWx0aSBjbGFzcyB2YWx1ZXNcbiAgICAvLyBhY3R1YWxseSBzdGFydFxuICAgIGNhY2hlZENsYXNzTWFwVmFsdWVzW2kgKyBNYXBCYXNlZE9mZnNldFZhbHVlc0luZGV4LlBvc2l0aW9uU3RhcnRPZmZzZXRdICs9XG4gICAgICAgIChuZXdTdHlsZXNTcGFjZUFsbG9jYXRpb25TaXplICogMikgKyBuZXdDbGFzc2VzU3BhY2VBbGxvY2F0aW9uU2l6ZTtcbiAgfVxuXG4gIC8vIHRoZXJlIGlzIG5vIGluaXRpYWwgdmFsdWUgZmxhZyBmb3IgdGhlIG1hc3RlciBpbmRleCBzaW5jZSBpdCBkb2Vzbid0XG4gIC8vIHJlZmVyZW5jZSBhbiBpbml0aWFsIHN0eWxlIHZhbHVlXG4gIGNvbnN0IG1hc3RlckZsYWcgPSBwb2ludGVycygwLCAwLCBtdWx0aVN0eWxlc1N0YXJ0SW5kZXgpO1xuICBzZXRGbGFnKGNvbnRleHQsIFN0eWxpbmdJbmRleC5NYXN0ZXJGbGFnUG9zaXRpb24sIG1hc3RlckZsYWcpO1xufVxuXG4vKipcbiAqIFNlYXJjaGVzIHRocm91Z2ggdGhlIGV4aXN0aW5nIHJlZ2lzdHJ5IG9mIGRpcmVjdGl2ZXNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZpbmRPclBhdGNoRGlyZWN0aXZlSW50b1JlZ2lzdHJ5KFxuICAgIGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBkaXJlY3RpdmVJbmRleDogbnVtYmVyLCBzdGF0aWNNb2RlT25seTogYm9vbGVhbixcbiAgICBzdHlsZVNhbml0aXplcj86IFN0eWxlU2FuaXRpemVGbiB8IG51bGwpOiBib29sZWFuIHtcbiAgY29uc3QgZGlyZWN0aXZlUmVnaXN0cnkgPSBjb250ZXh0W1N0eWxpbmdJbmRleC5EaXJlY3RpdmVSZWdpc3RyeVBvc2l0aW9uXTtcbiAgY29uc3QgaW5kZXggPSBkaXJlY3RpdmVJbmRleCAqIERpcmVjdGl2ZVJlZ2lzdHJ5VmFsdWVzSW5kZXguU2l6ZTtcbiAgY29uc3Qgc2luZ2xlUHJvcFN0YXJ0UG9zaXRpb24gPSBpbmRleCArIERpcmVjdGl2ZVJlZ2lzdHJ5VmFsdWVzSW5kZXguU2luZ2xlUHJvcFZhbHVlc0luZGV4T2Zmc2V0O1xuXG4gIC8vIHRoaXMgbWVhbnMgdGhhdCB0aGUgZGlyZWN0aXZlIGhhcyBhbHJlYWR5IGJlZW4gcmVnaXN0ZXJlZCBpbnRvIHRoZSByZWdpc3RyeVxuICBpZiAoaW5kZXggPCBkaXJlY3RpdmVSZWdpc3RyeS5sZW5ndGggJiZcbiAgICAgIChkaXJlY3RpdmVSZWdpc3RyeVtzaW5nbGVQcm9wU3RhcnRQb3NpdGlvbl0gYXMgbnVtYmVyKSA+PSAwKVxuICAgIHJldHVybiBmYWxzZTtcblxuICBjb25zdCBzaW5nbGVQcm9wc1N0YXJ0SW5kZXggPVxuICAgICAgc3RhdGljTW9kZU9ubHkgPyAtMSA6IGNvbnRleHRbU3R5bGluZ0luZGV4LlNpbmdsZVByb3BPZmZzZXRQb3NpdGlvbnNdLmxlbmd0aDtcbiAgYWxsb2NhdGVPclVwZGF0ZURpcmVjdGl2ZUludG9Db250ZXh0KFxuICAgICAgY29udGV4dCwgZGlyZWN0aXZlSW5kZXgsIHNpbmdsZVByb3BzU3RhcnRJbmRleCwgc3R5bGVTYW5pdGl6ZXIpO1xuICByZXR1cm4gdHJ1ZTtcbn1cblxuZnVuY3Rpb24gZ2V0TWF0Y2hpbmdCaW5kaW5nSW5kZXgoXG4gICAgY29udGV4dDogU3R5bGluZ0NvbnRleHQsIGJpbmRpbmdOYW1lOiBzdHJpbmcsIHN0YXJ0OiBudW1iZXIsIGVuZDogbnVtYmVyKSB7XG4gIGZvciAobGV0IGogPSBzdGFydDsgaiA8IGVuZDsgaiArPSBTdHlsaW5nSW5kZXguU2l6ZSkge1xuICAgIGlmIChnZXRQcm9wKGNvbnRleHQsIGopID09PSBiaW5kaW5nTmFtZSkgcmV0dXJuIGo7XG4gIH1cbiAgcmV0dXJuIC0xO1xufVxuXG4vKipcbiAqIFJlZ2lzdGVycyB0aGUgcHJvdmlkZWQgbXVsdGkgc3R5bGluZyAoYFtzdHlsZV1gIGFuZCBgW2NsYXNzXWApIHZhbHVlcyB0byB0aGUgY29udGV4dC5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIHdpbGwgaXRlcmF0ZSBvdmVyIHRoZSBwcm92aWRlZCBgY2xhc3Nlc0lucHV0YCBhbmQgYHN0eWxlc0lucHV0YCBtYXBcbiAqIHZhbHVlcyBhbmQgaW5zZXJ0L3VwZGF0ZSBvciByZW1vdmUgdGhlbSBmcm9tIHRoZSBjb250ZXh0IGF0IGV4YWN0bHkgdGhlIHJpZ2h0XG4gKiBzcG90LlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gYWxzbyB0YWtlcyBpbiBhIGRpcmVjdGl2ZSB3aGljaCBpbXBsaWVzIHRoYXQgdGhlIHN0eWxpbmcgdmFsdWVzIHdpbGxcbiAqIGJlIGV2YWx1YXRlZCBmb3IgdGhhdCBkaXJlY3RpdmUgd2l0aCByZXNwZWN0IHRvIGFueSBvdGhlciBzdHlsaW5nIHRoYXQgYWxyZWFkeSBleGlzdHNcbiAqIG9uIHRoZSBjb250ZXh0LiBXaGVuIHRoZXJlIGFyZSBzdHlsZXMgdGhhdCBjb25mbGljdCAoZS5nLiBzYXkgYG5nU3R5bGVgIGFuZCBgW3N0eWxlXWBcbiAqIGJvdGggdXBkYXRlIHRoZSBgd2lkdGhgIHByb3BlcnR5IGF0IHRoZSBzYW1lIHRpbWUpIHRoZW4gdGhlIHN0eWxpbmcgYWxnb3JpdGhtIGNvZGUgYmVsb3dcbiAqIHdpbGwgZGVjaWRlIHdoaWNoIG9uZSB3aW5zIGJhc2VkIG9uIHRoZSBkaXJlY3RpdmUgc3R5bGluZyBwcmlvcml0aXphdGlvbiBtZWNoYW5pc20uIFRoaXNcbiAqIG1lY2hhbmlzbSBpcyBiZXR0ZXIgZXhwbGFpbmVkIGluIHJlbmRlcjMvaW50ZXJmYWNlcy9zdHlsaW5nLnRzI2RpcmVjdGl2ZXMpLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gd2lsbCBub3QgcmVuZGVyIGFueSBzdHlsaW5nIHZhbHVlcyBvbiBzY3JlZW4sIGJ1dCBpcyByYXRoZXIgZGVzaWduZWQgdG9cbiAqIHByZXBhcmUgdGhlIGNvbnRleHQgZm9yIHRoYXQuIGByZW5kZXJTdHlsaW5nYCBtdXN0IGJlIGNhbGxlZCBhZnRlcndhcmRzIHRvIHJlbmRlciBhbnlcbiAqIHN0eWxpbmcgZGF0YSB0aGF0IHdhcyBzZXQgaW4gdGhpcyBmdW5jdGlvbiAobm90ZSB0aGF0IGB1cGRhdGVDbGFzc1Byb3BgIGFuZFxuICogYHVwZGF0ZVN0eWxlUHJvcGAgYXJlIGRlc2lnbmVkIHRvIGJlIHJ1biBhZnRlciB0aGlzIGZ1bmN0aW9uIGlzIHJ1bikuXG4gKlxuICogQHBhcmFtIGNvbnRleHQgVGhlIHN0eWxpbmcgY29udGV4dCB0aGF0IHdpbGwgYmUgdXBkYXRlZCB3aXRoIHRoZVxuICogICAgbmV3bHkgcHJvdmlkZWQgc3R5bGUgdmFsdWVzLlxuICogQHBhcmFtIGNsYXNzZXNJbnB1dCBUaGUga2V5L3ZhbHVlIG1hcCBvZiBDU1MgY2xhc3MgbmFtZXMgdGhhdCB3aWxsIGJlIHVzZWQgZm9yIHRoZSB1cGRhdGUuXG4gKiBAcGFyYW0gc3R5bGVzSW5wdXQgVGhlIGtleS92YWx1ZSBtYXAgb2YgQ1NTIHN0eWxlcyB0aGF0IHdpbGwgYmUgdXNlZCBmb3IgdGhlIHVwZGF0ZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHVwZGF0ZVN0eWxpbmdNYXAoXG4gICAgY29udGV4dDogU3R5bGluZ0NvbnRleHQsIGNsYXNzZXNJbnB1dDoge1trZXk6IHN0cmluZ106IGFueX0gfCBzdHJpbmcgfFxuICAgICAgICBCb3VuZFBsYXllckZhY3Rvcnk8bnVsbHxzdHJpbmd8e1trZXk6IHN0cmluZ106IGFueX0+fCBudWxsLFxuICAgIHN0eWxlc0lucHV0Pzoge1trZXk6IHN0cmluZ106IGFueX0gfCBCb3VuZFBsYXllckZhY3Rvcnk8bnVsbHx7W2tleTogc3RyaW5nXTogYW55fT58IG51bGwsXG4gICAgZGlyZWN0aXZlSW5kZXg6IG51bWJlciA9IDApOiB2b2lkIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydFZhbGlkRGlyZWN0aXZlSW5kZXgoY29udGV4dCwgZGlyZWN0aXZlSW5kZXgpO1xuICBjbGFzc2VzSW5wdXQgPSBjbGFzc2VzSW5wdXQgfHwgbnVsbDtcbiAgc3R5bGVzSW5wdXQgPSBzdHlsZXNJbnB1dCB8fCBudWxsO1xuICBjb25zdCBpZ25vcmVBbGxDbGFzc1VwZGF0ZXMgPSBpc011bHRpVmFsdWVDYWNoZUhpdChjb250ZXh0LCB0cnVlLCBkaXJlY3RpdmVJbmRleCwgY2xhc3Nlc0lucHV0KTtcbiAgY29uc3QgaWdub3JlQWxsU3R5bGVVcGRhdGVzID0gaXNNdWx0aVZhbHVlQ2FjaGVIaXQoY29udGV4dCwgZmFsc2UsIGRpcmVjdGl2ZUluZGV4LCBzdHlsZXNJbnB1dCk7XG5cbiAgLy8gZWFybHkgZXhpdCAodGhpcyBpcyB3aGF0J3MgZG9uZSB0byBhdm9pZCB1c2luZyBjdHguYmluZCgpIHRvIGNhY2hlIHRoZSB2YWx1ZSlcbiAgaWYgKGlnbm9yZUFsbENsYXNzVXBkYXRlcyAmJiBpZ25vcmVBbGxTdHlsZVVwZGF0ZXMpIHJldHVybjtcblxuICBjbGFzc2VzSW5wdXQgPVxuICAgICAgY2xhc3Nlc0lucHV0ID09PSBOT19DSEFOR0UgPyByZWFkQ2FjaGVkTWFwVmFsdWUoY29udGV4dCwgdHJ1ZSwgZGlyZWN0aXZlSW5kZXgpIDogY2xhc3Nlc0lucHV0O1xuICBzdHlsZXNJbnB1dCA9XG4gICAgICBzdHlsZXNJbnB1dCA9PT0gTk9fQ0hBTkdFID8gcmVhZENhY2hlZE1hcFZhbHVlKGNvbnRleHQsIGZhbHNlLCBkaXJlY3RpdmVJbmRleCkgOiBzdHlsZXNJbnB1dDtcblxuICBjb25zdCBlbGVtZW50ID0gY29udGV4dFtTdHlsaW5nSW5kZXguRWxlbWVudFBvc2l0aW9uXSAhYXMgSFRNTEVsZW1lbnQ7XG4gIGNvbnN0IGNsYXNzZXNQbGF5ZXJCdWlsZGVyID0gY2xhc3Nlc0lucHV0IGluc3RhbmNlb2YgQm91bmRQbGF5ZXJGYWN0b3J5ID9cbiAgICAgIG5ldyBDbGFzc0FuZFN0eWxlUGxheWVyQnVpbGRlcihjbGFzc2VzSW5wdXQgYXMgYW55LCBlbGVtZW50LCBCaW5kaW5nVHlwZS5DbGFzcykgOlxuICAgICAgbnVsbDtcbiAgY29uc3Qgc3R5bGVzUGxheWVyQnVpbGRlciA9IHN0eWxlc0lucHV0IGluc3RhbmNlb2YgQm91bmRQbGF5ZXJGYWN0b3J5ID9cbiAgICAgIG5ldyBDbGFzc0FuZFN0eWxlUGxheWVyQnVpbGRlcihzdHlsZXNJbnB1dCBhcyBhbnksIGVsZW1lbnQsIEJpbmRpbmdUeXBlLlN0eWxlKSA6XG4gICAgICBudWxsO1xuXG4gIGNvbnN0IGNsYXNzZXNWYWx1ZSA9IGNsYXNzZXNQbGF5ZXJCdWlsZGVyID9cbiAgICAgIChjbGFzc2VzSW5wdXQgYXMgQm91bmRQbGF5ZXJGYWN0b3J5PHtba2V5OiBzdHJpbmddOiBhbnl9fHN0cmluZz4pICEudmFsdWUgOlxuICAgICAgY2xhc3Nlc0lucHV0O1xuICBjb25zdCBzdHlsZXNWYWx1ZSA9IHN0eWxlc1BsYXllckJ1aWxkZXIgPyBzdHlsZXNJbnB1dCAhWyd2YWx1ZSddIDogc3R5bGVzSW5wdXQ7XG5cbiAgbGV0IGNsYXNzTmFtZXM6IHN0cmluZ1tdID0gRU1QVFlfQVJSQVk7XG4gIGxldCBhcHBseUFsbENsYXNzZXMgPSBmYWxzZTtcbiAgbGV0IHBsYXllckJ1aWxkZXJzQXJlRGlydHkgPSBmYWxzZTtcblxuICBjb25zdCBjbGFzc2VzUGxheWVyQnVpbGRlckluZGV4ID1cbiAgICAgIGNsYXNzZXNQbGF5ZXJCdWlsZGVyID8gUGxheWVySW5kZXguQ2xhc3NNYXBQbGF5ZXJCdWlsZGVyUG9zaXRpb24gOiAwO1xuICBpZiAoaGFzUGxheWVyQnVpbGRlckNoYW5nZWQoXG4gICAgICAgICAgY29udGV4dCwgY2xhc3Nlc1BsYXllckJ1aWxkZXIsIFBsYXllckluZGV4LkNsYXNzTWFwUGxheWVyQnVpbGRlclBvc2l0aW9uKSkge1xuICAgIHNldFBsYXllckJ1aWxkZXIoY29udGV4dCwgY2xhc3Nlc1BsYXllckJ1aWxkZXIsIFBsYXllckluZGV4LkNsYXNzTWFwUGxheWVyQnVpbGRlclBvc2l0aW9uKTtcbiAgICBwbGF5ZXJCdWlsZGVyc0FyZURpcnR5ID0gdHJ1ZTtcbiAgfVxuXG4gIGNvbnN0IHN0eWxlc1BsYXllckJ1aWxkZXJJbmRleCA9XG4gICAgICBzdHlsZXNQbGF5ZXJCdWlsZGVyID8gUGxheWVySW5kZXguU3R5bGVNYXBQbGF5ZXJCdWlsZGVyUG9zaXRpb24gOiAwO1xuICBpZiAoaGFzUGxheWVyQnVpbGRlckNoYW5nZWQoXG4gICAgICAgICAgY29udGV4dCwgc3R5bGVzUGxheWVyQnVpbGRlciwgUGxheWVySW5kZXguU3R5bGVNYXBQbGF5ZXJCdWlsZGVyUG9zaXRpb24pKSB7XG4gICAgc2V0UGxheWVyQnVpbGRlcihjb250ZXh0LCBzdHlsZXNQbGF5ZXJCdWlsZGVyLCBQbGF5ZXJJbmRleC5TdHlsZU1hcFBsYXllckJ1aWxkZXJQb3NpdGlvbik7XG4gICAgcGxheWVyQnVpbGRlcnNBcmVEaXJ0eSA9IHRydWU7XG4gIH1cblxuICAvLyBlYWNoIHRpbWUgYSBzdHJpbmctYmFzZWQgdmFsdWUgcG9wcyB1cCB0aGVuIGl0IHNob3VsZG4ndCByZXF1aXJlIGEgZGVlcFxuICAvLyBjaGVjayBvZiB3aGF0J3MgY2hhbmdlZC5cbiAgaWYgKCFpZ25vcmVBbGxDbGFzc1VwZGF0ZXMpIHtcbiAgICBpZiAodHlwZW9mIGNsYXNzZXNWYWx1ZSA9PSAnc3RyaW5nJykge1xuICAgICAgY2xhc3NOYW1lcyA9IGNsYXNzZXNWYWx1ZS5zcGxpdCgvXFxzKy8pO1xuICAgICAgLy8gdGhpcyBib29sZWFuIGlzIHVzZWQgdG8gYXZvaWQgaGF2aW5nIHRvIGNyZWF0ZSBhIGtleS92YWx1ZSBtYXAgb2YgYHRydWVgIHZhbHVlc1xuICAgICAgLy8gc2luY2UgYSBjbGFzc25hbWUgc3RyaW5nIGltcGxpZXMgdGhhdCBhbGwgdGhvc2UgY2xhc3NlcyBhcmUgYWRkZWRcbiAgICAgIGFwcGx5QWxsQ2xhc3NlcyA9IHRydWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNsYXNzTmFtZXMgPSBjbGFzc2VzVmFsdWUgPyBPYmplY3Qua2V5cyhjbGFzc2VzVmFsdWUpIDogRU1QVFlfQVJSQVk7XG4gICAgfVxuICB9XG5cbiAgY29uc3QgbXVsdGlTdHlsZXNTdGFydEluZGV4ID0gZ2V0TXVsdGlTdHlsZXNTdGFydEluZGV4KGNvbnRleHQpO1xuICBsZXQgbXVsdGlDbGFzc2VzU3RhcnRJbmRleCA9IGdldE11bHRpQ2xhc3Nlc1N0YXJ0SW5kZXgoY29udGV4dCk7XG4gIGxldCBtdWx0aUNsYXNzZXNFbmRJbmRleCA9IGNvbnRleHQubGVuZ3RoO1xuXG4gIGlmICghaWdub3JlQWxsU3R5bGVVcGRhdGVzKSB7XG4gICAgY29uc3Qgc3R5bGVQcm9wcyA9IHN0eWxlc1ZhbHVlID8gT2JqZWN0LmtleXMoc3R5bGVzVmFsdWUpIDogRU1QVFlfQVJSQVk7XG4gICAgY29uc3Qgc3R5bGVzID0gc3R5bGVzVmFsdWUgfHwgRU1QVFlfT0JKO1xuICAgIGNvbnN0IHRvdGFsTmV3RW50cmllcyA9IHBhdGNoU3R5bGluZ01hcEludG9Db250ZXh0KFxuICAgICAgICBjb250ZXh0LCBkaXJlY3RpdmVJbmRleCwgc3R5bGVzUGxheWVyQnVpbGRlckluZGV4LCBtdWx0aVN0eWxlc1N0YXJ0SW5kZXgsXG4gICAgICAgIG11bHRpQ2xhc3Nlc1N0YXJ0SW5kZXgsIHN0eWxlUHJvcHMsIHN0eWxlcywgc3R5bGVzSW5wdXQsIGZhbHNlKTtcbiAgICBpZiAodG90YWxOZXdFbnRyaWVzKSB7XG4gICAgICBtdWx0aUNsYXNzZXNTdGFydEluZGV4ICs9IHRvdGFsTmV3RW50cmllcyAqIFN0eWxpbmdJbmRleC5TaXplO1xuICAgICAgbXVsdGlDbGFzc2VzRW5kSW5kZXggKz0gdG90YWxOZXdFbnRyaWVzICogU3R5bGluZ0luZGV4LlNpemU7XG4gICAgfVxuICB9XG5cbiAgaWYgKCFpZ25vcmVBbGxDbGFzc1VwZGF0ZXMpIHtcbiAgICBjb25zdCBjbGFzc2VzID0gKGNsYXNzZXNWYWx1ZSB8fCBFTVBUWV9PQkopIGFze1trZXk6IHN0cmluZ106IGFueX07XG4gICAgcGF0Y2hTdHlsaW5nTWFwSW50b0NvbnRleHQoXG4gICAgICAgIGNvbnRleHQsIGRpcmVjdGl2ZUluZGV4LCBjbGFzc2VzUGxheWVyQnVpbGRlckluZGV4LCBtdWx0aUNsYXNzZXNTdGFydEluZGV4LFxuICAgICAgICBtdWx0aUNsYXNzZXNFbmRJbmRleCwgY2xhc3NOYW1lcywgYXBwbHlBbGxDbGFzc2VzIHx8IGNsYXNzZXMsIGNsYXNzZXNJbnB1dCwgdHJ1ZSk7XG4gIH1cblxuICBpZiAocGxheWVyQnVpbGRlcnNBcmVEaXJ0eSkge1xuICAgIHNldENvbnRleHRQbGF5ZXJzRGlydHkoY29udGV4dCwgdHJ1ZSk7XG4gIH1cbn1cblxuLyoqXG4gKiBBcHBsaWVzIHRoZSBnaXZlbiBtdWx0aSBzdHlsaW5nIChzdHlsZXMgb3IgY2xhc3NlcykgdmFsdWVzIHRvIHRoZSBjb250ZXh0LlxuICpcbiAqIFRoZSBzdHlsaW5nIGFsZ29yaXRobSBjb2RlIHRoYXQgYXBwbGllcyBtdWx0aS1sZXZlbCBzdHlsaW5nICh0aGluZ3MgbGlrZSBgW3N0eWxlXWAgYW5kIGBbY2xhc3NdYFxuICogdmFsdWVzKSByZXNpZGVzIGhlcmUuXG4gKlxuICogQmVjYXVzZSB0aGlzIGZ1bmN0aW9uIHVuZGVyc3RhbmRzIHRoYXQgbXVsdGlwbGUgZGlyZWN0aXZlcyBtYXkgYWxsIHdyaXRlIHRvIHRoZSBgW3N0eWxlXWAgYW5kXG4gKiBgW2NsYXNzXWAgYmluZGluZ3MgKHRocm91Z2ggaG9zdCBiaW5kaW5ncyksIGl0IHJlbGllcyBvZiBlYWNoIGRpcmVjdGl2ZSBhcHBseWluZyBpdHMgYmluZGluZ1xuICogdmFsdWUgaW4gb3JkZXIuIFRoaXMgbWVhbnMgdGhhdCBhIGRpcmVjdGl2ZSBsaWtlIGBjbGFzc0FEaXJlY3RpdmVgIHdpbGwgYWx3YXlzIGZpcmUgYmVmb3JlXG4gKiBgY2xhc3NCRGlyZWN0aXZlYCBhbmQgdGhlcmVmb3JlIGl0cyBzdHlsaW5nIHZhbHVlcyAoY2xhc3NlcyBhbmQgc3R5bGVzKSB3aWxsIGFsd2F5cyBiZSBldmFsdWF0ZWRcbiAqIGluIHRoZSBzYW1lIG9yZGVyLiBCZWNhdXNlIG9mIHRoaXMgY29uc2lzdGVudCBvcmRlcmluZywgdGhlIGZpcnN0IGRpcmVjdGl2ZSBoYXMgYSBoaWdoZXIgcHJpb3JpdHlcbiAqIHRoYW4gdGhlIHNlY29uZCBvbmUuIEl0IGlzIHdpdGggdGhpcyBwcmlvcml0emF0aW9uIG1lY2hhbmlzbSB0aGF0IHRoZSBzdHlsaW5nIGFsZ29yaXRobSBrbm93cyBob3dcbiAqIHRvIG1lcmdlIGFuZCBhcHBseSByZWR1ZGFudCBzdHlsaW5nIHByb3BlcnRpZXMuXG4gKlxuICogVGhlIGZ1bmN0aW9uIGl0c2VsZiBhcHBsaWVzIHRoZSBrZXkvdmFsdWUgZW50cmllcyAob3IgYW4gYXJyYXkgb2Yga2V5cykgdG9cbiAqIHRoZSBjb250ZXh0IGluIHRoZSBmb2xsb3dpbmcgc3RlcHMuXG4gKlxuICogU1RFUCAxOlxuICogICAgRmlyc3QgY2hlY2sgdG8gc2VlIHdoYXQgcHJvcGVydGllcyBhcmUgYWxyZWFkeSBzZXQgYW5kIGluIHVzZSBieSBhbm90aGVyIGRpcmVjdGl2ZSBpbiB0aGVcbiAqICAgIGNvbnRleHQgKGUuZy4gYG5nQ2xhc3NgIHNldCB0aGUgYHdpZHRoYCB2YWx1ZSBhbmQgYFtzdHlsZS53aWR0aF09XCJ3XCJgIGluIGEgZGlyZWN0aXZlIGlzXG4gKiAgICBhdHRlbXB0aW5nIHRvIHNldCBpdCBhcyB3ZWxsKS5cbiAqXG4gKiBTVEVQIDI6XG4gKiAgICBBbGwgcmVtYWluaW5nIHByb3BlcnRpZXMgKHRoYXQgd2VyZSBub3Qgc2V0IHByaW9yIHRvIHRoaXMgZGlyZWN0aXZlKSBhcmUgbm93IHVwZGF0ZWQgaW5cbiAqICAgIHRoZSBjb250ZXh0LiBBbnkgbmV3IHByb3BlcnRpZXMgYXJlIGluc2VydGVkIGV4YWN0bHkgYXQgdGhlaXIgc3BvdCBpbiB0aGUgY29udGV4dCBhbmQgYW55XG4gKiAgICBwcmV2aW91c2x5IHNldCBwcm9wZXJ0aWVzIGFyZSBzaGlmdGVkIHRvIGV4YWN0bHkgd2hlcmUgdGhlIGN1cnNvciBzaXRzIHdoaWxlIGl0ZXJhdGluZyBvdmVyXG4gKiAgICB0aGUgY29udGV4dC4gVGhlIGVuZCByZXN1bHQgaXMgYSBiYWxhbmNlZCBjb250ZXh0IHRoYXQgaW5jbHVkZXMgdGhlIGV4YWN0IG9yZGVyaW5nIG9mIHRoZVxuICogICAgc3R5bGluZyBwcm9wZXJ0aWVzL3ZhbHVlcyBmb3IgdGhlIHByb3ZpZGVkIGlucHV0IGZyb20gdGhlIGRpcmVjdGl2ZS5cbiAqXG4gKiBTVEVQIDM6XG4gKiAgICBBbnkgdW5tYXRjaGVkIHByb3BlcnRpZXMgaW4gdGhlIGNvbnRleHQgdGhhdCBiZWxvbmcgdG8gdGhlIGRpcmVjdGl2ZSBhcmUgc2V0IHRvIG51bGxcbiAqXG4gKiBPbmNlIHRoZSB1cGRhdGluZyBwaGFzZSBpcyBkb25lLCB0aGVuIHRoZSBhbGdvcml0aG0gd2lsbCBkZWNpZGUgd2hldGhlciBvciBub3QgdG8gZmxhZyB0aGVcbiAqIGZvbGxvdy11cCBkaXJlY3RpdmVzICh0aGUgZGlyZWN0aXZlcyB0aGF0IHdpbGwgcGFzcyBpbiB0aGVpciBzdHlsaW5nIHZhbHVlcykgZGVwZW5kaW5nIG9uIGlmXG4gKiB0aGUgXCJzaGFwZVwiIG9mIHRoZSBtdWx0aS12YWx1ZSBtYXAgaGFzIGNoYW5nZWQgKGVpdGhlciBpZiBhbnkga2V5cyBhcmUgcmVtb3ZlZCBvciBhZGRlZCBvclxuICogaWYgdGhlcmUgYXJlIGFueSBuZXcgYG51bGxgIHZhbHVlcykuIElmIGFueSBmb2xsb3ctdXAgZGlyZWN0aXZlcyBhcmUgZmxhZ2dlZCBhcyBkaXJ0eSB0aGVuIHRoZVxuICogYWxnb3JpdGhtIHdpbGwgcnVuIGFnYWluIGZvciB0aGVtLiBPdGhlcndpc2UgaWYgdGhlIHNoYXBlIGRpZCBub3QgY2hhbmdlIHRoZW4gYW55IGZvbGxvdy11cFxuICogZGlyZWN0aXZlcyB3aWxsIG5vdCBydW4gKHNvIGxvbmcgYXMgdGhlaXIgYmluZGluZyB2YWx1ZXMgc3RheSB0aGUgc2FtZSkuXG4gKlxuICogQHJldHVybnMgdGhlIHRvdGFsIGFtb3VudCBvZiBuZXcgc2xvdHMgdGhhdCB3ZXJlIGFsbG9jYXRlZCBpbnRvIHRoZSBjb250ZXh0IGR1ZSB0byBuZXcgc3R5bGluZ1xuICogICAgICAgICAgcHJvcGVydGllcyB0aGF0IHdlcmUgZGV0ZWN0ZWQuXG4gKi9cbmZ1bmN0aW9uIHBhdGNoU3R5bGluZ01hcEludG9Db250ZXh0KFxuICAgIGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBkaXJlY3RpdmVJbmRleDogbnVtYmVyLCBwbGF5ZXJCdWlsZGVySW5kZXg6IG51bWJlciwgY3R4U3RhcnQ6IG51bWJlcixcbiAgICBjdHhFbmQ6IG51bWJlciwgcHJvcHM6IChzdHJpbmcgfCBudWxsKVtdLCB2YWx1ZXM6IHtba2V5OiBzdHJpbmddOiBhbnl9IHwgdHJ1ZSwgY2FjaGVWYWx1ZTogYW55LFxuICAgIGVudHJ5SXNDbGFzc0Jhc2VkOiBib29sZWFuKTogbnVtYmVyIHtcbiAgbGV0IGRpcnR5ID0gZmFsc2U7XG5cbiAgY29uc3QgY2FjaGVJbmRleCA9IE1hcEJhc2VkT2Zmc2V0VmFsdWVzSW5kZXguVmFsdWVzU3RhcnRQb3NpdGlvbiArXG4gICAgICBkaXJlY3RpdmVJbmRleCAqIE1hcEJhc2VkT2Zmc2V0VmFsdWVzSW5kZXguU2l6ZTtcblxuICAvLyB0aGUgY2FjaGVkVmFsdWVzIGFycmF5IGlzIHRoZSByZWdpc3RyeSBvZiBhbGwgbXVsdGkgc3R5bGUgdmFsdWVzIChtYXAgdmFsdWVzKS4gRWFjaFxuICAvLyB2YWx1ZSBpcyBzdG9yZWQgKGNhY2hlZCkgZWFjaCB0aW1lIGlzIHVwZGF0ZWQuXG4gIGNvbnN0IGNhY2hlZFZhbHVlcyA9XG4gICAgICBjb250ZXh0W2VudHJ5SXNDbGFzc0Jhc2VkID8gU3R5bGluZ0luZGV4LkNhY2hlZE11bHRpQ2xhc3NlcyA6IFN0eWxpbmdJbmRleC5DYWNoZWRNdWx0aVN0eWxlc107XG5cbiAgLy8gdGhpcyBpcyB0aGUgaW5kZXggaW4gd2hpY2ggdGhpcyBkaXJlY3RpdmUgaGFzIG93bmVyc2hpcCBhY2Nlc3MgdG8gd3JpdGUgdG8gdGhpc1xuICAvLyB2YWx1ZSAoYW55dGhpbmcgYmVmb3JlIGlzIG93bmVkIGJ5IGEgcHJldmlvdXMgZGlyZWN0aXZlIHRoYXQgaXMgbW9yZSBpbXBvcnRhbnQpXG4gIGNvbnN0IG93bmVyc2hpcFZhbHVlc1N0YXJ0SW5kZXggPVxuICAgICAgY2FjaGVkVmFsdWVzW2NhY2hlSW5kZXggKyBNYXBCYXNlZE9mZnNldFZhbHVlc0luZGV4LlBvc2l0aW9uU3RhcnRPZmZzZXRdO1xuXG4gIGNvbnN0IGV4aXN0aW5nQ2FjaGVkVmFsdWUgPSBjYWNoZWRWYWx1ZXNbY2FjaGVJbmRleCArIE1hcEJhc2VkT2Zmc2V0VmFsdWVzSW5kZXguVmFsdWVPZmZzZXRdO1xuICBjb25zdCBleGlzdGluZ0NhY2hlZFZhbHVlQ291bnQgPVxuICAgICAgY2FjaGVkVmFsdWVzW2NhY2hlSW5kZXggKyBNYXBCYXNlZE9mZnNldFZhbHVlc0luZGV4LlZhbHVlQ291bnRPZmZzZXRdO1xuICBjb25zdCBleGlzdGluZ0NhY2hlZFZhbHVlSXNEaXJ0eSA9XG4gICAgICBjYWNoZWRWYWx1ZXNbY2FjaGVJbmRleCArIE1hcEJhc2VkT2Zmc2V0VmFsdWVzSW5kZXguRGlydHlGbGFnT2Zmc2V0XSA9PT0gMTtcblxuICAvLyBBIHNoYXBlIGNoYW5nZSBtZWFucyB0aGUgcHJvdmlkZWQgbWFwIHZhbHVlIGhhcyBlaXRoZXIgcmVtb3ZlZCBvciBhZGRlZCBuZXcgcHJvcGVydGllc1xuICAvLyBjb21wYXJlZCB0byB3aGF0IHdlcmUgaW4gdGhlIGxhc3QgdGltZS4gSWYgYSBzaGFwZSBjaGFuZ2Ugb2NjdXJzIHRoZW4gaXQgbWVhbnMgdGhhdCBhbGxcbiAgLy8gZm9sbG93LXVwIG11bHRpLXN0eWxpbmcgZW50cmllcyBhcmUgb2Jzb2xldGUgYW5kIHdpbGwgYmUgZXhhbWluZWQgYWdhaW4gd2hlbiBDRCBydW5zXG4gIC8vIHRoZW0uIElmIGEgc2hhcGUgY2hhbmdlIGhhcyBub3Qgb2NjdXJyZWQgdGhlbiB0aGVyZSBpcyBubyByZWFzb24gdG8gY2hlY2sgYW55IG90aGVyXG4gIC8vIGRpcmVjdGl2ZSB2YWx1ZXMgaWYgdGhlaXIgaWRlbnRpdHkgaGFzIG5vdCBjaGFuZ2VkLiBJZiBhIHByZXZpb3VzIGRpcmVjdGl2ZSBzZXQgdGhpc1xuICAvLyB2YWx1ZSBhcyBkaXJ0eSAoYmVjYXVzZSBpdHMgb3duIHNoYXBlIGNoYW5nZWQpIHRoZW4gdGhpcyBtZWFucyB0aGF0IHRoZSBvYmplY3QgaGFzIGJlZW5cbiAgLy8gb2Zmc2V0IHRvIGEgZGlmZmVyZW50IGFyZWEgaW4gdGhlIGNvbnRleHQuIEJlY2F1c2UgaXRzIHZhbHVlIGhhcyBiZWVuIG9mZnNldCB0aGVuIGl0XG4gIC8vIGNhbid0IHdyaXRlIHRvIGEgcmVnaW9uIHRoYXQgaXQgd3JvdGUgdG8gYmVmb3JlICh3aGljaCBtYXkgaGF2ZSBiZWVuIGFwYXJ0IG9mIGFub3RoZXJcbiAgLy8gZGlyZWN0aXZlKSBhbmQgdGhlcmVmb3JlIGl0cyBzaGFwZSBjaGFuZ2VzIHRvby5cbiAgbGV0IHZhbHVlc0VudHJ5U2hhcGVDaGFuZ2UgPVxuICAgICAgZXhpc3RpbmdDYWNoZWRWYWx1ZUlzRGlydHkgfHwgKCghZXhpc3RpbmdDYWNoZWRWYWx1ZSAmJiBjYWNoZVZhbHVlKSA/IHRydWUgOiBmYWxzZSk7XG5cbiAgbGV0IHRvdGFsVW5pcXVlVmFsdWVzID0gMDtcbiAgbGV0IHRvdGFsTmV3QWxsb2NhdGVkU2xvdHMgPSAwO1xuXG4gIC8vIHRoaXMgaXMgYSB0cmljayB0byBhdm9pZCBidWlsZGluZyB7a2V5OnZhbHVlfSBtYXAgd2hlcmUgYWxsIHRoZSB2YWx1ZXNcbiAgLy8gYXJlIGB0cnVlYCAodGhpcyBoYXBwZW5zIHdoZW4gYSBjbGFzc05hbWUgc3RyaW5nIGlzIHByb3ZpZGVkIGluc3RlYWQgb2YgYVxuICAvLyBtYXAgYXMgYW4gaW5wdXQgdmFsdWUgdG8gdGhpcyBzdHlsaW5nIGFsZ29yaXRobSlcbiAgY29uc3QgYXBwbHlBbGxQcm9wcyA9IHZhbHVlcyA9PT0gdHJ1ZTtcblxuICAvLyBTVEVQIDE6XG4gIC8vIGxvb3AgdGhyb3VnaCB0aGUgZWFybGllciBkaXJlY3RpdmVzIGFuZCBmaWd1cmUgb3V0IGlmIGFueSBwcm9wZXJ0aWVzIGhlcmUgd2lsbCBiZSBwbGFjZWRcbiAgLy8gaW4gdGhlaXIgYXJlYSAodGhpcyBoYXBwZW5zIHdoZW4gdGhlIHZhbHVlIGlzIG51bGwgYmVjYXVzZSB0aGUgZWFybGllciBkaXJlY3RpdmUgZXJhc2VkIGl0KS5cbiAgbGV0IGN0eEluZGV4ID0gY3R4U3RhcnQ7XG4gIGxldCB0b3RhbFJlbWFpbmluZ1Byb3BlcnRpZXMgPSBwcm9wcy5sZW5ndGg7XG4gIHdoaWxlIChjdHhJbmRleCA8IG93bmVyc2hpcFZhbHVlc1N0YXJ0SW5kZXgpIHtcbiAgICBjb25zdCBjdXJyZW50UHJvcCA9IGdldFByb3AoY29udGV4dCwgY3R4SW5kZXgpO1xuICAgIGlmICh0b3RhbFJlbWFpbmluZ1Byb3BlcnRpZXMpIHtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcHJvcHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3QgbWFwUHJvcCA9IHByb3BzW2ldO1xuICAgICAgICBjb25zdCBub3JtYWxpemVkUHJvcCA9IG1hcFByb3AgPyAoZW50cnlJc0NsYXNzQmFzZWQgPyBtYXBQcm9wIDogaHlwaGVuYXRlKG1hcFByb3ApKSA6IG51bGw7XG4gICAgICAgIGlmIChub3JtYWxpemVkUHJvcCAmJiBjdXJyZW50UHJvcCA9PT0gbm9ybWFsaXplZFByb3ApIHtcbiAgICAgICAgICBjb25zdCBjdXJyZW50VmFsdWUgPSBnZXRWYWx1ZShjb250ZXh0LCBjdHhJbmRleCk7XG4gICAgICAgICAgY29uc3QgY3VycmVudERpcmVjdGl2ZUluZGV4ID0gZ2V0RGlyZWN0aXZlSW5kZXhGcm9tRW50cnkoY29udGV4dCwgY3R4SW5kZXgpO1xuICAgICAgICAgIGNvbnN0IHZhbHVlID0gYXBwbHlBbGxQcm9wcyA/IHRydWUgOiAodmFsdWVzIGFze1trZXk6IHN0cmluZ106IGFueX0pW25vcm1hbGl6ZWRQcm9wXTtcbiAgICAgICAgICBjb25zdCBjdXJyZW50RmxhZyA9IGdldFBvaW50ZXJzKGNvbnRleHQsIGN0eEluZGV4KTtcbiAgICAgICAgICBpZiAoaGFzVmFsdWVDaGFuZ2VkKGN1cnJlbnRGbGFnLCBjdXJyZW50VmFsdWUsIHZhbHVlKSAmJlxuICAgICAgICAgICAgICBhbGxvd1ZhbHVlQ2hhbmdlKGN1cnJlbnRWYWx1ZSwgdmFsdWUsIGN1cnJlbnREaXJlY3RpdmVJbmRleCwgZGlyZWN0aXZlSW5kZXgpKSB7XG4gICAgICAgICAgICBzZXRWYWx1ZShjb250ZXh0LCBjdHhJbmRleCwgdmFsdWUpO1xuICAgICAgICAgICAgc2V0UGxheWVyQnVpbGRlckluZGV4KGNvbnRleHQsIGN0eEluZGV4LCBwbGF5ZXJCdWlsZGVySW5kZXgsIGRpcmVjdGl2ZUluZGV4KTtcbiAgICAgICAgICAgIGlmIChoYXNJbml0aWFsVmFsdWVDaGFuZ2VkKGNvbnRleHQsIGN1cnJlbnRGbGFnLCB2YWx1ZSkpIHtcbiAgICAgICAgICAgICAgc2V0RGlydHkoY29udGV4dCwgY3R4SW5kZXgsIHRydWUpO1xuICAgICAgICAgICAgICBkaXJ0eSA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIHByb3BzW2ldID0gbnVsbDtcbiAgICAgICAgICB0b3RhbFJlbWFpbmluZ1Byb3BlcnRpZXMtLTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBjdHhJbmRleCArPSBTdHlsaW5nSW5kZXguU2l6ZTtcbiAgfVxuXG4gIC8vIFNURVAgMjpcbiAgLy8gYXBwbHkgdGhlIGxlZnQgb3ZlciBwcm9wZXJ0aWVzIHRvIHRoZSBjb250ZXh0IGluIHRoZSBjb3JyZWN0IG9yZGVyLlxuICBpZiAodG90YWxSZW1haW5pbmdQcm9wZXJ0aWVzKSB7XG4gICAgY29uc3Qgc2FuaXRpemVyID0gZW50cnlJc0NsYXNzQmFzZWQgPyBudWxsIDogZ2V0U3R5bGVTYW5pdGl6ZXIoY29udGV4dCwgZGlyZWN0aXZlSW5kZXgpO1xuICAgIHByb3BlcnRpZXNMb29wOiBmb3IgKGxldCBpID0gMDsgaSA8IHByb3BzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBtYXBQcm9wID0gcHJvcHNbaV07XG5cbiAgICAgIGlmICghbWFwUHJvcCkge1xuICAgICAgICAvLyB0aGlzIGlzIGFuIGVhcmx5IGV4aXQgaW4gY2FzZSBhIHZhbHVlIHdhcyBhbHJlYWR5IGVuY291bnRlcmVkIGFib3ZlIGluIHRoZVxuICAgICAgICAvLyBwcmV2aW91cyBsb29wICh3aGljaCBtZWFucyB0aGF0IHRoZSBwcm9wZXJ0eSB3YXMgYXBwbGllZCBvciByZWplY3RlZClcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHZhbHVlID0gYXBwbHlBbGxQcm9wcyA/IHRydWUgOiAodmFsdWVzIGFze1trZXk6IHN0cmluZ106IGFueX0pW21hcFByb3BdO1xuICAgICAgY29uc3Qgbm9ybWFsaXplZFByb3AgPSBlbnRyeUlzQ2xhc3NCYXNlZCA/IG1hcFByb3AgOiBoeXBoZW5hdGUobWFwUHJvcCk7XG4gICAgICBjb25zdCBpc0luc2lkZU93bmVyc2hpcEFyZWEgPSBjdHhJbmRleCA+PSBvd25lcnNoaXBWYWx1ZXNTdGFydEluZGV4O1xuXG4gICAgICBmb3IgKGxldCBqID0gY3R4SW5kZXg7IGogPCBjdHhFbmQ7IGogKz0gU3R5bGluZ0luZGV4LlNpemUpIHtcbiAgICAgICAgY29uc3QgZGlzdGFudEN0eFByb3AgPSBnZXRQcm9wKGNvbnRleHQsIGopO1xuICAgICAgICBpZiAoZGlzdGFudEN0eFByb3AgPT09IG5vcm1hbGl6ZWRQcm9wKSB7XG4gICAgICAgICAgY29uc3QgZGlzdGFudEN0eERpcmVjdGl2ZUluZGV4ID0gZ2V0RGlyZWN0aXZlSW5kZXhGcm9tRW50cnkoY29udGV4dCwgaik7XG4gICAgICAgICAgY29uc3QgZGlzdGFudEN0eFBsYXllckJ1aWxkZXJJbmRleCA9IGdldFBsYXllckJ1aWxkZXJJbmRleChjb250ZXh0LCBqKTtcbiAgICAgICAgICBjb25zdCBkaXN0YW50Q3R4VmFsdWUgPSBnZXRWYWx1ZShjb250ZXh0LCBqKTtcbiAgICAgICAgICBjb25zdCBkaXN0YW50Q3R4RmxhZyA9IGdldFBvaW50ZXJzKGNvbnRleHQsIGopO1xuXG4gICAgICAgICAgaWYgKGFsbG93VmFsdWVDaGFuZ2UoZGlzdGFudEN0eFZhbHVlLCB2YWx1ZSwgZGlzdGFudEN0eERpcmVjdGl2ZUluZGV4LCBkaXJlY3RpdmVJbmRleCkpIHtcbiAgICAgICAgICAgIC8vIGV2ZW4gaWYgdGhlIGVudHJ5IGlzbid0IHVwZGF0ZWQgKGJ5IHZhbHVlIG9yIGRpcmVjdGl2ZUluZGV4KSB0aGVuXG4gICAgICAgICAgICAvLyBpdCBzaG91bGQgc3RpbGwgYmUgbW92ZWQgb3ZlciB0byB0aGUgY29ycmVjdCBzcG90IGluIHRoZSBhcnJheSBzb1xuICAgICAgICAgICAgLy8gdGhlIGl0ZXJhdGlvbiBsb29wIGlzIHRpZ2h0ZXIuXG4gICAgICAgICAgICBpZiAoaXNJbnNpZGVPd25lcnNoaXBBcmVhKSB7XG4gICAgICAgICAgICAgIHN3YXBNdWx0aUNvbnRleHRFbnRyaWVzKGNvbnRleHQsIGN0eEluZGV4LCBqKTtcbiAgICAgICAgICAgICAgdG90YWxVbmlxdWVWYWx1ZXMrKztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGhhc1ZhbHVlQ2hhbmdlZChkaXN0YW50Q3R4RmxhZywgZGlzdGFudEN0eFZhbHVlLCB2YWx1ZSkpIHtcbiAgICAgICAgICAgICAgaWYgKHZhbHVlID09PSBudWxsIHx8IHZhbHVlID09PSB1bmRlZmluZWQgJiYgdmFsdWUgIT09IGRpc3RhbnRDdHhWYWx1ZSkge1xuICAgICAgICAgICAgICAgIHZhbHVlc0VudHJ5U2hhcGVDaGFuZ2UgPSB0cnVlO1xuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgc2V0VmFsdWUoY29udGV4dCwgY3R4SW5kZXgsIHZhbHVlKTtcblxuICAgICAgICAgICAgICAvLyBTS0lQIElGIElOSVRJQUwgQ0hFQ0tcbiAgICAgICAgICAgICAgLy8gSWYgdGhlIGZvcm1lciBgdmFsdWVgIGlzIGBudWxsYCB0aGVuIGl0IG1lYW5zIHRoYXQgYW4gaW5pdGlhbCB2YWx1ZVxuICAgICAgICAgICAgICAvLyBjb3VsZCBiZSBiZWluZyByZW5kZXJlZCBvbiBzY3JlZW4uIElmIHRoYXQgaXMgdGhlIGNhc2UgdGhlbiB0aGVyZSBpc1xuICAgICAgICAgICAgICAvLyBubyBwb2ludCBpbiB1cGRhdGluZyB0aGUgdmFsdWUgaW4gY2FzZSBpdCBtYXRjaGVzLiBJbiBvdGhlciB3b3JkcyBpZiB0aGVcbiAgICAgICAgICAgICAgLy8gbmV3IHZhbHVlIGlzIHRoZSBleGFjdCBzYW1lIGFzIHRoZSBwcmV2aW91c2x5IHJlbmRlcmVkIHZhbHVlICh3aGljaFxuICAgICAgICAgICAgICAvLyBoYXBwZW5zIHRvIGJlIHRoZSBpbml0aWFsIHZhbHVlKSB0aGVuIGRvIG5vdGhpbmcuXG4gICAgICAgICAgICAgIGlmIChkaXN0YW50Q3R4VmFsdWUgIT09IG51bGwgfHxcbiAgICAgICAgICAgICAgICAgIGhhc0luaXRpYWxWYWx1ZUNoYW5nZWQoY29udGV4dCwgZGlzdGFudEN0eEZsYWcsIHZhbHVlKSkge1xuICAgICAgICAgICAgICAgIHNldERpcnR5KGNvbnRleHQsIGN0eEluZGV4LCB0cnVlKTtcbiAgICAgICAgICAgICAgICBkaXJ0eSA9IHRydWU7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGRpc3RhbnRDdHhEaXJlY3RpdmVJbmRleCAhPT0gZGlyZWN0aXZlSW5kZXggfHxcbiAgICAgICAgICAgICAgICBwbGF5ZXJCdWlsZGVySW5kZXggIT09IGRpc3RhbnRDdHhQbGF5ZXJCdWlsZGVySW5kZXgpIHtcbiAgICAgICAgICAgICAgc2V0UGxheWVyQnVpbGRlckluZGV4KGNvbnRleHQsIGN0eEluZGV4LCBwbGF5ZXJCdWlsZGVySW5kZXgsIGRpcmVjdGl2ZUluZGV4KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgICBjdHhJbmRleCArPSBTdHlsaW5nSW5kZXguU2l6ZTtcbiAgICAgICAgICBjb250aW51ZSBwcm9wZXJ0aWVzTG9vcDtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBmYWxsYmFjayBjYXNlIC4uLiB2YWx1ZSBub3QgZm91bmQgYXQgYWxsIGluIHRoZSBjb250ZXh0XG4gICAgICBpZiAodmFsdWUgIT0gbnVsbCkge1xuICAgICAgICB2YWx1ZXNFbnRyeVNoYXBlQ2hhbmdlID0gdHJ1ZTtcbiAgICAgICAgdG90YWxVbmlxdWVWYWx1ZXMrKztcbiAgICAgICAgY29uc3QgZmxhZyA9IHByZXBhcmVJbml0aWFsRmxhZyhjb250ZXh0LCBub3JtYWxpemVkUHJvcCwgZW50cnlJc0NsYXNzQmFzZWQsIHNhbml0aXplcikgfFxuICAgICAgICAgICAgU3R5bGluZ0ZsYWdzLkRpcnR5O1xuXG4gICAgICAgIGNvbnN0IGluc2VydGlvbkluZGV4ID0gaXNJbnNpZGVPd25lcnNoaXBBcmVhID9cbiAgICAgICAgICAgIGN0eEluZGV4IDpcbiAgICAgICAgICAgIChvd25lcnNoaXBWYWx1ZXNTdGFydEluZGV4ICsgdG90YWxOZXdBbGxvY2F0ZWRTbG90cyAqIFN0eWxpbmdJbmRleC5TaXplKTtcbiAgICAgICAgaW5zZXJ0TmV3TXVsdGlQcm9wZXJ0eShcbiAgICAgICAgICAgIGNvbnRleHQsIGluc2VydGlvbkluZGV4LCBlbnRyeUlzQ2xhc3NCYXNlZCwgbm9ybWFsaXplZFByb3AsIGZsYWcsIHZhbHVlLCBkaXJlY3RpdmVJbmRleCxcbiAgICAgICAgICAgIHBsYXllckJ1aWxkZXJJbmRleCk7XG5cbiAgICAgICAgdG90YWxOZXdBbGxvY2F0ZWRTbG90cysrO1xuICAgICAgICBjdHhFbmQgKz0gU3R5bGluZ0luZGV4LlNpemU7XG4gICAgICAgIGN0eEluZGV4ICs9IFN0eWxpbmdJbmRleC5TaXplO1xuXG4gICAgICAgIGRpcnR5ID0gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvLyBTVEVQIDM6XG4gIC8vIFJlbW92ZSAobnVsbGlmeSkgYW55IGV4aXN0aW5nIGVudHJpZXMgaW4gdGhlIGNvbnRleHQgdGhhdCB3ZXJlIG5vdCBhcGFydCBvZiB0aGVcbiAgLy8gbWFwIGlucHV0IHZhbHVlIHRoYXQgd2FzIHBhc3NlZCBpbnRvIHRoaXMgYWxnb3JpdGhtIGZvciB0aGlzIGRpcmVjdGl2ZS5cbiAgd2hpbGUgKGN0eEluZGV4IDwgY3R4RW5kKSB7XG4gICAgdmFsdWVzRW50cnlTaGFwZUNoYW5nZSA9IHRydWU7ICAvLyBzb21lIHZhbHVlcyBhcmUgbWlzc2luZ1xuICAgIGNvbnN0IGN0eFZhbHVlID0gZ2V0VmFsdWUoY29udGV4dCwgY3R4SW5kZXgpO1xuICAgIGNvbnN0IGN0eEZsYWcgPSBnZXRQb2ludGVycyhjb250ZXh0LCBjdHhJbmRleCk7XG4gICAgY29uc3QgY3R4RGlyZWN0aXZlID0gZ2V0RGlyZWN0aXZlSW5kZXhGcm9tRW50cnkoY29udGV4dCwgY3R4SW5kZXgpO1xuICAgIGlmIChjdHhWYWx1ZSAhPSBudWxsKSB7XG4gICAgICB2YWx1ZXNFbnRyeVNoYXBlQ2hhbmdlID0gdHJ1ZTtcbiAgICB9XG4gICAgaWYgKGhhc1ZhbHVlQ2hhbmdlZChjdHhGbGFnLCBjdHhWYWx1ZSwgbnVsbCkpIHtcbiAgICAgIHNldFZhbHVlKGNvbnRleHQsIGN0eEluZGV4LCBudWxsKTtcbiAgICAgIC8vIG9ubHkgaWYgdGhlIGluaXRpYWwgdmFsdWUgaXMgZmFsc3kgdGhlblxuICAgICAgaWYgKGhhc0luaXRpYWxWYWx1ZUNoYW5nZWQoY29udGV4dCwgY3R4RmxhZywgY3R4VmFsdWUpKSB7XG4gICAgICAgIHNldERpcnR5KGNvbnRleHQsIGN0eEluZGV4LCB0cnVlKTtcbiAgICAgICAgZGlydHkgPSB0cnVlO1xuICAgICAgfVxuICAgICAgc2V0UGxheWVyQnVpbGRlckluZGV4KGNvbnRleHQsIGN0eEluZGV4LCBwbGF5ZXJCdWlsZGVySW5kZXgsIGRpcmVjdGl2ZUluZGV4KTtcbiAgICB9XG4gICAgY3R4SW5kZXggKz0gU3R5bGluZ0luZGV4LlNpemU7XG4gIH1cblxuICAvLyBCZWNhdXNlIHRoZSBvYmplY3Qgc2hhcGUgaGFzIGNoYW5nZWQsIHRoaXMgbWVhbnMgdGhhdCBhbGwgZm9sbG93LXVwIGRpcmVjdGl2ZXMgd2lsbCBuZWVkIHRvXG4gIC8vIHJlYXBwbHkgdGhlaXIgdmFsdWVzIGludG8gdGhlIG9iamVjdC4gRm9yIHRoaXMgdG8gaGFwcGVuLCB0aGUgY2FjaGVkIGFycmF5IG5lZWRzIHRvIGJlIHVwZGF0ZWRcbiAgLy8gd2l0aCBkaXJ0eSBmbGFncyBzbyB0aGF0IGZvbGxvdy11cCBjYWxscyB0byBgdXBkYXRlU3R5bGluZ01hcGAgd2lsbCByZWFwcGx5IHRoZWlyIHN0eWxpbmcgY29kZS5cbiAgLy8gdGhlIHJlYXBwbGljYXRpb24gb2Ygc3R5bGluZyBjb2RlIHdpdGhpbiB0aGUgY29udGV4dCB3aWxsIHJlc2hhcGUgaXQgYW5kIHVwZGF0ZSB0aGUgb2Zmc2V0XG4gIC8vIHZhbHVlcyAoYWxzbyBmb2xsb3ctdXAgZGlyZWN0aXZlcyBjYW4gd3JpdGUgbmV3IHZhbHVlcyBpbiBjYXNlIGVhcmxpZXIgZGlyZWN0aXZlcyBzZXQgYW55dGhpbmdcbiAgLy8gdG8gbnVsbCBkdWUgdG8gcmVtb3ZhbHMgb3IgZmFsc3kgdmFsdWVzKS5cbiAgdmFsdWVzRW50cnlTaGFwZUNoYW5nZSA9IHZhbHVlc0VudHJ5U2hhcGVDaGFuZ2UgfHwgZXhpc3RpbmdDYWNoZWRWYWx1ZUNvdW50ICE9PSB0b3RhbFVuaXF1ZVZhbHVlcztcbiAgdXBkYXRlQ2FjaGVkTWFwVmFsdWUoXG4gICAgICBjb250ZXh0LCBkaXJlY3RpdmVJbmRleCwgZW50cnlJc0NsYXNzQmFzZWQsIGNhY2hlVmFsdWUsIG93bmVyc2hpcFZhbHVlc1N0YXJ0SW5kZXgsIGN0eEVuZCxcbiAgICAgIHRvdGFsVW5pcXVlVmFsdWVzLCB2YWx1ZXNFbnRyeVNoYXBlQ2hhbmdlKTtcblxuICBpZiAoZGlydHkpIHtcbiAgICBzZXRDb250ZXh0RGlydHkoY29udGV4dCwgdHJ1ZSk7XG4gIH1cblxuICByZXR1cm4gdG90YWxOZXdBbGxvY2F0ZWRTbG90cztcbn1cblxuLyoqXG4gKiBTZXRzIGFuZCByZXNvbHZlcyBhIHNpbmdsZSBjbGFzcyB2YWx1ZSBvbiB0aGUgcHJvdmlkZWQgYFN0eWxpbmdDb250ZXh0YCBzb1xuICogdGhhdCB0aGV5IGNhbiBiZSBhcHBsaWVkIHRvIHRoZSBlbGVtZW50IG9uY2UgYHJlbmRlclN0eWxpbmdgIGlzIGNhbGxlZC5cbiAqXG4gKiBAcGFyYW0gY29udGV4dCBUaGUgc3R5bGluZyBjb250ZXh0IHRoYXQgd2lsbCBiZSB1cGRhdGVkIHdpdGggdGhlXG4gKiAgICBuZXdseSBwcm92aWRlZCBjbGFzcyB2YWx1ZS5cbiAqIEBwYXJhbSBvZmZzZXQgVGhlIGluZGV4IG9mIHRoZSBDU1MgY2xhc3Mgd2hpY2ggaXMgYmVpbmcgdXBkYXRlZC5cbiAqIEBwYXJhbSBhZGRPclJlbW92ZSBXaGV0aGVyIG9yIG5vdCB0byBhZGQgb3IgcmVtb3ZlIHRoZSBDU1MgY2xhc3NcbiAqIEBwYXJhbSBmb3JjZU92ZXJyaWRlIHdoZXRoZXIgb3Igbm90IHRvIHNraXAgYWxsIGRpcmVjdGl2ZSBwcmlvcml0aXphdGlvblxuICogICAgYW5kIGp1c3QgYXBwbHkgdGhlIHZhbHVlIHJlZ2FyZGxlc3MuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB1cGRhdGVDbGFzc1Byb3AoXG4gICAgY29udGV4dDogU3R5bGluZ0NvbnRleHQsIG9mZnNldDogbnVtYmVyLFxuICAgIGlucHV0OiBib29sZWFuIHwgQm91bmRQbGF5ZXJGYWN0b3J5PGJvb2xlYW58bnVsbD58IG51bGwsIGRpcmVjdGl2ZUluZGV4OiBudW1iZXIgPSAwLFxuICAgIGZvcmNlT3ZlcnJpZGU/OiBib29sZWFuKTogdm9pZCB7XG4gIHVwZGF0ZVNpbmdsZVN0eWxpbmdWYWx1ZShjb250ZXh0LCBvZmZzZXQsIGlucHV0LCB0cnVlLCBkaXJlY3RpdmVJbmRleCwgZm9yY2VPdmVycmlkZSk7XG59XG5cbi8qKlxuICogU2V0cyBhbmQgcmVzb2x2ZXMgYSBzaW5nbGUgc3R5bGUgdmFsdWUgb24gdGhlIHByb3ZpZGVkIGBTdHlsaW5nQ29udGV4dGAgc29cbiAqIHRoYXQgdGhleSBjYW4gYmUgYXBwbGllZCB0byB0aGUgZWxlbWVudCBvbmNlIGByZW5kZXJTdHlsaW5nYCBpcyBjYWxsZWQuXG4gKlxuICogTm90ZSB0aGF0IHByb3AtbGV2ZWwgc3R5bGluZyB2YWx1ZXMgYXJlIGNvbnNpZGVyZWQgaGlnaGVyIHByaW9yaXR5IHRoYW4gYW55IHN0eWxpbmcgdGhhdFxuICogaGFzIGJlZW4gYXBwbGllZCB1c2luZyBgdXBkYXRlU3R5bGluZ01hcGAsIHRoZXJlZm9yZSwgd2hlbiBzdHlsaW5nIHZhbHVlcyBhcmUgcmVuZGVyZWRcbiAqIHRoZW4gYW55IHN0eWxlcy9jbGFzc2VzIHRoYXQgaGF2ZSBiZWVuIGFwcGxpZWQgdXNpbmcgdGhpcyBmdW5jdGlvbiB3aWxsIGJlIGNvbnNpZGVyZWQgZmlyc3RcbiAqICh0aGVuIG11bHRpIHZhbHVlcyBzZWNvbmQgYW5kIHRoZW4gaW5pdGlhbCB2YWx1ZXMgYXMgYSBiYWNrdXApLlxuICpcbiAqIEBwYXJhbSBjb250ZXh0IFRoZSBzdHlsaW5nIGNvbnRleHQgdGhhdCB3aWxsIGJlIHVwZGF0ZWQgd2l0aCB0aGVcbiAqICAgIG5ld2x5IHByb3ZpZGVkIHN0eWxlIHZhbHVlLlxuICogQHBhcmFtIG9mZnNldCBUaGUgaW5kZXggb2YgdGhlIHByb3BlcnR5IHdoaWNoIGlzIGJlaW5nIHVwZGF0ZWQuXG4gKiBAcGFyYW0gdmFsdWUgVGhlIENTUyBzdHlsZSB2YWx1ZSB0aGF0IHdpbGwgYmUgYXNzaWduZWRcbiAqIEBwYXJhbSBmb3JjZU92ZXJyaWRlIHdoZXRoZXIgb3Igbm90IHRvIHNraXAgYWxsIGRpcmVjdGl2ZSBwcmlvcml0aXphdGlvblxuICogICAgYW5kIGp1c3QgYXBwbHkgdGhlIHZhbHVlIHJlZ2FyZGxlc3MuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB1cGRhdGVTdHlsZVByb3AoXG4gICAgY29udGV4dDogU3R5bGluZ0NvbnRleHQsIG9mZnNldDogbnVtYmVyLFxuICAgIGlucHV0OiBzdHJpbmcgfCBib29sZWFuIHwgbnVsbCB8IEJvdW5kUGxheWVyRmFjdG9yeTxzdHJpbmd8Ym9vbGVhbnxudWxsPixcbiAgICBkaXJlY3RpdmVJbmRleDogbnVtYmVyID0gMCwgZm9yY2VPdmVycmlkZT86IGJvb2xlYW4pOiB2b2lkIHtcbiAgdXBkYXRlU2luZ2xlU3R5bGluZ1ZhbHVlKGNvbnRleHQsIG9mZnNldCwgaW5wdXQsIGZhbHNlLCBkaXJlY3RpdmVJbmRleCwgZm9yY2VPdmVycmlkZSk7XG59XG5cbmZ1bmN0aW9uIHVwZGF0ZVNpbmdsZVN0eWxpbmdWYWx1ZShcbiAgICBjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgb2Zmc2V0OiBudW1iZXIsXG4gICAgaW5wdXQ6IHN0cmluZyB8IGJvb2xlYW4gfCBudWxsIHwgQm91bmRQbGF5ZXJGYWN0b3J5PHN0cmluZ3xib29sZWFufG51bGw+LCBpc0NsYXNzQmFzZWQ6IGJvb2xlYW4sXG4gICAgZGlyZWN0aXZlSW5kZXg6IG51bWJlciwgZm9yY2VPdmVycmlkZT86IGJvb2xlYW4pOiB2b2lkIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydFZhbGlkRGlyZWN0aXZlSW5kZXgoY29udGV4dCwgZGlyZWN0aXZlSW5kZXgpO1xuICBjb25zdCBzaW5nbGVJbmRleCA9IGdldFNpbmdsZVByb3BJbmRleFZhbHVlKGNvbnRleHQsIGRpcmVjdGl2ZUluZGV4LCBvZmZzZXQsIGlzQ2xhc3NCYXNlZCk7XG4gIGNvbnN0IGN1cnJWYWx1ZSA9IGdldFZhbHVlKGNvbnRleHQsIHNpbmdsZUluZGV4KTtcbiAgY29uc3QgY3VyckZsYWcgPSBnZXRQb2ludGVycyhjb250ZXh0LCBzaW5nbGVJbmRleCk7XG4gIGNvbnN0IGN1cnJEaXJlY3RpdmUgPSBnZXREaXJlY3RpdmVJbmRleEZyb21FbnRyeShjb250ZXh0LCBzaW5nbGVJbmRleCk7XG4gIGNvbnN0IHZhbHVlOiBzdHJpbmd8Ym9vbGVhbnxudWxsID0gKGlucHV0IGluc3RhbmNlb2YgQm91bmRQbGF5ZXJGYWN0b3J5KSA/IGlucHV0LnZhbHVlIDogaW5wdXQ7XG5cbiAgaWYgKGhhc1ZhbHVlQ2hhbmdlZChjdXJyRmxhZywgY3VyclZhbHVlLCB2YWx1ZSkgJiZcbiAgICAgIChmb3JjZU92ZXJyaWRlIHx8IGFsbG93VmFsdWVDaGFuZ2UoY3VyclZhbHVlLCB2YWx1ZSwgY3VyckRpcmVjdGl2ZSwgZGlyZWN0aXZlSW5kZXgpKSkge1xuICAgIGNvbnN0IGlzQ2xhc3NCYXNlZCA9IChjdXJyRmxhZyAmIFN0eWxpbmdGbGFncy5DbGFzcykgPT09IFN0eWxpbmdGbGFncy5DbGFzcztcbiAgICBjb25zdCBlbGVtZW50ID0gY29udGV4dFtTdHlsaW5nSW5kZXguRWxlbWVudFBvc2l0aW9uXSAhYXMgSFRNTEVsZW1lbnQ7XG4gICAgY29uc3QgcGxheWVyQnVpbGRlciA9IGlucHV0IGluc3RhbmNlb2YgQm91bmRQbGF5ZXJGYWN0b3J5ID9cbiAgICAgICAgbmV3IENsYXNzQW5kU3R5bGVQbGF5ZXJCdWlsZGVyKFxuICAgICAgICAgICAgaW5wdXQgYXMgYW55LCBlbGVtZW50LCBpc0NsYXNzQmFzZWQgPyBCaW5kaW5nVHlwZS5DbGFzcyA6IEJpbmRpbmdUeXBlLlN0eWxlKSA6XG4gICAgICAgIG51bGw7XG4gICAgY29uc3QgdmFsdWUgPSAocGxheWVyQnVpbGRlciA/IChpbnB1dCBhcyBCb3VuZFBsYXllckZhY3Rvcnk8YW55PikudmFsdWUgOiBpbnB1dCkgYXMgc3RyaW5nIHxcbiAgICAgICAgYm9vbGVhbiB8IG51bGw7XG4gICAgY29uc3QgY3VyclBsYXllckluZGV4ID0gZ2V0UGxheWVyQnVpbGRlckluZGV4KGNvbnRleHQsIHNpbmdsZUluZGV4KTtcblxuICAgIGxldCBwbGF5ZXJCdWlsZGVyc0FyZURpcnR5ID0gZmFsc2U7XG4gICAgbGV0IHBsYXllckJ1aWxkZXJJbmRleCA9IHBsYXllckJ1aWxkZXIgPyBjdXJyUGxheWVySW5kZXggOiAwO1xuICAgIGlmIChoYXNQbGF5ZXJCdWlsZGVyQ2hhbmdlZChjb250ZXh0LCBwbGF5ZXJCdWlsZGVyLCBjdXJyUGxheWVySW5kZXgpKSB7XG4gICAgICBjb25zdCBuZXdJbmRleCA9IHNldFBsYXllckJ1aWxkZXIoY29udGV4dCwgcGxheWVyQnVpbGRlciwgY3VyclBsYXllckluZGV4KTtcbiAgICAgIHBsYXllckJ1aWxkZXJJbmRleCA9IHBsYXllckJ1aWxkZXIgPyBuZXdJbmRleCA6IDA7XG4gICAgICBwbGF5ZXJCdWlsZGVyc0FyZURpcnR5ID0gdHJ1ZTtcbiAgICB9XG5cbiAgICBpZiAocGxheWVyQnVpbGRlcnNBcmVEaXJ0eSB8fCBjdXJyRGlyZWN0aXZlICE9PSBkaXJlY3RpdmVJbmRleCkge1xuICAgICAgc2V0UGxheWVyQnVpbGRlckluZGV4KGNvbnRleHQsIHNpbmdsZUluZGV4LCBwbGF5ZXJCdWlsZGVySW5kZXgsIGRpcmVjdGl2ZUluZGV4KTtcbiAgICB9XG5cbiAgICBpZiAoY3VyckRpcmVjdGl2ZSAhPT0gZGlyZWN0aXZlSW5kZXgpIHtcbiAgICAgIGNvbnN0IHByb3AgPSBnZXRQcm9wKGNvbnRleHQsIHNpbmdsZUluZGV4KTtcbiAgICAgIGNvbnN0IHNhbml0aXplciA9IGdldFN0eWxlU2FuaXRpemVyKGNvbnRleHQsIGRpcmVjdGl2ZUluZGV4KTtcbiAgICAgIHNldFNhbml0aXplRmxhZyhjb250ZXh0LCBzaW5nbGVJbmRleCwgKHNhbml0aXplciAmJiBzYW5pdGl6ZXIocHJvcCkpID8gdHJ1ZSA6IGZhbHNlKTtcbiAgICB9XG5cbiAgICAvLyB0aGUgdmFsdWUgd2lsbCBhbHdheXMgZ2V0IHVwZGF0ZWQgKGV2ZW4gaWYgdGhlIGRpcnR5IGZsYWcgaXMgc2tpcHBlZClcbiAgICBzZXRWYWx1ZShjb250ZXh0LCBzaW5nbGVJbmRleCwgdmFsdWUpO1xuICAgIGNvbnN0IGluZGV4Rm9yTXVsdGkgPSBnZXRNdWx0aU9yU2luZ2xlSW5kZXgoY3VyckZsYWcpO1xuXG4gICAgLy8gaWYgdGhlIHZhbHVlIGlzIHRoZSBzYW1lIGluIHRoZSBtdWx0aS1hcmVhIHRoZW4gdGhlcmUncyBubyBwb2ludCBpbiByZS1hc3NlbWJsaW5nXG4gICAgY29uc3QgdmFsdWVGb3JNdWx0aSA9IGdldFZhbHVlKGNvbnRleHQsIGluZGV4Rm9yTXVsdGkpO1xuICAgIGlmICghdmFsdWVGb3JNdWx0aSB8fCBoYXNWYWx1ZUNoYW5nZWQoY3VyckZsYWcsIHZhbHVlRm9yTXVsdGksIHZhbHVlKSkge1xuICAgICAgbGV0IG11bHRpRGlydHkgPSBmYWxzZTtcbiAgICAgIGxldCBzaW5nbGVEaXJ0eSA9IHRydWU7XG5cbiAgICAgIC8vIG9ubHkgd2hlbiB0aGUgdmFsdWUgaXMgc2V0IHRvIGBudWxsYCBzaG91bGQgdGhlIG11bHRpLXZhbHVlIGdldCBmbGFnZ2VkXG4gICAgICBpZiAoIXZhbHVlRXhpc3RzKHZhbHVlLCBpc0NsYXNzQmFzZWQpICYmIHZhbHVlRXhpc3RzKHZhbHVlRm9yTXVsdGksIGlzQ2xhc3NCYXNlZCkpIHtcbiAgICAgICAgbXVsdGlEaXJ0eSA9IHRydWU7XG4gICAgICAgIHNpbmdsZURpcnR5ID0gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIHNldERpcnR5KGNvbnRleHQsIGluZGV4Rm9yTXVsdGksIG11bHRpRGlydHkpO1xuICAgICAgc2V0RGlydHkoY29udGV4dCwgc2luZ2xlSW5kZXgsIHNpbmdsZURpcnR5KTtcbiAgICAgIHNldENvbnRleHREaXJ0eShjb250ZXh0LCB0cnVlKTtcbiAgICB9XG5cbiAgICBpZiAocGxheWVyQnVpbGRlcnNBcmVEaXJ0eSkge1xuICAgICAgc2V0Q29udGV4dFBsYXllcnNEaXJ0eShjb250ZXh0LCB0cnVlKTtcbiAgICB9XG4gIH1cbn1cblxuXG4vKipcbiAqIFJlbmRlcnMgYWxsIHF1ZXVlZCBzdHlsaW5nIHVzaW5nIGEgcmVuZGVyZXIgb250byB0aGUgZ2l2ZW4gZWxlbWVudC5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIHdvcmtzIGJ5IHJlbmRlcmluZyBhbnkgc3R5bGVzICh0aGF0IGhhdmUgYmVlbiBhcHBsaWVkXG4gKiB1c2luZyBgdXBkYXRlU3R5bGluZ01hcGApIGFuZCBhbnkgY2xhc3NlcyAodGhhdCBoYXZlIGJlZW4gYXBwbGllZCB1c2luZ1xuICogYHVwZGF0ZVN0eWxlUHJvcGApIG9udG8gdGhlIHByb3ZpZGVkIGVsZW1lbnQgdXNpbmcgdGhlIHByb3ZpZGVkIHJlbmRlcmVyLlxuICogSnVzdCBiZWZvcmUgdGhlIHN0eWxlcy9jbGFzc2VzIGFyZSByZW5kZXJlZCBhIGZpbmFsIGtleS92YWx1ZSBzdHlsZSBtYXBcbiAqIHdpbGwgYmUgYXNzZW1ibGVkIChpZiBgc3R5bGVTdG9yZWAgb3IgYGNsYXNzU3RvcmVgIGFyZSBwcm92aWRlZCkuXG4gKlxuICogQHBhcmFtIGxFbGVtZW50IHRoZSBlbGVtZW50IHRoYXQgdGhlIHN0eWxlcyB3aWxsIGJlIHJlbmRlcmVkIG9uXG4gKiBAcGFyYW0gY29udGV4dCBUaGUgc3R5bGluZyBjb250ZXh0IHRoYXQgd2lsbCBiZSB1c2VkIHRvIGRldGVybWluZVxuICogICAgICB3aGF0IHN0eWxlcyB3aWxsIGJlIHJlbmRlcmVkXG4gKiBAcGFyYW0gcmVuZGVyZXIgdGhlIHJlbmRlcmVyIHRoYXQgd2lsbCBiZSB1c2VkIHRvIGFwcGx5IHRoZSBzdHlsaW5nXG4gKiBAcGFyYW0gY2xhc3Nlc1N0b3JlIGlmIHByb3ZpZGVkLCB0aGUgdXBkYXRlZCBjbGFzcyB2YWx1ZXMgd2lsbCBiZSBhcHBsaWVkXG4gKiAgICB0byB0aGlzIGtleS92YWx1ZSBtYXAgaW5zdGVhZCBvZiBiZWluZyByZW5kZXJlcmVkIHZpYSB0aGUgcmVuZGVyZXIuXG4gKiBAcGFyYW0gc3R5bGVzU3RvcmUgaWYgcHJvdmlkZWQsIHRoZSB1cGRhdGVkIHN0eWxlIHZhbHVlcyB3aWxsIGJlIGFwcGxpZWRcbiAqICAgIHRvIHRoaXMga2V5L3ZhbHVlIG1hcCBpbnN0ZWFkIG9mIGJlaW5nIHJlbmRlcmVyZWQgdmlhIHRoZSByZW5kZXJlci5cbiAqIEByZXR1cm5zIG51bWJlciB0aGUgdG90YWwgYW1vdW50IG9mIHBsYXllcnMgdGhhdCBnb3QgcXVldWVkIGZvciBhbmltYXRpb24gKGlmIGFueSlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlbmRlclN0eWxpbmcoXG4gICAgY29udGV4dDogU3R5bGluZ0NvbnRleHQsIHJlbmRlcmVyOiBSZW5kZXJlcjMgfCBudWxsLCByb290T3JWaWV3OiBSb290Q29udGV4dCB8IExWaWV3LFxuICAgIGlzRmlyc3RSZW5kZXI6IGJvb2xlYW4sIGNsYXNzZXNTdG9yZT86IEJpbmRpbmdTdG9yZSB8IG51bGwsIHN0eWxlc1N0b3JlPzogQmluZGluZ1N0b3JlIHwgbnVsbCxcbiAgICBkaXJlY3RpdmVJbmRleDogbnVtYmVyID0gMCk6IG51bWJlciB7XG4gIGxldCB0b3RhbFBsYXllcnNRdWV1ZWQgPSAwO1xuXG4gIC8vIHRoaXMgcHJldmVudHMgbXVsdGlwbGUgYXR0ZW1wdHMgdG8gcmVuZGVyIHN0eWxlL2NsYXNzIHZhbHVlcyBvblxuICAvLyB0aGUgc2FtZSBlbGVtZW50Li4uXG4gIGlmIChhbGxvd0hvc3RJbnN0cnVjdGlvbnNRdWV1ZUZsdXNoKGNvbnRleHQsIGRpcmVjdGl2ZUluZGV4KSkge1xuICAgIC8vIGFsbCBzdHlsaW5nIGluc3RydWN0aW9ucyBwcmVzZW50IHdpdGhpbiBhbnkgaG9zdEJpbmRpbmdzIGZ1bmN0aW9uc1xuICAgIC8vIGRvIG5vdCB1cGRhdGUgdGhlIGNvbnRleHQgaW1tZWRpYXRlbHkgd2hlbiBjYWxsZWQuIFRoZXkgYXJlIGluc3RlYWRcbiAgICAvLyBxdWV1ZWQgdXAgYW5kIGFwcGxpZWQgdG8gdGhlIGNvbnRleHQgcmlnaHQgYXQgdGhpcyBwb2ludC4gV2h5PyBUaGlzXG4gICAgLy8gaXMgYmVjYXVzZSBBbmd1bGFyIGV2YWx1YXRlcyBjb21wb25lbnQvZGlyZWN0aXZlIGFuZCBkaXJlY3RpdmVcbiAgICAvLyBzdWItY2xhc3MgY29kZSBhdCBkaWZmZXJlbnQgcG9pbnRzIGFuZCBpdCdzIGltcG9ydGFudCB0aGF0IHRoZVxuICAgIC8vIHN0eWxpbmcgdmFsdWVzIGFyZSBhcHBsaWVkIHRvIHRoZSBjb250ZXh0IGluIHRoZSByaWdodCBvcmRlclxuICAgIC8vIChzZWUgYGludGVyZmFjZXMvc3R5bGluZy50c2AgZm9yIG1vcmUgaW5mb3JtYXRpb24pLlxuICAgIGZsdXNoSG9zdEluc3RydWN0aW9uc1F1ZXVlKGNvbnRleHQpO1xuXG4gICAgaWYgKGlzQ29udGV4dERpcnR5KGNvbnRleHQpKSB7XG4gICAgICAvLyB0aGlzIGlzIGhlcmUgdG8gcHJldmVudCB0aGluZ3MgbGlrZSA8bmctY29udGFpbmVyIFtzdHlsZV0gW2NsYXNzXT4uLi48L25nLWNvbnRhaW5lcj5cbiAgICAgIC8vIG9yIGlmIHRoZXJlIGFyZSBhbnkgaG9zdCBzdHlsZSBvciBjbGFzcyBiaW5kaW5ncyBwcmVzZW50IGluIGEgZGlyZWN0aXZlIHNldCBvblxuICAgICAgLy8gYSBjb250YWluZXIgbm9kZVxuICAgICAgY29uc3QgbmF0aXZlID0gY29udGV4dFtTdHlsaW5nSW5kZXguRWxlbWVudFBvc2l0aW9uXSAhYXMgSFRNTEVsZW1lbnQ7XG5cbiAgICAgIGNvbnN0IGZsdXNoUGxheWVyQnVpbGRlcnM6IGFueSA9XG4gICAgICAgICAgY29udGV4dFtTdHlsaW5nSW5kZXguTWFzdGVyRmxhZ1Bvc2l0aW9uXSAmIFN0eWxpbmdGbGFncy5QbGF5ZXJCdWlsZGVyc0RpcnR5O1xuICAgICAgY29uc3QgbXVsdGlTdGFydEluZGV4ID0gZ2V0TXVsdGlTdHlsZXNTdGFydEluZGV4KGNvbnRleHQpO1xuXG4gICAgICBmb3IgKGxldCBpID0gU3R5bGluZ0luZGV4LlNpbmdsZVN0eWxlc1N0YXJ0UG9zaXRpb247IGkgPCBjb250ZXh0Lmxlbmd0aDtcbiAgICAgICAgICAgaSArPSBTdHlsaW5nSW5kZXguU2l6ZSkge1xuICAgICAgICAvLyB0aGVyZSBpcyBubyBwb2ludCBpbiByZW5kZXJpbmcgc3R5bGVzIHRoYXQgaGF2ZSBub3QgY2hhbmdlZCBvbiBzY3JlZW5cbiAgICAgICAgaWYgKGlzRGlydHkoY29udGV4dCwgaSkpIHtcbiAgICAgICAgICBjb25zdCBmbGFnID0gZ2V0UG9pbnRlcnMoY29udGV4dCwgaSk7XG4gICAgICAgICAgY29uc3QgZGlyZWN0aXZlSW5kZXggPSBnZXREaXJlY3RpdmVJbmRleEZyb21FbnRyeShjb250ZXh0LCBpKTtcbiAgICAgICAgICBjb25zdCBwcm9wID0gZ2V0UHJvcChjb250ZXh0LCBpKTtcbiAgICAgICAgICBjb25zdCB2YWx1ZSA9IGdldFZhbHVlKGNvbnRleHQsIGkpO1xuICAgICAgICAgIGNvbnN0IHN0eWxlU2FuaXRpemVyID1cbiAgICAgICAgICAgICAgKGZsYWcgJiBTdHlsaW5nRmxhZ3MuU2FuaXRpemUpID8gZ2V0U3R5bGVTYW5pdGl6ZXIoY29udGV4dCwgZGlyZWN0aXZlSW5kZXgpIDogbnVsbDtcbiAgICAgICAgICBjb25zdCBwbGF5ZXJCdWlsZGVyID0gZ2V0UGxheWVyQnVpbGRlcihjb250ZXh0LCBpKTtcbiAgICAgICAgICBjb25zdCBpc0NsYXNzQmFzZWQgPSBmbGFnICYgU3R5bGluZ0ZsYWdzLkNsYXNzID8gdHJ1ZSA6IGZhbHNlO1xuICAgICAgICAgIGNvbnN0IGlzSW5TaW5nbGVSZWdpb24gPSBpIDwgbXVsdGlTdGFydEluZGV4O1xuXG4gICAgICAgICAgbGV0IHZhbHVlVG9BcHBseTogc3RyaW5nfGJvb2xlYW58bnVsbCA9IHZhbHVlO1xuXG4gICAgICAgICAgLy8gVkFMVUUgREVGRVIgQ0FTRSAxOiBVc2UgYSBtdWx0aSB2YWx1ZSBpbnN0ZWFkIG9mIGEgbnVsbCBzaW5nbGUgdmFsdWVcbiAgICAgICAgICAvLyB0aGlzIGNoZWNrIGltcGxpZXMgdGhhdCBhIHNpbmdsZSB2YWx1ZSB3YXMgcmVtb3ZlZCBhbmQgd2VcbiAgICAgICAgICAvLyBzaG91bGQgbm93IGRlZmVyIHRvIGEgbXVsdGkgdmFsdWUgYW5kIHVzZSB0aGF0IChpZiBzZXQpLlxuICAgICAgICAgIGlmIChpc0luU2luZ2xlUmVnaW9uICYmICF2YWx1ZUV4aXN0cyh2YWx1ZVRvQXBwbHksIGlzQ2xhc3NCYXNlZCkpIHtcbiAgICAgICAgICAgIC8vIHNpbmdsZSB2YWx1ZXMgQUxXQVlTIGhhdmUgYSByZWZlcmVuY2UgdG8gYSBtdWx0aSBpbmRleFxuICAgICAgICAgICAgY29uc3QgbXVsdGlJbmRleCA9IGdldE11bHRpT3JTaW5nbGVJbmRleChmbGFnKTtcbiAgICAgICAgICAgIHZhbHVlVG9BcHBseSA9IGdldFZhbHVlKGNvbnRleHQsIG11bHRpSW5kZXgpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIFZBTFVFIERFRkVSIENBU0UgMjogVXNlIHRoZSBpbml0aWFsIHZhbHVlIGlmIGFsbCBlbHNlIGZhaWxzIChpcyBmYWxzeSlcbiAgICAgICAgICAvLyB0aGUgaW5pdGlhbCB2YWx1ZSB3aWxsIGFsd2F5cyBiZSBhIHN0cmluZyBvciBudWxsLFxuICAgICAgICAgIC8vIHRoZXJlZm9yZSB3ZSBjYW4gc2FmZWx5IGFkb3B0IGl0IGluIGNhc2UgdGhlcmUncyBub3RoaW5nIGVsc2VcbiAgICAgICAgICAvLyBub3RlIHRoYXQgdGhpcyBzaG91bGQgYWx3YXlzIGJlIGEgZmFsc3kgY2hlY2sgc2luY2UgYGZhbHNlYCBpcyB1c2VkXG4gICAgICAgICAgLy8gZm9yIGJvdGggY2xhc3MgYW5kIHN0eWxlIGNvbXBhcmlzb25zIChzdHlsZXMgY2FuJ3QgYmUgZmFsc2UgYW5kIGZhbHNlXG4gICAgICAgICAgLy8gY2xhc3NlcyBhcmUgdHVybmVkIG9mZiBhbmQgc2hvdWxkIHRoZXJlZm9yZSBkZWZlciB0byB0aGVpciBpbml0aWFsIHZhbHVlcylcbiAgICAgICAgICAvLyBOb3RlIHRoYXQgd2UgaWdub3JlIGNsYXNzLWJhc2VkIGRlZmVyYWxzIGJlY2F1c2Ugb3RoZXJ3aXNlIGEgY2xhc3MgY2FuIG5ldmVyXG4gICAgICAgICAgLy8gYmUgcmVtb3ZlZCBpbiB0aGUgY2FzZSB0aGF0IGl0IGV4aXN0cyBhcyB0cnVlIGluIHRoZSBpbml0aWFsIGNsYXNzZXMgbGlzdC4uLlxuICAgICAgICAgIGlmICghdmFsdWVFeGlzdHModmFsdWVUb0FwcGx5LCBpc0NsYXNzQmFzZWQpKSB7XG4gICAgICAgICAgICB2YWx1ZVRvQXBwbHkgPSBnZXRJbml0aWFsVmFsdWUoY29udGV4dCwgZmxhZyk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gaWYgdGhlIGZpcnN0IHJlbmRlciBpcyB0cnVlIHRoZW4gd2UgZG8gbm90IHdhbnQgdG8gc3RhcnQgYXBwbHlpbmcgZmFsc3lcbiAgICAgICAgICAvLyB2YWx1ZXMgdG8gdGhlIERPTSBlbGVtZW50J3Mgc3R5bGluZy4gT3RoZXJ3aXNlIHRoZW4gd2Uga25vdyB0aGVyZSBoYXNcbiAgICAgICAgICAvLyBiZWVuIGEgY2hhbmdlIGFuZCBldmVuIGlmIGl0J3MgZmFsc3kgdGhlbiBpdCdzIHJlbW92aW5nIHNvbWV0aGluZyB0aGF0XG4gICAgICAgICAgLy8gd2FzIHRydXRoeSBiZWZvcmUuXG4gICAgICAgICAgY29uc3QgZG9BcHBseVZhbHVlID0gcmVuZGVyZXIgJiYgKGlzRmlyc3RSZW5kZXIgPyB2YWx1ZVRvQXBwbHkgOiB0cnVlKTtcbiAgICAgICAgICBpZiAoZG9BcHBseVZhbHVlKSB7XG4gICAgICAgICAgICBpZiAoaXNDbGFzc0Jhc2VkKSB7XG4gICAgICAgICAgICAgIHNldENsYXNzKFxuICAgICAgICAgICAgICAgICAgbmF0aXZlLCBwcm9wLCB2YWx1ZVRvQXBwbHkgPyB0cnVlIDogZmFsc2UsIHJlbmRlcmVyICEsIGNsYXNzZXNTdG9yZSxcbiAgICAgICAgICAgICAgICAgIHBsYXllckJ1aWxkZXIpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgc2V0U3R5bGUoXG4gICAgICAgICAgICAgICAgICBuYXRpdmUsIHByb3AsIHZhbHVlVG9BcHBseSBhcyBzdHJpbmcgfCBudWxsLCByZW5kZXJlciAhLCBzdHlsZVNhbml0aXplcixcbiAgICAgICAgICAgICAgICAgIHN0eWxlc1N0b3JlLCBwbGF5ZXJCdWlsZGVyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgICBzZXREaXJ0eShjb250ZXh0LCBpLCBmYWxzZSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKGZsdXNoUGxheWVyQnVpbGRlcnMpIHtcbiAgICAgICAgY29uc3Qgcm9vdENvbnRleHQgPVxuICAgICAgICAgICAgQXJyYXkuaXNBcnJheShyb290T3JWaWV3KSA/IGdldFJvb3RDb250ZXh0KHJvb3RPclZpZXcpIDogcm9vdE9yVmlldyBhcyBSb290Q29udGV4dDtcbiAgICAgICAgY29uc3QgcGxheWVyQ29udGV4dCA9IGdldFBsYXllckNvbnRleHQoY29udGV4dCkgITtcbiAgICAgICAgY29uc3QgcGxheWVyc1N0YXJ0SW5kZXggPSBwbGF5ZXJDb250ZXh0W1BsYXllckluZGV4Lk5vbkJ1aWxkZXJQbGF5ZXJzU3RhcnRdO1xuICAgICAgICBmb3IgKGxldCBpID0gUGxheWVySW5kZXguUGxheWVyQnVpbGRlcnNTdGFydFBvc2l0aW9uOyBpIDwgcGxheWVyc1N0YXJ0SW5kZXg7XG4gICAgICAgICAgICAgaSArPSBQbGF5ZXJJbmRleC5QbGF5ZXJBbmRQbGF5ZXJCdWlsZGVyc1R1cGxlU2l6ZSkge1xuICAgICAgICAgIGNvbnN0IGJ1aWxkZXIgPSBwbGF5ZXJDb250ZXh0W2ldIGFzIENsYXNzQW5kU3R5bGVQbGF5ZXJCdWlsZGVyPGFueT58IG51bGw7XG4gICAgICAgICAgY29uc3QgcGxheWVySW5zZXJ0aW9uSW5kZXggPSBpICsgUGxheWVySW5kZXguUGxheWVyT2Zmc2V0UG9zaXRpb247XG4gICAgICAgICAgY29uc3Qgb2xkUGxheWVyID0gcGxheWVyQ29udGV4dFtwbGF5ZXJJbnNlcnRpb25JbmRleF0gYXMgUGxheWVyIHwgbnVsbDtcbiAgICAgICAgICBpZiAoYnVpbGRlcikge1xuICAgICAgICAgICAgY29uc3QgcGxheWVyID0gYnVpbGRlci5idWlsZFBsYXllcihvbGRQbGF5ZXIsIGlzRmlyc3RSZW5kZXIpO1xuICAgICAgICAgICAgaWYgKHBsYXllciAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgIGlmIChwbGF5ZXIgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHdhc1F1ZXVlZCA9IGFkZFBsYXllckludGVybmFsKFxuICAgICAgICAgICAgICAgICAgICBwbGF5ZXJDb250ZXh0LCByb290Q29udGV4dCwgbmF0aXZlIGFzIEhUTUxFbGVtZW50LCBwbGF5ZXIsXG4gICAgICAgICAgICAgICAgICAgIHBsYXllckluc2VydGlvbkluZGV4KTtcbiAgICAgICAgICAgICAgICB3YXNRdWV1ZWQgJiYgdG90YWxQbGF5ZXJzUXVldWVkKys7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgaWYgKG9sZFBsYXllcikge1xuICAgICAgICAgICAgICAgIG9sZFBsYXllci5kZXN0cm95KCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2UgaWYgKG9sZFBsYXllcikge1xuICAgICAgICAgICAgLy8gdGhlIHBsYXllciBidWlsZGVyIGhhcyBiZWVuIHJlbW92ZWQgLi4uIHRoZXJlZm9yZSB3ZSBzaG91bGQgZGVsZXRlIHRoZSBhc3NvY2lhdGVkXG4gICAgICAgICAgICAvLyBwbGF5ZXJcbiAgICAgICAgICAgIG9sZFBsYXllci5kZXN0cm95KCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHNldENvbnRleHRQbGF5ZXJzRGlydHkoY29udGV4dCwgZmFsc2UpO1xuICAgICAgfVxuXG4gICAgICBzZXRDb250ZXh0RGlydHkoY29udGV4dCwgZmFsc2UpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiB0b3RhbFBsYXllcnNRdWV1ZWQ7XG59XG5cbi8qKlxuICogQXNzaWducyBhIHN0eWxlIHZhbHVlIHRvIGEgc3R5bGUgcHJvcGVydHkgZm9yIHRoZSBnaXZlbiBlbGVtZW50LlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gcmVuZGVycyBhIGdpdmVuIENTUyBwcm9wL3ZhbHVlIGVudHJ5IHVzaW5nIHRoZVxuICogcHJvdmlkZWQgcmVuZGVyZXIuIElmIGEgYHN0b3JlYCB2YWx1ZSBpcyBwcm92aWRlZCB0aGVuXG4gKiB0aGF0IHdpbGwgYmUgdXNlZCBhIHJlbmRlciBjb250ZXh0IGluc3RlYWQgb2YgdGhlIHByb3ZpZGVkXG4gKiByZW5kZXJlci5cbiAqXG4gKiBAcGFyYW0gbmF0aXZlIHRoZSBET00gRWxlbWVudFxuICogQHBhcmFtIHByb3AgdGhlIENTUyBzdHlsZSBwcm9wZXJ0eSB0aGF0IHdpbGwgYmUgcmVuZGVyZWRcbiAqIEBwYXJhbSB2YWx1ZSB0aGUgQ1NTIHN0eWxlIHZhbHVlIHRoYXQgd2lsbCBiZSByZW5kZXJlZFxuICogQHBhcmFtIHJlbmRlcmVyXG4gKiBAcGFyYW0gc3RvcmUgYW4gb3B0aW9uYWwga2V5L3ZhbHVlIG1hcCB0aGF0IHdpbGwgYmUgdXNlZCBhcyBhIGNvbnRleHQgdG8gcmVuZGVyIHN0eWxlcyBvblxuICovXG5leHBvcnQgZnVuY3Rpb24gc2V0U3R5bGUoXG4gICAgbmF0aXZlOiBhbnksIHByb3A6IHN0cmluZywgdmFsdWU6IHN0cmluZyB8IG51bGwsIHJlbmRlcmVyOiBSZW5kZXJlcjMsXG4gICAgc2FuaXRpemVyOiBTdHlsZVNhbml0aXplRm4gfCBudWxsLCBzdG9yZT86IEJpbmRpbmdTdG9yZSB8IG51bGwsXG4gICAgcGxheWVyQnVpbGRlcj86IENsYXNzQW5kU3R5bGVQbGF5ZXJCdWlsZGVyPGFueT58IG51bGwpIHtcbiAgdmFsdWUgPSBzYW5pdGl6ZXIgJiYgdmFsdWUgPyBzYW5pdGl6ZXIocHJvcCwgdmFsdWUpIDogdmFsdWU7XG4gIGlmIChzdG9yZSB8fCBwbGF5ZXJCdWlsZGVyKSB7XG4gICAgaWYgKHN0b3JlKSB7XG4gICAgICBzdG9yZS5zZXRWYWx1ZShwcm9wLCB2YWx1ZSk7XG4gICAgfVxuICAgIGlmIChwbGF5ZXJCdWlsZGVyKSB7XG4gICAgICBwbGF5ZXJCdWlsZGVyLnNldFZhbHVlKHByb3AsIHZhbHVlKTtcbiAgICB9XG4gIH0gZWxzZSBpZiAodmFsdWUpIHtcbiAgICB2YWx1ZSA9IHZhbHVlLnRvU3RyaW5nKCk7ICAvLyBvcGFjaXR5LCB6LWluZGV4IGFuZCBmbGV4Ym94IGFsbCBoYXZlIG51bWJlciB2YWx1ZXMgd2hpY2ggbWF5IG5vdFxuICAgIC8vIGFzc2lnbiBhcyBudW1iZXJzXG4gICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlclNldFN0eWxlKys7XG4gICAgaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpID9cbiAgICAgICAgcmVuZGVyZXIuc2V0U3R5bGUobmF0aXZlLCBwcm9wLCB2YWx1ZSwgUmVuZGVyZXJTdHlsZUZsYWdzMy5EYXNoQ2FzZSkgOlxuICAgICAgICBuYXRpdmUuc3R5bGUuc2V0UHJvcGVydHkocHJvcCwgdmFsdWUpO1xuICB9IGVsc2Uge1xuICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJSZW1vdmVTdHlsZSsrO1xuICAgIGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSA/XG4gICAgICAgIHJlbmRlcmVyLnJlbW92ZVN0eWxlKG5hdGl2ZSwgcHJvcCwgUmVuZGVyZXJTdHlsZUZsYWdzMy5EYXNoQ2FzZSkgOlxuICAgICAgICBuYXRpdmUuc3R5bGUucmVtb3ZlUHJvcGVydHkocHJvcCk7XG4gIH1cbn1cblxuLyoqXG4gKiBBZGRzL3JlbW92ZXMgdGhlIHByb3ZpZGVkIGNsYXNzTmFtZSB2YWx1ZSB0byB0aGUgcHJvdmlkZWQgZWxlbWVudC5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIHJlbmRlcnMgYSBnaXZlbiBDU1MgY2xhc3MgdmFsdWUgdXNpbmcgdGhlIHByb3ZpZGVkXG4gKiByZW5kZXJlciAoYnkgYWRkaW5nIG9yIHJlbW92aW5nIGl0IGZyb20gdGhlIHByb3ZpZGVkIGVsZW1lbnQpLlxuICogSWYgYSBgc3RvcmVgIHZhbHVlIGlzIHByb3ZpZGVkIHRoZW4gdGhhdCB3aWxsIGJlIHVzZWQgYSByZW5kZXJcbiAqIGNvbnRleHQgaW5zdGVhZCBvZiB0aGUgcHJvdmlkZWQgcmVuZGVyZXIuXG4gKlxuICogQHBhcmFtIG5hdGl2ZSB0aGUgRE9NIEVsZW1lbnRcbiAqIEBwYXJhbSBwcm9wIHRoZSBDU1Mgc3R5bGUgcHJvcGVydHkgdGhhdCB3aWxsIGJlIHJlbmRlcmVkXG4gKiBAcGFyYW0gdmFsdWUgdGhlIENTUyBzdHlsZSB2YWx1ZSB0aGF0IHdpbGwgYmUgcmVuZGVyZWRcbiAqIEBwYXJhbSByZW5kZXJlclxuICogQHBhcmFtIHN0b3JlIGFuIG9wdGlvbmFsIGtleS92YWx1ZSBtYXAgdGhhdCB3aWxsIGJlIHVzZWQgYXMgYSBjb250ZXh0IHRvIHJlbmRlciBzdHlsZXMgb25cbiAqL1xuZnVuY3Rpb24gc2V0Q2xhc3MoXG4gICAgbmF0aXZlOiBhbnksIGNsYXNzTmFtZTogc3RyaW5nLCBhZGQ6IGJvb2xlYW4sIHJlbmRlcmVyOiBSZW5kZXJlcjMsIHN0b3JlPzogQmluZGluZ1N0b3JlIHwgbnVsbCxcbiAgICBwbGF5ZXJCdWlsZGVyPzogQ2xhc3NBbmRTdHlsZVBsYXllckJ1aWxkZXI8YW55PnwgbnVsbCkge1xuICBpZiAoc3RvcmUgfHwgcGxheWVyQnVpbGRlcikge1xuICAgIGlmIChzdG9yZSkge1xuICAgICAgc3RvcmUuc2V0VmFsdWUoY2xhc3NOYW1lLCBhZGQpO1xuICAgIH1cbiAgICBpZiAocGxheWVyQnVpbGRlcikge1xuICAgICAgcGxheWVyQnVpbGRlci5zZXRWYWx1ZShjbGFzc05hbWUsIGFkZCk7XG4gICAgfVxuICAgIC8vIERPTVRva2VuTGlzdCB3aWxsIHRocm93IGlmIHdlIHRyeSB0byBhZGQgb3IgcmVtb3ZlIGFuIGVtcHR5IHN0cmluZy5cbiAgfSBlbHNlIGlmIChjbGFzc05hbWUgIT09ICcnKSB7XG4gICAgaWYgKGFkZCkge1xuICAgICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlckFkZENsYXNzKys7XG4gICAgICBpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikgPyByZW5kZXJlci5hZGRDbGFzcyhuYXRpdmUsIGNsYXNzTmFtZSkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmF0aXZlWydjbGFzc0xpc3QnXS5hZGQoY2xhc3NOYW1lKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlclJlbW92ZUNsYXNzKys7XG4gICAgICBpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikgPyByZW5kZXJlci5yZW1vdmVDbGFzcyhuYXRpdmUsIGNsYXNzTmFtZSkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmF0aXZlWydjbGFzc0xpc3QnXS5yZW1vdmUoY2xhc3NOYW1lKTtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gc2V0U2FuaXRpemVGbGFnKGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBpbmRleDogbnVtYmVyLCBzYW5pdGl6ZVllczogYm9vbGVhbikge1xuICBpZiAoc2FuaXRpemVZZXMpIHtcbiAgICAoY29udGV4dFtpbmRleF0gYXMgbnVtYmVyKSB8PSBTdHlsaW5nRmxhZ3MuU2FuaXRpemU7XG4gIH0gZWxzZSB7XG4gICAgKGNvbnRleHRbaW5kZXhdIGFzIG51bWJlcikgJj0gflN0eWxpbmdGbGFncy5TYW5pdGl6ZTtcbiAgfVxufVxuXG5mdW5jdGlvbiBzZXREaXJ0eShjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgaW5kZXg6IG51bWJlciwgaXNEaXJ0eVllczogYm9vbGVhbikge1xuICBjb25zdCBhZGp1c3RlZEluZGV4ID1cbiAgICAgIGluZGV4ID49IFN0eWxpbmdJbmRleC5TaW5nbGVTdHlsZXNTdGFydFBvc2l0aW9uID8gKGluZGV4ICsgU3R5bGluZ0luZGV4LkZsYWdzT2Zmc2V0KSA6IGluZGV4O1xuICBpZiAoaXNEaXJ0eVllcykge1xuICAgIChjb250ZXh0W2FkanVzdGVkSW5kZXhdIGFzIG51bWJlcikgfD0gU3R5bGluZ0ZsYWdzLkRpcnR5O1xuICB9IGVsc2Uge1xuICAgIChjb250ZXh0W2FkanVzdGVkSW5kZXhdIGFzIG51bWJlcikgJj0gflN0eWxpbmdGbGFncy5EaXJ0eTtcbiAgfVxufVxuXG5mdW5jdGlvbiBpc0RpcnR5KGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBpbmRleDogbnVtYmVyKTogYm9vbGVhbiB7XG4gIGNvbnN0IGFkanVzdGVkSW5kZXggPVxuICAgICAgaW5kZXggPj0gU3R5bGluZ0luZGV4LlNpbmdsZVN0eWxlc1N0YXJ0UG9zaXRpb24gPyAoaW5kZXggKyBTdHlsaW5nSW5kZXguRmxhZ3NPZmZzZXQpIDogaW5kZXg7XG4gIHJldHVybiAoKGNvbnRleHRbYWRqdXN0ZWRJbmRleF0gYXMgbnVtYmVyKSAmIFN0eWxpbmdGbGFncy5EaXJ0eSkgPT0gU3R5bGluZ0ZsYWdzLkRpcnR5O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNDbGFzc0Jhc2VkVmFsdWUoY29udGV4dDogU3R5bGluZ0NvbnRleHQsIGluZGV4OiBudW1iZXIpOiBib29sZWFuIHtcbiAgY29uc3QgYWRqdXN0ZWRJbmRleCA9XG4gICAgICBpbmRleCA+PSBTdHlsaW5nSW5kZXguU2luZ2xlU3R5bGVzU3RhcnRQb3NpdGlvbiA/IChpbmRleCArIFN0eWxpbmdJbmRleC5GbGFnc09mZnNldCkgOiBpbmRleDtcbiAgcmV0dXJuICgoY29udGV4dFthZGp1c3RlZEluZGV4XSBhcyBudW1iZXIpICYgU3R5bGluZ0ZsYWdzLkNsYXNzKSA9PSBTdHlsaW5nRmxhZ3MuQ2xhc3M7XG59XG5cbmZ1bmN0aW9uIGlzU2FuaXRpemFibGUoY29udGV4dDogU3R5bGluZ0NvbnRleHQsIGluZGV4OiBudW1iZXIpOiBib29sZWFuIHtcbiAgY29uc3QgYWRqdXN0ZWRJbmRleCA9XG4gICAgICBpbmRleCA+PSBTdHlsaW5nSW5kZXguU2luZ2xlU3R5bGVzU3RhcnRQb3NpdGlvbiA/IChpbmRleCArIFN0eWxpbmdJbmRleC5GbGFnc09mZnNldCkgOiBpbmRleDtcbiAgcmV0dXJuICgoY29udGV4dFthZGp1c3RlZEluZGV4XSBhcyBudW1iZXIpICYgU3R5bGluZ0ZsYWdzLlNhbml0aXplKSA9PSBTdHlsaW5nRmxhZ3MuU2FuaXRpemU7XG59XG5cbmZ1bmN0aW9uIHBvaW50ZXJzKGNvbmZpZ0ZsYWc6IG51bWJlciwgc3RhdGljSW5kZXg6IG51bWJlciwgZHluYW1pY0luZGV4OiBudW1iZXIpIHtcbiAgcmV0dXJuIChjb25maWdGbGFnICYgU3R5bGluZ0ZsYWdzLkJpdE1hc2spIHwgKHN0YXRpY0luZGV4IDw8IFN0eWxpbmdGbGFncy5CaXRDb3VudFNpemUpIHxcbiAgICAgIChkeW5hbWljSW5kZXggPDwgKFN0eWxpbmdJbmRleC5CaXRDb3VudFNpemUgKyBTdHlsaW5nRmxhZ3MuQml0Q291bnRTaXplKSk7XG59XG5cbmZ1bmN0aW9uIGdldEluaXRpYWxWYWx1ZShjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgZmxhZzogbnVtYmVyKTogc3RyaW5nfGJvb2xlYW58bnVsbCB7XG4gIGNvbnN0IGluZGV4ID0gZ2V0SW5pdGlhbEluZGV4KGZsYWcpO1xuICBjb25zdCBlbnRyeUlzQ2xhc3NCYXNlZCA9IGZsYWcgJiBTdHlsaW5nRmxhZ3MuQ2xhc3M7XG4gIGNvbnN0IGluaXRpYWxWYWx1ZXMgPSBlbnRyeUlzQ2xhc3NCYXNlZCA/IGNvbnRleHRbU3R5bGluZ0luZGV4LkluaXRpYWxDbGFzc1ZhbHVlc1Bvc2l0aW9uXSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRleHRbU3R5bGluZ0luZGV4LkluaXRpYWxTdHlsZVZhbHVlc1Bvc2l0aW9uXTtcbiAgcmV0dXJuIGluaXRpYWxWYWx1ZXNbaW5kZXhdIGFzIHN0cmluZyB8IGJvb2xlYW4gfCBudWxsO1xufVxuXG5mdW5jdGlvbiBnZXRJbml0aWFsSW5kZXgoZmxhZzogbnVtYmVyKTogbnVtYmVyIHtcbiAgcmV0dXJuIChmbGFnID4+IFN0eWxpbmdGbGFncy5CaXRDb3VudFNpemUpICYgU3R5bGluZ0luZGV4LkJpdE1hc2s7XG59XG5cbmZ1bmN0aW9uIGdldE11bHRpT3JTaW5nbGVJbmRleChmbGFnOiBudW1iZXIpOiBudW1iZXIge1xuICBjb25zdCBpbmRleCA9XG4gICAgICAoZmxhZyA+PiAoU3R5bGluZ0luZGV4LkJpdENvdW50U2l6ZSArIFN0eWxpbmdGbGFncy5CaXRDb3VudFNpemUpKSAmIFN0eWxpbmdJbmRleC5CaXRNYXNrO1xuICByZXR1cm4gaW5kZXggPj0gU3R5bGluZ0luZGV4LlNpbmdsZVN0eWxlc1N0YXJ0UG9zaXRpb24gPyBpbmRleCA6IC0xO1xufVxuXG5mdW5jdGlvbiBnZXRNdWx0aVN0YXJ0SW5kZXgoY29udGV4dDogU3R5bGluZ0NvbnRleHQpOiBudW1iZXIge1xuICByZXR1cm4gZ2V0TXVsdGlPclNpbmdsZUluZGV4KGNvbnRleHRbU3R5bGluZ0luZGV4Lk1hc3RlckZsYWdQb3NpdGlvbl0pIGFzIG51bWJlcjtcbn1cblxuZnVuY3Rpb24gZ2V0TXVsdGlDbGFzc2VzU3RhcnRJbmRleChjb250ZXh0OiBTdHlsaW5nQ29udGV4dCk6IG51bWJlciB7XG4gIGNvbnN0IGNsYXNzQ2FjaGUgPSBjb250ZXh0W1N0eWxpbmdJbmRleC5DYWNoZWRNdWx0aUNsYXNzZXNdO1xuICByZXR1cm4gY2xhc3NDYWNoZVxuICAgICAgW01hcEJhc2VkT2Zmc2V0VmFsdWVzSW5kZXguVmFsdWVzU3RhcnRQb3NpdGlvbiArXG4gICAgICAgTWFwQmFzZWRPZmZzZXRWYWx1ZXNJbmRleC5Qb3NpdGlvblN0YXJ0T2Zmc2V0XTtcbn1cblxuZnVuY3Rpb24gZ2V0TXVsdGlTdHlsZXNTdGFydEluZGV4KGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0KTogbnVtYmVyIHtcbiAgY29uc3Qgc3R5bGVzQ2FjaGUgPSBjb250ZXh0W1N0eWxpbmdJbmRleC5DYWNoZWRNdWx0aVN0eWxlc107XG4gIHJldHVybiBzdHlsZXNDYWNoZVxuICAgICAgW01hcEJhc2VkT2Zmc2V0VmFsdWVzSW5kZXguVmFsdWVzU3RhcnRQb3NpdGlvbiArXG4gICAgICAgTWFwQmFzZWRPZmZzZXRWYWx1ZXNJbmRleC5Qb3NpdGlvblN0YXJ0T2Zmc2V0XTtcbn1cblxuZnVuY3Rpb24gc2V0UHJvcChjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgaW5kZXg6IG51bWJlciwgcHJvcDogc3RyaW5nKSB7XG4gIGNvbnRleHRbaW5kZXggKyBTdHlsaW5nSW5kZXguUHJvcGVydHlPZmZzZXRdID0gcHJvcDtcbn1cblxuZnVuY3Rpb24gc2V0VmFsdWUoY29udGV4dDogU3R5bGluZ0NvbnRleHQsIGluZGV4OiBudW1iZXIsIHZhbHVlOiBzdHJpbmcgfCBudWxsIHwgYm9vbGVhbikge1xuICBjb250ZXh0W2luZGV4ICsgU3R5bGluZ0luZGV4LlZhbHVlT2Zmc2V0XSA9IHZhbHVlO1xufVxuXG5mdW5jdGlvbiBoYXNQbGF5ZXJCdWlsZGVyQ2hhbmdlZChcbiAgICBjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgYnVpbGRlcjogQ2xhc3NBbmRTdHlsZVBsYXllckJ1aWxkZXI8YW55PnwgbnVsbCwgaW5kZXg6IG51bWJlcikge1xuICBjb25zdCBwbGF5ZXJDb250ZXh0ID0gY29udGV4dFtTdHlsaW5nSW5kZXguUGxheWVyQ29udGV4dF0gITtcbiAgaWYgKGJ1aWxkZXIpIHtcbiAgICBpZiAoIXBsYXllckNvbnRleHQgfHwgaW5kZXggPT09IDApIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfSBlbHNlIGlmICghcGxheWVyQ29udGV4dCkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICByZXR1cm4gcGxheWVyQ29udGV4dFtpbmRleF0gIT09IGJ1aWxkZXI7XG59XG5cbmZ1bmN0aW9uIHNldFBsYXllckJ1aWxkZXIoXG4gICAgY29udGV4dDogU3R5bGluZ0NvbnRleHQsIGJ1aWxkZXI6IENsYXNzQW5kU3R5bGVQbGF5ZXJCdWlsZGVyPGFueT58IG51bGwsXG4gICAgaW5zZXJ0aW9uSW5kZXg6IG51bWJlcik6IG51bWJlciB7XG4gIGxldCBwbGF5ZXJDb250ZXh0ID0gY29udGV4dFtTdHlsaW5nSW5kZXguUGxheWVyQ29udGV4dF0gfHwgYWxsb2NQbGF5ZXJDb250ZXh0KGNvbnRleHQpO1xuICBpZiAoaW5zZXJ0aW9uSW5kZXggPiAwKSB7XG4gICAgcGxheWVyQ29udGV4dFtpbnNlcnRpb25JbmRleF0gPSBidWlsZGVyO1xuICB9IGVsc2Uge1xuICAgIGluc2VydGlvbkluZGV4ID0gcGxheWVyQ29udGV4dFtQbGF5ZXJJbmRleC5Ob25CdWlsZGVyUGxheWVyc1N0YXJ0XTtcbiAgICBwbGF5ZXJDb250ZXh0LnNwbGljZShpbnNlcnRpb25JbmRleCwgMCwgYnVpbGRlciwgbnVsbCk7XG4gICAgcGxheWVyQ29udGV4dFtQbGF5ZXJJbmRleC5Ob25CdWlsZGVyUGxheWVyc1N0YXJ0XSArPVxuICAgICAgICBQbGF5ZXJJbmRleC5QbGF5ZXJBbmRQbGF5ZXJCdWlsZGVyc1R1cGxlU2l6ZTtcbiAgfVxuICByZXR1cm4gaW5zZXJ0aW9uSW5kZXg7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBkaXJlY3RpdmVPd25lclBvaW50ZXJzKGRpcmVjdGl2ZUluZGV4OiBudW1iZXIsIHBsYXllckluZGV4OiBudW1iZXIpIHtcbiAgcmV0dXJuIChwbGF5ZXJJbmRleCA8PCBEaXJlY3RpdmVPd25lckFuZFBsYXllckJ1aWxkZXJJbmRleC5CaXRDb3VudFNpemUpIHwgZGlyZWN0aXZlSW5kZXg7XG59XG5cbmZ1bmN0aW9uIHNldFBsYXllckJ1aWxkZXJJbmRleChcbiAgICBjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgaW5kZXg6IG51bWJlciwgcGxheWVyQnVpbGRlckluZGV4OiBudW1iZXIsIGRpcmVjdGl2ZUluZGV4OiBudW1iZXIpIHtcbiAgY29uc3QgdmFsdWUgPSBkaXJlY3RpdmVPd25lclBvaW50ZXJzKGRpcmVjdGl2ZUluZGV4LCBwbGF5ZXJCdWlsZGVySW5kZXgpO1xuICBjb250ZXh0W2luZGV4ICsgU3R5bGluZ0luZGV4LlBsYXllckJ1aWxkZXJJbmRleE9mZnNldF0gPSB2YWx1ZTtcbn1cblxuZnVuY3Rpb24gZ2V0UGxheWVyQnVpbGRlckluZGV4KGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBpbmRleDogbnVtYmVyKTogbnVtYmVyIHtcbiAgY29uc3QgZmxhZyA9IGNvbnRleHRbaW5kZXggKyBTdHlsaW5nSW5kZXguUGxheWVyQnVpbGRlckluZGV4T2Zmc2V0XSBhcyBudW1iZXI7XG4gIGNvbnN0IHBsYXllckJ1aWxkZXJJbmRleCA9IChmbGFnID4+IERpcmVjdGl2ZU93bmVyQW5kUGxheWVyQnVpbGRlckluZGV4LkJpdENvdW50U2l6ZSkgJlxuICAgICAgRGlyZWN0aXZlT3duZXJBbmRQbGF5ZXJCdWlsZGVySW5kZXguQml0TWFzaztcbiAgcmV0dXJuIHBsYXllckJ1aWxkZXJJbmRleDtcbn1cblxuZnVuY3Rpb24gZ2V0UGxheWVyQnVpbGRlcihjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgaW5kZXg6IG51bWJlcik6IENsYXNzQW5kU3R5bGVQbGF5ZXJCdWlsZGVyPGFueT58XG4gICAgbnVsbCB7XG4gIGNvbnN0IHBsYXllckJ1aWxkZXJJbmRleCA9IGdldFBsYXllckJ1aWxkZXJJbmRleChjb250ZXh0LCBpbmRleCk7XG4gIGlmIChwbGF5ZXJCdWlsZGVySW5kZXgpIHtcbiAgICBjb25zdCBwbGF5ZXJDb250ZXh0ID0gY29udGV4dFtTdHlsaW5nSW5kZXguUGxheWVyQ29udGV4dF07XG4gICAgaWYgKHBsYXllckNvbnRleHQpIHtcbiAgICAgIHJldHVybiBwbGF5ZXJDb250ZXh0W3BsYXllckJ1aWxkZXJJbmRleF0gYXMgQ2xhc3NBbmRTdHlsZVBsYXllckJ1aWxkZXI8YW55PnwgbnVsbDtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbmZ1bmN0aW9uIHNldEZsYWcoY29udGV4dDogU3R5bGluZ0NvbnRleHQsIGluZGV4OiBudW1iZXIsIGZsYWc6IG51bWJlcikge1xuICBjb25zdCBhZGp1c3RlZEluZGV4ID1cbiAgICAgIGluZGV4ID09PSBTdHlsaW5nSW5kZXguTWFzdGVyRmxhZ1Bvc2l0aW9uID8gaW5kZXggOiAoaW5kZXggKyBTdHlsaW5nSW5kZXguRmxhZ3NPZmZzZXQpO1xuICBjb250ZXh0W2FkanVzdGVkSW5kZXhdID0gZmxhZztcbn1cblxuZnVuY3Rpb24gZ2V0UG9pbnRlcnMoY29udGV4dDogU3R5bGluZ0NvbnRleHQsIGluZGV4OiBudW1iZXIpOiBudW1iZXIge1xuICBjb25zdCBhZGp1c3RlZEluZGV4ID1cbiAgICAgIGluZGV4ID09PSBTdHlsaW5nSW5kZXguTWFzdGVyRmxhZ1Bvc2l0aW9uID8gaW5kZXggOiAoaW5kZXggKyBTdHlsaW5nSW5kZXguRmxhZ3NPZmZzZXQpO1xuICByZXR1cm4gY29udGV4dFthZGp1c3RlZEluZGV4XSBhcyBudW1iZXI7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRWYWx1ZShjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgaW5kZXg6IG51bWJlcik6IHN0cmluZ3xib29sZWFufG51bGwge1xuICByZXR1cm4gY29udGV4dFtpbmRleCArIFN0eWxpbmdJbmRleC5WYWx1ZU9mZnNldF0gYXMgc3RyaW5nIHwgYm9vbGVhbiB8IG51bGw7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRQcm9wKGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBpbmRleDogbnVtYmVyKTogc3RyaW5nIHtcbiAgcmV0dXJuIGNvbnRleHRbaW5kZXggKyBTdHlsaW5nSW5kZXguUHJvcGVydHlPZmZzZXRdIGFzIHN0cmluZztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzQ29udGV4dERpcnR5KGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0KTogYm9vbGVhbiB7XG4gIHJldHVybiBpc0RpcnR5KGNvbnRleHQsIFN0eWxpbmdJbmRleC5NYXN0ZXJGbGFnUG9zaXRpb24pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2V0Q29udGV4dERpcnR5KGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBpc0RpcnR5WWVzOiBib29sZWFuKTogdm9pZCB7XG4gIHNldERpcnR5KGNvbnRleHQsIFN0eWxpbmdJbmRleC5NYXN0ZXJGbGFnUG9zaXRpb24sIGlzRGlydHlZZXMpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2V0Q29udGV4dFBsYXllcnNEaXJ0eShjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgaXNEaXJ0eVllczogYm9vbGVhbik6IHZvaWQge1xuICBpZiAoaXNEaXJ0eVllcykge1xuICAgIChjb250ZXh0W1N0eWxpbmdJbmRleC5NYXN0ZXJGbGFnUG9zaXRpb25dIGFzIG51bWJlcikgfD0gU3R5bGluZ0ZsYWdzLlBsYXllckJ1aWxkZXJzRGlydHk7XG4gIH0gZWxzZSB7XG4gICAgKGNvbnRleHRbU3R5bGluZ0luZGV4Lk1hc3RlckZsYWdQb3NpdGlvbl0gYXMgbnVtYmVyKSAmPSB+U3R5bGluZ0ZsYWdzLlBsYXllckJ1aWxkZXJzRGlydHk7XG4gIH1cbn1cblxuZnVuY3Rpb24gc3dhcE11bHRpQ29udGV4dEVudHJpZXMoY29udGV4dDogU3R5bGluZ0NvbnRleHQsIGluZGV4QTogbnVtYmVyLCBpbmRleEI6IG51bWJlcikge1xuICBpZiAoaW5kZXhBID09PSBpbmRleEIpIHJldHVybjtcblxuICBjb25zdCB0bXBWYWx1ZSA9IGdldFZhbHVlKGNvbnRleHQsIGluZGV4QSk7XG4gIGNvbnN0IHRtcFByb3AgPSBnZXRQcm9wKGNvbnRleHQsIGluZGV4QSk7XG4gIGNvbnN0IHRtcEZsYWcgPSBnZXRQb2ludGVycyhjb250ZXh0LCBpbmRleEEpO1xuICBjb25zdCB0bXBQbGF5ZXJCdWlsZGVySW5kZXggPSBnZXRQbGF5ZXJCdWlsZGVySW5kZXgoY29udGV4dCwgaW5kZXhBKTtcbiAgY29uc3QgdG1wRGlyZWN0aXZlSW5kZXggPSBnZXREaXJlY3RpdmVJbmRleEZyb21FbnRyeShjb250ZXh0LCBpbmRleEEpO1xuXG4gIGxldCBmbGFnQSA9IHRtcEZsYWc7XG4gIGxldCBmbGFnQiA9IGdldFBvaW50ZXJzKGNvbnRleHQsIGluZGV4Qik7XG5cbiAgY29uc3Qgc2luZ2xlSW5kZXhBID0gZ2V0TXVsdGlPclNpbmdsZUluZGV4KGZsYWdBKTtcbiAgaWYgKHNpbmdsZUluZGV4QSA+PSAwKSB7XG4gICAgY29uc3QgX2ZsYWcgPSBnZXRQb2ludGVycyhjb250ZXh0LCBzaW5nbGVJbmRleEEpO1xuICAgIGNvbnN0IF9pbml0aWFsID0gZ2V0SW5pdGlhbEluZGV4KF9mbGFnKTtcbiAgICBzZXRGbGFnKGNvbnRleHQsIHNpbmdsZUluZGV4QSwgcG9pbnRlcnMoX2ZsYWcsIF9pbml0aWFsLCBpbmRleEIpKTtcbiAgfVxuXG4gIGNvbnN0IHNpbmdsZUluZGV4QiA9IGdldE11bHRpT3JTaW5nbGVJbmRleChmbGFnQik7XG4gIGlmIChzaW5nbGVJbmRleEIgPj0gMCkge1xuICAgIGNvbnN0IF9mbGFnID0gZ2V0UG9pbnRlcnMoY29udGV4dCwgc2luZ2xlSW5kZXhCKTtcbiAgICBjb25zdCBfaW5pdGlhbCA9IGdldEluaXRpYWxJbmRleChfZmxhZyk7XG4gICAgc2V0RmxhZyhjb250ZXh0LCBzaW5nbGVJbmRleEIsIHBvaW50ZXJzKF9mbGFnLCBfaW5pdGlhbCwgaW5kZXhBKSk7XG4gIH1cblxuICBzZXRWYWx1ZShjb250ZXh0LCBpbmRleEEsIGdldFZhbHVlKGNvbnRleHQsIGluZGV4QikpO1xuICBzZXRQcm9wKGNvbnRleHQsIGluZGV4QSwgZ2V0UHJvcChjb250ZXh0LCBpbmRleEIpKTtcbiAgc2V0RmxhZyhjb250ZXh0LCBpbmRleEEsIGdldFBvaW50ZXJzKGNvbnRleHQsIGluZGV4QikpO1xuICBjb25zdCBwbGF5ZXJJbmRleEEgPSBnZXRQbGF5ZXJCdWlsZGVySW5kZXgoY29udGV4dCwgaW5kZXhCKTtcbiAgY29uc3QgZGlyZWN0aXZlSW5kZXhBID0gZ2V0RGlyZWN0aXZlSW5kZXhGcm9tRW50cnkoY29udGV4dCwgaW5kZXhCKTtcbiAgc2V0UGxheWVyQnVpbGRlckluZGV4KGNvbnRleHQsIGluZGV4QSwgcGxheWVySW5kZXhBLCBkaXJlY3RpdmVJbmRleEEpO1xuXG4gIHNldFZhbHVlKGNvbnRleHQsIGluZGV4QiwgdG1wVmFsdWUpO1xuICBzZXRQcm9wKGNvbnRleHQsIGluZGV4QiwgdG1wUHJvcCk7XG4gIHNldEZsYWcoY29udGV4dCwgaW5kZXhCLCB0bXBGbGFnKTtcbiAgc2V0UGxheWVyQnVpbGRlckluZGV4KGNvbnRleHQsIGluZGV4QiwgdG1wUGxheWVyQnVpbGRlckluZGV4LCB0bXBEaXJlY3RpdmVJbmRleCk7XG59XG5cbmZ1bmN0aW9uIHVwZGF0ZVNpbmdsZVBvaW50ZXJWYWx1ZXMoY29udGV4dDogU3R5bGluZ0NvbnRleHQsIGluZGV4U3RhcnRQb3NpdGlvbjogbnVtYmVyKSB7XG4gIGZvciAobGV0IGkgPSBpbmRleFN0YXJ0UG9zaXRpb247IGkgPCBjb250ZXh0Lmxlbmd0aDsgaSArPSBTdHlsaW5nSW5kZXguU2l6ZSkge1xuICAgIGNvbnN0IG11bHRpRmxhZyA9IGdldFBvaW50ZXJzKGNvbnRleHQsIGkpO1xuICAgIGNvbnN0IHNpbmdsZUluZGV4ID0gZ2V0TXVsdGlPclNpbmdsZUluZGV4KG11bHRpRmxhZyk7XG4gICAgaWYgKHNpbmdsZUluZGV4ID4gMCkge1xuICAgICAgY29uc3Qgc2luZ2xlRmxhZyA9IGdldFBvaW50ZXJzKGNvbnRleHQsIHNpbmdsZUluZGV4KTtcbiAgICAgIGNvbnN0IGluaXRpYWxJbmRleEZvclNpbmdsZSA9IGdldEluaXRpYWxJbmRleChzaW5nbGVGbGFnKTtcbiAgICAgIGNvbnN0IGZsYWdWYWx1ZSA9IChpc0RpcnR5KGNvbnRleHQsIHNpbmdsZUluZGV4KSA/IFN0eWxpbmdGbGFncy5EaXJ0eSA6IFN0eWxpbmdGbGFncy5Ob25lKSB8XG4gICAgICAgICAgKGlzQ2xhc3NCYXNlZFZhbHVlKGNvbnRleHQsIHNpbmdsZUluZGV4KSA/IFN0eWxpbmdGbGFncy5DbGFzcyA6IFN0eWxpbmdGbGFncy5Ob25lKSB8XG4gICAgICAgICAgKGlzU2FuaXRpemFibGUoY29udGV4dCwgc2luZ2xlSW5kZXgpID8gU3R5bGluZ0ZsYWdzLlNhbml0aXplIDogU3R5bGluZ0ZsYWdzLk5vbmUpO1xuICAgICAgY29uc3QgdXBkYXRlZEZsYWcgPSBwb2ludGVycyhmbGFnVmFsdWUsIGluaXRpYWxJbmRleEZvclNpbmdsZSwgaSk7XG4gICAgICBzZXRGbGFnKGNvbnRleHQsIHNpbmdsZUluZGV4LCB1cGRhdGVkRmxhZyk7XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGluc2VydE5ld011bHRpUHJvcGVydHkoXG4gICAgY29udGV4dDogU3R5bGluZ0NvbnRleHQsIGluZGV4OiBudW1iZXIsIGNsYXNzQmFzZWQ6IGJvb2xlYW4sIG5hbWU6IHN0cmluZywgZmxhZzogbnVtYmVyLFxuICAgIHZhbHVlOiBzdHJpbmcgfCBib29sZWFuLCBkaXJlY3RpdmVJbmRleDogbnVtYmVyLCBwbGF5ZXJJbmRleDogbnVtYmVyKTogdm9pZCB7XG4gIGNvbnN0IGRvU2hpZnQgPSBpbmRleCA8IGNvbnRleHQubGVuZ3RoO1xuXG4gIC8vIHByb3AgZG9lcyBub3QgZXhpc3QgaW4gdGhlIGxpc3QsIGFkZCBpdCBpblxuICBjb250ZXh0LnNwbGljZShcbiAgICAgIGluZGV4LCAwLCBmbGFnIHwgU3R5bGluZ0ZsYWdzLkRpcnR5IHwgKGNsYXNzQmFzZWQgPyBTdHlsaW5nRmxhZ3MuQ2xhc3MgOiBTdHlsaW5nRmxhZ3MuTm9uZSksXG4gICAgICBuYW1lLCB2YWx1ZSwgMCk7XG4gIHNldFBsYXllckJ1aWxkZXJJbmRleChjb250ZXh0LCBpbmRleCwgcGxheWVySW5kZXgsIGRpcmVjdGl2ZUluZGV4KTtcblxuICBpZiAoZG9TaGlmdCkge1xuICAgIC8vIGJlY2F1c2UgdGhlIHZhbHVlIHdhcyBpbnNlcnRlZCBtaWR3YXkgaW50byB0aGUgYXJyYXkgdGhlbiB3ZVxuICAgIC8vIG5lZWQgdG8gdXBkYXRlIGFsbCB0aGUgc2hpZnRlZCBtdWx0aSB2YWx1ZXMnIHNpbmdsZSB2YWx1ZVxuICAgIC8vIHBvaW50ZXJzIHRvIHBvaW50IHRvIHRoZSBuZXdseSBzaGlmdGVkIGxvY2F0aW9uXG4gICAgdXBkYXRlU2luZ2xlUG9pbnRlclZhbHVlcyhjb250ZXh0LCBpbmRleCArIFN0eWxpbmdJbmRleC5TaXplKTtcbiAgfVxufVxuXG5mdW5jdGlvbiB2YWx1ZUV4aXN0cyh2YWx1ZTogc3RyaW5nIHwgbnVsbCB8IGJvb2xlYW4sIGlzQ2xhc3NCYXNlZD86IGJvb2xlYW4pIHtcbiAgcmV0dXJuIHZhbHVlICE9PSBudWxsO1xufVxuXG5mdW5jdGlvbiBwcmVwYXJlSW5pdGlhbEZsYWcoXG4gICAgY29udGV4dDogU3R5bGluZ0NvbnRleHQsIHByb3A6IHN0cmluZywgZW50cnlJc0NsYXNzQmFzZWQ6IGJvb2xlYW4sXG4gICAgc2FuaXRpemVyPzogU3R5bGVTYW5pdGl6ZUZuIHwgbnVsbCkge1xuICBsZXQgZmxhZyA9IChzYW5pdGl6ZXIgJiYgc2FuaXRpemVyKHByb3ApKSA/IFN0eWxpbmdGbGFncy5TYW5pdGl6ZSA6IFN0eWxpbmdGbGFncy5Ob25lO1xuXG4gIGxldCBpbml0aWFsSW5kZXg6IG51bWJlcjtcbiAgaWYgKGVudHJ5SXNDbGFzc0Jhc2VkKSB7XG4gICAgZmxhZyB8PSBTdHlsaW5nRmxhZ3MuQ2xhc3M7XG4gICAgaW5pdGlhbEluZGV4ID1cbiAgICAgICAgZ2V0SW5pdGlhbFN0eWxpbmdWYWx1ZXNJbmRleE9mKGNvbnRleHRbU3R5bGluZ0luZGV4LkluaXRpYWxDbGFzc1ZhbHVlc1Bvc2l0aW9uXSwgcHJvcCk7XG4gIH0gZWxzZSB7XG4gICAgaW5pdGlhbEluZGV4ID1cbiAgICAgICAgZ2V0SW5pdGlhbFN0eWxpbmdWYWx1ZXNJbmRleE9mKGNvbnRleHRbU3R5bGluZ0luZGV4LkluaXRpYWxTdHlsZVZhbHVlc1Bvc2l0aW9uXSwgcHJvcCk7XG4gIH1cblxuICBpbml0aWFsSW5kZXggPSBpbml0aWFsSW5kZXggPiAwID8gKGluaXRpYWxJbmRleCArIEluaXRpYWxTdHlsaW5nVmFsdWVzSW5kZXguVmFsdWVPZmZzZXQpIDogMDtcbiAgcmV0dXJuIHBvaW50ZXJzKGZsYWcsIGluaXRpYWxJbmRleCwgMCk7XG59XG5cbmZ1bmN0aW9uIGhhc0luaXRpYWxWYWx1ZUNoYW5nZWQoY29udGV4dDogU3R5bGluZ0NvbnRleHQsIGZsYWc6IG51bWJlciwgbmV3VmFsdWU6IGFueSkge1xuICBjb25zdCBpbml0aWFsVmFsdWUgPSBnZXRJbml0aWFsVmFsdWUoY29udGV4dCwgZmxhZyk7XG4gIHJldHVybiAhaW5pdGlhbFZhbHVlIHx8IGhhc1ZhbHVlQ2hhbmdlZChmbGFnLCBpbml0aWFsVmFsdWUsIG5ld1ZhbHVlKTtcbn1cblxuZnVuY3Rpb24gaGFzVmFsdWVDaGFuZ2VkKFxuICAgIGZsYWc6IG51bWJlciwgYTogc3RyaW5nIHwgYm9vbGVhbiB8IG51bGwsIGI6IHN0cmluZyB8IGJvb2xlYW4gfCBudWxsKTogYm9vbGVhbiB7XG4gIGNvbnN0IGlzQ2xhc3NCYXNlZCA9IGZsYWcgJiBTdHlsaW5nRmxhZ3MuQ2xhc3M7XG4gIGNvbnN0IGhhc1ZhbHVlcyA9IGEgJiYgYjtcbiAgY29uc3QgdXNlc1Nhbml0aXplciA9IGZsYWcgJiBTdHlsaW5nRmxhZ3MuU2FuaXRpemU7XG4gIC8vIHRoZSB0b1N0cmluZygpIGNvbXBhcmlzb24gZW5zdXJlcyB0aGF0IGEgdmFsdWUgaXMgY2hlY2tlZFxuICAvLyAuLi4gb3RoZXJ3aXNlIChkdXJpbmcgc2FuaXRpemF0aW9uIGJ5cGFzc2luZykgdGhlID09PSBjb21wYXJzaW9uXG4gIC8vIHdvdWxkIGZhaWwgc2luY2UgYSBuZXcgU3RyaW5nKCkgaW5zdGFuY2UgaXMgY3JlYXRlZFxuICBpZiAoIWlzQ2xhc3NCYXNlZCAmJiBoYXNWYWx1ZXMgJiYgdXNlc1Nhbml0aXplcikge1xuICAgIC8vIHdlIGtub3cgZm9yIHN1cmUgd2UncmUgZGVhbGluZyB3aXRoIHN0cmluZ3MgYXQgdGhpcyBwb2ludFxuICAgIHJldHVybiAoYSBhcyBzdHJpbmcpLnRvU3RyaW5nKCkgIT09IChiIGFzIHN0cmluZykudG9TdHJpbmcoKTtcbiAgfVxuXG4gIC8vIGV2ZXJ5dGhpbmcgZWxzZSBpcyBzYWZlIHRvIGNoZWNrIHdpdGggYSBub3JtYWwgZXF1YWxpdHkgY2hlY2tcbiAgcmV0dXJuIGEgIT09IGI7XG59XG5cbmV4cG9ydCBjbGFzcyBDbGFzc0FuZFN0eWxlUGxheWVyQnVpbGRlcjxUPiBpbXBsZW1lbnRzIFBsYXllckJ1aWxkZXIge1xuICBwcml2YXRlIF92YWx1ZXM6IHtba2V5OiBzdHJpbmddOiBzdHJpbmcgfCBudWxsfSA9IHt9O1xuICBwcml2YXRlIF9kaXJ0eSA9IGZhbHNlO1xuICBwcml2YXRlIF9mYWN0b3J5OiBCb3VuZFBsYXllckZhY3Rvcnk8VD47XG5cbiAgY29uc3RydWN0b3IoZmFjdG9yeTogUGxheWVyRmFjdG9yeSwgcHJpdmF0ZSBfZWxlbWVudDogSFRNTEVsZW1lbnQsIHByaXZhdGUgX3R5cGU6IEJpbmRpbmdUeXBlKSB7XG4gICAgdGhpcy5fZmFjdG9yeSA9IGZhY3RvcnkgYXMgYW55O1xuICB9XG5cbiAgc2V0VmFsdWUocHJvcDogc3RyaW5nLCB2YWx1ZTogYW55KSB7XG4gICAgaWYgKHRoaXMuX3ZhbHVlc1twcm9wXSAhPT0gdmFsdWUpIHtcbiAgICAgIHRoaXMuX3ZhbHVlc1twcm9wXSA9IHZhbHVlO1xuICAgICAgdGhpcy5fZGlydHkgPSB0cnVlO1xuICAgIH1cbiAgfVxuXG4gIGJ1aWxkUGxheWVyKGN1cnJlbnRQbGF5ZXI6IFBsYXllcnxudWxsLCBpc0ZpcnN0UmVuZGVyOiBib29sZWFuKTogUGxheWVyfHVuZGVmaW5lZHxudWxsIHtcbiAgICAvLyBpZiBubyB2YWx1ZXMgaGF2ZSBiZWVuIHNldCBoZXJlIHRoZW4gdGhpcyBtZWFucyB0aGUgYmluZGluZyBkaWRuJ3RcbiAgICAvLyBjaGFuZ2UgYW5kIHRoZXJlZm9yZSB0aGUgYmluZGluZyB2YWx1ZXMgd2VyZSBub3QgdXBkYXRlZCB0aHJvdWdoXG4gICAgLy8gYHNldFZhbHVlYCB3aGljaCBtZWFucyBubyBuZXcgcGxheWVyIHdpbGwgYmUgcHJvdmlkZWQuXG4gICAgaWYgKHRoaXMuX2RpcnR5KSB7XG4gICAgICBjb25zdCBwbGF5ZXIgPSB0aGlzLl9mYWN0b3J5LmZuKFxuICAgICAgICAgIHRoaXMuX2VsZW1lbnQsIHRoaXMuX3R5cGUsIHRoaXMuX3ZhbHVlcyAhLCBpc0ZpcnN0UmVuZGVyLCBjdXJyZW50UGxheWVyIHx8IG51bGwpO1xuICAgICAgdGhpcy5fdmFsdWVzID0ge307XG4gICAgICB0aGlzLl9kaXJ0eSA9IGZhbHNlO1xuICAgICAgcmV0dXJuIHBsYXllcjtcbiAgICB9XG5cbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9XG59XG5cbi8qKlxuICogVXNlZCB0byBwcm92aWRlIGEgc3VtbWFyeSBvZiB0aGUgc3RhdGUgb2YgdGhlIHN0eWxpbmcgY29udGV4dC5cbiAqXG4gKiBUaGlzIGlzIGFuIGludGVybmFsIGludGVyZmFjZSB0aGF0IGlzIG9ubHkgdXNlZCBpbnNpZGUgb2YgdGVzdCB0b29saW5nIHRvXG4gKiBoZWxwIHN1bW1hcml6ZSB3aGF0J3MgZ29pbmcgb24gd2l0aGluIHRoZSBzdHlsaW5nIGNvbnRleHQuIE5vbmUgb2YgdGhpcyBjb2RlXG4gKiBpcyBkZXNpZ25lZCB0byBiZSBleHBvcnRlZCBwdWJsaWNseSBhbmQgd2lsbCwgdGhlcmVmb3JlLCBiZSB0cmVlLXNoYWtlbiBhd2F5XG4gKiBkdXJpbmcgcnVudGltZS5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBMb2dTdW1tYXJ5IHtcbiAgbmFtZTogc3RyaW5nOyAgICAgICAgICAvL1xuICBzdGF0aWNJbmRleDogbnVtYmVyOyAgIC8vXG4gIGR5bmFtaWNJbmRleDogbnVtYmVyOyAgLy9cbiAgdmFsdWU6IG51bWJlcjsgICAgICAgICAvL1xuICBmbGFnczoge1xuICAgIGRpcnR5OiBib29sZWFuOyAgICAgICAgICAgICAgICAgICAgLy9cbiAgICBjbGFzczogYm9vbGVhbjsgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgc2FuaXRpemU6IGJvb2xlYW47ICAgICAgICAgICAgICAgICAvL1xuICAgIHBsYXllckJ1aWxkZXJzRGlydHk6IGJvb2xlYW47ICAgICAgLy9cbiAgICBiaW5kaW5nQWxsb2NhdGlvbkxvY2tlZDogYm9vbGVhbjsgIC8vXG4gIH07XG59XG5cbi8qKlxuICogVGhpcyBmdW5jdGlvbiBpcyBub3QgZGVzaWduZWQgdG8gYmUgdXNlZCBpbiBwcm9kdWN0aW9uLlxuICogSXQgaXMgYSB1dGlsaXR5IHRvb2wgZm9yIGRlYnVnZ2luZyBhbmQgdGVzdGluZyBhbmQgaXRcbiAqIHdpbGwgYXV0b21hdGljYWxseSBiZSB0cmVlLXNoYWtlbiBhd2F5IGR1cmluZyBwcm9kdWN0aW9uLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2VuZXJhdGVDb25maWdTdW1tYXJ5KHNvdXJjZTogbnVtYmVyKTogTG9nU3VtbWFyeTtcbmV4cG9ydCBmdW5jdGlvbiBnZW5lcmF0ZUNvbmZpZ1N1bW1hcnkoc291cmNlOiBTdHlsaW5nQ29udGV4dCk6IExvZ1N1bW1hcnk7XG5leHBvcnQgZnVuY3Rpb24gZ2VuZXJhdGVDb25maWdTdW1tYXJ5KHNvdXJjZTogU3R5bGluZ0NvbnRleHQsIGluZGV4OiBudW1iZXIpOiBMb2dTdW1tYXJ5O1xuZXhwb3J0IGZ1bmN0aW9uIGdlbmVyYXRlQ29uZmlnU3VtbWFyeShzb3VyY2U6IG51bWJlciB8IFN0eWxpbmdDb250ZXh0LCBpbmRleD86IG51bWJlcik6IExvZ1N1bW1hcnkge1xuICBsZXQgZmxhZywgbmFtZSA9ICdjb25maWcgdmFsdWUgZm9yICc7XG4gIGlmIChBcnJheS5pc0FycmF5KHNvdXJjZSkpIHtcbiAgICBpZiAoaW5kZXgpIHtcbiAgICAgIG5hbWUgKz0gJ2luZGV4OiAnICsgaW5kZXg7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5hbWUgKz0gJ21hc3RlciBjb25maWcnO1xuICAgIH1cbiAgICBpbmRleCA9IGluZGV4IHx8IFN0eWxpbmdJbmRleC5NYXN0ZXJGbGFnUG9zaXRpb247XG4gICAgZmxhZyA9IHNvdXJjZVtpbmRleF0gYXMgbnVtYmVyO1xuICB9IGVsc2Uge1xuICAgIGZsYWcgPSBzb3VyY2U7XG4gICAgbmFtZSArPSAnaW5kZXg6ICcgKyBmbGFnO1xuICB9XG4gIGNvbnN0IGR5bmFtaWNJbmRleCA9IGdldE11bHRpT3JTaW5nbGVJbmRleChmbGFnKTtcbiAgY29uc3Qgc3RhdGljSW5kZXggPSBnZXRJbml0aWFsSW5kZXgoZmxhZyk7XG4gIHJldHVybiB7XG4gICAgbmFtZSxcbiAgICBzdGF0aWNJbmRleCxcbiAgICBkeW5hbWljSW5kZXgsXG4gICAgdmFsdWU6IGZsYWcsXG4gICAgZmxhZ3M6IHtcbiAgICAgIGRpcnR5OiBmbGFnICYgU3R5bGluZ0ZsYWdzLkRpcnR5ID8gdHJ1ZSA6IGZhbHNlLFxuICAgICAgY2xhc3M6IGZsYWcgJiBTdHlsaW5nRmxhZ3MuQ2xhc3MgPyB0cnVlIDogZmFsc2UsXG4gICAgICBzYW5pdGl6ZTogZmxhZyAmIFN0eWxpbmdGbGFncy5TYW5pdGl6ZSA/IHRydWUgOiBmYWxzZSxcbiAgICAgIHBsYXllckJ1aWxkZXJzRGlydHk6IGZsYWcgJiBTdHlsaW5nRmxhZ3MuUGxheWVyQnVpbGRlcnNEaXJ0eSA/IHRydWUgOiBmYWxzZSxcbiAgICAgIGJpbmRpbmdBbGxvY2F0aW9uTG9ja2VkOiBmbGFnICYgU3R5bGluZ0ZsYWdzLkJpbmRpbmdBbGxvY2F0aW9uTG9ja2VkID8gdHJ1ZSA6IGZhbHNlLFxuICAgIH1cbiAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldERpcmVjdGl2ZUluZGV4RnJvbUVudHJ5KGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBpbmRleDogbnVtYmVyKSB7XG4gIGNvbnN0IHZhbHVlID0gY29udGV4dFtpbmRleCArIFN0eWxpbmdJbmRleC5QbGF5ZXJCdWlsZGVySW5kZXhPZmZzZXRdIGFzIG51bWJlcjtcbiAgcmV0dXJuIHZhbHVlICYgRGlyZWN0aXZlT3duZXJBbmRQbGF5ZXJCdWlsZGVySW5kZXguQml0TWFzaztcbn1cblxuZnVuY3Rpb24gZ2V0SW5pdGlhbFN0eWxpbmdWYWx1ZXNJbmRleE9mKGtleVZhbHVlczogSW5pdGlhbFN0eWxpbmdWYWx1ZXMsIGtleTogc3RyaW5nKTogbnVtYmVyIHtcbiAgZm9yIChsZXQgaSA9IEluaXRpYWxTdHlsaW5nVmFsdWVzSW5kZXguS2V5VmFsdWVTdGFydFBvc2l0aW9uOyBpIDwga2V5VmFsdWVzLmxlbmd0aDtcbiAgICAgICBpICs9IEluaXRpYWxTdHlsaW5nVmFsdWVzSW5kZXguU2l6ZSkge1xuICAgIGlmIChrZXlWYWx1ZXNbaV0gPT09IGtleSkgcmV0dXJuIGk7XG4gIH1cbiAgcmV0dXJuIC0xO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY29tcGFyZUxvZ1N1bW1hcmllcyhhOiBMb2dTdW1tYXJ5LCBiOiBMb2dTdW1tYXJ5KSB7XG4gIGNvbnN0IGxvZzogc3RyaW5nW10gPSBbXTtcbiAgY29uc3QgZGlmZnM6IFtzdHJpbmcsIGFueSwgYW55XVtdID0gW107XG4gIGRpZmZTdW1tYXJ5VmFsdWVzKGRpZmZzLCAnc3RhdGljSW5kZXgnLCAnc3RhdGljSW5kZXgnLCBhLCBiKTtcbiAgZGlmZlN1bW1hcnlWYWx1ZXMoZGlmZnMsICdkeW5hbWljSW5kZXgnLCAnZHluYW1pY0luZGV4JywgYSwgYik7XG4gIE9iamVjdC5rZXlzKGEuZmxhZ3MpLmZvckVhY2goXG4gICAgICBuYW1lID0+IHsgZGlmZlN1bW1hcnlWYWx1ZXMoZGlmZnMsICdmbGFncy4nICsgbmFtZSwgbmFtZSwgYS5mbGFncywgYi5mbGFncyk7IH0pO1xuXG4gIGlmIChkaWZmcy5sZW5ndGgpIHtcbiAgICBsb2cucHVzaCgnTG9nIFN1bW1hcmllcyBmb3I6Jyk7XG4gICAgbG9nLnB1c2goJyAgQTogJyArIGEubmFtZSk7XG4gICAgbG9nLnB1c2goJyAgQjogJyArIGIubmFtZSk7XG4gICAgbG9nLnB1c2goJ1xcbiAgRGlmZmVyIGluIHRoZSBmb2xsb3dpbmcgd2F5IChBICE9PSBCKTonKTtcbiAgICBkaWZmcy5mb3JFYWNoKHJlc3VsdCA9PiB7XG4gICAgICBjb25zdCBbbmFtZSwgYVZhbCwgYlZhbF0gPSByZXN1bHQ7XG4gICAgICBsb2cucHVzaCgnICAgID0+ICcgKyBuYW1lKTtcbiAgICAgIGxvZy5wdXNoKCcgICAgPT4gJyArIGFWYWwgKyAnICE9PSAnICsgYlZhbCArICdcXG4nKTtcbiAgICB9KTtcbiAgfVxuXG4gIHJldHVybiBsb2c7XG59XG5cbmZ1bmN0aW9uIGRpZmZTdW1tYXJ5VmFsdWVzKHJlc3VsdDogYW55W10sIG5hbWU6IHN0cmluZywgcHJvcDogc3RyaW5nLCBhOiBhbnksIGI6IGFueSkge1xuICBjb25zdCBhVmFsID0gYVtwcm9wXTtcbiAgY29uc3QgYlZhbCA9IGJbcHJvcF07XG4gIGlmIChhVmFsICE9PSBiVmFsKSB7XG4gICAgcmVzdWx0LnB1c2goW25hbWUsIGFWYWwsIGJWYWxdKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBnZXRTaW5nbGVQcm9wSW5kZXhWYWx1ZShcbiAgICBjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgZGlyZWN0aXZlSW5kZXg6IG51bWJlciwgb2Zmc2V0OiBudW1iZXIsIGlzQ2xhc3NCYXNlZDogYm9vbGVhbikge1xuICBjb25zdCBzaW5nbGVQcm9wT2Zmc2V0UmVnaXN0cnlJbmRleCA9XG4gICAgICBjb250ZXh0W1N0eWxpbmdJbmRleC5EaXJlY3RpdmVSZWdpc3RyeVBvc2l0aW9uXVxuICAgICAgICAgICAgIFsoZGlyZWN0aXZlSW5kZXggKiBEaXJlY3RpdmVSZWdpc3RyeVZhbHVlc0luZGV4LlNpemUpICtcbiAgICAgICAgICAgICAgRGlyZWN0aXZlUmVnaXN0cnlWYWx1ZXNJbmRleC5TaW5nbGVQcm9wVmFsdWVzSW5kZXhPZmZzZXRdIGFzIG51bWJlcjtcbiAgY29uc3Qgb2Zmc2V0cyA9IGNvbnRleHRbU3R5bGluZ0luZGV4LlNpbmdsZVByb3BPZmZzZXRQb3NpdGlvbnNdO1xuICBjb25zdCBpbmRleEZvck9mZnNldCA9IHNpbmdsZVByb3BPZmZzZXRSZWdpc3RyeUluZGV4ICtcbiAgICAgIFNpbmdsZVByb3BPZmZzZXRWYWx1ZXNJbmRleC5WYWx1ZVN0YXJ0UG9zaXRpb24gK1xuICAgICAgKGlzQ2xhc3NCYXNlZCA/XG4gICAgICAgICAgIG9mZnNldHNcbiAgICAgICAgICAgICAgIFtzaW5nbGVQcm9wT2Zmc2V0UmVnaXN0cnlJbmRleCArIFNpbmdsZVByb3BPZmZzZXRWYWx1ZXNJbmRleC5TdHlsZXNDb3VudFBvc2l0aW9uXSA6XG4gICAgICAgICAgIDApICtcbiAgICAgIG9mZnNldDtcbiAgcmV0dXJuIG9mZnNldHNbaW5kZXhGb3JPZmZzZXRdO1xufVxuXG5mdW5jdGlvbiBnZXRTdHlsZVNhbml0aXplcihjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgZGlyZWN0aXZlSW5kZXg6IG51bWJlcik6IFN0eWxlU2FuaXRpemVGbnxudWxsIHtcbiAgY29uc3QgZGlycyA9IGNvbnRleHRbU3R5bGluZ0luZGV4LkRpcmVjdGl2ZVJlZ2lzdHJ5UG9zaXRpb25dO1xuICBjb25zdCB2YWx1ZSA9IGRpcnNcbiAgICAgICAgICAgICAgICAgICAgW2RpcmVjdGl2ZUluZGV4ICogRGlyZWN0aXZlUmVnaXN0cnlWYWx1ZXNJbmRleC5TaXplICtcbiAgICAgICAgICAgICAgICAgICAgIERpcmVjdGl2ZVJlZ2lzdHJ5VmFsdWVzSW5kZXguU3R5bGVTYW5pdGl6ZXJPZmZzZXRdIHx8XG4gICAgICBkaXJzW0RpcmVjdGl2ZVJlZ2lzdHJ5VmFsdWVzSW5kZXguU3R5bGVTYW5pdGl6ZXJPZmZzZXRdIHx8IG51bGw7XG4gIHJldHVybiB2YWx1ZSBhcyBTdHlsZVNhbml0aXplRm4gfCBudWxsO1xufVxuXG5mdW5jdGlvbiBhbGxvd1ZhbHVlQ2hhbmdlKFxuICAgIGN1cnJlbnRWYWx1ZTogc3RyaW5nIHwgYm9vbGVhbiB8IG51bGwsIG5ld1ZhbHVlOiBzdHJpbmcgfCBib29sZWFuIHwgbnVsbCxcbiAgICBjdXJyZW50RGlyZWN0aXZlT3duZXI6IG51bWJlciwgbmV3RGlyZWN0aXZlT3duZXI6IG51bWJlcikge1xuICAvLyB0aGUgY29kZSBiZWxvdyByZWxpZXMgdGhlIGltcG9ydGFuY2Ugb2YgZGlyZWN0aXZlJ3MgYmVpbmcgdGllZCB0byB0aGVpclxuICAvLyBpbmRleCB2YWx1ZS4gVGhlIGluZGV4IHZhbHVlcyBmb3IgZWFjaCBkaXJlY3RpdmUgYXJlIGRlcml2ZWQgZnJvbSBiZWluZ1xuICAvLyByZWdpc3RlcmVkIGludG8gdGhlIHN0eWxpbmcgY29udGV4dCBkaXJlY3RpdmUgcmVnaXN0cnkuIFRoZSBtb3N0IGltcG9ydGFudFxuICAvLyBkaXJlY3RpdmUgaXMgdGhlIHBhcmVudCBjb21wb25lbnQgZGlyZWN0aXZlICh0aGUgdGVtcGxhdGUpIGFuZCBlYWNoIGRpcmVjdGl2ZVxuICAvLyB0aGF0IGlzIGFkZGVkIGFmdGVyIGlzIGNvbnNpZGVyZWQgbGVzcyBpbXBvcnRhbnQgdGhhbiB0aGUgcHJldmlvdXMgZW50cnkuIFRoaXNcbiAgLy8gcHJpb3JpdGl6YXRpb24gb2YgZGlyZWN0aXZlcyBlbmFibGVzIHRoZSBzdHlsaW5nIGFsZ29yaXRobSB0byBkZWNpZGUgaWYgYSBzdHlsZVxuICAvLyBvciBjbGFzcyBzaG91bGQgYmUgYWxsb3dlZCB0byBiZSB1cGRhdGVkL3JlcGxhY2VkIGluIGNhc2UgYW4gZWFybGllciBkaXJlY3RpdmVcbiAgLy8gYWxyZWFkeSB3cm90ZSB0byB0aGUgZXhhY3Qgc2FtZSBzdHlsZS1wcm9wZXJ0eSBvciBjbGFzc05hbWUgdmFsdWUuIEluIG90aGVyIHdvcmRzXG4gIC8vIHRoaXMgZGVjaWRlcyB3aGF0IHRvIGRvIGlmIGFuZCB3aGVuIHRoZXJlIGlzIGEgY29sbGlzaW9uLlxuICBpZiAoY3VycmVudFZhbHVlICE9IG51bGwpIHtcbiAgICBpZiAobmV3VmFsdWUgIT0gbnVsbCkge1xuICAgICAgLy8gaWYgYSBkaXJlY3RpdmUgaW5kZXggaXMgbG93ZXIgdGhhbiBpdCBhbHdheXMgaGFzIHByaW9yaXR5IG92ZXIgdGhlXG4gICAgICAvLyBwcmV2aW91cyBkaXJlY3RpdmUncyB2YWx1ZS4uLlxuICAgICAgcmV0dXJuIG5ld0RpcmVjdGl2ZU93bmVyIDw9IGN1cnJlbnREaXJlY3RpdmVPd25lcjtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gb25seSB3cml0ZSBhIG51bGwgdmFsdWUgaW4gY2FzZSBpdCdzIHRoZSBzYW1lIG93bmVyIHdyaXRpbmcgaXQuXG4gICAgICAvLyB0aGlzIGF2b2lkcyBoYXZpbmcgYSBoaWdoZXItcHJpb3JpdHkgZGlyZWN0aXZlIHdyaXRlIHRvIG51bGxcbiAgICAgIC8vIG9ubHkgdG8gaGF2ZSBhIGxlc3Nlci1wcmlvcml0eSBkaXJlY3RpdmUgY2hhbmdlIHJpZ2h0IHRvIGFcbiAgICAgIC8vIG5vbi1udWxsIHZhbHVlIGltbWVkaWF0ZWx5IGFmdGVyd2FyZHMuXG4gICAgICByZXR1cm4gY3VycmVudERpcmVjdGl2ZU93bmVyID09PSBuZXdEaXJlY3RpdmVPd25lcjtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHRydWU7XG59XG5cbi8qKlxuICogUmV0dXJucyB0aGUgY2xhc3NOYW1lIHN0cmluZyBvZiBhbGwgdGhlIGluaXRpYWwgY2xhc3NlcyBmb3IgdGhlIGVsZW1lbnQuXG4gKlxuICogVGhpcyBmdW5jdGlvbiBpcyBkZXNpZ25lZCB0byBwb3B1bGF0ZSBhbmQgY2FjaGUgYWxsIHRoZSBzdGF0aWMgY2xhc3NcbiAqIHZhbHVlcyBpbnRvIGEgY2xhc3NOYW1lIHN0cmluZy4gVGhlIGNhY2hpbmcgbWVjaGFuaXNtIHdvcmtzIGJ5IHBsYWNpbmdcbiAqIHRoZSBjb21wbGV0ZWQgY2xhc3NOYW1lIHN0cmluZyBpbnRvIHRoZSBpbml0aWFsIHZhbHVlcyBhcnJheSBpbnRvIGFcbiAqIGRlZGljYXRlZCBzbG90LiBUaGlzIHdpbGwgcHJldmVudCB0aGUgZnVuY3Rpb24gZnJvbSBoYXZpbmcgdG8gcG9wdWxhdGVcbiAqIHRoZSBzdHJpbmcgZWFjaCB0aW1lIGFuIGVsZW1lbnQgaXMgY3JlYXRlZCBvciBtYXRjaGVkLlxuICpcbiAqIEByZXR1cm5zIHRoZSBjbGFzc05hbWUgc3RyaW5nIChlLmcuIGBvbiBhY3RpdmUgcmVkYClcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldEluaXRpYWxDbGFzc05hbWVWYWx1ZShjb250ZXh0OiBTdHlsaW5nQ29udGV4dCk6IHN0cmluZyB7XG4gIGNvbnN0IGluaXRpYWxDbGFzc1ZhbHVlcyA9IGNvbnRleHRbU3R5bGluZ0luZGV4LkluaXRpYWxDbGFzc1ZhbHVlc1Bvc2l0aW9uXTtcbiAgbGV0IGNsYXNzTmFtZSA9IGluaXRpYWxDbGFzc1ZhbHVlc1tJbml0aWFsU3R5bGluZ1ZhbHVlc0luZGV4LkNhY2hlZFN0cmluZ1ZhbHVlUG9zaXRpb25dO1xuICBpZiAoY2xhc3NOYW1lID09PSBudWxsKSB7XG4gICAgY2xhc3NOYW1lID0gJyc7XG4gICAgZm9yIChsZXQgaSA9IEluaXRpYWxTdHlsaW5nVmFsdWVzSW5kZXguS2V5VmFsdWVTdGFydFBvc2l0aW9uOyBpIDwgaW5pdGlhbENsYXNzVmFsdWVzLmxlbmd0aDtcbiAgICAgICAgIGkgKz0gSW5pdGlhbFN0eWxpbmdWYWx1ZXNJbmRleC5TaXplKSB7XG4gICAgICBjb25zdCBpc1ByZXNlbnQgPSBpbml0aWFsQ2xhc3NWYWx1ZXNbaSArIDFdO1xuICAgICAgaWYgKGlzUHJlc2VudCkge1xuICAgICAgICBjbGFzc05hbWUgKz0gKGNsYXNzTmFtZS5sZW5ndGggPyAnICcgOiAnJykgKyBpbml0aWFsQ2xhc3NWYWx1ZXNbaV07XG4gICAgICB9XG4gICAgfVxuICAgIGluaXRpYWxDbGFzc1ZhbHVlc1tJbml0aWFsU3R5bGluZ1ZhbHVlc0luZGV4LkNhY2hlZFN0cmluZ1ZhbHVlUG9zaXRpb25dID0gY2xhc3NOYW1lO1xuICB9XG4gIHJldHVybiBjbGFzc05hbWU7XG59XG5cbi8qKlxuICogUmV0dXJucyB0aGUgc3R5bGUgc3RyaW5nIG9mIGFsbCB0aGUgaW5pdGlhbCBzdHlsZXMgZm9yIHRoZSBlbGVtZW50LlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gaXMgZGVzaWduZWQgdG8gcG9wdWxhdGUgYW5kIGNhY2hlIGFsbCB0aGUgc3RhdGljIHN0eWxlXG4gKiB2YWx1ZXMgaW50byBhIHN0eWxlIHN0cmluZy4gVGhlIGNhY2hpbmcgbWVjaGFuaXNtIHdvcmtzIGJ5IHBsYWNpbmdcbiAqIHRoZSBjb21wbGV0ZWQgc3R5bGUgc3RyaW5nIGludG8gdGhlIGluaXRpYWwgdmFsdWVzIGFycmF5IGludG8gYVxuICogZGVkaWNhdGVkIHNsb3QuIFRoaXMgd2lsbCBwcmV2ZW50IHRoZSBmdW5jdGlvbiBmcm9tIGhhdmluZyB0byBwb3B1bGF0ZVxuICogdGhlIHN0cmluZyBlYWNoIHRpbWUgYW4gZWxlbWVudCBpcyBjcmVhdGVkIG9yIG1hdGNoZWQuXG4gKlxuICogQHJldHVybnMgdGhlIHN0eWxlIHN0cmluZyAoZS5nLiBgd2lkdGg6MTAwcHg7aGVpZ2h0OjIwMHB4YClcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldEluaXRpYWxTdHlsZVN0cmluZ1ZhbHVlKGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0KTogc3RyaW5nIHtcbiAgY29uc3QgaW5pdGlhbFN0eWxlVmFsdWVzID0gY29udGV4dFtTdHlsaW5nSW5kZXguSW5pdGlhbFN0eWxlVmFsdWVzUG9zaXRpb25dO1xuICBsZXQgc3R5bGVTdHJpbmcgPSBpbml0aWFsU3R5bGVWYWx1ZXNbSW5pdGlhbFN0eWxpbmdWYWx1ZXNJbmRleC5DYWNoZWRTdHJpbmdWYWx1ZVBvc2l0aW9uXTtcbiAgaWYgKHN0eWxlU3RyaW5nID09PSBudWxsKSB7XG4gICAgc3R5bGVTdHJpbmcgPSAnJztcbiAgICBmb3IgKGxldCBpID0gSW5pdGlhbFN0eWxpbmdWYWx1ZXNJbmRleC5LZXlWYWx1ZVN0YXJ0UG9zaXRpb247IGkgPCBpbml0aWFsU3R5bGVWYWx1ZXMubGVuZ3RoO1xuICAgICAgICAgaSArPSBJbml0aWFsU3R5bGluZ1ZhbHVlc0luZGV4LlNpemUpIHtcbiAgICAgIGNvbnN0IHZhbHVlID0gaW5pdGlhbFN0eWxlVmFsdWVzW2kgKyAxXTtcbiAgICAgIGlmICh2YWx1ZSAhPT0gbnVsbCkge1xuICAgICAgICBzdHlsZVN0cmluZyArPSAoc3R5bGVTdHJpbmcubGVuZ3RoID8gJzsnIDogJycpICsgYCR7aW5pdGlhbFN0eWxlVmFsdWVzW2ldfToke3ZhbHVlfWA7XG4gICAgICB9XG4gICAgfVxuICAgIGluaXRpYWxTdHlsZVZhbHVlc1tJbml0aWFsU3R5bGluZ1ZhbHVlc0luZGV4LkNhY2hlZFN0cmluZ1ZhbHVlUG9zaXRpb25dID0gc3R5bGVTdHJpbmc7XG4gIH1cbiAgcmV0dXJuIHN0eWxlU3RyaW5nO1xufVxuXG4vKipcbiAqIFJldHVybnMgdGhlIGN1cnJlbnQgY2FjaGVkIG11dGxpLXZhbHVlIGZvciBhIGdpdmVuIGRpcmVjdGl2ZUluZGV4IHdpdGhpbiB0aGUgcHJvdmlkZWQgY29udGV4dC5cbiAqL1xuZnVuY3Rpb24gcmVhZENhY2hlZE1hcFZhbHVlKFxuICAgIGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBlbnRyeUlzQ2xhc3NCYXNlZDogYm9vbGVhbiwgZGlyZWN0aXZlSW5kZXg6IG51bWJlcikge1xuICBjb25zdCB2YWx1ZXM6IE1hcEJhc2VkT2Zmc2V0VmFsdWVzID1cbiAgICAgIGNvbnRleHRbZW50cnlJc0NsYXNzQmFzZWQgPyBTdHlsaW5nSW5kZXguQ2FjaGVkTXVsdGlDbGFzc2VzIDogU3R5bGluZ0luZGV4LkNhY2hlZE11bHRpU3R5bGVzXTtcbiAgY29uc3QgaW5kZXggPSBNYXBCYXNlZE9mZnNldFZhbHVlc0luZGV4LlZhbHVlc1N0YXJ0UG9zaXRpb24gK1xuICAgICAgZGlyZWN0aXZlSW5kZXggKiBNYXBCYXNlZE9mZnNldFZhbHVlc0luZGV4LlNpemU7XG4gIHJldHVybiB2YWx1ZXNbaW5kZXggKyBNYXBCYXNlZE9mZnNldFZhbHVlc0luZGV4LlZhbHVlT2Zmc2V0XSB8fCBudWxsO1xufVxuXG4vKipcbiAqIERldGVybWluZXMgd2hldGhlciB0aGUgcHJvdmlkZWQgbXVsdGkgc3R5bGluZyB2YWx1ZSBzaG91bGQgYmUgdXBkYXRlZCBvciBub3QuXG4gKlxuICogQmVjYXVzZSBgW3N0eWxlXWAgYW5kIGBbY2xhc3NdYCBiaW5kaW5ncyByZWx5IG9uIGFuIGlkZW50aXR5IGNoYW5nZSB0byBvY2N1ciBiZWZvcmVcbiAqIGFwcGx5aW5nIG5ldyB2YWx1ZXMsIHRoZSBzdHlsaW5nIGFsZ29yaXRobSBtYXkgbm90IHVwZGF0ZSBhbiBleGlzdGluZyBlbnRyeSBpbnRvXG4gKiB0aGUgY29udGV4dCBpZiBhIHByZXZpb3VzIGRpcmVjdGl2ZSdzIGVudHJ5IGNoYW5nZWQgc2hhcGUuXG4gKlxuICogVGhpcyBmdW5jdGlvbiB3aWxsIGRlY2lkZSB3aGV0aGVyIG9yIG5vdCBhIHZhbHVlIHNob3VsZCBiZSBhcHBsaWVkIChpZiB0aGVyZSBpcyBhXG4gKiBjYWNoZSBtaXNzKSB0byB0aGUgY29udGV4dCBiYXNlZCBvbiB0aGUgZm9sbG93aW5nIHJ1bGVzOlxuICpcbiAqIC0gSWYgdGhlcmUgaXMgYW4gaWRlbnRpdHkgY2hhbmdlIGJldHdlZW4gdGhlIGV4aXN0aW5nIHZhbHVlIGFuZCBuZXcgdmFsdWVcbiAqIC0gSWYgdGhlcmUgaXMgbm8gZXhpc3RpbmcgdmFsdWUgY2FjaGVkIChmaXJzdCB3cml0ZSlcbiAqIC0gSWYgYSBwcmV2aW91cyBkaXJlY3RpdmUgZmxhZ2dlZCB0aGUgZXhpc3RpbmcgY2FjaGVkIHZhbHVlIGFzIGRpcnR5XG4gKi9cbmZ1bmN0aW9uIGlzTXVsdGlWYWx1ZUNhY2hlSGl0KFxuICAgIGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBlbnRyeUlzQ2xhc3NCYXNlZDogYm9vbGVhbiwgZGlyZWN0aXZlSW5kZXg6IG51bWJlcixcbiAgICBuZXdWYWx1ZTogYW55KTogYm9vbGVhbiB7XG4gIGNvbnN0IGluZGV4T2ZDYWNoZWRWYWx1ZXMgPVxuICAgICAgZW50cnlJc0NsYXNzQmFzZWQgPyBTdHlsaW5nSW5kZXguQ2FjaGVkTXVsdGlDbGFzc2VzIDogU3R5bGluZ0luZGV4LkNhY2hlZE11bHRpU3R5bGVzO1xuICBjb25zdCBjYWNoZWRWYWx1ZXMgPSBjb250ZXh0W2luZGV4T2ZDYWNoZWRWYWx1ZXNdIGFzIE1hcEJhc2VkT2Zmc2V0VmFsdWVzO1xuICBjb25zdCBpbmRleCA9IE1hcEJhc2VkT2Zmc2V0VmFsdWVzSW5kZXguVmFsdWVzU3RhcnRQb3NpdGlvbiArXG4gICAgICBkaXJlY3RpdmVJbmRleCAqIE1hcEJhc2VkT2Zmc2V0VmFsdWVzSW5kZXguU2l6ZTtcbiAgaWYgKGNhY2hlZFZhbHVlc1tpbmRleCArIE1hcEJhc2VkT2Zmc2V0VmFsdWVzSW5kZXguRGlydHlGbGFnT2Zmc2V0XSkgcmV0dXJuIGZhbHNlO1xuICByZXR1cm4gbmV3VmFsdWUgPT09IE5PX0NIQU5HRSB8fFxuICAgICAgcmVhZENhY2hlZE1hcFZhbHVlKGNvbnRleHQsIGVudHJ5SXNDbGFzc0Jhc2VkLCBkaXJlY3RpdmVJbmRleCkgPT09IG5ld1ZhbHVlO1xufVxuXG4vKipcbiAqIFVwZGF0ZXMgdGhlIGNhY2hlZCBzdGF0dXMgb2YgYSBtdWx0aS1zdHlsaW5nIHZhbHVlIGluIHRoZSBjb250ZXh0LlxuICpcbiAqIFRoZSBjYWNoZWQgbWFwIGFycmF5ICh3aGljaCBleGlzdHMgaW4gdGhlIGNvbnRleHQpIGNvbnRhaW5zIGEgbWFuaWZlc3Qgb2ZcbiAqIGVhY2ggbXVsdGktc3R5bGluZyBlbnRyeSAoYFtzdHlsZV1gIGFuZCBgW2NsYXNzXWAgZW50cmllcykgZm9yIHRoZSB0ZW1wbGF0ZVxuICogYXMgd2VsbCBhcyBhbGwgZGlyZWN0aXZlcy5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIHdpbGwgdXBkYXRlIHRoZSBjYWNoZWQgc3RhdHVzIG9mIHRoZSBwcm92aWRlZCBtdWx0aS1zdHlsZVxuICogZW50cnkgd2l0aGluIHRoZSBjYWNoZS5cbiAqXG4gKiBXaGVuIGNhbGxlZCwgdGhpcyBmdW5jdGlvbiB3aWxsIHVwZGF0ZSB0aGUgZm9sbG93aW5nIGluZm9ybWF0aW9uOlxuICogLSBUaGUgYWN0dWFsIGNhY2hlZCB2YWx1ZSAodGhlIHJhdyB2YWx1ZSB0aGF0IHdhcyBwYXNzZWQgaW50byBgW3N0eWxlXWAgb3IgYFtjbGFzc11gKVxuICogLSBUaGUgdG90YWwgYW1vdW50IG9mIHVuaXF1ZSBzdHlsaW5nIGVudHJpZXMgdGhhdCB0aGlzIHZhbHVlIGhhcyB3cml0dGVuIGludG8gdGhlIGNvbnRleHRcbiAqIC0gVGhlIGV4YWN0IHBvc2l0aW9uIG9mIHdoZXJlIHRoZSBtdWx0aSBzdHlsaW5nIGVudHJpZXMgc3RhcnQgaW4gdGhlIGNvbnRleHQgZm9yIHRoaXMgYmluZGluZ1xuICogLSBUaGUgZGlydHkgZmxhZyB3aWxsIGJlIHNldCB0byB0cnVlXG4gKlxuICogSWYgdGhlIGBkaXJ0eUZ1dHVyZVZhbHVlc2AgcGFyYW0gaXMgcHJvdmlkZWQgdGhlbiBpdCB3aWxsIHVwZGF0ZSBhbGwgZnV0dXJlIGVudHJpZXMgKGJpbmRpbmdcbiAqIGVudHJpZXMgdGhhdCBleGlzdCBhcyBhcGFydCBvZiBvdGhlciBkaXJlY3RpdmVzKSB0byBiZSBkaXJ0eSBhcyB3ZWxsLiBUaGlzIHdpbGwgZm9yY2UgdGhlXG4gKiBzdHlsaW5nIGFsZ29yaXRobSB0byByZWFwcGx5IHRob3NlIHZhbHVlcyBvbmNlIGNoYW5nZSBkZXRlY3Rpb24gY2hlY2tzIHRoZW0gKHdoaWNoIHdpbGwgaW5cbiAqIHR1cm4gY2F1c2UgdGhlIHN0eWxpbmcgY29udGV4dCB0byB1cGRhdGUgaXRzZWxmIGFuZCB0aGUgY29ycmVjdCBzdHlsaW5nIHZhbHVlcyB3aWxsIGJlXG4gKiByZW5kZXJlZCBvbiBzY3JlZW4pLlxuICovXG5mdW5jdGlvbiB1cGRhdGVDYWNoZWRNYXBWYWx1ZShcbiAgICBjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgZGlyZWN0aXZlSW5kZXg6IG51bWJlciwgZW50cnlJc0NsYXNzQmFzZWQ6IGJvb2xlYW4sIGNhY2hlVmFsdWU6IGFueSxcbiAgICBzdGFydFBvc2l0aW9uOiBudW1iZXIsIGVuZFBvc2l0aW9uOiBudW1iZXIsIHRvdGFsVmFsdWVzOiBudW1iZXIsIGRpcnR5RnV0dXJlVmFsdWVzOiBib29sZWFuKSB7XG4gIGNvbnN0IHZhbHVlcyA9XG4gICAgICBjb250ZXh0W2VudHJ5SXNDbGFzc0Jhc2VkID8gU3R5bGluZ0luZGV4LkNhY2hlZE11bHRpQ2xhc3NlcyA6IFN0eWxpbmdJbmRleC5DYWNoZWRNdWx0aVN0eWxlc107XG5cbiAgY29uc3QgaW5kZXggPSBNYXBCYXNlZE9mZnNldFZhbHVlc0luZGV4LlZhbHVlc1N0YXJ0UG9zaXRpb24gK1xuICAgICAgZGlyZWN0aXZlSW5kZXggKiBNYXBCYXNlZE9mZnNldFZhbHVlc0luZGV4LlNpemU7XG5cbiAgLy8gaW4gdGhlIGV2ZW50IHRoYXQgdGhpcyBpcyB0cnVlIHdlIGFzc3VtZSB0aGF0IGZ1dHVyZSB2YWx1ZXMgYXJlIGRpcnR5IGFuZCB0aGVyZWZvcmVcbiAgLy8gd2lsbCBiZSBjaGVja2VkIGFnYWluIGluIHRoZSBuZXh0IENEIGN5Y2xlXG4gIGlmIChkaXJ0eUZ1dHVyZVZhbHVlcykge1xuICAgIGNvbnN0IG5leHRTdGFydFBvc2l0aW9uID0gc3RhcnRQb3NpdGlvbiArIHRvdGFsVmFsdWVzICogTWFwQmFzZWRPZmZzZXRWYWx1ZXNJbmRleC5TaXplO1xuICAgIGZvciAobGV0IGkgPSBpbmRleCArIE1hcEJhc2VkT2Zmc2V0VmFsdWVzSW5kZXguU2l6ZTsgaSA8IHZhbHVlcy5sZW5ndGg7XG4gICAgICAgICBpICs9IE1hcEJhc2VkT2Zmc2V0VmFsdWVzSW5kZXguU2l6ZSkge1xuICAgICAgdmFsdWVzW2kgKyBNYXBCYXNlZE9mZnNldFZhbHVlc0luZGV4LlBvc2l0aW9uU3RhcnRPZmZzZXRdID0gbmV4dFN0YXJ0UG9zaXRpb247XG4gICAgICB2YWx1ZXNbaSArIE1hcEJhc2VkT2Zmc2V0VmFsdWVzSW5kZXguRGlydHlGbGFnT2Zmc2V0XSA9IDE7XG4gICAgfVxuICB9XG5cbiAgdmFsdWVzW2luZGV4ICsgTWFwQmFzZWRPZmZzZXRWYWx1ZXNJbmRleC5EaXJ0eUZsYWdPZmZzZXRdID0gMDtcbiAgdmFsdWVzW2luZGV4ICsgTWFwQmFzZWRPZmZzZXRWYWx1ZXNJbmRleC5Qb3NpdGlvblN0YXJ0T2Zmc2V0XSA9IHN0YXJ0UG9zaXRpb247XG4gIHZhbHVlc1tpbmRleCArIE1hcEJhc2VkT2Zmc2V0VmFsdWVzSW5kZXguVmFsdWVPZmZzZXRdID0gY2FjaGVWYWx1ZTtcbiAgdmFsdWVzW2luZGV4ICsgTWFwQmFzZWRPZmZzZXRWYWx1ZXNJbmRleC5WYWx1ZUNvdW50T2Zmc2V0XSA9IHRvdGFsVmFsdWVzO1xuXG4gIC8vIHRoZSBjb2RlIGJlbG93IGNvdW50cyB0aGUgdG90YWwgYW1vdW50IG9mIHN0eWxpbmcgdmFsdWVzIHRoYXQgZXhpc3QgaW5cbiAgLy8gdGhlIGNvbnRleHQgdXAgdW50aWwgdGhpcyBkaXJlY3RpdmUuIFRoaXMgdmFsdWUgd2lsbCBiZSBsYXRlciB1c2VkIHRvXG4gIC8vIHVwZGF0ZSB0aGUgY2FjaGVkIHZhbHVlIG1hcCdzIHRvdGFsIGNvdW50ZXIgdmFsdWUuXG4gIGxldCB0b3RhbFN0eWxpbmdFbnRyaWVzID0gdG90YWxWYWx1ZXM7XG4gIGZvciAobGV0IGkgPSBNYXBCYXNlZE9mZnNldFZhbHVlc0luZGV4LlZhbHVlc1N0YXJ0UG9zaXRpb247IGkgPCBpbmRleDtcbiAgICAgICBpICs9IE1hcEJhc2VkT2Zmc2V0VmFsdWVzSW5kZXguU2l6ZSkge1xuICAgIHRvdGFsU3R5bGluZ0VudHJpZXMgKz0gdmFsdWVzW2kgKyBNYXBCYXNlZE9mZnNldFZhbHVlc0luZGV4LlZhbHVlQ291bnRPZmZzZXRdO1xuICB9XG5cbiAgLy8gYmVjYXVzZSBzdHlsZSB2YWx1ZXMgY29tZSBiZWZvcmUgY2xhc3MgdmFsdWVzIGluIHRoZSBjb250ZXh0IHRoaXMgbWVhbnNcbiAgLy8gdGhhdCBpZiBhbnkgbmV3IHZhbHVlcyB3ZXJlIGluc2VydGVkIHRoZW4gdGhlIGNhY2hlIHZhbHVlcyBhcnJheSBmb3JcbiAgLy8gY2xhc3NlcyBpcyBvdXQgb2Ygc3luYy4gVGhlIGNvZGUgYmVsb3cgd2lsbCB1cGRhdGUgdGhlIG9mZnNldHMgdG8gcG9pbnRcbiAgLy8gdG8gdGhlaXIgbmV3IHZhbHVlcy5cbiAgaWYgKCFlbnRyeUlzQ2xhc3NCYXNlZCkge1xuICAgIGNvbnN0IGNsYXNzQ2FjaGUgPSBjb250ZXh0W1N0eWxpbmdJbmRleC5DYWNoZWRNdWx0aUNsYXNzZXNdO1xuICAgIGNvbnN0IGNsYXNzZXNTdGFydFBvc2l0aW9uID0gY2xhc3NDYWNoZVxuICAgICAgICBbTWFwQmFzZWRPZmZzZXRWYWx1ZXNJbmRleC5WYWx1ZXNTdGFydFBvc2l0aW9uICtcbiAgICAgICAgIE1hcEJhc2VkT2Zmc2V0VmFsdWVzSW5kZXguUG9zaXRpb25TdGFydE9mZnNldF07XG4gICAgY29uc3QgZGlmZkluU3RhcnRQb3NpdGlvbiA9IGVuZFBvc2l0aW9uIC0gY2xhc3Nlc1N0YXJ0UG9zaXRpb247XG4gICAgZm9yIChsZXQgaSA9IE1hcEJhc2VkT2Zmc2V0VmFsdWVzSW5kZXguVmFsdWVzU3RhcnRQb3NpdGlvbjsgaSA8IGNsYXNzQ2FjaGUubGVuZ3RoO1xuICAgICAgICAgaSArPSBNYXBCYXNlZE9mZnNldFZhbHVlc0luZGV4LlNpemUpIHtcbiAgICAgIGNsYXNzQ2FjaGVbaSArIE1hcEJhc2VkT2Zmc2V0VmFsdWVzSW5kZXguUG9zaXRpb25TdGFydE9mZnNldF0gKz0gZGlmZkluU3RhcnRQb3NpdGlvbjtcbiAgICB9XG4gIH1cblxuICB2YWx1ZXNbTWFwQmFzZWRPZmZzZXRWYWx1ZXNJbmRleC5FbnRyaWVzQ291bnRQb3NpdGlvbl0gPSB0b3RhbFN0eWxpbmdFbnRyaWVzO1xufVxuXG5mdW5jdGlvbiBoeXBoZW5hdGVFbnRyaWVzKGVudHJpZXM6IHN0cmluZ1tdKTogc3RyaW5nW10ge1xuICBjb25zdCBuZXdFbnRyaWVzOiBzdHJpbmdbXSA9IFtdO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGVudHJpZXMubGVuZ3RoOyBpKyspIHtcbiAgICBuZXdFbnRyaWVzLnB1c2goaHlwaGVuYXRlKGVudHJpZXNbaV0pKTtcbiAgfVxuICByZXR1cm4gbmV3RW50cmllcztcbn1cblxuZnVuY3Rpb24gaHlwaGVuYXRlKHZhbHVlOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gdmFsdWUucmVwbGFjZShcbiAgICAgIC9bYS16XVtBLVpdL2csIG1hdGNoID0+IGAke21hdGNoLmNoYXJBdCgwKX0tJHttYXRjaC5jaGFyQXQoMSkudG9Mb3dlckNhc2UoKX1gKTtcbn1cblxuZnVuY3Rpb24gcmVnaXN0ZXJNdWx0aU1hcEVudHJ5KFxuICAgIGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBkaXJlY3RpdmVJbmRleDogbnVtYmVyLCBlbnRyeUlzQ2xhc3NCYXNlZDogYm9vbGVhbixcbiAgICBzdGFydFBvc2l0aW9uOiBudW1iZXIsIGNvdW50ID0gMCkge1xuICBjb25zdCBjYWNoZWRWYWx1ZXMgPVxuICAgICAgY29udGV4dFtlbnRyeUlzQ2xhc3NCYXNlZCA/IFN0eWxpbmdJbmRleC5DYWNoZWRNdWx0aUNsYXNzZXMgOiBTdHlsaW5nSW5kZXguQ2FjaGVkTXVsdGlTdHlsZXNdO1xuICBpZiAoZGlyZWN0aXZlSW5kZXggPiAwKSB7XG4gICAgY29uc3QgbGltaXQgPSBNYXBCYXNlZE9mZnNldFZhbHVlc0luZGV4LlZhbHVlc1N0YXJ0UG9zaXRpb24gK1xuICAgICAgICAoZGlyZWN0aXZlSW5kZXggKiBNYXBCYXNlZE9mZnNldFZhbHVlc0luZGV4LlNpemUpO1xuICAgIHdoaWxlIChjYWNoZWRWYWx1ZXMubGVuZ3RoIDwgbGltaXQpIHtcbiAgICAgIC8vIHRoaXMgbWVhbnMgdGhhdCBPTkxZIGRpcmVjdGl2ZSBjbGFzcyBzdHlsaW5nIChsaWtlIG5nQ2xhc3MpIHdhcyB1c2VkXG4gICAgICAvLyB0aGVyZWZvcmUgdGhlIHJvb3QgZGlyZWN0aXZlIHdpbGwgc3RpbGwgbmVlZCB0byBiZSBmaWxsZWQgaW4gYXMgd2VsbFxuICAgICAgLy8gYXMgYW55IG90aGVyIGRpcmVjdGl2ZSBzcGFjZXMgaW4gY2FzZSB0aGV5IG9ubHkgdXNlZCBzdGF0aWMgdmFsdWVzXG4gICAgICBjYWNoZWRWYWx1ZXMucHVzaCgwLCBzdGFydFBvc2l0aW9uLCBudWxsLCAwKTtcbiAgICB9XG4gIH1cbiAgY2FjaGVkVmFsdWVzLnB1c2goMCwgc3RhcnRQb3NpdGlvbiwgbnVsbCwgY291bnQpO1xufVxuXG4vKipcbiAqIEluc2VydHMgb3IgdXBkYXRlcyBhbiBleGlzdGluZyBlbnRyeSBpbiB0aGUgcHJvdmlkZWQgYHN0YXRpY1N0eWxlc2AgY29sbGVjdGlvbi5cbiAqXG4gKiBAcGFyYW0gaW5kZXggdGhlIGluZGV4IHJlcHJlc2VudGluZyBhbiBleGlzdGluZyBzdHlsaW5nIGVudHJ5IGluIHRoZSBjb2xsZWN0aW9uOlxuICogIGlmIHByb3ZpZGVkIChudW1lcmljKTogdGhlbiBpdCB3aWxsIHVwZGF0ZSB0aGUgZXhpc3RpbmcgZW50cnkgYXQgdGhlIGdpdmVuIHBvc2l0aW9uXG4gKiAgaWYgbnVsbDogdGhlbiBpdCB3aWxsIGluc2VydCBhIG5ldyBlbnRyeSB3aXRoaW4gdGhlIGNvbGxlY3Rpb25cbiAqIEBwYXJhbSBzdGF0aWNTdHlsZXMgYSBjb2xsZWN0aW9uIG9mIHN0eWxlIG9yIGNsYXNzIGVudHJpZXMgd2hlcmUgdGhlIHZhbHVlIHdpbGxcbiAqICBiZSBpbnNlcnRlZCBvciBwYXRjaGVkXG4gKiBAcGFyYW0gcHJvcCB0aGUgcHJvcGVydHkgdmFsdWUgb2YgdGhlIGVudHJ5IChlLmcuIGB3aWR0aGAgKHN0eWxlcykgb3IgYGZvb2AgKGNsYXNzZXMpKVxuICogQHBhcmFtIHZhbHVlIHRoZSBzdHlsaW5nIHZhbHVlIG9mIHRoZSBlbnRyeSAoZS5nLiBgYWJzb2x1dGVgIChzdHlsZXMpIG9yIGB0cnVlYCAoY2xhc3NlcykpXG4gKiBAcGFyYW0gZGlyZWN0aXZlT3duZXJJbmRleCB0aGUgZGlyZWN0aXZlIG93bmVyIGluZGV4IHZhbHVlIG9mIHRoZSBzdHlsaW5nIHNvdXJjZSByZXNwb25zaWJsZVxuICogICAgICAgIGZvciB0aGVzZSBzdHlsZXMgKHNlZSBgaW50ZXJmYWNlcy9zdHlsaW5nLnRzI2RpcmVjdGl2ZXNgIGZvciBtb3JlIGluZm8pXG4gKiBAcmV0dXJucyB0aGUgaW5kZXggb2YgdGhlIHVwZGF0ZWQgb3IgbmV3IGVudHJ5IHdpdGhpbiB0aGUgY29sbGVjdGlvblxuICovXG5mdW5jdGlvbiBhZGRPclVwZGF0ZVN0YXRpY1N0eWxlKFxuICAgIGluZGV4OiBudW1iZXIgfCBudWxsLCBzdGF0aWNTdHlsZXM6IEluaXRpYWxTdHlsaW5nVmFsdWVzLCBwcm9wOiBzdHJpbmcsXG4gICAgdmFsdWU6IHN0cmluZyB8IGJvb2xlYW4gfCBudWxsLCBkaXJlY3RpdmVPd25lckluZGV4OiBudW1iZXIpIHtcbiAgaWYgKGluZGV4ID09PSBudWxsKSB7XG4gICAgaW5kZXggPSBzdGF0aWNTdHlsZXMubGVuZ3RoO1xuICAgIHN0YXRpY1N0eWxlcy5wdXNoKG51bGwsIG51bGwsIG51bGwpO1xuICAgIHN0YXRpY1N0eWxlc1tpbmRleCArIEluaXRpYWxTdHlsaW5nVmFsdWVzSW5kZXguUHJvcE9mZnNldF0gPSBwcm9wO1xuICB9XG4gIHN0YXRpY1N0eWxlc1tpbmRleCArIEluaXRpYWxTdHlsaW5nVmFsdWVzSW5kZXguVmFsdWVPZmZzZXRdID0gdmFsdWU7XG4gIHN0YXRpY1N0eWxlc1tpbmRleCArIEluaXRpYWxTdHlsaW5nVmFsdWVzSW5kZXguRGlyZWN0aXZlT3duZXJPZmZzZXRdID0gZGlyZWN0aXZlT3duZXJJbmRleDtcbiAgcmV0dXJuIGluZGV4O1xufVxuXG5mdW5jdGlvbiBhc3NlcnRWYWxpZERpcmVjdGl2ZUluZGV4KGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBkaXJlY3RpdmVJbmRleDogbnVtYmVyKSB7XG4gIGNvbnN0IGRpcnMgPSBjb250ZXh0W1N0eWxpbmdJbmRleC5EaXJlY3RpdmVSZWdpc3RyeVBvc2l0aW9uXTtcbiAgY29uc3QgaW5kZXggPSBkaXJlY3RpdmVJbmRleCAqIERpcmVjdGl2ZVJlZ2lzdHJ5VmFsdWVzSW5kZXguU2l6ZTtcbiAgaWYgKGluZGV4ID49IGRpcnMubGVuZ3RoIHx8XG4gICAgICBkaXJzW2luZGV4ICsgRGlyZWN0aXZlUmVnaXN0cnlWYWx1ZXNJbmRleC5TaW5nbGVQcm9wVmFsdWVzSW5kZXhPZmZzZXRdID09PSAtMSkge1xuICAgIHRocm93IG5ldyBFcnJvcignVGhlIHByb3ZpZGVkIGRpcmVjdGl2ZSBpcyBub3QgcmVnaXN0ZXJlZCB3aXRoIHRoZSBzdHlsaW5nIGNvbnRleHQnKTtcbiAgfVxufSJdfQ==