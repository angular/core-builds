/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { StringMapWrapper } from '../facade/collection';
import { isPresent } from '../facade/lang';
import { FILL_STYLE_FLAG } from './animation_constants';
import { AUTO_STYLE } from './metadata';
/**
 * @param {?} previousStyles
 * @param {?} newStyles
 * @param {?=} nullValue
 * @return {?}
 */
export function prepareFinalAnimationStyles(previousStyles, newStyles, nullValue = null) {
    const /** @type {?} */ finalStyles = {};
    Object.keys(newStyles).forEach(prop => {
        const /** @type {?} */ value = newStyles[prop];
        finalStyles[prop] = value == AUTO_STYLE ? nullValue : value.toString();
    });
    Object.keys(previousStyles).forEach(prop => {
        if (!isPresent(finalStyles[prop])) {
            finalStyles[prop] = nullValue;
        }
    });
    return finalStyles;
}
/**
 * @param {?} collectedStyles
 * @param {?} finalStateStyles
 * @param {?} keyframes
 * @return {?}
 */
export function balanceAnimationKeyframes(collectedStyles, finalStateStyles, keyframes) {
    const /** @type {?} */ limit = keyframes.length - 1;
    const /** @type {?} */ firstKeyframe = keyframes[0];
    // phase 1: copy all the styles from the first keyframe into the lookup map
    const /** @type {?} */ flatenedFirstKeyframeStyles = flattenStyles(firstKeyframe.styles.styles);
    const /** @type {?} */ extraFirstKeyframeStyles = {};
    let /** @type {?} */ hasExtraFirstStyles = false;
    Object.keys(collectedStyles).forEach(prop => {
        const /** @type {?} */ value = (collectedStyles[prop]);
        // if the style is already defined in the first keyframe then
        // we do not replace it.
        if (!flatenedFirstKeyframeStyles[prop]) {
            flatenedFirstKeyframeStyles[prop] = value;
            extraFirstKeyframeStyles[prop] = value;
            hasExtraFirstStyles = true;
        }
    });
    const /** @type {?} */ keyframeCollectedStyles = StringMapWrapper.merge({}, flatenedFirstKeyframeStyles);
    // phase 2: normalize the final keyframe
    const /** @type {?} */ finalKeyframe = keyframes[limit];
    finalKeyframe.styles.styles.unshift(finalStateStyles);
    const /** @type {?} */ flatenedFinalKeyframeStyles = flattenStyles(finalKeyframe.styles.styles);
    const /** @type {?} */ extraFinalKeyframeStyles = {};
    let /** @type {?} */ hasExtraFinalStyles = false;
    Object.keys(keyframeCollectedStyles).forEach(prop => {
        if (!isPresent(flatenedFinalKeyframeStyles[prop])) {
            extraFinalKeyframeStyles[prop] = AUTO_STYLE;
            hasExtraFinalStyles = true;
        }
    });
    if (hasExtraFinalStyles) {
        finalKeyframe.styles.styles.push(extraFinalKeyframeStyles);
    }
    Object.keys(flatenedFinalKeyframeStyles).forEach(prop => {
        if (!isPresent(flatenedFirstKeyframeStyles[prop])) {
            extraFirstKeyframeStyles[prop] = AUTO_STYLE;
            hasExtraFirstStyles = true;
        }
    });
    if (hasExtraFirstStyles) {
        firstKeyframe.styles.styles.push(extraFirstKeyframeStyles);
    }
    collectAndResolveStyles(collectedStyles, [finalStateStyles]);
    return keyframes;
}
/**
 * @param {?} styles
 * @return {?}
 */
export function clearStyles(styles) {
    const /** @type {?} */ finalStyles = {};
    Object.keys(styles).forEach(key => { finalStyles[key] = null; });
    return finalStyles;
}
/**
 * @param {?} collection
 * @param {?} styles
 * @return {?}
 */
export function collectAndResolveStyles(collection, styles) {
    return styles.map(entry => {
        const /** @type {?} */ stylesObj = {};
        Object.keys(entry).forEach(prop => {
            let /** @type {?} */ value = entry[prop];
            if (value == FILL_STYLE_FLAG) {
                value = collection[prop];
                if (!isPresent(value)) {
                    value = AUTO_STYLE;
                }
            }
            collection[prop] = value;
            stylesObj[prop] = value;
        });
        return stylesObj;
    });
}
/**
 * @param {?} element
 * @param {?} renderer
 * @param {?} styles
 * @return {?}
 */
export function renderStyles(element, renderer, styles) {
    Object.keys(styles).forEach(prop => { renderer.setElementStyle(element, prop, styles[prop]); });
}
/**
 * @param {?} styles
 * @return {?}
 */
export function flattenStyles(styles) {
    const /** @type {?} */ finalStyles = {};
    styles.forEach(entry => {
        Object.keys(entry).forEach(prop => { finalStyles[prop] = (entry[prop]); });
    });
    return finalStyles;
}
//# sourceMappingURL=animation_style_util.js.map