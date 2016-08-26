/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { scheduleMicroTask } from '../facade/lang';
/**
 * @experimental Animation support is experimental.
 */
export class AnimationPlayer {
    get parentPlayer() { throw new Error('NOT IMPLEMENTED: Base Class'); }
    set parentPlayer(player) { throw new Error('NOT IMPLEMENTED: Base Class'); }
}
export class NoOpAnimationPlayer {
    constructor() {
        this._onDoneFns = [];
        this._onStartFns = [];
        this._started = false;
        this.parentPlayer = null;
        scheduleMicroTask(() => this._onFinish());
    }
    /** @internal */
    _onFinish() {
        this._onDoneFns.forEach(fn => fn());
        this._onDoneFns = [];
    }
    onStart(fn) { this._onStartFns.push(fn); }
    onDone(fn) { this._onDoneFns.push(fn); }
    hasStarted() { return this._started; }
    init() { }
    play() {
        if (!this.hasStarted()) {
            this._onStartFns.forEach(fn => fn());
            this._onStartFns = [];
        }
        this._started = true;
    }
    pause() { }
    restart() { }
    finish() { this._onFinish(); }
    destroy() { }
    reset() { }
    setPosition(p /** TODO #9100 */) { }
    getPosition() { return 0; }
}
//# sourceMappingURL=animation_player.js.map