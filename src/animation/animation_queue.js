/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Injectable } from '../di/metadata';
import { NgZone } from '../zone/ng_zone';
var AnimationQueue = (function () {
    /**
     * @param {?} _zone
     */
    function AnimationQueue(_zone) {
        this._zone = _zone;
        this.entries = [];
    }
    /**
     * @param {?} player
     * @return {?}
     */
    AnimationQueue.prototype.enqueue = function (player) { this.entries.push(player); };
    /**
     * @return {?}
     */
    AnimationQueue.prototype.flush = function () {
        var _this = this;
        // given that each animation player may set aside
        // microtasks and rely on DOM-based events, this
        // will cause Angular to run change detection after
        // each request. This sidesteps the issue. If a user
        // hooks into an animation via (@anim.start) or (@anim.done)
        // then those methods will automatically trigger change
        // detection by wrapping themselves inside of a zone
        if (this.entries.length) {
            this._zone.runOutsideAngular(function () {
                // this code is wrapped into a single promise such that the
                // onStart and onDone player callbacks are triggered outside
                // of the digest cycle of animations
                Promise.resolve(null).then(function () { return _this._triggerAnimations(); });
            });
        }
    };
    /**
     * @return {?}
     */
    AnimationQueue.prototype._triggerAnimations = function () {
        NgZone.assertNotInAngularZone();
        while (this.entries.length) {
            var /** @type {?} */ player = this.entries.shift();
            // in the event that an animation throws an error then we do
            // not want to re-run animations on any previous animations
            // if they have already been kicked off beforehand
            if (!player.hasStarted()) {
                player.play();
            }
        }
    };
    return AnimationQueue;
}());
export { AnimationQueue };
AnimationQueue.decorators = [
    { type: Injectable },
];
/** @nocollapse */
AnimationQueue.ctorParameters = function () { return [
    { type: NgZone, },
]; };
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