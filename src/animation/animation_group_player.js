/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { isPresent, scheduleMicroTask } from '../facade/lang';
export class AnimationGroupPlayer {
    /**
     * @param {?} _players
     */
    constructor(_players) {
        this._players = _players;
        this._onDoneFns = [];
        this._onStartFns = [];
        this._finished = false;
        this._started = false;
        this._destroyed = false;
        this.parentPlayer = null;
        let count = 0;
        const total = this._players.length;
        if (total == 0) {
            scheduleMicroTask(() => this._onFinish());
        }
        else {
            this._players.forEach(player => {
                player.parentPlayer = this;
                player.onDone(() => {
                    if (++count >= total) {
                        this._onFinish();
                    }
                });
            });
        }
    }
    /**
     * @return {?}
     */
    _onFinish() {
        if (!this._finished) {
            this._finished = true;
            this._onDoneFns.forEach(fn => fn());
            this._onDoneFns = [];
        }
    }
    /**
     * @return {?}
     */
    init() { this._players.forEach(player => player.init()); }
    /**
     * @param {?} fn
     * @return {?}
     */
    onStart(fn) { this._onStartFns.push(fn); }
    /**
     * @param {?} fn
     * @return {?}
     */
    onDone(fn) { this._onDoneFns.push(fn); }
    /**
     * @return {?}
     */
    hasStarted() { return this._started; }
    /**
     * @return {?}
     */
    play() {
        if (!isPresent(this.parentPlayer)) {
            this.init();
        }
        if (!this.hasStarted()) {
            this._onStartFns.forEach(fn => fn());
            this._onStartFns = [];
            this._started = true;
        }
        this._players.forEach(player => player.play());
    }
    /**
     * @return {?}
     */
    pause() { this._players.forEach(player => player.pause()); }
    /**
     * @return {?}
     */
    restart() { this._players.forEach(player => player.restart()); }
    /**
     * @return {?}
     */
    finish() {
        this._onFinish();
        this._players.forEach(player => player.finish());
    }
    /**
     * @return {?}
     */
    destroy() {
        if (!this._destroyed) {
            this._onFinish();
            this._players.forEach(player => player.destroy());
            this._destroyed = true;
        }
    }
    /**
     * @return {?}
     */
    reset() {
        this._players.forEach(player => player.reset());
        this._destroyed = false;
        this._finished = false;
        this._started = false;
    }
    /**
     * @param {?} p
     * @return {?}
     */
    setPosition(p) {
        this._players.forEach(player => { player.setPosition(p); });
    }
    /**
     * @return {?}
     */
    getPosition() {
        let /** @type {?} */ min = 0;
        this._players.forEach(player => {
            const /** @type {?} */ p = player.getPosition();
            min = Math.min(p, min);
        });
        return min;
    }
    /**
     * @return {?}
     */
    get players() { return this._players; }
}
function AnimationGroupPlayer_tsickle_Closure_declarations() {
    /** @type {?} */
    AnimationGroupPlayer.prototype._onDoneFns;
    /** @type {?} */
    AnimationGroupPlayer.prototype._onStartFns;
    /** @type {?} */
    AnimationGroupPlayer.prototype._finished;
    /** @type {?} */
    AnimationGroupPlayer.prototype._started;
    /** @type {?} */
    AnimationGroupPlayer.prototype._destroyed;
    /** @type {?} */
    AnimationGroupPlayer.prototype.parentPlayer;
    /** @type {?} */
    AnimationGroupPlayer.prototype._players;
}
//# sourceMappingURL=animation_group_player.js.map