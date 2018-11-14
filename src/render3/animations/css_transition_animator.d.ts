/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Animator, AnimatorState, RenderUtil, StylingEffect } from './interfaces';
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
export declare class CssTransitionAnimator implements Animator {
    private _element;
    private _renderUtil;
    state: AnimatorState;
    private _listeners;
    private _pendingInstructions;
    private _activeAnimationInstructions;
    private _collectedClasses;
    private _collectedStyles;
    private _activeComputedStyles;
    private _captureFn;
    private _startTime;
    private _maxTime;
    private _timer;
    private _currentTransitionStr;
    private _waitingForFrameFns;
    private _lastTransitionToken;
    private _pendingFrame;
    constructor(_element: HTMLElement, _renderUtil: RenderUtil, collectStyling?: boolean);
    onAllEffectsDone(cb: () => any): void;
    addEffect(effect: StylingEffect): void;
    private _computeTransitionTime;
    finishEffect(effect: StylingEffect): void;
    destroyEffect(effect: StylingEffect): void;
    private _finishOrDestroyEffect;
    private _cleanupComputedStyles;
    private _cleanupEffect;
    private _applyStyling;
    private _waitForFrame;
    private _computeStyles;
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
    private _flushNextEffect;
    private _applyTransition;
    private _updateTimer;
    private _onAllEffectsFinished;
    scheduleFlush(): void;
    flushEffects(): boolean;
    finishAll(): void;
    destroy(): void;
}
