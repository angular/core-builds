/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { AnimationPlayer } from '../animation/animation_player';
import { TransitionInstruction } from '../triggers';
/**
 * @experimental Transition support is experimental.
 */
export declare abstract class TransitionEngine {
    abstract insertNode(container: any, element: any): void;
    abstract removeNode(element: any): void;
    abstract process(element: any, instructions: TransitionInstruction[]): AnimationPlayer;
    abstract triggerAnimations(): void;
}
/**
 * @experimental Transition support is experimental.
 */
export declare class NoOpTransitionEngine extends TransitionEngine {
    constructor();
    insertNode(container: any, element: any): void;
    removeNode(element: any): void;
    process(element: any, instructions: TransitionInstruction[]): AnimationPlayer;
    triggerAnimations(): void;
}
