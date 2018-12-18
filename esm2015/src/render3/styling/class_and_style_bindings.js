/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingReturn,uselessCode} checked by tsc
 */
import { RendererStyleFlags3, isProceduralRenderer } from '../interfaces/renderer';
import { NO_CHANGE } from '../tokens';
import { getRootContext } from '../util';
import { BoundPlayerFactory } from './player_factory';
import { addPlayerInternal, allocPlayerContext, createEmptyStylingContext, getPlayerContext } from './util';
/** @type {?} */
const EMPTY_ARR = [];
/** @type {?} */
const EMPTY_OBJ = {};
/**
 * Creates a styling context template where styling information is stored.
 * Any styles that are later referenced using `updateStyleProp` must be
 * passed in within this function. Initial values for those styles are to
 * be declared after all initial style properties are declared (this change in
 * mode between declarations and initial styles is made possible using a special
 * enum value found in `definition.ts`).
 *
 * @param {?=} initialClassDeclarations a list of class declarations and initial class values
 *    that are used later within the styling context.
 *
 *    -> ['foo', 'bar', SPECIAL_ENUM_VAL, 'foo', true]
 *       This implies that `foo` and `bar` will be later styled and that the `foo`
 *       class will be applied to the element as an initial class since it's true
 * @param {?=} initialStyleDeclarations a list of style declarations and initial style values
 *    that are used later within the styling context.
 *
 *    -> ['width', 'height', SPECIAL_ENUM_VAL, 'width', '100px']
 *       This implies that `width` and `height` will be later styled and that the `width`
 *       property has an initial value of `100px`.
 *
 * @param {?=} styleSanitizer
 * @param {?=} onlyProcessSingleClasses
 * @return {?}
 */
export function createStylingContextTemplate(initialClassDeclarations, initialStyleDeclarations, styleSanitizer, onlyProcessSingleClasses) {
    /** @type {?} */
    const initialStylingValues = [null];
    /** @type {?} */
    const context = createEmptyStylingContext(null, styleSanitizer, initialStylingValues);
    // we use two maps since a class name might collide with a CSS style prop
    /** @type {?} */
    const stylesLookup = {};
    /** @type {?} */
    const classesLookup = {};
    /** @type {?} */
    let totalStyleDeclarations = 0;
    if (initialStyleDeclarations) {
        /** @type {?} */
        let hasPassedDeclarations = false;
        for (let i = 0; i < initialStyleDeclarations.length; i++) {
            /** @type {?} */
            const v = (/** @type {?} */ (initialStyleDeclarations[i]));
            // this flag value marks where the declarations end the initial values begin
            if (v === 1 /* VALUES_MODE */) {
                hasPassedDeclarations = true;
            }
            else {
                /** @type {?} */
                const prop = (/** @type {?} */ (v));
                if (hasPassedDeclarations) {
                    /** @type {?} */
                    const value = (/** @type {?} */ (initialStyleDeclarations[++i]));
                    initialStylingValues.push(value);
                    stylesLookup[prop] = initialStylingValues.length - 1;
                }
                else {
                    totalStyleDeclarations++;
                    stylesLookup[prop] = 0;
                }
            }
        }
    }
    // make where the class offsets begin
    context[4 /* ClassOffsetPosition */] = totalStyleDeclarations;
    /** @type {?} */
    const initialStaticClasses = onlyProcessSingleClasses ? [] : null;
    if (initialClassDeclarations) {
        /** @type {?} */
        let hasPassedDeclarations = false;
        for (let i = 0; i < initialClassDeclarations.length; i++) {
            /** @type {?} */
            const v = (/** @type {?} */ (initialClassDeclarations[i]));
            // this flag value marks where the declarations end the initial values begin
            if (v === 1 /* VALUES_MODE */) {
                hasPassedDeclarations = true;
            }
            else {
                /** @type {?} */
                const className = (/** @type {?} */ (v));
                if (hasPassedDeclarations) {
                    /** @type {?} */
                    const value = (/** @type {?} */ (initialClassDeclarations[++i]));
                    initialStylingValues.push(value);
                    classesLookup[className] = initialStylingValues.length - 1;
                    initialStaticClasses && initialStaticClasses.push(className);
                }
                else {
                    classesLookup[className] = 0;
                }
            }
        }
    }
    /** @type {?} */
    const styleProps = Object.keys(stylesLookup);
    /** @type {?} */
    const classNames = Object.keys(classesLookup);
    /** @type {?} */
    const classNamesIndexStart = styleProps.length;
    /** @type {?} */
    const totalProps = styleProps.length + classNames.length;
    // *2 because we are filling for both single and multi style spaces
    /** @type {?} */
    const maxLength = totalProps * 4 /* Size */ * 2 + 8 /* SingleStylesStartPosition */;
    // we need to fill the array from the start so that we can access
    // both the multi and the single array positions in the same loop block
    for (let i = 8 /* SingleStylesStartPosition */; i < maxLength; i++) {
        context.push(null);
    }
    /** @type {?} */
    const singleStart = 8 /* SingleStylesStartPosition */;
    /** @type {?} */
    const multiStart = totalProps * 4 /* Size */ + 8 /* SingleStylesStartPosition */;
    // fill single and multi-level styles
    for (let i = 0; i < totalProps; i++) {
        /** @type {?} */
        const isClassBased = i >= classNamesIndexStart;
        /** @type {?} */
        const prop = isClassBased ? classNames[i - classNamesIndexStart] : styleProps[i];
        /** @type {?} */
        const indexForInitial = isClassBased ? classesLookup[prop] : stylesLookup[prop];
        /** @type {?} */
        const initialValue = initialStylingValues[indexForInitial];
        /** @type {?} */
        const indexForMulti = i * 4 /* Size */ + multiStart;
        /** @type {?} */
        const indexForSingle = i * 4 /* Size */ + singleStart;
        /** @type {?} */
        const initialFlag = prepareInitialFlag(prop, isClassBased, styleSanitizer || null);
        setFlag(context, indexForSingle, pointers(initialFlag, indexForInitial, indexForMulti));
        setProp(context, indexForSingle, prop);
        setValue(context, indexForSingle, null);
        setPlayerBuilderIndex(context, indexForSingle, 0);
        /** @type {?} */
        const flagForMulti = initialFlag | (initialValue !== null ? 1 /* Dirty */ : 0 /* None */);
        setFlag(context, indexForMulti, pointers(flagForMulti, indexForInitial, indexForSingle));
        setProp(context, indexForMulti, prop);
        setValue(context, indexForMulti, null);
        setPlayerBuilderIndex(context, indexForMulti, 0);
    }
    // there is no initial value flag for the master index since it doesn't
    // reference an initial style value
    /** @type {?} */
    const masterFlag = pointers(0, 0, multiStart) |
        (onlyProcessSingleClasses ? 16 /* OnlyProcessSingleClasses */ : 0);
    setFlag(context, 3 /* MasterFlagPosition */, masterFlag);
    setContextDirty(context, initialStylingValues.length > 1);
    if (initialStaticClasses) {
        context[6 /* PreviousOrCachedMultiClassValue */] = initialStaticClasses.join(' ');
    }
    return context;
}
/**
 * Sets and resolves all `multi` styling on an `StylingContext` so that they can be
 * applied to the element once `renderStyleAndClassBindings` is called.
 *
 * All missing styles/class (any values that are not provided in the new `styles`
 * or `classes` params) will resolve to `null` within their respective positions
 * in the context.
 *
 * @param {?} context The styling context that will be updated with the
 *    newly provided style values.
 * @param {?} classesInput The key/value map of CSS class names that will be used for the update.
 * @param {?=} stylesInput The key/value map of CSS styles that will be used for the update.
 * @return {?}
 */
export function updateStylingMap(context, classesInput, stylesInput) {
    stylesInput = stylesInput || null;
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
    // early exit (this is what's done to avoid using ctx.bind() to cache the value)
    /** @type {?} */
    const ignoreAllClassUpdates = limitToSingleClasses(context) || classesValue === NO_CHANGE ||
        classesValue === context[6 /* PreviousOrCachedMultiClassValue */];
    /** @type {?} */
    const ignoreAllStyleUpdates = stylesValue === NO_CHANGE || stylesValue === context[7 /* PreviousMultiStyleValue */];
    if (ignoreAllClassUpdates && ignoreAllStyleUpdates)
        return;
    context[6 /* PreviousOrCachedMultiClassValue */] = classesValue;
    context[7 /* PreviousMultiStyleValue */] = stylesValue;
    /** @type {?} */
    let classNames = EMPTY_ARR;
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
            classNames = classesValue ? Object.keys(classesValue) : EMPTY_ARR;
        }
    }
    /** @type {?} */
    const classes = (/** @type {?} */ ((classesValue || EMPTY_OBJ)));
    /** @type {?} */
    const styleProps = stylesValue ? Object.keys(stylesValue) : EMPTY_ARR;
    /** @type {?} */
    const styles = stylesValue || EMPTY_OBJ;
    /** @type {?} */
    const classesStartIndex = styleProps.length;
    /** @type {?} */
    const multiStartIndex = getMultiStartIndex(context);
    /** @type {?} */
    let dirty = false;
    /** @type {?} */
    let ctxIndex = multiStartIndex;
    /** @type {?} */
    let propIndex = 0;
    /** @type {?} */
    const propLimit = styleProps.length + classNames.length;
    // the main loop here will try and figure out how the shape of the provided
    // styles differ with respect to the context. Later if the context/styles/classes
    // are off-balance then they will be dealt in another loop after this one
    while (ctxIndex < context.length && propIndex < propLimit) {
        /** @type {?} */
        const isClassBased = propIndex >= classesStartIndex;
        /** @type {?} */
        const processValue = (!isClassBased && !ignoreAllStyleUpdates) || (isClassBased && !ignoreAllClassUpdates);
        // when there is a cache-hit for a string-based class then we should
        // avoid doing any work diffing any of the changes
        if (processValue) {
            /** @type {?} */
            const adjustedPropIndex = isClassBased ? propIndex - classesStartIndex : propIndex;
            /** @type {?} */
            const newProp = isClassBased ? classNames[adjustedPropIndex] : styleProps[adjustedPropIndex];
            /** @type {?} */
            const newValue = isClassBased ? (applyAllClasses ? true : classes[newProp]) : styles[newProp];
            /** @type {?} */
            const playerBuilderIndex = isClassBased ? classesPlayerBuilderIndex : stylesPlayerBuilderIndex;
            /** @type {?} */
            const prop = getProp(context, ctxIndex);
            if (prop === newProp) {
                /** @type {?} */
                const value = getValue(context, ctxIndex);
                /** @type {?} */
                const flag = getPointers(context, ctxIndex);
                setPlayerBuilderIndex(context, ctxIndex, playerBuilderIndex);
                if (hasValueChanged(flag, value, newValue)) {
                    setValue(context, ctxIndex, newValue);
                    playerBuildersAreDirty = playerBuildersAreDirty || !!playerBuilderIndex;
                    /** @type {?} */
                    const initialValue = getInitialValue(context, flag);
                    // there is no point in setting this to dirty if the previously
                    // rendered value was being referenced by the initial style (or null)
                    if (hasValueChanged(flag, initialValue, newValue)) {
                        setDirty(context, ctxIndex, true);
                        dirty = true;
                    }
                }
            }
            else {
                /** @type {?} */
                const indexOfEntry = findEntryPositionByProp(context, newProp, ctxIndex);
                if (indexOfEntry > 0) {
                    // it was found at a later point ... just swap the values
                    /** @type {?} */
                    const valueToCompare = getValue(context, indexOfEntry);
                    /** @type {?} */
                    const flagToCompare = getPointers(context, indexOfEntry);
                    swapMultiContextEntries(context, ctxIndex, indexOfEntry);
                    if (hasValueChanged(flagToCompare, valueToCompare, newValue)) {
                        /** @type {?} */
                        const initialValue = getInitialValue(context, flagToCompare);
                        setValue(context, ctxIndex, newValue);
                        if (hasValueChanged(flagToCompare, initialValue, newValue)) {
                            setDirty(context, ctxIndex, true);
                            playerBuildersAreDirty = playerBuildersAreDirty || !!playerBuilderIndex;
                            dirty = true;
                        }
                    }
                }
                else {
                    // we only care to do this if the insertion is in the middle
                    /** @type {?} */
                    const newFlag = prepareInitialFlag(newProp, isClassBased, getStyleSanitizer(context));
                    playerBuildersAreDirty = playerBuildersAreDirty || !!playerBuilderIndex;
                    insertNewMultiProperty(context, ctxIndex, isClassBased, newProp, newFlag, newValue, playerBuilderIndex);
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
        /** @type {?} */
        const flag = getPointers(context, ctxIndex);
        /** @type {?} */
        const isClassBased = (flag & 2 /* Class */) === 2 /* Class */;
        /** @type {?} */
        const processValue = (!isClassBased && !ignoreAllStyleUpdates) || (isClassBased && !ignoreAllClassUpdates);
        if (processValue) {
            /** @type {?} */
            const value = getValue(context, ctxIndex);
            /** @type {?} */
            const doRemoveValue = valueExists(value, isClassBased);
            if (doRemoveValue) {
                setDirty(context, ctxIndex, true);
                setValue(context, ctxIndex, null);
                // we keep the player factory the same so that the `nulled` value can
                // be instructed into the player because removing a style and/or a class
                // is a valid animation player instruction.
                /** @type {?} */
                const playerBuilderIndex = isClassBased ? classesPlayerBuilderIndex : stylesPlayerBuilderIndex;
                setPlayerBuilderIndex(context, ctxIndex, playerBuilderIndex);
                dirty = true;
            }
        }
        ctxIndex += 4 /* Size */;
    }
    // this means that there are left-over properties in the context that
    // were not detected in the context during the loop above. In that
    // case we want to add the new entries into the list
    /** @type {?} */
    const sanitizer = getStyleSanitizer(context);
    while (propIndex < propLimit) {
        /** @type {?} */
        const isClassBased = propIndex >= classesStartIndex;
        /** @type {?} */
        const processValue = (!isClassBased && !ignoreAllStyleUpdates) || (isClassBased && !ignoreAllClassUpdates);
        if (processValue) {
            /** @type {?} */
            const adjustedPropIndex = isClassBased ? propIndex - classesStartIndex : propIndex;
            /** @type {?} */
            const prop = isClassBased ? classNames[adjustedPropIndex] : styleProps[adjustedPropIndex];
            /** @type {?} */
            const value = isClassBased ? (applyAllClasses ? true : classes[prop]) : styles[prop];
            /** @type {?} */
            const flag = prepareInitialFlag(prop, isClassBased, sanitizer) | 1 /* Dirty */;
            /** @type {?} */
            const playerBuilderIndex = isClassBased ? classesPlayerBuilderIndex : stylesPlayerBuilderIndex;
            context.push(flag, prop, value, playerBuilderIndex);
            dirty = true;
        }
        propIndex++;
    }
    if (dirty) {
        setContextDirty(context, true);
    }
    if (playerBuildersAreDirty) {
        setContextPlayersDirty(context, true);
    }
}
/**
 * Sets and resolves a single styling property/value on the provided `StylingContext` so
 * that they can be applied to the element once `renderStyleAndClassBindings` is called.
 *
 * Note that prop-level styling values are considered higher priority than any styling that
 * has been applied using `updateStylingMap`, therefore, when styling values are rendered
 * then any styles/classes that have been applied using this function will be considered first
 * (then multi values second and then initial values as a backup).
 *
 * @param {?} context The styling context that will be updated with the
 *    newly provided style value.
 * @param {?} index The index of the property which is being updated.
 * @param {?} input
 * @return {?}
 */
export function updateStyleProp(context, index, input) {
    /** @type {?} */
    const singleIndex = 8 /* SingleStylesStartPosition */ + index * 4 /* Size */;
    /** @type {?} */
    const currValue = getValue(context, singleIndex);
    /** @type {?} */
    const currFlag = getPointers(context, singleIndex);
    /** @type {?} */
    const value = (input instanceof BoundPlayerFactory) ? input.value : input;
    // didn't change ... nothing to make a note of
    if (hasValueChanged(currFlag, currValue, value)) {
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
            setPlayerBuilderIndex(context, singleIndex, playerBuilderIndex);
            playerBuildersAreDirty = true;
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
 * This method will toggle the referenced CSS class (by the provided index)
 * within the given context.
 *
 * @param {?} context The styling context that will be updated with the
 *    newly provided class value.
 * @param {?} index The index of the CSS class which is being updated.
 * @param {?} addOrRemove Whether or not to add or remove the CSS class
 * @return {?}
 */
export function updateClassProp(context, index, addOrRemove) {
    /** @type {?} */
    const adjustedIndex = index + context[4 /* ClassOffsetPosition */];
    updateStyleProp(context, adjustedIndex, addOrRemove);
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
 * @return {?} number the total amount of players that got queued for animation (if any)
 */
export function renderStyleAndClassBindings(context, renderer, rootOrView, isFirstRender, classesStore, stylesStore) {
    /** @type {?} */
    let totalPlayersQueued = 0;
    if (isContextDirty(context)) {
        /** @type {?} */
        const flushPlayerBuilders = context[3 /* MasterFlagPosition */] & 8 /* PlayerBuildersDirty */;
        /** @type {?} */
        const native = (/** @type {?} */ (context[5 /* ElementPosition */]));
        /** @type {?} */
        const multiStartIndex = getMultiStartIndex(context);
        /** @type {?} */
        const styleSanitizer = getStyleSanitizer(context);
        /** @type {?} */
        const onlySingleClasses = limitToSingleClasses(context);
        for (let i = 8 /* SingleStylesStartPosition */; i < context.length; i += 4 /* Size */) {
            // there is no point in rendering styles that have not changed on screen
            if (isDirty(context, i)) {
                /** @type {?} */
                const prop = getProp(context, i);
                /** @type {?} */
                const value = getValue(context, i);
                /** @type {?} */
                const flag = getPointers(context, i);
                /** @type {?} */
                const playerBuilder = getPlayerBuilder(context, i);
                /** @type {?} */
                const isClassBased = flag & 2 /* Class */ ? true : false;
                /** @type {?} */
                const isInSingleRegion = i < multiStartIndex;
                /** @type {?} */
                const readInitialValue = !isClassBased || !onlySingleClasses;
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
                if (!valueExists(valueToApply, isClassBased) && readInitialValue) {
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
                        /** @type {?} */
                        const sanitizer = (flag & 4 /* Sanitize */) ? styleSanitizer : null;
                        setStyle(native, prop, (/** @type {?} */ (valueToApply)), renderer, sanitizer, stylesStore, playerBuilder);
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
    return totalPlayersQueued;
}
/**
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
/**
 * @param {?} context
 * @param {?} index
 * @param {?} isDirtyYes
 * @return {?}
 */
function setDirty(context, index, isDirtyYes) {
    /** @type {?} */
    const adjustedIndex = index >= 8 /* SingleStylesStartPosition */ ? (index + 0 /* FlagsOffset */) : index;
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
    const adjustedIndex = index >= 8 /* SingleStylesStartPosition */ ? (index + 0 /* FlagsOffset */) : index;
    return (((/** @type {?} */ (context[adjustedIndex]))) & 1 /* Dirty */) == 1 /* Dirty */;
}
/**
 * @param {?} context
 * @param {?} index
 * @return {?}
 */
export function isClassBased(context, index) {
    /** @type {?} */
    const adjustedIndex = index >= 8 /* SingleStylesStartPosition */ ? (index + 0 /* FlagsOffset */) : index;
    return (((/** @type {?} */ (context[adjustedIndex]))) & 2 /* Class */) == 2 /* Class */;
}
/**
 * @param {?} context
 * @param {?} index
 * @return {?}
 */
function isSanitizable(context, index) {
    /** @type {?} */
    const adjustedIndex = index >= 8 /* SingleStylesStartPosition */ ? (index + 0 /* FlagsOffset */) : index;
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
    return (/** @type {?} */ (context[2 /* InitialStylesPosition */][index]));
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
    return index >= 8 /* SingleStylesStartPosition */ ? index : -1;
}
/**
 * @param {?} context
 * @return {?}
 */
function getMultiStartIndex(context) {
    return (/** @type {?} */ (getMultiOrSingleIndex(context[3 /* MasterFlagPosition */])));
}
/**
 * @param {?} context
 * @return {?}
 */
function getStyleSanitizer(context) {
    return context[1 /* StyleSanitizerPosition */];
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
    const playerContext = (/** @type {?} */ (context[0 /* PlayerContext */]));
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
    let playerContext = context[0 /* PlayerContext */] || allocPlayerContext(context);
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
 * @param {?} context
 * @param {?} index
 * @param {?} playerBuilderIndex
 * @return {?}
 */
function setPlayerBuilderIndex(context, index, playerBuilderIndex) {
    context[index + 3 /* PlayerBuilderIndexOffset */] = playerBuilderIndex;
}
/**
 * @param {?} context
 * @param {?} index
 * @return {?}
 */
function getPlayerBuilderIndex(context, index) {
    return ((/** @type {?} */ (context[index + 3 /* PlayerBuilderIndexOffset */]))) || 0;
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
        const playerContext = context[0 /* PlayerContext */];
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
    const adjustedIndex = index === 3 /* MasterFlagPosition */ ? index : (index + 0 /* FlagsOffset */);
    context[adjustedIndex] = flag;
}
/**
 * @param {?} context
 * @param {?} index
 * @return {?}
 */
function getPointers(context, index) {
    /** @type {?} */
    const adjustedIndex = index === 3 /* MasterFlagPosition */ ? index : (index + 0 /* FlagsOffset */);
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
    return isDirty(context, 3 /* MasterFlagPosition */);
}
/**
 * @param {?} context
 * @return {?}
 */
export function limitToSingleClasses(context) {
    return context[3 /* MasterFlagPosition */] & 16 /* OnlyProcessSingleClasses */;
}
/**
 * @param {?} context
 * @param {?} isDirtyYes
 * @return {?}
 */
export function setContextDirty(context, isDirtyYes) {
    setDirty(context, 3 /* MasterFlagPosition */, isDirtyYes);
}
/**
 * @param {?} context
 * @param {?} isDirtyYes
 * @return {?}
 */
export function setContextPlayersDirty(context, isDirtyYes) {
    if (isDirtyYes) {
        ((/** @type {?} */ (context[3 /* MasterFlagPosition */]))) |= 8 /* PlayerBuildersDirty */;
    }
    else {
        ((/** @type {?} */ (context[3 /* MasterFlagPosition */]))) &= ~8 /* PlayerBuildersDirty */;
    }
}
/**
 * @param {?} context
 * @param {?} prop
 * @param {?=} startIndex
 * @return {?}
 */
function findEntryPositionByProp(context, prop, startIndex) {
    for (let i = (startIndex || 0) + 1 /* PropertyOffset */; i < context.length; i += 4 /* Size */) {
        /** @type {?} */
        const thisProp = context[i];
        if (thisProp == prop) {
            return i - 1 /* PropertyOffset */;
        }
    }
    return -1;
}
/**
 * @param {?} context
 * @param {?} indexA
 * @param {?} indexB
 * @return {?}
 */
function swapMultiContextEntries(context, indexA, indexB) {
    /** @type {?} */
    const tmpValue = getValue(context, indexA);
    /** @type {?} */
    const tmpProp = getProp(context, indexA);
    /** @type {?} */
    const tmpFlag = getPointers(context, indexA);
    /** @type {?} */
    const tmpPlayerBuilderIndex = getPlayerBuilderIndex(context, indexA);
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
    setPlayerBuilderIndex(context, indexA, getPlayerBuilderIndex(context, indexB));
    setValue(context, indexB, tmpValue);
    setProp(context, indexB, tmpProp);
    setFlag(context, indexB, tmpFlag);
    setPlayerBuilderIndex(context, indexB, tmpPlayerBuilderIndex);
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
                (isClassBased(context, singleIndex) ? 2 /* Class */ : 0 /* None */) |
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
 * @param {?} playerIndex
 * @return {?}
 */
function insertNewMultiProperty(context, index, classBased, name, flag, value, playerIndex) {
    /** @type {?} */
    const doShift = index < context.length;
    // prop does not exist in the list, add it in
    context.splice(index, 0, flag | 1 /* Dirty */ | (classBased ? 2 /* Class */ : 0 /* None */), name, value, playerIndex);
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
    if (isClassBased) {
        return value ? true : false;
    }
    return value !== null;
}
/**
 * @param {?} name
 * @param {?} isClassBased
 * @param {?=} sanitizer
 * @return {?}
 */
function prepareInitialFlag(name, isClassBased, sanitizer) {
    if (isClassBased) {
        return 2 /* Class */;
    }
    else if (sanitizer && sanitizer(name)) {
        return 4 /* Sanitize */;
    }
    return 0 /* None */;
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
    /** @type {?} */
    ClassAndStylePlayerBuilder.prototype._values;
    /** @type {?} */
    ClassAndStylePlayerBuilder.prototype._dirty;
    /** @type {?} */
    ClassAndStylePlayerBuilder.prototype._factory;
    /** @type {?} */
    ClassAndStylePlayerBuilder.prototype._element;
    /** @type {?} */
    ClassAndStylePlayerBuilder.prototype._type;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xhc3NfYW5kX3N0eWxlX2JpbmRpbmdzLmpzIiwic291cmNlUm9vdCI6Ii4uLy4uLyIsInNvdXJjZXMiOlsicGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9zdHlsaW5nL2NsYXNzX2FuZF9zdHlsZV9iaW5kaW5ncy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7O0FBVUEsT0FBTyxFQUFZLG1CQUFtQixFQUFFLG9CQUFvQixFQUFDLE1BQU0sd0JBQXdCLENBQUM7QUFHNUYsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLFdBQVcsQ0FBQztBQUNwQyxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sU0FBUyxDQUFDO0FBRXZDLE9BQU8sRUFBQyxrQkFBa0IsRUFBQyxNQUFNLGtCQUFrQixDQUFDO0FBQ3BELE9BQU8sRUFBQyxpQkFBaUIsRUFBRSxrQkFBa0IsRUFBRSx5QkFBeUIsRUFBRSxnQkFBZ0IsRUFBQyxNQUFNLFFBQVEsQ0FBQzs7TUFFcEcsU0FBUyxHQUFVLEVBQUU7O01BQ3JCLFNBQVMsR0FBeUIsRUFBRTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUF5QjFDLE1BQU0sVUFBVSw0QkFBNEIsQ0FDeEMsd0JBQTRFLEVBQzVFLHdCQUE0RSxFQUM1RSxjQUF1QyxFQUFFLHdCQUFrQzs7VUFDdkUsb0JBQW9CLEdBQWtCLENBQUMsSUFBSSxDQUFDOztVQUM1QyxPQUFPLEdBQ1QseUJBQXlCLENBQUMsSUFBSSxFQUFFLGNBQWMsRUFBRSxvQkFBb0IsQ0FBQzs7O1VBR25FLFlBQVksR0FBNEIsRUFBRTs7VUFDMUMsYUFBYSxHQUE0QixFQUFFOztRQUU3QyxzQkFBc0IsR0FBRyxDQUFDO0lBQzlCLElBQUksd0JBQXdCLEVBQUU7O1lBQ3hCLHFCQUFxQixHQUFHLEtBQUs7UUFDakMsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLHdCQUF3QixDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTs7a0JBQ2xELENBQUMsR0FBRyxtQkFB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SSxDQUFDLE1BQU0sRUFBRTs7a0JBQ1QsTUFBTSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUMzQixJQUFJLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxLQUFLLEVBQUUsbUJBQUEsSUFBSSxDQUFDLE9BQU8sRUFBRSxFQUFFLGFBQWEsRUFBRSxhQUFhLElBQUksSUFBSSxDQUFDO1lBQ3BGLElBQUksQ0FBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO1lBQ2xCLElBQUksQ0FBQyxNQUFNLEdBQUcsS0FBSyxDQUFDO1lBQ3BCLE9BQU8sTUFBTSxDQUFDO1NBQ2Y7UUFFRCxPQUFPLFNBQVMsQ0FBQztJQUNuQixDQUFDO0NBQ0Y7OztJQTdCQyw2Q0FBcUQ7O0lBQ3JELDRDQUF1Qjs7SUFDdkIsOENBQXdDOztJQUVKLDhDQUE2Qjs7SUFBRSwyQ0FBMEIiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5pbXBvcnQge1N0eWxlU2FuaXRpemVGbn0gZnJvbSAnLi4vLi4vc2FuaXRpemF0aW9uL3N0eWxlX3Nhbml0aXplcic7XG5pbXBvcnQge0luaXRpYWxTdHlsaW5nRmxhZ3N9IGZyb20gJy4uL2ludGVyZmFjZXMvZGVmaW5pdGlvbic7XG5pbXBvcnQge0JpbmRpbmdTdG9yZSwgQmluZGluZ1R5cGUsIFBsYXllciwgUGxheWVyQnVpbGRlciwgUGxheWVyRmFjdG9yeSwgUGxheWVySW5kZXh9IGZyb20gJy4uL2ludGVyZmFjZXMvcGxheWVyJztcbmltcG9ydCB7UmVuZGVyZXIzLCBSZW5kZXJlclN0eWxlRmxhZ3MzLCBpc1Byb2NlZHVyYWxSZW5kZXJlcn0gZnJvbSAnLi4vaW50ZXJmYWNlcy9yZW5kZXJlcic7XG5pbXBvcnQge0luaXRpYWxTdHlsZXMsIFN0eWxpbmdDb250ZXh0LCBTdHlsaW5nRmxhZ3MsIFN0eWxpbmdJbmRleH0gZnJvbSAnLi4vaW50ZXJmYWNlcy9zdHlsaW5nJztcbmltcG9ydCB7TFZpZXcsIFJvb3RDb250ZXh0fSBmcm9tICcuLi9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHtOT19DSEFOR0V9IGZyb20gJy4uL3Rva2Vucyc7XG5pbXBvcnQge2dldFJvb3RDb250ZXh0fSBmcm9tICcuLi91dGlsJztcblxuaW1wb3J0IHtCb3VuZFBsYXllckZhY3Rvcnl9IGZyb20gJy4vcGxheWVyX2ZhY3RvcnknO1xuaW1wb3J0IHthZGRQbGF5ZXJJbnRlcm5hbCwgYWxsb2NQbGF5ZXJDb250ZXh0LCBjcmVhdGVFbXB0eVN0eWxpbmdDb250ZXh0LCBnZXRQbGF5ZXJDb250ZXh0fSBmcm9tICcuL3V0aWwnO1xuXG5jb25zdCBFTVBUWV9BUlI6IGFueVtdID0gW107XG5jb25zdCBFTVBUWV9PQko6IHtba2V5OiBzdHJpbmddOiBhbnl9ID0ge307XG5cblxuLyoqXG4gKiBDcmVhdGVzIGEgc3R5bGluZyBjb250ZXh0IHRlbXBsYXRlIHdoZXJlIHN0eWxpbmcgaW5mb3JtYXRpb24gaXMgc3RvcmVkLlxuICogQW55IHN0eWxlcyB0aGF0IGFyZSBsYXRlciByZWZlcmVuY2VkIHVzaW5nIGB1cGRhdGVTdHlsZVByb3BgIG11c3QgYmVcbiAqIHBhc3NlZCBpbiB3aXRoaW4gdGhpcyBmdW5jdGlvbi4gSW5pdGlhbCB2YWx1ZXMgZm9yIHRob3NlIHN0eWxlcyBhcmUgdG9cbiAqIGJlIGRlY2xhcmVkIGFmdGVyIGFsbCBpbml0aWFsIHN0eWxlIHByb3BlcnRpZXMgYXJlIGRlY2xhcmVkICh0aGlzIGNoYW5nZSBpblxuICogbW9kZSBiZXR3ZWVuIGRlY2xhcmF0aW9ucyBhbmQgaW5pdGlhbCBzdHlsZXMgaXMgbWFkZSBwb3NzaWJsZSB1c2luZyBhIHNwZWNpYWxcbiAqIGVudW0gdmFsdWUgZm91bmQgaW4gYGRlZmluaXRpb24udHNgKS5cbiAqXG4gKiBAcGFyYW0gaW5pdGlhbFN0eWxlRGVjbGFyYXRpb25zIGEgbGlzdCBvZiBzdHlsZSBkZWNsYXJhdGlvbnMgYW5kIGluaXRpYWwgc3R5bGUgdmFsdWVzXG4gKiAgICB0aGF0IGFyZSB1c2VkIGxhdGVyIHdpdGhpbiB0aGUgc3R5bGluZyBjb250ZXh0LlxuICpcbiAqICAgIC0+IFsnd2lkdGgnLCAnaGVpZ2h0JywgU1BFQ0lBTF9FTlVNX1ZBTCwgJ3dpZHRoJywgJzEwMHB4J11cbiAqICAgICAgIFRoaXMgaW1wbGllcyB0aGF0IGB3aWR0aGAgYW5kIGBoZWlnaHRgIHdpbGwgYmUgbGF0ZXIgc3R5bGVkIGFuZCB0aGF0IHRoZSBgd2lkdGhgXG4gKiAgICAgICBwcm9wZXJ0eSBoYXMgYW4gaW5pdGlhbCB2YWx1ZSBvZiBgMTAwcHhgLlxuICpcbiAqIEBwYXJhbSBpbml0aWFsQ2xhc3NEZWNsYXJhdGlvbnMgYSBsaXN0IG9mIGNsYXNzIGRlY2xhcmF0aW9ucyBhbmQgaW5pdGlhbCBjbGFzcyB2YWx1ZXNcbiAqICAgIHRoYXQgYXJlIHVzZWQgbGF0ZXIgd2l0aGluIHRoZSBzdHlsaW5nIGNvbnRleHQuXG4gKlxuICogICAgLT4gWydmb28nLCAnYmFyJywgU1BFQ0lBTF9FTlVNX1ZBTCwgJ2ZvbycsIHRydWVdXG4gKiAgICAgICBUaGlzIGltcGxpZXMgdGhhdCBgZm9vYCBhbmQgYGJhcmAgd2lsbCBiZSBsYXRlciBzdHlsZWQgYW5kIHRoYXQgdGhlIGBmb29gXG4gKiAgICAgICBjbGFzcyB3aWxsIGJlIGFwcGxpZWQgdG8gdGhlIGVsZW1lbnQgYXMgYW4gaW5pdGlhbCBjbGFzcyBzaW5jZSBpdCdzIHRydWVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVN0eWxpbmdDb250ZXh0VGVtcGxhdGUoXG4gICAgaW5pdGlhbENsYXNzRGVjbGFyYXRpb25zPzogKHN0cmluZyB8IGJvb2xlYW4gfCBJbml0aWFsU3R5bGluZ0ZsYWdzKVtdIHwgbnVsbCxcbiAgICBpbml0aWFsU3R5bGVEZWNsYXJhdGlvbnM/OiAoc3RyaW5nIHwgYm9vbGVhbiB8IEluaXRpYWxTdHlsaW5nRmxhZ3MpW10gfCBudWxsLFxuICAgIHN0eWxlU2FuaXRpemVyPzogU3R5bGVTYW5pdGl6ZUZuIHwgbnVsbCwgb25seVByb2Nlc3NTaW5nbGVDbGFzc2VzPzogYm9vbGVhbik6IFN0eWxpbmdDb250ZXh0IHtcbiAgY29uc3QgaW5pdGlhbFN0eWxpbmdWYWx1ZXM6IEluaXRpYWxTdHlsZXMgPSBbbnVsbF07XG4gIGNvbnN0IGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0ID1cbiAgICAgIGNyZWF0ZUVtcHR5U3R5bGluZ0NvbnRleHQobnVsbCwgc3R5bGVTYW5pdGl6ZXIsIGluaXRpYWxTdHlsaW5nVmFsdWVzKTtcblxuICAvLyB3ZSB1c2UgdHdvIG1hcHMgc2luY2UgYSBjbGFzcyBuYW1lIG1pZ2h0IGNvbGxpZGUgd2l0aCBhIENTUyBzdHlsZSBwcm9wXG4gIGNvbnN0IHN0eWxlc0xvb2t1cDoge1trZXk6IHN0cmluZ106IG51bWJlcn0gPSB7fTtcbiAgY29uc3QgY2xhc3Nlc0xvb2t1cDoge1trZXk6IHN0cmluZ106IG51bWJlcn0gPSB7fTtcblxuICBsZXQgdG90YWxTdHlsZURlY2xhcmF0aW9ucyA9IDA7XG4gIGlmIChpbml0aWFsU3R5bGVEZWNsYXJhdGlvbnMpIHtcbiAgICBsZXQgaGFzUGFzc2VkRGVjbGFyYXRpb25zID0gZmFsc2U7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBpbml0aWFsU3R5bGVEZWNsYXJhdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IHYgPSBpbml0aWFsU3R5bGVEZWNsYXJhdGlvbnNbaV0gYXMgc3RyaW5nIHwgSW5pdGlhbFN0eWxpbmdGbGFncztcblxuICAgICAgLy8gdGhpcyBmbGFnIHZhbHVlIG1hcmtzIHdoZXJlIHRoZSBkZWNsYXJhdGlvbnMgZW5kIHRoZSBpbml0aWFsIHZhbHVlcyBiZWdpblxuICAgICAgaWYgKHYgPT09IEluaXRpYWxTdHlsaW5nRmxhZ3MuVkFMVUVTX01PREUpIHtcbiAgICAgICAgaGFzUGFzc2VkRGVjbGFyYXRpb25zID0gdHJ1ZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IHByb3AgPSB2IGFzIHN0cmluZztcbiAgICAgICAgaWYgKGhhc1Bhc3NlZERlY2xhcmF0aW9ucykge1xuICAgICAgICAgIGNvbnN0IHZhbHVlID0gaW5pdGlhbFN0eWxlRGVjbGFyYXRpb25zWysraV0gYXMgc3RyaW5nO1xuICAgICAgICAgIGluaXRpYWxTdHlsaW5nVmFsdWVzLnB1c2godmFsdWUpO1xuICAgICAgICAgIHN0eWxlc0xvb2t1cFtwcm9wXSA9IGluaXRpYWxTdHlsaW5nVmFsdWVzLmxlbmd0aCAtIDE7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdG90YWxTdHlsZURlY2xhcmF0aW9ucysrO1xuICAgICAgICAgIHN0eWxlc0xvb2t1cFtwcm9wXSA9IDA7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvLyBtYWtlIHdoZXJlIHRoZSBjbGFzcyBvZmZzZXRzIGJlZ2luXG4gIGNvbnRleHRbU3R5bGluZ0luZGV4LkNsYXNzT2Zmc2V0UG9zaXRpb25dID0gdG90YWxTdHlsZURlY2xhcmF0aW9ucztcblxuICBjb25zdCBpbml0aWFsU3RhdGljQ2xhc3Nlczogc3RyaW5nW118bnVsbCA9IG9ubHlQcm9jZXNzU2luZ2xlQ2xhc3NlcyA/IFtdIDogbnVsbDtcbiAgaWYgKGluaXRpYWxDbGFzc0RlY2xhcmF0aW9ucykge1xuICAgIGxldCBoYXNQYXNzZWREZWNsYXJhdGlvbnMgPSBmYWxzZTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGluaXRpYWxDbGFzc0RlY2xhcmF0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgdiA9IGluaXRpYWxDbGFzc0RlY2xhcmF0aW9uc1tpXSBhcyBzdHJpbmcgfCBib29sZWFuIHwgSW5pdGlhbFN0eWxpbmdGbGFncztcbiAgICAgIC8vIHRoaXMgZmxhZyB2YWx1ZSBtYXJrcyB3aGVyZSB0aGUgZGVjbGFyYXRpb25zIGVuZCB0aGUgaW5pdGlhbCB2YWx1ZXMgYmVnaW5cbiAgICAgIGlmICh2ID09PSBJbml0aWFsU3R5bGluZ0ZsYWdzLlZBTFVFU19NT0RFKSB7XG4gICAgICAgIGhhc1Bhc3NlZERlY2xhcmF0aW9ucyA9IHRydWU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCBjbGFzc05hbWUgPSB2IGFzIHN0cmluZztcbiAgICAgICAgaWYgKGhhc1Bhc3NlZERlY2xhcmF0aW9ucykge1xuICAgICAgICAgIGNvbnN0IHZhbHVlID0gaW5pdGlhbENsYXNzRGVjbGFyYXRpb25zWysraV0gYXMgYm9vbGVhbjtcbiAgICAgICAgICBpbml0aWFsU3R5bGluZ1ZhbHVlcy5wdXNoKHZhbHVlKTtcbiAgICAgICAgICBjbGFzc2VzTG9va3VwW2NsYXNzTmFtZV0gPSBpbml0aWFsU3R5bGluZ1ZhbHVlcy5sZW5ndGggLSAxO1xuICAgICAgICAgIGluaXRpYWxTdGF0aWNDbGFzc2VzICYmIGluaXRpYWxTdGF0aWNDbGFzc2VzLnB1c2goY2xhc3NOYW1lKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjbGFzc2VzTG9va3VwW2NsYXNzTmFtZV0gPSAwO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgY29uc3Qgc3R5bGVQcm9wcyA9IE9iamVjdC5rZXlzKHN0eWxlc0xvb2t1cCk7XG4gIGNvbnN0IGNsYXNzTmFtZXMgPSBPYmplY3Qua2V5cyhjbGFzc2VzTG9va3VwKTtcbiAgY29uc3QgY2xhc3NOYW1lc0luZGV4U3RhcnQgPSBzdHlsZVByb3BzLmxlbmd0aDtcbiAgY29uc3QgdG90YWxQcm9wcyA9IHN0eWxlUHJvcHMubGVuZ3RoICsgY2xhc3NOYW1lcy5sZW5ndGg7XG5cbiAgLy8gKjIgYmVjYXVzZSB3ZSBhcmUgZmlsbGluZyBmb3IgYm90aCBzaW5nbGUgYW5kIG11bHRpIHN0eWxlIHNwYWNlc1xuICBjb25zdCBtYXhMZW5ndGggPSB0b3RhbFByb3BzICogU3R5bGluZ0luZGV4LlNpemUgKiAyICsgU3R5bGluZ0luZGV4LlNpbmdsZVN0eWxlc1N0YXJ0UG9zaXRpb247XG5cbiAgLy8gd2UgbmVlZCB0byBmaWxsIHRoZSBhcnJheSBmcm9tIHRoZSBzdGFydCBzbyB0aGF0IHdlIGNhbiBhY2Nlc3NcbiAgLy8gYm90aCB0aGUgbXVsdGkgYW5kIHRoZSBzaW5nbGUgYXJyYXkgcG9zaXRpb25zIGluIHRoZSBzYW1lIGxvb3AgYmxvY2tcbiAgZm9yIChsZXQgaSA9IFN0eWxpbmdJbmRleC5TaW5nbGVTdHlsZXNTdGFydFBvc2l0aW9uOyBpIDwgbWF4TGVuZ3RoOyBpKyspIHtcbiAgICBjb250ZXh0LnB1c2gobnVsbCk7XG4gIH1cblxuICBjb25zdCBzaW5nbGVTdGFydCA9IFN0eWxpbmdJbmRleC5TaW5nbGVTdHlsZXNTdGFydFBvc2l0aW9uO1xuICBjb25zdCBtdWx0aVN0YXJ0ID0gdG90YWxQcm9wcyAqIFN0eWxpbmdJbmRleC5TaXplICsgU3R5bGluZ0luZGV4LlNpbmdsZVN0eWxlc1N0YXJ0UG9zaXRpb247XG5cbiAgLy8gZmlsbCBzaW5nbGUgYW5kIG11bHRpLWxldmVsIHN0eWxlc1xuICBmb3IgKGxldCBpID0gMDsgaSA8IHRvdGFsUHJvcHM7IGkrKykge1xuICAgIGNvbnN0IGlzQ2xhc3NCYXNlZCA9IGkgPj0gY2xhc3NOYW1lc0luZGV4U3RhcnQ7XG4gICAgY29uc3QgcHJvcCA9IGlzQ2xhc3NCYXNlZCA/IGNsYXNzTmFtZXNbaSAtIGNsYXNzTmFtZXNJbmRleFN0YXJ0XSA6IHN0eWxlUHJvcHNbaV07XG4gICAgY29uc3QgaW5kZXhGb3JJbml0aWFsID0gaXNDbGFzc0Jhc2VkID8gY2xhc3Nlc0xvb2t1cFtwcm9wXSA6IHN0eWxlc0xvb2t1cFtwcm9wXTtcbiAgICBjb25zdCBpbml0aWFsVmFsdWUgPSBpbml0aWFsU3R5bGluZ1ZhbHVlc1tpbmRleEZvckluaXRpYWxdO1xuXG4gICAgY29uc3QgaW5kZXhGb3JNdWx0aSA9IGkgKiBTdHlsaW5nSW5kZXguU2l6ZSArIG11bHRpU3RhcnQ7XG4gICAgY29uc3QgaW5kZXhGb3JTaW5nbGUgPSBpICogU3R5bGluZ0luZGV4LlNpemUgKyBzaW5nbGVTdGFydDtcbiAgICBjb25zdCBpbml0aWFsRmxhZyA9IHByZXBhcmVJbml0aWFsRmxhZyhwcm9wLCBpc0NsYXNzQmFzZWQsIHN0eWxlU2FuaXRpemVyIHx8IG51bGwpO1xuXG4gICAgc2V0RmxhZyhjb250ZXh0LCBpbmRleEZvclNpbmdsZSwgcG9pbnRlcnMoaW5pdGlhbEZsYWcsIGluZGV4Rm9ySW5pdGlhbCwgaW5kZXhGb3JNdWx0aSkpO1xuICAgIHNldFByb3AoY29udGV4dCwgaW5kZXhGb3JTaW5nbGUsIHByb3ApO1xuICAgIHNldFZhbHVlKGNvbnRleHQsIGluZGV4Rm9yU2luZ2xlLCBudWxsKTtcbiAgICBzZXRQbGF5ZXJCdWlsZGVySW5kZXgoY29udGV4dCwgaW5kZXhGb3JTaW5nbGUsIDApO1xuXG4gICAgY29uc3QgZmxhZ0Zvck11bHRpID1cbiAgICAgICAgaW5pdGlhbEZsYWcgfCAoaW5pdGlhbFZhbHVlICE9PSBudWxsID8gU3R5bGluZ0ZsYWdzLkRpcnR5IDogU3R5bGluZ0ZsYWdzLk5vbmUpO1xuICAgIHNldEZsYWcoY29udGV4dCwgaW5kZXhGb3JNdWx0aSwgcG9pbnRlcnMoZmxhZ0Zvck11bHRpLCBpbmRleEZvckluaXRpYWwsIGluZGV4Rm9yU2luZ2xlKSk7XG4gICAgc2V0UHJvcChjb250ZXh0LCBpbmRleEZvck11bHRpLCBwcm9wKTtcbiAgICBzZXRWYWx1ZShjb250ZXh0LCBpbmRleEZvck11bHRpLCBudWxsKTtcbiAgICBzZXRQbGF5ZXJCdWlsZGVySW5kZXgoY29udGV4dCwgaW5kZXhGb3JNdWx0aSwgMCk7XG4gIH1cblxuICAvLyB0aGVyZSBpcyBubyBpbml0aWFsIHZhbHVlIGZsYWcgZm9yIHRoZSBtYXN0ZXIgaW5kZXggc2luY2UgaXQgZG9lc24ndFxuICAvLyByZWZlcmVuY2UgYW4gaW5pdGlhbCBzdHlsZSB2YWx1ZVxuICBjb25zdCBtYXN0ZXJGbGFnID0gcG9pbnRlcnMoMCwgMCwgbXVsdGlTdGFydCkgfFxuICAgICAgKG9ubHlQcm9jZXNzU2luZ2xlQ2xhc3NlcyA/IFN0eWxpbmdGbGFncy5Pbmx5UHJvY2Vzc1NpbmdsZUNsYXNzZXMgOiAwKTtcbiAgc2V0RmxhZyhjb250ZXh0LCBTdHlsaW5nSW5kZXguTWFzdGVyRmxhZ1Bvc2l0aW9uLCBtYXN0ZXJGbGFnKTtcbiAgc2V0Q29udGV4dERpcnR5KGNvbnRleHQsIGluaXRpYWxTdHlsaW5nVmFsdWVzLmxlbmd0aCA+IDEpO1xuXG4gIGlmIChpbml0aWFsU3RhdGljQ2xhc3Nlcykge1xuICAgIGNvbnRleHRbU3R5bGluZ0luZGV4LlByZXZpb3VzT3JDYWNoZWRNdWx0aUNsYXNzVmFsdWVdID0gaW5pdGlhbFN0YXRpY0NsYXNzZXMuam9pbignICcpO1xuICB9XG5cbiAgcmV0dXJuIGNvbnRleHQ7XG59XG5cbi8qKlxuICogU2V0cyBhbmQgcmVzb2x2ZXMgYWxsIGBtdWx0aWAgc3R5bGluZyBvbiBhbiBgU3R5bGluZ0NvbnRleHRgIHNvIHRoYXQgdGhleSBjYW4gYmVcbiAqIGFwcGxpZWQgdG8gdGhlIGVsZW1lbnQgb25jZSBgcmVuZGVyU3R5bGVBbmRDbGFzc0JpbmRpbmdzYCBpcyBjYWxsZWQuXG4gKlxuICogQWxsIG1pc3Npbmcgc3R5bGVzL2NsYXNzIChhbnkgdmFsdWVzIHRoYXQgYXJlIG5vdCBwcm92aWRlZCBpbiB0aGUgbmV3IGBzdHlsZXNgXG4gKiBvciBgY2xhc3Nlc2AgcGFyYW1zKSB3aWxsIHJlc29sdmUgdG8gYG51bGxgIHdpdGhpbiB0aGVpciByZXNwZWN0aXZlIHBvc2l0aW9uc1xuICogaW4gdGhlIGNvbnRleHQuXG4gKlxuICogQHBhcmFtIGNvbnRleHQgVGhlIHN0eWxpbmcgY29udGV4dCB0aGF0IHdpbGwgYmUgdXBkYXRlZCB3aXRoIHRoZVxuICogICAgbmV3bHkgcHJvdmlkZWQgc3R5bGUgdmFsdWVzLlxuICogQHBhcmFtIGNsYXNzZXNJbnB1dCBUaGUga2V5L3ZhbHVlIG1hcCBvZiBDU1MgY2xhc3MgbmFtZXMgdGhhdCB3aWxsIGJlIHVzZWQgZm9yIHRoZSB1cGRhdGUuXG4gKiBAcGFyYW0gc3R5bGVzSW5wdXQgVGhlIGtleS92YWx1ZSBtYXAgb2YgQ1NTIHN0eWxlcyB0aGF0IHdpbGwgYmUgdXNlZCBmb3IgdGhlIHVwZGF0ZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHVwZGF0ZVN0eWxpbmdNYXAoXG4gICAgY29udGV4dDogU3R5bGluZ0NvbnRleHQsIGNsYXNzZXNJbnB1dDoge1trZXk6IHN0cmluZ106IGFueX0gfCBzdHJpbmcgfFxuICAgICAgICBCb3VuZFBsYXllckZhY3Rvcnk8bnVsbHxzdHJpbmd8e1trZXk6IHN0cmluZ106IGFueX0+fCBOT19DSEFOR0UgfCBudWxsLFxuICAgIHN0eWxlc0lucHV0Pzoge1trZXk6IHN0cmluZ106IGFueX0gfCBCb3VuZFBsYXllckZhY3Rvcnk8bnVsbHx7W2tleTogc3RyaW5nXTogYW55fT58IE5PX0NIQU5HRSB8XG4gICAgICAgIG51bGwpOiB2b2lkIHtcbiAgc3R5bGVzSW5wdXQgPSBzdHlsZXNJbnB1dCB8fCBudWxsO1xuXG4gIGNvbnN0IGVsZW1lbnQgPSBjb250ZXh0W1N0eWxpbmdJbmRleC5FbGVtZW50UG9zaXRpb25dICFhcyBIVE1MRWxlbWVudDtcbiAgY29uc3QgY2xhc3Nlc1BsYXllckJ1aWxkZXIgPSBjbGFzc2VzSW5wdXQgaW5zdGFuY2VvZiBCb3VuZFBsYXllckZhY3RvcnkgP1xuICAgICAgbmV3IENsYXNzQW5kU3R5bGVQbGF5ZXJCdWlsZGVyKGNsYXNzZXNJbnB1dCBhcyBhbnksIGVsZW1lbnQsIEJpbmRpbmdUeXBlLkNsYXNzKSA6XG4gICAgICBudWxsO1xuICBjb25zdCBzdHlsZXNQbGF5ZXJCdWlsZGVyID0gc3R5bGVzSW5wdXQgaW5zdGFuY2VvZiBCb3VuZFBsYXllckZhY3RvcnkgP1xuICAgICAgbmV3IENsYXNzQW5kU3R5bGVQbGF5ZXJCdWlsZGVyKHN0eWxlc0lucHV0IGFzIGFueSwgZWxlbWVudCwgQmluZGluZ1R5cGUuU3R5bGUpIDpcbiAgICAgIG51bGw7XG5cbiAgY29uc3QgY2xhc3Nlc1ZhbHVlID0gY2xhc3Nlc1BsYXllckJ1aWxkZXIgP1xuICAgICAgKGNsYXNzZXNJbnB1dCBhcyBCb3VuZFBsYXllckZhY3Rvcnk8e1trZXk6IHN0cmluZ106IGFueX18c3RyaW5nPikgIS52YWx1ZSA6XG4gICAgICBjbGFzc2VzSW5wdXQ7XG4gIGNvbnN0IHN0eWxlc1ZhbHVlID0gc3R5bGVzUGxheWVyQnVpbGRlciA/IHN0eWxlc0lucHV0ICEudmFsdWUgOiBzdHlsZXNJbnB1dDtcbiAgLy8gZWFybHkgZXhpdCAodGhpcyBpcyB3aGF0J3MgZG9uZSB0byBhdm9pZCB1c2luZyBjdHguYmluZCgpIHRvIGNhY2hlIHRoZSB2YWx1ZSlcbiAgY29uc3QgaWdub3JlQWxsQ2xhc3NVcGRhdGVzID0gbGltaXRUb1NpbmdsZUNsYXNzZXMoY29udGV4dCkgfHwgY2xhc3Nlc1ZhbHVlID09PSBOT19DSEFOR0UgfHxcbiAgICAgIGNsYXNzZXNWYWx1ZSA9PT0gY29udGV4dFtTdHlsaW5nSW5kZXguUHJldmlvdXNPckNhY2hlZE11bHRpQ2xhc3NWYWx1ZV07XG4gIGNvbnN0IGlnbm9yZUFsbFN0eWxlVXBkYXRlcyA9XG4gICAgICBzdHlsZXNWYWx1ZSA9PT0gTk9fQ0hBTkdFIHx8IHN0eWxlc1ZhbHVlID09PSBjb250ZXh0W1N0eWxpbmdJbmRleC5QcmV2aW91c011bHRpU3R5bGVWYWx1ZV07XG4gIGlmIChpZ25vcmVBbGxDbGFzc1VwZGF0ZXMgJiYgaWdub3JlQWxsU3R5bGVVcGRhdGVzKSByZXR1cm47XG5cbiAgY29udGV4dFtTdHlsaW5nSW5kZXguUHJldmlvdXNPckNhY2hlZE11bHRpQ2xhc3NWYWx1ZV0gPSBjbGFzc2VzVmFsdWU7XG4gIGNvbnRleHRbU3R5bGluZ0luZGV4LlByZXZpb3VzTXVsdGlTdHlsZVZhbHVlXSA9IHN0eWxlc1ZhbHVlO1xuXG4gIGxldCBjbGFzc05hbWVzOiBzdHJpbmdbXSA9IEVNUFRZX0FSUjtcbiAgbGV0IGFwcGx5QWxsQ2xhc3NlcyA9IGZhbHNlO1xuICBsZXQgcGxheWVyQnVpbGRlcnNBcmVEaXJ0eSA9IGZhbHNlO1xuXG4gIGNvbnN0IGNsYXNzZXNQbGF5ZXJCdWlsZGVySW5kZXggPVxuICAgICAgY2xhc3Nlc1BsYXllckJ1aWxkZXIgPyBQbGF5ZXJJbmRleC5DbGFzc01hcFBsYXllckJ1aWxkZXJQb3NpdGlvbiA6IDA7XG4gIGlmIChoYXNQbGF5ZXJCdWlsZGVyQ2hhbmdlZChcbiAgICAgICAgICBjb250ZXh0LCBjbGFzc2VzUGxheWVyQnVpbGRlciwgUGxheWVySW5kZXguQ2xhc3NNYXBQbGF5ZXJCdWlsZGVyUG9zaXRpb24pKSB7XG4gICAgc2V0UGxheWVyQnVpbGRlcihjb250ZXh0LCBjbGFzc2VzUGxheWVyQnVpbGRlciwgUGxheWVySW5kZXguQ2xhc3NNYXBQbGF5ZXJCdWlsZGVyUG9zaXRpb24pO1xuICAgIHBsYXllckJ1aWxkZXJzQXJlRGlydHkgPSB0cnVlO1xuICB9XG5cbiAgY29uc3Qgc3R5bGVzUGxheWVyQnVpbGRlckluZGV4ID1cbiAgICAgIHN0eWxlc1BsYXllckJ1aWxkZXIgPyBQbGF5ZXJJbmRleC5TdHlsZU1hcFBsYXllckJ1aWxkZXJQb3NpdGlvbiA6IDA7XG4gIGlmIChoYXNQbGF5ZXJCdWlsZGVyQ2hhbmdlZChcbiAgICAgICAgICBjb250ZXh0LCBzdHlsZXNQbGF5ZXJCdWlsZGVyLCBQbGF5ZXJJbmRleC5TdHlsZU1hcFBsYXllckJ1aWxkZXJQb3NpdGlvbikpIHtcbiAgICBzZXRQbGF5ZXJCdWlsZGVyKGNvbnRleHQsIHN0eWxlc1BsYXllckJ1aWxkZXIsIFBsYXllckluZGV4LlN0eWxlTWFwUGxheWVyQnVpbGRlclBvc2l0aW9uKTtcbiAgICBwbGF5ZXJCdWlsZGVyc0FyZURpcnR5ID0gdHJ1ZTtcbiAgfVxuXG4gIC8vIGVhY2ggdGltZSBhIHN0cmluZy1iYXNlZCB2YWx1ZSBwb3BzIHVwIHRoZW4gaXQgc2hvdWxkbid0IHJlcXVpcmUgYSBkZWVwXG4gIC8vIGNoZWNrIG9mIHdoYXQncyBjaGFuZ2VkLlxuICBpZiAoIWlnbm9yZUFsbENsYXNzVXBkYXRlcykge1xuICAgIGlmICh0eXBlb2YgY2xhc3Nlc1ZhbHVlID09ICdzdHJpbmcnKSB7XG4gICAgICBjbGFzc05hbWVzID0gY2xhc3Nlc1ZhbHVlLnNwbGl0KC9cXHMrLyk7XG4gICAgICAvLyB0aGlzIGJvb2xlYW4gaXMgdXNlZCB0byBhdm9pZCBoYXZpbmcgdG8gY3JlYXRlIGEga2V5L3ZhbHVlIG1hcCBvZiBgdHJ1ZWAgdmFsdWVzXG4gICAgICAvLyBzaW5jZSBhIGNsYXNzbmFtZSBzdHJpbmcgaW1wbGllcyB0aGF0IGFsbCB0aG9zZSBjbGFzc2VzIGFyZSBhZGRlZFxuICAgICAgYXBwbHlBbGxDbGFzc2VzID0gdHJ1ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgY2xhc3NOYW1lcyA9IGNsYXNzZXNWYWx1ZSA/IE9iamVjdC5rZXlzKGNsYXNzZXNWYWx1ZSkgOiBFTVBUWV9BUlI7XG4gICAgfVxuICB9XG5cbiAgY29uc3QgY2xhc3NlcyA9IChjbGFzc2VzVmFsdWUgfHwgRU1QVFlfT0JKKSBhc3tba2V5OiBzdHJpbmddOiBhbnl9O1xuICBjb25zdCBzdHlsZVByb3BzID0gc3R5bGVzVmFsdWUgPyBPYmplY3Qua2V5cyhzdHlsZXNWYWx1ZSkgOiBFTVBUWV9BUlI7XG4gIGNvbnN0IHN0eWxlcyA9IHN0eWxlc1ZhbHVlIHx8IEVNUFRZX09CSjtcblxuICBjb25zdCBjbGFzc2VzU3RhcnRJbmRleCA9IHN0eWxlUHJvcHMubGVuZ3RoO1xuICBjb25zdCBtdWx0aVN0YXJ0SW5kZXggPSBnZXRNdWx0aVN0YXJ0SW5kZXgoY29udGV4dCk7XG5cbiAgbGV0IGRpcnR5ID0gZmFsc2U7XG4gIGxldCBjdHhJbmRleCA9IG11bHRpU3RhcnRJbmRleDtcblxuICBsZXQgcHJvcEluZGV4ID0gMDtcbiAgY29uc3QgcHJvcExpbWl0ID0gc3R5bGVQcm9wcy5sZW5ndGggKyBjbGFzc05hbWVzLmxlbmd0aDtcblxuICAvLyB0aGUgbWFpbiBsb29wIGhlcmUgd2lsbCB0cnkgYW5kIGZpZ3VyZSBvdXQgaG93IHRoZSBzaGFwZSBvZiB0aGUgcHJvdmlkZWRcbiAgLy8gc3R5bGVzIGRpZmZlciB3aXRoIHJlc3BlY3QgdG8gdGhlIGNvbnRleHQuIExhdGVyIGlmIHRoZSBjb250ZXh0L3N0eWxlcy9jbGFzc2VzXG4gIC8vIGFyZSBvZmYtYmFsYW5jZSB0aGVuIHRoZXkgd2lsbCBiZSBkZWFsdCBpbiBhbm90aGVyIGxvb3AgYWZ0ZXIgdGhpcyBvbmVcbiAgd2hpbGUgKGN0eEluZGV4IDwgY29udGV4dC5sZW5ndGggJiYgcHJvcEluZGV4IDwgcHJvcExpbWl0KSB7XG4gICAgY29uc3QgaXNDbGFzc0Jhc2VkID0gcHJvcEluZGV4ID49IGNsYXNzZXNTdGFydEluZGV4O1xuICAgIGNvbnN0IHByb2Nlc3NWYWx1ZSA9XG4gICAgICAgICghaXNDbGFzc0Jhc2VkICYmICFpZ25vcmVBbGxTdHlsZVVwZGF0ZXMpIHx8IChpc0NsYXNzQmFzZWQgJiYgIWlnbm9yZUFsbENsYXNzVXBkYXRlcyk7XG5cbiAgICAvLyB3aGVuIHRoZXJlIGlzIGEgY2FjaGUtaGl0IGZvciBhIHN0cmluZy1iYXNlZCBjbGFzcyB0aGVuIHdlIHNob3VsZFxuICAgIC8vIGF2b2lkIGRvaW5nIGFueSB3b3JrIGRpZmZpbmcgYW55IG9mIHRoZSBjaGFuZ2VzXG4gICAgaWYgKHByb2Nlc3NWYWx1ZSkge1xuICAgICAgY29uc3QgYWRqdXN0ZWRQcm9wSW5kZXggPSBpc0NsYXNzQmFzZWQgPyBwcm9wSW5kZXggLSBjbGFzc2VzU3RhcnRJbmRleCA6IHByb3BJbmRleDtcbiAgICAgIGNvbnN0IG5ld1Byb3A6IHN0cmluZyA9XG4gICAgICAgICAgaXNDbGFzc0Jhc2VkID8gY2xhc3NOYW1lc1thZGp1c3RlZFByb3BJbmRleF0gOiBzdHlsZVByb3BzW2FkanVzdGVkUHJvcEluZGV4XTtcbiAgICAgIGNvbnN0IG5ld1ZhbHVlOiBzdHJpbmd8Ym9vbGVhbiA9XG4gICAgICAgICAgaXNDbGFzc0Jhc2VkID8gKGFwcGx5QWxsQ2xhc3NlcyA/IHRydWUgOiBjbGFzc2VzW25ld1Byb3BdKSA6IHN0eWxlc1tuZXdQcm9wXTtcbiAgICAgIGNvbnN0IHBsYXllckJ1aWxkZXJJbmRleCA9XG4gICAgICAgICAgaXNDbGFzc0Jhc2VkID8gY2xhc3Nlc1BsYXllckJ1aWxkZXJJbmRleCA6IHN0eWxlc1BsYXllckJ1aWxkZXJJbmRleDtcblxuICAgICAgY29uc3QgcHJvcCA9IGdldFByb3AoY29udGV4dCwgY3R4SW5kZXgpO1xuICAgICAgaWYgKHByb3AgPT09IG5ld1Byb3ApIHtcbiAgICAgICAgY29uc3QgdmFsdWUgPSBnZXRWYWx1ZShjb250ZXh0LCBjdHhJbmRleCk7XG4gICAgICAgIGNvbnN0IGZsYWcgPSBnZXRQb2ludGVycyhjb250ZXh0LCBjdHhJbmRleCk7XG4gICAgICAgIHNldFBsYXllckJ1aWxkZXJJbmRleChjb250ZXh0LCBjdHhJbmRleCwgcGxheWVyQnVpbGRlckluZGV4KTtcblxuICAgICAgICBpZiAoaGFzVmFsdWVDaGFuZ2VkKGZsYWcsIHZhbHVlLCBuZXdWYWx1ZSkpIHtcbiAgICAgICAgICBzZXRWYWx1ZShjb250ZXh0LCBjdHhJbmRleCwgbmV3VmFsdWUpO1xuICAgICAgICAgIHBsYXllckJ1aWxkZXJzQXJlRGlydHkgPSBwbGF5ZXJCdWlsZGVyc0FyZURpcnR5IHx8ICEhcGxheWVyQnVpbGRlckluZGV4O1xuXG4gICAgICAgICAgY29uc3QgaW5pdGlhbFZhbHVlID0gZ2V0SW5pdGlhbFZhbHVlKGNvbnRleHQsIGZsYWcpO1xuXG4gICAgICAgICAgLy8gdGhlcmUgaXMgbm8gcG9pbnQgaW4gc2V0dGluZyB0aGlzIHRvIGRpcnR5IGlmIHRoZSBwcmV2aW91c2x5XG4gICAgICAgICAgLy8gcmVuZGVyZWQgdmFsdWUgd2FzIGJlaW5nIHJlZmVyZW5jZWQgYnkgdGhlIGluaXRpYWwgc3R5bGUgKG9yIG51bGwpXG4gICAgICAgICAgaWYgKGhhc1ZhbHVlQ2hhbmdlZChmbGFnLCBpbml0aWFsVmFsdWUsIG5ld1ZhbHVlKSkge1xuICAgICAgICAgICAgc2V0RGlydHkoY29udGV4dCwgY3R4SW5kZXgsIHRydWUpO1xuICAgICAgICAgICAgZGlydHkgPSB0cnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3QgaW5kZXhPZkVudHJ5ID0gZmluZEVudHJ5UG9zaXRpb25CeVByb3AoY29udGV4dCwgbmV3UHJvcCwgY3R4SW5kZXgpO1xuICAgICAgICBpZiAoaW5kZXhPZkVudHJ5ID4gMCkge1xuICAgICAgICAgIC8vIGl0IHdhcyBmb3VuZCBhdCBhIGxhdGVyIHBvaW50IC4uLiBqdXN0IHN3YXAgdGhlIHZhbHVlc1xuICAgICAgICAgIGNvbnN0IHZhbHVlVG9Db21wYXJlID0gZ2V0VmFsdWUoY29udGV4dCwgaW5kZXhPZkVudHJ5KTtcbiAgICAgICAgICBjb25zdCBmbGFnVG9Db21wYXJlID0gZ2V0UG9pbnRlcnMoY29udGV4dCwgaW5kZXhPZkVudHJ5KTtcbiAgICAgICAgICBzd2FwTXVsdGlDb250ZXh0RW50cmllcyhjb250ZXh0LCBjdHhJbmRleCwgaW5kZXhPZkVudHJ5KTtcbiAgICAgICAgICBpZiAoaGFzVmFsdWVDaGFuZ2VkKGZsYWdUb0NvbXBhcmUsIHZhbHVlVG9Db21wYXJlLCBuZXdWYWx1ZSkpIHtcbiAgICAgICAgICAgIGNvbnN0IGluaXRpYWxWYWx1ZSA9IGdldEluaXRpYWxWYWx1ZShjb250ZXh0LCBmbGFnVG9Db21wYXJlKTtcbiAgICAgICAgICAgIHNldFZhbHVlKGNvbnRleHQsIGN0eEluZGV4LCBuZXdWYWx1ZSk7XG4gICAgICAgICAgICBpZiAoaGFzVmFsdWVDaGFuZ2VkKGZsYWdUb0NvbXBhcmUsIGluaXRpYWxWYWx1ZSwgbmV3VmFsdWUpKSB7XG4gICAgICAgICAgICAgIHNldERpcnR5KGNvbnRleHQsIGN0eEluZGV4LCB0cnVlKTtcbiAgICAgICAgICAgICAgcGxheWVyQnVpbGRlcnNBcmVEaXJ0eSA9IHBsYXllckJ1aWxkZXJzQXJlRGlydHkgfHwgISFwbGF5ZXJCdWlsZGVySW5kZXg7XG4gICAgICAgICAgICAgIGRpcnR5ID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gd2Ugb25seSBjYXJlIHRvIGRvIHRoaXMgaWYgdGhlIGluc2VydGlvbiBpcyBpbiB0aGUgbWlkZGxlXG4gICAgICAgICAgY29uc3QgbmV3RmxhZyA9IHByZXBhcmVJbml0aWFsRmxhZyhuZXdQcm9wLCBpc0NsYXNzQmFzZWQsIGdldFN0eWxlU2FuaXRpemVyKGNvbnRleHQpKTtcbiAgICAgICAgICBwbGF5ZXJCdWlsZGVyc0FyZURpcnR5ID0gcGxheWVyQnVpbGRlcnNBcmVEaXJ0eSB8fCAhIXBsYXllckJ1aWxkZXJJbmRleDtcbiAgICAgICAgICBpbnNlcnROZXdNdWx0aVByb3BlcnR5KFxuICAgICAgICAgICAgICBjb250ZXh0LCBjdHhJbmRleCwgaXNDbGFzc0Jhc2VkLCBuZXdQcm9wLCBuZXdGbGFnLCBuZXdWYWx1ZSwgcGxheWVyQnVpbGRlckluZGV4KTtcbiAgICAgICAgICBkaXJ0eSA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBjdHhJbmRleCArPSBTdHlsaW5nSW5kZXguU2l6ZTtcbiAgICBwcm9wSW5kZXgrKztcbiAgfVxuXG4gIC8vIHRoaXMgbWVhbnMgdGhhdCB0aGVyZSBhcmUgbGVmdC1vdmVyIHZhbHVlcyBpbiB0aGUgY29udGV4dCB0aGF0XG4gIC8vIHdlcmUgbm90IGluY2x1ZGVkIGluIHRoZSBwcm92aWRlZCBzdHlsZXMvY2xhc3NlcyBhbmQgaW4gdGhpc1xuICAvLyBjYXNlIHRoZSAgZ29hbCBpcyB0byBcInJlbW92ZVwiIHRoZW0gZnJvbSB0aGUgY29udGV4dCAoYnkgbnVsbGlmeWluZylcbiAgd2hpbGUgKGN0eEluZGV4IDwgY29udGV4dC5sZW5ndGgpIHtcbiAgICBjb25zdCBmbGFnID0gZ2V0UG9pbnRlcnMoY29udGV4dCwgY3R4SW5kZXgpO1xuICAgIGNvbnN0IGlzQ2xhc3NCYXNlZCA9IChmbGFnICYgU3R5bGluZ0ZsYWdzLkNsYXNzKSA9PT0gU3R5bGluZ0ZsYWdzLkNsYXNzO1xuICAgIGNvbnN0IHByb2Nlc3NWYWx1ZSA9XG4gICAgICAgICghaXNDbGFzc0Jhc2VkICYmICFpZ25vcmVBbGxTdHlsZVVwZGF0ZXMpIHx8IChpc0NsYXNzQmFzZWQgJiYgIWlnbm9yZUFsbENsYXNzVXBkYXRlcyk7XG4gICAgaWYgKHByb2Nlc3NWYWx1ZSkge1xuICAgICAgY29uc3QgdmFsdWUgPSBnZXRWYWx1ZShjb250ZXh0LCBjdHhJbmRleCk7XG4gICAgICBjb25zdCBkb1JlbW92ZVZhbHVlID0gdmFsdWVFeGlzdHModmFsdWUsIGlzQ2xhc3NCYXNlZCk7XG4gICAgICBpZiAoZG9SZW1vdmVWYWx1ZSkge1xuICAgICAgICBzZXREaXJ0eShjb250ZXh0LCBjdHhJbmRleCwgdHJ1ZSk7XG4gICAgICAgIHNldFZhbHVlKGNvbnRleHQsIGN0eEluZGV4LCBudWxsKTtcblxuICAgICAgICAvLyB3ZSBrZWVwIHRoZSBwbGF5ZXIgZmFjdG9yeSB0aGUgc2FtZSBzbyB0aGF0IHRoZSBgbnVsbGVkYCB2YWx1ZSBjYW5cbiAgICAgICAgLy8gYmUgaW5zdHJ1Y3RlZCBpbnRvIHRoZSBwbGF5ZXIgYmVjYXVzZSByZW1vdmluZyBhIHN0eWxlIGFuZC9vciBhIGNsYXNzXG4gICAgICAgIC8vIGlzIGEgdmFsaWQgYW5pbWF0aW9uIHBsYXllciBpbnN0cnVjdGlvbi5cbiAgICAgICAgY29uc3QgcGxheWVyQnVpbGRlckluZGV4ID1cbiAgICAgICAgICAgIGlzQ2xhc3NCYXNlZCA/IGNsYXNzZXNQbGF5ZXJCdWlsZGVySW5kZXggOiBzdHlsZXNQbGF5ZXJCdWlsZGVySW5kZXg7XG4gICAgICAgIHNldFBsYXllckJ1aWxkZXJJbmRleChjb250ZXh0LCBjdHhJbmRleCwgcGxheWVyQnVpbGRlckluZGV4KTtcbiAgICAgICAgZGlydHkgPSB0cnVlO1xuICAgICAgfVxuICAgIH1cbiAgICBjdHhJbmRleCArPSBTdHlsaW5nSW5kZXguU2l6ZTtcbiAgfVxuXG4gIC8vIHRoaXMgbWVhbnMgdGhhdCB0aGVyZSBhcmUgbGVmdC1vdmVyIHByb3BlcnRpZXMgaW4gdGhlIGNvbnRleHQgdGhhdFxuICAvLyB3ZXJlIG5vdCBkZXRlY3RlZCBpbiB0aGUgY29udGV4dCBkdXJpbmcgdGhlIGxvb3AgYWJvdmUuIEluIHRoYXRcbiAgLy8gY2FzZSB3ZSB3YW50IHRvIGFkZCB0aGUgbmV3IGVudHJpZXMgaW50byB0aGUgbGlzdFxuICBjb25zdCBzYW5pdGl6ZXIgPSBnZXRTdHlsZVNhbml0aXplcihjb250ZXh0KTtcbiAgd2hpbGUgKHByb3BJbmRleCA8IHByb3BMaW1pdCkge1xuICAgIGNvbnN0IGlzQ2xhc3NCYXNlZCA9IHByb3BJbmRleCA+PSBjbGFzc2VzU3RhcnRJbmRleDtcbiAgICBjb25zdCBwcm9jZXNzVmFsdWUgPVxuICAgICAgICAoIWlzQ2xhc3NCYXNlZCAmJiAhaWdub3JlQWxsU3R5bGVVcGRhdGVzKSB8fCAoaXNDbGFzc0Jhc2VkICYmICFpZ25vcmVBbGxDbGFzc1VwZGF0ZXMpO1xuICAgIGlmIChwcm9jZXNzVmFsdWUpIHtcbiAgICAgIGNvbnN0IGFkanVzdGVkUHJvcEluZGV4ID0gaXNDbGFzc0Jhc2VkID8gcHJvcEluZGV4IC0gY2xhc3Nlc1N0YXJ0SW5kZXggOiBwcm9wSW5kZXg7XG4gICAgICBjb25zdCBwcm9wID0gaXNDbGFzc0Jhc2VkID8gY2xhc3NOYW1lc1thZGp1c3RlZFByb3BJbmRleF0gOiBzdHlsZVByb3BzW2FkanVzdGVkUHJvcEluZGV4XTtcbiAgICAgIGNvbnN0IHZhbHVlOiBzdHJpbmd8Ym9vbGVhbiA9XG4gICAgICAgICAgaXNDbGFzc0Jhc2VkID8gKGFwcGx5QWxsQ2xhc3NlcyA/IHRydWUgOiBjbGFzc2VzW3Byb3BdKSA6IHN0eWxlc1twcm9wXTtcbiAgICAgIGNvbnN0IGZsYWcgPSBwcmVwYXJlSW5pdGlhbEZsYWcocHJvcCwgaXNDbGFzc0Jhc2VkLCBzYW5pdGl6ZXIpIHwgU3R5bGluZ0ZsYWdzLkRpcnR5O1xuICAgICAgY29uc3QgcGxheWVyQnVpbGRlckluZGV4ID1cbiAgICAgICAgICBpc0NsYXNzQmFzZWQgPyBjbGFzc2VzUGxheWVyQnVpbGRlckluZGV4IDogc3R5bGVzUGxheWVyQnVpbGRlckluZGV4O1xuICAgICAgY29udGV4dC5wdXNoKGZsYWcsIHByb3AsIHZhbHVlLCBwbGF5ZXJCdWlsZGVySW5kZXgpO1xuICAgICAgZGlydHkgPSB0cnVlO1xuICAgIH1cbiAgICBwcm9wSW5kZXgrKztcbiAgfVxuXG4gIGlmIChkaXJ0eSkge1xuICAgIHNldENvbnRleHREaXJ0eShjb250ZXh0LCB0cnVlKTtcbiAgfVxuXG4gIGlmIChwbGF5ZXJCdWlsZGVyc0FyZURpcnR5KSB7XG4gICAgc2V0Q29udGV4dFBsYXllcnNEaXJ0eShjb250ZXh0LCB0cnVlKTtcbiAgfVxufVxuXG4vKipcbiAqIFNldHMgYW5kIHJlc29sdmVzIGEgc2luZ2xlIHN0eWxpbmcgcHJvcGVydHkvdmFsdWUgb24gdGhlIHByb3ZpZGVkIGBTdHlsaW5nQ29udGV4dGAgc29cbiAqIHRoYXQgdGhleSBjYW4gYmUgYXBwbGllZCB0byB0aGUgZWxlbWVudCBvbmNlIGByZW5kZXJTdHlsZUFuZENsYXNzQmluZGluZ3NgIGlzIGNhbGxlZC5cbiAqXG4gKiBOb3RlIHRoYXQgcHJvcC1sZXZlbCBzdHlsaW5nIHZhbHVlcyBhcmUgY29uc2lkZXJlZCBoaWdoZXIgcHJpb3JpdHkgdGhhbiBhbnkgc3R5bGluZyB0aGF0XG4gKiBoYXMgYmVlbiBhcHBsaWVkIHVzaW5nIGB1cGRhdGVTdHlsaW5nTWFwYCwgdGhlcmVmb3JlLCB3aGVuIHN0eWxpbmcgdmFsdWVzIGFyZSByZW5kZXJlZFxuICogdGhlbiBhbnkgc3R5bGVzL2NsYXNzZXMgdGhhdCBoYXZlIGJlZW4gYXBwbGllZCB1c2luZyB0aGlzIGZ1bmN0aW9uIHdpbGwgYmUgY29uc2lkZXJlZCBmaXJzdFxuICogKHRoZW4gbXVsdGkgdmFsdWVzIHNlY29uZCBhbmQgdGhlbiBpbml0aWFsIHZhbHVlcyBhcyBhIGJhY2t1cCkuXG4gKlxuICogQHBhcmFtIGNvbnRleHQgVGhlIHN0eWxpbmcgY29udGV4dCB0aGF0IHdpbGwgYmUgdXBkYXRlZCB3aXRoIHRoZVxuICogICAgbmV3bHkgcHJvdmlkZWQgc3R5bGUgdmFsdWUuXG4gKiBAcGFyYW0gaW5kZXggVGhlIGluZGV4IG9mIHRoZSBwcm9wZXJ0eSB3aGljaCBpcyBiZWluZyB1cGRhdGVkLlxuICogQHBhcmFtIHZhbHVlIFRoZSBDU1Mgc3R5bGUgdmFsdWUgdGhhdCB3aWxsIGJlIGFzc2lnbmVkXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB1cGRhdGVTdHlsZVByb3AoXG4gICAgY29udGV4dDogU3R5bGluZ0NvbnRleHQsIGluZGV4OiBudW1iZXIsXG4gICAgaW5wdXQ6IHN0cmluZyB8IGJvb2xlYW4gfCBudWxsIHwgQm91bmRQbGF5ZXJGYWN0b3J5PHN0cmluZ3xib29sZWFufG51bGw+KTogdm9pZCB7XG4gIGNvbnN0IHNpbmdsZUluZGV4ID0gU3R5bGluZ0luZGV4LlNpbmdsZVN0eWxlc1N0YXJ0UG9zaXRpb24gKyBpbmRleCAqIFN0eWxpbmdJbmRleC5TaXplO1xuICBjb25zdCBjdXJyVmFsdWUgPSBnZXRWYWx1ZShjb250ZXh0LCBzaW5nbGVJbmRleCk7XG4gIGNvbnN0IGN1cnJGbGFnID0gZ2V0UG9pbnRlcnMoY29udGV4dCwgc2luZ2xlSW5kZXgpO1xuICBjb25zdCB2YWx1ZTogc3RyaW5nfGJvb2xlYW58bnVsbCA9IChpbnB1dCBpbnN0YW5jZW9mIEJvdW5kUGxheWVyRmFjdG9yeSkgPyBpbnB1dC52YWx1ZSA6IGlucHV0O1xuXG4gIC8vIGRpZG4ndCBjaGFuZ2UgLi4uIG5vdGhpbmcgdG8gbWFrZSBhIG5vdGUgb2ZcbiAgaWYgKGhhc1ZhbHVlQ2hhbmdlZChjdXJyRmxhZywgY3VyclZhbHVlLCB2YWx1ZSkpIHtcbiAgICBjb25zdCBpc0NsYXNzQmFzZWQgPSAoY3VyckZsYWcgJiBTdHlsaW5nRmxhZ3MuQ2xhc3MpID09PSBTdHlsaW5nRmxhZ3MuQ2xhc3M7XG4gICAgY29uc3QgZWxlbWVudCA9IGNvbnRleHRbU3R5bGluZ0luZGV4LkVsZW1lbnRQb3NpdGlvbl0gIWFzIEhUTUxFbGVtZW50O1xuICAgIGNvbnN0IHBsYXllckJ1aWxkZXIgPSBpbnB1dCBpbnN0YW5jZW9mIEJvdW5kUGxheWVyRmFjdG9yeSA/XG4gICAgICAgIG5ldyBDbGFzc0FuZFN0eWxlUGxheWVyQnVpbGRlcihcbiAgICAgICAgICAgIGlucHV0IGFzIGFueSwgZWxlbWVudCwgaXNDbGFzc0Jhc2VkID8gQmluZGluZ1R5cGUuQ2xhc3MgOiBCaW5kaW5nVHlwZS5TdHlsZSkgOlxuICAgICAgICBudWxsO1xuICAgIGNvbnN0IHZhbHVlID0gKHBsYXllckJ1aWxkZXIgPyAoaW5wdXQgYXMgQm91bmRQbGF5ZXJGYWN0b3J5PGFueT4pLnZhbHVlIDogaW5wdXQpIGFzIHN0cmluZyB8XG4gICAgICAgIGJvb2xlYW4gfCBudWxsO1xuICAgIGNvbnN0IGN1cnJQbGF5ZXJJbmRleCA9IGdldFBsYXllckJ1aWxkZXJJbmRleChjb250ZXh0LCBzaW5nbGVJbmRleCk7XG5cbiAgICBsZXQgcGxheWVyQnVpbGRlcnNBcmVEaXJ0eSA9IGZhbHNlO1xuICAgIGxldCBwbGF5ZXJCdWlsZGVySW5kZXggPSBwbGF5ZXJCdWlsZGVyID8gY3VyclBsYXllckluZGV4IDogMDtcbiAgICBpZiAoaGFzUGxheWVyQnVpbGRlckNoYW5nZWQoY29udGV4dCwgcGxheWVyQnVpbGRlciwgY3VyclBsYXllckluZGV4KSkge1xuICAgICAgY29uc3QgbmV3SW5kZXggPSBzZXRQbGF5ZXJCdWlsZGVyKGNvbnRleHQsIHBsYXllckJ1aWxkZXIsIGN1cnJQbGF5ZXJJbmRleCk7XG4gICAgICBwbGF5ZXJCdWlsZGVySW5kZXggPSBwbGF5ZXJCdWlsZGVyID8gbmV3SW5kZXggOiAwO1xuICAgICAgc2V0UGxheWVyQnVpbGRlckluZGV4KGNvbnRleHQsIHNpbmdsZUluZGV4LCBwbGF5ZXJCdWlsZGVySW5kZXgpO1xuICAgICAgcGxheWVyQnVpbGRlcnNBcmVEaXJ0eSA9IHRydWU7XG4gICAgfVxuXG4gICAgLy8gdGhlIHZhbHVlIHdpbGwgYWx3YXlzIGdldCB1cGRhdGVkIChldmVuIGlmIHRoZSBkaXJ0eSBmbGFnIGlzIHNraXBwZWQpXG4gICAgc2V0VmFsdWUoY29udGV4dCwgc2luZ2xlSW5kZXgsIHZhbHVlKTtcbiAgICBjb25zdCBpbmRleEZvck11bHRpID0gZ2V0TXVsdGlPclNpbmdsZUluZGV4KGN1cnJGbGFnKTtcblxuICAgIC8vIGlmIHRoZSB2YWx1ZSBpcyB0aGUgc2FtZSBpbiB0aGUgbXVsdGktYXJlYSB0aGVuIHRoZXJlJ3Mgbm8gcG9pbnQgaW4gcmUtYXNzZW1ibGluZ1xuICAgIGNvbnN0IHZhbHVlRm9yTXVsdGkgPSBnZXRWYWx1ZShjb250ZXh0LCBpbmRleEZvck11bHRpKTtcbiAgICBpZiAoIXZhbHVlRm9yTXVsdGkgfHwgaGFzVmFsdWVDaGFuZ2VkKGN1cnJGbGFnLCB2YWx1ZUZvck11bHRpLCB2YWx1ZSkpIHtcbiAgICAgIGxldCBtdWx0aURpcnR5ID0gZmFsc2U7XG4gICAgICBsZXQgc2luZ2xlRGlydHkgPSB0cnVlO1xuXG4gICAgICAvLyBvbmx5IHdoZW4gdGhlIHZhbHVlIGlzIHNldCB0byBgbnVsbGAgc2hvdWxkIHRoZSBtdWx0aS12YWx1ZSBnZXQgZmxhZ2dlZFxuICAgICAgaWYgKCF2YWx1ZUV4aXN0cyh2YWx1ZSwgaXNDbGFzc0Jhc2VkKSAmJiB2YWx1ZUV4aXN0cyh2YWx1ZUZvck11bHRpLCBpc0NsYXNzQmFzZWQpKSB7XG4gICAgICAgIG11bHRpRGlydHkgPSB0cnVlO1xuICAgICAgICBzaW5nbGVEaXJ0eSA9IGZhbHNlO1xuICAgICAgfVxuXG4gICAgICBzZXREaXJ0eShjb250ZXh0LCBpbmRleEZvck11bHRpLCBtdWx0aURpcnR5KTtcbiAgICAgIHNldERpcnR5KGNvbnRleHQsIHNpbmdsZUluZGV4LCBzaW5nbGVEaXJ0eSk7XG4gICAgICBzZXRDb250ZXh0RGlydHkoY29udGV4dCwgdHJ1ZSk7XG4gICAgfVxuXG4gICAgaWYgKHBsYXllckJ1aWxkZXJzQXJlRGlydHkpIHtcbiAgICAgIHNldENvbnRleHRQbGF5ZXJzRGlydHkoY29udGV4dCwgdHJ1ZSk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogVGhpcyBtZXRob2Qgd2lsbCB0b2dnbGUgdGhlIHJlZmVyZW5jZWQgQ1NTIGNsYXNzIChieSB0aGUgcHJvdmlkZWQgaW5kZXgpXG4gKiB3aXRoaW4gdGhlIGdpdmVuIGNvbnRleHQuXG4gKlxuICogQHBhcmFtIGNvbnRleHQgVGhlIHN0eWxpbmcgY29udGV4dCB0aGF0IHdpbGwgYmUgdXBkYXRlZCB3aXRoIHRoZVxuICogICAgbmV3bHkgcHJvdmlkZWQgY2xhc3MgdmFsdWUuXG4gKiBAcGFyYW0gaW5kZXggVGhlIGluZGV4IG9mIHRoZSBDU1MgY2xhc3Mgd2hpY2ggaXMgYmVpbmcgdXBkYXRlZC5cbiAqIEBwYXJhbSBhZGRPclJlbW92ZSBXaGV0aGVyIG9yIG5vdCB0byBhZGQgb3IgcmVtb3ZlIHRoZSBDU1MgY2xhc3NcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHVwZGF0ZUNsYXNzUHJvcChcbiAgICBjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgaW5kZXg6IG51bWJlcixcbiAgICBhZGRPclJlbW92ZTogYm9vbGVhbiB8IEJvdW5kUGxheWVyRmFjdG9yeTxib29sZWFuPik6IHZvaWQge1xuICBjb25zdCBhZGp1c3RlZEluZGV4ID0gaW5kZXggKyBjb250ZXh0W1N0eWxpbmdJbmRleC5DbGFzc09mZnNldFBvc2l0aW9uXTtcbiAgdXBkYXRlU3R5bGVQcm9wKGNvbnRleHQsIGFkanVzdGVkSW5kZXgsIGFkZE9yUmVtb3ZlKTtcbn1cblxuLyoqXG4gKiBSZW5kZXJzIGFsbCBxdWV1ZWQgc3R5bGluZyB1c2luZyBhIHJlbmRlcmVyIG9udG8gdGhlIGdpdmVuIGVsZW1lbnQuXG4gKlxuICogVGhpcyBmdW5jdGlvbiB3b3JrcyBieSByZW5kZXJpbmcgYW55IHN0eWxlcyAodGhhdCBoYXZlIGJlZW4gYXBwbGllZFxuICogdXNpbmcgYHVwZGF0ZVN0eWxpbmdNYXBgKSBhbmQgYW55IGNsYXNzZXMgKHRoYXQgaGF2ZSBiZWVuIGFwcGxpZWQgdXNpbmdcbiAqIGB1cGRhdGVTdHlsZVByb3BgKSBvbnRvIHRoZSBwcm92aWRlZCBlbGVtZW50IHVzaW5nIHRoZSBwcm92aWRlZCByZW5kZXJlci5cbiAqIEp1c3QgYmVmb3JlIHRoZSBzdHlsZXMvY2xhc3NlcyBhcmUgcmVuZGVyZWQgYSBmaW5hbCBrZXkvdmFsdWUgc3R5bGUgbWFwXG4gKiB3aWxsIGJlIGFzc2VtYmxlZCAoaWYgYHN0eWxlU3RvcmVgIG9yIGBjbGFzc1N0b3JlYCBhcmUgcHJvdmlkZWQpLlxuICpcbiAqIEBwYXJhbSBsRWxlbWVudCB0aGUgZWxlbWVudCB0aGF0IHRoZSBzdHlsZXMgd2lsbCBiZSByZW5kZXJlZCBvblxuICogQHBhcmFtIGNvbnRleHQgVGhlIHN0eWxpbmcgY29udGV4dCB0aGF0IHdpbGwgYmUgdXNlZCB0byBkZXRlcm1pbmVcbiAqICAgICAgd2hhdCBzdHlsZXMgd2lsbCBiZSByZW5kZXJlZFxuICogQHBhcmFtIHJlbmRlcmVyIHRoZSByZW5kZXJlciB0aGF0IHdpbGwgYmUgdXNlZCB0byBhcHBseSB0aGUgc3R5bGluZ1xuICogQHBhcmFtIGNsYXNzZXNTdG9yZSBpZiBwcm92aWRlZCwgdGhlIHVwZGF0ZWQgY2xhc3MgdmFsdWVzIHdpbGwgYmUgYXBwbGllZFxuICogICAgdG8gdGhpcyBrZXkvdmFsdWUgbWFwIGluc3RlYWQgb2YgYmVpbmcgcmVuZGVyZXJlZCB2aWEgdGhlIHJlbmRlcmVyLlxuICogQHBhcmFtIHN0eWxlc1N0b3JlIGlmIHByb3ZpZGVkLCB0aGUgdXBkYXRlZCBzdHlsZSB2YWx1ZXMgd2lsbCBiZSBhcHBsaWVkXG4gKiAgICB0byB0aGlzIGtleS92YWx1ZSBtYXAgaW5zdGVhZCBvZiBiZWluZyByZW5kZXJlcmVkIHZpYSB0aGUgcmVuZGVyZXIuXG4gKiBAcmV0dXJucyBudW1iZXIgdGhlIHRvdGFsIGFtb3VudCBvZiBwbGF5ZXJzIHRoYXQgZ290IHF1ZXVlZCBmb3IgYW5pbWF0aW9uIChpZiBhbnkpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZW5kZXJTdHlsZUFuZENsYXNzQmluZGluZ3MoXG4gICAgY29udGV4dDogU3R5bGluZ0NvbnRleHQsIHJlbmRlcmVyOiBSZW5kZXJlcjMsIHJvb3RPclZpZXc6IFJvb3RDb250ZXh0IHwgTFZpZXcsXG4gICAgaXNGaXJzdFJlbmRlcjogYm9vbGVhbiwgY2xhc3Nlc1N0b3JlPzogQmluZGluZ1N0b3JlIHwgbnVsbCxcbiAgICBzdHlsZXNTdG9yZT86IEJpbmRpbmdTdG9yZSB8IG51bGwpOiBudW1iZXIge1xuICBsZXQgdG90YWxQbGF5ZXJzUXVldWVkID0gMDtcblxuICBpZiAoaXNDb250ZXh0RGlydHkoY29udGV4dCkpIHtcbiAgICBjb25zdCBmbHVzaFBsYXllckJ1aWxkZXJzOiBhbnkgPVxuICAgICAgICBjb250ZXh0W1N0eWxpbmdJbmRleC5NYXN0ZXJGbGFnUG9zaXRpb25dICYgU3R5bGluZ0ZsYWdzLlBsYXllckJ1aWxkZXJzRGlydHk7XG4gICAgY29uc3QgbmF0aXZlID0gY29udGV4dFtTdHlsaW5nSW5kZXguRWxlbWVudFBvc2l0aW9uXSAhO1xuICAgIGNvbnN0IG11bHRpU3RhcnRJbmRleCA9IGdldE11bHRpU3RhcnRJbmRleChjb250ZXh0KTtcbiAgICBjb25zdCBzdHlsZVNhbml0aXplciA9IGdldFN0eWxlU2FuaXRpemVyKGNvbnRleHQpO1xuICAgIGNvbnN0IG9ubHlTaW5nbGVDbGFzc2VzID0gbGltaXRUb1NpbmdsZUNsYXNzZXMoY29udGV4dCk7XG5cbiAgICBmb3IgKGxldCBpID0gU3R5bGluZ0luZGV4LlNpbmdsZVN0eWxlc1N0YXJ0UG9zaXRpb247IGkgPCBjb250ZXh0Lmxlbmd0aDtcbiAgICAgICAgIGkgKz0gU3R5bGluZ0luZGV4LlNpemUpIHtcbiAgICAgIC8vIHRoZXJlIGlzIG5vIHBvaW50IGluIHJlbmRlcmluZyBzdHlsZXMgdGhhdCBoYXZlIG5vdCBjaGFuZ2VkIG9uIHNjcmVlblxuICAgICAgaWYgKGlzRGlydHkoY29udGV4dCwgaSkpIHtcbiAgICAgICAgY29uc3QgcHJvcCA9IGdldFByb3AoY29udGV4dCwgaSk7XG4gICAgICAgIGNvbnN0IHZhbHVlID0gZ2V0VmFsdWUoY29udGV4dCwgaSk7XG4gICAgICAgIGNvbnN0IGZsYWcgPSBnZXRQb2ludGVycyhjb250ZXh0LCBpKTtcbiAgICAgICAgY29uc3QgcGxheWVyQnVpbGRlciA9IGdldFBsYXllckJ1aWxkZXIoY29udGV4dCwgaSk7XG4gICAgICAgIGNvbnN0IGlzQ2xhc3NCYXNlZCA9IGZsYWcgJiBTdHlsaW5nRmxhZ3MuQ2xhc3MgPyB0cnVlIDogZmFsc2U7XG4gICAgICAgIGNvbnN0IGlzSW5TaW5nbGVSZWdpb24gPSBpIDwgbXVsdGlTdGFydEluZGV4O1xuICAgICAgICBjb25zdCByZWFkSW5pdGlhbFZhbHVlID0gIWlzQ2xhc3NCYXNlZCB8fCAhb25seVNpbmdsZUNsYXNzZXM7XG5cbiAgICAgICAgbGV0IHZhbHVlVG9BcHBseTogc3RyaW5nfGJvb2xlYW58bnVsbCA9IHZhbHVlO1xuXG4gICAgICAgIC8vIFZBTFVFIERFRkVSIENBU0UgMTogVXNlIGEgbXVsdGkgdmFsdWUgaW5zdGVhZCBvZiBhIG51bGwgc2luZ2xlIHZhbHVlXG4gICAgICAgIC8vIHRoaXMgY2hlY2sgaW1wbGllcyB0aGF0IGEgc2luZ2xlIHZhbHVlIHdhcyByZW1vdmVkIGFuZCB3ZVxuICAgICAgICAvLyBzaG91bGQgbm93IGRlZmVyIHRvIGEgbXVsdGkgdmFsdWUgYW5kIHVzZSB0aGF0IChpZiBzZXQpLlxuICAgICAgICBpZiAoaXNJblNpbmdsZVJlZ2lvbiAmJiAhdmFsdWVFeGlzdHModmFsdWVUb0FwcGx5LCBpc0NsYXNzQmFzZWQpKSB7XG4gICAgICAgICAgLy8gc2luZ2xlIHZhbHVlcyBBTFdBWVMgaGF2ZSBhIHJlZmVyZW5jZSB0byBhIG11bHRpIGluZGV4XG4gICAgICAgICAgY29uc3QgbXVsdGlJbmRleCA9IGdldE11bHRpT3JTaW5nbGVJbmRleChmbGFnKTtcbiAgICAgICAgICB2YWx1ZVRvQXBwbHkgPSBnZXRWYWx1ZShjb250ZXh0LCBtdWx0aUluZGV4KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFZBTFVFIERFRkVSIENBU0UgMjogVXNlIHRoZSBpbml0aWFsIHZhbHVlIGlmIGFsbCBlbHNlIGZhaWxzIChpcyBmYWxzeSlcbiAgICAgICAgLy8gdGhlIGluaXRpYWwgdmFsdWUgd2lsbCBhbHdheXMgYmUgYSBzdHJpbmcgb3IgbnVsbCxcbiAgICAgICAgLy8gdGhlcmVmb3JlIHdlIGNhbiBzYWZlbHkgYWRvcHQgaXQgaW5jYXNlIHRoZXJlJ3Mgbm90aGluZyBlbHNlXG4gICAgICAgIC8vIG5vdGUgdGhhdCB0aGlzIHNob3VsZCBhbHdheXMgYmUgYSBmYWxzeSBjaGVjayBzaW5jZSBgZmFsc2VgIGlzIHVzZWRcbiAgICAgICAgLy8gZm9yIGJvdGggY2xhc3MgYW5kIHN0eWxlIGNvbXBhcmlzb25zIChzdHlsZXMgY2FuJ3QgYmUgZmFsc2UgYW5kIGZhbHNlXG4gICAgICAgIC8vIGNsYXNzZXMgYXJlIHR1cm5lZCBvZmYgYW5kIHNob3VsZCB0aGVyZWZvcmUgZGVmZXIgdG8gdGhlaXIgaW5pdGlhbCB2YWx1ZXMpXG4gICAgICAgIGlmICghdmFsdWVFeGlzdHModmFsdWVUb0FwcGx5LCBpc0NsYXNzQmFzZWQpICYmIHJlYWRJbml0aWFsVmFsdWUpIHtcbiAgICAgICAgICB2YWx1ZVRvQXBwbHkgPSBnZXRJbml0aWFsVmFsdWUoY29udGV4dCwgZmxhZyk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBpZiB0aGUgZmlyc3QgcmVuZGVyIGlzIHRydWUgdGhlbiB3ZSBkbyBub3Qgd2FudCB0byBzdGFydCBhcHBseWluZyBmYWxzeVxuICAgICAgICAvLyB2YWx1ZXMgdG8gdGhlIERPTSBlbGVtZW50J3Mgc3R5bGluZy4gT3RoZXJ3aXNlIHRoZW4gd2Uga25vdyB0aGVyZSBoYXNcbiAgICAgICAgLy8gYmVlbiBhIGNoYW5nZSBhbmQgZXZlbiBpZiBpdCdzIGZhbHN5IHRoZW4gaXQncyByZW1vdmluZyBzb21ldGhpbmcgdGhhdFxuICAgICAgICAvLyB3YXMgdHJ1dGh5IGJlZm9yZS5cbiAgICAgICAgY29uc3QgZG9BcHBseVZhbHVlID0gaXNGaXJzdFJlbmRlciA/IHZhbHVlVG9BcHBseSA6IHRydWU7XG4gICAgICAgIGlmIChkb0FwcGx5VmFsdWUpIHtcbiAgICAgICAgICBpZiAoaXNDbGFzc0Jhc2VkKSB7XG4gICAgICAgICAgICBzZXRDbGFzcyhcbiAgICAgICAgICAgICAgICBuYXRpdmUsIHByb3AsIHZhbHVlVG9BcHBseSA/IHRydWUgOiBmYWxzZSwgcmVuZGVyZXIsIGNsYXNzZXNTdG9yZSwgcGxheWVyQnVpbGRlcik7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IHNhbml0aXplciA9IChmbGFnICYgU3R5bGluZ0ZsYWdzLlNhbml0aXplKSA/IHN0eWxlU2FuaXRpemVyIDogbnVsbDtcbiAgICAgICAgICAgIHNldFN0eWxlKFxuICAgICAgICAgICAgICAgIG5hdGl2ZSwgcHJvcCwgdmFsdWVUb0FwcGx5IGFzIHN0cmluZyB8IG51bGwsIHJlbmRlcmVyLCBzYW5pdGl6ZXIsIHN0eWxlc1N0b3JlLFxuICAgICAgICAgICAgICAgIHBsYXllckJ1aWxkZXIpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHNldERpcnR5KGNvbnRleHQsIGksIGZhbHNlKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoZmx1c2hQbGF5ZXJCdWlsZGVycykge1xuICAgICAgY29uc3Qgcm9vdENvbnRleHQgPVxuICAgICAgICAgIEFycmF5LmlzQXJyYXkocm9vdE9yVmlldykgPyBnZXRSb290Q29udGV4dChyb290T3JWaWV3KSA6IHJvb3RPclZpZXcgYXMgUm9vdENvbnRleHQ7XG4gICAgICBjb25zdCBwbGF5ZXJDb250ZXh0ID0gZ2V0UGxheWVyQ29udGV4dChjb250ZXh0KSAhO1xuICAgICAgY29uc3QgcGxheWVyc1N0YXJ0SW5kZXggPSBwbGF5ZXJDb250ZXh0W1BsYXllckluZGV4Lk5vbkJ1aWxkZXJQbGF5ZXJzU3RhcnRdO1xuICAgICAgZm9yIChsZXQgaSA9IFBsYXllckluZGV4LlBsYXllckJ1aWxkZXJzU3RhcnRQb3NpdGlvbjsgaSA8IHBsYXllcnNTdGFydEluZGV4O1xuICAgICAgICAgICBpICs9IFBsYXllckluZGV4LlBsYXllckFuZFBsYXllckJ1aWxkZXJzVHVwbGVTaXplKSB7XG4gICAgICAgIGNvbnN0IGJ1aWxkZXIgPSBwbGF5ZXJDb250ZXh0W2ldIGFzIENsYXNzQW5kU3R5bGVQbGF5ZXJCdWlsZGVyPGFueT58IG51bGw7XG4gICAgICAgIGNvbnN0IHBsYXllckluc2VydGlvbkluZGV4ID0gaSArIFBsYXllckluZGV4LlBsYXllck9mZnNldFBvc2l0aW9uO1xuICAgICAgICBjb25zdCBvbGRQbGF5ZXIgPSBwbGF5ZXJDb250ZXh0W3BsYXllckluc2VydGlvbkluZGV4XSBhcyBQbGF5ZXIgfCBudWxsO1xuICAgICAgICBpZiAoYnVpbGRlcikge1xuICAgICAgICAgIGNvbnN0IHBsYXllciA9IGJ1aWxkZXIuYnVpbGRQbGF5ZXIob2xkUGxheWVyLCBpc0ZpcnN0UmVuZGVyKTtcbiAgICAgICAgICBpZiAocGxheWVyICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGlmIChwbGF5ZXIgIT0gbnVsbCkge1xuICAgICAgICAgICAgICBjb25zdCB3YXNRdWV1ZWQgPSBhZGRQbGF5ZXJJbnRlcm5hbChcbiAgICAgICAgICAgICAgICAgIHBsYXllckNvbnRleHQsIHJvb3RDb250ZXh0LCBuYXRpdmUgYXMgSFRNTEVsZW1lbnQsIHBsYXllciwgcGxheWVySW5zZXJ0aW9uSW5kZXgpO1xuICAgICAgICAgICAgICB3YXNRdWV1ZWQgJiYgdG90YWxQbGF5ZXJzUXVldWVkKys7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAob2xkUGxheWVyKSB7XG4gICAgICAgICAgICAgIG9sZFBsYXllci5kZXN0cm95KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKG9sZFBsYXllcikge1xuICAgICAgICAgIC8vIHRoZSBwbGF5ZXIgYnVpbGRlciBoYXMgYmVlbiByZW1vdmVkIC4uLiB0aGVyZWZvcmUgd2Ugc2hvdWxkIGRlbGV0ZSB0aGUgYXNzb2NpYXRlZFxuICAgICAgICAgIC8vIHBsYXllclxuICAgICAgICAgIG9sZFBsYXllci5kZXN0cm95KCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHNldENvbnRleHRQbGF5ZXJzRGlydHkoY29udGV4dCwgZmFsc2UpO1xuICAgIH1cbiAgICBzZXRDb250ZXh0RGlydHkoY29udGV4dCwgZmFsc2UpO1xuICB9XG5cbiAgcmV0dXJuIHRvdGFsUGxheWVyc1F1ZXVlZDtcbn1cblxuLyoqXG4gKiBUaGlzIGZ1bmN0aW9uIHJlbmRlcnMgYSBnaXZlbiBDU1MgcHJvcC92YWx1ZSBlbnRyeSB1c2luZyB0aGVcbiAqIHByb3ZpZGVkIHJlbmRlcmVyLiBJZiBhIGBzdG9yZWAgdmFsdWUgaXMgcHJvdmlkZWQgdGhlblxuICogdGhhdCB3aWxsIGJlIHVzZWQgYSByZW5kZXIgY29udGV4dCBpbnN0ZWFkIG9mIHRoZSBwcm92aWRlZFxuICogcmVuZGVyZXIuXG4gKlxuICogQHBhcmFtIG5hdGl2ZSB0aGUgRE9NIEVsZW1lbnRcbiAqIEBwYXJhbSBwcm9wIHRoZSBDU1Mgc3R5bGUgcHJvcGVydHkgdGhhdCB3aWxsIGJlIHJlbmRlcmVkXG4gKiBAcGFyYW0gdmFsdWUgdGhlIENTUyBzdHlsZSB2YWx1ZSB0aGF0IHdpbGwgYmUgcmVuZGVyZWRcbiAqIEBwYXJhbSByZW5kZXJlclxuICogQHBhcmFtIHN0b3JlIGFuIG9wdGlvbmFsIGtleS92YWx1ZSBtYXAgdGhhdCB3aWxsIGJlIHVzZWQgYXMgYSBjb250ZXh0IHRvIHJlbmRlciBzdHlsZXMgb25cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNldFN0eWxlKFxuICAgIG5hdGl2ZTogYW55LCBwcm9wOiBzdHJpbmcsIHZhbHVlOiBzdHJpbmcgfCBudWxsLCByZW5kZXJlcjogUmVuZGVyZXIzLFxuICAgIHNhbml0aXplcjogU3R5bGVTYW5pdGl6ZUZuIHwgbnVsbCwgc3RvcmU/OiBCaW5kaW5nU3RvcmUgfCBudWxsLFxuICAgIHBsYXllckJ1aWxkZXI/OiBDbGFzc0FuZFN0eWxlUGxheWVyQnVpbGRlcjxhbnk+fCBudWxsKSB7XG4gIHZhbHVlID0gc2FuaXRpemVyICYmIHZhbHVlID8gc2FuaXRpemVyKHByb3AsIHZhbHVlKSA6IHZhbHVlO1xuICBpZiAoc3RvcmUgfHwgcGxheWVyQnVpbGRlcikge1xuICAgIGlmIChzdG9yZSkge1xuICAgICAgc3RvcmUuc2V0VmFsdWUocHJvcCwgdmFsdWUpO1xuICAgIH1cbiAgICBpZiAocGxheWVyQnVpbGRlcikge1xuICAgICAgcGxheWVyQnVpbGRlci5zZXRWYWx1ZShwcm9wLCB2YWx1ZSk7XG4gICAgfVxuICB9IGVsc2UgaWYgKHZhbHVlKSB7XG4gICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlclNldFN0eWxlKys7XG4gICAgaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpID9cbiAgICAgICAgcmVuZGVyZXIuc2V0U3R5bGUobmF0aXZlLCBwcm9wLCB2YWx1ZSwgUmVuZGVyZXJTdHlsZUZsYWdzMy5EYXNoQ2FzZSkgOlxuICAgICAgICBuYXRpdmVbJ3N0eWxlJ10uc2V0UHJvcGVydHkocHJvcCwgdmFsdWUpO1xuICB9IGVsc2Uge1xuICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJSZW1vdmVTdHlsZSsrO1xuICAgIGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSA/XG4gICAgICAgIHJlbmRlcmVyLnJlbW92ZVN0eWxlKG5hdGl2ZSwgcHJvcCwgUmVuZGVyZXJTdHlsZUZsYWdzMy5EYXNoQ2FzZSkgOlxuICAgICAgICBuYXRpdmVbJ3N0eWxlJ10ucmVtb3ZlUHJvcGVydHkocHJvcCk7XG4gIH1cbn1cblxuLyoqXG4gKiBUaGlzIGZ1bmN0aW9uIHJlbmRlcnMgYSBnaXZlbiBDU1MgY2xhc3MgdmFsdWUgdXNpbmcgdGhlIHByb3ZpZGVkXG4gKiByZW5kZXJlciAoYnkgYWRkaW5nIG9yIHJlbW92aW5nIGl0IGZyb20gdGhlIHByb3ZpZGVkIGVsZW1lbnQpLlxuICogSWYgYSBgc3RvcmVgIHZhbHVlIGlzIHByb3ZpZGVkIHRoZW4gdGhhdCB3aWxsIGJlIHVzZWQgYSByZW5kZXJcbiAqIGNvbnRleHQgaW5zdGVhZCBvZiB0aGUgcHJvdmlkZWQgcmVuZGVyZXIuXG4gKlxuICogQHBhcmFtIG5hdGl2ZSB0aGUgRE9NIEVsZW1lbnRcbiAqIEBwYXJhbSBwcm9wIHRoZSBDU1Mgc3R5bGUgcHJvcGVydHkgdGhhdCB3aWxsIGJlIHJlbmRlcmVkXG4gKiBAcGFyYW0gdmFsdWUgdGhlIENTUyBzdHlsZSB2YWx1ZSB0aGF0IHdpbGwgYmUgcmVuZGVyZWRcbiAqIEBwYXJhbSByZW5kZXJlclxuICogQHBhcmFtIHN0b3JlIGFuIG9wdGlvbmFsIGtleS92YWx1ZSBtYXAgdGhhdCB3aWxsIGJlIHVzZWQgYXMgYSBjb250ZXh0IHRvIHJlbmRlciBzdHlsZXMgb25cbiAqL1xuZnVuY3Rpb24gc2V0Q2xhc3MoXG4gICAgbmF0aXZlOiBhbnksIGNsYXNzTmFtZTogc3RyaW5nLCBhZGQ6IGJvb2xlYW4sIHJlbmRlcmVyOiBSZW5kZXJlcjMsIHN0b3JlPzogQmluZGluZ1N0b3JlIHwgbnVsbCxcbiAgICBwbGF5ZXJCdWlsZGVyPzogQ2xhc3NBbmRTdHlsZVBsYXllckJ1aWxkZXI8YW55PnwgbnVsbCkge1xuICBpZiAoc3RvcmUgfHwgcGxheWVyQnVpbGRlcikge1xuICAgIGlmIChzdG9yZSkge1xuICAgICAgc3RvcmUuc2V0VmFsdWUoY2xhc3NOYW1lLCBhZGQpO1xuICAgIH1cbiAgICBpZiAocGxheWVyQnVpbGRlcikge1xuICAgICAgcGxheWVyQnVpbGRlci5zZXRWYWx1ZShjbGFzc05hbWUsIGFkZCk7XG4gICAgfVxuICB9IGVsc2UgaWYgKGFkZCkge1xuICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJBZGRDbGFzcysrO1xuICAgIGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSA/IHJlbmRlcmVyLmFkZENsYXNzKG5hdGl2ZSwgY2xhc3NOYW1lKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmF0aXZlWydjbGFzc0xpc3QnXS5hZGQoY2xhc3NOYW1lKTtcbiAgfSBlbHNlIHtcbiAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyUmVtb3ZlQ2xhc3MrKztcbiAgICBpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikgPyByZW5kZXJlci5yZW1vdmVDbGFzcyhuYXRpdmUsIGNsYXNzTmFtZSkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hdGl2ZVsnY2xhc3NMaXN0J10ucmVtb3ZlKGNsYXNzTmFtZSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gc2V0RGlydHkoY29udGV4dDogU3R5bGluZ0NvbnRleHQsIGluZGV4OiBudW1iZXIsIGlzRGlydHlZZXM6IGJvb2xlYW4pIHtcbiAgY29uc3QgYWRqdXN0ZWRJbmRleCA9XG4gICAgICBpbmRleCA+PSBTdHlsaW5nSW5kZXguU2luZ2xlU3R5bGVzU3RhcnRQb3NpdGlvbiA/IChpbmRleCArIFN0eWxpbmdJbmRleC5GbGFnc09mZnNldCkgOiBpbmRleDtcbiAgaWYgKGlzRGlydHlZZXMpIHtcbiAgICAoY29udGV4dFthZGp1c3RlZEluZGV4XSBhcyBudW1iZXIpIHw9IFN0eWxpbmdGbGFncy5EaXJ0eTtcbiAgfSBlbHNlIHtcbiAgICAoY29udGV4dFthZGp1c3RlZEluZGV4XSBhcyBudW1iZXIpICY9IH5TdHlsaW5nRmxhZ3MuRGlydHk7XG4gIH1cbn1cblxuZnVuY3Rpb24gaXNEaXJ0eShjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgaW5kZXg6IG51bWJlcik6IGJvb2xlYW4ge1xuICBjb25zdCBhZGp1c3RlZEluZGV4ID1cbiAgICAgIGluZGV4ID49IFN0eWxpbmdJbmRleC5TaW5nbGVTdHlsZXNTdGFydFBvc2l0aW9uID8gKGluZGV4ICsgU3R5bGluZ0luZGV4LkZsYWdzT2Zmc2V0KSA6IGluZGV4O1xuICByZXR1cm4gKChjb250ZXh0W2FkanVzdGVkSW5kZXhdIGFzIG51bWJlcikgJiBTdHlsaW5nRmxhZ3MuRGlydHkpID09IFN0eWxpbmdGbGFncy5EaXJ0eTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzQ2xhc3NCYXNlZChjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgaW5kZXg6IG51bWJlcik6IGJvb2xlYW4ge1xuICBjb25zdCBhZGp1c3RlZEluZGV4ID1cbiAgICAgIGluZGV4ID49IFN0eWxpbmdJbmRleC5TaW5nbGVTdHlsZXNTdGFydFBvc2l0aW9uID8gKGluZGV4ICsgU3R5bGluZ0luZGV4LkZsYWdzT2Zmc2V0KSA6IGluZGV4O1xuICByZXR1cm4gKChjb250ZXh0W2FkanVzdGVkSW5kZXhdIGFzIG51bWJlcikgJiBTdHlsaW5nRmxhZ3MuQ2xhc3MpID09IFN0eWxpbmdGbGFncy5DbGFzcztcbn1cblxuZnVuY3Rpb24gaXNTYW5pdGl6YWJsZShjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgaW5kZXg6IG51bWJlcik6IGJvb2xlYW4ge1xuICBjb25zdCBhZGp1c3RlZEluZGV4ID1cbiAgICAgIGluZGV4ID49IFN0eWxpbmdJbmRleC5TaW5nbGVTdHlsZXNTdGFydFBvc2l0aW9uID8gKGluZGV4ICsgU3R5bGluZ0luZGV4LkZsYWdzT2Zmc2V0KSA6IGluZGV4O1xuICByZXR1cm4gKChjb250ZXh0W2FkanVzdGVkSW5kZXhdIGFzIG51bWJlcikgJiBTdHlsaW5nRmxhZ3MuU2FuaXRpemUpID09IFN0eWxpbmdGbGFncy5TYW5pdGl6ZTtcbn1cblxuZnVuY3Rpb24gcG9pbnRlcnMoY29uZmlnRmxhZzogbnVtYmVyLCBzdGF0aWNJbmRleDogbnVtYmVyLCBkeW5hbWljSW5kZXg6IG51bWJlcikge1xuICByZXR1cm4gKGNvbmZpZ0ZsYWcgJiBTdHlsaW5nRmxhZ3MuQml0TWFzaykgfCAoc3RhdGljSW5kZXggPDwgU3R5bGluZ0ZsYWdzLkJpdENvdW50U2l6ZSkgfFxuICAgICAgKGR5bmFtaWNJbmRleCA8PCAoU3R5bGluZ0luZGV4LkJpdENvdW50U2l6ZSArIFN0eWxpbmdGbGFncy5CaXRDb3VudFNpemUpKTtcbn1cblxuZnVuY3Rpb24gZ2V0SW5pdGlhbFZhbHVlKGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBmbGFnOiBudW1iZXIpOiBzdHJpbmd8bnVsbCB7XG4gIGNvbnN0IGluZGV4ID0gZ2V0SW5pdGlhbEluZGV4KGZsYWcpO1xuICByZXR1cm4gY29udGV4dFtTdHlsaW5nSW5kZXguSW5pdGlhbFN0eWxlc1Bvc2l0aW9uXVtpbmRleF0gYXMgbnVsbCB8IHN0cmluZztcbn1cblxuZnVuY3Rpb24gZ2V0SW5pdGlhbEluZGV4KGZsYWc6IG51bWJlcik6IG51bWJlciB7XG4gIHJldHVybiAoZmxhZyA+PiBTdHlsaW5nRmxhZ3MuQml0Q291bnRTaXplKSAmIFN0eWxpbmdJbmRleC5CaXRNYXNrO1xufVxuXG5mdW5jdGlvbiBnZXRNdWx0aU9yU2luZ2xlSW5kZXgoZmxhZzogbnVtYmVyKTogbnVtYmVyIHtcbiAgY29uc3QgaW5kZXggPVxuICAgICAgKGZsYWcgPj4gKFN0eWxpbmdJbmRleC5CaXRDb3VudFNpemUgKyBTdHlsaW5nRmxhZ3MuQml0Q291bnRTaXplKSkgJiBTdHlsaW5nSW5kZXguQml0TWFzaztcbiAgcmV0dXJuIGluZGV4ID49IFN0eWxpbmdJbmRleC5TaW5nbGVTdHlsZXNTdGFydFBvc2l0aW9uID8gaW5kZXggOiAtMTtcbn1cblxuZnVuY3Rpb24gZ2V0TXVsdGlTdGFydEluZGV4KGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0KTogbnVtYmVyIHtcbiAgcmV0dXJuIGdldE11bHRpT3JTaW5nbGVJbmRleChjb250ZXh0W1N0eWxpbmdJbmRleC5NYXN0ZXJGbGFnUG9zaXRpb25dKSBhcyBudW1iZXI7XG59XG5cbmZ1bmN0aW9uIGdldFN0eWxlU2FuaXRpemVyKGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0KTogU3R5bGVTYW5pdGl6ZUZufG51bGwge1xuICByZXR1cm4gY29udGV4dFtTdHlsaW5nSW5kZXguU3R5bGVTYW5pdGl6ZXJQb3NpdGlvbl07XG59XG5cbmZ1bmN0aW9uIHNldFByb3AoY29udGV4dDogU3R5bGluZ0NvbnRleHQsIGluZGV4OiBudW1iZXIsIHByb3A6IHN0cmluZykge1xuICBjb250ZXh0W2luZGV4ICsgU3R5bGluZ0luZGV4LlByb3BlcnR5T2Zmc2V0XSA9IHByb3A7XG59XG5cbmZ1bmN0aW9uIHNldFZhbHVlKGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBpbmRleDogbnVtYmVyLCB2YWx1ZTogc3RyaW5nIHwgbnVsbCB8IGJvb2xlYW4pIHtcbiAgY29udGV4dFtpbmRleCArIFN0eWxpbmdJbmRleC5WYWx1ZU9mZnNldF0gPSB2YWx1ZTtcbn1cblxuZnVuY3Rpb24gaGFzUGxheWVyQnVpbGRlckNoYW5nZWQoXG4gICAgY29udGV4dDogU3R5bGluZ0NvbnRleHQsIGJ1aWxkZXI6IENsYXNzQW5kU3R5bGVQbGF5ZXJCdWlsZGVyPGFueT58IG51bGwsIGluZGV4OiBudW1iZXIpIHtcbiAgY29uc3QgcGxheWVyQ29udGV4dCA9IGNvbnRleHRbU3R5bGluZ0luZGV4LlBsYXllckNvbnRleHRdICE7XG4gIGlmIChidWlsZGVyKSB7XG4gICAgaWYgKCFwbGF5ZXJDb250ZXh0IHx8IGluZGV4ID09PSAwKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH0gZWxzZSBpZiAoIXBsYXllckNvbnRleHQpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgcmV0dXJuIHBsYXllckNvbnRleHRbaW5kZXhdICE9PSBidWlsZGVyO1xufVxuXG5mdW5jdGlvbiBzZXRQbGF5ZXJCdWlsZGVyKFxuICAgIGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBidWlsZGVyOiBDbGFzc0FuZFN0eWxlUGxheWVyQnVpbGRlcjxhbnk+fCBudWxsLFxuICAgIGluc2VydGlvbkluZGV4OiBudW1iZXIpOiBudW1iZXIge1xuICBsZXQgcGxheWVyQ29udGV4dCA9IGNvbnRleHRbU3R5bGluZ0luZGV4LlBsYXllckNvbnRleHRdIHx8IGFsbG9jUGxheWVyQ29udGV4dChjb250ZXh0KTtcbiAgaWYgKGluc2VydGlvbkluZGV4ID4gMCkge1xuICAgIHBsYXllckNvbnRleHRbaW5zZXJ0aW9uSW5kZXhdID0gYnVpbGRlcjtcbiAgfSBlbHNlIHtcbiAgICBpbnNlcnRpb25JbmRleCA9IHBsYXllckNvbnRleHRbUGxheWVySW5kZXguTm9uQnVpbGRlclBsYXllcnNTdGFydF07XG4gICAgcGxheWVyQ29udGV4dC5zcGxpY2UoaW5zZXJ0aW9uSW5kZXgsIDAsIGJ1aWxkZXIsIG51bGwpO1xuICAgIHBsYXllckNvbnRleHRbUGxheWVySW5kZXguTm9uQnVpbGRlclBsYXllcnNTdGFydF0gKz1cbiAgICAgICAgUGxheWVySW5kZXguUGxheWVyQW5kUGxheWVyQnVpbGRlcnNUdXBsZVNpemU7XG4gIH1cbiAgcmV0dXJuIGluc2VydGlvbkluZGV4O1xufVxuXG5mdW5jdGlvbiBzZXRQbGF5ZXJCdWlsZGVySW5kZXgoY29udGV4dDogU3R5bGluZ0NvbnRleHQsIGluZGV4OiBudW1iZXIsIHBsYXllckJ1aWxkZXJJbmRleDogbnVtYmVyKSB7XG4gIGNvbnRleHRbaW5kZXggKyBTdHlsaW5nSW5kZXguUGxheWVyQnVpbGRlckluZGV4T2Zmc2V0XSA9IHBsYXllckJ1aWxkZXJJbmRleDtcbn1cblxuZnVuY3Rpb24gZ2V0UGxheWVyQnVpbGRlckluZGV4KGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBpbmRleDogbnVtYmVyKTogbnVtYmVyIHtcbiAgcmV0dXJuIChjb250ZXh0W2luZGV4ICsgU3R5bGluZ0luZGV4LlBsYXllckJ1aWxkZXJJbmRleE9mZnNldF0gYXMgbnVtYmVyKSB8fCAwO1xufVxuXG5mdW5jdGlvbiBnZXRQbGF5ZXJCdWlsZGVyKGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBpbmRleDogbnVtYmVyKTogQ2xhc3NBbmRTdHlsZVBsYXllckJ1aWxkZXI8YW55PnxcbiAgICBudWxsIHtcbiAgY29uc3QgcGxheWVyQnVpbGRlckluZGV4ID0gZ2V0UGxheWVyQnVpbGRlckluZGV4KGNvbnRleHQsIGluZGV4KTtcbiAgaWYgKHBsYXllckJ1aWxkZXJJbmRleCkge1xuICAgIGNvbnN0IHBsYXllckNvbnRleHQgPSBjb250ZXh0W1N0eWxpbmdJbmRleC5QbGF5ZXJDb250ZXh0XTtcbiAgICBpZiAocGxheWVyQ29udGV4dCkge1xuICAgICAgcmV0dXJuIHBsYXllckNvbnRleHRbcGxheWVyQnVpbGRlckluZGV4XSBhcyBDbGFzc0FuZFN0eWxlUGxheWVyQnVpbGRlcjxhbnk+fCBudWxsO1xuICAgIH1cbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuZnVuY3Rpb24gc2V0RmxhZyhjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgaW5kZXg6IG51bWJlciwgZmxhZzogbnVtYmVyKSB7XG4gIGNvbnN0IGFkanVzdGVkSW5kZXggPVxuICAgICAgaW5kZXggPT09IFN0eWxpbmdJbmRleC5NYXN0ZXJGbGFnUG9zaXRpb24gPyBpbmRleCA6IChpbmRleCArIFN0eWxpbmdJbmRleC5GbGFnc09mZnNldCk7XG4gIGNvbnRleHRbYWRqdXN0ZWRJbmRleF0gPSBmbGFnO1xufVxuXG5mdW5jdGlvbiBnZXRQb2ludGVycyhjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgaW5kZXg6IG51bWJlcik6IG51bWJlciB7XG4gIGNvbnN0IGFkanVzdGVkSW5kZXggPVxuICAgICAgaW5kZXggPT09IFN0eWxpbmdJbmRleC5NYXN0ZXJGbGFnUG9zaXRpb24gPyBpbmRleCA6IChpbmRleCArIFN0eWxpbmdJbmRleC5GbGFnc09mZnNldCk7XG4gIHJldHVybiBjb250ZXh0W2FkanVzdGVkSW5kZXhdIGFzIG51bWJlcjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFZhbHVlKGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBpbmRleDogbnVtYmVyKTogc3RyaW5nfGJvb2xlYW58bnVsbCB7XG4gIHJldHVybiBjb250ZXh0W2luZGV4ICsgU3R5bGluZ0luZGV4LlZhbHVlT2Zmc2V0XSBhcyBzdHJpbmcgfCBib29sZWFuIHwgbnVsbDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFByb3AoY29udGV4dDogU3R5bGluZ0NvbnRleHQsIGluZGV4OiBudW1iZXIpOiBzdHJpbmcge1xuICByZXR1cm4gY29udGV4dFtpbmRleCArIFN0eWxpbmdJbmRleC5Qcm9wZXJ0eU9mZnNldF0gYXMgc3RyaW5nO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNDb250ZXh0RGlydHkoY29udGV4dDogU3R5bGluZ0NvbnRleHQpOiBib29sZWFuIHtcbiAgcmV0dXJuIGlzRGlydHkoY29udGV4dCwgU3R5bGluZ0luZGV4Lk1hc3RlckZsYWdQb3NpdGlvbik7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBsaW1pdFRvU2luZ2xlQ2xhc3Nlcyhjb250ZXh0OiBTdHlsaW5nQ29udGV4dCkge1xuICByZXR1cm4gY29udGV4dFtTdHlsaW5nSW5kZXguTWFzdGVyRmxhZ1Bvc2l0aW9uXSAmIFN0eWxpbmdGbGFncy5Pbmx5UHJvY2Vzc1NpbmdsZUNsYXNzZXM7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRDb250ZXh0RGlydHkoY29udGV4dDogU3R5bGluZ0NvbnRleHQsIGlzRGlydHlZZXM6IGJvb2xlYW4pOiB2b2lkIHtcbiAgc2V0RGlydHkoY29udGV4dCwgU3R5bGluZ0luZGV4Lk1hc3RlckZsYWdQb3NpdGlvbiwgaXNEaXJ0eVllcyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRDb250ZXh0UGxheWVyc0RpcnR5KGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBpc0RpcnR5WWVzOiBib29sZWFuKTogdm9pZCB7XG4gIGlmIChpc0RpcnR5WWVzKSB7XG4gICAgKGNvbnRleHRbU3R5bGluZ0luZGV4Lk1hc3RlckZsYWdQb3NpdGlvbl0gYXMgbnVtYmVyKSB8PSBTdHlsaW5nRmxhZ3MuUGxheWVyQnVpbGRlcnNEaXJ0eTtcbiAgfSBlbHNlIHtcbiAgICAoY29udGV4dFtTdHlsaW5nSW5kZXguTWFzdGVyRmxhZ1Bvc2l0aW9uXSBhcyBudW1iZXIpICY9IH5TdHlsaW5nRmxhZ3MuUGxheWVyQnVpbGRlcnNEaXJ0eTtcbiAgfVxufVxuXG5mdW5jdGlvbiBmaW5kRW50cnlQb3NpdGlvbkJ5UHJvcChcbiAgICBjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgcHJvcDogc3RyaW5nLCBzdGFydEluZGV4PzogbnVtYmVyKTogbnVtYmVyIHtcbiAgZm9yIChsZXQgaSA9IChzdGFydEluZGV4IHx8IDApICsgU3R5bGluZ0luZGV4LlByb3BlcnR5T2Zmc2V0OyBpIDwgY29udGV4dC5sZW5ndGg7XG4gICAgICAgaSArPSBTdHlsaW5nSW5kZXguU2l6ZSkge1xuICAgIGNvbnN0IHRoaXNQcm9wID0gY29udGV4dFtpXTtcbiAgICBpZiAodGhpc1Byb3AgPT0gcHJvcCkge1xuICAgICAgcmV0dXJuIGkgLSBTdHlsaW5nSW5kZXguUHJvcGVydHlPZmZzZXQ7XG4gICAgfVxuICB9XG4gIHJldHVybiAtMTtcbn1cblxuZnVuY3Rpb24gc3dhcE11bHRpQ29udGV4dEVudHJpZXMoY29udGV4dDogU3R5bGluZ0NvbnRleHQsIGluZGV4QTogbnVtYmVyLCBpbmRleEI6IG51bWJlcikge1xuICBjb25zdCB0bXBWYWx1ZSA9IGdldFZhbHVlKGNvbnRleHQsIGluZGV4QSk7XG4gIGNvbnN0IHRtcFByb3AgPSBnZXRQcm9wKGNvbnRleHQsIGluZGV4QSk7XG4gIGNvbnN0IHRtcEZsYWcgPSBnZXRQb2ludGVycyhjb250ZXh0LCBpbmRleEEpO1xuICBjb25zdCB0bXBQbGF5ZXJCdWlsZGVySW5kZXggPSBnZXRQbGF5ZXJCdWlsZGVySW5kZXgoY29udGV4dCwgaW5kZXhBKTtcblxuICBsZXQgZmxhZ0EgPSB0bXBGbGFnO1xuICBsZXQgZmxhZ0IgPSBnZXRQb2ludGVycyhjb250ZXh0LCBpbmRleEIpO1xuXG4gIGNvbnN0IHNpbmdsZUluZGV4QSA9IGdldE11bHRpT3JTaW5nbGVJbmRleChmbGFnQSk7XG4gIGlmIChzaW5nbGVJbmRleEEgPj0gMCkge1xuICAgIGNvbnN0IF9mbGFnID0gZ2V0UG9pbnRlcnMoY29udGV4dCwgc2luZ2xlSW5kZXhBKTtcbiAgICBjb25zdCBfaW5pdGlhbCA9IGdldEluaXRpYWxJbmRleChfZmxhZyk7XG4gICAgc2V0RmxhZyhjb250ZXh0LCBzaW5nbGVJbmRleEEsIHBvaW50ZXJzKF9mbGFnLCBfaW5pdGlhbCwgaW5kZXhCKSk7XG4gIH1cblxuICBjb25zdCBzaW5nbGVJbmRleEIgPSBnZXRNdWx0aU9yU2luZ2xlSW5kZXgoZmxhZ0IpO1xuICBpZiAoc2luZ2xlSW5kZXhCID49IDApIHtcbiAgICBjb25zdCBfZmxhZyA9IGdldFBvaW50ZXJzKGNvbnRleHQsIHNpbmdsZUluZGV4Qik7XG4gICAgY29uc3QgX2luaXRpYWwgPSBnZXRJbml0aWFsSW5kZXgoX2ZsYWcpO1xuICAgIHNldEZsYWcoY29udGV4dCwgc2luZ2xlSW5kZXhCLCBwb2ludGVycyhfZmxhZywgX2luaXRpYWwsIGluZGV4QSkpO1xuICB9XG5cbiAgc2V0VmFsdWUoY29udGV4dCwgaW5kZXhBLCBnZXRWYWx1ZShjb250ZXh0LCBpbmRleEIpKTtcbiAgc2V0UHJvcChjb250ZXh0LCBpbmRleEEsIGdldFByb3AoY29udGV4dCwgaW5kZXhCKSk7XG4gIHNldEZsYWcoY29udGV4dCwgaW5kZXhBLCBnZXRQb2ludGVycyhjb250ZXh0LCBpbmRleEIpKTtcbiAgc2V0UGxheWVyQnVpbGRlckluZGV4KGNvbnRleHQsIGluZGV4QSwgZ2V0UGxheWVyQnVpbGRlckluZGV4KGNvbnRleHQsIGluZGV4QikpO1xuXG4gIHNldFZhbHVlKGNvbnRleHQsIGluZGV4QiwgdG1wVmFsdWUpO1xuICBzZXRQcm9wKGNvbnRleHQsIGluZGV4QiwgdG1wUHJvcCk7XG4gIHNldEZsYWcoY29udGV4dCwgaW5kZXhCLCB0bXBGbGFnKTtcbiAgc2V0UGxheWVyQnVpbGRlckluZGV4KGNvbnRleHQsIGluZGV4QiwgdG1wUGxheWVyQnVpbGRlckluZGV4KTtcbn1cblxuZnVuY3Rpb24gdXBkYXRlU2luZ2xlUG9pbnRlclZhbHVlcyhjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgaW5kZXhTdGFydFBvc2l0aW9uOiBudW1iZXIpIHtcbiAgZm9yIChsZXQgaSA9IGluZGV4U3RhcnRQb3NpdGlvbjsgaSA8IGNvbnRleHQubGVuZ3RoOyBpICs9IFN0eWxpbmdJbmRleC5TaXplKSB7XG4gICAgY29uc3QgbXVsdGlGbGFnID0gZ2V0UG9pbnRlcnMoY29udGV4dCwgaSk7XG4gICAgY29uc3Qgc2luZ2xlSW5kZXggPSBnZXRNdWx0aU9yU2luZ2xlSW5kZXgobXVsdGlGbGFnKTtcbiAgICBpZiAoc2luZ2xlSW5kZXggPiAwKSB7XG4gICAgICBjb25zdCBzaW5nbGVGbGFnID0gZ2V0UG9pbnRlcnMoY29udGV4dCwgc2luZ2xlSW5kZXgpO1xuICAgICAgY29uc3QgaW5pdGlhbEluZGV4Rm9yU2luZ2xlID0gZ2V0SW5pdGlhbEluZGV4KHNpbmdsZUZsYWcpO1xuICAgICAgY29uc3QgZmxhZ1ZhbHVlID0gKGlzRGlydHkoY29udGV4dCwgc2luZ2xlSW5kZXgpID8gU3R5bGluZ0ZsYWdzLkRpcnR5IDogU3R5bGluZ0ZsYWdzLk5vbmUpIHxcbiAgICAgICAgICAoaXNDbGFzc0Jhc2VkKGNvbnRleHQsIHNpbmdsZUluZGV4KSA/IFN0eWxpbmdGbGFncy5DbGFzcyA6IFN0eWxpbmdGbGFncy5Ob25lKSB8XG4gICAgICAgICAgKGlzU2FuaXRpemFibGUoY29udGV4dCwgc2luZ2xlSW5kZXgpID8gU3R5bGluZ0ZsYWdzLlNhbml0aXplIDogU3R5bGluZ0ZsYWdzLk5vbmUpO1xuICAgICAgY29uc3QgdXBkYXRlZEZsYWcgPSBwb2ludGVycyhmbGFnVmFsdWUsIGluaXRpYWxJbmRleEZvclNpbmdsZSwgaSk7XG4gICAgICBzZXRGbGFnKGNvbnRleHQsIHNpbmdsZUluZGV4LCB1cGRhdGVkRmxhZyk7XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGluc2VydE5ld011bHRpUHJvcGVydHkoXG4gICAgY29udGV4dDogU3R5bGluZ0NvbnRleHQsIGluZGV4OiBudW1iZXIsIGNsYXNzQmFzZWQ6IGJvb2xlYW4sIG5hbWU6IHN0cmluZywgZmxhZzogbnVtYmVyLFxuICAgIHZhbHVlOiBzdHJpbmcgfCBib29sZWFuLCBwbGF5ZXJJbmRleDogbnVtYmVyKTogdm9pZCB7XG4gIGNvbnN0IGRvU2hpZnQgPSBpbmRleCA8IGNvbnRleHQubGVuZ3RoO1xuXG4gIC8vIHByb3AgZG9lcyBub3QgZXhpc3QgaW4gdGhlIGxpc3QsIGFkZCBpdCBpblxuICBjb250ZXh0LnNwbGljZShcbiAgICAgIGluZGV4LCAwLCBmbGFnIHwgU3R5bGluZ0ZsYWdzLkRpcnR5IHwgKGNsYXNzQmFzZWQgPyBTdHlsaW5nRmxhZ3MuQ2xhc3MgOiBTdHlsaW5nRmxhZ3MuTm9uZSksXG4gICAgICBuYW1lLCB2YWx1ZSwgcGxheWVySW5kZXgpO1xuXG4gIGlmIChkb1NoaWZ0KSB7XG4gICAgLy8gYmVjYXVzZSB0aGUgdmFsdWUgd2FzIGluc2VydGVkIG1pZHdheSBpbnRvIHRoZSBhcnJheSB0aGVuIHdlXG4gICAgLy8gbmVlZCB0byB1cGRhdGUgYWxsIHRoZSBzaGlmdGVkIG11bHRpIHZhbHVlcycgc2luZ2xlIHZhbHVlXG4gICAgLy8gcG9pbnRlcnMgdG8gcG9pbnQgdG8gdGhlIG5ld2x5IHNoaWZ0ZWQgbG9jYXRpb25cbiAgICB1cGRhdGVTaW5nbGVQb2ludGVyVmFsdWVzKGNvbnRleHQsIGluZGV4ICsgU3R5bGluZ0luZGV4LlNpemUpO1xuICB9XG59XG5cbmZ1bmN0aW9uIHZhbHVlRXhpc3RzKHZhbHVlOiBzdHJpbmcgfCBudWxsIHwgYm9vbGVhbiwgaXNDbGFzc0Jhc2VkPzogYm9vbGVhbikge1xuICBpZiAoaXNDbGFzc0Jhc2VkKSB7XG4gICAgcmV0dXJuIHZhbHVlID8gdHJ1ZSA6IGZhbHNlO1xuICB9XG4gIHJldHVybiB2YWx1ZSAhPT0gbnVsbDtcbn1cblxuZnVuY3Rpb24gcHJlcGFyZUluaXRpYWxGbGFnKFxuICAgIG5hbWU6IHN0cmluZywgaXNDbGFzc0Jhc2VkOiBib29sZWFuLCBzYW5pdGl6ZXI/OiBTdHlsZVNhbml0aXplRm4gfCBudWxsKSB7XG4gIGlmIChpc0NsYXNzQmFzZWQpIHtcbiAgICByZXR1cm4gU3R5bGluZ0ZsYWdzLkNsYXNzO1xuICB9IGVsc2UgaWYgKHNhbml0aXplciAmJiBzYW5pdGl6ZXIobmFtZSkpIHtcbiAgICByZXR1cm4gU3R5bGluZ0ZsYWdzLlNhbml0aXplO1xuICB9XG4gIHJldHVybiBTdHlsaW5nRmxhZ3MuTm9uZTtcbn1cblxuZnVuY3Rpb24gaGFzVmFsdWVDaGFuZ2VkKFxuICAgIGZsYWc6IG51bWJlciwgYTogc3RyaW5nIHwgYm9vbGVhbiB8IG51bGwsIGI6IHN0cmluZyB8IGJvb2xlYW4gfCBudWxsKTogYm9vbGVhbiB7XG4gIGNvbnN0IGlzQ2xhc3NCYXNlZCA9IGZsYWcgJiBTdHlsaW5nRmxhZ3MuQ2xhc3M7XG4gIGNvbnN0IGhhc1ZhbHVlcyA9IGEgJiYgYjtcbiAgY29uc3QgdXNlc1Nhbml0aXplciA9IGZsYWcgJiBTdHlsaW5nRmxhZ3MuU2FuaXRpemU7XG4gIC8vIHRoZSB0b1N0cmluZygpIGNvbXBhcmlzb24gZW5zdXJlcyB0aGF0IGEgdmFsdWUgaXMgY2hlY2tlZFxuICAvLyAuLi4gb3RoZXJ3aXNlIChkdXJpbmcgc2FuaXRpemF0aW9uIGJ5cGFzc2luZykgdGhlID09PSBjb21wYXJzaW9uXG4gIC8vIHdvdWxkIGZhaWwgc2luY2UgYSBuZXcgU3RyaW5nKCkgaW5zdGFuY2UgaXMgY3JlYXRlZFxuICBpZiAoIWlzQ2xhc3NCYXNlZCAmJiBoYXNWYWx1ZXMgJiYgdXNlc1Nhbml0aXplcikge1xuICAgIC8vIHdlIGtub3cgZm9yIHN1cmUgd2UncmUgZGVhbGluZyB3aXRoIHN0cmluZ3MgYXQgdGhpcyBwb2ludFxuICAgIHJldHVybiAoYSBhcyBzdHJpbmcpLnRvU3RyaW5nKCkgIT09IChiIGFzIHN0cmluZykudG9TdHJpbmcoKTtcbiAgfVxuXG4gIC8vIGV2ZXJ5dGhpbmcgZWxzZSBpcyBzYWZlIHRvIGNoZWNrIHdpdGggYSBub3JtYWwgZXF1YWxpdHkgY2hlY2tcbiAgcmV0dXJuIGEgIT09IGI7XG59XG5cbmV4cG9ydCBjbGFzcyBDbGFzc0FuZFN0eWxlUGxheWVyQnVpbGRlcjxUPiBpbXBsZW1lbnRzIFBsYXllckJ1aWxkZXIge1xuICBwcml2YXRlIF92YWx1ZXM6IHtba2V5OiBzdHJpbmddOiBzdHJpbmcgfCBudWxsfSA9IHt9O1xuICBwcml2YXRlIF9kaXJ0eSA9IGZhbHNlO1xuICBwcml2YXRlIF9mYWN0b3J5OiBCb3VuZFBsYXllckZhY3Rvcnk8VD47XG5cbiAgY29uc3RydWN0b3IoZmFjdG9yeTogUGxheWVyRmFjdG9yeSwgcHJpdmF0ZSBfZWxlbWVudDogSFRNTEVsZW1lbnQsIHByaXZhdGUgX3R5cGU6IEJpbmRpbmdUeXBlKSB7XG4gICAgdGhpcy5fZmFjdG9yeSA9IGZhY3RvcnkgYXMgYW55O1xuICB9XG5cbiAgc2V0VmFsdWUocHJvcDogc3RyaW5nLCB2YWx1ZTogYW55KSB7XG4gICAgaWYgKHRoaXMuX3ZhbHVlc1twcm9wXSAhPT0gdmFsdWUpIHtcbiAgICAgIHRoaXMuX3ZhbHVlc1twcm9wXSA9IHZhbHVlO1xuICAgICAgdGhpcy5fZGlydHkgPSB0cnVlO1xuICAgIH1cbiAgfVxuXG4gIGJ1aWxkUGxheWVyKGN1cnJlbnRQbGF5ZXI6IFBsYXllcnxudWxsLCBpc0ZpcnN0UmVuZGVyOiBib29sZWFuKTogUGxheWVyfHVuZGVmaW5lZHxudWxsIHtcbiAgICAvLyBpZiBubyB2YWx1ZXMgaGF2ZSBiZWVuIHNldCBoZXJlIHRoZW4gdGhpcyBtZWFucyB0aGUgYmluZGluZyBkaWRuJ3RcbiAgICAvLyBjaGFuZ2UgYW5kIHRoZXJlZm9yZSB0aGUgYmluZGluZyB2YWx1ZXMgd2VyZSBub3QgdXBkYXRlZCB0aHJvdWdoXG4gICAgLy8gYHNldFZhbHVlYCB3aGljaCBtZWFucyBubyBuZXcgcGxheWVyIHdpbGwgYmUgcHJvdmlkZWQuXG4gICAgaWYgKHRoaXMuX2RpcnR5KSB7XG4gICAgICBjb25zdCBwbGF5ZXIgPSB0aGlzLl9mYWN0b3J5LmZuKFxuICAgICAgICAgIHRoaXMuX2VsZW1lbnQsIHRoaXMuX3R5cGUsIHRoaXMuX3ZhbHVlcyAhLCBpc0ZpcnN0UmVuZGVyLCBjdXJyZW50UGxheWVyIHx8IG51bGwpO1xuICAgICAgdGhpcy5fdmFsdWVzID0ge307XG4gICAgICB0aGlzLl9kaXJ0eSA9IGZhbHNlO1xuICAgICAgcmV0dXJuIHBsYXllcjtcbiAgICB9XG5cbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9XG59XG4iXX0=