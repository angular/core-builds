/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { AUTO_STYLE } from '@angular/core';
export class MockAnimationPlayer {
    constructor(startingStyles = {}, keyframes = [], previousPlayers = []) {
        this.startingStyles = startingStyles;
        this.keyframes = keyframes;
        this._onDoneFns = [];
        this._onStartFns = [];
        this._onDestroyFns = [];
        this._finished = false;
        this._destroyed = false;
        this._started = false;
        this.parentPlayer = null;
        this.previousStyles = {};
        this.log = [];
        previousPlayers.forEach(player => {
            if (player instanceof MockAnimationPlayer) {
                const styles = player._captureStyles();
                Object.keys(styles).forEach(prop => this.previousStyles[prop] = styles[prop]);
            }
        });
    }
    _onFinish() {
        if (!this._finished) {
            this._finished = true;
            this.log.push('finish');
            this._onDoneFns.forEach(fn => fn());
            this._onDoneFns = [];
        }
    }
    init() { this.log.push('init'); }
    onDone(fn) { this._onDoneFns.push(fn); }
    onStart(fn) { this._onStartFns.push(fn); }
    onDestroy(fn) { this._onDestroyFns.push(fn); }
    hasStarted() { return this._started; }
    play() {
        if (!this.hasStarted()) {
            this._onStartFns.forEach(fn => fn());
            this._onStartFns = [];
            this._started = true;
        }
        this.log.push('play');
    }
    pause() { this.log.push('pause'); }
    restart() { this.log.push('restart'); }
    finish() { this._onFinish(); }
    reset() {
        this.log.push('reset');
        this._destroyed = false;
        this._finished = false;
        this._started = false;
    }
    destroy() {
        if (!this._destroyed) {
            this._destroyed = true;
            this.finish();
            this.log.push('destroy');
            this._onDestroyFns.forEach(fn => fn());
            this._onDestroyFns = [];
        }
    }
    setPosition(p) { }
    getPosition() { return 0; }
    _captureStyles() {
        const captures = {};
        if (this.hasStarted()) {
            // when assembling the captured styles, it's important that
            // we build the keyframe styles in the following order:
            // {startingStyles, ... other styles within keyframes, ... previousStyles }
            Object.keys(this.startingStyles).forEach(prop => {
                captures[prop] = this.startingStyles[prop];
            });
            this.keyframes.forEach(kf => {
                const [offset, styles] = kf;
                const newStyles = {};
                Object.keys(styles).forEach(prop => { captures[prop] = this._finished ? styles[prop] : AUTO_STYLE; });
            });
        }
        Object.keys(this.previousStyles).forEach(prop => {
            captures[prop] = this.previousStyles[prop];
        });
        return captures;
    }
}
//# sourceMappingURL=mock_animation_player.js.map