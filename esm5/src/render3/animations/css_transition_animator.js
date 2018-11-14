import * as tslib_1 from "tslib";
import { AUTO_STYLE } from './tokens';
import { applyClassChanges, applyStyle, applyStyleChanges, now, readStyle } from './util';
/**
 * This file introduces a transition animator which is designed to
 * handle multiple class/style transitions on an element at the same
 * time.
 */
/**
 * When ALL transitions are cancelled then the styling below
 * will force every transition arc to be interupted.
 */
var CANCEL_ALL_TRANSITIONS_VALUE = '0s none';
/**
 * This will force the very next styles that are applied to
 * be applied IMMEDIATELY to the element (so long as a reflow
 * is issued before the transition value is changed afterwards)
 */
var CANCEL_NEXT_TRANSITION_VALUE = '0s all';
var DEFAULT_TRANSITION_PROP = 'all';
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
var CssTransitionAnimator = /** @class */ (function () {
    function CssTransitionAnimator(_element, _renderUtil, collectStyling) {
        var _this = this;
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
        this._captureFn = function (event) {
            var totalTime = event.timeStamp - _this._startTime;
            if (event.target === _this._element) {
                event.stopPropagation();
                if (totalTime >= _this._maxTime) {
                    _this._onAllEffectsFinished();
                }
            }
        };
        this._element.addEventListener('transitionend', this._captureFn, { capture: true });
        this._collectedClasses = collectStyling ? {} : null;
        this._collectedStyles = collectStyling ? {} : null;
    }
    CssTransitionAnimator.prototype.onAllEffectsDone = function (cb) { this._listeners.push(cb); };
    CssTransitionAnimator.prototype.addEffect = function (effect) {
        var classes = effect.classes, timing = effect.timing;
        var time = this._computeTransitionTime(timing);
        this._maxTime = Math.max(this._maxTime, time);
        // if and when styles are used we want to figure out what properties
        // are set to auto style animate and which ones are being removed.
        // If either is true then we need to signal the animator to pre-compute
        // the missing/auto style values once the effects are processed.
        var computeStylesDuringEffect = null;
        var computeStylesBeforeEffect = null;
        var singleTransitionProp = null;
        var styles = null;
        if (effect.styles) {
            styles = {};
            computeStylesDuringEffect = [];
            computeStylesBeforeEffect = [];
            var props = Object.keys(effect.styles);
            singleTransitionProp = props.length == 1 ? props[0] : null;
            for (var i = 0; i < props.length; i++) {
                var prop = props[i];
                var value = effect.styles[prop];
                var computeStatus = determineWhetherToCompute(prop, value);
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
        var transitionProp = (!classes && singleTransitionProp) || DEFAULT_TRANSITION_PROP;
        if (computeStylesBeforeEffect && computeStylesBeforeEffect.length) {
            this._pendingInstructions.push({
                effect: effect, type: 1 /* Snapshot */, computeStyles: computeStylesBeforeEffect,
                transitionStyle: "0s " + transitionProp
            });
        }
        var transitionStyle = buildTransitionStr(timing, transitionProp);
        this._pendingInstructions.push({
            effect: effect, type: 2 /* Animation */, styles: styles, transitionStyle: transitionStyle,
            classes: classes ? tslib_1.__assign({}, classes) : null,
            computeStyles: (computeStylesDuringEffect && computeStylesDuringEffect.length) ?
                computeStylesDuringEffect :
                null,
            isPropMultiTransition: transitionProp === DEFAULT_TRANSITION_PROP
        });
    };
    CssTransitionAnimator.prototype._computeTransitionTime = function (timing) {
        // the goal is to figure out the total time of this transitions
        // when mixed together with the existing or soon-to-run transitions
        // because `transitionend` events are not 100% reliable (this is
        // explained at the top of this file). Having the total time allows
        // for a fallback timer to be scheduled/replaced so that the final
        // styling can be cleaned up and the transition can be explitly finished.
        var elapsedTimeSoFar = this.state === 4 /* Running */ ? (now() - this._startTime) : 0;
        return elapsedTimeSoFar + timing.duration + timing.delay;
    };
    CssTransitionAnimator.prototype.finishEffect = function (effect) { this._finishOrDestroyEffect(effect, false); };
    CssTransitionAnimator.prototype.destroyEffect = function (effect) { this._finishOrDestroyEffect(effect, true); };
    CssTransitionAnimator.prototype._finishOrDestroyEffect = function (effect, destroy) {
        var _this = this;
        // we wait for a frame in the event that the effect (or any other effects)
        // have been scheduled to be flushed
        this._waitForFrame(function () {
            _this._applyTransition(CANCEL_NEXT_TRANSITION_VALUE);
            _this._applyStyling(effect, true);
            if (destroy) {
                _this._waitForFrame(function () { return _this._cleanupEffect(effect); });
            }
            else {
                _this._waitForFrame(function () {
                    _this._applyStyling(effect);
                    _this._waitForFrame(function () { return _this._cleanupEffect(effect); });
                });
            }
        });
    };
    CssTransitionAnimator.prototype._cleanupComputedStyles = function (computedStyles) {
        for (var i = 0; i < computedStyles.length; i++) {
            var prop = computedStyles[i];
            var computedValue = this._activeComputedStyles && this._activeComputedStyles[prop];
            var activeValue = readStyle(this._element, prop);
            if (computedValue && computedValue === activeValue) {
                // if exactly the same then this means that the AUTO_STYLE was
                // the final styling for the element which means that it was never
                // intended to stick around once the animation is over
                this._activeComputedStyles[prop] = null;
                applyStyle(this._element, prop, null);
            }
        }
    };
    CssTransitionAnimator.prototype._cleanupEffect = function (effect) {
        var effectIndex = findMatchingEffect(this._activeAnimationInstructions, effect);
        if (effectIndex >= 0) {
            var activeEffect = this._activeAnimationInstructions[effectIndex];
            this._activeAnimationInstructions.splice(effectIndex, 1);
            if (activeEffect.computeStyles) {
                this._cleanupComputedStyles(activeEffect.computeStyles);
            }
        }
        this._flushNextEffect();
        var time = this._computeTransitionTime(effect.timing);
        if (time >= this._maxTime) {
            this._onAllEffectsFinished();
        }
    };
    CssTransitionAnimator.prototype._applyStyling = function (effect, revert, preComputedStyles) {
        effect.classes &&
            applyClassChanges(this._element, effect.classes, revert, this._collectedClasses);
        effect.styles &&
            applyStyleChanges(this._element, effect.styles, null, revert, preComputedStyles, this._collectedStyles);
    };
    CssTransitionAnimator.prototype._waitForFrame = function (cb) {
        var _this = this;
        if (!this._pendingFrame) {
            this._pendingFrame = true;
            var flushFn_1;
            this._renderUtil.fireReflow(this._element, flushFn_1 = function () {
                _this._pendingFrame = false;
                // this is eagerly assigned to avoid having
                // the frames grow (those are scheduled later)
                var length = _this._waitingForFrameFns.length;
                for (var i = 0; i < length; i++) {
                    _this._waitingForFrameFns.shift()();
                }
                if (_this._waitingForFrameFns.length && !_this._pendingFrame) {
                    _this._pendingFrame = true;
                    _this._renderUtil.fireReflow(_this._element, flushFn_1);
                }
                else {
                    _this._pendingFrame = false;
                }
            });
        }
        cb && this._waitingForFrameFns.push(cb);
    };
    CssTransitionAnimator.prototype._computeStyles = function (instruction) {
        var _this = this;
        var computeStyles = instruction.computeStyles;
        var duration = instruction.effect.timing.duration;
        var currentStyles = {};
        computeStyles.forEach(function (prop) {
            currentStyles[prop] = _this._renderUtil.getComputedStyle(_this._element, prop);
            _this._element.style.removeProperty(prop);
        });
        var propToBlock = computeStyles.length == 1 ? computeStyles[0] : DEFAULT_TRANSITION_PROP;
        var timing = { duration: duration, delay: -duration, easing: null, fill: null };
        var transitionPrefix = this._currentTransitionStr + (this._currentTransitionStr.length ? ', ' : '');
        var transitionStr = transitionPrefix + buildTransitionStr(timing, propToBlock);
        this._renderUtil.setTransition(this._element, transitionStr);
        var computedStyles = {};
        computeStyles.forEach(function (prop) {
            computedStyles[prop] = _this._renderUtil.getComputedStyle(_this._element, prop);
            _this._element.style.setProperty(prop, currentStyles[prop]);
        });
        this._renderUtil.fireReflow(this._element, null);
        return computedStyles;
    };
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
     */
    CssTransitionAnimator.prototype._flushNextEffect = function () {
        var _this = this;
        this.state = 3 /* ProcessingEffects */;
        var doIssueReflow = false;
        if (this._pendingInstructions.length) {
            var instruction = this._pendingInstructions.shift();
            if (instruction.type === 1 /* Snapshot */) {
                var stylesToCompute = instruction.computeStyles;
                for (var i = 0; i < stylesToCompute.length; i++) {
                    var prop = stylesToCompute[i];
                    var value = readStyle(this._element, prop);
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
                var animationInstruction = instruction;
                var computedStyles = animationInstruction.computeStyles ? this._computeStyles(animationInstruction) : null;
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
                this._renderUtil.fireReflow(this._element, function () { return _this._flushNextEffect(); });
            }
            else {
                this._flushNextEffect();
            }
        }
        else {
            this.state = 4 /* Running */;
        }
    };
    CssTransitionAnimator.prototype._applyTransition = function (transitionToken) {
        this._lastTransitionToken = transitionToken;
        var transitionPrefix = this._currentTransitionStr + (this._currentTransitionStr.length ? ', ' : '');
        this._currentTransitionStr = transitionPrefix + transitionToken;
        this._renderUtil.setTransition(this._element, this._currentTransitionStr);
    };
    CssTransitionAnimator.prototype._updateTimer = function () {
        var _this = this;
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
        var HALF_A_SECOND = 500;
        var maxTimeWithBuffer = this._maxTime + HALF_A_SECOND;
        var cb = function () { return _this._onAllEffectsFinished(); };
        this._timer = this._renderUtil ? this._renderUtil.setTimeout(cb, maxTimeWithBuffer) :
            setTimeout(cb, maxTimeWithBuffer);
    };
    CssTransitionAnimator.prototype._onAllEffectsFinished = function () {
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
            for (var i = 0; i < this._listeners.length; i++) {
                this._listeners[i]();
            }
            this._listeners.length = 0;
        }
    };
    CssTransitionAnimator.prototype.scheduleFlush = function () {
        var _this = this;
        if (this.state !== 2 /* WaitingForFlush */) {
            this._waitForFrame(function () { return _this.flushEffects(); });
        }
    };
    CssTransitionAnimator.prototype.flushEffects = function () {
        if (this.state !== 3 /* ProcessingEffects */ && this._pendingInstructions.length) {
            this._startTime = now();
            this._flushNextEffect();
            this._updateTimer();
            return true;
        }
        return false;
    };
    CssTransitionAnimator.prototype.finishAll = function () {
        var _this = this;
        this._renderUtil.setTransition(this._element, CANCEL_ALL_TRANSITIONS_VALUE);
        this.state = 5 /* Exiting */;
        this._renderUtil.fireReflow(this._element, function () { return _this._onAllEffectsFinished(); });
    };
    CssTransitionAnimator.prototype.destroy = function () {
        var _this = this;
        if (this.state < 5 /* Exiting */) {
            this.state = 5 /* Exiting */;
            this._renderUtil.setTransition(this._element, CANCEL_ALL_TRANSITIONS_VALUE);
            this._element.removeEventListener('transitionend', this._captureFn);
            this._renderUtil.fireReflow(this._element, function () {
                _this._onAllEffectsFinished();
                _this.state = 6 /* Destroyed */;
                _this._collectedClasses && applyClassChanges(_this._element, _this._collectedClasses, true);
                _this._collectedStyles &&
                    applyStyleChanges(_this._element, _this._collectedStyles, null, true, null);
            });
        }
    };
    return CssTransitionAnimator;
}());
export { CssTransitionAnimator };
function buildTransitionStr(timing, props) {
    return timing.duration + "ms " + props + " " + timing.delay + "ms" + (timing.easing ? (' ' + timing.easing) : '');
}
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
function findMatchingEffect(instructions, effect) {
    for (var i = 0; i < instructions.length; i++) {
        if (instructions[i].effect === effect)
            return i;
    }
    return -1;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3NzX3RyYW5zaXRpb25fYW5pbWF0b3IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2FuaW1hdGlvbnMvY3NzX3RyYW5zaXRpb25fYW5pbWF0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQVFBLE9BQU8sRUFBQyxVQUFVLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDcEMsT0FBTyxFQUFDLGlCQUFpQixFQUFFLFVBQVUsRUFBRSxpQkFBaUIsRUFBRSxHQUFHLEVBQUUsU0FBUyxFQUFDLE1BQU0sUUFBUSxDQUFDO0FBSXhGOzs7O0dBSUc7QUFFSDs7O0dBR0c7QUFDSCxJQUFNLDRCQUE0QixHQUFHLFNBQVMsQ0FBQztBQUUvQzs7OztHQUlHO0FBQ0gsSUFBTSw0QkFBNEIsR0FBRyxRQUFRLENBQUM7QUFvQzlDLElBQU0sdUJBQXVCLEdBQUcsS0FBSyxDQUFDO0FBRXRDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQXFERztBQUNIO0lBa0JFLCtCQUNZLFFBQXFCLEVBQVUsV0FBdUIsRUFBRSxjQUF3QjtRQUQ1RixpQkFjQztRQWJXLGFBQVEsR0FBUixRQUFRLENBQWE7UUFBVSxnQkFBVyxHQUFYLFdBQVcsQ0FBWTtRQWxCbEUsVUFBSyxnQkFBcUM7UUFFbEMsZUFBVSxHQUFrQixFQUFFLENBQUM7UUFDL0IseUJBQW9CLEdBQWtCLEVBQUUsQ0FBQztRQUN6QyxpQ0FBNEIsR0FBMkIsRUFBRSxDQUFDO1FBRzFELDBCQUFxQixHQUE4QixJQUFJLENBQUM7UUFFeEQsZUFBVSxHQUFHLENBQUMsQ0FBQztRQUNmLGFBQVEsR0FBRyxDQUFDLENBQUM7UUFFYiwwQkFBcUIsR0FBVyxFQUFFLENBQUM7UUFDbkMsd0JBQW1CLEdBQWtCLEVBQUUsQ0FBQztRQUN4Qyx5QkFBb0IsR0FBVyxFQUFFLENB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QUFTLGtCQUFrQixDQUFDLE1BQWMsRUFBRSxLQUFhO0lBQ3ZELE9BQVUsTUFBTSxDQUFDLFFBQVEsV0FBTSxLQUFLLFNBQUksTUFBTSxDQUFDLEtBQUssV0FBSyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBRSxDQUFDO0FBQ3hHLENBQUM7QUFFRCxTQUFTLHlCQUF5QixDQUFDLElBQVksRUFBRSxLQUFhO0lBQzVELElBQUksS0FBSyxLQUFLLFVBQVU7UUFBRSxPQUFPLENBQUMsQ0FBQztJQUNuQyxRQUFRLElBQUksRUFBRTtRQUNaLEtBQUssT0FBTyxDQUFDO1FBQ2IsS0FBSyxRQUFRO1lBQ1gsT0FBTyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7S0FDekI7SUFDRCxPQUFPLENBQUMsQ0FBQztBQUNYLENBQUM7QUFFRCxTQUFTLGtCQUFrQixDQUFDLFlBQW9DLEVBQUUsTUFBcUI7SUFDckYsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFlBQVksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7UUFDNUMsSUFBSSxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxLQUFLLE1BQU07WUFBRSxPQUFPLENBQUMsQ0FBQztLQUNqRDtJQUNELE9BQU8sQ0FBQyxDQUFDLENBQUM7QUFDWixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0IHtBbmltYXRvciwgQW5pbWF0b3JTdGF0ZSwgUmVuZGVyVXRpbCwgU3R5bGluZ0VmZmVjdCwgVGltaW5nfSBmcm9tICcuL2ludGVyZmFjZXMnO1xuaW1wb3J0IHtBVVRPX1NUWUxFfSBmcm9tICcuL3Rva2Vucyc7XG5pbXBvcnQge2FwcGx5Q2xhc3NDaGFuZ2VzLCBhcHBseVN0eWxlLCBhcHBseVN0eWxlQ2hhbmdlcywgbm93LCByZWFkU3R5bGV9IGZyb20gJy4vdXRpbCc7XG5cblxuXG4vKipcbiAqIFRoaXMgZmlsZSBpbnRyb2R1Y2VzIGEgdHJhbnNpdGlvbiBhbmltYXRvciB3aGljaCBpcyBkZXNpZ25lZCB0b1xuICogaGFuZGxlIG11bHRpcGxlIGNsYXNzL3N0eWxlIHRyYW5zaXRpb25zIG9uIGFuIGVsZW1lbnQgYXQgdGhlIHNhbWVcbiAqIHRpbWUuXG4gKi9cblxuLyoqXG4gKiBXaGVuIEFMTCB0cmFuc2l0aW9ucyBhcmUgY2FuY2VsbGVkIHRoZW4gdGhlIHN0eWxpbmcgYmVsb3dcbiAqIHdpbGwgZm9yY2UgZXZlcnkgdHJhbnNpdGlvbiBhcmMgdG8gYmUgaW50ZXJ1cHRlZC5cbiAqL1xuY29uc3QgQ0FOQ0VMX0FMTF9UUkFOU0lUSU9OU19WQUxVRSA9ICcwcyBub25lJztcblxuLyoqXG4gKiBUaGlzIHdpbGwgZm9yY2UgdGhlIHZlcnkgbmV4dCBzdHlsZXMgdGhhdCBhcmUgYXBwbGllZCB0b1xuICogYmUgYXBwbGllZCBJTU1FRElBVEVMWSB0byB0aGUgZWxlbWVudCAoc28gbG9uZyBhcyBhIHJlZmxvd1xuICogaXMgaXNzdWVkIGJlZm9yZSB0aGUgdHJhbnNpdGlvbiB2YWx1ZSBpcyBjaGFuZ2VkIGFmdGVyd2FyZHMpXG4gKi9cbmNvbnN0IENBTkNFTF9ORVhUX1RSQU5TSVRJT05fVkFMVUUgPSAnMHMgYWxsJztcblxuLyoqXG4gKiBTcGVjaWFsLCBpbnRlcm5hbC1vbmx5IHZlcnNpb24gb2YgU3R5bGluZ0VmZmVjdFxuICogd2hpY2ggaXMgc3BlY2lmaWMgdG8gdGhlIHRyYW5zaXRpb24gYW5pbWF0b3IuXG4gKlxuICogVGhlIHByZUNvbXB1dGVkU3R5bGVzIG1lbWJlciB2YWx1ZSAod2hpY2ggaXNcbiAqIGVpdGhlciBzcGVjaWZpYyBkaW1lbnNpb25hbCBzdHlsZXMgb3IgYW55XG4gKiBzdHlsZXMgbWFya2VkIHdpdGggYW4gQVVUT19TVFlMRSB2YWx1ZSkgYXJlXG4gKiBwaWNrZWQgdXAgYnkgdGhlIHRyYW5zaXRpb24gYW5pbWF0b3IgYW5kXG4gKiBldmFsdWF0ZWQganVzdCBhcyB0aGUgZWZmZWN0cyBhcmUgcHJvY2Vzc2VkLlxuICovXG5jb25zdCBlbnVtIEluc3RydWN0aW9uVHlwZSB7XG4gIFNuYXBzaG90ID0gMSxcbiAgQW5pbWF0aW9uID0gMixcbn1cblxuaW50ZXJmYWNlIEluc3RydWN0aW9uIHtcbiAgZWZmZWN0OiBTdHlsaW5nRWZmZWN0O1xuICB0eXBlOiBJbnN0cnVjdGlvblR5cGU7XG4gIHRyYW5zaXRpb25TdHlsZTogc3RyaW5nO1xufVxuXG5pbnRlcmZhY2UgQW5pbWF0aW9uSW5zdHJ1Y3Rpb24gZXh0ZW5kcyBJbnN0cnVjdGlvbiB7XG4gIHR5cGU6IEluc3RydWN0aW9uVHlwZS5BbmltYXRpb247XG4gIHN0eWxlczoge1trZXk6IHN0cmluZ106IGFueX18bnVsbDtcbiAgY2xhc3Nlczoge1trZXk6IHN0cmluZ106IGFueX18bnVsbDtcbiAgY29tcHV0ZVN0eWxlczogc3RyaW5nW118bnVsbDtcbiAgaXNQcm9wTXVsdGlUcmFuc2l0aW9uOiBib29sZWFuO1xufVxuXG5pbnRlcmZhY2UgU25hcHNob3RJbnN0cnVjdGlvbiBleHRlbmRzIEluc3RydWN0aW9uIHtcbiAgdHlwZTogSW5zdHJ1Y3Rpb25UeXBlLlNuYXBzaG90O1xuICBjb21wdXRlU3R5bGVzOiBzdHJpbmdbXTtcbn1cblxuY29uc3QgREVGQVVMVF9UUkFOU0lUSU9OX1BST1AgPSAnYWxsJztcblxuLyoqXG4gKiBUaGUgQ3NzVHJhbnNpdGlvbkFuaW1hdG9yIGlzIHByaW1hcmlseSAoaW4gbW9kZXJuIGJyb3dzZXJzKSB1c2VkXG4gKiB0byBhbmltYXRlIENTUyBjbGFzcyAod2hpY2ggY2FuIE9OTFkgYmUgYW5pbWF0ZWQgdXNpbmcgdHJhbnNpdGlvbnNcbiAqIGFuZCBpbmxpbmUgc3R5bGUgdHJhbnNpdGlvbnMgdG9nZXRoZXIgaW4gdGhlIHNhbWUgYW5pbWF0aW9uIGFyY3MuXG4gKlxuICogQ1NTIHRyYW5zaXRpb25zICh3aGVuIGludGVyZmFjZWQgd2l0aCBpbiBKYXZhU2NyaXB0KSBkbyBub3QgaGF2ZSBhXG4gKiBzdHJhaWdodGZvcndhcmQgQVBJLiBUaGUgb25seSB3YXkgdG8gZGV0ZWN0IGlmIGEgdHJhbnNpdGlvbiBlbmRzXG4gKiAod2hlbiB0aGUgYW5pbWF0aW9uIGZpbmlzaGVzKSBpcyBieSB1c2Ugb2YgdGhlIGB0cmFuc2l0aW9uZW5kYCBldmVudC5cbiAqIERlc3BpdGUgdGhlIGV2ZW50IGJlaW5nIHN1cHBvcnRlZCBieSBhbGwgYnJvd3NlcnMsIHRoZSBiZWhhdmlvciBvZlxuICogdGhlIGV2ZW50IGlzIHZlcnkgbGltaXRlZCBiZWNhdXNlIGl0IHdpbGwgb25seSBmaXJlIG9uIENTUyBwcm9wZXJ0eVxuICogY2hhbmdlcyBhbmQgTk9UIG9uIENTUyBjbGFzcyBjaGFuZ2VzLiBUaGlzIG1lYW5zIHRoYXQgdG8gcHJvcGVybHkgcmVseVxuICogb24gdGhlIGV2ZW50IHRoZW4gZWFjaCBvZiB0aGUgQ1NTIHN0eWxlcyBuZWVkIHRvIGJlIGtub3duICh3aGljaCBpc1xuICogaW1wb3NzaWJsZSB0byBrbm93IHVwZnJvbnQgc2luY2UgQ1NTIGNsYXNzZXMgYXJlIGhpZGRlbiB3aXRoaW4gQ1NTXG4gKiBzdHlsZXNoZWV0cyBhbmQgbWF5IGNoYW5nZSBiYXNlZCBvbiBtZWRpYSBxdWVyaWVzIGFuZCBET00gc3RhdGUpLlxuICpcbiAqIERlc3BpdGUgdGhpcyBsaW1pdGF0aW9uLCB0aGUgdHJhbnNpdGlvbiBhbmltYXRvciBjbGFzcyBiZWxvdyBzdGlsbFxuICogdXNlcyB1c2VzIHRoZSBgdHJhbnNpdGlvbmVuZGAgZXZlbnQgdG8gZGV0ZWN0IGZvciBhbmltYXRpb25zIHRoYXRcbiAqIGVuZC4gSXQgd2lsbCB3YWl0IGZvciB0aGUgbGFyZ2VzdC10aW1lZCBgdHJhbnNpdGlvbmVuZGAgZXZlbnQgdG9cbiAqIGZpcmUgYW5kIGNhcHR1cmUgdGhhdCBhbmQgdGhlbiBlbmQgYWxsIHRoZSB0cmFuc2l0aW9ucyBhZnRlcndhcmRzLlxuICogRm9yIHRoaXMgdG8gd29yaywgYWxsIHRoZSBzdHlsZXMgYXJlIGNsYXNzZXMgYXJlIGFwcGxpZWQgb250byB0aGVcbiAqIGVsZW1lbnQgdXNpbmcgdmFyaW91cywgY29tbWEtc2VwYXJhdGVkIHRyYW5zaXRpb24gc3RyaW5ncyAob25lIGZvclxuICogZWFjaCBzdHlsZS9jbGFzcyBlZmZlY3QgdGhhdCBpcyBhZGRlZCB0byB0aGUgYW5pbWF0b3IpLlxuICpcbiAqIFRoZSByZWFzb24gYWxsIGNsYXNzZXMvc3R5bGVzIG9uIHRoZSBzYW1lIGVsZW1lbnQgYXJlIGNvbWJpbmVkIHRvZ2V0aGVyXG4gKiBpbnRvIHRoZSBhbmltYXRvciBmb3IgdGhlIHNhbWUgZWxlbWVudCBhcmUgZHVlIHRvIHRoZSBmb2xsb3dpbmcgcmVhc29uczpcbiAqXG4gKiAxLiBUbyBmaWd1cmUgb3V0IHdoYXQgdGhlIG1heGltdW0gd2FpdCB0aW1lIGlzIGZvciB0aGUgZnVsbCB0cmFuc2l0aW9uXG4gKiAgICBhbmQgdGhlbiB0byBjaGVjayBhZ2FpbnN0IHRoYXQgYWZ0ZXIgZXZlcnkgYHRyYW5zaXRpb25lbmRgIGV2ZW50XG4gKiAgICBmaXJlcy5cbiAqIDIuIFRvIHNldHVwIGEgYHNldFRpbWVvdXRgIGZhbGxiYWNrIHRoYXQgd2lsbCBmaXJlIGluIHRoZSBldmVudCB0aGF0XG4gKiAgICBgdHJhbnNpdGlvbmVuZGAgZmFpbHMgdG8gZmlyZSAod2hpY2ggY2FuIGhhcHBlbiBpZiB0aGVyZSBhcmUgbm9cbiAqICAgIHN0eWxlcyBzZXQgdG8gYW5pbWF0ZSBkdWUgdG8gYSBtaXNzaW5nIGNsYXNzIG9yIG5vIHN0eWxlIGNoYW5nZXMpXG4gKiAzLiBUbyBhcHBseSB0aGUgdHJhbnNpdGlvbiB0aW1pbmcgc3R5bGVzIG9uZSBieSBvbmUgb250byB0aGUgZWxlbWVudFxuICogICAgd2l0aCBhIHJlZmxvdyBmcmFtZSBpbiBiZXR3ZWVuICh0aGlzIGNhdXNlcyBvbmUgc2V0IG9mIGNsYXNzZXMvc3R5bGVzXG4gKiAgICB0byBhbmltYXRlIGJlZm9yZSBhbm90aGVyIHdoaWNoIGludHVybiBhbGxvd3MgZm9yIG11bHRpcGxlIENTU1xuICogICAgdHJhbnNpdGlvbnMgdG8gZmlyZSBvbiBhIHNpbmdsZSBlbGVtZW50IGF0IHRoZSBzYW1lIHRpbWUpLlxuICpcbiAqIE9uY2UgdGhlIGFuaW1hdG9yIHN0YXJ0cyBhbmQgdGhlIHRyYW5zaXRpb25zIGFyZSBhcHBsaWVkLCBlYWNoXG4gKiB0cmFuc2l0aW9uIHN0cmluZyB2YWx1ZSBpcyBhcHBsaWVkIGluIHRoZSBmb2xsb3dpbmcgd2F5LlxuICpcbiAqIDEuIEFwcGx5IGZpcnN0IHRyYW5zaXRpb24gKGUuZy4gc3R5bGU9XCJ0cmFuc2l0aW9uOiAxcyBhbGxcIilcbiAqIDIuIEFwcGx5IHRoZSBjbGFzc2VzIGFuZC9vciBzdHlsZXMgcHJlc2VudCBpbiB0aGUgcXVldWVkIHRyYW5zaXRpb25cbiAqICAgICh0aGlzIGtpY2tzIG9mZiB0aGUgdHJhbnNpdGlvbiBmb3IgdGhhdCBnaXZlbiBzdHlsZXMvY2xhc3NlcyBlZmZlY3QpXG4gKiAzLiBSdW4gYSByZWZsb3cgKHdoaWNoIHVzZXMgbWVhc3VyZW1lbnQgY29tcHV0YXRpb24gKyBSQUYpXG4gKiA0LiBUaGVuIHJlcGVhdCBmcm9tIHN0ZXAgMSBhbmQgYXBwbHkgdGhlIG5leHQgdHJhbnNpdGlvbiBlZmZlY3RcbiAqXG4gKiBPbmNlIHRoZSBjbGFzc2VzL3N0eWxlcyBhbmQgdHJhbnNpdGlvbiBzdHJpbmdzIGhhdmUgYWxsIGJlZW4gYXBwbGllZFxuICogdGhlbiB0aGUgcGxheWVyIGNvZGUgd2lsbCB3YWl0IGZvciBgdHJhbnNpdGlvbmVuZGAgYW5kIHdpbGwgdGhlblxuICogb25seSBmaW5pc2ggdGhlIHRyYW5zaXRpb24gYW5pbWF0aW9uIG9uY2UgdGhlIGxvbmdlc3QgdHJhbnNpdGlvblxuICogYW5pbWF0aW9uIGhhcyBmaW5pc2hlZCAob3IgdGhlIHRpbWVyIHJ1bnMgb3V0KS5cbiAqXG4gKiBPbmx5IG9uY2UgYWxsIHRoZSB0cmFuc2l0aW9ucyBhcmUgZmluaXNoZWQgdGhlbiB0aGUgdW5kZXJseWluZyB0cmFuc2l0aW9uXG4gKiBzdHlsZSBzdHJpbmcgd2lsbCBiZSByZW1vdmVkIGZyb20gdGhlIGVsZW1lbnQuXG4gKi9cbmV4cG9ydCBjbGFzcyBDc3NUcmFuc2l0aW9uQW5pbWF0b3IgaW1wbGVtZW50cyBBbmltYXRvciB7XG4gIHN0YXRlOiBBbmltYXRvclN0YXRlID0gQW5pbWF0b3JTdGF0ZS5JZGxlO1xuXG4gIHByaXZhdGUgX2xpc3RlbmVyczogKCgpID0+IGFueSlbXSA9IFtdO1xuICBwcml2YXRlIF9wZW5kaW5nSW5zdHJ1Y3Rpb25zOiBJbnN0cnVjdGlvbltdID0gW107XG4gIHByaXZhdGUgX2FjdGl2ZUFuaW1hdGlvbkluc3RydWN0aW9uczogQW5pbWF0aW9uSW5zdHJ1Y3Rpb25bXSA9IFtdO1xuICBwcml2YXRlIF9jb2xsZWN0ZWRDbGFzc2VzOiB7W2NsYXNzTmFtZTogc3RyaW5nXTogYm9vbGVhbn18bnVsbDtcbiAgcHJpdmF0ZSBfY29sbGVjdGVkU3R5bGVzOiB7W2tleTogc3RyaW5nXTogYW55fXxudWxsO1xuICBwcml2YXRlIF9hY3RpdmVDb21wdXRlZFN0eWxlczoge1trZXk6IHN0cmluZ106IGFueX18bnVsbCA9IG51bGw7XG4gIHByaXZhdGUgX2NhcHR1cmVGbjogKGV2ZW50OiBBbmltYXRpb25FdmVudCkgPT4gYW55O1xuICBwcml2YXRlIF9zdGFydFRpbWUgPSAwO1xuICBwcml2YXRlIF9tYXhUaW1lID0gMDtcbiAgcHJpdmF0ZSBfdGltZXI6IGFueTtcbiAgcHJpdmF0ZSBfY3VycmVudFRyYW5zaXRpb25TdHI6IHN0cmluZyA9ICcnO1xuICBwcml2YXRlIF93YWl0aW5nRm9yRnJhbWVGbnM6ICgoKSA9PiBhbnkpW10gPSBbXTtcbiAgcHJpdmF0ZSBfbGFzdFRyYW5zaXRpb25Ub2tlbjogc3RyaW5nID0gJyc7XG4gIHByaXZhdGUgX3BlbmRpbmdGcmFtZSA9IGZhbHNlO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgICAgcHJpdmF0ZSBfZWxlbWVudDogSFRNTEVsZW1lbnQsIHByaXZhdGUgX3JlbmRlclV0aWw6IFJlbmRlclV0aWwsIGNvbGxlY3RTdHlsaW5nPzogYm9vbGVhbikge1xuICAgIHRoaXMuX2NhcHR1cmVGbiA9IChldmVudDogQW5pbWF0aW9uRXZlbnQpID0+IHtcbiAgICAgIGNvbnN0IHRvdGFsVGltZSA9IGV2ZW50LnRpbWVTdGFtcCAtIHRoaXMuX3N0YXJ0VGltZTtcbiAgICAgIGlmIChldmVudC50YXJnZXQgPT09IHRoaXMuX2VsZW1lbnQpIHtcbiAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgIGlmICh0b3RhbFRpbWUgPj0gdGhpcy5fbWF4VGltZSkge1xuICAgICAgICAgIHRoaXMuX29uQWxsRWZmZWN0c0ZpbmlzaGVkKCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9O1xuICAgIHRoaXMuX2VsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigndHJhbnNpdGlvbmVuZCcsIHRoaXMuX2NhcHR1cmVGbiwge2NhcHR1cmU6IHRydWV9KTtcbiAgICB0aGlzLl9jb2xsZWN0ZWRDbGFzc2VzID0gY29sbGVjdFN0eWxpbmcgPyB7fSA6IG51bGw7XG4gICAgdGhpcy5fY29sbGVjdGVkU3R5bGVzID0gY29sbGVjdFN0eWxpbmcgPyB7fSA6IG51bGw7XG4gIH1cblxuICBvbkFsbEVmZmVjdHNEb25lKGNiOiAoKSA9PiBhbnkpIHsgdGhpcy5fbGlzdGVuZXJzLnB1c2goY2IpOyB9XG5cbiAgYWRkRWZmZWN0KGVmZmVjdDogU3R5bGluZ0VmZmVjdCkge1xuICAgIGNvbnN0IHtjbGFzc2VzLCB0aW1pbmd9ID0gZWZmZWN0O1xuICAgIGNvbnN0IHRpbWUgPSB0aGlzLl9jb21wdXRlVHJhbnNpdGlvblRpbWUodGltaW5nKTtcbiAgICB0aGlzLl9tYXhUaW1lID0gTWF0aC5tYXgodGhpcy5fbWF4VGltZSwgdGltZSk7XG5cbiAgICAvLyBpZiBhbmQgd2hlbiBzdHlsZXMgYXJlIHVzZWQgd2Ugd2FudCB0byBmaWd1cmUgb3V0IHdoYXQgcHJvcGVydGllc1xuICAgIC8vIGFyZSBzZXQgdG8gYXV0byBzdHlsZSBhbmltYXRlIGFuZCB3aGljaCBvbmVzIGFyZSBiZWluZyByZW1vdmVkLlxuICAgIC8vIElmIGVpdGhlciBpcyB0cnVlIHRoZW4gd2UgbmVlZCB0byBzaWduYWwgdGhlIGFuaW1hdG9yIHRvIHByZS1jb21wdXRlXG4gICAgLy8gdGhlIG1pc3NpbmcvYXV0byBzdHlsZSB2YWx1ZXMgb25jZSB0aGUgZWZmZWN0cyBhcmUgcHJvY2Vzc2VkLlxuICAgIGxldCBjb21wdXRlU3R5bGVzRHVyaW5nRWZmZWN0OiBzdHJpbmdbXXxudWxsID0gbnVsbDtcbiAgICBsZXQgY29tcHV0ZVN0eWxlc0JlZm9yZUVmZmVjdDogc3RyaW5nW118bnVsbCA9IG51bGw7XG5cbiAgICBsZXQgc2luZ2xlVHJhbnNpdGlvblByb3AgPSBudWxsO1xuICAgIGxldCBzdHlsZXM6IHtba2V5OiBzdHJpbmddOiBhbnl9fG51bGwgPSBudWxsO1xuICAgIGlmIChlZmZlY3Quc3R5bGVzKSB7XG4gICAgICBzdHlsZXMgPSB7fTtcbiAgICAgIGNvbXB1dGVTdHlsZXNEdXJpbmdFZmZlY3QgPSBbXTtcbiAgICAgIGNvbXB1dGVTdHlsZXNCZWZvcmVFZmZlY3QgPSBbXTtcbiAgICAgIGNvbnN0IHByb3BzID0gT2JqZWN0LmtleXMoZWZmZWN0LnN0eWxlcyk7XG4gICAgICBzaW5nbGVUcmFuc2l0aW9uUHJvcCA9IHByb3BzLmxlbmd0aCA9PSAxID8gcHJvcHNbMF0gOiBudWxsO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwcm9wcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBjb25zdCBwcm9wID0gcHJvcHNbaV07XG4gICAgICAgIGxldCB2YWx1ZSA9IGVmZmVjdC5zdHlsZXNbcHJvcF07XG4gICAgICAgIGNvbnN0IGNvbXB1dGVTdGF0dXMgPSBkZXRlcm1pbmVXaGV0aGVyVG9Db21wdXRlKHByb3AsIHZhbHVlKTtcbiAgICAgICAgc3dpdGNoIChjb21wdXRlU3RhdHVzKSB7XG4gICAgICAgICAgY2FzZSAtMTpcbiAgICAgICAgICAgIGNvbXB1dGVTdHlsZXNCZWZvcmVFZmZlY3QucHVzaChwcm9wKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgMTpcbiAgICAgICAgICAgIGNvbXB1dGVTdHlsZXNEdXJpbmdFZmZlY3QucHVzaChwcm9wKTtcbiAgICAgICAgICAgIHZhbHVlID0gQVVUT19TVFlMRTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIHN0eWxlc1twcm9wXSA9IHZhbHVlO1xuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IHRyYW5zaXRpb25Qcm9wID0gKCFjbGFzc2VzICYmIHNpbmdsZVRyYW5zaXRpb25Qcm9wKSB8fCBERUZBVUxUX1RSQU5TSVRJT05fUFJPUDtcbiAgICBpZiAoY29tcHV0ZVN0eWxlc0JlZm9yZUVmZmVjdCAmJiBjb21wdXRlU3R5bGVzQmVmb3JlRWZmZWN0Lmxlbmd0aCkge1xuICAgICAgdGhpcy5fcGVuZGluZ0luc3RydWN0aW9ucy5wdXNoKHtcbiAgICAgICAgZWZmZWN0LCB0eXBlOiBJbnN0cnVjdGlvblR5cGUuU25hcHNob3QsIGNvbXB1dGVTdHlsZXM6IGNvbXB1dGVTdHlsZXNCZWZvcmVFZmZlY3QsXG4gICAgICAgICAgICB0cmFuc2l0aW9uU3R5bGU6IGAwcyAke3RyYW5zaXRpb25Qcm9wfWBcbiAgICAgIH0gYXMgU25hcHNob3RJbnN0cnVjdGlvbik7XG4gICAgfVxuXG4gICAgY29uc3QgdHJhbnNpdGlvblN0eWxlID0gYnVpbGRUcmFuc2l0aW9uU3RyKHRpbWluZywgdHJhbnNpdGlvblByb3ApO1xuICAgIHRoaXMuX3BlbmRpbmdJbnN0cnVjdGlvbnMucHVzaCh7XG4gICAgICBlZmZlY3QsIHR5cGU6IEluc3RydWN0aW9uVHlwZS5BbmltYXRpb24sIHN0eWxlcywgdHJhbnNpdGlvblN0eWxlLFxuICAgICAgICAgIGNsYXNzZXM6IGNsYXNzZXMgPyB7Li4uY2xhc3Nlc30gOiBudWxsLFxuICAgICAgICAgIGNvbXB1dGVTdHlsZXM6IChjb21wdXRlU3R5bGVzRHVyaW5nRWZmZWN0ICYmIGNvbXB1dGVTdHlsZXNEdXJpbmdFZmZlY3QgIS5sZW5ndGgpID9cbiAgICAgICAgICBjb21wdXRlU3R5bGVzRHVyaW5nRWZmZWN0IDpcbiAgICAgICAgICBudWxsLFxuICAgICAgICAgIGlzUHJvcE11bHRpVHJhbnNpdGlvbjogdHJhbnNpdGlvblByb3AgPT09IERFRkFVTFRfVFJBTlNJVElPTl9QUk9QXG4gICAgfSBhcyBBbmltYXRpb25JbnN0cnVjdGlvbik7XG4gIH1cblxuICBwcml2YXRlIF9jb21wdXRlVHJhbnNpdGlvblRpbWUodGltaW5nOiBUaW1pbmcpIHtcbiAgICAvLyB0aGUgZ29hbCBpcyB0byBmaWd1cmUgb3V0IHRoZSB0b3RhbCB0aW1lIG9mIHRoaXMgdHJhbnNpdGlvbnNcbiAgICAvLyB3aGVuIG1peGVkIHRvZ2V0aGVyIHdpdGggdGhlIGV4aXN0aW5nIG9yIHNvb24tdG8tcnVuIHRyYW5zaXRpb25zXG4gICAgLy8gYmVjYXVzZSBgdHJhbnNpdGlvbmVuZGAgZXZlbnRzIGFyZSBub3QgMTAwJSByZWxpYWJsZSAodGhpcyBpc1xuICAgIC8vIGV4cGxhaW5lZCBhdCB0aGUgdG9wIG9mIHRoaXMgZmlsZSkuIEhhdmluZyB0aGUgdG90YWwgdGltZSBhbGxvd3NcbiAgICAvLyBmb3IgYSBmYWxsYmFjayB0aW1lciB0byBiZSBzY2hlZHVsZWQvcmVwbGFjZWQgc28gdGhhdCB0aGUgZmluYWxcbiAgICAvLyBzdHlsaW5nIGNhbiBiZSBjbGVhbmVkIHVwIGFuZCB0aGUgdHJhbnNpdGlvbiBjYW4gYmUgZXhwbGl0bHkgZmluaXNoZWQuXG4gICAgY29uc3QgZWxhcHNlZFRpbWVTb0ZhciA9IHRoaXMuc3RhdGUgPT09IEFuaW1hdG9yU3RhdGUuUnVubmluZyA/IChub3coKSAtIHRoaXMuX3N0YXJ0VGltZSkgOiAwO1xuICAgIHJldHVybiBlbGFwc2VkVGltZVNvRmFyICsgdGltaW5nLmR1cmF0aW9uICsgdGltaW5nLmRlbGF5O1xuICB9XG5cbiAgZmluaXNoRWZmZWN0KGVmZmVjdDogU3R5bGluZ0VmZmVjdCkgeyB0aGlzLl9maW5pc2hPckRlc3Ryb3lFZmZlY3QoZWZmZWN0LCBmYWxzZSk7IH1cblxuICBkZXN0cm95RWZmZWN0KGVmZmVjdDogU3R5bGluZ0VmZmVjdCkgeyB0aGlzLl9maW5pc2hPckRlc3Ryb3lFZmZlY3QoZWZmZWN0LCB0cnVlKTsgfVxuXG4gIHByaXZhdGUgX2ZpbmlzaE9yRGVzdHJveUVmZmVjdChlZmZlY3Q6IFN0eWxpbmdFZmZlY3QsIGRlc3Ryb3k6IGJvb2xlYW4pIHtcbiAgICAvLyB3ZSB3YWl0IGZvciBhIGZyYW1lIGluIHRoZSBldmVudCB0aGF0IHRoZSBlZmZlY3QgKG9yIGFueSBvdGhlciBlZmZlY3RzKVxuICAgIC8vIGhhdmUgYmVlbiBzY2hlZHVsZWQgdG8gYmUgZmx1c2hlZFxuICAgIHRoaXMuX3dhaXRGb3JGcmFtZSgoKSA9PiB7XG4gICAgICB0aGlzLl9hcHBseVRyYW5zaXRpb24oQ0FOQ0VMX05FWFRfVFJBTlNJVElPTl9WQUxVRSk7XG4gICAgICB0aGlzLl9hcHBseVN0eWxpbmcoZWZmZWN0LCB0cnVlKTtcblxuICAgICAgaWYgKGRlc3Ryb3kpIHtcbiAgICAgICAgdGhpcy5fd2FpdEZvckZyYW1lKCgpID0+IHRoaXMuX2NsZWFudXBFZmZlY3QoZWZmZWN0KSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLl93YWl0Rm9yRnJhbWUoKCkgPT4ge1xuICAgICAgICAgIHRoaXMuX2FwcGx5U3R5bGluZyhlZmZlY3QpO1xuICAgICAgICAgIHRoaXMuX3dhaXRGb3JGcmFtZSgoKSA9PiB0aGlzLl9jbGVhbnVwRWZmZWN0KGVmZmVjdCkpO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgX2NsZWFudXBDb21wdXRlZFN0eWxlcyhjb21wdXRlZFN0eWxlczogc3RyaW5nW10pIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNvbXB1dGVkU3R5bGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBwcm9wID0gY29tcHV0ZWRTdHlsZXNbaV07XG4gICAgICBjb25zdCBjb21wdXRlZFZhbHVlID0gdGhpcy5fYWN0aXZlQ29tcHV0ZWRTdHlsZXMgJiYgdGhpcy5fYWN0aXZlQ29tcHV0ZWRTdHlsZXNbcHJvcF07XG4gICAgICBjb25zdCBhY3RpdmVWYWx1ZSA9IHJlYWRTdHlsZSh0aGlzLl9lbGVtZW50LCBwcm9wKTtcbiAgICAgIGlmIChjb21wdXRlZFZhbHVlICYmIGNvbXB1dGVkVmFsdWUgPT09IGFjdGl2ZVZhbHVlKSB7XG4gICAgICAgIC8vIGlmIGV4YWN0bHkgdGhlIHNhbWUgdGhlbiB0aGlzIG1lYW5zIHRoYXQgdGhlIEFVVE9fU1RZTEUgd2FzXG4gICAgICAgIC8vIHRoZSBmaW5hbCBzdHlsaW5nIGZvciB0aGUgZWxlbWVudCB3aGljaCBtZWFucyB0aGF0IGl0IHdhcyBuZXZlclxuICAgICAgICAvLyBpbnRlbmRlZCB0byBzdGljayBhcm91bmQgb25jZSB0aGUgYW5pbWF0aW9uIGlzIG92ZXJcbiAgICAgICAgdGhpcy5fYWN0aXZlQ29tcHV0ZWRTdHlsZXMgIVtwcm9wXSA9IG51bGw7XG4gICAgICAgIGFwcGx5U3R5bGUodGhpcy5fZWxlbWVudCwgcHJvcCwgbnVsbCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBfY2xlYW51cEVmZmVjdChlZmZlY3Q6IFN0eWxpbmdFZmZlY3QpIHtcbiAgICBjb25zdCBlZmZlY3RJbmRleCA9IGZpbmRNYXRjaGluZ0VmZmVjdCh0aGlzLl9hY3RpdmVBbmltYXRpb25JbnN0cnVjdGlvbnMsIGVmZmVjdCk7XG4gICAgaWYgKGVmZmVjdEluZGV4ID49IDApIHtcbiAgICAgIGNvbnN0IGFjdGl2ZUVmZmVjdCA9IHRoaXMuX2FjdGl2ZUFuaW1hdGlvbkluc3RydWN0aW9uc1tlZmZlY3RJbmRleF07XG4gICAgICB0aGlzLl9hY3RpdmVBbmltYXRpb25JbnN0cnVjdGlvbnMuc3BsaWNlKGVmZmVjdEluZGV4LCAxKTtcbiAgICAgIGlmIChhY3RpdmVFZmZlY3QuY29tcHV0ZVN0eWxlcykge1xuICAgICAgICB0aGlzLl9jbGVhbnVwQ29tcHV0ZWRTdHlsZXMoYWN0aXZlRWZmZWN0LmNvbXB1dGVTdHlsZXMpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMuX2ZsdXNoTmV4dEVmZmVjdCgpO1xuICAgIGNvbnN0IHRpbWUgPSB0aGlzLl9jb21wdXRlVHJhbnNpdGlvblRpbWUoZWZmZWN0LnRpbWluZyk7XG4gICAgaWYgKHRpbWUgPj0gdGhpcy5fbWF4VGltZSkge1xuICAgICAgdGhpcy5fb25BbGxFZmZlY3RzRmluaXNoZWQoKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIF9hcHBseVN0eWxpbmcoXG4gICAgICBlZmZlY3Q6IFN0eWxpbmdFZmZlY3R8QW5pbWF0aW9uSW5zdHJ1Y3Rpb24sIHJldmVydD86IGJvb2xlYW4sXG4gICAgICBwcmVDb21wdXRlZFN0eWxlcz86IHtba2V5OiBzdHJpbmddOiBhbnl9fG51bGwpIHtcbiAgICBlZmZlY3QuY2xhc3NlcyAmJlxuICAgICAgICBhcHBseUNsYXNzQ2hhbmdlcyh0aGlzLl9lbGVtZW50LCBlZmZlY3QuY2xhc3NlcywgcmV2ZXJ0LCB0aGlzLl9jb2xsZWN0ZWRDbGFzc2VzKTtcbiAgICBlZmZlY3Quc3R5bGVzICYmXG4gICAgICAgIGFwcGx5U3R5bGVDaGFuZ2VzKFxuICAgICAgICAgICAgdGhpcy5fZWxlbWVudCwgZWZmZWN0LnN0eWxlcywgbnVsbCwgcmV2ZXJ0LCBwcmVDb21wdXRlZFN0eWxlcywgdGhpcy5fY29sbGVjdGVkU3R5bGVzKTtcbiAgfVxuXG4gIHByaXZhdGUgX3dhaXRGb3JGcmFtZShjYj86ICgpID0+IGFueSkge1xuICAgIGlmICghdGhpcy5fcGVuZGluZ0ZyYW1lKSB7XG4gICAgICB0aGlzLl9wZW5kaW5nRnJhbWUgPSB0cnVlO1xuICAgICAgbGV0IGZsdXNoRm46IEZ1bmN0aW9uO1xuICAgICAgdGhpcy5fcmVuZGVyVXRpbC5maXJlUmVmbG93KHRoaXMuX2VsZW1lbnQsIGZsdXNoRm4gPSAoKSA9PiB7XG4gICAgICAgIHRoaXMuX3BlbmRpbmdGcmFtZSA9IGZhbHNlO1xuICAgICAgICAvLyB0aGlzIGlzIGVhZ2VybHkgYXNzaWduZWQgdG8gYXZvaWQgaGF2aW5nXG4gICAgICAgIC8vIHRoZSBmcmFtZXMgZ3JvdyAodGhvc2UgYXJlIHNjaGVkdWxlZCBsYXRlcilcbiAgICAgICAgY29uc3QgbGVuZ3RoID0gdGhpcy5fd2FpdGluZ0ZvckZyYW1lRm5zLmxlbmd0aDtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgICAgIHRoaXMuX3dhaXRpbmdGb3JGcmFtZUZucy5zaGlmdCgpICEoKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5fd2FpdGluZ0ZvckZyYW1lRm5zLmxlbmd0aCAmJiAhdGhpcy5fcGVuZGluZ0ZyYW1lKSB7XG4gICAgICAgICAgdGhpcy5fcGVuZGluZ0ZyYW1lID0gdHJ1ZTtcbiAgICAgICAgICB0aGlzLl9yZW5kZXJVdGlsLmZpcmVSZWZsb3codGhpcy5fZWxlbWVudCwgZmx1c2hGbik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy5fcGVuZGluZ0ZyYW1lID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgICBjYiAmJiB0aGlzLl93YWl0aW5nRm9yRnJhbWVGbnMucHVzaChjYik7XG4gIH1cblxuICBwcml2YXRlIF9jb21wdXRlU3R5bGVzKGluc3RydWN0aW9uOiBBbmltYXRpb25JbnN0cnVjdGlvbikge1xuICAgIGNvbnN0IGNvbXB1dGVTdHlsZXMgPSBpbnN0cnVjdGlvbi5jb21wdXRlU3R5bGVzICE7XG4gICAgY29uc3QgZHVyYXRpb24gPSBpbnN0cnVjdGlvbi5lZmZlY3QudGltaW5nLmR1cmF0aW9uO1xuICAgIGNvbnN0IGN1cnJlbnRTdHlsZXM6IHtba2V5OiBzdHJpbmddOiBhbnl9ID0ge307XG4gICAgY29tcHV0ZVN0eWxlcy5mb3JFYWNoKHByb3AgPT4ge1xuICAgICAgY3VycmVudFN0eWxlc1twcm9wXSA9IHRoaXMuX3JlbmRlclV0aWwuZ2V0Q29tcHV0ZWRTdHlsZSh0aGlzLl9lbGVtZW50LCBwcm9wKTtcbiAgICAgIHRoaXMuX2VsZW1lbnQuc3R5bGUucmVtb3ZlUHJvcGVydHkocHJvcCk7XG4gICAgfSk7XG5cbiAgICBjb25zdCBwcm9wVG9CbG9jayA9IGNvbXB1dGVTdHlsZXMubGVuZ3RoID09IDEgPyBjb21wdXRlU3R5bGVzWzBdIDogREVGQVVMVF9UUkFOU0lUSU9OX1BST1A7XG4gICAgY29uc3QgdGltaW5nID0ge2R1cmF0aW9uLCBkZWxheTogLWR1cmF0aW9uLCBlYXNpbmc6IG51bGwsIGZpbGw6IG51bGx9O1xuICAgIGNvbnN0IHRyYW5zaXRpb25QcmVmaXggPVxuICAgICAgICB0aGlzLl9jdXJyZW50VHJhbnNpdGlvblN0ciArICh0aGlzLl9jdXJyZW50VHJhbnNpdGlvblN0ci5sZW5ndGggPyAnLCAnIDogJycpO1xuICAgIGNvbnN0IHRyYW5zaXRpb25TdHIgPSB0cmFuc2l0aW9uUHJlZml4ICsgYnVpbGRUcmFuc2l0aW9uU3RyKHRpbWluZywgcHJvcFRvQmxvY2spO1xuICAgIHRoaXMuX3JlbmRlclV0aWwuc2V0VHJhbnNpdGlvbih0aGlzLl9lbGVtZW50LCB0cmFuc2l0aW9uU3RyKTtcblxuICAgIGNvbnN0IGNvbXB1dGVkU3R5bGVzOiB7W2tleTogc3RyaW5nXTogYW55fSA9IHt9O1xuICAgIGNvbXB1dGVTdHlsZXMuZm9yRWFjaChwcm9wID0+IHtcbiAgICAgIGNvbXB1dGVkU3R5bGVzICFbcHJvcF0gPSB0aGlzLl9yZW5kZXJVdGlsLmdldENvbXB1dGVkU3R5bGUodGhpcy5fZWxlbWVudCwgcHJvcCk7XG4gICAgICB0aGlzLl9lbGVtZW50LnN0eWxlLnNldFByb3BlcnR5KHByb3AsIGN1cnJlbnRTdHlsZXNbcHJvcF0pO1xuICAgIH0pO1xuXG4gICAgdGhpcy5fcmVuZGVyVXRpbC5maXJlUmVmbG93KHRoaXMuX2VsZW1lbnQsIG51bGwpO1xuICAgIHJldHVybiBjb21wdXRlZFN0eWxlcztcbiAgfVxuXG4gIC8qKlxuICAgKiBUaGlzIG1ldGhvZCBpcyByZXNwb25zaWJsZSBmb3IgYXBwbHlpbmcgZWFjaCBzdHlsZXMvY2xhc3MgZWZmZWN0XG4gICAqIG9udG8gdGhlIGVsZW1lbnQgd2l0aCBpdHMgYXNzb2NpYXRlZCB0cmFuc2l0aW9uIHRpbWluZyBzdHJpbmcuXG4gICAqXG4gICAqIFRoZSBtYWluIHBvaW50IHRvIHRha2UgZnJvbSB0aGlzIGlzIHRoYXQgZWFjaCBlZmZlY3QgTVVTVCBiZSBhcHBsaWVkXG4gICAqIGluIGJldHdlZW4gcmVmbG93cyBzbyB0aGF0IHRoZSBicm93c2VyIGNhbiBraWNrIG9mZiBlYWNoIHN0eWxlL2NsYXNzXG4gICAqIHJlbmRlcmluZy4gT3RoZXJ3aXNlIGlmIGV2ZXJ5dGhpbmcgaXMgYXBwbGllZCBhdCBvbmNlIHN5bmNocm9ub3VzbHlcbiAgICogdGhlbiBlYWNoIHN1YnNlcXVlbnQgY2xhc3Mvc3R5bGUgZWZmZWN0IHdvdWxkIGJlIGFuaW1hdGVkIGFmdGVyIHRoZVxuICAgKiBsYXN0IHRyYW5zaXRpb24gc3R5bGUgaXMgYXBwbGllZC5cbiAgICpcbiAgICogSXQncyBwcmV0dHkgdW5jb21tb24gdGhhdCBtdWx0aXBsZSBjbGFzc2VzL3N0eWxlcyBhcmUgYXBwbGllZCB3aXRoXG4gICAqIGRpZmZlcmVudCB0cmFuc2l0aW9uIHRpbWluZyB2YWx1ZXMuIFRoZXJlZm9yZSBpdCdzIG9ubHkgd2hlbiB0aGlzXG4gICAqIG9jY3VycyB0aGF0IHJlZmxvd3MgKyByZXF1ZXN0QW5pbWF0aW9uRnJhbWUgY2FsbHMgYXJlIHVzZWQuXG4gICAqL1xuICBwcml2YXRlIF9mbHVzaE5leHRFZmZlY3QoKSB7XG4gICAgdGhpcy5zdGF0ZSA9IEFuaW1hdG9yU3RhdGUuUHJvY2Vzc2luZ0VmZmVjdHM7XG4gICAgbGV0IGRvSXNzdWVSZWZsb3cgPSBmYWxzZTtcblxuICAgIGlmICh0aGlzLl9wZW5kaW5nSW5zdHJ1Y3Rpb25zLmxlbmd0aCkge1xuICAgICAgY29uc3QgaW5zdHJ1Y3Rpb24gPSB0aGlzLl9wZW5kaW5nSW5zdHJ1Y3Rpb25zLnNoaWZ0KCkgITtcbiAgICAgIGlmIChpbnN0cnVjdGlvbi50eXBlID09PSBJbnN0cnVjdGlvblR5cGUuU25hcHNob3QpIHtcbiAgICAgICAgY29uc3Qgc3R5bGVzVG9Db21wdXRlID0gKGluc3RydWN0aW9uIGFzIFNuYXBzaG90SW5zdHJ1Y3Rpb24pLmNvbXB1dGVTdHlsZXM7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc3R5bGVzVG9Db21wdXRlLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgY29uc3QgcHJvcCA9IHN0eWxlc1RvQ29tcHV0ZVtpXTtcbiAgICAgICAgICBsZXQgdmFsdWUgPSByZWFkU3R5bGUodGhpcy5fZWxlbWVudCwgcHJvcCk7XG4gICAgICAgICAgaWYgKCF2YWx1ZSkge1xuICAgICAgICAgICAgdmFsdWUgPSB0aGlzLl9yZW5kZXJVdGlsLmdldENvbXB1dGVkU3R5bGUodGhpcy5fZWxlbWVudCwgcHJvcCk7XG4gICAgICAgICAgICBhcHBseVN0eWxlKHRoaXMuX2VsZW1lbnQsIHByb3AsIHZhbHVlKTtcbiAgICAgICAgICAgIGRvSXNzdWVSZWZsb3cgPSB0cnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoZG9Jc3N1ZVJlZmxvdykge1xuICAgICAgICAgIC8vIGlmIGFsbCBjb21wdXRlZCBzdHlsZXMgd2VyZSBkZXRlY3RlZCBkaXJlY3RseSBvbiB0aGUgZWxlbWVudFxuICAgICAgICAgIC8vIHRoZW4gdGhlcmUgaXMgbm8gbmVlZCB0byB0cmlnZ2VyIGEgcmVmbG93IHRvIHJ1biBzaW5jZSB0aGVyZVxuICAgICAgICAgIC8vIHdhcyBubyBzdHlsZSBjb21wdXRhdGlvbi4gVGhpcyBtZWFucyB0aGUgbmV4dCBpbnN0cnVjdGlvbiBjYW5cbiAgICAgICAgICAvLyBpbW1lZGlhdGVseSB0YWtlIHBsYWNlLlxuICAgICAgICAgIHRoaXMuX2FwcGx5VHJhbnNpdGlvbihpbnN0cnVjdGlvbi50cmFuc2l0aW9uU3R5bGUpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKGluc3RydWN0aW9uLnR5cGUgPT09IEluc3RydWN0aW9uVHlwZS5BbmltYXRpb24pIHtcbiAgICAgICAgY29uc3QgYW5pbWF0aW9uSW5zdHJ1Y3Rpb24gPSBpbnN0cnVjdGlvbiBhcyBBbmltYXRpb25JbnN0cnVjdGlvbjtcbiAgICAgICAgY29uc3QgY29tcHV0ZWRTdHlsZXMgPVxuICAgICAgICAgICAgYW5pbWF0aW9uSW5zdHJ1Y3Rpb24uY29tcHV0ZVN0eWxlcyA/IHRoaXMuX2NvbXB1dGVTdHlsZXMoYW5pbWF0aW9uSW5zdHJ1Y3Rpb24pIDogbnVsbDtcbiAgICAgICAgaWYgKGNvbXB1dGVkU3R5bGVzIHx8IGFuaW1hdGlvbkluc3RydWN0aW9uLnRyYW5zaXRpb25TdHlsZSAhPSB0aGlzLl9sYXN0VHJhbnNpdGlvblRva2VuKSB7XG4gICAgICAgICAgdGhpcy5fYXBwbHlUcmFuc2l0aW9uKGFuaW1hdGlvbkluc3RydWN0aW9uLnRyYW5zaXRpb25TdHlsZSk7XG4gICAgICAgICAgaWYgKGNvbXB1dGVkU3R5bGVzKSB7XG4gICAgICAgICAgICB0aGlzLl9hY3RpdmVDb21wdXRlZFN0eWxlcyA9XG4gICAgICAgICAgICAgICAgT2JqZWN0LmFzc2lnbih0aGlzLl9hY3RpdmVDb21wdXRlZFN0eWxlcyB8fCB7fSwgY29tcHV0ZWRTdHlsZXMpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9hcHBseVN0eWxpbmcoYW5pbWF0aW9uSW5zdHJ1Y3Rpb24sIGZhbHNlLCBjb21wdXRlZFN0eWxlcyk7XG4gICAgICAgIHRoaXMuX2FjdGl2ZUFuaW1hdGlvbkluc3RydWN0aW9ucy5wdXNoKGFuaW1hdGlvbkluc3RydWN0aW9uKTtcbiAgICAgICAgZG9Jc3N1ZVJlZmxvdyA9IGFuaW1hdGlvbkluc3RydWN0aW9uLmlzUHJvcE11bHRpVHJhbnNpdGlvbjtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBhbGwgdGhlIGVmZmVjdHMgaGF2ZSBiZWVuIGFwcGxpZWQgLi4uIE5vdyBzZXQgdGhlIGVsZW1lbnRcbiAgICAvLyBpbnRvIHBsYWNlIHNvIHRoYXQgYSBmb2xsb3ctdXAgdHJhbnNpdGlvbiBjYW4gYmUgYXBwbGllZFxuICAgIGlmICh0aGlzLl9wZW5kaW5nSW5zdHJ1Y3Rpb25zLmxlbmd0aCkge1xuICAgICAgaWYgKGRvSXNzdWVSZWZsb3cpIHtcbiAgICAgICAgdGhpcy5fcmVuZGVyVXRpbC5maXJlUmVmbG93KHRoaXMuX2VsZW1lbnQsICgpID0+IHRoaXMuX2ZsdXNoTmV4dEVmZmVjdCgpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuX2ZsdXNoTmV4dEVmZmVjdCgpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnN0YXRlID0gQW5pbWF0b3JTdGF0ZS5SdW5uaW5nO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgX2FwcGx5VHJhbnNpdGlvbih0cmFuc2l0aW9uVG9rZW46IHN0cmluZykge1xuICAgIHRoaXMuX2xhc3RUcmFuc2l0aW9uVG9rZW4gPSB0cmFuc2l0aW9uVG9rZW47XG4gICAgY29uc3QgdHJhbnNpdGlvblByZWZpeCA9XG4gICAgICAgIHRoaXMuX2N1cnJlbnRUcmFuc2l0aW9uU3RyICsgKHRoaXMuX2N1cnJlbnRUcmFuc2l0aW9uU3RyLmxlbmd0aCA/ICcsICcgOiAnJyk7XG4gICAgdGhpcy5fY3VycmVudFRyYW5zaXRpb25TdHIgPSB0cmFuc2l0aW9uUHJlZml4ICsgdHJhbnNpdGlvblRva2VuO1xuICAgIHRoaXMuX3JlbmRlclV0aWwuc2V0VHJhbnNpdGlvbih0aGlzLl9lbGVtZW50LCB0aGlzLl9jdXJyZW50VHJhbnNpdGlvblN0cik7XG4gIH1cblxuICBwcml2YXRlIF91cGRhdGVUaW1lcigpIHtcbiAgICAvLyBTb21ldGltZXMgYSB0cmFuc2l0aW9uIGFuaW1hdGlvbiBtYXkgbm90IGFuaW1hdGUgYW55dGhpbmcgYXQgYWxsXG4gICAgLy8gZHVlIHRvIG1pc3NpbmcgY2xhc3NlcyBvciB0aGVyZSBiZWluZyB6ZXJvIGNoYW5nZSBpbiBzdHlsaW5nIChcbiAgICAvLyB0aGUgZWxlbWVudCBhbHJlYWR5IGhhcyB0aGUgc2FtZSBzdHlsaW5nIHRoYXQgaXMgYmVpbmcgYW5pbWF0ZWQpLlxuICAgIC8vIFRoZXJlIGlzIG5vIHdheSBmb3IgSlMgY29kZSB0byBkZXRlY3QgZm9yIHRoaXMgYW5kIHRoZSBPTkxZIHdheVxuICAgIC8vIHRvIGdhdXJhbnRlZSB0aGF0IHRoZSBwbGF5ZXIgZmluaXNoZXMgaXMgdG8gc2V0dXAgYSB0aW1lciB0aGF0IGFjdHNcbiAgICAvLyBhcyBhIGZhbGxiYWNrIGluY2FzZSB0aGlzIGhhcHBlbnMuIFRoZSByZWFzb24gd2F5IHRoZSB2YXJpYWJsZSBiZWxvd1xuICAgIC8vIGhhcyBhbiBleHRyYSBidWZmZXIgdmFsdWUgaXMgYmVjYXVzZSB0aGUgYnJvd3NlciB1c3VhbGx5IGlzbid0IHF1aWNrXG4gICAgLy8gZW5vdWdoIHRvIHRyaWdnZXIgYSB0cmFuc2l0aW9uIGFuZCBmaXJlIHRoZSBlbmRpbmcgY2FsbGJhY2sgaW4gdGhlXG4gICAgLy8gZXhhY3QgYW1vdW50IG9mIHRpbWUgdGhhdCB0aGUgdHJhbnNpdGlvbiBsYXN0cyBmb3IgKHRoZXJlZm9yZSB0aGVcbiAgICAvLyBidWZmZXIgYWxsb3dzIGZvciB0aGUgYW5pbWF0aW9uIHRvIHByb3Blcmx5IGRvIGl0cyBqb2IgaW4gdGltZSkuXG4gICAgaWYgKHRoaXMuX3RpbWVyKSB7XG4gICAgICB0aGlzLl9yZW5kZXJVdGlsID8gdGhpcy5fcmVuZGVyVXRpbC5jbGVhclRpbWVvdXQodGhpcy5fdGltZXIpIDogY2xlYXJUaW1lb3V0KHRoaXMuX3RpbWVyKTtcbiAgICB9XG5cbiAgICBjb25zdCBIQUxGX0FfU0VDT05EID0gNTAwO1xuICAgIGNvbnN0IG1heFRpbWVXaXRoQnVmZmVyID0gdGhpcy5fbWF4VGltZSArIEhBTEZfQV9TRUNPTkQ7XG4gICAgY29uc3QgY2IgPSAoKSA9PiB0aGlzLl9vbkFsbEVmZmVjdHNGaW5pc2hlZCgpO1xuICAgIHRoaXMuX3RpbWVyID0gdGhpcy5fcmVuZGVyVXRpbCA/IHRoaXMuX3JlbmRlclV0aWwuc2V0VGltZW91dChjYiwgbWF4VGltZVdpdGhCdWZmZXIpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGNiLCBtYXhUaW1lV2l0aEJ1ZmZlcik7XG4gIH1cblxuICBwcml2YXRlIF9vbkFsbEVmZmVjdHNGaW5pc2hlZCgpIHtcbiAgICBpZiAodGhpcy5zdGF0ZSA+PSBBbmltYXRvclN0YXRlLlJ1bm5pbmcgJiYgdGhpcy5zdGF0ZSA8PSBBbmltYXRvclN0YXRlLkV4aXRpbmcpIHtcbiAgICAgIGlmICh0aGlzLl9hY3RpdmVDb21wdXRlZFN0eWxlcykge1xuICAgICAgICB0aGlzLl9jbGVhbnVwQ29tcHV0ZWRTdHlsZXMoT2JqZWN0LmtleXModGhpcy5fYWN0aXZlQ29tcHV0ZWRTdHlsZXMpKTtcbiAgICAgICAgdGhpcy5fYWN0aXZlQ29tcHV0ZWRTdHlsZXMgPSBudWxsO1xuICAgICAgfVxuICAgICAgdGhpcy5fbWF4VGltZSA9IDA7XG4gICAgICB0aGlzLl9jdXJyZW50VHJhbnNpdGlvblN0ciA9ICcnO1xuICAgICAgdGhpcy5fbGFzdFRyYW5zaXRpb25Ub2tlbiA9ICcnO1xuICAgICAgdGhpcy5fYWN0aXZlQW5pbWF0aW9uSW5zdHJ1Y3Rpb25zLmxlbmd0aCA9IDA7XG4gICAgICB0aGlzLl9yZW5kZXJVdGlsLnNldFRyYW5zaXRpb24odGhpcy5fZWxlbWVudCwgbnVsbCk7XG4gICAgICB0aGlzLnN0YXRlID0gQW5pbWF0b3JTdGF0ZS5JZGxlO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLl9saXN0ZW5lcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdGhpcy5fbGlzdGVuZXJzW2ldKCk7XG4gICAgICB9XG4gICAgICB0aGlzLl9saXN0ZW5lcnMubGVuZ3RoID0gMDtcbiAgICB9XG4gIH1cblxuICBzY2hlZHVsZUZsdXNoKCkge1xuICAgIGlmICh0aGlzLnN0YXRlICE9PSBBbmltYXRvclN0YXRlLldhaXRpbmdGb3JGbHVzaCkge1xuICAgICAgdGhpcy5fd2FpdEZvckZyYW1lKCgpID0+IHRoaXMuZmx1c2hFZmZlY3RzKCkpO1xuICAgIH1cbiAgfVxuXG4gIGZsdXNoRWZmZWN0cygpOiBib29sZWFuIHtcbiAgICBpZiAodGhpcy5zdGF0ZSAhPT0gQW5pbWF0b3JTdGF0ZS5Qcm9jZXNzaW5nRWZmZWN0cyAmJiB0aGlzLl9wZW5kaW5nSW5zdHJ1Y3Rpb25zLmxlbmd0aCkge1xuICAgICAgdGhpcy5fc3RhcnRUaW1lID0gbm93KCk7XG4gICAgICB0aGlzLl9mbHVzaE5leHRFZmZlY3QoKTtcbiAgICAgIHRoaXMuX3VwZGF0ZVRpbWVyKCk7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgZmluaXNoQWxsKCkge1xuICAgIHRoaXMuX3JlbmRlclV0aWwuc2V0VHJhbnNpdGlvbih0aGlzLl9lbGVtZW50LCBDQU5DRUxfQUxMX1RSQU5TSVRJT05TX1ZBTFVFKTtcbiAgICB0aGlzLnN0YXRlID0gQW5pbWF0b3JTdGF0ZS5FeGl0aW5nO1xuICAgIHRoaXMuX3JlbmRlclV0aWwuZmlyZVJlZmxvdyh0aGlzLl9lbGVtZW50LCAoKSA9PiB0aGlzLl9vbkFsbEVmZmVjdHNGaW5pc2hlZCgpKTtcbiAgfVxuXG4gIGRlc3Ryb3koKSB7XG4gICAgaWYgKHRoaXMuc3RhdGUgPCBBbmltYXRvclN0YXRlLkV4aXRpbmcpIHtcbiAgICAgIHRoaXMuc3RhdGUgPSBBbmltYXRvclN0YXRlLkV4aXRpbmc7XG4gICAgICB0aGlzLl9yZW5kZXJVdGlsLnNldFRyYW5zaXRpb24odGhpcy5fZWxlbWVudCwgQ0FOQ0VMX0FMTF9UUkFOU0lUSU9OU19WQUxVRSk7XG4gICAgICB0aGlzLl9lbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RyYW5zaXRpb25lbmQnLCB0aGlzLl9jYXB0dXJlRm4pO1xuXG4gICAgICB0aGlzLl9yZW5kZXJVdGlsLmZpcmVSZWZsb3codGhpcy5fZWxlbWVudCwgKCkgPT4ge1xuICAgICAgICB0aGlzLl9vbkFsbEVmZmVjdHNGaW5pc2hlZCgpO1xuICAgICAgICB0aGlzLnN0YXRlID0gQW5pbWF0b3JTdGF0ZS5EZXN0cm95ZWQ7XG4gICAgICAgIHRoaXMuX2NvbGxlY3RlZENsYXNzZXMgJiYgYXBwbHlDbGFzc0NoYW5nZXModGhpcy5fZWxlbWVudCwgdGhpcy5fY29sbGVjdGVkQ2xhc3NlcywgdHJ1ZSk7XG4gICAgICAgIHRoaXMuX2NvbGxlY3RlZFN0eWxlcyAmJlxuICAgICAgICAgICAgYXBwbHlTdHlsZUNoYW5nZXModGhpcy5fZWxlbWVudCwgdGhpcy5fY29sbGVjdGVkU3R5bGVzLCBudWxsLCB0cnVlLCBudWxsKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBidWlsZFRyYW5zaXRpb25TdHIodGltaW5nOiBUaW1pbmcsIHByb3BzOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gYCR7dGltaW5nLmR1cmF0aW9ufW1zICR7cHJvcHN9ICR7dGltaW5nLmRlbGF5fW1zJHt0aW1pbmcuZWFzaW5nID8gKCcgJyArIHRpbWluZy5lYXNpbmcpIDogJyd9YDtcbn1cblxuZnVuY3Rpb24gZGV0ZXJtaW5lV2hldGhlclRvQ29tcHV0ZShwcm9wOiBzdHJpbmcsIHZhbHVlOiBzdHJpbmcpOiAtMXwwfDEge1xuICBpZiAodmFsdWUgPT09IEFVVE9fU1RZTEUpIHJldHVybiAxO1xuICBzd2l0Y2ggKHByb3ApIHtcbiAgICBjYXNlICd3aWR0aCc6XG4gICAgY2FzZSAnaGVpZ2h0JzpcbiAgICAgIHJldHVybiB2YWx1ZSA/IC0xIDogMTtcbiAgfVxuICByZXR1cm4gMDtcbn1cblxuZnVuY3Rpb24gZmluZE1hdGNoaW5nRWZmZWN0KGluc3RydWN0aW9uczogQW5pbWF0aW9uSW5zdHJ1Y3Rpb25bXSwgZWZmZWN0OiBTdHlsaW5nRWZmZWN0KTogbnVtYmVyIHtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBpbnN0cnVjdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICBpZiAoaW5zdHJ1Y3Rpb25zW2ldLmVmZmVjdCA9PT0gZWZmZWN0KSByZXR1cm4gaTtcbiAgfVxuICByZXR1cm4gLTE7XG59XG4iXX0=