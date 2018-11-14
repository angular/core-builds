/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,uselessCode} checked by tsc
 */
import { AUTO_STYLE } from './tokens';
/**
 * @param {?} element
 * @param {?} prop
 * @return {?}
 */
export function computeStyle(element, prop) {
    if (!window || !window.getComputedStyle)
        return '';
    /** @type {?} */
    const gcs = /** @type {?} */ (window.getComputedStyle(element));
    return readStyle(gcs, prop);
}
/**
 *
 * @param {?} element
 * @param {?=} cb
 * @return {?}
 */
export function applyReflow(element, cb) {
    /** @type {?} */
    const w = element.clientWidth + 1;
    cb && requestAnimationFrame(() => cb(w));
}
/**
 * @return {?}
 */
export function now() {
    return Date.now();
}
/** @type {?} */
const TIMING_REGEX = /^(-?[\.\d]+)(m?s)(?:\s+(-?[\.\d]+)(m?s))?(?:\s+([-a-z]+(?:\(.+?\))?))?$/i;
/**
 * @param {?} exp
 * @return {?}
 */
export function parseTimingExp(exp) {
    /** @type {?} */
    let duration = 0;
    /** @type {?} */
    let delay = 0;
    /** @type {?} */
    let easing = null;
    if (typeof exp === 'string') {
        /** @type {?} */
        const matches = exp.match(TIMING_REGEX);
        if (matches === null) {
            return { duration: 0, delay: 0, easing: '', fill: null };
        }
        duration = _convertTimeValueToMS(parseFloat(matches[1]), matches[2]);
        /** @type {?} */
        const delayMatch = matches[3];
        if (delayMatch != null) {
            delay = _convertTimeValueToMS(parseFloat(delayMatch), matches[4]);
        }
        /** @type {?} */
        const easingVal = matches[5];
        if (easingVal) {
            easing = easingVal;
        }
    }
    else if (typeof exp === 'number') {
        duration = exp;
    }
    else {
        /** @type {?} */
        const t = /** @type {?} */ (exp);
        duration = t.duration;
        delay = t.delay || 0;
        easing = t.easing || null;
    }
    return { duration, delay, easing, fill: null };
}
/** @type {?} */
const ONE_SECOND = 1000;
/**
 * @param {?} value
 * @param {?} unit
 * @return {?}
 */
function _convertTimeValueToMS(value, unit) {
    // only seconds are treated in a special way ...
    // otherwise it's assumed that milliseconds are used
    return unit == 's' ? value * ONE_SECOND : value;
}
/**
 * @param {?} element
 * @param {?} value
 * @return {?}
 */
export function applyTransition(element, value) {
    value ? element.style.setProperty('transition', value) :
        element.style.removeProperty('transition');
}
/**
 * @param {?} element
 * @param {?} prop
 * @return {?}
 */
export function readStyle(element, prop) {
    /** @type {?} */
    const styles = (element instanceof Element) ? element.style : element;
    return (/** @type {?} */ (styles))[prop] || styles.getPropertyValue(prop);
}
/**
 * @param {?} prop
 * @return {?}
 */
export function hyphenateProp(prop) {
    return prop.replace(/[a-z][A-Z]/g, value => `${value[0]}-${value[1].toLowerCase()}`);
}
/**
 * @param {?} element
 * @param {?} classes
 * @param {?=} revert
 * @param {?=} store
 * @return {?}
 */
export function applyClassChanges(element, classes, revert, store) {
    Object.keys(classes).forEach(className => {
        /** @type {?} */
        const bool = classes[className];
        element.classList.toggle(className, revert ? !bool : bool);
        if (store) {
            store[className] = revert ? false : true;
        }
    });
}
/**
 * @param {?} element
 * @param {?} styles
 * @param {?=} backupStyles
 * @param {?=} revert
 * @param {?=} preComputedStyles
 * @param {?=} store
 * @return {?}
 */
export function applyStyleChanges(element, styles, backupStyles, revert, preComputedStyles, store) {
    Object.keys(styles).forEach(prop => {
        /** @type {?} */
        let value = revert ? (backupStyles && backupStyles[prop]) : styles[prop];
        if (value && value === AUTO_STYLE) {
            value = preComputedStyles && preComputedStyles[prop] || '';
        }
        applyStyle(element, prop, value);
        if (store) {
            store[prop] = value || null;
        }
    });
}
/**
 * @param {?} element
 * @param {?} prop
 * @param {?} value
 * @return {?}
 */
export function applyStyle(element, prop, value) {
    if (value) {
        element.style.setProperty(prop, value);
    }
    else {
        element.style.removeProperty(prop);
    }
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvYW5pbWF0aW9ucy91dGlsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7QUFRQSxPQUFPLEVBQUMsVUFBVSxFQUFDLE1BQU0sVUFBVSxDQUFDOzs7Ozs7QUFFcEMsTUFBTSxVQUFVLFlBQVksQ0FBQyxPQUFvQixFQUFFLElBQVk7SUFDN0QsSUFBSSxDQUFDLE1BQU0sSUFBSSxDQUFDLE1BQU0sQ0FBQyxnQkFBZ0I7UUFBRSxPQUFPLEVBQUUsQ0FBQzs7SUFDbkQsTUFBTSxHQUFHLHFCQUFHLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLENBQVEsRUFBQztJQUNwRCxPQUFPLFNBQVMsQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUM7Q0FDN0I7Ozs7Ozs7QUFPRCxNQUFNLFVBQVUsV0FBVyxDQUFDLE9BQW9CLEVBQUUsRUFBcUM7O0lBRXJGLE1BQU0sQ0FBQyxHQUFHLE9BQU8sQ0FBQyxXQUFXLEdBQUcsQ0FBQyxDQUFDO0lBQ2xDLEVBQUUsSUFBSSxxQkFBcUIsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztDQUMxQzs7OztBQUVELE1BQU0sVUFBVSxHQUFHO0lBQ2pCLE9BQU8sSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO0NBQ25COztBQUVELE1BQU0sWUFBWSxHQUFHLDBFQUEwRSxDQUFDOzs7OztBQUNoRyxNQUFNLFVBQVUsY0FBYyxDQUFDLEdBQTZCOztJQUMxRCxJQUFJLFFBQVEsR0FBRyxDQUFDLENBQUM7O0lBQ2pCLElBQUksS0FBSyxHQUFHLENBQUMsQ0FBQzs7SUFDZCxJQUFJLE1BQU0sR0FBZ0IsSUFBSSxDQUFDO0lBQy9CLElBQUksT0FBTyxHQUFHLEtBQUssUUFBUSxFQUFFOztRQUMzQixNQUFNLE9BQU8sR0FBRyxHQUFHLENBQUMs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SUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDO0tBQ3hDO1NBQU07UUFDTCxPQUFPLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQztLQUNwQztDQUNGIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0IHtUaW1pbmd9IGZyb20gJy4vaW50ZXJmYWNlcyc7XG5pbXBvcnQge0FVVE9fU1RZTEV9IGZyb20gJy4vdG9rZW5zJztcblxuZXhwb3J0IGZ1bmN0aW9uIGNvbXB1dGVTdHlsZShlbGVtZW50OiBIVE1MRWxlbWVudCwgcHJvcDogc3RyaW5nKTogc3RyaW5nIHtcbiAgaWYgKCF3aW5kb3cgfHwgIXdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKSByZXR1cm4gJyc7XG4gIGNvbnN0IGdjcyA9IHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKGVsZW1lbnQpIGFzIGFueTtcbiAgcmV0dXJuIHJlYWRTdHlsZShnY3MsIHByb3ApO1xufVxuXG4vKipcbiAqXG4gKiBAcGFyYW0gZWxlbWVudFxuICogQHBhcmFtIGNiXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhcHBseVJlZmxvdyhlbGVtZW50OiBIVE1MRWxlbWVudCwgY2I/OiAoKHJlZmxvdzogbnVtYmVyKSA9PiBhbnkpIHwgbnVsbCkge1xuICAvLyBUT0RPIChtYXRza28pOiBtYWtlIHN1cmUgdGhpcyBkb2Vzbid0IGdldCBtaW5pZmllZFxuICBjb25zdCB3ID0gZWxlbWVudC5jbGllbnRXaWR0aCArIDE7XG4gIGNiICYmIHJlcXVlc3RBbmltYXRpb25GcmFtZSgoKSA9PiBjYih3KSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBub3coKTogbnVtYmVyIHtcbiAgcmV0dXJuIERhdGUubm93KCk7XG59XG5cbmNvbnN0IFRJTUlOR19SRUdFWCA9IC9eKC0/W1xcLlxcZF0rKShtP3MpKD86XFxzKygtP1tcXC5cXGRdKykobT9zKSk/KD86XFxzKyhbLWEtel0rKD86XFwoLis/XFwpKT8pKT8kL2k7XG5leHBvcnQgZnVuY3Rpb24gcGFyc2VUaW1pbmdFeHAoZXhwOiBzdHJpbmcgfCBudW1iZXIgfCBUaW1pbmcpOiBUaW1pbmcge1xuICBsZXQgZHVyYXRpb24gPSAwO1xuICBsZXQgZGVsYXkgPSAwO1xuICBsZXQgZWFzaW5nOiBzdHJpbmd8bnVsbCA9IG51bGw7XG4gIGlmICh0eXBlb2YgZXhwID09PSAnc3RyaW5nJykge1xuICAgIGNvbnN0IG1hdGNoZXMgPSBleHAubWF0Y2goVElNSU5HX1JFR0VYKTtcbiAgICBpZiAobWF0Y2hlcyA9PT0gbnVsbCkge1xuICAgICAgcmV0dXJuIHtkdXJhdGlvbjogMCwgZGVsYXk6IDAsIGVhc2luZzogJycsIGZpbGw6IG51bGx9O1xuICAgIH1cblxuICAgIGR1cmF0aW9uID0gX2NvbnZlcnRUaW1lVmFsdWVUb01TKHBhcnNlRmxvYXQobWF0Y2hlc1sxXSksIG1hdGNoZXNbMl0pO1xuXG4gICAgY29uc3QgZGVsYXlNYXRjaCA9IG1hdGNoZXNbM107XG4gICAgaWYgKGRlbGF5TWF0Y2ggIT0gbnVsbCkge1xuICAgICAgZGVsYXkgPSBfY29udmVydFRpbWVWYWx1ZVRvTVMocGFyc2VGbG9hdChkZWxheU1hdGNoKSwgbWF0Y2hlc1s0XSk7XG4gICAgfVxuXG4gICAgY29uc3QgZWFzaW5nVmFsID0gbWF0Y2hlc1s1XTtcbiAgICBpZiAoZWFzaW5nVmFsKSB7XG4gICAgICBlYXNpbmcgPSBlYXNpbmdWYWw7XG4gICAgfVxuICB9IGVsc2UgaWYgKHR5cGVvZiBleHAgPT09ICdudW1iZXInKSB7XG4gICAgZHVyYXRpb24gPSBleHA7XG4gIH0gZWxzZSB7XG4gICAgY29uc3QgdCA9IGV4cCBhcyBUaW1pbmc7XG4gICAgZHVyYXRpb24gPSB0LmR1cmF0aW9uO1xuICAgIGRlbGF5ID0gdC5kZWxheSB8fCAwO1xuICAgIGVhc2luZyA9IHQuZWFzaW5nIHx8IG51bGw7XG4gIH1cblxuICByZXR1cm4ge2R1cmF0aW9uLCBkZWxheSwgZWFzaW5nLCBmaWxsOiBudWxsfTtcbn1cblxuY29uc3QgT05FX1NFQ09ORCA9IDEwMDA7XG5cbmZ1bmN0aW9uIF9jb252ZXJ0VGltZVZhbHVlVG9NUyh2YWx1ZTogbnVtYmVyLCB1bml0OiBzdHJpbmcpOiBudW1iZXIge1xuICAvLyBvbmx5IHNlY29uZHMgYXJlIHRyZWF0ZWQgaW4gYSBzcGVjaWFsIHdheSAuLi5cbiAgLy8gb3RoZXJ3aXNlIGl0J3MgYXNzdW1lZCB0aGF0IG1pbGxpc2Vjb25kcyBhcmUgdXNlZFxuICByZXR1cm4gdW5pdCA9PSAncycgPyB2YWx1ZSAqIE9ORV9TRUNPTkQgOiB2YWx1ZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGFwcGx5VHJhbnNpdGlvbihlbGVtZW50OiBIVE1MRWxlbWVudCwgdmFsdWU6IHN0cmluZyB8IG51bGwpIHtcbiAgdmFsdWUgPyBlbGVtZW50LnN0eWxlLnNldFByb3BlcnR5KCd0cmFuc2l0aW9uJywgdmFsdWUpIDpcbiAgICAgICAgICBlbGVtZW50LnN0eWxlLnJlbW92ZVByb3BlcnR5KCd0cmFuc2l0aW9uJyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZWFkU3R5bGUoZWxlbWVudDogSFRNTEVsZW1lbnQgfCBDU1NTdHlsZURlY2xhcmF0aW9uLCBwcm9wOiBzdHJpbmcpIHtcbiAgY29uc3Qgc3R5bGVzID0gKGVsZW1lbnQgaW5zdGFuY2VvZiBFbGVtZW50KSA/IGVsZW1lbnQuc3R5bGUgOiBlbGVtZW50O1xuICByZXR1cm4gKHN0eWxlcyBhc3tba2V5OiBzdHJpbmddOiBhbnl9KVtwcm9wXSB8fCBzdHlsZXMuZ2V0UHJvcGVydHlWYWx1ZShwcm9wKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGh5cGhlbmF0ZVByb3AocHJvcDogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHByb3AucmVwbGFjZSgvW2Etel1bQS1aXS9nLCB2YWx1ZSA9PiBgJHt2YWx1ZVswXX0tJHt2YWx1ZVsxXS50b0xvd2VyQ2FzZSgpfWApO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYXBwbHlDbGFzc0NoYW5nZXMoXG4gICAgZWxlbWVudDogSFRNTEVsZW1lbnQsIGNsYXNzZXM6IHtba2V5OiBzdHJpbmddOiBib29sZWFufSwgcmV2ZXJ0PzogYm9vbGVhbixcbiAgICBzdG9yZT86IHtba2V5OiBzdHJpbmddOiBhbnl9IHwgbnVsbCkge1xuICBPYmplY3Qua2V5cyhjbGFzc2VzKS5mb3JFYWNoKGNsYXNzTmFtZSA9PiB7XG4gICAgY29uc3QgYm9vbCA9IGNsYXNzZXNbY2xhc3NOYW1lXTtcbiAgICBlbGVtZW50LmNsYXNzTGlzdC50b2dnbGUoY2xhc3NOYW1lLCByZXZlcnQgPyAhYm9vbCA6IGJvb2wpO1xuICAgIGlmIChzdG9yZSkge1xuICAgICAgc3RvcmVbY2xhc3NOYW1lXSA9IHJldmVydCA/IGZhbHNlIDogdHJ1ZTtcbiAgICB9XG4gIH0pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYXBwbHlTdHlsZUNoYW5nZXMoXG4gICAgZWxlbWVudDogSFRNTEVsZW1lbnQsIHN0eWxlczoge1trZXk6IHN0cmluZ106IGFueX0sIGJhY2t1cFN0eWxlcz86IHtba2V5OiBzdHJpbmddOiBhbnl9IHwgbnVsbCxcbiAgICByZXZlcnQ/OiBib29sZWFuLCBwcmVDb21wdXRlZFN0eWxlcz86IHtba2V5OiBzdHJpbmddOiBhbnl9IHwgbnVsbCxcbiAgICBzdG9yZT86IHtba2V5OiBzdHJpbmddOiBhbnl9IHwgbnVsbCkge1xuICBPYmplY3Qua2V5cyhzdHlsZXMpLmZvckVhY2gocHJvcCA9PiB7XG4gICAgbGV0IHZhbHVlID0gcmV2ZXJ0ID8gKGJhY2t1cFN0eWxlcyAmJiBiYWNrdXBTdHlsZXNbcHJvcF0pIDogc3R5bGVzW3Byb3BdO1xuICAgIGlmICh2YWx1ZSAmJiB2YWx1ZSA9PT0gQVVUT19TVFlMRSkge1xuICAgICAgdmFsdWUgPSBwcmVDb21wdXRlZFN0eWxlcyAmJiBwcmVDb21wdXRlZFN0eWxlc1twcm9wXSB8fCAnJztcbiAgICB9XG4gICAgYXBwbHlTdHlsZShlbGVtZW50LCBwcm9wLCB2YWx1ZSk7XG4gICAgaWYgKHN0b3JlKSB7XG4gICAgICBzdG9yZVtwcm9wXSA9IHZhbHVlIHx8IG51bGw7XG4gICAgfVxuICB9KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGFwcGx5U3R5bGUoZWxlbWVudDogSFRNTEVsZW1lbnQsIHByb3A6IHN0cmluZywgdmFsdWU6IHN0cmluZyB8IG51bGwpIHtcbiAgaWYgKHZhbHVlKSB7XG4gICAgZWxlbWVudC5zdHlsZS5zZXRQcm9wZXJ0eShwcm9wLCB2YWx1ZSk7XG4gIH0gZWxzZSB7XG4gICAgZWxlbWVudC5zdHlsZS5yZW1vdmVQcm9wZXJ0eShwcm9wKTtcbiAgfVxufVxuIl19