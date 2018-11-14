/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Observable } from 'rxjs';
import { PlayState, Player } from '../interfaces/player';
import { Animator, Timing } from './interfaces';
export declare class StylingPlayer implements Player {
    element: HTMLElement;
    private _animator;
    parent: Player | null;
    state: PlayState;
    private _subject;
    private _effect;
    constructor(element: HTMLElement, _animator: Animator, timing: Timing, classes: {
        [key: string]: any;
    } | null, styles: {
        [key: string]: any;
    } | null);
    getStatus(): Observable<PlayState | string>;
    private _emit;
    play(): void;
    pause(): void;
    finish(): void;
    private _onFinish;
    destroy(replacementPlayer?: Player | null): void;
}
