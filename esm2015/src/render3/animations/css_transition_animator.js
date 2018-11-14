/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,uselessCode} checked by tsc
 */
import { AUTO_STYLE } from './tokens';
import { applyClassChanges, applyStyle, applyStyleChanges, now, readStyle } from './util';
/** *
 * When ALL transitions are cancelled then the styling below
 * will force every transition arc to be interupted.
  @type {?} */
const CANCEL_ALL_TRANSITIONS_VALUE = '0s none';
/** *
 * This will force the very next styles that are applied to
 * be applied IMMEDIATELY to the element (so long as a reflow
 * is issued before the transition value is changed afterwards)
  @type {?} */
const CANCEL_NEXT_TRANSITION_VALUE = '0s all';
/** @enum {number} */
var InstructionType = {
    Snapshot: 1,
    Animation: 2,
};
/**
 * @record
 */
function Instruction() { }
/** @type {?} */
Instruction.prototype.effect;
/** @type {?} */
Instruction.prototype.type;
/** @type {?} */
Instruction.prototype.transitionStyle;
/**
 * @record
 */
function AnimationInstruction() { }
/** @type {?} */
AnimationInstruction.prototype.type;
/** @type {?} */
AnimationInstruction.prototype.styles;
/** @type {?} */
AnimationInstruction.prototype.classes;
/** @type {?} */
AnimationInstruction.prototype.computeStyles;
/** @type {?} */
AnimationInstruction.prototype.isPropMultiTransition;
/**
 * @record
 */
function SnapshotInstruction() { }
/** @type {?} */
SnapshotInstruction.prototype.type;
/** @type {?} */
SnapshotInstruction.prototype.computeStyles;
/** @type {?} */
const DEFAULT_TRANSITION_PROP = 'all';
/**
 * The CssTransitionAnimator is primarily (in modern browsers) used
 * to animate CSS class (which can ONLY be animated using transitions
 * and inline style transitions together in the same animation arcs.
 *
 * CSS transitions (when interfaced with in JavaScript) do not have a
 * straightforward API. The only way to detect if a transition ends
 * (when the animation finishes) is by use of the `transitionend` event.
 * Despite the event being supported by all browsers, the behavior of
 * the event is very limited because it will only fire on CSS property
 * changes and NOT on CSS class changes. This means that to properly rely
 * on the event then each of the CSS styles need to be known (which is
 * impossible to know upfront since CSS classes are hidden within CSS
 * stylesheets and may change based on media queries and DOM state).
 *
 * Despite this limitation, the transition animator class below still
 * uses uses the `transitionend` event to detect for animations that
 * end. It will wait for the largest-timed `transitionend` event to
 * fire and capture that and then end all the transitions afterwards.
 * For this to work, all the styles are classes are applied onto the
 * element using various, comma-separated transition strings (one for
 * each style/class effect that is added to the animator).
 *
 * The reason all classes/styles on the same element are combined together
 * into the animator for the same element are due to the following reasons:
 *
 * 1. To figure out what the maximum wait time is for the full transition
 *    and then to check against that after every `transitionend` event
 *    fires.
 * 2. To setup a `setTimeout` fallback that will fire in the event that
 *    `transitionend` fails to fire (which can happen if there are no
 *    styles set to animate due to a missing class or no style changes)
 * 3. To apply the transition timing styles one by one onto the element
 *    with a reflow frame in between (this causes one set of classes/styles
 *    to animate before another which inturn allows for multiple CSS
 *    transitions to fire on a single element at the same time).
 *
 * Once the animator starts and the transitions are applied, each
 * transition string value is applied in the following way.
 *
 * 1. Apply first transition (e.g. style="transition: 1s all")
 * 2. Apply the classes and/or styles present in the queued transition
 *    (this kicks off the transition for that given styles/classes effect)
 * 3. Run a reflow (which uses measurement computation + RAF)
 * 4. Then repeat from step 1 and apply the next transition effect
 *
 * Once the classes/styles and transition strings have all been applied
 * then the player code will wait for `transitionend` and will then
 * only finish the transition animation once the longest transition
 * animation has finished (or the timer runs out).
 *
 * Only once all the transitions are finished then the underlying transition
 * style string will be removed from the element.
 */
export class CssTransitionAnimator {
    /**
     * @param {?} _element
     * @param {?} _renderUtil
     * @param {?=} collectStyling
     */
    constructor(_element, _renderUtil, collectStyling) {
        this._element = _element;
        this._renderUtil = _renderUtil;
        this.state = 1 /* Idle */;
        this._listeners = [];
        this._pendingInstructions = [];
        this._activeAnimationInstructions = [];
        this._activeComputedStyles = null;
        this._startTime = 0;
        this._maxTime = 0;
        this._currentTransitionStr = '';
        this._waitingForFrameFns = [];
        this._lastTransitionToken = '';
        this._pendingFrame = false;
        this._captureFn = (event) => {
            /** @type {?} */
            const totalTime = event.timeStamp - this._startTime;
            if (event.target === this._element) {
                event.stopPropagation();
                if (totalTime >= this._maxTime) {
                    this._onAllEffectsFinished();
                }
            }
        };
        this._element.addEventListener('transitionend', this._captureFn, { capture: true });
        this._collectedClasses = collectStyling ? {} : null;
        this._collectedStyles = collectStyling ? {} : null;
    }
    /**
     * @param {?} cb
     * @return {?}
     */
    onAllEffectsDone(cb) { this._listeners.push(cb); }
    /**
     * @param {?} effect
     * @return {?}
     */
    addEffect(effect) {
        const { classes, timing } = effect;
        /** @type {?} */
        const time = this._computeTransitionTime(timing);
        this._maxTime = Math.max(this._maxTime, time);
        /** @type {?} */
        let computeStylesDuringEffect = null;
        /** @type {?} */
        let computeStylesBeforeEffect = null;
        /** @type {?} */
        let singleTransitionProp = null;
        /** @type {?} */
        let styles = null;
        if (effect.styles) {
            styles = {};
            computeStylesDuringEffect = [];
            computeStylesBeforeEffect = [];
            /** @type {?} */
            const props = Object.keys(effect.styles);
            singleTransitionProp = props.length == 1 ? props[0] : null;
            for (let i = 0; i < props.length; i++) {
                /** @type {?} */
                const prop = props[i];
                /** @type {?} */
                let value = effect.styles[prop];
                /** @type {?} */
                const computeStatus = determineWhetherToCompute(prop, value);
                switch (computeStatus) {
                    case -1:
                        computeStylesBeforeEffect.push(prop);
                        break;
                    case 1:
                        computeStylesDuringEffect.push(prop);
                        value = AUTO_STYLE;
                        break;
                }
                styles[prop] = value;
            }
        }
        /** @type {?} */
        const transitionProp = (!classes && singleTransitionProp) || DEFAULT_TRANSITION_PROP;
        if (computeStylesBeforeEffect && computeStylesBeforeEffect.length) {
            this._pendingInstructions.push(/** @type {?} */ ({
                effect, type: 1 /* Snapshot */, computeStyles: computeStylesBeforeEffect,
                transitionStyle: `0s ${transitionProp}`
            }));
        }
        /** @type {?} */
        const transitionStyle = buildTransitionStr(timing, transitionProp);
        this._pendingInstructions.push(/** @type {?} */ ({
            effect, type: 2 /* Animation */, styles, transitionStyle,
            classes: classes ? Object.assign({}, classes) : null,
            computeStyles: (computeStylesDuringEffect && /** @type {?} */ ((computeStylesDuringEffect)).length) ?
                computeStylesDuringEffect :
                null,
            isPropMultiTransition: transitionProp === DEFAULT_TRANSITION_PROP
        }));
    }
    /**
     * @param {?} timing
     * @return {?}
     */
    _computeTransitionTime(timing) {
        /** @type {?} */
        const elapsedTimeSoFar = this.state === 4 /* Running */ ? (now() - this._startTime) : 0;
        return elapsedTimeSoFar + timing.duration + timing.delay;
    }
    /**
     * @param {?} effect
     * @return {?}
     */
    finishEffect(effect) { this._finishOrDestroyEffect(effect, false); }
    /**
     * @param {?} effect
     * @return {?}
     */
    destroyEffect(effect) { this._finishOrDestroyEffect(effect, true); }
    /**
     * @param {?} effect
     * @param {?} destroy
     * @return {?}
     */
    _finishOrDestroyEffect(effect, destroy) {
        // we wait for a frame in the event that the effect (or any other effects)
        // have been scheduled to be flushed
        this._waitForFrame(() => {
            this._applyTransition(CANCEL_NEXT_TRANSITION_VALUE);
            this._applyStyling(effect, true);
            if (destroy) {
                this._waitForFrame(() => this._cleanupEffect(effect));
            }
            else {
                this._waitForFrame(() => {
                    this._applyStyling(effect);
                    this._waitForFrame(() => this._cleanupEffect(effect));
                });
            }
        });
    }
    /**
     * @param {?} computedStyles
     * @return {?}
     */
    _cleanupComputedStyles(computedStyles) {
        for (let i = 0; i < computedStyles.length; i++) {
            /** @type {?} */
            const prop = computedStyles[i];
            /** @type {?} */
            const computedValue = this._activeComputedStyles && this._activeComputedStyles[prop];
            /** @type {?} */
            const activeValue = readStyle(this._element, prop);
            if (computedValue && computedValue === activeValue) {
                /** @type {?} */ ((
                // if exactly the same then this means that the AUTO_STYLE was
                // the final styling for the element which means that it was never
                // intended to stick around once the animation is over
                this._activeComputedStyles))[prop] = null;
                applyStyle(this._element, prop, null);
            }
        }
    }
    /**
     * @param {?} effect
     * @return {?}
     */
    _cleanupEffect(effect) {
        /** @type {?} */
        const effectIndex = findMatchingEffect(this._activeAnimationInstructions, effect);
        if (effectIndex >= 0) {
            /** @type {?} */
            const activeEffect = this._activeAnimationInstructions[effectIndex];
            this._activeAnimationInstructions.splice(effectIndex, 1);
            if (activeEffect.computeStyles) {
                this._cleanupComputedStyles(activeEffect.computeStyles);
            }
        }
        this._flushNextEffect();
        /** @type {?} */
        const time = this._computeTransitionTime(effect.timing);
        if (time >= this._maxTime) {
            this._onAllEffectsFinished();
        }
    }
    /**
     * @param {?} effect
     * @param {?=} revert
     * @param {?=} preComputedStyles
     * @return {?}
     */
    _applyStyling(effect, revert, preComputedStyles) {
        effect.classes &&
            applyClassChanges(this._element, effect.classes, revert, this._collectedClasses);
        effect.styles &&
            applyStyleChanges(this._element, effect.styles, null, revert, preComputedStyles, this._collectedStyles);
    }
    /**
     * @param {?=} cb
     * @return {?}
     */
    _waitForFrame(cb) {
        if (!this._pendingFrame) {
            this._pendingFrame = true;
            /** @type {?} */
            let flushFn;
            this._renderUtil.fireReflow(this._element, flushFn = () => {
                this._pendingFrame = false;
                /** @type {?} */
                const length = this._waitingForFrameFns.length;
                for (let i = 0; i < length; i++) {
                    /** @type {?} */ ((this._waitingForFrameFns.shift()))();
                }
                if (this._waitingForFrameFns.length && !this._pendingFrame) {
                    this._pendingFrame = true;
                    this._renderUtil.fireReflow(this._element, flushFn);
                }
                else {
                    this._pendingFrame = false;
                }
            });
        }
        cb && this._waitingForFrameFns.push(cb);
    }
    /**
     * @param {?} instruction
     * @return {?}
     */
    _computeStyles(instruction) {
        /** @type {?} */
        const computeStyles = /** @type {?} */ ((instruction.computeStyles));
        /** @type {?} */
        const duration = instruction.effect.timing.duration;
        /** @type {?} */
        const currentStyles = {};
        computeStyles.forEach(prop => {
            currentStyles[prop] = this._renderUtil.getComputedStyle(this._element, prop);
            this._element.style.removeProperty(prop);
        });
        /** @type {?} */
        const propToBlock = computeStyles.length == 1 ? computeStyles[0] : DEFAULT_TRANSITION_PROP;
        /** @type {?} */
        const timing = { duration, delay: -duration, easing: null, fill: null };
        /** @type {?} */
        const transitionPrefix = this._currentTransitionStr + (this._currentTransitionStr.length ? ', ' : '');
        /** @type {?} */
        const transitionStr = transitionPrefix + buildTransitionStr(timing, propToBlock);
        this._renderUtil.setTransition(this._element, transitionStr);
        /** @type {?} */
        const computedStyles = {};
        computeStyles.forEach(prop => {
            /** @type {?} */ ((computedStyles))[prop] = this._renderUtil.getComputedStyle(this._element, prop);
            this._element.style.setProperty(prop, currentStyles[prop]);
        });
        this._renderUtil.fireReflow(this._element, null);
        return computedStyles;
    }
    /**
     * This method is responsible for applying each styles/class effect
     * onto the element with its associated transition timing string.
     *
     * The main point to take from this is that each effect MUST be applied
     * in between reflows so that the browser can kick off each style/class
     * rendering. Otherwise if everything is applied at once synchronously
     * then each subsequent class/style effect would be animated after the
     * last transition style is applied.
     *
     * It's pretty uncommon that multiple classes/styles are applied with
     * different transition timing values. Therefore it's only when this
     * occurs that reflows + requestAnimationFrame calls are used.
     * @return {?}
     */
    _flushNextEffect() {
        this.state = 3 /* ProcessingEffects */;
        /** @type {?} */
        let doIssueReflow = false;
        if (this._pendingInstructions.length) {
            /** @type {?} */
            const instruction = /** @type {?} */ ((this._pendingInstructions.shift()));
            if (instruction.type === 1 /* Snapshot */) {
                /** @type {?} */
                const stylesToCompute = (/** @type {?} */ (instruction)).computeStyles;
                for (let i = 0; i < stylesToCompute.length; i++) {
                    /** @type {?} */
                    const prop = stylesToCompute[i];
                    /** @type {?} */
                    let value = readStyle(this._element, prop);
                    if (!value) {
                        value = this._renderUtil.getComputedStyle(this._element, prop);
                        applyStyle(this._element, prop, value);
                        doIssueReflow = true;
                    }
                }
                if (doIssueReflow) {
                    // if all computed styles were detected directly on the element
                    // then there is no need to trigger a reflow to run since there
                    // was no style computation. This means the next instruction can
                    // immediately take place.
                    this._applyTransition(instruction.transitionStyle);
                }
            }
            else if (instruction.type === 2 /* Animation */) {
                /** @type {?} */
                const animationInstruction = /** @type {?} */ (instruction);
                /** @type {?} */
                const computedStyles = animationInstruction.computeStyles ? this._computeStyles(animationInstruction) : null;
                if (computedStyles || animationInstruction.transitionStyle != this._lastTransitionToken) {
                    this._applyTransition(animationInstruction.transitionStyle);
                    if (computedStyles) {
                        this._activeComputedStyles =
                            Object.assign(this._activeComputedStyles || {}, computedStyles);
                    }
                }
                this._applyStyling(animationInstruction, false, computedStyles);
                this._activeAnimationInstructions.push(animationInstruction);
                doIssueReflow = animationInstruction.isPropMultiTransition;
            }
        }
        // all the effects have been applied ... Now set the element
        // into place so that a follow-up transition can be applied
        if (this._pendingInstructions.length) {
            if (doIssueReflow) {
                this._renderUtil.fireReflow(this._element, () => this._flushNextEffect());
            }
            else {
                this._flushNextEffect();
            }
        }
        else {
            this.state = 4 /* Running */;
        }
    }
    /**
     * @param {?} transitionToken
     * @return {?}
     */
    _applyTransition(transitionToken) {
        this._lastTransitionToken = transitionToken;
        /** @type {?} */
        const transitionPrefix = this._currentTransitionStr + (this._currentTransitionStr.length ? ', ' : '');
        this._currentTransitionStr = transitionPrefix + transitionToken;
        this._renderUtil.setTransition(this._element, this._currentTransitionStr);
    }
    /**
     * @return {?}
     */
    _updateTimer() {
        // Sometimes a transition animation may not animate anything at all
        // due to missing classes or there being zero change in styling (
        // the element already has the same styling that is being animated).
        // There is no way for JS code to detect for this and the ONLY way
        // to gaurantee that the player finishes is to setup a timer that acts
        // as a fallback incase this happens. The reason way the variable below
        // has an extra buffer value is because the browser usually isn't quick
        // enough to trigger a transition and fire the ending callback in the
        // exact amount of time that the transition lasts for (therefore the
        // buffer allows for the animation to properly do its job in time).
        if (this._timer) {
            this._renderUtil ? this._renderUtil.clearTimeout(this._timer) : clearTimeout(this._timer);
        }
        /** @type {?} */
        const HALF_A_SECOND = 500;
        /** @type {?} */
        const maxTimeWithBuffer = this._maxTime + HALF_A_SECOND;
        /** @type {?} */
        const cb = () => this._onAllEffectsFinished();
        this._timer = this._renderUtil ? this._renderUtil.setTimeout(cb, maxTimeWithBuffer) :
            setTimeout(cb, maxTimeWithBuffer);
    }
    /**
     * @return {?}
     */
    _onAllEffectsFinished() {
        if (this.state >= 4 /* Running */ && this.state <= 5 /* Exiting */) {
            if (this._activeComputedStyles) {
                this._cleanupComputedStyles(Object.keys(this._activeComputedStyles));
                this._activeComputedStyles = null;
            }
            this._maxTime = 0;
            this._currentTransitionStr = '';
            this._lastTransitionToken = '';
            this._activeAnimationInstructions.length = 0;
            this._renderUtil.setTransition(this._element, null);
            this.state = 1 /* Idle */;
            for (let i = 0; i < this._listeners.length; i++) {
                this._listeners[i]();
            }
            this._listeners.length = 0;
        }
    }
    /**
     * @return {?}
     */
    scheduleFlush() {
        if (this.state !== 2 /* WaitingForFlush */) {
            this._waitForFrame(() => this.flushEffects());
        }
    }
    /**
     * @return {?}
     */
    flushEffects() {
        if (this.state !== 3 /* ProcessingEffects */ && this._pendingInstructions.length) {
            this._startTime = now();
            this._flushNextEffect();
            this._updateTimer();
            return true;
        }
        return false;
    }
    /**
     * @return {?}
     */
    finishAll() {
        this._renderUtil.setTransition(this._element, CANCEL_ALL_TRANSITIONS_VALUE);
        this.state = 5 /* Exiting */;
        this._renderUtil.fireReflow(this._element, () => this._onAllEffectsFinished());
    }
    /**
     * @return {?}
     */
    destroy() {
        if (this.state < 5 /* Exiting */) {
            this.state = 5 /* Exiting */;
            this._renderUtil.setTransition(this._element, CANCEL_ALL_TRANSITIONS_VALUE);
            this._element.removeEventListener('transitionend', this._captureFn);
            this._renderUtil.fireReflow(this._element, () => {
                this._onAllEffectsFinished();
                this.state = 6 /* Destroyed */;
                this._collectedClasses && applyClassChanges(this._element, this._collectedClasses, true);
                this._collectedStyles &&
                    applyStyleChanges(this._element, this._collectedStyles, null, true, null);
            });
        }
    }
}
if (false) {
    /** @type {?} */
    CssTransitionAnimator.prototype.state;
    /** @type {?} */
    CssTransitionAnimator.prototype._listeners;
    /** @type {?} */
    CssTransitionAnimator.prototype._pendingInstructions;
    /** @type {?} */
    CssTransitionAnimator.prototype._activeAnimationInstructions;
    /** @type {?} */
    CssTransitionAnimator.prototype._collectedClasses;
    /** @type {?} */
    CssTransitionAnimator.prototype._collectedStyles;
    /** @type {?} */
    CssTransitionAnimator.prototype._activeComputedStyles;
    /** @type {?} */
    CssTransitionAnimator.prototype._captureFn;
    /** @type {?} */
    CssTransitionAnimator.prototype._startTime;
    /** @type {?} */
    CssTransitionAnimator.prototype._maxTime;
    /** @type {?} */
    CssTransitionAnimator.prototype._timer;
    /** @type {?} */
    CssTransitionAnimator.prototype._currentTransitionStr;
    /** @type {?} */
    CssTransitionAnimator.prototype._waitingForFrameFns;
    /** @type {?} */
    CssTransitionAnimator.prototype._lastTransitionToken;
    /** @type {?} */
    CssTransitionAnimator.prototype._pendingFrame;
    /** @type {?} */
    CssTransitionAnimator.prototype._element;
    /** @type {?} */
    CssTransitionAnimator.prototype._renderUtil;
}
/**
 * @param {?} timing
 * @param {?} props
 * @return {?}
 */
function buildTransitionStr(timing, props) {
    return `${timing.duration}ms ${props} ${timing.delay}ms${timing.easing ? (' ' + timing.easing) : ''}`;
}
/**
 * @param {?} prop
 * @param {?} value
 * @return {?}
 */
function determineWhetherToCompute(prop, value) {
    if (value === AUTO_STYLE)
        return 1;
    switch (prop) {
        case 'width':
        case 'height':
            return value ? -1 : 1;
    }
    return 0;
}
/**
 * @param {?} instructions
 * @param {?} effect
 * @return {?}
 */
function findMatchingEffect(instructions, effect) {
    for (let i = 0; i < instructions.length; i++) {
        if (instructions[i].effect === effect)
            return i;
    }
    return -1;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3NzX3RyYW5zaXRpb25fYW5pbWF0b3IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2FuaW1hdGlvbnMvY3NzX3RyYW5zaXRpb25fYW5pbWF0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7OztBQVFBLE9BQU8sRUFBQyxVQUFVLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDcEMsT0FBTyxFQUFDLGlCQUFpQixFQUFFLFVBQVUsRUFBRSxpQkFBaUIsRUFBRSxHQUFHLEVBQUUsU0FBUyxFQUFDLE1BQU0sUUFBUSxDQUFDOzs7OztBQWN4RixNQUFNLDRCQUE0QixHQUFHLFNBQVMsQ0FBQzs7Ozs7O0FBTy9DLE1BQU0sNEJBQTRCLEdBQUcsUUFBUSxDQUFDOzs7SUFhNUMsV0FBWTtJQUNaLFlBQWE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBc0JmLE1BQU0sdUJBQXVCLEdBQUcsS0FBSyxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBd0R0QyxNQUFNLE9BQU8scUJBQXFCOzs7Ozs7SUFrQmhDLFlBQ1ksVUFBK0IsV0FBdUIsRUFBRSxjQUF3QjtRQUFoRixhQUFRLEdBQVIsUUFBUTtRQUF1QixnQkFBVyxHQUFYLFdBQVcsQ0FBWTtRQWxCbEUsMEJBQTBDOzBCQUVOLEVBQUU7b0NBQ1EsRUFBRTs0Q0FDZSxFQUFFO3FDQUdOLElBQUk7MEJBRTFDLENBQUM7d0JBQ0gsQ0FBQztxQ0FFb0IsRUFBRTttQ0FDRyxFQUFFO29DQUNSLEVBQUU7NkJBQ2pCLEtBQUs7UUFJM0IsSUFBSSxDQUFDLFVBQVUsR0FBRyxDQUFDLEtBQXFCLEVBQUUsRUFBRTs7WUFDMUMsTUFBTSxTQUFTLEdBQUcsS0FBSyxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDO1lBQ3BELElBQUksS0FB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Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUVELFNBQVMsa0JBQWtCLENBQUMsTUFBYyxFQUFFLEtBQWE7SUFDdkQsT0FBTyxHQUFHLE1BQU0sQ0FBQyxRQUFRLE1BQU0sS0FBSyxJQUFJLE1BQU0sQ0FBQyxLQUFLLEtBQUssTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQztDQUN2Rzs7Ozs7O0FBRUQsU0FBUyx5QkFBeUIsQ0FBQyxJQUFZLEVBQUUsS0FBYTtJQUM1RCxJQUFJLEtBQUssS0FBSyxVQUFVO1FBQUUsT0FBTyxDQUFDLENBQUM7SUFDbkMsUUFBUSxJQUFJLEVBQUU7UUFDWixLQUFLLE9BQU8sQ0FBQztRQUNiLEtBQUssUUFBUTtZQUNYLE9BQU8sS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0tBQ3pCO0lBQ0QsT0FBTyxDQUFDLENBQUM7Q0FDVjs7Ozs7O0FBRUQsU0FBUyxrQkFBa0IsQ0FBQyxZQUFvQyxFQUFFLE1BQXFCO0lBQ3JGLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxZQUFZLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO1FBQzVDLElBQUksWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sS0FBSyxNQUFNO1lBQUUsT0FBTyxDQUFDLENBQUM7S0FDakQ7SUFDRCxPQUFPLENBQUMsQ0FBQyxDQUFDO0NBQ1giLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5pbXBvcnQge0FuaW1hdG9yLCBBbmltYXRvclN0YXRlLCBSZW5kZXJVdGlsLCBTdHlsaW5nRWZmZWN0LCBUaW1pbmd9IGZyb20gJy4vaW50ZXJmYWNlcyc7XG5pbXBvcnQge0FVVE9fU1RZTEV9IGZyb20gJy4vdG9rZW5zJztcbmltcG9ydCB7YXBwbHlDbGFzc0NoYW5nZXMsIGFwcGx5U3R5bGUsIGFwcGx5U3R5bGVDaGFuZ2VzLCBub3csIHJlYWRTdHlsZX0gZnJvbSAnLi91dGlsJztcblxuXG5cbi8qKlxuICogVGhpcyBmaWxlIGludHJvZHVjZXMgYSB0cmFuc2l0aW9uIGFuaW1hdG9yIHdoaWNoIGlzIGRlc2lnbmVkIHRvXG4gKiBoYW5kbGUgbXVsdGlwbGUgY2xhc3Mvc3R5bGUgdHJhbnNpdGlvbnMgb24gYW4gZWxlbWVudCBhdCB0aGUgc2FtZVxuICogdGltZS5cbiAqL1xuXG4vKipcbiAqIFdoZW4gQUxMIHRyYW5zaXRpb25zIGFyZSBjYW5jZWxsZWQgdGhlbiB0aGUgc3R5bGluZyBiZWxvd1xuICogd2lsbCBmb3JjZSBldmVyeSB0cmFuc2l0aW9uIGFyYyB0byBiZSBpbnRlcnVwdGVkLlxuICovXG5jb25zdCBDQU5DRUxfQUxMX1RSQU5TSVRJT05TX1ZBTFVFID0gJzBzIG5vbmUnO1xuXG4vKipcbiAqIFRoaXMgd2lsbCBmb3JjZSB0aGUgdmVyeSBuZXh0IHN0eWxlcyB0aGF0IGFyZSBhcHBsaWVkIHRvXG4gKiBiZSBhcHBsaWVkIElNTUVESUFURUxZIHRvIHRoZSBlbGVtZW50IChzbyBsb25nIGFzIGEgcmVmbG93XG4gKiBpcyBpc3N1ZWQgYmVmb3JlIHRoZSB0cmFuc2l0aW9uIHZhbHVlIGlzIGNoYW5nZWQgYWZ0ZXJ3YXJkcylcbiAqL1xuY29uc3QgQ0FOQ0VMX05FWFRfVFJBTlNJVElPTl9WQUxVRSA9ICcwcyBhbGwnO1xuXG4vKipcbiAqIFNwZWNpYWwsIGludGVybmFsLW9ubHkgdmVyc2lvbiBvZiBTdHlsaW5nRWZmZWN0XG4gKiB3aGljaCBpcyBzcGVjaWZpYyB0byB0aGUgdHJhbnNpdGlvbiBhbmltYXRvci5cbiAqXG4gKiBUaGUgcHJlQ29tcHV0ZWRTdHlsZXMgbWVtYmVyIHZhbHVlICh3aGljaCBpc1xuICogZWl0aGVyIHNwZWNpZmljIGRpbWVuc2lvbmFsIHN0eWxlcyBvciBhbnlcbiAqIHN0eWxlcyBtYXJrZWQgd2l0aCBhbiBBVVRPX1NUWUxFIHZhbHVlKSBhcmVcbiAqIHBpY2tlZCB1cCBieSB0aGUgdHJhbnNpdGlvbiBhbmltYXRvciBhbmRcbiAqIGV2YWx1YXRlZCBqdXN0IGFzIHRoZSBlZmZlY3RzIGFyZSBwcm9jZXNzZWQuXG4gKi9cbmNvbnN0IGVudW0gSW5zdHJ1Y3Rpb25UeXBlIHtcbiAgU25hcHNob3QgPSAxLFxuICBBbmltYXRpb24gPSAyLFxufVxuXG5pbnRlcmZhY2UgSW5zdHJ1Y3Rpb24ge1xuICBlZmZlY3Q6IFN0eWxpbmdFZmZlY3Q7XG4gIHR5cGU6IEluc3RydWN0aW9uVHlwZTtcbiAgdHJhbnNpdGlvblN0eWxlOiBzdHJpbmc7XG59XG5cbmludGVyZmFjZSBBbmltYXRpb25JbnN0cnVjdGlvbiBleHRlbmRzIEluc3RydWN0aW9uIHtcbiAgdHlwZTogSW5zdHJ1Y3Rpb25UeXBlLkFuaW1hdGlvbjtcbiAgc3R5bGVzOiB7W2tleTogc3RyaW5nXTogYW55fXxudWxsO1xuICBjbGFzc2VzOiB7W2tleTogc3RyaW5nXTogYW55fXxudWxsO1xuICBjb21wdXRlU3R5bGVzOiBzdHJpbmdbXXxudWxsO1xuICBpc1Byb3BNdWx0aVRyYW5zaXRpb246IGJvb2xlYW47XG59XG5cbmludGVyZmFjZSBTbmFwc2hvdEluc3RydWN0aW9uIGV4dGVuZHMgSW5zdHJ1Y3Rpb24ge1xuICB0eXBlOiBJbnN0cnVjdGlvblR5cGUuU25hcHNob3Q7XG4gIGNvbXB1dGVTdHlsZXM6IHN0cmluZ1tdO1xufVxuXG5jb25zdCBERUZBVUxUX1RSQU5TSVRJT05fUFJPUCA9ICdhbGwnO1xuXG4vKipcbiAqIFRoZSBDc3NUcmFuc2l0aW9uQW5pbWF0b3IgaXMgcHJpbWFyaWx5IChpbiBtb2Rlcm4gYnJvd3NlcnMpIHVzZWRcbiAqIHRvIGFuaW1hdGUgQ1NTIGNsYXNzICh3aGljaCBjYW4gT05MWSBiZSBhbmltYXRlZCB1c2luZyB0cmFuc2l0aW9uc1xuICogYW5kIGlubGluZSBzdHlsZSB0cmFuc2l0aW9ucyB0b2dldGhlciBpbiB0aGUgc2FtZSBhbmltYXRpb24gYXJjcy5cbiAqXG4gKiBDU1MgdHJhbnNpdGlvbnMgKHdoZW4gaW50ZXJmYWNlZCB3aXRoIGluIEphdmFTY3JpcHQpIGRvIG5vdCBoYXZlIGFcbiAqIHN0cmFpZ2h0Zm9yd2FyZCBBUEkuIFRoZSBvbmx5IHdheSB0byBkZXRlY3QgaWYgYSB0cmFuc2l0aW9uIGVuZHNcbiAqICh3aGVuIHRoZSBhbmltYXRpb24gZmluaXNoZXMpIGlzIGJ5IHVzZSBvZiB0aGUgYHRyYW5zaXRpb25lbmRgIGV2ZW50LlxuICogRGVzcGl0ZSB0aGUgZXZlbnQgYmVpbmcgc3VwcG9ydGVkIGJ5IGFsbCBicm93c2VycywgdGhlIGJlaGF2aW9yIG9mXG4gKiB0aGUgZXZlbnQgaXMgdmVyeSBsaW1pdGVkIGJlY2F1c2UgaXQgd2lsbCBvbmx5IGZpcmUgb24gQ1NTIHByb3BlcnR5XG4gKiBjaGFuZ2VzIGFuZCBOT1Qgb24gQ1NTIGNsYXNzIGNoYW5nZXMuIFRoaXMgbWVhbnMgdGhhdCB0byBwcm9wZXJseSByZWx5XG4gKiBvbiB0aGUgZXZlbnQgdGhlbiBlYWNoIG9mIHRoZSBDU1Mgc3R5bGVzIG5lZWQgdG8gYmUga25vd24gKHdoaWNoIGlzXG4gKiBpbXBvc3NpYmxlIHRvIGtub3cgdXBmcm9udCBzaW5jZSBDU1MgY2xhc3NlcyBhcmUgaGlkZGVuIHdpdGhpbiBDU1NcbiAqIHN0eWxlc2hlZXRzIGFuZCBtYXkgY2hhbmdlIGJhc2VkIG9uIG1lZGlhIHF1ZXJpZXMgYW5kIERPTSBzdGF0ZSkuXG4gKlxuICogRGVzcGl0ZSB0aGlzIGxpbWl0YXRpb24sIHRoZSB0cmFuc2l0aW9uIGFuaW1hdG9yIGNsYXNzIGJlbG93IHN0aWxsXG4gKiB1c2VzIHVzZXMgdGhlIGB0cmFuc2l0aW9uZW5kYCBldmVudCB0byBkZXRlY3QgZm9yIGFuaW1hdGlvbnMgdGhhdFxuICogZW5kLiBJdCB3aWxsIHdhaXQgZm9yIHRoZSBsYXJnZXN0LXRpbWVkIGB0cmFuc2l0aW9uZW5kYCBldmVudCB0b1xuICogZmlyZSBhbmQgY2FwdHVyZSB0aGF0IGFuZCB0aGVuIGVuZCBhbGwgdGhlIHRyYW5zaXRpb25zIGFmdGVyd2FyZHMuXG4gKiBGb3IgdGhpcyB0byB3b3JrLCBhbGwgdGhlIHN0eWxlcyBhcmUgY2xhc3NlcyBhcmUgYXBwbGllZCBvbnRvIHRoZVxuICogZWxlbWVudCB1c2luZyB2YXJpb3VzLCBjb21tYS1zZXBhcmF0ZWQgdHJhbnNpdGlvbiBzdHJpbmdzIChvbmUgZm9yXG4gKiBlYWNoIHN0eWxlL2NsYXNzIGVmZmVjdCB0aGF0IGlzIGFkZGVkIHRvIHRoZSBhbmltYXRvcikuXG4gKlxuICogVGhlIHJlYXNvbiBhbGwgY2xhc3Nlcy9zdHlsZXMgb24gdGhlIHNhbWUgZWxlbWVudCBhcmUgY29tYmluZWQgdG9nZXRoZXJcbiAqIGludG8gdGhlIGFuaW1hdG9yIGZvciB0aGUgc2FtZSBlbGVtZW50IGFyZSBkdWUgdG8gdGhlIGZvbGxvd2luZyByZWFzb25zOlxuICpcbiAqIDEuIFRvIGZpZ3VyZSBvdXQgd2hhdCB0aGUgbWF4aW11bSB3YWl0IHRpbWUgaXMgZm9yIHRoZSBmdWxsIHRyYW5zaXRpb25cbiAqICAgIGFuZCB0aGVuIHRvIGNoZWNrIGFnYWluc3QgdGhhdCBhZnRlciBldmVyeSBgdHJhbnNpdGlvbmVuZGAgZXZlbnRcbiAqICAgIGZpcmVzLlxuICogMi4gVG8gc2V0dXAgYSBgc2V0VGltZW91dGAgZmFsbGJhY2sgdGhhdCB3aWxsIGZpcmUgaW4gdGhlIGV2ZW50IHRoYXRcbiAqICAgIGB0cmFuc2l0aW9uZW5kYCBmYWlscyB0byBmaXJlICh3aGljaCBjYW4gaGFwcGVuIGlmIHRoZXJlIGFyZSBub1xuICogICAgc3R5bGVzIHNldCB0byBhbmltYXRlIGR1ZSB0byBhIG1pc3NpbmcgY2xhc3Mgb3Igbm8gc3R5bGUgY2hhbmdlcylcbiAqIDMuIFRvIGFwcGx5IHRoZSB0cmFuc2l0aW9uIHRpbWluZyBzdHlsZXMgb25lIGJ5IG9uZSBvbnRvIHRoZSBlbGVtZW50XG4gKiAgICB3aXRoIGEgcmVmbG93IGZyYW1lIGluIGJldHdlZW4gKHRoaXMgY2F1c2VzIG9uZSBzZXQgb2YgY2xhc3Nlcy9zdHlsZXNcbiAqICAgIHRvIGFuaW1hdGUgYmVmb3JlIGFub3RoZXIgd2hpY2ggaW50dXJuIGFsbG93cyBmb3IgbXVsdGlwbGUgQ1NTXG4gKiAgICB0cmFuc2l0aW9ucyB0byBmaXJlIG9uIGEgc2luZ2xlIGVsZW1lbnQgYXQgdGhlIHNhbWUgdGltZSkuXG4gKlxuICogT25jZSB0aGUgYW5pbWF0b3Igc3RhcnRzIGFuZCB0aGUgdHJhbnNpdGlvbnMgYXJlIGFwcGxpZWQsIGVhY2hcbiAqIHRyYW5zaXRpb24gc3RyaW5nIHZhbHVlIGlzIGFwcGxpZWQgaW4gdGhlIGZvbGxvd2luZyB3YXkuXG4gKlxuICogMS4gQXBwbHkgZmlyc3QgdHJhbnNpdGlvbiAoZS5nLiBzdHlsZT1cInRyYW5zaXRpb246IDFzIGFsbFwiKVxuICogMi4gQXBwbHkgdGhlIGNsYXNzZXMgYW5kL29yIHN0eWxlcyBwcmVzZW50IGluIHRoZSBxdWV1ZWQgdHJhbnNpdGlvblxuICogICAgKHRoaXMga2lja3Mgb2ZmIHRoZSB0cmFuc2l0aW9uIGZvciB0aGF0IGdpdmVuIHN0eWxlcy9jbGFzc2VzIGVmZmVjdClcbiAqIDMuIFJ1biBhIHJlZmxvdyAod2hpY2ggdXNlcyBtZWFzdXJlbWVudCBjb21wdXRhdGlvbiArIFJBRilcbiAqIDQuIFRoZW4gcmVwZWF0IGZyb20gc3RlcCAxIGFuZCBhcHBseSB0aGUgbmV4dCB0cmFuc2l0aW9uIGVmZmVjdFxuICpcbiAqIE9uY2UgdGhlIGNsYXNzZXMvc3R5bGVzIGFuZCB0cmFuc2l0aW9uIHN0cmluZ3MgaGF2ZSBhbGwgYmVlbiBhcHBsaWVkXG4gKiB0aGVuIHRoZSBwbGF5ZXIgY29kZSB3aWxsIHdhaXQgZm9yIGB0cmFuc2l0aW9uZW5kYCBhbmQgd2lsbCB0aGVuXG4gKiBvbmx5IGZpbmlzaCB0aGUgdHJhbnNpdGlvbiBhbmltYXRpb24gb25jZSB0aGUgbG9uZ2VzdCB0cmFuc2l0aW9uXG4gKiBhbmltYXRpb24gaGFzIGZpbmlzaGVkIChvciB0aGUgdGltZXIgcnVucyBvdXQpLlxuICpcbiAqIE9ubHkgb25jZSBhbGwgdGhlIHRyYW5zaXRpb25zIGFyZSBmaW5pc2hlZCB0aGVuIHRoZSB1bmRlcmx5aW5nIHRyYW5zaXRpb25cbiAqIHN0eWxlIHN0cmluZyB3aWxsIGJlIHJlbW92ZWQgZnJvbSB0aGUgZWxlbWVudC5cbiAqL1xuZXhwb3J0IGNsYXNzIENzc1RyYW5zaXRpb25BbmltYXRvciBpbXBsZW1lbnRzIEFuaW1hdG9yIHtcbiAgc3RhdGU6IEFuaW1hdG9yU3RhdGUgPSBBbmltYXRvclN0YXRlLklkbGU7XG5cbiAgcHJpdmF0ZSBfbGlzdGVuZXJzOiAoKCkgPT4gYW55KVtdID0gW107XG4gIHByaXZhdGUgX3BlbmRpbmdJbnN0cnVjdGlvbnM6IEluc3RydWN0aW9uW10gPSBbXTtcbiAgcHJpdmF0ZSBfYWN0aXZlQW5pbWF0aW9uSW5zdHJ1Y3Rpb25zOiBBbmltYXRpb25JbnN0cnVjdGlvbltdID0gW107XG4gIHByaXZhdGUgX2NvbGxlY3RlZENsYXNzZXM6IHtbY2xhc3NOYW1lOiBzdHJpbmddOiBib29sZWFufXxudWxsO1xuICBwcml2YXRlIF9jb2xsZWN0ZWRTdHlsZXM6IHtba2V5OiBzdHJpbmddOiBhbnl9fG51bGw7XG4gIHByaXZhdGUgX2FjdGl2ZUNvbXB1dGVkU3R5bGVzOiB7W2tleTogc3RyaW5nXTogYW55fXxudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBfY2FwdHVyZUZuOiAoZXZlbnQ6IEFuaW1hdGlvbkV2ZW50KSA9PiBhbnk7XG4gIHByaXZhdGUgX3N0YXJ0VGltZSA9IDA7XG4gIHByaXZhdGUgX21heFRpbWUgPSAwO1xuICBwcml2YXRlIF90aW1lcjogYW55O1xuICBwcml2YXRlIF9jdXJyZW50VHJhbnNpdGlvblN0cjogc3RyaW5nID0gJyc7XG4gIHByaXZhdGUgX3dhaXRpbmdGb3JGcmFtZUZuczogKCgpID0+IGFueSlbXSA9IFtdO1xuICBwcml2YXRlIF9sYXN0VHJhbnNpdGlvblRva2VuOiBzdHJpbmcgPSAnJztcbiAgcHJpdmF0ZSBfcGVuZGluZ0ZyYW1lID0gZmFsc2U7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgICBwcml2YXRlIF9lbGVtZW50OiBIVE1MRWxlbWVudCwgcHJpdmF0ZSBfcmVuZGVyVXRpbDogUmVuZGVyVXRpbCwgY29sbGVjdFN0eWxpbmc/OiBib29sZWFuKSB7XG4gICAgdGhpcy5fY2FwdHVyZUZuID0gKGV2ZW50OiBBbmltYXRpb25FdmVudCkgPT4ge1xuICAgICAgY29uc3QgdG90YWxUaW1lID0gZXZlbnQudGltZVN0YW1wIC0gdGhpcy5fc3RhcnRUaW1lO1xuICAgICAgaWYgKGV2ZW50LnRhcmdldCA9PT0gdGhpcy5fZWxlbWVudCkge1xuICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgaWYgKHRvdGFsVGltZSA+PSB0aGlzLl9tYXhUaW1lKSB7XG4gICAgICAgICAgdGhpcy5fb25BbGxFZmZlY3RzRmluaXNoZWQoKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH07XG4gICAgdGhpcy5fZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCd0cmFuc2l0aW9uZW5kJywgdGhpcy5fY2FwdHVyZUZuLCB7Y2FwdHVyZTogdHJ1ZX0pO1xuICAgIHRoaXMuX2NvbGxlY3RlZENsYXNzZXMgPSBjb2xsZWN0U3R5bGluZyA/IHt9IDogbnVsbDtcbiAgICB0aGlzLl9jb2xsZWN0ZWRTdHlsZXMgPSBjb2xsZWN0U3R5bGluZyA/IHt9IDogbnVsbDtcbiAgfVxuXG4gIG9uQWxsRWZmZWN0c0RvbmUoY2I6ICgpID0+IGFueSkgeyB0aGlzLl9saXN0ZW5lcnMucHVzaChjYik7IH1cblxuICBhZGRFZmZlY3QoZWZmZWN0OiBTdHlsaW5nRWZmZWN0KSB7XG4gICAgY29uc3Qge2NsYXNzZXMsIHRpbWluZ30gPSBlZmZlY3Q7XG4gICAgY29uc3QgdGltZSA9IHRoaXMuX2NvbXB1dGVUcmFuc2l0aW9uVGltZSh0aW1pbmcpO1xuICAgIHRoaXMuX21heFRpbWUgPSBNYXRoLm1heCh0aGlzLl9tYXhUaW1lLCB0aW1lKTtcblxuICAgIC8vIGlmIGFuZCB3aGVuIHN0eWxlcyBhcmUgdXNlZCB3ZSB3YW50IHRvIGZpZ3VyZSBvdXQgd2hhdCBwcm9wZXJ0aWVzXG4gICAgLy8gYXJlIHNldCB0byBhdXRvIHN0eWxlIGFuaW1hdGUgYW5kIHdoaWNoIG9uZXMgYXJlIGJlaW5nIHJlbW92ZWQuXG4gICAgLy8gSWYgZWl0aGVyIGlzIHRydWUgdGhlbiB3ZSBuZWVkIHRvIHNpZ25hbCB0aGUgYW5pbWF0b3IgdG8gcHJlLWNvbXB1dGVcbiAgICAvLyB0aGUgbWlzc2luZy9hdXRvIHN0eWxlIHZhbHVlcyBvbmNlIHRoZSBlZmZlY3RzIGFyZSBwcm9jZXNzZWQuXG4gICAgbGV0IGNvbXB1dGVTdHlsZXNEdXJpbmdFZmZlY3Q6IHN0cmluZ1tdfG51bGwgPSBudWxsO1xuICAgIGxldCBjb21wdXRlU3R5bGVzQmVmb3JlRWZmZWN0OiBzdHJpbmdbXXxudWxsID0gbnVsbDtcblxuICAgIGxldCBzaW5nbGVUcmFuc2l0aW9uUHJvcCA9IG51bGw7XG4gICAgbGV0IHN0eWxlczoge1trZXk6IHN0cmluZ106IGFueX18bnVsbCA9IG51bGw7XG4gICAgaWYgKGVmZmVjdC5zdHlsZXMpIHtcbiAgICAgIHN0eWxlcyA9IHt9O1xuICAgICAgY29tcHV0ZVN0eWxlc0R1cmluZ0VmZmVjdCA9IFtdO1xuICAgICAgY29tcHV0ZVN0eWxlc0JlZm9yZUVmZmVjdCA9IFtdO1xuICAgICAgY29uc3QgcHJvcHMgPSBPYmplY3Qua2V5cyhlZmZlY3Quc3R5bGVzKTtcbiAgICAgIHNpbmdsZVRyYW5zaXRpb25Qcm9wID0gcHJvcHMubGVuZ3RoID09IDEgPyBwcm9wc1swXSA6IG51bGw7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHByb3BzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IHByb3AgPSBwcm9wc1tpXTtcbiAgICAgICAgbGV0IHZhbHVlID0gZWZmZWN0LnN0eWxlc1twcm9wXTtcbiAgICAgICAgY29uc3QgY29tcHV0ZVN0YXR1cyA9IGRldGVybWluZVdoZXRoZXJUb0NvbXB1dGUocHJvcCwgdmFsdWUpO1xuICAgICAgICBzd2l0Y2ggKGNvbXB1dGVTdGF0dXMpIHtcbiAgICAgICAgICBjYXNlIC0xOlxuICAgICAgICAgICAgY29tcHV0ZVN0eWxlc0JlZm9yZUVmZmVjdC5wdXNoKHByb3ApO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSAxOlxuICAgICAgICAgICAgY29tcHV0ZVN0eWxlc0R1cmluZ0VmZmVjdC5wdXNoKHByb3ApO1xuICAgICAgICAgICAgdmFsdWUgPSBBVVRPX1NUWUxFO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgc3R5bGVzW3Byb3BdID0gdmFsdWU7XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgdHJhbnNpdGlvblByb3AgPSAoIWNsYXNzZXMgJiYgc2luZ2xlVHJhbnNpdGlvblByb3ApIHx8IERFRkFVTFRfVFJBTlNJVElPTl9QUk9QO1xuICAgIGlmIChjb21wdXRlU3R5bGVzQmVmb3JlRWZmZWN0ICYmIGNvbXB1dGVTdHlsZXNCZWZvcmVFZmZlY3QubGVuZ3RoKSB7XG4gICAgICB0aGlzLl9wZW5kaW5nSW5zdHJ1Y3Rpb25zLnB1c2goe1xuICAgICAgICBlZmZlY3QsIHR5cGU6IEluc3RydWN0aW9uVHlwZS5TbmFwc2hvdCwgY29tcHV0ZVN0eWxlczogY29tcHV0ZVN0eWxlc0JlZm9yZUVmZmVjdCxcbiAgICAgICAgICAgIHRyYW5zaXRpb25TdHlsZTogYDBzICR7dHJhbnNpdGlvblByb3B9YFxuICAgICAgfSBhcyBTbmFwc2hvdEluc3RydWN0aW9uKTtcbiAgICB9XG5cbiAgICBjb25zdCB0cmFuc2l0aW9uU3R5bGUgPSBidWlsZFRyYW5zaXRpb25TdHIodGltaW5nLCB0cmFuc2l0aW9uUHJvcCk7XG4gICAgdGhpcy5fcGVuZGluZ0luc3RydWN0aW9ucy5wdXNoKHtcbiAgICAgIGVmZmVjdCwgdHlwZTogSW5zdHJ1Y3Rpb25UeXBlLkFuaW1hdGlvbiwgc3R5bGVzLCB0cmFuc2l0aW9uU3R5bGUsXG4gICAgICAgICAgY2xhc3NlczogY2xhc3NlcyA/IHsuLi5jbGFzc2VzfSA6IG51bGwsXG4gICAgICAgICAgY29tcHV0ZVN0eWxlczogKGNvbXB1dGVTdHlsZXNEdXJpbmdFZmZlY3QgJiYgY29tcHV0ZVN0eWxlc0R1cmluZ0VmZmVjdCAhLmxlbmd0aCkgP1xuICAgICAgICAgIGNvbXB1dGVTdHlsZXNEdXJpbmdFZmZlY3QgOlxuICAgICAgICAgIG51bGwsXG4gICAgICAgICAgaXNQcm9wTXVsdGlUcmFuc2l0aW9uOiB0cmFuc2l0aW9uUHJvcCA9PT0gREVGQVVMVF9UUkFOU0lUSU9OX1BST1BcbiAgICB9IGFzIEFuaW1hdGlvbkluc3RydWN0aW9uKTtcbiAgfVxuXG4gIHByaXZhdGUgX2NvbXB1dGVUcmFuc2l0aW9uVGltZSh0aW1pbmc6IFRpbWluZykge1xuICAgIC8vIHRoZSBnb2FsIGlzIHRvIGZpZ3VyZSBvdXQgdGhlIHRvdGFsIHRpbWUgb2YgdGhpcyB0cmFuc2l0aW9uc1xuICAgIC8vIHdoZW4gbWl4ZWQgdG9nZXRoZXIgd2l0aCB0aGUgZXhpc3Rpbmcgb3Igc29vbi10by1ydW4gdHJhbnNpdGlvbnNcbiAgICAvLyBiZWNhdXNlIGB0cmFuc2l0aW9uZW5kYCBldmVudHMgYXJlIG5vdCAxMDAlIHJlbGlhYmxlICh0aGlzIGlzXG4gICAgLy8gZXhwbGFpbmVkIGF0IHRoZSB0b3Agb2YgdGhpcyBmaWxlKS4gSGF2aW5nIHRoZSB0b3RhbCB0aW1lIGFsbG93c1xuICAgIC8vIGZvciBhIGZhbGxiYWNrIHRpbWVyIHRvIGJlIHNjaGVkdWxlZC9yZXBsYWNlZCBzbyB0aGF0IHRoZSBmaW5hbFxuICAgIC8vIHN0eWxpbmcgY2FuIGJlIGNsZWFuZWQgdXAgYW5kIHRoZSB0cmFuc2l0aW9uIGNhbiBiZSBleHBsaXRseSBmaW5pc2hlZC5cbiAgICBjb25zdCBlbGFwc2VkVGltZVNvRmFyID0gdGhpcy5zdGF0ZSA9PT0gQW5pbWF0b3JTdGF0ZS5SdW5uaW5nID8gKG5vdygpIC0gdGhpcy5fc3RhcnRUaW1lKSA6IDA7XG4gICAgcmV0dXJuIGVsYXBzZWRUaW1lU29GYXIgKyB0aW1pbmcuZHVyYXRpb24gKyB0aW1pbmcuZGVsYXk7XG4gIH1cblxuICBmaW5pc2hFZmZlY3QoZWZmZWN0OiBTdHlsaW5nRWZmZWN0KSB7IHRoaXMuX2ZpbmlzaE9yRGVzdHJveUVmZmVjdChlZmZlY3QsIGZhbHNlKTsgfVxuXG4gIGRlc3Ryb3lFZmZlY3QoZWZmZWN0OiBTdHlsaW5nRWZmZWN0KSB7IHRoaXMuX2ZpbmlzaE9yRGVzdHJveUVmZmVjdChlZmZlY3QsIHRydWUpOyB9XG5cbiAgcHJpdmF0ZSBfZmluaXNoT3JEZXN0cm95RWZmZWN0KGVmZmVjdDogU3R5bGluZ0VmZmVjdCwgZGVzdHJveTogYm9vbGVhbikge1xuICAgIC8vIHdlIHdhaXQgZm9yIGEgZnJhbWUgaW4gdGhlIGV2ZW50IHRoYXQgdGhlIGVmZmVjdCAob3IgYW55IG90aGVyIGVmZmVjdHMpXG4gICAgLy8gaGF2ZSBiZWVuIHNjaGVkdWxlZCB0byBiZSBmbHVzaGVkXG4gICAgdGhpcy5fd2FpdEZvckZyYW1lKCgpID0+IHtcbiAgICAgIHRoaXMuX2FwcGx5VHJhbnNpdGlvbihDQU5DRUxfTkVYVF9UUkFOU0lUSU9OX1ZBTFVFKTtcbiAgICAgIHRoaXMuX2FwcGx5U3R5bGluZyhlZmZlY3QsIHRydWUpO1xuXG4gICAgICBpZiAoZGVzdHJveSkge1xuICAgICAgICB0aGlzLl93YWl0Rm9yRnJhbWUoKCkgPT4gdGhpcy5fY2xlYW51cEVmZmVjdChlZmZlY3QpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuX3dhaXRGb3JGcmFtZSgoKSA9PiB7XG4gICAgICAgICAgdGhpcy5fYXBwbHlTdHlsaW5nKGVmZmVjdCk7XG4gICAgICAgICAgdGhpcy5fd2FpdEZvckZyYW1lKCgpID0+IHRoaXMuX2NsZWFudXBFZmZlY3QoZWZmZWN0KSk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSBfY2xlYW51cENvbXB1dGVkU3R5bGVzKGNvbXB1dGVkU3R5bGVzOiBzdHJpbmdbXSkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY29tcHV0ZWRTdHlsZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IHByb3AgPSBjb21wdXRlZFN0eWxlc1tpXTtcbiAgICAgIGNvbnN0IGNvbXB1dGVkVmFsdWUgPSB0aGlzLl9hY3RpdmVDb21wdXRlZFN0eWxlcyAmJiB0aGlzLl9hY3RpdmVDb21wdXRlZFN0eWxlc1twcm9wXTtcbiAgICAgIGNvbnN0IGFjdGl2ZVZhbHVlID0gcmVhZFN0eWxlKHRoaXMuX2VsZW1lbnQsIHByb3ApO1xuICAgICAgaWYgKGNvbXB1dGVkVmFsdWUgJiYgY29tcHV0ZWRWYWx1ZSA9PT0gYWN0aXZlVmFsdWUpIHtcbiAgICAgICAgLy8gaWYgZXhhY3RseSB0aGUgc2FtZSB0aGVuIHRoaXMgbWVhbnMgdGhhdCB0aGUgQVVUT19TVFlMRSB3YXNcbiAgICAgICAgLy8gdGhlIGZpbmFsIHN0eWxpbmcgZm9yIHRoZSBlbGVtZW50IHdoaWNoIG1lYW5zIHRoYXQgaXQgd2FzIG5ldmVyXG4gICAgICAgIC8vIGludGVuZGVkIHRvIHN0aWNrIGFyb3VuZCBvbmNlIHRoZSBhbmltYXRpb24gaXMgb3ZlclxuICAgICAgICB0aGlzLl9hY3RpdmVDb21wdXRlZFN0eWxlcyAhW3Byb3BdID0gbnVsbDtcbiAgICAgICAgYXBwbHlTdHlsZSh0aGlzLl9lbGVtZW50LCBwcm9wLCBudWxsKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBwcml2YXRlIF9jbGVhbnVwRWZmZWN0KGVmZmVjdDogU3R5bGluZ0VmZmVjdCkge1xuICAgIGNvbnN0IGVmZmVjdEluZGV4ID0gZmluZE1hdGNoaW5nRWZmZWN0KHRoaXMuX2FjdGl2ZUFuaW1hdGlvbkluc3RydWN0aW9ucywgZWZmZWN0KTtcbiAgICBpZiAoZWZmZWN0SW5kZXggPj0gMCkge1xuICAgICAgY29uc3QgYWN0aXZlRWZmZWN0ID0gdGhpcy5fYWN0aXZlQW5pbWF0aW9uSW5zdHJ1Y3Rpb25zW2VmZmVjdEluZGV4XTtcbiAgICAgIHRoaXMuX2FjdGl2ZUFuaW1hdGlvbkluc3RydWN0aW9ucy5zcGxpY2UoZWZmZWN0SW5kZXgsIDEpO1xuICAgICAgaWYgKGFjdGl2ZUVmZmVjdC5jb21wdXRlU3R5bGVzKSB7XG4gICAgICAgIHRoaXMuX2NsZWFudXBDb21wdXRlZFN0eWxlcyhhY3RpdmVFZmZlY3QuY29tcHV0ZVN0eWxlcyk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5fZmx1c2hOZXh0RWZmZWN0KCk7XG4gICAgY29uc3QgdGltZSA9IHRoaXMuX2NvbXB1dGVUcmFuc2l0aW9uVGltZShlZmZlY3QudGltaW5nKTtcbiAgICBpZiAodGltZSA+PSB0aGlzLl9tYXhUaW1lKSB7XG4gICAgICB0aGlzLl9vbkFsbEVmZmVjdHNGaW5pc2hlZCgpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgX2FwcGx5U3R5bGluZyhcbiAgICAgIGVmZmVjdDogU3R5bGluZ0VmZmVjdHxBbmltYXRpb25JbnN0cnVjdGlvbiwgcmV2ZXJ0PzogYm9vbGVhbixcbiAgICAgIHByZUNvbXB1dGVkU3R5bGVzPzoge1trZXk6IHN0cmluZ106IGFueX18bnVsbCkge1xuICAgIGVmZmVjdC5jbGFzc2VzICYmXG4gICAgICAgIGFwcGx5Q2xhc3NDaGFuZ2VzKHRoaXMuX2VsZW1lbnQsIGVmZmVjdC5jbGFzc2VzLCByZXZlcnQsIHRoaXMuX2NvbGxlY3RlZENsYXNzZXMpO1xuICAgIGVmZmVjdC5zdHlsZXMgJiZcbiAgICAgICAgYXBwbHlTdHlsZUNoYW5nZXMoXG4gICAgICAgICAgICB0aGlzLl9lbGVtZW50LCBlZmZlY3Quc3R5bGVzLCBudWxsLCByZXZlcnQsIHByZUNvbXB1dGVkU3R5bGVzLCB0aGlzLl9jb2xsZWN0ZWRTdHlsZXMpO1xuICB9XG5cbiAgcHJpdmF0ZSBfd2FpdEZvckZyYW1lKGNiPzogKCkgPT4gYW55KSB7XG4gICAgaWYgKCF0aGlzLl9wZW5kaW5nRnJhbWUpIHtcbiAgICAgIHRoaXMuX3BlbmRpbmdGcmFtZSA9IHRydWU7XG4gICAgICBsZXQgZmx1c2hGbjogRnVuY3Rpb247XG4gICAgICB0aGlzLl9yZW5kZXJVdGlsLmZpcmVSZWZsb3codGhpcy5fZWxlbWVudCwgZmx1c2hGbiA9ICgpID0+IHtcbiAgICAgICAgdGhpcy5fcGVuZGluZ0ZyYW1lID0gZmFsc2U7XG4gICAgICAgIC8vIHRoaXMgaXMgZWFnZXJseSBhc3NpZ25lZCB0byBhdm9pZCBoYXZpbmdcbiAgICAgICAgLy8gdGhlIGZyYW1lcyBncm93ICh0aG9zZSBhcmUgc2NoZWR1bGVkIGxhdGVyKVxuICAgICAgICBjb25zdCBsZW5ndGggPSB0aGlzLl93YWl0aW5nRm9yRnJhbWVGbnMubGVuZ3RoO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgdGhpcy5fd2FpdGluZ0ZvckZyYW1lRm5zLnNoaWZ0KCkgISgpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLl93YWl0aW5nRm9yRnJhbWVGbnMubGVuZ3RoICYmICF0aGlzLl9wZW5kaW5nRnJhbWUpIHtcbiAgICAgICAgICB0aGlzLl9wZW5kaW5nRnJhbWUgPSB0cnVlO1xuICAgICAgICAgIHRoaXMuX3JlbmRlclV0aWwuZmlyZVJlZmxvdyh0aGlzLl9lbGVtZW50LCBmbHVzaEZuKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLl9wZW5kaW5nRnJhbWUgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICAgIGNiICYmIHRoaXMuX3dhaXRpbmdGb3JGcmFtZUZucy5wdXNoKGNiKTtcbiAgfVxuXG4gIHByaXZhdGUgX2NvbXB1dGVTdHlsZXMoaW5zdHJ1Y3Rpb246IEFuaW1hdGlvbkluc3RydWN0aW9uKSB7XG4gICAgY29uc3QgY29tcHV0ZVN0eWxlcyA9IGluc3RydWN0aW9uLmNvbXB1dGVTdHlsZXMgITtcbiAgICBjb25zdCBkdXJhdGlvbiA9IGluc3RydWN0aW9uLmVmZmVjdC50aW1pbmcuZHVyYXRpb247XG4gICAgY29uc3QgY3VycmVudFN0eWxlczoge1trZXk6IHN0cmluZ106IGFueX0gPSB7fTtcbiAgICBjb21wdXRlU3R5bGVzLmZvckVhY2gocHJvcCA9PiB7XG4gICAgICBjdXJyZW50U3R5bGVzW3Byb3BdID0gdGhpcy5fcmVuZGVyVXRpbC5nZXRDb21wdXRlZFN0eWxlKHRoaXMuX2VsZW1lbnQsIHByb3ApO1xuICAgICAgdGhpcy5fZWxlbWVudC5zdHlsZS5yZW1vdmVQcm9wZXJ0eShwcm9wKTtcbiAgICB9KTtcblxuICAgIGNvbnN0IHByb3BUb0Jsb2NrID0gY29tcHV0ZVN0eWxlcy5sZW5ndGggPT0gMSA/IGNvbXB1dGVTdHlsZXNbMF0gOiBERUZBVUxUX1RSQU5TSVRJT05fUFJPUDtcbiAgICBjb25zdCB0aW1pbmcgPSB7ZHVyYXRpb24sIGRlbGF5OiAtZHVyYXRpb24sIGVhc2luZzogbnVsbCwgZmlsbDogbnVsbH07XG4gICAgY29uc3QgdHJhbnNpdGlvblByZWZpeCA9XG4gICAgICAgIHRoaXMuX2N1cnJlbnRUcmFuc2l0aW9uU3RyICsgKHRoaXMuX2N1cnJlbnRUcmFuc2l0aW9uU3RyLmxlbmd0aCA/ICcsICcgOiAnJyk7XG4gICAgY29uc3QgdHJhbnNpdGlvblN0ciA9IHRyYW5zaXRpb25QcmVmaXggKyBidWlsZFRyYW5zaXRpb25TdHIodGltaW5nLCBwcm9wVG9CbG9jayk7XG4gICAgdGhpcy5fcmVuZGVyVXRpbC5zZXRUcmFuc2l0aW9uKHRoaXMuX2VsZW1lbnQsIHRyYW5zaXRpb25TdHIpO1xuXG4gICAgY29uc3QgY29tcHV0ZWRTdHlsZXM6IHtba2V5OiBzdHJpbmddOiBhbnl9ID0ge307XG4gICAgY29tcHV0ZVN0eWxlcy5mb3JFYWNoKHByb3AgPT4ge1xuICAgICAgY29tcHV0ZWRTdHlsZXMgIVtwcm9wXSA9IHRoaXMuX3JlbmRlclV0aWwuZ2V0Q29tcHV0ZWRTdHlsZSh0aGlzLl9lbGVtZW50LCBwcm9wKTtcbiAgICAgIHRoaXMuX2VsZW1lbnQuc3R5bGUuc2V0UHJvcGVydHkocHJvcCwgY3VycmVudFN0eWxlc1twcm9wXSk7XG4gICAgfSk7XG5cbiAgICB0aGlzLl9yZW5kZXJVdGlsLmZpcmVSZWZsb3codGhpcy5fZWxlbWVudCwgbnVsbCk7XG4gICAgcmV0dXJuIGNvbXB1dGVkU3R5bGVzO1xuICB9XG5cbiAgLyoqXG4gICAqIFRoaXMgbWV0aG9kIGlzIHJlc3BvbnNpYmxlIGZvciBhcHBseWluZyBlYWNoIHN0eWxlcy9jbGFzcyBlZmZlY3RcbiAgICogb250byB0aGUgZWxlbWVudCB3aXRoIGl0cyBhc3NvY2lhdGVkIHRyYW5zaXRpb24gdGltaW5nIHN0cmluZy5cbiAgICpcbiAgICogVGhlIG1haW4gcG9pbnQgdG8gdGFrZSBmcm9tIHRoaXMgaXMgdGhhdCBlYWNoIGVmZmVjdCBNVVNUIGJlIGFwcGxpZWRcbiAgICogaW4gYmV0d2VlbiByZWZsb3dzIHNvIHRoYXQgdGhlIGJyb3dzZXIgY2FuIGtpY2sgb2ZmIGVhY2ggc3R5bGUvY2xhc3NcbiAgICogcmVuZGVyaW5nLiBPdGhlcndpc2UgaWYgZXZlcnl0aGluZyBpcyBhcHBsaWVkIGF0IG9uY2Ugc3luY2hyb25vdXNseVxuICAgKiB0aGVuIGVhY2ggc3Vic2VxdWVudCBjbGFzcy9zdHlsZSBlZmZlY3Qgd291bGQgYmUgYW5pbWF0ZWQgYWZ0ZXIgdGhlXG4gICAqIGxhc3QgdHJhbnNpdGlvbiBzdHlsZSBpcyBhcHBsaWVkLlxuICAgKlxuICAgKiBJdCdzIHByZXR0eSB1bmNvbW1vbiB0aGF0IG11bHRpcGxlIGNsYXNzZXMvc3R5bGVzIGFyZSBhcHBsaWVkIHdpdGhcbiAgICogZGlmZmVyZW50IHRyYW5zaXRpb24gdGltaW5nIHZhbHVlcy4gVGhlcmVmb3JlIGl0J3Mgb25seSB3aGVuIHRoaXNcbiAgICogb2NjdXJzIHRoYXQgcmVmbG93cyArIHJlcXVlc3RBbmltYXRpb25GcmFtZSBjYWxscyBhcmUgdXNlZC5cbiAgICovXG4gIHByaXZhdGUgX2ZsdXNoTmV4dEVmZmVjdCgpIHtcbiAgICB0aGlzLnN0YXRlID0gQW5pbWF0b3JTdGF0ZS5Qcm9jZXNzaW5nRWZmZWN0cztcbiAgICBsZXQgZG9Jc3N1ZVJlZmxvdyA9IGZhbHNlO1xuXG4gICAgaWYgKHRoaXMuX3BlbmRpbmdJbnN0cnVjdGlvbnMubGVuZ3RoKSB7XG4gICAgICBjb25zdCBpbnN0cnVjdGlvbiA9IHRoaXMuX3BlbmRpbmdJbnN0cnVjdGlvbnMuc2hpZnQoKSAhO1xuICAgICAgaWYgKGluc3RydWN0aW9uLnR5cGUgPT09IEluc3RydWN0aW9uVHlwZS5TbmFwc2hvdCkge1xuICAgICAgICBjb25zdCBzdHlsZXNUb0NvbXB1dGUgPSAoaW5zdHJ1Y3Rpb24gYXMgU25hcHNob3RJbnN0cnVjdGlvbikuY29tcHV0ZVN0eWxlcztcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzdHlsZXNUb0NvbXB1dGUubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBjb25zdCBwcm9wID0gc3R5bGVzVG9Db21wdXRlW2ldO1xuICAgICAgICAgIGxldCB2YWx1ZSA9IHJlYWRTdHlsZSh0aGlzLl9lbGVtZW50LCBwcm9wKTtcbiAgICAgICAgICBpZiAoIXZhbHVlKSB7XG4gICAgICAgICAgICB2YWx1ZSA9IHRoaXMuX3JlbmRlclV0aWwuZ2V0Q29tcHV0ZWRTdHlsZSh0aGlzLl9lbGVtZW50LCBwcm9wKTtcbiAgICAgICAgICAgIGFwcGx5U3R5bGUodGhpcy5fZWxlbWVudCwgcHJvcCwgdmFsdWUpO1xuICAgICAgICAgICAgZG9Jc3N1ZVJlZmxvdyA9IHRydWU7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChkb0lzc3VlUmVmbG93KSB7XG4gICAgICAgICAgLy8gaWYgYWxsIGNvbXB1dGVkIHN0eWxlcyB3ZXJlIGRldGVjdGVkIGRpcmVjdGx5IG9uIHRoZSBlbGVtZW50XG4gICAgICAgICAgLy8gdGhlbiB0aGVyZSBpcyBubyBuZWVkIHRvIHRyaWdnZXIgYSByZWZsb3cgdG8gcnVuIHNpbmNlIHRoZXJlXG4gICAgICAgICAgLy8gd2FzIG5vIHN0eWxlIGNvbXB1dGF0aW9uLiBUaGlzIG1lYW5zIHRoZSBuZXh0IGluc3RydWN0aW9uIGNhblxuICAgICAgICAgIC8vIGltbWVkaWF0ZWx5IHRha2UgcGxhY2UuXG4gICAgICAgICAgdGhpcy5fYXBwbHlUcmFuc2l0aW9uKGluc3RydWN0aW9uLnRyYW5zaXRpb25TdHlsZSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoaW5zdHJ1Y3Rpb24udHlwZSA9PT0gSW5zdHJ1Y3Rpb25UeXBlLkFuaW1hdGlvbikge1xuICAgICAgICBjb25zdCBhbmltYXRpb25JbnN0cnVjdGlvbiA9IGluc3RydWN0aW9uIGFzIEFuaW1hdGlvbkluc3RydWN0aW9uO1xuICAgICAgICBjb25zdCBjb21wdXRlZFN0eWxlcyA9XG4gICAgICAgICAgICBhbmltYXRpb25JbnN0cnVjdGlvbi5jb21wdXRlU3R5bGVzID8gdGhpcy5fY29tcHV0ZVN0eWxlcyhhbmltYXRpb25JbnN0cnVjdGlvbikgOiBudWxsO1xuICAgICAgICBpZiAoY29tcHV0ZWRTdHlsZXMgfHwgYW5pbWF0aW9uSW5zdHJ1Y3Rpb24udHJhbnNpdGlvblN0eWxlICE9IHRoaXMuX2xhc3RUcmFuc2l0aW9uVG9rZW4pIHtcbiAgICAgICAgICB0aGlzLl9hcHBseVRyYW5zaXRpb24oYW5pbWF0aW9uSW5zdHJ1Y3Rpb24udHJhbnNpdGlvblN0eWxlKTtcbiAgICAgICAgICBpZiAoY29tcHV0ZWRTdHlsZXMpIHtcbiAgICAgICAgICAgIHRoaXMuX2FjdGl2ZUNvbXB1dGVkU3R5bGVzID1cbiAgICAgICAgICAgICAgICBPYmplY3QuYXNzaWduKHRoaXMuX2FjdGl2ZUNvbXB1dGVkU3R5bGVzIHx8IHt9LCBjb21wdXRlZFN0eWxlcyk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRoaXMuX2FwcGx5U3R5bGluZyhhbmltYXRpb25JbnN0cnVjdGlvbiwgZmFsc2UsIGNvbXB1dGVkU3R5bGVzKTtcbiAgICAgICAgdGhpcy5fYWN0aXZlQW5pbWF0aW9uSW5zdHJ1Y3Rpb25zLnB1c2goYW5pbWF0aW9uSW5zdHJ1Y3Rpb24pO1xuICAgICAgICBkb0lzc3VlUmVmbG93ID0gYW5pbWF0aW9uSW5zdHJ1Y3Rpb24uaXNQcm9wTXVsdGlUcmFuc2l0aW9uO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIGFsbCB0aGUgZWZmZWN0cyBoYXZlIGJlZW4gYXBwbGllZCAuLi4gTm93IHNldCB0aGUgZWxlbWVudFxuICAgIC8vIGludG8gcGxhY2Ugc28gdGhhdCBhIGZvbGxvdy11cCB0cmFuc2l0aW9uIGNhbiBiZSBhcHBsaWVkXG4gICAgaWYgKHRoaXMuX3BlbmRpbmdJbnN0cnVjdGlvbnMubGVuZ3RoKSB7XG4gICAgICBpZiAoZG9Jc3N1ZVJlZmxvdykge1xuICAgICAgICB0aGlzLl9yZW5kZXJVdGlsLmZpcmVSZWZsb3codGhpcy5fZWxlbWVudCwgKCkgPT4gdGhpcy5fZmx1c2hOZXh0RWZmZWN0KCkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5fZmx1c2hOZXh0RWZmZWN0KCk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuc3RhdGUgPSBBbmltYXRvclN0YXRlLlJ1bm5pbmc7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBfYXBwbHlUcmFuc2l0aW9uKHRyYW5zaXRpb25Ub2tlbjogc3RyaW5nKSB7XG4gICAgdGhpcy5fbGFzdFRyYW5zaXRpb25Ub2tlbiA9IHRyYW5zaXRpb25Ub2tlbjtcbiAgICBjb25zdCB0cmFuc2l0aW9uUHJlZml4ID1cbiAgICAgICAgdGhpcy5fY3VycmVudFRyYW5zaXRpb25TdHIgKyAodGhpcy5fY3VycmVudFRyYW5zaXRpb25TdHIubGVuZ3RoID8gJywgJyA6ICcnKTtcbiAgICB0aGlzLl9jdXJyZW50VHJhbnNpdGlvblN0ciA9IHRyYW5zaXRpb25QcmVmaXggKyB0cmFuc2l0aW9uVG9rZW47XG4gICAgdGhpcy5fcmVuZGVyVXRpbC5zZXRUcmFuc2l0aW9uKHRoaXMuX2VsZW1lbnQsIHRoaXMuX2N1cnJlbnRUcmFuc2l0aW9uU3RyKTtcbiAgfVxuXG4gIHByaXZhdGUgX3VwZGF0ZVRpbWVyKCkge1xuICAgIC8vIFNvbWV0aW1lcyBhIHRyYW5zaXRpb24gYW5pbWF0aW9uIG1heSBub3QgYW5pbWF0ZSBhbnl0aGluZyBhdCBhbGxcbiAgICAvLyBkdWUgdG8gbWlzc2luZyBjbGFzc2VzIG9yIHRoZXJlIGJlaW5nIHplcm8gY2hhbmdlIGluIHN0eWxpbmcgKFxuICAgIC8vIHRoZSBlbGVtZW50IGFscmVhZHkgaGFzIHRoZSBzYW1lIHN0eWxpbmcgdGhhdCBpcyBiZWluZyBhbmltYXRlZCkuXG4gICAgLy8gVGhlcmUgaXMgbm8gd2F5IGZvciBKUyBjb2RlIHRvIGRldGVjdCBmb3IgdGhpcyBhbmQgdGhlIE9OTFkgd2F5XG4gICAgLy8gdG8gZ2F1cmFudGVlIHRoYXQgdGhlIHBsYXllciBmaW5pc2hlcyBpcyB0byBzZXR1cCBhIHRpbWVyIHRoYXQgYWN0c1xuICAgIC8vIGFzIGEgZmFsbGJhY2sgaW5jYXNlIHRoaXMgaGFwcGVucy4gVGhlIHJlYXNvbiB3YXkgdGhlIHZhcmlhYmxlIGJlbG93XG4gICAgLy8gaGFzIGFuIGV4dHJhIGJ1ZmZlciB2YWx1ZSBpcyBiZWNhdXNlIHRoZSBicm93c2VyIHVzdWFsbHkgaXNuJ3QgcXVpY2tcbiAgICAvLyBlbm91Z2ggdG8gdHJpZ2dlciBhIHRyYW5zaXRpb24gYW5kIGZpcmUgdGhlIGVuZGluZyBjYWxsYmFjayBpbiB0aGVcbiAgICAvLyBleGFjdCBhbW91bnQgb2YgdGltZSB0aGF0IHRoZSB0cmFuc2l0aW9uIGxhc3RzIGZvciAodGhlcmVmb3JlIHRoZVxuICAgIC8vIGJ1ZmZlciBhbGxvd3MgZm9yIHRoZSBhbmltYXRpb24gdG8gcHJvcGVybHkgZG8gaXRzIGpvYiBpbiB0aW1lKS5cbiAgICBpZiAodGhpcy5fdGltZXIpIHtcbiAgICAgIHRoaXMuX3JlbmRlclV0aWwgPyB0aGlzLl9yZW5kZXJVdGlsLmNsZWFyVGltZW91dCh0aGlzLl90aW1lcikgOiBjbGVhclRpbWVvdXQodGhpcy5fdGltZXIpO1xuICAgIH1cblxuICAgIGNvbnN0IEhBTEZfQV9TRUNPTkQgPSA1MDA7XG4gICAgY29uc3QgbWF4VGltZVdpdGhCdWZmZXIgPSB0aGlzLl9tYXhUaW1lICsgSEFMRl9BX1NFQ09ORDtcbiAgICBjb25zdCBjYiA9ICgpID0+IHRoaXMuX29uQWxsRWZmZWN0c0ZpbmlzaGVkKCk7XG4gICAgdGhpcy5fdGltZXIgPSB0aGlzLl9yZW5kZXJVdGlsID8gdGhpcy5fcmVuZGVyVXRpbC5zZXRUaW1lb3V0KGNiLCBtYXhUaW1lV2l0aEJ1ZmZlcikgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoY2IsIG1heFRpbWVXaXRoQnVmZmVyKTtcbiAgfVxuXG4gIHByaXZhdGUgX29uQWxsRWZmZWN0c0ZpbmlzaGVkKCkge1xuICAgIGlmICh0aGlzLnN0YXRlID49IEFuaW1hdG9yU3RhdGUuUnVubmluZyAmJiB0aGlzLnN0YXRlIDw9IEFuaW1hdG9yU3RhdGUuRXhpdGluZykge1xuICAgICAgaWYgKHRoaXMuX2FjdGl2ZUNvbXB1dGVkU3R5bGVzKSB7XG4gICAgICAgIHRoaXMuX2NsZWFudXBDb21wdXRlZFN0eWxlcyhPYmplY3Qua2V5cyh0aGlzLl9hY3RpdmVDb21wdXRlZFN0eWxlcykpO1xuICAgICAgICB0aGlzLl9hY3RpdmVDb21wdXRlZFN0eWxlcyA9IG51bGw7XG4gICAgICB9XG4gICAgICB0aGlzLl9tYXhUaW1lID0gMDtcbiAgICAgIHRoaXMuX2N1cnJlbnRUcmFuc2l0aW9uU3RyID0gJyc7XG4gICAgICB0aGlzLl9sYXN0VHJhbnNpdGlvblRva2VuID0gJyc7XG4gICAgICB0aGlzLl9hY3RpdmVBbmltYXRpb25JbnN0cnVjdGlvbnMubGVuZ3RoID0gMDtcbiAgICAgIHRoaXMuX3JlbmRlclV0aWwuc2V0VHJhbnNpdGlvbih0aGlzLl9lbGVtZW50LCBudWxsKTtcbiAgICAgIHRoaXMuc3RhdGUgPSBBbmltYXRvclN0YXRlLklkbGU7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuX2xpc3RlbmVycy5sZW5ndGg7IGkrKykge1xuICAgICAgICB0aGlzLl9saXN0ZW5lcnNbaV0oKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuX2xpc3RlbmVycy5sZW5ndGggPSAwO1xuICAgIH1cbiAgfVxuXG4gIHNjaGVkdWxlRmx1c2goKSB7XG4gICAgaWYgKHRoaXMuc3RhdGUgIT09IEFuaW1hdG9yU3RhdGUuV2FpdGluZ0ZvckZsdXNoKSB7XG4gICAgICB0aGlzLl93YWl0Rm9yRnJhbWUoKCkgPT4gdGhpcy5mbHVzaEVmZmVjdHMoKSk7XG4gICAgfVxuICB9XG5cbiAgZmx1c2hFZmZlY3RzKCk6IGJvb2xlYW4ge1xuICAgIGlmICh0aGlzLnN0YXRlICE9PSBBbmltYXRvclN0YXRlLlByb2Nlc3NpbmdFZmZlY3RzICYmIHRoaXMuX3BlbmRpbmdJbnN0cnVjdGlvbnMubGVuZ3RoKSB7XG4gICAgICB0aGlzLl9zdGFydFRpbWUgPSBub3coKTtcbiAgICAgIHRoaXMuX2ZsdXNoTmV4dEVmZmVjdCgpO1xuICAgICAgdGhpcy5fdXBkYXRlVGltZXIoKTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBmaW5pc2hBbGwoKSB7XG4gICAgdGhpcy5fcmVuZGVyVXRpbC5zZXRUcmFuc2l0aW9uKHRoaXMuX2VsZW1lbnQsIENBTkNFTF9BTExfVFJBTlNJVElPTlNfVkFMVUUpO1xuICAgIHRoaXMuc3RhdGUgPSBBbmltYXRvclN0YXRlLkV4aXRpbmc7XG4gICAgdGhpcy5fcmVuZGVyVXRpbC5maXJlUmVmbG93KHRoaXMuX2VsZW1lbnQsICgpID0+IHRoaXMuX29uQWxsRWZmZWN0c0ZpbmlzaGVkKCkpO1xuICB9XG5cbiAgZGVzdHJveSgpIHtcbiAgICBpZiAodGhpcy5zdGF0ZSA8IEFuaW1hdG9yU3RhdGUuRXhpdGluZykge1xuICAgICAgdGhpcy5zdGF0ZSA9IEFuaW1hdG9yU3RhdGUuRXhpdGluZztcbiAgICAgIHRoaXMuX3JlbmRlclV0aWwuc2V0VHJhbnNpdGlvbih0aGlzLl9lbGVtZW50LCBDQU5DRUxfQUxMX1RSQU5TSVRJT05TX1ZBTFVFKTtcbiAgICAgIHRoaXMuX2VsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcigndHJhbnNpdGlvbmVuZCcsIHRoaXMuX2NhcHR1cmVGbik7XG5cbiAgICAgIHRoaXMuX3JlbmRlclV0aWwuZmlyZVJlZmxvdyh0aGlzLl9lbGVtZW50LCAoKSA9PiB7XG4gICAgICAgIHRoaXMuX29uQWxsRWZmZWN0c0ZpbmlzaGVkKCk7XG4gICAgICAgIHRoaXMuc3RhdGUgPSBBbmltYXRvclN0YXRlLkRlc3Ryb3llZDtcbiAgICAgICAgdGhpcy5fY29sbGVjdGVkQ2xhc3NlcyAmJiBhcHBseUNsYXNzQ2hhbmdlcyh0aGlzLl9lbGVtZW50LCB0aGlzLl9jb2xsZWN0ZWRDbGFzc2VzLCB0cnVlKTtcbiAgICAgICAgdGhpcy5fY29sbGVjdGVkU3R5bGVzICYmXG4gICAgICAgICAgICBhcHBseVN0eWxlQ2hhbmdlcyh0aGlzLl9lbGVtZW50LCB0aGlzLl9jb2xsZWN0ZWRTdHlsZXMsIG51bGwsIHRydWUsIG51bGwpO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGJ1aWxkVHJhbnNpdGlvblN0cih0aW1pbmc6IFRpbWluZywgcHJvcHM6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBgJHt0aW1pbmcuZHVyYXRpb259bXMgJHtwcm9wc30gJHt0aW1pbmcuZGVsYXl9bXMke3RpbWluZy5lYXNpbmcgPyAoJyAnICsgdGltaW5nLmVhc2luZykgOiAnJ31gO1xufVxuXG5mdW5jdGlvbiBkZXRlcm1pbmVXaGV0aGVyVG9Db21wdXRlKHByb3A6IHN0cmluZywgdmFsdWU6IHN0cmluZyk6IC0xfDB8MSB7XG4gIGlmICh2YWx1ZSA9PT0gQVVUT19TVFlMRSkgcmV0dXJuIDE7XG4gIHN3aXRjaCAocHJvcCkge1xuICAgIGNhc2UgJ3dpZHRoJzpcbiAgICBjYXNlICdoZWlnaHQnOlxuICAgICAgcmV0dXJuIHZhbHVlID8gLTEgOiAxO1xuICB9XG4gIHJldHVybiAwO1xufVxuXG5mdW5jdGlvbiBmaW5kTWF0Y2hpbmdFZmZlY3QoaW5zdHJ1Y3Rpb25zOiBBbmltYXRpb25JbnN0cnVjdGlvbltdLCBlZmZlY3Q6IFN0eWxpbmdFZmZlY3QpOiBudW1iZXIge1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGluc3RydWN0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgIGlmIChpbnN0cnVjdGlvbnNbaV0uZWZmZWN0ID09PSBlZmZlY3QpIHJldHVybiBpO1xuICB9XG4gIHJldHVybiAtMTtcbn1cbiJdfQ==