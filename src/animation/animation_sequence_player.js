/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { isPresent, scheduleMicroTask } from '../facade/lang';
import { NoOpAnimationPlayer } from './animation_player';
export class AnimationSequencePlayer {
    /**
     * @param {?} _players
     */
    constructor(_players) {
        this._players = _players;
        this._currentIndex = 0;
        this._onDoneFns = [];
        this._onStartFns = [];
        this._finished = false;
        this._started = false;
        this._destroyed = false;
        this.parentPlayer = null;
        this._players.forEach(player => { player.parentPlayer = this; });
        this._onNext(false);
    }
    /**
     * @param {?} start
     * @return {?}
     */
    _onNext(start) {
        if (this._finished)
            return;
        if (this._players.length == 0) {
            this._activePlayer = new NoOpAnimationPlayer();
            scheduleMicroTask(() => this._onFinish());
        }
        else if (this._currentIndex >= this._players.length) {
            this._activePlayer = new NoOpAnimationPlayer();
            this._onFinish();
        }
        else {
            const /** @type {?} */ player = this._players[this._currentIndex++];
            player.onDone(() => this._onNext(true));
            this._activePlayer = player;
            if (start) {
                player.play();
            }
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
        this._activePlayer.play();
    }
    /**
     * @return {?}
     */
    pause() { this._activePlayer.pause(); }
    /**
     * @return {?}
     */
    restart() {
        this.reset();
        if (this._players.length > 0) {
            this._players[0].restart();
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
            this._activePlayer = new NoOpAnimationPlayer();
        }
    }
    /**
     * @param {?} p
     * @return {?}
     */
    setPosition(p) { this._players[0].setPosition(p); }
    /**
     * @return {?}
     */
    getPosition() { return this._players[0].getPosition(); }
    /**
     * @return {?}
     */
    get players() { return this._players; }
}
function AnimationSequencePlayer_tsickle_Closure_declarations() {
    /** @type {?} */
    AnimationSequencePlayer.prototype._currentIndex;
    /** @type {?} */
    AnimationSequencePlayer.prototype._activePlayer;
    /** @type {?} */
    AnimationSequencePlayer.prototype._onDoneFns;
    /** @type {?} */
    AnimationSequencePlayer.prototype._onStartFns;
    /** @type {?} */
    AnimationSequencePlayer.prototype._finished;
    /** @type {?} */
    AnimationSequencePlayer.prototype._started;
    /** @type {?} */
    AnimationSequencePlayer.prototype._destroyed;
    /** @type {?} */
    AnimationSequencePlayer.prototype.parentPlayer;
    /** @type {?} */
    AnimationSequencePlayer.prototype._players;
}
//# sourceMappingURL=animation_sequence_player.js.map