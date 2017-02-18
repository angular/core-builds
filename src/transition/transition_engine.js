/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { NoOpAnimationPlayer } from '../animation/animation_player';
/**
 * \@experimental Transition support is experimental.
 * @abstract
 */
export class TransitionEngine {
    /**
     * @abstract
     * @param {?} container
     * @param {?} element
     * @return {?}
     */
    insertNode(container, element) { }
    /**
     * @abstract
     * @param {?} element
     * @return {?}
     */
    removeNode(element) { }
    /**
     * @abstract
     * @param {?} element
     * @param {?} instructions
     * @return {?}
     */
    process(element, instructions) { }
    /**
     * @abstract
     * @return {?}
     */
    triggerAnimations() { }
}
/**
 * \@experimental Transition support is experimental.
 */
export class NoOpTransitionEngine extends TransitionEngine {
    constructor() { super(); }
    /**
     * @param {?} container
     * @param {?} element
     * @return {?}
     */
    insertNode(container, element) { container.appendChild(element); }
    /**
     * @param {?} element
     * @return {?}
     */
    removeNode(element) { remove(element); }
    /**
     * @param {?} element
     * @param {?} instructions
     * @return {?}
     */
    process(element, instructions) {
        return new NoOpAnimationPlayer();
    }
    /**
     * @return {?}
     */
    triggerAnimations() { }
}
/**
 * @param {?} element
 * @return {?}
 */
function remove(element) {
    element.parentNode.removeChild(element);
}
//# sourceMappingURL=transition_engine.js.map