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
            patchInitialStylingValue(initialClasses, (/** @type {?} */ (attr)), true, directiveIndex);
        }
        else if (mode == 2 /* Styles */) {
            initialStyles = initialStyles || context[3 /* InitialStyleValuesPosition */];
            patchInitialStylingValue(initialStyles, (/** @type {?} */ (attr)), attrs[++i], directiveIndex);
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
    // the template/directive can easily find them inside of the `styleProp`
    // and the `classProp` functions without iterating through the entire context.
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
 * Registers the provided multi class values to the context.
 *
 * This function will iterate over the provided `classesInput` values and
 * insert/update or remove them from the context at exactly the right spot.
 *
 * This function also takes in a directive which implies that the styling values will
 * be evaluated for that directive with respect to any other styling that already exists
 * on the context. When there are styles that conflict (e.g. say `ngClass` and `[class]`
 * both update the `foo` className value at the same time) then the styling algorithm code below
 * will decide which one wins based on the directive styling prioritization mechanism. (This
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
 * @param {?=} directiveIndex
 * @return {?}
 */
export function updateClassMap(context, classesInput, directiveIndex = 0) {
    updateStylingMap(context, classesInput, true, directiveIndex);
}
/**
 * Registers the provided multi style values to the context.
 *
 * This function will iterate over the provided `stylesInput` values and
 * insert/update or remove them from the context at exactly the right spot.
 *
 * This function also takes in a directive which implies that the styling values will
 * be evaluated for that directive with respect to any other styling that already exists
 * on the context. When there are styles that conflict (e.g. say `ngStyle` and `[style]`
 * both update the `width` property at the same time) then the styling algorithm code below
 * will decide which one wins based on the directive styling prioritization mechanism. (This
 * mechanism is better explained in render3/interfaces/styling.ts#directives).
 *
 * This function will not render any styling values on screen, but is rather designed to
 * prepare the context for that. `renderStyling` must be called afterwards to render any
 * styling data that was set in this function (note that `updateClassProp` and
 * `updateStyleProp` are designed to be run after this function is run).
 *
 * @param {?} context The styling context that will be updated with the
 *    newly provided style values.
 * @param {?} stylesInput The key/value map of CSS styles that will be used for the update.
 * @param {?=} directiveIndex
 * @return {?}
 */
export function updateStyleMap(context, stylesInput, directiveIndex = 0) {
    updateStylingMap(context, stylesInput, false, directiveIndex);
}
/**
 * @param {?} context
 * @param {?} input
 * @param {?} entryIsClassBased
 * @param {?=} directiveIndex
 * @return {?}
 */
function updateStylingMap(context, input, entryIsClassBased, directiveIndex = 0) {
    ngDevMode && (entryIsClassBased ? ngDevMode.classMap++ : ngDevMode.styleMap++);
    ngDevMode && assertValidDirectiveIndex(context, directiveIndex);
    // early exit (this is what's done to avoid using ctx.bind() to cache the value)
    if (isMultiValueCacheHit(context, entryIsClassBased, directiveIndex, input))
        return;
    input =
        input === NO_CHANGE ? readCachedMapValue(context, entryIsClassBased, directiveIndex) : input;
    /** @type {?} */
    const element = (/** @type {?} */ ((/** @type {?} */ (context[0 /* ElementPosition */]))));
    /** @type {?} */
    const playerBuilder = input instanceof BoundPlayerFactory ?
        new ClassAndStylePlayerBuilder((/** @type {?} */ (input)), element, entryIsClassBased ? 1 /* Class */ : 2 /* Style */) :
        null;
    /** @type {?} */
    const rawValue = playerBuilder ? (/** @type {?} */ (((/** @type {?} */ (input))))).value : input;
    // the position is always the same, but whether the player builder gets set
    // at all (depending if its set) will be reflected in the index value below...
    /** @type {?} */
    const playerBuilderPosition = entryIsClassBased ? 1 /* ClassMapPlayerBuilderPosition */ :
        3 /* StyleMapPlayerBuilderPosition */;
    /** @type {?} */
    let playerBuilderIndex = playerBuilder ? playerBuilderPosition : 0;
    /** @type {?} */
    let playerBuildersAreDirty = false;
    if (hasPlayerBuilderChanged(context, playerBuilder, playerBuilderPosition)) {
        setPlayerBuilder(context, playerBuilder, playerBuilderPosition);
        playerBuildersAreDirty = true;
    }
    // each time a string-based value pops up then it shouldn't require a deep
    // check of what's changed.
    /** @type {?} */
    let startIndex;
    /** @type {?} */
    let endIndex;
    /** @type {?} */
    let propNames;
    /** @type {?} */
    let applyAll = false;
    if (entryIsClassBased) {
        if (typeof rawValue == 'string') {
            propNames = rawValue.split(/\s+/);
            // this boolean is used to avoid having to create a key/value map of `true` values
            // since a className string implies that all those classes are added
            applyAll = true;
        }
        else {
            propNames = rawValue ? Object.keys(rawValue) : EMPTY_ARRAY;
        }
        startIndex = getMultiClassesStartIndex(context);
        endIndex = context.length;
    }
    else {
        startIndex = getMultiStylesStartIndex(context);
        endIndex = getMultiClassesStartIndex(context);
        propNames = rawValue ? Object.keys(rawValue) : EMPTY_ARRAY;
    }
    /** @type {?} */
    const values = (/** @type {?} */ ((rawValue || EMPTY_OBJ)));
    patchStylingMapIntoContext(context, directiveIndex, playerBuilderIndex, startIndex, endIndex, propNames, applyAll || values, input, entryIsClassBased);
    if (playerBuildersAreDirty) {
        setContextPlayersDirty(context, true);
    }
    ngDevMode && (entryIsClassBased ? ngDevMode.classMapCacheMiss++ : ngDevMode.styleMapCacheMiss++);
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
    // can't write to a region that it wrote to before (which may have been a part of another
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
    // Remove (nullify) any existing entries in the context that were not a part of the
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
    if (ngDevMode) {
        if (isClassBased) {
            ngDevMode.classProp++;
        }
        else {
            ngDevMode.styleProp++;
        }
    }
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
            setSanitizeFlag(context, singleIndex, (sanitizer && sanitizer(prop, null, 1 /* ValidateProperty */)) ? true : false);
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
        if (ngDevMode) {
            if (isClassBased) {
                ngDevMode.classPropCacheMiss++;
            }
            else {
                ngDevMode.stylePropCacheMiss++;
            }
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
    ngDevMode && ngDevMode.flushStyling++;
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
    value =
        sanitizer && value ? sanitizer(prop, value, 3 /* ValidateAndSanitize */) : value;
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
    let flag = (sanitizer && sanitizer(prop, null, 1 /* ValidateProperty */)) ?
        4 /* Sanitize */ :
        0 /* None */;
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
export function getSinglePropIndexValue(context, directiveIndex, offset, isClassBased) {
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
 * Returns the current cached multi-value for a given directiveIndex within the provided context.
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
 * entries that exist as a part of other directives) to be dirty as well. This will force the
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xhc3NfYW5kX3N0eWxlX2JpbmRpbmdzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9zdHlsaW5nL2NsYXNzX2FuZF9zdHlsZV9iaW5kaW5ncy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7O0FBUUEsT0FBTyxFQUFDLFdBQVcsRUFBRSxTQUFTLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFHaEQsT0FBTyxFQUFzQixtQkFBbUIsRUFBRSxvQkFBb0IsRUFBQyxNQUFNLHdCQUF3QixDQUFDO0FBR3RHLE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxXQUFXLENBQUM7QUFDcEMsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLDhCQUE4QixDQUFDO0FBRTVELE9BQU8sRUFBQyxVQUFVLElBQUksK0JBQStCLEVBQUUsVUFBVSxJQUFJLDBCQUEwQixFQUFDLE1BQU0sMkJBQTJCLENBQUM7QUFDbEksT0FBTyxFQUFDLGtCQUFrQixFQUFDLE1BQU0sa0JBQWtCLENBQUM7QUFDcEQsT0FBTyxFQUFDLGlCQUFpQixFQUFFLGtCQUFrQixFQUFFLG9DQUFvQyxFQUFFLHlCQUF5QixFQUFFLGdCQUFnQixFQUFDLE1BQU0sUUFBUSxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQXdCaEosTUFBTSxVQUFVLHVCQUF1QixDQUNuQyxLQUFrQixFQUFFLGlCQUF5QixFQUFFLGlCQUF5QixDQUFDOztVQUNyRSxPQUFPLEdBQUcseUJBQXlCLEVBQUU7SUFDM0MsMkJBQTJCLENBQUMsT0FBTyxFQUFFLEtBQUssRUFBRSxpQkFBaUIsRUFBRSxjQUFjLENBQUMsQ0FBQztJQUMvRSxPQUFPLE9BQU8sQ0FBQztBQUNqQixDQUFDOzs7Ozs7Ozs7Ozs7O0FBWUQsTUFBTSxVQUFVLDJCQUEyQixDQUN2QyxPQUF1QixFQUFFLEtBQWtCLEVBQUUsc0JBQThCLEVBQzNFLGNBQXNCO0lBQ3hCLCtE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O0lBQ0QsWUFBWSxDQUFDLEtBQUssc0JBQXdDLENBQUMsR0FBRyxLQUFLLENBQUM7SUFDcEUsWUFBWSxDQUFDLEtBQUssK0JBQWlELENBQUMsR0FBRyxtQkFBbUIsQ0FBQztJQUMzRixPQUFPLEtBQUssQ0FBQztBQUNmLENBQUM7Ozs7OztBQUVELFNBQVMseUJBQXlCLENBQUMsT0FBdUIsRUFBRSxjQUFzQjs7VUFDMUUsSUFBSSxHQUFHLE9BQU8sbUNBQXdDOztVQUN0RCxLQUFLLEdBQUcsY0FBYyxlQUFvQztJQUNoRSxJQUFJLEtBQUssSUFBSSxJQUFJLENBQUMsTUFBTTtRQUNwQixJQUFJLENBQUMsS0FBSyxzQ0FBMkQsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFO1FBQ2pGLE1BQU0sSUFBSSxLQUFLLENBQUMsbUVBQW1FLENBQUMsQ0FBQztLQUN0RjtBQUNILENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiogQGxpY2Vuc2VcbiogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4qXG4qIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4qIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiovXG5pbXBvcnQge1N0eWxlU2FuaXRpemVGbiwgU3R5bGVTYW5pdGl6ZU1vZGV9IGZyb20gJy4uLy4uL3Nhbml0aXphdGlvbi9zdHlsZV9zYW5pdGl6ZXInO1xuaW1wb3J0IHtFTVBUWV9BUlJBWSwgRU1QVFlfT0JKfSBmcm9tICcuLi9lbXB0eSc7XG5pbXBvcnQge0F0dHJpYnV0ZU1hcmtlciwgVEF0dHJpYnV0ZXN9IGZyb20gJy4uL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge0JpbmRpbmdTdG9yZSwgQmluZGluZ1R5cGUsIFBsYXllciwgUGxheWVyQnVpbGRlciwgUGxheWVyRmFjdG9yeSwgUGxheWVySW5kZXh9IGZyb20gJy4uL2ludGVyZmFjZXMvcGxheWVyJztcbmltcG9ydCB7UkVsZW1lbnQsIFJlbmRlcmVyMywgUmVuZGVyZXJTdHlsZUZsYWdzMywgaXNQcm9jZWR1cmFsUmVuZGVyZXJ9IGZyb20gJy4uL2ludGVyZmFjZXMvcmVuZGVyZXInO1xuaW1wb3J0IHtEaXJlY3RpdmVPd25lckFuZFBsYXllckJ1aWxkZXJJbmRleCwgRGlyZWN0aXZlUmVnaXN0cnlWYWx1ZXNJbmRleCwgSW5pdGlhbFN0eWxpbmdWYWx1ZXMsIEluaXRpYWxTdHlsaW5nVmFsdWVzSW5kZXgsIE1hcEJhc2VkT2Zmc2V0VmFsdWVzLCBNYXBCYXNlZE9mZnNldFZhbHVlc0luZGV4LCBTaW5nbGVQcm9wT2Zmc2V0VmFsdWVzLCBTaW5nbGVQcm9wT2Zmc2V0VmFsdWVzSW5kZXgsIFN0eWxpbmdDb250ZXh0LCBTdHlsaW5nRmxhZ3MsIFN0eWxpbmdJbmRleH0gZnJvbSAnLi4vaW50ZXJmYWNlcy9zdHlsaW5nJztcbmltcG9ydCB7TFZpZXcsIFJvb3RDb250ZXh0fSBmcm9tICcuLi9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHtOT19DSEFOR0V9IGZyb20gJy4uL3Rva2Vucyc7XG5pbXBvcnQge2dldFJvb3RDb250ZXh0fSBmcm9tICcuLi91dGlsL3ZpZXdfdHJhdmVyc2FsX3V0aWxzJztcblxuaW1wb3J0IHthbGxvd0ZsdXNoIGFzIGFsbG93SG9zdEluc3RydWN0aW9uc1F1ZXVlRmx1c2gsIGZsdXNoUXVldWUgYXMgZmx1c2hIb3N0SW5zdHJ1Y3Rpb25zUXVldWV9IGZyb20gJy4vaG9zdF9pbnN0cnVjdGlvbnNfcXVldWUnO1xuaW1wb3J0IHtCb3VuZFBsYXllckZhY3Rvcnl9IGZyb20gJy4vcGxheWVyX2ZhY3RvcnknO1xuaW1wb3J0IHthZGRQbGF5ZXJJbnRlcm5hbCwgYWxsb2NQbGF5ZXJDb250ZXh0LCBhbGxvY2F0ZU9yVXBkYXRlRGlyZWN0aXZlSW50b0NvbnRleHQsIGNyZWF0ZUVtcHR5U3R5bGluZ0NvbnRleHQsIGdldFBsYXllckNvbnRleHR9IGZyb20gJy4vdXRpbCc7XG5cblxuLyoqXG4gKiBUaGlzIGZpbGUgaW5jbHVkZXMgdGhlIGNvZGUgdG8gcG93ZXIgYWxsIHN0eWxpbmctYmluZGluZyBvcGVyYXRpb25zIGluIEFuZ3VsYXIuXG4gKlxuICogVGhlc2UgaW5jbHVkZTpcbiAqIFtzdHlsZV09XCJteVN0eWxlT2JqXCJcbiAqIFtjbGFzc109XCJteUNsYXNzT2JqXCJcbiAqIFtzdHlsZS5wcm9wXT1cIm15UHJvcFZhbHVlXCJcbiAqIFtjbGFzcy5uYW1lXT1cIm15Q2xhc3NWYWx1ZVwiXG4gKlxuICogSXQgYWxzbyBpbmNsdWRlcyBjb2RlIHRoYXQgd2lsbCBhbGxvdyBzdHlsZSBiaW5kaW5nIGNvZGUgdG8gb3BlcmF0ZSB3aXRoaW4gaG9zdFxuICogYmluZGluZ3MgZm9yIGNvbXBvbmVudHMvZGlyZWN0aXZlcy5cbiAqXG4gKiBUaGVyZSBhcmUgbWFueSBkaWZmZXJlbnQgd2F5cyBpbiB3aGljaCB0aGVzZSBmdW5jdGlvbnMgYmVsb3cgYXJlIGNhbGxlZC4gUGxlYXNlIHNlZVxuICogYHJlbmRlcjMvaW50ZXJmYWNlcy9zdHlsaW5nLnRzYCB0byBnZXQgYSBiZXR0ZXIgaWRlYSBvZiBob3cgdGhlIHN0eWxpbmcgYWxnb3JpdGhtIHdvcmtzLlxuICovXG5cblxuXG4vKipcbiAqIENyZWF0ZXMgYSBuZXcgU3R5bGluZ0NvbnRleHQgYW4gZmlsbHMgaXQgd2l0aCB0aGUgcHJvdmlkZWQgc3RhdGljIHN0eWxpbmcgYXR0cmlidXRlIHZhbHVlcy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluaXRpYWxpemVTdGF0aWNDb250ZXh0KFxuICAgIGF0dHJzOiBUQXR0cmlidXRlcywgc3R5bGluZ1N0YXJ0SW5kZXg6IG51bWJlciwgZGlyZWN0aXZlSW5kZXg6IG51bWJlciA9IDApOiBTdHlsaW5nQ29udGV4dCB7XG4gIGNvbnN0IGNvbnRleHQgPSBjcmVhdGVFbXB0eVN0eWxpbmdDb250ZXh0KCk7XG4gIHBhdGNoQ29udGV4dFdpdGhTdGF0aWNBdHRycyhjb250ZXh0LCBhdHRycywgc3R5bGluZ1N0YXJ0SW5kZXgsIGRpcmVjdGl2ZUluZGV4KTtcbiAgcmV0dXJuIGNvbnRleHQ7XG59XG5cbi8qKlxuICogRGVzaWduZWQgdG8gdXBkYXRlIGFuIGV4aXN0aW5nIHN0eWxpbmcgY29udGV4dCB3aXRoIG5ldyBzdGF0aWMgc3R5bGluZ1xuICogZGF0YSAoY2xhc3NlcyBhbmQgc3R5bGVzKS5cbiAqXG4gKiBAcGFyYW0gY29udGV4dCB0aGUgZXhpc3Rpbmcgc3R5bGluZyBjb250ZXh0XG4gKiBAcGFyYW0gYXR0cnMgYW4gYXJyYXkgb2YgbmV3IHN0YXRpYyBzdHlsaW5nIGF0dHJpYnV0ZXMgdGhhdCB3aWxsIGJlXG4gKiAgICAgICAgICAgICAgYXNzaWduZWQgdG8gdGhlIGNvbnRleHRcbiAqIEBwYXJhbSBhdHRyc1N0eWxpbmdTdGFydEluZGV4IHdoYXQgaW5kZXggdG8gc3RhcnQgaXRlcmF0aW5nIHdpdGhpbiB0aGVcbiAqICAgICAgICAgICAgICBwcm92aWRlZCBgYXR0cnNgIGFycmF5IHRvIHN0YXJ0IHJlYWRpbmcgc3R5bGUgYW5kIGNsYXNzIHZhbHVlc1xuICovXG5leHBvcnQgZnVuY3Rpb24gcGF0Y2hDb250ZXh0V2l0aFN0YXRpY0F0dHJzKFxuICAgIGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBhdHRyczogVEF0dHJpYnV0ZXMsIGF0dHJzU3R5bGluZ1N0YXJ0SW5kZXg6IG51bWJlcixcbiAgICBkaXJlY3RpdmVJbmRleDogbnVtYmVyKTogdm9pZCB7XG4gIC8vIHRoaXMgbWVhbnMgdGhlIGNvbnRleHQgaGFzIGFscmVhZHkgYmVlbiBzZXQgYW5kIGluc3RhbnRpYXRlZFxuICBpZiAoY29udGV4dFtTdHlsaW5nSW5kZXguTWFzdGVyRmxhZ1Bvc2l0aW9uXSAmIFN0eWxpbmdGbGFncy5CaW5kaW5nQWxsb2NhdGlvbkxvY2tlZCkgcmV0dXJuO1xuXG4gIGFsbG9jYXRlT3JVcGRhdGVEaXJlY3RpdmVJbnRvQ29udGV4dChjb250ZXh0LCBkaXJlY3RpdmVJbmRleCk7XG5cbiAgbGV0IGluaXRpYWxDbGFzc2VzOiBJbml0aWFsU3R5bGluZ1ZhbHVlc3xudWxsID0gbnVsbDtcbiAgbGV0IGluaXRpYWxTdHlsZXM6IEluaXRpYWxTdHlsaW5nVmFsdWVzfG51bGwgPSBudWxsO1xuICBsZXQgbW9kZSA9IC0xO1xuICBmb3IgKGxldCBpID0gYXR0cnNTdHlsaW5nU3RhcnRJbmRleDsgaSA8IGF0dHJzLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgYXR0ciA9IGF0dHJzW2ldO1xuICAgIGlmICh0eXBlb2YgYXR0ciA9PSAnbnVtYmVyJykge1xuICAgICAgbW9kZSA9IGF0dHI7XG4gICAgfSBlbHNlIGlmIChtb2RlID09IEF0dHJpYnV0ZU1hcmtlci5DbGFzc2VzKSB7XG4gICAgICBpbml0aWFsQ2xhc3NlcyA9IGluaXRpYWxDbGFzc2VzIHx8IGNvbnRleHRbU3R5bGluZ0luZGV4LkluaXRpYWxDbGFzc1ZhbHVlc1Bvc2l0aW9uXTtcbiAgICAgIHBhdGNoSW5pdGlhbFN0eWxpbmdWYWx1ZShpbml0aWFsQ2xhc3NlcywgYXR0ciBhcyBzdHJpbmcsIHRydWUsIGRpcmVjdGl2ZUluZGV4KTtcbiAgICB9IGVsc2UgaWYgKG1vZGUgPT0gQXR0cmlidXRlTWFya2VyLlN0eWxlcykge1xuICAgICAgaW5pdGlhbFN0eWxlcyA9IGluaXRpYWxTdHlsZXMgfHwgY29udGV4dFtTdHlsaW5nSW5kZXguSW5pdGlhbFN0eWxlVmFsdWVzUG9zaXRpb25dO1xuICAgICAgcGF0Y2hJbml0aWFsU3R5bGluZ1ZhbHVlKGluaXRpYWxTdHlsZXMsIGF0dHIgYXMgc3RyaW5nLCBhdHRyc1srK2ldLCBkaXJlY3RpdmVJbmRleCk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogRGVzaWduZWQgdG8gYWRkIGEgc3R5bGUgb3IgY2xhc3MgdmFsdWUgaW50byB0aGUgZXhpc3Rpbmcgc2V0IG9mIGluaXRpYWwgc3R5bGVzLlxuICpcbiAqIFRoZSBmdW5jdGlvbiB3aWxsIHNlYXJjaCBhbmQgZmlndXJlIG91dCBpZiBhIHN0eWxlL2NsYXNzIHZhbHVlIGlzIGFscmVhZHkgcHJlc2VudFxuICogd2l0aGluIHRoZSBwcm92aWRlZCBpbml0aWFsIHN0eWxpbmcgYXJyYXkuIElmIGFuZCB3aGVuIGEgc3R5bGUvY2xhc3MgdmFsdWUgaXNcbiAqIHByZXNlbnQgKGFsbG9jYXRlZCkgdGhlbiB0aGUgY29kZSBiZWxvdyB3aWxsIHNldCB0aGUgbmV3IHZhbHVlIGRlcGVuZGluZyBvbiB0aGVcbiAqIGZvbGxvd2luZyBjYXNlczpcbiAqXG4gKiAgMSkgaWYgdGhlIGV4aXN0aW5nIHZhbHVlIGlzIGZhbHN5ICh0aGlzIGhhcHBlbnMgYmVjYXVzZSBhIGBbY2xhc3MucHJvcF1gIG9yXG4gKiAgICAgYFtzdHlsZS5wcm9wXWAgYmluZGluZyB3YXMgc2V0LCBidXQgdGhlcmUgd2Fzbid0IGEgbWF0Y2hpbmcgc3RhdGljIHN0eWxlXG4gKiAgICAgb3IgY2xhc3MgcHJlc2VudCBvbiB0aGUgY29udGV4dClcbiAqICAyKSBpZiB0aGUgdmFsdWUgd2FzIHNldCBhbHJlYWR5IGJ5IHRoZSB0ZW1wbGF0ZSwgY29tcG9uZW50IG9yIGRpcmVjdGl2ZSwgYnV0IHRoZVxuICogICAgIG5ldyB2YWx1ZSBpcyBzZXQgb24gYSBoaWdoZXIgbGV2ZWwgKGkuZS4gYSBzdWIgY29tcG9uZW50IHdoaWNoIGV4dGVuZHMgYSBwYXJlbnRcbiAqICAgICBjb21wb25lbnQgc2V0cyBpdHMgdmFsdWUgYWZ0ZXIgdGhlIHBhcmVudCBoYXMgYWxyZWFkeSBzZXQgdGhlIHNhbWUgb25lKVxuICogIDMpIGlmIHRoZSBzYW1lIGRpcmVjdGl2ZSBwcm92aWRlcyBhIG5ldyBzZXQgb2Ygc3R5bGluZyB2YWx1ZXMgdG8gc2V0XG4gKlxuICogQHBhcmFtIGluaXRpYWxTdHlsaW5nIHRoZSBpbml0aWFsIHN0eWxpbmcgYXJyYXkgd2hlcmUgdGhlIG5ldyBzdHlsaW5nIGVudHJ5IHdpbGwgYmUgYWRkZWQgdG9cbiAqIEBwYXJhbSBwcm9wIHRoZSBwcm9wZXJ0eSB2YWx1ZSBvZiB0aGUgbmV3IGVudHJ5IChlLmcuIGB3aWR0aGAgKHN0eWxlcykgb3IgYGZvb2AgKGNsYXNzZXMpKVxuICogQHBhcmFtIHZhbHVlIHRoZSBzdHlsaW5nIHZhbHVlIG9mIHRoZSBuZXcgZW50cnkgKGUuZy4gYGFic29sdXRlYCAoc3R5bGVzKSBvciBgdHJ1ZWAgKGNsYXNzZXMpKVxuICogQHBhcmFtIGRpcmVjdGl2ZU93bmVySW5kZXggdGhlIGRpcmVjdGl2ZSBvd25lciBpbmRleCB2YWx1ZSBvZiB0aGUgc3R5bGluZyBzb3VyY2UgcmVzcG9uc2libGVcbiAqICAgICAgICBmb3IgdGhlc2Ugc3R5bGVzIChzZWUgYGludGVyZmFjZXMvc3R5bGluZy50cyNkaXJlY3RpdmVzYCBmb3IgbW9yZSBpbmZvKVxuICovXG5mdW5jdGlvbiBwYXRjaEluaXRpYWxTdHlsaW5nVmFsdWUoXG4gICAgaW5pdGlhbFN0eWxpbmc6IEluaXRpYWxTdHlsaW5nVmFsdWVzLCBwcm9wOiBzdHJpbmcsIHZhbHVlOiBhbnksXG4gICAgZGlyZWN0aXZlT3duZXJJbmRleDogbnVtYmVyKTogdm9pZCB7XG4gIGZvciAobGV0IGkgPSBJbml0aWFsU3R5bGluZ1ZhbHVlc0luZGV4LktleVZhbHVlU3RhcnRQb3NpdGlvbjsgaSA8IGluaXRpYWxTdHlsaW5nLmxlbmd0aDtcbiAgICAgICBpICs9IEluaXRpYWxTdHlsaW5nVmFsdWVzSW5kZXguU2l6ZSkge1xuICAgIGNvbnN0IGtleSA9IGluaXRpYWxTdHlsaW5nW2kgKyBJbml0aWFsU3R5bGluZ1ZhbHVlc0luZGV4LlByb3BPZmZzZXRdO1xuICAgIGlmIChrZXkgPT09IHByb3ApIHtcbiAgICAgIGNvbnN0IGV4aXN0aW5nVmFsdWUgPVxuICAgICAgICAgIGluaXRpYWxTdHlsaW5nW2kgKyBJbml0aWFsU3R5bGluZ1ZhbHVlc0luZGV4LlZhbHVlT2Zmc2V0XSBhcyBzdHJpbmcgfCBudWxsIHwgYm9vbGVhbjtcbiAgICAgIGNvbnN0IGV4aXN0aW5nT3duZXIgPVxuICAgICAgICAgIGluaXRpYWxTdHlsaW5nW2kgKyBJbml0aWFsU3R5bGluZ1ZhbHVlc0luZGV4LkRpcmVjdGl2ZU93bmVyT2Zmc2V0XSBhcyBudW1iZXI7XG4gICAgICBpZiAoYWxsb3dWYWx1ZUNoYW5nZShleGlzdGluZ1ZhbHVlLCB2YWx1ZSwgZXhpc3RpbmdPd25lciwgZGlyZWN0aXZlT3duZXJJbmRleCkpIHtcbiAgICAgICAgYWRkT3JVcGRhdGVTdGF0aWNTdHlsZShpLCBpbml0aWFsU3R5bGluZywgcHJvcCwgdmFsdWUsIGRpcmVjdGl2ZU93bmVySW5kZXgpO1xuICAgICAgfVxuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgfVxuXG4gIC8vIFdlIGRpZCBub3QgZmluZCBleGlzdGluZyBrZXksIGFkZCBhIG5ldyBvbmUuXG4gIGFkZE9yVXBkYXRlU3RhdGljU3R5bGUobnVsbCwgaW5pdGlhbFN0eWxpbmcsIHByb3AsIHZhbHVlLCBkaXJlY3RpdmVPd25lckluZGV4KTtcbn1cblxuLyoqXG4gKiBSdW5zIHRocm91Z2ggdGhlIGluaXRpYWwgY2xhc3MgdmFsdWVzIHByZXNlbnQgaW4gdGhlIHByb3ZpZGVkXG4gKiBjb250ZXh0IGFuZCByZW5kZXJzIHRoZW0gdmlhIHRoZSBwcm92aWRlZCByZW5kZXJlciBvbiB0aGUgZWxlbWVudC5cbiAqXG4gKiBAcGFyYW0gZWxlbWVudCB0aGUgZWxlbWVudCB0aGUgc3R5bGluZyB3aWxsIGJlIGFwcGxpZWQgdG9cbiAqIEBwYXJhbSBjb250ZXh0IHRoZSBzb3VyY2Ugc3R5bGluZyBjb250ZXh0IHdoaWNoIGNvbnRhaW5zIHRoZSBpbml0aWFsIGNsYXNzIHZhbHVlc1xuICogQHBhcmFtIHJlbmRlcmVyIHRoZSByZW5kZXJlciBpbnN0YW5jZSB0aGF0IHdpbGwgYmUgdXNlZCB0byBhcHBseSB0aGUgY2xhc3NcbiAqIEByZXR1cm5zIHRoZSBpbmRleCB0aGF0IHRoZSBjbGFzc2VzIHdlcmUgYXBwbGllZCB1cCB1bnRpbFxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVuZGVySW5pdGlhbENsYXNzZXMoXG4gICAgZWxlbWVudDogUkVsZW1lbnQsIGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCByZW5kZXJlcjogUmVuZGVyZXIzLCBzdGFydEluZGV4PzogbnVtYmVyKTogbnVtYmVyIHtcbiAgY29uc3QgaW5pdGlhbENsYXNzZXMgPSBjb250ZXh0W1N0eWxpbmdJbmRleC5Jbml0aWFsQ2xhc3NWYWx1ZXNQb3NpdGlvbl07XG4gIGxldCBpID0gc3RhcnRJbmRleCB8fCBJbml0aWFsU3R5bGluZ1ZhbHVlc0luZGV4LktleVZhbHVlU3RhcnRQb3NpdGlvbjtcbiAgd2hpbGUgKGkgPCBpbml0aWFsQ2xhc3Nlcy5sZW5ndGgpIHtcbiAgICBjb25zdCB2YWx1ZSA9IGluaXRpYWxDbGFzc2VzW2kgKyBJbml0aWFsU3R5bGluZ1ZhbHVlc0luZGV4LlZhbHVlT2Zmc2V0XTtcbiAgICBpZiAodmFsdWUpIHtcbiAgICAgIHNldENsYXNzKFxuICAgICAgICAgIGVsZW1lbnQsIGluaXRpYWxDbGFzc2VzW2kgKyBJbml0aWFsU3R5bGluZ1ZhbHVlc0luZGV4LlByb3BPZmZzZXRdIGFzIHN0cmluZywgdHJ1ZSxcbiAgICAgICAgICByZW5kZXJlciwgbnVsbCk7XG4gICAgfVxuICAgIGkgKz0gSW5pdGlhbFN0eWxpbmdWYWx1ZXNJbmRleC5TaXplO1xuICB9XG4gIHJldHVybiBpO1xufVxuXG4vKipcbiAqIFJ1bnMgdGhyb3VnaCB0aGUgaW5pdGlhbCBzdHlsZXMgdmFsdWVzIHByZXNlbnQgaW4gdGhlIHByb3ZpZGVkXG4gKiBjb250ZXh0IGFuZCByZW5kZXJzIHRoZW0gdmlhIHRoZSBwcm92aWRlZCByZW5kZXJlciBvbiB0aGUgZWxlbWVudC5cbiAqXG4gKiBAcGFyYW0gZWxlbWVudCB0aGUgZWxlbWVudCB0aGUgc3R5bGluZyB3aWxsIGJlIGFwcGxpZWQgdG9cbiAqIEBwYXJhbSBjb250ZXh0IHRoZSBzb3VyY2Ugc3R5bGluZyBjb250ZXh0IHdoaWNoIGNvbnRhaW5zIHRoZSBpbml0aWFsIGNsYXNzIHZhbHVlc1xuICogQHBhcmFtIHJlbmRlcmVyIHRoZSByZW5kZXJlciBpbnN0YW5jZSB0aGF0IHdpbGwgYmUgdXNlZCB0byBhcHBseSB0aGUgY2xhc3NcbiAqIEByZXR1cm5zIHRoZSBpbmRleCB0aGF0IHRoZSBzdHlsZXMgd2VyZSBhcHBsaWVkIHVwIHVudGlsXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZW5kZXJJbml0aWFsU3R5bGVzKFxuICAgIGVsZW1lbnQ6IFJFbGVtZW50LCBjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgcmVuZGVyZXI6IFJlbmRlcmVyMywgc3RhcnRJbmRleD86IG51bWJlcikge1xuICBjb25zdCBpbml0aWFsU3R5bGVzID0gY29udGV4dFtTdHlsaW5nSW5kZXguSW5pdGlhbFN0eWxlVmFsdWVzUG9zaXRpb25dO1xuICBsZXQgaSA9IHN0YXJ0SW5kZXggfHwgSW5pdGlhbFN0eWxpbmdWYWx1ZXNJbmRleC5LZXlWYWx1ZVN0YXJ0UG9zaXRpb247XG4gIHdoaWxlIChpIDwgaW5pdGlhbFN0eWxlcy5sZW5ndGgpIHtcbiAgICBjb25zdCB2YWx1ZSA9IGluaXRpYWxTdHlsZXNbaSArIEluaXRpYWxTdHlsaW5nVmFsdWVzSW5kZXguVmFsdWVPZmZzZXRdO1xuICAgIGlmICh2YWx1ZSkge1xuICAgICAgc2V0U3R5bGUoXG4gICAgICAgICAgZWxlbWVudCwgaW5pdGlhbFN0eWxlc1tpICsgSW5pdGlhbFN0eWxpbmdWYWx1ZXNJbmRleC5Qcm9wT2Zmc2V0XSBhcyBzdHJpbmcsXG4gICAgICAgICAgdmFsdWUgYXMgc3RyaW5nLCByZW5kZXJlciwgbnVsbCk7XG4gICAgfVxuICAgIGkgKz0gSW5pdGlhbFN0eWxpbmdWYWx1ZXNJbmRleC5TaXplO1xuICB9XG4gIHJldHVybiBpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYWxsb3dOZXdCaW5kaW5nc0ZvclN0eWxpbmdDb250ZXh0KGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0KTogYm9vbGVhbiB7XG4gIHJldHVybiAoY29udGV4dFtTdHlsaW5nSW5kZXguTWFzdGVyRmxhZ1Bvc2l0aW9uXSAmIFN0eWxpbmdGbGFncy5CaW5kaW5nQWxsb2NhdGlvbkxvY2tlZCkgPT09IDA7XG59XG5cbi8qKlxuICogQWRkcyBpbiBuZXcgYmluZGluZyB2YWx1ZXMgdG8gYSBzdHlsaW5nIGNvbnRleHQuXG4gKlxuICogSWYgYSBkaXJlY3RpdmUgdmFsdWUgaXMgcHJvdmlkZWQgdGhlbiBhbGwgcHJvdmlkZWQgY2xhc3Mvc3R5bGUgYmluZGluZyBuYW1lcyB3aWxsXG4gKiByZWZlcmVuY2UgdGhlIHByb3ZpZGVkIGRpcmVjdGl2ZS5cbiAqXG4gKiBAcGFyYW0gY29udGV4dCB0aGUgZXhpc3Rpbmcgc3R5bGluZyBjb250ZXh0XG4gKiBAcGFyYW0gY2xhc3NCaW5kaW5nTmFtZXMgYW4gYXJyYXkgb2YgY2xhc3MgYmluZGluZyBuYW1lcyB0aGF0IHdpbGwgYmUgYWRkZWQgdG8gdGhlIGNvbnRleHRcbiAqIEBwYXJhbSBzdHlsZUJpbmRpbmdOYW1lcyBhbiBhcnJheSBvZiBzdHlsZSBiaW5kaW5nIG5hbWVzIHRoYXQgd2lsbCBiZSBhZGRlZCB0byB0aGUgY29udGV4dFxuICogQHBhcmFtIHN0eWxlU2FuaXRpemVyIGFuIG9wdGlvbmFsIHNhbml0aXplciB0aGF0IGhhbmRsZSBhbGwgc2FuaXRpemF0aW9uIG9uIGZvciBlYWNoIG9mXG4gKiAgICB0aGUgYmluZGluZ3MgYWRkZWQgdG8gdGhlIGNvbnRleHQuIE5vdGUgdGhhdCBpZiBhIGRpcmVjdGl2ZSBpcyBwcm92aWRlZCB0aGVuIHRoZSBzYW5pdGl6ZXJcbiAqICAgIGluc3RhbmNlIHdpbGwgb25seSBiZSBhY3RpdmUgaWYgYW5kIHdoZW4gdGhlIGRpcmVjdGl2ZSB1cGRhdGVzIHRoZSBiaW5kaW5ncyB0aGF0IGl0IG93bnMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB1cGRhdGVDb250ZXh0V2l0aEJpbmRpbmdzKFxuICAgIGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBkaXJlY3RpdmVJbmRleDogbnVtYmVyLCBjbGFzc0JpbmRpbmdOYW1lcz86IHN0cmluZ1tdIHwgbnVsbCxcbiAgICBzdHlsZUJpbmRpbmdOYW1lcz86IHN0cmluZ1tdIHwgbnVsbCwgc3R5bGVTYW5pdGl6ZXI/OiBTdHlsZVNhbml0aXplRm4gfCBudWxsKSB7XG4gIGlmIChjb250ZXh0W1N0eWxpbmdJbmRleC5NYXN0ZXJGbGFnUG9zaXRpb25dICYgU3R5bGluZ0ZsYWdzLkJpbmRpbmdBbGxvY2F0aW9uTG9ja2VkKSByZXR1cm47XG5cbiAgLy8gdGhpcyBtZWFucyB0aGUgY29udGV4dCBoYXMgYWxyZWFkeSBiZWVuIHBhdGNoZWQgd2l0aCB0aGUgZGlyZWN0aXZlJ3MgYmluZGluZ3NcbiAgY29uc3QgaXNOZXdEaXJlY3RpdmUgPVxuICAgICAgZmluZE9yUGF0Y2hEaXJlY3RpdmVJbnRvUmVnaXN0cnkoY29udGV4dCwgZGlyZWN0aXZlSW5kZXgsIGZhbHNlLCBzdHlsZVNhbml0aXplcik7XG4gIGlmICghaXNOZXdEaXJlY3RpdmUpIHtcbiAgICAvLyB0aGlzIG1lYW5zIHRoZSBkaXJlY3RpdmUgaGFzIGFscmVhZHkgYmVlbiBwYXRjaGVkIGluIC4uLiBObyBwb2ludCBpbiBkb2luZyBhbnl0aGluZ1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGlmIChzdHlsZUJpbmRpbmdOYW1lcykge1xuICAgIHN0eWxlQmluZGluZ05hbWVzID0gaHlwaGVuYXRlRW50cmllcyhzdHlsZUJpbmRpbmdOYW1lcyk7XG4gIH1cblxuICAvLyB0aGVyZSBhcmUgYWxvdCBvZiB2YXJpYWJsZXMgYmVpbmcgdXNlZCBiZWxvdyB0byB0cmFjayB3aGVyZSBpbiB0aGUgY29udGV4dCB0aGUgbmV3XG4gIC8vIGJpbmRpbmcgdmFsdWVzIHdpbGwgYmUgcGxhY2VkLiBCZWNhdXNlIHRoZSBjb250ZXh0IGNvbnNpc3RzIG9mIG11bHRpcGxlIHR5cGVzIG9mXG4gIC8vIGVudHJpZXMgKHNpbmdsZSBjbGFzc2VzL3N0eWxlcyBhbmQgbXVsdGkgY2xhc3Nlcy9zdHlsZXMpIGFsb3Qgb2YgdGhlIGluZGV4IHBvc2l0aW9uc1xuICAvLyBuZWVkIHRvIGJlIGNvbXB1dGVkIGFoZWFkIG9mIHRpbWUgYW5kIHRoZSBjb250ZXh0IG5lZWRzIHRvIGJlIGV4dGVuZGVkIGJlZm9yZSB0aGUgdmFsdWVzXG4gIC8vIGFyZSBpbnNlcnRlZCBpbi5cbiAgY29uc3Qgc2luZ2xlUHJvcE9mZnNldFZhbHVlcyA9IGNvbnRleHRbU3R5bGluZ0luZGV4LlNpbmdsZVByb3BPZmZzZXRQb3NpdGlvbnNdO1xuICBjb25zdCB0b3RhbEN1cnJlbnRDbGFzc0JpbmRpbmdzID1cbiAgICAgIHNpbmdsZVByb3BPZmZzZXRWYWx1ZXNbU2luZ2xlUHJvcE9mZnNldFZhbHVlc0luZGV4LkNsYXNzZXNDb3VudFBvc2l0aW9uXTtcbiAgY29uc3QgdG90YWxDdXJyZW50U3R5bGVCaW5kaW5ncyA9XG4gICAgICBzaW5nbGVQcm9wT2Zmc2V0VmFsdWVzW1NpbmdsZVByb3BPZmZzZXRWYWx1ZXNJbmRleC5TdHlsZXNDb3VudFBvc2l0aW9uXTtcblxuICBjb25zdCBjYWNoZWRDbGFzc01hcFZhbHVlcyA9IGNvbnRleHRbU3R5bGluZ0luZGV4LkNhY2hlZE11bHRpQ2xhc3Nlc107XG4gIGNvbnN0IGNhY2hlZFN0eWxlTWFwVmFsdWVzID0gY29udGV4dFtTdHlsaW5nSW5kZXguQ2FjaGVkTXVsdGlTdHlsZXNdO1xuXG4gIGNvbnN0IGNsYXNzZXNPZmZzZXQgPSB0b3RhbEN1cnJlbnRDbGFzc0JpbmRpbmdzICogU3R5bGluZ0luZGV4LlNpemU7XG4gIGNvbnN0IHN0eWxlc09mZnNldCA9IHRvdGFsQ3VycmVudFN0eWxlQmluZGluZ3MgKiBTdHlsaW5nSW5kZXguU2l6ZTtcblxuICBjb25zdCBzaW5nbGVTdHlsZXNTdGFydEluZGV4ID0gU3R5bGluZ0luZGV4LlNpbmdsZVN0eWxlc1N0YXJ0UG9zaXRpb247XG4gIGxldCBzaW5nbGVDbGFzc2VzU3RhcnRJbmRleCA9IHNpbmdsZVN0eWxlc1N0YXJ0SW5kZXggKyBzdHlsZXNPZmZzZXQ7XG4gIGxldCBtdWx0aVN0eWxlc1N0YXJ0SW5kZXggPSBzaW5nbGVDbGFzc2VzU3RhcnRJbmRleCArIGNsYXNzZXNPZmZzZXQ7XG4gIGxldCBtdWx0aUNsYXNzZXNTdGFydEluZGV4ID0gbXVsdGlTdHlsZXNTdGFydEluZGV4ICsgc3R5bGVzT2Zmc2V0O1xuXG4gIC8vIGJlY2F1c2Ugd2UncmUgaW5zZXJ0aW5nIG1vcmUgYmluZGluZ3MgaW50byB0aGUgY29udGV4dCwgdGhpcyBtZWFucyB0aGF0IHRoZVxuICAvLyBiaW5kaW5nIHZhbHVlcyBuZWVkIHRvIGJlIHJlZmVyZW5jZWQgdGhlIHNpbmdsZVByb3BPZmZzZXRWYWx1ZXMgYXJyYXkgc28gdGhhdFxuICAvLyB0aGUgdGVtcGxhdGUvZGlyZWN0aXZlIGNhbiBlYXNpbHkgZmluZCB0aGVtIGluc2lkZSBvZiB0aGUgYHN0eWxlUHJvcGBcbiAgLy8gYW5kIHRoZSBgY2xhc3NQcm9wYCBmdW5jdGlvbnMgd2l0aG91dCBpdGVyYXRpbmcgdGhyb3VnaCB0aGUgZW50aXJlIGNvbnRleHQuXG4gIC8vIFRoZSBmaXJzdCBzdGVwIHRvIHNldHRpbmcgdXAgdGhlc2UgcmVmZXJlbmNlIHBvaW50cyBpcyB0byBtYXJrIGhvdyBtYW55IGJpbmRpbmdzXG4gIC8vIGFyZSBiZWluZyBhZGRlZC4gRXZlbiBpZiB0aGVzZSBiaW5kaW5ncyBhbHJlYWR5IGV4aXN0IGluIHRoZSBjb250ZXh0LCB0aGUgZGlyZWN0aXZlXG4gIC8vIG9yIHRlbXBsYXRlIGNvZGUgd2lsbCBzdGlsbCBjYWxsIHRoZW0gdW5rbm93aW5nbHkuIFRoZXJlZm9yZSB0aGUgdG90YWwgdmFsdWVzIG5lZWRcbiAgLy8gdG8gYmUgcmVnaXN0ZXJlZCBzbyB0aGF0IHdlIGtub3cgaG93IG1hbnkgYmluZGluZ3MgYXJlIGFzc2lnbmVkIHRvIGVhY2ggZGlyZWN0aXZlLlxuICBjb25zdCBjdXJyZW50U2luZ2xlUHJvcHNMZW5ndGggPSBzaW5nbGVQcm9wT2Zmc2V0VmFsdWVzLmxlbmd0aDtcbiAgc2luZ2xlUHJvcE9mZnNldFZhbHVlcy5wdXNoKFxuICAgICAgc3R5bGVCaW5kaW5nTmFtZXMgPyBzdHlsZUJpbmRpbmdOYW1lcy5sZW5ndGggOiAwLFxuICAgICAgY2xhc3NCaW5kaW5nTmFtZXMgPyBjbGFzc0JpbmRpbmdOYW1lcy5sZW5ndGggOiAwKTtcblxuICAvLyB0aGUgY29kZSBiZWxvdyB3aWxsIGNoZWNrIHRvIHNlZSBpZiBhIG5ldyBzdHlsZSBiaW5kaW5nIGFscmVhZHkgZXhpc3RzIGluIHRoZSBjb250ZXh0XG4gIC8vIGlmIHNvIHRoZW4gdGhlcmUgaXMgbm8gcG9pbnQgaW4gaW5zZXJ0aW5nIGl0IGludG8gdGhlIGNvbnRleHQgYWdhaW4uIFdoZXRoZXIgb3Igbm90IGl0XG4gIC8vIGV4aXN0cyB0aGUgc3R5bGluZyBvZmZzZXQgY29kZSB3aWxsIG5vdyBrbm93IGV4YWN0bHkgd2hlcmUgaXQgaXNcbiAgbGV0IGluc2VydGlvbk9mZnNldCA9IDA7XG4gIGNvbnN0IGZpbHRlcmVkU3R5bGVCaW5kaW5nTmFtZXM6IHN0cmluZ1tdID0gW107XG4gIGlmIChzdHlsZUJpbmRpbmdOYW1lcyAmJiBzdHlsZUJpbmRpbmdOYW1lcy5sZW5ndGgpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHN0eWxlQmluZGluZ05hbWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBuYW1lID0gc3R5bGVCaW5kaW5nTmFtZXNbaV07XG4gICAgICBsZXQgc2luZ2xlUHJvcEluZGV4ID1cbiAgICAgICAgICBnZXRNYXRjaGluZ0JpbmRpbmdJbmRleChjb250ZXh0LCBuYW1lLCBzaW5nbGVTdHlsZXNTdGFydEluZGV4LCBzaW5nbGVDbGFzc2VzU3RhcnRJbmRleCk7XG4gICAgICBpZiAoc2luZ2xlUHJvcEluZGV4ID09IC0xKSB7XG4gICAgICAgIHNpbmdsZVByb3BJbmRleCA9IHNpbmdsZUNsYXNzZXNTdGFydEluZGV4ICsgaW5zZXJ0aW9uT2Zmc2V0O1xuICAgICAgICBpbnNlcnRpb25PZmZzZXQgKz0gU3R5bGluZ0luZGV4LlNpemU7XG4gICAgICAgIGZpbHRlcmVkU3R5bGVCaW5kaW5nTmFtZXMucHVzaChuYW1lKTtcbiAgICAgIH1cbiAgICAgIHNpbmdsZVByb3BPZmZzZXRWYWx1ZXMucHVzaChzaW5nbGVQcm9wSW5kZXgpO1xuICAgIH1cbiAgfVxuXG4gIC8vIGp1c3QgbGlrZSB3aXRoIHRoZSBzdHlsZSBiaW5kaW5nIGxvb3AgYWJvdmUsIHRoZSBuZXcgY2xhc3MgYmluZGluZ3MgZ2V0IHRoZSBzYW1lIHRyZWF0bWVudC4uLlxuICBjb25zdCBmaWx0ZXJlZENsYXNzQmluZGluZ05hbWVzOiBzdHJpbmdbXSA9IFtdO1xuICBpZiAoY2xhc3NCaW5kaW5nTmFtZXMgJiYgY2xhc3NCaW5kaW5nTmFtZXMubGVuZ3RoKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjbGFzc0JpbmRpbmdOYW1lcy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgbmFtZSA9IGNsYXNzQmluZGluZ05hbWVzW2ldO1xuICAgICAgbGV0IHNpbmdsZVByb3BJbmRleCA9XG4gICAgICAgICAgZ2V0TWF0Y2hpbmdCaW5kaW5nSW5kZXgoY29udGV4dCwgbmFtZSwgc2luZ2xlQ2xhc3Nlc1N0YXJ0SW5kZXgsIG11bHRpU3R5bGVzU3RhcnRJbmRleCk7XG4gICAgICBpZiAoc2luZ2xlUHJvcEluZGV4ID09IC0xKSB7XG4gICAgICAgIHNpbmdsZVByb3BJbmRleCA9IG11bHRpU3R5bGVzU3RhcnRJbmRleCArIGluc2VydGlvbk9mZnNldDtcbiAgICAgICAgaW5zZXJ0aW9uT2Zmc2V0ICs9IFN0eWxpbmdJbmRleC5TaXplO1xuICAgICAgICBmaWx0ZXJlZENsYXNzQmluZGluZ05hbWVzLnB1c2gobmFtZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzaW5nbGVQcm9wSW5kZXggKz0gZmlsdGVyZWRTdHlsZUJpbmRpbmdOYW1lcy5sZW5ndGggKiBTdHlsaW5nSW5kZXguU2l6ZTtcbiAgICAgIH1cbiAgICAgIHNpbmdsZVByb3BPZmZzZXRWYWx1ZXMucHVzaChzaW5nbGVQcm9wSW5kZXgpO1xuICAgIH1cbiAgfVxuXG4gIC8vIGJlY2F1c2UgbmV3IHN0eWxlcyBhcmUgYmVpbmcgaW5zZXJ0ZWQsIHRoaXMgbWVhbnMgdGhlIGV4aXN0aW5nIGNvbGxlY3Rpb24gb2Ygc3R5bGUgb2Zmc2V0XG4gIC8vIGluZGV4IHZhbHVlcyBhcmUgaW5jb3JyZWN0ICh0aGV5IHBvaW50IHRvIHRoZSB3cm9uZyB2YWx1ZXMpLiBUaGUgY29kZSBiZWxvdyB3aWxsIHJ1biB0aHJvdWdoXG4gIC8vIHRoZSBlbnRpcmUgb2Zmc2V0IGFycmF5IGFuZCB1cGRhdGUgdGhlIGV4aXN0aW5nIHNldCBvZiBpbmRleCB2YWx1ZXMgdG8gcG9pbnQgdG8gdGhlaXIgbmV3XG4gIC8vIGxvY2F0aW9ucyB3aGlsZSB0YWtpbmcgdGhlIG5ldyBiaW5kaW5nIHZhbHVlcyBpbnRvIGNvbnNpZGVyYXRpb24uXG4gIGxldCBpID0gU2luZ2xlUHJvcE9mZnNldFZhbHVlc0luZGV4LlZhbHVlU3RhcnRQb3NpdGlvbjtcbiAgaWYgKGZpbHRlcmVkU3R5bGVCaW5kaW5nTmFtZXMubGVuZ3RoKSB7XG4gICAgd2hpbGUgKGkgPCBjdXJyZW50U2luZ2xlUHJvcHNMZW5ndGgpIHtcbiAgICAgIGNvbnN0IHRvdGFsU3R5bGVzID1cbiAgICAgICAgICBzaW5nbGVQcm9wT2Zmc2V0VmFsdWVzW2kgKyBTaW5nbGVQcm9wT2Zmc2V0VmFsdWVzSW5kZXguU3R5bGVzQ291bnRQb3NpdGlvbl07XG4gICAgICBjb25zdCB0b3RhbENsYXNzZXMgPVxuICAgICAgICAgIHNpbmdsZVByb3BPZmZzZXRWYWx1ZXNbaSArIFNpbmdsZVByb3BPZmZzZXRWYWx1ZXNJbmRleC5DbGFzc2VzQ291bnRQb3NpdGlvbl07XG4gICAgICBpZiAodG90YWxDbGFzc2VzKSB7XG4gICAgICAgIGNvbnN0IHN0YXJ0ID0gaSArIFNpbmdsZVByb3BPZmZzZXRWYWx1ZXNJbmRleC5WYWx1ZVN0YXJ0UG9zaXRpb24gKyB0b3RhbFN0eWxlcztcbiAgICAgICAgZm9yIChsZXQgaiA9IHN0YXJ0OyBqIDwgc3RhcnQgKyB0b3RhbENsYXNzZXM7IGorKykge1xuICAgICAgICAgIHNpbmdsZVByb3BPZmZzZXRWYWx1ZXNbal0gKz0gZmlsdGVyZWRTdHlsZUJpbmRpbmdOYW1lcy5sZW5ndGggKiBTdHlsaW5nSW5kZXguU2l6ZTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBjb25zdCB0b3RhbCA9IHRvdGFsU3R5bGVzICsgdG90YWxDbGFzc2VzO1xuICAgICAgaSArPSBTaW5nbGVQcm9wT2Zmc2V0VmFsdWVzSW5kZXguVmFsdWVTdGFydFBvc2l0aW9uICsgdG90YWw7XG4gICAgfVxuICB9XG5cbiAgY29uc3QgdG90YWxOZXdFbnRyaWVzID0gZmlsdGVyZWRDbGFzc0JpbmRpbmdOYW1lcy5sZW5ndGggKyBmaWx0ZXJlZFN0eWxlQmluZGluZ05hbWVzLmxlbmd0aDtcblxuICAvLyBpbiB0aGUgZXZlbnQgdGhhdCB0aGVyZSBhcmUgbmV3IHN0eWxlIHZhbHVlcyBiZWluZyBpbnNlcnRlZCwgYWxsIGV4aXN0aW5nIGNsYXNzIGFuZCBzdHlsZVxuICAvLyBiaW5kaW5ncyBuZWVkIHRvIGhhdmUgdGhlaXIgcG9pbnRlciB2YWx1ZXMgb2Zmc2V0dGVkIHdpdGggdGhlIG5ldyBhbW91bnQgb2Ygc3BhY2UgdGhhdCBpc1xuICAvLyB1c2VkIGZvciB0aGUgbmV3IHN0eWxlL2NsYXNzIGJpbmRpbmdzLlxuICBmb3IgKGxldCBpID0gc2luZ2xlU3R5bGVzU3RhcnRJbmRleDsgaSA8IGNvbnRleHQubGVuZ3RoOyBpICs9IFN0eWxpbmdJbmRleC5TaXplKSB7XG4gICAgY29uc3QgaXNNdWx0aUJhc2VkID0gaSA+PSBtdWx0aVN0eWxlc1N0YXJ0SW5kZXg7XG4gICAgY29uc3QgaXNDbGFzc0Jhc2VkID0gaSA+PSAoaXNNdWx0aUJhc2VkID8gbXVsdGlDbGFzc2VzU3RhcnRJbmRleCA6IHNpbmdsZUNsYXNzZXNTdGFydEluZGV4KTtcbiAgICBjb25zdCBmbGFnID0gZ2V0UG9pbnRlcnMoY29udGV4dCwgaSk7XG4gICAgY29uc3Qgc3RhdGljSW5kZXggPSBnZXRJbml0aWFsSW5kZXgoZmxhZyk7XG4gICAgbGV0IHNpbmdsZU9yTXVsdGlJbmRleCA9IGdldE11bHRpT3JTaW5nbGVJbmRleChmbGFnKTtcbiAgICBpZiAoaXNNdWx0aUJhc2VkKSB7XG4gICAgICBzaW5nbGVPck11bHRpSW5kZXggKz1cbiAgICAgICAgICBpc0NsYXNzQmFzZWQgPyAoZmlsdGVyZWRTdHlsZUJpbmRpbmdOYW1lcy5sZW5ndGggKiBTdHlsaW5nSW5kZXguU2l6ZSkgOiAwO1xuICAgIH0gZWxzZSB7XG4gICAgICBzaW5nbGVPck11bHRpSW5kZXggKz0gKHRvdGFsTmV3RW50cmllcyAqIFN0eWxpbmdJbmRleC5TaXplKSArXG4gICAgICAgICAgKChpc0NsYXNzQmFzZWQgPyBmaWx0ZXJlZFN0eWxlQmluZGluZ05hbWVzLmxlbmd0aCA6IDApICogU3R5bGluZ0luZGV4LlNpemUpO1xuICAgIH1cbiAgICBzZXRGbGFnKGNvbnRleHQsIGksIHBvaW50ZXJzKGZsYWcsIHN0YXRpY0luZGV4LCBzaW5nbGVPck11bHRpSW5kZXgpKTtcbiAgfVxuXG4gIC8vIHRoaXMgaXMgd2hlcmUgd2UgbWFrZSBzcGFjZSBpbiB0aGUgY29udGV4dCBmb3IgdGhlIG5ldyBzdHlsZSBiaW5kaW5nc1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGZpbHRlcmVkU3R5bGVCaW5kaW5nTmFtZXMubGVuZ3RoICogU3R5bGluZ0luZGV4LlNpemU7IGkrKykge1xuICAgIGNvbnRleHQuc3BsaWNlKG11bHRpQ2xhc3Nlc1N0YXJ0SW5kZXgsIDAsIG51bGwpO1xuICAgIGNvbnRleHQuc3BsaWNlKHNpbmdsZUNsYXNzZXNTdGFydEluZGV4LCAwLCBudWxsKTtcbiAgICBzaW5nbGVDbGFzc2VzU3RhcnRJbmRleCsrO1xuICAgIG11bHRpU3R5bGVzU3RhcnRJbmRleCsrO1xuICAgIG11bHRpQ2xhc3Nlc1N0YXJ0SW5kZXggKz0gMjsgIC8vIGJvdGggc2luZ2xlICsgbXVsdGkgc2xvdHMgd2VyZSBpbnNlcnRlZFxuICB9XG5cbiAgLy8gdGhpcyBpcyB3aGVyZSB3ZSBtYWtlIHNwYWNlIGluIHRoZSBjb250ZXh0IGZvciB0aGUgbmV3IGNsYXNzIGJpbmRpbmdzXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgZmlsdGVyZWRDbGFzc0JpbmRpbmdOYW1lcy5sZW5ndGggKiBTdHlsaW5nSW5kZXguU2l6ZTsgaSsrKSB7XG4gICAgY29udGV4dC5zcGxpY2UobXVsdGlTdHlsZXNTdGFydEluZGV4LCAwLCBudWxsKTtcbiAgICBjb250ZXh0LnB1c2gobnVsbCk7XG4gICAgbXVsdGlTdHlsZXNTdGFydEluZGV4Kys7XG4gICAgbXVsdGlDbGFzc2VzU3RhcnRJbmRleCsrO1xuICB9XG5cbiAgY29uc3QgaW5pdGlhbENsYXNzZXMgPSBjb250ZXh0W1N0eWxpbmdJbmRleC5Jbml0aWFsQ2xhc3NWYWx1ZXNQb3NpdGlvbl07XG4gIGNvbnN0IGluaXRpYWxTdHlsZXMgPSBjb250ZXh0W1N0eWxpbmdJbmRleC5Jbml0aWFsU3R5bGVWYWx1ZXNQb3NpdGlvbl07XG5cbiAgLy8gdGhlIGNvZGUgYmVsb3cgd2lsbCBpbnNlcnQgZWFjaCBuZXcgZW50cnkgaW50byB0aGUgY29udGV4dCBhbmQgYXNzaWduIHRoZSBhcHByb3ByaWF0ZVxuICAvLyBmbGFncyBhbmQgaW5kZXggdmFsdWVzIHRvIHRoZW0uIEl0J3MgaW1wb3J0YW50IHRoaXMgcnVucyBhdCB0aGUgZW5kIG9mIHRoaXMgZnVuY3Rpb25cbiAgLy8gYmVjYXVzZSB0aGUgY29udGV4dCwgcHJvcGVydHkgb2Zmc2V0IGFuZCBpbmRleCB2YWx1ZXMgaGF2ZSBhbGwgYmVlbiBjb21wdXRlZCBqdXN0IGJlZm9yZS5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCB0b3RhbE5ld0VudHJpZXM7IGkrKykge1xuICAgIGNvbnN0IGVudHJ5SXNDbGFzc0Jhc2VkID0gaSA+PSBmaWx0ZXJlZFN0eWxlQmluZGluZ05hbWVzLmxlbmd0aDtcbiAgICBjb25zdCBhZGp1c3RlZEluZGV4ID0gZW50cnlJc0NsYXNzQmFzZWQgPyAoaSAtIGZpbHRlcmVkU3R5bGVCaW5kaW5nTmFtZXMubGVuZ3RoKSA6IGk7XG4gICAgY29uc3QgcHJvcE5hbWUgPSBlbnRyeUlzQ2xhc3NCYXNlZCA/IGZpbHRlcmVkQ2xhc3NCaW5kaW5nTmFtZXNbYWRqdXN0ZWRJbmRleF0gOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaWx0ZXJlZFN0eWxlQmluZGluZ05hbWVzW2FkanVzdGVkSW5kZXhdO1xuXG4gICAgbGV0IG11bHRpSW5kZXgsIHNpbmdsZUluZGV4O1xuICAgIGlmIChlbnRyeUlzQ2xhc3NCYXNlZCkge1xuICAgICAgbXVsdGlJbmRleCA9IG11bHRpQ2xhc3Nlc1N0YXJ0SW5kZXggK1xuICAgICAgICAgICgodG90YWxDdXJyZW50Q2xhc3NCaW5kaW5ncyArIGFkanVzdGVkSW5kZXgpICogU3R5bGluZ0luZGV4LlNpemUpO1xuICAgICAgc2luZ2xlSW5kZXggPSBzaW5nbGVDbGFzc2VzU3RhcnRJbmRleCArXG4gICAgICAgICAgKCh0b3RhbEN1cnJlbnRDbGFzc0JpbmRpbmdzICsgYWRqdXN0ZWRJbmRleCkgKiBTdHlsaW5nSW5kZXguU2l6ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG11bHRpSW5kZXggPVxuICAgICAgICAgIG11bHRpU3R5bGVzU3RhcnRJbmRleCArICgodG90YWxDdXJyZW50U3R5bGVCaW5kaW5ncyArIGFkanVzdGVkSW5kZXgpICogU3R5bGluZ0luZGV4LlNpemUpO1xuICAgICAgc2luZ2xlSW5kZXggPSBzaW5nbGVTdHlsZXNTdGFydEluZGV4ICtcbiAgICAgICAgICAoKHRvdGFsQ3VycmVudFN0eWxlQmluZGluZ3MgKyBhZGp1c3RlZEluZGV4KSAqIFN0eWxpbmdJbmRleC5TaXplKTtcbiAgICB9XG5cbiAgICAvLyBpZiBhIHByb3BlcnR5IGlzIG5vdCBmb3VuZCBpbiB0aGUgaW5pdGlhbCBzdHlsZSB2YWx1ZXMgbGlzdCB0aGVuIGl0XG4gICAgLy8gaXMgQUxXQVlTIGFkZGVkIGluIGNhc2UgYSBmb2xsb3ctdXAgZGlyZWN0aXZlIGludHJvZHVjZXMgdGhlIHNhbWUgaW5pdGlhbFxuICAgIC8vIHN0eWxlL2NsYXNzIHZhbHVlIGxhdGVyIG9uLlxuICAgIGxldCBpbml0aWFsVmFsdWVzVG9Mb29rdXAgPSBlbnRyeUlzQ2xhc3NCYXNlZCA/IGluaXRpYWxDbGFzc2VzIDogaW5pdGlhbFN0eWxlcztcbiAgICBsZXQgaW5kZXhGb3JJbml0aWFsID0gZ2V0SW5pdGlhbFN0eWxpbmdWYWx1ZXNJbmRleE9mKGluaXRpYWxWYWx1ZXNUb0xvb2t1cCwgcHJvcE5hbWUpO1xuICAgIGlmIChpbmRleEZvckluaXRpYWwgPT09IC0xKSB7XG4gICAgICBpbmRleEZvckluaXRpYWwgPSBhZGRPclVwZGF0ZVN0YXRpY1N0eWxlKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG51bGwsIGluaXRpYWxWYWx1ZXNUb0xvb2t1cCwgcHJvcE5hbWUsIGVudHJ5SXNDbGFzc0Jhc2VkID8gZmFsc2UgOiBudWxsLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpcmVjdGl2ZUluZGV4KSArXG4gICAgICAgICAgSW5pdGlhbFN0eWxpbmdWYWx1ZXNJbmRleC5WYWx1ZU9mZnNldDtcbiAgICB9IGVsc2Uge1xuICAgICAgaW5kZXhGb3JJbml0aWFsICs9IEluaXRpYWxTdHlsaW5nVmFsdWVzSW5kZXguVmFsdWVPZmZzZXQ7XG4gICAgfVxuXG4gICAgY29uc3QgaW5pdGlhbEZsYWcgPVxuICAgICAgICBwcmVwYXJlSW5pdGlhbEZsYWcoY29udGV4dCwgcHJvcE5hbWUsIGVudHJ5SXNDbGFzc0Jhc2VkLCBzdHlsZVNhbml0aXplciB8fCBudWxsKTtcblxuICAgIHNldEZsYWcoY29udGV4dCwgc2luZ2xlSW5kZXgsIHBvaW50ZXJzKGluaXRpYWxGbGFnLCBpbmRleEZvckluaXRpYWwsIG11bHRpSW5kZXgpKTtcbiAgICBzZXRQcm9wKGNvbnRleHQsIHNpbmdsZUluZGV4LCBwcm9wTmFtZSk7XG4gICAgc2V0VmFsdWUoY29udGV4dCwgc2luZ2xlSW5kZXgsIG51bGwpO1xuICAgIHNldFBsYXllckJ1aWxkZXJJbmRleChjb250ZXh0LCBzaW5nbGVJbmRleCwgMCwgZGlyZWN0aXZlSW5kZXgpO1xuXG4gICAgc2V0RmxhZyhjb250ZXh0LCBtdWx0aUluZGV4LCBwb2ludGVycyhpbml0aWFsRmxhZywgaW5kZXhGb3JJbml0aWFsLCBzaW5nbGVJbmRleCkpO1xuICAgIHNldFByb3AoY29udGV4dCwgbXVsdGlJbmRleCwgcHJvcE5hbWUpO1xuICAgIHNldFZhbHVlKGNvbnRleHQsIG11bHRpSW5kZXgsIG51bGwpO1xuICAgIHNldFBsYXllckJ1aWxkZXJJbmRleChjb250ZXh0LCBtdWx0aUluZGV4LCAwLCBkaXJlY3RpdmVJbmRleCk7XG4gIH1cblxuICAvLyB0aGUgdG90YWwgY2xhc3Nlcy9zdHlsZSB2YWx1ZXMgYXJlIHVwZGF0ZWQgc28gdGhlIG5leHQgdGltZSB0aGUgY29udGV4dCBpcyBwYXRjaGVkXG4gIC8vIGFkZGl0aW9uYWwgc3R5bGUvY2xhc3MgYmluZGluZ3MgZnJvbSBhbm90aGVyIGRpcmVjdGl2ZSB0aGVuIGl0IGtub3dzIGV4YWN0bHkgd2hlcmVcbiAgLy8gdG8gaW5zZXJ0IHRoZW0gaW4gdGhlIGNvbnRleHRcbiAgc2luZ2xlUHJvcE9mZnNldFZhbHVlc1tTaW5nbGVQcm9wT2Zmc2V0VmFsdWVzSW5kZXguQ2xhc3Nlc0NvdW50UG9zaXRpb25dID1cbiAgICAgIHRvdGFsQ3VycmVudENsYXNzQmluZGluZ3MgKyBmaWx0ZXJlZENsYXNzQmluZGluZ05hbWVzLmxlbmd0aDtcbiAgc2luZ2xlUHJvcE9mZnNldFZhbHVlc1tTaW5nbGVQcm9wT2Zmc2V0VmFsdWVzSW5kZXguU3R5bGVzQ291bnRQb3NpdGlvbl0gPVxuICAgICAgdG90YWxDdXJyZW50U3R5bGVCaW5kaW5ncyArIGZpbHRlcmVkU3R5bGVCaW5kaW5nTmFtZXMubGVuZ3RoO1xuXG4gIC8vIHRoZSBtYXAtYmFzZWQgdmFsdWVzIGFsc28gbmVlZCB0byBrbm93IGhvdyBtYW55IGVudHJpZXMgZ290IGluc2VydGVkXG4gIGNhY2hlZENsYXNzTWFwVmFsdWVzW01hcEJhc2VkT2Zmc2V0VmFsdWVzSW5kZXguRW50cmllc0NvdW50UG9zaXRpb25dICs9XG4gICAgICBmaWx0ZXJlZENsYXNzQmluZGluZ05hbWVzLmxlbmd0aDtcbiAgY2FjaGVkU3R5bGVNYXBWYWx1ZXNbTWFwQmFzZWRPZmZzZXRWYWx1ZXNJbmRleC5FbnRyaWVzQ291bnRQb3NpdGlvbl0gKz1cbiAgICAgIGZpbHRlcmVkU3R5bGVCaW5kaW5nTmFtZXMubGVuZ3RoO1xuICBjb25zdCBuZXdTdHlsZXNTcGFjZUFsbG9jYXRpb25TaXplID0gZmlsdGVyZWRTdHlsZUJpbmRpbmdOYW1lcy5sZW5ndGggKiBTdHlsaW5nSW5kZXguU2l6ZTtcbiAgY29uc3QgbmV3Q2xhc3Nlc1NwYWNlQWxsb2NhdGlvblNpemUgPSBmaWx0ZXJlZENsYXNzQmluZGluZ05hbWVzLmxlbmd0aCAqIFN0eWxpbmdJbmRleC5TaXplO1xuXG4gIC8vIHVwZGF0ZSB0aGUgbXVsdGkgc3R5bGVzIGNhY2hlIHdpdGggYSByZWZlcmVuY2UgZm9yIHRoZSBkaXJlY3RpdmUgdGhhdCB3YXMganVzdCBpbnNlcnRlZFxuICBjb25zdCBkaXJlY3RpdmVNdWx0aVN0eWxlc1N0YXJ0SW5kZXggPVxuICAgICAgbXVsdGlTdHlsZXNTdGFydEluZGV4ICsgdG90YWxDdXJyZW50U3R5bGVCaW5kaW5ncyAqIFN0eWxpbmdJbmRleC5TaXplO1xuICBjb25zdCBjYWNoZWRTdHlsZU1hcEluZGV4ID0gY2FjaGVkU3R5bGVNYXBWYWx1ZXMubGVuZ3RoO1xuICByZWdpc3Rlck11bHRpTWFwRW50cnkoXG4gICAgICBjb250ZXh0LCBkaXJlY3RpdmVJbmRleCwgZmFsc2UsIGRpcmVjdGl2ZU11bHRpU3R5bGVzU3RhcnRJbmRleCxcbiAgICAgIGZpbHRlcmVkU3R5bGVCaW5kaW5nTmFtZXMubGVuZ3RoKTtcblxuICBmb3IgKGxldCBpID0gTWFwQmFzZWRPZmZzZXRWYWx1ZXNJbmRleC5WYWx1ZXNTdGFydFBvc2l0aW9uOyBpIDwgY2FjaGVkU3R5bGVNYXBJbmRleDtcbiAgICAgICBpICs9IE1hcEJhc2VkT2Zmc2V0VmFsdWVzSW5kZXguU2l6ZSkge1xuICAgIC8vIG11bHRpIHZhbHVlcyBzdGFydCBhZnRlciBhbGwgdGhlIHNpbmdsZSB2YWx1ZXMgKHdoaWNoIGlzIGFsc28gd2hlcmUgY2xhc3NlcyBhcmUpIGluIHRoZVxuICAgIC8vIGNvbnRleHQgdGhlcmVmb3JlIHRoZSBuZXcgY2xhc3MgYWxsb2NhdGlvbiBzaXplIHNob3VsZCBiZSB0YWtlbiBpbnRvIGFjY291bnRcbiAgICBjYWNoZWRTdHlsZU1hcFZhbHVlc1tpICsgTWFwQmFzZWRPZmZzZXRWYWx1ZXNJbmRleC5Qb3NpdGlvblN0YXJ0T2Zmc2V0XSArPVxuICAgICAgICBuZXdDbGFzc2VzU3BhY2VBbGxvY2F0aW9uU2l6ZSArIG5ld1N0eWxlc1NwYWNlQWxsb2NhdGlvblNpemU7XG4gIH1cblxuICAvLyB1cGRhdGUgdGhlIG11bHRpIGNsYXNzZXMgY2FjaGUgd2l0aCBhIHJlZmVyZW5jZSBmb3IgdGhlIGRpcmVjdGl2ZSB0aGF0IHdhcyBqdXN0IGluc2VydGVkXG4gIGNvbnN0IGRpcmVjdGl2ZU11bHRpQ2xhc3Nlc1N0YXJ0SW5kZXggPVxuICAgICAgbXVsdGlDbGFzc2VzU3RhcnRJbmRleCArIHRvdGFsQ3VycmVudENsYXNzQmluZGluZ3MgKiBTdHlsaW5nSW5kZXguU2l6ZTtcbiAgY29uc3QgY2FjaGVkQ2xhc3NNYXBJbmRleCA9IGNhY2hlZENsYXNzTWFwVmFsdWVzLmxlbmd0aDtcbiAgcmVnaXN0ZXJNdWx0aU1hcEVudHJ5KFxuICAgICAgY29udGV4dCwgZGlyZWN0aXZlSW5kZXgsIHRydWUsIGRpcmVjdGl2ZU11bHRpQ2xhc3Nlc1N0YXJ0SW5kZXgsXG4gICAgICBmaWx0ZXJlZENsYXNzQmluZGluZ05hbWVzLmxlbmd0aCk7XG5cbiAgZm9yIChsZXQgaSA9IE1hcEJhc2VkT2Zmc2V0VmFsdWVzSW5kZXguVmFsdWVzU3RhcnRQb3NpdGlvbjsgaSA8IGNhY2hlZENsYXNzTWFwSW5kZXg7XG4gICAgICAgaSArPSBNYXBCYXNlZE9mZnNldFZhbHVlc0luZGV4LlNpemUpIHtcbiAgICAvLyB0aGUgcmVhc29uIHdoeSBib3RoIHRoZSBzdHlsZXMgKyBjbGFzc2VzIHNwYWNlIGlzIGFsbG9jYXRlZCB0byB0aGUgZXhpc3Rpbmcgb2Zmc2V0cyBpc1xuICAgIC8vIGJlY2F1c2UgdGhlIHN0eWxlcyBzaG93IHVwIGJlZm9yZSB0aGUgY2xhc3NlcyBpbiB0aGUgY29udGV4dCBhbmQgYW55IG5ldyBpbnNlcnRlZFxuICAgIC8vIHN0eWxlcyB3aWxsIG9mZnNldCBhbnkgZXhpc3RpbmcgY2xhc3MgZW50cmllcyBpbiB0aGUgY29udGV4dCAoZXZlbiBpZiB0aGVyZSBhcmUgbm9cbiAgICAvLyBuZXcgY2xhc3MgZW50cmllcyBhZGRlZCkgYWxzbyB0aGUgcmVhc29uIHdoeSBpdCdzICoyIGlzIGJlY2F1c2UgYm90aCBzaW5nbGUgKyBtdWx0aVxuICAgIC8vIGVudHJpZXMgZm9yIGVhY2ggbmV3IHN0eWxlIGhhdmUgYmVlbiBhZGRlZCBpbiB0aGUgY29udGV4dCBiZWZvcmUgdGhlIG11bHRpIGNsYXNzIHZhbHVlc1xuICAgIC8vIGFjdHVhbGx5IHN0YXJ0XG4gICAgY2FjaGVkQ2xhc3NNYXBWYWx1ZXNbaSArIE1hcEJhc2VkT2Zmc2V0VmFsdWVzSW5kZXguUG9zaXRpb25TdGFydE9mZnNldF0gKz1cbiAgICAgICAgKG5ld1N0eWxlc1NwYWNlQWxsb2NhdGlvblNpemUgKiAyKSArIG5ld0NsYXNzZXNTcGFjZUFsbG9jYXRpb25TaXplO1xuICB9XG5cbiAgLy8gdGhlcmUgaXMgbm8gaW5pdGlhbCB2YWx1ZSBmbGFnIGZvciB0aGUgbWFzdGVyIGluZGV4IHNpbmNlIGl0IGRvZXNuJ3RcbiAgLy8gcmVmZXJlbmNlIGFuIGluaXRpYWwgc3R5bGUgdmFsdWVcbiAgY29uc3QgbWFzdGVyRmxhZyA9IHBvaW50ZXJzKDAsIDAsIG11bHRpU3R5bGVzU3RhcnRJbmRleCk7XG4gIHNldEZsYWcoY29udGV4dCwgU3R5bGluZ0luZGV4Lk1hc3RlckZsYWdQb3NpdGlvbiwgbWFzdGVyRmxhZyk7XG59XG5cbi8qKlxuICogU2VhcmNoZXMgdGhyb3VnaCB0aGUgZXhpc3RpbmcgcmVnaXN0cnkgb2YgZGlyZWN0aXZlc1xuICovXG5leHBvcnQgZnVuY3Rpb24gZmluZE9yUGF0Y2hEaXJlY3RpdmVJbnRvUmVnaXN0cnkoXG4gICAgY29udGV4dDogU3R5bGluZ0NvbnRleHQsIGRpcmVjdGl2ZUluZGV4OiBudW1iZXIsIHN0YXRpY01vZGVPbmx5OiBib29sZWFuLFxuICAgIHN0eWxlU2FuaXRpemVyPzogU3R5bGVTYW5pdGl6ZUZuIHwgbnVsbCk6IGJvb2xlYW4ge1xuICBjb25zdCBkaXJlY3RpdmVSZWdpc3RyeSA9IGNvbnRleHRbU3R5bGluZ0luZGV4LkRpcmVjdGl2ZVJlZ2lzdHJ5UG9zaXRpb25dO1xuICBjb25zdCBpbmRleCA9IGRpcmVjdGl2ZUluZGV4ICogRGlyZWN0aXZlUmVnaXN0cnlWYWx1ZXNJbmRleC5TaXplO1xuICBjb25zdCBzaW5nbGVQcm9wU3RhcnRQb3NpdGlvbiA9IGluZGV4ICsgRGlyZWN0aXZlUmVnaXN0cnlWYWx1ZXNJbmRleC5TaW5nbGVQcm9wVmFsdWVzSW5kZXhPZmZzZXQ7XG5cbiAgLy8gdGhpcyBtZWFucyB0aGF0IHRoZSBkaXJlY3RpdmUgaGFzIGFscmVhZHkgYmVlbiByZWdpc3RlcmVkIGludG8gdGhlIHJlZ2lzdHJ5XG4gIGlmIChpbmRleCA8IGRpcmVjdGl2ZVJlZ2lzdHJ5Lmxlbmd0aCAmJlxuICAgICAgKGRpcmVjdGl2ZVJlZ2lzdHJ5W3NpbmdsZVByb3BTdGFydFBvc2l0aW9uXSBhcyBudW1iZXIpID49IDApXG4gICAgcmV0dXJuIGZhbHNlO1xuXG4gIGNvbnN0IHNpbmdsZVByb3BzU3RhcnRJbmRleCA9XG4gICAgICBzdGF0aWNNb2RlT25seSA/IC0xIDogY29udGV4dFtTdHlsaW5nSW5kZXguU2luZ2xlUHJvcE9mZnNldFBvc2l0aW9uc10ubGVuZ3RoO1xuICBhbGxvY2F0ZU9yVXBkYXRlRGlyZWN0aXZlSW50b0NvbnRleHQoXG4gICAgICBjb250ZXh0LCBkaXJlY3RpdmVJbmRleCwgc2luZ2xlUHJvcHNTdGFydEluZGV4LCBzdHlsZVNhbml0aXplcik7XG4gIHJldHVybiB0cnVlO1xufVxuXG5mdW5jdGlvbiBnZXRNYXRjaGluZ0JpbmRpbmdJbmRleChcbiAgICBjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgYmluZGluZ05hbWU6IHN0cmluZywgc3RhcnQ6IG51bWJlciwgZW5kOiBudW1iZXIpIHtcbiAgZm9yIChsZXQgaiA9IHN0YXJ0OyBqIDwgZW5kOyBqICs9IFN0eWxpbmdJbmRleC5TaXplKSB7XG4gICAgaWYgKGdldFByb3AoY29udGV4dCwgaikgPT09IGJpbmRpbmdOYW1lKSByZXR1cm4gajtcbiAgfVxuICByZXR1cm4gLTE7XG59XG5cbi8qKlxuICogUmVnaXN0ZXJzIHRoZSBwcm92aWRlZCBtdWx0aSBjbGFzcyB2YWx1ZXMgdG8gdGhlIGNvbnRleHQuXG4gKlxuICogVGhpcyBmdW5jdGlvbiB3aWxsIGl0ZXJhdGUgb3ZlciB0aGUgcHJvdmlkZWQgYGNsYXNzZXNJbnB1dGAgdmFsdWVzIGFuZFxuICogaW5zZXJ0L3VwZGF0ZSBvciByZW1vdmUgdGhlbSBmcm9tIHRoZSBjb250ZXh0IGF0IGV4YWN0bHkgdGhlIHJpZ2h0IHNwb3QuXG4gKlxuICogVGhpcyBmdW5jdGlvbiBhbHNvIHRha2VzIGluIGEgZGlyZWN0aXZlIHdoaWNoIGltcGxpZXMgdGhhdCB0aGUgc3R5bGluZyB2YWx1ZXMgd2lsbFxuICogYmUgZXZhbHVhdGVkIGZvciB0aGF0IGRpcmVjdGl2ZSB3aXRoIHJlc3BlY3QgdG8gYW55IG90aGVyIHN0eWxpbmcgdGhhdCBhbHJlYWR5IGV4aXN0c1xuICogb24gdGhlIGNvbnRleHQuIFdoZW4gdGhlcmUgYXJlIHN0eWxlcyB0aGF0IGNvbmZsaWN0IChlLmcuIHNheSBgbmdDbGFzc2AgYW5kIGBbY2xhc3NdYFxuICogYm90aCB1cGRhdGUgdGhlIGBmb29gIGNsYXNzTmFtZSB2YWx1ZSBhdCB0aGUgc2FtZSB0aW1lKSB0aGVuIHRoZSBzdHlsaW5nIGFsZ29yaXRobSBjb2RlIGJlbG93XG4gKiB3aWxsIGRlY2lkZSB3aGljaCBvbmUgd2lucyBiYXNlZCBvbiB0aGUgZGlyZWN0aXZlIHN0eWxpbmcgcHJpb3JpdGl6YXRpb24gbWVjaGFuaXNtLiAoVGhpc1xuICogbWVjaGFuaXNtIGlzIGJldHRlciBleHBsYWluZWQgaW4gcmVuZGVyMy9pbnRlcmZhY2VzL3N0eWxpbmcudHMjZGlyZWN0aXZlcykuXG4gKlxuICogVGhpcyBmdW5jdGlvbiB3aWxsIG5vdCByZW5kZXIgYW55IHN0eWxpbmcgdmFsdWVzIG9uIHNjcmVlbiwgYnV0IGlzIHJhdGhlciBkZXNpZ25lZCB0b1xuICogcHJlcGFyZSB0aGUgY29udGV4dCBmb3IgdGhhdC4gYHJlbmRlclN0eWxpbmdgIG11c3QgYmUgY2FsbGVkIGFmdGVyd2FyZHMgdG8gcmVuZGVyIGFueVxuICogc3R5bGluZyBkYXRhIHRoYXQgd2FzIHNldCBpbiB0aGlzIGZ1bmN0aW9uIChub3RlIHRoYXQgYHVwZGF0ZUNsYXNzUHJvcGAgYW5kXG4gKiBgdXBkYXRlU3R5bGVQcm9wYCBhcmUgZGVzaWduZWQgdG8gYmUgcnVuIGFmdGVyIHRoaXMgZnVuY3Rpb24gaXMgcnVuKS5cbiAqXG4gKiBAcGFyYW0gY29udGV4dCBUaGUgc3R5bGluZyBjb250ZXh0IHRoYXQgd2lsbCBiZSB1cGRhdGVkIHdpdGggdGhlXG4gKiAgICBuZXdseSBwcm92aWRlZCBzdHlsZSB2YWx1ZXMuXG4gKiBAcGFyYW0gY2xhc3Nlc0lucHV0IFRoZSBrZXkvdmFsdWUgbWFwIG9mIENTUyBjbGFzcyBuYW1lcyB0aGF0IHdpbGwgYmUgdXNlZCBmb3IgdGhlIHVwZGF0ZS5cbiAqIEBwYXJhbSBzdHlsZXNJbnB1dCBUaGUga2V5L3ZhbHVlIG1hcCBvZiBDU1Mgc3R5bGVzIHRoYXQgd2lsbCBiZSB1c2VkIGZvciB0aGUgdXBkYXRlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gdXBkYXRlQ2xhc3NNYXAoXG4gICAgY29udGV4dDogU3R5bGluZ0NvbnRleHQsIGNsYXNzZXNJbnB1dDoge1trZXk6IHN0cmluZ106IGFueX0gfCBzdHJpbmcgfFxuICAgICAgICBCb3VuZFBsYXllckZhY3Rvcnk8bnVsbHxzdHJpbmd8e1trZXk6IHN0cmluZ106IGFueX0+fCBudWxsLFxuICAgIGRpcmVjdGl2ZUluZGV4OiBudW1iZXIgPSAwKTogdm9pZCB7XG4gIHVwZGF0ZVN0eWxpbmdNYXAoY29udGV4dCwgY2xhc3Nlc0lucHV0LCB0cnVlLCBkaXJlY3RpdmVJbmRleCk7XG59XG5cbi8qKlxuICogUmVnaXN0ZXJzIHRoZSBwcm92aWRlZCBtdWx0aSBzdHlsZSB2YWx1ZXMgdG8gdGhlIGNvbnRleHQuXG4gKlxuICogVGhpcyBmdW5jdGlvbiB3aWxsIGl0ZXJhdGUgb3ZlciB0aGUgcHJvdmlkZWQgYHN0eWxlc0lucHV0YCB2YWx1ZXMgYW5kXG4gKiBpbnNlcnQvdXBkYXRlIG9yIHJlbW92ZSB0aGVtIGZyb20gdGhlIGNvbnRleHQgYXQgZXhhY3RseSB0aGUgcmlnaHQgc3BvdC5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIGFsc28gdGFrZXMgaW4gYSBkaXJlY3RpdmUgd2hpY2ggaW1wbGllcyB0aGF0IHRoZSBzdHlsaW5nIHZhbHVlcyB3aWxsXG4gKiBiZSBldmFsdWF0ZWQgZm9yIHRoYXQgZGlyZWN0aXZlIHdpdGggcmVzcGVjdCB0byBhbnkgb3RoZXIgc3R5bGluZyB0aGF0IGFscmVhZHkgZXhpc3RzXG4gKiBvbiB0aGUgY29udGV4dC4gV2hlbiB0aGVyZSBhcmUgc3R5bGVzIHRoYXQgY29uZmxpY3QgKGUuZy4gc2F5IGBuZ1N0eWxlYCBhbmQgYFtzdHlsZV1gXG4gKiBib3RoIHVwZGF0ZSB0aGUgYHdpZHRoYCBwcm9wZXJ0eSBhdCB0aGUgc2FtZSB0aW1lKSB0aGVuIHRoZSBzdHlsaW5nIGFsZ29yaXRobSBjb2RlIGJlbG93XG4gKiB3aWxsIGRlY2lkZSB3aGljaCBvbmUgd2lucyBiYXNlZCBvbiB0aGUgZGlyZWN0aXZlIHN0eWxpbmcgcHJpb3JpdGl6YXRpb24gbWVjaGFuaXNtLiAoVGhpc1xuICogbWVjaGFuaXNtIGlzIGJldHRlciBleHBsYWluZWQgaW4gcmVuZGVyMy9pbnRlcmZhY2VzL3N0eWxpbmcudHMjZGlyZWN0aXZlcykuXG4gKlxuICogVGhpcyBmdW5jdGlvbiB3aWxsIG5vdCByZW5kZXIgYW55IHN0eWxpbmcgdmFsdWVzIG9uIHNjcmVlbiwgYnV0IGlzIHJhdGhlciBkZXNpZ25lZCB0b1xuICogcHJlcGFyZSB0aGUgY29udGV4dCBmb3IgdGhhdC4gYHJlbmRlclN0eWxpbmdgIG11c3QgYmUgY2FsbGVkIGFmdGVyd2FyZHMgdG8gcmVuZGVyIGFueVxuICogc3R5bGluZyBkYXRhIHRoYXQgd2FzIHNldCBpbiB0aGlzIGZ1bmN0aW9uIChub3RlIHRoYXQgYHVwZGF0ZUNsYXNzUHJvcGAgYW5kXG4gKiBgdXBkYXRlU3R5bGVQcm9wYCBhcmUgZGVzaWduZWQgdG8gYmUgcnVuIGFmdGVyIHRoaXMgZnVuY3Rpb24gaXMgcnVuKS5cbiAqXG4gKiBAcGFyYW0gY29udGV4dCBUaGUgc3R5bGluZyBjb250ZXh0IHRoYXQgd2lsbCBiZSB1cGRhdGVkIHdpdGggdGhlXG4gKiAgICBuZXdseSBwcm92aWRlZCBzdHlsZSB2YWx1ZXMuXG4gKiBAcGFyYW0gc3R5bGVzSW5wdXQgVGhlIGtleS92YWx1ZSBtYXAgb2YgQ1NTIHN0eWxlcyB0aGF0IHdpbGwgYmUgdXNlZCBmb3IgdGhlIHVwZGF0ZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHVwZGF0ZVN0eWxlTWFwKFxuICAgIGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBzdHlsZXNJbnB1dDoge1trZXk6IHN0cmluZ106IGFueX0gfCBzdHJpbmcgfFxuICAgICAgICBCb3VuZFBsYXllckZhY3Rvcnk8bnVsbHxzdHJpbmd8e1trZXk6IHN0cmluZ106IGFueX0+fCBudWxsLFxuICAgIGRpcmVjdGl2ZUluZGV4OiBudW1iZXIgPSAwKTogdm9pZCB7XG4gIHVwZGF0ZVN0eWxpbmdNYXAoY29udGV4dCwgc3R5bGVzSW5wdXQsIGZhbHNlLCBkaXJlY3RpdmVJbmRleCk7XG59XG5cbmZ1bmN0aW9uIHVwZGF0ZVN0eWxpbmdNYXAoXG4gICAgY29udGV4dDogU3R5bGluZ0NvbnRleHQsIGlucHV0OiB7W2tleTogc3RyaW5nXTogYW55fSB8IHN0cmluZyB8XG4gICAgICAgIEJvdW5kUGxheWVyRmFjdG9yeTxudWxsfHN0cmluZ3x7W2tleTogc3RyaW5nXTogYW55fT58IG51bGwsXG4gICAgZW50cnlJc0NsYXNzQmFzZWQ6IGJvb2xlYW4sIGRpcmVjdGl2ZUluZGV4OiBudW1iZXIgPSAwKTogdm9pZCB7XG4gIG5nRGV2TW9kZSAmJiAoZW50cnlJc0NsYXNzQmFzZWQgPyBuZ0Rldk1vZGUuY2xhc3NNYXArKyA6IG5nRGV2TW9kZS5zdHlsZU1hcCsrKTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydFZhbGlkRGlyZWN0aXZlSW5kZXgoY29udGV4dCwgZGlyZWN0aXZlSW5kZXgpO1xuXG4gIC8vIGVhcmx5IGV4aXQgKHRoaXMgaXMgd2hhdCdzIGRvbmUgdG8gYXZvaWQgdXNpbmcgY3R4LmJpbmQoKSB0byBjYWNoZSB0aGUgdmFsdWUpXG4gIGlmIChpc011bHRpVmFsdWVDYWNoZUhpdChjb250ZXh0LCBlbnRyeUlzQ2xhc3NCYXNlZCwgZGlyZWN0aXZlSW5kZXgsIGlucHV0KSkgcmV0dXJuO1xuXG4gIGlucHV0ID1cbiAgICAgIGlucHV0ID09PSBOT19DSEFOR0UgPyByZWFkQ2FjaGVkTWFwVmFsdWUoY29udGV4dCwgZW50cnlJc0NsYXNzQmFzZWQsIGRpcmVjdGl2ZUluZGV4KSA6IGlucHV0O1xuXG4gIGNvbnN0IGVsZW1lbnQgPSBjb250ZXh0W1N0eWxpbmdJbmRleC5FbGVtZW50UG9zaXRpb25dICFhcyBIVE1MRWxlbWVudDtcbiAgY29uc3QgcGxheWVyQnVpbGRlciA9IGlucHV0IGluc3RhbmNlb2YgQm91bmRQbGF5ZXJGYWN0b3J5ID9cbiAgICAgIG5ldyBDbGFzc0FuZFN0eWxlUGxheWVyQnVpbGRlcihcbiAgICAgICAgICBpbnB1dCBhcyBhbnksIGVsZW1lbnQsIGVudHJ5SXNDbGFzc0Jhc2VkID8gQmluZGluZ1R5cGUuQ2xhc3MgOiBCaW5kaW5nVHlwZS5TdHlsZSkgOlxuICAgICAgbnVsbDtcblxuICBjb25zdCByYXdWYWx1ZSA9XG4gICAgICBwbGF5ZXJCdWlsZGVyID8gKGlucHV0IGFzIEJvdW5kUGxheWVyRmFjdG9yeTx7W2tleTogc3RyaW5nXTogYW55fXxzdHJpbmc+KSAhLnZhbHVlIDogaW5wdXQ7XG5cbiAgLy8gdGhlIHBvc2l0aW9uIGlzIGFsd2F5cyB0aGUgc2FtZSwgYnV0IHdoZXRoZXIgdGhlIHBsYXllciBidWlsZGVyIGdldHMgc2V0XG4gIC8vIGF0IGFsbCAoZGVwZW5kaW5nIGlmIGl0cyBzZXQpIHdpbGwgYmUgcmVmbGVjdGVkIGluIHRoZSBpbmRleCB2YWx1ZSBiZWxvdy4uLlxuICBjb25zdCBwbGF5ZXJCdWlsZGVyUG9zaXRpb24gPSBlbnRyeUlzQ2xhc3NCYXNlZCA/IFBsYXllckluZGV4LkNsYXNzTWFwUGxheWVyQnVpbGRlclBvc2l0aW9uIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBQbGF5ZXJJbmRleC5TdHlsZU1hcFBsYXllckJ1aWxkZXJQb3NpdGlvbjtcbiAgbGV0IHBsYXllckJ1aWxkZXJJbmRleCA9IHBsYXllckJ1aWxkZXIgPyBwbGF5ZXJCdWlsZGVyUG9zaXRpb24gOiAwO1xuICBsZXQgcGxheWVyQnVpbGRlcnNBcmVEaXJ0eSA9IGZhbHNlO1xuICBpZiAoaGFzUGxheWVyQnVpbGRlckNoYW5nZWQoY29udGV4dCwgcGxheWVyQnVpbGRlciwgcGxheWVyQnVpbGRlclBvc2l0aW9uKSkge1xuICAgIHNldFBsYXllckJ1aWxkZXIoY29udGV4dCwgcGxheWVyQnVpbGRlciwgcGxheWVyQnVpbGRlclBvc2l0aW9uKTtcbiAgICBwbGF5ZXJCdWlsZGVyc0FyZURpcnR5ID0gdHJ1ZTtcbiAgfVxuXG4gIC8vIGVhY2ggdGltZSBhIHN0cmluZy1iYXNlZCB2YWx1ZSBwb3BzIHVwIHRoZW4gaXQgc2hvdWxkbid0IHJlcXVpcmUgYSBkZWVwXG4gIC8vIGNoZWNrIG9mIHdoYXQncyBjaGFuZ2VkLlxuICBsZXQgc3RhcnRJbmRleDogbnVtYmVyO1xuICBsZXQgZW5kSW5kZXg6IG51bWJlcjtcbiAgbGV0IHByb3BOYW1lczogc3RyaW5nW107XG4gIGxldCBhcHBseUFsbCA9IGZhbHNlO1xuICBpZiAoZW50cnlJc0NsYXNzQmFzZWQpIHtcbiAgICBpZiAodHlwZW9mIHJhd1ZhbHVlID09ICdzdHJpbmcnKSB7XG4gICAgICBwcm9wTmFtZXMgPSByYXdWYWx1ZS5zcGxpdCgvXFxzKy8pO1xuICAgICAgLy8gdGhpcyBib29sZWFuIGlzIHVzZWQgdG8gYXZvaWQgaGF2aW5nIHRvIGNyZWF0ZSBhIGtleS92YWx1ZSBtYXAgb2YgYHRydWVgIHZhbHVlc1xuICAgICAgLy8gc2luY2UgYSBjbGFzc05hbWUgc3RyaW5nIGltcGxpZXMgdGhhdCBhbGwgdGhvc2UgY2xhc3NlcyBhcmUgYWRkZWRcbiAgICAgIGFwcGx5QWxsID0gdHJ1ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgcHJvcE5hbWVzID0gcmF3VmFsdWUgPyBPYmplY3Qua2V5cyhyYXdWYWx1ZSkgOiBFTVBUWV9BUlJBWTtcbiAgICB9XG4gICAgc3RhcnRJbmRleCA9IGdldE11bHRpQ2xhc3Nlc1N0YXJ0SW5kZXgoY29udGV4dCk7XG4gICAgZW5kSW5kZXggPSBjb250ZXh0Lmxlbmd0aDtcbiAgfSBlbHNlIHtcbiAgICBzdGFydEluZGV4ID0gZ2V0TXVsdGlTdHlsZXNTdGFydEluZGV4KGNvbnRleHQpO1xuICAgIGVuZEluZGV4ID0gZ2V0TXVsdGlDbGFzc2VzU3RhcnRJbmRleChjb250ZXh0KTtcbiAgICBwcm9wTmFtZXMgPSByYXdWYWx1ZSA/IE9iamVjdC5rZXlzKHJhd1ZhbHVlKSA6IEVNUFRZX0FSUkFZO1xuICB9XG5cbiAgY29uc3QgdmFsdWVzID0gKHJhd1ZhbHVlIHx8IEVNUFRZX09CSikgYXN7W2tleTogc3RyaW5nXTogYW55fTtcbiAgcGF0Y2hTdHlsaW5nTWFwSW50b0NvbnRleHQoXG4gICAgICBjb250ZXh0LCBkaXJlY3RpdmVJbmRleCwgcGxheWVyQnVpbGRlckluZGV4LCBzdGFydEluZGV4LCBlbmRJbmRleCwgcHJvcE5hbWVzLFxuICAgICAgYXBwbHlBbGwgfHwgdmFsdWVzLCBpbnB1dCwgZW50cnlJc0NsYXNzQmFzZWQpO1xuXG4gIGlmIChwbGF5ZXJCdWlsZGVyc0FyZURpcnR5KSB7XG4gICAgc2V0Q29udGV4dFBsYXllcnNEaXJ0eShjb250ZXh0LCB0cnVlKTtcbiAgfVxuXG4gIG5nRGV2TW9kZSAmJiAoZW50cnlJc0NsYXNzQmFzZWQgPyBuZ0Rldk1vZGUuY2xhc3NNYXBDYWNoZU1pc3MrKyA6IG5nRGV2TW9kZS5zdHlsZU1hcENhY2hlTWlzcysrKTtcbn1cblxuLyoqXG4gKiBBcHBsaWVzIHRoZSBnaXZlbiBtdWx0aSBzdHlsaW5nIChzdHlsZXMgb3IgY2xhc3NlcykgdmFsdWVzIHRvIHRoZSBjb250ZXh0LlxuICpcbiAqIFRoZSBzdHlsaW5nIGFsZ29yaXRobSBjb2RlIHRoYXQgYXBwbGllcyBtdWx0aS1sZXZlbCBzdHlsaW5nICh0aGluZ3MgbGlrZSBgW3N0eWxlXWAgYW5kIGBbY2xhc3NdYFxuICogdmFsdWVzKSByZXNpZGVzIGhlcmUuXG4gKlxuICogQmVjYXVzZSB0aGlzIGZ1bmN0aW9uIHVuZGVyc3RhbmRzIHRoYXQgbXVsdGlwbGUgZGlyZWN0aXZlcyBtYXkgYWxsIHdyaXRlIHRvIHRoZSBgW3N0eWxlXWAgYW5kXG4gKiBgW2NsYXNzXWAgYmluZGluZ3MgKHRocm91Z2ggaG9zdCBiaW5kaW5ncyksIGl0IHJlbGllcyBvZiBlYWNoIGRpcmVjdGl2ZSBhcHBseWluZyBpdHMgYmluZGluZ1xuICogdmFsdWUgaW4gb3JkZXIuIFRoaXMgbWVhbnMgdGhhdCBhIGRpcmVjdGl2ZSBsaWtlIGBjbGFzc0FEaXJlY3RpdmVgIHdpbGwgYWx3YXlzIGZpcmUgYmVmb3JlXG4gKiBgY2xhc3NCRGlyZWN0aXZlYCBhbmQgdGhlcmVmb3JlIGl0cyBzdHlsaW5nIHZhbHVlcyAoY2xhc3NlcyBhbmQgc3R5bGVzKSB3aWxsIGFsd2F5cyBiZSBldmFsdWF0ZWRcbiAqIGluIHRoZSBzYW1lIG9yZGVyLiBCZWNhdXNlIG9mIHRoaXMgY29uc2lzdGVudCBvcmRlcmluZywgdGhlIGZpcnN0IGRpcmVjdGl2ZSBoYXMgYSBoaWdoZXIgcHJpb3JpdHlcbiAqIHRoYW4gdGhlIHNlY29uZCBvbmUuIEl0IGlzIHdpdGggdGhpcyBwcmlvcml0emF0aW9uIG1lY2hhbmlzbSB0aGF0IHRoZSBzdHlsaW5nIGFsZ29yaXRobSBrbm93cyBob3dcbiAqIHRvIG1lcmdlIGFuZCBhcHBseSByZWR1ZGFudCBzdHlsaW5nIHByb3BlcnRpZXMuXG4gKlxuICogVGhlIGZ1bmN0aW9uIGl0c2VsZiBhcHBsaWVzIHRoZSBrZXkvdmFsdWUgZW50cmllcyAob3IgYW4gYXJyYXkgb2Yga2V5cykgdG9cbiAqIHRoZSBjb250ZXh0IGluIHRoZSBmb2xsb3dpbmcgc3RlcHMuXG4gKlxuICogU1RFUCAxOlxuICogICAgRmlyc3QgY2hlY2sgdG8gc2VlIHdoYXQgcHJvcGVydGllcyBhcmUgYWxyZWFkeSBzZXQgYW5kIGluIHVzZSBieSBhbm90aGVyIGRpcmVjdGl2ZSBpbiB0aGVcbiAqICAgIGNvbnRleHQgKGUuZy4gYG5nQ2xhc3NgIHNldCB0aGUgYHdpZHRoYCB2YWx1ZSBhbmQgYFtzdHlsZS53aWR0aF09XCJ3XCJgIGluIGEgZGlyZWN0aXZlIGlzXG4gKiAgICBhdHRlbXB0aW5nIHRvIHNldCBpdCBhcyB3ZWxsKS5cbiAqXG4gKiBTVEVQIDI6XG4gKiAgICBBbGwgcmVtYWluaW5nIHByb3BlcnRpZXMgKHRoYXQgd2VyZSBub3Qgc2V0IHByaW9yIHRvIHRoaXMgZGlyZWN0aXZlKSBhcmUgbm93IHVwZGF0ZWQgaW5cbiAqICAgIHRoZSBjb250ZXh0LiBBbnkgbmV3IHByb3BlcnRpZXMgYXJlIGluc2VydGVkIGV4YWN0bHkgYXQgdGhlaXIgc3BvdCBpbiB0aGUgY29udGV4dCBhbmQgYW55XG4gKiAgICBwcmV2aW91c2x5IHNldCBwcm9wZXJ0aWVzIGFyZSBzaGlmdGVkIHRvIGV4YWN0bHkgd2hlcmUgdGhlIGN1cnNvciBzaXRzIHdoaWxlIGl0ZXJhdGluZyBvdmVyXG4gKiAgICB0aGUgY29udGV4dC4gVGhlIGVuZCByZXN1bHQgaXMgYSBiYWxhbmNlZCBjb250ZXh0IHRoYXQgaW5jbHVkZXMgdGhlIGV4YWN0IG9yZGVyaW5nIG9mIHRoZVxuICogICAgc3R5bGluZyBwcm9wZXJ0aWVzL3ZhbHVlcyBmb3IgdGhlIHByb3ZpZGVkIGlucHV0IGZyb20gdGhlIGRpcmVjdGl2ZS5cbiAqXG4gKiBTVEVQIDM6XG4gKiAgICBBbnkgdW5tYXRjaGVkIHByb3BlcnRpZXMgaW4gdGhlIGNvbnRleHQgdGhhdCBiZWxvbmcgdG8gdGhlIGRpcmVjdGl2ZSBhcmUgc2V0IHRvIG51bGxcbiAqXG4gKiBPbmNlIHRoZSB1cGRhdGluZyBwaGFzZSBpcyBkb25lLCB0aGVuIHRoZSBhbGdvcml0aG0gd2lsbCBkZWNpZGUgd2hldGhlciBvciBub3QgdG8gZmxhZyB0aGVcbiAqIGZvbGxvdy11cCBkaXJlY3RpdmVzICh0aGUgZGlyZWN0aXZlcyB0aGF0IHdpbGwgcGFzcyBpbiB0aGVpciBzdHlsaW5nIHZhbHVlcykgZGVwZW5kaW5nIG9uIGlmXG4gKiB0aGUgXCJzaGFwZVwiIG9mIHRoZSBtdWx0aS12YWx1ZSBtYXAgaGFzIGNoYW5nZWQgKGVpdGhlciBpZiBhbnkga2V5cyBhcmUgcmVtb3ZlZCBvciBhZGRlZCBvclxuICogaWYgdGhlcmUgYXJlIGFueSBuZXcgYG51bGxgIHZhbHVlcykuIElmIGFueSBmb2xsb3ctdXAgZGlyZWN0aXZlcyBhcmUgZmxhZ2dlZCBhcyBkaXJ0eSB0aGVuIHRoZVxuICogYWxnb3JpdGhtIHdpbGwgcnVuIGFnYWluIGZvciB0aGVtLiBPdGhlcndpc2UgaWYgdGhlIHNoYXBlIGRpZCBub3QgY2hhbmdlIHRoZW4gYW55IGZvbGxvdy11cFxuICogZGlyZWN0aXZlcyB3aWxsIG5vdCBydW4gKHNvIGxvbmcgYXMgdGhlaXIgYmluZGluZyB2YWx1ZXMgc3RheSB0aGUgc2FtZSkuXG4gKlxuICogQHJldHVybnMgdGhlIHRvdGFsIGFtb3VudCBvZiBuZXcgc2xvdHMgdGhhdCB3ZXJlIGFsbG9jYXRlZCBpbnRvIHRoZSBjb250ZXh0IGR1ZSB0byBuZXcgc3R5bGluZ1xuICogICAgICAgICAgcHJvcGVydGllcyB0aGF0IHdlcmUgZGV0ZWN0ZWQuXG4gKi9cbmZ1bmN0aW9uIHBhdGNoU3R5bGluZ01hcEludG9Db250ZXh0KFxuICAgIGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBkaXJlY3RpdmVJbmRleDogbnVtYmVyLCBwbGF5ZXJCdWlsZGVySW5kZXg6IG51bWJlciwgY3R4U3RhcnQ6IG51bWJlcixcbiAgICBjdHhFbmQ6IG51bWJlciwgcHJvcHM6IChzdHJpbmcgfCBudWxsKVtdLCB2YWx1ZXM6IHtba2V5OiBzdHJpbmddOiBhbnl9IHwgdHJ1ZSwgY2FjaGVWYWx1ZTogYW55LFxuICAgIGVudHJ5SXNDbGFzc0Jhc2VkOiBib29sZWFuKTogbnVtYmVyIHtcbiAgbGV0IGRpcnR5ID0gZmFsc2U7XG5cbiAgY29uc3QgY2FjaGVJbmRleCA9IE1hcEJhc2VkT2Zmc2V0VmFsdWVzSW5kZXguVmFsdWVzU3RhcnRQb3NpdGlvbiArXG4gICAgICBkaXJlY3RpdmVJbmRleCAqIE1hcEJhc2VkT2Zmc2V0VmFsdWVzSW5kZXguU2l6ZTtcblxuICAvLyB0aGUgY2FjaGVkVmFsdWVzIGFycmF5IGlzIHRoZSByZWdpc3RyeSBvZiBhbGwgbXVsdGkgc3R5bGUgdmFsdWVzIChtYXAgdmFsdWVzKS4gRWFjaFxuICAvLyB2YWx1ZSBpcyBzdG9yZWQgKGNhY2hlZCkgZWFjaCB0aW1lIGlzIHVwZGF0ZWQuXG4gIGNvbnN0IGNhY2hlZFZhbHVlcyA9XG4gICAgICBjb250ZXh0W2VudHJ5SXNDbGFzc0Jhc2VkID8gU3R5bGluZ0luZGV4LkNhY2hlZE11bHRpQ2xhc3NlcyA6IFN0eWxpbmdJbmRleC5DYWNoZWRNdWx0aVN0eWxlc107XG5cbiAgLy8gdGhpcyBpcyB0aGUgaW5kZXggaW4gd2hpY2ggdGhpcyBkaXJlY3RpdmUgaGFzIG93bmVyc2hpcCBhY2Nlc3MgdG8gd3JpdGUgdG8gdGhpc1xuICAvLyB2YWx1ZSAoYW55dGhpbmcgYmVmb3JlIGlzIG93bmVkIGJ5IGEgcHJldmlvdXMgZGlyZWN0aXZlIHRoYXQgaXMgbW9yZSBpbXBvcnRhbnQpXG4gIGNvbnN0IG93bmVyc2hpcFZhbHVlc1N0YXJ0SW5kZXggPVxuICAgICAgY2FjaGVkVmFsdWVzW2NhY2hlSW5kZXggKyBNYXBCYXNlZE9mZnNldFZhbHVlc0luZGV4LlBvc2l0aW9uU3RhcnRPZmZzZXRdO1xuXG4gIGNvbnN0IGV4aXN0aW5nQ2FjaGVkVmFsdWUgPSBjYWNoZWRWYWx1ZXNbY2FjaGVJbmRleCArIE1hcEJhc2VkT2Zmc2V0VmFsdWVzSW5kZXguVmFsdWVPZmZzZXRdO1xuICBjb25zdCBleGlzdGluZ0NhY2hlZFZhbHVlQ291bnQgPVxuICAgICAgY2FjaGVkVmFsdWVzW2NhY2hlSW5kZXggKyBNYXBCYXNlZE9mZnNldFZhbHVlc0luZGV4LlZhbHVlQ291bnRPZmZzZXRdO1xuICBjb25zdCBleGlzdGluZ0NhY2hlZFZhbHVlSXNEaXJ0eSA9XG4gICAgICBjYWNoZWRWYWx1ZXNbY2FjaGVJbmRleCArIE1hcEJhc2VkT2Zmc2V0VmFsdWVzSW5kZXguRGlydHlGbGFnT2Zmc2V0XSA9PT0gMTtcblxuICAvLyBBIHNoYXBlIGNoYW5nZSBtZWFucyB0aGUgcHJvdmlkZWQgbWFwIHZhbHVlIGhhcyBlaXRoZXIgcmVtb3ZlZCBvciBhZGRlZCBuZXcgcHJvcGVydGllc1xuICAvLyBjb21wYXJlZCB0byB3aGF0IHdlcmUgaW4gdGhlIGxhc3QgdGltZS4gSWYgYSBzaGFwZSBjaGFuZ2Ugb2NjdXJzIHRoZW4gaXQgbWVhbnMgdGhhdCBhbGxcbiAgLy8gZm9sbG93LXVwIG11bHRpLXN0eWxpbmcgZW50cmllcyBhcmUgb2Jzb2xldGUgYW5kIHdpbGwgYmUgZXhhbWluZWQgYWdhaW4gd2hlbiBDRCBydW5zXG4gIC8vIHRoZW0uIElmIGEgc2hhcGUgY2hhbmdlIGhhcyBub3Qgb2NjdXJyZWQgdGhlbiB0aGVyZSBpcyBubyByZWFzb24gdG8gY2hlY2sgYW55IG90aGVyXG4gIC8vIGRpcmVjdGl2ZSB2YWx1ZXMgaWYgdGhlaXIgaWRlbnRpdHkgaGFzIG5vdCBjaGFuZ2VkLiBJZiBhIHByZXZpb3VzIGRpcmVjdGl2ZSBzZXQgdGhpc1xuICAvLyB2YWx1ZSBhcyBkaXJ0eSAoYmVjYXVzZSBpdHMgb3duIHNoYXBlIGNoYW5nZWQpIHRoZW4gdGhpcyBtZWFucyB0aGF0IHRoZSBvYmplY3QgaGFzIGJlZW5cbiAgLy8gb2Zmc2V0IHRvIGEgZGlmZmVyZW50IGFyZWEgaW4gdGhlIGNvbnRleHQuIEJlY2F1c2UgaXRzIHZhbHVlIGhhcyBiZWVuIG9mZnNldCB0aGVuIGl0XG4gIC8vIGNhbid0IHdyaXRlIHRvIGEgcmVnaW9uIHRoYXQgaXQgd3JvdGUgdG8gYmVmb3JlICh3aGljaCBtYXkgaGF2ZSBiZWVuIGEgcGFydCBvZiBhbm90aGVyXG4gIC8vIGRpcmVjdGl2ZSkgYW5kIHRoZXJlZm9yZSBpdHMgc2hhcGUgY2hhbmdlcyB0b28uXG4gIGxldCB2YWx1ZXNFbnRyeVNoYXBlQ2hhbmdlID1cbiAgICAgIGV4aXN0aW5nQ2FjaGVkVmFsdWVJc0RpcnR5IHx8ICgoIWV4aXN0aW5nQ2FjaGVkVmFsdWUgJiYgY2FjaGVWYWx1ZSkgPyB0cnVlIDogZmFsc2UpO1xuXG4gIGxldCB0b3RhbFVuaXF1ZVZhbHVlcyA9IDA7XG4gIGxldCB0b3RhbE5ld0FsbG9jYXRlZFNsb3RzID0gMDtcblxuICAvLyB0aGlzIGlzIGEgdHJpY2sgdG8gYXZvaWQgYnVpbGRpbmcge2tleTp2YWx1ZX0gbWFwIHdoZXJlIGFsbCB0aGUgdmFsdWVzXG4gIC8vIGFyZSBgdHJ1ZWAgKHRoaXMgaGFwcGVucyB3aGVuIGEgY2xhc3NOYW1lIHN0cmluZyBpcyBwcm92aWRlZCBpbnN0ZWFkIG9mIGFcbiAgLy8gbWFwIGFzIGFuIGlucHV0IHZhbHVlIHRvIHRoaXMgc3R5bGluZyBhbGdvcml0aG0pXG4gIGNvbnN0IGFwcGx5QWxsUHJvcHMgPSB2YWx1ZXMgPT09IHRydWU7XG5cbiAgLy8gU1RFUCAxOlxuICAvLyBsb29wIHRocm91Z2ggdGhlIGVhcmxpZXIgZGlyZWN0aXZlcyBhbmQgZmlndXJlIG91dCBpZiBhbnkgcHJvcGVydGllcyBoZXJlIHdpbGwgYmUgcGxhY2VkXG4gIC8vIGluIHRoZWlyIGFyZWEgKHRoaXMgaGFwcGVucyB3aGVuIHRoZSB2YWx1ZSBpcyBudWxsIGJlY2F1c2UgdGhlIGVhcmxpZXIgZGlyZWN0aXZlIGVyYXNlZCBpdCkuXG4gIGxldCBjdHhJbmRleCA9IGN0eFN0YXJ0O1xuICBsZXQgdG90YWxSZW1haW5pbmdQcm9wZXJ0aWVzID0gcHJvcHMubGVuZ3RoO1xuICB3aGlsZSAoY3R4SW5kZXggPCBvd25lcnNoaXBWYWx1ZXNTdGFydEluZGV4KSB7XG4gICAgY29uc3QgY3VycmVudFByb3AgPSBnZXRQcm9wKGNvbnRleHQsIGN0eEluZGV4KTtcbiAgICBpZiAodG90YWxSZW1haW5pbmdQcm9wZXJ0aWVzKSB7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHByb3BzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IG1hcFByb3AgPSBwcm9wc1tpXTtcbiAgICAgICAgY29uc3Qgbm9ybWFsaXplZFByb3AgPSBtYXBQcm9wID8gKGVudHJ5SXNDbGFzc0Jhc2VkID8gbWFwUHJvcCA6IGh5cGhlbmF0ZShtYXBQcm9wKSkgOiBudWxsO1xuICAgICAgICBpZiAobm9ybWFsaXplZFByb3AgJiYgY3VycmVudFByb3AgPT09IG5vcm1hbGl6ZWRQcm9wKSB7XG4gICAgICAgICAgY29uc3QgY3VycmVudFZhbHVlID0gZ2V0VmFsdWUoY29udGV4dCwgY3R4SW5kZXgpO1xuICAgICAgICAgIGNvbnN0IGN1cnJlbnREaXJlY3RpdmVJbmRleCA9IGdldERpcmVjdGl2ZUluZGV4RnJvbUVudHJ5KGNvbnRleHQsIGN0eEluZGV4KTtcbiAgICAgICAgICBjb25zdCB2YWx1ZSA9IGFwcGx5QWxsUHJvcHMgPyB0cnVlIDogKHZhbHVlcyBhc3tba2V5OiBzdHJpbmddOiBhbnl9KVtub3JtYWxpemVkUHJvcF07XG4gICAgICAgICAgY29uc3QgY3VycmVudEZsYWcgPSBnZXRQb2ludGVycyhjb250ZXh0LCBjdHhJbmRleCk7XG4gICAgICAgICAgaWYgKGhhc1ZhbHVlQ2hhbmdlZChjdXJyZW50RmxhZywgY3VycmVudFZhbHVlLCB2YWx1ZSkgJiZcbiAgICAgICAgICAgICAgYWxsb3dWYWx1ZUNoYW5nZShjdXJyZW50VmFsdWUsIHZhbHVlLCBjdXJyZW50RGlyZWN0aXZlSW5kZXgsIGRpcmVjdGl2ZUluZGV4KSkge1xuICAgICAgICAgICAgc2V0VmFsdWUoY29udGV4dCwgY3R4SW5kZXgsIHZhbHVlKTtcbiAgICAgICAgICAgIHNldFBsYXllckJ1aWxkZXJJbmRleChjb250ZXh0LCBjdHhJbmRleCwgcGxheWVyQnVpbGRlckluZGV4LCBkaXJlY3RpdmVJbmRleCk7XG4gICAgICAgICAgICBpZiAoaGFzSW5pdGlhbFZhbHVlQ2hhbmdlZChjb250ZXh0LCBjdXJyZW50RmxhZywgdmFsdWUpKSB7XG4gICAgICAgICAgICAgIHNldERpcnR5KGNvbnRleHQsIGN0eEluZGV4LCB0cnVlKTtcbiAgICAgICAgICAgICAgZGlydHkgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBwcm9wc1tpXSA9IG51bGw7XG4gICAgICAgICAgdG90YWxSZW1haW5pbmdQcm9wZXJ0aWVzLS07XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgY3R4SW5kZXggKz0gU3R5bGluZ0luZGV4LlNpemU7XG4gIH1cblxuICAvLyBTVEVQIDI6XG4gIC8vIGFwcGx5IHRoZSBsZWZ0IG92ZXIgcHJvcGVydGllcyB0byB0aGUgY29udGV4dCBpbiB0aGUgY29ycmVjdCBvcmRlci5cbiAgaWYgKHRvdGFsUmVtYWluaW5nUHJvcGVydGllcykge1xuICAgIGNvbnN0IHNhbml0aXplciA9IGVudHJ5SXNDbGFzc0Jhc2VkID8gbnVsbCA6IGdldFN0eWxlU2FuaXRpemVyKGNvbnRleHQsIGRpcmVjdGl2ZUluZGV4KTtcbiAgICBwcm9wZXJ0aWVzTG9vcDogZm9yIChsZXQgaSA9IDA7IGkgPCBwcm9wcy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgbWFwUHJvcCA9IHByb3BzW2ldO1xuXG4gICAgICBpZiAoIW1hcFByb3ApIHtcbiAgICAgICAgLy8gdGhpcyBpcyBhbiBlYXJseSBleGl0IGluIGNhc2UgYSB2YWx1ZSB3YXMgYWxyZWFkeSBlbmNvdW50ZXJlZCBhYm92ZSBpbiB0aGVcbiAgICAgICAgLy8gcHJldmlvdXMgbG9vcCAod2hpY2ggbWVhbnMgdGhhdCB0aGUgcHJvcGVydHkgd2FzIGFwcGxpZWQgb3IgcmVqZWN0ZWQpXG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBjb25zdCB2YWx1ZSA9IGFwcGx5QWxsUHJvcHMgPyB0cnVlIDogKHZhbHVlcyBhc3tba2V5OiBzdHJpbmddOiBhbnl9KVttYXBQcm9wXTtcbiAgICAgIGNvbnN0IG5vcm1hbGl6ZWRQcm9wID0gZW50cnlJc0NsYXNzQmFzZWQgPyBtYXBQcm9wIDogaHlwaGVuYXRlKG1hcFByb3ApO1xuICAgICAgY29uc3QgaXNJbnNpZGVPd25lcnNoaXBBcmVhID0gY3R4SW5kZXggPj0gb3duZXJzaGlwVmFsdWVzU3RhcnRJbmRleDtcblxuICAgICAgZm9yIChsZXQgaiA9IGN0eEluZGV4OyBqIDwgY3R4RW5kOyBqICs9IFN0eWxpbmdJbmRleC5TaXplKSB7XG4gICAgICAgIGNvbnN0IGRpc3RhbnRDdHhQcm9wID0gZ2V0UHJvcChjb250ZXh0LCBqKTtcbiAgICAgICAgaWYgKGRpc3RhbnRDdHhQcm9wID09PSBub3JtYWxpemVkUHJvcCkge1xuICAgICAgICAgIGNvbnN0IGRpc3RhbnRDdHhEaXJlY3RpdmVJbmRleCA9IGdldERpcmVjdGl2ZUluZGV4RnJvbUVudHJ5KGNvbnRleHQsIGopO1xuICAgICAgICAgIGNvbnN0IGRpc3RhbnRDdHhQbGF5ZXJCdWlsZGVySW5kZXggPSBnZXRQbGF5ZXJCdWlsZGVySW5kZXgoY29udGV4dCwgaik7XG4gICAgICAgICAgY29uc3QgZGlzdGFudEN0eFZhbHVlID0gZ2V0VmFsdWUoY29udGV4dCwgaik7XG4gICAgICAgICAgY29uc3QgZGlzdGFudEN0eEZsYWcgPSBnZXRQb2ludGVycyhjb250ZXh0LCBqKTtcblxuICAgICAgICAgIGlmIChhbGxvd1ZhbHVlQ2hhbmdlKGRpc3RhbnRDdHhWYWx1ZSwgdmFsdWUsIGRpc3RhbnRDdHhEaXJlY3RpdmVJbmRleCwgZGlyZWN0aXZlSW5kZXgpKSB7XG4gICAgICAgICAgICAvLyBldmVuIGlmIHRoZSBlbnRyeSBpc24ndCB1cGRhdGVkIChieSB2YWx1ZSBvciBkaXJlY3RpdmVJbmRleCkgdGhlblxuICAgICAgICAgICAgLy8gaXQgc2hvdWxkIHN0aWxsIGJlIG1vdmVkIG92ZXIgdG8gdGhlIGNvcnJlY3Qgc3BvdCBpbiB0aGUgYXJyYXkgc29cbiAgICAgICAgICAgIC8vIHRoZSBpdGVyYXRpb24gbG9vcCBpcyB0aWdodGVyLlxuICAgICAgICAgICAgaWYgKGlzSW5zaWRlT3duZXJzaGlwQXJlYSkge1xuICAgICAgICAgICAgICBzd2FwTXVsdGlDb250ZXh0RW50cmllcyhjb250ZXh0LCBjdHhJbmRleCwgaik7XG4gICAgICAgICAgICAgIHRvdGFsVW5pcXVlVmFsdWVzKys7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChoYXNWYWx1ZUNoYW5nZWQoZGlzdGFudEN0eEZsYWcsIGRpc3RhbnRDdHhWYWx1ZSwgdmFsdWUpKSB7XG4gICAgICAgICAgICAgIGlmICh2YWx1ZSA9PT0gbnVsbCB8fCB2YWx1ZSA9PT0gdW5kZWZpbmVkICYmIHZhbHVlICE9PSBkaXN0YW50Q3R4VmFsdWUpIHtcbiAgICAgICAgICAgICAgICB2YWx1ZXNFbnRyeVNoYXBlQ2hhbmdlID0gdHJ1ZTtcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIHNldFZhbHVlKGNvbnRleHQsIGN0eEluZGV4LCB2YWx1ZSk7XG5cbiAgICAgICAgICAgICAgLy8gU0tJUCBJRiBJTklUSUFMIENIRUNLXG4gICAgICAgICAgICAgIC8vIElmIHRoZSBmb3JtZXIgYHZhbHVlYCBpcyBgbnVsbGAgdGhlbiBpdCBtZWFucyB0aGF0IGFuIGluaXRpYWwgdmFsdWVcbiAgICAgICAgICAgICAgLy8gY291bGQgYmUgYmVpbmcgcmVuZGVyZWQgb24gc2NyZWVuLiBJZiB0aGF0IGlzIHRoZSBjYXNlIHRoZW4gdGhlcmUgaXNcbiAgICAgICAgICAgICAgLy8gbm8gcG9pbnQgaW4gdXBkYXRpbmcgdGhlIHZhbHVlIGluIGNhc2UgaXQgbWF0Y2hlcy4gSW4gb3RoZXIgd29yZHMgaWYgdGhlXG4gICAgICAgICAgICAgIC8vIG5ldyB2YWx1ZSBpcyB0aGUgZXhhY3Qgc2FtZSBhcyB0aGUgcHJldmlvdXNseSByZW5kZXJlZCB2YWx1ZSAod2hpY2hcbiAgICAgICAgICAgICAgLy8gaGFwcGVucyB0byBiZSB0aGUgaW5pdGlhbCB2YWx1ZSkgdGhlbiBkbyBub3RoaW5nLlxuICAgICAgICAgICAgICBpZiAoZGlzdGFudEN0eFZhbHVlICE9PSBudWxsIHx8XG4gICAgICAgICAgICAgICAgICBoYXNJbml0aWFsVmFsdWVDaGFuZ2VkKGNvbnRleHQsIGRpc3RhbnRDdHhGbGFnLCB2YWx1ZSkpIHtcbiAgICAgICAgICAgICAgICBzZXREaXJ0eShjb250ZXh0LCBjdHhJbmRleCwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgZGlydHkgPSB0cnVlO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChkaXN0YW50Q3R4RGlyZWN0aXZlSW5kZXggIT09IGRpcmVjdGl2ZUluZGV4IHx8XG4gICAgICAgICAgICAgICAgcGxheWVyQnVpbGRlckluZGV4ICE9PSBkaXN0YW50Q3R4UGxheWVyQnVpbGRlckluZGV4KSB7XG4gICAgICAgICAgICAgIHNldFBsYXllckJ1aWxkZXJJbmRleChjb250ZXh0LCBjdHhJbmRleCwgcGxheWVyQnVpbGRlckluZGV4LCBkaXJlY3RpdmVJbmRleCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY3R4SW5kZXggKz0gU3R5bGluZ0luZGV4LlNpemU7XG4gICAgICAgICAgY29udGludWUgcHJvcGVydGllc0xvb3A7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gZmFsbGJhY2sgY2FzZSAuLi4gdmFsdWUgbm90IGZvdW5kIGF0IGFsbCBpbiB0aGUgY29udGV4dFxuICAgICAgaWYgKHZhbHVlICE9IG51bGwpIHtcbiAgICAgICAgdmFsdWVzRW50cnlTaGFwZUNoYW5nZSA9IHRydWU7XG4gICAgICAgIHRvdGFsVW5pcXVlVmFsdWVzKys7XG4gICAgICAgIGNvbnN0IGZsYWcgPSBwcmVwYXJlSW5pdGlhbEZsYWcoY29udGV4dCwgbm9ybWFsaXplZFByb3AsIGVudHJ5SXNDbGFzc0Jhc2VkLCBzYW5pdGl6ZXIpIHxcbiAgICAgICAgICAgIFN0eWxpbmdGbGFncy5EaXJ0eTtcblxuICAgICAgICBjb25zdCBpbnNlcnRpb25JbmRleCA9IGlzSW5zaWRlT3duZXJzaGlwQXJlYSA/XG4gICAgICAgICAgICBjdHhJbmRleCA6XG4gICAgICAgICAgICAob3duZXJzaGlwVmFsdWVzU3RhcnRJbmRleCArIHRvdGFsTmV3QWxsb2NhdGVkU2xvdHMgKiBTdHlsaW5nSW5kZXguU2l6ZSk7XG4gICAgICAgIGluc2VydE5ld011bHRpUHJvcGVydHkoXG4gICAgICAgICAgICBjb250ZXh0LCBpbnNlcnRpb25JbmRleCwgZW50cnlJc0NsYXNzQmFzZWQsIG5vcm1hbGl6ZWRQcm9wLCBmbGFnLCB2YWx1ZSwgZGlyZWN0aXZlSW5kZXgsXG4gICAgICAgICAgICBwbGF5ZXJCdWlsZGVySW5kZXgpO1xuXG4gICAgICAgIHRvdGFsTmV3QWxsb2NhdGVkU2xvdHMrKztcbiAgICAgICAgY3R4RW5kICs9IFN0eWxpbmdJbmRleC5TaXplO1xuICAgICAgICBjdHhJbmRleCArPSBTdHlsaW5nSW5kZXguU2l6ZTtcblxuICAgICAgICBkaXJ0eSA9IHRydWU7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8gU1RFUCAzOlxuICAvLyBSZW1vdmUgKG51bGxpZnkpIGFueSBleGlzdGluZyBlbnRyaWVzIGluIHRoZSBjb250ZXh0IHRoYXQgd2VyZSBub3QgYSBwYXJ0IG9mIHRoZVxuICAvLyBtYXAgaW5wdXQgdmFsdWUgdGhhdCB3YXMgcGFzc2VkIGludG8gdGhpcyBhbGdvcml0aG0gZm9yIHRoaXMgZGlyZWN0aXZlLlxuICB3aGlsZSAoY3R4SW5kZXggPCBjdHhFbmQpIHtcbiAgICB2YWx1ZXNFbnRyeVNoYXBlQ2hhbmdlID0gdHJ1ZTsgIC8vIHNvbWUgdmFsdWVzIGFyZSBtaXNzaW5nXG4gICAgY29uc3QgY3R4VmFsdWUgPSBnZXRWYWx1ZShjb250ZXh0LCBjdHhJbmRleCk7XG4gICAgY29uc3QgY3R4RmxhZyA9IGdldFBvaW50ZXJzKGNvbnRleHQsIGN0eEluZGV4KTtcbiAgICBjb25zdCBjdHhEaXJlY3RpdmUgPSBnZXREaXJlY3RpdmVJbmRleEZyb21FbnRyeShjb250ZXh0LCBjdHhJbmRleCk7XG4gICAgaWYgKGN0eFZhbHVlICE9IG51bGwpIHtcbiAgICAgIHZhbHVlc0VudHJ5U2hhcGVDaGFuZ2UgPSB0cnVlO1xuICAgIH1cbiAgICBpZiAoaGFzVmFsdWVDaGFuZ2VkKGN0eEZsYWcsIGN0eFZhbHVlLCBudWxsKSkge1xuICAgICAgc2V0VmFsdWUoY29udGV4dCwgY3R4SW5kZXgsIG51bGwpO1xuICAgICAgLy8gb25seSBpZiB0aGUgaW5pdGlhbCB2YWx1ZSBpcyBmYWxzeSB0aGVuXG4gICAgICBpZiAoaGFzSW5pdGlhbFZhbHVlQ2hhbmdlZChjb250ZXh0LCBjdHhGbGFnLCBjdHhWYWx1ZSkpIHtcbiAgICAgICAgc2V0RGlydHkoY29udGV4dCwgY3R4SW5kZXgsIHRydWUpO1xuICAgICAgICBkaXJ0eSA9IHRydWU7XG4gICAgICB9XG4gICAgICBzZXRQbGF5ZXJCdWlsZGVySW5kZXgoY29udGV4dCwgY3R4SW5kZXgsIHBsYXllckJ1aWxkZXJJbmRleCwgZGlyZWN0aXZlSW5kZXgpO1xuICAgIH1cbiAgICBjdHhJbmRleCArPSBTdHlsaW5nSW5kZXguU2l6ZTtcbiAgfVxuXG4gIC8vIEJlY2F1c2UgdGhlIG9iamVjdCBzaGFwZSBoYXMgY2hhbmdlZCwgdGhpcyBtZWFucyB0aGF0IGFsbCBmb2xsb3ctdXAgZGlyZWN0aXZlcyB3aWxsIG5lZWQgdG9cbiAgLy8gcmVhcHBseSB0aGVpciB2YWx1ZXMgaW50byB0aGUgb2JqZWN0LiBGb3IgdGhpcyB0byBoYXBwZW4sIHRoZSBjYWNoZWQgYXJyYXkgbmVlZHMgdG8gYmUgdXBkYXRlZFxuICAvLyB3aXRoIGRpcnR5IGZsYWdzIHNvIHRoYXQgZm9sbG93LXVwIGNhbGxzIHRvIGB1cGRhdGVTdHlsaW5nTWFwYCB3aWxsIHJlYXBwbHkgdGhlaXIgc3R5bGluZyBjb2RlLlxuICAvLyB0aGUgcmVhcHBsaWNhdGlvbiBvZiBzdHlsaW5nIGNvZGUgd2l0aGluIHRoZSBjb250ZXh0IHdpbGwgcmVzaGFwZSBpdCBhbmQgdXBkYXRlIHRoZSBvZmZzZXRcbiAgLy8gdmFsdWVzIChhbHNvIGZvbGxvdy11cCBkaXJlY3RpdmVzIGNhbiB3cml0ZSBuZXcgdmFsdWVzIGluIGNhc2UgZWFybGllciBkaXJlY3RpdmVzIHNldCBhbnl0aGluZ1xuICAvLyB0byBudWxsIGR1ZSB0byByZW1vdmFscyBvciBmYWxzeSB2YWx1ZXMpLlxuICB2YWx1ZXNFbnRyeVNoYXBlQ2hhbmdlID0gdmFsdWVzRW50cnlTaGFwZUNoYW5nZSB8fCBleGlzdGluZ0NhY2hlZFZhbHVlQ291bnQgIT09IHRvdGFsVW5pcXVlVmFsdWVzO1xuICB1cGRhdGVDYWNoZWRNYXBWYWx1ZShcbiAgICAgIGNvbnRleHQsIGRpcmVjdGl2ZUluZGV4LCBlbnRyeUlzQ2xhc3NCYXNlZCwgY2FjaGVWYWx1ZSwgb3duZXJzaGlwVmFsdWVzU3RhcnRJbmRleCwgY3R4RW5kLFxuICAgICAgdG90YWxVbmlxdWVWYWx1ZXMsIHZhbHVlc0VudHJ5U2hhcGVDaGFuZ2UpO1xuXG4gIGlmIChkaXJ0eSkge1xuICAgIHNldENvbnRleHREaXJ0eShjb250ZXh0LCB0cnVlKTtcbiAgfVxuXG4gIHJldHVybiB0b3RhbE5ld0FsbG9jYXRlZFNsb3RzO1xufVxuXG4vKipcbiAqIFNldHMgYW5kIHJlc29sdmVzIGEgc2luZ2xlIGNsYXNzIHZhbHVlIG9uIHRoZSBwcm92aWRlZCBgU3R5bGluZ0NvbnRleHRgIHNvXG4gKiB0aGF0IHRoZXkgY2FuIGJlIGFwcGxpZWQgdG8gdGhlIGVsZW1lbnQgb25jZSBgcmVuZGVyU3R5bGluZ2AgaXMgY2FsbGVkLlxuICpcbiAqIEBwYXJhbSBjb250ZXh0IFRoZSBzdHlsaW5nIGNvbnRleHQgdGhhdCB3aWxsIGJlIHVwZGF0ZWQgd2l0aCB0aGVcbiAqICAgIG5ld2x5IHByb3ZpZGVkIGNsYXNzIHZhbHVlLlxuICogQHBhcmFtIG9mZnNldCBUaGUgaW5kZXggb2YgdGhlIENTUyBjbGFzcyB3aGljaCBpcyBiZWluZyB1cGRhdGVkLlxuICogQHBhcmFtIGFkZE9yUmVtb3ZlIFdoZXRoZXIgb3Igbm90IHRvIGFkZCBvciByZW1vdmUgdGhlIENTUyBjbGFzc1xuICogQHBhcmFtIGZvcmNlT3ZlcnJpZGUgd2hldGhlciBvciBub3QgdG8gc2tpcCBhbGwgZGlyZWN0aXZlIHByaW9yaXRpemF0aW9uXG4gKiAgICBhbmQganVzdCBhcHBseSB0aGUgdmFsdWUgcmVnYXJkbGVzcy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHVwZGF0ZUNsYXNzUHJvcChcbiAgICBjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgb2Zmc2V0OiBudW1iZXIsXG4gICAgaW5wdXQ6IGJvb2xlYW4gfCBCb3VuZFBsYXllckZhY3Rvcnk8Ym9vbGVhbnxudWxsPnwgbnVsbCwgZGlyZWN0aXZlSW5kZXg6IG51bWJlciA9IDAsXG4gICAgZm9yY2VPdmVycmlkZT86IGJvb2xlYW4pOiB2b2lkIHtcbiAgdXBkYXRlU2luZ2xlU3R5bGluZ1ZhbHVlKGNvbnRleHQsIG9mZnNldCwgaW5wdXQsIHRydWUsIGRpcmVjdGl2ZUluZGV4LCBmb3JjZU92ZXJyaWRlKTtcbn1cblxuLyoqXG4gKiBTZXRzIGFuZCByZXNvbHZlcyBhIHNpbmdsZSBzdHlsZSB2YWx1ZSBvbiB0aGUgcHJvdmlkZWQgYFN0eWxpbmdDb250ZXh0YCBzb1xuICogdGhhdCB0aGV5IGNhbiBiZSBhcHBsaWVkIHRvIHRoZSBlbGVtZW50IG9uY2UgYHJlbmRlclN0eWxpbmdgIGlzIGNhbGxlZC5cbiAqXG4gKiBOb3RlIHRoYXQgcHJvcC1sZXZlbCBzdHlsaW5nIHZhbHVlcyBhcmUgY29uc2lkZXJlZCBoaWdoZXIgcHJpb3JpdHkgdGhhbiBhbnkgc3R5bGluZyB0aGF0XG4gKiBoYXMgYmVlbiBhcHBsaWVkIHVzaW5nIGB1cGRhdGVTdHlsaW5nTWFwYCwgdGhlcmVmb3JlLCB3aGVuIHN0eWxpbmcgdmFsdWVzIGFyZSByZW5kZXJlZFxuICogdGhlbiBhbnkgc3R5bGVzL2NsYXNzZXMgdGhhdCBoYXZlIGJlZW4gYXBwbGllZCB1c2luZyB0aGlzIGZ1bmN0aW9uIHdpbGwgYmUgY29uc2lkZXJlZCBmaXJzdFxuICogKHRoZW4gbXVsdGkgdmFsdWVzIHNlY29uZCBhbmQgdGhlbiBpbml0aWFsIHZhbHVlcyBhcyBhIGJhY2t1cCkuXG4gKlxuICogQHBhcmFtIGNvbnRleHQgVGhlIHN0eWxpbmcgY29udGV4dCB0aGF0IHdpbGwgYmUgdXBkYXRlZCB3aXRoIHRoZVxuICogICAgbmV3bHkgcHJvdmlkZWQgc3R5bGUgdmFsdWUuXG4gKiBAcGFyYW0gb2Zmc2V0IFRoZSBpbmRleCBvZiB0aGUgcHJvcGVydHkgd2hpY2ggaXMgYmVpbmcgdXBkYXRlZC5cbiAqIEBwYXJhbSB2YWx1ZSBUaGUgQ1NTIHN0eWxlIHZhbHVlIHRoYXQgd2lsbCBiZSBhc3NpZ25lZFxuICogQHBhcmFtIGZvcmNlT3ZlcnJpZGUgd2hldGhlciBvciBub3QgdG8gc2tpcCBhbGwgZGlyZWN0aXZlIHByaW9yaXRpemF0aW9uXG4gKiAgICBhbmQganVzdCBhcHBseSB0aGUgdmFsdWUgcmVnYXJkbGVzcy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHVwZGF0ZVN0eWxlUHJvcChcbiAgICBjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgb2Zmc2V0OiBudW1iZXIsXG4gICAgaW5wdXQ6IHN0cmluZyB8IGJvb2xlYW4gfCBudWxsIHwgQm91bmRQbGF5ZXJGYWN0b3J5PHN0cmluZ3xib29sZWFufG51bGw+LFxuICAgIGRpcmVjdGl2ZUluZGV4OiBudW1iZXIgPSAwLCBmb3JjZU92ZXJyaWRlPzogYm9vbGVhbik6IHZvaWQge1xuICB1cGRhdGVTaW5nbGVTdHlsaW5nVmFsdWUoY29udGV4dCwgb2Zmc2V0LCBpbnB1dCwgZmFsc2UsIGRpcmVjdGl2ZUluZGV4LCBmb3JjZU92ZXJyaWRlKTtcbn1cblxuZnVuY3Rpb24gdXBkYXRlU2luZ2xlU3R5bGluZ1ZhbHVlKFxuICAgIGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBvZmZzZXQ6IG51bWJlcixcbiAgICBpbnB1dDogc3RyaW5nIHwgYm9vbGVhbiB8IG51bGwgfCBCb3VuZFBsYXllckZhY3Rvcnk8c3RyaW5nfGJvb2xlYW58bnVsbD4sIGlzQ2xhc3NCYXNlZDogYm9vbGVhbixcbiAgICBkaXJlY3RpdmVJbmRleDogbnVtYmVyLCBmb3JjZU92ZXJyaWRlPzogYm9vbGVhbik6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0VmFsaWREaXJlY3RpdmVJbmRleChjb250ZXh0LCBkaXJlY3RpdmVJbmRleCk7XG4gIGNvbnN0IHNpbmdsZUluZGV4ID0gZ2V0U2luZ2xlUHJvcEluZGV4VmFsdWUoY29udGV4dCwgZGlyZWN0aXZlSW5kZXgsIG9mZnNldCwgaXNDbGFzc0Jhc2VkKTtcbiAgY29uc3QgY3VyclZhbHVlID0gZ2V0VmFsdWUoY29udGV4dCwgc2luZ2xlSW5kZXgpO1xuICBjb25zdCBjdXJyRmxhZyA9IGdldFBvaW50ZXJzKGNvbnRleHQsIHNpbmdsZUluZGV4KTtcbiAgY29uc3QgY3VyckRpcmVjdGl2ZSA9IGdldERpcmVjdGl2ZUluZGV4RnJvbUVudHJ5KGNvbnRleHQsIHNpbmdsZUluZGV4KTtcbiAgY29uc3QgdmFsdWU6IHN0cmluZ3xib29sZWFufG51bGwgPSAoaW5wdXQgaW5zdGFuY2VvZiBCb3VuZFBsYXllckZhY3RvcnkpID8gaW5wdXQudmFsdWUgOiBpbnB1dDtcblxuICBpZiAobmdEZXZNb2RlKSB7XG4gICAgaWYgKGlzQ2xhc3NCYXNlZCkge1xuICAgICAgbmdEZXZNb2RlLmNsYXNzUHJvcCsrO1xuICAgIH0gZWxzZSB7XG4gICAgICBuZ0Rldk1vZGUuc3R5bGVQcm9wKys7XG4gICAgfVxuICB9XG5cbiAgaWYgKGhhc1ZhbHVlQ2hhbmdlZChjdXJyRmxhZywgY3VyclZhbHVlLCB2YWx1ZSkgJiZcbiAgICAgIChmb3JjZU92ZXJyaWRlIHx8IGFsbG93VmFsdWVDaGFuZ2UoY3VyclZhbHVlLCB2YWx1ZSwgY3VyckRpcmVjdGl2ZSwgZGlyZWN0aXZlSW5kZXgpKSkge1xuICAgIGNvbnN0IGlzQ2xhc3NCYXNlZCA9IChjdXJyRmxhZyAmIFN0eWxpbmdGbGFncy5DbGFzcykgPT09IFN0eWxpbmdGbGFncy5DbGFzcztcbiAgICBjb25zdCBlbGVtZW50ID0gY29udGV4dFtTdHlsaW5nSW5kZXguRWxlbWVudFBvc2l0aW9uXSAhYXMgSFRNTEVsZW1lbnQ7XG4gICAgY29uc3QgcGxheWVyQnVpbGRlciA9IGlucHV0IGluc3RhbmNlb2YgQm91bmRQbGF5ZXJGYWN0b3J5ID9cbiAgICAgICAgbmV3IENsYXNzQW5kU3R5bGVQbGF5ZXJCdWlsZGVyKFxuICAgICAgICAgICAgaW5wdXQgYXMgYW55LCBlbGVtZW50LCBpc0NsYXNzQmFzZWQgPyBCaW5kaW5nVHlwZS5DbGFzcyA6IEJpbmRpbmdUeXBlLlN0eWxlKSA6XG4gICAgICAgIG51bGw7XG4gICAgY29uc3QgdmFsdWUgPSAocGxheWVyQnVpbGRlciA/IChpbnB1dCBhcyBCb3VuZFBsYXllckZhY3Rvcnk8YW55PikudmFsdWUgOiBpbnB1dCkgYXMgc3RyaW5nIHxcbiAgICAgICAgYm9vbGVhbiB8IG51bGw7XG4gICAgY29uc3QgY3VyclBsYXllckluZGV4ID0gZ2V0UGxheWVyQnVpbGRlckluZGV4KGNvbnRleHQsIHNpbmdsZUluZGV4KTtcblxuICAgIGxldCBwbGF5ZXJCdWlsZGVyc0FyZURpcnR5ID0gZmFsc2U7XG4gICAgbGV0IHBsYXllckJ1aWxkZXJJbmRleCA9IHBsYXllckJ1aWxkZXIgPyBjdXJyUGxheWVySW5kZXggOiAwO1xuICAgIGlmIChoYXNQbGF5ZXJCdWlsZGVyQ2hhbmdlZChjb250ZXh0LCBwbGF5ZXJCdWlsZGVyLCBjdXJyUGxheWVySW5kZXgpKSB7XG4gICAgICBjb25zdCBuZXdJbmRleCA9IHNldFBsYXllckJ1aWxkZXIoY29udGV4dCwgcGxheWVyQnVpbGRlciwgY3VyclBsYXllckluZGV4KTtcbiAgICAgIHBsYXllckJ1aWxkZXJJbmRleCA9IHBsYXllckJ1aWxkZXIgPyBuZXdJbmRleCA6IDA7XG4gICAgICBwbGF5ZXJCdWlsZGVyc0FyZURpcnR5ID0gdHJ1ZTtcbiAgICB9XG5cbiAgICBpZiAocGxheWVyQnVpbGRlcnNBcmVEaXJ0eSB8fCBjdXJyRGlyZWN0aXZlICE9PSBkaXJlY3RpdmVJbmRleCkge1xuICAgICAgc2V0UGxheWVyQnVpbGRlckluZGV4KGNvbnRleHQsIHNpbmdsZUluZGV4LCBwbGF5ZXJCdWlsZGVySW5kZXgsIGRpcmVjdGl2ZUluZGV4KTtcbiAgICB9XG5cbiAgICBpZiAoY3VyckRpcmVjdGl2ZSAhPT0gZGlyZWN0aXZlSW5kZXgpIHtcbiAgICAgIGNvbnN0IHByb3AgPSBnZXRQcm9wKGNvbnRleHQsIHNpbmdsZUluZGV4KTtcbiAgICAgIGNvbnN0IHNhbml0aXplciA9IGdldFN0eWxlU2FuaXRpemVyKGNvbnRleHQsIGRpcmVjdGl2ZUluZGV4KTtcbiAgICAgIHNldFNhbml0aXplRmxhZyhcbiAgICAgICAgICBjb250ZXh0LCBzaW5nbGVJbmRleCxcbiAgICAgICAgICAoc2FuaXRpemVyICYmIHNhbml0aXplcihwcm9wLCBudWxsLCBTdHlsZVNhbml0aXplTW9kZS5WYWxpZGF0ZVByb3BlcnR5KSkgPyB0cnVlIDogZmFsc2UpO1xuICAgIH1cblxuICAgIC8vIHRoZSB2YWx1ZSB3aWxsIGFsd2F5cyBnZXQgdXBkYXRlZCAoZXZlbiBpZiB0aGUgZGlydHkgZmxhZyBpcyBza2lwcGVkKVxuICAgIHNldFZhbHVlKGNvbnRleHQsIHNpbmdsZUluZGV4LCB2YWx1ZSk7XG4gICAgY29uc3QgaW5kZXhGb3JNdWx0aSA9IGdldE11bHRpT3JTaW5nbGVJbmRleChjdXJyRmxhZyk7XG5cbiAgICAvLyBpZiB0aGUgdmFsdWUgaXMgdGhlIHNhbWUgaW4gdGhlIG11bHRpLWFyZWEgdGhlbiB0aGVyZSdzIG5vIHBvaW50IGluIHJlLWFzc2VtYmxpbmdcbiAgICBjb25zdCB2YWx1ZUZvck11bHRpID0gZ2V0VmFsdWUoY29udGV4dCwgaW5kZXhGb3JNdWx0aSk7XG4gICAgaWYgKCF2YWx1ZUZvck11bHRpIHx8IGhhc1ZhbHVlQ2hhbmdlZChjdXJyRmxhZywgdmFsdWVGb3JNdWx0aSwgdmFsdWUpKSB7XG4gICAgICBsZXQgbXVsdGlEaXJ0eSA9IGZhbHNlO1xuICAgICAgbGV0IHNpbmdsZURpcnR5ID0gdHJ1ZTtcblxuICAgICAgLy8gb25seSB3aGVuIHRoZSB2YWx1ZSBpcyBzZXQgdG8gYG51bGxgIHNob3VsZCB0aGUgbXVsdGktdmFsdWUgZ2V0IGZsYWdnZWRcbiAgICAgIGlmICghdmFsdWVFeGlzdHModmFsdWUsIGlzQ2xhc3NCYXNlZCkgJiYgdmFsdWVFeGlzdHModmFsdWVGb3JNdWx0aSwgaXNDbGFzc0Jhc2VkKSkge1xuICAgICAgICBtdWx0aURpcnR5ID0gdHJ1ZTtcbiAgICAgICAgc2luZ2xlRGlydHkgPSBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgc2V0RGlydHkoY29udGV4dCwgaW5kZXhGb3JNdWx0aSwgbXVsdGlEaXJ0eSk7XG4gICAgICBzZXREaXJ0eShjb250ZXh0LCBzaW5nbGVJbmRleCwgc2luZ2xlRGlydHkpO1xuICAgICAgc2V0Q29udGV4dERpcnR5KGNvbnRleHQsIHRydWUpO1xuICAgIH1cblxuICAgIGlmIChwbGF5ZXJCdWlsZGVyc0FyZURpcnR5KSB7XG4gICAgICBzZXRDb250ZXh0UGxheWVyc0RpcnR5KGNvbnRleHQsIHRydWUpO1xuICAgIH1cblxuICAgIGlmIChuZ0Rldk1vZGUpIHtcbiAgICAgIGlmIChpc0NsYXNzQmFzZWQpIHtcbiAgICAgICAgbmdEZXZNb2RlLmNsYXNzUHJvcENhY2hlTWlzcysrO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbmdEZXZNb2RlLnN0eWxlUHJvcENhY2hlTWlzcysrO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG5cbi8qKlxuICogUmVuZGVycyBhbGwgcXVldWVkIHN0eWxpbmcgdXNpbmcgYSByZW5kZXJlciBvbnRvIHRoZSBnaXZlbiBlbGVtZW50LlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gd29ya3MgYnkgcmVuZGVyaW5nIGFueSBzdHlsZXMgKHRoYXQgaGF2ZSBiZWVuIGFwcGxpZWRcbiAqIHVzaW5nIGB1cGRhdGVTdHlsaW5nTWFwYCkgYW5kIGFueSBjbGFzc2VzICh0aGF0IGhhdmUgYmVlbiBhcHBsaWVkIHVzaW5nXG4gKiBgdXBkYXRlU3R5bGVQcm9wYCkgb250byB0aGUgcHJvdmlkZWQgZWxlbWVudCB1c2luZyB0aGUgcHJvdmlkZWQgcmVuZGVyZXIuXG4gKiBKdXN0IGJlZm9yZSB0aGUgc3R5bGVzL2NsYXNzZXMgYXJlIHJlbmRlcmVkIGEgZmluYWwga2V5L3ZhbHVlIHN0eWxlIG1hcFxuICogd2lsbCBiZSBhc3NlbWJsZWQgKGlmIGBzdHlsZVN0b3JlYCBvciBgY2xhc3NTdG9yZWAgYXJlIHByb3ZpZGVkKS5cbiAqXG4gKiBAcGFyYW0gbEVsZW1lbnQgdGhlIGVsZW1lbnQgdGhhdCB0aGUgc3R5bGVzIHdpbGwgYmUgcmVuZGVyZWQgb25cbiAqIEBwYXJhbSBjb250ZXh0IFRoZSBzdHlsaW5nIGNvbnRleHQgdGhhdCB3aWxsIGJlIHVzZWQgdG8gZGV0ZXJtaW5lXG4gKiAgICAgIHdoYXQgc3R5bGVzIHdpbGwgYmUgcmVuZGVyZWRcbiAqIEBwYXJhbSByZW5kZXJlciB0aGUgcmVuZGVyZXIgdGhhdCB3aWxsIGJlIHVzZWQgdG8gYXBwbHkgdGhlIHN0eWxpbmdcbiAqIEBwYXJhbSBjbGFzc2VzU3RvcmUgaWYgcHJvdmlkZWQsIHRoZSB1cGRhdGVkIGNsYXNzIHZhbHVlcyB3aWxsIGJlIGFwcGxpZWRcbiAqICAgIHRvIHRoaXMga2V5L3ZhbHVlIG1hcCBpbnN0ZWFkIG9mIGJlaW5nIHJlbmRlcmVyZWQgdmlhIHRoZSByZW5kZXJlci5cbiAqIEBwYXJhbSBzdHlsZXNTdG9yZSBpZiBwcm92aWRlZCwgdGhlIHVwZGF0ZWQgc3R5bGUgdmFsdWVzIHdpbGwgYmUgYXBwbGllZFxuICogICAgdG8gdGhpcyBrZXkvdmFsdWUgbWFwIGluc3RlYWQgb2YgYmVpbmcgcmVuZGVyZXJlZCB2aWEgdGhlIHJlbmRlcmVyLlxuICogQHJldHVybnMgbnVtYmVyIHRoZSB0b3RhbCBhbW91bnQgb2YgcGxheWVycyB0aGF0IGdvdCBxdWV1ZWQgZm9yIGFuaW1hdGlvbiAoaWYgYW55KVxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVuZGVyU3R5bGluZyhcbiAgICBjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgcmVuZGVyZXI6IFJlbmRlcmVyMyB8IG51bGwsIHJvb3RPclZpZXc6IFJvb3RDb250ZXh0IHwgTFZpZXcsXG4gICAgaXNGaXJzdFJlbmRlcjogYm9vbGVhbiwgY2xhc3Nlc1N0b3JlPzogQmluZGluZ1N0b3JlIHwgbnVsbCwgc3R5bGVzU3RvcmU/OiBCaW5kaW5nU3RvcmUgfCBudWxsLFxuICAgIGRpcmVjdGl2ZUluZGV4OiBudW1iZXIgPSAwKTogbnVtYmVyIHtcbiAgbGV0IHRvdGFsUGxheWVyc1F1ZXVlZCA9IDA7XG4gIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUuZmx1c2hTdHlsaW5nKys7XG5cbiAgLy8gdGhpcyBwcmV2ZW50cyBtdWx0aXBsZSBhdHRlbXB0cyB0byByZW5kZXIgc3R5bGUvY2xhc3MgdmFsdWVzIG9uXG4gIC8vIHRoZSBzYW1lIGVsZW1lbnQuLi5cbiAgaWYgKGFsbG93SG9zdEluc3RydWN0aW9uc1F1ZXVlRmx1c2goY29udGV4dCwgZGlyZWN0aXZlSW5kZXgpKSB7XG4gICAgLy8gYWxsIHN0eWxpbmcgaW5zdHJ1Y3Rpb25zIHByZXNlbnQgd2l0aGluIGFueSBob3N0QmluZGluZ3MgZnVuY3Rpb25zXG4gICAgLy8gZG8gbm90IHVwZGF0ZSB0aGUgY29udGV4dCBpbW1lZGlhdGVseSB3aGVuIGNhbGxlZC4gVGhleSBhcmUgaW5zdGVhZFxuICAgIC8vIHF1ZXVlZCB1cCBhbmQgYXBwbGllZCB0byB0aGUgY29udGV4dCByaWdodCBhdCB0aGlzIHBvaW50LiBXaHk/IFRoaXNcbiAgICAvLyBpcyBiZWNhdXNlIEFuZ3VsYXIgZXZhbHVhdGVzIGNvbXBvbmVudC9kaXJlY3RpdmUgYW5kIGRpcmVjdGl2ZVxuICAgIC8vIHN1Yi1jbGFzcyBjb2RlIGF0IGRpZmZlcmVudCBwb2ludHMgYW5kIGl0J3MgaW1wb3J0YW50IHRoYXQgdGhlXG4gICAgLy8gc3R5bGluZyB2YWx1ZXMgYXJlIGFwcGxpZWQgdG8gdGhlIGNvbnRleHQgaW4gdGhlIHJpZ2h0IG9yZGVyXG4gICAgLy8gKHNlZSBgaW50ZXJmYWNlcy9zdHlsaW5nLnRzYCBmb3IgbW9yZSBpbmZvcm1hdGlvbikuXG4gICAgZmx1c2hIb3N0SW5zdHJ1Y3Rpb25zUXVldWUoY29udGV4dCk7XG5cbiAgICBpZiAoaXNDb250ZXh0RGlydHkoY29udGV4dCkpIHtcbiAgICAgIC8vIHRoaXMgaXMgaGVyZSB0byBwcmV2ZW50IHRoaW5ncyBsaWtlIDxuZy1jb250YWluZXIgW3N0eWxlXSBbY2xhc3NdPi4uLjwvbmctY29udGFpbmVyPlxuICAgICAgLy8gb3IgaWYgdGhlcmUgYXJlIGFueSBob3N0IHN0eWxlIG9yIGNsYXNzIGJpbmRpbmdzIHByZXNlbnQgaW4gYSBkaXJlY3RpdmUgc2V0IG9uXG4gICAgICAvLyBhIGNvbnRhaW5lciBub2RlXG4gICAgICBjb25zdCBuYXRpdmUgPSBjb250ZXh0W1N0eWxpbmdJbmRleC5FbGVtZW50UG9zaXRpb25dICFhcyBIVE1MRWxlbWVudDtcblxuICAgICAgY29uc3QgZmx1c2hQbGF5ZXJCdWlsZGVyczogYW55ID1cbiAgICAgICAgICBjb250ZXh0W1N0eWxpbmdJbmRleC5NYXN0ZXJGbGFnUG9zaXRpb25dICYgU3R5bGluZ0ZsYWdzLlBsYXllckJ1aWxkZXJzRGlydHk7XG4gICAgICBjb25zdCBtdWx0aVN0YXJ0SW5kZXggPSBnZXRNdWx0aVN0eWxlc1N0YXJ0SW5kZXgoY29udGV4dCk7XG5cbiAgICAgIGZvciAobGV0IGkgPSBTdHlsaW5nSW5kZXguU2luZ2xlU3R5bGVzU3RhcnRQb3NpdGlvbjsgaSA8IGNvbnRleHQubGVuZ3RoO1xuICAgICAgICAgICBpICs9IFN0eWxpbmdJbmRleC5TaXplKSB7XG4gICAgICAgIC8vIHRoZXJlIGlzIG5vIHBvaW50IGluIHJlbmRlcmluZyBzdHlsZXMgdGhhdCBoYXZlIG5vdCBjaGFuZ2VkIG9uIHNjcmVlblxuICAgICAgICBpZiAoaXNEaXJ0eShjb250ZXh0LCBpKSkge1xuICAgICAgICAgIGNvbnN0IGZsYWcgPSBnZXRQb2ludGVycyhjb250ZXh0LCBpKTtcbiAgICAgICAgICBjb25zdCBkaXJlY3RpdmVJbmRleCA9IGdldERpcmVjdGl2ZUluZGV4RnJvbUVudHJ5KGNvbnRleHQsIGkpO1xuICAgICAgICAgIGNvbnN0IHByb3AgPSBnZXRQcm9wKGNvbnRleHQsIGkpO1xuICAgICAgICAgIGNvbnN0IHZhbHVlID0gZ2V0VmFsdWUoY29udGV4dCwgaSk7XG4gICAgICAgICAgY29uc3Qgc3R5bGVTYW5pdGl6ZXIgPVxuICAgICAgICAgICAgICAoZmxhZyAmIFN0eWxpbmdGbGFncy5TYW5pdGl6ZSkgPyBnZXRTdHlsZVNhbml0aXplcihjb250ZXh0LCBkaXJlY3RpdmVJbmRleCkgOiBudWxsO1xuICAgICAgICAgIGNvbnN0IHBsYXllckJ1aWxkZXIgPSBnZXRQbGF5ZXJCdWlsZGVyKGNvbnRleHQsIGkpO1xuICAgICAgICAgIGNvbnN0IGlzQ2xhc3NCYXNlZCA9IGZsYWcgJiBTdHlsaW5nRmxhZ3MuQ2xhc3MgPyB0cnVlIDogZmFsc2U7XG4gICAgICAgICAgY29uc3QgaXNJblNpbmdsZVJlZ2lvbiA9IGkgPCBtdWx0aVN0YXJ0SW5kZXg7XG5cbiAgICAgICAgICBsZXQgdmFsdWVUb0FwcGx5OiBzdHJpbmd8Ym9vbGVhbnxudWxsID0gdmFsdWU7XG5cbiAgICAgICAgICAvLyBWQUxVRSBERUZFUiBDQVNFIDE6IFVzZSBhIG11bHRpIHZhbHVlIGluc3RlYWQgb2YgYSBudWxsIHNpbmdsZSB2YWx1ZVxuICAgICAgICAgIC8vIHRoaXMgY2hlY2sgaW1wbGllcyB0aGF0IGEgc2luZ2xlIHZhbHVlIHdhcyByZW1vdmVkIGFuZCB3ZVxuICAgICAgICAgIC8vIHNob3VsZCBub3cgZGVmZXIgdG8gYSBtdWx0aSB2YWx1ZSBhbmQgdXNlIHRoYXQgKGlmIHNldCkuXG4gICAgICAgICAgaWYgKGlzSW5TaW5nbGVSZWdpb24gJiYgIXZhbHVlRXhpc3RzKHZhbHVlVG9BcHBseSwgaXNDbGFzc0Jhc2VkKSkge1xuICAgICAgICAgICAgLy8gc2luZ2xlIHZhbHVlcyBBTFdBWVMgaGF2ZSBhIHJlZmVyZW5jZSB0byBhIG11bHRpIGluZGV4XG4gICAgICAgICAgICBjb25zdCBtdWx0aUluZGV4ID0gZ2V0TXVsdGlPclNpbmdsZUluZGV4KGZsYWcpO1xuICAgICAgICAgICAgdmFsdWVUb0FwcGx5ID0gZ2V0VmFsdWUoY29udGV4dCwgbXVsdGlJbmRleCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gVkFMVUUgREVGRVIgQ0FTRSAyOiBVc2UgdGhlIGluaXRpYWwgdmFsdWUgaWYgYWxsIGVsc2UgZmFpbHMgKGlzIGZhbHN5KVxuICAgICAgICAgIC8vIHRoZSBpbml0aWFsIHZhbHVlIHdpbGwgYWx3YXlzIGJlIGEgc3RyaW5nIG9yIG51bGwsXG4gICAgICAgICAgLy8gdGhlcmVmb3JlIHdlIGNhbiBzYWZlbHkgYWRvcHQgaXQgaW4gY2FzZSB0aGVyZSdzIG5vdGhpbmcgZWxzZVxuICAgICAgICAgIC8vIG5vdGUgdGhhdCB0aGlzIHNob3VsZCBhbHdheXMgYmUgYSBmYWxzeSBjaGVjayBzaW5jZSBgZmFsc2VgIGlzIHVzZWRcbiAgICAgICAgICAvLyBmb3IgYm90aCBjbGFzcyBhbmQgc3R5bGUgY29tcGFyaXNvbnMgKHN0eWxlcyBjYW4ndCBiZSBmYWxzZSBhbmQgZmFsc2VcbiAgICAgICAgICAvLyBjbGFzc2VzIGFyZSB0dXJuZWQgb2ZmIGFuZCBzaG91bGQgdGhlcmVmb3JlIGRlZmVyIHRvIHRoZWlyIGluaXRpYWwgdmFsdWVzKVxuICAgICAgICAgIC8vIE5vdGUgdGhhdCB3ZSBpZ25vcmUgY2xhc3MtYmFzZWQgZGVmZXJhbHMgYmVjYXVzZSBvdGhlcndpc2UgYSBjbGFzcyBjYW4gbmV2ZXJcbiAgICAgICAgICAvLyBiZSByZW1vdmVkIGluIHRoZSBjYXNlIHRoYXQgaXQgZXhpc3RzIGFzIHRydWUgaW4gdGhlIGluaXRpYWwgY2xhc3NlcyBsaXN0Li4uXG4gICAgICAgICAgaWYgKCF2YWx1ZUV4aXN0cyh2YWx1ZVRvQXBwbHksIGlzQ2xhc3NCYXNlZCkpIHtcbiAgICAgICAgICAgIHZhbHVlVG9BcHBseSA9IGdldEluaXRpYWxWYWx1ZShjb250ZXh0LCBmbGFnKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBpZiB0aGUgZmlyc3QgcmVuZGVyIGlzIHRydWUgdGhlbiB3ZSBkbyBub3Qgd2FudCB0byBzdGFydCBhcHBseWluZyBmYWxzeVxuICAgICAgICAgIC8vIHZhbHVlcyB0byB0aGUgRE9NIGVsZW1lbnQncyBzdHlsaW5nLiBPdGhlcndpc2UgdGhlbiB3ZSBrbm93IHRoZXJlIGhhc1xuICAgICAgICAgIC8vIGJlZW4gYSBjaGFuZ2UgYW5kIGV2ZW4gaWYgaXQncyBmYWxzeSB0aGVuIGl0J3MgcmVtb3Zpbmcgc29tZXRoaW5nIHRoYXRcbiAgICAgICAgICAvLyB3YXMgdHJ1dGh5IGJlZm9yZS5cbiAgICAgICAgICBjb25zdCBkb0FwcGx5VmFsdWUgPSByZW5kZXJlciAmJiAoaXNGaXJzdFJlbmRlciA/IHZhbHVlVG9BcHBseSA6IHRydWUpO1xuICAgICAgICAgIGlmIChkb0FwcGx5VmFsdWUpIHtcbiAgICAgICAgICAgIGlmIChpc0NsYXNzQmFzZWQpIHtcbiAgICAgICAgICAgICAgc2V0Q2xhc3MoXG4gICAgICAgICAgICAgICAgICBuYXRpdmUsIHByb3AsIHZhbHVlVG9BcHBseSA/IHRydWUgOiBmYWxzZSwgcmVuZGVyZXIgISwgY2xhc3Nlc1N0b3JlLFxuICAgICAgICAgICAgICAgICAgcGxheWVyQnVpbGRlcik7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBzZXRTdHlsZShcbiAgICAgICAgICAgICAgICAgIG5hdGl2ZSwgcHJvcCwgdmFsdWVUb0FwcGx5IGFzIHN0cmluZyB8IG51bGwsIHJlbmRlcmVyICEsIHN0eWxlU2FuaXRpemVyLFxuICAgICAgICAgICAgICAgICAgc3R5bGVzU3RvcmUsIHBsYXllckJ1aWxkZXIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIHNldERpcnR5KGNvbnRleHQsIGksIGZhbHNlKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoZmx1c2hQbGF5ZXJCdWlsZGVycykge1xuICAgICAgICBjb25zdCByb290Q29udGV4dCA9XG4gICAgICAgICAgICBBcnJheS5pc0FycmF5KHJvb3RPclZpZXcpID8gZ2V0Um9vdENvbnRleHQocm9vdE9yVmlldykgOiByb290T3JWaWV3IGFzIFJvb3RDb250ZXh0O1xuICAgICAgICBjb25zdCBwbGF5ZXJDb250ZXh0ID0gZ2V0UGxheWVyQ29udGV4dChjb250ZXh0KSAhO1xuICAgICAgICBjb25zdCBwbGF5ZXJzU3RhcnRJbmRleCA9IHBsYXllckNvbnRleHRbUGxheWVySW5kZXguTm9uQnVpbGRlclBsYXllcnNTdGFydF07XG4gICAgICAgIGZvciAobGV0IGkgPSBQbGF5ZXJJbmRleC5QbGF5ZXJCdWlsZGVyc1N0YXJ0UG9zaXRpb247IGkgPCBwbGF5ZXJzU3RhcnRJbmRleDtcbiAgICAgICAgICAgICBpICs9IFBsYXllckluZGV4LlBsYXllckFuZFBsYXllckJ1aWxkZXJzVHVwbGVTaXplKSB7XG4gICAgICAgICAgY29uc3QgYnVpbGRlciA9IHBsYXllckNvbnRleHRbaV0gYXMgQ2xhc3NBbmRTdHlsZVBsYXllckJ1aWxkZXI8YW55PnwgbnVsbDtcbiAgICAgICAgICBjb25zdCBwbGF5ZXJJbnNlcnRpb25JbmRleCA9IGkgKyBQbGF5ZXJJbmRleC5QbGF5ZXJPZmZzZXRQb3NpdGlvbjtcbiAgICAgICAgICBjb25zdCBvbGRQbGF5ZXIgPSBwbGF5ZXJDb250ZXh0W3BsYXllckluc2VydGlvbkluZGV4XSBhcyBQbGF5ZXIgfCBudWxsO1xuICAgICAgICAgIGlmIChidWlsZGVyKSB7XG4gICAgICAgICAgICBjb25zdCBwbGF5ZXIgPSBidWlsZGVyLmJ1aWxkUGxheWVyKG9sZFBsYXllciwgaXNGaXJzdFJlbmRlcik7XG4gICAgICAgICAgICBpZiAocGxheWVyICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgaWYgKHBsYXllciAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgd2FzUXVldWVkID0gYWRkUGxheWVySW50ZXJuYWwoXG4gICAgICAgICAgICAgICAgICAgIHBsYXllckNvbnRleHQsIHJvb3RDb250ZXh0LCBuYXRpdmUgYXMgSFRNTEVsZW1lbnQsIHBsYXllcixcbiAgICAgICAgICAgICAgICAgICAgcGxheWVySW5zZXJ0aW9uSW5kZXgpO1xuICAgICAgICAgICAgICAgIHdhc1F1ZXVlZCAmJiB0b3RhbFBsYXllcnNRdWV1ZWQrKztcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBpZiAob2xkUGxheWVyKSB7XG4gICAgICAgICAgICAgICAgb2xkUGxheWVyLmRlc3Ryb3koKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSBpZiAob2xkUGxheWVyKSB7XG4gICAgICAgICAgICAvLyB0aGUgcGxheWVyIGJ1aWxkZXIgaGFzIGJlZW4gcmVtb3ZlZCAuLi4gdGhlcmVmb3JlIHdlIHNob3VsZCBkZWxldGUgdGhlIGFzc29jaWF0ZWRcbiAgICAgICAgICAgIC8vIHBsYXllclxuICAgICAgICAgICAgb2xkUGxheWVyLmRlc3Ryb3koKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgc2V0Q29udGV4dFBsYXllcnNEaXJ0eShjb250ZXh0LCBmYWxzZSk7XG4gICAgICB9XG5cbiAgICAgIHNldENvbnRleHREaXJ0eShjb250ZXh0LCBmYWxzZSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRvdGFsUGxheWVyc1F1ZXVlZDtcbn1cblxuLyoqXG4gKiBBc3NpZ25zIGEgc3R5bGUgdmFsdWUgdG8gYSBzdHlsZSBwcm9wZXJ0eSBmb3IgdGhlIGdpdmVuIGVsZW1lbnQuXG4gKlxuICogVGhpcyBmdW5jdGlvbiByZW5kZXJzIGEgZ2l2ZW4gQ1NTIHByb3AvdmFsdWUgZW50cnkgdXNpbmcgdGhlXG4gKiBwcm92aWRlZCByZW5kZXJlci4gSWYgYSBgc3RvcmVgIHZhbHVlIGlzIHByb3ZpZGVkIHRoZW5cbiAqIHRoYXQgd2lsbCBiZSB1c2VkIGEgcmVuZGVyIGNvbnRleHQgaW5zdGVhZCBvZiB0aGUgcHJvdmlkZWRcbiAqIHJlbmRlcmVyLlxuICpcbiAqIEBwYXJhbSBuYXRpdmUgdGhlIERPTSBFbGVtZW50XG4gKiBAcGFyYW0gcHJvcCB0aGUgQ1NTIHN0eWxlIHByb3BlcnR5IHRoYXQgd2lsbCBiZSByZW5kZXJlZFxuICogQHBhcmFtIHZhbHVlIHRoZSBDU1Mgc3R5bGUgdmFsdWUgdGhhdCB3aWxsIGJlIHJlbmRlcmVkXG4gKiBAcGFyYW0gcmVuZGVyZXJcbiAqIEBwYXJhbSBzdG9yZSBhbiBvcHRpb25hbCBrZXkvdmFsdWUgbWFwIHRoYXQgd2lsbCBiZSB1c2VkIGFzIGEgY29udGV4dCB0byByZW5kZXIgc3R5bGVzIG9uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzZXRTdHlsZShcbiAgICBuYXRpdmU6IGFueSwgcHJvcDogc3RyaW5nLCB2YWx1ZTogc3RyaW5nIHwgbnVsbCwgcmVuZGVyZXI6IFJlbmRlcmVyMyxcbiAgICBzYW5pdGl6ZXI6IFN0eWxlU2FuaXRpemVGbiB8IG51bGwsIHN0b3JlPzogQmluZGluZ1N0b3JlIHwgbnVsbCxcbiAgICBwbGF5ZXJCdWlsZGVyPzogQ2xhc3NBbmRTdHlsZVBsYXllckJ1aWxkZXI8YW55PnwgbnVsbCkge1xuICB2YWx1ZSA9XG4gICAgICBzYW5pdGl6ZXIgJiYgdmFsdWUgPyBzYW5pdGl6ZXIocHJvcCwgdmFsdWUsIFN0eWxlU2FuaXRpemVNb2RlLlZhbGlkYXRlQW5kU2FuaXRpemUpIDogdmFsdWU7XG4gIGlmIChzdG9yZSB8fCBwbGF5ZXJCdWlsZGVyKSB7XG4gICAgaWYgKHN0b3JlKSB7XG4gICAgICBzdG9yZS5zZXRWYWx1ZShwcm9wLCB2YWx1ZSk7XG4gICAgfVxuICAgIGlmIChwbGF5ZXJCdWlsZGVyKSB7XG4gICAgICBwbGF5ZXJCdWlsZGVyLnNldFZhbHVlKHByb3AsIHZhbHVlKTtcbiAgICB9XG4gIH0gZWxzZSBpZiAodmFsdWUpIHtcbiAgICB2YWx1ZSA9IHZhbHVlLnRvU3RyaW5nKCk7ICAvLyBvcGFjaXR5LCB6LWluZGV4IGFuZCBmbGV4Ym94IGFsbCBoYXZlIG51bWJlciB2YWx1ZXMgd2hpY2ggbWF5IG5vdFxuICAgIC8vIGFzc2lnbiBhcyBudW1iZXJzXG4gICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlclNldFN0eWxlKys7XG4gICAgaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpID9cbiAgICAgICAgcmVuZGVyZXIuc2V0U3R5bGUobmF0aXZlLCBwcm9wLCB2YWx1ZSwgUmVuZGVyZXJTdHlsZUZsYWdzMy5EYXNoQ2FzZSkgOlxuICAgICAgICBuYXRpdmUuc3R5bGUuc2V0UHJvcGVydHkocHJvcCwgdmFsdWUpO1xuICB9IGVsc2Uge1xuICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJSZW1vdmVTdHlsZSsrO1xuICAgIGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSA/XG4gICAgICAgIHJlbmRlcmVyLnJlbW92ZVN0eWxlKG5hdGl2ZSwgcHJvcCwgUmVuZGVyZXJTdHlsZUZsYWdzMy5EYXNoQ2FzZSkgOlxuICAgICAgICBuYXRpdmUuc3R5bGUucmVtb3ZlUHJvcGVydHkocHJvcCk7XG4gIH1cbn1cblxuLyoqXG4gKiBBZGRzL3JlbW92ZXMgdGhlIHByb3ZpZGVkIGNsYXNzTmFtZSB2YWx1ZSB0byB0aGUgcHJvdmlkZWQgZWxlbWVudC5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIHJlbmRlcnMgYSBnaXZlbiBDU1MgY2xhc3MgdmFsdWUgdXNpbmcgdGhlIHByb3ZpZGVkXG4gKiByZW5kZXJlciAoYnkgYWRkaW5nIG9yIHJlbW92aW5nIGl0IGZyb20gdGhlIHByb3ZpZGVkIGVsZW1lbnQpLlxuICogSWYgYSBgc3RvcmVgIHZhbHVlIGlzIHByb3ZpZGVkIHRoZW4gdGhhdCB3aWxsIGJlIHVzZWQgYSByZW5kZXJcbiAqIGNvbnRleHQgaW5zdGVhZCBvZiB0aGUgcHJvdmlkZWQgcmVuZGVyZXIuXG4gKlxuICogQHBhcmFtIG5hdGl2ZSB0aGUgRE9NIEVsZW1lbnRcbiAqIEBwYXJhbSBwcm9wIHRoZSBDU1Mgc3R5bGUgcHJvcGVydHkgdGhhdCB3aWxsIGJlIHJlbmRlcmVkXG4gKiBAcGFyYW0gdmFsdWUgdGhlIENTUyBzdHlsZSB2YWx1ZSB0aGF0IHdpbGwgYmUgcmVuZGVyZWRcbiAqIEBwYXJhbSByZW5kZXJlclxuICogQHBhcmFtIHN0b3JlIGFuIG9wdGlvbmFsIGtleS92YWx1ZSBtYXAgdGhhdCB3aWxsIGJlIHVzZWQgYXMgYSBjb250ZXh0IHRvIHJlbmRlciBzdHlsZXMgb25cbiAqL1xuZnVuY3Rpb24gc2V0Q2xhc3MoXG4gICAgbmF0aXZlOiBhbnksIGNsYXNzTmFtZTogc3RyaW5nLCBhZGQ6IGJvb2xlYW4sIHJlbmRlcmVyOiBSZW5kZXJlcjMsIHN0b3JlPzogQmluZGluZ1N0b3JlIHwgbnVsbCxcbiAgICBwbGF5ZXJCdWlsZGVyPzogQ2xhc3NBbmRTdHlsZVBsYXllckJ1aWxkZXI8YW55PnwgbnVsbCkge1xuICBpZiAoc3RvcmUgfHwgcGxheWVyQnVpbGRlcikge1xuICAgIGlmIChzdG9yZSkge1xuICAgICAgc3RvcmUuc2V0VmFsdWUoY2xhc3NOYW1lLCBhZGQpO1xuICAgIH1cbiAgICBpZiAocGxheWVyQnVpbGRlcikge1xuICAgICAgcGxheWVyQnVpbGRlci5zZXRWYWx1ZShjbGFzc05hbWUsIGFkZCk7XG4gICAgfVxuICAgIC8vIERPTVRva2VuTGlzdCB3aWxsIHRocm93IGlmIHdlIHRyeSB0byBhZGQgb3IgcmVtb3ZlIGFuIGVtcHR5IHN0cmluZy5cbiAgfSBlbHNlIGlmIChjbGFzc05hbWUgIT09ICcnKSB7XG4gICAgaWYgKGFkZCkge1xuICAgICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlckFkZENsYXNzKys7XG4gICAgICBpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikgPyByZW5kZXJlci5hZGRDbGFzcyhuYXRpdmUsIGNsYXNzTmFtZSkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmF0aXZlWydjbGFzc0xpc3QnXS5hZGQoY2xhc3NOYW1lKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlclJlbW92ZUNsYXNzKys7XG4gICAgICBpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikgPyByZW5kZXJlci5yZW1vdmVDbGFzcyhuYXRpdmUsIGNsYXNzTmFtZSkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmF0aXZlWydjbGFzc0xpc3QnXS5yZW1vdmUoY2xhc3NOYW1lKTtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gc2V0U2FuaXRpemVGbGFnKGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBpbmRleDogbnVtYmVyLCBzYW5pdGl6ZVllczogYm9vbGVhbikge1xuICBpZiAoc2FuaXRpemVZZXMpIHtcbiAgICAoY29udGV4dFtpbmRleF0gYXMgbnVtYmVyKSB8PSBTdHlsaW5nRmxhZ3MuU2FuaXRpemU7XG4gIH0gZWxzZSB7XG4gICAgKGNvbnRleHRbaW5kZXhdIGFzIG51bWJlcikgJj0gflN0eWxpbmdGbGFncy5TYW5pdGl6ZTtcbiAgfVxufVxuXG5mdW5jdGlvbiBzZXREaXJ0eShjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgaW5kZXg6IG51bWJlciwgaXNEaXJ0eVllczogYm9vbGVhbikge1xuICBjb25zdCBhZGp1c3RlZEluZGV4ID1cbiAgICAgIGluZGV4ID49IFN0eWxpbmdJbmRleC5TaW5nbGVTdHlsZXNTdGFydFBvc2l0aW9uID8gKGluZGV4ICsgU3R5bGluZ0luZGV4LkZsYWdzT2Zmc2V0KSA6IGluZGV4O1xuICBpZiAoaXNEaXJ0eVllcykge1xuICAgIChjb250ZXh0W2FkanVzdGVkSW5kZXhdIGFzIG51bWJlcikgfD0gU3R5bGluZ0ZsYWdzLkRpcnR5O1xuICB9IGVsc2Uge1xuICAgIChjb250ZXh0W2FkanVzdGVkSW5kZXhdIGFzIG51bWJlcikgJj0gflN0eWxpbmdGbGFncy5EaXJ0eTtcbiAgfVxufVxuXG5mdW5jdGlvbiBpc0RpcnR5KGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBpbmRleDogbnVtYmVyKTogYm9vbGVhbiB7XG4gIGNvbnN0IGFkanVzdGVkSW5kZXggPVxuICAgICAgaW5kZXggPj0gU3R5bGluZ0luZGV4LlNpbmdsZVN0eWxlc1N0YXJ0UG9zaXRpb24gPyAoaW5kZXggKyBTdHlsaW5nSW5kZXguRmxhZ3NPZmZzZXQpIDogaW5kZXg7XG4gIHJldHVybiAoKGNvbnRleHRbYWRqdXN0ZWRJbmRleF0gYXMgbnVtYmVyKSAmIFN0eWxpbmdGbGFncy5EaXJ0eSkgPT0gU3R5bGluZ0ZsYWdzLkRpcnR5O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNDbGFzc0Jhc2VkVmFsdWUoY29udGV4dDogU3R5bGluZ0NvbnRleHQsIGluZGV4OiBudW1iZXIpOiBib29sZWFuIHtcbiAgY29uc3QgYWRqdXN0ZWRJbmRleCA9XG4gICAgICBpbmRleCA+PSBTdHlsaW5nSW5kZXguU2luZ2xlU3R5bGVzU3RhcnRQb3NpdGlvbiA/IChpbmRleCArIFN0eWxpbmdJbmRleC5GbGFnc09mZnNldCkgOiBpbmRleDtcbiAgcmV0dXJuICgoY29udGV4dFthZGp1c3RlZEluZGV4XSBhcyBudW1iZXIpICYgU3R5bGluZ0ZsYWdzLkNsYXNzKSA9PSBTdHlsaW5nRmxhZ3MuQ2xhc3M7XG59XG5cbmZ1bmN0aW9uIGlzU2FuaXRpemFibGUoY29udGV4dDogU3R5bGluZ0NvbnRleHQsIGluZGV4OiBudW1iZXIpOiBib29sZWFuIHtcbiAgY29uc3QgYWRqdXN0ZWRJbmRleCA9XG4gICAgICBpbmRleCA+PSBTdHlsaW5nSW5kZXguU2luZ2xlU3R5bGVzU3RhcnRQb3NpdGlvbiA/IChpbmRleCArIFN0eWxpbmdJbmRleC5GbGFnc09mZnNldCkgOiBpbmRleDtcbiAgcmV0dXJuICgoY29udGV4dFthZGp1c3RlZEluZGV4XSBhcyBudW1iZXIpICYgU3R5bGluZ0ZsYWdzLlNhbml0aXplKSA9PSBTdHlsaW5nRmxhZ3MuU2FuaXRpemU7XG59XG5cbmZ1bmN0aW9uIHBvaW50ZXJzKGNvbmZpZ0ZsYWc6IG51bWJlciwgc3RhdGljSW5kZXg6IG51bWJlciwgZHluYW1pY0luZGV4OiBudW1iZXIpIHtcbiAgcmV0dXJuIChjb25maWdGbGFnICYgU3R5bGluZ0ZsYWdzLkJpdE1hc2spIHwgKHN0YXRpY0luZGV4IDw8IFN0eWxpbmdGbGFncy5CaXRDb3VudFNpemUpIHxcbiAgICAgIChkeW5hbWljSW5kZXggPDwgKFN0eWxpbmdJbmRleC5CaXRDb3VudFNpemUgKyBTdHlsaW5nRmxhZ3MuQml0Q291bnRTaXplKSk7XG59XG5cbmZ1bmN0aW9uIGdldEluaXRpYWxWYWx1ZShjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgZmxhZzogbnVtYmVyKTogc3RyaW5nfGJvb2xlYW58bnVsbCB7XG4gIGNvbnN0IGluZGV4ID0gZ2V0SW5pdGlhbEluZGV4KGZsYWcpO1xuICBjb25zdCBlbnRyeUlzQ2xhc3NCYXNlZCA9IGZsYWcgJiBTdHlsaW5nRmxhZ3MuQ2xhc3M7XG4gIGNvbnN0IGluaXRpYWxWYWx1ZXMgPSBlbnRyeUlzQ2xhc3NCYXNlZCA/IGNvbnRleHRbU3R5bGluZ0luZGV4LkluaXRpYWxDbGFzc1ZhbHVlc1Bvc2l0aW9uXSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRleHRbU3R5bGluZ0luZGV4LkluaXRpYWxTdHlsZVZhbHVlc1Bvc2l0aW9uXTtcbiAgcmV0dXJuIGluaXRpYWxWYWx1ZXNbaW5kZXhdIGFzIHN0cmluZyB8IGJvb2xlYW4gfCBudWxsO1xufVxuXG5mdW5jdGlvbiBnZXRJbml0aWFsSW5kZXgoZmxhZzogbnVtYmVyKTogbnVtYmVyIHtcbiAgcmV0dXJuIChmbGFnID4+IFN0eWxpbmdGbGFncy5CaXRDb3VudFNpemUpICYgU3R5bGluZ0luZGV4LkJpdE1hc2s7XG59XG5cbmZ1bmN0aW9uIGdldE11bHRpT3JTaW5nbGVJbmRleChmbGFnOiBudW1iZXIpOiBudW1iZXIge1xuICBjb25zdCBpbmRleCA9XG4gICAgICAoZmxhZyA+PiAoU3R5bGluZ0luZGV4LkJpdENvdW50U2l6ZSArIFN0eWxpbmdGbGFncy5CaXRDb3VudFNpemUpKSAmIFN0eWxpbmdJbmRleC5CaXRNYXNrO1xuICByZXR1cm4gaW5kZXggPj0gU3R5bGluZ0luZGV4LlNpbmdsZVN0eWxlc1N0YXJ0UG9zaXRpb24gPyBpbmRleCA6IC0xO1xufVxuXG5mdW5jdGlvbiBnZXRNdWx0aVN0YXJ0SW5kZXgoY29udGV4dDogU3R5bGluZ0NvbnRleHQpOiBudW1iZXIge1xuICByZXR1cm4gZ2V0TXVsdGlPclNpbmdsZUluZGV4KGNvbnRleHRbU3R5bGluZ0luZGV4Lk1hc3RlckZsYWdQb3NpdGlvbl0pIGFzIG51bWJlcjtcbn1cblxuZnVuY3Rpb24gZ2V0TXVsdGlDbGFzc2VzU3RhcnRJbmRleChjb250ZXh0OiBTdHlsaW5nQ29udGV4dCk6IG51bWJlciB7XG4gIGNvbnN0IGNsYXNzQ2FjaGUgPSBjb250ZXh0W1N0eWxpbmdJbmRleC5DYWNoZWRNdWx0aUNsYXNzZXNdO1xuICByZXR1cm4gY2xhc3NDYWNoZVxuICAgICAgW01hcEJhc2VkT2Zmc2V0VmFsdWVzSW5kZXguVmFsdWVzU3RhcnRQb3NpdGlvbiArXG4gICAgICAgTWFwQmFzZWRPZmZzZXRWYWx1ZXNJbmRleC5Qb3NpdGlvblN0YXJ0T2Zmc2V0XTtcbn1cblxuZnVuY3Rpb24gZ2V0TXVsdGlTdHlsZXNTdGFydEluZGV4KGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0KTogbnVtYmVyIHtcbiAgY29uc3Qgc3R5bGVzQ2FjaGUgPSBjb250ZXh0W1N0eWxpbmdJbmRleC5DYWNoZWRNdWx0aVN0eWxlc107XG4gIHJldHVybiBzdHlsZXNDYWNoZVxuICAgICAgW01hcEJhc2VkT2Zmc2V0VmFsdWVzSW5kZXguVmFsdWVzU3RhcnRQb3NpdGlvbiArXG4gICAgICAgTWFwQmFzZWRPZmZzZXRWYWx1ZXNJbmRleC5Qb3NpdGlvblN0YXJ0T2Zmc2V0XTtcbn1cblxuZnVuY3Rpb24gc2V0UHJvcChjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgaW5kZXg6IG51bWJlciwgcHJvcDogc3RyaW5nKSB7XG4gIGNvbnRleHRbaW5kZXggKyBTdHlsaW5nSW5kZXguUHJvcGVydHlPZmZzZXRdID0gcHJvcDtcbn1cblxuZnVuY3Rpb24gc2V0VmFsdWUoY29udGV4dDogU3R5bGluZ0NvbnRleHQsIGluZGV4OiBudW1iZXIsIHZhbHVlOiBzdHJpbmcgfCBudWxsIHwgYm9vbGVhbikge1xuICBjb250ZXh0W2luZGV4ICsgU3R5bGluZ0luZGV4LlZhbHVlT2Zmc2V0XSA9IHZhbHVlO1xufVxuXG5mdW5jdGlvbiBoYXNQbGF5ZXJCdWlsZGVyQ2hhbmdlZChcbiAgICBjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgYnVpbGRlcjogQ2xhc3NBbmRTdHlsZVBsYXllckJ1aWxkZXI8YW55PnwgbnVsbCwgaW5kZXg6IG51bWJlcikge1xuICBjb25zdCBwbGF5ZXJDb250ZXh0ID0gY29udGV4dFtTdHlsaW5nSW5kZXguUGxheWVyQ29udGV4dF0gITtcbiAgaWYgKGJ1aWxkZXIpIHtcbiAgICBpZiAoIXBsYXllckNvbnRleHQgfHwgaW5kZXggPT09IDApIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfSBlbHNlIGlmICghcGxheWVyQ29udGV4dCkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICByZXR1cm4gcGxheWVyQ29udGV4dFtpbmRleF0gIT09IGJ1aWxkZXI7XG59XG5cbmZ1bmN0aW9uIHNldFBsYXllckJ1aWxkZXIoXG4gICAgY29udGV4dDogU3R5bGluZ0NvbnRleHQsIGJ1aWxkZXI6IENsYXNzQW5kU3R5bGVQbGF5ZXJCdWlsZGVyPGFueT58IG51bGwsXG4gICAgaW5zZXJ0aW9uSW5kZXg6IG51bWJlcik6IG51bWJlciB7XG4gIGxldCBwbGF5ZXJDb250ZXh0ID0gY29udGV4dFtTdHlsaW5nSW5kZXguUGxheWVyQ29udGV4dF0gfHwgYWxsb2NQbGF5ZXJDb250ZXh0KGNvbnRleHQpO1xuICBpZiAoaW5zZXJ0aW9uSW5kZXggPiAwKSB7XG4gICAgcGxheWVyQ29udGV4dFtpbnNlcnRpb25JbmRleF0gPSBidWlsZGVyO1xuICB9IGVsc2Uge1xuICAgIGluc2VydGlvbkluZGV4ID0gcGxheWVyQ29udGV4dFtQbGF5ZXJJbmRleC5Ob25CdWlsZGVyUGxheWVyc1N0YXJ0XTtcbiAgICBwbGF5ZXJDb250ZXh0LnNwbGljZShpbnNlcnRpb25JbmRleCwgMCwgYnVpbGRlciwgbnVsbCk7XG4gICAgcGxheWVyQ29udGV4dFtQbGF5ZXJJbmRleC5Ob25CdWlsZGVyUGxheWVyc1N0YXJ0XSArPVxuICAgICAgICBQbGF5ZXJJbmRleC5QbGF5ZXJBbmRQbGF5ZXJCdWlsZGVyc1R1cGxlU2l6ZTtcbiAgfVxuICByZXR1cm4gaW5zZXJ0aW9uSW5kZXg7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBkaXJlY3RpdmVPd25lclBvaW50ZXJzKGRpcmVjdGl2ZUluZGV4OiBudW1iZXIsIHBsYXllckluZGV4OiBudW1iZXIpIHtcbiAgcmV0dXJuIChwbGF5ZXJJbmRleCA8PCBEaXJlY3RpdmVPd25lckFuZFBsYXllckJ1aWxkZXJJbmRleC5CaXRDb3VudFNpemUpIHwgZGlyZWN0aXZlSW5kZXg7XG59XG5cbmZ1bmN0aW9uIHNldFBsYXllckJ1aWxkZXJJbmRleChcbiAgICBjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgaW5kZXg6IG51bWJlciwgcGxheWVyQnVpbGRlckluZGV4OiBudW1iZXIsIGRpcmVjdGl2ZUluZGV4OiBudW1iZXIpIHtcbiAgY29uc3QgdmFsdWUgPSBkaXJlY3RpdmVPd25lclBvaW50ZXJzKGRpcmVjdGl2ZUluZGV4LCBwbGF5ZXJCdWlsZGVySW5kZXgpO1xuICBjb250ZXh0W2luZGV4ICsgU3R5bGluZ0luZGV4LlBsYXllckJ1aWxkZXJJbmRleE9mZnNldF0gPSB2YWx1ZTtcbn1cblxuZnVuY3Rpb24gZ2V0UGxheWVyQnVpbGRlckluZGV4KGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBpbmRleDogbnVtYmVyKTogbnVtYmVyIHtcbiAgY29uc3QgZmxhZyA9IGNvbnRleHRbaW5kZXggKyBTdHlsaW5nSW5kZXguUGxheWVyQnVpbGRlckluZGV4T2Zmc2V0XSBhcyBudW1iZXI7XG4gIGNvbnN0IHBsYXllckJ1aWxkZXJJbmRleCA9IChmbGFnID4+IERpcmVjdGl2ZU93bmVyQW5kUGxheWVyQnVpbGRlckluZGV4LkJpdENvdW50U2l6ZSkgJlxuICAgICAgRGlyZWN0aXZlT3duZXJBbmRQbGF5ZXJCdWlsZGVySW5kZXguQml0TWFzaztcbiAgcmV0dXJuIHBsYXllckJ1aWxkZXJJbmRleDtcbn1cblxuZnVuY3Rpb24gZ2V0UGxheWVyQnVpbGRlcihjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgaW5kZXg6IG51bWJlcik6IENsYXNzQW5kU3R5bGVQbGF5ZXJCdWlsZGVyPGFueT58XG4gICAgbnVsbCB7XG4gIGNvbnN0IHBsYXllckJ1aWxkZXJJbmRleCA9IGdldFBsYXllckJ1aWxkZXJJbmRleChjb250ZXh0LCBpbmRleCk7XG4gIGlmIChwbGF5ZXJCdWlsZGVySW5kZXgpIHtcbiAgICBjb25zdCBwbGF5ZXJDb250ZXh0ID0gY29udGV4dFtTdHlsaW5nSW5kZXguUGxheWVyQ29udGV4dF07XG4gICAgaWYgKHBsYXllckNvbnRleHQpIHtcbiAgICAgIHJldHVybiBwbGF5ZXJDb250ZXh0W3BsYXllckJ1aWxkZXJJbmRleF0gYXMgQ2xhc3NBbmRTdHlsZVBsYXllckJ1aWxkZXI8YW55PnwgbnVsbDtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbmZ1bmN0aW9uIHNldEZsYWcoY29udGV4dDogU3R5bGluZ0NvbnRleHQsIGluZGV4OiBudW1iZXIsIGZsYWc6IG51bWJlcikge1xuICBjb25zdCBhZGp1c3RlZEluZGV4ID1cbiAgICAgIGluZGV4ID09PSBTdHlsaW5nSW5kZXguTWFzdGVyRmxhZ1Bvc2l0aW9uID8gaW5kZXggOiAoaW5kZXggKyBTdHlsaW5nSW5kZXguRmxhZ3NPZmZzZXQpO1xuICBjb250ZXh0W2FkanVzdGVkSW5kZXhdID0gZmxhZztcbn1cblxuZnVuY3Rpb24gZ2V0UG9pbnRlcnMoY29udGV4dDogU3R5bGluZ0NvbnRleHQsIGluZGV4OiBudW1iZXIpOiBudW1iZXIge1xuICBjb25zdCBhZGp1c3RlZEluZGV4ID1cbiAgICAgIGluZGV4ID09PSBTdHlsaW5nSW5kZXguTWFzdGVyRmxhZ1Bvc2l0aW9uID8gaW5kZXggOiAoaW5kZXggKyBTdHlsaW5nSW5kZXguRmxhZ3NPZmZzZXQpO1xuICByZXR1cm4gY29udGV4dFthZGp1c3RlZEluZGV4XSBhcyBudW1iZXI7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRWYWx1ZShjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgaW5kZXg6IG51bWJlcik6IHN0cmluZ3xib29sZWFufG51bGwge1xuICByZXR1cm4gY29udGV4dFtpbmRleCArIFN0eWxpbmdJbmRleC5WYWx1ZU9mZnNldF0gYXMgc3RyaW5nIHwgYm9vbGVhbiB8IG51bGw7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRQcm9wKGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBpbmRleDogbnVtYmVyKTogc3RyaW5nIHtcbiAgcmV0dXJuIGNvbnRleHRbaW5kZXggKyBTdHlsaW5nSW5kZXguUHJvcGVydHlPZmZzZXRdIGFzIHN0cmluZztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzQ29udGV4dERpcnR5KGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0KTogYm9vbGVhbiB7XG4gIHJldHVybiBpc0RpcnR5KGNvbnRleHQsIFN0eWxpbmdJbmRleC5NYXN0ZXJGbGFnUG9zaXRpb24pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2V0Q29udGV4dERpcnR5KGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBpc0RpcnR5WWVzOiBib29sZWFuKTogdm9pZCB7XG4gIHNldERpcnR5KGNvbnRleHQsIFN0eWxpbmdJbmRleC5NYXN0ZXJGbGFnUG9zaXRpb24sIGlzRGlydHlZZXMpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2V0Q29udGV4dFBsYXllcnNEaXJ0eShjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgaXNEaXJ0eVllczogYm9vbGVhbik6IHZvaWQge1xuICBpZiAoaXNEaXJ0eVllcykge1xuICAgIChjb250ZXh0W1N0eWxpbmdJbmRleC5NYXN0ZXJGbGFnUG9zaXRpb25dIGFzIG51bWJlcikgfD0gU3R5bGluZ0ZsYWdzLlBsYXllckJ1aWxkZXJzRGlydHk7XG4gIH0gZWxzZSB7XG4gICAgKGNvbnRleHRbU3R5bGluZ0luZGV4Lk1hc3RlckZsYWdQb3NpdGlvbl0gYXMgbnVtYmVyKSAmPSB+U3R5bGluZ0ZsYWdzLlBsYXllckJ1aWxkZXJzRGlydHk7XG4gIH1cbn1cblxuZnVuY3Rpb24gc3dhcE11bHRpQ29udGV4dEVudHJpZXMoY29udGV4dDogU3R5bGluZ0NvbnRleHQsIGluZGV4QTogbnVtYmVyLCBpbmRleEI6IG51bWJlcikge1xuICBpZiAoaW5kZXhBID09PSBpbmRleEIpIHJldHVybjtcblxuICBjb25zdCB0bXBWYWx1ZSA9IGdldFZhbHVlKGNvbnRleHQsIGluZGV4QSk7XG4gIGNvbnN0IHRtcFByb3AgPSBnZXRQcm9wKGNvbnRleHQsIGluZGV4QSk7XG4gIGNvbnN0IHRtcEZsYWcgPSBnZXRQb2ludGVycyhjb250ZXh0LCBpbmRleEEpO1xuICBjb25zdCB0bXBQbGF5ZXJCdWlsZGVySW5kZXggPSBnZXRQbGF5ZXJCdWlsZGVySW5kZXgoY29udGV4dCwgaW5kZXhBKTtcbiAgY29uc3QgdG1wRGlyZWN0aXZlSW5kZXggPSBnZXREaXJlY3RpdmVJbmRleEZyb21FbnRyeShjb250ZXh0LCBpbmRleEEpO1xuXG4gIGxldCBmbGFnQSA9IHRtcEZsYWc7XG4gIGxldCBmbGFnQiA9IGdldFBvaW50ZXJzKGNvbnRleHQsIGluZGV4Qik7XG5cbiAgY29uc3Qgc2luZ2xlSW5kZXhBID0gZ2V0TXVsdGlPclNpbmdsZUluZGV4KGZsYWdBKTtcbiAgaWYgKHNpbmdsZUluZGV4QSA+PSAwKSB7XG4gICAgY29uc3QgX2ZsYWcgPSBnZXRQb2ludGVycyhjb250ZXh0LCBzaW5nbGVJbmRleEEpO1xuICAgIGNvbnN0IF9pbml0aWFsID0gZ2V0SW5pdGlhbEluZGV4KF9mbGFnKTtcbiAgICBzZXRGbGFnKGNvbnRleHQsIHNpbmdsZUluZGV4QSwgcG9pbnRlcnMoX2ZsYWcsIF9pbml0aWFsLCBpbmRleEIpKTtcbiAgfVxuXG4gIGNvbnN0IHNpbmdsZUluZGV4QiA9IGdldE11bHRpT3JTaW5nbGVJbmRleChmbGFnQik7XG4gIGlmIChzaW5nbGVJbmRleEIgPj0gMCkge1xuICAgIGNvbnN0IF9mbGFnID0gZ2V0UG9pbnRlcnMoY29udGV4dCwgc2luZ2xlSW5kZXhCKTtcbiAgICBjb25zdCBfaW5pdGlhbCA9IGdldEluaXRpYWxJbmRleChfZmxhZyk7XG4gICAgc2V0RmxhZyhjb250ZXh0LCBzaW5nbGVJbmRleEIsIHBvaW50ZXJzKF9mbGFnLCBfaW5pdGlhbCwgaW5kZXhBKSk7XG4gIH1cblxuICBzZXRWYWx1ZShjb250ZXh0LCBpbmRleEEsIGdldFZhbHVlKGNvbnRleHQsIGluZGV4QikpO1xuICBzZXRQcm9wKGNvbnRleHQsIGluZGV4QSwgZ2V0UHJvcChjb250ZXh0LCBpbmRleEIpKTtcbiAgc2V0RmxhZyhjb250ZXh0LCBpbmRleEEsIGdldFBvaW50ZXJzKGNvbnRleHQsIGluZGV4QikpO1xuICBjb25zdCBwbGF5ZXJJbmRleEEgPSBnZXRQbGF5ZXJCdWlsZGVySW5kZXgoY29udGV4dCwgaW5kZXhCKTtcbiAgY29uc3QgZGlyZWN0aXZlSW5kZXhBID0gZ2V0RGlyZWN0aXZlSW5kZXhGcm9tRW50cnkoY29udGV4dCwgaW5kZXhCKTtcbiAgc2V0UGxheWVyQnVpbGRlckluZGV4KGNvbnRleHQsIGluZGV4QSwgcGxheWVySW5kZXhBLCBkaXJlY3RpdmVJbmRleEEpO1xuXG4gIHNldFZhbHVlKGNvbnRleHQsIGluZGV4QiwgdG1wVmFsdWUpO1xuICBzZXRQcm9wKGNvbnRleHQsIGluZGV4QiwgdG1wUHJvcCk7XG4gIHNldEZsYWcoY29udGV4dCwgaW5kZXhCLCB0bXBGbGFnKTtcbiAgc2V0UGxheWVyQnVpbGRlckluZGV4KGNvbnRleHQsIGluZGV4QiwgdG1wUGxheWVyQnVpbGRlckluZGV4LCB0bXBEaXJlY3RpdmVJbmRleCk7XG59XG5cbmZ1bmN0aW9uIHVwZGF0ZVNpbmdsZVBvaW50ZXJWYWx1ZXMoY29udGV4dDogU3R5bGluZ0NvbnRleHQsIGluZGV4U3RhcnRQb3NpdGlvbjogbnVtYmVyKSB7XG4gIGZvciAobGV0IGkgPSBpbmRleFN0YXJ0UG9zaXRpb247IGkgPCBjb250ZXh0Lmxlbmd0aDsgaSArPSBTdHlsaW5nSW5kZXguU2l6ZSkge1xuICAgIGNvbnN0IG11bHRpRmxhZyA9IGdldFBvaW50ZXJzKGNvbnRleHQsIGkpO1xuICAgIGNvbnN0IHNpbmdsZUluZGV4ID0gZ2V0TXVsdGlPclNpbmdsZUluZGV4KG11bHRpRmxhZyk7XG4gICAgaWYgKHNpbmdsZUluZGV4ID4gMCkge1xuICAgICAgY29uc3Qgc2luZ2xlRmxhZyA9IGdldFBvaW50ZXJzKGNvbnRleHQsIHNpbmdsZUluZGV4KTtcbiAgICAgIGNvbnN0IGluaXRpYWxJbmRleEZvclNpbmdsZSA9IGdldEluaXRpYWxJbmRleChzaW5nbGVGbGFnKTtcbiAgICAgIGNvbnN0IGZsYWdWYWx1ZSA9IChpc0RpcnR5KGNvbnRleHQsIHNpbmdsZUluZGV4KSA/IFN0eWxpbmdGbGFncy5EaXJ0eSA6IFN0eWxpbmdGbGFncy5Ob25lKSB8XG4gICAgICAgICAgKGlzQ2xhc3NCYXNlZFZhbHVlKGNvbnRleHQsIHNpbmdsZUluZGV4KSA/IFN0eWxpbmdGbGFncy5DbGFzcyA6IFN0eWxpbmdGbGFncy5Ob25lKSB8XG4gICAgICAgICAgKGlzU2FuaXRpemFibGUoY29udGV4dCwgc2luZ2xlSW5kZXgpID8gU3R5bGluZ0ZsYWdzLlNhbml0aXplIDogU3R5bGluZ0ZsYWdzLk5vbmUpO1xuICAgICAgY29uc3QgdXBkYXRlZEZsYWcgPSBwb2ludGVycyhmbGFnVmFsdWUsIGluaXRpYWxJbmRleEZvclNpbmdsZSwgaSk7XG4gICAgICBzZXRGbGFnKGNvbnRleHQsIHNpbmdsZUluZGV4LCB1cGRhdGVkRmxhZyk7XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGluc2VydE5ld011bHRpUHJvcGVydHkoXG4gICAgY29udGV4dDogU3R5bGluZ0NvbnRleHQsIGluZGV4OiBudW1iZXIsIGNsYXNzQmFzZWQ6IGJvb2xlYW4sIG5hbWU6IHN0cmluZywgZmxhZzogbnVtYmVyLFxuICAgIHZhbHVlOiBzdHJpbmcgfCBib29sZWFuLCBkaXJlY3RpdmVJbmRleDogbnVtYmVyLCBwbGF5ZXJJbmRleDogbnVtYmVyKTogdm9pZCB7XG4gIGNvbnN0IGRvU2hpZnQgPSBpbmRleCA8IGNvbnRleHQubGVuZ3RoO1xuXG4gIC8vIHByb3AgZG9lcyBub3QgZXhpc3QgaW4gdGhlIGxpc3QsIGFkZCBpdCBpblxuICBjb250ZXh0LnNwbGljZShcbiAgICAgIGluZGV4LCAwLCBmbGFnIHwgU3R5bGluZ0ZsYWdzLkRpcnR5IHwgKGNsYXNzQmFzZWQgPyBTdHlsaW5nRmxhZ3MuQ2xhc3MgOiBTdHlsaW5nRmxhZ3MuTm9uZSksXG4gICAgICBuYW1lLCB2YWx1ZSwgMCk7XG4gIHNldFBsYXllckJ1aWxkZXJJbmRleChjb250ZXh0LCBpbmRleCwgcGxheWVySW5kZXgsIGRpcmVjdGl2ZUluZGV4KTtcblxuICBpZiAoZG9TaGlmdCkge1xuICAgIC8vIGJlY2F1c2UgdGhlIHZhbHVlIHdhcyBpbnNlcnRlZCBtaWR3YXkgaW50byB0aGUgYXJyYXkgdGhlbiB3ZVxuICAgIC8vIG5lZWQgdG8gdXBkYXRlIGFsbCB0aGUgc2hpZnRlZCBtdWx0aSB2YWx1ZXMnIHNpbmdsZSB2YWx1ZVxuICAgIC8vIHBvaW50ZXJzIHRvIHBvaW50IHRvIHRoZSBuZXdseSBzaGlmdGVkIGxvY2F0aW9uXG4gICAgdXBkYXRlU2luZ2xlUG9pbnRlclZhbHVlcyhjb250ZXh0LCBpbmRleCArIFN0eWxpbmdJbmRleC5TaXplKTtcbiAgfVxufVxuXG5mdW5jdGlvbiB2YWx1ZUV4aXN0cyh2YWx1ZTogc3RyaW5nIHwgbnVsbCB8IGJvb2xlYW4sIGlzQ2xhc3NCYXNlZD86IGJvb2xlYW4pIHtcbiAgcmV0dXJuIHZhbHVlICE9PSBudWxsO1xufVxuXG5mdW5jdGlvbiBwcmVwYXJlSW5pdGlhbEZsYWcoXG4gICAgY29udGV4dDogU3R5bGluZ0NvbnRleHQsIHByb3A6IHN0cmluZywgZW50cnlJc0NsYXNzQmFzZWQ6IGJvb2xlYW4sXG4gICAgc2FuaXRpemVyPzogU3R5bGVTYW5pdGl6ZUZuIHwgbnVsbCkge1xuICBsZXQgZmxhZyA9IChzYW5pdGl6ZXIgJiYgc2FuaXRpemVyKHByb3AsIG51bGwsIFN0eWxlU2FuaXRpemVNb2RlLlZhbGlkYXRlUHJvcGVydHkpKSA/XG4gICAgICBTdHlsaW5nRmxhZ3MuU2FuaXRpemUgOlxuICAgICAgU3R5bGluZ0ZsYWdzLk5vbmU7XG5cbiAgbGV0IGluaXRpYWxJbmRleDogbnVtYmVyO1xuICBpZiAoZW50cnlJc0NsYXNzQmFzZWQpIHtcbiAgICBmbGFnIHw9IFN0eWxpbmdGbGFncy5DbGFzcztcbiAgICBpbml0aWFsSW5kZXggPVxuICAgICAgICBnZXRJbml0aWFsU3R5bGluZ1ZhbHVlc0luZGV4T2YoY29udGV4dFtTdHlsaW5nSW5kZXguSW5pdGlhbENsYXNzVmFsdWVzUG9zaXRpb25dLCBwcm9wKTtcbiAgfSBlbHNlIHtcbiAgICBpbml0aWFsSW5kZXggPVxuICAgICAgICBnZXRJbml0aWFsU3R5bGluZ1ZhbHVlc0luZGV4T2YoY29udGV4dFtTdHlsaW5nSW5kZXguSW5pdGlhbFN0eWxlVmFsdWVzUG9zaXRpb25dLCBwcm9wKTtcbiAgfVxuXG4gIGluaXRpYWxJbmRleCA9IGluaXRpYWxJbmRleCA+IDAgPyAoaW5pdGlhbEluZGV4ICsgSW5pdGlhbFN0eWxpbmdWYWx1ZXNJbmRleC5WYWx1ZU9mZnNldCkgOiAwO1xuICByZXR1cm4gcG9pbnRlcnMoZmxhZywgaW5pdGlhbEluZGV4LCAwKTtcbn1cblxuZnVuY3Rpb24gaGFzSW5pdGlhbFZhbHVlQ2hhbmdlZChjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgZmxhZzogbnVtYmVyLCBuZXdWYWx1ZTogYW55KSB7XG4gIGNvbnN0IGluaXRpYWxWYWx1ZSA9IGdldEluaXRpYWxWYWx1ZShjb250ZXh0LCBmbGFnKTtcbiAgcmV0dXJuICFpbml0aWFsVmFsdWUgfHwgaGFzVmFsdWVDaGFuZ2VkKGZsYWcsIGluaXRpYWxWYWx1ZSwgbmV3VmFsdWUpO1xufVxuXG5mdW5jdGlvbiBoYXNWYWx1ZUNoYW5nZWQoXG4gICAgZmxhZzogbnVtYmVyLCBhOiBzdHJpbmcgfCBib29sZWFuIHwgbnVsbCwgYjogc3RyaW5nIHwgYm9vbGVhbiB8IG51bGwpOiBib29sZWFuIHtcbiAgY29uc3QgaXNDbGFzc0Jhc2VkID0gZmxhZyAmIFN0eWxpbmdGbGFncy5DbGFzcztcbiAgY29uc3QgaGFzVmFsdWVzID0gYSAmJiBiO1xuICBjb25zdCB1c2VzU2FuaXRpemVyID0gZmxhZyAmIFN0eWxpbmdGbGFncy5TYW5pdGl6ZTtcbiAgLy8gdGhlIHRvU3RyaW5nKCkgY29tcGFyaXNvbiBlbnN1cmVzIHRoYXQgYSB2YWx1ZSBpcyBjaGVja2VkXG4gIC8vIC4uLiBvdGhlcndpc2UgKGR1cmluZyBzYW5pdGl6YXRpb24gYnlwYXNzaW5nKSB0aGUgPT09IGNvbXBhcnNpb25cbiAgLy8gd291bGQgZmFpbCBzaW5jZSBhIG5ldyBTdHJpbmcoKSBpbnN0YW5jZSBpcyBjcmVhdGVkXG4gIGlmICghaXNDbGFzc0Jhc2VkICYmIGhhc1ZhbHVlcyAmJiB1c2VzU2FuaXRpemVyKSB7XG4gICAgLy8gd2Uga25vdyBmb3Igc3VyZSB3ZSdyZSBkZWFsaW5nIHdpdGggc3RyaW5ncyBhdCB0aGlzIHBvaW50XG4gICAgcmV0dXJuIChhIGFzIHN0cmluZykudG9TdHJpbmcoKSAhPT0gKGIgYXMgc3RyaW5nKS50b1N0cmluZygpO1xuICB9XG5cbiAgLy8gZXZlcnl0aGluZyBlbHNlIGlzIHNhZmUgdG8gY2hlY2sgd2l0aCBhIG5vcm1hbCBlcXVhbGl0eSBjaGVja1xuICByZXR1cm4gYSAhPT0gYjtcbn1cblxuZXhwb3J0IGNsYXNzIENsYXNzQW5kU3R5bGVQbGF5ZXJCdWlsZGVyPFQ+IGltcGxlbWVudHMgUGxheWVyQnVpbGRlciB7XG4gIHByaXZhdGUgX3ZhbHVlczoge1trZXk6IHN0cmluZ106IHN0cmluZyB8IG51bGx9ID0ge307XG4gIHByaXZhdGUgX2RpcnR5ID0gZmFsc2U7XG4gIHByaXZhdGUgX2ZhY3Rvcnk6IEJvdW5kUGxheWVyRmFjdG9yeTxUPjtcblxuICBjb25zdHJ1Y3RvcihmYWN0b3J5OiBQbGF5ZXJGYWN0b3J5LCBwcml2YXRlIF9lbGVtZW50OiBIVE1MRWxlbWVudCwgcHJpdmF0ZSBfdHlwZTogQmluZGluZ1R5cGUpIHtcbiAgICB0aGlzLl9mYWN0b3J5ID0gZmFjdG9yeSBhcyBhbnk7XG4gIH1cblxuICBzZXRWYWx1ZShwcm9wOiBzdHJpbmcsIHZhbHVlOiBhbnkpIHtcbiAgICBpZiAodGhpcy5fdmFsdWVzW3Byb3BdICE9PSB2YWx1ZSkge1xuICAgICAgdGhpcy5fdmFsdWVzW3Byb3BdID0gdmFsdWU7XG4gICAgICB0aGlzLl9kaXJ0eSA9IHRydWU7XG4gICAgfVxuICB9XG5cbiAgYnVpbGRQbGF5ZXIoY3VycmVudFBsYXllcjogUGxheWVyfG51bGwsIGlzRmlyc3RSZW5kZXI6IGJvb2xlYW4pOiBQbGF5ZXJ8dW5kZWZpbmVkfG51bGwge1xuICAgIC8vIGlmIG5vIHZhbHVlcyBoYXZlIGJlZW4gc2V0IGhlcmUgdGhlbiB0aGlzIG1lYW5zIHRoZSBiaW5kaW5nIGRpZG4ndFxuICAgIC8vIGNoYW5nZSBhbmQgdGhlcmVmb3JlIHRoZSBiaW5kaW5nIHZhbHVlcyB3ZXJlIG5vdCB1cGRhdGVkIHRocm91Z2hcbiAgICAvLyBgc2V0VmFsdWVgIHdoaWNoIG1lYW5zIG5vIG5ldyBwbGF5ZXIgd2lsbCBiZSBwcm92aWRlZC5cbiAgICBpZiAodGhpcy5fZGlydHkpIHtcbiAgICAgIGNvbnN0IHBsYXllciA9IHRoaXMuX2ZhY3RvcnkuZm4oXG4gICAgICAgICAgdGhpcy5fZWxlbWVudCwgdGhpcy5fdHlwZSwgdGhpcy5fdmFsdWVzICEsIGlzRmlyc3RSZW5kZXIsIGN1cnJlbnRQbGF5ZXIgfHwgbnVsbCk7XG4gICAgICB0aGlzLl92YWx1ZXMgPSB7fTtcbiAgICAgIHRoaXMuX2RpcnR5ID0gZmFsc2U7XG4gICAgICByZXR1cm4gcGxheWVyO1xuICAgIH1cblxuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cbn1cblxuLyoqXG4gKiBVc2VkIHRvIHByb3ZpZGUgYSBzdW1tYXJ5IG9mIHRoZSBzdGF0ZSBvZiB0aGUgc3R5bGluZyBjb250ZXh0LlxuICpcbiAqIFRoaXMgaXMgYW4gaW50ZXJuYWwgaW50ZXJmYWNlIHRoYXQgaXMgb25seSB1c2VkIGluc2lkZSBvZiB0ZXN0IHRvb2xpbmcgdG9cbiAqIGhlbHAgc3VtbWFyaXplIHdoYXQncyBnb2luZyBvbiB3aXRoaW4gdGhlIHN0eWxpbmcgY29udGV4dC4gTm9uZSBvZiB0aGlzIGNvZGVcbiAqIGlzIGRlc2lnbmVkIHRvIGJlIGV4cG9ydGVkIHB1YmxpY2x5IGFuZCB3aWxsLCB0aGVyZWZvcmUsIGJlIHRyZWUtc2hha2VuIGF3YXlcbiAqIGR1cmluZyBydW50aW1lLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIExvZ1N1bW1hcnkge1xuICBuYW1lOiBzdHJpbmc7ICAgICAgICAgIC8vXG4gIHN0YXRpY0luZGV4OiBudW1iZXI7ICAgLy9cbiAgZHluYW1pY0luZGV4OiBudW1iZXI7ICAvL1xuICB2YWx1ZTogbnVtYmVyOyAgICAgICAgIC8vXG4gIGZsYWdzOiB7XG4gICAgZGlydHk6IGJvb2xlYW47ICAgICAgICAgICAgICAgICAgICAvL1xuICAgIGNsYXNzOiBib29sZWFuOyAgICAgICAgICAgICAgICAgICAgLy9cbiAgICBzYW5pdGl6ZTogYm9vbGVhbjsgICAgICAgICAgICAgICAgIC8vXG4gICAgcGxheWVyQnVpbGRlcnNEaXJ0eTogYm9vbGVhbjsgICAgICAvL1xuICAgIGJpbmRpbmdBbGxvY2F0aW9uTG9ja2VkOiBib29sZWFuOyAgLy9cbiAgfTtcbn1cblxuLyoqXG4gKiBUaGlzIGZ1bmN0aW9uIGlzIG5vdCBkZXNpZ25lZCB0byBiZSB1c2VkIGluIHByb2R1Y3Rpb24uXG4gKiBJdCBpcyBhIHV0aWxpdHkgdG9vbCBmb3IgZGVidWdnaW5nIGFuZCB0ZXN0aW5nIGFuZCBpdFxuICogd2lsbCBhdXRvbWF0aWNhbGx5IGJlIHRyZWUtc2hha2VuIGF3YXkgZHVyaW5nIHByb2R1Y3Rpb24uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZW5lcmF0ZUNvbmZpZ1N1bW1hcnkoc291cmNlOiBudW1iZXIpOiBMb2dTdW1tYXJ5O1xuZXhwb3J0IGZ1bmN0aW9uIGdlbmVyYXRlQ29uZmlnU3VtbWFyeShzb3VyY2U6IFN0eWxpbmdDb250ZXh0KTogTG9nU3VtbWFyeTtcbmV4cG9ydCBmdW5jdGlvbiBnZW5lcmF0ZUNvbmZpZ1N1bW1hcnkoc291cmNlOiBTdHlsaW5nQ29udGV4dCwgaW5kZXg6IG51bWJlcik6IExvZ1N1bW1hcnk7XG5leHBvcnQgZnVuY3Rpb24gZ2VuZXJhdGVDb25maWdTdW1tYXJ5KHNvdXJjZTogbnVtYmVyIHwgU3R5bGluZ0NvbnRleHQsIGluZGV4PzogbnVtYmVyKTogTG9nU3VtbWFyeSB7XG4gIGxldCBmbGFnLCBuYW1lID0gJ2NvbmZpZyB2YWx1ZSBmb3IgJztcbiAgaWYgKEFycmF5LmlzQXJyYXkoc291cmNlKSkge1xuICAgIGlmIChpbmRleCkge1xuICAgICAgbmFtZSArPSAnaW5kZXg6ICcgKyBpbmRleDtcbiAgICB9IGVsc2Uge1xuICAgICAgbmFtZSArPSAnbWFzdGVyIGNvbmZpZyc7XG4gICAgfVxuICAgIGluZGV4ID0gaW5kZXggfHwgU3R5bGluZ0luZGV4Lk1hc3RlckZsYWdQb3NpdGlvbjtcbiAgICBmbGFnID0gc291cmNlW2luZGV4XSBhcyBudW1iZXI7XG4gIH0gZWxzZSB7XG4gICAgZmxhZyA9IHNvdXJjZTtcbiAgICBuYW1lICs9ICdpbmRleDogJyArIGZsYWc7XG4gIH1cbiAgY29uc3QgZHluYW1pY0luZGV4ID0gZ2V0TXVsdGlPclNpbmdsZUluZGV4KGZsYWcpO1xuICBjb25zdCBzdGF0aWNJbmRleCA9IGdldEluaXRpYWxJbmRleChmbGFnKTtcbiAgcmV0dXJuIHtcbiAgICBuYW1lLFxuICAgIHN0YXRpY0luZGV4LFxuICAgIGR5bmFtaWNJbmRleCxcbiAgICB2YWx1ZTogZmxhZyxcbiAgICBmbGFnczoge1xuICAgICAgZGlydHk6IGZsYWcgJiBTdHlsaW5nRmxhZ3MuRGlydHkgPyB0cnVlIDogZmFsc2UsXG4gICAgICBjbGFzczogZmxhZyAmIFN0eWxpbmdGbGFncy5DbGFzcyA/IHRydWUgOiBmYWxzZSxcbiAgICAgIHNhbml0aXplOiBmbGFnICYgU3R5bGluZ0ZsYWdzLlNhbml0aXplID8gdHJ1ZSA6IGZhbHNlLFxuICAgICAgcGxheWVyQnVpbGRlcnNEaXJ0eTogZmxhZyAmIFN0eWxpbmdGbGFncy5QbGF5ZXJCdWlsZGVyc0RpcnR5ID8gdHJ1ZSA6IGZhbHNlLFxuICAgICAgYmluZGluZ0FsbG9jYXRpb25Mb2NrZWQ6IGZsYWcgJiBTdHlsaW5nRmxhZ3MuQmluZGluZ0FsbG9jYXRpb25Mb2NrZWQgPyB0cnVlIDogZmFsc2UsXG4gICAgfVxuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0RGlyZWN0aXZlSW5kZXhGcm9tRW50cnkoY29udGV4dDogU3R5bGluZ0NvbnRleHQsIGluZGV4OiBudW1iZXIpIHtcbiAgY29uc3QgdmFsdWUgPSBjb250ZXh0W2luZGV4ICsgU3R5bGluZ0luZGV4LlBsYXllckJ1aWxkZXJJbmRleE9mZnNldF0gYXMgbnVtYmVyO1xuICByZXR1cm4gdmFsdWUgJiBEaXJlY3RpdmVPd25lckFuZFBsYXllckJ1aWxkZXJJbmRleC5CaXRNYXNrO1xufVxuXG5mdW5jdGlvbiBnZXRJbml0aWFsU3R5bGluZ1ZhbHVlc0luZGV4T2Yoa2V5VmFsdWVzOiBJbml0aWFsU3R5bGluZ1ZhbHVlcywga2V5OiBzdHJpbmcpOiBudW1iZXIge1xuICBmb3IgKGxldCBpID0gSW5pdGlhbFN0eWxpbmdWYWx1ZXNJbmRleC5LZXlWYWx1ZVN0YXJ0UG9zaXRpb247IGkgPCBrZXlWYWx1ZXMubGVuZ3RoO1xuICAgICAgIGkgKz0gSW5pdGlhbFN0eWxpbmdWYWx1ZXNJbmRleC5TaXplKSB7XG4gICAgaWYgKGtleVZhbHVlc1tpXSA9PT0ga2V5KSByZXR1cm4gaTtcbiAgfVxuICByZXR1cm4gLTE7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjb21wYXJlTG9nU3VtbWFyaWVzKGE6IExvZ1N1bW1hcnksIGI6IExvZ1N1bW1hcnkpIHtcbiAgY29uc3QgbG9nOiBzdHJpbmdbXSA9IFtdO1xuICBjb25zdCBkaWZmczogW3N0cmluZywgYW55LCBhbnldW10gPSBbXTtcbiAgZGlmZlN1bW1hcnlWYWx1ZXMoZGlmZnMsICdzdGF0aWNJbmRleCcsICdzdGF0aWNJbmRleCcsIGEsIGIpO1xuICBkaWZmU3VtbWFyeVZhbHVlcyhkaWZmcywgJ2R5bmFtaWNJbmRleCcsICdkeW5hbWljSW5kZXgnLCBhLCBiKTtcbiAgT2JqZWN0LmtleXMoYS5mbGFncykuZm9yRWFjaChcbiAgICAgIG5hbWUgPT4geyBkaWZmU3VtbWFyeVZhbHVlcyhkaWZmcywgJ2ZsYWdzLicgKyBuYW1lLCBuYW1lLCBhLmZsYWdzLCBiLmZsYWdzKTsgfSk7XG5cbiAgaWYgKGRpZmZzLmxlbmd0aCkge1xuICAgIGxvZy5wdXNoKCdMb2cgU3VtbWFyaWVzIGZvcjonKTtcbiAgICBsb2cucHVzaCgnICBBOiAnICsgYS5uYW1lKTtcbiAgICBsb2cucHVzaCgnICBCOiAnICsgYi5uYW1lKTtcbiAgICBsb2cucHVzaCgnXFxuICBEaWZmZXIgaW4gdGhlIGZvbGxvd2luZyB3YXkgKEEgIT09IEIpOicpO1xuICAgIGRpZmZzLmZvckVhY2gocmVzdWx0ID0+IHtcbiAgICAgIGNvbnN0IFtuYW1lLCBhVmFsLCBiVmFsXSA9IHJlc3VsdDtcbiAgICAgIGxvZy5wdXNoKCcgICAgPT4gJyArIG5hbWUpO1xuICAgICAgbG9nLnB1c2goJyAgICA9PiAnICsgYVZhbCArICcgIT09ICcgKyBiVmFsICsgJ1xcbicpO1xuICAgIH0pO1xuICB9XG5cbiAgcmV0dXJuIGxvZztcbn1cblxuZnVuY3Rpb24gZGlmZlN1bW1hcnlWYWx1ZXMocmVzdWx0OiBhbnlbXSwgbmFtZTogc3RyaW5nLCBwcm9wOiBzdHJpbmcsIGE6IGFueSwgYjogYW55KSB7XG4gIGNvbnN0IGFWYWwgPSBhW3Byb3BdO1xuICBjb25zdCBiVmFsID0gYltwcm9wXTtcbiAgaWYgKGFWYWwgIT09IGJWYWwpIHtcbiAgICByZXN1bHQucHVzaChbbmFtZSwgYVZhbCwgYlZhbF0pO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRTaW5nbGVQcm9wSW5kZXhWYWx1ZShcbiAgICBjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgZGlyZWN0aXZlSW5kZXg6IG51bWJlciwgb2Zmc2V0OiBudW1iZXIsIGlzQ2xhc3NCYXNlZDogYm9vbGVhbikge1xuICBjb25zdCBzaW5nbGVQcm9wT2Zmc2V0UmVnaXN0cnlJbmRleCA9XG4gICAgICBjb250ZXh0W1N0eWxpbmdJbmRleC5EaXJlY3RpdmVSZWdpc3RyeVBvc2l0aW9uXVxuICAgICAgICAgICAgIFsoZGlyZWN0aXZlSW5kZXggKiBEaXJlY3RpdmVSZWdpc3RyeVZhbHVlc0luZGV4LlNpemUpICtcbiAgICAgICAgICAgICAgRGlyZWN0aXZlUmVnaXN0cnlWYWx1ZXNJbmRleC5TaW5nbGVQcm9wVmFsdWVzSW5kZXhPZmZzZXRdIGFzIG51bWJlcjtcbiAgY29uc3Qgb2Zmc2V0cyA9IGNvbnRleHRbU3R5bGluZ0luZGV4LlNpbmdsZVByb3BPZmZzZXRQb3NpdGlvbnNdO1xuICBjb25zdCBpbmRleEZvck9mZnNldCA9IHNpbmdsZVByb3BPZmZzZXRSZWdpc3RyeUluZGV4ICtcbiAgICAgIFNpbmdsZVByb3BPZmZzZXRWYWx1ZXNJbmRleC5WYWx1ZVN0YXJ0UG9zaXRpb24gK1xuICAgICAgKGlzQ2xhc3NCYXNlZCA/XG4gICAgICAgICAgIG9mZnNldHNcbiAgICAgICAgICAgICAgIFtzaW5nbGVQcm9wT2Zmc2V0UmVnaXN0cnlJbmRleCArIFNpbmdsZVByb3BPZmZzZXRWYWx1ZXNJbmRleC5TdHlsZXNDb3VudFBvc2l0aW9uXSA6XG4gICAgICAgICAgIDApICtcbiAgICAgIG9mZnNldDtcbiAgcmV0dXJuIG9mZnNldHNbaW5kZXhGb3JPZmZzZXRdO1xufVxuXG5mdW5jdGlvbiBnZXRTdHlsZVNhbml0aXplcihjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgZGlyZWN0aXZlSW5kZXg6IG51bWJlcik6IFN0eWxlU2FuaXRpemVGbnxudWxsIHtcbiAgY29uc3QgZGlycyA9IGNvbnRleHRbU3R5bGluZ0luZGV4LkRpcmVjdGl2ZVJlZ2lzdHJ5UG9zaXRpb25dO1xuICBjb25zdCB2YWx1ZSA9IGRpcnNcbiAgICAgICAgICAgICAgICAgICAgW2RpcmVjdGl2ZUluZGV4ICogRGlyZWN0aXZlUmVnaXN0cnlWYWx1ZXNJbmRleC5TaXplICtcbiAgICAgICAgICAgICAgICAgICAgIERpcmVjdGl2ZVJlZ2lzdHJ5VmFsdWVzSW5kZXguU3R5bGVTYW5pdGl6ZXJPZmZzZXRdIHx8XG4gICAgICBkaXJzW0RpcmVjdGl2ZVJlZ2lzdHJ5VmFsdWVzSW5kZXguU3R5bGVTYW5pdGl6ZXJPZmZzZXRdIHx8IG51bGw7XG4gIHJldHVybiB2YWx1ZSBhcyBTdHlsZVNhbml0aXplRm4gfCBudWxsO1xufVxuXG5mdW5jdGlvbiBhbGxvd1ZhbHVlQ2hhbmdlKFxuICAgIGN1cnJlbnRWYWx1ZTogc3RyaW5nIHwgYm9vbGVhbiB8IG51bGwsIG5ld1ZhbHVlOiBzdHJpbmcgfCBib29sZWFuIHwgbnVsbCxcbiAgICBjdXJyZW50RGlyZWN0aXZlT3duZXI6IG51bWJlciwgbmV3RGlyZWN0aXZlT3duZXI6IG51bWJlcikge1xuICAvLyB0aGUgY29kZSBiZWxvdyByZWxpZXMgdGhlIGltcG9ydGFuY2Ugb2YgZGlyZWN0aXZlJ3MgYmVpbmcgdGllZCB0byB0aGVpclxuICAvLyBpbmRleCB2YWx1ZS4gVGhlIGluZGV4IHZhbHVlcyBmb3IgZWFjaCBkaXJlY3RpdmUgYXJlIGRlcml2ZWQgZnJvbSBiZWluZ1xuICAvLyByZWdpc3RlcmVkIGludG8gdGhlIHN0eWxpbmcgY29udGV4dCBkaXJlY3RpdmUgcmVnaXN0cnkuIFRoZSBtb3N0IGltcG9ydGFudFxuICAvLyBkaXJlY3RpdmUgaXMgdGhlIHBhcmVudCBjb21wb25lbnQgZGlyZWN0aXZlICh0aGUgdGVtcGxhdGUpIGFuZCBlYWNoIGRpcmVjdGl2ZVxuICAvLyB0aGF0IGlzIGFkZGVkIGFmdGVyIGlzIGNvbnNpZGVyZWQgbGVzcyBpbXBvcnRhbnQgdGhhbiB0aGUgcHJldmlvdXMgZW50cnkuIFRoaXNcbiAgLy8gcHJpb3JpdGl6YXRpb24gb2YgZGlyZWN0aXZlcyBlbmFibGVzIHRoZSBzdHlsaW5nIGFsZ29yaXRobSB0byBkZWNpZGUgaWYgYSBzdHlsZVxuICAvLyBvciBjbGFzcyBzaG91bGQgYmUgYWxsb3dlZCB0byBiZSB1cGRhdGVkL3JlcGxhY2VkIGluIGNhc2UgYW4gZWFybGllciBkaXJlY3RpdmVcbiAgLy8gYWxyZWFkeSB3cm90ZSB0byB0aGUgZXhhY3Qgc2FtZSBzdHlsZS1wcm9wZXJ0eSBvciBjbGFzc05hbWUgdmFsdWUuIEluIG90aGVyIHdvcmRzXG4gIC8vIHRoaXMgZGVjaWRlcyB3aGF0IHRvIGRvIGlmIGFuZCB3aGVuIHRoZXJlIGlzIGEgY29sbGlzaW9uLlxuICBpZiAoY3VycmVudFZhbHVlICE9IG51bGwpIHtcbiAgICBpZiAobmV3VmFsdWUgIT0gbnVsbCkge1xuICAgICAgLy8gaWYgYSBkaXJlY3RpdmUgaW5kZXggaXMgbG93ZXIgdGhhbiBpdCBhbHdheXMgaGFzIHByaW9yaXR5IG92ZXIgdGhlXG4gICAgICAvLyBwcmV2aW91cyBkaXJlY3RpdmUncyB2YWx1ZS4uLlxuICAgICAgcmV0dXJuIG5ld0RpcmVjdGl2ZU93bmVyIDw9IGN1cnJlbnREaXJlY3RpdmVPd25lcjtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gb25seSB3cml0ZSBhIG51bGwgdmFsdWUgaW4gY2FzZSBpdCdzIHRoZSBzYW1lIG93bmVyIHdyaXRpbmcgaXQuXG4gICAgICAvLyB0aGlzIGF2b2lkcyBoYXZpbmcgYSBoaWdoZXItcHJpb3JpdHkgZGlyZWN0aXZlIHdyaXRlIHRvIG51bGxcbiAgICAgIC8vIG9ubHkgdG8gaGF2ZSBhIGxlc3Nlci1wcmlvcml0eSBkaXJlY3RpdmUgY2hhbmdlIHJpZ2h0IHRvIGFcbiAgICAgIC8vIG5vbi1udWxsIHZhbHVlIGltbWVkaWF0ZWx5IGFmdGVyd2FyZHMuXG4gICAgICByZXR1cm4gY3VycmVudERpcmVjdGl2ZU93bmVyID09PSBuZXdEaXJlY3RpdmVPd25lcjtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHRydWU7XG59XG5cbi8qKlxuICogUmV0dXJucyB0aGUgY2xhc3NOYW1lIHN0cmluZyBvZiBhbGwgdGhlIGluaXRpYWwgY2xhc3NlcyBmb3IgdGhlIGVsZW1lbnQuXG4gKlxuICogVGhpcyBmdW5jdGlvbiBpcyBkZXNpZ25lZCB0byBwb3B1bGF0ZSBhbmQgY2FjaGUgYWxsIHRoZSBzdGF0aWMgY2xhc3NcbiAqIHZhbHVlcyBpbnRvIGEgY2xhc3NOYW1lIHN0cmluZy4gVGhlIGNhY2hpbmcgbWVjaGFuaXNtIHdvcmtzIGJ5IHBsYWNpbmdcbiAqIHRoZSBjb21wbGV0ZWQgY2xhc3NOYW1lIHN0cmluZyBpbnRvIHRoZSBpbml0aWFsIHZhbHVlcyBhcnJheSBpbnRvIGFcbiAqIGRlZGljYXRlZCBzbG90LiBUaGlzIHdpbGwgcHJldmVudCB0aGUgZnVuY3Rpb24gZnJvbSBoYXZpbmcgdG8gcG9wdWxhdGVcbiAqIHRoZSBzdHJpbmcgZWFjaCB0aW1lIGFuIGVsZW1lbnQgaXMgY3JlYXRlZCBvciBtYXRjaGVkLlxuICpcbiAqIEByZXR1cm5zIHRoZSBjbGFzc05hbWUgc3RyaW5nIChlLmcuIGBvbiBhY3RpdmUgcmVkYClcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldEluaXRpYWxDbGFzc05hbWVWYWx1ZShjb250ZXh0OiBTdHlsaW5nQ29udGV4dCk6IHN0cmluZyB7XG4gIGNvbnN0IGluaXRpYWxDbGFzc1ZhbHVlcyA9IGNvbnRleHRbU3R5bGluZ0luZGV4LkluaXRpYWxDbGFzc1ZhbHVlc1Bvc2l0aW9uXTtcbiAgbGV0IGNsYXNzTmFtZSA9IGluaXRpYWxDbGFzc1ZhbHVlc1tJbml0aWFsU3R5bGluZ1ZhbHVlc0luZGV4LkNhY2hlZFN0cmluZ1ZhbHVlUG9zaXRpb25dO1xuICBpZiAoY2xhc3NOYW1lID09PSBudWxsKSB7XG4gICAgY2xhc3NOYW1lID0gJyc7XG4gICAgZm9yIChsZXQgaSA9IEluaXRpYWxTdHlsaW5nVmFsdWVzSW5kZXguS2V5VmFsdWVTdGFydFBvc2l0aW9uOyBpIDwgaW5pdGlhbENsYXNzVmFsdWVzLmxlbmd0aDtcbiAgICAgICAgIGkgKz0gSW5pdGlhbFN0eWxpbmdWYWx1ZXNJbmRleC5TaXplKSB7XG4gICAgICBjb25zdCBpc1ByZXNlbnQgPSBpbml0aWFsQ2xhc3NWYWx1ZXNbaSArIDFdO1xuICAgICAgaWYgKGlzUHJlc2VudCkge1xuICAgICAgICBjbGFzc05hbWUgKz0gKGNsYXNzTmFtZS5sZW5ndGggPyAnICcgOiAnJykgKyBpbml0aWFsQ2xhc3NWYWx1ZXNbaV07XG4gICAgICB9XG4gICAgfVxuICAgIGluaXRpYWxDbGFzc1ZhbHVlc1tJbml0aWFsU3R5bGluZ1ZhbHVlc0luZGV4LkNhY2hlZFN0cmluZ1ZhbHVlUG9zaXRpb25dID0gY2xhc3NOYW1lO1xuICB9XG4gIHJldHVybiBjbGFzc05hbWU7XG59XG5cbi8qKlxuICogUmV0dXJucyB0aGUgc3R5bGUgc3RyaW5nIG9mIGFsbCB0aGUgaW5pdGlhbCBzdHlsZXMgZm9yIHRoZSBlbGVtZW50LlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gaXMgZGVzaWduZWQgdG8gcG9wdWxhdGUgYW5kIGNhY2hlIGFsbCB0aGUgc3RhdGljIHN0eWxlXG4gKiB2YWx1ZXMgaW50byBhIHN0eWxlIHN0cmluZy4gVGhlIGNhY2hpbmcgbWVjaGFuaXNtIHdvcmtzIGJ5IHBsYWNpbmdcbiAqIHRoZSBjb21wbGV0ZWQgc3R5bGUgc3RyaW5nIGludG8gdGhlIGluaXRpYWwgdmFsdWVzIGFycmF5IGludG8gYVxuICogZGVkaWNhdGVkIHNsb3QuIFRoaXMgd2lsbCBwcmV2ZW50IHRoZSBmdW5jdGlvbiBmcm9tIGhhdmluZyB0byBwb3B1bGF0ZVxuICogdGhlIHN0cmluZyBlYWNoIHRpbWUgYW4gZWxlbWVudCBpcyBjcmVhdGVkIG9yIG1hdGNoZWQuXG4gKlxuICogQHJldHVybnMgdGhlIHN0eWxlIHN0cmluZyAoZS5nLiBgd2lkdGg6MTAwcHg7aGVpZ2h0OjIwMHB4YClcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldEluaXRpYWxTdHlsZVN0cmluZ1ZhbHVlKGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0KTogc3RyaW5nIHtcbiAgY29uc3QgaW5pdGlhbFN0eWxlVmFsdWVzID0gY29udGV4dFtTdHlsaW5nSW5kZXguSW5pdGlhbFN0eWxlVmFsdWVzUG9zaXRpb25dO1xuICBsZXQgc3R5bGVTdHJpbmcgPSBpbml0aWFsU3R5bGVWYWx1ZXNbSW5pdGlhbFN0eWxpbmdWYWx1ZXNJbmRleC5DYWNoZWRTdHJpbmdWYWx1ZVBvc2l0aW9uXTtcbiAgaWYgKHN0eWxlU3RyaW5nID09PSBudWxsKSB7XG4gICAgc3R5bGVTdHJpbmcgPSAnJztcbiAgICBmb3IgKGxldCBpID0gSW5pdGlhbFN0eWxpbmdWYWx1ZXNJbmRleC5LZXlWYWx1ZVN0YXJ0UG9zaXRpb247IGkgPCBpbml0aWFsU3R5bGVWYWx1ZXMubGVuZ3RoO1xuICAgICAgICAgaSArPSBJbml0aWFsU3R5bGluZ1ZhbHVlc0luZGV4LlNpemUpIHtcbiAgICAgIGNvbnN0IHZhbHVlID0gaW5pdGlhbFN0eWxlVmFsdWVzW2kgKyAxXTtcbiAgICAgIGlmICh2YWx1ZSAhPT0gbnVsbCkge1xuICAgICAgICBzdHlsZVN0cmluZyArPSAoc3R5bGVTdHJpbmcubGVuZ3RoID8gJzsnIDogJycpICsgYCR7aW5pdGlhbFN0eWxlVmFsdWVzW2ldfToke3ZhbHVlfWA7XG4gICAgICB9XG4gICAgfVxuICAgIGluaXRpYWxTdHlsZVZhbHVlc1tJbml0aWFsU3R5bGluZ1ZhbHVlc0luZGV4LkNhY2hlZFN0cmluZ1ZhbHVlUG9zaXRpb25dID0gc3R5bGVTdHJpbmc7XG4gIH1cbiAgcmV0dXJuIHN0eWxlU3RyaW5nO1xufVxuXG4vKipcbiAqIFJldHVybnMgdGhlIGN1cnJlbnQgY2FjaGVkIG11bHRpLXZhbHVlIGZvciBhIGdpdmVuIGRpcmVjdGl2ZUluZGV4IHdpdGhpbiB0aGUgcHJvdmlkZWQgY29udGV4dC5cbiAqL1xuZnVuY3Rpb24gcmVhZENhY2hlZE1hcFZhbHVlKFxuICAgIGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBlbnRyeUlzQ2xhc3NCYXNlZDogYm9vbGVhbiwgZGlyZWN0aXZlSW5kZXg6IG51bWJlcikge1xuICBjb25zdCB2YWx1ZXM6IE1hcEJhc2VkT2Zmc2V0VmFsdWVzID1cbiAgICAgIGNvbnRleHRbZW50cnlJc0NsYXNzQmFzZWQgPyBTdHlsaW5nSW5kZXguQ2FjaGVkTXVsdGlDbGFzc2VzIDogU3R5bGluZ0luZGV4LkNhY2hlZE11bHRpU3R5bGVzXTtcbiAgY29uc3QgaW5kZXggPSBNYXBCYXNlZE9mZnNldFZhbHVlc0luZGV4LlZhbHVlc1N0YXJ0UG9zaXRpb24gK1xuICAgICAgZGlyZWN0aXZlSW5kZXggKiBNYXBCYXNlZE9mZnNldFZhbHVlc0luZGV4LlNpemU7XG4gIHJldHVybiB2YWx1ZXNbaW5kZXggKyBNYXBCYXNlZE9mZnNldFZhbHVlc0luZGV4LlZhbHVlT2Zmc2V0XSB8fCBudWxsO1xufVxuXG4vKipcbiAqIERldGVybWluZXMgd2hldGhlciB0aGUgcHJvdmlkZWQgbXVsdGkgc3R5bGluZyB2YWx1ZSBzaG91bGQgYmUgdXBkYXRlZCBvciBub3QuXG4gKlxuICogQmVjYXVzZSBgW3N0eWxlXWAgYW5kIGBbY2xhc3NdYCBiaW5kaW5ncyByZWx5IG9uIGFuIGlkZW50aXR5IGNoYW5nZSB0byBvY2N1ciBiZWZvcmVcbiAqIGFwcGx5aW5nIG5ldyB2YWx1ZXMsIHRoZSBzdHlsaW5nIGFsZ29yaXRobSBtYXkgbm90IHVwZGF0ZSBhbiBleGlzdGluZyBlbnRyeSBpbnRvXG4gKiB0aGUgY29udGV4dCBpZiBhIHByZXZpb3VzIGRpcmVjdGl2ZSdzIGVudHJ5IGNoYW5nZWQgc2hhcGUuXG4gKlxuICogVGhpcyBmdW5jdGlvbiB3aWxsIGRlY2lkZSB3aGV0aGVyIG9yIG5vdCBhIHZhbHVlIHNob3VsZCBiZSBhcHBsaWVkIChpZiB0aGVyZSBpcyBhXG4gKiBjYWNoZSBtaXNzKSB0byB0aGUgY29udGV4dCBiYXNlZCBvbiB0aGUgZm9sbG93aW5nIHJ1bGVzOlxuICpcbiAqIC0gSWYgdGhlcmUgaXMgYW4gaWRlbnRpdHkgY2hhbmdlIGJldHdlZW4gdGhlIGV4aXN0aW5nIHZhbHVlIGFuZCBuZXcgdmFsdWVcbiAqIC0gSWYgdGhlcmUgaXMgbm8gZXhpc3RpbmcgdmFsdWUgY2FjaGVkIChmaXJzdCB3cml0ZSlcbiAqIC0gSWYgYSBwcmV2aW91cyBkaXJlY3RpdmUgZmxhZ2dlZCB0aGUgZXhpc3RpbmcgY2FjaGVkIHZhbHVlIGFzIGRpcnR5XG4gKi9cbmZ1bmN0aW9uIGlzTXVsdGlWYWx1ZUNhY2hlSGl0KFxuICAgIGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBlbnRyeUlzQ2xhc3NCYXNlZDogYm9vbGVhbiwgZGlyZWN0aXZlSW5kZXg6IG51bWJlcixcbiAgICBuZXdWYWx1ZTogYW55KTogYm9vbGVhbiB7XG4gIGNvbnN0IGluZGV4T2ZDYWNoZWRWYWx1ZXMgPVxuICAgICAgZW50cnlJc0NsYXNzQmFzZWQgPyBTdHlsaW5nSW5kZXguQ2FjaGVkTXVsdGlDbGFzc2VzIDogU3R5bGluZ0luZGV4LkNhY2hlZE11bHRpU3R5bGVzO1xuICBjb25zdCBjYWNoZWRWYWx1ZXMgPSBjb250ZXh0W2luZGV4T2ZDYWNoZWRWYWx1ZXNdIGFzIE1hcEJhc2VkT2Zmc2V0VmFsdWVzO1xuICBjb25zdCBpbmRleCA9IE1hcEJhc2VkT2Zmc2V0VmFsdWVzSW5kZXguVmFsdWVzU3RhcnRQb3NpdGlvbiArXG4gICAgICBkaXJlY3RpdmVJbmRleCAqIE1hcEJhc2VkT2Zmc2V0VmFsdWVzSW5kZXguU2l6ZTtcbiAgaWYgKGNhY2hlZFZhbHVlc1tpbmRleCArIE1hcEJhc2VkT2Zmc2V0VmFsdWVzSW5kZXguRGlydHlGbGFnT2Zmc2V0XSkgcmV0dXJuIGZhbHNlO1xuICByZXR1cm4gbmV3VmFsdWUgPT09IE5PX0NIQU5HRSB8fFxuICAgICAgcmVhZENhY2hlZE1hcFZhbHVlKGNvbnRleHQsIGVudHJ5SXNDbGFzc0Jhc2VkLCBkaXJlY3RpdmVJbmRleCkgPT09IG5ld1ZhbHVlO1xufVxuXG4vKipcbiAqIFVwZGF0ZXMgdGhlIGNhY2hlZCBzdGF0dXMgb2YgYSBtdWx0aS1zdHlsaW5nIHZhbHVlIGluIHRoZSBjb250ZXh0LlxuICpcbiAqIFRoZSBjYWNoZWQgbWFwIGFycmF5ICh3aGljaCBleGlzdHMgaW4gdGhlIGNvbnRleHQpIGNvbnRhaW5zIGEgbWFuaWZlc3Qgb2ZcbiAqIGVhY2ggbXVsdGktc3R5bGluZyBlbnRyeSAoYFtzdHlsZV1gIGFuZCBgW2NsYXNzXWAgZW50cmllcykgZm9yIHRoZSB0ZW1wbGF0ZVxuICogYXMgd2VsbCBhcyBhbGwgZGlyZWN0aXZlcy5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIHdpbGwgdXBkYXRlIHRoZSBjYWNoZWQgc3RhdHVzIG9mIHRoZSBwcm92aWRlZCBtdWx0aS1zdHlsZVxuICogZW50cnkgd2l0aGluIHRoZSBjYWNoZS5cbiAqXG4gKiBXaGVuIGNhbGxlZCwgdGhpcyBmdW5jdGlvbiB3aWxsIHVwZGF0ZSB0aGUgZm9sbG93aW5nIGluZm9ybWF0aW9uOlxuICogLSBUaGUgYWN0dWFsIGNhY2hlZCB2YWx1ZSAodGhlIHJhdyB2YWx1ZSB0aGF0IHdhcyBwYXNzZWQgaW50byBgW3N0eWxlXWAgb3IgYFtjbGFzc11gKVxuICogLSBUaGUgdG90YWwgYW1vdW50IG9mIHVuaXF1ZSBzdHlsaW5nIGVudHJpZXMgdGhhdCB0aGlzIHZhbHVlIGhhcyB3cml0dGVuIGludG8gdGhlIGNvbnRleHRcbiAqIC0gVGhlIGV4YWN0IHBvc2l0aW9uIG9mIHdoZXJlIHRoZSBtdWx0aSBzdHlsaW5nIGVudHJpZXMgc3RhcnQgaW4gdGhlIGNvbnRleHQgZm9yIHRoaXMgYmluZGluZ1xuICogLSBUaGUgZGlydHkgZmxhZyB3aWxsIGJlIHNldCB0byB0cnVlXG4gKlxuICogSWYgdGhlIGBkaXJ0eUZ1dHVyZVZhbHVlc2AgcGFyYW0gaXMgcHJvdmlkZWQgdGhlbiBpdCB3aWxsIHVwZGF0ZSBhbGwgZnV0dXJlIGVudHJpZXMgKGJpbmRpbmdcbiAqIGVudHJpZXMgdGhhdCBleGlzdCBhcyBhIHBhcnQgb2Ygb3RoZXIgZGlyZWN0aXZlcykgdG8gYmUgZGlydHkgYXMgd2VsbC4gVGhpcyB3aWxsIGZvcmNlIHRoZVxuICogc3R5bGluZyBhbGdvcml0aG0gdG8gcmVhcHBseSB0aG9zZSB2YWx1ZXMgb25jZSBjaGFuZ2UgZGV0ZWN0aW9uIGNoZWNrcyB0aGVtICh3aGljaCB3aWxsIGluXG4gKiB0dXJuIGNhdXNlIHRoZSBzdHlsaW5nIGNvbnRleHQgdG8gdXBkYXRlIGl0c2VsZiBhbmQgdGhlIGNvcnJlY3Qgc3R5bGluZyB2YWx1ZXMgd2lsbCBiZVxuICogcmVuZGVyZWQgb24gc2NyZWVuKS5cbiAqL1xuZnVuY3Rpb24gdXBkYXRlQ2FjaGVkTWFwVmFsdWUoXG4gICAgY29udGV4dDogU3R5bGluZ0NvbnRleHQsIGRpcmVjdGl2ZUluZGV4OiBudW1iZXIsIGVudHJ5SXNDbGFzc0Jhc2VkOiBib29sZWFuLCBjYWNoZVZhbHVlOiBhbnksXG4gICAgc3RhcnRQb3NpdGlvbjogbnVtYmVyLCBlbmRQb3NpdGlvbjogbnVtYmVyLCB0b3RhbFZhbHVlczogbnVtYmVyLCBkaXJ0eUZ1dHVyZVZhbHVlczogYm9vbGVhbikge1xuICBjb25zdCB2YWx1ZXMgPVxuICAgICAgY29udGV4dFtlbnRyeUlzQ2xhc3NCYXNlZCA/IFN0eWxpbmdJbmRleC5DYWNoZWRNdWx0aUNsYXNzZXMgOiBTdHlsaW5nSW5kZXguQ2FjaGVkTXVsdGlTdHlsZXNdO1xuXG4gIGNvbnN0IGluZGV4ID0gTWFwQmFzZWRPZmZzZXRWYWx1ZXNJbmRleC5WYWx1ZXNTdGFydFBvc2l0aW9uICtcbiAgICAgIGRpcmVjdGl2ZUluZGV4ICogTWFwQmFzZWRPZmZzZXRWYWx1ZXNJbmRleC5TaXplO1xuXG4gIC8vIGluIHRoZSBldmVudCB0aGF0IHRoaXMgaXMgdHJ1ZSB3ZSBhc3N1bWUgdGhhdCBmdXR1cmUgdmFsdWVzIGFyZSBkaXJ0eSBhbmQgdGhlcmVmb3JlXG4gIC8vIHdpbGwgYmUgY2hlY2tlZCBhZ2FpbiBpbiB0aGUgbmV4dCBDRCBjeWNsZVxuICBpZiAoZGlydHlGdXR1cmVWYWx1ZXMpIHtcbiAgICBjb25zdCBuZXh0U3RhcnRQb3NpdGlvbiA9IHN0YXJ0UG9zaXRpb24gKyB0b3RhbFZhbHVlcyAqIE1hcEJhc2VkT2Zmc2V0VmFsdWVzSW5kZXguU2l6ZTtcbiAgICBmb3IgKGxldCBpID0gaW5kZXggKyBNYXBCYXNlZE9mZnNldFZhbHVlc0luZGV4LlNpemU7IGkgPCB2YWx1ZXMubGVuZ3RoO1xuICAgICAgICAgaSArPSBNYXBCYXNlZE9mZnNldFZhbHVlc0luZGV4LlNpemUpIHtcbiAgICAgIHZhbHVlc1tpICsgTWFwQmFzZWRPZmZzZXRWYWx1ZXNJbmRleC5Qb3NpdGlvblN0YXJ0T2Zmc2V0XSA9IG5leHRTdGFydFBvc2l0aW9uO1xuICAgICAgdmFsdWVzW2kgKyBNYXBCYXNlZE9mZnNldFZhbHVlc0luZGV4LkRpcnR5RmxhZ09mZnNldF0gPSAxO1xuICAgIH1cbiAgfVxuXG4gIHZhbHVlc1tpbmRleCArIE1hcEJhc2VkT2Zmc2V0VmFsdWVzSW5kZXguRGlydHlGbGFnT2Zmc2V0XSA9IDA7XG4gIHZhbHVlc1tpbmRleCArIE1hcEJhc2VkT2Zmc2V0VmFsdWVzSW5kZXguUG9zaXRpb25TdGFydE9mZnNldF0gPSBzdGFydFBvc2l0aW9uO1xuICB2YWx1ZXNbaW5kZXggKyBNYXBCYXNlZE9mZnNldFZhbHVlc0luZGV4LlZhbHVlT2Zmc2V0XSA9IGNhY2hlVmFsdWU7XG4gIHZhbHVlc1tpbmRleCArIE1hcEJhc2VkT2Zmc2V0VmFsdWVzSW5kZXguVmFsdWVDb3VudE9mZnNldF0gPSB0b3RhbFZhbHVlcztcblxuICAvLyB0aGUgY29kZSBiZWxvdyBjb3VudHMgdGhlIHRvdGFsIGFtb3VudCBvZiBzdHlsaW5nIHZhbHVlcyB0aGF0IGV4aXN0IGluXG4gIC8vIHRoZSBjb250ZXh0IHVwIHVudGlsIHRoaXMgZGlyZWN0aXZlLiBUaGlzIHZhbHVlIHdpbGwgYmUgbGF0ZXIgdXNlZCB0b1xuICAvLyB1cGRhdGUgdGhlIGNhY2hlZCB2YWx1ZSBtYXAncyB0b3RhbCBjb3VudGVyIHZhbHVlLlxuICBsZXQgdG90YWxTdHlsaW5nRW50cmllcyA9IHRvdGFsVmFsdWVzO1xuICBmb3IgKGxldCBpID0gTWFwQmFzZWRPZmZzZXRWYWx1ZXNJbmRleC5WYWx1ZXNTdGFydFBvc2l0aW9uOyBpIDwgaW5kZXg7XG4gICAgICAgaSArPSBNYXBCYXNlZE9mZnNldFZhbHVlc0luZGV4LlNpemUpIHtcbiAgICB0b3RhbFN0eWxpbmdFbnRyaWVzICs9IHZhbHVlc1tpICsgTWFwQmFzZWRPZmZzZXRWYWx1ZXNJbmRleC5WYWx1ZUNvdW50T2Zmc2V0XTtcbiAgfVxuXG4gIC8vIGJlY2F1c2Ugc3R5bGUgdmFsdWVzIGNvbWUgYmVmb3JlIGNsYXNzIHZhbHVlcyBpbiB0aGUgY29udGV4dCB0aGlzIG1lYW5zXG4gIC8vIHRoYXQgaWYgYW55IG5ldyB2YWx1ZXMgd2VyZSBpbnNlcnRlZCB0aGVuIHRoZSBjYWNoZSB2YWx1ZXMgYXJyYXkgZm9yXG4gIC8vIGNsYXNzZXMgaXMgb3V0IG9mIHN5bmMuIFRoZSBjb2RlIGJlbG93IHdpbGwgdXBkYXRlIHRoZSBvZmZzZXRzIHRvIHBvaW50XG4gIC8vIHRvIHRoZWlyIG5ldyB2YWx1ZXMuXG4gIGlmICghZW50cnlJc0NsYXNzQmFzZWQpIHtcbiAgICBjb25zdCBjbGFzc0NhY2hlID0gY29udGV4dFtTdHlsaW5nSW5kZXguQ2FjaGVkTXVsdGlDbGFzc2VzXTtcbiAgICBjb25zdCBjbGFzc2VzU3RhcnRQb3NpdGlvbiA9IGNsYXNzQ2FjaGVcbiAgICAgICAgW01hcEJhc2VkT2Zmc2V0VmFsdWVzSW5kZXguVmFsdWVzU3RhcnRQb3NpdGlvbiArXG4gICAgICAgICBNYXBCYXNlZE9mZnNldFZhbHVlc0luZGV4LlBvc2l0aW9uU3RhcnRPZmZzZXRdO1xuICAgIGNvbnN0IGRpZmZJblN0YXJ0UG9zaXRpb24gPSBlbmRQb3NpdGlvbiAtIGNsYXNzZXNTdGFydFBvc2l0aW9uO1xuICAgIGZvciAobGV0IGkgPSBNYXBCYXNlZE9mZnNldFZhbHVlc0luZGV4LlZhbHVlc1N0YXJ0UG9zaXRpb247IGkgPCBjbGFzc0NhY2hlLmxlbmd0aDtcbiAgICAgICAgIGkgKz0gTWFwQmFzZWRPZmZzZXRWYWx1ZXNJbmRleC5TaXplKSB7XG4gICAgICBjbGFzc0NhY2hlW2kgKyBNYXBCYXNlZE9mZnNldFZhbHVlc0luZGV4LlBvc2l0aW9uU3RhcnRPZmZzZXRdICs9IGRpZmZJblN0YXJ0UG9zaXRpb247XG4gICAgfVxuICB9XG5cbiAgdmFsdWVzW01hcEJhc2VkT2Zmc2V0VmFsdWVzSW5kZXguRW50cmllc0NvdW50UG9zaXRpb25dID0gdG90YWxTdHlsaW5nRW50cmllcztcbn1cblxuZnVuY3Rpb24gaHlwaGVuYXRlRW50cmllcyhlbnRyaWVzOiBzdHJpbmdbXSk6IHN0cmluZ1tdIHtcbiAgY29uc3QgbmV3RW50cmllczogc3RyaW5nW10gPSBbXTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBlbnRyaWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgbmV3RW50cmllcy5wdXNoKGh5cGhlbmF0ZShlbnRyaWVzW2ldKSk7XG4gIH1cbiAgcmV0dXJuIG5ld0VudHJpZXM7XG59XG5cbmZ1bmN0aW9uIGh5cGhlbmF0ZSh2YWx1ZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHZhbHVlLnJlcGxhY2UoXG4gICAgICAvW2Etel1bQS1aXS9nLCBtYXRjaCA9PiBgJHttYXRjaC5jaGFyQXQoMCl9LSR7bWF0Y2guY2hhckF0KDEpLnRvTG93ZXJDYXNlKCl9YCk7XG59XG5cbmZ1bmN0aW9uIHJlZ2lzdGVyTXVsdGlNYXBFbnRyeShcbiAgICBjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgZGlyZWN0aXZlSW5kZXg6IG51bWJlciwgZW50cnlJc0NsYXNzQmFzZWQ6IGJvb2xlYW4sXG4gICAgc3RhcnRQb3NpdGlvbjogbnVtYmVyLCBjb3VudCA9IDApIHtcbiAgY29uc3QgY2FjaGVkVmFsdWVzID1cbiAgICAgIGNvbnRleHRbZW50cnlJc0NsYXNzQmFzZWQgPyBTdHlsaW5nSW5kZXguQ2FjaGVkTXVsdGlDbGFzc2VzIDogU3R5bGluZ0luZGV4LkNhY2hlZE11bHRpU3R5bGVzXTtcbiAgaWYgKGRpcmVjdGl2ZUluZGV4ID4gMCkge1xuICAgIGNvbnN0IGxpbWl0ID0gTWFwQmFzZWRPZmZzZXRWYWx1ZXNJbmRleC5WYWx1ZXNTdGFydFBvc2l0aW9uICtcbiAgICAgICAgKGRpcmVjdGl2ZUluZGV4ICogTWFwQmFzZWRPZmZzZXRWYWx1ZXNJbmRleC5TaXplKTtcbiAgICB3aGlsZSAoY2FjaGVkVmFsdWVzLmxlbmd0aCA8IGxpbWl0KSB7XG4gICAgICAvLyB0aGlzIG1lYW5zIHRoYXQgT05MWSBkaXJlY3RpdmUgY2xhc3Mgc3R5bGluZyAobGlrZSBuZ0NsYXNzKSB3YXMgdXNlZFxuICAgICAgLy8gdGhlcmVmb3JlIHRoZSByb290IGRpcmVjdGl2ZSB3aWxsIHN0aWxsIG5lZWQgdG8gYmUgZmlsbGVkIGluIGFzIHdlbGxcbiAgICAgIC8vIGFzIGFueSBvdGhlciBkaXJlY3RpdmUgc3BhY2VzIGluIGNhc2UgdGhleSBvbmx5IHVzZWQgc3RhdGljIHZhbHVlc1xuICAgICAgY2FjaGVkVmFsdWVzLnB1c2goMCwgc3RhcnRQb3NpdGlvbiwgbnVsbCwgMCk7XG4gICAgfVxuICB9XG4gIGNhY2hlZFZhbHVlcy5wdXNoKDAsIHN0YXJ0UG9zaXRpb24sIG51bGwsIGNvdW50KTtcbn1cblxuLyoqXG4gKiBJbnNlcnRzIG9yIHVwZGF0ZXMgYW4gZXhpc3RpbmcgZW50cnkgaW4gdGhlIHByb3ZpZGVkIGBzdGF0aWNTdHlsZXNgIGNvbGxlY3Rpb24uXG4gKlxuICogQHBhcmFtIGluZGV4IHRoZSBpbmRleCByZXByZXNlbnRpbmcgYW4gZXhpc3Rpbmcgc3R5bGluZyBlbnRyeSBpbiB0aGUgY29sbGVjdGlvbjpcbiAqICBpZiBwcm92aWRlZCAobnVtZXJpYyk6IHRoZW4gaXQgd2lsbCB1cGRhdGUgdGhlIGV4aXN0aW5nIGVudHJ5IGF0IHRoZSBnaXZlbiBwb3NpdGlvblxuICogIGlmIG51bGw6IHRoZW4gaXQgd2lsbCBpbnNlcnQgYSBuZXcgZW50cnkgd2l0aGluIHRoZSBjb2xsZWN0aW9uXG4gKiBAcGFyYW0gc3RhdGljU3R5bGVzIGEgY29sbGVjdGlvbiBvZiBzdHlsZSBvciBjbGFzcyBlbnRyaWVzIHdoZXJlIHRoZSB2YWx1ZSB3aWxsXG4gKiAgYmUgaW5zZXJ0ZWQgb3IgcGF0Y2hlZFxuICogQHBhcmFtIHByb3AgdGhlIHByb3BlcnR5IHZhbHVlIG9mIHRoZSBlbnRyeSAoZS5nLiBgd2lkdGhgIChzdHlsZXMpIG9yIGBmb29gIChjbGFzc2VzKSlcbiAqIEBwYXJhbSB2YWx1ZSB0aGUgc3R5bGluZyB2YWx1ZSBvZiB0aGUgZW50cnkgKGUuZy4gYGFic29sdXRlYCAoc3R5bGVzKSBvciBgdHJ1ZWAgKGNsYXNzZXMpKVxuICogQHBhcmFtIGRpcmVjdGl2ZU93bmVySW5kZXggdGhlIGRpcmVjdGl2ZSBvd25lciBpbmRleCB2YWx1ZSBvZiB0aGUgc3R5bGluZyBzb3VyY2UgcmVzcG9uc2libGVcbiAqICAgICAgICBmb3IgdGhlc2Ugc3R5bGVzIChzZWUgYGludGVyZmFjZXMvc3R5bGluZy50cyNkaXJlY3RpdmVzYCBmb3IgbW9yZSBpbmZvKVxuICogQHJldHVybnMgdGhlIGluZGV4IG9mIHRoZSB1cGRhdGVkIG9yIG5ldyBlbnRyeSB3aXRoaW4gdGhlIGNvbGxlY3Rpb25cbiAqL1xuZnVuY3Rpb24gYWRkT3JVcGRhdGVTdGF0aWNTdHlsZShcbiAgICBpbmRleDogbnVtYmVyIHwgbnVsbCwgc3RhdGljU3R5bGVzOiBJbml0aWFsU3R5bGluZ1ZhbHVlcywgcHJvcDogc3RyaW5nLFxuICAgIHZhbHVlOiBzdHJpbmcgfCBib29sZWFuIHwgbnVsbCwgZGlyZWN0aXZlT3duZXJJbmRleDogbnVtYmVyKSB7XG4gIGlmIChpbmRleCA9PT0gbnVsbCkge1xuICAgIGluZGV4ID0gc3RhdGljU3R5bGVzLmxlbmd0aDtcbiAgICBzdGF0aWNTdHlsZXMucHVzaChudWxsLCBudWxsLCBudWxsKTtcbiAgICBzdGF0aWNTdHlsZXNbaW5kZXggKyBJbml0aWFsU3R5bGluZ1ZhbHVlc0luZGV4LlByb3BPZmZzZXRdID0gcHJvcDtcbiAgfVxuICBzdGF0aWNTdHlsZXNbaW5kZXggKyBJbml0aWFsU3R5bGluZ1ZhbHVlc0luZGV4LlZhbHVlT2Zmc2V0XSA9IHZhbHVlO1xuICBzdGF0aWNTdHlsZXNbaW5kZXggKyBJbml0aWFsU3R5bGluZ1ZhbHVlc0luZGV4LkRpcmVjdGl2ZU93bmVyT2Zmc2V0XSA9IGRpcmVjdGl2ZU93bmVySW5kZXg7XG4gIHJldHVybiBpbmRleDtcbn1cblxuZnVuY3Rpb24gYXNzZXJ0VmFsaWREaXJlY3RpdmVJbmRleChjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgZGlyZWN0aXZlSW5kZXg6IG51bWJlcikge1xuICBjb25zdCBkaXJzID0gY29udGV4dFtTdHlsaW5nSW5kZXguRGlyZWN0aXZlUmVnaXN0cnlQb3NpdGlvbl07XG4gIGNvbnN0IGluZGV4ID0gZGlyZWN0aXZlSW5kZXggKiBEaXJlY3RpdmVSZWdpc3RyeVZhbHVlc0luZGV4LlNpemU7XG4gIGlmIChpbmRleCA+PSBkaXJzLmxlbmd0aCB8fFxuICAgICAgZGlyc1tpbmRleCArIERpcmVjdGl2ZVJlZ2lzdHJ5VmFsdWVzSW5kZXguU2luZ2xlUHJvcFZhbHVlc0luZGV4T2Zmc2V0XSA9PT0gLTEpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1RoZSBwcm92aWRlZCBkaXJlY3RpdmUgaXMgbm90IHJlZ2lzdGVyZWQgd2l0aCB0aGUgc3R5bGluZyBjb250ZXh0Jyk7XG4gIH1cbn1cbiJdfQ==