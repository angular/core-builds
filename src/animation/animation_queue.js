import { Injectable } from '../di/metadata';
import { NgZone } from '../zone/ng_zone';
export class AnimationQueue {
    /**
     * @param {?} _zone
     */
    constructor(_zone) {
        this._zone = _zone;
        this.entries = [];
    }
    /**
     * @param {?} player
     * @return {?}
     */
    enqueue(player) { this.entries.push(player); }
    /**
     * @return {?}
     */
    flush() {
        // given that each animation player may set aside
        // microtasks and rely on DOM-based events, this
        // will cause Angular to run change detection after
        // each request. This sidesteps the issue. If a user
        // hooks into an animation via (@anim.start) or (@anim.done)
        // then those methods will automatically trigger change
        // detection by wrapping themselves inside of a zone
        if (this.entries.length) {
            this._zone.runOutsideAngular(() => {
                // this code is wrapped into a single promise such that the
                // onStart and onDone player callbacks are triggered outside
                // of the digest cycle of animations
                Promise.resolve(null).then(() => this._triggerAnimations());
            });
        }
    }
    /**
     * @return {?}
     */
    _triggerAnimations() {
        NgZone.assertNotInAngularZone();
        while (this.entries.length) {
            const /** @type {?} */ player = this.entries.shift();
            // in the event that an animation throws an error then we do
            // not want to re-run animations on any previous animations
            // if they have already been kicked off beforehand
            if (!player.hasStarted()) {
                player.play();
            }
        }
    }
}
AnimationQueue.decorators = [
    { type: Injectable },
];
/** @nocollapse */
AnimationQueue.ctorParameters = () => [
    { type: NgZone, },
];
function AnimationQueue_tsickle_Closure_declarations() {
    /** @type {?} */
    AnimationQueue.decorators;
    /**
     * @nocollapse
     * @type {?}
     */
    AnimationQueue.ctorParameters;
    /** @type {?} */
    AnimationQueue.prototype.entries;
    /** @type {?} */
    AnimationQueue.prototype._zone;
}
//# sourceMappingURL=animation_queue.js.map