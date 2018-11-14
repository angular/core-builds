/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 * @record
 */
export function Timing() { }
/** @type {?} */
Timing.prototype.duration;
/** @type {?} */
Timing.prototype.delay;
/** @type {?} */
Timing.prototype.easing;
/** @type {?} */
Timing.prototype.fill;
/**
 * @record
 */
export function StylingEffect() { }
/** @type {?} */
StylingEffect.prototype.timing;
/** @type {?} */
StylingEffect.prototype.classes;
/** @type {?} */
StylingEffect.prototype.styles;
/** @enum {number} */
var AnimatorState = {
    Idle: 1,
    WaitingForFlush: 2,
    ProcessingEffects: 3,
    Running: 4,
    Exiting: 5,
    Destroyed: 6,
};
export { AnimatorState };
/**
 * @record
 */
export function Animator() { }
/** @type {?} */
Animator.prototype.state;
/** @type {?} */
Animator.prototype.addEffect;
/** @type {?} */
Animator.prototype.finishEffect;
/** @type {?} */
Animator.prototype.finishAll;
/** @type {?} */
Animator.prototype.destroyEffect;
/** @type {?} */
Animator.prototype.scheduleFlush;
/** @type {?} */
Animator.prototype.flushEffects;
/** @type {?} */
Animator.prototype.destroy;
/** @type {?} */
Animator.prototype.onAllEffectsDone;
/**
 * Used to intercept all rendering-related operations
 * that occur in the animator (this is designed for
 * testing purposes).
 * @record
 */
export function RenderUtil() { }
/** @type {?} */
RenderUtil.prototype.getComputedStyle;
/** @type {?} */
RenderUtil.prototype.fireReflow;
/** @type {?} */
RenderUtil.prototype.setTimeout;
/** @type {?} */
RenderUtil.prototype.clearTimeout;
/** @type {?} */
RenderUtil.prototype.setTransition;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW50ZXJmYWNlcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvYW5pbWF0aW9ucy9pbnRlcmZhY2VzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQXFCRSxPQUFRO0lBQ1Isa0JBQW1CO0lBQ25CLG9CQUFxQjtJQUNyQixVQUFXO0lBQ1gsVUFBVztJQUNYLFlBQWEiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5leHBvcnQgaW50ZXJmYWNlIFRpbWluZyB7XG4gIGR1cmF0aW9uOiBudW1iZXI7XG4gIGRlbGF5OiBudW1iZXI7XG4gIGVhc2luZzogc3RyaW5nfG51bGw7XG4gIGZpbGw6IEZpbGxNb2RlfG51bGw7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgU3R5bGluZ0VmZmVjdCB7XG4gIHRpbWluZzogVGltaW5nO1xuICBjbGFzc2VzOiB7W2NsYXNzTmFtZTogc3RyaW5nXTogYm9vbGVhbn18bnVsbDtcbiAgc3R5bGVzOiB7W2tleTogc3RyaW5nXTogYW55fXxudWxsO1xufVxuXG5leHBvcnQgY29uc3QgZW51bSBBbmltYXRvclN0YXRlIHtcbiAgSWRsZSA9IDEsXG4gIFdhaXRpbmdGb3JGbHVzaCA9IDIsXG4gIFByb2Nlc3NpbmdFZmZlY3RzID0gMyxcbiAgUnVubmluZyA9IDQsXG4gIEV4aXRpbmcgPSA1LFxuICBEZXN0cm95ZWQgPSA2LFxufVxuXG5leHBvcnQgaW50ZXJmYWNlIEFuaW1hdG9yIHtcbiAgc3RhdGU6IEFuaW1hdG9yU3RhdGU7XG4gIGFkZEVmZmVjdChlZmZlY3Q6IFN0eWxpbmdFZmZlY3QpOiB2b2lkO1xuICBmaW5pc2hFZmZlY3QoZWZmZWN0OiBTdHlsaW5nRWZmZWN0KTogdm9pZDtcbiAgZmluaXNoQWxsKCk6IHZvaWQ7XG4gIGRlc3Ryb3lFZmZlY3QoZWZmZWN0OiBTdHlsaW5nRWZmZWN0KTogdm9pZDtcbiAgc2NoZWR1bGVGbHVzaCgpOiB2b2lkO1xuICBmbHVzaEVmZmVjdHMoKTogYm9vbGVhbjtcbiAgZGVzdHJveSgpOiB2b2lkO1xuICBvbkFsbEVmZmVjdHNEb25lKGNiOiAoKSA9PiBhbnkpOiB2b2lkO1xufVxuXG4vKipcbiAqIFVzZWQgdG8gaW50ZXJjZXB0IGFsbCByZW5kZXJpbmctcmVsYXRlZCBvcGVyYXRpb25zXG4gKiB0aGF0IG9jY3VyIGluIHRoZSBhbmltYXRvciAodGhpcyBpcyBkZXNpZ25lZCBmb3JcbiAqIHRlc3RpbmcgcHVycG9zZXMpLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIFJlbmRlclV0aWwge1xuICBnZXRDb21wdXRlZFN0eWxlKGVsZW1lbnQ6IEhUTUxFbGVtZW50LCBwcm9wOiBzdHJpbmcpOiBzdHJpbmc7XG4gIGZpcmVSZWZsb3coZWxlbWVudDogSFRNTEVsZW1lbnQsIGZyYW1lQ2FsbGJhY2s/OiBGdW5jdGlvbnxudWxsKTogdm9pZDtcbiAgc2V0VGltZW91dChmbjogRnVuY3Rpb24sIHRpbWU6IG51bWJlcik6IGFueTtcbiAgY2xlYXJUaW1lb3V0KHRpbWVvdXRWYWw6IGFueSk6IHZvaWQ7XG4gIHNldFRyYW5zaXRpb24oZWxlbWVudDogSFRNTEVsZW1lbnQsIHZhbHVlOiBzdHJpbmd8bnVsbCk6IHZvaWQ7XG59XG5cbmV4cG9ydCBkZWNsYXJlIHR5cGUgRmlsbE1vZGUgPSAnZm9yd2FyZHMnIHwgJ2JhY2t3YXJkcycgfCAnYm90aCc7Il19